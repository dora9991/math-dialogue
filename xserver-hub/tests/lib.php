<?php
declare(strict_types=1);

// テストの小さな道具（外部のライブラリなし）。本物の MariaDB（テスト用の DB）と、模擬の LINE（FakeLine）で動かす。
//
//   HUB_TEST_DB_HOST / HUB_TEST_DB_PORT / HUB_TEST_DB_NAME / HUB_TEST_DB_USER / HUB_TEST_DB_PASS で、テスト用の DB を決める
//   （既定：127.0.0.1:3306 の hub_test。中身は毎回消すので、本番の DB を絶対に指定しないこと）

require_once __DIR__ . '/../app/bootstrap.php';

use Hub\Kernel\App;
use Hub\Kernel\Clock;
use Hub\Kernel\Config;
use Hub\Kernel\Db;
use Hub\Kernel\Log;
use Hub\Kernel\Mailer;
use Hub\Kernel\Migrator;
use Hub\Line\FakeLine;
use Hub\Line\Signature;

final class T
{
    public static int $pass = 0;
    public static array $fails = [];
    public static ?Db $db = null;
    public static string $current = '';

    public static function dbConfig(): array
    {
        $name = getenv('HUB_TEST_DB_NAME') ?: 'hub_test';
        if (!preg_match('/test/i', $name)) {
            fwrite(STDERR, "テスト用の DB の名前には test を入れてください（本番の DB を消さないため）: {$name}\n");
            exit(2);
        }
        return [
            'host' => getenv('HUB_TEST_DB_HOST') ?: '127.0.0.1',
            'port' => (int) (getenv('HUB_TEST_DB_PORT') ?: 3306),
            'name' => $name,
            'user' => getenv('HUB_TEST_DB_USER') ?: 'hub',
            'pass' => getenv('HUB_TEST_DB_PASS') ?: 'hub-local-dev-only',
        ];
    }

    /** 表を全部消して、マイグレーションを流し直す（実行の最初に1回） */
    public static function freshSchema(): Db
    {
        $db = Db::connect(self::dbConfig());
        $pdo = $db->pdo();
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN) as $t) {
            $pdo->exec("DROP TABLE `{$t}`");
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        (new Migrator($db, __DIR__ . '/../app/migrations', new Clock()))->migrate();
        return self::$db = $db;
    }

    /** テストごとに、中身だけ空にする */
    public static function truncateAll(): void
    {
        $pdo = self::$db->pdo();
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN) as $t) {
            if ($t !== 'hub_migrations') {
                $pdo->exec("TRUNCATE TABLE `{$t}`");
            }
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
        $pdo->exec("INSERT INTO hub_audit_head (id, hash) VALUES (1, '" . str_repeat('0', 64) . "')");
    }

    public static function config(array $over = []): array
    {
        $base = [
            'app' => ['base_url' => 'https://hub.example.test', 'env' => 'test', 'name' => 'テストのハブ', 'var_dir' => sys_get_temp_dir() . '/hub-test-var'],
            'db' => self::dbConfig(),
            'keys' => [
                'data' => ['k1' => base64_encode(str_repeat("\x01", 32))],
                'data_primary' => 'k1',
                'index' => base64_encode(str_repeat("\x02", 32)),
                'pepper' => base64_encode(str_repeat("\x03", 32)),
                'backup' => base64_encode(str_repeat("\x04", 32)),
            ],
            'line' => ['channel_id' => '1234567890', 'channel_secret' => 'test-secret'],
            'zoom' => ['secret_token' => 'zoom-secret'],
            'member' => [
                'enabled' => true,
                'plans' => [['code' => 'free', 'name' => '無料', 'rank' => 0], ['code' => 'guild', 'name' => 'ギルド', 'rank' => 20]],
                'api_keys' => ['site' => ['secret' => base64_encode(str_repeat("\x05", 32)), 'scopes' => ['link', 'members', 'notify']]],
                'link_code_ttl_min' => 30,
            ],
            'alert' => ['to' => 'owner@example.test', 'from' => 'hub@example.test', 'dry_run' => true],
        ];
        return array_replace_recursive($base, $over);
    }

    /** @return array{0:App,1:FakeLine} */
    public static function app(array $over = []): array
    {
        $clock = new Clock();
        $clock->setNow('2026-10-20T00:00:00Z'); // 日本時間 10/20(火) 9:00
        $app = new App(Config::fromArray(self::config($over)), $clock);
        $app->setDb(self::$db);
        $app->setLog(new Log('', $clock, false, true));
        $app->setMailer(new Mailer('hub@example.test', true));
        $line = new FakeLine('test-secret');
        $app->setLine($line);
        return [$app, $line];
    }

    // ---- 確かめる ----
    public static function eq(mixed $expected, mixed $actual, string $msg = ''): void
    {
        if ($expected === $actual) {
            self::$pass++;
            return;
        }
        self::fail(($msg ? "{$msg}: " : '') . 'expected ' . self::show($expected) . ' but got ' . self::show($actual));
    }

    public static function ok(mixed $cond, string $msg = ''): void
    {
        if ($cond) {
            self::$pass++;
            return;
        }
        self::fail($msg ?: 'expected true');
    }

    public static function contains(string $needle, ?string $hay, string $msg = ''): void
    {
        self::ok($hay !== null && str_contains($hay, $needle), ($msg ? "{$msg}: " : '') . self::show($hay) . ' に ' . self::show($needle) . ' が無い');
    }

    /** fn が例外を投げ、メッセージに $part を含むこと */
    public static function throws(callable $fn, string $part = '', string $msg = ''): void
    {
        try {
            $fn();
        } catch (\Throwable $e) {
            if ($part === '' || str_contains($e->getMessage(), $part)) {
                self::$pass++;
                return;
            }
            self::fail(($msg ? "{$msg}: " : '') . 'message ' . self::show($e->getMessage()) . ' に ' . self::show($part) . ' が無い');
            return;
        }
        self::fail(($msg ? "{$msg}: " : '') . '例外が出ませんでした');
    }

    public static function fail(string $m): void
    {
        $bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
        $where = '';
        foreach ($bt as $f) {
            if (isset($f['file']) && !str_ends_with($f['file'], 'lib.php')) {
                $where = basename($f['file']) . ':' . $f['line'];
                break;
            }
        }
        self::$fails[] = '[' . self::$current . "] {$where} {$m}";
    }

    public static function show(mixed $v): string
    {
        $s = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
        return mb_strlen((string) $s) > 300 ? mb_substr((string) $s, 0, 300) . '…' : (string) $s;
    }
}

/** 友だち役のシミュレーター：本物の LINE と同じ形のイベントを作り、署名をつける */
final class Sim
{
    private static int $seq = 0;

    public static function uid(int $n): string
    {
        return 'U' . str_pad(dechex($n), 32, '0', STR_PAD_LEFT);
    }

    private static function base(string $type, string $uid, array $extra = []): array
    {
        return ['type' => $type, 'mode' => 'active', 'timestamp' => 1, 'source' => ['type' => 'user', 'userId' => $uid], 'webhookEventId' => '01TEST' . str_pad((string) ++self::$seq, 10, '0', STR_PAD_LEFT), 'deliveryContext' => ['isRedelivery' => false]] + $extra;
    }

    private static function withReply(FakeLine $line, string $uid, array $ev): array
    {
        $tok = bin2hex(random_bytes(16));
        $line->replyTokenOwners[$tok] = $uid;
        return $ev + ['replyToken' => $tok];
    }

    public static function follow(FakeLine $line, string $uid): array
    {
        return self::withReply($line, $uid, self::base('follow', $uid));
    }

    public static function unfollow(string $uid): array
    {
        return self::base('unfollow', $uid);
    }

    public static function text(FakeLine $line, string $uid, string $text): array
    {
        return self::withReply($line, $uid, self::base('message', $uid, ['message' => ['type' => 'text', 'id' => (string) self::$seq, 'text' => $text]]));
    }

    public static function postback(FakeLine $line, string $uid, string $data, ?array $params = null): array
    {
        return self::withReply($line, $uid, self::base('postback', $uid, ['postback' => $params ? ['data' => $data, 'params' => $params] : ['data' => $data]]));
    }

    public static function image(FakeLine $line, string $uid): array
    {
        return self::withReply($line, $uid, self::base('message', $uid, ['message' => ['type' => 'image', 'id' => (string) self::$seq]]));
    }

    public static function videoComplete(FakeLine $line, string $uid, string $trackingId): array
    {
        return self::withReply($line, $uid, self::base('videoPlayComplete', $uid, ['videoPlayComplete' => ['trackingId' => $trackingId]]));
    }

    /** @return array{0:string,1:string} [rawBody, signature] */
    public static function sign(array $events, string $secret = 'test-secret'): array
    {
        $raw = json_encode(['destination' => 'Udeadbeef', 'events' => $events], JSON_UNESCAPED_UNICODE);
        return [$raw, Signature::compute($raw, $secret)];
    }

    /** イベントを Webhook に流して、その場で処理する */
    public static function send(App $app, array ...$events): array
    {
        [$raw, $sig] = self::sign($events);
        return \Hub\Line\Webhook::handle($app, $raw, $sig);
    }
}
