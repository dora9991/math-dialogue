<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * 動画特典：動画を最後まで見た人に、期限つきで特典を渡す（line-hub の videos.js。プロラインの「動画視聴→期限つき特典」）。
 *   ・動画には trackingId（lh-video:番号）を付ける。最後まで見ると、LINE から videoPlayComplete が届く（1対1のトークだけ）
 *   ・期限内に［特典を受け取る］（postback lh-bonus:番号）か、ルールの「動画特典を渡す」で、特典を返信で渡す
 */
final class Videos
{
    public const TRACKING_RE = '/^lh-video:(\d+)$/';
    public const BONUS_DATA_RE = '/^lh-bonus:(\d+)$/';
    private const KEY_RE = '/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/';
    private const HTTPS_RE = '#^https://\S+$#i';
    public const DEFAULT_WATCHED = "ご視聴ありがとうございました！\n特典は {{deadline}} まで受け取れます。下の［特典を受け取る］を押してください。";
    public const DEFAULT_EXPIRED = '申し訳ありません。特典の受付は終了しました。';

    public static function validateDef(mixed $def): array
    {
        $err = static function (string $m): never {
            throw new \InvalidArgumentException($m);
        };
        if (!Json::isObjLike($def)) {
            $err('動画特典が空です');
        }
        $def = Json::toArray($def);
        $key = trim(is_scalar($def['key'] ?? null) ? (string) $def['key'] : '');
        if (!preg_match(self::KEY_RE, $key)) {
            $err('キーは、半角の英数字（とハイフン・下線）で40文字までにしてください（例：intro-video）');
        }
        $name = trim(is_scalar($def['name'] ?? null) ? (string) $def['name'] : '');
        if ($name === '') {
            $err('名前が必要です');
        }
        if (mb_strlen($name) > 60) {
            $err('名前は60文字までです');
        }
        $videoUrl = trim((string) ($def['videoUrl'] ?? ''));
        $previewUrl = trim((string) ($def['previewUrl'] ?? ''));
        if (!preg_match(self::HTTPS_RE, $videoUrl) || strlen($videoUrl) > 2000) {
            $err('動画の URL は、https:// から始まる mp4 の URL にしてください（LINE の決まり：mp4・200MB まで）');
        }
        if (!preg_match(self::HTTPS_RE, $previewUrl) || strlen($previewUrl) > 2000) {
            $err('プレビュー画像の URL は、https:// から始まる JPEG／PNG の URL にしてください（LINE の決まり：1MB まで）');
        }
        $hours = $def['deadlineHours'] ?? 48;
        if (is_string($hours) && preg_match('/^\d+$/', $hours)) {
            $hours = (int) $hours;
        }
        if (!is_int($hours) || $hours < 1 || $hours > 8760) {
            $err('特典を受け取れる時間は、1〜8760 時間の整数にしてください');
        }
        $bonus = isset($def['bonusMessages']) ? Msg::asList($def['bonusMessages']) : [];
        if (!$bonus) {
            $err('特典の内容（受け取った人に返す文・URL など）が必要です');
        }
        if (count($bonus) > 4) {
            $err('特典の内容は4件までです（返信は5件までのため）');
        }
        try {
            Msg::validate(Msg::normalize($bonus, ['display_name' => 'x']), true);
        } catch (\InvalidArgumentException $e) {
            $err('特典の内容：' . $e->getMessage());
        }
        $text = static function (mixed $v, string $label, int $max = 1000) use ($err): ?string {
            if ($v === null || $v === '') {
                return null;
            }
            if (mb_strlen((string) $v) > $max) {
                $err("{$label}は{$max}文字までです");
            }
            return (string) $v;
        };
        $tag = static function (mixed $v, string $label) use ($err): ?string {
            $t = ($v === null || $v === '') ? null : Attributes::normalizeTagName($v);
            if ($t !== null && mb_strlen($t) > 50) {
                $err("{$label}は50文字までです");
            }
            return $t === '' ? null : $t;
        };
        if (isset($def['enabled']) && !is_bool($def['enabled'])) {
            $err('enabled は true / false で指定してください');
        }
        return [
            'key' => $key, 'name' => $name, 'videoUrl' => $videoUrl, 'previewUrl' => $previewUrl, 'deadlineHours' => $hours, 'bonusMessages' => $bonus,
            'enabled' => $def['enabled'] ?? null,
            'watchedMessage' => $text($def['watchedMessage'] ?? null, '見終わった人への返事'),
            'expiredMessage' => $text($def['expiredMessage'] ?? null, '期限を過ぎた人への返事'),
            'watchedTag' => $tag($def['watchedTag'] ?? null, '見終わった人に付けるタグ'),
            'claimedTag' => $tag($def['claimedTag'] ?? null, '特典を受け取った人に付けるタグ'),
        ];
    }

    public static function upsert(App $app, mixed $def): array
    {
        $v = self::validateDef($def);
        $db = $app->db();
        $now = $app->now();
        $cur = $db->one('SELECT id FROM line_video_offers WHERE `key` = ?', [$v['key']]);
        $args = [$v['name'], $v['videoUrl'], $v['previewUrl'], $v['deadlineHours'], $v['watchedMessage'], Json::enc($v['bonusMessages']), $v['expiredMessage'], $v['watchedTag'], $v['claimedTag'], $now];
        if ($cur) {
            $db->exec(
                'UPDATE line_video_offers SET name = ?, video_url = ?, preview_url = ?, deadline_hours = ?, watched_message = ?, bonus_messages = ?,
                   expired_message = ?, watched_tag = ?, claimed_tag = ?, updated_at = ?, enabled = COALESCE(?, enabled) WHERE id = ?',
                [...$args, $v['enabled'], $cur['id']]
            );
            return ['id' => (int) $cur['id']];
        }
        $db->exec(
            'INSERT INTO line_video_offers (name, video_url, preview_url, deadline_hours, watched_message, bonus_messages, expired_message, watched_tag, claimed_tag, updated_at, enabled, `key`, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [...$args, $v['enabled'] ?? true, $v['key'], $now]
        );
        return ['id' => $db->lastId()];
    }

    /** 番号（int）かキー（文字）で探す */
    public static function get(App $app, int|string $ref): ?array
    {
        return $app->db()->one(
            'SELECT * FROM line_video_offers WHERE ' . (is_int($ref) ? 'id = ?' : '`key` = ?'),
            [$ref],
            json: ['bonus_messages']
        );
    }

    /** 送る動画のメッセージ（trackingId つき）。使えなければ null */
    public static function message(?array $offer): ?array
    {
        if (!$offer || !$offer['enabled']) {
            return null;
        }
        return ['type' => 'video', 'originalContentUrl' => $offer['video_url'], 'previewImageUrl' => $offer['preview_url'], 'trackingId' => 'lh-video:' . $offer['id']];
    }

    private static function claimButton(array $offer): array
    {
        return ['items' => [['type' => 'action', 'action' => ['type' => 'postback', 'label' => '特典を受け取る', 'data' => 'lh-bonus:' . $offer['id'], 'displayText' => '特典を受け取る']]]];
    }

    /** 「視聴完了」の知らせ。動画特典の動画でなければ null */
    public static function handleComplete(App $app, string $userId, ?string $trackingId, Env $env): ?array
    {
        if (!preg_match(self::TRACKING_RE, (string) $trackingId, $m)) {
            return null;
        }
        $offer = self::get($app, (int) $m[1]);
        if (!$offer) {
            return ['label' => '（動画を最後まで見ました：見つからない動画）'];
        }
        $now = $app->now();
        $deadline = Time::addSeconds($now, (int) $offer['deadline_hours'] * 3600);
        $db = $app->db();
        $n = $db->exec(
            'INSERT INTO line_video_views (offer_id, line_user_id, watched_at, deadline_at) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE watch_count = watch_count + 1',
            [$offer['id'], $userId, $now, $deadline]
        );
        $first = $n === 1; // 1＝新しく入れた、2＝もう一度見た
        $v = $db->one('SELECT deadline_at, claimed_at FROM line_video_views WHERE offer_id = ? AND line_user_id = ?', [$offer['id'], $userId]);
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $deadlineAt = Time::parse($v['deadline_at']);
        $deadlineJa = Time::formatJa($deadlineAt, $tz);
        if ($first && $offer['watched_tag']) {
            Rules::applyTag($app, $userId, $offer['watched_tag'], $env);
        }
        if (!$offer['enabled']) {
            return ['label' => "（動画「{$offer['name']}」を最後まで見ました）"];
        }
        $open = $v['claimed_at'] === null && $deadlineAt > $now;
        if ($first || $open) {
            $text = (string) preg_replace('/\{\{\s*deadline\s*\}\}/', $deadlineJa, $offer['watched_message'] ?: self::DEFAULT_WATCHED);
            $msgs = Msg::normalize([$text], $env->vars);
            if ($open) {
                $msgs[count($msgs) - 1]['quickReply'] = self::claimButton($offer);
            }
            $env->replyBuffer->push(...$msgs);
        }
        return ['label' => "（動画「{$offer['name']}」を最後まで見ました" . ($first ? '' : '・もう一度') . '）'];
    }

    /** 特典を受け取る。@return array{result:string,label:string} */
    public static function claimBonus(App $app, string $userId, int|string $ref, Env $env): array
    {
        $offer = self::get($app, $ref);
        if (!$offer || !$offer['enabled']) {
            $env->replyBuffer->push(['type' => 'text', 'text' => 'この特典は、いまは受け付けていません。']);
            return ['result' => 'not_found', 'label' => '（特典を受け取る：受付を止めている特典）'];
        }
        $db = $app->db();
        $v = $db->one('SELECT deadline_at, claimed_at FROM line_video_views WHERE offer_id = ? AND line_user_id = ?', [$offer['id'], $userId]);
        if (!$v) {
            $env->replyBuffer->push(['type' => 'text', 'text' => "特典は、動画「{$offer['name']}」を最後までご覧になった方へのものです。動画を最後まで見てから、もう一度お試しください。"]);
            return ['result' => 'not_watched', 'label' => '（特典を受け取る：まだ動画を見ていない）'];
        }
        $now = $app->now();
        if (Time::parse($v['deadline_at']) <= $now && $v['claimed_at'] === null) {
            $env->replyBuffer->push(...Msg::normalize([$offer['expired_message'] ?: self::DEFAULT_EXPIRED], $env->vars));
            return ['result' => 'expired', 'label' => '（特典を受け取る：期限切れ）'];
        }
        $first = $v['claimed_at'] === null;
        if ($first) {
            $db->exec('UPDATE line_video_views SET claimed_at = ? WHERE offer_id = ? AND line_user_id = ?', [$now, $offer['id'], $userId]);
            if ($offer['claimed_tag']) {
                Rules::applyTag($app, $userId, $offer['claimed_tag'], $env);
            }
        }
        $env->replyBuffer->push(...Special::expand($app, $userId, Msg::normalize($offer['bonus_messages'], $env->vars)));
        return ['result' => $first ? 'claimed' : 'again', 'label' => '（特典を受け取りました）'];
    }

    public static function list(App $app): array
    {
        return $app->db()->all(
            'SELECT o.*, (SELECT COUNT(*) FROM line_video_views v WHERE v.offer_id = o.id) AS watched,
                    (SELECT COUNT(*) FROM line_video_views v WHERE v.offer_id = o.id AND v.claimed_at IS NOT NULL) AS claimed,
                    (SELECT COUNT(*) FROM line_video_views v WHERE v.offer_id = o.id AND v.claimed_at IS NULL AND v.deadline_at <= ?) AS expired
             FROM line_video_offers o ORDER BY o.id',
            [$app->now()],
            keep: ['bonus_messages']
        );
    }

    public static function viewers(App $app, string $key, int $limit = 200): ?array
    {
        $offer = self::get($app, $key);
        if (!$offer) {
            return null;
        }
        $rows = $app->db()->all(
            'SELECT v.line_user_id, f.display_name, v.watched_at, v.deadline_at, v.claimed_at, v.watch_count
             FROM line_video_views v JOIN line_friends f ON f.line_user_id = v.line_user_id WHERE v.offer_id = ? ORDER BY v.watched_at DESC LIMIT ' . max(1, $limit),
            [$offer['id']]
        );
        return ['offer' => $offer, 'rows' => $rows];
    }

    public static function setEnabled(App $app, int $id, bool $enabled): void
    {
        $app->db()->exec('UPDATE line_video_offers SET enabled = ?, updated_at = ? WHERE id = ?', [$enabled, $app->now(), $id]);
    }
}
