<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;
use Hub\Kernel\Text;

/**
 * ルールエンジン：トリガー（キーワード／ポストバック／友だち追加／ブロック／タグ付与）→ 条件 → アクション（line-hub の rules.js）。
 *
 * アクション：reply（返信＝無料）／push（すぐ送る＝通数を使う）／tag_add／tag_remove／field_set／enroll／unenroll／
 *             event_apply／notify_admin／member_refresh／survey_start／bonus_claim
 */
final class Rules
{
    private const MAX_DEPTH = 3; // タグ付与→ルール→タグ付与…の連鎖の上限
    public const TRIGGER_TYPES = ['keyword', 'postback', 'follow', 'unfollow', 'tag_added'];
    public const MATCH_MODES = ['exact', 'contains', 'regex'];
    public const ACTION_TYPES = ['reply', 'push', 'tag_add', 'tag_remove', 'field_set', 'enroll', 'unenroll', 'event_apply', 'notify_admin', 'member_refresh', 'survey_start', 'bonus_claim'];

    private const DEFAULT_EVENT_MESSAGES = [
        'messages_ok' => ["【{{event.title}}】のお申し込みを受け付けました。\n日時：{{event.starts_at}}\n{{event.url}}"],
        'messages_full' => ['申し訳ありません。【{{event.title}}】は満席になりました。'],
        'messages_dup' => ['【{{event.title}}】は、すでにお申し込み済みです。'],
        'messages_closed' => ['この日程のお申し込みは終了しています。'],
    ];

    /** JavaScript の正規表現（管理画面で入れたもの）を、PHP（PCRE）の形にする */
    public static function pcre(string $pattern): string
    {
        return '~' . str_replace('~', '\\~', $pattern) . '~iu';
    }

    /** 管理画面から保存するルールの入力チェック。書き間違いを保存の時点で止める */
    public static function validate(mixed $rule): array
    {
        if (!Json::isObjLike($rule)) {
            throw new \InvalidArgumentException('ルールが空です');
        }
        $rule = Json::toArray($rule);
        if (trim((string) ($rule['name'] ?? '')) === '') {
            throw new \InvalidArgumentException('ルール名が必要です');
        }
        $trigger = $rule['trigger_type'] ?? null;
        if (!in_array($trigger, self::TRIGGER_TYPES, true)) {
            throw new \InvalidArgumentException('トリガーは ' . implode(' / ', self::TRIGGER_TYPES) . ' のどれかです');
        }
        $mode = $rule['match_mode'] ?? 'exact';
        if (!in_array($mode, self::MATCH_MODES, true)) {
            throw new \InvalidArgumentException('一致の方法は ' . implode(' / ', self::MATCH_MODES) . ' のどれかです');
        }
        if (in_array($trigger, ['keyword', 'postback', 'tag_added'], true) && trim((string) ($rule['pattern'] ?? '')) === '') {
            throw new \InvalidArgumentException('キーワード（またはタグ名）が必要です');
        }
        if ($mode === 'regex' && $trigger !== 'follow') {
            $p = (string) ($rule['pattern'] ?? '');
            if (mb_strlen($p) > 200) {
                throw new \InvalidArgumentException('正規表現は200文字までです');
            }
            if (@preg_match(self::pcre($p), '') === false) {
                throw new \InvalidArgumentException('正規表現が正しくありません: ' . preg_last_error_msg());
            }
        }
        $actions = $rule['actions'] ?? [];
        if (!is_array($actions) || !$actions || !array_is_list($actions)) {
            throw new \InvalidArgumentException('アクションが1つ以上必要です');
        }
        foreach ($actions as $i => $a) {
            $at = 'アクション' . ($i + 1);
            if (!is_array($a) || !in_array($a['type'] ?? null, self::ACTION_TYPES, true)) {
                throw new \InvalidArgumentException("{$at}：種類は " . implode(' / ', self::ACTION_TYPES) . ' のどれかです');
            }
            $t = $a['type'];
            if ($t === 'reply' || $t === 'push') {
                try {
                    Msg::validate(Msg::normalize($a['messages'] ?? [], ['display_name' => 'x']), true);
                } catch (\InvalidArgumentException $e) {
                    throw new \InvalidArgumentException("{$at}：" . $e->getMessage());
                }
            }
            $need = static fn (string $k): bool => trim(is_scalar($a[$k] ?? null) ? (string) $a[$k] : '') === '';
            if ($t === 'survey_start' && $need('survey')) {
                throw new \InvalidArgumentException("{$at}：アンケートの名前が必要です");
            }
            if ($t === 'bonus_claim' && $need('offer')) {
                throw new \InvalidArgumentException("{$at}：動画特典のキーが必要です");
            }
            if (($t === 'tag_add' || $t === 'tag_remove') && $need('tag')) {
                throw new \InvalidArgumentException("{$at}：タグ名が必要です");
            }
            if ($t === 'field_set' && $need('key')) {
                throw new \InvalidArgumentException("{$at}：友だち情報のキーが必要です");
            }
            if (($t === 'enroll' || $t === 'unenroll') && $need('scenario')) {
                throw new \InvalidArgumentException("{$at}：シナリオ名が必要です");
            }
            if ($t === 'event_apply' && $need('event')) {
                throw new \InvalidArgumentException("{$at}：イベントのキーが必要です");
            }
        }
        $p = [];
        Audience::where($rule['conditions'] ?? [], $p); // 条件の書き間違い（未知の項目）をここで見つける
        $prio = $rule['priority'] ?? null;
        return [
            'name' => trim((string) $rule['name']),
            'enabled' => array_key_exists('enabled', $rule) && $rule['enabled'] !== null ? (bool) $rule['enabled'] : true,
            'priority' => is_numeric($prio) ? (int) $prio : 100,
            'trigger_type' => $trigger,
            'match_mode' => $mode,
            'pattern' => !isset($rule['pattern']) ? null : (string) $rule['pattern'],
            'conditions' => $rule['conditions'] ?? [],
            'actions' => $actions,
            'stop_after' => array_key_exists('stop_after', $rule) && $rule['stop_after'] !== null ? (bool) $rule['stop_after'] : true,
        ];
    }

    public static function loadVars(App $app, string $userId): array
    {
        $f = Friends::get($app, $userId);
        $s = Settings::get($app);
        return ['display_name' => $f['display_name'] ?? '', 'member_plan' => $f['member_plan'] ?? '', 'brand_name' => $s['brand_name'], 'site_url' => $s['site_url']];
    }

    public static function makeEnv(App $app, string $userId, ?string $replyToken = null, int $depth = 0): Env
    {
        return new Env($userId, $replyToken, self::loadVars($app, $userId), $depth);
    }

    private static function matchPattern(array $rule, ?string $text): bool
    {
        $t = Text::normalize($text);
        if ($rule['match_mode'] === 'regex') {
            if (mb_strlen((string) ($rule['pattern'] ?? '')) > 200 || mb_strlen($t) > 500) {
                return false; // 重い正規表現・長い入力は評価しない
            }
            $old = ini_get('pcre.backtrack_limit');
            ini_set('pcre.backtrack_limit', '100000'); // 時間のかかる正規表現で止まらないように
            $r = @preg_match(self::pcre((string) $rule['pattern']), $t);
            ini_set('pcre.backtrack_limit', (string) $old);
            return $r === 1;
        }
        $alts = array_values(array_filter(array_map([Text::class, 'normalize'], explode("\n", (string) ($rule['pattern'] ?? ''))), fn ($a) => $a !== ''));
        foreach ($alts as $a) {
            if ($rule['match_mode'] === 'contains' ? str_contains($t, $a) : $t === $a) {
                return true;
            }
        }
        return false;
    }

    private static function ruleMatches(App $app, array $rule, array $trigger, Env $env): bool
    {
        switch ($rule['trigger_type']) {
            case 'keyword':
                if (!self::matchPattern($rule, $trigger['text'] ?? '')) {
                    return false;
                }
                break;
            case 'postback':
                if (!self::matchPattern($rule, $trigger['data'] ?? '')) {
                    return false;
                }
                break;
            case 'tag_added':
                if (Text::normalize($rule['pattern']) !== Text::normalize($trigger['tag'] ?? '')) {
                    return false;
                }
                break;
        }
        if (!empty($rule['conditions'])) {
            return Audience::userMatches($app, $env->userId, $rule['conditions'], ($trigger['type'] ?? '') === 'unfollow');
        }
        return true;
    }

    /** トリガーに合うルールを優先順に評価し、アクションを実行する。返り値＝当てはまったルールの数 */
    public static function run(App $app, array $trigger, Env $env): int
    {
        $rules = $app->db()->all(
            'SELECT * FROM line_rules WHERE enabled = 1 AND trigger_type = ? ORDER BY priority, id',
            [$trigger['type']],
            json: ['conditions', 'actions']
        );
        $matched = 0;
        foreach ($rules as $rule) {
            if (!self::ruleMatches($app, $rule, $trigger, $env)) {
                continue;
            }
            $matched++;
            self::executeActions($app, $rule['actions'], $env, 'rule:' . $rule['id']);
            if ($rule['stop_after']) {
                break;
            }
        }
        return $matched;
    }

    /**
     * タグを付ける（付いた時の連鎖：「止めるタグ」のシナリオ停止・「始まるきっかけ」のシナリオ開始＋タグ付与トリガーのルール）。
     * 1人1つの属性の値なら、同じ属性の古い値のタグを先に外す
     * @return array{added:bool}
     */
    public static function applyTag(App $app, string $userId, string $rawTag, ?Env $env = null): array
    {
        $tag = Attributes::normalizeTagName($rawTag);
        $g = Attributes::groupOfTag($app, $tag);
        if ($g && $g['single']) {
            Attributes::removeSiblingValues($app, $userId, $g['name'], $tag);
        }
        $r = Friends::addTag($app, $userId, $tag);
        if (!$r['added']) {
            return $r;
        }
        Scenarios::onTagAdded($app, $userId, $tag);
        $depth = $env?->depth ?? 0;
        if ($depth < self::MAX_DEPTH) {
            $e = $env ? $env->child() : self::makeEnv($app, $userId, null, $depth + 1);
            self::run($app, ['type' => 'tag_added', 'tag' => $tag], $e);
            if (!$env) {
                Reply::flush($app, $e); // 手動でタグを付けた場合は、ここで送る
            }
        }
        return $r;
    }

    public static function removeTag(App $app, string $userId, string $tag): array
    {
        return Friends::removeTag($app, $userId, $tag);
    }

    public static function executeActions(App $app, array $actions, Env $env, string $source = 'rule'): void
    {
        $settings = Settings::get($app);
        foreach ($actions as $a) {
            switch ($a['type'] ?? null) {
                case 'reply':
                    $env->replyBuffer->push(...Special::expand($app, $env->userId, Msg::normalize($a['messages'] ?? [], $env->vars)));
                    break;
                case 'push':
                    $msgs = Special::expand($app, $env->userId, Msg::normalize($a['messages'] ?? [], $env->vars));
                    if ($msgs) {
                        Outbox::enqueue($app, [$env->userId], $msgs, 'rule', $source, 50);
                    }
                    break;
                case 'survey_start':
                    $q = Surveys::start($app, $env->userId, (string) $a['survey']);
                    $env->replyBuffer->push($q ?? ['type' => 'text', 'text' => 'このアンケートは、いまは受け付けていません。']);
                    break;
                case 'bonus_claim':
                    Videos::claimBonus($app, $env->userId, (string) $a['offer'], $env);
                    break;
                case 'tag_add':
                    self::applyTag($app, $env->userId, (string) $a['tag'], $env);
                    break;
                case 'tag_remove':
                    self::removeTag($app, $env->userId, (string) $a['tag']);
                    break;
                case 'field_set':
                    Friends::setField($app, $env->userId, $a['key'] ?? '', $a['value'] ?? null);
                    break;
                case 'enroll':
                    Scenarios::enroll($app, $env->userId, (string) $a['scenario'], isset($a['event']) && $a['event'] !== '' ? (string) $a['event'] : null);
                    break;
                case 'unenroll':
                    Scenarios::stopEnrollments($app, $env->userId, 'rule', (string) $a['scenario']);
                    break;
                case 'event_apply':
                    $r = Events::apply($app, $env->userId, (string) $a['event']);
                    if (isset($r['event'])) {
                        $env->vars['event'] = Scenarios::eventVars($r['event'], (int) $settings['timezone_offset_min']);
                    }
                    $key = $r['ok'] ? 'messages_ok' : (($r['reason'] ?? '') === 'full' ? 'messages_full' : (($r['reason'] ?? '') === 'duplicate' ? 'messages_dup' : 'messages_closed'));
                    $env->replyBuffer->push(...Msg::normalize($a[$key] ?? self::DEFAULT_EVENT_MESSAGES[$key], $env->vars));
                    // 申込で新しくタグが付いたら、タグ付与で動くルールも動かす
                    if ($r['ok'] && !empty($r['tagAdded']) && $env->depth < self::MAX_DEPTH) {
                        self::run($app, ['type' => 'tag_added', 'tag' => $r['tag']], $env->child());
                    }
                    break;
                case 'notify_admin':
                    $admins = $settings['admin_user_ids'] ?? [];
                    if ($admins) {
                        $who = ($env->vars['display_name'] ?? '') !== '' ? $env->vars['display_name'] : substr($env->userId, 0, 8);
                        Outbox::enqueue($app, $admins, Msg::normalize([$a['text'] ?? '{{display_name}}さんから連絡がありました'], ['display_name' => $who] + $env->vars), 'rule', $source, 20);
                    }
                    break;
                case 'member_refresh':
                    $app->adapter()->refreshMember($app, $env->userId);
                    break;
                default:
                    throw new \InvalidArgumentException('未知のアクションです: ' . (is_scalar($a['type'] ?? null) ? $a['type'] : '?'));
            }
        }
    }
}
