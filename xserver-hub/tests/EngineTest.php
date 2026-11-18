<?php
declare(strict_types=1);

// LINE配信ハブのエンジン（友だち追加・ルール・送信の関所・ステップ配信・一斉配信・チャット・アンケート・動画特典・イベント）

use Hub\Kernel\Json;
use Hub\Kernel\Time;
use Hub\Line\AdminOps;
use Hub\Line\Broadcasts;
use Hub\Line\Chat;
use Hub\Line\Events;
use Hub\Line\Hub;
use Hub\Line\Outbox;
use Hub\Line\Scenarios;
use Hub\Line\Settings;
use Hub\Line\Surveys;
use Hub\Line\Videos;
use Hub\Line\Webhook;

/** ルールをそのまま入れる（管理画面の保存と同じ形） */
function rule(\Hub\Kernel\App $app, array $r): int
{
    return AdminOps::saveRule($app, $r)['id'];
}

return [
    '友だち追加：台帳・プロフィール・返信・運営への知らせ' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(1);
        $line->setProfile($u, ['displayName' => 'さくら先生', 'pictureUrl' => 'https://profile.line-scdn.net/x', 'language' => 'ja']);
        Settings::set($app, ['admin_user_ids' => [Sim::uid(99)]]);
        $app->db()->exec("INSERT INTO line_friends (line_user_id, status, created_at, updated_at) VALUES (?, 'active', NOW(3), NOW(3))", [Sim::uid(99)]);
        rule($app, ['name' => 'あいさつ', 'trigger_type' => 'follow', 'actions' => [['type' => 'reply', 'messages' => ['{{display_name}}さん、はじめまして！']]]]);
        $r = Sim::send($app, Sim::follow($line, $u));
        T::eq(200, $r['status']);
        T::eq('ok', $r['results'][0]['status']);
        $f = $app->db()->one('SELECT * FROM line_friends WHERE line_user_id = ?', [$u]);
        T::eq('さくら先生', $f['display_name']);
        T::eq('active', $f['status']);
        T::eq(['さくら先生さん、はじめまして！'], $line->textsTo($u), '返信で届く');
        T::eq('reply', $line->deliveriesTo($u)[0]['via']);
        // 運営への知らせは送信キューへ（通数を使う）
        $o = $app->db()->one("SELECT * FROM line_outbox WHERE source = 'notify'");
        T::ok($o !== null, '運営への知らせが積まれる');
        Outbox::dispatch($app);
        T::contains('さくら先生さんが、友だち追加しました', $line->textsTo(Sim::uid(99))[0] ?? null);
        // トークの記録は暗号化されている
        $log = $app->db()->one("SELECT body FROM line_message_log WHERE direction = 'in' AND line_user_id = ?", [$u]);
        T::ok(str_starts_with($log['body'], 'e1.'), '記録の本文は暗号化');
        T::ok(!str_contains($log['body'], '友だち追加'), '平文が入っていない');
    },

    '同じイベントが2回届いても、1回だけ処理する' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(2);
        rule($app, ['name' => 'こんにちは', 'trigger_type' => 'keyword', 'pattern' => 'こんにちは', 'actions' => [['type' => 'reply', 'messages' => ['こんにちは！']]]]);
        $ev = Sim::text($line, $u, 'こんにちは');
        Sim::send($app, $ev);
        $r = Sim::send($app, $ev);
        T::eq([], $r['results'], '2回目は受け付けない');
        T::eq(1, (int) $app->db()->value("SELECT COUNT(*) FROM line_message_log WHERE direction = 'in'"));
        T::eq(['こんにちは！'], $line->textsTo($u));
    },

    '署名が違う Webhook は 400' => function () {
        [$app, $line] = T::app();
        [$raw] = Sim::sign([Sim::text($line, Sim::uid(3), 'x')]);
        $r = Webhook::handle($app, $raw, 'AAAA');
        T::eq(400, $r['status']);
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_events'));
    },

    'キーワード：完全一致・部分一致・正規表現、全角半角のゆれ' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(4);
        rule($app, ['name' => '完全', 'trigger_type' => 'keyword', 'match_mode' => 'exact', 'pattern' => "資料\nしりょう", 'priority' => 10, 'actions' => [['type' => 'reply', 'messages' => ['資料です']]]]);
        rule($app, ['name' => '部分', 'trigger_type' => 'keyword', 'match_mode' => 'contains', 'pattern' => '教員会', 'priority' => 20, 'actions' => [['type' => 'reply', 'messages' => ['教員会の案内']]]]);
        rule($app, ['name' => '正規', 'trigger_type' => 'keyword', 'match_mode' => 'regex', 'pattern' => '^zoom\d+$', 'priority' => 30, 'actions' => [['type' => 'reply', 'messages' => ['ZOOM']]]]);
        Sim::send($app, Sim::text($line, $u, ' しりょう '));
        Sim::send($app, Sim::text($line, $u, '水曜の教員会に出たい'));
        Sim::send($app, Sim::text($line, $u, 'ＺＯＯＭ１２'));
        Sim::send($app, Sim::text($line, $u, 'ほかの話'));
        T::eq(['資料です', '教員会の案内', 'ZOOM'], $line->textsTo($u));
        // 自動の返事が無いメッセージは「要対応」、返信トークンを覚える
        $st = $app->db()->one('SELECT needs_reply, reply_token FROM line_chat_state WHERE line_user_id = ?', [$u]);
        T::eq(true, $st['needs_reply']);
        T::ok($st['reply_token'] !== null, '返信トークンを覚えている');
    },

    '正規表現の書き間違いは、保存の時点で止める' => function () {
        [$app] = T::app();
        T::throws(fn () => rule($app, ['name' => 'x', 'trigger_type' => 'keyword', 'match_mode' => 'regex', 'pattern' => '([a-', 'actions' => [['type' => 'reply', 'messages' => ['a']]]]), '正規表現が正しくありません');
        T::throws(fn () => rule($app, ['name' => 'x', 'trigger_type' => 'keyword', 'pattern' => 'a', 'actions' => []]), 'アクションが1つ以上必要です');
        T::throws(fn () => rule($app, ['name' => 'x', 'trigger_type' => 'keyword', 'pattern' => 'a', 'conditions' => ['color' => 'red'], 'actions' => [['type' => 'reply', 'messages' => ['a']]]]), '未知の絞り込み条件です');
    },

    '送信の関所：停止スイッチ・練習モード・月間上限・ブロック' => function () {
        [$app, $line] = T::app();
        $a = Sim::uid(10);
        $b = Sim::uid(11);
        foreach ([$a, $b] as $u) {
            Sim::send($app, Sim::follow($line, $u));
        }
        Settings::set($app, ['enabled' => false]);
        Outbox::enqueue($app, [$a], [['type' => 'text', 'text' => 'テスト']], 'manual');
        T::eq(true, Outbox::dispatch($app)['disabled'], '停止中は送らない');
        T::eq('queued', $app->db()->value("SELECT status FROM line_outbox WHERE source = 'manual'"));
        Settings::set($app, ['enabled' => true, 'dry_run' => true]);
        T::eq(1, Outbox::dispatch($app)['dry_run']);
        T::eq([], $line->textsTo($a), '練習モードでは届かない');
        Settings::set($app, ['dry_run' => false, 'monthly_cap' => 1, 'notification_reserve' => 0]);
        Outbox::enqueue($app, [$a, $b], [['type' => 'text', 'text' => '2人へ']], 'broadcast');
        $r = Outbox::dispatch($app);
        T::eq(1, $r['skipped'], '上限を超える分は送らない');
        T::eq([], $line->textsTo($a));
        Settings::set($app, ['monthly_cap' => 100]);
        Sim::send($app, Sim::unfollow($b));
        Outbox::enqueue($app, [$a, $b], [['type' => 'text', 'text' => 'ブロックの人は外す']], 'broadcast');
        Outbox::dispatch($app);
        T::eq(['ブロックの人は外す'], $line->textsTo($a));
        T::eq([], $line->textsTo($b));
        $usage = Outbox::usageSummary($app);
        T::eq(1, $usage['sent']);
    },

    '送信の関所：409 は成功、429 は待って再送、5xx は再送して上限で失敗、400 は失敗' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(12);
        Sim::send($app, Sim::follow($line, $u));
        $line->fail('#/v2/bot/message/push#', 429, 1, 30);
        $id = Outbox::enqueue($app, [$u], [['type' => 'text', 'text' => 'a']], 'manual');
        T::eq(1, Outbox::dispatch($app)['requeued']);
        $row = $app->db()->one('SELECT status, attempts, not_before FROM line_outbox WHERE id = ?', [$id]);
        T::eq('queued', $row['status']);
        T::eq(0, $row['attempts'], '429 は試行回数に数えない');
        T::eq(0, Outbox::dispatch($app)['sent'], 'まだ待つ');
        $app->clock->advance(31);
        T::eq(1, Outbox::dispatch($app)['sent']);
        // 5xx：指数バックオフ → 上限で失敗
        Settings::set($app, ['max_attempts' => 2]);
        $line->fail('#/v2/bot/message/push#', 500, 2); // 2回とも 500（上限 2回で失敗）
        $id2 = Outbox::enqueue($app, [$u], [['type' => 'text', 'text' => 'b']], 'manual');
        Outbox::dispatch($app);
        $app->clock->advance(31);
        Outbox::dispatch($app);
        T::eq('failed', $app->db()->value('SELECT status FROM line_outbox WHERE id = ?', [$id2]));
        // 400：再送しない
        $line->fail('#/v2/bot/message/push#', 400, 1);
        $id3 = Outbox::enqueue($app, [$u], [['type' => 'text', 'text' => 'c']], 'manual');
        Outbox::dispatch($app);
        T::eq('failed', $app->db()->value('SELECT status FROM line_outbox WHERE id = ?', [$id3]));
        // 同じ行をもう一度送る（requeue）→ Retry-Key が同じ → 409 → 成功扱い
        $id4 = Outbox::enqueue($app, [$u], [['type' => 'text', 'text' => 'd']], 'manual');
        Outbox::dispatch($app);
        $app->db()->exec("UPDATE line_outbox SET status = 'failed' WHERE id = ?", [$id4]);
        AdminOps::requeueOutbox($app, $id4);
        $before = count($line->textsTo($u));
        Outbox::dispatch($app);
        T::eq('sent', $app->db()->value('SELECT status FROM line_outbox WHERE id = ?', [$id4]));
        T::eq($before, count($line->textsTo($u)), '二重には届かない');
    },

    'ステップ配信：登録・時刻の計算・毎分の送信・止めるタグ' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(20);
        Sim::send($app, Sim::follow($line, $u));
        Scenarios::upsert($app, ['name' => 'はじめての方へ', 'stopOnTags' => ['購入済み'], 'steps' => [
            ['messages' => ['1通目']],
            ['offsetDays' => 1, 'atTime' => '20:00', 'messages' => ['2通目 {{display_name}}']],
            ['offsetDays' => 2, 'messages' => ['3通目']],
        ]]);
        T::eq(true, Scenarios::enroll($app, $u, 'はじめての方へ')['ok']);
        T::eq('already_enrolled', Scenarios::enroll($app, $u, 'はじめての方へ')['reason']);
        $due = array_column($app->db()->all('SELECT due_at FROM line_enrollment_steps ORDER BY step_id'), 'due_at');
        T::eq('2026-10-20T00:00:00.000Z', $due[0], '1通目は今すぐ');
        T::eq('2026-10-21T11:00:00.000Z', $due[1], '翌日の日本時間20:00');
        T::eq('2026-10-22T00:00:00.000Z', $due[2]);
        Hub::tick($app);
        T::eq(['1通目'], $line->textsTo($u));
        $app->clock->setNow('2026-10-21T11:00:30Z');
        Hub::tick($app);
        T::eq(['1通目', '2通目 '], $line->textsTo($u), '表示名が無いときは空');
        // 止めるタグ → 残りは送らない
        \Hub\Line\Rules::applyTag($app, $u, '購入済み');
        $app->clock->setNow('2026-10-22T01:00:00Z');
        Hub::tick($app);
        T::eq(2, count($line->textsTo($u)));
        T::eq('stopped', $app->db()->value('SELECT status FROM line_enrollments'));
    },

    'ステップ配信：反応で分かれる（返事があったら次のシナリオへ）・タグで始まる' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(21);
        Scenarios::upsert($app, ['name' => '感想ありがとう', 'steps' => [['messages' => ['感想ありがとうございます']]]]);
        Scenarios::upsert($app, ['name' => '紹介', 'startOnFollow' => true, 'stopOnReply' => true, 'replyScenario' => '感想ありがとう', 'steps' => [
            ['messages' => ['紹介1']], ['offsetDays' => 1, 'messages' => ['紹介2']],
        ]]);
        Scenarios::upsert($app, ['name' => '中学校向け', 'startOnTags' => ['校種:中学校'], 'steps' => [['messages' => ['中学校の先生へ']]]]);
        Sim::send($app, Sim::follow($line, $u));
        Hub::tick($app);
        T::eq(['紹介1'], $line->textsTo($u));
        Sim::send($app, Sim::text($line, $u, 'よかったです'));
        Hub::tick($app);
        T::eq(['紹介1', '感想ありがとうございます'], $line->textsTo($u));
        \Hub\Line\Rules::applyTag($app, $u, '校種：中学校'); // 全角の：もそろえる
        Hub::tick($app);
        T::eq('中学校の先生へ', $line->textsTo($u)[2] ?? null);
    },

    '一斉配信：人数の見積もり・送る・上限で止める・差し込みは使えない' => function () {
        [$app, $line] = T::app();
        foreach ([30, 31, 32] as $n) {
            Sim::send($app, Sim::follow($line, Sim::uid($n)));
        }
        \Hub\Line\Rules::applyTag($app, Sim::uid(30), '関東');
        \Hub\Line\Rules::applyTag($app, Sim::uid(31), '関東');
        T::eq(2, Broadcasts::estimate($app, ['tags_any' => ['関東']])['recipients']);
        T::throws(fn () => Broadcasts::create($app, 'x', [], ['{{display_name}}さん']), '差し込みは使えません');
        $id = Broadcasts::create($app, '関東の方へ', ['tags_any' => ['関東']], ['関東のお知らせ'])['id'];
        $r = Broadcasts::send($app, $id);
        T::eq(2, $r['recipients']);
        Hub::tick($app);
        T::eq(['関東のお知らせ'], $line->textsTo(Sim::uid(30)));
        T::eq([], $line->textsTo(Sim::uid(32)));
        T::eq('multicast', $line->deliveriesTo(Sim::uid(30))[0]['via']);
        T::eq('sent', $app->db()->value('SELECT status FROM line_broadcasts WHERE id = ?', [$id]));
        Settings::set($app, ['monthly_cap' => 2, 'notification_reserve' => 0]);
        $id2 = Broadcasts::create($app, '全員', [], ['全員へ'])['id'];
        T::eq('cap', Broadcasts::send($app, $id2)['reason'], '上限に収まらなければ1通も積まない');
    },

    '個別チャット：50秒以内は返信（無料）、過ぎたらプッシュ' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(40);
        Sim::send($app, Sim::follow($line, $u));
        Sim::send($app, Sim::text($line, $u, '質問があります'));
        $app->clock->advance(20);
        $r = Chat::send($app, $u, [['type' => 'text', 'text' => 'どうぞ']], 'staff@example.test');
        T::eq('reply', $r['via']);
        T::eq(0, $r['cost']);
        Sim::send($app, Sim::text($line, $u, 'もう1つ'));
        $app->clock->advance(60);
        $r2 = Chat::send($app, $u, [['type' => 'text', 'text' => 'お返事です']], 'staff@example.test');
        T::eq('push', $r2['via']);
        Outbox::dispatch($app);
        T::eq(['どうぞ', 'お返事です'], $line->textsTo($u));
        $th = Chat::thread($app, $u);
        $texts = array_column($th['items'], 'text');
        T::ok(in_array('質問があります', $texts, true), 'やり取りに受け取った文がある');
        T::ok(in_array('どうぞ', $texts, true), 'やり取りに返信がある');
        T::eq(false, $th['state']['needsReply'], '返したら要対応は外れる');
        $rooms = Chat::listRooms($app);
        T::eq(1, $rooms['total']);
        T::eq('お返事です', $rooms['rows'][0]['last_text']);
    },

    'アンケート：友だち追加の返事に1問目・答えると属性のタグ・全部答えたらお礼' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(50);
        $id = Surveys::upsert($app, ['name' => '属性', 'startOnFollow' => true, 'doneTag' => '回答済み', 'questions' => [
            ['attribute' => '校種', 'text' => '学校の種類は？', 'choices' => ['小学校', '中学校']],
            ['attribute' => '年代', 'text' => '年代は？', 'choices' => ['20代', '30代']],
        ]])['id'];
        Sim::send($app, Sim::follow($line, $u));
        $first = $line->deliveriesTo($u)[0]['messages'][0];
        T::eq('（1/2）学校の種類は？', $first['text']);
        T::eq("lh-survey:{$id}:0:1", $first['quickReply']['items'][1]['action']['data']);
        Sim::send($app, Sim::postback($line, $u, "lh-survey:{$id}:0:1"));
        T::eq('（2/2）年代は？', $line->textsTo($u)[1] ?? null);
        Sim::send($app, Sim::postback($line, $u, "lh-survey:{$id}:1:0"));
        T::eq('ご回答ありがとうございました！', $line->textsTo($u)[2] ?? null);
        $tags = \Hub\Line\Friends::tagNames($app, $u);
        T::eq(['回答済み', '年代:20代', '校種:中学校'], $tags);
        // 1人1つの属性は、新しい値で付け替わる
        \Hub\Line\Rules::applyTag($app, $u, '校種:小学校');
        T::eq(['回答済み', '年代:20代', '校種:小学校'], \Hub\Line\Friends::tagNames($app, $u));
        $res = Surveys::results($app, '属性');
        T::eq(1, $res['completed']);
    },

    '動画特典：最後まで見たら期限つきの案内、期限内に受け取り、期限後は終了' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(60);
        Sim::send($app, Sim::follow($line, $u));
        $id = Videos::upsert($app, ['key' => 'intro', 'name' => '紹介動画', 'videoUrl' => 'https://example.test/v.mp4', 'previewUrl' => 'https://example.test/p.jpg', 'deadlineHours' => 24, 'watchedTag' => '視聴済み', 'bonusMessages' => ['特典のURLです https://example.test/bonus']])['id'];
        Sim::send($app, Sim::videoComplete($line, $u, "lh-video:{$id}"));
        $msg = $line->deliveriesTo($u)[0]['messages'][0];
        T::contains('10月21日(水) 09:00 まで', $msg['text']);
        T::eq("lh-bonus:{$id}", $msg['quickReply']['items'][0]['action']['data']);
        T::ok(in_array('視聴済み', \Hub\Line\Friends::tagNames($app, $u), true));
        Sim::send($app, Sim::postback($line, $u, "lh-bonus:{$id}"));
        T::eq('特典のURLです https://example.test/bonus', $line->textsTo($u)[1] ?? null);
        $u2 = Sim::uid(61);
        Sim::send($app, Sim::follow($line, $u2));
        Sim::send($app, Sim::videoComplete($line, $u2, "lh-video:{$id}"));
        $app->clock->advance(25 * 3600);
        Sim::send($app, Sim::postback($line, $u2, "lh-bonus:{$id}"));
        T::eq('申し訳ありません。特典の受付は終了しました。', $line->textsTo($u2)[1] ?? null);
    },

    'イベント：キーワードで申込・定員・リマインド（前日・開始後は送らない）' => function () {
        [$app, $line] = T::app();
        Scenarios::upsert($app, ['name' => 'リマインド', 'steps' => [
            ['anchor' => 'event', 'offsetDays' => -1, 'atTime' => '18:00', 'messages' => ['明日は{{event.title}}です（{{event.starts_at}}）']],
            ['anchor' => 'event', 'offsetMinutes' => -60, 'messages' => ['1時間前です']],
        ]]);
        Events::upsert($app, ['key' => 'kyoinkai-20261022', 'title' => 'ZOOM教員会', 'startsAt' => '2026-10-22T21:00:00+09:00', 'capacity' => 1, 'reminderScenario' => 'リマインド']);
        rule($app, ['name' => '申込', 'trigger_type' => 'keyword', 'pattern' => '参加', 'actions' => [['type' => 'event_apply', 'event' => 'kyoinkai-20261022']]]);
        $a = Sim::uid(70);
        $b = Sim::uid(71);
        Sim::send($app, Sim::follow($line, $a));
        Sim::send($app, Sim::follow($line, $b));
        Sim::send($app, Sim::text($line, $a, '参加'));
        T::contains('ZOOM教員会】のお申し込みを受け付けました', $line->textsTo($a)[0] ?? null);
        T::contains('10月22日(木) 21:00', $line->textsTo($a)[0] ?? null);
        Sim::send($app, Sim::text($line, $b, '参加'));
        T::contains('満席になりました', $line->textsTo($b)[0] ?? null);
        Sim::send($app, Sim::text($line, $a, '参加'));
        T::contains('すでにお申し込み済み', $line->textsTo($a)[1] ?? null);
        T::ok(in_array('event:kyoinkai-20261022', \Hub\Line\Friends::tagNames($app, $a), true));
        $app->clock->setNow('2026-10-21T09:00:10Z'); // 日本時間 10/21 18:00
        Hub::tick($app);
        T::eq('明日はZOOM教員会です（10月22日(木) 21:00）', $line->textsTo($a)[2] ?? null);
        $app->clock->setNow('2026-10-22T12:05:00Z'); // 開始後（21:05）
        Hub::tick($app);
        T::eq(3, count($line->textsTo($a)), '開始後のリマインドは送らない');
    },

    '日程を選ぶボタン：ボタンで申込・カレンダーで申込' => function () {
        [$app, $line] = T::app();
        Events::upsert($app, ['key' => 'kyoinkai-20261022', 'title' => '教員会', 'startsAt' => '2026-10-22T21:00:00+09:00']);
        Events::upsert($app, ['key' => 'kyoinkai-20261023', 'title' => '教員会', 'startsAt' => '2026-10-23T21:00:00+09:00']);
        rule($app, ['name' => '日程', 'trigger_type' => 'keyword', 'pattern' => '日程', 'actions' => [['type' => 'reply', 'messages' => [['type' => 'event_picker', 'keyPrefix' => 'kyoinkai-']]]]]);
        $u = Sim::uid(80);
        Sim::send($app, Sim::follow($line, $u));
        Sim::send($app, Sim::text($line, $u, '日程'));
        $m = $line->deliveriesTo($u)[0]['messages'][0];
        T::eq('datetimepicker', $m['quickReply']['items'][0]['action']['type']);
        T::eq('10/22(木) 21:00', $m['quickReply']['items'][1]['action']['label']);
        $evId = $app->db()->value("SELECT id FROM line_calendar_events WHERE `key` = 'kyoinkai-20261023'");
        Sim::send($app, Sim::postback($line, $u, 'lh-cal:kyoinkai-', ['date' => '2026-10-23']));
        T::contains('お申し込みを受け付けました', $line->textsTo($u)[1] ?? null);
        T::eq('applied', $app->db()->value('SELECT status FROM line_event_participants WHERE event_id = ?', [$evId]));
    },

    '失敗したイベントは、毎分の処理がもう一度処理する' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(90);
        $line->fail('#/v2/bot/profile/#', 0, 1);
        // わざと処理を失敗させる：返信の検査で落ちるルール（ありえない形）を DB に直接入れる
        $app->db()->exec("INSERT INTO line_rules (name, trigger_type, conditions, actions, created_at, updated_at) VALUES ('壊れた', 'follow', '{}', '[{\"type\":\"nope\"}]', NOW(3), NOW(3))");
        $r = Sim::send($app, Sim::follow($line, $u));
        T::eq('error', $r['results'][0]['status']);
        T::eq(null, $app->db()->value('SELECT processed_at FROM line_events'));
        $app->db()->exec('DELETE FROM line_rules');
        $app->clock->advance(61);
        $out = Hub::tick($app);
        T::eq(1, $out['events']['ok']);
        T::ok($app->db()->value('SELECT processed_at FROM line_events') !== null);
    },
];
