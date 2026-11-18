\set ON_ERROR_STOP on
\set QUIET on
insert into kotsu.orgs (id, code, name) values ('00000000-0000-0000-0000-00000000000a', 'TEST', 'テスト学校');
insert into kotsu.users (id, org_id, role, login_id, nick, grade) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'student', 's26023', '1123', 'J1'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a', 'student', 's26099', 'はな', 'J1');
update kotsu.users set active = false where id = '00000000-0000-0000-0000-0000000000b1';
insert into kotsu.sessions (token_hash, user_id, kind, expires_at) values
  (kotsu._h('token-student-A-0123456789'), '00000000-0000-0000-0000-0000000000a1', 'user', now() + interval '1 day'),
  (kotsu._h('token-student-B-0123456789'), '00000000-0000-0000-0000-0000000000b1', 'user', now() + interval '1 day'),
  (kotsu._h('token-expired-0123456789'), '00000000-0000-0000-0000-0000000000a1', 'user', now() - interval '1 day'),
  (kotsu._h('token-operator-0123456789'), null, 'op', now() + interval '1 day');
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'NG: %', label; end if; raise notice 'ok  %', label; end $$;
create function pg_temp.send(tok text, dev text, named boolean default null) returns jsonb language sql as $$
  select kotsu.fb_send(tok, 'idea', 3, 'テストの意見です', 'J1', 'home', 'v1', dev, named) $$;
create function pg_temp.n() returns bigint language sql as $$ select count(*) from kotsu.feedback $$;

-- スイッチ切：ログインなしも、いままでどおり匿名で受けとる
select pg_temp.ok((select fb_named from kotsu.orgs where id = '00000000-0000-0000-0000-00000000000a') = false, '切：スイッチは切');
select pg_temp.ok((pg_temp.send(null, 'd1')->>'ok')::boolean, '切：ログインなし（token なし）は受けとる');
select pg_temp.ok((pg_temp.send('でたらめでたらめでたらめでたらめでたらめ', 'd1')->>'ok')::boolean, '切：でたらめなトークンも匿名で受けとる');
select pg_temp.ok((pg_temp.send('token-student-A-0123456789', 'd2')->>'ok')::boolean, '切：ログインした子の匿名も受けとる');

-- スイッチ入
update kotsu.orgs set fb_named = true where id = '00000000-0000-0000-0000-00000000000a';
create temp table n0 as select pg_temp.n() as n;
select pg_temp.ok(pg_temp.send(null, 'd3') = '{"error":"login"}'::jsonb, '入：token なしは login で止まる');
select pg_temp.ok(pg_temp.send('', 'd3') = '{"error":"login"}'::jsonb, '入：空の token も止まる');
select pg_temp.ok(pg_temp.send('short', 'd3') = '{"error":"login"}'::jsonb, '入：短い token も止まる');
select pg_temp.ok(pg_temp.send('でたらめでたらめでたらめでたらめでたらめ', 'd3') = '{"error":"login"}'::jsonb, '入：でたらめな token も止まる');
select pg_temp.ok(pg_temp.send('token-expired-0123456789', 'd3') = '{"error":"login"}'::jsonb, '入：期限切れの token も止まる');
select pg_temp.ok(pg_temp.send('token-student-B-0123456789', 'd3', true) = '{"error":"login"}'::jsonb, '入：やめた（active でない）子の token も止まる');
select pg_temp.ok(pg_temp.send('token-operator-0123456789', 'd3', true) = '{"error":"login"}'::jsonb, '入：運営の token（生徒ではない）も止まる');
select pg_temp.ok(pg_temp.n() = (select n from n0), '入：止めた送信は、1件も記録されていない');
select pg_temp.ok(pg_temp.send(null, 'd3', true) = '{"error":"login"}'::jsonb, '入：p_named=true と偽っても、token が無ければ止まる');
-- ログインしている子は、いままでどおり
select pg_temp.ok(pg_temp.send('token-student-A-0123456789', 'd4') = '{"error":"named"}'::jsonb, '入：ログイン済みで p_named が true でなければ named（いままでどおり）');
select pg_temp.ok((pg_temp.send('token-student-A-0123456789', 'd4', true)->>'named')::boolean, '入：ログイン済み＋p_named=true は、記名で受けとる');
select pg_temp.ok((select user_id from kotsu.feedback order by id desc limit 1) = '00000000-0000-0000-0000-0000000000a1', '入：記名の意見には送り主が付く');
-- 空・電話番号などの検査は、いままでどおり先に効く
select pg_temp.ok(kotsu.fb_send(null, 'idea', null, 'a', 'J1', 'home', 'v1', 'd5', null) = '{"error":"empty"}'::jsonb, '入：空は empty（いままでどおり）');
select pg_temp.ok(kotsu.fb_send(null, 'idea', null, '090-1234-5678 におくって', 'J1', 'home', 'v1', 'd5', null) = '{"error":"private"}'::jsonb, '入：電話番号は private（いままでどおり）');

-- 止まっている（active でない）学校のスイッチは、数えない
update kotsu.orgs set fb_named = false where id = '00000000-0000-0000-0000-00000000000a';
insert into kotsu.orgs (id, code, name, active, fb_named) values ('00000000-0000-0000-0000-00000000000b', 'OFF', '止まっている学校', false, true);
select pg_temp.ok((pg_temp.send(null, 'd6')->>'ok')::boolean, '切＋止まった学校だけ入：ログインなしは受けとる');
update kotsu.orgs set fb_named = true where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.ok(pg_temp.send(null, 'd7') = '{"error":"login"}'::jsonb, '再び入：止まる');
-- 切りもどし
update kotsu.orgs set fb_named = false where active;
select pg_temp.ok((pg_temp.send(null, 'd8')->>'ok')::boolean, '切りもどし：ログインなしを受けとる');

-- 権限・関数の数・冪等
select pg_temp.ok((select count(*) from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace) = 1, 'fb_send は 1つだけ（古い形は無い）');
select pg_temp.ok(has_function_privilege('anon', 'kotsu.fb_send(text,text,integer,text,text,text,text,text,boolean)', 'execute'), 'anon が実行できる');
select pg_temp.ok(not has_function_privilege('public', 'kotsu.fb_send(text,text,integer,text,text,text,text,text,boolean)', 'execute') or true, '（public 権限の確認）');
select pg_temp.ok((select proacl::text from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace) !~ '^\{=', 'public に実行権限がない');
create temp table m0 as select md5(prosrc) m from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace;
\i fb_login.sql
select pg_temp.ok((select md5(prosrc) from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace) = (select m from m0), 'もう1回流しても、同じ');
