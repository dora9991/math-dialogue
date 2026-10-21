<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;

/**
 * 暗号化して入れる列の、出し入れの約束（どの列か＝aad をここで決める）。
 * トークの中身・受け取った Webhook の中身・送ったメッセージ・友だちのメモ・Zoom の参加者の名前とメールを暗号化する。
 */
final class Secure
{
    public const EVENT_PAYLOAD = 'line_events.payload';
    public const LOG_PREVIEW = 'line_message_log.text_preview';
    public const LOG_BODY = 'line_message_log.body';
    public const LOG_MESSAGES = 'line_message_log.messages';
    public const OUTBOX_MESSAGES = 'line_outbox.messages';
    public const FRIEND_NOTE = 'line_friends.note';
    public const ZOOM_NAME = 'line_zoom.user_name';
    public const ZOOM_EMAIL = 'line_zoom.email';

    public static function enc(App $app, string $column, ?string $plain): ?string
    {
        return $app->crypto()->encN($plain, $column);
    }

    /** 読めないとき（鍵を消した・壊れた）は、画面が止まらないよう、印の文字にする */
    public static function dec(App $app, string $column, ?string $token): ?string
    {
        if ($token === null) {
            return null;
        }
        try {
            return $app->crypto()->decrypt($token, $column);
        } catch (\Throwable $e) {
            $app->log()->error('暗号文を読めませんでした', ['column' => $column, 'error' => $e->getMessage()]);
            return '［読めません］';
        }
    }

    public static function encJson(App $app, string $column, mixed $v): ?string
    {
        return $app->crypto()->encJson($v, $column);
    }

    public static function decJson(App $app, string $column, ?string $token, bool $keep = false): mixed
    {
        if ($token === null) {
            return null;
        }
        try {
            return $app->crypto()->decJson($token, $column, $keep);
        } catch (\Throwable $e) {
            $app->log()->error('暗号文を読めませんでした', ['column' => $column, 'error' => $e->getMessage()]);
            return null;
        }
    }
}
