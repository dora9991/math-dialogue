<?php
declare(strict_types=1);

// xserver-hub：公開フォルダの入口（ここだけが Web から見える PHP）。プログラムと秘密は、公開フォルダの外（HUB_ROOT）にある。
// HUB_ROOT は、置くときに tools/deploy.sh が、この下の1行を書き換える（例：/home/xs123456/hub）。
// 書き換えていないとき（手元で動かすとき）は、環境変数 HUB_ROOT か、このフォルダの1つ上を使う。

const HUB_ROOT = '__HUB_ROOT__';

$root = strncmp(HUB_ROOT, '/', 1) === 0 ? HUB_ROOT : (getenv('HUB_ROOT') ?: \dirname(__DIR__));
if (!is_file($root . '/app/bootstrap.php')) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "ハブのプログラムが見つかりません（index.php の HUB_ROOT を確かめてください）\n";
    exit;
}
require $root . '/app/bootstrap.php';

use Hub\Kernel\App;
use Hub\Kernel\Config;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Web\Front;

ini_set('display_errors', '0'); // エラーの詳しい中身を、画面に出さない（ログにだけ）
ini_set('expose_php', '0');

try {
    $app = new App(Config::load());
    $basePath = rtrim((string) parse_url($app->config->baseUrl(), PHP_URL_PATH), '/');
    $req = Request::fromGlobals($basePath);
    $front = new Front($app);
    $res = $front->handle($req);
} catch (\Throwable $e) {
    error_log('[hub] ' . $e->getMessage());
    $res = Response::text('internal error', 500);
    $front = null;
}
if ($front !== null && $front->after !== null) {
    // 応答の長さを先に伝えて、LINE が待たずに接続を閉じられるようにする
    $res->header('connection', 'close')->header('content-length', (string) strlen($res->body));
}
$res->withSecurityHeaders(true)->send();

// LINE の Webhook：先に 200 を返してから、イベントを処理する（PHP-FPM のとき）。返せない環境では、そのまま続けて処理する
if ($front !== null && $front->after !== null) {
    ignore_user_abort(true);
    set_time_limit(120);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        @ob_end_flush();
        @flush();
    }
    ($front->after)();
}
