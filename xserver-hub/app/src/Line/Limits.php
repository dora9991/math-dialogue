<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;

/** 使える数の上限（いつか商品にするときのため）。設定 plan_limits が空なら、上限なし（line-hub の limits.js と同じ） */
final class Limits
{
    public const KEYS = [
        'max_scenarios' => ['label' => 'ステップ配信', 'unit' => '件'],
        'max_steps' => ['label' => '1つのステップ配信のステップ', 'unit' => '通'],
        'max_surveys' => ['label' => 'アンケート', 'unit' => '件'],
        'max_video_offers' => ['label' => '動画特典', 'unit' => '件'],
        'max_members' => ['label' => '運営メンバー', 'unit' => '人'],
    ];

    public static function check(mixed $v): array
    {
        if (!Json::isObjLike($v)) {
            throw new \InvalidArgumentException('plan_limits は { max_scenarios: 10, … } の形にしてください（空なら上限なし）');
        }
        $v = Json::toArray($v);
        foreach ($v as $k => $n) {
            if (!isset(self::KEYS[$k])) {
                throw new \InvalidArgumentException("plan_limits の未知の項目です: {$k}");
            }
            if ($n !== null && (!is_int($n) || $n < 0 || $n > 1_000_000)) {
                throw new \InvalidArgumentException("plan_limits.{$k} は 0〜1000000 の整数（null で上限なし）にしてください");
            }
        }
        return $v;
    }

    public static function get(App $app): array
    {
        $l = Settings::get($app)['plan_limits'] ?? [];
        return is_array($l) ? $l : [];
    }

    public static function summary(App $app): array
    {
        $db = $app->db();
        return [
            'limits' => Json::obj(self::get($app)),
            'usage' => [
                'scenarios' => (int) $db->value('SELECT COUNT(*) FROM line_scenarios'),
                'surveys' => (int) $db->value('SELECT COUNT(*) FROM line_surveys'),
                'video_offers' => (int) $db->value('SELECT COUNT(*) FROM line_video_offers'),
                'members' => (int) $db->value('SELECT COUNT(*) FROM hub_admins WHERE disabled_at IS NULL'),
            ],
        ];
    }

    public static function assertWithin(array $limits, string $key, int $next): void
    {
        $max = $limits[$key] ?? null;
        if ($max === null) {
            return;
        }
        if ($next > $max) {
            $k = self::KEYS[$key];
            throw new \InvalidArgumentException("{$k['label']}は{$max}{$k['unit']}までです（いまの上限）。");
        }
    }
}
