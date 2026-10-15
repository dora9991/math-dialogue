<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;

/**
 * ひな形（テンプレート）：よく使う形の、ステップ配信・アンケート・属性・ルール・動画特典を、ひとまとめに作る（line-hub の templates.js）。
 * 中身（文面）は app/data/templates.json（line-hub の templates.js から書き出したもの）。
 *   ・ひとりでに動き出すもの（友だち追加・タグで始まる配信、キーワードのルール、動画特典）は、止めた状態で作る
 *   ・同じ名前がすでにあれば、後ろに（2）（3）…を付けて、別に作る（いまあるものを書き換えない）
 */
final class Templates
{
    private static ?array $data = null;

    private static function data(): array
    {
        return self::$data ??= Json::dec((string) file_get_contents(\dirname(__DIR__, 2) . '/data/templates.json'));
    }

    public static function list(): array
    {
        return self::data()['templates'];
    }

    private static function def(string $key): array
    {
        $d = self::data()['defs'][$key] ?? null;
        if (!is_array($d)) {
            throw new \InvalidArgumentException("未知のひな形です: {$key}");
        }
        return $d;
    }

    /** ステップの「いつ」を、日本語で（プレビュー用） */
    private static function whenOf(array $s): string
    {
        $t = !empty($s['atTime']) ? ' ' . $s['atTime'] : '';
        if (($s['anchor'] ?? null) === 'event') {
            return !empty($s['offsetDays']) ? 'イベントの' . (-$s['offsetDays']) . "日前{$t}" : 'イベントの' . (!empty($s['offsetMinutes']) ? (-$s['offsetMinutes']) . '分前' : '開始時');
        }
        if (empty($s['offsetDays']) && empty($s['atTime']) && empty($s['offsetMinutes'])) {
            return '登録直後';
        }
        if (empty($s['offsetDays']) && !empty($s['offsetMinutes'])) {
            return $s['offsetMinutes'] . '分後';
        }
        return ($s['offsetDays'] ?? 0) . "日後{$t}";
    }

    private static function firstLine(mixed $m): string
    {
        $t = is_string($m) ? $m : (is_array($m) ? (string) ($m['text'] ?? '') : '');
        return mb_substr(explode("\n", $t)[0], 0, 40);
    }

    private static function markOf(mixed $m): ?string
    {
        $type = is_array($m) ? ($m['type'] ?? null) : null;
        return match ($type) {
            'event_picker' => '［日程を選ぶボタン］',
            'survey' => "［アンケート「{$m['survey']}」］",
            'video_offer' => "［動画「{$m['offer']}」］",
            default => null,
        };
    }

    public static function preview(string $key): array
    {
        $d = self::def($key);
        $out = [];
        foreach ($d['attributes'] ?? [] as $a) {
            $out[] = ['kind' => 'attribute', 'name' => $a['name'], 'detail' => implode('・', $a['choices'])];
        }
        foreach ($d['surveys'] ?? [] as $s) {
            $out[] = ['kind' => 'survey', 'name' => $s['name'], 'enabled' => $s['enabled'] ?? null, 'detail' => implode('→', array_column($s['questions'], 'attribute')), 'lines' => array_column($s['questions'], 'text')];
        }
        foreach ($d['videoOffers'] ?? [] as $v) {
            $out[] = ['kind' => 'video', 'name' => $v['name'], 'enabled' => $v['enabled'] ?? null, 'detail' => '見てから' . $v['deadlineHours'] . '時間以内に特典'];
        }
        foreach ($d['rules'] ?? [] as $r) {
            $out[] = ['kind' => 'rule', 'name' => $r['name'], 'enabled' => $r['enabled'] ?? null, 'detail' => "キーワード「{$r['pattern']}」"];
        }
        $fromReply = [];
        foreach ($d['scenarios'] ?? [] as $x) {
            if (!empty($x['replyScenario'])) {
                $fromReply[$x['replyScenario']] = $x['name'];
            }
        }
        foreach ($d['scenarios'] ?? [] as $s) {
            $eventBased = false;
            foreach ($s['steps'] as $st) {
                if (($st['anchor'] ?? null) === 'event') {
                    $eventBased = true;
                }
            }
            $detail = array_filter([
                !empty($s['startOnFollow']) ? '友だち追加で始まる' : null,
                !empty($s['startOnTags']) ? 'タグ「' . implode('・', $s['startOnTags']) . '」で始まる' : null,
                isset($fromReply[$s['name']]) ? '「' . $fromReply[$s['name']] . '」で返事をくれた人が移る' : null,
                $eventBased ? 'イベントの申込で始まる' : null,
                !empty($s['stopOnReply']) ? '返事があったら「' . ($s['replyScenario'] ?? '') . '」へ' : null,
            ]);
            $out[] = [
                'kind' => 'scenario', 'name' => $s['name'], 'enabled' => $s['enabled'] ?? null,
                'detail' => $detail ? implode('／', $detail) : 'ルールから始める',
                'steps' => array_map(fn ($st) => [
                    'when' => self::whenOf($st),
                    'first' => self::firstLine($st['messages'][0] ?? null),
                    'extra' => array_values(array_filter(array_map([self::class, 'markOf'], $st['messages']))),
                ], $s['steps']),
            ];
        }
        return $out;
    }

    private static function uniqueName(App $app, string $table, string $base, string $col = 'name'): string
    {
        for ($i = 1; $i < 100; $i++) {
            $name = $i === 1 ? $base : "{$base}（{$i}）";
            if (!$app->db()->one("SELECT 1 AS ok FROM {$table} WHERE `{$col}` = ?", [$name])) {
                return $name;
            }
        }
        throw new \InvalidArgumentException('同じ名前のものが多すぎます');
    }

    /** ひな形から作る。作ったもの（種類と名前）の一覧 */
    public static function apply(App $app, string $key): array
    {
        $d = self::def($key);
        $created = [];
        $rename = [];
        foreach (array_values($d['attributes'] ?? []) as $i => $a) {
            Attributes::ensureGroup($app, $a['name'], $a['choices']);
            $app->db()->exec('UPDATE line_tag_groups SET position = ? WHERE name = ? AND position = 100', [($i + 1) * 10, $a['name']]);
            $created[] = ['kind' => 'attribute', 'name' => $a['name']];
        }
        $mapMsgs = function (array $msgs) use (&$rename): array {
            return array_map(function ($m) use (&$rename) {
                if (is_array($m) && ($m['type'] ?? null) === 'survey' && isset($rename['survey:' . $m['survey']])) {
                    $m['survey'] = $rename['survey:' . $m['survey']];
                } elseif (is_array($m) && ($m['type'] ?? null) === 'video_offer' && isset($rename['video:' . $m['offer']])) {
                    $m['offer'] = $rename['video:' . $m['offer']];
                }
                return $m;
            }, $msgs);
        };
        // ひな形の中のアンケート・動画特典の印は、いま本当にあるものだけ残す
        $keepReal = function (array $msgs) use ($app, $mapMsgs): array {
            $out = [];
            foreach ($mapMsgs($msgs) as $m) {
                $type = is_array($m) ? ($m['type'] ?? null) : null;
                if ($type === 'video_offer' && !$app->db()->one('SELECT 1 AS ok FROM line_video_offers WHERE `key` = ?', [(string) $m['offer']])) {
                    continue;
                }
                if ($type === 'survey' && !$app->db()->one('SELECT 1 AS ok FROM line_surveys WHERE name = ?', [(string) $m['survey']])) {
                    continue;
                }
                $out[] = $m;
            }
            return $out;
        };
        foreach ($d['surveys'] ?? [] as $s) {
            $name = self::uniqueName($app, 'line_surveys', $s['name']);
            $rename['survey:' . $s['name']] = $name;
            Surveys::upsert($app, ['name' => $name, 'doneExtra' => isset($s['doneExtra']) ? $mapMsgs($s['doneExtra']) : null] + $s);
            $created[] = ['kind' => 'survey', 'name' => $name];
        }
        foreach ($d['videoOffers'] ?? [] as $v) {
            $k = self::uniqueName($app, 'line_video_offers', $v['key'], 'key');
            $rename['video:' . $v['key']] = $k;
            Videos::upsert($app, ['key' => $k, 'bonusMessages' => $mapMsgs(Msg::asList($v['bonusMessages']))] + $v);
            $created[] = ['kind' => 'video', 'name' => $k];
        }
        foreach ($d['rules'] ?? [] as $r) {
            $name = self::uniqueName($app, 'line_rules', $r['name']);
            $actions = array_map(function ($a) use (&$rename, $mapMsgs) {
                if (($a['type'] ?? null) === 'bonus_claim' && isset($rename['video:' . $a['offer']])) {
                    $a['offer'] = $rename['video:' . $a['offer']];
                } elseif (in_array($a['type'] ?? null, ['reply', 'push'], true)) {
                    $a['messages'] = $mapMsgs(Msg::asList($a['messages']));
                }
                return $a;
            }, $r['actions']);
            $v = Rules::validate(['name' => $name, 'actions' => $actions] + $r);
            $now = $app->now();
            $app->db()->exec(
                'INSERT INTO line_rules (name, enabled, priority, trigger_type, match_mode, pattern, conditions, actions, stop_after, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                [$v['name'], $v['enabled'], $v['priority'], $v['trigger_type'], $v['match_mode'], $v['pattern'], Json::enc(Json::obj($v['conditions'])), Json::enc($v['actions']), $v['stop_after'], $now, $now]
            );
            $created[] = ['kind' => 'rule', 'name' => $name];
        }
        foreach ($d['scenarios'] ?? [] as $s) {
            $name = self::uniqueName($app, 'line_scenarios', $s['name']);
            $rename['scenario:' . $s['name']] = $name;
            $replyScenario = !empty($s['replyScenario']) ? ($rename['scenario:' . $s['replyScenario']] ?? $s['replyScenario']) : null;
            $steps = [];
            foreach ($s['steps'] as $st) {
                $st['messages'] = $keepReal($st['messages']);
                $steps[] = $st;
            }
            $def = ['name' => $name, 'steps' => $steps] + $s;
            if ($replyScenario !== null) {
                $def['replyScenario'] = $replyScenario;
            } else {
                unset($def['replyScenario']);
            }
            Scenarios::upsert($app, $def);
            $created[] = ['kind' => 'scenario', 'name' => $name];
        }
        return ['ok' => true, 'created' => $created];
    }
}
