// 問11：辺AC上で、2辺AB, BCから等しい距離にある点Pの作図（∠Bの二等分線とACの交点）
import { P, seg, arc, ang, rt, geo, polar, dirDeg } from "../dsl.js";

// 印刷物の△ABC（写真から読みとった形。BCは水平）
const s = 1.5;
const B = [55, 265];
const A = [B[0] + (1329 - 1258) * s, B[1] - (1362 - 1223) * s], C = [B[0] + (1460 - 1258) * s, B[1] + (1363 - 1362) * s];

// ∠Bの二等分線の作図
const dA = dirDeg(B, A), dC = dirDeg(B, C);
const r1 = 85;                                                  // ① Bを中心にした円の半径
const D = polar(B, r1, dA), E = polar(B, r1, dC);              // 辺BA、辺BC上の点
const r2 = geo.dist(D, E) / 2 + 22;                             // ②③ D, E を中心にした同じ半径（DEの半分より大きい）
const [f1, f2] = geo.interCC(D, r2, E, r2);
const F = geo.dist(f1, B) > geo.dist(f2, B) ? f1 : f2;          // 角の内側の交点
const Pp = geo.interLL(B, F, A, C);                             // 答え：BFとACの交点
const H = geo.foot(Pp, A, B), K = geo.foot(Pp, B, C);           // Pから AB、BC への垂線の足

export default {
  n: 11,
  title: "2辺から等しい距離の点の作図",
  problem: "図の△ABCにおいて、辺AC上の点で、2辺AB，BCから等しい距離にある点Pを作図しなさい。",
  answer: "∠Bの二等分線をかき、辺ACとの交点をPとする。",
  view: [0, 25, 400, 270],
  steps: [
    {
      cap: "問題：辺AC上の点で、2辺AB、BC から**等しい距離**にある点Pを、定規とコンパスで作図するよ。",
      add: [P("A", A[0], A[1], "A", "n"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"),
        seg("A", "B", { id: "sAB" }), seg("B", "C", { id: "sBC" }), seg("C", "A", { id: "sAC" })],
    },
    {
      cap: "考え方：2辺 AB、BC から**等しい距離**にある点は、∠B の**二等分線の上**にあるよ。その線が辺ACと交わる点がPだね。",
      hl: ["sAB", "sBC"],
      eq: ["## 考え方", "// 2辺から等しい距離にある点", "// ＝ 角の二等分線の上の点", "// → ∠B の二等分線と辺AC の交点がP"],
    },
    {
      cap: "∠B の二等分線をかくよ。**① 点Bを中心**に円をかいて、辺BA、辺BCと交わる点を、D、E とするよ。",
      add: [arc("B", r1, dC - 6, dA + 6, { id: "c1" }), P("D", D[0], D[1], "D", "w"), P("E", E[0], E[1], "E", "s")],
      hl: ["c1"],
      eq: ["## 手順", "① 点Bを中心に円 → D, E"],
    },
    {
      cap: "**② 点Dを中心**にして、円をかくよ。半径は、DEの半分より大きければOK。",
      add: [arc("D", r2, dirDeg(D, F) - 18, dirDeg(D, F) + 18, { id: "c2" })],
      eq: ["② 点Dを中心に円"],
    },
    {
      cap: "**③ 点Eを中心**にして、②と**同じ半径**で円をかくよ。②の円と交わる点を F とするよ。",
      add: [arc("E", r2, dirDeg(E, F) - 18, dirDeg(E, F) + 18, { id: "c3" }), P("F", F[0], F[1], "F", "nw", { dx: -6, dy: -10 })],
      eq: ["③ 点Eを中心に、同じ半径で円 → 交点F"],
    },
    {
      cap: "**④ 点Bと点Fを通る直線**を、定規でひくよ。辺ACと交わる点が、求める**点P**だよ！",
      add: [seg("B", Pp, { id: "ans", c: "a", w: 3.2 }), P("P", Pp[0], Pp[1], "P", "ne", { c: "a" })],
      eq: ["④ 直線BFをひく → 辺ACとの交点がP", "=> 点P ＝ ∠Bの二等分線と辺ACの交点"],
      fin: true,
    },
    {
      cap: "BP は ∠B を**半分**に分けているね（∠ABP＝∠PBC）。だから BP は、∠B の**二等分線**になっているよ。",
      add: [ang("B", "A", "P", { r: 40, m: 1, c: "p" }), ang("B", "P", "C", { r: 40, m: 1, c: "p" })],
      eq: ["// ∠ABP＝∠PBC"],
    },
    {
      cap: "確かめ：点から辺までの距離は、辺への**垂線の長さ**。Pから AB、BC に垂線 PH、PK をひくと、**PH＝PK** になるよ。",
      add: [seg("P", "H", { c: "p", dash: true, tick: 1 }), seg("P", "K", { c: "p", dash: true, tick: 1 }),
        P("H", H[0], H[1], "H", "nw", { c: "p" }), P("K", K[0], K[1], "K", "s", { c: "p" }),
        rt("H", "P", "B", { c: "p", s: 12 }), rt("K", "P", "C", { c: "p", s: 12 })],
      eq: ["// PH ⊥ AB、PK ⊥ BC", "// PH＝PK（角の二等分線の上の点は、2辺から等しい距離）"],
    },
  ],
};
