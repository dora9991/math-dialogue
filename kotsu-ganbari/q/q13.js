// 問13：長方形を折って A が C に重なる → 折り目 EF ＝ 線分 AC の垂直二等分線
import { P, seg, line, poly, arc, ang, rt, arrow, txt, geo, polar, dirDeg } from "../dsl.js";

// ── 長方形（印刷物の図は、横：たて ≒ 3.2 : 1。A が左上、B が左下、C が右下、D が右上）
const W = 450, H = 142;
const A = [40, 80], B = [40, 80 + H], C = [40 + W, 80 + H], D = [40 + W, 80];
const M = geo.mid(A, C);                          // AC の真ん中

// ── 作図：A と C から同じ半径 r の円 → 交点 P（上）, Q（下）
const r = 255;                                    // AC の半分（約236）より大きい
const [X1, X2] = geo.interCC(A, r, C, r);
const Pp = X1[1] < X2[1] ? X1 : X2, Qq = X1[1] < X2[1] ? X2 : X1;
// 直線 PQ と、辺 AD・辺 BC の交点が E, F
const E = geo.interLL(Pp, Qq, A, D), F = geo.interLL(Pp, Qq, B, C);
const Bp = geo.reflect(B, E, F);                  // 折ると B がうつる点 B′

// 2点 p, q を通る、中心 c・半径 r の円のうち、p から q までの弧（すこし余分に）
function arcThru(c, rad, p, q, m = 5) {
  const a1 = dirDeg(c, p), a2 = dirDeg(c, q);
  const d = (((a2 - a1) % 360) + 360) % 360;
  return d <= 180 ? [a1 - m, a1 + d + m] : [a2 - m, a2 + (360 - d) + m];
}
const [aF1, aT1] = arcThru(A, r, Qq, Pp), [aF2, aT2] = arcThru(C, r, Pp, Qq);

// 折りたたみのとちゅう：折り目 EF から見て、距離を k 倍（k＝1 で折る前、k＝−1 で折ったあと）
const fold = (p, k) => { const h = geo.foot(p, E, F); return [h[0] + k * (p[0] - h[0]), h[1] + k * (p[1] - h[1])]; };
const flap = (k) => [fold(A, k), E, F, fold(B, k)];

export default {
  n: 13,
  title: "折り目の作図（A が C に重なる）",
  problem: "図のような長方形 ABCD があります。辺 AD 上に E、辺 BC 上に F をとって、線分 EF を折り目として頂点 A が頂点 C と重なるように折るとき、折り目となる線分 EF を作図しなさい。",
  answer: "折り目 EF は、線分 AC の垂直二等分線。A, C を中心に同じ半径（AC の半分より大きい）の円をかき、その2つの交点 P, Q を通る直線と、辺 AD・辺 BC との交点を E, F として、線分 EF をひく。",
  view: [0, 25, 540, 345],
  steps: [
    {
      cap: "問題：長方形を折って、頂点 A を頂点 C に**ぴったり重ねたい**。そのときの**折り目 EF** を、定規とコンパスでかくよ。",
      add: [P("A", A[0], A[1], "A", "nw"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"), P("D", D[0], D[1], "D", "ne"), poly(["A", "B", "C", "D"])],
    },
    {
      cap: "考えてみよう。折って A が C に重なるなら、**A と C は、折り目をはさんで向かい合う点**だね。",
      add: [seg("A", "C", { id: "ac", dash: true, c: "p", w: 2.4 })],
      hl: ["ac"],
      eq: ["## 考え方", "A と C が重なる", "→ A と C は折り目の両がわにある"],
    },
    {
      cap: "折り目は、A と C の**ちょうど真ん中**を、**直角**に通るよ。つまり折り目 EF は、線分 AC の**垂直二等分線**！",
      eq: ["折り目 EF ＝ 線分 AC の", "{{垂直二等分線}}", "// 真ん中を、直角に通る直線"],
    },
    {
      cap: "**① 点 A を中心**に円（弧）をかくよ。半径は、AC の半分より**大きく**しておこう。",
      add: [arc("A", r, aF1, aT1, { id: "c1" })],
      hl: ["c1"],
      eq: ["## 手順", "① A を中心に円（弧）"],
    },
    {
      cap: "**② 点 C を中心**に、①と**同じ半径**で円（弧）をかくよ。①と、上と下の2か所で交わるね。交点を P, Q とするよ。",
      add: [arc("C", r, aF2, aT2, { id: "c2" }), P("P", Pp[0], Pp[1], "P", "ne"), P("Q", Qq[0], Qq[1], "Q", "se")],
      eq: ["② C を中心に、同じ半径で円", "　 → 交点 P, Q"],
    },
    {
      cap: "**③ 2点 P, Q を通る直線**を、定規でひくよ。辺 AD と交わる点が **E**、辺 BC と交わる点が **F** だね。",
      add: [seg("P", "Q", { id: "pq" }), P("E", E[0], E[1], "E", "sw", { dx: -10, dy: 16 }), P("F", F[0], F[1], "F", "se")],
      eq: ["③ 直線 PQ をひく", "　 → 辺 AD との交点 E、辺 BC との交点 F"],
    },
    {
      cap: "辺 AD と辺 BC のあいだの**線分 EF** が、折り目だよ！",
      add: [seg("E", "F", { id: "ans", c: "a", w: 3.4 })],
      hl: ["ans"],
      eq: ["=> 折り目 EF ＝ AC の垂直二等分線"],
      fin: true,
    },
    {
      cap: "なぜ正しい？ **AP＝CP**（同じ半径）。Q も同じで AQ＝CQ。P, Q は A, C から等しい距離だから、直線 PQ は AC の**垂直二等分線**だよ。",
      add: [
        seg("A", "P", { id: "w1", dash: true, c: "p", tick: 1 }), seg("C", "P", { id: "w2", dash: true, c: "p", tick: 1 }),
        P("M", M[0], M[1], "M", "se", { dx: 6, dy: 20 }), rt("M", "C", "E", { c: "p" }),
      ],
      eq: ["// AP＝CP、AQ＝CQ（同じ半径）", "// → P, Q は A, C から等しい距離", "// → 直線 PQ は AC の垂直二等分線", "// AC と直角に交わり、AM＝MC"],
    },
    {
      cap: "ほんとうに重なるか、折ってみよう。EF の**左がわ**（A がある側）を、EF で折り返すよ。",
      hide: ["w1", "w2", "ac"],
      add: [poly(flap(1), { id: "f1", c: "y", fill: "y" })],
      hl: ["f1"],
      eq: ["## 折ってみる"],
    },
    {
      cap: "EF を軸にして、パタン…と折っていくよ。",
      hide: ["f1"],
      add: [poly(flap(0.45), { id: "f2", c: "y", fill: "y" }), P("a2", fold(A, 0.45)[0], fold(A, 0.45)[1], "A", "nw")],
      dur: 1500,
    },
    {
      cap: "もうすこし…。",
      hide: ["f2", "a2"],
      add: [poly(flap(-0.45), { id: "f3", c: "y", fill: "y" }), P("a3", fold(A, -0.45)[0], fold(A, -0.45)[1], "A", "nw")],
      dur: 1500,
    },
    {
      cap: "A が **C にぴったり重なった**！ B は B′ にうつるよ。折り目が、ちゃんとできているね。",
      hide: ["f3", "a3"],
      add: [poly(flap(-1), { id: "f4", c: "y", fill: "y" }), P("Bp", Bp[0], Bp[1], "B′", "s"), P("a4", C[0], C[1], "A", "ne", { dx: 12, dy: -2 })],
      eq: ["// A は C に重なる", "// → 折り目 EF は正しい"],
    },
    {
      cap: "**ひっかけ注意！** ①②の半径は**同じ**にして、AC の**半分より大きく**しよう。小さいと、円が交わらないよ。",
      eq: ["## 注意", "{{同じ半径}}、AC の半分より大きく"],
    },
  ],
};
