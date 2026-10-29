// 撮影しながら記録する（この端末のカメラ）の確認：node sports-tap/tests/e2e-camera.cjs [dev|built]
//   dev   … リポジトリの sports-tap/・basket-clips/（js/ と css/ を読む版）
//   built … public/ の1ファイル版（公開と同じ並び /sports-tap/・/basket-clips/。先に両方の build.mjs）
// カメラは「その瞬間の時刻（Date.now）を白黒の模様で描いた映像」に置きかえる（getUserMedia を差しかえ。バスケ タップ記録の e2e-camera と同じ）。
// 録れた動画のコマから模様を読んで、「動画の t 秒に映っているのは、録画を始めた時刻 ＋ t 秒の瞬間か」を確かめる（＝記録と動画の時刻が合っているか）。
// そのあと「🎬 場面を切り出す」で、バスケ得点クリップが時刻あわせなしで開き、記録した場面が並ぶことも確かめる。
// 8種目すべてで、撮影の映像（ワイプ）が記録のボタンに重ならないことも見る。
if (!process.env.LANG) process.env.LANG = 'C.UTF-8';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'stap-cam-'));
const SHOTS = process.env.SHOTS || '';
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };
const ffprobe = (f) => { try { return JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name', '-of', 'json', f]).toString()); } catch (e) { return null; } };
const topBoxes = (f) => { const d = fs.readFileSync(f); const out = []; let p = 0; while (p + 8 <= d.length) { let sz = d.readUInt32BE(p); const ty = d.toString('latin1', p + 4, p + 8); if (sz === 1) sz = Number(d.readBigUInt64BE(p + 8)); if (sz < 8) break; out.push(ty); p += sz; } return out; };

/* カメラの差しかえ：640×360 に、時刻（ミリ秒の下 32 ビット）を 8×4 のます目の白黒で描く。音は発振器 */
function fakeCamera() {
  const md = navigator.mediaDevices;
  if (!md) return;
  md.getUserMedia = async (c) => {
    const cv = document.createElement('canvas');
    cv.width = 640; cv.height = 360;
    const g = cv.getContext('2d');
    const draw = () => {
      const t = Date.now() % 4294967296;
      for (let i = 0; i < 32; i++) { g.fillStyle = Math.floor(t / 2 ** i) % 2 ? '#ffffff' : '#000000'; g.fillRect((i % 8) * 80, Math.floor(i / 8) * 90, 80, 90); }
    };
    draw();
    const timer = setInterval(draw, 8);
    const st = cv.captureStream(30);
    if (c && c.audio) {
      try { const ac = new AudioContext(); const o = ac.createOscillator(); const d = ac.createMediaStreamDestination(); o.connect(d); o.start(); d.stream.getAudioTracks().forEach((t) => st.addTrack(t)); } catch (e) { /* 音なし */ }
    }
    st.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer));
    return st;
  };
}
/* 動画（vid）の t 秒のコマに描かれた時刻と、録画を始めた時刻 ＋ t のずれ（ミリ秒） */
async function measure(page, vid, times) {
  return page.evaluate(async ([vid, times]) => {
    const f = await ST.vstore.file(vid);
    const meta = await ST.vstore.getVideo(vid);
    const v = document.createElement('video');
    v.muted = true; v.src = URL.createObjectURL(f);
    await new Promise((r) => { v.onloadeddata = r; v.onerror = r; setTimeout(r, 5000); });
    const cv = document.createElement('canvas'); cv.width = 640; cv.height = 360;
    const g = cv.getContext('2d', { willReadFrequently: true });
    const out = [];
    for (const t of times) {
      await new Promise((r) => { const done = () => { v.removeEventListener('seeked', done); r(); }; v.addEventListener('seeked', done); v.currentTime = t; setTimeout(done, 3000); });
      await new Promise((r) => setTimeout(r, 60));
      g.drawImage(v, 0, 0, 640, 360);
      let low = 0;
      for (let i = 0; i < 32; i++) { const px = g.getImageData((i % 8) * 80 + 40, Math.floor(i / 8) * 90 + 45, 1, 1).data; if ((px[0] + px[1] + px[2]) / 3 > 127) low += 2 ** i; }
      const expect = meta.startedAt + v.currentTime * 1000;
      const hi = Math.floor(expect / 4294967296);
      const drawn = [hi - 1, hi, hi + 1].map((k) => k * 4294967296 + low).reduce((a, b) => (Math.abs(b - expect) < Math.abs(a - expect) ? b : a));
      out.push({ t: +v.currentTime.toFixed(3), err: Math.round(drawn - expect) });
    }
    return { duration: v.duration, out };
  }, [vid, times]);
}
/* 記録のボタン（ワイプの中のものは除く）が、ワイプに重ならず、画面の横からはみ出さないか */
async function overlapWipe(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    const wipe = document.querySelector('#wipe');
    const wr = wipe && !wipe.hidden ? wipe.querySelector('#wipeBox').getBoundingClientRect() : null;
    const bad = [];
    document.querySelectorAll('.live button').forEach((b) => {
      if (b.closest('#wipe') || b.closest('#cover') || b.offsetParent === null) return;
      const r = b.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // （縦にすべる入れ物の中で、いまは見えていないボタンは見ない）
      const sc = b.closest('.roster, .swlanes, .sw-lanes, .bb-res, .tpanels, .stagewrap');
      if (sc) { const s = sc.getBoundingClientRect(); if (r.bottom < s.top || r.top > s.bottom) return; }
      if (r.right > W + 1 || r.left < -1 || r.bottom > H + 1) bad.push(['はみ出し', b.id || b.className, Math.round(r.left), Math.round(r.right), Math.round(r.bottom)]);
      // 記録のボタンが、ワイプのせいで細くなりすぎていないか（チームの帯の小さなボタンは除く）
      if (b.closest('.stagewrap') && !b.closest('.thead, .tc-head, .tpanel-head') && (r.width < 24 || r.height < 26)) bad.push(['小さすぎる', b.id || b.className.slice(0, 30), Math.round(r.width), Math.round(r.height)]);
      if (wr && r.left < wr.right - 1 && r.right > wr.left + 1 && r.top < wr.bottom - 1 && r.bottom > wr.top + 1) bad.push(['ワイプに重なる', b.id || b.className.slice(0, 30), Math.round(r.left), Math.round(r.top)]);
    });
    return bad;
  });
}
async function barOverlap(page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.lbar > *')).filter((e) => e.offsetParent !== null);
    const bad = [];
    for (let i = 1; i < els.length; i++) { const a = els[i - 1].getBoundingClientRect(), b = els[i].getBoundingClientRect(); if (b.left < a.right - 1) bad.push([els[i - 1].className, els[i].className, Math.round(a.right - b.left)]); }
    const last = els[els.length - 1];
    if (last && last.getBoundingClientRect().right > innerWidth + 1) bad.push(['right edge', Math.round(last.getBoundingClientRect().right - innerWidth)]);
    return bad;
  });
}
async function newContext(browser, vp) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: vp.width < 900, permissions: ['camera', 'microphone'], acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await ctx.addInitScript(fakeCamera);
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  return { ctx, page, errors };
}
/* 種目の試合を、準備の画面を通さずに作って開く（名簿つき） */
async function openGame(page, sport) {
  return page.evaluate((sport) => {
    const players = (txt) => ST.parseNumbers(txt).map((no) => ({ no, name: no === '10' ? 'たけし' : '' }));
    const teams = sport === 'tennis' ? [{ name: '致遠館', players: [{ no: '1', name: 'たける' }] }, { name: '城南', players: [{ no: '1', name: 'ゆうと' }] }]
      : sport === 'baseball' ? [{ name: '致遠館', players: players('1-9') }, { name: '城南', players: players('1-9') }]
        : sport === 'swim' ? [{}, {}] : [{ name: '致遠館', players: players('1-12') }, { name: '城南' }];
    const g = ST.newGame({ sport, teams });
    const sp = ST.SPORTS[sport];
    if (sp.fromDraft) { try { sp.fromDraft(g, { teams: g.teams.map((t) => Object.assign({ order: t.players.map((p) => p.no), pitcher: t.players[0] ? t.players[0].no : null }, t)), opts: g.opts, serve: { side: 0, p: ['1', '1'] } }); } catch (e) { /* 種目による */ } }
    ST.store.saveGame(g);
    ST.app.resume(g.id);
    return g.id;
  }, sport);
}

(async () => {
  const pub = MODE === 'built' ? path.join(__dirname, '..', '..', 'public') : path.join(__dirname, '..', '..');
  for (const f of ['sports-tap/index.html', 'basket-clips/index.html']) if (!fs.existsSync(path.join(pub, f))) { console.log(`${f} がありません（built は先に build.mjs）`); process.exit(1); }
  const srv = await start(0, pub);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'], env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  try {
    /* ========== サッカー（iPad 横）：撮影 → 記録 → 試合を終える → 動画 → 場面を切り出す ========== */
    let { ctx, page, errors } = await newContext(browser, { width: 1180, height: 820 });
    await page.goto(srv.url + 'sports-tap/?s=soccer');
    await page.waitForFunction(() => window.ST && ST.app && ST.camera && ST.livecam);
    section('撮影の準備（スタートの前）');
    const gid = await openGame(page, 'soccer');
    ok(await page.$('#btnCamOn'), 'スタート前の札に「📹 撮影しながら記録する」');
    await page.click('#btnCamOn');
    await page.waitForSelector('.camsheet .campv');
    await page.waitForFunction(() => { const v = document.querySelector('.campv'); return v && v.readyState >= 2 && v.videoWidth > 0; }, null, { timeout: 5000 });
    ok(await page.isVisible('#btnCamBoth') && (await page.textContent('#camStat')).includes('準備'), '撮影の画面：大きな映像・「録画と記録を同時にスタート」');
    ok(/ピッチ全体/.test(await page.textContent('#camOrient')), '撮る向き：「横向き（ピッチ全体）」（サッカーの言葉）');
    await page.waitForFunction(() => !document.querySelector('#wipe').hidden, null, { timeout: 4000 }).catch(() => {});
    ok(await page.evaluate(() => !document.querySelector('#wipe').hidden && document.querySelector('#btnCam').hidden && document.querySelector('.live').classList.contains('cam-side')), '記録の画面に、カメラの映像（ワイプ「中」。iPad 横は右の列）');
    await shot(page, 'c1-sheet');
    await page.click('.sheet-card header .x');
    ok(/録画と記録をスタート/.test(await page.textContent('#btnStartBig')) && /カメラの準備OK/.test(await page.textContent('#cover')), 'スタート前の札：「● 録画と記録をスタート」・カメラの準備OK');
    ok((await overlapWipe(page)).length === 0, 'ワイプが記録のボタンに重ならない（iPad 横・サッカー）', await overlapWipe(page));

    section('録画と記録を同時にスタート → 記録');
    await page.click('#btnStartBig');
    await page.waitForFunction(() => ST.app.cam().isRec() && (ST.app.S.game.videos || []).length === 1, null, { timeout: 5000 });
    let g = await page.evaluate(() => JSON.parse(JSON.stringify(ST.app.S.game)));
    ok(!!g.startedAt && g.videos && g.videos.length === 1, '記録の時計と録画が始まる（動画1）');
    const diff = g.videos[0].startedAt - g.startedAt;
    ok(Math.abs(diff) < 400, `録画の始まりと記録のスタートの差 ${diff}ms（0.4 秒以内）`);
    await sleep(1500);
    await page.click('#panel0 .prow[data-no="10"] .pb[data-type="goal"]');
    await sleep(1200);
    await page.click('#panel1 .prow .pb[data-type="shot"]');
    await sleep(800);
    await page.click('#panel0 .trow .pb[data-type="ck"]');
    ok(await page.evaluate(() => document.querySelector('#wipeBox').classList.contains('rec') && /録画/.test(document.querySelector('#wipeTag').textContent)), 'ワイプが赤いふち・「● 録画」と時間');
    ok((await overlapWipe(page)).length === 0, '録画中も、ワイプが記録のボタンに重ならない', await overlapWipe(page));
    await shot(page, 'c2-live-rec');
    // ワイプの大きさ
    await page.click('#btnWipeBig');
    ok(await page.evaluate(() => ST.app.S.prefs.cam.wipe === 'l' && !document.querySelector('#wipe').hidden), 'ワイプ「＋」で「大」');
    ok((await overlapWipe(page)).length === 0, '「大」でも重ならない', await overlapWipe(page));
    const wl = await page.evaluate(() => document.querySelector('#wipeBox').getBoundingClientRect().width);
    await page.click('#btnWipeSmall');
    await page.click('#btnWipeSmall');
    ok(await page.evaluate(() => ST.app.S.prefs.cam.wipe === 's' && document.querySelector('#wipe').hidden && !document.querySelector('#btnCam').hidden && document.querySelector('#btnCam').classList.contains('rec')), '「－」2回で「小」：上の帯の小さな映像（赤いふち）', { wl });
    ok((await barOverlap(page)).length === 0, '上の帯が重ならない（小さな映像つき）', await barOverlap(page));
    await page.click('#btnCam');
    await page.waitForSelector('.camsheet');
    await page.click('[data-wipe="m"]');
    await page.click('.sheet-card header .x');
    ok(await page.evaluate(() => !document.querySelector('#wipe').hidden), '撮影の画面の「ワイプの大きさ：中」で戻る');

    section('画面を離れて戻る → 新しい動画');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(1700);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => ST.app.S.game.videos.length === 2 && ST.app.cam().isRec(), null, { timeout: 8000 }).catch(() => {});
    ok(await page.evaluate(() => ST.app.S.game.videos.length === 2 && ST.app.cam().isRec()), '戻ると、ここから動画2として録画を続ける');
    await sleep(1500);
    await page.click('#panel0 .prow[data-no="7"] .pb[data-type="goal"]');
    await sleep(1000);

    section('試合を終える → 動画が仕上がる');
    await page.click('#btnMenu');
    await page.click('.mitem:has-text("試合を終える")');
    await page.click('.sheet-foot .btn.primary');
    await page.waitForFunction(() => !ST.app.cam().isOn() && ST.app.S.game.videos.every((v) => v.status === 'done'), null, { timeout: 15000 });
    g = await page.evaluate(() => JSON.parse(JSON.stringify(ST.app.S.game)));
    ok(g.endedAt && g.videos.length === 2 && g.videos.every((v) => v.duration > 0.5 && v.mime === 'video/mp4'), '2本の動画（MP4）が仕上がる', g.videos.map((v) => [v.n, v.duration, v.mime]));
    await page.click('.sheet-foot .btn.primary').catch(() => {});      // 集計をとじる
    ok((await page.$$('#cover .vitem')).length === 2, '「試合終了」の札に、動画ごとの「🎬 場面を切り出す」「⬇ 保存」「🗑」');
    await shot(page, 'c3-end');
    // 時刻のずれ（動画1：1・2・3 秒のコマ）
    const m = await measure(page, g.videos[0].vid, [1, 2, 3]);
    const errs = m.out.map((x) => x.err);
    ok(errs.every((e) => Math.abs(e) <= 150), `動画1：コマの時刻と「録画を始めた時刻＋t」のずれ ${errs.join('・')}ms（±0.15 秒以内）`);
    // 保存した MP4
    const [d] = await Promise.all([page.waitForEvent('download'), page.click(`#cover [data-savevid="${g.videos[0].vid}"]`)]);
    const mp4 = path.join(WORK, 'v1.mp4');
    await d.saveAs(mp4);
    const pr = ffprobe(mp4);
    ok(/^サッカー記録_.*_動画1\.mp4$/.test(d.suggestedFilename()) && pr && pr.streams.some((s) => s.codec_type === 'video') && !topBoxes(mp4).includes('moof'), '⬇ 保存：ふつうの MP4（ffprobe で読める・moof なし）', { name: d.suggestedFilename(), boxes: topBoxes(mp4) });
    // 書き出す JSON：動画の情報と、記録ごとの呼び名
    const ex = await page.evaluate(() => ST.exportData(ST.app.S.game));
    const goal = ex.events.find((e) => e.type === 'goal' && e.no === '10');
    ok(ex.videos.length === 2 && ex.videos[0].startedAt > 0 && goal && /#10 たけし ゴール/.test(goal.text) && /^前半 \d:\d\d$/.test(goal.when), '書き出す JSON：動画（録画を始めた時刻）・記録の呼び名「致遠館 #10 たけし ゴール」・場面「前半 0:01」', { text: goal && goal.text, when: goal && goal.when });
    ok(ex.types.period.scene === false && ex.types.goal.scene === true, '種類に「場面として切り出すか」（前半の始まりは入れない）');

    section('🎬 場面を切り出す（バスケ得点クリップ）');
    await Promise.all([page.waitForURL(/basket-clips/), page.click(`#cover [data-clip="${g.videos[0].vid}"]`)]);
    await page.waitForFunction(() => window.BS && BS.app && BS.app.S.st && BS.app.S.st.log && BS.app.S.st.sync, null, { timeout: 15000 });
    const cs = await page.evaluate(() => ({ how: BS.app.S.st.sync.how, app: BS.app.S.st.log.app, sport: BS.app.S.st.log.sportName, groups: BS.taplog.groupsOf(BS.app.S.st.log).map((x) => x.label), clips: BS.app.logClips ? BS.app.logClips().length : null, card: document.querySelector('#logCard') && document.querySelector('#logCard').textContent }));
    ok(cs.how === 'camera' && cs.app === 'スポーツ タップ記録' && cs.sport === 'サッカー', '時刻あわせなし（撮影しながら記録した動画）でサッカーの記録が開く', cs);
    ok(cs.groups.join('/') === 'ゴール/シュート/コーナーキック' && /2 − 0/.test(cs.card), '絞り込み：ゴール・シュート・コーナーキック（記録にある種類）・得点 2 − 0', cs);
    const clipText = await page.evaluate(() => Array.from(document.querySelectorAll('.clip.logclip')).map((e) => e.textContent).join(' | '));
    ok(/#10 たけし ゴール/.test(clipText) && /前半/.test(clipText), '場面の一覧に「#10 たけし ゴール」「前半 0:01」', clipText.slice(0, 200));
    await shot(page, 'c4-clips');
    ok(errors.length === 0, 'ページのエラーなし（サッカー → バスケ得点クリップ）', errors);
    await ctx.close();

    /* ========== 8種目：ワイプが記録のボタンに重ならない ========== */
    section('8種目：撮影の映像（ワイプ）と記録のボタン');
    const sports = ['soccer', 'volley', 'futsal', 'handball', 'tennis', 'baseball', 'rugby', 'swim'];
    for (const [label, vp] of [['スマホ縦', { width: 390, height: 664 }], ['iPad 横', { width: 1180, height: 820 }]]) {
      for (const sport of sports) {
        ({ ctx, page, errors } = await newContext(browser, vp));
        await page.goto(srv.url + `sports-tap/?s=${sport}`);
        await page.waitForFunction(() => window.ST && ST.app && ST.camera);
        await openGame(page, sport);
        await page.click('#btnCamOn');
        await page.waitForSelector('.camsheet');
        await page.click('#btnCamBoth');
        await page.waitForFunction(() => ST.app.cam().isRec() && !!ST.app.S.game.startedAt, null, { timeout: 6000 }).catch(() => {});
        await sleep(400);
        const rec = await page.evaluate(() => ST.app.cam().isRec());
        const res = [];
        for (const wz of ['m', 'l', 's']) {
          await page.evaluate((wz) => { ST.app.cam().setWipe(wz); }, wz);
          await sleep(150);
          res.push([wz, await overlapWipe(page), await barOverlap(page)]);
        }
        const bad = res.filter(([, a, b]) => a.length || b.length);
        ok(rec && bad.length === 0, `${label}・${sport}：録画しながら、ワイプ（中・大・小）が記録のボタンに重ならない・上の帯もはみ出さない`, bad.map(([wz, a, b]) => [wz, a.slice(0, 3), b]));
        if (sport === 'volley' || sport === 'baseball' || sport === 'swim' || sport === 'tennis') { await page.evaluate(() => ST.app.cam().setWipe('m')); await sleep(150); await shot(page, `c5-${vp.width}-${sport}`); }
        await page.evaluate(() => ST.app.cam().close());
        ok(errors.length === 0, `${label}・${sport}：ページのエラーなし`, errors);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    await srv.close();
    fs.rmSync(WORK, { recursive: true, force: true });
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
