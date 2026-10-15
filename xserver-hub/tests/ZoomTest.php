<?php
declare(strict_types=1);

// Zoom の出欠：URL の確認・署名・入退室の記録（名前とメールは暗号化）・確定（参加／欠席のタグ）・結びつけ・消去

use Hub\Kernel\App;
use Hub\Kernel\Http\Request;
use Hub\Kernel\Http\Response;
use Hub\Kernel\Time;
use Hub\Line\Events;
use Hub\Line\Friends;
use Hub\Line\Zoom;
use Hub\Ops\Person;
use Hub\Web\Front;

/** Zoom の役：署名をつけて Webhook を送る（秘密はテストの設定の zoom.secret_token） */
function zoomPost(App $app, array $body, ?string $sig = null): Response
{
    $raw = json_encode($body, JSON_UNESCAPED_UNICODE);
    $ts = (string) intdiv(Time::ms($app->now()), 1000);
    $sig ??= 'v0=' . hash_hmac('sha256', "v0:{$ts}:{$raw}", 'zoom-secret');
    $h = ['host' => 'hub.example.test', 'content-type' => 'application/json', 'x-zm-signature' => $sig, 'x-zm-request-timestamp' => $ts];
    return (new Front($app))->handle(new Request('POST', '/webhook/zoom', $h, $raw, [], [], [], '192.0.2.20', true));
}

function zoomMove(App $app, string $kind, string $name, ?string $email, string $at): Response
{
    $p = ['user_name' => $name, ($kind === 'join' ? 'join_time' : 'leave_time') => $at];
    if ($email !== null) {
        $p['email'] = $email;
    }
    return zoomPost($app, [
        'event' => $kind === 'join' ? 'meeting.participant_joined' : 'meeting.participant_left',
        'event_ts' => Time::ms(Time::parse($at)),
        'payload' => ['object' => ['id' => '12345678901', 'participant' => $p]],
    ]);
}

/** 申込が2人（山田さん・佐藤さん）の、Zoom つきのイベント */
function zoomEvent(App $app, \Hub\Line\FakeLine $line): array
{
    $u1 = Sim::uid(950);
    $u2 = Sim::uid(951);
    $line->setProfile($u1, ['displayName' => '山田 花子']);
    $line->setProfile($u2, ['displayName' => '佐藤 太郎']);
    Sim::send($app, Sim::follow($line, $u1));
    Sim::send($app, Sim::follow($line, $u2));
    Events::upsert($app, ['key' => 'zoom-1020', 'title' => 'オンライン勉強会', 'startsAt' => '2026-10-20T11:00:00Z', 'zoomMeetingId' => '123 4567 8901']);
    T::eq(true, Events::apply($app, $u1, 'zoom-1020')['ok']);
    T::eq(true, Events::apply($app, $u2, 'zoom-1020')['ok']);
    return [$u1, $u2];
}

return [
    'Webhook：URL の確認には秘密の署名で答える・署名が違えば 401・秘密が未設定なら 503' => function () {
        [$app] = T::app();
        $r = zoomPost($app, ['event' => 'endpoint.url_validation', 'payload' => ['plainToken' => 'abcDEF123_-xyz']]);
        T::eq(200, $r->status);
        T::eq(['plainToken' => 'abcDEF123_-xyz', 'encryptedToken' => hash_hmac('sha256', 'abcDEF123_-xyz', 'zoom-secret')], json_decode($r->body, true));
        T::eq(400, zoomPost($app, ['event' => 'endpoint.url_validation', 'payload' => ['plainToken' => 'v0:1:{"event":"x"}']])->status, '署名に使える形の文字には答えない（秘密で好きな文字に署名させない）');
        T::eq(401, zoomPost($app, ['event' => 'meeting.participant_joined', 'payload' => []], 'v0=' . str_repeat('0', 64))->status);
        [$noSecret] = T::app(['zoom' => ['secret_token' => '']]);
        T::eq(503, zoomPost($noSecret, ['event' => 'endpoint.url_validation', 'payload' => ['plainToken' => 'abcDEF123_-xyz']])->status);
    },

    '入退室の記録 → 会議の終わり → 毎分の処理で確定：参加（10分以上）と欠席のタグ・名前とメールは暗号化' => function () {
        [$app, $line] = T::app();
        [$u1, $u2] = zoomEvent($app, $line);
        T::eq(200, zoomMove($app, 'join', '山田花子', null, '2026-10-20T11:00:00Z')->status);
        T::eq(200, zoomMove($app, 'leave', '山田花子', null, '2026-10-20T11:30:00Z')->status);
        zoomMove($app, 'join', 'ゲスト', 'Guest@Example.test', '2026-10-20T11:05:00Z');
        zoomMove($app, 'leave', 'ゲスト', 'Guest@Example.test', '2026-10-20T11:20:00Z');
        zoomMove($app, 'leave', 'ゲスト', 'Guest@Example.test', '2026-10-20T11:20:00Z'); // 同じ通知が2回届いても1つ
        T::eq(4, (int) $app->db()->value('SELECT COUNT(*) FROM line_zoom_log'));
        $raw = json_encode($app->db()->all('SELECT participant_key, user_name, email FROM line_zoom_log'), JSON_UNESCAPED_UNICODE);
        T::ok(!str_contains($raw, '山田') && !str_contains($raw, 'ゲスト') && !str_contains(strtolower($raw), 'guest'), 'DB には名前もメールも平文で残らない（見分ける鍵も指紋）');
        T::eq(200, zoomPost($app, ['event' => 'meeting.ended', 'payload' => ['object' => ['id' => '12345678901', 'end_time' => '2026-10-20T11:40:00Z']]])->status);
        $app->clock->setNow('2026-10-20T11:41:00Z');
        T::eq(0, Zoom::tick($app)['finalized'], '終わってすぐは待つ（退出の通知が遅れて届くことがあるため）');
        $app->clock->setNow('2026-10-20T11:45:00Z');
        T::eq(1, Zoom::tick($app)['finalized']);
        T::ok(in_array('attended:zoom-1020', Friends::tagNames($app, $u1), true), '30分いた山田さんは参加（表示名の空白の違いは気にしない）');
        T::ok(in_array('absent:zoom-1020', Friends::tagNames($app, $u2), true), '来なかった佐藤さんは欠席');
        $att = Zoom::attendance($app, 'zoom-1020');
        T::eq([['山田花子', null, 30, $u1], ['ゲスト', 'guest@example.test', 15, null]], array_map(fn ($a) => [$a['user_name'], $a['email'], (int) $a['minutes'], $a['line_user_id']], $att), '画面には読み戻して出す');
        T::eq(0, Zoom::tick($app)['finalized'], '一度確定したら、新しい通知が来るまで繰り返さない');
    },

    '結びつけ：結びつかなかった参加者を友だちに結ぶと、出欠が直り、次の会からは自動で' => function () {
        [$app, $line] = T::app();
        [$u1, $u2] = zoomEvent($app, $line);
        zoomMove($app, 'join', 'さとう', 'sato@example.test', '2026-10-20T11:00:00Z');
        zoomMove($app, 'leave', 'さとう', 'sato@example.test', '2026-10-20T11:50:00Z');
        zoomPost($app, ['event' => 'meeting.ended', 'payload' => ['object' => ['id' => '12345678901', 'end_time' => '2026-10-20T12:00:00Z']]]);
        $app->clock->setNow('2026-10-20T12:05:00Z');
        $r = Zoom::finalize($app, 'zoom-1020');
        T::eq(1, count($r['unmatched']));
        T::ok(in_array('absent:zoom-1020', Friends::tagNames($app, $u2), true));
        $l = Zoom::linkParticipant($app, 'zoom-1020', $r['unmatched'][0]['key'], $u2);
        T::eq(true, $l['ok']);
        T::ok(in_array('attended:zoom-1020', Friends::tagNames($app, $u2), true), '結んだら参加に直る');
        T::ok(!in_array('absent:zoom-1020', Friends::tagNames($app, $u2), true));
        T::ok(!str_contains((string) json_encode($app->db()->all('SELECT alias_key FROM line_zoom_aliases')), 'sato'), '結びつけの鍵も指紋');
        // 次の会：同じメールで入れば、自動で佐藤さん
        Events::upsert($app, ['key' => 'zoom-1027', 'title' => 'オンライン勉強会', 'startsAt' => '2026-10-27T11:00:00Z', 'zoomMeetingId' => '12345678901']);
        zoomMove($app, 'join', '佐藤（スマホ）', 'SATO@example.test', '2026-10-27T11:00:00Z');
        zoomMove($app, 'leave', '佐藤（スマホ）', 'SATO@example.test', '2026-10-27T11:20:00Z');
        $app->clock->setNow('2026-10-27T12:00:00Z');
        $r2 = Zoom::finalize($app, 'zoom-1027', true);
        T::eq([], $r2['unmatched']);
        T::ok(in_array('attended:zoom-1027', Friends::tagNames($app, $u2), true));
        // 本人の求めで消すと、出欠の記録も消える
        Person::erase($app, $u2);
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_event_attendance WHERE line_user_id = ?', [$u2]));
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_zoom_aliases WHERE line_user_id = ?', [$u2]));
    },
];
