// 問38：△ABC を直線ℓのまわりに1回転させてできる立体の体積（3問）
import { P, seg, poly, ell, txt, rt, path } from "../dsl.js";

const PI = Math.PI;
const sc = 36;                                  // 1cm ＝ 36
const ry = (rx) => rx * 0.28;                   // 円を横から見たときの楕円（たての半径）
const back = (c, rx, o = {}) => ell(c, rx, ry(rx), 0, 180, { dash: true, ...o });     // 円のうしろ半分（点線）
const front = (c, rx, o = {}) => ell(c, rx, ry(rx), 180, 360, o);                     // 円のまえ半分
const tag = (pre, els) => els.map((e, i) => (e.id ? e : { ...e, id: pre + i }));       // 消すための id をつける
const g = { c: "g" };                                                                   // 与えられた図の色（黒）

// ── 確かめ（式とは別に、断面の円（円環）の面積を積分して体積を出す）
{
  const integ = (f, a, b, n = 20000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h) * h; return s; };
  const cone = (r, h) => (PI * r * r * h) / 3, cyl = (r, h) => PI * r * r * h;
  const chk = (name, num, form) => { if (Math.abs(num - form) > 1e-6 * form) throw new Error(`問38${name}：${num / PI}π と ${form / PI}π が合いません`); };
  // (1) A(0,3) B(0,-3) C(2,0)：高さ y のところの断面は、半径 2(1−|y|/3) の円
  chk("(1)", integ((y) => PI * (2 * (1 - Math.abs(y) / 3)) ** 2, -3, 3), 2 * cone(2, 3));
  // (2) A(0,0) C(3,0) B(3,-4)：断面は、外の半径3・内の半径 3|y|/4 の円環
  chk("(2)", integ((y) => PI * (9 - ((3 * Math.abs(y)) / 4) ** 2), -4, 0), cyl(3, 4) - cone(3, 4));
  // (3) B(4,0) C(2,0) A(2,3)：断面は、外の半径 4−2y/3・内の半径2の円環
  chk("(3)", integ((y) => PI * ((4 - (2 * y) / 3) ** 2 - 4), 0, 3), cone(4, 6) - cyl(2, 3) - cone(2, 3));
  if (Math.abs((cone(4, 6) - cyl(2, 3) - cone(2, 3)) / PI - 16) > 1e-9 || Math.abs((cyl(3, 4) - cone(3, 4)) / PI - 24) > 1e-9 || Math.abs((2 * cone(2, 3)) / PI - 8) > 1e-9) throw new Error("問38：答えが合いません");
}

// ════════ (1) ℓ のうえに A, B。C は ℓ から 2cm。AH＝HB＝3cm ════════
const cx1 = 220, cy1 = 160;
const A1 = [cx1, cy1 - 3 * sc], B1 = [cx1, cy1 + 3 * sc], C1 = [cx1 + 2 * sc, cy1], H1 = [cx1, cy1], L1 = [cx1 - 2 * sc, cy1];
const base1 = tag("q1_", [
  seg([cx1, 24], [cx1, 296], { w: 1.6 }), txt(cx1, 17, "ℓ", { size: 18 }),
  poly([A1, B1, C1]),
  seg(H1, C1, { w: 1.6 }), rt(H1, A1, C1),
  P("A1", A1[0], A1[1], "A", "ne", { dot: false }), P("B1", B1[0], B1[1], "B", "se", { dot: false }), P("C1", C1[0], C1[1], "C", "e", { dot: false }),
  txt(cx1 - 46, 112, "3cm", { size: 16, anchor: "end" }), txt(cx1 - 46, 218, "3cm", { size: 16, anchor: "end" }),
  seg([cx1 + 40, cy1 + 3], [C1[0] + 14, cy1 + 22], { w: 1.2 }), txt(C1[0] + 14, cy1 + 38, "2cm", { size: 16, anchor: "start" }),
]);
const ids1 = base1.map((e) => e.id);

// ════════ (2) A は ℓ の上。AC⊥ℓ、AC＝3cm、BC＝4cm（BC は ℓ と平行） ════════
const cx2 = 220, ay2 = 70;
const A2 = [cx2, ay2], C2 = [cx2 + 3 * sc, ay2], B2 = [cx2 + 3 * sc, ay2 + 4 * sc], D2 = [cx2, ay2 + 4 * sc], Lb2 = [cx2 - 3 * sc, ay2 + 4 * sc];

// ════════ (3) B, C は ℓ から 4cm, 2cm。BC＝2cm、AC＝3cm。BA をのばすと ℓ と P で交わる（PF0＝6cm） ════════
const sc3 = 35, cx3 = 225, y03 = 244;
const F0 = [cx3, y03], F1 = [cx3, y03 - 3 * sc3], Pp = [cx3, y03 - 6 * sc3];
const C3 = [cx3 - 2 * sc3, y03], B3 = [cx3 - 4 * sc3, y03], A3 = [cx3 - 2 * sc3, y03 - 3 * sc3];
const B3r = [cx3 + 4 * sc3, y03], A3r = [cx3 + 2 * sc3, y03 - 3 * sc3];

export default {
  n: 38,
  title: "三角形を回してできる立体の体積",
  problem: "次の図のような△ABCを、直線ℓを軸として1回転させてできる立体の体積を求めなさい。\n(1)　(2)　(3)（図は動画のなかにあります）",
  answer: "(1) 8π cm³　(2) 24π cm³　(3) 16π cm³",
  view: [0, 0, 440, 300],
  steps: [
    // ───────── (1)
    {
      cap: "(1) △ABCを、直線ℓを軸にして1回転させるよ。どんな立体ができるかな？ 体積を求めよう。",
      add: base1,
    },
    {
      cap: "Cからℓに垂線をおろして、足をHとするよ。点Cは、Hを中心に、**半径2cmの円**をえがくね。",
      add: [P("H1", H1[0], H1[1], "H", "w", { r: 3.2 }), back(H1, 2 * sc, { id: "q1cb" }), front(H1, 2 * sc, { id: "q1cf" })],
    },
    {
      cap: "回すと、**円錐を2つ**、底面を合わせた形ができるよ。△ACHが上の円錐、△BCHが下の円錐になるね。",
      add: [
        poly([A1, L1, C1], { fill: "b", fo: 0.28, w: 0, id: "q1t" }), poly([B1, L1, C1], { fill: "y", fo: 0.34, w: 0, id: "q1u" }),
        seg(A1, L1, { c: "b", w: 2.4 }), seg(B1, L1, { c: "b", w: 2.4 }),
      ],
      together: true,
      eq: ["## (1)", "回転体 ＝ 円錐 ＋ 円錐"],
    },
    {
      cap: "上の円錐は、底面の半径が2cm、高さが3cm。円錐の体積は **[[1|3]] × 底面積 × 高さ** だったね。下の円錐も同じ形だよ。",
      hl: ["q1t", "q1u"],
      eq: ["上の円錐：[[1|3]] × π × 2^{2} × 3 ＝ 4π", "下の円錐も同じ → 4π"],
    },
    {
      cap: "2つ合わせて、4π ＋ 4π ＝ **8π**。体積は 8π cm³ だよ。",
      eq: ["4π ＋ 4π ＝ 8π", "=> (1) 8π cm³", "// 確かめ：底面が共通なので、高さ6cmの円錐1つと考えても [[1|3]] × π × 2^{2} × 6 ＝ 8π"],
    },
    // ───────── (2)
    {
      cap: "(2) 点Aはℓの上、ACはℓに垂直だよ。△ABCを1回転させると、どんな立体かな？",
      clear: true, eqClear: true, hide: ids1,
      add: [
        seg([cx2, 24], [cx2, 286], { w: 1.6, ...g }), txt(cx2, 17, "ℓ", { size: 18, ...g }),
        poly([A2, C2, B2], g), rt(A2, D2, C2, g), rt(C2, A2, B2, g),
        P("A2", A2[0], A2[1], "A", "w", { dot: false, ...g }), P("C2", C2[0], C2[1], "C", "ne", { dot: false, ...g }), P("B2", B2[0], B2[1], "B", "se", { dot: false, ...g }),
        txt(cx2 + 54, ay2 - 12, "3cm", { size: 16, id: "q2l3", ...g }), txt(C2[0] + 12, ay2 + 2 * sc + 5, "4cm", { size: 16, anchor: "start", ...g }),
      ],
    },
    {
      cap: "ACが回ると上の**ふた**（円）、BCが回ると**円柱のかべ**。ABが回ると、円錐の形の**へこみ**ができるよ。",
      hide: ["q2l3"],
      add: [
        txt(cx2 + 66, ay2 + 28, "3cm", { size: 16, c: "b" }),
        ell(A2, 3 * sc, ry(3 * sc), 0, 360, { id: "q2top" }),
        seg(Lb2, [Lb2[0], ay2], { id: "q2wl" }),
        back(D2, 3 * sc, { id: "q2bb" }), front(D2, 3 * sc, { id: "q2bf" }),
        seg(A2, Lb2, { dash: true, id: "q2h" }),
      ],
    },
    {
      cap: "Bからℓに線をひいて、足をDとするよ。**長方形ACBD**を回すと、半径3cm・高さ4cmの**円柱**になるね。",
      add: [
        P("D2", D2[0], D2[1], "D", "sw", { r: 3.2 }), seg(B2, D2, { dash: true, id: "q2bd" }),
        poly([A2, C2, B2, D2], { fill: "b", fo: 0.28, w: 0, id: "q2r" }),
      ],
      hl: ["q2r"],
      eq: ["## (2)", "円柱（半径3cm・高さ4cm）", "π × 3^{2} × 4 ＝ 36π"],
    },
    {
      cap: "△ABC ＝ 長方形ACBD − △ABD。△ABDを回すと、半径3cm・高さ4cmの**円錐**。これが、へこみの部分だよ。",
      add: [poly([A2, D2, B2], { fill: "y", fo: 0.4, w: 0, id: "q2t" })],
      hl: ["q2t"],
      eq: ["円錐（半径3cm・高さ4cm）", "[[1|3]] × π × 3^{2} × 4 ＝ 12π"],
    },
    {
      cap: "だから、**円柱 − 円錐**。36π − 12π ＝ **24π**。体積は 24π cm³ だよ。",
      eq: ["回転体 ＝ 円柱 − 円錐", "36π − 12π ＝ 24π", "=> (2) 24π cm³", "// 確かめ：円錐は円柱の [[1|3]]。残りは [[2|3]] だから 36π × [[2|3]] ＝ 24π"],
    },
    // ───────── (3)
    {
      cap: "(3) こんどは、△ABCが、ℓから少しはなれているよ。回すと、まん中に穴があくよ。",
      clear: true, eqClear: true,
      add: [
        seg([cx3, 18], [cx3, 272], { w: 1.6, ...g }), txt(cx3, 14, "ℓ", { size: 18, ...g }),
        seg(A3, Pp, { dash: true, ...g }), seg(A3, F1, { dash: true, ...g }), seg(C3, F0, { dash: true, ...g }),
        rt(F1, A3, Pp, g), rt(F0, C3, F1, g),
        poly([A3, B3, C3], g), rt(C3, B3, A3, g),
        P("A3", A3[0], A3[1], "A", "nw", { dot: false, ...g }), P("B3", B3[0], B3[1], "B", "w", { dot: false, ...g }), P("C3", C3[0], C3[1], "C", "s", { dot: false, ...g }),
        txt(C3[0] + 8, (A3[1] + C3[1]) / 2 + 5, "3cm", { size: 16, anchor: "start", id: "q3l1", ...g }),
        txt((B3[0] + C3[0]) / 2, y03 + 30, "2cm", { size: 16, id: "q3l2", ...g }), txt((C3[0] + F0[0]) / 2, y03 + 30, "2cm", { size: 16, id: "q3l3", ...g }),
        path(`M${cx3} ${Pp[1]}Q${cx3 + 46} ${(Pp[1] + F0[1]) / 2} ${cx3} ${F0[1]}`, { dash: true, w: 1.6, id: "q3arc", ...g }),
        txt(cx3 + 22, (Pp[1] + F0[1]) / 2 + 5, "6cm", { size: 16, anchor: "start", id: "q3l4", ...g }),
      ],
    },
    {
      cap: "回すと、外がわは**円錐台**（円錐の先を切った形）、まん中には**円柱の穴**があいた立体になるよ。",
      hide: ["q3l1", "q3l2", "q3l3", "q3l4", "q3arc"],
      add: [
        back(F0, 4 * sc3, { id: "q3ob" }), front(F0, 4 * sc3, { id: "q3of" }),
        front(F0, 2 * sc3, { id: "q3if" }),
        ell(F1, 2 * sc3, ry(2 * sc3), 0, 360, { id: "q3top" }),
        seg(B3r, A3r, { id: "q3sr" }), seg(A3r, [A3r[0], y03], { dash: true, id: "q3hole" }),
      ],
    },
    {
      cap: "計算しやすいように、辺BAをのばして、ℓと交わる点をPとするよ。△PBF を回すと、**大きい円錐**だね。",
      add: [
        P("P3", Pp[0], Pp[1], "P", "e", { r: 3.2 }), P("F0", F0[0], F0[1], "F", "se", { r: 3.2 }), P("F1", F1[0], F1[1], "G", "e", { r: 3.2 }),
        poly([Pp, B3, F0], { fill: "b", fo: 0.22, w: 0, id: "q3big" }),
        seg([cx3 + 4 * sc3 + 24, Pp[1]], [cx3 + 4 * sc3 + 24, y03], { c: "b", dash: true, w: 1.8 }),
        seg([cx3 + 4 * sc3 + 18, Pp[1]], [cx3 + 4 * sc3 + 30, Pp[1]], { c: "b", w: 1.8 }), seg([cx3 + 4 * sc3 + 18, y03], [cx3 + 4 * sc3 + 30, y03], { c: "b", w: 1.8 }),
        txt(cx3 + 4 * sc3 + 32, (Pp[1] + y03) / 2 + 5, "6cm", { size: 16, anchor: "start", c: "b" }),
      ],
      hl: ["q3big"],
      eq: ["## (3)", "大きい円錐（半径4cm・高さ6cm）", "[[1|3]] × π × 4^{2} × 6 ＝ 32π"],
    },
    {
      cap: "ここから、あいている部分をひくよ。長方形GACFは**円柱**（半径2cm・高さ3cm）、△PGAは**小さい円錐**（半径2cm・高さ3cm）。",
      add: [
        poly([F1, A3, C3, F0], { fill: "y", fo: 0.45, w: 0, id: "q3cyl" }),
        poly([Pp, F1, A3], { fill: "p", fo: 0.4, w: 0, id: "q3sm" }),
      ],
      together: true,
      hl: ["q3cyl", "q3sm"],
      eq: ["円柱：π × 2^{2} × 3 ＝ 12π", "小さい円錐：[[1|3]] × π × 2^{2} × 3 ＝ 4π"],
    },
    {
      cap: "大きい円錐から、円柱と小さい円錐をひくよ。32π − 12π − 4π ＝ **16π**。体積は 16π cm³ だね。",
      eq: ["32π − 12π − 4π ＝ 16π", "=> (3) 16π cm³", "// 確かめ：円錐台は 32π − 4π ＝ 28π。穴の円柱 12π をひいても 16π"],
      fin: true,
    },
  ],
};
