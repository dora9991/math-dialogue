<?php
declare(strict_types=1);

namespace Hub\Web;

use Hub\Kernel\App;
use Hub\Kernel\Crypto;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Kernel\Time;

/**
 * 管理画面のログインの状態（セッション）。PHP 標準のセッションは使わず、DB（hub_sessions）に持つ。
 *
 *   ・クッキーには、推測できない 32 バイトの文字列だけ。DB にはその指紋（SHA-256）だけ（DB が漏れても、なりすませない）
 *   ・クッキー：__Host-（このホストだけ・https だけ）、HttpOnly（スクリプトから読めない）、SameSite=Strict（ほかのサイトから送られない）
 *   ・段階：password（パスワードまで）→ full（二段階認証まで）。段階が上がるたびに、文字列を作り直す（セッション固定攻撃の対策）
 *   ・何もしない時間が続いたら切れる（既定30分）。続けて使っていても、ログインから一定時間（既定12時間）で切れる
 *   ・運営メンバーを外す・パスワードを作り直すと、その人のセッションは全部消える（画面からも、すぐ締め出される）
 */
final class Session
{
    private const PENDING_MIN = 10; // パスワードを入れてから二段階認証までの猶予

    public static function cookieName(App $app): string
    {
        return $app->config->isProduction() ? '__Host-hub_sid' : 'hub_sid';
    }

    /** @return array{session:array,admin:array}|null 有効なセッションと、その人 */
    public static function load(App $app, Request $req): ?array
    {
        $token = $req->cookie(self::cookieName($app));
        if (!is_string($token) || !preg_match('/^[A-Za-z0-9_-]{43}$/', $token)) {
            return null;
        }
        $db = $app->db();
        $s = $db->one('SELECT * FROM hub_sessions WHERE id_hash = ?', [hash('sha256', $token)]);
        if (!$s) {
            return null;
        }
        $now = $app->now();
        $idle = $s['stage'] === 'full' ? max(5, $app->config->int('admin.idle_timeout_min', 30)) : self::PENDING_MIN;
        if (Time::parse($s['expires_at']) <= $now || Time::addMinutes(Time::parse($s['last_seen_at']), $idle) <= $now) {
            $db->exec('DELETE FROM hub_sessions WHERE id_hash = ?', [$s['id_hash']]);
            return null;
        }
        $admin = $db->one('SELECT * FROM hub_admins WHERE id = ?', [$s['admin_id']]);
        if (!$admin || $admin['disabled_at'] !== null) {
            $db->exec('DELETE FROM hub_sessions WHERE id_hash = ?', [$s['id_hash']]);
            return null;
        }
        // 最後に使った時刻（1分に1回だけ書く）
        if (Time::addSeconds(Time::parse($s['last_seen_at']), 60) <= $now) {
            $db->exec('UPDATE hub_sessions SET last_seen_at = ? WHERE id_hash = ?', [$now, $s['id_hash']]);
        }
        return ['session' => $s, 'admin' => $admin];
    }

    /** 新しいセッションを作り、クッキーを付ける（前のセッションがあれば消す） */
    public static function start(App $app, Request $req, Response $res, string $adminId, string $stage): array
    {
        self::end($app, $req, $res, false);
        $token = Crypto::token(32);
        $now = $app->now();
        $hours = max(1, min(72, $app->config->int('admin.absolute_timeout_hours', 12)));
        $expires = $stage === 'full' ? Time::addSeconds($now, $hours * 3600) : Time::addMinutes($now, self::PENDING_MIN);
        $row = [
            'id_hash' => hash('sha256', $token),
            'admin_id' => $adminId,
            'stage' => $stage,
            'csrf' => Crypto::token(32),
            'ip' => mb_substr($req->ip, 0, 45),
            'user_agent' => mb_substr($req->header('user-agent'), 0, 200),
        ];
        $app->db()->exec(
            'INSERT INTO hub_sessions (id_hash, admin_id, stage, csrf, ip, user_agent, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$row['id_hash'], $adminId, $stage, $row['csrf'], $row['ip'], $row['user_agent'], $now, $now, $expires]
        );
        $res->cookie(self::cookieName($app), $token, $stage === 'full' ? $hours * 3600 : self::PENDING_MIN * 60, $app->config->isProduction());
        return $row;
    }

    /** いまのセッションを消す（ログアウト） */
    public static function end(App $app, Request $req, Response $res, bool $clearCookie = true): void
    {
        $token = $req->cookie(self::cookieName($app));
        if (is_string($token) && $token !== '') {
            $app->db()->exec('DELETE FROM hub_sessions WHERE id_hash = ?', [hash('sha256', $token)]);
        }
        if ($clearCookie) {
            $res->cookie(self::cookieName($app), '', 0, $app->config->isProduction());
        }
    }

    public static function endAllFor(App $app, string $adminId, ?string $exceptHash = null): int
    {
        if ($exceptHash !== null) {
            return $app->db()->exec('DELETE FROM hub_sessions WHERE admin_id = ? AND id_hash <> ?', [$adminId, $exceptHash]);
        }
        return $app->db()->exec('DELETE FROM hub_sessions WHERE admin_id = ?', [$adminId]);
    }

    public static function purgeExpired(App $app): int
    {
        return $app->db()->exec('DELETE FROM hub_sessions WHERE expires_at <= ? OR last_seen_at <= ?', [$app->now(), Time::addSeconds($app->now(), -86400)]);
    }
}
