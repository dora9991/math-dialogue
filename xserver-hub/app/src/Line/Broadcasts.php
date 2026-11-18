<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * 一斉配信（セグメント配信。line-hub の broadcasts.js）。
 * 下書き → 宛先の人数と通数を見て確認 → 送る（500人ごとに分けて送信キューへ）or 予約 → 完了。
 *   ・販促系の月間の残りを超える配信は、1通も積まずに止める（途中まで送る事故を防ぐ）
 *   ・宛先は「送る時点」で確定する
 *   ・全員に同じ文面を送る（multicast）。人ごとの差し込み（{{display_name}} 等）は使えない
 */
final class Broadcasts
{
    public static function estimate(App $app, mixed $audience): array
    {
        $n = Audience::count($app, $audience ?? []);
        $s = Settings::get($app);
        $u = Outbox::usageOf($app, Time::monthKey($app->now(), (int) $s['timezone_offset_min']));
        $pending = Outbox::pendingMarketingCost($app);
        $available = max(0, $s['monthly_cap'] - $s['notification_reserve'] - $u['sent'] - $pending);
        return ['recipients' => $n, 'cost' => $n, 'available' => $available, 'ok' => $n <= $available, 'cap' => $s['monthly_cap'], 'used' => $u['sent'], 'pending' => $pending];
    }

    public static function create(App $app, string $name, mixed $audience, mixed $messages, ?string $scheduledAt = null): array
    {
        if ($name === '') {
            throw new \InvalidArgumentException('配信名が必要です');
        }
        if (Msg::hasPlaceholder($messages)) {
            throw new \InvalidArgumentException('一斉配信では {{ }} の差し込みは使えません（全員に同じ文面を送るため）。人ごとに変える場合はシナリオを使ってください');
        }
        $msgs = Msg::normalize($messages, []);
        Msg::validate($msgs, true);
        Audience::count($app, $audience ?? []); // 条件の書き間違いをここで見つける
        $now = $app->now();
        $app->db()->exec(
            'INSERT INTO line_broadcasts (name, status, audience, messages, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$name, $scheduledAt ? 'scheduled' : 'draft', Json::enc(Json::obj($audience ?? [])), Json::enc($msgs), $scheduledAt ? Time::parse($scheduledAt) : null, $now]
        );
        return ['id' => $app->db()->lastId()];
    }

    public static function schedule(App $app, int $id, string $at): array
    {
        $n = $app->db()->exec(
            "UPDATE line_broadcasts SET status = 'scheduled', scheduled_at = ?, last_error = NULL WHERE id = ? AND status IN ('draft', 'scheduled')",
            [Time::parse($at), $id]
        );
        return ['ok' => $n > 0];
    }

    public static function cancel(App $app, int $id): array
    {
        return $app->db()->tx(function (Db $db) use ($id): array {
            $n = $db->exec("UPDATE line_broadcasts SET status = 'canceled' WHERE id = ? AND status IN ('draft', 'scheduled', 'sending')", [$id]);
            if ($n === 0) {
                return ['ok' => false];
            }
            // まだ送っていない分は止める
            $db->exec(
                "UPDATE line_outbox SET status = 'skipped', last_error = '配信が取り消されました'
                 WHERE status = 'queued' AND id IN (SELECT outbox_id FROM line_broadcast_batches WHERE broadcast_id = ?)",
                [$id]
            );
            return ['ok' => true];
        });
    }

    /** 今すぐ送る：宛先を確定し、500人ごとに送信キューへ積む */
    public static function send(App $app, int $id): array
    {
        $settings = Settings::get($app);
        $app->adapter()->refreshAll($app); // 会員プランで絞る配信のため、会員情報を最新にしてから宛先を決める
        return $app->db()->tx(function (Db $db) use ($app, $id, $settings): array {
            $b = $db->one('SELECT * FROM line_broadcasts WHERE id = ? FOR UPDATE', [$id], json: ['audience', 'messages']);
            if (!$b) {
                return ['ok' => false, 'reason' => 'not_found'];
            }
            if (!in_array($b['status'], ['draft', 'scheduled'], true)) {
                return ['ok' => false, 'reason' => 'bad_status', 'status' => $b['status']];
            }
            $ids = Audience::userIds($app, $b['audience']);
            $now = $app->now();
            if (!$ids) {
                $db->exec("UPDATE line_broadcasts SET status = 'sent', recipient_count = 0, sent_at = ? WHERE id = ?", [$now, $id]);
                return ['ok' => true, 'recipients' => 0, 'batches' => 0];
            }
            // 上限チェック：販促系の残りを超えるなら、1通も積まない
            $used = Outbox::usageOf($app, Time::monthKey($now, (int) $settings['timezone_offset_min']));
            $available = $settings['monthly_cap'] - $settings['notification_reserve'] - $used['sent'] - Outbox::pendingMarketingCost($app);
            if (count($ids) > $available) {
                $msg = '月間上限に収まりません（宛先 ' . count($ids) . '人 ＞ 残り ' . max(0, $available) . '通）';
                $db->exec('UPDATE line_broadcasts SET last_error = ? WHERE id = ?', [$msg, $id]);
                return ['ok' => false, 'reason' => 'cap', 'needed' => count($ids), 'available' => max(0, $available), 'message' => $msg];
            }
            // アンケート・動画特典の印は、ここで本物のメッセージに置き換える（全員に同じもの）
            $messages = Special::expand($app, null, $b['messages']);
            if (!$messages) {
                $msg = 'アンケート・動画特典が見つからないか、止めているため、送るメッセージがありません';
                $db->exec('UPDATE line_broadcasts SET last_error = ? WHERE id = ?', [$msg, $id]);
                return ['ok' => false, 'reason' => 'no_messages', 'message' => $msg];
            }
            $parts = array_chunk($ids, 500);
            foreach ($parts as $part) {
                $oid = Outbox::enqueue($app, $part, $messages, 'broadcast', (string) $id, 100);
                $db->exec('INSERT INTO line_broadcast_batches (broadcast_id, outbox_id) VALUES (?, ?)', [$id, $oid]);
            }
            $db->exec("UPDATE line_broadcasts SET status = 'sending', recipient_count = ?, last_error = NULL WHERE id = ?", [count($ids), $id]);
            return ['ok' => true, 'recipients' => count($ids), 'batches' => count($parts)];
        });
    }

    /** 予約の時刻が来た配信を送り、送り終わった配信を完了にする（毎分） */
    public static function tick(App $app): array
    {
        $out = ['started' => 0, 'refused' => 0, 'completed' => 0];
        foreach ($app->db()->all("SELECT id FROM line_broadcasts WHERE status = 'scheduled' AND scheduled_at <= ? ORDER BY scheduled_at", [$app->now()]) as $row) {
            $r = self::send($app, (int) $row['id']);
            if ($r['ok']) {
                $out['started']++;
            } else {
                // 上限などで送れない予約は、下書きに戻して理由を残す（毎分リトライして騒がないように）
                $out['refused']++;
                $app->db()->exec("UPDATE line_broadcasts SET status = 'draft', last_error = ? WHERE id = ? AND status = 'scheduled'", [$r['message'] ?? $r['reason'], $row['id']]);
            }
        }
        $out['completed'] = self::complete($app)['completed'];
        return $out;
    }

    /** 全部の送信が終わった配信を「完了」にする */
    public static function complete(App $app): array
    {
        $n = $app->db()->exec(
            "UPDATE line_broadcasts b SET status = 'sent', sent_at = ?
             WHERE b.status = 'sending' AND NOT EXISTS (
               SELECT 1 FROM line_broadcast_batches bb JOIN line_outbox o ON o.id = bb.outbox_id
               WHERE bb.broadcast_id = b.id AND o.status IN ('queued', 'sending'))",
            [$app->now()]
        );
        return ['completed' => $n];
    }
}
