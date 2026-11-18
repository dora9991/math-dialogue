// テスト用の合成試合の動画（VP9 の MP4）と、その正解（得点の時刻・チーム、ゴールの位置）を作る。
//   node basket-clips/tests/tools/make-video.cjs <出力.mp4> [区間=0-150] [fps=30] [Mbps=4]
//   区間は「元の試合の秒」。カンマで区切ると、つないだ1本の動画になる（例：0-120,805-925 ＝ 前半の頭と後半の頭）。
//   最後に rim を付けると、シュートの一部を「リングに当たってから入る／外れる」形にする（fixtures/rimplay.js。正解の shots[].rim に形の名前）。
//   その次にカメラの場所（behind：ゴールA の裏の2階から斜めに／behindLow：ゴールA の裏のフロアから。省略時は side＝コートの横から）。
//   例：node make-video.cjs out.mp4 0-120 30 4 - behind（リングに当たるシュートなし・ゴール裏から）
//   その次はボールの動きぶれ（シャッターが開いている秒数）。例：node make-video.cjs out.mp4 0-150 30 4 - side 0.033（暗い体育館をスマホで撮ったつもり）
// 映像は「バスケ分析スタジオ」のサンプル試合（fixtures/。シード 204・ブルー vs レッド）を、ブラウザの WebCodecs で1コマずつ描いて作る。
// 実時間の録画ではないので、コマ落ちがなく、毎回同じ動画になる。
// VP9 にしているのは、テストに使う Chromium（Playwright 同梱）が H.264 を扱えないため（ふつうの Chrome・Safari では H.264 の動画も同じように読める）。
const fs = require('fs');
const path = require('path');
const { start } = require('../server.cjs');
const { chromium } = require('../pw.cjs');

const MUX = `
function mux(chunks, W, H, fps) {
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = (n) => [(n >>> 8) & 255, n & 255];
  const str = (s) => Array.from(s).map((c) => c.charCodeAt(0));
  const zeros = (n) => new Array(n).fill(0);
  const box = (type, ...parts) => { const body = [].concat(...parts.map((p) => Array.from(p))); return [...u32(8 + body.length), ...str(type), ...body]; };
  const full = (type, ver, flags, ...parts) => box(type, [ver, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255], ...parts);
  const TS = 90000, n = chunks.length;
  const delta = Math.round(TS / fps), dur = n * delta, durMs = Math.round(dur * 1000 / TS);
  const matrix = [...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x10000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];
  const ftyp = box('ftyp', str('isom'), u32(512), str('isom'), str('iso2'), str('vp09'), str('mp41'));
  const build = (offset) => {
    // vpcC（版1）：profile 0・level 3.1・8bit / 4:2:0・色の情報は BT.709
    const vpcC = full('vpcC', 1, 0, [0, 31, (8 << 4) | (1 << 1), 1, 1, 1], u16(0));
    const vp09 = box('vp09', zeros(6), u16(1), zeros(16), u16(W), u16(H), u32(0x480000), u32(0x480000), u32(0), u16(1), zeros(32), u16(0x18), [255, 255], vpcC);
    const stbl = box('stbl',
      full('stsd', 0, 0, u32(1), vp09),
      full('stts', 0, 0, u32(1), u32(n), u32(delta)),
      full('stss', 0, 0, u32(chunks.filter((c) => c.key).length), [].concat(...chunks.map((c, i) => (c.key ? u32(i + 1) : [])))),
      full('stsc', 0, 0, u32(1), u32(1), u32(n), u32(1)),
      full('stsz', 0, 0, u32(0), u32(n), [].concat(...chunks.map((c) => u32(c.d.length)))),
      full('stco', 0, 0, u32(1), u32(offset)));
    const minf = box('minf', full('vmhd', 0, 1, u16(0), u16(0), u16(0), u16(0)), box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1))), stbl);
    const mdia = box('mdia', full('mdhd', 0, 0, u32(0), u32(0), u32(TS), u32(dur), u16(0x55c4), u16(0)), full('hdlr', 0, 0, u32(0), str('vide'), zeros(12), str('VideoHandler'), [0]), minf);
    const trak = box('trak', full('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(durMs), zeros(8), u16(0), u16(0), u16(0), u16(0), matrix, u32(W << 16), u32(H << 16)), mdia);
    return box('moov', full('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(durMs), u32(0x10000), u16(0x100), zeros(10), matrix, zeros(24), u32(2)), trak);
  };
  let moov = build(0);
  const dataStart = ftyp.length + moov.length + 8;
  moov = build(dataStart);
  const total = chunks.reduce((a, c) => a + c.d.length, 0);
  return new Blob([new Uint8Array(ftyp), new Uint8Array(moov), new Uint8Array([...u32(8 + total), ...str('mdat')]), ...chunks.map((c) => c.d)], { type: 'video/mp4' });
}`;

/* ページの中で：描いて → VP9 にして → MP4 に入れる。正解（得点・ゴールの位置）も返す */
async function renderInPage(opts) {
  const { segs, fps, W, H, mbps } = opts;
  const game = BS.sim.generate({});
  // リングに当たってから入る／外れるシュートを混ぜる（opts.rim：{ makes, misses } 変える割合）
  const rimPlay = opts.rim ? BS.rimPlay(game, opts.rim) : [];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const rd = BS.Renderer(game, cv, { view: opts.view || 'side', blur: opts.blur || 0 });
  const chunks = []; let err = null;
  const enc = new VideoEncoder({ output: (c) => { const d = new Uint8Array(c.byteLength); c.copyTo(d); chunks.push({ d, key: c.type === 'key' }); }, error: (e) => { err = e; } });
  const cfg = { codec: 'vp09.00.31.08', width: W, height: H, bitrate: mbps * 1e6, framerate: fps, latencyMode: 'realtime' };
  if (!(await VideoEncoder.isConfigSupported(cfg)).supported) return { error: 'このブラウザでは VP9 のエンコードができません' };
  enc.configure(cfg);
  const map = [];
  let off = 0, k = 0;
  const t0 = performance.now();
  for (const s of segs) {
    const n = Math.round((s.b - s.a) * fps);
    map.push({ a: s.a, b: s.a + n / fps, off, n });
    for (let i = 0; i < n && !err; i++, k++) {
      rd.draw(s.a + i / fps);
      const vf = new VideoFrame(cv, { timestamp: Math.round(k * 1e6 / fps) });
      enc.encode(vf, { keyFrame: i === 0 || k % (fps * 2) === 0 });
      vf.close();
      while (enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 2));
      if (k % 90 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    off += n / fps;
  }
  await enc.flush(); enc.close();
  if (err) return { error: String(err.message || err) };
  const toOut = (t) => { const m = map.find((x) => t >= x.a && t < x.b); return m ? +(t - m.a + m.off).toFixed(3) : null; };
  const per = (t) => game.periods.filter((p) => t >= p.t0).length;
  // 正解：シュート（フリースローも）。ブロックされたものはリングに届かないので除く。動画の終わり 2.5 秒以内のものも除く（検出が間に合わない）
  const shots = game.events.filter((e) => (e.type === 'shot' || e.type === 'ft') && !e.blk).map((e) => {
    const m = map.find((x) => e.t >= x.a && e.t < x.b - 2.5);
    if (!m) return null;
    const rp = rimPlay.find((x) => Math.abs(x.t - e.t) < 0.011);
    return { t: +(e.t - m.a + m.off).toFixed(2), src: e.t, team: e.team, made: !!e.made, type: e.type, side: ((e.team === 0) === (per(e.t) <= 2)) ? 1 : 0, half: per(e.t) <= 2 ? 1 : 2, rim: rp ? rp.kind : null };
  }).filter(Boolean);
  // ゴールの位置：カメラがそのゴール側の端まで寄っていて、ボールがゴールから離れているコマ（hoopMark と同じ条件。そのときの枠はどのコマでも同じ）
  // （side 以外のカメラ：カメラがいつも動くので、区間ごとに、よく映っているコマを探してそのコマの枠とリングを使う）
  const marks = (opts.view || 'side') !== 'side' ? [0, 1].map((side) => {
    for (const m of map) {
      const g = rd.markGen(side, m.a + 1, m.b - 1.5);
      if (g) return { side, t: +(m.off + g.t - m.a).toFixed(4), src: g.t, box: g.box, rim: g.rim };
    }
    return null;
  }) : [0, 1].map((side) => {
    const hm = rd.hoopMark(side);
    const edge = side === 0 ? 9.2 : 28 - 9.2, rimX = side === 0 ? 1.575 : 28 - 1.575;
    for (const m of map) {
      for (let i = Math.round(fps); i < m.n - fps; i++) {
        const x = m.a + i / fps;
        if (Math.abs(rd.camX(x) - edge) > 0.02 || Math.abs(rd.camX(x + 0.5) - edge) > 0.02) continue;
        const b = rd.ballAt(x);
        if (Math.abs(b.x - rimX) < 4 || b.z > 2.2) continue;
        return { side, t: +(m.off + i / fps).toFixed(4), src: x, box: hm.box, rim: hm.rim };
      }
    }
    return null;
  });
  // ゴールが画面のどこに映っているか（0.5 秒ごと。リングの中心・幅。カメラの後ろ・画面の外なら null）：ゴールの自動検出の確かめ用
  const rimTrack = [];
  for (const m of map) for (let i = 0; i < m.n; i += Math.round(fps / 2)) {
    const x = m.a + i / fps;
    rimTrack.push([+(m.off + i / fps).toFixed(3)].concat([0, 1].map((side) => { const r = rd.rimAt(side, x); return r && r.cx > 0 && r.cx < W && r.cy > 0 && r.cy < H ? [Math.round(r.cx), Math.round(r.cy), +r.w.toFixed(1)] : null; })));
  }
  window.__blob = window.__mux(chunks, W, H, fps);
  return { view: opts.view || 'side', blur: opts.blur || 0, frames: chunks.length, duration: off, bytes: window.__blob.size, sec: (performance.now() - t0) / 1000, segs: map, shots, marks, rimTrack, teams: game.teams.map((t) => ({ name: t.name, color: t.color })), toOutCheck: toOut(segs[0].a + 1) };
}

async function make(out, segSpec, fps, mbps, rim, view, blur) {
  const segs = String(segSpec || '0-150').split(',').map((s) => { const [a, b] = s.split('-').map(Number); return { a, b }; });
  const srv = await start(0);
  const browser = await chromium.launch({ args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  try {
    const page = await browser.newPage();
    await page.goto(srv.url + 'tests/tools/render.html');
    await page.waitForFunction(() => window.BS && BS.Renderer && BS.sim);
    await page.addScriptTag({ content: MUX + '\nwindow.__mux = mux;' });
    const info = await page.evaluate(renderInPage, { segs, fps: fps || 30, W: 1280, H: 720, mbps: mbps || 4, rim: rim || null, view: view || 'side', blur: blur || 0 });
    if (info.error) throw new Error(info.error);
    // ページの中の動画を、ダウンロードとして受け取る
    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.evaluate(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(window.__blob); a.download = 'game.mp4'; document.body.appendChild(a); a.click(); return 1; })
    ]);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await dl.saveAs(out);
    fs.writeFileSync(out + '.json', JSON.stringify(Object.assign({ file: path.basename(out), fps: fps || 30 }, info), null, 1));
    return Object.assign({ file: out, size: fs.statSync(out).size }, { frames: info.frames, duration: info.duration, sec: info.sec, shots: info.shots.length, made: info.shots.filter((s) => s.made).length, rim: info.shots.filter((s) => s.rim).length, marks: info.marks.map((m) => m && m.t) });
  } finally { await browser.close(); await srv.close(); }
}
module.exports = { make };
if (require.main === module) {
  const out = path.resolve(process.argv[2] || 'game.mp4');
  // 6番目の引数に rim を渡すと、リングに当たるシュートを混ぜる（例：node make-video.cjs out.mp4 0-400 30 4 rim）
  // 8番目の引数は、ボールの動きぶれ（シャッターが開いている秒数。例 0.033＝1/30 秒。暗い体育館をスマホで撮ったつもり）
  make(out, process.argv[3], Number(process.argv[4] || 30), Number(process.argv[5] || 4), process.argv[6] === 'rim' ? { makes: 0.7, misses: 0.6 } : null, process.argv[7] || 'side', Number(process.argv[8] || 0))
    .then((r) => console.log(JSON.stringify(r))).catch((e) => { console.error(e); process.exit(1); });
}
