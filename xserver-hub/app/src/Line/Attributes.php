<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;

/**
 * 属性（タグの種類）：「種類:値」の形のタグ（例：校種:中学校）を、種類ごとにまとめて扱う（line-hub の attributes.js）。
 *   ・1人1つ（single）の種類は、新しい値を付けると、同じ種類の古い値を外す
 *   ・全角の「：」は半角の「:」にそろえる
 * 文字数の比べ方は CHAR_LENGTH（MariaDB の LENGTH はバイト数なので使わない）
 */
final class Attributes
{
    private const NAME_MAX = 20;
    private const VALUE_MAX = 20;
    private const CHOICES_MAX = 30;

    public static function normalizeTagName(mixed $s): string
    {
        return trim(str_replace('：', ':', is_scalar($s) ? (string) $s : ''));
    }

    public static function attrTag(string $group, string $value): string
    {
        return $group . ':' . $value;
    }

    /** @return array{name:string,choices:list<string>,position:int,single:bool} */
    public static function validateGroupDef(mixed $def): array
    {
        if (!Json::isObjLike($def)) {
            throw new \InvalidArgumentException('属性が空です');
        }
        $def = Json::toArray($def);
        $name = self::normalizeTagName($def['name'] ?? '');
        if ($name === '') {
            throw new \InvalidArgumentException('属性の名前（例：校種）が必要です');
        }
        if (mb_strlen($name) > self::NAME_MAX) {
            throw new \InvalidArgumentException('属性の名前は' . self::NAME_MAX . '文字までです');
        }
        if (str_contains($name, ':')) {
            throw new \InvalidArgumentException('属性の名前に「:」は使えません');
        }
        $choices = $def['choices'] ?? [];
        if (!is_array($choices) || !array_is_list($choices)) {
            throw new \InvalidArgumentException('選択肢は一覧にしてください');
        }
        $clean = array_values(array_filter(array_map([self::class, 'normalizeTagName'], $choices), fn ($c) => $c !== ''));
        if (count($clean) > self::CHOICES_MAX) {
            throw new \InvalidArgumentException('選択肢は' . self::CHOICES_MAX . '個までです');
        }
        foreach ($clean as $c) {
            if (mb_strlen($c) > self::VALUE_MAX) {
                throw new \InvalidArgumentException('選択肢「' . mb_substr($c, 0, 10) . '…」が長すぎます（' . self::VALUE_MAX . '文字まで）');
            }
            if (str_contains($c, ':')) {
                throw new \InvalidArgumentException("選択肢「{$c}」に「:」は使えません");
            }
        }
        if (count(array_unique($clean)) !== count($clean)) {
            throw new \InvalidArgumentException('同じ選択肢が2つあります');
        }
        $pos = $def['position'] ?? null;
        $position = ($pos === null || $pos === '') ? 100 : (is_numeric($pos) && (float) $pos == (int) $pos ? (int) $pos : -1);
        if ($position < 0 || $position > 10000) {
            throw new \InvalidArgumentException('並び順は 0〜10000 の整数にしてください');
        }
        return ['name' => $name, 'choices' => $clean, 'position' => $position, 'single' => array_key_exists('single', $def) && $def['single'] !== null ? (bool) $def['single'] : true];
    }

    public static function listGroups(App $app): array
    {
        return $app->db()->all('SELECT name, choices, position, single FROM line_tag_groups ORDER BY position, name', [], json: ['choices']);
    }

    public static function saveGroup(App $app, mixed $def): array
    {
        $g = self::validateGroupDef($def);
        $now = $app->now();
        $app->db()->exec(
            'INSERT INTO line_tag_groups (name, choices, position, single, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE choices = VALUES(choices), position = VALUES(position), single = VALUES(single), updated_at = VALUES(updated_at)',
            [$g['name'], Json::enc($g['choices']), $g['position'], $g['single'], $now, $now]
        );
        return ['name' => $g['name']];
    }

    public static function deleteGroup(App $app, string $name): array
    {
        $n = $app->db()->exec('DELETE FROM line_tag_groups WHERE name = ?', [self::normalizeTagName($name)]);
        return ['ok' => $n > 0];
    }

    /** 種類が無ければ作り、あれば足りない選択肢を後ろに足す（アンケート・ひな形から使う） */
    public static function ensureGroup(App $app, string $name, array $choices = []): array
    {
        $n = self::normalizeTagName($name);
        $cur = $app->db()->one('SELECT choices FROM line_tag_groups WHERE name = ?', [$n], json: ['choices']);
        if (!$cur) {
            return self::saveGroup($app, ['name' => $n, 'choices' => $choices]);
        }
        $merged = $cur['choices'];
        foreach (array_filter(array_map([self::class, 'normalizeTagName'], $choices), fn ($c) => $c !== '') as $c) {
            if (!in_array($c, $merged, true)) {
                $merged[] = $c;
            }
        }
        if (count($merged) !== count($cur['choices'])) {
            self::validateGroupDef(['name' => $n, 'choices' => $merged]);
            $app->db()->exec('UPDATE line_tag_groups SET choices = ?, updated_at = ? WHERE name = ?', [Json::enc($merged), $app->now(), $n]);
        }
        return ['name' => $n];
    }

    /** このタグが、登録した属性の値か（「校種:中学校」→ 校種）。属性でなければ null */
    public static function groupOfTag(App $app, string $tag): ?array
    {
        $t = self::normalizeTagName($tag);
        if (!str_contains($t, ':')) {
            return null;
        }
        return $app->db()->one('SELECT name, single FROM line_tag_groups WHERE LEFT(?, CHAR_LENGTH(name) + 1) = CONCAT(name, \':\') LIMIT 1', [$t]);
    }

    /** 同じ種類の、ほかの値のタグを外す。外した数 */
    public static function removeSiblingValues(App $app, string $userId, string $group, string $keepTag): int
    {
        return $app->db()->exec(
            'DELETE ft FROM line_friend_tags ft JOIN line_tags t ON t.id = ft.tag_id
             WHERE ft.line_user_id = ? AND LEFT(t.name, CHAR_LENGTH(?) + 1) = CONCAT(?, \':\') AND t.name <> ?',
            [$userId, $group, $group, $keepTag]
        );
    }

    /** この人の、属性ごとの値（{ 校種: ['中学校'], … }） */
    public static function attributesOf(App $app, string $userId): array
    {
        $rows = $app->db()->all(
            'SELECT g.name AS grp, SUBSTRING(t.name, CHAR_LENGTH(g.name) + 2) AS value
             FROM line_tag_groups g
               JOIN line_tags t ON LEFT(t.name, CHAR_LENGTH(g.name) + 1) = CONCAT(g.name, \':\')
               JOIN line_friend_tags ft ON ft.tag_id = t.id AND ft.line_user_id = ?
             ORDER BY g.position, g.name, t.name',
            [$userId]
        );
        $out = [];
        foreach ($rows as $x) {
            $out[$x['grp']][] = $x['value'];
        }
        return $out;
    }

    /** 属性ごとの人数（ブロックしていない友だち） */
    public static function stats(App $app): array
    {
        $groups = self::listGroups($app);
        if (!$groups) {
            return [];
        }
        $db = $app->db();
        $total = (int) $db->value("SELECT COUNT(*) FROM line_friends WHERE status = 'active'");
        $counts = $db->all(
            "SELECT g.name AS grp, SUBSTRING(t.name, CHAR_LENGTH(g.name) + 2) AS value, COUNT(f.line_user_id) AS n
             FROM line_tag_groups g
               JOIN line_tags t ON LEFT(t.name, CHAR_LENGTH(g.name) + 1) = CONCAT(g.name, ':')
               JOIN line_friend_tags ft ON ft.tag_id = t.id
               JOIN line_friends f ON f.line_user_id = ft.line_user_id AND f.status = 'active'
             GROUP BY g.name, t.name"
        );
        $answered = $db->all(
            "SELECT g.name AS grp, COUNT(DISTINCT f.line_user_id) AS n
             FROM line_tag_groups g
               JOIN line_tags t ON LEFT(t.name, CHAR_LENGTH(g.name) + 1) = CONCAT(g.name, ':')
               JOIN line_friend_tags ft ON ft.tag_id = t.id
               JOIN line_friends f ON f.line_user_id = ft.line_user_id AND f.status = 'active'
             GROUP BY g.name"
        );
        $out = [];
        foreach ($groups as $g) {
            $mine = array_values(array_filter($counts, fn ($c) => $c['grp'] === $g['name']));
            $values = [];
            foreach ($g['choices'] as $c) {
                $n = 0;
                foreach ($mine as $m) {
                    if ($m['value'] === $c) {
                        $n = (int) $m['n'];
                    }
                }
                $values[] = ['value' => $c, 'n' => $n, 'listed' => true];
            }
            foreach ($mine as $m) {
                if (!in_array($m['value'], $g['choices'], true)) {
                    $values[] = ['value' => $m['value'], 'n' => (int) $m['n'], 'listed' => false];
                }
            }
            $a = 0;
            foreach ($answered as $x) {
                if ($x['grp'] === $g['name']) {
                    $a = (int) $x['n'];
                }
            }
            $out[] = $g + ['total' => $total, 'unanswered' => max(0, $total - $a), 'values' => $values];
        }
        return $out;
    }
}
