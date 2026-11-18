<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;

/** 友だち台帳：友だち追加／ブロック／プロフィール／タグ／友だち情報（line-hub の friends.js） */
final class Friends
{
    public static function upsertFollow(App $app, string $userId): void
    {
        $now = $app->now();
        $app->db()->exec(
            "INSERT INTO line_friends (line_user_id, status, followed_at, created_at, updated_at) VALUES (?, 'active', ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = 'active', blocked_at = NULL, followed_at = VALUES(followed_at), updated_at = VALUES(updated_at)",
            [$userId, $now, $now, $now]
        );
    }

    /** メッセージを送ってきた人が台帳に居なければ追加する（友だち追加の取りこぼし対策）。ブロック中なら active に戻す */
    public static function ensure(App $app, string $userId): void
    {
        $now = $app->now();
        // 並びに注意：status を最後に書き換える（先に書き換えると、IF の判定が新しい値を見てしまう）
        $app->db()->exec(
            "INSERT INTO line_friends (line_user_id, status, created_at, updated_at) VALUES (?, 'active', ?, ?)
             ON DUPLICATE KEY UPDATE
               blocked_at = IF(status <> 'active', NULL, blocked_at),
               updated_at = IF(status <> 'active', VALUES(updated_at), updated_at),
               status = 'active'",
            [$userId, $now, $now]
        );
    }

    public static function refreshProfile(App $app, string $userId): bool
    {
        $r = $app->line()->getProfile($userId);
        if ($r['ok'] && is_array($r['body'])) {
            $b = $r['body'];
            $app->db()->exec(
                'UPDATE line_friends SET display_name = ?, picture_url = ?, language = ?, updated_at = ? WHERE line_user_id = ?',
                [self::clip($b['displayName'] ?? null, 200), self::clip($b['pictureUrl'] ?? null, 1000), self::clip($b['language'] ?? null, 20), $app->now(), $userId]
            );
        }
        return (bool) $r['ok'];
    }

    public static function markUnfollow(App $app, string $userId): void
    {
        $now = $app->now();
        $app->db()->exec("UPDATE line_friends SET status = 'blocked', blocked_at = ?, updated_at = ? WHERE line_user_id = ?", [$now, $now, $userId]);
    }

    /** 友だちの行（メモは暗号化したまま。画面に出すときは decNote） */
    public static function get(App $app, string $userId): ?array
    {
        return $app->db()->one('SELECT * FROM line_friends WHERE line_user_id = ?', [$userId]);
    }

    /** @return list<string> */
    public static function tagNames(App $app, string $userId): array
    {
        return array_column($app->db()->all(
            'SELECT t.name FROM line_friend_tags ft JOIN line_tags t ON t.id = ft.tag_id WHERE ft.line_user_id = ? ORDER BY t.name',
            [$userId]
        ), 'name');
    }

    /** @return array<string,?string> */
    public static function fields(App $app, string $userId): array
    {
        $out = [];
        foreach ($app->db()->all('SELECT `key`, value FROM line_friend_fields WHERE line_user_id = ? ORDER BY `key`', [$userId]) as $r) {
            $out[$r['key']] = $r['value'];
        }
        return $out;
    }

    /** 低レベル：タグを付ける（ルールの連鎖やシナリオ停止は Rules::applyTag が担当）。@return array{added:bool} */
    public static function addTag(App $app, string $userId, string $name): array
    {
        $tag = Attributes::normalizeTagName($name);
        if ($tag === '') {
            throw new \InvalidArgumentException('タグ名が空です');
        }
        if (mb_strlen($tag) > 100) {
            throw new \InvalidArgumentException('タグ名は100文字までです');
        }
        $db = $app->db();
        $now = $app->now();
        // 無ければ作る。あれば、その id（LAST_INSERT_ID の決まった使い方）
        $db->exec('INSERT INTO line_tags (name, created_at) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)', [$tag, $now]);
        $tagId = $db->lastId();
        $n = $db->exec(
            'INSERT INTO line_friend_tags (line_user_id, tag_id, created_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tag_id = tag_id',
            [$userId, $tagId, $now]
        );
        return ['added' => $n === 1];
    }

    /** @return array{removed:bool} */
    public static function removeTag(App $app, string $userId, string $name): array
    {
        $n = $app->db()->exec(
            'DELETE FROM line_friend_tags WHERE line_user_id = ? AND tag_id = (SELECT id FROM line_tags WHERE name = ?)',
            [$userId, Attributes::normalizeTagName($name)]
        );
        return ['removed' => $n > 0];
    }

    public static function setField(App $app, string $userId, mixed $key, mixed $value): void
    {
        $k = trim(is_scalar($key) ? (string) $key : '');
        if ($k === '') {
            throw new \InvalidArgumentException('友だち情報のキーが空です');
        }
        if (mb_strlen($k) > 50) {
            throw new \InvalidArgumentException('友だち情報のキーは50文字までです');
        }
        $app->db()->exec(
            'INSERT INTO line_friend_fields (line_user_id, `key`, value, updated_at) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)',
            [$userId, $k, $value === null ? null : (is_bool($value) ? ($value ? 'true' : 'false') : (string) (is_scalar($value) ? $value : '')), $app->now()]
        );
    }

    private static function clip(mixed $v, int $n): ?string
    {
        return is_string($v) ? mb_substr($v, 0, $n) : null;
    }
}
