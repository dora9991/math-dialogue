<?php
declare(strict_types=1);

/**
 * ハブの「会員サイト連携 API」を呼ぶ道具と、ハブからの知らせ（Webhook）を確かめる道具（PHP 8.1 以上・curl）。
 * 会員サイトが PHP のとき（同じ Xserver の WordPress など）に、このファイルだけをコピーして使う。
 *
 *   ★ サーバーの中だけで使う。秘密（secret）は、公開フォルダの外の設定ファイルか環境変数に置く。
 *
 *   $hub = new HubClient('https://hub.example.com', 'site', $secret);
 *   $r = $hub->createLinkCode((string) $userId, ['plan' => 'guild', 'rank' => 20]);   // ['code' => '123456', 'expires_at' => …]
 *
 * 署名の決まりは、ハブの app/src/Member/ApiAuth.php と同じ。
 */
final class HubClient
{
    private const REF_RE = '/^[A-Za-z0-9_.:@-]{1,100}$/';

    private string $baseUrl;

    public function __construct(string $baseUrl, private string $keyId, private string $secret, private int $timeoutSec = 10)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        if (!str_starts_with($this->baseUrl, 'https://') && !preg_match('#^http://(127\.0\.0\.1|localhost)(:\d+)?(/|$)#', $this->baseUrl)) {
            throw new InvalidArgumentException('baseUrl は https:// で始めてください');
        }
        if (strlen($secret) < 32) {
            throw new InvalidArgumentException('secret がありません（32文字以上）');
        }
    }

    public static function sign(string $secret, string $method, string $path, string $ts, string $nonce, string $body): string
    {
        $msg = implode("\n", ['v1', strtoupper($method), $path, $ts, $nonce, hash('sha256', $body)]);
        return 'v1=' . hash_hmac('sha256', $msg, $secret);
    }

    /** 1回呼ぶ。['status' => HTTP の状態, 'ok' => …, …] を返す（ok:false でも例外にしない） */
    public function call(string $method, string $path, ?array $body = null): array
    {
        $raw = $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $ts = (string) time();
        $nonce = bin2hex(random_bytes(18));
        $headers = [
            'X-Hub-Key: ' . $this->keyId,
            'X-Hub-Timestamp: ' . $ts,
            'X-Hub-Nonce: ' . $nonce,
            'X-Hub-Signature: ' . self::sign($this->secret, $method, $path, $ts, $nonce, $raw),
        ];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
        }
        $ch = curl_init($this->baseUrl . $path);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $this->timeoutSec,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $raw);
        }
        $res = curl_exec($ch);
        if ($res === false) {
            throw new RuntimeException('ハブにつながりません：' . curl_error($ch));
        }
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $data = json_decode((string) $res, true);
        if (!is_array($data)) {
            $data = ['ok' => false, 'error' => ['code' => 'bad_response', 'message' => "JSON ではない応答です（HTTP {$status}）"]];
        }
        return ['status' => $status] + $data;
    }

    private function must(string $method, string $path, ?array $body = null): array
    {
        $r = $this->call($method, $path, $body);
        if (empty($r['ok'])) {
            throw new RuntimeException("[hub {$r['status']} " . ($r['error']['code'] ?? 'unknown') . '] ' . ($r['error']['message'] ?? ''), (int) $r['status']);
        }
        return $r;
    }

    private static function ref(string $memberRef): string
    {
        if (!preg_match(self::REF_RE, $memberRef)) {
            throw new InvalidArgumentException('memberRef は、半角の英数字と _ . : @ - で100文字までです');
        }
        return $memberRef;
    }

    /** @param array{plan?:string,rank?:int} $opts */
    public function createLinkCode(string $memberRef, array $opts = []): array
    {
        return $this->must('POST', '/api/v1/link-codes', ['member_ref' => self::ref($memberRef)] + array_intersect_key($opts, ['plan' => 1, 'rank' => 1]));
    }

    public function getMember(string $memberRef): array
    {
        return $this->must('GET', '/api/v1/members/' . self::ref($memberRef));
    }

    /** @param array{plan?:string,rank?:int,fields?:array<string,scalar|null>} $data */
    public function upsertMember(string $memberRef, array $data): array
    {
        return $this->must('PUT', '/api/v1/members/' . self::ref($memberRef), array_intersect_key($data, ['plan' => 1, 'rank' => 1, 'fields' => 1]));
    }

    public function unlink(string $memberRef): array
    {
        return $this->must('DELETE', '/api/v1/members/' . self::ref($memberRef) . '/link');
    }

    public function deleteMember(string $memberRef): array
    {
        return $this->must('DELETE', '/api/v1/members/' . self::ref($memberRef));
    }

    /**
     * 会員への通知を LINE で送る。idempotencyKey は通知ごとに決まった値（例：'notif-' . 通知の id）。
     * つながらない・混んでいるときは、同じ idempotencyKey で数回やり直す（二重には送られない）。
     */
    public function notify(string $memberRef, string $title, ?string $body, ?string $link, string $idempotencyKey, int $retries = 2): array
    {
        $b = ['member_ref' => self::ref($memberRef), 'title' => $title, 'idempotency_key' => $idempotencyKey];
        if ($body !== null) {
            $b['body'] = $body;
        }
        if ($link !== null) {
            $b['link'] = $link;
        }
        for ($i = 0; ; $i++) {
            try {
                $r = $this->call('POST', '/api/v1/notifications', $b);
            } catch (RuntimeException $e) {
                if ($i >= $retries) {
                    throw $e;
                }
                sleep(3 ** $i);
                continue;
            }
            $again = $r['status'] >= 500 || $r['status'] === 429 || ($r['status'] === 409 && ($r['error']['code'] ?? '') === 'in_progress');
            if ($again && $i < $retries) {
                sleep(3 ** $i);
                continue;
            }
            if (empty($r['ok'])) {
                throw new RuntimeException("[hub {$r['status']} " . ($r['error']['code'] ?? 'unknown') . '] ' . ($r['error']['message'] ?? ''), (int) $r['status']);
            }
            return $r;
        }
    }

    /**
     * ハブからの知らせ（member.webhook_url に届く POST）を確かめる。
     *   $raw = file_get_contents('php://input');   // ★ JSON にする前の、届いたままの本文で
     *   if (!HubClient::verifyWebhook($secret, $_SERVER['HTTP_X_HUB_TIMESTAMP'] ?? '', $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? '', $raw)) { http_response_code(401); exit; }
     *   $ev = json_decode($raw, true);   // ['id' => …, 'event' => 'line.linked', 'payload' => ['member_ref' => …, 'linked_at' => …], 'created_at' => …]
     * 同じ知らせが2回以上届くことがある。$ev['id'] を覚えて、二重に処理しない。
     */
    public static function verifyWebhook(string $secret, string $timestamp, string $signature, string $body, int $toleranceSec = 300, ?int $now = null): bool
    {
        if (strlen($secret) < 32) {
            throw new InvalidArgumentException('secret がありません（32文字以上）');
        }
        if (!preg_match('/^\d{9,11}$/', $timestamp) || abs(($now ?? time()) - (int) $timestamp) > $toleranceSec) {
            return false;
        }
        return hash_equals('v1=' . hash_hmac('sha256', "{$timestamp}.{$body}", $secret), $signature);
    }
}
