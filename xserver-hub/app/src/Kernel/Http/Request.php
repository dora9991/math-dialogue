<?php
declare(strict_types=1);

namespace Hub\Kernel\Http;

/** 受け取った HTTP リクエスト（PHP のグローバル変数から作る。テストでは直接作る） */
final class Request
{
    /** @var array<string,string> 名前は小文字 */
    public array $headers;

    /**
     * @param array<string,string> $headers
     * @param array<string,string> $query
     * @param array<string,string> $post
     * @param array<string,string> $cookies
     */
    public function __construct(
        public string $method,
        public string $path,
        array $headers = [],
        public string $body = '',
        public array $query = [],
        public array $post = [],
        public array $cookies = [],
        public string $ip = '',
        public bool $https = true,
    ) {
        $this->method = strtoupper($method);
        $this->headers = array_change_key_case($headers, CASE_LOWER);
    }

    public static function fromGlobals(string $basePath = '', int $maxBody = 1_000_000): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = (string) $v;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) {
            $headers['content-length'] = (string) $_SERVER['CONTENT_LENGTH'];
        }
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = (string) parse_url($uri, PHP_URL_PATH);
        if ($basePath !== '' && str_starts_with($path, $basePath)) {
            $path = substr($path, strlen($basePath)) ?: '/';
        }
        $path = '/' . ltrim(rawurldecode($path), '/');
        // 大きすぎる本文は読まない（読む前に、宣言された長さで断る。実際の長さも上限まで）
        $declared = (int) ($headers['content-length'] ?? 0);
        $body = '';
        if ($declared <= $maxBody) {
            $in = fopen('php://input', 'rb');
            if ($in !== false) {
                $body = (string) stream_get_contents($in, $maxBody + 1);
                fclose($in);
            }
        } else {
            $body = str_repeat(' ', $maxBody + 1); // 上限を超えた印（中身は使わない）
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443')
            || (strtolower($headers['x-forwarded-proto'] ?? '') === 'https');
        return new self(
            (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $path,
            $headers,
            $body,
            array_map('strval', array_filter($_GET, 'is_scalar')),
            array_map('strval', array_filter($_POST, 'is_scalar')),
            array_map('strval', array_filter($_COOKIE, 'is_scalar')),
            (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
            $https,
        );
    }

    public function header(string $name, string $default = ''): string
    {
        return $this->headers[strtolower($name)] ?? $default;
    }

    public function cookie(string $name): ?string
    {
        return $this->cookies[$name] ?? null;
    }

    /** JSON の本文（読めなければ null） */
    public function json(): mixed
    {
        if ($this->body === '') {
            return null;
        }
        try {
            return json_decode($this->body, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
    }

    public function isJson(): bool
    {
        return str_starts_with(strtolower(trim($this->header('content-type'))), 'application/json');
    }
}
