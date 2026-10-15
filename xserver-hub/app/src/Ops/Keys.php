<?php
declare(strict_types=1);

namespace Hub\Ops;

use Hub\Kernel\App;
use Hub\Kernel\Crypto;
use Hub\Line\Secure;

/**
 * 暗号の鍵の入れ替え。
 *   1) config.php の keys.data に新しい鍵を足し、keys.data_primary をその名前にする（古い鍵は消さない）
 *   2) bin/hub keys:rotate-data … 暗号化してある列を、すべて新しい鍵で暗号化し直す
 *   3) 古い鍵で暗号化したものが 0 になったら、古い鍵を config.php から消してよい
 */
final class Keys
{
    /** 暗号化している列：表・主キー・列・列の名前（aad） */
    public const COLUMNS = [
        ['line_events', ['webhook_event_id'], 'payload', Secure::EVENT_PAYLOAD],
        ['line_message_log', ['id'], 'text_preview', Secure::LOG_PREVIEW],
        ['line_message_log', ['id'], 'body', Secure::LOG_BODY],
        ['line_message_log', ['id'], 'messages', Secure::LOG_MESSAGES],
        ['line_outbox', ['id'], 'messages', Secure::OUTBOX_MESSAGES],
        ['line_friends', ['line_user_id'], 'note', Secure::FRIEND_NOTE],
        ['line_zoom_log', ['id'], 'user_name', Secure::ZOOM_NAME],
        ['line_zoom_log', ['id'], 'email', Secure::ZOOM_EMAIL],
        ['line_event_attendance', ['event_id', 'participant_key'], 'user_name', Secure::ZOOM_NAME],
        ['line_event_attendance', ['event_id', 'participant_key'], 'email', Secure::ZOOM_EMAIL],
        ['hub_admins', ['id'], 'totp_secret', 'hub_admins.totp_secret'],
    ];

    /** @return array<string,int> 鍵ごとの、暗号文の数 */
    public static function census(App $app): array
    {
        $out = [];
        foreach (self::COLUMNS as [$table, , $col]) {
            foreach ($app->db()->all("SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(`{$col}`, '.', 2), '.', -1) AS kid, COUNT(*) AS n FROM `{$table}` WHERE `{$col}` LIKE 'e1.%' GROUP BY kid") as $r) {
                $out[$r['kid']] = ($out[$r['kid']] ?? 0) + (int) $r['n'];
            }
        }
        return $out;
    }

    /** いまの鍵（data_primary）以外で暗号化してあるものを、いまの鍵で暗号化し直す。@return int 直した数 */
    public static function rotate(App $app, ?callable $say = null): int
    {
        $crypto = $app->crypto();
        $primary = $crypto->primaryKeyId();
        $db = $app->db();
        $total = 0;
        foreach (self::COLUMNS as [$table, $pk, $col, $aad]) {
            $pkSql = implode(',', array_map(fn ($c) => "`{$c}`", $pk));
            $where = implode(' AND ', array_map(fn ($c) => "`{$c}` = ?", $pk));
            $n = 0;
            while (true) {
                $rows = $db->all("SELECT {$pkSql}, `{$col}` AS v FROM `{$table}` WHERE `{$col}` LIKE 'e1.%' AND `{$col}` NOT LIKE ? LIMIT 500", ['e1.' . $primary . '.%']);
                if (!$rows) {
                    break;
                }
                foreach ($rows as $r) {
                    $plain = $crypto->decrypt($r['v'], $aad);
                    $params = [$crypto->encrypt($plain, $aad)];
                    foreach ($pk as $c) {
                        $params[] = $r[$c];
                    }
                    $db->exec("UPDATE `{$table}` SET `{$col}` = ? WHERE {$where}", $params);
                    $n++;
                }
            }
            if ($n && $say) {
                $say("{$table}.{$col}：{$n} 件");
            }
            $total += $n;
        }
        $app->kv()->delete('line.stateless_token');
        return $total;
    }

    public static function generate(): string
    {
        return Crypto::generateKey();
    }
}
