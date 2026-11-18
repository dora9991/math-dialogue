<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * シナリオ（ステップ配信。line-hub の scenarios.js）。
 *
 * 登録したときに、各ステップの配信時刻を計算して line_enrollment_steps に持つ。毎分の処理が「時刻が来たもの」を送信キューに積む。
 * 配信時刻 = 基準 → offset_days（暦の日数）→ at_time（ローカル時刻の HH:MM に固定）→ offset_minutes
 *   enrolled：登録した時刻。過ぎた時刻は「今すぐ」に繰り上げる
 *   event   ：イベントの開始時刻。登録の時点で過ぎているステップは送らない。予定より大きく遅れたら送らない
 *   fixed   ：管理画面のカレンダーで選んだ日時。登録の時点で過ぎていれば送らない
 */
final class Scenarios
{
    /** @param array{anchor?:?string,offset_days?:?int,offset_minutes?:?int,at_time?:?string,fixed_at?:?string} $step */
    public static function computeDue(\DateTimeImmutable $base, array $step, int $tz): \DateTimeImmutable
    {
        if (($step['anchor'] ?? null) === 'fixed') {
            if (empty($step['fixed_at'])) {
                throw new \InvalidArgumentException('日時を指定するステップに、日時がありません');
            }
            return Time::parse((string) $step['fixed_at']);
        }
        $d = $base;
        if (!empty($step['offset_days'])) {
            $d = Time::addLocalDays($d, (int) $step['offset_days'], $tz);
        }
        if (!empty($step['at_time'])) {
            if (!preg_match('/^(\d{1,2}):(\d{2})$/', (string) $step['at_time'], $m)) {
                throw new \InvalidArgumentException("at_time は HH:MM で指定してください: {$step['at_time']}");
            }
            $p = Time::localParts($d, $tz);
            $d = Time::fromLocal($p['y'], $p['m'], $p['d'], (int) $m[1], (int) $m[2], $tz);
        }
        if (!empty($step['offset_minutes'])) {
            $d = Time::addMinutes($d, (int) $step['offset_minutes']);
        }
        return $d;
    }

    public static function eventVars(?array $ev, int $tz): array
    {
        if (!$ev) {
            return [];
        }
        return [
            'key' => $ev['key'],
            'title' => $ev['title'],
            'starts_at' => Time::formatJa(Time::parse((string) $ev['starts_at']), $tz),
            'url' => $ev['url'] ?? '',
            'location' => $ev['location'] ?? '',
        ];
    }

    /** 管理画面から保存するステップ配信の入力チェック */
    public static function validateDef(mixed $def): void
    {
        $err = static function (string $m): never {
            throw new \InvalidArgumentException($m);
        };
        if (!Json::isObjLike($def)) {
            $err('ステップ配信が空です');
        }
        $def = Json::toArray($def);
        if (trim((string) ($def['name'] ?? '')) === '') {
            $err('シナリオ名が必要です');
        }
        if (mb_strlen((string) $def['name']) > 100) {
            $err('シナリオ名は100文字までです');
        }
        if (isset($def['description']) && mb_strlen((string) $def['description']) > 500) {
            $err('説明は500文字までです');
        }
        $tagList = static function (mixed $v, string $label) use ($err): void {
            if ($v === null) {
                return;
            }
            if (!is_array($v) || ($v !== [] && !array_is_list($v)) || count($v) > 20) {
                $err("{$label}は、文字列の一覧（20個まで・各50文字まで）にしてください");
            }
            foreach ($v as $t) {
                if (!is_string($t) || trim($t) === '' || mb_strlen($t) > 50) {
                    $err("{$label}は、文字列の一覧（20個まで・各50文字まで）にしてください");
                }
            }
        };
        $tagList($def['stopOnTags'] ?? null, '止めるタグ');
        $tagList($def['startOnTags'] ?? null, '始まるきっかけのタグ');
        foreach (['startOnFollow', 'enabled', 'stopOnReply'] as $k) {
            if (isset($def[$k]) && !is_bool($def[$k])) {
                $err("{$k} は true / false で指定してください");
            }
        }
        $rs = $def['replyScenario'] ?? null;
        if ($rs !== null && $rs !== '') {
            if (!is_string($rs) || mb_strlen($rs) > 100) {
                $err('返事があったときに移るステップ配信の名前は、100文字までの文字列にしてください');
            }
            if (trim($rs) === trim((string) $def['name'])) {
                $err('返事があったときに移るステップ配信に、自分自身は選べません');
            }
        }
        if (isset($def['audience'])) {
            if (!Json::isObjLike($def['audience'])) {
                $err('対象（audience）の形が正しくありません');
            }
            try {
                $p = [];
                Audience::where($def['audience'], $p);
            } catch (\InvalidArgumentException $e) {
                $err('対象が正しくありません（' . $e->getMessage() . '）');
            }
        }
        $steps = $def['steps'] ?? null;
        if (!is_array($steps) || !$steps || !array_is_list($steps)) {
            $err('ステップが必要です');
        }
        if (count($steps) > 100) {
            $err('ステップは100件までです（もっと必要なら、ステップ配信を分けて、最後に次のステップ配信へつなぎます）');
        }
        $int = static fn ($v, int $lo, int $hi): bool => is_int($v) && $v >= $lo && $v <= $hi;
        foreach ($steps as $i => $s) {
            $at = ($i + 1) . '通目';
            if (!Json::isObjLike($s)) {
                $err("{$at}：ステップの形が正しくありません");
            }
            $anchor = $s['anchor'] ?? 'enrolled';
            if (!in_array($anchor, ['enrolled', 'event', 'fixed'], true)) {
                $err("{$at}：基準（anchor）は enrolled・event・fixed のどれかです");
            }
            if ($anchor === 'fixed' && (empty($s['fixedAt']) || Time::tryParse($s['fixedAt']) === null)) {
                $err("{$at}：送る日時（カレンダーで選ぶ日時）が必要です");
            }
            if (isset($s['offsetDays']) && !$int($s['offsetDays'], -3650, 3650)) {
                $err("{$at}：日数は整数（-3650〜3650）にしてください");
            }
            if (isset($s['offsetMinutes']) && !$int($s['offsetMinutes'], -525600, 525600)) {
                $err("{$at}：分は整数にしてください");
            }
            if ($anchor === 'enrolled' && (($s['offsetDays'] ?? 0) < 0 || ($s['offsetMinutes'] ?? 0) < 0)) {
                $err("{$at}：登録から数えるステップは、「前」にはできません（イベントの基準にするか、日数・分を0以上にしてください）");
            }
            if (isset($s['atTime']) && $s['atTime'] !== '' && !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $s['atTime'])) {
                $err("{$at}：時刻は HH:MM（例：09:00）で指定してください");
            }
            try {
                Msg::validate(Msg::normalize($s['messages'] ?? [], ['display_name' => 'x']), true);
            } catch (\InvalidArgumentException $e) {
                $err("{$at}：" . $e->getMessage());
            }
            if (isset($s['conditions'])) {
                try {
                    $p = [];
                    Audience::where($s['conditions'], $p);
                } catch (\InvalidArgumentException $e) {
                    $err("{$at}：条件が正しくありません（" . $e->getMessage() . '）');
                }
            }
        }
        $starts = !empty($def['startOnFollow']) || !empty($def['startOnTags']);
        if ($starts) {
            foreach ($steps as $x) {
                if (($x['anchor'] ?? 'enrolled') === 'event') {
                    $err('イベントの開始から数えるステップがあるため、友だち追加やタグでは始められません（イベント基準のステップ配信は、イベントの申込から始まります）');
                }
            }
        }
    }

    /**
     * シナリオとステップを作る／入れ替える。送ってこなかった項目（enabled・止めるタグ・始まるきっかけ・対象）は、いまの値のまま残す
     * @return array{id:int,inserted:bool}
     */
    public static function upsert(App $app, mixed $def): array
    {
        self::validateDef($def);
        $def = Json::toArray($def);
        $name = $def['name'];
        $steps = $def['steps'];
        $tags = static fn ($v) => $v === null ? null : array_values(array_map([Attributes::class, 'normalizeTagName'], $v));
        $now = $app->now();
        return $app->db()->tx(function (Db $db) use ($def, $name, $steps, $tags, $now): array {
            $cur = $db->one('SELECT id FROM line_scenarios WHERE name = ? FOR UPDATE', [$name]);
            $stop = $tags($def['stopOnTags'] ?? null);
            $start = $tags($def['startOnTags'] ?? null);
            $aud = isset($def['audience']) ? Json::enc(Json::obj($def['audience'])) : null;
            $rs = array_key_exists('replyScenario', $def) && $def['replyScenario'] !== null ? trim((string) $def['replyScenario']) : null;
            if ($cur) {
                $id = (int) $cur['id'];
                $db->exec(
                    'UPDATE line_scenarios SET description = ?, enabled = COALESCE(?, enabled), stop_on_tags = COALESCE(?, stop_on_tags),
                       start_on_follow = COALESCE(?, start_on_follow), start_on_tags = COALESCE(?, start_on_tags), audience = COALESCE(?, audience),
                       stop_on_reply = COALESCE(?, stop_on_reply), reply_scenario = IF(? IS NULL, reply_scenario, NULLIF(?, \'\')), updated_at = ?
                     WHERE id = ?',
                    [
                        $def['description'] ?? null, $def['enabled'] ?? null, $stop === null ? null : Json::enc($stop),
                        $def['startOnFollow'] ?? null, $start === null ? null : Json::enc($start), $aud,
                        $def['stopOnReply'] ?? null, $rs, $rs, $now, $id,
                    ]
                );
                $inserted = false;
            } else {
                $db->exec(
                    'INSERT INTO line_scenarios (name, description, enabled, stop_on_tags, start_on_follow, start_on_tags, audience, stop_on_reply, reply_scenario, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $name, $def['description'] ?? null, $def['enabled'] ?? true, Json::enc($stop ?? []), $def['startOnFollow'] ?? false,
                        Json::enc($start ?? []), $aud ?? '{}', $def['stopOnReply'] ?? false, $rs === '' ? null : $rs, $now, $now,
                    ]
                );
                $id = $db->lastId();
                $inserted = true;
            }
            // 既存のステップは位置で上書き。配信予定の入っているステップは消さない。使われていない位置だけ削除する
            $p = [$id];
            $in = Db::in(range(1, count($steps)), $p);
            $db->exec("DELETE FROM line_scenario_steps WHERE scenario_id = ? AND position NOT IN ({$in}) AND id NOT IN (SELECT step_id FROM line_enrollment_steps)", $p);
            foreach ($steps as $i => $s) {
                $fixed = ($s['anchor'] ?? 'enrolled') === 'fixed';
                $db->exec(
                    'INSERT INTO line_scenario_steps (scenario_id, position, anchor, offset_days, offset_minutes, at_time, conditions, messages, fixed_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE anchor = VALUES(anchor), offset_days = VALUES(offset_days), offset_minutes = VALUES(offset_minutes),
                       at_time = VALUES(at_time), conditions = VALUES(conditions), messages = VALUES(messages), fixed_at = VALUES(fixed_at)',
                    [
                        $id, $i + 1, $s['anchor'] ?? 'enrolled',
                        $fixed ? 0 : (int) ($s['offsetDays'] ?? 0), $fixed ? 0 : (int) ($s['offsetMinutes'] ?? 0),
                        $fixed ? null : (($s['atTime'] ?? null) === '' ? null : ($s['atTime'] ?? null)),
                        Json::enc(Json::obj($s['conditions'] ?? [])), Json::enc($s['messages']),
                        $fixed ? Time::parse((string) $s['fixedAt']) : null,
                    ]
                );
            }
            return ['id' => $id, 'inserted' => $inserted];
        });
    }

    /** @return array{ok:bool,reason?:string,enrollmentId?:int} 人をシナリオに登録する。配信予定を計算して持つ */
    public static function enroll(App $app, string $userId, string $scenarioName, ?string $eventKey = null, ?\DateTimeImmutable $now = null): array
    {
        $now ??= $app->now();
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $db = $app->db();
        $sc = $db->one('SELECT * FROM line_scenarios WHERE name = ?', [$scenarioName], json: ['stop_on_tags', 'start_on_tags', 'audience']);
        if (!$sc) {
            return ['ok' => false, 'reason' => 'scenario_not_found'];
        }
        if (!$sc['enabled']) {
            return ['ok' => false, 'reason' => 'scenario_disabled'];
        }
        $friend = Friends::get($app, $userId);
        if (!$friend || $friend['status'] !== 'active') {
            return ['ok' => false, 'reason' => 'not_active'];
        }
        if (!empty($sc['audience']) && !Audience::userMatches($app, $userId, $sc['audience'])) {
            return ['ok' => false, 'reason' => 'not_target'];
        }
        $steps = $db->all('SELECT * FROM line_scenario_steps WHERE scenario_id = ? ORDER BY position', [$sc['id']]);
        if (!$steps) {
            return ['ok' => false, 'reason' => 'no_steps'];
        }
        $ev = null;
        if ($eventKey !== null) {
            $ev = $db->one('SELECT * FROM line_calendar_events WHERE `key` = ?', [$eventKey]);
            if (!$ev) {
                return ['ok' => false, 'reason' => 'event_not_found'];
            }
        }
        foreach ($steps as $s) {
            if ($s['anchor'] === 'event' && !$ev) {
                return ['ok' => false, 'reason' => 'event_required'];
            }
        }
        // 止めるタグが既に付いている人は登録しない（例：購入済みの人にセールスのシナリオを流さない）
        if (!empty($sc['stop_on_tags'])) {
            $p = [$userId];
            $in = Db::in($sc['stop_on_tags'], $p);
            if ($db->one("SELECT 1 AS ok FROM line_friend_tags ft JOIN line_tags t ON t.id = ft.tag_id WHERE ft.line_user_id = ? AND t.name IN ({$in})", $p)) {
                return ['ok' => false, 'reason' => 'stop_tag'];
            }
        }
        return $db->tx(function (Db $db) use ($sc, $userId, $ev, $now, $steps, $tz): array {
            $existing = $db->one(
                'SELECT id, status, stop_reason FROM line_enrollments WHERE scenario_id = ? AND line_user_id = ? AND event_id0 = ? FOR UPDATE',
                [$sc['id'], $userId, $ev['id'] ?? 0]
            );
            $anchorEventAt = $ev ? Time::parse((string) $ev['starts_at']) : null;
            if ($existing) {
                // ブロック→再追加の人だけは最初からやり直す。それ以外は二重に登録しない
                if (!($existing['status'] === 'stopped' && $existing['stop_reason'] === 'unfollow')) {
                    return ['ok' => false, 'reason' => 'already_enrolled'];
                }
                $db->exec('DELETE FROM line_enrollment_steps WHERE enrollment_id = ?', [$existing['id']]);
                $db->exec("UPDATE line_enrollments SET status = 'active', stop_reason = NULL, enrolled_at = ?, anchor_event_at = ? WHERE id = ?", [$now, $anchorEventAt, $existing['id']]);
                $enrollmentId = (int) $existing['id'];
            } else {
                $db->exec(
                    'INSERT INTO line_enrollments (scenario_id, line_user_id, event_id, enrolled_at, anchor_event_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [$sc['id'], $userId, $ev['id'] ?? null, $now, $anchorEventAt, $now]
                );
                $enrollmentId = $db->lastId();
            }
            foreach ($steps as $s) {
                $due = self::computeDue($s['anchor'] === 'event' ? $anchorEventAt : $now, $s, $tz);
                $status = 'pending';
                $skip = null;
                if ($s['anchor'] === 'event' || $s['anchor'] === 'fixed') {
                    if ($due < $now) {
                        $status = 'skipped';
                        $skip = 'past_due';
                    }
                } elseif ($due < $now) {
                    $due = $now; // 過ぎてしまった時刻は今すぐ
                }
                $db->exec(
                    'INSERT INTO line_enrollment_steps (enrollment_id, step_id, due_at, status, skip_reason, processed_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [$enrollmentId, $s['id'], $due, $status, $skip, $status === 'skipped' ? $now : null]
                );
            }
            return ['ok' => true, 'enrollmentId' => $enrollmentId];
        });
    }

    /** 人の（特定の or すべての）有効な登録を止める。未配信のステップは skipped にする。止めた数 */
    public static function stopEnrollments(App $app, string $userId, string $reason, ?string $scenarioName = null): int
    {
        $db = $app->db();
        $params = [$userId];
        $sql = "SELECT e.id FROM line_enrollments e WHERE e.line_user_id = ? AND e.status = 'active'";
        if ($scenarioName !== null) {
            $sql .= ' AND e.scenario_id = (SELECT id FROM line_scenarios WHERE name = ?)';
            $params[] = $scenarioName;
        }
        $ids = array_map('intval', array_column($db->all($sql, $params), 'id'));
        self::stopIds($app, $ids, $reason);
        return count($ids);
    }

    /** @param list<int> $ids */
    private static function stopIds(App $app, array $ids, string $reason): void
    {
        if (!$ids) {
            return;
        }
        $db = $app->db();
        $p = [$reason];
        $in = Db::in($ids, $p);
        $db->exec("UPDATE line_enrollments SET status = 'stopped', stop_reason = ? WHERE id IN ({$in}) AND status = 'active'", $p);
        $p2 = [$reason, $app->now()];
        $in2 = Db::in($ids, $p2);
        $db->exec("UPDATE line_enrollment_steps SET status = 'skipped', skip_reason = ?, processed_at = ? WHERE enrollment_id IN ({$in2}) AND status = 'pending'", $p2);
    }

    /** タグが付いたとき：「止めるタグ」のシナリオを止め、「始まるきっかけ」のシナリオに登録する。止めた数 */
    public static function onTagAdded(App $app, string $userId, string $rawTag): int
    {
        $tag = Attributes::normalizeTagName($rawTag);
        $db = $app->db();
        $ids = array_map('intval', array_column($db->all(
            "SELECT e.id FROM line_enrollments e JOIN line_scenarios s ON s.id = e.scenario_id
             WHERE e.line_user_id = ? AND e.status = 'active' AND JSON_CONTAINS(s.stop_on_tags, JSON_QUOTE(?))",
            [$userId, $tag]
        ), 'id'));
        self::stopIds($app, $ids, 'stop_tag');
        foreach ($db->all('SELECT name FROM line_scenarios WHERE enabled = 1 AND JSON_CONTAINS(start_on_tags, JSON_QUOTE(?)) ORDER BY id', [$tag]) as $x) {
            self::enroll($app, $userId, $x['name']);
        }
        return count($ids);
    }

    /** 友だちが文字のメッセージを送ってきたとき：「反応で止める」を止め、「返事があったら移る」先に登録する */
    public static function onFriendReply(App $app, string $userId): array
    {
        $db = $app->db();
        $rows = $db->all(
            "SELECT e.id, s.reply_scenario FROM line_enrollments e JOIN line_scenarios s ON s.id = e.scenario_id
             WHERE e.line_user_id = ? AND e.status = 'active' AND s.stop_on_reply = 1",
            [$userId]
        );
        if (!$rows) {
            return ['stopped' => 0, 'moved' => []];
        }
        self::stopIds($app, array_map('intval', array_column($rows, 'id')), 'replied');
        $moved = [];
        foreach (array_unique(array_filter(array_column($rows, 'reply_scenario'))) as $next) {
            $e = self::enroll($app, $userId, $next);
            $moved[] = ['scenario' => $next, 'ok' => $e['ok'], 'reason' => $e['reason'] ?? null];
        }
        return ['stopped' => count($rows), 'moved' => $moved];
    }

    /** 友だち追加されたとき：「友だち追加で始める」シナリオに登録する */
    public static function startOnFollow(App $app, string $userId): array
    {
        $out = [];
        foreach ($app->db()->all('SELECT name FROM line_scenarios WHERE enabled = 1 AND start_on_follow = 1 ORDER BY id') as $x) {
            $out[] = ['scenario' => $x['name']] + self::enroll($app, $userId, $x['name']);
        }
        return $out;
    }

    /** まとめて登録する前の見積もり */
    public static function estimateEnroll(App $app, string $scenarioName, mixed $audience = []): array
    {
        $db = $app->db();
        $sc = $db->one('SELECT * FROM line_scenarios WHERE name = ?', [$scenarioName], json: ['stop_on_tags', 'start_on_tags', 'audience']);
        if (!$sc) {
            return ['ok' => false, 'reason' => 'scenario_not_found', 'message' => 'ステップ配信が見つかりません'];
        }
        $steps = $db->all('SELECT anchor FROM line_scenario_steps WHERE scenario_id = ?', [$sc['id']]);
        $params = [];
        $w0 = Audience::where($audience ?? [], $params);
        $w1 = Audience::where($sc['audience'] ?? [], $params);
        $params[] = $sc['id'];
        $ids = array_column($db->all(
            "SELECT f.line_user_id FROM line_friends f WHERE f.status = 'active' AND ({$w0}) AND ({$w1})
               AND NOT EXISTS (SELECT 1 FROM line_enrollments e WHERE e.scenario_id = ? AND e.line_user_id = f.line_user_id AND e.event_id IS NULL
                               AND NOT (e.status = 'stopped' AND e.stop_reason = 'unfollow'))
             ORDER BY f.line_user_id",
            $params
        ), 'line_user_id');
        $eventBased = false;
        foreach ($steps as $s) {
            if ($s['anchor'] === 'event') {
                $eventBased = true;
            }
        }
        return ['ok' => true, 'scenario' => $sc, 'ids' => $ids, 'recipients' => count($ids), 'perPerson' => count($steps), 'maxCost' => count($ids) * count($steps), 'eventBased' => $eventBased];
    }

    /** 条件に合う友だちを、まとめてシナリオに登録する（expected と違えば、登録しない。1回に max 人まで） */
    public static function enrollAudience(App $app, string $scenarioName, mixed $audience = [], ?int $expected = null, int $max = 1000): array
    {
        $est = self::estimateEnroll($app, $scenarioName, $audience);
        if (!$est['ok']) {
            return $est;
        }
        if (!$est['scenario']['enabled']) {
            return ['ok' => false, 'reason' => 'scenario_disabled', 'message' => '止めているステップ配信には、登録できません。先に「有効」にしてください'];
        }
        if ($est['eventBased']) {
            return ['ok' => false, 'reason' => 'event_required', 'message' => 'イベントの開始から数えるステップ配信は、イベントの申込から始まります（まとめて登録はできません）'];
        }
        if ($expected !== null && $expected !== $est['recipients']) {
            return ['ok' => false, 'reason' => 'recipients_changed', 'expected' => $expected, 'actual' => $est['recipients'], 'message' => "対象が {$expected}人 から {$est['recipients']}人 に変わりました。もう一度、人数を確かめてください"];
        }
        if ($est['recipients'] > $max) {
            return ['ok' => false, 'reason' => 'too_many', 'message' => "1回にまとめて登録できるのは {$max}人までです（いま {$est['recipients']}人）。条件で分けて、何回かに分けてください"];
        }
        $tally = ['enrolled' => 0, 'skipped' => 0, 'reasons' => []];
        foreach ($est['ids'] as $id) {
            $r = self::enroll($app, $id, $scenarioName);
            if ($r['ok']) {
                $tally['enrolled']++;
            } else {
                $tally['skipped']++;
                $tally['reasons'][$r['reason']] = ($tally['reasons'][$r['reason']] ?? 0) + 1;
            }
        }
        $tally['reasons'] = Json::obj($tally['reasons']);
        return ['ok' => true] + $tally;
    }

    /** 時刻が来たステップを送信キューに積む。毎分の処理から呼ぶ */
    public static function tick(App $app, int $limit = 500): array
    {
        $now = $app->now();
        $settings = Settings::get($app);
        $tz = (int) $settings['timezone_offset_min'];
        $result = ['queued' => 0, 'skipped' => 0];
        $db = $app->db();
        $due = $db->all(
            "SELECT es.enrollment_id, es.step_id, es.due_at, e.line_user_id, e.event_id, e.anchor_event_at,
                    st.messages, st.conditions, st.anchor, s.id AS scenario_id, s.enabled AS scenario_enabled
             FROM line_enrollment_steps es
               JOIN line_enrollments e ON e.id = es.enrollment_id
               JOIN line_scenario_steps st ON st.id = es.step_id
               JOIN line_scenarios s ON s.id = e.scenario_id
             WHERE es.status = 'pending' AND es.due_at <= ? AND e.status = 'active'
             ORDER BY es.due_at, es.enrollment_id, st.position
             LIMIT " . max(1, $limit),
            [$now],
            json: ['messages', 'conditions']
        );

        // ボタン（アンケート・日程など）を送ってまもない人には、少し待つ（あとから別のメッセージが届くと、ボタンが消えるため）
        $users = array_values(array_unique(array_column($due, 'line_user_id')));
        $waiting = [];
        if ($users) {
            $p = [];
            $in = Db::in($users, $p);
            $p[] = Time::addMinutes($now, -Chat::QUICK_REPLY_GRACE_MIN);
            foreach ($db->all("SELECT line_user_id, quick_reply_at FROM line_chat_state WHERE line_user_id IN ({$in}) AND quick_reply_at > ?", $p) as $x) {
                $waiting[$x['line_user_id']] = Time::addMinutes(Time::parse($x['quick_reply_at']), Chat::QUICK_REPLY_GRACE_MIN);
            }
        }

        $touched = [];
        foreach ($due as $r) {
            $touched[(int) $r['enrollment_id']] = true;
            if (!$r['scenario_enabled']) {
                continue; // 無効なシナリオは止めておく（有効に戻せば再開する）
            }
            $until = $waiting[$r['line_user_id']] ?? null;
            if ($until !== null) {
                $db->exec("UPDATE line_enrollment_steps SET due_at = ? WHERE enrollment_id = ? AND step_id = ? AND status = 'pending'", [$until, $r['enrollment_id'], $r['step_id']]);
                $result['waited'] = ($result['waited'] ?? 0) + 1;
                continue;
            }
            $db->tx(function (Db $db) use ($app, $r, $now, $settings, $tz, &$result): void {
                // 他の実行と取り合わないよう、まず「自分が取った」ことにする
                $claimed = $db->exec(
                    "UPDATE line_enrollment_steps SET status = 'queued', processed_at = ? WHERE enrollment_id = ? AND step_id = ? AND status = 'pending'",
                    [$now, $r['enrollment_id'], $r['step_id']]
                );
                if ($claimed === 0) {
                    return;
                }
                $skip = function (string $reason) use ($db, $r, &$result): void {
                    $db->exec("UPDATE line_enrollment_steps SET status = 'skipped', skip_reason = ? WHERE enrollment_id = ? AND step_id = ?", [$reason, $r['enrollment_id'], $r['step_id']]);
                    $result['skipped']++;
                };
                $lateMs = (int) $settings['reminder_max_late_minutes'] * 60_000;
                $dueMs = Time::ms(Time::parse($r['due_at']));
                if ($r['anchor'] === 'fixed' && Time::ms($now) - $dueMs > $lateMs) {
                    $skip('too_late');
                    return;
                }
                if ($r['anchor'] === 'event') {
                    if ($r['anchor_event_at'] !== null && Time::ms($now) >= Time::ms(Time::parse($r['anchor_event_at']))) {
                        $skip('event_started');
                        return;
                    }
                    if (Time::ms($now) - $dueMs > $lateMs) {
                        $skip('too_late');
                        return;
                    }
                }
                // いまも友だちか／条件に合うか
                if (!Audience::userMatches($app, $r['line_user_id'], $r['conditions'])) {
                    $skip('condition_or_blocked');
                    return;
                }
                $friend = Friends::get($app, $r['line_user_id']);
                $vars = ['display_name' => $friend['display_name'] ?? '', 'brand_name' => $settings['brand_name'], 'site_url' => $settings['site_url']];
                if ($r['event_id'] !== null) {
                    $vars['event'] = self::eventVars($db->one('SELECT * FROM line_calendar_events WHERE id = ?', [$r['event_id']]), $tz);
                }
                // アンケート・動画特典の印は、送る直前に、本物のメッセージに置き換える（使えないものは外す。全部外れたら送らない）
                $msgs = Special::expand($app, $r['line_user_id'], Msg::normalize($r['messages'], $vars));
                if (!$msgs) {
                    $skip('special_unavailable');
                    return;
                }
                $outboxId = Outbox::enqueue($app, [$r['line_user_id']], $msgs, 'scenario', "{$r['scenario_id']}:{$r['enrollment_id']}:{$r['step_id']}", 100);
                $db->exec('UPDATE line_enrollment_steps SET outbox_id = ? WHERE enrollment_id = ? AND step_id = ?', [$outboxId, $r['enrollment_id'], $r['step_id']]);
                $result['queued']++;
            });
        }
        if ($touched) {
            $p = [];
            $in = Db::in(array_keys($touched), $p);
            $db->exec(
                "UPDATE line_enrollments e SET status = 'completed'
                 WHERE e.id IN ({$in}) AND e.status = 'active'
                   AND NOT EXISTS (SELECT 1 FROM line_enrollment_steps s WHERE s.enrollment_id = e.id AND s.status = 'pending')",
                $p
            );
        }
        return $result;
    }
}
