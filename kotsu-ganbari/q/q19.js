// 問19：立方体から三角錐を切り取った立体の、直線どうしの位置関係（すべて答える問題）
//   頂点の3次元座標を決めて、全部の組をベクトルで判定 → 答えを出す（検算つき）
import { P, seg, poly, rt, ang, dot } from "../dsl.js";

// ───────── 3次元の道具（判定用）─────────
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot3 = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const zero = (v) => Math.hypot(...v) < 1e-9;
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const lineOf = (a, b) => ({ p: a, d: sub(b, a) });
// 直線と直線：same / parallel / intersect / skew
function relLL(L1, L2) {
  const c = cross(L1.d, L2.d), w = sub(L2.p, L1.p);
  if (zero(c)) return zero(cross(w, L1.d)) ? "same" : "parallel";
  return Math.abs(dot3(w, c)) < 1e-9 ? "intersect" : "skew";
}

// ───────── 立体：立方体 ABCD−HEFG（A の真上が H）から、三角錐 H−AEG を切り取ったもの ─────────
// 一辺を 1 とする。x：AB の向き、y：AD の向き、z：上。H は切り取られて、立体には無い（説明用にだけ出す）。
const V = { A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0], E: [1, 0, 1], F: [1, 1, 1], G: [0, 1, 1] };
const H3 = [0, 0, 1];
const LN = ["AB", "AD", "AE", "AG", "BC", "BE", "CD", "CF", "DG", "EF", "EG", "FG"];  // 立体の辺12本 → 延ばした直線
const L = {}; LN.forEach((e) => (L[e] = lineOf(V[e[0]], V[e[1]])));
const rest = LN.filter((e) => e !== "AB");
const rel = {}; rest.forEach((e) => (rel[e] = relLL(L.AB, L[e])));
const parAB = rest.filter((e) => rel[e] === "parallel");                                            // (1)
const perpAB = rest.filter((e) => rel[e] === "intersect" && Math.abs(dot3(L.AB.d, L[e].d)) < 1e-9); // (2) 垂直に交わる
const obliqueAB = rest.filter((e) => rel[e] === "intersect" && Math.abs(dot3(L.AB.d, L[e].d)) >= 1e-9);
const skewAB = rest.filter((e) => rel[e] === "skew");                                               // (3)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!(same(parAB, ["CD", "FG"]) && same(perpAB, ["AD", "AG", "BC", "BE"]) && same(obliqueAB, ["AE"]) && same(skewAB, ["CF", "DG", "EF", "EG"]))) throw new Error("問19：答えの検算が合いません");
const jl = (a) => a.map((e) => "直線" + e).join("、");

// ───────── 図（印刷物の図に合わせた、ななめ上から見た投影）─────────
// 写真の図：A(478,825) B(955,780) D(243,652) E(937,350)。そこから、1目もりぶんの画面ベクトルを出す。
const ex = [477, -45], ey = [-235, -173], ez = [-19, -429];
const raw = ([x, y, z]) => [x * ex[0] + y * ey[0] + z * ez[0], x * ex[1] + y * ey[1] + z * ez[1]];
const T = 0.12;                                                   // 直線を両はしに延ばす長さ（辺の長さの割合）
const ext = (a, b, t = T) => [lerp3(V[a], V[b], -t), lerp3(V[a], V[b], 1 + t)];
const allRaw = [...Object.values(V), H3].map(raw);
LN.forEach((e) => ext(e[0], e[1]).forEach((p) => allRaw.push(raw(p))));
const xs = allRaw.map((p) => p[0]), ys = allRaw.map((p) => p[1]);
const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
const VW = 480, VH = 360, K = Math.min((VW - 70) / (maxx - minx), (VH - 60) / (maxy - miny));
const ox = VW / 2 - ((minx + maxx) / 2) * K, oy = VH / 2 - ((miny + maxy) / 2) * K;
const pr = (p) => { const r = raw(p); return [Math.round((ox + r[0] * K) * 100) / 100, Math.round((oy + r[1] * K) * 100) / 100]; };
const pt = {}; Object.entries(V).forEach(([k, v]) => (pt[k] = pr(v)));
const pH = pr(H3);

// 名前（A〜G, H）の位置は、延ばした直線にかさならないように、まわりがいちばん空いている向きを計算で選ぶ
const segs2 = [];
LN.forEach((e) => { const [p, q] = ext(e[0], e[1]); segs2.push([pr(p), pr(q)]); });
segs2.push([pr(V.A), pH], [pr(V.E), pH], [pr(V.G), pH]);
const dseg = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
const cen = [Object.values(pt).reduce((s, v) => s + v[0], 0) / 7, Object.values(pt).reduce((s, v) => s + v[1], 0) / 7];   // 図の中心（名前はなるべく外がわに）
function labelOff(at, r = 19) {
  let best = null;
  for (let a = 0; a < 360; a += 5) {
    const cx = at[0] + r * Math.cos((a * Math.PI) / 180), cy = at[1] - r * Math.sin((a * Math.PI) / 180);
    if (cx < 14 || cx > VW - 14 || cy < 16 || cy > VH - 12) continue;
    let m = 1e9;
    for (const [p, q] of segs2) m = Math.min(m, dseg([cx, cy], p, q), dseg([cx + 6, cy], p, q), dseg([cx - 6, cy], p, q));
    m += 0.1 * Math.hypot(cx - cen[0], cy - cen[1]);
    if (!best || m > best.m + 0.01) best = { m, dx: Math.round(r * Math.cos((a * Math.PI) / 180)), dy: Math.round(-r * Math.sin((a * Math.PI) / 180) + 5.5) };
  }
  return best;
}
const lab = (k, at, o = {}) => P(k, at[0], at[1], k, "n", { dot: false, ...labelOff(at), ...o });
const VIS = [["A", "B"], ["A", "D"], ["D", "G"], ["B", "E"], ["E", "F"], ["F", "G"], ["A", "E"], ["A", "G"], ["E", "G"]];   // 見える辺
const HIDE = [["C", "D"], ["B", "C"], ["C", "F"]];                                                                          // 見えない辺（点線）
const HID = new Set(HIDE.map(([a, b]) => a + b));
const solidEls = [
  ...Object.keys(V).map((k) => lab(k, pt[k])),
  ...VIS.map(([a, b]) => seg(a, b, { id: "e" + a + b })),
  ...HIDE.map(([a, b]) => seg(a, b, { id: "e" + a + b, dash: true })),
];
// 切り取った三角錐の頂点 H（うすい灰色）
const cutH = () => [lab("H", pH, { c: "k" }), seg("H", "A", { c: "k", dash: true, w: 1.8 }), seg("H", "E", { c: "k", dash: true, w: 1.8 })];
// 辺を両はしに延ばした直線（赤＝答え／紫＝もとにする直線）
function xline(e, o = {}) {
  const [a, b] = [e[0], e[1]], [p, q] = ext(a, b);
  const base = { id: "x" + e, c: "a", w: 3.2, ...o };
  if (!HID.has(e)) return [seg(pr(p), pr(q), base)];
  return [seg(a, pr(q), { ...base, dash: true }), seg(pr(p), a, { ...base, id: base.id + "b", dash: true })];   // 点線は、もとの辺と点線のリズムをそろえる
}
const face = (names, id, fill) => poly(names.split(""), { id, fill, w: 0 });
const mark = (at, from, to, id) => rt(at, from, to, { id, c: "a", s: 12 });

export default {
  n: 19,
  title: "立方体を切り取った立体",
  problem: "次の立体は立方体から三角錐を切り取った形をした立体です。この立体の各辺を延長した直線について答えなさい。\n(1) 直線ABと平行な直線をすべて答えなさい。\n(2) 直線ABと垂直に交わる直線をすべて答えなさい。\n(3) 直線ABとねじれの位置にある直線をすべて答えなさい。",
  answer: `(1) ${jl(parAB)}　(2) ${jl(perpAB)}　(3) ${jl(skewAB)}`,
  view: [0, 0, VW, VH],
  steps: [
    {
      cap: "立方体から三角錐を切り取った立体。この立体の各辺を延ばした**直線**について、(1)〜(3) に答えるよ。",
      add: solidEls,
    },
    {
      cap: "もとの立方体を思いうかべよう。**A の真上の頂点 H** のところを、三角錐 H−AEG の形に切り取ったんだよ。（H はうすく見せるね）",
      add: [...cutH(), seg("H", "G", { c: "k", dash: true, w: 1.8 })],
      eq: ["## 立体の読みとり", "もとの立方体：ABCD−HEFG", "切り取った三角錐：H−AEG", "辺は12本：AB AD AE AG BC BE", "　　　　　CD CF DG EF EG FG"],
    },
    // ── (1) 直線ABと平行な直線 ──
    {
      cap: "(1) 立方体で AB と同じ向きの辺は、AB・DC・HE・GF。HE は切り取られたから、残る **DC と GF** が平行だよ。",
      clear: true,
      eqClear: true,
      add: [...xline("AB", { c: "p" }), ...cutH(), ...xline("CD"), ...xline("FG")],
      eq: ["## (1) ABと平行", "同じ向きの辺：AB, DC, HE, GF", "HE：切り取られた　×", `${parAB.map((e) => `${e} ∥ AB`).join("　")}　○`, `=> (1) ${jl(parAB)}`],
    },
    // ── (2) 直線ABと垂直に交わる直線 ──
    {
      cap: "(2) 直線AB と**垂直に交わる**直線。まず AB と**交わる**辺は、A か B を通る辺だね。",
      clear: true,
      eqClear: true,
      add: [...xline("AB", { c: "p" })],
      hl: ["eAD", "eAE", "eAG", "eBC", "eBE"],
      eq: ["## (2) ABと垂直に交わる", "Aを通る辺：AD, AE, AG", "Bを通る辺：BC, BE", "// ほかの辺は、延ばしても AB と交わらない"],
    },
    {
      cap: "AD は正方形 ABCD の辺、BC も同じ。BE は正方形 ABEH の辺だね。どれも AB と **90°** で交わるよ。",
      clear: true,
      add: [...xline("AB", { c: "p" }), ...cutH(), ...xline("AD"), ...xline("BC"), ...xline("BE"), mark("A", "D", "B", "rA"), mark("B", "C", "A", "rB1"), mark("B", "E", "A", "rB2")],
      eq: ["AD ⊥ AB　○", "BC ⊥ AB　○", "BE ⊥ AB　○"],
    },
    {
      cap: "**AG** は見おとしやすいよ。AB は正方形 ADGH に垂直だから、その面の上の AG とも垂直になるんだ。",
      add: [seg("H", "G", { c: "k", dash: true, w: 1.8 }), face("ADGH", "fADGH", "y"), ...xline("AG"), mark("A", "G", "B", "rG")],
      eq: ["AG ⊥ AB　○（AB ⊥ 面ADGH）"],
    },
    {
      cap: "**AE** は？ 正方形 ABEH の対角線だから、AB との角は **45°**。垂直じゃないよ ×。",
      add: [ang("A", "B", "E", { r: 34, l: "45°", c: "p" })],
      hl: ["eAE"],
      eq: ["AE と AB は 45°　×", `=> (2) ${jl(perpAB)}`],
    },
    // ── (3) 直線ABとねじれの位置にある直線 ──
    {
      cap: "(3) 直線AB と**ねじれの位置**。AB 以外の11本のうち、平行な2本と、交わる5本は、ねじれじゃないね。",
      clear: true,
      eqClear: true,
      add: [...xline("AB", { c: "p" })],
      hl: ["eCD", "eFG", "eAD", "eAE", "eAG", "eBC", "eBE"],
      eq: ["## (3) ABとねじれの位置", "// ねじれ ＝ 平行でなく、交わらない", `平行：${parAB.join(", ")}（${parAB.length}本）`, `交わる：${[...perpAB, ...obliqueAB].sort().join(", ")}（${perpAB.length + obliqueAB.length}本）`],
    },
    {
      cap: "のこりの **CF・DG・EF・EG** が、ねじれの位置だよ。11 − 2 − 5 ＝ 4本だね。",
      add: [...skewAB.flatMap((e) => xline(e))],
      eq: [`ねじれ：${skewAB.join(", ")}（${skewAB.length}本）`, `=> (3) ${jl(skewAB)}`],
    },
    {
      cap: "なぜ？ **EF・EG** は上の面 EFG の上。この面は底面と平行だから、底面にある AB とは交わらないよ。",
      clear: true,
      add: [face("ABCD", "gABCD", "b"), face("EFG", "gEFG", "y"), ...xline("AB", { c: "p" }), ...xline("EF"), ...xline("EG")],
    },
    {
      cap: "**CF** は面 BCFE の上の直線。AB はこの面と **B だけ**で交わるけど、CF は B を通らないから、交わらないよ。DG も同じ。",
      clear: true,
      add: [face("BCFE", "gBCFE", "y"), ...xline("AB", { c: "p" }), ...xline("CF"), dot(pt.B[0], pt.B[1], { c: "a", r: 5 })],
    },
    {
      cap: "答えをまとめるよ。(2) の **AG**（見おとしやすい）と、(3) の **EG**（ななめの辺）を、ぬかさないようにね。",
      clear: true,
      eqClear: true,
      eq: ["## 答え", `(1) ${parAB.join("・")}`, `(2) ${perpAB.join("・")}`, `(3) ${skewAB.join("・")}`],
      fin: true,
    },
  ],
};
