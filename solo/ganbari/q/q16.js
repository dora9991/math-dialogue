// 問16：円の接線の性質（(1) 垂直）と、円周上の点 A における接線 ℓ の作図（A を通る OA の垂線）
import { P, seg, line, poly, arc, circ, ang, rt, arrow, txt, geo, polar, dirDeg } from "../dsl.js";

// ── 円 O と点 A（印刷物の図：A は円周の右上、O は円の中心。O の名前は点の左）
const O = [195, 200], r = 115, aDeg = 48;
const A = polar(O, r, aDeg);
const u = geo.mul(geo.sub(A, O), 1 / geo.dist(O, A));       // O → A の向きの単位ベクトル
const at = (p, k, v) => [p[0] + k * v[0], p[1] + k * v[1]];

// ── (2) 作図：直線 OA を A の先までのばす → A を中心に円 → 直線 OA との交点 P, Q → P, Q から同じ半径の円 → 交点 R, S
const ext = at(A, 80, u);                         // のばした先
const r1 = 55, r2 = 85;                           // ②の半径、③④の半径
const Pp = at(A, r1, u), Qq = at(A, -r1, u);      // Pp：円の外がわ、Qq：円の内がわ
const [Y1, Y2] = geo.interCC(Pp, r2, Qq, r2);
const Rr = Y1[1] < Y2[1] ? Y1 : Y2, Ss = Y1[1] < Y2[1] ? Y2 : Y1;   // R：左上、S：右下
const tv = geo.mul(geo.sub(Rr, Ss), 1 / geo.dist(Rr, Ss));          // 直線 RS（接線 ℓ）の向き（右下→左上）
const L1 = at(A, 85, tv), L2 = at(A, -108, tv);   // ℓ の両はし（左上、右下）

// ── (1) の説明用：別の点 T での接線と半径
const T = polar(O, r, 215);
const tT = [Math.cos((125 * Math.PI) / 180), -Math.sin((125 * Math.PI) / 180)];   // T での接線の向き（左上）
const T1 = at(T, 80, tT), T2 = at(T, -62, tT);

export default {
  n: 16,
  title: "円の接線の性質と作図",
  problem: "円の接線の性質について、次の問いに答えなさい。\n(1) 円の接線は接点を通る円の半径と（　　　）に交わる。（　　　）にあてはまる用語を答えなさい。\n(2) 円の接線の性質を利用して、円 O の円周上の点 A における接線 ℓ を作図しなさい。",
  answer: "(1) 垂直　(2) 点 A を通り、半径 OA に垂直な直線 ℓ（A を通る OA の垂線）が接線。",
  view: [0, 20, 400, 310],
  steps: [
    {
      cap: "問題：円の**接線**についての問題だよ。(1)は（　）にはいることば、(2)は作図だね。",
      add: [circ("O", r, { id: "circle" }), P("O", O[0], O[1], "O", "w"), P("A", A[0], A[1], "A", "n", { dy: -13 })],
    },
    {
      cap: "(1) 円と**1点だけで接する直線**が**接線**、その点が**接点**だよ。ここでは、接点を T とするね。",
      add: [seg(T1, T2, { id: "tg" }), P("T", T[0], T[1], "T", "sw"), txt(T1[0] - 6, T1[1] - 6, "接線", { id: "tx1", size: 16, anchor: "end" })],
      eq: ["## (1)", "円の接線 … 円と1点だけで接する直線"],
    },
    {
      cap: "接点 T と中心 O を結ぶ**半径 OT** をひいてみよう。接線と、**直角（90°）**に交わっているね。",
      add: [seg("O", "T", { id: "oT" }), rt("T", "O", T1, { id: "rtT" }), txt(162, 258, "半径", { id: "tx2", size: 16 })],
      eq: ["接線 と 半径 OT は 90° に交わる"],
    },
    {
      cap: "直角に交わることを、**垂直**に交わるというよ。答えは「**垂直**」！ ← これが接線の大事な性質だね。",
      hl: ["rtT"],
      eq: ["円の接線 ⊥ 接点を通る半径", "=> (1) 垂直"],
    },
    {
      cap: "(2) 接線 ℓ を作図するよ。(1)の性質から、ℓ は**点 A を通って、半径 OA に垂直**な直線だね。",
      hide: ["tg", "T", "tx1", "oT", "rtT", "tx2"],
      eqClear: true,
      add: [seg("O", "A", { id: "oa" })],
      hl: ["oa"],
      eq: ["## (2)", "接線 ℓ ⊥ 半径 OA（点 A を通る）", "→ A を通る OA の{{垂線}}をかく"],
    },
    {
      cap: "**① 直線 OA** を、A の先までのばしておくよ。",
      add: [seg("A", ext, { id: "ex" })],
      eq: ["## 手順", "① 直線 OA を A の先までのばす"],
    },
    {
      cap: "**② 点 A を中心**に円をかいて、直線 OA との交点を **P, Q** とするよ。A から P, Q までは同じ長さだね。",
      add: [circ("A", r1, { id: "c1" }), P("P", Pp[0], Pp[1], "P", "e"), P("Q", Qq[0], Qq[1], "Q", "w")],
      eq: ["② A を中心に円 → 直線 OA との交点 P, Q"],
    },
    {
      cap: "**③ 点 P を中心**に、AP より**大きい半径**で円（弧）をかくよ。",
      add: [arc("P", r2, dirDeg(Pp, Qq) - 56, dirDeg(Pp, Qq) + 56, { id: "c2" })],
      eq: ["③ P を中心に円（弧）"],
    },
    {
      cap: "**④ 点 Q を中心**に、③と**同じ半径**で円（弧）をかくよ。2つの弧が交わる点を **R, S** とするよ。",
      add: [arc("Q", r2, dirDeg(Qq, Pp) - 56, dirDeg(Qq, Pp) + 56, { id: "c3" }), P("R", Rr[0], Rr[1], "R", "ne"), P("S", Ss[0], Ss[1], "S", "ne")],
      eq: ["④ Q を中心に、同じ半径で円", "　 → 交点 R, S"],
    },
    {
      cap: "**⑤ 2点 R, S を通る直線**をひくよ。これが、点 A における**接線 ℓ** だ！",
      add: [seg(L1, L2, { id: "ans", c: "a", w: 3.2 }), txt(L2[0] + 10, L2[1] + 8, "ℓ", { id: "lt", size: 22, c: "a" })],
      hl: ["ans"],
      eq: ["⑤ 直線 RS をひく", "=> (2) 直線 RS ＝ 接線 ℓ"],
      fin: true,
    },
    {
      cap: "なぜ正しい？ **AP＝AQ、RP＝RQ**。R は PQ の垂直二等分線の上。S も同じ。だから直線 RS は、A で OA と**直角**に交わるよ。",
      add: [
        seg("A", "P", { id: "w1", c: "p", tick: 1 }), seg("A", "Q", { id: "w2", c: "p", tick: 1 }),
        seg("R", "P", { id: "w3", dash: true, c: "p", tick: 2 }), seg("R", "Q", { id: "w4", dash: true, c: "p", tick: 2 }),
        rt("A", "Q", "R", { id: "rtA", c: "p", s: 13 }),
      ],
      eq: ["// AP＝AQ（円A の半径）", "// RP＝RQ、SP＝SQ（同じ半径）", "// → RS は PQ の垂直二等分線", "// → ℓ ⊥ OA（A で直角）"],
    },
    {
      cap: "**ひっかけ注意！** 接線は**点 A を通る**直線だよ。OA の真ん中を通る垂直二等分線と、まちがえないでね。",
      hl: ["ans"],
      eq: ["## 注意", "ℓ は {{A を通る}} OA の垂線"],
    },
  ],
};
