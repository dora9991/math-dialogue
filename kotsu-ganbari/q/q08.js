// 問8：垂直二等分線の作図(1)、中点の作図(2)
import { P, seg, arc, rt, txt, geo, dirDeg } from "../dsl.js";

// 印刷物の△ABC（写真から読みとった形。(1)(2)は同じ形）
const s = 1.45;
const B = [70, 235];
const A = [B[0] + 154 * s, B[1] - 132 * s], C = [B[0] + 181 * s, B[1] - 9 * s];

// 線分XYの垂直二等分線の作図：半径 r（XYの半分より大きい）で、X・Y から円 → 交点 Q, R
function bis(X, Y, k) {
  const r = geo.dist(X, Y) * k;
  const [u, v] = geo.interCC(X, r, Y, r);
  const [Q, R] = u[1] < v[1] ? [u, v] : [v, u];          // Q：上のほう、R：下のほう
  return { r, Q, R, M: geo.interLL(Q, R, X, Y) };
}
const near = (c, r, p, o = {}) => arc(c, r, dirDeg(c, p) - 11, dirDeg(c, p) + 11, o);   // 交点のまわりだけの短い弧
const ext = (p, q, t = 0.09) => [geo.lerp(p, q, -t), geo.lerp(p, q, 1 + t)];            // 直線らしく、すこしのばす

const w1 = bis(A, C, 0.58);     // (1) 辺AC
const w2 = bis(B, C, 0.55);     // (2) 辺BC
const [l1a, l1b] = ext(w1.Q, w1.R), [l2a, l2b] = ext(w2.Q, w2.R);

export default {
  n: 8,
  title: "垂直二等分線と中点の作図",
  problem: "定規とコンパスを用いて、次のそれぞれの作図をしなさい。\n(1) △ABCの辺ACの垂直二等分線\n(2) △ABCの辺BCの中点P",
  answer: "(1) A、Cを中心に同じ半径の円をかき、2つの交点Q、Rを通る直線QR（辺ACの垂直二等分線）　(2) B、Cから同じようにして辺BCの垂直二等分線をひき、BCとの交点が中点P",
  view: [0, 15, 420, 320],
  steps: [
    {
      cap: "問題：△ABC で、(1) 辺ACの**垂直二等分線**と、(2) 辺BCの**中点P**を、定規とコンパスでかくよ。",
      add: [P("A", A[0], A[1], "A", "n"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"),
        seg("A", "B", { id: "sAB" }), seg("B", "C", { id: "sBC" }), seg("C", "A", { id: "sAC" })],
    },
    {
      cap: "**垂直二等分線**は、線分の**真ん中を通って、垂直に交わる線**。両はしの A、C から**等しい距離**にある点を、ずっとつないだ線でもあるよ。",
      hl: ["sAC"],
      eq: ["## (1) 辺ACの垂直二等分線", "// 線分の真ん中を通り、垂直に交わる線", "// A と C から等しい距離にある点の集まり"],
    },
    {
      cap: "**① 点Aを中心**に、ACの半分より大きい半径で円をかくよ。ACの**両がわの2か所**に、弧をかこう。",
      add: [near(A, w1.r, w1.Q, { id: "a1" }), near(A, w1.r, w1.R, { id: "a2" })],
      eq: ["## 手順", "① 点Aを中心に円（弧）"],
    },
    {
      cap: "**② 点Cを中心**に、①と**同じ半径**で円をかくよ。①の弧と2か所で交わるね。交点を Q、R とするよ。",
      add: [near(C, w1.r, w1.Q, { id: "c1" }), near(C, w1.r, w1.R, { id: "c2" }),
        P("Q", w1.Q[0], w1.Q[1], "Q", "e", { dx: 18, dy: 4 }), P("R", w1.R[0], w1.R[1], "R", "sw")],
      eq: ["② 点Cを中心に、同じ半径で円 → 交点Q, R"],
    },
    {
      cap: "**③ 2点Q、Rを通る直線**を、定規でひくよ。これが辺ACの垂直二等分線だよ！",
      add: [seg(l1a, l1b, { id: "ans1", c: "a", w: 3.2 })],
      eq: ["③ 直線QRをひく", "=> (1) 直線QR（ACの垂直二等分線）"],
    },
    {
      cap: "なぜ？ **AQ＝CQ＝AR＝CR**（どれも同じ半径）。Q、R は A と C から等しい距離だから、直線QRは垂直二等分線になるよ。",
      add: [seg("A", "Q", { id: "w1", c: "p", dash: true, tick: 1 }), seg("C", "Q", { id: "w2", c: "p", dash: true, tick: 1 }),
        seg("A", "R", { id: "w3", c: "p", dash: true, tick: 1 }), seg("C", "R", { id: "w4", c: "p", dash: true, tick: 1 })],
      eq: ["// AQ＝CQ、AR＝CR（同じ半径）", "// → Q、R は A、C から等しい距離"],
    },
    {
      cap: "QR と AC の交点を M とすると、M は ACの**真ん中**（AM＝MC）で、QR と AC は**垂直**に交わっているよ。",
      hide: ["w1", "w2", "w3", "w4"],
      add: [P("M", w1.M[0], w1.M[1], "M", "se", { c: "p" }),
        seg("A", "M", { c: "p", tick: 1, w: 2.6 }), seg("M", "C", { c: "p", tick: 1, w: 2.6 }),
        rt("M", "C", w1.Q, { c: "p", s: 12 })],
      eq: ["// AM＝MC（M は ACの中点）", "// QR ⊥ AC（垂直）"],
    },
    {
      cap: "(2) 辺BCの**中点P**は、BCを**2等分する点**だね。BCの垂直二等分線をひけば、BCとの交点が中点になるよ。",
      clear: true, eqClear: true,
      hl: ["sBC"],
      eq: ["## (2) 辺BCの中点P", "// BCの垂直二等分線とBCの交点が、中点"],
    },
    {
      cap: "**① 点Bを中心**に、BCの半分より大きい半径で円をかくよ。BCの**上と下の2か所**に、弧をかこう。",
      add: [near(B, w2.r, w2.Q, { id: "b1" }), near(B, w2.r, w2.R, { id: "b2" })],
      eq: ["① 点Bを中心に円（弧）"],
    },
    {
      cap: "**② 点Cを中心**に、①と**同じ半径**で円をかくよ。交点を Q、R とするよ。",
      add: [near(C, w2.r, w2.Q, { id: "d1" }), near(C, w2.r, w2.R, { id: "d2" }),
        P("Q", w2.Q[0], w2.Q[1], "Q", "ne"), P("R", w2.R[0], w2.R[1], "R", "se")],
      eq: ["② 点Cを中心に、同じ半径で円 → 交点Q, R"],
    },
    {
      cap: "**③ 2点Q、Rを通る直線**をひくよ。この直線とBCが交わる点が、**中点P**だよ！",
      add: [seg(l2a, l2b, { id: "ans2", c: "a", w: 3.2 }), P("P", w2.M[0], w2.M[1], "P", "se", { c: "a" })],
      eq: ["③ 直線QRをひく → BCとの交点がP", "=> (2) 直線QRとBCの交点P"],
    },
    {
      cap: "確かめ：QRは BC の垂直二等分線だから、**BP＝PC**で、BC と**垂直**。P は BC のちょうど真ん中だね。",
      add: [seg("B", "P", { c: "p", tick: 1, w: 2.6 }), seg("P", "C", { c: "p", tick: 1, w: 2.6 }),
        rt("P", "C", w2.Q, { c: "p", s: 12 })],
      eq: ["// BP＝PC、QR ⊥ BC"],
      fin: true,
    },
  ],
};
