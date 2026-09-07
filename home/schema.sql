-- ============================================================
-- 家庭学習アプリ スキーマ（1年4章 比例と反比例 試作）
-- ★ math-labo-second（数学ラボ2）の Supabase プロジェクトに相乗り。
--   既存の attempts / feedback / quiz_* / applied_* と衝突しないよう、
--   家庭学習用オブジェクトはすべて "study_" 接頭辞で隔離（public スキーマのまま）。
--   → SQL Editor に貼って Run するだけ。ダッシュボードのスキーマ公開設定は不要。
--
-- 個人情報は保存しません（学籍番号=4桁の数字のみ）。
-- 問題データ・採点は studydata.js / engine.js（ブラウザ内）。
-- サーバーは「学習セッションの記録」だけを保存します。
--
-- 学習時間は「⏱の自動計測」ではなく、
-- 生徒が学習おわり／×のときに自己申告した分数（reported_minutes）を主とし、
-- auto_seconds は目安として併記します。
-- ============================================================

-- 1回の家庭学習セッション
create table if not exists study_sessions (
  id               uuid primary key default gen_random_uuid(),
  student_code     text not null,               -- 例: 1203
  unit             text not null,               -- M1-04-1 .. M1-04-8 / "mix"
  level            text not null default 'mix', -- 基本 / 標準 / 応用 / mix
  jst_date         date not null,
  reported_minutes int,                          -- 自己申告（null = 申告なし＝タブを閉じた等）
  self_reported    boolean not null default true,
  auto_seconds     int  not null default 0,      -- 自動計測（目安）
  solved           int  not null default 0,      -- 解いた問題数（異なり）
  correct          int  not null default 0,      -- 正解した問題数（異なり）
  challenge_count  int  not null default 0,      -- 応用にチャレンジした数
  redo_count       int  not null default 0,      -- やり直した問題数
  created_at       timestamptz not null default now()
);
create index if not exists study_sessions_student_idx on study_sessions (student_code, jst_date);
create index if not exists study_sessions_date_idx on study_sessions (jst_date);

-- セッション内の1問ごとの記録（分析用）
create table if not exists study_items (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references study_sessions(id) on delete cascade,
  problem_id  text not null,
  unit        text,
  level       text,                              -- 基本 / 標準 / 応用
  prompt      text,                              -- 設問文（先頭120字）
  raw_answer  text,
  is_correct  boolean not null,
  is_redo     boolean not null default false,    -- ×のあとの「もう一度」か
  attempt_no  int not null default 1,
  elapsed_ms  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists study_items_session_idx on study_items (session_id);
create index if not exists study_items_problem_idx on study_items (problem_id);

create table if not exists study_settings (
  key text primary key,
  value text not null
);
insert into study_settings (key, value) values ('teacher_pin', '0000')
on conflict (key) do nothing;

-- ---------- RLS：直接アクセス全拒否（RPC 経由のみ） ----------
alter table study_sessions enable row level security;
alter table study_items    enable row level security;
alter table study_settings enable row level security;

create or replace function study_check_pin(p_pin text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from study_settings where key='teacher_pin' and value=coalesce(p_pin,''));
$$;

-- ---------- 生徒用 RPC（PIN 不要） ----------

-- セッション提出。items から集計値をサーバー側で計算して保存する。
create or replace function study_submit(
  p_student text, p_unit text, p_level text,
  p_reported_minutes int, p_auto_seconds int, p_items jsonb,
  p_self_reported boolean default true
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_id uuid;
  v_solved int := 0; v_correct int := 0; v_challenge int := 0; v_redo int := 0;
  r jsonb;
begin
  if coalesce(p_student,'') !~ '^[0-9]{3,6}$' then
    return jsonb_build_object('error','bad_student');
  end if;

  with it as (
    select * from jsonb_to_recordset(coalesce(p_items,'[]'::jsonb))
      as x(problem_id text, unit text, level text, prompt text, raw text,
            ok boolean, redo boolean, attempt_no int, ms int)
  )
  select
    count(distinct problem_id),
    count(distinct problem_id) filter (where problem_id in (select problem_id from it where ok)),
    count(distinct problem_id) filter (where level = '応用'),
    count(distinct problem_id) filter (where problem_id in (select problem_id from it where coalesce(attempt_no,1) >= 2))
  into v_solved, v_correct, v_challenge, v_redo
  from it;

  insert into study_sessions (student_code, unit, level, jst_date, reported_minutes,
    self_reported, auto_seconds, solved, correct, challenge_count, redo_count)
  values (p_student, left(coalesce(p_unit,'mix'),20), left(coalesce(p_level,'mix'),10), v_today,
    p_reported_minutes, coalesce(p_self_reported,true), coalesce(p_auto_seconds,0),
    coalesce(v_solved,0), coalesce(v_correct,0), coalesce(v_challenge,0), coalesce(v_redo,0))
  returning id into v_id;

  for r in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    insert into study_items (session_id, problem_id, unit, level, prompt, raw_answer,
      is_correct, is_redo, attempt_no, elapsed_ms)
    values (v_id,
      left(coalesce(r->>'problem_id',''),40),
      left(coalesce(r->>'unit',''),20),
      left(coalesce(r->>'level',''),10),
      left(coalesce(r->>'prompt',''),120),
      left(coalesce(r->>'raw',''),200),
      coalesce((r->>'ok')::boolean,false),
      coalesce((r->>'redo')::boolean,false),
      coalesce((r->>'attempt_no')::int,1),
      coalesce((r->>'ms')::int,0));
  end loop;

  return jsonb_build_object('ok',true,'session_id',v_id,
    'solved',v_solved,'correct',v_correct,'challenge',v_challenge,'redo',v_redo);
end $$;

-- 生徒が自分の記録（可視化）を見るための取得。PIN 不要（個人情報なし・4桁コードのみ）。
create or replace function study_my_history(p_student text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_student,'') !~ '^[0-9]{3,6}$' then
    return jsonb_build_object('error','bad_student');
  end if;
  return jsonb_build_object('sessions', coalesce((
    select jsonb_agg(jsonb_build_object(
      'date', jst_date, 'unit', unit, 'level', level,
      'minutes', reported_minutes, 'auto_seconds', auto_seconds,
      'solved', solved, 'correct', correct,
      'challenge', challenge_count, 'redo', redo_count,
      'created_at', created_at
    ) order by created_at)
    from study_sessions where student_code = p_student
  ), '[]'::jsonb));
end $$;

-- ---------- 教師用 RPC（PIN 必須） ----------

create or replace function study_verify_pin(p_pin text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('ok', study_check_pin(p_pin));
$$;

create or replace function study_get_sessions(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not study_check_pin(p_pin) then return jsonb_build_object('error','bad_pin'); end if;
  return jsonb_build_object('sessions', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'student_id', student_code, 'unit', unit, 'level', level, 'date', jst_date,
      'minutes', reported_minutes, 'self_reported', self_reported, 'auto_seconds', auto_seconds,
      'solved', solved, 'correct', correct, 'challenge', challenge_count, 'redo', redo_count,
      'created_at', created_at
    ) order by created_at desc)
    from study_sessions
  ), '[]'::jsonb));
end $$;

create or replace function study_get_items(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not study_check_pin(p_pin) then return jsonb_build_object('error','bad_pin'); end if;
  return jsonb_build_object('items', coalesce((
    select jsonb_agg(jsonb_build_object(
      'session_id', si.session_id, 'student_id', s.student_code, 'date', s.jst_date,
      'problem_id', si.problem_id, 'unit', si.unit, 'level', si.level, 'prompt', si.prompt,
      'raw_answer', si.raw_answer, 'is_correct', si.is_correct, 'is_redo', si.is_redo,
      'attempt_no', si.attempt_no, 'elapsed_ms', si.elapsed_ms
    ) order by s.created_at desc)
    from study_items si join study_sessions s on s.id = si.session_id
  ), '[]'::jsonb));
end $$;

create or replace function study_set_pin(p_old text, p_new text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not study_check_pin(p_old) then return jsonb_build_object('error','bad_pin'); end if;
  if coalesce(p_new,'') !~ '^[0-9]{4,8}$' then return jsonb_build_object('error','bad_new'); end if;
  update study_settings set value = p_new where key = 'teacher_pin';
  return jsonb_build_object('ok', true);
end $$;
