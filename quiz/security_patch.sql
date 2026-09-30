-- ============================================================
-- 旧 quiz/（小テストQR配布）用の応急セキュリティパッチ
--   新しい「授業ライブ」(lesson-live/) へ移行するまでの間に当てておくもの。
--   schema.sql を実行したあとに、この全文を SQL Editor に貼って Run（何度実行してもよい）。
--
-- 直すこと
--   1. 内部関数 quiz_check_pin / _quiz_parse_account を anon（だれでも）から直接呼べないようにする
--   2. 先生PINの総当たり対策：同じ接続元から10分に10回まちがえたら15分ロック、
--      全体で1時間に100回まちがえたら30分ロック（4桁PINは1万通りしかなく、対策なしだと数分で破られる）
--
-- あわせて必ずやること（PINを長くする。数字4桁ではなく8文字以上の合言葉に）
--   update quiz_settings set value = 'ここに長い合言葉' where key = 'teacher_pin';
--
-- このパッチでは直せないこと（授業ライブでは修正済み）
--   ・生徒用の quiz_my_reflections / quiz_my_attempts / quiz_reflection_get は「ID」だけで呼べるため、
--     IDの形（学校コード＋番号）を知っている人は他の生徒の振り返りを読めてしまう。
--     関数の形を変えると旧画面が動かなくなるので、ここでは変更しない。→ 早めに授業ライブへ移行を。
-- ============================================================

create table if not exists quiz_pin_fail (
  key          text primary key,
  n            int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);
alter table quiz_pin_fail enable row level security;
do $$ begin
  execute 'revoke all on table quiz_pin_fail from anon, authenticated';
exception when undefined_object then null; end $$;

create or replace function quiz_check_pin(p_pin text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  h json; v_ip text; v_ok boolean;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  v_ip := coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(btrim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
  if exists (select 1 from quiz_pin_fail where key in (v_ip, '__all__') and locked_until > now()) then
    return false;
  end if;
  v_ok := exists (select 1 from quiz_settings where key = 'teacher_pin' and value = coalesce(p_pin, ''));
  if not v_ok then
    insert into quiz_pin_fail as f (key, n, window_start) values (v_ip, 1, now())
      on conflict (key) do update set
        n = case when f.window_start < now() - interval '10 minutes' then 1 else f.n + 1 end,
        window_start = case when f.window_start < now() - interval '10 minutes' then now() else f.window_start end,
        locked_until = case when f.window_start >= now() - interval '10 minutes' and f.n + 1 >= 10
                            then now() + interval '15 minutes' else f.locked_until end;
    insert into quiz_pin_fail as f (key, n, window_start) values ('__all__', 1, now())
      on conflict (key) do update set
        n = case when f.window_start < now() - interval '1 hour' then 1 else f.n + 1 end,
        window_start = case when f.window_start < now() - interval '1 hour' then now() else f.window_start end,
        locked_until = case when f.window_start >= now() - interval '1 hour' and f.n + 1 >= 100
                            then now() + interval '30 minutes' else f.locked_until end;
  end if;
  return v_ok;
end $$;

do $$ begin
  execute 'revoke all on function quiz_check_pin(text) from public';
  execute 'revoke all on function _quiz_parse_account(text) from public';
  begin
    execute 'revoke all on function quiz_check_pin(text) from anon, authenticated';
    execute 'revoke all on function _quiz_parse_account(text) from anon, authenticated';
  exception when undefined_object then null;
  end;
end $$;

notify pgrst, 'reload schema';
