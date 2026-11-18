<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 設定（config/config.php が返す配列）。秘密（DB のパスワード・鍵・LINE のチャネルシークレット）もここに入る。
 *
 *   ・置き場所は公開フォルダの外（~/hub/config/config.php）。パーミッションは 600（自分だけ読める）。doctor が確かめる
 *   ・git には入れない（リポジトリにあるのは config.example.php だけ）
 *   ・値は「点でつないだ名前」で読む：$config->get('line.channel_secret')
 */
final class Config
{
    /** @param array<string,mixed> $data */
    public function __construct(private array $data, public readonly string $path = '')
    {
    }

    public static function load(?string $path = null): self
    {
        $path ??= (getenv('HUB_CONFIG') ?: \Hub\root() . '/config/config.php');
        if (!is_file($path)) {
            throw new \RuntimeException("設定ファイルがありません: {$path}（bin/hub init で作れます）");
        }
        $data = (static fn (string $p) => require $p)($path);
        if (!is_array($data)) {
            throw new \RuntimeException("設定ファイルが配列を返していません: {$path}");
        }
        return new self($data, $path);
    }

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self($data, '');
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $cur = $this->data;
        foreach (explode('.', $key) as $k) {
            if (!is_array($cur) || !array_key_exists($k, $cur)) {
                return $default;
            }
            $cur = $cur[$k];
        }
        return $cur;
    }

    /** 無い・空なら、何が足りないか分かる形で止める */
    public function need(string $key): mixed
    {
        $v = $this->get($key);
        if ($v === null || $v === '' || $v === []) {
            throw new \RuntimeException("設定 {$key} がありません（config.php を確かめてください）");
        }
        return $v;
    }

    public function str(string $key, string $default = ''): string
    {
        $v = $this->get($key, $default);
        return is_scalar($v) ? (string) $v : $default;
    }

    public function int(string $key, int $default = 0): int
    {
        $v = $this->get($key, $default);
        return is_numeric($v) ? (int) $v : $default;
    }

    public function bool(string $key, bool $default = false): bool
    {
        $v = $this->get($key, $default);
        return is_bool($v) ? $v : (bool) $v;
    }

    /** @return array<mixed> */
    public function arr(string $key): array
    {
        $v = $this->get($key, []);
        return is_array($v) ? $v : [];
    }

    public function isProduction(): bool
    {
        return $this->str('app.env', 'production') === 'production';
    }

    /** 公開の URL（末尾の / なし） */
    public function baseUrl(): string
    {
        return rtrim($this->str('app.base_url'), '/');
    }

    /** 公開 URL のホスト名（Host ヘッダーの確認に使う） */
    public function host(): string
    {
        return strtolower((string) parse_url($this->baseUrl(), PHP_URL_HOST));
    }

    /** @return array<string,mixed> テスト用：中身をそのまま返す */
    public function all(): array
    {
        return $this->data;
    }
}
