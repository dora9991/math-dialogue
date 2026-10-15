<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * 個別チャット：友だち1人＝1部屋（line-hub の chat.js）。
 *   ・運営が送る：友だちのメッセージから約50秒は「返信」（通数に数えない）。過ぎたら「プッシュ」（数える）
 *   ・返信トークンは1回しか使えないので、取り合わないよう、先に「自分が使う」と印をつけてから使う
 *   ・未読：部屋ごとに1つ（運営みんなで共有）
 * 本文は暗号化して持っているので、画面に出す直前に、ここで読み戻す。
 */
final class Chat
{
    /** LINE の返信トークンは「受け取ってから約1分」。余裕を見て50秒までを「返信できる」とする */
    public const REPLY_WINDOW_SEC = 50;
    /** ボタン（クイックリプライ）を送ってから、この分数は、ステップ配信を待たせる */
    public const QUICK_REPLY_GRACE_MIN = 10;

    /** ボタンつきのメッセージを送った（at=null：友だちが答えて、待つ必要がなくなった） */
    public static function markQuickReply(App $app, array $userIds, ?\DateTimeImmutable $at): void
    {
        $now = $app->now();
        foreach (array_filter($userIds) as $u) {
            $app->db()->exec(
                'INSERT INTO line_chat_state (line_user_id, quick_reply_at, updated_at)
                 SELECT ?, ?, ? FROM DUAL WHERE EXISTS (SELECT 1 FROM line_friends f WHERE f.line_user_id = ?)
                 ON DUPLICATE KEY UPDATE quick_reply_at = VALUES(quick_reply_at), updated_at = VALUES(updated_at)',
                [$u, $at, $now, $u]
            );
        }
    }

    /** 返信トークンを覚える（ルールが使わなかったときだけ、Webhook から呼ぶ） */
    public static function rememberReplyToken(App $app, string $userId, ?string $token): void
    {
        if (!$token || $userId === '') {
            return;
        }
        $now = $app->now();
        $app->db()->exec(
            'INSERT INTO line_chat_state (line_user_id, reply_token, reply_token_at, updated_at)
             SELECT ?, ?, ?, ? FROM DUAL WHERE EXISTS (SELECT 1 FROM line_friends WHERE line_user_id = ?)
             ON DUPLICATE KEY UPDATE reply_token = VALUES(reply_token), reply_token_at = VALUES(reply_token_at), updated_at = VALUES(updated_at)',
            [$userId, mb_substr($token, 0, 100), $now, $now, $userId]
        );
    }

    /** @return array{free:bool,secondsLeft:int} 返信できる残りの時間 */
    public static function replyWindowOf(?array $state, \DateTimeImmutable $now): array
    {
        if (!$state || empty($state['reply_token']) || empty($state['reply_token_at'])) {
            return ['free' => false, 'secondsLeft' => 0];
        }
        $left = self::REPLY_WINDOW_SEC - intdiv(Time::ms($now) - Time::ms(Time::parse($state['reply_token_at'])), 1000);
        return $left > 0 ? ['free' => true, 'secondsLeft' => $left] : ['free' => false, 'secondsLeft' => 0];
    }

    public static function setNeedsReply(App $app, string $userId, bool $value): void
    {
        $app->db()->exec(
            'INSERT INTO line_chat_state (line_user_id, needs_reply, updated_at)
             SELECT ?, ?, ? FROM DUAL WHERE EXISTS (SELECT 1 FROM line_friends WHERE line_user_id = ?)
             ON DUPLICATE KEY UPDATE needs_reply = VALUES(needs_reply), updated_at = VALUES(updated_at)',
            [$userId, $value, $app->now(), $userId]
        );
    }

    /** 既読にする（その部屋の、いまある最後の行まで） */
    public static function markRead(App $app, string $userId, ?string $actor = null): array
    {
        $now = $app->now();
        $app->db()->exec(
            'INSERT INTO line_chat_state (line_user_id, last_read_id, unread, read_at, read_by, updated_at)
             SELECT ?, COALESCE((SELECT MAX(id) FROM line_message_log WHERE line_user_id = ?), 0), 0, ?, ?, ?
             FROM DUAL WHERE EXISTS (SELECT 1 FROM line_friends WHERE line_user_id = ?)
             ON DUPLICATE KEY UPDATE last_read_id = GREATEST(last_read_id, VALUES(last_read_id)), unread = 0,
               read_at = VALUES(read_at), read_by = VALUES(read_by), updated_at = VALUES(updated_at)',
            [$userId, $userId, $now, $actor, $now, $userId]
        );
        return ['ok' => true];
    }

    /** 本文（暗号文）を読み戻して、先頭 n 文字 */
    private static function lastText(App $app, ?string $body, ?string $preview, int $n): ?string
    {
        $t = $body !== null ? Secure::dec($app, Secure::LOG_BODY, $body) : Secure::dec($app, Secure::LOG_PREVIEW, $preview);
        return $t === null ? null : mb_substr($t, 0, $n);
    }

    /** 部屋の一覧。filter：'' すべて／'unread' 未読あり／'needs_reply' 要対応。{ rows, total } */
    public static function listRooms(App $app, ?string $q = null, string $filter = '', int $limit = 100, int $offset = 0): array
    {
        $params = [];
        $where = [];
        if ($q !== null && $q !== '') {
            $like = '%' . Db::likeEscape(mb_strtolower($q)) . '%';
            $where[] = '(LOWER(f.display_name) LIKE ? OR LOWER(f.line_user_id) LIKE ?)';
            $params[] = $like;
            $params[] = Db::likeEscape(mb_strtolower($q)) . '%';
        }
        if ($filter === 'unread') {
            $where[] = 'COALESCE(cs.unread, 0) > 0';
        } elseif ($filter === 'needs_reply') {
            $where[] = 'COALESCE(cs.needs_reply, 0) = 1';
        } elseif ($filter !== '') {
            throw new \InvalidArgumentException('filter は unread か needs_reply です');
        }
        $cond = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $db = $app->db();
        $total = (int) $db->value("SELECT COUNT(*) FROM line_friends f LEFT JOIN line_chat_state cs ON cs.line_user_id = f.line_user_id {$cond}", $params);
        $rows = $db->all(
            "SELECT f.line_user_id, f.display_name, f.picture_url, f.status, f.followed_at,
                    COALESCE(cs.unread, 0) AS unread, COALESCE(cs.needs_reply, 0) AS needs_reply,
                    m.id AS last_id, m.direction AS last_direction, m.kind AS last_kind, m.body AS last_body, m.text_preview AS last_preview,
                    COALESCE(m.created_at, f.followed_at, f.created_at) AS last_at
             FROM line_friends f
               LEFT JOIN line_chat_state cs ON cs.line_user_id = f.line_user_id
               LEFT JOIN line_message_log m ON m.id = (SELECT MAX(x.id) FROM line_message_log x WHERE x.line_user_id = f.line_user_id)
             {$cond}
             ORDER BY (COALESCE(m.created_at, f.followed_at, f.created_at) IS NULL), COALESCE(m.created_at, f.followed_at, f.created_at) DESC, f.line_user_id
             LIMIT " . max(1, $limit) . ' OFFSET ' . max(0, $offset),
            $params
        );
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'line_user_id' => $r['line_user_id'],
                'display_name' => $r['display_name'],
                'picture_url' => $r['picture_url'],
                'status' => $r['status'],
                'followed_at' => $r['followed_at'],
                'unread' => (int) $r['unread'],
                'needs_reply' => (bool) $r['needs_reply'],
                'last_id' => $r['last_id'] === null ? null : (int) $r['last_id'],
                'last_direction' => $r['last_direction'],
                'last_kind' => $r['last_kind'],
                'last_text' => $r['last_id'] === null ? null : self::lastText($app, $r['last_body'], $r['last_preview'], 80),
                'last_at' => $r['last_at'],
            ];
        }
        return ['rows' => $out, 'total' => $total];
    }

    /** 1つの部屋のやり取り（古い順）。before（その id より前）で、さかのぼって読める */
    public static function thread(App $app, string $userId, ?int $before = null, int $limit = 50): ?array
    {
        $db = $app->db();
        $friend = $db->one('SELECT line_user_id, display_name, picture_url, status, followed_at, member_ref, member_plan, note FROM line_friends WHERE line_user_id = ?', [$userId]);
        if (!$friend) {
            return null;
        }
        $friend['note'] = Secure::dec($app, Secure::FRIEND_NOTE, $friend['note']);
        $rows = $db->all(
            'SELECT m.id, m.direction, m.kind, m.source, m.actor, m.created_at, m.body, m.text_preview, m.messages AS log_messages, o.messages AS outbox_messages
             FROM line_message_log m LEFT JOIN line_outbox o ON o.id = m.outbox_id
             WHERE m.line_user_id = ? AND (? IS NULL OR m.id < ?)
             ORDER BY m.id DESC LIMIT ' . ($limit + 1),
            [$userId, $before, $before]
        );
        $hasMore = count($rows) > $limit;
        $items = array_reverse(array_slice($rows, 0, $limit));
        $items = array_map(function (array $m) use ($app): array {
            $messages = $m['log_messages'] !== null
                ? Secure::decJson($app, Secure::LOG_MESSAGES, $m['log_messages'], true)
                : ($m['outbox_messages'] !== null ? Secure::decJson($app, Secure::OUTBOX_MESSAGES, $m['outbox_messages'], true) : null);
            return [
                'id' => (int) $m['id'],
                'direction' => $m['direction'],
                'kind' => $m['kind'],
                'source' => $m['source'],
                'actor' => $m['actor'],
                'created_at' => $m['created_at'],
                'text' => $m['body'] !== null ? Secure::dec($app, Secure::LOG_BODY, $m['body']) : Secure::dec($app, Secure::LOG_PREVIEW, $m['text_preview']),
                'messages' => $messages,
            ];
        }, $items);
        $pending = $db->all(
            "SELECT id, status, messages, created_at, last_error, source_ref AS actor FROM line_outbox
             WHERE source = 'chat' AND JSON_CONTAINS(to_user_ids, JSON_QUOTE(?)) AND status IN ('queued', 'sending', 'failed', 'skipped', 'dry_run')
             ORDER BY created_at DESC LIMIT 10",
            [$userId]
        );
        $pending = array_map(function (array $o) use ($app): array {
            $o['messages'] = Secure::decJson($app, Secure::OUTBOX_MESSAGES, $o['messages'], true);
            return $o;
        }, array_reverse($pending));
        $st = $db->one('SELECT * FROM line_chat_state WHERE line_user_id = ?', [$userId]);
        return [
            'friend' => $friend,
            'items' => $items,
            'hasMore' => $hasMore,
            'pending' => $pending,
            'state' => [
                'unread' => (int) ($st['unread'] ?? 0),
                'needsReply' => (bool) ($st['needs_reply'] ?? false),
                'lastReadId' => (int) ($st['last_read_id'] ?? 0),
                'readAt' => $st['read_at'] ?? null,
                'readBy' => $st['read_by'] ?? null,
            ],
            'replyWindow' => self::replyWindowOf($st, $app->now()),
        ];
    }

    /**
     * 運営が、チャットで1人に送る。
     * @return array{ok:true,via:string,cost:int,outboxId?:string,dryRun?:bool}|array{ok:false,reason:string,message:string}
     */
    public static function send(App $app, string $userId, array $messages, ?string $actor = null, string $source = 'chat'): array
    {
        Msg::validate($messages);
        $db = $app->db();
        $friend = $db->one('SELECT status FROM line_friends WHERE line_user_id = ?', [$userId]);
        if (!$friend) {
            return ['ok' => false, 'reason' => 'not_found', 'message' => '友だちが見つかりません'];
        }
        if ($friend['status'] !== 'active') {
            return ['ok' => false, 'reason' => 'not_active', 'message' => 'ブロックされているため、送れません'];
        }
        $s = Settings::get($app);
        if (!$s['enabled']) {
            return ['ok' => false, 'reason' => 'stopped', 'message' => '送信を止めています（画面の上の「送信を止める」をオフにすると、送れます）'];
        }
        $done = fn () => self::setNeedsReply($app, $userId, false); // 運営が返したら「要対応」は外す
        $st = $db->one('SELECT reply_token, reply_token_at FROM line_chat_state WHERE line_user_id = ?', [$userId]);
        if (self::replyWindowOf($st, $app->now())['free']) {
            // 返信トークンを「自分が使う」と先に決める（ほかの運営やルールと、取り合わない）
            $claimed = $db->exec(
                'UPDATE line_chat_state SET reply_token = NULL, reply_token_at = NULL WHERE line_user_id = ? AND reply_token = ?',
                [$userId, $st['reply_token']]
            );
            if ($claimed > 0) {
                if ($s['dry_run']) {
                    Reply::logOut($app, $userId, 'reply(dry-run)', $source, $messages, $actor);
                    $done();
                    return ['ok' => true, 'via' => 'reply', 'cost' => 0, 'dryRun' => true];
                }
                $res = $app->line()->reply((string) $st['reply_token'], $messages);
                if ($res['ok']) {
                    Reply::logOut($app, $userId, 'reply', $source, $messages, $actor);
                    $done();
                    return ['ok' => true, 'via' => 'reply', 'cost' => 0];
                }
                if ($res['status'] !== 400) {
                    // 届いたか分からない（通信の失敗・LINE 側の障害）。二重に届かないよう、プッシュでは送り直さない
                    return ['ok' => false, 'reason' => 'unknown', 'message' => 'LINE から返事がなく、届いたか分かりません。二重に届かないよう、送り直していません。少し待って、相手の画面かこの画面で確かめてから、もう一度送ってください'];
                }
                // 400＝期限切れ・使用済み：プッシュで送る
            }
        }
        $outboxId = Outbox::enqueue($app, [$userId], $messages, $source, $actor, 30);
        $done();
        return ['ok' => true, 'via' => 'push', 'cost' => 1, 'outboxId' => $outboxId];
    }

    /** 画面の右上の「新着」用 */
    public static function summary(App $app, ?int $sinceId = null): array
    {
        $db = $app->db();
        $u = $db->one(
            'SELECT CAST(COALESCE(SUM(CASE WHEN cs.unread > 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS rooms,
                    CAST(COALESCE(SUM(cs.unread), 0) AS SIGNED) AS total,
                    CAST(COALESCE(SUM(CASE WHEN cs.needs_reply THEN 1 ELSE 0 END), 0) AS SIGNED) AS needs_reply
             FROM line_chat_state cs JOIN line_friends f ON f.line_user_id = cs.line_user_id'
        );
        $maxInId = (int) $db->value("SELECT COALESCE(MAX(id), 0) FROM line_message_log WHERE direction = 'in'");
        $news = [];
        if ($sinceId !== null) {
            foreach ($db->all(
                "SELECT m.id, m.line_user_id, m.kind, m.body, m.text_preview, f.display_name
                 FROM line_message_log m LEFT JOIN line_friends f ON f.line_user_id = m.line_user_id
                 WHERE m.direction = 'in' AND m.id > ? ORDER BY m.id DESC LIMIT 5",
                [$sinceId]
            ) as $r) {
                $news[] = ['id' => (int) $r['id'], 'line_user_id' => $r['line_user_id'], 'kind' => $r['kind'], 'text' => self::lastText($app, $r['body'], $r['text_preview'], 60), 'display_name' => $r['display_name']];
            }
        }
        return ['unreadRooms' => (int) ($u['rooms'] ?? 0), 'unreadTotal' => (int) ($u['total'] ?? 0), 'needsReply' => (int) ($u['needs_reply'] ?? 0), 'maxInId' => $maxInId, 'news' => $news];
    }
}
