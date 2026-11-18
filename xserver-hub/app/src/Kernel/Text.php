<?php
declare(strict_types=1);

namespace Hub\Kernel;

/** 文字の小さな部品（全角・半角のゆれ、UUID、短い要約） */
final class Text
{
    /**
     * NFKC（全角英数字→半角、半角カナ→全角 など）。PHP に intl が無いサーバーでは、mb_convert_kana で近いことをする
     */
    public static function nfkc(string $s): string
    {
        if (class_exists(\Normalizer::class)) {
            $n = \Normalizer::normalize($s, \Normalizer::FORM_KC);
            if (is_string($n)) {
                return $n;
            }
        }
        return mb_convert_kana($s, 'asKV', 'UTF-8');
    }

    /** キーワード照合用：全角/半角・大文字小文字・空白のゆれを吸収する（JavaScript 版の normalizeText と同じ） */
    public static function normalize(?string $s): string
    {
        $t = self::nfkc((string) $s);
        $t = preg_replace('/\s+/u', ' ', $t) ?? $t;
        return mb_strtolower(trim($t));
    }

    /** 先頭 n 文字（多ければ …） */
    public static function head(?string $s, int $n = 80): ?string
    {
        if ($s === null) {
            return null;
        }
        return mb_strlen($s) > $n ? mb_substr($s, 0, $n) . '…' : $s;
    }

    public static function uuid(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0F) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3F) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h, 0, 8), substr($h, 8, 4), substr($h, 12, 4), substr($h, 16, 4), substr($h, 20));
    }

    public static function isUuid(mixed $v): bool
    {
        return is_string($v) && (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $v);
    }

    /** JavaScript の String.length と同じ数え方（UTF-16 の単位。絵文字は2） */
    public static function jsLength(string $s): int
    {
        return intdiv(strlen((string) mb_convert_encoding($s, 'UTF-16LE', 'UTF-8')), 2);
    }
}
