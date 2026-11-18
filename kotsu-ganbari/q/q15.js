// 問15：三角形 ABC の3辺に接する円の中心 I（内心）＝ 角の二等分線の交点
import { P, seg, line, poly, arc, circ, ang, rt, arrow, txt, geo, polar, dirDeg } from "../dsl.js";

// ── 三角形（印刷物の図：A が上、B が左下、C が右。AB 短め、BC 長め）
const B = [40, 300], A = [155, 58], C = [429, 231];

// 2点 p, q を通る、中心 c の円の弧（p から q まで、すこし余分に）
function arcThru(c, p, q, m = 6) {
  const a1 = dirDeg(c, p), a2 = dirDeg(c, q);
  const d = (((a2 - a1) % 360) + 360) % 360;
  return d <= 180 ? [a1 - m, a1 + d + m] : [a2 - m, a2 + (360 - d) + m];
}
// 中心 c の円で、点 p のまわりの短い弧（±span 度）
const around = (c, p, span = 26) => [dirDeg(c, p) - span, dirDeg(c, p) + span];
// 角 ∠(from)-at-(to) の二等分線の作図：at を中心の円 → 辺との交点 X, Y、X・Y から同じ半径の円 → 交点 Z（角の内側）
function bisector(at, from, to, r1, r2) {
  const X = polar(at, r1, dirDeg(at, from)), Y = polar(at, r1, dirDeg(at, to));
  const [Z1, Z2] = geo.interCC(X, r2, Y, r2);
  const Z = geo.dist(at, Z1) > geo.dist(at, Z2) ? Z1 : Z2;     // at から遠いほう（三角形の内側）
  return { X, Y, Z };
}
const bA = bisector(A, B, C, 85, 75);             // ∠A：P（AB 上）, Q（AC 上）, R
const bB = bisector(B, A, C, 100, 70);            // ∠B：S（BA 上）, T（BC 上）, U
const Pp = bA.X, Qq = bA.Y, Rr = bA.Z, Ss = bB.X, Tt = bB.Y, Uu = bB.Z;
const I = geo.interLL(A, Rr, B, Uu);              // 2本の二等分線の交点
const footA = geo.interLL(A, Rr, B, C);           // A の二等分線が BC と交わる点
const footB = geo.interLL(B, Uu, A, C);           // B の二等分線が AC と交わる点
const footC = geo.interLL(C, I, A, B);            // C の二等分線が AB と交わる点（確かめ用）
// I から3辺におろした垂線の足（接点）
const Dd = geo.foot(I, B, C), Ee = geo.foot(I, C, A), Ff = geo.foot(I, A, B);
const rad = geo.dist(I, Dd);                      // 内接円の半径

export default {
  n: 15,
  title: "3辺に接する円の中心（内心）",
  problem: "図の三角形 ABC の3つの辺すべてに接する円の中心 I を作図しなさい。",
  answer: "中心 I は、三角形の2つの角（たとえば ∠A と ∠B）の二等分線の交点。（∠C の二等分線も I を通る。）",
  view: [0, 20, 480, 315],
  steps: [
    {
      cap: "問題：三角形 ABC の**3つの辺すべてに接する円**の中心 I を、定規とコンパスで作図するよ。",
      add: [P("A", A[0], A[1], "A", "n"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "e"), poly(["A", "B", "C"])],
    },
    {
      cap: "辺に接する円の中心は、**3つの辺から等しい距離**にあるよ。そんな点 I を探せばいいんだね。",
      eq: ["## 考え方", "中心 I は、3つの辺から{{等しい距離}}"],
    },
    {
      cap: "ここがポイント！ **角の二等分線の上の点**は、その角の2辺から**等しい距離**にあるんだ。だから I は、**角の二等分線の交点**だよ。",
      eq: ["角の二等分線上の点", "→ 角の2辺から等しい距離", "// だから I は、二等分線どうしの交点"],
    },
    {
      cap: "まず ∠A の二等分線。**① 点 A を中心**に円（弧）をかいて、辺 AB, AC との交点を **P, Q** とするよ。",
      add: [arc("A", 85, ...arcThru(A, Pp, Qq), { id: "a1" }), P("P", Pp[0], Pp[1], "P", "w"), P("Q", Qq[0], Qq[1], "Q", "ne")],
      hl: ["a1"],
      eq: ["## ∠A の二等分線", "① A を中心に円 → P, Q"],
    },
    {
      cap: "**② 点 P, 点 Q を中心**に、**同じ半径**で円（弧）をかくよ。交わる点を **R** とするよ。",
      add: [arc("P", 75, ...around(Pp, Rr), { id: "a2" }), arc("Q", 75, ...around(Qq, Rr), { id: "a3" }), P("R", Rr[0], Rr[1], "R", "se")],
      eq: ["② P, Q を中心に、同じ半径で円", "　 → 交点 R"],
    },
    {
      cap: "**③ 点 A と点 R を通る直線**をひくよ。これが ∠A の二等分線だね。",
      add: [seg("A", footA, { id: "la" })],
      hl: ["la"],
      eq: ["③ 直線 AR をひく"],
    },
    {
      cap: "次は ∠B の二等分線。**④ 点 B を中心**に円（弧）をかいて、辺 BA, BC との交点を **S, T** とするよ。",
      add: [arc("B", 100, ...arcThru(B, Ss, Tt), { id: "b1" }), P("S", Ss[0], Ss[1], "S", "w"), P("T", Tt[0], Tt[1], "T", "s")],
      hl: ["b1"],
      eq: ["## ∠B の二等分線", "④ B を中心に円 → S, T"],
    },
    {
      cap: "**⑤ 点 S, 点 T を中心**に、同じ半径で円（弧）をかいて、交わる点を **U** とするよ。",
      add: [arc("S", 70, ...around(Ss, Uu), { id: "b2" }), arc("T", 70, ...around(Tt, Uu), { id: "b3" }), P("U", Uu[0], Uu[1], "U", "ne")],
      eq: ["⑤ S, T を中心に、同じ半径で円", "　 → 交点 U"],
    },
    {
      cap: "**⑥ 点 B と点 U を通る直線**をひくよ。さっきの直線 AR と交わる点が、**中心 I** だ！",
      add: [seg("B", footB, { id: "lb" }), P("I", I[0], I[1], "I", "n", { c: "a", r: 4.8 })],
      hl: ["lb"],
      eq: ["⑥ 直線 BU をひく", "=> I ＝ 直線 AR と直線 BU の交点"],
      fin: true,
    },
    {
      cap: "2本で I が決まるよ。**3つめの ∠C の二等分線**も、ちゃんと I を通るか確かめてみよう。",
      add: [seg("C", footC, { id: "lc", c: "p", dash: true, w: 2.2 })],
      hl: ["lc"],
      eq: ["## 確かめ", "∠C の二等分線も I を通る"],
    },
    {
      cap: "なぜ I が中心？ I から3辺へ垂線をおろすと、**3つの長さは等しい**よ。（角の二等分線上の点だから）",
      add: [
        seg("I", Dd, { id: "d1", c: "p", tick: 1 }), seg("I", Ee, { id: "d2", c: "p", tick: 1 }), seg("I", Ff, { id: "d3", c: "p", tick: 1 }),
        P("D", Dd[0], Dd[1], "D", "s", { c: "p" }), P("E", Ee[0], Ee[1], "E", "ne", { c: "p" }), P("F", Ff[0], Ff[1], "F", "w", { c: "p" }),
        rt("D", "I", "C", { c: "p" }), rt("E", "I", "A", { c: "p" }), rt("F", "I", "A", { c: "p" }),
      ],
      eq: ["// I から3辺までの距離が等しい", "// ID ＝ IE ＝ IF"],
    },
    {
      cap: "この長さを**半径**にして、I を中心に円をかくと、3辺に**ぴったり接する**円ができるよ。",
      add: [arc("I", rad, 0, 360, { id: "inc", c: "p" })],
      hl: ["inc"],
      eq: ["// I 中心・半径 ID の円は", "// 3辺に接する"],
    },
    {
      cap: "**注意！** 角の二等分線の交点が I。辺の**垂直二等分線**の交点は、ちがう点（外心）だよ。まちがえないでね。",
      eq: ["## 注意", "3辺に接する円の中心 ＝ {{角の二等分線}}の交点"],
    },
  ],
};
