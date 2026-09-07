-- ============================================================
-- 応用チャレンジツール スキーマ（1年4章 比例と反比例）
-- ★ math-labo-second（数学ラボ2）の Supabase プロジェクトに相乗りする前提の分離版。
--   既存の attempts / feedback / player_state / students / quiz_* と衝突しないよう、
--   応用チャレンジ用オブジェクトはすべて "applied_" 接頭辞で隔離してあります（public スキーマのまま）。
--   → Supabase ダッシュボードでのスキーマ公開設定は不要。SQL Editor に貼って Run するだけ。
--
-- 個人情報は保存しません（学籍番号=4桁の数字のみ、例：1203＝1年2組3番）。
-- 問題データ・採点ロジックはすべてクライアント側（problems.js / engine.js）にあり、
-- サーバーは「提出結果（設問ごとに何を書いたか）」だけを管理します。
--
-- 小テスト(quiz_*)との違い：
--   ・「配布 ON/OFF」ゲートなし。QR を読めばいつでも挑戦できる。
--   ・1日1回制限なし。何度でも挑戦でき、そのつど1行記録される（伸びを追える）。
-- ============================================================

-- ---------- テーブル ----------

-- 提出1回＝1行（同じ生徒が何度提出してもよい）
create table if not exists applied_attempts (
  id           uuid primary key default gen_random_uuid(),
  set_id       text not null,                -- problems.js の SETS[].id（例: M1-04-3）
  student_code text not null,                -- 例: 1203（1年2組3番）
  score        int  not null,
  max_score    int  not null,
  jst_date     date not null,
  created_at   timestamptz not null default now()
);
create index if not exists applied_attempts_set_idx on applied_attempts (set_id, created_at desc);

-- 提出の内訳（設問ごと）。教師ダッシュボードの「間違い情報」の中心
create table if not exists applied_attempt_rows (
  id          bigint generated always as identity primary key,
  attempt_id  uuid not null references applied_attempts(id) on delete cascade,
  q_no        text not null,
  prompt      text,                          -- 設問文（先頭120字。ダッシュボードで問題を特定するため）
  raw_answer  text,                          -- 生徒が書いた答え（そのまま）
  is_correct  boolean not null,
  score       int not null default 0,
  max_score   int not null default 0,
  elapsed_ms  int not null default 0
);
create index if not exists applied_attempt_rows_attempt_idx on applied_attempt_rows (attempt_id);

-- 応用チャレンジ用の設定（教師PINなど）。数学ラボ2の app_settings とも quiz_settings とも別物
create table if not exists applied_settings (
  key   text primary key,
  value text not null
);

-- 初期PIN（必ず後で変更してください。README参照）
insert into applied_settings (key, value) values ('teacher_pin', '0000')
on conflict (key) do nothing;

-- ---------- RLS: 直接アクセスは全面禁止（RPC経由のみ） ----------

alter table applied_attempts     enable row level security;
alter table applied_attempt_rows enable row level security;
alter table applied_settings     enable row level security;
-- ポリシーを一切作らない = anon キーからの直接 select/insert はすべて拒否

-- ---------- 内部ヘルパー ----------

create or replace function applied_check_pin(p_pin text) returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from applied_settings
    where key = 'teacher_pin' and value = coalesce(p_pin, '')
  );
$$;

-- ---------- 生徒用 RPC（PIN不要） ----------

-- 解答提出（採点はクライアント側で完了済みのものを受け取り、そのまま記録する）
create or replace function applied_submit(p_set_id text, p_student text, p_score int, p_max int, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_attempt_id uuid;
  v_row jsonb;
begin
  if coalesce(p_student, '') !~ '^[0-9]{3,6}$' then
    return jsonb_build_object('error', 'bad_student');
  end if;
  if coalesce(p_set_id, '') !~ '^[A-Za-z0-9_-]{1,40}$' then
    return jsonb_build_object('error', 'bad_set');
  end if;

  insert into applied_attempts (set_id, student_code, score, max_score, jst_date)
    values (p_set_id, p_student, coalesce(p_score,0), coalesce(p_max,0), v_today)
    returning id into v_attempt_id;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    insert into applied_attempt_rows (attempt_id, q_no, prompt, raw_answer, is_correct, score, max_score, elapsed_ms)
    values (
      v_attempt_id,
      left(coalesce(v_row->>'q_no', ''), 20),
      left(coalesce(v_row->>'prompt', ''), 120),
      left(coalesce(v_row->>'raw', ''), 200),
      coalesce((v_row->>'ok')::boolean, false),
      coalesce((v_row->>'score')::int, 0),
      coalesce((v_row->>'max')::int, 0),
      coalesce((v_row->>'ms')::int, 0)
    );
  end loop;

  return jsonb_build_object('ok', true, 'attempt_id', v_attempt_id);
end $$;

-- ---------- 教師用 RPC（すべてPIN必須） ----------

create or replace function applied_verify_pin(p_pin text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('ok', applied_check_pin(p_pin));
$$;

-- ダッシュボード用の生データ（生徒×セット×設問の1行ずつ、新しい順）
create or replace function applied_get_rows(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not applied_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  return jsonb_build_object('rows', coalesce((
    select jsonb_agg(row order by row->>'timestamp' desc)
    from (
      select jsonb_build_object(
        'timestamp',  a.created_at,
        'jst_date',   a.jst_date,
        'student_id', a.student_code,
        'set_id',     a.set_id,
        'attempt_id', a.id,
        'q_no',       ar.q_no,
        'prompt',     ar.prompt,
        'raw_answer', ar.raw_answer,
        'is_correct', ar.is_correct,
        'score',      ar.score,
        'max_score',  ar.max_score,
        'elapsed_ms', ar.elapsed_ms
      ) as row
      from applied_attempts a
      join applied_attempt_rows ar on ar.attempt_id = a.id
    ) t
  ), '[]'::jsonb));
end $$;

-- ある生徒の、あるセットの提出履歴をすべて消す（入力ミス等の救済用）
create or replace function applied_clear_student(p_pin text, p_set_id text, p_student text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not applied_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  delete from applied_attempts where set_id = p_set_id and student_code = p_student;
  return jsonb_build_object('ok', true);
end $$;

-- 教師PINの変更
create or replace function applied_set_pin(p_old text, p_new text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not applied_check_pin(p_old) then return jsonb_build_object('error', 'bad_pin'); end if;
  if coalesce(p_new, '') !~ '^[0-9]{4,8}$' then return jsonb_build_object('error', 'bad_new'); end if;
  update applied_settings set value = p_new where key = 'teacher_pin';
  return jsonb_build_object('ok', true);
end $$;
