<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Db;
use Hub\Kernel\Json;

/**
 * 絞り込み条件（ルールの条件・一斉配信の宛先・シナリオの条件で共通）。同じ条件の意味を1か所だけで SQL にする。
 *
 *   { tags_all: [...], tags_any: [...], tags_none: [...],
 *     member: 'any' | 'linked' | 'unlinked', plans: [...], min_rank: 20,
 *     fields: { key: 'value' }, attrs: { 校種: ['中学校', '高校'] } }
 *
 * 値は必ず ? にする。? の順番と $params の順番が合うよう、作った断片は「その場所」に置くこと（呼び出し側の約束）。
 */
final class Audience
{
    private const ALLOWED = ['tags_all', 'tags_any', 'tags_none', 'member', 'plans', 'min_rank', 'fields', 'attrs'];

    /** @param list<mixed> $params ここに値を積む */
    public static function where(mixed $conditions, array &$params, string $alias = 'f'): string
    {
        $c = $conditions ?? [];
        if (is_object($c)) {
            $c = Json::toArray($c);
        }
        if (!is_array($c)) {
            throw new \InvalidArgumentException('絞り込み条件の形が正しくありません');
        }
        foreach (array_keys($c) as $k) {
            if (!in_array($k, self::ALLOWED, true)) {
                throw new \InvalidArgumentException("未知の絞り込み条件です: {$k}");
            }
        }
        $tagExists = static fn (string $cond): string => "EXISTS (SELECT 1 FROM line_friend_tags ft JOIN line_tags t ON t.id = ft.tag_id
              WHERE ft.line_user_id = {$alias}.line_user_id AND {$cond})";
        $names = static function (mixed $a, string $key): array {
            if (!is_array($a) || ($a !== [] && !array_is_list($a))) {
                throw new \InvalidArgumentException("{$key} はタグ名の一覧にしてください");
            }
            return array_map([Attributes::class, 'normalizeTagName'], $a);
        };
        $parts = [];
        foreach ($names($c['tags_all'] ?? [], 'tags_all') as $t) {
            $params[] = $t;
            $parts[] = $tagExists('t.name = ?');
        }
        if (!empty($c['tags_any'])) {
            $list = $names($c['tags_any'], 'tags_any');
            $parts[] = $tagExists('t.name IN (' . Db::in($list, $params) . ')');
        }
        if (!empty($c['tags_none'])) {
            $list = $names($c['tags_none'], 'tags_none');
            $parts[] = 'NOT ' . $tagExists('t.name IN (' . Db::in($list, $params) . ')');
        }
        if (isset($c['attrs'])) {
            if (!Json::isObjLike($c['attrs'])) {
                throw new \InvalidArgumentException('attrs は { 種類: [値, …] } の形にしてください');
            }
            foreach ($c['attrs'] as $g => $vals) {
                if (!is_array($vals) || ($vals !== [] && !array_is_list($vals))) {
                    throw new \InvalidArgumentException("attrs の「{$g}」は、値の一覧にしてください");
                }
                if (!$vals) {
                    continue; // 何も選んでいない種類は、絞らない
                }
                $gn = Attributes::normalizeTagName((string) $g);
                $tags = array_map(fn ($v) => Attributes::attrTag($gn, Attributes::normalizeTagName($v)), $vals);
                $parts[] = $tagExists('t.name IN (' . Db::in($tags, $params) . ')');
            }
        }
        $member = $c['member'] ?? null;
        if ($member === 'linked') {
            $parts[] = "{$alias}.member_ref IS NOT NULL";
        } elseif ($member === 'unlinked') {
            $parts[] = "{$alias}.member_ref IS NULL";
        } elseif ($member !== null && $member !== '' && $member !== false && $member !== 'any') {
            throw new \InvalidArgumentException('未知の member 条件です: ' . (is_scalar($member) ? (string) $member : '?'));
        }
        if (!empty($c['plans'])) {
            if (!is_array($c['plans'])) {
                throw new \InvalidArgumentException('plans はプランの一覧にしてください');
            }
            $parts[] = "{$alias}.member_plan IN (" . Db::in(array_map('strval', array_values($c['plans'])), $params) . ')';
        }
        if (array_key_exists('min_rank', $c) && $c['min_rank'] !== null) {
            if (!is_numeric($c['min_rank'])) {
                throw new \InvalidArgumentException('min_rank は数にしてください');
            }
            $params[] = (int) $c['min_rank'];
            $parts[] = "COALESCE({$alias}.member_rank, 0) >= ?";
        }
        $fields = $c['fields'] ?? [];
        if (!is_array($fields) && !is_object($fields)) {
            throw new \InvalidArgumentException('fields は { 名前: 値 } の形にしてください');
        }
        foreach ((array) $fields as $k => $v) {
            $params[] = (string) $k;
            $params[] = is_bool($v) ? ($v ? 'true' : 'false') : (string) (is_scalar($v) ? $v : '');
            $parts[] = "EXISTS (SELECT 1 FROM line_friend_fields ff WHERE ff.line_user_id = {$alias}.line_user_id
                        AND ff.`key` = ? AND ff.value = ?)";
        }
        return $parts ? implode(' AND ', $parts) : 'TRUE';
    }

    /** この人は条件に合うか */
    public static function userMatches(App $app, string $userId, mixed $conditions, bool $includeBlocked = false): bool
    {
        $params = [$userId];
        $where = self::where($conditions, $params);
        $r = $app->db()->one(
            'SELECT 1 AS ok FROM line_friends f WHERE f.line_user_id = ? ' . ($includeBlocked ? '' : "AND f.status = 'active' ") . "AND ({$where})",
            $params
        );
        return $r !== null;
    }

    /** @return list<string> 宛先（ブロックしていない友だちのうち、条件に合う人） */
    public static function userIds(App $app, mixed $audience): array
    {
        $params = [];
        $where = self::where($audience, $params);
        return array_column($app->db()->all("SELECT f.line_user_id FROM line_friends f WHERE f.status = 'active' AND ({$where}) ORDER BY f.line_user_id", $params), 'line_user_id');
    }

    public static function count(App $app, mixed $audience): int
    {
        $params = [];
        $where = self::where($audience, $params);
        return (int) $app->db()->value("SELECT COUNT(*) FROM line_friends f WHERE f.status = 'active' AND ({$where})", $params);
    }
}
