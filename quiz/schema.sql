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

-- どの小テスト（quiz_id は quizdata.js の CH[].id と一致）が「どの学校・どのクラス」に今配布中か。
-- 2026-09-11: quiz_id 単位のグローバルな1状態から、(quiz_id, school, class) 単位の状態へ再設計。
-- 以前は配布すると学校・クラスに関係なく全員に見えていたが、それを避けるため。
-- 配布状態はその場限りの運用データ（成績・振り返りの記録とは別）なので、作り直しても実害は無い。
drop table if exists quiz_state cascade;
create table quiz_state (
  quiz_id           text not null,             -- quizdata.js の CH[].id
  school            text not null,             -- 学校コード（例: E-10）
  class             text not null,             -- クラス（例: 1-1 ＝ 1年1組）
  is_active         boolean not null default false, -- 小テスト本体の配布
  reflection_active boolean not null default false, -- 「授業を開始」＝振り返りの受付（小テストとは独立）
  time_limit_sec    int,                      -- 制限時間の上書き（秒）。nullならquizdata.jsの既定値を使う
  updated_at        timestamptz not null default now(),
  primary key (quiz_id, school, class)
);

-- account_id（例 E-101236）から学校コード・クラスを取り出す内部ヘルパー。
-- index.html の parseAccountId/schoolOf/classOf と同じ規則（末尾4桁が出席番号、残りが学校コード数字部）。
create or replace function _quiz_parse_account(p_account_id text, out school text, out class text)
language plpgsql immutable as $$
declare
  m text[]; rest text; sid4 text; groupnum text;
begin
  m := regexp_match(coalesce(p_account_id,''), '^([A-Z])-([0-9]{5,7})$');
  if m is null then school := null; class := null; return; end if;
  rest := m[2];
  sid4 := right(rest, 4);
  groupnum := left(rest, length(rest)-4);
  school := m[1] || '-' || groupnum;
  class := substr(sid4,1,1) || '-' || substr(sid4,2,1);
end $$;

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

-- ---------- アカウント（学校名を出さずにログインするための合言葉方式） ----------
-- account_id の形式: "E-101236" のように「学校コード(例:E-10、先生が生徒に口頭で伝える合言葉)」
--   + 「出席番号4桁(例:1236＝1年2組36番)」を連結したもの。実際の学校名はどこにも保存しない。
-- パスワードは pgcrypto (bf=bcrypt) でハッシュ化して保存し、平文は保存しない。

create extension if not exists pgcrypto;

create table if not exists quiz_accounts (
  account_id    text primary key,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
alter table quiz_accounts enable row level security;
-- ポリシーを一切作らない = anonキーからの直接アクセスは全拒否（RPC経由のみ）

-- 新規登録: IDと平文パスワードを受け取り、ハッシュ化して保存する
-- ※ Supabase では pgcrypto が public でなく extensions スキーマに入るため、
--   search_path に extensions を含めないと crypt()/gen_salt() が見つからない。
create or replace function quiz_register(p_account_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(p_account_id, '') !~ '^[A-Z]-[0-9]{5,7}$' then
    return jsonb_build_object('error', 'bad_id');
  end if;
  if length(coalesce(p_password, '')) < 4 then
    return jsonb_build_object('error', 'weak_password');
  end if;
  begin
    insert into quiz_accounts (account_id, password_hash)
      values (p_account_id, crypt(p_password, gen_salt('bf')));
  exception when unique_violation then
    return jsonb_build_object('error', 'id_taken');
  end;
  return jsonb_build_object('ok', true);
end $$;

-- ログイン確認: IDとパスワードの組が正しいかだけを返す（セッション等は持たない軽量方式）
create or replace function quiz_login(p_account_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from quiz_accounts where account_id = p_account_id;
  if not found then
    return jsonb_build_object('error', 'no_such_id');
  end if;
  if crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    return jsonb_build_object('error', 'bad_password');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 生徒用 RPC（PIN不要） ----------

-- p_student（アカウントID）本人の学校・クラスに配布中の quiz_id 一覧（生徒のホーム画面・QR待ち画面のポーリングで使う）。
-- 本人のIDが未指定/不正な形式なら空配列（＝ログイン前は何も見えない）。
create or replace function quiz_list_active(p_student text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_school text; v_class text;
begin
  select school, class into v_school, v_class from _quiz_parse_account(p_student);
  if v_school is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(quiz_id) from quiz_state
    where school=v_school and class=v_class and is_active), '[]'::jsonb);
end $$;

-- 振り返りだけ配布中の quiz_id 一覧（本人の学校・クラスのみ。小テストはやらないが振り返りは書かせたい授業用）
create or replace function quiz_list_reflect_active(p_student text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_school text; v_class text;
begin
  select school, class into v_school, v_class from _quiz_parse_account(p_student);
  if v_school is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(quiz_id) from quiz_state
    where school=v_school and class=v_class and reflection_active), '[]'::jsonb);
end $$;

-- 特定のテストが受けられるか（本人の学校・クラスで配布中か／今日すでに提出済みか）を確認
create or replace function quiz_check(p_quiz_id text, p_student text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school text; v_class text;
  v_active boolean;
  v_limit int;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_score int; v_max int; v_found boolean;
begin
  select school, class into v_school, v_class from _quiz_parse_account(p_student);
  select is_active, time_limit_sec into v_active, v_limit from quiz_state
    where quiz_id = p_quiz_id and school=v_school and class=v_class;
  v_active := coalesce(v_active, false);
  select score, max_score into v_score, v_max from quiz_attempts
    where quiz_id = p_quiz_id and student_code = p_student and jst_date = v_today;
  v_found := found;
  return jsonb_build_object('active', v_active, 'already_today', v_found, 'score', v_score, 'max', v_max,
    'time_limit_sec', v_limit);
end $$;

-- 解答提出（採点はクライアント側で完了済みのものを受け取り、そのまま記録する）
create or replace function quiz_submit(p_quiz_id text, p_student text, p_score int, p_max int, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school text; v_class text;
  v_active boolean;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_attempt_id uuid;
  v_row jsonb;
begin
  if coalesce(p_student, '') !~ '^[A-Z]-[0-9]{5,7}$' then
    return jsonb_build_object('error', 'bad_student');
  end if;

  select school, class into v_school, v_class from _quiz_parse_account(p_student);
  select coalesce((select is_active from quiz_state
    where quiz_id = p_quiz_id and school=v_school and class=v_class), false) into v_active;
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

-- ---------- 振り返り（配布中の小テストに紐づく。ログイン済みアカウントのみ・同じ日は上書き） ----------
-- 振り返りは「今日の気分」ではなく「この授業（quiz_id）の振り返り」。小テストが配布中の間だけ書け、
-- 停止されると（=quiz_stateのis_activeがfalseになると）新規の記入・上書きもできなくなる。

create table if not exists quiz_reflections (
  id            bigint generated always as identity primary key,
  account_id    text not null,
  quiz_id       text not null default 'unknown', -- どの授業(小テスト回)の振り返りか。quizdata.js の CH[].id と一致
  jst_date      date not null,
  understanding int  not null,             -- 授業の理解度 1〜4（4が一番よい）
  effort        int  not null,             -- 意欲・態度 1〜4（4が一番よい）
  score         int,                       -- 今日の小テストの点数（任意）
  comment       text,                      -- 振り返り記入欄（質問・困っていることも可・任意）
  checks        jsonb,                     -- reflection-sheet/ と同じ6観点チェック配列（コピー疑いのときはnull）
  flag          boolean not null default false, -- ⚠要フォロー（SOS・空回りの兆候）
  good          boolean not null default false, -- ⭐得意サイン
  is_duplicate  boolean not null default false, -- 📋コピー使い回しの疑い
  duplicate_date date,                     -- 使い回し元と疑われる過去の振り返りの日付
  toikaeshi     text,                      -- 本人への問い返し（その場のフィードバック）
  warning       text,                      -- 本人への警告（コピー疑いなど）
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (account_id, quiz_id, jst_date)
);
alter table quiz_reflections enable row level security;
-- ポリシーを一切作らない = anonキーからの直接アクセスは全拒否（RPC経由のみ）

-- 移行: quiz_id 列がまだ無い旧バージョンのテーブルに追加し、一意制約を account_id×日付 から
-- account_id×quiz_id×日付 へ張り替える（新規作成時は上のcreate tableで既に正しい形なので実質no-op）
alter table quiz_reflections add column if not exists quiz_id text not null default 'unknown';
alter table quiz_reflections drop constraint if exists quiz_reflections_account_id_jst_date_key;
alter table quiz_reflections drop constraint if exists quiz_reflections_account_id_quiz_id_jst_date_key;
alter table quiz_reflections add constraint quiz_reflections_account_id_quiz_id_jst_date_key unique (account_id, quiz_id, jst_date);
-- 移行: reflection-sheet/ 由来の評価カラムをまだ持たない旧テーブルに追加
alter table quiz_reflections add column if not exists checks jsonb;
alter table quiz_reflections add column if not exists flag boolean not null default false;
alter table quiz_reflections add column if not exists good boolean not null default false;
alter table quiz_reflections add column if not exists is_duplicate boolean not null default false;
alter table quiz_reflections add column if not exists duplicate_date date;
alter table quiz_reflections add column if not exists toikaeshi text;
alter table quiz_reflections add column if not exists warning text;

-- 今日の分の振り返りを取得（その quiz_id ・今日の分。無ければ found:false）。フォームの再編集に使う
create or replace function quiz_reflection_get(p_account_id text, p_quiz_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_row record;
begin
  select understanding, effort, score, comment into v_row
    from quiz_reflections where account_id = p_account_id and quiz_id = p_quiz_id and jst_date = v_today;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  return jsonb_build_object('found', true, 'understanding', v_row.understanding,
    'effort', v_row.effort, 'score', v_row.score, 'comment', v_row.comment);
end $$;

-- 生徒本人の全振り返り（コピー使い回し判定・新しい「記録」画面の表示に使う）
create or replace function quiz_my_reflections(p_account_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_account_id, '') !~ '^[A-Z]-[0-9]{5,7}$' then
    return jsonb_build_object('error', 'bad_account');
  end if;
  return jsonb_build_object('reflections', coalesce((
    select jsonb_agg(jsonb_build_object(
      'quiz_id', quiz_id, 'date', to_char(jst_date,'YYYY-MM-DD'),
      'understanding', understanding, 'effort', effort, 'score', score, 'comment', comment,
      'checks', checks, 'flag', flag, 'good', good, 'is_duplicate', is_duplicate,
      'duplicate_date', to_char(duplicate_date,'YYYY-MM-DD'), 'toikaeshi', toikaeshi, 'warning', warning
    ) order by jst_date desc)
    from quiz_reflections where account_id = p_account_id
  ), '[]'::jsonb));
end $$;

-- 振り返りの提出（同じアカウント×同じquiz_id×同じ日は上書き＝書き直しOK）。
-- その小テストが「配布中」でなければ拒否する＝小テストが非公開になると振り返りも書けなくなる。
-- 6観点チェック等はクライアント側(reflection-sheet/と同じロジック)で計算済みのものをそのまま受け取って記録する。
create or replace function quiz_reflection_submit(
  p_account_id text, p_quiz_id text, p_understanding int, p_effort int, p_score int, p_comment text,
  p_checks jsonb default null, p_flag boolean default false, p_good boolean default false,
  p_is_duplicate boolean default false, p_duplicate_date date default null,
  p_toikaeshi text default null, p_warning text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school text; v_class text;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_active boolean;
begin
  if coalesce(p_account_id, '') !~ '^[A-Z]-[0-9]{5,7}$' then
    return jsonb_build_object('error', 'bad_account');
  end if;
  if p_understanding is null or p_understanding < 1 or p_understanding > 4
     or p_effort is null or p_effort < 1 or p_effort > 4 then
    return jsonb_build_object('error', 'bad_score');
  end if;

  -- 本人の学校・クラスで、小テスト本体が配布中、または「授業を開始（振り返り受付）」のどちらかなら書ける
  select school, class into v_school, v_class from _quiz_parse_account(p_account_id);
  select coalesce((select (is_active or reflection_active) from quiz_state
    where quiz_id = p_quiz_id and school=v_school and class=v_class), false) into v_active;
  if not v_active then
    return jsonb_build_object('error', 'inactive');
  end if;

  insert into quiz_reflections (
    account_id, quiz_id, jst_date, understanding, effort, score, comment,
    checks, flag, good, is_duplicate, duplicate_date, toikaeshi, warning, updated_at
  ) values (
    p_account_id, p_quiz_id, v_today, p_understanding, p_effort, p_score, p_comment,
    p_checks, coalesce(p_flag,false), coalesce(p_good,false), coalesce(p_is_duplicate,false),
    p_duplicate_date, p_toikaeshi, p_warning, now()
  )
  on conflict (account_id, quiz_id, jst_date) do update set
    understanding = excluded.understanding, effort = excluded.effort,
    score = excluded.score, comment = excluded.comment,
    checks = excluded.checks, flag = excluded.flag, good = excluded.good,
    is_duplicate = excluded.is_duplicate, duplicate_date = excluded.duplicate_date,
    toikaeshi = excluded.toikaeshi, warning = excluded.warning, updated_at = now();

  return jsonb_build_object('ok', true);
end $$;

-- 生徒本人の「今までに解いた小テスト」一覧（やり直し画面用）。パスワード再確認はしない軽量方式
-- （このツール全体の既存方針＝ログインで入口を絞るのみ・各RPCでの再認証はしない、と同じ扱い）。
create or replace function quiz_my_attempts(p_account_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_account_id, '') !~ '^[A-Z]-[0-9]{5,7}$' then
    return jsonb_build_object('error', 'bad_account');
  end if;
  return jsonb_build_object('attempts', coalesce((
    select jsonb_agg(x order by x->>'quiz_id') from (
      select jsonb_build_object(
        'quiz_id', quiz_id,
        'best_score', max(score), 'best_max', max(max_score),
        'times', count(*), 'last_date', max(jst_date)::text
      ) as x
      from quiz_attempts where student_code = p_account_id
      group by quiz_id
    ) t
  ), '[]'::jsonb));
end $$;

-- ---------- 教師用 RPC（すべてPIN必須） ----------

create or replace function quiz_verify_pin(p_pin text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('ok', quiz_check_pin(p_pin));
$$;

-- 小テストの配布状態一覧
-- 指定した学校・クラスの配布状態一覧（配布管理・振り返り開始カードの表示用）
create or replace function quiz_list_state(p_pin text, p_school text default null, p_class text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  if coalesce(p_school,'')='' or coalesce(p_class,'')='' then
    return jsonb_build_object('states', '[]'::jsonb);
  end if;
  return jsonb_build_object('states', coalesce((
    select jsonb_agg(jsonb_build_object('quiz_id', qs.quiz_id, 'is_active', qs.is_active,
      'reflection_active', qs.reflection_active, 'time_limit_sec', qs.time_limit_sec))
    from quiz_state qs where qs.school=p_school and qs.class=p_class
  ), '[]'::jsonb));
end $$;

-- 配布の開始／停止（quiz_id は quizdata.js の CH[].id）。指定した学校・クラスだけに効く。
-- 制限時間（秒）も同時に設定できる（p_time_limit_secがnullのときは既存の設定を変えない）
create or replace function quiz_set_active(p_pin text, p_quiz_id text, p_active boolean, p_time_limit_sec int default null, p_school text default null, p_class text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  if coalesce(p_school,'')='' or coalesce(p_class,'')='' then return jsonb_build_object('error','no_target'); end if;
  insert into quiz_state (quiz_id, school, class, is_active, time_limit_sec, updated_at)
    values (p_quiz_id, p_school, p_class, p_active, p_time_limit_sec, now())
    on conflict (quiz_id, school, class) do update set
      is_active = excluded.is_active,
      time_limit_sec = coalesce(excluded.time_limit_sec, quiz_state.time_limit_sec),
      updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- 「授業を開始」＝振り返りの受付の開始／停止（小テストの配布ON/OFFとは独立）。
-- 指定した学校・クラスだけに効く
create or replace function quiz_set_reflection_active(p_pin text, p_quiz_id text, p_active boolean, p_school text default null, p_class text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  if coalesce(p_school,'')='' or coalesce(p_class,'')='' then return jsonb_build_object('error','no_target'); end if;
  insert into quiz_state (quiz_id, school, class, reflection_active, updated_at)
    values (p_quiz_id, p_school, p_class, p_active, now())
    on conflict (quiz_id, school, class) do update set
      reflection_active = excluded.reflection_active,
      updated_at = now();
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

-- 振り返りの全件（教師ダッシュボード用）。理解度1（要フォロー）を拾い上げるのに使う
create or replace function quiz_reflection_list_teacher(p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  return jsonb_build_object('rows', coalesce((
    select jsonb_agg(jsonb_build_object(
      'account_id', account_id,
      'quiz_id', quiz_id,
      'date', to_char(jst_date, 'YYYY-MM-DD'),
      'understanding', understanding,
      'effort', effort,
      'score', score,
      'comment', comment,
      'flag', flag,
      'good', good,
      'is_duplicate', is_duplicate,
      'toikaeshi', toikaeshi
    ) order by jst_date desc, understanding asc)
    from quiz_reflections
  ), '[]'::jsonb));
end $$;

-- 振り返り1件の削除（生徒の誤入力を教師が申告を受けて消す用）
create or replace function quiz_reflection_delete(p_pin text, p_account_id text, p_quiz_id text, p_date date)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  delete from quiz_reflections where account_id = p_account_id and quiz_id = p_quiz_id and jst_date = p_date;
  return jsonb_build_object('ok', true);
end $$;

-- パスワードを忘れた生徒の救済。アカウント(ID×パスワード)だけを削除し、本人が同じIDで
-- 「新規登録」から新しいパスワードを設定し直せるようにする。成績(quiz_attempts)や
-- 振り返り(quiz_reflections)はaccount_idを保持する別テーブルであり、quiz_accountsとの
-- 外部キー制約は無いため、リセットしても過去の記録は消えない。
create or replace function quiz_reset_password(p_pin text, p_account_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  delete from quiz_accounts where account_id = p_account_id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 学習時間の記録（小テスト前後の空き時間の自己申告。home/の「何分勉強した？」と同じ発想） ----------

create table if not exists quiz_study_time (
  id         bigint generated always as identity primary key,
  account_id text not null,
  quiz_id    text not null default 'unknown', -- どの授業の前後の記録か（未指定はunknown）
  jst_date   date not null,
  minutes    int  not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, quiz_id, jst_date)
);
alter table quiz_study_time enable row level security;
-- ポリシーを一切作らない = anonキーからの直接アクセスは全拒否（RPC経由のみ）

-- 記録（同じ生徒×同じ授業×同じ日は上書き＝押し直しOK）
create or replace function quiz_study_time_submit(p_account_id text, p_quiz_id text, p_minutes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if coalesce(p_account_id, '') !~ '^[A-Z]-[0-9]{5,7}$' then
    return jsonb_build_object('error', 'bad_account');
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 180 then
    return jsonb_build_object('error', 'bad_minutes');
  end if;
  insert into quiz_study_time (account_id, quiz_id, jst_date, minutes, updated_at)
    values (p_account_id, coalesce(p_quiz_id,'unknown'), v_today, p_minutes, now())
  on conflict (account_id, quiz_id, jst_date) do update set
    minutes = excluded.minutes, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- 教師用：選んだ学校・クラス（＋任意でその授業）の、今日の学習時間まとめ。
-- ベスト3・平均・全員の記録をまとめて返す（投影して見せられるように）
create or replace function quiz_study_time_summary(p_pin text, p_school text, p_class text, p_quiz_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if not quiz_check_pin(p_pin) then return jsonb_build_object('error', 'bad_pin'); end if;
  if coalesce(p_school,'')='' or coalesce(p_class,'')='' then
    return jsonb_build_object('error', 'no_target');
  end if;
  return jsonb_build_object('rows', coalesce((
    select jsonb_agg(jsonb_build_object('account_id', st.account_id, 'quiz_id', st.quiz_id, 'minutes', st.minutes) order by st.minutes desc)
    from quiz_study_time st, _quiz_parse_account(st.account_id) pa
    where st.jst_date = v_today and pa.school = p_school and pa.class = p_class
      and (p_quiz_id is null or st.quiz_id = p_quiz_id)
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
