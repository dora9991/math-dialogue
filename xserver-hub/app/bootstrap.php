<?php
declare(strict_types=1);

// ハブの起動。Web の入口（public/index.php）と、コマンドの入口（bin/hub）の両方から読む。
// ここでは「部品の読み込み方」を決めるだけ。設定の読み込み・DB への接続は Kernel\App が、使うときに行う。
//
// サーバー上の置き場所（例）：
//   /home/<サーバーID>/hub/app/        … このフォルダ（プログラム。公開フォルダの外）
//   /home/<サーバーID>/hub/config/     … 設定と秘密（config.php。パーミッション 600）
//   /home/<サーバーID>/hub/var/        … ログ・バックアップ・一時ファイル
//   /home/<サーバーID>/<ドメイン>/public_html/…  … 公開フォルダ（public/ の中身だけ。index.php と画面の部品）

namespace Hub;

const VERSION = '0.1.0';

if (PHP_VERSION_ID < 80100) {
    // ここより先は PHP 8.1 の書き方を使う。古い PHP のまま動かして、わかりにくい壊れ方をしないよう、先に止める
    http_response_code(500);
    echo "PHP 8.1 以上が必要です（いまは " . PHP_VERSION . "）。サーバーパネルの「PHP Ver.切替」で 8.3 以上にしてください。\n";
    exit(1);
}

spl_autoload_register(static function (string $class): void {
    if (strncmp($class, 'Hub\\', 4) !== 0) {
        return;
    }
    $path = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (is_file($path)) {
        require $path;
    }
});

/** ハブの置き場所（app/ の1つ上。例：/home/xs123456/hub） */
function root(): string
{
    return \dirname(__DIR__);
}
