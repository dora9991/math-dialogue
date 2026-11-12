-- ============================================================
-- バスケ・グロウ「クラブ」スキーマ：コーチがつくる級（きゅう）・写真の提出とコーチの評価・級の認定・クラブのひろば（いいね）
-- ★ math-labo-second（数学ラボ2）の Supabase プロジェクトに相乗り。ほかのアプリ（quiz_ / live_ / study_ など）と
--   衝突しないよう、テーブルも関数もすべて "bg_"（内部用は "_bg_"）の接頭辞で分ける（public スキーマのまま）。
--   → SQL Editor に貼って Run するだけ（何回 Run してもよい）。
-- テーブルには直接さわれない（RLS をかけ、anon / authenticated の権限も取り消す）。
-- アプリからは bg_* の関数（security definer の RPC）だけを使い、どの関数も「トークン」で だれかを確かめる。
--
-- 個人情報をへらす：
--   ・本名・メール・電話は持たない（ニックネームと、学年の目安だけ）。子どものアカウントはコーチがつくる
--   ・子どもは「クラブコード ＋ ばんごう ＋ あいことば（6けたの数字）」でログイン。あいことば・合言葉は bcrypt で保存
--   ・提出の写真は、本人とコーチだけが見られる。ひろばの写真は、クラブのメンバーだけ（コーチの確認のあと）
--   ・ひろばでは、子どもどうしは文を送りあえない（スタンプだけ）。投稿はコーチがかくせる。ことばの点検（悪口・URL・電話番号）
--   ・提出の写真は、評価から45日たつと消す。メンバーを消すと、その人の記録・写真・投稿もすべて消える
--
-- v2（あとから足したもの。v1 のあとに Run しても、はじめから Run しても 同じになる）：
--   ・級の種類（総合・ドリブル・シュート …スキルごとの級）。いちばん上の種類が「メイン」の級
--   ・コーチの自主練（クエスト）：「ドリブル100回を、1週間で5回」。子どもは1回ずつ記録（写真も）。とどいたら「クリア」
--   ・コーチの 拍手・いいね・怒り（ひろばの投稿と 自主練の記録に。みんなに見える）
--   ・予定（練習試合・大会・合宿 …）と、参加の申し込み（参加する・しない・まだわからない。しめきり・定員）
--   ・体験・入団の申し込み：保護者が、クラブの申し込みリンク（クラブコードとは べつのコード）から送る。
--     子どもの名前・学年・保護者の名前・連絡先は コーチだけが見る。90日で消す
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------- テーブル ----------

create table if not exists bg_clubs (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,                 -- クラブコード（6文字。子どものログインに使う）
  name       text not null,
  coach_hash text not null,                        -- コーチの合言葉（bcrypt）
  settings   jsonb not null default '{"review_posts": false, "review_photos": true, "photos": true, "cert_posts": true}'::jsonb,
  created_at timestamptz not null default now()
);

-- 級（10級・9級 …）。ord が小さいほど下の級
create table if not exists bg_levels (
  id       uuid primary key default gen_random_uuid(),
  club_id  uuid not null references bg_clubs(id) on delete cascade,
  ord      int  not null,
  name     text not null,
  color    text not null default '',
  note     text not null default '',
  archived boolean not null default false
);
create index if not exists bg_levels_club on bg_levels(club_id, ord);

-- 級の課題（例：ポンドドリブル 右手 20回）。回数はコーチが決める
create table if not exists bg_tasks (
  id       uuid primary key default gen_random_uuid(),
  club_id  uuid not null references bg_clubs(id) on delete cascade,
  level_id uuid not null references bg_levels(id) on delete cascade,
  ord      int  not null,
  title    text not null,
  drill_id text not null default '',               -- アプリの練習メニューの id（やりかたとアニメーションへのリンク）
  target   int  not null default 1,                -- 目標の数
  unit     text not null default '回',
  cond     text not null default '',               -- 「30秒で」「10本中」「連続」など
  how      text not null default '',               -- コーチからのひとこと（見るところ）
  photo    text not null default 'opt' check (photo in ('need', 'opt', 'none')),
  archived boolean not null default false
);
create index if not exists bg_tasks_level on bg_tasks(level_id, ord);
create index if not exists bg_tasks_club on bg_tasks(club_id);

create table if not exists bg_members (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references bg_clubs(id) on delete cascade,
  role         text not null check (role in ('coach', 'kid')),
  no           int,                                -- 子どもの ばんごう（クラブの中で 1, 2, …）。コーチは null
  nickname     text not null,
  grade        text not null default '',           -- 学年の目安（e12 / e34 / e56 / j1 / j2 / j3 / h / a）
  pin_hash     text,                               -- 子どもの あいことば（bcrypt）
  kyu_level_id uuid references bg_levels(id) on delete set null, -- いまの級（認定された いちばん上の級）
  seen_at      timestamptz not null default now(), -- お知らせを見た時刻
  created_at   timestamptz not null default now(),
  unique (club_id, no)
);
create index if not exists bg_members_club on bg_members(club_id, role);

create table if not exists bg_tokens (
  token_hash text primary key,
  member_id  uuid not null references bg_members(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists bg_tokens_member on bg_tokens(member_id);
create index if not exists bg_tokens_exp on bg_tokens(expires_at);

-- 写真（小さくした JPEG など。300KB まで）。kind：'sub'＝提出（本人とコーチだけ）・'post'＝ひろば
create table if not exists bg_photos (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  member_id  uuid not null references bg_members(id) on delete cascade,
  kind       text not null check (kind in ('sub', 'post')),
  mime       text not null,
  data       bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists bg_photos_club on bg_photos(club_id, kind);

-- 課題の提出（何回できたか・写真・動画チェックの結果）と、コーチの評価
create table if not exists bg_subs (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references bg_clubs(id) on delete cascade,
  member_id   uuid not null references bg_members(id) on delete cascade,
  task_id     uuid not null references bg_tasks(id) on delete cascade,
  count       int,
  note        text not null default '',
  photo_id    uuid references bg_photos(id) on delete set null,
  check_json  jsonb,                               -- 動画チェックの結果（点数と ◎○△ だけ。動画そのものは送らない）
  status      text not null default 'pending' check (status in ('pending', 'pass', 'retry')),
  comment     text not null default '',
  coach_id    uuid references bg_members(id) on delete set null,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists bg_subs_club on bg_subs(club_id, status, created_at);
create index if not exists bg_subs_member on bg_subs(member_id, task_id, created_at);

-- 級の認定
create table if not exists bg_certs (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  member_id  uuid not null references bg_members(id) on delete cascade,
  level_id   uuid not null references bg_levels(id) on delete cascade,
  coach_id   uuid references bg_members(id) on delete set null,
  comment    text not null default '',
  created_at timestamptz not null default now(),
  unique (member_id, level_id)
);

-- ひろばの投稿。kind：'post'（がんばったこと）・'share'（アプリの記録から）・'cert'（級に合格。コーチの認定でできる）
create table if not exists bg_posts (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  member_id  uuid not null references bg_members(id) on delete cascade,
  kind       text not null default 'post' check (kind in ('post', 'share', 'cert')),
  body       text not null default '',
  photo_id   uuid references bg_photos(id) on delete set null,
  meta       jsonb not null default '{}'::jsonb,
  status     text not null default 'shown' check (status in ('shown', 'waiting', 'hidden')),
  created_at timestamptz not null default now()
);
create index if not exists bg_posts_club on bg_posts(club_id, created_at desc);

-- スタンプ（いいね・ナイス・すごい・がんばれ）
create table if not exists bg_reacts (
  post_id    uuid not null references bg_posts(id) on delete cascade,
  member_id  uuid not null references bg_members(id) on delete cascade,
  stamp      text not null check (stamp in ('like', 'nice', 'wow', 'cheer')),
  created_at timestamptz not null default now(),
  primary key (post_id, member_id, stamp)
);
create index if not exists bg_reacts_member on bg_reacts(member_id);

create table if not exists bg_rate (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);

-- ---------- v2 のテーブル（v1 のあとに Run しても、はじめから Run しても 同じになる） ----------

-- 級の種類（総合・ドリブル・シュート …）。ord がいちばん小さいものが「メイン」（ホームや名前のとなりに出る級）
create table if not exists bg_tracks (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  ord        int  not null default 0,
  name       text not null,
  icon       text not null default '',
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bg_tracks_club on bg_tracks(club_id, ord);
alter table bg_levels add column if not exists track_id uuid references bg_tracks(id) on delete cascade;
create index if not exists bg_levels_track on bg_levels(track_id, ord);
-- v1 でつくった級は「総合」に入れる
do $$
declare r record; v_tid uuid;
begin
  for r in select distinct club_id from bg_levels where track_id is null loop
    select id into v_tid from bg_tracks where club_id = r.club_id and not archived order by ord, created_at limit 1;
    if v_tid is null then
      insert into bg_tracks (club_id, ord, name, icon) values (r.club_id, 0, '総合', 'trophy') returning id into v_tid;
    end if;
    update bg_levels set track_id = v_tid where club_id = r.club_id and track_id is null;
  end loop;
end $$;

-- 写真：'log'（自主練の記録。本人とコーチだけ）をふやす
alter table bg_photos drop constraint if exists bg_photos_kind_check;
alter table bg_photos add constraint bg_photos_kind_check check (kind in ('sub', 'post', 'log'));
-- ひろば：'quest'（自主練をクリア）をふやす
alter table bg_posts drop constraint if exists bg_posts_kind_check;
alter table bg_posts add constraint bg_posts_kind_check check (kind in ('post', 'share', 'cert', 'quest'));

-- 体験・入団の申し込みのリンク用のコード（クラブコードとは べつ。ログインには使えない）と、申し込みページのお知らせ
alter table bg_clubs add column if not exists apply_code text;
alter table bg_clubs add column if not exists apply_note text not null default '';
create unique index if not exists bg_clubs_apply_code on bg_clubs(apply_code);

-- コーチの自主練（クエスト）：「ドリブル 100回 を、1週間で 5回」など。members が null なら 子ども全員
create table if not exists bg_quests (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  title      text not null,
  drill_id   text not null default '',
  target     int  not null default 1,              -- 1回で やる数
  unit       text not null default '回',
  times      int  not null default 1,              -- 期間の中で 何回やるか
  start_on   date not null,
  end_on     date not null,
  photo      text not null default 'opt' check (photo in ('need', 'opt', 'none')),
  how        text not null default '',
  members    uuid[],
  created_by uuid references bg_members(id) on delete set null,
  created_at timestamptz not null default now(),
  archived   boolean not null default false
);
create index if not exists bg_quests_club on bg_quests(club_id, end_on);

-- 自主練の記録（1回ぶん）。day は日本の日付
create table if not exists bg_quest_logs (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  quest_id   uuid not null references bg_quests(id) on delete cascade,
  member_id  uuid not null references bg_members(id) on delete cascade,
  count      int,
  note       text not null default '',
  photo_id   uuid references bg_photos(id) on delete set null,
  day        date not null,
  created_at timestamptz not null default now()
);
create index if not exists bg_qlogs_quest on bg_quest_logs(quest_id, member_id, created_at);
create index if not exists bg_qlogs_member on bg_quest_logs(member_id, created_at);
create index if not exists bg_qlogs_club on bg_quest_logs(club_id, day);

-- コーチの 拍手・いいね・怒り（ひろばの投稿 か 自主練の記録に。コーチ1人につき1つ。みんなに見える）
create table if not exists bg_coach_reacts (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  coach_id   uuid not null references bg_members(id) on delete cascade,
  post_id    uuid references bg_posts(id) on delete cascade,
  log_id     uuid references bg_quest_logs(id) on delete cascade,
  stamp      text not null check (stamp in ('clap', 'good', 'angry')),
  comment    text not null default '',
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (log_id is null))
);
create unique index if not exists bg_creacts_post on bg_coach_reacts(post_id, coach_id) where post_id is not null;
create unique index if not exists bg_creacts_log on bg_coach_reacts(log_id, coach_id) where log_id is not null;
create index if not exists bg_creacts_club on bg_coach_reacts(club_id, created_at);

-- 予定（練習試合・大会・合宿・体験会 …）。members が null なら 子ども全員
create table if not exists bg_events (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  title      text not null,
  kind       text not null default 'other' check (kind in ('practice', 'game', 'tournament', 'camp', 'trial', 'other')),
  day        date not null,
  time_text  text not null default '',
  place      text not null default '',
  note       text not null default '',
  deadline   date,                                 -- しめきり（null なら 当日まで）
  capacity   int  not null default 0,              -- 定員（0 は なし）
  members    uuid[],
  closed     boolean not null default false,
  created_by uuid references bg_members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists bg_events_club on bg_events(club_id, day);

-- 予定への 参加の申し込み（参加する・しない・まだわからない）
create table if not exists bg_entries (
  event_id   uuid not null references bg_events(id) on delete cascade,
  member_id  uuid not null references bg_members(id) on delete cascade,
  answer     text not null check (answer in ('yes', 'no', 'maybe')),
  note       text not null default '',
  by_coach   boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (event_id, member_id)
);
create index if not exists bg_entries_member on bg_entries(member_id);

-- 体験・入団の申し込み（保護者が、クラブのリンクから送る）。コーチだけが見る。90日で消す
create table if not exists bg_applies (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references bg_clubs(id) on delete cascade,
  kind       text not null check (kind in ('trial', 'join', 'question')),
  child      text not null,
  kana       text not null default '',
  grade      text not null default '',
  guardian   text not null,
  contact    text not null,
  message    text not null default '',
  status     text not null default 'new' check (status in ('new', 'contacted', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists bg_applies_club on bg_applies(club_id, created_at desc);

-- ---------- 直接アクセスは全面禁止（RPC 経由のみ） ----------
do $$
declare t text;
begin
  foreach t in array array['bg_clubs', 'bg_levels', 'bg_tasks', 'bg_members', 'bg_tokens', 'bg_photos', 'bg_subs',
    'bg_certs', 'bg_posts', 'bg_reacts', 'bg_rate', 'bg_tracks', 'bg_quests', 'bg_quest_logs', 'bg_coach_reacts',
    'bg_events', 'bg_entries', 'bg_applies'] loop
    execute format('alter table %I enable row level security', t);
    begin
      execute format('revoke all on table %I from anon, authenticated', t);
    exception when undefined_object then null; -- anon ロールが無い環境（素の Postgres）でも通るように
    end;
  end loop;
end $$;

-- ---------- 内部ヘルパー（anon からは実行できないようにする：下の「権限」） ----------

create or replace function _bg_hash(p text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(digest(coalesce(p, ''), 'sha256'), 'hex')
$$;

-- 制御文字をとって、前後の空白をとって、長さを切る
create or replace function _bg_clean(p text, p_max int) returns text
language sql immutable set search_path = public, extensions as $$
  select left(btrim(regexp_replace(coalesce(p, ''), '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g')), p_max)
$$;

create or replace function _bg_client_ip() returns text
language plpgsql stable set search_path = public, extensions as $$
declare h json;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  return coalesce(nullif(h->>'cf-connecting-ip', ''), nullif(btrim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
end $$;

-- 回数制限：許可なら true。p_window の中で p_max 回をこえたら、p_lock のあいだ false
create or replace function _bg_rate_hit(p_key text, p_max int, p_window interval, p_lock interval) returns boolean
language plpgsql security definer set search_path = public as $$
declare r bg_rate;
begin
  insert into bg_rate (key, count, window_start) values (p_key, 0, now()) on conflict (key) do nothing;
  select * into r from bg_rate where key = p_key for update;
  if r.locked_until is not null and r.locked_until > now() then return false; end if;
  if r.window_start < now() - p_window then
    update bg_rate set count = 1, window_start = now(), locked_until = null where key = p_key;
    return true;
  end if;
  if r.count + 1 > p_max then
    update bg_rate set count = r.count + 1, locked_until = now() + p_lock where key = p_key;
    return false;
  end if;
  update bg_rate set count = r.count + 1 where key = p_key;
  return true;
end $$;

create or replace function _bg_rate_locked(p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bg_rate where key = p_key and locked_until > now())
$$;

create or replace function _bg_rate_clear(p_key text) returns void
language sql security definer set search_path = public as $$
  delete from bg_rate where key = p_key
$$;

create or replace function _bg_new_token(p_member uuid, p_days int) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_tok text := encode(gen_random_bytes(24), 'hex');
begin
  insert into bg_tokens (token_hash, member_id, expires_at) values (_bg_hash(v_tok), p_member, now() + make_interval(days => p_days));
  delete from bg_tokens where expires_at < now() - interval '1 day';
  delete from bg_rate where window_start < now() - interval '2 days' and (locked_until is null or locked_until < now());
  return v_tok;
end $$;

-- トークン → メンバー（なければ id が null）
create or replace function _bg_me(p_token text) returns bg_members
language sql stable security definer set search_path = public, extensions as $$
  select m.* from bg_tokens t join bg_members m on m.id = t.member_id
  where t.token_hash = _bg_hash(p_token) and t.expires_at > now()
$$;

create or replace function _bg_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text; b bytea; i int;
begin
  loop
    b := gen_random_bytes(6); v_code := '';
    for i in 0..5 loop v_code := v_code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from bg_clubs c where c.code = v_code);
  end loop;
  return v_code;
end $$;

-- 子どもの あいことば（6けたの数字。かんたんすぎる形はさける）
create or replace function _bg_pin() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare b bytea; v text;
begin
  loop
    b := gen_random_bytes(3);
    v := lpad(((get_byte(b, 0) * 65536 + get_byte(b, 1) * 256 + get_byte(b, 2)) % 1000000)::text, 6, '0');
    exit when v !~ '^(.)\1+$' and v not in ('123456', '654321', '012345', '543210', '234567', '345678', '456789', '987654', '876543', '765432', '121212', '112233', '123123');
  end loop;
  return v;
end $$;

create or replace function _bg_weak_pass(p text) returns boolean
language sql immutable set search_path = public, extensions as $$
  select char_length(coalesce(p, '')) < 8 or char_length(p) > 64
      or p ~ '^(.)\1*$'
      or lower(p) in ('12345678', '123456789', '1234567890', '87654321', 'password', 'password1', 'qwertyui', 'abcdefgh', 'basketball', '11111111', '00000000')
$$;

-- ことばの点検：悪口・リンク・電話番号のようなもの。だめなら理由のコード、よければ null
create or replace function _bg_ng(p text) returns text
language plpgsql immutable set search_path = public, extensions as $$
declare
  t text := lower(regexp_replace(normalize(coalesce(p, ''), NFKC), '\s', '', 'g'));
  w text;
begin
  if t ~ '(https?:|www\.|\.com|\.jp|\.net)' then return 'no_link'; end if;
  if char_length(regexp_replace(t, '[^0-9]', '', 'g')) >= 10 then return 'private_info'; end if;
  -- 「ばかり」「くずれる」「うごかす」などに まちがって当たらないよう、まぎれにくい形だけ
  foreach w in array array['しね', '死ね', 'ころす', '殺す', 'きもい', 'キモい', 'キモイ', 'うざい', 'ウザい', 'ウザイ',
    'ブス', 'デブ', 'きえろ', '消えろ', 'クズ', 'バカ', '馬鹿', 'アホ', 'へたくそ', 'ヘタクソ', '下手くそ'] loop
    if position(w in t) > 0 then return 'ng_word'; end if;
  end loop;
  return null;
end $$;

create or replace function _bg_level_json(l bg_levels) returns jsonb
language sql stable set search_path = public, extensions as $$
  select case when l.id is null then null
    else jsonb_build_object('id', l.id, 'ord', l.ord, 'name', l.name, 'color', l.color, 'track_id', l.track_id,
      'track', (select t.name from bg_tracks t where t.id = l.track_id)) end
$$;

create or replace function _bg_member_json(m bg_members) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', m.id, 'role', m.role, 'no', m.no, 'nickname', m.nickname, 'grade', m.grade,
    'kyu', (select _bg_level_json(l) from bg_levels l where l.id = m.kyu_level_id))
$$;

create or replace function _bg_club_json(c bg_clubs, p_coach boolean) returns jsonb
language sql stable set search_path = public, extensions as $$
  select jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name, 'settings', c.settings)
    || case when p_coach then jsonb_build_object('apply_code', c.apply_code, 'apply_note', c.apply_note) else '{}'::jsonb end
$$;

-- 級と課題（級の種類の じゅんに、下の級から）。しまった種類の級は 出さない
create or replace function _bg_levels_json(p_club uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'ord', l.ord, 'name', l.name, 'color', l.color, 'note', l.note, 'track_id', l.track_id,
    'tasks', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'drill_id', t.drill_id, 'target', t.target,
      'unit', t.unit, 'cond', t.cond, 'how', t.how, 'photo', t.photo) order by t.ord), '[]'::jsonb)
      from bg_tasks t where t.level_id = l.id and not t.archived)) order by tr.ord, tr.created_at, l.ord), '[]'::jsonb)
  from bg_levels l join bg_tracks tr on tr.id = l.track_id and not tr.archived
  where l.club_id = p_club and not l.archived
$$;

-- 級と課題を書きかえる（v1 の呼び方。メインの種類＝いちばん上の種類の級として）
create or replace function _bg_levels_put(p_club uuid, p_levels jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _bg_track_levels_put(p_club, _bg_main_track(p_club), p_levels);
end $$;

-- 写真の点検：だめなら理由のコード、よければ null
create or replace function _bg_photo_check(p_club uuid, p_b64 text, p_mime text) returns text
language plpgsql stable security definer set search_path = public as $$
declare v bytea;
begin
  if coalesce(p_mime, '') not in ('image/jpeg', 'image/png', 'image/webp') then return 'bad_photo'; end if;
  begin v := decode(regexp_replace(coalesce(p_b64, ''), '\s', '', 'g'), 'base64'); exception when others then return 'bad_photo'; end;
  if length(v) < 100 then return 'bad_photo'; end if;
  if length(v) > 300000 then return 'photo_big'; end if;
  -- 中身が本当に画像か（ファイルの頭の形）
  if not (substr(v, 1, 3) = '\xffd8ff'::bytea or substr(v, 1, 8) = '\x89504e470d0a1a0a'::bytea
          or (substr(v, 1, 4) = '\x52494646'::bytea and substr(v, 9, 4) = '\x57454250'::bytea)) then
    return 'bad_photo';
  end if;
  if (select count(*) from bg_photos where club_id = p_club) >= 300 then return 'photo_full'; end if;
  return null;
end $$;

create or replace function _bg_photo_put(m bg_members, p_kind text, p_b64 text, p_mime text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into bg_photos (club_id, member_id, kind, mime, data)
  values (m.club_id, m.id, p_kind, p_mime, decode(regexp_replace(p_b64, '\s', '', 'g'), 'base64'))
  returning id into v_id;
  return v_id;
end $$;

create or replace function _bg_sub_json(s bg_subs) returns jsonb
language sql stable set search_path = public, extensions as $$
  select jsonb_build_object('id', s.id, 'task_id', s.task_id, 'count', s.count, 'note', s.note, 'status', s.status,
    'comment', s.comment, 'photo_id', s.photo_id, 'check', s.check_json, 'created_at', s.created_at, 'reviewed_at', s.reviewed_at)
$$;

-- 動画チェックの結果は、小さくして かたちをそろえてから残す
create or replace function _bg_check_clean(p jsonb) returns jsonb
language sql immutable set search_path = public, extensions as $$
  select case when p is null or jsonb_typeof(p) <> 'object' or pg_column_size(p) > 6000 then null
    else jsonb_strip_nulls(jsonb_build_object(
      'mode', left(coalesce(p->>'mode', ''), 20),
      'label', left(coalesce(p->>'label', ''), 30),
      'score', case when coalesce(p->>'score', '') ~ '^[0-9]{1,3}$' then (p->>'score')::int end,
      'metrics', (select jsonb_agg(jsonb_build_object('label', left(coalesce(x->>'label', ''), 30), 'value', left(coalesce(x->>'value', ''), 30),
                    'status', case when x->>'status' in ('good', 'ok', 'bad', 'na') then x->>'status' else 'na' end))
                  from (select value as x from jsonb_array_elements(case when jsonb_typeof(p->'metrics') = 'array' then p->'metrics' else '[]'::jsonb end) limit 8) q)))
  end
$$;

-- その子が、その級の課題をぜんぶ合格したか
create or replace function _bg_level_done(p_member uuid, p_level uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bg_tasks t where t.level_id = p_level and not t.archived)
     and not exists (
       select 1 from bg_tasks t where t.level_id = p_level and not t.archived
       and not exists (select 1 from bg_subs s where s.member_id = p_member and s.task_id = t.id and s.status = 'pass'))
$$;

-- 「いまの級」＝メインの種類で 認定された いちばん上の級
create or replace function _bg_recount_kyu(p_member uuid) returns void
language sql security definer set search_path = public as $$
  update bg_members m set kyu_level_id = (
    select l.id from bg_certs c join bg_levels l on l.id = c.level_id
    where c.member_id = m.id and not l.archived
      and l.track_id = (select t.id from bg_tracks t where t.club_id = m.club_id and not t.archived order by t.ord, t.created_at limit 1)
    order by l.ord desc limit 1)
  where m.id = p_member
$$;

-- ---------- v2 の内部ヘルパー ----------

-- 日本の「きょう」（自主練の1日・しめきり・予定の日は、日本の日付で数える）
create or replace function _bg_today() returns date
language sql stable set search_path = public, extensions as $$
  select (now() at time zone 'Asia/Tokyo')::date
$$;

-- メインの級の種類（いちばん上）。なければ「総合」をつくる
create or replace function _bg_main_track(p_club uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from bg_tracks where club_id = p_club and not archived order by ord, created_at limit 1;
  if v is null then
    insert into bg_tracks (club_id, ord, name, icon) values (p_club, 0, '総合', 'trophy') returning id into v;
  end if;
  return v;
end $$;

-- クラブの子ども全員の「いまの級」を計算しなおす
create or replace function _bg_recount_club(p_club uuid) returns void
language sql security definer set search_path = public as $$
  update bg_members m set kyu_level_id = (
    select l.id from bg_certs c join bg_levels l on l.id = c.level_id
    where c.member_id = m.id and not l.archived
      and l.track_id = (select t.id from bg_tracks t where t.club_id = m.club_id and not t.archived order by t.ord, t.created_at limit 1)
    order by l.ord desc limit 1)
  where m.club_id = p_club and m.role = 'kid'
$$;

-- 1つの種類の 級と課題を書きかえる（id のあるものは直す・ないものは足す・のっていないものはしまう）
create or replace function _bg_track_levels_put(p_club uuid, p_track uuid, p_levels jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  lv jsonb; tk jsonb; i int := 0; j int;
  v_lid uuid; v_tid uuid; keep_l uuid[] := '{}'; keep_t uuid[] := '{}';
  v_name text; v_title text; v_unit text; v_photo text; v_color text; v_target int;
begin
  if p_levels is null or jsonb_typeof(p_levels) <> 'array' or p_track is null then return; end if;
  for lv in select value from jsonb_array_elements(p_levels) limit 20 loop
    v_name := _bg_clean(lv->>'name', 12);
    if v_name = '' then v_name := (i + 1)::text || 'だんめ'; end if;
    v_color := case when coalesce(lv->>'color', '') ~ '^#[0-9a-fA-F]{6}$' then lv->>'color' else '' end;
    v_lid := null;
    if coalesce(lv->>'id', '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select id into v_lid from bg_levels where id = (lv->>'id')::uuid and club_id = p_club and track_id = p_track;
    end if;
    if v_lid is null then
      insert into bg_levels (club_id, track_id, ord, name, color, note) values (p_club, p_track, i, v_name, v_color, _bg_clean(lv->>'note', 40)) returning id into v_lid;
    else
      update bg_levels set ord = i, name = v_name, color = v_color, note = _bg_clean(lv->>'note', 40), archived = false where id = v_lid;
    end if;
    keep_l := keep_l || v_lid;
    j := 0;
    for tk in select value from jsonb_array_elements(case when jsonb_typeof(lv->'tasks') = 'array' then lv->'tasks' else '[]'::jsonb end) limit 12 loop
      v_title := _bg_clean(tk->>'title', 40);
      continue when v_title = '';
      v_unit := case when tk->>'unit' in ('回', '本', '秒', '往復', 'セット', '分', '周', 'm', '点') then tk->>'unit' else '回' end;
      v_photo := case when tk->>'photo' in ('need', 'opt', 'none') then tk->>'photo' else 'opt' end;
      v_target := case when coalesce(tk->>'target', '') ~ '^[0-9]{1,4}$' then greatest(1, (tk->>'target')::int) else 1 end;
      v_tid := null;
      if coalesce(tk->>'id', '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        select t.id into v_tid from bg_tasks t join bg_levels l on l.id = t.level_id
        where t.id = (tk->>'id')::uuid and t.club_id = p_club and l.track_id = p_track;
      end if;
      if v_tid is null then
        insert into bg_tasks (club_id, level_id, ord, title, drill_id, target, unit, cond, how, photo)
        values (p_club, v_lid, j, v_title, case when coalesce(tk->>'drill_id', '') ~ '^[a-z0-9-]{1,40}$' then tk->>'drill_id' else '' end,
          v_target, v_unit, _bg_clean(tk->>'cond', 20), _bg_clean(tk->>'how', 200), v_photo)
        returning id into v_tid;
      else
        update bg_tasks set level_id = v_lid, ord = j, title = v_title,
          drill_id = case when coalesce(tk->>'drill_id', '') ~ '^[a-z0-9-]{1,40}$' then tk->>'drill_id' else '' end,
          target = v_target, unit = v_unit, cond = _bg_clean(tk->>'cond', 20), how = _bg_clean(tk->>'how', 200), photo = v_photo, archived = false
        where id = v_tid;
      end if;
      keep_t := keep_t || v_tid;
      j := j + 1;
    end loop;
    i := i + 1;
  end loop;
  update bg_levels set archived = true where club_id = p_club and track_id = p_track and not (id = any(keep_l));
  update bg_tasks t set archived = true from bg_levels l
  where l.id = t.level_id and l.track_id = p_track and t.club_id = p_club and not (t.id = any(keep_t));
  -- しまった級の認定は残すが、「いまの級」は のこっている級から計算しなおす
  perform _bg_recount_club(p_club);
end $$;

-- 級の種類（しまっていないもの）
create or replace function _bg_tracks_json(p_club uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'ord', t.ord, 'name', t.name, 'icon', t.icon) order by t.ord, t.created_at), '[]'::jsonb)
  from bg_tracks t where t.club_id = p_club and not t.archived
$$;

-- その子の 種類ごとの いまの級（認定された いちばん上の級）
create or replace function _bg_kyus_json(p_member uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('track_id', x.track_id, 'level', x.lj) order by x.tord, x.tat), '[]'::jsonb)
  from (select distinct on (t.id) t.id as track_id, t.ord as tord, t.created_at as tat, _bg_level_json(l) as lj
        from bg_certs c join bg_levels l on l.id = c.level_id and not l.archived
        join bg_tracks t on t.id = l.track_id and not t.archived
        where c.member_id = p_member
        order by t.id, l.ord desc) x
$$;

-- 認定できる（課題がぜんぶ合格で、まだ認定していない）子と級
create or replace function _bg_ready(p_club uuid) returns table (member_id uuid, level_id uuid)
language sql stable security definer set search_path = public as $$
  with lt as (
    select l.id as level_id, count(t.id) as n from bg_levels l
    join bg_tracks tr on tr.id = l.track_id and not tr.archived
    join bg_tasks t on t.level_id = l.id and not t.archived
    where l.club_id = p_club and not l.archived group by l.id),
  kp as (
    select s.member_id, t.level_id, count(distinct t.id) as n from bg_subs s
    join bg_tasks t on t.id = s.task_id and not t.archived
    where s.club_id = p_club and s.status = 'pass' group by s.member_id, t.level_id)
  select kp.member_id, kp.level_id from kp join lt on lt.level_id = kp.level_id and kp.n = lt.n
  where not exists (select 1 from bg_certs x where x.member_id = kp.member_id and x.level_id = kp.level_id)
$$;

-- コーチの 拍手・いいね・怒り（だれが・どれを）
create or replace function _bg_creacts_json(p_post uuid, p_log uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('stamp', r.stamp, 'comment', r.comment, 'by', k.nickname, 'coach_id', r.coach_id, 'at', r.created_at)
    order by r.created_at), '[]'::jsonb)
  from bg_coach_reacts r join bg_members k on k.id = r.coach_id
  where (p_post is not null and r.post_id = p_post) or (p_log is not null and r.log_id = p_log)
$$;

create or replace function _bg_quest_json(q bg_quests) returns jsonb
language sql stable set search_path = public, extensions as $$
  select jsonb_build_object('id', q.id, 'title', q.title, 'drill_id', q.drill_id, 'target', q.target, 'unit', q.unit,
    'times', q.times, 'start_on', q.start_on, 'end_on', q.end_on, 'photo', q.photo, 'how', q.how,
    'members', case when q.members is null then null else to_jsonb(q.members) end, 'archived', q.archived, 'created_at', q.created_at)
$$;

create or replace function _bg_log_json(g bg_quest_logs) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', g.id, 'quest_id', g.quest_id, 'member_id', g.member_id, 'count', g.count, 'note', g.note,
    'photo_id', g.photo_id, 'day', g.day, 'created_at', g.created_at, 'coach', _bg_creacts_json(null, g.id))
$$;

create or replace function _bg_event_json(e bg_events) returns jsonb
language sql stable set search_path = public, extensions as $$
  select jsonb_build_object('id', e.id, 'title', e.title, 'kind', e.kind, 'day', e.day, 'time', e.time_text, 'place', e.place,
    'note', e.note, 'deadline', e.deadline, 'capacity', e.capacity, 'closed', e.closed,
    'members', case when e.members is null then null else to_jsonb(e.members) end,
    'open', (not e.closed and e.day >= _bg_today() and (e.deadline is null or e.deadline >= _bg_today())))
$$;

-- その子に見える自主練（おわって7日まで）と、自分の回数
create or replace function _bg_kid_quests(k bg_members) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg((_bg_quest_json(q) - 'members') || jsonb_build_object(
      'n', (select count(*) from bg_quest_logs g where g.quest_id = q.id and g.member_id = k.id),
      'today', (select count(*) from bg_quest_logs g where g.quest_id = q.id and g.member_id = k.id and g.day = _bg_today()),
      'last', (select max(g.created_at) from bg_quest_logs g where g.quest_id = q.id and g.member_id = k.id),
      'coach', (select count(*) from bg_coach_reacts r join bg_quest_logs g on g.id = r.log_id where g.quest_id = q.id and g.member_id = k.id))
    order by q.end_on, q.created_at), '[]'::jsonb)
  from bg_quests q
  where q.club_id = k.club_id and not q.archived and (q.members is null or k.id = any(q.members))
    and q.end_on >= _bg_today() - 7
$$;

-- その子に見える予定（きのうから先）と、自分の答え
create or replace function _bg_kid_events(k bg_members) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg((_bg_event_json(e) - 'members') || jsonb_build_object(
      'mine', (select jsonb_build_object('answer', x.answer, 'note', x.note, 'by_coach', x.by_coach) from bg_entries x where x.event_id = e.id and x.member_id = k.id),
      'yes', (select count(*) from bg_entries x where x.event_id = e.id and x.answer = 'yes'))
    order by e.day, e.created_at), '[]'::jsonb)
  from bg_events e
  where e.club_id = k.club_id and (e.members is null or k.id = any(e.members)) and e.day >= _bg_today() - 1
$$;

-- 古いものを消す：評価から45日たった提出の写真・45日たった自主練の写真・90日たった申し込み
create or replace function _bg_cleanup(p_club uuid) returns void
language sql security definer set search_path = public as $$
  delete from bg_photos p using bg_subs s
  where s.photo_id = p.id and s.club_id = p_club and s.status <> 'pending' and s.reviewed_at < now() - interval '45 days';
  delete from bg_photos p where p.club_id = p_club and p.kind = 'log' and p.created_at < now() - interval '45 days';
  delete from bg_applies a where a.club_id = p_club and a.created_at < now() - interval '90 days';
$$;

-- 申し込みのことばの点検（リンクと悪口だけ。電話番号は 連絡先に書いてよい）
create or replace function _bg_ng_soft(p text) returns text
language plpgsql immutable set search_path = public, extensions as $$
declare v text := _bg_ng(p);
begin
  if v = 'private_info' then return null; end if;
  return v;
end $$;

-- 申し込みのリンク用のコード（8文字）
create or replace function _bg_apply_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text; b bytea; i int;
begin
  loop
    b := gen_random_bytes(8); v_code := '';
    for i in 0..7 loop v_code := v_code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from bg_clubs c where c.apply_code = v_code);
  end loop;
  return v_code;
end $$;

-- 子どもの id の一覧（jsonb の配列）を、そのクラブの子どもだけにする。空・null なら null（＝全員）
create or replace function _bg_kid_ids(p_club uuid, p_members jsonb) returns uuid[]
language sql stable security definer set search_path = public as $$
  select case when p_members is null or jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) = 0 then null
    else (select array_agg(k.id order by k.no) from bg_members k
          where k.club_id = p_club and k.role = 'kid' and k.id::text in (select jsonb_array_elements_text(p_members))) end
$$;

-- ---------- ログイン ----------

-- クラブをつくる（コーチ）。p_levels：級と課題（アプリのテンプレートをそのまま送ってよい）
create or replace function bg_club_create(p_name text, p_pass text, p_coach text, p_levels jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c bg_clubs; m bg_members; v_name text := _bg_clean(p_name, 30); v_coach text := _bg_clean(p_coach, 12);
begin
  if not _bg_rate_hit('create:' || _bg_client_ip(), 10, interval '1 hour', interval '1 hour') then
    return jsonb_build_object('error', 'locked');
  end if;
  if v_name = '' then return jsonb_build_object('error', 'bad_name'); end if;
  if v_coach = '' then return jsonb_build_object('error', 'bad_coach'); end if;
  if _bg_weak_pass(p_pass) then return jsonb_build_object('error', 'weak_password'); end if;
  insert into bg_clubs (code, name, coach_hash) values (_bg_code(), v_name, crypt(p_pass, gen_salt('bf', 8))) returning * into c;
  insert into bg_members (club_id, role, nickname) values (c.id, 'coach', v_coach) returning * into m;
  perform _bg_levels_put(c.id, p_levels);
  return jsonb_build_object('ok', true, 'token', _bg_new_token(m.id, 30), 'club', _bg_club_json(c, true), 'me', _bg_member_json(m));
end $$;

-- コーチのログイン（クラブコード・合言葉・名前）。はじめての名前なら、コーチを1人ふやす（10人まで）
create or replace function bg_coach_login(p_code text, p_pass text, p_name text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c bg_clubs; m bg_members; v_name text := _bg_clean(p_name, 12);
begin
  if not _bg_rate_hit('clogin:' || _bg_client_ip(), 100, interval '10 minutes', interval '10 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into c from bg_clubs where code = upper(btrim(coalesce(p_code, '')));
  if not found then return jsonb_build_object('error', 'bad_login'); end if;
  if _bg_rate_locked('cpass:' || c.id) then return jsonb_build_object('error', 'locked'); end if;
  if crypt(coalesce(p_pass, ''), c.coach_hash) <> c.coach_hash then
    perform _bg_rate_hit('cpass:' || c.id, 9, interval '10 minutes', interval '15 minutes'); -- 10回まちがえると 15分 入れない
    return jsonb_build_object('error', 'bad_login');
  end if;
  perform _bg_rate_clear('cpass:' || c.id);
  if v_name = '' then return jsonb_build_object('error', 'bad_coach'); end if;
  select * into m from bg_members where club_id = c.id and role = 'coach' and nickname = v_name;
  if not found then
    if (select count(*) from bg_members where club_id = c.id and role = 'coach') >= 10 then
      return jsonb_build_object('error', 'too_many');
    end if;
    insert into bg_members (club_id, role, nickname) values (c.id, 'coach', v_name) returning * into m;
  end if;
  return jsonb_build_object('ok', true, 'token', _bg_new_token(m.id, 30), 'club', _bg_club_json(c, true), 'me', _bg_member_json(m));
end $$;

-- 子どものログイン（クラブコード・ばんごう・あいことば）
create or replace function bg_kid_login(p_code text, p_no int, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c bg_clubs; m bg_members;
begin
  if not _bg_rate_hit('klogin:' || _bg_client_ip(), 300, interval '10 minutes', interval '10 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into c from bg_clubs where code = upper(btrim(coalesce(p_code, '')));
  if not found then return jsonb_build_object('error', 'bad_login'); end if;
  select * into m from bg_members where club_id = c.id and role = 'kid' and no = p_no;
  if not found then return jsonb_build_object('error', 'bad_login'); end if;
  if _bg_rate_locked('kpin:' || m.id) then return jsonb_build_object('error', 'locked'); end if;
  if m.pin_hash is null or crypt(coalesce(btrim(p_pin), ''), m.pin_hash) <> m.pin_hash then
    perform _bg_rate_hit('kpin:' || m.id, 7, interval '10 minutes', interval '15 minutes'); -- 8回まちがえると 15分 入れない
    return jsonb_build_object('error', 'bad_login');
  end if;
  perform _bg_rate_clear('kpin:' || m.id);
  return jsonb_build_object('ok', true, 'token', _bg_new_token(m.id, 180), 'club', _bg_club_json(c, false), 'me', _bg_member_json(m));
end $$;

create or replace function bg_logout(p_token text)
returns jsonb language sql security definer set search_path = public, extensions as $$
  with d as (delete from bg_tokens where token_hash = _bg_hash(p_token)) select jsonb_build_object('ok', true)
$$;

-- ---------- クラブのホーム（級・課題・自分の記録・お知らせ） ----------
create or replace function bg_home(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; c bg_clubs; v jsonb; v_today date := _bg_today();
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into c from bg_clubs where id = m.club_id;
  v := jsonb_build_object('ok', true, 'me', _bg_member_json(m), 'club', _bg_club_json(c, m.role = 'coach'),
    'tracks', _bg_tracks_json(c.id), 'levels', _bg_levels_json(c.id), 'today', v_today);
  if m.role = 'kid' then
    v := v || jsonb_build_object(
      'kyus', _bg_kyus_json(m.id),
      'subs', (select coalesce(jsonb_agg(_bg_sub_json(s) order by s.created_at desc), '[]'::jsonb)
               from bg_subs s where s.id in (select id from bg_subs where member_id = m.id order by created_at desc limit 300)),
      'certs', (select coalesce(jsonb_agg(jsonb_build_object('level_id', x.level_id, 'comment', x.comment, 'at', x.created_at) order by x.created_at), '[]'::jsonb)
                from bg_certs x where x.member_id = m.id),
      'quests', _bg_kid_quests(m),
      'events', _bg_kid_events(m),
      'notices', jsonb_build_object(
        'reviews', (select count(*) from bg_subs where member_id = m.id and reviewed_at > m.seen_at),
        'certs', (select count(*) from bg_certs where member_id = m.id and created_at > m.seen_at),
        'reacts', (select count(*) from bg_reacts r join bg_posts p on p.id = r.post_id
                   where p.member_id = m.id and r.member_id <> m.id and r.created_at > m.seen_at),
        'coach', (select count(*) from bg_coach_reacts r where r.club_id = m.club_id and r.created_at > m.seen_at
                  and (r.post_id in (select p.id from bg_posts p where p.member_id = m.id)
                       or r.log_id in (select g.id from bg_quest_logs g where g.member_id = m.id))),
        'quests', (select count(*) from bg_quests q where q.club_id = m.club_id and not q.archived and q.created_at > m.seen_at
                   and q.end_on >= v_today and (q.members is null or m.id = any(q.members))),
        'events', (select count(*) from bg_events e where e.club_id = m.club_id and not e.closed and e.day >= v_today
                   and (e.deadline is null or e.deadline >= v_today) and (e.members is null or m.id = any(e.members))
                   and not exists (select 1 from bg_entries x where x.event_id = e.id and x.member_id = m.id))));
  else
    v := v || jsonb_build_object('counts', jsonb_build_object(
      'pending', (select count(*) from bg_subs s join bg_tasks t on t.id = s.task_id where s.club_id = c.id and s.status = 'pending' and not t.archived),
      'waiting', (select count(*) from bg_posts where club_id = c.id and status = 'waiting'),
      'kids', (select count(*) from bg_members where club_id = c.id and role = 'kid'),
      'ready', (select count(*) from _bg_ready(c.id)),
      'quests', (select count(*) from bg_quests q where q.club_id = c.id and not q.archived and q.end_on >= v_today),
      'logs_today', (select count(*) from bg_quest_logs g where g.club_id = c.id and g.day = v_today),
      'unrated', (select count(*) from bg_quest_logs g where g.club_id = c.id and g.created_at > now() - interval '7 days'
                  and not exists (select 1 from bg_coach_reacts r where r.log_id = g.id)),
      'events', (select count(*) from bg_events e where e.club_id = c.id and not e.closed and e.day >= v_today),
      'applies', (select count(*) from bg_applies a where a.club_id = c.id and a.status = 'new')));
  end if;
  return v;
end $$;

-- お知らせを見た
create or replace function bg_seen(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  update bg_members set seen_at = now() where id = m.id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 子ども：課題を提出する ----------
create or replace function bg_submit(p_token text, p_task_id uuid, p_count int, p_note text, p_photo text, p_mime text, p_check jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; t bg_tasks; v_err text; v_pid uuid; v_old bg_subs; v_id uuid; v_note text := _bg_clean(p_note, 100);
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'kid' then return jsonb_build_object('error', 'not_kid'); end if;
  if not _bg_rate_hit('sub:' || m.id, 40, interval '1 hour', interval '30 minutes') then return jsonb_build_object('error', 'locked'); end if;
  select * into t from bg_tasks where id = p_task_id and club_id = m.club_id and not archived;
  if not found then return jsonb_build_object('error', 'bad_task'); end if;
  if p_count is not null and (p_count < 0 or p_count > 100000) then return jsonb_build_object('error', 'bad_count'); end if;
  v_err := _bg_ng(v_note);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  if coalesce(p_photo, '') <> '' then
    if t.photo = 'none' then return jsonb_build_object('error', 'no_photo'); end if;
    v_err := _bg_photo_check(m.club_id, p_photo, p_mime);
    if v_err is not null then return jsonb_build_object('error', v_err); end if;
    v_pid := _bg_photo_put(m, 'sub', p_photo, p_mime);
  elsif t.photo = 'need' then
    return jsonb_build_object('error', 'need_photo');
  end if;
  -- 同じ課題の「確認まち」があれば、新しいほうで おきかえる（前の写真は消す）
  select * into v_old from bg_subs where member_id = m.id and task_id = t.id and status = 'pending' order by created_at desc limit 1;
  if v_old.id is not null then
    update bg_subs set count = p_count, note = v_note, photo_id = v_pid, check_json = _bg_check_clean(p_check), created_at = now()
    where id = v_old.id;
    if v_old.photo_id is not null and v_old.photo_id is distinct from v_pid then delete from bg_photos where id = v_old.photo_id; end if;
    v_id := v_old.id;
  else
    insert into bg_subs (club_id, member_id, task_id, count, note, photo_id, check_json)
    values (m.club_id, m.id, t.id, p_count, v_note, v_pid, _bg_check_clean(p_check))
    returning id into v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- 確認まちの提出を取り消す（本人）
create or replace function bg_sub_cancel(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; s bg_subs;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into s from bg_subs where id = p_id and member_id = m.id and status = 'pending';
  if not found then return jsonb_build_object('error', 'bad_sub'); end if;
  delete from bg_subs where id = s.id;
  if s.photo_id is not null then delete from bg_photos where id = s.photo_id; end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- コーチ：確認・評価・認定 ----------

-- 確認まちの一覧（古い順）と、さいきん評価したもの・認定できる人
create or replace function bg_queue(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  perform _bg_cleanup(m.club_id); -- 評価から45日たった提出の写真などを消す
  return jsonb_build_object('ok', true,
    'pending', (select coalesce(jsonb_agg(x.j order by x.at), '[]'::jsonb) from (
      select s.created_at as at, _bg_sub_json(s) || jsonb_build_object('member', _bg_member_json(k),
        'task', jsonb_build_object('id', t.id, 'title', t.title, 'target', t.target, 'unit', t.unit, 'cond', t.cond, 'drill_id', t.drill_id,
          'level', _bg_level_json(l))) as j
      from bg_subs s join bg_members k on k.id = s.member_id join bg_tasks t on t.id = s.task_id join bg_levels l on l.id = t.level_id
      where s.club_id = m.club_id and s.status = 'pending' and not t.archived
      order by s.created_at limit 100) x),
    'recent', (select coalesce(jsonb_agg(x.j order by x.at desc), '[]'::jsonb) from (
      select s.reviewed_at as at, _bg_sub_json(s) || jsonb_build_object('member', _bg_member_json(k),
        'task', jsonb_build_object('id', t.id, 'title', t.title, 'target', t.target, 'unit', t.unit, 'cond', t.cond, 'level', _bg_level_json(l))) as j
      from bg_subs s join bg_members k on k.id = s.member_id join bg_tasks t on t.id = s.task_id join bg_levels l on l.id = t.level_id
      where s.club_id = m.club_id and s.status <> 'pending'
      order by s.reviewed_at desc limit 30) x),
    'ready', (select coalesce(jsonb_agg(jsonb_build_object('member', _bg_member_json(k), 'level', _bg_level_json(l)) order by k.no, tr.ord, l.ord), '[]'::jsonb)
      from _bg_ready(m.club_id) r join bg_members k on k.id = r.member_id join bg_levels l on l.id = r.level_id join bg_tracks tr on tr.id = l.track_id));
end $$;

-- 評価：'pass'（合格）・'retry'（もう一度）と、ひとこと
create or replace function bg_review(p_token text, p_id uuid, p_status text, p_comment text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; s bg_subs; v_level uuid;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if p_status not in ('pass', 'retry') then return jsonb_build_object('error', 'bad_status'); end if;
  select * into s from bg_subs where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_sub'); end if;
  update bg_subs set status = p_status, comment = _bg_clean(p_comment, 200), coach_id = m.id, reviewed_at = now() where id = s.id;
  select level_id into v_level from bg_tasks where id = s.task_id;
  return jsonb_build_object('ok', true, 'member_id', s.member_id, 'level_id', v_level,
    'level_done', _bg_level_done(s.member_id, v_level) and not exists (select 1 from bg_certs where member_id = s.member_id and level_id = v_level));
end $$;

-- 級の認定（コーチが「8級 合格」を返す）。課題がそろっていなくても、コーチの判断で認定できる
create or replace function bg_grant(p_token text, p_member_id uuid, p_level_id uuid, p_comment text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; k bg_members; l bg_levels; c bg_clubs; v_new boolean; v_track text;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into k from bg_members where id = p_member_id and club_id = m.club_id and role = 'kid';
  if not found then return jsonb_build_object('error', 'bad_member'); end if;
  select l2.* into l from bg_levels l2 join bg_tracks t on t.id = l2.track_id and not t.archived
  where l2.id = p_level_id and l2.club_id = m.club_id and not l2.archived;
  if not found then return jsonb_build_object('error', 'bad_level'); end if;
  select name into v_track from bg_tracks where id = l.track_id;
  select * into c from bg_clubs where id = m.club_id;
  v_new := not exists (select 1 from bg_certs where member_id = k.id and level_id = l.id);
  insert into bg_certs (club_id, member_id, level_id, coach_id, comment)
  values (m.club_id, k.id, l.id, m.id, _bg_clean(p_comment, 200))
  on conflict (member_id, level_id) do update set comment = excluded.comment, coach_id = excluded.coach_id;
  perform _bg_recount_kyu(k.id);
  -- ひろばに「合格」をのせる（クラブの設定で止められる）
  if v_new and coalesce((c.settings->>'cert_posts')::boolean, true) then
    insert into bg_posts (club_id, member_id, kind, body, meta, status)
    values (m.club_id, k.id, 'cert', '', jsonb_build_object('level_id', l.id, 'level', l.name, 'color', l.color, 'track', v_track, 'by', m.nickname,
      'comment', _bg_clean(p_comment, 200)), 'shown');
  end if;
  select * into k from bg_members where id = k.id;
  return jsonb_build_object('ok', true, 'member', _bg_member_json(k), 'level', _bg_level_json(l));
end $$;

-- 認定をとり消す（まちがえたとき）
create or replace function bg_cert_remove(p_token text, p_member_id uuid, p_level_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; k bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into k from bg_members where id = p_member_id and club_id = m.club_id and role = 'kid';
  if not found then return jsonb_build_object('error', 'bad_member'); end if;
  delete from bg_certs where member_id = k.id and level_id = p_level_id;
  delete from bg_posts where member_id = k.id and kind = 'cert' and meta->>'level_id' = p_level_id::text;
  perform _bg_recount_kyu(k.id);
  select * into k from bg_members where id = k.id;
  return jsonb_build_object('ok', true, 'member', _bg_member_json(k));
end $$;

-- 級と課題をつくる・直す（コーチ）。p_levels は下の級から順に
create or replace function bg_levels_save(p_token text, p_levels jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if p_levels is null or jsonb_typeof(p_levels) <> 'array' or jsonb_array_length(p_levels) = 0 then
    return jsonb_build_object('error', 'bad_levels');
  end if;
  perform _bg_levels_put(m.club_id, p_levels);
  return jsonb_build_object('ok', true, 'levels', _bg_levels_json(m.club_id));
end $$;

-- ---------- コーチ：メンバー ----------
create or replace function bg_members_list(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  return jsonb_build_object('ok', true, 'members', (select coalesce(jsonb_agg(_bg_member_json(k) || jsonb_build_object(
      'kyus', _bg_kyus_json(k.id),
      'passes', (select count(*) from bg_subs s where s.member_id = k.id and s.status = 'pass'),
      'pending', (select count(*) from bg_subs s where s.member_id = k.id and s.status = 'pending'),
      'certs', (select coalesce(jsonb_agg(x.level_id), '[]'::jsonb) from bg_certs x where x.member_id = k.id),
      'logs', (select count(*) from bg_quest_logs g where g.member_id = k.id),
      'last', greatest((select max(created_at) from bg_subs s where s.member_id = k.id), (select max(created_at) from bg_posts p where p.member_id = k.id),
        (select max(created_at) from bg_quest_logs g where g.member_id = k.id)))
    order by k.role, k.no nulls first, k.created_at), '[]'::jsonb)
    from bg_members k where k.club_id = m.club_id));
end $$;

-- 子どもをふやす（コーチ）。あいことばは この1回だけ返す（ログインカードに印刷する）
create or replace function bg_member_add(p_token text, p_nickname text, p_grade text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; k bg_members; v_pin text := _bg_pin(); v_name text := _bg_clean(p_nickname, 12); v_no int;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if v_name = '' then return jsonb_build_object('error', 'bad_name'); end if;
  if (select count(*) from bg_members where club_id = m.club_id and role = 'kid') >= 200 then return jsonb_build_object('error', 'too_many'); end if;
  perform 1 from bg_clubs where id = m.club_id for update; -- ばんごうの取り合いをふせぐ
  select coalesce(max(no), 0) + 1 into v_no from bg_members where club_id = m.club_id;
  insert into bg_members (club_id, role, no, nickname, grade, pin_hash)
  values (m.club_id, 'kid', v_no, v_name, case when p_grade in ('e12', 'e34', 'e56', 'j1', 'j2', 'j3', 'h', 'a') then p_grade else '' end,
    crypt(v_pin, gen_salt('bf', 6)))
  returning * into k;
  return jsonb_build_object('ok', true, 'member', _bg_member_json(k), 'pin', v_pin);
end $$;

-- 子どもの名前・学年を直す。p_reset_pin なら あいことばを作りなおす（ほかの端末はログアウト）
create or replace function bg_member_update(p_token text, p_member_id uuid, p_nickname text, p_grade text, p_reset_pin boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; k bg_members; v_pin text; v_name text := _bg_clean(p_nickname, 12);
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into k from bg_members where id = p_member_id and club_id = m.club_id and role = 'kid';
  if not found then return jsonb_build_object('error', 'bad_member'); end if;
  update bg_members set
    nickname = case when v_name <> '' then v_name else nickname end,
    grade = case when p_grade in ('e12', 'e34', 'e56', 'j1', 'j2', 'j3', 'h', 'a', '') then p_grade else grade end
  where id = k.id;
  if coalesce(p_reset_pin, false) then
    v_pin := _bg_pin();
    update bg_members set pin_hash = crypt(v_pin, gen_salt('bf', 6)) where id = k.id;
    delete from bg_tokens where member_id = k.id;
    perform _bg_rate_clear('kpin:' || k.id);
  end if;
  select * into k from bg_members where id = k.id;
  return jsonb_build_object('ok', true, 'member', _bg_member_json(k), 'pin', v_pin);
end $$;

-- 子どもを消す（記録・写真・投稿もすべて消える）
create or replace function bg_member_remove(p_token text, p_member_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  delete from bg_members where id = p_member_id and club_id = m.club_id and role = 'kid';
  if not found then return jsonb_build_object('error', 'bad_member'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- コーチ：クラブの設定 ----------
-- p_settings：review_posts（ひろばの投稿はコーチの確認のあと）・review_photos（写真つきは確認のあと）・photos（ひろばに写真）・cert_posts（合格をひろばに）
-- 合言葉を変えるときは p_old_pass と p_new_pass（ほかのコーチの端末はログアウト）
create or replace function bg_club_update(p_token text, p_name text, p_settings jsonb, p_old_pass text, p_new_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; c bg_clubs; s jsonb; k text;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into c from bg_clubs where id = m.club_id for update;
  s := c.settings;
  if p_settings is not null and jsonb_typeof(p_settings) = 'object' then
    foreach k in array array['review_posts', 'review_photos', 'photos', 'cert_posts'] loop
      if jsonb_typeof(p_settings->k) = 'boolean' then s := s || jsonb_build_object(k, p_settings->k); end if;
    end loop;
  end if;
  update bg_clubs set settings = s, name = case when _bg_clean(p_name, 30) <> '' then _bg_clean(p_name, 30) else name end where id = c.id;
  if coalesce(p_new_pass, '') <> '' then
    if crypt(coalesce(p_old_pass, ''), c.coach_hash) <> c.coach_hash then return jsonb_build_object('error', 'bad_login'); end if;
    if _bg_weak_pass(p_new_pass) then return jsonb_build_object('error', 'weak_password'); end if;
    update bg_clubs set coach_hash = crypt(p_new_pass, gen_salt('bf', 8)) where id = c.id;
    delete from bg_tokens t using bg_members x where t.member_id = x.id and x.club_id = c.id and x.role = 'coach' and t.token_hash <> _bg_hash(p_token);
  end if;
  select * into c from bg_clubs where id = c.id;
  return jsonb_build_object('ok', true, 'club', _bg_club_json(c, true));
end $$;

-- クラブをまるごと消す（コーチの合言葉が必要。すべての記録・写真・投稿が消える）
create or replace function bg_club_delete(p_token text, p_pass text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; c bg_clubs;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into c from bg_clubs where id = m.club_id;
  if crypt(coalesce(p_pass, ''), c.coach_hash) <> c.coach_hash then return jsonb_build_object('error', 'bad_login'); end if;
  delete from bg_clubs where id = c.id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- ひろば ----------

create or replace function _bg_post_json(p bg_posts, p_me uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', p.id, 'kind', p.kind, 'body', p.body, 'meta', p.meta, 'status', p.status, 'photo_id', p.photo_id,
    'created_at', p.created_at, 'member', (select _bg_member_json(k) from bg_members k where k.id = p.member_id),
    'reacts', (select coalesce(jsonb_object_agg(x.stamp, x.n), '{}'::jsonb) from (select stamp, count(*) as n from bg_reacts where post_id = p.id group by stamp) x),
    'mine', (select coalesce(jsonb_agg(stamp), '[]'::jsonb) from bg_reacts where post_id = p.id and member_id = p_me),
    'coach', _bg_creacts_json(p.id, null))
$$;

-- 見える投稿：出ているもの・自分のもの（コーチはぜんぶ）。新しい順
create or replace function bg_feed(p_token text, p_before timestamptz, p_limit int)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  return jsonb_build_object('ok', true, 'posts', (select coalesce(jsonb_agg(_bg_post_json(p, m.id) order by p.created_at desc), '[]'::jsonb)
    from bg_posts p where p.id in (
      select id from bg_posts
      where club_id = m.club_id and (status = 'shown' or member_id = m.id or m.role = 'coach')
        and created_at < coalesce(p_before, now() + interval '1 minute')
      order by created_at desc limit least(greatest(coalesce(p_limit, 30), 1), 50))));
end $$;

-- 投稿する（がんばったこと。写真は1まいまで）。p_meta：アプリの記録から（{ type, label }）
create or replace function bg_post(p_token text, p_body text, p_photo text, p_mime text, p_meta jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; c bg_clubs; v_body text := _bg_clean(p_body, 200); v_err text; v_pid uuid; v_status text; v_meta jsonb := '{}'::jsonb; v_id uuid;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if not _bg_rate_hit('post:' || m.id, 20, interval '1 hour', interval '30 minutes') then return jsonb_build_object('error', 'locked'); end if;
  select * into c from bg_clubs where id = m.club_id;
  if p_meta is not null and jsonb_typeof(p_meta) = 'object' and p_meta->>'type' in ('menu', 'badge', 'check', 'level', 'drill', 'streak', 'focus') then
    v_meta := jsonb_build_object('type', p_meta->>'type', 'label', _bg_clean(p_meta->>'label', 60));
    v_err := _bg_ng(v_meta->>'label');
    if v_err is not null then return jsonb_build_object('error', v_err); end if;
  end if;
  if v_body = '' and coalesce(p_photo, '') = '' and v_meta = '{}'::jsonb then return jsonb_build_object('error', 'empty'); end if;
  v_err := _bg_ng(v_body);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  if coalesce(p_photo, '') <> '' then
    if not coalesce((c.settings->>'photos')::boolean, true) then return jsonb_build_object('error', 'no_photo'); end if;
    v_err := _bg_photo_check(m.club_id, p_photo, p_mime);
    if v_err is not null then return jsonb_build_object('error', v_err); end if;
    v_pid := _bg_photo_put(m, 'post', p_photo, p_mime);
  end if;
  v_status := case
    when m.role = 'coach' then 'shown'
    when coalesce((c.settings->>'review_posts')::boolean, false) then 'waiting'
    when v_pid is not null and coalesce((c.settings->>'review_photos')::boolean, true) then 'waiting'
    else 'shown' end;
  insert into bg_posts (club_id, member_id, kind, body, photo_id, meta, status)
  values (m.club_id, m.id, case when v_meta = '{}'::jsonb then 'post' else 'share' end, v_body, v_pid, v_meta, v_status)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'status', v_status);
end $$;

-- 自分の投稿を消す（コーチはどれでも）
create or replace function bg_post_delete(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; p bg_posts;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into p from bg_posts where id = p_id and club_id = m.club_id and (member_id = m.id or m.role = 'coach');
  if not found then return jsonb_build_object('error', 'bad_post'); end if;
  delete from bg_posts where id = p.id;
  if p.photo_id is not null then delete from bg_photos where id = p.photo_id; end if;
  return jsonb_build_object('ok', true);
end $$;

-- コーチ：投稿を出す・かくす
create or replace function bg_post_mod(p_token text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if p_status not in ('shown', 'hidden') then return jsonb_build_object('error', 'bad_status'); end if;
  update bg_posts set status = p_status where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_post'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- スタンプをつける・はずす
create or replace function bg_react(p_token text, p_post_id uuid, p_stamp text, p_on boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; p bg_posts;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if p_stamp not in ('like', 'nice', 'wow', 'cheer') then return jsonb_build_object('error', 'bad_stamp'); end if;
  select * into p from bg_posts where id = p_post_id and club_id = m.club_id and (status = 'shown' or member_id = m.id or m.role = 'coach');
  if not found then return jsonb_build_object('error', 'bad_post'); end if;
  if not _bg_rate_hit('react:' || m.id, 300, interval '1 hour', interval '10 minutes') then return jsonb_build_object('error', 'locked'); end if;
  if coalesce(p_on, true) then
    insert into bg_reacts (post_id, member_id, stamp) values (p.id, m.id, p_stamp) on conflict do nothing;
  else
    delete from bg_reacts where post_id = p.id and member_id = m.id and stamp = p_stamp;
  end if;
  return jsonb_build_object('ok', true, 'post', _bg_post_json(p, m.id));
end $$;

-- 写真を見る（提出の写真は本人とコーチだけ。ひろばの写真は出ている投稿のものだけ）
create or replace function bg_photo(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; ph bg_photos;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into ph from bg_photos where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_photo'); end if;
  if not (m.role = 'coach' or ph.member_id = m.id
          or (ph.kind = 'post' and exists (select 1 from bg_posts where photo_id = ph.id and status = 'shown'))) then
    return jsonb_build_object('error', 'bad_photo');
  end if;
  return jsonb_build_object('ok', true, 'mime', ph.mime, 'data', replace(encode(ph.data, 'base64'), E'\n', ''));
end $$;

-- ---------- v2：級の種類（スキルごとの級）----------

-- 種類をつくる・直す（コーチ）。p_track_id が null なら 新しくつくる。p_levels は その種類の級（下の級から）
create or replace function bg_track_save(p_token text, p_track_id uuid, p_name text, p_icon text, p_levels jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; v_tid uuid; v_name text := _bg_clean(p_name, 12); v_icon text; v_err text;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if p_levels is null or jsonb_typeof(p_levels) <> 'array' or jsonb_array_length(p_levels) = 0 then
    return jsonb_build_object('error', 'bad_levels');
  end if;
  if v_name = '' then return jsonb_build_object('error', 'bad_name'); end if;
  v_err := _bg_ng(v_name);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  v_icon := case when coalesce(p_icon, '') ~ '^[a-z]{1,12}$' then p_icon else 'trophy' end;
  if p_track_id is null then
    if (select count(*) from bg_tracks where club_id = m.club_id and not archived) >= 8 then return jsonb_build_object('error', 'too_many'); end if;
    insert into bg_tracks (club_id, ord, name, icon)
    values (m.club_id, coalesce((select max(ord) + 1 from bg_tracks where club_id = m.club_id), 0), v_name, v_icon)
    returning id into v_tid;
  else
    update bg_tracks set name = v_name, icon = v_icon where id = p_track_id and club_id = m.club_id and not archived returning id into v_tid;
    if v_tid is null then return jsonb_build_object('error', 'bad_track'); end if;
  end if;
  perform _bg_track_levels_put(m.club_id, v_tid, p_levels);
  return jsonb_build_object('ok', true, 'track_id', v_tid, 'tracks', _bg_tracks_json(m.club_id), 'levels', _bg_levels_json(m.club_id));
end $$;

-- 種類をしまう（コーチ。さいごの1つは しまえない。認定の記録は のこる）
create or replace function bg_track_remove(p_token text, p_track_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if not exists (select 1 from bg_tracks where id = p_track_id and club_id = m.club_id and not archived) then
    return jsonb_build_object('error', 'bad_track');
  end if;
  if (select count(*) from bg_tracks where club_id = m.club_id and not archived) <= 1 then return jsonb_build_object('error', 'last_track'); end if;
  update bg_tracks set archived = true where id = p_track_id;
  perform _bg_recount_club(m.club_id);
  return jsonb_build_object('ok', true, 'tracks', _bg_tracks_json(m.club_id), 'levels', _bg_levels_json(m.club_id));
end $$;

-- ---------- v2：自主練（コーチのクエスト） ----------

-- つくる・直す（コーチ）。p_members：子どもの id の配列（空・null は全員）。期間は 92日まで
create or replace function bg_quest_save(p_token text, p_id uuid, p_title text, p_drill_id text, p_target int, p_unit text,
  p_times int, p_start date, p_end date, p_photo text, p_how text, p_members jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; q bg_quests; v_title text := _bg_clean(p_title, 40); v_how text := _bg_clean(p_how, 200);
  v_members uuid[]; v_start date := coalesce(p_start, _bg_today()); v_end date; v_err text; v_unit text; v_photo text; v_drill text;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if v_title = '' then return jsonb_build_object('error', 'bad_name'); end if;
  if p_target is null or p_target < 1 or p_target > 10000 or p_times is null or p_times < 1 or p_times > 100 then
    return jsonb_build_object('error', 'bad_count');
  end if;
  v_end := coalesce(p_end, v_start + 6);
  if v_end < v_start or v_end > v_start + 92 or v_start < _bg_today() - 30 then return jsonb_build_object('error', 'bad_date'); end if;
  v_err := coalesce(_bg_ng(v_title), _bg_ng(v_how));
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  v_members := _bg_kid_ids(m.club_id, p_members);
  if v_members is null and p_members is not null and jsonb_typeof(p_members) = 'array' and jsonb_array_length(p_members) > 0 then
    return jsonb_build_object('error', 'bad_member');
  end if;
  v_unit := case when p_unit in ('回', '本', '秒', '往復', 'セット', '分', '周', 'm', '点') then p_unit else '回' end;
  v_photo := case when p_photo in ('need', 'opt', 'none') then p_photo else 'opt' end;
  v_drill := case when coalesce(p_drill_id, '') ~ '^[a-z0-9-]{1,40}$' then p_drill_id else '' end;
  if p_id is not null then
    update bg_quests set title = v_title, drill_id = v_drill, target = p_target, unit = v_unit, times = p_times, start_on = v_start,
      end_on = v_end, photo = v_photo, how = v_how, members = v_members
    where id = p_id and club_id = m.club_id returning * into q;
    if not found then return jsonb_build_object('error', 'bad_quest'); end if;
  else
    if (select count(*) from bg_quests where club_id = m.club_id and not archived and end_on >= _bg_today()) >= 30 then
      return jsonb_build_object('error', 'too_many');
    end if;
    insert into bg_quests (club_id, title, drill_id, target, unit, times, start_on, end_on, photo, how, members, created_by)
    values (m.club_id, v_title, v_drill, p_target, v_unit, p_times, v_start, v_end, v_photo, v_how, v_members, m.id)
    returning * into q;
  end if;
  return jsonb_build_object('ok', true, 'quest', _bg_quest_json(q));
end $$;

-- おわりにする（コーチ。子どもの画面から消える。記録は のこる）
create or replace function bg_quest_close(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  update bg_quests set archived = true where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_quest'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- 一覧（子ども：自分に出ている自主練と 回数／コーチ：クラブの自主練と、クリアした人数・きょうの記録・まだ反応していない記録）
create or replace function bg_quest_list(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; v_today date := _bg_today();
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role = 'kid' then return jsonb_build_object('ok', true, 'quests', _bg_kid_quests(m)); end if;
  perform _bg_cleanup(m.club_id);
  return jsonb_build_object('ok', true, 'today', v_today, 'quests', (select coalesce(jsonb_agg(_bg_quest_json(q) || jsonb_build_object(
      'kids', (select count(*) from bg_members k where k.club_id = q.club_id and k.role = 'kid' and (q.members is null or k.id = any(q.members))),
      'cleared', (select count(*) from (select g.member_id from bg_quest_logs g where g.quest_id = q.id group by g.member_id having count(*) >= q.times) x),
      'logs', (select count(*) from bg_quest_logs g where g.quest_id = q.id),
      'today', (select count(*) from bg_quest_logs g where g.quest_id = q.id and g.day = v_today),
      'unrated', (select count(*) from bg_quest_logs g where g.quest_id = q.id and not exists (select 1 from bg_coach_reacts r where r.log_id = g.id)))
    order by q.archived, (q.end_on < v_today), q.end_on, q.created_at desc), '[]'::jsonb)
    from bg_quests q where q.club_id = m.club_id and q.end_on >= v_today - 60));
end $$;

-- 1つの自主練（子ども：自分の記録／コーチ：子どもごとの回数と記録。記録は1人 新しい10こまで）
create or replace function bg_quest(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; q bg_quests;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into q from bg_quests where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_quest'); end if;
  if m.role = 'kid' then
    if q.archived or not (q.members is null or m.id = any(q.members)) then return jsonb_build_object('error', 'bad_quest'); end if;
    return jsonb_build_object('ok', true, 'today', _bg_today(), 'quest', _bg_quest_json(q) - 'members',
      'n', (select count(*) from bg_quest_logs g where g.quest_id = q.id and g.member_id = m.id),
      'logs', (select coalesce(jsonb_agg(_bg_log_json(g) order by g.created_at desc), '[]'::jsonb)
               from bg_quest_logs g where g.id in (select id from bg_quest_logs where quest_id = q.id and member_id = m.id order by created_at desc limit 30)));
  end if;
  return jsonb_build_object('ok', true, 'today', _bg_today(), 'quest', _bg_quest_json(q),
    'kids', (select coalesce(jsonb_agg(jsonb_build_object('member', _bg_member_json(k),
        'n', (select count(*) from bg_quest_logs g where g.quest_id = q.id and g.member_id = k.id),
        'logs', (select coalesce(jsonb_agg(_bg_log_json(g) order by g.created_at desc), '[]'::jsonb)
                 from bg_quest_logs g where g.id in (select id from bg_quest_logs where quest_id = q.id and member_id = k.id order by created_at desc limit 10)))
      order by k.no), '[]'::jsonb)
      from bg_members k where k.club_id = m.club_id and k.role = 'kid' and (q.members is null or k.id = any(q.members))));
end $$;

-- 自主練の記録を送る（子ども。1日 3回まで）。目標の回数にとどいたら「クリア」（ひろばで お知らせ）
create or replace function bg_quest_log(p_token text, p_quest_id uuid, p_count int, p_note text, p_photo text, p_mime text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; q bg_quests; c bg_clubs; v_err text; v_pid uuid; v_id uuid; v_note text := _bg_clean(p_note, 100); v_n int; v_today date := _bg_today();
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'kid' then return jsonb_build_object('error', 'not_kid'); end if;
  if not _bg_rate_hit('sub:' || m.id, 40, interval '1 hour', interval '30 minutes') then return jsonb_build_object('error', 'locked'); end if;
  select * into q from bg_quests where id = p_quest_id and club_id = m.club_id and not archived and (members is null or m.id = any(members));
  if not found then return jsonb_build_object('error', 'bad_quest'); end if;
  if v_today < q.start_on then return jsonb_build_object('error', 'not_yet'); end if;
  if v_today > q.end_on then return jsonb_build_object('error', 'quest_over'); end if;
  if (select count(*) from bg_quest_logs where quest_id = q.id and member_id = m.id and day = v_today) >= 3 then
    return jsonb_build_object('error', 'today_full');
  end if;
  if p_count is not null and (p_count < 0 or p_count > 100000) then return jsonb_build_object('error', 'bad_count'); end if;
  v_err := _bg_ng(v_note);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  if coalesce(p_photo, '') <> '' then
    if q.photo = 'none' then return jsonb_build_object('error', 'no_photo'); end if;
    v_err := _bg_photo_check(m.club_id, p_photo, p_mime);
    if v_err is not null then return jsonb_build_object('error', v_err); end if;
    v_pid := _bg_photo_put(m, 'log', p_photo, p_mime);
  elsif q.photo = 'need' then
    return jsonb_build_object('error', 'need_photo');
  end if;
  insert into bg_quest_logs (club_id, quest_id, member_id, count, note, photo_id, day)
  values (m.club_id, q.id, m.id, p_count, v_note, v_pid, v_today) returning id into v_id;
  select count(*) into v_n from bg_quest_logs where quest_id = q.id and member_id = m.id;
  if v_n = q.times then
    select * into c from bg_clubs where id = m.club_id;
    if coalesce((c.settings->>'cert_posts')::boolean, true)
       and not exists (select 1 from bg_posts where member_id = m.id and kind = 'quest' and meta->>'quest_id' = q.id::text) then
      insert into bg_posts (club_id, member_id, kind, body, meta, status)
      values (m.club_id, m.id, 'quest', '', jsonb_build_object('quest_id', q.id, 'title', q.title, 'target', q.target, 'unit', q.unit, 'times', q.times), 'shown');
    end if;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id, 'n', v_n, 'times', q.times, 'cleared', v_n >= q.times, 'just_cleared', v_n = q.times);
end $$;

-- 自主練の記録を消す（本人か コーチ）
create or replace function bg_quest_log_delete(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; g bg_quest_logs;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into g from bg_quest_logs where id = p_id and club_id = m.club_id and (member_id = m.id or m.role = 'coach');
  if not found then return jsonb_build_object('error', 'bad_log'); end if;
  delete from bg_quest_logs where id = g.id;
  if g.photo_id is not null then delete from bg_photos where id = g.photo_id; end if;
  return jsonb_build_object('ok', true);
end $$;

-- コーチの 拍手（clap）・いいね（good）・怒り（angry）。ひろばの投稿（p_post_id）か 自主練の記録（p_log_id）に。
-- p_stamp が空なら はずす。ひとこと（p_comment）も そえられる
create or replace function bg_coach_react(p_token text, p_post_id uuid, p_log_id uuid, p_stamp text, p_comment text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; v_comment text := _bg_clean(p_comment, 100); v_err text; v_stamp text := coalesce(p_stamp, '');
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if (p_post_id is null) = (p_log_id is null) then return jsonb_build_object('error', 'bad_target'); end if;
  if v_stamp not in ('', 'clap', 'good', 'angry') then return jsonb_build_object('error', 'bad_stamp'); end if;
  if not _bg_rate_hit('react:' || m.id, 300, interval '1 hour', interval '10 minutes') then return jsonb_build_object('error', 'locked'); end if;
  v_err := _bg_ng(v_comment);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  if p_post_id is not null then
    if not exists (select 1 from bg_posts where id = p_post_id and club_id = m.club_id) then return jsonb_build_object('error', 'bad_post'); end if;
    if v_stamp = '' then
      delete from bg_coach_reacts where post_id = p_post_id and coach_id = m.id;
    else
      insert into bg_coach_reacts (club_id, coach_id, post_id, stamp, comment) values (m.club_id, m.id, p_post_id, v_stamp, v_comment)
      on conflict (post_id, coach_id) where post_id is not null do update set stamp = excluded.stamp, comment = excluded.comment, created_at = now();
    end if;
    return jsonb_build_object('ok', true, 'coach', _bg_creacts_json(p_post_id, null));
  end if;
  if not exists (select 1 from bg_quest_logs where id = p_log_id and club_id = m.club_id) then return jsonb_build_object('error', 'bad_log'); end if;
  if v_stamp = '' then
    delete from bg_coach_reacts where log_id = p_log_id and coach_id = m.id;
  else
    insert into bg_coach_reacts (club_id, coach_id, log_id, stamp, comment) values (m.club_id, m.id, p_log_id, v_stamp, v_comment)
    on conflict (log_id, coach_id) where log_id is not null do update set stamp = excluded.stamp, comment = excluded.comment, created_at = now();
  end if;
  return jsonb_build_object('ok', true, 'coach', _bg_creacts_json(null, p_log_id));
end $$;

-- ---------- v2：予定と、参加の申し込み ----------

-- つくる・直す（コーチ）。p_kind：practice・game・tournament・camp・trial・other。p_capacity 0 は定員なし
create or replace function bg_event_save(p_token text, p_id uuid, p_title text, p_kind text, p_day date, p_time text, p_place text,
  p_note text, p_deadline date, p_capacity int, p_members jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; e bg_events; v_title text := _bg_clean(p_title, 40); v_time text := _bg_clean(p_time, 20); v_place text := _bg_clean(p_place, 40);
  v_note text := _bg_clean(p_note, 300); v_err text; v_members uuid[]; v_kind text;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if v_title = '' then return jsonb_build_object('error', 'bad_name'); end if;
  if p_day is null or p_day < _bg_today() - 1 or p_day > _bg_today() + 366 then return jsonb_build_object('error', 'bad_date'); end if;
  if p_deadline is not null and p_deadline > p_day then return jsonb_build_object('error', 'bad_date'); end if;
  if coalesce(p_capacity, 0) < 0 or coalesce(p_capacity, 0) > 500 then return jsonb_build_object('error', 'bad_count'); end if;
  v_err := coalesce(_bg_ng(v_title), _bg_ng(v_time), _bg_ng(v_place), _bg_ng(v_note));
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  v_members := _bg_kid_ids(m.club_id, p_members);
  if v_members is null and p_members is not null and jsonb_typeof(p_members) = 'array' and jsonb_array_length(p_members) > 0 then
    return jsonb_build_object('error', 'bad_member');
  end if;
  v_kind := case when p_kind in ('practice', 'game', 'tournament', 'camp', 'trial', 'other') then p_kind else 'other' end;
  if p_id is not null then
    update bg_events set title = v_title, kind = v_kind, day = p_day, time_text = v_time, place = v_place, note = v_note,
      deadline = p_deadline, capacity = coalesce(p_capacity, 0), members = v_members
    where id = p_id and club_id = m.club_id returning * into e;
    if not found then return jsonb_build_object('error', 'bad_event'); end if;
  else
    if (select count(*) from bg_events where club_id = m.club_id and day >= _bg_today()) >= 60 then return jsonb_build_object('error', 'too_many'); end if;
    insert into bg_events (club_id, title, kind, day, time_text, place, note, deadline, capacity, members, created_by)
    values (m.club_id, v_title, v_kind, p_day, v_time, v_place, v_note, p_deadline, coalesce(p_capacity, 0), v_members, m.id)
    returning * into e;
  end if;
  return jsonb_build_object('ok', true, 'event', _bg_event_json(e));
end $$;

-- しめきる・ひらく（コーチ）
create or replace function bg_event_close(p_token text, p_id uuid, p_closed boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  update bg_events set closed = coalesce(p_closed, true) where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_event'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- 消す（コーチ。答えも消える）
create or replace function bg_event_delete(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  delete from bg_events where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_event'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- 一覧（子ども：自分に出ている予定と 自分の答え／コーチ：60日前からの予定と、答えの数）
create or replace function bg_event_list(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; v_today date := _bg_today();
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role = 'kid' then return jsonb_build_object('ok', true, 'events', _bg_kid_events(m)); end if;
  return jsonb_build_object('ok', true, 'today', v_today, 'events', (select coalesce(jsonb_agg(_bg_event_json(e) || jsonb_build_object(
      'kids', (select count(*) from bg_members k where k.club_id = e.club_id and k.role = 'kid' and (e.members is null or k.id = any(e.members))),
      'yes', (select count(*) from bg_entries x where x.event_id = e.id and x.answer = 'yes'),
      'no', (select count(*) from bg_entries x where x.event_id = e.id and x.answer = 'no'),
      'maybe', (select count(*) from bg_entries x where x.event_id = e.id and x.answer = 'maybe'))
    order by (e.day < v_today), case when e.day >= v_today then e.day end, e.day desc), '[]'::jsonb)
    from bg_events e where e.club_id = m.club_id and e.day >= v_today - 60));
end $$;

-- 1つの予定（コーチ：対象の子ども全員と 答え。まだの子もいる）
create or replace function bg_event(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; e bg_events;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into e from bg_events where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_event'); end if;
  return jsonb_build_object('ok', true, 'event', _bg_event_json(e),
    'kids', (select coalesce(jsonb_agg(jsonb_build_object('member', _bg_member_json(k), 'answer', x.answer, 'note', x.note,
        'by_coach', x.by_coach, 'at', x.updated_at) order by k.no), '[]'::jsonb)
      from bg_members k left join bg_entries x on x.event_id = e.id and x.member_id = k.id
      where k.club_id = m.club_id and k.role = 'kid' and (e.members is null or k.id = any(e.members))));
end $$;

-- 参加する・しない・まだわからない（子ども。しめきり・定員がある。p_answer が空なら とりけす）
create or replace function bg_entry(p_token text, p_event_id uuid, p_answer text, p_note text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; e bg_events; v_note text := _bg_clean(p_note, 100); v_err text; v_ans text := coalesce(p_answer, '');
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'kid' then return jsonb_build_object('error', 'not_kid'); end if;
  select * into e from bg_events where id = p_event_id and club_id = m.club_id and (members is null or m.id = any(members));
  if not found then return jsonb_build_object('error', 'bad_event'); end if;
  if e.closed or e.day < _bg_today() or (e.deadline is not null and e.deadline < _bg_today()) then
    return jsonb_build_object('error', 'event_closed');
  end if;
  if v_ans not in ('', 'yes', 'no', 'maybe') then return jsonb_build_object('error', 'bad_answer'); end if;
  v_err := _bg_ng(v_note);
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  if v_ans = '' then
    delete from bg_entries where event_id = e.id and member_id = m.id;
    return jsonb_build_object('ok', true, 'answer', null);
  end if;
  if v_ans = 'yes' and e.capacity > 0
     and (select count(*) from bg_entries where event_id = e.id and answer = 'yes' and member_id <> m.id) >= e.capacity then
    return jsonb_build_object('error', 'full');
  end if;
  insert into bg_entries (event_id, member_id, answer, note, by_coach, updated_at) values (e.id, m.id, v_ans, v_note, false, now())
  on conflict (event_id, member_id) do update set answer = excluded.answer, note = excluded.note, by_coach = false, updated_at = now();
  return jsonb_build_object('ok', true, 'answer', v_ans);
end $$;

-- コーチが かわりに答えを入れる（電話や口で聞いたとき。しめきり・定員は見ない。p_answer が空なら とりけす）
create or replace function bg_entry_set(p_token text, p_event_id uuid, p_member_id uuid, p_answer text, p_note text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; v_ans text := coalesce(p_answer, ''); v_note text := _bg_clean(p_note, 100);
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if not exists (select 1 from bg_events where id = p_event_id and club_id = m.club_id) then return jsonb_build_object('error', 'bad_event'); end if;
  if not exists (select 1 from bg_members where id = p_member_id and club_id = m.club_id and role = 'kid') then return jsonb_build_object('error', 'bad_member'); end if;
  if v_ans not in ('', 'yes', 'no', 'maybe') then return jsonb_build_object('error', 'bad_answer'); end if;
  if v_ans = '' then
    delete from bg_entries where event_id = p_event_id and member_id = p_member_id;
  else
    insert into bg_entries (event_id, member_id, answer, note, by_coach, updated_at) values (p_event_id, p_member_id, v_ans, v_note, true, now())
    on conflict (event_id, member_id) do update set answer = excluded.answer, note = excluded.note, by_coach = true, updated_at = now();
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- v2：体験・入団の申し込み（保護者が、クラブのリンクから） ----------

-- 受けつけるか・申し込みページのお知らせ（練習日・場所・持ち物など）・リンクのコードを作りなおす（コーチ）
create or replace function bg_apply_setup(p_token text, p_open boolean, p_note text, p_new_code boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; c bg_clubs;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into c from bg_clubs where id = m.club_id for update;
  update bg_clubs set
    apply_code = case when c.apply_code is null or coalesce(p_new_code, false) then _bg_apply_code() else c.apply_code end,
    apply_note = case when p_note is null then c.apply_note else _bg_clean(p_note, 300) end,
    settings = c.settings || jsonb_build_object('apply_open', coalesce(p_open, coalesce((c.settings->>'apply_open')::boolean, false)))
  where id = c.id
  returning * into c;
  return jsonb_build_object('ok', true, 'code', c.apply_code, 'open', (c.settings->>'apply_open')::boolean, 'note', c.apply_note);
end $$;

-- 申し込みページ（だれでも。受けつけているクラブだけ：クラブの名前と お知らせ）
create or replace function bg_apply_info(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c bg_clubs;
begin
  if not _bg_rate_hit('applyinfo:' || _bg_client_ip(), 60, interval '10 minutes', interval '10 minutes') then
    return jsonb_build_object('error', 'locked');
  end if;
  select * into c from bg_clubs where apply_code = upper(btrim(coalesce(p_code, ''))) and coalesce((settings->>'apply_open')::boolean, false);
  if not found then return jsonb_build_object('error', 'closed'); end if;
  return jsonb_build_object('ok', true, 'club', c.name, 'note', c.apply_note);
end $$;

-- 申し込む（だれでも。1時間に5回まで・1クラブ 1日30件まで）。p_kind：trial（体験）・join（入団）・question（しつもん）
create or replace function bg_apply(p_code text, p_kind text, p_child text, p_kana text, p_grade text, p_guardian text, p_contact text, p_message text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare c bg_clubs; v_child text := _bg_clean(p_child, 20); v_kana text := _bg_clean(p_kana, 30); v_guardian text := _bg_clean(p_guardian, 20);
  v_contact text := _bg_clean(p_contact, 60); v_message text := _bg_clean(p_message, 300); v_digits text; v_err text;
begin
  if not _bg_rate_hit('apply:' || _bg_client_ip(), 5, interval '1 hour', interval '1 hour') then return jsonb_build_object('error', 'locked'); end if;
  select * into c from bg_clubs where apply_code = upper(btrim(coalesce(p_code, ''))) and coalesce((settings->>'apply_open')::boolean, false);
  if not found then return jsonb_build_object('error', 'closed'); end if;
  if coalesce(p_kind, '') not in ('trial', 'join', 'question') then return jsonb_build_object('error', 'bad_kind'); end if;
  if v_child = '' or v_guardian = '' then return jsonb_build_object('error', 'bad_name'); end if;
  v_digits := regexp_replace(v_contact, '[^0-9]', '', 'g');
  if not (v_contact ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or (v_contact ~ '^[0-9+() -]+$' and char_length(v_digits) between 10 and 13)) then
    return jsonb_build_object('error', 'bad_contact');
  end if;
  v_err := coalesce(_bg_ng_soft(v_child), _bg_ng_soft(v_kana), _bg_ng_soft(v_guardian), _bg_ng_soft(v_message));
  if v_err is not null then return jsonb_build_object('error', v_err); end if;
  if not _bg_rate_hit('applyclub:' || c.id, 30, interval '1 day', interval '1 hour') then return jsonb_build_object('error', 'locked'); end if;
  delete from bg_applies a where a.club_id = c.id and a.created_at < now() - interval '90 days';
  insert into bg_applies (club_id, kind, child, kana, grade, guardian, contact, message)
  values (c.id, p_kind, v_child, v_kana, case when p_grade in ('e12', 'e34', 'e56', 'j1', 'j2', 'j3', 'h', 'a') then p_grade else '' end,
    v_guardian, v_contact, v_message);
  return jsonb_build_object('ok', true, 'club', c.name);
end $$;

-- 申し込みの一覧（コーチ。新しい順・100件まで）
create or replace function bg_apply_list(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members; c bg_clubs;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  perform _bg_cleanup(m.club_id);
  select * into c from bg_clubs where id = m.club_id;
  return jsonb_build_object('ok', true, 'code', c.apply_code, 'open', coalesce((c.settings->>'apply_open')::boolean, false), 'note', c.apply_note,
    'applies', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'kind', a.kind, 'child', a.child, 'kana', a.kana, 'grade', a.grade,
      'guardian', a.guardian, 'contact', a.contact, 'message', a.message, 'status', a.status, 'created_at', a.created_at) order by a.created_at desc), '[]'::jsonb)
      from bg_applies a where a.id in (select id from bg_applies where club_id = m.club_id order by created_at desc limit 100)));
end $$;

-- 申し込みの じょうたい：new（新着）・contacted（連絡した）・done（おわり）
create or replace function bg_apply_mark(p_token text, p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  if coalesce(p_status, '') not in ('new', 'contacted', 'done') then return jsonb_build_object('error', 'bad_status'); end if;
  update bg_applies set status = p_status where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_apply'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function bg_apply_delete(p_token text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m bg_members;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  delete from bg_applies where id = p_id and club_id = m.club_id;
  if not found then return jsonb_build_object('error', 'bad_apply'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 権限：内部関数は anon / authenticated から実行できない。bg_* だけ実行できる ----------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like '\_bg\_%' or p.proname like 'bg\_%')
  loop
    if f.proname like '\_bg\_%' then
      execute format('revoke all on function %s from public', f.sig);
      begin
        execute format('revoke all on function %s from anon, authenticated', f.sig);
      exception when undefined_object then null;
      end;
    else
      begin
        execute format('grant execute on function %s to anon, authenticated', f.sig);
      exception when undefined_object then null;
      end;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
