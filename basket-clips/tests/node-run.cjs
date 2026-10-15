// 動画の一部分を ffmpeg で読み、解析エンジン（ゴールの追跡からシュートの判定まで）を node でそのまま動かす（検証・調整用）
//   node basket-clips/tests/node-run.cjs <動画.mp4> <t0> <t1> [trace]
//   ゴールの指定は 動画.mp4.json（make-video.cjs が作る正解）の marks を使う。trace を付けると、コマごとのゴールの追跡の様子を表示する。
//   ブラウザ（WebCodecs ＋ Canvas）と、コマの縮め方が少し違うだけで、計算は同じ（auto.js の createAnalyzer）。
//   ffmpeg が必要。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');

function loadBS(files) {
  const ctx = { console, Math, Date, JSON, Uint8Array, Int16Array, Int32Array, Float32Array, Float64Array, Uint8ClampedArray, Array, Object, Number, String, Infinity, NaN };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  return ctx.BS;
}

/* t0〜t1 を 15 コマ/秒で読む（RGBA）。onFrame(t, data) */
function readFrames(movie, W, H, t0, t1, fps, onFrame) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-loglevel', 'error', '-ss', String(t0), '-i', movie, '-t', String(t1 - t0), '-vf', `fps=${fps}`, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const size = W * H * 4;
    let buf = Buffer.alloc(0), n = 0;
    p.stdout.on('data', (chunk) => {
      buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
      while (buf.length >= size) {
        onFrame(t0 + n / fps, new Uint8Array(buf.buffer, buf.byteOffset, size));
        n++;
        buf = buf.subarray(size);
      }
    });
    p.on('close', () => resolve(n));
    p.on('error', reject);
  });
}

async function run(movie, t0, t1, opts) {
  opts = opts || {};
  const truth = JSON.parse(fs.readFileSync(movie + '.json', 'utf8'));
  const W = 1280, H = 720;
  const BS = opts.BS || loadBS(['core.js', 'vision.js', 'auto.js']);      // opts.BS：中身を包んで記録したいとき（検証用）
  const V = BS.vision, A = BS.auto;
  let marks = opts.marks || truth.marks.filter(Boolean);      // opts.marks：ゴールの指定を差し替える（自動で見つけたものなど）
  // opts.boxFromRim：板の枠を、リングから決めた枠にする（リングをなぞるだけの指定・自動で見つけたゴールと同じ）
  if (opts.boxFromRim) { const G = loadBS(['core.js', 'vision.js', 'goalfind.js']).goalfind; marks = marks.map((m) => Object.assign({}, m, { box: G.boxFromRim(m.rim, W, H) })); }
  const an = A.createAnalyzer(Object.assign({ srcW: W, srcH: H, hoops: marks.map((m, i) => ({ id: 'AB'[i], box: m.box, rim: m.rim })) }, opts.cfg || {}));
  const bufs = {};
  const patcher = (data) => (cx, cy, size, outSize) => V.extractPatch(data, W, H, cx, cy, size, outSize, 'rgba', bufs[outSize] || (bufs[outSize] = new Uint8Array(outSize * outSize * 3)));
  for (let i = 0; i < marks.length; i++) {
    let done = false;
    await readFrames(movie, W, H, marks[i].t, marks[i].t + 0.05, 30, (t, data) => {
      if (done) return;
      done = true;
      const f = A.prepFrame(data, W, H, 'rgba');
      an.initHoop(i, f.gray.data, f.gray.w, f.gray.h, patcher(data));
    });
  }
  const trace = [];
  await readFrames(movie, W, H, t0, t1, 15, (t, data) => {
    const f = A.prepFrame(data, W, H, 'rgba');
    const live = an.process({ t, gray: f.gray, quarter: f.quarter, getPatch: patcher(data) });
    if (opts.trace) trace.push({ t, st: live.status.map((s) => ({ tr: s.tracked && s.inFrame, acq: s.acquired, sc: +s.score.toFixed(2), rs: s.rimScore == null ? null : +s.rimScore.toFixed(2), rim: [Math.round(s.rim.cx), Math.round(s.rim.cy), +s.rim.w.toFixed(1)], occ: !!s.occluded })) });
  });
  const res = an.finish();
  return { res, trace, truth };
}
module.exports = { run, loadBS };

if (require.main === module) {
  const movie = path.resolve(process.argv[2]);
  const t0 = Number(process.argv[3] || 0), t1 = Number(process.argv[4] || 60);
  const tr = process.argv[5] === 'trace';
  const started = Date.now();
  // FASTSCALE=0：倍率の追従をもとの動き（2コマに1回・1段ずつ）に。比べるとき用
  const cfg = {};
  if (process.env.FASTSCALE === '0') cfg.fastScale = false;
  // BOXFROMRIM=1：板の枠をリングから決める
  run(movie, t0, t1, { trace: tr, cfg, boxFromRim: process.env.BOXFROMRIM === '1' }).then(({ res, trace, truth }) => {
    if (tr) trace.forEach((x) => console.log(x.t.toFixed(2) + '  ' + x.st.map((s, i) => `${'AB'[i]}:${s.tr ? '○' : '・'}${s.acq ? '取' : ''}${s.occ ? '隠' : ''} 板${s.sc} 輪${s.rs == null ? '-' : s.rs} @${s.rim.join(',')}`).join('   ')));
    const sh = truth.shots.filter((s) => s.t >= t0 && s.t <= t1 - 2.5);
    console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} 秒。検出：` + res.shots.map((s) => `${s.t.toFixed(1)}${s.made ? '得点' : '外れ'}${'AB'[s.hoop]}`).join(' '));
    console.log('正解：' + sh.map((s) => `${s.t.toFixed(1)}${s.made ? '得点' : '外れ'}${'AB'[s.side]}${s.rim ? '(' + s.rim + ')' : ''}`).join(' '));
  }).catch((e) => { console.error(e); process.exit(1); });
}
