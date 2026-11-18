// 問36：立方体の切断面の形（3次元座標で切り口を計算して、形を判定する）
import { P, seg, poly, dot, rt, oblique, solid } from "../dsl.js";

// ── 立方体（一辺 S）。x:右 y:おく z:上。印刷物の図：A 左まえ下、B 右まえ下、C 右おく下、D 左おく下、E〜H がその真上
const S = 170;
const pr = oblique(48, 258, 0.5, 40);
const V = { A: [0, 0, 0], B: [S, 0, 0], C: [S, S, 0], D: [0, S, 0], E: [0, 0, S], F: [S, 0, S], G: [S, S, S], H: [0, S, S] };
const EDGES = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], ["E", "F"], ["F", "G"], ["G", "H"], ["H", "E"], ["A", "E"], ["B", "F"], ["C", "G"], ["D", "H"]];
const mid3 = (p, q) => p.map((v, i) => (v + q[i]) / 2);
const M3 = mid3(V.E, V.H), N3 = mid3(V.H, V.G);            // M：辺EHの中点、N：辺HGの中点

// ── 3次元のベクトル
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len2 = (a) => dotp(a, a);

// 3点を通る平面と、立方体の12辺との交点（＝切り口の多角形の頂点）。まわる順にならべて返す
function section(p1, p2, p3) {
  const n = cross(sub(p2, p1), sub(p3, p1)), d = dotp(n, p1);
  const pts = [];
  const add = (p) => { if (!pts.some((q) => len2(sub(p, q)) < 1e-6)) pts.push(p); };
  for (const [a, b] of EDGES) {
    const va = V[a], vb = V[b], sa = dotp(n, va) - d, sb = dotp(n, vb) - d;
    if (Math.abs(sa) < 1e-9) add(va);
    if (Math.abs(sb) < 1e-9) add(vb);
    if (sa * sb < -1e-9) { const t = sa / (sa - sb); add(va.map((v, i) => v + (vb[i] - v) * t)); }
  }
  const c = pts.reduce((s, p) => s.map((v, i) => v + p[i] / pts.length), [0, 0, 0]);
  const u = sub(pts[0], c), w = cross(n, u);
  pts.sort((p, q) => Math.atan2(dotp(sub(p, c), w), dotp(sub(p, c), u)) - Math.atan2(dotp(sub(q, c), w), dotp(sub(q, c), u)));
  return pts;
}
// 切り口の形を、頂点の数・辺の長さ・平行・直角から機械的に判定する
function classify(pts) {
  const k = pts.length, vs = pts.map((p, i) => sub(pts[(i + 1) % k], p)), l2 = vs.map(len2);
  const eq = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(a, b);
  const par = (i, j) => len2(cross(vs[i], vs[j])) < 1e-9 * l2[i] * l2[j];
  if (k === 3) {
    const e = [eq(l2[0], l2[1]), eq(l2[1], l2[2]), eq(l2[2], l2[0])].filter(Boolean).length;
    return e === 3 ? "正三角形" : e >= 1 ? "二等辺三角形" : "ふつうの三角形";
  }
  if (k === 4) {
    const allEq = l2.every((x) => eq(x, l2[0])), right = Math.abs(dotp(vs[0], vs[1])) < 1e-6 * Math.sqrt(l2[0] * l2[1]);
    const p02 = par(0, 2), p13 = par(1, 3);
    if (allEq) return right ? "正方形" : "ひし形";
    if (p02 && p13) return right ? "長方形" : "平行四辺形";
    if (p02 || p13) return "台形";
    return "ふつうの四角形";
  }
  return k + "角形";
}
const OPT = { 正方形: "ア", 長方形: "イ", 正三角形: "ウ", 二等辺三角形: "エ", 台形: "オ", ひし形: "カ" };

// 4つの小問
const Q = [
  { pts: [V.A, V.C, V.H], want: "正三角形" },
  { pts: [V.D, M3, N3], want: "二等辺三角形" },
  { pts: [V.A, M3, N3], want: "台形" },
  { pts: [V.C, V.D, V.E], want: "長方形" },
];
const R = Q.map((q) => {
  const poly3 = section(...q.pts), name = classify(poly3);
  if (name !== q.want) throw new Error(`問36：判定が合いません ${name} / ${q.want}`);
  return { poly3, name, opt: OPT[name] };
});
// 頂点の数：三角形、三角形、四角形、四角形
if (R.map((r) => r.poly3.length).join() !== "3,3,4,4") throw new Error("問36：頂点の数が合いません");

// ── 図
const cube = solid(pr, V,
  [["A", "B"], ["B", "C"], ["E", "F"], ["F", "G"], ["G", "H"], ["H", "E"], ["A", "E"], ["B", "F"], ["C", "G"]],
  [["A", "D"], ["D", "C"], ["D", "H"]],
  { lp: { A: "sw", B: "se", C: "e", D: "nw", E: "nw", F: "ne", G: "ne", H: "n" } });
const sc = (p) => pr(p);
// その線が、見える面（まえ・上・右）の上にあるか
const VIS = [[1, 0], [2, S], [0, S]];
const visible = (p, q) => VIS.some(([ax, val]) => Math.abs(p[ax] - val) < 1e-9 && Math.abs(q[ax] - val) < 1e-9);
const cut = (p, q, o = {}) => seg(sc(p), sc(q), { dash: !visible(p, q), ...o });
const mark = (p, o = {}) => dot(sc(p)[0], sc(p)[1], { c: "a", r: 5.5, ...o });
// 切り口：色ぬり＋ふち
function fillEls(i, id) {
  const pts = R[i].poly3;
  return [poly(pts.map(sc), { fill: "y", fo: 0.42, w: 0, id: id + "f" }),
    ...pts.map((p, j) => cut(p, pts[(j + 1) % pts.length], { c: "a", w: 3.2, id: id + "e" + j }))];
}

export default {
  n: 36,
  title: "立方体の切断面の形",
  problem: "立方体ABCD−EFGHを、次の3点を通る平面で切断するとき、切断面の形として最もふさわしいものを（ア）〜（カ）の中から選びなさい。ただし、M、Nはそれぞれの辺の中点です。\n（ア）正方形　（イ）長方形　（ウ）正三角形　（エ）二等辺三角形　（オ）台形　（カ）ひし形\n(1) A, C, H　(2) D, M, N　(3) A, M, N　(4) C, D, E",
  answer: `(1) （${R[0].opt}）${R[0].name}　(2) （${R[1].opt}）${R[1].name}　(3) （${R[2].opt}）${R[2].name}　(4) （${R[3].opt}）${R[3].name}`,
  view: [0, 0, 360, 300],
  steps: [
    {
      cap: "立方体を、3点を通る平面で切ったとき、**切り口はどんな形**になるかな？ (1)〜(4)を、1つずつ調べよう。",
      add: [...cube.els, P("M", ...sc(M3), "M", "nw"), P("N", ...sc(N3), "N", "n")],
    },
    {
      cap: "切り口の見つけ方。①**同じ面にある2点**を線で結ぶ。②**平行な面**には、**平行な線**ができる。",
      eq: ["## 切り口の見つけ方", "① 同じ面の上の2点を線で結ぶ", "② 平行な面 → 切り口の線も平行", "③ できた図形の辺の長さ・平行・角を調べる"],
    },
    // ── (1)
    {
      cap: "(1) A、C、H。同じ面にある2点を結ぶと、ACは下の面、CHはうしろの面、HAは左の面の線になるよ。",
      clear: true, eqClear: true,
      add: [mark(V.A), mark(V.C), mark(V.H), cut(V.A, V.C, { id: "a1" }), cut(V.C, V.H, { id: "a2" }), cut(V.H, V.A, { id: "a3" })],
      eq: ["## (1) A, C, H", "AC：下の面　CH：うしろの面　HA：左の面"],
    },
    {
      cap: "切り口は**△ACH**。AC、CH、HAは、どれも正方形の**対角線**だから、3つの辺の長さが等しいよ。",
      hide: ["a1", "a2", "a3"],
      add: [...fillEls(0, "r1"), cut(V.A, V.C, { tick: 1, c: "a", w: 3.2 }), cut(V.C, V.H, { tick: 1, c: "a", w: 3.2 }), cut(V.H, V.A, { tick: 1, c: "a", w: 3.2 })],
      eq: ["AC ＝ CH ＝ HA（どれも面の対角線）", "=> (1) （ウ）正三角形"],
    },
    // ── (2)
    {
      cap: "(2) D、M、N。DMは左の面、DNはうしろの面、MNは上の面の上の線だね。3つを結ぼう。",
      clear: true, eqClear: true,
      add: [mark(V.D), mark(M3), mark(N3), cut(V.D, M3, { id: "b1" }), cut(V.D, N3, { id: "b2" }), cut(M3, N3, { id: "b3" })],
      eq: ["## (2) D, M, N", "DM：左の面　DN：うしろの面　MN：上の面"],
    },
    {
      cap: "切り口は**△DMN**。辺の長さを調べよう。DMとDNは、直角三角形 DHM と DHN の斜辺だよ。",
      hide: ["b1", "b2", "b3"],
      add: [...fillEls(1, "r2"), rt(sc(V.H), sc(V.D), sc(M3), { c: "p", s: 12 }), rt(sc(V.H), sc(V.D), sc(N3), { c: "p", s: 12 })],
      eq: ["△DHM と △DHN に注目"],
    },
    {
      cap: "DHは共通、HM＝HN（中点だから）、∠H＝90°。2つの直角三角形は合同だから **DM＝DN**。MNは短いよ。",
      add: [cut(V.D, M3, { tick: 1, c: "a", w: 3.2 }), cut(V.D, N3, { tick: 1, c: "a", w: 3.2 })],
      eq: ["△DHM ≡ △DHN", "DM ＝ DN　（MNは別の長さ）", "=> (2) （エ）二等辺三角形"],
    },
    // ── (3)
    {
      cap: "(3) A、M、N。AとMは左の面なので AM、MとNは上の面なので MN を結ぶよ。",
      clear: true, eqClear: true,
      add: [mark(V.A), mark(M3), mark(N3), cut(V.A, M3, { id: "c1" }), cut(M3, N3, { id: "c2" })],
      eq: ["## (3) A, M, N", "AM：左の面　MN：上の面"],
    },
    {
      cap: "上の面と下の面は**平行**だから、下の面の切り口は、MNと**平行**な線。MN∥EG∥ACだから、Aを通る線はACだよ。",
      add: [cut(V.E, V.G, { c: "k", w: 1.6, dash: "4 4", id: "c3" }), cut(V.A, V.C, { c: "p", w: 3 })],
      eq: ["上の面の MN ∥ 対角線 EG", "EG ∥ AC（上下の面の対角線）", "→ 下の面の切り口は AC"],
    },
    {
      cap: "CとNは、うしろの面にあるから CN を結ぶよ。切り口は**四角形ACNM**。AC∥MNで、長さはAC＞MNだから**台形**だね。",
      hide: ["c1", "c2", "c3"],
      add: [...fillEls(2, "r3")],
      eq: ["AC ∥ MN、でも AC ＞ MN（MNは半分）", "平行な辺が1組だけ", "=> (3) （オ）台形"],
    },
    // ── (4)
    {
      cap: "(4) C、D、E。CDは立方体の辺そのもの。DとEは左の面にあるから、DEを結ぶよ。",
      clear: true, eqClear: true,
      add: [mark(V.C), mark(V.D), mark(V.E), cut(V.C, V.D, { id: "d1" }), cut(V.D, V.E, { id: "d2" })],
      eq: ["## (4) C, D, E", "CD：辺　DE：左の面"],
    },
    {
      cap: "うしろの面と、前の面は**平行**。うしろの面の切り口がDCだから、前の面では、Eを通ってDCと平行な線＝**辺EF**だよ。",
      add: [cut(V.E, V.F, { c: "p", w: 3, id: "d3" })],
      eq: ["うしろの面 DC ∥ 前の面 EF"],
    },
    {
      cap: "FとCは右の面にあるから FC を結ぶ。切り口は**四角形DCFE**。DC∥EF、DC＝EFだね。",
      hide: ["d1", "d2", "d3"],
      add: [...fillEls(3, "r4")],
      eq: ["DC ∥ EF　DC ＝ EF", "→ 平行四辺形"],
    },
    {
      cap: "CDは左の面に垂直だから、∠EDC＝90°。だから**長方形**。DEはCDより長いので、正方形ではないよ。",
      add: [rt(sc(V.D), sc(V.C), sc(V.E), { c: "p", s: 12 })],
      eq: ["∠EDC ＝ 90°（CD ⊥ 左の面）", "DE（面の対角線）＞ CD → 正方形ではない", "=> (4) （イ）長方形"],
    },
    {
      cap: `答え合わせ。(1)（${R[0].opt}）${R[0].name}、(2)（${R[1].opt}）${R[1].name}、(3)（${R[2].opt}）${R[2].name}、(4)（${R[3].opt}）${R[3].name}。`,
      clear: true, eqClear: true,
      eq: ["## 答え", `(1) （${R[0].opt}）${R[0].name}`, `(2) （${R[1].opt}）${R[1].name}`, `(3) （${R[2].opt}）${R[2].name}`, `=> (4) （${R[3].opt}）${R[3].name}`],
      fin: true,
    },
  ],
};
