<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Text;
use Hub\Kernel\Time;

/**
 * Zoom との橋：Webhook を受けて出欠を残し、終わったら「参加した／来なかった」のタグを付ける（line-hub の zoom.js）。
 *
 * 安全の方針：
 *   ・署名（x-zm-signature = v0=HMAC-SHA256("v0:<timestamp>:<生ボディ>", Secret Token)）が合わないものは 401。比較は一定時間
 *   ・url_validation の返事は「秘密での署名」なので、受け取る文字列は英数字・ハイフン・アンダースコアだけに限る
 *   ・参加者の名前とメールは暗号化して持つ。見分ける鍵（participant_key）は、メール・名前そのものではなく指紋（HMAC）にする
 */
final class Zoom
{
    private const WINDOW_SEC = 12 * 3600;

    public static function hmac(string $secret, string $message): string
    {
        return hash_hmac('sha256', $message, $secret);
    }

    public static function verifySignature(string $rawBody, string $signature, string $timestamp, string $secret): bool
    {
        if ($secret === '') {
            throw new \RuntimeException('Zoom の Secret Token（zoom.secret_token）が未設定です');
        }
        if ($signature === '' || $timestamp === '') {
            return false;
        }
        return hash_equals('v0=' . self::hmac($secret, "v0:{$timestamp}:{$rawBody}"), $signature);
    }

    private static function normName(?string $s): string
    {
        return preg_replace('/\s+/u', '', mb_strtolower(Text::nfkc((string) $s))) ?? '';
    }

    /** 見分ける鍵：メールがあればメール、なければ表示名、どちらも無ければ Zoom の参加者ID（メール・名前は指紋にする） */
    public static function participantKey(App $app, array $p): ?string
    {
        $email = strtolower(trim((string) ($p['email'] ?? '')));
        if ($email !== '') {
            return self::aliasKey($app, 'email', $email);
        }
        $name = self::normName($p['user_name'] ?? null);
        if ($name !== '') {
            return self::aliasKey($app, 'name', $name);
        }
        $id = trim((string) ($p['participant_uuid'] ?? $p['id'] ?? $p['user_id'] ?? ''));
        return $id !== '' ? 'uuid:' . mb_substr($id, 0, 90) : null;
    }

    private static function aliasKey(App $app, string $kind, string $value): string
    {
        return $kind . ':' . substr($app->crypto()->index($value, 'zoom.' . $kind), 0, 40);
    }

    private static function findEvent(App $app, mixed $meetingId, \DateTimeImmutable $at): ?array
    {
        $id = preg_replace('/\D/', '', (string) $meetingId) ?? '';
        if ($id === '') {
            return null;
        }
        $best = null;
        $bestGap = PHP_INT_MAX;
        foreach ($app->db()->all('SELECT * FROM line_calendar_events WHERE zoom_meeting_id = ?', [$id]) as $ev) {
            $gap = abs(Time::ms(Time::parse($ev['starts_at'])) - Time::ms($at));
            if ($gap <= self::WINDOW_SEC * 1000 && $gap < $bestGap) {
                $best = $ev;
                $bestGap = $gap;
            }
        }
        return $best;
    }

    /** @return array{status:int,body:string,contentType:string} */
    public static function handleWebhook(App $app, string $rawBody, string $signature, string $timestamp, string $secret): array
    {
        $reply = static fn (int $status, mixed $body, bool $json = false): array => [
            'status' => $status, 'body' => $json ? Json::enc($body) : (string) $body,
            'contentType' => $json ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
        ];
        if ($secret === '') {
            return $reply(503, 'zoom webhook is not configured');
        }
        $body = Json::tryDec($rawBody);
        if (!is_array($body)) {
            return $reply(400, 'bad request');
        }
        // URL の確認（Zoom 管理画面で「検証」を押したとき）
        if (($body['event'] ?? null) === 'endpoint.url_validation') {
            $plain = $body['payload']['plainToken'] ?? null;
            if (!is_string($plain) || !preg_match('/^[A-Za-z0-9_-]{8,128}$/', $plain)) {
                return $reply(400, 'bad request');
            }
            return $reply(200, ['plainToken' => $plain, 'encryptedToken' => self::hmac($secret, $plain)], true);
        }
        if (!self::verifySignature($rawBody, $signature, $timestamp, $secret)) {
            return $reply(401, 'unauthorized');
        }
        $obj = $body['payload']['object'] ?? [];
        $now = $app->now();
        $eventTs = isset($body['event_ts']) && is_numeric($body['event_ts']) ? Time::fromMs((int) $body['event_ts']) : null;
        $stamp = static fn ($v) => (is_string($v) ? Time::tryParse($v) : null) ?? $eventTs ?? $now;
        $db = $app->db();
        switch ($body['event'] ?? null) {
            case 'meeting.participant_joined':
            case 'meeting.participant_left':
                $joined = $body['event'] === 'meeting.participant_joined';
                $p = is_array($obj['participant'] ?? null) ? $obj['participant'] : [];
                $at = $stamp($joined ? ($p['join_time'] ?? null) : ($p['leave_time'] ?? null));
                $key = self::participantKey($app, $p);
                if ($key === null) {
                    return $reply(200, 'ignored');
                }
                $ev = self::findEvent($app, $obj['id'] ?? null, $at);
                if (!$ev) {
                    return $reply(200, 'ignored');
                }
                $email = strtolower(trim((string) ($p['email'] ?? '')));
                $db->exec(
                    'INSERT INTO line_zoom_log (event_id, kind, participant_key, user_name, email, at, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE id = id',
                    [$ev['id'], $joined ? 'join' : 'leave', $key, Secure::enc($app, Secure::ZOOM_NAME, isset($p['user_name']) ? mb_substr((string) $p['user_name'], 0, 200) : null),
                     Secure::enc($app, Secure::ZOOM_EMAIL, $email !== '' ? $email : null), $at, $now]
                );
                return $reply(200, 'ok');
            case 'meeting.ended':
                $at = $stamp($obj['end_time'] ?? null);
                $ev = self::findEvent($app, $obj['id'] ?? null, $at);
                if (!$ev) {
                    return $reply(200, 'ignored');
                }
                // 確定は毎分の処理で（終わりの通知のあとに、退出の通知が遅れて届くことがあるため、少し待ってから）
                $db->exec('UPDATE line_calendar_events SET zoom_ended_at = ?, finalized_at = NULL WHERE id = ?', [$at, $ev['id']]);
                return $reply(200, 'ok');
            case 'recording.completed':
                $at = $stamp($obj['recording_end'] ?? $obj['start_time'] ?? null);
                $ev = self::findEvent($app, $obj['id'] ?? null, $at);
                if (!$ev) {
                    return $reply(200, 'ignored');
                }
                $first = $db->exec('UPDATE line_calendar_events SET recording_ready_at = ? WHERE id = ? AND recording_ready_at IS NULL', [$now, $ev['id']]);
                if ($first) {
                    $admins = Settings::get($app)['admin_user_ids'] ?? [];
                    if ($admins) {
                        Outbox::enqueue($app, $admins, Msg::normalize(["【{$ev['title']}】の録画ができました。顔チェックを通してから公開してください（自動では会員に配信しません）。"], []), 'zoom', 'recording:' . $ev['key'], 20);
                    }
                }
                return $reply(200, 'ok');
            default:
                return $reply(200, 'ignored');
        }
    }

    /** 入った／出たの記録から、参加者ごとの在室分数 */
    private static function minutesByParticipant(App $app, array $logs, \DateTimeImmutable $cutoff): array
    {
        $by = [];
        foreach ($logs as $l) {
            $k = $l['participant_key'];
            $by[$k] ??= ['key' => $k, 'name' => null, 'email' => null, 'list' => []];
            $by[$k]['name'] ??= Secure::dec($app, Secure::ZOOM_NAME, $l['user_name']);
            $by[$k]['email'] ??= Secure::dec($app, Secure::ZOOM_EMAIL, $l['email']);
            $by[$k]['list'][] = ['kind' => $l['kind'], 'at' => Time::ms(Time::parse($l['at']))];
        }
        $out = [];
        foreach ($by as $p) {
            usort($p['list'], fn ($a, $b) => ($a['at'] <=> $b['at']) ?: ($a['kind'] === 'join' ? -1 : 1));
            $open = null;
            $ms = 0;
            foreach ($p['list'] as $e) {
                if ($e['kind'] === 'join') {
                    $open ??= $e['at'];
                } elseif ($open !== null) {
                    $ms += max(0, $e['at'] - $open);
                    $open = null;
                }
            }
            if ($open !== null) {
                $ms += max(0, Time::ms($cutoff) - $open);
            }
            $out[] = ['key' => $p['key'], 'name' => $p['name'], 'email' => $p['email'], 'minutes' => intdiv($ms, 60000)];
        }
        return $out;
    }

    /** 参加者を LINE の友だちに結びつける。結んだ表 → 会員の連携 → 申込者の中で表示名が1人だけ一致、の順 */
    private static function resolveFriend(App $app, array $ev, array $p): ?string
    {
        $keys = [];
        if ($p['email']) {
            $keys[] = self::aliasKey($app, 'email', strtolower((string) $p['email']));
        }
        if ($p['name']) {
            $keys[] = self::aliasKey($app, 'name', self::normName($p['name']));
        }
        $db = $app->db();
        if ($keys) {
            $params = [];
            $in = Db::in($keys, $params);
            $a = $db->one("SELECT line_user_id FROM line_zoom_aliases WHERE alias_key IN ({$in}) LIMIT 1", $params);
            if ($a) {
                return $a['line_user_id'];
            }
        }
        $via = $app->adapter()->resolveZoomParticipant($app, $p['email'], $p['name']);
        if ($via) {
            return $via;
        }
        if (!$p['name']) {
            return null;
        }
        $apps = array_values(array_filter(
            $db->all(
                "SELECT f.line_user_id, f.display_name FROM line_event_participants ep JOIN line_friends f ON f.line_user_id = ep.line_user_id
                 WHERE ep.event_id = ? AND ep.status = 'applied'",
                [$ev['id']]
            ),
            fn ($r) => self::normName($r['display_name']) === self::normName($p['name'])
        ));
        return count($apps) === 1 ? $apps[0]['line_user_id'] : null;
    }

    /** イベントの出欠を確定する。何度呼んでも同じ結果 */
    public static function finalize(App $app, string $eventKey, bool $force = false, bool $notify = false): array
    {
        $db = $app->db();
        $ev = Events::byKey($app, $eventKey);
        if (!$ev) {
            return ['ok' => false, 'reason' => 'not_found'];
        }
        $now = $app->now();
        $ended = $ev['zoom_ended_at'] !== null;
        $cutoff = $ended ? Time::parse($ev['zoom_ended_at']) : $now;
        $people = self::minutesByParticipant($app, $db->all('SELECT participant_key, kind, user_name, email, at FROM line_zoom_log WHERE event_id = ?', [$ev['id']]), $cutoff);
        $perUser = [];
        $rows = [];
        foreach ($people as $p) {
            $uid = self::resolveFriend($app, $ev, $p);
            $rows[] = $p + ['uid' => $uid];
            if ($uid) {
                $perUser[$uid] = ($perUser[$uid] ?? 0) + $p['minutes'];
            }
        }
        $need = (int) ($ev['attend_min_minutes'] ?? 10);
        $db->tx(function (Db $db) use ($app, $ev, $rows, $perUser, $need): void {
            $db->exec('DELETE FROM line_event_attendance WHERE event_id = ?', [$ev['id']]);
            foreach ($rows as $r) {
                $total = $r['uid'] ? $perUser[$r['uid']] : $r['minutes'];
                $db->exec(
                    'INSERT INTO line_event_attendance (event_id, participant_key, line_user_id, user_name, email, minutes, attended) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$ev['id'], $r['key'], $r['uid'], Secure::enc($app, Secure::ZOOM_NAME, $r['name']), Secure::enc($app, Secure::ZOOM_EMAIL, $r['email']), $r['minutes'], $total >= $need]
                );
            }
        });
        $attTag = 'attended:' . $ev['key'];
        $absTag = 'absent:' . $ev['key'];
        $attended = 0;
        foreach ($perUser as $uid => $total) {
            if ($total < $need) {
                continue;
            }
            $attended++;
            Rules::removeTag($app, (string) $uid, $absTag);
            Rules::applyTag($app, (string) $uid, $attTag);
        }
        $absent = 0;
        if ($ended || $force) {
            foreach ($db->all("SELECT line_user_id FROM line_event_participants WHERE event_id = ? AND status = 'applied'", [$ev['id']]) as $a) {
                if (($perUser[$a['line_user_id']] ?? 0) >= $need) {
                    continue;
                }
                $absent++;
                Rules::removeTag($app, $a['line_user_id'], $attTag);
                Rules::applyTag($app, $a['line_user_id'], $absTag);
            }
        }
        $db->exec('UPDATE line_calendar_events SET finalized_at = ? WHERE id = ?', [$now, $ev['id']]);
        $unmatched = array_values(array_map(fn ($r) => ['key' => $r['key'], 'name' => $r['name'], 'email' => $r['email'], 'minutes' => $r['minutes']], array_filter($rows, fn ($r) => !$r['uid'])));
        if ($notify) {
            $admins = Settings::get($app)['admin_user_ids'] ?? [];
            if ($admins) {
                $lines = ["【{$ev['title']}】の出欠を記録しました。", "参加 {$attended}人／欠席 {$absent}人／LINEと結びつかなかった方 " . count($unmatched) . '人'];
                if ($unmatched) {
                    $lines[] = '管理画面のイベントの「出欠を見る」から結びつけてください。';
                }
                Outbox::enqueue($app, $admins, Msg::normalize([implode("\n", $lines)], []), 'zoom', 'finalize:' . $ev['key'], 20);
            }
        }
        return ['ok' => true, 'attended' => $attended, 'absent' => $absent, 'unmatched' => $unmatched, 'ended' => $ended];
    }

    /** 毎分：終わった会議のうち、まだ確定していない／確定のあとに通知が増えたものを確定する（1回に3件まで） */
    public static function tick(App $app, int $graceMinutes = 2, int $limit = 3): array
    {
        $db = $app->db();
        $due = $db->all(
            'SELECT e.`key` FROM line_calendar_events e
             WHERE e.zoom_ended_at IS NOT NULL AND e.zoom_ended_at <= ?
               AND (e.finalized_at IS NULL OR EXISTS (SELECT 1 FROM line_zoom_log l WHERE l.event_id = e.id AND l.received_at > e.finalized_at))
             ORDER BY e.zoom_ended_at LIMIT ' . max(1, $limit),
            [Time::addMinutes($app->now(), -$graceMinutes)]
        );
        $finalized = 0;
        foreach ($due as $d) {
            $first = $db->value('SELECT finalized_at FROM line_calendar_events WHERE `key` = ?', [$d['key']]) === null;
            $r = self::finalize($app, $d['key'], false, $first);
            if ($r['ok']) {
                $finalized++;
            }
        }
        return ['finalized' => $finalized];
    }

    /** 結びつけられなかった参加者を、運営が LINE の友だちに結びつける */
    public static function linkParticipant(App $app, string $eventKey, string $participantKey, string $lineUserId): array
    {
        $db = $app->db();
        $ev = Events::byKey($app, $eventKey);
        if (!$ev) {
            return ['ok' => false, 'reason' => 'not_found'];
        }
        if (!$db->one('SELECT 1 AS ok FROM line_friends WHERE line_user_id = ?', [$lineUserId])) {
            return ['ok' => false, 'reason' => 'friend_not_found'];
        }
        if (!$db->one('SELECT 1 AS ok FROM line_zoom_log WHERE event_id = ? AND participant_key = ? LIMIT 1', [$ev['id'], $participantKey])) {
            return ['ok' => false, 'reason' => 'participant_not_found'];
        }
        $db->exec(
            'INSERT INTO line_zoom_aliases (alias_key, line_user_id, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE line_user_id = VALUES(line_user_id)',
            [$participantKey, $lineUserId, $app->now()]
        );
        return ['ok' => true] + self::finalize($app, $eventKey);
    }

    public static function attendance(App $app, string $eventKey): array
    {
        $rows = $app->db()->all(
            'SELECT a.participant_key, a.user_name, a.email, a.minutes, a.attended, a.line_user_id, f.display_name
             FROM line_event_attendance a JOIN line_calendar_events e ON e.id = a.event_id LEFT JOIN line_friends f ON f.line_user_id = a.line_user_id
             WHERE e.`key` = ? ORDER BY a.minutes DESC',
            [$eventKey]
        );
        foreach ($rows as &$r) {
            $r['user_name'] = Secure::dec($app, Secure::ZOOM_NAME, $r['user_name']);
            $r['email'] = Secure::dec($app, Secure::ZOOM_EMAIL, $r['email']);
        }
        unset($r);
        // 同じ分数の中は名前の順（暗号化しているので、読み戻してから並べる）
        usort($rows, fn ($a, $b) => ($b['minutes'] <=> $a['minutes']) ?: strcmp((string) $a['user_name'], (string) $b['user_name']));
        return $rows;
    }
}
