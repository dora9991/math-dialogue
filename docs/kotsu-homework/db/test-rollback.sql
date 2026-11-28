-- test-rollback.sql — rollback-hw.sql の確かめ（run-tests.sh が、test-hw.sql のあとに流す）。
--   元にもどす → 宿題の関数・表が無い・既存の関数・表が hw.sql の前と同じ → もう 1度 hw.sql を入れて、動く（もどしたあとにやりなおせる）
\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;
\i rollback-hw.sql
create temp table rb (name text, ok boolean, detail text);
insert into rb select '元にもどす：宿題の関数が 1つも残っていない', count(*) = 0, string_agg(p.proname, ',') from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and (p.proname like 'hw\_%' or p.proname like '\_hw%');
insert into rb select '元にもどす：表 homework が無い', to_regclass('kotsu.homework') is null, null;
insert into rb select '元にもどす：既存の関数の定義・権限が、hw.sql の前と同じ（' || (select count(*) from hwsnap.funcs) || '件）',
  (select count(*) from hwsnap.funcs s full join hwsnap.funcs_now() n using (sig) where n.d is distinct from s.d or n.a is distinct from s.a) = 0, null;
insert into rb select '元にもどす：既存の表の列・制約・索引・権限が、hw.sql の前と同じ（' || (select count(*) from hwsnap.cols) || '表）',
  (select count(*) from hwsnap.cols s full join hwsnap.cols_now() n using (relname) where n.m is distinct from s.m) = 0, null;
\i :hw_sql
insert into rb select 'やりなおし：もどしたあとに、もう 1度 hw.sql を入れられる（関数 15こ・表 1つ）',
  (select count(*) from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and (p.proname like 'hw\_%' or p.proname like '\_hw%')) = 15 and to_regclass('kotsu.homework') is not null, null;
insert into rb select 'やりなおし：入れなおした宿題の関数が動く（空のデータで、でたらめなトークン → auth）',
  (select kotsu.hw_t_list('zzzzzzzzzzzzzzzzzzzzzzzz')->>'error') = 'auth', null;
\echo
\echo '════════ 元にもどす・やりなおし ════════'
select name, case when ok then '通った' else '失敗' end as 結果, coalesce(detail, '') as detail from rb;
select (count(*) filter (where not ok) > 0) as anyfail from rb \gset
\if :anyfail
  \echo '失敗があります'
  select 1/0;
\endif
\echo '全部通りました'
