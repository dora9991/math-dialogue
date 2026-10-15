<?php
declare(strict_types=1);

// 運用：暗号化バックアップと復元・本人の情報の書き出しと消去・鍵の入れ替え・毎日の仕事・取り込み・健康診断

use Hub\Kernel\App;
use Hub\Kernel\Clock;
use Hub\Kernel\Config;
use Hub\Kernel\Log;
use Hub\Kernel\Mailer;
use Hub\Line\Outbox;
use Hub\Ops\Backup;
use Hub\Ops\Daily;
use Hub\Ops\Doctor;
use Hub\Ops\ImportLinks;
use Hub\Ops\Keys;
use Hub\Ops\Person;

function tmpVar(): string
{
    $d = sys_get_temp_dir() . '/hub-test-var-' . bin2hex(random_bytes(4));
    mkdir($d, 0700, true);
    return $d;
}

return [
    'バックアップ：暗号化して取る → 戻す・鍵が違う／書き換えると読めない' => function () {
        $var = tmpVar();
        [$app, $line] = T::app(['app' => ['var_dir' => $var]]);
        $u = Sim::uid(900);
        Sim::send($app, Sim::follow($line, $u));
        Sim::send($app, Sim::text($line, $u, 'バックアップの中身'));
        $b = Backup::create($app, 'テスト');
        T::ok(is_file($b['file']));
        T::eq(0600, fileperms($b['file']) & 0777, 'ファイルは 600');
        $raw = (string) file_get_contents($b['file']);
        T::ok(!str_contains($raw, 'CREATE TABLE') && !str_contains($raw, 'INSERT INTO'), 'SQL の文が平文で見えない（見出しに表の名前だけは出る）');
        T::ok(!str_contains($raw, $u), 'userId が平文で見えない');
        T::eq(true, Backup::verify($app, $b['file'])['ok']);
        // 消してから戻す
        $app->db()->exec('DELETE FROM line_friends');
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_friends'));
        $r = Backup::restore($app, $b['file']);
        T::ok($r['statements'] > 40);
        T::eq(1, (int) $app->db()->value('SELECT COUNT(*) FROM line_friends'));
        T::eq('バックアップの中身', \Hub\Line\Chat::thread($app, $u)['items'][1]['text'] ?? null, '暗号化した本文も戻る');
        T::ok(is_file($r['before']), '戻す前の中身も取ってある');
        // 鍵が違う
        [$other] = T::app(['app' => ['var_dir' => $var], 'keys' => ['backup' => base64_encode(str_repeat("\x09", 32))]]);
        T::eq(false, Backup::verify($other, $b['file'])['ok']);
        // 書き換え
        $bad = $b['file'] . '.bad.hubbak';
        $bytes = $raw;
        $pos = strlen($bytes) - 10;
        $bytes[$pos] = chr(ord($bytes[$pos]) ^ 1);
        file_put_contents($bad, $bytes);
        T::eq(false, Backup::verify($app, $bad)['ok']);
        // 途中で切れている
        file_put_contents($bad, substr($raw, 0, (int) (strlen($raw) * 0.6)));
        T::eq(false, Backup::verify($app, $bad)['ok']);
        T::throws(fn () => Backup::restore($app, $bad), '戻せません');
    },

    '本人の情報：書き出し（読める形）と、消去（全部消える）' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(910);
        $other = Sim::uid(911);
        Sim::send($app, Sim::follow($line, $u));
        Sim::send($app, Sim::follow($line, $other));
        Sim::send($app, Sim::text($line, $u, '息子の体調のことで相談です'));
        \Hub\Line\Rules::applyTag($app, $u, '相談');
        \Hub\Line\Friends::setField($app, $u, 'memo', 'x');
        Outbox::enqueue($app, [$u, $other], [['type' => 'text', 'text' => '2人へ']], 'broadcast');
        Outbox::enqueue($app, [$u], [['type' => 'text', 'text' => '1人へ']], 'chat', 'staff@example.test');
        $x = Person::export($app, $u);
        T::eq('息子の体調のことで相談です', $x['messages'][1]['text']);
        T::eq(['相談'], $x['tags']);
        T::eq(2, count($x['sent']));
        $c = Person::erase($app, $u);
        T::eq(1, $c['friend']);
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_friends WHERE line_user_id = ?', [$u]));
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_message_log WHERE line_user_id = ?', [$u]));
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_events WHERE line_user_id = ?', [$u]));
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_friend_tags WHERE line_user_id = ?', [$u]));
        T::eq(0, (int) $app->db()->value('SELECT COUNT(*) FROM line_outbox WHERE JSON_CONTAINS(to_user_ids, JSON_QUOTE(?))', [$u]));
        T::eq(1, (int) $app->db()->value('SELECT COUNT(*) FROM line_outbox'), '2人へ送った行は残り、その人だけ外れる');
        T::eq(json_encode([$other]), $app->db()->value('SELECT to_user_ids FROM line_outbox'));
        T::eq(1, (int) $app->db()->value('SELECT COUNT(*) FROM line_friends'), 'ほかの人は残る');
        T::eq(null, Person::export($app, $u));
    },

    '鍵の入れ替え：新しい鍵で暗号化し直し、古い鍵を外しても読める' => function () {
        [$app, $line] = T::app();
        $u = Sim::uid(920);
        Sim::send($app, Sim::follow($line, $u));
        Sim::send($app, Sim::text($line, $u, '鍵の入れ替えのテスト'));
        $k1 = T::config()['keys']['data']['k1'];
        $k2 = base64_encode(random_bytes(32));
        [$app2] = T::app(['keys' => ['data' => ['k1' => $k1, 'k2' => $k2], 'data_primary' => 'k2']]);
        T::ok((Keys::census($app2)['k1'] ?? 0) > 0);
        $n = Keys::rotate($app2);
        T::ok($n > 0);
        T::eq(['k2'], array_keys(Keys::census($app2)), '全部 k2 になった');
        $cfg = T::config();
        $cfg['keys']['data'] = ['k2' => $k2];
        $cfg['keys']['data_primary'] = 'k2';
        $app3 = new App(Config::fromArray($cfg), $app->clock);
        $app3->setDb(T::$db);
        $app3->setLog(new Log('', $app->clock, false, true));
        T::eq('鍵の入れ替えのテスト', \Hub\Line\Chat::thread($app3, $u)['items'][1]['text'] ?? null, '古い鍵を消しても読める');
    },

    '毎日の仕事：決まった時刻を過ぎた最初の1回だけ（バックアップ3時・片づけ4時・報告7時）' => function () {
        $var = tmpVar();
        [$app] = T::app(['app' => ['var_dir' => $var]]);
        $app->clock->setNow('2026-10-20T17:30:00Z'); // 日本時間 10/21 2:30
        $o = Daily::tick($app);
        T::ok(!isset($o['backup']) && !isset($o['report']), '2:30 はまだ');
        $app->clock->setNow('2026-10-20T18:01:00Z'); // 3:01
        T::ok(isset(Daily::tick($app)['backup']['file']), '3時を過ぎたらバックアップ');
        T::ok(!isset(Daily::tick($app)['backup']), '同じ日は2回やらない');
        $app->clock->setNow('2026-10-20T22:05:00Z'); // 7:05
        $o = Daily::tick($app);
        T::ok(isset($o['cleanup']), '片づけ');
        T::ok(isset($o['report']['text']), '報告');
        $mail = $app->mailer()->sent[count($app->mailer()->sent) - 1];
        T::contains('毎日の報告', $mail['subject']);
        T::contains('【友だち】', $mail['body']);
        T::contains('鎖を確かめました', $mail['body']);
        T::ok($app->kv()->get('tick.last_ok_at') !== null, '毎分の処理が動いた印');
        // メンテナンス中（更新・復元の最中）は止める。長く続いたら知らせる
        $app->kv()->set('maintenance', \Hub\Kernel\Time::iso($app->now()));
        T::eq(['skipped' => 'maintenance'], Daily::tick($app));
        $sent = count($app->mailer()->sent);
        $app->clock->advance(3 * 3600);
        T::eq(['skipped' => 'maintenance'], Daily::tick($app));
        T::eq($sent + 1, count($app->mailer()->sent), '2時間を過ぎたら、知らせる');
        T::contains('メンテナンス中のまま', $app->mailer()->sent[$sent]['subject']);
        $app->kv()->delete('maintenance');
        T::ok(!isset(Daily::tick($app)['skipped']), '終われば、また動く');
    },

    '片づけ：保存期間を過ぎた記録を消す（操作の記録は起点を覚えて、鎖を確かめ続ける）' => function () {
        [$app, $line] = T::app(['retention' => ['audit_days' => 365]]);
        $u = Sim::uid(930);
        Sim::send($app, Sim::follow($line, $u));
        $app->audit()->record(null, 'old.one');
        $app->audit()->record(null, 'old.two');
        $app->clock->advance(400 * 86400);
        $app->audit()->record(null, 'new.one');
        Sim::send($app, Sim::text($line, $u, '新しい'));
        $r = Daily::cleanup($app);
        T::eq(2, $r['audit_log']);
        T::eq(true, $app->audit()->verify($app->kv()->get('audit.anchor'))['ok'], '残りの鎖は確かめられる');
        $h = \Hub\Line\Hub::cleanup($app);
        T::eq(1, $h['message_log'], '365日を過ぎたトークを消す');
    },

    '取り込み：いまの会員サイトの連携（CSV）' => function () {
        [$app, $line] = T::app();
        $u1 = Sim::uid(940);
        $u2 = Sim::uid(941);
        $line->setProfile($u1, ['displayName' => '取り込み先生']);
        $csv = sys_get_temp_dir() . '/links-' . bin2hex(random_bytes(3)) . '.csv';
        file_put_contents($csv, "\xEF\xBB\xBFmember_ref,line_user_id,plan,rank\nm-1,{$u1},guild,20\nm-2,{$u2},,\nbad,not-a-user,,\n");
        $r = ImportLinks::run($app, $csv, true);
        unlink($csv);
        T::eq(2, $r['linked']);
        T::eq(1, $r['skipped']);
        T::eq(1, $r['blocked'], 'プロフィールが取れない人は、友だちではない（ブロック）');
        $f = $app->db()->one('SELECT display_name, member_ref, member_plan, member_rank, status FROM line_friends WHERE line_user_id = ?', [$u1]);
        T::eq(['display_name' => '取り込み先生', 'member_ref' => 'm-1', 'member_plan' => 'guild', 'member_rank' => 20, 'status' => 'active'], $f);
        T::eq('blocked', $app->db()->value('SELECT status FROM line_friends WHERE line_user_id = ?', [$u2]));
    },

    '健康診断（つながらない項目を除いて）が、最後まで動く' => function () {
        $var = tmpVar();
        [$app] = T::app(['app' => ['var_dir' => $var]]);
        $items = (new Doctor($app))->run(false);
        $byTitle = [];
        foreach ($items as $i) {
            $byTitle[$i['title']] = $i;
        }
        T::eq('ng', $byTitle['オーナー']['level'] ?? null, 'オーナーがいなければ ng');
        T::eq('ng', $byTitle['鍵']['level'] ?? null, 'テストの鍵（同じバイトの繰り返し）は弱いと言う');
        T::eq('ok', $byTitle['データベースの形']['level'] ?? null);
        T::eq('ok', $byTitle['操作の記録（改ざんの検知）']['level'] ?? null);
        T::eq('warn', $byTitle['app.env']['level'] ?? null);
    },
];
