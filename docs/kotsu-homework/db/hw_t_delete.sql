-- hw_t_delete.sql — 宿題の「消す」関数だけ（hw.sql と同じ内容）。
-- 使いかた：Supabase の Dashboard → SQL Editor に、これを全部貼って「Run」。何度流しても同じ。
-- （Claude から入れようとすると、Supabase の確認（delete from を含むため）が出て、間に合わずに時間切れになる）
-- 入ったかの確認：  select proname, proacl::text from pg_proc where proname = 'hw_t_delete' and pronamespace = 'kotsu'::regnamespace;
--   → {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}

create or replace function kotsu.hw_t_delete(p_token text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'kotsu', 'extensions', 'public'
as $fn$
declare t kotsu.users; h kotsu.homework;
begin
  t := kotsu._staff(p_token);
  select * into h from kotsu.homework where id = p_id;
  if not found then perform kotsu._err('not_found'); end if;
  if not kotsu._hw_can(t, h) then perform kotsu._err('forbidden'); end if;
  -- 取り組み ＝ 宿題の目標に向けた分：n の宿題なら その単元を解いた（count>0）、min の宿題なら 学習した（sec>0）。（n だけの宿題では、ほかの単元の学習時間は数えない）
  if now() - h.created_at >= interval '1 day'
     and exists (select 1 from kotsu._hw_eval(h) e
                 where (h.n is not null and (e.prog->>'count')::int > 0) or (h.min is not null and (e.prog->>'sec')::numeric > 0)) then
    perform kotsu._err('not_deletable');
  end if;
  delete from kotsu.homework where id = h.id;
  perform kotsu._audit(t.org_id, t.id, t.role, 'hw_delete', h.id::text, jsonb_build_object('title', h.title, 'class', h.class_id));
  return jsonb_build_object('ok', true);
exception when sqlstate 'P0001' then
  return jsonb_build_object('error', sqlerrm);
end $fn$;

revoke all on function kotsu.hw_t_delete(text, uuid) from public;
grant execute on function kotsu.hw_t_delete(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
