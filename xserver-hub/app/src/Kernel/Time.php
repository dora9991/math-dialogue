<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 時刻の形をそろえる小さな部品。
 *
 *   ・DB：'2026-10-15 06:20:17.360'（UTC。DATETIME(3)）
 *   ・画面・API：'2026-10-15T06:20:17.360Z'（ISO 8601。JavaScript の toISOString と同じ形）
 *   ・日本時間の計算は「固定のずれ（分）」で行う（日本は夏時間が無い。設定 timezone_offset_min＝540）
 */
final class Time
{
    private const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];

    private static function utc(): \DateTimeZone
    {
        static $z = null;
        return $z ??= new \DateTimeZone('UTC');
    }

    public static function iso(\DateTimeImmutable $d): string
    {
        return $d->setTimezone(self::utc())->format('Y-m-d\TH:i:s.v\Z');
    }

    public static function db(\DateTimeImmutable $d): string
    {
        return $d->setTimezone(self::utc())->format('Y-m-d H:i:s.v');
    }

    /** DB の値（UTC）を ISO の文字列に。null はそのまま */
    public static function dbToIso(?string $v): ?string
    {
        if ($v === null || $v === '') {
            return null;
        }
        return self::iso(self::parse($v));
    }

    /**
     * 文字列を時刻に。'2026-11-10T20:00:00+09:00'・'...Z'・DB の形（UTC とみなす）・'2026-11-10'（UTC の0時）を受ける。
     * 読めなければ例外（呼び出し側が日本語のエラーにする）
     */
    public static function parse(string $s): \DateTimeImmutable
    {
        $s = trim($s);
        if ($s === '' || strlen($s) > 40 || !preg_match('/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?)?(Z|[+-]\d{2}:?\d{2})?$/i', $s)) {
            throw new \InvalidArgumentException('日時として読めません');
        }
        try {
            $hasZone = (bool) preg_match('/(Z|[+-]\d{2}:?\d{2})$/i', $s);
            $d = new \DateTimeImmutable($s, $hasZone ? null : self::utc());
        } catch (\Exception) {
            throw new \InvalidArgumentException('日時として読めません');
        }
        // 2026-02-30 のような「繰り上がる日付」は、入力の誤りとして断る
        $errs = \DateTimeImmutable::getLastErrors();
        if ($errs !== false && ($errs['warning_count'] ?? 0) > 0) {
            throw new \InvalidArgumentException('日時として読めません');
        }
        return self::fromMs(self::ms($d));
    }

    public static function tryParse(mixed $s): ?\DateTimeImmutable
    {
        if (!is_string($s) || $s === '') {
            return null;
        }
        try {
            return self::parse($s);
        } catch (\InvalidArgumentException) {
            return null;
        }
    }

    /** ミリ秒（1970年からの） */
    public static function ms(\DateTimeImmutable $d): int
    {
        return (int) $d->format('U') * 1000 + intdiv((int) $d->format('u'), 1000);
    }

    public static function fromMs(int $ms): \DateTimeImmutable
    {
        $sec = intdiv($ms, 1000);
        $rem = $ms - $sec * 1000;
        if ($rem < 0) {
            $sec -= 1;
            $rem += 1000;
        }
        $d = \DateTimeImmutable::createFromFormat('U u', sprintf('%d %06d', $sec, $rem * 1000), self::utc());
        if ($d === false) {
            throw new \RuntimeException('時刻を作れませんでした');
        }
        return $d;
    }

    public static function addSeconds(\DateTimeImmutable $d, int $sec): \DateTimeImmutable
    {
        return self::fromMs(self::ms($d) + $sec * 1000);
    }

    public static function addMinutes(\DateTimeImmutable $d, int $min): \DateTimeImmutable
    {
        return self::fromMs(self::ms($d) + $min * 60_000);
    }

    /** @return array{y:int,m:int,d:int,hh:int,mm:int,dow:int} ローカル時刻の年月日時分と曜日（0=日） */
    public static function localParts(\DateTimeImmutable $d, int $offsetMin): array
    {
        $l = self::fromMs(self::ms($d) + $offsetMin * 60_000);
        return [
            'y' => (int) $l->format('Y'),
            'm' => (int) $l->format('n'),
            'd' => (int) $l->format('j'),
            'hh' => (int) $l->format('G'),
            'mm' => (int) $l->format('i'),
            'dow' => (int) $l->format('w'),
        ];
    }

    /** ローカルの年月日時分 → 実時刻。日・月の繰り上がりも計算する（11月31日 → 12月1日） */
    public static function fromLocal(int $y, int $m, int $d, int $hh, int $mm, int $offsetMin): \DateTimeImmutable
    {
        $sec = gmmktime($hh, $mm, 0, $m, $d, $y);
        return self::fromMs(($sec - $offsetMin * 60) * 1000);
    }

    public static function addLocalDays(\DateTimeImmutable $d, int $days, int $offsetMin): \DateTimeImmutable
    {
        // 秒・ミリ秒は 0 になる（JavaScript 版の Date.UTC(y, m, d, hh, mm) と同じ）
        $p = self::localParts($d, $offsetMin);
        return self::fromLocal($p['y'], $p['m'], $p['d'] + $days, $p['hh'], $p['mm'], $offsetMin);
    }

    /** '2026-10' のような月キー（通数の月次集計） */
    public static function monthKey(\DateTimeImmutable $d, int $offsetMin): string
    {
        $p = self::localParts($d, $offsetMin);
        return sprintf('%04d-%02d', $p['y'], $p['m']);
    }

    /** '10月20日(月) 20:00' */
    public static function formatJa(\DateTimeImmutable $d, int $offsetMin): string
    {
        $p = self::localParts($d, $offsetMin);
        return sprintf('%d月%d日(%s) %02d:%02d', $p['m'], $p['d'], self::WEEKDAY[$p['dow']], $p['hh'], $p['mm']);
    }

    /** 'YYYY-MM-DD'（ローカル） */
    public static function ymd(\DateTimeImmutable $d, int $offsetMin): string
    {
        $p = self::localParts($d, $offsetMin);
        return sprintf('%04d-%02d-%02d', $p['y'], $p['m'], $p['d']);
    }
}
