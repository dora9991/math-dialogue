<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * JSON の読み書き。
 *
 * PHP の配列は「並び（[]）」と「表（{}）」の区別があいまいなので、ここで決まりを作る：
 *   ・dec()  … 連想配列で読む（エンジンの計算用）。空の {} は [] になる点に注意
 *   ・decKeep() … オブジェクトのまま読む（画面へそのまま返す用）。{} は {} のまま、{"0": …} も {"0": …} のまま
 *   ・obj()  … 連想配列を「表」として書きたいときに包む（空でも {} になる）
 */
final class Json
{
    private const ENC = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION | JSON_THROW_ON_ERROR;

    public static function enc(mixed $v): string
    {
        return json_encode($v, self::ENC);
    }

    /** 読めなければ例外 */
    public static function dec(string $s): mixed
    {
        return json_decode($s, true, 64, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
    }

    public static function decKeep(string $s): mixed
    {
        return json_decode($s, false, 64, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
    }

    /** 読めなければ null */
    public static function tryDec(?string $s): mixed
    {
        if ($s === null || $s === '') {
            return null;
        }
        try {
            return self::dec($s);
        } catch (\JsonException) {
            return null;
        }
    }

    /** 連想配列を「表（{}）」として書く。空でも {} */
    public static function obj(array|object|null $a): object
    {
        if ($a === null) {
            return new \stdClass();
        }
        return is_object($a) ? $a : (object) $a;
    }

    /** 連想配列か（並び＝0,1,2… の配列ではない） */
    public static function isMap(mixed $v): bool
    {
        return is_array($v) && ($v === [] ? false : !array_is_list($v));
    }

    /** 「表」として受け取ってよい値か（連想配列・空配列・オブジェクト） */
    public static function isObjLike(mixed $v): bool
    {
        return is_object($v) || (is_array($v) && ($v === [] || !array_is_list($v)));
    }

    /** オブジェクト（decKeep で読んだもの）を、連想配列へ深く直す */
    public static function toArray(mixed $v): mixed
    {
        if (is_object($v)) {
            $v = get_object_vars($v);
        }
        if (is_array($v)) {
            foreach ($v as $k => $x) {
                $v[$k] = self::toArray($x);
            }
        }
        return $v;
    }
}
