// ============================================================
// kukan-15.js — 空間図形 第15時「空間図形で学んだことを、整理して確かめよう」（単元のまとめ）
//   ikkan の演習プリント（kukan-15.dr.1〜9）・小テスト（kukan-15.qz.1〜5）・ワークシート例題を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「15」＋ d（演習）／q（小テスト）／w（ワークシート）＋ ikkan の問題の番号（＋ 小問 a, b…）
//     例：15d03a ＝ kukan-15.dr.3 の1つ目（側面積）、15w02b ＝ ワークシートの2つ目の K（例題）の2つ目（体積）
//   直方体の辺・面の関係は、solids.js の cuboid / edgesWhere / edgesToFace で計算する（手で書かない）。
//   「すべて答えよう」は入力できないので、「次のうちどれか」の4択に直した。
//   円錐の体積比は「円錐：球：円柱 ＝ 1：2：3」を使う数値の問いにした（比そのものは、問題文では言わず、ヒントに出す）。
// ============================================================
import { t, pick, choices4, shuffle, round, fracTex } from "../kit.js";
import { unit } from "../kukan-kit.js";
import { cuboid, edgesWhere, edgesToFace, intro, edgeLabel, listEdges, prismName, pyramidName } from "../solids.js";

const sq = (n) => `${n}²`;
const cb = (n) => `${n}³`;
/** n÷3 を、整数ならそのまま、割り切れなければ TeX の分数（$...$ つき）で */
const third = (n) => (n % 3 === 0 ? String(n / 3) : `$${fracTex(n, 3)}$`);

/** 直角三角形の3辺の組（短い辺, 長い辺, 斜辺）。円錐の（半径, 高さ, 母線）、正四角錐の（底面の1辺の半分, 高さ, 側面の三角形の高さ）に使う。どれも 3 でわれる体積になる */
const PYT = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [9, 12, 15], [8, 15, 17], [15, 8, 17], [7, 24, 25]];

// ───────── 立体の名前 ─────────
const SOLID4 = ["円柱", "円錐", "球", "半球"];
const NAMES = [
  // 投影図
  { proj: true, d: "立面図が長方形、平面図が円になる立体", ans: "円柱", why: "正面から見ると長方形、真上から見ると円になるのは、円柱。" },
  { proj: true, d: "立面図が二等辺三角形、平面図が円になる立体", ans: "円錐", why: "正面から見ると二等辺三角形、真上から見ると円になるのは、円錐。" },
  { proj: true, d: "立面図も平面図も円になる立体", ans: "球", why: "どの向きから見ても円になるのは、球。" },
  { proj: true, d: "立面図が半円、平面図が円になる立体", ans: "半球", why: "正面から見ると半円、真上から見ると円になるのは、半球。" },
  // 回転体
  { d: "長方形を、1辺を軸として1回転させてできる立体", ans: "円柱", why: "長方形を1辺を軸に回すと、辺が円をえがいて、円柱になる。" },
  { d: "直角三角形を、直角をはさむ1辺を軸として1回転させてできる立体", ans: "円錐", why: "直角三角形を、直角をはさむ辺を軸に回すと、円錐になる。" },
  { d: "二等辺三角形を、頂点から底辺にひいた垂線を軸として1回転させてできる立体", ans: "円錐", why: "二等辺三角形を、対称の軸（頂点から底辺への垂線）で回すと、円錐になる。" },
  { d: "半円を、直径を軸として1回転させてできる立体", ans: "球", why: "半円を直径を軸に回すと、まるごとの球になる。（半球ではない）" },
  { d: "円を、直径を軸として1回転させてできる立体", ans: "球", why: "円を直径を軸に回すと、球になる。" },
];
const nameQ = (r, list) => {
  const e = pick(r, list);
  return {
    q: `${e.d}は、次のうちどれか。`,
    ans: e.ans,
    choices: choices4(r, e.ans, SOLID4.filter((x) => x !== e.ans)),
    hint: e.proj ? "立面図は正面から、平面図は真上から見た形。" : "回転させてできる立体を、思いうかべよう。",
    steps: [e.why, `だから、${e.ans}。`],
  };
};

// ───────── 直方体の辺・面（solids.js で計算） ─────────
const eName = (e) => `辺 ${edgeLabel(e)}`;
/** 辺 e とねじれの位置にある辺を選ぶ4択 */
function skewQ(r, e, S) {
  const skew = edgesWhere(S, e, "skew"), par = edgesWhere(S, e, "parallel"), inter = edgesWhere(S, e, "intersect");
  const ans = eName(pick(r, skew));
  const wrongs = [eName(pick(r, par)), ...shuffle(r, inter).slice(0, 2).map(eName)];
  return {
    q: `${intro(S)}がある。辺 ${edgeLabel(e)} とねじれの位置にある辺は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs),
    hint: "ねじれの位置は、交わらず、平行でもない関係。平行な辺と、交わる辺を先に消していこう。",
    steps: [
      `辺 ${edgeLabel(e)} と平行な辺　${listEdges(par)}`,
      `辺 ${edgeLabel(e)} と交わる辺　${listEdges(inter)}`,
      `ねじれの位置にある辺は、のこりの　${listEdges(skew)}。`,
      `選択肢のうち、正解は ${ans}。`,
    ],
  };
}

// ───────── 円錐・円柱・球 ─────────
/** 球と円柱と円錐の比 1：2：3（円錐：球：円柱） */
const RATIO = { 円錐: 1, 球: 2, 円柱: 3 };

export const UNITS = [
  unit("15", {
    name: "空間図形のまとめ",
    desc: "位置関係・回転体・表面積と体積のまとめ",
    prereqs: ["J1-kk14", "J1-k2", "J1-k3", "J1-k4", "J1-z3"],
    points: [
      "空間で、交わらず、平行でもない2直線の位置関係を「ねじれの位置」という。平面図形を1つの直線を軸に1回転させてできる立体を「回転体」という。",
      "円錐の展開図で、側面は、おうぎ形。その弧の長さは、底面の円周に等しい。表面積は 側面積＋底面積。",
      "体積は、角柱・円柱が $Sh$、角錐・円錐が $\\frac{1}{3}Sh$、球が $\\frac{4}{3}\\pi r^3$（$S$ は底面積、$h$ は高さ、$r$ は半径）。球の表面積は $4\\pi r^2$。",
      "球がちょうど入る円柱と、同じ底面・高さの円錐の体積の比は、円錐：球：円柱 ＝ 1：2：3。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 15d01a 辺 AB とねじれの位置にある辺
        t("15d01a", (r) => {
          const S = cuboid(4, 3, 3);
          return skewQ(r, pick(r, S.E), S);
        }),
        // 15d01b 面 ABCD に垂直な辺
        t("15d01b", (r) => {
          const S = cuboid(4, 3, 3), f = pick(r, S.F);
          const perp = edgesToFace(S, f, "perp"), par = edgesToFace(S, f, "parallel"), on = edgesToFace(S, f, "on");
          const ans = eName(pick(r, perp));
          const w1 = pick(r, par), w2 = pick(r, on), w3 = pick(r, [...par, ...on].filter((x) => x !== w1 && x !== w2));
          const wrongs = [w1, w2, w3].map(eName);
          return {
            q: `${intro(S)}がある。面 ${f} に垂直な辺は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "面に垂直な辺は、その面に、まっすぐ立っている辺。面の上にある辺や、面と平行な辺は、垂直ではない。",
            steps: [
              `面 ${f} に垂直な辺　${listEdges(perp)}`,
              `面 ${f} に平行な辺　${listEdges(par)}`,
              `面 ${f} の上にある辺　${listEdges(on)}`,
              `選択肢のうち、正解は ${ans}。`,
            ],
          };
        }),
        // 15q04 辺 AE とねじれの位置にある辺（たての辺）
        t("15q04", (r) => {
          const S = cuboid(4, 3, 3);
          return skewQ(r, pick(r, ["AE", "BF", "CG", "DH"]), S);
        }),
        // 15d02 立体の名前（立面図・平面図、回転体）
        t("15d02", (r) => nameQ(r, NAMES)),
        // 15q01a 用語
        t("15q01a", (r) => {
          const W = [
            { q: "平面図形を、1つの直線を軸として1回転させてできる立体を、何というか。", ans: "回転体", wrongs: ["多面体", "柱体", "錐体"], why: "回転させてできる立体を、回転体という。" },
            { q: "平面図形を、1つの直線を軸として1回転させてできる立体を、何というか。", ans: "回転体", wrongs: ["多面体", "柱体", "錐体"], why: "回転させてできる立体を、回転体という。" },
            { q: "立体を正面から見た図を、何というか。", ans: "立面図", wrongs: ["平面図", "展開図", "見取図"], why: "正面から見た図が立面図、真上から見た図が平面図。" },
            { q: "立体を真上から見た図を、何というか。", ans: "平面図", wrongs: ["立面図", "展開図", "見取図"], why: "真上から見た図が平面図、正面から見た図が立面図。" },
            { q: "立体の表面を切り開いて、平面に広げた図を、何というか。", ans: "展開図", wrongs: ["投影図", "見取図", "立面図"], why: "切り開いて広げた図が展開図。" },
            { q: "空間で、交わらず、平行でもない2直線の位置関係を、何というか。", ans: "ねじれの位置", wrongs: ["垂直", "平行", "交わる"], why: "交わらず、平行でもない関係を、ねじれの位置という。" },
          ];
          const w = pick(r, W);
          return { q: w.q, ans: w.ans, choices: choices4(r, w.ans, w.wrongs), hint: "単元で習った言葉を思い出そう。", steps: [w.why, `答えは「${w.ans}」。`] };
        }),
        // 15q01b 立面図・平面図から立体の名前（イ）
        t("15q01b", (r) => nameQ(r, NAMES.filter((x) => x.proj))),
        // 15q01c 円錐の展開図の側面（ウ）
        t("15q01c", (r) => {
          const n = r(3, 8);
          const W = [
            { s: "円錐", ans: "おうぎ形", wrongs: ["三角形", "長方形", "円"], why: "円錐の側面は曲面で、広げるとおうぎ形になる。" },
            { s: "円錐", ans: "おうぎ形", wrongs: ["三角形", "長方形", "円"], why: "円錐の側面は曲面で、広げるとおうぎ形になる。" },
            { s: "円柱", ans: "長方形", wrongs: ["おうぎ形", "三角形", "円"], why: "円柱の側面は曲面で、広げると長方形になる。（横の長さは底面の円周）" },
            { s: pyramidName(n), ans: "三角形", wrongs: ["長方形", "おうぎ形", "円"], why: "角錐の側面は、頂点に集まる三角形。" },
            { s: prismName(n), ans: "長方形", wrongs: ["三角形", "おうぎ形", "円"], why: "角柱の側面は、長方形。" },
          ];
          const w = pick(r, W);
          return { q: `${w.s}の展開図で、側面は、どんな形か。`, ans: w.ans, choices: choices4(r, w.ans, w.wrongs), hint: "側面を切り開いて、平面に広げた形を考えよう。", steps: [w.why, `答えは「${w.ans}」。`] };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 15d03a 円錐の側面積
        t("15d03a", (r) => {
          const [rad, h, l] = pick(r, PYT);
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm、母線の長さが ${l}cm の円錐の、側面積は □π cm²。□は？`,
            ans: rad * l,
            hint: "側面は、母線を半径とするおうぎ形。弧の長さは、底面の円周に等しい。",
            steps: [`底面の円周　2π×${rad}＝${2 * rad}π、母線を半径とする円の円周　2π×${l}＝${2 * l}π`, `側面積　π×${sq(l)}×$\\frac{${2 * rad}\\pi}{${2 * l}\\pi}$＝${rad * l}π（cm²）`],
          };
        }),
        // 15d03b 円錐の表面積
        t("15d03b", (r) => {
          const [rad, h, l] = pick(r, PYT);
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm、母線の長さが ${l}cm の円錐の、表面積は □π cm²。□は？`,
            ans: rad * l + rad * rad,
            hint: "表面積は、側面積と底面積の和。",
            steps: [`側面積　π×${sq(l)}×$\\frac{${2 * rad}\\pi}{${2 * l}\\pi}$＝${rad * l}π`, `底面積　π×${sq(rad)}＝${rad * rad}π`, `表面積　${rad * l}π+${rad * rad}π＝${rad * l + rad * rad}π（cm²）`],
          };
        }),
        // 15d03c 円錐の体積
        t("15d03c", (r) => {
          const [rad, h, l] = pick(r, PYT);
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm、母線の長さが ${l}cm の円錐の、体積は □π cm³。□は？`,
            ans: (rad * rad * h) / 3,
            hint: "体積には、母線ではなく、高さを使う。",
            steps: [`$\\frac{1}{3}$×π×${sq(rad)}×${h}＝${(rad * rad * h) / 3}π（cm³）`, `（母線 ${l}cm は、体積には使わない）`],
          };
        }),
        // 15d04a 半球の表面積
        t("15d04a", (r) => {
          const rad = r(2, 9);
          return {
            q: `半径が ${rad}cm の半球の、表面積（曲面と、底面の円の合計）は □π cm²。□は？`,
            ans: 3 * rad * rad,
            hint: "曲面は、球の表面積の半分。底面の円も、たすのをわすれずに。",
            steps: [`曲面　4π×${sq(rad)}×$\\frac{1}{2}$＝${2 * rad * rad}π`, `底面の円　π×${sq(rad)}＝${rad * rad}π`, `表面積　${2 * rad * rad}π+${rad * rad}π＝${3 * rad * rad}π（cm²）`],
          };
        }),
        // 15d04b 半球の体積
        t("15d04b", (r) => {
          const rad = pick(r, [3, 6, 9, 12]), ans = (2 * rad ** 3) / 3;
          return {
            q: `半径が ${rad}cm の半球の、体積は □π cm³。□は？`,
            ans,
            hint: "半球の体積は、球の体積の半分。",
            steps: [`$\\frac{4}{3}$π×${cb(rad)}×$\\frac{1}{2}$＝${ans}π（cm³）`],
          };
        }),
        // 15d05a 正四角錐の表面積
        t("15d05a", (r) => {
          const [half, h, l] = pick(r, PYT), a = 2 * half;
          return {
            q: `底面が 1辺 ${a}cm の正方形で、高さが ${h}cm、側面の三角形の高さ（底辺 ${a}cm に対する高さ）が ${l}cm の正四角錐の、表面積は何 cm² か。`,
            ans: a * a + 2 * a * l,
            unit: "cm²",
            hint: "底面の正方形1つと、側面の合同な三角形4つに分けて求める。",
            steps: [`底面　${a}×${a}＝${a * a}`, `側面　$\\frac{1}{2}$×${a}×${l}×4＝${2 * a * l}`, `表面積　${a * a}+${2 * a * l}＝${a * a + 2 * a * l}（cm²）`],
          };
        }),
        // 15d05b 正四角錐の体積
        t("15d05b", (r) => {
          const [half, h, l] = pick(r, PYT), a = 2 * half, ans = (a * a * h) / 3;
          return {
            q: `底面が 1辺 ${a}cm の正方形で、高さが ${h}cm、側面の三角形の高さ（底辺 ${a}cm に対する高さ）が ${l}cm の正四角錐の、体積は何 cm³ か。`,
            ans,
            unit: "cm³",
            hint: "体積には、側面の三角形の高さではなく、立体の高さを使う。",
            steps: [`$\\frac{1}{3}$×${a}×${a}×${h}＝${ans}（cm³）`, `（側面の三角形の高さ ${l}cm は、体積には使わない）`],
          };
        }),
        // 15q02 円錐の体積（小テスト）
        t("15q02", (r) => {
          const rad = r(2, 9), h = rad % 3 === 0 ? r(2, 9) : pick(r, [3, 6, 9, 12]), ans = (rad * rad * h) / 3;
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm の円錐の、体積は □π cm³。□は？`,
            ans,
            hint: "円錐の体積は、底面積×高さ÷3。",
            steps: [`$\\frac{1}{3}$×π×${sq(rad)}×${h}＝${ans}π（cm³）`],
          };
        }),
        // 15q03 球の表面積（小テスト）
        t("15q03", (r) => {
          const rad = r(2, 10);
          return {
            q: `半径が ${rad}cm の球の、表面積は □π cm²。□は？`,
            ans: 4 * rad * rad,
            hint: "球の表面積の公式は、4πr²。",
            steps: [`4π×${sq(rad)}＝${4 * rad * rad}π（cm²）`],
          };
        }),
        // 15w02a 投影図から円柱の表面積（ワークシートの例題）
        t("15w02a", (r) => {
          const d = pick(r, [4, 6, 8, 10]), h = r(3, 9), rad = d / 2, side = d * h, base = rad * rad * 2;
          return {
            q: `ある立体の立面図は、横 ${d}cm、たて ${h}cm の長方形で、平面図は、直径 ${d}cm の円である。この立体の表面積は □π cm²。□は？`,
            ans: side + base,
            hint: "立面図が長方形、平面図が円になる立体は何か。展開図で、側面は長方形になる。",
            steps: [`円柱（底面の半径 ${rad}cm、高さ ${h}cm）`, `側面　2π×${rad}×${h}＝${side}π`, `底面　π×${sq(rad)}×2＝${base}π`, `表面積　${side}π+${base}π＝${side + base}π（cm²）`],
          };
        }),
        // 15w02b 投影図から円柱の体積（ワークシートの例題）
        t("15w02b", (r) => {
          const d = pick(r, [4, 6, 8, 10]), h = r(3, 9), rad = d / 2;
          return {
            q: `ある立体の立面図は、横 ${d}cm、たて ${h}cm の長方形で、平面図は、直径 ${d}cm の円である。この立体の体積は □π cm³。□は？`,
            ans: rad * rad * h,
            hint: "立面図が長方形、平面図が円になる立体は何か。",
            steps: [`円柱（底面の半径 ${rad}cm、高さ ${h}cm）`, `π×${sq(rad)}×${h}＝${rad * rad * h}π（cm³）`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 15d06a 円錐の側面のおうぎ形の中心角
        t("15d06a", (r) => {
          const l = pick(r, [6, 8, 9, 10, 12, 15, 18, 20]), rad = r(2, Math.floor((l * 3) / 4)), ans = (360 * rad) / l;
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐がある。側面のおうぎ形の中心角は何度か。`,
            ans,
            unit: "度",
            hint: "おうぎ形の弧の長さは、底面の円周に等しい。母線を半径とする円の円周とくらべよう。",
            steps: [`弧の長さ（底面の円周）　2π×${rad}＝${2 * rad}π`, `母線を半径とする円の円周　2π×${l}＝${2 * l}π`, `中心角　360°×$\\frac{${2 * rad}\\pi}{${2 * l}\\pi}$＝${ans}°`],
          };
        }),
        // 15d06b 同じ円錐の表面積
        t("15d06b", (r) => {
          const l = pick(r, [6, 8, 9, 10, 12, 15, 18, 20]), rad = r(2, Math.floor((l * 3) / 4)), side = rad * l, base = rad * rad;
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、表面積は □π cm²。□は？`,
            ans: side + base,
            hint: "表面積は、側面積と底面積の和。側面のおうぎ形の面積は、弧の長さから考える。",
            steps: [`側面積　π×${sq(l)}×$\\frac{${2 * rad}\\pi}{${2 * l}\\pi}$＝${side}π`, `底面積　π×${sq(rad)}＝${base}π`, `表面積　${side}π+${base}π＝${side + base}π（cm²）`],
          };
        }),
        // 15d07a 直角三角形を辺 AB を軸に1回転
        t("15d07a", (r) => {
          let p, q;
          do { p = r(2, 10); q = r(2, 10); } while (p === q || (p % 3 !== 0 && q % 3 !== 0));
          const ans = (q * q * p) / 3;
          return {
            q: `直角三角形 ABC は、∠B＝90° で、AB＝${p}cm、BC＝${q}cm である。この三角形を、辺 AB を軸として1回転させてできる立体の、体積は □π cm³。□は？`,
            ans,
            hint: "軸にした辺が高さ、もう一方の辺が底面の円の半径になる。",
            steps: [`できる立体は、底面の半径 BC＝${q}cm、高さ AB＝${p}cm の円錐。`, `$\\frac{1}{3}$×π×${sq(q)}×${p}＝${ans}π（cm³）`],
          };
        }),
        // 15d07b 辺 BC を軸に1回転
        t("15d07b", (r) => {
          let p, q;
          do { p = r(2, 10); q = r(2, 10); } while (p === q || (p % 3 !== 0 && q % 3 !== 0));
          const ans = (p * p * q) / 3;
          return {
            q: `直角三角形 ABC は、∠B＝90° で、AB＝${p}cm、BC＝${q}cm である。この三角形を、辺 BC を軸として1回転させてできる立体の、体積は □π cm³。□は？`,
            ans,
            hint: "軸にした辺が高さ、もう一方の辺が底面の円の半径になる。",
            steps: [`できる立体は、底面の半径 AB＝${p}cm、高さ BC＝${q}cm の円錐。`, `$\\frac{1}{3}$×π×${sq(p)}×${q}＝${ans}π（cm³）`],
          };
        }),
        // 15d07c 2つの体積のちがい（くらべる）
        t("15d07c", (r) => {
          let p, q;
          do { p = r(2, 10); q = r(2, 10); } while (p === q || (p % 3 !== 0 && q % 3 !== 0));
          const vAB = (q * q * p) / 3, vBC = (p * p * q) / 3, ans = Math.abs(vAB - vBC);
          return {
            q: `直角三角形 ABC は、∠B＝90° で、AB＝${p}cm、BC＝${q}cm である。この三角形を、辺 AB を軸として1回転させてできる立体と、辺 BC を軸として1回転させてできる立体とでは、体積は □π cm³ ちがう。□は？`,
            ans,
            hint: "それぞれの体積を求めて、くらべる。大きいほうから小さいほうをひく。",
            steps: [`辺 AB を軸　底面の半径 ${q}cm、高さ ${p}cm　$\\frac{1}{3}$×π×${sq(q)}×${p}＝${vAB}π`, `辺 BC を軸　底面の半径 ${p}cm、高さ ${q}cm　$\\frac{1}{3}$×π×${sq(p)}×${q}＝${vBC}π`, `${Math.max(vAB, vBC)}π−${Math.min(vAB, vBC)}π＝${ans}π（cm³）`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 15d08a 立方体の角の三角錐 A-BDE の体積
        t("15d08a", (r) => {
          const a = pick(r, [6, 12]), S = cuboid(a, a, a);
          const v = pick(r, Object.keys(S.V));
          const nb = S.E.filter((e) => e.includes(v)).map((e) => e.replace(v, "")).sort();
          const vol = tetraVol(S, [v, ...nb]), base = (a * a) / 2;
          return {
            q: `${intro(S).replace("直方体", "立方体")}がある。この立方体の 1辺は ${a}cm である。三角錐 ${v}-${nb.join("")}（4つの頂点 ${v}、${nb.join("、")} を結んでできる立体）の体積は何 cm³ か。`,
            ans: vol,
            unit: "cm³",
            hint: `頂点 ${v} に集まる 3つの辺は、たがいに垂直。${v}${nb[0]}${nb[1]} を底面、${v}${nb[2]} を高さと考える。`,
            steps: [`底面 △${v}${nb[0]}${nb[1]}（直角三角形）　$\\frac{1}{2}$×${a}×${a}＝${base}`, `高さ ${v}${nb[2]}＝${a}`, `体積　$\\frac{1}{3}$×${base}×${a}＝${vol}（cm³）`],
          };
        }),
        // 15d08b 立方体の4つの頂点を結んだ三角錐 BDEG の体積
        t("15d08b", (r) => {
          const a = pick(r, [3, 6, 9, 12]), S = cuboid(a, a, a);
          const parity = (v) => (((S.V[v][0] + S.V[v][1] + S.V[v][2]) / a) % 2 + 2) % 2;
          const all = Object.keys(S.V), odd = all.filter((v) => parity(v) === 1), even = all.filter((v) => parity(v) === 0);
          const [mine, others] = r(0, 1) ? [odd, even] : [even, odd];
          const vol = tetraVol(S, mine), corner = (a * a * a) / 6;
          return {
            q: `${intro(S).replace("直方体", "立方体")}がある。この立方体の 1辺は ${a}cm である。4つの頂点 ${mine.join("、")} を結んでできる三角錐 ${mine.join("")} の体積は何 cm³ か。`,
            ans: vol,
            unit: "cm³",
            hint: "立方体から、すみの三角錐を切りとった、のこりと考える。",
            steps: [
              `頂点 ${others.join("、")} のところの、すみの三角錐を 4つ切りとる。`,
              `すみの三角錐 1つ　$\\frac{1}{3}$×($\\frac{1}{2}$×${a}×${a})×${a}＝${corner}`,
              `立方体　${cb(a)}＝${a ** 3}`,
              `${a ** 3}−${corner}×4＝${vol}（cm³）`,
            ],
          };
        }),
        // 15d09a 円柱にちょうど入る球・円錐の体積
        t("15d09a", (r) => {
          const which = pick(r, ["円柱", "球", "円錐"]);
          const rad = which === "円柱" ? r(2, 9) : pick(r, [3, 6, 9]), h = 2 * rad;
          const V = { 円柱: 2 * rad ** 3, 球: (4 * rad ** 3) / 3, 円錐: (2 * rad ** 3) / 3 };
          const ex = {
            円柱: `π×${sq(rad)}×${h}＝${V.円柱}π`,
            球: `$\\frac{4}{3}$π×${cb(rad)}＝${V.球}π`,
            円錐: `$\\frac{1}{3}$×π×${sq(rad)}×${h}＝${V.円錐}π`,
          };
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm の円柱がある。この円柱にちょうど入る球と、この円柱と底面・高さが同じ円錐を考える。${which}の体積は □π cm³。□は？`,
            ans: V[which],
            hint: which === "球" ? "ちょうど入る球の半径は、円柱の底面の半径と同じ。" : which === "円錐" ? "円錐は、円柱と底面・高さが同じ。" : "円柱の体積は、底面積×高さ。",
            steps: [`${which}の体積　${ex[which]}（cm³）`],
          };
        }),
        // 15d09b 体積の比 円錐：球：円柱 ＝ 1：2：3 を使う
        t("15d09b", (r) => {
          const kinds = Object.keys(RATIO), g = pick(r, kinds), tg = pick(r, kinds.filter((k) => k !== g)), k = r(4, 40);
          const given = RATIO[g] * k, ans = RATIO[tg] * k;
          return {
            q: `円柱と、この円柱にちょうど入る球と、この円柱と底面・高さが同じ円錐がある。${g}の体積が ${given}π cm³ のとき、${tg}の体積は □π cm³。□は？`,
            ans,
            hint: "円錐：球：円柱 の体積の比は 1：2：3。",
            steps: [`円錐：球：円柱 ＝ 1：2：3。比の 1 にあたる体積を ${k}π とすると、${g}は ${RATIO[g]}×${k}π＝${given}π。`, `${tg}は ${RATIO[tg]}×${k}π＝${ans}π（cm³）`],
          };
        }),
        // 15q05 球がちょうど入る円柱の体積から、球の体積（チャレンジ）
        t("15q05", (r) => {
          const rad = pick(r, [3, 6, 9, 12]), cyl = 2 * rad ** 3, ans = (4 * rad ** 3) / 3;
          return {
            q: `球がちょうど入る円柱がある。この円柱の体積が ${cyl}π cm³ のとき、球の体積は □π cm³。□は？`,
            ans,
            hint: "球の半径を r とすると、円柱は、底面の半径 r、高さ 2r。円柱の体積から r を求めよう。",
            steps: [`球の半径を r cm とすると、円柱は、底面の半径 r、高さ 2r。`, `円柱の体積　π×r²×2r＝$2\\pi r^3$＝${cyl}π　より　r³＝${rad ** 3}、r＝${rad}`, `球の体積　$\\frac{4}{3}$π×${cb(rad)}＝${ans}π（cm³）`],
          };
        }),
      ],
    },
  }),
];

/** 四面体の体積（立体 S の頂点 4つ。座標から、スカラー三重積で計算） */
function tetraVol(S, vs) {
  const [p0, p1, p2, p3] = vs.map((v) => S.V[v]);
  const u = p1.map((x, i) => x - p0[i]), v = p2.map((x, i) => x - p0[i]), w = p3.map((x, i) => x - p0[i]);
  const det = u[0] * (v[1] * w[2] - v[2] * w[1]) - u[1] * (v[0] * w[2] - v[2] * w[0]) + u[2] * (v[0] * w[1] - v[1] * w[0]);
  return round(Math.abs(det) / 6, 6);
}

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 第15時は、演習プリント 9問・小テスト 5問のすべてを移した（「すべて答えよう」は、4択に直した）
