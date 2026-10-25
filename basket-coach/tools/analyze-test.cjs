#!/usr/bin/env node
/* 動画分析（js/analyze.js）の計算の検査。カメラも AI も使わない。
   アニメーションの人（js/motion.js の動き）から、MediaPipe と同じ形の「骨格の点」を作り、
   よい形 → ◎、よくない形 → ○・△ になるかを見る。チームの計算（コートの位置・色・広がり）も見る。
   使い方：node tools/analyze-test.cjs */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { console, Math, JSON, Object, Array, Number, String, Error, Promise, setTimeout, clearTimeout };
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/core.js', 'js/motion.js', 'data/motions-base.js', 'data/motions-ball.js', 'data/motions-body.js', 'js/analyze.js']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}
const BC = ctx.BC;
const BA = BC.analyze;

let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('  ✗ ' + msg); } };

/* ---------- 乱数（くり返しても同じ） ---------- */
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/* ---------- アニメーションの関節 → MediaPipe の33点（画素） ---------- */
const CAM = { W: 960, H: 720, S: 230, cx: 0, foot: 60 };
function toLandmarks(sk, cam, noise) {
  const P = (p) => [cam.W / 2 + (p[0] - cam.cx) * cam.S, cam.H - cam.foot - p[1] * cam.S];
  const out = Array.from({ length: 33 }, () => [0, 0, 0.9]);
  const put = (i, p, v = 0.95) => { const q = P(p); out[i] = [q[0] + gauss() * noise, q[1] + gauss() * noise, v]; };
  const u = (() => { const a = sk.headAxis, l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; })();
  const add = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const H = sk.head;
  if (sk.view === 'side') {
    const fwd = [sk.face * u[1], -sk.face * u[0]];
    const nose = add(add(H, fwd, 0.105), u, -0.03);
    put(0, nose);
    for (const i of [1, 2, 3, 4, 5, 6]) put(i, add(add(H, fwd, 0.07), u, 0.012));
    put(7, add(H, fwd, -0.015), 0.95); // 近い耳
    put(8, add(add(H, fwd, -0.01), u, 0.005), 0.3); // 遠い耳（見えにくい）
    put(9, add(add(H, fwd, 0.09), u, -0.06)); put(10, add(add(H, fwd, 0.09), u, -0.06));
  } else {
    const side = [u[1], -u[0]];
    put(0, add(H, u, -0.03));
    put(2, add(add(H, side, -0.035), u, 0.012)); put(5, add(add(H, side, 0.035), u, 0.012));
    for (const i of [1, 3]) put(i, add(add(H, side, -0.035), u, 0.012));
    for (const i of [4, 6]) put(i, add(add(H, side, 0.035), u, 0.012));
    put(7, add(H, side, -0.075)); put(8, add(H, side, 0.075));
    put(9, add(add(H, side, -0.02), u, -0.065)); put(10, add(add(H, side, 0.02), u, -0.065));
  }
  put(11, sk.shL); put(12, sk.shR);
  put(13, sk.l.elb); put(14, sk.r.elb);
  put(15, sk.l.hand); put(16, sk.r.hand);
  for (const i of [17, 19, 21]) put(i, sk.l.hand);
  for (const i of [18, 20, 22]) put(i, sk.r.hand);
  put(23, sk.hpL); put(24, sk.hpR);
  put(25, sk.l.knee); put(26, sk.r.knee);
  put(27, sk.l.ank); put(28, sk.r.ank);
  put(29, sk.l.foot[0]); put(30, sk.r.foot[0]);
  put(31, sk.l.foot[1]); put(32, sk.r.foot[1]);
  return out;
}
// 動き id を、secs 秒・fps で「とった」ことにする（くり返す動きは、くり返す）
function film(id, { mods, secs, fps = 15, noise = 1.2, loop = true, cam = CAM } = {}) {
  const clip = BC.motions[id];
  if (!clip) throw new Error('動きがない：' + id);
  const total = secs || clip.dur;
  const n = Math.floor(total * fps);
  const series = [], times = [];
  for (let i = 0; i <= n; i++) {
    const sec = i / fps;
    let t = sec / clip.dur;
    t = loop ? t % 1 : Math.min(1, t);
    const fr = BC.motionFrame(clip, t, mods);
    series.push(toLandmarks(fr.sk[0], cam, noise));
    times.push(sec);
  }
  return { series, times, fps };
}
const metric = (res, key) => (res.metrics || []).find((m) => m.key === key);
const st = (res, key) => (metric(res, key) || {}).status;
const show = (label, res) => console.log(`  ${label}: ` + (res.ok ? res.metrics.map((m) => `${m.key}=${m.value}(${m.status})`).join(' ') : '× ' + res.msg) + (res.notes && res.notes.length ? '  ［' + res.notes.length + 'つの注意］' : ''));

/* ---------- 1. シュート ---------- */
console.log('■ シュート（横から）');
{
  const mk = (mods) => { const f = film('shoot', { mods, loop: false }); return BA.analyzeSelf(f.series, { mode: 'shoot', fps: f.fps }); };
  const good = mk(null), stiff = mk({ stiff: true });
  show('よい形', good); show('ひざを使わない', stiff);
  ok(good.ok && good.view === 'side', 'シュート：よい形が分析できる（横）');
  for (const k of ['dip', 'set', 'release', 'follow']) ok(st(good, k) === 'good', `シュート：よい形の ${k} が ◎（${(metric(good, k) || {}).value}）`);
  ok(st(good, 'drift') === 'good', 'シュート：まっすぐ跳べている');
  ok(['dip', 'set', 'release'].every((k) => metric(good, k) && metric(good, k).at >= 0), 'シュート：場面の位置（at）がある');
  ok(good.keys.map((k) => k.label).join() === 'しずむ,セット,はなす,着地', 'シュート：場面ボタン ' + good.keys.map((k) => k.label).join());
  ok(st(stiff, 'dip') === 'bad', 'シュート：ひざを使わない → ひざの曲げが △');
  ok(good.notes.length === 0, 'シュート：よい動画で注意が出ない ' + good.notes.join(' / '));
}

/* ---------- 2. ドリブル ---------- */
console.log('■ ドリブル（横から）');
{
  const mk = (mods) => { const f = film('pound', { mods, secs: 5 }); return BA.analyzeSelf(f.series, { mode: 'dribble', fps: f.fps }); };
  const good = mk(null), tall = mk({ hipUp: 0.17 }), look = mk({ nod: 38 });
  show('よい形', good); show('腰が高い', tall); show('ボールを見る', look);
  for (const k of ['low', 'eyes', 'head', 'height']) ok(st(good, k) === 'good', `ドリブル：よい形の ${k} が ◎（${(metric(good, k) || {}).value}）`);
  ok(st(tall, 'low') === 'bad', 'ドリブル：腰が高い → 腰の低さ △');
  ok(st(look, 'eyes') === 'bad', 'ドリブル：ボールを見る → 顔 △');
  const tempo = metric(good, 'tempo');
  ok(tempo && Math.abs(parseFloat(tempo.value) - 1 / 0.6) < 0.3, 'ドリブル：回数/秒 ≈ 1.67（' + (tempo && tempo.value) + '）');
  ok(good.keys.length >= 5, 'ドリブル：つくたびの場面 ' + good.keys.length);
}

/* ---------- 3. ディフェンス ---------- */
console.log('■ ディフェンスのスライド（前から）');
{
  const mk = (mods) => { const f = film('defslide', { mods, secs: 6, fps: 10 }); return BA.analyzeSelf(f.series, { mode: 'defense', fps: f.fps }); };
  const good = mk(null), tall = mk({ hipUp: 0.18, hands: true }), bob = mk({ bob: 0.11, freq: 6 });
  show('よい形', good); show('腰が高い', tall); show('頭がはねる', bob);
  ok(good.view === 'front', 'ディフェンス：前からと分かる');
  for (const k of ['low', 'wide', 'cross', 'head']) ok(st(good, k) === 'good', `ディフェンス：よい形の ${k} が ◎（${(metric(good, k) || {}).value}）`);
  ok(st(tall, 'low') !== 'good', 'ディフェンス：腰が高い → ◎ にならない');
  ok(st(bob, 'head') !== 'good', 'ディフェンス：頭がはねる → ◎ にならない');
}

/* ---------- 4. 着地（横から：アニメーション） ---------- */
console.log('■ 着地（横から）');
{
  const mk = (mods) => { const f = film('landing', { mods, loop: false }); return BA.analyzeSelf(f.series, { mode: 'landing', fps: f.fps }); };
  const good = mk(null), stiff = mk({ stiffAfter: 0.5 });
  show('よい形', good); show('ひざで吸収しない', stiff);
  ok(good.ok && st(good, 'flex') === 'good', '着地（横）：よい形 → ひざで吸収 ◎');
  ok(stiff.ok && st(stiff, 'flex') !== 'good', '着地（横）：ひざで吸収しない → ◎ にならない');
  ok(good.notes.some((t) => t.includes('前から')), '着地（横）：前から とるように すすめる');
}

/* ---------- 4b. 着地（前から：アニメーション） ---------- */
if (BC.motions['landing-front']) {
  console.log('■ 着地（前から・アニメーション）');
  const mk = (mods) => { const f = film('landing-front', { mods, loop: false }); return BA.analyzeSelf(f.series, { mode: 'landing', fps: f.fps }); };
  const good = mk(null), kin = mk({ kneeIn: 0.48 }), stiff = mk({ stiffAfter: 0.5 });
  show('よい形', good); show('ひざが内に入る', kin); show('ひざで吸収しない', stiff);
  ok(good.ok && good.view === 'front', '着地（前・アニメ）：前からと分かる');
  ok(st(good, 'flex') === 'good' && st(good, 'knee-in') === 'good', '着地（前・アニメ）：よい形 → 吸収◎・ひざ◎');
  ok(st(kin, 'knee-in') !== 'good', '着地（前・アニメ）：ひざが内に入る → ◎ にならない（' + (metric(kin, 'knee-in') || {}).value + '）');
  ok(st(stiff, 'flex') !== 'good', '着地（前・アニメ）：ひざで吸収しない → ◎ にならない（' + (metric(stiff, 'flex') || {}).value + '）');
}

/* ---------- 5. 着地（前から：点を直接つくる） ---------- */
console.log('■ 着地（前から）');
function frontLanding({ inward = 0, drop = 0.26, tilt = 0, fps = 15 } = {}) {
  // 時間（秒）：0〜0.5 立つ → 0.5〜0.8 しずむ → 0.8〜1.3 空中 → 1.3〜1.6 しずむ（吸収）→ 2.4 立つ
  const leg = 0.87, series = [], times = [];
  const S = 230, W = 960, H = 720;
  const P = (x, y) => [W / 2 + x * S, H - 60 - y * S];
  for (let i = 0; i <= Math.round(2.6 * fps); i++) {
    const t = i / fps;
    const sm = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
    let lift = 0, hipDrop = 0, kin = 0, tl = 0;
    if (t < 0.5) hipDrop = 0;
    else if (t < 0.8) hipDrop = sm(0, 0.12, (t - 0.5) / 0.3);
    else if (t < 1.3) { const u = (t - 0.8) / 0.5; lift = 0.3 * Math.sin(Math.PI * u); hipDrop = 0; }
    else if (t < 1.6) { const u = (t - 1.3) / 0.3; hipDrop = sm(0, drop, u); kin = sm(0, inward, u); tl = sm(0, tilt, u); }
    else { const u = (t - 1.6) / 0.8; hipDrop = sm(drop, 0, u); kin = sm(inward, 0, u); tl = sm(tilt, 0, u); }
    const ankY = 0.07 + lift;
    const hipY = ankY + leg * 0.98 - hipDrop;
    const lm = Array.from({ length: 33 }, () => [0, 0, 0.9]);
    const put = (i, x, y) => { const q = P(x, y); lm[i] = [q[0] + gauss(), q[1] + gauss(), 0.95]; };
    const tx = Math.sin((tl * Math.PI) / 180) * 0.5;
    for (const [s, sx] of [['r', 1], ['l', -1]]) {
      const hx = sx * 0.1, ax = sx * 0.14;
      // ひざ：腰と足首のまん中の高さ。曲げるほど前に出る（前からは見えない）。inward でまん中へ
      const ky = (hipY + ankY) / 2;
      const kx = (hx + ax) / 2 - sx * kin;
      const base = s === 'r' ? 0 : -1;
      put(24 + base, hx, hipY); put(26 + base, kx, ky); put(28 + base, ax, ankY);
      put(30 + base, ax, ankY - 0.05); put(32 + base, ax + sx * 0.03, ankY - 0.06);
      put(12 + base, sx * 0.19 + tx, hipY + 0.5); put(14 + base, sx * 0.3 + tx, hipY + 0.25); put(16 + base, sx * 0.32 + tx, hipY + 0.02);
      for (const k of [18, 20, 22]) put(k + base, sx * 0.32 + tx, hipY);
    }
    const hy = hipY + 0.5 + 0.06 + 0.115;
    put(0, tx, hy - 0.03); put(7, -0.075 + tx, hy); put(8, 0.075 + tx, hy);
    for (const k of [1, 2, 3]) put(k, -0.035 + tx, hy + 0.012);
    for (const k of [4, 5, 6]) put(k, 0.035 + tx, hy + 0.012);
    put(9, -0.02 + tx, hy - 0.065); put(10, 0.02 + tx, hy - 0.065);
    series.push(lm); times.push(t);
  }
  return { series, times, fps };
}
{
  const mk = (o) => { const f = frontLanding(o); return BA.analyzeSelf(f.series, { mode: 'landing', fps: f.fps }); };
  const good = mk({}), stiff = mk({ drop: 0.05 }), kin = mk({ inward: 0.07 }), tilt = mk({ tilt: 20 });
  show('よい形', good); show('ひざで吸収しない', stiff); show('ひざが内に', kin); show('横にかたむく', tilt);
  ok(good.ok && good.view === 'front', '着地（前）：前からと分かる');
  for (const k of ['flex', 'knee-in', 'sym']) ok(st(good, k) === 'good', `着地（前）：よい形の ${k} が ◎（${(metric(good, k) || {}).value}）`);
  ok(st(stiff, 'flex') === 'bad', '着地（前）：しずまない → △');
  ok(st(kin, 'knee-in') === 'bad', '着地（前）：ひざが内に入る → △（' + (metric(kin, 'knee-in') || {}).value + '）');
  ok(st(tilt, 'sym') !== 'good', '着地（前）：横にかたむく → ◎ にならない');
}

/* ---------- 6. 見えないとき・追いかけ ---------- */
console.log('■ 見えないとき・追いかけ');
{
  const f = film('pound', { secs: 3 });
  const few = f.series.map((lm, i) => (i % 5 === 0 ? lm : null));
  const r = BA.analyzeSelf(few, { mode: 'dribble', fps: f.fps });
  ok(!r.ok && /見つけられません/.test(r.msg), '体があまり見えない → ことわる');
  const nojump = BA.analyzeSelf(film('pound', { secs: 3 }).series, { mode: 'landing', fps: 15 });
  ok(!nojump.ok && /ジャンプ/.test(nojump.msg), '着地モードでジャンプがない → ことわる');
  const noshot = BA.analyzeSelf(film('pound', { secs: 3 }).series, { mode: 'shoot', fps: 15 });
  ok(!noshot.ok && /シュート/.test(noshot.msg), 'シュートモードで手が上がらない → ことわる');
  // 2人：右の人を選んで、左の人と入れかわらない
  const a = film('pound', { secs: 2, cam: Object.assign({}, CAM, { cx: 1.2 }) }).series; // 左に映る人
  const b = film('defslide', { secs: 2, fps: 15, cam: Object.assign({}, CAM, { cx: -1.0 }) }).series; // 右に映る人
  const poses = a.map((lm, i) => (i === 7 ? [b[i]] : [lm, b[i]]));
  const tr = BA.track(poses, 1);
  const hx = (lm) => (lm[23][0] + lm[24][0]) / 2;
  ok(tr.every((lm, i) => (i === 7 ? lm === b[i] : lm === b[i])), '追いかけ：選んだ人（右）を最後まで追う');
  const tr2 = BA.track(poses.map((ps, i) => (i === 3 ? [ps[0]] : ps)), 1);
  ok(tr2[3] === null && tr2[4] === b[4], '追いかけ：選んだ人が消えたコマは null、もどれば また追う');
  ok(hx(tr[0]) > CAM.W / 2, '追いかけ：右の人');
}

/* ---------- 7. コートの位置（ホモグラフィー） ---------- */
console.log('■ コートの位置');
{
  // 高い所から ななめに見たコート（画面の点 = H(コートの点)）
  const Htrue = [42, -9, 480, 2.5, -14, 650, 0.0045, -0.021, 1];
  const proj = (p) => BA.applyH(Htrue, p);
  const court = BA.CALIB.half.pts;
  const img = court.map(proj);
  const H = BA.homography(img, court);
  let maxErr = 0;
  for (const p of [[0, 0], [3, 5], [-6, 2], [7, 13], [-2.45, 5.8], [0, 1.575]]) {
    const q = BA.applyH(H, proj(p));
    maxErr = Math.max(maxErr, Math.hypot(q[0] - p[0], q[1] - p[1]));
  }
  ok(maxErr < 1e-6, 'ホモグラフィー：画面 → コートが合う（誤差 ' + maxErr.toExponential(1) + ' m）');
  const Hi = BA.invertH(H);
  const back = BA.applyH(Hi, [3, 5]), want = proj([3, 5]);
  ok(Math.hypot(back[0] - want[0], back[1] - want[1]) < 1e-6, 'ホモグラフィー：逆向き（コート → 画面）');
  ok(BA.homography([[0, 0], [1, 1], [2, 2], [3, 3]], court) === null, 'ホモグラフィー：一直線の4点 → null');
}

/* ---------- 8. 色・チーム分け ---------- */
console.log('■ 色・チーム');
{
  const blue = [40, 80, 200], red = [210, 40, 50], white = [235, 235, 235], floor = [190, 150, 100];
  const jitter = (c) => c.map((v) => Math.max(0, Math.min(255, v + Math.round(gauss() * 12))));
  const cols = [];
  for (let i = 0; i < 20; i++) cols.push(jitter(i % 2 ? blue : red));
  const c2 = BA.cluster2(cols);
  const isBlue = (c) => c[2] > c[0];
  ok(c2 && isBlue(c2[0]) !== isBlue(c2[1]), '色：2つのチームの色に分けられる');
  ok(BA.classify(jitter(blue), [blue, red]) === 0 && BA.classify(jitter(red), [blue, red]) === 1, '色：近いチームに入る');
  ok(BA.classify(floor, [blue, red]) === -1, '色：どちらとも遠い色（床）は -1');
  ok(BA.classify(white, [white, [30, 30, 30]]) === 0, '色：白と黒');
}

/* ---------- 9. チームの動き ---------- */
console.log('■ チームの動き');
{
  // 5アウト（広い）と、だんご（せまい）
  const wide = [[-6.4, 1], [6.4, 1], [-4.8, 6.4], [4.8, 6.4], [0, 8.8]];
  const tight = [[-1.2, 4], [0.8, 4.5], [0, 5.5], [1.6, 6.5], [-1, 7]];
  const def = [[-3.2, 2], [3.2, 2], [-2.4, 4.2], [2.4, 4.2], [0, 6.5]];
  const mk = (off, n = 20) => Array.from({ length: n }, (_, i) => ({
    t: i / 4,
    people: off.map(([x, y]) => ({ x: x + gauss() * 0.15, y: y + gauss() * 0.15, team: 0 })).concat(def.map(([x, y]) => ({ x: x + gauss() * 0.15, y: y + gauss() * 0.15, team: 1 }))),
  }));
  const A = BA.teamAnalyze(mk(wide)), B = BA.teamAnalyze(mk(tight));
  const fa = BA.teamFindings(A.teams[0], 'offense'), fb = BA.teamFindings(B.teams[0], 'offense');
  const fs2 = (f, k) => (f.find((x) => x.key === k) || {}).status;
  console.log('  広い: ' + fa.map((f) => `${f.key}=${f.value}(${f.status})`).join(' '));
  console.log('  せまい: ' + fb.map((f) => `${f.key}=${f.value}(${f.status})`).join(' '));
  ok(fs2(fa, 'spacing') === 'good' && fs2(fb, 'spacing') === 'bad', 'チーム：広がり 広い◎・せまい△');
  ok(fs2(fa, 'corner') === 'good' && fs2(fb, 'corner') === 'bad', 'チーム：コーナー');
  ok(fs2(fa, 'paint') === 'good', 'チーム：ペイントが空いている');
  ok(fb.some((f) => f.key === 'crowd'), 'チーム：だんごを見つける');
  const fd = BA.teamFindings(A.teams[1], 'defense');
  console.log('  守り: ' + fd.map((f) => `${f.key}=${f.value}(${f.status})`).join(' '));
  ok(fs2(fd, 'compact') === 'good', 'チーム：守りのまとまり');
  ok(A.heat[0].flat().reduce((s, v) => s + v, 0) === 100, 'チーム：ヒートマップに全員（5人×20コマ）');
  const none = BA.teamFindings(BA.teamAnalyze([{ t: 0, people: [] }]).teams[0], 'offense');
  ok(none[0].status === 'na', 'チーム：人がいない → はかれない');
}

/* ---------- 10. 点数 ---------- */
ok(BA.score([{ status: 'good' }, { status: 'ok' }, { status: 'bad' }, { status: 'na' }]) === 50, '点数：◎○△ → 50');
ok(BA.score([]) === null, '点数：なし → null');

console.log(`\n${fails ? '✗' : '✓'} ${passes} 合格・${fails} 不合格`);
process.exit(fails ? 1 : 0);
