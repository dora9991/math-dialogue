// 問41：円錐を転がして3回転でもとにもどる → 母線 → 表面積
import { P, seg, ell, arc, circ, txt, dot, path, geo, polar } from "../dsl.js";

// コマの長さ（ms）：字幕を読む時間をみて、すこし短めにする
const withDur = (steps) => steps.map((s) => ({ dur: Math.min(12500, Math.round(1500 + s.cap.length * 105 + (s.eq || []).length * 350 + Math.min((s.add || []).length, 5) * 150)), ...s }));

// ── 問題の図（円錐がたおれて、頂点Oを中心にころがる）──────────
const O0 = [205, 160];                       // 頂点O
const Cc = [352, 150], ea = 17, eb = 48;     // 底面（楕円）の中心・よこ・たての半径
// 頂点Oから底面の楕円へのせっ線（せっ点）を計算
const Pq = [O0[0] - Cc[0], O0[1] - Cc[1]];
const Rr = Math.hypot(Pq[0] / ea, Pq[1] / eb), dl = Math.atan2(Pq[1] / eb, Pq[0] / ea);
const tps = [dl + Math.acos(1 / Rr), dl - Math.acos(1 / Rr)].map((f) => [Cc[0] + ea * Math.cos(f), Cc[1] + eb * Math.sin(f)]);
const Q = tps[0][1] > tps[1][1] ? tps[0] : tps[1];     // 下のせっ点（地面にふれる母線のはし）
const Tu = tps[0][1] > tps[1][1] ? tps[1] : tps[0];    // 上のせっ点
// 点線の楕円（地面にできる大きな円）：Q を通るように
const rx0 = 188, ry0 = (Q[1] - O0[1]) / Math.sqrt(1 - ((Q[0] - O0[0]) / rx0) ** 2);

// ── 上から見た図（大きな円と、底面の円）──────────────────────
const Ob = [165, 170], R = 111;              // 大きな円（半径＝母線）。1cm ＝ R/9
const Cs = [392, 105], rs = R / 3;           // 底面の円（半径 3cm）
const aStart = 90;                           // はじめの母線の向き（真上）
const dv = [aStart, aStart + 120, aStart + 240].map((a) => polar(Ob, R, a));

export default {
  n: 41,
  title: "円錐を転がす（表面積）",
  problem: "底面の半径が3cmの円錐を、頂点Oを中心にして平面上で転がしたところ、3回転してもとの場所にもどりました。この円錐の表面積を求めなさい。",
  answer: "36π cm²（母線9cm、側面積27π cm²＋底面積9π cm²）",
  view: [0, 20, 480, 300],
  steps: withDur([
    {
      cap: "問題：円錐を、頂点Oを中心に転がしたら、**3回転**してもとにもどったよ。この円錐の**表面積**を求めよう。",
      add: [
        ell(O0, rx0, ry0, 0, 360, { dash: true, id: "E0" }),
        seg(O0, Tu, { id: "sU" }),
        seg(O0, Q, { id: "sL" }),
        ell(Cc, ea, eb, 0, 360, { id: "eB" }),
        dot(Cc[0], Cc[1], { id: "dC" }),
        seg(Cc, Q, { dash: true, id: "rC" }),
        txt(Q[0] - 8, Q[1] + 40, "3cm", { id: "t3" }),
        path(`M${Q[0] - 14} ${Q[1] + 28}Q${Q[0] - 26} ${Q[1] + 6} ${(Cc[0] + Q[0]) / 2 - 3} ${(Cc[1] + Q[1]) / 2 + 4}`, { id: "l3", w: 1.6 }),
        P("O", O0[0], O0[1], "O", "w", { id: "O" }),
      ],
    },
    {
      cap: "転がるとき、頂点Oは動かないよ。地面にふれている**母線**の先は、Oを中心にした**大きな円**（点線）をえがくんだ。",
      add: [seg(O0, Q, { c: "b", w: 3.5, id: "gen" }), txt((O0[0] + Q[0]) / 2 - 4, (O0[1] + Q[1]) / 2 + 28, "母線", { c: "b", id: "tg" })],
      hl: ["E0", "gen"],
    },
    {
      cap: "上から見ると、こうなるよ。点Oを中心に、半径が**母線の長さ**の円。母線の長さを **x** cm とおこう。",
      hide: ["E0", "sU", "sL", "eB", "dC", "rC", "t3", "l3", "O", "gen", "tg"],
      add: [
        circ(Ob, R, { c: "g", id: "CB" }),
        P("Ob", Ob[0], Ob[1], "O", "sw", { id: "Ob" }),
        seg(Ob, dv[0], { c: "b", w: 3, id: "gl" }),
        txt(Ob[0] + 8, Ob[1] - R / 2 - 4, "母線 x", { anchor: "start", c: "b", id: "tl" }),
      ],
      eq: ["## 考え方", "大きな円の半径 ＝ 母線 x cm"],
    },
    {
      cap: "底面の円は半径3cm。円周は 2π × 3 ＝ **6π** cm。底面が**1回転**すると、地面を 6π cm 進むよ。",
      add: [
        circ(Cs, rs, { c: "g", id: "CS" }),
        dot(Cs[0], Cs[1], { c: "g", id: "dS" }),
        seg(Cs, polar(Cs, rs, 0), { c: "b", id: "rS" }),
        txt(Cs[0], Cs[1] - rs - 8, "半径3cm", { c: "b", id: "tS" }),
        txt(Cs[0], Cs[1] + rs + 24, "底面の円周 6π", { c: "b", id: "tS2" }),
      ],
      eq: ["底面の円周", "2π × 3 ＝ 6π cm"],
    },
    {
      cap: "**3回転**でもとにもどるから、大きな円の円周は、底面の円周 6π の**3倍**。大きな円を3等分した弧が、1回転ぶんだよ。",
      add: [
        arc(Ob, R, aStart, aStart + 120, { c: "b", w: 4, id: "ar1" }),
        arc(Ob, R, aStart + 120, aStart + 240, { c: "p", w: 4, id: "ar2" }),
        arc(Ob, R, aStart + 240, aStart + 360, { c: "y", w: 4, id: "ar3" }),
        txt(...polar(Ob, R + 24, aStart + 60), "6π", { c: "b", id: "n1" }),
        txt(...polar(Ob, R + 24, aStart + 180), "6π", { c: "p", id: "n2" }),
        txt(...polar(Ob, R + 24, aStart + 300), "6π", { c: "y", id: "n3" }),
      ],
      eq: ["大きな円の円周 ＝ 底面の円周 × 3", "2π × x ＝ 6π × 3"],
    },
    {
      cap: "右の辺は 6π × 3 ＝ 18π。両辺を 2π でわって、**x ＝ 9**。母線の長さは **9cm** だね。",
      hide: ["tl"],
      add: [txt(Ob[0] + 8, Ob[1] - R / 2 - 4, "母線 9cm", { anchor: "start", c: "b", id: "t9" })],
      eq: ["2π × x ＝ 18π", "x ＝ 18π ÷ 2π ＝ 9", "=> 母線 ＝ 9 cm"],
      hl: ["gl"],
    },
    {
      cap: "ここから表面積。円錐の表面積は、**側面（おうぎ形）＋底面（円）**。側面は、大きな円を3等分したおうぎ形の1つだよ。",
      add: [
        arc(Ob, R, aStart, aStart + 120, { fill: "y", c: "b", w: 4, fo: 0.4, id: "sec" }),
        txt(...polar(Ob, R * 0.55, aStart + 60), "側面", { size: 18, c: "b", id: "tsec" }),
      ],
      hl: ["sec"],
      eq: ["## 表面積", "表面積 ＝ 側面 ＋ 底面"],
    },
    {
      cap: "側面積は、大きな円の面積 π × 9² ＝ 81π の **[[1|3]]**。だから 81π × [[1|3]] ＝ **27π** cm²。",
      eq: ["側面積", "π × 9^{2} × [[1|3]] ＝ 27π cm²"],
    },
    {
      cap: "底面は、半径3cmの円。面積は π × 3² ＝ **9π** cm²。底面を足し忘れないようにね！",
      hide: ["rS", "dS"],
      add: [circ(Cs, rs, { fill: "y", c: "b", fo: 0.4, id: "CS2" }), txt(Cs[0], Cs[1] + 6, "底面", { size: 18, c: "b", id: "tbase" })],
      hl: ["CS2"],
      eq: ["底面積", "π × 3^{2} ＝ 9π cm²"],
    },
    {
      cap: "表面積 ＝ 側面積 ＋ 底面積 ＝ 27π ＋ 9π ＝ **36π** cm² だよ。",
      hl: ["sec", "CS2"],
      eq: ["27π ＋ 9π ＝ 36π", "=> 36π cm²"],
      fin: true,
    },
    {
      cap: "確かめ：おうぎ形の弧の長さは、底面の円周 6π。中心角は 360° ÷ 3 ＝ 120° で、公式 π × 母線 × 半径 ＝ π × 9 × 3 ＝ 27π と一致するよ。",
      eq: ["// 公式でも", "// 側面積 ＝ π × 9 × 3 ＝ 27π ✔"],
    },
  ]),
};
