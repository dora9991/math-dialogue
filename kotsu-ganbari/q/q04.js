// 問4：平行移動（方眼の上で、矢印PQの向きと長さだけ動かす）
import { P, seg, poly, arrow, txt, geo } from "../dsl.js";

// 方眼：1マス＝30。(c, r) ＝ 左上のかどから、右へ c マス・下へ r マス の交点
const G = (c, r) => [c * 30, r * 30];
const A = G(4, 2), B = G(1, 6), C = G(5, 7);      // △ABC（印刷物を1マスずつ数えて読みとった）
const Pp = G(5, 9), Q = G(8, 8);                  // 矢印 PQ
const v = geo.sub(Q, Pp);                         // PQ の動き：右へ +90（3マス）、上へ 30（1マス）
const A2 = geo.add(A, v), B2 = geo.add(B, v), C2 = geo.add(C, v);   // A′ B′ C′
const hx = Q[0], hy = Pp[1];                      // PQ を「右→上」に分けたときの角の点
// 頂点から「右へ3・上へ1」の階段（横→たて）
const stairs = (id, X, X2, o = {}) => [
  seg(X, [X2[0], X[1]], { id: id + "h", c: "p", w: 2.4, ...o }),
  seg([X2[0], X[1]], X2, { id: id + "v", c: "p", w: 2.4, ...o }),
];

export default {
  n: 4,
  title: "平行移動（矢印PQの向きに）",
  problem: "△ABC を矢印 PQ の方向に線分 PQ の長さだけ平行移動させた △A′B′C′ をかきなさい。",
  answer: "A、B、C をそれぞれ「右へ3マス・上へ1マス」動かした点を A′、B′、C′ とし、△A′B′C′ をかく。（方眼の左上のかどから右へ・下へ数えて A′(7, 1)、B′(4, 5)、C′(8, 6)）",
  view: [-20, -20, 350, 340],
  grid: { x: 0, y: 0, nx: 10, ny: 10, s: 30 },
  steps: [
    {
      cap: "問題：△ABC を、矢印PQの向きに、PQの長さだけ動かした △A′B′C′ をかくよ。",
      add: [
        P("A", A[0], A[1], "A", "nw"), P("B", B[0], B[1], "B", "sw"), P("C", C[0], C[1], "C", "se"),
        seg("A", "B"), seg("B", "C"), seg("C", "A"),
        P("P", Pp[0], Pp[1], "P", "sw"), P("Q", Q[0], Q[1], "Q", "ne"),
        arrow("P", "Q", { id: "pq", w: 2.4 }),
      ],
    },
    {
      cap: "平行移動は、図形の**すべての点**を、**同じ向きに同じ長さ**だけずらすこと。頂点A、B、Cを、PQと同じだけ動かそう。",
      hl: ["pq"],
      eq: ["## 考え方", "平行移動 ＝ すべての点を、同じ向き・同じ長さだけずらす", "→ 頂点 A、B、C を、矢印PQと同じだけ動かす"],
    },
    {
      cap: "まず矢印PQを方眼で読むよ。Pから、**右へ3マス、上へ1マス**でQに着くね。",
      add: [
        seg("P", [hx, hy], { id: "ph", c: "p", w: 2.4 }), txt(hx - 45, hy + 20, "右へ3", { id: "pht", size: 16, c: "p" }),
        seg([hx, hy], "Q", { id: "pv", c: "p", w: 2.4 }), txt(hx + 9, hy - 8, "上へ1", { id: "pvt", size: 16, c: "p", anchor: "start" }),
      ],
      eq: ["## 矢印PQ を方眼で読む", "P → Q：右へ 3 マス、上へ 1 マス"],
    },
    {
      cap: "ひっかけ注意！ 動かす向きは、P**から**Qへ（右上）。反対の左下に動かさないでね。",
      hl: ["pq"],
      eq: ["// 向きは P → Q（右上）。Q → P ではないよ"],
    },
    {
      cap: "頂点Aを、同じように**右へ3マス、上へ1マス**動かした点が A′ だよ。",
      add: [
        ...stairs("a", A, A2), txt(A[0] + 45, A[1] + 20, "右へ3", { id: "aht", size: 16, c: "p" }), txt(A2[0] + 9, A2[1] + 27, "上へ1", { id: "avt", size: 16, c: "p", anchor: "start" }),
        P("A2", A2[0], A2[1], "A′", "ne"),
      ],
      hide: ["pht", "pvt"],
      eq: ["## 頂点を動かす", "A → A′：右へ3、上へ1"],
    },
    {
      cap: "頂点Bも、**右へ3マス、上へ1マス**。これが B′ だね。",
      add: [...stairs("b", B, B2), P("B2", B2[0], B2[1], "B′", "nw")],
      eq: ["B → B′：右へ3、上へ1"],
    },
    {
      cap: "頂点Cも、**右へ3マス、上へ1マス**。これが C′ だよ。",
      add: [...stairs("c", C, C2), P("C2", C2[0], C2[1], "C′", "se")],
      eq: ["C → C′：右へ3、上へ1"],
    },
    {
      cap: "A′、B′、C′を線でむすぼう。できた △A′B′C′ が答えだよ！",
      hide: ["ph", "pv", "pht", "pvt", "ah", "av", "aht", "avt", "bh", "bv", "ch", "cv"],
      add: [poly(["A2", "B2", "C2"], { id: "ans", c: "a", w: 3.2, fill: "a" })],
      eq: ["=> △A′B′C′（A′ B′ C′ をむすぶ）"],
      fin: true,
    },
    {
      cap: "確かめよう。AA′、BB′、CC′は、どれも PQ と**平行で同じ長さ**だね。△A′B′C′ は △ABC と同じ形・同じ大きさだよ。",
      add: [
        arrow("A", "A2", { c: "p", w: 2.2 }), arrow("B", "B2", { c: "p", w: 2.2 }), arrow("C", "C2", { c: "p", w: 2.2 }),
      ],
      together: true,
      eq: ["## 確かめ", "AA′ ∥ BB′ ∥ CC′ ∥ PQ", "AA′ ＝ BB′ ＝ CC′ ＝ PQ", "// Cは Pの真上2マス → C′は Qの真上2マス"],
    },
  ],
};
