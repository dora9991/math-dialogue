<?php
declare(strict_types=1);

namespace Hub\Cli;

use Hub\Admin\Members;
use Hub\Kernel\App;
use Hub\Kernel\Audit;
use Hub\Kernel\Config;
use Hub\Kernel\Crypto;
use Hub\Kernel\Json;
use Hub\Kernel\Migrator;
use Hub\Kernel\Password;
use Hub\Kernel\Time;
use Hub\Ops\Backup;
use Hub\Ops\Daily;
use Hub\Ops\Doctor;
use Hub\Ops\ImportLinks;
use Hub\Ops\Keys;
use Hub\Ops\Person;
use Hub\Web\Session;

/**
 * サーバーで打つコマンド（bin/hub）。SSH でログインして使う。cron からは tick だけを呼ぶ。
 * 例：/usr/bin/php8.3 ~/hub/app/bin/hub doctor
 */
final class Main
{
    private const HELP = <<<'TXT'
    使い方：bin/hub <コマンド> [引数]

    はじめに
      init                         設定ファイル（config/config.php）を、質問に答えて作る（鍵は自動で作る）
      keys:generate                新しい鍵（32バイトの乱数）を1つ表示する
      migrate                      データベースの形を最新にする（流す前に自動でバックアップを取る）
      admin:create-owner <メール>   最初のオーナーを作る（仮パスワードを1回だけ表示）
      doctor [--online]            健康診断。--online で LINE と公開 URL にも問い合わせる

    毎日の運用（cron）
      tick                         毎分の処理（配信・送信・片づけ・1日1回のバックアップと報告）。cron で毎分動かす
      report [--print]             毎日の報告を、いま送る（--print は送らずに表示）
      cleanup                      保存期間を過ぎた記録を、いま片づける

    LINE
      line:check                   LINE の設定（ボット・Webhook の URL・今月の通数）を確かめる
      line:set-webhook             LINE の Webhook の URL を、このハブに向けて、検証する
      line:stop / line:start       送信を止める／再開する（停止スイッチ。管理画面に入れないときの非常口）

    運営メンバー（パスワード・二段階認証を無くしたとき）
      admin:list                   一覧
      admin:reset-password <メール> 仮パスワードを作り直す（その人のログインは全部切れる）
      admin:reset-2fa <メール>      二段階認証を外す（次のログインで登録し直し）
      admin:logout-all [メール]     全員（または1人）を、いますぐログアウトさせる

    バックアップ
      backup                       いま取る（var/backup/。暗号化済み）
      backup:list                  一覧
      backup:verify <ファイル>      鍵で読めるか・壊れていないか
      backup:restore <ファイル> --yes  戻す（戻す前の中身も、自動でバックアップする）

    本人からの求め（個人情報）
      person:find <名前の一部|userId|会員番号>
      person:export <userId> [--out=ファイル]   その人の情報を全部書き出す（開示の求め）
      person:erase <userId> --yes              その人の情報を全部消す（消去の求め）

    そのほか
      audit:verify                 操作の記録が書き換えられていないか
      import:links <CSV> [--check] いまの会員サイトの連携を取り込む（はじめの1回）
      keys:status / keys:rotate-data   暗号の鍵の入れ替え（docs/04 を見てから）
      maintenance:on / maintenance:off  メンテナンス中にする（LINE の Webhook だけは受け付け続ける）
    TXT;

    private ?App $app = null;

    public function run(array $argv): int
    {
        $cmd = $argv[1] ?? 'help';
        $args = [];
        $opts = [];
        foreach (array_slice($argv, 2) as $a) {
            if (preg_match('/^--([a-z-]+)(?:=(.*))?$/', $a, $m)) {
                $opts[$m[1]] = $m[2] ?? true;
            } else {
                $args[] = $a;
            }
        }
        try {
            return match ($cmd) {
                'help', '--help', '-h' => $this->out(self::HELP),
                'init' => $this->init($opts),
                'keys:generate' => $this->out(Keys::generate()),
                'migrate' => $this->migrate($opts),
                'doctor' => $this->doctor($opts),
                'tick' => $this->tick($opts),
                'report' => $this->report($opts),
                'cleanup' => $this->printJson(Daily::cleanup($this->app()) + \Hub\Line\Hub::cleanup($this->app())),
                'line:check' => $this->lineCheck(),
                'line:set-webhook' => $this->lineSetWebhook(),
                'line:stop' => $this->lineSwitch(false),
                'line:start' => $this->lineSwitch(true),
                'admin:create-owner' => $this->createOwner($args, $opts),
                'admin:list' => $this->adminList(),
                'admin:reset-password' => $this->adminResetPassword($args),
                'admin:reset-2fa' => $this->adminReset2fa($args),
                'admin:logout-all' => $this->adminLogoutAll($args),
                'backup' => $this->backup($opts),
                'backup:list' => $this->backupList(),
                'backup:verify' => $this->backupVerify($args),
                'backup:restore' => $this->backupRestore($args, $opts),
                'audit:verify' => $this->auditVerify(),
                'person:find' => $this->printJson(Person::find($this->app(), $this->need($args, 0, '探す文字'))),
                'person:export' => $this->personExport($args, $opts),
                'person:erase' => $this->personErase($args, $opts),
                'import:links' => $this->importLinks($args, $opts),
                'keys:status' => $this->printJson(['primary' => $this->app()->crypto()->primaryKeyId(), 'encrypted_by_key' => Keys::census($this->app())]),
                'keys:rotate-data' => $this->keysRotate(),
                'maintenance:on' => $this->maintenance(true),
                'maintenance:off' => $this->maintenance(false),
                default => $this->err("知らないコマンドです: {$cmd}\n\n" . self::HELP),
            };
        } catch (\Throwable $e) {
            return $this->err('失敗しました：' . $e->getMessage() . (getenv('HUB_DEBUG') ? "\n" . $e->getTraceAsString() : ''));
        }
    }

    // ---- 道具 ----

    private function app(): App
    {
        return $this->app ??= new App(Config::load());
    }

    private function out(string $s): int
    {
        fwrite(STDOUT, $s . "\n");
        return 0;
    }

    private function err(string $s): int
    {
        fwrite(STDERR, $s . "\n");
        return 1;
    }

    private function printJson(mixed $v): int
    {
        return $this->out(json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    }

    private function need(array $args, int $i, string $label): string
    {
        if (!isset($args[$i]) || $args[$i] === '') {
            throw new \InvalidArgumentException("{$label}を指定してください");
        }
        return $args[$i];
    }

    private function ask(string $q, string $default = '', bool $secret = false): string
    {
        fwrite(STDOUT, $q . ($default !== '' ? " [{$default}]" : '') . '：');
        if ($secret && DIRECTORY_SEPARATOR === '/' && function_exists('shell_exec')) {
            @shell_exec('stty -echo 2>/dev/null');
        }
        $line = fgets(STDIN);
        if ($secret && DIRECTORY_SEPARATOR === '/' && function_exists('shell_exec')) {
            @shell_exec('stty echo 2>/dev/null');
            fwrite(STDOUT, "\n");
        }
        $v = trim((string) $line);
        return $v === '' ? $default : $v;
    }

    private function cliActor(): array
    {
        $who = getenv('USER') ?: (function_exists('posix_getpwuid') ? (posix_getpwuid(posix_geteuid())['name'] ?? 'cli') : 'cli');
        return ['id' => 'cli', 'email' => 'cli:' . $who];
    }

    // ---- コマンド ----

    private function init(array $opts): int
    {
        $path = getenv('HUB_CONFIG') ?: \Hub\root() . '/config/config.php';
        if (is_file($path) && empty($opts['force'])) {
            return $this->err("すでにあります：{$path}（作り直すときは --force。鍵を作り直すと、暗号化した中身が読めなくなるので注意）");
        }
        $this->out("ハブの設定ファイルを作ります。わからないところは Enter で飛ばして、あとで {$path} を直してください。\n");
        $base = rtrim($this->ask('ハブを開く URL（例：https://hub.example.com）'), '/');
        $dbHost = $this->ask('DB のホスト名（サーバーパネルの「MySQLホスト名」）', 'localhost');
        $dbName = $this->ask('DB の名前（例：xs123456_hub）');
        $dbUser = $this->ask('DB のユーザー名');
        $dbPass = $this->ask('DB のパスワード（入れても表示されません）', '', true);
        $chId = $this->ask('LINE のチャネルID');
        $chSecret = $this->ask('LINE のチャネルシークレット（表示されません）', '', true);
        $alertTo = $this->ask('知らせを受け取るメールアドレス');
        $host = (string) parse_url($base, PHP_URL_HOST);
        $alertFrom = $this->ask('知らせの差出人のアドレス', $host !== '' ? 'hub@' . preg_replace('/^[^.]+\.(?=.+\..+)/', '', $host) : '');
        $member = strtolower($this->ask('会員サイトと連携しますか（y/n）', 'n')) === 'y';
        $k = fn () => Crypto::generateKey();
        $cfg = [
            'app' => ['base_url' => $base, 'env' => 'production', 'name' => 'LINE配信ハブ', 'public_dir' => $this->deployedPublicDir($opts)],
            'db' => ['host' => $dbHost, 'port' => 3306, 'name' => $dbName, 'user' => $dbUser, 'pass' => $dbPass],
            'keys' => ['data' => ['k1' => $k()], 'data_primary' => 'k1', 'index' => $k(), 'pepper' => $k(), 'backup' => $k()],
            'line' => ['channel_id' => $chId, 'channel_secret' => $chSecret, 'access_token' => ''],
            'zoom' => ['secret_token' => ''],
            'member' => [
                'enabled' => $member, 'site_url' => '',
                'api_keys' => ['site' => ['secret' => $k(), 'scopes' => ['link', 'members', 'notify'], 'allow_ips' => []]],
                'webhook_url' => '', 'webhook_secret' => $k(), 'link_code_ttl_min' => 30, 'link_code_digits' => 6,
                'plans' => [['code' => 'free', 'name' => '無料', 'rank' => 0]],
            ],
            'admin' => ['idle_timeout_min' => 30, 'absolute_timeout_hours' => 12, 'allowed_ips' => []],
            'alert' => ['to' => $alertTo, 'from' => $alertFrom, 'daily_report_hour' => 7],
            'backup' => ['hour' => 3, 'keep_days' => 14],
            'retention' => ['access_log_days' => 365, 'audit_days' => 1095, 'log_days' => 90],
        ];
        $dir = \dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        @chmod($dir, 0700);
        $php = "<?php\n// ハブの設定と秘密（bin/hub init が " . date('Y-m-d H:i') . " に作成）。パーミッション 600 のまま。公開フォルダに置かない。git に入れない。\n// 鍵（keys）は、パスワード管理アプリか紙にも控えてください（無くすと、暗号化した中身とバックアップが読めなくなります）。\nreturn " . var_export($cfg, true) . ";\n";
        $old = umask(0077);
        file_put_contents($path, $php, LOCK_EX);
        umask($old);
        chmod($path, 0600);
        foreach (['', '/log', '/backup', '/export'] as $sub) {
            $d = \Hub\root() . '/var' . $sub;
            if (!is_dir($d)) {
                mkdir($d, 0700, true);
            }
            @chmod($d, 0700);
        }
        return $this->out("作りました：{$path}（600）\n\n次に：\n  1) bin/hub migrate\n  2) bin/hub admin:create-owner あなたのメール\n  3) bin/hub doctor\n\n※ 鍵は config.php の keys にあります。パスワード管理アプリか紙に控えてください。");
    }

    /** 公開フォルダの場所：--public-dir=…、無ければ tools/deploy.sh が覚えた config/deploy.env から */
    private function deployedPublicDir(array $opts): string
    {
        if (is_string($opts['public-dir'] ?? null)) {
            return rtrim($opts['public-dir'], '/');
        }
        $env = @file_get_contents(\Hub\root() . '/config/deploy.env');
        return is_string($env) && preg_match('/^PUBLIC_DIR=(\/[^\r\n]*)$/m', $env, $m) ? rtrim($m[1], '/') : '';
    }

    private function migrate(array $opts): int
    {
        $app = $this->app();
        $m = new Migrator($app->db(), \Hub\root() . '/app/migrations', $app->clock);
        $st = $m->status();
        if (!$st['pending']) {
            return $this->out('データベースは最新です');
        }
        if ($st['applied'] && empty($opts['no-backup'])) {
            $b = Backup::create($app, '更新の前の自動バックアップ');
            $this->out('更新の前にバックアップを取りました：' . basename($b['file']));
        }
        $ran = $m->migrate(fn ($s) => $this->out($s));
        $app->audit()->record($this->cliActor(), 'cli.migrate', ['ran' => $ran]);
        return $this->out('流しました：' . implode('・', $ran));
    }

    private function doctor(array $opts): int
    {
        $items = (new Doctor($this->app()))->run(!empty($opts['online']));
        $mark = ['ok' => '✅', 'warn' => '⚠️ ', 'ng' => '❌'];
        $ng = 0;
        $warn = 0;
        foreach ($items as $i) {
            $this->out(($mark[$i['level']] ?? '・') . ' ' . $i['title'] . ($i['detail'] !== '' ? '：' . $i['detail'] : ''));
            $ng += $i['level'] === 'ng' ? 1 : 0;
            $warn += $i['level'] === 'warn' ? 1 : 0;
        }
        $this->out('');
        $this->out($ng ? "❌ 直すところが {$ng} 個あります" : ($warn ? "⚠️  動きます（気になるところが {$warn} 個）" : '✅ すべて大丈夫です'));
        return $ng ? 1 : 0;
    }

    private function tick(array $opts): int
    {
        $out = Daily::tick($this->app());
        if (!empty($opts['verbose'])) {
            return $this->printJson($out);
        }
        return isset($out['hub']['error']) ? 1 : 0; // cron のメールを増やさないよう、ふだんは何も出さない
    }

    private function report(array $opts): int
    {
        $r = Daily::report($this->app(), empty($opts['print']));
        return $this->out($r['text']);
    }

    /** 停止スイッチ（管理画面の設定 enabled と同じもの）。止めても、受信と台帳は動き続ける */
    private function lineSwitch(bool $on): int
    {
        $app = $this->app();
        \Hub\Line\Settings::set($app, ['enabled' => $on]);
        $app->audit()->record($this->cliActor(), $on ? 'cli.line_start' : 'cli.line_stop');
        $queued = (int) $app->db()->value("SELECT COUNT(*) FROM line_outbox WHERE status = 'queued'");
        return $this->out($on
            ? "送信を再開しました（送信待ち {$queued} 件は、次の毎分の処理から送ります。古い予約を送りたくなければ、先に管理画面で確かめてください）"
            : "送信を止めました（送信待ち {$queued} 件は、そのまま残ります。受信・台帳・管理画面は動きます）。再開は line:start");
    }

    private function lineCheck(): int
    {
        $app = $this->app();
        $line = $app->line();
        $info = $line->botInfo();
        $ep = $line->getWebhookEndpoint();
        $q = $line->quotaConsumption();
        $want = $app->config->baseUrl() . '/webhook/line';
        return $this->printJson([
            'bot' => $info['ok'] ? $info['body'] : ['error' => $info['status'] ?: $info['error']],
            'webhook' => $ep['ok'] ? $ep['body'] + ['expected' => $want, 'matches' => ($ep['body']['endpoint'] ?? '') === $want] : ['error' => $ep['status']],
            'usage_this_month' => $q['ok'] ? $q['body'] : ['error' => $q['status']],
        ]);
    }

    private function lineSetWebhook(): int
    {
        $app = $this->app();
        $url = $app->config->baseUrl() . '/webhook/line';
        $r = $app->line()->setWebhookEndpoint($url);
        if (!$r['ok']) {
            return $this->err("設定できませんでした（{$r['status']}）：" . Json::enc($r['body']));
        }
        $t = $app->line()->testWebhookEndpoint($url);
        $app->audit()->record($this->cliActor(), 'cli.line_set_webhook', ['url' => $url, 'test' => $t['body']['success'] ?? null]);
        $this->out("Webhook の URL を {$url} にしました。");
        $this->out('検証：' . (($t['body']['success'] ?? false) ? '成功' : '失敗（' . Json::enc($t['body']) . '）'));
        return $this->out('LINE Developers コンソールで「Webhook の利用」がオンになっているかも確かめてください（応答メッセージ・あいさつメッセージは、LINE 公式アカウントの設定で、オフにします）');
    }

    private function createOwner(array $args, array $opts): int
    {
        $app = $this->app();
        $email = $this->need($args, 0, 'メールアドレス');
        $temp = Password::generateTemp();
        $id = Members::create($app, $email, 'owner', is_string($opts['name'] ?? null) ? $opts['name'] : null, $temp, true, 'cli');
        $app->audit()->record($this->cliActor(), 'cli.admin_create_owner', ['userId' => $id, 'email' => $email]);
        return $this->out("オーナーを作りました：{$email}\n仮パスワード：{$temp}\n\n" . $app->config->baseUrl() . "/admin/login からログインし、\n  1) 自分のパスワード（12文字以上）に変える\n  2) 認証アプリで二段階認証を登録する（回復コードを控える）\nの順に進んでください。この仮パスワードは、ここにしか出ません。");
    }

    private function adminList(): int
    {
        $rows = array_map(fn ($r) => [
            'email' => $r['email'], 'role' => $r['role'], '2fa' => $r['totp_enabled'] ? 'あり' : 'まだ', 'must_change_password' => $r['must_change_password'], 'last_login' => $r['last_sign_in_at'],
        ], Members::list($this->app()));
        return $this->printJson($rows);
    }

    private function adminByEmail(array $args): array
    {
        $m = Members::getByEmail($this->app(), $this->need($args, 0, 'メールアドレス'));
        if (!$m) {
            throw new \InvalidArgumentException('その運営メンバーはいません');
        }
        return $m;
    }

    private function adminResetPassword(array $args): int
    {
        $m = $this->adminByEmail($args);
        $r = Members::resetPassword($this->app(), $m['id']);
        $this->app()->audit()->record($this->cliActor(), 'cli.admin_reset_password', ['userId' => $m['id']]);
        return $this->out("仮パスワード：{$r['tempPassword']}\n本人だけに伝えてください（その人のログインは、すべて切りました）");
    }

    private function adminReset2fa(array $args): int
    {
        $app = $this->app();
        $m = $this->adminByEmail($args);
        $app->db()->exec('UPDATE hub_admins SET totp_secret = NULL, totp_enabled_at = NULL, totp_last_step = NULL, updated_at = ? WHERE id = ?', [$app->now(), $m['id']]);
        $app->db()->exec('DELETE FROM hub_admin_recovery_codes WHERE admin_id = ?', [$m['id']]);
        Session::endAllFor($app, $m['id']);
        $app->audit()->record($this->cliActor(), 'cli.admin_reset_2fa', ['userId' => $m['id']]);
        return $this->out("{$m['email']} の二段階認証を外しました。次のログインで、登録し直します（ログインは全部切りました）");
    }

    private function adminLogoutAll(array $args): int
    {
        $app = $this->app();
        if ($args) {
            $m = $this->adminByEmail($args);
            $n = Session::endAllFor($app, $m['id']);
        } else {
            $n = $app->db()->exec('DELETE FROM hub_sessions');
        }
        $app->audit()->record($this->cliActor(), 'cli.admin_logout_all', ['sessions' => $n, 'email' => $args[0] ?? null]);
        return $this->out("ログインを {$n} 個、切りました");
    }

    private function backup(array $opts): int
    {
        $app = $this->app();
        $r = Backup::create($app, is_string($opts['note'] ?? null) ? $opts['note'] : 'コマンドで取ったバックアップ');
        $app->audit()->record($this->cliActor(), 'cli.backup', ['file' => basename($r['file']), 'bytes' => $r['bytes']]);
        return $this->out("取りました：{$r['file']}（" . round($r['bytes'] / 1024) . "KB・{$r['tables']}表・{$r['rows']}行）");
    }

    private function backupList(): int
    {
        foreach (Backup::list($this->app()) as $b) {
            $this->out(date('Y-m-d H:i', $b['mtime']) . '  ' . str_pad((string) round($b['bytes'] / 1024), 8, ' ', STR_PAD_LEFT) . 'KB  ' . $b['file']);
        }
        return 0;
    }

    private function backupVerify(array $args): int
    {
        $f = $this->need($args, 0, 'ファイル');
        $h = Backup::header($f);
        $v = Backup::verify($this->app(), $f);
        $this->out("作成：{$h['created_at']}／DB：{$h['db']}／表：" . count($h['tables']) . "／メモ：{$h['note']}");
        return $v['ok'] ? $this->out('✅ ' . $v['message']) : $this->err('❌ ' . $v['message']);
    }

    private function backupRestore(array $args, array $opts): int
    {
        $f = $this->need($args, 0, 'ファイル');
        if (empty($opts['yes'])) {
            return $this->err("いまの中身を、このバックアップで置き換えます。よければ --yes を付けて、もう一度。\n（戻す前の中身は、自動でバックアップします）");
        }
        $app = $this->app();
        $app->kv()->set('maintenance', Time::iso($app->now()), 3600);
        try {
            $r = Backup::restore($app, $f);
        } finally {
            try {
                $app->kv()->delete('maintenance');
            } catch (\Throwable) {
            }
        }
        $app->audit()->record($this->cliActor(), 'cli.backup_restore', ['file' => basename($f), 'statements' => $r['statements']]);
        return $this->out("戻しました（文 {$r['statements']} 個）。戻す前の中身：{$r['before']}\nプログラムが新しい場合は、続けて bin/hub migrate を。");
    }

    private function auditVerify(): int
    {
        $app = $this->app();
        $v = (new Audit($app->db(), $app->clock, $app->log()))->verify($app->kv()->get('audit.anchor'));
        return $v['ok'] ? $this->out('✅ ' . $v['message'] . ($v['head'] ? "\n最新の指紋：{$v['head']}" : '')) : $this->err('❌ ' . $v['message']);
    }

    private function personExport(array $args, array $opts): int
    {
        $app = $this->app();
        $uid = $this->need($args, 0, 'LINE の userId');
        $data = Person::export($app, $uid);
        if (!$data) {
            return $this->err('その友だちはいません');
        }
        $file = is_string($opts['out'] ?? null) ? $opts['out'] : $app->varDir('export') . '/person-' . Person::subjectHash($app, $uid) . '-' . date('Ymd-His') . '.json';
        if (!is_dir(\dirname($file))) {
            mkdir(\dirname($file), 0700, true);
        }
        $old = umask(0077);
        file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        umask($old);
        chmod($file, 0600);
        $app->db()->exec('INSERT INTO hub_access_log (at, actor_id, actor_email, action, subject) VALUES (?, ?, ?, ?, ?)', [$app->now(), 'cli', $this->cliActor()['email'], 'person.export', $uid]);
        $app->audit()->record($this->cliActor(), 'cli.person_export', ['subject' => Person::subjectHash($app, $uid)]);
        return $this->out("書き出しました：{$file}（600）\n本人に渡したら、このファイルは消してください。");
    }

    private function personErase(array $args, array $opts): int
    {
        $app = $this->app();
        $uid = $this->need($args, 0, 'LINE の userId');
        if (empty($opts['yes'])) {
            return $this->err('この方の情報を、すべて消します（元に戻せません）。よければ --yes を付けて、もう一度。先に person:export で控えるか、bin/hub backup を取ることもできます');
        }
        $c = Person::erase($app, $uid);
        $app->audit()->record($this->cliActor(), 'cli.person_erase', ['subject' => Person::subjectHash($app, $uid), 'counts' => $c]);
        return $this->printJson($c);
    }

    private function importLinks(array $args, array $opts): int
    {
        $r = ImportLinks::run($this->app(), $this->need($args, 0, 'CSV ファイル'), !empty($opts['check']), fn ($s) => $this->out($s));
        $this->printJson($r);
        return $this->out('取り込んだ CSV には個人を指す情報が入っています。すぐに消してください（rm）');
    }

    private function keysRotate(): int
    {
        $app = $this->app();
        $n = Keys::rotate($app, fn ($s) => $this->out($s));
        $app->audit()->record($this->cliActor(), 'cli.keys_rotate', ['rows' => $n, 'primary' => $app->crypto()->primaryKeyId()]);
        return $this->out("{$n} 件を、鍵 " . $app->crypto()->primaryKeyId() . " で暗号化し直しました。keys:status で古い鍵が 0 になったら、古い鍵を config.php から消してよいです");
    }

    private function maintenance(bool $on): int
    {
        $app = $this->app();
        $on ? $app->kv()->set('maintenance', Time::iso($app->now())) : $app->kv()->delete('maintenance');
        $app->audit()->record($this->cliActor(), $on ? 'cli.maintenance_on' : 'cli.maintenance_off');
        return $this->out($on ? 'メンテナンス中にしました（管理画面・API は 503。毎分の処理も止めます。LINE の Webhook は受け付けます）' : 'メンテナンスを終えました');
    }
}
