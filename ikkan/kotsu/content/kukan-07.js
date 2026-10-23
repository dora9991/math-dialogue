// ============================================================
// kukan-07.js — 空間図形 第7時「立体を切り開いて、平面の上で考えよう」（展開図）
//   ikkan の演習プリント（kukan-07.dr.1〜10）・小テスト（kukan-07.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「07」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：07d04 ＝ kukan-07.dr.4、07q03 ＝ kukan-07.qz.3
//   円錐の側面のおうぎ形は、中心角が整数度になる組（母線 l と底面の半径 r が、360×r÷l の整数になる組）だけを選ぶ。
//   π が出る答えは、係数 □π の □ を聞く。度数は「度」の数を聞く。答えは、すべて計算で出す（手で書かない）。
//   立方体の展開図（07d05・07q04）は、図のかわりに「イはアの右、オはイの上…」と、となり合う面の位置を文章で言い切る。
//   向かい合う面（平行な面）は、サイコロを展開図の上でころがす計算で出す（ikkan の lesson_kukan_07.js の検算と同じ）。
// ============================================================
import { t, pick, choices4, reduce, gcd, shuffle, sample } from "../kit.js";
import { unit } from "../kukan-kit.js";
import { prismName, NGON } from "../solids.js";

/** 円錐の（底面の半径 rad、母線 l、側面のおうぎ形の中心角 th）の組。th＝360×rad÷l が整数になるものだけ。
 *  mult＝l が rad の整数倍（th＝360÷倍率）。num＝rad÷l を約分したときの分子（大きすぎる組は、数が不自然なので入れない） */
const PAIRS = [];
for (let l = 4; l <= 24; l++) {
  for (let rad = 2; rad <= Math.min(l - 1, 12); rad++) {
    const num = rad / gcd(rad, l);
    if ((360 * rad) % l === 0 && num <= 7) PAIRS.push({ rad, l, th: (360 * rad) / l, mult: l % rad === 0, num });
  }
}
const pairOf = (r, f) => pick(r, PAIRS.filter(f));

/** 弧の長さ ＝ 底面の円周 から、中心角を求める解説 */
const stepsAngle = (rad, l, th) => [
  `弧の長さ ＝ 底面の円周 ＝ 2π×${rad} ＝ ${2 * rad}π（cm）`,
  `半径 ${l}cm の円の周 ＝ 2π×${l} ＝ ${2 * l}π（cm）`,
  `中心角 ＝ 360° × $\\frac{${2 * rad}\\pi}{${2 * l}\\pi}$ ＝ ${th}°`,
];

/** 中心角 th のおうぎ形の弧の長さ（母線 ℓ で表す）の TeX。2πℓ×th/360 ＝ (th/180)πℓ */
const arcTex = (th) => {
  const [a, b] = reduce(th, 180);
  const c = b === 1 ? (a === 1 ? "" : String(a)) : `\\frac{${a}}{${b}}`;
  return `${c}\\pi \\ell`;
};

// ── 立方体の展開図 ───────────────────────────────────────
const KANA = "アイウエオカ";
/** 立方体の展開図 11種（[列, 行]）。折りたたむと6つの面がちがう面になるものだけ（最初の6つは、横に4面ならび、上と下に1面ずつつく型） */
const NETS11 = [
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
  [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
  [[3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2]],
  [[2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [0, 2]],
  [[2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1]],
  [[2, 0], [1, 1], [2, 1], [0, 2], [1, 2], [0, 3]],
];
/** ikkan の授業の図と同じ形（ア〜カの字も同じ。ア∥ウ、イ∥エ、オ∥カ） */
const IK_NETS = [
  [[0, 1, "ア"], [1, 1, "イ"], [2, 1, "ウ"], [3, 1, "エ"], [1, 0, "オ"], [3, 2, "カ"]],
  [[0, 1, "ア"], [1, 1, "イ"], [2, 1, "ウ"], [3, 1, "エ"], [2, 0, "オ"], [2, 2, "カ"]],
];
const DIRS = [["R", 1, 0, "右"], ["D", 0, 1, "下"], ["L", -1, 0, "左"], ["U", 0, -1, "上"]];

/** 展開図の形を、回したり裏返したりする（k＝0〜7）。左上をそろえる */
function symm(cells, k) {
  let c = cells.map(([x, y]) => (k & 4 ? [-x, y] : [x, y]));
  for (let i = 0; i < (k & 3); i++) c = c.map(([x, y]) => [-y, x]);
  const mc = Math.min(...c.map((p) => p[0])), mr = Math.min(...c.map((p) => p[1]));
  return c.map(([x, y]) => [x - mc, y - mr]);
}
/** 6つのマスに、ア〜カの字をつける（はしの1マスをアにして、となりへ順に） */
function labelNet(r, cells) {
  const at = (x, y) => cells.findIndex((p) => p[0] === x && p[1] === y);
  const nbrs = (i) => DIRS.map(([, dx, dy]) => at(cells[i][0] + dx, cells[i][1] + dy)).filter((j) => j >= 0);
  const root = pick(r, cells.map((_, i) => i).filter((i) => nbrs(i).length === 1));
  const order = [root];
  for (let q = 0; q < order.length; q++) for (const j of nbrs(order[q])) if (!order.includes(j)) order.push(j);
  return order.map((i, k) => [cells[i][0], cells[i][1], KANA[k]]);
}
/** 展開図 net（[列, 行, 字]）。ikkan の図と同じ形を4回に1回、あとは11種からランダム（向きもランダム）。only141＝横に4面ならぶ型だけ */
function pickNet(r, only141) {
  if (r(0, 3) === 0) return pick(r, IK_NETS);
  return labelNet(r, symm(pick(r, only141 ? NETS11.slice(0, 6) : NETS11), r(0, 7)));
}
/** 字（ア〜カ）→ その面と向かい合う字。サイコロをア（マス）の上から、となりのマスへころがして、各マスに接する面を調べる */
function opposites(net) {
  const roll = (f, d) => { const [b, t2, fr, bk, l, rt] = f; return d === "R" ? [rt, l, fr, bk, b, t2] : d === "L" ? [l, rt, fr, bk, t2, b] : d === "U" ? [bk, fr, b, t2, l, rt] : [fr, bk, t2, b, l, rt]; };
  const at = (x, y) => net.findIndex((p) => p[0] === x && p[1] === y);
  const root = net.findIndex((p) => p[2] === "ア");
  const st = { [root]: [0, 1, 2, 3, 4, 5] }, q = [root];
  while (q.length) {
    const i = q.shift();
    for (const [d, dx, dy] of DIRS) { const j = at(net[i][0] + dx, net[i][1] + dy); if (j >= 0 && !(j in st)) { st[j] = roll(st[i], d); q.push(j); } }
  }
  const face = (i) => st[i][0], opp = {};
  net.forEach((c, i) => net.forEach((d, j) => { if ((face(i) ^ 1) === face(j)) opp[c[2]] = d[2]; }));
  if (Object.keys(st).length !== 6 || Object.keys(opp).length !== 6) throw new Error("立方体の展開図になっていない");
  return opp;
}
/** 展開図の文章での言い方：イはアの右、オはイの上…（アから順に、となり合う面の位置） */
function describeNet(net) {
  const at = (x, y) => net.findIndex((p) => p[0] === x && p[1] === y);
  const root = net.findIndex((p) => p[2] === "ア"), parent = { [root]: -1 }, q = [root];
  while (q.length) { const i = q.shift(); for (const [, dx, dy] of DIRS) { const j = at(net[i][0] + dx, net[i][1] + dy); if (j >= 0 && !(j in parent)) { parent[j] = i; q.push(j); } } }
  const parts = [...net].sort((a, b) => KANA.indexOf(a[2]) - KANA.indexOf(b[2])).filter((c) => c[2] !== "ア").map((c) => {
    const i = at(c[0], c[1]), pr = net[parent[i]], dir = c[0] > pr[0] ? "右" : c[0] < pr[0] ? "左" : c[1] > pr[1] ? "下" : "上";
    return `${c[2]}は${pr[2]}の${dir}`;
  });
  return `面ア〜カの6つの正方形が、${parts.join("、")}に、それぞれ辺でつながっている立方体の展開図がある（右・左・上・下は、展開図を紙にかいたときの向き）。`;
}
/** 展開図の上で、2面が「間に1面をはさんで一直線」になっているか */
function skipOne(net, a, b) {
  const pa = net.find((c) => c[2] === a), pb = net.find((c) => c[2] === b);
  const dx = pb[0] - pa[0], dy = pb[1] - pa[1];
  if (!((Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0))) return false;
  return net.some((c) => c[0] === pa[0] + dx / 2 && c[1] === pa[1] + dy / 2);
}

export const UNITS = [
  unit("07", {
    name: "展開図（円柱・円錐の側面）",
    desc: "円柱の側面の縦・横、円錐の側面のおうぎ形の中心角・弧・面積・母線・半径",
    prereqs: ["J1-kk06", "J1-z3", "J1-k3"],
    points: [
      "立体を切り開いて、平面上に広げた図を展開図という。",
      "円柱の側面の展開図は長方形。縦は円柱の高さ、横は底面の円周 $2\\pi r$ に等しい。",
      "円錐の側面の展開図はおうぎ形。半径は母線の長さ、弧の長さは底面の円周に等しい。",
      "中心角は、母線を $\\ell$、底面の半径を $r$ とすると、$360^\\circ \\times \\frac{r}{\\ell}$ で求められる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 07d01 円柱の側面の展開図の縦・横
        t("07d01", (r) => {
          const rad = r(2, 6), h = r(3, 9), tate = pick(r, [true, false, false]);
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm の円柱の、側面の展開図は長方形になる。${tate ? "その縦の長さは何cmか。" : "その横の長さは □π cm。□は？"}`,
            ans: tate ? h : 2 * rad,
            hint: tate ? "展開図の縦は、円柱の何にあたるかな。" : "展開図の横は、底面の円の何にあたるかな。円周は 2π×（半径）。",
            steps: tate
              ? ["側面の展開図の縦は、円柱の高さ。", `縦は ${h}cm。`]
              : ["側面の展開図の横は、底面の円周に等しい。", `横 ＝ 2π×${rad} ＝ ${2 * rad}π（cm）`],
          };
        }),
        // 07d02 円錐の側面のおうぎ形の中心角（母線が底面の半径の k 倍）
        t("07d02", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.mult && p.rad <= 5);
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、側面のおうぎ形の中心角は？`,
            ans: th,
            unit: "度",
            hint: "おうぎ形の弧の長さは、底面の円周に等しい。母線を半径とする円の周との比が、中心角と 360° の比。",
            steps: stepsAngle(rad, l, th),
          };
        }),
        // 07d03 円錐の側面のおうぎ形の中心角（半径5cm・母線12cm など、倍率が整数でない組）
        t("07d03", (r) => {
          const { rad, l, th } = pairOf(r, (p) => !p.mult && p.l <= 12 && p.num <= 5);
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、側面のおうぎ形の中心角は？`,
            ans: th,
            unit: "度",
            hint: "おうぎ形の弧の長さは、底面の円周に等しい。母線を半径とする円の周との比が、中心角と 360° の比。",
            steps: stepsAngle(rad, l, th),
          };
        }),
        // 07q01 円柱・円錐の側面の展開図の形
        t("07q01", (r) => {
          const cyl = pick(r, [true, false]);
          const ans = cyl ? "長方形" : "おうぎ形";
          const wrongs = cyl ? ["おうぎ形", "三角形", "円"] : ["長方形", "三角形", "円"];
          return {
            q: pick(r, [`${cyl ? "円柱" : "円錐"}の側面の展開図は、どんな形か。`, `${cyl ? "円柱" : "円錐"}を切り開いたとき、側面は、どんな形になるか。`]),
            ans,
            choices: choices4(r, ans, wrongs),
            hint: cyl ? "円柱の側面を、高さの向きに切り開いて、広げてみよう。" : "円錐の側面は、頂点から底面の円周まで、母線が1まわりしてできている。",
            steps: cyl ? ["円柱の側面を切り開くと、長方形になる。", "縦は高さ、横は底面の円周に等しい。"] : ["円錐の側面を切り開くと、おうぎ形になる。", "半径は母線の長さ、弧の長さは底面の円周に等しい。"],
          };
        }),
        // 07q02 円柱の側面の展開図の縦と横（組を選ぶ）
        t("07q02", (r) => {
          const rad = r(2, 8), h = r(3, 9);
          const fmt = (a, b) => `縦 ${a}、横 ${b}`;
          const ans = fmt(`${h}cm`, `${2 * rad}π cm`);
          const wrongs = [fmt(`${h}cm`, `${rad}π cm`), fmt(`${h}cm`, `${rad * rad}π cm`), fmt(`${2 * rad}π cm`, `${h}cm`), fmt(`${h}cm`, `${2 * rad}cm`)];
          return {
            q: `底面の半径が ${rad}cm、高さが ${h}cm の円柱の、側面の展開図の縦と横の長さの組は？`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "縦は円柱の何にあたるか。横は、底面の円の何にあたるか。円周は 2π×（半径）。",
            steps: [`縦は円柱の高さで ${h}cm。`, `横は底面の円周で 2π×${rad} ＝ ${2 * rad}π（cm）。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 07d04 半径6cm・中心角120°のおうぎ形を側面とする円錐の底面の半径
        t("07d04", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.l <= 18);
          return {
            q: `半径 ${l}cm、中心角 ${th}° のおうぎ形を側面とする円錐をつくる。底面の半径は何cmか。`,
            ans: rad,
            hint: "おうぎ形の弧の長さが、底面の円周に等しい。",
            steps: [`おうぎ形の弧の長さ ＝ 2π×${l}×$\\frac{${th}}{360}$ ＝ ${2 * rad}π（cm）`, `底面の円周が ${2 * rad}π だから、2πr ＝ ${2 * rad}π`, `r ＝ ${rad}（cm）`],
          };
        }),
        // 07q03 底面の半径3cm・母線6cm の円錐の側面のおうぎ形の中心角
        t("07q03", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.l <= 12 && p.num <= 5);
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、側面のおうぎ形の中心角は？`,
            ans: th,
            unit: "度",
            hint: "おうぎ形の弧の長さは、底面の円周に等しい。母線を半径とする円の周との比が、中心角と 360° の比。",
            steps: stepsAngle(rad, l, th),
          };
        }),
        // 07d05a 立方体の展開図で、ある面と平行な面（①面アと平行な面 ②面オと平行な面）
        t("07d05a", (r) => {
          const net = pickNet(r, false), opp = opposites(net);
          const labels = net.map((c) => c[2]).sort();
          const tg = pick(r, labels), o = opp[tg];
          const ans = `面${o}`;
          const wrongs = shuffle(r, labels.filter((l) => l !== tg && l !== o)).map((l) => `面${l}`);
          return {
            q: `${describeNet(net)}組み立てたとき、面${tg}と平行になる面はどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "展開図を折りたたんで立方体にしたとき、向かい合う面は、展開図の上では、どんな位置にあるかな。",
            steps: ["展開図を折りたたんで、立方体にして考える。", skipOne(net, tg, o) ? `展開図で、面${tg}と面${o}は、間に1つの面をはさんで、一直線にならんでいる。このような2面は、向かい合う。` : `面${tg}のまわりの面を、順に折り上げていくと、面${tg}と向かい合う面は、面${o}になる。`, `面${tg}と平行な面は、面${o}。`],
          };
        }),
        // 07d05b 同じ展開図で、ある面と垂直な面（③面イと垂直な面）：すべての組を選ぶ
        t("07d05b", (r) => {
          const net = pickNet(r, false), opp = opposites(net);
          const labels = net.map((c) => c[2]).sort();
          const tg = pick(r, labels), o = opp[tg];
          const perp = labels.filter((l) => l !== tg && l !== o);
          const fmt = (ls) => [...ls].sort().map((l) => `面${l}`).join("、");
          const ans = fmt(perp);
          const wrongs = sample(r, perp, 3).map((drop) => fmt([...perp.filter((l) => l !== drop), o]));
          return {
            q: `${describeNet(net)}組み立てたとき、面${tg}と垂直になる面すべての組は、どれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "立方体の面は、1つの面にとって、向かい合う面と、そのまわりの面にわかれる。向かい合う面とは、平行。",
            steps: [`面${tg}と平行な（向かい合う）面は、面${o}。`, `面${tg}と面${o}以外の4つの面が、面${tg}と垂直。`, `垂直な面は ${ans}。`],
          };
        }),
        // 07q04 立方体の展開図（横に4面ならぶ型）で、面アと平行な面
        t("07q04", (r) => {
          const net = pickNet(r, true), opp = opposites(net);
          const labels = net.map((c) => c[2]).sort(), o = opp["ア"];
          const ans = `面${o}`;
          const wrongs = shuffle(r, labels.filter((l) => l !== "ア" && l !== o)).map((l) => `面${l}`);
          return {
            q: `${describeNet(net)}組み立てたとき、面アと平行になる面はどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "展開図を折りたたんで立方体にしたとき、向かい合う面は、展開図の上では、どんな位置にあるかな。",
            steps: ["展開図を折りたたんで、立方体にして考える。", skipOne(net, "ア", o) ? `展開図で、面アと面${o}は、間に1つの面をはさんで、一直線にならんでいる。このような2面は、向かい合う。` : `面アのまわりの面を、順に折り上げていくと、面アと向かい合う面は、面${o}になる。`, `面アと平行な面は、面${o}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 07d06 底面の半径 4cm、中心角 144° のおうぎ形になる円錐の母線
        t("07d06", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.l <= 16);
          return {
            q: `底面の半径が ${rad}cm で、側面の展開図が、中心角 ${th}° のおうぎ形になる円錐がある。母線の長さは何cmか。`,
            ans: l,
            hint: "母線を ℓ cm として、おうぎ形の弧の長さを ℓ で表そう。それが底面の円周に等しい。",
            steps: [`母線を ℓ cm とする。おうぎ形の弧の長さは $2\\pi \\ell \\times \\frac{${th}}{360} = ${arcTex(th)}$`, `底面の円周は 2π×${rad} ＝ ${2 * rad}π（cm）`, `弧の長さが底面の円周に等しいから $${arcTex(th)} = ${2 * rad}\\pi$`, `ℓ ＝ ${l}（cm）`],
          };
        }),
        // 07d07 側面のおうぎ形が半円：母線は底面の半径の何倍か
        t("07d07", (r) => {
          const th = pick(r, [180, 180, 120, 90, 72, 60, 45, 40, 36, 30]), k = 360 / th;
          return {
            q: `円錐の側面の展開図が、中心角 ${th}° のおうぎ形${th === 180 ? "（半円）" : ""}になった。母線の長さは、底面の半径の何倍か。`,
            ans: k,
            unit: "倍",
            hint: "母線を ℓ、底面の半径を r として、おうぎ形の弧の長さと、底面の円周を、それぞれ式にしよう。",
            steps: [`母線を ℓ、底面の半径を r とする。弧の長さ $2\\pi \\ell \\times \\frac{${th}}{360}$ が、底面の円周 $2\\pi r$ に等しい。`, `$\\ell \\times \\frac{${th}}{360} = r$ より、ℓ ＝ ${k}r`, `母線は、底面の半径の ${k}倍。`],
          };
        }),
        // 07d08 正三角形が底面の三角柱の側面の展開図の縦・横
        t("07d08", (r) => {
          const n = pick(r, [3, 3, 4, 5, 6]), a = r(2, 6), tate = pick(r, [true, false]);
          let h = r(3, 9); while (h === n * a) h += 1;
          return {
            q: `底面が 1辺 ${a}cm の${n === 4 ? "正方形" : `正${NGON[n]}`}で、高さが ${h}cm の${prismName(n)}の、側面の展開図は長方形になる。その${tate ? "縦" : "横"}の長さは何cmか。`,
            ans: tate ? h : n * a,
            hint: tate ? "展開図の縦は、角柱の何にあたるかな。" : "展開図の横は、底面のまわり（周）の長さ。",
            steps: [`側面は、${n}つの長方形がつながった、1つの長方形になる。`, `縦 ＝ 高さ ＝ ${h}cm`, `横 ＝ 底面のまわりの長さ ＝ ${a}×${n} ＝ ${n * a}（cm）`, `${tate ? "縦" : "横"}の長さは ${tate ? h : n * a}cm。`],
          };
        }),
        // 07d09a 底面の半径3cm・母線12cm の円錐の側面のおうぎ形：弧の長さ
        t("07d09a", (r) => {
          const { rad, l } = pairOf(r, (p) => p.l <= 20);
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、側面になるおうぎ形の弧の長さは □π cm。□は？`,
            ans: 2 * rad,
            hint: "おうぎ形の弧の長さは、底面の円周に等しい。",
            steps: ["弧の長さ ＝ 底面の円周", `2π×${rad} ＝ ${2 * rad}π（cm）`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 07d09b 同じ：中心角
        t("07d09b", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.l <= 20);
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、側面になるおうぎ形の中心角は？`,
            ans: th,
            unit: "度",
            hint: "弧の長さ（底面の円周）は、母線を半径とする円の周の、何分のいくつかな。",
            steps: stepsAngle(rad, l, th),
          };
        }),
        // 07d09c 同じ：面積
        t("07d09c", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.l <= 20);
          return {
            q: `底面の半径が ${rad}cm、母線の長さが ${l}cm の円錐の、側面になるおうぎ形の面積は □π cm²。□は？`,
            ans: rad * l,
            hint: "おうぎ形の面積は、同じ半径の円の面積の、何分のいくつか。中心角を先に求めよう。",
            steps: [`中心角 ＝ 360° × $\\frac{${2 * rad}\\pi}{${2 * l}\\pi}$ ＝ ${th}°`, `面積 ＝ π×${l}²×$\\frac{${th}}{360}$ ＝ ${rad * l}π（cm²）`],
          };
        }),
        // 07d10 展開図が半径12cm・中心角150°のおうぎ形と底面の円：底面の円の半径
        t("07d10", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.l >= 10 && p.l <= 24);
          return {
            q: `ある円錐の展開図は、半径 ${l}cm、中心角 ${th}° のおうぎ形と、底面の円である。底面の円の半径は何cmか。`,
            ans: rad,
            hint: "おうぎ形の弧の長さが、底面の円周に等しい。",
            steps: [`おうぎ形の弧の長さ ＝ 2π×${l}×$\\frac{${th}}{360}$ ＝ ${2 * rad}π（cm）`, `底面の円周が ${2 * rad}π だから、2πr ＝ ${2 * rad}π`, `r ＝ ${rad}（cm）`],
          };
        }),
        // 07q05 チャレンジ：底面の半径 4cm、中心角 288° のおうぎ形になる円錐の母線
        t("07q05", (r) => {
          const { rad, l, th } = pairOf(r, (p) => p.th > 180 && p.l <= 12);
          return {
            q: `底面の半径が ${rad}cm の円錐の、側面のおうぎ形の中心角が ${th}° である。この円錐の母線の長さは何cmか。`,
            ans: l,
            hint: "母線を ℓ cm として、おうぎ形の弧の長さを ℓ で表そう。それが底面の円周に等しい。",
            steps: [`母線を ℓ cm とする。弧の長さは $2\\pi \\ell \\times \\frac{${th}}{360} = ${arcTex(th)}$`, `底面の円周 2π×${rad} ＝ ${2 * rad}π に等しいから $${arcTex(th)} = ${2 * rad}\\pi$`, `ℓ ＝ ${l}（cm）`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（なし）
export const SKIPPED = [];   // 第7時は、演習プリント 10問・小テスト 5問のすべてを移した（立方体の展開図は、となり合う面の位置を文章で言い切って移した）
