<?php
declare(strict_types=1);

namespace Hub\Kernel\Http;

use Hub\Kernel\Json;

/**
 * 返す HTTP の応答。安全のためのヘッダーは、どの応答にも付ける（send のとき）。
 *   ・HSTS（https だけで来てもらう）・nosniff・別のサイトの枠（iframe）に入れさせない・リファラーを送らない
 *   ・画面（HTML）には CSP（読み込んでよいものを、このサイトの中だけに絞る。インラインのスクリプトは使わない）
 */
final class Response
{
    /** @var array<string,string> */
    public array $headers = [];
    /** @var list<string> Set-Cookie */
    public array $cookies = [];

    public function __construct(public int $status = 200, public string $body = '', array $headers = [])
    {
        foreach ($headers as $k => $v) {
            $this->headers[strtolower($k)] = $v;
        }
    }

    public static function json(mixed $data, int $status = 200, array $headers = []): self
    {
        return new self($status, Json::enc($data), ['content-type' => 'application/json; charset=utf-8'] + $headers);
    }

    public static function text(string $body, int $status = 200, array $headers = []): self
    {
        return new self($status, $body, ['content-type' => 'text/plain; charset=utf-8'] + $headers);
    }

    public static function html(string $body, int $status = 200, array $headers = []): self
    {
        return new self($status, $body, ['content-type' => 'text/html; charset=utf-8'] + $headers);
    }

    public static function redirect(string $to, int $status = 303): self
    {
        return new self($status, '', ['location' => $to]);
    }

    public function header(string $name, string $value): self
    {
        $this->headers[strtolower($name)] = $value;
        return $this;
    }

    /**
     * クッキー。__Host- で始まる名前は「このホストだけ・https だけ・パス /」をブラウザに守らせる
     */
    public function cookie(string $name, string $value, int $maxAge, bool $secure = true): self
    {
        $parts = [rawurlencode($name) . '=' . rawurlencode($value), 'Path=/', 'HttpOnly', 'SameSite=Strict'];
        if ($secure) {
            $parts[] = 'Secure';
        }
        $parts[] = $maxAge > 0 ? 'Max-Age=' . $maxAge : 'Max-Age=0';
        $this->cookies[] = implode('; ', $parts);
        return $this;
    }

    /** 安全のためのヘッダー（すでに決めてあるものは上書きしない） */
    public function withSecurityHeaders(bool $https = true): self
    {
        $h = [
            'x-content-type-options' => 'nosniff',
            'x-frame-options' => 'DENY',
            'referrer-policy' => 'no-referrer',
            'cross-origin-opener-policy' => 'same-origin',
            'cross-origin-resource-policy' => 'same-origin',
            'permissions-policy' => 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
            'cache-control' => 'no-store',
        ];
        if ($https) {
            $h['strict-transport-security'] = 'max-age=31536000';
        }
        if (str_starts_with($this->headers['content-type'] ?? '', 'text/html')) {
            $h['content-security-policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
                . "img-src 'self' data: https://profile.line-scdn.net https://*.line-scdn.net; connect-src 'self'; "
                . "font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
        }
        foreach ($h as $k => $v) {
            $this->headers[$k] ??= $v;
        }
        return $this;
    }

    public function send(): void
    {
        http_response_code($this->status);
        header_remove('X-Powered-By');
        foreach ($this->headers as $k => $v) {
            header($k . ': ' . $v);
        }
        foreach ($this->cookies as $c) {
            header('Set-Cookie: ' . $c, false);
        }
        echo $this->body;
    }
}
