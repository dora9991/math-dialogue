// 問3：垂直の記号と、点と直線の距離
import { P, seg, rt, txt, geo } from "../dsl.js";

// 印刷物の図：△ABC。A から辺 BC に垂線 AD（D は BC 上で、C より B に近い側）
const B = [55, 235], C = [344, 235];
const D = [243, 235];
const A = [243, 35];
const E = [140, 235];          // 説明用：BC 上のほかの点

// ---- 検算（JS）----
const ok = (c, m) => { if (!c) throw new Error("検算NG：" + m); };
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
ok(Math.abs(dot(sub(A, D), sub(C, B))) < 1e-9, "AD⊥BC");
const f = geo.foot(A, B, C);
ok(geo.dist(f, D) < 1e-9, "垂線の足は D");
// BC 上の点（B から C まで 1 きざみ）のうち、A にいちばん近いのは D
let best = null;
for (let x = B[0]; x <= C[0]; x++) { const d = geo.dist(A, [x, 235]); if (!best || d < best.d) best = { d, x }; }
ok(best.x === D[0], "いちばん近い点は D");
ok(geo.dist(A, D) < geo.dist(A, B) && geo.dist(A, D) < geo.dist(A, C) && geo.dist(A, D) < geo.dist(A, E), "AD が最短");

export default {
  n: 3,
  title: "垂直と、点と直線の距離",
  problem: "次の図を見て答えなさい。\n(1) 線分 AD と線分 BC の関係を、垂直の記号を使って表しなさい。\n(2) 点 A と直線 BC の距離を表す線分はどれか答えなさい。",
  answer: "(1) AD ⊥ BC　(2) 線分 AD",
  view: [0, 10, 400, 260],
  steps: [
    {
      cap: "△ABC と、点 A から辺 BC にひいた線 AD の図だね。(1) は記号、(2) は「距離」の問題だよ。",
      add: [
        P("A", A[0], A[1], "A", "n"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"), P("D", D[0], D[1], "D", "s"),
        seg("A", "B", { id: "ab" }), seg("A", "C", { id: "ac" }), seg("B", "C", { id: "bc" }), seg("A", "D", { id: "ad" }),
        rt("D", "A", "B", { s: 14 }),
      ],
    },
    {
      cap: "(1) D のところに、直角の印 **□** があるね。AD と BC は、D で**直角に交わっている**よ。",
      hl: ["ad", "bc"],
      eq: ["## (1)", "AD と BC は D で直角に交わる"],
    },
    {
      cap: "直角に交わる2本の線は**垂直**。垂直の記号は **⊥** だよ。",
      eq: ["「垂直」の記号 ＝ ⊥", "=> (1) AD ⊥ BC"],
    },
    {
      cap: "(2) 点と直線の**距離**は、点から直線に**垂線**をひいたときの、点から垂線の足までの長さだよ。",
      eqClear: true,
      hl: ["ad"],
      eq: ["## (2)", "点と直線の距離", "＝ 点から直線にひいた垂線の長さ"],
    },
    {
      cap: "点 A から直線 BC にひいた垂線は **AD**（AD ⊥ BC）。だから、距離を表す線分は AD だね。",
      add: [seg("A", "D", { id: "ad2", c: "a", w: 3.5 })],
      eq: ["垂線は AD（AD ⊥ BC）", "=> (2) 線分 AD"],
    },
    {
      cap: "なぜ垂線？ A から BC 上のほかの点へのばした線は、どれも**ななめ**で、AD より長いよ。",
      add: [seg("A", "E", { id: "ae", c: "p", dash: true }), P("E", E[0], E[1], "E", "s"), seg("A", "B", { c: "p", dash: true, id: "abp" }), seg("A", "C", { c: "p", dash: true, id: "acp" })],
      hl: ["ad2"],
      eq: ["## なぜ垂線？", "ななめの線（AB、AE、AC）は、AD より長い", "// 垂線 AD がいちばん短い道"],
    },
    {
      cap: "ひっかけ！ AB や AC は三角形の辺だけど、ななめだから**距離ではない**よ。「直角の印のある線」を選ぼう。",
      clear: true,
      add: [seg("A", "D", { c: "a", w: 3.5 }), rt("D", "A", "B", { s: 14, c: "a" })],
      eq: ["// AB、AC ✕　AD ○"],
    },
    {
      cap: "答えは、(1) **AD ⊥ BC**、(2) **線分 AD** だよ。",
      eqClear: true,
      eq: ["## 答え", "(1) AD ⊥ BC", "(2) 線分 AD"],
      fin: true,
    },
  ],
};
