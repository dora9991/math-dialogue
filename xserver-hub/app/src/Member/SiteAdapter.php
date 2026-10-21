<?php
declare(strict_types=1);

namespace Hub\Member;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Text;
use Hub\Kernel\Time;
use Hub\Line\Env;
use Hub\Line\Rules;

/**
 * 会員サイトとの連携（line-hub の genie アダプターを、このハブ用にしたもの）。
 *
 * 連携の流れ（6桁のコード。いまのジーニーと同じ使い方）：
 *   1) 会員がマイページで「LINE と連携」を押す → 会員サイトが POST /api/v1/link-codes を呼ぶ → ハブが6桁のコードを作って返す
 *   2) 会員が、そのコードを公式LINE に送る → ここ（onText）で照合 → 連携（友だち台帳に会員番号・プランを入れ、「会員連携」タグ）
 *   3) ハブが会員サイトへ「連携できた」を知らせる（設定 member.webhook_url。署名つき）
 *
 * 守り：
 *   ・コードは指紋（HMAC）だけを持つ。使い捨て・期限つき（既定30分）
 *   ・同じ LINE の人が1時間に5回まちがえたら、しばらく受け付けない（6桁の総当たり対策）
 *   ・全体で1時間に50回まちがいがあったら、運営にメールで知らせる（多くのアカウントからの総当たりに気づく）
 */
final class SiteAdapter implements Adapter
{
    private const MAX_FAILURES = 5;
    private const WINDOW_SEC = 3600;
    private const GLOBAL_ALERT = 50;
    public const LINK_TAG = '会員連携';

    private const MSG = [
        'locked' => 'コードの入力が続けて合いませんでした。しばらくしてから、もう一度お試しください。',
        'notFound' => 'コードが見つからないか、期限切れです。サイトでコードを再発行してから、もう一度送ってください。',
        'taken' => 'このLINEは、すでに別の会員に連携されています。サイトのマイページで連携を解除してから、もう一度お試しください。',
        'done' => '連携が完了しました！これから通知をこちらにお届けします。',
    ];

    public function name(): string
    {
        return 'genie'; // 管理画面（line-hub-admin.js）が、この名前のときに会員の絞り込みを出す
    }

    public function plans(App $app): array
    {
        $out = [];
        foreach ($app->config->arr('member.plans') as $p) {
            if (is_array($p) && isset($p['code'], $p['name'])) {
                $out[] = ['code' => (string) $p['code'], 'name' => (string) $p['name'], 'rank' => (int) ($p['rank'] ?? 0)];
            }
        }
        usort($out, fn ($a, $b) => $a['rank'] <=> $b['rank']);
        return $out;
    }

    /** 連携コードの桁数（設定 member.link_code_digits。6 か 8。既定 6） */
    public static function digits(App $app): int
    {
        return $app->config->int('member.link_code_digits', 6) === 8 ? 8 : 6;
    }

    public function onText(App $app, string $userId, string $text, Env $env): array
    {
        $t = trim(Text::nfkc($text));
        if (!preg_match('/^\d{' . self::digits($app) . '}$/', $t)) {
            return ['handled' => false]; // 決まった桁の数字だけを連携コードとして扱う
        }
        $limiter = $app->limiter();
        $bucket = 'link_fail:' . $userId;
        if ($limiter->peek($bucket, self::WINDOW_SEC) >= self::MAX_FAILURES) {
            return ['handled' => true, 'replies' => [self::MSG['locked']]];
        }
        $db = $app->db();
        $now = $app->now();
        $hash = $app->crypto()->index($t, 'link_code');
        $code = $db->one('SELECT * FROM hub_link_codes WHERE code_hash = ? AND used_at IS NULL AND expires_at > ?', [$hash, $now]);
        if (!$code) {
            $limiter->hit($bucket, self::MAX_FAILURES, self::WINDOW_SEC);
            $all = $limiter->hit('link_fail_all', self::GLOBAL_ALERT, self::WINDOW_SEC);
            if (!$all['ok']) {
                $app->alerts()->raise('link_bruteforce', '連携コードのまちがいが多すぎます', "この1時間で、連携コードのまちがいが {$all['count']} 回ありました。\n当てずっぽうに試している人がいるかもしれません。管理画面の「操作の記録」と、サーバーのログを確かめてください。\n必要なら、設定 member.link_code_digits を 8 にすると、当てにくくなります。", 60);
            }
            return ['handled' => true, 'replies' => [self::MSG['notFound']]];
        }
        $ref = $code['member_ref'];
        $friend = $db->one('SELECT member_ref FROM line_friends WHERE line_user_id = ?', [$userId]);
        if ($friend && $friend['member_ref'] !== null && $friend['member_ref'] !== $ref) {
            return ['handled' => true, 'replies' => [self::MSG['taken']]];
        }
        $db->tx(function (Db $db) use ($app, $userId, $ref, $code, $now): void {
            // 同じ会員が、前に別の LINE とつながっていたら、そちらは外す（新しい LINE に移る）
            $db->exec('UPDATE line_friends SET member_ref = NULL, member_plan = NULL, member_rank = NULL, member_synced_at = ? WHERE member_ref = ? AND line_user_id <> ?', [$now, $ref, $userId]);
            $m = $db->one('SELECT plan, `rank` FROM hub_members WHERE member_ref = ?', [$ref]);
            $db->exec(
                'UPDATE line_friends SET member_ref = ?, member_plan = ?, member_rank = ?, member_synced_at = ?, updated_at = ? WHERE line_user_id = ?',
                [$ref, $m['plan'] ?? null, $m['rank'] ?? null, $now, $now, $userId]
            );
            $db->exec('UPDATE hub_link_codes SET used_at = ?, used_by = ? WHERE id = ?', [$now, $userId, $code['id']]);
            $db->exec('DELETE FROM hub_link_codes WHERE member_ref = ? AND used_at IS NULL', [$ref]); // 同じ会員の、ほかのコードは使えなくする
            self::queueSiteEvent($app, 'line.linked', ['member_ref' => $ref, 'linked_at' => Time::iso($now)]);
        });
        $limiter->reset($bucket);
        $app->audit()->record(['id' => 'line:' . substr($userId, 0, 9), 'email' => null], 'member.linked', ['member_ref' => $ref]);
        return ['handled' => true, 'replies' => [self::MSG['done']], 'tagsAdd' => [self::LINK_TAG]];
    }

    public function refreshMember(App $app, string $userId): void
    {
        $app->db()->exec(
            'UPDATE line_friends f JOIN hub_members m ON m.member_ref = f.member_ref
             SET f.member_plan = m.plan, f.member_rank = m.`rank`, f.member_synced_at = ? WHERE f.line_user_id = ?',
            [$app->now(), $userId]
        );
    }

    public function refreshAll(App $app): void
    {
        $app->db()->exec(
            'UPDATE line_friends f JOIN hub_members m ON m.member_ref = f.member_ref
             SET f.member_plan = m.plan, f.member_rank = m.`rank`, f.member_synced_at = ?
             WHERE NOT (f.member_plan <=> m.plan) OR NOT (f.member_rank <=> m.`rank`)',
            [$app->now()]
        );
    }

    public function resolveZoomParticipant(App $app, ?string $email, ?string $name): ?string
    {
        return null;
    }

    public function onAccountLink(App $app, string $userId, array $link): void
    {
        $app->log()->info('accountLink イベントを受け取りました（このハブでは、6桁のコードで連携します）', ['result' => $link['result'] ?? null]);
    }

    /**
     * 会員サイトへの知らせの署名：X-Hub-Signature: v1=HMAC-SHA256(webhook_secret, "{X-Hub-Timestamp}.{本文}") の16進。
     * 受け取る側は、時刻（5分以内）と署名を確かめ、本文の id で二重の処理を防ぐ（clients/ に確かめ方の見本）
     */
    public static function signEvent(string $secret, string $ts, string $body): string
    {
        return 'v1=' . hash_hmac('sha256', "{$ts}.{$body}", $secret);
    }

    /** 会員サイトへの知らせを積む（知らせ先が無ければ、何もしない） */
    public static function queueSiteEvent(App $app, string $event, array $payload): void
    {
        if ($app->config->str('member.webhook_url') === '') {
            return;
        }
        $now = $app->now();
        $app->db()->exec(
            'INSERT INTO hub_site_events (event, payload, next_attempt_at, created_at) VALUES (?, ?, ?, ?)',
            [$event, Json::enc($payload), $now, $now]
        );
    }

    /** 毎分：会員サイトへの知らせを届ける（届かなければ、間をあけて10回まで） */
    public function tick(App $app): array
    {
        $url = $app->config->str('member.webhook_url');
        $secret = $app->config->str('member.webhook_secret');
        if ($url === '' || $secret === '') {
            return ['sent' => 0];
        }
        $db = $app->db();
        $now = $app->now();
        $sent = 0;
        $failed = 0;
        foreach ($db->all("SELECT * FROM hub_site_events WHERE status = 'queued' AND next_attempt_at <= ? ORDER BY id LIMIT 20", [$now], keep: ['payload']) as $e) {
            $body = Json::enc(['id' => (int) $e['id'], 'event' => $e['event'], 'payload' => $e['payload'], 'created_at' => $e['created_at']]);
            $ts = (string) intdiv(\Hub\Kernel\Time::ms($now), 1000);
            $sig = self::signEvent($secret, $ts, $body);
            $status = self::post($url, $body, ['Content-Type: application/json', 'X-Hub-Timestamp: ' . $ts, 'X-Hub-Signature: ' . $sig, 'X-Hub-Event: ' . $e['event']]);
            if ($status >= 200 && $status < 300) {
                $db->exec("UPDATE hub_site_events SET status = 'sent', sent_at = ?, attempts = attempts + 1, last_error = NULL WHERE id = ?", [$now, $e['id']]);
                $sent++;
                continue;
            }
            $attempts = (int) $e['attempts'] + 1;
            if ($attempts >= 10) {
                $db->exec("UPDATE hub_site_events SET status = 'failed', attempts = ?, last_error = ? WHERE id = ?", [$attempts, "HTTP {$status}", $e['id']]);
                $app->alerts()->raise('site_event_failed', '会員サイトへの知らせが届きません', "会員サイト（{$url}）へ「{$e['event']}」を10回送りましたが、届きませんでした（最後の応答：HTTP {$status}）。\n会員サイトの受け口と、設定 member.webhook_url・member.webhook_secret を確かめてください。", 360);
                $failed++;
            } else {
                $wait = min(60 * 2 ** ($attempts - 1), 6 * 3600);
                $db->exec('UPDATE hub_site_events SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?', [$attempts, Time::addSeconds($now, (int) $wait), "HTTP {$status}", $e['id']]);
            }
        }
        return ['sent' => $sent, 'failed' => $failed];
    }

    /** @param list<string> $headers @return int HTTP の状態（つながらなければ 0） */
    private static function post(string $url, string $body, array $headers): int
    {
        if (!str_starts_with($url, 'https://') && !str_starts_with($url, 'http://127.0.0.1')) {
            return 0; // https 以外には送らない
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $r = curl_exec($ch);
        return $r === false ? 0 : (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    }
}
