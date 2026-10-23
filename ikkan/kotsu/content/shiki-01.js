// ============================================================
// shiki-01.js — 式の計算 第1時「式を、項の数と次数で見分けよう」（単項式・多項式・項・係数・次数）
//   ikkan の演習プリント（shiki-01.dr.1〜9）・小テスト（shiki-01.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「01」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：01d04 ＝ shiki-01.dr.4、01q01b ＝ shiki-01.qz.1 の2つ目
//   式は algebra.js の多項式（term・poly・ptex）でつくり、次数・項の数・係数は、式から計算で出す（手で書かない）。
//   「項をすべて答える」「ア〜カに分ける」「説明の正誤」は入力欄で打てないので、「正しいものを選ぶ」4択に直した。
//   「式で表す」は4択（誤答は、かけ算にしてしまう・係数を入れかえる など）。次数・何次式かは数で聞く。
// ============================================================
import { t, pick, choices4, shuffle, fracAns, fracTex, gcd, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, term, poly, padd, peval, pdeg, peq, pisz, ptex } from "../algebra.js";

const unit = unitFor("shiki");

// ── 式の道具（algebra.js のうえに、この授業の問題用に足した小さな関数）──────────────
const $ = (s) => `$${s}$`;
/** 項の TeX を、符号つきでつなぐ（["4x","-7y","2"] → 4x-7y+2） */
const joinTex = (parts) => parts.map((s, i) => (i === 0 || s[0] === "-" ? s : "+" + s)).join("");
/** 1つの項 [係数, {文字: 指数}] の TeX（符号つき。係数は整数か [分子, 分母]） */
const T1 = ([c, e]) => ptex(term(c, e || {}));
/** 項を、そのままの順に書く（同類項はまとめない） */
const raw = (ts) => joinTex(ts.map(T1));
/** 項の配列 → 多項式（同類項はまとめる） */
const P = (ts) => poly(...ts);
const keyOf = (e) => Object.keys(e).filter((v) => e[v] !== 0).sort().map((v) => v + e[v]).join("");
const degE = (e) => Object.values(e).reduce((a, c) => a + c, 0);
/** 係数（整数。ときどき ±1） */
const cf = (r) => (r(0, 4) === 0 ? pick(r, [1, -1]) : rnz(r, -9, 9));
const byDeg = (ts) => [...ts].sort((p, q) => degE(q[1]) - degE(p[1]));
/** x^2y → [x, x, y] */
const letterList = (e) => Object.keys(e).sort().flatMap((v) => Array(e[v]).fill(v));
/** 係数 c と文字 e の積の書き方：-3ab → -3\times a\times b */
const mulForm = (c, e) => {
  const ls = letterList(e);
  return (c === 1 ? ls : [String(c), ...ls]).join("\\times ");
};
const LET2 = [["x", "y"], ["a", "b"], ["m", "n"], ["p", "q"], ["s", "t"]];

/** 文字 L を使った、次数がちょうど d の単項式の指数の組すべて */
const monosOf = (L, d) => {
  const out = [];
  const rec = (i, left, cur) => {
    if (i === L.length - 1) { out.push({ ...cur, [L[i]]: left }); return; }
    for (let k = left; k >= 0; k--) rec(i + 1, left - k, { ...cur, [L[i]]: k });
  };
  rec(0, d, {});
  return out.map((e) => Object.fromEntries(Object.entries(e).filter(([, n]) => n > 0)));
};
const allMonos = (L, maxD) => Array.from({ length: maxD + 1 }, (_, d) => monosOf(L, d)).flat();
/** 次数がちょうど N、項が k 個（同類項なし）の多項式の項（順番はばらばら） */
const randTerms = (r, L, N, k) => {
  const top = pick(r, monosOf(L, N));
  const rest = shuffle(r, allMonos(L, N).filter((e) => keyOf(e) !== keyOf(top)));
  return shuffle(r, [top, ...rest.slice(0, k - 1)]).map((e) => [cf(r), e]);
};
/** 2文字 u,v の項のかたち（次数の高い順）から k 個。少なくとも1つは負の項 */
const randShapes = (r, L, k) => {
  const [u, v] = L, sh = [{ [u]: 2 }, { [u]: 1, [v]: 1 }, { [v]: 2 }, { [u]: 1 }, { [v]: 1 }, {}];
  const ts = shuffle(r, [0, 1, 2, 3, 4, 5]).slice(0, k).sort((a, b) => a - b).map((i) => [cf(r), sh[i]]);
  if (ts.every(([c]) => c > 0)) { const j = r(0, ts.length - 1); ts[j] = [-ts[j][0], ts[j][1]]; }
  return ts;
};
/** 1文字 v の多項式（x^2-5x+6 のかたち）。k 個の項。少なくとも1つは負の項 */
const randUni = (r, v, k) => {
  const ts = shuffle(r, [3, 2, 1, 0]).slice(0, k).sort((a, b) => b - a).map((d) => [cf(r), d ? { [v]: d } : {}]);
  if (ts.every(([c]) => c > 0)) { const j = r(0, ts.length - 1); ts[j] = [-ts[j][0], ts[j][1]]; }
  return ts;
};
/** 項を「たし算」の形に直した TeX：4x-7y+2 → 4x+(-7y)+2 */
const plusForm = (ts) => ts.map(T1).map((s, i) => (i === 0 ? s : s[0] === "-" ? `+(${s})` : `+${s}`)).join("");

/** 式の4択：正解 right、ありがちな誤答 wrongs（多項式）。正解と式として同じもの（peq）は、はずす */
const polyChoices = (r, right, wrongs) => {
  const rt = ptex(right), seen = new Set([rt]), ws = [];
  for (const w of wrongs) {
    if (!w || pisz(w) || peq(w, right)) continue;
    const s = ptex(w);
    if (seen.has(s)) continue;
    seen.add(s); ws.push($(s));
  }
  const ks = Object.keys(right);
  const fill = (i) => {
    if (!ks.length) return null;
    const w = padd(right, { [ks[i % ks.length]]: Q([1, -1, 2, -2, 3, -3][Math.floor(i / ks.length) % 6]) });
    return pisz(w) || peq(w, right) ? null : $(ptex(w));
  };
  return { ans: $(rt), choices: choices4(r, $(rt), ws, fill) };
};

// ── 単項式の係数・次数 ───────────────────────────────────
/** 単項式 m＝[係数, 指数の組]（係数は整数か [分子, 分母]）の、係数（what＝"coef"）か次数（"deg"）を聞く */
const monoAsk = (m, what) => {
  const [c, e] = m, cq = Array.isArray(c) ? Q(...c) : Q(c), s = T1(m), ct = fracTex(cq[0], cq[1]);
  const ls = Object.keys(e).sort(), n = degE(e);
  const body = ls.map((v) => v + (e[v] === 1 ? "" : `^{${e[v]}}`)).join("");
  if (what === "coef") {
    return {
      q: `単項式 ${$(s)} の係数は？`,
      ans: fracAns(cq[0], cq[1]),
      hint: "係数は、文字にかけられている数。符号もふくめて考えよう。",
      steps: [`${$(`${s}=${ct}\\times ${body}`)} と書き直す。`, `文字をのぞいた数の部分が係数なので、係数は ${$(ct)}。`],
    };
  }
  const ml = (cq[0] === 1 && cq[1] === 1 ? [] : [ct]).concat(letterList(e)).join("\\times ");
  return {
    q: `単項式 ${$(s)} の次数は？`,
    ans: n,
    hint: "次数は、かけ合わされている文字の個数。$x^2$ は $x\\times x$ と書き直せる。",
    steps: [`${$(`${s}=${ml}`)} と書き直す。`, `文字が ${n}個かけ合わされているので、次数は ${n}。`],
  };
};
/** 整数の係数の単項式（1〜nl 文字、各文字の指数 1〜emax） */
const intMono = (r, nl, emax) => {
  const L = pick(r, [...LET2, ["x", "y", "z"], ["a", "b", "c"]]).slice(0, nl), e = {};
  L.forEach((v) => { e[v] = r(1, emax); });
  return [cf(r), e];
};
const FR = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [3, 5], [2, 5], [1, 5], [4, 5], [5, 6], [3, 7]];
/** 分数の係数の単項式 */
const fracMono = (r) => {
  const L = pick(r, LET2), e = { [L[0]]: r(1, 2) };
  if (r(0, 1)) e[L[1]] = r(1, 2);
  const [n, d] = pick(r, FR);
  return [[pick(r, [1, -1]) * n, d], e];
};

// ── 単項式・多項式を見分ける ───────────────────────────────
/** 単項式のいろいろ（数だけ・1文字・2文字・分数の係数） */
const monoShape = (r, L, withFrac) => pick(r, [
  () => [rnz(r, -12, 12), {}],
  () => [rnz(r, -9, 9), { [L[0]]: 1 }],
  () => [rnz(r, -9, 9), { [L[0]]: r(2, 3) }],
  () => [cf(r), { [L[0]]: 1, [L[1]]: r(1, 2) }],
  () => [rnz(r, -9, 9), { [L[0]]: r(1, 2), [L[1]]: r(1, 2) }],
  ...(withFrac ? [() => [[pick(r, [1, -1]), pick(r, [2, 3, 4, 5])], { [L[0]]: 1 }], () => [[pick(r, [1, -1]) * pick(r, [2, 3]), pick(r, [4, 5, 7])], { [L[0]]: 1, [L[1]]: 1 }]] : []),
])();
/** want＝"mono"（単項式を選ぶ）／"poly"（多項式を選ぶ） */
const kindQ = (r, want, withFrac) => {
  const L = pick(r, LET2);
  const mono = () => T1(monoShape(r, L, withFrac));
  const polyS = () => raw(byDeg(randTerms(r, L, r(1, 3), pick(r, [2, 2, 3]))));
  const right = want === "mono" ? mono() : polyS();
  const wrongs = want === "mono" ? [polyS(), polyS(), polyS()] : [mono(), mono(), mono()];
  if (want === "poly" && withFrac) wrongs[0] = T1([[pick(r, [1, -1]), pick(r, [2, 3, 4])], { [L[0]]: 1 }]);   // a/2 のような、分数の形の単項式
  const fill = () => $(want === "mono" ? polyS() : mono());
  const ans = $(right);
  return {
    q: want === "mono" ? "次のうち、単項式はどれか。" : "次のうち、多項式はどれか。",
    ans,
    choices: choices4(r, ans, wrongs.map($), fill),
    hint: "式の中に、項がいくつあるか数えてみよう。+ や − でつながれた 1つ1つが項。",
    steps: want === "mono"
      ? [`単項式は、項が 1つだけの式（数だけの式も単項式）。`, `${ans} は項が 1つ。ほかは、項が 2つ以上の多項式。`]
      : [`多項式は、単項式の和の形の式。項が 2つ以上ある。`, `${ans} は項が 2つ以上。ほかは、項が 1つの単項式。`],
  };
};

// ── 項を答える ───────────────────────────────────────────
/** 多項式 ts の項を「すべて正しく書いたもの」を選ぶ 4択 */
const termsQ = (r, ts) => {
  const lst = (a) => a.map($).join("、");
  const right = lst(ts.map(T1));
  const signDrop = lst(ts.map(([c, e]) => T1([Math.abs(c), e])));
  const allFlip = lst(ts.map(([c, e]) => T1([-c, e])));
  const dropLast = lst(ts.slice(0, -1).map(T1));
  const merged = [raw(ts.slice(0, 2)), ...ts.slice(2).map(T1)].map($).join("、");
  return {
    q: `多項式 ${$(raw(ts))} の項を、すべて正しく書いたものはどれか。`,
    ans: right,
    choices: choices4(r, right, [signDrop, allFlip, merged, dropLast]),
    hint: "ひき算も、負の数をたすと見なす。項は、符号もふくめて考えよう。",
    steps: [`${$(`${raw(ts)}=${plusForm(ts)}`)} と見る。`, `項は ${right} の ${ts.length}つ。`],
  };
};

// ── 何次式か ─────────────────────────────────────────────
const degQ = (r, ts) => {
  const p = P(ts), N = pdeg(p);
  const each = ts.map(([c, e]) => (degE(e) === 0 ? `${$(T1([c, e]))} は数だけの項` : `${$(T1([c, e]))} が ${degE(e)}`)).join("、");
  return {
    q: `多項式 ${$(raw(ts))} は、□次式。□は？`,
    ans: N,
    hint: "各項の次数を調べて、いちばん大きいものを見つけよう。",
    steps: [`各項の次数は、${each}。`, `いちばん大きい次数は ${N} だから、${N}次式。`],
  };
};

// ── 数量を式で表す（4択）・その式の次数 ────────────────────────
const PAIRS_G = [["りんご", "みかん"], ["パン", "おにぎり"], ["クッキー", "ドーナツ"], ["プリン", "ゼリー"]];
const NGON_NAME = { 3: "正三角形", 4: "正方形", 5: "正五角形", 6: "正六角形", 8: "正八角形" };
/** 数量の文脈。text＝数量の言い方、p＝式（多項式）、wrongs＝ありがちな誤答、st＝解説 */
const CTX = [
  (r) => {
    const [A, B] = pick(r, PAIRS_G), m = r(2, 5), n = pick(r, [2, 3, 4, 5, 6].filter((x) => x !== m));
    return {
      text: `1個 $x$ 円の${A}を ${m}個と、1個 $y$ 円の${B}を ${n}個買ったときの代金（円）`,
      p: P([[m, { x: 1 }], [n, { y: 1 }]]),
      wrongs: [P([[m * n, { x: 1, y: 1 }]]), P([[m, { y: 1 }], [n, { x: 1 }]]), P([[m + n, { x: 1, y: 1 }]])],
      st: [`${A} ${m}個の代金は $${m}x$ 円、${B} ${n}個の代金は $${n}y$ 円。`, `代金は、あわせて $${m}x+${n}y$ 円。`],
    };
  },
  () => ({
    text: "縦 $a$ cm、横 $b$ cm の長方形の周の長さ（cm）",
    p: P([[2, { a: 1 }], [2, { b: 1 }]]),
    wrongs: [P([[1, { a: 1, b: 1 }]]), P([[1, { a: 1 }], [1, { b: 1 }]]), P([[2, { a: 1, b: 1 }]]), P([[2, { a: 1 }], [1, { b: 1 }]])],
    st: ["周の長さは、縦 2本と横 2本の長さの和。", "$a\\times 2+b\\times 2=2a+2b$（cm）"],
  }),
  (r) => {
    const n = pick(r, [3, 4, 5, 6, 8]);
    return {
      text: `1辺が $x$ cm の${NGON_NAME[n]}の周の長さ（cm）`,
      p: P([[n, { x: 1 }]]),
      wrongs: [P([[1, { x: n }]]), P([[1, { x: 1 }], [n, {}]]), P([[n, { x: 2 }]])],
      st: [`${NGON_NAME[n]}の辺は ${n}本で、どれも $x$ cm。`, `$x\\times ${n}=${n}x$（cm）`],
    };
  },
  () => ({
    text: "底辺 $a$ cm、高さ $h$ cm の三角形の面積（cm²）",
    p: P([[[1, 2], { a: 1, h: 1 }]]),
    wrongs: [P([[1, { a: 1, h: 1 }]]), P([[2, { a: 1, h: 1 }]]), P([[[1, 2], { a: 1 }], [[1, 2], { h: 1 }]])],
    st: ["三角形の面積は、底辺×高さ÷2。", "$a\\times h\\div 2=\\frac{ah}{2}$（cm²）"],
  }),
  () => ({
    text: "1辺が $x$ cm の立方体の表面積（cm²）",
    p: P([[6, { x: 2 }]]),
    wrongs: [P([[1, { x: 3 }]]), P([[6, { x: 3 }]]), P([[6, { x: 1 }]]), P([[4, { x: 2 }]])],
    st: ["立方体の面は、1辺 $x$ cm の正方形が 6つ。", "$x\\times x\\times 6=6x^{2}$（cm²）"],
  }),
  () => ({
    text: "1辺が $x$ cm の立方体の、すべての辺の長さの合計（cm）",
    p: P([[12, { x: 1 }]]),
    wrongs: [P([[6, { x: 1 }]]), P([[8, { x: 1 }]]), P([[12, { x: 2 }]]), P([[1, { x: 12 }]])],
    st: ["立方体の辺は 12本で、どれも $x$ cm。", "$x\\times 12=12x$（cm）"],
  }),
  (r) => {
    const [A] = pick(r, PAIRS_G), m = r(2, 6);
    return {
      text: `1個 $x$ 円の${A}を ${m}個買って、$y$ 円出したときのおつり（円）`,
      p: P([[1, { y: 1 }], [-m, { x: 1 }]]),
      wrongs: [P([[m, { x: 1 }], [-1, { y: 1 }]]), P([[m, { y: 1 }], [-1, { x: 1 }]]), P([[1, { y: 1 }], [-1, { x: 1 }]])],
      st: [`${A} ${m}個の代金は $${m}x$ 円。`, `おつりは、出したお金から代金をひいて、$y-${m}x$（円）`],
    };
  },
];
/** 次数だけ聞く文脈（誤答はいらない） */
const CTX_DEG = [
  () => ({
    text: "縦 $a$ cm、横 $b$ cm、高さ $h$ cm の直方体の体積（cm³）",
    p: P([[1, { a: 1, b: 1, h: 1 }]]),
    st: ["直方体の体積は、縦×横×高さ。", "$a\\times b\\times h=abh$（cm³）"],
  }),
  () => ({
    text: "縦 $a$ cm、横 $b$ cm、高さ $h$ cm の直方体の、すべての辺の長さの合計（cm）",
    p: P([[4, { a: 1 }], [4, { b: 1 }], [4, { h: 1 }]]),
    st: ["縦・横・高さの長さの辺が、それぞれ 4本ずつ。", "$4a+4b+4h$（cm）"],
  }),
  () => ({
    text: "1辺が $x$ cm の立方体の体積（cm³）",
    p: P([[1, { x: 3 }]]),
    st: ["立方体の体積は、1辺×1辺×1辺。", "$x\\times x\\times x=x^{3}$（cm³）"],
  }),
  () => ({
    text: "縦 $a$ cm、横 $b$ cm の長方形の面積（cm²）",
    p: P([[1, { a: 1, b: 1 }]]),
    st: ["長方形の面積は、縦×横。", "$a\\times b=ab$（cm²）"],
  }),
];

// ── 正しい説明・まちがった説明を選ぶ（dr.6）──────────────────────
/** 説明の文のつくり方。ok＝正しい文にするか。{ s: 文, ok: 本当に正しいか（計算で確かめる）, why: 正しい事実 } */
const STM = [
  // 単項式の次数
  (r, ok) => {
    const L = pick(r, LET2), one = ok && r(0, 1) === 0;
    const e = one ? { [L[0]]: r(2, 4) } : { [L[0]]: r(2, 3), [L[1]]: r(1, 2) };
    const m = [rnz(r, -9, 9), e], D = degE(e), exps = Object.values(e);
    const claim = ok ? D : pick(r, [Math.max(...exps), D + 1, exps.length].filter((x) => x !== D));
    return { s: `${$(T1(m))} の次数は ${claim} である。`, ok: claim === pdeg(P([m])), why: `${$(`${T1(m)}=${mulForm(m[0], e)}`)} で、文字が ${D}個かけ合わされているので、次数は ${D}。` };
  },
  // 多項式の次数（項の数とはちがう）
  (r, ok) => {
    const L = pick(r, LET2);
    const ts = r(0, 2) === 0 ? [[[1, pick(r, [2, 3])], { [L[0]]: 1 }], [pick(r, [1, 2, 3, -1, -2]), {}]] : randTerms(r, L, pick(r, [1, 2, 4]), 3);
    const N = pdeg(P(ts)), k = ts.length, claim = ok ? N : k === N ? N + 1 : k;
    return { s: `${$(raw(byDeg(ts)))} は ${claim}次式である。`, ok: claim === N, why: `${$(raw(byDeg(ts)))} は、各項の次数のうち、いちばん大きいものが ${N}。${N}次式（項の数は ${k}つで、次数とは別）。` };
  },
  // 単項式か多項式か
  (r, ok) => {
    const L = pick(r, LET2);
    if (ok && r(0, 1) === 0) {
      const m = monoShape(r, L, true);
      return { s: `${$(T1(m))} は単項式である。`, ok: true, why: `${$(T1(m))} は、数や文字の乗法だけでできているので、単項式。` };
    }
    const ts = byDeg(randTerms(r, L, r(1, 3), pick(r, [2, 2, 3])));
    return ok
      ? { s: `${$(raw(ts))} は多項式である。`, ok: true, why: `${$(raw(ts))} は、${ts.length}つの項の和の形なので、多項式。` }
      : { s: `${$(raw(ts))} は単項式である。`, ok: false, why: `${$(raw(ts))} は、${ts.length}つの項の和の形なので、単項式ではなく多項式。` };
  },
  // 項の数
  (r, ok) => {
    const L = pick(r, LET2), k = pick(r, [2, 3, 4]), ts = byDeg(randTerms(r, L, r(1, 3), k)), n = ts.length;
    const claim = ok ? n : pick(r, [n + 1, n - 1].filter((x) => x >= 2));
    return { s: `${$(raw(ts))} の項は ${claim}つである。`, ok: claim === n, why: `${$(raw(ts))} の項は、${ts.map(T1).map($).join("、")} の ${n}つ。` };
  },
  // 係数
  (r, ok) => {
    const L = pick(r, LET2), e = { [L[0]]: r(1, 2), ...(r(0, 1) ? { [L[1]]: 1 } : {}) };
    const c = ok ? pick(r, [-1, 1, 5, -4]) : -1, claim = ok ? c : 1;
    return { s: `${$(T1([c, e]))} の係数は $${claim}$ である。`, ok: claim === c, why: `${$(`${T1([c, e])}=${mulForm(c, e)}`)} だから、係数は $${c}$。` };
  },
];
/** 4つの説明のうち nOk 個が正しいもの（4択） */
const stmQ = (r, wantOk) => {
  const kinds = shuffle(r, [0, 1, 2, 3, 4]).slice(0, 4), pos = r(0, 3);
  const items = kinds.map((k, i) => STM[k](r, wantOk ? i === pos : i !== pos));
  if (items.some((it, i) => it.ok !== (wantOk ? i === pos : i !== pos))) return { skip: true };
  const target = items[pos], other = items.find((_, i) => i !== pos);
  const ans = target.s;
  return {
    q: wantOk ? "次のうち、正しい説明はどれか。" : "次のうち、まちがっている説明はどれか。",
    ans,
    choices: choices4(r, ans, items.filter((_, i) => i !== pos).map((it) => it.s)),
    hint: "次数は「かけ合わされている文字の個数」、多項式の次数は「各項の次数のうち、いちばん大きいもの」。1つ1つ、数えなおして確かめよう。",
    steps: wantOk ? [target.why, `たとえば「${other.s}」は、まちがい。${other.why}`] : [`「${target.s}」がまちがい。${target.why}`, "ほかの3つは、正しい。"],
  };
};

// ── 直方体の辺の合計・表面積・体積（dr.7）──────────────────────
const BOXV = [["a", "b", "h"], ["x", "y", "z"], ["a", "b", "c"], ["p", "q", "r"]];
const boxOf = ([a, b, h]) => ({
  E: { name: "すべての辺の長さの合計", u: "cm", p: P([[4, { [a]: 1 }], [4, { [b]: 1 }], [4, { [h]: 1 }]]),
    wrongs: [P([[2, { [a]: 1 }], [2, { [b]: 1 }], [2, { [h]: 1 }]]), P([[1, { [a]: 1 }], [1, { [b]: 1 }], [1, { [h]: 1 }]]), P([[4, { [a]: 1, [b]: 1, [h]: 1 }]]), P([[12, { [a]: 1 }], [12, { [b]: 1 }], [12, { [h]: 1 }]])],
    st: (V) => ["縦・横・高さの長さの辺が、それぞれ 4本ずつ。", `$4${a}+4${b}+4${h}$（cm）`] },
  S: { name: "表面積", u: "cm²", p: P([[2, { [a]: 1, [b]: 1 }], [2, { [a]: 1, [h]: 1 }], [2, { [b]: 1, [h]: 1 }]]),
    wrongs: [P([[1, { [a]: 1, [b]: 1 }], [1, { [a]: 1, [h]: 1 }], [1, { [b]: 1, [h]: 1 }]]), P([[2, { [a]: 1, [b]: 1 }], [2, { [a]: 1, [h]: 1 }]]), P([[2, { [a]: 1, [b]: 1, [h]: 1 }]]), P([[6, { [a]: 1, [b]: 1, [h]: 1 }]])],
    st: (V) => ["向かい合う 2つの面が同じ形で、3組ある。", `$${a}${b}\\times 2+${a}${h}\\times 2+${b}${h}\\times 2=2${a}${b}+2${a}${h}+2${b}${h}$（cm²）`] },
  V: { name: "体積", u: "cm³", p: P([[1, { [a]: 1, [b]: 1, [h]: 1 }]]),
    wrongs: [P([[1, { [a]: 1, [b]: 1 }], [1, { [a]: 1, [h]: 1 }], [1, { [b]: 1, [h]: 1 }]]), P([[1, { [a]: 1 }], [1, { [b]: 1 }], [1, { [h]: 1 }]]), P([[3, { [a]: 1, [b]: 1, [h]: 1 }]]), P([[2, { [a]: 1, [b]: 1, [h]: 1 }]])],
    st: (V) => ["直方体の体積は、縦×横×高さ。", `$${a}\\times ${b}\\times ${h}=${a}${b}${h}$（cm³）`] },
});
const boxText = ([a, b, h]) => `縦 $${a}$ cm、横 $${b}$ cm、高さ $${h}$ cm の直方体`;

// ── 次数から、指数の文字を求める ─────────────────────────────
/** 係数 c、文字 u,v、指数の文字 unk、もう一方の指数 k の単項式の TeX（unk が u の指数） */
const monoUnk = (c, u, unk, v, k) => `${c === 1 ? "" : c === -1 ? "-" : c}${u}^{${unk}}${v}${k === 1 ? "" : `^{${k}}`}`;
const UNK = [["x", "y", "a"], ["x", "y", "n"], ["a", "b", "n"], ["s", "t", "m"], ["p", "q", "k"]];

export const UNITS = [
  unit("01", {
    name: "単項式・多項式と次数",
    desc: "項・係数・次数、何次式か",
    prereqs: ["J1-v4", "J1-v5"],
    points: [
      "数や文字の乗法だけでできている式を単項式（$8$ のような数だけの式もふくむ）、単項式の和の形の式を多項式という。多項式の中の 1つ1つの単項式を項という。",
      "単項式の次数は、かけ合わされている文字の個数。$3x^2y=3\\times x\\times x\\times y$ だから、次数は 3。文字にかけられている数が係数で、$-x^3$ の係数は $-1$。",
      "多項式の次数は、各項の次数のうち、いちばん大きいもの。次数が 1 の式を 1次式、2 の式を 2次式という。項の数と次数は、別のもの。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 01d01a 単項式の係数（整数）
        t("01d01a", (r) => monoAsk(intMono(r, r(1, 2), 3), "coef")),
        // 01d01b 単項式の次数
        t("01d01b", (r) => monoAsk(intMono(r, r(1, 2), 3), "deg")),
        // 01d01c 分数の係数の単項式（係数か次数）
        t("01d01c", (r) => monoAsk(fracMono(r), pick(r, ["coef", "deg"]))),
        // 01d02a 多項式の項をすべて書いたものを選ぶ
        t("01d02a", (r) => termsQ(r, randShapes(r, pick(r, LET2), r(2, 4)))),
        // 01d02b 多項式の項の数
        t("01d02b", (r) => {
          const ts = randShapes(r, pick(r, LET2), r(2, 5));
          return {
            q: `多項式 ${$(raw(ts))} の、項の数は？`,
            ans: ts.length,
            unit: "個",
            hint: "ひき算も、負の数をたすと見なす。+ や − でつながれた 1つ1つが項。",
            steps: [`${$(`${raw(ts)}=${plusForm(ts)}`)} と見る。`, `項は ${ts.map(T1).map($).join("、")} の ${ts.length}個。`],
          };
        }),
        // 01d03a 単項式を選ぶ
        t("01d03a", (r) => kindQ(r, "mono", false)),
        // 01d03b 多項式を選ぶ
        t("01d03b", (r) => kindQ(r, "poly", false)),
        // 01q01a 単項式の係数・次数（小テスト）
        t("01q01a", (r) => monoAsk(intMono(r, r(2, 3), 2), pick(r, ["coef", "deg"]))),
        // 01q01b 分数の係数の単項式の係数・次数（小テスト）
        t("01q01b", (r) => monoAsk(fracMono(r), pick(r, ["coef", "deg"]))),
        // 01q02 多項式 x^2-5x+6 の項をすべて選ぶ
        t("01q02", (r) => termsQ(r, randUni(r, pick(r, ["x", "y", "a", "t"]), pick(r, [3, 3, 4])))),
        // 01q03 多項式を選ぶ（分数の形の単項式にだまされない）
        t("01q03", (r) => kindQ(r, "poly", true)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 01d04 何次式か
        t("01d04", (r) => {
          const N = pick(r, [1, 2, 3, 4]), k = pick(r, [2, 3, 3]);
          return degQ(r, randTerms(r, pick(r, LET2), N, k));
        }),
        // 01d05a 数量を式で表す（4択）
        t("01d05a", (r) => {
          const c = pick(r, CTX)(r), { ans, choices } = polyChoices(r, c.p, c.wrongs);
          return {
            q: `${c.text}を、文字を使った式で表すと？`,
            ans,
            choices,
            hint: "数量の関係を、ことばの式にしてから、文字におきかえよう。",
            steps: c.st,
          };
        }),
        // 01d05b 数量を表す式の次数
        t("01d05b", (r) => {
          const c = pick(r, [...CTX, ...CTX_DEG])(r), N = pdeg(c.p);
          return {
            q: `${c.text}を、文字を使った式で表したとき、その式の次数は？`,
            ans: N,
            hint: "まず式に表そう。次数は、かけ合わされている文字の個数（多項式なら、各項の次数のいちばん大きいもの）。",
            steps: [...c.st, `この式の次数は ${N}。`],
          };
        }),
        // 01q04 何次式か（小テスト）
        t("01q04", (r) => degQ(r, byDeg(randTerms(r, pick(r, LET2), pick(r, [1, 2, 2, 3]), pick(r, [2, 3]))))),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 01d06a 正しい説明を選ぶ
        t("01d06a", (r) => stmQ(r, true)),
        // 01d06b まちがっている説明を選ぶ
        t("01d06b", (r) => stmQ(r, false)),
        // 01d07a 直方体の辺の合計・表面積・体積を表す式（4択）
        t("01d07a", (r) => {
          const vs = pick(r, BOXV), w = pick(r, ["E", "S", "V"]), b = boxOf(vs)[w], { ans, choices } = polyChoices(r, b.p, b.wrongs);
          return {
            q: `${boxText(vs)}の、${b.name}（${b.u}）を表す式はどれか。`,
            ans,
            choices,
            hint: w === "E" ? "直方体の辺は全部で 12本。同じ長さの辺が何本ずつあるかな。" : w === "S" ? "直方体の面は 6つ。同じ形の面が何組あるかな。" : "直方体の体積の公式を思い出そう。",
            steps: b.st(),
          };
        }),
        // 01d07b 式に数を入れた値
        t("01d07b", (r) => {
          const vs = pick(r, BOXV), w = pick(r, ["E", "S", "V"]), b = boxOf(vs)[w];
          const [a, bb, h] = vs, x = r(2, 6), y = r(2, 6), z = r(2, 6), val = peval(b.p, { [a]: x, [bb]: y, [h]: z });
          const sub = w === "E" ? `4\\times ${x}+4\\times ${y}+4\\times ${z}` : w === "S" ? `2\\times ${x}\\times ${y}+2\\times ${x}\\times ${z}+2\\times ${y}\\times ${z}` : `${x}\\times ${y}\\times ${z}`;
          return {
            q: `${boxText(vs)}の、${b.name}を、$${a}$、$${bb}$、$${h}$ を使った式で表す。$${a}=${x}$、$${bb}=${y}$、$${h}=${z}$ のとき、その式の値は？`,
            ans: val[0],
            unit: b.u,
            hint: w === "E" ? "辺は全部で 12本。式に表してから、数を入れよう。" : w === "S" ? "向かい合う面は同じ形。式に表してから、数を入れよう。" : "式に表してから、数を入れよう。",
            steps: [...b.st(), `$${ptex(b.p)}$ に数を入れて、$${sub}=${val[0]}$（${b.u}）`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 01d08a 2次式を選ぶ
        t("01d08a", (r) => {
          const L = pick(r, LET2), mk = (N, k) => ptex(P(randTerms(r, L, N, k)));
          const right = mk(2, pick(r, [2, 3])), ans = $(right);
          const wrongs = [mk(1, 3), mk(3, 2), mk(pick(r, [1, 3, 4]), pick(r, [2, 3]))];
          return {
            q: "次のうち、2次式はどれか。",
            ans,
            choices: choices4(r, ans, wrongs.map($), () => $(mk(pick(r, [1, 3, 4]), 2))),
            hint: "項の数ではなく、各項の次数を調べて、いちばん大きいものを見つけよう。",
            steps: ["各項の次数を調べ、いちばん大きいものがその式の次数。", `${ans} は、いちばん大きい次数が 2 だから 2次式。ほかは 1次式・3次式・4次式のどれか。`],
          };
        }),
        // 01d08b 次数から、指数の文字の値を求める
        t("01d08b", (r) => {
          const [u, v, unk] = pick(r, UNK), k = r(1, 3), N = r(5, 8), c = rnz(r, -9, 9), a = N - k;
          const flip = r(0, 1) === 1, s = flip ? `${c === 1 ? "" : c === -1 ? "-" : c}${v}${k === 1 ? "" : `^{${k}}`}${u}^{${unk}}` : monoUnk(c, u, unk, v, k);
          return {
            q: `単項式 ${$(s)} の次数が ${N} のとき、$${unk}$ の値は？`,
            ans: a,
            hint: `次数は、かけ合わされている文字の個数。$${u}^{${unk}}$ は、$${u}$ を $${unk}$ 個かけたもの。`,
            steps: [`${$(`${u}^{${unk}}`)} は $${u}$ が $${unk}$ 個、${$(v + (k === 1 ? "" : `^{${k}}`))} は $${v}$ が ${k}個かけ合わされている。`, `次数は $${unk}+${k}$。$${unk}+${k}=${N}$ より $${unk}=${a}$。`],
          };
        }),
        // 01d09 多項式が N 次式になるように、指数の文字の値を求める
        t("01d09", (r) => {
          const [u, v, unk] = pick(r, UNK), j = r(1, 2), N = r(5, 8), a = N - j;
          const k2 = r(1, 3), d2 = r(1, Math.min(3, N - 1 - k2)) , c1 = rnz(r, -9, 9), c2 = rnz(r, -9, 9), c3 = rnz(r, -9, 9);
          const unkT = `${c1 === 1 ? "" : c1 === -1 ? "-" : c1}${u}^{${unk}}${v}${j === 1 ? "" : `^{${j}}`}`;
          const knownT = T1([c2, { [u]: k2, [v]: d2 }]);
          const ord = r(0, 1) ? [unkT, knownT, T1([c3, {}])] : [knownT, unkT, T1([c3, {}])];
          return {
            q: `多項式 ${$(joinTex(ord))} が ${N}次式のとき、$${unk}$ の値は？`,
            ans: a,
            hint: "各項の次数を調べよう。多項式の次数は、各項の次数のうち、いちばん大きいもの。",
            steps: [`${$(knownT)} の次数は ${k2 + d2}。これは ${N} より小さいので、${$(unkT)} の次数が ${N}。`, `${$(unkT)} の次数は $${unk}+${j}$。$${unk}+${j}=${N}$ より $${unk}=${a}$。`],
          };
        }),
        // 01q05 チャレンジ：次数と、指数の差から a, b を求める
        t("01q05", (r) => {
          const b = r(1, 5), d = r(1, 4), a = b + d, N = a + b, c = rnz(r, 2, 9) * pick(r, [1, -1]);
          const ask = pick(r, ["a", "b"]);
          return {
            q: `単項式 ${$(`${c}x^{a}y^{b}`)} の次数は ${N} で、$x$ の指数 $a$ は、$y$ の指数 $b$ より ${d} 大きい。$${ask}$ の値は？（$a$、$b$ は自然数）`,
            ans: ask === "a" ? a : b,
            hint: "次数と、指数の差の 2つの条件から、a と b の関係式を 2つつくろう。",
            steps: [`次数が ${N} だから、$a+b=${N}$。`, `$a$ は $b$ より ${d} 大きいから、$a=b+${d}$。これを代入して $(b+${d})+b=${N}$、$2b=${N - d}$ より $b=${b}$。`, `$a=${b}+${d}=${a}$。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第1時は、演習プリント 9問・小テスト 5問のすべてを移した（項を書く・ア〜カに分ける・説明の正誤・2次式を選ぶは、正しいものを選ぶ4択に直した）
