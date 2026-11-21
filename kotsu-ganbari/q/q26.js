// 問26：角錐の体積（三角錐・正四角錐・三角錐）
import { seg, poly, path, txt, rt, solid } from "../dsl.js";

const f = (v) => Math.round(v * 10) / 10;

// 点線の「寸法の弧」（a→b、bulge＝ふくらみ。進む向きの左が＋）。T＝印刷物の図の座標→場面の座標
function dim(id, a, b, bulge, label, T, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), n = [dy / L, -dx / L];
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const c = [m[0] + n[0] * bulge * 2, m[1] + n[1] * bulge * 2];
  const pk = [m[0] + n[0] * bulge, m[1] + n[1] * bulge];
  const A = T(a), B = T(b), C = T(c), K = T(o.lab || pk);
  const els = [path(`M${f(A[0])} ${f(A[1])}Q${f(C[0])} ${f(C[1])} ${f(B[0])} ${f(B[1])}`, { id, dash: true, c: "g" })];
  if (label) els.push(txt(K[0], K[1] + 5, label, { id: id + "t", size: 16, c: "g", anchor: o.anchor || "middle" }));
  return els;
}
// 通る点を指定した点線の弧（p0, 制御点 c, p1）
function dq(id, p0, c, p1, T) {
  const A = T(p0), C = T(c), B = T(p1);
  return path(`M${f(A[0])} ${f(A[1])}Q${f(C[0])} ${f(C[1])} ${f(B[0])} ${f(B[1])}`, { id, dash: true, c: "g" });
}
// ラベルへのひき出し線（細い実線）
function leader(id, pts, T) {
  const P = pts.map(T);
  const d = P.length === 2 ? `M${f(P[0][0])} ${f(P[0][1])}L${f(P[1][0])} ${f(P[1][1])}` : `M${f(P[0][0])} ${f(P[0][1])}Q${f(P[1][0])} ${f(P[1][1])} ${f(P[2][0])} ${f(P[2][1])}`;
  return path(d, { id, c: "g", w: 1.6 });
}
const lab = (id, p, s, T, anchor = "middle") => { const q = T(p); return txt(q[0], q[1] + 5, s, { id, size: 16, c: "g", anchor }); };
function pack(prefix, els) {
  els.forEach((e, i) => { if (!e.id) e.id = prefix + i; });
  return els.map((e) => e.id);
}
function build(pre, V, E, Hd, T) {
  const verts = {};
  for (const k in V) verts[pre + k] = [V[k][0], V[k][1], 0];
  const g = (arr) => arr.map(([a, b]) => [pre + a, pre + b]);
  return solid(([x, y]) => T([x, y]), verts, g(E), g(Hd), { label: false });
}

// ───────── (1) 三角錐：底面は 底辺6cm・高さ5cm、角錐の高さ7cm ─────────
const Ta = ([x, y]) => [f((x - 470) * 0.4 + 240), f((y - 440) * 0.4 + 185)];
const Va = { T: [465, 30], L: [105, 617], F: [740, 795], R: [815, 395], K: [580, 750], H: [450, 625] };
const Sa = build("p", Va,
  [["T", "L"], ["T", "F"], ["T", "R"], ["L", "F"], ["F", "R"], ["T", "H"], ["R", "K"]],
  [["L", "R"]], Ta);
const Da = [
  dq("p7", [405, 140], [338, 330], [440, 600], Ta), leader("p7l", [[225, 285], [285, 345], [378, 345]], Ta), lab("p7t", [175, 245], "7 cm", Ta),
  dq("p5", [690, 465], [575, 520], [575, 745], Ta), leader("p5l", [[690, 180], [686, 462]], Ta), lab("p5t", [770, 105], "5 cm", Ta),
  ...dim("p6", Va.L, Va.F, -105, "6 cm", Ta),
  rt("pH", "pT", [Va.H[0] + 60, Va.H[1]], { id: "pHr", c: "g", s: 14, w: 1.8 }),
  rt("pK", "pF", "pR", { id: "pKr", c: "g", s: 12, w: 1.8 }),
];
const IDa = pack("p_", [...Sa.els, ...Da]);

// ───────── (2) 正四角錐：底面は1辺5cmの正方形、高さ4cm ─────────
const Tb = ([x, y]) => [f((x - 545) * 0.45 + 240), f((y - 372) * 0.45 + 180)];
const Vb = { T: [525, 25], A: [60, 425], B: [430, 700], C: [990, 495], D: [610, 222], H: [522, 458] };
const Sb = build("q", Vb,
  [["T", "A"], ["T", "B"], ["T", "C"], ["A", "B"], ["B", "C"], ["T", "H"]],
  [["A", "D"], ["D", "C"], ["T", "D"]], Tb);
const Db = [
  dq("q4", [550, 60], [618, 348], [555, 445], Tb), leader("q4l", [[585, 300], [700, 280], [790, 178]], Tb), lab("q4t", [922, 143], "4 cm", Tb),
  ...dim("q5", Vb.B, Vb.C, -70, "5 cm", Tb),
  rt("qH", "qT", [Vb.H[0] + 60, Vb.H[1]], { id: "qHr", c: "g", s: 14, w: 1.8 }),
];
const IDb = pack("q_", [...Sb.els, ...Db]);

// ───────── (3) 三角錐：底面は 底辺7cm・高さ6cm、角錐の高さ4cm（辺TRがそのまま高さ）─────────
const Tc = ([x, y]) => [f((x - 600) * 0.4 + 240), f((y - 455) * 0.4 + 180)];
const Vc = { T: [968, 85], L: [95, 520], F: [570, 805], R: [935, 460], K: [440, 727] };
const Sc = build("r", Vc,
  [["T", "L"], ["T", "F"], ["T", "R"], ["L", "F"], ["F", "R"], ["R", "K"]],
  [["L", "R"]], Tc);
const Dc = [
  ...dim("r4", Vc.T, Vc.R, 60, "4 cm", Tc, { anchor: "start", lab: [1030, 272] }),
  ...dim("r6", Vc.K, Vc.R, 50, "6 cm", Tc, { lab: [540, 592] }),
  ...dim("r7", Vc.L, Vc.F, -75, "7 cm", Tc, { lab: [185, 772] }),
  rt("rR", "rT", "rL", { id: "rRr", c: "g", s: 13, w: 1.8 }),
  rt("rK", "rF", "rR", { id: "rKr", c: "g", s: 12, w: 1.8 }),
];
const IDc = pack("r_", [...Sc.els, ...Dc]);

export default {
  n: 26,
  title: "角錐の体積（3つの角錐）",
  problem: "次のような角錐の体積を求めなさい。\n(1) 三角錐　(2) 正四角錐　(3) 三角錐",
  answer: "(1) 35 cm³　(2) [[100|3]] cm³（33[[1|3]] cm³）　(3) 28 cm³",
  view: [0, 0, 480, 360],
  steps: [
    {
      cap: "角錐の体積を求める問題だよ。(1)三角錐、(2)正四角錐、(3)三角錐を、1つずつやろう。",
      add: [...Sa.els, ...Da],
    },
    {
      cap: "角錐の体積は、**底面積 × 高さ × [[1|3]]**。同じ底面・高さの柱の、3分の1だよ。",
      eq: ["## 角錐の体積の公式", "V ＝ [[1|3]] × 底面積 × 高さ", "// ×[[1|3]] をわすれずに！"],
    },
    {
      cap: "(1) 色をつけた底面は三角形。底辺は **6cm**、高さは **5cm**（直角のしるしの線）だよ。",
      add: [poly(["pL", "pF", "pR"], { id: "p_base", fill: "y", w: 0 })],
      hl: ["p6", "p6t", "p5", "p5t", "p5l"],
      eq: ["## (1)", "底面積 ＝ [[1|2]] × 6 × 5 ＝ 15 (cm²)"],
    },
    {
      cap: "角錐の高さは、頂点から底面へおろした垂線。直角のしるしがある **7cm** だよ。",
      add: [seg("pT", "pH", { id: "p_h", c: "b", w: 3.5 })],
      hl: ["p7", "p7t", "p7l"],
      eq: ["高さ ＝ 7 cm", "// 5cm は底面の三角形の高さ。角錐の高さは 7cm"],
    },
    {
      cap: "公式に入れよう。[[1|3]] × 15 × 7 ＝ 35 だね。",
      eq: ["V ＝ [[1|3]] × 15 × 7", "＝ 35", "=> (1) 35 cm³"],
    },
    {
      cap: "(2) 正四角錐。色をつけた底面は、1辺 **5cm** の正方形だよ。",
      hide: IDa.concat(["p_base", "p_h"]),
      eqClear: true,
      add: [...Sb.els, ...Db, poly(["qA", "qB", "qC", "qD"], { id: "q_base", fill: "y", w: 0 })],
      hl: ["q5", "q5t"],
      eq: ["## (2)", "底面積 ＝ 5 × 5 ＝ 25 (cm²)"],
    },
    {
      cap: "高さは、頂点から底面の中心への垂線の **4cm**。",
      add: [seg("qT", "qH", { id: "q_h", c: "b", w: 3.5 })],
      hl: ["q4", "q4t", "q4l"],
      eq: ["高さ ＝ 4 cm"],
    },
    {
      cap: "V ＝ [[1|3]] × 25 × 4 ＝ [[100|3]]。わりきれないので、分数のまま答えるよ。",
      eq: ["V ＝ [[1|3]] × 25 × 4", "＝ [[100|3]]", "=> (2) [[100|3]] cm³（33[[1|3]] cm³）"],
    },
    {
      cap: "(3) 色をつけた底面は三角形。底辺は **7cm**、高さは **6cm** だよ。",
      hide: IDb.concat(["q_base", "q_h"]),
      eqClear: true,
      add: [...Sc.els, ...Dc, poly(["rL", "rF", "rR"], { id: "r_base", fill: "y", w: 0 })],
      hl: ["r7", "r7t", "r6", "r6t"],
      eq: ["## (3)", "底面積 ＝ [[1|2]] × 7 × 6 ＝ 21 (cm²)"],
    },
    {
      cap: "ここが**ひっかけ**！ 直角のしるしがある、まっすぐ立つ辺が、そのまま高さの **4cm** だよ。",
      add: [seg("rT", "rR", { id: "r_h", c: "b", w: 3.5 })],
      hl: ["r4", "r4t"],
      eq: ["高さ ＝ 4 cm", "// 頂点の真下に、底面の頂点があるよ"],
    },
    {
      cap: "V ＝ [[1|3]] × 21 × 4 ＝ 28。",
      eq: ["V ＝ [[1|3]] × 21 × 4", "＝ 28", "=> (3) 28 cm³"],
    },
    {
      cap: "確かめ。同じ底面・高さの柱の体積を3でわっても、同じになるはずだよ。",
      eq: ["## 確かめ（柱の体積 ÷ 3）", "(1) 15 × 7 ÷ 3 ＝ 35 ✓", "(2) 25 × 4 ÷ 3 ＝ [[100|3]] ✓", "(3) 21 × 4 ÷ 3 ＝ 28 ✓"],
    },
    {
      cap: "答えは、(1) 35 cm³、(2) [[100|3]] cm³、(3) 28 cm³。角錐は **×[[1|3]]** だね。",
      fin: true,
    },
  ],
};
