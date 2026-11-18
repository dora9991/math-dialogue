<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * データベースの形の更新（マイグレーション）。app/migrations/NNN_名前.sql を番号の順に1回ずつ流す。
 *
 *   ・流したものは hub_migrations に、名前と中身の指紋（SHA-256）を残す。流したあとでファイルを書き換えると、doctor が気づく
 *   ・MariaDB では、表を作る・変える文（DDL）は取り消せない。だから本番では、流す前に bin/hub backup を取る（bin/hub migrate が自動で取る）
 *   ・ファイルの中で ; を文の区切りにする（DELIMITER・ストアドプロシージャは使わない）
 */
final class Migrator
{
    public function __construct(private Db $db, private string $dir, private Clock $clock)
    {
    }

    private function ensureTable(): void
    {
        $this->db->pdo()->exec(
            'CREATE TABLE IF NOT EXISTS hub_migrations (
               name VARCHAR(100) NOT NULL PRIMARY KEY,
               checksum CHAR(64) NOT NULL,
               applied_at DATETIME(3) NOT NULL
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin'
        );
    }

    /** @return list<string> ファイル名（番号の順） */
    public function files(): array
    {
        $files = glob($this->dir . '/*.sql') ?: [];
        $names = array_map('basename', $files);
        sort($names, SORT_STRING);
        return $names;
    }

    /** @return array{applied:list<string>,pending:list<string>,changed:list<string>} */
    public function status(): array
    {
        $this->ensureTable();
        $done = [];
        foreach ($this->db->all('SELECT name, checksum FROM hub_migrations') as $r) {
            $done[$r['name']] = $r['checksum'];
        }
        $out = ['applied' => [], 'pending' => [], 'changed' => []];
        foreach ($this->files() as $f) {
            if (!isset($done[$f])) {
                $out['pending'][] = $f;
                continue;
            }
            $out['applied'][] = $f;
            if (!hash_equals($done[$f], hash_file('sha256', $this->dir . '/' . $f))) {
                $out['changed'][] = $f;
            }
        }
        return $out;
    }

    /** まだ流していないものを流す。@return list<string> 流したもの */
    public function migrate(?callable $say = null): array
    {
        $ran = [];
        foreach ($this->status()['pending'] as $f) {
            $sql = (string) file_get_contents($this->dir . '/' . $f);
            $say && $say("流します: {$f}");
            $this->db->execScript($sql);
            $this->db->exec('INSERT INTO hub_migrations (name, checksum, applied_at) VALUES (?, ?, ?)', [$f, hash('sha256', $sql), $this->clock->now()]);
            $ran[] = $f;
        }
        return $ran;
    }
}
