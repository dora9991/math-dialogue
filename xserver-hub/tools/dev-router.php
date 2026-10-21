<?php
// 手元で動かすとき（php -S）の振り分け。Xserver の .htaccess と同じ動き：/assets/ の実在するファイルはそのまま、ほかは index.php へ。
//   HUB_CONFIG=/path/to/dev-config.php php -S 127.0.0.1:8080 -t public tools/dev-router.php
// （本番では使わない）

$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (str_starts_with($path, '/assets/') && is_file(__DIR__ . '/../public' . $path) && !str_contains($path, '..')) {
    return false; // php -S が、そのファイルを出す
}
putenv('HUB_ROOT=' . \dirname(__DIR__));
require __DIR__ . '/../public/index.php';
