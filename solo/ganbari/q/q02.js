// 問2：長方形と対角線（⊥、∥、∠ の記号）
import { P, seg, ang, rt, txt, geo, polar, dirDeg } from "../dsl.js";

// 印刷物の図：横が長い長方形（横：たて ≒ 1.58 : 1）。A 左上、D 右上、B 左下、C 右下
const A = [50, 40], D = [350, 40], B = [50, 230], C = [350, 230];
const O = geo.interLL(A, C, B, D);

// ---- 検算（JS）----
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
const angle = (p, at, q) => {
  const u = sub(p, at), v = sub(q, at);
  return (Math.acos(dot(u, v) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI;
};
const ok = (c, m) => { if (!c) throw new Error("検算NG：" + m); };
ok(Math.abs(dot(sub(A, B), sub(C, B))) < 1e-9, "AB⊥BC");                      // (1) 内積0 → 垂直
ok(Math.abs(cross(sub(B, A), sub(D, C))) < 1e-9, "AB∥CD");                     // (2) 外積0 → 平行
ok(Math.abs(angle(A, O, B) - angle(C, O, D)) < 1e-9, "∠AOB＝∠COD");            // (3) 対頂角
ok(Math.abs(angle(A, O, B) - angle(B, O, C)) > 1, "∠AOB≠∠BOC（長方形は正方形ではない）");
ok(Math.abs(angle(A, O, B) - angle(A, O, D)) > 1, "∠AOB≠∠AOD");

export default {
  n: 2,
  title: "長方形と記号（⊥ ∥ ∠）",
  problem: "四角形 ABCD は長方形で、O は対角線 AC、BD の交点です。\n(1) 線分 AB と線分 BC の位置関係を、垂直の記号を使って表しなさい。\n(2) 線分 AB と線分 CD の位置関係を、平行の記号を使って表しなさい。\n(3) 角 AOB と同じ大きさの角を、記号を使って表しなさい。",
  answer: "(1) AB ⊥ BC　(2) AB ∥ CD　(3) ∠COD（∠DOC でもよい）",
  view: [0, 10, 400, 260],
  steps: [
    {
      cap: "長方形 ABCD と、対角線の交点 O の図だね。(1)(2)(3) を**記号**で表すよ。",
      add: [
        P("A", A[0], A[1], "A", "nw"), P("D", D[0], D[1], "D", "ne"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"),
        P("O", O[0], O[1], "O", "n"),
        seg("A", "B", { id: "ab" }), seg("B", "C", { id: "bc" }), seg("C", "D", { id: "cd" }), seg("D", "A", { id: "da" }),
        seg("A", "C", { id: "ac" }), seg("B", "D", { id: "bd" }),
      ],
    },
    {
      cap: "(1) 長方形の4つのかどは、ぜんぶ**直角**。辺 AB と辺 BC は、B で直角に交わっているね。",
      add: [rt("B", "A", "C", { id: "rtB", s: 16 })],
      hl: ["ab", "bc"],
      eq: ["## (1)", "AB と BC は B で直角に交わる"],
    },
    {
      cap: "2本の線が直角に交わるとき、**垂直**というよ。垂直の記号は **⊥**。",
      eq: ["「垂直」の記号 ＝ ⊥", "=> (1) AB ⊥ BC"],
    },
    {
      cap: "(2) 辺 AB と辺 CD は、長方形の**向かいあう辺**。どこまでのばしても交わらない、並んだ線だね。",
      clear: true,
      eqClear: true,
      add: [seg("A", "B", { id: "ab2", c: "p", w: 3.5 }), seg("C", "D", { id: "cd2", c: "p", w: 3.5 })],
      hl: ["ab2", "cd2"],
      eq: ["## (2)", "AB と CD は向かいあう辺", "// どこまでのばしても交わらない"],
    },
    {
      cap: "交わらずに並ぶ2本の線を**平行**というよ。平行の記号は **∥**。（縦ぼうが2本！）",
      eq: ["「平行」の記号 ＝ ∥", "=> (2) AB ∥ CD", "// ⊥ は「T」、∥ は「たて2本」と覚えよう"],
    },
    {
      cap: "(3) ∠AOB は、**点 O が頂点**で、OA と OB ではさまれた角。図では、O の**左がわ**の角だね。",
      clear: true,
      eqClear: true,
      add: [ang("O", "A", "B", { id: "aob", r: 50, fill: "p", c: "p", w: 3 })],
      hl: ["aob"],
      eq: ["## (3)", "∠AOB ＝ O の左がわの角"],
    },
    {
      cap: "AC と BD は、O で交わる2本の線。2本の線が交わるとき、**向かいあう角（対頂角）は等しい**よ。",
      add: [ang("O", "C", "D", { id: "cod", r: 50, fill: "a", c: "a", w: 3 })],
      eq: ["「対頂角は等しい」", "∠AOB ＝ ∠COD"],
    },
    {
      cap: "∠AOB の向かい側の角は、C と D ではさまれた角。頂点 O をまん中にして、**∠COD**（∠DOC でもOK）だよ。",
      hl: ["cod", "aob"],
      eq: ["=> (3) ∠COD", "// ∠DOC でもよい（まん中は O）"],
    },
    {
      cap: "ひっかけ！ O の上や下の角（∠AOD、∠BOC）は、∠AOB と**となりあう角**。長方形では大きさがちがうよ。",
      clear: true,
      add: [ang("O", "A", "D", { id: "aod", r: 50, c: "k", w: 3, fill: "k" }), ang("O", "B", "C", { id: "boc", r: 50, c: "k", w: 3, fill: "k" }), ang("O", "A", "B", { r: 34, c: "p", w: 3, fill: "p" })],
      eq: ["## ひっかけ", "∠AOD、∠BOC は ∠AOB と大きさがちがう", "// 向かいあう角だけが等しい"],
    },
    {
      cap: "答えは、(1) **AB ⊥ BC**、(2) **AB ∥ CD**、(3) **∠COD** だよ。",
      clear: true,
      add: [rt("B", "A", "C", { s: 16, c: "a" }), ang("O", "A", "B", { r: 50, fill: "a", c: "a", w: 3 }), ang("O", "C", "D", { r: 50, fill: "a", c: "a", w: 3 })],
      eqClear: true,
      eq: ["## 答え", "(1) AB ⊥ BC", "(2) AB ∥ CD", "(3) ∠COD"],
      fin: true,
    },
  ],
};
