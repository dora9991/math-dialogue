-- test-hw.sql — 宿題の DB（hw.sql）のテスト。run-tests.sh から呼ぶ（base-hw.sql と hw.sql を入れたあとの、手もとの PostgreSQL 16 で）。
--   前提：作業フォルダ＝このファイルのあるフォルダ。work/vectors.jsonl と work/random-vectors.jsonl（make-vectors.mjs が作る）。
--         hwsnap.funcs / hwsnap.cols（hw.sql を入れる前の、既存の関数・表のようす。run-tests.sh が作る）。
--   見るもの：検算データ（全件）と基準の実装との照合・権限・入力の検証・上限・締める／消す・クラスを移る・個人宛て／クラス宛て・
--            生徒の一覧（14日）・本名が出ないこと・何度流しても同じ・anon から内部が呼べないこと・規模（40人×40件など）の時間。
--   RPC は、PostgREST と同じに、anon の役割で、引数の名前を指定して呼ぶ（hwtest.rpc）。権限（grant）や引数の名前のまちがいも、ここで見つかる。
\set ON_ERROR_STOP on
\set QUIET on
\pset pager off
\pset null '(null)'
set client_min_messages = warning;

-- ═══════════════ 道具 ═══════════════
drop schema if exists hwtest cascade;
create schema hwtest;
create table hwtest.res (seq serial primary key, grp text not null, name text not null, ok boolean not null, detail text);
create table hwtest.kv (k text primary key, v text);
create table hwtest.perf (seq serial primary key, name text not null, ms numeric not null, note text);

create function hwtest.t(p_grp text, p_name text, p_ok boolean, p_detail text default null) returns boolean language plpgsql as $f$
begin
  insert into hwtest.res (grp, name, ok, detail) values (p_grp, p_name, coalesce(p_ok, false), case when coalesce(p_ok, false) then null else coalesce(p_detail, '(null)') end);
  return coalesce(p_ok, false);
end $f$;
create function hwtest.k(p_k text) returns text language sql stable as $f$ select v from hwtest.kv where k = p_k $f$;
create function hwtest.setk(p_k text, p_v text) returns void language sql as $f$ insert into hwtest.kv values (p_k, p_v) on conflict (k) do update set v = excluded.v $f$;
create function hwtest.uid(n integer) returns uuid language sql immutable as $f$ select ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;
create function hwtest.today() returns date language sql stable as $f$ select (now() at time zone 'Asia/Tokyo')::date $f$;
-- 日本時間の d 日の h 時（ミリ秒）
create function hwtest.ms(d date, h numeric default 12) returns bigint language sql immutable as $f$ select ((d - date '1970-01-01')::bigint * 86400000 - 32400000 + (h * 3600000)::bigint) $f$;
-- 日本時間の d 日の昼に、単元 u の解答を cnt 件（先頭の ok 件が正解）。新しい順の配列
create function hwtest.logs(u text, cnt integer, d date, ok integer default null) returns jsonb language sql immutable as $f$
  select coalesce(jsonb_agg(jsonb_build_object('t', hwtest.ms(d) + g * 1000, 'u', u, 'L', 1, 'ok', g <= coalesce(ok, cnt), 'h', false, 'd', 10) order by g desc), '[]'::jsonb)
  from generate_series(1, cnt) g $f$;
create function hwtest.setstate(p_user uuid, p_state jsonb) returns void language sql as $f$
  insert into kotsu.states (user_id, state, summary, size) values (p_user, p_state, '{}'::jsonb, octet_length(p_state::text))
  on conflict (user_id) do update set state = excluded.state, size = excluded.size, rev = kotsu.states.rev + 1, updated_at = now() $f$;

-- PostgREST と同じ呼びかた：anon の役割・引数は名前で渡す（関数が無い／名前がちがう／必須の引数が足りない → PGRST202）。
-- 結果は jsonb。SQL のエラーは {"pgerr":…, "sqlstate":…}
create function hwtest.rpc(p_fn text, p_args jsonb default '{}'::jsonb, p_role text default 'anon') returns jsonb language plpgsql as $f$
declare p record; k text; v jsonb; i integer; ty text; lit text; parts text[] := '{}'; r jsonb;
begin
  select pr.proargnames as an, string_to_array(pr.proargtypes::text, ' ')::oid[] as ts, pr.pronargs as na, pr.pronargdefaults as nd into p
    from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace where n.nspname = 'kotsu' and pr.proname = p_fn;
  if not found then return jsonb_build_object('pgrst', 'PGRST202', 'why', 'no function ' || p_fn); end if;
  for k in select jsonb_object_keys(p_args) loop
    if array_position(p.an, k) is null then return jsonb_build_object('pgrst', 'PGRST202', 'why', 'unknown arg ' || k); end if;
  end loop;
  for i in 1 .. (p.na - p.nd) loop
    if not (p_args ? p.an[i]) then return jsonb_build_object('pgrst', 'PGRST202', 'why', 'missing arg ' || p.an[i]); end if;
  end loop;
  for k, v in select * from jsonb_each(p_args) loop
    i := array_position(p.an, k);
    ty := format_type(p.ts[i], null);
    if jsonb_typeof(v) = 'null' then lit := 'null::' || ty;
    elsif ty = 'jsonb' then lit := format('%L::jsonb', v::text);
    elsif right(ty, 2) = '[]' then
      lit := format('%L::%s', '{' || coalesce((select string_agg(coalesce(x, 'NULL'), ',') from jsonb_array_elements_text(v) x), '') || '}', ty);
    else lit := format('%L::%s', v #>> '{}', ty);
    end if;
    parts := parts || format('%I => %s', k, lit);
  end loop;
  execute format('set local role %I', p_role);
  begin
    execute format('select kotsu.%I(%s)', p_fn, array_to_string(parts, ', ')) into r;
  exception when others then
    reset role;
    return jsonb_build_object('pgerr', sqlerrm, 'sqlstate', sqlstate);
  end;
  reset role;
  return r;
end $f$;
create function hwtest.c(p_fn text, p_tok text, p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $f$
  select hwtest.rpc(p_fn, jsonb_build_object('p_token', p_tok) || p_extra) $f$;
-- 「宿題を出す」の引数（先生の画面と同じく、キーは全部渡す）
create function hwtest.ca(p_class text default null, p_users text[] default null, p_title text default '', p_unit text default null,
                          p_n integer default null, p_min integer default 5, p_start date default null, p_due date default null, p_note text default null) returns jsonb language sql stable as $f$
  select jsonb_build_object('p_class', p_class, 'p_users', to_jsonb(p_users), 'p_title', p_title, 'p_unit', p_unit, 'p_n', p_n, 'p_min', p_min,
    'p_start', coalesce(p_start, hwtest.today()), 'p_due', coalesce(p_due, hwtest.today() + 2), 'p_note', p_note) $f$;
-- 出す（成功を期待）。id を返す。失敗したら例外
create function hwtest.mk(p_tok text, p_args jsonb) returns text language plpgsql as $f$
declare r jsonb;
begin
  r := hwtest.c('hw_t_create', p_tok, p_args);
  if r->>'ok' is distinct from 'true' then raise exception 'mk failed: % args=%', r, p_args; end if;
  return r->>'id';
end $f$;
-- anon（または authenticated）から、この SQL を実行すると「権限がない」になるか
create function hwtest.denied(p_sql text, p_role text default 'anon') returns boolean language plpgsql as $f$
begin
  execute format('set local role %I', p_role);
  begin
    execute p_sql;
  exception when insufficient_privilege then
    reset role; return true;
  when others then
    reset role; return false;
  end;
  reset role;
  return false;
end $f$;
create function hwtest.timeit(p_name text, p_sql text, p_reps integer default 3) returns numeric language plpgsql as $f$
declare t0 timestamptz; ms numeric; best numeric := null; all_ms text := ''; i integer;
begin
  for i in 1 .. p_reps loop
    t0 := clock_timestamp();
    execute p_sql;
    ms := round(extract(epoch from clock_timestamp() - t0) * 1000, 1);
    all_ms := all_ms || ms || ' ';
    if best is null or ms < best then best := ms; end if;
  end loop;
  insert into hwtest.perf (name, ms, note) values (p_name, best, 'ms（' || p_reps || '回のうち いちばん速い）全部：' || all_ms);
  return best;
end $f$;

-- ═══════════════ 準備：学校・先生・クラス・生徒（直接入れる。トークンは、本物の login で取る） ═══════════════
-- 学校 A（ORGA）：管理者 adm／先生 t1（C1・C2・CV）・t2（C3）・t3（C4）・t4（C5）／生徒
-- 学校 B（ORGB）：先生 bt1（CB1）／生徒 bs1
insert into kotsu.orgs (id, code, name) values (hwtest.uid(1), 'ORGA', 'A中学校'), (hwtest.uid(2), 'ORGB', 'B塾');
select hwtest.setk('hash', extensions.crypt('pw-test-1234', extensions.gen_salt('bf', 4)));
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc) values
  (hwtest.uid(11), hwtest.uid(1), 'admin',   'adm', hwtest.k('hash'), '管理者',   'SECRET-NAME-adm'),
  (hwtest.uid(12), hwtest.uid(1), 'teacher', 't1',  hwtest.k('hash'), '先生1',    'SECRET-NAME-t1'),
  (hwtest.uid(13), hwtest.uid(1), 'teacher', 't2',  hwtest.k('hash'), '先生2',    'SECRET-NAME-t2'),
  (hwtest.uid(14), hwtest.uid(1), 'teacher', 't3',  hwtest.k('hash'), '先生3',    'SECRET-NAME-t3'),
  (hwtest.uid(15), hwtest.uid(1), 'teacher', 't4',  hwtest.k('hash'), '先生4',    'SECRET-NAME-t4'),
  (hwtest.uid(21), hwtest.uid(2), 'teacher', 'bt1', hwtest.k('hash'), 'B先生',    'SECRET-NAME-bt1');
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc, active)
select hwtest.uid(1000 + n), hwtest.uid(1), 'student', 's' || lpad(n::text, 2, '0'), hwtest.k('hash'), 'ニック' || n, 'SECRET-NAME-s' || n, n <> 6
from unnest(array[1, 2, 3, 4, 5, 6, 11, 12, 13, 21, 22, 31, 41, 90]) as n;                      -- s06 は、やめた（active=false）生徒
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc)
select hwtest.uid(3000 + n), hwtest.uid(1), 'student', 'v' || lpad(n::text, 2, '0'), hwtest.k('hash'), '検算' || n, 'SECRET-NAME-v' || n from generate_series(1, 10) n;
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc) values
  (hwtest.uid(2001), hwtest.uid(2), 'student', 'bs1', hwtest.k('hash'), 'Bの子', 'SECRET-NAME-bs1');
insert into kotsu.classes (id, org_id, name) values
  (hwtest.uid(101), hwtest.uid(1), 'C1'), (hwtest.uid(102), hwtest.uid(1), 'C2'), (hwtest.uid(103), hwtest.uid(1), 'C3'),
  (hwtest.uid(104), hwtest.uid(1), 'C4'), (hwtest.uid(105), hwtest.uid(1), 'C5'), (hwtest.uid(110), hwtest.uid(1), 'CV'),
  (hwtest.uid(201), hwtest.uid(2), 'CB1');
insert into kotsu.class_teachers (class_id, user_id) values
  (hwtest.uid(101), hwtest.uid(12)), (hwtest.uid(102), hwtest.uid(12)), (hwtest.uid(110), hwtest.uid(12)),
  (hwtest.uid(103), hwtest.uid(13)), (hwtest.uid(104), hwtest.uid(14)), (hwtest.uid(105), hwtest.uid(15)), (hwtest.uid(201), hwtest.uid(21));
insert into kotsu.class_students (class_id, user_id, no) values
  (hwtest.uid(101), hwtest.uid(1001), 1), (hwtest.uid(101), hwtest.uid(1002), 2), (hwtest.uid(101), hwtest.uid(1003), 3),
  (hwtest.uid(101), hwtest.uid(1004), 4), (hwtest.uid(101), hwtest.uid(1005), 5), (hwtest.uid(101), hwtest.uid(1006), 6),
  (hwtest.uid(102), hwtest.uid(1011), 1), (hwtest.uid(102), hwtest.uid(1012), 2), (hwtest.uid(102), hwtest.uid(1013), 3),
  (hwtest.uid(103), hwtest.uid(1021), 1), (hwtest.uid(103), hwtest.uid(1022), 2),
  (hwtest.uid(104), hwtest.uid(1031), 1), (hwtest.uid(105), hwtest.uid(1041), 1),
  (hwtest.uid(201), hwtest.uid(2001), 1);
insert into kotsu.class_students (class_id, user_id, no) select hwtest.uid(110), hwtest.uid(3000 + n), n from generate_series(1, 10) n;

-- ID と トークンを覚える
select hwtest.setk('c1', hwtest.uid(101)::text), hwtest.setk('c2', hwtest.uid(102)::text), hwtest.setk('c3', hwtest.uid(103)::text), hwtest.setk('c4', hwtest.uid(104)::text),
       hwtest.setk('c5', hwtest.uid(105)::text), hwtest.setk('cv', hwtest.uid(110)::text), hwtest.setk('cb1', hwtest.uid(201)::text),
       hwtest.setk('orga', hwtest.uid(1)::text), hwtest.setk('orgb', hwtest.uid(2)::text);
select hwtest.setk('tok_' || l, (kotsu.login(o, l, 'pw-test-1234'))->>'token')
from (values ('ORGA', 'adm'), ('ORGA', 't1'), ('ORGA', 't2'), ('ORGA', 't3'), ('ORGA', 't4'), ('ORGB', 'bt1'),
             ('ORGA', 's01'), ('ORGA', 's02'), ('ORGA', 's11'), ('ORGA', 's13'), ('ORGA', 's21'), ('ORGA', 's90'), ('ORGA', 's31'), ('ORGB', 'bs1')) x(o, l);
select hwtest.t('準備', 'トークンが取れた（14）', (select count(*) from hwtest.kv where k like 'tok\_%' and length(v) = 48) = 14, (select count(*)::text from hwtest.kv where k like 'tok\_%'));

-- ═══════════════ 0. 権限の形（本番と同じ）・既存の関数が変わっていない ═══════════════
select hwtest.t('0.権限の形', '新しい公開の関数 7つの proacl ＝ {postgres, anon, authenticated} だけが X',
  (select count(*) from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and p.proname in ('hw_t_create', 'hw_t_list', 'hw_t_detail', 'hw_t_grid', 'hw_t_close', 'hw_t_delete', 'hw_s_list')
     and p.proacl::text = '{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}' and p.prosecdef and p.proconfig = array['search_path=kotsu, extensions, public']) = 7,
  (select string_agg(p.proname || ' ' || coalesce(p.proacl::text, 'null'), '; ') from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and p.proname like 'hw\_%'));
select hwtest.t('0.権限の形', '内部の関数 8つの proacl ＝ {postgres=X/postgres} だけ（public にも anon にも渡していない）',
  (select count(*) from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and p.proname in ('_hw_progress', '_hw_stats', '_hw_eval', '_hw_can', '_hw_mine', '_hw_item', '_hw_truthy', '_hw_secnum') and p.proacl::text = '{postgres=X/postgres}') = 8,
  (select string_agg(p.proname || ' ' || coalesce(p.proacl::text, 'null'), '; ') from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and p.proname like '\_hw%'));
select hwtest.t('0.権限の形', '表 homework：RLS 有効・ポリシーなし・権限は postgres だけ（既存の表と同じ）',
  (select c.relrowsecurity and c.relacl::text ~ '^\{postgres=arwdDxtm?/postgres\}$' and not exists (select 1 from pg_policy where polrelid = c.oid) from pg_class c where c.oid = 'kotsu.homework'::regclass),
  (select coalesce(c.relacl::text, 'null') from pg_class c where c.oid = 'kotsu.homework'::regclass));
select hwtest.t('0.権限の形', format('anon は、内部の関数 %s を呼べない', f),
  hwtest.denied(format('select kotsu.%s', f)), f)
from (values ('_hw_item(null::kotsu.homework)'), ('_hw_can(null::kotsu.users, null::kotsu.homework)'), ('_hw_eval(null::kotsu.homework)'),
             ('_hw_stats(array[]::uuid[])'), ('_hw_mine(null::kotsu.users)'), ('_hw_truthy(''true''::jsonb)'), ('_hw_secnum(''1''::jsonb)'), ('_hw_progress(null::kotsu.homework, ''{}''::jsonb)')) v(f);
select hwtest.t('0.権限の形', 'authenticated も、内部の関数 _hw_progress を呼べない', hwtest.denied('select kotsu._hw_progress(null::kotsu.homework, ''{}''::jsonb)', 'authenticated'));
select hwtest.t('0.権限の形', format('%s は、anon から %s できない', t, a), hwtest.denied(format('%s kotsu.homework %s', a, x)), a)
from (values ('anon', 'select * from', ''), ('anon', 'delete from', ''), ('anon', 'update', 'set closed = true')) v(t, a, x);
select hwtest.t('0.権限の形', 'anon は homework に insert できない', hwtest.denied('insert into kotsu.homework (org_id, title, start_date, due_date, min) values (gen_random_uuid(), ''x'', current_date, current_date, 5)'));
select hwtest.t('0.権限の形', 'authenticated は homework を読めない', hwtest.denied('select * from kotsu.homework', 'authenticated'));
select hwtest.t('0.権限の形', 'PostgREST の呼びかた（anon・引数は名前）で、公開の 7つが見つかる',
  (select count(*) from (values (hwtest.c('hw_s_list', 'x')), (hwtest.c('hw_t_list', 'x')), (hwtest.c('hw_t_detail', 'x', '{"p_id":"00000000-0000-4000-8000-000000000000"}')),
     (hwtest.c('hw_t_grid', 'x', '{"p_class":"00000000-0000-4000-8000-000000000000"}')), (hwtest.c('hw_t_close', 'x', '{"p_id":"00000000-0000-4000-8000-000000000000"}')),
     (hwtest.c('hw_t_delete', 'x', '{"p_id":"00000000-0000-4000-8000-000000000000"}')), (hwtest.rpc('hw_t_create', jsonb_build_object('p_token', 'x') || hwtest.ca()))) q(r)
   where r ? 'error') = 7);
select hwtest.t('0.既存の関数', '既存の関数の定義・権限が、hw.sql の前後で 1つも変わっていない（' || (select count(*) from hwsnap.funcs) || '件）',
  (select count(*) from hwsnap.funcs s left join hwsnap.funcs_now() n using (sig) where n.d is distinct from s.d or n.a is distinct from s.a) = 0,
  (select string_agg(s.sig, ', ') from hwsnap.funcs s left join hwsnap.funcs_now() n using (sig) where n.d is distinct from s.d or n.a is distinct from s.a));
select hwtest.t('0.既存の関数', 'hw.sql が足した関数は、ちょうど 15こ（内部 8・公開 7）',
  (select count(*) from hwsnap.funcs_now() n where n.sig not in (select sig from hwsnap.funcs)) = 15,
  (select string_agg(n.sig, ', ') from hwsnap.funcs_now() n where n.sig not in (select sig from hwsnap.funcs)));
select hwtest.t('0.既存の関数', '既存の表の列・制約・索引・権限が、hw.sql の前後で変わっていない（' || (select count(*) from hwsnap.cols) || '表）',
  (select count(*) from hwsnap.cols s full join hwsnap.cols_now() n using (relname) where n.m is distinct from s.m) = 0,
  (select string_agg(coalesce(s.relname, n.relname), ', ') from hwsnap.cols s full join hwsnap.cols_now() n using (relname) where n.m is distinct from s.m));

-- ═══════════════ 1. 進み具合：検算データ（vectors.json の 10件）と、ランダム 2000件 を、基準の実装（progress.mjs）と照合 ═══════════════
create table hwtest.vec (seq serial primary key, src text, j jsonb);
create table hwtest.vec_in (j jsonb);
\copy hwtest.vec_in (j) from 'work/vectors.jsonl' with (format csv, quote e'\x01', delimiter e'\x02')
insert into hwtest.vec (src, j) select 'vectors.json', j from hwtest.vec_in; truncate hwtest.vec_in;
\copy hwtest.vec_in (j) from 'work/random-vectors.jsonl' with (format csv, quote e'\x01', delimiter e'\x02')
insert into hwtest.vec (src, j) select 'random', j from hwtest.vec_in; drop table hwtest.vec_in;

create table hwtest.vres as
select v.seq, v.src, v.j->>'name' as name, v.j->'expect' as ex,
       kotsu._hw_progress(jsonb_populate_record(null::kotsu.homework, v.j->'hw'), v.j->'state', to_timestamp((v.j->>'nowMs')::numeric / 1000.0)) as got
from hwtest.vec v;
select hwtest.t('1.検算データ', format('%s：%s（全項目：count・correct・sec・pct・done・done_at・status・phase）', src, name),
  (got->>'count')::numeric = (ex->>'count')::numeric and (got->>'correct')::numeric = (ex->>'correct')::numeric and (got->>'sec')::numeric = (ex->>'sec')::numeric
  and abs((got->>'pct')::numeric - (ex->>'pct')::numeric) < 0.0005 and (got->>'done')::boolean = (ex->>'done')::boolean
  and got->>'done_at' is not distinct from ex->>'doneAt' and got->>'status' = ex->>'status' and got->>'phase' = ex->>'phase',
  'got=' || got::text || ' expect=' || ex::text)
from hwtest.vres where src = 'vectors.json' order by seq;
select hwtest.t('1.検算データ', format('ランダム %s件が、基準の実装と同じ結果（全項目）', count(*)),
  count(*) filter (where not ((got->>'count')::numeric = (ex->>'count')::numeric and (got->>'correct')::numeric = (ex->>'correct')::numeric and (got->>'sec')::numeric = (ex->>'sec')::numeric
    and abs((got->>'pct')::numeric - (ex->>'pct')::numeric) < 0.0005 and (got->>'done')::boolean = (ex->>'done')::boolean
    and got->>'done_at' is not distinct from ex->>'doneAt' and got->>'status' = ex->>'status' and got->>'phase' = ex->>'phase')) = 0,
  (select string_agg(name, ',') from (select name from hwtest.vres where src = 'random' and not ((got->>'count')::numeric = (ex->>'count')::numeric and (got->>'correct')::numeric = (ex->>'correct')::numeric and (got->>'sec')::numeric = (ex->>'sec')::numeric
    and abs((got->>'pct')::numeric - (ex->>'pct')::numeric) < 0.0005 and (got->>'done')::boolean = (ex->>'done')::boolean
    and got->>'done_at' is not distinct from ex->>'doneAt' and got->>'status' = ex->>'status' and got->>'phase' = ex->>'phase') limit 10) q)) from hwtest.vres where src = 'random';
select hwtest.t('1.検算データ', 'ランダムのうち pct が基準と完全に同じ（小数第3位まで、誤差 1e-12）の件数が全件', count(*) filter (where abs((got->>'pct')::numeric - (ex->>'pct')::numeric) > 1e-12) = 0, count(*) filter (where abs((got->>'pct')::numeric - (ex->>'pct')::numeric) > 1e-12)::text)
  from hwtest.vres;
select hwtest.t('1.検算データ', 'ランダムの中身：達成・一部・まだ・期間前・期間後・達成日あり が、それぞれ 30件以上（偏っていない）',
  count(*) filter (where ex->>'status' = 'done') >= 30 and count(*) filter (where ex->>'status' = 'partial') >= 30 and count(*) filter (where ex->>'status' = 'none') >= 30
  and count(*) filter (where ex->>'phase' = 'upcoming') >= 30 and count(*) filter (where ex->>'phase' = 'ended') >= 30 and count(*) filter (where ex->>'doneAt' is not null) >= 30, null) from hwtest.vres where src = 'random';

-- 検算データの 10件を、実際の RPC（hw_t_detail・hw_t_grid）でも：検算の生徒（v01〜v10）の state に入れ、個人宛ての宿題を作る
select hwtest.setstate(hwtest.uid(3000 + v.seq::int), case when jsonb_typeof(v.j->'state') = 'object' then v.j->'state' else '{}'::jsonb end) from hwtest.vec v where v.src = 'vectors.json';
insert into kotsu.homework (id, org_id, user_ids, title, unit_id, n, min, start_date, due_date, created_by)
select hwtest.uid(4000 + v.seq::int), hwtest.uid(1), array[hwtest.uid(3000 + v.seq::int)], 'V:' || (v.j->>'name'), v.j->'hw'->>'unit_id', (v.j->'hw'->>'n')::int, (v.j->'hw'->>'min')::int,
       (v.j->'hw'->>'start_date')::date, (v.j->'hw'->>'due_date')::date, hwtest.uid(12)
from hwtest.vec v where v.src = 'vectors.json';
select hwtest.t('1.検算データ（RPC）', format('hw_t_detail：%s', v.j->>'name'),
  (s->>'count')::numeric = (v.j->'expect'->>'count')::numeric and (s->>'correct')::numeric = (v.j->'expect'->>'correct')::numeric and (s->>'sec')::numeric = (v.j->'expect'->>'sec')::numeric
  and abs((s->>'pct')::numeric - (v.j->'expect'->>'pct')::numeric) < 0.0005 and s->>'status' = v.j->'expect'->>'status' and s->>'done_at' is not distinct from v.j->'expect'->>'doneAt',
  'got=' || coalesce(s::text, 'null') || ' expect=' || (v.j->'expect')::text)
from hwtest.vec v, lateral (select (hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.uid(4000 + v.seq::int)))->'students'->0) as s) x
where v.src = 'vectors.json' order by v.seq;
select hwtest.t('1.検算データ（RPC）', format('hw_t_grid（クラス CV）：%s', v.j->>'name'),
  (g->'cells'->(hwtest.uid(4000 + v.seq::int)::text)->>'status') = v.j->'expect'->>'status' and abs((g->'cells'->(hwtest.uid(4000 + v.seq::int)::text)->>'pct')::numeric - (v.j->'expect'->>'pct')::numeric) < 0.0005,
  coalesce(g::text, 'null'))
from hwtest.vec v,
  lateral (select s as g from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('cv')))->'students') s where (s->>'id')::uuid = hwtest.uid(3000 + v.seq::int)) x
where v.src = 'vectors.json' order by v.seq;

-- ═══════════════ 追加の道具 ═══════════════
create function hwtest.e(p_grp text, p_name text, r jsonb, p_code text) returns boolean language sql as $f$      -- エラー p_code を期待
  select hwtest.t(p_grp, p_name, r->>'error' is not distinct from p_code and r ? 'error', r::text) $f$;
create function hwtest.ok(p_grp text, p_name text, r jsonb) returns boolean language sql as $f$                  -- {"ok":true} を期待
  select hwtest.t(p_grp, p_name, r->>'ok' = 'true', r::text) $f$;
create function hwtest.ids(r jsonb) returns text[] language sql immutable as $f$ select coalesce(array_agg(x->>'id'), '{}') from jsonb_array_elements(coalesce(r->'items', '[]'::jsonb)) x $f$;
create function hwtest.titles(r jsonb) returns text[] language sql immutable as $f$ select coalesce(array_agg(x->>'title' order by x->>'title'), '{}') from jsonb_array_elements(coalesce(r->'items', '[]'::jsonb)) x $f$;
create function hwtest.keys(j jsonb) returns text language sql immutable as $f$ select coalesce(string_agg(k, ',' order by k), '') from jsonb_object_keys(j) k $f$;
create function hwtest.members(p_class uuid, p_users integer[]) returns void language plpgsql as $f$      -- クラスの生徒を入れかえる（本来の a_class_students と同じ：全部消して入れなおす。出席番号は並んだ順）
begin
  delete from kotsu.class_students where class_id = p_class;
  insert into kotsu.class_students (class_id, user_id, no) select p_class, hwtest.uid(u), ord from unnest(p_users) with ordinality t(u, ord);
end $f$;
create function hwtest.rowchk(p_id text, p_cond text) returns boolean language plpgsql as $f$      -- homework の 1行について、条件（SQL の式）が真か
declare b boolean;
begin
  execute format('select %s from kotsu.homework where id = %L::uuid', p_cond, p_id) into b;
  return coalesce(b, false);
end $f$;
create function hwtest.denied_by_check(p_sql text) returns boolean language plpgsql as $f$      -- この insert が、制約（check・外部キー）で止まるか
begin
  execute p_sql;
  return false;
exception when check_violation or foreign_key_violation then return true;
  when others then return false;
end $f$;

-- ═══════════════ 2. 宿題を出す：先生は自分のクラスだけ／管理者は学校内／ほかの学校は forbidden ═══════════════
-- 主なデータ（学校 A）
select hwtest.setk('h_main',  hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c1'), p_title => 'T:main',  p_unit => 'J1-u1', p_n => 5, p_min => null, p_start => hwtest.today() - 2,  p_due => hwtest.today() + 2, p_note => 'がんばろう')));
select hwtest.setk('h_ended', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c1'), p_title => 'T:ended', p_unit => 'J1-u1', p_n => 3, p_min => null, p_start => hwtest.today() - 10, p_due => hwtest.today() - 5)));
select hwtest.setk('h_min',   hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c1'), p_title => 'T:min',   p_min => 10, p_start => hwtest.today() - 1, p_due => hwtest.today() + 1)));
select hwtest.setk('h_ind',   hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(1001)::text, hwtest.uid(1011)::text], p_title => 'T:ind', p_unit => 'J1-u2', p_n => 2, p_min => null, p_start => hwtest.today() - 1, p_due => hwtest.today() + 1)));
select hwtest.setk('h_c2',    hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c2'), p_title => 'T:c2', p_min => 5)));
select hwtest.setk('h_c3',    hwtest.mk(hwtest.k('tok_t2'), hwtest.ca(p_class => hwtest.k('c3'), p_title => 'T:c3', p_min => 5)));
select hwtest.setk('h_b',     hwtest.mk(hwtest.k('tok_bt1'), hwtest.ca(p_class => hwtest.k('cb1'), p_title => 'T:b', p_min => 5)));
select hwtest.setk('h_adm_c3', hwtest.mk(hwtest.k('tok_adm'), hwtest.ca(p_class => hwtest.k('c3'), p_title => 'T:adm-c3', p_min => 5)));               -- 管理者は、担当でないクラスにも出せる
select hwtest.setk('h_adm_s21', hwtest.mk(hwtest.k('tok_adm'), hwtest.ca(p_users => array[hwtest.uid(1021)::text], p_title => 'T:adm-s21', p_min => 5)));  -- 管理者の個人宛て
select hwtest.setk('h_adm_s90', hwtest.mk(hwtest.k('tok_adm'), hwtest.ca(p_users => array[hwtest.uid(1090)::text], p_title => 'T:adm-s90', p_min => 5)));  -- クラスに入っていない生徒にも、管理者は出せる
select hwtest.setk('h_adm_mix', hwtest.mk(hwtest.k('tok_adm'), hwtest.ca(p_users => array[hwtest.uid(1001)::text, hwtest.uid(1021)::text], p_title => 'T:adm-mix', p_min => 5)));   -- C1 の s01 と C3 の s21（別々の先生の担当）
select hwtest.t('2.権限（出す）', 'hw_t_create の返りは {ok:true, id}（ほかのキーなし）', hwtest.keys(hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c1'), p_title => 'T:keys', p_min => 5))) = 'id,ok', null);
select hwtest.t('2.権限（出す）', '出した宿題の行：学校・クラス・作成者・既定の closed=false',
  (select org_id = hwtest.uid(1) and class_id = hwtest.uid(101) and user_ids is null and created_by = hwtest.uid(12) and not closed and unit_id = 'J1-u1' and n = 5 and min is null and note = 'がんばろう'
          and start_date = hwtest.today() - 2 and due_date = hwtest.today() + 2 and title = 'T:main' from kotsu.homework where id = hwtest.k('h_main')::uuid), null);
select hwtest.t('2.権限（出す）', '個人宛ての行：class_id=null・user_ids＝指定の 2人',
  (select class_id is null and user_ids = array[hwtest.uid(1001), hwtest.uid(1011)] from kotsu.homework where id = hwtest.k('h_ind')::uuid), null);

select hwtest.e('2.権限（出す）', '先生 t1 は、担当でないクラス C3 に出せない → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c3'))), 'forbidden');
select hwtest.e('2.権限（出す）', '先生 t1 は、ほかの学校のクラス CB1 に出せない → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('cb1'))), 'forbidden');
select hwtest.e('2.権限（出す）', 'ほかの学校の先生 bt1 は、A のクラス C1 に出せない → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_bt1'), hwtest.ca(p_class => hwtest.k('c1'))), 'forbidden');
select hwtest.e('2.権限（出す）', '先生 t2 は、C1（t1 の担当）に出せない → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t2'), hwtest.ca(p_class => hwtest.k('c1'))), 'forbidden');
select hwtest.e('2.権限（出す）', '管理者でも、ほかの学校のクラス CB1 には出せない → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_adm'), hwtest.ca(p_class => hwtest.k('cb1'))), 'forbidden');
select hwtest.e('2.権限（出す）', '存在しないクラス → not_found', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_class => gen_random_uuid()::text)), 'not_found');
select hwtest.e('2.権限（出す）', '個人宛て：担当クラスにいない生徒 s21 → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(1021)::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '個人宛て：自分の生徒 s01 と 担当外の s21 が混ざると全体が forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(1001)::text, hwtest.uid(1021)::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '個人宛て：ほかの学校の生徒 bs1 → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(2001)::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '個人宛て：管理者でも、ほかの学校の生徒 bs1 → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_adm'), hwtest.ca(p_users => array[hwtest.uid(2001)::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '個人宛て：生徒でない人（先生 t1）の id → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(12)::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '個人宛て：存在しない id → forbidden（存在を教えない）', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[gen_random_uuid()::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '個人宛て：クラスに入っていない生徒 s90 は、先生 t1 には出せない → forbidden', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(1090)::text])), 'forbidden');
select hwtest.e('2.権限（出す）', '生徒のトークンで hw_t_create → role（先生の画面は、auth と同じ案内）', hwtest.c('hw_t_create', hwtest.k('tok_s01'), hwtest.ca(p_class => hwtest.k('c1'))), 'role');
-- アーカイブずみのクラス（CA。t1 が担当）には出せない
insert into kotsu.classes (id, org_id, name, archived) values (hwtest.uid(107), hwtest.uid(1), 'CA', true);
insert into kotsu.class_teachers (class_id, user_id) values (hwtest.uid(107), hwtest.uid(12));
select hwtest.e('2.権限（出す）', 'アーカイブずみのクラスには出せない → not_found', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.uid(107)::text)), 'not_found');
select hwtest.ok('2.権限（出す）', '管理者は、学校のどのクラスにも出せる（C3）', hwtest.c('hw_t_detail', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.k('h_adm_c3'))));
select hwtest.ok('2.権限（出す）', '管理者は、個人宛て（s21・s90）の宿題も、詳細を見られる', hwtest.c('hw_t_detail', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.k('h_adm_s90'))));

-- ── トークン：でたらめ・短い・null・空・期限切れ・停止中・塾が止まっている ──
select hwtest.e('2.トークン', format('%s：%s → auth', f, lbl), hwtest.rpc(f, jsonb_build_object('p_token', tok) || ex), 'auth')
from (values
  ('hw_t_create', jsonb_build_object('p_class', hwtest.k('c1')) || hwtest.ca(p_class => hwtest.k('c1'))),
  ('hw_t_list', '{}'::jsonb), ('hw_t_detail', jsonb_build_object('p_id', hwtest.k('h_main'))), ('hw_t_grid', jsonb_build_object('p_class', hwtest.k('c1'))),
  ('hw_t_close', jsonb_build_object('p_id', hwtest.k('h_main'))), ('hw_t_delete', jsonb_build_object('p_id', hwtest.k('h_main'))), ('hw_s_list', '{}'::jsonb)) f(f, ex),
  (values ('でたらめな長い', repeat('ab', 24)), ('短い', 'abc'), ('空', ''), ('null', null)) t(lbl, tok);
select hwtest.setk('tok_t1x', (kotsu.login('ORGA', 't1', 'pw-test-1234'))->>'token'), hwtest.setk('tok_s02x', (kotsu.login('ORGA', 's02', 'pw-test-1234'))->>'token');
update kotsu.sessions set expires_at = now() - interval '1 hour' where token_hash in (kotsu._h(hwtest.k('tok_t1x')), kotsu._h(hwtest.k('tok_s02x')));
select hwtest.e('2.トークン', '期限切れの先生のトークン：hw_t_list → auth', hwtest.c('hw_t_list', hwtest.k('tok_t1x')), 'auth');
select hwtest.e('2.トークン', '期限切れの先生のトークン：hw_t_create → auth', hwtest.c('hw_t_create', hwtest.k('tok_t1x'), hwtest.ca(p_class => hwtest.k('c1'))), 'auth');
select hwtest.e('2.トークン', '期限切れの生徒のトークン：hw_s_list → auth', hwtest.c('hw_s_list', hwtest.k('tok_s02x')), 'auth');
update kotsu.users set active = false where id = hwtest.uid(13);
select hwtest.e('2.トークン', '停止中（active=false）の先生のトークン → auth', hwtest.c('hw_t_list', hwtest.k('tok_t2')), 'auth');
update kotsu.users set active = true where id = hwtest.uid(13);
select hwtest.ok('2.トークン', '再開すると使える', hwtest.c('hw_t_list', hwtest.k('tok_t2')));
update kotsu.users set active = false where id = hwtest.uid(1001);
select hwtest.e('2.トークン', '停止中の生徒のトークン → auth', hwtest.c('hw_s_list', hwtest.k('tok_s01')), 'auth');
update kotsu.users set active = true where id = hwtest.uid(1001);
update kotsu.orgs set active = false where id = hwtest.uid(2);
select hwtest.e('2.トークン', '塾・学校が止まっている（org_off）：先生', hwtest.c('hw_t_list', hwtest.k('tok_bt1')), 'org_off');
select hwtest.e('2.トークン', '塾・学校が止まっている（org_off）：生徒', hwtest.c('hw_s_list', hwtest.k('tok_bs1')), 'org_off');
update kotsu.orgs set active = true where id = hwtest.uid(2);
select hwtest.ok('2.トークン', '学校を再開すると使える', hwtest.c('hw_t_list', hwtest.k('tok_bt1')));
-- 生徒のトークンで先生の関数／先生のトークンで生徒の関数
select hwtest.e('2.トークン', format('生徒のトークンで %s → role', f), hwtest.rpc(f, jsonb_build_object('p_token', hwtest.k('tok_s01')) || ex), 'role')
from (values ('hw_t_list', '{}'::jsonb), ('hw_t_detail', jsonb_build_object('p_id', hwtest.k('h_main'))), ('hw_t_grid', jsonb_build_object('p_class', hwtest.k('c1'))),
  ('hw_t_close', jsonb_build_object('p_id', hwtest.k('h_main'))), ('hw_t_delete', jsonb_build_object('p_id', hwtest.k('h_main')))) f(f, ex);
select hwtest.e('2.トークン', '先生のトークンで hw_s_list → role（空の一覧ではなく、拒否）', hwtest.c('hw_s_list', hwtest.k('tok_t1')), 'role');
select hwtest.e('2.トークン', '管理者のトークンで hw_s_list → role', hwtest.c('hw_s_list', hwtest.k('tok_adm')), 'role');
select hwtest.t('2.トークン', '宿題が 1件も消えていない（拒否された呼びかけは、何も変えない）', (select count(*) from kotsu.homework where id = hwtest.k('h_main')::uuid and not closed) = 1, null);

-- ── 見える範囲（一覧・詳細・マス目・締める・消す） ──
select hwtest.setk('l_t1', hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":200}')::text),
       hwtest.setk('l_t2', hwtest.c('hw_t_list', hwtest.k('tok_t2'), '{"p_limit":200}')::text),
       hwtest.setk('l_adm', hwtest.c('hw_t_list', hwtest.k('tok_adm'), '{"p_limit":200}')::text),
       hwtest.setk('l_bt1', hwtest.c('hw_t_list', hwtest.k('tok_bt1'), '{"p_limit":200}')::text);
select hwtest.t('2.見える範囲', '先生 t1 の一覧：自分のクラス（C1・C2）と、そのクラスの生徒の個人宛て。C3・ほかの学校のものは無い',
  hwtest.ids(hwtest.k('l_t1')::jsonb) @> array[hwtest.k('h_main'), hwtest.k('h_ended'), hwtest.k('h_min'), hwtest.k('h_ind'), hwtest.k('h_c2')]
  and not hwtest.ids(hwtest.k('l_t1')::jsonb) && array[hwtest.k('h_c3'), hwtest.k('h_b'), hwtest.k('h_adm_c3'), hwtest.k('h_adm_s21'), hwtest.k('h_adm_s90')], hwtest.k('l_t1'));
select hwtest.t('2.見える範囲', '先生 t2 の一覧：C3 と、C3 の生徒（s21）への個人宛てだけ',
  hwtest.ids(hwtest.k('l_t2')::jsonb) @> array[hwtest.k('h_c3'), hwtest.k('h_adm_c3'), hwtest.k('h_adm_s21')]
  and not hwtest.ids(hwtest.k('l_t2')::jsonb) && array[hwtest.k('h_main'), hwtest.k('h_ind'), hwtest.k('h_c2'), hwtest.k('h_b'), hwtest.k('h_adm_s90')], hwtest.k('l_t2'));
select hwtest.t('2.見える範囲', '管理者の一覧：学校 A のすべて（クラス宛て・個人宛て）。ほかの学校（h_b）は無い',
  hwtest.ids(hwtest.k('l_adm')::jsonb) @> array[hwtest.k('h_main'), hwtest.k('h_c3'), hwtest.k('h_ind'), hwtest.k('h_adm_s90'), hwtest.k('h_c2')]
  and not hwtest.k('h_b') = any(hwtest.ids(hwtest.k('l_adm')::jsonb)), null);
select hwtest.t('2.見える範囲', 'ほかの学校の先生 bt1 の一覧：自分の学校のものだけ（A のものは 1件も無い）',
  hwtest.ids(hwtest.k('l_bt1')::jsonb) = array[hwtest.k('h_b')], hwtest.k('l_bt1'));
select hwtest.t('2.見える範囲', '一覧（クラスしぼりこみ）：t1 が C1 を指定 → C1 宛て＋C1 の生徒を含む個人宛て（h_ind）。C2 のものは無い',
  hwtest.ids(hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1'), 'p_limit', 200))) @> array[hwtest.k('h_main'), hwtest.k('h_ind')]
  and not hwtest.k('h_c2') = any(hwtest.ids(hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1'), 'p_limit', 200)))), null);
select hwtest.t('2.見える範囲', '一覧（クラスしぼりこみ）：t1 が C2 を指定 → h_c2 と h_ind（s11 が C2）。C1 のものは無い',
  hwtest.ids(hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c2'), 'p_limit', 200))) @> array[hwtest.k('h_c2'), hwtest.k('h_ind')]
  and not hwtest.k('h_main') = any(hwtest.ids(hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c2'), 'p_limit', 200)))), null);
select hwtest.e('2.見える範囲', '一覧：担当外のクラス C3 を指定（t1）→ forbidden', hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c3'))), 'forbidden');
select hwtest.e('2.見える範囲', '一覧：ほかの学校のクラスを指定（t1）→ forbidden', hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('cb1'))), 'forbidden');
select hwtest.e('2.見える範囲', '一覧：存在しないクラス → not_found', hwtest.c('hw_t_list', hwtest.k('tok_t1'), jsonb_build_object('p_class', gen_random_uuid())), 'not_found');
select hwtest.ok('2.見える範囲', '一覧：管理者は、担当でないクラス C3 を指定できる', hwtest.c('hw_t_list', hwtest.k('tok_adm'), jsonb_build_object('p_class', hwtest.k('c3'))));
select hwtest.e('2.見える範囲', '詳細：t1 が C3 の宿題 → forbidden', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_c3'))), 'forbidden');
select hwtest.e('2.見える範囲', '詳細：t1 がほかの学校の宿題 → forbidden', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_b'))), 'forbidden');
select hwtest.e('2.見える範囲', '詳細：bt1 が学校 A の宿題 → forbidden', hwtest.c('hw_t_detail', hwtest.k('tok_bt1'), jsonb_build_object('p_id', hwtest.k('h_main'))), 'forbidden');
select hwtest.e('2.見える範囲', '詳細：t2 が C1 の宿題 → forbidden', hwtest.c('hw_t_detail', hwtest.k('tok_t2'), jsonb_build_object('p_id', hwtest.k('h_main'))), 'forbidden');
select hwtest.e('2.見える範囲', '詳細：t2 が、自分の生徒のいない個人宛て（h_ind） → forbidden', hwtest.c('hw_t_detail', hwtest.k('tok_t2'), jsonb_build_object('p_id', hwtest.k('h_ind'))), 'forbidden');
select hwtest.ok('2.見える範囲', '詳細：t1 が個人宛て（h_ind。s01・s11 が自分のクラス）→ 見られる', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_ind'))));
select hwtest.ok('2.見える範囲', '詳細：t2 が C3 の生徒への個人宛て（管理者が出した h_adm_s21）→ 見られる', hwtest.c('hw_t_detail', hwtest.k('tok_t2'), jsonb_build_object('p_id', hwtest.k('h_adm_s21'))));
select hwtest.e('2.見える範囲', '詳細：管理者が、ほかの学校の宿題 → forbidden', hwtest.c('hw_t_detail', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.k('h_b'))), 'forbidden');
select hwtest.e('2.見える範囲', '詳細：存在しない宿題 → not_found', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', gen_random_uuid())), 'not_found');
select hwtest.e('2.見える範囲', format('マス目：%s → %s', lbl, code), hwtest.c('hw_t_grid', hwtest.k(tk), jsonb_build_object('p_class', cl)), code)
from (values ('t1 が担当外の C3', 'tok_t1', hwtest.k('c3'), 'forbidden'), ('t1 がほかの学校の CB1', 'tok_t1', hwtest.k('cb1'), 'forbidden'),
             ('bt1 が学校 A の C1', 'tok_bt1', hwtest.k('c1'), 'forbidden'), ('t2 が C1', 'tok_t2', hwtest.k('c1'), 'forbidden'),
             ('管理者がほかの学校の CB1', 'tok_adm', hwtest.k('cb1'), 'forbidden'), ('存在しないクラス', 'tok_t1', gen_random_uuid()::text, 'not_found')) v(lbl, tk, cl, code);
select hwtest.ok('2.見える範囲', format('マス目：%s → 見られる', lbl), hwtest.c('hw_t_grid', hwtest.k(tk), jsonb_build_object('p_class', hwtest.k(cl))))
from (values ('t1 が C1', 'tok_t1', 'c1'), ('t1 が C2', 'tok_t1', 'c2'), ('t2 が C3', 'tok_t2', 'c3'), ('管理者が C1', 'tok_adm', 'c1'), ('管理者が C3', 'tok_adm', 'c3'), ('bt1 が CB1', 'tok_bt1', 'cb1')) v(lbl, tk, cl);
select hwtest.e('2.見える範囲', format('締める：%s → forbidden', lbl), hwtest.c('hw_t_close', hwtest.k(tk), jsonb_build_object('p_id', hwtest.k(h))), 'forbidden')
from (values ('t2 が C1 の宿題', 'tok_t2', 'h_main'), ('bt1 が学校 A の宿題', 'tok_bt1', 'h_main'), ('t1 が C3 の宿題', 'tok_t1', 'h_c3'), ('管理者がほかの学校の宿題', 'tok_adm', 'h_b')) v(lbl, tk, h);
select hwtest.e('2.見える範囲', format('消す：%s → forbidden', lbl), hwtest.c('hw_t_delete', hwtest.k(tk), jsonb_build_object('p_id', hwtest.k(h))), 'forbidden')
from (values ('t2 が C1 の宿題', 'tok_t2', 'h_main'), ('bt1 が学校 A の宿題', 'tok_bt1', 'h_main'), ('t1 が C3 の宿題', 'tok_t1', 'h_c3'), ('管理者がほかの学校の宿題', 'tok_adm', 'h_b')) v(lbl, tk, h);
select hwtest.e('2.見える範囲', '締める・消す：存在しない宿題 → not_found', hwtest.c('hw_t_close', hwtest.k('tok_t1'), jsonb_build_object('p_id', gen_random_uuid())), 'not_found');
select hwtest.e('2.見える範囲', '消す：存在しない宿題 → not_found', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', gen_random_uuid())), 'not_found');
select hwtest.t('2.見える範囲', '拒否された締める・消すは、何も変えない（h_main・h_c3・h_b が、そのまま）',
  (select count(*) from kotsu.homework where id in (hwtest.k('h_main')::uuid, hwtest.k('h_c3')::uuid, hwtest.k('h_b')::uuid) and not closed) = 3, null);

-- ═══════════════ 3. 進み具合の集計（一覧の人数・詳細・マス目）と、本名が出ないこと ═══════════════
-- 生徒の学習記録（kotsu.states.state の log・daily）を入れる。T ＝ 今日（日本時間）
--   s01：J1-u1 を T-1 に 3問（全部正解）＋ T に 2問（1問正解）＝ 5問（正解 4）→ h_main 達成（達成日 T）。T-8 に 3問（h_ended 達成・達成日 T-8）。J1-u2 を T に 2問（h_ind 達成）。T の学習 600秒（h_min 達成）
--   s02：J1-u1 を T-1 に 2問 → h_main 2/5。T-7 に 1問 → h_ended 1/3。T の学習 300秒 → h_min 50%
--   s03：記録なし（states の行そのものがない）
--   s04：J1-u2 を T-1 に 7問（h_main の単元ではない）→ h_main 0
--   s05：J1-u1 を T-3 に 5問（h_main の開始 T-2 より前）→ h_main 0
--   s06：やめた生徒。J1-u1 を T-1 に 5問（数えない・出さない）
select hwtest.setstate(hwtest.uid(1001),
  jsonb_build_object('log', hwtest.logs('J1-u1', 3, hwtest.today() - 1) || hwtest.logs('J1-u1', 2, hwtest.today(), 1) || hwtest.logs('J1-u1', 3, hwtest.today() - 8) || hwtest.logs('J1-u2', 2, hwtest.today()),
                     'daily', jsonb_build_object(hwtest.today()::text, jsonb_build_object('n', 7, 'c', 6, 'xp', 0, 'sec', 600)), 'v', 1));
select hwtest.setstate(hwtest.uid(1002),
  jsonb_build_object('log', hwtest.logs('J1-u1', 2, hwtest.today() - 1) || hwtest.logs('J1-u1', 1, hwtest.today() - 7),
                     'daily', jsonb_build_object(hwtest.today()::text, jsonb_build_object('n', 1, 'c', 1, 'xp', 0, 'sec', 300)), 'v', 1));
select hwtest.setstate(hwtest.uid(1004), jsonb_build_object('log', hwtest.logs('J1-u2', 7, hwtest.today() - 1), 'daily', '{}'::jsonb));
select hwtest.setstate(hwtest.uid(1005), jsonb_build_object('log', hwtest.logs('J1-u1', 5, hwtest.today() - 3), 'daily', '{}'::jsonb));
select hwtest.setstate(hwtest.uid(1006), jsonb_build_object('log', hwtest.logs('J1-u1', 5, hwtest.today() - 1), 'daily', '{}'::jsonb));

select hwtest.setk('d_main', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_main')))::text);
select hwtest.t('3.集計', 'h_main：生徒は 5人（やめた s06 は出ない）。出席番号順 s01〜s05', (select array_agg(s->>'login' order by ord) from jsonb_array_elements(hwtest.k('d_main')::jsonb->'students') with ordinality t(s, ord)) = array['s01','s02','s03','s04','s05'], hwtest.k('d_main'));
select hwtest.t('3.集計', 'h_main の s01：5問・正解4・pct 1・達成・達成日 ＝ 今日（5問目の日）・sec 600',
  (s->>'count')::int = 5 and (s->>'correct')::int = 4 and (s->>'pct')::numeric = 1 and s->>'status' = 'done' and s->>'done_at' = hwtest.today()::text and (s->>'sec')::numeric = 600, s::text)
  from (select hwtest.k('d_main')::jsonb->'students'->0 as s) x;
select hwtest.t('3.集計', 'h_main の s02：2問・pct 0.4・一部', (s->>'count')::int = 2 and (s->>'pct')::numeric = 0.4 and s->>'status' = 'partial' and s->>'done_at' is null, s::text) from (select hwtest.k('d_main')::jsonb->'students'->1 as s) x;
select hwtest.t('3.集計', 'h_main の s03（states の行なし）：0問・まだ', (s->>'count')::int = 0 and (s->>'pct')::numeric = 0 and s->>'status' = 'none', s::text) from (select hwtest.k('d_main')::jsonb->'students'->2 as s) x;
select hwtest.t('3.集計', 'h_main の s04（別の単元 7問）：0問・まだ', (s->>'count')::int = 0 and s->>'status' = 'none', s::text) from (select hwtest.k('d_main')::jsonb->'students'->3 as s) x;
select hwtest.t('3.集計', 'h_main の s05（開始日より前の 5問）：数えない', (s->>'count')::int = 0 and s->>'status' = 'none', s::text) from (select hwtest.k('d_main')::jsonb->'students'->4 as s) x;
select hwtest.t('3.集計', 'h_main の人数：total 5・done 1・partial 1・none 3・missed 0',
  (hwtest.k('d_main')::jsonb->'hw'->>'total')::int = 5 and (hwtest.k('d_main')::jsonb->'hw'->>'done')::int = 1 and (hwtest.k('d_main')::jsonb->'hw'->>'partial')::int = 1
  and (hwtest.k('d_main')::jsonb->'hw'->>'none')::int = 3 and (hwtest.k('d_main')::jsonb->'hw'->>'missed')::int = 0, hwtest.k('d_main')::jsonb->>'hw');
select hwtest.t('3.集計', 'hw_t_detail の返り：{ok, hw, students} と、生徒の項目は 契約どおり（id,no,nick,login,count,correct,sec,pct,status,done_at）だけ',
  hwtest.keys(hwtest.k('d_main')::jsonb) = 'hw,ok,students' and hwtest.keys(hwtest.k('d_main')::jsonb->'students'->0) = 'correct,count,done_at,id,login,nick,no,pct,sec,status', hwtest.keys(hwtest.k('d_main')::jsonb->'students'->0));
select hwtest.t('3.集計', 'hw_t_detail の hw：契約の項目（id,title,class_id,class_name,user_ids,unit_id,n,min,start_date,due_date,note,created_at,closed,total,done,partial,none）を含む',
  hwtest.keys(hwtest.k('d_main')::jsonb->'hw') = 'class_id,class_name,closed,created_at,done,due_date,id,min,missed,n,none,note,partial,start_date,title,total,unit_id,user_ids'
  and hwtest.k('d_main')::jsonb->'hw'->>'class_name' = 'C1' and hwtest.k('d_main')::jsonb->'hw'->>'note' = 'がんばろう' and hwtest.k('d_main')::jsonb->'hw'->'user_ids' = 'null'::jsonb, hwtest.keys(hwtest.k('d_main')::jsonb->'hw'));

select hwtest.setk('d_ended', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_ended')))::text);
select hwtest.t('3.集計', 'h_ended（期限切れ）：s01 達成（達成日 T-8）・s02 一部（1/3＝0.333）・残り 3人は、none でなく missed',
  (hwtest.k('d_ended')::jsonb->'students'->0->>'done_at') = (hwtest.today() - 8)::text and (hwtest.k('d_ended')::jsonb->'students'->1->>'pct')::numeric = 0.333
  and (hwtest.k('d_ended')::jsonb->'hw'->>'done')::int = 1 and (hwtest.k('d_ended')::jsonb->'hw'->>'partial')::int = 1
  and (hwtest.k('d_ended')::jsonb->'hw'->>'none')::int = 0 and (hwtest.k('d_ended')::jsonb->'hw'->>'missed')::int = 3 and (hwtest.k('d_ended')::jsonb->'hw'->>'total')::int = 5, hwtest.k('d_ended')::jsonb->>'hw');
select hwtest.setk('d_min', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_min')))::text);
select hwtest.t('3.集計', 'h_min（10分）：s01 600秒で達成（達成日 T）・s02 300秒で 0.5 の一部・unit なしなので count は 0',
  hwtest.k('d_min')::jsonb->'students'->0->>'status' = 'done' and hwtest.k('d_min')::jsonb->'students'->0->>'done_at' = hwtest.today()::text
  and (hwtest.k('d_min')::jsonb->'students'->1->>'pct')::numeric = 0.5 and (hwtest.k('d_min')::jsonb->'students'->1->>'sec')::numeric = 300
  and (hwtest.k('d_min')::jsonb->'students'->0->>'count')::int = 0, hwtest.k('d_min'));
select hwtest.setk('d_ind', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_ind')))::text);
select hwtest.t('3.集計', 'h_ind（個人宛て：s01・s11）：対象は 2人だけ。s01 は 2問で達成、s11 はまだ。no は、それぞれのクラスの番号',
  (select array_agg(s->>'login' order by ord) from jsonb_array_elements(hwtest.k('d_ind')::jsonb->'students') with ordinality t(s, ord)) = array['s01', 's11']
  and hwtest.k('d_ind')::jsonb->'students'->0->>'status' = 'done' and hwtest.k('d_ind')::jsonb->'students'->1->>'status' = 'none'
  and hwtest.k('d_ind')::jsonb->'hw'->>'class_name' is null and (hwtest.k('d_ind')::jsonb->'hw'->>'total')::int = 2 and (hwtest.k('d_ind')::jsonb->'students'->0->>'no')::int = 1, hwtest.k('d_ind'));

-- 一覧の人数は、詳細と同じ
select hwtest.setk('l2_t1', hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":200}')::text);
select hwtest.t('3.集計', format('一覧の人数（%s）が、詳細と同じ', h), (select i from jsonb_array_elements(hwtest.k('l2_t1')::jsonb->'items') i where i->>'id' = hwtest.k(h)) @> (select jsonb_build_object('total', d->'total', 'done', d->'done', 'partial', d->'partial', 'none', d->'none', 'missed', d->'missed') from (select hwtest.k(dk)::jsonb->'hw' d) y), hwtest.k('l2_t1'))
from (values ('h_main', 'd_main'), ('h_ended', 'd_ended'), ('h_min', 'd_min'), ('h_ind', 'd_ind')) v(h, dk);
select hwtest.t('3.集計', '一覧は新しい順（作った順の逆）', (select array_agg(i->>'id' order by ord) from jsonb_array_elements(hwtest.k('l2_t1')::jsonb->'items') with ordinality t(i, ord) where i->>'id' in (hwtest.k('h_main'), hwtest.k('h_ended'), hwtest.k('h_min'), hwtest.k('h_ind')))
  = array[hwtest.k('h_ind'), hwtest.k('h_min'), hwtest.k('h_ended'), hwtest.k('h_main')], null);
select hwtest.t('3.集計', '一覧の p_limit：2 にすると 2件（新しい順）', jsonb_array_length(hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":2}')->'items') = 2, null);
select hwtest.t('3.集計', '一覧の p_limit：0 や負でも 1件（最小）、10000 でも 200 まで', jsonb_array_length(hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":0}')->'items') = 1 and jsonb_array_length(hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":10000}')->'items') <= 200, null);
select hwtest.t('3.集計', '一覧の項目：契約どおり（unit_name は付けない）', hwtest.keys(hwtest.k('l2_t1')::jsonb->'items'->0) = 'class_id,class_name,closed,created_at,done,due_date,id,min,missed,n,none,note,partial,start_date,title,total,unit_id,user_ids', hwtest.keys(hwtest.k('l2_t1')::jsonb->'items'->0));

-- マス目
select hwtest.setk('g_c1', hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1')))::text);
select hwtest.t('3.マス目', 'マス目 C1：返りは {ok, hws, students}。宿題は 古い順（開始日、同じなら作った順）：h_ended, h_main, h_min, h_ind',
  hwtest.keys(hwtest.k('g_c1')::jsonb) = 'hws,ok,students'
  and (select array_agg(h->>'id' order by ord) from jsonb_array_elements(hwtest.k('g_c1')::jsonb->'hws') with ordinality t(h, ord) where h->>'id' in (hwtest.k('h_main'), hwtest.k('h_ended'), hwtest.k('h_min'), hwtest.k('h_ind')))
      = array[hwtest.k('h_ended'), hwtest.k('h_main'), hwtest.k('h_min'), hwtest.k('h_ind')], hwtest.k('g_c1'));
select hwtest.t('3.マス目', 'マス目：宿題の項目は {id,title,start_date,due_date,unit_id,n,min}、生徒の項目は {id,no,nick,cells}', hwtest.keys(hwtest.k('g_c1')::jsonb->'hws'->0) = 'due_date,id,min,n,start_date,title,unit_id' and hwtest.keys(hwtest.k('g_c1')::jsonb->'students'->0) = 'cells,id,nick,no', hwtest.keys(hwtest.k('g_c1')::jsonb->'students'->0));
select hwtest.t('3.マス目', 'マス目：生徒は出席番号順の 5人（s06 はやめたので出ない）。no・nick が出る', (select array_agg((s->>'no')::int order by ord) from jsonb_array_elements(hwtest.k('g_c1')::jsonb->'students') with ordinality t(s, ord)) = array[1,2,3,4,5]
  and hwtest.k('g_c1')::jsonb->'students'->0->>'nick' = 'ニック1', null);
select hwtest.t('3.マス目', '個人宛て h_ind：対象の s01 にだけ cells がある（s02〜s05 には無い）',
  (hwtest.k('g_c1')::jsonb->'students'->0->'cells') ? hwtest.k('h_ind') and not (hwtest.k('g_c1')::jsonb->'students'->1->'cells') ? hwtest.k('h_ind') and not (hwtest.k('g_c1')::jsonb->'students'->4->'cells') ? hwtest.k('h_ind'), null);
select hwtest.t('3.マス目', '全マスの pct・status が、hw_t_detail と同じ（C1：クラス宛て 3件 × 5人 ＋ 個人宛て 1件 × 1人）',
  (select count(*) from jsonb_array_elements(hwtest.k('g_c1')::jsonb->'students') s, jsonb_each(s->'cells') c where c.key in (hwtest.k('h_main'), hwtest.k('h_ended'), hwtest.k('h_min'), hwtest.k('h_ind'))) = 3 * 5 + 1
  and not exists (
    select 1 from jsonb_array_elements(hwtest.k('g_c1')::jsonb->'students') s, jsonb_each(s->'cells') c,
      lateral (select hwtest.k(d)::jsonb->'students' as ss from (values ('d_main', hwtest.k('h_main')), ('d_ended', hwtest.k('h_ended')), ('d_min', hwtest.k('h_min')), ('d_ind', hwtest.k('h_ind'))) q(d, hid) where hid = c.key) z,
      lateral (select x from jsonb_array_elements(z.ss) x where x->>'id' = s->>'id') w
    where (w.x->>'status') <> (c.value->>'status') or (w.x->>'pct')::numeric <> (c.value->>'pct')::numeric), null);
select hwtest.t('3.マス目', 'クラス C2 のマス目：h_c2 と、s11 への h_ind（s11 だけにマス）', (select array_agg(h->>'id' order by h->>'id') from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c2')))->'hws') h where h->>'id' in (hwtest.k('h_c2'), hwtest.k('h_ind'), hwtest.k('h_main')))
  = (select array_agg(x order by x) from unnest(array[hwtest.k('h_c2'), hwtest.k('h_ind')]) x), null);
select hwtest.t('3.マス目', 'p_from / p_to：期間が範囲にかかる宿題だけ（h_ended は T-10〜T-5）',
  (select array_agg(h->>'id') from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1'), 'p_from', hwtest.today() - 3))->'hws') h where h->>'id' in (hwtest.k('h_ended'), hwtest.k('h_main'))) = array[hwtest.k('h_main')]
  and (select array_agg(h->>'id') from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1'), 'p_to', hwtest.today() - 6))->'hws') h where h->>'id' in (hwtest.k('h_ended'), hwtest.k('h_main'))) = array[hwtest.k('h_ended')], null);

-- 本名が出ない：どの返りにも、name_enc の中身（SECRET-NAME-…）が入っていない。生徒の login は先生にだけ（詳細）。生徒の画面には、ほかの子の情報が出ない
select hwtest.t('3.本名', '先生・管理者の返り（一覧・詳細・マス目）に、本名（name_enc）が 1つも出ない',
  not (hwtest.k('l2_t1') || hwtest.k('d_main') || hwtest.k('d_ended') || hwtest.k('d_min') || hwtest.k('d_ind') || hwtest.k('g_c1') || hwtest.c('hw_t_grid', hwtest.k('tok_adm'), jsonb_build_object('p_class', hwtest.k('c1')))::text || hwtest.c('hw_t_list', hwtest.k('tok_adm'), '{"p_limit":200}')::text) like '%SECRET%', null);
select hwtest.t('3.本名', '生徒の返り（hw_s_list）に、本名・ほかの生徒の情報が出ない', not (hwtest.c('hw_s_list', hwtest.k('tok_s01'))::text || hwtest.c('hw_s_list', hwtest.k('tok_s11'))::text) ~ 'SECRET|login|nick|ニック', null);
select hwtest.t('3.本名', 'マス目には login が出ない（番号とニックネームだけ）。詳細には login が出る（先生だけ）', not hwtest.k('g_c1') like '%"login"%' and hwtest.k('d_main') like '%"login"%', null);

-- 生徒の画面と同じ道（state_push）で、学習の記録を送ると、先生の画面に反映される
select hwtest.t('3.state_push', '生徒 s02 が state_push で 5問を送ると、h_main の s02 が 5/5 で達成（クライアントと同じ経路）',
  (select (hwtest.c('state_push', hwtest.k('tok_s02'), jsonb_build_object('p_state', jsonb_build_object('log', hwtest.logs('J1-u1', 5, hwtest.today(), 5), 'daily', '{}'::jsonb), 'p_summary', jsonb_build_object('n', 5), 'p_base', 1)))->>'ok' = 'true')
    and (select s->>'status' from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_main')))->'students') s where s->>'login' = 's02') = 'done', null);
select hwtest.setstate(hwtest.uid(1002),
  jsonb_build_object('log', hwtest.logs('J1-u1', 2, hwtest.today() - 1) || hwtest.logs('J1-u1', 1, hwtest.today() - 7),
                     'daily', jsonb_build_object(hwtest.today()::text, jsonb_build_object('n', 1, 'c', 1, 'xp', 0, 'sec', 300)), 'v', 1));        -- もとにもどす

-- 個人宛てで、複数のクラスの生徒がまざる宿題（管理者が C1 の s01 と C3 の s21 に出した）：先生には、自分のクラスの生徒だけ見せる
select hwtest.setk('mix_t1', hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_adm_mix')))::text),
       hwtest.setk('mix_t2', hwtest.c('hw_t_detail', hwtest.k('tok_t2'), jsonb_build_object('p_id', hwtest.k('h_adm_mix')))::text),
       hwtest.setk('mix_adm', hwtest.c('hw_t_detail', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.k('h_adm_mix')))::text);
select hwtest.t('3.集計', '複数クラスにまたがる個人宛て：t1 には s01 だけ・t2 には s21 だけ・管理者には 2人（詳細の生徒と total）',
  (select array_agg(s->>'login') from jsonb_array_elements(hwtest.k('mix_t1')::jsonb->'students') s) = array['s01'] and (hwtest.k('mix_t1')::jsonb->'hw'->>'total')::int = 1
  and (select array_agg(s->>'login') from jsonb_array_elements(hwtest.k('mix_t2')::jsonb->'students') s) = array['s21'] and (hwtest.k('mix_t2')::jsonb->'hw'->>'total')::int = 1
  and (select array_agg(s->>'login' order by s->>'login') from jsonb_array_elements(hwtest.k('mix_adm')::jsonb->'students') s) = array['s01', 's21'] and (hwtest.k('mix_adm')::jsonb->'hw'->>'total')::int = 2,
  hwtest.k('mix_t1') || hwtest.k('mix_t2'));
select hwtest.t('3.集計', '複数クラスにまたがる個人宛て：一覧の total も同じ（t1：1・t2：1・管理者：2）',
  (select (i->>'total')::int from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":200}')->'items') i where i->>'id' = hwtest.k('h_adm_mix')) = 1
  and (select (i->>'total')::int from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_t2'), '{"p_limit":200}')->'items') i where i->>'id' = hwtest.k('h_adm_mix')) = 1
  and (select (i->>'total')::int from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_adm'), '{"p_limit":200}')->'items') i where i->>'id' = hwtest.k('h_adm_mix')) = 2, null);
select hwtest.t('3.集計', '複数クラスにまたがる個人宛て：t1 のマス目（C1）には s01 だけ、t2 のマス目（C3）には s21 だけ。担当外の先生 t3 は詳細を見られない',
  (select count(*) from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1')))->'students') s where s->'cells' ? hwtest.k('h_adm_mix')) = 1
  and (select count(*) from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t2'), jsonb_build_object('p_class', hwtest.k('c3')))->'students') s where s->'cells' ? hwtest.k('h_adm_mix')) = 1
  and hwtest.c('hw_t_detail', hwtest.k('tok_t3'), jsonb_build_object('p_id', hwtest.k('h_adm_mix')))->>'error' = 'forbidden', null);

-- ═══════════════ 4. 入力の検証と上限 ═══════════════
create function hwtest.base() returns jsonb language sql stable as $f$
  select hwtest.ca(p_class => hwtest.k('c1'), p_title => 'V:x', p_unit => 'J1-u1', p_n => 10, p_min => null) $f$;
select hwtest.t('4.入力の検証', 'bad_args：' || lbl,
  hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.base() || patch)->>'error' = 'bad_args', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.base() || patch)::text)
from (values
  ('n=0', '{"p_n":0}'::jsonb), ('n=-1', '{"p_n":-1}'), ('n=201', '{"p_n":201}'), ('n=100000', '{"p_n":100000}'),
  ('min=0（n なし・単元なし）', '{"p_unit":null,"p_n":null,"p_min":0}'), ('min=-5', '{"p_unit":null,"p_n":null,"p_min":-5}'), ('min=241', '{"p_unit":null,"p_n":null,"p_min":241}'),
  ('n は正しいが min=241', '{"p_min":241}'), ('n=5 だが 単元なし', '{"p_unit":null,"p_n":5}'), ('単元ありで n なし（min だけ）', '{"p_n":null,"p_min":5}'),
  ('n も min もない', '{"p_unit":null,"p_n":null,"p_min":null}'), ('単元ありで n も min もない', '{"p_n":null,"p_min":null}'),
  ('単元 ID：空白をふくむ', '{"p_unit":"J1 u1"}'), ('単元 ID：日本語', '{"p_unit":"単元"}'), ('単元 ID：先頭が -', '{"p_unit":"-abc"}'), ('単元 ID：先頭が .', '{"p_unit":".abc"}'),
  ('単元 ID：41字', jsonb_build_object('p_unit', repeat('a', 41))), ('単元 ID：空文字（n あり）', '{"p_unit":""}'), ('単元 ID：引用符', '{"p_unit":"a''b"}'),
  ('期限が開始より前', jsonb_build_object('p_start', hwtest.today(), 'p_due', hwtest.today() - 1)), ('期限なし（null）', '{"p_due":null}'),
  ('期間が 61日', jsonb_build_object('p_start', hwtest.today(), 'p_due', hwtest.today() + 60)),
  ('開始が 366日前', jsonb_build_object('p_start', hwtest.today() - 366, 'p_due', hwtest.today() - 364)),
  ('開始が 366日先', jsonb_build_object('p_start', hwtest.today() + 366, 'p_due', hwtest.today() + 368)),
  ('クラスと個人の両方', jsonb_build_object('p_users', jsonb_build_array(hwtest.uid(1001)))), ('クラスも個人も無い', '{"p_class":null}'),
  ('個人宛てで、空の配列', '{"p_class":null,"p_users":[]}'), ('個人宛てで、null がまざる', jsonb_build_object('p_class', null, 'p_users', jsonb_build_array(hwtest.uid(1001), null))),
  ('個人宛てが 501人', jsonb_build_object('p_class', null, 'p_users', (select jsonb_agg(gen_random_uuid()) from generate_series(1, 501)))),
  ('題が 101字', jsonb_build_object('p_title', repeat('a', 101))), ('題が 101字（日本語）', jsonb_build_object('p_title', repeat('あ', 101))),
  ('題に制御文字', jsonb_build_object('p_title', 'a' || chr(1) || 'b')), ('題に改行', jsonb_build_object('p_title', E'a\nb')), ('題にタブ', jsonb_build_object('p_title', E'a\tb')),
  ('ひとことが 201字', jsonb_build_object('p_note', repeat('x', 201))), ('ひとことが 201字（日本語）', jsonb_build_object('p_note', repeat('ひ', 201))),
  ('ひとことに制御文字（ベル）', jsonb_build_object('p_note', 'a' || chr(7) || 'b'))
) v(lbl, patch);
select hwtest.t('4.入力の検証', 'bad_args のとき、何も作られない（V:x の行が 0）', (select count(*) from kotsu.homework where title = 'V:x') = 0, null);
-- 通るもの（境界）。作って、行の値も確かめる
create table hwtest.okcase (lbl text, patch jsonb, chk text);
insert into hwtest.okcase values
  ('n=1', '{"p_n":1}', 'n = 1'), ('n=200', '{"p_n":200}', 'n = 200'),
  ('n と min の両方', '{"p_n":10,"p_min":240}', 'n = 10 and min = 240'),
  ('min=1 だけ（単元なし）', '{"p_unit":null,"p_n":null,"p_min":1}', 'unit_id is null and n is null and min = 1'),
  ('min=240 だけ', '{"p_unit":null,"p_n":null,"p_min":240}', 'min = 240'),
  ('単元 ID：_ . - をふくむ・40字', jsonb_build_object('p_unit', 'J2.g2_c1-' || repeat('u', 31)), 'length(unit_id) = 40'),
  ('単元 ID：前後の空白は取る', '{"p_unit":"  J1-u2  "}', 'unit_id = ''J1-u2'''),
  ('単元 ID：空文字で min だけ', '{"p_unit":"","p_n":null,"p_min":5}', 'unit_id is null and n is null'),
  ('期間 ちょうど 60日（今日〜+59日）', jsonb_build_object('p_start', hwtest.today(), 'p_due', hwtest.today() + 59), 'due_date - start_date = 59'),
  ('開始が 365日前', jsonb_build_object('p_start', hwtest.today() - 365, 'p_due', hwtest.today() - 363), 'start_date = (now() at time zone ''Asia/Tokyo'')::date - 365'),
  ('開始が 365日先', jsonb_build_object('p_start', hwtest.today() + 365, 'p_due', hwtest.today() + 367), 'true'),
  ('開始が null → 今日', jsonb_build_object('p_start', null, 'p_due', hwtest.today() + 1), 'start_date = (now() at time zone ''Asia/Tokyo'')::date'),
  ('開始＝期限（1日だけ）', jsonb_build_object('p_start', hwtest.today(), 'p_due', hwtest.today()), 'start_date = due_date'),
  ('題が 100字', jsonb_build_object('p_title', repeat('a', 100)), 'char_length(title) = 100'),
  ('題が 100字（日本語）', jsonb_build_object('p_title', repeat('あ', 100)), 'char_length(title) = 100'),
  ('題の前後の空白は取る', jsonb_build_object('p_title', '   余白あり   '), 'title = ''余白あり'''),
  ('ひとことが 200字', jsonb_build_object('p_note', repeat('x', 200)), 'char_length(note) = 200'),
  ('ひとことが 200字（日本語）', jsonb_build_object('p_note', repeat('ひ', 200)), 'char_length(note) = 200'),
  ('ひとことが空白だけ → null', jsonb_build_object('p_note', '    '), 'note is null'),
  ('ひとことに改行・タブはよい', jsonb_build_object('p_note', E'1行目\n\t2行目'), 'position(chr(10) in note) > 0'),
  ('ひとことに絵文字・記号・引用符', jsonb_build_object('p_note', '😀 "かぎ" ''しゃ'' <b>x</b> \ %s'), 'note like ''%<b>x</b>%'''),
  ('個人宛て：同じ生徒を 2回 → 1人にまとめる', jsonb_build_object('p_class', null, 'p_users', jsonb_build_array(hwtest.uid(1001), hwtest.uid(1001), hwtest.uid(1002))), 'cardinality(user_ids) = 2 and class_id is null');
select hwtest.t('4.入力の検証', 'ok：' || o.lbl,
  coalesce((r->>'ok')::boolean, false) and hwtest.rowchk(r->>'id', o.chk),
  r::text || ' / ' || o.chk)
from hwtest.okcase o, lateral (select hwtest.c('hw_t_create', hwtest.k('tok_t1'), (hwtest.base() || o.patch)) as r) x;
select hwtest.t('4.入力の検証', '「開始 365日前」の行は、start_date が今日から 365日前', (select count(*) from kotsu.homework where start_date = hwtest.today() - 365) = 1, null);
-- 題が空 → 自動で作る
select hwtest.t('4.入力の検証', '題が空：' || lbl || ' → 「' || want || '」', hwtest.rowchk(x.r->>'id', 'title = ' || quote_literal(want)), x.r::text)
from (values ('単元＋n', '{"p_title":""}'::jsonb, 'J1-u1 10問'), ('単元＋n＋min', '{"p_title":null,"p_min":20}', 'J1-u1 10問・20分'),
             ('min だけ', '{"p_title":"   ","p_unit":null,"p_n":null,"p_min":30}', '30分 学習')) v(lbl, patch, want),
  lateral (select hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.base() || v.patch) as r) x;
-- 作る側の返りと、DB の制約（直接入れても守られる）
select hwtest.t('4.制約（DB）', format('テーブルの制約：%s', lbl), hwtest.denied_by_check(sql), sql)
from (values
  ('n も min もない', 'insert into kotsu.homework (org_id, class_id, title, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', current_date, current_date)'),
  ('単元なしの n', 'insert into kotsu.homework (org_id, class_id, title, n, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', 3, current_date, current_date)'),
  ('単元ありで n なし', 'insert into kotsu.homework (org_id, class_id, title, unit_id, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', ''J1-u1'', 5, current_date, current_date)'),
  ('n=201', 'insert into kotsu.homework (org_id, class_id, title, unit_id, n, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', ''J1-u1'', 201, current_date, current_date)'),
  ('min=241', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', 241, current_date, current_date)'),
  ('期間が 61日', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', 5, current_date, current_date + 60)'),
  ('開始が期限より後', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', 5, current_date, current_date - 1)'),
  ('クラスも個人もない', 'insert into kotsu.homework (org_id, title, min, start_date, due_date) values (hwtest.uid(1), ''x'', 5, current_date, current_date)'),
  ('クラスと個人の両方', 'insert into kotsu.homework (org_id, class_id, user_ids, title, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), array[hwtest.uid(1001)], ''x'', 5, current_date, current_date)'),
  ('個人宛てが空の配列', 'insert into kotsu.homework (org_id, user_ids, title, min, start_date, due_date) values (hwtest.uid(1), ''{}'', ''x'', 5, current_date, current_date)'),
  ('題が空', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), '''', 5, current_date, current_date)'),
  ('題が 101字', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), repeat(''a'', 101), 5, current_date, current_date)'),
  ('ひとことが 201字', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date, note) values (hwtest.uid(1), hwtest.uid(101), ''x'', 5, current_date, current_date, repeat(''a'', 201))'),
  ('単元 ID の形', 'insert into kotsu.homework (org_id, class_id, title, unit_id, n, start_date, due_date) values (hwtest.uid(1), hwtest.uid(101), ''x'', ''a b'', 5, current_date, current_date)'),
  ('存在しない学校', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (gen_random_uuid(), hwtest.uid(101), ''x'', 5, current_date, current_date)'),
  ('存在しないクラス', 'insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date) values (hwtest.uid(1), gen_random_uuid(), ''x'', 5, current_date, current_date)')
) v(lbl, sql);

-- 1日に出せるのは 60件（1人の先生）
do $$ declare i integer; r jsonb;
begin
  for i in 1 .. 60 loop
    r := hwtest.c('hw_t_create', hwtest.k('tok_t4'), hwtest.ca(p_class => hwtest.k('c5'), p_title => 'R:' || i));
    if r->>'ok' is distinct from 'true' then perform hwtest.t('4.上限', '1日 60件：' || i || '件目まで出せる', false, r::text); return; end if;
  end loop;
  perform hwtest.t('4.上限', '1日 60件：60件目まで出せる', true);
end $$;
select hwtest.e('4.上限', '1日 60件：61件目は hw_limit', hwtest.c('hw_t_create', hwtest.k('tok_t4'), hwtest.ca(p_class => hwtest.k('c5'), p_title => 'R:61')), 'hw_limit');
select hwtest.t('4.上限', '1日 60件：61件目は作られない（60件のまま）', (select count(*) from kotsu.homework where created_by = hwtest.uid(15)) = 60, null);
select hwtest.ok('4.上限', '1日 60件：ほかの先生（t2）には影響しない', hwtest.c('hw_t_create', hwtest.k('tok_t2'), hwtest.ca(p_class => hwtest.k('c3'), p_title => 'T:t2-extra')));
select hwtest.ok('4.上限', '1日 60件：管理者にも影響しない', hwtest.c('hw_t_create', hwtest.k('tok_adm'), hwtest.ca(p_class => hwtest.k('c5'), p_title => 'T:adm-extra')));
update kotsu.homework set created_at = now() - interval '25 hours' where created_by = hwtest.uid(15);
select hwtest.ok('4.上限', '1日 60件：24時間より前に出した分は数えない（また出せる）', hwtest.c('hw_t_create', hwtest.k('tok_t4'), hwtest.ca(p_class => hwtest.k('c5'), p_title => 'R:after')));
-- 学校ごとの総数の上限（20000件）：学校 B に 20000件を直接入れて、出そうとする
insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date)
select hwtest.uid(2), hwtest.uid(201), 'FULL:' || g, 5, current_date, current_date + 1 from generate_series(1, 20000) g;
select hwtest.e('4.上限', '学校の宿題が 20000件になっていると、出せない（full）', hwtest.c('hw_t_create', hwtest.k('tok_bt1'), hwtest.ca(p_class => hwtest.k('cb1'))), 'full');
select hwtest.ok('4.上限', '学校 A（件数が少ない）は、影響なし', hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c1'), p_title => 'T:after-full')));
delete from kotsu.homework where title like 'FULL:%';
select hwtest.ok('4.上限', '20000件をもどすと、また出せる', hwtest.c('hw_t_create', hwtest.k('tok_bt1'), hwtest.ca(p_class => hwtest.k('cb1'), p_title => 'T:b2')));

-- ═══════════════ 5. 生徒の一覧（hw_s_list）：その生徒の分だけ。closed と、期限から 14日をすぎたものは出ない ═══════════════
insert into kotsu.homework (id, org_id, class_id, title, min, start_date, due_date, closed) values
  (hwtest.uid(5001), hwtest.uid(1), hwtest.uid(102), 'S:c2-14',     5, hwtest.today() - 20, hwtest.today() - 14, false),   -- 期限がちょうど 14日前 → 出る
  (hwtest.uid(5002), hwtest.uid(1), hwtest.uid(102), 'S:c2-15',     5, hwtest.today() - 20, hwtest.today() - 15, false),   -- 15日前 → 出ない
  (hwtest.uid(5003), hwtest.uid(1), hwtest.uid(102), 'S:c2-future', 5, hwtest.today() + 5,  hwtest.today() + 8,  false),   -- まだ先（期間前）→ 出る
  (hwtest.uid(5004), hwtest.uid(1), hwtest.uid(102), 'S:c2-closed', 5, hwtest.today() - 1,  hwtest.today() + 3,  true),    -- 締めた → 出ない
  (hwtest.uid(5005), hwtest.uid(1), hwtest.uid(103), 'S:c3-other',  5, hwtest.today() - 1,  hwtest.today() + 3,  false);   -- C3 宛て
select hwtest.setk('s_s11', hwtest.c('hw_s_list', hwtest.k('tok_s11'))::text), hwtest.setk('s_s01', hwtest.c('hw_s_list', hwtest.k('tok_s01'))::text),
       hwtest.setk('s_s02', hwtest.c('hw_s_list', hwtest.k('tok_s02'))::text), hwtest.setk('s_s13', hwtest.c('hw_s_list', hwtest.k('tok_s13'))::text),
       hwtest.setk('s_s21', hwtest.c('hw_s_list', hwtest.k('tok_s21'))::text), hwtest.setk('s_s90', hwtest.c('hw_s_list', hwtest.k('tok_s90'))::text),
       hwtest.setk('s_bs1', hwtest.c('hw_s_list', hwtest.k('tok_bs1'))::text);
select hwtest.t('5.生徒の一覧', 's11（C2・h_ind の対象）：C2 宛て（T:c2・期限 14日前ちょうど・まだ先）＋個人宛て T:ind。15日前・締めた・C3 宛ては出ない',
  hwtest.titles(hwtest.k('s_s11')::jsonb) = array['S:c2-14', 'S:c2-future', 'T:c2', 'T:ind'], hwtest.k('s_s11'));
select hwtest.t('5.生徒の一覧', 's13（C2）：個人宛て（s01・s11 だけ）は出ない', hwtest.titles(hwtest.k('s_s13')::jsonb) = array['S:c2-14', 'S:c2-future', 'T:c2'], hwtest.k('s_s13'));
select hwtest.t('5.生徒の一覧', 's01（C1）：C1 宛て＋個人宛て T:ind。C2・C3 のものは出ない',
  hwtest.titles(hwtest.k('s_s01')::jsonb) @> array['T:main', 'T:ended', 'T:min', 'T:ind'] and not hwtest.titles(hwtest.k('s_s01')::jsonb) && array['T:c2', 'S:c2-14', 'T:c3', 'T:b', 'T:adm-c3', 'S:c3-other'], hwtest.k('s_s01'));
select hwtest.t('5.生徒の一覧', 's02（C1）：個人宛て T:ind（s01・s11 宛て）は出ない', hwtest.titles(hwtest.k('s_s02')::jsonb) @> array['T:main', 'T:ended', 'T:min'] and not 'T:ind' = any(hwtest.titles(hwtest.k('s_s02')::jsonb)), hwtest.k('s_s02'));
select hwtest.t('5.生徒の一覧', 's21（C3）：C3 宛て（先生・管理者が出した）＋個人宛て（管理者が出した T:adm-s21）', hwtest.titles(hwtest.k('s_s21')::jsonb) @> array['T:c3', 'T:adm-c3', 'T:adm-s21', 'S:c3-other'] and not 'T:main' = any(hwtest.titles(hwtest.k('s_s21')::jsonb)), hwtest.k('s_s21'));
select hwtest.t('5.生徒の一覧', 's90（クラスに入っていない）：個人宛てだけ（T:adm-s90）', hwtest.titles(hwtest.k('s_s90')::jsonb) = array['T:adm-s90'], hwtest.k('s_s90'));
select hwtest.t('5.生徒の一覧', 'ほかの学校の生徒 bs1：自分の学校の分だけ（T:b）。学校 A のものは出ない', hwtest.titles(hwtest.k('s_bs1')::jsonb) @> array['T:b'] and not hwtest.titles(hwtest.k('s_bs1')::jsonb) && array['T:main', 'T:c2', 'T:c3'], hwtest.k('s_bs1'));
select hwtest.t('5.生徒の一覧', '返りは {ok, items}。項目は 契約どおり（id,title,unit_id,n,min,start_date,due_date,note,created_at,closed）だけ。進み具合・クラス・先生の情報は無い',
  hwtest.keys(hwtest.k('s_s01')::jsonb) = 'items,ok' and hwtest.keys(hwtest.k('s_s01')::jsonb->'items'->0) = 'closed,created_at,due_date,id,min,n,note,start_date,title,unit_id' and not hwtest.k('s_s01') ~ 'count|pct|status|class|created_by|user_ids', hwtest.keys(hwtest.k('s_s01')::jsonb->'items'->0));
select hwtest.t('5.生徒の一覧', 'items は 期限の近い順（due_date 昇順）', (select array_agg((i->>'due_date')::date order by ord) = array_agg((i->>'due_date')::date order by (i->>'due_date')::date, ord)
  from jsonb_array_elements(hwtest.k('s_s01')::jsonb->'items') with ordinality t(i, ord)), null);
select hwtest.t('5.生徒の一覧', '期限がちょうど 14日前の宿題は出る・15日前は出ない（境界）', 'S:c2-14' = any(hwtest.titles(hwtest.k('s_s11')::jsonb)) and not 'S:c2-15' = any(hwtest.titles(hwtest.k('s_s11')::jsonb)), null);
-- 大量（クラス C4 に 120件）：生徒の一覧は 50件まで（期限の遅いほうを残す）。先生のマス目は 40件まで（開始日の新しいほう）・古い順
insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date, created_at)
select hwtest.uid(1), hwtest.uid(104), 'B:' || lpad(g::text, 3, '0'), 5, hwtest.today() - 100 + g, hwtest.today() - 100 + g + 3, now() - g * interval '1 minute' from generate_series(1, 120) g;
select hwtest.setk('s_s31', hwtest.c('hw_s_list', hwtest.k('tok_s31'))::text), hwtest.setk('g_c4', hwtest.c('hw_t_grid', hwtest.k('tok_t3'), jsonb_build_object('p_class', hwtest.k('c4')))::text);
select hwtest.t('5.大量', '生徒の一覧：C4 宛て 120件のうち、期限が 14日前以降のもの（g=83〜120 の 38件）が、期限順で出る',
  hwtest.titles(hwtest.k('s_s31')::jsonb) = (select array_agg('B:' || lpad(g::text, 3, '0') order by g) from generate_series(83, 120) g), hwtest.k('s_s31'));
select hwtest.t('5.大量', 'マス目：p_limit なしで 40件（いちばん新しい開始日の 40件）。古い順に並ぶ',
  jsonb_array_length(hwtest.k('g_c4')::jsonb->'hws') = 40 and (hwtest.k('g_c4')::jsonb->'hws'->0->>'title') = 'B:081' and (hwtest.k('g_c4')::jsonb->'hws'->39->>'title') = 'B:120', hwtest.k('g_c4')::jsonb->'hws'->0->>'title');
select hwtest.t('5.大量', 'マス目：p_limit=5 は 5件（新しい 5件・古い順）、p_limit=1000 でも 40件まで',
  (select array_agg(h->>'title' order by ord) from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t3'), jsonb_build_object('p_class', hwtest.k('c4'), 'p_limit', 5))->'hws') with ordinality t(h, ord)) = array['B:116','B:117','B:118','B:119','B:120']
  and jsonb_array_length(hwtest.c('hw_t_grid', hwtest.k('tok_t3'), jsonb_build_object('p_class', hwtest.k('c4'), 'p_limit', 1000))->'hws') = 40, null);
insert into kotsu.homework (org_id, class_id, title, min, start_date, due_date)
select hwtest.uid(1), hwtest.uid(104), 'F:' || lpad(g::text, 3, '0'), 5, hwtest.today() + g, hwtest.today() + g + 1 from generate_series(1, 60) g;     -- これから 60件
select hwtest.t('5.大量', '生徒の一覧：50件を超えるときは 50件まで。期限の遅いほうを残す（F:060 は入る）', (select jsonb_array_length(c->'items') = 50 and (c->'items'->49->>'title') = 'F:060' from (select hwtest.c('hw_s_list', hwtest.k('tok_s31')) c) y), null);
delete from kotsu.homework where title like 'F:%' or title like 'B:%';

-- 締める → 出なくなる。再開 → 出る
select hwtest.setk('h_cl', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c1'), p_title => 'T:close-me', p_min => 5)));
select hwtest.t('5.締める', '出した宿題は、生徒に見える（締める前）', 'T:close-me' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s01')))), null);
select hwtest.ok('5.締める', 'hw_t_close（p_closed 省略＝締める）→ {ok:true}', hwtest.c('hw_t_close', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_cl'))));
select hwtest.t('5.締める', '締めたら、生徒に見えない', not 'T:close-me' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s01')))), null);
select hwtest.t('5.締める', '締めたら、先生の一覧には closed:true で残る・マス目には出ない・詳細は見られる',
  (select (i->>'closed')::boolean from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":200}')->'items') i where i->>'id' = hwtest.k('h_cl'))
  and not exists (select 1 from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1')))->'hws') h where h->>'id' = hwtest.k('h_cl'))
  and (hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_cl')))->'hw'->>'closed')::boolean, null);
select hwtest.ok('5.締める', '締めるを 2回（もう締まっている）→ ok（何度でも同じ）', hwtest.c('hw_t_close', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_cl'), 'p_closed', true)));
select hwtest.ok('5.締める', '再開（p_closed=false）→ ok', hwtest.c('hw_t_close', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_cl'), 'p_closed', false)));
select hwtest.t('5.締める', '再開したら、生徒にまた見える・マス目にも戻る',
  'T:close-me' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s01'))))
  and exists (select 1 from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c1')))->'hws') h where h->>'id' = hwtest.k('h_cl')), null);
select hwtest.ok('5.締める', '管理者も、担当でない宿題を締められる', hwtest.c('hw_t_close', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.k('h_c3'))));
select hwtest.ok('5.締める', '（h_c3 をもとにもどす）', hwtest.c('hw_t_close', hwtest.k('tok_t2'), jsonb_build_object('p_id', hwtest.k('h_c3'), 'p_closed', false)));

-- ═══════════════ 6. 消す（hw_t_delete）：作ってから 1日以内、または まだだれも取り組んでいない（count も sec も 0）ものだけ。ほかは not_deletable ═══════════════
-- s11 に、取り組みを入れる：J1-u1 を今日 1問、今日の学習 30秒
select hwtest.setstate(hwtest.uid(1011), jsonb_build_object('log', hwtest.logs('J1-u1', 1, hwtest.today()), 'daily', jsonb_build_object(hwtest.today()::text, jsonb_build_object('n', 1, 'c', 1, 'xp', 0, 'sec', 30)), 'v', 1));
select hwtest.setk('d_fresh', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c2'), p_title => 'D:fresh', p_unit => 'J1-u1', p_n => 1, p_min => null)));
select hwtest.setk('d_old_log', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c2'), p_title => 'D:old-log', p_unit => 'J1-u1', p_n => 1, p_min => null)));
select hwtest.setk('d_old_sec', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c2'), p_title => 'D:old-sec', p_min => 5)));
select hwtest.setk('d_old_idle', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c2'), p_title => 'D:old-idle', p_unit => 'J1-nobody', p_n => 3, p_min => null)));
select hwtest.setk('d_old_future', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.k('c2'), p_title => 'D:old-future', p_unit => 'J1-u1', p_n => 3, p_min => null, p_start => hwtest.today() + 10, p_due => hwtest.today() + 12)));
update kotsu.homework set created_at = now() - interval '25 hours' where id in (hwtest.k('d_old_log')::uuid, hwtest.k('d_old_sec')::uuid, hwtest.k('d_old_idle')::uuid, hwtest.k('d_old_future')::uuid);
select hwtest.ok('6.消す', '出して 1日以内：取り組みがあっても消せる（出したまちがいを直す）', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_fresh'))));
select hwtest.t('6.消す', '消した宿題は、もう無い（行・詳細・一覧・生徒の一覧）', not exists (select 1 from kotsu.homework where id = hwtest.k('d_fresh')::uuid) and hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_fresh')))->>'error' = 'not_found'
  and not 'D:fresh' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s11')))), null);
select hwtest.e('6.消す', '出して 1日より後で、解いた生徒がいる（1問）→ not_deletable', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_old_log'))), 'not_deletable');
select hwtest.e('6.消す', '出して 1日より後で、学習時間だけある（30秒）→ not_deletable', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_old_sec'))), 'not_deletable');
select hwtest.t('6.消す', 'not_deletable のとき、宿題は残る。「締める」は使える', exists (select 1 from kotsu.homework where id = hwtest.k('d_old_log')::uuid) and hwtest.c('hw_t_close', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_old_log')))->>'ok' = 'true', null);
select hwtest.ok('6.消す', '出して 1日より後でも、まだだれも取り組んでいなければ消せる', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_old_idle'))));
select hwtest.ok('6.消す', '期間がまだ先（だれも取り組めない）なら、1日より後でも消せる', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_old_future'))));
select hwtest.e('6.消す', '消した宿題をもう 1度消す → not_found', hwtest.c('hw_t_delete', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('d_old_idle'))), 'not_found');
select hwtest.ok('6.消す', '管理者は、担当でない宿題も消せる（まだ 1日以内の h_adm_c3 を 消す…前に別の宿題で）', hwtest.c('hw_t_delete', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.k('h_adm_s90'))));
select hwtest.t('6.消す', '監査（kotsu.audit）に、出した・消したが残る（本名・生徒の名前は入らない）',
  (select count(*) from kotsu.audit where action = 'hw_create' and org_id = hwtest.uid(1)) >= 20 and exists (select 1 from kotsu.audit where action = 'hw_delete' and target = hwtest.k('d_fresh') and actor = hwtest.uid(12))
  and not exists (select 1 from kotsu.audit where action like 'hw\_%' and (detail::text like '%SECRET%')), null);

-- ═══════════════ 7. 生徒がクラスを移ったとき・クラスや人が消えたとき ═══════════════
select hwtest.t('7.クラスを移る', '移る前：h_c2（C2 宛て）の対象は s11・s12・s13。s13 の生徒の一覧に T:c2 がある',
  (select array_agg(s->>'login' order by s->>'login') from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_c2')))->'students') s) = array['s11', 's12', 's13']
  and 'T:c2' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s13')))) and not 'T:c3' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s13')))), null);
-- 管理者が s13 を C2 から C3 へ（a_class_students の動きを SQL で：クラスの生徒を、全部消して入れなおす）
select hwtest.members(hwtest.uid(102), array[1011, 1012]);
select hwtest.members(hwtest.uid(103), array[1021, 1022, 1013]);
select hwtest.t('7.クラスを移る', '移ったあと：C2 宛ての宿題の対象から s13 が外れ、C3 宛ての宿題の対象に入る（いまのクラス所属で判定）',
  (select array_agg(s->>'login' order by s->>'login') from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_c2')))->'students') s) = array['s11', 's12']
  and (select array_agg(s->>'login' order by s->>'login') from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_t2'), jsonb_build_object('p_id', hwtest.k('h_c3')))->'students') s) = array['s13', 's21', 's22'], null);
select hwtest.t('7.クラスを移る', '移ったあと：s13 の生徒の一覧は C3 宛て（T:c3・T:adm-c3）になり、C2 宛て（T:c2）は消える', hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s13'))) @> array['T:c3', 'T:adm-c3'] and not 'T:c2' = any(hwtest.titles(hwtest.c('hw_s_list', hwtest.k('tok_s13')))), null);
select hwtest.t('7.クラスを移る', '移ったあと：一覧の人数（total）も変わる（h_c2：2人、h_c3：3人）',
  (select (i->>'total')::int from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_t1'), '{"p_limit":200}')->'items') i where i->>'id' = hwtest.k('h_c2')) = 2
  and (select (i->>'total')::int from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_t2'), '{"p_limit":200}')->'items') i where i->>'id' = hwtest.k('h_c3')) = 3, null);
select hwtest.t('7.クラスを移る', '移ったあと：マス目は、いまのクラスの生徒だけ（C3 のマスに s13 が出席番号 3 で入る。C2 のマスから s13 は消える）',
  (select array_agg(s->>'nick' order by (s->>'no')::int) from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t2'), jsonb_build_object('p_class', hwtest.k('c3')))->'students') s) = array['ニック21', 'ニック22', 'ニック13']
  and not exists (select 1 from jsonb_array_elements(hwtest.c('hw_t_grid', hwtest.k('tok_t1'), jsonb_build_object('p_class', hwtest.k('c2')))->'students') s where s->>'nick' = 'ニック13'), null);
select hwtest.e('7.クラスを移る', '移ったあと：t1 は s13（もう C2 でない）に個人宛てを出せない → forbidden／t2 は出せる',
  hwtest.c('hw_t_create', hwtest.k('tok_t1'), hwtest.ca(p_users => array[hwtest.uid(1013)::text])), 'forbidden');
select hwtest.ok('7.クラスを移る', '（t2 は s13 に個人宛てを出せる）', hwtest.c('hw_t_create', hwtest.k('tok_t2'), hwtest.ca(p_users => array[hwtest.uid(1013)::text], p_title => 'T:t2-s13')));
select hwtest.t('7.クラスを移る', '個人宛て（h_ind）は、クラスを移っても対象のまま（s11 は C2 のまま）', exists (select 1 from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_ind')))->'students') s where s->>'login' = 's11'), null);
-- もとにもどす
select hwtest.members(hwtest.uid(102), array[1011, 1012, 1013]);
select hwtest.members(hwtest.uid(103), array[1021, 1022]);
select hwtest.t('7.クラスを移る', 'もとにもどすと、対象も もとにもどる', (select array_agg(s->>'login' order by s->>'login') from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_t1'), jsonb_build_object('p_id', hwtest.k('h_c2')))->'students') s) = array['s11', 's12', 's13'], null);

-- クラスが消える（a_class_delete は、宿題があっても失敗しない。宿題も消える）／先生・生徒が消える（宿題は残る）
insert into kotsu.classes (id, org_id, name) values (hwtest.uid(106), hwtest.uid(1), 'CX');
insert into kotsu.class_teachers (class_id, user_id) values (hwtest.uid(106), hwtest.uid(12));
select hwtest.setk('h_cx', hwtest.mk(hwtest.k('tok_t1'), hwtest.ca(p_class => hwtest.uid(106)::text, p_title => 'X:class')));
select hwtest.ok('7.消える', 'a_class_delete：宿題のあるクラスでも消せる（外部キーで失敗しない）', hwtest.c('a_class_delete', hwtest.k('tok_adm'), jsonb_build_object('p_class', hwtest.uid(106))));
select hwtest.t('7.消える', 'クラスを消すと、そのクラス宛ての宿題も消える', not exists (select 1 from kotsu.homework where id = hwtest.k('h_cx')::uuid), null);
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc) values (hwtest.uid(17), hwtest.uid(1), 'teacher', 'tx', hwtest.k('hash'), '去る先生', 'SECRET-NAME-tx'), (hwtest.uid(1099), hwtest.uid(1), 'student', 'sx', hwtest.k('hash'), '去る生徒', 'SECRET-NAME-sx');
insert into kotsu.homework (id, org_id, class_id, title, min, start_date, due_date, created_by) values (hwtest.uid(5101), hwtest.uid(1), hwtest.uid(102), 'X:by-tx', 5, hwtest.today(), hwtest.today() + 1, hwtest.uid(17));
insert into kotsu.homework (id, org_id, user_ids, title, min, start_date, due_date, created_by) values (hwtest.uid(5102), hwtest.uid(1), array[hwtest.uid(1099), hwtest.uid(1001)], 'X:sx', 5, hwtest.today(), hwtest.today() + 1, hwtest.uid(11));
update kotsu.users set active = false where id in (hwtest.uid(17), hwtest.uid(1099));
select hwtest.ok('7.消える', 'a_user_delete：宿題を出した先生を消せる', hwtest.c('a_user_delete', hwtest.k('tok_adm'), jsonb_build_object('p_user', hwtest.uid(17))));
select hwtest.t('7.消える', '先生が消えても、宿題は残る（created_by は null）', (select created_by is null from kotsu.homework where id = hwtest.uid(5101)), null);
select hwtest.ok('7.消える', 'a_user_delete：宿題の対象の生徒を消せる', hwtest.c('a_user_delete', hwtest.k('tok_adm'), jsonb_build_object('p_user', hwtest.uid(1099))));
select hwtest.t('7.消える', '生徒が消えても、個人宛ての宿題は残り、対象は のこりの 1人（s01）だけ', (select array_agg(s->>'login') from jsonb_array_elements(hwtest.c('hw_t_detail', hwtest.k('tok_adm'), jsonb_build_object('p_id', hwtest.uid(5102)))->'students') s) = array['s01'], null);

-- ═══════════════ 8. 何度流しても同じ（hw.sql をもう 1回、トランザクションなしで流す） ═══════════════
create function hwtest.hwsig() returns text language sql stable as $f$
  select md5(
    coalesce((select string_agg(p.oid::regprocedure::text || pg_get_functiondef(p.oid) || coalesce(p.proacl::text, ''), '|' order by p.oid::regprocedure::text)
              from pg_proc p where p.pronamespace = 'kotsu'::regnamespace and (p.proname like 'hw\_%' or p.proname like '\_hw%')), '')
    || coalesce((select string_agg(attname || format_type(atttypid, atttypmod) || attnotnull::text, ',' order by attnum) from pg_attribute where attrelid = 'kotsu.homework'::regclass and attnum > 0 and not attisdropped), '')
    || coalesce((select string_agg(conname || pg_get_constraintdef(oid), ',' order by conname) from pg_constraint where conrelid = 'kotsu.homework'::regclass), '')
    || coalesce((select string_agg(indexdef, ',' order by indexname) from pg_indexes where schemaname = 'kotsu' and tablename = 'homework'), '')
    || (select coalesce(relacl::text, '') || relrowsecurity::text from pg_class where oid = 'kotsu.homework'::regclass)) $f$;
select hwtest.setk('sig1', hwtest.hwsig()), hwtest.setk('rows1', (select md5(coalesce(string_agg(h::text, '|' order by id), '')) from kotsu.homework h)),
       hwtest.setk('funcs1', (select count(*)::text from pg_proc where pronamespace = 'kotsu'::regnamespace)),
       hwtest.setk('cnt1', (select count(*)::text from kotsu.homework));
\i :hw_sql
select hwtest.t('8.冪等', 'hw.sql を もう 1回流すと、関数・表・制約・索引・権限が、まったく同じ（md5 が一致）', hwtest.hwsig() = hwtest.k('sig1'), hwtest.hwsig() || ' vs ' || hwtest.k('sig1'));
select hwtest.t('8.冪等', '宿題の行は、1行も変わらない・増えない（' || hwtest.k('cnt1') || '件）', (select md5(coalesce(string_agg(h::text, '|' order by id), '')) from kotsu.homework h) = hwtest.k('rows1'), null);
select hwtest.t('8.冪等', 'kotsu の関数の数も同じ', (select count(*)::text from pg_proc where pronamespace = 'kotsu'::regnamespace) = hwtest.k('funcs1'), null);
select hwtest.t('8.冪等', '既存の関数・表は、2回流したあとも、hw.sql の前と同じ',
  (select count(*) from hwsnap.funcs s left join hwsnap.funcs_now() n using (sig) where n.d is distinct from s.d or n.a is distinct from s.a) = 0
  and (select count(*) from hwsnap.cols s full join hwsnap.cols_now() n using (relname) where n.m is distinct from s.m) = 0, null);
select hwtest.ok('8.冪等', '2回流したあとも、関数が動く（hw_t_list）', hwtest.c('hw_t_list', hwtest.k('tok_t1')));
select hwtest.t('8.冪等', '2回流したあとも、権限は同じ：anon は表を読めない・内部の関数を呼べない', hwtest.denied('select count(*) from kotsu.homework') and hwtest.denied('select kotsu._hw_item(null::kotsu.homework)'), null);

-- ═══════════════ 9. 規模：200人の学校（40人 × 5クラス）。1クラス 40人 × 宿題 40件 のマス目、学校全体の一覧 ═══════════════
-- 学校 S：管理者 SA、先生 ST（SC1・SC2 担当）、生徒 200人（x001〜x200。SC1〜SC5 に 40人ずつ）。
-- 生徒の記録は、本番の実測（states.state の平均 31KB・最大 143KB、log は最大 400件・daily は 20日ぶんほど）より重め：
--   log 400件（ほぼ 28日ぶん・15単元）＋ daily 30日 ＋ ほかのキー（約 45KB）
insert into kotsu.orgs (id, code, name) values (hwtest.uid(3), 'ORGS', '規模テストの学校');
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc) values
  (hwtest.uid(31), hwtest.uid(3), 'admin', 'sa', hwtest.k('hash'), 'SA', 'SECRET-NAME-sa'), (hwtest.uid(32), hwtest.uid(3), 'teacher', 'st', hwtest.k('hash'), 'ST', 'SECRET-NAME-st');
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick, name_enc)
select hwtest.uid(10000 + n), hwtest.uid(3), 'student', 'x' || lpad(n::text, 3, '0'), hwtest.k('hash'), 'N' || n, 'SECRET-NAME-x' || n from generate_series(1, 200) n;
insert into kotsu.classes (id, org_id, name) select hwtest.uid(300 + c), hwtest.uid(3), 'SC' || c from generate_series(1, 5) c;
insert into kotsu.class_teachers (class_id, user_id) values (hwtest.uid(301), hwtest.uid(32)), (hwtest.uid(302), hwtest.uid(32));
insert into kotsu.class_students (class_id, user_id, no) select hwtest.uid(300 + (n - 1) / 40 + 1), hwtest.uid(10000 + n), (n - 1) % 40 + 1 from generate_series(1, 200) n;
insert into kotsu.states (user_id, state, summary, size)
select u.id, x.st, '{}'::jsonb, octet_length(x.st::text)
from kotsu.users u,
lateral (select substring(u.login_id from 2)::int as n) k,
lateral (select jsonb_build_object(
    'log', (select jsonb_agg(jsonb_build_object('t', (extract(epoch from now()) * 1000)::bigint - g::bigint * 6000000 - (k.n % 7) * 1000, 'u', 'U' || (1 + (g * 3 + k.n) % 15), 'L', 1 + g % 3,
                  'ok', (g + k.n) % 3 <> 0, 'h', false, 'd', 8 + g % 20, 'k', 'item-' || (g % 40)) order by g) from generate_series(1, 400) g),
    'daily', (select jsonb_object_agg(to_char(dd, 'YYYY-MM-DD'), jsonb_build_object('n', 10 + (k.n + i) % 20, 'c', 8 + (k.n + i) % 15, 'xp', 50, 'sec', 300 + ((k.n * 37 + i * 91) % 2100), 'lv', jsonb_build_array(1, 2)))
              from generate_series(0, 29) i, lateral (select (now() at time zone 'Asia/Tokyo')::date - i as dd) q),
    'misc', (select jsonb_object_agg('m' || g, jsonb_build_object('a', g, 'b', repeat('x', 40))) from generate_series(1, 60) g), 'v', 1) as st) x
where u.org_id = hwtest.uid(3) and u.role = 'student';
select hwtest.t('9.規模', '準備：学校 S の生徒 200人・state 200件（平均 ' || (select (avg(size) / 1024)::int from kotsu.states where user_id in (select id from kotsu.users where org_id = hwtest.uid(3))) || ' KB）',
  (select count(*) from kotsu.states where user_id in (select id from kotsu.users where org_id = hwtest.uid(3))) = 200, null);
-- 宿題：SC1 に 40件（60日前から 1日おき・3日間・単元 U1〜U15・n／min／両方）、SC2〜SC5 に 20件ずつ、個人宛て 30件（5人ずつ）
insert into kotsu.homework (org_id, class_id, title, unit_id, n, min, start_date, due_date, created_at)
select hwtest.uid(3), hwtest.uid(300 + c), 'S' || c || ':' || lpad(i::text, 2, '0'),
       case when i % 3 <> 0 or i % 7 = 0 then 'U' || (1 + i % 15) end,
       case when i % 3 <> 0 or i % 7 = 0 then 10 + (i % 4) * 10 end,
       case when i % 3 = 0 or i % 7 = 0 then 10 + (i % 5) * 5 end,
       hwtest.today() - 60 + i, hwtest.today() - 58 + i, now() - (60 - i) * interval '1 day'
from (values (1, 40), (2, 20), (3, 20), (4, 20), (5, 20)) cc(c, cnt), generate_series(1, 40) i where i <= cc.cnt;
insert into kotsu.homework (org_id, user_ids, title, unit_id, n, start_date, due_date, created_at)
select hwtest.uid(3), array(select hwtest.uid(10000 + (i * 7 + j * 13) % 200 + 1) from generate_series(1, 5) j), 'SI:' || lpad(i::text, 2, '0'), 'U' || (1 + i % 15), 20, hwtest.today() - 30 + i, hwtest.today() - 28 + i, now() - (30 - i) * interval '1 day'
from generate_series(1, 30) i;
analyze kotsu.homework; analyze kotsu.states; analyze kotsu.class_students; analyze kotsu.users;
select hwtest.setk('tok_sa', (kotsu.login('ORGS', 'sa', 'pw-test-1234'))->>'token'), hwtest.setk('tok_st', (kotsu.login('ORGS', 'st', 'pw-test-1234'))->>'token'),
       hwtest.setk('tok_x001', (kotsu.login('ORGS', 'x001', 'pw-test-1234'))->>'token');
select hwtest.t('9.規模', '準備：宿題 ' || count(*) || '件（SC1 は 40件）', count(*) = 150, count(*)::text) from kotsu.homework where org_id = hwtest.uid(3);
-- 正しさ（規模のデータで）：マス目の各マスが、詳細と同じ
select hwtest.t('9.規模', 'SC1 のマス目（40人 × 40件）：全マスが hw_t_detail と同じ pct・status',
  (select count(*) from jsonb_array_elements(g->'hws')) = 40 and (select count(*) from jsonb_array_elements(g->'students')) = 40
  and not exists (
    select 1 from jsonb_array_elements(g->'students') s, jsonb_each(s->'cells') c,
      lateral (select hwtest.c('hw_t_detail', hwtest.k('tok_st'), jsonb_build_object('p_id', c.key))->'students' as ss) d,
      lateral (select x from jsonb_array_elements(d.ss) x where x->>'id' = s->>'id') w
    where (w.x->>'status') <> (c.value->>'status') or (w.x->>'pct')::numeric <> (c.value->>'pct')::numeric), null)
from (select hwtest.c('hw_t_grid', hwtest.k('tok_st'), jsonb_build_object('p_class', hwtest.uid(301))) g) y;
select hwtest.t('9.規模', 'SC1 のマス目に、いろいろな状態が混ざっている（達成・一部・まだ がそれぞれ 100マス以上）',
  count(*) filter (where c.value->>'status' = 'done') >= 100 and count(*) filter (where c.value->>'status' = 'partial') >= 100 and count(*) filter (where c.value->>'status' = 'none') >= 100,
  count(*) filter (where c.value->>'status' = 'done') || '/' || count(*) filter (where c.value->>'status' = 'partial') || '/' || count(*) filter (where c.value->>'status' = 'none'))
from (select hwtest.c('hw_t_grid', hwtest.k('tok_st'), jsonb_build_object('p_class', hwtest.uid(301))) g) y, jsonb_array_elements(g->'students') s, jsonb_each(s->'cells') c;
-- 一覧の人数（集合で計算）が、詳細（1組ずつ計算）と同じ：学校 S の宿題 150件すべて
select hwtest.t('9.規模', '学校 S の 150件：一覧の total・done・partial・none・missed が、詳細（hw_t_detail）の集計と全件同じ',
  (select count(*) from jsonb_array_elements(l->'items')) = 150
  and not exists (
    select 1 from jsonb_array_elements(l->'items') i,
      lateral (select hwtest.c('hw_t_detail', hwtest.k('tok_sa'), jsonb_build_object('p_id', i->>'id'))->'hw' as d) x
    where (i->>'total', i->>'done', i->>'partial', i->>'none', i->>'missed') is distinct from (x.d->>'total', x.d->>'done', x.d->>'partial', x.d->>'none', x.d->>'missed')), null)
from (select hwtest.c('hw_t_list', hwtest.k('tok_sa'), '{"p_limit":200}') l) y;
select hwtest.t('9.規模', '学校 S の 150件：個人宛て 30件（5人ずつ）の total が 5', (select count(*) from jsonb_array_elements(hwtest.c('hw_t_list', hwtest.k('tok_sa'), '{"p_limit":200}')->'items') i where i->>'title' like 'SI:%' and (i->>'total')::int = 5) = 30, null);

-- 時間（3回のうち いちばん速い値。PostgREST の anon の statement_timeout は 3秒）
select hwtest.timeit('hw_t_grid  SC1（40人 × 40件）  先生 ST', format('select hwtest.c(%L, %L, %L)', 'hw_t_grid', hwtest.k('tok_st'), jsonb_build_object('p_class', hwtest.uid(301))));
select hwtest.timeit('hw_t_grid  SC1（40人 × 40件）  管理者 SA', format('select hwtest.c(%L, %L, %L)', 'hw_t_grid', hwtest.k('tok_sa'), jsonb_build_object('p_class', hwtest.uid(301))));
select hwtest.timeit('hw_t_list  SC1 を指定（既定の 60件のうち SC1 宛て 40件＋個人宛て）  先生 ST', format('select hwtest.c(%L, %L, %L)', 'hw_t_list', hwtest.k('tok_st'), jsonb_build_object('p_class', hwtest.uid(301))));
select hwtest.timeit('hw_t_list  学校全体（既定 60件。管理者 SA）', format('select hwtest.c(%L, %L)', 'hw_t_list', hwtest.k('tok_sa')));
select hwtest.timeit('hw_t_list  学校全体（p_limit=200 ＝ 150件すべて。管理者 SA）', format('select hwtest.c(%L, %L, %L)', 'hw_t_list', hwtest.k('tok_sa'), '{"p_limit":200}'::jsonb));
select hwtest.timeit('hw_t_list  先生 ST の全体（SC1・SC2 の担当分。既定 60件）', format('select hwtest.c(%L, %L)', 'hw_t_list', hwtest.k('tok_st')));
select hwtest.timeit('hw_t_detail 1件（SC1 の宿題・40人）', format('select hwtest.c(%L, %L, %L)', 'hw_t_detail', hwtest.k('tok_st'), jsonb_build_object('p_id', (select id from kotsu.homework where title = 'S1:20'))));
select hwtest.timeit('hw_s_list 生徒 1人', format('select hwtest.c(%L, %L)', 'hw_s_list', hwtest.k('tok_x001')));
select hwtest.timeit('hw_t_create 1件（クラス宛て）', format('select hwtest.c(%L, %L, %L)', 'hw_t_create', hwtest.k('tok_st'), hwtest.ca(p_class => hwtest.uid(301)::text, p_title => 'P:perf', p_min => 5)));
select hwtest.timeit('hw_t_close 1件', format('select hwtest.c(%L, %L, %L)', 'hw_t_close', hwtest.k('tok_st'), jsonb_build_object('p_id', (select id from kotsu.homework where title = 'S1:20'))));
select hwtest.timeit('_hw_progress 1回（log 400件・daily 30日の state ＋ 宿題 1件）', 'select kotsu._hw_progress(h, s.state) from kotsu.homework h, kotsu.states s where h.title = ''S1:20'' and s.user_id = ' || quote_literal(hwtest.uid(10001)::text) || '::uuid', 10);
select hwtest.t('9.規模', '時間：SC1 のマス目（40×40）が 1.0秒未満（本番の anon の statement_timeout は 3秒。本番のほうが遅いかもしれないので、余裕をみる）', (select ms from hwtest.perf where name like 'hw_t_grid  SC1%先生%') < 1000, (select ms::text from hwtest.perf where name like 'hw_t_grid  SC1%先生%'));
select hwtest.t('9.規模', '時間：学校全体の一覧（既定 60件）が 1.0秒未満', (select ms from hwtest.perf where name like 'hw_t_list  学校全体（既定%') < 1000, (select ms::text from hwtest.perf where name like 'hw_t_list  学校全体（既定%'));
select hwtest.t('9.規模', '時間：p_limit=200（150件すべて）の一覧が 2.0秒未満', (select ms from hwtest.perf where name like 'hw_t_list  学校全体（p_limit=200%') < 2000, (select ms::text from hwtest.perf where name like 'hw_t_list  学校全体（p_limit=200%'));
select hwtest.t('9.規模', '時間：詳細・生徒の一覧・出す・締めるは、それぞれ 0.5秒未満', (select max(ms) from hwtest.perf where name like 'hw_t_detail%' or name like 'hw_s_list%' or name like 'hw_t_create%' or name like 'hw_t_close%') < 500, (select max(ms)::text from hwtest.perf where name like 'hw_t_detail%' or name like 'hw_s_list%' or name like 'hw_t_create%' or name like 'hw_t_close%'));
-- 本番の anon と同じ statement_timeout = 3秒（トップレベルの文として）で、止まらずに終わる
select hwtest.k('tok_st') as tok_st, hwtest.uid(301)::text as sc1, hwtest.k('tok_sa') as tok_sa \gset
set role anon;
set statement_timeout = '3s';
select jsonb_array_length(kotsu.hw_t_grid(:'tok_st', :'sc1'::uuid)->'hws') as "grid(anon・3秒制限)の宿題数";
select jsonb_array_length(kotsu.hw_t_list(:'tok_sa', null, 200)->'items') as "list(anon・3秒制限・150件)の件数";
reset statement_timeout;
reset role;
select hwtest.t('9.規模', 'anon の 3秒制限のままで、マス目（40×40）と一覧（150件）が止まらずに返った', true, null);

-- ═══════════════ 9b. 集合で計算する _hw_stats（一覧・マス目が使う）を、基準の実装（progress.mjs の expect）と照合 ═══════════════
-- 検算データ 10件とランダム 2000件のうち、表の制約に合うもの（unit と n が組・n か min がある）を、1人 1件の個人宛てにして、まとめて計算する。
insert into kotsu.orgs (id, code, name) values (hwtest.uid(4), 'ORGV', '照合用');
create table hwtest.vv as
  select v.seq, v.j from hwtest.vec v
  where ((v.j->'hw'->>'unit_id') is null) = ((v.j->'hw'->>'n') is null) and ((v.j->'hw'->>'n') is not null or (v.j->'hw'->>'min') is not null);
insert into kotsu.users (id, org_id, role, login_id, pass_hash, nick) select hwtest.uid(100000 + seq), hwtest.uid(4), 'student', 'rv' || seq, hwtest.k('hash'), 'rv' from hwtest.vv;
insert into kotsu.states (user_id, state, summary, size) select hwtest.uid(100000 + seq), coalesce(j->'state', 'null'::jsonb), '{}'::jsonb, 0 from hwtest.vv;
insert into kotsu.homework (id, org_id, user_ids, title, unit_id, n, min, start_date, due_date)
select hwtest.uid(200000 + seq), hwtest.uid(4), array[hwtest.uid(100000 + seq)], 'RV' || seq, j->'hw'->>'unit_id', (j->'hw'->>'n')::int, (j->'hw'->>'min')::int, (j->'hw'->>'start_date')::date, (j->'hw'->>'due_date')::date from hwtest.vv;
create table hwtest.vstat as
  select vv.seq, vv.j->>'name' as name, vv.j->'expect' as ex, x.cnt, x.cor, x.sec, x.pct, x.status, x.phase
  from hwtest.vv
  left join kotsu._hw_stats((select array_agg(hwtest.uid(200000 + seq)) from hwtest.vv), to_timestamp(1794970800)) x on x.hw_id = hwtest.uid(200000 + vv.seq);
select hwtest.t('9b.集合の計算', format('対象 %s件（検算データ＋ランダム）すべてに、_hw_stats の結果がある', count(*)), count(*) filter (where cnt is null) = 0, (select string_agg(name, ',') from (select name from hwtest.vstat where cnt is null limit 10) q)) from hwtest.vstat;
select hwtest.t('9b.集合の計算', format('_hw_stats（集合）が、基準の実装と同じ結果：count・correct・sec・pct・status（%s件）', count(*)),
  count(*) filter (where not (cnt = (ex->>'count')::int and cor = (ex->>'correct')::int and sec = (ex->>'sec')::numeric and abs(pct::numeric - (ex->>'pct')::numeric) < 0.0005 and status = ex->>'status')) = 0,
  (select string_agg(name || ' got=' || cnt || '/' || cor || '/' || sec || '/' || pct || '/' || status || ' want=' || (ex->>'count') || '/' || (ex->>'correct') || '/' || (ex->>'sec') || '/' || (ex->>'pct') || '/' || (ex->>'status'), '; ')
   from (select * from hwtest.vstat where not (cnt = (ex->>'count')::int and cor = (ex->>'correct')::int and sec = (ex->>'sec')::numeric and abs(pct::numeric - (ex->>'pct')::numeric) < 0.0005 and status = ex->>'status') limit 5) q))
  from hwtest.vstat;
select hwtest.t('9b.集合の計算', '_hw_stats の phase（p_now＝2026-11-18 11:40 JST 固定）が、期間の前・中・後で正しい', 
  (select count(*) from hwtest.vstat s join kotsu.homework h on h.id = hwtest.uid(200000 + s.seq)
   where s.phase is distinct from case when to_timestamp(1794970800) < (h.start_date::timestamp at time zone 'Asia/Tokyo') then 'upcoming' when to_timestamp(1794970800) >= ((h.due_date + 1)::timestamp at time zone 'Asia/Tokyo') then 'ended' else 'active' end) = 0, null);
select hwtest.t('9b.集合の計算', '_hw_stats と _hw_progress（1組ずつ）が、同じ結果（count・correct・sec・pct・status・phase）',
  (select count(*) from hwtest.vv v
     join hwtest.vstat s on s.seq = v.seq
     join kotsu.homework h on h.id = hwtest.uid(200000 + v.seq)
     join kotsu.states st on st.user_id = hwtest.uid(100000 + v.seq),
     lateral (select kotsu._hw_progress(h, st.state, to_timestamp(1794970800)) p) x
   where (x.p->>'count')::int <> s.cnt or (x.p->>'correct')::int <> s.cor or (x.p->>'sec')::numeric <> s.sec or abs((x.p->>'pct')::numeric - s.pct::numeric) > 1e-12 or x.p->>'status' <> s.status or x.p->>'phase' <> s.phase) = 0, null);

-- ═══════════════ 9c. ストレス：学年まるごとの 1クラス（200人）× 宿題 60件 ═══════════════
insert into kotsu.classes (id, org_id, name) values (hwtest.uid(306), hwtest.uid(3), 'SC6-学年');
insert into kotsu.class_students (class_id, user_id, no) select hwtest.uid(306), hwtest.uid(10000 + n), n from generate_series(1, 200) n;     -- 生徒は SC1〜SC5 にも入ったまま（複数のクラスに入れる）
insert into kotsu.homework (org_id, class_id, title, unit_id, n, min, start_date, due_date, created_at)
select hwtest.uid(3), hwtest.uid(306), 'G:' || lpad(i::text, 2, '0'), case when i % 3 <> 0 then 'U' || (1 + i % 15) end, case when i % 3 <> 0 then 10 + (i % 4) * 10 end, case when i % 3 = 0 then 15 end,
       hwtest.today() - 40 + i, hwtest.today() - 38 + i, now() - (60 - i) * interval '1 hour'
from generate_series(1, 60) i;
analyze kotsu.homework; analyze kotsu.class_students;
select hwtest.timeit('ストレス：hw_t_grid 200人 × 40件（学年まるごとの 1クラス。管理者 SA）', format('select hwtest.c(%L, %L, %L)', 'hw_t_grid', hwtest.k('tok_sa'), jsonb_build_object('p_class', hwtest.uid(306))));
select hwtest.timeit('ストレス：hw_t_list 200人 × 60件（学年まるごとの 1クラス）', format('select hwtest.c(%L, %L, %L)', 'hw_t_list', hwtest.k('tok_sa'), jsonb_build_object('p_class', hwtest.uid(306), 'p_limit', 60)));
select hwtest.timeit('ストレス：hw_t_detail 200人（1件）', format('select hwtest.c(%L, %L, %L)', 'hw_t_detail', hwtest.k('tok_sa'), jsonb_build_object('p_id', (select id from kotsu.homework where title = 'G:30'))));
select hwtest.t('9.規模', 'ストレス：200人 × 40件のマス目が 1.5秒未満', (select ms from hwtest.perf where name like 'ストレス：hw_t_grid%') < 1500, (select ms::text from hwtest.perf where name like 'ストレス：hw_t_grid%'));
select hwtest.t('9.規模', 'ストレス：200人 × 60件の一覧が 2.0秒未満', (select ms from hwtest.perf where name like 'ストレス：hw_t_list%') < 2000, (select ms::text from hwtest.perf where name like 'ストレス：hw_t_list%'));
select hwtest.t('9.規模', 'ストレス：200人のマス目の全マスが、詳細と同じ（先頭の 5宿題）',
  not exists (
    select 1 from jsonb_array_elements(g->'students') s, jsonb_each(s->'cells') c,
      lateral (select c.key as k where c.key in (select h->>'id' from jsonb_array_elements(g->'hws') h limit 5)) z,
      lateral (select hwtest.c('hw_t_detail', hwtest.k('tok_sa'), jsonb_build_object('p_id', z.k))->'students' as ss) d,
      lateral (select x from jsonb_array_elements(d.ss) x where x->>'id' = s->>'id') w
    where (w.x->>'status') <> (c.value->>'status') or (w.x->>'pct')::numeric <> (c.value->>'pct')::numeric)
  and (select count(*) from jsonb_array_elements(g->'students')) = 200, null)
from (select hwtest.c('hw_t_grid', hwtest.k('tok_sa'), jsonb_build_object('p_class', hwtest.uid(306))) g) y;

-- ═══════════════ 結果 ═══════════════
\echo
\echo '════════ 結果（グループごと） ════════'
select grp as "グループ", count(*) as "件数", count(*) filter (where ok) as "通った", count(*) filter (where not ok) as "失敗" from hwtest.res group by grp order by min(seq);
select count(*) as "全件", count(*) filter (where ok) as "通った", count(*) filter (where not ok) as "失敗" from hwtest.res;
\echo '════════ 失敗したもの ════════'
select seq, grp, name, left(detail, 800) as detail from hwtest.res where not ok order by seq;
\echo '════════ 時間（ミリ秒。3回のうち いちばん速い） ════════'
select name, ms, note from hwtest.perf order by seq;
\copy (select seq, grp, name, ok, coalesce(detail, '') from hwtest.res order by seq) to 'work/results.tsv'
select (count(*) filter (where not ok) > 0) as anyfail, count(*) filter (where not ok) as nfail from hwtest.res \gset
\if :anyfail
  \echo 失敗があります（:nfail 件）
  select 1/0;
\endif
\echo '全部通りました'
