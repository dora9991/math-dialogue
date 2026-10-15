<?php
declare(strict_types=1);

namespace Hub\Ops;

use Hub\Kernel\App;
use Hub\Kernel\Audit;
use Hub\Kernel\Time;
use Hub\Line\Outbox;
use Hub\Line\Settings;
use Hub\Web\Session;

/**
 * 毎分の処理（bin/hub tick）の入口と、1日1回の仕事（バックアップ・片づけ・毎日の報告）。
 * cron は「毎分 bin/hub tick」の1行だけでよい（1日1回の仕事は、決まった時刻を過ぎた最初の1回に、ここで動かす）。
 */
final class Daily
{
    /** @return array<string,mixed> */
    public static function tick(App $app): array
    {
        $since = $app->kv()->get('maintenance');
        if ($since !== null) {
            // 更新・復元の最中は、配信も1日1回の仕事も止める（終われば、次の分から続きを動かす）。長く続いていたら知らせる
            try {
                $long = Time::ms($app->now()) - Time::ms(Time::parse($since)) > 2 * 3600 * 1000;
            } catch (\InvalidArgumentException) {
                $long = false;
            }
            if ($long) {
                $app->alerts()->raise('maintenance_long', 'メンテナンス中のままです', "メンテナンス中（{$since} から）のため、配信と毎分の処理が止まっています。\n終わっていれば bin/hub maintenance:off を。", 360);
            }
            return ['skipped' => 'maintenance'];
        }
        $out = [];
        try {
            $out['hub'] = \Hub\Line\Hub::tick($app);
        } catch (\Throwable $e) {
            $app->log()->error('毎分の処理に失敗しました', ['error' => $e->getMessage(), 'at' => $e->getFile() . ':' . $e->getLine()]);
            $app->alerts()->raise('tick_failed', '毎分の処理に失敗しています', "毎分の処理（配信・送信など）が失敗しました：\n" . $e->getMessage() . "\n\nbin/hub doctor と、var/log/ のログを確かめてください。", 30);
            $out['hub'] = ['error' => $e->getMessage()];
        }
        foreach (['backup' => fn () => self::backup($app), 'cleanup' => fn () => self::cleanup($app), 'report' => fn () => self::report($app)] as $job => $fn) {
            if (!self::due($app, $job)) {
                continue;
            }
            try {
                $out[$job] = $app->lease()->with('daily:' . $job, 3600, $fn, ['skipped' => 'busy']);
            } catch (\Throwable $e) {
                $app->log()->error("1日1回の仕事（{$job}）に失敗しました", ['error' => $e->getMessage()]);
                $app->alerts()->raise('daily_failed:' . $job, "1日1回の仕事（{$job}）に失敗しました", $e->getMessage(), 360);
                $app->kv()->delete(self::doneKey($app, $job)); // 次の分でやり直す
                $out[$job] = ['error' => $e->getMessage()];
            }
        }
        return $out;
    }

    private static function hourOf(App $app, string $job): int
    {
        return match ($job) {
            'backup' => $app->config->int('backup.hour', 3),
            'cleanup' => 4,
            'report' => $app->config->int('alert.daily_report_hour', 7),
            default => 5,
        };
    }

    private static function doneKey(App $app, string $job): string
    {
        return 'daily:' . $job . ':' . Time::ymd($app->now(), 540);
    }

    /** 日本時間で、決まった時刻を過ぎていて、今日まだやっていなければ true（やったことにする） */
    private static function due(App $app, string $job): bool
    {
        $p = Time::localParts($app->now(), 540);
        if ($p['hh'] < self::hourOf($app, $job)) {
            return false;
        }
        return $app->kv()->add(self::doneKey($app, $job), Time::iso($app->now()), 3 * 86400);
    }

    public static function backup(App $app): array
    {
        $r = Backup::create($app, '毎日の自動バックアップ');
        $r['pruned'] = Backup::prune($app);
        $app->kv()->set('backup.last', \Hub\Kernel\Json::enc(['at' => Time::iso($app->now()), 'bytes' => $r['bytes'], 'file' => basename($r['file'])]));
        return ['file' => basename($r['file']), 'bytes' => $r['bytes'], 'rows' => $r['rows'], 'pruned' => $r['pruned']];
    }

    /** 保存期間を過ぎた、土台の記録を片づける（LINE の記録は Hub::cleanup が毎分） */
    public static function cleanup(App $app): array
    {
        $db = $app->db();
        $now = $app->now();
        $c = $app->config;
        $out = [];
        $out['sessions'] = Session::purgeExpired($app);
        $out['nonces'] = $db->exec('DELETE FROM hub_api_nonces WHERE expires_at < ?', [$now]);
        $out['rate_limits'] = $app->limiter()->purge(86400);
        $out['kv'] = $app->kv()->purgeExpired();
        $out['locks'] = $db->exec('DELETE FROM hub_locks WHERE locked_until < ?', [Time::addSeconds($now, -86400)]);
        $out['link_codes'] = $db->exec('DELETE FROM hub_link_codes WHERE (used_at IS NOT NULL AND used_at < ?) OR (used_at IS NULL AND expires_at < ?)', [Time::addSeconds($now, -30 * 86400), Time::addSeconds($now, -86400)]);
        $out['site_events'] = $db->exec("DELETE FROM hub_site_events WHERE status = 'sent' AND sent_at < ?", [Time::addSeconds($now, -30 * 86400)]);
        $out['access_log'] = $db->exec('DELETE FROM hub_access_log WHERE at < ?', [Time::addSeconds($now, -max(30, $c->int('retention.access_log_days', 365)) * 86400)]);
        // 操作の記録：古い行を消す前に、消す最後の行の指紋を「起点」として覚える（あとから最初の行を消されても、気づける）
        $auditCut = Time::addSeconds($now, -max(365, $c->int('retention.audit_days', 1095)) * 86400);
        $lastOld = $db->one('SELECT id, hash FROM hub_audit_log WHERE at < ? ORDER BY id DESC LIMIT 1', [$auditCut]);
        if ($lastOld) {
            $app->kv()->set('audit.anchor', $lastOld['hash']);
            $out['audit_log'] = $db->exec('DELETE FROM hub_audit_log WHERE id <= ?', [$lastOld['id']]);
        }
        // ログのファイル
        $days = max(7, $c->int('retention.log_days', 90));
        $n = 0;
        foreach (glob($app->varDir('log') . '/hub-*.log') ?: [] as $f) {
            if (filemtime($f) < time() - $days * 86400 && @unlink($f)) {
                $n++;
            }
        }
        $out['log_files'] = $n;
        return $out;
    }

    /** 毎日の報告（メール）。個人の情報は入れない。数と、気になることだけ */
    public static function report(App $app, bool $send = true): array
    {
        $db = $app->db();
        $now = $app->now();
        $tz = 540;
        $p = Time::localParts($now, $tz);
        $todayStart = Time::fromLocal($p['y'], $p['m'], $p['d'], 0, 0, $tz);
        $from = Time::addSeconds($todayStart, -86400);
        $to = $todayStart;
        $n = static fn (string $sql, array $params = []) => (int) $db->value($sql, $params);
        $friends = $db->one("SELECT CAST(COALESCE(SUM(status = 'active'), 0) AS SIGNED) AS active, CAST(COALESCE(SUM(status = 'blocked'), 0) AS SIGNED) AS blocked FROM line_friends");
        $usage = Outbox::usageSummary($app);
        $settings = Settings::get($app);
        $verify = (new Audit($db, $app->clock, $app->log()))->verify($app->kv()->get('audit.anchor'));
        $last = $app->kv()->get('backup.last');
        $lastBackup = $last ? json_decode($last, true) : null;
        $warn = [];
        if (!$settings['enabled']) {
            $warn[] = '・送信を止めています（停止スイッチがオン）';
        }
        if ($settings['dry_run']) {
            $warn[] = '・練習モード（dry-run）です。友だちには届いていません';
        }
        if ($usage['cap'] > 0 && $usage['sent'] >= $usage['cap'] * 0.8) {
            $warn[] = "・今月の通数が上限の8割を超えました（{$usage['sent']} / {$usage['cap']}）";
        }
        $failed = $n("SELECT COUNT(*) FROM line_outbox WHERE status = 'failed' AND created_at >= ? AND created_at < ?", [$from, $to]);
        if ($failed) {
            $warn[] = "・送れなかったメッセージが {$failed} 件あります（管理画面の「送信状況」）";
        }
        if (!$verify['ok']) {
            $warn[] = '・' . $verify['message'];
        }
        $loginFail = $n("SELECT COUNT(*) FROM hub_audit_log WHERE action IN ('auth.login_failed', 'auth.2fa_failed') AND at >= ? AND at < ?", [$from, $to]);
        if ($loginFail >= 10) {
            $warn[] = "・ログインの失敗が {$loginFail} 回ありました";
        }
        if (!$lastBackup || Time::ms($now) - Time::ms(Time::parse($lastBackup['at'])) > 26 * 3600 * 1000) {
            $warn[] = '・バックアップが、26時間以上取れていません';
        }
        $lines = [
            Time::ymd($from, $tz) . ' の報告です。',
            '',
            '【友だち】いま ' . $friends['active'] . '人（ブロック ' . $friends['blocked'] . '人）',
            '　前日の友だち追加 ' . $n("SELECT COUNT(*) FROM line_message_log WHERE direction = 'in' AND kind = 'follow' AND created_at >= ? AND created_at < ?", [$from, $to]) . '人・ブロック ' . $n("SELECT COUNT(*) FROM line_message_log WHERE direction = 'in' AND kind = 'unfollow' AND created_at >= ? AND created_at < ?", [$from, $to]) . '人',
            '【メッセージ】前日に受け取った ' . $n("SELECT COUNT(*) FROM line_message_log WHERE direction = 'in' AND kind NOT IN ('follow', 'unfollow') AND created_at >= ? AND created_at < ?", [$from, $to]) . '件・いま要対応 ' . $n('SELECT COUNT(*) FROM line_chat_state WHERE needs_reply = 1') . '人',
            '【送信】前日に送った ' . $n("SELECT COALESCE(SUM(cost), 0) FROM line_outbox WHERE status = 'sent' AND sent_at >= ? AND sent_at < ?", [$from, $to]) . '通・今月 ' . $usage['sent'] . ' / ' . $usage['cap'] . '通',
            '【会員連携】前日に連携 ' . $n("SELECT COUNT(*) FROM hub_audit_log WHERE action = 'member.linked' AND at >= ? AND at < ?", [$from, $to]) . '人',
            '【ログイン】前日の成功 ' . $n("SELECT COUNT(*) FROM hub_audit_log WHERE action = 'auth.login' AND at >= ? AND at < ?", [$from, $to]) . '回・失敗 ' . $loginFail . '回',
            '【バックアップ】' . ($lastBackup ? $lastBackup['at'] . '（' . round($lastBackup['bytes'] / 1024) . 'KB）' : 'まだありません'),
            '【操作の記録】' . $verify['message'] . ($verify['head'] ? "\n　最新の指紋：" . $verify['head'] . '（このメールを残しておくと、あとで書き換えを見破る手がかりになります）' : ''),
            '',
            $warn ? "【気になること】\n" . implode("\n", $warn) : '【気になること】ありません',
        ];
        $text = implode("\n", $lines);
        if ($send) {
            $to2 = $app->config->str('alert.to');
            if ($to2 !== '') {
                $app->mailer()->send($to2, '[' . $app->appName() . '] 毎日の報告 ' . Time::ymd($from, $tz) . ($warn ? '（気になることあり）' : ''), $text . "\n\n— " . $app->appName());
            }
        }
        return ['text' => $text, 'warnings' => count($warn)];
    }
}
