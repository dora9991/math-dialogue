<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/** 開催イベント：申込 → 参加者を台帳に → タグ付け → 前日・直前のリマインド（line-hub の events.js） */
final class Events
{
    public static function normalizeMeetingId(mixed $v): ?string
    {
        if ($v === null || $v === '') {
            return null;
        }
        $s = preg_replace('/[\s-]/', '', (string) $v) ?? '';
        if (!preg_match('/^\d{8,13}$/', $s)) {
            throw new \InvalidArgumentException('ZoomのミーティングIDは数字8〜13桁で指定してください');
        }
        return $s;
    }

    public static function byKey(App $app, string $key, bool $forUpdate = false): ?array
    {
        return $app->db()->one('SELECT * FROM line_calendar_events WHERE `key` = ?' . ($forUpdate ? ' FOR UPDATE' : ''), [$key]);
    }

    /** 日時を変える。申込済みの人のリマインド（未送信分）も計算し直す */
    public static function reschedule(App $app, string $eventKey, string $newStartsAt): array
    {
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $now = $app->now();
        $start = Time::parse($newStartsAt);
        $ev = self::byKey($app, $eventKey);
        if (!$ev) {
            return ['ok' => false, 'reason' => 'not_found'];
        }
        return $app->db()->tx(function (Db $db) use ($ev, $start, $now, $tz): array {
            $db->exec('UPDATE line_calendar_events SET starts_at = ? WHERE id = ?', [$start, $ev['id']]);
            $db->exec('UPDATE line_enrollments SET anchor_event_at = ? WHERE event_id = ?', [$start, $ev['id']]);
            $steps = $db->all(
                "SELECT es.enrollment_id, es.step_id, es.status, es.skip_reason, st.offset_days, st.offset_minutes, st.at_time
                 FROM line_enrollment_steps es
                   JOIN line_enrollments e ON e.id = es.enrollment_id
                   JOIN line_scenario_steps st ON st.id = es.step_id
                 WHERE e.event_id = ? AND e.status = 'active' AND st.anchor = 'event'
                   AND (es.status = 'pending' OR (es.status = 'skipped' AND es.skip_reason = 'past_due'))",
                [$ev['id']]
            );
            $moved = 0;
            foreach ($steps as $s) {
                $due = Scenarios::computeDue($start, $s, $tz);
                $future = $due >= $now;
                if ($s['status'] === 'skipped' && !$future) {
                    continue; // 新しい日程でも間に合わない
                }
                $db->exec(
                    'UPDATE line_enrollment_steps SET due_at = ?, status = ?, skip_reason = ?, processed_at = NULL WHERE enrollment_id = ? AND step_id = ?',
                    [$due, $future ? 'pending' : 'skipped', $future ? null : 'past_due', $s['enrollment_id'], $s['step_id']]
                );
                $moved++;
            }
            return ['ok' => true, 'moved' => $moved];
        });
    }

    public static function validateDef(mixed $def): void
    {
        $err = static function (string $m): never {
            throw new \InvalidArgumentException($m);
        };
        if (!Json::isObjLike($def)) {
            $err('イベントが空です');
        }
        $def = Json::toArray($def);
        $blank = static fn ($v): bool => $v === null || $v === '';
        if ($blank($def['key'] ?? null) || $blank($def['title'] ?? null) || $blank($def['startsAt'] ?? null)) {
            $err('key・title・startsAt は必須です');
        }
        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/', (string) $def['key'])) {
            $err('キーは、半角の英数字・ハイフン・アンダースコア・ピリオド（80文字まで）にしてください（例：zaigai-1020）');
        }
        if (mb_strlen((string) $def['title']) > 200) {
            $err('イベント名は200文字までです');
        }
        if (Time::tryParse((string) $def['startsAt']) === null) {
            $err('開催日時が読み取れません（例：2026-11-10T20:00:00+09:00）');
        }
        if (!$blank($def['url'] ?? null)) {
            $u = (string) $def['url'];
            $scheme = strtolower((string) parse_url($u, PHP_URL_SCHEME));
            if (!in_array($scheme, ['http', 'https'], true) || !parse_url($u, PHP_URL_HOST) || strlen($u) > 500) {
                $err('URL は、https:// から始まる形（500文字まで）で入れてください');
            }
        }
        if (!$blank($def['location'] ?? null) && mb_strlen((string) $def['location']) > 200) {
            $err('場所は200文字までです');
        }
        $cap = $def['capacity'] ?? null;
        if (!$blank($cap) && (!is_int($cap) || $cap < 1 || $cap > 100000)) {
            $err('定員は 1 以上の整数にしてください（制限しないなら、空にします）');
        }
        $tag = $def['tag'] ?? null;
        if (!$blank($tag) && (!is_string($tag) || mb_strlen($tag) > 50 || preg_match('/[\n,、]/u', $tag))) {
            $err('申込者に付けるタグは、50文字までの1つの名前にしてください');
        }
        $rs = $def['reminderScenario'] ?? null;
        if (!$blank($rs) && (!is_string($rs) || mb_strlen($rs) > 100)) {
            $err('リマインドのステップ配信の名前が正しくありません');
        }
    }

    public static function upsert(App $app, mixed $def): array
    {
        self::validateDef($def);
        $def = Json::toArray($def);
        $blank = static fn ($v) => ($v === null || $v === '') ? null : $v;
        $attend = $def['attendMinMinutes'] ?? null;
        $clearZoom = array_key_exists('zoomMeetingId', $def) && $def['zoomMeetingId'] === ''; // 空文字は「消す」。指定なしは「いまの値を残す」
        $meeting = self::normalizeMeetingId($def['zoomMeetingId'] ?? null);
        if ($attend !== null && (!is_int($attend) || $attend < 0 || $attend > 600)) {
            throw new \InvalidArgumentException('参加とみなす分数は 0〜600 の整数にしてください');
        }
        $rs = $blank($def['reminderScenario'] ?? null);
        $db = $app->db();
        if ($rs !== null && !$db->one('SELECT 1 AS ok FROM line_scenarios WHERE name = ?', [$rs])) {
            throw new \InvalidArgumentException("リマインドのステップ配信「{$rs}」が見つかりません。先にステップ配信を作ってください");
        }
        $start = Time::parse((string) $def['startsAt']);
        $cur = $db->one('SELECT id FROM line_calendar_events WHERE `key` = ?', [$def['key']]);
        $vals = [$def['title'], $start, $blank($def['url'] ?? null), $blank($def['location'] ?? null), $blank($def['capacity'] ?? null), $blank($def['tag'] ?? null), $rs];
        if ($cur) {
            $db->exec(
                'UPDATE line_calendar_events SET title = ?, starts_at = ?, url = ?, location = ?, capacity = ?, tag = ?, reminder_scenario = ?,
                   zoom_meeting_id = IF(?, NULL, COALESCE(?, zoom_meeting_id)), attend_min_minutes = COALESCE(?, attend_min_minutes) WHERE id = ?',
                [...$vals, $clearZoom, $meeting, $attend, $cur['id']]
            );
            return ['id' => (int) $cur['id']];
        }
        $db->exec(
            'INSERT INTO line_calendar_events (title, starts_at, url, location, capacity, tag, reminder_scenario, `key`, zoom_meeting_id, attend_min_minutes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [...$vals, $def['key'], $meeting, $attend ?? 10, $app->now()]
        );
        return ['id' => $db->lastId()];
    }

    /** 毎週の決まった曜日・時刻のイベントを、まとめて作る。@return array{created:list<string>,skipped:list<string>} */
    public static function createSeries(App $app, mixed $def): array
    {
        $err = static function (string $m): never {
            throw new \InvalidArgumentException($m);
        };
        $def = Json::toArray($def);
        $keyPrefix = trim((string) ($def['keyPrefix'] ?? ''));
        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9_.-]{0,40}$/', $keyPrefix)) {
            $err('キーの頭は、半角の英数字で始めてください（例：kyoinkai-）');
        }
        $weekdays = is_array($def['weekdays'] ?? null) ? array_values(array_unique(array_map(fn ($w) => is_numeric($w) ? (float) $w : -1.0, $def['weekdays']))) : [];
        if (!$weekdays) {
            $err('曜日を1つ以上選んでください');
        }
        foreach ($weekdays as $w) {
            if ($w !== floor($w) || $w < 0 || $w > 6) {
                $err('曜日を1つ以上選んでください');
            }
        }
        $weekdays = array_map('intval', $weekdays);
        if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', (string) ($def['time'] ?? ''), $tm)) {
            $err('時刻は HH:MM（例：21:00）で指定してください');
        }
        $dm = static function (mixed $v, string $label) use ($err): array {
            if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', (string) $v, $m)) {
                $err("{$label}は YYYY-MM-DD で指定してください");
            }
            return [(int) $m[1], (int) $m[2], (int) $m[3]];
        };
        [$fy, $fm, $fd] = $dm($def['from'] ?? null, '始まりの日');
        [$ty, $tmo, $td] = $dm($def['to'] ?? null, '終わりの日');
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $start = gmmktime(0, 0, 0, $fm, $fd, $fy);
        $end = gmmktime(0, 0, 0, $tmo, $td, $ty);
        if ($end < $start) {
            $err('終わりの日は、始まりの日より後にしてください');
        }
        if (($end - $start) / 86400 > 180) {
            $err('まとめて作れるのは180日分までです');
        }
        $created = [];
        $skipped = [];
        for ($t = $start; $t <= $end; $t += 86400) {
            if (!in_array((int) gmdate('w', $t), $weekdays, true)) {
                continue;
            }
            if (count($created) >= 60) {
                $err('まとめて作れるのは60件までです。期間を短くしてください');
            }
            $key = $keyPrefix . gmdate('Ymd', $t);
            if ($app->db()->one('SELECT 1 AS ok FROM line_calendar_events WHERE `key` = ?', [$key])) {
                $skipped[] = $key;
                continue;
            }
            $startsAt = Time::iso(Time::fromMs(($t + ((int) $tm[1] * 60 + (int) $tm[2]) * 60 - $tz * 60) * 1000));
            self::upsert($app, [
                'key' => $key, 'title' => $def['title'] ?? null, 'startsAt' => $startsAt, 'url' => $def['url'] ?? null, 'location' => $def['location'] ?? null,
                'capacity' => $def['capacity'] ?? null, 'tag' => $def['tag'] ?? null, 'reminderScenario' => $def['reminderScenario'] ?? null, 'attendMinMinutes' => $def['attendMinMinutes'] ?? null,
            ]);
            $created[] = $key;
        }
        return ['created' => $created, 'skipped' => $skipped];
    }

    /** 申し込む。@return array{ok:bool,reason?:string,event?:array,tag?:string,tagAdded?:bool} */
    public static function apply(App $app, string $userId, string $eventKey, ?\DateTimeImmutable $now = null): array
    {
        $now ??= $app->now();
        $peek = self::byKey($app, $eventKey);
        if (!$peek) {
            return ['ok' => false, 'reason' => 'not_found'];
        }
        if (Time::parse($peek['starts_at']) <= $now) {
            return ['ok' => false, 'reason' => 'closed', 'event' => $peek];
        }
        return $app->db()->tx(function (Db $db) use ($app, $userId, $eventKey, $now): array {
            // 定員の取り合いを防ぐため、イベントの行をロックして直列にする
            $ev = self::byKey($app, $eventKey, true);
            $ex = $db->one('SELECT status FROM line_event_participants WHERE event_id = ? AND line_user_id = ?', [$ev['id'], $userId]);
            if (($ex['status'] ?? null) === 'applied') {
                return ['ok' => false, 'reason' => 'duplicate', 'event' => $ev];
            }
            if ($ev['capacity'] !== null) {
                $n = (int) $db->value("SELECT COUNT(*) FROM line_event_participants WHERE event_id = ? AND status = 'applied'", [$ev['id']]);
                if ($n >= (int) $ev['capacity']) {
                    return ['ok' => false, 'reason' => 'full', 'event' => $ev];
                }
            }
            $db->exec(
                "INSERT INTO line_event_participants (event_id, line_user_id, applied_at, status) VALUES (?, ?, ?, 'applied')
                 ON DUPLICATE KEY UPDATE status = 'applied', applied_at = VALUES(applied_at)",
                [$ev['id'], $userId, $now]
            );
            $tag = Attributes::normalizeTagName(($ev['tag'] ?? '') !== '' ? $ev['tag'] : 'event:' . $ev['key']);
            $added = Friends::addTag($app, $userId, $tag);
            // タグが付いたときの連鎖：このタグを「止めるタグ」にしているステップ配信を止める（タグ付与のルールは呼び出し側）
            if ($added['added']) {
                Scenarios::onTagAdded($app, $userId, $tag);
            }
            if ($ev['reminder_scenario']) {
                Scenarios::enroll($app, $userId, $ev['reminder_scenario'], $ev['key'], $now);
            }
            return ['ok' => true, 'event' => $ev, 'tag' => $tag, 'tagAdded' => $added['added']];
        });
    }

    public static function cancelApplication(App $app, string $userId, string $eventKey): array
    {
        $ev = self::byKey($app, $eventKey);
        if (!$ev) {
            return ['ok' => false, 'reason' => 'not_found'];
        }
        $n = $app->db()->exec("UPDATE line_event_participants SET status = 'canceled' WHERE event_id = ? AND line_user_id = ? AND status = 'applied'", [$ev['id'], $userId]);
        if ($n === 0) {
            return ['ok' => false, 'reason' => 'not_applied'];
        }
        Friends::removeTag($app, $userId, Attributes::normalizeTagName(($ev['tag'] ?? '') !== '' ? $ev['tag'] : 'event:' . $ev['key']));
        if ($ev['reminder_scenario']) {
            Scenarios::stopEnrollments($app, $userId, 'canceled', $ev['reminder_scenario']);
        }
        return ['ok' => true];
    }

    public static function participants(App $app, string $eventKey): array
    {
        return $app->db()->all(
            'SELECT p.line_user_id, f.display_name, p.applied_at, p.status
             FROM line_event_participants p JOIN line_calendar_events e ON e.id = p.event_id JOIN line_friends f ON f.line_user_id = p.line_user_id
             WHERE e.`key` = ? ORDER BY p.applied_at',
            [$eventKey]
        );
    }
}
