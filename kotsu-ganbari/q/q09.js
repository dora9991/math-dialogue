// 問9：∠AOB の二等分線の作図（作図の見本）
import { P, seg, line, arc, ang, txt, geo, polar, dirDeg } from "../dsl.js";

const O = [70, 240], A = [310, 70], B = [330, 240];
const r1 = 90;                                    // 最初のコンパスの半径
const dA = dirDeg(O, A), dB = dirDeg(O, B);       // 辺 OA, OB の向き
const Pp = polar(O, r1, dA), Q = polar(O, r1, dB);   // OA, OB 上の点
const rr = 110;                                   // 2つめの半径（P, Q から）
const [X1, X2] = geo.interCC(Pp, rr, Q, rr);      // 2つの円の交点
const R = X1[1] < X2[1] ? X1 : X2;                // 角の内側の交点（上側）
const aMid = geo.bisectDir(O, A, B);              // 二等分線の向き

export default {
  n: 9,
  title: "角の二等分線の作図",
  problem: "次の図の ∠AOB の二等分線を、定規とコンパスを用いて作図しなさい。",
  answer: "点Oと、2つの円の交点Rを通る直線OR（半直線）が、∠AOBの二等分線。",
  view: [0, 20, 400, 250],
  steps: [
    {
      cap: "問題：∠AOB の**二等分線**（角を半分に分ける線）を、定規とコンパスでかくよ。",
      add: [P("O", O[0], O[1], "O", "sw"), P("A", A[0], A[1], "A", "ne"), P("B", B[0], B[1], "B", "se"), seg("O", "A"), seg("O", "B")],
    },
    {
      cap: "**① 点Oを中心**に円をかいて、辺OA、辺OBと交わる点を、それぞれ P、Q とするよ。",
      add: [arc("O", r1, dB - 12, dA + 12, { id: "c1" }), P("P", Pp[0], Pp[1], "P", "n"), P("Q", Q[0], Q[1], "Q", "se")],
      hl: ["c1"],
      eq: ["## 手順", "① 点Oを中心に円 → P, Q"],
    },
    {
      cap: "**② 点Pを中心**にして、円をかくよ。半径は、PQの半分より大きければOK。",
      add: [arc("P", rr, dirDeg(Pp, R) - 35, dirDeg(Pp, R) + 35, { id: "c2" })],
      eq: ["② 点Pを中心に円"],
    },
    {
      cap: "**③ 点Qを中心**にして、②と**同じ半径**で円をかくよ。②の円と交わるね。その交点を R とするよ。",
      add: [arc("Q", rr, dirDeg(Q, R) - 35, dirDeg(Q, R) + 35, { id: "c3" }), P("R", R[0], R[1], "R", "n")],
      eq: ["③ 点Qを中心に、同じ半径で円 → 交点R"],
    },
    {
      cap: "**④ 点Oと点Rを通る直線**を、定規でひくよ。これが答え！",
      add: [seg("O", "R", { id: "ans", c: "a", w: 3.2 })],
      eq: ["④ 直線OR をひく", "=> 直線OR が ∠AOB の二等分線"],
      fin: true,
    },
    {
      cap: "なぜ半分になるの？ **OP＝OQ、PR＝QR、ORは共通**だから、△OPR と △OQR は合同。だから ∠POR＝∠QOR だね。",
      add: [seg("P", "R", { c: "p", dash: true }), seg("Q", "R", { c: "p", dash: true }), ang("O", "A", "R", { r: 40, m: 1, c: "p" }), ang("O", "R", "B", { r: 40, m: 1, c: "p" })],
      eq: ["// OP＝OQ（同じ円の半径）", "// PR＝QR（同じ半径でかいた）", "// OR は共通", "// → 3辺が等しいので合同"],
    },
  ],
};
