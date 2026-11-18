// 問14：長方形を AP で折って D が辺 BC 上にくる → AP は DD′ の垂直二等分線。P ＝ その直線と辺 CD の交点
import { P, seg, line, poly, arc, ang, rt, arrow, txt, geo, polar, dirDeg } from "../dsl.js";

// ── 長方形（印刷物の図は、横：たて ≒ 1.8 : 1。A が左上、B が左下、C が右下、D が右上）
const W = 360, H = 201;
const A = [50, 60], B = [50, 60 + H], C = [50 + W, 60 + H], D = [50 + W, 60];

// ── ① A を中心に、半径 AD の円 → 辺 BC との交点 D′
const Dp = geo.interLC(B, C, A, W).find((p) => p[0] > B[0] && p[0] < C[0]);   // BC 上（B と C のあいだ）
// ── ②③ D と D′ から同じ半径 rr の円 → 交点 Q（辺のなか）, R（辺のそと）
const rr = 130;                                   // DD′ の半分（約105）より大きい
const [X1, X2] = geo.interCC(D, rr, Dp, rr);
const Q = X1[0] < X2[0] ? X1 : X2, R = X1[0] < X2[0] ? X2 : X1;
// ── ④ 直線 QR と辺 CD の交点が P
const Pt = geo.interLL(Q, R, D, C);

// 2点 p, q を通る、中心 c の円の弧（p から q まで、すこし余分に）
function arcThru(c, p, q, m = 4) {
  const a1 = dirDeg(c, p), a2 = dirDeg(c, q);
  const d = (((a2 - a1) % 360) + 360) % 360;
  return d <= 180 ? [a1 - m, a1 + d + m] : [a2 - m, a2 + (360 - d) + m];
}
const [aF1, aT1] = arcThru(A, Dp, D, 3);          // 円A：D′ から D まで
const [aF2, aT2] = arcThru(D, Q, R);              // 円D：Q から R まで
const [aF3, aT3] = arcThru(Dp, R, Q);             // 円D′：R から Q まで

// 折りたたみのとちゅう：折り目 AP から見て、距離を k 倍（k＝1 で折る前、k＝−1 で折ったあと）
const fold = (p, k) => { const h = geo.foot(p, A, Pt); return [h[0] + k * (p[0] - h[0]), h[1] + k * (p[1] - h[1])]; };
const flap = (k) => [A, Pt, fold(D, k)];

export default {
  n: 14,
  title: "折り返してできる点Pの作図",
  problem: "長方形 ABCD の辺 CD 上に点 P をとり、線分 AP を折り目として頂点 D が辺 BC 上にくるように折り返したい。点 P の位置を作図しなさい。",
  answer: "A を中心に半径 AD の円をかいて、辺 BC との交点を D′ とする。線分 DD′ の垂直二等分線（A を通る）をかき、辺 CD との交点が P。",
  view: [0, 20, 520, 300],
  steps: [
    {
      cap: "問題：長方形の紙を、線分 AP を折り目にして、**頂点 D が辺 BC の上にくる**ように折り返すよ。点 P を作図しよう。",
      add: [P("A", A[0], A[1], "A", "nw"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"), P("D", D[0], D[1], "D", "ne"), poly(["A", "B", "C", "D"])],
    },
    {
      cap: "折り返した D が、辺 BC 上の点 **D′** にきたとしよう。D と D′ は、**折り目 AP をはさんで向かい合う点**だね。",
      eq: ["## 考え方", "D が D′（辺 BC 上）に重なる", "→ 折り目 AP ＝ 線分 DD′ の{{垂直二等分線}}"],
    },
    {
      cap: "では D′ はどこ？ 折っても長さは変わらないから **AD′＝AD**。D′ は、**A を中心に半径 AD の円**と辺 BC の交点だよ。",
      eq: ["AD′ ＝ AD（折っても同じ長さ）", "→ D′ は「A 中心・半径 AD の円」上"],
    },
    {
      cap: "**① 点 A を中心**に、**半径 AD** の円（弧）をかくよ。辺 BC と交わる点が **D′** だね。",
      add: [arc("A", W, aF1, aT1, { id: "c1" }), P("Dp", Dp[0], Dp[1], "D′", "se")],
      hl: ["c1"],
      eq: ["## 手順", "① A を中心に、半径 AD の円", "　 → 辺 BC との交点 D′"],
    },
    {
      cap: "あとは、線分 DD′ の**垂直二等分線**だよ。**② 点 D を中心**に円（弧）をかく。半径は DD′ の半分より大きく。",
      add: [seg("D", "Dp", { id: "dd", dash: true, c: "p", w: 2.2 }), arc("D", rr, aF2, aT2, { id: "c2" })],
      eq: ["② D を中心に円（弧）"],
    },
    {
      cap: "**③ 点 D′ を中心**に、②と**同じ半径**で円（弧）をかくよ。②と交わる2点を Q, R とするよ。",
      add: [arc("Dp", rr, aF3, aT3, { id: "c3" }), P("Q", Q[0], Q[1], "Q", "n"), P("R", R[0], R[1], "R", "se")],
      eq: ["③ D′ を中心に、同じ半径で円", "　 → 交点 Q, R"],
    },
    {
      cap: "**④ 2点 Q, R を通る直線**をひくよ。これが DD′ の垂直二等分線。辺 CD と交わる点が **P** だね。",
      add: [line("Q", "R", { id: "qr" }), P("P", Pt[0], Pt[1], "P", "nw", { c: "a", r: 4.5 })],
      eq: ["④ 直線 QR をひく", "　 → 辺 CD との交点 P"],
    },
    {
      cap: "**点 P が答え**。折り目は線分 AP だよ。直線 QR は、ちゃんと **A も通っている**ね。",
      add: [seg("A", "P", { id: "ans", c: "a", w: 3.4 })],
      hl: ["ans"],
      eq: ["=> 点 P ＝ 直線 QR と辺 CD の交点"],
      fin: true,
    },
    {
      cap: "なぜ A を通る？ **AD＝AD′** だから、△ADD′ は二等辺三角形。頂点 A は、底辺 DD′ の**垂直二等分線の上**にあるんだよ。",
      add: [seg("A", "Dp", { id: "w1", dash: true, c: "p", tick: 1 }), seg("A", "D", { id: "w2", dash: true, c: "p", tick: 1 })],
      eq: ["// AD＝AD′ → △ADD′ は二等辺三角形", "// 頂点 A は DD′ の垂直二等分線上", "// → AP は ∠DAD′ の二等分線でもある"],
    },
    {
      cap: "ほんとうに折ってみよう。**△ADP** を、AP を折り目にして折り返すよ。",
      hide: ["w1", "w2", "dd"],
      add: [poly(flap(1), { id: "f1", c: "y", fill: "y" })],
      hl: ["f1"],
      eq: ["## 折ってみる"],
    },
    {
      cap: "AP を軸にして、パタン…と折っていくよ。",
      hide: ["f1"],
      add: [poly(flap(0.4), { id: "f2", c: "y", fill: "y" }), P("d2", fold(D, 0.4)[0], fold(D, 0.4)[1], "D", "ne")],
      dur: 1500,
    },
    {
      cap: "もうすこし…。",
      hide: ["f2", "d2"],
      add: [poly(flap(-0.4), { id: "f3", c: "y", fill: "y" }), P("d3", fold(D, -0.4)[0], fold(D, -0.4)[1], "D", "n")],
      dur: 1500,
    },
    {
      cap: "D が **辺 BC 上の D′ にぴったり重なった**！ 点 P の位置は、これで正しいね。",
      hide: ["f3", "d3"],
      add: [poly(flap(-1), { id: "f4", c: "y", fill: "y" }), rt("Dp", "A", "P", { c: "p" })],
      eq: ["// D は D′ に重なる", "// → 点 P は正しい"],
    },
    {
      cap: "**注意！** D′ が辺 BC 上にできるのは、**AD が AB より長い**とき。この長方形は、AD のほうが長いから大丈夫だよ。",
      eq: ["## 注意", "AD ＞ AB のとき、D′ は BC 上にできる"],
    },
  ],
};
