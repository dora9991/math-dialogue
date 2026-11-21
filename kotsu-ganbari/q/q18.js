// 問18：三角柱の、直線と平面の位置関係（すべて答える問題）
//   頂点の3次元座標を決めて、全部の組をベクトルで判定 → 答えを出す（検算つき）
import { P, seg, poly, rt } from "../dsl.js";

// ───────── 3次元の道具（判定用）─────────
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const zero = (v) => Math.hypot(...v) < 1e-9;
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const lineOf = (a, b) => ({ p: a, d: sub(b, a) });
const planeOf = (a, b, c) => ({ p: a, n: cross(sub(b, a), sub(c, a)) });
// 直線と直線：same / parallel / intersect / skew
function relLL(L1, L2) {
  const c = cross(L1.d, L2.d), w = sub(L2.p, L1.p);
  if (zero(c)) return zero(cross(w, L1.d)) ? "same" : "parallel";
  return Math.abs(dot(w, c)) < 1e-9 ? "intersect" : "skew";
}
// 直線と平面：perp（垂直）/ intersect（ななめに交わる）/ contained（ふくまれる）/ parallel
function relLP(L, Pl) {
  if (Math.abs(dot(L.d, Pl.n)) > 1e-9) return zero(cross(L.d, Pl.n)) ? "perp" : "intersect";
  return Math.abs(dot(sub(L.p, Pl.p), Pl.n)) < 1e-9 ? "contained" : "parallel";
}

// ───────── 立体（まっすぐ立った三角柱）─────────
const V = { A: [0, 0, 0], B: [4, 0, 0], C: [3, 3, 0], D: [0, 0, 3], E: [4, 0, 3], F: [3, 3, 3] };
const LN = ["AB", "BC", "AC", "DE", "EF", "DF", "AD", "BE", "CF"];               // 辺を延ばした直線 9本
const PLN = { ABC: ["A", "B", "C"], DEF: ["D", "E", "F"], ABED: ["A", "B", "E"], BEFC: ["B", "E", "F"], ACFD: ["A", "C", "F"] }; // 面を延ばした平面 5つ
const L = {}; LN.forEach((e) => (L[e] = lineOf(V[e[0]], V[e[1]])));
const PL = {}; Object.entries(PLN).forEach(([k, v]) => (PL[k] = planeOf(V[v[0]], V[v[1]], V[v[2]])));

const perpABC = LN.filter((e) => relLP(L[e], PL.ABC) === "perp");                // (1)
const parABC = LN.filter((e) => relLP(L[e], PL.ABC) === "parallel");             // (2)
const inABC = LN.filter((e) => relLP(L[e], PL.ABC) === "contained");
const parAD = Object.keys(PL).filter((k) => relLP(L.AD, PL[k]) === "parallel");  // (3)
const inAD = Object.keys(PL).filter((k) => relLP(L.AD, PL[k]) === "contained");
const crossAD = Object.keys(PL).filter((k) => ["perp", "intersect"].includes(relLP(L.AD, PL[k])));
const rDE = {}; LN.filter((e) => e !== "DE").forEach((e) => (rDE[e] = relLL(L.DE, L[e])));
const skewDE = Object.keys(rDE).filter((e) => rDE[e] === "skew");                // (4)
const parDE = Object.keys(rDE).filter((e) => rDE[e] === "parallel");
const intDE = Object.keys(rDE).filter((e) => rDE[e] === "intersect");
// 検算：手で考えた答えと、機械の判定が一致しているか
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
if (!(same(perpABC, ["AD", "BE", "CF"]) && same(parABC, ["DE", "EF", "DF"]) && same(inABC, ["AB", "BC", "AC"]) && same(parAD, ["BEFC"]) && same(inAD, ["ABED", "ACFD"]) && same(crossAD, ["ABC", "DEF"]) &&
  same(skewDE, ["BC", "AC", "CF"]) && same(parDE, ["AB"]) && same(intDE, ["EF", "DF", "AD", "BE"]))) throw new Error("問18：答えの検算が合いません");
const jl = (a) => a.map((e) => "直線" + e).join("、");

// ───────── 図（印刷物の三角柱に合わせた斜めの投影）─────────
// 写真の図：A(800,512) B(1027,565) C(1105,478) D(797,270)。そこから、1目もりぶんの画面ベクトルを出す。
const K = 0.66, ox = 105, oy = 230;
const ex = [(227 / 4) * K, (53 / 4) * K];
const ey = [((305 - 3 * (227 / 4)) / 3) * K, ((-34 - 3 * (53 / 4)) / 3) * K];
const ez = [-0.9 * K, -79.8 * K];
const pr = ([x, y, z]) => [Math.round((ox + x * ex[0] + y * ey[0] + z * ez[0]) * 100) / 100, Math.round((oy + x * ex[1] + y * ey[1] + z * ez[1]) * 100) / 100];
const pt = {}; Object.entries(V).forEach(([k, v]) => (pt[k] = pr(v)));
const HID = new Set(["AC"]);                                  // 見えない辺（点線）
const lp = { A: "sw", B: "se", C: "se", D: "nw", E: "nw", F: "se" };
const off = { D: { dy: -14 } };            // 名前の微調整（延ばした直線とかさならないように）
const VIS = [["A", "B"], ["B", "C"], ["D", "E"], ["E", "F"], ["D", "F"], ["A", "D"], ["B", "E"], ["C", "F"]];
const prism = [
  ...Object.keys(V).map((k) => P(k, pt[k][0], pt[k][1], k, lp[k], { dot: false, size: 18, ...(off[k] || {}) })),
  ...VIS.map(([a, b]) => seg(a, b, { id: "e" + a + b })),
  seg("A", "C", { id: "eAC", dash: true }),
];
// 辺を両はしに延ばした直線（赤＝答え／紫＝もとにする直線）
const ext = (a, b, t = 0.22) => [lerp3(V[a], V[b], -t), lerp3(V[a], V[b], 1 + t)];
function xline(e, o = {}) {
  const [a, b] = [e[0], e[1]], [p, q] = ext(a, b);
  const base = { id: "x" + e, c: "a", w: 3.2, ...o };
  if (!HID.has(e)) return [seg(pr(p), pr(q), base)];
  return [seg(a, pr(q), { ...base, dash: true }), seg(pr(p), a, { ...base, id: base.id + "b", dash: true })];   // 点線は、もとの辺と点線のリズムをそろえる
}
const face = (names, id, fill) => poly(names.split(""), { id, fill, w: 0 });
const mark = (at, from, to, id, c = "a") => rt(at, from, to, { id, c, s: 12 });

export default {
  n: 18,
  title: "三角柱の直線と平面",
  problem: "次の立体 ABC－DEF は三角柱です。この立体の各辺を延長した直線、各面を延長した平面について、あてはまるものをすべて答えなさい。\n(1) 平面ABCと垂直な直線\n(2) 平面ABCと平行な直線\n(3) 直線ADと平行な平面\n(4) 直線DEとねじれの位置にある直線",
  answer: `(1) ${jl(perpABC)}　(2) ${jl(parABC)}　(3) 平面BEFC（＝平面BCFE）　(4) ${jl(skewDE)}`,
  view: [0, 0, 400, 330],
  steps: [
    {
      cap: "三角柱 ABC−DEF の、辺を延ばした**直線**と、面を延ばした**平面**から、(1)〜(4) にあてはまるものを**ぜんぶ**探すよ。",
      add: prism,
    },
    {
      cap: "**まっすぐ立った三角柱**として考えるよ。AD・BE・CF は底面に垂直。上の面 DEF は、底面 ABC と平行だね。",
      add: [face("ABC", "fABC", "b"), face("DEF", "fDEF", "b"), mark("A", "D", "B", "rA", "p"), mark("B", "E", "A", "rB", "p"), mark("C", "F", "B", "rC", "p")],
      hl: ["eAD", "eBE", "eCF"],
      eq: ["## 立体の読みとり", "AD, BE, CF は底面に垂直", "平面ABC ∥ 平面DEF", "// 直線は9本、平面は5つが候補"],
    },
    // ── (1) 平面ABCと垂直な直線 ──
    {
      cap: "(1) 平面ABC と**垂直**な直線。底面に、まっすぐ立っている直線を探そう。",
      clear: true,
      eqClear: true,
      add: [face("ABC", "gABC", "b")],
      eq: ["## (1) 平面ABCと垂直な直線"],
    },
    {
      cap: "**AD・BE・CF** は、底面にまっすぐ立っているね。だから平面ABCと垂直だよ。",
      add: [...xline("AD"), ...xline("BE"), ...xline("CF"), mark("A", "D", "B", "sA"), mark("B", "E", "A", "sB"), mark("C", "F", "B", "sC")],
      eq: perpABC.map((e) => `${e} ⊥ 平面ABC　○`),
    },
    {
      cap: "ほかの6本は×。**AB・BC・AC** は平面ABCの上にあって、**DE・EF・DF** は平面ABCと平行だよ。",
      hl: ["eAB", "eBC", "eAC", "eDE", "eEF", "eDF"],
      eq: [`${inABC.join("・")}：平面ABCの上にある　×`, `${parABC.join("・")}：平面ABCと平行　×`, `=> (1) ${jl(perpABC)}`],
    },
    // ── (2) 平面ABCと平行な直線 ──
    {
      cap: "(2) 平面ABC と**平行**な直線。上の面 DEF は底面と平行だから、**DE・EF・DF** は、延ばしても平面ABCと交わらないよ。",
      clear: true,
      eqClear: true,
      add: [face("ABC", "hABC", "b"), face("DEF", "hDEF", "y"), ...xline("DE"), ...xline("EF"), ...xline("DF")],
      eq: ["## (2) 平面ABCと平行な直線", ...parABC.map((e) => `${e} ∥ 平面ABC　○`)],
    },
    {
      cap: "**AB・BC・AC** は平面ABCの**上**、**AD・BE・CF** は平面ABCと**垂直に交わる**から、どれも×だよ。",
      hl: ["eAB", "eBC", "eAC", "eAD", "eBE", "eCF"],
      eq: ["// 平面の上にある直線は「平行」とは言わない", `=> (2) ${jl(parABC)}`],
    },
    // ── (3) 直線ADと平行な平面 ──
    {
      cap: "(3) 直線AD と**平行**な平面。5つの面を1つずつ調べるよ。平面ABC と 平面DEF は、AD と **A、D で交わる**から×。",
      clear: true,
      eqClear: true,
      add: [face("ABC", "iABC", "y"), face("DEF", "iDEF", "y"), ...xline("AD", { c: "p" })],
      eq: ["## (3) 直線ADと平行な平面", ...crossAD.map((k) => `平面${k}：ADと交わる　×`)],
    },
    {
      cap: "平面ABED と 平面ACFD は、AD を**ふくんでいる**。「ふくむ」は平行とは言わないから×だよ。",
      clear: true,
      add: [face("ABED", "jABED", "y"), face("ACFD", "jACFD", "y"), ...xline("AD", { c: "p" })],
      eq: inAD.map((k) => `平面${k}：ADをふくむ　×`),
    },
    {
      cap: "平面BEFC は、AD と交わらない。AD ∥ BE で、BE はこの平面の上にあるから、**平行**だよ。",
      clear: true,
      add: [face("BEFC", "kBEFC", "a"), ...xline("AD", { c: "p" }), ...xline("BE", { c: "p", w: 2.4 })],
      eq: ["平面BEFC：ADと交わらない　○", "=> (3) 平面BEFC（＝平面BCFE）"],
    },
    // ── (4) 直線DEとねじれの位置にある直線 ──
    {
      cap: "(4) 直線DE と**ねじれの位置**にある直線。ねじれ ＝ **平行でなく、交わらない**。DE と、ほかの8本を比べよう。",
      clear: true,
      eqClear: true,
      add: [...xline("DE", { c: "p" })],
      eq: ["## (4) 直線DEとねじれの位置", "// ねじれ ＝ 平行でなく、交わらない"],
    },
    {
      cap: "**AB** は DE と平行。**EF・DF・AD・BE** は E か D を通るから、DE と交わるよ。この5本は×。",
      hl: ["eAB", "eEF", "eDF", "eAD", "eBE"],
      eq: [`${parDE.join("・")}：DEと平行　×`, `${intDE.join("・")}：DEと交わる　×`],
    },
    {
      cap: "**BC・AC** は底面の上。DE は上の面の上で、2つの面は平行だから、延ばしても DE と交わらないよ。",
      add: [face("ABC", "lABC", "b"), face("DEF", "lDEF", "b"), ...xline("BC"), ...xline("AC")],
    },
    {
      cap: "しかも DE ∥ AB で、BC・AC は AB と交わる（平行でない）。だから DE と平行でもない。**ねじれ**だね。",
      hl: ["eAB", "xBC", "xAC", "xDE"],
      eq: ["BC：ねじれの位置　○", "AC：ねじれの位置　○"],
    },
    {
      cap: "**CF** は？ F は DE の上にないから、延ばしても DE と交わらないよ。平行でもないから、**ねじれ**だね。",
      clear: true,
      add: [...xline("DE", { c: "p" }), ...xline("CF")],
      eq: ["CF：ねじれの位置　○", `=> (4) ${jl(skewDE)}`],
    },
    {
      cap: "答えをまとめるよ。(1)と(2)は直線、(3)は**平面**、(4)は、見おとしやすい CF を忘れずにね。",
      clear: true,
      eqClear: true,
      eq: ["## 答え", `(1) ${perpABC.join("・")}`, `(2) ${parABC.join("・")}`, "(3) 平面BEFC", `(4) ${skewDE.join("・")}`],
      fin: true,
      dur: 8000,
    },
  ],
};
