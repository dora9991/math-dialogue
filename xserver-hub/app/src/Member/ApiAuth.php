<?php
declare(strict_types=1);

namespace Hub\Member;

use Hub\Kernel\App;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Time;

/**
 * 会員サイト → ハブ の API の、呼び出し元の確かめ（サーバー同士の署名つき通信）。
 *
 * ヘッダー：
 *   X-Hub-Key        … 鍵の名前（config.php の member.api_keys の名前）
 *   X-Hub-Timestamp  … UNIX 時刻（秒）。ハブの時計と5分以上ずれていたら断る
 *   X-Hub-Nonce      … 毎回ちがう文字（16〜64文字の英数字）。一度使ったものは二度と通さない（使い回しの防止）
 *   X-Hub-Signature  … v1=HMAC-SHA256(秘密, "v1\n{METHOD}\n{PATH}\n{TIMESTAMP}\n{NONCE}\n{本文の SHA-256（16進）}") の16進
 *
 * 鍵ごとに、使える範囲（scopes：link・members・notify）と、許す IP（allow_ips。空なら制限なし）を決められる。
 * 秘密は会員サイトのサーバーの中だけに置く（ブラウザ・アプリには絶対に入れない）。
 */
final class ApiAuth
{
    public const SKEW_SEC = 300;

    /** 会員サイト側で使う：署名を作る（clients/ のサンプルと同じ計算） */
    public static function sign(string $secret, string $method, string $path, string $ts, string $nonce, string $body): string
    {
        $msg = implode("\n", ['v1', strtoupper($method), $path, $ts, $nonce, hash('sha256', $body)]);
        return 'v1=' . hash_hmac('sha256', $msg, $secret);
    }

    /**
     * @return array{ok:true,keyId:string,scopes:list<string>}|array{ok:false,status:int,code:string,message:string}
     */
    public static function check(App $app, Request $req, string $scope): array
    {
        $deny = static fn (int $s, string $c, string $m): array => ['ok' => false, 'status' => $s, 'code' => $c, 'message' => $m];
        $keyId = $req->header('x-hub-key');
        $ts = $req->header('x-hub-timestamp');
        $nonce = $req->header('x-hub-nonce');
        $sig = $req->header('x-hub-signature');
        if ($keyId === '' || $ts === '' || $nonce === '' || $sig === '') {
            return $deny(401, 'unauthenticated', '署名のヘッダーが足りません');
        }
        $keys = $app->config->arr('member.api_keys');
        $key = is_array($keys[$keyId] ?? null) ? $keys[$keyId] : null;
        $secret = is_string($key['secret'] ?? null) ? $key['secret'] : '';
        if (!$key || strlen($secret) < 32 || !empty($key['disabled'])) {
            // 鍵が無いことも、署名ちがいと同じ答え（どの名前の鍵があるかを、外から探らせない）
            return $deny(401, 'unauthenticated', '署名を確かめられません');
        }
        $allow = $key['allow_ips'] ?? [];
        if (is_array($allow) && $allow && !in_array($req->ip, $allow, true)) {
            $app->log()->warn('会員サイトの API：許していない IP からの呼び出し', ['key' => $keyId, 'ip' => $req->ip]);
            return $deny(403, 'forbidden', 'この場所からは呼び出せません');
        }
        if (!preg_match('/^\d{9,11}$/', $ts) || abs((int) $ts - intdiv(Time::ms($app->now()), 1000)) > self::SKEW_SEC) {
            return $deny(401, 'unauthenticated', '時刻がずれています（サーバーの時計を確かめてください）');
        }
        if (!preg_match('/^[A-Za-z0-9_-]{16,64}$/', $nonce)) {
            return $deny(401, 'unauthenticated', 'nonce の形が違います（16〜64文字の英数字）');
        }
        $expect = self::sign($secret, $req->method, $req->path, $ts, $nonce, $req->body);
        if (!hash_equals($expect, $sig)) {
            $app->log()->warn('会員サイトの API：署名が合いません', ['key' => $keyId, 'ip' => $req->ip, 'path' => $req->path]);
            if (!$app->limiter()->hit('api_auth_fail', 20, 3600)['ok']) {
                $app->alerts()->raise('api_auth_fail', '会員サイトの API に、署名の合わない呼び出しが続いています', "この1時間に、署名の合わない呼び出しが20回を超えました（最後：IP {$req->ip}）。\n鍵を入れ替えた直後でなければ、誰かが試している可能性があります。", 120);
            }
            return $deny(401, 'unauthenticated', '署名を確かめられません');
        }
        // 使い回し（リプレイ）の防止：同じ鍵で同じ nonce は二度と通さない（時刻のずれの幅＋αのあいだ覚える）
        $n = $app->db()->exec(
            'INSERT INTO hub_api_nonces (key_id, nonce, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE key_id = key_id',
            [substr($keyId, 0, 40), $nonce, Time::addSeconds($app->now(), self::SKEW_SEC * 2 + 60)]
        );
        if ($n === 0) {
            return $deny(401, 'unauthenticated', 'この呼び出しは、すでに受け付けています（nonce の使い回し）');
        }
        $scopes = array_values(array_filter((array) ($key['scopes'] ?? []), 'is_string'));
        if (!in_array($scope, $scopes, true)) {
            return $deny(403, 'forbidden', "この鍵には「{$scope}」の権限がありません");
        }
        $rl = $app->limiter()->hit('api:' . $keyId, (int) ($key['rate_per_min'] ?? 600), 60);
        if (!$rl['ok']) {
            return $deny(429, 'rate_limited', '呼び出しが多すぎます。しばらくしてから、もう一度お試しください');
        }
        return ['ok' => true, 'keyId' => $keyId, 'scopes' => $scopes];
    }
}
