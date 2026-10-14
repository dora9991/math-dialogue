-- ============================================================
-- 数学ポータル スキーマ（生徒と先生の「入口」を1つにする）
-- ★ math-labo-second（数学ラボ2）の Supabase プロジェクトに相乗り。
--   ポータル用のオブジェクトはすべて "portal_" 接頭辞で隔離（public スキーマのまま）。
--   → SQL Editor に貼って Run するだけ。ダッシュボードのスキーマ公開設定は不要。
--
-- ★ quiz/ applied/ home/ の schema.sql を先に流しておくこと（それらのテーブルを読み書きする）。
--
-- 生徒のアカウントは quiz/ のもの（quiz_accounts：学校コード＋出席番号＋パスワード）をそのまま使う。
-- ポータルが新しく持つのは「先生のアカウント」と「番号だけの名簿」の2つだけ。氏名は保存しない。
--
-- 既存ツールとの違い：
--   ・先生は「ツールごとの共通PIN」ではなく、先生ごとのID＋パスワードでログインする。
--     担当クラスを持ち、担当のクラスだけを見る・操作できる（管理者は同じ学校の全クラス）。
--   ・ポータルの生徒用RPCは、毎回パスワードを確かめる（quiz_* の生徒用RPCはIDだけで動く）。
-- ============================================================

-- ---------- 前提の確認（足りなければここで止まる） ----------
do $$
begin
  if to_regclass('public.quiz_accounts') is null or to_regclass('public.quiz_state') is null then
    raise exception '先に quiz/schema.sql を流してください（quiz_accounts / quiz_state が見つかりません）';
  end if;
  if to_regclass('public.applied_attempts') is null then
    raise exception '先に applied/schema.sql を流してください（applied_attempts が見つかりません）';
  end if;
  if to_regclass('public.study_sessions') is null then
    raise exception '先に home/schema.sql を流してください（study_sessions が見つかりません）';
  end if;
end $$;

create extension if not exists pgcrypto;

-- ---------- テーブル ----------

-- 先生のアカウント。パスワードは pgcrypto (bf=bcrypt) でハッシュ化して保存し、平文は保存しない。
-- 呼び名は画面に出すだけのもの。本名でなくてよい（学校が特定される手がかりを増やさないため）。
create table if not exists portal_teachers (
  teacher_id    text primary key,               -- ログインID（英小文字・数字・-_ の2〜20字。例: tanaka）
  display_name  text not null default '',       -- 画面に出す呼び名（例: 田中先生／2年担当）
  password_hash text not null,
  school        text not null,                  -- 学校コード（例: E-10）。この学校のクラスだけを扱える
  classes       text[] not null default '{}',   -- 担当クラス（例: {1-1,1-2}）
  is_admin      boolean not null default false, -- 管理者：同じ学校の全クラスを扱え、先生を追加できる
  failed_count  int not null default 0,         -- パスワードを続けて間違えた回数
  locked_until  timestamptz,                    -- 10回続けて間違えると15分ロック
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 番号だけの名簿（クラスに在籍している出席番号）。これがあると「未提出」を正確に出せる。
create table if not exists portal_rosters (
  school     text not null,
  class      text not null,                     -- 例: 1-2（1年2組）
  numbers    int[] not null,                    -- 例: {1,2,...,38}（欠番は入れない）
  updated_at timestamptz not null default now(),
  primary key (school, class)
);

-- ---------- RLS: 直接アクセスは全面禁止（RPC経由のみ） ----------
alter table portal_teachers enable row level security;
alter table portal_rosters  enable row level security;
-- ポリシーを一切作らない = anon キーからの直接 select/insert はすべて拒否

-- ---------- 内部ヘルパー（anon からは呼べないようにする。ファイル末尾の revoke 参照） ----------

-- 先生の認証。正しければ先生の行、間違いなら null を返す。
-- 間違いを数え、10回続いたら15分ロックする（ロック中は正しいパスワードでも入れない）。
-- ※ ここで例外を投げると失敗回数の更新まで巻き戻るので、呼び出し側は null を見て error を返すこと。
create or replace function _portal_auth(p_teacher_id text, p_password text)
returns portal_teachers language plpgsql security definer set search_path = public, extensions as $$
declare t portal_teachers;
begin
  select * into t from portal_teachers where teacher_id = lower(coalesce(p_teacher_id, '')) for update;
  if not found then return null; end if;
  if t.locked_until is not null then
    if t.locked_until > now() then return null; end if;
    t.failed_count := 0;   -- ロックが明けたら、数え直す
  end if;
  if crypt(coalesce(p_password, ''), t.password_hash) <> t.password_hash then
    update portal_teachers set
      failed_count = t.failed_count + 1,
      locked_until = case when t.failed_count + 1 >= 10 then now() + interval '15 minutes' else null end
      where teacher_id = t.teacher_id;
    return null;
  end if;
  if t.failed_count <> 0 or t.locked_until is not null then
    update portal_teachers set failed_count = 0, locked_until = null where teacher_id = t.teacher_id;
  end if;
  return t;
end $$;

-- 生徒のID・パスワードの確認（quiz_accounts をそのまま使う）。正しければ null、違えばエラーコード。
create or replace function _portal_student_check(p_account_id text, p_password text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  select password_hash into v_hash from quiz_accounts where account_id = coalesce(p_account_id, '');
  if not found then return 'no_such_id'; end if;
  if crypt(coalesce(p_password, ''), v_hash) <> v_hash then return 'bad_password'; end if;
  return null;
end $$;

-- クラス表記（例: 1-2）の配列を、正しい形だけ・重複なし・並べ替え済みにする
create or replace function _portal_norm_classes(p_classes text[])
returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct c order by c), '{}')
  from unnest(coalesce(p_classes, '{}')) c
  where c ~ '^[1-9]-[1-9]$';
$$;

-- 先生がそのクラスを扱えるか（管理者は同じ学校の全クラス）
create or replace function _portal_can_class(t portal_teachers, p_class text)
returns boolean language sql immutable as $$
  select coalesce(p_class, '') ~ '^[1-9]-[1-9]$' and (t.is_admin or p_class = any(t.classes));
$$;

-- その学校で使われているクラス（管理者のクラス選択用）。先生の担当・名簿・配布状態・生徒のIDから集める
create or replace function _portal_known_classes(p_school text)
returns text[] language sql stable security definer set search_path = public as $$
  select _portal_norm_classes(array(
    select unnest(classes) from portal_teachers where school = p_school
    union select class from portal_rosters where school = p_school
    union select class from quiz_state where school = p_school
    union select pa.class from quiz_accounts qa, _quiz_parse_account(qa.account_id) pa where pa.school = p_school
  ));
$$;

create or replace function _portal_teacher_json(t portal_teachers)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'teacher_id', t.teacher_id,
    'display_name', t.display_name,
    'school', t.school,
    'is_admin', t.is_admin,
    'classes', to_jsonb(t.classes),
    -- クラス選択に並べるクラス（管理者は学校で使われている全クラス）
    'open_classes', to_jsonb(case when t.is_admin
      then _portal_norm_classes(t.classes || _portal_known_classes(t.school)) else t.classes end)
  );
$$;

-- ---------- 最初の管理者（SQL Editor からだけ呼べる。anon からは呼べない） ----------
-- 例: select portal_setup_admin('kazu', '6文字以上のパスワード', 'E-10', '数学 管理');
-- 同じIDで呼び直すと、パスワードを設定し直してロックを解く（管理者がパスワードを忘れたときの救済）。
create or replace function portal_setup_admin(p_teacher_id text, p_password text, p_school text, p_display_name text default '')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if lower(coalesce(p_teacher_id, '')) !~ '^[a-z0-9_-]{2,20}$' then return jsonb_build_object('error', 'bad_id'); end if;
  if length(coalesce(p_password, '')) < 6 then return jsonb_build_object('error', 'weak_password'); end if;
  if coalesce(p_school, '') !~ '^[A-Z]-[0-9]{1,3}$' then return jsonb_build_object('error', 'bad_school'); end if;
  insert into portal_teachers (teacher_id, display_name, password_hash, school, is_admin)
    values (lower(p_teacher_id), left(coalesce(p_display_name, ''), 30), crypt(p_password, gen_salt('bf')), p_school, true)
  on conflict (teacher_id) do update set
    password_hash = excluded.password_hash, school = excluded.school, is_admin = true,
    failed_count = 0, locked_until = null, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 先生用 RPC（すべて先生のID＋パスワード必須） ----------

create or replace function portal_teacher_login(p_teacher_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t portal_teachers;
begin
  if exists (select 1 from portal_teachers
             where teacher_id = lower(coalesce(p_teacher_id, '')) and locked_until > now()) then
    return jsonb_build_object('error', 'locked');
  end if;
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  return jsonb_build_object('ok', true, 'teacher', _portal_teacher_json(t));
end $$;

create or replace function portal_teacher_set_password(p_teacher_id text, p_password text, p_new text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t portal_teachers;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if length(coalesce(p_new, '')) < 6 then return jsonb_build_object('error', 'weak_password'); end if;
  update portal_teachers set password_hash = crypt(p_new, gen_salt('bf')), updated_at = now()
    where teacher_id = t.teacher_id;
  return jsonb_build_object('ok', true);
end $$;

-- 「授業を開始」（振り返り・学習時間・確認問題の受付）と「小テストの配布」の切り替え。
-- quiz/teacher.html の quiz_set_reflection_active / quiz_set_active と同じ quiz_state を書く
-- （どちらの画面から操作しても同じ状態になる）。制限時間は変えない。
create or replace function portal_set_lesson(p_teacher_id text, p_password text, p_class text,
  p_quiz_id text, p_kind text, p_active boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t portal_teachers;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if not _portal_can_class(t, p_class) then return jsonb_build_object('error', 'not_your_class'); end if;
  if coalesce(p_quiz_id, '') !~ '^[A-Za-z0-9_-]{1,40}$' then return jsonb_build_object('error', 'bad_quiz'); end if;
  if p_kind = 'quiz' then
    insert into quiz_state (quiz_id, school, class, is_active, updated_at)
      values (p_quiz_id, t.school, p_class, coalesce(p_active, false), now())
    on conflict (quiz_id, school, class) do update set is_active = excluded.is_active, updated_at = now();
  elsif p_kind = 'lesson' then
    insert into quiz_state (quiz_id, school, class, reflection_active, updated_at)
      values (p_quiz_id, t.school, p_class, coalesce(p_active, false), now())
    on conflict (quiz_id, school, class) do update set reflection_active = excluded.reflection_active, updated_at = now();
  else
    return jsonb_build_object('error', 'bad_kind');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- 番号だけの名簿を保存する（空の配列を送ると名簿を消す）
create or replace function portal_save_roster(p_teacher_id text, p_password text, p_class text, p_numbers int[])
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  t portal_teachers;
  v_numbers int[];
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if not _portal_can_class(t, p_class) then return jsonb_build_object('error', 'not_your_class'); end if;
  select coalesce(array_agg(distinct n order by n), '{}') into v_numbers
    from unnest(coalesce(p_numbers, '{}')) n where n between 1 and 99;
  if cardinality(v_numbers) = 0 then
    delete from portal_rosters where school = t.school and class = p_class;
  else
    insert into portal_rosters (school, class, numbers, updated_at) values (t.school, p_class, v_numbers, now())
    on conflict (school, class) do update set numbers = excluded.numbers, updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'numbers', to_jsonb(v_numbers));
end $$;

-- あるクラスの「その日」のまとめ（ポータルの先生画面の中心）。
-- 小テスト・振り返り・学習時間（quiz_*）は学校コード＋クラスで絞る。
-- 家庭学習ノート（study_*）と応用チャレンジ（applied_*）は4桁の番号しか持たないので、学年＋組の頭2桁で絞る
-- （＝同じサイトを1つの学校で使う前提。README「制約」参照）。
create or replace function portal_class_day(p_teacher_id text, p_password text, p_class text, p_date date default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  t portal_teachers;
  v_day date := coalesce(p_date, (now() at time zone 'Asia/Tokyo')::date);
  v_code4 text;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if not _portal_can_class(t, p_class) then return jsonb_build_object('error', 'not_your_class'); end if;
  v_code4 := '^' || replace(p_class, '-', '') || '[0-9]{2}$';   -- 1-2 → ^12[0-9]{2}$
  return jsonb_build_object(
    'ok', true,
    'date', to_char(v_day, 'YYYY-MM-DD'),
    'school', t.school,
    'class', p_class,
    'roster', (select to_jsonb(numbers) from portal_rosters where school = t.school and class = p_class),
    'states', coalesce((
      select jsonb_agg(jsonb_build_object('quiz_id', quiz_id, 'is_active', is_active,
        'reflection_active', reflection_active) order by quiz_id)
      from quiz_state where school = t.school and class = p_class), '[]'::jsonb),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object('n', right(a.student_code, 2)::int, 'quiz_id', a.quiz_id,
        'score', a.score, 'max', a.max_score) order by a.created_at)
      from quiz_attempts a, _quiz_parse_account(a.student_code) pa
      where a.jst_date = v_day and pa.school = t.school and pa.class = p_class), '[]'::jsonb),
    'reflections', coalesce((
      select jsonb_agg(jsonb_build_object('n', right(r.account_id, 2)::int, 'quiz_id', r.quiz_id,
        'understanding', r.understanding, 'effort', r.effort, 'comment', r.comment,
        'flag', r.flag, 'good', r.good, 'is_duplicate', r.is_duplicate, 'toikaeshi', r.toikaeshi) order by r.created_at)
      from quiz_reflections r, _quiz_parse_account(r.account_id) pa
      where r.jst_date = v_day and pa.school = t.school and pa.class = p_class), '[]'::jsonb),
    'study_time', coalesce((
      select jsonb_agg(jsonb_build_object('n', right(st.account_id, 2)::int, 'quiz_id', st.quiz_id,
        'minutes', st.minutes, 'note', st.note) order by st.created_at)
      from quiz_study_time st, _quiz_parse_account(st.account_id) pa
      where st.jst_date = v_day and pa.school = t.school and pa.class = p_class), '[]'::jsonb),
    'home', coalesce((
      select jsonb_agg(jsonb_build_object('n', right(s.student_code, 2)::int, 'unit', s.unit, 'level', s.level,
        'minutes', s.reported_minutes, 'auto_seconds', s.auto_seconds, 'solved', s.solved, 'correct', s.correct,
        'challenge', s.challenge_count, 'redo', s.redo_count) order by s.created_at)
      from study_sessions s where s.jst_date = v_day and s.student_code ~ v_code4), '[]'::jsonb),
    'applied', coalesce((
      select jsonb_agg(jsonb_build_object('n', right(a.student_code, 2)::int, 'set_id', a.set_id,
        'score', a.score, 'max', a.max_score) order by a.created_at)
      from applied_attempts a where a.jst_date = v_day and a.student_code ~ v_code4), '[]'::jsonb)
  );
end $$;

-- パスワードを忘れた生徒の救済（担当クラスの生徒だけ）。quiz_reset_password と同じく、
-- アカウント（ID×パスワード）だけを消す。本人が同じIDで「新規登録」し直せば、過去の記録はそのまま使える。
create or replace function portal_reset_student(p_teacher_id text, p_password text, p_account_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  t portal_teachers;
  v_school text; v_class text;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  select school, class into v_school, v_class from _quiz_parse_account(p_account_id);
  if v_school is null or v_school <> t.school or not _portal_can_class(t, v_class) then
    return jsonb_build_object('error', 'not_your_class');
  end if;
  delete from quiz_accounts where account_id = p_account_id;
  return jsonb_build_object('ok', true, 'existed', found);
end $$;

-- ---------- 管理者用 RPC（同じ学校の先生を管理する） ----------

create or replace function portal_admin_list_teachers(p_teacher_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t portal_teachers;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if not t.is_admin then return jsonb_build_object('error', 'not_admin'); end if;
  return jsonb_build_object('ok', true, 'teachers', coalesce((
    select jsonb_agg(jsonb_build_object('teacher_id', teacher_id, 'display_name', display_name,
      'classes', to_jsonb(classes), 'is_admin', is_admin,
      'locked', coalesce(locked_until > now(), false)) order by teacher_id)
    from portal_teachers where school = t.school), '[]'::jsonb));
end $$;

-- 先生の追加・変更。新しい先生には初期パスワード（6文字以上）が必要。
-- 既存の先生に p_new_password を渡すと、パスワードを設定し直してロックも解く。
create or replace function portal_admin_save_teacher(p_teacher_id text, p_password text,
  p_target_id text, p_display_name text, p_classes text[], p_is_admin boolean default false,
  p_new_password text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  t portal_teachers;
  v_id text := lower(coalesce(p_target_id, ''));
  v_school text;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if not t.is_admin then return jsonb_build_object('error', 'not_admin'); end if;
  if v_id !~ '^[a-z0-9_-]{2,20}$' then return jsonb_build_object('error', 'bad_id'); end if;
  if p_new_password is not null and length(p_new_password) < 6 then
    return jsonb_build_object('error', 'weak_password');
  end if;

  select school into v_school from portal_teachers where teacher_id = v_id;
  if found then
    if v_school <> t.school then return jsonb_build_object('error', 'other_school'); end if;
    -- 自分の管理者権限は外せない（管理者が1人もいなくなるのを防ぐ）
    if v_id = t.teacher_id and not coalesce(p_is_admin, false) then
      return jsonb_build_object('error', 'self_admin');
    end if;
    update portal_teachers set
      display_name  = left(coalesce(p_display_name, ''), 30),
      classes       = _portal_norm_classes(p_classes),
      is_admin      = coalesce(p_is_admin, false),
      password_hash = case when p_new_password is null then password_hash else crypt(p_new_password, gen_salt('bf')) end,
      failed_count  = case when p_new_password is null then failed_count else 0 end,
      locked_until  = case when p_new_password is null then locked_until else null end,
      updated_at    = now()
      where teacher_id = v_id;
    return jsonb_build_object('ok', true, 'created', false);
  end if;

  if p_new_password is null then return jsonb_build_object('error', 'need_password'); end if;
  insert into portal_teachers (teacher_id, display_name, password_hash, school, classes, is_admin)
    values (v_id, left(coalesce(p_display_name, ''), 30), crypt(p_new_password, gen_salt('bf')),
            t.school, _portal_norm_classes(p_classes), coalesce(p_is_admin, false));
  return jsonb_build_object('ok', true, 'created', true);
end $$;

create or replace function portal_admin_delete_teacher(p_teacher_id text, p_password text, p_target_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare t portal_teachers;
begin
  t := _portal_auth(p_teacher_id, p_password);
  if t.teacher_id is null then return jsonb_build_object('error', 'bad_login'); end if;
  if not t.is_admin then return jsonb_build_object('error', 'not_admin'); end if;
  if lower(coalesce(p_target_id, '')) = t.teacher_id then return jsonb_build_object('error', 'self'); end if;
  delete from portal_teachers where teacher_id = lower(coalesce(p_target_id, '')) and school = t.school;
  return jsonb_build_object('ok', true, 'deleted', found);
end $$;

-- ---------- 生徒用 RPC（毎回ID＋パスワードを確かめる） ----------

-- ホーム画面の「今日やること」：本人のクラスで、授業が開始中・小テストが配布中の回と、その日の取り組み状況。
-- ログイン確認も兼ねる（ID・パスワードが違えば quiz_login と同じエラーコードを返す）。
create or replace function portal_student_today(p_account_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_err text;
  v_school text; v_class text;
  v_sid4 text := right(coalesce(p_account_id, ''), 4);
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  v_err := _portal_student_check(p_account_id, p_password);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  select school, class into v_school, v_class from _quiz_parse_account(p_account_id);
  return jsonb_build_object(
    'ok', true,
    'account_id', p_account_id,
    'school', v_school,
    'class', v_class,
    'date', to_char(v_today, 'YYYY-MM-DD'),
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'quiz_id', qs.quiz_id,
        'quiz_active', qs.is_active,
        'lesson_active', qs.reflection_active,
        'attempt', (select jsonb_build_object('score', a.score, 'max', a.max_score) from quiz_attempts a
                    where a.quiz_id = qs.quiz_id and a.student_code = p_account_id and a.jst_date = v_today),
        'reflected', exists (select 1 from quiz_reflections r
                    where r.account_id = p_account_id and r.jst_date = v_today
                      and (r.quiz_id = qs.quiz_id or r.quiz_id like qs.quiz_id || '-%')),
        'study_minutes', (select st.minutes from quiz_study_time st
                    where st.account_id = p_account_id and st.quiz_id = qs.quiz_id and st.jst_date = v_today)
      ) order by qs.quiz_id)
      from quiz_state qs
      where qs.school = v_school and qs.class = v_class and (qs.is_active or qs.reflection_active)), '[]'::jsonb),
    'home_today', (
      select jsonb_build_object('sessions', count(*), 'minutes', coalesce(sum(reported_minutes), 0),
        'solved', coalesce(sum(solved), 0))
      from study_sessions where student_code = v_sid4 and jst_date = v_today),
    'applied_today', (select count(*) from applied_attempts where student_code = v_sid4 and jst_date = v_today)
  );
end $$;

-- 「わたしの記録」：小テスト・振り返り・学習時間・家庭学習ノート・応用チャレンジを、まとめて返す
create or replace function portal_student_records(p_account_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_err text;
  v_sid4 text := right(coalesce(p_account_id, ''), 4);
begin
  v_err := _portal_student_check(p_account_id, p_password);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  return jsonb_build_object(
    'ok', true,
    'quiz', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(jst_date, 'YYYY-MM-DD'), 'quiz_id', quiz_id,
        'score', score, 'max', max_score) order by created_at desc)
      from quiz_attempts where student_code = p_account_id), '[]'::jsonb),
    'reflections', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(jst_date, 'YYYY-MM-DD'), 'quiz_id', quiz_id,
        'understanding', understanding, 'effort', effort, 'comment', comment, 'toikaeshi', toikaeshi)
        order by jst_date desc, quiz_id)
      from quiz_reflections where account_id = p_account_id), '[]'::jsonb),
    'study_time', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(jst_date, 'YYYY-MM-DD'), 'quiz_id', quiz_id,
        'minutes', minutes, 'note', note) order by jst_date desc, quiz_id)
      from quiz_study_time where account_id = p_account_id), '[]'::jsonb),
    'home', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(jst_date, 'YYYY-MM-DD'), 'unit', unit, 'level', level,
        'minutes', reported_minutes, 'auto_seconds', auto_seconds, 'solved', solved, 'correct', correct,
        'challenge', challenge_count, 'redo', redo_count) order by created_at desc)
      from study_sessions where student_code = v_sid4), '[]'::jsonb),
    'applied', coalesce((
      select jsonb_agg(jsonb_build_object('date', to_char(jst_date, 'YYYY-MM-DD'), 'set_id', set_id,
        'score', score, 'max', max_score) order by created_at desc)
      from applied_attempts where student_code = v_sid4), '[]'::jsonb)
  );
end $$;

-- ---------- 権限：内部ヘルパーと管理者の作成は、anon（公開キー）から呼べないようにする ----------
-- Supabase は public の関数を anon / authenticated に自動で許可するので、明示的に取り消す。
revoke all on function _portal_auth(text, text)                     from public, anon, authenticated;
revoke all on function _portal_student_check(text, text)            from public, anon, authenticated;
revoke all on function _portal_norm_classes(text[])                 from public, anon, authenticated;
revoke all on function _portal_can_class(portal_teachers, text)     from public, anon, authenticated;
revoke all on function _portal_known_classes(text)                  from public, anon, authenticated;
revoke all on function _portal_teacher_json(portal_teachers)        from public, anon, authenticated;
revoke all on function portal_setup_admin(text, text, text, text)   from public, anon, authenticated;
