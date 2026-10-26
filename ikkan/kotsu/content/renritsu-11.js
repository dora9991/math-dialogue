// ============================================================
// renritsu-11.js — 連立方程式 第11時「条件を変えると、解はどうなるだろう」
//   ikkan の演習プリント（renritsu-11.dr.1〜7）・小テスト（renritsu-11.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「11」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：11d01a ＝ renritsu-11.dr.1 の1つ目
//   ○×をつける問題は、「解は問題の答えになるか（理由つき）」を選ぶ4択（a）と、解の値そのものを聞く数値入力（b）に分けた。
//   解は、すべて algebra.js の solve2 で計算している（手で書いた答えは無い）。解説に出す途中の式は、同じ数から計算している。
// ============================================================
import { t, pick, choices4, shuffle, fracAns, round, gcd, rnz, coefVar, signedVar } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { solve2, casesTex, linTex, Q, qadd, qsub, qmul, qval, qisint, qtex, qeq } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 小さな道具 ──────────────────────────────────────────
const pn = (n) => (n < 0 ? `(${n})` : `${n}`);                         // 負の数にかっこ（TeX の中）
const mulT = (k) => (k === 1 ? "" : `×${pt(k)}`);                   // ①×1 とは書かない
const pt = (n) => (n < 0 ? `(−${-n})` : `${n}`);                       // 負の数にかっこ（ふつうの文字）
const ansQ = (q) => fracAns(q[0], q[1]);                              // 入力式の答え（整数か、約分した分数）
const same = (a, b, msg) => { if (!qeq(a, b)) throw new Error(`計算の食いちがい: ${msg}`); };

/** 解の分類（個数・人数・回数など、整数で、正でなければならない量）
 *  ok＝どちらも正の整数／frac＝どちらも正だが、整数でない／neg＝どちらも整数で、どちらかが負／mix＝それ以外（使わない） */
const kindCount = ([x, y]) => {
  const pos = qval(x) > 0 && qval(y) > 0, ints = qisint(x) && qisint(y);
  return pos && ints ? "ok" : pos ? "frac" : ints && (qval(x) < 0 || qval(y) < 0) ? "neg" : "mix";
};

/** 「解は問題の答えになるか」の4択。noun＝整数でなければならない量の名前（個数・人数 など） */
const judgeAns = (r, cat, noun) => {
  const T = {
    ok: "答えになる",
    frac: `答えにならない（${noun}が整数でないから）`,
    neg: `答えにならない（${noun}が負の数になるから）`,
    bad: "答えにならない（計算がまちがっているから）",
  };
  return { ans: T[cat], choices: choices4(r, T[cat], Object.keys(T).filter((k) => k !== cat).map((k) => T[k])) };
};
/** 解説の最後の1行（整数でなければならない量） */
const judgeStep = (cat, noun, [x, y]) =>
  cat === "ok" ? `${noun}は、どちらも正の整数だから、問題の答えになる。`
    : cat === "frac" ? `$x=${qtex(x)}$、$y=${qtex(y)}$ で、${noun}が整数でないから、問題の答えにならない。（計算のまちがいではない）`
      : `$x=${qtex(x)}$、$y=${qtex(y)}$ で、${noun}が負の数になるから、問題の答えにならない。`;

// ── 買い物（x＋y＝n、a1 x＋a2 y＝k） ──────────────────────
const BUY = [["ラムネ", "グミ", "個"], ["えんぴつ", "ボールペン", "本"], ["みかん", "りんご", "個"], ["シール", "カード", "枚"], ["ノート", "ファイル", "冊"], ["クッキー", "ドーナツ", "個"], ["おにぎり", "パン", "個"], ["色紙", "画用紙", "枚"]];
const NOUN = { 個: "個数", 本: "本数", 枚: "枚数", 冊: "冊数" };

/** 合わせて n 個。解が cat（ok・frac・neg）になる代金 k をつくる。つくれなければ null */
function buyNums(r, cat, nLo = 8, nHi = 14) {
  for (let i = 0; i < 200; i++) {
    const a1 = pick(r, [40, 50, 60, 70, 80, 90, 100, 120, 150]);
    const a2 = a1 + pick(r, [20, 30, 40, 50]) * (r(0, 3) === 0 ? -1 : 1);
    if (a2 < 30) continue;
    const n = r(nLo, nHi);
    let x;
    if (cat === "ok") x = Q(r(1, n - 1));
    else if (cat === "frac") x = Q(2 * r(1, n - 2) + 1, 2);
    else x = r(0, 1) ? Q(-r(1, 2)) : Q(n + r(1, 2));
    const y = qsub(Q(n), x);
    const k = qadd(qmul(Q(a1), x), qmul(Q(a2), y));
    if (!qisint(k) || k[0] <= 0) continue;
    const sol = solve2([1, 1, n], [a1, a2, k[0]]);
    if (!sol || kindCount(sol) !== cat) continue;
    same(sol[0], x, "買い物の x");
    return { a1, a2, n, k: k[0], sol };
  }
  return null;
}
/** 買い物の連立方程式の解き方（2行） */
const buySteps = (b) => [
  `$x+y=${b.n}$ …①　$${b.a1}x+${b.a2}y=${b.k}$ …②`,
  `②−①×${b.a1}　$${b.a2 - b.a1}y=${b.k - b.a1 * b.n}$　$y=${qtex(b.sol[1])}$　①より　$x=${qtex(b.sol[0])}$`,
];
const buyText = (A, B, c, b) => `1${c} ${b.a1}円の${A}と、1${c} ${b.a2}円の${B}を、合わせて ${b.n}${c}買う。`;

// ── 「問題の答えとして合っているか」の言い方（ア〜エ） ───────────
const CNT = [["大人の人数", "人"], ["子どもの人数", "人"], ["みかんの個数", "個"], ["先月の貸し出し冊数", "冊"], ["参加者の人数", "人"], ["あめの個数", "個"], ["色紙の枚数", "枚"], ["配った本の冊数", "冊"]];
const MEA = [["歩いた道のり", "km"], ["走った時間", "時間"], ["食塩水の重さ", "g"], ["使ったひもの長さ", "m"], ["のこりの水の量", "L"], ["かかった時間", "分"], ["切ったテープの長さ", "cm"]];
const decPos = (r) => { let v; do v = r(1, 59); while (v % 10 === 0); return String(round(v / 10, 1)); };   // 小数第1位まである、整数でない正の数
const fracPos = (r, lo, hi) => {
  for (let i = 0; i < 50; i++) {
    const b = pick(r, [2, 3, 4, 5]), a = r(lo * b, hi * b);
    if (a % b !== 0 && gcd(a, b) === 1) return `\\frac{${a}}{${b}}`;
  }
  return "\\frac{5}{2}";
};
/** 1つの言い方。ty＝c（個数・人数など）／m（道のり・時間など）、md＝ok／frac（整数でない）／neg（負の数） */
function stmt(r, ty, md, [label, un]) {
  const v = pick(r, ["x", "y"]);
  let val;
  if (ty === "c") val = md === "ok" ? String(r(2, 40)) : md === "frac" ? (r(0, 1) ? String(round(r(1, 19) + 0.5, 1)) : fracPos(r, 1, 12)) : `-${r(1, 60)}`;
  else val = md === "ok" ? (r(0, 1) ? decPos(r) : fracPos(r, 1, 8)) : `-${r(0, 2) === 0 ? r(1, 9) : r(0, 1) ? decPos(r) : fracPos(r, 1, 6)}`;
  const why = md === "ok" ? "○" : md === "frac" ? "×（整数でない）" : "×（負の数）";
  const reason = md === "frac" ? "整数でないから" : "負の数だから";
  return { tex: `${label} $${v}=${val}$ ${un}`, ok: md === "ok", why, reason };
}
/** 言い方を並べる：specs＝[[ty, md], …] に、重ならない名前をわりふる */
function deal(r, specs) {
  const cnt = shuffle(r, CNT), mea = shuffle(r, MEA);
  let ci = 0, mi = 0;
  return specs.map(([ty, md]) => stmt(r, ty, md, ty === "c" ? cnt[ci++] : mea[mi++]));
}
const MARK = ["ア", "イ", "ウ", "エ", "オ", "カ"];
const rules = ["人数・個数・冊数は、整数で、負の数にならない。", "道のり・時間・重さ・長さは、小数や分数でもよいが、負の数にはならない。"];

// ── 時間と速さ（x＋y＝T、v1 x＋v2 y＝D） ───────────────────
/** ジョギング：歩く時速 v1、走る時速 v2、全部で T 時間。道のり D で、時間 x、y が cat（okint・okfrac・neg）になる */
function jogNums(r, cat) {
  for (let i = 0; i < 50; i++) {
    const [v1, v2] = pick(r, [[6, 10], [5, 10], [4, 8], [6, 12], [8, 12], [4, 10], [5, 9]]), T = pick(r, [2, 3]);
    const list = [];
    for (let D = v1 * T - 6; D <= v2 * T + 6; D++) {
      if (D <= 0) continue;
      const sol = solve2([1, 1, T], [v1, v2, D]);
      const [x, y] = sol;
      if (qval(x) === 0 || qval(y) === 0) continue;
      const k = qval(x) > 0 && qval(y) > 0 ? (qisint(x) && qisint(y) ? "okint" : "okfrac") : "neg";
      if (k === cat) list.push({ D, sol });
    }
    if (list.length) { const c = pick(r, list); return { v1, v2, T, D: c.D, sol: c.sol }; }
  }
  return null;
}
const jogText = (j) => `ゆうさんは、ジョギングコースを、はじめは時速 ${j.v1} km で歩き、あとは時速 ${j.v2} km で走って、全部で ${j.T}時間かかった。`;

// ── 的当て（x＋y＝m、p x＋q y＝S） ─────────────────────────
const PQ = [[3, 5], [2, 5], [3, 7], [4, 6], [5, 8], [2, 3], [3, 4], [4, 7]];
function targetNums(r, cat) {
  for (let i = 0; i < 80; i++) {
    const [p, q] = pick(r, PQ), S = r(24, 60);
    const list = [];
    for (let m = 4; m <= 22; m++) {
      const sol = solve2([1, 1, m], [p, q, S]);
      if (kindCount(sol) === cat && qval(sol[0]) !== 0 && qval(sol[1]) !== 0 && (cat !== "neg" || Math.min(qval(sol[0]), qval(sol[1])) >= -3)) list.push({ m, sol });
    }
    if (list.length) { const c = pick(r, list); return { p, q, S, m: c.m, sol: c.sol }; }
  }
  return null;
}

// ── 割合（x＋y＝N、p％ 増・q％ 減） ─────────────────────────
const dec2 = (p) => String(round(p / 100, 2));
const PCT = [[5, 10], [10, 5], [5, 20], [20, 10], [10, 20], [15, 10], [10, 15], [5, 10], [10, 5], [20, 10], [10, 20], [15, 15], [25, 5], [5, 25], [20, 5]];
const PLACE = [["水族館", "入館者"], ["動物園", "入園者"], ["遊園地", "入園者"], ["美術館", "入館者"], ["科学館", "入館者"]];
/** 先週 N 人、大人 p％ 増・子ども q％ 減、全体の増減 C 人。解が cat になる C をつくる */
function pctNums(r, cat) {
  for (let i = 0; i < 200; i++) {
    const [p, q] = pick(r, PCT), N = pick(r, [240, 300, 360, 400, 420, 480, 500, 600]);
    const cands = [];
    if (cat === "ok") {
      const x0 = 20 * r(2, N / 20 - 2);
      cands.push((p * x0 - q * (N - x0)) / 100);
    } else if (cat === "neg") {
      const m = 20 * r(1, 3), x0 = r(0, 1) ? -m : N + m;
      cands.push((p * x0 - q * (N - x0)) / 100);
    } else {
      const x0 = 20 * r(2, N / 20 - 2), C0 = (p * x0 - q * (N - x0)) / 100;
      for (const s of [1, -1, 2, -2, 3, -3]) cands.push(C0 + s);
    }
    for (const C of cands) {
      if (C === 0 || !Number.isInteger(C)) continue;
      const sol = solve2([1, 1, N], [p, -q, 100 * C]);
      if (sol && kindCount(sol) === cat && (cat !== "frac" || (sol[0][1] <= 5 && sol[1][1] <= 5))) {
        same(sol[0], Q(q * N + 100 * C, p + q), "割合の x");
        return { p, q, N, C, sol };
      }
    }
  }
  return null;
}
const pctSteps = (b) => [
  `先週の大人を $x$ 人、子どもを $y$ 人とすると　$x+y=${b.N}$ …①　$${dec2(b.p)}x-${dec2(b.q)}y=${b.C}$ …②`,
  `②×100　$${b.p}x-${b.q}y=${100 * b.C}$ …③　　①×${b.q}＋③　$${b.p + b.q}x=${b.q * b.N + 100 * b.C}$　$x=${qtex(b.sol[0])}$　①より　$y=${qtex(b.sol[1])}$`,
];

// ── a, b を求める（解がわかっているとき） ──────────────────
/** a x ± … y ＝ c1、… x ＋ b y ＝ c2 の形。解 (x0, y0) から c1、c2 をつくる */
function abNums(r) {
  const x0 = rnz(r, -5, 5), y0 = rnz(r, -5, 5);
  const a = rnz(r, -4, 5), b = rnz(r, -4, 5), s1 = rnz(r, -3, 3), s2 = rnz(r, -3, 3), sb = r(0, 1) ? 1 : -1;
  return { x0, y0, a, b, s1, s2, sb, c1: a * x0 + s1 * y0, c2: s2 * x0 + sb * b * y0 };
}
const abEq1 = (m) => `ax${signedVar(m.s1, "y")}=${m.c1}`;
const abEq2 = (m) => `${coefVar(m.s2, "x")}${m.sb < 0 ? "-" : "+"}by=${m.c2}`;

export const UNITS = [
  unit("11", {
    name: "条件を変えると、解は問題の答えになるか",
    desc: "解を求めたあと、場面にもどして確かめる（整数か・負でないか）",
    prereqs: ["J2-rk10", "J1-e2"],
    points: [
      "連立方程式を解いて求めた $x$、$y$ の値（解）は、そのまま問題の答えになるとは限らない。解を求めたら、場面にもどして確かめる。",
      "人数・個数・回数は、整数で、負の数にならない。小数や分数、負の数になったら、問題の答えにならない（計算のまちがいではない）。",
      "道のり・時間・重さは、小数や分数でもよい。ただし、負の数にはならない。",
      "代金や得点などの条件を変えると、解も変わる。条件を変えるたびに、答えになるかを調べる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 11d01a ラムネとグミ：代金を変えたとき、解は問題の答えになるか（○×）
        t("11d01a", (r) => {
          const [A, B, c] = pick(r, BUY), cat = pick(r, ["ok", "frac", "neg", "ok", "frac"]);
          const b = buyNums(r, cat);
          if (!b) return { skip: true };
          const noun = NOUN[c], j = judgeAns(r, cat, noun);
          return {
            q: `${buyText(A, B, c, b)}代金が ${b.k}円のとき、${A}を $x$ ${c}、${B}を $y$ ${c}として連立方程式をつくって解くと、その解は問題の答えになるか。理由も含めて、正しいものを選ぼう。`,
            ans: j.ans,
            choices: j.choices,
            hint: `解を求めたら、${noun}として合っているか、場面にもどって確かめよう。（${noun}は、整数か？　負の数でないか？）`,
            steps: [...buySteps(b), judgeStep(cat, noun, b.sol)],
          };
        }),
        // 11d02a ア〜エのうち、問題の答えとして合っているもの
        t("11d02a", (r) => {
          const validCount = r(0, 1) === 1;
          const st = deal(r, [validCount ? ["c", "ok"] : ["m", "ok"], ["c", "frac"], ["c", "neg"], ["m", "neg"]]);
          const ans = st[0].tex;
          return {
            q: "次のうち、連立方程式を解いて求めた値として、問題の答えに合っているものはどれか。",
            ans,
            choices: choices4(r, ans, st.slice(1).map((s) => s.tex)),
            hint: "それぞれの数量は、整数でなければならないか？　負の数になってもよいか？　数量の種類を見て考えよう。",
            steps: [...rules, `合っているのは「${ans}」。`],
          };
        }),
        // 11q01 色紙と画用紙：連立方程式をつくる（式を選ぶ）
        t("11q01", (r) => {
          const [A, B, c] = pick(r, BUY), b = buyNums(r, "ok", 8, 15);
          if (!b) return { skip: true };
          const sol = b.sol, S = (e1, e2) => `$${casesTex([e1, e2])}$`;
          const right = S(linTex(1, 1, b.n), linTex(b.a1, b.a2, b.k));
          const bad = [
            [S(linTex(1, 1, b.n), linTex(b.a2, b.a1, b.k)), [1, 1, b.n], [b.a2, b.a1, b.k]],      // 値段が入れかわっている
            [S(linTex(1, 1, b.k), linTex(b.a1, b.a2, b.n)), [1, 1, b.k], [b.a1, b.a2, b.n]],      // 合計がとりちがえられている
            [S(linTex(1, -1, b.n), linTex(b.a1, b.a2, b.k)), [1, -1, b.n], [b.a1, b.a2, b.k]],    // 合わせた数が、ひき算になっている
            [S(linTex(1, 1, b.n), linTex(b.a1, -b.a2, b.k)), [1, 1, b.n], [b.a1, -b.a2, b.k]],    // 代金が、ひき算になっている
          ].filter(([, e1, e2]) => { const s = solve2(e1, e2); return !s || !(qeq(s[0], sol[0]) && qeq(s[1], sol[1])); }).map((w) => w[0]);
          return {
            q: `1${c} ${b.a1}円の${A}と、1${c} ${b.a2}円の${B}を、合わせて ${b.n}${c}買い、代金が ${b.k}円になった。${A}を $x$ ${c}、${B}を $y$ ${c}として、連立方程式をつくるとき、正しいものはどれか。`,
            ans: right,
            choices: choices4(r, right, bad.slice(0, 3)),
            hint: `「合わせた${NOUN[c]}」の関係と、「代金」の関係で、式を2つつくろう。代金は（1${c}の値段）×（${NOUN[c]}）の和。`,
            steps: [`合わせて ${b.n}${c}だから　$x+y=${b.n}$ …①`, `代金は　${A}が $${b.a1}x$ 円、${B}が $${b.a2}y$ 円で、合わせて ${b.k}円だから　$${b.a1}x+${b.a2}y=${b.k}$ …②`, "①と②を、連立方程式にして答える。"],
          };
        }),
        // 11q02 色紙と画用紙：連立方程式を解いて、枚数を求める
        t("11q02", (r) => {
          const [A, B, c] = pick(r, BUY), b = buyNums(r, "ok", 8, 15);
          if (!b) return { skip: true };
          const askA = r(0, 1) === 1, sol = b.sol;
          return {
            q: `${buyText(A, B, c, b)}代金が ${b.k}円になった。${askA ? A : B}は何${c}買ったか。`,
            ans: askA ? sol[0][0] : sol[1][0],
            unit: c,
            hint: `${A}を $x$ ${c}、${B}を $y$ ${c}として、「合わせた${NOUN[c]}」と「代金」で式を2つつくり、どちらかの文字を消そう。`,
            steps: [...buySteps(b), `${A}は ${sol[0][0]}${c}、${B}は ${sol[1][0]}${c}。（どちらも正の整数で、問題に合う）`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 11d01b 解の値を求める（整数でないことも、負になることもある）
        t("11d01b", (r) => {
          const [A, B, c] = pick(r, BUY), cat = pick(r, ["ok", "frac", "neg", "frac"]);
          const b = buyNums(r, cat);
          if (!b) return { skip: true };
          const v = pick(r, ["x", "y"]), q = v === "x" ? b.sol[0] : b.sol[1];
          return {
            q: `${buyText(A, B, c, b)}代金が ${b.k}円のとき、${A}を $x$ ${c}、${B}を $y$ ${c}として連立方程式をつくって解いた。$${v}$ の値は？（整数でないときは、約分した分数で答えよう）`,
            ans: ansQ(q),
            hint: `「合わせた${NOUN[c]}」と「代金」で式を2つつくり、$y$ か $x$ のどちらかを消そう。解が整数にならなくても、計算のまちがいとは限らない。`,
            steps: [...buySteps(b), `$${v}=${qtex(q)}$`],
          };
        }),
        // 11d02b ア〜カのうち、問題の答えとして合っているものの数
        t("11d02b", (r) => {
          const k = r(1, 5);
          const specs = shuffle(r, [
            ...Array.from({ length: k }, () => [pick(r, ["c", "m"]), "ok"]),
            ...Array.from({ length: 6 - k }, () => pick(r, [["c", "frac"], ["c", "neg"], ["m", "neg"]])),
          ]);
          const st = deal(r, specs);
          return {
            q: `次のア〜カは、連立方程式を解いて求めた値である。問題の答えとして合っているものは、いくつあるか。　${st.map((s, i) => `${MARK[i]} ${s.tex}`).join("　")}`,
            ans: k,
            unit: "つ",
            hint: "ア〜カの1つ1つについて、その数量が整数でなければならないか、負の数になってよいかを考えよう。",
            steps: [...rules, st.map((s, i) => `${MARK[i]} ${s.why}`).join("　"), `合っているものは ${k}つ。`],
          };
        }),
        // 11d03a 水族館：増減の条件を変えたとき、解は問題の答えになるか
        t("11d03a", (r) => {
          const [place, person] = pick(r, PLACE), cat = pick(r, ["ok", "frac", "ok", "frac", "neg"]);
          const b = pctNums(r, cat);
          if (!b) return { skip: true };
          const j = judgeAns(r, cat, "人数");
          return {
            q: `ある${place}の先週の${person}は、大人と子どもを合わせて ${b.N}人だった。今週は、先週とくらべて、大人が ${b.p}％ 増え、子どもが ${b.q}％ 減って、全体で ${Math.abs(b.C)}人 ${b.C > 0 ? "増えた" : "減った"}。先週の大人を $x$ 人、子どもを $y$ 人として連立方程式をつくって解くと、その解は問題の答えになるか。理由も含めて、正しいものを選ぼう。`,
            ans: j.ans,
            choices: j.choices,
            hint: "「合わせた人数」の式と、「増えた人数−減った人数」の式を、つくろう。解を求めたら、人数として合うか確かめよう。",
            steps: [...pctSteps(b), judgeStep(cat, "人数", b.sol)],
          };
        }),
        // 11d03b 水族館：解の値を求める
        t("11d03b", (r) => {
          const [place, person] = pick(r, PLACE), cat = pick(r, ["ok", "frac", "frac", "neg"]);
          const b = pctNums(r, cat);
          if (!b) return { skip: true };
          const v = pick(r, ["x", "y"]), q = v === "x" ? b.sol[0] : b.sol[1];
          return {
            q: `ある${place}の先週の${person}は、大人と子どもを合わせて ${b.N}人だった。今週は、先週とくらべて、大人が ${b.p}％ 増え、子どもが ${b.q}％ 減って、全体で ${Math.abs(b.C)}人 ${b.C > 0 ? "増えた" : "減った"}。先週の大人を $x$ 人、子どもを $y$ 人として連立方程式をつくって解いた。$${v}$ の値は？（整数でないときは、約分した分数で答えよう）`,
            ans: ansQ(q),
            hint: "「増えた人数−減った人数」の式は、両辺を何倍かして、係数を整数にしてから解こう。",
            steps: [...pctSteps(b), `$${v}=${qtex(q)}$`],
          };
        }),
        // 11q03a 色紙と画用紙：代金を変えたときの解（整数にならない）
        t("11q03a", (r) => {
          const [A, B, c] = pick(r, BUY), b = buyNums(r, "frac", 10, 15);
          if (!b) return { skip: true };
          const v = pick(r, ["x", "y"]), q = v === "x" ? b.sol[0] : b.sol[1];
          return {
            q: `${buyText(A, B, c, b)}代金が ${b.k}円になった。${A}を $x$ ${c}、${B}を $y$ ${c}として連立方程式をつくって解くと、$${v}$ の値は？（約分した分数で答えよう）`,
            ans: ansQ(q),
            hint: `「合わせた${NOUN[c]}」と「代金」で式を2つつくって解こう。値が整数にならなくても、そのまま分数で答える。`,
            steps: [...buySteps(b), `$${v}=${qtex(q)}$（${NOUN[c]}が整数でないので、問題の答えにはならない）`],
          };
        }),
        // 11q03b 色紙と画用紙：代金を変えたとき、解は問題の答えになるか
        t("11q03b", (r) => {
          const [A, B, c] = pick(r, BUY), cat = pick(r, ["frac", "neg", "ok", "frac"]);
          const b = buyNums(r, cat, 10, 15);
          if (!b) return { skip: true };
          const noun = NOUN[c], j = judgeAns(r, cat, noun);
          return {
            q: `${buyText(A, B, c, b)}代金が ${b.k}円だったとして、${A}を $x$ ${c}、${B}を $y$ ${c}として連立方程式をつくって解く。その解は問題の答えになるか。理由も含めて、正しいものを選ぼう。`,
            ans: j.ans,
            choices: j.choices,
            hint: `解を求めたら、${noun}として合っているか確かめよう。${noun}は、整数か？　負の数でないか？`,
            steps: [...buySteps(b), judgeStep(cat, noun, b.sol)],
          };
        }),
        // 11q04 ア〜ウ：問題の答えとして合っていないもの
        t("11q04", (r) => {
          const bad = pick(r, [["c", "frac"], ["c", "neg"], ["m", "neg"]]);
          const specs = shuffle(r, [[pick(r, ["c", "m"]), "ok"], [pick(r, ["c", "m"]), "ok"], [pick(r, ["c", "m"]), "ok"], bad]);
          const st = deal(r, specs), wrong = st.find((s) => !s.ok);
          return {
            q: "次のうち、連立方程式を解いて求めた値として、問題の答えに合っていないものはどれか。",
            ans: wrong.tex,
            choices: choices4(r, wrong.tex, st.filter((s) => s.ok).map((s) => s.tex)),
            hint: "それぞれの数量は、整数でなければならないか？　負の数になってもよいか？",
            steps: [...rules, `合っていないのは「${wrong.tex}」。（${wrong.reason}）`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 11d04a ジョギング：道のりを変えたとき、解は問題の答えになるか（時間は分数でもよい）
        t("11d04a", (r) => {
          const cat = pick(r, ["okint", "okfrac", "okfrac", "neg", "neg"]);
          const j = jogNums(r, cat) || jogNums(r, "okfrac");
          if (!j) return { skip: true };
          const c = qval(j.sol[0]) > 0 && qval(j.sol[1]) > 0 ? "ok" : "neg";
          const ch = judgeAns(r, c, "時間");
          return {
            q: `${jogText(j)}道のりが ${j.D} km のとき、歩いた時間を $x$ 時間、走った時間を $y$ 時間として連立方程式をつくって解くと、その解は問題の答えになるか。理由も含めて、正しいものを選ぼう。`,
            ans: ch.ans,
            choices: ch.choices,
            hint: "解を求めたら、何の数量かを読み返そう。時間は、整数でなければならないか？　負の数になってよいか？",
            steps: [
              `$x+y=${j.T}$ …①　$${j.v1}x+${j.v2}y=${j.D}$ …②`,
              `②−①×${j.v1}　$${j.v2 - j.v1}y=${j.D - j.v1 * j.T}$　$y=${qtex(j.sol[1])}$　①より　$x=${qtex(j.sol[0])}$`,
              c === "ok" ? "時間は、整数でなくてもよい。どちらも正の数だから、問題の答えになる。" : `$x=${qtex(j.sol[0])}$、$y=${qtex(j.sol[1])}$ で、時間が負の数になるから、問題の答えにならない。`,
            ],
          };
        }),
        // 11d04b ジョギング：時間を「分」で求める
        t("11d04b", (r) => {
          const j = jogNums(r, pick(r, ["okfrac", "okfrac", "okint"])) || jogNums(r, "okfrac");
          if (!j) return { skip: true };
          const walk = r(0, 1) === 1, q = walk ? j.sol[0] : j.sol[1], min = qval(q) * 60;
          if (!Number.isInteger(round(min, 6))) return { skip: true };
          return {
            q: `${jogText(j)}道のりは ${j.D} km だった。${walk ? "歩いた" : "走った"}時間は、何分か。`,
            ans: round(min, 6),
            unit: "分",
            hint: "歩いた時間を $x$ 時間、走った時間を $y$ 時間として、時間の式と道のりの式を立てよう。最後に、時間を分になおす。",
            steps: [
              `$x+y=${j.T}$ …①　$${j.v1}x+${j.v2}y=${j.D}$ …②`,
              `②−①×${j.v1}　$${j.v2 - j.v1}y=${j.D - j.v1 * j.T}$　$y=${qtex(j.sol[1])}$　①より　$x=${qtex(j.sol[0])}$`,
              `${walk ? "歩いた" : "走った"}時間は $${qtex(q)}$ 時間 ＝ $${qtex(q)}\\times 60 = ${round(min, 6)}$ 分。`,
            ],
          };
        }),
        // 11d05a 的当て：合わせた回数を変えたとき、解は問題の答えになるか
        t("11d05a", (r) => {
          const cat = pick(r, ["ok", "frac", "neg", "frac"]);
          const g = targetNums(r, cat);
          if (!g) return { skip: true };
          const ch = judgeAns(r, cat, "回数");
          return {
            q: `的当てで、${g.p}点の的と ${g.q}点の的がある。どちらの的にも 1回以上あてて、得点は ${g.S}点だった。合わせて ${g.m}回あてたとき、${g.p}点の的にあてた回数を $x$ 回、${g.q}点の的にあてた回数を $y$ 回として連立方程式をつくって解くと、その解は問題の答えになるか。理由も含めて、正しいものを選ぼう。`,
            ans: ch.ans,
            choices: ch.choices,
            hint: "「合わせた回数」の式と、「得点」の式を、つくろう。解を求めたら、回数として合うか確かめよう。",
            steps: [
              `$x+y=${g.m}$ …①　$${g.p}x+${g.q}y=${g.S}$ …②`,
              `②−①×${g.p}　$${g.q - g.p}y=${g.S - g.p * g.m}$　$y=${qtex(g.sol[1])}$　①より　$x=${qtex(g.sol[0])}$`,
              judgeStep(cat, "回数", g.sol),
            ],
          };
        }),
        // 11d05b 的当て：得点が決まっているとき、あてた回数の組は何通りか
        t("11d05b", (r) => {
          const target = r(2, 7);   // 組の数がかたよらないように、先に決める
          for (let i = 0; i < 400; i++) {
            const [p, q] = pick(r, PQ), S = r(20, 100), pairs = [];
            for (let y = 1; q * y < S; y++) { const rest = S - q * y; if (rest % p === 0) pairs.push([rest / p, y]); }
            if (pairs.length !== target) continue;
            return {
              q: `的当てで、${p}点の的と ${q}点の的がある。どちらの的にも 1回以上あてて、得点は ${S}点だった。${p}点の的にあてた回数と、${q}点の的にあてた回数の組は、何通り考えられるか。`,
              ans: pairs.length,
              unit: "通り",
              hint: `${p}点の的を $x$ 回、${q}点の的を $y$ 回とすると、得点の式は 1つ。$y$ を 1、2、… と決めて、$x$ が正の整数になるかを調べよう。`,
              steps: [
                `$${p}x+${q}y=${S}$ をみたす、正の整数の組 $(x,\\ y)$ を調べる。`,
                `$y=1,\\ 2,\\ 3,\\ \\dots$ と順に入れて、$x=\\frac{${S}-${q}y}{${p}}$ が正の整数になるものを探す。`,
                `${pairs.map(([x, y]) => `$(${x},\\ ${y})$`).join("、")}`,
                `全部で ${pairs.length}通り。`,
              ],
            };
          }
          return { skip: true };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 11d06a 解がわかっているとき、a を求める
        t("11d06a", (r) => {
          const m = abNums(r);
          return {
            q: `連立方程式 $${casesTex([abEq1(m), abEq2(m)])}$ の解が $x=${m.x0},\\ y=${m.y0}$ であるとき、$a$ の値は？`,
            ans: m.a,
            hint: "解は、2つの式の両方を成り立たせる。$a$ だけが入っている式に、解を代入しよう。",
            steps: [
              `上の式に $x=${m.x0}$、$y=${m.y0}$ を代入する。`,
              `$a\\times${pn(m.x0)}+${pn(m.s1)}\\times${pn(m.y0)}=${m.c1}$　より　$${coefVar(m.x0, "a")}=${m.c1 - m.s1 * m.y0}$`,
              `$a=${m.a}$`,
            ],
          };
        }),
        // 11d06b 解がわかっているとき、b を求める
        t("11d06b", (r) => {
          const m = abNums(r);
          return {
            q: `連立方程式 $${casesTex([abEq1(m), abEq2(m)])}$ の解が $x=${m.x0},\\ y=${m.y0}$ であるとき、$b$ の値は？`,
            ans: m.b,
            hint: "解は、2つの式の両方を成り立たせる。$b$ が入っている式に、解を代入しよう。",
            steps: [
              `下の式に $x=${m.x0}$、$y=${m.y0}$ を代入する。`,
              `$${pn(m.s2)}\\times${pn(m.x0)}+b\\times${pn(m.sb * m.y0)}=${m.c2}$　より　$${coefVar(m.sb * m.y0, "b")}=${m.c2 - m.s2 * m.x0}$`,
              `$b=${m.b}$`,
            ],
          };
        }),
        // 11d06c a、b が、どちらの式にも入っているとき
        t("11d06c", (r) => {
          const p = rnz(r, -4, 4), q = rnz(r, -4, 4), a = rnz(r, -5, 5), b = rnz(r, -5, 5);
          const c1 = a * p + b * q, c2 = b * p - a * q, ask = pick(r, ["a", "b"]);
          return {
            q: `連立方程式 $${casesTex([`ax+by=${c1}`, `bx-ay=${c2}`])}$ の解が $x=${p},\\ y=${q}$ であるとき、$${ask}$ の値は？`,
            ans: ask === "a" ? a : b,
            hint: "解を2つの式に代入すると、$a$、$b$ についての連立方程式ができる。",
            steps: [
              `$x=${p}$、$y=${q}$ を代入して　$${coefVar(p, "a")}${signedVar(q, "b")}=${c1}$ …①　$${coefVar(-q, "a")}${signedVar(p, "b")}=${c2}$ …②`,
              `①${mulT(p)}−②${mulT(q)}（$b$ を消す）　$${p * p + q * q}a=${p * c1 - q * c2}$　$a=${a}$`,
              `①に $a=${a}$ を代入して　$${p === 1 ? a : p === -1 ? -a : `${p}\\times${pn(a)}`}${signedVar(q, "b")}=${c1}$　$${coefVar(q, "b")}=${c1 - p * a}$${q === 1 ? "" : `　$b=${b}$`}`,
            ],
          };
        }),
        // 11d07a ⟦x+y＝12 ; 2x+5y＝k⟧ の解が自然数になる k は何通りか
        t("11d07a", (r) => {
          const N = r(7, 15), a = r(2, 4), b = r(a + 2, 9);
          return {
            q: `連立方程式 $${casesTex([`x+y=${N}`, `${a}x+${b}y=k`])}$ の解 $x$、$y$ が、どちらも自然数になるような $k$ の値は、全部で何通りあるか。`,
            ans: N - 1,
            unit: "通り",
            hint: "$y$ を $k$ の式で表し、$x$ も自然数になる条件を考えよう。$y$ が決まると $k$ も決まる。",
            steps: [
              `②−①×${a}　$${coefVar(b - a, "y")}=k-${a * N}$　$y=\\frac{k-${a * N}}{${b - a}}$　$x=${N}-y$`,
              `$y$ が 1〜${N - 1} の整数のとき、$x$、$y$ は自然数になる。`,
              `$k=${a * N}${signedVar(b - a, "y")}$ だから、$y$ 1つにつき $k$ が 1つ決まる。`,
              `全部で ${N - 1}通り。`,
            ],
          };
        }),
        // 11d07b そのうち、いちばん小さい k（大きい k）
        t("11d07b", (r) => {
          const N = r(7, 15), a = r(2, 4), b = r(a + 2, 9), big = r(0, 1) === 1;
          const yy = big ? N - 1 : 1, ans = a * N + (b - a) * yy;
          return {
            q: `連立方程式 $${casesTex([`x+y=${N}`, `${a}x+${b}y=k`])}$ の解 $x$、$y$ が、どちらも自然数になるような $k$ のうち、いちばん${big ? "大きい" : "小さい"}値は？`,
            ans,
            hint: "$k$ を $y$ の式で表そう。$y$ がとれる範囲のはしを調べる。",
            steps: [
              `②−①×${a}　$${coefVar(b - a, "y")}=k-${a * N}$　より　$k=${a * N}${signedVar(b - a, "y")}$`,
              `$x=${N}-y$ も自然数だから、$y$ は 1〜${N - 1} の整数。`,
              `$y=${yy}$ のとき、$k=${a * N}+${b - a}\\times${yy}=${ans}$（いちばん${big ? "大きい" : "小さい"}）`,
            ],
          };
        }),
        // 11q05a 乗り物券：どちらも c枚以上買うとき、代金は何通りか
        t("11q05a", (r) => {
          const a = pick(r, [150, 200, 250, 300]), b = a + pick(r, [100, 150, 200]), N = r(8, 14), cc = r(1, 3);
          const ticket = pick(r, ["乗り物券", "入場券", "食事券", "ロープウェイの券"]);
          return {
            q: `1枚 ${a}円の${ticket} A と、1枚 ${b}円の${ticket} B を、合わせて ${N}枚買う。どちらも ${cc}枚以上買うとき、代金として考えられる金額は、全部で何通りあるか。`,
            ans: N - 2 * cc + 1,
            unit: "通り",
            hint: "B を $y$ 枚とすると、A は何枚か。代金を $y$ の式で表して、$y$ がとれる範囲を調べよう。",
            steps: [
              `A を $x$ 枚、B を $y$ 枚、代金を $k$ 円とする。$x+y=${N}$ …①　$${a}x+${b}y=k$ …②`,
              `②−①×${a}　$${b - a}y=k-${a * N}$　より　$k=${a * N}+${b - a}y$`,
              `どちらも ${cc}枚以上だから、$y$ は ${cc}〜${N - cc} の整数。$y$ が1つ決まると $k$ も1つ決まる。`,
              `全部で ${N - 2 * cc + 1}通り。`,
            ],
          };
        }),
        // 11q05b いちばん安い（高い）金額
        t("11q05b", (r) => {
          const a = pick(r, [150, 200, 250, 300]), b = a + pick(r, [100, 150, 200]), N = r(8, 14), cc = r(1, 3), big = r(0, 1) === 1;
          const ticket = pick(r, ["乗り物券", "入場券", "食事券", "ロープウェイの券"]);
          const yy = big ? N - cc : cc, ans = a * (N - yy) + b * yy;
          return {
            q: `1枚 ${a}円の${ticket} A と、1枚 ${b}円の${ticket} B を、合わせて ${N}枚買う。どちらも ${cc}枚以上買うとき、いちばん${big ? "高い" : "安い"}金額は、何円か。`,
            ans,
            unit: "円",
            hint: `代金を、B の枚数 $y$ の式で表そう。${big ? "高い" : "安い"}ほうのはしは、$y$ をどうしたときか。`,
            steps: [
              `A を $x$ 枚、B を $y$ 枚とすると　$x+y=${N}$、代金 $k=${a}x+${b}y=${a * N}+${b - a}y$`,
              `$y$ は ${cc}〜${N - cc} の整数。${big ? "高い" : "安い"}のは、$y=${yy}$ のとき。`,
              `$k=${a * N}+${b - a}\\times${yy}=${ans}$（円）`,
            ],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし（ikkan の演習プリント 7問・小テスト 5問のすべてを移した。○×・「連立方程式をつくる」・「理由を書く」は、4択か数値入力に直した）
export const SKIPPED = [];
