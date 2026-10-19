// 画面を通した確認：「バスケ タップ記録」の記録から場面を切り出す（Playwright の Chromium を画面なしで）
//   node basket-clips/tests/e2e-log.cjs [dev|built]
// 流れ：記録を先に読み込む → 動画を開く → 撮影時刻から合わせる → ずらす → 手で合わせ直す → 絞り込み → 続けて再生
//       → 「⌖」で合わせ直す → 1場面を動画にする → 開き直すと戻る → 同じ端末の記録から読み込む → 得点と照らし合わせて合わせる → 記録を外す
// テスト用の動画は ffmpeg で作る（120 秒・VP9 の MP4・撮影を終えた時刻 15:32:00 入り）。作業フォルダは WORK（既定は一時フォルダの basket-clips-e2e/）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const WORK = process.env.WORK || path.join(os.tmpdir(), 'basket-clips-e2e');
const ARGS = ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'];
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T0 = Date.UTC(2026, 9, 19, 6, 30, 0);       // 撮影の始まり（日本時間 15:30:00）

/* テスト用の動画（撮影を終えた時刻 = 始まり + 120 秒 を mvhd に入れる。スマホと同じ） */
function ensureVideo() {
  const file = path.join(WORK, 'log120.mp4');
  if (!fs.existsSync(file)) {
    console.log('（テスト用の動画を作っています：120 秒・VP9）');
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', '120', '-c:v', 'libvpx-vp9', '-b:v', '300k', '-deadline', 'realtime', '-cpu-used', '8', '-pix_fmt', 'yuv420p',
      '-metadata', 'creation_time=' + new Date(T0 + 120000).toISOString(), file], { stdio: 'inherit' });
  }
  return file;
}
/* 記録アプリ（basket-tap/js/core.js）で記録を作る：撮影を始めて 12 秒後にスタート */
function makeLog() {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'basket-tap', 'js', 'core.js'), 'utf8'), ctx);
  const BT = ctx.BT;
  const g = BT.newGame({ now: T0, tz: 540, teams: [{ name: '致遠館', color: '#f4f4f4', colorName: '白', players: BT.parseNumbers('4-15').map((no) => ({ no, name: no === '7' ? 'たけし' : '' })) }, { name: '城南', color: '#2f6fed', colorName: '青', players: BT.parseNumbers('4-12').map((no) => ({ no })) }] });
  g.startedAt = T0 + 12000;
  BT.addEvent(g, { t: 0, type: 'period', period: 1 });
  [[5, 'fg2', 0, '7'], [20, 'fg2x', 0, '5'], [21.5, 'reb', 1, '9'], [33, 'fg3', 1, '4'], [47, 'pass', 0, '7'], [61, 'fg2', 0, '10'], [78, 'reb', 0, null], [90, 'ft', 1, '11'], [100, 'mark', 0, '7'], [130, 'fg2', 1, '6']]
    .forEach(([t, type, team, no]) => BT.addEvent(g, { t, type, team, no }));
  BT.addEvent(g, { t: 70, type: 'period', period: 2 });
  return { game: g, json: JSON.stringify(BT.exportData(g)) };
}
const clipsOf = (page) => page.evaluate(() => BS.app.logClips().map((c) => ({ id: c.id, t: c.t, at: c.at, label: c.label, on: c.on })));
const anchors = (page) => page.evaluate(() => BS.app.S.st.sync && BS.app.S.st.sync.anchors);

(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  const video = ensureVideo();
  const { game, json } = makeLog();
  const logFile = path.join(WORK, 'log120.json');
  fs.writeFileSync(logFile, json);
  const srv = await start(0, MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-clips') : path.join(__dirname, '..'));
  const browser = await chromium.launch({ args: ARGS, env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版（public/basket-clips/index.html）' : '開発版（basket-clips/index.html）'}`);
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(srv.url);
    await page.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
    ok(await page.$('#btnLog') && await page.$('#btnLog2'), '「📋 記録を読み込む」（上と、① の中）');

    console.log('\n■ 記録を先に読み込む → 動画を開く');
    await page.setInputFiles('#fileLog', logFile);
    await page.waitForFunction(() => BS.app.S.pendingLog);
    ok((await page.textContent('#stepVideo')).includes('その試合の動画を選んでください'), '動画より先に読み込むと「その試合の動画を選んでください」');
    await page.setInputFiles('#fileVideo', video);
    await page.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.duration() > 100, null, { timeout: 30000 });
    await page.waitForFunction(() => BS.app.S.meta, null, { timeout: 10000 }).catch(() => {});
    ok(await page.evaluate(() => !!BS.app.S.st.log && !BS.app.S.pendingLog), '開いた動画に記録が付く');
    ok(await page.evaluate(() => !BS.app.S.finding && !BS.app.S.st.autoTried), '記録があるときは、ゴールを自動で探さない');
    ok(await page.evaluate(() => BS.app.S.st.teams[0].name === '致遠館' && BS.app.S.st.teams[1].color === '#2f6fed'), 'チームの名前・色は記録に合わせる');
    ok(await page.$('#logCard') && await page.$('#syncCard') && !(await page.$('#logClips')), '② 記録 ③ 時刻あわせ が出る（合わせるまで ④ は出ない）');

    console.log('\n■ 撮影時刻から合わせる（目安）');
    ok(await page.$('#syncMeta') && (await page.textContent('#syncMeta')).includes('0:12.0'), '「撮影時刻から合わせる」：記録の 0:00 ＝ 動画の 0:12.0', await page.$('#syncMeta') && await page.textContent('#syncMeta'));
    await page.click('#btnSyncMeta');
    let a = await anchors(page);
    ok(a && a.length === 1 && a[0].t === 0 && a[0].v === 12, '合わせた点：記録 0 秒 ＝ 動画 12 秒', a);
    let cl = await clipsOf(page);
    ok(cl.length === 9 && cl[0].at === 17 && cl[0].label === '#7 たけし 2P成功', '④ 場面 9（動画の外の 1 件は入れない）・最初は動画 0:17 の「#7 たけし 2P成功」', cl.slice(0, 2));
    ok((await page.textContent('#logClips')).includes('この動画に入っていない時間の記録：1件'), '動画の外の記録の数を知らせる');
    await page.click('[data-nudge="0.5"]');
    ok((await clipsOf(page))[0].at === 17.5, '「+0.5秒」で全部を後ろへ');
    await page.click('[data-nudge="-0.5"]');

    console.log('\n■ 手で合わせ直す（記録を選ぶ → 動画を止める → ボタン）');
    await page.click('#btnResync');
    const fg3 = await page.evaluate(() => BS.app.S.st.log.events.find((e) => e.type === 'fg3').id);
    await page.selectOption('#syncPick', fg3);
    await page.evaluate(() => BS.app.seek(46));
    await sleep(300);
    ok((await page.textContent('#syncNow')).trim() === '0:46.0', '「いまの位置」が動画の位置を示す');
    await page.click('#btnSyncHere');
    a = await anchors(page);
    ok(a.length === 1 && a[0].t === 33 && a[0].v === 46, '記録の 0:33（#4 3P成功）＝ 動画の 0:46', a);
    cl = await clipsOf(page);
    ok(cl[0].at === 18, 'ほかの場面も同じだけずれる（最初の場面 → 動画 0:18）', cl[0]);

    console.log('\n■ 絞り込み（チーム・プレー・選手）');
    await page.click('.fchip[data-fgrp="score"]');
    cl = await clipsOf(page);
    ok(cl.map((c) => c.t).join() === '5,33,61,90', '「得点」だけ', cl.map((c) => c.t));
    await page.click('.fchip[data-fplayer="0:7"]');
    cl = await clipsOf(page);
    ok(cl.length === 1 && cl[0].label === '#7 たけし 2P成功', '「得点」＋「#7 たけし」', cl);
    await page.click('.fchip[data-fgrp="all"]');
    cl = await clipsOf(page);
    ok(cl.map((c) => c.label).join('|') === '#7 たけし 2P成功|#7 たけし パスミス|#7 たけし ★ あとで見る', '#7 の全部のプレー');
    await page.click('.fchip[data-fplayer="all"]');
    await page.click('.fchip[data-fteam="0"]');
    cl = await clipsOf(page);
    ok(cl.length === 3 && (await page.evaluate(() => BS.app.logClips().every((c) => c.team === 1))), '相手のチームだけ');
    await page.click('.fchip[data-fteam="0"]');
    ok((await clipsOf(page)).length === 9, 'もとに戻す');
    let R = null;
    const rows = await page.$$eval('#logList .clip', (els) => els.length);
    ok(rows === 9, '一覧に 9 場面');
    await page.waitForFunction(() => document.querySelectorAll('#logList img.thumb[src^="data:"]').length >= 3, null, { timeout: 30000 }).catch(() => {});
    ok(await page.$$eval('#logList img.thumb[src^="data:"]', (els) => els.length) >= 3, '場面の小さな絵');

    console.log('\n■ 1場面の長さ（欄に入れて、そのまま「▶ 続けて再生」を押せる）');
    await page.fill('#lwinlead', '8');
    await page.click('#btnLogReel');
    await sleep(500);
    R = await page.evaluate(() => ({ active: BS.app.S.reel.active, seg: BS.app.S.reel.list[0], lead: BS.app.S.st.logWin.lead }));
    ok(R.active && R.lead === 8 && Math.abs((R.seg.at - R.seg.t0) - 8) < 0.01, '前 8 秒にして、1回のタップで続けて再生が始まる', R);
    await page.click('#reelStop');
    await page.fill('#lwinlead', '6');
    await page.press('#lwinlead', 'Enter');
    await page.locator('#lwinlead').blur();

    console.log('\n■ 続けて再生');
    const reelInfo = await page.evaluate(() => { const segs = BS.app.logClips(); return segs.length; });
    await page.click('#btnLogReel');
    await sleep(1200);
    R = await page.evaluate(() => ({ active: BS.app.S.reel.active, i: BS.app.S.reel.i, n: BS.app.S.reel.list.length, t: BS.app.S.media.time, seg: BS.app.S.reel.list[0], badge: document.querySelector('#ovBadge').textContent }));
    ok(R.active && R.i === 0 && R.n === reelInfo - 1 && R.t >= R.seg.t0 - 0.1 && R.t <= R.seg.t1, `続けて再生：${R.n} 場面（近い 2 つはつなぐ）・1 場面目を再生中`, R);
    ok(R.badge.includes('#7 たけし 2P成功') && R.badge.includes('1Q'), '映像の左上に「#7 たけし 2P成功・1Q」');
    await page.click('#reelNext');
    await sleep(800);
    R = await page.evaluate(() => ({ i: BS.app.S.reel.i, seg: BS.app.S.reel.list[BS.app.S.reel.i], t: BS.app.S.media.time }));
    ok(R.i === 1 && R.seg.label.includes('→') && R.t >= R.seg.t0 - 0.1, '2 場面目：つないだ場面（#5 2P失敗 → #9 リバウンド）', R.seg && R.seg.label);
    await page.click('#reelStop');

    console.log('\n■ 1つの場面だけずれていたら「⌖」');
    const fixId = (await clipsOf(page))[2].id;
    await page.evaluate(() => BS.app.seek(30));
    await sleep(200);
    await page.click(`[data-align="${fixId}"]`);
    await page.click('.modal-foot .btn.primary');
    a = await anchors(page);
    ok(a.length === 1 && a[0].v === 30, '「⌖」→ 合わせ直す：その記録の瞬間を、いまの位置にする', a);
    // 元に戻す（記録の 0:33 ＝ 動画の 0:46）
    await page.evaluate((id) => BS.app.syncAt(id, 46, 'reset'), fg3);

    console.log('\n■ 1つの場面を動画にする');
    const first = (await clipsOf(page))[0];
    await page.click('#logList .clip >> nth=0 >> button[title="この場面だけを動画にする"]');
    await page.waitForFunction(() => BS.app.S.exporting, null, { timeout: 5000 });
    await page.waitForFunction(() => !BS.app.S.exporting, null, { timeout: 60000, polling: 300 });
    const out = await page.evaluate(() => BS.app.S.logOut && { size: BS.app.S.logOut.blob.size, sec: BS.app.S.logOut.seconds, name: BS.app.S.logOut.name });
    ok(out && out.size > 20000 && Math.abs(out.sec - 8) < 0.6 && /#?7|たけし/.test(out.name), `書き出した動画（約 ${out && Math.round(out.sec)} 秒・${out && Math.round(out.size / 1024)}KB・${out && out.name}）`, out);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnLogDownload')]);
    ok(fs.statSync(await dl.path()).size === out.size, '「⬇ 保存する」で保存できる');
    void first;

    console.log('\n■ 開き直すと、記録・時刻あわせ・絞り込みが戻る');
    await page.click('.fchip[data-fgrp="score"]');
    await page.reload();
    await page.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
    await page.setInputFiles('#fileVideo', video);
    await page.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.duration() > 100, null, { timeout: 30000 });
    await sleep(300);
    a = await anchors(page);
    ok(a && a[0].t === 33 && a[0].v === 46 && (await clipsOf(page)).length === 4, '同じ動画を開くと、記録・時刻あわせ・「得点」の絞り込みが戻る', a);
    await page.click('.fchip[data-fgrp="all"]');

    console.log('\n■ 同じ端末で記録した試合から読み込む');
    await page.evaluate((g) => {
      localStorage.setItem('btap:game:' + g.id, JSON.stringify(g));
      localStorage.setItem('btap:games', JSON.stringify([{ id: g.id, date: g.date, startedAt: g.startedAt, names: ['致遠館', '城南'], colors: ['#f4f4f4', '#2f6fed'], score: [4, 4], n: 10 }]));
    }, Object.assign({}, game, { id: 'gLocal' }));
    await page.click('#btnLog');
    await page.waitForSelector('.lglist .lg');
    ok((await page.textContent('.lglist')).includes('城南'), '「この端末で記録した試合」に出る');
    await page.click('.lglist .lg');
    await sleep(300);
    ok(await page.evaluate(() => BS.app.S.st.log && BS.app.S.st.log.id === 'gLocal' && !BS.app.S.st.sync), '選ぶと読み込む（時刻あわせは、やり直し）');

    console.log('\n■ 自動で探した得点と照らし合わせて合わせる');
    await page.evaluate(() => {
      // 解析の結果（得点：記録の得点の 13 秒後 − タップの遅れ 0.5〜1.5 秒）を入れる
      const st = BS.app.S.st;
      st.result = { shots: [[5, 1.1], [33, 0.6], [61, 1.4], [90, 0.9]].map(([t, d], i) => ({ t: t + 13 - d, hoop: i % 2, made: true, sure: true })), spans: [], marks: 'x' };
      BS.app.render();
    });
    ok(await page.$('#btnSyncShots'), '解析の結果があると「照らし合わせて合わせる」');
    await page.click('#btnSyncShots');
    a = await anchors(page);
    ok(a && a[0].t === 0 && Math.abs(a[0].v - 12) < 0.8, `照らし合わせて合わせた：記録 0:00 ＝ 動画 ${a && a[0].v}`, a);
    await page.evaluate(() => { BS.app.S.st.result = null; BS.app.render(); });

    console.log('\n■ 記録を外す');
    await page.click('#btnLogRemove');
    ok(await page.evaluate(() => !BS.app.S.st.log) && await page.$('#stepGoals') && !(await page.$('#logCard')), 'ふつうの画面（ゴール・解析）に戻る');
    ok(errors.length === 0, 'ページのエラーがない', errors.slice(0, 3));

    console.log('\n■ 動画を先に開いてから、記録を読み込む（ゴールを探している途中なら、やめる）');
    const page2 = await browser.newPage({ viewport: { width: 1200, height: 860 } });
    const errors2 = [];
    page2.on('pageerror', (e) => errors2.push(String(e)));
    await page2.goto(srv.url);
    await page2.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
    await page2.evaluate(() => localStorage.clear());
    await page2.setInputFiles('#fileVideo', video);
    await page2.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready, null, { timeout: 30000 });
    await page2.setInputFiles('#fileLog', logFile);
    await page2.waitForFunction(() => BS.app.S.st.log);
    await page2.waitForFunction(() => !BS.app.S.finding, null, { timeout: 30000 });
    ok(await page2.evaluate(() => !BS.app.S.finding && !!document.querySelector('#syncCard')), 'ゴールの自動検出は止まり、③ 時刻あわせへ');
    ok(errors2.length === 0, 'ページのエラーがない', errors2.slice(0, 3));
    await page2.close();
  } catch (e) {
    fail++;
    console.log('  FAIL 途中で止まりました:', e && e.stack || e);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
