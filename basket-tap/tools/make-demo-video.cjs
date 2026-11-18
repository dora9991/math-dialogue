// 使い方のデモに使う「見本の試合の動画」（demo/demo.mp4）と、その試合で起きたこと（demo/demo.json）を作る。
//   node basket-tap/tools/make-demo-video.cjs
// 映像は、バスケ得点クリップのテスト用の合成試合（basket-clips/tests/tools/fixtures。シード 204・ブルー vs レッド）を、
// Chrome の WebCodecs で1コマずつ描いて H.264（iPhone の Safari でも再生できる形）の MP4 にする。実時間の録画ではないので、毎回同じ動画になる。
// はじめの LEAD 秒は、ティップオフの前の止まった絵（記録の「スタート」と動画の時刻を合わせるところを見せるため）。
// Playwright（playwright か playwright-core）と、パソコンの Google Chrome を使う（CHROME で場所を変えられる）。
const fs = require('fs');
const path = require('path');
const { start } = require('../../basket-clips/tests/server.cjs');
function pw() {
  for (const m of ['playwright-core', 'playwright']) { try { return require(m); } catch (e) { /* 次へ */ } }
  if (process.env.PW) return require(process.env.PW);
  throw new Error('playwright-core が見つかりません（PW=…/node_modules/playwright-core で場所を教えてください）');
}
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, '..', 'demo');
const LEAD = 3;            // ティップオフの前の秒数
const SEG = [0, 75];       // 合成試合の、使う区間（秒）
const W = 960, H = 540, FPS = 30, KBPS = 650;

const { MUX } = require('./mp4mux.cjs');

async function renderInPage(o) {
  const game = BS.sim.generate({});
  const cv = document.createElement('canvas'); cv.width = o.W; cv.height = o.H;
  const rd = BS.Renderer(game, cv, { view: 'side' });
  const chunks = []; let err = null, avcC = null;
  const enc = new VideoEncoder({
    output: (c, meta) => { const d = new Uint8Array(c.byteLength); c.copyTo(d); chunks.push({ d, key: c.type === 'key' }); if (meta && meta.decoderConfig && meta.decoderConfig.description && !avcC) avcC = new Uint8Array(meta.decoderConfig.description); },
    error: (e) => { err = e; }
  });
  enc.configure({ codec: 'avc1.4D401F', width: o.W, height: o.H, bitrate: o.kbps * 1000, framerate: o.fps, avc: { format: 'avc' } });
  const n = Math.round((o.lead + o.seg[1] - o.seg[0]) * o.fps);
  for (let k = 0; k < n && !err; k++) {
    const t = Math.max(o.seg[0], o.seg[0] + k / o.fps - o.lead);
    rd.draw(t);
    const vf = new VideoFrame(cv, { timestamp: Math.round(k * 1e6 / o.fps), duration: Math.round(1e6 / o.fps) });
    enc.encode(vf, { keyFrame: k % (o.fps * 2) === 0 });
    vf.close();
    while (enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 2));
    if (k % 90 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  await enc.flush(); enc.close();
  if (err) return { error: String(err.message || err) };
  if (!avcC) return { error: 'avcC がありません' };
  window.__blob = window.__mux(chunks, Array.from(avcC), o.W, o.H, o.fps);
  // 起きたこと（動画の時刻）：自分＝ブルー（team 0）・相手＝レッド（team 1）
  const pno = {};
  game.teams.forEach((tm) => tm.players.forEach((p) => { pno[p.id] = p.no; }));
  const toV = (t) => +(t - o.seg[0] + o.lead).toFixed(2);
  const ev = game.events.filter((e) => e.t >= o.seg[0] && e.t <= o.seg[1] - 1).map((e) => {
    const base = { v: toV(e.t), team: e.team, no: e.pid ? pno[e.pid] : null };
    if (e.type === 'period') return { v: toV(e.t), kind: 'tipoff' };
    if (e.type === 'shot') return Object.assign(base, { kind: e.made ? (e.pts === 3 ? 'fg3' : 'fg2') : (e.pts === 3 ? 'fg3x' : 'fg2x') });
    if (e.type === 'ft') return Object.assign(base, { kind: e.made ? 'ft' : 'ftx' });
    if (e.type === 'reb') return Object.assign(base, { kind: e.off ? 'oreb' : 'dreb' });
    if (e.type === 'to') return Object.assign(base, { kind: 'to', stl: e.stl ? pno[e.stl] : null });
    if (e.type === 'foul') return Object.assign(base, { kind: 'foul' });
    return null;
  }).filter(Boolean);
  return { frames: chunks.length, duration: n / o.fps, bytes: window.__blob.size, teams: game.teams.map((t) => ({ name: t.name, color: t.color, players: t.players.map((p) => ({ no: p.no, name: p.name })) })), events: ev };
}

(async () => {
  const { chromium } = pw();
  const srv = await start(0, path.join(__dirname, '..', '..', 'basket-clips'));
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.goto(srv.url + 'tests/tools/render.html');
    await page.waitForFunction(() => window.BS && BS.Renderer && BS.sim);
    await page.addScriptTag({ content: MUX + '\nwindow.__mux = mux;' });
    const t0 = Date.now();
    const info = await page.evaluate(renderInPage, { W, H, fps: FPS, kbps: KBPS, lead: LEAD, seg: SEG });
    if (info.error) throw new Error(info.error);
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.evaluate(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(window.__blob); a.download = 'demo.mp4'; document.body.appendChild(a); a.click(); return 1; })
    ]);
    fs.mkdirSync(OUT, { recursive: true });
    await dl.saveAs(path.join(OUT, 'demo.mp4'));
    const meta = { file: 'demo.mp4', lead: LEAD, seg: SEG, w: W, h: H, fps: FPS, duration: info.duration, teams: info.teams, events: info.events };
    fs.writeFileSync(path.join(OUT, 'demo.json'), JSON.stringify(meta, null, 1));
    console.log(JSON.stringify({ sec: (Date.now() - t0) / 1000, frames: info.frames, duration: info.duration, MB: +(info.bytes / 1048576).toFixed(2), events: info.events.length }));
  } finally { await browser.close(); await srv.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
