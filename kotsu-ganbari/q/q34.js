// 問34：立方体から三角錐 B-PQR を切り取った残りの体積
// 印刷物の図は「B が手前の角」の見方（上の面 ABCD、手前の縦の辺 BF）。斜投影ではなく、辺の向きを写しとった平行投影で描く。
import { P, seg, poly, rt, txt, solid } from "../dsl.js";

// 立体の座標（cm）：B が原点。x は B→A、y は B→C、z は B→F（下向き）。
const s = 0.52, B0 = [222, 150];
const ex = [-71 * s, -19 * s], ey = [48 * s, -28 * s], ez = [2 * s, 75 * s];   // 印刷物の図から読みとった、1cm あたりの向き
const pr = ([x, y, z]) => [Math.round((B0[0] + x * ex[0] + y * ey[0] + z * ez[0]) * 100) / 100, Math.round((B0[1] + x * ex[1] + y * ey[1] + z * ez[1]) * 100) / 100];

const AP = 1, BQ = 3, CR = 2, side = 5;
const BP = side - AP, BR = side - CR;                 // BP＝4、BR＝3
const V = {
  A: [side, 0, 0], B: [0, 0, 0], C: [0, side, 0], D: [side, side, 0],
  E: [side, 0, side], F: [0, 0, side], G: [0, side, side], H: [side, side, side],
  P: [BP, 0, 0], Q: [0, 0, BQ], R: [0, BR, 0],
};

// JS でも計算して確かめた値（行列式／別の底面／平面までの距離）
const det = (u, v, w) => u[0] * (v[1] * w[2] - v[2] * w[1]) - u[1] * (v[0] * w[2] - v[2] * w[0]) + u[2] * (v[0] * w[1] - v[1] * w[0]);
const tet = Math.abs(det(V.P, V.Q, V.R)) / 6;         // B が原点なので BP, BQ, BR の 3 本のベクトルそのもの
const tet2 = (1 / 3) * (0.5 * BQ * BR) * BP;          // 底面を △BQR、高さを BP にした場合
if (tet !== 6 || tet2 !== 6 || side ** 3 - tet !== 119 || BP !== 4 || BR !== 3) throw new Error("計算が合いません");

const cube = solid(pr, V,
  [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], ["A", "E"], ["B", "F"], ["C", "G"], ["E", "F"], ["F", "G"]],
  [["D", "H"], ["H", "E"], ["H", "G"]],
  { lp: { A: "nw", B: "se", C: "ne", D: "n", E: "sw", F: "s", G: "se", H: "se", P: "sw", Q: "se", R: "se" } });
const q = cube.pt;                                     // 画面の座標
cube.els.find((e) => e.id === "P").dx = -2;            // 名前 P を、AP の数字「1」から少しはなす
// 色ぬりが B の名前の上にかぶらないよう、色ぬりのあとに B の名前をもう一度かさねる
const Blab = (id) => P(id, q.B[0], q.B[1], "B", "se", { dot: false, c: "g" });
const num = (x, y, t, id, c = "b") => txt(x, y, t, { id, size: 17, c });

export default {
  n: 34,
  title: "立方体から三角錐を切り取る",
  problem: "右の図は、1辺の長さが5cmの立方体で、図のようにAP＝1cm、BQ＝3cm、CR＝2cmとなる点P、Q、Rを立方体の辺上にとる。この立方体から、4点B、P、Q、Rを頂点とする三角錐を切り取るとき、残りの立体の体積を求めなさい。",
  answer: "119 cm³（立方体125 − 三角錐6）",
  view: [0, 0, 400, 375],
  steps: [
    {
      cap: "1辺5cmの立方体から、三角錐 BPQR を切り取るよ。残りの立体の体積を求めよう。",
      add: [
        ...cube.els,
        seg("P", "Q"), seg("Q", "R"), seg("P", "R"),
        poly(["P", "Q", "R"], { fill: "#8b979e", fo: 0.22, w: 0 }),
      ],
    },
    {
      cap: "切り取る三角錐 BPQR を色でぬったよ。考え方は、**立方体の体積 − 切り取る三角錐の体積** だね。",
      add: [poly(["P", "Q", "R"], { id: "tet", fill: "y", fo: 0.32, w: 0 }), Blab("Bl1")],
      eq: ["## 考え方", "残り ＝ 立方体 − 三角錐"],
    },
    {
      cap: "まず**立方体の体積**。1辺が5cmだから、5 × 5 × 5 ＝ **125** cm³ だね。",
      add: [num(135, 344, "5cm", "e1"), num(300, 325, "5cm", "e2"), num(66, 202, "5cm", "e3")],
      eq: ["## 立方体", "5 × 5 × 5 ＝ 125 (cm³)"],
    },
    {
      cap: "つぎに、切り取る**三角錐**の体積。三角錐は、**底面積 × 高さ × [[1|3]]** で求めるよ。",
      hide: ["e1", "e2", "e3"],
      eq: ["## 三角錐", "体積 ＝ 底面積 × 高さ × [[1|3]]"],
    },
    {
      cap: "辺の長さを調べよう。AP＝1cm は A から測った長さ。B から測った **BP は 5 − 1 ＝ 4cm** だよ。",
      add: [
        seg("A", "P", { id: "sAP", c: "p", w: 4 }), num(46, 124, "1", "nAP", "p"),
        seg("B", "P", { id: "sBP", c: "b", w: 4 }), num(150, 152, "4", "nBP"),
      ],
      eqClear: true,
      eq: ["## 辺の長さ", "BP ＝ AB − AP ＝ 5 − 1 ＝ 4 (cm)"],
    },
    {
      cap: "BQ ＝ 3cm はそのまま。BR は、BC(5cm) から CR(2cm) をひいて **3cm** だね。",
      add: [
        seg("B", "Q", { id: "sBQ", c: "b", w: 4 }), num(211, 214, "3", "nBQ"),
        seg("C", "R", { id: "sCR", c: "p", w: 4 }), num(332, 106, "2", "nCR", "p"),
        seg("B", "R", { id: "sBR", c: "b", w: 4 }), num(262, 154, "3", "nBR"),
      ],
      eq: ["BQ ＝ 3 (cm)", "BR ＝ BC − CR ＝ 5 − 2 ＝ 3 (cm)"],
    },
    {
      cap: "立方体の角だから、BP・BR・BQ は**たがいに直角**。△BPR を**底面**、BQ を**高さ**と考えよう。",
      add: [
        poly(["B", "P", "R"], { id: "tbase", fill: "b", fo: 0.24, w: 0 }),
        Blab("Bl2"),
        rt("B", "P", "R", { id: "rt1", s: 12 }), rt("B", "P", "Q", { id: "rt2", s: 12 }), rt("B", "R", "Q", { id: "rt3", s: 12 }),
      ],
      hl: ["sBQ"],
    },
    {
      cap: "底面積。△BPR は BP＝4、BR＝3 の**直角三角形**だから、[[1|2]] × 4 × 3 ＝ **6** cm² だよ。",
      hl: ["tbase", "sBP", "sBR"],
      eqClear: true,
      eq: ["## 底面積（△BPR）", "[[1|2]] × BP × BR", "＝ [[1|2]] × 4 × 3 ＝ 6 (cm²)"],
    },
    {
      cap: "高さは BQ ＝ 3cm。三角錐の体積は、[[1|3]] × 6 × 3 ＝ **6 cm³** になるね。",
      hl: ["sBQ"],
      eq: ["## 三角錐の体積", "[[1|3]] × 6 × 3 ＝ 6 (cm³)"],
    },
    {
      cap: "残りの立体は、**立方体 − 三角錐** ＝ 125 − 6 ＝ **119 cm³** だよ。",
      eqClear: true,
      eq: ["## 残りの体積", "125 − 6 ＝ 119", "=> 119 cm³"],
      fin: true,
    },
    {
      cap: "確かめよう。底面を△BQR、高さを BP にしても、[[1|3]] × [[9|2]] × 4 ＝ 6 で同じになるよ。",
      hide: ["tbase", "rt1", "rt2"],
      add: [poly(["B", "Q", "R"], { id: "tbase2", fill: "p", fo: 0.22, w: 0 }), Blab("Bl3")],
      hl: ["sBP"],
      eq: ["## 確かめ", "△BQR ＝ [[1|2]] × 3 × 3 ＝ [[9|2]]", "[[1|3]] × [[9|2]] × 4 ＝ 6 ✓"],
    },
  ],
};
