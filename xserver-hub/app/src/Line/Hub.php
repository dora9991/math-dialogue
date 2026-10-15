<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Time;

/**
 * 毎分の処理（line-hub の hub.js の tick・cleanup）。cron が毎分 bin/hub tick を呼ぶ。
 * 重なって動かないよう、期限つきの貸出（2分）を取れたときだけ動く。取れなければ { skipped: 'busy' }。
 */
final class Hub
{
    public static function tick(App $app): array
    {
        $out = $app->lease()->with('tick', 120, function () use ($app): array {
            unset($app->memo['settings']);
            $out = [];
            $out['events'] = Webhook::reprocessFailed($app);
            // Zoom の出欠の確定が失敗しても、ほかの配信は止めない（次の分でやり直す）
            try {
                $out['zoom'] = Zoom::tick($app);
            } catch (\Throwable $e) {
                $app->log()->error('Zoom の出欠の確定に失敗しました', ['error' => $e->getMessage()]);
                $out['zoom'] = ['error' => $e->getMessage()];
            }
            $out['scenarios'] = Scenarios::tick($app);
            $out['broadcasts'] = Broadcasts::tick($app);
            $out['outbox'] = Outbox::dispatch($app);
            $out['broadcasts']['completed'] += Broadcasts::complete($app)['completed']; // 送り終わった配信は、その場で完了にする
            $out['site'] = $app->adapter()->tick($app);
            $out['cleanup'] = self::cleanup($app);
            $app->kv()->set('tick.last_ok_at', Time::iso($app->now()));
            return $out;
        }, ['skipped' => 'busy']);
        return $out;
    }

    /** 保存期間を過ぎた記録を消す（チャットは chat_retention_days、受け取った Webhook は log_retention_days） */
    public static function cleanup(App $app): array
    {
        $s = Settings::get($app);
        $now = $app->now();
        $db = $app->db();
        $chatCutoff = Time::addSeconds($now, -86400 * (int) ($s['chat_retention_days'] ?? 365));
        $cutoff = Time::addSeconds($now, -86400 * (int) $s['log_retention_days']);
        $a = $db->exec('DELETE FROM line_message_log WHERE created_at < ? LIMIT 5000', [$chatCutoff]);
        $b = $db->exec('DELETE FROM line_events WHERE processed_at IS NOT NULL AND received_at < ? LIMIT 5000', [$cutoff]);
        // 送り終わった送信キューの行（中身と宛先を持っている）も、チャットと同じ期間で消す
        // （一斉配信の「届けた数」は、この行から数えるので、期間を過ぎた配信は 0 と出る。宛先の人数は配信の行に残る）
        $c = $db->exec(
            "DELETE FROM line_outbox WHERE status IN ('sent', 'failed', 'skipped', 'dry_run') AND created_at < ? LIMIT 5000",
            [$chatCutoff]
        );
        return ['message_log' => $a, 'events' => $b, 'outbox' => $c];
    }
}
