<?php
declare(strict_types=1);

// 管理 API（Rpc）：権限の表・入力の検証・操作の記録・閲覧の記録・運営メンバーの管理・設定の検証

use Hub\Admin\Members;
use Hub\Line\Rpc;
use Hub\Line\RpcError;

function who(string $role, string $id = '00000000-0000-4000-8000-000000000001'): array
{
    return ['id' => $id, 'email' => "{$role}@example.test", 'role' => $role];
}

function rpcErr(callable $fn): ?RpcError
{
    try {
        $fn();
    } catch (RpcError $e) {
        return $e;
    }
    return null;
}

return [
    '書き込みの操作には、かならず「見る」以外の権限が要る（line-hub と同じ決まり）' => function () {
        [$app] = T::app();
        $rpc = new Rpc($app);
        $names = $rpc->actionNames();
        T::ok(count($names) >= 60, '操作の数：' . count($names));
        foreach ($names as $a) {
            if ($rpc->isWrite($a) && $a !== 'account.passwordChanged') {
                T::ok($rpc->permOf($a) !== 'read', "{$a} は書き込みなのに read 権限");
            }
        }
        // line-hub の管理画面が呼ぶ操作が、全部ある
        $ui = (string) file_get_contents(__DIR__ . '/../public/assets/line-hub-admin.js');
        preg_match_all("/(?:call|write)\\('([a-zA-Z.]+)'/", $ui, $m);
        foreach (array_unique($m[1]) as $a) {
            T::ok(in_array($a, $names, true), "管理画面が呼ぶ操作 {$a} が無い");
        }
    },

    '役割ごとに、できることが違う' => function () {
        [$app] = T::app();
        $rpc = new Rpc($app);
        $rule = ['rule' => ['name' => 'r', 'trigger_type' => 'follow', 'actions' => [['type' => 'reply', 'messages' => ['a']]]]];
        T::eq('forbidden', rpcErr(fn () => $rpc->call(who('viewer'), 'rules.save', $rule))?->codeName);
        T::eq('forbidden', rpcErr(fn () => $rpc->call(who('operator'), 'rules.save', $rule))?->codeName);
        T::ok(isset($rpc->call(who('admin'), 'rules.save', $rule)['id']), '管理者は作れる');
        T::eq('forbidden', rpcErr(fn () => $rpc->call(who('admin'), 'members.list', []))?->codeName, 'メンバー管理はオーナーだけ');
        T::eq('forbidden', rpcErr(fn () => $rpc->call(who('admin'), 'settings.update', ['patch' => ['plan_limits' => ['max_scenarios' => 3]]]))?->codeName, '上限はオーナーだけ');
        T::eq('forbidden', rpcErr(fn () => $rpc->call(who('operator'), 'broadcasts.create', ['name' => 'x', 'text' => 'x']))?->codeName);
        T::ok(is_array($rpc->call(who('viewer'), 'dashboard', [])));
        T::eq(2, (int) $app->db()->value("SELECT COUNT(*) FROM hub_audit_log WHERE action = 'rules.save' AND ok = 0"), '断ったことも記録');
    },

    '入力の検証は、日本語で返す' => function () {
        [$app] = T::app();
        $rpc = new Rpc($app);
        $o = who('owner');
        T::contains('userId', rpcErr(fn () => $rpc->call($o, 'tags.add', ['tag' => 'x']))?->getMessage());
        T::contains('1〜500 の整数', rpcErr(fn () => $rpc->call($o, 'friends.list', ['limit' => 9999]))?->getMessage());
        T::contains('active か blocked', rpcErr(fn () => $rpc->call($o, 'friends.list', ['status' => 'x']))?->getMessage());
        T::contains('日時', rpcErr(fn () => $rpc->call($o, 'calendar.range', ['from' => 'きのう', 'to' => 'あした']))?->getMessage());
        T::contains('100日以内', rpcErr(fn () => $rpc->call($o, 'calendar.range', ['from' => '2026-01-01T00:00:00Z', 'to' => '2026-12-01T00:00:00Z']))?->getMessage());
        T::contains('notification_reserve', rpcErr(fn () => $rpc->call($o, 'settings.update', ['patch' => ['monthly_cap' => 10, 'notification_reserve' => 20]]))?->getMessage());
        T::contains('未知の設定', rpcErr(fn () => $rpc->call($o, 'settings.update', ['patch' => ['x' => 1]]))?->getMessage());
        T::contains('https://', rpcErr(fn () => $rpc->call($o, 'settings.update', ['patch' => ['site_url' => 'http://x.test']]))?->getMessage());
        T::eq('unknown_action', rpcErr(fn () => $rpc->call($o, 'nope', []))?->codeName);
        T::eq('bad_request', rpcErr(fn () => $rpc->call($o, 'rules.save', ['rule' => ['name' => 'x']]))?->codeName, 'エンジンの検証のエラーも bad_request');
        T::eq(['ok' => true], $rpc->call($o, 'settings.update', ['patch' => ['monthly_cap' => 1000, 'site_url' => 'https://member.example.test/']]));
        T::eq('https://member.example.test', $rpc->call($o, 'settings.get', [])['site_url'], '末尾の / はとる');
    },

    '友だちの詳細・トークを見たら、閲覧の記録に残る' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(800);
        Sim::send($app, Sim::follow($line, $u));
        Sim::send($app, Sim::text($line, $u, 'ないしょの相談です'));
        $rpc = new Rpc($app);
        $f = $rpc->call(who('operator'), 'friends.get', ['userId' => $u]);
        T::eq('ないしょの相談です', $f['messages'][0]['text_preview'], '画面には読み戻して出す');
        $t = $rpc->call(who('operator'), 'chat.thread', ['userId' => $u]);
        T::eq('ないしょの相談です', $t['items'][1]['text']);
        $log = $app->db()->all('SELECT action, subject, actor_email FROM hub_access_log ORDER BY id');
        T::eq(['friends.get', 'chat.thread'], array_column($log, 'action'));
        T::eq($u, $log[0]['subject']);
        T::eq('operator@example.test', $log[0]['actor_email']);
    },

    '運営メンバー：追加（仮パスワード）・役割・最後のオーナーは外せない・自分は外せない' => function () {
        [$app] = T::app();
        $ownerId = Members::create($app, 'o@example.test', 'owner', null, '朝のピアノは3曲までと決めている', false, 'test');
        $rpc = new Rpc($app);
        $o = who('owner', $ownerId);
        $r = $rpc->call($o, 'members.add', ['email' => 'New@Example.test', 'role' => 'operator', 'displayName' => '新しい人']);
        T::eq(true, $r['created']);
        T::eq(16, strlen($r['tempPassword']));
        T::ok(!str_contains((string) $app->db()->value("SELECT summary FROM hub_audit_log WHERE action = 'members.add'"), $r['tempPassword']), '仮パスワードは記録に残さない');
        $list = $rpc->call($o, 'members.list', []);
        T::eq(2, count($list));
        $newRow = array_values(array_filter($list, fn ($m) => $m['user_id'] === $r['userId']))[0];
        T::eq('new@example.test', $newRow['email'], 'メールは小文字にそろえる');
        T::eq(true, $newRow['must_change_password']);
        T::contains('すでに運営メンバー', rpcErr(fn () => $rpc->call($o, 'members.add', ['email' => 'new@example.test', 'role' => 'viewer']))?->getMessage());
        T::contains('オーナーが1人もいなくなる', rpcErr(fn () => $rpc->call($o, 'members.setRole', ['userId' => $ownerId, 'role' => 'admin']))?->getMessage());
        T::contains('自分自身は外せません', rpcErr(fn () => $rpc->call($o, 'members.remove', ['userId' => $ownerId]))?->getMessage());
        $rpc->call($o, 'members.setRole', ['userId' => $r['userId'], 'role' => 'admin']);
        T::eq('admin', $app->db()->value('SELECT role FROM hub_admins WHERE id = ?', [$r['userId']]));
        $p = $rpc->call($o, 'members.resetPassword', ['userId' => $r['userId']]);
        T::ok($p['tempPassword'] !== $r['tempPassword']);
        $rpc->call($o, 'members.remove', ['userId' => $r['userId']]);
        T::eq(1, (int) $app->db()->value('SELECT COUNT(*) FROM hub_admins'));
    },

    'テスト送信とチャットは、その場で送る（毎分の処理を待たない）' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(810);
        Sim::send($app, Sim::follow($line, $u));
        $rpc = new Rpc($app);
        $r = $rpc->call(who('admin'), 'testSend', ['to' => $u, 'text' => 'テストです']);
        T::eq('sent', $r['status']);
        T::eq(['テストです'], $line->textsTo($u));
        $app->clock->advance(120);
        $c = $rpc->call(who('operator'), 'chat.send', ['userId' => $u, 'text' => 'こんにちは']);
        T::eq('push', $c['via']);
        T::eq('sent', $c['status']);
        T::eq(['テストです', 'こんにちは'], $line->textsTo($u));
        T::ok(!str_contains((string) $app->db()->value("SELECT summary FROM hub_audit_log WHERE action = 'chat.send'"), 'こんにちは'), 'チャットの本文は記録に残さない（文字数だけ）');
    },

    'ひな形：プレビューと作成（動き出すものは止めた状態で作る）' => function () {
        [$app] = T::app();
        $rpc = new Rpc($app);
        $list = $rpc->call(who('admin'), 'templates.list', []);
        T::eq(6, count($list));
        $pv = $rpc->call(who('admin'), 'templates.preview', ['key' => 'genie-attributes']);
        T::eq('attribute', $pv[0]['kind']);
        $r = $rpc->call(who('admin'), 'templates.apply', ['key' => 'genie-attributes']);
        T::eq(true, $r['ok']);
        T::eq(5, (int) $app->db()->value('SELECT COUNT(*) FROM line_tag_groups'));
        T::eq(1, (int) $app->db()->value('SELECT COUNT(*) FROM line_surveys'));
        $r2 = $rpc->call(who('admin'), 'templates.apply', ['key' => 'welcome-react']);
        T::eq(2, count($r2['created']));
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_scenarios WHERE enabled = 1 AND (start_on_follow = 1)'), '友だち追加で始まるものは止めて作る');
        $again = $rpc->call(who('admin'), 'templates.apply', ['key' => 'welcome-react']);
        T::contains('（2）', $again['created'][0]['name'], '同じ名前は（2）を付けて別に作る');
    },
];
