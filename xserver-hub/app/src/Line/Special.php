<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;

/**
 * 「特別なメッセージ」の印を、送る直前に、本物の LINE のメッセージに置き換える（line-hub の special.js）。
 *   { type: 'survey', survey: 'アンケート名' } → アンケートの質問（ボタンつき）
 *   { type: 'video_offer', offer: 'キー' }     → 動画（trackingId つき）
 *   { type: 'event_picker', … }               → 日程を選ぶボタン
 * 使えない（無い・止めている）ものは外す。全部外れたら、空の配列（呼び出し側が「送らない」を決める）。
 */
final class Special
{
    public static function has(mixed $messages): bool
    {
        foreach (is_array($messages) ? $messages : [] as $m) {
            if (Msg::isSpecial($m)) {
                return true;
            }
        }
        return false;
    }

    public static function expand(App $app, ?string $userId, array $messages): array
    {
        if (!self::has($messages)) {
            return $messages;
        }
        $out = [];
        foreach ($messages as $m) {
            $type = is_array($m) ? ($m['type'] ?? null) : null;
            if ($type === 'survey') {
                $q = Surveys::start($app, $userId, (string) ($m['survey'] ?? ''));
                if ($q) {
                    $out[] = $q;
                }
            } elseif ($type === 'video_offer') {
                $v = Videos::message(Videos::get($app, (string) ($m['offer'] ?? '')));
                if ($v) {
                    $out[] = $v;
                }
            } elseif ($type === 'event_picker') {
                $p = Picker::message($app, $m);
                if ($p) {
                    $out[] = $p;
                }
            } else {
                $out[] = $m;
            }
        }
        return $out;
    }

    /** 保存の前に：印が指すアンケート・動画特典が、本当にあるか */
    public static function checkRefs(App $app, mixed $messages, string $where = ''): void
    {
        foreach (is_array($messages) ? $messages : [] as $m) {
            $type = is_array($m) ? ($m['type'] ?? null) : null;
            if ($type === 'survey' && !$app->db()->one('SELECT 1 AS ok FROM line_surveys WHERE name = ?', [(string) ($m['survey'] ?? '')])) {
                throw new \InvalidArgumentException("{$where}アンケート「{$m['survey']}」が見つかりません（先に「属性・アンケート」で作ってください）");
            }
            if ($type === 'video_offer' && !$app->db()->one('SELECT 1 AS ok FROM line_video_offers WHERE `key` = ?', [(string) ($m['offer'] ?? '')])) {
                throw new \InvalidArgumentException("{$where}動画特典「{$m['offer']}」が見つかりません（先に「動画特典」で作ってください）");
            }
        }
    }
}
