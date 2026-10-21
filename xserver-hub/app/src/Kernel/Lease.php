<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 期限つきの貸出（リース）。同じ処理（毎分の処理など）が重なって動かないようにする。
 * 取った人だけが、印（owner）を持つ。落ちて返さなくても、期限が来れば次の人が取れる。
 */
final class Lease
{
    public function __construct(private Db $db, private Clock $clock)
    {
    }

    /** 取れたら印（返すときに使う）。他の人が期限内で使っていれば null */
    public function acquire(string $name, int $ttlSec): ?string
    {
        $now = $this->clock->now();
        $owner = bin2hex(random_bytes(16));
        $until = Time::addSeconds($now, $ttlSec);
        $this->db->exec(
            'INSERT INTO hub_locks (name, owner, locked_until) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
               owner = IF(locked_until <= ?, VALUES(owner), owner),
               locked_until = IF(locked_until <= ?, VALUES(locked_until), locked_until)',
            [$name, $owner, $until, $now, $now]
        );
        $got = $this->db->value('SELECT owner FROM hub_locks WHERE name = ?', [$name]);
        return $got === $owner ? $owner : null;
    }

    public function release(string $name, string $owner): void
    {
        $this->db->exec('UPDATE hub_locks SET locked_until = ? WHERE name = ? AND owner = ?', [$this->clock->now(), $name, $owner]);
    }

    /**
     * 取れたら fn を実行して返す。取れなければ $busy を返す。例外でも必ず返却する
     * @template T @param callable():T $fn @return T|mixed
     */
    public function with(string $name, int $ttlSec, callable $fn, mixed $busy = null): mixed
    {
        $owner = $this->acquire($name, $ttlSec);
        if ($owner === null) {
            return $busy;
        }
        try {
            return $fn();
        } finally {
            $this->release($name, $owner);
        }
    }
}
