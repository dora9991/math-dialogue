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

-- ---------- 直接アクセスは全面禁止（RPC 経由のみ） ----------
do $$
declare t text;
begin
  foreach t in array array['bg_clubs', 'bg_levels', 'bg_tasks', 'bg_members', 'bg_tokens', 'bg_photos', 'bg_subs',
    'bg_certs', 'bg_posts', 'bg_reacts', 'bg_rate'] loop
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
    else jsonb_build_object('id', l.id, 'ord', l.ord, 'name', l.name, 'color', l.color) end
$$;

create or replace function _bg_member_json(m bg_members) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', m.id, 'role', m.role, 'no', m.no, 'nickname', m.nickname, 'grade', m.grade,
    'kyu', (select _bg_level_json(l) from bg_levels l where l.id = m.kyu_level_id))
$$;

create or replace function _bg_club_json(c bg_clubs, p_coach boolean) returns jsonb
language sql stable set search_path = public, extensions as $$
  select jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name, 'settings', c.settings)
$$;

-- 級と課題（下の級から）
create or replace function _bg_levels_json(p_club uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'ord', l.ord, 'name', l.name, 'color', l.color, 'note', l.note,
    'tasks', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'drill_id', t.drill_id, 'target', t.target,
      'unit', t.unit, 'cond', t.cond, 'how', t.how, 'photo', t.photo) order by t.ord), '[]'::jsonb)
      from bg_tasks t where t.level_id = l.id and not t.archived)) order by l.ord), '[]'::jsonb)
  from bg_levels l where l.club_id = p_club and not l.archived
$$;

-- 級と課題を書きかえる（id のあるものは直す・ないものは足す・のっていないものはしまう）
create or replace function _bg_levels_put(p_club uuid, p_levels jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  lv jsonb; tk jsonb; i int := 0; j int;
  v_lid uuid; v_tid uuid; keep_l uuid[] := '{}'; keep_t uuid[] := '{}';
  v_name text; v_title text; v_unit text; v_photo text; v_color text; v_target int;
begin
  if p_levels is null or jsonb_typeof(p_levels) <> 'array' then return; end if;
  for lv in select value from jsonb_array_elements(p_levels) limit 20 loop
    v_name := _bg_clean(lv->>'name', 12);
    if v_name = '' then v_name := (i + 1)::text || 'だんめ'; end if;
    v_color := case when coalesce(lv->>'color', '') ~ '^#[0-9a-fA-F]{6}$' then lv->>'color' else '' end;
    v_lid := null;
    if coalesce(lv->>'id', '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select id into v_lid from bg_levels where id = (lv->>'id')::uuid and club_id = p_club;
    end if;
    if v_lid is null then
      insert into bg_levels (club_id, ord, name, color, note) values (p_club, i, v_name, v_color, _bg_clean(lv->>'note', 40)) returning id into v_lid;
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
        select id into v_tid from bg_tasks where id = (tk->>'id')::uuid and club_id = p_club;
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
  update bg_levels set archived = true where club_id = p_club and not (id = any(keep_l));
  update bg_tasks set archived = true where club_id = p_club and not (id = any(keep_t));
  -- しまった級の認定は残すが、「いまの級」はのこっている級から計算しなおす
  update bg_members m set kyu_level_id = (
    select l.id from bg_certs c join bg_levels l on l.id = c.level_id
    where c.member_id = m.id and not l.archived order by l.ord desc limit 1)
  where m.club_id = p_club and m.role = 'kid';
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

create or replace function _bg_recount_kyu(p_member uuid) returns void
language sql security definer set search_path = public as $$
  update bg_members m set kyu_level_id = (
    select l.id from bg_certs c join bg_levels l on l.id = c.level_id
    where c.member_id = m.id and not l.archived order by l.ord desc limit 1)
  where m.id = p_member
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
declare m bg_members; c bg_clubs; v jsonb;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  select * into c from bg_clubs where id = m.club_id;
  v := jsonb_build_object('ok', true, 'me', _bg_member_json(m), 'club', _bg_club_json(c, m.role = 'coach'), 'levels', _bg_levels_json(c.id));
  if m.role = 'kid' then
    v := v || jsonb_build_object(
      'subs', (select coalesce(jsonb_agg(_bg_sub_json(s) order by s.created_at desc), '[]'::jsonb)
               from bg_subs s where s.id in (select id from bg_subs where member_id = m.id order by created_at desc limit 300)),
      'certs', (select coalesce(jsonb_agg(jsonb_build_object('level_id', x.level_id, 'comment', x.comment, 'at', x.created_at) order by x.created_at), '[]'::jsonb)
                from bg_certs x where x.member_id = m.id),
      'notices', jsonb_build_object(
        'reviews', (select count(*) from bg_subs where member_id = m.id and reviewed_at > m.seen_at),
        'certs', (select count(*) from bg_certs where member_id = m.id and created_at > m.seen_at),
        'reacts', (select count(*) from bg_reacts r join bg_posts p on p.id = r.post_id
                   where p.member_id = m.id and r.member_id <> m.id and r.created_at > m.seen_at)));
  else
    v := v || jsonb_build_object('counts', jsonb_build_object(
      'pending', (select count(*) from bg_subs s join bg_tasks t on t.id = s.task_id where s.club_id = c.id and s.status = 'pending' and not t.archived),
      'waiting', (select count(*) from bg_posts where club_id = c.id and status = 'waiting'),
      'kids', (select count(*) from bg_members where club_id = c.id and role = 'kid'),
      'ready', (select count(*) from bg_members k join bg_levels l on l.club_id = k.club_id and not l.archived
                where k.club_id = c.id and k.role = 'kid' and _bg_level_done(k.id, l.id)
                and not exists (select 1 from bg_certs x where x.member_id = k.id and x.level_id = l.id))));
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
  -- 評価から45日たった提出の写真は消す
  delete from bg_photos p using bg_subs s
  where s.photo_id = p.id and s.club_id = m.club_id and s.status <> 'pending' and s.reviewed_at < now() - interval '45 days';
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
    'ready', (select coalesce(jsonb_agg(jsonb_build_object('member', _bg_member_json(k), 'level', _bg_level_json(l)) order by k.no, l.ord), '[]'::jsonb)
      from bg_members k join bg_levels l on l.club_id = k.club_id and not l.archived
      where k.club_id = m.club_id and k.role = 'kid' and _bg_level_done(k.id, l.id)
      and not exists (select 1 from bg_certs x where x.member_id = k.id and x.level_id = l.id)));
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
declare m bg_members; k bg_members; l bg_levels; c bg_clubs; v_new boolean;
begin
  m := _bg_me(p_token);
  if m.id is null then return jsonb_build_object('error', 'auth'); end if;
  if m.role <> 'coach' then return jsonb_build_object('error', 'not_coach'); end if;
  select * into k from bg_members where id = p_member_id and club_id = m.club_id and role = 'kid';
  if not found then return jsonb_build_object('error', 'bad_member'); end if;
  select * into l from bg_levels where id = p_level_id and club_id = m.club_id and not archived;
  if not found then return jsonb_build_object('error', 'bad_level'); end if;
  select * into c from bg_clubs where id = m.club_id;
  v_new := not exists (select 1 from bg_certs where member_id = k.id and level_id = l.id);
  insert into bg_certs (club_id, member_id, level_id, coach_id, comment)
  values (m.club_id, k.id, l.id, m.id, _bg_clean(p_comment, 200))
  on conflict (member_id, level_id) do update set comment = excluded.comment, coach_id = excluded.coach_id;
  perform _bg_recount_kyu(k.id);
  -- ひろばに「合格」をのせる（クラブの設定で止められる）
  if v_new and coalesce((c.settings->>'cert_posts')::boolean, true) then
    insert into bg_posts (club_id, member_id, kind, body, meta, status)
    values (m.club_id, k.id, 'cert', '', jsonb_build_object('level_id', l.id, 'level', l.name, 'color', l.color, 'by', m.nickname,
      'comment', _bg_clean(p_comment, 200)), 'shown');
  end if;
  select * into k from bg_members where id = k.id;
  return jsonb_build_object('ok', true, 'member', _bg_member_json(k));
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
      'passes', (select count(*) from bg_subs s where s.member_id = k.id and s.status = 'pass'),
      'pending', (select count(*) from bg_subs s where s.member_id = k.id and s.status = 'pending'),
      'certs', (select coalesce(jsonb_agg(x.level_id), '[]'::jsonb) from bg_certs x where x.member_id = k.id),
      'last', greatest((select max(created_at) from bg_subs s where s.member_id = k.id), (select max(created_at) from bg_posts p where p.member_id = k.id)))
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
    'mine', (select coalesce(jsonb_agg(stamp), '[]'::jsonb) from bg_reacts where post_id = p.id and member_id = p_me))
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
  if p_meta is not null and jsonb_typeof(p_meta) = 'object' and p_meta->>'type' in ('menu', 'badge', 'check', 'level', 'drill', 'streak') then
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
