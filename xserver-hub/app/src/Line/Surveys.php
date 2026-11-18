<?php
declare(strict_types=1);

namespace Hub\Line;

use Hub\Kernel\App;
use Hub\Kernel\Json;

/**
 * アンケート：属性（校種・性別・年代…）を、ボタン（クイックリプライ）で聞き、答えを属性のタグにする（line-hub の surveys.js）。
 *   ・答えのボタンは postback（data = lh-survey:アンケートの番号:何問目:何番目の選択肢）
 *   ・答えたら、その属性のタグを付け、次の質問を「返信」で送る（通数に数えない）
 *   ・LINE の決まり：ボタンは13個まで、ボタンの文字は20文字まで
 */
final class Surveys
{
    public const DATA_RE = '/^lh-survey:(\d+):(\d+):(\d+)$/';
    private const MAX_QUESTIONS = 10;
    private const MAX_CHOICES = 13;
    private const LABEL_MAX = 20;

    public static function validateDef(mixed $def): array
    {
        $err = static function (string $m): never {
            throw new \InvalidArgumentException($m);
        };
        if (!Json::isObjLike($def)) {
            $err('アンケートが空です');
        }
        $def = Json::toArray($def);
        $name = trim(is_scalar($def['name'] ?? null) ? (string) $def['name'] : '');
        if ($name === '') {
            $err('アンケートの名前が必要です');
        }
        if (mb_strlen($name) > 50) {
            $err('アンケートの名前は50文字までです');
        }
        $qs = $def['questions'] ?? null;
        if (!is_array($qs) || !$qs || !array_is_list($qs)) {
            $err('質問が1つ以上必要です');
        }
        if (count($qs) > self::MAX_QUESTIONS) {
            $err('質問は' . self::MAX_QUESTIONS . '個までです');
        }
        $questions = [];
        foreach ($qs as $i => $q) {
            $at = ($i + 1) . '問目';
            if (!is_array($q)) {
                $err("{$at}：質問の形が正しくありません");
            }
            $attribute = Attributes::normalizeTagName($q['attribute'] ?? '');
            if ($attribute === '') {
                $err("{$at}：どの属性を聞くか（例：校種）が必要です");
            }
            if (mb_strlen($attribute) > 20 || str_contains($attribute, ':')) {
                $err("{$at}：属性の名前は20文字まで・「:」なしにしてください");
            }
            $text = trim(is_scalar($q['text'] ?? null) ? (string) $q['text'] : '');
            if ($text === '') {
                $err("{$at}：質問の文が必要です");
            }
            if (mb_strlen($text) > 500) {
                $err("{$at}：質問の文は500文字までです");
            }
            $choices = array_values(array_filter(array_map([Attributes::class, 'normalizeTagName'], is_array($q['choices'] ?? null) ? $q['choices'] : []), fn ($c) => $c !== ''));
            if (count($choices) < 2) {
                $err("{$at}：選択肢は2つ以上にしてください");
            }
            if (count($choices) > self::MAX_CHOICES) {
                $err("{$at}：選択肢は" . self::MAX_CHOICES . '個までです（LINE のボタンの数の上限）');
            }
            foreach ($choices as $c) {
                if (mb_strlen($c) > self::LABEL_MAX) {
                    $err("{$at}：選択肢「" . mb_substr($c, 0, 12) . '…」が長すぎます（LINE のボタンは' . self::LABEL_MAX . '文字まで）');
                }
                if (str_contains($c, ':')) {
                    $err("{$at}：選択肢「{$c}」に「:」は使えません");
                }
            }
            if (count(array_unique($choices)) !== count($choices)) {
                $err("{$at}：同じ選択肢が2つあります");
            }
            $questions[] = ['attribute' => $attribute, 'text' => $text, 'choices' => $choices];
        }
        $doneMessage = isset($def['doneMessage']) ? (string) $def['doneMessage'] : null;
        if ($doneMessage !== null && mb_strlen($doneMessage) > 1000) {
            $err('お礼の返事は1000文字までです');
        }
        $doneTag = (!isset($def['doneTag']) || $def['doneTag'] === '') ? null : Attributes::normalizeTagName($def['doneTag']);
        if ($doneTag !== null && mb_strlen($doneTag) > 50) {
            $err('答えた人に付けるタグは50文字までです');
        }
        foreach (['enabled', 'startOnFollow'] as $k) {
            if (isset($def[$k]) && !is_bool($def[$k])) {
                $err("{$k} は true / false で指定してください");
            }
        }
        $doneExtra = null;
        if (isset($def['doneExtra']) && $def['doneExtra'] !== []) {
            $arr = Msg::asList($def['doneExtra']);
            if (count($arr) > 3) {
                $err('お礼のあとに続けるものは3件までです');
            }
            try {
                Msg::validate(Msg::normalize($arr, ['display_name' => 'x']), true);
            } catch (\InvalidArgumentException $e) {
                $err('お礼のあとに続けるもの：' . $e->getMessage());
            }
            $doneExtra = $arr;
        }
        return [
            'name' => $name, 'questions' => $questions,
            'doneMessage' => ($doneMessage !== null && trim($doneMessage) !== '') ? $doneMessage : null,
            'doneTag' => $doneTag, 'doneExtra' => $doneExtra,
            'enabled' => $def['enabled'] ?? null, 'startOnFollow' => $def['startOnFollow'] ?? null,
        ];
    }

    /** 作る／書き換える（名前で決まる）。聞く属性が未登録なら、選択肢ごと登録する */
    public static function upsert(App $app, mixed $def): array
    {
        $v = self::validateDef($def);
        foreach ($v['questions'] as $q) {
            Attributes::ensureGroup($app, $q['attribute'], $q['choices']);
        }
        $db = $app->db();
        $now = $app->now();
        $cur = $db->one('SELECT id FROM line_surveys WHERE name = ?', [$v['name']]);
        $extra = $v['doneExtra'] === null ? null : Json::enc($v['doneExtra']);
        if ($cur) {
            $db->exec(
                'UPDATE line_surveys SET enabled = COALESCE(?, enabled), start_on_follow = COALESCE(?, start_on_follow), questions = ?,
                   done_message = ?, done_tag = ?, done_extra = ?, updated_at = ? WHERE id = ?',
                [$v['enabled'], $v['startOnFollow'], Json::enc($v['questions']), $v['doneMessage'], $v['doneTag'], $extra, $now, $cur['id']]
            );
            return ['id' => (int) $cur['id']];
        }
        $db->exec(
            'INSERT INTO line_surveys (name, enabled, start_on_follow, questions, done_message, done_tag, done_extra, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$v['name'], $v['enabled'] ?? true, $v['startOnFollow'] ?? false, Json::enc($v['questions']), $v['doneMessage'], $v['doneTag'], $extra, $now, $now]
        );
        return ['id' => $db->lastId()];
    }

    /** 番号（数字）か名前で探す */
    public static function get(App $app, int|string $ref): ?array
    {
        $byId = is_int($ref) || preg_match('/^\d+$/', $ref);
        return $app->db()->one(
            'SELECT * FROM line_surveys WHERE ' . ($byId ? 'id = ?' : 'name = ?'),
            [$byId ? (int) $ref : $ref],
            json: ['questions', 'done_extra']
        );
    }

    /** 何問目かの質問（ボタンつきのテキスト） */
    public static function questionMessage(array $survey, int $qi): array
    {
        $qs = $survey['questions'];
        $q = $qs[$qi];
        $items = [];
        foreach ($q['choices'] as $ci => $c) {
            $items[] = ['type' => 'action', 'action' => ['type' => 'postback', 'label' => $c, 'data' => "lh-survey:{$survey['id']}:{$qi}:{$ci}", 'displayText' => $c]];
        }
        return [
            'type' => 'text',
            'text' => (count($qs) > 1 ? '（' . ($qi + 1) . '/' . count($qs) . '）' : '') . $q['text'],
            'quickReply' => ['items' => $items],
        ];
    }

    /** 最初の質問（まだ答えていない、いちばん前の問い）。使えなければ null */
    public static function start(App $app, ?string $userId, int|string $ref): ?array
    {
        $sv = self::get($app, $ref);
        if (!$sv || !$sv['enabled']) {
            return null;
        }
        if (!$userId) {
            return self::questionMessage($sv, 0);
        }
        $db = $app->db();
        $now = $app->now();
        $cur = $db->one('SELECT answers, completed_at FROM line_survey_responses WHERE survey_id = ? AND line_user_id = ?', [$sv['id'], $userId], json: ['answers']);
        $answers = $cur['answers'] ?? [];
        if (!$cur) {
            $db->exec(
                "INSERT INTO line_survey_responses (survey_id, line_user_id, answers, started_at, updated_at) VALUES (?, ?, '{}', ?, ?)
                 ON DUPLICATE KEY UPDATE survey_id = survey_id",
                [$sv['id'], $userId, $now, $now]
            );
        } elseif ($cur['completed_at'] !== null) {
            $answers = [];
            $db->exec(
                "UPDATE line_survey_responses SET answers = '{}', completed_at = NULL, started_at = ?, updated_at = ? WHERE survey_id = ? AND line_user_id = ?",
                [$now, $now, $sv['id'], $userId]
            );
        }
        $qi = 0;
        foreach (array_keys($sv['questions']) as $i) {
            if (!array_key_exists($i, $answers)) {
                $qi = $i;
                break;
            }
        }
        return self::questionMessage($sv, $qi);
    }

    /** ボタンの答え（ポストバック）。アンケートのボタンでなければ null。扱ったら ['label' => …] */
    public static function handleAnswer(App $app, string $userId, string $data, Env $env): ?array
    {
        if (!preg_match(self::DATA_RE, $data, $m)) {
            return null;
        }
        [$sid, $qi, $ci] = [(int) $m[1], (int) $m[2], (int) $m[3]];
        $sv = self::get($app, $sid);
        if (!$sv || !$sv['enabled']) {
            $env->replyBuffer->push(['type' => 'text', 'text' => 'このアンケートは、いまは受け付けていません。']);
            return ['label' => '（アンケートの回答：受付を止めているアンケート）'];
        }
        $q = $sv['questions'][$qi] ?? null;
        $choice = $q['choices'][$ci] ?? null;
        if (!$q || $choice === null) {
            $env->replyBuffer->push(['type' => 'text', 'text' => 'このボタンは、もう使えません（アンケートが変わりました）。']);
            return ['label' => '（アンケートの回答：古いボタン）'];
        }
        $db = $app->db();
        $now = $app->now();
        $db->exec(
            "INSERT INTO line_survey_responses (survey_id, line_user_id, answers, started_at, updated_at) VALUES (?, ?, JSON_OBJECT(?, ?), ?, ?)
             ON DUPLICATE KEY UPDATE answers = JSON_SET(answers, CONCAT('$.\"', ?, '\"'), ?), updated_at = VALUES(updated_at)",
            [$sv['id'], $userId, (string) $qi, $choice, $now, $now, (string) $qi, $choice]
        );
        Rules::applyTag($app, $userId, Attributes::attrTag($q['attribute'], $choice), $env);

        $resp = $db->one('SELECT answers, completed_at FROM line_survey_responses WHERE survey_id = ? AND line_user_id = ?', [$sv['id'], $userId], json: ['answers']);
        $answered = array_map('intval', array_keys($resp['answers'] ?? []));
        $n = count($sv['questions']);
        $next = null;
        for ($i = $qi + 1; $i < $n && $next === null; $i++) {
            if (!in_array($i, $answered, true)) {
                $next = $i;
            }
        }
        for ($i = 0; $i < $n && $next === null; $i++) {
            if (!in_array($i, $answered, true)) {
                $next = $i;
            }
        }
        if ($next !== null) {
            $env->replyBuffer->push(self::questionMessage($sv, $next));
        } elseif ($resp['completed_at'] === null) {
            $db->exec('UPDATE line_survey_responses SET completed_at = ? WHERE survey_id = ? AND line_user_id = ?', [$now, $sv['id'], $userId]);
            if ($sv['done_tag']) {
                Rules::applyTag($app, $userId, $sv['done_tag'], $env);
            }
            $env->replyBuffer->push(...Msg::normalize([$sv['done_message'] ?: 'ご回答ありがとうございました！'], $env->vars));
            if (is_array($sv['done_extra']) && $sv['done_extra']) {
                // お礼のあとに続けるもの（日程を選ぶボタン・次のアンケートなど）
                $env->replyBuffer->push(...Special::expand($app, $userId, Msg::normalize($sv['done_extra'], $env->vars)));
            }
        } else {
            $env->replyBuffer->push(['type' => 'text', 'text' => "「{$q['attribute']}」を「{$choice}」に変更しました。"]);
        }
        return ['label' => "{$q['attribute']}：{$choice}（アンケートの回答）"];
    }

    /** 友だち追加の返事に添えるアンケート（start_on_follow が付いた、有効なもののうち最初の1つ）の、最初の質問 */
    public static function forFollow(App $app, string $userId): ?array
    {
        $sv = $app->db()->one('SELECT id FROM line_surveys WHERE enabled = 1 AND start_on_follow = 1 ORDER BY id LIMIT 1');
        return $sv ? self::start($app, $userId, (int) $sv['id']) : null;
    }

    public static function list(App $app): array
    {
        return $app->db()->all(
            'SELECT s.id, s.name, s.enabled, s.start_on_follow, s.questions, s.done_message, s.done_tag, s.done_extra, s.updated_at,
                    (SELECT COUNT(*) FROM line_survey_responses r WHERE r.survey_id = s.id) AS started,
                    (SELECT COUNT(*) FROM line_survey_responses r WHERE r.survey_id = s.id AND r.completed_at IS NOT NULL) AS completed
             FROM line_surveys s ORDER BY s.id',
            [],
            keep: ['questions', 'done_extra']
        );
    }

    /** 1つのアンケートの結果 */
    public static function results(App $app, string $ref, int $limit = 100): ?array
    {
        $sv = self::get($app, $ref);
        if (!$sv) {
            return null;
        }
        $rows = $app->db()->all(
            'SELECT r.line_user_id, f.display_name, f.status, r.answers, r.started_at, r.updated_at, r.completed_at
             FROM line_survey_responses r JOIN line_friends f ON f.line_user_id = r.line_user_id
             WHERE r.survey_id = ? ORDER BY r.updated_at DESC',
            [$sv['id']],
            json: ['answers']
        );
        $active = array_values(array_filter($rows, fn ($r) => $r['status'] === 'active'));
        $questions = [];
        foreach ($sv['questions'] as $i => $q) {
            $counts = [];
            foreach ($q['choices'] as $c) {
                $counts[] = ['choice' => $c, 'n' => count(array_filter($active, fn ($r) => ($r['answers'][$i] ?? null) === $c))];
            }
            $questions[] = $q + ['counts' => $counts, 'answered' => count(array_filter($active, fn ($r) => isset($r['answers'][$i])))];
        }
        $respondents = array_map(function (array $r): array {
            $r['answers'] = Json::obj($r['answers'] ?? []);
            return $r;
        }, array_slice($rows, 0, $limit));
        return [
            'survey' => $sv,
            'questions' => $questions,
            'started' => count($rows),
            'completed' => count(array_filter($rows, fn ($r) => $r['completed_at'] !== null)),
            'respondents' => $respondents,
        ];
    }

    public static function setEnabled(App $app, int $id, bool $enabled): void
    {
        $app->db()->exec('UPDATE line_surveys SET enabled = ?, updated_at = ? WHERE id = ?', [$enabled, $app->now(), $id]);
    }

    public static function delete(App $app, int $id): array
    {
        return ['ok' => $app->db()->exec('DELETE FROM line_surveys WHERE id = ?', [$id]) > 0];
    }
}
