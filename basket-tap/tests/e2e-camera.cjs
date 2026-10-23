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

/* カメラの差しかえ：640×360 に、時刻（ミリ秒の下 32 ビット）を 8×4 のます目の白黒で描く。音は発振器 */
function fakeCamera() {
  window.__camDeny = false;
  const md = navigator.mediaDevices;
  if (!md) return;
  md.getUserMedia = async (c) => {
    if (window.__camDeny) { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; }
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
    ok(await page.evaluate(() => !document.querySelector('#btnCam').hidden), '上の帯に、カメラの小さな映像');
    await shot(page, 'cam-sheet-ready');

    console.log('\n■ 録画 → スタート → 記録');
    await page.click('#btnCamRec');
    await page.waitForFunction(() => BT.app.S.cam && BT.app.S.cam.rec, null, { timeout: 5000 });
    await sleep(1200);
    ok((await page.textContent('#camStat')).includes('録画中'), '「● 録画中」と録画の時間');
    ok(await page.evaluate(() => document.querySelector('#btnCam').classList.contains('rec')), '上の帯の映像が赤いふち（録画中）');
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

    console.log('\n■ スマホの大きさでも、上の帯（時計・得点・カメラの映像・メニュー）が重ならない');
    for (const vp of [{ width: 390, height: 664, n: 'ふつうのスマホ' }, { width: 375, height: 553, n: 'iPhone SE' }, { width: 750, height: 340, n: 'スマホ横向き' }]) {
      const c3 = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera', 'microphone'], locale: 'ja-JP' });
      await c3.addInitScript(fakeCamera);
      const p3 = await c3.newPage();
      await p3.goto(srv.url + 'basket-tap/');
      await p3.waitForFunction(() => window.BT && BT.app);
      await p3.evaluate(() => { const g3 = BT.newGame({ teams: [{ name: '致遠館', players: BT.parseNumbers('4-18').map((no) => ({ no })) }, { name: '城南', players: BT.parseNumbers('4-18').map((no) => ({ no })) }] }); BT.store.saveGame(g3); BT.app.resume(g3.id); BT.app.start(); });
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
