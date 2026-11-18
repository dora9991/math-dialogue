<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 二段階認証のワンタイムコード（TOTP。RFC 6238）。Google Authenticator・Microsoft Authenticator・1Password などで使える。
 * 30秒ごとに変わる6桁。前後1つ（±30秒）までのずれを許す。一度使ったコードは、同じ人には二度と通さない（使い回しの防止）。
 */
final class Totp
{
    private const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    public const PERIOD = 30;

    /** 秘密（base32。20バイト＝32文字） */
    public static function newSecret(): string
    {
        return self::b32enc(random_bytes(20));
    }

    /** 認証アプリに読み込ませる URI（QR コードにする） */
    public static function uri(string $secret, string $account, string $issuer): string
    {
        return 'otpauth://totp/' . rawurlencode($issuer . ':' . $account)
            . '?secret=' . $secret . '&issuer=' . rawurlencode($issuer) . '&algorithm=SHA1&digits=6&period=' . self::PERIOD;
    }

    public static function step(int $unixSec): int
    {
        return intdiv($unixSec, self::PERIOD);
    }

    public static function code(string $secret, int $step): string
    {
        $key = self::b32dec($secret);
        $msg = pack('N2', ($step >> 32) & 0xFFFFFFFF, $step & 0xFFFFFFFF);
        $h = hash_hmac('sha1', $msg, $key, true);
        $o = ord($h[19]) & 0x0F;
        $bin = ((ord($h[$o]) & 0x7F) << 24) | (ord($h[$o + 1]) << 16) | (ord($h[$o + 2]) << 8) | ord($h[$o + 3]);
        return str_pad((string) ($bin % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    /**
     * 合っていれば、合ったステップ（次回は、これ以下を断る）。合わなければ null。
     * lastStep：前回使ったステップ（同じコードの使い回しを断る）
     */
    public static function verify(string $secret, string $code, int $unixSec, ?int $lastStep = null, int $window = 1): ?int
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';
        if (!preg_match('/^\d{6}$/', $code)) {
            return null;
        }
        $now = self::step($unixSec);
        $found = null;
        for ($d = -$window; $d <= $window; $d++) {
            $s = $now + $d;
            // 全部の候補を同じように計算してから比べる（早く抜けると、時間で手がかりを与える）
            if (hash_equals(self::code($secret, $s), $code) && ($lastStep === null || $s > $lastStep)) {
                $found = $s;
            }
        }
        return $found;
    }

    public static function b32enc(string $raw): string
    {
        $bits = '';
        foreach (str_split($raw) as $c) {
            $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
        }
        $out = '';
        foreach (str_split($bits, 5) as $chunk) {
            $out .= self::B32[bindec(str_pad($chunk, 5, '0'))];
        }
        return $out;
    }

    public static function b32dec(string $s): string
    {
        $s = strtoupper(preg_replace('/[\s=]/', '', $s) ?? '');
        $bits = '';
        foreach (str_split($s) as $c) {
            $i = strpos(self::B32, $c);
            if ($i === false) {
                throw new \InvalidArgumentException('base32 として読めません');
            }
            $bits .= str_pad(decbin($i), 5, '0', STR_PAD_LEFT);
        }
        $out = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $out .= chr(bindec($byte));
            }
        }
        return $out;
    }
}
