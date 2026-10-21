<?php
declare(strict_types=1);

// 土台の安全の部品（暗号・二段階認証・パスワード・操作の記録の改ざん検知・回数制限・貸出・時刻・SQL の区切り）

use Hub\Kernel\Audit;
use Hub\Kernel\Crypto;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Password;
use Hub\Kernel\Time;
use Hub\Kernel\Totp;

return [
    '暗号：戻せる・書き換えを見破る・列が違うと読めない・古い鍵も読める' => function () {
        $k1 = base64_encode(random_bytes(32));
        $k2 = base64_encode(random_bytes(32));
        $idx = base64_encode(random_bytes(32));
        $c1 = new Crypto(['k1' => $k1], 'k1', $idx);
        $t = $c1->encrypt('こんにちは、秘密です', 'line_message_log.body');
        T::ok(str_starts_with($t, 'e1.k1.'));
        T::eq('こんにちは、秘密です', $c1->decrypt($t, 'line_message_log.body'));
        T::ok($c1->encrypt('同じ', 'a') !== $c1->encrypt('同じ', 'a'), '毎回ちがう暗号文（nonce）');
        $bad = substr($t, 0, -2) . (substr($t, -2, 1) === 'A' ? 'B' : 'A') . substr($t, -1);
        T::throws(fn () => $c1->decrypt($bad, 'line_message_log.body'), '読めません');
        T::throws(fn () => $c1->decrypt($t, 'line_outbox.messages'), '読めません', '別の列の暗号文は読めない');
        $c2 = new Crypto(['k1' => $k1, 'k2' => $k2], 'k2', $idx);
        T::eq('こんにちは、秘密です', $c2->decrypt($t, 'line_message_log.body'), '鍵を足しても古いものを読める');
        T::ok(str_starts_with($c2->encrypt('x', 'a'), 'e1.k2.'), '新しいものは新しい鍵で');
        T::throws(fn () => (new Crypto(['k2' => $k2], 'k2', $idx))->decrypt($t, 'line_message_log.body'), '鍵 k1 がありません');
        T::eq($c1->index('123456', 'link_code'), $c2->index('123456', 'link_code'), '指紋は同じ鍵なら同じ');
        T::ok($c1->index('123456', 'link_code') !== $c1->index('123456', 'other'), '目的が違えば別の指紋');
        T::throws(fn () => new Crypto(['k1' => base64_encode('short')], 'k1', $idx), '32 バイト');
    },

    '二段階認証（RFC 6238 の例）と、同じコードの使い回しを断る' => function () {
        $secret = Totp::b32enc('12345678901234567890');
        T::eq('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', $secret);
        T::eq('287082', Totp::code($secret, Totp::step(59)));
        T::eq('081804', Totp::code($secret, Totp::step(1111111109)));
        T::eq('005924', Totp::code($secret, Totp::step(1234567890)));
        $now = 1_800_000_000;
        $code = Totp::code($secret, Totp::step($now));
        $step = Totp::verify($secret, $code, $now);
        T::eq(Totp::step($now), $step);
        T::eq(null, Totp::verify($secret, $code, $now, $step), '同じコードは2回使えない');
        T::ok(Totp::verify($secret, Totp::code($secret, Totp::step($now) - 1), $now) !== null, '30秒前のコードまでは通す');
        T::eq(null, Totp::verify($secret, Totp::code($secret, Totp::step($now) - 3), $now), '90秒前は通さない');
        T::eq(null, Totp::verify($secret, 'abcdef', $now));
        $s2 = Totp::newSecret();
        T::eq(32, strlen($s2));
        T::contains('otpauth://totp/', Totp::uri($s2, 'a@example.test', 'ハブ'));
    },

    'パスワード：こしょう・決まり・仮パスワード' => function () {
        $p1 = new Password(base64_encode(str_repeat("\x07", 32)));
        $p2 = new Password(base64_encode(str_repeat("\x08", 32)));
        $h = $p1->hash('朝のピアノは3曲までと決めている');
        T::ok($p1->verify('朝のピアノは3曲までと決めている', $h));
        T::ok(!$p1->verify('朝のピアノは4曲までと決めている', $h));
        T::ok(!$p2->verify('朝のピアノは3曲までと決めている', $h), 'こしょうが違えば通らない（DB だけ漏れても当てられない）');
        T::contains('12文字以上', Password::policyError('short'));
        T::contains('よく使われて', Password::policyError('password1234'));
        T::contains('メールアドレス', Password::policyError('kazuteacher-2026!', 'kazuteacher@example.test'));
        T::eq(null, Password::policyError('朝のピアノは3曲までと決めている'));
        T::eq(16, strlen(Password::generateTemp()));
    },

    '操作の記録：鎖がつながる・途中の書き換えと最後の削除を見破る' => function () {
        [$app] = T::app();
        $a = $app->audit();
        $a->record(['id' => 'u1', 'email' => 'a@example.test'], 'rules.save', ['id' => 1]);
        $app->clock->advance(5);
        $a->record(['id' => 'u1', 'email' => 'a@example.test'], 'broadcasts.send', ['id' => 2, 'recipients' => 30]);
        $a->record(null, 'auth.login_failed', ['reason' => 'password'], false, null, '203.0.113.5');
        $v = $a->verify();
        T::eq(true, $v['ok']);
        T::eq(3, $v['rows']);
        $app->db()->exec("UPDATE hub_audit_log SET summary = '{\"id\":2,\"recipients\":3}' WHERE action = 'broadcasts.send'");
        T::eq(false, $a->verify()['ok'], '中身の書き換え');
        T::truncateAll();
        [$app] = T::app();
        $a = $app->audit();
        $a->record(null, 'x.one');
        $a->record(null, 'x.two');
        $app->db()->exec("DELETE FROM hub_audit_log WHERE action = 'x.two'");
        T::eq(false, $a->verify()['ok'], '最後の行の削除');
        $list = $a->list(10);
        T::eq('x.one', $list[0]['action']);
        T::eq('{}', Json::enc($list[0]['summary']), '空の要約は {} のまま');
    },

    '回数制限と貸出' => function () {
        [$app] = T::app();
        $l = $app->limiter();
        for ($i = 0; $i < 3; $i++) {
            T::eq(true, $l->hit('t', 3, 60)['ok']);
        }
        T::eq(false, $l->hit('t', 3, 60)['ok'], '4回目は止める');
        T::eq(4, $l->peek('t', 60));
        $app->clock->advance(61);
        T::eq(true, $l->hit('t', 3, 60)['ok'], '次の窓では、また使える');
        $lease = $app->lease();
        $o = $lease->acquire('job', 120);
        T::ok($o !== null);
        T::eq(null, $lease->acquire('job', 120), '使っている間は取れない');
        $app->clock->advance(121);
        T::ok($lease->acquire('job', 120) !== null, '期限が来れば取れる');
    },

    '時刻：日本時間の計算・月の繰り上がり・曜日' => function () {
        $d = Time::parse('2026-10-31T15:30:00Z'); // 日本時間 11/1 0:30
        T::eq('2026-11', Time::monthKey($d, 540));
        T::eq('11月1日(日) 00:30', Time::formatJa($d, 540));
        T::eq('2026-12-01T11:00:00.000Z', Time::iso(Time::fromLocal(2026, 11, 31, 20, 0, 540)), '11月31日→12月1日');
        T::eq('2026-11-02T15:30:00.000Z', Time::iso(Time::addLocalDays($d, 2, 540)));
        T::throws(fn () => Time::parse('2026-02-30T00:00:00Z'), '日時として読めません');
        T::throws(fn () => Time::parse('きのう'), '日時として読めません');
        T::eq('2026-11-10T11:00:00.000Z', Time::iso(Time::parse('2026-11-10T20:00:00+09:00')));
    },

    'SQL の区切り（文字列やコメントの中の ; で切らない）' => function () {
        $parts = Db::splitStatements("CREATE TABLE a (x TEXT); -- コメント; ここは無視\nINSERT INTO a VALUES ('a;b'), (\"c;d\"); /* ; */ SELECT 1;");
        T::eq(3, count($parts));
        T::eq("INSERT INTO a VALUES ('a;b'), (\"c;d\")", $parts[1]);
    },

    'ログに秘密を書かない' => function () {
        $r = \Hub\Kernel\Log::redact(['password' => 'p', 'channel_secret' => 's', 'replyToken' => 't', 'key' => 'event-1', 'nested' => ['access_token' => 'x', 'status' => 400]]);
        T::eq('***', $r['password']);
        T::eq('***', $r['channel_secret']);
        T::eq('***', $r['replyToken']);
        T::eq('event-1', $r['key'], 'ふつうの「key」は伏せない');
        T::eq('***', $r['nested']['access_token']);
        T::eq(400, $r['nested']['status']);
    },
];
