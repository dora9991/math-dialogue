<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 時計。ふだんは本物の時刻（UTC）。テストでは止めたり進めたりできる（setNow / advance）。
 * DB には UTC で入れる（接続の time_zone を +00:00 にしている）。日本時間にするのは、画面と配信の時刻の計算のときだけ。
 */
final class Clock
{
    private ?\DateTimeImmutable $fixed = null;

    public function now(): \DateTimeImmutable
    {
        if ($this->fixed !== null) {
            return $this->fixed;
        }
        // ミリ秒までにそろえる（DB の DATETIME(3) と同じ細かさ。比べたときに、ずれないように）
        return Time::fromMs(Time::ms(new \DateTimeImmutable('now', new \DateTimeZone('UTC'))));
    }

    /** テスト用：時刻を止める */
    public function setNow(\DateTimeImmutable|string $t): void
    {
        $this->fixed = is_string($t) ? Time::parse($t) : $t->setTimezone(new \DateTimeZone('UTC'));
    }

    /** テスト用：止めた時刻を進める（秒） */
    public function advance(int $seconds): void
    {
        $this->fixed = $this->now()->modify(sprintf('%+d seconds', $seconds));
    }
}
