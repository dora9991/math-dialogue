// dsl.js — 解説動画の「場面（scene）」を書くための道具（画面を持たない純粋な関数だけ）
//
// 座標：SVG と同じ（x は右へ、y は下へ増える）。図の座標は、印刷物の図を見ながら
//        「図のなかの座標」を自由に決めてよい（view で、見える範囲を決める）。
// 角度：度。「画面で反時計まわり」に増える。0°＝右（東）、90°＝上（北）、180°＝左、270°＝下。
//
// 場面の形（default export）：
//   { n: 9, title: "…", problem: "問題文", answer: "答え（ことばで1〜2行）",
//     view: [0, 0, 400, 300],          // [左上x, 左上y, 幅, 高さ]
//     grid: { x:0, y:0, nx:10, ny:8, s:30 },   // 方眼（任意）
//     steps: [ { cap:"字幕", eq:["式1","式2"], add:[要素…], hl:["id"], hide:["id"], clear:false, dur:ミリ秒 }, … ] }
//
// steps[0] は「問題の図」（add に与えられた図をすべて入れる。ここに入れた要素は clear されない）。
import { polar as _polar, dirDeg as _dirDeg } from "./geo.js";

// ── 要素をつくる関数 ─────────────────────────────────
// 色：c に 'g'（黒・与えられた図）, 'b'（緑・かいた線）, 'a'（赤・答え）, 'k'（灰）, 'y'（黄）, 'p'（紫）または CSS 色。
//     指定が無ければ、steps[0] の要素は 'g'、それ以降は 'b'。
export const P = (id, x, y, l = id, p = "ne", o = {}) => ({ t: "pt", id, x, y, l, p, ...o });          // 点（と名前）。l:'' なら名前なし。dot:false なら点なし
export const seg = (a, b, o = {}) => ({ t: "seg", a, b, ...o });                                      // 線分（a,b は点の id か [x,y]）。tick:1|2|3 で等しい長さの印
export const line = (a, b, o = {}) => ({ t: "line", a, b, ...o });                                    // 直線（a,b を通り、図のはしまでのびる）
export const poly = (pts, o = {}) => ({ t: "poly", pts, ...o });                                      // 多角形。fill:'色'|'hatch'、close:false で折れ線
export const arc = (ctr, r, from = 0, to = 360, o = {}) => ({ t: "arc", ctr, r, from, to, ...o });     // 円の一部（中心は点の id か [x,y]）。from→to は反時計まわり
export const circ = (ctr, r, o = {}) => arc(ctr, r, 0, 360, o);                                           // 円
export const txt = (x, y, s, o = {}) => ({ t: "txt", x, y, s, ...o });                                // 文字。size:16、anchor:'middle'|'start'|'end'
export const ang = (at, from, to, o = {}) => ({ t: "ang", at, from, to, ...o });                      // 角の印（弧）。l:'(ア)' で名前、r:半径、fill:true で色ぬり、big:true で大きいほうの角
export const rt = (at, from, to, o = {}) => ({ t: "rt", at, from, to, ...o });                        // 直角の印（□）
export const arrow = (a, b, o = {}) => ({ t: "arrow", a, b, ...o });                                  // 矢印
export const path = (d, o = {}) => ({ t: "path", d, ...o });                                          // SVG の path をそのまま。fill:'色' 可
export const ell = (ctr, rx, ry, from = 0, to = 360, o = {}) => ({ t: "ell", ctr, rx, ry, from, to, ...o }); // 楕円（円柱・円錐の底面）。from→to は反時計まわり
export const dot = (x, y, o = {}) => ({ t: "dot", x, y, ...o });                                      // 点（名前なし）

// ── 計算の道具（座標は [x, y]） ─────────────────────────
const f = (n) => Math.round(n * 1000) / 1000;
export const polar = _polar;      // polar(c, r, deg) → [x, y]
export const dirDeg = _dirDeg;    // dirDeg(a, b)     → a から b を見た向き（度）
export const geo = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, k) => [a[0] * k, a[1] * k],
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]),
  mid: (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
  // 点 p を、中心 c のまわりに deg 度（画面で反時計まわり）回す
  rot: (p, c, deg) => {
    const r = (deg * Math.PI) / 180, dx = p[0] - c[0], dy = p[1] - c[1];
    return [c[0] + dx * Math.cos(r) + dy * Math.sin(r), c[1] - dx * Math.sin(r) + dy * Math.cos(r)];
  },
  // 点 p から直線 ab へおろした垂線の足
  foot: (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    return [a[0] + dx * t, a[1] + dy * t];
  },
  // 点 p を、直線 ab について対称移動した点
  reflect: (p, a, b) => {
    const h = geo.foot(p, a, b);
    return [2 * h[0] - p[0], 2 * h[1] - p[1]];
  },
  // 直線 ab と直線 cd の交点
  interLL: (a, b, c, d) => {
    const x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1], x3 = c[0], y3 = c[1], x4 = d[0], y4 = d[1];
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  },
  // 円 (c1, r1) と円 (c2, r2) の交点（2つ。[先, 後]）。先＝c1→c2 の向きから見て左側（画面で上側になりやすい）
  interCC: (c1, r1, c2, r2) => {
    const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const ux = (c2[0] - c1[0]) / d, uy = (c2[1] - c1[1]) / d;
    const mx = c1[0] + a * ux, my = c1[1] + a * uy;
    return [[mx + h * uy, my - h * ux], [mx - h * uy, my + h * ux]];
  },
  // 円 (c, r) と直線 ab の交点（2つ。a に近い順）
  interLC: (a, b, c, r) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], fx = a[0] - c[0], fy = a[1] - c[1];
    const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - r * r;
    const D = Math.sqrt(Math.max(0, B * B - 4 * A * C));
    return [(-B - D) / (2 * A), (-B + D) / (2 * A)].map((t) => [a[0] + t * dx, a[1] + t * dy]);
  },
  // 頂点 at から見た、角 from-at-to の二等分線の向き（度）
  bisectDir: (at, from, to) => {
    const d1 = _dirDeg(at, from), d2 = _dirDeg(at, to);
    let diff = (((d2 - d1) % 360) + 360) % 360;
    return diff <= 180 ? d1 + diff / 2 : d2 + (360 - diff) / 2;
  },
  // 三角形の外心・内心
  circumcenter: (a, b, c) => {
    const m1 = geo.mid(a, b), m2 = geo.mid(b, c);
    const n1 = [m1[0] - (b[1] - a[1]), m1[1] + (b[0] - a[0])], n2 = [m2[0] - (c[1] - b[1]), m2[1] + (c[0] - b[0])];
    return geo.interLL(m1, n1, m2, n2);
  },
  incenter: (a, b, c) => {
    const la = geo.dist(b, c), lb = geo.dist(a, c), lc = geo.dist(a, b), s = la + lb + lc;
    return [(la * a[0] + lb * b[0] + lc * c[0]) / s, (la * a[1] + lb * b[1] + lc * c[1]) / s];
  },
  f,
};

// ── 立体（斜投影）の道具 ─────────────────────────────
// oblique(ox, oy, k, deg) → 3次元の点 [x, y, z]（x:右 y:おく z:上）を [画面x, 画面y] にうつす関数
export function oblique(ox, oy, k = 0.5, deg = 40) {
  const a = (deg * Math.PI) / 180;
  return ([x, y, z]) => [f(ox + x + k * y * Math.cos(a)), f(oy - z - k * y * Math.sin(a))];
}
// solid(proj, verts, edges, hiddenEdges, opt) → { els, pt }
//   verts: { A:[x,y,z], … }  edges: [['A','B'], …]（見える辺）  hiddenEdges: [['A','D'], …]（見えない辺→点線）
//   opt.lp: { A:'nw', … } 名前をおく向き。opt.label:false で名前なし
export function solid(proj, verts, edges, hiddenEdges = [], opt = {}) {
  const pt = {}, els = [];
  for (const [k, v] of Object.entries(verts)) pt[k] = proj(v);
  for (const k of Object.keys(verts)) els.push(P(k, pt[k][0], pt[k][1], opt.label === false ? "" : k, (opt.lp || {})[k] || "ne", { dot: false, ...(opt.pt || {}) }));
  for (const [a, b] of edges) els.push(seg(a, b, opt.seg || {}));
  for (const [a, b] of hiddenEdges) els.push(seg(a, b, { dash: true, ...(opt.seg || {}) }));
  return { els, pt };
}
