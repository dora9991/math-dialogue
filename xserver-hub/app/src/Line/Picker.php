<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Time;

/**
 * 日程を選んでもらう：ボタン（登録してあるイベントの日程）か、カレンダー（LINE の日付選択）で、参加する日を選ぶ（line-hub の picker.js）。
 * 選んだら、そのまま申込 → タグ → リマインドまで進む。返信で返すので、通数を使わない。
 *   ボタン：postback lh-event:番号／カレンダー：postback lh-cal:keyPrefix（params.date）
 */
final class Picker
{
    public const EVENT_DATA_RE = '/^lh-event:(\d+)$/';
    public const CAL_DATA_RE = '/^lh-cal:(.{0,40})$/u';
    private const MAX_EVENTS = 12;

    /** これから開催する、申込を受け付けているイベント（満席・開始後は除く）。古い順 */
    public static function upcoming(App $app, string $keyPrefix = '', int $days = 30, int $limit = self::MAX_EVENTS): array
    {
        $now = $app->now();
        return $app->db()->all(
            "SELECT e.* FROM line_calendar_events e
             WHERE e.starts_at > ? AND e.starts_at <= ? AND (? = '' OR LEFT(e.`key`, CHAR_LENGTH(?)) = ?)
               AND (e.capacity IS NULL OR (SELECT COUNT(*) FROM line_event_participants p WHERE p.event_id = e.id AND p.status = 'applied') < e.capacity)
             ORDER BY e.starts_at, e.id LIMIT " . max(1, $limit),
            [$now, Time::addSeconds($now, $days * 86400), $keyPrefix, $keyPrefix, $keyPrefix]
        );
    }

    /** ボタンの文字（20文字まで）：10/22(水) 21:00 */
    public static function label(array $ev, int $tz): string
    {
        $s = Time::formatJa(Time::parse($ev['starts_at']), $tz);
        $s = preg_replace('/月/u', '/', $s, 1) ?? $s;
        return preg_replace('/日/u', '', $s, 1) ?? $s;
    }

    /** 日程を選ぶメッセージ。開催が無ければ、その旨だけ（quietIfNone なら null） */
    public static function message(App $app, array $opt): ?array
    {
        $text = $opt['text'] ?? null;
        $keyPrefix = (string) ($opt['keyPrefix'] ?? '');
        $days = (int) ($opt['days'] ?? 30);
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $evs = self::upcoming($app, $keyPrefix, $days);
        if (!$evs) {
            return !empty($opt['quietIfNone']) ? null : ['type' => 'text', 'text' => 'いま受け付けている日程はありません。決まりしだい、お知らせします。'];
        }
        // 文の中の一覧は6件まで（長くなりすぎないように）。ボタンは12件まで並ぶ
        $lines = array_map(fn ($e) => '・' . self::label($e, $tz) . '　' . $e['title'], array_slice($evs, 0, 6));
        if (count($evs) > 6) {
            $lines[] = 'ほか ' . (count($evs) - 6) . '日（下のボタンから選べます）';
        }
        $ymd = fn (\DateTimeImmutable $d) => Time::ymd($d, $tz);
        $now = $app->now();
        $items = [[
            'type' => 'action',
            'action' => ['type' => 'datetimepicker', 'label' => 'カレンダーで選ぶ', 'data' => 'lh-cal:' . $keyPrefix, 'mode' => 'date', 'initial' => $ymd($now), 'min' => $ymd($now), 'max' => $ymd(Time::addSeconds($now, $days * 86400))],
        ]];
        foreach ($evs as $e) {
            $items[] = ['type' => 'action', 'action' => ['type' => 'postback', 'label' => self::label($e, $tz), 'data' => 'lh-event:' . $e['id'], 'displayText' => self::label($e, $tz) . 'に参加します']];
        }
        return [
            'type' => 'text',
            'text' => mb_substr(($text ?: '参加したい日を、下のボタンから選んでください。') . "\n\n" . implode("\n", $lines), 0, 5000),
            'quickReply' => ['items' => $items],
        ];
    }

    /** 日程のボタン・カレンダーの答え。日程のボタンでなければ null */
    public static function handleAnswer(App $app, string $userId, string $data, ?array $params, Env $env): ?array
    {
        $tz = (int) Settings::get($app)['timezone_offset_min'];
        $apply = function (array $ev) use ($app, $env, $tz): array {
            Rules::executeActions($app, [['type' => 'event_apply', 'event' => $ev['key']]], $env, 'event_picker');
            return ['label' => '（日程を選びました：' . self::label($ev, $tz) . '　' . $ev['title'] . '）'];
        };
        if (preg_match(self::EVENT_DATA_RE, $data, $m)) {
            $ev = $app->db()->one('SELECT * FROM line_calendar_events WHERE id = ?', [(int) $m[1]]);
            if (!$ev) {
                $env->replyBuffer->push(['type' => 'text', 'text' => 'この日程は、見つかりませんでした（取り消された可能性があります）。']);
                return ['label' => '（日程を選びました：見つからない日程）'];
            }
            return $apply($ev);
        }
        if (!preg_match(self::CAL_DATA_RE, $data, $c)) {
            return null;
        }
        $keyPrefix = $c[1];
        $date = (string) ($params['date'] ?? '');
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $dm)) {
            $env->replyBuffer->push(['type' => 'text', 'text' => '日付を受け取れませんでした。もう一度、カレンダーから選んでください。']);
            return ['label' => '（カレンダー：日付なし）'];
        }
        // 選んだ日（日本時間の0時〜翌0時）に始まる、申込を受け付けているイベント
        $from = Time::fromLocal((int) $dm[1], (int) $dm[2], (int) $dm[3], 0, 0, $tz);
        $to = Time::addSeconds($from, 86400);
        $evs = array_values(array_filter(self::upcoming($app, $keyPrefix, 400, 50), function ($e) use ($from, $to) {
            $t = Time::parse($e['starts_at']);
            return $t >= $from && $t < $to;
        }));
        $md = (int) $dm[2] . '/' . (int) $dm[3];
        if (count($evs) === 1) {
            return $apply($evs[0]);
        }
        if (count($evs) > 1) {
            $items = array_map(fn ($e) => ['type' => 'action', 'action' => ['type' => 'postback', 'label' => self::label($e, $tz), 'data' => 'lh-event:' . $e['id'], 'displayText' => self::label($e, $tz) . 'に参加します']], array_slice($evs, 0, 13));
            $env->replyBuffer->push(['type' => 'text', 'text' => "{$md} は、" . count($evs) . 'つあります。どれに参加しますか？', 'quickReply' => ['items' => $items]]);
            return ['label' => "（カレンダーで {$md} を選びました：複数あり）"];
        }
        $list = self::message($app, ['text' => "{$md} は、開催がありません。開催日は、次のとおりです。", 'keyPrefix' => $keyPrefix]);
        if ($list) {
            $env->replyBuffer->push($list);
        }
        return ['label' => "（カレンダーで {$md} を選びました：開催なし）"];
    }
}
