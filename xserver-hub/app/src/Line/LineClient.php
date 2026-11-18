<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;

/**
 * LINE Messaging API の薄いクライアント（PHP 標準の curl だけ）。
 *
 *   ・アクセストークンは「ステートレス」を既定にする（チャネルID＋シークレットから都度発行・約15分で期限切れ。
 *     LINE の開発ガイドラインが短期トークンを推奨）。発行したトークンは、暗号化して DB（hub_kv）に期限まで覚える。
 *     長期トークン（line.access_token）を設定した場合は、それを使う
 *   ・push / multicast には X-Line-Retry-Key を必ず付ける（落ちて送り直しても、LINE 側で1回だけになる）
 *   ・通信は https だけ。証明書の確認は切らない。つながるまで5秒・全体で15秒で諦める
 */
final class LineClient implements LineApi
{
    private ?string $tok = null;
    private int $tokExp = 0;

    public function __construct(
        private string $channelId,
        private string $secret,
        private string $accessToken,
        private string $baseUrl,
        private App $app,
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    public function channelSecret(): string
    {
        return $this->secret;
    }

    private function token(bool $force = false): string
    {
        if ($this->accessToken !== '') {
            return $this->accessToken;
        }
        $now = time();
        if (!$force && $this->tok !== null && $this->tokExp - 60 > $now) {
            return $this->tok;
        }
        $kv = $this->app->kv();
        $crypto = $this->app->crypto();
        if (!$force) {
            $cached = $kv->get('line.stateless_token');
            if ($cached !== null) {
                try {
                    $o = Json::dec($crypto->decrypt($cached, 'hub_kv.line_token'));
                    if (is_array($o) && ($o['exp'] ?? 0) - 60 > $now && is_string($o['token'] ?? null)) {
                        $this->tok = $o['token'];
                        $this->tokExp = (int) $o['exp'];
                        return $this->tok;
                    }
                } catch (\Throwable) {
                    // 読めない（鍵を変えた等）なら、作り直す
                }
            }
        }
        if ($this->channelId === '' || $this->secret === '') {
            throw new \RuntimeException('LINE のチャネルID とチャネルシークレットが必要です（config.php の line.channel_id・line.channel_secret）');
        }
        $r = $this->http('POST', '/oauth2/v3/token', http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $this->channelId,
            'client_secret' => $this->secret,
        ]), ['Content-Type: application/x-www-form-urlencoded']);
        $tok = is_array($r['body']) ? ($r['body']['access_token'] ?? null) : null;
        if (!$r['ok'] || !is_string($tok)) {
            throw new \RuntimeException("LINE のトークンを発行できませんでした ({$r['status']})");
        }
        $this->tok = $tok;
        $this->tokExp = $now + (int) ($r['body']['expires_in'] ?? 900);
        $kv->set('line.stateless_token', $crypto->encrypt(Json::enc(['token' => $tok, 'exp' => $this->tokExp]), 'hub_kv.line_token'), max(60, $this->tokExp - $now));
        return $tok;
    }

    private function call(string $method, string $path, mixed $json = null, ?string $retryKey = null, bool $retried = false): array
    {
        try {
            $token = $this->token($retried);
        } catch (\Throwable $e) {
            return ['ok' => false, 'status' => 0, 'body' => null, 'retryAfterSec' => null, 'error' => $e->getMessage()];
        }
        $headers = ['Authorization: Bearer ' . $token];
        if ($json !== null) {
            $headers[] = 'Content-Type: application/json';
        }
        if ($retryKey !== null) {
            $headers[] = 'X-Line-Retry-Key: ' . $retryKey;
        }
        $r = $this->http($method, $path, $json === null ? null : Json::enc($json), $headers);
        // ステートレストークンが失効していたら、1回だけ作り直す
        if ($r['status'] === 401 && $this->accessToken === '' && !$retried) {
            return $this->call($method, $path, $json, $retryKey, true);
        }
        return $r;
    }

    /** @param list<string> $headers */
    private function http(string $method, string $path, ?string $body, array $headers): array
    {
        $ch = curl_init($this->baseUrl . $path);
        $respHeaders = [];
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS | (str_starts_with($this->baseUrl, 'http://127.0.0.1') ? CURLPROTO_HTTP : 0),
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HEADERFUNCTION => static function ($ch, string $line) use (&$respHeaders): int {
                $p = strpos($line, ':');
                if ($p !== false) {
                    $respHeaders[strtolower(trim(substr($line, 0, $p)))] = trim(substr($line, $p + 1));
                }
                return strlen($line);
            },
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $text = curl_exec($ch);
        if ($text === false) {
            $err = curl_error($ch);
            return ['ok' => false, 'status' => 0, 'body' => null, 'retryAfterSec' => null, 'error' => $err];
        }
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $parsed = null;
        if ($text !== '') {
            $parsed = Json::tryDec($text) ?? ['raw' => mb_substr($text, 0, 500)];
        }
        $ra = (int) ($respHeaders['retry-after'] ?? 0);
        return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'body' => $parsed, 'retryAfterSec' => $ra > 0 ? $ra : null, 'error' => null];
    }

    public function reply(string $replyToken, array $messages): array
    {
        return $this->call('POST', '/v2/bot/message/reply', ['replyToken' => $replyToken, 'messages' => $messages]);
    }

    public function push(string $to, array $messages, ?string $retryKey = null): array
    {
        return $this->call('POST', '/v2/bot/message/push', ['to' => $to, 'messages' => $messages], $retryKey);
    }

    public function multicast(array $to, array $messages, ?string $retryKey = null): array
    {
        return $this->call('POST', '/v2/bot/message/multicast', ['to' => array_values($to), 'messages' => $messages], $retryKey);
    }

    public function getProfile(string $userId): array
    {
        return $this->call('GET', '/v2/bot/profile/' . rawurlencode($userId));
    }

    public function quota(): array
    {
        return $this->call('GET', '/v2/bot/message/quota');
    }

    public function quotaConsumption(): array
    {
        return $this->call('GET', '/v2/bot/message/quota/consumption');
    }

    public function botInfo(): array
    {
        return $this->call('GET', '/v2/bot/info');
    }

    public function getWebhookEndpoint(): array
    {
        return $this->call('GET', '/v2/bot/channel/webhook/endpoint');
    }

    public function setWebhookEndpoint(string $url): array
    {
        return $this->call('PUT', '/v2/bot/channel/webhook/endpoint', ['endpoint' => $url]);
    }

    public function testWebhookEndpoint(?string $url = null): array
    {
        return $this->call('POST', '/v2/bot/channel/webhook/test', $url === null ? new \stdClass() : ['endpoint' => $url]);
    }
}
