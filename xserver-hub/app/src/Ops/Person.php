<?php
declare(strict_types=1);

namespace Hub\Ops;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;
use Hub\Line\Secure;

/**
 * 本人からの求め（個人情報保護法の「開示」「消去・利用停止」）に応えるための道具。
 *   ・export：その人について、ハブが持っている情報を全部、読める形（JSON）で書き出す
 *   ・erase ：その人の情報を、全部消す（友だち台帳・タグ・やり取り・登録・回答・送信の記録）
 * どちらも、操作の記録に残す（誰の分か、は指紋だけ。ID そのものは残さない）。
 */
final class Person
{
    public static function find(App $app, string $q): array
    {
        $like = '%' . Db::likeEscape(mb_strtolower($q)) . '%';
        return $app->db()->all(
            'SELECT line_user_id, display_name, status, member_ref, followed_at FROM line_friends
             WHERE LOWER(display_name) LIKE ? OR line_user_id = ? OR member_ref = ? ORDER BY followed_at DESC LIMIT 50',
            [$like, $q, $q]
        );
    }

    public static function export(App $app, string $userId): ?array
    {
        $db = $app->db();
        $f = $db->one('SELECT * FROM line_friends WHERE line_user_id = ?', [$userId]);
        if (!$f) {
            return null;
        }
        $f['note'] = Secure::dec($app, Secure::FRIEND_NOTE, $f['note']);
        $messages = array_map(fn ($m) => [
            'at' => $m['created_at'], 'direction' => $m['direction'], 'kind' => $m['kind'], 'source' => $m['source'], 'actor' => $m['actor'],
            'text' => $m['body'] !== null ? Secure::dec($app, Secure::LOG_BODY, $m['body']) : Secure::dec($app, Secure::LOG_PREVIEW, $m['text_preview']),
        ], $db->all('SELECT * FROM line_message_log WHERE line_user_id = ? ORDER BY id', [$userId]));
        $outbox = [];
        foreach ($db->all("SELECT id, kind, source, status, created_at, sent_at, messages FROM line_outbox WHERE JSON_CONTAINS(to_user_ids, JSON_QUOTE(?)) ORDER BY created_at", [$userId]) as $o) {
            $o['messages'] = Secure::decJson($app, Secure::OUTBOX_MESSAGES, $o['messages']);
            $outbox[] = $o;
        }
        return [
            'exported_at' => \Hub\Kernel\Time::iso($app->now()),
            'note' => 'LINE配信ハブが、この方について持っている情報です（LINE 公式アカウントの運営者が書き出しました）',
            'friend' => $f,
            'tags' => \Hub\Line\Friends::tagNames($app, $userId),
            'fields' => Json::obj(\Hub\Line\Friends::fields($app, $userId)),
            'member' => $f['member_ref'] !== null ? $db->one('SELECT member_ref, plan, `rank`, fields, updated_at FROM hub_members WHERE member_ref = ?', [$f['member_ref']], keep: ['fields']) : null,
            'enrollments' => $db->all('SELECT s.name AS scenario, e.status, e.stop_reason, e.enrolled_at FROM line_enrollments e JOIN line_scenarios s ON s.id = e.scenario_id WHERE e.line_user_id = ?', [$userId]),
            'events' => $db->all('SELECT ev.`key`, ev.title, ev.starts_at, p.status, p.applied_at FROM line_event_participants p JOIN line_calendar_events ev ON ev.id = p.event_id WHERE p.line_user_id = ?', [$userId]),
            'surveys' => $db->all('SELECT s.name, r.answers, r.started_at, r.completed_at FROM line_survey_responses r JOIN line_surveys s ON s.id = r.survey_id WHERE r.line_user_id = ?', [$userId], keep: ['answers']),
            'videos' => $db->all('SELECT o.name, v.watched_at, v.deadline_at, v.claimed_at, v.watch_count FROM line_video_views v JOIN line_video_offers o ON o.id = v.offer_id WHERE v.line_user_id = ?', [$userId]),
            'attendance' => array_map(fn ($a) => ['event' => $a['title'], 'minutes' => $a['minutes'], 'attended' => $a['attended']], $db->all('SELECT ev.title, a.minutes, a.attended FROM line_event_attendance a JOIN line_calendar_events ev ON ev.id = a.event_id WHERE a.line_user_id = ?', [$userId])),
            'messages' => $messages,
            'sent' => $outbox,
        ];
    }

    /** @return array<string,int> 消した数 */
    public static function erase(App $app, string $userId): array
    {
        $db = $app->db();
        $counts = $db->tx(function (Db $db) use ($userId): array {
            $c = [];
            $c['attendance'] = $db->exec('DELETE FROM line_event_attendance WHERE line_user_id = ?', [$userId]);
            $c['message_log'] = $db->exec('DELETE FROM line_message_log WHERE line_user_id = ?', [$userId]);
            $c['events'] = $db->exec('DELETE FROM line_events WHERE line_user_id = ?', [$userId]);
            // 送信の記録：その人だけに送った行は消す。複数の人へ送った行からは、その人を外す
            $c['outbox'] = $db->exec("DELETE FROM line_outbox WHERE to_user_ids = JSON_ARRAY(?)", [$userId]);
            $multi = $db->all('SELECT id, to_user_ids FROM line_outbox WHERE JSON_CONTAINS(to_user_ids, JSON_QUOTE(?))', [$userId], json: ['to_user_ids']);
            foreach ($multi as $o) {
                $rest = array_values(array_filter($o['to_user_ids'], fn ($u) => $u !== $userId));
                if ($rest) {
                    $db->exec('UPDATE line_outbox SET to_user_ids = ? WHERE id = ?', [Json::enc($rest), $o['id']]);
                } else {
                    $db->exec('DELETE FROM line_outbox WHERE id = ?', [$o['id']]);
                }
            }
            $c['outbox_multi'] = count($multi);
            $db->exec('UPDATE hub_link_codes SET used_by = NULL WHERE used_by = ?', [$userId]);
            // 友だち台帳（タグ・友だち情報・登録・申込・回答・動画・チャットの状態・Zoom の結びつけも、まとめて消える）
            $c['friend'] = $db->exec('DELETE FROM line_friends WHERE line_user_id = ?', [$userId]);
            $c['access_log'] = $db->exec('DELETE FROM hub_access_log WHERE subject = ?', [$userId]);
            return $c;
        });
        return $counts;
    }

    /** 記録に残すための、元に戻せない指紋 */
    public static function subjectHash(App $app, string $userId): string
    {
        return substr($app->crypto()->index($userId, 'erased_subject'), 0, 16);
    }
}
