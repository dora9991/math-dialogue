<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;

/** 設定（line_settings）。送信の安全装置（停止スイッチ・dry-run・月間上限）もここ。line-hub の settings.js と同じ */
final class Settings
{
    public const DEFAULTS = [
        'enabled' => true, // 停止スイッチ。false なら何も送らない（受信と台帳は動く）
        'dry_run' => false, // true なら送らず「送るはずだった」記録だけ残す（練習モード）
        'monthly_cap' => 200, // 月間の通数上限（LINE のプランに合わせる。無料は200）
        'notification_reserve' => 20, // 会員への通知用に、販促系の配信から守る通数
        'timezone_offset_min' => 540, // 日本時間
        'admin_user_ids' => [], // 運営への通知先（LINE の userId）
        'brand_name' => 'ジーニー',
        'site_url' => '',
        'max_attempts' => 5,
        'reply_overflow_push' => true, // リプライが5件を超える／失敗したとき、残りをプッシュで送る
        'reminder_max_late_minutes' => 30, // イベント系の配信は、予定より30分以上遅れたら送らない
        'log_retention_days' => 30, // 受け取った Webhook の記録（line_events）を残す日数
        'genie_notify_enabled' => false, // 会員サイトの通知→LINE。切替が済むまで false（二重送信を防ぐ）
        'notify_admins_on_follow' => true, // 友だち追加を、運営（admin_user_ids）の LINE に知らせる
        'notify_admins_on_message' => false, // 友だちからのメッセージを、運営の LINE に知らせる（同じ人からは10分に1回まで）
        'chat_retention_days' => 365, // チャット（やり取りの記録）を残す日数
        'plan_limits' => [], // 使える数の上限（空＝上限なし）。{ max_scenarios, max_steps, max_surveys, max_video_offers, max_members }
    ];

    /** @return array<string,mixed> いまの設定（DB に無いものは既定値）。1回の処理の中では覚えておく */
    public static function get(App $app): array
    {
        if (isset($app->memo['settings'])) {
            return $app->memo['settings'];
        }
        $s = self::DEFAULTS;
        foreach ($app->db()->all('SELECT `key`, value FROM line_settings') as $r) {
            $s[$r['key']] = Json::dec((string) $r['value']);
        }
        return $app->memo['settings'] = $s;
    }

    /** @param array<string,mixed> $patch */
    public static function set(App $app, array $patch): void
    {
        foreach ($patch as $k => $v) {
            if (!array_key_exists($k, self::DEFAULTS)) {
                throw new \InvalidArgumentException("未知の設定です: {$k}");
            }
            $app->db()->exec(
                'INSERT INTO line_settings (`key`, value, updated_at) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)',
                [$k, Json::enc($k === 'plan_limits' ? Json::obj($v) : $v), $app->now()]
            );
        }
        unset($app->memo['settings']);
    }

    /** 画面へ返す形（plan_limits は空でも {}） */
    public static function forOutput(array $s): array
    {
        $s['plan_limits'] = Json::obj(is_array($s['plan_limits'] ?? null) ? $s['plan_limits'] : []);
        return $s;
    }
}
