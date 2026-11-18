// 問10：3点A, B, Cから等しい距離にある点Pの作図（2本の垂直二等分線の交点）
import { P, seg, arc, circ, txt, geo, dirDeg } from "../dsl.js";

// 印刷物の3点（写真から読みとった位置）
const s = 1.3, o = [1250, 924];
const m = (x, y) => [(x - o[0]) * s + 70, (y - o[1]) * s + 50];
const A = m(1318, 924), B = m(1250, 1072), C = m(1459, 1053);

// 線分XYの垂直二等分線の作図：X, Y から同じ半径 r の円 → 交点2つ（XYから距離 h のところ）
function bis(X, Y, h) {
  const r = Math.hypot(geo.dist(X, Y) / 2, h);
  const [u, v] = geo.interCC(X, r, Y, r);
  const [T, U] = u[1] < v[1] ? [u, v] : [v, u];        // T：上のほう、U：下のほう
  return { r, T, U, M: geo.mid(X, Y) };
}
const near = (c, r, p, o = {}) => arc(c, r, dirDeg(c, p) - 11, dirDeg(c, p) + 11, o);   // 交点のまわりだけの短い弧
const O = geo.circumcenter(A, B, C);                  // 答えの点P（2本の垂直二等分線の交点）
const h1 = 40, h2 = 95;
const w1 = bis(A, B, h1), w2 = bis(B, C, h2);
const unit = (p, q) => { const d = geo.dist(p, q); return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
// 直線らしく、両はしを少しのばした線分（from を通り、dir の向きに、t0〜t1）
const along = (p, dir, t0, t1) => [[p[0] + dir[0] * t0, p[1] + dir[1] * t0], [p[0] + dir[0] * t1, p[1] + dir[1] * t1]];
const n1 = unit(w1.M, O), n2 = unit(w2.M, O);
const [l1a, l1b] = along(w1.M, n1, -(h1 + 14), geo.dist(w1.M, O) + 8);   // ABの垂直二等分線
const [l2a, l2b] = along(w2.M, n2, -(h2 + 14), h2 + 14);   // BCの垂直二等分線
// 3つめ：ACの垂直二等分線
const mAC = geo.mid(A, C), n3 = unit(mAC, O), [l3a, l3b] = along(mAC, n3, -26, geo.dist(mAC, O) + 40);
const Rr = geo.dist(O, A);

export default {
  n: 10,
  title: "3点から等しい距離の点の作図",
  problem: "図の3点A，B，Cから等しい距離にある点Pを作図しなさい。",
  answer: "辺ABの垂直二等分線と辺BCの垂直二等分線をかき、その交点がP（PA＝PB＝PC）。",
  view: [0, 20, 420, 350],
  steps: [
    {
      cap: "問題：3点 A、B、C から**等しい距離**にある点Pを、定規とコンパスで作図するよ。",
      add: [P("A", A[0], A[1], "A", "n"), P("B", B[0], B[1], "B", "w"), P("C", C[0], C[1], "C", "e")],
    },
    {
      cap: "考え方：**2点から等しい距離にある点**は、その2点を結ぶ線分の**垂直二等分線の上**にあるよ。ABとBCで、2本ひこう。",
      add: [seg("A", "B", { c: "k", dash: true, id: "dAB" }), seg("B", "C", { c: "k", dash: true, id: "dBC" })],
      hl: ["dAB", "dBC"],
      eq: ["## 考え方", "// A、B から等しい距離 → ABの垂直二等分線の上", "// B、C から等しい距離 → BCの垂直二等分線の上"],
    },
    {
      cap: "まず ABの垂直二等分線。**① 点Aを中心**に、ABの半分より大きい半径で、ABの両がわに弧をかくよ。",
      add: [near(A, w1.r, w1.T, { id: "a1" }), near(A, w1.r, w1.U, { id: "a2" })],
      eq: ["## 手順", "① 点Aを中心に円（弧）"],
    },
    {
      cap: "**② 点Bを中心**に、①と**同じ半径**で弧をかくよ。2か所で交わるので、交点を Q、R とするよ。",
      add: [near(B, w1.r, w1.T, { id: "b1" }), near(B, w1.r, w1.U, { id: "b2" }),
        P("Q", w1.T[0], w1.T[1], "Q", "nw"), P("R", w1.U[0], w1.U[1], "R", "se")],
      eq: ["② 点Bを中心に、同じ半径で円 → 交点Q, R"],
    },
    {
      cap: "**③ 2点Q、Rを通る直線**を、定規でひくよ。これが ABの垂直二等分線だね。",
      add: [seg(l1a, l1b, { id: "bis1", w: 2.4 })],
      eq: ["③ 直線QRをひく（ABの垂直二等分線）"],
    },
    {
      cap: "つぎは BCの垂直二等分線。**④ 点Bを中心**に、BCの半分より大きい半径で、BCの上と下に弧をかくよ。",
      add: [near(B, w2.r, w2.T, { id: "b3" }), near(B, w2.r, w2.U, { id: "b4" })],
      eq: ["④ 点Bを中心に円（弧）"],
    },
    {
      cap: "**⑤ 点Cを中心**に、④と**同じ半径**で弧をかくよ。交点を S、T とするよ。",
      add: [near(C, w2.r, w2.T, { id: "c1" }), near(C, w2.r, w2.U, { id: "c2" }),
        P("S", w2.T[0], w2.T[1], "S", "e", { dx: 24, dy: 2 }), P("T", w2.U[0], w2.U[1], "T", "e", { dx: 24, dy: 4 })],
      eq: ["⑤ 点Cを中心に、同じ半径で円 → 交点S, T"],
    },
    {
      cap: "**⑥ 2点S、Tを通る直線**をひくよ。これが BCの垂直二等分線。2本の直線が交わったね。",
      add: [seg(l2a, l2b, { id: "bis2", w: 2.4 })],
      eq: ["⑥ 直線STをひく（BCの垂直二等分線）"],
    },
    {
      cap: "**⑦ 2本の直線の交点**が、求める点Pだよ！",
      add: [P("P", O[0], O[1], "P", "se", { c: "a" })],
      eq: ["⑦ 2本の直線の交点が P", "=> 点P ＝ 2本の垂直二等分線の交点"],
      fin: true,
    },
    {
      cap: "なぜ？ P は ABの垂直二等分線の上だから **PA＝PB**。BCの垂直二等分線の上だから **PB＝PC**。よって **PA＝PB＝PC**！",
      hide: ["a1", "a2", "b1", "b2", "b3", "b4", "c1", "c2", "Q", "R", "S", "T"],
      add: [seg("P", "A", { c: "p", dash: true, tick: 1 }), seg("P", "B", { c: "p", dash: true, tick: 1 }), seg("P", "C", { c: "p", dash: true, tick: 1 })],
      eq: ["// P は AB の垂直二等分線の上 → PA＝PB", "// P は BC の垂直二等分線の上 → PB＝PC", "// よって PA＝PB＝PC"],
    },
    {
      cap: "確かめ：残りの辺ACの垂直二等分線も、ちゃんと**Pを通る**よ。3本とも1点で交わるんだ。",
      add: [seg(l3a, l3b, { id: "bis3", c: "p", dash: true, w: 2 })],
      eq: ["// ACの垂直二等分線も P を通る"],
    },
    {
      cap: "Pを中心に、半径PAの円をかくと、**A、B、C をぜんぶ通る**よ。Pは3点から等しい距離にあるんだね。",
      hide: ["bis3"],
      add: [circ("P", Rr, { c: "p", dash: true, w: 2 })],
      eq: ["// 中心P、半径PAの円が A、B、C を通る"],
    },
  ],
};
