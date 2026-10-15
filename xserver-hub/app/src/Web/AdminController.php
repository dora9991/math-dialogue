<?php
declare(strict_types=1);

namespace Hub\Web;

use Hub\Admin\Members;
use Hub\Kernel\App;
use Hub\Kernel\Crypto;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Kernel\Json;
use Hub\Kernel\Password;
use Hub\Kernel\Time;
use Hub\Kernel\Totp;
use Hub\Line\Rpc;
use Hub\Line\RpcError;

/**
 * 管理画面（/admin）。ログイン（パスワード＋二段階認証）・パスワードの変更・管理画面の本体・管理 API（/admin/rpc）。
 *
 * ログインの順番：
 *   1) メールアドレス＋パスワード → 段階 password のセッション（10分だけ）
 *   2) 仮パスワードのままなら、自分のパスワードに変える
 *   3) 二段階認証：登録済みなら6桁のコード／まだなら登録（QR を読み込む）→ 回復コードを1回だけ見せる
 *   4) 段階 full のセッション → 管理画面
 *
 * 守り：パスワードの総当たり（同じ人は5回で15分止める・同じ IP は15分に20回まで）・CSRF（フォームの合言葉＋Origin の確認）・
 *       同じ答えのエラー（「その人がいるか」を探らせない）・新しい場所からのログインをオーナーにメールで知らせる
 */
final class AdminController
{
    private const LOCK_AFTER = 5;

    public function __construct(private App $app)
    {
    }

    /** ログイン前の CSRF 用クッキー。本番は __Host-（ほかのサブドメインから、すり替えられない） */
    private function preCookie(): string
    {
        return $this->app->config->isProduction() ? '__Host-hub_pre' : 'hub_pre';
    }

    public function handle(Request $req): Response
    {
        $p = rtrim($req->path, '/') ?: '/admin';
        $allowIps = $this->app->config->arr('admin.allowed_ips');
        if ($allowIps && !in_array($req->ip, $allowIps, true)) {
            return Response::text('forbidden', 403);
        }
        if ($req->method === 'POST' && !$this->sameOrigin($req)) {
            $this->app->log()->warn('管理画面：ほかのサイトからの送信を断りました', ['path' => $p, 'origin' => $req->header('origin')]);
            return $p === '/admin/rpc' ? $this->rpcError(403, 'forbidden', 'ほかのサイトからは呼び出せません') : Response::text('forbidden', 403);
        }
        return match (true) {
            $p === '/admin/login' && $req->method === 'GET' => $this->loginForm($req),
            $p === '/admin/login' && $req->method === 'POST' => $this->login($req),
            $p === '/admin/2fa' => $this->twoFactor($req),
            $p === '/admin/2fa/setup' => $this->setup($req),
            $p === '/admin/password' => $this->password($req),
            $p === '/admin/logout' && $req->method === 'POST' => $this->logout($req),
            $p === '/admin/rpc' && $req->method === 'POST' => $this->rpc($req),
            $p === '/admin' && $req->method === 'GET' => $this->shell($req),
            default => Response::text('not found', 404),
        };
    }

    // ---- 共通 ----

    /** POST が、このサイトの画面から来たか（Origin・Sec-Fetch-Site。どちらも無い古いブラウザは、クッキーの SameSite に任せる） */
    private function sameOrigin(Request $req): bool
    {
        $origin = $req->header('origin');
        if ($origin !== '' && $origin !== 'null') {
            $u = parse_url($this->app->config->baseUrl());
            $expect = ($u['scheme'] ?? 'https') . '://' . ($u['host'] ?? '') . (isset($u['port']) ? ':' . $u['port'] : '');
            if (strtolower($origin) !== strtolower($expect)) {
                return false;
            }
        }
        $site = $req->header('sec-fetch-site');
        return $site === '' || $site === 'same-origin';
    }

    private function redirect(string $path, ?Response $res = null): Response
    {
        $r = $res ?? new Response();
        $r->status = 303;
        $r->headers['location'] = View::url($this->app, $path);
        return $r;
    }

    /** どこへ進むか（段階と、その人の状態で決まる） */
    private function next(array $admin, string $stage): string
    {
        if ($admin['must_change_password']) {
            return '/admin/password';
        }
        if ($stage !== 'full') {
            return $admin['totp_enabled_at'] === null ? '/admin/2fa/setup' : '/admin/2fa';
        }
        return '/admin';
    }

    private function checkCsrf(Request $req, array $session): bool
    {
        $t = $req->post['_csrf'] ?? '';
        return is_string($t) && $t !== '' && hash_equals($session['csrf'], $t);
    }

    private function actor(array $admin): array
    {
        return ['id' => $admin['id'], 'email' => $admin['email']];
    }

    // ---- ログイン ----

    private function loginForm(Request $req, ?string $error = null, int $status = 200): Response
    {
        $s = Session::load($this->app, $req);
        if ($s) {
            return $this->redirect($this->next($s['admin'], $s['session']['stage']));
        }
        $res = new Response();
        $pre = Crypto::token(24);
        $res->cookie($this->preCookie(), $pre, 1800, $this->app->config->isProduction());
        $res->status = $status;
        $res->headers['content-type'] = 'text/html; charset=utf-8';
        $res->body = View::card($this->app, 'ログイン', View::error($error) . '
<form method="post" action="' . View::h(View::url($this->app, '/admin/login')) . '" autocomplete="on">
' . View::csrf($pre) . '
<label>メールアドレス<input type="email" name="email" required autocomplete="username" maxlength="200" autofocus></label>
<label>パスワード<input type="password" name="password" required autocomplete="current-password" maxlength="128"></label>
<button type="submit" class="pri">次へ</button>
</form>
<p class="muted small">このあと、二段階認証のコードを入れます。パスワードを忘れたときは、オーナーに「仮パスワードの作り直し」を頼んでください。</p>');
        return $res;
    }

    private function login(Request $req): Response
    {
        $app = $this->app;
        $pre = $req->cookie($this->preCookie());
        if (!is_string($pre) || !hash_equals($pre, (string) ($req->post['_csrf'] ?? ''))) {
            return $this->loginForm($req, '画面の有効期限が切れました。もう一度入れてください', 400);
        }
        $ipLimit = $app->limiter()->hit('login_ip:' . $req->ip, 20, 900);
        if (!$ipLimit['ok']) {
            $app->audit()->record(null, 'auth.login_rate_limited', ['ip' => $req->ip], false, null, $req->ip);
            return $this->loginForm($req, 'ログインの試行が多すぎます。15分ほど待ってから、もう一度お試しください', 429);
        }
        $email = trim((string) ($req->post['email'] ?? ''));
        $pw = (string) ($req->post['password'] ?? '');
        $generic = 'メールアドレスかパスワードが違います（続けて間違えると、しばらくログインできなくなります）';
        $admin = $email !== '' ? Members::getByEmail($app, $email) : null;
        if (!$admin || $pw === '' || strlen($pw) > 512) {
            $app->password()->dummyVerify($pw);
            $app->audit()->record(['id' => null, 'email' => mb_substr($email, 0, 200)], 'auth.login_failed', ['reason' => 'unknown_user'], false, null, $req->ip);
            return $this->loginForm($req, $generic, 401);
        }
        $now = $app->now();
        $locked = $admin['locked_until'] !== null && Time::parse($admin['locked_until']) > $now;
        $ok = !$locked && $admin['disabled_at'] === null && $app->password()->verify($pw, $admin['password_hash']);
        if (!$ok) {
            if (!$locked) {
                $this->countFailure($admin);
            }
            $app->audit()->record($this->actor($admin), 'auth.login_failed', ['reason' => $locked ? 'locked' : 'password'], false, null, $req->ip);
            return $this->loginForm($req, $generic, 401);
        }
        if ($app->password()->needsRehash($admin['password_hash'])) {
            $app->db()->exec('UPDATE hub_admins SET password_hash = ? WHERE id = ?', [$app->password()->hash($pw), $admin['id']]);
        }
        $res = new Response();
        $res->cookie($this->preCookie(), '', 0, $app->config->isProduction());
        Session::start($app, $req, $res, $admin['id'], 'password');
        return $this->redirect($this->next($admin, 'password'), $res);
    }

    /** 失敗を数え、続けて間違えたら、しばらく止める（5回で15分、10回からは60分） */
    private function countFailure(array $admin): void
    {
        $n = (int) $admin['failed_logins'] + 1;
        $lock = $n >= self::LOCK_AFTER ? Time::addMinutes($this->app->now(), $n >= 10 ? 60 : 15) : null;
        $this->app->db()->exec('UPDATE hub_admins SET failed_logins = ?, locked_until = COALESCE(?, locked_until) WHERE id = ?', [$n, $lock, $admin['id']]);
        if ($n === self::LOCK_AFTER || $n === 10) {
            $this->app->alerts()->raise('login_lock:' . $admin['id'], 'ログインの失敗が続いています', "運営メンバー {$admin['email']} のログインが {$n} 回続けて失敗したため、しばらく止めました。\n本人の打ち間違いでなければ、パスワードを狙われている可能性があります。管理画面の「操作の記録」を確かめてください。", 30);
        }
    }

    // ---- 二段階認証（コードを入れる） ----

    private function twoFactor(Request $req): Response
    {
        $app = $this->app;
        $s = Session::load($app, $req);
        if (!$s) {
            return $this->redirect('/admin/login');
        }
        ['session' => $sess, 'admin' => $admin] = $s;
        if ($sess['stage'] === 'full' || $admin['must_change_password'] || $admin['totp_enabled_at'] === null) {
            return $this->redirect($this->next($admin, $sess['stage']));
        }
        $error = null;
        if ($req->method === 'POST') {
            if (!$this->checkCsrf($req, $sess)) {
                $error = '画面の有効期限が切れました。もう一度入れてください';
            } else {
                $code = preg_replace('/\s+/', '', (string) ($req->post['code'] ?? '')) ?? '';
                $now = $app->now();
                $locked = $admin['locked_until'] !== null && Time::parse($admin['locked_until']) > $now;
                $step = null;
                $usedRecovery = false;
                if (!$locked && preg_match('/^\d{6}$/', $code)) {
                    $secret = $app->crypto()->decrypt((string) $admin['totp_secret'], 'hub_admins.totp_secret');
                    $step = Totp::verify($secret, $code, intdiv(Time::ms($now), 1000), $admin['totp_last_step'] === null ? null : (int) $admin['totp_last_step']);
                } elseif (!$locked && preg_match('/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/', $code)) {
                    $usedRecovery = $this->useRecoveryCode($admin['id'], $code);
                }
                if ($step !== null || $usedRecovery) {
                    $app->db()->exec(
                        'UPDATE hub_admins SET totp_last_step = COALESCE(?, totp_last_step), failed_logins = 0, locked_until = NULL, last_login_at = ?, last_login_ip = ? WHERE id = ?',
                        [$step, $now, mb_substr($req->ip, 0, 45), $admin['id']]
                    );
                    $this->noticeNewPlace($admin, $req->ip);
                    $app->audit()->record($this->actor($admin), 'auth.login', ['method' => $usedRecovery ? 'recovery_code' : 'totp'], true, null, $req->ip);
                    $res = new Response();
                    Session::start($app, $req, $res, $admin['id'], 'full');
                    if ($usedRecovery) {
                        $left = (int) $app->db()->value('SELECT COUNT(*) FROM hub_admin_recovery_codes WHERE admin_id = ? AND used_at IS NULL', [$admin['id']]);
                        $app->alerts()->raise('recovery_used:' . $admin['id'], '回復コードでログインしました', "運営メンバー {$admin['email']} が、回復コードでログインしました（残り {$left} 個）。\n認証アプリを無くした場合は、オーナーが bin/hub admin:reset-2fa で登録し直してください。", 1);
                    }
                    return $this->redirect('/admin', $res);
                }
                if (!$locked) {
                    $this->countFailure($admin);
                }
                $app->audit()->record($this->actor($admin), 'auth.2fa_failed', [], false, null, $req->ip);
                $error = 'コードが違います（30秒ごとに変わります。時計がずれていないかも確かめてください）';
            }
        }
        $res = Response::html(View::card($app, '二段階認証', View::error($error) . '
<p>認証アプリ（Google Authenticator など）に出ている6桁のコードを入れてください。</p>
<form method="post" action="' . View::h(View::url($app, '/admin/2fa')) . '">
' . View::csrf($sess['csrf']) . '
<label>6桁のコード<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9A-Za-z\- ]{6,10}" maxlength="10" required autofocus></label>
<button type="submit" class="pri">ログイン</button>
</form>
<p class="muted small">アプリを無くしたときは、登録のときに控えた回復コード（xxxx-xxxx）を入れてください。</p>
<form method="post" action="' . View::h(View::url($app, '/admin/logout')) . '">' . View::csrf($sess['csrf']) . '<button type="submit" class="link">やめる</button></form>'), $error ? 401 : 200);
        return $res;
    }

    private function useRecoveryCode(string $adminId, string $code): bool
    {
        $norm = strtolower(str_replace('-', '', $code));
        $hash = $this->app->crypto()->index($norm, 'recovery:' . $adminId);
        return $this->app->db()->exec('UPDATE hub_admin_recovery_codes SET used_at = ? WHERE admin_id = ? AND code_hash = ? AND used_at IS NULL', [$this->app->now(), $adminId, $hash]) === 1;
    }

    /** これまでに無い IP からのログインなら、オーナー（alert.to）に知らせる */
    private function noticeNewPlace(array $admin, string $ip): void
    {
        if ($admin['last_login_at'] === null) {
            return; // はじめてのログイン
        }
        $seen = $this->app->db()->one(
            "SELECT 1 AS ok FROM hub_audit_log WHERE action = 'auth.login' AND actor_id = ? AND ip = ? AND at > ? LIMIT 1",
            [$admin['id'], $ip, Time::addSeconds($this->app->now(), -90 * 86400)]
        );
        if (!$seen) {
            $this->app->alerts()->raise('new_place:' . $admin['id'] . ':' . $ip, '新しい場所からのログイン', "運営メンバー {$admin['email']} が、これまでに無い場所（IP: {$ip}）からログインしました。\n本人に心当たりがあるか、確かめてください。心当たりが無ければ、すぐに管理画面の「運営メンバー」から外すか、bin/hub admin:logout-all で全員を締め出してください。", 1);
        }
    }

    // ---- 二段階認証の登録 ----

    private function setup(Request $req): Response
    {
        $app = $this->app;
        $s = Session::load($app, $req);
        if (!$s) {
            return $this->redirect('/admin/login');
        }
        ['session' => $sess, 'admin' => $admin] = $s;
        if ($admin['totp_enabled_at'] !== null || $admin['must_change_password']) {
            return $this->redirect($this->next($admin, $sess['stage']));
        }
        $crypto = $app->crypto();
        if ($admin['totp_secret'] === null) {
            $admin['totp_secret'] = $crypto->encrypt(Totp::newSecret(), 'hub_admins.totp_secret');
            $app->db()->exec('UPDATE hub_admins SET totp_secret = ? WHERE id = ?', [$admin['totp_secret'], $admin['id']]);
        }
        $secret = $crypto->decrypt((string) $admin['totp_secret'], 'hub_admins.totp_secret');
        $error = null;
        if ($req->method === 'POST') {
            if (!$this->checkCsrf($req, $sess)) {
                $error = '画面の有効期限が切れました。もう一度入れてください';
            } else {
                $now = $app->now();
                $step = Totp::verify($secret, (string) ($req->post['code'] ?? ''), intdiv(Time::ms($now), 1000));
                if ($step !== null) {
                    $codes = [];
                    $app->db()->tx(function () use ($app, $admin, $step, $now, &$codes): void {
                        $app->db()->exec('UPDATE hub_admins SET totp_enabled_at = ?, totp_last_step = ?, last_login_at = ?, failed_logins = 0 WHERE id = ?', [$now, $step, $now, $admin['id']]);
                        $app->db()->exec('DELETE FROM hub_admin_recovery_codes WHERE admin_id = ?', [$admin['id']]);
                        for ($i = 0; $i < 10; $i++) {
                            $c = strtolower(substr(strtr(Crypto::token(8), '-_', 'xy'), 0, 8));
                            $codes[] = substr($c, 0, 4) . '-' . substr($c, 4, 4);
                            $app->db()->exec('INSERT INTO hub_admin_recovery_codes (admin_id, code_hash) VALUES (?, ?)', [$admin['id'], $app->crypto()->index($c, 'recovery:' . $admin['id'])]);
                        }
                    });
                    $app->audit()->record($this->actor($admin), 'auth.2fa_enrolled', [], true, null, $req->ip);
                    $app->audit()->record($this->actor($admin), 'auth.login', ['method' => 'totp_enroll'], true, null, $req->ip);
                    $res = Response::html(View::card($app, '回復コードを控えてください', '
<p>二段階認証の登録ができました。<strong>認証アプリを無くしたとき</strong>のための、使い捨ての回復コードです。<br>この画面は<strong>1回しか出ません</strong>。紙に書くか、パスワード管理アプリに保存してください（スクリーンショットを共有のアルバムに残さないでください）。</p>
<ol class="codes">' . implode('', array_map(fn ($c) => '<li><code>' . View::h($c) . '</code></li>', $codes)) . '</ol>
<p><a class="button pri" href="' . View::h(View::url($app, '/admin')) . '">控えました。管理画面へ</a></p>'));
                    Session::start($app, $req, $res, $admin['id'], 'full');
                    return $res;
                }
                $error = 'コードが違います。アプリに出ている、いまの6桁を入れてください';
            }
        }
        $uri = Totp::uri($secret, $admin['email'], $app->appName());
        return Response::html(View::card($app, '二段階認証の登録', View::error($error) . '
<p>スマホの認証アプリ（Google Authenticator・Microsoft Authenticator・1Password など）で、下の QR コードを読み込んでください。</p>
<div id="qr" class="qr" data-uri="' . View::h($uri) . '"></div>
<details><summary>QR コードを読めないとき</summary><p>アプリに、次の文字を手で入れてください：<br><code class="secret">' . View::h(trim(chunk_split($secret, 4, ' '))) . '</code></p></details>
<form method="post" action="' . View::h(View::url($app, '/admin/2fa/setup')) . '">
' . View::csrf($sess['csrf']) . '
<label>アプリに出た6桁のコード<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" required></label>
<button type="submit" class="pri">登録する</button>
</form>', ['classic' => ['vendor/qrcode.js'], 'scripts' => ['totp-setup.js']]), $error ? 400 : 200);
    }

    // ---- パスワードの変更 ----

    private function password(Request $req): Response
    {
        $app = $this->app;
        $s = Session::load($app, $req);
        if (!$s) {
            return $this->redirect('/admin/login');
        }
        ['session' => $sess, 'admin' => $admin] = $s;
        if ($sess['stage'] !== 'full' && !$admin['must_change_password']) {
            return $this->redirect($this->next($admin, $sess['stage']));
        }
        $error = null;
        if ($req->method === 'POST') {
            $cur = (string) ($req->post['current'] ?? '');
            $new = (string) ($req->post['new'] ?? '');
            $again = (string) ($req->post['again'] ?? '');
            if (!$this->checkCsrf($req, $sess)) {
                $error = '画面の有効期限が切れました。もう一度入れてください';
            } elseif (!$app->limiter()->hit('pwchange:' . $admin['id'], 10, 900)['ok']) {
                $error = '試行が多すぎます。しばらく待ってから、もう一度お試しください';
            } elseif (!$app->password()->verify($cur, $admin['password_hash'])) {
                $error = 'いまのパスワードが違います';
            } elseif ($new !== $again) {
                $error = '新しいパスワードが、2か所で違います';
            } elseif ($new === $cur) {
                $error = 'いまと違うパスワードにしてください';
            } elseif ($e = Password::policyError($new, $admin['email'])) {
                $error = $e;
            } else {
                $now = $app->now();
                $app->db()->exec('UPDATE hub_admins SET password_hash = ?, must_change_password = 0, password_changed_at = ?, updated_at = ? WHERE id = ?', [$app->password()->hash($new), $now, $now, $admin['id']]);
                Session::endAllFor($app, $admin['id'], $sess['id_hash']); // ほかの場所のログインは締め出す
                $app->audit()->record($this->actor($admin), 'auth.password_changed', [], true, null, $req->ip);
                $admin['must_change_password'] = false;
                return $this->redirect($this->next($admin, $sess['stage']));
            }
        }
        $lead = $admin['must_change_password']
            ? '<p class="notice">はじめに、仮パスワードを、自分だけのパスワードに変えてください。</p>'
            : '';
        return Response::html(View::card($app, 'パスワードの変更', View::error($error) . $lead . '
<form method="post" action="' . View::h(View::url($app, '/admin/password')) . '">
' . View::csrf($sess['csrf']) . '
<label>いまのパスワード' . ($admin['must_change_password'] ? '（仮パスワード）' : '') . '<input type="password" name="current" required autocomplete="current-password" maxlength="128"></label>
<label>新しいパスワード（12文字以上）<input type="password" name="new" required autocomplete="new-password" minlength="12" maxlength="128"></label>
<label>新しいパスワード（もう一度）<input type="password" name="again" required autocomplete="new-password" minlength="12" maxlength="128"></label>
<button type="submit" class="pri">変える</button>
</form>
<p class="muted small">長い文が覚えやすく、強いです（例：「朝のピアノは3曲までと決めている」）。ほかのサービスと同じパスワードは使わないでください。</p>'), $error ? 400 : 200);
    }

    private function logout(Request $req): Response
    {
        $s = Session::load($this->app, $req);
        $res = new Response();
        if ($s && $this->checkCsrf($req, $s['session'])) {
            $this->app->audit()->record($this->actor($s['admin']), 'auth.logout', [], true, null, $req->ip);
            Session::end($this->app, $req, $res);
        }
        return $this->redirect('/admin/login', $res);
    }

    // ---- 管理画面の本体 ----

    private function shell(Request $req): Response
    {
        $app = $this->app;
        $s = Session::load($app, $req);
        if (!$s || $s['session']['stage'] !== 'full' || $s['admin']['must_change_password']) {
            return $this->redirect($s ? $this->next($s['admin'], $s['session']['stage']) : '/admin/login');
        }
        ['session' => $sess, 'admin' => $admin] = $s;
        $role = Members::ROLE_LABEL[$admin['role']] ?? $admin['role'];
        $body = '<header class="bar">
<strong>' . View::h($app->appName()) . '</strong>
<span class="who">' . View::h($admin['display_name'] ?: $admin['email']) . '（' . View::h($role) . '）</span>
<a href="' . View::h(View::url($app, '/admin/password')) . '">パスワード</a>
<form method="post" action="' . View::h(View::url($app, '/admin/logout')) . '">' . View::csrf($sess['csrf']) . '<button type="submit" class="link">ログアウト</button></form>
</header>
<main class="app"><line-hub-admin id="admin"></line-hub-admin></main>';
        return Response::html(View::page($app, '管理画面', $body, [
            'bodyClass' => 'app-page',
            'scripts' => ['admin-boot.js'],
            'meta' => ['hub-csrf' => $sess['csrf'], 'hub-rpc' => View::url($app, '/admin/rpc'), 'hub-login' => View::url($app, '/admin/login'), 'hub-idle-min' => (string) $app->config->int('admin.idle_timeout_min', 30)],
        ]));
    }

    // ---- 管理 API ----

    private function rpcError(int $status, string $code, string $message, array $headers = []): Response
    {
        return Response::json(['ok' => false, 'error' => ['code' => $code, 'message' => $message]], $status, $headers);
    }

    private function rpc(Request $req): Response
    {
        $app = $this->app;
        $s = Session::load($app, $req);
        if (!$s || $s['session']['stage'] !== 'full') {
            return $this->rpcError(401, 'unauthenticated', 'ログインが必要です（時間がたつと、自動でログアウトします）');
        }
        ['session' => $sess, 'admin' => $admin] = $s;
        if ($admin['must_change_password']) {
            return $this->rpcError(403, 'password_change_required', 'はじめに、仮パスワードを、自分のパスワードに変えてください');
        }
        if (!hash_equals($sess['csrf'], $req->header('x-csrf-token'))) {
            return $this->rpcError(403, 'forbidden', '画面を読み直してください（合言葉が合いません）');
        }
        if (!$req->isJson()) {
            return $this->rpcError(415, 'bad_request', 'JSON で送ってください');
        }
        if (strlen($req->body) > 300_000) {
            return $this->rpcError(413, 'too_large', '送る内容が大きすぎます');
        }
        $rl = $app->limiter()->hit('rpc:' . $admin['id'], 120, 60);
        if (!$rl['ok']) {
            return $this->rpcError(429, 'rate_limited', '呼び出しが多すぎます。しばらくしてからもう一度お試しください', ['retry-after' => (string) $rl['retryAfter']]);
        }
        $body = $req->json();
        if (!is_array($body) || !is_string($body['action'] ?? null)) {
            return $this->rpcError(400, 'bad_request', 'action（文字列）が必要です');
        }
        $who = ['id' => $admin['id'], 'email' => $admin['email'], 'role' => $admin['role'], 'displayName' => $admin['display_name']];
        try {
            $result = (new Rpc($app))->call($who, $body['action'], $body['params'] ?? [], $req->ip);
            return Response::json(['ok' => true, 'result' => $result]);
        } catch (RpcError $e) {
            return $this->rpcError($e->status, $e->codeName, $e->getMessage());
        } catch (\Throwable $e) {
            $app->log()->error('管理 API の処理に失敗しました', ['error' => $e->getMessage()]);
            return $this->rpcError(500, 'internal', '内部エラーが起きました');
        }
    }
}
