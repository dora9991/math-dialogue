/* 図形と証明の黒板（heikou/・sankaku/・shomei/）で使う、平面図形の道具。
   ../kukan/js/k3.js（K3.run）と ../katsuyo/js/chart.js（CH.*）のあとに読みこむ。
   ・図は「点の座標」から描く（数学の向き：y は上が正）。F = GE.fit(D, R, P) で、四角 R にぴったり入れる。
   ・GE.seg・GE.tick（等しい辺の印）・GE.arc（角の印）・GE.right（直角）・GE.par（平行の印）・GE.labels（点の名前）。
   ・証明：GE.proof(def) が、K3 のステップの列を作る。証明の1行ごとに、その行に出てくる辺・角・三角形が図で光る。
     行に書いた「AB＝DC」「∠ABC＝∠ABD＋∠DBC」「△ABC≡△DCB」「AB∥DC」などは、座標から計算し直して確かめ、
     ちがえばコンソールに「答えがちがう：…」と出す（GE.verify）。 */
(function () {
'use strict';
var C = window.K3.COL, CH = window.CH, TAU = Math.PI * 2;
var GE = {};
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function A(D, a) { return D.ga * (a == null ? 1 : a); }
function hexA(hex, a) { if (hex.charAt(0) !== '#') return hex; var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
GE.HL = [C.yel, C.pink, C.green, C.blue, C.orange];

/* ---------------- 計る ---------------- */
function pt(P, p) { return typeof p === 'string' ? P[p] : p; }
GE.len = function (P, s) { var a = pt(P, s[0]), b = pt(P, s[1]); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
/* 角（度）。'ABC' または '∠ABC'：B が頂点 */
GE.ang = function (P, s) {
  s = s.replace('∠', ''); var a = P[s[0]], v = P[s[1]], b = P[s[2]], u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]];
  return Math.acos(clamp((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1])), -1, 1)) * 180 / Math.PI;
};
GE.near = function (a, b, e) { return Math.abs(a - b) < (e || 1e-6) * Math.max(1, Math.abs(a), Math.abs(b)); };
function cross(P, s, t) { var a = P[s[0]], b = P[s[1]], c = P[t[0]], d = P[t[1]]; return (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]); }
function dot(P, s, t) { var a = P[s[0]], b = P[s[1]], c = P[t[0]], d = P[t[1]]; return (b[0] - a[0]) * (d[0] - c[0]) + (b[1] - a[1]) * (d[1] - c[1]); }
GE.isPar = function (P, s, t) { return GE.near(cross(P, s, t) / (GE.len(P, s) * GE.len(P, t)), 0); };
GE.isPerp = function (P, s, t) { return GE.near(dot(P, s, t) / (GE.len(P, s) * GE.len(P, t)), 0); };
/* 点をつくる道具（図の座標を、条件どおりに正確に決めるため） */
GE.mid = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
GE.lerpP = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
GE.rot = function (p, c, deg) { var r = deg * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
GE.add = function (a, b) { return [a[0] + b[0], a[1] + b[1]]; };
GE.sub = function (a, b) { return [a[0] - b[0], a[1] - b[1]]; };
GE.polar = function (c, r, deg) { var t = deg * Math.PI / 180; return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; };
/* 直線 ab と直線 cd の交点 */
GE.meet = function (a, b, c, d) { var r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0], t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den; return [a[0] + r[0] * t, a[1] + r[1] * t]; };
/* 点 p から直線 ab への垂線の足 */
GE.foot = function (p, a, b) { var d = [b[0] - a[0], b[1] - a[1]], t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]); return [a[0] + d[0] * t, a[1] + d[1] * t]; };
/* 直線 ab について、点 p を折り返す */
GE.reflect = function (p, a, b) { var f = GE.foot(p, a, b); return [2 * f[0] - p[0], 2 * f[1] - p[1]]; };

/* ---------------- 図を四角に入れる ---------------- */
/* F：X(点の名前か [x, y]) → 画面の [x, y]、u（1 の長さ）、D、P、R、s（字の大きさ） */
GE.fit = function (D, R, P, o) {
  o = o || {}; var ks = o.keys || Object.keys(P), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  ks.map(function (k) { return P[k]; }).concat(o.bounds || []).forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  var pad = o.pad == null ? .12 : o.pad, w = (x1 - x0) || 1, h = (y1 - y0) || 1, u = Math.min(R.w / (w * (1 + pad * 2)), R.h / (h * (1 + pad * 2)));
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  function X(p) { p = pt(P, p); return [R.cx + (p[0] - cx) * u, R.cy - (p[1] - cy) * u]; }
  var c = [0, 0]; ks.forEach(function (k) { c[0] += P[k][0] / ks.length; c[1] += P[k][1] / ks.length; });
  return { X: X, u: u, D: D, P: P, R: R, s: o.size || CH.fs(D, 1), c: c };
};

/* ---------------- 描く ---------------- */
GE.seg = function (F, s, o) {
  o = o || {}; var a = F.X(s[0]), b = F.X(s[1]);
  if (o.ext) { var d = [b[0] - a[0], b[1] - a[1]]; a = [a[0] - d[0] * o.ext[0], a[1] - d[1] * o.ext[0]]; b = [b[0] + d[0] * o.ext[1], b[1] + d[1] * o.ext[1]]; }
  CH.line(F.D, a[0], a[1], b[0], b[1], { col: o.col || C.chalk, w: o.w || 2.4, dash: o.dash, a: o.a, glow: o.glow });
};
/* 直線（四角のはしまでのばす） */
GE.line = function (F, s, o) {
  o = o || {}; var a = F.X(s[0]), b = F.X(s[1]), d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]), k = (F.R.w + F.R.h) / L;
  CH.line(F.D, a[0] - d[0] * k, a[1] - d[1] * k, b[0] + d[0] * k, b[1] + d[1] * k, { col: o.col || C.chalk, w: o.w || 2, dash: o.dash, a: o.a });
};
GE.poly = function (F, s, o) {
  o = o || {}; var P = s.split('').map(function (k) { return F.X(k); });
  CH.poly(F.D, P, { fill: o.fill === false ? null : (o.fill || hexA(o.col || C.blue, o.fa == null ? .22 : o.fa)), stroke: o.stroke === false ? null : (o.stroke || o.col || null), sw: o.sw || 2.6, a: o.a });
};
GE.polyP = function (F, pts, o) { o = o || {}; CH.poly(F.D, pts.map(function (p) { return F.X(p); }), { fill: o.fill || hexA(o.col || C.blue, o.fa == null ? .22 : o.fa), stroke: o.col || null, sw: o.sw || 2.6, a: o.a }); };
/* 等しい辺の印（n 本） */
GE.tick = function (F, s, n, o) {
  o = o || {}; var a = F.X(s[0]), b = F.X(s[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L], nv = [-u[1], u[0]], h = F.s * .38, gap = F.s * .22;
  for (var i = 0; i < (n || 1); i++) { var k = (i - ((n || 1) - 1) / 2) * gap, c = [m[0] + u[0] * k, m[1] + u[1] * k]; CH.line(F.D, c[0] - nv[0] * h, c[1] - nv[1] * h, c[0] + nv[0] * h, c[1] + nv[1] * h, { col: o.col || C.chalk, w: o.w || 2.2, a: o.a }); }
};
/* 平行の印（n こ の ＞） */
GE.par = function (F, s, n, o) {
  o = o || {}; var a = F.X(s[0]), b = F.X(s[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L], nv = [-u[1], u[0]], h = F.s * .32, gap = F.s * .3;
  for (var i = 0; i < (n || 1); i++) { var k = (i - ((n || 1) - 1) / 2) * gap + (o.shift || 0) * F.s, c = [m[0] + u[0] * k, m[1] + u[1] * k]; CH.poly(F.D, [[c[0] - u[0] * h + nv[0] * h, c[1] - u[1] * h + nv[1] * h], c, [c[0] - u[0] * h - nv[0] * h, c[1] - u[1] * h - nv[1] * h]], { stroke: o.col || C.chalk, sw: o.w || 2.2, a: o.a, close: false }); }
};
/* 角の印：'ABC'（B が頂点）。o：n（弧の数）、r（半径 px）、fill（扇形をぬる）、col */
GE.arc = function (F, s, o) {
  o = o || {}; s = s.replace('∠', ''); var g = F.D.ctx, A1 = F.X(s[0]), V = F.X(s[1]), B1 = F.X(s[2]);
  var a1 = Math.atan2(A1[1] - V[1], A1[0] - V[0]), a2 = Math.atan2(B1[1] - V[1], B1[0] - V[0]), d = a2 - a1;
  while (d > Math.PI) d -= TAU; while (d <= -Math.PI) d += TAU;
  var r = o.r || F.s * 1.05, col = o.col || C.chalk;
  g.save(); g.globalAlpha = A(F.D, o.a);
  if (o.fill) { g.fillStyle = hexA(col, o.fill === true ? .35 : o.fill); g.beginPath(); g.moveTo(V[0], V[1]); g.arc(V[0], V[1], r, a1, a1 + d, d < 0); g.closePath(); g.fill(); }
  g.strokeStyle = col; g.lineWidth = o.w || 2.2;
  for (var i = 0; i < (o.n || 1); i++) { g.beginPath(); g.arc(V[0], V[1], r + i * F.s * .22, a1, a1 + d, d < 0); g.stroke(); }
  g.restore();
  if (o.lab) { var mid = a1 + d / 2, rr = r + F.s * (o.n > 1 ? .9 : .75); CH.text(F.D, V[0] + Math.cos(mid) * rr, V[1] + Math.sin(mid) * rr, o.lab, { col: col, size: F.s * .8, a: o.a, outline: 'rgba(20,40,30,.9)' }); }
};
/* 向きで描く角の印：頂点 v（名前か座標）から、数学の向き d1°→d2°（反時計まわり）。180° 以上の角や、動いている角にも使える。o は GE.arc と同じ */
GE.arcDir = function (F, v, d1, d2, o) {
  o = o || {}; var g = F.D.ctx, V = F.X(v), r = o.r || F.s * 1.05, col = o.col || C.chalk, a1 = -d1 * Math.PI / 180, a2 = -d2 * Math.PI / 180;
  g.save(); g.globalAlpha = A(F.D, o.a);
  if (o.fill) { g.fillStyle = hexA(col, o.fill === true ? .35 : o.fill); g.beginPath(); g.moveTo(V[0], V[1]); g.arc(V[0], V[1], r, a1, a2, true); g.closePath(); g.fill(); }
  g.strokeStyle = col; g.lineWidth = o.w || 2.2;
  for (var i = 0; i < (o.n || 1); i++) { g.beginPath(); g.arc(V[0], V[1], r + i * F.s * .22, a1, a2, true); g.stroke(); }
  g.restore();
  if (o.lab) { var mid = (a1 + a2) / 2, rr = r + F.s * (o.n > 1 ? .9 : .75); CH.text(F.D, V[0] + Math.cos(mid) * rr, V[1] + Math.sin(mid) * rr, o.lab, { col: col, size: F.s * .8, a: o.a, outline: 'rgba(20,40,30,.9)' }); }
};
/* 直角の印：'ABC'（B が頂点） */
GE.right = function (F, s, o) {
  o = o || {}; s = s.replace('∠', ''); var V = F.X(s[1]), a = F.X(s[0]), b = F.X(s[2]), h = o.r || F.s * .6;
  function u(p) { var d = [p[0] - V[0], p[1] - V[1]], L = Math.hypot(d[0], d[1]); return [d[0] / L * h, d[1] / L * h]; }
  var p = u(a), q = u(b);
  CH.poly(F.D, [[V[0] + p[0], V[1] + p[1]], [V[0] + p[0] + q[0], V[1] + p[1] + q[1]], [V[0] + q[0], V[1] + q[1]]], { stroke: o.col || C.chalk, sw: o.w || 2, a: o.a, close: false, fill: o.fill ? hexA(o.col || C.chalk, .3) : null });
};
/* 円：中心 c（名前か座標）、r（長さ、または円の上の点の名前） */
GE.circ = function (F, c, r, o) {
  o = o || {}; var cc = F.X(c), rr = (typeof r === 'string' ? GE.len(F.P, [pt(F.P, c), F.P[r]]) : r) * F.u;
  CH.circle(F.D, cc[0], cc[1], rr, { stroke: o.col || C.chalk, sw: o.w || 2.4, fill: o.fill || null, a: o.a });
};
/* 円をふくむ図の四角：中心と半径から、fit に渡す bounds */
GE.circBounds = function (c, r) { return [[c[0] - r, c[1] - r], [c[0] + r, c[1] + r]]; };
GE.dot = function (F, k, o) { o = o || {}; var p = F.X(k); CH.circle(F.D, p[0], p[1], o.r || F.s * .16, { fill: o.col || C.chalk, a: o.a }); };
/* 点の名前。o.dir：{A: 'n'} のように向きを決める（なければ、図のまん中から外向き） */
GE.labels = function (F, ks, o) {
  o = o || {}; var dirs = o.dir || {}, map = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [.75, -.75], nw: [-.75, -.75], se: [.75, .75], sw: [-.75, .75] };
  (ks || Object.keys(F.P)).forEach(function (k) {
    var p = F.X(k), d = dirs[k] ? map[dirs[k]] : null;
    if (!d) { var c = F.X(F.c), v = [p[0] - c[0], p[1] - c[1]], L = Math.hypot(v[0], v[1]) || 1; d = [v[0] / L, v[1] / L]; }
    var r = F.s * .95; CH.text(F.D, p[0] + d[0] * r, p[1] + d[1] * r, (o.name && o.name[k]) || k, { size: F.s * 1.0, col: (o.col && o.col[k]) || C.chalk, a: o.a, w: 600 });
  });
};
/* 図の全体。fig：segs・lines（のばす）・dash（点線）・ticks [['AB', 1]]・angs [['ABC', 1]]（[名前, 弧の数, 字]）・rights・pars [['AB', 1]]・dots・labels（点の名前。省略は全部）・dir */
GE.figure = function (F, fig, o) {
  o = o || {}; fig = fig || {}; var a = o.a, col = o.col;
  (fig.circles || []).forEach(function (c) { GE.circ(F, c[0], c[1], { a: a }); });
  (fig.lines || []).forEach(function (s) { GE.line(F, s, { a: a, col: 'rgba(242,240,230,.55)', w: 1.8 }); });
  (fig.dash || []).forEach(function (s) { GE.seg(F, s, { a: a, dash: true, w: 2, col: 'rgba(242,240,230,.8)' }); });
  (fig.segs || []).forEach(function (s) { GE.seg(F, s, { a: a, col: col }); });
  (fig.ticks || []).forEach(function (t) { GE.tick(F, t[0], t[1], { a: a }); });
  (fig.angs || []).forEach(function (t) { GE.arc(F, t[0], { n: t[1], a: a, lab: t[2] }); });
  (fig.rights || []).forEach(function (s) { GE.right(F, s, { a: a }); });
  (fig.pars || []).forEach(function (t) { GE.par(F, t[0], t[1], { a: a }); });
  (fig.dots || []).forEach(function (k) { GE.dot(F, k, { a: a }); });
  if (fig.labels !== false) GE.labels(F, fig.labels, { dir: fig.dir, a: a, name: fig.name });
};

/* ---------------- 合同な三角形を重ねる（ずらす・回す・裏返す） ---------------- */
function cen(p) { return [(p[0][0] + p[1][0] + p[2][0]) / 3, (p[0][1] + p[1][1] + p[2][1]) / 3]; }
function orient(p) { return (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]); }
/* △t1 を、△t2 の上へ k（0〜1）だけ動かした3点（頂点は対応する順）。相似なら、大きさも変えながら重ねる */
GE.moveTri = function (P, t1, t2, k) {
  var p = t1.split('').map(function (c) { return P[c]; }), q = t2.split('').map(function (c) { return P[c]; }), f = 0;
  if (orient(p) * orient(q) < 0) {
    var c0 = cen(p), r = GE.sub(p[1], p[0]), pr = p.map(function (x) { return GE.reflect(x, c0, GE.add(c0, r)); });
    f = Math.min(1, k * 2); p = p.map(function (x, i) { return GE.lerpP(x, pr[i], CH.ease(f)); }); if (k < .5) return p; k = (k - .5) * 2;
  }
  var cp = cen(p), cq = cen(q), th = Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]) - Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
  while (th > Math.PI) th -= TAU; while (th <= -Math.PI) th += TAU;
  var sc = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) / Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
  var e = CH.ease(k), deg = th * e * 180 / Math.PI, tr = GE.lerpP(cp, cq, e), z = 1 + (sc - 1) * e;
  return p.map(function (x) { var y = GE.rot(x, cp, deg); return [(y[0] - cp[0]) * z + tr[0], (y[1] - cp[1]) * z + tr[1]]; });
};

/* ---------------- 証明の行を読む ---------------- */
var T = '(?:(?:\\d+(?:/\\d+)?)?(?:∠[A-Z]{3}|∠[A-Za-z]|[A-Z]{2})|\\d+(?:\\.\\d+)?°?)', E = T + '(?:[＋−]' + T + ')*';
var CHAIN = new RegExp(E + '(?:＝' + E + ')+', 'g'), TERM = new RegExp('([＋−]?)(' + T + ')', 'g');
/* 比の式（AB：DE＝BC：EF、AD：DB＝2：3 など） */
var RAT = E + '：' + E, RCHAIN = new RegExp(RAT + '(?:＝' + RAT + ')+', 'g');
var POLY = /(四角形|平行四辺形|長方形|ひし形|正方形|台形|五角形|六角形|多角形)[A-Z]{3,}/g;
/* 行に出てくる 三角形・角・辺。alias：{ x: 'ABC' }（∠x のような名前） */
GE.tokens = function (txt, alias) {
  var out = [], rest = txt.replace(POLY, ' ');
  rest = rest.replace(/△([A-Z]{3})/g, function (m, t) { out.push({ k: 'tri', v: t }); return ' '; });
  rest = rest.replace(/∠([A-Z]{3}|[A-Za-z])(?![A-Z])/g, function (m, t) { var v = t.length === 3 ? t : (alias && alias[t]); if (v) out.push({ k: 'ang', v: v }); return ' '; });
  rest.replace(/(^|[^A-Z])([A-Z]{2})(?![A-Z])/g, function (m, pre, t) { out.push({ k: 'seg', v: t }); return m; });
  return out;
};
function termVal(P, t, alias) {
  var m = /^(\d+)(?:\/(\d+))?([∠A-Z].*)$/.exec(t); if (m) return (+m[1] / (m[2] ? +m[2] : 1)) * termVal(P, m[3], alias);
  if (t[0] === '∠') { var v = t.length === 4 ? t.slice(1) : alias && alias[t.slice(1)]; return v ? GE.ang(P, v) : NaN; }
  if (/^\d/.test(t)) return parseFloat(t);
  return GE.len(P, t);
}
/* 行の主張を、座標で確かめる（ちがえば false と、コンソールに出す） */
function exprVal(P, e, alias) { var s = 0; e.replace(TERM, function (m, sg, t) { s += (sg === '−' ? -1 : 1) * termVal(P, t, alias); return m; }); return s; }
GE.verify = function (P, txt, alias, what) {
  var ok = true, bad = [];
  function same(ch, vals) { if (!vals.every(function (v) { return isFinite(v) && GE.near(v, vals[0], 1e-5); })) { ok = false; bad.push(ch + '（' + vals.map(function (v) { return Math.round(v * 1000) / 1000; }).join(' / ') + '）'); } }
  var rest = txt.replace(RCHAIN, function (ch) { same(ch, ch.split('＝').map(function (r) { var ab = r.split('：'); return exprVal(P, ab[0], alias) / exprVal(P, ab[1], alias); })); return ' '; });
  (rest.match(CHAIN) || []).forEach(function (ch) { same(ch, ch.split('＝').map(function (e) { return exprVal(P, e, alias); })); });
  txt.replace(/([A-Z]{2})∥([A-Z]{2})/g, function (m, s, t) { if (!GE.isPar(P, s, t)) { ok = false; bad.push(m); } return m; });
  txt.replace(/([A-Z]{2})⊥([A-Z]{2})/g, function (m, s, t) { if (!GE.isPerp(P, s, t)) { ok = false; bad.push(m); } return m; });
  txt.replace(/△([A-Z]{3})≡△([A-Z]{3})/g, function (m, s, t) {
    for (var i = 0; i < 3; i++) {
      var j = (i + 1) % 3, l = (i + 2) % 3;
      if (!GE.near(GE.len(P, s[i] + s[j]), GE.len(P, t[i] + t[j]), 1e-5) || !GE.near(GE.ang(P, s[l] + s[i] + s[j]), GE.ang(P, t[l] + t[i] + t[j]), 1e-5)) { ok = false; bad.push(m); return m; }
    }
    return m;
  });
  txt.replace(/△([A-Z]{3})∽△([A-Z]{3})/g, function (m, s, t) {
    var k = GE.len(P, t[0] + t[1]) / GE.len(P, s[0] + s[1]);
    for (var i = 0; i < 3; i++) {
      var j = (i + 1) % 3, l = (i + 2) % 3;
      if (!GE.near(GE.len(P, s[i] + s[j]) * k, GE.len(P, t[i] + t[j]), 1e-5) || !GE.near(GE.ang(P, s[l] + s[i] + s[j]), GE.ang(P, t[l] + t[i] + t[j]), 1e-5)) { ok = false; bad.push(m); return m; }
    }
    return m;
  });
  if (!ok && window.console) console.error('答えがちがう：' + (what ? what + '：' : '') + bad.join('、'));
  return ok;
};
/* 図の印が正しいか（同じ本数の印の辺は等しい・同じ数の弧の角は等しい・同じ数の平行の印は平行・直角） */
GE.checkFig = function (P, fig, what) {
  var ok = true, g = {};
  (fig.ticks || []).forEach(function (t) { (g['t' + t[1]] = g['t' + t[1]] || []).push(GE.len(P, t[0])); });
  (fig.angs || []).forEach(function (t) { if (t[1]) (g['a' + t[1]] = g['a' + t[1]] || []).push(GE.ang(P, t[0])); });
  Object.keys(g).forEach(function (k) { if (!g[k].every(function (v) { return GE.near(v, g[k][0], 1e-5); })) ok = false; });
  var pr = {}; (fig.pars || []).forEach(function (t) { (pr[t[1]] = pr[t[1]] || []).push(t[0]); });
  Object.keys(pr).forEach(function (k) { pr[k].forEach(function (s) { if (!GE.isPar(P, s, pr[k][0])) ok = false; }); });
  (fig.rights || []).forEach(function (s) { if (!GE.near(GE.ang(P, s), 90)) ok = false; });
  if (!ok && window.console) console.error('答えがちがう：' + (what || '') + '：図の印');
  return ok;
};

/* ---------------- 光らせる ---------------- */
/* 行の中の 辺・角 を光らせる（色は GE.HL を順に。等号の左右は同じ色）。tri：うすくぬる三角形 [[名前, 色], …] */
GE.glow = function (F, txt, alias, o) {
  o = o || {}; var tk = GE.tokens(txt, alias), a = o.a == null ? 1 : o.a, col = o.col || C.yel;
  tk.forEach(function (t) {
    if (t.k === 'seg') GE.seg(F, t.v, { col: col, w: 5, a: a, glow: true });
    if (t.k === 'ang') GE.arc(F, t.v, { col: col, fill: .45, w: 2.6, a: a, r: F.s * 1.6 });
  });
  return tk;
};
GE.CIRC = '⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫';
GE.COND = { SSS: '3組の辺が、それぞれ等しい', SAS: '2組の辺とその間の角が、それぞれ等しい', ASA: '1組の辺とその両端の角が、それぞれ等しい',
  S3: '3組の辺の比が、すべて等しい', S2A: '2組の辺の比とその間の角が、それぞれ等しい', AA: '2組の角が、それぞれ等しい',
  HA: '直角三角形の斜辺と1つの鋭角が、それぞれ等しい', HL: '直角三角形の斜辺と他の1辺が、それぞれ等しい' };

/* ---------------- 証明を、K3 のステップの列にする ----------------
   def：
     id・lv（★の数 1〜4）・ttl（題）・q（問題文）・P（座標）・fig（図）・alias
     hyp（仮定）・goal（結論）・tri（目をつける三角形 ['ABC', 'DCB']。合同を使わない証明は省略）
     plan：{ q, a }（方針の問い。省略すると「どの三角形の合同を示す？」）
     L：証明の行 [{ t: 'AB＝DC', r: '仮定', n: 1, ask: 'r'|'t'|'c'|false, c: 'SAS' }, …]
        ask 'r' 根拠をたずねる／'t' 等しいものと根拠をたずねる／'c' 合同条件をたずねる／false たずねない（省略すると ★ の数で決める）
     point：最後のふり返り（省略可）
   o：tag（ステップの札）、box（図の四角のすきま）、draw（図に足して描く関数 (D, F, info)） */
GE.proof = function (def, o) {
  o = o || {}; var P = def.P, alias = def.alias, steps = [], name = def.id || def.ttl;
  GE.checkFig(P, def.fig || {}, name);
  (def.L || []).forEach(function (l) { GE.verify(P, l.t, alias, name); });
  var stars = '★★★★'.slice(0, def.lv || 1), tag = o.tag || ('証明 ' + stars), tri = def.tri || [];
  function base(D, F, i, ph, t) {
    var hi = i >= 1 ? tri : [];
    hi.forEach(function (s, j) { GE.poly(F, s, { col: j ? C.orange : C.blue, fa: .2, stroke: false }); });
    GE.figure(F, def.fig);
    if (o.draw) o.draw(D, F, { i: i, ph: ph, t: t });
  }
  function box(D) { return CH.box(D, o.box || { l: .06, r: .06, t: .1, b: .12 }); }
  function mkF(D) { return GE.fit(D, box(D), P, { pad: def.pad }); }
  var circ = function (n) { return n ? GE.CIRC.charAt(n) : ''; };
  /* 問題 */
  steps.push({ tag: tag, bh: (def.no ? def.no + '　' : '') + (def.ttl || '証明'), q: def.q,
    notes: (def.hyp ? ['仮定　' + def.hyp] : []).concat(def.goal ? ['結論　' + def.goal] : []).concat(def.notes || []),
    b: [].concat(def.hyp ? [{ t: '【仮定】' + def.hyp, col: C.blue }] : []).concat(def.goal ? [{ t: '【結論】' + def.goal, col: C.blue }] : []),
    draw: function (D) { var F = mkF(D); base(D, F, 0, D.ph, D.t); if (def.goal) GE.glow(F, def.goal, alias, { col: C.pink, a: .9 }); } });
  /* 方針 */
  var L = (def.L || []).slice(), first = L.length && !L[0].r && /で$|で、?$/.test(L[0].t) ? L.shift() : null;
  if (tri.length || def.plan) {
    var pq = (def.plan && def.plan.q) || (def.goal ? '「' + def.goal + '」を示すには、どの三角形とどの三角形の合同を示せばよい？' : 'どの三角形とどの三角形の合同を示せばよい？');
    var pa = (def.plan && def.plan.a) || (tri.length ? '△' + tri[0] + ' と △' + tri[1] : '');
    steps.push({ tag: tag, q: pq, a: pa, sub: (def.plan && def.plan.sub) || '', dur: 1.2, b: first ? { t: first.t } : (def.plan && def.plan.b ? { t: def.plan.b } : null),
      draw: function (D) { var F = mkF(D); base(D, F, D.ph ? 1 : 0, D.ph, D.t); if (def.goal) GE.glow(F, def.goal, alias, { col: C.pink, a: .9 }); } });
  }
  /* 証明の行 */
  L.forEach(function (l, k) {
    var ask = l.ask != null ? l.ask : (l.c ? 'c' : l.r ? ((def.lv || 1) <= 1 ? 'r' : 't') : false);
    var bt = l.t + (l.r ? '（' + l.r + '）' : '') + (l.n ? '…' + circ(l.n) : ''), isCong = /[≡∽]/.test(l.t), isSim = /∽/.test(l.t);
    var st = { tag: tag, b: { t: bt, col: isCong ? C.yel : l.n ? C.chalk : C.green } };
    if (ask === 'r') { st.q = l.t + (l.n ? '　…' + circ(l.n) : '') + '　この根拠は？'; st.a = l.r; }
    else if (ask === 't') { st.q = (l.n ? circ(l.n) + ' ' : '') + (l.hint || 'つぎに、等しいといえる辺や角は？　根拠も。'); st.a = l.t + '（' + l.r + '）'; }
    else if (ask === 'c') { st.q = /^(S3|S2A|AA)$/.test(l.c) ? 'どの相似条件が使える？' : 'どの合同条件が使える？'; st.a = GE.COND[l.c] || l.c; st.sub = l.t; st.b = { t: l.t, col: C.green }; }
    else { st.q = l.q || l.t; if (l.a) { st.a = l.a; st.sub = l.sub || ''; } }
    if (isCong && !st.a) { st.q = l.q || (isSim ? 'だから、どの三角形が相似？（頂点の順に注意）' : 'だから、どの三角形が合同？（頂点の順に注意）'); st.a = l.t; }
    st.dur = isCong ? 2.6 : 1;
    st.draw = function (D) {
      var F = mkF(D), t = D.ph ? D.t : (st.a ? 0 : 1), show = !st.a || D.ph || ask === 'r' || ask === 'c';
      base(D, F, 1, D.ph, t);
      if (isCong && (D.ph || !st.a)) { var m = /△([A-Z]{3})[≡∽]△([A-Z]{3})/.exec(l.t), pts = GE.moveTri(P, m[1], m[2], CH.smooth(.1, .9, t)); GE.polyP(F, pts, { col: C.yel, fa: .25 }); }
      else if (ask === 'c' || l.c) { var j0 = 0; L.slice(0, k).forEach(function (m, j) { if (/[≡∽]/.test(m.t)) j0 = j + 1; }); L.slice(j0, k).forEach(function (m) { if (m.n) GE.glow(F, m.t, alias, { col: C.yel, a: .85 }); }); }
      else if (show) GE.glow(F, l.t, alias, { col: C.yel, a: D.ph ? CH.smooth(0, .3, D.t) : 1 });
    };
    steps.push(st);
  });
  var pnt = typeof def.point === 'string' ? { a: def.point } : def.point;
  if (pnt) steps.push({ tag: tag, q: 'ふり返り：この証明のポイントは？', a: pnt.a, sub: pnt.sub || '', dur: 1, b: { t: 'ポイント：' + pnt.a, col: C.pink },
    draw: function (D) { var F = mkF(D); base(D, F, 1, D.ph, D.t); } });
  return steps;
};

window.GE = GE;
})();
