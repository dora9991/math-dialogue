<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * Webhook の受け口（line-hub の webhook.js）。署名を検証し、イベントを1件ずつ処理する。
 *
 *   ・署名が不正なら 400。チャネルシークレットが未設定なら 500（ログに理由）
 *   ・LINE は 2xx 以外だと再送する → webhookEventId で重複排除する。失敗したイベントは processed_at が空のまま残り、毎分の処理が、もう一度処理する
 *   ・受け取った中身（payload）は暗号化して残す（トークの本文が入っているため）
 *   ・「先に受け付けて、あとで処理」：受け取ったイベントを DB に入れてから処理する。PHP-FPM なら 200 を先に返してから処理する（index.php）
 */
final class Webhook
{
    private const KIND_LABEL = ['image' => '画像', 'video' => '動画', 'audio' => '音声', 'file' => 'ファイル', 'location' => '位置情報', 'sticker' => 'スタンプ'];
    private const NOTIFY_MESSAGE_THROTTLE_MIN = 10;

    /**
     * 署名を確かめ、イベントを受け付ける（DB に入れる）。処理はまだしない。
     * @return array{status:int,body:string,events:list<array>}
     */
    public static function accept(App $app, string $rawBody, string $signature): array
    {
        try {
            $valid = Signature::verify($rawBody, $signature, $app->line()->channelSecret());
        } catch (\RuntimeException $e) {
            $app->log()->error($e->getMessage());
            return ['status' => 500, 'body' => 'channel secret is not configured', 'events' => []];
        }
        if (!$valid) {
            $app->log()->warn('LINE の Webhook の署名が合いません（偽物の可能性）');
            if (!$app->limiter()->hit('line_sig_fail', 20, 3600)['ok']) {
                $app->alerts()->raise('line_sig_fail', 'LINE の Webhook に、署名の合わない呼び出しが続いています', "この1時間に、署名の合わない呼び出しが20回を超えました。\n誰かが偽の Webhook を送っているか、チャネルシークレットを変えたのに config.php を直していない可能性があります。", 120);
            }
            return ['status' => 400, 'body' => 'invalid signature', 'events' => []];
        }
        $payload = Json::tryDec($rawBody);
        if (!is_array($payload)) {
            return ['status' => 400, 'body' => 'invalid json', 'events' => []];
        }
        $events = is_array($payload['events'] ?? null) ? array_values(array_filter($payload['events'], 'is_array')) : [];
        $accepted = [];
        foreach ($events as $ev) {
            $id = self::eventId($ev);
            $userId = is_string($ev['source']['userId'] ?? null) ? $ev['source']['userId'] : null;
            $n = $app->db()->exec(
                'INSERT INTO line_events (webhook_event_id, type, line_user_id, payload, received_at) VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE webhook_event_id = webhook_event_id',
                [$id, mb_substr((string) ($ev['type'] ?? ''), 0, 40), $userId, Secure::encJson($app, Secure::EVENT_PAYLOAD, $ev), $app->now()]
            );
            if ($n === 0 && $app->db()->value('SELECT processed_at FROM line_events WHERE webhook_event_id = ?', [$id]) !== null) {
                continue; // 再送されてきた処理済みのイベント
            }
            $accepted[] = $ev;
        }
        return ['status' => 200, 'body' => 'ok', 'events' => $accepted];
    }

    /** 受け付けたイベントを処理する */
    public static function processAll(App $app, array $events): array
    {
        $results = [];
        foreach ($events as $ev) {
            $results[] = self::process($app, $ev);
        }
        return $results;
    }

    /** テスト・ローカル用：受け付けて、その場で処理する */
    public static function handle(App $app, string $rawBody, string $signature): array
    {
        $r = self::accept($app, $rawBody, $signature);
        $r['results'] = $r['status'] === 200 ? self::processAll($app, $r['events']) : [];
        return $r;
    }

    public static function eventId(array $ev): string
    {
        $id = $ev['webhookEventId'] ?? null;
        if (is_string($id) && $id !== '' && strlen($id) <= 64) {
            return $id;
        }
        return substr(hash('sha256', Json::enc($ev)), 0, 32);
    }

    public static function process(App $app, array $ev): array
    {
        $id = self::eventId($ev);
        $db = $app->db();
        // 処理済みなら飛ばす（同じイベントが2回届いた・処理し直し）
        $row = $db->one('SELECT processed_at FROM line_events WHERE webhook_event_id = ?', [$id]);
        if ($row && $row['processed_at'] !== null) {
            return ['id' => $id, 'status' => 'duplicate'];
        }
        try {
            unset($app->memo['settings']);
            self::dispatch($app, $ev, $id);
            $db->exec('UPDATE line_events SET processed_at = ?, error = NULL, attempts = attempts + 1 WHERE webhook_event_id = ?', [$app->now(), $id]);
            return ['id' => $id, 'status' => 'ok'];
        } catch (\Throwable $e) {
            $app->log()->error('イベントの処理に失敗しました', ['type' => $ev['type'] ?? null, 'error' => $e->getMessage(), 'at' => $e->getFile() . ':' . $e->getLine()]);
            try {
                $db->exec('UPDATE line_events SET error = ?, attempts = attempts + 1 WHERE webhook_event_id = ?', [mb_substr($e->getMessage(), 0, 500), $id]);
            } catch (\Throwable) {
                // DB に書けないなら、毎分の処理の再処理に任せる
            }
            return ['id' => $id, 'status' => 'error', 'error' => $e->getMessage()];
        }
    }

    private static function dispatch(App $app, array $ev, string $eventId): void
    {
        $srcType = $ev['source']['type'] ?? null;
        if ($srcType !== null && $srcType !== 'user') {
            return; // グループ・複数人トーク：いまは扱わない
        }
        $userId = $ev['source']['userId'] ?? null;
        if (!is_string($userId) || !preg_match('/^U[0-9a-f]{32}$/', $userId)) {
            return; // userId の無いイベント（検証ボタンなど）
        }
        switch ($ev['type'] ?? null) {
            case 'follow':
                self::onFollow($app, $ev, $userId, $eventId);
                break;
            case 'unfollow':
                self::onUnfollow($app, $userId, $eventId);
                break;
            case 'message':
                if (($ev['message']['type'] ?? null) === 'text') {
                    self::onText($app, $ev, $userId, $eventId);
                } else {
                    self::onOtherMessage($app, $ev, $userId, $eventId);
                }
                break;
            case 'postback':
                self::onPostback($app, $ev, $userId, $eventId);
                break;
            case 'videoPlayComplete':
                self::onVideoComplete($app, $ev, $userId, $eventId);
                break;
            case 'accountLink':
                $app->adapter()->onAccountLink($app, $userId, is_array($ev['link'] ?? null) ? $ev['link'] : []);
                break;
            default:
                break; // join / leave など：いまは扱わない
        }
    }

    /** 返信を送り、使わなかった返信トークンは覚えておく（運営が約1分のあいだ、チャットから無料で返せる） */
    private static function finish(App $app, Env $env, ?string $replyToken): array
    {
        $r = Reply::flush($app, $env);
        if (!$r['tokenUsed'] && $replyToken) {
            Chat::rememberReplyToken($app, $env->userId, $replyToken);
        }
        return $r;
    }

    /** 運営（admin_user_ids）の LINE に知らせる。kind：follow／message */
    private static function notifyAdmins(App $app, string $kind, string $userId, ?string $name, string $text = ''): void
    {
        $s = Settings::get($app);
        if ($kind === 'follow' && !$s['notify_admins_on_follow']) {
            return;
        }
        if ($kind === 'message' && !$s['notify_admins_on_message']) {
            return;
        }
        $admins = array_values(array_filter($s['admin_user_ids'] ?? [], fn ($a) => $a && $a !== $userId));
        if (!$admins) {
            return;
        }
        $ref = "{$kind}:{$userId}";
        if ($kind === 'message') {
            $since = Time::addMinutes($app->now(), -self::NOTIFY_MESSAGE_THROTTLE_MIN);
            if ($app->db()->one("SELECT 1 AS ok FROM line_outbox WHERE source = 'notify' AND source_ref = ? AND created_at > ? LIMIT 1", [$ref, $since])) {
                return;
            }
        }
        $who = ($name !== null && $name !== '') ? $name : 'お名前の分からない方';
        $t = preg_replace('/\s+/u', ' ', $text) ?? $text;
        $body = $kind === 'follow' ? "【新しい友だち】{$who}さんが、友だち追加しました。" : "【メッセージ】{$who}さん：" . (mb_strlen($t) > 60 ? mb_substr($t, 0, 60) . '…' : $t);
        Outbox::enqueue($app, $admins, [['type' => 'text', 'text' => $body]], 'notify', $ref, 20);
    }

    private static function onFollow(App $app, array $ev, string $userId, string $eventId): void
    {
        $before = Friends::get($app, $userId);
        Friends::upsertFollow($app, $userId);
        Friends::refreshProfile($app, $userId); // 失敗しても先に進む（表示名が空のままになるだけ）
        $app->adapter()->refreshMember($app, $userId);
        // 個別チャットの部屋に「友だち追加」のお知らせを残す（未読に数える）
        Reply::logIn($app, $userId, 'follow', ($before['status'] ?? null) === 'blocked' ? 'ブロックを解除して、友だちに戻りました' : '友だち追加しました', $eventId);
        $replyToken = is_string($ev['replyToken'] ?? null) ? $ev['replyToken'] : null;
        $env = Rules::makeEnv($app, $userId, $replyToken);
        Rules::run($app, ['type' => 'follow'], $env);
        // 「友だち追加の返事で始める」アンケートの最初の質問を、返事に添える（返信なので、通数を使わない）
        $q = Surveys::forFollow($app, $userId);
        if ($q) {
            $env->replyBuffer->push($q);
        }
        self::finish($app, $env, $replyToken);
        Scenarios::startOnFollow($app, $userId);
        self::notifyAdmins($app, 'follow', $userId, $env->vars['display_name'] ?? null);
    }

    private static function onUnfollow(App $app, string $userId, string $eventId): void
    {
        Friends::markUnfollow($app, $userId);
        Scenarios::stopEnrollments($app, $userId, 'unfollow');
        Reply::logIn($app, $userId, 'unfollow', 'ブロックされました', $eventId);
        $env = Rules::makeEnv($app, $userId);
        Rules::run($app, ['type' => 'unfollow'], $env);
        $env->replyBuffer->clear(); // ブロックした相手には返せない
    }

    private static function onText(App $app, array $ev, string $userId, string $eventId): void
    {
        $text = (string) ($ev['message']['text'] ?? '');
        $replyToken = is_string($ev['replyToken'] ?? null) ? $ev['replyToken'] : null;
        Friends::ensure($app, $userId);
        Reply::logIn($app, $userId, 'text', $text, $eventId);
        $env = Rules::makeEnv($app, $userId, $replyToken);
        // 会員サイトとの連携コードなど、アダプターが先に処理するもの
        $handled = $app->adapter()->onText($app, $userId, $text, $env);
        if ($handled['handled'] ?? false) {
            $env->replyBuffer->push(...Msg::normalize($handled['replies'] ?? [], $env->vars));
            foreach ($handled['tagsAdd'] ?? [] as $tag) {
                Rules::applyTag($app, $userId, $tag, $env);
            }
        } else {
            Rules::run($app, ['type' => 'keyword', 'text' => $text], $env);
        }
        // 反応で分かれる：「返事があったら止める」ステップ配信を止めて、次のステップ配信へ
        Scenarios::onFriendReply($app, $userId);
        // 自動の返事を何も返さなかったメッセージ＝運営の返事を待っている（個別チャットの「要対応」）
        if ($env->replyBuffer->count() === 0) {
            Chat::setNeedsReply($app, $userId, true);
        }
        self::finish($app, $env, $replyToken);
        self::notifyAdmins($app, 'message', $userId, $env->vars['display_name'] ?? null, $text);
    }

    private static function onOtherMessage(App $app, array $ev, string $userId, string $eventId): void
    {
        $type = (string) ($ev['message']['type'] ?? 'message');
        Friends::ensure($app, $userId);
        Reply::logIn($app, $userId, $type, '［' . (self::KIND_LABEL[$type] ?? $type) . '］', $eventId);
        if ($type !== 'sticker') {
            Chat::setNeedsReply($app, $userId, true); // 画像・ファイルなどは、運営が見て返すもの（スタンプは除く）
        }
        Chat::rememberReplyToken($app, $userId, is_string($ev['replyToken'] ?? null) ? $ev['replyToken'] : null);
        $name = Friends::get($app, $userId)['display_name'] ?? null;
        self::notifyAdmins($app, 'message', $userId, $name, '［' . (self::KIND_LABEL[$type] ?? $type) . '］');
    }

    private static function onPostback(App $app, array $ev, string $userId, string $eventId): void
    {
        $data = (string) ($ev['postback']['data'] ?? '');
        $replyToken = is_string($ev['replyToken'] ?? null) ? $ev['replyToken'] : null;
        Friends::ensure($app, $userId);
        $env = Rules::makeEnv($app, $userId, $replyToken);
        // アンケートのボタン・日程・特典のボタンは、専用の処理（ルールより先）
        $survey = Surveys::handleAnswer($app, $userId, $data, $env);
        if ($survey) {
            $env->replySource = 'survey';
            Reply::logIn($app, $userId, 'postback', $survey['label'], $eventId);
            self::finish($app, $env, $replyToken);
            return;
        }
        $params = is_array($ev['postback']['params'] ?? null) ? $ev['postback']['params'] : null;
        $picked = Picker::handleAnswer($app, $userId, $data, $params, $env);
        if ($picked) {
            $env->replySource = 'event_picker';
            Reply::logIn($app, $userId, 'postback', $picked['label'], $eventId);
            self::finish($app, $env, $replyToken);
            return;
        }
        if (preg_match(Videos::BONUS_DATA_RE, $data, $m)) {
            $env->replySource = 'video_offer';
            $r = Videos::claimBonus($app, $userId, (int) $m[1], $env);
            Reply::logIn($app, $userId, 'postback', $r['label'], $eventId);
            self::finish($app, $env, $replyToken);
            return;
        }
        Reply::logIn($app, $userId, 'postback', $data, $eventId);
        Rules::run($app, ['type' => 'postback', 'data' => $data], $env);
        self::finish($app, $env, $replyToken);
    }

    private static function onVideoComplete(App $app, array $ev, string $userId, string $eventId): void
    {
        $replyToken = is_string($ev['replyToken'] ?? null) ? $ev['replyToken'] : null;
        Friends::ensure($app, $userId);
        $env = Rules::makeEnv($app, $userId, $replyToken);
        $env->replySource = 'video_offer';
        $r = Videos::handleComplete($app, $userId, $ev['videoPlayComplete']['trackingId'] ?? null, $env);
        Reply::logIn($app, $userId, 'video_complete', $r['label'] ?? '（動画を最後まで見ました）', $eventId);
        self::finish($app, $env, $replyToken);
    }

    /** 処理に失敗したまま残っているイベントを、もう一度処理する（5回まで）。毎分の処理から */
    public static function reprocessFailed(App $app): array
    {
        $rows = $app->db()->all(
            'SELECT webhook_event_id, payload FROM line_events WHERE processed_at IS NULL AND attempts < 5 AND received_at < ? ORDER BY received_at LIMIT 50',
            [Time::addSeconds($app->now(), -60)]
        );
        $ok = 0;
        foreach ($rows as $r) {
            $ev = Secure::decJson($app, Secure::EVENT_PAYLOAD, $r['payload']);
            if (!is_array($ev)) {
                $app->db()->exec("UPDATE line_events SET attempts = 5, error = '中身を読めません（鍵を確かめてください）' WHERE webhook_event_id = ?", [$r['webhook_event_id']]);
                continue;
            }
            if (self::process($app, $ev)['status'] === 'ok') {
                $ok++;
            }
        }
        return ['retried' => count($rows), 'ok' => $ok];
    }
}
