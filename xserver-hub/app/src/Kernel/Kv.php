<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 小さな「名前 → 値」の置き場（hub_kv）。毎分の処理が最後に動いた時刻・1日1回の処理の済み印・
 * LINE の短期トークン（暗号化して）などを置く。期限（expires_at）を過ぎたものは無いものとして扱う。
 */
final class Kv
{
    public function __construct(private Db $db, private Clock $clock)
    {
    }

    public function get(string $k): ?string
    {
        $r = $this->db->one('SELECT v, expires_at FROM hub_kv WHERE k = ?', [$k]);
        if (!$r) {
            return null;
        }
        if ($r['expires_at'] !== null && Time::parse($r['expires_at']) <= $this->clock->now()) {
            return null;
        }
        return $r['v'];
    }

    public function set(string $k, ?string $v, ?int $ttlSec = null): void
    {
        $now = $this->clock->now();
        $exp = $ttlSec === null ? null : Time::addSeconds($now, $ttlSec);
        $this->db->exec(
            'INSERT INTO hub_kv (k, v, expires_at, updated_at) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE v = VALUES(v), expires_at = VALUES(expires_at), updated_at = VALUES(updated_at)',
            [$k, $v, $exp, $now]
        );
    }

    /** まだ無ければ入れて true。あれば何もしないで false（1日1回の処理の「済み印」に使う） */
    public function add(string $k, string $v, ?int $ttlSec = null): bool
    {
        $now = $this->clock->now();
        // 期限切れの古い印は消してから入れる
        $this->db->exec('DELETE FROM hub_kv WHERE k = ? AND expires_at IS NOT NULL AND expires_at <= ?', [$k, $now]);
        $exp = $ttlSec === null ? null : Time::addSeconds($now, $ttlSec);
        return $this->db->exec('INSERT IGNORE INTO hub_kv (k, v, expires_at, updated_at) VALUES (?, ?, ?, ?)', [$k, $v, $exp, $now]) > 0;
    }

    public function delete(string $k): void
    {
        $this->db->exec('DELETE FROM hub_kv WHERE k = ?', [$k]);
    }

    /** 期限切れを片づける（cleanup から） */
    public function purgeExpired(): int
    {
        return $this->db->exec('DELETE FROM hub_kv WHERE expires_at IS NOT NULL AND expires_at <= ?', [$this->clock->now()]);
    }
}
