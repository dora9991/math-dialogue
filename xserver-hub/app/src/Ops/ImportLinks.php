<?php
declare(strict_types=1);

namespace Hub\Ops;

use Hub\Kernel\App;
use Hub\Kernel\Json;
use Hub\Line\Friends;
use Hub\Member\SiteAdapter;

/**
 * いまの会員サイトで、すでに LINE とつながっている会員を、ハブへ移す（はじめの1回）。
 *
 * CSV（1行目は見出し）：member_ref,line_user_id,plan,rank
 *   例：Supabase の SQL エディタで
 *       select id as member_ref, line_user_id, null as plan, public.current_plan_rank(id) as rank
 *       from public.profiles where line_user_id is not null;
 *   を CSV で書き出す（このファイルには個人を指す情報が入るので、取り込んだら、すぐ消す）
 *
 * --check を付けると、LINE に1人ずつプロフィールを問い合わせ、友だちかどうか・表示名を確かめる（1秒に10人まで）。
 */
final class ImportLinks
{
    /** @return array{linked:int,skipped:int,errors:list<string>,blocked:int} */
    public static function run(App $app, string $csv, bool $check, ?callable $say = null): array
    {
        $fh = fopen($csv, 'rb');
        if ($fh === false) {
            throw new \RuntimeException("開けません: {$csv}");
        }
        $head = fgetcsv($fh, 0, ',', '"', '');
        $head = array_map(fn ($h) => strtolower(trim((string) $h, " \t\n\r\0\x0B\xEF\xBB\xBF")), $head ?: []);
        $idx = array_flip($head);
        if (!isset($idx['member_ref'], $idx['line_user_id'])) {
            throw new \RuntimeException('1行目（見出し）に member_ref と line_user_id が必要です');
        }
        $db = $app->db();
        $now = $app->now();
        $out = ['linked' => 0, 'skipped' => 0, 'errors' => [], 'blocked' => 0];
        $line = 1;
        while (($row = fgetcsv($fh, 0, ',', '"', '')) !== false) {
            $line++;
            $ref = trim((string) ($row[$idx['member_ref']] ?? ''));
            $uid = trim((string) ($row[$idx['line_user_id']] ?? ''));
            if ($ref === '' && $uid === '') {
                continue;
            }
            if (!preg_match('/^[A-Za-z0-9_.:@-]{1,100}$/', $ref) || !preg_match('/^U[0-9a-f]{32}$/', $uid)) {
                $out['errors'][] = "{$line}行目：member_ref か line_user_id の形が違います";
                $out['skipped']++;
                continue;
            }
            $plan = isset($idx['plan']) ? trim((string) ($row[$idx['plan']] ?? '')) : '';
            $rank = isset($idx['rank']) ? trim((string) ($row[$idx['rank']] ?? '')) : '';
            $db->exec(
                'INSERT INTO hub_members (member_ref, plan, `rank`, fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE plan = COALESCE(VALUES(plan), plan), `rank` = COALESCE(VALUES(`rank`), `rank`), updated_at = VALUES(updated_at)',
                [$ref, $plan === '' ? null : mb_substr($plan, 0, 50), $rank === '' || !is_numeric($rank) ? null : (int) $rank, Json::enc(new \stdClass()), $now, $now]
            );
            $status = 'active';
            if ($check) {
                $p = $app->line()->getProfile($uid);
                usleep(100_000);
                if ($p['status'] === 404) {
                    $status = 'blocked';
                    $out['blocked']++;
                } elseif (!$p['ok']) {
                    $out['errors'][] = "{$line}行目：LINE に問い合わせできませんでした（{$p['status']}）";
                }
            }
            $db->exec(
                'INSERT INTO line_friends (line_user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = IF(? = \'blocked\', \'blocked\', status), updated_at = VALUES(updated_at)',
                [$uid, $status, $now, $now, $status]
            );
            if ($check && $status === 'active') {
                Friends::refreshProfile($app, $uid);
            }
            $db->exec('UPDATE line_friends SET member_ref = NULL WHERE member_ref = ? AND line_user_id <> ?', [$ref, $uid]);
            $db->exec('UPDATE line_friends SET member_ref = ?, member_synced_at = ? WHERE line_user_id = ?', [$ref, $now, $uid]);
            $app->adapter()->refreshMember($app, $uid);
            Friends::addTag($app, $uid, SiteAdapter::LINK_TAG);
            $out['linked']++;
            if ($say && $out['linked'] % 100 === 0) {
                $say("{$out['linked']} 人…");
            }
        }
        fclose($fh);
        $app->audit()->record(['id' => 'cli', 'email' => null], 'cli.import_links', ['linked' => $out['linked'], 'skipped' => $out['skipped'], 'blocked' => $out['blocked']]);
        return $out;
    }
}
