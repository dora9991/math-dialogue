<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 回数の制限（決まった時間の窓ごとに数える）。ログインの総当たり・連携コードの当てずっぽう・管理 API の連打を止める。
 * 数は DB（hub_rate_limits）に持つ（Xserver では PHP のプロセスがリクエストごとに別なので、メモリでは数えられない）。
 */
final class RateLimiter
{
    public function __construct(private Db $db, private Clock $clock)
    {
    }

    /**
     * 1回数える。窓の中の回数が limit を超えたら false（＝止める）。
     * @return array{ok:bool,count:int,retryAfter:int}
     */
    public function hit(string $bucket, int $limit, int $windowSec): array
    {
        $now = $this->clock->now();
        $nowMs = Time::ms($now);
        $start = Time::fromMs($nowMs - ($nowMs % ($windowSec * 1000)));
        $key = substr($bucket, 0, 190);
        $this->db->exec(
            'INSERT INTO hub_rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE count = IF(window_start = VALUES(window_start), count + 1, 1), window_start = VALUES(window_start)',
            [$key, $start]
        );
        $count = (int) $this->db->value('SELECT count FROM hub_rate_limits WHERE bucket = ?', [$key]);
        $retry = (int) ceil(($windowSec * 1000 - ($nowMs - Time::ms($start))) / 1000);
        return ['ok' => $count <= $limit, 'count' => $count, 'retryAfter' => max(1, $retry)];
    }

    /** 数えずに、いまの回数だけ見る */
    public function peek(string $bucket, int $windowSec): int
    {
        $nowMs = Time::ms($this->clock->now());
        $start = Time::fromMs($nowMs - ($nowMs % ($windowSec * 1000)));
        $r = $this->db->one('SELECT window_start, count FROM hub_rate_limits WHERE bucket = ?', [substr($bucket, 0, 190)]);
        if (!$r || Time::ms(Time::parse($r['window_start'])) !== Time::ms($start)) {
            return 0;
        }
        return (int) $r['count'];
    }

    public function reset(string $bucket): void
    {
        $this->db->exec('DELETE FROM hub_rate_limits WHERE bucket = ?', [substr($bucket, 0, 190)]);
    }

    public function purge(int $olderThanSec = 86400): int
    {
        return $this->db->exec('DELETE FROM hub_rate_limits WHERE window_start < ?', [Time::addSeconds($this->clock->now(), -$olderThanSec)]);
    }
}
