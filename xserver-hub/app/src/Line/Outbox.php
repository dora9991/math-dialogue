<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Text;
use Hub\Kernel\Time;

/**
 * 送信キュー：LINE への送信（リプライを除く）は、すべてここを通る＝「送信の関所」（line-hub の outbox.js）。
 *
 * ここで一括して効かせるもの：
 *   ・停止スイッチ（settings.enabled=false なら何も送らない。積まれたまま残る）
 *   ・dry-run（送らず「送るはずだった」記録だけ）
 *   ・月間通数の上限（会員通知用の取り置き notification_reserve つき）
 *   ・二重送信の防止（行のID＝X-Line-Retry-Key。落ちて再送しても LINE 側で1回だけ）
 *   ・429（レート制限）・5xx・接続断の再送、永続エラーの停止
 *   ・ブロック中の宛先を外す
 * メッセージの中身は暗号化して持つ（運営のチャットの文も、ここを通るため）。
 */
final class Outbox
{
    /** 送信キューに積む。宛先は1〜500人（multicast の上限）。@return string 行のID */
    public static function enqueue(App $app, array $to, array $messages, string $source, ?string $sourceRef = null, int $priority = 100, ?\DateTimeImmutable $notBefore = null): string
    {
        $users = array_values(array_unique(array_map('strval', $to)));
        if (!$users) {
            throw new \InvalidArgumentException('宛先が空です');
        }
        if (count($users) > 500) {
            throw new \InvalidArgumentException('1件の送信は500人までです（500人ごとに分けてください）');
        }
        Msg::validate($messages);
        $now = $app->now();
        $id = Text::uuid();
        $app->db()->exec(
            'INSERT INTO line_outbox (id, kind, to_user_ids, messages, source, source_ref, priority, cost, not_before, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                count($users) === 1 ? 'push' : 'multicast',
                Json::enc($users),
                Secure::encJson($app, Secure::OUTBOX_MESSAGES, $messages),
                $source,
                $sourceRef === null ? null : mb_substr($sourceRef, 0, 254),
                $priority,
                count($users),
                $notBefore ?? $now,
                $now,
            ]
        );
        return $id;
    }

    /** @return array{sent:int,dry_run:int,skipped_cap:int} */
    public static function usageOf(App $app, string $ym): array
    {
        $r = $app->db()->one('SELECT sent, dry_run, skipped_cap FROM line_usage WHERE ym = ?', [$ym]);
        return $r ? ['sent' => (int) $r['sent'], 'dry_run' => (int) $r['dry_run'], 'skipped_cap' => (int) $r['skipped_cap']] : ['sent' => 0, 'dry_run' => 0, 'skipped_cap' => 0];
    }

    private static function addUsage(App $app, string $ym, int $sent = 0, int $dryRun = 0, int $skippedCap = 0): void
    {
        $app->db()->exec(
            'INSERT INTO line_usage (ym, sent, dry_run, skipped_cap) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE sent = sent + VALUES(sent), dry_run = dry_run + VALUES(dry_run), skipped_cap = skipped_cap + VALUES(skipped_cap)',
            [$ym, $sent, $dryRun, $skippedCap]
        );
    }

    /** まだ送っていない販促系（会員通知以外）の通数 */
    public static function pendingMarketingCost(App $app): int
    {
        return (int) $app->db()->value("SELECT CAST(COALESCE(SUM(cost), 0) AS SIGNED) FROM line_outbox WHERE status IN ('queued', 'sending') AND source <> 'notification'");
    }

    /** 今月の通数・上限・残り（管理画面と配信前チェック用） */
    public static function usageSummary(App $app): array
    {
        $s = Settings::get($app);
        $ym = Time::monthKey($app->now(), (int) $s['timezone_offset_min']);
        $u = self::usageOf($app, $ym);
        $pending = self::pendingMarketingCost($app);
        return [
            'ym' => $ym,
            'sent' => $u['sent'],
            'dry_run' => $u['dry_run'],
            'skipped_cap' => $u['skipped_cap'],
            'cap' => $s['monthly_cap'],
            'reserve' => $s['notification_reserve'],
            'pending_marketing' => $pending,
            'available_marketing' => max(0, $s['monthly_cap'] - $s['notification_reserve'] - $u['sent'] - $pending),
            'remaining_total' => max(0, $s['monthly_cap'] - $u['sent']),
        ];
    }

    private static function finish(App $app, string $id, string $status, ?string $error = null, ?int $cost = null): void
    {
        $now = $app->now();
        $app->db()->exec(
            "UPDATE line_outbox SET status = ?, last_error = ?, cost = COALESCE(?, cost), sent_at = IF(? = 'sent', ?, sent_at) WHERE id = ?",
            [$status, $error === null ? null : mb_substr($error, 0, 2000), $cost, $status, $now, $id]
        );
    }

    /** 送った記録（人数ぶんの行。中身は line_outbox にあるので、要約だけ） */
    private static function logSent(App $app, array $recipients, array $row, array $messages): void
    {
        $chat = $row['source'] === 'chat';
        $source = $chat ? 'chat' : $row['source'] . ($row['source_ref'] ? ':' . $row['source_ref'] : '');
        $actor = $chat ? $row['source_ref'] : null;
        $preview = Secure::enc($app, Secure::LOG_PREVIEW, Msg::preview($messages)); // 全員に同じ文。暗号文も1つで足りる
        $now = $app->now();
        foreach (array_chunk($recipients, 200) as $part) {
            $params = [];
            $rows = [];
            foreach ($part as $u) {
                $rows[] = "(?, 'out', ?, ?, ?, ?, ?, ?)";
                array_push($params, $u, $row['kind'], mb_substr($source, 0, 120), $preview, $row['id'], $actor, $now);
            }
            $app->db()->exec(
                'INSERT INTO line_message_log (line_user_id, direction, kind, source, text_preview, outbox_id, actor, created_at) VALUES ' . implode(',', $rows),
                $params
            );
        }
    }

    /**
     * 送れるものを送る。毎分の処理（tick）から呼ぶ。
     * @return array{sent:int,failed:int,requeued:int,skipped:int,dry_run:int,disabled:bool}
     */
    public static function dispatch(App $app, int $limit = 50): array
    {
        $summary = ['sent' => 0, 'failed' => 0, 'requeued' => 0, 'skipped' => 0, 'dry_run' => 0, 'disabled' => false];
        $settings = Settings::get($app);
        if (!$settings['enabled']) {
            $summary['disabled'] = true;
            return $summary;
        }
        $db = $app->db();
        $now = $app->now();

        // 送信中のまま10分以上止まっている行（途中で落ちた）を戻す。Retry-Key が同じなので二重配信にはならない（24時間以内）
        $db->exec("UPDATE line_outbox SET status = 'queued' WHERE status = 'sending' AND claimed_at < ?", [Time::addMinutes($now, -10)]);

        // 送る行を「送信中」にして押さえる（毎分の処理は貸出で1つしか動かないが、念のため取引の中で）
        $rows = $db->tx(function (Db $db) use ($now, $limit): array {
            $ids = array_column($db->all(
                "SELECT id FROM line_outbox WHERE status = 'queued' AND (not_before IS NULL OR not_before <= ?)
                 ORDER BY priority, created_at LIMIT " . max(1, (int) $limit) . ' FOR UPDATE',
                [$now]
            ), 'id');
            if (!$ids) {
                return [];
            }
            $p = [$now];
            $in = Db::in($ids, $p);
            $db->exec("UPDATE line_outbox SET status = 'sending', attempts = attempts + 1, claimed_at = ? WHERE id IN ({$in})", $p);
            $p2 = [];
            $in2 = Db::in($ids, $p2);
            return $db->all("SELECT * FROM line_outbox WHERE id IN ({$in2}) ORDER BY priority, created_at", $p2, json: ['to_user_ids']);
        });

        $ym = Time::monthKey($now, (int) $settings['timezone_offset_min']);
        $used = self::usageOf($app, $ym);

        foreach ($rows as $row) {
            $messages = Secure::decJson($app, Secure::OUTBOX_MESSAGES, $row['messages']);
            if (!is_array($messages)) {
                self::finish($app, $row['id'], 'failed', 'メッセージを読めません（暗号の鍵を確かめてください）');
                $summary['failed']++;
                continue;
            }
            // 1) まだ友だち（ブロックしていない）の人だけに絞る
            $p = [];
            $in = Db::in($row['to_user_ids'], $p);
            $recipients = array_column($db->all("SELECT line_user_id FROM line_friends WHERE line_user_id IN ({$in}) AND status = 'active'", $p), 'line_user_id');
            // 宛先の並びは、積んだときの順に戻す（multicast の宛先の順を、毎回同じにする）
            $recipients = array_values(array_intersect($row['to_user_ids'], $recipients));
            if (!$recipients) {
                self::finish($app, $row['id'], 'skipped', '有効な宛先がありません（ブロック済みなど）');
                $summary['skipped']++;
                continue;
            }
            $cost = count($recipients);

            // 2) 月間上限（会員通知は上限いっぱいまで、販促系は取り置きを除いた分まで）
            $limitFor = $row['source'] === 'notification' ? (int) $settings['monthly_cap'] : (int) $settings['monthly_cap'] - (int) $settings['notification_reserve'];
            if ($used['sent'] + $cost > $limitFor) {
                self::addUsage($app, $ym, skippedCap: $cost);
                $used['skipped_cap'] += $cost;
                self::finish($app, $row['id'], 'skipped', "月間上限（{$limitFor}通）を超えるため送りません", $cost);
                $summary['skipped']++;
                continue;
            }

            // 3) dry-run：送らず、送るはずだった通数だけ記録する
            if ($settings['dry_run']) {
                self::addUsage($app, $ym, dryRun: $cost);
                self::finish($app, $row['id'], 'dry_run', null, $cost);
                $summary['dry_run']++;
                continue;
            }

            // 4) 送信（Retry-Key は行のID）
            $res = count($recipients) === 1
                ? $app->line()->push($recipients[0], $messages, $row['id'])
                : $app->line()->multicast($recipients, $messages, $row['id']);

            if ($res['ok'] || $res['status'] === 409) {
                // 409 ＝ 同じ Retry-Key で既に受理済み（前回は届いたが記録が残らなかった）。成功として数える
                self::addUsage($app, $ym, sent: $cost);
                $used['sent'] += $cost;
                self::finish($app, $row['id'], 'sent', null, $cost);
                self::logSent($app, $recipients, $row, $messages);
                // ボタンつきを1人に送った：しばらく、その人へのステップ配信を待たせる（ボタンが消えないように）
                if (count($recipients) === 1 && Msg::hasQuickReply($messages)) {
                    Chat::markQuickReply($app, $recipients, $now);
                }
                $summary['sent']++;
            } elseif ($res['status'] === 429) {
                // レート制限：試行回数に数えず、少し待って再送
                $wait = $res['retryAfterSec'] ?? 60;
                $db->exec(
                    "UPDATE line_outbox SET status = 'queued', attempts = attempts - 1, not_before = ?, last_error = ? WHERE id = ?",
                    [Time::addSeconds($now, $wait), '429 レート制限', $row['id']]
                );
                $summary['requeued']++;
            } elseif ($res['status'] === 0 || $res['status'] >= 500) {
                // 一時的な失敗：指数バックオフで再送。回数を超えたら失敗
                $err = $res['error'] ?? ($res['status'] . ' ' . Json::enc($res['body']));
                if ((int) $row['attempts'] >= (int) $settings['max_attempts']) {
                    self::finish($app, $row['id'], 'failed', "再送の上限に達しました: {$err}");
                    $summary['failed']++;
                } else {
                    $wait = min(30 * 2 ** ((int) $row['attempts'] - 1), 3600);
                    $db->exec("UPDATE line_outbox SET status = 'queued', not_before = ?, last_error = ? WHERE id = ?", [Time::addSeconds($now, (int) $wait), mb_substr($err, 0, 2000), $row['id']]);
                    $summary['requeued']++;
                }
            } else {
                // 400/401/403 など：再送しても直らない
                self::finish($app, $row['id'], 'failed', $res['status'] . ' ' . Json::enc($res['body']));
                $summary['failed']++;
            }
        }
        return $summary;
    }

    /** 画面の一覧用：行の要約（宛先の人数・最初の文の先頭80字） */
    public static function present(App $app, array $row): array
    {
        $msgs = Secure::decJson($app, Secure::OUTBOX_MESSAGES, $row['messages'] ?? null);
        $first = is_array($msgs) ? ($msgs[0] ?? null) : null;
        $preview = null;
        if (is_array($first)) {
            $preview = isset($first['text']) && is_string($first['text']) ? $first['text'] : '[' . ($first['type'] ?? '') . ']';
            $preview = mb_substr($preview, 0, 80);
        }
        $to = is_string($row['to_user_ids'] ?? null) ? Json::dec($row['to_user_ids']) : ($row['to_user_ids'] ?? []);
        $out = $row;
        unset($out['messages'], $out['to_user_ids'], $out['claimed_at']);
        $out['recipients'] = is_array($to) ? count($to) : 0;
        $out['preview'] = $preview;
        return $out;
    }
}
