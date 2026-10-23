// ============================================================
// solids.js — 空間図形の問題用の道具：立体を座標で持ち、位置関係・数・きょりを「計算で」出す
//
//  問題を書くとき、辺や面の関係（平行・垂直・ねじれの位置…）を手で書かない。
//  立体（cuboid / prism / rtPrism / pyramid）をつくって、edgesWhere / facesWhere / lineRel などで求める。
//
//  座標：直方体 ABCD-EFGH は A(0,0,0) B(a,0,0) C(a,b,0) D(0,b,0)、E〜H は A〜D の真上（高さ c）。
//        ＝ ikkan の演習プリントの図と同じ向き（ABCD が下の面、EFGH が上の面。A が手前の左、B が手前の右）。
//  辺は 'AB' のような 2文字（順序は問わない）、面は 'ABCD' のような頂点の並び（順序は問わない）。
// ============================================================

const sub = (p, q) => p.map((x, i) => x - q[i]);
const dot = (p, q) => p.reduce((s, x, i) => s + x * q[i], 0);
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const isZero = (v) => v.every((x) => Math.abs(x) < 1e-9);
const norm = (v) => Math.sqrt(dot(v, v));
const sortKey = (s) => [...s].sort().join("");

/** 立体：V＝頂点の座標、E＝辺（'AB'…）、F＝面（頂点の並び 'ABCD'…） */
function make(kind, name, V, E, F) {
  const S = { kind, name, V, E: E.map((e) => e), F: F.map((f) => f) };
  S.hasEdge = (e) => S.E.some((x) => sortKey(x) === sortKey(e));
  S.hasFace = (f) => S.F.some((x) => sortKey(x) === sortKey(f));
  return S;
}

const LET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 直方体 ABCD-EFGH（a＝AB、b＝AD、c＝AE）。立方体は cuboid(s, s, s) */
export function cuboid(a = 3, b = 3, c = 3) {
  const V = { A: [0, 0, 0], B: [a, 0, 0], C: [a, b, 0], D: [0, b, 0], E: [0, 0, c], F: [a, 0, c], G: [a, b, c], H: [0, b, c] };
  const E = ["AB", "BC", "CD", "DA", "EF", "FG", "GH", "HE", "AE", "BF", "CG", "DH"];
  const F = ["ABCD", "EFGH", "ABFE", "BCGF", "DCGH", "ADHE"];
  return make("cuboid", "直方体 ABCD-EFGH", V, E, F);
}

/** 正 n 角柱：下の底面 A,B,C,…（n個）、上の底面はその次の n 個の文字。n=3 なら ABC-DEF、n=4 なら ABCD-EFGH */
export function prism(n, side = 2, h = 3) {
  const R = side / (2 * Math.sin(Math.PI / n));
  const V = {}, bot = [], top = [];
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    bot.push(LET[i]); top.push(LET[n + i]);
    V[LET[i]] = [R * Math.cos(ang), R * Math.sin(ang), 0];
    V[LET[n + i]] = [R * Math.cos(ang), R * Math.sin(ang), h];
  }
  const E = [], F = [bot.join(""), top.join("")];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    E.push(bot[i] + bot[j], top[i] + top[j], bot[i] + top[i]);
    F.push(bot[i] + bot[j] + top[j] + top[i]);
  }
  return make("prism", `${n}角柱 ${bot.join("")}-${top.join("")}`, V, E, F);
}

/** 底面が ∠B＝90° の直角三角形（AB＝p、BC＝q）で、高さ h の三角柱 ABC-DEF（D・E・F は A・B・C の真上） */
export function rtPrism(p = 3, q = 4, h = 5) {
  const V = { A: [0, 0, 0], B: [p, 0, 0], C: [p, q, 0], D: [0, 0, h], E: [p, 0, h], F: [p, q, h] };
  // 注：AB が x 軸、BC が y 軸。∠B＝90°
  const E = ["AB", "BC", "CA", "DE", "EF", "FD", "AD", "BE", "CF"];
  const F = ["ABC", "DEF", "ABED", "BCFE", "CADF"];
  return make("rtPrism", "三角柱 ABC-DEF（∠B＝90°）", V, E, F);
}

/** 正 n 角錐 O-ABC…（底面は A,B,C,…、頂点 O） */
export function pyramid(n = 4, side = 2, h = 3) {
  const R = side / (2 * Math.sin(Math.PI / n));
  const V = { O: [0, 0, h] }, base = [];
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    base.push(LET[i]);
    V[LET[i]] = [R * Math.cos(ang), R * Math.sin(ang), 0];
  }
  const E = [], F = [base.join("")];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    E.push(base[i] + base[j], "O" + base[i]);
    F.push("O" + base[i] + base[j]);
  }
  return make("pyramid", `${n}角錐 O-${base.join("")}`, V, E, F);
}

// ── 辺と辺 ─────────────────────────────────────────────
const dir = (S, e) => sub(S.V[e[1]], S.V[e[0]]);

/**
 * 2つの辺（を通る直線）の位置関係：
 *   { rel: 'parallel' | 'intersect' | 'skew', perp: 垂直か, share: 共通の頂点（あれば）}
 *   rel==='intersect' かつ perp なら「垂直に交わる」、rel==='skew' かつ perp なら「ねじれの位置で垂直」
 *  ※ 直線で判定する。正五角柱などでは、底面の辺どうしの直線が、辺の外で交わることがある（その場合も 'intersect'）。
 */
export function lineRel(S, e1, e2) {
  const d1 = dir(S, e1), d2 = dir(S, e2), c = cross(d1, d2);
  const share = [...e1].find((v) => e2.includes(v)) || null;
  const perp = Math.abs(dot(d1, d2)) < 1e-9;
  if (isZero(c)) return { rel: "parallel", perp: false, share };
  const w = sub(S.V[e2[0]], S.V[e1[0]]);
  return { rel: Math.abs(dot(w, c)) < 1e-9 ? "intersect" : "skew", perp, share };
}

/** 辺 e に対して、関係 rel（'parallel' / 'intersect' / 'skew' / 'perpIntersect'＝垂直に交わる / 'perpSkew'）の辺を、立体の辺の順に */
export function edgesWhere(S, e, rel) {
  return S.E.filter((x) => sortKey(x) !== sortKey(e)).filter((x) => {
    const r = lineRel(S, e, x);
    if (rel === "perpIntersect") return r.rel === "intersect" && r.perp;
    if (rel === "perpSkew") return r.rel === "skew" && r.perp;
    return r.rel === rel;
  });
}

// ── 辺と面 ─────────────────────────────────────────────
const faceNormal = (S, f) => {
  const [a, b, c] = [S.V[f[0]], S.V[f[1]], S.V[f[2]]];
  return cross(sub(b, a), sub(c, a));
};

/**
 * 辺 e（を通る直線）と面 f（をふくむ平面）：
 *   'on'（面の上にある）｜'parallel'（平行）｜'perp'（垂直）｜'cross'（1点で交わるが、垂直ではない）
 */
export function lineFaceRel(S, e, f) {
  const n = faceNormal(S, f), d = dir(S, e);
  const on = (v) => Math.abs(dot(sub(S.V[v], S.V[f[0]]), n)) < 1e-9;
  if (on(e[0]) && on(e[1])) return "on";
  if (Math.abs(dot(d, n)) < 1e-9) return "parallel";
  if (isZero(cross(d, n))) return "perp";
  return "cross";
}

/** 面 f に対して、関係 rel（'on' / 'parallel' / 'perp' / 'cross'）の辺 */
export const edgesToFace = (S, f, rel) => S.E.filter((e) => lineFaceRel(S, e, f) === rel);

// ── 面と面 ─────────────────────────────────────────────
/** 2つの面（をふくむ平面）：'parallel'（平行）｜'perp'（垂直）｜'cross'（垂直でなく交わる） */
export function faceFaceRel(S, f1, f2) {
  const n1 = faceNormal(S, f1), n2 = faceNormal(S, f2);
  if (isZero(cross(n1, n2))) return "parallel";
  return Math.abs(dot(n1, n2)) < 1e-9 ? "perp" : "cross";
}
export const facesWhere = (S, f, rel) => S.F.filter((g) => sortKey(g) !== sortKey(f) && faceFaceRel(S, f, g) === rel);

// ── きょり ─────────────────────────────────────────────
const round6 = (x) => Math.round(x * 1e6) / 1e6;
/** 点 v から、面 f（をふくむ平面）までのきょり */
export function distPointFace(S, v, f) {
  const n = faceNormal(S, f);
  return round6(Math.abs(dot(sub(S.V[v], S.V[f[0]]), n)) / norm(n));
}
/** 平行な 2つの面のきょり（f1 の頂点から f2 まで） */
export const distFaceFace = (S, f1, f2) => distPointFace(S, f1[0], f2);

// ── 数・名前 ────────────────────────────────────────────
/** 頂点・辺・面の数 */
export const counts = (S) => ({ V: Object.keys(S.V).length, E: S.E.length, F: S.F.length });

export const NGON = ["", "", "", "三角形", "四角形", "五角形", "六角形", "七角形", "八角形", "九角形", "十角形", "十一角形", "十二角形"];
/** n角柱・n角錐の名前（n は 3〜12）。例 prismName(5) → "五角柱" */
export const prismName = (n) => NGON[n].replace("形", "柱");
export const pyramidName = (n) => NGON[n].replace("形", "錐");
/** n面体の名前。例 hedronName(8) → "八面体" */
export const hedronName = (n) => ["", "", "", "", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"][n] + "面体";

/** 辺・面の呼び方：edgeName('AB') → "辺 AB"、faceName('ABCD') → "面 ABCD" */
export const edgeName = (e) => `辺 ${e}`;
export const faceName = (f) => `面 ${f}`;
/** 辺の呼び方をそろえる：'HE' → 'EH'、'DA' → 'AD'（アルファベット順。O をふくむ辺は 'OA' のように O を先に） */
export const edgeLabel = (e) => (e.includes("O") ? "O" + e.replace("O", "") : [...e].sort().join(""));
/** 辺のリストを、そろえた呼び方で、アルファベット順に「AB、BC、CD」の形に */
export const listEdges = (es) => es.map(edgeLabel).sort().join("、");
/** 2つの辺・面が同じものか（頂点の順序をとわない） */
export const same = (a, b) => sortKey(a) === sortKey(b);
/** 立体の紹介文（問題の頭につける）。ここで出る向きが、辺・面の名前の約束 */
export function intro(S) {
  if (S.kind === "cuboid") return "直方体 ABCD−EFGH（面 ABCD が下の面、面 EFGH が上の面。A・B・C・D の真上が、それぞれ E・F・G・H）";
  if (S.kind === "rtPrism") return "三角柱 ABC−DEF（底面 ABC は ∠B＝90° の直角三角形。D・E・F は、A・B・C の真上）";
  if (S.kind === "pyramid") return `${S.name}（底面 ${S.F[0]}、頂点 O）`;
  return S.name;
}

/** 配列から、順序をそろえて重複をのぞく（選択肢づくり用） */
export const uniq = (arr) => [...new Set(arr)];
