<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Kernel\Time;

/**
 * 管理用の操作（line-hub の admin.js）。画面の作りに依存しない、素直な関数の集まり。
 * 認証・権限・入力の検証・操作の記録は、呼び出し側（Rpc）が済ませてから呼ぶ。戻り値の形は、管理画面（line-hub-admin.js）が読む形に合わせてある。
 */
final class AdminOps
{
    // ---- 全体 ----
    public static function dashboard(App $app): array
    {
        $db = $app->db();
        $f = $db->one(
            "SELECT CAST(COALESCE(SUM(status = 'active'), 0) AS SIGNED) AS active, CAST(COALESCE(SUM(status = 'blocked'), 0) AS SIGNED) AS blocked,
                    CAST(COALESCE(SUM(member_ref IS NOT NULL AND status = 'active'), 0) AS SIGNED) AS members FROM line_friends"
        );
        $outbox = [];
        foreach ($db->all('SELECT status, COUNT(*) AS n FROM line_outbox GROUP BY status') as $r) {
            $outbox[$r['status']] = (int) $r['n'];
        }
        return [
            'friends' => ['active' => (int) $f['active'], 'blocked' => (int) $f['blocked'], 'members' => (int) $f['members']],
            'outbox' => Json::obj($outbox),
            'usage' => Outbox::usageSummary($app),
            'settings' => Settings::forOutput(Settings::get($app)),
        ];
    }

    // ---- 友だち ----
    public static function listFriends(App $app, ?string $q, ?string $tag, ?string $status, int $limit, int $offset): array
    {
        $params = [];
        $where = [];
        if ($q !== null && $q !== '') {
            $where[] = '(LOWER(f.display_name) LIKE ? OR LOWER(f.line_user_id) LIKE ?)';
            $params[] = '%' . Db::likeEscape(mb_strtolower($q)) . '%';
            $params[] = Db::likeEscape(mb_strtolower($q)) . '%';
        }
        if ($tag !== null && $tag !== '') {
            $where[] = 'EXISTS (SELECT 1 FROM line_friend_tags ft JOIN line_tags t ON t.id = ft.tag_id WHERE ft.line_user_id = f.line_user_id AND t.name = ?)';
            $params[] = $tag;
        }
        if ($status !== null && $status !== '') {
            $where[] = 'f.status = ?';
            $params[] = $status;
        }
        $rows = $app->db()->all(
            'SELECT f.line_user_id, f.display_name, f.status, f.followed_at, f.member_ref, f.member_plan, f.member_rank
             FROM line_friends f ' . ($where ? 'WHERE ' . implode(' AND ', $where) : '') . '
             ORDER BY f.followed_at IS NULL, f.followed_at DESC, f.created_at DESC LIMIT ' . max(1, $limit) . ' OFFSET ' . max(0, $offset),
            $params
        );
        return self::withTags($app, $rows);
    }

    /** 友だちの行に、タグの一覧（名前の順）を足す */
    private static function withTags(App $app, array $rows): array
    {
        if (!$rows) {
            return [];
        }
        $p = [];
        $in = Db::in(array_column($rows, 'line_user_id'), $p);
        $tags = [];
        foreach ($app->db()->all("SELECT ft.line_user_id, t.name FROM line_friend_tags ft JOIN line_tags t ON t.id = ft.tag_id WHERE ft.line_user_id IN ({$in}) ORDER BY t.name", $p) as $r) {
            $tags[$r['line_user_id']][] = $r['name'];
        }
        foreach ($rows as &$r) {
            $r['tags'] = $tags[$r['line_user_id']] ?? [];
        }
        unset($r);
        return $rows;
    }

    public static function getFriend(App $app, string $userId): ?array
    {
        $db = $app->db();
        $friend = Friends::get($app, $userId);
        if (!$friend) {
            return null;
        }
        $friend['note'] = Secure::dec($app, Secure::FRIEND_NOTE, $friend['note']);
        $enrollments = $db->all(
            'SELECT e.id, s.name AS scenario, e.status, e.stop_reason, e.enrolled_at, ev.title AS event
             FROM line_enrollments e JOIN line_scenarios s ON s.id = e.scenario_id LEFT JOIN line_calendar_events ev ON ev.id = e.event_id
             WHERE e.line_user_id = ? ORDER BY e.id',
            [$userId]
        );
        if ($enrollments) {
            $p = [];
            $in = Db::in(array_column($enrollments, 'id'), $p);
            $steps = [];
            foreach ($db->all(
                "SELECT es.enrollment_id, st.position, es.due_at, es.status, es.skip_reason FROM line_enrollment_steps es
                 JOIN line_scenario_steps st ON st.id = es.step_id WHERE es.enrollment_id IN ({$in}) ORDER BY st.position",
                $p
            ) as $s) {
                $steps[$s['enrollment_id']][] = ['position' => $s['position'], 'due_at' => $s['due_at'], 'status' => $s['status'], 'skip_reason' => $s['skip_reason']];
            }
            foreach ($enrollments as &$e) {
                $e['steps'] = $steps[$e['id']] ?? null;
            }
            unset($e);
        }
        $messages = array_map(fn ($m) => [
            'direction' => $m['direction'], 'kind' => $m['kind'], 'source' => $m['source'],
            'text_preview' => Secure::dec($app, Secure::LOG_PREVIEW, $m['text_preview']), 'created_at' => $m['created_at'],
        ], $db->all('SELECT direction, kind, source, text_preview, created_at FROM line_message_log WHERE line_user_id = ? ORDER BY id DESC LIMIT 30', [$userId]));
        return [
            'friend' => $friend,
            'tags' => Friends::tagNames($app, $userId),
            'fields' => Json::obj(Friends::fields($app, $userId)),
            'enrollments' => $enrollments,
            'events' => $db->all(
                'SELECT ev.`key`, ev.title, ev.starts_at, p.status FROM line_event_participants p JOIN line_calendar_events ev ON ev.id = p.event_id
                 WHERE p.line_user_id = ? ORDER BY ev.starts_at',
                [$userId]
            ),
            'messages' => $messages,
            'attributes' => Json::obj(Attributes::attributesOf($app, $userId)),
        ];
    }

    public static function listTags(App $app): array
    {
        return $app->db()->all('SELECT t.name, COUNT(ft.line_user_id) AS friends FROM line_tags t LEFT JOIN line_friend_tags ft ON ft.tag_id = t.id GROUP BY t.id, t.name ORDER BY t.name');
    }

    // ---- ルール ----
    public static function listRules(App $app): array
    {
        return $app->db()->all('SELECT * FROM line_rules ORDER BY priority, id', [], keep: ['conditions', 'actions']);
    }

    public static function saveRule(App $app, array $rule): array
    {
        $v = Rules::validate($rule);
        foreach ($v['actions'] as $i => $a) {
            $at = 'アクション' . ($i + 1) . '：';
            if (in_array($a['type'], ['reply', 'push'], true)) {
                Special::checkRefs($app, Msg::asList($a['messages'] ?? []), $at);
            }
            if ($a['type'] === 'survey_start' && !Surveys::get($app, trim((string) $a['survey']))) {
                throw new \InvalidArgumentException("{$at}アンケート「{$a['survey']}」が見つかりません");
            }
            if ($a['type'] === 'bonus_claim' && !Videos::get($app, trim((string) $a['offer']))) {
                throw new \InvalidArgumentException("{$at}動画特典「{$a['offer']}」が見つかりません");
            }
        }
        $db = $app->db();
        $now = $app->now();
        $args = [$v['name'], $v['enabled'], $v['priority'], $v['trigger_type'], $v['match_mode'], $v['pattern'], Json::enc(Json::obj($v['conditions'])), Json::enc($v['actions']), $v['stop_after']];
        if (!empty($rule['id'])) {
            $id = (int) $rule['id'];
            if (!$db->one('SELECT id FROM line_rules WHERE id = ?', [$id])) {
                throw new \InvalidArgumentException('ルールが見つかりません');
            }
            $db->exec(
                'UPDATE line_rules SET name = ?, enabled = ?, priority = ?, trigger_type = ?, match_mode = ?, pattern = ?, conditions = ?, actions = ?, stop_after = ?, updated_at = ? WHERE id = ?',
                [...$args, $now, $id]
            );
            return ['id' => $id];
        }
        $db->exec(
            'INSERT INTO line_rules (name, enabled, priority, trigger_type, match_mode, pattern, conditions, actions, stop_after, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [...$args, $now, $now]
        );
        return ['id' => $db->lastId()];
    }

    // ---- シナリオ ----
    public static function listScenarios(App $app): array
    {
        $db = $app->db();
        $rows = $db->all(
            "SELECT s.id, s.name, s.description, s.enabled, s.stop_on_tags, s.start_on_follow, s.start_on_tags, s.audience, s.stop_on_reply, s.reply_scenario,
                    (SELECT COUNT(*) FROM line_enrollments e WHERE e.scenario_id = s.id AND e.status = 'active') AS active_enrollments,
                    (SELECT COUNT(*) FROM line_enrollments e WHERE e.scenario_id = s.id AND e.status = 'completed') AS completed_enrollments,
                    (SELECT COUNT(*) FROM line_enrollments e WHERE e.scenario_id = s.id AND e.status = 'stopped') AS stopped_enrollments,
                    (SELECT COUNT(*) FROM line_enrollments e WHERE e.scenario_id = s.id) AS total_enrollments
             FROM line_scenarios s ORDER BY s.id",
            [],
            keep: ['stop_on_tags', 'start_on_tags', 'audience']
        );
        $steps = [];
        foreach ($db->all('SELECT scenario_id, position, anchor, offset_days, offset_minutes, at_time, fixed_at, conditions, messages FROM line_scenario_steps ORDER BY scenario_id, position', [], keep: ['conditions', 'messages']) as $st) {
            $steps[$st['scenario_id']][] = [
                'position' => $st['position'], 'anchor' => $st['anchor'], 'offsetDays' => $st['offset_days'], 'offsetMinutes' => $st['offset_minutes'],
                'atTime' => $st['at_time'], 'fixedAt' => $st['fixed_at'], 'conditions' => $st['conditions'], 'messages' => $st['messages'],
            ];
        }
        foreach ($rows as &$r) {
            $r['steps'] = $steps[$r['id']] ?? null;
        }
        unset($r);
        return $rows;
    }

    public static function saveScenario(App $app, array $def): array
    {
        Scenarios::validateDef($def);
        $name = trim((string) $def['name']);
        $db = $app->db();
        $limits = Limits::get($app);
        $cur = $db->one('SELECT start_on_follow, start_on_tags FROM line_scenarios WHERE name = ?', [$name], json: ['start_on_tags']);
        if (!$cur) {
            Limits::assertWithin($limits, 'max_scenarios', (int) $db->value('SELECT COUNT(*) FROM line_scenarios') + 1);
        }
        Limits::assertWithin($limits, 'max_steps', count($def['steps']));
        foreach ($def['steps'] as $i => $st) {
            Special::checkRefs($app, Msg::asList($st['messages'] ?? []), ($i + 1) . '通目：');
        }
        if (!empty($def['replyScenario']) && !$db->one('SELECT 1 AS ok FROM line_scenarios WHERE name = ?', [trim((string) $def['replyScenario'])])) {
            throw new \InvalidArgumentException("返事があったときに移るステップ配信「{$def['replyScenario']}」が見つかりません（先に作ってください）");
        }
        $startOnFollow = $def['startOnFollow'] ?? ($cur ? (bool) $cur['start_on_follow'] : false);
        $startOnTags = $def['startOnTags'] ?? ($cur['start_on_tags'] ?? []);
        if ($startOnFollow || $startOnTags) {
            foreach ($def['steps'] as $x) {
                if (($x['anchor'] ?? 'enrolled') === 'event') {
                    throw new \InvalidArgumentException('イベントの開始から数えるステップがあるため、友だち追加やタグでは始められません（「始まるきっかけ」を外すか、ステップの基準を変えてください）');
                }
            }
        }
        return Scenarios::upsert($app, ['name' => $name] + $def);
    }

    public static function estimateEnroll(App $app, string $name, mixed $audience): array
    {
        $r = Scenarios::estimateEnroll($app, $name, $audience);
        if (!$r['ok']) {
            return $r;
        }
        $enabled = (bool) $r['scenario']['enabled'];
        unset($r['ids'], $r['scenario']);
        return $r + ['enabled' => $enabled];
    }

    // ---- イベント ----
    public static function listEvents(App $app): array
    {
        return $app->db()->all("SELECT e.*, (SELECT COUNT(*) FROM line_event_participants p WHERE p.event_id = e.id AND p.status = 'applied') AS participants FROM line_calendar_events e ORDER BY e.starts_at");
    }

    // ---- 一斉配信 ----
    public static function listBroadcasts(App $app): array
    {
        return $app->db()->all(
            "SELECT b.*, (SELECT COUNT(*) FROM line_broadcast_batches bb WHERE bb.broadcast_id = b.id) AS batches,
                    (SELECT CAST(COALESCE(SUM(CASE WHEN o.status = 'sent' THEN o.cost ELSE 0 END), 0) AS SIGNED) FROM line_broadcast_batches bb JOIN line_outbox o ON o.id = bb.outbox_id WHERE bb.broadcast_id = b.id) AS delivered
             FROM line_broadcasts b ORDER BY b.id DESC LIMIT 50",
            [],
            keep: ['audience', 'messages']
        );
    }

    public static function createBroadcast(App $app, string $name, mixed $audience, mixed $messages, ?string $scheduledAt): array
    {
        Special::checkRefs($app, Msg::asList($messages));
        return Broadcasts::create($app, $name, $audience, $messages, $scheduledAt);
    }

    // ---- 送信キュー ----
    private const OUTBOX_COLS = 'id, kind, to_user_ids, source, source_ref, priority, cost, status, attempts, not_before, created_at, sent_at, last_error, messages';

    public static function listOutbox(App $app, ?string $status, int $limit): array
    {
        $p = [];
        $w = '';
        if ($status) {
            $w = 'WHERE status = ?';
            $p[] = $status;
        }
        $rows = $app->db()->all('SELECT ' . self::OUTBOX_COLS . " FROM line_outbox {$w} ORDER BY created_at DESC, id LIMIT " . max(1, $limit), $p);
        return array_map(fn ($r) => Outbox::present($app, $r), $rows);
    }

    public static function searchOutbox(App $app, ?string $status, ?string $source, ?string $from, ?string $to, int $limit, int $offset): array
    {
        $w = [];
        $p = [];
        if ($status) {
            $w[] = 'status = ?';
            $p[] = $status;
        }
        if ($source) {
            $w[] = 'source = ?';
            $p[] = $source;
        }
        if ($from) {
            $w[] = 'created_at >= ?';
            $p[] = Time::parse($from);
        }
        if ($to) {
            $w[] = 'created_at < ?';
            $p[] = Time::parse($to);
        }
        $where = $w ? 'WHERE ' . implode(' AND ', $w) : '';
        $db = $app->db();
        $total = (int) $db->value("SELECT COUNT(*) FROM line_outbox {$where}", $p);
        $rows = $db->all('SELECT ' . self::OUTBOX_COLS . " FROM line_outbox {$where} ORDER BY created_at DESC, id DESC LIMIT " . max(1, $limit) . ' OFFSET ' . max(0, $offset), $p);
        return ['rows' => array_map(fn ($r) => Outbox::present($app, $r), $rows), 'total' => $total, 'limit' => $limit, 'offset' => $offset];
    }

    public static function cancelOutbox(App $app, string $id): array
    {
        return ['ok' => $app->db()->exec("UPDATE line_outbox SET status = 'skipped', last_error = '運営が取り消しました' WHERE id = ? AND status = 'queued'", [$id]) > 0];
    }

    public static function requeueOutbox(App $app, string $id): array
    {
        return ['ok' => $app->db()->exec("UPDATE line_outbox SET status = 'queued', attempts = 0, last_error = NULL, claimed_at = NULL, not_before = NULL WHERE id = ? AND status = 'failed'", [$id]) > 0];
    }

    /** テスト送信：運営の LINE（または指定した1人）に1通だけ。送信の関所を通る */
    public static function testSend(App $app, string $to, ?string $text, ?array $messages): array
    {
        $s = Settings::get($app);
        $ids = $to === 'admins' ? array_values(array_filter($s['admin_user_ids'] ?? [])) : [$to];
        if (!$ids) {
            return ['ok' => false, 'reason' => 'no_recipient', 'message' => '運営の通知先（設定の admin_user_ids）が空です。先に設定してください'];
        }
        $p = [];
        $in = Db::in($ids, $p);
        $active = array_column($app->db()->all("SELECT line_user_id FROM line_friends WHERE line_user_id IN ({$in}) AND status = 'active'", $p), 'line_user_id');
        if (!$active) {
            return ['ok' => false, 'reason' => 'not_active', 'message' => '宛先が、友だち（ブロックしていない）ではありません'];
        }
        $msgs = $messages !== null ? Special::expand($app, null, Msg::normalize($messages, [])) : [['type' => 'text', 'text' => (string) $text]];
        if (!$msgs) {
            return ['ok' => false, 'reason' => 'no_messages', 'message' => '送るメッセージがありません（アンケート・動画特典が、見つからないか止めています）'];
        }
        $id = Outbox::enqueue($app, $active, $msgs, 'manual', 'test_send', 50);
        return ['ok' => true, 'outboxId' => $id, 'recipients' => count($active)];
    }

    // ---- 個別チャット ----
    public static function chatSendSpecial(App $app, string $userId, string $kind, string $ref, ?string $actor): array
    {
        $msg = $kind === 'survey' ? Surveys::start($app, $userId, $ref) : Videos::message(Videos::get($app, $ref));
        if (!$msg) {
            return ['ok' => false, 'reason' => 'unavailable', 'message' => $kind === 'survey' ? 'そのアンケートは、見つからないか、止めています' : 'その動画特典は、見つからないか、止めています'];
        }
        return Chat::send($app, $userId, [$msg], $actor);
    }

    // ---- 属性 ----
    public static function setAttribute(App $app, string $userId, string $group, ?string $value): array
    {
        $g = Attributes::normalizeTagName($group);
        if (!$app->db()->one('SELECT 1 AS ok FROM line_tag_groups WHERE name = ?', [$g])) {
            throw new \InvalidArgumentException("属性「{$g}」が見つかりません");
        }
        if ($value === null || $value === '') {
            $app->db()->exec(
                'DELETE ft FROM line_friend_tags ft JOIN line_tags t ON ft.tag_id = t.id WHERE ft.line_user_id = ? AND LEFT(t.name, CHAR_LENGTH(?) + 1) = CONCAT(?, \':\')',
                [$userId, $g, $g]
            );
            return ['ok' => true, 'removed' => true];
        }
        Rules::applyTag($app, $userId, Attributes::attrTag($g, Attributes::normalizeTagName($value)));
        return ['ok' => true];
    }

    public static function saveSurvey(App $app, array $def): array
    {
        if (isset($def['doneExtra'])) {
            Special::checkRefs($app, Msg::asList($def['doneExtra']), 'お礼のあと：');
        }
        if (!Surveys::get($app, trim((string) ($def['name'] ?? '')) ?: '__none__')) {
            Limits::assertWithin(Limits::get($app), 'max_surveys', (int) $app->db()->value('SELECT COUNT(*) FROM line_surveys') + 1);
        }
        return Surveys::upsert($app, $def);
    }

    public static function saveVideoOffer(App $app, array $def): array
    {
        if (isset($def['bonusMessages'])) {
            Special::checkRefs($app, Msg::asList($def['bonusMessages']), '特典の内容：');
        }
        if (!Videos::get($app, trim((string) ($def['key'] ?? '')))) {
            Limits::assertWithin(Limits::get($app), 'max_video_offers', (int) $app->db()->value('SELECT COUNT(*) FROM line_video_offers') + 1);
        }
        return Videos::upsert($app, $def);
    }

    // ---- 配信のカレンダー ----
    public static function calendar(App $app, string $from, string $to): array
    {
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $db = $app->db();
        $f = Time::parse($from);
        $t = Time::parse($to);
        $items = array_merge(
            $db->all("SELECT 'broadcast' AS kind, name AS title, scheduled_at AS at, status FROM line_broadcasts WHERE scheduled_at >= ? AND scheduled_at < ? AND status IN ('scheduled', 'sending', 'sent')", [$f, $t]),
            $db->all("SELECT 'event' AS kind, title, starts_at AS at, NULL AS status FROM line_calendar_events WHERE starts_at >= ? AND starts_at < ?", [$f, $t]),
            $db->all(
                "SELECT 'step' AS kind, CONCAT(sc.name, '（', st.position, '通目）') AS title, st.fixed_at AS at, IF(sc.enabled, NULL, 'disabled') AS status
                 FROM line_scenario_steps st JOIN line_scenarios sc ON sc.id = st.scenario_id WHERE st.anchor = 'fixed' AND st.fixed_at >= ? AND st.fixed_at < ?",
                [$f, $t]
            )
        );
        foreach ($items as &$x) {
            $p = Time::localParts(Time::parse($x['at']), $tz);
            $x['ymd'] = sprintf('%04d-%02d-%02d', $p['y'], $p['m'], $p['d']);
            $x['time'] = sprintf('%02d:%02d', $p['hh'], $p['mm']);
        }
        unset($x);
        usort($items, fn ($a, $b) => strcmp($a['at'], $b['at']));
        return $items;
    }
}
