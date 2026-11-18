// 試合時間（止められる時計）の確認（Playwright の Chromium）
//   node basket-tap/tests/e2e-clock.cjs [dev|built]     SHOTS=フォルダ で画面の写真
// 調べること：
//   ・設定がオフ（はじめ）のあいだは、これまでと同じ（時計はスタートからの時間・押すとメニュー・記録に時計を作らない）
//   ・オン：スタートで残り 10:00 から動く／時間を押すと止まる・動く（スタートからの時間は止まらない）／止めているあいだの記録の時刻／
//     ピリオドの小窓で直す・止める・動かす／次のピリオドで 10:00 に戻る／残り 0:00 で止まり、1回だけ知らせる／
//     記録の一覧・直す小窓・CSV に試合時間／設定でピリオドの長さ（8分・決めない）／上の帯が重ならない（スマホ・小さなスマホ・横向き）
//   ・撮った動画を見ながら記録：はじめは止まっている → 時間を押して動かす → 動画を進める・戻すと、その時刻の試合時間・押しても動画は止まらない
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
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const T0 = new Date('2026-11-14T01:00:00Z');
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let FFMPEG = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { FFMPEG = false; }
async function makeVideo(name, sec) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(WORK, { recursive: true });
    if (FFMPEG) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', String(sec), '-c:v', 'libvpx-vp9', '-b:v', '300k', '-deadline', 'realtime', '-cpu-used', '8', '-pix_fmt', 'yuv420p', file]);
    else await require('./tools/chrome-video.cjs').chromeVideo(chromium, file, sec);
  }
  return file;
}
/* prefs：はじめの設定（btap:prefs）。clock：時計を止めて、決めた秒数だけ進める（試合を見ながら記録するとき） */
async function openPage(browser, url, vp, prefs, clock) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  if (prefs) await ctx.addInitScript((p) => { if (!localStorage.getItem('btap:prefs')) localStorage.setItem('btap:prefs', JSON.stringify(p)); }, prefs);
  await stubCloud(ctx);
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
const bar = (page) => page.evaluate(() => {
  const c = document.querySelector('#clock'), sub = document.querySelector('#tsub');
  return { t: document.querySelector('#tval').textContent, sub: sub.hidden ? null : sub.textContent, gc: c.classList.contains('gc'), stopped: c.classList.contains('stopped'), done: c.classList.contains('done'), subShown: sub.offsetParent !== null, last: document.querySelector('#lastbar').textContent, label: c.getAttribute('aria-label') || '' };
});
/* 上の帯の部品が重なっていないか・はみ出していないか・時計の中の文字がはみ出していないか */
async function barFits(page) {
  return page.evaluate(() => {
    const els = [];
    Array.from(document.querySelectorAll('.lbar > *')).filter((e) => e.offsetParent !== null).forEach((e) => { if (e.classList.contains('score')) e.querySelectorAll('.sc').forEach((x) => els.push(x)); else els.push(e); });      // 得点は、2つの箱を1つずつ見る（.score の枠は縮むので）
    const bad = [];
    for (let i = 1; i < els.length; i++) { const a = els[i - 1].getBoundingClientRect(), b = els[i].getBoundingClientRect(); if (b.left < a.right - 1) bad.push(['重なり', els[i - 1].className, els[i].className, Math.round(a.right - b.left)]); }
    const last = els[els.length - 1].getBoundingClientRect();
    if (last.right > innerWidth + 1) bad.push(['右にはみ出す', Math.round(last.right - innerWidth)]);
    const c = document.querySelector('#clock'), cr = c.getBoundingClientRect();
    ['#tval', '#tsub', '.gcst'].forEach((s) => { const e = c.querySelector(s); if (!e || e.offsetParent === null) return; const r = e.getBoundingClientRect(); if (r.left < cr.left - 0.5 || r.right > cr.right + 0.5 || r.top < cr.top - 0.5 || r.bottom > cr.bottom + 0.5) bad.push(['時計の中からはみ出す', s, Math.round(r.right - cr.right), Math.round(r.bottom - cr.bottom)]); });
    if (document.documentElement.scrollWidth > innerWidth + 1) bad.push(['横スクロール']);
    return bad;
  });
}
const run = (page, sec) => page.clock.runFor(sec * 1000);
async function newLive(page) {
  await page.tap('#btnNew');
  await page.tap('#team0 [data-preset="4-15"]');
  await page.tap('#team1 [data-preset="4-15"]');
  await page.tap('#btnToLive');
  await page.waitForSelector('#btnStartBig');
}
const pb = (tm, no, type) => `#panel${tm} .prow[data-no="${no}"] .pb[data-type="${type}"]`;

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/basket-tap/index.html がありません。先に node basket-tap/build.mjs'); process.exit(1); }
  const srv = await start(0, root);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'], env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版' : '開発版'}・設定がオフ（はじめ）のあいだは、これまでと同じ`);
    {
      const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 713 }, null, true);
      eq(await page.evaluate(() => [BT.app.S.prefs.gameClock, BT.app.S.prefs.periodLen]), [false, 600], 'はじめの設定：試合時間はオフ（ピリオドの長さは 10分）');
      await newLive(page);
      await page.tap('#btnStartBig');
      await run(page, 10);
      const b = await bar(page);
      ok(b.t === '0:10' && !b.gc && b.sub === null && !b.subShown, '時計は、スタートからの時間（0:10）。試合時間は出ない', b);
      ok((await game(page)).gc === undefined, '記録に時計を作らない');
      await page.tap('#clock');
      ok(await page.$('.sheet .mitem'), '時計を押すと、これまでどおりメニュー');
      await page.evaluate(() => BT.ui.closeSheet());
      await page.tap('#btnPeriod');
      ok(!(await page.$('#gcBox')), 'ピリオドの小窓に、試合時間の手直しは出ない');
      await page.evaluate(() => BT.ui.closeSheet());
      ok(!(await page.evaluate(() => BT.eventsCSV(BT.app.S.game))).includes('試合時間'), 'CSV に列を足さない');
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    console.log('\n■ 設定でオンにする');
    {
      const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 713 }, null, true);
      await page.tap('#btnSettings');
      ok(await page.$('#setClock') && !(await page.$('#setClock [data-gclen]')), '設定に「試合時間（止められる時計）」。オフのあいだは、長さのボタンは出ない');
      await page.click('#setClock [data-pref="gameClock"]');
      eq(await page.$$eval('#setClock [data-gclen]', (els) => els.map((e) => e.dataset.gclen + (e.classList.contains('on') ? '*' : ''))), ['600*', '480', '360', '300', '0'], 'オンにすると、ピリオドの長さ（10分に印）');
      await page.tap('#setClock [data-gclen="480"]');
      eq(await page.evaluate(() => [BT.app.S.prefs.gameClock, BT.app.S.prefs.periodLen, JSON.parse(localStorage.getItem('btap:prefs')).periodLen]), [true, 480, 480], '8分を選ぶと、設定に残る');
      ok(await page.evaluate(() => { const s = document.querySelector('.sheet-card') || document.querySelector('#sheet'); return document.documentElement.scrollWidth <= innerWidth + 1 && s.getBoundingClientRect().right <= innerWidth + 1; }), '設定の小窓が横にはみ出さない');
      await shot(page, 'clock-settings');
      await page.evaluate(() => BT.ui.closeSheet());
      await newLive(page);
      await page.tap('#btnStartBig');
      const b = await bar(page);
      ok(b.gc && b.t === '8:00' && b.sub === '⏱ 0:00', '8分のピリオド：スタートで 8:00', b);
      eq((await game(page)).gc, { len: 480, ot: 180, ev: [] }, '記録に時計（8分・延長 3分）');
      // 記録の途中で、長さを変える
      await page.tap('#btnMenu'); await page.click('.sheet .mitem:has-text("設定")');
      await page.tap('#setClock [data-gclen="0"]');
      await page.evaluate(() => BT.ui.closeSheet());
      await run(page, 75);
      const b2 = await bar(page);
      ok(b2.t === '1:15' && b2.sub === '⏱ 1:15' && (await game(page)).gc.len === 0, '「決めない」に変えると、進んだ時間を数える（1:15）', b2);
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    console.log('\n■ 試合を見ながら記録：止める・動かす・直す（スマホ 390×713）');
    {
      const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 713 }, { gameClock: true, periodLen: 600 }, true);
      await newLive(page);
      ok(!(await page.isVisible('#clock')), 'スタート前は、時計は出ない');
      await page.tap('#btnStartBig');
      let b = await bar(page);
      ok(b.gc && !b.stopped && b.t === '10:00' && b.sub === '⏱ 0:00' && b.subShown, 'スタート：残り 10:00 で動き出す。下に小さく、スタートからの時間', b);
      eq(await barFits(page), [], '上の帯が重ならない・時計の中に収まる（10:00）');
      await run(page, 10);
      b = await bar(page);
      ok(b.t === '9:50' && b.sub === '⏱ 0:10', '10 秒たつと 9:50（スタートから 0:10）', b);
      await page.tap('#clock');
      b = await bar(page);
      ok(b.stopped && b.t === '9:50' && b.last.includes('試合時間を止めました') && b.last.includes('1Q 残り 9:50'), '時間を押すと止まる（「⏸ 試合時間を止めました（1Q 残り 9:50）」）', b);
      ok(!(await page.$('.sheet .mitem')), 'メニューは開かない');
      ok(b.label.includes('止まっています') && b.label.includes('押すと動きます'), '読み上げ用の説明（止まっています。押すと動きます）', b.label);
      await shot(page, 'clock-stopped');
      await run(page, 20);
      b = await bar(page);
      ok(b.t === '9:50' && b.sub === '⏱ 0:30', '止めているあいだ、試合時間は 9:50 のまま・スタートからの時間は進む（0:30）', b);
      await page.tap(pb(0, '7', 'fg2'));
      let g = await game(page);
      let ev = g.events[g.events.length - 1];
      eq([ev.type, ev.t, await page.evaluate((t) => BT.gcText(BT.gameClock(BT.app.S.game, t)), ev.t)], ['fg2', 30, '9:50'], '止めているあいだも記録できる（記録の時刻は 30 秒・試合時間は 9:50）');
      await page.tap('#clock');
      await run(page, 5);
      b = await bar(page);
      ok(!b.stopped && b.t === '9:45' && b.sub === '⏱ 0:35', 'もう一度押すと動く（5 秒で 9:45）', b);
      eq((await game(page)).gc.ev, [{ t: 10, on: 0 }, { t: 30, on: 1 }], '止めた・動かした時刻が、記録に残る');

      // ピリオドの小窓：直す・止める・動かす
      await page.tap('#btnPeriod');
      ok((await page.textContent('#gcNowText')).replace(/\s+/g, '').includes('試合時間：1Q残り9:45（動いています）'), 'ピリオドの小窓に、いまの試合時間', await page.textContent('#gcNowText'));
      await shot(page, 'clock-period-sheet');
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && Array.from(document.querySelectorAll('#gcBox .btn')).every((x) => { const r = x.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.height >= 36; })), '手直しのボタンが、小窓に収まる');
      await page.tap('#gcBox [data-gcadj="-10"]');
      ok((await page.textContent('#gcNowText')).includes('9:35') && (await bar(page)).t === '9:35', '「−10秒」で 9:35', await bar(page));
      await page.tap('#gcBox [data-gcadj="60"]');
      ok((await bar(page)).t === '10:00', '「+1分」は、ピリオドの長さ（10:00）まで');
      await page.tap('#gcBox [data-gcadj="-60"]');
      await page.tap('#gcBox [data-gcadj="-1"]');
      ok((await bar(page)).t === '8:59', '「−1分」「−1秒」で 8:59', await bar(page));
      await page.tap('#btnGcToggle');
      b = await bar(page);
      ok(b.stopped && (await page.textContent('#gcNowText')).includes('止まっています') && (await page.textContent('#btnGcToggle')).includes('動かす'), '小窓の「⏸ 試合時間を止める」でも止まる', b);
      await page.evaluate(() => BT.ui.closeSheet());
      await run(page, 30);
      ok((await bar(page)).t === '8:59', '止まったまま（8:59）');

      // 次のピリオド
      await page.tap('#btnPeriod'); await page.tap('#btnNextPeriod');
      b = await bar(page);
      ok(b.t === '10:00' && !b.stopped && (await page.textContent('#btnPeriod')) === '2Q', '「2Q を始める」で、10:00 に戻って動き出す（前のピリオドで止めていても）', b);
      await run(page, 3);
      ok((await bar(page)).t === '9:57', '2Q が進む（9:57）');

      // 残り 0:00
      await page.evaluate(() => { const g = BT.app.S.game; BT.gcSet(g, BT.app.elapsed(), 595); });
      await run(page, 1);
      ok((await bar(page)).t === '0:04', '残りわずか（0:04）', await bar(page));
      await run(page, 6);
      b = await bar(page);
      ok(b.t === '0:00' && b.done && b.last.includes('2Q の試合時間が終わりました'), '残り 0:00 で止まり、1回だけ知らせる', b);
      const subAt = b.sub;
      await run(page, 5);
      b = await bar(page);
      ok(b.t === '0:00' && b.sub !== subAt, '0:00 のあとも、スタートからの時間は進む', b);
      await page.tap('#clock');
      b = await bar(page);
      ok(b.last.includes('試合時間は終わっています') && (await game(page)).gc.ev.every((e) => e.t <= 80 || e.set != null || e.on !== 1 || e.t < 100), '終わったあとに押しても動かない（次のピリオドへ、の案内）', b.last);
      await shot(page, 'clock-done');
      eq(await barFits(page), [], '上の帯が重ならない（0:00・得点あり）');

      // 記録の一覧・直す小窓・CSV
      await page.tap('#btnMenu'); await page.click('.sheet .mitem:has-text("記録の一覧")');
      eq(await page.$$eval('.lrow:not(.per) .lgt', (els) => els.map((e) => e.textContent)), ['9:50'], '記録の一覧：時刻の下に、小さく試合時間（9:50）');
      ok((await page.textContent('.sheet .note')).includes('試合時間（そのピリオドの残り）'), '一覧の説明に、試合時間のこと');
      await shot(page, 'clock-log');
      await page.tap('.lrow:not(.per)');
      ok((await page.textContent('#evTime')).includes('試合時間 1Q 残り 9:50'), '記録を直す小窓にも、試合時間（1Q 残り 9:50）', await page.textContent('#evTime'));
      await page.evaluate(() => BT.ui.closeSheet());
      const csv = (await page.evaluate(() => BT.eventsCSV(BT.app.S.game))).trim().split('\r\n').map((r) => r.split(','));
      eq([csv[0][csv[0].length - 1], csv.find((r) => r[7] === '2P成功').slice(-1)[0]], ['試合時間（残り）', '9:50'], 'CSV：いちばん後ろに「試合時間（残り）」');

      // 試合を終える → 記録の画面に戻っても、時計は押せない（メニュー）
      await page.tap('#btnMenu'); await page.click('.sheet .mitem:has-text("試合を終える")'); await page.click('.sheet-foot .btn.primary');
      await page.waitForFunction(() => BT.app.S.view === 'game');
      await page.evaluate(() => { BT.ui.closeSheet(true); BT.app.go('live'); });
      await page.waitForSelector('#clock');
      const n = (await game(page)).gc.ev.length;
      await page.tap('#clock');
      ok(await page.$('.sheet .mitem') && (await game(page)).gc.ev.length === n, '終えた試合：時計を押すとメニュー（時計は動かさない）');
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    console.log('\n■ 画面の大きさ（上の帯）');
    for (const [name, vp] of [['小さなスマホ 320×568', { width: 320, height: 568 }], ['iPhone SE 375×553', { width: 375, height: 553 }], ['スマホの横向き 713×390', { width: 713, height: 390 }], ['iPad 横 1180×820', { width: 1180, height: 820 }]]) {
      const { ctx, page, errors } = await openPage(browser, srv.url, vp, { gameClock: true, periodLen: 600, btnMiss: true, btnFoul: true, btnTov: true }, true);
      await newLive(page);
      await page.tap('#btnStartBig');
      eq(await barFits(page), [], `${name}：上の帯が重ならない・時計の中に収まる（10:00）`);
      await page.tap('#clock');
      // 得点を 3 桁に・時計を 1 時間より先に（いちばん幅を取るとき）
      await page.evaluate(() => { const g = BT.app.S.game; for (let i = 0; i < 68; i++) BT.addEvent(g, { t: 1, type: 'fg3', team: i % 2, no: '4' }); g.startedAt -= 3700 * 1000; BT.app.save(); BT.app.go('live'); });      // スタートを 1 時間あまり前にずらす
      await run(page, 1);
      ok(await page.evaluate(() => document.querySelector('#score0').textContent === '102' && document.querySelector('#score1').textContent === '102'), `${name}：得点が 3 桁（102 − 102）`);
      const b = await bar(page);
      eq(await barFits(page), [], `${name}：得点が 3 桁・スタートから 1 時間をこえても重ならない（${b.t}／${b.sub}）`);
      ok(await page.evaluate(() => { const r = document.querySelector('#clock').getBoundingClientRect(); return r.height >= 38 && r.width >= 60; }), `${name}：時計は押せる大きさ`);
      if (vp.width === 320) await shot(page, 'clock-320');
      if (vp.width === 713) await shot(page, 'clock-landscape');
      ok(errors.length === 0, `${name}：ページのエラーなし`, errors);
      await ctx.close();
    }

    console.log('\n■ 撮った動画を見ながら記録（動画の時刻とは別に、試合時間が進む）');
    {
      const VID = await makeVideo('rv120.mp4', 120);
      const { ctx, page, errors } = await openPage(browser, srv.url, { width: 1180, height: 820 }, { gameClock: true, periodLen: 600 }, false);
      await page.click('#btnNewReview');
      await page.click('#team0 [data-preset="4-15"]'); await page.click('#team1 [data-preset="4-15"]');
      const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnToReview')]);
      await fc.setFiles(VID);
      await page.waitForFunction(() => BT.app.S.rv && BT.app.S.rv.ready, null, { timeout: 20000 });
      await sleep(300);
      let b = await bar(page);
      ok(b.gc && b.stopped && b.t === '10:00' && b.sub === '🎬 0:00.0', '動画のはじめ：試合時間は 10:00 で止まっている。下に小さく、動画の時刻', b);
      eq((await game(page)).gc, { len: 600, ot: 300, ev: [{ t: 0, on: 0 }] }, '記録の時計：はじめは { t: 0, on: 0 }');
      eq(await barFits(page), [], '上の帯が重ならない（動画を見ながら）');
      const seek = async (t) => { await page.evaluate((x) => BT.app.rvSeekTo(x), t); await sleep(250); };
      await seek(30);
      b = await bar(page);
      ok(b.t === '10:00' && b.sub === '🎬 0:30.0', '動画を 30 秒まで進めても、止まっているあいだは 10:00', b);
      await page.click('#clock');
      b = await bar(page);
      ok(!b.stopped && b.last.includes('試合時間を動かしました'), 'ティップオフの所で時間を押す → 動く', b);
      await seek(50);
      ok((await bar(page)).t === '9:40', '動画を 50 秒まで進めると 9:40（20 秒ぶん進む）', await bar(page));
      await page.click('#clock');
      await seek(70);
      b = await bar(page);
      ok(b.stopped && b.t === '9:40' && b.sub === '🎬 1:10.0', '止めて、動画を 70 秒まで進めても 9:40 のまま', b);
      await seek(40);
      b = await bar(page);
      ok(!b.stopped && b.t === '9:50', '動画を 40 秒に戻すと、その時刻の試合時間（9:50・動いている）', b);
      await seek(10);
      b = await bar(page);
      ok(b.stopped && b.t === '10:00', '動画を 10 秒に戻すと 10:00（まだ動かす前）', b);
      // 記録の時刻は動画の時刻・試合時間は別
      await seek(45);
      await page.evaluate(() => BT.app.record(0, '7', 'fg2'));
      const g = await game(page);
      const ev = g.events[g.events.length - 1];
      eq([ev.t, await page.evaluate((t) => BT.gcLabel(BT.gameClock(BT.app.S.game, t)), ev.t)], [45, '1Q 残り 9:45'], '記録の時刻は動画の時刻（45 秒）・試合時間は 1Q 残り 9:45');
      // 再生中に押しても、動画は止まらない。再生すると試合時間も進む
      await seek(80);
      await page.click('#clock');          // 80 秒で動かす（70〜80 は止まっていた）
      await page.click('#rvPlay');
      await page.waitForFunction(() => !BT.app.S.rv.el.paused);
      await sleep(1300);
      const t1 = await page.evaluate(() => BT.app.S.rv.el.currentTime);
      b = await bar(page);
      const want = await page.evaluate(() => BT.gcText(BT.gameClock(BT.app.S.game, BT.app.elapsed())));
      ok(t1 > 80.8 && b.t === want && b.t !== '9:40', `再生すると、試合時間も進む（${b.t}）`, { t1, b, want });
      await page.click('#clock');
      await sleep(300);
      ok(await page.evaluate(() => !BT.app.S.rv.el.paused) && (await bar(page)).stopped, '再生中に時間を押しても、動画は止まらない（試合時間だけ止まる）');
      await page.click('#rvPlay');
      await shot(page, 'clock-review');
      // ピリオド：動画をその始まりまで動かして「2Q を始める」→ 10:00 から動く
      await seek(100);
      await page.click('#btnPeriod'); await page.click('#btnNextPeriod');
      await sleep(200);
      b = await bar(page);
      ok(b.t === '10:00' && !b.stopped, '動画の 100 秒で「2Q を始める」→ 10:00 から動く', b);
      await seek(110);
      ok((await bar(page)).t === '9:50', '2Q：動画が 10 秒進むと 9:50');
      await seek(90);
      ok((await bar(page)).stopped && (await page.textContent('#btnPeriod')) === '1Q', '動画を 2Q の前（90 秒）に戻すと、1Q の試合時間（止まっている）', await bar(page));
      // 書き出して読み込んでも同じ
      const same = await page.evaluate(() => { const g = BT.app.S.game; const b2 = BT.importData(JSON.stringify(BT.exportData(g))); return JSON.stringify(b2.gc) === JSON.stringify(g.gc) && BT.gcLabel(BT.gameClock(b2, 105)) === BT.gcLabel(BT.gameClock(g, 105)); });
      ok(same, '書き出して読み込んでも、試合時間は同じ');
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }
  } catch (e) { fail++; console.log('  STOPPED', e && e.stack || e); } finally { await browser.close(); await srv.close(); }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
