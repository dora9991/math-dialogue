<?php
declare(strict_types=1);

namespace Hub\Kernel;

use Hub\Line\LineApi;
use Hub\Line\LineClient;
use Hub\Member\Adapter;
use Hub\Member\NullAdapter;
use Hub\Member\SiteAdapter;

/**
 * ハブの部品の入れ物。必要になったときに作る（Web の1回のリクエストで、使わない部品は作らない）。
 * エンジンの関数は、この App を受け取って、DB・LINE・時計・ログを使う（JavaScript 版の ctx に当たる）。
 */
final class App
{
    private ?Db $db = null;
    private ?Log $log = null;
    private ?Crypto $crypto = null;
    private ?Kv $kv = null;
    private ?Lease $lease = null;
    private ?RateLimiter $limiter = null;
    private ?Audit $audit = null;
    private ?Mailer $mailer = null;
    private ?Alerts $alerts = null;
    private ?Password $password = null;
    private ?LineApi $line = null;
    private ?Adapter $adapter = null;
    /** @var array<string,mixed> 1回の処理の中だけの覚え書き（設定の読み込みなど） */
    public array $memo = [];

    public function __construct(public Config $config, public Clock $clock = new Clock())
    {
    }

    public function root(): string
    {
        return \Hub\root();
    }

    /** ログ・バックアップなどの置き場（~/hub/var） */
    public function varDir(string $sub = ''): string
    {
        $base = rtrim($this->config->str('app.var_dir', $this->root() . '/var'), '/');
        return $sub === '' ? $base : $base . '/' . $sub;
    }

    public function db(): Db
    {
        return $this->db ??= Db::connect([
            'host' => $this->config->str('db.host', 'localhost'),
            'port' => $this->config->int('db.port', 3306),
            'name' => $this->config->str('db.name'),
            'user' => $this->config->str('db.user'),
            'pass' => $this->config->str('db.pass'),
            'socket' => $this->config->str('db.socket'),
        ]);
    }

    public function setDb(Db $db): void
    {
        $this->db = $db;
    }

    public function log(): Log
    {
        return $this->log ??= new Log($this->varDir('log'), $this->clock, PHP_SAPI === 'cli' && $this->config->bool('app.log_to_stderr'));
    }

    public function setLog(Log $log): void
    {
        $this->log = $log;
    }

    public function crypto(): Crypto
    {
        return $this->crypto ??= Crypto::fromConfig($this->config);
    }

    public function kv(): Kv
    {
        return $this->kv ??= new Kv($this->db(), $this->clock);
    }

    public function lease(): Lease
    {
        return $this->lease ??= new Lease($this->db(), $this->clock);
    }

    public function limiter(): RateLimiter
    {
        return $this->limiter ??= new RateLimiter($this->db(), $this->clock);
    }

    public function audit(): Audit
    {
        return $this->audit ??= new Audit($this->db(), $this->clock, $this->log());
    }

    public function mailer(): Mailer
    {
        return $this->mailer ??= new Mailer($this->config->str('alert.from'), $this->config->bool('alert.dry_run'));
    }

    public function setMailer(Mailer $m): void
    {
        $this->mailer = $m;
    }

    public function alerts(): Alerts
    {
        return $this->alerts ??= new Alerts($this->db(), $this->clock, $this->mailer(), $this->log(), $this->config->str('alert.to'), $this->appName());
    }

    public function password(): Password
    {
        return $this->password ??= Password::fromConfig($this->config);
    }

    /** LINE Messaging API（テストでは偽物に差し替える） */
    public function line(): LineApi
    {
        return $this->line ??= new LineClient(
            $this->config->str('line.channel_id'),
            $this->config->str('line.channel_secret'),
            $this->config->str('line.access_token'),
            $this->config->str('line.api_base', 'https://api.line.me'),
            $this,
        );
    }

    public function setLine(LineApi $line): void
    {
        $this->line = $line;
    }

    /** 会員サイトとの連携（設定 member.enabled が true のとき。無ければ「連携なし」） */
    public function adapter(): Adapter
    {
        return $this->adapter ??= ($this->config->bool('member.enabled') ? new SiteAdapter() : new NullAdapter());
    }

    public function setAdapter(Adapter $a): void
    {
        $this->adapter = $a;
    }

    public function now(): \DateTimeImmutable
    {
        return $this->clock->now();
    }

    public function appName(): string
    {
        return $this->config->str('app.name', 'LINE配信ハブ');
    }
}
