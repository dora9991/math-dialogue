'use strict';
/* ============================================================
   art.js — ドット絵（コードで描く）
   ・ロボは「頭・胴・手×2・足×2」が宙に浮いた別パーツ（ジョイメカ風）
   ・各パーツは小さな図形の命令列から生成：塗り→自動で縁取り→ハイライト/影
   ============================================================ */

/* ---------- 共通色（ファミコンっぽい少数色） ---------- */
const COL = {
  K: '#000000', W: '#fcfcfc', G: '#bcbcbc', g: '#7c7c7c', d: '#383838',
  Y: '#fcd838', y: '#c89800', R: '#d82800', r: '#a81000', O: '#fc9838', o: '#e45c10',
  L: '#80d010', l: '#388800', U: '#3cbcfc', u: '#0058f8', N: '#886400', n: '#503000',
  P: '#f878f8', p: '#a800a0', T: '#a4e4fc',
};

/* ---------- 描画ヘルパー（論理座標のfillRectだけで描く） ---------- */
function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function E(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  for (let y = Math.ceil(cy - ry); y < Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry;
    const w = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    const x0 = Math.round(cx - w), x1 = Math.round(cx + w);
    if (x1 > x0) c.fillRect(x0, y, x1 - x0, 1);
  }
}
function Tri(c, x0, y0, x1, y1, x2, y2, col) {
  c.fillStyle = col;
  const minY = Math.floor(Math.min(y0, y1, y2)), maxY = Math.ceil(Math.max(y0, y1, y2));
  const minX = Math.floor(Math.min(x0, x1, x2)), maxX = Math.ceil(Math.max(x0, x1, x2));
  for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
    if (inTri(x + 0.5, y + 0.5, x0, y0, x1, y1, x2, y2)) c.fillRect(x, y, 1, 1);
  }
}
function inTri(px, py, x0, y0, x1, y1, x2, y2) {
  const d1 = (px - x1) * (y0 - y1) - (x0 - x1) * (py - y1);
  const d2 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d3 = (px - x0) * (y2 - y0) - (x2 - x0) * (py - y0);
  const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
function Line(c, x0, y0, x1, y1, col) {
  c.fillStyle = col;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    c.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
/* 市松（ディザ）塗り */
function Dither(c, x, y, w, h, col, phase) {
  c.fillStyle = col;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((i + j + (phase | 0)) & 1) === 0) c.fillRect(x + i, y + j, 1, 1);
}

/* ---------- スプライトの元になる「文字グリッド」 ---------- */
const mkGrid = (w, h) => Array.from({ length: h }, () => new Array(w).fill(null));
const GOP = {
  e(g, cx, cy, rx, ry, k) {
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) g[y][x] = k;
    }
  },
  r(g, x, y, w, h, k) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < g.length && i >= 0 && i < g[0].length) g[j][i] = k;
  },
  p(g, x, y, k) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = k; },
  pp(g, pts, k) { for (const q of pts) GOP.p(g, q[0], q[1], k); },
  l(g, x0, y0, x1, y1, k) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      GOP.p(g, x0, y0, k);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },
  t(g, x0, y0, x1, y1, x2, y2, k) {
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (inTri(x + 0.5, y + 0.5, x0, y0, x1, y1, x2, y2)) g[y][x] = k;
  },
  // 範囲内で from の色だけを to に塗り替える（形はそのまま）
  q(g, x, y, w, h, from, to) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] === from) g[j][i] = to;
  },
  qe(g, cx, cy, rx, ry, from, to) {
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && g[y][x] === from) g[y][x] = to;
    }
  },
  // 台形（上幅 tw、下幅 bw、高さ h、中心 cx）
  z(g, cx, y, tw, bw, h, k) {
    for (let j = 0; j < h; j++) {
      const w = tw + (bw - tw) * (j / Math.max(1, h - 1));
      GOP.r(g, Math.round(cx - w / 2), y + j, Math.round(w), 1, k);
    }
  },
  // レンガの目地：すでに塗ってある所だけ上書き
  m(g, x, y, w, h, rh, cw, k) {
    for (let r = 0; r * rh < h; r++) {
      const yy = y + r * rh;
      for (let xx = x; xx < x + w; xx++) if (g[yy] && g[yy][xx]) g[yy][xx] = k;
      const off = (r % 2) * (cw >> 1);
      for (let xx = x + off; xx < x + w; xx += cw) for (let j = 1; j < rh; j++) if (g[yy + j] && g[yy + j][xx]) g[yy + j][xx] = k;
    }
  },
};
const SHADED = { B: 1, C: 1, D: 1 };

/* グリッド → キャンバス（縁取り＋ハイライト/影を自動で付ける） */
function buildSprite(w, h, ops, pal) {
  const g = mkGrid(w, h);
  for (const op of ops) GOP[op[0]](g, ...op.slice(1));
  const sh = g.map((r) => r.slice());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = g[y][x];
    if (!k || !SHADED[k]) continue;
    const up = y > 0 ? g[y - 1][x] : null, dn = y < h - 1 ? g[y + 1][x] : null;
    const lf = x > 0 ? g[y][x - 1] : null, rt = x < w - 1 ? g[y][x + 1] : null;
    const hl = !up || !lf, sd = !dn || !rt;
    if (hl && !sd) sh[y][x] = k + 'H';
    else if (sd && !hl) sh[y][x] = k + 'S';
  }
  const cv = document.createElement('canvas');
  cv.width = w + 2; cv.height = h + 2;
  const c = cv.getContext('2d');
  const colorOf = (k) => pal[k] || COL[k] || '#ff00ff';
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
    const k = y >= 0 && y < h && x >= 0 && x < w ? sh[y][x] : null;
    if (k) { c.fillStyle = colorOf(k); c.fillRect(x + 1, y + 1, 1, 1); continue; }
    // 縁取り：上下左右のどれかに絵があれば黒
    const n = (xx, yy) => (yy >= 0 && yy < h && xx >= 0 && xx < w ? g[yy][xx] : null);
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) { c.fillStyle = COL.K; c.fillRect(x + 1, y + 1, 1, 1); }
  }
  return cv;
}
function mirrorCanvas(src) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  const c = cv.getContext('2d');
  c.translate(src.width, 0); c.scale(-1, 1); c.drawImage(src, 0, 0);
  return cv;
}
function tintCanvas(src, fill, comp) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  const c = cv.getContext('2d');
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = comp || 'source-atop';
  c.fillStyle = fill; c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}
/* 1パーツ分の見た目セット：n=通常 f=反転 b=奥側(暗) bf=奥側反転 w=白フラッシュ wf=反転 */
function partSet(w, h, ops, pal) {
  const n = buildSprite(w, h, ops, pal);
  const f = mirrorCanvas(n);
  return { n, f, b: tintCanvas(n, 'rgba(0,0,30,0.34)'), bf: tintCanvas(f, 'rgba(0,0,30,0.34)'),
    w: tintCanvas(n, '#ffffff'), wf: tintCanvas(f, '#ffffff'), cw: n.width, ch: n.height };
}

/* ============================================================
   キャラのパーツ定義
   size: [幅,高さ]（縁取りを除いた内側）。座標は左上が(0,0)。
   B/C/D=自動で明暗がつく色、A/a=アクセント、K=黒、W=白 ほか COL
   ============================================================ */
const ART = {
  /* 全員「右斜め前」を向いた絵。左向きは自動で反転する。
     コツ：目や顔の面を前側に寄せる／奥の目は細く／後ろ側の面を暗くする／つま先を前に出す */
  /* ---- コテツ：赤い町工場ロボ ---- */
  kotetsu: {
    pal: { B: '#d82800', BH: '#fc7460', BS: '#a81000', C: '#f4f4f4', CH: '#ffffff', CS: '#b0b0b0', A: '#f8b800', a: '#ac7c00' },
    size: { head: [20, 18], torso: [22, 22], hand: [12, 12], foot: [14, 9] },
    head: [['e', 10, 10, 10, 8, 'B'], ['qe', 4, 11, 4.6, 6.5, 'B', 'BS'], ['e', 12.8, 12, 6.4, 4.8, 'C'],
      ['r', 15, 10, 3, 3, 'K'], ['r', 9, 10, 2, 3, 'K'], ['p', 15, 10, 'W'], ['p', 9, 10, 'W'],
      ['r', 12, 0, 2, 3, 'A'], ['p', 11, 2, 'A'], ['pp', [[2, 11], [2, 12], [3, 11]], 'A'], ['p', 18, 13, 'A'], ['r', 11, 15, 5, 1, 'K']],
    torso: [['e', 11, 11, 11, 10.5, 'B'], ['qe', 4, 12, 4.6, 9, 'B', 'BS'], ['e', 13.5, 13, 6, 6.5, 'C'],
      ['p', 13, 10, 'A'], ['r', 12, 11, 3, 1, 'A'], ['p', 13, 12, 'A'], ['q', 3, 18, 16, 2, 'B', 'a'], ['p', 19, 8, 'A'], ['p', 3, 9, 'a']],
    hand: [['r', 0, 3, 3, 6, 'B'], ['e', 6.5, 6, 5.5, 6, 'C'], ['r', 8, 4, 3, 1, 'CS'], ['r', 8, 7, 3, 1, 'CS']],
    foot: [['e', 6.5, 5, 6.5, 4, 'B'], ['e', 10.5, 6, 3.5, 3, 'B'], ['r', 1, 7, 12, 2, 'C'], ['r', 10, 4, 4, 3, 'C']],
  },
  /* ---- ガンジョウ：お城の石垣ゴーレム ---- */
  ganjou: {
    pal: { B: '#b4aca0', BH: '#e4dcc8', BS: '#746c60', C: '#8c7c64', CH: '#bcac90', CS: '#5c4c3c', A: '#fcd838', a: '#a47000', M: '#6c6054' },
    size: { head: [22, 20], torso: [28, 24], hand: [14, 14], foot: [16, 10] },
    head: [['r', 1, 6, 20, 13, 'B'], ['r', 1, 1, 5, 6, 'B'], ['r', 8, 1, 6, 6, 'B'], ['r', 16, 1, 5, 6, 'B'], ['q', 1, 1, 6, 18, 'B', 'C'], ['m', 1, 6, 20, 13, 6, 7, 'M'],
      ['r', 8, 9, 13, 4, 'K'], ['r', 9, 10, 3, 2, 'A'], ['r', 15, 10, 4, 2, 'A'], ['r', 9, 15, 11, 2, 'M']],
    torso: [['r', 4, 0, 20, 7, 'B'], ['r', 2, 7, 24, 17, 'B'], ['q', 2, 0, 8, 24, 'B', 'C'], ['m', 2, 0, 24, 24, 6, 8, 'M'], ['r', 15, 9, 4, 6, 'A'], ['r', 16, 8, 2, 1, 'A'], ['r', 15, 15, 4, 1, 'a']],
    hand: [['e', 7, 7, 7, 7, 'B'], ['m', 0, 0, 14, 14, 5, 7, 'M'], ['r', 9, 4, 4, 1, 'M'], ['r', 9, 8, 4, 1, 'M']],
    foot: [['r', 0, 2, 13, 8, 'B'], ['r', 13, 4, 3, 6, 'B'], ['r', 0, 0, 10, 3, 'B'], ['m', 0, 0, 16, 10, 5, 8, 'M']],
  },
  /* ---- アソン：阿蘇山の火山ロボ ---- */
  ason: {
    pal: { B: '#e45c10', BH: '#fc9838', BS: '#a42c00', C: '#6c4c3c', CH: '#a07860', CS: '#3c2418', A: '#fcd838', a: '#f89800' },
    size: { head: [20, 18], torso: [22, 22], hand: [12, 12], foot: [14, 9] },
    head: [['e', 10, 11, 10, 7, 'C'], ['qe', 4, 12, 4.4, 5.5, 'C', 'CS'], ['t', 6, 8, 10, 8, 7, 1, 'B'], ['t', 9, 8, 14, 8, 12, 0, 'B'], ['t', 13, 8, 18, 8, 18, 2, 'B'], ['t', 11, 8, 13, 8, 12, 3, 'A'],
      ['r', 13, 11, 4, 2, 'A'], ['r', 8, 11, 3, 2, 'A'], ['p', 15, 11, 'K'], ['p', 9, 11, 'K'], ['r', 9, 15, 8, 1, 'B'], ['p', 11, 16, 'A'], ['p', 14, 16, 'A']],
    torso: [['z', 11, 0, 12, 22, 22, 'C'], ['qe', 4, 12, 5, 10, 'C', 'CS'], ['l', 13, 3, 11, 8, 'B'], ['l', 11, 8, 14, 12, 'B'], ['l', 14, 12, 10, 17, 'B'], ['l', 13, 3, 15, 9, 'A'], ['l', 15, 9, 13, 14, 'a'],
      ['p', 17, 15, 'B'], ['p', 8, 19, 'B']],
    hand: [['e', 6, 6, 6, 6, 'B'], ['e', 6.5, 6, 3, 3, 'A'], ['p', 11, 3, 'a'], ['p', 11, 8, 'a']],
    foot: [['e', 6.5, 4.5, 6.5, 4.5, 'C'], ['e', 10.5, 5.5, 3.5, 3, 'C'], ['r', 1, 7, 13, 2, 'B']],
  },
  /* ---- バルーナ：バルーンフェスタのふわふわロボ ---- */
  baruna: {
    pal: { B: '#fc74b4', BH: '#fcc8e0', BS: '#c8286c', C: '#3cbcfc', CH: '#a4e4fc', CS: '#0070d8', A: '#fcfcfc', a: '#bcbcbc' },
    size: { head: [22, 22], torso: [16, 16], hand: [10, 10], foot: [12, 8] },
    head: [['e', 11, 10, 11, 10, 'B'], ['qe', 4, 11, 4.2, 8, 'B', 'BS'], ['t', 9, 19, 14, 19, 12, 21, 'BS'], ['r', 14, 9, 3, 3, 'K'], ['r', 8, 9, 2, 3, 'K'], ['p', 14, 9, 'W'], ['p', 8, 9, 'W'],
      ['pp', [[10, 14], [11, 15], [12, 15], [13, 15], [14, 15], [15, 14]], 'K'], ['pp', [[5, 4], [6, 3], [5, 5]], 'W'], ['r', 17, 12, 2, 1, 'BS'], ['r', 6, 12, 2, 1, 'BS']],
    torso: [['e', 8, 8, 8, 8, 'C'], ['qe', 3.5, 9, 3.5, 6, 'C', 'CS'], ['r', 2, 10, 12, 2, 'A'], ['e', 9.5, 5, 3, 2, 'A']],
    hand: [['e', 5, 5, 5, 5, 'A'], ['r', 6, 2, 3, 1, 'a'], ['r', 6, 6, 3, 1, 'a']],
    foot: [['e', 5.5, 4, 5.5, 4, 'B'], ['e', 8.5, 5, 3.5, 3, 'B'], ['r', 1, 6, 11, 2, 'A']],
  },
  /* ---- ルート：数学ラボの先生ロボ ---- */
  root: {
    pal: { B: '#2868e8', BH: '#6ca4fc', BS: '#0c2c9c', C: '#c4c4c4', CH: '#fcfcfc', CS: '#7c7c7c', A: '#fcfcfc', a: '#a4e4fc' },
    size: { head: [20, 18], torso: [22, 22], hand: [12, 12], foot: [14, 9] },
    head: [['r', 1, 3, 18, 14, 'C'], ['q', 1, 3, 4, 14, 'C', 'CS'], ['r', 2, 1, 16, 4, 'BS'],
      ['e', 9, 10, 3.2, 4.2, 'K'], ['e', 9, 10, 2.2, 3.2, 'W'], ['p', 9, 10, 'K'], ['e', 15, 10, 4.6, 4.6, 'K'], ['e', 15, 10, 3.6, 3.6, 'W'], ['p', 16, 10, 'K'], ['p', 16, 11, 'K'],
      ['r', 12, 9, 1, 1, 'K'], ['r', 11, 15, 5, 1, 'K'], ['pp', [[11, 2], [12, 2], [13, 3]], 'A']],
    torso: [['e', 11, 11, 11, 10.5, 'B'], ['qe', 4, 12, 4.6, 9, 'B', 'BS'], ['t', 7, 1, 19, 1, 13, 12, 'A'], ['r', 12, 4, 2, 9, 'R'], ['r', 11, 3, 4, 2, 'r'],
      ['pp', [[3, 17], [4, 18], [5, 19], [6, 18], [7, 17], [8, 16], [9, 15]], 'a'], ['r', 9, 15, 6, 1, 'a']],
    hand: [['e', 6, 6, 6, 6, 'C'], ['r', 0, 3, 2, 6, 'B'], ['r', 8, 4, 3, 1, 'CS'], ['r', 8, 7, 3, 1, 'CS']],
    foot: [['e', 6.5, 5, 6.5, 4, 'B'], ['e', 10.5, 6, 3.5, 3, 'B'], ['r', 1, 7, 13, 2, 'A']],
  },
  /* ---- ムツゴ：有明海のムツゴロウロボ ---- */
  mutsugo: {
    pal: { B: '#78c820', BH: '#b8f060', BS: '#3c8c00', C: '#d8a860', CH: '#fcd8a0', CS: '#8c5c20', A: '#3cbcfc', a: '#fc7460' },
    size: { head: [24, 18], torso: [24, 16], hand: [12, 10], foot: [16, 8] },
    head: [['e', 12, 11, 12, 7, 'B'], ['qe', 5, 12, 5, 6, 'B', 'BS'], ['e', 7, 5, 3.6, 3.6, 'B'], ['e', 17.5, 4.5, 4.6, 4.6, 'B'], ['e', 7, 5, 2.6, 2.6, 'W'], ['e', 17.5, 4.5, 3.5, 3.5, 'W'],
      ['r', 8, 4, 2, 3, 'K'], ['r', 19, 4, 2, 3, 'K'], ['r', 7, 14, 14, 1, 'K'], ['pp', [[21, 13], [22, 12], [6, 13]], 'K'], ['pp', [[11, 9], [15, 8], [13, 11], [9, 8]], 'A']],
    torso: [['e', 12, 10, 12, 6, 'B'], ['qe', 4, 11, 4, 5, 'B', 'BS'], ['e', 14, 12, 8, 4, 'C'], ['t', 5, 5, 10, 5, 7, 0, 'a'], ['t', 10, 5, 15, 5, 12, 0, 'a'], ['t', 15, 5, 19, 5, 17, 1, 'a'],
      ['pp', [[5, 9], [18, 9], [8, 7], [15, 7]], 'A']],
    hand: [['e', 6, 5, 6, 5, 'B'], ['l', 6, 5, 11, 2, 'BS'], ['l', 6, 5, 11, 5, 'BS'], ['l', 6, 5, 11, 8, 'BS']],
    foot: [['e', 7, 4, 7, 4, 'B'], ['e', 12, 4.5, 4, 3.5, 'B'], ['l', 9, 4, 15, 1, 'BS'], ['l', 9, 4, 15, 4, 'BS'], ['l', 9, 4, 15, 7, 'BS']],
  },
  /* ---- ライゴウ：雷雲の街のスピードスター ---- */
  raigou: {
    pal: { B: '#f8c800', BH: '#fcec78', BS: '#a87800', C: '#484848', CH: '#8c8c8c', CS: '#101010', A: '#fcfcfc', a: '#3cbcfc' },
    size: { head: [20, 18], torso: [20, 22], hand: [12, 12], foot: [14, 9] },
    head: [['e', 10, 11, 10, 7, 'C'], ['qe', 3.6, 12, 3.6, 5, 'C', 'CS'], ['t', 3, 7, 8, 7, 2, 0, 'B'], ['t', 8, 7, 13, 7, 11, 0, 'B'], ['t', 12, 7, 17, 7, 19, 2, 'B'],
      ['r', 12, 10, 6, 2, 'A'], ['r', 5, 10, 4, 2, 'A'], ['p', 14, 10, 'a'], ['p', 7, 10, 'a'], ['r', 8, 14, 8, 1, 'W'], ['pp', [[9, 15], [11, 15], [13, 15]], 'W']],
    torso: [['r', 2, 0, 16, 22, 'B'], ['r', 2, 0, 4, 22, 'C'], ['l', 14, 3, 9, 10, 'C'], ['l', 15, 3, 10, 10, 'C'], ['r', 9, 10, 7, 2, 'C'], ['l', 15, 11, 10, 19, 'C'], ['l', 16, 11, 11, 19, 'C']],
    hand: [['e', 6, 6, 6, 6, 'B'], ['r', 0, 3, 3, 6, 'C'], ['pp', [[9, 2], [10, 3], [9, 4], [11, 8]], 'A']],
    foot: [['e', 6.5, 5, 6.5, 4, 'C'], ['e', 10.5, 6, 3.5, 3, 'C'], ['r', 1, 7, 13, 2, 'B'], ['pp', [[9, 3], [10, 4], [9, 5]], 'B']],
  },
  /* ---- ギタロー：ライブハウスのロッカー ---- */
  gitaro: {
    pal: { B: '#6c48f8', BH: '#a088fc', BS: '#3820b8', C: '#e020c0', CH: '#fc84f0', CS: '#8c0078', D: '#c8c8c8', DH: '#fcfcfc', DS: '#808080', A: '#fcfcfc', a: '#fcd838' },
    size: { head: [22, 18], torso: [22, 22], hand: [12, 12], foot: [14, 9] },
    head: [['e', 12, 6, 10, 5, 'C'], ['t', 10, 5, 19, 5, 17, 0, 'C'], ['t', 17, 5, 22, 5, 21, 2, 'C'], ['e', 12.5, 12, 8.5, 6, 'D'], ['qe', 5.5, 12, 3.5, 5, 'D', 'DS'],
      ['r', 6, 10, 5, 4, 'K'], ['r', 13, 10, 7, 4, 'K'], ['r', 11, 10, 2, 1, 'K'], ['pp', [[7, 10], [8, 11], [14, 10], [15, 11]], 'W'], ['r', 12, 15, 6, 1, 'K'], ['p', 18, 14, 'K']],
    torso: [['e', 11, 11, 11, 10.5, 'B'], ['qe', 4, 12, 4.6, 9, 'B', 'BS'], ['t', 9, 1, 16, 1, 13, 14, 'C'], ['l', 3, 1, 19, 20, 'a'], ['l', 4, 1, 20, 20, 'a'], ['pp', [[3, 12], [18, 12], [3, 16], [18, 16]], 'a']],
    hand: [['e', 6, 6, 6, 6, 'B'], ['r', 0, 3, 3, 6, 'C'], ['pp', [[8, 3], [8, 6], [8, 9]], 'a']],
    foot: [['e', 6.5, 5, 6.5, 4, 'C'], ['e', 10.5, 6, 3.5, 3, 'C'], ['r', 1, 7, 13, 2, 'B'], ['r', 7, 4, 3, 2, 'a']],
  },
};

/* ギターの小道具（3方向）：28x28、中心(14,14)が握り */
const PROP_ART = {
  pal: { B: '#e020c0', BH: '#fc84f0', BS: '#8c0078', N: '#886400', n: '#503000', A: '#fcfcfc' },
  gtrFwd: [['e', 6, 14, 6, 5, 'B'], ['e', 6, 14, 2, 2, 'K'], ['r', 11, 13, 14, 2, 'N'], ['r', 24, 11, 4, 6, 'n'], ['r', 11, 12, 14, 1, 'A']],
  gtrUp: [['e', 7, 21, 6, 5, 'B'], ['e', 7, 21, 2, 2, 'K'], ['l', 11, 17, 22, 6, 'N'], ['l', 12, 17, 23, 6, 'N'], ['r', 21, 0, 5, 5, 'n']],
  gtrDown: [['e', 7, 7, 6, 5, 'B'], ['e', 7, 7, 2, 2, 'K'], ['l', 11, 11, 22, 22, 'N'], ['l', 12, 11, 23, 22, 'N'], ['r', 21, 23, 5, 5, 'n']],
};

/* ---------- キャッシュ ---------- */
const SPR = { parts: {}, props: {} };
function buildAllSprites() {
  CHARS.forEach((c) => {
    const a = ART[c.key];
    SPR.parts[c.key] = {};
    ['head', 'torso', 'hand', 'foot'].forEach((p) => {
      SPR.parts[c.key][p] = partSet(a.size[p][0], a.size[p][1], a[p], a.pal);
    });
  });
  ['gtrFwd', 'gtrUp', 'gtrDown'].forEach((k) => { SPR.props[k] = partSet(28, 28, PROP_ART[k], PROP_ART.pal); });
}
/* パーツの静止位置（足元を原点、yは上向き、中心座標） */
function rigGeom(key) {
  const s = ART[key].size;
  const fh = s.foot[1] + 2, th = s.torso[1] + 2, hh = s.head[1] + 2, tw = s.torso[0] + 2;
  const footY = fh / 2;
  const torsoY = fh + 2 + th / 2;
  const headY = fh + 2 + th + 1 + hh / 2;
  return { footX: 8, footY, torsoY, headY, handX: tw / 2 + 6, handY: torsoY + 1, top: fh + 2 + th + 1 + hh };
}
