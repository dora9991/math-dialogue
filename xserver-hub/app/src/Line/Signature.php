<?php
declare(strict_types=1);

namespace Hub\Line;

/**
 * LINE の署名検証：HMAC-SHA256(チャネルシークレット, 生のボディ) を base64 にしたものと一致するか。
 * 比較は一定時間で行う（hash_equals。先頭からの一致数で、秘密が漏れないように）。
 */
final class Signature
{
    public static function compute(string $rawBody, string $secret): string
    {
        return base64_encode(hash_hmac('sha256', $rawBody, $secret, true));
    }

    /** シークレットが未設定なら例外（呼び出し側が「設定不足」として扱う） */
    public static function verify(string $rawBody, string $signature, string $secret): bool
    {
        if ($secret === '') {
            throw new \RuntimeException('LINE のチャネルシークレット（line.channel_secret）が未設定です');
        }
        if ($signature === '') {
            return false;
        }
        return hash_equals(self::compute($rawBody, $secret), $signature);
    }
}
