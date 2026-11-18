// ゴールの自動検出（js/goalfind.js）を、合成映像の正解（動画.mp4.json の rimTrack：0.5 秒ごとのリングの位置）と突き合わせる（検証・調整用）
//   node basket-clips/tests/goalfind-check.cjs <動画.mp4> [調べるコマ数=40] [詳しく=0]
//   コマは動画全体から等間隔（0.5 秒の倍数）に取り出す（ブラウザの画面と同じ）。ffmpeg が必要。
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadBS } = require('./node-run.cjs');

function grab(movie, t, W, H) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-loglevel', 'error', '-ss', String(t), '-i', movie, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const bufs = [];
    p.stdout.on('data', (b) => bufs.push(b));
    p.on('close', () => { const b = Buffer.concat(bufs); resolve(b.length >= W * H * 4 ? new Uint8Array(b.buffer, b.byteOffset, W * H * 4) : null); });
    p.on('error', reject);
  });
}
/* 候補が正解のリングに当たっているか：中心が リング幅の 0.35 倍以内、幅が 0.75〜1.33 倍 */
function hit(c, r) { return r && Math.hypot(c.cx - r[0], c.cy - r[1]) <= 0.35 * r[2] && 2 * c.a >= 0.75 * r[2] && 2 * c.a <= 1.33 * r[2]; }

async function check(movie, n, verbose) {
  const truth = JSON.parse(fs.readFileSync(movie + '.json', 'utf8'));
  const W = 1280, H = 720;
  const BS = loadBS(['core.js', 'vision.js', 'goalfind.js']);
  const G = BS.goalfind;
  const dur = truth.duration;
  const times = [];
  for (let i = 0; i < n; i++) times.push(Math.round(((i + 0.5) * dur / n) * 2) / 2);
  const all = [];
  let vis = 0, found = 0, fpFrames = 0, fpN = 0;
  const t0 = Date.now();
  for (const t of times) {
    const img = await grab(movie, t, W, H);
    if (!img) continue;
    const tr = truth.rimTrack.find((r) => Math.abs(r[0] - t) < 0.01);
    const cands = G.scanFrame(img, W, H, t);
    all.push(...cands);
    const rims = tr ? [tr[1], tr[2]] : [null, null];
    const okIdx = cands.map((c) => rims.findIndex((r) => hit(c, r)));
    rims.forEach((r, i) => { if (r && r[2] >= 14) { vis++; if (okIdx.includes(i)) found++; } });
    const bad = cands.filter((c, j) => okIdx[j] < 0);
    if (bad.length) { fpFrames++; fpN += bad.length; }
    if (verbose) console.log(`${t.toFixed(1).padStart(6)}  正解 ${rims.map((r) => (r ? `[${r[0]},${r[1]} w${r[2]}]` : '-')).join(' ')}  見つけた ${cands.map((c, j) => `${okIdx[j] >= 0 ? 'AB'[okIdx[j]] : '×'}(${Math.round(c.cx)},${Math.round(c.cy)} w${(2 * c.a).toFixed(0)} 輪${c.ring.toFixed(2)} 網${c.net.toFixed(2)})`).join(' ')}`);
  }
  const goals = G.pickGoals(all, 1, W, H);
  console.log(`\n■ ${path.basename(movie)}（${truth.view || 'side'}・${times.length} コマ・${((Date.now() - t0) / 1000).toFixed(0)} 秒）`);
  console.log(`  コマごと：映っていたリング ${vis} のうち ${found} を見つけた（${(100 * found / Math.max(1, vis)).toFixed(0)}%）・まちがいの候補 ${fpN}（${fpFrames} コマ）`);
  const res = goals.map((g) => {
    const tr = truth.rimTrack.find((r) => Math.abs(r[0] - g.t) < 0.01);
    const side = tr ? [tr[1], tr[2]].findIndex((r) => r && Math.hypot(g.rim.cx - r[0], g.rim.cy - r[1]) <= 0.35 * r[2] && g.rim.w >= 0.75 * r[2] && g.rim.w <= 1.33 * r[2]) : -1;
    console.log(`  ゴール候補：${g.t.toFixed(1)} 秒・リング (${Math.round(g.rim.cx)},${Math.round(g.rim.cy)}) 幅 ${g.rim.w.toFixed(0)}・${g.seen} コマで見えた → ${side >= 0 ? '正解のゴール' + 'AB'[side] : '★まちがい'}`);
    return side;
  });
  const ok = res.length === 2 && res[0] >= 0 && res[1] >= 0 && res[0] !== res[1];
  console.log(`  → ${ok ? '両方のゴールを正しく見つけた' : '★両方は見つけられなかった'}`);
  return { ok, goals, vis, found, fpN };
}
/* 自動で見つけたゴールの指定のまま、解析エンジンで得点を探し、正解と比べる */
async function analyse(movie, goals) {
  const { run } = require('./node-run.cjs');
  const truth = JSON.parse(fs.readFileSync(movie + '.json', 'utf8'));
  const marks = goals.map((g, i) => ({ id: 'AB'[i], t: g.t, box: g.box, rim: g.rim }));
  // RESOLVE=0／DEDUPE=0：同じ場所を捉えた追跡の取り消し／両方のゴールの得点の重なりの取り除きをしない（比べるとき用）
  const cfg = {};
  if (process.env.RESOLVE === '0') cfg.resolveSame = false;
  if (process.env.DEDUPE === '0') cfg.dedupe = false;
  const { res } = await run(movie, 0, truth.duration, { marks, cfg });
  // 見つけたゴール i が、正解のどちらのゴールか（その時刻のリングの位置で）
  const sideOf = goals.map((g) => { const tr = truth.rimTrack.find((r) => Math.abs(r[0] - g.t) < 0.01); return tr ? [tr[1], tr[2]].findIndex((r) => r && Math.hypot(g.rim.cx - r[0], g.rim.cy - r[1]) <= 0.5 * r[2]) : -1; });
  const made = truth.shots.filter((s) => s.made && s.t <= truth.duration - 2.5);
  const det = res.shots.filter((s) => s.made);
  const used = new Set();
  let ok = 0;
  const rows = made.map((s) => {
    const k = det.findIndex((d, i) => !used.has(i) && d.t >= s.t - 0.3 && d.t <= s.t + 3 && sideOf[d.hoop] === s.side);
    if (k >= 0) { used.add(k); ok++; }
    return `${s.t.toFixed(1)}${'AB'[s.side]}${k >= 0 ? '○' : '×'}`;
  });
  const extra = det.filter((d, i) => !used.has(i)).map((d) => d.t.toFixed(1));
  console.log(`  自動のゴールの指定で解析：得点 ${made.length} 本のうち ${ok} 本（ゴールも正しい）・正解にない得点 ${extra.length}  [${rows.join(' ')}]${extra.length ? ' 余分:' + extra.join(',') : ''}`);
  return { ok, n: made.length, extra: extra.length };
}
module.exports.analyse = analyse;
module.exports = { check };
if (require.main === module) {
  const movie = path.resolve(process.argv[2]);
  check(movie, Number(process.argv[3] || 40), process.argv[4] === '1').then((r) => (process.argv[5] === 'run' && r.goals.length ? analyse(movie, r.goals) : null)).catch((e) => { console.error(e); process.exit(1); });
}
