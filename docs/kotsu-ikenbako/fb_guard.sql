-- fb_guard.sql — ご意見ばこ：回数をきびしく／同じ文の連投を止める／人を傷つけることばは「かくした」へ／助けを求めることばは目立たせる。
-- 変えるのは kotsu.fb_send だけ（本番の いまの定義＋ 数か所）。何度流しても同じ。apply_migration にそのまま渡せる。
--   ・回数：ログインしている子は 1人ごと 1時間2件・1日5件（いままで 5件・15件）。スタンプ（顔）だけは 1日3回。端末ごとの上限は、いままでどおり。
--   ・同じ文：同じ子（匿名のときは同じ端末）が 24時間のうちに同じ文を送ると、{"error":"dup"} で止める。
--   ・人を傷つけることば：受けとって記録するが、status を 'hide'（運営の画面の「かくした」）にして、「新しい」には出さない。生徒には、ふつうに届いたと返す。
--   ・助けを求めることば（死にたい・いじめ・助けて など）：止めない。種類を 'trouble' にし、メモに「🚨 …」を付ける。1人ごとの回数の上限をかけない。かくさない。
-- 本番の fb_send の本文は、足す前が fb_login.sql と同じ（md5）であることを確かめてから入れる。

create or replace function kotsu.fb_send(p_token text, p_kind text, p_feel integer, p_msg text, p_grade text, p_screen text, p_ver text, p_dev text, p_named boolean default null)
 returns jsonb language plpgsql security definer set search_path to 'kotsu', 'extensions', 'public' as $function$
declare m text; kd text; fl int; g text; dv text; org uuid; uid uuid; named boolean := false; v_id bigint; urgent boolean := false; abuse boolean := false;
begin
  m := btrim(kotsu._clip(coalesce(p_msg, ''), 400));
  kd := case when p_kind in ('idea', 'trouble', 'good', 'bug') then p_kind else 'idea' end;
  fl := case when p_feel between 1 and 3 then p_feel else null end;
  if fl is null and length(m) < 2 then return jsonb_build_object('error', 'empty'); end if;
  if kotsu._looks_private(m) then return jsonb_build_object('error', 'private'); end if;
  -- 助けを求めることば（止めない。目立たせる・回数の上限を ゆるめる）／人を傷つけることば（先生の一覧には出さず、「かくした」に入れる。記録は残す）
  urgent := m ~ '(死にたい|しにたい|死のう|消えたい|きえたい|生きたくな|生きていたくな|いなくなりたい|自殺|じさつ|自傷|リスカ|いじめ|イジメ|虐め|助けて|たすけて|殴られ|なぐられ|蹴られ|叩かれ|たたかれ|無視され|仲間はずれ|仲間外れ)';
  abuse := not urgent and m ~ '(死ね|しね(?!ま)|氏ね|殺す|ころす|殺してやる|消えろ|きえろ|うざい|ウザい|ウザイ|うぜえ|うぜぇ|きもい|キモい|キモイ|クソ|くそ(?!ま)|クズ|ゴミ|ばか(?!り)|バカ(?!ンス)|馬鹿|あほ|アホ|ハゲ|デブ|ブス|やめちまえ|辞めろ|やめろ)';
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
  -- 同じ文を、1日のうちに もういちど送ることは受けとらない（同じ子・匿名のときは同じ端末）。助けを求めることばは、止めない
  if m <> '' and not urgent and exists (select 1 from kotsu.feedback f where f.at > now() - interval '24 hours' and f.msg = m
       and ((uid is not null and f.user_id = uid) or (uid is null and f.dev = dv))) then
    return jsonb_build_object('error', 'dup');
  end if;
  -- 回数：端末ごと 1時間5件・1日15件（いままでどおり）。ログインしている子は 1人ごと 1時間2件・1日5件。スタンプ（顔）だけは 1日3回まで。助けを求めることばは、1人ごとの上限を かけない
  if kotsu._rate_locked('FH:' || dv, 5, interval '1 hour') or kotsu._rate_locked('FD:' || dv, 15, interval '24 hours')
     or kotsu._rate_locked('FG', 300, interval '1 hour')
     or (uid is not null and not urgent and (kotsu._rate_locked('FU:' || uid, 2, interval '1 hour') or kotsu._rate_locked('FV:' || uid, 5, interval '24 hours')))
     or (m = '' and not urgent and kotsu._rate_locked('FS:' || coalesce(uid::text, dv), 3, interval '24 hours')) then
    return jsonb_build_object('error', 'slow');
  end if;
  if (select count(*) from kotsu.feedback) >= 20000 then return jsonb_build_object('error', 'full'); end if;
  insert into kotsu.feedback (org_id, user_id, kind, feel, msg, grade, screen, ver, dev, status, note)
    values (org, uid, case when urgent then 'trouble' else kd end, fl, m, g, kotsu._clip(p_screen, 60), kotsu._clip(p_ver, 40), dv,
            case when abuse then 'hide' else 'new' end,
            case when urgent then '🚨 助けを求めることばがあります。先に見てください。'
                 when abuse then '🔕 きついことばのため、かくしておきました（「かくした」で見られます）。' else '' end)
    returning id into v_id;
  perform kotsu._rate_hit('FH:' || dv, interval '1 hour');
  perform kotsu._rate_hit('FD:' || dv, interval '24 hours');
  perform kotsu._rate_hit('FG', interval '1 hour');
  if m = '' then perform kotsu._rate_hit('FS:' || coalesce(uid::text, dv), interval '24 hours'); end if;
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
