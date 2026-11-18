<?php
declare(strict_types=1);

// 会員サイトとの連携：署名つき API（時刻・nonce・使い回し・権限）・連携コード・プラン・通知・連携の解除・退会

use Hub\Kernel\App;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Kernel\Time;
use Hub\Line\Audience;
use Hub\Line\Outbox;
use Hub\Line\Settings;
use Hub\Member\ApiAuth;
use Hub\Web\Front;

/** 会員サイトのサーバー役：署名をつけて呼ぶ */
function api(App $app, string $method, string $path, ?array $body = null, array $over = []): Response
{
    $secret = $over['secret'] ?? T::config()['member']['api_keys']['site']['secret'];
    $raw = $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE);
    $ts = $over['ts'] ?? (string) intdiv(Time::ms($app->now()), 1000);
    $nonce = $over['nonce'] ?? bin2hex(random_bytes(12));
    $h = [
        'host' => 'hub.example.test',
        'content-type' => 'application/json',
        'x-hub-key' => $over['key'] ?? 'site',
        'x-hub-timestamp' => $ts,
        'x-hub-nonce' => $nonce,
        'x-hub-signature' => $over['sig'] ?? ApiAuth::sign($secret, $method, $path, $ts, $nonce, $raw),
    ];
    return (new Front($app))->handle(new Request($method, $path, $h, $raw, [], [], [], '192.0.2.10', true));
}

/** その人に最後に届いた文 */
function lastText(\Hub\Line\FakeLine $line, string $u): ?string
{
    $d = $line->deliveriesTo($u);
    return $d ? ($d[count($d) - 1]['messages'][0]['text'] ?? null) : null;
}

function j(Response $r): array
{
    return json_decode($r->body, true) ?? [];
}

return [
    '署名つき API：署名・時刻・nonce の使い回し・鍵・権限' => function () {
        [$app] = T::app();
        $ok = api($app, 'GET', '/api/v1/members/m-1');
        T::eq(200, $ok->status);
        T::eq(false, j($ok)['linked']);
        T::eq(401, api($app, 'GET', '/api/v1/members/m-1', null, ['sig' => 'v1=deadbeef'])->status, '署名ちがい');
        T::eq(401, api($app, 'GET', '/api/v1/members/m-1', null, ['ts' => (string) (intdiv(Time::ms($app->now()), 1000) - 600)])->status, '10分前の時刻');
        T::eq(401, api($app, 'GET', '/api/v1/members/m-1', null, ['key' => 'nokey'])->status, '知らない鍵');
        $nonce = 'fixed-nonce-1234567890';
        T::eq(200, api($app, 'GET', '/api/v1/members/m-1', null, ['nonce' => $nonce])->status);
        T::eq(401, api($app, 'GET', '/api/v1/members/m-1', null, ['nonce' => $nonce])->status, '同じ nonce は2回通さない（リプレイ対策）');
        // 権限の無い鍵
        [$app2] = T::app(['member' => ['api_keys' => ['site' => ['secret' => T::config()['member']['api_keys']['site']['secret'], 'scopes' => ['members']]]]]);
        $r = api($app2, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-1']);
        T::eq(403, $r->status);
        T::contains('link', j($r)['error']['message']);
    },

    '連携：コードを作る → LINE で送る → つながる → 状態・プラン・タグ' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(700);
        Sim::send($app, Sim::follow($line, $u));
        $r = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-100', 'plan' => 'guild', 'rank' => 20]));
        T::eq(true, $r['ok']);
        T::ok((bool) preg_match('/^\d{6}$/', $r['code']), '6桁のコード');
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM hub_link_codes WHERE code_hash = ?', [$r['code']]), 'コードそのものは保存しない');
        Sim::send($app, Sim::text($line, $u, mb_convert_kana($r['code'], 'N'))); // 全角の数字で送っても通る
        T::eq('連携が完了しました！これから通知をこちらにお届けします。', $line->textsTo($u)[0] ?? null);
        $f = $app->db()->one('SELECT member_ref, member_plan, member_rank FROM line_friends WHERE line_user_id = ?', [$u]);
        T::eq(['member_ref' => 'm-100', 'member_plan' => 'guild', 'member_rank' => 20], $f);
        T::ok(in_array('会員連携', \Hub\Line\Friends::tagNames($app, $u), true));
        $st = j(api($app, 'GET', '/api/v1/members/m-100'));
        T::eq(true, $st['linked']);
        T::eq('active', $st['line_status']);
        T::ok(!str_contains(json_encode($st), $u), 'LINE の userId は会員サイトに返さない');
        // 使ったコードは、もう使えない
        $u2 = Sim::uid(701);
        Sim::send($app, Sim::follow($line, $u2));
        Sim::send($app, Sim::text($line, $u2, $r['code']));
        T::contains('見つからないか、期限切れ', $line->textsTo($u2)[0] ?? null);
        // プランが変わった → 台帳と絞り込みに反映
        api($app, 'PUT', '/api/v1/members/m-100', ['plan' => 'seller', 'rank' => 30, 'fields' => ['school' => '中学校']]);
        T::eq('seller', $app->db()->value('SELECT member_plan FROM line_friends WHERE line_user_id = ?', [$u]));
        T::eq([$u], Audience::userIds($app, ['member' => 'linked', 'min_rank' => 30]));
        T::eq([$u], Audience::userIds($app, ['fields' => ['member.school' => '中学校']]));
    },

    '連携コード：5回まちがえると止まる・期限切れ・別の会員につながっている LINE' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(710);
        Sim::send($app, Sim::follow($line, $u));
        for ($i = 0; $i < 5; $i++) {
            Sim::send($app, Sim::text($line, $u, str_pad((string) $i, 6, '9', STR_PAD_LEFT)));
        }
        $code = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-200']))['code'];
        Sim::send($app, Sim::text($line, $u, $code));
        T::contains('しばらくしてから', lastText($line, $u), '正しいコードでも、止めている間は受け付けない');
        $app->clock->advance(3601);
        $code2 = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-200']))['code'];
        $app->clock->advance(31 * 60);
        Sim::send($app, Sim::text($line, $u, $code2));
        T::contains('期限切れ', lastText($line, $u));
        $code3 = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-200']))['code'];
        Sim::send($app, Sim::text($line, $u, $code3));
        T::eq('m-200', $app->db()->value('SELECT member_ref FROM line_friends WHERE line_user_id = ?', [$u]));
        $code4 = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-201']))['code'];
        Sim::send($app, Sim::text($line, $u, $code4));
        T::contains('すでに別の会員に連携されています', lastText($line, $u));
    },

    '通知：切替までは止めている → オンで送る（優先・二重にしない）・未連携' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(720);
        Sim::send($app, Sim::follow($line, $u));
        $code = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-300']))['code'];
        Sim::send($app, Sim::text($line, $u, $code));
        $body = ['member_ref' => 'm-300', 'title' => '新しいコメントがあります', 'body' => '「数学の授業」に返信がありました', 'link' => '/posts/42', 'idempotency_key' => 'notif-000042'];
        $r = api($app, 'POST', '/api/v1/notifications', $body);
        T::eq(409, $r->status, '設定 genie_notify_enabled がオフの間は送らない（古い仕組みとの二重送信を防ぐ）');
        Settings::set($app, ['genie_notify_enabled' => true, 'site_url' => 'https://member.example.test']);
        $r = j(api($app, 'POST', '/api/v1/notifications', $body));
        T::eq(true, $r['delivered']);
        $dup = j(api($app, 'POST', '/api/v1/notifications', $body));
        T::eq(true, $dup['duplicate'], '同じ idempotency_key は二重に送らない');
        $held = $app->lease()->acquire('notify:' . substr(hash('sha256', 'm-300'), 0, 40), 30);
        $r = api($app, 'POST', '/api/v1/notifications', ['idempotency_key' => 'notif-000099'] + $body);
        T::eq(409, $r->status, '同じ会員への通知を受け付けている最中なら、待ってもらう（重なっても二重にしない）');
        T::eq('in_progress', j($r)['error']['code']);
        $app->lease()->release('notify:' . substr(hash('sha256', 'm-300'), 0, 40), (string) $held);
        Outbox::dispatch($app);
        T::eq("新しいコメントがあります\n「数学の授業」に返信がありました\nhttps://member.example.test/posts/42", lastText($line, $u));
        T::eq(10, (int) $app->db()->value("SELECT priority FROM line_outbox WHERE source = 'notification'"));
        $r2 = j(api($app, 'POST', '/api/v1/notifications', ['member_ref' => 'm-999', 'title' => 'x', 'idempotency_key' => 'notif-000043']));
        T::eq(false, $r2['delivered']);
        T::eq('not_linked', $r2['reason']);
        T::eq(400, api($app, 'POST', '/api/v1/notifications', ['member_ref' => 'm-300', 'title' => 'x', 'link' => 'javascript:alert(1)', 'idempotency_key' => 'notif-000044'])->status);
    },

    '連携の解除・退会' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(730);
        Sim::send($app, Sim::follow($line, $u));
        $code = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-400', 'plan' => 'guild']))['code'];
        Sim::send($app, Sim::text($line, $u, $code));
        api($app, 'PUT', '/api/v1/members/m-400', ['fields' => ['area' => '九州']]);
        $r = j(api($app, 'DELETE', '/api/v1/members/m-400/link'));
        T::eq(true, $r['unlinked']);
        T::eq(null, $app->db()->value('SELECT member_ref FROM line_friends WHERE line_user_id = ?', [$u]));
        T::ok(!in_array('会員連携', \Hub\Line\Friends::tagNames($app, $u), true));
        T::eq([], \Hub\Line\Friends::fields($app, $u), '会員の項目も外す');
        $d = j(api($app, 'DELETE', '/api/v1/members/m-400'));
        T::eq(true, $d['deleted']);
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM hub_members'));
        T::eq(4, (int) $app->db()->value("SELECT COUNT(*) FROM hub_audit_log WHERE action LIKE 'api.%'"), 'API の書き込みは記録に残る');
    },

    '会員サイトへの知らせ（連携できた）：署名つきで送り、届かなければ、やり直す' => function () {
        [$app, $line] = T::app(['member' => ['webhook_url' => 'https://127.0.0.1:9/never', 'webhook_secret' => str_repeat('s', 40)]]);
        $u = Sim::uid(740);
        Sim::send($app, Sim::follow($line, $u));
        $code = j(api($app, 'POST', '/api/v1/link-codes', ['member_ref' => 'm-500']))['code'];
        Sim::send($app, Sim::text($line, $u, $code));
        $e = $app->db()->one('SELECT event, payload, status FROM hub_site_events', [], json: ['payload']);
        T::eq('line.linked', $e['event']);
        T::eq('m-500', $e['payload']['member_ref']);
        \Hub\Line\Hub::tick($app);
        $e2 = $app->db()->one('SELECT status, attempts, next_attempt_at FROM hub_site_events');
        T::eq('queued', $e2['status'], '届かなかった（https 以外・接続できない）→ やり直し待ち');
        T::eq(1, $e2['attempts']);
    },
];
