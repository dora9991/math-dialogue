// 問40：直方体を3点I, J, Kを通る平面で切る（小さい方の体積）
import { P, seg, poly, rt, txt, geo, solid } from "../dsl.js";

// コマの長さ（ms）：字幕を読む時間をみて、すこし短めにする
const withDur = (steps) => steps.map((s) => ({ dur: Math.min(12500, Math.round(1500 + s.cap.length * 105 + (s.eq || []).length * 350 + Math.min((s.add || []).length, 5) * 150)), ...s }));

// 3次元の点 [x, y, z]：x＝AB の向き(2cm)、y＝AD の向き(3cm)、z＝上（AE ＝ 6cm、Aが上、Eが下）
const V = {
  A: [0, 0, 6], B: [2, 0, 6], C: [2, 3, 6], D: [0, 3, 6],
  E: [0, 0, 0], F: [2, 0, 0], G: [2, 3, 0], H: [0, 3, 0],
};
// 印刷物の図に合わせた投影（上の面ABCDが見える向き。Aが左、Bが手前、Cが右、Dが奥）
const [ox, oy, k] = [60, 300, 0.42];
const pr = ([x, y, z]) => [ox + 80 * k * x + 65 * k * y, oy + 32.5 * k * x - 41.7 * k * y - 80 * k * z];
const I3 = [0, 0, 3], J3 = [2, 0, 4], K3 = [2, 3, 4], L3 = [0, 3, 3];   // AI＝3, BJ＝2, CK＝2, DL＝3
const pI = pr(I3), pJ = pr(J3), pK = pr(K3), pL = pr(L3);

const box = solid(
  pr, V,
  [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], ["E", "F"], ["F", "G"], ["A", "E"], ["B", "F"], ["C", "G"]],
  [["D", "H"], ["H", "E"], ["H", "G"]],
  { lp: { A: "nw", B: "sw", C: "ne", D: "n", E: "sw", F: "s", G: "se", H: "ne" } },
);

// 右がわの、取り出した台形ABJI（たて40/cm）
const u2 = 40;
const tA = [290, 115], tB = [tA[0] + 2 * u2, tA[1]], tJ = [tB[0], tB[1] + 2 * u2], tI = [tA[0], tA[1] + 3 * u2];

// 検算（切り口の点が、同じ平面 z ＝ 3 ＋ x/2 の上にある）
for (const [x, , z] of [I3, J3, K3, L3]) console.assert(Math.abs(z - (3 + x / 2)) < 1e-9);

export default {
  n: 40,
  title: "直方体を切った立体の体積",
  problem: "AB＝2cm、AD＝3cm、AE＝6cmの直方体ABCDEFGHがある。辺AEの中点をIとし、辺BFと辺CGを3等分した点のうち、点B、Cに近い方をそれぞれJ、Kとする。3点I、J、Kを通る平面で直方体を切ったとき、小さい方の立体の体積を求めなさい。",
  answer: "15 cm³",
  view: [0, 0, 440, 350],
  steps: withDur([
    {
      cap: "問題：直方体を、3点 I、J、K を通る平面で切るよ。**小さい方の立体の体積**を求めよう。",
      add: [
        ...box.els,
        P("I", pI[0], pI[1], "I", "w"),
        P("J", pJ[0], pJ[1], "J", "sw"),
        P("K", pK[0], pK[1], "K", "e"),
      ],
    },
    {
      cap: "まず切り口。**I と J** は同じ面（面ABFE）の上にあるから、まっすぐ結べるよ。**J と K** も同じ面（面BCGF）の上だね。",
      add: [seg("I", "J", { c: "b", w: 3, id: "ij" }), seg("J", "K", { c: "b", w: 3, id: "jk" })],
      eq: ["## 切り口をさがす", "// I、J は面ABFE の上。J、K は面BCGF の上"],
    },
    {
      cap: "向かい合う面は平行だから、切り口の線も**平行**になるよ。面ABFEと面DCGHは平行なので、K から IJ に平行な線をひく。",
      add: [seg("K", "L", { c: "b", w: 3, dash: true, id: "kl" }), P("L", pL[0], pL[1], "L", "se", { c: "b" })],
      hl: ["kl"],
      eq: ["面ABFE ∥ 面DCGH だから KL ∥ IJ", "// 辺DH との交点が L"],
    },
    {
      cap: "面ADHEと面BCGFも平行。だから、I から JK に平行な線をひくと、同じ点 L に行くよ。切り口は**四角形 IJKL**！",
      add: [seg("I", "L", { c: "b", w: 3, dash: true, id: "il" })],
      hl: ["il"],
      eq: ["面ADHE ∥ 面BCGF だから IL ∥ JK"],
    },
    {
      cap: "IL は JK、つまり AD と平行。だから ADLI は長方形で、DL ＝ AI ＝ 3cm。L は辺DHの**中点**だよ。切り口をぬろう。",
      add: [poly(["I", "J", "K", "L"], { fill: "y", w: 0, fo: 0.4, id: "cut" })],
      eq: ["IL ∥ JK ∥ BC ∥ AD → ADLI は長方形", "DL ＝ AI ＝ 3 cm"],
    },
    {
      cap: "切り口で、直方体は2つの立体に分かれるよ。A、B、C、D をふくむ**上の立体**から、体積を求めよう。",
      hide: ["cut"],
      add: [
        poly(["A", "B", "J", "I"], { fill: "b", w: 0, fo: 0.32, id: "tr1" }),
        poly(["D", "C", "K", "L"], { fill: "b", w: 0, fo: 0.32, id: "tr2" }),
      ],
      together: true,
      eqClear: true,
      eq: ["## 上の立体の体積"],
    },
    {
      cap: "上の立体は、向かい合う**台形ABJI**と**台形DCKL**を底面とする**四角柱**だよ。**柱の高さ**は AD ＝ 3cm。",
      add: [seg("A", "D", { c: "a", w: 3.4, id: "had" }), txt((pr(V.A)[0] + pr(V.D)[0]) / 2 - 10, (pr(V.A)[1] + pr(V.D)[1]) / 2 - 8, "高さ3cm", { c: "a", anchor: "end", id: "thad", size: 15 })],
      hl: ["tr1", "tr2"],
      eq: ["底面：台形ABJI（と台形DCKL）", "柱の高さ：AD ＝ 3 cm"],
    },
    {
      cap: "台形ABJIを取り出そう。平行な辺は AI ＝ **3cm** と BJ ＝ **2cm**。2つの間の長さ（**台形の高さ**）は AB ＝ **2cm** だよ。",
      add: [
        poly([tA, tB, tJ, tI], { fill: "b", fo: 0.32, id: "ptr" }),
        P("tA", tA[0], tA[1], "A", "nw", { c: "b" }),
        P("tB", tB[0], tB[1], "B", "ne", { c: "b" }),
        P("tJ", tJ[0], tJ[1], "J", "se", { c: "b" }),
        P("tI", tI[0], tI[1], "I", "sw", { c: "b" }),
        rt(tA, tB, tI, { c: "b", s: 11, id: "rtA" }),
        rt(tB, tA, tJ, { c: "b", s: 11, id: "rtB" }),
        txt(tA[0] - 12, tA[1] + 1.5 * u2 + 5, "3cm", { c: "b", anchor: "end", id: "t3" }),
        txt(tB[0] + 12, tB[1] + u2 + 5, "2cm", { c: "b", anchor: "start", id: "t2" }),
        txt((tA[0] + tB[0]) / 2, tA[1] - 12, "2cm", { c: "b", id: "th" }),
      ],
      eq: ["台形の平行な辺：AI ＝ 3、BJ ＝ 2", "台形の高さ：AB ＝ 2"],
    },
    {
      cap: "台形の面積は（上底＋下底）× 高さ ÷ 2。だから (3 ＋ 2) × 2 ÷ 2 ＝ **5** cm²。高さは**平行な辺の間**の長さ（AB）だよ。",
      hl: ["ptr"],
      eq: ["底面積 ＝ (3 ＋ 2) × 2 ÷ 2 ＝ 5 cm²"],
    },
    {
      cap: "柱の体積は **底面積 × 柱の高さ**。5 × 3 ＝ **15** cm³ だね。",
      hl: ["tr1", "tr2"],
      eq: ["体積 ＝ 5 × 3 ＝ 15 cm³"],
    },
    {
      cap: "下の立体と比べよう。直方体全体は 2 × 3 × 6 ＝ 36 cm³ だから、下の立体は 36 − 15 ＝ **21** cm³。小さいのは上の立体だね。",
      hide: ["ptr", "tA", "tB", "tJ", "tI", "t3", "t2", "th", "rtA", "rtB", "had", "thad"],
      add: [poly(["E", "F", "J", "I"], { fill: "p", w: 0, fo: 0.3, id: "tr3" })],
      eqClear: true,
      eq: ["## 下の立体と比べる", "全体：2 × 3 × 6 ＝ 36 cm³", "下の立体：36 − 15 ＝ 21 cm³", "15 ＜ 21 だから、小さい方は上"],
    },
    {
      cap: "別の方法でも確かめよう。下の立体は、台形EFJI（(3＋4)×2÷2 ＝ 7）を底面とする柱で、7 × 3 ＝ 21。たしかに合うね。",
      hl: ["tr3"],
      eq: ["// 台形EFJI：(3 ＋ 4) × 2 ÷ 2 ＝ 7", "// 7 × 3 ＝ 21 ✔　15 ＋ 21 ＝ 36 ✔", "=> 小さい方は 15 cm³"],
      fin: true,
    },
  ]),
};
