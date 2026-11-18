<?php
declare(strict_types=1);

namespace Hub\Web;

use Hub\Kernel\App;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Line\Webhook;
use Hub\Line\Zoom;
use Hub\Member\Api;

/**
 * Web の入口の振り分け（public/index.php から呼ばれる）。
 *
 *   GET  /health              … 動いているか（秘密は返さない）
 *   POST /webhook/line        … LINE の Webhook（署名を確かめる）
 *   POST /webhook/zoom        … Zoom の Webhook（署名を確かめる）
 *   *    /api/v1/…            … 会員サイトからの API（署名つき）
 *   *    /admin…              … 管理画面
 *
 * Host の確認：設定の app.base_url と違うホスト名で来たものは断る
 * （Xserver ではサブドメインのフォルダが本体のドメインの下にもあるので、別の入口から管理画面を開かせないため）
 */
final class Front
{
    /** 応答を返したあとに続けて行う処理（LINE の Webhook：先に 200 を返してから、イベントを処理する） */
    public ?\Closure $after = null;

    public function __construct(private App $app)
    {
    }

    public function handle(Request $req): Response
    {
        $app = $this->app;
        $host = strtolower(preg_replace('/:\d+$/', '', $req->header('host')) ?? '');
        if ($app->config->isProduction() && $host !== '' && $host !== $app->config->host()) {
            return Response::text('misdirected request', 421);
        }
        if ($app->config->isProduction() && !$req->https) {
            return Response::text('https only', 403);
        }
        if ($app->kv()->get('maintenance') !== null && !str_starts_with($req->path, '/webhook/')) {
            return Response::text('メンテナンス中です。しばらくしてから、もう一度お試しください。', 503, ['retry-after' => '300']);
        }
        $p = $req->path;
        try {
            if ($p === '/health' && $req->method === 'GET') {
                return Response::json(['ok' => true]);
            }
            if ($p === '/webhook/line') {
                return $req->method === 'POST' ? $this->lineWebhook($req) : Response::text('method not allowed', 405);
            }
            if ($p === '/webhook/zoom') {
                return $req->method === 'POST' ? $this->zoomWebhook($req) : Response::text('method not allowed', 405);
            }
            if (str_starts_with($p, '/api/v1/')) {
                return Api::handle($app, $req);
            }
            if ($p === '/admin' || str_starts_with($p, '/admin/')) {
                return (new AdminController($app))->handle($req);
            }
            if ($p === '/' && $req->method === 'GET') {
                return Response::redirect(View::url($app, '/admin/login'));
            }
        } catch (\Throwable $e) {
            $app->log()->error('処理に失敗しました', ['path' => $p, 'error' => $e->getMessage(), 'at' => $e->getFile() . ':' . $e->getLine()]);
            return str_starts_with($p, '/admin/rpc') || str_starts_with($p, '/api/')
                ? Response::json(['ok' => false, 'error' => ['code' => 'internal', 'message' => '内部エラーが起きました']], 500)
                : Response::text('internal error', 500); // 詳しい理由は返さない（ログにだけ）
        }
        return Response::text('not found', 404);
    }

    private function lineWebhook(Request $req): Response
    {
        if (strlen($req->body) > 1_000_000) {
            return Response::text('payload too large', 413);
        }
        $r = Webhook::accept($this->app, $req->body, $req->header('x-line-signature'));
        if ($r['status'] === 200 && $r['events']) {
            $app = $this->app;
            $events = $r['events'];
            $this->after = static fn () => Webhook::processAll($app, $events);
        }
        return Response::text($r['body'], $r['status']);
    }

    private function zoomWebhook(Request $req): Response
    {
        if (strlen($req->body) > 1_000_000) {
            return Response::text('payload too large', 413);
        }
        $r = Zoom::handleWebhook($this->app, $req->body, $req->header('x-zm-signature'), $req->header('x-zm-request-timestamp'), $this->app->config->str('zoom.secret_token'));
        return new Response($r['status'], $r['body'], ['content-type' => $r['contentType']]);
    }
}
