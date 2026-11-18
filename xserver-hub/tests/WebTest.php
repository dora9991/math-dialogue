<?php
declare(strict_types=1);

// Web の入口：ログイン（パスワード→パスワード変更→二段階認証の登録→回復コード）・管理 API・CSRF・Origin・締め出し・Webhook

use Hub\Admin\Members;
use Hub\Kernel\App;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Kernel\Time;
use Hub\Kernel\Totp;
use Hub\Web\Front;

/** クッキーを覚えるだけの、小さなブラウザ役 */
final class Browser
{
    public array $cookies = [];
    public ?Response $last = null;
    public ?Front $front = null;

    public function __construct(private App $app, private string $origin = 'https://hub.example.test')
    {
    }

    public function req(string $method, string $path, array $post = [], array $headers = [], string $body = ''): Response
    {
        $h = ['host' => 'hub.example.test', 'user-agent' => 'test'] + $headers;
        if ($method === 'POST' && !isset($h['origin'])) {
            $h['origin'] = $this->origin;
            $h['sec-fetch-site'] = 'same-origin';
        }
        $r = new Request($method, $path, $h, $body, [], $post, $this->cookies, '198.51.100.7', true);
        $this->front = new Front($this->app);
        $res = $this->front->handle($r);
        foreach ($res->cookies as $c) {
            [$kv] = explode(';', $c, 2);
            [$k, $v] = explode('=', $kv, 2);
            $k = rawurldecode($k);
            if (str_contains($c, 'Max-Age=0')) {
                unset($this->cookies[$k]);
            } else {
                $this->cookies[$k] = rawurldecode($v);
            }
        }
        return $this->last = $res;
    }

    /** フォームの _csrf の値 */
    public function csrf(): string
    {
        preg_match('/name="_csrf" value="([^"]+)"/', (string) $this->last?->body, $m);
        return $m[1] ?? '';
    }

    public function rpc(string $action, array $params = [], ?string $csrf = null): Response
    {
        return $this->req('POST', '/admin/rpc', [], ['content-type' => 'application/json', 'x-csrf-token' => $csrf ?? $this->metaCsrf], json_encode(['action' => $action, 'params' => $params]));
    }

    public string $metaCsrf = '';
}

/** オーナーを作って、ログインから管理画面まで進める。@return array{0:Browser,1:string} */
function loginAsNewOwner(App $app): array
{
    $temp = 'TempPassword-123';
    $id = Members::create($app, 'owner@example.test', 'owner', 'オーナー', $temp, true, 'test');
    $b = new Browser($app);
    $b->req('GET', '/admin/login');
    $b->req('POST', '/admin/login', ['_csrf' => $b->csrf(), 'email' => 'owner@example.test', 'password' => $temp]);
    T::eq(303, $b->last->status);
    T::eq('/admin/password', $b->last->headers['location']);
    $b->req('GET', '/admin/password');
    $b->req('POST', '/admin/password', ['_csrf' => $b->csrf(), 'current' => $temp, 'new' => '朝のピアノは3曲までと決めている', 'again' => '朝のピアノは3曲までと決めている']);
    T::eq('/admin/2fa/setup', $b->last->headers['location'] ?? null);
    $b->req('GET', '/admin/2fa/setup');
    T::contains('data-uri="otpauth://totp/', $b->last->body);
    $secret = $app->crypto()->decrypt((string) $app->db()->value('SELECT totp_secret FROM hub_admins WHERE id = ?', [$id]), 'hub_admins.totp_secret');
    $code = Totp::code($secret, Totp::step(intdiv(Time::ms($app->now()), 1000)));
    $b->req('POST', '/admin/2fa/setup', ['_csrf' => $b->csrf(), 'code' => $code]);
    T::eq(200, $b->last->status);
    T::contains('回復コード', $b->last->body);
    preg_match_all('/<code>([a-z0-9]{4}-[a-z0-9]{4})<\/code>/', $b->last->body, $m);
    T::eq(10, count($m[1]), '回復コードは10個');
    $b->req('GET', '/admin');
    T::eq(200, $b->last->status);
    preg_match('/name="hub-csrf" content="([^"]+)"/', $b->last->body, $mm);
    $b->metaCsrf = $mm[1] ?? '';
    return [$b, $id, $m[1], $secret];
}

return [
    '/health と、知らない道は 404' => function () {
        [$app] = T::app();
        $b = new Browser($app);
        T::eq(200, $b->req('GET', '/health')->status);
        T::eq('{"ok":true}', $b->last->body);
        T::eq(404, $b->req('GET', '/config/config.php')->status);
    },

    'ログイン → パスワード変更 → 二段階認証の登録 → 管理画面 → 管理 API' => function () {
        [$app] = T::app();
        [$b] = loginAsNewOwner($app);
        T::contains('<line-hub-admin', $b->last->body);
        T::contains("script-src 'self'", $b->last->withSecurityHeaders()->headers['content-security-policy'] ?? '');
        $me = json_decode($b->rpc('me')->body, true);
        T::eq(true, $me['ok']);
        T::eq('owner', $me['result']['role']);
        $raw = $b->rpc('dashboard')->body;
        T::eq(true, json_decode($raw, true)['ok']);
        T::contains('"plan_limits":{}', $raw, '空の表は {} のまま返す（画面の JavaScript が {} を期待する）');
        // 記録：ログイン・パスワード変更・二段階認証の登録が残る
        $acts = array_column($app->db()->all('SELECT action FROM hub_audit_log ORDER BY id'), 'action');
        T::ok(in_array('auth.password_changed', $acts, true));
        T::ok(in_array('auth.2fa_enrolled', $acts, true));
    },

    '管理 API：合言葉（CSRF）なし・ほかのサイトから・JSON でない、は断る' => function () {
        [$app] = T::app();
        [$b] = loginAsNewOwner($app);
        T::eq(403, $b->rpc('me', [], 'wrong')->status);
        $r = $b->req('POST', '/admin/rpc', [], ['content-type' => 'application/json', 'x-csrf-token' => $b->metaCsrf, 'origin' => 'https://evil.example', 'sec-fetch-site' => 'cross-site'], '{"action":"me"}');
        T::eq(403, $r->status);
        $r = $b->req('POST', '/admin/rpc', [], ['content-type' => 'text/plain', 'x-csrf-token' => $b->metaCsrf], '{"action":"me"}');
        T::eq(415, $r->status);
        T::eq(404, $b->rpc('drop.everything')->status, '許可リストに無い操作');
    },

    '二段階認証のコード・回復コードでのログイン、同じ回復コードは2回使えない' => function () {
        [$app] = T::app();
        [$b, $id, $codes, $secret] = loginAsNewOwner($app);
        $b->req('POST', '/admin/logout', ['_csrf' => $b->metaCsrf]);
        T::eq(401, $b->rpc('me')->status, 'ログアウトしたら使えない');
        $login = function () use ($app): Browser {
            $c = new Browser($app);
            $c->req('GET', '/admin/login');
            $c->req('POST', '/admin/login', ['_csrf' => $c->csrf(), 'email' => 'owner@example.test', 'password' => '朝のピアノは3曲までと決めている']);
            T::eq('/admin/2fa', $c->last->headers['location'] ?? null);
            $c->req('GET', '/admin/2fa');
            return $c;
        };
        $c = $login();
        $c->req('POST', '/admin/2fa', ['_csrf' => $c->csrf(), 'code' => '000000']);
        T::eq(401, $c->last->status);
        $c->req('POST', '/admin/2fa', ['_csrf' => $c->csrf(), 'code' => $codes[0]]);
        T::eq('/admin', $c->last->headers['location'] ?? null, '回復コードで入れる');
        T::ok(count(array_filter($app->mailer()->sent, fn ($m) => str_contains($m['subject'], '回復コード'))) === 1, '回復コードを使ったらオーナーに知らせる');
        $d = $login();
        $d->req('POST', '/admin/2fa', ['_csrf' => $d->csrf(), 'code' => $codes[0]]);
        T::eq(401, $d->last->status, '同じ回復コードは2回使えない');
        $app->clock->advance(60);
        $d->req('POST', '/admin/2fa', ['_csrf' => $d->csrf(), 'code' => Totp::code($secret, Totp::step(intdiv(Time::ms($app->now()), 1000)))]);
        T::eq('/admin', $d->last->headers['location'] ?? null);
    },

    'パスワードを5回まちがえると止まる（正しいパスワードでも入れない）・知らせが届く' => function () {
        [$app] = T::app();
        Members::create($app, 'op@example.test', 'operator', null, '朝のピアノは3曲までと決めている', false, 'test');
        $b = new Browser($app);
        for ($i = 0; $i < 5; $i++) {
            $b->req('GET', '/admin/login');
            $b->req('POST', '/admin/login', ['_csrf' => $b->csrf(), 'email' => 'op@example.test', 'password' => 'wrong-password-' . $i]);
            T::eq(401, $b->last->status);
        }
        $b->req('GET', '/admin/login');
        $b->req('POST', '/admin/login', ['_csrf' => $b->csrf(), 'email' => 'op@example.test', 'password' => '朝のピアノは3曲までと決めている']);
        T::eq(401, $b->last->status, '止めている間は、正しいパスワードでも入れない');
        T::contains('メールアドレスかパスワードが違います', $b->last->body, '止めていることは言わない（同じ答え）');
        T::ok(count($app->mailer()->sent) >= 1, 'オーナーに知らせる');
        $app->clock->advance(16 * 60);
        $b->req('GET', '/admin/login');
        $b->req('POST', '/admin/login', ['_csrf' => $b->csrf(), 'email' => 'op@example.test', 'password' => '朝のピアノは3曲までと決めている']);
        T::eq(303, $b->last->status, '15分たてば入れる');
        // 知らない人も、同じ答え
        $b2 = new Browser($app);
        $b2->req('GET', '/admin/login');
        $b2->req('POST', '/admin/login', ['_csrf' => $b2->csrf(), 'email' => 'nobody@example.test', 'password' => 'x']);
        T::eq(401, $b2->last->status);
        T::contains('メールアドレスかパスワードが違います', $b2->last->body);
    },

    'ログインの合言葉が無い POST・ほかのサイトからの POST は断る' => function () {
        [$app] = T::app();
        $b = new Browser($app);
        $b->req('GET', '/admin/login');
        $b->req('POST', '/admin/login', ['_csrf' => 'forged', 'email' => 'a@example.test', 'password' => 'x']);
        T::eq(400, $b->last->status);
        $r = $b->req('POST', '/admin/login', ['_csrf' => $b->cookies['hub_pre'] ?? '', 'email' => 'a@example.test', 'password' => 'x'], ['origin' => 'https://evil.example', 'sec-fetch-site' => 'cross-site']);
        T::eq(403, $r->status);
    },

    '権限：閲覧のみの人は書き込めない（記録に残る）・30分なにもしないと切れる' => function () {
        [$app] = T::app();
        [$owner] = loginAsNewOwner($app);
        $add = json_decode($owner->rpc('members.add', ['email' => 'viewer@example.test', 'role' => 'viewer'])->body, true);
        T::eq(true, $add['ok']);
        $temp = $add['result']['tempPassword'];
        // 閲覧のみの人でログイン
        $v = new Browser($app);
        $v->req('GET', '/admin/login');
        $v->req('POST', '/admin/login', ['_csrf' => $v->csrf(), 'email' => 'viewer@example.test', 'password' => $temp]);
        $v->req('GET', '/admin/password');
        $v->req('POST', '/admin/password', ['_csrf' => $v->csrf(), 'current' => $temp, 'new' => '見るだけの係をする先生です', 'again' => '見るだけの係をする先生です']);
        $v->req('GET', '/admin/2fa/setup');
        $vid = $add['result']['userId'];
        $secret = $app->crypto()->decrypt((string) $app->db()->value('SELECT totp_secret FROM hub_admins WHERE id = ?', [$vid]), 'hub_admins.totp_secret');
        $v->req('POST', '/admin/2fa/setup', ['_csrf' => $v->csrf(), 'code' => Totp::code($secret, Totp::step(intdiv(Time::ms($app->now()), 1000)))]);
        $v->req('GET', '/admin');
        preg_match('/name="hub-csrf" content="([^"]+)"/', $v->last->body, $mm);
        $v->metaCsrf = $mm[1];
        T::eq(200, $v->rpc('rules.list')->status, '見るのはできる');
        $r = $v->rpc('rules.save', ['rule' => ['name' => 'x', 'trigger_type' => 'follow', 'actions' => [['type' => 'reply', 'messages' => ['a']]]]]);
        T::eq(403, $r->status);
        T::eq('forbidden', json_decode($r->body, true)['error']['code']);
        T::eq(1, (int) $app->db()->value("SELECT COUNT(*) FROM hub_audit_log WHERE action = 'rules.save' AND ok = 0"), '断ったことも記録');
        T::eq(403, $v->rpc('members.list')->status);
        // 何もしない時間
        $app->clock->advance(31 * 60);
        T::eq(401, $v->rpc('rules.list')->status, '30分で切れる');
        // オーナーが外すと、その人はすぐ締め出される
        $app->clock->advance(-31 * 60);
    },

    'LINE の Webhook：署名が合えば 200 を返し、あとで処理する' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(500);
        [$raw, $sig] = Sim::sign([Sim::follow($line, $u)]);
        $b = new Browser($app);
        $r = $b->req('POST', '/webhook/line', [], ['x-line-signature' => $sig, 'content-type' => 'application/json'], $raw);
        T::eq(200, $r->status);
        T::eq(null, $app->db()->value('SELECT processed_at FROM line_events'), 'まだ処理していない');
        T::ok($b->front->after !== null);
        ($b->front->after)();
        T::ok($app->db()->value('SELECT processed_at FROM line_events') !== null, '200 のあとで処理した');
        T::eq(400, $b->req('POST', '/webhook/line', [], ['x-line-signature' => 'bad'], $raw)->status);
    },

    '本番の設定：違うホスト名・http は断る、クッキーは __Host-' => function () {
        [$app] = T::app(['app' => ['env' => 'production']]);
        $r = (new Front($app))->handle(new Request('GET', '/health', ['host' => 'example.test'], '', [], [], [], '1.2.3.4', true));
        T::eq(421, $r->status, 'サブドメインのフォルダを、本体のドメインから開かせない');
        $r = (new Front($app))->handle(new Request('GET', '/health', ['host' => 'hub.example.test'], '', [], [], [], '1.2.3.4', false));
        T::eq(403, $r->status, 'http は断る');
        $r = (new Front($app))->handle(new Request('GET', '/admin/login', ['host' => 'hub.example.test'], '', [], [], [], '1.2.3.4', true));
        T::eq(200, $r->status);
        T::ok(str_contains(implode("\n", $r->cookies), 'Secure'), 'Secure クッキー');
        T::contains('__Host-hub_pre=', implode("\n", $r->cookies), 'ログイン前のクッキーも __Host-（ほかのサブドメインから、すり替えられない）');
        Members::create($app, 'p@example.test', 'owner', null, '朝のピアノは3曲までと決めている', false, 'test');
        preg_match('/name="_csrf" value="([^"]+)"/', $r->body, $m);
        $login = fn (array $cookies) => (new Front($app))->handle(new Request('POST', '/admin/login', ['host' => 'hub.example.test', 'origin' => 'https://hub.example.test'], '', [], ['_csrf' => $m[1], 'email' => 'p@example.test', 'password' => '朝のピアノは3曲までと決めている'], $cookies, '1.2.3.4', true));
        T::ok($login(['hub_pre' => $m[1]])->status !== 303, '__Host- の付かないクッキーでは、通さない');
        $r2 = $login(['__Host-hub_pre' => $m[1]]);
        T::eq(303, $r2->status);
        T::contains('__Host-hub_sid=', implode("\n", $r2->cookies));
    },
];
