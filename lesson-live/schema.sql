-- ============================================================
-- 授業ライブ（中1数学：小テスト・振り返り・授業の反応）スキーマ
--
-- ★ math-labo-second（数学ラボ2）の Supabase に相乗りする前提。
--   既存の quiz_* / applied_* / study_* / attempts などと衝突しないよう、
--   すべて "live_" 接頭辞（内部関数は "_live_"）で隔離しています。
-- ★ SQL Editor に全文を貼って Run するだけ。何度実行しても壊れません
--   （create ... if not exists / create or replace で書いています）。
-- ★ 初回だけ、最後にある「先生の合言葉を設定」を実行してください。
--
-- 旧 quiz/ からのセキュリティ上の改善点
--   1. 生徒は「ログイン → ランダムなトークン」で本人確認。以後の読み書きは
--      すべてトークン必須（旧版はIDだけで他人の振り返りを読めた）。
--      トークンはハッシュ（sha256）だけをDBに保存。パスワードは bcrypt。
--   2. 先生は 4桁PIN → 8文字以上の合言葉（bcrypt）＋12時間トークン。
--      ログイン失敗は接続元ごとに回数制限（総当たり対策）。
--   3. 生徒のログイン失敗も回数制限（8回で5分ロック）。
--   4. 内部関数（_live_*）は anon から実行できないよう権限を外す
--      （旧版の quiz_check_pin は anon から直接呼べた）。
--   5. 文字数・データ量の上限をサーバー側で検査。
--   6. 学校名・氏名は一切保存しない（ID = 学校コード＋学年＋組＋番号）。
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- テーブル ----------

create table if not exists live_settings (
  key   text primary key,
  value text not null
);

create table if not exists live_classes (
  id         uuid primary key default gen_random_uuid(),
  school     text not null check (school ~ '^[A-Z]-[0-9]{1,3}$'),
  grade      int  not null check (grade between 1 and 3),
  class_no   int  not null check (class_no between 1 and 9),
  join_code  text not null unique,
  join_open  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school, grade, class_no)
);

create table if not exists live_accounts (
  account_id   text primary key check (account_id ~ '^[A-Z]-[0-9]{5,7}$'),
  class_id     uuid not null references live_classes(id) on delete cascade,
  number       int  not null check (number between 1 and 99),
  pass_hash    text not null,
  must_change  boolean not null default false,
  fail_count   int not null default 0,
  locked_until timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists live_accounts_class on live_accounts(class_id);

create table if not exists live_tokens (
  token_hash text primary key,
  role       text not null check (role in ('s', 't')),
  account_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists live_tokens_exp on live_tokens(expires_at);

-- クラスごとの「いま」の状態（生徒の画面は数秒ごとにこれを見に来る）
create table if not exists live_class_state (
  class_id          uuid primary key references live_classes(id) on delete cascade,
  lesson_id         text,              -- 進行中の授業（例 '1-3'）。null = 授業していない
  lesson_started_at timestamptz,
  meate             text,              -- めあて
  notice            text,              -- お知らせ（生徒画面の上に出る）
  quiz_lesson       text,              -- 配布中の小テスト（null = 配布なし）
  quiz_limit_sec    int,
  reflect_lesson    text,              -- 受付中の振り返り（null = 受付なし）
  reflect_mode      text not null default 'light' check (reflect_mode in ('light', 'deep')),
  share_posts       boolean not null default true, -- 質問をクラス全員に（名前は出さずに）見せるか
  timer_end         timestamptz,
  timer_total       int,
  timer_label       text,
  task_no           int not null default 0,
  task_label        text,
  poll              jsonb,             -- クイック投票 {id, kind, q, options, answer, open, show}
  v                 bigint not null default 1,
  updated_at        timestamptz not null default now()
);

-- 生徒ごとの「いま」の状態（接続・わからない・挙手・ヘルプ・できた）
create table if not exists live_status (
  account_id text primary key,
  class_id   uuid not null,
  last_seen  timestamptz,
  lost_at    timestamptz,
  hand_at    timestamptz,
  help_at    timestamptz,
  done_task  int,
  done_at    timestamptz
);
create index if not exists live_status_class on live_status(class_id);

create table if not exists live_reactions (
  id         bigint generated always as identity primary key,
  class_id   uuid not null,
  lesson_id  text,
  account_id text not null,
  kind       text not null check (kind in ('like', 'aha', 'slow', 'again', 'lost', 'hand', 'help', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists live_reactions_class on live_reactions(class_id, created_at);

create table if not exists live_posts (
  id         bigint generated always as identity primary key,
  class_id   uuid not null,
  lesson_id  text,
  account_id text not null,
  kind       text not null check (kind in ('q', 'c')),
  body       text not null check (char_length(body) between 1 and 300),
  status     text not null default 'open' check (status in ('open', 'done', 'hidden')),
  pinned     boolean not null default false,
  plus       int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists live_posts_class on live_posts(class_id, created_at);

create table if not exists live_post_plus (
  post_id    bigint not null references live_posts(id) on delete cascade,
  account_id text not null,
  primary key (post_id, account_id)
);

create table if not exists live_poll_answers (
  poll_id    text not null,
  class_id   uuid not null,
  account_id text not null,
  answer     text not null check (char_length(answer) between 1 and 120),
  updated_at timestamptz not null default now(),
  primary key (poll_id, account_id)
);

create table if not exists live_attempts (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null,
  lesson_id    text not null,
  account_id   text not null,
  jst_date     date not null,
  score        int  not null,
  max_score    int  not null,
  answers      jsonb not null,
  duration_sec int,
  voided       boolean not null default false, -- 先生が「やり直し」を許可したら true（記録は残す）
  created_at   timestamptz not null default now()
);
create unique index if not exists live_attempts_once on live_attempts(account_id, lesson_id, jst_date) where not voided;
create index if not exists live_attempts_class on live_attempts(class_id, lesson_id);

create table if not exists live_reflections (
  id            bigint generated always as identity primary key,
  class_id      uuid not null,
  lesson_id     text not null,
  account_id    text not null,
  jst_date      date not null,
  understanding int  not null check (understanding between 1 and 4),
  mode          text not null default 'light' check (mode in ('light', 'deep')),
  body          jsonb not null,  -- {summary, stuck, how, next, question, predict, prev_done}
  auto_eval     jsonb,           -- ブラウザ内の自動評価（観点・根拠）
  teacher_eval  jsonb,           -- 先生が直した評価
  teacher_note  text,            -- 先生からのひとこと（生徒の記録画面に出る）
  flag          text,            -- null / 'sos' / 'help'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (account_id, lesson_id, jst_date)
);
create index if not exists live_reflections_class on live_reflections(class_id, lesson_id);

create table if not exists live_rate (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);

-- ---------- 直接アクセスは全面禁止（RPC経由のみ） ----------
alter table live_settings     enable row level security;
alter table live_classes      enable row level security;
alter table live_accounts     enable row level security;
alter table live_tokens       enable row level security;
alter table live_class_state  enable row level security;
alter table live_status       enable row level security;
alter table live_reactions    enable row level security;
alter table live_posts        enable row level security;
alter table live_post_plus    enable row level security;
alter table live_poll_answers enable row level security;
alter table live_attempts     enable row level security;
alter table live_reflections  enable row level security;
alter table live_rate         enable row level security;
do $$
declare t text;
begin
  foreach t in array array['live_settings','live_classes','live_accounts','live_tokens','live_class_state','live_status',
    'live_reactions','live_posts','live_post_plus','live_poll_answers','live_attempts','live_reflections','live_rate'] loop
    execute format('revoke all on table %I from anon, authenticated', t);
  end loop;
exception when undefined_object then null; -- anon ロールが無い環境（素の Postgres）でも通るように
end $$;

-- ---------- 内部ヘルパー（anon からは実行不可にする） ----------

create or replace function _live_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Tokyo')::date $$;

create or replace function _live_hash(p text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(digest(coalesce(p, ''), 'sha256'), 'hex')
$$;

create or replace function _live_clean(p text, p_max int) returns text
language sql immutable as $$
  select left(btrim(regexp_replace(coalesce(p, ''), '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g')), p_max)
$$;

create or replace function _live_client_ip() returns text
language plpgsql stable as $$
declare h json;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  return coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(btrim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
end $$;

-- 回数制限: 許可なら true。p_max 回を超えたら p_lock のあいだ false を返す
create or replace function _live_rate_hit(p_key text, p_max int, p_window interval, p_lock interval) returns boolean
language plpgsql security definer set search_path = public as $$
declare r live_rate;
begin
  insert into live_rate (key, count, window_start) values (p_key, 0, now()) on conflict (key) do nothing;
  select * into r from live_rate where key = p_key for update;
  if r.locked_until is not null and r.locked_until > now() then return false; end if;
  if r.window_start < now() - p_window then
    update live_rate set count = 1, window_start = now(), locked_until = null where key = p_key;
    return true;
  end if;
  if r.count + 1 > p_max then
    update live_rate set count = r.count + 1, locked_until = now() + p_lock where key = p_key;
    return false;
  end if;
  update live_rate set count = r.count + 1 where key = p_key;
  return true;
end $$;

create or replace function _live_rate_locked(p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from live_rate where key = p_key and locked_until > now())
$$;

create or replace function _live_rate_clear(p_key text) returns void
language sql security definer set search_path = public as $$
  delete from live_rate where key = p_key
$$;

create or replace function _live_new_token(p_role text, p_account text, p_hours int) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_tok text := encode(gen_random_bytes(24), 'hex');
begin
  insert into live_tokens (token_hash, role, account_id, expires_at)
    values (_live_hash(v_tok), p_role, p_account, now() + make_interval(hours => p_hours));
  delete from live_tokens where expires_at < now() - interval '1 day';
  return v_tok;
end $$;

create or replace function _live_student(p_token text) returns live_accounts
language sql stable security definer set search_path = public, extensions as $$
  select a.* from live_tokens t join live_accounts a on a.account_id = t.account_id
  where t.token_hash = _live_hash(p_token) and t.role = 's' and t.expires_at > now()
$$;

create or replace function _live_is_teacher(p_token text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from live_tokens where token_hash = _live_hash(p_token) and role = 't' and expires_at > now())
$$;

create or replace function _live_weak_pass(p text, p_number int) returns boolean
language sql immutable as $$
  select char_length(coalesce(p, '')) < 4 or char_length(p) > 64
      or p ~ '^(.)\1*$'
      or lower(p) in ('1234', '12345', '123456', '4321', 'abcd', 'qwerty', 'password', 'pass', '0123', '1111')
      or p = lpad(p_number::text, 2, '0') or p = p_number::text
$$;

create or replace function _live_class_label(c live_classes) returns text
language sql immutable as $$ select c.grade || '年' || c.class_no || '組' $$;

create or replace function _live_join_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text; b bytea; i int;
begin
  loop
    b := gen_random_bytes(6); code := '';
    for i in 0..5 loop code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from live_classes where join_code = code);
  end loop;
  return code;
end $$;

create or replace function _live_lesson_ok(p text) returns boolean
language sql immutable as $$ select p is null or p ~ '^[1-7]-[0-9]{1,2}$' $$;

-- 状態の版を上げる（生徒の画面が変化に気づく）
create or replace function _live_bump(p_class uuid) returns void
language sql security definer set search_path = public as $$
  update live_class_state set v = v + 1, updated_at = now() where class_id = p_class
$$;

-- ---------- 生徒：登録・ログイン ----------

-- 参加コードから「何年何組か」だけを返す（登録画面で「1年2組に参加します」と確認するため）
create or replace function live_join_info(p_join text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c live_classes;
begin
  if not _live_rate_hit('join:' || _live_client_ip(), 300, interval '10 minutes', interval '10 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into c from live_classes where join_code = upper(btrim(coalesce(p_join, ''))) and join_open;
  if not found then return jsonb_build_object('error', 'bad_join'); end if;
  return jsonb_build_object('ok', true, 'label', _live_class_label(c));
end $$;

create or replace function live_register(p_join text, p_number int, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c live_classes; v_id text;
begin
  if not _live_rate_hit('reg:' || _live_client_ip(), 200, interval '10 minutes', interval '10 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into c from live_classes where join_code = upper(btrim(coalesce(p_join, ''))) and join_open;
  if not found then return jsonb_build_object('error', 'bad_join'); end if;
  if p_number is null or p_number < 1 or p_number > 99 then return jsonb_build_object('error', 'bad_number'); end if;
  if _live_weak_pass(p_password, p_number) then return jsonb_build_object('error', 'weak_password'); end if;
  v_id := c.school || c.grade || c.class_no || lpad(p_number::text, 2, '0');
  begin
    insert into live_accounts (account_id, class_id, number, pass_hash)
      values (v_id, c.id, p_number, crypt(p_password, gen_salt('bf', 6)));
  exception when unique_violation then
    return jsonb_build_object('error', 'id_taken', 'account_id', v_id);
  end;
  return jsonb_build_object('ok', true, 'account_id', v_id, 'token', _live_new_token('s', v_id, 24 * 30),
    'class', jsonb_build_object('id', c.id, 'label', _live_class_label(c)));
end $$;

create or replace function live_login(p_account_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id text := upper(btrim(coalesce(p_account_id, '')));
  a live_accounts; c live_classes;
  v_old text; m text[]; v_rest text; v_class uuid;
begin
  if not _live_rate_hit('login:' || _live_client_ip(), 400, interval '10 minutes', interval '10 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into a from live_accounts where account_id = v_id;
  if not found then
    -- 旧 quiz/ のアカウント（同じID・同じパスワード）でもそのまま入れるようにする
    if to_regclass('public.quiz_accounts') is not null then
      execute 'select password_hash from quiz_accounts where account_id = $1' into v_old using v_id;
      if v_old is not null and crypt(coalesce(p_password, ''), v_old) = v_old then
        m := regexp_match(v_id, '^([A-Z])-([0-9]{5,7})$');
        v_rest := m[2];
        select id into v_class from live_classes
          where school = m[1] || '-' || left(v_rest, length(v_rest) - 4)
            and grade = substr(right(v_rest, 4), 1, 1)::int and class_no = substr(right(v_rest, 4), 2, 1)::int;
        if v_class is null then return jsonb_build_object('error', 'no_class'); end if;
        insert into live_accounts (account_id, class_id, number, pass_hash)
          values (v_id, v_class, right(v_rest, 2)::int, v_old) on conflict do nothing;
        select * into a from live_accounts where account_id = v_id;
      end if;
    end if;
    if a.account_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  end if;
  if a.locked_until is not null and a.locked_until > now() then
    return jsonb_build_object('error', 'locked', 'minutes', ceil(extract(epoch from a.locked_until - now()) / 60));
  end if;
  if crypt(coalesce(p_password, ''), a.pass_hash) <> a.pass_hash then
    update live_accounts set
      fail_count = case when fail_count + 1 >= 8 then 0 else fail_count + 1 end,
      locked_until = case when fail_count + 1 >= 8 then now() + interval '5 minutes' else locked_until end
    where account_id = a.account_id;
    return jsonb_build_object('error', 'bad_login');
  end if;
  update live_accounts set fail_count = 0, locked_until = null where account_id = a.account_id;
  select * into c from live_classes where id = a.class_id;
  return jsonb_build_object('ok', true, 'account_id', a.account_id, 'token', _live_new_token('s', a.account_id, 24 * 30),
    'must_change', a.must_change, 'class', jsonb_build_object('id', c.id, 'label', _live_class_label(c)));
end $$;

create or replace function live_logout(p_token text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  with d as (delete from live_tokens where token_hash = _live_hash(p_token)) select jsonb_build_object('ok', true)
$$;

create or replace function live_me(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; c live_classes;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into c from live_classes where id = a.class_id;
  return jsonb_build_object('ok', true, 'account_id', a.account_id, 'number', a.number, 'must_change', a.must_change,
    'class', jsonb_build_object('id', c.id, 'label', _live_class_label(c)));
end $$;

create or replace function live_change_password(p_token text, p_old text, p_new text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  if crypt(coalesce(p_old, ''), a.pass_hash) <> a.pass_hash then return jsonb_build_object('error', 'bad_login'); end if;
  if _live_weak_pass(p_new, a.number) then return jsonb_build_object('error', 'weak_password'); end if;
  update live_accounts set pass_hash = crypt(p_new, gen_salt('bf', 6)), must_change = false where account_id = a.account_id;
  delete from live_tokens where account_id = a.account_id and token_hash <> _live_hash(p_token);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 生徒：授業中 ----------

-- 数秒ごとの確認。p_v が今の版と同じなら状態は省略（通信量を減らす）
create or replace function live_pulse(p_token text, p_v bigint default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  a live_accounts; s live_class_state; st live_status;
  v_me jsonb; v_poll jsonb; v_my_ans text; v_res jsonb;
  v_today date := _live_today();
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  insert into live_status (account_id, class_id, last_seen) values (a.account_id, a.class_id, now())
    on conflict (account_id) do update set last_seen = now(), class_id = excluded.class_id
    where live_status.last_seen is null or live_status.last_seen < now() - interval '15 seconds';
  select * into st from live_status where account_id = a.account_id;
  select * into s from live_class_state where class_id = a.class_id;
  v_me := jsonb_build_object(
    'lost', st.lost_at is not null and st.lost_at > now() - interval '20 minutes',
    'hand', st.hand_at is not null, 'help', st.help_at is not null,
    'done', s.task_no is not null and st.done_task is not null and st.done_task = s.task_no);
  if s.class_id is null then
    return jsonb_build_object('now', now(), 'v', 0, 'me', v_me, 'state', null);
  end if;
  if p_v is not null and p_v = s.v then
    return jsonb_build_object('now', now(), 'v', s.v, 'me', v_me);
  end if;
  if s.poll is not null then
    select answer into v_my_ans from live_poll_answers where poll_id = s.poll->>'id' and account_id = a.account_id;
    v_poll := (s.poll - 'answer') || jsonb_build_object('mine', v_my_ans);
    if coalesce((s.poll->>'show')::boolean, false) then
      select coalesce(jsonb_agg(jsonb_build_object('a', answer, 'n', n) order by n desc), '[]'::jsonb) into v_res
        from (select answer, count(*) n from live_poll_answers where poll_id = s.poll->>'id' group by answer order by count(*) desc limit 12) x;
      v_poll := v_poll || jsonb_build_object('answer', s.poll->'answer', 'result', v_res);
    end if;
  end if;
  return jsonb_build_object('now', now(), 'v', s.v, 'me', v_me, 'state', jsonb_build_object(
    'lesson_id', s.lesson_id, 'lesson_started_at', s.lesson_started_at, 'meate', s.meate, 'notice', s.notice,
    'quiz_lesson', s.quiz_lesson, 'quiz_limit_sec', s.quiz_limit_sec,
    'quiz_done', s.quiz_lesson is not null and exists (select 1 from live_attempts where account_id = a.account_id
        and lesson_id = s.quiz_lesson and jst_date = v_today and not voided),
    'reflect_lesson', s.reflect_lesson, 'reflect_mode', s.reflect_mode,
    'reflect_done', s.reflect_lesson is not null and exists (select 1 from live_reflections where account_id = a.account_id
        and lesson_id = s.reflect_lesson and jst_date = v_today),
    'share_posts', s.share_posts,
    'timer_end', s.timer_end, 'timer_total', s.timer_total, 'timer_label', s.timer_label,
    'task_no', s.task_no, 'task_label', s.task_label, 'poll', v_poll));
end $$;

create or replace function live_react(p_token text, p_kind text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; s live_class_state; v_log text;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into s from live_class_state where class_id = a.class_id;
  if s.lesson_id is null then return jsonb_build_object('error', 'no_lesson'); end if;
  insert into live_status (account_id, class_id) values (a.account_id, a.class_id) on conflict (account_id) do nothing;
  case p_kind
    when 'like', 'aha', 'slow', 'again' then
      -- 連打は 3 秒に 1 回だけ数える
      if exists (select 1 from live_reactions where account_id = a.account_id and kind = p_kind and created_at > now() - interval '3 seconds') then
        return jsonb_build_object('ok', true, 'throttled', true);
      end if;
      v_log := p_kind;
    when 'lost_on' then update live_status set lost_at = now() where account_id = a.account_id; v_log := 'lost';
    when 'lost_off' then update live_status set lost_at = null where account_id = a.account_id;
    when 'hand_on' then update live_status set hand_at = coalesce(hand_at, now()) where account_id = a.account_id; v_log := 'hand';
    when 'hand_off' then update live_status set hand_at = null where account_id = a.account_id;
    when 'help_on' then update live_status set help_at = coalesce(help_at, now()) where account_id = a.account_id; v_log := 'help';
    when 'help_off' then update live_status set help_at = null where account_id = a.account_id;
    when 'done' then update live_status set done_task = s.task_no, done_at = now() where account_id = a.account_id; v_log := 'done';
    when 'undone' then update live_status set done_task = null, done_at = null where account_id = a.account_id;
    else return jsonb_build_object('error', 'bad_kind');
  end case;
  if v_log is not null then
    insert into live_reactions (class_id, lesson_id, account_id, kind) values (a.class_id, s.lesson_id, a.account_id, v_log);
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_post(p_token text, p_kind text, p_body text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; s live_class_state; v_body text := _live_clean(p_body, 300); v_id bigint;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  if p_kind not in ('q', 'c') then return jsonb_build_object('error', 'bad_kind'); end if;
  if v_body = '' then return jsonb_build_object('error', 'empty'); end if;
  select * into s from live_class_state where class_id = a.class_id;
  if s.lesson_id is null then return jsonb_build_object('error', 'no_lesson'); end if;
  if (select count(*) from live_posts where account_id = a.account_id and created_at > now() - interval '1 minute') >= 4
     or (select count(*) from live_posts where account_id = a.account_id and created_at > now() - interval '1 day') >= 60 then
    return jsonb_build_object('error', 'too_many');
  end if;
  insert into live_posts (class_id, lesson_id, account_id, kind, body) values (a.class_id, s.lesson_id, a.account_id, p_kind, v_body)
    returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- 生徒に見せる投稿（名前は出さない）：この授業の質問＋先生がピックアップしたコメント＋自分の投稿
create or replace function live_posts_student(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; s live_class_state;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into s from live_class_state where class_id = a.class_id;
  if s.lesson_id is null then return jsonb_build_object('posts', '[]'::jsonb); end if;
  return jsonb_build_object('posts', coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'body', p.body, 'status', p.status, 'pinned', p.pinned,
      'plus', p.plus, 'mine', p.account_id = a.account_id,
      'plused', exists (select 1 from live_post_plus pp where pp.post_id = p.id and pp.account_id = a.account_id))
      order by p.pinned desc, p.plus desc, p.id desc)
    from live_posts p
    where p.class_id = a.class_id and p.created_at >= coalesce(s.lesson_started_at, now() - interval '3 hours')
      and p.status <> 'hidden'
      and (p.account_id = a.account_id or p.pinned or (p.kind = 'q' and s.share_posts))
  ), '[]'::jsonb));
end $$;

create or replace function live_plus(p_token text, p_post_id bigint)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; p live_posts;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into p from live_posts where id = p_post_id and class_id = a.class_id and status <> 'hidden';
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if p.account_id = a.account_id then return jsonb_build_object('error', 'own'); end if;
  if exists (select 1 from live_post_plus where post_id = p.id and account_id = a.account_id) then
    delete from live_post_plus where post_id = p.id and account_id = a.account_id;
  else
    insert into live_post_plus (post_id, account_id) values (p.id, a.account_id);
  end if;
  update live_posts set plus = (select count(*) from live_post_plus where post_id = p.id) where id = p.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_poll_answer(p_token text, p_poll_id text, p_answer text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; s live_class_state; v text := _live_clean(p_answer, 120);
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into s from live_class_state where class_id = a.class_id;
  if s.poll is null or s.poll->>'id' <> p_poll_id or not coalesce((s.poll->>'open')::boolean, false) then
    return jsonb_build_object('error', 'closed');
  end if;
  if v = '' then return jsonb_build_object('error', 'empty'); end if;
  insert into live_poll_answers (poll_id, class_id, account_id, answer) values (p_poll_id, a.class_id, a.account_id, v)
    on conflict (poll_id, account_id) do update set answer = excluded.answer, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- 小テストの提出（採点はブラウザ内。先生の画面では解答から採点し直して点数を検証する）
create or replace function live_quiz_submit(p_token text, p_lesson_id text, p_score int, p_max int, p_answers jsonb, p_duration int default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; s live_class_state;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into s from live_class_state where class_id = a.class_id;
  if s.quiz_lesson is null or s.quiz_lesson <> p_lesson_id then return jsonb_build_object('error', 'closed'); end if;
  if p_max is null or p_max < 1 or p_max > 100 or p_score is null or p_score < 0 or p_score > p_max + 1 then
    return jsonb_build_object('error', 'bad_score');
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 40000 then
    return jsonb_build_object('error', 'too_large');
  end if;
  begin
    insert into live_attempts (class_id, lesson_id, account_id, jst_date, score, max_score, answers, duration_sec)
      values (a.class_id, p_lesson_id, a.account_id, _live_today(), p_score, p_max, p_answers,
              case when p_duration between 0 and 36000 then p_duration end);
  exception when unique_violation then
    return jsonb_build_object('error', 'already');
  end;
  return jsonb_build_object('ok', true);
end $$;

-- 振り返り：今日の分と、前回の振り返り（「次にやること」を今回に接続するため）
create or replace function live_reflection_get(p_token text, p_lesson_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; v_today jsonb; v_prev jsonb;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select jsonb_build_object('understanding', understanding, 'mode', mode, 'body', body, 'auto_eval', auto_eval) into v_today
    from live_reflections where account_id = a.account_id and lesson_id = p_lesson_id and jst_date = _live_today();
  select jsonb_build_object('lesson_id', lesson_id, 'date', jst_date, 'body', body, 'understanding', understanding) into v_prev
    from live_reflections where account_id = a.account_id and not (lesson_id = p_lesson_id and jst_date = _live_today())
    order by jst_date desc, updated_at desc limit 1;
  return jsonb_build_object('today', v_today, 'prev', v_prev);
end $$;

create or replace function live_reflection_submit(p_token text, p_lesson_id text, p_understanding int, p_mode text,
  p_body jsonb, p_auto jsonb default null, p_flag text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts; s live_class_state; v_body jsonb := '{}'::jsonb; k text;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into s from live_class_state where class_id = a.class_id;
  if s.reflect_lesson is null or s.reflect_lesson <> p_lesson_id then return jsonb_build_object('error', 'closed'); end if;
  if p_understanding is null or p_understanding < 1 or p_understanding > 4 then return jsonb_build_object('error', 'bad_value'); end if;
  if p_body is null or jsonb_typeof(p_body) <> 'object' then return jsonb_build_object('error', 'bad_value'); end if;
  foreach k in array array['summary', 'stuck', 'how', 'next', 'question', 'predict', 'prev_done'] loop
    if p_body ? k then v_body := v_body || jsonb_build_object(k, _live_clean(p_body->>k, 400)); end if;
  end loop;
  if p_auto is not null and length(p_auto::text) > 12000 then p_auto := null; end if;
  insert into live_reflections (class_id, lesson_id, account_id, jst_date, understanding, mode, body, auto_eval, flag)
    values (a.class_id, p_lesson_id, a.account_id, _live_today(), p_understanding,
            case when p_mode = 'deep' then 'deep' else 'light' end, v_body, p_auto,
            case when p_flag in ('sos', 'help') then p_flag end)
  on conflict (account_id, lesson_id, jst_date) do update set
    understanding = excluded.understanding, mode = excluded.mode, body = excluded.body,
    auto_eval = excluded.auto_eval, flag = excluded.flag, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_my_records(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a live_accounts;
begin
  a := _live_student(p_token);
  if a.account_id is null then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object(
    'attempts', coalesce((select jsonb_agg(jsonb_build_object('lesson_id', lesson_id, 'date', jst_date, 'score', score,
        'max', max_score, 'answers', answers) order by jst_date desc, created_at desc)
      from live_attempts where account_id = a.account_id and not voided), '[]'::jsonb),
    'reflections', coalesce((select jsonb_agg(jsonb_build_object('lesson_id', lesson_id, 'date', jst_date,
        'understanding', understanding, 'mode', mode, 'body', body, 'auto_eval', auto_eval, 'teacher_note', teacher_note)
        order by jst_date desc, updated_at desc)
      from live_reflections where account_id = a.account_id), '[]'::jsonb));
end $$;

-- ---------- 先生 ----------

create or replace function live_t_login(p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_key text := 't_login:' || _live_client_ip();
begin
  select value into v_hash from live_settings where key = 'teacher_pass_hash';
  if v_hash is null then return jsonb_build_object('error', 'not_setup'); end if;
  if _live_rate_locked(v_key) or _live_rate_locked('t_login:all') then return jsonb_build_object('error', 'locked'); end if;
  if crypt(coalesce(p_pass, ''), v_hash) <> v_hash then
    perform _live_rate_hit(v_key, 8, interval '10 minutes', interval '15 minutes');
    perform _live_rate_hit('t_login:all', 60, interval '1 hour', interval '30 minutes');
    return jsonb_build_object('error', 'bad_pass');
  end if;
  perform _live_rate_clear(v_key);
  return jsonb_build_object('ok', true, 'token', _live_new_token('t', null, 12));
end $$;

create or replace function live_t_logout(p_token text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  with d as (delete from live_tokens where token_hash = _live_hash(p_token) and role = 't') select jsonb_build_object('ok', true)
$$;

create or replace function live_t_change_pass(p_token text, p_old text, p_new text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  select value into v_hash from live_settings where key = 'teacher_pass_hash';
  if crypt(coalesce(p_old, ''), v_hash) <> v_hash then return jsonb_build_object('error', 'bad_pass'); end if;
  if char_length(coalesce(p_new, '')) < 8 then return jsonb_build_object('error', 'weak_password'); end if;
  update live_settings set value = crypt(p_new, gen_salt('bf', 8)) where key = 'teacher_pass_hash';
  delete from live_tokens where role = 't' and token_hash <> _live_hash(p_token);
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_t_classes(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object('classes', coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'school', c.school, 'grade', c.grade, 'class_no', c.class_no,
      'label', _live_class_label(c), 'join_code', c.join_code, 'join_open', c.join_open,
      'students', (select count(*) from live_accounts a where a.class_id = c.id),
      'online', (select count(*) from live_status st where st.class_id = c.id and st.last_seen > now() - interval '40 seconds'),
      'lesson_id', s.lesson_id) order by c.school, c.grade, c.class_no)
    from live_classes c left join live_class_state s on s.class_id = c.id
  ), '[]'::jsonb));
end $$;

create or replace function live_t_class_create(p_token text, p_school text, p_grade int, p_class_no int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_school text := upper(btrim(coalesce(p_school, '')));
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  if v_school !~ '^[A-Z]-[0-9]{1,3}$' then return jsonb_build_object('error', 'bad_school'); end if;
  if p_grade not between 1 and 3 or p_class_no not between 1 and 9 then return jsonb_build_object('error', 'bad_class'); end if;
  begin
    insert into live_classes (school, grade, class_no, join_code) values (v_school, p_grade, p_class_no, _live_join_code())
      returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('error', 'exists');
  end;
  insert into live_class_state (class_id) values (v_id) on conflict do nothing;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function live_t_class_join(p_token text, p_class_id uuid, p_open boolean, p_regen boolean default false)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  update live_classes set join_open = coalesce(p_open, join_open),
    join_code = case when p_regen then _live_join_code() else join_code end
  where id = p_class_id;
  return jsonb_build_object('ok', true, 'join_code', (select join_code from live_classes where id = p_class_id));
end $$;

-- 授業の状態を変える（許可したキーだけ）。p_patch の例:
--  {"lesson_id":"1-3"} {"meate":"..."} {"quiz_lesson":"1-2","quiz_limit_sec":420} {"reflect_lesson":"1-3","reflect_mode":"deep"}
--  {"timer_sec":300,"timer_label":"問題演習"} {"timer_stop":true} {"task_next":true,"task_label":"問1〜3"}
--  {"poll":{...}} {"poll_open":false} {"poll_show":true} {"poll_clear":true} {"share_posts":false} {"notice":"..."}
create or replace function live_t_set(p_token text, p_class_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s live_class_state; v_poll jsonb; v_kind text;
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or length(p_patch::text) > 6000 then return jsonb_build_object('error', 'bad_patch'); end if;
  insert into live_class_state (class_id) select id from live_classes where id = p_class_id on conflict do nothing;
  select * into s from live_class_state where class_id = p_class_id for update;
  if not found then return jsonb_build_object('error', 'no_class'); end if;

  if p_patch ? 'lesson_id' then
    if not _live_lesson_ok(p_patch->>'lesson_id') then return jsonb_build_object('error', 'bad_lesson'); end if;
    if (p_patch->>'lesson_id') is distinct from s.lesson_id then
      s.lesson_id := p_patch->>'lesson_id';
      s.lesson_started_at := case when s.lesson_id is null then null else now() end;
      s.timer_end := null; s.timer_total := null; s.timer_label := null;
      s.task_no := 0; s.task_label := null; s.poll := null; s.notice := null;
      update live_status set lost_at = null, hand_at = null, help_at = null, done_task = null, done_at = null where class_id = p_class_id;
    end if;
  end if;
  if p_patch ? 'meate' then s.meate := nullif(_live_clean(p_patch->>'meate', 120), ''); end if;
  if p_patch ? 'notice' then s.notice := nullif(_live_clean(p_patch->>'notice', 200), ''); end if;
  if p_patch ? 'quiz_lesson' then
    if not _live_lesson_ok(p_patch->>'quiz_lesson') then return jsonb_build_object('error', 'bad_lesson'); end if;
    s.quiz_lesson := p_patch->>'quiz_lesson';
  end if;
  if p_patch ? 'quiz_limit_sec' then
    s.quiz_limit_sec := case when (p_patch->>'quiz_limit_sec') ~ '^[0-9]{1,4}$' and (p_patch->>'quiz_limit_sec')::int between 30 and 3600
      then (p_patch->>'quiz_limit_sec')::int end;
  end if;
  if p_patch ? 'reflect_lesson' then
    if not _live_lesson_ok(p_patch->>'reflect_lesson') then return jsonb_build_object('error', 'bad_lesson'); end if;
    s.reflect_lesson := p_patch->>'reflect_lesson';
  end if;
  if p_patch ? 'reflect_mode' then s.reflect_mode := case when p_patch->>'reflect_mode' = 'deep' then 'deep' else 'light' end; end if;
  if p_patch ? 'share_posts' then s.share_posts := coalesce((p_patch->>'share_posts')::boolean, true); end if;
  if p_patch ? 'timer_sec' then
    if (p_patch->>'timer_sec') !~ '^[0-9]{1,5}$' or (p_patch->>'timer_sec')::int not between 5 and 7200 then return jsonb_build_object('error', 'bad_timer'); end if;
    s.timer_total := (p_patch->>'timer_sec')::int;
    s.timer_end := now() + make_interval(secs => s.timer_total);
    s.timer_label := nullif(_live_clean(p_patch->>'timer_label', 40), '');
  end if;
  if coalesce((p_patch->>'timer_stop')::boolean, false) then s.timer_end := null; s.timer_total := null; s.timer_label := null; end if;
  if coalesce((p_patch->>'task_next')::boolean, false) then
    s.task_no := s.task_no + 1;
    s.task_label := nullif(_live_clean(p_patch->>'task_label', 60), '');
  end if;
  if coalesce((p_patch->>'task_clear')::boolean, false) then s.task_label := null; end if;
  if p_patch ? 'poll' then
    v_poll := p_patch->'poll';
    v_kind := v_poll->>'kind';
    if v_kind not in ('scale', 'abcd', 'tf', 'num', 'text') then return jsonb_build_object('error', 'bad_poll'); end if;
    s.poll := jsonb_build_object('id', encode(gen_random_bytes(6), 'hex'), 'kind', v_kind,
      'q', _live_clean(v_poll->>'q', 200),
      'options', case when jsonb_typeof(v_poll->'options') = 'array' then v_poll->'options' else '[]'::jsonb end,
      'answer', v_poll->'answer', 'mode', v_poll->>'mode', 'open', true, 'show', false, 'at', now());
  end if;
  if p_patch ? 'poll_open' and s.poll is not null then s.poll := s.poll || jsonb_build_object('open', coalesce((p_patch->>'poll_open')::boolean, false)); end if;
  if p_patch ? 'poll_show' and s.poll is not null then s.poll := s.poll || jsonb_build_object('show', coalesce((p_patch->>'poll_show')::boolean, false)); end if;
  if coalesce((p_patch->>'poll_clear')::boolean, false) then s.poll := null; end if;

  update live_class_state set
    lesson_id = s.lesson_id, lesson_started_at = s.lesson_started_at, meate = s.meate, notice = s.notice,
    quiz_lesson = s.quiz_lesson, quiz_limit_sec = s.quiz_limit_sec, reflect_lesson = s.reflect_lesson, reflect_mode = s.reflect_mode,
    share_posts = s.share_posts, timer_end = s.timer_end, timer_total = s.timer_total, timer_label = s.timer_label,
    task_no = s.task_no, task_label = s.task_label, poll = s.poll, v = s.v + 1, updated_at = now()
  where class_id = p_class_id;
  return jsonb_build_object('ok', true);
end $$;

-- 先生画面の数秒ごとの確認（名簿・反応・投稿・投票・小テストの提出状況）
create or replace function live_t_pulse(p_token text, p_class_id uuid, p_since bigint default 0)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare s live_class_state; v_from timestamptz; v_today date := _live_today(); v_res jsonb;
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  select * into s from live_class_state where class_id = p_class_id;
  if not found then return jsonb_build_object('error', 'no_class'); end if;
  v_from := coalesce(s.lesson_started_at, now() - interval '3 hours');
  v_res := jsonb_build_object('now', now(), 'state', to_jsonb(s));
  v_res := v_res || jsonb_build_object('roster', coalesce((
    select jsonb_agg(jsonb_build_object('id', a.account_id, 'no', a.number,
      'online', st.last_seen > now() - interval '40 seconds', 'seen', st.last_seen,
      'lost', case when st.lost_at > now() - interval '20 minutes' then st.lost_at end,
      'hand', st.hand_at, 'help', st.help_at,
      'done', st.done_task is not null and st.done_task = s.task_no) order by a.number)
    from live_accounts a left join live_status st on st.account_id = a.account_id
    where a.class_id = p_class_id), '[]'::jsonb));
  v_res := v_res || jsonb_build_object('reactions', coalesce((
    select jsonb_object_agg(kind, jsonb_build_object('m1', m1, 'm5', m5, 'all', n))
    from (select kind, count(*) filter (where created_at > now() - interval '1 minute') m1,
                 count(*) filter (where created_at > now() - interval '5 minutes') m5, count(*) n
          from live_reactions where class_id = p_class_id and created_at >= v_from group by kind) r), '{}'::jsonb));
  v_res := v_res || jsonb_build_object('series', coalesce((
    select jsonb_agg(jsonb_build_object('t', t, 'k', kind, 'n', n) order by t)
    from (select date_trunc('minute', created_at) t, kind, count(*) n from live_reactions
          where class_id = p_class_id and created_at >= greatest(v_from, now() - interval '100 minutes')
          group by 1, 2) x), '[]'::jsonb));
  v_res := v_res || jsonb_build_object('posts', coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'body', p.body, 'by', p.account_id,
      'no', (select number from live_accounts where account_id = p.account_id),
      'status', p.status, 'pinned', p.pinned, 'plus', p.plus, 'at', p.created_at) order by p.id)
    from live_posts p where p.class_id = p_class_id and p.created_at >= v_from and p.id > coalesce(p_since, 0)), '[]'::jsonb));
  v_res := v_res || jsonb_build_object('post_meta', coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'plus', p.plus, 'status', p.status, 'pinned', p.pinned))
    from (select * from live_posts where class_id = p_class_id and created_at >= v_from order by id desc limit 80) p), '[]'::jsonb));
  if s.poll is not null then
    v_res := v_res || jsonb_build_object('poll_answers', coalesce((
      select jsonb_agg(jsonb_build_object('by', pa.account_id, 'a', pa.answer))
      from live_poll_answers pa where pa.poll_id = s.poll->>'id'), '[]'::jsonb));
  end if;
  if s.quiz_lesson is not null then
    v_res := v_res || jsonb_build_object('quiz', (
      select jsonb_build_object('n', count(*), 'avg', round(avg(least(score, max_score)::numeric / nullif(max_score, 0)) * 100),
        'by', coalesce(jsonb_agg(account_id), '[]'::jsonb),
        'items', (select coalesce(jsonb_object_agg(k, jsonb_build_object('ok', ok, 'n', n)), '{}'::jsonb) from (
            select it->>'k' k, count(*) filter (where (it->>'ok')::boolean) ok, count(*) n
            from live_attempts at2, jsonb_array_elements(coalesce(at2.answers->'items', '[]'::jsonb)) it
            where at2.class_id = p_class_id and at2.lesson_id = s.quiz_lesson and at2.jst_date = v_today and not at2.voided
            group by 1) q))
      from live_attempts where class_id = p_class_id and lesson_id = s.quiz_lesson and jst_date = v_today and not voided));
  end if;
  if s.reflect_lesson is not null then
    v_res := v_res || jsonb_build_object('reflect', (
      select jsonb_build_object('n', count(*), 'avg', round(avg(understanding)::numeric, 2),
        'dist', jsonb_build_array(count(*) filter (where understanding = 1), count(*) filter (where understanding = 2),
                                  count(*) filter (where understanding = 3), count(*) filter (where understanding = 4)),
        'flags', count(*) filter (where flag is not null), 'by', coalesce(jsonb_agg(account_id), '[]'::jsonb))
      from live_reflections where class_id = p_class_id and lesson_id = s.reflect_lesson and jst_date = v_today));
  end if;
  return v_res;
end $$;

create or replace function live_t_post_update(p_token text, p_post_id bigint, p_status text default null, p_pinned boolean default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  if p_status is not null and p_status not in ('open', 'done', 'hidden') then return jsonb_build_object('error', 'bad_status'); end if;
  update live_posts set status = coalesce(p_status, status), pinned = coalesce(p_pinned, pinned) where id = p_post_id;
  return jsonb_build_object('ok', true);
end $$;

-- わからない／挙手／ヘルプ を解除（p_account_id が null ならクラス全員）
create or replace function live_t_status_clear(p_token text, p_class_id uuid, p_account_id text default null, p_what text default 'all')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  update live_status set
    lost_at = case when p_what in ('lost', 'all') then null else lost_at end,
    hand_at = case when p_what in ('hand', 'all') then null else hand_at end,
    help_at = case when p_what in ('help', 'all') then null else help_at end
  where class_id = p_class_id and (p_account_id is null or account_id = p_account_id);
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_t_results(p_token text, p_class_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object('attempts', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'lesson_id', lesson_id, 'by', account_id, 'date', jst_date,
      'score', score, 'max', max_score, 'answers', answers, 'sec', duration_sec, 'voided', voided, 'at', created_at)
      order by created_at)
    from live_attempts where class_id = p_class_id), '[]'::jsonb));
end $$;

create or replace function live_t_attempt_void(p_token text, p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_class uuid;
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  update live_attempts set voided = true where id = p_attempt_id returning class_id into v_class;
  if v_class is not null then perform _live_bump(v_class); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_t_reflections(p_token text, p_class_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object('reflections', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'lesson_id', lesson_id, 'by', account_id, 'date', jst_date,
      'understanding', understanding, 'mode', mode, 'body', body, 'auto_eval', auto_eval, 'teacher_eval', teacher_eval,
      'teacher_note', teacher_note, 'flag', flag, 'at', updated_at) order by jst_date, updated_at)
    from live_reflections where class_id = p_class_id), '[]'::jsonb));
end $$;

create or replace function live_t_reflection_update(p_token text, p_id bigint, p_teacher_eval jsonb default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  if p_teacher_eval is not null and length(p_teacher_eval::text) > 4000 then return jsonb_build_object('error', 'too_large'); end if;
  update live_reflections set
    teacher_eval = coalesce(p_teacher_eval, teacher_eval),
    teacher_note = case when p_note is null then teacher_note else nullif(_live_clean(p_note, 300), '') end
  where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function live_t_reflection_delete(p_token text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  delete from live_reflections where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- 反応の記録（授業のふり返り用：何分ごろに「わからない」が増えたか）
create or replace function live_t_reaction_log(p_token text, p_class_id uuid, p_days int default 30)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object('rows', coalesce((
    select jsonb_agg(jsonb_build_object('t', t, 'lesson_id', lesson_id, 'k', kind, 'n', n) order by t)
    from (select date_trunc('minute', created_at) t, lesson_id, kind, count(*) n from live_reactions
          where class_id = p_class_id and created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 180))
          group by 1, 2, 3) x), '[]'::jsonb),
    'posts', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'lesson_id', lesson_id, 'kind', kind, 'body', body, 'by', account_id,
      'status', status, 'plus', plus, 'at', created_at) order by id)
    from live_posts where class_id = p_class_id and created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 180))), '[]'::jsonb));
end $$;

create or replace function live_t_students(p_token text, p_class_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object('students', coalesce((
    select jsonb_agg(jsonb_build_object('id', a.account_id, 'no', a.number, 'created_at', a.created_at,
      'last_seen', st.last_seen, 'locked', a.locked_until > now(), 'must_change', a.must_change) order by a.number)
    from live_accounts a left join live_status st on st.account_id = a.account_id where a.class_id = p_class_id), '[]'::jsonb));
end $$;

-- パスワードを忘れた生徒：4けたの仮パスワードを発行（ログイン後に変更をうながす）
create or replace function live_t_reset_password(p_token text, p_account_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_tmp text;
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  loop
    v_tmp := lpad(((get_byte(gen_random_bytes(2), 0) * 256 + get_byte(gen_random_bytes(2), 1)) % 10000)::text, 4, '0');
    exit when not _live_weak_pass(v_tmp, 0);
  end loop;
  update live_accounts set pass_hash = crypt(v_tmp, gen_salt('bf', 6)), must_change = true, fail_count = 0, locked_until = null
    where account_id = p_account_id;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  delete from live_tokens where account_id = p_account_id;
  return jsonb_build_object('ok', true, 'temp', v_tmp);
end $$;

-- 番号をまちがえて登録した生徒のアカウントを消す（小テスト・振り返りの記録は残る）
create or replace function live_t_delete_student(p_token text, p_account_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not _live_is_teacher(p_token) then return jsonb_build_object('error', 'auth'); end if;
  delete from live_tokens where account_id = p_account_id;
  delete from live_status where account_id = p_account_id;
  delete from live_accounts where account_id = p_account_id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 管理（SQL Editor からだけ実行できる） ----------
create or replace function live_admin_set_teacher_pass(p_new text) returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if char_length(coalesce(p_new, '')) < 8 then raise exception '合言葉は8文字以上にしてください'; end if;
  insert into live_settings (key, value) values ('teacher_pass_hash', crypt(p_new, gen_salt('bf', 8)))
    on conflict (key) do update set value = excluded.value;
  delete from live_tokens where role = 't';
  delete from live_rate where key like 't_login:%';
  return 'ok';
end $$;

-- ---------- 権限：内部関数と管理関数は anon / authenticated から実行不可 ----------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like '\_live\_%' or p.proname like 'live\_admin\_%')
  loop
    execute format('revoke all on function %s from public', f.sig);
    begin
      execute format('revoke all on function %s from anon, authenticated', f.sig);
    exception when undefined_object then null;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';

-- ============================================================
-- ★初回だけ：先生の合言葉を設定（8文字以上。下の例を書きかえて、この1行だけ実行）
--   select live_admin_set_teacher_pass('ここに合言葉');
-- ============================================================
