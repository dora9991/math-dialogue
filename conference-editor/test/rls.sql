-- 権限（RLS）の検査。実際の Postgres で schema.sql を流し、役割ごとに「できること／できないこと」を確かめる。
-- 使い方（捨てていいデータベースに対して実行する。既存の auth スキーマ・anon・authenticated がある Supabase 本体には流さないこと）：
--   createdb conf_rls_test
--   psql -v ON_ERROR_STOP=1 -d conf_rls_test -f conference-editor/test/rls.sql
-- 失敗すると「FAIL: …」で止まり、最後まで通ると「ALL OK」と出る。
\set ON_ERROR_STOP on
\set QUIET on

-- ---- Supabase の最小の代用品（役割と auth.jwt()） ----
drop schema if exists auth cascade;
create schema auth;
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon')          then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.jwt() to anon, authenticated;

\ir ../supabase/schema.sql
-- 2回流しても壊れない（再実行OK）ことの確認
\ir ../supabase/schema.sql

-- ---- 検査の道具 ----
-- 指定した役割・メールアドレスで SQL を実行し、'ok:<行数>' か SQLSTATE（権限エラーは 42501）を返す
create function pg_temp.try_as(role_name text, email text, stmt text) returns text
language plpgsql as $$
declare n bigint;
begin
  execute format('set local role %I', role_name);
  perform set_config('request.jwt.claims',
    case when email is null then '' else json_build_object('email', email)::text end, true);
  begin
    execute stmt;
    get diagnostics n = row_count;
    reset role;
    return 'ok:' || n;
  exception when others then
    reset role;
    return sqlstate;
  end;
end $$;

create function pg_temp.check(name text, got text, want text) returns void
language plpgsql as $$
begin
  if got is distinct from want then
    raise exception 'FAIL: % (期待 %、実際 %)', name, want, got;
  end if;
  raise notice 'ok   %', name;
end $$;

insert into conf_editors (email) values ('editor@example.com');
\set QUIET off

-- ---- 公開側（anon） ----
select pg_temp.check('anon: 公開済みの列は読める（3行）',
  pg_temp.try_as('anon', null, 'select key, published, published_at from conf_content'), 'ok:3');
select pg_temp.check('anon: 下書き（draft）は読めない',
  pg_temp.try_as('anon', null, 'select draft from conf_content'), '42501');
select pg_temp.check('anon: select * は通らない（下書きの列を含むため）',
  pg_temp.try_as('anon', null, 'select * from conf_content'), '42501');
select pg_temp.check('anon: 書き換えられない',
  pg_temp.try_as('anon', null, $$update conf_content set draft = '[]'$$), '42501');
select pg_temp.check('anon: 追加できない',
  pg_temp.try_as('anon', null, $$insert into conf_content (key) values ('news')$$), '42501');
select pg_temp.check('anon: 削除できない',
  pg_temp.try_as('anon', null, 'delete from conf_content'), '42501');
select pg_temp.check('anon: 編集者の一覧は読めない',
  pg_temp.try_as('anon', null, 'select * from conf_editors'), '42501');
select pg_temp.check('anon: 履歴は読めない',
  pg_temp.try_as('anon', null, 'select * from conf_content_history'), '42501');
select pg_temp.check('anon: 公開（conf_publish）は呼べない',
  pg_temp.try_as('anon', null, $$select * from conf_publish('news')$$), '42501');

-- ---- ログインしているが、編集者ではない人 ----
select pg_temp.check('非編集者: 何も見えない（0行）',
  pg_temp.try_as('authenticated', 'stranger@example.com', 'select * from conf_content'), 'ok:0');
select pg_temp.check('非編集者: 下書きを書き換えられない（0行）',
  pg_temp.try_as('authenticated', 'stranger@example.com', $$update conf_content set draft = '[{"text":"x"}]'$$), 'ok:0');
select pg_temp.check('非編集者: 公開できない',
  pg_temp.try_as('authenticated', 'stranger@example.com', $$select * from conf_publish('news')$$), '42501');
select pg_temp.check('非編集者: メールアドレスなし（不正なトークン）でも何も見えない',
  pg_temp.try_as('authenticated', null, 'select * from conf_content'), 'ok:0');
select pg_temp.check('非編集者: 編集者の一覧は読めない',
  pg_temp.try_as('authenticated', 'stranger@example.com', 'select * from conf_editors'), '42501');

-- ---- 編集者 ----
select pg_temp.check('編集者: 3行読める',
  pg_temp.try_as('authenticated', 'editor@example.com', 'select * from conf_content'), 'ok:3');
select pg_temp.check('編集者: メールの大文字小文字が違っても編集者として扱う',
  pg_temp.try_as('authenticated', 'Editor@Example.com', 'select * from conf_content'), 'ok:3');
select pg_temp.check('編集者: 下書きを書き換えられる',
  pg_temp.try_as('authenticated', 'editor@example.com',
    $$update conf_content set draft = '[{"date":"2027-01-01","text":"テスト","url":""}]' where key = 'news'$$), 'ok:1');
select pg_temp.check('編集者: 版番号が +1 され、更新者がサーバー側で入る',
  (select version::text || '/' || updated_by from conf_content where key = 'news'), '2/editor@example.com');
select pg_temp.check('編集者: 変更前の内容が履歴に残る',
  (select count(*)::text from conf_content_history where key = 'news' and version = 1), '1');
select pg_temp.check('編集者: published を直接は書き換えられない',
  pg_temp.try_as('authenticated', 'editor@example.com', $$update conf_content set published = '[{"text":"直書き"}]' where key = 'news'$$), '42501');
select pg_temp.check('編集者: version を直接は書き換えられない',
  pg_temp.try_as('authenticated', 'editor@example.com', $$update conf_content set version = 999 where key = 'news'$$), '42501');
select pg_temp.check('編集者: key を書き換えられない',
  pg_temp.try_as('authenticated', 'editor@example.com', $$update conf_content set key = 'program' where key = 'news'$$), '42501');
select pg_temp.check('編集者: 追加できない',
  pg_temp.try_as('authenticated', 'editor@example.com', $$insert into conf_content (key) values ('news')$$), '42501');
select pg_temp.check('編集者: 削除できない',
  pg_temp.try_as('authenticated', 'editor@example.com', 'delete from conf_content'), '42501');
select pg_temp.check('編集者: 配列でない下書きは入れられない',
  pg_temp.try_as('authenticated', 'editor@example.com', $$update conf_content set draft = '{"a":1}' where key = 'news'$$), '23514');

-- 同時編集の検出（version を条件にした更新）
select pg_temp.check('衝突検出: 最新の版を指定すれば更新できる（1行）',
  pg_temp.try_as('authenticated', 'editor@example.com', $$update conf_content set draft = '[]' where key = 'news' and version = 2$$), 'ok:1');
select pg_temp.check('衝突検出: 古い版を指定した更新は0行（他の人が先に更新した）',
  pg_temp.try_as('authenticated', 'editor@example.com', $$update conf_content set draft = '[]' where key = 'news' and version = 2$$), 'ok:0');

-- ---- 公開 ----
update conf_content set draft = '[{"date":"2027-01-01","text":"公開するお知らせ","url":""}]' where key = 'news'; -- 管理者として下書きを用意
select pg_temp.check('公開前: anon から見える published は空で、published_at は null',
  (select published::text || '/' || coalesce(published_at::text, 'null') from conf_content where key = 'news'), '[]/null');
select pg_temp.check('編集者: conf_publish で公開できる',
  pg_temp.try_as('authenticated', 'editor@example.com', $$select * from conf_publish('news')$$), 'ok:1');
select pg_temp.check('公開後: anon から公開内容が見える',
  pg_temp.try_as('anon', null, $$select key, published from conf_content where key = 'news' and published @> '[{"text":"公開するお知らせ"}]'$$), 'ok:1');
select pg_temp.check('公開後: published_at が入る',
  (select (published_at is not null)::text from conf_content where key = 'news'), 'true');
select pg_temp.check('公開: 存在しない key は0行',
  pg_temp.try_as('authenticated', 'editor@example.com', $$select * from conf_publish('nothing')$$), 'ok:0');

\echo ALL OK
