// ============================================================
// heikou-08.js — 平行と合同 第8時「ぴったり重なる図形の、辺や角の関係を調べよう」
//   ikkan の演習プリント（heikou-08.dr.1〜9）・小テスト（heikou-08.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「08」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：08d01c ＝ heikou-08.dr.1 の ④（∠F の大きさ）
//   図は出せないので、合同な図形は「△ABC≡△DEF」「四角形 ABCD≡四角形 EFGH」と書き、辺の長さ・角の大きさを問題文に書く。
//   どの頂点・辺・角が対応するかは、≡ の書き方（対応する頂点を同じ順に書く）で決まる。≡ の右がわを並べかえた形（△ABC≡△FED など）も出す。
//   「すべて選ぼう」（dr.5・qz.4）は、「いつも合同といえるもの」「合同とはかぎらないもの」を 1つ選ぶ4択にした。折り返し（dr.9）は、点の名前と位置関係を文で言い切った。
//   対応する頂点・辺・角は、≡ の左がわ・右がわの並びから計算で出す（手で書かない）。
// ============================================================
import { t as t0, pick, choices4, shuffle, poly } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** 4択の「当てやすさ」を下げる検査：選択肢の形だけ（長さ・ほかの選択肢との似かた・語の出かた）で、正解が「単独のいちばん」になる問題は作り直す */
const strip = (s) => String(s).replace(/\$/g, "");
const toks = (s) => strip(s).match(/[A-Za-z]|\d+|[぀-ヿ一-鿿]+|[∠△≡∥⊥＝]/g) || [];
const bigrams = (s) => { const x = strip(s).replace(/\s/g, ""), o = new Set(); for (let i = 0; i < x.length - 1; i++) o.add(x.slice(i, i + 2)); return o; };
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
function cueFree(choices, ans) {
  const n = choices.length, ai = choices.findIndex((c) => String(c) === String(ans));
  const T = choices.map((c) => new Set(toks(c))), B = choices.map(bigrams), cnt = {};
  T.forEach((s) => s.forEach((w) => { cnt[w] = (cnt[w] || 0) + 1; }));
  const sim = B.map((b, i) => B.reduce((a, o, j) => (i === j ? a : a + jac(b, o)), 0));
  const sc = [
    choices.map((c) => strip(c).length), sim,
    T.map((s) => [...s].filter((w) => cnt[w] === 1).length),
    T.map((s) => Object.keys(cnt).filter((w) => cnt[w] === n - 1 && !s.has(w)).length),
    T.map((s) => [...s].reduce((a, w) => a + cnt[w], 0)),
  ];
  for (const v of sc) for (const sgn of [1, -1]) {
    const w = v.map((x) => sgn * x), m = Math.max(...w);
    if (w[ai] === m && w.filter((x) => x === m).length === 1) return false;
  }
  return true;
}
/** t(id, build) と同じ。ただし、(1) 数の答えが問題文の数とたまたま同じになる組は、作り直す（skip）、(2) 4択は、形だけで正解が当たる組を、作り直す。
 *  対応を読みとる数の問題（辺の長さ・角の大きさ）は、答えが問題文の数の 1つになるのが本来の形なので、tc（(1) をしない）を使う */
const tc = (id, build) => t0(id, build);
const t = (id, build) => t0(id, (r) => {
  let p;
  for (let i = 0; i < 80; i++) {
    p = build(r);
    if (!p || p.skip || !p.choices || cueFree(p.choices, p.ans)) break;
  }
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});
/** 「正しい／まちがい」の言い方は、選択肢ごとにばらばらにえらぶ（言い方で正解がわからないように） */
const YES = ["等しい", "同じ", "一致する"], NO = ["等しくない", "異なる", "一致しない"];

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const nameSide = (a, b) => [a, b].sort().join("");           // 辺の名前はアルファベット順（AC、EH など）
const cyc = (v) => v.map((x, i) => [x, v[(i + 1) % v.length]]);   // 多角形の辺（ひとまわり）

/** 合同な 2つの図形の対応。左は ABC（ABCD）、右は ≡ に書いた順 R（DEF の並べかえ。perm でなければ DEF のまま）。
 *  kind＝3（三角形）か 4（四角形）。四角形は、EFGH の回転・裏返しだけ（辺が、辺に対応するように） */
function corr(r, kind, perm) {
  const L = kind === 3 ? ["A", "B", "C"] : ["A", "B", "C", "D"], base = kind === 3 ? ["D", "E", "F"] : ["E", "F", "G", "H"];
  let R = base;
  if (perm) {
    do {
      if (kind === 3) R = shuffle(r, base);
      else { const k = r(0, 3); R = [...base.slice(k), ...base.slice(0, k)]; if (r(0, 1)) R = [...R].reverse(); }
    } while (R.join("") === base.join(""));
  }
  const fwd = {}, bwd = {};
  L.forEach((x, i) => { fwd[x] = R[i]; bwd[R[i]] = x; });
  const fig = kind === 3 ? "△" : "四角形 ";
  return { kind, L, base, R, fwd, bwd, lSides: cyc(L).map(([a, b]) => nameSide(a, b)), rSides: cyc(base).map(([a, b]) => nameSide(a, b)), stmt: `${fig}${L.join("")}≡${fig}${R.join("")}`, fig };
}
/** 左の辺 s（AB など）に対応する右の辺／右の辺に対応する左の辺 */
const sideToR = (C, s) => nameSide(C.fwd[s[0]], C.fwd[s[1]]);
const sideToL = (C, s) => nameSide(C.bwd[s[0]], C.bwd[s[1]]);
const pairText = (C) => C.L.map((x) => `${x} と ${C.fwd[x]}`).join("、");
const CORR_STEP = (C) => `${C.stmt} は、${pairText(C)} が対応していることを表す（≡ では、対応する頂点を同じ順に書く）。`;

/** 三角形の 3辺（3つともちがう長さで、三角形ができる） */
function triSides(r, lo = 3, hi = 9) {
  for (;;) {
    const s = [r(lo, hi), r(lo, hi), r(lo, hi)];
    const m = Math.max(...s);
    if (new Set(s).size === 3 && m < s.reduce((a, b) => a + b, 0) - m) return s;
  }
}
/** 四角形の 4辺（いちばん長い辺が、ほかの 3辺の和より短い） */
function quadSides(r) {
  for (;;) {
    const s = [r(2, 9), r(2, 9), r(2, 9), r(2, 9)], m = Math.max(...s);
    if (new Set(s).size >= 3 && m < s.reduce((a, b) => a + b, 0) - m) return s;
  }
}
/** 内角の組：三角形は和 180°（30〜100°）、四角形は和 360°（55〜125°）。ちがう大きさが 3つ以上 */
function angles(r, kind) {
  for (;;) {
    const n = kind, tot = kind === 3 ? 180 : 360, lo = kind === 3 ? 30 : 55, hi = kind === 3 ? 100 : 125, a = [];
    let s = 0;
    for (let i = 0; i < n - 1; i++) { a.push(r(lo, hi)); s += a[i]; }
    const last = tot - s;
    if (last < lo || last > hi) continue;
    a.push(last);
    if (new Set(a).size >= 3) return a;
  }
}
const sideTexts = (C, vals, which) => (which === "L" ? C.lSides : C.rSides).map((s, i) => `${s}＝${vals[i]}cm`).join("、");
const angTexts = (C, vals, which) => (which === "L" ? C.L : C.base).map((v, i) => `∠${v}＝${vals[i]}°`).join("、");

const HINT_V = "≡ の記号では、対応する頂点を、どんな順に書くきまりだったかな？";
const HINT_S = "辺の両はしの頂点に、それぞれ対応する頂点は、どれかな？ ≡ の書き方から、わかるかな？";
const HINT_LEN = "合同な図形で、対応する辺の長さは、どうなっていたかな？ どの辺とどの辺が対応するかは、≡ の書き方からわかるかな？";
const HINT_ANG = "合同な図形で、対応する角の大きさは、どうなっていたかな？ どの角とどの角が対応するかは、≡ の書き方からわかるかな？";

/** 順序つきの 2つ組（ならべかえ）：x≠y のすべて */
const ordPairs = (arr) => arr.flatMap((x) => arr.filter((y) => y !== x).map((y) => [x, y]));
/** 頂点の対応（4択）。四角形は 1つ（選択肢は 4つの頂点）、三角形は 2つを順に（選択肢は、ならべかえた 2つ組） */
function qVertex(r, kind, perm) {
  const C = corr(r, kind, perm), toR = r(0, 1) === 0, from = toR ? C.L : C.base, to = toR ? C.base : C.L, map = (v) => (toR ? C.fwd[v] : C.bwd[v]);
  if (kind === 4) {
    const v = pick(r, from), ans = map(v);
    return {
      q: `${C.stmt} のとき、頂点 ${v} に対応する頂点は、次のうちどれか。`,
      ans: `頂点 ${ans}`,
      choices: choices4(r, `頂点 ${ans}`, to.filter((x) => x !== ans).map((x) => `頂点 ${x}`)),
      hint: HINT_V,
      steps: [CORR_STEP(C), `頂点 ${v} に対応する頂点は、頂点 ${ans}。`],
    };
  }
  const [v1, v2] = shuffle(r, from).slice(0, 2), fmt = (a, b) => `頂点 ${a}、頂点 ${b}`, ans = fmt(map(v1), map(v2));
  const wrongs = shuffle(r, ordPairs(to).filter(([a, b]) => fmt(a, b) !== ans)).slice(0, 3).map(([a, b]) => fmt(a, b));
  return {
    q: `${C.stmt} のとき、頂点 ${v1}、頂点 ${v2} に対応する頂点は、順に、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs),
    hint: HINT_V,
    steps: [CORR_STEP(C), `頂点 ${v1} に対応する頂点は頂点 ${map(v1)}、頂点 ${v2} に対応する頂点は頂点 ${map(v2)}。`, `順に答えて　${ans}。`],
  };
}
/** 辺の対応（4択）。四角形は 1つ（選択肢は 4つの辺）、三角形は 2つを順に（選択肢は、ならべかえた 2つ組） */
function qSide(r, kind, perm) {
  const C = corr(r, kind, perm), toR = r(0, 1) === 0, fromS = toR ? C.lSides : C.rSides, toS = toR ? C.rSides : C.lSides;
  const mapS = (s) => (toR ? sideToR(C, s) : sideToL(C, s)), mapV = (v) => (toR ? C.fwd[v] : C.bwd[v]);
  const why = (s) => `辺 ${s} の両はしの頂点 ${s[0]}、${s[1]} に対応するのは、頂点 ${mapV(s[0])}、${mapV(s[1])}。辺 ${s} に対応する辺は、辺 ${mapS(s)}。`;
  if (kind === 4) {
    const s = pick(r, fromS), ans = mapS(s);
    return {
      q: `${C.stmt} のとき、辺 ${s} に対応する辺は、次のうちどれか。`,
      ans: `辺 ${ans}`,
      choices: choices4(r, `辺 ${ans}`, toS.filter((z) => z !== ans).map((z) => `辺 ${z}`)),
      hint: HINT_S,
      steps: [CORR_STEP(C), why(s)],
    };
  }
  const [s1, s2] = shuffle(r, fromS).slice(0, 2), fmt = (a, b) => `辺 ${a}、辺 ${b}`, ans = fmt(mapS(s1), mapS(s2));
  const wrongs = shuffle(r, ordPairs(toS).filter(([a, b]) => fmt(a, b) !== ans)).slice(0, 3).map(([a, b]) => fmt(a, b));
  return {
    q: `${C.stmt} のとき、辺 ${s1}、辺 ${s2} に対応する辺は、順に、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs),
    hint: HINT_S,
    steps: [CORR_STEP(C), why(s1), `${why(s2)} 順に答えて　${ans}。`],
  };
}
/** 辺の長さ（数）：片方の図形の辺の長さを言って、もう片方の辺の長さを聞く */
function qLength(r, kind, perm) {
  const C = corr(r, kind, perm), vals = kind === 3 ? triSides(r) : quadSides(r), toR = r(0, 1) === 0;
  const given = toR ? C.lSides : C.rSides, asked = pick(r, toR ? C.rSides : C.lSides), src = toR ? sideToL(C, asked) : sideToR(C, asked);
  const ans = vals[given.indexOf(src)];
  return {
    q: `${C.stmt} で、${sideTexts(C, vals, toR ? "L" : "R")} のとき、辺 ${asked} の長さは何 cm か。`,
    ans, unit: "cm", hint: HINT_LEN,
    steps: [CORR_STEP(C), `辺 ${asked} に対応する辺は、辺 ${src}。`, `合同な図形では、対応する辺の長さは等しいから　${asked}＝${src}＝${ans}cm`],
  };
}
/** 角の大きさ（数）：片方の図形の角を全部言って、もう片方の角を聞く */
function qAngle(r, kind, perm) {
  const C = corr(r, kind, perm), vals = angles(r, kind), toR = r(0, 1) === 0;
  const askV = pick(r, toR ? C.base : C.L), srcV = toR ? C.bwd[askV] : C.fwd[askV], ans = vals[(toR ? C.L : C.base).indexOf(srcV)];
  return {
    q: `${C.stmt} で、${angTexts(C, vals, toR ? "L" : "R")} のとき、∠${askV} の大きさは何度か。`,
    ans, unit: "度", hint: HINT_ANG,
    steps: [CORR_STEP(C), `∠${askV} に対応する角は、∠${srcV}。`, `合同な図形では、対応する角の大きさは等しいから　∠${askV}＝∠${srcV}＝${ans}°`],
  };
}

/** 三角形：2つの角を言って（左の角でも、右の角でも。mixed なら 1つずつ）、のこりの 1つの角を聞く（内角の和 180°） */
function angleChase(r, perm, opt = {}) {
  const C = corr(r, 3, perm), v = angles(r, 3);
  const k = r(0, 2), others = [0, 1, 2].filter((i) => i !== k);
  const showR = opt.mixed ? [r(0, 1) === 1, r(0, 1) === 1] : [false, false];
  if (opt.mixed && showR[0] === showR[1]) showR[1] = !showR[0];
  const nm = (i, right) => (right ? C.R[i] : C.L[i]);
  const given = others.map((i, j) => `∠${nm(i, showR[j])}＝${v[i]}°`).join("、");
  const askR = opt.askRight != null ? opt.askRight : r(0, 1) === 1;
  const askName = nm(k, askR), leftSum = others.map((i) => v[i]);
  const eqs = others.map((i, j) => `∠${C.L[i]}＝∠${C.R[i]}＝${v[i]}°`).join("、");
  return {
    q: `${C.stmt} で、${given} のとき、∠${askName} の大きさは何度か。`,
    ans: v[k], unit: "度",
    hint: "合同な図形では、対応する角の大きさは等しい。△ABC の 3つの角のうち、わかる角はどれかな？ 三角形の内角の和は何度だったかな？",
    steps: [
      `${CORR_STEP(C)}対応する角は等しいから　${eqs}`,
      `△ABC の内角の和は 180° だから　∠${C.L[k]}＝180°−${leftSum[0]}°−${leftSum[1]}°＝${v[k]}°`,
      askR ? `∠${askName} は ∠${C.L[k]} に対応するから　∠${askName}＝${v[k]}°` : `求める角は ∠${C.L[k]} だから　∠${askName}＝${v[k]}°`,
    ],
  };
}

// ── 「いつも合同といえるか」の文 ─────────────────────────────────────
const rectPair = (r, kind) => {   // kind＝area（面積が同じ）／peri（周の長さが同じ）：ちがう長方形（正方形でない）を 2つ。縦＜横
  for (let i = 0; i < 200; i++) {
    const fs = [];
    let n;
    if (kind === "area") {
      n = pick(r, [12, 16, 18, 20, 24, 30, 36]);
      for (let w = 1; w * w < n; w++) if (n % w === 0) fs.push([w, n / w]);
    } else {
      const h = r(5, 10);   // 縦＋横
      n = 2 * h;
      for (let w = 1; 2 * w < h; w++) fs.push([w, h - w]);
    }
    if (fs.length >= 2) { const [p, q] = shuffle(r, fs).slice(0, 2); return { n, p, q }; }
  }
  return null;
};
const triPair = (r) => {   // 周の長さが同じで、ちがう三角形 2つ
  for (let i = 0; i < 400; i++) {
    const per = r(10, 18), mk = () => { const a = r(2, 7), b = r(2, 7), c = per - a - b; const s = [a, b, c].sort((x, y) => x - y); return c >= 2 && s[2] < s[0] + s[1] ? s.join(",") : null; };
    const x = mk(), y = mk();
    if (x && y && x !== y) return { per, x: x.split(",").map(Number), y: y.split(",").map(Number) };
  }
  return null;
};
/** 文の候補。ok＝いつも合同といえる。why(r)＝解説（正しい理由、または、重ならない例） */
const STM = [
  { ok: true, text: "半径が等しい 2つの円は、合同である。", why: () => "半径が決まると円の大きさが決まるので、半径が等しい 2つの円は、ぴったり重なる。" },
  { ok: true, text: "直径が等しい 2つの円は、合同である。", why: () => "直径が決まると半径も決まるので、直径が等しい 2つの円は、ぴったり重なる。" },
  { ok: true, text: "面積が等しい 2つの円は、合同である。", why: () => "円の面積は半径で決まるので、面積が等しければ半径も等しく、ぴったり重なる。" },
  { ok: true, text: "1辺の長さが等しい 2つの正方形は、合同である。", why: () => "正方形は、4つの辺が等しく、4つの角が直角なので、1辺が決まると形も大きさも決まる。" },
  { ok: true, text: "面積が等しい 2つの正方形は、合同である。", why: () => "正方形の面積は1辺で決まるので、面積が等しければ1辺も等しく、ぴったり重なる。" },
  { ok: true, text: "周の長さが等しい 2つの正方形は、合同である。", why: () => "正方形の周の長さは1辺で決まるので、周の長さが等しければ1辺も等しく、ぴったり重なる。" },
  { ok: true, text: "1辺の長さが等しい 2つの正三角形は、合同である。", why: () => "正三角形は、3つの辺が等しく、3つの角が 60° なので、1辺が決まると形も大きさも決まる。" },
  { ok: true, text: "周の長さが等しい 2つの正三角形は、合同である。", why: () => "正三角形の周の長さは1辺で決まるので、周の長さが等しければ1辺も等しく、ぴったり重なる。" },
  { ok: true, text: "縦と横の長さがそれぞれ等しい 2つの長方形は、合同である。", why: () => "長方形は、4つの角が直角なので、縦と横の長さが決まると、形も大きさも決まる。" },
  { ok: true, text: "面積が等しく、縦の長さも等しい 2つの長方形は、合同である。", why: () => "面積を縦の長さでわると横の長さが決まるので、縦と横の長さがそれぞれ等しくなり、ぴったり重なる。" },
  { ok: true, text: "半径と中心角がそれぞれ等しい 2つのおうぎ形は、合同である。", why: () => "半径と中心角が決まると、おうぎ形の形も大きさも決まる。" },
  { ok: false, text: "面積が等しい 2つの長方形は、合同である。", why: (r) => { const g = rectPair(r, "area"); return `たとえば、縦 ${g.p[0]}cm・横 ${g.p[1]}cm と、縦 ${g.q[0]}cm・横 ${g.q[1]}cm の長方形は、面積が同じ（${g.n}cm²）でも、重ならない。`; } },
  { ok: false, text: "周の長さが等しい 2つの長方形は、合同である。", why: (r) => { const g = rectPair(r, "peri"); return `たとえば、縦 ${g.p[0]}cm・横 ${g.p[1]}cm と、縦 ${g.q[0]}cm・横 ${g.q[1]}cm の長方形は、周の長さが同じ（${g.n}cm）でも、重ならない。`; } },
  { ok: false, text: "周の長さが等しい 2つの三角形は、合同である。", why: (r) => { const g = triPair(r); return `たとえば、辺が ${g.x.join("cm・")}cm の三角形と、${g.y.join("cm・")}cm の三角形は、周の長さが同じ（${g.per}cm）でも、重ならない。`; } },
  { ok: false, text: "面積が等しい 2つの三角形は、合同である。", why: (r) => { const b = pick(r, [[4, 3], [6, 2], [8, 3], [6, 4]]); return `たとえば、底辺 ${b[0]}cm・高さ ${b[1] * 2}cm と、底辺 ${b[0] * 2}cm・高さ ${b[1]}cm の三角形は、面積が同じ（${b[0] * b[1]}cm²）でも、重ならない。`; } },
  { ok: false, text: "半径が等しい 2つのおうぎ形は、合同である。", why: (r) => { const a = pick(r, [[90, 60], [120, 45], [180, 90], [60, 30]]), rad2 = r(4, 9); return `たとえば、半径 ${rad2}cm で、中心角が ${a[0]}° と ${a[1]}° のおうぎ形は、半径が同じでも、重ならない。`; } },
  { ok: false, text: "底辺と高さがそれぞれ等しい 2つの三角形は、合同である。", why: (r) => { const b = r(4, 9), h = r(3, 7); return `たとえば、底辺 ${b}cm・高さ ${h}cm の三角形でも、頂点の位置がちがえば（直角三角形と二等辺三角形など）、形がちがって重ならない。`; } },
  { ok: false, text: "縦の長さが等しい 2つの長方形は、合同である。", why: (r) => { const a = r(3, 6), b = a + r(1, 3), c = b + r(1, 3); return `たとえば、縦 ${a}cm・横 ${b}cm と、縦 ${a}cm・横 ${c}cm の長方形は、縦が同じでも、重ならない。`; } },
  { ok: false, text: "面積が等しい 2つの図形は、合同である。", why: (r) => { const a = pick(r, [3, 4, 5, 6]); return `たとえば、1辺 ${a}cm の正方形と、縦 1cm・横 ${a * a}cm の長方形は、面積が同じ（${a * a}cm²）でも、重ならない。`; } },
  { ok: false, text: "周の長さが等しい 2つの図形は、合同である。", why: (r) => { const a = pick(r, [3, 4, 5, 6]); return `たとえば、1辺 ${a}cm の正方形と、縦 ${a - 1}cm・横 ${a + 1}cm の長方形は、周の長さが同じ（${4 * a}cm）でも、重ならない。`; } },
];
/** 文を 4つならべる。nOk＝いつも合同といえる文の数（1か 3） */
function stmtQ(r, nOk, stem, hintOK) {
  const oks = shuffle(r, STM.filter((s) => s.ok)).slice(0, nOk), bads = shuffle(r, STM.filter((s) => !s.ok)).slice(0, 4 - nOk);
  const want = nOk === 1 ? oks[0] : bads[0], wrongs = nOk === 1 ? bads : oks;   // 「いつも合同といえるもの」を聞くときは ok が答え、「合同とはかぎらないもの」を聞くときは bad が答え
  const lines = wrongs.map((s) => `「${s.text.replace(/。$/, "")}」… ${s.why(r)}`);
  return {
    q: stem,
    ans: want.text,
    choices: choices4(r, want.text, wrongs.map((s) => s.text)),
    hint: hintOK,
    steps: [`${nOk === 1 ? "いつも合同といえる" : "合同とはかぎらない"}のは「${want.text.replace(/。$/, "")}」。${want.why(r)}`, ...lines.slice(0, 3)],
  };
}

// ── 折り返し（dr.9）：△ABC の辺 AB 上に D、辺 AC 上に E。A が辺 BC 上の A′ に重なるように、DE で折る。∠BDA′＝d のとき、∠A′EC＝2∠A−d ──
const rd = (x) => (x * Math.PI) / 180;
function foldOK(b, c, d) {
  const A0 = 180 - b - c;
  if (A0 <= 0) return false;
  const AB = Math.sin(rd(c)) / Math.sin(rd(A0)), A = [AB * Math.cos(rd(b)), AB * Math.sin(rd(b))], B = [0, 0], C = [1, 0];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]], dot = (p, q) => p[0] * q[0] + p[1] * q[1];
  const ang = (P, Q, R) => { const u = sub(P, Q), v = sub(R, Q); return (Math.acos(Math.max(-1, Math.min(1, dot(u, v) / Math.hypot(...u) / Math.hypot(...v)))) * 180) / Math.PI; };
  const at = (V, W, Ap) => {   // 辺 V→W 上で、AA′ の垂直二等分線との交点のパラメータ u（V から W へ 0〜1）
    const w = sub(W, V), n = sub(Ap, A), m = [(A[0] + Ap[0]) / 2, (A[1] + Ap[1]) / 2];
    return dot(sub(m, V), n) / dot(w, n);
  };
  const f = (t) => { const Ap = [t, 0], uD = at(A, B, Ap), D = [A[0] + uD * (B[0] - A[0]), A[1] + uD * (B[1] - A[1])]; return { Ap, uD, D, v: ang(B, D, Ap) - d }; };
  const brackets = [];
  let t0 = 0.01, f0 = f(t0);
  for (let i = 1; i <= 400; i++) {
    const t1 = 0.01 + (0.98 * i) / 400, f1 = f(t1);
    if (f0.v * f1.v < 0) brackets.push([t0, t1]);
    t0 = t1; f0 = f1;
  }
  if (brackets.length !== 1) return false;
  let [lo, hi] = brackets[0];
  const sgn = f(lo).v > 0;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if ((f(mid).v > 0) === sgn) lo = mid; else hi = mid; }
  const { Ap, uD } = f((lo + hi) / 2), uE = at(A, C, Ap);
  if (!(uD > 0.03 && uD < 0.97 && uE > 0.03 && uE < 0.97)) return false;
  const E = [A[0] + uE * (C[0] - A[0]), A[1] + uE * (C[1] - A[1])];
  if (Math.abs(ang(Ap, E, C) - (2 * A0 - d)) > 1e-6) return false;   // 式の確かめ（折り返しの計算とずれていたら、使わない）
  return true;
}
function foldQ(r) {
  for (let i = 0; i < 2000; i++) {
    const b = r(40, 80), c = r(35, 75), A0 = 180 - b - c, d = 2 * r(20, 60);
    if (A0 < 30 || A0 > 90 || b === c || 2 * A0 - d < 20 || 2 * A0 - d > 110 || !foldOK(b, c, d)) continue;
    const h = (180 - d) / 2, aed = 180 - A0 - h, x = 180 - 2 * aed;
    return {
      q: `△ABC で、∠B＝${b}°、∠C＝${c}° である。辺 AB 上に点 D、辺 AC 上に点 E をとり、頂点 A が辺 BC 上の点 A′ に重なるように、線分 DE を折り目として折った。∠BDA′＝${d}° のとき、∠A′EC の大きさは？`,
      ans: x, unit: "度",
      hint: "折り返した図形は、もとの図形と合同だったね。折り目をはさんで、等しくなる角は、どれとどれかな？",
      steps: [
        `折り返したから　△ADE≡△A′DE。よって　∠ADE＝∠A′DE＝(180°−${d}°)÷2＝${h}°`,
        `∠A＝180°−${b}°−${c}°＝${A0}°。△ADE の内角の和から　∠AED＝180°−${A0}°−${h}°＝${aed}°`,
        `∠A′ED＝∠AED＝${aed}° だから　∠A′EC＝180°−${aed}°−${aed}°＝${x}°`,
      ],
    };
  }
  return { skip: true };
}

// ── x、y の値（dr.8）──────────────────────────────────────────────
const lin = (p, q, v = "x") => $(`(${poly([p, q], v)})`);
function xyQ(r, ask) {
  for (let i = 0; i < 500; i++) {
    const x = r(2, 9), y = r(1, 9), p1 = r(1, 4), p2 = r(1, 4), p3 = r(1, 4), p4 = r(1, 3), L1 = r(6, 24), L2 = r(5, 20);
    const q1 = L1 - p1 * x, q2 = L1 - p2 * x, q3 = L2 - p3 * x, q4 = L2 - p4 * y;
    if (p1 === p2 || x === y || [q1, q2, q3, q4].some((q) => q === 0 || Math.abs(q) > 12)) continue;
    if ((p3 === p1 && q3 === q1) || (p3 === p2 && q3 === q2)) continue;   // 2つの辺が、同じ式にならないように
    const dp = Math.abs(p1 - p2), dq = p1 > p2 ? q2 - q1 : q1 - q2;
    const e1 = poly([p1, q1]), e2 = poly([p2, q2]), e3 = poly([p3, q3]), e4 = poly([p4, q4], "y");
    const xs = [dp === 1 ? `AB＝DE だから　${$(`${e1}=${e2}`)}、${$(`x=${x}`)}` : `AB＝DE だから　${$(`${e1}=${e2}`)}、${$(`${dp}x=${dq}`)}、${$(`x=${x}`)}`];
    const ys = [
      `BC＝EF だから　${$(`${e3}=${e4}`)}。${$(`x=${x}`)} を入れて　${$(`${L2}=${e4}`)}、${$(`y=${y}`)}`,
      `（確かめ　AB＝DE＝${L1}cm、BC＝EF＝${L2}cm）`,
    ];
    const qq = `△ABC≡△DEF で、AB＝${lin(p1, q1)}cm、DE＝${lin(p2, q2)}cm、BC＝${lin(p3, q3)}cm、EF＝${lin(p4, q4, "y")}cm である。${$(ask)} の値は？`;
    if ((qq.match(/\d+/g) || []).map(Number).includes(ask === "x" ? x : y)) continue;
    return {
      q: qq,
      ans: ask === "x" ? x : y,
      hint: ask === "x" ? "合同な図形で、対応する辺の長さは、どうなっていたかな？ AB に対応する辺は、どれかな？" : "合同な図形で、対応する辺の長さは、どうなっていたかな？ BC に対応する辺は、どれかな？ そのために、$x$ の値は、わかるかな？",
      steps: ask === "x" ? xs : [...xs, ...ys],
    };
  }
  return { skip: true };
}

export const UNITS = [
  unit("08", {
    name: "合同な図形（対応する頂点・辺・角）",
    desc: "合同の意味、対応する頂点・辺・角、記号 ≡ の書き方と、合同な図形の性質",
    prereqs: ["J2-hk07"],
    points: [
      "平面上の 2つの図形が、移動して、ぴったり重なる（裏返してもよい）とき、この 2つの図形は合同であるという。重なり合う頂点・辺・角を、それぞれ対応する頂点・辺・角という。",
      "合同を表す記号は ≡ で、△ABC≡△DEF のように書く。≡ の左右には、対応する頂点を同じ順に書く（A と D、B と E、C と F が対応）。順番をかえると、対応がかわる。",
      "合同な図形では、対応する線分の長さは等しく、対応する角の大きさも等しい。",
      "形が同じでも大きさがちがう、辺の長さが 1つでもちがう、などの図形は、合同ではない。面積や周の長さが同じだけでは、合同とはかぎらない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 08d01a 演習（1）① 頂点 B に対応する頂点
        t("08d01a", (r) => qVertex(r, pick(r, [3, 4]), false)),
        // 08d01b 演習（1）②③ 辺の長さ
        tc("08d01b", (r) => qLength(r, 3, false)),
        // 08d01c 演習（1）④ 角の大きさ
        tc("08d01c", (r) => qAngle(r, 3, false)),
        // 08d01d 演習（1）⑤ 辺 AC に対応する辺
        t("08d01d", (r) => qSide(r, pick(r, [3, 4]), false)),
        // 08d02a 演習（2）①② 四角形の辺の長さ
        tc("08d02a", (r) => qLength(r, 4, false)),
        // 08d02b 演習（2）③ 四角形の角の大きさ
        tc("08d02b", (r) => qAngle(r, 4, false)),
        // 08d02c 演習（2）④ 辺 AD に対応する辺
        t("08d02c", (r) => qSide(r, 4, false)),
        // 08q01a 小テスト（1）重なり合う頂点・辺・角を何というか
        t("08q01a", (r) => {
          const ans = "対応する頂点・辺・角";
          const pool = ["共有", "隣接", "交差", "接続", "並行"];
          return {
            q: "合同な図形で、重なり合う頂点・辺・角を、それぞれ何というか。",
            ans,
            choices: choices4(r, ans, shuffle(r, pool).slice(0, 3).map((x) => `${x}する頂点・辺・角`)),
            hint: "ぴったり重なる 2つの図形で、重なり合う頂点どうしを、何とよんだかな？",
            steps: ["合同な図形で、重なり合う頂点・辺・角を、それぞれ「対応する頂点・辺・角」という。", `正しいのは「${ans}」。`],
          };
        }),
        // 08q01b 小テスト（1）合同を表す記号
        t("08q01b", (r) => {
          const ans = "≡";
          const MEAN = { "∥": "平行", "⊥": "垂直", "∠": "角", "△": "三角形", "≠": "等しくない" };
          const ws = shuffle(r, Object.keys(MEAN)).slice(0, 3);
          return {
            q: pick(r, ["合同であることを表す記号は、次のうちどれか。", "△ABC と △DEF が合同であることを、△ABC □ △DEF と書く。□ に入る記号は、次のうちどれか。"]),
            ans,
            choices: choices4(r, ans, ws),
            hint: "△ABC と △DEF がぴったり重なることを、記号で書くとき、どんな記号を使ったかな？",
            steps: ["合同であることは、記号 ≡ を使って、△ABC≡△DEF のように書く。", `ほかの記号は、${ws.map((w) => `${w}（${MEAN[w]}）`).join("、")}を表す。`],
          };
        }),
        // 08q02a 小テスト（2）① 頂点 A に対応する頂点
        t("08q02a", (r) => qVertex(r, 3, r(0, 2) === 0)),
        // 08q02b 小テスト（2）② 辺の長さ
        tc("08q02b", (r) => qLength(r, 3, r(0, 2) === 0)),
        // 08q02c 小テスト（2）③ 角の大きさ
        tc("08q02c", (r) => qAngle(r, 3, r(0, 2) === 0)),
        // 08q02d 小テスト（2）④ 辺 DF に対応する辺
        t("08q02d", (r) => qSide(r, 3, r(0, 2) === 0)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 08d03a 演習（3）対応する頂点から ≡ の書き方（4択）
        t("08d03a", (r) => {
          const C = corr(r, 3, true), ans = `△ABC≡△${C.R.join("")}`;
          const perms = [["D", "E", "F"], ["D", "F", "E"], ["E", "D", "F"], ["E", "F", "D"], ["F", "D", "E"], ["F", "E", "D"]].map((p) => p.join("")).filter((p) => p !== C.R.join(""));
          const ws = ["DEF", ...shuffle(r, perms.filter((p) => p !== "DEF")).slice(0, 2)].map((p) => `△ABC≡△${p}`);
          return {
            q: `△ABC と △DEF は合同で、${pairText(C).replace(/、/g, "、頂点 ").replace(/^/, "頂点 ")} が対応している。このことを、記号 ≡ を使って表したものは、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, ws),
            hint: HINT_V,
            steps: [`≡ では、対応する頂点を、同じ順に書く。△ABC と書いたので、右がわには、A、B、C に対応する頂点を、この順に書く。`, `A に対応するのは ${C.fwd.A}、B に対応するのは ${C.fwd.B}、C に対応するのは ${C.fwd.C} だから　${ans}`],
          };
        }),
        // 08d03b 演習（3）辺 AC に対応する辺（≡ の右がわを並べかえた形）
        t("08d03b", (r) => qSide(r, pick(r, [3, 4]), true)),
        // 08d04 演習（4）四角形の 3つの角から、のこりの角に対応する角
        t("08d04", (r) => {
          const C = corr(r, 4, true), v = angles(r, 4), m = r(0, 3), toR = r(0, 1) === 0;
          const showSide = toR ? C.L : C.R, askSide = toR ? C.R : C.L, idx = [0, 1, 2, 3].filter((i) => i !== m);
          const given = idx.map((i) => `∠${showSide[i]}＝${v[i]}°`).join("、"), sum3 = idx.reduce((s, i) => s + v[i], 0);
          const gl = idx.map((i) => `${v[i]}°`).join("+");
          return {
            q: `${C.stmt} で、${given} のとき、∠${askSide[m]} の大きさは何度か。`,
            ans: v[m], unit: "度",
            hint: "四角形の 4つの内角の和は何度だったかな？ 合同な図形で、対応する角の大きさは、どうなっていたかな？",
            steps: [
              CORR_STEP(C),
              `四角形の内角の和は 360° だから　∠${showSide[m]}＝360°−(${gl})＝360°−${sum3}°＝${v[m]}°`,
              `∠${askSide[m]} は ∠${showSide[m]} に対応するから　∠${askSide[m]}＝${v[m]}°`,
            ],
          };
        }),
        // 08q03 小テスト（3）∠A、∠E から ∠F
        t("08q03", (r) => angleChase(r, false, { mixed: true, askRight: true })),
        // 08q04 小テスト（4）いつも合同といえるもの（ア〜エ → 1つ選ぶ）
        t("08q04", (r) => stmtQ(r, 1, "次の 4つの文のうち、いつでも合同といえるものは、どれか。", "合同な図形は、ぴったり重なるのだったね。その条件がそろっても、重ならない図形は、つくれないかな？")),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 08d05a 演習（5）いつも合同といえるもの（1つ選ぶ）
        t("08d05a", (r) => stmtQ(r, 1, "次の 4つの文のうち、いつでも合同といえるものは、どれか。", "合同な図形は、ぴったり重なるのだったね。その条件がそろっても、重ならない図形は、つくれないかな？")),
        // 08d05b 演習（5）合同とはかぎらないもの（1つ選ぶ）
        t("08d05b", (r) => stmtQ(r, 3, "次の 4つの文のうち、合同であるとはかぎらないものは、どれか。", "合同な図形は、ぴったり重なるのだったね。その条件がそろっても、重ならない図形は、つくれないかな？")),
        // 08d05c 演習（5）ア 合同な図形の性質（4択。「長さ」「大きさ」それぞれについて、等しいか等しくないかを、言い方をかえて 2×2 にそろえる）
        t("08d05c", (r) => {
          const mk = (a, b) => `対応する線分の長さは${pick(r, a ? YES : NO)}。対応する角の大きさは${pick(r, b ? YES : NO)}。`;
          const ans = mk(true, true);
          return {
            q: pick(r, ["合同な 2つの図形について、正しいものはどれか。", "△ABC≡△DEF のとき、対応する辺と角について、正しいものはどれか。"]),
            ans,
            choices: choices4(r, ans, [mk(true, false), mk(false, true), mk(false, false)]),
            hint: "ぴったり重なるとき、対応する線分や角は、どうなっているかな？",
            steps: ["合同な図形は、ぴったり重なるので、対応する線分の長さは等しく、対応する角の大きさも等しい。", `正しいのは「${ans}」。ほかの選択肢は、線分の長さか角の大きさの少なくとも一方が、等しくないことになっている。`],
          };
        }),
        // 08d06 演習（6）周の長さから、のこりの辺の長さ
        t("08d06", (r) => {
          const C = corr(r, 3, r(0, 1) === 0), vals = triSides(r, 4, 10), P = vals.reduce((a, b) => a + b, 0), toR = r(0, 1) === 0;
          const ti = r(0, 2), t0 = C.lSides[ti], others = [0, 1, 2].filter((i) => i !== ti);
          const rs = (i) => sideToR(C, C.lSides[i]);
          const given = toR ? others.map((i) => `${C.lSides[i]}＝${vals[i]}cm`).join("、") : others.map((i) => `${rs(i)}＝${vals[i]}cm`).join("、");
          const askN = toR ? rs(ti) : t0;
          const left = (i) => C.lSides[i];
          return {
            q: `${C.stmt} で、${given} である。△ABC の周の長さが ${P}cm のとき、辺 ${askN} の長さは何 cm か。`,
            ans: vals[ti], unit: "cm",
            hint: `三角形の周の長さは、3つの辺の長さの和だったね。辺 ${askN} に対応する辺は、どれかな？`,
            steps: [
              CORR_STEP(C),
              toR ? `△ABC の辺は　${others.map((i) => `${left(i)}＝${vals[i]}cm`).join("、")}` : `対応する辺は等しいから　${others.map((i) => `${rs(i)}＝${left(i)}＝${vals[i]}cm`).join("、")}`,
              `${t0}＝${P}−${vals[others[0]]}−${vals[others[1]]}＝${vals[ti]}（cm）`,
              toR ? `辺 ${askN} は辺 ${t0} に対応するから　${askN}＝${t0}＝${vals[ti]}cm` : `求める辺は ${t0} だから　${vals[ti]}cm`,
            ],
          };
        }),
        // 08d07 演習（7）2つの角から、のこりの角（内角の和）
        t("08d07", (r) => angleChase(r, r(0, 1) === 0, { mixed: true })),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 08d08a 演習（8）x の値
        t("08d08a", (r) => xyQ(r, "x")),
        // 08d08b 演習（8）y の値
        t("08d08b", (r) => xyQ(r, "y")),
        // 08d09 演習（9）折り返し
        t("08d09", (r) => foldQ(r)),
        // 08q05 小テスト（5）チャレンジ：周の長さと x から、辺 DF
        t("08q05", (r) => {
          for (let i = 0; i < 500; i++) {
            const x = r(2, 8), [ab, bc, ca] = triSides(r, 5, 16), P = ab + bc + ca, p1 = r(2, 3), p3 = r(2, 4);
            const c2 = ab - x, q1 = ab - p1 * x, q3 = bc - p3 * x;
            if (c2 === 0 || q1 === 0 || q3 === 0 || Math.abs(q1) > 12 || Math.abs(q3) > 12 || Math.abs(c2) > 12) continue;
            const e1 = poly([p1, q1]), e2 = poly([1, c2]), e3 = poly([p3, q3]);
            const qq = `△ABC≡△DEF で、AB＝${lin(p1, q1)}cm、DE＝${lin(1, c2)}cm、BC＝${lin(p3, q3)}cm である。△ABC の周の長さが ${P}cm のとき、辺 DF の長さは何 cm か。`;
            if ((qq.match(/\d+/g) || []).map(Number).includes(ca)) continue;
            return {
              q: qq,
              ans: ca, unit: "cm",
              hint: "AB に対応する辺は、どれかな？ そこから、$x$ の値がわかるかな？ 辺 DF に対応する辺は、どれかな？",
              steps: [
                `AB＝DE だから　${$(`${e1}=${e2}`)}、${$(`x=${x}`)}`,
                `${$(`x=${x}`)} を入れて　AB＝${p1}×${x}${q1 < 0 ? "−" : "+"}${Math.abs(q1)}＝${ab}（cm）、BC＝${p3}×${x}${q3 < 0 ? "−" : "+"}${Math.abs(q3)}＝${bc}（cm）`,
                `CA＝${P}−${ab}−${bc}＝${ca}（cm）`,
                `DF は CA に対応するから　DF＝CA＝${ca}cm`,
              ],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

export const SKIPPED = [];   // 第8時は、演習プリント 9問・小テスト 5問のすべてを移した（図は ≡ の書き方と、辺・角の数字を問題文に書いた。「すべて選ぼう」は 1つ選ぶ4択、dr.9 の折り返しは位置関係を文で言い切った）
