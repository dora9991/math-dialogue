/* データの活用の黒板（katsuyo/）で使う、2D の図の道具。
   授業のページは ../kukan/js/k3.js の K3.run を使い、ステップの draw(D) の中で、ここの CH.* を呼ぶ。
   D.ctx（canvas）に、黒板の上の グラフ・表・数直線・カード を描く。全体の濃さは D.ga（場面が切りかわるときのフェード）。 */
(function () {
'use strict';
var K = window.K3, C = K.COL;
var FONT = '"Klee One","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif';
var NUM = '"BIZ UDPGothic","Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif';
var TAU = Math.PI * 2;
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function hexA(hex, a) { if (hex.charAt(0) !== '#') return hex; var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

var CH = { C: C, ease: ease, easeOut: easeOut, smooth: smooth, clamp: clamp, lerp: lerp };
/* 字の大きさのもと（舞台の大きさで決める） */
CH.fs = function (D, k) { var h = D.H - (D.info.top || 0) - (D.info.bot || 0); return clamp(Math.min(D.W * .95, h) * .04, 12, 30) * (k || 1); };
function A(D, a) { return D.ga * (a == null ? 1 : a); }

/* 図をかく四角。l・r・t・b は、舞台の幅・高さに対する すきまの割合 */
CH.box = function (D, o) {
  o = o || {}; var top = (D.info.top || 0) + 6, bot = (D.info.bot || 0) + 6, W = D.W, H = D.H - top - bot;
  var x0 = W * (o.l == null ? .1 : o.l), x1 = W * (1 - (o.r == null ? .06 : o.r)), y0 = top + H * (o.t == null ? .1 : o.t), y1 = top + H * (1 - (o.b == null ? .12 : o.b));
  return rect(x0, y0, x1, y1);
};
function rect(x0, y0, x1, y1) { return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; }
CH.rect = rect;
/* 四角 R を、横に n こ・縦に n こ に分ける */
CH.cols = function (R, n, gap) { gap = gap == null ? .08 : gap; var g = R.w * gap, w = (R.w - g * (n - 1)) / n, out = []; for (var i = 0; i < n; i++) out.push(rect(R.x0 + i * (w + g), R.y0, R.x0 + i * (w + g) + w, R.y1)); return out; };
CH.rows = function (R, n, gap) { gap = gap == null ? .08 : gap; var g = R.h * gap, h = (R.h - g * (n - 1)) / n, out = []; for (var i = 0; i < n; i++) out.push(rect(R.x0, R.y0 + i * (h + g), R.x1, R.y0 + i * (h + g) + h)); return out; };
/* 幅がせまいときは、縦に並べる */
CH.split = function (D, R, n, gap) { return D.W > D.H * .9 ? CH.cols(R, n, gap) : CH.rows(R, n, gap); };

CH.text = function (D, x, y, s, o) {
  o = o || {}; var g = D.ctx, size = o.size || CH.fs(D);
  g.save(); g.globalAlpha = A(D, o.a);
  g.font = (o.w || 600) + ' ' + size + 'px ' + (o.num ? NUM : FONT); g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  if (o.outline) { g.lineJoin = 'round'; g.lineWidth = size * .26; g.strokeStyle = o.outline; g.strokeText(s, x, y); }
  g.fillStyle = o.col || C.chalk; g.fillText(s, x, y); g.restore();
};
CH.line = function (D, x0, y0, x1, y1, o) {
  o = o || {}; var g = D.ctx; g.save(); g.globalAlpha = A(D, o.a); g.strokeStyle = o.col || C.chalk; g.lineWidth = o.w || 2; g.lineCap = 'round';
  if (o.dash) g.setLineDash(o.dash === true ? [6, 6] : o.dash);
  if (o.glow) { g.shadowColor = hexA(o.col || C.chalk, .6); g.shadowBlur = 8; }
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore();
};
CH.arrow = function (D, x0, y0, x1, y1, o) {
  o = o || {}; CH.line(D, x0, y0, x1, y1, o);
  var a = Math.atan2(y1 - y0, x1 - x0), s = (o.head || 10), g = D.ctx;
  g.save(); g.globalAlpha = A(D, o.a); g.fillStyle = o.col || C.chalk; g.beginPath(); g.moveTo(x1, y1);
  g.lineTo(x1 - s * Math.cos(a - .45), y1 - s * Math.sin(a - .45)); g.lineTo(x1 - s * Math.cos(a + .45), y1 - s * Math.sin(a + .45)); g.closePath(); g.fill(); g.restore();
};
CH.fillRect = function (D, x0, y0, x1, y1, o) {
  o = o || {}; var g = D.ctx; g.save(); g.globalAlpha = A(D, o.a);
  if (o.fill) { g.fillStyle = o.fill; g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
  if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.sw || 2; if (o.dash) g.setLineDash([6, 5]); g.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
  g.restore();
};
CH.circle = function (D, x, y, r, o) {
  o = o || {}; var g = D.ctx; g.save(); g.globalAlpha = A(D, o.a); g.beginPath(); g.arc(x, y, r, 0, TAU);
  if (o.fill) { g.fillStyle = o.fill; g.fill(); } if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.sw || 2; g.stroke(); } g.restore();
};
CH.poly = function (D, P, o) {
  o = o || {}; var g = D.ctx; g.save(); g.globalAlpha = A(D, o.a); g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); if (o.close !== false) g.closePath();
  if (o.fill) { g.fillStyle = o.fill; g.fill(); } if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.sw || 2; g.lineJoin = 'round'; if (o.dash) g.setLineDash([6, 5]); g.stroke(); } g.restore();
};
/* 字の入ったカード（数のカード・あてはまる立体の札など） */
CH.card = function (D, x, y, w, h, s, o) {
  o = o || {}; var g = D.ctx, r = Math.min(w, h) * .18;
  g.save(); g.globalAlpha = A(D, o.a); g.beginPath();
  g.moveTo(x - w / 2 + r, y - h / 2); g.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r); g.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r); g.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r); g.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r); g.closePath();
  g.fillStyle = o.fill || hexA(o.col || C.blue, .3); g.fill(); g.strokeStyle = o.col || C.blue; g.lineWidth = o.sw || 1.6; g.stroke(); g.restore();
  if (s != null && s !== '') CH.text(D, x, y + 1, String(s), { size: o.size || h * .55, num: true, col: o.tcol || C.chalk, a: o.a, w: 700 });
};

/* 軸。o：x [最小, 最大]、y [最小, 最大]、xt・yt（目もり）、xf・yf（目もりの字）、xl・yl（軸の名前）、grid、cut（縦軸の省略のしるし） */
CH.axes = function (D, R, o) {
  var X = function (val) { return R.x0 + (val - o.x[0]) / (o.x[1] - o.x[0]) * R.w; }, Y = function (val) { return R.y1 - (val - o.y[0]) / (o.y[1] - o.y[0]) * R.h; };
  var g = D.ctx, s = o.size || CH.fs(D, .78), a = o.a;
  g.save(); g.globalAlpha = A(D, a);
  if (o.grid !== false) { g.strokeStyle = 'rgba(242,240,230,.13)'; g.lineWidth = 1; (o.yt || []).forEach(function (y) { if (y === o.y[0]) return; g.beginPath(); g.moveTo(R.x0, Y(y)); g.lineTo(R.x1, Y(y)); g.stroke(); }); }
  g.strokeStyle = C.chalk; g.lineWidth = 2; g.beginPath(); g.moveTo(R.x0, R.y0 - s * .6); g.lineTo(R.x0, R.y1); g.lineTo(R.x1 + s * .6, R.y1); g.stroke();
  if (o.cut) { var yy = R.y1 - s * .7; g.strokeStyle = C.chalk; g.lineWidth = 1.6; g.beginPath(); g.moveTo(R.x0 - 6, yy + 3); g.lineTo(R.x0 + 6, yy - 1); g.moveTo(R.x0 - 6, yy + 8); g.lineTo(R.x0 + 6, yy + 4); g.stroke(); }
  g.restore();
  (o.xt || []).forEach(function (x) { CH.text(D, X(x), R.y1 + s * 1, o.xf ? o.xf(x) : String(x), { size: s, num: true, a: a }); });
  (o.yt || []).forEach(function (y) { CH.text(D, R.x0 - s * .5, Y(y), o.yf ? o.yf(y) : String(y), { size: s, num: true, align: 'right', a: a }); });
  if (o.xl) CH.text(D, R.x1 + s * .4, R.y1 + s * 2.1, o.xl, { size: s, align: 'right', a: a, col: 'rgba(242,240,230,.75)' });
  if (o.yl) CH.text(D, R.x0, R.y0 - s * 1.5, o.yl, { size: s, align: 'center', a: a, col: 'rgba(242,240,230,.75)' });
  return { X: X, Y: Y, R: R, o: o, s: s };
};
/* ヒストグラム・棒グラフ。o：col、grow（0〜1、または i ごとの関数）、hl(i)→色、gap（棒グラフのすきま 0〜1）、labels（上に数）、fmt、alpha(i) */
CH.bars = function (D, Ax, edges, vals, o) {
  o = o || {}; var g = D.ctx, base = Ax.Y(Math.max(0, Ax.o.y[0])), out = [];
  vals.forEach(function (val, i) {
    var gr = typeof o.grow === 'function' ? o.grow(i) : (o.grow == null ? 1 : o.grow); if (gr <= 0) { out.push(null); return; }
    var x0 = Ax.X(edges[i]), x1 = Ax.X(edges[i + 1]), w = x1 - x0, gp = (o.gap || 0) * w, top = Ax.Y(Math.max(Ax.o.y[0], val) * gr + (1 - gr) * Math.max(0, Ax.o.y[0]));
    var col = (o.hl && o.hl(i)) || o.col || C.blue, al = (o.a == null ? 1 : o.a) * (o.alpha ? o.alpha(i) : 1);
    g.save(); g.globalAlpha = D.ga * al; g.fillStyle = hexA(col, o.fillA == null ? .5 : o.fillA); g.fillRect(x0 + gp / 2, top, w - gp, base - top);
    g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x0 + gp / 2, top, w - gp, base - top); g.restore();
    if (o.labels && gr >= .999 && val > 0) CH.text(D, (x0 + x1) / 2, top - Ax.s * .75, o.fmt ? o.fmt(val, i) : String(val), { size: Ax.s * 1.05, num: true, col: (o.hl && o.hl(i)) || o.lcol || C.chalk, a: al });
    out.push({ x0: x0 + gp / 2, x1: x1 - gp / 2, y0: top, y1: base, cx: (x0 + x1) / 2 });
  });
  return out;
};
/* 折れ線。pts は [x, y]（グラフの値）。o.t（0〜1 で、とちゅうまで）、dots、col、w、dash */
CH.path = function (D, Ax, pts, o) {
  o = o || {}; if (pts.length < 2) return; var g = D.ctx, t = o.t == null ? 1 : clamp(o.t, 0, 1), k = t * (pts.length - 1), n = Math.floor(k), f = k - n;
  var P = pts.map(function (p) { return [Ax.X(p[0]), Ax.Y(p[1])]; });
  g.save(); g.globalAlpha = A(D, o.a); g.strokeStyle = o.col || C.yel; g.lineWidth = o.w || 2.6; g.lineJoin = 'round'; g.lineCap = 'round';
  if (o.dash) g.setLineDash([7, 6]);
  if (o.glow) { g.shadowColor = hexA(o.col || C.yel, .55); g.shadowBlur = 8; }
  g.beginPath(); g.moveTo(P[0][0], P[0][1]);
  for (var i = 1; i <= n && i < P.length; i++) g.lineTo(P[i][0], P[i][1]);
  if (n < P.length - 1 && f > 0) g.lineTo(lerp(P[n][0], P[n + 1][0], f), lerp(P[n][1], P[n + 1][1], f));
  g.stroke(); g.restore();
  if (o.dots !== false) for (var j = 0; j <= Math.min(n, P.length - 1); j++) CH.circle(D, P[j][0], P[j][1], o.r || 4.5, { fill: o.dotCol || o.col || C.yel, stroke: 'rgba(20,30,24,.8)', sw: 1.2, a: o.a });
  return P;
};
/* 表。head：[見出し, …]、rows：[[見出し, …], …]。o：fw（1列目の幅の割合）、hl(r, c)→色、show(r, c)→濃さ（0 で空ける）、size、rh（行の高さの上限） */
CH.table = function (D, R, head, rows, o) {
  o = o || {}; var nC = head.length, nR = rows.length + 1, fw = o.fw == null ? .26 : o.fw, w0 = R.w * fw, cw = (R.w - w0) / (nC - 1);
  var rh = Math.min(R.h / nR, o.rh || CH.fs(D) * 2.2), H = rh * nR, y0 = o.top ? R.y0 : R.cy - H / 2, s = o.size || Math.min(CH.fs(D, .82), cw * .3, rh * .45), g = D.ctx;
  function cell(r, c) { var x0 = c === 0 ? R.x0 : R.x0 + w0 + (c - 1) * cw, x1 = c === 0 ? R.x0 + w0 : x0 + cw; return rect(x0, y0 + r * rh, x1, y0 + (r + 1) * rh); }
  for (var r = 0; r < nR; r++) for (var c = 0; c < nC; c++) {
    var q = cell(r, c), hl = o.hl ? o.hl(r, c) : null;
    if (r === 0 || c === 0) CH.fillRect(D, q.x0, q.y0, q.x1, q.y1, { fill: 'rgba(242,240,230,.06)', a: o.a });
    if (hl) CH.fillRect(D, q.x0, q.y0, q.x1, q.y1, { fill: hexA(hl, .28), a: o.a });
  }
  g.save(); g.globalAlpha = A(D, o.a); g.strokeStyle = 'rgba(242,240,230,.45)'; g.lineWidth = 1.2;
  for (var i = 0; i <= nR; i++) { g.beginPath(); g.moveTo(R.x0, y0 + i * rh); g.lineTo(R.x1, y0 + i * rh); g.stroke(); }
  for (var j = 0; j <= nC; j++) { var x = j === 0 ? R.x0 : R.x0 + w0 + (j - 1) * cw; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + H); g.stroke(); }
  g.restore();
  var all = [head].concat(rows);
  all.forEach(function (row, r) {
    row.forEach(function (txt, c) {
      var q = cell(r, c), sh = o.show ? o.show(r, c) : 1; if (sh <= 0 || txt == null || txt === '') return;
      var hl = o.hl ? o.hl(r, c) : null;
      CH.text(D, q.cx, q.cy + 1, String(txt), { size: c === 0 ? Math.min(s, w0 / Math.max(3, String(txt).length) * 1.15) : s, num: c > 0 && r > 0, col: hl || (r === 0 || c === 0 ? 'rgba(242,240,230,.8)' : C.chalk), a: (o.a == null ? 1 : o.a) * sh });
    });
  });
  return { cell: cell, rh: rh, y0: y0, y1: y0 + H };
};
/* 数直線（下に目もり）。min・max・step、lab（字を書く間かく）。X を返す */
CH.numline = function (D, R, min, max, step, o) {
  o = o || {}; var X = function (val) { return R.x0 + (val - min) / (max - min) * R.w; }, y = R.y1, s = o.size || CH.fs(D, .78), lab = o.lab || step;
  CH.line(D, R.x0 - 6, y, R.x1 + 6, y, { w: 2, a: o.a });
  for (var val = min; val <= max + 1e-9; val += step) {
    var isLab = Math.abs(Math.round((val - min) / lab) * lab - (val - min)) < 1e-9;
    CH.line(D, X(val), y - (isLab ? 7 : 4), X(val), y + (isLab ? 7 : 4), { w: 1.6, a: o.a });
    if (isLab) CH.text(D, X(val), y + s * 1.2, o.fmt ? o.fmt(val) : String(Math.round(val * 100) / 100), { size: s, num: true, a: o.a });
  }
  if (o.unit) CH.text(D, R.x1 + s * .4, y + s * 2.3, o.unit, { size: s, align: 'right', col: 'rgba(242,240,230,.75)', a: o.a });
  return X;
};
/* ドットプロット：同じ値は上に積む。vals、X、y（数直線の高さ）、o：r、col(i, val)、a(i)。各点の位置を返す */
CH.dots = function (D, X, y, vals, o) {
  o = o || {}; var cnt = {}, r = o.r || CH.fs(D, .42), out = [];
  vals.forEach(function (val, i) {
    var k = cnt[val] || 0; cnt[val] = k + 1;
    var x = X(val), yy = y - r * 1.25 - k * r * 2.2, col = o.col ? o.col(i, val) : C.blue, al = o.alpha ? o.alpha(i) : 1;
    if (al > 0) CH.circle(D, x, yy, r, { fill: hexA(col, .85), stroke: 'rgba(20,30,24,.8)', sw: 1.2, a: al * (o.a == null ? 1 : o.a) });
    out.push([x, yy]);
  });
  return out;
};
/* 人や日などを、小さな丸の並びで。n こ、on(i)→色（なければうすい丸） */
CH.grid = function (D, R, n, o) {
  o = o || {}; var cols = o.cols || Math.ceil(Math.sqrt(n * R.w / R.h)), rows = Math.ceil(n / cols), cw = R.w / cols, chh = R.h / rows, r = Math.min(cw, chh) * (o.k || .36), out = [];
  for (var i = 0; i < n; i++) {
    var c = i % cols, rr = Math.floor(i / cols), x = R.x0 + (c + .5) * cw, y = R.y0 + (rr + .5) * chh, col = o.on ? o.on(i) : null;
    CH.circle(D, x, y, r, { fill: col ? hexA(col, .9) : 'rgba(242,240,230,.18)', stroke: col ? 'rgba(20,30,24,.6)' : null, sw: 1, a: o.a });
    out.push([x, y]);
  }
  return out;
};
/* 字の大きさを、幅 maxW に入るまで小さくする（size はもとの大きさ） */
CH.fitSize = function (D, txt, maxW, size, o) {
  o = o || {}; var g = D.ctx; g.save(); g.font = (o.w || 600) + ' ' + size + 'px ' + (o.num ? NUM : FONT); var w = g.measureText(String(txt)).width; g.restore();
  return w > maxW && w > 0 ? size * maxW / w : size;
};
/* 幅 maxW で折り返した行の配列（日本語は1字ずつ、、。は行の頭にしない） */
CH.wrap = function (D, txt, maxW, size, o) {
  o = o || {}; var g = D.ctx, out = [], line = ''; g.save(); g.font = (o.w || 600) + ' ' + size + 'px ' + (o.num ? NUM : FONT);
  String(txt).split('').forEach(function (ch) { if (line && g.measureText(line + ch).width > maxW && '、。）」'.indexOf(ch) < 0) { out.push(line); line = ''; } line += ch; });
  if (line) out.push(line); g.restore(); return out;
};
/* 横にのびる帯（テープ図）。parts：[{v, col, txt}]、total、o.a */
CH.tape = function (D, x0, y0, w, h, parts, total, o) {
  o = o || {}; var x = x0;
  parts.forEach(function (p) {
    var pw = w * p.v / total; CH.fillRect(D, x, y0, x + pw, y0 + h, { fill: hexA(p.col || C.blue, .45), stroke: p.col || C.blue, a: (o.a == null ? 1 : o.a) * (p.a == null ? 1 : p.a) });
    if (p.txt) { var sz = Math.min(h * .45, CH.fs(D, .9)); CH.text(D, x + pw / 2, y0 + h / 2, p.txt, { size: CH.fitSize(D, p.txt, pw * .92, sz, { num: true }), num: true, a: (o.a == null ? 1 : o.a) * (p.a == null ? 1 : p.a) }); }
    x += pw;
  });
};

/* 数のカードを、階級ごとに積む（ヒストグラムのもと）。Ax の縦は人数。
   o：pos(i)→[x, y]（いまの とび先を上書き。とんでいる途中など）、hl(i)→色、alpha(i)、col、txt（false で数を書かない） */
CH.stacks = function (D, Ax, vals, edges, o) {
  o = o || {}; var k = edges.slice(1).map(function () { return 0; }), out = [];
  vals.forEach(function (x, i) {
    var b = -1; for (var j = 0; j < edges.length - 1; j++) if (x >= edges[j] && x < edges[j + 1]) { b = j; break; }
    if (b < 0) { out.push(null); return; }
    var x0 = Ax.X(edges[b]), x1 = Ax.X(edges[b + 1]), y0 = Ax.Y(k[b] + 1), y1 = Ax.Y(k[b]); k[b]++;
    out.push({ b: b, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: (x1 - x0) * .9, h: (y1 - y0) * .9 });
  });
  out.forEach(function (q, i) {
    if (!q) return; var p = o.pos ? o.pos(i, q) : null, al = o.alpha ? o.alpha(i) : 1; if (al <= 0) return;
    var x = p ? p[0] : q.x, y = p ? p[1] : q.y, col = (o.hl && o.hl(i)) || o.col || C.blue;
    CH.card(D, x, y, q.w, q.h, o.txt === false || q.h < 11 || q.w < 16 ? '' : vals[i], { col: col, a: al, size: Math.min(q.h * .62, q.w * .42) });
  });
  return out;
};

/* ---- 座標平面（一次関数など） ----
   CH.plane(D, R, o)：o.x・o.y（[最小, 最大]）、o.step（方眼）、o.lab（目もりの字の間かく）、o.fit（false でなければ、縦横の1目もりを同じ長さに）
   返すもの：X(x)・Y(y)（座標 → 画面）、R（実際の四角）、u（1目もりの長さ）、s（字の大きさ） */
CH.mnum = function (v) { var r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };
CH.plane = function (D, R, o) {
  o = o || {}; var xr = o.x || [-5, 5], yr = o.y || [-5, 5], st = o.step || 1, lab = o.lab || st, s = o.size || CH.fs(D, .72), g = D.ctx, a = o.a;
  if (o.fit !== false) {
    var u = Math.min(R.w / (xr[1] - xr[0]), R.h / (yr[1] - yr[0])), w = u * (xr[1] - xr[0]), h = u * (yr[1] - yr[0]);
    R = rect(R.cx - w / 2, R.cy - h / 2, R.cx + w / 2, R.cy + h / 2);
  }
  var ux = R.w / (xr[1] - xr[0]), uy = R.h / (yr[1] - yr[0]);
  var X = function (x) { return R.x0 + (x - xr[0]) * ux; }, Y = function (y) { return R.y1 - (y - yr[0]) * uy; };
  var ox = clamp(0, xr[0], xr[1]), oy = clamp(0, yr[0], yr[1]), x, y;
  g.save(); g.globalAlpha = A(D, a);
  if (o.grid !== false) {
    g.strokeStyle = 'rgba(242,240,230,.12)'; g.lineWidth = 1; g.beginPath();
    for (x = Math.ceil(xr[0] / st) * st; x <= xr[1] + 1e-9; x += st) { g.moveTo(X(x), R.y0); g.lineTo(X(x), R.y1); }
    for (y = Math.ceil(yr[0] / st) * st; y <= yr[1] + 1e-9; y += st) { g.moveTo(R.x0, Y(y)); g.lineTo(R.x1, Y(y)); }
    g.stroke();
  }
  g.restore();
  CH.arrow(D, R.x0 - 4, Y(oy), R.x1 + s * .9, Y(oy), { w: 2, a: a, head: 9 });
  CH.arrow(D, X(ox), R.y1 + 4, X(ox), R.y0 - s * .9, { w: 2, a: a, head: 9 });
  CH.text(D, R.x1 + s * 1.3, Y(oy) + s * .1, o.xn || 'x', { size: s * 1.2, a: a, col: 'rgba(242,240,230,.85)', w: 400 });
  CH.text(D, X(ox) + s * .9, R.y0 - s * .8, o.yn || 'y', { size: s * 1.2, a: a, col: 'rgba(242,240,230,.85)', w: 400 });
  if (ox === 0 && oy === 0) CH.text(D, X(0) - s * .7, Y(0) + s * .8, 'O', { size: s, a: a, num: true });
  if (o.nums !== false) {
    for (x = Math.ceil(xr[0] / lab) * lab; x <= xr[1] + 1e-9; x += lab) if (Math.abs(x) > 1e-9) { CH.line(D, X(x), Y(oy) - 4, X(x), Y(oy) + 4, { w: 1.4, a: a }); CH.text(D, X(x), Y(oy) + s * 1, CH.mnum(x), { size: s, num: true, a: a }); }
    for (y = Math.ceil(yr[0] / lab) * lab; y <= yr[1] + 1e-9; y += lab) if (Math.abs(y) > 1e-9) { CH.line(D, X(ox) - 4, Y(y), X(ox) + 4, Y(y), { w: 1.4, a: a }); CH.text(D, X(ox) - s * .6, Y(y), CH.mnum(y), { size: s, num: true, align: 'right', a: a }); }
  }
  return { X: X, Y: Y, R: R, u: ux, xr: xr, yr: yr, s: s };
};
/* 関数のグラフ。f(x) を、平面の中だけ描く。o：x0・x1（変域）、t（0〜1 で途中まで）、col、w、dash、a */
CH.fn = function (D, Pl, f, o) {
  o = o || {}; var x0 = o.x0 == null ? Pl.xr[0] : o.x0, x1 = o.x1 == null ? Pl.xr[1] : o.x1, t = o.t == null ? 1 : clamp(o.t, 0, 1), n = o.n || 240, g = D.ctx, on = false;
  var y0 = Pl.yr[0] - (Pl.yr[1] - Pl.yr[0]) * .002, y1 = Pl.yr[1] + (Pl.yr[1] - Pl.yr[0]) * .002;
  g.save(); g.globalAlpha = A(D, o.a); g.strokeStyle = o.col || C.yel; g.lineWidth = o.w || 3; g.lineCap = 'round'; g.lineJoin = 'round';
  if (o.dash) g.setLineDash(o.dash === true ? [8, 7] : o.dash);
  if (o.glow) { g.shadowColor = hexA(o.col || C.yel, .55); g.shadowBlur = 8; }
  g.beginPath();
  for (var i = 0; i <= n * t; i++) {
    var x = x0 + (x1 - x0) * i / n, y = f(x);
    if (y >= y0 && y <= y1 && isFinite(y)) { if (on) g.lineTo(Pl.X(x), Pl.Y(y)); else g.moveTo(Pl.X(x), Pl.Y(y)); on = true; } else on = false;
  }
  g.stroke(); g.restore();
};
/* 直線 y＝ax＋b（変域つきでも）。端を ●（ふくむ）・○（ふくまない）にできる：o.ends ['in'|'out'|null, …] */
CH.lin = function (D, Pl, a, b, o) {
  o = o || {}; CH.fn(D, Pl, function (x) { return a * x + b; }, o);
  if (o.ends) [o.x0, o.x1].forEach(function (x, i) { var e = o.ends[i]; if (!e || x == null) return; CH.pt(D, Pl, x, a * x + b, { col: o.col, open: e === 'out', a: o.a }); });
};
/* 座標の点。o：col、r、open（白ぬき）、lab（字）、dir（字の向き 'ne' 'nw' 'se' 'sw' 'n' 's' 'e' 'w'）、a */
CH.pt = function (D, Pl, x, y, o) {
  o = o || {}; var px = Pl.X(x), py = Pl.Y(y), r = o.r || CH.fs(D, .3), col = o.col || C.yel;
  CH.circle(D, px, py, r, o.open ? { fill: '#1f3a2c', stroke: col, sw: 2.4, a: o.a } : { fill: col, stroke: 'rgba(20,30,24,.8)', sw: 1.2, a: o.a });
  if (o.lab) {
    var d = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [.8, -.8], nw: [-.8, -.8], se: [.8, .8], sw: [-.8, .8] }[o.dir || 'ne'], s = o.size || CH.fs(D, .85);
    CH.text(D, px + d[0] * s * .9, py + d[1] * s * .9, o.lab, { col: o.tcol || col, size: s, a: o.a, align: d[0] > .1 ? 'left' : d[0] < -.1 ? 'right' : 'center', outline: 'rgba(20,40,30,.9)' });
  }
};
/* 平面の上の線分・矢印（座標で） */
CH.pseg = function (D, Pl, p, q, o) { o = o || {}; (o.arrow ? CH.arrow : CH.line)(D, Pl.X(p[0]), Pl.Y(p[1]), Pl.X(q[0]), Pl.Y(q[1]), o); };
/* 傾きの三角形：(x0, a*x0+b) から右へ dx、上へ a*dx。o.lx・o.ly（字）、col */
CH.slopeTri = function (D, Pl, a, b, x0, dx, o) {
  o = o || {}; var y0 = a * x0 + b, col = o.col || C.pink, s = CH.fs(D, .8), dy = a * dx;
  CH.pseg(D, Pl, [x0, y0], [x0 + dx, y0], { col: col, w: 2.4, dash: true, a: o.a });
  CH.pseg(D, Pl, [x0 + dx, y0], [x0 + dx, y0 + dy], { col: col, w: 2.4, dash: true, a: o.a });
  CH.text(D, Pl.X(x0 + dx / 2), Pl.Y(y0) + (dy >= 0 ? s : -s), o.lx || ('＋' + CH.mnum(dx)), { col: col, size: s, a: o.a, outline: 'rgba(20,40,30,.9)' });
  CH.text(D, Pl.X(x0 + dx) + s * .5, Pl.Y(y0 + dy / 2), o.ly || ((dy >= 0 ? '＋' : '') + CH.mnum(dy)), { col: col, size: s, a: o.a, align: 'left', outline: 'rgba(20,40,30,.9)' });
};

/* ---- 数の道具 ---- */
CH.sum = function (a) { return a.reduce(function (s, x) { return s + x; }, 0); };
CH.mean = function (a) { return CH.sum(a) / a.length; };
CH.median = function (a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
CH.mode = function (a) { var c = {}, best = null; a.forEach(function (x) { c[x] = (c[x] || 0) + 1; }); Object.keys(c).forEach(function (k) { if (best === null || c[k] > c[best]) best = k; }); return +best; };
CH.cum = function (a) { var s = 0; return a.map(function (x) { s += x; return s; }); };
CH.bin = function (vals, edges) { var c = edges.slice(1).map(function () { return 0; }); vals.forEach(function (x) { for (var i = 0; i < edges.length - 1; i++) if (x >= edges[i] && x < edges[i + 1]) { c[i]++; return; } }); return c; };
CH.f2 = function (x) { return (Math.round(x * 100 + 1e-9) / 100).toFixed(2); };
CH.f1 = function (x) { return (Math.round(x * 10 + 1e-9) / 10).toFixed(1); };
/* ページに書いた答えと、計算した値が同じか（ちがえば、コンソールに出す） */
CH.check = function (ok, what) { if (!ok && window.console) console.error('答えがちがう：' + what); return ok; };
CH.near = function (a, b) { return Math.abs(a - b) < 1e-9; };
/* くり返して同じになる乱数（キャップ投げなど） */
CH.rng = function (seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

window.CH = CH;
})();
