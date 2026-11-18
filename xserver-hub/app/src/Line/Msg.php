<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\Json;
use Hub\Kernel\Text;

/**
 * LINE のメッセージの小さな部品（line-hub の util.js のメッセージの部分）。
 *   ・文字列は text メッセージにし、{{display_name}} などを差し込む（eval はしない）
 *   ・LINE に投げる前の検査（1回5件・テキスト5000字・動画は https）
 *   ・「特別なメッセージ」の印（アンケート・動画特典・日程選び）。送る直前に本物に置き換える（Special）
 */
final class Msg
{
    public const SPECIAL_TYPES = ['survey', 'video_offer', 'event_picker'];
    private const MESSAGE_TYPES = ['text', 'image', 'video', 'audio', 'location', 'sticker', 'imagemap', 'template', 'flex'];
    private const TRACKING_RE = '/^[A-Za-z0-9\-.=,+*()%$&;:@{}!?<>\[\]]{1,100}$/';

    /** @return list<array> */
    public static function chunk(array $arr, int $size): array
    {
        return array_chunk(array_values($arr), $size);
    }

    /** {{ path.to.var }} を差し込む。無い名前は空文字 */
    public static function render(string $str, array $vars = []): string
    {
        return (string) preg_replace_callback('/\{\{\s*([\w.]+)\s*\}\}/u', static function (array $m) use ($vars): string {
            $cur = $vars;
            foreach (explode('.', $m[1]) as $k) {
                if (is_array($cur) && array_key_exists($k, $cur)) {
                    $cur = $cur[$k];
                } elseif (is_object($cur) && property_exists($cur, $k)) {
                    $cur = $cur->{$k};
                } else {
                    return '';
                }
            }
            if ($cur === null) {
                return '';
            }
            if (is_bool($cur)) {
                return $cur ? 'true' : 'false';
            }
            return is_scalar($cur) ? (string) $cur : '';
        }, $str);
    }

    /** 1つのメッセージ（表）か、メッセージの並びか */
    public static function asList(mixed $messages): array
    {
        if (is_array($messages) && array_is_list($messages)) {
            return $messages;
        }
        return [$messages];
    }

    /** 文字列は text メッセージに変換し、text には差し込みを適用する */
    public static function normalize(mixed $messages, array $vars = []): array
    {
        $out = [];
        foreach (self::asList($messages) as $m) {
            if (is_string($m)) {
                $out[] = ['type' => 'text', 'text' => self::render($m, $vars)];
            } elseif (is_array($m) && ($m['type'] ?? null) === 'text') {
                $m['text'] = self::render((string) ($m['text'] ?? ''), $vars);
                $out[] = $m;
            } else {
                $out[] = $m;
            }
        }
        return $out;
    }

    public static function isSpecial(mixed $m): bool
    {
        return is_array($m) && in_array($m['type'] ?? null, self::SPECIAL_TYPES, true);
    }

    /** LINE に投げる前の検査。allowSpecial：「特別なメッセージ」の印も通す（保存のとき） */
    public static function validate(mixed $messages, bool $allowSpecial = false): array
    {
        if (!is_array($messages) || !array_is_list($messages) || !$messages) {
            throw new \InvalidArgumentException('メッセージが空です');
        }
        if (count($messages) > 5) {
            throw new \InvalidArgumentException('1回に送れるメッセージは5件までです');
        }
        $last = count($messages) - 1;
        foreach ($messages as $i => $m) {
            if ($allowSpecial && self::isSpecial($m)) {
                if ($m['type'] === 'survey') {
                    if (trim((string) ($m['survey'] ?? '')) === '') {
                        throw new \InvalidArgumentException('アンケートの名前が必要です');
                    }
                    if ($i !== $last) {
                        throw new \InvalidArgumentException('アンケートは、その回のメッセージの最後に置いてください（あとに別のメッセージが届くと、答えるボタンが消えるため）');
                    }
                }
                if ($m['type'] === 'video_offer' && trim((string) ($m['offer'] ?? '')) === '') {
                    throw new \InvalidArgumentException('動画特典のキーが必要です');
                }
                if ($m['type'] === 'event_picker') {
                    if ($i !== $last) {
                        throw new \InvalidArgumentException('日程を選ぶボタンは、その回のメッセージの最後に置いてください（あとに別のメッセージが届くと、ボタンが消えるため）');
                    }
                    if (isset($m['text']) && mb_strlen((string) $m['text']) > 1000) {
                        throw new \InvalidArgumentException('日程を選ぶメッセージの文は1000文字までです');
                    }
                    if (isset($m['keyPrefix']) && !preg_match('/^[A-Za-z0-9_.-]{0,40}$/', (string) $m['keyPrefix'])) {
                        throw new \InvalidArgumentException('日程を選ぶ：イベントのキーの頭は、半角の英数字（40文字まで）にしてください');
                    }
                    if (isset($m['days']) && (!is_int($m['days']) || $m['days'] < 1 || $m['days'] > 365)) {
                        throw new \InvalidArgumentException('日程を選ぶ：何日先までを並べるかは、1〜365 の整数にしてください');
                    }
                }
                continue;
            }
            $type = is_array($m) ? ($m['type'] ?? null) : null;
            if (!is_array($m) || !in_array($type, self::MESSAGE_TYPES, true)) {
                throw new \InvalidArgumentException('未対応のメッセージ種別です: ' . (is_scalar($type) ? (string) $type : 'undefined'));
            }
            if ($type === 'text') {
                $t = $m['text'] ?? '';
                if (!is_string($t) || $t === '') {
                    throw new \InvalidArgumentException('テキストが空です');
                }
                if (Text::jsLength($t) > 5000) {
                    throw new \InvalidArgumentException('テキストは5000文字までです');
                }
            }
            if ($type === 'video') {
                $u = (string) ($m['originalContentUrl'] ?? '');
                $p = (string) ($m['previewImageUrl'] ?? '');
                if (!preg_match('#^https://\S+$#i', $u) || strlen($u) > 2000) {
                    throw new \InvalidArgumentException('動画の URL は https:// から始まる mp4 の URL（2000文字まで）にしてください');
                }
                if (!preg_match('#^https://\S+$#i', $p) || strlen($p) > 2000) {
                    throw new \InvalidArgumentException('動画のプレビュー画像の URL は https:// から始まる JPEG／PNG の URL（2000文字まで）にしてください');
                }
                if (isset($m['trackingId']) && !preg_match(self::TRACKING_RE, (string) $m['trackingId'])) {
                    throw new \InvalidArgumentException('動画の trackingId は、半角の英数字と一部の記号で100文字までです');
                }
            }
        }
        return $messages;
    }

    /** 記録用の短い要約（最初の text。無ければ［動画］など） */
    public static function preview(mixed $messages, int $max = 200): string
    {
        $list = is_array($messages) ? $messages : [];
        $t = null;
        foreach ($list as $m) {
            if (is_array($m) && ($m['type'] ?? null) === 'text') {
                $t = (string) ($m['text'] ?? '');
                break;
            }
        }
        if ($t === null) {
            $first = $list[0] ?? null;
            $type = is_array($first) ? ($first['type'] ?? 'message') : 'message';
            $t = '[' . ($type === 'video' ? '動画' : $type) . ']';
        }
        return mb_strlen($t) > $max ? mb_substr($t, 0, $max) . '…' : $t;
    }

    /** チャットで見る全文（文字以外は［画像］などの印）。5000字まで */
    public static function bodyText(mixed $messages): string
    {
        $parts = [];
        foreach (is_array($messages) ? $messages : [] as $m) {
            $parts[] = is_array($m) && ($m['type'] ?? null) === 'text' ? (string) ($m['text'] ?? '') : '［' . (is_array($m) ? ($m['type'] ?? 'message') : 'message') . '］';
        }
        return mb_substr(implode("\n\n", $parts), 0, 5000);
    }

    public static function hasQuickReply(mixed $messages): bool
    {
        foreach (is_array($messages) ? $messages : [] as $m) {
            if (is_array($m) && !empty($m['quickReply']['items'])) {
                return true;
            }
        }
        return false;
    }

    /** JSON の文字列の中に {{ が入っているか（一斉配信では差し込みを使えない） */
    public static function hasPlaceholder(mixed $messages): bool
    {
        return str_contains(Json::enc($messages ?? ''), '{{');
    }
}
