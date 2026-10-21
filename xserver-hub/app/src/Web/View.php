<?php
declare(strict_types=1);

namespace Hub\Web;

use Hub\Kernel\App;

/**
 * 画面（HTML）の組み立て。文字は必ず h() で、HTML の特別な文字を無害にしてから入れる（XSS 対策）。
 * スクリプトは、外のファイル（/assets/…）だけ。ページの中にスクリプトを書かない（CSP で禁止している）。
 */
final class View
{
    public static function h(mixed $s): string
    {
        return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /** アセットの URL（中身が変わったら URL も変わるよう、更新時刻を付ける） */
    public static function asset(App $app, string $path): string
    {
        $base = rtrim((string) parse_url($app->config->baseUrl(), PHP_URL_PATH), '/');
        $file = $app->config->str('app.public_dir', '') !== '' ? rtrim($app->config->str('app.public_dir'), '/') . '/assets/' . $path : '';
        $v = $file !== '' && is_file($file) ? '?v=' . filemtime($file) : '?v=' . \Hub\VERSION;
        return $base . '/assets/' . $path . $v;
    }

    public static function url(App $app, string $path): string
    {
        return rtrim((string) parse_url($app->config->baseUrl(), PHP_URL_PATH), '/') . $path;
    }

    /**
     * @param array{scripts?:list<string>,classic?:list<string>,bodyClass?:string,meta?:array<string,string>} $opt
     */
    public static function page(App $app, string $title, string $body, array $opt = []): string
    {
        $meta = '';
        foreach ($opt['meta'] ?? [] as $k => $v) {
            $meta .= '<meta name="' . self::h($k) . '" content="' . self::h($v) . '">' . "\n";
        }
        $scripts = '';
        foreach ($opt['classic'] ?? [] as $s) {
            $scripts .= '<script src="' . self::h(self::asset($app, $s)) . '"></script>' . "\n";
        }
        foreach ($opt['scripts'] ?? [] as $s) {
            $scripts .= '<script type="module" src="' . self::h(self::asset($app, $s)) . '"></script>' . "\n";
        }
        return '<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
' . $meta . '<title>' . self::h($title) . ' — ' . self::h($app->appName()) . '</title>
<link rel="stylesheet" href="' . self::h(self::asset($app, 'hub.css')) . '">
' . $scripts . '</head>
<body class="' . self::h($opt['bodyClass'] ?? 'card-page') . '">
' . $body . '
</body>
</html>';
    }

    /** ログインまわりの、カード1枚の画面 */
    public static function card(App $app, string $title, string $inner, array $opt = []): string
    {
        $body = '<main class="card">
<div class="brand">' . self::h($app->appName()) . '</div>
<h1>' . self::h($title) . '</h1>
' . $inner . '
</main>';
        return self::page($app, $title, $body, $opt);
    }

    public static function error(?string $msg): string
    {
        return $msg ? '<p class="error" role="alert">' . self::h($msg) . '</p>' : '';
    }

    public static function notice(?string $msg): string
    {
        return $msg ? '<p class="notice">' . self::h($msg) . '</p>' : '';
    }

    public static function csrf(string $token): string
    {
        return '<input type="hidden" name="_csrf" value="' . self::h($token) . '">';
    }
}
