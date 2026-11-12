// 画面を通した確認：シュートの場所（設定でオン → 2P・3P を記録したあと、コートの図で場所を聞く・直す・集計）
//   node basket-tap/tests/e2e-shot.cjs [dev|built]
//     dev   … basket-tap/index.html（js/ と css/ を読む版）
//     built … public/basket-tap/index.html（1ファイル版。公開するもの）
//   SHOTS=フォルダ を付けると、画面の写真をそこに保存する（見た目の確認用）
// 試合を見ながら記録する所は、Playwright の clock で時計を進める（6 秒で自動で閉じるのを、待たずに確かめる）。
// 動画を見ながら記録する所は、e2e-review.cjs と同じテスト用の動画（ffmpeg で作る rv120.mp4）を使う。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('./pw.cjs');
const { stubCloud } = require('./cloudstub.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
const WORK = process.env.WORK || path.join(os.tmpdir(), 'basket-tap-e2e');
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const T0 = new Date('2026-10-19T06:30:00Z');       // 日本時間 15:30
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* テスト用の動画（e2e-review.cjs と同じもの。あれば使い回す） */
async function makeVideo(name, sec) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(WORK, { recursive: true });
    let ff = true;
    try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ff = false; }
    if (ff) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', String(sec), '-c:v', 'libvpx-vp9', '-b:v', '300k', '-deadline', 'realtime', '-cpu-used', '8', '-pix_fmt', 'yuv420p', file]);
    else await require('./tools/chrome-video.cjs').chromeVideo(chromium, file, sec);
  }
  return file;
}
async function openPage(browser, url, vp, clock) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  await stubCloud(ctx);         // 本物のクラウドには送らない
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (clock) await page.clock.install({ time: new Date(T0.getTime() - 20000) });
  await page.goto(url);
  await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#view').children.length);
  if (clock) await page.clock.pauseAt(T0);
  return { ctx, page, errors };
}
const game = (page) => page.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
const plays = (g) => g.events.filter((e) => e.type !== 'period');
const lastPlay = async (page) => plays(await game(page)).pop();
const pb = (tm, no, type) => `#panel${tm} .prow[data-no="${no == null ? '' : no}"] .pb[data-type="${type}"]`;
const sheetOpen = (page) => page.evaluate(() => !document.querySelector('#sheet').hidden);
const pickerOpen = (page) => page.evaluate(() => !document.querySelector('#sheet').hidden && !!document.querySelector('.shotsheet'));
/* コートの図の、場所（0〜1）の所を指で押す */
async function courtTap(page, sel, x, y) {
  const p = await page.evaluate(([s, x, y]) => { const el = document.querySelector(s); el.scrollIntoView({ block: 'center' }); return BT.shot.client(el, x, y); }, [sel, x, y]);
  await page.touchscreen.tap(p.x, p.y);
}
/* 場所の小窓が、スクロールなしで画面に収まっているか */
async function pickerFits(page) {
  await sleep(350);          // 小窓が下から出てくる動き（0.18 秒）が終わってから測る
  return page.evaluate(() => {
    const card = document.querySelector('.shotsheet'), body = card.querySelector('.sheet-body'), svg = card.querySelector('svg.court'), later = document.querySelector('#shotLater');
    const r = (e) => e.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    const inside = (b) => b.left >= -0.5 && b.top >= -0.5 && b.right <= vw + 0.5 && b.bottom <= vh + 0.5;
    const c = r(card), s = r(svg), l = r(later);
    return {
      ok: inside(c) && inside(s) && inside(l) && body.scrollHeight <= body.clientHeight + 1 && card.scrollHeight <= card.clientHeight + 1 && s.left >= c.left - 0.5 && s.right <= c.right + 0.5 && s.bottom <= c.bottom + 0.5 && l.bottom <= c.bottom + 0.5,
      court: [Math.round(s.width), Math.round(s.height)], card: [Math.round(c.width), Math.round(c.height)], vp: [vw, vh], hscroll: document.documentElement.scrollWidth > vw + 1
    };
  });
}
/* 集計の「シュートの場所」の表：{ ゾーン: '成功/打った数' か '成功' } */
const zoneTable = (page, root) => page.evaluate((root) => {
  const o = {};
  document.querySelectorAll(`${root} #zoneTable tbody tr`).forEach((tr) => { o[tr.querySelector('th').textContent] = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent).join(' '); });
  return o;
}, root);

/* 場所（0〜1）：メートル（幅 15・奥行き 14。ゴールの中心は (7.5, 1.575)）から */
const at = (X, Y) => [X / 15, Y / 14];
const P = {
  rim: at(7.5, 2.2),                 // ゴール下（ゴールから 0.625 m）
  corner3R: at(14.6, 1.0),           // 右のコーナー（サイドラインから 0.4 m・3P の線の外）
  wing3L: at(2.2, 6.875),            // 左ウィング（ゴールから 7.5 m・左 45°）
  midC: at(7.5, 6.5),                // フリースローラインの少し後ろ（ミドル正面）
  paint: at(8.5, 4.0),               // ペイントの中
  top3: at(7.5, 1.575 + 6.95),       // 3P の弧の少し外（トップ）
  corner3L: at(0.4, 0.8),            // 左のコーナー
  long: at(7.5, 9.1)                 // ミニバス：6.75 m より遠い（ロング正面）
};

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/basket-tap/index.html がありません。先に node basket-tap/build.mjs'); process.exit(1); }
  const VID = await makeVideo('rv120.mp4', 120);
  const srv = await start(0, root);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版' : '開発版'}・試合を見ながら記録する（スマホ 390×664）`);
    const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 664 }, true);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#btnNew'));
    await page.clock.pauseAt(new Date(T0.getTime() + 1000));
    const pr = await page.evaluate(() => BT.store.prefs());
    ok(pr.shotLoc === false && pr.courtType === 'std', 'はじめは「シュートの場所」はオフ（コートはふつう）', pr);
    await page.tap('#btnNew');
    await page.fill('#team0 .tname', '致遠館');
    await page.tap('#team0 [data-preset="4-15"]');
    await page.tap('#team1 [data-preset="4-15"]');
    await page.tap('#btnToLive');
    await page.waitForSelector('.live');
    await page.tap('#btnStartBig');
    await page.clock.runFor(3000);
    await page.tap(pb(0, '4', 'fg2'));
    ok(plays(await game(page)).length === 1 && !(await sheetOpen(page)), 'オフのとき：2P を押しても、場所は聞かない（いつもどおり）');

    // 設定でオンにする
    await page.tap('#btnMenu');
    await page.click('.mitem:has-text("設定")');
    ok(await page.evaluate(() => { const s = document.querySelector('#setShotLoc'); return !!s && s.previousElementSibling && s.previousElementSibling.id === 'setButtons'; }), '設定：「シュートの場所」は「選手のボタン」のすぐ下（#setShotLoc）');
    ok(await page.isVisible('#setShotLoc [data-court="std"].on') && await page.isVisible('#setShotLoc [data-court="mini"]'), '設定：コートは「ふつう：3P の線あり」が選ばれている・「ミニバス」も選べる');
    const L0 = await page.evaluate(() => { window.__L = BT.app.S.L; return true; });
    await page.click('#setShotLoc [data-pref="shotLoc"]');
    ok(await page.evaluate(() => BT.store.prefs().shotLoc === true && BT.app.shotLocOn() && BT.app.S.L !== window.__L), 'チェックを入れると保存され、記録の画面も作り直す（となりの設定と同じ）', L0);
    await page.evaluate(() => BT.ui.closeSheet());

    // 2P → 場所の小窓 → コートを1回押す
    await page.clock.runFor(5000);
    await page.tap(pb(0, '7', 'fg2'));
    let ev = await lastPlay(page);
    ok(ev.type === 'fg2' && ev.no === '7' && ev.t === 8 && ev.x == null, '2P を押すと、まず記録（時刻は押した瞬間 8.0 秒・場所はまだ）', ev);
    ok(await pickerOpen(page) && (await page.textContent('.shotsheet header b')) === '#7 2P成功：どこから？', '場所の小窓がすぐ出る（「#7 2P成功：どこから？」）', await page.textContent('#sheet'));
    ok(await page.evaluate(() => !!document.querySelector('.shotsheet svg.court path.c3') && document.querySelector('.shotsheet svg.court').dataset.court === 'std'), 'コートの図に 3P の線（ふつうのコート）');
    ok(await page.isVisible('.shotsheet .shotwait'), '試合を見ながら：自動で閉じるまでの細いバー');
    let fit = await pickerFits(page);
    ok(fit.ok && !fit.hscroll && fit.court[0] >= 300, `390×664：スクロールなしで入る（コート ${fit.court}）`, fit);
    await shot(page, 'shot-picker-phone');
    await page.clock.runFor(1500);
    await courtTap(page, '.shotsheet svg.court', ...P.rim);
    ev = await lastPlay(page);
    ok(Math.abs(ev.x - P.rim[0]) < 0.006 && Math.abs(ev.y - P.rim[1]) < 0.006 && ev.t === 8, `押した所が場所になる（x ${ev.x}・y ${ev.y}。時刻は 8.0 秒のまま）`, ev);
    ok(await page.evaluate((e) => BT.shotZone(e.x, e.y, 'std').label, ev) === 'ゴール下', 'その場所はゴール下');
    ok(!(await sheetOpen(page)) && (await page.textContent('#lastbar')).includes('📍 ゴール下'), '小窓は閉じて、画面の下に「📍 ゴール下」', await page.textContent('#lastbar'));
    ok((await game(page)).court === 'std', '試合にコートの種類（std）を残す');
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem('btap:game:' + BT.app.S.game.id)).events.some((e) => e.x != null)), '場所も、すぐ保存される');

    // 「あとで」
    await page.clock.runFor(3000);
    await page.tap(pb(0, '8', 'fg3'));
    ok(await pickerOpen(page) && (await page.textContent('.shotsheet header b')).includes('#8 3P成功'), '3P でも聞く');
    await page.tap('#shotLater');
    ev = await lastPlay(page);
    ok(!(await sheetOpen(page)) && ev.type === 'fg3' && ev.no === '8' && ev.x == null, '「あとで」：場所なしで閉じる（記録は残る）', ev);

    // 6 秒で自動で閉じる
    ok(await page.evaluate(() => BT.shot.WAIT) === 6000, '自動で閉じるまで 6 秒（BT.shot.WAIT）');
    await page.clock.runFor(3000);
    await page.tap(pb(0, '9', 'fg2'));
    await page.clock.runFor(5800);
    ok(await pickerOpen(page), '5.8 秒では、まだ出ている');
    await page.clock.runFor(400);
    ev = await lastPlay(page);
    ok(!(await sheetOpen(page)) && ev.no === '9' && ev.x == null, '6 秒押さなければ、自動で閉じる（記録は残る・場所なし）', ev);

    // フリースローは聞かない・デモの最中も聞かない
    await page.clock.runFor(3000);
    await page.tap(pb(0, '7', 'ft'));
    ok((await lastPlay(page)).type === 'ft' && !(await sheetOpen(page)), 'フリースローは聞かない');
    await page.evaluate(() => { BT.app.S.demoMode = true; });
    await page.clock.runFor(1000);
    await page.tap(pb(1, '6', 'fg2'));
    ok((await lastPlay(page)).no === '6' && !(await sheetOpen(page)), '使い方のデモの最中は聞かない');
    await page.evaluate(() => { BT.app.S.demoMode = false; });
    await page.tap('#btnUndo');
    ok((await lastPlay(page)).type === 'ft', '「↶ 取り消す」は、いつもどおり（いちばん新しい記録を取り消す）');

    // 画面の大きさ：小さなスマホ・スマホの横・iPad の縦・横
    const sizes = [[375, 553, 'iPhone SE の縦'], [667, 320, 'スマホの横'], [820, 1180, 'iPad の縦'], [1180, 820, 'iPad の横']];
    for (const [w, hh, name] of sizes) {
      await page.setViewportSize({ width: w, height: hh });
      await sleep(150);
      await page.evaluate(() => BT.app.askShotLoc(BT.app.S.game.events.find((e) => e.no === '9')));
      await sleep(250);
      fit = await pickerFits(page);
      ok(fit.ok && !fit.hscroll && fit.court[1] >= Math.min(220, hh * 0.65), `${name}（${w}×${hh}）：スクロールなしで入る（コート ${fit.court}・小窓 ${fit.card}）`, fit);
      await shot(page, `shot-picker-${w}x${hh}`);
      await page.tap('#shotLater');
    }
    await page.setViewportSize({ width: 390, height: 664 });
    await sleep(150);

    // 失敗の × も（設定：シュートの失敗）
    await page.tap('#btnMenu');
    await page.click('.mitem:has-text("設定")');
    await page.click('[data-pref="btnMiss"]');
    await page.evaluate(() => BT.ui.closeSheet());
    await page.clock.runFor(2000);
    await page.tap(pb(0, '7', 'fg3'));
    await courtTap(page, '.shotsheet svg.court', ...P.corner3R);
    await page.clock.runFor(2000);
    await page.tap(pb(0, '7', 'fg3x'));
    ok((await page.textContent('.shotsheet header b')) === '#7 3P失敗：どこから？', '失敗（×）でも聞く（「#7 3P失敗：どこから？」）');
    await page.emulateMedia({ colorScheme: 'dark' });
    await shot(page, 'shot-picker-dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await courtTap(page, '.shotsheet svg.court', ...P.wing3L);
    ok((await page.textContent('#lastbar')).includes('📍 3P 左ウィング'), '「📍 3P 左ウィング」');
    await page.clock.runFor(2000);
    await page.tap(pb(0, '8', 'fg2'));
    await courtTap(page, '.shotsheet svg.court', ...P.midC);
    await page.clock.runFor(2000);
    await page.tap(pb(1, '5', 'fg2'));
    ok((await page.textContent('.shotsheet header b')) === '#5 2P成功：どこから？', '相手のチームでも聞く');
    await courtTap(page, '.shotsheet svg.court', ...P.paint);
    let g = await game(page);
    const zoneOf = (e) => page.evaluate((e) => BT.shotZone(e.x, e.y, 'std').label, e);
    const located = plays(g).filter((e) => e.x != null);
    ok(located.length === 5, '場所のある記録が 5 つ', located);
    ok([await zoneOf(located[1]), await zoneOf(located[2]), await zoneOf(located[3]), await zoneOf(located[4])].join('・') === '3P 右コーナー・3P 左ウィング・ミドル正面・ペイント', 'ゾーン：3P 右コーナー・3P 左ウィング・ミドル正面・ペイント');

    // 記録の一覧：📍 とゾーン
    await page.tap('#btnMenu');
    await page.click('.mitem:has-text("記録の一覧")');
    const logZones = await page.$$eval('.lrow .lzone', (els) => els.map((e) => e.textContent));
    ok(logZones.length === 5 && logZones.includes('📍 ミドル正面') && logZones.includes('📍 ゴール下'), '記録の一覧：場所のある記録に「📍 ゾーン」', logZones);
    ok(await page.evaluate(() => Array.from(document.querySelectorAll('.lrow')).every((r) => r.scrollWidth <= r.clientWidth + 1) && document.querySelector('.loglist').scrollWidth <= document.querySelector('.loglist').clientWidth + 1), '一覧の行は、横にはみ出さない');
    await shot(page, 'shot-log');

    // 直す：場所を付ける・動かす・消す
    const e8 = g.events.find((e) => e.no === '8' && e.type === 'fg3');
    await page.click(`.lrow[data-id="${e8.id}"]`);
    ok(await page.isVisible('#evLoc') && (await page.textContent('#evLoc')).includes('まだ'), '直す：場所の欄（「まだありません」）');
    await courtTap(page, '#evLoc svg.court', ...P.top3);
    let e = (await game(page)).events.find((x) => x.id === e8.id);
    ok(e.x != null && (await zoneOf(e)) === '3P トップ' && (await page.textContent('#evLoc')).includes('3P トップ') && await page.evaluate(() => document.querySelectorAll('#evLoc .mk.made').length === 1), 'コートを押すと場所が付く（3P トップ・印が出る）', e);
    await shot(page, 'shot-edit');
    await courtTap(page, '#evLoc svg.court', ...P.corner3L);
    e = (await game(page)).events.find((x) => x.id === e8.id);
    ok((await zoneOf(e)) === '3P 左コーナー' && Math.abs(e.x - P.corner3L[0]) < 0.006, 'もう一度押すと、場所が動く（3P 左コーナー）', e);
    await page.tap('#btnLocClear');
    e = (await game(page)).events.find((x) => x.id === e8.id);
    ok(e.x === undefined && e.y === undefined && (await page.textContent('#evLoc')).includes('まだ'), '「場所を消す」', e);
    // 種類をフリースローにすると、場所は消える
    const e5 = g.events.find((x) => x.no === '5' && x.team === 1);
    await page.evaluate((id) => BT.app.openEdit(id), e5.id);
    await page.click('[data-etype="ft"]');
    e = (await game(page)).events.find((x) => x.id === e5.id);
    ok(e.type === 'ft' && e.x === undefined && await page.isHidden('#evLoc'), 'プレーをフリースローに直すと、場所は消える（場所の欄も出ない）', e);
    await page.click('[data-etype="fg2"]');
    await courtTap(page, '#evLoc svg.court', ...P.paint);
    e = (await game(page)).events.find((x) => x.id === e5.id);
    ok(e.type === 'fg2' && (await zoneOf(e)) === 'ペイント', '2P に戻して、場所を付け直す');
    await page.evaluate(() => BT.ui.closeSheet());

    // 書き出し（CSV・JSON）
    const csv = await page.evaluate(() => BT.eventsCSV(BT.app.S.game).split('\r\n'));
    ok(csv[0].endsWith(',場所X,場所Y,場所（ゾーン名）') && csv.some((l) => l.endsWith(',ミドル正面')), 'CSV：いちばん後ろに 場所X・場所Y・場所（ゾーン名）', csv.slice(0, 4));
    const back = await page.evaluate(() => { const g2 = BT.importData(JSON.parse(JSON.stringify(BT.exportData(BT.app.S.game)))); return g2.events.filter((e) => e.x != null).length; });
    ok(back === 5, '書き出した JSON を読み込んでも、場所が残る', back);

    // 集計：試合を終える → 試合のページ
    await page.tap('#btnMenu');
    await page.click('.mitem:has-text("試合を終える")');
    await page.click('.sheet-foot .btn.primary');
    await page.waitForSelector('.hub');
    await page.evaluate(() => BT.ui.closeSheet());
    ok(await page.isVisible('.hubstats #shotStats'), '試合のページの集計に「📍 シュートの場所」');
    let zt = await zoneTable(page, '.hubstats');
    ok(zt['ゴール下'] === '1/1 100%' && zt['3P 右コーナー'] === '1/1 100%' && zt['3P 左ウィング'] === '0/1 0%' && zt['ミドル正面'] === '1/1 100%' && zt['合計'] === '3/4 75%' && zt['ペイント'] === '0/0 —', '自分・全員：ゾーンごとの「成功/打った数」と成功率（外れも記録した試合）', zt);
    ok(await page.evaluate(() => document.querySelectorAll('.hubstats #shotStats .mk.made').length === 3 && document.querySelectorAll('.hubstats #shotStats .mk.miss').length === 1), '図：入った 3（丸）・外れ 1（×）');
    ok((await page.textContent('.hubstats #shotNote')).includes('場所あり 4本・場所なし 3本'), '場所あり 4本・場所なし 3本（オフのとき・あとで・自動で閉じた）', await page.textContent('.hubstats #shotNote'));
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.hubstats #shotStats .mk.made')).stroke === 'rgb(17, 17, 17)' && document.querySelector('.hubstats #shotStats .mk.made').getAttribute('fill') === '#f4f4f4'), '入った印は、チームの色（白）に濃いふち');
    const nos = await page.$$eval('.hubstats .shotnos button', (els) => els.map((x) => x.textContent));
    ok(nos.join(',') === '全員,#7,#8', '選手で絞る：全員・場所のある選手だけ（#7・#8）', nos);
    await page.click('.hubstats [data-shotno="7"]');
    zt = await zoneTable(page, '.hubstats');
    ok(zt['ゴール下'] === '1/1 100%' && zt['ミドル正面'] === '0/0 —' && zt['合計'] === '2/3 67%' && (await page.textContent('.hubstats #shotNote')).includes('場所あり 3本・場所なし 0本'), '#7 だけ：2/3（場所あり 3本）', zt);
    await page.click('.hubstats [data-shotteam="1"]');
    zt = await zoneTable(page, '.hubstats');
    ok(zt['ペイント'] === '1/1 100%' && zt['合計'] === '1/1 100%' && await page.evaluate(() => document.querySelector('.hubstats #shotStats .mk.made').getAttribute('fill') === '#2f6fed'), '相手に切りかえ：ペイント 1/1（印は相手の色）', zt);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#shotStats').scrollWidth <= document.querySelector('#shotStats').clientWidth + 1), '390 px のスマホで、横にはみ出さない');
    await page.click('.hubstats [data-shotteam="0"]');
    await page.evaluate(() => document.querySelector('#shotStats').scrollIntoView());
    await shot(page, 'shot-stats-phone');
    await page.emulateMedia({ colorScheme: 'dark' });
    await shot(page, 'shot-stats-dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.setViewportSize({ width: 1180, height: 820 });
    await sleep(200);
    await page.evaluate(() => document.querySelector('#shotStats').scrollIntoView());
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'iPad の横でも、はみ出さない');
    await shot(page, 'shot-stats-ipad');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    // ---------- 場所のない試合・オフのとき：いつもどおり ----------
    console.log('\n■ 場所のない試合は、集計も CSV も前と同じ');
    {
      const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 664 }, true);
      const r = await page.evaluate(() => {
        const g = BT.newGame({ teams: [{ name: 'A', players: [{ no: '4' }] }, {}] });
        g.startedAt = Date.now(); BT.addEvent(g, { t: 0, type: 'period', period: 1 }); BT.addEvent(g, { t: 3, type: 'fg2', team: 0, no: '4' });
        BT.app.setGame(g); BT.app.save(); BT.app.go('game');
        return { block: !!document.querySelector('#shotStats'), head: BT.eventsCSV(g).split('\r\n')[0] };
      });
      ok(!r.block && r.head.endsWith('Aの得点,相手の得点'), '「シュートの場所」の欄も、CSV の場所の列も出さない', r);
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    // ---------- 動画を見ながら記録する：「2P → 14番」・ミニバスのコート ----------
    console.log('\n■ 動画を見ながら記録する（スマホ 390×844・ミニバスのコート）');
    {
      const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 844 }, false);
      await page.evaluate(() => { localStorage.clear(); localStorage.setItem('btap:prefs', JSON.stringify({ shotLoc: true, courtType: 'mini' })); });
      await page.reload();
      await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#btnNewReview'));
      await page.tap('#btnNewReview');
      await page.tap('#team0 [data-preset="4-18"]');
      await page.tap('#team1 [data-preset="4-15"]');
      const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnToReview')]);
      await fc.setFiles(VID);
      await page.waitForFunction(() => BT.app.S.rv && BT.app.S.rv.ready, null, { timeout: 20000 });
      ok(await page.evaluate(() => BT.app.S.L.inMode === 'pick'), '入力は「2P → 14番」');
      await page.evaluate(() => BT.app.rvSeekTo(12.1));
      await sleep(200);
      await page.tap('#pick0 [data-ptype="fg2"]');
      await page.tap('#pick0 [data-pno="14"]');
      let ev = await lastPlay(page);
      ok(ev.type === 'fg2' && ev.no === '14' && ev.t === 12.1 && await pickerOpen(page), '「2P」→「14」：記録（動画の時刻 12.1 秒）→ 場所の小窓', ev);
      ok((await page.textContent('.shotsheet header b')) === '#14 2P成功：どこから？' && await page.isHidden('.shotsheet .shotwait'), '動画を見ながら：自動で閉じるバーはない');
      ok(await page.evaluate(() => document.querySelector('.shotsheet svg.court').dataset.court === 'mini' && !document.querySelector('.shotsheet svg.court path.c3')), 'ミニバス：コートの図に 3P の線がない');
      const fit = await pickerFits(page);
      ok(fit.ok && !fit.hscroll, `390×844：スクロールなしで入る（コート ${fit.court}）`, fit);
      await shot(page, 'shot-review-mini');
      await sleep(7000);
      ok(await pickerOpen(page) && await page.evaluate(() => BT.app.S.rv.el.paused), '7 秒たっても閉じない（動画は止まったまま）');
      await courtTap(page, '.shotsheet svg.court', ...P.long);
      ev = await lastPlay(page);
      ok(!(await sheetOpen(page)) && ev.t === 12.1 && Math.abs(ev.y - P.long[1]) < 0.006 && (await page.textContent('#lastbar')).includes('📍 ロング正面'), '押すと場所が付き、時刻は動画の時刻のまま（「📍 ロング正面」）', ev);
      ok((await game(page)).court === 'mini', '試合のコートは mini');
      // 選手ごとの行でも
      await page.tap('#rvInput');
      await page.evaluate(() => BT.app.rvSeekTo(20));
      await sleep(200);
      await page.tap(pb(1, '4', 'fg3'));
      ev = await lastPlay(page);
      ok(ev.team === 1 && ev.no === '4' && ev.t === 20 && await pickerOpen(page), '選手ごとの行で押しても聞く（動画の時刻 20.0 秒）', ev);
      await courtTap(page, '.shotsheet svg.court', ...P.wing3L);
      ok((await page.textContent('#lastbar')).includes('📍 ロング左'), 'ミニバス：遠い左は「ロング左」', await page.textContent('#lastbar'));
      // 記録を終える → 集計はミニバスのゾーン
      await page.tap('#btnMenu');
      await page.click('.mitem:has-text("記録を終える")');
      await page.click('.sheet-foot .btn.primary');
      await page.waitForSelector('.hub');
      await page.evaluate(() => BT.ui.closeSheet());
      const zt = await zoneTable(page, '.hubstats');
      const keys = Object.keys(zt);
      ok(keys.includes('ロング正面') && !keys.some((k) => k.startsWith('3P')) && zt['ロング正面'] === '1' && zt['合計'] === '1', 'ミニバスの試合の集計：ロングのゾーン（3P のゾーンはない）・外れの記録がない試合は成功の数だけ', zt);
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
