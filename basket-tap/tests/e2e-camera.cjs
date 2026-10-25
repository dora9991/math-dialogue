// 撮影しながら記録する（この端末のカメラ）の確認：node basket-tap/tests/e2e-camera.cjs
//   public/ の1ファイル版（basket-tap と basket-clips）を、公開と同じ並び（/basket-tap/・/basket-clips/）で開いて確かめる。
//   先に node basket-tap/build.mjs と node basket-clips/build.mjs を実行しておくこと。
// カメラは「その瞬間の時刻（Date.now）を白黒の模様で描いた映像」に置きかえる（getUserMedia を差しかえ）。
// 録れた動画のコマから模様を読んで、「動画の t 秒に映っているのは、録画を始めた時刻 ＋ t 秒の瞬間か」を確かめる
// （＝記録と動画の時刻が、本当に合っているか）。
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'btap-cam-'));
const SHOTS = process.env.SHOTS || '';
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };
const ffprobe = (f) => { try { return JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name', '-of', 'json', f]).toString()); } catch (e) { return null; } };
const topBoxes = (f) => { const d = fs.readFileSync(f); const out = []; let p = 0; while (p + 8 <= d.length) { let sz = d.readUInt32BE(p); const ty = d.toString('latin1', p + 4, p + 8); if (sz === 1) sz = Number(d.readBigUInt64BE(p + 8)); if (sz < 8) break; out.push(ty); p += sz; } return out; };

/* カメラの差しかえ：640×360 に、時刻（ミリ秒の下 32 ビット）を 8×4 のます目の白黒で描く。音は発振器。
   window.__camPortrait = 'ccw' | 'cw' のときは、画面の向きのロックをしたまま iPhone を横に倒したときと同じく、
   縦長（360×640）で、中身が横倒しの映像にする（'ccw'：上側を左に倒した＝絵の上が右／'cw'：上側を右に＝絵の上が左）。
   window.__camResize(w, h) で、途中で大きさを変えられる（端末を回したときの代わり） */
function fakeCamera() {
  window.__camDeny = false;
  const md = navigator.mediaDevices;
  if (!md) return;
  md.getUserMedia = async (c) => {
    if (window.__camDeny) { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; }
    const cv = document.createElement('canvas');
    const port = !!window.__camPortrait;
    cv.width = port ? 360 : 640; cv.height = port ? 640 : 360;
    const g = cv.getContext('2d');
    const draw = () => {
      const t = Date.now() % 4294967296;
      g.save();
      if (cv.width < cv.height) {
        if ((window.__camPortrait || 'ccw') === 'ccw') { g.translate(cv.width, 0); g.rotate(Math.PI / 2); } else { g.translate(0, cv.height); g.rotate(-Math.PI / 2); }
      }
      for (let i = 0; i < 32; i++) { g.fillStyle = Math.floor(t / 2 ** i) % 2 ? '#ffffff' : '#000000'; g.fillRect((i % 8) * 80, Math.floor(i / 8) * 90, 80, 90); }
      g.restore();
    };
    window.__camResize = (w, h) => { cv.width = w; cv.height = h; draw(); };
    draw();
    const timer = setInterval(draw, 8);
    const st = cv.captureStream(30);
    if (c && c.audio) {
      try { const ac = new AudioContext(); const o = ac.createOscillator(); const d = ac.createMediaStreamDestination(); o.connect(d); o.start(); d.stream.getAudioTracks().forEach((t) => st.addTrack(t)); } catch (e) { /* 音なし */ }
    }
    st.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer));
    window.__camStream = st;
    return st;
  };
}
/* 動画（vid）の t 秒のコマに描かれた時刻（ミリ秒）と、録画を始めた時刻 ＋ t のずれ（ミリ秒）を測る */
async function measure(page, vid, times) {
  return page.evaluate(async ([vid, times]) => {
    const f = await BT.vstore.file(vid);
    const meta = await BT.vstore.getVideo(vid);
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
      // 下 32 ビットから、予想にいちばん近い時刻を戻す
      const hi = Math.floor(expect / 4294967296);
      const cands = [hi - 1, hi, hi + 1].map((k) => k * 4294967296 + low);
      const drawn = cands.reduce((a, b) => (Math.abs(b - expect) < Math.abs(a - expect) ? b : a));
      out.push({ t: +v.currentTime.toFixed(3), err: Math.round(drawn - expect) });
    }
    return { duration: v.duration, out };
  }, [vid, times]);
}

(async () => {
  const pub = path.join(__dirname, '..', '..', 'public');
  for (const f of ['basket-tap/index.html', 'basket-clips/index.html']) if (!fs.existsSync(path.join(pub, f))) { console.log(`public/${f} がありません。先に build.mjs を実行してください`); process.exit(1); }
  const srv = await start(0, pub);
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'], env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, permissions: ['camera', 'microphone'], acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await ctx.addInitScript(fakeCamera);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('dialog', (d) => d.accept());
    await page.goto(srv.url + 'basket-tap/');
    await page.waitForFunction(() => window.BT && BT.app && BT.camera);

    console.log('\n■ 撮影の準備（スタートの前）');
    await page.evaluate(() => { const g = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no, name: no === '7' ? 'たけし' : '' })) }, { name: '城南' }] }); BT.store.saveGame(g); BT.app.resume(g.id); });
    ok(await page.$('#btnCamOn'), 'スタート前の札に「📹 撮影しながら記録する」');
    await page.click('#btnCamOn');
    await page.waitForSelector('.camsheet .campv');
    await page.waitForFunction(() => { const v = document.querySelector('.campv'); return v && v.readyState >= 2 && v.videoWidth > 0; }, null, { timeout: 5000 });
    ok(await page.isVisible('#btnCamRec') && (await page.textContent('#camStat')).includes('準備'), '撮影の画面：カメラの大きな映像・「● 録画を始める」');
    ok(await page.evaluate(() => !document.querySelector('#wipe').hidden && document.querySelector('#btnCam').hidden), '記録の画面に、カメラの映像（ワイプ。はじめは「中」）');
    await shot(page, 'cam-sheet-ready');

    console.log('\n■ 録画 → スタート → 記録');
    await page.click('#btnCamRec');
    await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec, null, { timeout: 5000 });
    await sleep(1200);
    ok((await page.textContent('#camStat')).includes('録画中'), '「● 録画中」と録画の時間');
    ok(await page.evaluate(() => document.querySelector('#wipeBox').classList.contains('rec') && document.querySelector('#wipeTag').textContent.includes('録画')), 'ワイプが赤いふち・「● 録画」と時間（録画中）');
    await shot(page, 'cam-sheet-rec');
    await page.click('.sheet-card header .x');
    await sleep(800);
    await page.click('#btnStartBig');
    await sleep(2000);
    await page.click('#panel0 .prow[data-no="7"] .pb[data-type="fg2"]');
    await sleep(1500);
    await page.click('#btnPass');
    await sleep(1500);
    await page.click('#panel1 .prow[data-no=""] .pb[data-type="fg3"]');
    await sleep(1200);
    let g = await page.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
    ok(g.videos && g.videos.length === 1 && g.videos[0].status === 'recording' && g.videos[0].startedAt < g.startedAt, '記録に動画1（録画中・録画はスタートより前から）', g.videos);
    await shot(page, 'cam-live');

    console.log('\n■ 画面を離れたあと：新しい動画として続ける');
    await page.evaluate(() => BT.app.camSplit());
    await page.waitForFunction(() => BT.app.S.cam.rec && BT.app.S.game.videos.length === 2, null, { timeout: 15000 });
    await sleep(1500);
    await page.click('#panel0 .prow[data-no="10"] .pb[data-type="ft"]');
    await sleep(1500);
    g = await page.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
    ok(g.videos[0].status === 'done' && g.videos[1].status === 'recording' && g.videos[1].startedAt > g.videos[0].endedAt - 1000, '動画1を仕上げて、動画2を録画中', g.videos.map((v) => [v.n, v.status]));

    console.log('\n■ 試合を終える → 録画も止まり、動画が仕上がる');
    await page.evaluate(() => BT.app.endGame());
    await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.state === 'off', null, { timeout: 20000 });
    await sleep(300);
    g = await page.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
    const [v1, v2] = g.videos;
    ok(v1.status === 'done' && v2.status === 'done' && v1.duration > 8 && v2.duration > 2.5, `動画2本（${v1.duration.toFixed(1)} 秒・${v2.duration.toFixed(1)} 秒）`, g.videos);
    ok(/^バスケ記録_.+_致遠館vs城南_動画1\.mp4$/.test(v1.name) && v1.mime === 'video/mp4', `ファイル名：${v1.name}`);
    const metas = await page.evaluate(async (ids) => Promise.all(ids.map((id) => BT.vstore.getVideo(id))), [v1.vid, v2.vid]);
    ok(metas.every((m) => m && m.plan && m.plan.header && m.plan.ranges.length > 0), 'ふつうの MP4 に組み直す図がある（細切れの MP4 から）');
    await page.click('.sheet-card header .x').catch(() => {});
    ok(await page.$$eval('#cover .vitem', (els) => els.length) === 2, '「試合終了」の札に、動画2本（🎬 場面を切り出す・⬇ 保存・🗑）');
    await shot(page, 'cam-ended');

    console.log('\n■ 記録と動画の時刻が合っているか（映っている時刻を読む）');
    const m1 = await measure(page, v1.vid, [0.5, 2, 4, 6, v1.duration - 0.6]);
    const errs1 = m1.out.map((x) => x.err);
    ok(errs1.every((e) => Math.abs(e) <= 150), `動画1：コマに映った時刻 − （録画を始めた時刻＋動画の時刻）＝ ${errs1.join('・')} ミリ秒（±150 以内）`, m1);
    const m2 = await measure(page, v2.vid, [0.5, 1.5, v2.duration - 0.6]);
    const errs2 = m2.out.map((x) => x.err);
    ok(errs2.every((e) => Math.abs(e) <= 150), `動画2：${errs2.join('・')} ミリ秒（±150 以内）`, m2);
    ok(Math.abs(m1.duration - v1.duration) < 0.2, 'ブラウザで開いた長さが、記録の長さと合う（組み直した MP4）', [m1.duration, v1.duration]);

    console.log('\n■ 動画を保存する');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`#cover [data-savevid="${v1.vid}"]`)]);
    const saved = path.join(WORK, dl.suggestedFilename());
    await dl.saveAs(saved);
    ok(dl.suggestedFilename() === v1.name, `保存のファイル名：${dl.suggestedFilename()}`);
    const boxes = topBoxes(saved);
    const pr = ffprobe(saved);
    ok(pr && Math.abs(+pr.format.duration - v1.duration) < 0.2 && pr.streams.some((s) => s.codec_type === 'video') && pr.streams.some((s) => s.codec_type === 'audio'), `保存した MP4：${pr && pr.streams.map((s) => s.codec_name).join('+')}・${pr && (+pr.format.duration).toFixed(2)} 秒（映像と音）`, pr);
    ok(boxes.includes('moov') && boxes.includes('mdat') && !boxes.includes('moof'), `ふつうの MP4（細切れでない）：${boxes.join(' ')}`);
    const jsonDl = await (async () => { await page.click('#cover .btn.primary:has-text("書き出す")'); const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btnExpJson')]); const p2 = path.join(WORK, d.suggestedFilename()); await d.saveAs(p2); await page.click('.sheet-card header .x'); return p2; })();
    const ex = JSON.parse(fs.readFileSync(jsonDl, 'utf8'));
    ok(ex.videos && ex.videos.length === 2 && ex.videos[0].startedAt === v1.startedAt && ex.videos[0].name === v1.name && !('plan' in ex.videos[0]), '記録のファイル（JSON）に、動画のファイル名・録画を始めた時刻・長さ（中身は入れない）');
    ok(errors.length === 0, 'ページのエラーがない（タップ記録）', errors.slice(0, 3));

    console.log('\n■ 🎬 場面を切り出す → バスケ得点クリップ（時刻あわせなし）');
    const fg2 = g.events.find((e) => e.type === 'fg2');
    await Promise.all([page.waitForURL(/basket-clips/), page.click(`#cover [data-clip="${v1.vid}"]`)]);
    await page.waitForFunction(() => window.BS && BS.app && BS.app.S.media && BS.app.S.media.ready && BS.app.S.st.log, null, { timeout: 20000 });
    await sleep(500);
    let st = await page.evaluate(() => ({ sync: BS.app.S.st.sync, clips: BS.app.logClips().map((c) => ({ t: c.t, at: c.at, label: c.label })), name: BS.app.S.media.file.name, url: location.href }));
    const off1 = (g.startedAt - v1.startedAt) / 1000;
    const c7 = st.clips.find((c) => c.label === '#7 たけし 2P成功');
    ok(st.sync && st.sync.how === 'camera' && Math.abs(st.sync.anchors[0].v - st.sync.anchors[0].t - off1) < 0.02, `撮影した動画1と記録を開き、時刻は自動で合わせた（記録の 0:00 ＝ 動画の ${off1.toFixed(2)} 秒）`, st.sync);
    ok(c7 && Math.abs(c7.at - (fg2.t + off1)) < 0.06, `「#7 たけし 2P成功」の場面：動画の ${c7 && c7.at} 秒`, st.clips);
    ok(st.clips.some((c) => c.label === 'パスミス') && !st.url.includes('tapgame'), 'チームなしのパスミスも場面に・アドレスの「?tapgame=…」は消す');
    ok((await page.textContent('#syncCard')).includes('撮影しながら記録した動画'), '③ に「📹 撮影しながら記録した動画なので、自動でぴったり」');
    await shot(page, 'clips-camera');

    console.log('\n■ 「この端末で記録した試合」から動画2を開く');
    await page.click('#btnLog');
    await page.waitForSelector(`[data-tapvideo="${v2.vid}"]`);
    ok(await page.$$eval('.lgvids .btn', (els) => els.length) === 2, '試合の下に「📹 動画1・動画2を記録と一緒に開く」');
    await page.click(`[data-tapvideo="${v2.vid}"]`);
    await page.waitForFunction((n) => BS.app.S.media && BS.app.S.media.file && BS.app.S.media.file.name.endsWith(n) && BS.app.S.media.ready, '動画2.mp4', { timeout: 20000 });
    await sleep(400);
    st = await page.evaluate(() => ({ sync: BS.app.S.st.sync, clips: BS.app.logClips().map((c) => ({ t: c.t, at: c.at, label: c.label })), outside: null }));
    const off2 = (g.startedAt - v2.startedAt) / 1000;
    const ftEv = g.events.find((e) => e.type === 'ft');
    const cft = st.clips.find((c) => c.t === ftEv.t);
    ok(st.sync.how === 'camera' && Math.abs((st.sync.anchors[0].v - st.sync.anchors[0].t) - off2) < 0.02 && cft && Math.abs(cft.at - (ftEv.t + off2)) < 0.06, `動画2：記録の 0:00 ＝ 動画の ${off2.toFixed(2)} 秒（スタートより後に録画を始めた動画）・FT の場面 ${cft && cft.at} 秒`, st);
    ok(!st.clips.some((c) => c.label === '#7 たけし 2P成功'), '動画2には、動画1の時間の場面は入らない');

    console.log('\n■ 保存した動画と記録のファイルを、別のブラウザで開く（ファイル名で見つけて、時刻あわせなし）');
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'ja-JP' });
    const p2 = await ctx2.newPage();
    const errors2 = [];
    p2.on('pageerror', (e) => errors2.push(String(e)));
    await p2.goto(srv.url + 'basket-clips/');
    await p2.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
    await p2.setInputFiles('#fileLog', jsonDl);
    await p2.waitForFunction(() => BS.app.S.pendingLog);
    await p2.setInputFiles('#fileVideo', saved);
    await p2.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.S.st.sync, null, { timeout: 20000 });
    const s2 = await p2.evaluate(() => BS.app.S.st.sync);
    ok(s2.how === 'camera' && Math.abs((s2.anchors[0].v - s2.anchors[0].t) - off1) < 0.02, `ファイルを選んで開いても、動画1と分かって自動で合わせる（${(s2.anchors[0].v - s2.anchors[0].t).toFixed(2)} 秒）`, s2);
    ok(errors2.length === 0, 'ページのエラーがない（別のブラウザ）', errors2.slice(0, 3));
    await ctx2.close();
    ok(errors.length === 0, 'ページのエラーがない（バスケ得点クリップ）', errors.slice(0, 3));

    console.log('\n■ 録画の途中でページを閉じても、そこまでは残る');
    await page.goto(srv.url + 'basket-tap/');
    await page.waitForFunction(() => window.BT && BT.app);
    await page.evaluate(() => { const g2 = BT.newGame({ teams: [{ name: 'A' }, { name: 'B' }] }); BT.store.saveGame(g2); BT.app.resume(g2.id); });
    await page.click('#btnCamOn');
    await page.waitForSelector('#btnCamRec');
    await page.click('#btnCamRec');
    await page.waitForFunction(() => BT.app.S.cam.rec);
    await page.click('.sheet-card header .x');
    await page.click('#btnStartBig');
    await sleep(9000);
    const gid = await page.evaluate(() => BT.app.S.game.id);
    await page.reload();
    await page.waitForFunction(() => window.BT && BT.app && BT.app.S.game);
    await page.waitForFunction(() => (BT.app.S.game.videos || []).length && BT.app.S.game.videos.every((v) => v.status === 'done'), null, { timeout: 15000 });
    const rv = await page.evaluate(() => BT.app.S.game.videos[0]);
    ok(rv.duration >= 4 && rv.duration <= 10.5 && !rv.gone, `閉じる前までの動画を仕上げた（${rv.duration.toFixed(1)} 秒。録画は約 9.5 秒・最後の数秒は失う）`, rv);
    ok((await page.textContent('#lastbar')).includes('前回の録画'), '「前回の録画を、閉じる前までの分で保存しました」');
    const mr = await measure(page, rv.vid, [1, Math.max(1.2, rv.duration - 0.6)]);
    ok(mr.out.every((x) => Math.abs(x.err) <= 150), `途中で閉じた動画も、時刻が合っている（${mr.out.map((x) => x.err).join('・')} ミリ秒）`, mr);
    void gid;

    console.log('\n■ 録画と記録を同時にスタート（撮影の画面のボタン）');
    await page.evaluate(() => { BT.app.camClose(); const g5 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no })) }, { name: '城南' }] }); BT.store.saveGame(g5); BT.app.resume(g5.id); });
    await page.waitForSelector('#btnCamOn');
    await page.click('#btnCamOn');
    await page.waitForSelector('#btnCamBoth');
    ok((await page.textContent('#btnCamBoth')).includes('録画と記録を同時にスタート') && (await page.textContent('#btnCamRec')).includes('録画だけ先に始める'), '撮影の画面：「● 録画と記録を同時にスタート」が大きく・「録画だけ先に始める」はその下');
    ok(await page.$('#camOrient [data-orient="land"].on') && !(await page.$('#orientWarn')), '撮る向き：横向き（コート全体）が選ばれていて、横長の映像なので注意は出ない');
    await page.click('#camOrient [data-orient="port"]');
    ok(await page.isVisible('#orientWarn') && (await page.textContent('#orientWarn')).includes('横向きの映像'), '「縦向き」を選ぶと、いまの映像（横）と合わないことを知らせる');
    await page.click('#camOrient [data-orient="land"]');
    ok(!(await page.$('#orientWarn')), '横向きに戻すと、注意は消える');
    await page.click('.sheet-card header .x');
    ok((await page.textContent('#btnStartBig')).includes('録画と記録をスタート') && (await page.textContent('#btnStart')).includes('録画＋スタート'), 'スタート前の札・上の帯のボタンも「録画と記録をスタート」「● 録画＋スタート」');
    await shot(page, 'cam-cover-both');
    await page.click('#btnCamSheet');
    await page.waitForSelector('#btnCamBoth');
    await page.click('#btnCamBoth');
    await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec && BT.app.S.game.startedAt, null, { timeout: 8000 });
    const both = await page.evaluate(() => ({ game: BT.app.S.game.startedAt, video: BT.app.S.cam.seg.startedAt, sheet: BT.ui.sheetOpen() }));
    ok(!both.sheet && Math.abs(both.video - both.game) < 1500, `1回押すだけで、記録の時計と録画が同時に始まる（差 ${both.video - both.game} ミリ秒）・撮影の画面は閉じて、記録の画面へ`, both);
    await sleep(1500);
    await page.click('#panel0 .prow[data-no="7"] .pb[data-type="fg2"]');
    ok((await page.evaluate(() => BT.app.S.game.events.filter((e) => e.type === 'fg2').length)) === 1, 'そのまま記録できる');

    console.log('\n■ 録画中に映像の向きが変わったら（端末を回した）、別の動画にする');
    await page.evaluate(() => window.__camResize(360, 640));
    await page.waitForFunction(() => BT.app.S.game.videos.length === 2 && BT.app.S.cam.rec, null, { timeout: 15000 });
    ok((await page.textContent('#lastbar')).includes('向きが変わった'), '「映像の向きが変わったので、ここから新しい動画として録画しています」');
    await page.evaluate(() => window.__camResize(640, 360));
    await page.waitForFunction(() => BT.app.S.game.videos.length === 3, null, { timeout: 15000 });
    await page.evaluate(() => BT.app.camClose());
    await page.waitForFunction(() => BT.app.S.cam.state === 'off' && BT.app.S.game.videos.every((v) => v.status === 'done'), null, { timeout: 15000 });
    ok((await page.evaluate(() => BT.app.S.game.videos.map((v) => v.w > v.h ? '横' : '縦').join(''))) === '横縦横', '向きごとに別の動画（横・縦・横）');

    console.log('\n■ 画面の向きのロックをしたまま横に置く：アプリごと横向き＋録画に向きを書く');
    {
      const c4 = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera', 'microphone'], acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
      await c4.addInitScript(fakeCamera);
      await c4.addInitScript(() => { window.__camPortrait = 'ccw'; });
      const p4 = await c4.newPage();
      const e4 = [];
      p4.on('pageerror', (e) => e4.push(String(e)));
      await p4.goto(srv.url + 'basket-tap/');
      await p4.waitForFunction(() => window.BT && BT.app);
      await p4.evaluate(() => { const g6 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no, name: no === '7' ? 'たけし' : '' })) }, { name: '城南', players: BT.parseNumbers('4-12').map((no) => ({ no })) }] }); BT.store.saveGame(g6); BT.app.resume(g6.id); });
      await p4.click('#btnCamOn');
      await p4.waitForSelector('#orientWarn');
      ok((await p4.textContent('#orientWarn')).includes('縦向きの映像') && await p4.$('#btnRot90') && await p4.$('#btnRot270'), '縦長の映像（横倒し）：「スマホを横向きに」と、「⟲ 上側を左にして使う」「⟳ 上側を右にして使う」');
      await shot(p4, 'rot-warn');
      await p4.click('#btnRot90');
      await p4.waitForFunction(() => document.documentElement.dataset.rot === '90');
      const r1 = await p4.evaluate(() => ({ rot: BT.app.effRot(), ok: BT.app.orientOK(), w: document.querySelector('.live').clientWidth, h: document.querySelector('.live').clientHeight, plan: BT.app.S.L.plan && BT.app.S.L.plan.arr, warn: !!document.querySelector('#orientWarn') }));
      ok(r1.rot === 270 && r1.ok && !r1.warn && r1.w > r1.h, `アプリごと横向き（記録の画面 ${r1.w}×${r1.h}）・録画には「左へ 90° 回して映す」向き・注意は消える`, r1);
      await p4.click('.sheet-card header .x');
      const fit = await p4.evaluate(() => {
        const bad = [];
        document.querySelectorAll('.pb, .gb, .lbar > *:not([hidden])').forEach((b) => { const r = b.getBoundingClientRect(); if (r.width && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)) { const ro = b.closest('.roster'); if (!ro || ro.scrollHeight <= ro.clientHeight + 1) bad.push([b.className, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]); } });
        return bad;
      });
      ok(fit.length === 0, '回した画面でも、ボタンが端末の画面からはみ出さない', fit.slice(0, 4));
      await shot(p4, 'rot-live');
      await p4.tap('#btnStartBig');
      await p4.waitForFunction(() => BT.app.S.cam.rec && BT.app.S.game.startedAt, null, { timeout: 8000 });
      await sleep(1500);
      await p4.tap('#panel0 .prow[data-no="7"] .pb[data-type="fg2"]');
      await sleep(1200);
      await p4.tap('#btnPass');
      await sleep(1500);
      const g6 = await p4.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
      ok(g6.events.some((e) => e.type === 'fg2' && e.no === '7') && g6.events.some((e) => e.type === 'pass'), '回した画面のまま、選手のボタン・パスミスで記録できる');
      await p4.evaluate(() => BT.app.endGame());
      await p4.waitForFunction(() => BT.app.S.cam.state === 'off' && BT.app.S.game.videos[0].status === 'done', null, { timeout: 20000 });
      ok(await p4.evaluate(() => !document.documentElement.dataset.rot), '撮影を終えると、ふつうの縦の画面に戻る');
      const rv = await p4.evaluate(() => BT.app.S.game.videos[0]);
      const rm = await p4.evaluate(async (vid) => { const m = await BT.vstore.getVideo(vid); return { rotate: m.rotate, w: m.w, h: m.h }; }, rv.vid);
      ok(rm.rotate === 270 && rv.w === 640 && rv.h === 360, `動画の向き：270°（左へ 90°）・映す大きさ ${rv.w}×${rv.h}（横）`, { rm, rv });
      const mm = await measure(p4, rv.vid, [0.6, 2, Math.max(2.2, rv.duration - 0.6)]);
      ok(mm.out.every((x) => Math.abs(x.err) <= 150), `回して映した動画のコマからも時刻が読める（向きが正しい）・記録とのずれ ${mm.out.map((x) => x.err).join('・')} ミリ秒`, mm);
      await p4.click('.sheet-card header .x').catch(() => {});
      const [d4] = await Promise.all([p4.waitForEvent('download'), p4.click(`#cover [data-savevid="${rv.vid}"]`)]);
      const f4 = path.join(WORK, 'rot_' + d4.suggestedFilename());
      await d4.saveAs(f4);
      let rotInfo = '';
      try { rotInfo = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height:stream_side_data=rotation', '-of', 'compact=p=0', f4]).toString().trim(); } catch (e) { rotInfo = String(e); }
      ok(/width=360\|height=640/.test(rotInfo) && /rotation=90/.test(rotInfo), `保存した MP4：中身は縦長のまま、映すときに回す（${rotInfo.replace(/\n/g, ' ')}）`, rotInfo);
      ok(e4.length === 0, 'ページのエラーがない（アプリごと横向き）', e4.slice(0, 3));
      await c4.close();
    }

    console.log('\n■ 録画が WebM のブラウザ（Firefox など）：向きを書けないことを、先に知らせる');
    {
      const c5 = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera', 'microphone'], locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
      await c5.addInitScript(fakeCamera);
      await c5.addInitScript(() => { window.__camPortrait = 'ccw'; const o = MediaRecorder.isTypeSupported.bind(MediaRecorder); MediaRecorder.isTypeSupported = (m) => !/mp4/i.test(m) && o(m); });
      const p5 = await c5.newPage();
      const e5 = [];
      p5.on('pageerror', (e) => e5.push(String(e)));
      await p5.goto(srv.url + 'basket-tap/');
      await p5.waitForFunction(() => window.BT && BT.app);
      await p5.evaluate(() => { const g7 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-12').map((no) => ({ no })) }, { name: '城南' }] }); BT.store.saveGame(g7); BT.app.resume(g7.id); });
      await p5.click('#btnCamOn');
      await p5.waitForSelector('#orientWarn');
      ok(!(await p5.$('#rotWebm')), '回さないうちは、WebM でも注意は出ない');
      await p5.click('#btnRot90');
      await p5.waitForSelector('#rotWebm');
      ok((await p5.textContent('#rotWebm')).includes('横倒しのまま'), 'アプリごと横向きにすると「このブラウザの録画（WebM）には向きを書けないので…横倒しのまま」');
      await p5.click('.sheet-card header .x');
      await p5.tap('#btnStartBig');
      await p5.waitForFunction(() => BT.app.S.cam.rec && BT.app.S.game.startedAt, null, { timeout: 8000 });
      await sleep(1800);
      await p5.evaluate(() => BT.app.endGame());
      await p5.waitForFunction(() => BT.app.S.cam.state === 'off' && BT.app.S.game.videos[0] && BT.app.S.game.videos[0].status === 'done', null, { timeout: 20000 });
      const w5 = await p5.evaluate(() => ({ mime: BT.app.S.game.videos[0].mime, msg: BT.app.S.msg && BT.app.S.msg.text }));
      ok(/webm/.test(w5.mime) && /横倒しのまま/.test(w5.msg || ''), `試合を終えたあとも「向きを書けなかったので、横倒しのまま」と知らせる（${w5.mime}）`, w5);
      ok(e5.length === 0, 'ページのエラーがない（WebM）', e5.slice(0, 3));
      await c5.close();
    }

    console.log('\n■ スマホの大きさでも、上の帯（時計・得点・カメラの小さな映像・メニュー）が重ならない（ワイプ「小」）');
    for (const vp of [{ width: 390, height: 664, n: 'ふつうのスマホ' }, { width: 375, height: 553, n: 'iPhone SE' }, { width: 750, height: 340, n: 'スマホ横向き' }]) {
      const c3 = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera', 'microphone'], locale: 'ja-JP' });
      await c3.addInitScript(fakeCamera);
      const p3 = await c3.newPage();
      await p3.goto(srv.url + 'basket-tap/');
      await p3.waitForFunction(() => window.BT && BT.app);
      await p3.evaluate(() => { BT.app.S.prefs.camWipe = 's'; const g3 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-18').map((no) => ({ no })) }, { name: '城南', players: BT.parseNumbers('4-18').map((no) => ({ no })) }] }); BT.store.saveGame(g3); BT.app.resume(g3.id); BT.app.start(); });
      await p3.evaluate(() => BT.app.camStart());
      await p3.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec && !document.querySelector('#btnCam').hidden);
      const bad = await p3.evaluate(() => {
        const parts = [];
        Array.from(document.querySelectorAll('.lbar > *')).filter((e) => e.offsetParent !== null).forEach((e) => { if (e.classList.contains('score')) e.querySelectorAll('.sc').forEach((x) => parts.push(x)); else parts.push(e); });
        const out = [];
        for (let i = 1; i < parts.length; i++) { const a = parts[i - 1].getBoundingClientRect(), b = parts[i].getBoundingClientRect(); if (b.left < a.right - 1) out.push([parts[i - 1].className, parts[i].className]); }
        if (parts[parts.length - 1].getBoundingClientRect().right > innerWidth + 1) out.push('はみ出す');
        const pb = document.querySelector('.pb').getBoundingClientRect();
        if (pb.width < 27 || pb.height < 27) out.push(['ボタンが小さい', pb.width, pb.height]);
        if (/null|undefined/.test(document.querySelector('#lastbar').textContent)) out.push(['下の帯に null', document.querySelector('#lastbar').textContent]);
        return out;
      });
      ok(bad.length === 0, `${vp.n}（${vp.width}×${vp.height}）：録画中も重ならない・選手のボタンも小さくならない`, bad);
      await shot(p3, `cam-${vp.width}x${vp.height}`);
      await p3.evaluate(() => BT.app.camClose());
      await c3.close();
    }

    console.log('\n■ ワイプ（記録の画面のカメラの映像）の大きさ：中・大・特大・小。ボタンに重ならない');
    {
      /* ワイプと、選手のボタン・下の帯・上の帯が重ならないか／ボタンの行がすべっているか／下の帯がワイプの下の列にあるか */
      const wipeState = (pg) => pg.evaluate(() => {
        const L = BT.app.S.L, live = L.root;
        const on = !L.wipe.hidden;
        const wr = L.wipeBox.getBoundingClientRect(), gr = L.gbar.getBoundingClientRect();
        const hit = [], out = [];
        document.querySelectorAll('.pb, .gb, .lastbar, .lbar > *:not([hidden])').forEach((b) => {
          const r = b.getBoundingClientRect();
          if (!r.width) return;
          if (on && r.left < wr.right - 1 && r.right > wr.left + 1 && r.top < wr.bottom - 1 && r.bottom > wr.top + 1) hit.push(b.className);
          const ro = b.closest('.roster');
          if ((r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) && !(ro && ro.scrollHeight > ro.clientHeight + 1)) out.push(b.className);
        });
        const own = document.querySelector('#panel0 .pb').getBoundingClientRect(), os = document.querySelector('#panel1');
        return { on, thumb: !L.camBtn.hidden, dock: ['dk-side', 'dk-col', 'dk-top', 'dk-x'].filter((k) => live.classList.contains(k)).join(' '), w: L.wipeBox.offsetWidth, h: L.wipeBox.offsetHeight,
          hit: hit.slice(0, 3), out: out.slice(0, 3), scroll: [...document.querySelectorAll('.team')].some((t) => t.classList.contains('scroll')),
          ownScroll: document.querySelector('#panel0').classList.contains('scroll'), oppScroll: os.classList.contains('scroll'), oppInWipe: !!os.closest('#wipe'),
          ownBtn: [Math.round(Math.max(own.width, own.height) === own.width ? own.width : own.width), Math.round(own.height)],
          gbarRight: on && gr.left >= wr.left - 8, gbarLeft: gr.right <= wr.left + 1, size: BT.app.S.prefs.camWipe, fb: !!L.wipeFallback };
      });
      await page.evaluate(() => { BT.app.camClose(); const g8 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no })) }, { name: '城南', players: BT.parseNumbers('4-15').map((no) => ({ no })) }] }); BT.store.saveGame(g8); BT.app.resume(g8.id); });
      await page.evaluate(() => BT.app.camStart());
      await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec && !document.querySelector('#wipe').hidden, null, { timeout: 8000 });
      await page.evaluate(() => BT.app.start());
      await sleep(1300);
      let w = await wipeState(page);
      ok(w.on && !w.thumb && w.dock === 'dk-side' && w.w >= 380 && w.hit.length === 0 && w.out.length === 0 && !w.scroll && w.gbarRight,
        `iPad 横（1180×820）・中：右側に ${w.w}×${w.h} のワイプ・上の帯の小さな映像は隠す・ボタンと重ならず、行もすべらない・パスミスと★はワイプの下`, w);
      ok((await page.textContent('#wipeTag')).match(/● 録画 0:0\d/), `ワイプに「${await page.textContent('#wipeTag')}」（録画の時間）`);
      await shot(page, 'wipe-ipad-m');
      await page.click('#panel0 .prow[data-no="9"] .pb[data-type="fg3"]');
      await page.click('#btnMark');
      ok((await page.evaluate(() => BT.app.S.game.events.filter((e) => (e.type === 'fg3' && e.no === '9') || e.type === 'mark').length)) === 2, 'ワイプを出したまま、選手のボタン・★で記録できる');
      const wm = w.w;
      await page.click('#btnWipeBig');
      await sleep(300);
      w = await wipeState(page);
      ok(w.size === 'l' && w.w > wm + 60 && w.hit.length === 0 && w.out.length === 0 && await page.evaluate(() => !document.querySelector('#btnWipeBig').disabled),
        `「＋」で大：${w.w}×${w.h}・ボタンと重ならない（「＋」はまだ押せる：次は特大）`, w);
      await shot(page, 'wipe-ipad-l');
      await page.click('#btnWipeSmall');
      await page.click('#btnWipeSmall');
      await sleep(300);
      w = await wipeState(page);
      ok(w.size === 's' && !w.on && w.thumb && !w.dock && (await page.evaluate(() => BT.store.prefs().camWipe)) === 's', '「－」2回で小：上の帯の小さな映像に戻る（設定にも残る）', w);
      await page.click('#btnCam');
      await page.waitForSelector('#camWipe [data-wipe="m"]');
      ok((await page.textContent('#camWipe')).includes('ワイプの大きさ') && await page.$('#camWipe [data-wipe="s"].on'), '撮影の画面に「ワイプの大きさ　小・中・大」（いまは小）');
      await page.click('#camWipe [data-wipe="m"]');
      await page.waitForSelector('#camWipe [data-wipe="m"].on');
      await page.click('.sheet-card header .x');
      await sleep(300);
      w = await wipeState(page);
      ok(w.size === 'm' && w.on && w.w === wm, '撮影の画面で「中」を選ぶと、ワイプが戻る', w);
      await page.click('#btnWipe');
      await page.waitForSelector('.camsheet .campv');
      ok(await page.evaluate(() => BT.ui.sheetOpen()), 'ワイプを押すと、撮影の画面が開く');
      await page.click('.sheet-card header .x');
      await page.evaluate(() => BT.app.camClose());
      await page.waitForFunction(() => BT.app.S.cam.state === 'off');
      w = await wipeState(page);
      ok(!w.on && !w.dock && !w.thumb, 'カメラを切ると、ワイプも消えて、ボタンが元の広さに戻る', w);

      // 特大：相手チームの欄を小さくして、映像の下へ。自分のチームは広いまま
      await page.evaluate(() => BT.app.camStart());
      await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec && !document.querySelector('#wipe').hidden, null, { timeout: 8000 });
      await page.evaluate(() => BT.app.setWipe('l'));
      await sleep(300);
      const wl = await wipeState(page);
      await page.click('#btnWipeBig');
      await sleep(400);
      w = await wipeState(page);
      ok(w.size === 'x' && w.dock.includes('dk-x') && w.oppInWipe && w.w >= 600 && w.w > wl.w && w.hit.length === 0 && w.out.length === 0 && !w.ownScroll && !w.oppScroll && w.ownBtn[0] >= 90 && w.gbarLeft,
        `iPad 横・「＋」で特大：映像 ${w.w}×${w.h}（大は ${wl.w}×${wl.h}）・相手チームは映像の下（行もすべらない）・自分のボタン ${w.ownBtn.join('×')}・パスミスと★は自分のチームの下・重ならない`, w);
      ok(await page.evaluate(() => document.querySelector('#btnWipeBig').disabled) && (await page.textContent('#lastbar')).includes('特大'), '特大がいちばん大きい（「＋」は押せない）・「特大：相手チームの欄を小さくして…」');
      await shot(page, 'wipe-ipad-x');
      await page.click('#panel1 .prow[data-no="7"] .pb[data-type="fg2"]');
      await page.click('#panel0 .prow[data-no="11"] .pb[data-type="reb"]');
      ok((await page.evaluate(() => BT.app.S.game.events.filter((e) => (e.type === 'fg2' && e.team === 1 && e.no === '7') || (e.type === 'reb' && e.team === 0 && e.no === '11')).length)) === 2, '映像の下に移した相手チームのボタンも、自分のチームのボタンも記録できる');
      await page.click('#btnWipeSmall');
      await sleep(300);
      w = await wipeState(page);
      ok(w.size === 'l' && !w.oppInWipe && !w.dock.includes('dk-x') && w.hit.length === 0, '「－」で大に戻すと、相手チームの欄も元の場所（2チームの並び）に戻る', w);
      await page.click('#btnWipe');
      await page.waitForSelector('#camWipe [data-wipe="x"]');
      ok((await page.textContent('#camWipe')).includes('特大'), '撮影の画面の「ワイプの大きさ」に「特大」');
      await page.click('#camWipe [data-wipe="x"]');
      await page.waitForSelector('#camWipe [data-wipe="x"].on');
      await page.click('.sheet-card header .x');
      await page.evaluate(() => BT.app.camClose());
      await page.waitForFunction(() => BT.app.S.cam.state === 'off');
      w = await wipeState(page);
      ok(!w.on && !w.oppInWipe && !w.dock, 'カメラを切ると、相手チームの欄も元の場所に戻る', w);
      // 相手の名簿なし（チームの1行だけ）：映像をもっと大きく
      await page.evaluate(() => { const g10 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no })) }, { name: '城南' }] }); BT.store.saveGame(g10); BT.app.resume(g10.id); BT.app.start(); });
      await page.evaluate(() => BT.app.camStart());
      await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec && !document.querySelector('#wipe').hidden, null, { timeout: 8000 });
      await sleep(300);
      w = await wipeState(page);
      ok(w.size === 'x' && w.oppInWipe && w.w >= 700 && !w.ownScroll && w.hit.length === 0 && w.out.length === 0, `相手の名簿なし・特大：映像 ${w.w}×${w.h}・相手は「チーム」の1行・自分のチームはすべらない`, w);
      await shot(page, 'wipe-ipad-x-noopp');
      await page.evaluate(() => { BT.app.setWipe('m'); return BT.app.camClose(); });
      await page.waitForFunction(() => BT.app.S.cam.state === 'off');
      // 選手のボタンを 8 つ（失敗・ファウル）にしても、中・特大のワイプとボタンが重ならない
      await page.evaluate(() => { Object.assign(BT.app.S.prefs, { btnMiss: true, btnFoul: true }); const g11 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no })) }, { name: '城南', players: BT.parseNumbers('4-15').map((no) => ({ no })) }] }); BT.store.saveGame(g11); BT.app.resume(g11.id); BT.app.start(); });
      await page.evaluate(() => BT.app.camStart());
      await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec && !document.querySelector('#wipe').hidden, null, { timeout: 8000 });
      await sleep(300);
      const w8m = await wipeState(page);
      await page.evaluate(() => BT.app.setWipe('x'));
      await sleep(300);
      const w8x = await wipeState(page);
      const n8 = await page.$$eval('#panel0 .prow:first-child .pb', (els) => els.length);
      ok(n8 === 8 && w8m.on && w8x.oppInWipe && [w8m, w8x].every((x) => x.hit.length === 0 && x.out.length === 0) && !w8m.scroll && !w8x.ownScroll,
        `ボタン 8 つ（失敗・ファウル）：中 ${w8m.w}×${w8m.h}・特大 ${w8x.w}×${w8x.h}。どちらもボタンと重ならず、自分のチームの行はすべらない`, { w8m, w8x, n8 });
      await shot(page, 'wipe-ipad-x-8btn');
      await page.evaluate(() => { Object.assign(BT.app.S.prefs, { btnMiss: false, btnFoul: false }); BT.app.setWipe('m'); return BT.app.camClose(); });
      await page.waitForFunction(() => BT.app.S.cam.state === 'off');

      const cases = [
        { n: 'スマホ横（2チームとも名簿）', vp: [844, 390], opp: true, check: (m, l) => m.on && m.dock === 'dk-side' && m.w >= 150 && !m.scroll && l.w > m.w + 80 },
        { n: 'スマホ横（自分のチームだけ名簿）', vp: [844, 390], opp: false, check: (m, l) => m.on && m.w >= 220 && !m.scroll && l.w > m.w + 60 && !l.scroll },
        { n: 'スマホ縦', vp: [390, 664], opp: true, check: (m, l) => m.on && m.dock === 'dk-top' && m.w >= 150 && !m.scroll && l.w > m.w },
        { n: '小さなスマホ横（2チームとも名簿）', vp: [667, 375], opp: true, check: (m, l) => !m.on && m.thumb && m.fb && !m.scroll && l.on && l.w >= 250 },
        { n: '画面の向きのロックのまま横（アプリごと横向き）', vp: [390, 664], opp: false, rot: 90, check: (m, l) => m.on && m.dock === 'dk-side' && !m.scroll && l.on },
      ];
      for (const c of cases) {
        const cc = await browser.newContext({ viewport: { width: c.vp[0], height: c.vp[1] }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera', 'microphone'], locale: 'ja-JP' });
        await cc.addInitScript(fakeCamera);
        if (c.rot) await cc.addInitScript(() => { window.__camPortrait = 'ccw'; });
        const pc = await cc.newPage();
        const ec = [];
        pc.on('pageerror', (e) => ec.push(String(e)));
        await pc.goto(srv.url + 'basket-tap/');
        await pc.waitForFunction(() => window.BT && BT.app);
        await pc.evaluate(([opp, rot]) => { const g9 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-15').map((no) => ({ no })) }, { name: '城南', players: opp ? BT.parseNumbers('4-15').map((no) => ({ no })) : [] }] }); BT.store.saveGame(g9); BT.app.resume(g9.id); if (rot) BT.app.S.prefs.uiRot = rot; BT.app.start(); }, [c.opp, c.rot || 0]);
        await pc.evaluate(() => BT.app.camStart());
        await pc.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec);
        await sleep(700);
        const m = await wipeState(pc);
        await pc.evaluate(() => BT.app.setWipe('l'));
        await sleep(300);
        const l = await wipeState(pc);
        await pc.evaluate(() => BT.app.setWipe('x'));
        await sleep(300);
        const xx = await wipeState(pc);
        if (c.vp[0] === 844 && c.opp) await shot(pc, 'wipe-phone-x');
        if (c.vp[0] === 844 && c.opp) await shot(pc, 'wipe-phone-l');
        await pc.evaluate(() => BT.app.setWipe('m'));
        await sleep(300);
        if (c.vp[0] === 844 && c.opp) await shot(pc, 'wipe-phone-m');
        let note = '';
        if (c.check === cases[3].check) { await pc.evaluate(() => BT.app.openCamera()); await pc.waitForSelector('#camWipe'); note = await pc.textContent('#camWipe'); }
        const xGood = xx.on && xx.oppInWipe && xx.dock.includes('dk-x') && (c.vp[0] < c.vp[1] || xx.w >= l.w - 1) && (!xx.ownScroll || l.ownScroll);
        const good = c.check(m, l) && xGood && [m, l, xx].every((x) => x.hit.length === 0 && x.out.length === 0) && (!note || note.includes('入りきらない')) && ec.length === 0;
        ok(good, `${c.n}（${c.vp.join('×')}）：中 ${m.on ? m.w + '×' + m.h : '上の帯（ボタンを優先）'}${m.scroll ? '・行がすべる' : ''} ／ 大 ${l.w}×${l.h}${l.scroll ? '・行がすべる' : ''} ／ 特大 ${xx.w}×${xx.h}${xx.ownScroll ? '・自分の行がすべる' : ''}${xx.oppScroll ? '・相手の行はすべらせる' : ''}・ボタンと重ならない`, { m, l, xx, note: note.slice(0, 80), ec });
        await pc.evaluate(() => BT.app.camClose());
        await cc.close();
      }
    }

    console.log('\n■ 保存できなくなったら（空きが足りない など）、録画を止めて、そこまでを仕上げる');
    await page.evaluate(() => { const g4 = BT.newGame({ teams: [{ name: 'A' }, { name: 'B' }] }); BT.store.saveGame(g4); BT.app.resume(g4.id); BT.app.start(); });
    await page.evaluate(() => BT.app.camStart());
    await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec);
    await sleep(3500);
    await page.evaluate(() => { const orig = BT.vstore.putChunk; BT.vstore.putChunk = () => Promise.reject(new Error('QuotaExceededError')); window.__restore = () => { BT.vstore.putChunk = orig; }; });
    await page.waitForFunction(() => !BT.app.S.cam.rec && BT.app.S.game.videos[0].status === 'done', null, { timeout: 15000 });
    const qv = await page.evaluate(() => BT.app.S.game.videos[0]);
    ok((await page.textContent('#lastbar')).includes('録画を止めました') && qv.duration >= 1.5 && !qv.gone, `録画を止めて「録画を止めました：保存できませんでした…」・保存できた所まで（${qv.duration.toFixed(1)} 秒）は動画に`, qv);
    await page.evaluate(() => window.__restore());
    await page.evaluate(() => BT.app.camClose());

    console.log('\n■ カメラを使えないとき');
    await page.evaluate(() => { window.__camDeny = true; });
    await page.evaluate(() => BT.app.openCamera());
    await sleep(300);
    ok((await page.textContent('#toasts')).includes('許可'), 'カメラを断られたら「カメラの使用が許可されていません…」', await page.textContent('#toasts'));
    await shot(page, 'cam-denied');
  } catch (err) {
    fail++;
    console.log('  FAIL 途中で止まりました:', err && err.stack || err);
  } finally {
    await browser.close();
    await srv.close();
    fs.rmSync(WORK, { recursive: true, force: true });
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
