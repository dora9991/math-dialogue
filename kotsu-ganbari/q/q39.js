// 問39：円が正三角形の外側を転がる（点Oの通り道の長さと、はさまれた部分の面積）
import { P, seg, poly, arc, circ, ang, rt, txt, dot, path, geo, polar } from "../dsl.js";

// コマの長さ（ms）：字幕を読む時間をみて、すこし短めにする
const withDur = (steps) => steps.map((s) => ({ dur: Math.min(12500, Math.round(1500 + s.cap.length * 105 + (s.eq || []).length * 350 + Math.min((s.add || []).length, 5) * 150)), ...s }));

const u = 44;                                   // 1cm ＝ 44（図の長さ）
const s3 = Math.sqrt(3) / 2;
const BL = [110, 268], BR = [BL[0] + 5 * u, BL[1]], T = [BL[0] + 2.5 * u, BL[1] - 5 * u * s3];   // 正三角形（1辺 5cm）
const nv = (deg) => [Math.cos((deg * Math.PI) / 180), -Math.sin((deg * Math.PI) / 180)];          // 向き deg の単位ベクトル（画面）
const sh = (p, deg, k = u) => [p[0] + k * nv(deg)[0], p[1] + k * nv(deg)[1]];                    // p を deg の向きに k ずらす
// 外向きの法線の向き：左の辺 150°、右の辺 30°、下の辺 270°
const L1 = sh(BL, 150), L2 = sh(T, 150);          // 左の辺の外側 1cm の線（両はし）
const R1 = sh(T, 30), R2 = sh(BR, 30);            // 右の辺
const B1 = sh(BR, 270), B2 = sh(BL, 270);         // 下の辺
// 円O（問題の図）：左の辺の上のほうに接している
const tp = geo.lerp(BL, T, 0.76), O = sh(tp, 150);
// 検算（点Oの通り道は、三角形から 1cm はなれている）
console.assert(Math.abs(geo.dist(O, tp) - u) < 1e-6);

const mark = (a, b) => geo.lerp(a, b, 0.5);
const outer = (a, b, deg, k) => { const m = mark(a, b); return [m[0] + k * nv(deg)[0], m[1] + k * nv(deg)[1]]; };
const side = (a, b, dx, dy) => { const m = mark(a, b); return [m[0] + dx, m[1] + dy]; };

export default {
  n: 39,
  title: "円が転がってできる線と面積",
  problem: "半径1cmの円Oが、1辺の長さが5cmの正三角形の辺にそって転がって1周する。\n(1) 点Oが動いてできる線の長さを求めなさい。\n(2) 点Oが動いてできる線と正三角形の辺で囲まれた部分の面積を求めなさい。",
  answer: "(1) 15＋2π cm　(2) 15＋π cm²",
  view: [0, 0, 440, 340],
  steps: withDur([
    {
      cap: "問題：半径1cmの円が、正三角形の**外側**を転がって1周するよ。点Oの通り道の長さと、通り道と三角形ではさまれた部分の面積を求めよう。",
      add: [
        poly([BL, BR, T], { id: "tri" }),
        circ(O, u, { id: "cO" }),
        P("O", O[0], O[1], "O", "w", { dx: -6, dy: -4 }),
        seg(O, tp, { dash: true, id: "r0" }),
        txt(O[0] - 26, O[1] - u - 10, "1cm", { id: "t1" }),
        path(`M${O[0] - 14} ${O[1] - u - 10}Q${O[0] + 20} ${O[1] - u + 10} ${(O[0] + tp[0]) / 2 + 4} ${(O[1] + tp[1]) / 2 - 8}`, { id: "ld", w: 1.6 }),
        arc(BL, 5 * u, 0, 60, { dash: true, id: "d5" }),
        txt(polar(BL, 5 * u, 30)[0] + 6, polar(BL, 5 * u, 30)[1] + 6, "5cm", { id: "t5" }),
      ],
    },
    {
      cap: "まず(1)。円が辺に接して転がるあいだ、点Oは辺から**1cm**はなれたまま進むよ。だから辺と**平行な線**をえがく。",
      hide: ["d5", "t5"],
      add: [
        circ(L1, u, { c: "k", w: 1.6, id: "c1" }),
        seg(L1, BL, { c: "p", dash: true, id: "q1" }),
        dot(L1[0], L1[1], { c: "b", id: "dA" }),
        seg(L1, L2, { c: "b", w: 3, id: "m1" }),
        dot(L2[0], L2[1], { c: "b", id: "dB" }),
        txt(...side(L1, L2, -12, 6), "5cm", { id: "tm1", c: "b", anchor: "end" }),
      ],
      hl: ["m1"],
    },
    {
      cap: "ほかの辺でも同じ。点Oは、3つの辺のそれぞれに平行な、**5cmの線**を進むよ。",
      add: [
        seg(R1, R2, { c: "b", w: 3, id: "m2" }),
        txt(...side(R1, R2, 12, 6), "5cm", { id: "tm2", c: "b", anchor: "start" }),
        seg(B1, B2, { c: "b", w: 3, id: "m3" }),
        txt(...side(B1, B2, 0, -9), "5cm", { id: "tm3", c: "b" }),
      ],
      eq: ["## (1) 点Oの通り道", "まっすぐな部分", "5 × 3 ＝ 15 cm"],
    },
    {
      cap: "では、頂点では？ 円は頂点のまわりを**ぐるっと回る**よ。だから点Oは、頂点を中心に半径1cmの**円弧**をえがく。",
      add: [
        circ(sh(BR, 330), u, { c: "k", w: 1.6, id: "c2" }),
        arc(T, u, 30, 150, { c: "p", w: 3, id: "a1" }),
        arc(BL, u, 150, 270, { c: "p", w: 3, id: "a2" }),
        arc(BR, u, 270, 390, { c: "p", w: 3, id: "a3" }),
      ],
      hl: ["a1"],
    },
    {
      cap: "弧の中心角を調べよう。頂点のまわりの角は360°。辺に垂直な半径が2本で、90°が2つ。三角形の角は60°。",
      add: [
        seg(BR, B1, { c: "p", id: "rd1" }),
        seg(BR, R2, { c: "p", id: "rd2" }),
        rt(BR, BL, B1, { c: "p", s: 12, id: "rtA" }),
        rt(BR, T, R2, { c: "p", s: 12, id: "rtB" }),
        ang(BR, BL, T, { r: 30, l: "60°", lr: 52, c: "p", id: "g60" }),
        ang(BR, B1, R2, { r: 20, l: "？", lr: 36, c: "p", id: "gx" }),
      ],
      eq: ["## 弧の中心角", "頂点のまわりの角は 360°", "90° ＋ 90° ＋ 60° ＋ ？ ＝ 360°", "？ ＝ 360° − 240° ＝ 120°"],
    },
    {
      cap: "弧の中心角は**120°**。どの頂点も同じだから、120°が3つ。あわせて **360°**、ちょうど円**1つ分**だね。",
      hide: ["gx"],
      add: [
        ang(BR, B1, R2, { r: 20, l: "120°", lr: 38, c: "p", id: "gx2" }),
        txt(...polar(BL, u + 26, 210), "120°", { c: "p", id: "x2" }),
        txt(...polar(T, u + 14, 90), "120°", { c: "p", id: "x3" }),
      ],
      hl: ["a1", "a2", "a3"],
      eq: ["120° × 3 ＝ 360°", "→ 半径1cmの円 1つ分"],
    },
    {
      cap: "弧の長さの合計は、半径1cmの円の円周と同じ。2π × 1 ＝ **2π** cm だよ。",
      hl: ["a1", "a2", "a3"],
      eq: ["弧の部分", "2π × 1 ＝ 2π cm"],
    },
    {
      cap: "(1) まっすぐな部分15cmと、弧の部分2π cmを足して、**15＋2π** cm。",
      hl: ["m1", "m2", "m3", "a1", "a2", "a3"],
      eq: ["15 ＋ 2π", "=> (1) 15 ＋ 2π cm"],
    },
    {
      cap: "ここに注意！ 弧を忘れて15cmとしないこと。弧の中心角も、三角形の角の60°ではなく**120°**だよ。",
      hl: ["a1", "a2", "a3"],
    },
    {
      cap: "(2) 通り道と三角形の辺ではさまれた部分は、三角形の**外側の帯**。三角形の中は入らないよ。",
      eqClear: true,
      hide: ["c1", "c2", "q1", "rd1", "rd2", "g60", "gx2", "x2", "x3", "tm1", "tm2", "tm3", "t1", "ld", "rtA", "rtB", "dA", "dB"],
      add: [
        poly([BL, T, L2, L1], { fill: "b", w: 0, fo: 0.3, id: "k1" }),
        poly([T, BR, R2, R1], { fill: "b", w: 0, fo: 0.3, id: "k2" }),
        poly([BR, BL, B2, B1], { fill: "b", w: 0, fo: 0.3, id: "k3" }),
        arc(T, u, 30, 150, { fill: "y", c: "p", w: 3, fo: 0.4, id: "s1" }),
        arc(BL, u, 150, 270, { fill: "y", c: "p", w: 3, fo: 0.4, id: "s2" }),
        arc(BR, u, 270, 390, { fill: "y", c: "p", w: 3, fo: 0.4, id: "s3" }),
      ],
      together: true,
      eq: ["## (2) 囲まれた部分"],
    },
    {
      cap: "この帯は、**長方形3つ**と**おうぎ形3つ**に分けられるよ。分けるには、頂点から辺に垂直な半径をひく。",
      add: [
        seg(BL, L1, { c: "p", dash: true }), seg(BL, B2, { c: "p", dash: true }),
        seg(BR, B1, { c: "p", dash: true }), seg(BR, R2, { c: "p", dash: true }),
        seg(T, L2, { c: "p", dash: true }), seg(T, R1, { c: "p", dash: true }),
      ],
      hl: ["k1", "k2", "k3"],
    },
    {
      cap: "長方形は、よこ5cm・たて1cm。3つで 5 × 1 × 3 ＝ **15** cm²。",
      hl: ["k1", "k2", "k3"],
      eq: ["長方形", "5 × 1 × 3 ＝ 15 cm²"],
    },
    {
      cap: "おうぎ形は、半径1cm・中心角120°が3つ。あわせると**半径1cmの円1つ分**だから、面積は π × 1² ＝ **π** cm²。",
      hl: ["s1", "s2", "s3"],
      add: [circ(geo.mid(geo.mid(BL, BR), T), u, { fill: "y", c: "p", fo: 0.4, id: "cc" }), txt(...geo.lerp(geo.mid(BL, BR), T, 0.5), "π", { size: 18, id: "pi", c: "p" })],
      eq: ["おうぎ形", "3つで円1つ分", "π × 1^{2} ＝ π cm²"],
    },
    {
      cap: "あわせて、15 ＋ π。(2) の答えは **15＋π cm²** だよ。(三角形の面積は入れなくてOK！)",
      hl: ["k1", "k2", "k3", "s1", "s2", "s3"],
      eq: ["15 ＋ π", "=> (2) 15 ＋ π cm²"],
      fin: true,
    },
  ]),
};
