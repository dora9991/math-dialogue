<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;

/**
 * リプライ（応答）：友だちの操作への返信。通数に数えない。リプライトークンは1回・短時間しか使えない（line-hub の reply.js）。
 * 5件を超える分や、トークンが使えなかった分は、設定で許せばプッシュ（通数を使う）で送る。
 * やり取りの記録（line_message_log）の本文は暗号化して入れる。
 */
final class Reply
{
    /** 送った記録（返信など、送信の関所を通らないもの）。messages はそのまま残す（ボタンつきの質問も、チャットで見られる） */
    public static function logOut(App $app, array|string $userIds, string $kind, string $source, mixed $messages, ?string $actor = null): void
    {
        $ids = is_array($userIds) ? array_values($userIds) : [$userIds];
        if (!$ids) {
            return;
        }
        $preview = Secure::enc($app, Secure::LOG_PREVIEW, Msg::preview($messages));
        $body = Secure::enc($app, Secure::LOG_BODY, Msg::bodyText($messages));
        $msgs = Secure::encJson($app, Secure::LOG_MESSAGES, $messages);
        $now = $app->now();
        $params = [];
        $rows = [];
        foreach ($ids as $u) {
            $rows[] = "(?, 'out', ?, ?, ?, ?, ?, ?, ?)";
            array_push($params, $u, $kind, $source, $preview, $body, $msgs, $actor, $now);
        }
        $app->db()->exec(
            'INSERT INTO line_message_log (line_user_id, direction, kind, source, text_preview, body, messages, actor, created_at) VALUES ' . implode(',', $rows),
            $params
        );
    }

    /**
     * 受け取った記録（友だちからのメッセージ・友だち追加・ブロックのお知らせ）。チャットの未読に数える。
     * eventId があれば、同じイベントを処理し直しても二重に記録しない。記録した行の id（二重なら null）
     */
    public static function logIn(App $app, string $userId, string $kind, ?string $text, ?string $eventId = null): ?int
    {
        $t = (string) $text;
        $now = $app->now();
        $db = $app->db();
        $n = $db->exec(
            "INSERT INTO line_message_log (line_user_id, direction, kind, source, text_preview, body, event_id, created_at)
             VALUES (?, 'in', ?, NULL, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id",
            [$userId, $kind, Secure::enc($app, Secure::LOG_PREVIEW, mb_substr($t, 0, 200)), Secure::enc($app, Secure::LOG_BODY, mb_substr($t, 0, 5000)), $eventId, $now]
        );
        if ($n !== 1) {
            return null;
        }
        $id = $db->lastId();
        // 部屋の未読を1つ増やす（友だちの行が無いときは、何もしない）。友だちが何か送ってきた＝ボタンを待つ必要はない
        $db->exec(
            'INSERT INTO line_chat_state (line_user_id, unread, updated_at)
             SELECT ?, 1, ? FROM DUAL WHERE EXISTS (SELECT 1 FROM line_friends WHERE line_user_id = ?)
             ON DUPLICATE KEY UPDATE unread = unread + 1, quick_reply_at = NULL, updated_at = VALUES(updated_at)',
            [$userId, $now, $userId]
        );
        return $id;
    }

    /** env の返信のたまり場を、リプライ（無料）で返す。@return array{replied:int,pushed:int,tokenUsed:bool} */
    public static function flush(App $app, Env $env): array
    {
        $buf = $env->replyBuffer->take();
        $out = ['replied' => 0, 'pushed' => 0, 'tokenUsed' => false];
        if (!$buf) {
            return $out;
        }
        // ボタン（クイックリプライ）つきは、最後に回す（あとに別のメッセージが届くと、ボタンが消えるため）
        $plain = array_values(array_filter($buf, fn ($m) => empty($m['quickReply'])));
        $qr = array_values(array_filter($buf, fn ($m) => !empty($m['quickReply'])));
        $msgs = array_merge($plain, $qr);
        $source = $env->replySource ?? 'rule';
        $settings = Settings::get($app);
        $parts = Msg::chunk($msgs, 5);
        $first = $parts[0];
        Msg::validate($first);
        $rest = array_slice($parts, 1);

        if (!$settings['enabled']) {
            $app->log()->warn('停止スイッチが入っているため、返信を送りません');
            return $out;
        }
        if ($settings['dry_run']) {
            self::logOut($app, $env->userId, 'reply(dry-run)', $source, $first);
            return $out;
        }
        $replied = false;
        if ($env->replyToken) {
            $res = $app->line()->reply($env->replyToken, $first);
            $out['tokenUsed'] = true; // 成功でも失敗でも、このトークンは、もう使わない
            if ($res['ok']) {
                $replied = true;
                $out['replied'] = count($first);
                self::logOut($app, $env->userId, 'reply', $source, $first);
                if (Msg::hasQuickReply($first)) {
                    Chat::markQuickReply($app, [$env->userId], $app->now());
                }
            } elseif ($res['status'] !== 400) {
                // 5xx・接続断：届いたか分からないので、プッシュで重ねて送らない（二重送信を避ける）
                $app->log()->warn('リプライに失敗しました', ['status' => $res['status']]);
                return $out;
            }
        }
        // リプライできなかった（トークンなし・期限切れ・使用済み）分と、5件を超えた分はプッシュで送る
        $overflow = $replied ? $rest : $parts;
        if ($overflow && $settings['reply_overflow_push']) {
            foreach ($overflow as $part) {
                Outbox::enqueue($app, [$env->userId], $part, 'reply_fallback', null, 40);
                $out['pushed'] += count($part);
            }
        }
        return $out;
    }
}
