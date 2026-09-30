// ============================================================
// tpl/fig.js — 問題に添える図（SVG文字列）を、数値から自動生成する
//
//  すべてプログラムで描く自作の図。教科書や問題集の図は使わない。
//  色は currentColor を基本にして、明るい/暗いテーマの両方で読めるようにする。
// ============================================================

const INK = "currentColor";
const ACCENT = "#c0392b";
const BLUE = "#2b6cb0";
const f = (n) => (Math.round(n * 100) / 100).toString();

/** 図全体のラッパー */
function svg(w, h, body, label = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" style="max-width:100%;height:auto;font-family:'KaTeX_Main','Times New Roman',serif" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
// 文字は背景色でふち取りして、線や格子と重なっても読めるようにする（背景色は CSS 変数 --fig-bg。既定は白）
const HALO = "paint-order:stroke;stroke:var(--fig-bg,#fff);stroke-width:3.4px;stroke-linejoin:round";
const text = (x, y, s, o = {}) =>
  `<text x="${f(x)}" y="${f(y)}" fill="${o.color || INK}" style="${HALO}" font-size="${o.size || 15}" text-anchor="${o.anchor || "middle"}" font-style="${o.italic === false ? "normal" : "italic"}">${s}</text>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.color || INK}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
const dot = (x, y, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${o.r || 3.2}" fill="${o.color || INK}" stroke="none"/>`;
const rad = (d) => (d * Math.PI) / 180;

/**
 * 座標平面。
 *  o.x=[xmin,xmax], o.y=[ymin,ymax]（どちらも 0 をふくむこと）
 *  o.lines=[{a,b,color,label}]（y=ax+b）／{vx}（x=定数）… 表示範囲の外は切りとられる
 *  o.curves=[{fn:(x)=>y, color, label}]                 … 同上
 *  o.points=[{x,y,label,color,dx,dy}]                   … 表示範囲の中にあること（外なら例外）
 *  o.segments=[[x1,y1,x2,y2,{dash,color}]]              … 端点が表示範囲の中にあること
 */
export function coordPlane(o) {
  const [xmin, xmax] = o.x || [-5, 5];
  const [ymin, ymax] = o.y || [-5, 5];
  if (!(xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0)) throw new Error("coordPlane: 表示範囲は原点をふくむこと");
  const cell = o.cell || 26;
  const PL = 20;
  const PR = 26;
  const PT = 26;
  const PB = 22;
  const W = (xmax - xmin) * cell + PL + PR;
  const H = (ymax - ymin) * cell + PT + PB;
  const X = (x) => PL + (x - xmin) * cell;
  const Y = (y) => PT + (ymax - y) * cell;
  const inside = (x, y) => x >= xmin - 1e-9 && x <= xmax + 1e-9 && y >= ymin - 1e-9 && y <= ymax + 1e-9;
  let b = "";
  for (let x = Math.ceil(xmin); x <= xmax; x++) b += line(X(x), Y(ymin), X(x), Y(ymax), { color: "#8886", w: 0.6 });
  for (let y = Math.ceil(ymin); y <= ymax; y++) b += line(X(xmin), Y(y), X(xmax), Y(y), { color: "#8886", w: 0.6 });
  b += line(X(xmin), Y(0), X(xmax) + 6, Y(0), { w: 1.4 }) + line(X(0), Y(ymin), X(0), Y(ymax) - 6, { w: 1.4 });
  b += text(X(xmax) + 10, Y(0) + 4, "x", { size: 13 }) + text(X(0) + 9, Y(ymax) - 6, "y", { size: 13 });
  b += text(X(0) - 6, Y(0) + 13, "O", { size: 12, anchor: "end", italic: false });
  // 目もり
  for (let x = Math.ceil(xmin); x <= xmax; x++) if (x !== 0 && x % (o.tick || 1) === 0) b += text(X(x), Y(0) + 13, String(x), { size: 10, italic: false });
  for (let y = Math.ceil(ymin); y <= ymax; y++) if (y !== 0 && y % (o.tick || 1) === 0) b += text(X(0) - 6, Y(y) + 4, String(y), { size: 10, anchor: "end", italic: false });

  // 直線・曲線・線分は、グラフの枠の中だけに描く（入れ子の svg で切りとる）
  let g = "";
  for (const s of o.segments || []) {
    if (!inside(s[0], s[1]) || !inside(s[2], s[3])) throw new Error(`coordPlane: 線分の端点が表示範囲の外 (${s.slice(0, 4)})`);
    g += line(X(s[0]), Y(s[1]), X(s[2]), Y(s[3]), { color: (s[4] && s[4].color) || INK, dash: s[4] && s[4].dash, w: 1.4 });
  }
  for (const l of o.lines || []) {
    const c = l.color || BLUE;
    if (l.vx !== undefined) g += line(X(l.vx), Y(ymin), X(l.vx), Y(ymax), { color: c, w: 2 });
    else g += line(X(xmin), Y(l.a * xmin + l.b), X(xmax), Y(l.a * xmax + l.b), { color: c, w: 2 });
  }
  const span = ymax - ymin;
  for (const c of o.curves || []) {
    let d = "";
    let pen = false;
    let prev = 0;
    for (let i = 0; i <= 320; i++) {
      const x = xmin + ((xmax - xmin) * i) / 320;
      const y = c.fn(x);
      if (!Number.isFinite(y) || y < ymin - span || y > ymax + span) {
        pen = false;
        continue;
      }
      if (pen && Math.abs(y - prev) > span * 1.2) pen = false; // 漸近線をまたぐ線はつながない
      d += `${pen ? "L" : "M"}${f(X(x))} ${f(Y(y))} `;
      pen = true;
      prev = y;
    }
    g += `<path d="${d}" stroke="${c.color || BLUE}" stroke-width="2"/>`;
  }
  const cw = X(xmax) - X(xmin);
  const ch = Y(ymin) - Y(ymax);
  b += `<svg x="${f(X(xmin))}" y="${f(Y(ymax))}" width="${f(cw)}" height="${f(ch)}" viewBox="${f(X(xmin))} ${f(Y(ymax))} ${f(cw)} ${f(ch)}" overflow="hidden">${g}</svg>`;

  for (const l of o.lines || []) if (l.label) b += text(X(l.lx ?? xmax - 0.4) - 4, Y(l.ly ?? l.a * (xmax - 0.4) + l.b) - 6, l.label, { color: l.color || BLUE, size: 13 });
  for (const c of o.curves || []) if (c.label) b += text(X(c.lx ?? 0) + 10, Y(c.ly ?? 0) - 6, c.label, { color: c.color || BLUE, size: 13 });
  for (const p of o.points || []) {
    if (!inside(p.x, p.y)) throw new Error(`coordPlane: 点 (${p.x}, ${p.y}) が表示範囲の外`);
    b += dot(X(p.x), Y(p.y), { color: p.color || ACCENT, r: 3.8 });
    if (p.label) {
      // 目もりの数字とぶつからないよう、軸から遠い側に文字を置く
      const dx = p.dx ?? (p.x >= 0 ? 8 : -8);
      const dy = p.dy ?? (p.y >= 0 ? -8 : 16);
      b += text(X(p.x) + dx, Y(p.y) + dy, p.label, { color: p.color || ACCENT, size: 13, italic: false, anchor: p.anchor ?? (dx >= 0 ? "start" : "end") });
    }
  }
  return svg(W, H, b, "座標平面");
}

/** 直角三角形。頂点 A(直角の頂点)・B・C。a=辺の長さ表示（"?" も可）。斜辺は c */
export function rightTriangle({ base, height, baseLabel, heightLabel, hypLabel }) {
  const s = 150 / Math.max(base, height);
  const w = base * s;
  const h = height * s;
  const x0 = 34;
  const y0 = 24 + h;
  let b = `<polygon points="${f(x0)},${f(y0)} ${f(x0 + w)},${f(y0)} ${f(x0)},${f(y0 - h)}"/>`;
  b += `<polyline points="${f(x0 + 12)},${f(y0)} ${f(x0 + 12)},${f(y0 - 12)} ${f(x0)},${f(y0 - 12)}" stroke-width="1.2"/>`;
  b += text(x0 + w / 2, y0 + 18, baseLabel ?? "", { italic: false });
  b += text(x0 - 10, y0 - h / 2 + 5, heightLabel ?? "", { anchor: "end", italic: false });
  b += text(x0 + w / 2 + 14, y0 - h / 2 - 6, hypLabel ?? "", { anchor: "start", italic: false });
  return svg(x0 + w + 60, y0 + 28, b, "直角三角形");
}

/**
 * 角 P-V-Q の二等分線の方向に、角度の文字を置く（線とぶつからないよう、角が小さいほど遠くに置く）
 *  V, P, Q は [x, y]。角が 180° のときは、PQ に垂直な向き（s の側）に置く
 */
function angleText(V, P, Q, s, o = {}) {
  const unit = (A) => {
    const dx = A[0] - V[0];
    const dy = A[1] - V[1];
    const n = Math.hypot(dx, dy) || 1;
    return [dx / n, dy / n];
  };
  const u = unit(P);
  const w = unit(Q);
  let bx = u[0] + w[0];
  let by = u[1] + w[1];
  const half = Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1]))) / 2; // 角の半分
  if (Math.hypot(bx, by) < 1e-6) {
    bx = -u[1];
    by = u[0];
  }
  const n = Math.hypot(bx, by);
  const d = o.r ?? Math.max(28, Math.min(66, 16 / Math.sin(Math.max(half, 0.2))));
  return text(V[0] + (bx / n) * d, V[1] + (by / n) * d + 5, s, { color: o.color || ACCENT, size: 13, italic: false });
}

/**
 * 円と円周角。points={名前: 円周上の位置(度。右が0°、反時計まわり)}、center=true で中心 O を描く。
 *  lines=[["A","B"],…]（"O" も使える）、angleMarks=[{at:"C", between:["A","B"], text:"x"}]
 *  角度の文字は、between の二等分線上に自動で置く（"x" は青、数値は赤）。
 */
export function circleAngle({ points, center = false, lines = [], angleMarks = [], oLabel = [11, -7] }) {
  const R = 78;
  const cx = 110;
  const cy = 100;
  const P = (deg) => [cx + R * Math.cos(rad(deg)), cy - R * Math.sin(rad(deg))];
  let b = `<circle cx="${cx}" cy="${cy}" r="${R}"/>`;
  const pos = {};
  for (const [name, deg] of Object.entries(points)) pos[name] = P(deg);
  const posOf = (n) => (n === "O" ? [cx, cy] : pos[n]);
  for (const [u, v] of lines) {
    const p1 = posOf(u);
    const p2 = posOf(v);
    b += line(p1[0], p1[1], p2[0], p2[1]);
  }
  if (center) b += dot(cx, cy);
  for (const [name, deg] of Object.entries(points)) {
    const [x, y] = pos[name];
    b += dot(x, y);
    b += text(x + 15 * Math.cos(rad(deg)), y - 15 * Math.sin(rad(deg)) + 5, name, { italic: false });
  }
  if (center) b += text(cx + oLabel[0], cy + oLabel[1], "O", { italic: false });
  for (const m of angleMarks) {
    const V = posOf(m.at);
    const color = m.text === "x" ? BLUE : ACCENT;
    b += m.between ? angleText(V, posOf(m.between[0]), posOf(m.between[1]), m.text, { color, r: m.r }) : text(V[0] + (m.dx ?? 0), V[1] + (m.dy ?? 0), m.text, { color, size: 13, italic: false });
  }
  return svg(220, 200, b, "円");
}

/** 平行な2直線と、それに交わる1直線。given/asked の角の位置と文字を表示 */
export function parallelLines({ theta = 65, given, asked }) {
  const W = 260;
  const H = 190;
  const yl = 50; // l
  const ym = 140; // m
  // 交わる直線：右上がりに傾き θ
  const t = Math.tan(rad(theta));
  const xP = 130 + (H / 2 - yl) / t; // l 上の交点（線が右上へ伸びる）
  const xQ = 130 + (H / 2 - ym) / t;
  let b = line(20, yl, W - 20, yl) + line(20, ym, W - 20, ym);
  b += line(xQ - 45 / t, ym + 45, xP + 45 / t, yl - 45);
  b += text(W - 12, yl - 6, "l", { size: 15 }) + text(W - 12, ym - 6, "m", { size: 15 });
  // 記号 > で平行を表す
  b += `<polyline points="${W - 60},${yl - 5} ${W - 52},${yl} ${W - 60},${yl + 5}" stroke-width="1.2"/><polyline points="${W - 60},${ym - 5} ${W - 52},${ym} ${W - 60},${ym + 5}" stroke-width="1.2"/>`;
  // 角の位置
  const mid = { NE: theta / 2, NW: (theta + 180) / 2, SW: 180 + theta / 2, SE: 360 - (180 - theta) / 2 };
  const put = (pt, x, y, txt, color) => {
    const a = rad(mid[pt]);
    const gap = pt === "NE" || pt === "SW" ? theta : 180 - theta; // その角の大きさ
    const d = Math.max(30, Math.min(64, 16 / Math.sin(rad(gap / 2)))); // 細い角ほど遠くに置く
    return text(x + d * Math.cos(a), y - d * Math.sin(a) + 5, txt, { color, size: 14, italic: false });
  };
  const cross = { P: [xP, yl], Q: [xQ, ym] };
  if (given) b += put(given.pos, ...cross[given.at], given.text, ACCENT);
  if (asked) b += put(asked.pos, ...cross[asked.at], asked.text ?? "x", BLUE);
  return svg(W, H, b, "平行線と角");
}

/** 三角形 ABC と、BC に平行な線分 DE（AD:AB = t）。長さの表示は labels に */
export function triangleParallel({ t = 0.5, labels = {} }) {
  const A = [110, 20];
  const B = [30, 170];
  const C = [220, 170];
  const D = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])];
  const E = [A[0] + t * (C[0] - A[0]), A[1] + t * (C[1] - A[1])];
  let body = `<polygon points="${A.join(",")} ${B.join(",")} ${C.join(",")}"/>` + line(D[0], D[1], E[0], E[1]);
  body += text(A[0], A[1] - 6, "A", { italic: false }) + text(B[0] - 10, B[1] + 6, "B", { italic: false }) + text(C[0] + 10, C[1] + 6, "C", { italic: false });
  body += text(D[0] - 12, D[1] + 4, "D", { italic: false }) + text(E[0] + 12, E[1] + 4, "E", { italic: false });
  const mid = (P1, P2, dx, dy, s) => (s ? text((P1[0] + P2[0]) / 2 + dx, (P1[1] + P2[1]) / 2 + dy, s, { color: ACCENT, size: 13, italic: false }) : "");
  body += mid(A, D, -14, 0, labels.AD) + mid(D, B, -14, 0, labels.DB) + mid(A, E, 14, 0, labels.AE) + mid(E, C, 14, 0, labels.EC) + mid(D, E, 0, -6, labels.DE) + mid(B, C, 0, 18, labels.BC);
  return svg(250, 200, body, "三角形");
}

/** おうぎ形（中心角 deg、半径 r ラベル）。中心角が大きくても図がはみ出ないよう、外接する四角形に合わせて描く */
export function sector({ deg, rLabel = "", angleLabel = "" }) {
  const R = 100;
  const c = (a) => Math.cos(rad(a));
  const s = (a) => Math.sin(rad(a));
  const pts = [[0, 0], [R, 0], [R * c(deg), -R * s(deg)]];
  for (const a of [90, 180, 270]) if (deg > a) pts.push([R * c(a), -R * s(a)]);
  const minX = Math.min(...pts.map((p) => p[0])) - 18;
  const maxX = Math.max(...pts.map((p) => p[0])) + 18;
  const minY = Math.min(...pts.map((p) => p[1])) - 14;
  const maxY = Math.max(0, ...pts.map((p) => p[1])) + 30; // 半径の文字は水平な半径の下に置く
  const large = deg > 180 ? 1 : 0;
  const lr = deg < 60 ? 64 : 48;
  let b = `<path d="M0 0 L${R} 0 A${R} ${R} 0 ${large} 0 ${f(R * c(deg))} ${f(-R * s(deg))} Z"/>`;
  b += `<path d="M24 0 A24 24 0 ${large} 0 ${f(24 * c(deg))} ${f(-24 * s(deg))}" stroke-width="1.2"/>`;
  b += text(lr * c(deg / 2), -lr * s(deg / 2) + 5, angleLabel, { color: ACCENT, size: 13, italic: false });
  b += text(R / 2, 19, rLabel, { italic: false });
  return svg(maxX - minX, maxY - minY, `<g transform="translate(${f(-minX)} ${f(-minY)})">${b}</g>`, "おうぎ形");
}

/** 度数分布などの棒グラフ（度数の配列とラベル） */
export function bars({ labels, values, max, unit = "" }) {
  const w = 34;
  const H = 130;
  const m = max ?? Math.max(...values);
  let b = line(30, 15, 30, 15 + H) + line(30, 15 + H, 30 + w * values.length + 10, 15 + H);
  values.forEach((v, i) => {
    const h = (v / m) * (H - 8);
    b += `<rect x="${36 + i * w}" y="${15 + H - h}" width="${w - 6}" height="${h}" fill="#2b6cb033" stroke="${BLUE}"/>`;
    b += text(36 + i * w + (w - 6) / 2, 15 + H + 14, labels[i], { size: 11, italic: false });
    b += text(36 + i * w + (w - 6) / 2, 15 + H - h - 4, String(v), { size: 11, italic: false });
  });
  b += text(26, 22, unit, { size: 11, anchor: "end", italic: false });
  return svg(30 + w * values.length + 20, 15 + H + 24, b, "棒グラフ");
}

/** 箱ひげ図（最小・Q1・中央値・Q3・最大）*/
export function boxPlot({ min, q1, med, q3, max, lo, hi }) {
  const W = 300;
  const X = (v) => 20 + ((v - lo) / (hi - lo)) * (W - 40);
  let b = line(X(lo), 70, X(hi), 70, { w: 1 });
  for (let v = Math.ceil(lo / 5) * 5; v <= hi; v += 5) b += line(X(v), 66, X(v), 74, { w: 1 }) + text(X(v), 88, String(v), { size: 10, italic: false });
  b += line(X(min), 40, X(min), 60) + line(X(max), 40, X(max), 60) + line(X(min), 50, X(q1), 50) + line(X(q3), 50, X(max), 50);
  b += `<rect x="${f(X(q1))}" y="40" width="${f(X(q3) - X(q1))}" height="20" fill="#2b6cb022"/>` + line(X(med), 40, X(med), 60, { color: ACCENT, w: 2 });
  return svg(W, 100, b, "箱ひげ図");
}
