<?php
declare(strict_types=1);

// 会員サイト用の見本（clients/）が、ハブと同じ署名を作り、ハブからの知らせを確かめられる

use Hub\Member\ApiAuth;
use Hub\Member\SiteAdapter;

require_once __DIR__ . '/../clients/php/HubClient.php';

/** clients/js/hub-client.mjs を node で動かして、結果（JSON）を受け取る。node が無ければ null */
function runJs(string $code): ?array
{
    $node = trim((string) shell_exec('command -v node 2>/dev/null'));
    if ($node === '') {
        return null;
    }
    $lib = json_encode('file://' . realpath(__DIR__ . '/../clients/js/hub-client.mjs'));
    $script = "import * as hub from {$lib};\nconst out = await (async () => { {$code} })();\nprocess.stdout.write(JSON.stringify(out));\n";
    $p = proc_open([$node, '--input-type=module', '-e', $script], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    proc_close($p);
    $j = json_decode((string) $out, true);
    if (!is_array($j)) {
        throw new RuntimeException('node の実行に失敗：' . $err);
    }
    return $j;
}

return [
    '署名：PHP の見本・JS の見本・ハブが、同じ値になる' => function () {
        $secret = str_repeat('k', 40);
        $cases = [
            ['POST', '/api/v1/link-codes', '1792000000', 'nonce-0123456789abcdef', '{"member_ref":"m-1","plan":"ギルド"}'],
            ['GET', '/api/v1/members/m-1@x.test', '1792000001', 'abcdefghijklmnop', ''],
            ['delete', '/api/v1/members/m-1/link', '1792000002', 'QRSTUVWXYZ_-0123', ''],
        ];
        foreach ($cases as [$m, $p, $ts, $n, $b]) {
            T::eq(ApiAuth::sign($secret, $m, $p, $ts, $n, $b), HubClient::sign($secret, $m, $p, $ts, $n, $b), "PHP の見本：{$m} {$p}");
        }
        $js = runJs('return Promise.all(' . json_encode(array_map(fn ($c) => ['method' => $c[0], 'path' => $c[1], 'timestamp' => $c[2], 'nonce' => $c[3], 'body' => $c[4]], $cases), JSON_UNESCAPED_UNICODE) . '.map((c) => hub.signRequest({ secret: ' . json_encode($secret) . ', ...c })));');
        if ($js === null) {
            fwrite(STDERR, "（node が無いので、JS の見本は確かめませんでした）\n");
            return;
        }
        foreach ($cases as $i => [$m, $p, $ts, $n, $b]) {
            T::eq(ApiAuth::sign($secret, $m, $p, $ts, $n, $b), $js[$i], "JS の見本：{$m} {$p}");
        }
    },

    'ハブからの知らせ：見本で確かめられる（書き換え・古い時刻は通さない）' => function () {
        $secret = str_repeat('w', 40);
        $now = 1792000000;
        $body = '{"id":7,"event":"line.linked","payload":{"member_ref":"m-1","linked_at":"2026-10-15T00:00:00.000Z"},"created_at":"2026-10-15T00:00:00.000Z"}';
        $sig = SiteAdapter::signEvent($secret, (string) $now, $body);
        T::eq(true, HubClient::verifyWebhook($secret, (string) $now, $sig, $body, 300, $now + 10));
        T::eq(false, HubClient::verifyWebhook($secret, (string) $now, $sig, str_replace('m-1', 'm-2', $body), 300, $now), '本文を書き換えた');
        T::eq(false, HubClient::verifyWebhook($secret, (string) $now, $sig, $body, 300, $now + 301), '5分より古い');
        T::eq(false, HubClient::verifyWebhook(str_repeat('x', 40), (string) $now, $sig, $body, 300, $now), '秘密が違う');
        $js = runJs(
            'const a = { secret: ' . json_encode($secret) . ', timestamp: ' . json_encode((string) $now) . ', signature: ' . json_encode($sig) . ', body: ' . json_encode($body) . ', nowMs: ' . ($now * 1000) . ' };'
            . ' return [await hub.verifyHubWebhook(a), await hub.verifyHubWebhook({ ...a, body: a.body.replace("m-1", "m-2") }), await hub.verifyHubWebhook({ ...a, nowMs: a.nowMs + 301000 })];'
        );
        if ($js !== null) {
            T::eq([true, false, false], $js, 'JS の見本');
        }
    },
];
