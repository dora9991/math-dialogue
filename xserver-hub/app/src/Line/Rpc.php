<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Admin\Members;
use Hub\Kernel\App;
use Hub\Kernel\Json;
use Hub\Kernel\Text;
use Hub\Kernel\Time;

/**
 * 管理 API（RPC。line-hub の admin-rpc.js）。管理画面から { action, params } で呼ぶ。
 * HTTP の入口（Web\AdminController）が「ログイン済み・二段階認証済み・CSRF の確認済み」を確かめてから、ここを呼ぶ。
 *
 *   ・アクション名の許可リスト（これ以外は呼べない）
 *   ・入力の検証（型・長さ・範囲。日本語のエラーを返す）
 *   ・書き込みの操作は、操作の記録（hub_audit_log）に残す。個人の情報を見る操作（友だちの詳細・トーク）は、閲覧の記録に残す
 *   ・権限：操作ごとに要る権限（perm）。役割（owner・admin・operator・viewer）で、できることを分ける
 */
final class Rpc
{
    public const SETTING_SPEC = [
        'enabled' => ['type' => 'bool'],
        'dry_run' => ['type' => 'bool'],
        'monthly_cap' => ['type' => 'int', 'min' => 0, 'max' => 10_000_000],
        'notification_reserve' => ['type' => 'int', 'min' => 0, 'max' => 10_000_000],
        'timezone_offset_min' => ['type' => 'int', 'min' => -720, 'max' => 840],
        'admin_user_ids' => ['type' => 'strings', 'maxItems' => 20, 'maxLen' => 64],
        'brand_name' => ['type' => 'text', 'max' => 60],
        'site_url' => ['type' => 'https'],
        'max_attempts' => ['type' => 'int', 'min' => 1, 'max' => 20],
        'reply_overflow_push' => ['type' => 'bool'],
        'reminder_max_late_minutes' => ['type' => 'int', 'min' => 0, 'max' => 1440],
        'log_retention_days' => ['type' => 'int', 'min' => 1, 'max' => 365],
        'genie_notify_enabled' => ['type' => 'bool'],
        'notify_admins_on_follow' => ['type' => 'bool'],
        'notify_admins_on_message' => ['type' => 'bool'],
        'chat_retention_days' => ['type' => 'int', 'min' => 7, 'max' => 3650],
        'plan_limits' => ['type' => 'limits'],
    ];

    /** @var array<string,array{perm?:string,write?:bool,run:callable,summary?:callable,access?:callable}> */
    private array $actions;

    public function __construct(private App $app)
    {
        $this->actions = $this->define();
    }

    /** @return list<string> */
    public function actionNames(): array
    {
        return array_keys($this->actions);
    }

    public function isWrite(string $action): bool
    {
        return !empty($this->actions[$action]['write']);
    }

    public function permOf(string $action): ?string
    {
        return isset($this->actions[$action]) ? ($this->actions[$action]['perm'] ?? 'read') : null;
    }

    // ---- 入力の検証 ----
    private static function bad(string $m): RpcError
    {
        return new RpcError('bad_request', $m, 400);
    }

    private static function str(array $p, string $key, string $label = '', int $min = 1, int $max = 200, bool $optional = false): ?string
    {
        $label = $label ?: $key;
        $v = $p[$key] ?? null;
        if ($v === null || $v === '') {
            if ($optional) {
                return null;
            }
            throw self::bad("{$label}が必要です"); // 空の文字も「無い」と同じ（JavaScript 版と同じ）
        }
        if (!is_string($v)) {
            throw self::bad("{$label}は文字列で指定してください");
        }
        $n = mb_strlen($v);
        if ($n < $min || $n > $max) {
            throw self::bad("{$label}は {$min}〜{$max} 文字にしてください");
        }
        return $v;
    }

    private static function int(array $p, string $key, string $label = '', int $min = 0, int $max = 2_147_483_647, bool $optional = false, ?int $def = null): ?int
    {
        $label = $label ?: $key;
        $v = $p[$key] ?? null;
        if ($v === null || $v === '') {
            if ($def !== null) {
                return $def;
            }
            if ($optional) {
                return null;
            }
            throw self::bad("{$label}が必要です");
        }
        if (is_string($v) && preg_match('/^-?\d+$/', $v)) {
            $v = (int) $v;
        }
        if (is_float($v) && floor($v) === $v) {
            $v = (int) $v;
        }
        if (!is_int($v) || $v < $min || $v > $max) {
            throw self::bad("{$label}は {$min}〜{$max} の整数にしてください");
        }
        return $v;
    }

    private static function bool(array $p, string $key, string $label = ''): bool
    {
        if (!is_bool($p[$key] ?? null)) {
            throw self::bad(($label ?: $key) . 'は true / false で指定してください');
        }
        return $p[$key];
    }

    private static function obj(array $p, string $key, string $label = '', bool $optional = false): array
    {
        $label = $label ?: $key;
        $v = $p[$key] ?? null;
        if ($v === null) {
            if ($optional) {
                return [];
            }
            throw self::bad("{$label}が必要です");
        }
        if (!Json::isObjLike($v)) {
            throw self::bad("{$label}はオブジェクトで指定してください");
        }
        if (strlen(Json::enc($v)) > 100_000) {
            throw self::bad("{$label}が大きすぎます");
        }
        return $v;
    }

    private static function when(array $p, string $key, string $label = '', bool $optional = false): ?string
    {
        $label = $label ?: $key;
        $v = $p[$key] ?? null;
        if ($v === null || $v === '') {
            if ($optional) {
                return null;
            }
            throw self::bad("{$label}が必要です");
        }
        $d = is_string($v) ? Time::tryParse($v) : null;
        if ($d === null) {
            throw self::bad("{$label}は日時（例：2026-11-10T20:00:00+09:00）で指定してください");
        }
        return Time::iso($d);
    }

    private static function uuid(array $p, string $key, string $label): string
    {
        $v = self::str($p, $key, $label, 1, 36);
        if (!Text::isUuid($v)) {
            throw self::bad("{$label}の形が違います");
        }
        return $v;
    }

    private static function userId(array $p, string $key = 'userId'): string
    {
        return (string) self::str($p, $key, 'userId', 1, 64);
    }

    private static function head(mixed $s, int $n = 40): mixed
    {
        return is_string($s) ? Text::head($s, $n) : $s;
    }

    private static function clip(mixed $v, int $n = 120): mixed
    {
        if (is_string($v)) {
            return Text::head($v, $n);
        }
        if (is_array($v)) {
            $out = [];
            $i = 0;
            foreach ($v as $k => $x) {
                if (++$i > (array_is_list($v) ? 20 : 30)) {
                    break;
                }
                $out[$k] = self::clip($x, $n);
            }
            return $out;
        }
        return $v;
    }

    public static function checkSettingValue(string $key, mixed $v): mixed
    {
        $spec = self::SETTING_SPEC[$key] ?? null;
        if (!$spec) {
            throw self::bad("未知の設定です: {$key}");
        }
        switch ($spec['type']) {
            case 'bool':
                if (!is_bool($v)) {
                    throw self::bad("{$key} は true / false で指定してください");
                }
                return $v;
            case 'int':
                if (!is_int($v) || $v < $spec['min'] || $v > $spec['max']) {
                    throw self::bad("{$key} は {$spec['min']}〜{$spec['max']} の整数にしてください");
                }
                return $v;
            case 'text':
                if (!is_string($v) || mb_strlen($v) > $spec['max']) {
                    throw self::bad("{$key} は {$spec['max']} 文字までの文字列にしてください");
                }
                return $v;
            case 'https':
                if (!is_string($v) || strlen($v) > 200) {
                    throw self::bad("{$key} は https:// から始まる URL（200文字まで）か、空にしてください");
                }
                if ($v === '') {
                    return $v;
                }
                if (strtolower((string) parse_url($v, PHP_URL_SCHEME)) !== 'https' || !parse_url($v, PHP_URL_HOST)) {
                    throw self::bad("{$key} は https:// から始まる URL か、空にしてください");
                }
                return rtrim($v, '/');
            case 'strings':
                if (!is_array($v) || !array_is_list($v) || count($v) > $spec['maxItems']) {
                    throw self::bad("{$key} は文字列の配列（{$spec['maxItems']}件まで）にしてください");
                }
                foreach ($v as $x) {
                    if (!is_string($x) || $x === '' || strlen($x) > $spec['maxLen']) {
                        throw self::bad("{$key} は文字列の配列（{$spec['maxItems']}件まで）にしてください");
                    }
                }
                return $v;
            case 'limits':
                try {
                    return Limits::check($v);
                } catch (\InvalidArgumentException $e) {
                    throw self::bad($e->getMessage());
                }
        }
        throw self::bad("未知の設定です: {$key}");
    }

    /** チャット・テスト送信のあと：プッシュなら、毎分の処理を待たずに、すぐ送る（取れなければ、まもなく送られる） */
    private function sendNow(array $r): array
    {
        if (empty($r['ok']) || empty($r['outboxId'])) {
            return $r;
        }
        try {
            $this->app->lease()->with('tick', 120, fn () => Outbox::dispatch($this->app));
        } catch (\Throwable $e) {
            $this->app->log()->error('送信のあとの送信処理に失敗しました', ['error' => $e->getMessage()]);
        }
        $row = $this->app->db()->one('SELECT status, last_error FROM line_outbox WHERE id = ?', [$r['outboxId']]);
        return $r + ['status' => $row['status'] ?? null, 'error' => $row['last_error'] ?? null];
    }

    private function define(): array
    {
        $app = $this->app;
        return [
            // ---- 全体 ----
            'me' => ['run' => function (array $p, array $who) {
                $role = $who['role'] ?? 'viewer';
                return ['user' => $who, 'role' => $role, 'roleLabel' => Members::ROLE_LABEL[$role] ?? $role, 'perms' => Members::ROLE_PERMS[$role] ?? [], 'mustChangePassword' => false, 'adminMode' => 'table'];
            }],
            'account.passwordChanged' => [
                'perm' => 'read', 'write' => true,
                'run' => function (array $p, array $who) use ($app) {
                    $m = Members::get($app, (string) ($who['id'] ?? ''));
                    return ['ok' => $m !== null && !$m['must_change_password']];
                },
                'summary' => fn ($p, $r) => ['ok' => $r['ok'] ?? null],
            ],
            'meta' => ['run' => fn () => [
                'adapter' => $app->adapter()->name(),
                'plans' => $app->adapter()->plans($app),
                'now' => Time::iso($app->now()),
                'adminMode' => 'table',
                'limits' => Limits::summary($app),
                'roles' => array_map(fn ($r) => ['role' => $r, 'label' => Members::ROLE_LABEL[$r], 'perms' => Members::ROLE_PERMS[$r]], Members::ROLES),
                'permLabels' => Members::PERM_LABEL,
            ]],
            'dashboard' => ['run' => fn () => AdminOps::dashboard($app)],
            'line.quota' => ['run' => function () use ($app) {
                $c = $app->line()->quotaConsumption();
                $q = $app->line()->quota();
                if (!$c['ok'] || !is_int($c['body']['totalUsage'] ?? null)) {
                    return ['ok' => false, 'reason' => 'line_error', 'status' => $c['status'], 'message' => 'LINE に問い合わせできませんでした（' . ($c['status'] ?: ($c['error'] ?? '通信エラー')) . '）。しばらくしてから、もう一度お試しください'];
                }
                $ours = Outbox::usageSummary($app);
                return [
                    'ok' => true,
                    'line' => ['usage' => $c['body']['totalUsage'], 'limit' => $q['ok'] && is_array($q['body']) ? ['type' => $q['body']['type'] ?? null, 'value' => $q['body']['value'] ?? null] : null],
                    'ours' => ['ym' => $ours['ym'], 'sent' => $ours['sent'], 'dry_run' => $ours['dry_run']],
                    'diff' => $c['body']['totalUsage'] - $ours['sent'],
                    'match' => $c['body']['totalUsage'] === $ours['sent'],
                    'checkedAt' => Time::iso($app->now()),
                ];
            }],

            // ---- 友だち ----
            'friends.list' => ['run' => function (array $p) use ($app) {
                $status = isset($p['status']) && $p['status'] !== '' ? self::str($p, 'status', '', 1, 10) : null;
                if ($status !== null && !in_array($status, ['active', 'blocked'], true)) {
                    throw self::bad('status は active か blocked です');
                }
                return AdminOps::listFriends(
                    $app,
                    !empty($p['q']) ? self::str($p, 'q', '', 1, 100) : null,
                    !empty($p['tag']) ? self::str($p, 'tag', '', 1, 100) : null,
                    $status,
                    (int) self::int($p, 'limit', '', 1, 500, def: 100),
                    (int) self::int($p, 'offset', '', 0, 1_000_000, def: 0),
                );
            }],
            'friends.get' => [
                'run' => function (array $p) use ($app) {
                    $r = AdminOps::getFriend($app, self::userId($p));
                    if (!$r) {
                        throw new RpcError('not_found', '友だちが見つかりません', 404);
                    }
                    return $r;
                },
                'access' => fn ($p) => is_string($p['userId'] ?? null) ? $p['userId'] : null,
            ],
            'tags.list' => ['run' => fn () => AdminOps::listTags($app)],
            'tags.add' => [
                'perm' => 'friends', 'write' => true,
                'run' => fn (array $p) => Rules::applyTag($app, self::userId($p), (string) self::str($p, 'tag', 'タグ', 1, 50)),
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'tag' => $p['tag'] ?? null],
            ],
            'tags.remove' => [
                'perm' => 'friends', 'write' => true,
                'run' => fn (array $p) => Rules::removeTag($app, self::userId($p), (string) self::str($p, 'tag', 'タグ', 1, 50)),
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'tag' => $p['tag'] ?? null],
            ],
            'fields.set' => [
                'perm' => 'friends', 'write' => true,
                'run' => function (array $p) use ($app) {
                    Friends::setField($app, self::userId($p), self::str($p, 'key', '項目名', 1, 50), self::str($p, 'value', '値', 0, 500));
                    return null;
                },
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'key' => $p['key'] ?? null],
            ],

            // ---- ルール ----
            'rules.list' => ['run' => fn () => AdminOps::listRules($app)],
            'rules.save' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => AdminOps::saveRule($app, self::obj($p, 'rule', 'ルール')),
                'summary' => fn ($p, $r) => ['id' => $r['id'] ?? ($p['rule']['id'] ?? null), 'name' => $p['rule']['name'] ?? null, 'trigger' => $p['rule']['trigger_type'] ?? ($p['rule']['trigger'] ?? null)],
            ],
            'rules.setEnabled' => [
                'perm' => 'edit', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $app->db()->exec('UPDATE line_rules SET enabled = ? WHERE id = ?', [self::bool($p, 'enabled'), self::int($p, 'id', '', 1)]);
                    return null;
                },
                'summary' => fn ($p) => ['id' => $p['id'] ?? null, 'enabled' => $p['enabled'] ?? null],
            ],
            'rules.delete' => [
                'perm' => 'edit', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $app->db()->exec('DELETE FROM line_rules WHERE id = ?', [self::int($p, 'id', '', 1)]);
                    return null;
                },
                'summary' => fn ($p) => ['id' => $p['id'] ?? null],
            ],

            // ---- シナリオ ----
            'scenarios.list' => ['run' => fn () => AdminOps::listScenarios($app)],
            'scenarios.save' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => AdminOps::saveScenario($app, self::obj($p, 'scenario', 'シナリオ')),
                'summary' => fn ($p) => ['name' => $p['scenario']['name'] ?? null, 'steps' => is_array($p['scenario']['steps'] ?? null) ? count($p['scenario']['steps']) : null],
            ],
            'scenarios.setEnabled' => [
                'perm' => 'edit', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $app->db()->exec('UPDATE line_scenarios SET enabled = ? WHERE id = ?', [self::bool($p, 'enabled'), self::int($p, 'id', '', 1)]);
                    return null;
                },
                'summary' => fn ($p) => ['id' => $p['id'] ?? null, 'enabled' => $p['enabled'] ?? null],
            ],
            'scenarios.estimateEnroll' => ['run' => fn (array $p) => AdminOps::estimateEnroll($app, (string) self::str($p, 'name', 'ステップ配信の名前', 1, 100), self::obj($p, 'audience', '対象の条件', true))],
            'scenarios.enrollAudience' => [
                'perm' => 'send', 'write' => true,
                'run' => fn (array $p) => Scenarios::enrollAudience($app, (string) self::str($p, 'name', 'ステップ配信の名前', 1, 100), self::obj($p, 'audience', '対象の条件', true), self::int($p, 'expected', '確かめた人数', 0)),
                'summary' => fn ($p, $r) => ['name' => $p['name'] ?? null, 'audience' => $p['audience'] ?? null, 'expected' => $p['expected'] ?? null, 'ok' => $r['ok'] ?? null, 'enrolled' => $r['enrolled'] ?? null, 'reason' => $r['reason'] ?? null],
            ],

            // ---- イベント ----
            'events.list' => ['run' => fn () => AdminOps::listEvents($app)],
            'events.save' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Events::upsert($app, self::obj($p, 'event', 'イベント')),
                'summary' => fn ($p) => ['key' => $p['event']['key'] ?? null, 'title' => $p['event']['title'] ?? null, 'startsAt' => $p['event']['startsAt'] ?? null],
            ],
            'events.createSeries' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Events::createSeries($app, self::obj($p, 'series', 'まとめて作る日程')),
                'summary' => fn ($p, $r) => ['keyPrefix' => $p['series']['keyPrefix'] ?? null, 'weekdays' => $p['series']['weekdays'] ?? null, 'time' => $p['series']['time'] ?? null, 'from' => $p['series']['from'] ?? null, 'to' => $p['series']['to'] ?? null, 'created' => isset($r['created']) ? count($r['created']) : null],
            ],
            'events.reschedule' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Events::reschedule($app, (string) self::str($p, 'key', 'イベントのキー', 1, 80), (string) self::when($p, 'startsAt', '開始日時')),
                'summary' => fn ($p) => ['key' => $p['key'] ?? null, 'startsAt' => $p['startsAt'] ?? null],
            ],
            'events.participants' => ['run' => fn (array $p) => Events::participants($app, (string) self::str($p, 'key', 'イベントのキー', 1, 80))],
            'events.cancelApplication' => [
                'perm' => 'friends', 'write' => true,
                'run' => fn (array $p) => Events::cancelApplication($app, self::userId($p), (string) self::str($p, 'key', 'イベントのキー', 1, 80)),
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'key' => $p['key'] ?? null],
            ],
            'events.attendance' => ['run' => fn (array $p) => Zoom::attendance($app, (string) self::str($p, 'key', 'イベントのキー', 1, 80))],
            'events.finalizeAttendance' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Zoom::finalize($app, (string) self::str($p, 'key', 'イベントのキー', 1, 80), true),
                'summary' => fn ($p, $r) => ['key' => $p['key'] ?? null, 'attended' => $r['attended'] ?? null, 'absent' => $r['absent'] ?? null],
            ],
            'events.linkZoomParticipant' => [
                'perm' => 'friends', 'write' => true,
                'run' => fn (array $p) => Zoom::linkParticipant($app, (string) self::str($p, 'key', 'イベントのキー', 1, 80), (string) self::str($p, 'participantKey', '参加者の鍵', 1, 300), self::userId($p)),
                'summary' => fn ($p) => ['key' => $p['key'] ?? null, 'participantKey' => $p['participantKey'] ?? null, 'userId' => $p['userId'] ?? null],
            ],

            // ---- 一斉配信 ----
            'broadcasts.list' => ['run' => fn () => AdminOps::listBroadcasts($app)],
            'broadcasts.estimate' => ['run' => fn (array $p) => Broadcasts::estimate($app, self::obj($p, 'audience', '宛先の条件', true))],
            'broadcasts.create' => [
                'perm' => 'send', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $messages = array_key_exists('messages', $p) ? $p['messages'] : [self::str($p, 'text', '本文', 1, 5000)];
                    if (!is_array($messages) || !array_is_list($messages) || count($messages) < 1 || count($messages) > 5) {
                        throw self::bad('メッセージは1〜5件にしてください');
                    }
                    return AdminOps::createBroadcast($app, (string) self::str($p, 'name', '配信名', 1, 100), self::obj($p, 'audience', '宛先の条件', true), $messages, self::when($p, 'scheduledAt', '予約日時', true));
                },
                'summary' => fn ($p, $r) => ['id' => $r['id'] ?? null, 'name' => $p['name'] ?? null, 'audience' => $p['audience'] ?? null, 'text' => self::head($p['text'] ?? ($p['messages'][0]['text'] ?? ($p['messages'][0] ?? null)), 80), 'scheduledAt' => $p['scheduledAt'] ?? null],
            ],
            'broadcasts.send' => [
                'perm' => 'send', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $id = (int) self::int($p, 'id', '', 1);
                    $expected = self::int($p, 'expectedRecipients', '', 0, optional: true);
                    if ($expected !== null) {
                        // 画面で確認した人数と、送る時点の人数が違うなら、送らない
                        $b = $app->db()->one('SELECT audience FROM line_broadcasts WHERE id = ?', [$id], json: ['audience']);
                        if (!$b) {
                            throw new RpcError('not_found', '配信が見つかりません', 404);
                        }
                        $app->adapter()->refreshAll($app);
                        $est = Broadcasts::estimate($app, $b['audience']);
                        if ($est['recipients'] !== $expected) {
                            return ['ok' => false, 'reason' => 'recipients_changed', 'expected' => $expected, 'actual' => $est['recipients'], 'message' => "宛先が {$expected}人 から {$est['recipients']}人 に変わりました。もう一度、人数を確認してから送ってください"];
                        }
                    }
                    return Broadcasts::send($app, $id);
                },
                'summary' => fn ($p, $r) => ['id' => $p['id'] ?? null, 'expectedRecipients' => $p['expectedRecipients'] ?? null, 'ok' => $r['ok'] ?? null, 'recipients' => $r['recipients'] ?? null, 'reason' => $r['reason'] ?? null],
            ],
            'broadcasts.cancel' => [
                'perm' => 'send', 'write' => true,
                'run' => fn (array $p) => Broadcasts::cancel($app, (int) self::int($p, 'id', '', 1)),
                'summary' => fn ($p, $r) => ['id' => $p['id'] ?? null, 'ok' => $r['ok'] ?? null],
            ],

            // ---- 送信キュー ----
            'outbox.list' => ['run' => function (array $p) use ($app) {
                $status = !empty($p['status']) ? self::str($p, 'status', '', 1, 12) : null;
                if ($status !== null && !in_array($status, ['queued', 'sending', 'sent', 'failed', 'skipped', 'dry_run'], true)) {
                    throw self::bad('status が正しくありません');
                }
                return AdminOps::listOutbox($app, $status, (int) self::int($p, 'limit', '', 1, 200, def: 100));
            }],
            'outbox.search' => ['run' => function (array $p) use ($app) {
                $status = !empty($p['status']) ? self::str($p, 'status', '', 1, 12) : null;
                if ($status !== null && !in_array($status, ['queued', 'sending', 'sent', 'failed', 'skipped', 'dry_run'], true)) {
                    throw self::bad('status が正しくありません');
                }
                return AdminOps::searchOutbox(
                    $app,
                    $status,
                    !empty($p['source']) ? self::str($p, 'source', '種類', 1, 30) : null,
                    self::when($p, 'from', '期間の始まり', true),
                    self::when($p, 'to', '期間の終わり', true),
                    (int) self::int($p, 'limit', '', 1, 200, def: 50),
                    (int) self::int($p, 'offset', '', 0, 1_000_000, def: 0),
                );
            }],
            'outbox.cancel' => [
                'perm' => 'send', 'write' => true,
                'run' => fn (array $p) => AdminOps::cancelOutbox($app, self::uuid($p, 'id', '送信のID')),
                'summary' => fn ($p, $r) => ['id' => $p['id'] ?? null, 'ok' => $r['ok'] ?? null],
            ],
            'outbox.requeue' => [
                'perm' => 'send', 'write' => true,
                'run' => fn (array $p) => AdminOps::requeueOutbox($app, self::uuid($p, 'id', '送信のID')),
                'summary' => fn ($p, $r) => ['id' => $p['id'] ?? null, 'ok' => $r['ok'] ?? null],
            ],
            'testSend' => [
                'perm' => 'send', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $to = (string) self::str($p, 'to', '宛先', 1, 64);
                    $messages = null;
                    if (array_key_exists('messages', $p)) {
                        if (!is_array($p['messages']) || !array_is_list($p['messages']) || count($p['messages']) < 1 || count($p['messages']) > 5) {
                            throw self::bad('メッセージは1〜5件にしてください');
                        }
                        if (strlen(Json::enc($p['messages'])) > 30_000) {
                            throw self::bad('メッセージが大きすぎます');
                        }
                        $messages = $p['messages'];
                    }
                    $r = AdminOps::testSend($app, $to, $messages !== null ? null : self::str($p, 'text', '本文', 1, 1000), $messages);
                    return $this->sendNow($r);
                },
                'summary' => fn ($p, $r) => ['to' => ($p['to'] ?? null) === 'admins' ? 'admins' : 'userId', 'text' => self::head($p['text'] ?? (is_string($p['messages'][0] ?? null) ? $p['messages'][0] : ($p['messages'][0]['text'] ?? null))), 'bubbles' => is_array($p['messages'] ?? null) ? count($p['messages']) : 1, 'ok' => $r['ok'] ?? null, 'status' => $r['status'] ?? null],
            ],

            // ---- 設定 ----
            'settings.get' => ['run' => fn () => Settings::forOutput(Settings::get($app))],
            'settings.update' => [
                'perm' => 'settings', 'write' => true,
                'run' => function (array $p, array $who) use ($app) {
                    $patch = self::obj($p, 'patch', '設定');
                    if (array_key_exists('plan_limits', $patch) && !Members::can($who['role'] ?? null, 'members')) {
                        throw new RpcError('forbidden', '使える数の上限（plan_limits）は、オーナーだけが変えられます', 403);
                    }
                    $clean = [];
                    foreach ($patch as $k => $v) {
                        $clean[(string) $k] = self::checkSettingValue((string) $k, $v);
                    }
                    if (!$clean) {
                        throw self::bad('変更する設定がありません');
                    }
                    $merged = array_merge(Settings::get($app), $clean);
                    if ($merged['notification_reserve'] > $merged['monthly_cap']) {
                        throw self::bad('会員通知の取り置き（notification_reserve）は、月間の上限（monthly_cap）以下にしてください');
                    }
                    Settings::set($app, $clean);
                    return ['ok' => true];
                },
                'summary' => fn ($p) => ['patch' => $p['patch'] ?? null],
            ],

            // ---- 個別チャット ----
            'chat.rooms' => ['run' => function (array $p) use ($app) {
                $filter = !empty($p['filter']) ? (string) self::str($p, 'filter', '', 1, 20) : '';
                if ($filter !== '' && !in_array($filter, ['unread', 'needs_reply'], true)) {
                    throw self::bad('filter は unread か needs_reply です');
                }
                return Chat::listRooms($app, !empty($p['q']) ? self::str($p, 'q', '', 1, 100) : null, $filter, (int) self::int($p, 'limit', '', 1, 300, def: 100), (int) self::int($p, 'offset', '', 0, 1_000_000, def: 0));
            }],
            'chat.thread' => [
                'run' => function (array $p) use ($app) {
                    $r = Chat::thread($app, self::userId($p), self::int($p, 'before', '', 1, optional: true), (int) self::int($p, 'limit', '', 1, 200, def: 50));
                    if (!$r) {
                        throw new RpcError('not_found', '友だちが見つかりません', 404);
                    }
                    return $r;
                },
                'access' => fn ($p) => is_string($p['userId'] ?? null) ? $p['userId'] : null,
            ],
            'chat.summary' => ['run' => fn (array $p) => Chat::summary($app, self::int($p, 'sinceId', '', 0, optional: true))],
            'chat.markRead' => ['perm' => 'chat', 'run' => fn (array $p, array $who) => Chat::markRead($app, self::userId($p), $who['email'] ?? null)],
            'chat.setNeedsReply' => [
                'perm' => 'chat', 'write' => true,
                'run' => function (array $p) use ($app) {
                    Chat::setNeedsReply($app, self::userId($p), self::bool($p, 'value', '要対応'));
                    return ['ok' => true];
                },
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'value' => $p['value'] ?? null],
            ],
            'chat.send' => [
                'perm' => 'chat', 'write' => true,
                'run' => fn (array $p, array $who) => $this->sendNow(Chat::send($app, self::userId($p), [['type' => 'text', 'text' => (string) self::str($p, 'text', '本文', 1, 5000)]], $who['email'] ?? null)),
                'summary' => fn ($p, $r) => ['userId' => $p['userId'] ?? null, 'chars' => is_string($p['text'] ?? null) ? mb_strlen($p['text']) : null, 'via' => $r['via'] ?? null, 'ok' => $r['ok'] ?? null, 'reason' => $r['reason'] ?? null],
            ],
            'chat.sendSpecial' => [
                'perm' => 'chat', 'write' => true,
                'run' => function (array $p, array $who) use ($app) {
                    $kind = (string) self::str($p, 'kind', '種類', 1, 20);
                    if (!in_array($kind, ['survey', 'video_offer'], true)) {
                        throw self::bad('種類は survey か video_offer です');
                    }
                    return $this->sendNow(AdminOps::chatSendSpecial($app, self::userId($p), $kind, (string) self::str($p, 'ref', '名前', 1, 100), $who['email'] ?? null));
                },
                'summary' => fn ($p, $r) => ['userId' => $p['userId'] ?? null, 'kind' => $p['kind'] ?? null, 'ref' => $p['ref'] ?? null, 'via' => $r['via'] ?? null, 'ok' => $r['ok'] ?? null],
            ],

            // ---- 属性 ----
            'attributes.list' => ['run' => fn () => Attributes::stats($app)],
            'attributes.groups' => ['run' => fn () => Attributes::listGroups($app)],
            'attributes.save' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Attributes::saveGroup($app, self::obj($p, 'attribute', '属性')),
                'summary' => fn ($p) => ['name' => $p['attribute']['name'] ?? null, 'choices' => is_array($p['attribute']['choices'] ?? null) ? count($p['attribute']['choices']) : null],
            ],
            'attributes.delete' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Attributes::deleteGroup($app, (string) self::str($p, 'name', '属性の名前', 1, 20)),
                'summary' => fn ($p) => ['name' => $p['name'] ?? null],
            ],
            'attributes.set' => [
                'perm' => 'friends', 'write' => true,
                'run' => fn (array $p) => AdminOps::setAttribute($app, self::userId($p), (string) self::str($p, 'group', '属性の名前', 1, 20), self::str($p, 'value', '値', 0, 20, true)),
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'group' => $p['group'] ?? null, 'value' => $p['value'] ?? null],
            ],

            // ---- アンケート ----
            'surveys.list' => ['run' => fn () => Surveys::list($app)],
            'surveys.results' => ['run' => function (array $p) use ($app) {
                $r = Surveys::results($app, (string) self::str($p, 'name', 'アンケートの名前', 1, 50));
                if (!$r) {
                    throw new RpcError('not_found', 'アンケートが見つかりません', 404);
                }
                return $r;
            }],
            'surveys.save' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => AdminOps::saveSurvey($app, self::obj($p, 'survey', 'アンケート')),
                'summary' => fn ($p) => ['name' => $p['survey']['name'] ?? null, 'questions' => is_array($p['survey']['questions'] ?? null) ? count($p['survey']['questions']) : null],
            ],
            'surveys.setEnabled' => [
                'perm' => 'edit', 'write' => true,
                'run' => function (array $p) use ($app) {
                    Surveys::setEnabled($app, (int) self::int($p, 'id', '', 1), self::bool($p, 'enabled'));
                    return null;
                },
                'summary' => fn ($p) => ['id' => $p['id'] ?? null, 'enabled' => $p['enabled'] ?? null],
            ],
            'surveys.delete' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Surveys::delete($app, (int) self::int($p, 'id', '', 1)),
                'summary' => fn ($p) => ['id' => $p['id'] ?? null],
            ],

            // ---- 動画特典 ----
            'videos.list' => ['run' => fn () => Videos::list($app)],
            'videos.viewers' => ['run' => function (array $p) use ($app) {
                $r = Videos::viewers($app, (string) self::str($p, 'key', 'キー', 1, 40));
                if (!$r) {
                    throw new RpcError('not_found', '動画特典が見つかりません', 404);
                }
                return $r;
            }],
            'videos.save' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => AdminOps::saveVideoOffer($app, self::obj($p, 'offer', '動画特典')),
                'summary' => fn ($p) => ['key' => $p['offer']['key'] ?? null, 'name' => $p['offer']['name'] ?? null, 'deadlineHours' => $p['offer']['deadlineHours'] ?? null],
            ],
            'videos.setEnabled' => [
                'perm' => 'edit', 'write' => true,
                'run' => function (array $p) use ($app) {
                    Videos::setEnabled($app, (int) self::int($p, 'id', '', 1), self::bool($p, 'enabled'));
                    return null;
                },
                'summary' => fn ($p) => ['id' => $p['id'] ?? null, 'enabled' => $p['enabled'] ?? null],
            ],

            // ---- ひな形 ----
            'templates.list' => ['run' => fn () => Templates::list()],
            'templates.preview' => ['run' => fn (array $p) => Templates::preview((string) self::str($p, 'key', 'ひな形', 1, 40))],
            'templates.apply' => [
                'perm' => 'edit', 'write' => true,
                'run' => fn (array $p) => Templates::apply($app, (string) self::str($p, 'key', 'ひな形', 1, 40)),
                'summary' => fn ($p, $r) => ['key' => $p['key'] ?? null, 'created' => isset($r['created']) ? array_map(fn ($x) => "{$x['kind']}:{$x['name']}", $r['created']) : null],
            ],

            // ---- 配信のカレンダー ----
            'calendar.range' => ['run' => function (array $p) use ($app) {
                $from = (string) self::when($p, 'from', '期間の始まり');
                $to = (string) self::when($p, 'to', '期間の終わり');
                $span = Time::ms(Time::parse($to)) - Time::ms(Time::parse($from));
                if ($span > 100 * 86_400_000 || $span <= 0) {
                    throw self::bad('期間は100日以内にしてください');
                }
                return AdminOps::calendar($app, $from, $to);
            }],

            // ---- 運営メンバー（オーナーだけ） ----
            'members.list' => ['perm' => 'members', 'run' => fn () => Members::list($app)],
            'members.add' => [
                'perm' => 'members', 'write' => true,
                'run' => function (array $p, array $who) use ($app) {
                    $role = (string) self::str($p, 'role', '役割', 1, 10);
                    if (!in_array($role, Members::ROLES, true)) {
                        throw self::bad('役割は ' . implode(' / ', Members::ROLES) . ' のどれかです');
                    }
                    Limits::assertWithin(Limits::get($app), 'max_members', (int) $app->db()->value('SELECT COUNT(*) FROM hub_admins') + 1);
                    return Members::add($app, (string) self::str($p, 'email', 'メールアドレス', 1, 200), $role, self::str($p, 'displayName', '名前', 1, 40, true), $who['email'] ?? null);
                },
                'summary' => fn ($p, $r) => ['email' => $p['email'] ?? null, 'role' => $p['role'] ?? null, 'created' => $r['created'] ?? null], // 仮パスワードは残さない
            ],
            'members.setRole' => [
                'perm' => 'members', 'write' => true,
                'run' => function (array $p) use ($app) {
                    $role = (string) self::str($p, 'role', '役割', 1, 10);
                    if (!in_array($role, Members::ROLES, true)) {
                        throw self::bad('役割は ' . implode(' / ', Members::ROLES) . ' のどれかです');
                    }
                    return Members::setRole($app, self::uuid($p, 'userId', '運営メンバー'), $role);
                },
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null, 'role' => $p['role'] ?? null],
            ],
            'members.remove' => [
                'perm' => 'members', 'write' => true,
                'run' => function (array $p, array $who) use ($app) {
                    $id = self::uuid($p, 'userId', '運営メンバー');
                    if ($id === ($who['id'] ?? null)) {
                        throw self::bad('自分自身は外せません（ほかのオーナーに頼んでください）');
                    }
                    return Members::remove($app, $id);
                },
                'summary' => fn ($p) => ['userId' => $p['userId'] ?? null],
            ],
            'members.resetPassword' => [
                'perm' => 'members', 'write' => true,
                'run' => fn (array $p) => Members::resetPassword($app, self::uuid($p, 'userId', '運営メンバー')),
                'summary' => fn ($p, $r) => ['userId' => $p['userId'] ?? null, 'ok' => $r['ok'] ?? null], // 仮パスワードは残さない
            ],

            // ---- 操作の記録 ----
            'audit.list' => ['run' => fn (array $p) => $app->audit()->list((int) self::int($p, 'limit', '', 1, 500, def: 100))],
        ];
    }

    /**
     * @param array{id:string,email:?string,role:string} $who ログインしている人
     */
    public function call(array $who, string $action, mixed $params, ?string $ip = null): mixed
    {
        $def = $this->actions[$action] ?? null;
        if (!$def) {
            throw new RpcError('unknown_action', '未対応の操作です: ' . mb_substr($action, 0, 60), 404);
        }
        if (!Json::isObjLike($params)) {
            throw self::bad('params はオブジェクトで指定してください');
        }
        $params = Json::toArray($params);
        $role = $who['role'] ?? 'viewer';
        $perm = $def['perm'] ?? 'read';
        $actor = ['id' => $who['id'] ?? null, 'email' => $who['email'] ?? null];
        if (!Members::can($role, $perm)) {
            $err = new RpcError('forbidden', 'この操作の権限がありません（あなたの役割：' . (Members::ROLE_LABEL[$role] ?? $role) . '。必要な権限：' . (Members::PERM_LABEL[$perm] ?? $perm) . '）', 403);
            if (!empty($def['write'])) {
                $this->app->audit()->record($actor, $action, [], false, $err->getMessage(), $ip);
            }
            throw $err;
        }
        $result = null;
        $error = null;
        try {
            $result = ($def['run'])($params, $who);
        } catch (\Throwable $e) {
            $error = $e;
        }
        if (!empty($def['write'])) {
            $summary = isset($def['summary']) ? self::clip(($def['summary'])($params, is_array($result) ? $result : [])) : [];
            $this->app->audit()->record($actor, $action, is_array($summary) ? $summary : [], $error === null, $error?->getMessage(), $ip);
        }
        if ($error === null && isset($def['access'])) {
            $subject = ($def['access'])($params);
            if ($subject !== null) {
                $this->app->db()->exec(
                    'INSERT INTO hub_access_log (at, actor_id, actor_email, action, subject, ip) VALUES (?, ?, ?, ?, ?, ?)',
                    [$this->app->now(), $actor['id'], $actor['email'], $action, mb_substr($subject, 0, 100), $ip]
                );
            }
        }
        if ($error === null) {
            return $result;
        }
        if ($error instanceof RpcError) {
            throw $error;
        }
        if ($error instanceof \InvalidArgumentException || $error instanceof \DomainException) {
            throw new RpcError('bad_request', $error->getMessage(), 400);
        }
        $this->app->log()->error('管理 API の処理に失敗しました', ['action' => $action, 'error' => $error->getMessage(), 'at' => $error->getFile() . ':' . $error->getLine()]);
        throw new RpcError('internal', '内部エラーが起きました。しばらくしてからもう一度お試しください', 500);
    }
}
