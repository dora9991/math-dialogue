<?php
declare(strict_types=1);

namespace Hub\Ops;

use Hub\Kernel\App;
use Hub\Kernel\Audit;
use Hub\Kernel\Crypto;
use Hub\Kernel\Migrator;
use Hub\Kernel\Time;

/**
 * 健康診断（bin/hub doctor）。安全に動かすための「決まり」を、ひとつずつ確かめて、日本語で答える。
 *   ok   … 大丈夫
 *   warn … 動くが、直したほうがよい
 *   ng   … 危ない／動かない。すぐ直す
 * --online を付けると、LINE と、公開している URL にも、実際に問い合わせて確かめる。
 */
final class Doctor
{
    /** @var list<array{level:string,title:string,detail:string}> */
    private array $items = [];

    public function __construct(private App $app)
    {
    }

    private function add(string $level, string $title, string $detail = ''): void
    {
        $this->items[] = ['level' => $level, 'title' => $title, 'detail' => $detail];
    }

    /** @return list<array{level:string,title:string,detail:string}> */
    public function run(bool $online = false): array
    {
        $this->php();
        $this->files();
        $this->settings();
        $dbOk = $this->database();
        if ($dbOk) {
            $this->accounts();
            $this->runtime();
        }
        if ($online) {
            $this->online();
        }
        return $this->items;
    }

    private function php(): void
    {
        if (PHP_VERSION_ID < 80100) {
            $this->add('ng', 'PHP のバージョン', 'PHP ' . PHP_VERSION . '。8.3 以上にしてください（サーバーパネル「PHP Ver.切替」）');
        } elseif (PHP_VERSION_ID < 80200) {
            $this->add('warn', 'PHP のバージョン', 'PHP ' . PHP_VERSION . ' は、サポートが終わっています。8.3 以上にしてください');
        } else {
            $this->add('ok', 'PHP のバージョン', PHP_VERSION);
        }
        $need = ['pdo_mysql', 'openssl', 'curl', 'mbstring', 'json'];
        $miss = array_values(array_filter($need, fn ($e) => !extension_loaded($e)));
        $this->add($miss ? 'ng' : 'ok', 'PHP の拡張', $miss ? '足りません：' . implode('・', $miss) : implode('・', $need));
        if (!extension_loaded('intl')) {
            $this->add('warn', 'PHP の拡張 intl', '無くても動きます（全角・半角のそろえ方を、少し簡単な方法にします）');
        }
        if (PHP_SAPI === 'cli' && !in_array(ini_get('display_errors'), ['0', '', 'Off', 'off', 'stderr'], true)) {
            $this->add('warn', 'display_errors', 'コマンドでは on ですが、Web では index.php が off にしています');
        }
    }

    private function files(): void
    {
        $c = $this->app->config;
        $path = $c->path;
        if ($path !== '' && is_file($path)) {
            $perm = fileperms($path) & 0777;
            if ($perm & 0077) {
                $this->add('ng', '設定ファイルのパーミッション', sprintf('%s は %o です。600 にしてください（chmod 600 %s）。ほかの人に読める状態です', $path, $perm, $path));
            } else {
                $this->add('ok', '設定ファイルのパーミッション', sprintf('%o', $perm));
            }
            if (str_contains($path, '/public_html/') || str_contains($path, '/www/')) {
                $this->add('ng', '設定ファイルの場所', "{$path} は公開フォルダの中です。公開フォルダの外（例：~/hub/config/）へ移してください");
            }
        }
        $root = $this->app->root();
        if (str_contains($root . '/', '/public_html/')) {
            $this->add('ng', 'プログラムの場所', "{$root} は公開フォルダの中です。プログラムは公開フォルダの外に置いてください（public/ の中身だけを公開フォルダへ）");
        }
        $var = $this->app->varDir();
        if (is_dir($var)) {
            $perm = fileperms($var) & 0777;
            $this->add($perm & 0077 ? 'warn' : 'ok', 'var フォルダのパーミッション', sprintf('%s は %o%s', $var, $perm, $perm & 0077 ? '。700 にしてください（ログ・バックアップが入ります）' : ''));
        }
        $pub = $c->str('app.public_dir');
        if ($pub !== '') {
            $idx = $pub . '/index.php';
            if (!is_file($idx)) {
                $this->add('ng', '公開フォルダの index.php', "{$idx} がありません");
            } elseif (preg_match("/^const HUB_ROOT = '([^']*)';/m", (string) file_get_contents($idx), $m)) {
                $points = $m[1] === '__HUB_ROOT__' ? (getenv('HUB_ROOT') ?: \dirname($pub)) : $m[1];
                $real = fn (string $p) => rtrim((string) (realpath($p) ?: $p), '/');
                if ($real($points) !== $real($this->app->root())) {
                    $this->add('ng', '公開フォルダの index.php', "HUB_ROOT が {$points} を指しています。このプログラムは {$this->app->root()} にあります（tools/deploy.sh で置き直すと、書き換えます）");
                } else {
                    $this->add('ok', '公開フォルダの index.php', "HUB_ROOT = {$points}");
                }
            }
            if (!is_file($pub . '/.htaccess')) {
                $this->add('ng', '公開フォルダの .htaccess', 'ありません。https への切り替えと、直接開かせないための設定が効きません');
            }
            foreach (glob($pub . '/*.php') ?: [] as $f) {
                if (basename($f) !== 'index.php') {
                    $this->add('warn', '公開フォルダの PHP', basename($f) . ' があります。ハブには index.php しか要りません（.htaccess で開けないようにしていますが、消してください）');
                }
            }
            foreach (['config.php', '.env', 'config'] as $bad) {
                if (file_exists($pub . '/' . $bad)) {
                    $this->add('ng', '公開フォルダに秘密', "{$pub}/{$bad} があります。すぐに公開フォルダの外へ移してください");
                }
            }
        }
    }

    private function settings(): void
    {
        $c = $this->app->config;
        if ($c->isProduction()) {
            $this->add('ok', 'app.env', 'production');
        } else {
            $this->add('warn', 'app.env', $c->str('app.env') . '（本番では production にしてください）');
        }
        $base = $c->baseUrl();
        if (!str_starts_with($base, 'https://')) {
            $this->add($c->isProduction() ? 'ng' : 'warn', 'app.base_url', ($base ?: '（空）') . '。https:// から始まる URL にしてください');
        } else {
            $this->add('ok', 'app.base_url', $base);
        }
        try {
            $crypto = Crypto::fromConfig($c);
            $weak = [];
            foreach (['keys.index', 'keys.pepper', 'keys.backup'] as $k) {
                $raw = Crypto::decodeKey($c->str($k), $k);
                if (count(array_unique(str_split($raw))) < 8) {
                    $weak[] = $k;
                }
            }
            foreach ($c->arr('keys.data') as $kid => $b64) {
                $raw = Crypto::decodeKey((string) $b64, "keys.data.{$kid}");
                if (count(array_unique(str_split($raw))) < 8) {
                    $weak[] = "keys.data.{$kid}";
                }
            }
            if ($c->str('keys.pepper') === $c->str('keys.index') || $c->str('keys.backup') === $c->str('keys.index')) {
                $weak[] = '同じ鍵の使い回し';
            }
            $this->add($weak ? 'ng' : 'ok', '鍵', $weak ? '弱い・使い回しの鍵があります：' . implode('・', $weak) . '（bin/hub keys:generate で作り直してください）' : 'いま使っている暗号の鍵：' . $crypto->primaryKeyId());
        } catch (\Throwable $e) {
            $this->add('ng', '鍵', $e->getMessage());
        }
        if ($c->str('line.channel_secret') === '') {
            $this->add('ng', 'LINE のチャネルシークレット', '未設定です（line.channel_secret）。署名を確かめられないので、Webhook を受け付けません');
        }
        if ($c->str('line.access_token') === '' && $c->str('line.channel_id') === '') {
            $this->add('ng', 'LINE のチャネルID', '未設定です（line.channel_id）。送信できません');
        }
        if ($c->str('alert.to') === '' || $c->str('alert.from') === '') {
            $this->add('warn', '知らせのメール', 'alert.to・alert.from が未設定です。失敗やあやしいログインに気づけません');
        }
        if ($c->bool('member.enabled')) {
            foreach ($c->arr('member.api_keys') as $kid => $k) {
                if (!is_array($k) || strlen((string) ($k['secret'] ?? '')) < 40) {
                    $this->add('ng', "会員サイトの API の鍵（{$kid}）", '秘密が短すぎます。bin/hub keys:generate で作ってください');
                }
            }
            if ($c->str('member.webhook_url') !== '' && strlen($c->str('member.webhook_secret')) < 32) {
                $this->add('ng', '会員サイトへの知らせの秘密', 'member.webhook_secret が短すぎます');
            }
        }
        if ($c->arr('admin.allowed_ips')) {
            $this->add('ok', '管理画面の IP の制限', implode('・', $c->arr('admin.allowed_ips')));
        }
    }

    private function database(): bool
    {
        try {
            $db = $this->app->db();
            $ver = (string) $db->value('SELECT VERSION()');
        } catch (\Throwable $e) {
            $this->add('ng', 'データベース', 'つながりません：' . $e->getMessage());
            return false;
        }
        $isMaria = stripos($ver, 'mariadb') !== false;
        $num = preg_match('/^(\d+)\.(\d+)/', $ver, $m) ? ((int) $m[1] * 100 + (int) $m[2]) : 0;
        $okVer = $isMaria ? $num >= 1005 : $num >= 800;
        $this->add($okVer ? 'ok' : 'ng', 'データベースのバージョン', $ver . ($okVer ? '' : '（MariaDB 10.5 以上 か MySQL 8 以上にしてください）'));
        $st = (new Migrator($db, $this->app->root() . '/app/migrations', $this->app->clock))->status();
        if ($st['pending']) {
            $this->add('ng', 'データベースの形', 'まだ流していない更新があります：' . implode('・', $st['pending']) . '（bin/hub migrate）');
        } else {
            $this->add('ok', 'データベースの形', count($st['applied']) . ' 個の更新を流してあります');
        }
        if ($st['changed']) {
            $this->add('warn', 'データベースの更新ファイル', '流したあとに書き換えられています：' . implode('・', $st['changed']));
        }
        return !$st['pending'];
    }

    private function accounts(): void
    {
        $db = $this->app->db();
        $owners = (int) $db->value("SELECT COUNT(*) FROM hub_admins WHERE role = 'owner' AND disabled_at IS NULL");
        $this->add($owners > 0 ? 'ok' : 'ng', 'オーナー', $owners > 0 ? "{$owners}人" : 'いません（bin/hub admin:create-owner）');
        $no2fa = array_column($db->all('SELECT email FROM hub_admins WHERE totp_enabled_at IS NULL AND disabled_at IS NULL'), 'email');
        if ($no2fa) {
            $this->add('warn', '二段階認証', 'まだ登録していない人：' . implode('・', $no2fa) . '（最初のログインで登録します）');
        } else {
            $this->add('ok', '二段階認証', '全員が登録済み');
        }
        $old = array_column($db->all('SELECT email FROM hub_admins WHERE last_login_at IS NOT NULL AND last_login_at < ?', [Time::addSeconds($this->app->now(), -90 * 86400)]), 'email');
        if ($old) {
            $this->add('warn', '使っていない運営メンバー', '90日以上ログインしていない人：' . implode('・', $old) . '（使わないなら、外してください）');
        }
    }

    private function runtime(): void
    {
        $kv = $this->app->kv();
        $last = $kv->get('tick.last_ok_at');
        if ($last === null) {
            $this->add('warn', '毎分の処理（cron）', 'まだ一度も動いていません。サーバーパネルの「Cron設定」で、毎分 bin/hub tick を動かしてください');
        } else {
            $ago = intdiv(Time::ms($this->app->now()) - Time::ms(Time::parse($last)), 1000);
            $this->add($ago > 180 ? 'ng' : 'ok', '毎分の処理（cron）', $ago > 180 ? "最後に動いたのは {$ago} 秒前です。cron が止まっていませんか" : "最後に動いたのは {$ago} 秒前");
        }
        $backups = Backup::list($this->app);
        if (!$backups) {
            $this->add('warn', 'バックアップ', 'まだありません（毎日自動で取ります。すぐ取るなら bin/hub backup）');
        } else {
            $age = (time() - $backups[0]['mtime']) / 3600;
            $this->add($age > 26 ? 'warn' : 'ok', 'バックアップ', sprintf('最新は %.1f 時間前（%d 個）', $age, count($backups)));
        }
        $v = (new Audit($this->app->db(), $this->app->clock, $this->app->log()))->verify($kv->get('audit.anchor'));
        $this->add($v['ok'] ? 'ok' : 'ng', '操作の記録（改ざんの検知）', $v['message']);
        $db = $this->app->db();
        $failed = (int) $db->value("SELECT COUNT(*) FROM line_outbox WHERE status = 'failed' AND created_at > ?", [Time::addSeconds($this->app->now(), -7 * 86400)]);
        if ($failed) {
            $this->add('warn', '送れなかったメッセージ', "この1週間に {$failed} 件（管理画面の「送信状況」で理由を見られます）");
        }
        $stuck = (int) $db->value('SELECT COUNT(*) FROM line_events WHERE processed_at IS NULL AND attempts >= 5');
        if ($stuck) {
            $this->add('warn', '処理できなかった Webhook', "{$stuck} 件（ログ var/log/ を確かめてください）");
        }
    }

    private function online(): void
    {
        $line = $this->app->line();
        $info = $line->botInfo();
        if ($info['ok']) {
            $this->add('ok', 'LINE につながる', 'ボット：' . ($info['body']['displayName'] ?? '?') . '（' . ($info['body']['basicId'] ?? '') . '）');
        } else {
            $this->add('ng', 'LINE につながる', '問い合わせに失敗しました（' . ($info['status'] ?: ($info['error'] ?? '通信エラー')) . '）。チャネルID・シークレットを確かめてください');
        }
        $want = $this->app->config->baseUrl() . '/webhook/line';
        $ep = $line->getWebhookEndpoint();
        if ($ep['ok']) {
            $got = (string) ($ep['body']['endpoint'] ?? '');
            $active = (bool) ($ep['body']['active'] ?? false);
            $this->add($got === $want && $active ? 'ok' : 'warn', 'LINE の Webhook の URL', $got === $want ? ($active ? $got : "{$got}（「Webhook の利用」がオフです）") : "LINE 側は「{$got}」です。{$want} にしてください（bin/hub line:set-webhook）");
        }
        $base = $this->app->config->baseUrl();
        $this->probe($base . '/health', [200], 'ハブの入口（/health）');
        $this->probe($base . '/.htaccess', [403, 404], '隠しファイルが見えないか');
        $this->probe($base . '/index.php.bak', [403, 404], 'バックアップらしいファイルが見えないか');
        $this->probe($base . '/admin', [303, 302], '管理画面はログインを求めるか');
        if (str_starts_with($base, 'https://')) {
            $this->probe('http://' . substr($base, 8) . '/health', [301, 302, 308], 'http は https へ切り替わるか');
        }
    }

    /** @param list<int> $expect */
    private function probe(string $url, array $expect, string $title): void
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 10, CURLOPT_NOBODY => false]);
        $ok = curl_exec($ch);
        $code = $ok === false ? 0 : (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $this->add(in_array($code, $expect, true) ? 'ok' : 'ng', $title, "{$url} → " . ($code ?: '接続できません') . (in_array($code, $expect, true) ? '' : '（期待：' . implode('/', $expect) . '）'));
    }
}
