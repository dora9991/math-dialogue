// ============================================================
// kukan-12.js — 空間図形 第12時「球の表面積と体積を求めよう」
//   ikkan の演習プリント（kukan-12.dr.1〜11）・小テスト（kukan-12.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「12」＋ d（演習）／q（小テスト）／w（ワークシート）＋ 番号（＋ a, b…）。例：12d06b ＝ kukan-12.dr.6 の2つ目
//   答えは、すべて式で計算している。π が出る答えは「□π cm²（cm³）。□は？」の □（整数か、約分した分数＝fracAns）。
//   体積は 4/3 が出るので、半径が 3 の倍数なら整数、そうでなければ分数（256/3 など）になる。
// ============================================================
import { t, pick, choices4, shuffle, fracAns, fracTex, reduce, gcd } from "../kit.js";
import { unit } from "../kukan-kit.js";

/** π の係数 n/d の TeX：36\pi、\frac{256}{3}\pi */
const piTex = (n, d = 1) => {
  const [a, b] = reduce(n, d);
  return b === 1 ? (a === 1 ? "\\pi" : `${a}\\pi`) : `\\frac{${a}}{${b}}\\pi`;
};
/** 3 の倍数の半径（3〜）をつくる */
const by3 = (r, lo, hi) => 3 * r(lo, hi);

// ── 球の表面積・体積（半径 rad、または直径 2rad を与える） ──
const sphereAsk = (rad, which, diam) => {
  const given = diam ? `直径 ${2 * rad}cm` : `半径 ${rad}cm`;
  const pre = diam ? [`半径は ${2 * rad}÷2 = ${rad}（cm）`] : [];
  const hd = diam ? "球の公式の $r$ は、直径かな、半径かな。" : "";
  if (which === "S") {
    return {
      q: `${given} の球の表面積は □π cm²。□は？`,
      ans: 4 * rad * rad,
      hint: `${hd}球の表面積は $4\\pi r^2$。`,
      steps: [...pre, `$S = 4\\pi r^2 = 4\\times\\pi\\times ${rad}^2 = ${4 * rad * rad}\\pi$（cm²）`],
    };
  }
  return {
    q: `${given} の球の体積は □π cm³。□は？`,
    ans: fracAns(4 * rad ** 3, 3),
    hint: `${hd}球の体積は $\\frac{4}{3}\\pi r^3$。`,
    steps: [...pre, `$V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3}\\times\\pi\\times ${rad}^3 = ${piTex(4 * rad ** 3, 3)}$（cm³）`],
  };
};
/** 半球の体積（曲面だけでなく、球の半分） */
const hemiVol = (rad) => ({
  q: `半径 ${rad}cm の半球の体積は □π cm³。□は？`,
  ans: fracAns(2 * rad ** 3, 3),
  hint: "半球の体積は、同じ半径の球の体積の半分。",
  steps: [`$V = \\frac{4}{3}\\pi\\times ${rad}^3\\times\\frac{1}{2} = ${piTex(2 * rad ** 3, 3)}$（cm³）`],
});

// 水そうに球をしずめる（dr.11）：底面の半径 R、球の半径 rad、水面が上がる高さが「整数か、分母 3 以下の分数（1/2 cm 以上）」になる組
const SINK = [];
for (let rad = 2; rad <= 9; rad++) for (let R = rad + 1; R <= 15; R++) {
  const [n, d] = reduce(4 * rad ** 3, 3 * R * R);
  if (d <= 3 && n / d >= 0.5) SINK.push([R, rad]);
}

export const UNITS = [
  unit("12", {
    name: "球の表面積と体積",
    desc: "S＝4πr²、V＝4/3 πr³",
    prereqs: ["J1-kk11", "J1-k4"],
    points: [
      "半径 $r$ の球の表面積は $S=4\\pi r^2$、体積は $V=\\frac{4}{3}\\pi r^3$。",
      "球の体積は、ちょうど入る円柱の体積の $\\frac{2}{3}$。球の表面積は、ちょうど入る円柱の側面積と等しい。",
      "直径がわかっているときは、先に半径（直径÷2）を求めてから、公式に入れる。半球の表面積は、曲面（球の半分）に、平らな円の面積をたす。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 12d01a 半径がわかる球の表面積
        t("12d01a", (r) => sphereAsk(r(2, 9), "S", false)),
        // 12d01b 半径が 3 の倍数の球の体積（整数）
        t("12d01b", (r) => sphereAsk(by3(r, 1, 5), "V", false)),
        // 12d01c 半径が 3 の倍数でない球の体積（分数：256/3 など）
        t("12d01c", (r) => sphereAsk(pick(r, [2, 4, 5, 7, 8]), "V", false)),
        // 12d02 半径の大きい球の表面積・体積
        t("12d02", (r) => sphereAsk(r(6, 12), pick(r, ["S", "V"]), false)),
        // 12d03 直径がわかる球の表面積・体積（先に半径を求める）
        t("12d03", (r) => {
          const which = pick(r, ["S", "V"]);
          return sphereAsk(which === "V" ? by3(r, 1, 5) : r(3, 15), which, true);
        }),
        // 12q01 半径 2cm の球の表面積（小テスト）
        t("12q01", (r) => sphereAsk(r(2, 6), "S", false)),
        // 12q03 直径 10cm の球の表面積（小テスト）
        t("12q03", (r) => sphereAsk(r(2, 8), "S", true)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 12d04 半球の体積
        t("12d04", (r) => hemiVol(r(3, 9))),
        // 12d05 半球の表面積（平らな面もふくむ）
        t("12d05", (r) => {
          const rad = r(2, 9);
          return {
            q: `半径 ${rad}cm の半球の表面積（平らな面もふくむ）は □π cm²。□は？`,
            ans: 3 * rad * rad,
            hint: "半球の表面を、ひとつずつ数えよう。曲面のほかに、どんな面があるかな。",
            steps: [
              `曲面 $4\\pi\\times ${rad}^2\\times\\frac{1}{2} = ${2 * rad * rad}\\pi$`,
              `平らな面 $\\pi\\times ${rad}^2 = ${rad * rad}\\pi$`,
              `$${2 * rad * rad}\\pi + ${rad * rad}\\pi = ${3 * rad * rad}\\pi$（cm²）`,
            ],
          };
        }),
        // 12d06a 球がちょうど入る円柱の体積
        t("12d06a", (r) => {
          const rad = r(2, 9);
          return {
            q: `半径 ${rad}cm の球が、ちょうど入る円柱がある（球は、円柱の上下の底面と側面にふれる）。この円柱の体積は □π cm³。□は？`,
            ans: 2 * rad ** 3,
            hint: "球がちょうど入る円柱の、底面の半径と高さを、球の半径や直径で考えよう。",
            steps: [`円柱は、底面の半径 ${rad}cm、高さは球の直径 ${2 * rad}cm`, `$V = \\pi\\times ${rad}^2\\times ${2 * rad} = ${2 * rad ** 3}\\pi$（cm³）`],
          };
        }),
        // 12d06b 円柱と球のすきまの体積
        t("12d06b", (r) => {
          const rad = r(0, 9) < 7 ? by3(r, 1, 3) : r(2, 8);
          return {
            q: `半径 ${rad}cm の球が、ちょうど入る円柱がある（球は、円柱の上下の底面と側面にふれる）。円柱と球の間のすきまの体積は □π cm³。□は？`,
            ans: fracAns(2 * rad ** 3, 3),
            hint: "（円柱の体積）−（球の体積）。ちょうど入る円柱の、底面の半径と高さは、球の何にあたるかな。",
            steps: [
              `円柱 $\\pi\\times ${rad}^2\\times ${2 * rad} = ${2 * rad ** 3}\\pi$`,
              `球 $\\frac{4}{3}\\pi\\times ${rad}^3 = ${piTex(4 * rad ** 3, 3)}$`,
              `すきま $${2 * rad ** 3}\\pi - ${piTex(4 * rad ** 3, 3)} = ${piTex(2 * rad ** 3, 3)}$（cm³）`,
            ],
          };
        }),
        // 12w01 学習課題：球の体積は、ちょうど入る円柱の何分のいくつか
        t("12w01", (r) => {
          const rad = r(2, 8);
          return {
            q: `半径 ${rad}cm の球が、ちょうど入る円柱がある（球は、円柱の上下の底面と側面にふれる）。球の体積は、この円柱の体積の何分のいくつか。`,
            ans: fracAns(4 * rad ** 3, 3 * 2 * rad ** 3),
            hint: "円柱の体積と、球の体積を、それぞれ求めて比べよう。",
            steps: [
              `円柱 $\\pi\\times ${rad}^2\\times ${2 * rad} = ${2 * rad ** 3}\\pi$、球 $\\frac{4}{3}\\pi\\times ${rad}^3 = ${piTex(4 * rad ** 3, 3)}$`,
              `$${piTex(4 * rad ** 3, 3)}\\div(${2 * rad ** 3}\\pi) = \\frac{2}{3}$`,
            ],
          };
        }),
        // 12q02 半径 2cm の球の体積（小テスト）
        t("12q02", (r) => sphereAsk(r(2, 6), "V", false)),
        // 12q04 半径 3cm の半球の体積（小テスト）
        t("12q04", (r) => hemiVol(by3(r, 1, 4))),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 12d07a 半径を k 倍にすると、表面積は何倍
        t("12d07a", (r) => {
          const k = r(2, 5);
          return {
            q: `球の半径を ${k}倍にすると、表面積は何倍になるか。`,
            ans: k * k,
            unit: "倍",
            hint: "半径 $r$ の球の表面積は $4\\pi r^2$。半径が変わると、$r^2$ の部分がどう変わるかな。",
            steps: [`もとの表面積は $4\\pi r^2$`, `半径が ${k}倍なら $4\\pi(${k}r)^2 = ${k * k}\\times 4\\pi r^2$`, `表面積は ${k * k}倍。`],
          };
        }),
        // 12d07b 半径を k 倍にすると、体積は何倍
        t("12d07b", (r) => {
          const k = r(2, 5);
          return {
            q: `球の半径を ${k}倍にすると、体積は何倍になるか。`,
            ans: k ** 3,
            unit: "倍",
            hint: "半径 $r$ の球の体積は $\\frac{4}{3}\\pi r^3$。半径が変わると、$r^3$ の部分がどう変わるかな。",
            steps: [`もとの体積は $\\frac{4}{3}\\pi r^3$`, `半径が ${k}倍なら $\\frac{4}{3}\\pi(${k}r)^3 = ${k ** 3}\\times\\frac{4}{3}\\pi r^3$`, `体積は ${k ** 3}倍。`],
          };
        }),
        // 12d08a 表面積から、球の半径
        t("12d08a", (r) => {
          const rad = r(2, 9);
          return {
            q: `表面積が ${4 * rad * rad}π cm² の球の半径は何 cm か。`,
            ans: rad,
            unit: "cm",
            hint: "半径を $r$ cm として、表面積の公式 $4\\pi r^2$ を使った式をつくろう。",
            steps: [`半径を $r$ cm とすると　$4\\pi r^2 = ${4 * rad * rad}\\pi$`, `$r^2 = ${rad * rad}$`, `$r > 0$ だから　$r = ${rad}$（cm）`],
          };
        }),
        // 12d08b 表面積から、球の体積
        t("12d08b", (r) => {
          const rad = r(2, 9);
          return {
            q: `表面積が ${4 * rad * rad}π cm² の球の体積は □π cm³。□は？`,
            ans: fracAns(4 * rad ** 3, 3),
            hint: "まず、表面積の公式 $4\\pi r^2$ から、半径を求めよう。",
            steps: [`半径を $r$ cm とすると　$4\\pi r^2 = ${4 * rad * rad}\\pi$　より　$r = ${rad}$`, `$V = \\frac{4}{3}\\pi\\times ${rad}^3 = ${piTex(4 * rad ** 3, 3)}$（cm³）`],
          };
        }),
        // 12d09 アイスクリームがとけたら、コーンからあふれるか
        t("12d09", (r) => {
          const rad = r(2, 6), kind = pick(r, ["eq", "over", "under"]);
          const h = kind === "eq" ? 4 * rad : kind === "over" ? 4 * rad - r(1, rad) : 4 * rad + r(1, 3);
          const ice = 4 * rad ** 3, cone = rad * rad * h;   // どちらも「÷3 して π をかける」と体積
          const OVER = "コーンからあふれる", EQ = "ちょうどいっぱいになる（あふれない）", UNDER = "いっぱいにならず、すきまが残る";
          const ans = ice === cone ? EQ : ice > cone ? OVER : UNDER;
          return {
            q: `半径 ${rad}cm の球の形のアイスクリームが、底面の半径 ${rad}cm、深さ ${h}cm の円錐の形のコーンの上にのっている。アイスクリームが全部とけたとき、どうなるか。ただし、アイスクリームの体積は、とけても変わらないものとする。`,
            ans,
            choices: choices4(r, ans, [OVER, EQ, UNDER].filter((x) => x !== ans)),
            hint: "とけたアイスクリームの体積と、コーンの体積を、それぞれ求めて比べよう。",
            steps: [
              `アイスクリーム $\\frac{4}{3}\\pi\\times ${rad}^3 = ${piTex(ice, 3)}$（cm³）`,
              `コーン $\\frac{1}{3}\\pi\\times ${rad}^2\\times ${h} = ${piTex(cone, 3)}$（cm³）`,
              ice === cone ? "体積が等しいので、ちょうどいっぱいになる。" : ice > cone ? "アイスクリームのほうが大きいので、あふれる。" : "アイスクリームのほうが小さいので、すきまが残る。",
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 12d10a 円柱ア・円錐イ・球ウのうち、2つを比べて何倍か（体積を求めて、くらべる）
        t("12d10a", (r) => {
          const rad = r(2, 6), [x, y] = shuffle(r, ["ア", "イ", "ウ"]).slice(0, 2);
          const V = { ア: [2 * rad ** 3, 1], イ: [2 * rad ** 3, 3], ウ: [4 * rad ** 3, 3] };   // 体積 ＝ (n/d) π
          const how = {
            ア: `ア $\\pi\\times ${rad}^2\\times ${2 * rad}`,
            イ: `イ $\\frac{1}{3}\\times\\pi\\times ${rad}^2\\times ${2 * rad}`,
            ウ: `ウ $\\frac{4}{3}\\pi\\times ${rad}^3`,
          };
          const ans = fracAns(V[x][0] * V[y][1], V[x][1] * V[y][0]);
          return {
            q: `半径 ${rad}cm の円柱ア（高さ ${2 * rad}cm）、アと同じ底面・同じ高さの円錐イ、半径 ${rad}cm の球ウがある。${x}の体積は、${y}の体積の何倍か。`,
            ans,
            unit: "倍",
            hint: "円柱・円錐・球の体積の公式を思い出して、2つの体積を、それぞれ □π の形で求めよう。",
            steps: [`${how[x]} = ${piTex(...V[x])}$、${how[y]} = ${piTex(...V[y])}$`, `$${piTex(...V[x])}\\div(${piTex(...V[y])}) = ${fracTex(V[x][0] * V[y][1], V[x][1] * V[y][0])}$（倍）`],
          };
        }),
        // 12d10b ア・イ・ウの体積の比（4択）
        t("12d10b", (r) => {
          const rad = r(2, 6), order = shuffle(r, ["ア", "イ", "ウ"]);
          const vol = { ア: 6, イ: 2, ウ: 4 }, g = gcd(gcd(vol.ア, vol.イ), vol.ウ);   // 比は 3：1：2
          const fmt = (a) => a.join("：");
          const ans = fmt(order.map((x) => vol[x] / g));
          const perms = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]].map(fmt).filter((x) => x !== ans);
          return {
            q: `半径 ${rad}cm の円柱ア（高さ ${2 * rad}cm）、アと同じ底面・同じ高さの円錐イ、半径 ${rad}cm の球ウがある。${order.join("：")} の体積の比を、もっとも簡単な整数の比で表すと、どれか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, perms)),
            hint: "ア・イ・ウの体積を、それぞれ □π の形で求めて、比べよう。",
            steps: [
              `ア $\\pi\\times ${rad}^2\\times ${2 * rad} = ${2 * rad ** 3}\\pi$、イ $${piTex(2 * rad ** 3, 3)}$、ウ $${piTex(4 * rad ** 3, 3)}$`,
              `ア：イ：ウ ＝ 3：1：2（もっとも簡単な整数の比）だから、${order.join("：")} ＝ ${ans}`,
            ],
          };
        }),
        // 12d11 水そうに球をしずめたときの、水面の上がり
        t("12d11", (r) => {
          const [R, rad] = pick(r, SINK), V = 4 * rad ** 3, ans = fracAns(V, 3 * R * R);
          return {
            q: `底面の半径が ${R}cm の円柱の形の水そうに、水が入っている。この中に、半径 ${rad}cm の鉄の球を完全にしずめると、水面は何 cm 上がるか。ただし、水はあふれないものとする。`,
            ans,
            unit: "cm",
            hint: "球をしずめると、水面が上がる。上がった分の水の体積は、何と等しいかな。",
            steps: [
              `球の体積 $\\frac{4}{3}\\pi\\times ${rad}^3 = ${piTex(V, 3)}$（cm³）`,
              `上がる高さを $x$ cm として　$\\pi\\times ${R}^2\\times x = ${piTex(V, 3)}$`,
              `$${R * R}x = ${fracTex(V, 3)}$　より　$x = ${fracTex(V, 3 * R * R)}$（cm）`,
            ],
          };
        }),
        // 12q05 表面積から、球の体積（チャレンジ）
        t("12q05", (r) => {
          const rad = r(2, 9);
          return {
            q: `表面積が ${4 * rad * rad}π cm² の球の、体積は □π cm³。□は？`,
            ans: fracAns(4 * rad ** 3, 3),
            hint: "半径を $r$ cm として、表面積から $r$ を求めよう。そのあとで、体積の公式に入れる。",
            steps: [`半径を $r$ cm とすると　$4\\pi r^2 = ${4 * rad * rad}\\pi$　$r^2 = ${rad * rad}$　$r = ${rad}$`, `$V = \\frac{4}{3}\\pi\\times ${rad}^3 = ${piTex(4 * rad ** 3, 3)}$（cm³）`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第12時は、演習プリント 11問・小テスト 5問のすべてを移した（図は、文章にした）
