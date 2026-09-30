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
 *  o.fills=[{x0,x1,hi:(x)=>y,lo:(x)=>y,color}]           … x0〜x1 で hi と lo にはさまれた部分を薄く塗る（lo 省略で x 軸）
 *  o.points=[{x,y,label,color,dx,dy}]                   … 表示範囲の中にあること（外なら例外）
 *  o.segments=[[x1,y1,x2,y2,{dash,color}]]              … 端点が表示範囲の中にあること
 *  o.params=[{x:(t)=>…, y:(t)=>…, t0, t1, color, dash}]  … 媒介変数で表した曲線（楕円・双曲線など）。範囲の外は切りとられる
 *  o.arrows=[[x1,y1,x2,y2,{color,label}]]                … 矢印（ベクトル）。端点が表示範囲の中にあること
 *  o.axisNames=["x","y"]                                … 軸の名前（複素数平面なら ["実軸","虚軸"]）
 */
export function coordPlane(o) {
  const [xmin, xmax] = o.x || [-5, 5];
  const [ymin, ymax] = o.y || [-5, 5];
  if (!(xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0)) throw new Error("coordPlane: 表示範囲は原点をふくむこと");
  const cell = o.cell || 26;
  const [xName, yName] = o.axisNames || ["x", "y"];
  const longName = (nm) => nm.length > 1;
  const PL = 20;
  const PR = longName(xName) ? 50 : 26; // 「実軸」のような長い名前は、軸の右はしの外に置く
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
  b += text(X(xmax) + (longName(xName) ? 10 : 10), Y(0) + 4, xName, { size: longName(xName) ? 11 : 13, anchor: longName(xName) ? "start" : "middle", italic: !longName(xName) });
  b += text(X(0) + (longName(yName) ? 6 : 9), Y(ymax) - 6, yName, { size: longName(yName) ? 11 : 13, anchor: longName(yName) ? "start" : "middle", italic: !longName(yName) });
  b += text(X(0) - 6, Y(0) + 13, "O", { size: 12, anchor: "end", italic: false });
  // 目もり
  for (let x = Math.ceil(xmin); x <= xmax; x++) if (x !== 0 && x % (o.tick || 1) === 0) b += text(X(x), Y(0) + 13, String(x), { size: 10, italic: false });
  for (let y = Math.ceil(ymin); y <= ymax; y++) if (y !== 0 && y % (o.tick || 1) === 0) b += text(X(0) - 6, Y(y) + 4, String(y), { size: 10, anchor: "end", italic: false });

  // 直線・曲線・線分は、グラフの枠の中だけに描く（入れ子の svg で切りとる）
  let g = "";
  for (const fl of o.fills || []) {
    if (!(fl.x0 < fl.x1)) throw new Error("coordPlane: fills は x0 < x1 で指定する");
    // 塗る範囲は表示範囲の中に切りつめる（外にはみ出した多角形が枠の外に見えないように）
    const clampY = (v) => Math.max(ymin, Math.min(ymax, v));
    const hi = (x) => clampY((fl.hi || (() => 0))(x));
    const lo = (x) => clampY((fl.lo || (() => 0))(x));
    const xs = Array.from({ length: 161 }, (_, i) => fl.x0 + ((fl.x1 - fl.x0) * i) / 160);
    const pts = [...xs.map((x) => [X(x), Y(hi(x))]), ...[...xs].reverse().map((x) => [X(x), Y(lo(x))])];
    g += `<polygon points="${pts.map(([qx, qy]) => `${f(qx)},${f(qy)}`).join(" ")}" fill="${fl.color || BLUE}" fill-opacity="0.22" stroke="none"/>`;
  }
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
  for (const pc of o.params || []) {
    let d = "";
    for (let i = 0; i <= 360; i++) {
      const tt = pc.t0 + ((pc.t1 - pc.t0) * i) / 360;
      const px_ = pc.x(tt);
      const py_ = pc.y(tt);
      if (!Number.isFinite(px_) || !Number.isFinite(py_) || Math.abs(px_) > 1e6 || Math.abs(py_) > 1e6) continue;
      d += `${d ? "L" : "M"}${f(X(px_))} ${f(Y(py_))} `;
    }
    g += `<path d="${d}" stroke="${pc.color || BLUE}" stroke-width="2"${pc.dash ? ` stroke-dasharray="${pc.dash}"` : ""}/>`;
  }
  for (const a of o.arrows || []) {
    if (!inside(a[0], a[1]) || !inside(a[2], a[3])) throw new Error(`coordPlane: 矢印の端点が表示範囲の外 (${a.slice(0, 4)})`);
    const col = (a[4] && a[4].color) || ACCENT;
    const [x1, y1, x2, y2] = [X(a[0]), Y(a[1]), X(a[2]), Y(a[3])];
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const hx = (t) => x2 - 9 * Math.cos(ang + t);
    const hy = (t) => y2 - 9 * Math.sin(ang + t);
    g += line(x1, y1, x2, y2, { color: col, w: 2 }) + `<polygon points="${f(x2)},${f(y2)} ${f(hx(0.42))},${f(hy(0.42))} ${f(hx(-0.42))},${f(hy(-0.42))}" fill="${col}" stroke="none"/>`;
  }
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
  for (const a of o.arrows || []) if (a[4] && a[4].label) b += text(X((a[0] + a[2]) / 2) + (a[4].dx ?? 8), Y((a[1] + a[3]) / 2) + (a[4].dy ?? -6), a[4].label, { color: a[4].color || ACCENT, size: 13, italic: false });
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

/**
 * 直角三角形。頂点 A（直角）・B・C。斜辺は BC。辺の長さは baseLabel(AB)・heightLabel(AC)・hypLabel(BC) に文字で渡す。
 *  vertexLabels=true で A, B, C を描く。theta="B" または "C" で、その頂点の角に θ を書く。
 */
export function rightTriangle({ base, height, baseLabel, heightLabel, hypLabel, vertexLabels = false, theta = null }) {
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
  if (vertexLabels) {
    b += text(x0 - 12, y0 + 16, "A", { italic: false });
    b += text(x0 + w + 12, y0 + 5, "B", { italic: false });
    b += text(x0 - 4, y0 - h - 8, "C", { italic: false });
  }
  if (theta === "B") b += text(x0 + w - 30, y0 - 6, "θ", { color: ACCENT, size: 15, italic: false });
  if (theta === "C") b += text(x0 + 16, y0 - h + 30, "θ", { color: ACCENT, size: 15, italic: false });
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

/**
 * 平面図形（三角形・円・接線など）。座標は数学の向き（y が上）。全体が枠に収まるように自動で縮める。
 *  o.points   = { A: [x, y], … }                       … 点（既定ですべてに点と名前を描く。o.noDot / o.noLabel で除外）
 *  o.segments = [["A","B",{dash,color,w}]]              … 線分
 *  o.lines    = [["P","Q",{ext:[s0,s1],dash,color}]]    … P→Q の方向に、P + s(Q−P)（s0〜s1）まで伸ばした直線
 *  o.circles  = [{c:"O" or [x,y], r, dash, color}]      … 円
 *  o.segLabels  = [{seg:["A","B"], text, color, side:±1, off}] … 線分の横の文字（side を省くと図の外側）
 *  o.angleMarks = [{at:"A", between:["B","C"], text, color, arc:true}] … 角の印と文字
 *  o.rightAngles = [{at:"H", between:["A","B"]}]         … 直角の印
 *  o.labelDir = { A: [dx, dy] }                          … 点の名前の置き場所（省くと図の中心から外向き）
 *  o.width    … 図の幅の目安（既定 260）
 */
export function geoFigure(o) {
  const pts = o.points || {};
  const P = (n) => (Array.isArray(n) ? n : pts[n]);
  for (const [n, v] of Object.entries(pts)) if (!v || !Number.isFinite(v[0]) || !Number.isFinite(v[1])) throw new Error(`geoFigure: 点 ${n} の座標が不正`);
  // 図の範囲
  const xs = [];
  const ys = [];
  const add = (x, y) => {
    xs.push(x);
    ys.push(y);
  };
  for (const v of Object.values(pts)) add(v[0], v[1]);
  for (const c of o.circles || []) {
    const cc = P(c.c);
    add(cc[0] - c.r, cc[1] - c.r);
    add(cc[0] + c.r, cc[1] + c.r);
  }
  const lineEnds = (l) => {
    const [p1, p2] = [P(l[0]), P(l[1])];
    const [s0, s1] = (l[2] && l[2].ext) || [0, 1];
    return [[p1[0] + s0 * (p2[0] - p1[0]), p1[1] + s0 * (p2[1] - p1[1])], [p1[0] + s1 * (p2[0] - p1[0]), p1[1] + s1 * (p2[1] - p1[1])]];
  };
  for (const l of o.lines || []) for (const e of lineEnds(l)) add(e[0], e[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const Wt = o.width || 260;
  const pad = 26;
  const sc = Math.min((Wt - 2 * pad) / Math.max(maxX - minX, 1e-9), (230 - 2 * pad) / Math.max(maxY - minY, 1e-9));
  const W = (maxX - minX) * sc + 2 * pad;
  const H = (maxY - minY) * sc + 2 * pad;
  const X = (x) => pad + (x - minX) * sc;
  const Y = (y) => pad + (maxY - y) * sc;
  const S = (n) => [X(P(n)[0]), Y(P(n)[1])];
  const cx0 = (minX + maxX) / 2;
  const cy0 = (minY + maxY) / 2;
  let b = "";
  for (const c of o.circles || []) {
    const cc = P(c.c);
    b += `<circle cx="${f(X(cc[0]))}" cy="${f(Y(cc[1]))}" r="${f(c.r * sc)}"${c.dash ? ` stroke-dasharray="${c.dash}"` : ""}${c.color ? ` stroke="${c.color}"` : ""}/>`;
  }
  for (const l of o.lines || []) {
    const [e0, e1] = lineEnds(l);
    b += line(X(e0[0]), Y(e0[1]), X(e1[0]), Y(e1[1]), { dash: l[2] && l[2].dash, color: l[2] && l[2].color });
  }
  for (const sg of o.segments || []) {
    const [a1, a2] = [S(sg[0]), S(sg[1])];
    b += line(a1[0], a1[1], a2[0], a2[1], { dash: sg[2] && sg[2].dash, color: sg[2] && sg[2].color, w: sg[2] && sg[2].w });
  }
  for (const ra of o.rightAngles || []) {
    const V = S(ra.at);
    const u = (n) => {
      const q = S(n);
      const d = Math.hypot(q[0] - V[0], q[1] - V[1]) || 1;
      return [(q[0] - V[0]) / d, (q[1] - V[1]) / d];
    };
    const [u1, u2] = [u(ra.between[0]), u(ra.between[1])];
    const k = 10;
    b += `<polyline points="${f(V[0] + k * u1[0])},${f(V[1] + k * u1[1])} ${f(V[0] + k * (u1[0] + u2[0]))},${f(V[1] + k * (u1[1] + u2[1]))} ${f(V[0] + k * u2[0])},${f(V[1] + k * u2[1])}" stroke-width="1.2"/>`;
  }
  for (const am of o.angleMarks || []) {
    const V = S(am.at);
    const [A1, A2] = [S(am.between[0]), S(am.between[1])];
    const a1 = Math.atan2(A1[1] - V[1], A1[0] - V[0]);
    const a2 = Math.atan2(A2[1] - V[1], A2[0] - V[0]);
    let da = a2 - a1;
    while (da <= -Math.PI) da += 2 * Math.PI;
    while (da > Math.PI) da -= 2 * Math.PI;
    const rr = am.r ?? 16;
    if (am.arc !== false) {
      const e1 = [V[0] + rr * Math.cos(a1), V[1] + rr * Math.sin(a1)];
      const e2 = [V[0] + rr * Math.cos(a1 + da), V[1] + rr * Math.sin(a1 + da)];
      b += `<path d="M${f(e1[0])} ${f(e1[1])} A${rr} ${rr} 0 0 ${da > 0 ? 1 : 0} ${f(e2[0])} ${f(e2[1])}" stroke="${am.color || ACCENT}" stroke-width="1.3"/>`;
    }
    if (am.text) b += angleText(V, A1, A2, am.text, { color: am.color || (am.text === "x" ? BLUE : ACCENT), r: am.textR });
  }
  for (const sl of o.segLabels || []) {
    const [a1, a2] = [S(sl.seg[0]), S(sl.seg[1])];
    const mx = (a1[0] + a2[0]) / 2;
    const my = (a1[1] + a2[1]) / 2;
    const d = Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) || 1;
    let nx = -(a2[1] - a1[1]) / d;
    let ny = (a2[0] - a1[0]) / d;
    // 側を省いたときは、図の中心から遠ざかる向き
    const side = sl.side ?? (nx * (mx - X(cx0)) + ny * (my - Y(cy0)) >= 0 ? 1 : -1);
    nx *= side;
    ny *= side;
    const off = sl.off ?? 12;
    b += text(mx + nx * off, my + ny * off + 5, sl.text, { color: sl.color || ACCENT, size: 13, italic: false });
  }
  const noDot = new Set(o.noDot || []);
  const noLabel = new Set(o.noLabel || []);
  for (const [n, v] of Object.entries(pts)) {
    const [x, y] = [X(v[0]), Y(v[1])];
    if (!noDot.has(n)) b += dot(x, y, { r: 2.6 });
    if (noLabel.has(n)) continue;
    let dir = o.labelDir && o.labelDir[n];
    if (!dir) {
      const dx = x - X(cx0);
      const dy = y - Y(cy0);
      const dd = Math.hypot(dx, dy);
      dir = dd < 1e-6 ? [12, -8] : [(dx / dd) * 14, (dy / dd) * 14];
    }
    b += text(x + dir[0], y + dir[1] + 5, n, { italic: false, size: 14 });
  }
  return svg(Math.ceil(W), Math.ceil(H), b, o.label || "図形");
}

/**
 * 散布図。pts=[[x,y],…]。x・y の目もりは xr=[min,max,step]、yr=[min,max,step]（データより広く取ること）。
 */
export function scatter({ pts, xr, yr, xName = "x", yName = "y" }) {
  const [x0, x1, xs] = xr;
  const [y0, y1, ys] = yr;
  const W = 250;
  const H = 210;
  const L = 36;
  const B = 26;
  const X = (x) => L + ((x - x0) / (x1 - x0)) * (W - L - 12);
  const Y = (y) => H - B - ((y - y0) / (y1 - y0)) * (H - B - 12);
  let b = line(L, H - B, W - 6, H - B, { w: 1.2 }) + line(L, H - B, L, 8, { w: 1.2 });
  for (let v = x0; v <= x1 + 1e-9; v += xs) b += line(X(v), H - B, X(v), H - B + 4, { w: 1 }) + text(X(v), H - B + 16, String(Math.round(v * 100) / 100), { size: 10, italic: false });
  for (let v = y0; v <= y1 + 1e-9; v += ys) b += line(L - 4, Y(v), L, Y(v), { w: 1 }) + text(L - 6, Y(v) + 4, String(Math.round(v * 100) / 100), { size: 10, anchor: "end", italic: false });
  b += text(W - 4, H - B - 6, xName, { size: 12, anchor: "end" }) + text(L + 6, 14, yName, { size: 12, anchor: "start" });
  for (const [x, y] of pts) {
    if (x < x0 || x > x1 || y < y0 || y > y1) throw new Error(`scatter: 点 (${x}, ${y}) が表示範囲の外`);
    b += `<circle cx="${f(X(x))}" cy="${f(Y(y))}" r="3.4" fill="${BLUE}" fill-opacity="0.75" stroke="none"/>`;
  }
  return svg(W, H, b, "散布図");
}
