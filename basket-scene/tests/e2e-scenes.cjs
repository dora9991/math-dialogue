// タブ「② 場面」：一覧・しぼりこみ・場面を見る・続けて再生・外す・手直し・場面の長さの設定・1本の動画にする・ほかのタブからの呼び出し・動画なし・記録なし・画面の大きさ
//   node tests/e2e-scenes.cjs [dev|built]    SHOTS=フォルダ で画面の写真
const fs = require('fs');
const T = require('./helpers.cjs');
const MODE = process.argv[2] || 'dev';
const PREFS = { hints: { scenes: true } };      // 「② 場面で、すぐ見られます」のお知らせは出さない（行を押すのに じゃまなので）

/* 記録を足す：[t, type, team, no] */
const seed = (page, list) => page.evaluate((L) => { const g = SC.app.S.game; L.forEach(([t, type, team, no]) => BT.addEvent(g, { t, type, team, no })); SC.app.save(); }, list);
const names = (page) => page.evaluate(() => { const ps = SC.app.S.game.teams[0].players; [['7', 'たけし'], ['4', 'ゆうと'], ['5', 'りく'], ['8', 'はると']].forEach(([no, nm]) => { const p = ps.find((x) => x.no === no); if (p) p.name = nm; }); SC.app.save(); });
const rows = (page) => page.$$eval('#snList .sn-row', (els) => els.map((e) => e.dataset.id));
const onRows = (page) => page.$$eval('#snList .sn-row.on', (els) => els.map((e) => e.dataset.id));
const now = (page) => page.evaluate(() => SC.app.now());
const paused = (page) => page.evaluate(() => SC.app.S.media.paused);
const clearToasts = (page) => page.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; });
const playRow = (page, id) => page.click(`#snList .sn-row[data-id="${id}"] .sn-play`);
const win = (page, id) => page.evaluate((x) => SC.scenes.windowOf(x), id);
const text = (page, sel) => page.textContent(sel).then((s) => (s || '').replace(/\s+/g, ' ').trim());
// 1Q：e2〜e7・2Q：e9〜e10（e8 は 2Q のはじまり）
const BASE = [[30, 'fg2', 0, '7'], [3, 'fg3x', 0, '4'], [34, 'oreb', 0, '4'], [50, 'fg2', 1, null], [60, 'mark', null, null], [70, 'ft', 0, null]];
const LATE = [[90, 'stl', 0, '7'], [118.5, 'fg3', 0, '7']];

/* 写真・画面の大きさ用：ふつうの試合らしい記録を n 個 */
function many(n) {
  const T0 = ['fg2', 'fg2x', 'reb', 'fg3', 'ast', 'stl', 'fg2', 'tov', 'ft', 'foul', 'dreb', 'fg3x', 'mark'];
  const nos = ['4', '5', '7', '8', '10', '11'];
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = 4 + i * (110 / n);
    const type = T0[i % T0.length];
    if (i % 5 === 3) out.push([t, i % 2 ? 'fg2' : 'fg3', 1, null]);
    else if (type === 'mark') out.push([t, 'mark', null, null]);
    else out.push([t, type, 0, i % 7 === 6 ? null : nos[i % nos.length]]);
  }
  return out;
}

(async () => {
  const { browser, srv, close } = await T.launch(MODE);
  try {
    const VID = await T.video('g120.mp4', 120);
    T.section(`${MODE === 'built' ? '1ファイル版' : '開発版'}・スマホ（390×844）`);
    const { ctx, page, errors } = await T.open(browser, srv.url, { width: 390, height: 844 }, { prefs: PREFS });
    await T.start(page, VID, { name: 'ミライ', opp: 'ヒガシ' });

    // ---------- 記録がないとき ----------
    T.ok(!(await page.isVisible('#scTab-scenes .bdg')), 'タブの数字：記録がないときは出ない');
    await page.click('#scTab-scenes');
    T.ok(await page.isVisible('#snEmpty') && (await text(page, '#snEmpty')).includes('① 記録'), '記録がないとき：「まだ場面はありません」と「① 記録」への案内');
    await page.click('#snGoTap');
    T.ok(await page.evaluate(() => SC.app.S.tab === 'tap'), '「① 記録へ」で、① 記録のタブへ');

    // ---------- 一覧 ----------
    await names(page);
    await seed(page, BASE);
    await page.evaluate(() => BT.addEvent(SC.app.S.game, { t: 80, type: 'period', period: 2 }));
    await seed(page, LATE);
    T.eq(await text(page, '#scTab-scenes .bdg'), '8', 'タブの数字：場面の数（8。ピリオドは数えない）');
    await page.click('#scTab-scenes');
    T.eq(await rows(page), ['e3', 'e2', 'e4', 'e5', 'e6', 'e7', 'e9', 'e10'], 'はじめは、全部の場面（自分・相手の得点・★）を、動画の時刻の順に');
    T.ok((await text(page, '#snSum')).startsWith('8 場面・'), 'まとめ：「8 場面・…」', await text(page, '#snSum'));
    const r2 = await text(page, '.sn-row[data-id="e2"]');
    T.ok(r2.includes('0:30') && r2.includes('1Q') && r2.includes('#7 たけし') && r2.includes('2P成功') && r2.includes('12秒'), '行：時刻・ピリオド・だれ・何・長さ（0:30 1Q #7 たけし 2P成功 12秒）', r2);
    T.ok((await text(page, '.sn-row[data-id="e5"]')).includes('相手の得点（2点）') && (await text(page, '.sn-row[data-id="e9"]')).includes('2Q'), '相手の得点は「相手の得点（2点）」・2Q の場面は 2Q');
    T.ok(await page.$$eval('.sn-row .chip', (els) => els.length) === 8 && !(await page.$('.sn-edit')), '行にチームの色・はじめは ✎ なし（設定で出す）');
    T.eq(await page.$$eval('#snPlays .sn-chip', (els) => els.map((e) => e.textContent)), ['すべて8', '得点3', 'シュート4', 'リバウンド1', 'スティール1', '★1', '相手の得点1'], 'プレーのしぼりこみ：ある記録のものだけ（数つき）');
    T.eq(await page.$$eval('#snNos .sn-chip', (els) => els.map((e) => e.textContent)), ['全員8', '#42', '#73', '番号なし1'], '選手のしぼりこみ：全員・#4・#7・番号なし');
    await T.shot(page, 'scenes-list');

    // ---------- しぼりこみ ----------
    const pick = async (sel) => { await page.click(sel); return rows(page); };
    T.eq(await pick('[data-snplay="score"]'), ['e2', 'e7', 'e10'], '「得点」：自分の得点');
    T.eq(await pick('[data-snplay="shot"]'), ['e3', 'e2', 'e7', 'e10'], '「シュート」：成功と失敗');
    T.eq(await pick('[data-snplay="reb"]'), ['e4'], '「リバウンド」');
    T.eq(await pick('[data-snplay="mark"]'), ['e6'], '「★」');
    T.eq(await pick('[data-snplay="opp"]'), ['e5'], '「相手の得点」');
    T.eq(await pick('[data-snplay="all"]'), ['e3', 'e2', 'e4', 'e5', 'e6', 'e7', 'e9', 'e10'], '「すべて」');
    T.eq(await pick('[data-snno="7"]'), ['e2', 'e9', 'e10'], '「#7」');
    T.eq(await page.$$eval('#snPlays .sn-chip', (els) => els.map((e) => e.textContent)), ['すべて3', '得点2', 'シュート2', 'リバウンド0', 'スティール1', '★0', '相手の得点0'], '#7 を選ぶと、プレーの数は #7 の中で');
    T.eq(await pick('[data-snplay="score"]'), ['e2', 'e10'], '「#7」＋「得点」');
    T.ok((await text(page, '#snSum')).startsWith('2 場面'), 'まとめも、しぼりこんだ数に（2 場面）');
    T.eq(await pick('[data-snno="none"]'), ['e7'], '「番号なし」＋「得点」');
    await page.click('[data-snplay="all"]');
    T.eq(await pick('[data-snno="all"]'), ['e3', 'e2', 'e4', 'e5', 'e6', 'e7', 'e9', 'e10'], '「全員」で もとに戻る');

    // ---------- 場面を見る ----------
    await page.evaluate(() => { window.__row = document.querySelector('.sn-row[data-id="e6"]'); });
    await playRow(page, 'e6');
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(400);
    let t = await now(page);
    T.ok(t >= 55 && t < 62 && (await onRows(page)).join() === 'e6' && (await text(page, '.sn-row[data-id="e6"] .sn-ic')) === '■', `行を押すと、その場面（★ 0:55〜1:02）から再生・行が光る（${t} 秒）`);
    await page.waitForFunction(() => SC.app.S.media.paused, null, { timeout: 15000 });
    t = await now(page);
    T.ok(Math.abs(t - 62) < 0.4 && (await onRows(page)).length === 0, `場面のおわり（1:02）で止まる・光が消える（${t} 秒）`);
    T.ok(await page.evaluate(() => document.querySelector('.sn-row[data-id="e6"]') === window.__row), '再生しても、一覧は作り直さない（同じ行のまま）');
    await playRow(page, 'e2');
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(500);
    await playRow(page, 'e2');
    await T.sleep(200);
    t = await now(page);
    T.ok(await paused(page) && t > 20 && t < 22 && (await onRows(page)).length === 0, `再生中の行をもう一度押すと止まる（${t} 秒）`);

    // ---------- 手直し（✎）：設定で出したときだけ ----------
    await page.click('#scSettings');
    T.ok(await page.isVisible('#scSec-scenes') && (await text(page, '#scSec-scenes')).includes('② 場面の長さ・動画'), '設定に「② 場面の長さ・動画」');
    await page.click('#scSec-scenes [data-pref="sceneDetail"]');
    await page.evaluate(() => BT.ui.closeSheet());
    T.ok(await page.$$eval('.sn-edit', (els) => els.length) === 8, '「細かい手直し（✎）を出す」で、行に ✎');
    await page.click('[data-snadj="e2"]');
    await page.waitForSelector('#snAdj');
    T.ok(!(await page.$('#snAdjEdit')), '「記録を直す」は、記録のタブの SC.tap.edit がないときは出ない');
    await page.click('#snS0m'); await page.click('#snS0m'); await page.click('#snS1p');
    let g = await T.game(page);
    T.eq(g.sceneAdj, { e2: { d0: -2, d1: 1 } }, '手直し：はじめを 2 秒前・おわりを 1 秒後 → game.sceneAdj');
    T.eq([await text(page, '#snAdjT0'), await text(page, '#snAdjT1'), await text(page, '#snAdjLen')], ['0:18', '0:33', '15秒'], '小窓に、はじめ・おわり・長さ（0:18・0:33・15秒）');
    T.eq(await win(page, 'e2'), { t0: 18, t1: 33 }, 'SC.scenes.windowOf も 0:18〜0:33');
    T.ok((await text(page, '.sn-row[data-id="e2"]')).includes('15秒'), '一覧の長さも 15秒');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bscene:game:' + SC.app.S.game.id)).sceneAdj);
    T.eq(saved, { e2: { d0: -2, d1: 1 } }, '手直しは、試合といっしょに保存される');
    await page.click('#snAdjPlay');
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(300);
    t = await now(page);
    T.ok(t >= 18 && t < 20, `小窓の「▶ 見る」で、手直しした場面（0:18 から）を再生（${t} 秒）`);
    await page.evaluate(() => { SC.app.stopRange(); SC.app.pause(); });
    await page.click('#snAdjReset');
    g = await T.game(page);
    T.ok(!g.sceneAdj && (await text(page, '#snAdjLen')) === '12秒', '「はじめに戻す」で、もとの長さ（sceneAdj から消える）');
    await page.evaluate(() => { window.__edited = null; SC.tap = SC.tap || {}; SC.tap.edit = (id) => { window.__edited = id; }; });
    await page.evaluate(() => BT.ui.closeSheet());
    await page.click('[data-snadj="e9"]');
    await page.click('#snAdjOff');
    g = await T.game(page);
    T.ok(g.sceneOff && g.sceneOff.e9 === true && (await text(page, '#snAdjOff')) === 'この場面を入れる', '「この場面を外す」→ game.sceneOff（ボタンは「この場面を入れる」に）');
    await T.shot(page, 'scenes-adjust');
    await page.click('#snAdjEdit');
    T.ok(await page.evaluate(() => window.__edited === 'e9' && !BT.ui.sheetOpen()), '「記録を直す」→ SC.tap.edit(id)（あるときだけ出る）');
    T.ok(await page.isVisible('.sn-row.off[data-id="e9"]') && (await text(page, '.sn-row[data-id="e9"]')).includes('外した'), '外した場面は、うすく「外した」');
    T.ok((await text(page, '.sn-sum')).includes('1 場面は外しています'), 'まとめに「1 場面は外しています」');

    // ---------- 場面の長さの設定 ----------
    await page.click('#scSettings');
    T.eq([await text(page, '#snWin-base-lead-v'), await text(page, '#snWin-base-lag-v')], ['10秒', '2秒'], '設定：ふつうの場面 前 10 秒・後 2 秒');
    await page.click('#snWin-base-lead [data-d="1"]');
    T.eq(await text(page, '#snWin-base-lead-v'), '11秒', '「＋」で 前 11 秒');
    T.eq(await win(page, 'e2'), { t0: 19, t1: 32 }, 'すぐに場面が変わる（0:19〜0:32）');
    T.ok((await text(page, '.sn-row[data-id="e2"]')).includes('13秒'), '一覧の長さも、すぐに 13秒');
    T.eq(await page.evaluate(() => JSON.parse(localStorage.getItem('bscene:prefs')).win.lead), 11, '設定は保存される（bscene:prefs）');
    T.ok(!(await page.isVisible('#snWin-score-lag')), '「プレーごとに変える」は、はじめは閉じている');
    await page.click('#snWinBy summary');
    T.eq([await text(page, '#snWin-score-lead-v'), await text(page, '#snWin-reb-lead-v'), await text(page, '#snWin-mark-lead-v')], ['11秒', '5秒', '5秒'], 'プレーごと：得点は ふつうと同じ・リバウンドと ★ は 前 5 秒');
    await page.click('#snWin-score-lag [data-d="1"]');
    T.eq([await win(page, 'e2'), await win(page, 'e9')], [{ t0: 19, t1: 33 }, { t0: 79, t1: 92 }], '得点だけ 後 3 秒（スティールは そのまま）');
    T.eq(await page.evaluate(() => JSON.parse(localStorage.getItem('bscene:prefs')).win.by.score), { lead: 11, lag: 3 }, 'プレーごとの長さも保存される');
    await page.click('#snWin-base-lag [data-d="-1"]');
    T.eq([await win(page, 'e9'), await text(page, '#snWin-stl-lag-v')], [{ t0: 79, t1: 91 }, '1秒'], 'ふつうを変えると、変えていないプレーも いっしょに変わる');
    await page.click('#snWinReset');
    T.eq([await win(page, 'e2'), await win(page, 'e4'), await text(page, '#snWin-base-lead-v')], [{ t0: 20, t1: 32 }, { t0: 29, t1: 36 }, '10秒'], '「はじめの長さに戻す」');
    T.ok(!(await page.evaluate(() => JSON.parse(localStorage.getItem('bscene:prefs')).win.by.score)), 'もどすと、プレーごとに変えたものも消える');
    await T.shot(page, 'scenes-settings');
    await page.evaluate(() => BT.ui.closeSheet());

    // ---------- 続けて再生 ----------
    // 短くする（前 2 秒・後 1 秒・リバウンドは 前 4 秒）→ #4・#7 の場面：e3 0:01〜0:04 / e2 0:28〜0:31 ＋ e4 0:30〜0:35（重なる → 1つ）/ e9（外した）/ e10 1:56.5〜1:59.5
    await page.evaluate(() => { SC.app.S.prefs.win = { lead: 2, lag: 1, by: { reb: { lead: 4, lag: 1 } } }; SC.app.savePrefs(); window.__ranges = []; SC.app.on('range', (r) => { if (r) window.__ranges.push([r.t0, r.t1]); }); });
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: null, nos: ['4', '7'], team: null }, title: '#4 と #7' }));
    T.eq(await rows(page), ['e3', 'e2', 'e4', 'e9', 'e10'], 'しぼりこみ（#4 と #7）');
    await clearToasts(page);
    await page.click('#snPlayAll');
    await page.waitForSelector('#snReelBar:not([hidden])');
    T.ok((await text(page, '#snReelPos')) === '1 / 3' && (await text(page, '#snPlayAll')) === '■ やめる', '「▶ 続けて再生」：「1 / 3」（外した場面は入らない）・ボタンは「■ やめる」', await text(page, '#snReelPos'));
    await page.waitForFunction(() => document.querySelector('#snReelPos') && document.querySelector('#snReelPos').textContent === '2 / 3', null, { timeout: 15000 });
    await T.sleep(300);
    T.eq(await onRows(page), ['e2', 'e4'], '重なる場面（2P成功 → リバウンド）は 1つにつないで、2行とも光る');
    T.ok((await text(page, '#snReelBar')).includes('#7 たけし 2P成功 → #4 ゆうと オフェンスリバウンド'), 'バーに、いまの場面の名前');
    await T.shot(page, 'scenes-reel');
    await page.waitForFunction(() => document.querySelector('#snReelBar').hidden, null, { timeout: 30000 });
    T.eq(await page.evaluate(() => window.__ranges), [[1, 4], [28, 35], [116.5, 119.5]], '続けて再生：場面の順に、つないで、外した場面（e9）は とばす');
    T.ok(await paused(page) && Math.abs((await now(page)) - 119.5) < 0.4 && (await onRows(page)).length === 0, '最後の場面のおわりで止まる');
    await page.evaluate(() => { window.__ranges = []; });
    await clearToasts(page);
    await page.click('#snPlayAll');
    await page.waitForSelector('#snReelBar:not([hidden])');
    await T.sleep(400);
    await page.click('#snReelNext');
    await T.sleep(400);
    T.eq(await text(page, '#snReelPos'), '2 / 3', '「⏭」で次の場面へ');
    await page.click('#snReelStop');
    await T.sleep(200);
    T.ok(await page.isHidden('#snReelBar') && await paused(page) && (await onRows(page)).length === 0 && (await text(page, '#snPlayAll')) === '▶ 続けて再生', '「■ やめる」で止まる（バーが消える）');
    // 入れ直す
    await page.evaluate(() => { delete SC.app.S.game.sceneOff; SC.app.save(); });

    // ---------- ほかのタブからの呼び出し（show(arg)） ----------
    T.ok(await page.isVisible('#snFilterBar') && (await text(page, '#snTitle')).includes('#4 と #7'), 'title：しぼりこみの名前が一覧の上に');
    await page.click('#snClearFilter');
    T.ok(!(await page.$('#snFilterBar')) && (await rows(page)).length === 8, '「× しぼりこみを外す」で、全部の場面に');
    await page.evaluate(() => SC.app.setTab('stats'));
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: ['fg2', 'fg2x'], nos: ['7'], team: 0 }, title: '#7 たけし の 2P' }));
    T.ok((await rows(page)).join() === 'e2' && (await text(page, '#snTitle')).includes('#7 たけし の 2P') && await page.isVisible('#snClearFilter'), 'filter（types・nos・team）と title：#7 の 2P だけ・「× しぼりこみを外す」');
    T.ok(await page.$eval('[data-snno="7"]', (e) => e.classList.contains('on')), 'しぼりこみのボタンも #7 が選ばれている');
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: null, nos: [''], team: null } }));
    T.ok((await rows(page)).join() === 'e7' && (await text(page, '#snTitle')).includes('番号なし'), "nos ['']：番号なし（title がなければ、しぼりこみから名前を作る）");
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: null, nos: null, team: 1 } }));
    T.eq(await rows(page), ['e5'], 'team 1：相手だけ（★ は入らない）');
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: ['fg2', 'mark'], nos: null, team: null } }));
    T.eq(await rows(page), ['e2', 'e5', 'e6'], 'team null：★ も入る');
    await page.evaluate(() => SC.app.setTab('tap'));
    await page.evaluate(() => SC.app.setTab('scenes'));
    T.eq(await rows(page), ['e2', 'e5', 'e6'], 'show() だけ（arg なし）のときは、前のしぼりこみのまま');
    await clearToasts(page);
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: null, nos: ['4'], team: 0 }, play: 'first' }));
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(300);
    t = await now(page);
    T.ok(t >= 1 && t < 4 && (await onRows(page)).join() === 'e3', `play: 'first'：着いたら、最初の場面（#4 0:01〜）を再生（${t} 秒）`);
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: null, nos: ['7'], team: null }, play: 'reel' }));
    await page.waitForSelector('#snReelBar:not([hidden])');
    T.ok((await text(page, '#snReelPos')) === '1 / 3' && (await onRows(page)).join() === 'e2', "play: 'reel'：着いたら、続けて再生（1 / 3）");
    await page.click('#snReelStop');
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: null, nos: null, team: null }, focus: 'e10' }));
    await T.sleep(400);
    const fz = await page.evaluate(() => { const r = document.querySelector('.sn-row[data-id="e10"]'), p = document.querySelector('#scPane-scenes').getBoundingClientRect(), b = r.getBoundingClientRect(); return { focus: r.classList.contains('focus'), inView: b.top >= p.top - 1 && b.bottom <= p.bottom + 1 }; });
    T.ok(fz.focus && fz.inView, "focus：その場面が見えるところへ動いて、光る", fz);
    T.eq(await page.evaluate(() => SC.scenes.list({ types: ['fg3'], nos: ['7'], team: 0 }).map((s) => [s.id, s.t0, s.t1, s.label, s.sub])), [['e10', 116.5, 119.5, '#7 たけし 3P成功', '2Q 1:58']], 'SC.scenes.list(filter)：ほかのタブも同じ計算を使える');

    // ---------- 1本の動画にする ----------
    await page.evaluate(() => SC.app.setTab('scenes', { filter: { types: ['fg3'], nos: ['7'], team: 0 }, title: '#7 の 3P' }));
    await page.click('#snExport');
    await page.waitForSelector('#snExpBar');
    T.ok(await page.isVisible('#snExpCancel') && (await text(page, '#snExpBox')).includes('動画を作っています'), '「🎬 1本の動画にする」：進みのバーと「やめる」');
    T.ok(await page.$eval('#snPlayAll', (e) => e.disabled) && await page.$eval('#snList', (e) => e.classList.contains('busy')), '作っている間は、ほかの再生はできない');
    await page.waitForFunction(() => parseFloat(document.querySelector('#snExpBar').style.width) > 25, null, { timeout: 20000 });
    await T.shot(page, 'scenes-export');
    await page.waitForSelector('#snExpSave', { timeout: 40000 });
    T.ok(await page.evaluate(() => BS.APP === 'バスケ得点クリップ'), '書き出しのあと、BS.APP は もとに戻る');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#snExpSave')]);
    const file = await dl.path();
    const size = fs.statSync(file).size;
    const fname = dl.suggestedFilename();
    T.ok(size > 1000 && /^バスケ記録_.*ミライvsヒガシ_7_の_3P_1場面\.(webm|mp4)$/.test(fname), `動画ができて「⬇ 保存する」で保存（${fname}・${size} バイト）`, fname);
    await page.click('#snExpClose');
    // やめる
    await page.click('#snExport');
    await page.waitForSelector('#snExpCancel');
    await T.sleep(800);
    await page.click('#snExpCancel');
    await page.waitForFunction(() => !document.querySelector('#snExpCancel'), null, { timeout: 10000 });
    T.ok(!(await page.$('#snExpSave')) && (await text(page, '#toasts')).includes('やめました') && !(await page.$eval('#snPlayAll', (e) => e.disabled)), '「やめる」で、動画づくりを やめる（保存ボタンは出ない・また再生できる）');
    await page.click('#snClearFilter');

    // ---------- ほかのタブで記録すると ----------
    await page.evaluate(() => SC.app.setTab('tap'));
    await seed(page, [[100, 'fg2', 0, '5']]);
    T.eq(await text(page, '#scTab-scenes .bdg'), '9', 'ほかのタブで記録すると、タブの数字が増える');
    await page.click('#scTab-scenes');
    T.ok((await rows(page)).includes('e11') && (await text(page, '.sn-row[data-id="e11"]')).includes('#5 りく'), '② 場面に戻ると、その場面が一覧にある');
    T.ok(await page.isVisible('[data-snno="5"]'), '選手のしぼりこみにも #5');

    // ---------- 動画がないとき（ホームの一覧から開く） ----------
    await page.click('#scHome');
    await page.waitForSelector('#scGames');
    await page.click('#scGames .sc-game');
    await page.waitForFunction(() => SC.app.S.view === 'work' && !SC.app.hasVideo());
    await page.click('#scTab-scenes');
    T.ok(await page.isVisible('#snBanner') && (await text(page, '#snBanner')).includes('🎬 動画を選ぶと、場面を見られます') && (await rows(page)).length === 9, '動画がないとき：一覧はある・「🎬 動画を選ぶと、場面を見られます」');
    T.ok(await page.$eval('#snPlayAll', (e) => e.disabled) && await page.$eval('#snExport', (e) => e.disabled) && (await text(page, '#snWhy')).includes('動画を選ぶと'), '「続けて再生」「1本の動画」は押せない（わけも出る）');
    await T.shot(page, 'scenes-novideo');
    await playRow(page, 'e2');
    T.ok((await text(page, '#toasts')).includes('動画を選ぶと'), '行を押すと「動画を選ぶと、場面を見られます」');
    await T.pick(page, '#snPickVideo', VID);
    await T.ready(page);
    await T.sleep(300);
    T.ok(!(await page.$('#snBanner')) && !(await page.$eval('#snPlayAll', (e) => e.disabled)), '「🎬 動画を選ぶ」→ 動画がつながると、すぐ見られる');
    await clearToasts(page);
    await playRow(page, 'e5');
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(300);
    t = await now(page);
    T.ok(t >= 40 && t < 52, `そのまま 1 回目のタップで再生（${t} 秒）`);
    await page.evaluate(() => { SC.app.stopRange(); SC.app.pause(); });
    T.ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    // ---------- 画面の大きさ（40 場面） ----------
    T.section('画面の大きさ（40 場面）');
    for (const [name, vp, scheme] of [['小さなスマホ 320×568', { width: 320, height: 568 }], ['スマホ 390×844', { width: 390, height: 844 }, 'dark'], ['スマホの横 844×390', { width: 844, height: 390 }], ['iPad 縦 820×1180', { width: 820, height: 1180 }], ['iPad 横 1180×820', { width: 1180, height: 820 }, 'dark']]) {
      const P = await T.open(browser, srv.url, vp, { prefs: Object.assign({ sceneDetail: true }, PREFS), scheme });
      await T.start(P.page, VID, { name: 'ミライ', opp: 'ヒガシ' });
      await names(P.page);
      await seed(P.page, many(40));
      await P.page.click('#scTab-scenes');
      await P.page.evaluate(() => SC.app.setTab('scenes', { filter: { types: ['fg2', 'fg2x', 'fg3', 'fg3x'], nos: ['7'], team: 0 }, title: '#7 たけし の 2P・3P（シュート）' }));
      const L = await P.page.evaluate(() => {
        const pane = document.querySelector('#scPane-scenes'), pr = pane.getBoundingClientRect();
        const small = []; const out = []; const over = [];
        const tgt = Array.from(pane.querySelectorAll('button')).filter((b) => b.offsetParent);
        tgt.forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 39.5) small.push(b.id || b.className + ':' + b.textContent.slice(0, 10) + ':' + Math.round(r.height)); if (!b.closest('.sn-chips') && (r.right > pr.right + 0.5 || r.left < pr.left - 0.5)) out.push(b.id || b.textContent.slice(0, 10)); });
        // しぼりこみのボタンの行は、よこに すべる（行そのものは、はみ出さない）
        pane.querySelectorAll('.sn-chips').forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > pr.right + 0.5 || r.left < pr.left - 0.5) out.push('chips:' + e.id); });
        pane.querySelectorAll('.sn-row, .sn-actions, .sn-fbar, .sn-sum').forEach((e) => { if (e.scrollWidth > e.clientWidth + 1) over.push(e.className + ':' + (e.dataset.id || '')); });
        return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, paneHScroll: pane.scrollWidth > pane.clientWidth + 1, pane: [Math.round(pr.width), Math.round(pr.height)], small, out, over, rows: pane.querySelectorAll('.sn-row').length };
      });
      T.ok(!L.hscroll && !L.paneHScroll && !L.small.length && !L.out.length && !L.over.length && L.rows > 0, `${name}：はみ出さない・押す所は 40px 以上（タブの中身 ${L.pane.join('×')}・${L.rows} 行）`, L);
      await P.page.click('#snClearFilter');
      const n = (await rows(P.page)).length;
      const tm = await P.page.evaluate(async () => { const t0 = performance.now(); SC.app.setTab('stats'); SC.app.save(); SC.app.setTab('scenes'); return performance.now() - t0; });
      T.ok(n === 40 && tm < 200, `${name}：40 場面を すぐに出せる（${Math.round(tm)} ms）`);
      T.ok(P.errors.length === 0, `${name}：ページのエラーなし`, P.errors);
      await P.ctx.close();
    }

    // ---------- 写真（SHOTS があるとき）：12 場面・1つ再生中 ----------
    if (T.SHOTS) {
      T.section('写真');
      for (const [name, vp, scheme] of [['390x844-light', { width: 390, height: 844 }], ['390x844-dark', { width: 390, height: 844 }, 'dark'], ['844x390', { width: 844, height: 390 }], ['1180x820', { width: 1180, height: 820 }], ['320x568', { width: 320, height: 568 }]]) {
        const P = await T.open(browser, srv.url, vp, { prefs: PREFS, scheme });
        await T.start(P.page, VID, { name: 'ミライ', opp: 'ヒガシ' });
        await names(P.page);
        await seed(P.page, many(12));
        await P.page.click('#scTab-scenes');
        await clearToasts(P.page);
        const id = (await rows(P.page))[2];
        await playRow(P.page, id);
        await P.page.waitForFunction(() => !SC.app.S.media.paused);
        await T.sleep(1200);
        await T.shot(P.page, 'scenes-play-' + name);
        await P.page.evaluate(() => { SC.app.stopRange(); SC.app.pause(); });
        await P.ctx.close();
      }
    }
  } catch (e) { T.failed(e); } finally { await close(); }
  T.done();
})();
