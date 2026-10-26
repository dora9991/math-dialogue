// ============================================================
// heikou-03.js — 平行と合同 第3時「三角形の内角の和が180°になるわけを説明しよう」（内角・外角・補助線）
//   ikkan の演習プリント（heikou-03.dr.1〜8）・小テスト（heikou-03.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「03」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：03d02b ＝ heikou-03.dr.2 の「外角と1つの内角から、もう1つの内角」
//   図は出せないので、三角形の頂点の名前（△ABC）と、外角をつくる点 D（辺 BC を C の先へのばした直線上）、二等分線の交点（I・E）を、問題文で言い切る。
//   角度は整数の度。答えは、問題文の数字から計算して出す（内角の和 180°・外角の性質）。
//   dr.5（∠A＝∠B＋∠C）は、答えがいつも 90° になるので、「∠A は、∠B と ∠C の和の □倍（□分の1）／□° 大きい（小さい）」という形にして、答えが変わるようにした（同じ考え方：内角の和に代入する）。
//   dr.7・dr.8（二等分線の交点）は、角の大きさ（∠BIC・∠BEC）を聞く問いと、そこから ∠A をさかのぼる問いにした。理由は聞かない。
//   qz.2（∠a＋∠b＋∠c＝180° となるわけを説明）は、説明の根拠（錯角・一直線の角は 180°）を選ぶ4択にした。
// ============================================================
import { t as t0, pick, choices4, shuffle, sample, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const PTS = "ABCDEFGHJKPQRSTUVWXYZ".split("");
const TRIS = [["A", "B", "C"], ["P", "Q", "R"], ["D", "E", "F"], ["K", "L", "M"], ["X", "Y", "Z"], ["S", "T", "U"]];
/** 1次式 px+q の TeX（p＝1 なら x+q。q＝0 なら px）と、(px+q)°／px° */
const lin = (p, q) => `${p === 1 ? "" : p}x${q === 0 ? "" : q < 0 ? "-" : "+"}${q === 0 ? "" : Math.abs(q)}`;
const dgx = (p, q) => (q === 0 ? `$${lin(p, q)}^\\circ$` : `$(${lin(p, q)})^\\circ$`);
const evalLin = (p, q, x) => `${p === 1 ? x : `${p}\\times ${x}`}${q === 0 ? "" : q < 0 ? "-" : "+"}${q === 0 ? "" : Math.abs(q)}=${p * x + q}`;
/** 和の式の項：(px+q)。q＝0 なら括弧なし */
const term = (e) => (e.q === 0 ? lin(e.p, 0) : `(${lin(e.p, e.q)})`);
const sumLin = (es) => es.reduce((s, e) => ({ p: s.p + e.p, q: s.q + e.q }), { p: 0, q: 0 });
/** 1次方程式 Px+Q＝total の解き方の途中式（TeX の文字列の配列）。同じ式を2回書かない */
const solveParts = (P, Q, total, x) => [...(Q !== 0 ? [`${lin(P, Q)}=${total}`] : []), ...(P !== 1 ? [`${P}x=${total - Q}`] : []), `x=${x}`];

/** 三角形の頂点の名前（△ABC など）。extra 個ぶん、ほかの点の名前も用意する */
function tri(r, extra = 0) {
  const base = pick(r, TRIS), rest = shuffle(r, PTS.filter((x) => !base.includes(x))).slice(0, extra);
  return { V: base, A: base[0], B: base[1], C: base[2], rest, name: `△${base.join("")}` };
}
const rnd5 = (r, lo, hi) => lo + r(0, hi - lo);

/** 3つの内角 [a, b, c]（和が 180°、どれも lo 以上 hi 以下） */
function angles3(r, lo = 20, hi = 110) {
  for (let i = 0; i < 300; i++) {
    const a = r(lo, hi), b = r(lo, hi), c = 180 - a - b;
    if (c >= lo && c <= hi) return [a, b, c];
  }
  return [50, 60, 70];
}

// ── 問題 ───────────────────────────────────────────────
/** 03d01a 内角の和：2つの内角から、残りの内角 */
function interior(r) {
  const T = tri(r), [a, b, c] = angles3(r, 20, 110), v = shuffle(r, [0, 1, 2]), vals = [a, b, c];
  const g1 = v[0], g2 = v[1], u = v[2];
  return {
    q: `${T.name} で、∠${T.V[g1]}＝${vals[g1]}°、∠${T.V[g2]}＝${vals[g2]}° のとき、∠${T.V[u]} の大きさは何度か。`,
    ans: vals[u],
    unit: "度",
    hint: "三角形の3つの内角の和は、何度だったかな？",
    steps: ["三角形の3つの内角の和は 180°。", `$180-${vals[g1]}-${vals[g2]}=${vals[u]}$ より、∠${T.V[u]}＝${vals[u]}°。`],
  };
}
/** 03d01b 直角のある三角形：直角と1つの内角から、残りの内角 */
function rightTri(r) {
  const T = tri(r), v = shuffle(r, [0, 1, 2]), rt = v[0], k = v[1], u = v[2], a = r(15, 75);
  return {
    q: `${T.name} で、∠${T.V[rt]}＝90°、∠${T.V[k]}＝${a}° のとき、∠${T.V[u]} の大きさは何度か。`,
    ans: 90 - a,
    unit: "度",
    hint: "直角は何度かな？ 三角形の3つの内角の和は、何度だったかな？",
    steps: ["三角形の3つの内角の和は 180°。", `$180-90-${a}=${90 - a}$ より、∠${T.V[u]}＝${90 - a}°。`],
  };
}

/** 外角をつくる2つの内角 [a, b]（和が 165° 以下） */
function pair2(r) {
  for (let i = 0; i < 100; i++) { const a = r(20, 100), b = r(20, 100); if (a + b <= 165) return [a, b]; }
  return [40, 60];
}
/** 外角の図：頂点 V で、辺 UV を V の先へのばした直線上に点 D をとる（V は U と D のあいだ）。外角 ∠WVD は、V にとなり合わない内角 ∠U、∠W の和に等しい */
function frameExt(r) {
  const T = tri(r, 1), V = pick(r, T.V), rest = T.V.filter((x) => x !== V), U = pick(r, rest), W = rest.find((x) => x !== U), D = T.rest[0];
  return { T, V, U, W, D, intro: `${T.name} で、辺 ${U}${V} を ${V} の先へのばした直線上に点 ${D} をとる（${V} は ${U} と ${D} のあいだにある）。`, ext: `∠${W}${V}${D}` };
}
/** 03d02a 外角の性質：となり合わない2つの内角から、外角 */
function extFind(r) {
  const F = frameExt(r), [a, b] = pair2(r);
  return {
    q: `${F.intro}∠${F.U}＝${a}°、∠${F.W}＝${b}° のとき、外角 ${F.ext} の大きさは何度か。`,
    ans: a + b,
    unit: "度",
    hint: "外角は、どの2つの内角とどんな関係があったかな？",
    steps: [`外角 ${F.ext} は、となり合わない2つの内角 ∠${F.U}、∠${F.W} の和に等しい。`, `$${a}+${b}=${a + b}$ より、${F.ext}＝${a + b}°。`],
  };
}
/** 03d02b 外角の性質：外角と1つの内角から、もう1つの内角 */
function extInner(r) {
  const F = frameExt(r), [a, b] = pair2(r), ext = a + b, askU = r(0, 1) === 0;
  const known = askU ? F.W : F.U, target = askU ? F.U : F.W, kv = askU ? b : a, ans = askU ? a : b;
  return {
    q: `${F.intro}外角 ${F.ext}＝${ext}°、∠${known}＝${kv}° のとき、∠${target} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: "外角は、どの2つの内角とどんな関係があったかな？",
    steps: [`外角 ${F.ext} は、となり合わない2つの内角 ∠${F.U}、∠${F.W} の和に等しい。`, `$${ext}-${kv}=${ans}$ より、∠${target}＝${ans}°。`],
  };
}

/** 03d03 内角が x の式で表されている：x の値、またはいちばん大きい内角 */
function interiorEq(r, askMax) {
  for (let i = 0; i < 500; i++) {
    const x = r(8, 50), ps = [pick(r, [1, 1, 2, 3]), pick(r, [1, 2, 3]), pick(r, [1, 2, 3])];
    if (ps.every((p) => p === ps[0])) continue;
    const q1 = pick(r, [0, 0, rnz(r, -30, 30)]), q2 = rnz(r, -30, 30), q3 = 180 - x * (ps[0] + ps[1] + ps[2]) - q1 - q2, qs = [q1, q2, q3];
    const vals = ps.map((p, k) => p * x + qs[k]);
    if (qs.some((v, k) => (k > 0 && v === 0) || Math.abs(v) > 60) || vals.some((v) => v < 15 || v > 130)) continue;
    const es = shuffle(r, ps.map((p, k) => ({ p, q: qs[k], v: vals[k] }))), s = sumLin(es);
    const big = Math.max(...vals);
    return {
      q: `三角形の3つの内角の大きさが、${es.map((e) => dgx(e.p, e.q)).join("、")} のとき、${askMax ? "いちばん大きい内角の大きさは何度か。" : "$x$ の値は？"}`,
      ans: askMax ? big : x,
      unit: askMax ? "度" : undefined,
      hint: "三角形の3つの内角の和は、何度だったかな？ その和を、式に表せないかな？",
      steps: [
        `3つの内角の和は 180° だから、${$(`${es.map(term).join("+")}=180`)}`,
        `${solveParts(s.p, s.q, 180, x).map($).join("、")}`,
        ...(askMax ? [`3つの内角は ${es.map((e) => `${e.v}°`).join("、")}。いちばん大きいのは ${big}°。`] : []),
      ],
    };
  }
}
/** 03d04 外角が数で、となり合わない2つの内角が x の式：x の値、または 1つの内角 */
function extEq(r, askAngle) {
  for (let i = 0; i < 500; i++) {
    const F = frameExt(r), x = r(5, 40), a = r(20, 90), b = r(20, 90), ext = a + b;
    const e1 = pick(r, [1, 2, 3]), e2 = pick(r, [1, 2, 3]);
    const q1 = a - e1 * x, q2 = b - e2 * x;
    if (q1 === 0 || q2 === 0 || Math.abs(q1) > 40 || Math.abs(q2) > 40 || e1 === e2 || ext > 170) continue;
    const s = { p: e1 + e2, q: q1 + q2 };
    const who = r(0, 1) === 0 ? F.U : F.W;
    const ansv = who === F.U ? a : b, pe = who === F.U ? { p: e1, q: q1 } : { p: e2, q: q2 };
    return {
      q: `${F.intro}∠${F.U}＝${dgx(e1, q1)}、∠${F.W}＝${dgx(e2, q2)}、外角 ${F.ext}＝${ext}° のとき、${askAngle ? `∠${who} の大きさは何度か。` : "$x$ の値は？"}`,
      ans: askAngle ? ansv : x,
      unit: askAngle ? "度" : undefined,
      hint: "外角は、どの2つの内角とどんな関係があったかな？ その関係を、式に表せないかな？",
      steps: [
        `外角の性質より、${F.ext}＝∠${F.U}＋∠${F.W}。`,
        `${$(`(${lin(e1, q1)})+(${lin(e2, q2)})=${ext}`)} より、${solveParts(s.p, s.q, ext, x).map($).join("、")}`,
        ...(askAngle ? [`∠${who}＝$${evalLin(pe.p, pe.q, x)}$ より、${ansv}°。`] : []),
      ],
    };
  }
}

/** 03d05 ∠A と ∠B＋∠C の関係（和の □倍、□分の1、□° 大きい、□° 小さい）から ∠A */
const KIND = [
  { id: "same", text: () => "∠A＝∠B＋∠C", eq: () => "a=180-a", solve: () => ["2a=180"], a: () => 90 },
  { id: "x2", text: () => "∠A が、∠B と ∠C の和の 2倍", eq: () => "a=2(180-a)", solve: () => ["3a=360"], a: () => 120 },
  { id: "x3", text: () => "∠A が、∠B と ∠C の和の 3倍", eq: () => "a=3(180-a)", solve: () => ["4a=540"], a: () => 135 },
  { id: "h", text: () => "∠A が、∠B と ∠C の和の半分", eq: () => "a=\\frac{1}{2}(180-a)", solve: () => ["3a=180"], a: () => 60 },
  { id: "t", text: () => "∠A が、∠B と ∠C の和の 3分の1", eq: () => "a=\\frac{1}{3}(180-a)", solve: () => ["4a=180"], a: () => 45 },
  { id: "plus", text: (d) => `∠A が、∠B と ∠C の和より ${d}° 大きい`, eq: (d) => `a=(180-a)+${d}`, solve: (d) => [`2a=${180 + d}`], a: (d) => (180 + d) / 2 },
  { id: "minus", text: (d) => `∠A が、∠B と ∠C の和より ${d}° 小さい`, eq: (d) => `a=(180-a)-${d}`, solve: (d) => [`2a=${180 - d}`], a: (d) => (180 - d) / 2 },
];
function relAngleA(r) {
  const T = tri(r), v = shuffle(r, [0, 1, 2]), me = T.V[v[0]], o1 = T.V[v[1]], o2 = T.V[v[2]];
  const K = pick(r, KIND), d = pick(r, [10, 20, 30, 40, 50, 60]), ans = K.a(d);
  const rename = (s2) => s2.replaceAll("∠A", `∠${me}`).replaceAll("∠B", `∠${o1}`).replaceAll("∠C", `∠${o2}`);
  return {
    q: `${T.name} で、${rename(K.text(d))} のとき、∠${me} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: `三角形の3つの内角の和は、何度だったかな？ ∠${o1}＋∠${o2} を、∠${me} を使って表せないかな？`,
    steps: [
      `∠${me}＝$a$° とおくと、三角形の内角の和は 180° だから、∠${o1}＋∠${o2}＝$180-a$（度）。`,
      `条件から、${$(K.eq(d))}`,
      `${$(K.solve(d)[0])} より、${$(`a=${ans}`)}。よって、∠${me}＝${ans}°。`,
    ],
  };
}

/** 03d06 内角の比：∠A：∠B：∠C＝2：3：4 のとき、1つの内角 */
const RATIOS = [];
const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
for (let a = 1; a <= 6; a++) for (let b = a; b <= 8; b++) for (let c = b; c <= 9; c++) {
  const s = a + b + c;
  if (s <= 30 && 180 % s === 0 && !(a === b && b === c) && gcd2(gcd2(a, b), c) === 1 && c * (180 / s) <= 130) RATIOS.push([a, b, c]);
}
function ratio(r) {
  const T = tri(r), R = shuffle(r, pick(r, RATIOS)), s = R[0] + R[1] + R[2], u = r(0, 2);
  const ans = (180 * R[u]) / s;
  return {
    q: `${T.name} で、∠${T.A}：∠${T.B}：∠${T.C}＝${R[0]}：${R[1]}：${R[2]} のとき、∠${T.V[u]} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: "三角形の3つの内角の和は、何度だったかな？ その 180° を、比の数で分けられないかな？",
    steps: [`比の数の和は $${R[0]}+${R[1]}+${R[2]}=${s}$。`, `内角の和 180° を ${R.join("：")} に分けるので、∠${T.V[u]}＝$180\\times \\frac{${R[u]}}{${s}}=${ans}$ より、${ans}°。`],
  };
}

/** 03d07 ∠B・∠C の二等分線の交点 I：∠BIC ＝ 90°＋∠A÷2 */
function incenter(r, back) {
  const T = tri(r, 1), I = T.rest[0], A = 2 * r(15, 70), bic = 90 + A / 2;
  const ang = `∠${T.B}${I}${T.C}`, ib = `∠${I}${T.B}${T.C}`, ic = `∠${I}${T.C}${T.B}`;
  const stem = `${T.name} で、∠${T.B} の二等分線と ∠${T.C} の二等分線が、${T.name} の内部の点 ${I} で交わっている。`;
  if (!back) {
    return {
      q: `${stem}∠${T.A}＝${A}° のとき、${ang} の大きさは何度か。`,
      ans: bic,
      unit: "度",
      hint: `∠${T.B}＋∠${T.C} は何度かな？ ${I} は二等分線の交点だから、△${I}${T.B}${T.C} の2つの内角は、それぞれ何の半分かな？`,
      steps: [`∠${T.B}＋∠${T.C}＝$180-${A}=${180 - A}$ より ${180 - A}°。`, `二等分しているので、${ib}＋${ic} は、${180 - A}° の半分で ${(180 - A) / 2}°。`, `△${I}${T.B}${T.C} の内角の和より、$180-${(180 - A) / 2}=${bic}$ だから、${ang}＝${bic}°。`],
    };
  }
  return {
    q: `${stem}${ang}＝${bic}° のとき、∠${T.A} の大きさは何度か。`,
    ans: A,
    unit: "度",
    hint: `△${I}${T.B}${T.C} の内角の和から、${ib}＋${ic} はわかるかな？ それは、∠${T.B}＋∠${T.C} の何分の1かな？`,
    steps: [`△${I}${T.B}${T.C} の内角の和より、${ib}＋${ic}＝$180-${bic}=${180 - bic}$ より ${180 - bic}°。`, `二等分しているので、∠${T.B}＋∠${T.C} は、その2倍で ${2 * (180 - bic)}°。`, `$180-${2 * (180 - bic)}=${A}$ より、∠${T.A}＝${A}°。`],
  };
}
/** 03d08 ∠B の二等分線と、外角 ∠ACD の二等分線の交点 E：∠BEC ＝ ∠A÷2 */
function excenter(r, back) {
  const T = tri(r, 2), [D, E] = T.rest, A = 2 * r(15, 65), half = A / 2;
  const stem = `${T.name} で、辺 ${T.B}${T.C} を ${T.C} の先へのばした直線上に点 ${D} をとる（${T.C} は ${T.B} と ${D} のあいだにある）。∠${T.B} の二等分線と、∠${T.A}${T.C}${D} の二等分線が、点 ${E} で交わっている。`;
  const ang = `∠${T.B}${E}${T.C}`, acd = `∠${T.A}${T.C}${D}`, ecd = `∠${E}${T.C}${D}`, ebc = `∠${E}${T.B}${T.C}`;
  const l1 = `${ebc}＝$a$°、${ecd}＝$c$° とおく。二等分線だから、∠${T.B}＝2$a$°、${acd}＝2$c$°。`;
  const hint = "二等分線でできる角を、文字（a、c など）でおくと、外角の性質で、どんな式がつくれるかな？";
  if (!back) {
    return {
      q: `${stem}∠${T.A}＝${A}° のとき、${ang} の大きさは何度か。`,
      ans: half,
      unit: "度",
      hint,
      steps: [l1, `外角の性質より、${acd}＝∠${T.A}＋∠${T.B} だから、${$(`2c=${A}+2a`)}。よって、${$(`c=${half}+a`)}。`, `△${E}${T.B}${T.C} の外角の性質より、${ecd}＝${ebc}＋${ang} だから、${ang}＝${ecd}−${ebc}＝${$("c-a")}（度）。`, `${$(`c-a=${half}`)} より、${ang}＝${half}°。`],
    };
  }
  return {
    q: `${stem}${ang}＝${half}° のとき、∠${T.A} の大きさは何度か。`,
    ans: A,
    unit: "度",
    hint,
    steps: [l1, `△${E}${T.B}${T.C} の外角の性質より、${ecd}＝${ebc}＋${ang} だから、${$(`c=a+${half}`)}。`, `外角の性質より、∠${T.A}＝${acd}−∠${T.B}＝2$c$°−2$a$°＝${$("2(c-a)")}（度）。`, `${$(`2(c-a)=2\\times ${half}=${A}`)} より、∠${T.A}＝${A}°。`],
  };
}

/** 03q02a 補助線 DE（A を通り BC に平行）：∠DAB と ∠B などの関係を表す言葉、または「いつも等しい角」を選ぶ4択 */
function auxWord(r) {
  const T = tri(r, 2), [D, E] = T.rest, A = T.A, B = T.B, C = T.C;
  const p = pick(r, [{ a: `∠${D}${A}${B}`, b: `∠${A}${B}${C}`, via: B, others: [`∠${A}${C}${B}`, `∠${B}${A}${C}`, `∠${C}${A}${E}`] }, { a: `∠${E}${A}${C}`, b: `∠${A}${C}${B}`, via: C, others: [`∠${A}${B}${C}`, `∠${B}${A}${C}`, `∠${B}${A}${D}`] }]);
  const head = `${T.name} で、${B} は左、${C} は右にある。${A} を通り、辺 ${B}${C} に平行な直線上に、${A} の左の点 ${D} と、${A} の右の点 ${E} をとる。`;
  const steps = [`${D}${E} と ${B}${C} は平行で、直線 ${A}${p.via} が、この2直線に交わっている。`, `${p.a} と ${p.b} は、2直線の内側で、ななめ向かいにある角なので、錯角。`, `平行線の錯角は等しいから、${p.a}＝${p.b}。`];
  if (r(0, 1) === 0) {
    const ans = "錯角";
    return {
      q: `${head}${p.a} と ${p.b} は、どんな関係の角か。`,
      ans,
      choices: choices4(r, ans, ["同位角", "対頂角", "内角と外角"]),
      hint: `${p.a} と ${p.b} は、それぞれどの点のどのあたりの角かな？ 自分で図にかいて、位置をたしかめよう。`,
      steps,
    };
  }
  const ans = p.b;
  return {
    q: `${head}${p.a} と、いつも大きさが等しいといえる角は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, p.others),
    hint: `${p.a} は、どの点のどのあたりの角かな？ 平行線を使って、等しいといえる角は、どの位置の角かな？`,
    steps: [...steps.slice(0, 2), `平行線の錯角は等しいから、${p.a}＝${p.b}。ほかの角は、いつも等しいとは限らない。`],
  };
}
/** 03q02b ∠DAB＋∠BAC＋∠CAE＝180° となる根拠を選ぶ4択 */
function auxStraight(r) {
  const T = tri(r, 2), [D, E] = T.rest, ans = "一直線の角は 180°";
  const wr = ["対頂角は等しい", "平行線の同位角は等しい", "三角形の内角の和は 180°"];
  return {
    q: `${T.name} で、${T.A} を通り、辺 ${T.B}${T.C} に平行な直線 ${D}${E} をひく（${D}、${T.A}、${E} の順に一直線上にならぶ）。∠${D}${T.A}${T.B}＋∠${T.B}${T.A}${T.C}＋∠${T.C}${T.A}${E}＝180° となるのは、何を使うからか。`,
    ans,
    choices: choices4(r, ans, wr),
    hint: `∠${D}${T.A}${T.B}、∠${T.B}${T.A}${T.C}、∠${T.C}${T.A}${E} の3つの角は、点 ${T.A} のまわりで、どんな形にならんでいるかな？`,
    steps: [`${D}、${T.A}、${E} は一直線上にあるので、点 ${T.A} のまわりの3つの角 ∠${D}${T.A}${T.B}、∠${T.B}${T.A}${T.C}、∠${T.C}${T.A}${E} は、一直線にならぶ。`, `一直線の角は 180° だから、和が 180°。`, `「対頂角」「同位角」「三角形の内角の和」は、この式の根拠にはならない。`],
  };
}
/** 03q02c 内角の和が 180° になるわけの説明：根拠の組を選ぶ4択 */
function auxProof(r) {
  const T = tri(r, 2), [D, E] = T.rest;
  const O1 = ["平行線の錯角は等しい", "対頂角は等しい", "三角形の外角の性質"];
  const O2 = ["一直線の角は 180°", "対頂角は等しい", "三角形の内角の和は 180°"];
  const fmt = (p) => `① ${O1[p[0]]}　② ${O2[p[1]]}`;
  const right = [0, 0], ans = fmt(right);
  const pool = [[1, 0], [2, 0], [0, 1], [0, 2], [1, 1], [1, 2], [2, 1], [2, 2]];
  const share = (p, o) => (p[0] === o[0] ? 1 : 0) + (p[1] === o[1] ? 1 : 0);
  let opts = null;
  for (let i = 0; i < 200; i++) {
    const w = sample(r, pool, 3), all = [right, ...w];
    const f = (p) => all.reduce((sum, o) => (o === p ? sum : sum + share(p, o)), 0);
    const vs = all.map(f), c = f(right);
    opts = w;
    if (!(vs.filter((v) => v < c).length === 3) && !(vs.filter((v) => v > c).length === 3)) break;
  }
  return {
    q: `${T.name} で、${T.B} は左、${T.C} は右にある。${T.A} を通り、辺 ${T.B}${T.C} に平行な直線上に、${T.A} の左の点 ${D} と、右の点 ${E} をとって、∠${T.A}＋∠${T.B}＋∠${T.C}＝180° を説明する。\n① ∠${D}${T.A}${T.B}＝∠${T.B}、∠${E}${T.A}${T.C}＝∠${T.C} となる根拠\n② ∠${D}${T.A}${T.B}＋∠${T.A}＋∠${E}${T.A}${T.C}＝180° となる根拠\n①、②の根拠の組として、正しいものはどれか。`,
    ans,
    choices: choices4(r, ans, opts.map(fmt)),
    hint: `①の2つの角は、どんな位置の角かな？ ②の3つの角は、点 ${T.A} のまわりで、どんな形にならんでいるかな？`,
    steps: [`① ∠${D}${T.A}${T.B} と ∠${T.B} は、${D}${E}∥${T.B}${T.C} の錯角だから、等しい（∠${E}${T.A}${T.C} と ∠${T.C} も同じ）。`, `② ${D}、${T.A}、${E} は一直線上なので、一直線の角は 180° だから、∠${D}${T.A}${T.B}＋∠${T.A}＋∠${E}${T.A}${T.C}＝180°。`, `よって、正しい組は「${ans}」。`],
  };
}

/** 03q03 内角が x、2x、3x など（倍の組は、和が 180 の約数になるもの） */
const MULTS = [[1, 2, 3], [1, 1, 2], [1, 2, 6], [1, 3, 5], [2, 3, 4], [1, 4, 5], [3, 4, 5], [1, 1, 4], [2, 2, 5], [1, 2, 2], [1, 1, 3], [1, 3, 6], [2, 3, 5]];
function multX(r) {
  const M = shuffle(r, pick(r, MULTS)), s = M[0] + M[1] + M[2];
  if (180 % s !== 0) return { skip: true };
  const x = 180 / s;
  return {
    q: `三角形の3つの内角の大きさが、${M.map((m) => `$${m === 1 ? "" : m}x^\\circ$`).join("、")} のとき、$x$ の値は？`,
    ans: x,
    hint: "三角形の3つの内角の和は、何度だったかな？ その和を、式に表せないかな？",
    steps: [`3つの内角の和は 180° だから、${$(`${M.map((m) => `${m === 1 ? "" : m}x`).join("+")}=180`)}`, `${$(`${s}x=180`)} より、${$(`x=${x}`)}。`],
  };
}
/** 03q04 △ABC で、∠A＝50°、∠B＝∠C のとき ∠B */
function equalTwo(r) {
  const T = tri(r), v = shuffle(r, [0, 1, 2]), me = T.V[v[0]], o1 = T.V[v[1]], o2 = T.V[v[2]], a = 2 * r(10, 70);
  return {
    q: `${T.name} で、∠${me}＝${a}°、∠${o1}＝∠${o2} のとき、∠${o1} の大きさは何度か。`,
    ans: (180 - a) / 2,
    unit: "度",
    hint: `三角形の3つの内角の和は、何度だったかな？ ∠${o1} と ∠${o2} の和は、いくつになるかな？`,
    steps: [`∠${o1}＋∠${o2}＝$180-${a}=${180 - a}$ より ${180 - a}°。`, `∠${o1}＝∠${o2} だから、どちらも ${180 - a}° の半分で、${(180 - a) / 2}°。`],
  };
}

export const UNITS = [
  unit("03", {
    name: "三角形の内角の和と外角",
    desc: "三角形の内角の和は 180°。外角は、となり合わない2つの内角の和に等しい",
    prereqs: ["J2-hk02"],
    points: [
      "三角形の3つの内角の和は 180°。そのわけは、1つの頂点を通って向かい合う辺に平行な直線（補助線）をひき、平行線の錯角と、一直線の角が 180° であることを使って説明できる。",
      "三角形の内側の角を内角という。1つの辺をのばしたとき、のばした辺と、となりの辺がつくる角を、その頂点の外角という。",
      "三角形の外角は、そのとなりにない2つの内角の和に等しい（外角の性質）。内角の和 180° と、一直線の角 180° から説明できる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 03d01a ①③ 2つの内角から、残りの内角
        t("03d01a", interior),
        // 03d01b ② 直角と1つの内角から、残りの内角
        t("03d01b", rightTri),
        // 03d02a ①③ 外角：となり合わない2つの内角の和
        t("03d02a", extFind),
        // 03d02b ② 外角と1つの内角から、もう1つの内角
        t("03d02b", extInner),
        // 03q01a〜c 小テスト（1）
        t("03q01a", interior),
        t("03q01b", extFind),
        t("03q01c", extInner),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 03d03a 内角が x、x+20、2x−40 → x
        t("03d03a", (r) => interiorEq(r, false)),
        // 03d03b 同じ問題で、いちばん大きい内角
        t("03d03b", (r) => interiorEq(r, true)),
        // 03d04a 外角が 110°、∠A＝(x+10)°、∠B＝(2x−5)° → x
        t("03d04a", (r) => extEq(r, false)),
        // 03d04b 同じ問題で、1つの内角
        t("03d04b", (r) => extEq(r, true)),
        // 03q02a 補助線：∠DAB と ∠B の関係を表す言葉
        t("03q02a", auxWord),
        // 03q02b 補助線：∠DAB＋∠BAC＋∠CAE＝180° の根拠
        t("03q02b", auxStraight),
        // 03q02c 説明の根拠の組
        t("03q02c", auxProof),
        // 03q03 x、2x、3x → x
        t("03q03", multX),
        // 03q04 ∠A＝50°、∠B＝∠C → ∠B
        t("03q04", equalTwo),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 03d05 ∠A＝∠B＋∠C などの関係 → ∠A
        t("03d05", relAngleA),
        // 03d06 ∠A：∠B：∠C＝2：3：4 → 1つの内角
        t("03d06", ratio),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 03d07a ∠B・∠C の二等分線の交点 I → ∠BIC
        t("03d07a", (r) => incenter(r, false)),
        // 03d07b ∠BIC から ∠A
        t("03d07b", (r) => incenter(r, true)),
        // 03d08a ∠B の二等分線と ∠ACD の二等分線の交点 E → ∠BEC
        t("03d08a", (r) => excenter(r, false)),
        // 03d08b ∠BEC から ∠A
        t("03d08b", (r) => excenter(r, true)),
        // 03q05 チャレンジ：二等分線の交点 I → ∠BIC
        t("03q05", (r) => incenter(r, false)),
      ],
    },
  }),
];

// 移さなかった問題はない
export const SKIPPED = [];
