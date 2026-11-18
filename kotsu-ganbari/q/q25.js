// 問25：柱の体積（四角柱・三角柱・円柱）
import { P, seg, poly, ell, path, txt, rt, dot, solid } from "../dsl.js";

const r1 = (v) => Math.round(v * 10) / 10;
const f = r1;

// 点線の「寸法の弧」と、そのことば。a→b（印刷物の図の座標）、bulge＝ふくらみ（進む向きの左が＋）。T＝図の座標→場面の座標
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
// 各要素に id をつけて、id の一覧を返す（あとで hide するため）
function pack(prefix, els) {
  els.forEach((e, i) => { if (!e.id) e.id = prefix + i; });
  return els.map((e) => e.id);
}
// 頂点（印刷物の図の座標）→ solid
function build(pre, V, E, Hd, T) {
  const verts = {};
  for (const k in V) verts[pre + k] = [V[k][0], V[k][1], 0];
  const g = (arr) => arr.map(([a, b]) => [pre + a, pre + b]);
  return solid(([x, y]) => T([x, y]), verts, g(E), g(Hd), { label: false });
}

// ───────── (1) 四角柱（6cm × 7cm × 4cm）─────────
const T1 = ([x, y]) => [f((x - 295) * 1.1 + 230), f((y - 190) * 1.1 + 180)];
const V1 = { Fb: [275, 295], Lb: [150, 235], Rb: [440, 225], Bb: [315, 165], Ft: [275, 185], Lt: [150, 125], Rt: [440, 115], Bt: [315, 55] };
const S1 = build("a", V1,
  [["Lb", "Fb"], ["Fb", "Rb"], ["Lb", "Lt"], ["Fb", "Ft"], ["Rb", "Rt"], ["Lt", "Ft"], ["Ft", "Rt"], ["Lt", "Bt"], ["Bt", "Rt"]],
  [["Lb", "Bb"], ["Bb", "Rb"], ["Bb", "Bt"]], T1);
const D1 = [
  ...dim("a6", V1.Lb, V1.Fb, -24, "6 cm", T1),
  ...dim("a7", V1.Fb, V1.Rb, -24, "7 cm", T1),
  ...dim("a4", V1.Rt, V1.Rb, 28, "4 cm", T1, { anchor: "start", lab: [V1.Rt[0] + 36, 170] }),
];
const IDS1 = pack("a_", [...S1.els, ...D1]);

// ───────── (2) 三角柱（底面：底辺10cm・高さ5cm、柱の高さ9cm）─────────
const T2 = ([x, y]) => [f((x - 265) * 1.05 + 225), f((y - 195) * 1.05 + 180)];
const V2 = { Lb: [96, 292], Rb: [336, 314], Ab: [240, 234], K: [216, 303], Lt: [96, 100], Rt: [336, 122], At: [240, 42] };
const S2 = build("b", V2,
  [["Lb", "Rb"], ["Lb", "Lt"], ["Rb", "Rt"], ["Lt", "Rt"], ["Lt", "At"], ["At", "Rt"], ["K", "Ab"]],
  [["Lb", "Ab"], ["Ab", "Rb"], ["Ab", "At"]], T2);
const K2 = S2.pt.bK, A2 = S2.pt.bAb;
const D2 = [
  ...dim("b10", V2.Lb, V2.Rb, -34, "10 cm", T2),
  ...dim("b9", V2.Rt, V2.Rb, 36, "9 cm", T2, { anchor: "start", lab: [V2.Rt[0] + 44, 214] }),
  ...dim("b5", V2.K, V2.Ab, -20, "", T2),
  path(`M${f(T2([250, 277])[0])} ${f(T2([250, 277])[1])}Q${f(T2([335, 262])[0])} ${f(T2([335, 262])[1])} ${f(T2([378, 306])[0])} ${f(T2([378, 306])[1])}`, { id: "b5l", c: "g", w: 1.6 }),
  txt(T2([384, 334])[0], T2([384, 334])[1], "5 cm", { id: "b5t", size: 16, c: "g", anchor: "start" }),
  rt("bK", "bLb", "bAb", { id: "b5r", c: "g", s: 12, w: 1.8 }),
];
const IDS2 = pack("b_", [...S2.els, ...D2]);

// ───────── (3) 円柱（直径8cm・高さ7cm）─────────
const T3 = ([x, y]) => [f((x - 268) * 0.95 + 235), f((y - 224) * 0.95 + 185)];
const Ct = [212, 92], Cb = [212, 297], RX = 121, RY = 34;
const c3 = (p) => T3(p);
const ellP = (ctr, from, to, o) => ell(c3(ctr), RX * 0.95, RY * 0.95, from, to, o);
const dimC8 = (() => {
  const a = T3([100, 304]), b = T3([324, 304]), c = T3([212, 340]);
  return path(`M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`, { id: "c8", dash: true, c: "g" });
})();
const D3 = [
  dimC8,
  path(`M${c3([222, 322])[0]} ${c3([222, 322])[1]}Q${c3([230, 368])[0]} ${c3([230, 368])[1]} ${c3([278, 374])[0]} ${c3([278, 374])[1]}`, { id: "c8l", c: "g", w: 1.6 }),
  txt(c3([284, 380])[0], c3([284, 380])[1], "8 cm", { id: "c8t", size: 16, c: "g", anchor: "start" }),
  ...dim("c7", [333, 92], [333, 297], 40, "7 cm", T3, { anchor: "start", lab: [378, 200] }),
];
const S3 = [
  ellP(Ct, 0, 360, { id: "c_top", c: "g" }),
  ellP(Cb, 0, 180, { id: "c_bb", c: "g", dash: true }),
  ellP(Cb, 180, 360, { id: "c_bf", c: "g" }),
  seg(c3([91, 92]), c3([91, 297]), { id: "c_l", c: "g" }),
  seg(c3([333, 92]), c3([333, 297]), { id: "c_r", c: "g" }),
  seg(c3([91, 297]), c3([333, 297]), { id: "c_dia", c: "g" }),
  dot(...c3(Cb), { id: "c_ctr", c: "g", r: 4.5 }),
];
const IDS3 = pack("c_", [...S3, ...D3]);

// 底面や高さを色でしめす
const ellPath = (ctr, rx, ry) => `M${f(ctr[0] - rx)} ${f(ctr[1])}A${rx} ${ry} 0 1 0 ${f(ctr[0] + rx)} ${f(ctr[1])}A${rx} ${ry} 0 1 0 ${f(ctr[0] - rx)} ${f(ctr[1])}Z`;
const Cb3 = c3(Cb), Ct3 = c3(Ct), Rr = r1(RX * 0.95);

export default {
  n: 25,
  title: "柱の体積（角柱・円柱）",
  problem: "次の立体の体積を求めなさい。\n(1) 四角柱　(2) 三角柱　(3) 円柱",
  answer: "(1) 168 cm³　(2) 225 cm³　(3) 112π cm³（8cm は直径→半径 4cm）",
  view: [0, 0, 480, 360],
  steps: [
    {
      cap: "立体の体積を求める問題だよ。(1)四角柱、(2)三角柱、(3)円柱を、1つずつやろう。",
      add: [...S1.els, ...D1],
    },
    {
      cap: "柱の体積は、**底面積 × 高さ**。角柱も円柱も、同じ公式だよ。",
      eq: ["## 柱の体積の公式", "V ＝ 底面積 × 高さ", "// 底面積 ＝ 底の面の面積"],
    },
    {
      cap: "(1) 四角柱。色をつけた底面は、たて 6cm・よこ 7cm の長方形だよ。",
      add: [poly(["aLb", "aFb", "aRb", "aBb"], { id: "a_base", fill: "y", w: 0 })],
      hl: ["a6", "a6t", "a7", "a7t"],
      eq: ["## (1)", "底面積 ＝ 6 × 7 ＝ 42 (cm²)"],
    },
    {
      cap: "高さは、底面に垂直に立つ辺の **4cm**。公式に入れよう。",
      add: [seg("aRb", "aRt", { id: "a_h", c: "b", w: 3.5 })],
      hl: ["a4", "a4t"],
      eq: ["V ＝ 42 × 4"],
    },
    {
      cap: "42 × 4 ＝ 168。体積の単位は **cm³** だね。",
      eq: ["＝ 168", "=> (1) 168 cm³"],
    },
    {
      cap: "(2) 三角柱。色をつけた底面は**三角形**だよ。",
      hide: IDS1.concat(["a_base", "a_h"]),
      eqClear: true,
      add: [...S2.els, ...D2, poly(["bLb", "bRb", "bAb"], { id: "b_base", fill: "y", w: 0 })],
      eq: ["## (2)"],
    },
    {
      cap: "三角形の底辺は **10cm**、高さは **5cm**。直角のしるしがついた線が高さだよ。",
      hl: ["b10", "b10t", "b5", "b5t", "b5l", "b5r"],
      eq: ["底面積 ＝ [[1|2]] × 10 × 5", "＝ 25 (cm²)"],
    },
    {
      cap: "ここが**ひっかけ**！ 柱の高さは、たてにのびる **9cm**。三角形の高さ 5cm とまちがえないでね。",
      add: [seg("bRb", "bRt", { id: "b_h", c: "b", w: 3.5 })],
      hl: ["b9", "b9t"],
      eq: ["// 5cm は底面の高さ、9cm は柱の高さ"],
    },
    {
      cap: "V ＝ 底面積 × 高さ ＝ 25 × 9 ＝ 225。",
      eq: ["V ＝ 25 × 9", "＝ 225", "=> (2) 225 cm³"],
    },
    {
      cap: "(3) 円柱。底面は円。図の **8cm** は、円の端から端まで通る**直径**だよ。",
      hide: IDS2.concat(["b_base", "b_h"]),
      eqClear: true,
      add: [...S3, ...D3, path(ellPath(Cb3, Rr, r1(RY * 0.95)), { id: "c_base", fill: "y", w: 0 })],
      hl: ["c8", "c8t", "c_dia"],
      eq: ["## (3)"],
    },
    {
      cap: "ここが**ひっかけ**！ 公式で使うのは**半径**。直径 8 ÷ 2 ＝ **4cm** だよ。",
      add: [seg(Cb3, [Cb3[0] + Rr, Cb3[1]], { id: "c_rad", c: "b", w: 3.5 }), txt(r1(Cb3[0] + Rr / 2), r1(Cb3[1] - 8), "半径 4cm", { id: "c_radt", size: 16, c: "b" })],
      hl: ["c_rad"],
      eq: ["半径 ＝ 8 ÷ 2 ＝ 4 (cm)"],
    },
    {
      cap: "底面積は、円の面積 π × 半径²。π × 4² ＝ 16π。πは文字のまま進めよう。",
      eq: ["底面積 ＝ π × 4^{2} ＝ 16π (cm²)"],
    },
    {
      cap: "高さは **7cm**。V ＝ 16π × 7 ＝ 112π だね。",
      add: [seg(c3([333, 92]), c3([333, 297]), { id: "c_h", c: "b", w: 3.5 })],
      hl: ["c7", "c7t"],
      eq: ["V ＝ 16π × 7", "＝ 112π", "=> (3) 112π cm³"],
    },
    {
      cap: "確かめ。(1)は 4×6 の面を底面と見ても 24 × 7 ＝ 168。(2)は直方体 10×5×9 の半分で 225 だね。",
      eq: ["## 確かめ", "(1) 4 × 6 × 7 ＝ 168 ✓", "(2) 10 × 5 × 9 ÷ 2 ＝ 225 ✓"],
    },
    {
      cap: "答えは、(1) 168 cm³、(2) 225 cm³、(3) 112π cm³。柱は**底面積 × 高さ**だね。",
      fin: true,
    },
  ],
};
