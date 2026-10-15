<?php
// ハブの設定と秘密。このファイルを、サーバーの ~/hub/config/config.php として置く（bin/hub init が作ってくれる）。
//
//   ★ 公開フォルダ（public_html）の外に置く。パーミッションは 600（chmod 600 config.php）
//   ★ git に入れない・メールやチャットに貼らない。控えは、パスワード管理アプリか紙に
//   ★ 鍵（keys）を無くすと、暗号化したトーク・バックアップが読めなくなる。必ず別の場所にも控える
//
// 値の意味は docs/02_Xserver初期設定.md を見てください。

return [
    'app' => [
        'base_url' => 'https://hub.example.com',   // ハブを開く URL（末尾の / なし。https のみ）
        'env' => 'production',                     // 本番は production（ほかの値だと、https の強制などが緩む）
        'name' => 'LINE配信ハブ',                   // 画面とメールに出る名前
        'public_dir' => '',                        // 公開フォルダの場所（doctor が中身を確かめる。例：/home/xs123456/example.com/public_html/hub）
    ],

    // Xserver のサーバーパネル「MySQL設定」で作った DB とユーザー（このハブ専用にする）
    'db' => [
        'host' => 'localhost',                     // サーバーパネルの「MySQLホスト名」
        'port' => 3306,
        'name' => 'xs123456_hub',
        'user' => 'xs123456_hub',
        'pass' => '（DB のパスワード）',
    ],

    // 暗号の鍵（それぞれ 32 バイトの乱数を base64 にしたもの。bin/hub keys:generate で作る。使い回さない）
    'keys' => [
        'data' => ['k1' => '（keys:generate の結果）'], // トークの本文などを暗号化する鍵。入れ替えるときは k2 を足す
        'data_primary' => 'k1',
        'index' => '（keys:generate の結果）',          // 連携コードなどの「指紋」の鍵
        'pepper' => '（keys:generate の結果）',         // パスワードの「こしょう」。変えると全員のパスワードが無効になる
        'backup' => '（keys:generate の結果）',         // バックアップの鍵。サーバーの外にも控える
    ],

    // LINE Developers コンソール → Messaging API のチャネル
    'line' => [
        'channel_id' => '',                        // チャネル基本設定の「チャネルID」
        'channel_secret' => '',                    // チャネル基本設定の「チャネルシークレット」
        'access_token' => '',                      // 空のまま推奨（短期トークンを自動で作る）。長期トークンを使うときだけ入れる
    ],

    // Zoom の出欠（使うときだけ。Zoom Marketplace のアプリの Secret Token）
    'zoom' => [
        'secret_token' => '',
    ],

    // 会員サイトとの連携
    'member' => [
        'enabled' => false,
        'site_url' => 'https://member.example.com', // 通知のリンクの頭（/mypage などをつなげる）
        'api_keys' => [
            // 会員サイトのサーバーだけが持つ秘密。名前（ここでは site）は X-Hub-Key ヘッダーで送る
            'site' => ['secret' => '（keys:generate の結果）', 'scopes' => ['link', 'members', 'notify'], 'allow_ips' => []],
        ],
        'webhook_url' => '',                       // 「連携できた」を知らせる、会員サイトの受け口（任意。https）
        'webhook_secret' => '',                    // その署名の秘密（keys:generate の結果）
        'link_code_ttl_min' => 30,                 // 連携コードの有効時間（分）
        'link_code_digits' => 6,                   // 連携コードの桁数（6 か 8）
        'plans' => [
            // 会員プラン（管理画面の絞り込みに出る）。rank が大きいほど上位
            ['code' => 'free', 'name' => '無料', 'rank' => 0],
        ],
    ],

    // 管理画面
    'admin' => [
        'idle_timeout_min' => 30,                  // 何もしないと自動でログアウトする時間
        'absolute_timeout_hours' => 12,            // 続けて使っていても、ログインし直す時間
        'allowed_ips' => [],                       // 管理画面を開ける IP（空なら制限なし。自宅・学校の固定 IP があれば入れる）
    ],

    // 運営への知らせ（失敗・あやしいログイン・毎日の報告）
    'alert' => [
        'to' => 'owner@example.com',
        'from' => 'hub@example.com',               // このサーバーのドメインのアドレスにする（迷惑メールに入りにくい）
        'daily_report_hour' => 7,                  // 毎日の報告を送る時刻（日本時間）
    ],

    'backup' => [
        'hour' => 3,                               // 毎日の自動バックアップの時刻（日本時間）
        'keep_days' => 14,                         // 残す日数
    ],

    // 記録を残す日数（LINE のトーク・Webhook の記録は、管理画面の設定 chat_retention_days・log_retention_days）
    'retention' => [
        'access_log_days' => 365,                  // 個人の情報を「見た」記録
        'audit_days' => 1095,                      // 操作の記録（3年）
        'log_days' => 90,                          // 動作のログ（var/log）
    ],
];
