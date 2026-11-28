// 問1：角の記号（∠ABD などの書き方）
import { P, seg, ang, txt, geo, polar, dirDeg } from "../dsl.js";

// 印刷物の図：B から、A はほぼ真上（約73°）、D は右上（約28°）、C は真横（0°）
const B = [30, 245];
const A = polar(B, 209, 72.9).map(Math.round);
const D = polar(B, 340, 27.6).map(Math.round);
const C = [372, 245];

// 検算：∠ABD、∠DBC、∠ABC の大きさ（JS で計算）
const deg = (p, q, r) => {
  let d = Math.abs(dirDeg(q, p) - dirDeg(q, r));
  return d > 180 ? 360 - d : d;
};
// （ア）＝∠ABD、（イ）＝∠DBC、合わせると ∠ABC
if (Math.abs(deg(A, B, D) + deg(D, B, C) - deg(A, B, C)) > 0.01) throw new Error("角の足し算が合いません");

export default {
  n: 1,
  title: "角の記号の書き方",
  problem: "次の図で、(ア)、(イ)の角を、角の記号を使って表しなさい。",
  answer: "(ア) ∠ABD（∠DBA でもよい）　(イ) ∠DBC（∠CBD でもよい）",
  view: [0, 10, 400, 270],
  steps: [
    {
      cap: "図の (ア) と (イ) の角を、**角の記号 ∠** を使って書く問題だよ。",
      add: [
        P("B", B[0], B[1], "B", "sw"), P("A", A[0], A[1], "A", "n"), P("D", D[0], D[1], "D", "ne"), P("C", C[0], C[1], "C", "e"),
        seg("B", "A", { id: "ba" }), seg("B", "D", { id: "bd" }), seg("B", "C", { id: "bc" }),
        ang("B", "A", "D", { id: "ga", r: 34, m: 1 }), ang("B", "D", "C", { id: "gi", r: 52 }),
        txt(polar(B, 80, 52)[0], polar(B, 80, 52)[1] + 5, "(ア)", { size: 16 }),
        txt(polar(B, 100, 13)[0] + 4, polar(B, 100, 13)[1] + 5, "(イ)", { size: 16 }),
      ],
    },
    {
      cap: "角の記号は **∠ のあとに文字を3つ**。**まん中の文字が、角の頂点（かどの点）** だよ。",
      hl: ["B"],
      eq: ["## 角の書き方", "∠ ○ ○ ○", "// まん中の○ ＝ 頂点（かどの点）"],
    },
    {
      cap: "(ア) の角は、辺 BA と辺 BD ではさまれた角。かどの点（頂点）は **B** だね。",
      hl: ["ba", "bd", "ga"],
      eq: ["## (ア)", "辺 BA と辺 BD ではさまれた角", "頂点は B"],
    },
    {
      cap: "頂点 B を**まん中**に書いて、両はしに A と D を書くよ。だから (ア) は **∠ABD**。",
      add: [ang("B", "A", "D", { id: "fa", r: 34, fill: "a", c: "a", w: 3 }), txt(200, 38, "(ア) ＝ ∠ABD", { id: "ta", size: 20, c: "a" })],
      eq: ["∠ A B D", "=> (ア) ∠ABD", "// 逆から読んだ ∠DBA でもOK（まん中はB）"],
    },
    {
      cap: "(イ) の角は、辺 BD と辺 BC ではさまれた角。頂点はこれも **B** だよ。",
      hl: ["bd", "bc", "gi"],
      eq: ["## (イ)", "辺 BD と辺 BC ではさまれた角", "頂点は B"],
    },
    {
      cap: "B をまん中にして、両はしに D と C。だから (イ) は **∠DBC**。",
      add: [ang("B", "D", "C", { id: "fi", r: 52, fill: "a", c: "a", w: 3 }), txt(285, 200, "(イ) ＝ ∠DBC", { id: "ti", size: 20, c: "a" })],
      eq: ["∠ D B C", "=> (イ) ∠DBC", "// ∠CBD でもOK"],
    },
    {
      cap: "ひっかけ！ **∠BAD** と書くと、まん中の A が頂点。点 A のところの別の角になっちゃうよ。",
      clear: true,
      add: [seg("A", "D", { id: "ad", dash: true, c: "p" }), ang("A", "B", "D", { id: "gbad", r: 34, fill: "p", c: "p", w: 3 }), txt(205, 100, "∠BAD は\n点Aの角", { id: "tbad", size: 16, c: "p" })],
      eq: ["## ひっかけ①", "∠BAD ✕ ← 頂点が A になる", "// 頂点は、まん中に書こう"],
    },
    {
      cap: "もう1つ。**∠ABC** は、(ア) と (イ) を**合わせた**大きな角だよ。(ア) だけなら ∠ABD だね。",
      clear: true,
      add: [ang("B", "A", "C", { id: "gabc", r: 135, fill: "p", c: "p", w: 3 }), txt(290, 205, "∠ABC ＝ (ア)＋(イ)", { id: "tabc", size: 16, c: "p" })],
      eq: ["## ひっかけ②", "∠ABC ＝ (ア) ＋ (イ)", "// D をはさんで、1つずつ書き分ける"],
    },
    {
      cap: "答えは、(ア) が **∠ABD**、(イ) が **∠DBC**。「まん中が頂点」を忘れないでね。",
      clear: true,
      add: [ang("B", "A", "D", { r: 34, fill: "a", c: "a", w: 3 }), ang("B", "D", "C", { r: 52, fill: "a", c: "a", w: 3 }),
        txt(200, 38, "(ア) ＝ ∠ABD", { size: 20, c: "a" }), txt(285, 200, "(イ) ＝ ∠DBC", { size: 20, c: "a" })],
      eq: ["=> (ア) ∠ABD　(イ) ∠DBC"],
      fin: true,
    },
  ],
};
