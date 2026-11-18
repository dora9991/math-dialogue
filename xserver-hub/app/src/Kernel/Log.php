<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 動作のログ（var/log/hub-YYYY-MM-DD.log。1行1件の JSON）。
 *
 *   ・秘密を書かない：token・secret・password・authorization などの名前の値は「***」にする
 *   ・メッセージの本文などの個人の情報は、呼び出し側で入れない（入れるのは、ID・件数・状態）
 *   ・ファイルは 600（自分だけ読める）。古いログは cleanup が消す（既定 90 日）
 *   ・書けなくても、処理は止めない（ログのせいで LINE の受信が失敗しないように）
 */
final class Log
{
    private const SECRET_KEYS = '/^(pass|passwd|authorization|cookie|api_?key|signature|totp|otp|code|link_code|private_key)$|(secret|token|password)$/i';

    /** @var list<array{level:string,msg:string,ctx:array}> テストで中身を見るため */
    public array $memory = [];

    public function __construct(private string $dir, private Clock $clock, private bool $echo = false, private bool $keepInMemory = false)
    {
    }

    public function info(string $msg, array $ctx = []): void
    {
        $this->write('info', $msg, $ctx);
    }

    public function warn(string $msg, array $ctx = []): void
    {
        $this->write('warn', $msg, $ctx);
    }

    public function error(string $msg, array $ctx = []): void
    {
        $this->write('error', $msg, $ctx);
    }

    public function write(string $level, string $msg, array $ctx = []): void
    {
        $ctx = self::redact($ctx);
        if ($this->keepInMemory) {
            $this->memory[] = ['level' => $level, 'msg' => $msg, 'ctx' => $ctx];
        }
        $line = Json::enc(['at' => Time::iso($this->clock->now()), 'level' => $level, 'msg' => $msg] + ($ctx ? ['ctx' => $ctx] : [])) . "\n";
        if ($this->echo) {
            fwrite(STDERR, $line);
        }
        if ($this->dir === '') {
            return;
        }
        try {
            if (!is_dir($this->dir)) {
                @mkdir($this->dir, 0700, true);
            }
            $file = $this->dir . '/hub-' . $this->clock->now()->format('Y-m-d') . '.log';
            $new = !is_file($file);
            @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
            if ($new) {
                @chmod($file, 0600);
            }
        } catch (\Throwable) {
            // ログが書けなくても、処理は続ける
        }
    }

    /** 秘密らしい名前の値を伏せる（入れ子も） */
    public static function redact(array $ctx): array
    {
        foreach ($ctx as $k => $v) {
            if (is_string($k) && preg_match(self::SECRET_KEYS, $k)) {
                $ctx[$k] = '***';
            } elseif (is_array($v)) {
                $ctx[$k] = self::redact($v);
            } elseif (is_string($v) && strlen($v) > 500) {
                $ctx[$k] = substr($v, 0, 500) . '…';
            }
        }
        return $ctx;
    }

    public function dir(): string
    {
        return $this->dir;
    }
}
