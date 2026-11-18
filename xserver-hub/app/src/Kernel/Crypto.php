<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 暗号の部品。PHP 標準の OpenSSL だけを使う（追加のライブラリなし。Xserver の PHP にもある）。
 *
 *   ・encrypt / decrypt … AES-256-GCM（中身を読めなくし、書き換えも見破る）。トークの本文など、漏れたら困る列に使う
 *     形：e1.<鍵の名前>.<base64url(nonce12 + tag16 + 暗号文)>。鍵の名前があるので、鍵を入れ替えても古いものを読める
 *     aad（関連データ）に「どの表のどの列か」を入れる。別の列へ暗号文をそのまま移し替えても、読めない
 *   ・index … 検索用の指紋（HMAC-SHA256）。連携コードのように「同じ値か」だけ確かめたいものを、元に戻せない形で持つ
 *   ・鍵は config.php の keys（32バイトの乱数を base64 にしたもの）。鍵が漏れたら意味がないので、config.php は 600・公開フォルダの外
 */
final class Crypto
{
    private const CIPHER = 'aes-256-gcm';
    private const PREFIX = 'e1';

    /** @var array<string,string> 鍵の名前 → 32バイトの鍵 */
    private array $keys = [];

    /**
     * @param array<string,string> $dataKeys 鍵の名前 → base64
     */
    public function __construct(array $dataKeys, private string $primary, private string $indexKey)
    {
        foreach ($dataKeys as $kid => $b64) {
            if (!preg_match('/^[A-Za-z0-9_-]{1,16}$/', (string) $kid)) {
                throw new \RuntimeException("鍵の名前は半角英数字16文字までです: {$kid}");
            }
            $this->keys[(string) $kid] = self::decodeKey((string) $b64, "keys.data.{$kid}");
        }
        if (!isset($this->keys[$primary])) {
            throw new \RuntimeException("keys.data_primary（{$primary}）が keys.data にありません");
        }
        $this->indexKey = self::decodeKey($indexKey, 'keys.index');
    }

    public static function fromConfig(Config $c): self
    {
        $data = $c->arr('keys.data');
        $primary = $c->str('keys.data_primary', (string) array_key_first($data));
        return new self($data, $primary, $c->str('keys.index'));
    }

    public static function decodeKey(string $b64, string $label): string
    {
        $raw = base64_decode(trim($b64), true);
        if ($raw === false || strlen($raw) !== 32) {
            throw new \RuntimeException("{$label} は 32 バイトの乱数を base64 にした値にしてください（bin/hub keys:generate で作れます）");
        }
        return $raw;
    }

    public static function generateKey(): string
    {
        return base64_encode(random_bytes(32));
    }

    public function primaryKeyId(): string
    {
        return $this->primary;
    }

    public function encrypt(string $plain, string $aad): string
    {
        $nonce = random_bytes(12);
        $tag = '';
        $ct = openssl_encrypt($plain, self::CIPHER, $this->keys[$this->primary], OPENSSL_RAW_DATA, $nonce, $tag, $aad, 16);
        if ($ct === false) {
            throw new \RuntimeException('暗号化に失敗しました');
        }
        return self::PREFIX . '.' . $this->primary . '.' . self::b64u($nonce . $tag . $ct);
    }

    /** 鍵が違う・書き換えられている・列が違う（aad）なら例外 */
    public function decrypt(string $token, string $aad): string
    {
        $parts = explode('.', $token, 3);
        if (count($parts) !== 3 || $parts[0] !== self::PREFIX) {
            throw new \RuntimeException('暗号文の形ではありません');
        }
        [, $kid, $body] = $parts;
        if (!isset($this->keys[$kid])) {
            throw new \RuntimeException("鍵 {$kid} がありません（鍵を消してしまった？ config.php の keys.data を確かめてください）");
        }
        $raw = self::unb64u($body);
        if ($raw === null || strlen($raw) < 28) {
            throw new \RuntimeException('暗号文が壊れています');
        }
        $plain = openssl_decrypt(substr($raw, 28), self::CIPHER, $this->keys[$kid], OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16), $aad);
        if ($plain === false) {
            throw new \RuntimeException('暗号文を読めません（書き換えられたか、鍵か列が違います）');
        }
        return $plain;
    }

    public function encN(?string $plain, string $aad): ?string
    {
        return $plain === null ? null : $this->encrypt($plain, $aad);
    }

    public function decN(?string $token, string $aad): ?string
    {
        return $token === null ? null : $this->decrypt($token, $aad);
    }

    public function encJson(mixed $v, string $aad): ?string
    {
        return $v === null ? null : $this->encrypt(Json::enc($v), $aad);
    }

    /** keep=true なら、オブジェクトのまま読む（画面へそのまま返すとき） */
    public function decJson(?string $token, string $aad, bool $keep = false): mixed
    {
        if ($token === null) {
            return null;
        }
        $s = $this->decrypt($token, $aad);
        return $keep ? Json::decKeep($s) : Json::dec($s);
    }

    public static function isEncrypted(?string $v): bool
    {
        return is_string($v) && str_starts_with($v, self::PREFIX . '.');
    }

    /** 暗号文の鍵の名前（鍵の入れ替えで、古い鍵のものを探す） */
    public static function keyIdOf(string $token): ?string
    {
        $p = explode('.', $token, 3);
        return count($p) === 3 && $p[0] === self::PREFIX ? $p[1] : null;
    }

    /** 検索用の指紋（64桁の16進）。purpose を変えると、同じ値でも別の指紋になる */
    public function index(string $value, string $purpose): string
    {
        return hash_hmac('sha256', $purpose . "\0" . $value, $this->indexKey);
    }

    /** 一定時間の比較（先頭から何文字合っているかで、秘密が漏れないように） */
    public static function equals(string $a, string $b): bool
    {
        return hash_equals($a, $b);
    }

    /** 推測できない文字列（URL に入れても大丈夫な形） */
    public static function token(int $bytes = 32): string
    {
        return self::b64u(random_bytes($bytes));
    }

    public static function b64u(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    public static function unb64u(string $s): ?string
    {
        if (!preg_match('/^[A-Za-z0-9_-]*$/', $s)) {
            return null;
        }
        $raw = base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4), true);
        return $raw === false ? null : $raw;
    }
}
