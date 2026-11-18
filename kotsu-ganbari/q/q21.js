// 問21：空間の直線・平面の文の ○×（4つ）
//   反例を、座標のある図で作り、ベクトルで確かめる（検算つき）
import { seg, poly, rt, txt, oblique } from "../dsl.js";

// ───────── 3次元の道具（判定用）─────────
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot3 = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const zero = (v) => Math.hypot(...v) < 1e-9;
const lineOf = (a, b) => ({ p: a, d: sub(b, a) });
function relLL(L1, L2) {                                     // same / parallel / intersect / skew
  const c = cross(L1.d, L2.d), w = sub(L2.p, L1.p);
  if (zero(c)) return zero(cross(w, L1.d)) ? "same" : "parallel";
  return Math.abs(dot3(w, c)) < 1e-9 ? "intersect" : "skew";
}
function relLP(L, Pl) {                                      // perp / intersect / contained / parallel
  if (Math.abs(dot3(L.d, Pl.n)) > 1e-9) return zero(cross(L.d, Pl.n)) ? "perp" : "intersect";
  return Math.abs(dot3(sub(L.p, Pl.p), Pl.n)) < 1e-9 ? "contained" : "parallel";
}

// ───────── 図に使う直線と平面（座標）─────────
const PL = { p: [0, 0, 0], n: [0, 0, 1] };                   // 平面 P：z＝0
const QL = { p: [0, 0, 130], n: [0, 0, 1] };                 // 平面 Q：z＝130（P の真上、平行）
// (1) 平面 P の上の ℓ と、交わる m、平行な m
const l1 = lineOf([20, 50, 0], [240, 50, 0]), m1x = lineOf([130, 10, 0], [130, 160, 0]), m1p = lineOf([20, 120, 0], [240, 120, 0]);
// (2) 平面 P の上で ℓ⊥m。上空の ななめの直線 n
const l2 = lineOf([20, 70, 0], [240, 70, 0]), m2 = lineOf([120, 10, 0], [120, 160, 0]), n2 = lineOf([40, 30, 100], [220, 150, 100]);
// (3) ℓ は P にも Q にも垂直。m は P に垂直
const l3 = lineOf([100, 60, -25], [100, 60, 165]), m3 = lineOf([170, 100, -25], [170, 100, 165]);
// (4) ℓ は P の上。m は、(a) P の上で ℓ に垂直／(b) ℓ に垂直に交わり、P に ななめ
const l4 = lineOf([20, 90, 0], [240, 90, 0]), m4a = lineOf([120, 10, 0], [120, 170, 0]), m4b = lineOf([120, 40, -30], [120, 190, 60]);

// 検算：手で考えた答え（(1)○ (2)× (3)○ (4)×）と、機械の判定が一致しているか
const parTo = (a, b) => zero(cross(a, b));
const ok = [
  // (1) 同じ平面の上の2直線：交わるか平行（ねじれは起きない）
  relLP(l1, PL) === "contained" && relLP(m1x, PL) === "contained" && relLP(m1p, PL) === "contained" && relLL(l1, m1x) === "intersect" && relLL(l1, m1p) === "parallel",
  // (2) ℓ⊥m（P の上で交わって垂直）。n は P と平行で、ℓ とも m とも平行でない（ねじれ）
  relLP(l2, PL) === "contained" && relLP(m2, PL) === "contained" && relLL(l2, m2) === "intersect" && dot3(l2.d, m2.d) === 0 &&
    relLP(n2, PL) === "parallel" && relLL(n2, l2) === "skew" && relLL(n2, m2) === "skew" && !parTo(n2.d, l2.d) && !parTo(n2.d, m2.d),
  // (3) ℓ⊥P かつ ℓ⊥Q → P∥Q。m⊥P ならば m⊥Q（法線ベクトルでも確かめる）
  relLP(l3, PL) === "perp" && relLP(l3, QL) === "perp" && parTo(PL.n, QL.n) && relLP(m3, PL) === "perp" && relLP(m3, QL) === "perp" && relLL(l3, m3) === "parallel",
  // (4) ℓ⊥m なのに m⊥P でない例が2つ
  relLP(l4, PL) === "contained" && relLL(l4, m4a) === "intersect" && dot3(l4.d, m4a.d) === 0 && relLP(m4a, PL) === "contained" &&
    relLL(l4, m4b) === "intersect" && dot3(l4.d, m4b.d) === 0 && relLP(m4b, PL) === "intersect",
];
if (!ok.every(Boolean)) throw new Error("問21：検算が合いません " + ok.join(","));

// ───────── 図 ─────────
const legend = txt(12, 26, "ℓ, m：直線　　P, Q：平面", { size: 15, anchor: "start", bold: false });
const at = (L, t) => L.p.map((v, i) => v + L.d[i] * t);   // 直線 L 上の点（t＝0 で始点、1 で終点）
function fig(ox, oy) {
  const pr = oblique(ox, oy, 0.8, 50);                   // 平面が見やすいように、奥行きを大きめに
  return {
    pr,
    ln: (L, o = {}) => seg(pr(L.p), pr(at(L, 1)), { w: 3.2, ...o }),
    seg3: (a3, b3, o = {}) => seg(pr(a3), pr(b3), o),
    tag: (p3, dx, dy, t, c, id) => { const q = pr(p3); return txt(q[0] + dx, q[1] + dy, t, { size: 20, c, id }); },
    plane: (z, w, d, id, fill) => poly([[0, 0, z], [w, 0, z], [w, d, z], [0, d, z]].map(pr), { id, fill, w: 1.6 }),
    mk: (o3, a3, b3, id) => rt(pr(o3), pr(a3), pr(b3), { id, c: "a", s: 13 }),
  };
}
const G = fig(40, 300);                                      // (1)(2)(4)：平面 P が1つ
const H = fig(40, 300);                                      // (3)：平面 P と Q
const planeP = () => [G.plane(0, 260, 170, "pl", "b"), G.tag([8, 6, 0], -8, 26, "P", "g")];

export default {
  n: 21,
  title: "直線と平面の文の○×",
  problem: "空間において，ℓ，m を直線，P，Q を平面とするとき，次の文が正しければ○，まちがっていれば×と書きなさい。\n(1) ℓ，m が同じ平面 P にふくまれるとき，ℓ と m はねじれの位置にない。\n(2) ℓ，m が同じ平面 P にふくまれ，ℓ⊥m であるとき，平面 P と平行な直線はすべて ℓ，m と平行である。\n(3) ℓ⊥P，ℓ⊥Q であり，m⊥P ならば，m⊥Q である。\n(4) ℓ が P にふくまれるとき，ℓ⊥m であれば，m⊥P である。",
  answer: "(1) ○　(2) ×　(3) ○　(4) ×",
  view: [0, 0, 440, 330],
  steps: [
    {
      cap: "ℓ, m は直線、P, Q は平面。4つの文が○か×かを、**反例**（ダメな例）がないか探しながら、1つずつ確かめるよ。",
      add: [legend],
      eq: ["## 問21", "(1)〜(4) を ○ か × で"],
    },
    // ── (1) ──
    {
      cap: "(1) 「ねじれの位置」は、**同じ平面の上にない**2直線のことだったね。ℓ, m が同じ平面 P の上にあるときは？",
      clear: true,
      eqClear: true,
      add: [...planeP(), G.ln(l1, { c: "p", id: "l" }), G.tag(at(l1, 1), 14, 6, "ℓ", "p")],
      eq: ["## (1) 同じ平面 P にふくまれる", "// ねじれ ＝ 同じ平面の上にない"],
    },
    {
      cap: "① m が ℓ と**交わる**とき。交わる2直線は、ねじれの位置ではないね。",
      add: [G.ln(m1x, { c: "a", id: "mx" }), G.tag(at(m1x, 1), 12, -2, "m", "a", "tx")],
      eq: ["① ℓ と m が交わる → ねじれでない"],
    },
    {
      cap: "② m が ℓ と**平行**なとき。平行な2直線も、ねじれの位置ではないよ。",
      hide: ["mx", "tx"],
      add: [G.ln(m1p, { c: "a", id: "mp" }), G.tag(at(m1p, 1), 14, 6, "m", "a")],
      eq: ["② ℓ と m が平行 → ねじれでない"],
    },
    {
      cap: "同じ平面の上の2直線は、①交わる ②平行 のどちらかだけ。ねじれの位置には**ならない**から、(1) は**正しい** ○。",
      hl: ["l", "mp"],
      eq: ["=> (1) ○"],
    },
    // ── (2) ──
    {
      cap: "(2) 平面 P の上で ℓ⊥m。P と**平行**な直線は、ℓ・m 以外にも、いろいろあるよ。",
      clear: true,
      eqClear: true,
      add: [...planeP(), G.ln(l2, { c: "p", id: "l" }), G.ln(m2, { c: "p", id: "m" }), G.tag(at(l2, 1), 14, 6, "ℓ", "p"), G.tag(at(m2, 1), 12, -4, "m", "p"),
        G.mk([120, 70, 0], [200, 70, 0], [120, 130, 0], "rO")],
      eq: ["## (2) ℓ, m ⊂ P、ℓ⊥m"],
    },
    {
      cap: "P の上空に、**ななめ**にはしる直線 n を考えよう。P と同じ高さをたもつから、P と**平行**だね。",
      add: [G.seg3([40, 30, 100], [40, 30, 0], { c: "k", dash: true, tick: 1, w: 1.8 }), G.seg3([220, 150, 100], [220, 150, 0], { c: "k", dash: true, tick: 1, w: 1.8 }),
        G.ln(n2, { c: "a", id: "n" }), G.tag(at(n2, 1), 14, -6, "n", "a")],
      eq: ["n は P と同じ高さ → n ∥ P"],
    },
    {
      cap: "でも n は、ℓ とも m とも**平行ではない**よ。「すべて ℓ, m と平行」とは言えないから、(2) は**まちがい** ×。",
      hl: ["n"],
      eq: ["n は ℓ とも m とも平行でない", "=> (2) ×（反例：ななめの直線 n）", "// ℓ⊥m なので、ℓ と m の両方に平行な直線は、もともと無いよ"],
    },
    // ── (3) ──
    {
      cap: "(3) ℓ⊥P、ℓ⊥Q。1本の直線 ℓ に垂直な2つの平面は、**平行**に重なっているよ（P∥Q）。",
      clear: true,
      eqClear: true,
      add: [H.plane(0, 230, 150, "pP", "b"), H.plane(130, 230, 150, "pQ", "y"), H.tag([6, 6, 0], -8, 26, "P", "g"), H.tag([6, 6, 130], -8, 26, "Q", "g"),
        H.ln(l3, { c: "p", id: "l" }), H.tag(at(l3, 1), -18, 10, "ℓ", "p"), H.mk([100, 60, 0], [100, 60, 50], [160, 60, 0], "rP"), H.mk([100, 60, 130], [100, 60, 180], [160, 60, 130], "rQ")],
      eq: ["## (3) ℓ⊥P, ℓ⊥Q, m⊥P", "ℓ⊥P かつ ℓ⊥Q → P∥Q"],
    },
    {
      cap: "ここに、m⊥P の直線 m をかくよ。m は P に垂直だから、ℓ と**平行**（同じ向き）になるね。",
      add: [H.ln(m3, { c: "a", id: "m" }), H.tag(at(m3, 1), 14, -6, "m", "a"), H.mk([170, 100, 0], [170, 100, 50], [230, 100, 0], "rm")],
      eq: ["m⊥P → m∥ℓ"],
    },
    {
      cap: "m は P に垂直で、P∥Q だから、Q にも垂直になるよ。つまり m⊥Q。(3) は**正しい** ○。",
      add: [H.mk([170, 100, 130], [170, 100, 180], [230, 100, 130], "rmQ")],
      hl: ["m"],
      eq: ["m⊥P かつ P∥Q → m⊥Q", "=> (3) ○", "// 別の見方：m∥ℓ で ℓ⊥Q だから m⊥Q"],
    },
    // ── (4) ──
    {
      cap: "(4) ℓ は P の上の直線。ℓ⊥m でも、m⊥P とは**かぎらない**よ。反例を2つ探そう。",
      clear: true,
      eqClear: true,
      add: [...planeP(), G.ln(l4, { c: "p", id: "l" }), G.tag(at(l4, 1), 14, 6, "ℓ", "p")],
      eq: ["## (4) ℓ ⊂ P、ℓ⊥m"],
    },
    {
      cap: "反例①：m が **P の上**にあって、ℓ と垂直。P の上にあるのだから、P に垂直ではないね。",
      add: [G.ln(m4a, { c: "a", id: "ma" }), G.tag(at(m4a, 1), 12, -4, "m", "a", "ta"), G.mk([120, 90, 0], [200, 90, 0], [120, 150, 0], "ra")],
      eq: ["① m ⊂ P、ℓ⊥m → m⊥P ではない"],
    },
    {
      cap: "反例②：m が ℓ と垂直に交わりながら、P に**ななめ**に立つ。これも m⊥P ではないね。",
      hide: ["ma", "ra", "ta"],
      add: [G.ln(m4b, { c: "a", id: "mb" }), G.tag(at(m4b, 1), 14, -4, "m", "a"), G.mk([120, 90, 0], [200, 90, 0], [120, 130, 24], "rb")],
      eq: ["② ななめの m、ℓ⊥m → m⊥P ではない"],
    },
    {
      cap: "m⊥P と言うには、P の上の**交わる2直線**の両方に垂直でなくちゃ。ℓ 1本だけでは足りないから、(4) は**まちがい** ×。",
      hl: ["mb"],
      eq: ["=> (4) ×", "// m⊥P ＝ P の上の、交わる2直線に垂直"],
    },
    {
      cap: "まとめるよ。(1) ○、(2) ×、(3) ○、(4) ×。×の文は、反例が1つあれば言えるんだったね。",
      eqClear: true,
      eq: ["## 答え", "(1) ○　同じ平面の上 → ねじれにならない", "(2) ×　ななめの直線 n が反例", "(3) ○　P∥Q だから m⊥Q", "(4) ×　m がななめでもよい"],
      fin: true,
      dur: 8000,
    },
  ],
};
