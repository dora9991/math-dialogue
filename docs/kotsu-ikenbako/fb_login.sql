-- fb_login.sql — ご意見ばこ：記名のあいだは、ログインしていない送信を受けとらない（{"error":"login"}）。
-- 変えるのは kotsu.fb_send だけ（本番の いまの定義＋ 1か所）。スイッチが切のときは、いままでどおり（ログインなしも匿名で受けとる）。
-- 何度流しても同じ。apply_migration にそのまま渡せる。

create or replace function kotsu.fb_send(p_token text, p_kind text, p_feel integer, p_msg text, p_grade text, p_screen text, p_ver text, p_dev text, p_named boolean default null)
 returns jsonb language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $function$
declare m text; kd text; fl int; g text; dv text; org uuid; uid uuid; named boolean := false; v_id bigint;
begin
  m := btrim(kotsu._clip(coalesce(p_msg, ''), 400));
  kd := case when p_kind in ('idea', 'trouble', 'good', 'bug') then p_kind else 'idea' end;
  fl := case when p_feel between 1 and 3 then p_feel else null end;
  if fl is null and length(m) < 2 then return jsonb_build_object('error', 'empty'); end if;
  if kotsu._looks_private(m) then return jsonb_build_object('error', 'private'); end if;
  g := case when coalesce(p_grade, '') ~ '^(E[1-6]|J[1-3]|H[1-3]|R)$' then p_grade else '' end;
  dv := kotsu._h('fb:' || coalesce(nullif(btrim(p_dev), ''), 'none'));
  -- ログインしている子なら、学校と（スイッチが入っていれば）送り主を調べる
  if p_token is not null and length(p_token) >= 20 then
    select u.org_id, u.id, coalesce(o.fb_named, false) into org, uid, named from kotsu.sessions s
      join kotsu.users u on u.id = s.user_id join kotsu.orgs o on o.id = u.org_id
      where s.token_hash = kotsu._h(p_token) and s.kind = 'user' and s.expires_at > now() and u.active and o.active;
  end if;
  -- 記名のあいだ（いずれかの塾・学校でスイッチが入っているあいだ）は、ログインしていない送信（ログインなし・期限切れ・でたらめなトークン）を受けとらない
  if org is null and exists (select 1 from kotsu.orgs where active and fb_named) then return jsonb_build_object('error', 'login'); end if;
  if not coalesce(named, false) then uid := null;   -- 匿名のあいだは、送り主を記録にも回数にも使わない
  elsif uid is not null and p_named is not true then return jsonb_build_object('error', 'named');   -- 記名の説明を見ていない子からは、受けとらない
  end if;
  if kotsu._rate_locked('FH:' || dv, 5, interval '1 hour') or kotsu._rate_locked('FD:' || dv, 15, interval '24 hours')
     or kotsu._rate_locked('FG', 300, interval '1 hour')
     or (uid is not null and (kotsu._rate_locked('FU:' || uid, 5, interval '1 hour') or kotsu._rate_locked('FV:' || uid, 15, interval '24 hours'))) then
    return jsonb_build_object('error', 'slow');
  end if;
  if (select count(*) from kotsu.feedback) >= 20000 then return jsonb_build_object('error', 'full'); end if;
  insert into kotsu.feedback (org_id, user_id, kind, feel, msg, grade, screen, ver, dev)
    values (org, uid, kd, fl, m, g, kotsu._clip(p_screen, 60), kotsu._clip(p_ver, 40), dv)
    returning id into v_id;
  perform kotsu._rate_hit('FH:' || dv, interval '1 hour');
  perform kotsu._rate_hit('FD:' || dv, interval '24 hours');
  perform kotsu._rate_hit('FG', interval '1 hour');
  if uid is not null then
    perform kotsu._rate_hit('FU:' || uid, interval '1 hour');
    perform kotsu._rate_hit('FV:' || uid, interval '24 hours');
  end if;
  if random() < 0.02 then delete from kotsu.rate where k like 'F%' and since < now() - interval '2 days'; end if;
  return jsonb_build_object('ok', true, 'id', v_id, 'named', uid is not null);
end $function$;

revoke all on function kotsu.fb_send(text, text, integer, text, text, text, text, text, boolean) from public;
grant execute on function kotsu.fb_send(text, text, integer, text, text, text, text, text, boolean) to anon, authenticated;

notify pgrst, 'reload schema';
