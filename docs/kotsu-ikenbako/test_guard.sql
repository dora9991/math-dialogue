\set ON_ERROR_STOP on
\set QUIET on
insert into kotsu.orgs (id, code, name) values ('00000000-0000-0000-0000-00000000000a', 'TEST', 'テスト学校');
insert into kotsu.users (id, org_id, role, login_id, nick, grade)
  select ('00000000-0000-0000-0000-0000000000' || lpad(to_hex(n), 2, '0'))::uuid, '00000000-0000-0000-0000-00000000000a', 'student', 's' || n, 'u' || n, 'J1' from generate_series(1, 12) n;
insert into kotsu.sessions (token_hash, user_id, kind, expires_at)
  select kotsu._h('token-student-' || n || '-0123456789'), ('00000000-0000-0000-0000-0000000000' || lpad(to_hex(n), 2, '0'))::uuid, 'user', now() + interval '1 day' from generate_series(1, 12) n;
create function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'NG: %', label; end if; raise notice 'ok  %', label; end $$;
create function pg_temp.tok(n int) returns text language sql as $$ select 'token-student-' || n || '-0123456789' $$;
create function pg_temp.uid(n int) returns uuid language sql as $$ select ('00000000-0000-0000-0000-0000000000' || lpad(to_hex(n), 2, '0'))::uuid $$;
-- 送る（ログインした子 n が、p_named=true で）
create function pg_temp.send(n int, msg text, dev text, feel int default null) returns jsonb language sql as $$
  select kotsu.fb_send(pg_temp.tok(n), 'idea', feel, msg, 'J1', 'home', 'v1', dev, true) $$;
create function pg_temp.anon(msg text, dev text, feel int default null) returns jsonb language sql as $$
  select kotsu.fb_send(null, 'idea', feel, msg, 'J1', 'home', 'v1', dev, null) $$;
create function pg_temp.row(r jsonb) returns kotsu.feedback language sql as $$ select * from kotsu.feedback where id = (r->>'id')::bigint $$;

update kotsu.orgs set fb_named = true where id = '00000000-0000-0000-0000-00000000000a';

-- ═ A. 回数：ログインしている子は 1時間2件
truncate kotsu.rate;
select pg_temp.ok((pg_temp.send(1, 'いちばん目の意見です', 'a1')->>'ok')::boolean, 'A1：1件め（通る）');
select pg_temp.ok((pg_temp.send(1, 'にばん目の意見です', 'a2')->>'ok')::boolean, 'A2：2件め（通る）');
select pg_temp.ok(pg_temp.send(1, 'さんばん目の意見です', 'a3') = '{"error":"slow"}'::jsonb, 'A3：3件め（1時間2件を こえた）は slow');
select pg_temp.ok((pg_temp.send(2, '別の子の意見です', 'a4')->>'ok')::boolean, 'A4：別の子は、自分の数えかたで通る');
-- 1日5件
truncate kotsu.rate;
insert into kotsu.rate (k, n, since) values ('FV:' || pg_temp.uid(3), 5, now() - interval '3 hours');
select pg_temp.ok(pg_temp.send(3, '1日5件をこえた意見', 'a5') = '{"error":"slow"}'::jsonb, 'A5：1日5件に達していると slow');
insert into kotsu.rate (k, n, since) values ('FV:' || pg_temp.uid(4), 4, now() - interval '3 hours') on conflict (k) do nothing;
select pg_temp.ok((pg_temp.send(4, '1日4件めの意見', 'a6')->>'ok')::boolean, 'A6：1日4件めは通る');

-- ═ B. スタンプ（顔）だけは 1日3回
truncate kotsu.rate;
insert into kotsu.rate (k, n, since) values ('FS:' || pg_temp.uid(5), 3, now() - interval '1 hour');
select pg_temp.ok(pg_temp.send(5, '', 'b1', 2) = '{"error":"slow"}'::jsonb, 'B1：スタンプだけの 4回めは slow');
select pg_temp.ok((pg_temp.send(5, '文のある意見です', 'b2', 2)->>'ok')::boolean, 'B2：文のある意見は、スタンプの上限と関係なく通る');
select pg_temp.ok((select n from kotsu.rate where k = 'FS:' || pg_temp.uid(5)) = 3, 'B5：文のある意見は、スタンプの回数に入れない（3 のまま）');
truncate kotsu.rate;
select pg_temp.ok((pg_temp.send(6, '', 'b3', 3)->>'ok')::boolean, 'B3：スタンプだけ 1回めは通る');
select pg_temp.ok((select n from kotsu.rate where k = 'FS:' || pg_temp.uid(6)) = 1, 'B4：スタンプの回数が 1 と数えられる');

-- ═ C. 同じ文の連投
truncate kotsu.rate;
create temp table c0 as select count(*) n from kotsu.feedback;
select pg_temp.ok((pg_temp.send(7, '同じ文です', 'c1')->>'ok')::boolean, 'C1：1回めは通る');
select pg_temp.ok(pg_temp.send(7, '同じ文です', 'c2') = '{"error":"dup"}'::jsonb, 'C2：同じ文をもういちど送ると dup');
select pg_temp.ok((select count(*) from kotsu.feedback) = (select n from c0) + 1, 'C3：dup は記録されない');
select pg_temp.ok((pg_temp.send(7, 'ちがう文です', 'c3')->>'ok')::boolean, 'C4：ちがう文は通る');
select pg_temp.ok((pg_temp.send(8, '同じ文です', 'c4')->>'ok')::boolean, 'C5：別の子が同じ文を送るのは通る');
update kotsu.feedback set at = now() - interval '2 days' where user_id = pg_temp.uid(7);
truncate kotsu.rate;
select pg_temp.ok((pg_temp.send(7, '同じ文です', 'c5')->>'ok')::boolean, 'C6：24時間より前の同じ文は、もう一度送れる');

-- ═ D. 人を傷つけることば：受けとるが「かくした」へ
truncate kotsu.rate;
create function pg_temp.st(n int, msg text, dev text) returns text language sql as $$ select (pg_temp.row(pg_temp.send(n, msg, dev))).status $$;
select pg_temp.ok(pg_temp.st(1, 'この授業うざい', 'd1') = 'hide', 'D1：うざい → かくした');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, '先生はバカ', 'd2') = 'hide', 'D2：バカ → かくした');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, '死ね', 'd3') = 'hide', 'D3：死ね → かくした（助けを求めることばではない）');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, 'ゴミみたいな問題', 'd4') = 'hide', 'D4：ゴミ → かくした');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, '同じ問題ばかり出るので、ちがう問題も出してほしい', 'd5') = 'new', 'D5：「ばかり」は かくさない');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, 'バカンスの計算問題がほしい', 'd6') = 'new', 'D6：「バカンス」は かくさない');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, '気持ちがいい問題だった', 'd7') = 'new', 'D7：「気持ち」は かくさない');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, 'くそまじめに解いたのに点が入らない', 'd8') = 'new', 'D8：「くそまじめ」は かくさない');
truncate kotsu.rate; select pg_temp.ok(pg_temp.st(1, '時間が反映されないのが つらい', 'd9') = 'new', 'D9：ふつうの文句は、かくさない');
truncate kotsu.rate; select pg_temp.ok((pg_temp.send(1, 'うざい授業', 'd10')->>'ok')::boolean, 'D10：かくした意見も、生徒にはふつうに「届いた」と返す');
select pg_temp.ok((select note from kotsu.feedback where msg = 'うざい授業') like '🔕%', 'D11：かくした意見には、メモが付く');
select pg_temp.ok((select user_id from kotsu.feedback where msg = 'うざい授業') = pg_temp.uid(1), 'D12：かくした意見にも、記名の送り主は残る');

-- ═ E. 助けを求めることば：止めない・目立たせる・上限をゆるめる
truncate kotsu.rate;
create function pg_temp.rw(n int, msg text, dev text) returns kotsu.feedback language sql as $$ select pg_temp.row(pg_temp.send(n, msg, dev)) $$;
select pg_temp.ok(((pg_temp.rw(9, 'もう死にたい', 'e1')).status, (pg_temp.rw(9, 'もう死にたい', 'e1b')).kind) = ('new', 'trouble'), 'E1：死にたい → 新しい・種類は trouble（かくさない）');
select pg_temp.ok((select note from kotsu.feedback where msg = 'もう死にたい' order by id desc limit 1) like '🚨%', 'E2：メモに 🚨 が付く');
select pg_temp.ok((pg_temp.send(9, 'いじめられている', 'e2')->>'ok')::boolean, 'E3：いじめ → 3件めも通る（1人ごとの 1時間2件を かけない）');
select pg_temp.ok((select (pg_temp.rw(9, 'たすけて', 'e3')).status) = 'new', 'E4：助けて → 新しい');
select pg_temp.ok(pg_temp.send(9, 'ふつうの意見です', 'e4') = '{"error":"slow"}'::jsonb, 'E5：そのあとのふつうの意見は、1人ごとの上限で止まる');
truncate kotsu.rate;
select pg_temp.ok((select (pg_temp.rw(10, '死ね いじめ', 'e5')).status) = 'new', 'E6：「死ね」と「いじめ」がいっしょなら、助けを求める側として扱い、かくさない');
truncate kotsu.rate;
select pg_temp.ok((pg_temp.send(11, 'もう消えたい', 'e6')->>'ok')::boolean and (pg_temp.send(11, 'もう消えたい', 'e7')->>'ok')::boolean, 'E7：助けを求めることばは、同じ文でも止めない（dup にしない）');

-- ═ F. これまでの決まり（ログイン必須・記名の説明）は、そのまま
truncate kotsu.rate;
select pg_temp.ok(pg_temp.anon('ログインなしの意見', 'f1') = '{"error":"login"}'::jsonb, 'F1：記名のあいだ、ログインなしは login');
select pg_temp.ok(kotsu.fb_send(pg_temp.tok(12), 'idea', null, '記名の説明を見ていない', 'J1', 'home', 'v1', 'f2', null) = '{"error":"named"}'::jsonb, 'F2：p_named が true でなければ named');
select pg_temp.ok(kotsu.fb_send(pg_temp.tok(12), 'idea', null, 'a', 'J1', 'home', 'v1', 'f3', true) = '{"error":"empty"}'::jsonb, 'F3：空は empty');
select pg_temp.ok(kotsu.fb_send(pg_temp.tok(12), 'idea', null, '090-1234-5678 におくって', 'J1', 'home', 'v1', 'f4', true) = '{"error":"private"}'::jsonb, 'F4：電話番号は private');

-- ═ G. スイッチ切（匿名）：同じ端末で同じ文・スタンプ・かくす・🚨
update kotsu.orgs set fb_named = false where id = '00000000-0000-0000-0000-00000000000a';
truncate kotsu.rate;
select pg_temp.ok((pg_temp.anon('匿名の意見です', 'g1')->>'ok')::boolean, 'G1：匿名（ログインなし）で送れる');
select pg_temp.ok(pg_temp.anon('匿名の意見です', 'g1') = '{"error":"dup"}'::jsonb, 'G2：同じ端末の同じ文は dup');
select pg_temp.ok((pg_temp.anon('匿名の意見です', 'g2')->>'ok')::boolean, 'G3：別の端末の同じ文は通る（端末の識別は、送る側の申告のため）');
select pg_temp.ok((pg_temp.row(pg_temp.anon('この授業きもい', 'g3'))).status = 'hide', 'G4：匿名でも、傷つけることばは かくす');
select pg_temp.ok((pg_temp.row(pg_temp.anon('いじめられてるんだ', 'g4'))).note like '🚨%', 'G5：匿名でも、助けを求めることばは 🚨');
insert into kotsu.rate (k, n, since) values ('FS:' || kotsu._h('fb:g5'), 3, now());
select pg_temp.ok(pg_temp.anon('', 'g5', 2) = '{"error":"slow"}'::jsonb, 'G6：匿名のスタンプだけも、1日3回（端末ごと）');
select pg_temp.ok((pg_temp.send(1, '匿名のあいだの、ログインした子の意見', 'g6')->>'named')::boolean is not true, 'G7：スイッチ切では、送り主を記録しない');

-- ═ H. 権限・冪等
select pg_temp.ok((select count(*) from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace) = 1, 'H1：fb_send は 1つだけ');
select pg_temp.ok((select proacl::text from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace) !~ '^\{=', 'H2：public に実行権限がない');
select pg_temp.ok(has_function_privilege('anon', 'kotsu.fb_send(text,text,integer,text,text,text,text,text,boolean)', 'execute'), 'H3：anon が実行できる');
create temp table m0 as select md5(prosrc) m from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace;
\i fb_guard.sql
select pg_temp.ok((select md5(prosrc) from pg_proc where proname = 'fb_send' and pronamespace = 'kotsu'::regnamespace) = (select m from m0), 'H4：もう1回流しても、同じ');
