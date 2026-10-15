<?php
declare(strict_types=1);

namespace Hub\Line;

/**
 * 模擬の LINE（テスト・ローカル確認専用。本番では使わない）。line-hub の dev/mock-line-core.js と同じ決まりを再現する：
 *   ・push / multicast：宛先は U＋32桁の16進／メッセージは5件まで／テキストは5000字まで／multicast は500人まで
 *   ・X-Line-Retry-Key：同じキーで再送すると 409（二重配信しない）
 *   ・リプライトークン：1回しか使えない。"expired-" で始まるものは 400
 *   ・ブロック中のユーザーには届かない（通数にも数えない）。通数＝送信対象になった人数。リプライは数えない
 *   ・故障の再現：fail() で 429 / 500 / 接続断（0）を何回か返す
 */
final class FakeLine implements LineApi
{
    /** @var list<array{userId:string,messages:array,via:string,retryKey:?string,seq:int}> */
    public array $deliveries = [];
    /** @var list<array{method:string,path:string,body:mixed}> */
    public array $requests = [];
    public int $billing = 0;
    public array $quota = ['type' => 'limited', 'value' => 200];
    /** @var array<string,true> */
    private array $retryKeys = [];
    /** @var array<string,true> */
    private array $usedReplyTokens = [];
    /** @var array<string,string> replyToken → userId */
    public array $replyTokenOwners = [];
    /** @var array<string,true> */
    public array $blocked = [];
    /** @var array<string,array> */
    public array $profiles = [];
    /** @var list<array{re:string,status:int,remaining:int,retryAfter:?int}> */
    private array $faults = [];
    private int $seq = 0;
    public ?string $webhookEndpoint = null;

    public function __construct(private string $secret = 'test-secret')
    {
    }

    public function channelSecret(): string
    {
        return $this->secret;
    }

    public function fail(string $pathRe, int $status = 500, int $times = 1, ?int $retryAfter = null): void
    {
        $this->faults[] = ['re' => $pathRe, 'status' => $status, 'remaining' => $times, 'retryAfter' => $retryAfter];
    }

    public function setProfile(string $userId, array $profile): void
    {
        $this->profiles[$userId] = $profile;
    }

    public function block(string $userId): void
    {
        $this->blocked[$userId] = true;
    }

    public function unblock(string $userId): void
    {
        unset($this->blocked[$userId]);
    }

    /** @return list<string> その人に届いた文字のメッセージ */
    public function textsTo(string $userId): array
    {
        $out = [];
        foreach ($this->deliveries as $d) {
            if ($d['userId'] !== $userId) {
                continue;
            }
            foreach ($d['messages'] as $m) {
                if (($m['type'] ?? '') === 'text') {
                    $out[] = $m['text'];
                }
            }
        }
        return $out;
    }

    public function deliveriesTo(string $userId): array
    {
        return array_values(array_filter($this->deliveries, fn ($d) => $d['userId'] === $userId));
    }

    public function apiCalls(string $suffix): array
    {
        return array_values(array_filter($this->requests, fn ($r) => str_ends_with($r['path'], $suffix)));
    }

    private function res(int $status, mixed $body = null, ?int $retryAfter = null): array
    {
        return ['ok' => $status >= 200 && $status < 300, 'status' => $status, 'body' => $body, 'retryAfterSec' => $retryAfter, 'error' => $status === 0 ? 'connection failed' : null];
    }

    private function fault(string $path): ?array
    {
        foreach ($this->faults as $i => $f) {
            if ($f['remaining'] > 0 && preg_match($f['re'], $path)) {
                $this->faults[$i]['remaining']--;
                return $this->res($f['status'], ['message' => "injected {$f['status']}"], $f['retryAfter']);
            }
        }
        return null;
    }

    private function checkMessages(mixed $messages): ?string
    {
        if (!is_array($messages) || !$messages || !array_is_list($messages)) {
            return 'messages: must not be empty';
        }
        if (count($messages) > 5) {
            return 'messages: must be less than or equal to 5';
        }
        foreach ($messages as $m) {
            if (!is_array($m) || !is_string($m['type'] ?? null)) {
                return 'messages: invalid message object';
            }
            if ($m['type'] === 'text') {
                $len = is_string($m['text'] ?? null) ? \Hub\Kernel\Text::jsLength($m['text']) : 0;
                if ($len === 0 || $len > 5000) {
                    return 'messages[].text: must be between 1 and 5000 characters';
                }
            }
            if ($m['type'] === 'video' && (!str_starts_with((string) ($m['originalContentUrl'] ?? ''), 'https://') || !str_starts_with((string) ($m['previewImageUrl'] ?? ''), 'https://'))) {
                return 'messages[].originalContentUrl/previewImageUrl: must be https';
            }
            if (isset($m['quickReply'])) {
                $items = $m['quickReply']['items'] ?? null;
                if (!is_array($items) || !$items || count($items) > 13) {
                    return 'messages[].quickReply.items: must be between 1 and 13';
                }
                foreach ($items as $it) {
                    $a = $it['action'] ?? [];
                    $label = (string) ($a['label'] ?? '');
                    if (($it['type'] ?? '') !== 'action' || empty($a['type']) || $label === '' || mb_strlen($label) > 20) {
                        return 'messages[].quickReply.items[]: invalid';
                    }
                    if ($a['type'] === 'postback' && (($a['data'] ?? '') === '' || mb_strlen((string) $a['data']) > 300)) {
                        return 'messages[].quickReply.items[].action.data: invalid';
                    }
                }
            }
        }
        return null;
    }

    public function reply(string $replyToken, array $messages): array
    {
        $this->requests[] = ['method' => 'POST', 'path' => '/v2/bot/message/reply', 'body' => ['replyToken' => $replyToken, 'messages' => $messages]];
        if ($f = $this->fault('/v2/bot/message/reply')) {
            return $f;
        }
        if ($err = $this->checkMessages($messages)) {
            return $this->res(400, ['message' => 'The request body has 1 error(s)', 'details' => [['message' => $err]]]);
        }
        if ($replyToken === '' || str_starts_with($replyToken, 'expired-') || isset($this->usedReplyTokens[$replyToken])) {
            return $this->res(400, ['message' => 'Invalid reply token']);
        }
        $this->usedReplyTokens[$replyToken] = true;
        $uid = $this->replyTokenOwners[$replyToken] ?? null;
        if ($uid !== null && !isset($this->blocked[$uid])) {
            $this->deliveries[] = ['userId' => $uid, 'messages' => $messages, 'via' => 'reply', 'retryKey' => null, 'seq' => ++$this->seq];
        }
        return $this->res(200, ['sentMessages' => []]);
    }

    public function push(string $to, array $messages, ?string $retryKey = null): array
    {
        return $this->send('/v2/bot/message/push', [$to], $messages, $retryKey, 'push');
    }

    public function multicast(array $to, array $messages, ?string $retryKey = null): array
    {
        return $this->send('/v2/bot/message/multicast', $to, $messages, $retryKey, 'multicast');
    }

    private function send(string $path, array $to, array $messages, ?string $retryKey, string $via): array
    {
        $this->requests[] = ['method' => 'POST', 'path' => $path, 'body' => ['to' => $via === 'push' ? $to[0] : $to, 'messages' => $messages], 'retryKey' => $retryKey];
        if ($f = $this->fault($path)) {
            return $f;
        }
        if ($err = $this->checkMessages($messages)) {
            return $this->res(400, ['message' => 'The request body has 1 error(s)', 'details' => [['message' => $err]]]);
        }
        if ($via === 'multicast' && (!$to || count($to) > 500)) {
            return $this->res(400, ['message' => "The property, 'to', in the request body is invalid"]);
        }
        foreach ($to as $u) {
            if (!is_string($u) || !preg_match('/^U[0-9a-f]{32}$/', $u)) {
                return $this->res(400, ['message' => "The property, 'to', in the request body is invalid"]);
            }
        }
        if ($retryKey !== null) {
            if (isset($this->retryKeys[$retryKey])) {
                return $this->res(409, ['message' => 'The retry key is already accepted']);
            }
            $this->retryKeys[$retryKey] = true;
        }
        foreach ($to as $u) {
            if (isset($this->blocked[$u])) {
                continue;
            }
            $this->deliveries[] = ['userId' => $u, 'messages' => $messages, 'via' => $via, 'retryKey' => $retryKey, 'seq' => ++$this->seq];
            $this->billing++;
        }
        return $this->res(200, new \stdClass());
    }

    public function getProfile(string $userId): array
    {
        $this->requests[] = ['method' => 'GET', 'path' => '/v2/bot/profile/' . $userId, 'body' => null];
        if ($f = $this->fault('/v2/bot/profile/' . $userId)) {
            return $f;
        }
        $p = $this->profiles[$userId] ?? null;
        return $p !== null && !isset($this->blocked[$userId]) ? $this->res(200, ['userId' => $userId] + $p) : $this->res(404, ['message' => 'Not found']);
    }

    public function quota(): array
    {
        return $this->res(200, $this->quota);
    }

    public function quotaConsumption(): array
    {
        return $this->res(200, ['totalUsage' => $this->billing]);
    }

    public function botInfo(): array
    {
        return $this->res(200, ['userId' => 'Ufake', 'basicId' => '@fake', 'displayName' => '模擬のLINE', 'chatMode' => 'bot', 'markAsReadMode' => 'auto']);
    }

    public function getWebhookEndpoint(): array
    {
        return $this->res(200, ['endpoint' => $this->webhookEndpoint ?? '', 'active' => $this->webhookEndpoint !== null]);
    }

    public function setWebhookEndpoint(string $url): array
    {
        $this->webhookEndpoint = $url;
        return $this->res(200, new \stdClass());
    }

    public function testWebhookEndpoint(?string $url = null): array
    {
        return $this->res(200, ['success' => true, 'timestamp' => gmdate('c'), 'statusCode' => 200, 'reason' => 'OK', 'detail' => '200']);
    }
}
