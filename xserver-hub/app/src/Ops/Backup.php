<?php
declare(strict_types=1);

namespace Hub\Ops;

use Hub\Kernel\App;
use Hub\Kernel\Crypto;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * 暗号化バックアップ（DB の中身を、まるごと）。PHP だけで書き出す（mysqldump やシェルのコマンドは使わない）。
 *
 * ファイルの形（.hubbak）：
 *   1行目：見出し（JSON・平文）… いつ・どの DB・どの表・鍵の名前・塩（salt）
 *   2行目から：暗号の塊の並び … [4バイトの長さ][12バイトの nonce][16バイトの tag][暗号文]
 *     ・鍵：config.php の keys.backup から、塩ごとに作る（HKDF）。サーバーの外に持ち出しても、鍵が無ければ読めない
 *     ・各塊に「何番目か」「最後か」を関連データとして入れる（塊の入れ替え・途中で切られたことを見破る）
 *   中身：SQL の文を「4バイトの長さ＋文」で並べたもの（表を作る文と、行を入れる文）
 *
 * 同じ瞬間の中身にそろえる：START TRANSACTION WITH CONSISTENT SNAPSHOT（InnoDB）
 * 鍵（keys.backup）は、サーバーとは別の場所（紙・パスワード管理アプリ）にも控えておく。サーバーが無くなると、バックアップも読めなくなるため
 */
final class Backup
{
    private const MAGIC = 'hub-backup';
    private const CHUNK = 1 << 20; // 1MB ずつ暗号化

    public static function dir(App $app): string
    {
        return $app->varDir('backup');
    }

    private static function key(App $app, string $salt): string
    {
        $raw = Crypto::decodeKey($app->config->str('keys.backup'), 'keys.backup');
        return hash_hkdf('sha256', $raw, 32, 'hub-backup-v1', $salt);
    }

    /** @return list<string> このハブの表（hub_・line_ で始まるもの） */
    public static function tables(App $app): array
    {
        $rows = $app->db()->all(
            "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
               AND (table_name LIKE 'hub\\_%' OR table_name LIKE 'line\\_%') ORDER BY table_name"
        );
        return array_column($rows, 't');
    }

    /** バックアップを作る。@return array{file:string,bytes:int,tables:int,rows:int} */
    public static function create(App $app, string $note = ''): array
    {
        $dir = self::dir($app);
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new \RuntimeException("バックアップの置き場を作れません: {$dir}");
        }
        @chmod($dir, 0700);
        $now = $app->now();
        $file = $dir . '/hub-' . $now->setTimezone(new \DateTimeZone('Asia/Tokyo'))->format('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.hubbak';
        $tmp = $file . '.part';
        $salt = random_bytes(16);
        $tables = self::tables($app);
        $header = ['format' => self::MAGIC, 'v' => 1, 'created_at' => Time::iso($now), 'db' => $app->config->str('db.name'), 'tables' => $tables, 'app_version' => \Hub\VERSION, 'salt' => base64_encode($salt), 'note' => mb_substr($note, 0, 200)];
        $headerLine = Json::enc($header);
        $fh = fopen($tmp, 'wb');
        if ($fh === false) {
            throw new \RuntimeException("書き込めません: {$tmp}");
        }
        @chmod($tmp, 0600);
        fwrite($fh, $headerLine . "\n");
        $w = new BackupWriter($fh, self::key($app, $salt), hash('sha256', $headerLine, true));
        $pdo = $app->db()->pdo();
        $rows = 0;
        $pdo->exec('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');
        try {
            $w->record('SET FOREIGN_KEY_CHECKS=0');
            foreach ($tables as $t) {
                $create = $pdo->query("SHOW CREATE TABLE `{$t}`")->fetch(\PDO::FETCH_NUM)[1];
                $w->record("DROP TABLE IF EXISTS `{$t}`");
                $w->record($create);
                $cols = array_column($app->db()->all(
                    "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND extra NOT LIKE '%GENERATED%' ORDER BY ordinal_position",
                    [$t]
                ), 'c');
                $colSql = implode(',', array_map(fn ($c) => "`{$c}`", $cols));
                $pk = array_column($app->db()->all(
                    "SELECT column_name AS c FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = 'PRIMARY' ORDER BY ordinal_position",
                    [$t]
                ), 'c');
                $order = $pk ? ' ORDER BY ' . implode(',', array_map(fn ($c) => "`{$c}`", $pk)) : '';
                // 2000行ずつ読む（大きな表でも、メモリを使いすぎないように。同じ瞬間の中身なので、ずれない）
                for ($offset = 0; ; $offset += 2000) {
                    $chunk = $pdo->query("SELECT {$colSql} FROM `{$t}`{$order} LIMIT 2000 OFFSET {$offset}")->fetchAll(\PDO::FETCH_NUM);
                    if (!$chunk) {
                        break;
                    }
                    $batch = [];
                    $size = 0;
                    foreach ($chunk as $r) {
                        $tuple = '(' . implode(',', array_map(fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v), $r)) . ')';
                        $batch[] = $tuple;
                        $size += strlen($tuple);
                        $rows++;
                        if ($size > 512 * 1024 || count($batch) >= 500) {
                            $w->record("INSERT INTO `{$t}` ({$colSql}) VALUES " . implode(',', $batch));
                            $batch = [];
                            $size = 0;
                        }
                    }
                    if ($batch) {
                        $w->record("INSERT INTO `{$t}` ({$colSql}) VALUES " . implode(',', $batch));
                    }
                    if (count($chunk) < 2000) {
                        break;
                    }
                }
            }
            $w->record('SET FOREIGN_KEY_CHECKS=1');
            $pdo->exec('COMMIT');
        } catch (\Throwable $e) {
            $pdo->exec('ROLLBACK');
            fclose($fh);
            @unlink($tmp);
            throw $e;
        }
        $w->finish();
        fclose($fh);
        rename($tmp, $file);
        @chmod($file, 0600);
        return ['file' => $file, 'bytes' => (int) filesize($file), 'tables' => count($tables), 'rows' => $rows];
    }

    /** 見出しを読む（鍵は要らない） */
    public static function header(string $file): array
    {
        $fh = @fopen($file, 'rb');
        if ($fh === false) {
            throw new \RuntimeException("開けません: {$file}");
        }
        $line = fgets($fh, 1 << 16);
        fclose($fh);
        $h = Json::tryDec(rtrim((string) $line, "\n"));
        if (!is_array($h) || ($h['format'] ?? null) !== self::MAGIC) {
            throw new \RuntimeException('バックアップのファイルではありません');
        }
        return $h;
    }

    /**
     * 中身の文を、ひとつずつ取り出す（復号しながら）。最後まで読めて、改ざん・途中切れが無いときだけ、最後まで回る
     * @return \Generator<int,string>
     */
    public static function records(App $app, string $file): \Generator
    {
        $fh = fopen($file, 'rb');
        if ($fh === false) {
            throw new \RuntimeException("開けません: {$file}");
        }
        $headerLine = rtrim((string) fgets($fh, 1 << 16), "\n");
        $h = Json::dec($headerLine);
        $key = self::key($app, (string) base64_decode((string) $h['salt'], true));
        $aadBase = hash('sha256', $headerLine, true);
        $buf = '';
        $i = 0;
        $final = false;
        try {
            while (!$final) {
                $lenBin = fread($fh, 4);
                if ($lenBin === false || strlen($lenBin) !== 4) {
                    throw new \RuntimeException('バックアップが途中で切れています（最後の塊がありません）');
                }
                $len = unpack('N', $lenBin)[1];
                $flag = ($len & 0x80000000) !== 0;
                $len &= 0x7FFFFFFF;
                if ($len > self::CHUNK + 1024) {
                    throw new \RuntimeException('バックアップが壊れています（塊の大きさ）');
                }
                $nonce = fread($fh, 12);
                $tag = fread($fh, 16);
                $ct = $len > 0 ? fread($fh, $len) : '';
                if (strlen((string) $nonce) !== 12 || strlen((string) $tag) !== 16 || strlen((string) $ct) !== $len) {
                    throw new \RuntimeException('バックアップが途中で切れています');
                }
                $aad = $aadBase . pack('J', $i) . ($flag ? "\x01" : "\x00");
                $plain = openssl_decrypt((string) $ct, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, (string) $nonce, (string) $tag, $aad);
                if ($plain === false) {
                    throw new \RuntimeException('バックアップを読めません（鍵が違うか、書き換えられています）');
                }
                $buf .= $plain;
                $i++;
                $final = $flag;
                while (strlen($buf) >= 4) {
                    $n = unpack('N', substr($buf, 0, 4))[1];
                    if (strlen($buf) < 4 + $n) {
                        break;
                    }
                    yield substr($buf, 4, $n);
                    $buf = substr($buf, 4 + $n);
                }
            }
            if ($buf !== '' || fread($fh, 1) !== '') {
                throw new \RuntimeException('バックアップの終わりに、余分なものがあります');
            }
        } finally {
            fclose($fh);
        }
    }

    /** 読めるか（鍵が合うか・壊れていないか）だけ確かめる。@return array{ok:bool,records:int,message:string} */
    public static function verify(App $app, string $file): array
    {
        try {
            $n = 0;
            foreach (self::records($app, $file) as $_) {
                $n++;
            }
            return ['ok' => true, 'records' => $n, 'message' => "読めました（文 {$n} 個）"];
        } catch (\Throwable $e) {
            return ['ok' => false, 'records' => 0, 'message' => $e->getMessage()];
        }
    }

    /**
     * 戻す（いまの中身は、戻す前に自動でバックアップを取る）。先に全部を読めるか確かめてから、戻し始める
     * @return array{statements:int,before:string}
     */
    public static function restore(App $app, string $file): array
    {
        $v = self::verify($app, $file);
        if (!$v['ok']) {
            throw new \RuntimeException('戻せません：' . $v['message']);
        }
        $before = self::create($app, '戻す前の自動バックアップ')['file'];
        $pdo = $app->db()->pdo();
        $n = 0;
        foreach (self::records($app, $file) as $sql) {
            $pdo->exec($sql);
            $n++;
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        return ['statements' => $n, 'before' => $before];
    }

    /** @return list<array{file:string,bytes:int,mtime:int}> 新しい順 */
    public static function list(App $app): array
    {
        $out = [];
        foreach (glob(self::dir($app) . '/*.hubbak') ?: [] as $f) {
            $out[] = ['file' => $f, 'bytes' => (int) filesize($f), 'mtime' => (int) filemtime($f)];
        }
        usort($out, fn ($a, $b) => $b['mtime'] <=> $a['mtime']);
        return $out;
    }

    /** 古いバックアップを消す（keep_days より古いもの。ただし最新の3つは残す） */
    public static function prune(App $app): int
    {
        $days = max(1, $app->config->int('backup.keep_days', 14));
        $limit = Time::ms($app->now()) / 1000 - $days * 86400;
        $n = 0;
        foreach (array_slice(self::list($app), 3) as $b) {
            if ($b['mtime'] < $limit && @unlink($b['file'])) {
                $n++;
            }
        }
        return $n;
    }
}

/** 暗号の塊を書く係 */
final class BackupWriter
{
    private string $buf = '';
    private int $i = 0;

    /** @param resource $fh */
    public function __construct(private $fh, private string $key, private string $aadBase)
    {
    }

    public function record(string $sql): void
    {
        $this->buf .= pack('N', strlen($sql)) . $sql;
        while (strlen($this->buf) >= 1 << 20) {
            $this->chunk(substr($this->buf, 0, 1 << 20), false);
            $this->buf = substr($this->buf, 1 << 20);
        }
    }

    public function finish(): void
    {
        $this->chunk($this->buf, true);
        $this->buf = '';
    }

    private function chunk(string $plain, bool $final): void
    {
        $nonce = random_bytes(12);
        $tag = '';
        $aad = $this->aadBase . pack('J', $this->i) . ($final ? "\x01" : "\x00");
        $ct = openssl_encrypt($plain, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $nonce, $tag, $aad, 16);
        if ($ct === false) {
            throw new \RuntimeException('バックアップの暗号化に失敗しました');
        }
        fwrite($this->fh, pack('N', strlen($ct) | ($final ? 0x80000000 : 0)) . $nonce . $tag . $ct);
        $this->i++;
    }
}
