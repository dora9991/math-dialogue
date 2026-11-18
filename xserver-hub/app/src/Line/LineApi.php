<?php
declare(strict_types=1);

namespace Hub\Line;

/**
 * LINE Messaging API の呼び方（本物は LineClient、テストは FakeLine）。
 * 失敗は例外にせず、{ ok, status, body, retryAfterSec, error } で返す（送信の関所が、再送するかを決める）。
 *   status 0 ＝ つながらなかった（通信の失敗）
 */
interface LineApi
{
    public function channelSecret(): string;

    /** @return array{ok:bool,status:int,body:mixed,retryAfterSec:?int,error:?string} */
    public function reply(string $replyToken, array $messages): array;

    public function push(string $to, array $messages, ?string $retryKey = null): array;

    /** @param list<string> $to */
    public function multicast(array $to, array $messages, ?string $retryKey = null): array;

    public function getProfile(string $userId): array;

    /** 今月の上限（{ type, value }） */
    public function quota(): array;

    /** 今月、LINE が数えた送信数（{ totalUsage }）。リプライは数えない */
    public function quotaConsumption(): array;

    /** ボットの情報（設定の確かめ用） */
    public function botInfo(): array;

    public function getWebhookEndpoint(): array;

    public function setWebhookEndpoint(string $url): array;

    public function testWebhookEndpoint(?string $url = null): array;
}
