// 画面を通した確認：「バスケ タップ記録」の記録から場面を切り出す（Playwright の Chromium を画面なしで）
//   node basket-clips/tests/e2e-log.cjs [dev|built]
// 流れ：記録を先に読み込む → 動画を開く → 撮影時刻から合わせる → ずらす → 手で合わせ直す → 絞り込み → 続けて再生
//       → 「⌖」で合わせ直す → 「↔ 指でずらして合わせる」→ 1場面を動画にする → 開き直すと戻る → 同じ端末の記録から読み込む → 得点と照らし合わせて合わせる → 記録を外す
//       → スマホの大きさの画面で「↔ 指でずらして合わせる」
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

    console.log('\n■ プレーごとの1場面の長さ（はじめは、リバウンド・★ あとで見る が前 5 秒）');
    {
      const setNum = async (sel, v) => { await page.fill(sel, String(v)); await page.press(sel, 'Enter'); await page.locator(sel).blur(); };
      const leads = (grp) => page.evaluate((g) => BS.app.logClips().filter((c) => c.grp === g).map((c) => +(c.at - c.t0).toFixed(2)), grp);
      const rowsW = () => page.$$eval('#winBy .wbrow', (els) => els.map((e) => `${e.dataset.wgrp}:${e.querySelector('input').value}${e.querySelector('.wbtag').textContent === 'ふつう' && e.classList.contains('dflt') ? '=' : ''}`).join(' '));
      ok(await page.$('#winBy') && !(await page.$eval('#winBy', (d) => d.open)), '「⏱ プレーごとに長さを変える」は、たたんだ中');
      await page.click('#winBy summary');
      ok((await rowsW()) === 'score:6= miss:6= reb:5 pass:6= mark:5', '記録にあるプレーごとの前の秒数（得点・失敗・パスミスは「ふつう」の 6 秒・リバウンドと★は 5 秒）', await rowsW());
      ok((await leads('reb')).every((x) => x === 5) && (await leads('mark')).every((x) => x === 5) && (await leads('score')).every((x) => x === 6), 'リバウンド・★ の場面は前 5 秒、得点は前 6 秒（ふつう）');
      await setNum('#lwin-reb-lead', 3);
      ok((await leads('reb')).every((x) => x === 3) && (await page.textContent('#winByText')).includes('リバウンド 前3'), 'リバウンドを前 3 秒に → リバウンドの場面だけ短くなる');
      await setNum('#lwinlead', 7);
      ok((await rowsW()).startsWith('score:7= miss:7= reb:3') && (await leads('score')).every((x) => x === 7) && (await leads('reb')).every((x) => x === 3), 'ふつうの長さを 7 秒に → 「ふつう」のプレー（得点など）は 7 秒、リバウンドは 3 秒のまま', await rowsW());
      await page.click('#winReset');
      ok((await rowsW()) === 'score:10= miss:10= reb:5 pass:10= mark:5' && (await page.inputValue('#lwinlead')) === '10', '「はじめの長さに戻す」：ふつう 前 10 秒・リバウンドと★は前 5 秒', await rowsW());
      await setNum('#lwinlead', 6);
      await page.click('#winBy summary');
    }

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

    console.log('\n■ ↔ 指でずらして合わせる（場面の枠を、目盛りの上で指で動かす）');
    {
      const adj = () => page.evaluate(() => { const A = BS.app.S.adj; return A && { d: A.d, ref: A.ref, val: document.querySelector('#adjVal').textContent, ok: document.querySelector('#adjOk').textContent, t: BS.app.S.media.time }; });
      const closed = () => page.evaluate(() => document.querySelector('#modal').hidden && !BS.app.S.adj);
      const atTime = (t) => page.waitForFunction((x) => Math.abs(BS.app.S.media.time - x) < 0.05, t, { timeout: 5000 }).then(() => true, () => false);
      ok(await page.$('#btnAdjust') && await page.$('#logList [data-adjust]'), '③ に「↔ 指でずらして合わせる」、④ の各場面に「↔」');
      await page.evaluate(() => BS.app.seek(75));
      await sleep(200);
      await page.click('#btnAdjust');
      await page.waitForSelector('#adjRuler');
      const ref = await page.evaluate(() => { const A = BS.app.S.adj, c = A.refs.find((x) => x.id === A.ref); return { id: c.id, t: c.t, at: c.at, sel: document.querySelector('#adjRef').value }; });
      ok(ref.t === 61 && ref.at === 74 && ref.sel === ref.id, 'はじめの見本：いまの位置にいちばん近い得点（記録 1:01 の #10 2P成功 ＝ 動画 1:14）', ref);
      ok(await atTime(74), '開くと、映像は見本の「記録した瞬間」（動画 1:14）へ');
      await sleep(200);
      const lit = await page.evaluate(() => { const cv = document.querySelector('#adjPv'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n / (d.length / 16); });
      ok(lit > 0.3, `小さな画面に、そのコマが写る（明るいところ ${Math.round(lit * 100)}%）`, lit);
      const W = await page.evaluate(() => document.querySelector('#adjRuler').clientWidth);
      const box = await page.locator('#adjRuler').boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 100, y, { steps: 8 }); await page.mouse.up();
      const e1 = Math.round((100 * 10 / W) * 10) / 10;
      let st = await adj();
      ok(st.d === e1 && st.val === `+${e1.toFixed(1)} 秒` && st.ok.includes(`+${e1.toFixed(1)} 秒`), `目盛り（±5秒）の上で右へ 100px → 場面を後ろへ ${e1} 秒（「これで合わせる（+${e1.toFixed(1)} 秒）」）`, st);
      ok(await atTime(74 + e1), '映像（小さな画面）は、ずらした「記録した瞬間」へ付いてくる');
      a = await anchors(page);
      ok(a.length === 1 && a[0].v === 46, '「これで合わせる」を押すまでは、時刻あわせを変えない', a);
      await page.click('[data-adjstep="0.1"]');
      await page.click('[data-adjstep="-1"]');
      await page.focus('#adjRuler');
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowRight');
      st = await adj();
      ok(Math.abs(st.d - Math.round((e1 + 0.3) * 10) / 10) < 1e-6, '「+0.1秒」「−1秒」のボタン・← → キー（0.1 秒。Shift で 1 秒）', st);
      await page.click('[data-adjzoom="1"]');
      const d0 = (await adj()).d;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 50, y, { steps: 5 }); await page.mouse.up();
      st = await adj();
      const e2 = Math.round((d0 - 50 * 60 / W) * 10) / 10;
      ok(Math.abs(st.d - e2) < 1e-6 && e2 < -2, `目盛りを「±30秒」にすると、大きく動く（左へ 50px → ${st.d} 秒）`, { st, e2 });
      await page.click('#adjReset');
      ok((await adj()).d === 0 && (await page.textContent('#adjVal')) === '±0 秒', '「元に戻す」で ±0');
      await page.click('[data-adjzoom="0"]');
      // 指（タッチ）でのドラッグ
      await page.evaluate(({ x, y }) => {
        const el = document.querySelector('#adjRuler');
        const ev = (type, cx) => el.dispatchEvent(new PointerEvent(type, { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: cx, clientY: y, bubbles: true, cancelable: true }));
        ev('pointerdown', x); for (let i = 1; i <= 6; i++) ev('pointermove', x - i * 10); ev('pointerup', x - 60);
      }, { x, y });
      st = await adj();
      const e3 = Math.round((-60 * 10 / W) * 10) / 10;
      const ta = await page.evaluate(() => getComputedStyle(document.querySelector('#adjRuler')).touchAction);
      ok(Math.abs(st.d - e3) < 1e-6 && ta === 'none', `指（タッチ）で左へ 60px → 場面を前へ ${-e3} 秒（目盛りの上では、画面がスクロールしない）`, { st, ta });
      // 見本の場面を、いまのずらし方で再生する
      await page.click('#adjReset');
      await page.click('[data-adjstep="1"]');
      await page.click('[data-adjstep="0.1"]');
      await page.click('#adjPlay');
      await sleep(900);
      R = await page.evaluate(() => ({ active: BS.app.S.reel.active, seg: BS.app.S.reel.list[0], t: BS.app.S.media.time, paused: BS.app.S.media.paused, btn: document.querySelector('#adjPlay').textContent }));
      ok(R.active && !R.paused && Math.abs(R.seg.t0 - (74 + 1.1 - 6)) < 0.02 && Math.abs(R.seg.t1 - (74 + 1.1 + 2)) < 0.02 && R.t >= R.seg.t0 - 0.05 && R.t <= R.seg.t1 && R.btn.includes('止める'),
        '「▶ この場面を見る」：ずらした場面（記録した瞬間の前 6 秒・後 2 秒）を再生', R);
      await page.click('#adjPlay');
      ok(await page.waitForFunction(() => !BS.app.S.reel.active && BS.app.S.media.paused && document.querySelector('#adjPlay').textContent.includes('この場面を見る'), null, { timeout: 2000 }).then(() => true, () => false), 'もう一度押すと止まる');
      // 見本を変えても、ずらす量はそのまま（同じずらし方を、ほかの場面でも確かめる）
      const other = (await clipsOf(page)).find((c) => c.t === 33);
      await page.selectOption('#adjRef', other.id);
      st = await adj();
      ok(st.d === 1.1 && st.ref === other.id && await atTime(other.at + 1.1), '見本の場面を変えても、ずらす量はそのまま（映像はその場面の記録した瞬間 ＋1.1 秒へ）', st);
      await page.click('#adjOk');
      a = await anchors(page);
      ok(a.length === 1 && a[0].t === 33 && Math.abs(a[0].v - 47.1) < 1e-6, '「✓ これで合わせる」：全部の場面を後ろへ 1.1 秒（記録の 0:33 ＝ 動画の 0:47.1）', a);
      ok(await closed() && (await page.textContent('#toasts')).includes('全部の場面を 後ろへ 1.1 秒ずらしました'), '小窓が閉じて、知らせる');
      ok(Math.abs((await clipsOf(page))[0].at - 19.1) < 1e-6, 'ほかの場面も同じだけ（最初の場面 → 動画 0:19.1）');
      // 最後に ▶ で見た場面が、次の見本になる
      const row2 = (await clipsOf(page))[1];
      await page.click(`#logList .clip[data-id="${row2.id}"] button[title="この場面を見る"]`);
      await sleep(300);
      await page.click('#btnAdjust');
      await page.waitForSelector('#adjRuler');
      ok((await adj()).ref === row2.id && !(await page.evaluate(() => BS.app.S.reel.active)), '最後に ▶ で見た場面が見本になる（開くと再生は止める）');
      await page.keyboard.press('Escape');
      ok(await closed(), 'Esc で閉じる');
      await page.click('#btnLogReel');
      await sleep(500);
      await page.click('#reelNext');
      await sleep(500);
      const segIds = await page.evaluate(() => BS.app.S.reel.list[BS.app.S.reel.i].ids);
      await page.click('#btnAdjust');
      await page.waitForSelector('#adjRuler');
      ok((await adj()).ref === segIds[0] && !(await page.evaluate(() => BS.app.S.reel.active)), '「▶ 続けて再生」の途中で開くと、再生中の場面が見本（再生は止める）', segIds);
      await page.keyboard.press('Escape');
      await page.evaluate(() => BS.app.seek(105));
      await sleep(200);
      await page.click('#btnAdjust');
      await page.waitForSelector('#adjRuler');
      const ft = (await clipsOf(page)).find((c) => c.t === 90);
      ok((await adj()).ref === ft.id, '映像を遠くへ動かしたあとは、いまの位置にいちばん近い得点が見本（記録 1:30 のフリースロー）', await adj());
      await page.keyboard.press('Escape');
      // ④ の場面の「↔」→ やめる
      const row4 = (await clipsOf(page))[3];
      await page.click(`[data-adjust="${row4.id}"]`);
      await page.waitForSelector('#adjRuler');
      ok((await page.inputValue('#adjRef')) === row4.id, '④ の場面の「↔」：その場面を見本にして開く');
      await page.click('[data-adjstep="1"]');
      await page.click('.modal-foot .btn:not(.primary)');
      a = await anchors(page);
      ok(await closed() && Math.abs(a[0].v - 47.1) < 1e-6 && (await page.textContent('#toasts')).includes('ずらしていません'), '「やめる」：変えない（「ずらしていません」と知らせる）', a);
      // 合わせた点が2つ（撮影を途中で止めた動画など）：見本の場面のある区間だけをずらす
      await page.evaluate(() => { BS.app.S.st.sync.anchors = [{ t: 0, v: 13 }, { t: 70, v: 90 }]; BS.app.render(); });
      const late = (await clipsOf(page)).find((c) => c.t === 90);
      await page.click(`[data-adjust="${late.id}"]`);
      await page.waitForSelector('#adjRuler');
      ok((await page.textContent('#adjScope')).includes('記録の 1:10〜最後'), '合わせた点が2つのとき：「この場面のある区間（記録の 1:10〜最後）の場面だけ」', await page.textContent('#adjScope'));
      await page.click('[data-adjstep="-1"]');
      await page.click('#adjOk');
      a = await anchors(page);
      ok(a.length === 2 && a[0].v === 13 && a[1].t === 70 && a[1].v === 89, 'その区間の点だけを前へ 1 秒（前の区間はそのまま）', a);
      ok((await page.textContent('#toasts')).includes('記録の 1:10〜最後 の場面を 前へ 1.0 秒'), '知らせにも、ずらした区間');
    }
    // 元に戻す（記録の 0:33 ＝ 動画の 0:46）
    await page.evaluate((id) => BS.app.syncAt(id, 46, 'reset'), fg3);

    console.log('\n■ ＋ この瞬間を場面に足す（記録にない場面を自分で）');
    {
      const users = () => page.evaluate(() => BS.app.logClips().filter((c) => c.user));
      await page.evaluate(() => BS.app.seek(55.5));
      await sleep(300);
      await page.click('#btnAddScene');
      await page.waitForSelector('#addOk');
      ok((await page.textContent('.addscene')).includes('動画 0:55.5') && await page.$('.fchip[data-addtype="mark"].on') && await page.$('.fchip[data-addteam="null"].on'), '開くと、いまの位置（動画 0:55.5）・はじめは「★ あとで見る」「チームなし」');
      await page.click('.fchip[data-addtype="stl"]');
      await page.click('.fchip[data-addteam="0"]');
      await page.fill('#addNo', '7');
      await page.fill('#addMemo', 'いいディフェンス');
      await page.click('#addOk');
      const u = (await users())[0];
      ok(u && u.at === 55.5 && u.label === '#7 たけし スティール：いいディフェンス' && u.team === 0 && Math.abs(u.at - u.t0 - 6) < 1e-9, '足した場面：動画 0:55.5・「#7 たけし スティール：いいディフェンス」・前 6 秒（ふつうの長さ）', u);
      const urow = await page.$(`#logList .clip.user[data-id="${u.id}"]`);
      ok(urow && (await urow.textContent()).includes('自分で足した場面') && !(await urow.$('[data-adjust]')) && !(await urow.$('[data-align]')) && await urow.$('[data-unadd]'), '一覧に「✋ 自分で足した場面」（「↔」「⌖」はなく、「🗑」で消せる）');
      ok(await page.$('.fchip[data-fgrp="stl"]'), '絞り込みに「スティール」が出る');
      await page.click('[data-nudge="1"]');
      ok((await page.evaluate((id) => BS.app.logClips().find((c) => c.id === id).at, u.id)) === 55.5, '時刻あわせをずらしても、足した場面は動かない');
      await page.click('[data-nudge="-1"]');
      await page.evaluate(() => BS.app.seek(80));
      await sleep(200);
      await page.click('#btnAddScene');
      await page.click('.fchip[data-addtype="fg3"]');
      ok(await page.$('.fchip[data-addteam="0"].on') && await page.$eval('.fchip[data-addteam="null"]', (b) => b.disabled), '得点を選ぶと、チームは「自分」（チームなしは選べない）');
      await page.fill('#addNo', 'ab');
      await page.click('#addOk');
      ok(await page.isVisible('#addOk') && (await page.textContent('#toasts')).includes('背番号は'), '背番号がおかしいと足さない（小窓はそのまま）');
      await page.fill('#addNo', '');
      await page.click('#addOk');
      ok((await users()).length === 2 && (await users())[1].label === '3P成功', '番号なしでも足せる（「3P成功」）', (await users()).map((c) => c.label));
      await page.click(`#logList .clip[data-id="${u.id}"] button[title="この場面を見る"]`);
      await sleep(600);
      R = await page.evaluate(() => ({ active: BS.app.S.reel.active, seg: BS.app.S.reel.list[0] }));
      ok(R.active && Math.abs(R.seg.t0 - 49.5) < 0.01 && Math.abs(R.seg.t1 - 57.5) < 0.01, '▶ で、足した場面（0:49.5〜0:57.5）を再生', R.seg);
      await page.click('#reelStop');
      for (const id of (await users()).map((c) => c.id)) {
        await page.click(`[data-unadd="${id}"]`);
        await page.click('.modal-foot .btn.primary');
      }
      ok(await page.evaluate(() => !BS.app.logClips().some((c) => c.user) && BS.app.S.st.logAdds.length === 0), '「🗑」で消せる');
    }

    console.log('\n■ コマ送り（◂ コマ ▸）・📷 写真');
    {
      const tnow = () => page.evaluate(() => BS.app.S.media.time);
      ok(await page.evaluate(() => BS.app.S.fps) === 30, '動画の目次から 1秒のコマ数（30）を読む');
      await page.evaluate(() => BS.app.seek(10));
      await sleep(200);
      await page.click('#btnNextF');
      await sleep(250);
      ok(Math.abs((await tnow()) - 301.5 / 30) < 0.002, '▸：1コマ進む（10.000 → 10.050：コマのまん中）', await tnow());
      await page.click('#btnPrevF'); await sleep(250);
      await page.click('#btnPrevF'); await sleep(250);
      ok(Math.abs((await tnow()) - 299.5 / 30) < 0.002, '◂ 2回：2コマ戻る（9.983）', await tnow());
      await page.keyboard.press('Period'); await sleep(250);
      ok(Math.abs((await tnow()) - 300.5 / 30) < 0.002, '「.」キーでも1コマ進む', await tnow());
      // 長押しして離す：続けて進み、離したあとの click では、もう動かない（指の click は detail が 0 のことがある）
      const hold = await page.evaluate(async () => {
        const b = document.querySelector('#btnNextF'), wait = (ms) => new Promise((res) => setTimeout(res, ms));
        const t0 = BS.app.S.media.time;
        b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0, pointerId: 5 }));
        await wait(1300);
        b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', pointerId: 5 }));
        await wait(350);
        const t1 = BS.app.S.media.time;
        b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
        await wait(350);
        return { moved: Math.round((t1 - t0) * 30), extra: Math.round((BS.app.S.media.time - t1) * 30) };
      });
      ok(hold.moved >= 4 && hold.extra === 0, `▸ を長押しすると続けて進み（${hold.moved} コマ）、離したあとは余分に動かない`, hold);
      await page.evaluate(() => BS.app.seek(300.5 / 30));
      await sleep(250);
      await page.evaluate(() => BS.app.S.media.play());
      await sleep(300);
      await page.click('#btnNextF'); await sleep(300);
      ok(await page.evaluate(() => BS.app.S.media.paused), '再生中に押すと、止めてからコマ送り');
      const t0 = await tnow();
      const nb = await page.locator('#btnNextF').boundingBox();
      await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
      await page.mouse.down(); await sleep(1300); await page.mouse.up();
      const moved = Math.round(((await tnow()) - t0) * 30);
      ok(moved >= 4, `押し続けると、続けてコマ送り（1.3 秒で ${moved} コマ）`, moved);
      await sleep(300);
      const after = await tnow();
      await sleep(300);
      ok(Math.abs((await tnow()) - after) < 1e-6, '指を離すと止まる');
      // 📷 写真（パソコンはダウンロード）
      await page.evaluate(() => BS.app.seek(20));
      await sleep(300);
      const [jpg] = await Promise.all([page.waitForEvent('download'), page.click('#btnShot')]);
      const jp = await jpg.path();
      const head = fs.readFileSync(jp).subarray(0, 3);
      const sz = fs.statSync(jp).size;
      ok(/^log120_0-20\.0\.jpg$/.test(jpg.suggestedFilename()) && head[0] === 0xff && head[1] === 0xd8 && sz > 20000, `「📷 写真」：いまのコマを JPEG に（${jpg.suggestedFilename()}・${Math.round(sz / 1024)}KB）`, { name: jpg.suggestedFilename(), sz });
      ok((await page.textContent('#toasts')).includes('640×360'), 'そのままの大きさ（640×360）で保存と知らせる');
    }

    console.log('\n■ 💬 コメント・スタンプ（その場面から 5 秒、動画の中に出る・書き出す動画にも入る）');
    {
      const notes = () => page.evaluate(() => BS.app.noteList());
      const inkAt = async (t) => {
        await page.evaluate((x) => BS.app.seek(x), t); await sleep(350);
        return page.evaluate(() => { const cv = document.querySelector('#noteCanvas'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return n; });
      };
      ok(await page.$('#notesCard') && (await page.textContent('#notesCard')).includes('この場面にコメント'), '「💬 コメント・スタンプ」の欄（まだコメントなし）');
      await page.evaluate(() => BS.app.seek(30)); await sleep(300);
      await page.click('#btnNote');
      await page.waitForSelector('#noteOk');
      ok((await page.textContent('.notedlg')).includes('動画 0:30.0 から 5 秒'), '映像の下の「💬 コメント」：いまの場面（動画 0:30.0）から 5 秒');
      await page.click('.stamp[data-stamp="👍"]');
      await page.click('.stamp[data-stamp="❓"]');
      await page.fill('#noteText', 'ヘルプが遅い #ヘルプ');
      await page.click('.fchip[data-ntag="リバウンド"]');
      await page.click('#noteOk');
      let ns = await notes();
      ok(ns.length === 1 && ns[0].t === 30 && ns[0].dur === 5 && ns[0].stamps.join('') === '👍❓' && ns[0].tags.join() === 'リバウンド,ヘルプ' && ns[0].text === 'ヘルプが遅い #ヘルプ', '入れた：0:30・5 秒・👍❓・「ヘルプが遅い #ヘルプ」・タグ（リバウンド・ヘルプ）', ns);
      const on = await inkAt(31), off = await inkAt(36.5);
      ok(on > 200 && off === 0, '映像の上に、その時刻から 5 秒だけ出る（0:31 で出ている・0:36.5 で消える）', { on, off });
      ok((await page.textContent('#noteList')).includes('ヘルプが遅い') && await page.$('#noteList .ntag[data-tag="ヘルプ"]'), '一覧に出る（タグは押すと、さがす・調べる）');
      await page.click('#noteList [data-noteedit="n1"]');
      await page.click('.fchip[data-ndur="8"]');
      await page.click('#noteOk');
      ok((await notes())[0].dur === 8 && (await inkAt(37)) > 200, '「✎」で直す：出す長さを 8 秒に（0:37 でも出ている）');
      await page.click('#noteList .noterow button[title^="この場面を見る"]');
      await sleep(500);
      R = await page.evaluate(() => ({ active: BS.app.S.reel.active, seg: BS.app.S.reel.list[0], badge: document.querySelector('#ovBadge').textContent }));
      ok(R.active && R.seg.t0 === 27 && R.seg.t1 === 39 && R.badge.includes('ヘルプが遅い'), '▶：コメントの 3 秒前から、出し終わって 1 秒後まで（0:27〜0:39）', R.seg);
      await page.click('#reelStop');
      await page.evaluate(() => BS.app.seek(60)); await sleep(250);
      await page.click('#btnNote');
      await page.click('#noteOk');
      ok(await page.isVisible('#noteOk') && (await page.textContent('#toasts')).includes('スタンプを選んで'), '何も入れずに押すと、知らせて小窓はそのまま');
      await page.click('.stamp[data-stamp="👏"]');
      await page.click('#noteOk');
      ns = await notes();
      ok(ns.length === 2 && ns[1].stamps.join('') === '👏' && ns[1].text === '', 'スタンプだけでも入れられる（👏 ナイス）');
      // コメント帳
      await page.click('#btnBook');
      await page.waitForSelector('#bookList');
      ok((await page.$$('#bookList .bookrow')).length === 2, 'コメント帳：この動画のコメント 2 件');
      await page.fill('#bookQ', 'へるぷ');
      ok((await page.$$('#bookList .bookrow')).length === 1 && (await page.getAttribute('#bookYt', 'href')) === 'https://www.youtube.com/results?search_query=' + encodeURIComponent('バスケ へるぷ'), 'ことばでさがす（ひらがなでも「ヘルプ」）・YouTube で調べるリンク');
      await page.click('#bookTags .fchip[data-btag="リバウンド"]');
      ok((await page.getAttribute('#bookGrow', 'href')) === 'https://dora9991.github.io/math-dialogue/basket-coach/#q/' + encodeURIComponent('リバウンド') && (await page.$$('#bookList .bookrow')).length === 1, 'タグで絞る・バスケ・グロウ（ずかんで「リバウンド」）へのリンク');
      await page.click('.modal-foot .btn.primary');
      // コメントの場面を動画にする（書き出しの絵に、コメントを描いたか）
      await page.evaluate(() => { const d = BS.notes.draw; window.__nd = 0; BS.notes.draw = function () { const r = d.apply(this, arguments); if (r && arguments.length === 5) window.__nd++; return r; }; });
      await page.click('#btnNoteExport');
      await page.waitForFunction(() => BS.app.S.exporting && BS.app.S.exporting.kind === 'note', null, { timeout: 5000 });
      ok(await page.$('#noteExportBox #expBar') && !(await page.$('#exportBox #expBar')), '書き出している間は、コメントの欄に進み具合');
      await page.waitForFunction(() => !BS.app.S.exporting, null, { timeout: 90000, polling: 300 });
      const no = await page.evaluate(() => BS.app.S.noteOut && { size: BS.app.S.noteOut.blob.size, sec: BS.app.S.noteOut.seconds, name: BS.app.S.noteOut.name, drawn: window.__nd });
      ok(no && no.size > 20000 && no.drawn > 20 && /_コメント_2場面\./.test(no.name), `「🎬 コメントの場面を動画にする」：2 場面・約 ${no && Math.round(no.sec)} 秒・コメント・スタンプを描いたコマ ${no && no.drawn}`, no);
      const [dln] = await Promise.all([page.waitForEvent('download'), page.click('#btnNoteDownload')]);
      ok(fs.statSync(await dln.path()).size === no.size, '「⬇ 保存する」で保存できる');
      await page.click('#btnNoteCopy');
      await sleep(400);
      ok((await page.textContent('#toasts')).includes('コピー') || !!(await page.$('.notecopy')), '「📋 文字でコピー」（LINE などに貼る）');
      if (await page.$('.notecopy')) await page.click('.modal-foot .btn.primary');
      // 🎬 動画全体を書き出す（コメント・スタンプ入り）：書き出しに渡すものを確かめて、途中で中止
      await page.click('#btnFullExport');
      await page.waitForSelector('#fullOk');
      const fx = await page.textContent('.fullexp');
      ok(fx.includes('動画全体（2:00）') && fx.includes('約 2 分') && /約 \d+MB/.test(fx), '「🎬 動画全体を書き出す」：長さ（2:00）・かかる時間（約 2 分）・大きさの目安', fx);
      await page.evaluate(() => { const orig = BS.exportReel; window.__fx = null; BS.exportReel = function (media, clips, opts) { window.__fx = { clips: clips.map((c) => [c.t0, c.t1]), cards: opts.cards, captions: opts.captions, bitrate: opts.bitrate, notes: (opts.notes || []).length }; return orig.apply(this, arguments); }; });
      await page.click('#fullOk');
      await page.waitForFunction(() => BS.app.S.exporting && BS.app.S.exporting.kind === 'full', null, { timeout: 5000 });
      const fa = await page.evaluate(() => window.__fx);
      ok(fa && fa.clips.length === 1 && fa.clips[0][0] === 0 && Math.abs(fa.clips[0][1] - 120) < 0.5 && fa.cards === false && fa.captions === false && fa.bitrate === 3000000 && fa.notes === 2,
        '動画のはじめから終わりまで（0〜2:00）・はじめと終わりの画面なし・左上の札なし・コメント・スタンプ入り・3 Mbps', fa);
      await sleep(1500);
      ok((await page.textContent('#noteExportBox')).includes('動画全体を書き出しています') && /動画 0:0\d \/ 2:00/.test(await page.textContent('#expLabel')), '進み具合：「動画全体を書き出しています…」「動画 0:01 / 2:00」', await page.textContent('#expLabel'));
      await page.click('#noteExportBox .btn.danger');
      await page.waitForFunction(() => !BS.app.S.exporting, null, { timeout: 10000 });
      ok(await page.evaluate(() => !BS.app.S.noteOut) && (await page.textContent('#toasts')).includes('中止'), '「中止」で止められる');
      await page.click('#noteList [data-notedel="n2"]');
      ok((await notes()).length === 1, '「🗑」で消せる');
    }

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
    ok((await page.evaluate(() => BS.app.noteList().map((n) => n.text).join())) === 'ヘルプが遅い #ヘルプ', '…コメント・スタンプも戻る');
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

    console.log('\n■ チームなしの記録（記録の画面の下の「パスミス」「★」）');
    {
      const gf = JSON.parse(JSON.stringify(game));
      gf.id = 'gFree';
      gf.events.push({ id: 'e90', t: 55, type: 'pass', team: null, no: null }, { id: 'e91', t: 58, type: 'mark', team: null, no: null });
      await page.evaluate((g) => { BS.app.loadLog(JSON.stringify(g), 'free.json'); BS.app.syncAt(BS.app.S.st.log.events.find((e) => e.type === 'period' && e.t === 0).id, 12, 'reset'); }, gf);
      await sleep(200);
      cl = await clipsOf(page);
      const free = cl.filter((c) => c.t === 55 || c.t === 58);
      ok(free.length === 2 && free[0].label === 'パスミス' && free[1].label === '★ あとで見る', 'チームなしのパスミス・★ も場面になる（呼び名にチーム名を付けない）', free);
      await page.click('.fchip[data-fteam="0"]');
      ok((await clipsOf(page)).some((c) => c.t === 55), '「相手だけ」にしても、チームなしの場面は残る');
      await page.click('.fchip[data-fteam="0"]');
      const color = await page.evaluate(() => getComputedStyle(document.querySelector('#logList .clip[data-id="e90"]')).getPropertyValue('--team').trim());
      ok(color === '#9aa3af', '一覧の色は、チームの色でなく灰色', color);
    }

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

    console.log('\n■ スマホの大きさ（390×844・指）で「↔ 指でずらして合わせる」');
    {
      const p3 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const errors3 = [];
      p3.on('pageerror', (e) => errors3.push(String(e)));
      await p3.goto(srv.url);
      await p3.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
      await p3.evaluate(() => localStorage.clear());
      await p3.setInputFiles('#fileLog', logFile);
      await p3.setInputFiles('#fileVideo', video);
      await p3.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.duration() > 100, null, { timeout: 30000 });
      await p3.waitForSelector('#btnSyncMeta', { timeout: 10000 });
      await p3.click('#btnSyncMeta');
      const w3 = await p3.evaluate(() => BS.app.S.st.logWin);
      ok(w3.lead === 10 && w3.lag === 2 && w3.by.reb.lead === 5 && w3.by.mark.lead === 5, 'はじめて使うブラウザでは、ふつう 前 10 秒・後 2 秒、リバウンドと★は前 5 秒', w3);
      await p3.tap('#btnAdjust');
      await p3.waitForSelector('#adjRuler');
      await sleep(300);
      const L = await p3.evaluate(() => {
        const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
        return { iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, card: r('.modal-card'), ruler: r('#adjRuler'), pv: r('.adjpv'), ok: r('#adjOk'), font: getComputedStyle(document.querySelector('#adjRef')).fontSize };
      });
      ok(L.sw === L.iw && L.card.l >= 0 && L.card.r <= L.iw && L.card.b <= L.ih && L.ok.b <= L.ih, '小窓が画面に収まる（横にはみ出さない・「これで合わせる」が見える）', L);
      ok(L.ruler.w >= 300 && L.ruler.h >= 70 && L.pv.w >= 300 && L.pv.h >= 160, `目盛り ${Math.round(L.ruler.w)}×${Math.round(L.ruler.h)}・小さな画面 ${Math.round(L.pv.w)}×${Math.round(L.pv.h)}（指で扱える大きさ）`, L);
      ok(L.font === '16px', '見本の場面を選ぶ欄は 16px（iPhone で選ぶときに拡大されない）', L.font);
      await p3.evaluate(({ x, y }) => {
        const el = document.querySelector('#adjRuler');
        const ev = (type, cx) => el.dispatchEvent(new PointerEvent(type, { pointerId: 3, pointerType: 'touch', isPrimary: true, clientX: cx, clientY: y, bubbles: true, cancelable: true }));
        ev('pointerdown', x); for (let i = 1; i <= 8; i++) ev('pointermove', x + i * 8); ev('pointerup', x + 64);
      }, { x: L.ruler.l + L.ruler.w / 2, y: L.ruler.t + L.ruler.h / 2 });
      const d3 = await p3.evaluate(() => BS.app.S.adj.d);
      const e4 = Math.round((64 * 10 / Math.round(L.ruler.w)) * 10) / 10;
      ok(Math.abs(d3 - e4) < 0.11 && d3 > 1.5, `指で右へ 64px → 後ろへ ${d3} 秒`, { d3, e4 });
      await p3.tap('#adjOk');
      const a3 = await p3.evaluate(() => BS.app.S.st.sync.anchors);
      ok(a3.length === 1 && Math.abs(a3[0].v - (12 + d3)) < 1e-6, `「これで合わせる」：記録の 0:00 ＝ 動画の ${a3[0].v}`, a3);
      await p3.tap('#btnNote');
      await p3.waitForSelector('#noteOk');
      const NL = await p3.evaluate(() => {
        const r = (sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { l: b.left, r: b.right, b: b.bottom }; };
        return { iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, card: r('.modal-card'), ok: r('#noteOk'), stamps: document.querySelectorAll('.stamp').length, ta: getComputedStyle(document.querySelector('#noteText')).fontSize };
      });
      ok(NL.sw === NL.iw && NL.card.l >= 0 && NL.card.r <= NL.iw && NL.ok.b <= NL.ih && NL.stamps === 12 && NL.ta === '16px', 'スマホ：コメントの小窓が画面に収まる（スタンプ 12・文の欄は 16px）', NL);
      await p3.tap('.modal-foot .btn:not(.primary)');
      ok(errors3.length === 0, 'ページのエラーがない', errors3.slice(0, 3));
      await p3.close();
    }

    console.log('\n■ タップ記録で「撮った動画を見ながら記録」した試合（時刻は動画の時刻・💬 コメント入り）');
    {
      const ctx = { console, Math, Date, JSON };
      ctx.globalThis = ctx;
      vm.createContext(ctx);
      vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'basket-tap', 'js', 'core.js'), 'utf8'), ctx);
      const BT = ctx.BT, t0 = Date.UTC(2026, 10, 3, 9, 0, 0);
      const g = BT.newGame({ now: t0, tz: 540, teams: [{ name: '致遠館', players: [{ no: '7' }] }, { name: '城南', players: [{ no: '4' }] }] });
      Object.assign(g, { startedAt: t0, mode: 'video', src: { name: 'log120.mp4', size: fs.statSync(video).size, duration: 120, w: 640, h: 360 },
        notes: [{ id: 'n1', t: 30, dur: 5, text: 'ヘルプが遅い！', stamps: ['👍'], tags: ['ヘルプ'], at: t0 }, { id: 'n2', t: 61.5, dur: 3, text: '', stamps: ['👏'], tags: [], at: t0 }] });
      g.videos = [{ vid: 'file1', n: 1, startedAt: t0, duration: 120, name: 'log120.mp4', status: 'done', gone: true, file: true }];
      BT.addEvent(g, { t: 0, type: 'period', period: 1 });
      BT.addEvent(g, { t: 45, type: 'fg3', team: 1, no: '4' });
      BT.addEvent(g, { t: 5.2, type: 'fg2', team: 0, no: '7' });         // 動画を戻して記録したもの（時刻の順でなくてよい）
      const rvFile = path.join(WORK, 'review-log.json');
      fs.writeFileSync(rvFile, JSON.stringify(BT.exportData(g)));
      const p4 = await browser.newPage({ viewport: { width: 1280, height: 860 } });
      const errors4 = [];
      p4.on('pageerror', (e) => errors4.push(String(e)));
      await p4.goto(srv.url);
      await p4.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
      await p4.setInputFiles('#fileLog', rvFile);
      await p4.waitForFunction(() => BS.app.S.pendingLog);
      ok((await p4.textContent('#stepVideo')).includes('記録したときの動画（log120.mp4）を選んでください（時刻は自動で合わせます）'), '記録を先に読み込むと「記録したときの動画（log120.mp4）を選んでください」');
      await p4.setInputFiles('#fileVideo', video);
      await p4.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.S.st.sync, null, { timeout: 30000 });
      const sy = await p4.evaluate(() => BS.app.S.st.sync);
      ok(sy.how === 'camera' && sy.anchors.length === 1 && sy.anchors[0].t === 0 && sy.anchors[0].v === 0, '同じ動画を開くと、時刻は自動で合う（記録の時刻 ＝ 動画の時刻）', sy);
      const toast = await p4.textContent('#toasts');
      ok(toast.includes('動画を見ながら記録') && toast.includes('コメント・スタンプ 2件'), 'お知らせ：「動画を見ながら記録」した動画・記録のコメント 2 件も入れた', toast);
      const cl4 = await p4.evaluate(() => BS.app.logClips().map((c) => [c.t, c.at, c.label]));
      ok(cl4.length === 2 && cl4[0][1] === 5.2 && cl4[1][1] === 45, '場面：動画の 0:05.2（#7 2P成功）・0:45（#4 3P成功）', cl4);
      let nt = await p4.evaluate(() => BS.app.S.st.notes.map((n) => [n.t, n.dur, n.text, n.stamps.join(''), n.tags.join(',')]));
      ok(nt.length === 2 && nt[0][0] === 30 && nt[0][2] === 'ヘルプが遅い！' && nt[0][4] === 'ヘルプ' && nt[1][0] === 61.5 && nt[1][3] === '👏', '記録のコメント・スタンプが、この動画のコメントに入る（書き出す動画にも入る）', nt);
      await p4.setInputFiles('#fileLog', rvFile);
      await p4.waitForFunction(() => BS.app.S.st.sync && BS.app.S.st.sync.how === 'camera');
      await sleep(300);
      nt = await p4.evaluate(() => BS.app.S.st.notes.length);
      ok(nt === 2, '同じ記録をもう一度読み込んでも、コメントは2重にならない', nt);
      ok(errors4.length === 0, 'ページのエラーがない', errors4.slice(0, 3));
      await p4.close();
    }
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
