// 問20：空間の直線・平面の性質（正しいものを1つ選ぶ）
//   反例を、立方体の辺と、座標のある図で確かめる（検算つき）
import { P, seg, poly, rt, txt, oblique, solid } from "../dsl.js";

// ───────── 3次元の道具（判定用）─────────
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot3 = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const zero = (v) => Math.hypot(...v) < 1e-9;
const lineOf = (a, b) => ({ p: a, d: sub(b, a) });
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function relLL(L1, L2) {
  const c = cross(L1.d, L2.d), w = sub(L2.p, L1.p);
  if (zero(c)) return zero(cross(w, L1.d)) ? "same" : "parallel";
  return Math.abs(dot3(w, c)) < 1e-9 ? "intersect" : "skew";
}

// ───────── (ア) の反例：立方体の辺 AB と CG ─────────
const s = 120;
const CUBE = { A: [0, 0, 0], B: [s, 0, 0], C: [s, s, 0], D: [0, s, 0], E: [0, 0, s], F: [s, 0, s], G: [s, s, s], H: [0, s, s] };
const lAB = lineOf(CUBE.A, CUBE.B), lCG = lineOf(CUBE.C, CUBE.G);
// ───────── (イ) の例：平面 P（z＝0）に立てた2本の垂線 ─────────
const nP = [0, 0, 1];
const lA = lineOf([80, 60, 0], [80, 60, 100]), lB = lineOf([190, 110, 0], [190, 110, 100]);   // どちらも P に垂直（向きが P の法線と同じ）
// 検算：手で考えた答えと、機械の判定が一致しているか
const rAB = relLL(lAB, lCG);                                                     // (ア)の反例は「ねじれ」のはず
const perpP = (L) => zero(cross(L.d, nP));
if (!(rAB === "skew" && perpP(lA) && perpP(lB) && relLL(lA, lB) === "parallel")) throw new Error("問20：検算が合いません");
// 平面に垂直な2直線は、いつも平行：向きがどれも法線と同じ → 外積がゼロ（ランダムな向きでも確かめる）
for (let i = 0; i < 50; i++) {
  const n = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
  const a = lineOf([Math.random(), Math.random(), Math.random()], n.map((v, j) => v * (1 + Math.random() * 3) + [Math.random(), Math.random(), Math.random()][j] * 0));
  const b = lineOf([Math.random() * 5, Math.random() * 5, Math.random() * 5], n.map((v) => v * -(1 + Math.random() * 3)));
  if (relLL(a, b) === "skew" || relLL(a, b) === "intersect") throw new Error("問20：(イ)の検算が合いません");
}

// ───────── 図 ─────────
const OX = 112, OY = 262;
const pr = oblique(OX, OY, 0.5, 40);
const legend = txt(12, 26, "ℓ, m：直線　　P, Q：平面", { size: 15, anchor: "start", bold: false });
const cube = (hl = {}) => solid(pr, CUBE,
  [["A", "B"], ["B", "C"], ["E", "F"], ["F", "G"], ["G", "H"], ["H", "E"], ["A", "E"], ["B", "F"], ["C", "G"]],
  [["A", "D"], ["D", "C"], ["D", "H"]],
  { lp: { A: "sw", B: "se", C: "e", D: "nw", E: "nw", F: "ne", G: "ne", H: "n" } });
const ln = (a3, b3, o = {}) => seg(pr(a3), pr(b3), { w: 3.2, ...o });
const ext = (L, t0, t1) => [lerp3(L.p, lerp3(L.p, L.p.map((v, i) => v + L.d[i]), 1), 0), L.p];   // （使わない）
const endpoints = (a, b, t = 0.22) => [lerp3(a, b, -t), lerp3(a, b, 1 + t)];
const tag = (p3, dx, dy, s, c) => { const q = pr(p3); return txt(q[0] + dx, q[1] + dy, s, { size: 20, c }); };
const slab = (z, w, d, id, fill, x0 = 0, y0 = 0) => poly([[x0, y0, z], [x0 + w, y0, z], [x0 + w, y0 + d, z], [x0, y0 + d, z]].map(pr), { id, fill, w: 1.6 });
const mk = (at3, from3, to3, id) => rt(pr(at3), pr(from3), pr(to3), { id, c: "a", s: 13 });

export default {
  n: 20,
  title: "直線と平面の性質（正しいもの）",
  problem: "空間において，ℓ，m を直線，P，Q を平面とするとき，次のうち正しいものを1つ選びなさい。\n(ア) ℓと m が交わらないならば，ℓ∥m である。\n(イ) ℓ⊥P，m⊥P ならば，ℓ∥m である。",
  answer: "(イ)　（(ア)は、ねじれの位置が反例になるのでまちがい）",
  view: [0, 0, 440, 330],
  steps: [
    {
      cap: "ℓ, m は直線、P, Q は平面。(ア)と(イ)から**正しいほう**を選ぶよ。まちがいは、**反例**（ダメな例）が1つあれば言えるんだ。",
      add: [legend],
      eq: ["## 問20", "(ア) 交わらない → ℓ∥m", "(イ) ℓ⊥P, m⊥P → ℓ∥m"],
    },
    // ── (ア) ──
    {
      cap: "(ア)「交わらないなら平行」。**同じ平面の上**ならその通り。でも**空間**ではどうかな？ 立方体の辺で反例を探そう。",
      add: [...cube().els],
      eq: ["## (ア)の反例さがし"],
    },
    {
      cap: "ℓ＝**直線AB**、m＝**直線CG** を見てみよう。延ばしても**交わらない**ね。",
      add: [ln(...endpoints(CUBE.A, CUBE.B), { c: "p", id: "lAB" }), ln(...endpoints(CUBE.C, CUBE.G), { c: "a", id: "mCG" }), tag(endpoints(CUBE.A, CUBE.B)[0], -2, 28, "ℓ", "p"), tag(endpoints(CUBE.C, CUBE.G)[1], 14, -2, "m", "a")],
      eq: ["ℓ＝直線AB、m＝直線CG", "交わらない　○"],
    },
    {
      cap: "でも、AB は横向き、CG はたて向き。**平行ではない**よね。交わらないのに平行でない（**ねじれの位置**）。",
      hl: ["lAB", "mCG"],
      eq: ["平行でない　○", "// ねじれの位置", "=> (ア) ×（反例：ねじれの位置）"],
    },
    // ── (イ) ──
    {
      cap: "(イ) ℓ⊥P、m⊥P。平面 P に、2本の直線がまっすぐ**立っている**ようすを図にかくよ。",
      clear: true,
      eqClear: true,
      add: [slab(0, 270, 190, "pl", "b"), tag([8, 8, 0], -2, 22, "P", "g")],
      eq: ["## (イ) ℓ⊥P, m⊥P"],
    },
    {
      cap: "ℓ と m は、どちらも P に**垂直**。平面に垂直な直線は、まっすぐ立つから、向きはいつも同じになるよ。",
      add: [ln(...endpoints(lA.p, lA.p.map((v, i) => v + lA.d[i]), 0.3), { c: "p", id: "l1" }), ln(...endpoints(lB.p, lB.p.map((v, i) => v + lB.d[i]), 0.3), { c: "a", id: "m1" }),
        tag([80, 60, 140], -4, -6, "ℓ", "p"), tag([190, 110, 140], -4, -6, "m", "a"),
        mk([80, 60, 0], [80, 60, 50], [140, 60, 0], "r1"), mk([190, 110, 0], [190, 110, 50], [250, 110, 0], "r2")],
      eq: ["ℓ⊥P、m⊥P"],
    },
    {
      cap: "向きが同じ（どちらも P にまっすぐ）だから、ℓ と m は**平行**になるよ ○。もし平行でなければ、どちらかは P に傾いて立つことになるんだ。",
      hl: ["l1", "m1"],
      eq: ["ℓ∥m　○", "=> (イ) 正しい"],
    },
    {
      cap: "立方体でも確かめよう。底面 ABCD に垂直な辺 **AE と BF** は、たしかに**平行**だね。",
      clear: true,
      add: [poly(["A", "B", "C", "D"].map((k) => pr(CUBE[k])), { fill: "b", w: 0 }), ...cube().els, ln(...endpoints(CUBE.A, CUBE.E, 0.2), { c: "a" }), ln(...endpoints(CUBE.B, CUBE.F, 0.2), { c: "a" })],
      eq: ["AE ⊥ 面ABCD、BF ⊥ 面ABCD", "AE ∥ BF　○"],
    },
    {
      cap: "答えは **(イ)**。(ア)は「交わらない」だけでは平行と言えない（ねじれの位置がある）から、まちがいだよ。",
      clear: true,
      eqClear: true,
      eq: ["## 答え", "(ア) ×　ねじれの位置が反例", "(イ) ○　同じ平面に垂直な2直線は平行", "=> 正しいのは (イ)"],
      fin: true,
    },
  ],
};
