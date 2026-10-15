<?php
declare(strict_types=1);

namespace Hub\Kernel;

/**
 * 操作の記録（誰が・いつ・何を）。書き込みの操作・ログイン・会員サイトからの呼び出し・コマンドの操作を残す。
 *
 *   ・改ざんの検知：1行ごとに「1つ前の行の指紋」を含めて指紋（SHA-256）を作り、鎖のようにつなぐ。
 *     途中の行を書き換えたり消したりすると、鎖が切れる（bin/hub audit:verify で確かめる。毎日の報告にも最新の指紋を載せる）
 *   ・中身は要約だけ（件数・名前・ID）。メッセージの本文や、友だちの個人の情報は入れない
 *   ・取引（トランザクション）の外で呼ぶ（操作が取り消されても、「やろうとした」記録は残す）
 */
final class Audit
{
    public const GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';

    public function __construct(private Db $db, private Clock $clock, private Log $log)
    {
    }

    /**
     * @param array{id?:?string,email?:?string}|null $actor
     */
    public function record(?array $actor, string $action, array $summary = [], bool $ok = true, ?string $error = null, ?string $ip = null): void
    {
        try {
            $this->db->tx(function (Db $db) use ($actor, $action, $summary, $ok, $error, $ip): void {
                $prev = $db->value('SELECT hash FROM hub_audit_head WHERE id = 1 FOR UPDATE');
                if ($prev === null) {
                    $db->exec('INSERT IGNORE INTO hub_audit_head (id, hash) VALUES (1, ?)', [self::GENESIS]);
                    $prev = $db->value('SELECT hash FROM hub_audit_head WHERE id = 1 FOR UPDATE');
                }
                $row = [
                    'at' => Time::db($this->clock->now()),
                    'actor_id' => isset($actor['id']) ? substr((string) $actor['id'], 0, 64) : null,
                    'actor_email' => isset($actor['email']) ? substr((string) $actor['email'], 0, 254) : null,
                    'action' => substr($action, 0, 80),
                    'summary' => Json::enc(Json::obj(self::clip($summary))),
                    'ok' => $ok ? 1 : 0,
                    'error' => $error === null ? null : mb_substr($error, 0, 300),
                    'ip' => $ip === null ? null : substr($ip, 0, 45),
                ];
                $hash = self::hashOf((string) $prev, $row);
                $db->exec(
                    'INSERT INTO hub_audit_log (at, actor_id, actor_email, action, summary, ok, error, ip, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [$row['at'], $row['actor_id'], $row['actor_email'], $row['action'], $row['summary'], $row['ok'], $row['error'], $row['ip'], $prev, $hash]
                );
                $db->exec('UPDATE hub_audit_head SET hash = ? WHERE id = 1', [$hash]);
            });
        } catch (\Throwable $e) {
            // 操作そのものは済んでいる。記録できなかったことだけ、はっきりログに出す
            $this->log->error('操作の記録に失敗しました', ['action' => $action, 'error' => $e->getMessage()]);
        }
    }

    /** @param array<string,mixed> $row */
    public static function hashOf(string $prev, array $row): string
    {
        return hash('sha256', implode("\n", [
            $prev,
            $row['at'],
            (string) ($row['actor_id'] ?? ''),
            (string) ($row['actor_email'] ?? ''),
            $row['action'],
            $row['summary'],
            (string) $row['ok'],
            (string) ($row['error'] ?? ''),
            (string) ($row['ip'] ?? ''),
        ]));
    }

    /**
     * 鎖が切れていないか確かめる。
     * @return array{ok:bool,rows:int,brokenAt:?int,head:?string,message:string}
     */
    public function verify(?string $anchor = null): array
    {
        $prev = null;
        $n = 0;
        $last = null;
        $id = 0;
        while (true) {
            $rows = $this->db->all(
                'SELECT id, DATE_FORMAT(at, "%Y-%m-%d %H:%i:%s.%f") AS at_raw, actor_id, actor_email, action, summary, ok, error, ip, prev_hash, hash
                 FROM hub_audit_log WHERE id > ? ORDER BY id LIMIT 1000',
                [$id]
            );
            if (!$rows) {
                break;
            }
            foreach ($rows as $r) {
                $id = (int) $r['id'];
                // 最初の行：起点（anchor）を渡されなければ、その行の prev_hash を起点にする
                // （保存期間で古い行を消したあとは、消した分までは確かめられない。最初から残っていれば GENESIS が起点）
                $expectPrev = $prev ?? ($anchor ?? $r['prev_hash']);
                $row = [
                    'at' => substr((string) $r['at_raw'], 0, 23),
                    'actor_id' => $r['actor_id'],
                    'actor_email' => $r['actor_email'],
                    'action' => $r['action'],
                    'summary' => $r['summary'],
                    'ok' => $r['ok'] ? '1' : '0',
                    'error' => $r['error'],
                    'ip' => $r['ip'],
                ];
                if ($r['prev_hash'] !== $expectPrev || self::hashOf($expectPrev, $row) !== $r['hash']) {
                    return ['ok' => false, 'rows' => $n, 'brokenAt' => $id, 'head' => null, 'message' => "操作の記録の鎖が切れています（id={$id}）。記録が書き換えられた・消された可能性があります"];
                }
                $prev = $r['hash'];
                $last = $r['hash'];
                $n++;
            }
        }
        $head = $this->db->value('SELECT hash FROM hub_audit_head WHERE id = 1');
        if ($last !== null && $head !== $last) {
            return ['ok' => false, 'rows' => $n, 'brokenAt' => $id, 'head' => $head, 'message' => '操作の記録の最後の行が、記録の先頭（hub_audit_head）と合いません。最後の行が消された可能性があります'];
        }
        return ['ok' => true, 'rows' => $n, 'brokenAt' => null, 'head' => $head, 'message' => "操作の記録 {$n} 件の鎖を確かめました（切れていません）"];
    }

    /** 画面に出す一覧（新しい順） */
    public function list(int $limit): array
    {
        return $this->db->all(
            'SELECT id, at, actor_email, action, summary, ok, error FROM hub_audit_log ORDER BY id DESC LIMIT ?',
            [$limit],
            keep: ['summary']
        );
    }

    /** 要約が大きくなりすぎないように（文字は300字まで・配列は50件まで） */
    private static function clip(mixed $v, int $depth = 0): mixed
    {
        if (is_string($v)) {
            return mb_strlen($v) > 300 ? mb_substr($v, 0, 300) . '…' : $v;
        }
        if (is_array($v)) {
            if ($depth > 4) {
                return '…';
            }
            $out = [];
            $i = 0;
            foreach ($v as $k => $x) {
                if (++$i > 50) {
                    $out['…'] = '（多いので省略）';
                    break;
                }
                $out[$k] = self::clip($x, $depth + 1);
            }
            return $out;
        }
        return $v;
    }
}
