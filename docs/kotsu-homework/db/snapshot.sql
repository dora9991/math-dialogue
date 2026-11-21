-- snapshot.sql — hw.sql を入れる「前」の、既存の関数・表のようすを写しておく（テスト用。test-hw.sql が、入れたあとと比べる）。
-- run-tests.sh が、base-hw.sql のあと・hw.sql の前に流す。test-hw.sql は、同じ関数（*_now）で「いま」を取って比べる。
create schema if not exists hwsnap;
create or replace function hwsnap.funcs_now() returns table (sig text, d text, a text) language sql stable as $f$
  select p.oid::regprocedure::text, md5(pg_get_functiondef(p.oid)), coalesce(p.proacl::text, '') from pg_proc p where p.pronamespace = 'kotsu'::regnamespace
$f$;
create or replace function hwsnap.cols_now() returns table (relname text, m text) language sql stable as $f$
  select c.relname::text,
    md5(string_agg(a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), ''), ',' order by a.attnum)
      || '|' || coalesce((select string_agg(pg_get_constraintdef(k.oid), ',' order by k.conname) from pg_constraint k where k.conrelid = c.oid), '')
      || '|' || coalesce((select string_agg(i.indexdef, ',' order by i.indexname) from pg_indexes i where i.schemaname = 'kotsu' and i.tablename = c.relname), '')
      || '|' || coalesce(c.relacl::text, '') || c.relrowsecurity::text)
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where c.relnamespace = 'kotsu'::regnamespace and c.relkind = 'r' and c.relname <> 'homework'
  group by c.oid, c.relname
$f$;
drop table if exists hwsnap.funcs; drop table if exists hwsnap.cols;
create table hwsnap.funcs as select * from hwsnap.funcs_now();
create table hwsnap.cols as select * from hwsnap.cols_now();
