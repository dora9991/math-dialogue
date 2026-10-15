<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * パスワード（運営メンバーのログイン）。
 *
 *   ・保存するのは「元に戻せない形（Argon2id。無ければ bcrypt）」だけ。パスワードそのものは、どこにも残さない
 *   ・こしょう（pepper）：config.php の keys.pepper で先に HMAC してから保存の形にする。
 *     DB だけが漏れても、config.php が無ければ、総当たりで当てられない
 *   ・決まり：12文字以上。よくあるもの・メールアドレスの一部・同じ文字の繰り返しは断る
 */
final class Password
{
    private const COMMON = [
        'password', 'password1', 'password123', '123456789012', '1234567890ab', 'qwertyuiop', 'qwerty123456', 'iloveyou', 'admin123456',
        'administrator', 'letmein12345', 'welcome12345', 'abc123456789', 'aaaaaaaaaaaa', 'p@ssw0rd1234', 'passw0rd1234', 'linelinelinel',
    ];

    private string $pepper;

    public function __construct(string $pepperB64)
    {
        $this->pepper = Crypto::decodeKey($pepperB64, 'keys.pepper');
    }

    public static function fromConfig(Config $c): self
    {
        return new self($c->str('keys.pepper'));
    }

    private function pre(string $pw): string
    {
        // bcrypt は 72 バイトで切れるので、先に HMAC して 44 文字にそろえる（日本語の長いパスワードでも、全部が効く）
        return base64_encode(hash_hmac('sha256', $pw, $this->pepper, true));
    }

    public function hash(string $pw): string
    {
        return password_hash($this->pre($pw), self::algo());
    }

    public function verify(string $pw, string $hash): bool
    {
        return password_verify($this->pre($pw), $hash);
    }

    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, self::algo());
    }

    /** 人が見つからないときも、同じくらい時間をかける（「その人がいるか」を、かかった時間で当てられないように） */
    public function dummyVerify(string $pw): void
    {
        static $dummy = null;
        $dummy ??= password_hash('dummy-' . bin2hex(random_bytes(8)), self::algo());
        password_verify($this->pre($pw), $dummy);
    }

    public static function algo(): string|int|null
    {
        return defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
    }

    /** 弱ければ、理由（日本語）。良ければ null */
    public static function policyError(string $pw, ?string $email = null): ?string
    {
        $len = mb_strlen($pw);
        if ($len < 12) {
            return 'パスワードは12文字以上にしてください（長い文が覚えやすく、強いです。例：「朝のピアノは3曲までと決めている」）';
        }
        if ($len > 128) {
            return 'パスワードは128文字までにしてください';
        }
        if (preg_match('/^(.)\1+$/u', $pw)) {
            return '同じ文字の繰り返しは使えません';
        }
        $low = mb_strtolower($pw);
        foreach (self::COMMON as $c) {
            if ($low === $c || str_contains($low, $c)) {
                return 'よく使われていて、当てられやすいパスワードです。別のものにしてください';
            }
        }
        if ($email) {
            $local = mb_strtolower((string) strstr($email, '@', true));
            if (mb_strlen($local) >= 4 && str_contains($low, $local)) {
                return 'メールアドレスの一部を含むパスワードは使えません';
            }
        }
        if (count(array_unique(mb_str_split($pw))) < 5) {
            return '使っている文字の種類が少なすぎます';
        }
        return null;
    }

    /** 仮パスワード（読み間違えやすい文字を除いた英数字。1回だけ画面に出す） */
    public static function generateTemp(int $len = 16): string
    {
        $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $out = '';
        $max = strlen($chars) - 1;
        for ($i = 0; $i < $len; $i++) {
            $out .= $chars[random_int(0, $max)];
        }
        return $out;
    }
}
