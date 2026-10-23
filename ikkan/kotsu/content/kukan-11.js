// ============================================================
// kukan-11.js — 空間図形 第11時「角錐や円錐の体積は、角柱や円柱の何分のいくつか、実験で確かめよう」
//   ikkan の演習プリント（kukan-11.dr.1〜11）・小テスト（kukan-11.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「11」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：11d08a ＝ kukan-11.dr.8 の1つ目
//   答えは、すべて式で計算している（手で書きこんでいない）。π が出る答えは、「□π cm³。□は？」の □（整数か約分した分数）。
//   直方体・立方体の頂点を使う問題は、solids.js の立体の座標から、体積を計算している。
// ============================================================
import { t, pick, choices4, fracAns, fracTex, round } from "../kit.js";
import { unit } from "../kukan-kit.js";
import { cuboid, intro, prismName, pyramidName } from "../solids.js";

/** 条件に合う値が出るまで gen() をくり返す（見つからなければ null → skip） */
const find = (gen, ok, tries = 400) => {
  for (let i = 0; i < tries; i++) { const v = gen(); if (ok(v)) return v; }
  return null;
};
/** 円錐の [底面の半径, 高さ, 母線]（三平方の定理の、整数の組。半径か高さが 3 の倍数。答えが大きくなりすぎない組） */
const CONES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13]];

// ── 立体の座標から、三角錐の体積を計算する（4つの頂点の名前を渡す） ──
const tetraVol = (S, [p, q, s, u]) => {
  const d = (x, y) => S.V[y].map((c, i) => c - S.V[x][i]);
  const [a, b, c] = [d(p, q), d(p, s), d(p, u)];
  const det = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  return round(Math.abs(det) / 6);
};
/** 頂点 v から出ている辺の、もう一方の端（アルファベット順） */
const neighbors = (S, v) => S.E.filter((e) => e.includes(v)).map((e) => e.replace(v, "")).sort();
/** 2頂点のきょり（軸に平行な辺の長さ） */
const edgeLen = (S, p, q) => round(Math.hypot(...S.V[p].map((c, i) => c - S.V[q][i])));

// ── 同じ型を、授業の演習と小テストで使いまわす部品 ──
/** 底面が 1辺 a の正方形、高さ h の正四角錐の体積（a²h が 3 の倍数） */
const sqPyramid = (r, lo, hi) => {
  const v = find(() => [r(lo, hi), r(lo, hi)], ([a, h]) => (a * a * h) % 3 === 0);
  if (!v) return { skip: true };
  const [a, h] = v, ans = (a * a * h) / 3;
  return {
    q: `底面が 1辺 ${a}cm の正方形で、高さが ${h}cm の正四角錐の体積は？`,
    ans,
    unit: "cm³",
    hint: "先に、底面（正方形）の面積を求めよう。錐体の体積は、底面積×高さ×$\\frac{1}{3}$。",
    steps: [`底面積 $${a}\\times ${a} = ${a * a}$（cm²）`, `$V = \\frac{1}{3}\\times ${a * a}\\times ${h} = ${ans}$（cm³）`],
  };
};
/** 底面の半径 a、高さ h の円錐の体積（□π の □。a²h が 3 の倍数） */
const coneVol = (r, lo, hi, hlo, hhi) => {
  const v = find(() => [r(lo, hi), r(hlo, hhi)], ([a, h]) => (a * a * h) % 3 === 0);
  if (!v) return { skip: true };
  const [a, h] = v, c = (a * a * h) / 3;
  return {
    q: `底面の半径が ${a}cm、高さが ${h}cm の円錐の体積は □π cm³。□は？`,
    ans: c,
    hint: "円錐の体積は $\\frac{1}{3}\\pi r^2 h$（$r$ は底面の半径、$h$ は高さ）。",
    steps: [`$V = \\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h}$`, `$= ${c}\\pi$（cm³）だから、□ は ${c}。`],
  };
};
/** 底面の半径 a、体積 V π の円錐の高さ */
const coneHeight = (r, lo, hi, hlo, hhi) => {
  const v = find(() => [r(lo, hi), r(hlo, hhi)], ([a, h]) => (a * a * h) % 3 === 0);
  if (!v) return { skip: true };
  const [a, h] = v, V = (a * a * h) / 3;
  return {
    q: `底面の半径が ${a}cm、体積が ${V}π cm³ の円錐がある。高さは何 cm か。`,
    ans: h,
    unit: "cm",
    hint: "高さを $h$ cm として、体積の式 $V=\\frac{1}{3}\\pi r^2 h$ に、わかっている数を入れよう。",
    steps: [
      `高さを $h$ cm とすると　$\\frac{1}{3}\\times\\pi\\times ${a}^2\\times h = ${V}\\pi$`,
      `$${fracTex(a * a, 3)}\\pi h = ${V}\\pi$`,
      `$h = ${V}\\div ${fracTex(a * a, 3)} = ${h}$（cm）`,
    ],
  };
};

// ── 直方体の角を切り取る（dr.8） ──
const cornerCut = (r, askCut) => {
  const v3 = find(() => [r(3, 9), r(3, 8), r(3, 8)], ([a, b, c]) => (a * b * c) % 6 === 0);
  if (!v3) return { skip: true };
  const [a, b, c] = v3, S = cuboid(a, b, c), v = pick(r, [..."ABCDEFGH"]);
  const nb = neighbors(S, v), cutV = tetraVol(S, [v, ...nb]), rest = round(a * b * c - cutV);
  const [l0, l1, l2] = nb.map((x) => edgeLen(S, v, x)), name = `${v}−${nb.join("")}`;
  const steps = [
    `頂点 ${v} に集まる 3本の辺は、たがいに垂直。△${v}${nb[0]}${nb[1]} を底面（直角三角形）、${v}${nb[2]} を高さと見る。`,
    `三角錐 ${name} の体積 $\\frac{1}{3}\\times(\\frac{1}{2}\\times ${l0}\\times ${l1})\\times ${l2} = ${cutV}$（cm³）`,
  ];
  if (!askCut) steps.push(`残りの立体 $${a}\\times ${b}\\times ${c} - ${cutV} = ${rest}$（cm³）`);
  return {
    q: `${intro(S)}。AB＝${a}cm、AD＝${b}cm、AE＝${c}cm とする。この直方体から、三角錐 ${name} を切り取る。${askCut ? "切り取る三角錐の体積は？" : "残りの立体の体積は？"}`,
    ans: askCut ? cutV : rest,
    unit: "cm³",
    hint: askCut
      ? `三角錐の体積は $\\frac{1}{3}\\times$（底面積）$\\times$（高さ）。直方体の頂点 ${v} に集まる 3本の辺は、たがいにどんな関係かな。`
      : "残りの立体の体積は、（もとの直方体の体積）−（切り取った三角錐の体積）。三角錐の体積の公式は、何だったかな。",
    steps,
  };
};

// ── 直角三角形を、辺を軸に回転（dr.11） ──
const rotate = (r) => {
  const v = find(() => [r(3, 10), r(3, 10)], ([p, q]) => p !== q && (p * q) % 3 === 0);
  if (!v) return null;
  const [p, q] = v, vAB = (p * q * q) / 3, vBC = (p * p * q) / 3;   // AB を軸＝半径 q・高さ p ／ BC を軸＝半径 p・高さ q
  return { p, q, vAB, vBC };
};

export const UNITS = [
  unit("11", {
    name: "角錐・円錐の体積",
    desc: "体積＝底面積×高さ×1/3",
    prereqs: ["J1-kk10", "J1-k2"],
    points: [
      "角錐・円錐の体積は、底面積と高さが等しい角柱・円柱の体積の $\\frac{1}{3}$。だから $V=\\frac{1}{3}Sh$（$S$ は底面積、$h$ は高さ）。",
      "円錐は、底面が円なので $V=\\frac{1}{3}\\pi r^2 h$。直径がわかっているときは、先に半径（直径÷2）を求める。",
      "錐体の高さは、頂点から底面にひいた垂線の長さ。斜めの辺（母線）の長さではない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 11d01a 底面積と高さから、角柱の体積
        t("11d01a", (r) => {
          const n = r(3, 6), S = r(6, 24), h = r(3, 9), ans = S * h;
          return {
            q: `底面積が ${S}cm²、高さが ${h}cm の${prismName(n)}の体積は？`,
            ans,
            unit: "cm³",
            hint: "角柱の体積は、底面積×高さ。",
            steps: [`$V = Sh = ${S}\\times ${h} = ${ans}$（cm³）`],
          };
        }),
        // 11d01b 底面積と高さから、角錐の体積
        t("11d01b", (r) => {
          const v = find(() => [r(6, 24), r(3, 9)], ([S, h]) => (S * h) % 3 === 0);
          if (!v) return { skip: true };
          const [S, h] = v, n = r(3, 6), ans = (S * h) / 3;
          return {
            q: `底面積が ${S}cm²、高さが ${h}cm の${pyramidName(n)}の体積は？`,
            ans,
            unit: "cm³",
            hint: "角錐の体積は、同じ底面積・高さの角柱の体積の $\\frac{1}{3}$。",
            steps: [`$V = \\frac{1}{3}Sh = \\frac{1}{3}\\times ${S}\\times ${h} = ${ans}$（cm³）`],
          };
        }),
        // 11d02 底面が正方形の正四角錐
        t("11d02", (r) => sqPyramid(r, 2, 9)),
        // 11d03 底面の半径と高さから、円錐の体積
        t("11d03", (r) => coneVol(r, 2, 6, 2, 9)),
        // 11q01 角錐・円錐の体積は、角柱・円柱の何分のいくつか
        t("11q01", (r) => {
          const k = r(0, 3);
          const base = {
            hint: "同じ底面・高さの円柱の容器と、円錐の容器に、水を入れて比べた実験を思い出そう。",
            steps: ["底面積と高さが等しいとき、錐体の体積は、柱体の体積の $\\frac{1}{3}$。"],
          };
          if (k === 0) return { ...base, q: "角錐・円錐の体積は、底面積と高さが等しい角柱・円柱の体積の、何分のいくつか。", ans: fracAns(1, 3), steps: [...base.steps, "答えは $\\frac{1}{3}$。"] };
          if (k === 1) return { ...base, q: "底面積と高さが等しい角柱と角錐がある。角錐の体積は、角柱の体積の何分のいくつか。", ans: fracAns(1, 3), steps: [...base.steps, "答えは $\\frac{1}{3}$。"] };
          if (k === 2) return { ...base, q: "底面積と高さが等しい円柱と円錐がある。円柱の体積は、円錐の体積の何倍か。", ans: 3, unit: "倍", steps: [...base.steps, "逆に、柱体は錐体の 3倍。"] };
          return { ...base, q: "底面も高さも同じ、円錐の形の容器と円柱の形の容器がある。円錐の容器いっぱいの水を、円柱の容器にうつしていくと、何はい目でいっぱいになるか。", ans: 3, unit: "はい目", steps: [...base.steps, "円柱の体積は円錐の 3倍だから、3はい目でいっぱいになる。"] };
        }),
        // 11q03 円錐の体積（小テスト）
        t("11q03", (r) => coneVol(r, 3, 7, 3, 6)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 11d04 底面の直径と高さから、円錐の体積
        t("11d04", (r) => {
          const v = find(() => [r(2, 6), r(3, 9)], ([a, h]) => (a * a * h) % 3 === 0);
          if (!v) return { skip: true };
          const [a, h] = v, c = (a * a * h) / 3;
          return {
            q: `底面の直径が ${2 * a}cm、高さが ${h}cm の円錐の体積は □π cm³。□は？`,
            ans: c,
            hint: "円錐の体積の公式 $\\frac{1}{3}\\pi r^2 h$ の $r$ は、直径かな、半径かな。",
            steps: [`半径は ${2 * a}÷2 = ${a}（cm）`, `$V = \\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${c}\\pi$（cm³）`],
          };
        }),
        // 11d05 底面が直角三角形の三角錐
        t("11d05", (r) => {
          const v = find(() => [r(3, 10), r(3, 10), r(3, 9)], ([p, q, h]) => (p * q) % 2 === 0 && (((p * q) / 2) * h) % 3 === 0);
          if (!v) return { skip: true };
          const [p, q, h] = v, base = (p * q) / 2, ans = (base * h) / 3;
          return {
            q: `底面が、直角をはさむ 2辺が ${p}cm、${q}cm の直角三角形で、高さが ${h}cm の三角錐の体積は？`,
            ans,
            unit: "cm³",
            hint: "底面は、直角三角形。底面積は、直角をはさむ 2辺の積の半分。",
            steps: [`底面積 $\\frac{1}{2}\\times ${p}\\times ${q} = ${base}$（cm²）`, `$V = \\frac{1}{3}\\times ${base}\\times ${h} = ${ans}$（cm³）`],
          };
        }),
        // 11d06 母線の長さも書いてある円錐（使う長さを見分ける）
        t("11d06", (r) => {
          const [a, h, l] = pick(r, CONES), c = (a * a * h) / 3;
          return {
            q: `底面の半径が ${a}cm、高さが ${h}cm、母線の長さが ${l}cm の円錐の体積は □π cm³。□は？`,
            ans: c,
            hint: "錐体の高さは、頂点から底面にひいた垂線の長さ。母線は、頂点から底面の円周までの、斜めの線。",
            steps: [`体積に使うのは、半径 ${a}cm と高さ ${h}cm。母線 ${l}cm は使わない。`, `$V = \\frac{1}{3}\\times\\pi\\times ${a}^2\\times ${h} = ${c}\\pi$（cm³）`],
          };
        }),
        // 11q02 正四角錐の体積（小テスト）
        t("11q02", (r) => sqPyramid(r, 3, 9)),
        // 11q04 底面の半径と体積から、円錐の高さ（小テスト）
        t("11q04", (r) => coneHeight(r, 2, 6, 3, 12)),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 11d07 底面の半径と体積から、円錐の高さ
        t("11d07", (r) => coneHeight(r, 2, 6, 4, 15)),
        // 11d08a 直方体の角の三角錐を切り取る：切り取る三角錐の体積
        t("11d08a", (r) => cornerCut(r, true)),
        // 11d08b 直方体の角の三角錐を切り取る：残りの立体の体積
        t("11d08b", (r) => cornerCut(r, false)),
        // 11d09 円錐の容器の水を、円柱の容器にうつす
        t("11d09", (r) => {
          const [R, H, rad, h] = pick(r, WATER), Vc = (R * R * H) / 3;
          return {
            q: `底面の半径 ${R}cm、深さ ${H}cm の円錐の容器いっぱいの水を、底面の半径 ${rad}cm の円柱の容器にうつす。円柱の容器の、水の深さは何 cm になるか。`,
            ans: h,
            unit: "cm",
            hint: "水を円錐の容器から円柱の容器にうつしても、変わらないものは何かな。",
            steps: [
              `水の体積 $\\frac{1}{3}\\times\\pi\\times ${R}^2\\times ${H} = ${Vc}\\pi$（cm³）`,
              `円柱の水の深さを $h$ cm とすると　$\\pi\\times ${rad}^2\\times h = ${Vc}\\pi$`,
              `$${rad * rad}h = ${Vc}$　より　$h = ${h}$（cm）`,
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 11d10 立方体の4つの頂点を結んだ三角錐
        t("11d10", (r) => {
          const a = 3 * r(1, 4), S = cuboid(a, a, a), tet = pick(r, [["A", "C", "F", "H"], ["B", "D", "E", "G"]]);
          const rest = [..."ABCDEFGH"].filter((x) => !tet.includes(x)), ans = tetraVol(S, tet);
          const one = fracTex(a * a * a, 6);
          return {
            q: `${intro(S).replace("直方体", `1辺 ${a}cm の立方体`)}。4つの頂点 ${tet.join("、")} を結んでできる三角錐 ${tet.join("")} の体積は？`,
            ans,
            unit: "cm³",
            hint: `立方体の中に、三角錐 ${tet.join("")} をおいたとき、そのまわりに、どんな立体がのこるか考えよう。`,
            steps: [
              `立方体から、${rest.join("・")} の角の三角錐 4つを取りのぞく。`,
              `1つ分 $\\frac{1}{3}\\times(\\frac{1}{2}\\times ${a}\\times ${a})\\times ${a} = ${one}$`,
              `$${a}^3 - ${one}\\times 4 = ${ans}$（cm³）`,
            ],
          };
        }),
        // 11d11a 直角三角形を、辺 AB・辺 BC を軸に回転：どちらが大きいか（4択）
        t("11d11a", (r) => {
          const w = rotate(r);
          if (!w) return { skip: true };
          const { p, q, vAB, vBC } = w, big = vAB > vBC ? "AB" : "BC", small = big === "AB" ? "BC" : "AB";
          const vol = (x) => (x === "AB" ? vAB : vBC), fmt = (x, v) => `${x} を軸にした立体のほうが大きく、その体積は ${v}π cm³`;
          const ans = fmt(big, vol(big));
          return {
            q: `AB＝${p}cm、BC＝${q}cm、∠B＝90° の直角三角形 ABC を、辺 AB、辺 BC を軸として、それぞれ1回転させる。できる 2つの立体の体積をくらべて、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, [fmt(small, vol(big)), fmt(big, vol(small)), fmt(small, vol(small))]),
            hint: "三角形を、軸にした辺のまわりに回転させる様子を思いうかべよう。円錐の体積の公式に出てくる長さは、何と何だったかな。",
            steps: [
              `AB を軸 … 半径 ${q}cm、高さ ${p}cm の円錐　$\\frac{1}{3}\\times\\pi\\times ${q}^2\\times ${p} = ${vAB}\\pi$`,
              `BC を軸 … 半径 ${p}cm、高さ ${q}cm の円錐　$\\frac{1}{3}\\times\\pi\\times ${p}^2\\times ${q} = ${vBC}\\pi$`,
              `${big} を軸にしたほうが大きく、その体積は ${vol(big)}π cm³。`,
            ],
          };
        }),
        // 11d11b 直角三角形を、辺 AB・辺 BC を軸に回転：体積の差
        t("11d11b", (r) => {
          const w = rotate(r);
          if (!w) return { skip: true };
          const { p, q, vAB, vBC } = w, ans = Math.abs(vAB - vBC), big = vAB > vBC ? "AB" : "BC";
          return {
            q: `AB＝${p}cm、BC＝${q}cm、∠B＝90° の直角三角形 ABC を、辺 AB、辺 BC を軸として、それぞれ1回転させる。できる 2つの立体の体積のちがい（大きいほう−小さいほう）は □π cm³。□は？`,
            ans,
            hint: "三角形を、軸にした辺のまわりに回転させる様子を思いうかべよう。円錐の体積の公式に出てくる長さは、何と何だったかな。",
            steps: [
              `AB を軸 … 半径 ${q}cm、高さ ${p}cm　$\\frac{1}{3}\\times\\pi\\times ${q}^2\\times ${p} = ${vAB}\\pi$`,
              `BC を軸 … 半径 ${p}cm、高さ ${q}cm　$\\frac{1}{3}\\times\\pi\\times ${p}^2\\times ${q} = ${vBC}\\pi$`,
              `${big} を軸にしたほうが大きく、ちがいは $${Math.max(vAB, vBC)}\\pi - ${Math.min(vAB, vBC)}\\pi = ${ans}\\pi$（cm³）`,
            ],
          };
        }),
        // 11q05 円錐の容器に、頂点を下にして水を入れたとき、水の体積は容器の何分のいくつか
        t("11q05", (r) => {
          const n = 1, d = 2, s = r(2, 5), m = r(3, 8);   // 深さが半分のところまで水を入れる（元の問題と同じ型。答えは 1/8）
          const R = d * s, H = d * m, h = n * m, Rw = n * s;   // 水面の円の半径 Rw : R ＝ 水の深さ h : H ＝ n : d
          const ans = fracAns(Rw * Rw * h, R * R * H);
          return {
            q: `底面の半径 ${R}cm、深さ ${H}cm の円錐の形をした容器を、頂点を下にして置き、深さ ${h}cm のところまで水を入れた。水面の円の半径は ${Rw}cm である。水の体積は、容器いっぱいの体積の、何分のいくつか。`,
            ans,
            hint: "水の部分も、円錐の形。水の体積と、容器いっぱいの体積を、それぞれ求めて比べよう。",
            steps: [
              `水の体積 $\\frac{1}{3}\\times\\pi\\times ${Rw}^2\\times ${h}$（cm³）`,
              `容器の体積 $\\frac{1}{3}\\times\\pi\\times ${R}^2\\times ${H}$（cm³）`,
              `$\\frac{${Rw}^2\\times ${h}}{${R}^2\\times ${H}} = \\frac{${Rw * Rw * h}}{${R * R * H}} = ${fracTex(Rw * Rw * h, R * R * H)}$`,
            ],
          };
        }),
      ],
    },
  }),
];

// 円錐の容器（底面の半径 R・深さ H）いっぱいの水を、底面の半径 rad の円柱にうつしたとき、水の深さ h が整数になる組
const WATER = [];
for (let R = 3; R <= 9; R++) for (let H = 3; H <= 12; H++) for (let rad = 2; rad <= 6; rad++) {
  if ((R * R * H) % (3 * rad * rad) === 0) { const h = (R * R * H) / (3 * rad * rad); if (h >= 2 && h <= 24) WATER.push([R, H, rad, h]); }
}

// 移さなかった問題
export const SKIPPED = [];   // 第11時は、演習プリント 11問・小テスト 5問のすべてを移した（図は、文章にした）
