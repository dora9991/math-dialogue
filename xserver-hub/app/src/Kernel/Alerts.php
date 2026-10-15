<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 運営への「おかしい」の知らせ（メール）。同じ知らせは cooldown の間に1回だけ（毎分の処理で騒ぎ続けないように）。
 * 送れなかった・送りすぎを止めた分も数えておき、次に送るときに「ほかに◯回」と書き添える。
 */
final class Alerts
{
    public function __construct(private Db $db, private Clock $clock, private Mailer $mailer, private Log $log, private string $to, private string $appName)
    {
    }

    public function raise(string $key, string $subject, string $body, int $cooldownMin = 60): bool
    {
        $now = $this->clock->now();
        $this->log->warn('知らせ: ' . $subject, ['key' => $key]);
        $r = $this->db->one('SELECT last_sent_at, suppressed FROM hub_alerts WHERE k = ?', [$key]);
        if ($r && $r['last_sent_at'] !== null && Time::parse($r['last_sent_at']) > Time::addMinutes($now, -$cooldownMin)) {
            $this->db->exec('UPDATE hub_alerts SET suppressed = suppressed + 1, last_subject = ? WHERE k = ?', [mb_substr($subject, 0, 200), $key]);
            return false;
        }
        $more = $r ? (int) $r['suppressed'] : 0;
        $text = $body . ($more > 0 ? "\n\n（前回の知らせのあと、同じ知らせがほかに {$more} 回ありました）" : '')
            . "\n\n— {$this->appName}（このメールは自動で送っています。返信しても届きません）";
        $ok = $this->to !== '' && $this->mailer->send($this->to, "[{$this->appName}] {$subject}", $text);
        $this->db->exec(
            'INSERT INTO hub_alerts (k, last_sent_at, suppressed, last_subject) VALUES (?, ?, 0, ?)
             ON DUPLICATE KEY UPDATE last_sent_at = VALUES(last_sent_at), suppressed = 0, last_subject = VALUES(last_subject)',
            [$key, $now, mb_substr($subject, 0, 200)]
        );
        if (!$ok) {
            $this->log->error('知らせのメールを送れませんでした（alert.to・alert.from を確かめてください）', ['key' => $key]);
        }
        return $ok;
    }
}
