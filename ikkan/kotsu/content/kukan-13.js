// ============================================================
// kukan-13.js — 空間図形 第13時「表面積と体積を、たしかに求められるようになろう」
//   ikkan の演習プリント（kukan-13.dr.1〜11）・小テスト（kukan-13.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「13」＋ d（演習）／q（小テスト）／w（ワークシート）＋ 番号（＋ a, b…）。例：13d07a ＝ kukan-13.dr.7 の1つ目
//   答えは、すべて式で計算している。π が出る答えは「□π cm²（cm³）。□は？」の □（整数か、約分した分数＝fracAns）。
//   「体積と表面積」の2つを聞く問題は、1つずつ聞く（テンプレートの中で切りかえる、または a・b の2つにした）。
// ============================================================
import { t, pick, choices4, fracAns, fracTex, reduce } from "../kit.js";
import { unit } from "../kukan-kit.js";

/** 条件に合う値が出るまで gen() をくり返す（見つからなければ null → skip） */
const find = (gen, ok, tries = 400) => {
  for (let i = 0; i < tries; i++) { const v = gen(); if (ok(v)) return v; }
  return null;
};
/** 円錐の [底面の半径, 高さ, 母線]（三平方の定理の、整数の組。半径か高さが 3 の倍数。答えが大きくなりすぎない組） */
const CONES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13]];
/** 円柱の上にのせる円錐用（半径が大きすぎない組） */
const CONES_S = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13]];
/** 円錐の側面積（π の係数）を、おうぎ形の式で説明する行 */
const slantStep = (a, l) => `側面積 $\\pi\\times ${l}^2\\times\\frac{2\\pi\\times ${a}}{2\\pi\\times ${l}} = ${a * l}\\pi$`;

// ── 同じ型の部品 ──
/** 底面の半径 a、高さ h の円錐の体積（a²h が 3 の倍数） */
const coneVol = (r, lo, hi, hlo, hhi) => {
  const v = find(() => [r(lo, hi), r(hlo, hhi)], ([a, h]) => (a * a * h) % 3 === 0);
  if (!v) return { skip: true };
  const [a, h] = v, c = (a * a * h) / 3;
  return {
    q: `底面の半径が ${a}cm、高さが ${h}cm の円錐の体積は □π cm³。□は？`,
    ans: c,
    hint: "円錐の体積は $\\frac{1}{3}\\pi r^2 h$（$r$ は底面の半径、$h$ は高さ）。",
    steps: [`$V = \\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${c}\\pi$（cm³）`],
  };
};
/** 円柱の体積 */
const cylVol = (a, h) => ({
  q: `底面の半径が ${a}cm、高さが ${h}cm の円柱の体積は □π cm³。□は？`,
  ans: a * a * h,
  hint: "円柱の体積は、底面積×高さ。底面は半径 $r$ の円で、面積は $\\pi r^2$。",
  steps: [`$V = \\pi\\times ${a}^2\\times ${h} = ${a * a * h}\\pi$（cm³）`],
});

// ── 容器くらべ（dr.9）：円柱の容器と円錐の容器を、A・B にふりわける ──
const containers = (r) => {
  const v = find(
    () => [r(3, 7), r(4, 10), r(3, 8), r(4, 12)],
    ([r1, h1, r2, h2]) => (r2 * r2 * h2) % 3 === 0 && Math.abs(r1 * r1 * h1 - (r2 * r2 * h2) / 3) >= 4,
  );
  if (!v) return null;
  const [r1, h1, r2, h2] = v;
  const cyl = { shape: "円柱", rad: r1, h: h1, vol: r1 * r1 * h1 }, cone = { shape: "円錐", rad: r2, h: h2, vol: (r2 * r2 * h2) / 3 };
  const [A, B] = r(0, 1) ? [cyl, cone] : [cone, cyl];
  const text = `容器 A は、底面の半径 ${A.rad}cm、高さ ${A.h}cm の${A.shape}。容器 B は、底面の半径 ${B.rad}cm、高さ ${B.h}cm の${B.shape}。`;
  const how = (c) => (c.shape === "円柱" ? `$\\pi\\times ${c.rad}^2\\times ${c.h} = ${c.vol}\\pi$` : `$\\frac{1}{3}\\times\\pi\\times ${c.rad}^2\\times ${c.h} = ${c.vol}\\pi$`);
  const bigName = A.vol > B.vol ? "A" : "B", big = A.vol > B.vol ? A : B, small = A.vol > B.vol ? B : A;
  return { text, A, B, big, small, bigName, smallName: bigName === "A" ? "B" : "A", stepsAB: [`A ${how(A)}（cm³）`, `B ${how(B)}（cm³）`] };
};

// ── 直角三角形を、辺を軸に回転（dr.10） ──
const rotation = (r) => {
  const [rad, h, l] = pick(r, CONES), ax = r(0, 1) ? "AB" : "BC";   // AB を軸＝半径 BC・高さ AB ／ BC を軸＝半径 AB・高さ BC
  const [p, q] = ax === "AB" ? [h, rad] : [rad, h];   // AB＝p、BC＝q
  return {
    text: `AB＝${p}cm、BC＝${q}cm、CA＝${l}cm、∠B＝90° の直角三角形 ABC を、辺 ${ax} を軸として1回転させる。`,
    ax, rad, h, l,
    how: `${ax} を軸にするので、高さは ${ax}＝${h}cm、底面の半径は、もう一方の辺の ${rad}cm、母線は CA＝${l}cm の円錐ができる。`,
  };
};

// ── 円柱の水そうに、円錐のおもりをしずめる（dr.11）：水面の上がりが「整数か、分母 4 以下の分数」になる組 ──
const CONE_SINK = [];
for (let R = 3; R <= 8; R++) for (let a = 2; a < R; a++) for (let h = 3; h <= 12; h++) {
  if ((a * a * h) % 3 === 0 && reduce(a * a * h, 3 * R * R)[1] <= 4 && (a * a * h) / (3 * R * R) >= 0.5) CONE_SINK.push([R, a, h]);
}

export const UNITS = [
  unit("13", {
    name: "表面積と体積の習熟",
    desc: "柱・錐・球・組み合わせた立体",
    prereqs: ["J1-kk12", "J1-k3", "J1-k4"],
    points: [
      "式を書く前に、柱か、錐か、球かを確かめる。体積は 柱体 $V=Sh$、錐体 $V=\\frac{1}{3}Sh$、球 $V=\\frac{4}{3}\\pi r^3$。",
      "表面積は 柱体＝側面積＋底面積×2、錐体＝側面積＋底面積×1、球は $S=4\\pi r^2$。直径がわかるときは、先に半径を求める。",
      "円錐では、体積に使うのは高さ、側面積に使うのは母線。組み合わせた立体では、はり合わせた面は表面積にふくめない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 13d01 直方体の体積・表面積
        t("13d01", (r) => {
          const a = r(2, 9), b = r(2, 9), c = r(2, 9), V = a * b * c;
          if (r(0, 1)) {
            return {
              q: `縦 ${a}cm、横 ${b}cm、高さ ${c}cm の直方体の体積は？`,
              ans: V,
              unit: "cm³",
              hint: "直方体の体積は、縦×横×高さ。",
              steps: [`$V = ${a}\\times ${b}\\times ${c} = ${V}$（cm³）`],
            };
          }
          const side = (a + b) * 2 * c, S = side + a * b * 2;
          return {
            q: `縦 ${a}cm、横 ${b}cm、高さ ${c}cm の直方体の表面積は？`,
            ans: S,
            unit: "cm²",
            hint: "表面積は、側面積＋底面積×2。側面は、底面のまわりの長さ×高さ。",
            steps: [`側面積 $(${a}+${b})\\times 2\\times ${c} = ${side}$`, `底面積 $${a}\\times ${b} = ${a * b}$ が 2つ`, `表面積 $${side} + ${a * b * 2} = ${S}$（cm²）`],
          };
        }),
        // 13d02 円柱の体積・表面積
        t("13d02", (r) => {
          const a = r(2, 6), h = r(2, 9);
          if (r(0, 1)) return cylVol(a, h);
          const side = 2 * a * h, S = side + 2 * a * a;
          return {
            q: `底面の半径が ${a}cm、高さが ${h}cm の円柱の表面積は □π cm²。□は？`,
            ans: S,
            hint: "表面積は、側面積＋底面積×2。側面を開くと、長方形になる。",
            steps: [`側面積 $2\\pi\\times ${a}\\times ${h} = ${side}\\pi$`, `底面積 $\\pi\\times ${a}^2 = ${a * a}\\pi$ が 2つ`, `表面積 $${side}\\pi + ${2 * a * a}\\pi = ${S}\\pi$（cm²）`],
          };
        }),
        // 13d03a 円錐の体積
        t("13d03a", (r) => coneVol(r, 2, 7, 2, 9)),
        // 13d03b 正四角錐の体積
        t("13d03b", (r) => {
          const v = find(() => [r(2, 9), r(2, 9)], ([a, h]) => (a * a * h) % 3 === 0);
          if (!v) return { skip: true };
          const [a, h] = v, ans = (a * a * h) / 3;
          return {
            q: `底面が 1辺 ${a}cm の正方形で、高さが ${h}cm の正四角錐の体積は？`,
            ans,
            unit: "cm³",
            hint: "錐体の体積は、底面積×高さ×$\\frac{1}{3}$。",
            steps: [`底面積 $${a}\\times ${a} = ${a * a}$（cm²）`, `$V = \\frac{1}{3}\\times ${a * a}\\times ${h} = ${ans}$（cm³）`],
          };
        }),
        // 13q01 円柱の体積（小テスト）
        t("13q01", (r) => cylVol(r(2, 6), r(2, 8))),
        // 13q02 円錐の体積（小テスト）
        t("13q02", (r) => coneVol(r, 2, 6, 2, 8)),
        // 13q03 球の表面積（小テスト）
        t("13q03", (r) => {
          const a = r(2, 9);
          return {
            q: `半径 ${a}cm の球の表面積は □π cm²。□は？`,
            ans: 4 * a * a,
            hint: "球の表面積は $4\\pi r^2$。",
            steps: [`$S = 4\\pi r^2 = 4\\times\\pi\\times ${a}^2 = ${4 * a * a}\\pi$（cm²）`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 13d04 母線がわかる円錐の表面積・体積（使う長さを見分ける）
        t("13d04", (r) => {
          const [a, h, l] = pick(r, CONES), side = `底面の半径 ${a}cm、高さ ${h}cm、母線の長さ ${l}cm の円錐`;
          if (r(0, 1)) {
            return {
              q: `${side}の表面積は □π cm²。□は？`,
              ans: a * l + a * a,
              hint: "表面積は、側面積＋底面積。円錐の側面は、おうぎ形。おうぎ形の半径になるのは、どの長さかな。母線は、頂点から底面の円周までの、ななめの線。",
              steps: [slantStep(a, l) + `（母線 ${l}cm を使う）`, `底面積 $\\pi\\times ${a}^2 = ${a * a}\\pi$`, `表面積 $${a * l}\\pi + ${a * a}\\pi = ${a * l + a * a}\\pi$（cm²）`],
            };
          }
          const c = (a * a * h) / 3;
          return {
            q: `${side}の体積は □π cm³。□は？`,
            ans: c,
            hint: "円錐の体積の公式 $\\frac{1}{3}\\pi r^2 h$ に出てくる長さは、何と何だったかな。母線は、頂点から底面の円周までの、ななめの線。",
            steps: [`体積に使うのは、半径 ${a}cm と高さ ${h}cm（母線 ${l}cm は使わない）`, `$V = \\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${c}\\pi$（cm³）`],
          };
        }),
        // 13d05 半球の体積・表面積
        t("13d05", (r) => {
          if (r(0, 1)) {
            const a = 3 * r(1, 3);
            return {
              q: `半径 ${a}cm の半球の体積は □π cm³。□は？`,
              ans: (2 * a ** 3) / 3,
              hint: "半球の体積は、同じ半径の球の体積の半分。",
              steps: [`$V = \\frac{4}{3}\\pi\\times ${a}^3\\times\\frac{1}{2} = ${(2 * a ** 3) / 3}\\pi$（cm³）`],
            };
          }
          const a = r(2, 9);
          return {
            q: `半径 ${a}cm の半球の表面積（平らな面もふくむ）は □π cm²。□は？`,
            ans: 3 * a * a,
            hint: "半球の表面は、曲面（球の表面積の半分）と、平らな面（円）の 2つ。",
            steps: [`曲面 $4\\pi\\times ${a}^2\\times\\frac{1}{2} = ${2 * a * a}\\pi$`, `平らな面 $\\pi\\times ${a}^2 = ${a * a}\\pi$`, `表面積 $${2 * a * a}\\pi + ${a * a}\\pi = ${3 * a * a}\\pi$（cm²）`],
          };
        }),
        // 13d06 正四角錐の表面積・体積（側面の三角形の高さが与えられる）
        t("13d06", (r) => {
          const [x, y, z] = pick(r, [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13]]), a = 2 * x, h = y, s = z;   // 底面の1辺 a、高さ h、側面の三角形の高さ s
          const side = (a * s * 4) / 2, base = a * a;
          const head = `底面が 1辺 ${a}cm の正方形、高さが ${h}cm、側面の三角形の高さが ${s}cm の正四角錐の`;
          if (r(0, 1)) {
            return {
              q: `${head}表面積は？`,
              ans: side + base,
              unit: "cm²",
              hint: "表面積は、側面積＋底面積。側面は、合同な二等辺三角形が集まった形。三角形の面積は、底辺×高さ÷2。",
              steps: [`側面積 $\\frac{1}{2}\\times ${a}\\times ${s}\\times 4 = ${side}$`, `底面積 $${a}\\times ${a} = ${base}$`, `表面積 $${side} + ${base} = ${side + base}$（cm²）`],
            };
          }
          const V = (base * h) / 3;
          return {
            q: `${head}体積は？`,
            ans: V,
            unit: "cm³",
            hint: "錐体の体積は、何と何から求めたかな。",
            steps: [`体積に使うのは、底面積と高さ（側面の三角形の高さ ${s}cm は使わない）`, `底面積 $${a}\\times ${a} = ${base}$`, `$V = \\frac{1}{3}\\times ${base}\\times ${h} = ${V}$（cm³）`],
          };
        }),
        // 13q04 母線がわかる円錐の表面積（小テスト）
        t("13q04", (r) => {
          const [a, h, l] = pick(r, CONES);
          return {
            q: `底面の半径が ${a}cm、高さが ${h}cm、母線の長さが ${l}cm の円錐の表面積は □π cm²。□は？`,
            ans: a * l + a * a,
            hint: "表面積は、側面積＋底面積。円錐の側面は、おうぎ形。おうぎ形の半径になるのは、どの長さかな。母線は、頂点から底面の円周までの、ななめの線。",
            steps: [slantStep(a, l) + `（母線 ${l}cm を使う）`, `底面積 $\\pi\\times ${a}^2 = ${a * a}\\pi$`, `表面積 $${a * l}\\pi + ${a * a}\\pi = ${a * l + a * a}\\pi$（cm²）`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 13d07a 円柱の上に円錐をのせた立体：体積
        t("13d07a", (r) => {
          const [a, h, l] = pick(r, CONES_S), H = r(3, 8), cyl = a * a * H, cone = (a * a * h) / 3;
          return {
            q: `底面の半径 ${a}cm、高さ ${H}cm の円柱の上に、底面の半径 ${a}cm、高さ ${h}cm、母線の長さ ${l}cm の円錐をのせた立体がある。この立体の体積は □π cm³。□は？`,
            ans: cyl + cone,
            hint: "（円柱の体積）＋（円錐の体積）。円錐の体積の公式に出てくる長さは、何と何だったかな。",
            steps: [`円柱 $\\pi\\times ${a}^2\\times ${H} = ${cyl}\\pi$`, `円錐（母線 ${l}cm は使わない） $\\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${cone}\\pi$`, `体積 $${cyl}\\pi + ${cone}\\pi = ${cyl + cone}\\pi$（cm³）`],
          };
        }),
        // 13d07b 円柱の上に円錐をのせた立体：表面積
        t("13d07b", (r) => {
          const [a, h, l] = pick(r, CONES_S), H = r(3, 8), base = a * a, cylSide = 2 * a * H, coneSide = a * l, S = base + cylSide + coneSide;
          return {
            q: `底面の半径 ${a}cm、高さ ${H}cm の円柱の上に、底面の半径 ${a}cm、高さ ${h}cm、母線の長さ ${l}cm の円錐をのせた立体がある。この立体の表面積は □π cm²。□は？`,
            ans: S,
            hint: "この立体の表面になるのは、どの面とどの面かな。はり合わせた面は、表面にならない。母線は、頂点から底面の円周までの、ななめの線。",
            steps: [`円柱の下の底面 $${base}\\pi$、円柱の側面 $2\\pi\\times ${a}\\times ${H} = ${cylSide}\\pi$`, slantStep(a, l).replace("側面積", "円錐の側面") + `（母線 ${l}cm を使う）`, `表面積 $${base}\\pi + ${cylSide}\\pi + ${coneSide}\\pi = ${S}\\pi$（cm²）`],
          };
        }),
        // 13w02a 円柱の上に半球をのせた立体：体積（ワークシートの例題）
        t("13w02a", (r) => {
          const a = 3 * r(1, 2), H = r(2, 10), cyl = a * a * H, hemi = (2 * a ** 3) / 3;
          return {
            q: `底面の半径 ${a}cm、高さ ${H}cm の円柱の上に、半径 ${a}cm の半球を、平らな面がぴったり重なるようにのせた立体がある。この立体の体積は □π cm³。□は？`,
            ans: cyl + hemi,
            hint: "（円柱の体積）＋（半球の体積）。半球の体積は、球の体積の半分。",
            steps: [`円柱 $\\pi\\times ${a}^2\\times ${H} = ${cyl}\\pi$`, `半球 $\\frac{4}{3}\\pi\\times ${a}^3\\times\\frac{1}{2} = ${hemi}\\pi$`, `体積 $${cyl}\\pi + ${hemi}\\pi = ${cyl + hemi}\\pi$（cm³）`],
          };
        }),
        // 13w02b 円柱の上に半球をのせた立体：表面積（ワークシートの例題）
        t("13w02b", (r) => {
          const a = r(2, 6), H = r(2, 10), base = a * a, side = 2 * a * H, curved = 2 * a * a, S = base + side + curved;
          return {
            q: `底面の半径 ${a}cm、高さ ${H}cm の円柱の上に、半径 ${a}cm の半球を、平らな面がぴったり重なるようにのせた立体がある。この立体の表面積は □π cm²。□は？`,
            ans: S,
            hint: "はり合わせた面は、表面にならない。円柱の下の底面・円柱の側面・半球の曲面の 3つを足す。",
            steps: [`円柱の下の底面 $${base}\\pi$、円柱の側面 $2\\pi\\times ${a}\\times ${H} = ${side}\\pi$`, `半球の曲面 $4\\pi\\times ${a}^2\\times\\frac{1}{2} = ${curved}\\pi$`, `表面積 $${base}\\pi + ${side}\\pi + ${curved}\\pi = ${S}\\pi$（cm²）`],
          };
        }),
        // 13d08 球を切って 2つの半球にしたときの、表面積のふえ
        t("13d08", (r) => {
          const a = r(2, 9);
          return {
            q: `半径 ${a}cm の球を、中心を通る平面で切って、2つの半球に分けた。2つの半球の表面積の和は、もとの球の表面積より、□π cm² だけ大きい。□は？`,
            ans: 2 * a * a,
            hint: "切ると、どんな面が、いくつふえるかな。",
            steps: [`切り口の円が 2つふえる`, `$\\pi\\times ${a}^2\\times 2 = ${2 * a * a}\\pi$（cm²）`],
          };
        }),
        // 13d09a 円柱の容器と円錐の容器：どちらがたくさん入るか（4択）
        t("13d09a", (r) => {
          const c = containers(r);
          if (!c) return { skip: true };
          const fmt = (name, v) => `${name} のほうが多く入る（${v}π cm³）`;
          const ans = fmt(c.bigName, c.big.vol);
          return {
            q: `${c.text}水がたくさん入るほうの容器と、その容器に入る水の体積の組として、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, [fmt(c.bigName, c.small.vol), fmt(c.smallName, c.big.vol), fmt(c.smallName, c.small.vol)]),
            hint: "容器に入る水の体積は、容器の体積。円柱と円錐の、どちらの式を使うかに気をつけて、2つとも求めよう。",
            steps: [...c.stepsAB, `${c.big.vol}π ＞ ${c.small.vol}π だから、${c.bigName} のほうが多く入る。`],
          };
        }),
        // 13d09b 円柱の容器と円錐の容器：入る水の体積のちがい
        t("13d09b", (r) => {
          const c = containers(r);
          if (!c) return { skip: true };
          const d = c.big.vol - c.small.vol;
          return {
            q: `${c.text}水がたくさん入るほうの容器は、もう一方の容器より、□π cm³ だけ多く入る。□は？`,
            ans: d,
            hint: "容器に入る水の体積は、容器の体積。円柱と円錐の、どちらの式を使うかに気をつけて、2つとも求めよう。",
            steps: [...c.stepsAB, `${c.bigName} のほうが多く入り、ちがいは $${c.big.vol}\\pi - ${c.small.vol}\\pi = ${d}\\pi$（cm³）`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 13d10a 直角三角形を、辺を軸に回転：できる立体（4択）
        t("13d10a", (r) => {
          const w = rotation(r), ans = `底面の半径 ${w.rad}cm、高さ ${w.h}cm の円錐`;
          return {
            q: `${w.text}できる立体は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, [`底面の半径 ${w.h}cm、高さ ${w.rad}cm の円錐`, `底面の半径 ${w.rad}cm、高さ ${w.h}cm の円柱`, `底面の半径 ${w.rad}cm、高さ ${w.l}cm の円錐`]),
            hint: `三角形を、辺 ${w.ax} を軸に回転させる様子を思いうかべよう。回って円をつくるのは、どの辺かな。`,
            steps: [w.how, `底面の半径 ${w.rad}cm、高さ ${w.h}cm の円錐。`],
          };
        }),
        // 13d10b 直角三角形を、辺を軸に回転：体積
        t("13d10b", (r) => {
          const w = rotation(r), c = (w.rad * w.rad * w.h) / 3;
          return {
            q: `${w.text}できる立体の体積は □π cm³。□は？`,
            ans: c,
            hint: `三角形を、辺 ${w.ax} を軸に回転させる様子を思いうかべよう。円錐の体積の公式に出てくる長さは、何と何だったかな。`,
            steps: [w.how, `$V = \\frac{1}{3}\\times\\pi\\times ${w.rad}^2\\times ${w.h} = ${c}\\pi$（cm³）`],
          };
        }),
        // 13d10c 直角三角形を、辺を軸に回転：表面積
        t("13d10c", (r) => {
          const w = rotation(r), S = w.rad * w.l + w.rad * w.rad;
          return {
            q: `${w.text}できる立体の表面積は □π cm²。□は？`,
            ans: S,
            hint: `三角形を、辺 ${w.ax} を軸に回転させる様子を思いうかべよう。円錐の表面積は、側面積＋底面積。おうぎ形の半径になるのは、どの長さかな。`,
            steps: [w.how, slantStep(w.rad, w.l), `底面積 $\\pi\\times ${w.rad}^2 = ${w.rad * w.rad}\\pi$　表面積 $${w.rad * w.l}\\pi + ${w.rad * w.rad}\\pi = ${S}\\pi$（cm²）`],
          };
        }),
        // 13d11 円柱の水そうに、円錐のおもりをしずめる
        t("13d11", (r) => {
          const [R, a, h] = pick(r, CONE_SINK), d = h + r(1, 4), V = (a * a * h) / 3, ans = fracAns(V, R * R);
          return {
            q: `底面の半径が ${R}cm の円柱の形の水そうに、深さ ${d}cm まで水が入っている。この中に、底面の半径 ${a}cm、高さ ${h}cm の円錐の形のおもりを、底を下にして完全にしずめると、水面は何 cm 上がるか。ただし、水はあふれないものとする。`,
            ans,
            unit: "cm",
            hint: "おもりをしずめると、水面が上がる。上がった分の水の体積は、何と等しいかな。",
            steps: [
              `円錐の体積 $\\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${V}\\pi$（cm³）`,
              `上がる高さを $x$ cm として　$\\pi\\times ${R}^2\\times x = ${V}\\pi$`,
              `$${R * R}x = ${V}$　より　$x = ${fracTex(V, R * R)}$（cm）`,
            ],
          };
        }),
        // 13q05 円柱から同じ底面・高さの円錐をくりぬいた立体の体積（チャレンジ）
        t("13q05", (r) => {
          const v = find(() => [r(2, 7), r(3, 9)], ([a, h]) => (a * a * h) % 3 === 0);
          if (!v) return { skip: true };
          const [a, h] = v, cyl = a * a * h, cone = cyl / 3;
          return {
            q: `底面の半径が ${a}cm、高さが ${h}cm の円柱から、同じ底面で同じ高さの円錐をくりぬいた。残った立体の体積は □π cm³。□は？`,
            ans: cyl - cone,
            hint: "（円柱の体積）−（くりぬいた円錐の体積）。",
            steps: [`円柱 $\\pi\\times ${a}^2\\times ${h} = ${cyl}\\pi$、円錐 $\\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${cone}\\pi$`, `残り $${cyl}\\pi - ${cone}\\pi = ${cyl - cone}\\pi$（cm³）`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第13時は、演習プリント 11問・小テスト 5問のすべてを移した（図は、文章にした）
