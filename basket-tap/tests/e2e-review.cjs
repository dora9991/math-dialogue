// 画面を通した確認：撮った動画を見ながら記録する（動画の時刻で記録・止める・コマ送り・「2P → 14番」・時刻あわせ・💬 コメント・続きから）
//   node basket-tap/tests/e2e-review.cjs [dev|built]
//     dev   … basket-tap/index.html（js/ と css/ を読む版）
//     built … public/basket-tap/index.html（1ファイル版。公開するもの）
//   SHOTS=フォルダ を付けると、画面の写真をそこに保存する
// テスト用の動画は ffmpeg で作る（120 秒・30 コマ/秒・VP9 の MP4 と、10 秒の短い動画）。作業フォルダは WORK（既定は一時フォルダの basket-tap-e2e/）。
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
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function makeVideo(name, sec) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(WORK, { recursive: true });
    try { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', String(sec), '-c:v', 'libvpx-vp9', '-b:v', '300k', '-deadline', 'realtime', '-cpu-used', '8', '-pix_fmt', 'yuv420p', file]); }
    catch (e) { await require('./tools/chrome-video.cjs').chromeVideo(chromium, file, sec); }      // ffmpeg がないとき：Chrome で作る（H.264）
  }
  return file;
}
async function openPage(browser, url, vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await stubCloud(ctx);
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#view').children.length);
  return { ctx, page, errors };
}
const game = (page) => page.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
const plays = (g) => g.events.filter((e) => e.type !== 'period');
const vt = (page) => page.evaluate(() => BT.app.S.rv.el.currentTime);
const ready = (page) => page.waitForFunction(() => BT.app.S.rv && BT.app.S.rv.ready, null, { timeout: 20000 });
async function pickFile(page, sel, file) {
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click(sel)]);
  await fc.setFiles(file);
}
/* 部品がはみ出していないか・重なっていないか */
async function layoutCheck(page) {
  return page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e && e.offsetParent !== null ? e.getBoundingClientRect() : null; };
    const vw = innerWidth, vh = innerHeight;
    const box = r('#rvBox'), stage = r('.stagewrap'), gbar = r('.gbar'), bar = r('.lbar'), ctl = r('.rvctl'), vid = r('#rvStage');
    const inside = (b) => b && b.left >= -0.5 && b.right <= vw + 0.5 && b.top >= -0.5 && b.bottom <= vh + 0.5;
    const apart = (a, b) => !a || !b || a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5;
    return {
      hscroll: document.documentElement.scrollWidth > vw + 1,
      inside: [box, stage, gbar, bar, ctl, vid].every(inside),
      apart: apart(box, stage) && apart(box, gbar) && apart(bar, box) && apart(stage, gbar),
      vid: vid && [Math.round(vid.width), Math.round(vid.height)], stageH: stage && Math.round(stage.height),
      mode: BT.app.S.L.inMode, side: document.querySelector('.live').classList.contains('rv-side'),
      pickFits: (() => { const p = document.querySelector('#pick'); return !p || p.hidden || p.scrollHeight <= p.clientHeight + 1; })()
    };
  });
}

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/basket-tap/index.html がありません。先に node basket-tap/build.mjs'); process.exit(1); }
  const VID = await makeVideo('rv120.mp4', 120), SHORT = await makeVideo('rv10.mp4', 10);
  const srv = await start(0, root);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版' : '開発版'}・撮った動画を見ながら記録する（スマホ 390×844）`);
    const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 844 });
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#btnNewReview'));
    ok(await page.isVisible('#btnNewReview'), 'ホームに「🎬 撮った動画を見ながら記録する」');
    await page.tap('#btnNewReview');
    ok((await page.textContent('.setup')).includes('撮った動画を見ながら記録します') && await page.isVisible('#btnToReview') && await page.isVisible('#btnToLive'), '試合の準備：動画を選ぶボタン（動画なしで記録することもできる）');
    await page.tap('#team0 [data-preset="4-18"]');
    await page.tap('#team1 [data-preset="4-15"]');
    await page.fill('#team0 .tname', '致遠館');
    await page.dispatchEvent('#team0 .tname', 'change');
    await pickFile(page, '#btnToReview', VID);
    await ready(page);
    let g = await game(page);
    ok(g.mode === 'video' && g.src.name === 'rv120.mp4' && Math.abs(g.src.duration - 120) < 0.2 && g.src.w === 640 && g.startedAt > 0, '動画を選ぶと、記録の画面（動画の名前・長さ・大きさを記録に入れる）', g.src);
    ok(g.videos.length === 1 && g.videos[0].file === true && g.videos[0].startedAt === g.startedAt && Math.abs(g.videos[0].duration - 120) < 0.2, 'videos に、その動画（startedAt が記録と同じ → バスケ得点クリップで時刻あわせなし）', g.videos);
    ok(await page.isHidden('#btnStart') && await page.isHidden('#rvCover') && await page.isVisible('#rvStage video'), 'スタートのボタンはない・映像が出る');
    let lay = await layoutCheck(page);
    ok(lay.mode === 'pick' && lay.pickFits && lay.inside && lay.apart && !lay.hscroll && lay.vid[0] >= 370, `スマホの縦：映像 ${lay.vid}・入力は「2P → 14番」（自動）・2チームとも入る・はみ出さない`, lay);
    await shot(page, 'review-phone');

    // 動画の時刻で記録する
    await page.evaluate(() => BT.app.rvSeekTo(12));
    ok((await page.textContent('#tval')) === '0:12.0', '時計は動画の時刻（0:12.0）', await page.textContent('#tval'));
    for (let i = 0; i < 3; i++) await page.tap('#rvNext');
    await sleep(200);
    ok(Math.abs(await vt(page) - 363.5 / 30) < 0.006, '「コマ▶」で1コマずつすすむ（3コマ → 12.12 秒）', await vt(page));
    await page.tap('#rvPrev');
    await sleep(150);
    ok(Math.abs(await vt(page) - 362.5 / 30) < 0.006, '「◀コマ」で1コマもどる', await vt(page));
    ok(await page.evaluate(() => BT.app.S.rv.el.paused), 'コマ送りのあいだは止まっている');
    await page.tap('#pick0 [data-ptype="fg2"]');
    ok((await page.textContent('#pickMsg')).includes('2P → 番号は？') && await page.evaluate(() => document.querySelector('#pick0').classList.contains('armed')), '「2P」を押すと「2P → 番号は？」（チームの枠が光る）');
    await shot(page, 'review-armed');
    await page.tap('#pick0 [data-pno="14"]');
    g = await game(page);
    ok(plays(g).length === 1 && plays(g)[0].type === 'fg2' && plays(g)[0].team === 0 && plays(g)[0].no === '14' && plays(g)[0].t === 12.1, '「2P」→「14」で、#14 の 2P を動画の時刻（12.1 秒）で記録', plays(g));
    ok((await page.textContent('#lastbar')).includes('2P成功') && (await page.textContent('#score0')) === '2', '画面の下に記録・得点 2');
    await page.tap('#pick1 [data-pno="7"]');
    ok((await page.textContent('#pickMsg')).includes('#7 → プレーは？'), '背番号から先でもよい（「7」→「プレーは？」）');
    await page.tap('#pick1 [data-ptype="fg3"]');
    g = await game(page);
    ok(plays(g)[1] && plays(g)[1].type === 'fg3' && plays(g)[1].team === 1 && plays(g)[1].no === '7', '「7」→「3P」で、相手 #7 の 3P', plays(g)[1]);
    await page.tap('#pick0 [data-ptype="ft"]');
    await page.tap('#pick0 [data-ptype="ft"]');
    ok(plays(await game(page)).length === 2 && await page.isHidden('#pickMsg'), '同じボタンをもう一度押すと、やめる');
    await page.tap('#pick0 [data-ptype="reb"]');
    await page.evaluate(() => BT.app.rvSeekTo(20));
    await page.tap('#pick0 [data-pno="5"]');
    g = await game(page);
    ok(plays(g)[2].type === 'reb' && plays(g)[2].no === '5' && plays(g)[2].t === 12.1, '時刻は、はじめに押したとき（「リバ」を押して動画を進めてから「5」でも 12.1 秒）', plays(g)[2]);
    await page.tap('#pick1 [data-pno=""]');
    await page.tap('#pick1 [data-ptype="fg2"]');
    g = await game(page);
    ok(plays(g)[3].team === 1 && plays(g)[3].no === null && plays(g)[3].t === 20, '「？」（番号なし）→「2P」で、チームの記録', plays(g)[3]);
    ok((await page.textContent('#score0')) === '2' && (await page.textContent('#score1')) === '5', 'いまの時刻（0:20）までの得点 2 − 5');
    await page.evaluate(() => BT.app.rvSeekTo(5));
    await sleep(250);
    ok((await page.textContent('#score0')) === '0' && (await page.textContent('#score1')) === '0', '動画を戻すと、その時刻までの得点（0:05 → 0 − 0）');

    // 再生・速さ・位置のバー
    await page.tap('#rvPlay');
    await sleep(900);
    const t1 = await vt(page);
    ok(t1 > 5.3 && (await page.textContent('#rvPlay')) === '⏸', '▶ で再生（時計も進む）', t1);
    await page.tap('#rvPlay');
    ok(await page.evaluate(() => BT.app.S.rv.el.paused), '⏸ で止まる');
    await page.tap('#rvRate');
    ok((await page.textContent('#rvRate')) === '×0.5' && await page.evaluate(() => BT.app.S.rv.el.playbackRate === 0.5), '速さ ×0.5');
    for (let i = 0; i < 3; i++) await page.tap('#rvRate');
    const sb = await page.locator('#rvSeek').boundingBox();
    await page.touchscreen.tap(sb.x + 8 + (sb.width - 16) * 0.5, sb.y + sb.height / 2);
    await sleep(250);
    ok(Math.abs(await vt(page) - 60) < 1, '位置のバーを押すと、その所へ（まん中 → 1:00）', await vt(page));
    await page.tap('#rvBack');
    await sleep(250);
    ok(Math.abs(await vt(page) - 55) < 1, '「−5」で 5 秒もどる', await vt(page));
    await page.tap('#rvStage');
    await sleep(500);
    ok(!(await page.evaluate(() => BT.app.S.rv.el.paused)), '映像を押しても再生');
    await page.tap('#rvStage');
    ok(await page.evaluate(() => BT.app.S.rv.el.paused), 'もう一度押すと止まる');

    // 時刻をぴったりに：いま記録したものを押す →「📍 映像で時刻を合わせる」→ コマ送り →「✓」
    await page.evaluate(() => BT.app.rvSeekTo(30));
    await page.tap('#pick0 [data-ptype="fg3"]');
    await page.tap('#pick0 [data-pno="9"]');
    let last = plays(await game(page)).pop();
    ok(last.t === 30, '0:30 で #9 の 3P');
    await page.tap('#lastEv');
    ok(await page.isVisible('#btnEvAdj') && await page.isVisible('#btnEvSee') && (await page.textContent('.sheet-card')).includes('動画の時刻'), '画面の下の記録を押すと「記録を直す」（📍 映像で時刻を合わせる・この場面を見る）');
    await page.tap('#btnEvAdj');
    await sleep(300);
    ok(await page.isHidden('#sheet') && Math.abs(await vt(page) - 30) < 0.05 && (await page.textContent('#lastbar')).includes('📍'), '📍：小窓を閉じて、動画をその記録の時刻に（画面の下に「✓ この時刻」）');
    for (let i = 0; i < 6; i++) await page.tap('#rvNext');
    await sleep(200);
    await page.tap('#btnAdjOk');
    last = plays(await game(page)).pop();
    ok(last.t === 30.2 && (await page.textContent('#lastbar')).includes('0:30.2'), 'コマ送りで合わせて「✓」→ 時刻が 30.2 秒に', last);
    await page.tap('#lastEv');
    await page.evaluate(() => BT.app.S.rv.el.currentTime = 31.5);
    await page.evaluate(() => BT.app.openEdit(BT.app.S.game.events[BT.app.S.game.events.length - 1].id));
    await page.tap('#btnEvNow');
    ok(plays(await game(page)).pop().t === 31.5, '「いまの映像の時刻にする」');
    await page.evaluate(() => BT.ui.closeSheet());

    // 💬 コメント・スタンプ
    await page.evaluate(() => BT.app.rvSeekTo(40));
    await page.tap('#rvNote');
    ok(await page.isVisible('.notesheet') && (await page.textContent('.notesheet')).includes('0:40.0'), '「💬」でコメントの小窓（いまの時刻 0:40.0）');
    await page.tap('.notesheet [data-stamp="👍"]');
    await page.tap('.notesheet [data-stamp="🔥"]');
    await page.fill('#noteText', 'ヘルプが遅い！ #ヘルプ');
    await page.tap('.notesheet [data-tag="リバウンド"]');
    await page.tap('.notesheet [data-dur="3"]');
    await page.tap('#btnNoteSave');
    g = await game(page);
    ok(g.notes.length === 1 && g.notes[0].t === 40 && g.notes[0].dur === 3 && g.notes[0].stamps.join('') === '👍🔥' && g.notes[0].text === 'ヘルプが遅い！ #ヘルプ' && g.notes[0].tags.join(',') === 'リバウンド,ヘルプ', 'コメントを保存（スタンプ・文・タグ・#ことば もタグに・3 秒）', g.notes);
    const ink = () => page.evaluate(() => { const c = document.querySelector('.rvnotes'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
    await page.evaluate(() => BT.app.rvSeekTo(41));
    await sleep(300);
    ok(await ink() > 500, '映像の上に、コメントとスタンプが出る（0:41）');
    await shot(page, 'review-note');
    await page.evaluate(() => BT.app.rvSeekTo(45));
    await sleep(300);
    ok(await ink() === 0, '出す長さ（3 秒）が過ぎると消える（0:45）');
    await page.tap('#btnMenu');
    ok((await page.textContent('.menu')).includes('コメントの一覧（1件）') && (await page.textContent('.menu')).includes('動画を選び直す') && !(await page.textContent('.menu')).includes('撮影しながら記録'), 'メニュー：コメントの一覧・動画を選び直す（撮影はない）');
    await page.click('.menu .mitem:has-text("コメントの一覧")');
    await page.tap('[data-note="n1"]');
    ok(await page.isVisible('#btnNoteDel') && Math.abs(await vt(page) - 40) < 0.1, '一覧のコメントを押すと、その場面へ・直す小窓');
    await page.tap('#btnNoteDel');
    ok((await game(page)).notes.length === 0, '「🗑 消す」で消せる');

    // 選手ごとの行に切りかえる
    await page.evaluate(() => BT.app.rvSeekTo(50));
    await page.tap('#rvInput');
    lay = await layoutCheck(page);
    ok(lay.mode === 'rows' && await page.isVisible('#panel0') && await page.isHidden('#pick'), '「⇄」で選手ごとの行に（スマホは縦にすべらせて選ぶ）', lay);
    await page.locator('#panel0 .prow[data-no="4"] [data-type="fg2"]').tap();
    last = plays(await game(page)).pop();
    ok(last.no === '4' && last.type === 'fg2' && last.t === 50, '行のボタンでも、動画の時刻で記録（#4 の 2P・0:50）', last);
    await page.tap('#rvInput');
    ok((await layoutCheck(page)).mode === 'pick', 'もう一度「⇄」で「2P → 14番」');

    // キーボード（iPad のキーボード・パソコン）
    await page.keyboard.press('Space');
    await sleep(400);
    ok(!(await page.evaluate(() => BT.app.S.rv.el.paused)), 'スペースで再生');
    await page.keyboard.press('Space');
    const tk = await vt(page);
    await page.keyboard.press('.');
    await sleep(200);
    ok(await vt(page) > tk && await vt(page) - tk < 0.07, '「.」で1コマ');

    // ピリオド：動画を始まりまで動かしてから
    await page.evaluate(() => BT.app.rvSeekTo(70));
    await page.tap('#btnPeriod');
    ok((await page.textContent('.periodbox')).includes('動画を、次のピリオドが始まる所'), 'ピリオドの小窓：動画をその始まりまで動かしてから');
    await page.tap('#btnNextPeriod');
    g = await game(page);
    ok(g.events.some((e) => e.type === 'period' && e.period === 2 && e.t === 70) && (await page.textContent('#btnPeriod')) === '2Q', '2Q の始まり＝動画の 1:10');
    await page.evaluate(() => BT.app.rvSeekTo(20));
    await sleep(250);
    ok((await page.textContent('#btnPeriod')) === '1Q', '動画を戻すと、その時刻のピリオド（1Q）');

    // 書き出す
    await page.tap('#btnMenu');
    await page.click('.menu .mitem:has-text("書き出す")');
    ok((await page.textContent('.export')).includes('記録のファイル（JSON）') && !(await page.textContent('.export')).includes('バスケ得点クリップ'), '書き出す：集計・一覧の CSV と記録のファイル（別のアプリへの案内はない）');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExpJson')]);
    const ex = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    ok(ex.mode === 'video' && ex.src.name === 'rv120.mp4' && ex.videos[0].file && ex.videos[0].startedAt === ex.startedAt && ex.events.filter((e) => e.type !== 'period').length === 6, '記録のファイル（JSON）：mode・src・videos・記録 6 件', { mode: ex.mode, n: ex.events.length });
    await page.evaluate(() => BT.ui.closeSheet());

    // 続きから（ページを開き直す）：動画をもう一度選ぶ
    await page.evaluate(() => BT.app.rvSeekTo(33.3));
    await page.evaluate(() => { BT.app.S.rv.el.pause(); });
    await sleep(200);
    await page.reload();
    await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#rvCover'));
    ok(await page.isVisible('#btnRvPick') && (await page.textContent('#rvCover')).includes('rv120.mp4') && (await page.textContent('#rvCover')).includes('0:33 まで見ました'), '開き直すと記録の画面のまま・「🎬 動画を選んで、続きを記録する」（前の動画の名前・見ていた所）');
    await page.tap('#pick0 [data-ptype="fg2"]');
    ok((await page.textContent('#lastbar')).includes('先に動画を選んでください') && plays(await game(page)).length === 6, '動画を選ぶまでは記録しない', await page.textContent('#lastbar'));
    await pickFile(page, '#btnRvPick', SHORT);
    await ready(page);
    await sleep(200);
    ok((await page.textContent('#lastbar')).includes('長さが違います') && (await game(page)).src.name === 'rv120.mp4', '違う長さの動画を選ぶと知らせる（記録の動画の情報は変えない）');
    await page.tap('#btnMenu');
    await pickFile(page, '.menu .mitem:has-text("動画を選び直す")', VID);
    await ready(page);
    await sleep(300);
    ok(Math.abs(await vt(page) - 33.3) < 0.1, '同じ動画を選び直すと、見ていた所（0:33.3）から', await vt(page));
    await shot(page, 'review-resume');

    // 試合の一覧
    await page.tap('#btnMenu');
    await page.click('.menu .mitem:has-text("記録を終える")');
    await page.click('.sheet-foot .btn.primary');
    await sleep(300);
    ok(await page.evaluate(() => BT.app.S.view) === 'game' && await page.isVisible('.hubstats .stats') && await page.isVisible('.hubexport #btnExpBox'), '「記録を終える」で試合のページ（集計・書き出す）');
    ok((await page.textContent('#hubTrim')).includes('場面を見る・動画にする'), '試合のページに「🎬 場面を見る・動画にする」（動画は選び直さない）');
    // そのまま場面を切り出す：記録した動画のまま・時刻あわせなし
    await page.tap('#hubTrim');
    await page.waitForFunction(() => BT.trim.state && BT.trim.state.media && BT.trim.state.media.ready && document.querySelector('#tSyncOk'), null, { timeout: 15000 });
    {
      const r = await page.evaluate(() => ({ how: BT.trim.state.st.how, anchors: BT.trim.state.st.anchors, n: document.querySelectorAll('#tList .tclip').length, plays: BT.app.S.game.events.filter((e) => e.type !== 'period').length, name: BT.trim.state.file.name }));
      ok(r.how === 'review' && JSON.stringify(r.anchors) === '[{"t":0,"v":0}]' && r.name === 'rv120.mp4', '✂️ 場面を切り出す：記録した動画のまま、時刻は自動（記録の時刻 ＝ 動画の時刻）', r);
      ok(r.n === r.plays && r.n > 0, '記録した場面が全部並ぶ', r);
    }
    await page.tap('#tReel');
    await sleep(800);
    ok(await page.isVisible('#tReelBar') && await page.evaluate(() => !BT.trim.state.media.paused), '「▶ 続けて再生」で場面を再生');
    await shot(page, 'review-trim');
    await page.tap('#tDone');
    ok(await page.evaluate(() => BT.app.S.view) === 'game' && await page.evaluate(() => BT.app.S.game.trimmed === true), '「✓ 終わる」で試合のページへ（切り出しずみ）');
    await page.tap('#hubHome2');
    ok((await page.textContent('#gameList')).includes('🎬 動画を見ながら記録') && await page.evaluate(() => !BT.app.S.rv), 'ホームの一覧に「🎬 動画を見ながら記録」・動画は外す');
    ok(errors.length === 0, 'ページのエラーがない', errors.slice(0, 3));
    await ctx.close();

    // いろいろな画面の大きさ
    console.log('\n■ 画面の大きさ（スマホの横・小さなスマホ・iPad の縦と横）');
    for (const vp of [{ n: 'スマホの横', width: 844, height: 390, side: true }, { n: '小さなスマホ', width: 375, height: 667 }, { n: 'iPad の縦', width: 820, height: 1180, rows: true }, { n: 'iPad の横', width: 1180, height: 820, side: true, rows: true }]) {
      const P = await openPage(browser, srv.url, { width: vp.width, height: vp.height });
      await P.page.evaluate(() => localStorage.clear());
      await P.page.reload();
      await P.page.waitForFunction(() => window.BT && BT.app && document.querySelector('#btnNewReview'));
      await P.page.tap('#btnNewReview');
      await P.page.tap('#team0 [data-preset="4-18"]');
      await P.page.tap('#team1 [data-preset="4-15"]');
      await pickFile(P.page, '#btnToReview', VID);
      await ready(P.page);
      await sleep(200);
      const L2 = await layoutCheck(P.page);
      ok(L2.inside && L2.apart && !L2.hscroll && L2.side === !!vp.side && (vp.rows ? L2.mode === 'rows' : L2.mode === 'pick'),
        `${vp.n}（${vp.width}×${vp.height}）：映像 ${L2.vid}・${L2.side ? '映像は左の列' : '映像は上'}・入力は${L2.mode === 'rows' ? '選手ごとの行' : '「2P → 14番」'}${L2.pickFits ? '' : '（入りきらない分は縦にすべらせる）'}・はみ出さない`, L2);
      await shot(P.page, `review-${vp.width}x${vp.height}`);
      ok(P.errors.length === 0, `${vp.n}：ページのエラーがない`, P.errors.slice(0, 2));
      await P.ctx.close();
    }
  } catch (err) {
    fail++;
    console.log('  FAIL 途中で止まりました:', err && err.stack || err);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
