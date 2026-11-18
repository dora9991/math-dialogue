<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * データベース（MariaDB / MySQL）。PDO の薄い包み。
 *
 * 約束：
 *   ・値は必ず ? のプレースホルダで渡す（文字列をつなげて SQL を作らない＝SQL インジェクション対策）
 *   ・接続の time_zone は UTC、文字コードは utf8mb4、厳格モード（不正な値を黙って丸めない）
 *   ・読んだ値の形をそろえる：TINYINT(1) → true/false、DATETIME → ISO の文字列（'…Z'）、
 *     JSON の列は、呼び出し側が json: [...]（連想配列）か keep: [...]（オブジェクトのまま）で名前を指定して読む
 *   ・MariaDB 10.5 で動く SQL だけを使う（Xserver の多くのサーバーが 10.5。SKIP LOCKED・UPDATE … RETURNING は使わない）
 */
final class Db
{
    private int $depth = 0;

    public function __construct(private \PDO $pdo)
    {
    }

    /** @param array{host:string,port?:int,name:string,user:string,pass:string,socket?:string} $c */
    public static function connect(array $c): self
    {
        $dsn = !empty($c['socket'])
            ? sprintf('mysql:unix_socket=%s;dbname=%s;charset=utf8mb4', $c['socket'], $c['name'])
            : sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], (int) ($c['port'] ?? 3306), $c['name']);
        $pdo = new \PDO($dsn, $c['user'], $c['pass'], [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
            \PDO::ATTR_STRINGIFY_FETCHES => false,
            \PDO::ATTR_TIMEOUT => 5,
        ]);
        $pdo->exec("SET time_zone = '+00:00', NAMES utf8mb4 COLLATE utf8mb4_bin, "
            . "sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        return new self($pdo);
    }

    public function pdo(): \PDO
    {
        return $this->pdo;
    }

    /**
     * @param list<mixed> $params
     * @param list<string> $json 連想配列で読む JSON の列
     * @param list<string> $keep オブジェクトのまま読む JSON の列（画面へそのまま返すとき。{} が [] にならない）
     * @return list<array<string,mixed>>
     */
    public function all(string $sql, array $params = [], array $json = [], array $keep = []): array
    {
        $st = $this->run($sql, $params);
        $rows = $st->fetchAll();
        if (!$rows) {
            return [];
        }
        $conv = $this->converters($st);
        foreach ($json as $c) {
            $conv[$c] = 'json';
        }
        foreach ($keep as $c) {
            $conv[$c] = 'keep';
        }
        if ($conv) {
            foreach ($rows as &$r) {
                foreach ($conv as $col => $how) {
                    if (!array_key_exists($col, $r) || $r[$col] === null) {
                        continue;
                    }
                    $v = $r[$col];
                    $r[$col] = match ($how) {
                        'bool' => (bool) $v,
                        'time' => Time::dbToIso((string) $v),
                        'num' => fmod((float) $v, 1.0) === 0.0 ? (int) $v : (float) $v, // SUM() などの小数型。整数なら int
                        'json' => is_string($v) ? Json::dec($v) : $v,
                        'keep' => is_string($v) ? Json::decKeep($v) : $v,
                        default => $v,
                    };
                }
            }
            unset($r);
        }
        return $rows;
    }

    /** @param list<mixed> $params @return array<string,mixed>|null */
    public function one(string $sql, array $params = [], array $json = [], array $keep = []): ?array
    {
        return $this->all($sql, $params, $json, $keep)[0] ?? null;
    }

    /** 最初の行の最初の列（無ければ null） */
    public function value(string $sql, array $params = []): mixed
    {
        $r = $this->one($sql, $params);
        return $r === null ? null : reset($r);
    }

    /** 書き込み。変わった行の数を返す */
    public function exec(string $sql, array $params = []): int
    {
        return $this->run($sql, $params)->rowCount();
    }

    /** 直前の INSERT の自動採番 */
    public function lastId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * まとめて1つの取引（トランザクション）にする。例外なら全部取り消す。
     * 入れ子で呼ばれたら、外側の取引の一部として動く（JavaScript 版の db.tx と同じ）
     * @template T @param callable(Db):T $fn @return T
     */
    public function tx(callable $fn): mixed
    {
        if ($this->depth > 0) {
            return $fn($this);
        }
        $this->pdo->beginTransaction();
        $this->depth = 1;
        try {
            $r = $fn($this);
            $this->pdo->commit();
            return $r;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        } finally {
            $this->depth = 0;
        }
    }

    public function inTx(): bool
    {
        return $this->depth > 0;
    }

    /**
     * IN (?, ?, …) の ? を作り、値を $params に足す。空なら、何にも当たらない条件（NULL）になる
     * @param list<mixed> $values @param list<mixed> $params
     */
    public static function in(array $values, array &$params): string
    {
        if (!$values) {
            return 'NULL';
        }
        foreach ($values as $v) {
            $params[] = $v;
        }
        return implode(',', array_fill(0, count($values), '?'));
    }

    /** LIKE の検索語の % と _ を、ただの文字にする */
    public static function likeEscape(string $s): string
    {
        return strtr($s, ['\\' => '\\\\', '%' => '\\%', '_' => '\\_']);
    }

    /** SQL ファイル（複数の文）を1文ずつ実行する（マイグレーション用。文の区切りは ; ） */
    public function execScript(string $sql): void
    {
        foreach (self::splitStatements($sql) as $stmt) {
            $this->pdo->exec($stmt);
        }
    }

    /** @return list<string> */
    public static function splitStatements(string $sql): array
    {
        $out = [];
        $buf = '';
        $len = strlen($sql);
        $quote = null;
        for ($i = 0; $i < $len; $i++) {
            $ch = $sql[$i];
            $next = $sql[$i + 1] ?? '';
            if ($quote !== null) {
                $buf .= $ch;
                if ($ch === '\\' && $quote !== '`') {
                    $buf .= $next;
                    $i++;
                } elseif ($ch === $quote) {
                    $quote = null;
                }
                continue;
            }
            if ($ch === '-' && $next === '-' && in_array($sql[$i + 2] ?? ' ', [' ', "\t", "\n", "\r"], true)) {
                $end = strpos($sql, "\n", $i);
                $i = $end === false ? $len : $end;
                $buf .= "\n";
                continue;
            }
            if ($ch === '#') {
                $end = strpos($sql, "\n", $i);
                $i = $end === false ? $len : $end;
                $buf .= "\n";
                continue;
            }
            if ($ch === '/' && $next === '*') {
                $end = strpos($sql, '*/', $i + 2);
                $i = $end === false ? $len : $end + 1;
                $buf .= ' ';
                continue;
            }
            if ($ch === "'" || $ch === '"' || $ch === '`') {
                $quote = $ch;
                $buf .= $ch;
                continue;
            }
            if ($ch === ';') {
                if (trim($buf) !== '') {
                    $out[] = trim($buf);
                }
                $buf = '';
                continue;
            }
            $buf .= $ch;
        }
        if (trim($buf) !== '') {
            $out[] = trim($buf);
        }
        return $out;
    }

    private function run(string $sql, array $params): \PDOStatement
    {
        $st = $this->pdo->prepare($sql);
        $i = 1;
        foreach ($params as $v) {
            if ($v instanceof \DateTimeImmutable) {
                $st->bindValue($i, Time::db($v), \PDO::PARAM_STR);
            } elseif (is_bool($v)) {
                $st->bindValue($i, $v ? 1 : 0, \PDO::PARAM_INT);
            } elseif (is_int($v)) {
                $st->bindValue($i, $v, \PDO::PARAM_INT);
            } elseif ($v === null) {
                $st->bindValue($i, null, \PDO::PARAM_NULL);
            } elseif (is_float($v)) {
                $st->bindValue($i, (string) $v, \PDO::PARAM_STR);
            } elseif (is_string($v)) {
                $st->bindValue($i, $v, \PDO::PARAM_STR);
            } else {
                throw new \InvalidArgumentException('SQL のパラメータに使えない値です（配列は Json::enc してから渡す）: ' . get_debug_type($v));
            }
            $i++;
        }
        $st->execute();
        return $st;
    }

    /** @return array<string,string> 列名 → 変換の種類 */
    private function converters(\PDOStatement $st): array
    {
        $conv = [];
        $n = $st->columnCount();
        for ($i = 0; $i < $n; $i++) {
            $m = $st->getColumnMeta($i);
            if (!$m) {
                continue;
            }
            $t = strtoupper((string) ($m['native_type'] ?? ''));
            $len = (int) ($m['len'] ?? 0);
            if ($t === 'TINY' && $len === 1) {
                $conv[$m['name']] = 'bool';
            } elseif ($t === 'DATETIME' || $t === 'TIMESTAMP') {
                $conv[$m['name']] = 'time';
            } elseif ($t === 'NEWDECIMAL') {
                $conv[$m['name']] = 'num';
            }
        }
        return $conv;
    }
}
