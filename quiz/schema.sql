-- ============================================================
-- 数学小テストツール スキーマ（1年4章 比例と反比例）
-- ★ math-labo-second（数学ラボ2）のSupabaseプロジェクトに相乗りする前提の分離版。
--   既存の attempts / feedback / player_state / students と衝突しないよう、
--   小テスト用オブジェクトはすべて "quiz_" 接頭辞で隔離してあります（public スキーマのまま）。
--   → Supabaseダッシュボードでのスキーマ公開設定は不要。SQL Editorに貼って Run するだけ。
--
-- 個人情報は保存しません（学籍番号=4桁の数字のみ、例：1203＝1年2組3番）。
-- 問題データ・採点ロジックはすべてクライアント側（quizdata.js）にあり、
-- サーバーは「どのテストが配布中か」と「提出結果」だけを管理します。
-- ============================================================

-- ---------- テーブル ----------

-- どの小テスト（quiz_id は quizdata.js の CH[].id と一致）が今配布中か
create table if not exists quiz_state (
  quiz_id    text primary key,
  is_active  boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 提出1回＝1行（同じ生徒×テスト×日付は1回まで）
create table if not exists quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      text not null,
  student_code text not null,               -- 例: 1203（1年2組3番）
  score        int  not null,
  max_score    int  not null,
  jst_date     date not null,
  created_at   timestamptz not null default now(),
  unique (quiz_id, student_code, jst_date)
);

-- 提出の内訳（設問ごと）。教師ダッシュボードの問題別分析に使う
create table if not exists quiz_attempt_rows (
  id          bigint generated always as identity primary key,
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  q_no        text not null,
  raw_answer  text,
  is_correct  boolean not null,
  score       int not null default 0,
  max_score   int not null default 0,
  elapsed_ms  int not null default 0
);

-- 小テスト用の設定（教師PINなど）。math-labo-second の app_settings とは別物
create table if not exists quiz_settings (
  key   text primary key,
  value text not null
);

-- 初期PIN（必ず後で変更してください。README参照）
insert into quiz_settings (key, value) values ('teacher_pin', '0000')
on conflict (key) do nothing;

-- ---------- RLS: 直接アクセスは全面禁止（RPC経由のみ） ----------

alter table quiz_state        enable row level security;
alter table quiz_attempts     enable row level security;
alter table quiz_attempt_rows enable row level security;
alter table quiz_settings     enable row level security;
-- ポリシーを一切作らない = anon キーからの直接 select/insert はすべて拒否

-- ---------- 内部ヘルパー ----------

create or replace function quiz_check_pin(p_pin text) returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from quiz_settings
    where key = 'teacher_pin' and value = coalesce(p_pin, '')
  );
$$;

-- ---------- 生徒用 RPC（PIN不要） ----------

-- 配布中の quiz_id 一覧（生徒のホーム画面・QR待ち画面のポーリングで使う）
create or replace function quiz_list_active()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(quiz_id), '[]'::jsonb) from quiz_state where is_active;
$$;

-- 特定のテストが受けられるか（配布中か／今日すでに提出済みか）を確認
create or replace function quiz_check(p_quiz_id text, p_student text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_active boolean;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_score int; v_max int; v_found boolean;
begin
  select coalesce((select is_active from quiz_state where quiz_id = p_quiz_id), false) into v_active;
  select score, max_score into v_score, v_max from quiz_attempts
    where quiz_id = p_quiz_id and student_code = p_student and jst_date = v_today;
  v_found := found;
  return jsonb_build_object('active', v_active, 'already_today', v_found, 'score', v_score, 'max', v_max);
end $$;

-- 解答提出（採点はクライアント側で完了済みのものを受け取り、そのまま記録する）
create or replace function quiz_submit(p_quiz_id text, p_student text, p_score int, p_max int, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_active boolean;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_attempt_id uuid;
  v_row jsonb;
begin
  if coalesce(p_student, '') !~ '^[0-9]{3,6}$' then
    return jsonb_build_object('error', 'bad_student');
  end if;

  select coalesce((select is_active from quiz_state where quiz_id = p_quiz_id), false) into v_active;
  if not v_active then
    return jsonb_build_object('error', 'inactive');
  end if;

  insert into quiz_attempts (quiz_id, student_code, score, max_score, jst_date)
    values (p_quiz_id, p_student, coalesce(p_score,0), coalesce(p_max,0), v_today)
    returning id into v_attempt_id;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    insert into quiz_attempt_rows (attempt_id, q_no, raw_answer, is_correct, score, max_score, elapsed_ms)
    values (
      v_attempt_id,
      coalesce(v_row->>'q_no', ''),
      v_row->>'raw',
      coalesce((v_row->>'ok')::boolean, false),
      coalesce((v_row->>'score')::int, 0),
      coalesce((v_row->>'max')::int, 0),
      coalesce((v_row->>'ms')::int, 0)
    );
  end loop;

  return jsonb_build_object('ok', true);
exception when unique_violation then
  return jsonb_build_object('error', 'already_today');
end $$;

-- ---------- 教師用 RPC（すべてPIN必須） ----------

create or replace function quiz_verify_pin(p_pin text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('ok', quiz_check_pin(p_pin));
$$;

-- 小テストの配布状態一覧
create or replace function quiz_list_state(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  return jsonb_build_object('states', coalesce((
    select jsonb_agg(jsonb_build_object('quiz_id', qs.quiz_id, 'is_active', qs.is_active))
    from quiz_state qs
  ), '[]'::jsonb));
end $$;

-- 配布の開始／停止（quiz_id は quizdata.js の CH[].id）
create or replace function quiz_set_active(p_pin text, p_quiz_id text, p_active boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  insert into quiz_state (quiz_id, is_active, updated_at)
    values (p_quiz_id, p_active, now())
    on conflict (quiz_id) do update set is_active = excluded.is_active, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- ダッシュボード用の生データ（生徒×テスト×設問の1行ずつ）
create or replace function quiz_get_rows(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  return jsonb_build_object('rows', coalesce((
    select jsonb_agg(jsonb_build_object(
      'timestamp', a.created_at,
      'student_id', a.student_code,
      'quiz_id', a.quiz_id,
      'q_no', ar.q_no,
      'raw_answer', ar.raw_answer,
      'is_correct', ar.is_correct,
      'score', ar.score,
      'max_score', ar.max_score,
      'elapsed_ms', ar.elapsed_ms
    ))
    from quiz_attempts a join quiz_attempt_rows ar on ar.attempt_id = a.id
  ), '[]'::jsonb));
end $$;

-- ある生徒に、そのテストの「本日分」だけ再挑戦を許可する（入力ミス等の救済用）
create or replace function quiz_allow_retry(p_pin text, p_quiz_id text, p_student text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  delete from quiz_attempts where quiz_id = p_quiz_id and student_code = p_student
    and jst_date = (now() at time zone 'Asia/Tokyo')::date;
  return jsonb_build_object('ok', true);
end $$;
