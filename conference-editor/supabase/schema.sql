-- ============================================================
-- 大会サイト編集ツール スキーマ（お知らせ／大会概要／プログラム）
--
-- 使い方：Supabase ダッシュボード → SQL Editor に貼って Run。何度流しても壊れない（再実行OK）。
-- ★ 大会ごとに「新しい Supabase プロジェクト」を作ることをすすめる（名義・引き継ぎ・個人情報の分離のため）。
--
-- 守り方（ここが肝）
--   ・公開側（anon キー）  … 「公開済み」の列（key / published / published_at）だけ読める。下書きは読めない。書けない。
--   ・編集者（ログイン済み）… conf_editors に載っているメールアドレスの人だけ、下書きの読み書きと公開ができる。
--   ・公開（published を書き換える）は conf_publish() 経由だけ。画面から直接 published を書き換えることはできない。
--   ・更新者・更新時刻・版番号（version）はサーバー側で付ける。改ざんできない。
--   ・更新のたびに、変更前の内容が conf_content_history に残る（取り消しの保険）。
-- 個人情報は保存しない（お知らせ・日程・プログラムの文章だけ）。
-- ============================================================

-- ---------- テーブル ----------

-- 編集してよい人（メールアドレスは小文字で登録する）
create table if not exists conf_editors (
  email text primary key check (email = lower(email))
);

-- 中身：key ごとに1行（news / overview / program）。draft=下書き、published=公開中
create table if not exists conf_content (
  key          text primary key check (key in ('news', 'overview', 'program')),
  draft        jsonb not null default '[]'::jsonb
               check (jsonb_typeof(draft) = 'array' and octet_length(draft::text) < 200000),
  published    jsonb not null default '[]'::jsonb
               check (jsonb_typeof(published) = 'array' and octet_length(published::text) < 200000),
  published_at timestamptz,                      -- null = まだ一度も公開していない（公開側は元のHTMLをそのまま使う）
  version      bigint not null default 1,        -- 更新のたびに +1（同時編集の衝突検出に使う）
  updated_at   timestamptz not null default now(),
  updated_by   text
);

-- 変更前の内容の履歴
create table if not exists conf_content_history (
  id         bigint generated always as identity primary key,
  key        text not null,
  draft      jsonb,
  published  jsonb,
  version    bigint,
  changed_at timestamptz not null default now(),
  changed_by text
);

insert into conf_content (key) values ('news'), ('overview'), ('program')
on conflict (key) do nothing;

-- ---------- 関数 ----------

-- いまログインしている人が編集者か（RLS の中から呼ぶ。conf_editors は直接は読ませない）
create or replace function conf_is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conf_editors
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
revoke all on function conf_is_editor() from public;
grant execute on function conf_is_editor() to authenticated;

-- 更新時：版番号・更新者・更新時刻をサーバーで付け、変更前の内容を履歴に残す
create or replace function conf_content_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if new.draft is distinct from old.draft or new.published is distinct from old.published then
    insert into conf_content_history (key, draft, published, version, changed_by)
    values (old.key, old.draft, old.published, old.version, who);
  end if;
  new.key        := old.key;
  new.version    := old.version + 1;
  new.updated_at := now();
  new.updated_by := nullif(who, '');
  return new;
end $$;

drop trigger if exists conf_content_before_update on conf_content;
create trigger conf_content_before_update
  before update on conf_content
  for each row execute function conf_content_before_update();

-- 公開：下書き（draft）を公開中（published）にコピーする。編集者だけ。
drop function if exists conf_publish(text);   -- 戻り値の形を変えても再実行できるように
create or replace function conf_publish(p_key text)
returns table (published_at timestamptz, version bigint, updated_by text)
language plpgsql security definer set search_path = public as $$
begin
  if not conf_is_editor() then
    raise exception 'not an editor' using errcode = '42501';
  end if;
  return query
    update conf_content c
       set published = c.draft, published_at = now()
     where c.key = p_key
    returning c.published_at, c.version, c.updated_by;
end $$;
revoke all on function conf_publish(text) from public;
grant execute on function conf_publish(text) to authenticated;

-- ---------- 権限（RLS） ----------

alter table conf_editors         enable row level security;   -- ポリシーなし＝直接は誰も読めない
alter table conf_content         enable row level security;
alter table conf_content_history enable row level security;   -- ポリシーなし＝直接は誰も読めない（Supabase のダッシュボードから見る）

revoke all on conf_editors, conf_content, conf_content_history from anon, authenticated;

-- 公開側（anon）：公開済みの列だけ
grant select (key, published, published_at) on conf_content to anon;
drop policy if exists conf_content_public_read on conf_content;
create policy conf_content_public_read on conf_content
  for select to anon using (true);

-- 編集者：読む／下書きを書く（published・version などは書けない）
grant select on conf_content to authenticated;
grant update (draft) on conf_content to authenticated;

drop policy if exists conf_content_editor_select on conf_content;
create policy conf_content_editor_select on conf_content
  for select to authenticated using (conf_is_editor());

drop policy if exists conf_content_editor_update on conf_content;
create policy conf_content_editor_update on conf_content
  for update to authenticated using (conf_is_editor()) with check (conf_is_editor());

-- ---------- 編集者の登録（例） ----------
-- 1) ダッシュボード → Authentication → Providers → Email で「Allow new users to sign up」を OFF にする
-- 2) Authentication → Users → Invite user（または Add user）で、編集者のメールアドレスを招待する
-- 3) 同じメールアドレス（小文字）を、ここにも登録する：
--    insert into conf_editors (email) values ('someone@example.com');
