// 問35：正四面体の表面でひもをかける最短（展開図で直線）
import { P, seg, poly, geo } from "../dsl.js";

// ── 立体（印刷物の図の形）
const T = { A: [245, 29], B: [148, 150], C: [265, 200], D: [333, 127] };
const tE = geo.mid(T.A, T.C);                       // 立体の図の E（ACの中点）

// ── 展開図（平行四辺形）：下の段 B C B、上の段 A D A
const L = 126, h = (L * Math.sqrt(3)) / 2, y0 = 380, x0 = 82.5;
const N = {
  B1: [x0, y0], C: [x0 + L, y0], B2: [x0 + 2 * L, y0],
  A1: [x0 + L / 2, y0 - h], D: [x0 + 1.5 * L, y0 - h], A2: [x0 + 2.5 * L, y0 - h],
};
// 直線 B1D と 辺 A1C の交点（図の考え方）
const nE = geo.interLL(N.B1, N.D, N.A1, N.C);

// ── 確かめ（2通り）。①展開図の交点が AC の中点か　②立体の座標で、ひもの長さが最小になる位置
{
  const m = geo.mid(N.A1, N.C);
  if (geo.dist(nE, m) > 1e-6) throw new Error("問35：交点が中点になりません");
  const A = [1, 1, 1], B = [1, -1, -1], C = [-1, 1, -1], D = [-1, -1, 1];   // 正四面体（辺 2√2）
  const d3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  let best = 1e9, bt = 0;
  for (let i = 0; i <= 10000; i++) {
    const t = i / 10000, E = A.map((v, k) => v + (C[k] - v) * t), len = d3(B, E) + d3(E, D);
    if (len < best) { best = len; bt = t; }
  }
  if (Math.abs(bt - 0.5) > 1e-3) throw new Error("問35：最短の位置が中点ではありません " + bt);
}
// 「ずらした点 E'」（AC を A から 3割のところ）
const nEp = geo.lerp(N.A1, N.C, 0.3);

export default {
  n: 35,
  title: "正四面体の最短のひも",
  problem: "右の図のような正四面体ABCDと、その展開図がある。正四面体の頂点Bから、辺ACを通って点Dまで図のようにひもをかけるとき、ひもの長さがもっとも短くなるような点Eの位置を、展開図にかき入れなさい。",
  answer: "点Eは、辺ACの**中点**。（展開図で、直線BDと辺ACが交わる点）",
  view: [0, 0, 480, 420],
  steps: [
    {
      cap: "正四面体ABCDに、頂点Bから辺AC上の点Eを通って、頂点Dまでひもをかけたよ。**いちばん短く**なる点Eを、展開図にかこう。",
      add: [
        P("A", T.A[0], T.A[1], "A", "n", { dot: false }), P("B", T.B[0], T.B[1], "B", "w", { dot: false }),
        P("C", T.C[0], T.C[1], "C", "se", { dot: false }), P("D", T.D[0], T.D[1], "D", "e", { dot: false }),
        seg("A", "B"), seg("A", "D"), seg("B", "C"), seg("C", "D"), seg("A", "C"), seg("B", "D", { dash: true }),
        P("E", tE[0], tE[1], "E", "nw", { r: 3 }),
        seg("B", "E", { w: 1.5 }), seg("E", "D", { w: 1.5 }),
        P("nA1", N.A1[0], N.A1[1], "A", "n", { dot: false }), P("nD", N.D[0], N.D[1], "D", "n", { dot: false }), P("nA2", N.A2[0], N.A2[1], "A", "n", { dot: false }),
        P("nB1", N.B1[0], N.B1[1], "B", "sw", { dot: false }), P("nC", N.C[0], N.C[1], "C", "s", { dot: false }), P("nB2", N.B2[0], N.B2[1], "B", "se", { dot: false }),
        poly(["nB1", "nC", "nB2", "nA2", "nD", "nA1"]),
        seg("nA1", "nC", { dash: true }), seg("nC", "nD", { dash: true }), seg("nD", "nB2", { dash: true }),
      ],
    },
    {
      cap: "ひもは、**面ABCと面ACD**の2つの面にまたがっているね。この2つの面を、辺ACでつなげたまま、1まいの平面にひろげてみよう。",
      add: [
        poly(["A", "B", "C"], { fill: "b", w: 0, id: "tf1" }), poly(["A", "C", "D"], { fill: "y", w: 0, id: "tf2" }),
        poly(["nA1", "nB1", "nC"], { fill: "b", w: 0, id: "nf1" }), poly(["nA1", "nC", "nD"], { fill: "y", w: 0, id: "nf2" }),
      ],
      together: true,
      hl: ["nf1", "nf2"],
      eq: ["## 考え方", "① ひもがかかる2つの面を、辺ACでつなげて平らにひろげる（展開図）"],
    },
    {
      cap: "展開図のなかで、2つの面の**境目**は辺AC。ひもは、Bから辺ACをこえて、Dまで行くよ。",
      add: [seg("A", "C", { c: "p", w: 3.4, id: "tAC" }), seg("nA1", "nC", { c: "p", w: 3.4, id: "nAC" })],
      hl: ["nAC"],
    },
    {
      cap: "平らにひろげた図の上では、BからDまでの**いちばん短い道は直線**だね。BとDを、まっすぐ結ぼう。",
      add: [seg("nB1", "nD", { id: "nBD", w: 2.6 })],
      hl: ["nBD"],
      eq: ["② 平面では、2点を結ぶ最短は**直線**", "→ 展開図で B と D を直線で結ぶ"],
    },
    {
      cap: "直線BDが辺ACと**交わる点**が、ひもがACをこえる場所。ここを**点E**として、展開図にかき入れるよ。",
      add: [P("nE", nE[0], nE[1], "E", "e", { c: "a", r: 5, dx: 12, dy: 9 })],
      eq: ["③ 直線BD と 辺AC の交点が E"],
    },
    {
      cap: "Eは、ACのどこかな？ 面ABCと面ACDは合同な**正三角形**。だから、ABCDは4つの辺が等しい**ひし形**だよ。",
      add: [
        seg("nA1", "nB1", { tick: 1, c: "p", w: 2.6 }), seg("nB1", "nC", { tick: 1, c: "p", w: 2.6 }),
        seg("nC", "nD", { tick: 1, c: "p", w: 2.6 }), seg("nD", "nA1", { tick: 1, c: "p", w: 2.6 }),
      ],
      together: true,
      eq: ["// 正三角形が2つ → ABCD は4辺が等しい", "// つまり ひし形"],
    },
    {
      cap: "ひし形の**対角線は、たがいに相手のまん中で交わる**よ。だから AE＝EC。Eは辺ACの**中点**だね。",
      add: [seg("nA1", "nE", { tick: 2, c: "a", w: 3.4 }), seg("nE", "nC", { tick: 2, c: "a", w: 3.4 })],
      eq: ["ひし形の対角線 → たがいの中点で交わる", "AE ＝ EC", "=> E は辺ACの中点"],
    },
    {
      cap: "確かめよう。Eからずらして、辺AC上の別の点E'を通ってみると、B→E'→Dは折れ線。**折れ線は直線BDより長い**ね。",
      add: [
        P("nEp", nEp[0], nEp[1], "E'", "e", { c: "p", r: 4, dx: 10, dy: 14 }),
        seg("nB1", "nEp", { id: "nBEp", c: "p", w: 2 }), seg("nEp", "nD", { id: "nEpD", c: "p", w: 2 }),
      ],
      eq: ["BE' ＋ E'D ＞ BD", "// E以外の点を通ると、ひもは長くなる"],
    },
    {
      cap: "立体にもどすと、ひもが最短になるのは、**辺ACの中点E**を通るとき。これが答えだよ。",
      hide: ["nEp", "nBEp", "nEpD"],
      add: [
        seg("B", "E", { c: "a", w: 3.4 }), seg("E", "D", { c: "a", w: 3.4 }),
        seg("A", "E", { tick: 2, c: "a", w: 3 }), seg("E", "C", { tick: 2, c: "a", w: 3 }),
        seg("nB1", "nD", { c: "a", w: 3.4 }),
      ],
      eq: ["=> 点E は 辺ACの中点"],
      fin: true,
    },
  ],
};
