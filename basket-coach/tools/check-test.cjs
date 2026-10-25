#!/usr/bin/env node
/* 動画チェック（js/check.js ＋ js/analyze.js）の通しの検査。本物の AI（MediaPipe）で、作った動画を画面からしらべる。
   使い方：NODE_PATH=$(npm root -g) node tools/check-test.cjs [--regen] [--only=shoot,dribble,landing,defense,two,team,ui] [--gpu]
   ・AI の部品：本番は jsdelivr・storage.googleapis.com から読む。検査では tools/_out/mediapipe/ に1回だけ取ってきて、そこから出す
     （npm と curl を使う。MP_DIR で場所をかえられる）。
   ・動画：アニメーションの人（BC.motionSVG。シュート・ドリブル・着地・スライド・2人）と、写真の人を ななめのコートに置いたチームの動画を作る
     （tools/_out/check-media/。--regen で作りなおす）。
   ・画面の写真：tools/_out/check-*.png（幅 390px。ライト・ダーク）
   ・終了コード：まちがいがあれば 1 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tools', '_out');
const MEDIA = path.join(OUT, 'check-media');
const MP = process.env.MP_DIR || path.join(OUT, 'mediapipe');
const args = process.argv.slice(2);
const REGEN = args.includes('--regen');
const GPU = args.includes('--gpu');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const want = (k) => !ONLY.length || ONLY.includes(k);
fs.mkdirSync(MEDIA, { recursive: true });

let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) { passes++; console.log('  ✓ ' + msg); } else { fails++; console.log('  ✗ ' + msg); } };

/* ---------- AI の部品（1回だけ取ってくる） ---------- */
function ensureMP() {
  fs.mkdirSync(path.join(MP, 'models'), { recursive: true });
  fs.mkdirSync(path.join(MP, 'img'), { recursive: true });
  if (!fs.existsSync(path.join(MP, 'package', 'vision_bundle.mjs'))) {
    console.log('… MediaPipe（@mediapipe/tasks-vision@0.10.21）を取ってきます');
    execSync(`npm pack @mediapipe/tasks-vision@0.10.21 --pack-destination "${MP}"`, { stdio: 'ignore' });
    execSync(`tar xzf "${path.join(MP, 'mediapipe-tasks-vision-0.10.21.tgz')}" -C "${MP}"`);
  }
  const files = {
    'models/pose_landmarker_lite.task': 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    'models/efficientdet_lite0.tflite': 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
    'img/male_full_height_hands.jpg': 'https://storage.googleapis.com/mediapipe-assets/male_full_height_hands.jpg',
  };
  for (const [rel, url] of Object.entries(files)) {
    const p = path.join(MP, rel);
    if (!fs.existsSync(p)) { console.log('… ' + rel); execSync(`curl -sSfL -o "${p}" "${url}"`); }
  }
}

/* ---------- 小さなサーバー（Range 対応：動画のシークに必要） ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.webm': 'video/webm', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const p = u.startsWith('/__media/') ? path.join(MEDIA, u.slice(9)) : u.startsWith('/__mp/') ? path.join(MP, u.slice(6)) : path.join(ROOT, u);
      if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      const size = fs.statSync(p).size, ct = TYPES[path.extname(p)] || 'application/octet-stream';
      const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
      if (m) {
        const a = +m[1], z = m[2] ? +m[2] : size - 1;
        res.writeHead(206, { 'Content-Type': ct, 'Content-Range': `bytes ${a}-${z}/${size}`, 'Content-Length': z - a + 1, 'Accept-Ranges': 'bytes' });
        return fs.createReadStream(p, { start: a, end: z }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': ct, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, () => resolve(srv));
  });
}
async function routeAI(ctx) {
  await ctx.route('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/**', (r) => {
    const rel = r.request().url().split('tasks-vision@0.10.21/')[1].split('?')[0];
    r.fulfill({ path: path.join(MP, 'package', rel), contentType: TYPES[path.extname(rel)] || 'application/octet-stream' });
  });
  await ctx.route('https://storage.googleapis.com/mediapipe-models/**', (r) => r.fulfill({ path: path.join(MP, 'models', r.request().url().split('/').pop()), contentType: 'application/octet-stream' }));
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
}

/* ---------- 検査のページ（app.js の代わりに、小さな ctx とハッシュの切りかえ） ---------- */
const indexHTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SCRIPTS = [...indexHTML.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => f !== 'js/app.js' && fs.existsSync(path.join(ROOT, f)));
// coach.css の共通部品がまだなくても見られるように（coach.css があれば、そちらが勝つ）
const SHIM = `.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:10px 18px;border-radius:999px;border:1px solid var(--line-2);background:var(--sheet);font-weight:700;font-family:var(--font-round);color:var(--ink);text-decoration:none;font-size:var(--fs-m)}.btn.primary{background:var(--ball);border-color:var(--ball);color:var(--ball-ink)}.btn.big{width:100%;min-height:56px;font-size:var(--fs-l)}.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-2);background:var(--sheet);border-radius:999px;padding:6px 12px;font-size:var(--fs-s);color:var(--ink)}.chip[aria-pressed=true]{background:var(--ink);color:var(--sheet);border-color:var(--ink)}.sec-h{font-family:var(--font-round);font-size:var(--fs-l);font-weight:800;margin:0}`;
const PAGE = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${SHIM}</style><link rel="stylesheet" href="/css/coach.css"><link rel="stylesheet" href="/css/check.css">
<style>body{margin:0;background:var(--board)}#app{max-width:44rem;margin:0 auto;padding:16px 16px 40px}</style></head>
<body><main id="app"></main>
${SCRIPTS.map((f) => `<script src="/${f}"></script>`).join('\n')}
<script>
  window.T = { toasts: [], opens: [], xp: [] };
  ${GPU ? '' : "BC.analyze.cfg.delegate = 'CPU';"}
  const ctx = { open: (id) => T.opens.push(id), toast: (m) => T.toasts.push(m), addXP: (s, n, w) => T.xp.push([s, n, w]),
    store: { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) },
    profile: { name: 'テスト', grade: 'e5' } };
  function route() {
    const h = location.hash.replace(/^#/, '').split('/');
    const opt = h[1] === 'rec' ? { record: decodeURIComponent(h[2] || '') } : h[1] ? { mode: h[1] } : {};
    BC.check.render(document.getElementById('app'), ctx, opt);
  }
  addEventListener('hashchange', route); route();
</script></body></html>`;
const GEN_PAGE = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/coach.css">
<style>body{margin:0;background:#fff}#st{overflow:hidden;background:var(--sheet-2)}#st svg{display:block;width:100%;height:100%}</style></head>
<body><div id="st"></div><canvas id="cv"></canvas>${SCRIPTS.map((f) => `<script src="/${f}"></script>`).join('')}</body></html>`;

/* ---------- 動画を作る：アニメーションの人 ---------- */
const CLIPS = [
  { name: 'shoot', id: 'shoot', secs: 2.6, box: [-1.4, 2.13, -0.05, 2.6], size: [640, 480] },
  { name: 'shoot-stiff', id: 'shoot', mk: 'stiff', secs: 2.6, box: [-1.4, 2.13, -0.05, 2.6], size: [640, 480] },
  { name: 'pound', id: 'pound', secs: 4, box: [-1.25, 1.45, -0.05, 1.98], size: [640, 480] },
  { name: 'pound-tall', id: 'pound', mk: 'tall', secs: 4, box: [-1.25, 1.45, -0.05, 1.98], size: [640, 480] },
  { name: 'landing', id: 'landing-front', secs: 2, box: [-1, 1, -0.05, 2.6], size: [480, 640] },
  { name: 'landing-kneein', id: 'landing-front', mk: 'kneein', secs: 2, box: [-1, 1, -0.05, 2.6], size: [480, 640] },
  { name: 'defslide', id: 'defslide', secs: 6, box: [-1.4, 1.4, -0.1, 2.0], size: [640, 480] },
  { name: 'two', id: 'pound', two: true, secs: 3, box: [-2.0, 2.0, -0.05, 2.95], size: [640, 480] },
];
async function genClips(page) {
  for (const c of CLIPS) {
    const webm = path.join(MEDIA, c.name + '.webm');
    if (fs.existsSync(webm) && !REGEN) continue;
    const ok2 = await page.evaluate((id) => !!BC.motions[id], c.id);
    if (!ok2) { console.log('  （動き ' + c.id + ' がないので ' + c.name + ' は作らない）'); continue; }
    const dir = path.join(MEDIA, '_f-' + c.name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir);
    await page.evaluate(([w, h]) => { const st = document.getElementById('st'); st.style.width = w + 'px'; st.style.height = h + 'px'; }, c.size);
    const fps = 30;
    const n = Math.round(c.secs * fps);
    const el = await page.$('#st');
    for (let i = 0; i < n; i++) {
      await page.evaluate(([c, sec]) => {
        const clip = BC.motions[c.id];
        clip.fade = false; // つなぎ目で消えない（はじめのコマから人がいる）
        const m = (clip.mistakes || []).find((x) => x.id === c.mk);
        const t = (sec / clip.dur) % 1;
        const st = document.getElementById('st');
        if (!c.two) { st.innerHTML = BC.motionSVG(c.id, t, { box: c.box, mods: m ? m.mods : null }); return; }
        const [x0, x1, y0, y1] = c.box;
        const a = BC.motionDraw(clip, t).svg, b = BC.motionDraw(clip, (t + 0.37) % 1).svg;
        st.innerHTML = `<svg viewBox="${x0} ${-y1} ${x1 - x0} ${y1 - y0}"><rect class="mo-floor" x="${x0}" y="0" width="${x1 - x0}" height="0.3"/><g transform="translate(-1.05 0)">${a}</g><g transform="translate(0.95 0)">${b}</g></svg>`;
      }, [c, i / fps]);
      await el.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
    }
    execSync(`ffmpeg -y -loglevel error -framerate ${fps} -i "${dir}/f%04d.png" -c:v libvpx -b:v 1500k -pix_fmt yuv420p "${webm}"`);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('  動画：' + c.name + '.webm');
  }
}

/* ---------- 動画を作る：チーム（写真の人を、ななめから見たコートに） ---------- */
// 本当の位置（コートの m）。ページの中でも Node でも同じ関数を使う
const GT_SRC = `(function (t) {
  const off = [[-6.2, 1.3], [6.2, 1.3], [-4.7, 6.3], [4.7, 6.3], [0.3, 8.6]];
  const out = [];
  off.forEach(([x, y], i) => { const a = t * 0.8 + i * 1.3; out.push({ x: x + 0.7 * Math.cos(a), y: y + 0.45 * Math.sin(a), team: 0 }); });
  off.forEach(([x, y], i) => {
    const o = out[i], dx = 0 - o.x, dy = 1.575 - o.y, d = Math.hypot(dx, dy) || 1;
    // 守り：攻めとゴールの間（1.7m ゴールより）、少し横へ
    out.push({ x: o.x + (dx / d) * 1.7 + (-dy / d) * 0.9, y: o.y + (dy / d) * 1.7 + (dx / d) * 0.9, team: 1 });
  });
  return out;
})`;
const GT = eval(GT_SRC);
const TEAM = { W: 960, H: 540, fps: 10, secs: 12, court: [[-7.5, 0], [7.5, 0], [7.5, 14], [-7.5, 14]], img: [[150, 92], [810, 92], [940, 520], [20, 520]] };
async function genTeam(page) {
  const webm = path.join(MEDIA, 'team.webm');
  if (fs.existsSync(webm) && !REGEN) return;
  const dir = path.join(MEDIA, '_f-team');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir);
  // 人の絵（切りぬき・ユニフォームの色）を作る。切りぬきは、まわりのふちから「背景の色に近い所」を広げて、のこりを人にする
  // （この検査の環境では MediaPipe の切りぬき（segmentation）が動かないので、自分で）。骨格から遠い所は のぞく。
  await page.evaluate(async ([T, GT_SRC]) => {
    const { FilesetResolver, PoseLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
    const fs = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
    const pl = await PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'CPU' }, runningMode: 'IMAGE', numPoses: 1 });
    const im = new Image(); im.src = '/__mp/img/male_full_height_hands.jpg'; await im.decode();
    const W = im.naturalWidth, H = im.naturalHeight;
    const lm = pl.detect(im).landmarks[0].map((q) => [q.x * W, q.y * H]);
    pl.close();
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    const g = base.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const medc = (idx) => { const r = [], g2 = [], b2 = []; for (const i of idx) { r.push(d[i * 4]); g2.push(d[i * 4 + 1]); b2.push(d[i * 4 + 2]); } const m = (a) => a.sort((u, v) => u - v)[a.length >> 1]; return [m(r), m(g2), m(b2)]; };
    const xs = [...Array(W).keys()], ys = [...Array(H).keys()];
    const refs = [medc(xs), medc(xs.map((x) => (H - 1) * W + x)), medc(ys.map((y) => y * W)), medc(ys.map((y) => y * W + W - 1))];
    const nearBG = (i) => refs.some((c) => Math.hypot(d[i * 4] - c[0], d[i * 4 + 1] - c[1], d[i * 4 + 2] - c[2]) < 60);
    const dist = (a, b) => Math.hypot(d[a * 4] - d[b * 4], d[a * 4 + 1] - d[b * 4 + 1], d[a * 4 + 2] - d[b * 4 + 2]);
    const bg = new Uint8Array(W * H), q = [];
    for (const x of xs) q.push(x, (H - 1) * W + x);
    for (const y of ys) q.push(y * W, y * W + W - 1);
    for (const i of q) bg[i] = 1;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (!bg[j] && dist(i, j) < 14 && nearBG(j)) { bg[j] = 1; q.push(j); }
      }
    }
    // 骨格の線から遠い所（床の線・かべの影）は人ではない
    const SEG = [[0, 11], [0, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30]];
    const R = H * 0.075;
    const segD = (x, y, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(x - a[0] - vx * t, y - a[1] - vy * t); };
    const poly = [lm[11], lm[12], lm[24], lm[23]];
    const cx = poly.reduce((s, p) => s + p[0], 0) / 4, cy = poly.reduce((s, p) => s + p[1], 0) / 4;
    const big = poly.map(([x, y]) => [cx + (x - cx) * 1.25, cy + (y - cy) * 1.12]);
    const inside = (x, y) => { let c = false; for (let i = 0, j = 3; i < 4; j = i++) { const [xi, yi] = big[i], [xj, yj] = big[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const fg = new Uint8Array(W * H);
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let i = 0; i < W * H; i++) {
      if (bg[i]) continue;
      const x = i % W, y = (i / W) | 0;
      if (!SEG.some(([a, b]) => segD(x, y, lm[a], lm[b]) < (a === 0 ? R * 1.3 : R))) continue;
      fg[i] = 1; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const make = (col) => {
      const out = new ImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        let rr = d[i * 4], gg = d[i * 4 + 1], bb = d[i * 4 + 2];
        const x = i % W, y = (i / W) | 0, lum = 0.3 * rr + 0.59 * gg + 0.11 * bb;
        if (fg[i] && lum < 120 && inside(x, y)) { const k = 0.55 + (lum / 120) * 0.9; rr = Math.min(255, col[0] * k); gg = Math.min(255, col[1] * k); bb = Math.min(255, col[2] * k); }
        out.data[i * 4] = rr; out.data[i * 4 + 1] = gg; out.data[i * 4 + 2] = bb; out.data[i * 4 + 3] = fg[i] ? 255 : 0;
      }
      const t = document.createElement('canvas'); t.width = W; t.height = H; t.getContext('2d').putImageData(out, 0, 0);
      const c = document.createElement('canvas'); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
      c.getContext('2d').drawImage(t, -x0, -y0);
      return c;
    };
    window.SPR = [make([38, 78, 205]), make([214, 42, 52])];
    window.GT = eval(GT_SRC);
    window.HC = BC.analyze.homography(T.court, T.img); // コート → 画面
  }, [TEAM, GT_SRC]);
  const n = TEAM.fps * TEAM.secs;
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate(([T, t]) => {
      const cv = document.getElementById('cv'); cv.width = T.W; cv.height = T.H;
      const g = cv.getContext('2d');
      const P = (p) => BC.analyze.applyH(HC, p);
      // 体育館（かべ・床・線）
      g.fillStyle = '#6d6a66'; g.fillRect(0, 0, T.W, T.H);
      g.fillStyle = '#8c7a62'; g.fillRect(0, 70, T.W, T.H);
      const poly = (pts, fill) => { g.beginPath(); pts.map(P).forEach((q, k) => (k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fillStyle = fill; g.fill(); };
      poly([[-9, -1.5], [9, -1.5], [9, 15], [-9, 15]], '#b98d5a');
      poly([[-7.5, 0], [7.5, 0], [7.5, 14], [-7.5, 14]], '#d9b07a');
      poly([[-2.45, 0], [2.45, 0], [2.45, 5.8], [-2.45, 5.8]], '#c4823f');
      g.strokeStyle = '#f7f3ea'; g.lineWidth = 2.2;
      const line = (pts) => { g.beginPath(); pts.map(P).forEach((q, k) => (k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); };
      const arc = (cx, cy, r, a0, a1) => { const o = []; for (let k = 0; k <= 40; k++) { const a = a0 + ((a1 - a0) * k) / 40; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
      line([[-7.5, 0], [7.5, 0], [7.5, 14], [-7.5, 14], [-7.5, 0]]);
      line([[-2.45, 0], [-2.45, 5.8], [2.45, 5.8], [2.45, 0]]);
      line(arc(0, 5.8, 1.8, 0, Math.PI * 2));
      const yj = 1.575 + Math.sqrt(6.75 * 6.75 - 6.6 * 6.6);
      line([[-6.6, 0], ...arc(0, 1.575, 6.75, Math.atan2(yj - 1.575, -6.6), Math.atan2(yj - 1.575, 6.6)), [6.6, 0]]);
      line(arc(0, 14, 1.8, Math.PI, 2 * Math.PI));
      // ゴール
      const rim = P([0, 1.575]), bd = P([0, 1.2]);
      g.fillStyle = '#fff'; g.fillRect(bd[0] - 34, bd[1] - 78, 68, 42); g.strokeStyle = '#333'; g.lineWidth = 2; g.strokeRect(bd[0] - 34, bd[1] - 78, 68, 42);
      g.strokeStyle = '#e0601c'; g.lineWidth = 3; g.beginPath(); g.ellipse(rim[0], rim[1] - 52, 13, 4, 0, 0, Math.PI * 2); g.stroke();
      // 人（遠い人から描く）
      const ps = GT(t).map((p) => { const f = P([p.x, p.y]), f2 = P([p.x + 0.5, p.y]); const s = Math.hypot(f2[0] - f[0], f2[1] - f[1]) / 0.5; return { f, h: 1.78 * s, team: p.team }; }).sort((a, b) => a.f[1] - b.f[1]);
      for (const p of ps) {
        const spr = SPR[p.team];
        const w = (spr.width / spr.height) * p.h;
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(p.f[0], p.f[1], w * 0.35, p.h * 0.03, 0, 0, Math.PI * 2); g.fill();
        g.drawImage(spr, p.f[0] - w / 2, p.f[1] - p.h, w, p.h);
      }
      return cv.toDataURL('image/jpeg', 0.9);
    }, [TEAM, i / TEAM.fps]);
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  execSync(`ffmpeg -y -loglevel error -framerate ${TEAM.fps} -i "${dir}/f%04d.jpg" -c:v libvpx -b:v 2500k -pix_fmt yuv420p "${webm}"`);
  fs.copyFileSync(path.join(dir, 'f0000.jpg'), path.join(OUT, 'check-team-frame.jpg'));
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('  動画：team.webm');
}

/* ---------- 画面の流れ ---------- */
const STEP = (s) => `.ck[data-step="${s}"]`;
async function startMode(page, mode) {
  await page.evaluate((m) => { BC.check._reset(); location.hash = '#check/' + m; if (location.hash === '#check/' + m) dispatchEvent(new HashChangeEvent('hashchange')); }, mode);
  await page.waitForSelector(STEP('how'));
}
async function selfFlow(page, mode, file, opt = {}) {
  await startMode(page, mode);
  await page.setInputFiles('.ck-file-input', path.join(MEDIA, file));
  await page.waitForSelector(STEP('range'), { timeout: 20000 });
  if (opt.shotRange) await page.screenshot({ path: path.join(OUT, opt.shotRange), fullPage: true });
  await page.click('[data-ck="go"]');
  if (opt.pickAt) {
    await page.waitForSelector(`${STEP('person')} .ck-tapzone canvas`, { timeout: 120000 });
    if (opt.shotPick) await page.screenshot({ path: path.join(OUT, opt.shotPick), fullPage: true });
    const box = await (await page.$('.ck-tapzone canvas')).boundingBox();
    await page.mouse.click(box.x + box.width * opt.pickAt[0], box.y + box.height * opt.pickAt[1]);
  }
  if (opt.abort) {
    await page.waitForSelector(STEP('run'), { timeout: 120000 });
    await page.waitForFunction(() => /コマ\s*[1-9]/.test((document.querySelector('.ck-prog') || {}).textContent || ''), null, { timeout: 60000 });
    await page.click('[data-ck="stop"]');
    await page.waitForSelector(STEP('range'), { timeout: 20000 });
    return { aborted: true, toasts: await page.evaluate(() => T.toasts.slice()) };
  }
  if (opt.shotRun) {
    await page.waitForSelector(STEP('run'), { timeout: 120000 });
    await page.waitForFunction(() => /コマ\s*[1-9]\d/.test((document.querySelector('.ck-prog') || {}).textContent || ''), null, { timeout: 60000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, opt.shotRun), fullPage: true });
  }
  const t0 = Date.now();
  await page.waitForSelector(STEP('result'), { timeout: 240000 });
  const secs = (Date.now() - t0) / 1000;
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const S = BC.check._state(), R = S.result;
    const hipX = R.tracked.filter(Boolean).map((lm) => (lm[23][0] + lm[24][0]) / 2).sort((a, b) => a - b);
    return { ok: R.res.ok, msg: R.res.msg, view: R.res.view, score: R.score, notes: R.res.notes || [], metrics: (R.res.metrics || []).map((m) => [m.key, m.status, m.value]), seen: R.tracked.filter(Boolean).length, n: R.tracked.length, W: R.W, hipX: hipX[hipX.length >> 1] };
  });
  r.secs = secs;
  if (process.env.DUMP) console.log(await page.evaluate(() => { const R = BC.check._state().result; const F = R.res.series || []; return F.map((f, i) => f ? [i, R.times[i].toFixed(2), 'hip', f.hipH.toFixed(2), 'wr', f.wrist.r.toFixed(2), f.wrist.l.toFixed(2), 'head', f.headH.toFixed(2), 'sh', f.shH.toFixed(2), 'el', Math.round(f.elbowR), Math.round(f.elbowL), 'kn', Math.round(f.kneeL), Math.round(f.kneeR)].join(' ') : i + ' -').join('\n') + '\nkeys ' + JSON.stringify(R.res.keys) + ' hand ' + R.res.hand; }));
  console.log(`  ${file}: ${r.ok ? r.metrics.map((m) => `${m[0]}=${m[2]}(${m[1]})`).join(' ') : '× ' + r.msg}  ［人 ${r.seen}/${r.n}コマ・${secs.toFixed(1)}秒］`);
  return r;
}
const stOf = (r, k) => ((r.metrics || []).find((m) => m[0] === k) || [])[1];

(async () => {
  ensureMP();
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  const errors = [];
  const watch = (page) => {
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/XNNPACK|GL Driver|TensorFlow|OpenGL|gl_context|favicon/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  };

  // 1. 動画を作る
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
    await routeAI(ctx);
    await ctx.route(base + '/__gen.html', (r) => r.fulfill({ body: GEN_PAGE, contentType: 'text/html' }));
    const page = await ctx.newPage();
    watch(page);
    await page.goto(base + '/__gen.html');
    console.log('■ 動画を作る');
    await genClips(page);
    if (want('team')) await genTeam(page);
    await ctx.close();
  }

  // 2. 画面で しらべる（スマホの幅）
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await routeAI(ctx);
  await ctx.route(base + '/__check.html', (r) => r.fulfill({ body: PAGE, contentType: 'text/html' }));
  const page = await ctx.newPage();
  watch(page);
  await page.goto(base + '/__check.html#check');
  await page.waitForSelector(STEP('home'));

  if (want('ui')) {
    console.log('■ 入口');
    await page.screenshot({ path: path.join(OUT, 'check-home.png'), fullPage: true });
    ok(await page.$$eval('.ck-mode', (b) => b.length) === 6, '入口：6つのカード（じぶん5・チーム1）');
    ok(await page.$eval('.ck-privacy', (e) => /どこにも/.test(e.textContent)), '入口：動画を送らないことを書いている');
    const small = await page.$$eval('button, .btn, label.btn, a', (els) => els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height)));
    ok(!small.length, '入口：押す所の高さ 44px 以上 ' + small.join(' '));
    await page.click('[data-mode="shoot"]');
    await page.waitForSelector(STEP('how'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, 'check-how.png'), fullPage: true });
    ok(await page.$('.ck-model .mo-stage svg') != null, 'とり方：見本のアニメーション');
    // 動画でないファイル
    fs.writeFileSync(path.join(MEDIA, 'not-video.webm'), 'これは動画ではありません');
    await page.setInputFiles('.ck-file-input', path.join(MEDIA, 'not-video.webm'));
    await page.waitForSelector('.ck-err', { timeout: 15000 });
    ok(/開けません/.test(await page.$eval('.ck-err', (e) => e.textContent)), '動画でないファイル → やさしい言葉で ことわる');
  }

  if (want('shoot')) {
    console.log('■ シュート（横から）');
    const good = await selfFlow(page, 'shoot', 'shoot.webm', { shotRange: 'check-range.png', shotRun: 'check-run.png' });
    await page.screenshot({ path: path.join(OUT, 'check-result-shoot.png'), fullPage: true });
    ok(good.ok && good.view === 'side', 'シュート：分析できた（横から）');
    ok(good.seen >= good.n * 0.8, `シュート：人が ${good.seen}/${good.n} コマで見つかった`);
    ok(stOf(good, 'dip') === 'good', 'シュート：よい形 → ひざの曲げ ◎');
    ok(stOf(good, 'follow') === 'good', 'シュート：よい形 → フォロースルー ◎');
    ok(good.score >= 60, 'シュート：よい形の点数 ' + good.score);
    const stiff = await selfFlow(page, 'shoot', 'shoot-stiff.webm');
    ok(stOf(stiff, 'dip') === 'bad', 'シュート：ひざを使わない → ひざの曲げ △');
    ok(stiff.score < good.score, `シュート：点数 よい形 ${good.score} ＞ ひざを使わない ${stiff.score}`);
    // 結果の画面の部品
    ok(await page.$$eval('.ck-key', (b) => b.length) >= 3, '結果：場面ボタン');
    ok(await page.$$eval('.ck-chart', (b) => b.length) >= 2, '結果：グラフ（1つに1つの量）');
    ok(await page.$('.ck-model2 .mo-stage svg') != null, '結果：見本とくらべる');
    await page.click('.ck-key >> nth=1');
    await page.waitForTimeout(500);
    const cur = await page.evaluate(() => { const S = BC.check._state(); return [S.video.currentTime, S.result.times[S.result.res.keys[1].i]]; });
    ok(Math.abs(cur[0] - cur[1]) < 0.05, '結果：場面ボタン → 動画がその場面へ');
    const links = await page.$$('.ck-link');
    if (links.length) { await links[0].click(); ok((await page.evaluate(() => T.opens.length)) > 0, '結果：おすすめ練習 → ctx.open'); }
    ok((await page.evaluate(() => T.xp.length)) >= 2, '結果：けいけんち（addXP）');
  }

  if (want('dribble')) {
    console.log('■ ドリブル（横から）');
    const good = await selfFlow(page, 'dribble', 'pound.webm');
    ok(stOf(good, 'low') === 'good', 'ドリブル：よい形 → 腰の低さ ◎');
    const tall = await selfFlow(page, 'dribble', 'pound-tall.webm');
    ok(stOf(tall, 'low') !== 'good', 'ドリブル：腰が高い → ◎ にならない（' + (tall.metrics.find((m) => m[0] === 'low') || [])[2] + '）');
    const ab = await selfFlow(page, 'dribble', 'pound.webm', { abort: true });
    ok(ab.toasts.includes('やめました'), 'ドリブル：とちゅうで やめられる');
  }

  if (want('landing')) {
    console.log('■ 着地（前から・たて長の動画）');
    const good = await selfFlow(page, 'landing', 'landing.webm');
    await page.screenshot({ path: path.join(OUT, 'check-result-landing.png'), fullPage: true });
    ok(good.ok && good.view === 'front', '着地：前からと分かる');
    ok(stOf(good, 'knee-in') === 'good', '着地：よい形 → ひざ ◎');
    const kin = await selfFlow(page, 'landing', 'landing-kneein.webm');
    ok(stOf(kin, 'knee-in') !== 'good', '着地：ひざが内に入る → ◎ にならない');
  }

  if (want('defense')) {
    console.log('■ ディフェンスのスライド（前から）');
    const good = await selfFlow(page, 'defense', 'defslide.webm');
    ok(good.ok && good.view === 'front', 'スライド：前からと分かる');
    ok(stOf(good, 'low') === 'good' && stOf(good, 'wide') === 'good', 'スライド：腰の低さ・足の幅 ◎');
  }

  if (want('two')) {
    console.log('■ 2人のうち、右の人をえらぶ');
    const r = await selfFlow(page, 'dribble', 'two.webm', { pickAt: [0.74, 0.62], shotPick: 'check-person.png' });
    ok(r.ok && r.hipX > r.W * 0.55, `2人：えらんだ右の人を しらべた（腰の位置 ${Math.round(r.hipX)} / ${r.W}）`);
  }

  if (want('team')) {
    console.log('■ チームの動き');
    await startMode(page, 'team');
    await page.screenshot({ path: path.join(OUT, 'check-how-team.png'), fullPage: true });
    await page.setInputFiles('.ck-file-input', path.join(MEDIA, 'team.webm'));
    await page.waitForSelector(STEP('range'), { timeout: 20000 });
    await page.click('[data-ck="go"]');
    await page.waitForSelector('.ck-calc', { timeout: 30000 });
    // ペイントの4つの角（本当の位置 → 画面の点）をタップ
    const Hc = await page.evaluate(([c, i]) => BC.analyze.homography(c, i), [TEAM.court, TEAM.img]);
    const proj = (p) => { const w = Hc[6] * p[0] + Hc[7] * p[1] + Hc[8]; return [(Hc[0] * p[0] + Hc[1] * p[1] + Hc[2]) / w, (Hc[3] * p[0] + Hc[4] * p[1] + Hc[5]) / w]; };
    const corners = [[-2.45, 0], [2.45, 0], [2.45, 5.8], [-2.45, 5.8]].map(proj);
    for (let k = 0; k < 4; k++) {
      if (k === 1) await page.screenshot({ path: path.join(OUT, 'check-calib.png'), fullPage: true });
      const b = await (await page.$('.ck-calc')).boundingBox();
      await page.mouse.click(b.x + (corners[k][0] / TEAM.W) * b.width, b.y + (corners[k][1] / TEAM.H) * b.height);
      await page.waitForTimeout(150);
    }
    await page.waitForSelector('[data-ck="calibOk"]', { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, 'check-calib-done.png'), fullPage: true });
    // 画面の点 → コート：ほかの点も合うか（3P ラインのトップ・コーナー）
    const Hm = await page.evaluate(() => BC.check._state().H);
    const back = (p) => { const q = proj(p); const sx = 1; const w = Hm[6] * q[0] * (640 / 960) + Hm[7] * q[1] * (640 / 960) + Hm[8]; return [(Hm[0] * q[0] * (640 / 960) + Hm[1] * q[1] * (640 / 960) + Hm[2]) / w, (Hm[3] * q[0] * (640 / 960) + Hm[4] * q[1] * (640 / 960) + Hm[5]) / w]; };
    const calErr = Math.max(...[[0, 8.325], [-6.6, 0.5], [6.6, 0.5], [0, 14]].map((p) => { const q = back(p); return Math.hypot(q[0] - p[0], q[1] - p[1]); }));
    ok(calErr < 0.5, `コートの位置：タップ4点から、ほかの点も ${calErr.toFixed(2)}m 以内`);
    await page.click('[data-ck="calibOk"]');
    await page.waitForSelector('.ck-colc', { timeout: 120000 });
    const n0 = await page.evaluate(() => BC.check._state().people0.length);
    ok(n0 >= 8, `チーム：はじめのコマで 人を ${n0}人 見つけた（10人中）`);
    await page.click('[data-ck="autoColor"]');
    await page.waitForTimeout(200);
    const cols = await page.evaluate(() => BC.check._state().colors);
    if (cols && cols[0] && cols[0][0] > cols[0][2]) { await page.click('[data-ck="colorSwap"]'); await page.waitForTimeout(150); }
    await page.screenshot({ path: path.join(OUT, 'check-color.png'), fullPage: true });
    const cols2 = await page.evaluate(() => BC.check._state().colors);
    ok(cols2 && cols2[0][2] > cols2[0][0] && cols2[1][0] > cols2[1][2], `チーム：自動で 青と赤に分けた（攻め rgb(${cols2[0]})・守り rgb(${cols2[1]})）`);
    const t0 = Date.now();
    await page.click('[data-ck="teamGo"]');
    await page.waitForSelector(STEP('tresult'), { timeout: 300000 });
    const secs = (Date.now() - t0) / 1000;
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'check-result-team.png'), fullPage: true });
    const res = await page.evaluate(() => { const T = BC.check._state().team; return { frames: T.frames.map((f) => ({ t: f.t, people: f.people.map((p) => ({ x: p.x, y: p.y, team: p.team })) })), off: T.off.map((f) => [f.key, f.status, f.value]), def: T.def.map((f) => [f.key, f.status, f.value]) }; });
    // 本当の位置とくらべる
    let matched = 0, gtN = 0, teamOK = 0, extra = 0;
    const errs = [];
    for (const fr of res.frames) {
      const gt = GT(fr.t);
      gtN += gt.length;
      const pairs = [];
      fr.people.forEach((p, j) => gt.forEach((q, i) => { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 2) pairs.push([d, i, j]); }));
      pairs.sort((a, b) => a[0] - b[0]);
      const ug = new Set(), up = new Set();
      for (const [d, i, j] of pairs) { if (ug.has(i) || up.has(j)) continue; ug.add(i); up.add(j); matched++; errs.push(d); if (fr.people[j].team === gt[i].team) teamOK++; }
      extra += fr.people.length - up.size;
    }
    errs.sort((a, b) => a - b);
    const med = errs[errs.length >> 1] || 0, p90 = errs[Math.floor(errs.length * 0.9)] || 0;
    console.log(`  人の見つかり ${(100 * matched / gtN).toFixed(0)}%（${matched}/${gtN}）・位置のずれ 中央 ${med.toFixed(2)}m・90% ${p90.toFixed(2)}m・チーム正解 ${(100 * teamOK / Math.max(1, matched)).toFixed(0)}%・よけいな人 ${extra}・${res.frames.length}コマ ${secs.toFixed(1)}秒`);
    console.log('  攻め：' + res.off.map((f) => `${f[0]}=${f[2]}(${f[1]})`).join(' ') + '  守り：' + res.def.map((f) => `${f[0]}=${f[2]}(${f[1]})`).join(' '));
    ok(matched / gtN >= 0.8, 'チーム：人の 80% 以上を見つけた');
    ok(med < 0.6, 'チーム：位置のずれ（中央）0.6m 未満');
    ok(teamOK / Math.max(1, matched) >= 0.9, 'チーム：チームの見分け 90% 以上');
    ok(res.off.find((f) => f[0] === 'spacing')[1] === 'good' && res.off.find((f) => f[0] === 'corner')[1] === 'good', 'チーム：5アウトの攻め → 広がり ◎・コーナー ◎');
    ok(await page.$('.ck-court svg .ck-dots') != null && (await page.$$eval('.ck-court .ck-p-off', (e) => e.length)) >= 3, 'チーム：上から見たコートに 人の点');
    await page.click('[data-ck="heat"][data-team="0"]');
    ok((await page.$$eval('.ck-heat-off', (e) => e.length)) > 5, 'チーム：攻めの いた場所（ヒートマップ）');
    await page.screenshot({ path: path.join(OUT, 'check-result-team-heat.png'), fullPage: false, clip: await (await page.$('.ck-court')).boundingBox() });
  }

  // 3. きろく
  console.log('■ きろく');
  const recs = await page.evaluate(() => JSON.parse(localStorage.getItem('bc.checks') || '[]'));
  ok(recs.length >= 1, `きろく：${recs.length}件 保存`);
  ok(recs.every((r) => r.id && r.at && r.mode && Array.isArray(r.metrics)), 'きろく：形（id・at・mode・metrics）');
  ok(recs.every((r) => !r.thumb || r.thumb.length < 30000), 'きろく：絵は 30KB 以下 ' + recs.map((r) => Math.round((r.thumb || '').length / 1024) + 'KB').join(' '));
  if (recs.length) {
    await page.evaluate((id) => { location.hash = '#check/rec/' + id; }, recs[0].id);
    await page.waitForSelector(STEP('record'));
    await page.screenshot({ path: path.join(OUT, 'check-record.png'), fullPage: true });
    ok(await page.$$eval('.ck-met', (e) => e.length) === recs[0].metrics.length, 'きろく：保存した結果を見せる');
    const html = await page.evaluate((r) => BC.check.summaryHTML(r), recs[0]);
    ok(html.includes('#check/rec/' + recs[0].id), 'きろく：summaryHTML は #check/rec/<id> へのリンク');
  }
  await page.evaluate(() => { BC.check._reset(); location.hash = '#check'; });
  await page.waitForSelector(STEP('home'));
  await page.screenshot({ path: path.join(OUT, 'check-home-recs.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: path.join(OUT, 'check-home-dark.png'), fullPage: true });
  if (recs.length) {
    await page.evaluate((id) => { location.hash = '#check/rec/' + id; }, recs[recs.length - 1].id);
    await page.waitForSelector(STEP('record'));
    await page.screenshot({ path: path.join(OUT, 'check-record-dark.png'), fullPage: true });
  }

  console.log('■ コンソール');
  ok(!errors.length, 'エラーなし' + (errors.length ? '\n    ' + errors.slice(0, 8).join('\n    ') : ''));
  await browser.close();
  srv.close();
  console.log(`\n${fails ? '✗' : '✓'} ${passes} 合格・${fails} 不合格（画面の写真：tools/_out/check-*.png）`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
