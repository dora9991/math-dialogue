// ============================================================
// shiki-03.js — 式の計算 第3時「多項式に数をかけたり、多項式を数でわったりしよう」
//   ikkan の演習プリント（shiki-03.dr.1〜9）・小テスト（shiki-03.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「03」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：03d01a ＝ shiki-03.dr.1 の4択、03d01b ＝ 同じ型で係数を聞く数の問い
//   式の答えは入力欄で打てないので、(a) 4択（正解は algebra.js で計算。誤答は「かっこの中の1つの項にしかかけない」
//   「ひく式の符号を変え忘れる」「通分で分子にかけ忘れる」など、正解と式として同じにならないもの）と、
//   (b) 答えの式の係数（数）を聞く問い、の2つの型にした。分数の形の式の数の問いは、分母が通分した値のまま約分されない組だけを使う。
//   「まちがいを説明する」(dr.6) は「最初にまちがえているところ」を選ぶ4択と、正しく計算した答えの係数を聞く問いにした。
// ============================================================
import { t, pick, choices4, fracAns, fracTex, rnz, gcd, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qmul, term, poly, padd, psub, pneg, pscale, pisz, peq, ptex } from "../algebra.js";

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
const par = (s) => (s[0] === "-" ? `(${s})` : s);
const keyOf = (e) => Object.keys(e).filter((v) => e[v] !== 0).sort().map((v) => v + e[v]).join("");
const expsOf = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
const negT = ([c, e]) => [Array.isArray(c) ? [-c[0], c[1]] : -c, e];
const coefOf = (p, e = {}) => p[keyOf(e)] || Q(0);
const ansQ = (q) => fracAns(q[0], q[1]);
const tms = (p) => Object.entries(p).map(([k, c]) => [c, expsOf(k)]);
const LET2 = [["x", "y"], ["a", "b"], ["m", "n"], ["p", "q"], ["s", "t"]];
const SH2 = (L) => [{ [L[0]]: 1 }, { [L[1]]: 1 }];
const lin2 = (r, sh, lo, hi) => sh.map((e) => [rnz(r, lo, hi), e]);
const gcdAll = (a) => a.reduce((g, x) => gcd(g, x), 0);
const flipTerm = (p, k) => ({ ...p, [k]: [-p[k][0], p[k][1]] });

/** 式の4択：正解 right、ありがちな誤答 wrongs（多項式）。正解と式として同じもの（peq）は、はずす */
const allInt = (p) => Object.values(p).every((c) => c[1] === 1);
const polyChoices = (r, right, wrongs) => {
  const rt = ptex(right), seen = new Set([rt]), ws = [];
  for (const w of wrongs) {
    if (!w || pisz(w) || peq(w, right) || (allInt(right) && !allInt(w))) continue;    // 答えが整数係数なら、誤答も整数係数にそろえる
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

// ── 分数の形の式（分子は整数係数の多項式、分母は正の整数）─────────────
const frVal = ({ num, den }) => pscale(num, [1, den]);
/** 約分する（分子の係数と分母の最大公約数でわる） */
const frRed = (num, den) => { const g = gcdAll([...Object.values(num).map((c) => Math.abs(c[0])), den]); return { num: pscale(num, [1, g]), den: den / g }; };
/** 分数の形の式の TeX（分母が 1 なら、ただの多項式。分子が負の1項なら、符号を外に出す） */
const frTexOf = ({ num, den }) => {
  if (den === 1) return ptex(num);
  const ks = Object.keys(num);
  if (ks.length === 1 && num[ks[0]][0] < 0) return `-\\frac{${ptex(pneg(num))}}{${den}}`;
  return `\\frac{${ptex(num)}}{${den}}`;
};
/** 分数の形の式の4択 */
const fracChoices = (r, right, wrongs) => {
  const R = frRed(right.num, right.den), rt = frTexOf(R), rv = frVal(R), seen = new Set([rt]), ws = [];
  for (const w of wrongs) {
    if (!w || pisz(w.num)) continue;
    const W = frRed(w.num, w.den);
    if (peq(frVal(W), rv)) continue;
    const s = frTexOf(W);
    if (seen.has(s)) continue;
    seen.add(s); ws.push($(s));
  }
  const ks = Object.keys(R.num);
  const fill = (i) => {
    const k = ks[i % ks.length], W = frRed(padd(R.num, { [k]: Q([1, -1, 2, -2][Math.floor(i / ks.length) % 4]) }), R.den);
    return pisz(W.num) || peq(frVal(W), rv) ? null : $(frTexOf(W));
  };
  return { ans: $(rt), choices: choices4(r, $(rt), ws, fill) };
};

/** かっこの前の数 kq（Q）の書き方：省略できる 1 は省く */
const kStr = (kq) => (kq[1] === 1 ? (kq[0] === 1 ? "" : kq[0] === -1 ? "-" : String(kq[0])) : fracTex(kq[0], kq[1]));
const kFull = (kq) => (kq[1] === 1 ? String(kq[0]) : fracTex(kq[0], kq[1]));

/** 答えの式 p の、項 e の係数を聞く */
const askText = (e) => `${$(ptex(term(1, e)))} の係数`;
const pickKey = (r, p) => expsOf(pick(r, Object.keys(p)));

// ── 数×多項式（dr.1・dr.2・qz.1・qz.3・dr.4・dr.8）───────────────────
const FRK = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [3, 2], [5, 2], [4, 3]];
/** かっこの前の数をかける。o：{ n：かっこの数（1か2）, frac：分数をかけるか, k：[最小, 最大], c：中の係数の大きさ } */
const mulBuild = (r, mode, o) => {
  const L = pick(r, LET2), sh = SH2(L), back = o.frac && o.n === 1 && r(0, 1) === 1;    // back：(多項式)×分数 の形
  let parts, ex, res;
  for (let i = 0; i < 100; i++) {
    parts = Array.from({ length: o.n }, (_, j) => {
      let kq, m = 1;
      if (o.frac) { const [p, q] = pick(r, FRK); kq = Q((back || j === 0 ? 1 : pick(r, [1, -1])) * (back ? 1 : pick(r, [1, -1])) * p, q); m = q; }
      else { let k; do { k = r(o.k[0], o.k[1]); } while (j === 0 ? Math.abs(k) < 2 : k === 0); kq = Q(k); }
      return { kq, ts: sh.map((e, jj) => [(jj === 0 && r(0, 9) < 7 ? r(1, o.c) : rnz(r, -o.c, o.c)) * m, e]) };
    });
    ex = parts.map(({ kq, ts }) => ts.map(([c, e]) => [qmul(kq, Q(c)), e]));
    res = P(ex.flat());
    if (Object.keys(res).length === 2) break;
  }
  const exprParts = parts.map(({ kq, ts }) => (back ? `(${raw(ts)})\\times ${kFull(kq)}` : `${kStr(kq)}(${raw(ts)})`));
  const expr = joinTex(exprParts);
  let steps;
  if (o.n === 1) {
    const { kq, ts } = parts[0];
    const mid = joinTex(ts.map((tt) => (back ? `${T1(tt)}\\times ${kFull(kq)}` : `${par(kFull(kq))}\\times ${par(T1(tt))}`)));
    steps = ["かっこの外の数を、かっこの中の全部の項にかける（分配法則）。", $(`${expr}=${mid}=${ptex(res)}`)];
  } else {
    steps = ["それぞれ分配法則でかっこをはずして、同類項をまとめる。かっこの前が − のときは、かっこの中の全部の項の符号が変わる。", $(`${expr}=${raw(ex.flat())}=${ptex(res)}`)];
  }
  const hint = "かっこの外の数は、かっこの中のどの項にかけるのだったかな（分配法則 $m(a+b)=ma+mb$）。符号にも気をつけよう。";
  if (mode === "num") {
    const e = pickKey(r, res);
    return { q: `${$(expr)} を計算する。答えの ${askText(e)}は？`, ans: ansQ(coefOf(res, e)), hint, steps };
  }
  const lastSlip = P(ex.flatMap((ts, i) => (i === ex.length - 1 ? ts.map((tt, j) => (j === ts.length - 1 ? negT(tt) : tt)) : ts)));
  const firstOnly = parts.map((pt, pi) => P(ex.flatMap((ts, i) => (i === pi ? [ts[0], ...pt.ts.slice(1)] : ts))));
  const recip = o.frac ? parts.map((pt) => P(pt.ts.map(([c, e]) => [qmul(Q(pt.kq[1], pt.kq[0]), Q(c)), e]))) : [];    // 分数の逆数をかけてしまう
  const wrongs = o.frac && o.n === 1 ? [...recip, ...firstOnly, lastSlip, pneg(res)] : [lastSlip, ...firstOnly, pneg(res)];
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${$(expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 多項式÷数（dr.1・qz.2）──────────────────────────────
const divBuild = (r, mode, o) => {
  const L = pick(r, LET2), sh = SH2(L);
  let d, Qs, ts, res;
  for (let i = 0; i < 100; i++) {
    d = r(o.k[0], o.k[1]);
    if (Math.abs(d) < 2) continue;
    Qs = lin2(r, sh, -o.c, o.c);
    ts = Qs.map(([c, e]) => [c * d, e]);
    res = P(Qs);
    if (Object.keys(res).length === 2) break;
  }
  const ds = d < 0 ? `(${d})` : String(d);
  const expr = `(${raw(ts)})\\div ${ds}`;
  const mid = joinTex(ts.map((tt) => `${T1(tt)}\\div ${ds}`));
  const steps = ["かっこの中の全部の項を、その数でわる（$\\div d$ は $\\times\\frac{1}{d}$ と考えてもよい）。", $(`${expr}=${mid}=${ptex(res)}`)];
  const hint = "かっこの中のどの項を、わる数でわるのだったかな。負の数でわるときの符号にも気をつけよう。";
  if (mode === "num") {
    const e = pickKey(r, res);
    return { q: `${$(expr)} を計算する。答えの ${askText(e)}は？`, ans: ansQ(coefOf(res, e)), hint, steps };
  }
  const firstOnly = P([Qs[0], ts[1]]);
  const lastSlip = P([Qs[0], negT(Qs[1])]);
  const { ans, choices } = polyChoices(r, res, [firstOnly, lastSlip, pneg(res), P(ts.map(([c, e]) => [c * d, e]))]);
  return { q: `${$(expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 分数の形の式の加減（dr.3・dr.6・dr.8・qz.4・qz.5）──────────────────
/** N1/d1 ± N2/d2（d1 が 1 のときは、整数の式 N1）の計算の途中式と答え */
const fracCalc = (N1, d1, N2, d2, op) => {
  const L = lcm(d1, d2), k1 = L / d1, k2 = L / d2, s = op === "+" ? 1 : -1;
  const sc = (ts, k, sg = 1) => ts.map(([c, e]) => [sg * k * c, e]);
  const allTs = [...sc(N1, k1), ...sc(N2, k2, s)];
  const num = P(allTs), red = frRed(num, L);
  const part1 = d1 === 1 ? raw(N1) : `\\frac{${raw(N1)}}{${d1}}`, part2 = `\\frac{${raw(N2)}}{${d2}}`;
  const expr = joinTex([part1, (op === "-" ? "-" : "") + part2]);
  const nb1 = N1.length === 1 ? raw(sc(N1, k1)) : k1 === 1 ? raw(N1) : `${k1}(${raw(N1)})`;
  const nb2 = `${k2 === 1 ? "" : k2}(${raw(N2)})`;
  const stageC = `\\frac{${nb1}${op}${nb2}}{${L}}`;
  const stageB = d1 === 1 ? `\\frac{${raw(sc(N1, k1))}}{${L}}${op}\\frac{${raw(N2)}}{${L}}` : null;
  const dedup = (a) => a.filter((x, i) => x && (i === 0 || x !== a[i - 1]));
  return {
    L, k1, k2, num, red, expr,
    chain1: dedup([expr, stageB, stageC]).join("="),
    chain2: dedup([stageC, `\\frac{${raw(allTs)}}{${L}}`, frTexOf({ num, den: L }), frTexOf(red)]).join("="),
  };
};
/** 分数の形の式の加減の誤答（分子にかけ忘れる／ひく分数の分子にかっこをつけない／分母どうし分子どうしをたす／符号） */
const fracWrongs = (N1, d1, N2, d2, op) => {
  const L = lcm(d1, d2), k1 = L / d1, k2 = L / d2, s = op === "+" ? 1 : -1;
  const sc = (ts, k, sg = 1) => ts.map(([c, e]) => [sg * k * c, e]);
  const res = P([...sc(N1, k1), ...sc(N2, k2, s)]);
  return [
    { num: P([...N1, ...sc(N2, 1, s)]), den: L },                                                   // 分子にかけ忘れる
    op === "-" ? { num: P([...sc(N1, k1), negT(sc(N2, k2)[0]), ...sc(N2, k2).slice(1)]), den: L } : { num: P([...sc(N1, k1), ...N2]), den: L },   // ひく分数の分子の、2つ目以降の符号を変えない（たすときは、2つ目の分子に通分の数をかけない）
    { num: P([...N1, ...sc(N2, 1, s)]), den: d1 + d2 },                                             // 分母どうし・分子どうしをたす
    { num: pneg(res), den: L },
    ...Object.keys(res).map((k) => ({ num: flipTerm(res, k), den: L })),
  ];
};
const DEN_BASIC = [[2, 3], [3, 2], [3, 4], [4, 3], [3, 6], [6, 3], [2, 4], [4, 2], [2, 6], [6, 2], [4, 6], [6, 4]];
const DEN_HARD = [[6, 4], [4, 6], [3, 8], [8, 3], [6, 9], [4, 10], [10, 4]];
const fracSumBuild = (r, mode, o) => {
  const L2 = pick(r, LET2), sh = SH2(L2), cr = o.c || 5;
  let d1, d2, op, N1, N2, c, ok = false;
  for (let i = 0; i < 200 && !ok; i++) {
    [d1, d2] = pick(r, o.dens); op = pick(r, o.ops);
    const intfrac = o.intfrac && r(0, 3) === 0;
    if (intfrac) { d1 = 1; N1 = [[pick(r, [1, 1, 2, -1]), sh[0]]]; } else N1 = [[r(1, cr), sh[0]], [rnz(r, -cr, cr), sh[1]]];
    N2 = [[r(1, cr), sh[0]], [rnz(r, -cr, cr), sh[1]]];
    c = fracCalc(N1, d1, N2, d2, op);
    ok = !pisz(c.num) && (mode !== "num" || (gcdAll([...Object.values(c.num).map((q) => Math.abs(q[0])), c.L]) === 1));
  }
  const steps = [op === "-" ? "分母をそろえて（通分して）、1つの分数にまとめる。ひく分数の分子には、かっこをつけて、全部の項の符号を変える。" : "分母をそろえて（通分して）、1つの分数にまとめる。分子にかける数は、分子全体にかけるので、かっこをつける。", $(c.chain1), $(c.chain2)];
  const hint = op === "-" ? "分母の最小公倍数に通分して、分子を1つにまとめよう。ひく分数の分子は、かっこをつけて、どう計算するのだったかな。" : "分母の最小公倍数に通分して、分子を1つにまとめよう。通分の数は、分子のどこにかけるのだったかな。";
  if (mode === "num") {
    const e = pickKey(r, c.num);
    return { q: `${$(c.expr)} を計算して、分母が ${c.L} の 1つの分数にまとめる。分子の ${askText(e)}は？`, ans: ansQ(coefOf(c.num, e)), hint, steps };
  }
  const { ans, choices } = fracChoices(r, { num: c.num, den: c.L }, fracWrongs(N1, d1, N2, d2, op));
  return { q: `${$(c.expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 通分の計算のまちがいさがし（dr.6）──────────────────────
const fracMistakeBuild = (r, what) => {
  const L2 = pick(r, LET2), sh = SH2(L2);
  let [d1, d2] = pick(r, [[2, 4], [2, 6], [3, 6], [2, 8]]), N1, N2, k1, W, right, ok = false;
  for (let i = 0; i < 200 && !ok; i++) {
    N1 = [[r(1, 5), sh[0]], [rnz(r, -5, 5), sh[1]]]; N2 = [[r(1, 5), sh[0]], [rnz(r, -5, 5), sh[1]]]; k1 = d2 / d1;
    const wrongTs = [...N1.map(([c, e]) => [k1 * c, e]), negT(N2[0]), N2[1]];            // 2つ目の項の符号を変えていない
    W = P(wrongTs);
    right = P([...N1.map(([c, e]) => [k1 * c, e]), ...N2.map(negT)]);
    ok = !pisz(W) && !pisz(right) && !peq(W, right) && !peq(P(N1), P(N2)) && (what !== "num" || gcdAll([...Object.values(right).map((q) => Math.abs(q[0])), d2]) === 1);
  }
  const wrongTs = [...N1.map(([c, e]) => [k1 * c, e]), negT(N2[0]), N2[1]];
  const A = `\\frac{${raw(N1)}}{${d1}}-\\frac{${raw(N2)}}{${d2}}`;
  const line = [A, `\\frac{${joinTex([`${k1}(${raw(N1)})`, T1(negT(N2[0])), T1(N2[1])])}}{${d2}}`, `\\frac{${raw(wrongTs)}}{${d2}}`, frTexOf({ num: W, den: d2 })].join("=");
  const fixed = fracCalc(N1, d1, N2, d2, "-");
  const steps = [
    `ひく分数の分子 ${$(raw(N2))} は、かっこをつけて、全部の項の符号を変える。${$(`-(${raw(N2)})=${raw(N2.map(negT))}`)}`,
    `${$(T1(N2[1]))} の符号を変えていないのが、まちがい。`,
    `正しくは ${$(fixed.chain1)}、${$(fixed.chain2)}。`,
  ];
  if (what === "where") {
    const ans = `ひく分数の分子 ${$(raw(N2))} の全部の項の符号を変えるのに、${$(T1(N2[1]))} の符号を変えていない。`;
    const wrongs = [`通分するとき、${$(`\\frac{${raw(N1)}}{${d1}}`)} の分子に ${k1} をかけていない。`, `分母を ${d2} にそろえるところを、まちがえている。`, "分子の同類項をまとめる計算を、まちがえている。"];
    return {
      q: `次の計算には、まちがいがある。${$(line)} 最初にまちがえているところを説明した文として、正しいものはどれか。`,
      ans,
      choices: choices4(r, ans, wrongs),
      hint: "ひく分数の分子は、かっこをつけて、どう計算するのだったかな。−( ) をはずすと、各項の符号はどうなるか確かめよう。",
      steps,
    };
  }
  const e = N2[1][1];    // まちがえた項の文字（この文字の係数は、まちがいで変わる）
  return {
    q: `次の計算には、まちがいがある。${$(line)} 正しく計算して、分母が ${d2} の 1つの分数にまとめたとき、分子の ${askText(e)}は？`,
    ans: ansQ(coefOf(right, e)),
    hint: "ひく分数の分子は、かっこをつけて、どう計算するのだったかな。考え直して、計算し直そう。",
    steps,
  };
};

// ── 式 A, B を代入する計算（dr.5）──────────────────────────
const abBuild = (r, mode) => {
  const L2 = pick(r, LET2), sh = SH2(L2);
  let A, B, X, Y, Xn, Yn, form, c, d, e, res;
  for (let i = 0; i < 100; i++) {
    A = P(lin2(r, sh, -4, 4)); B = P(lin2(r, sh, -4, 4));
    [Xn, Yn] = r(0, 1) ? ["A", "B"] : ["B", "A"];
    X = Xn === "A" ? A : B; Y = Xn === "A" ? B : A;
    form = r(0, 2) === 0 ? 2 : 1;
    c = r(2, 4);
    if (peq(A, B) || peq(A, pneg(B))) continue;
    if (form === 1) { d = pick(r, [-4, -3, -2, 2, 3]); res = padd(pscale(X, c), pscale(Y, d)); }                            // cX + dY
    else { d = r(1, 2); e = pick(r, [-3, -2, -1, 2, 3]); if (c === d) continue; res = psub(pscale(X, c), padd(pscale(X, d), pscale(Y, e))); }    // cX − (dX + eY)
    if (Object.keys(res).length === 2) break;
  }
  const Xt = ptex(X), Yt = ptex(Y), sg = (k) => (k < 0 ? "-" : "+"), ab = (k) => Math.abs(k);
  let expr, subst, steps, wrongs;
  if (form === 1) {
    expr = `${c}${Xn}${sg(d)}${ab(d)}${Yn}`;
    subst = `${c}(${Xt})${sg(d)}${ab(d)}(${Yt})`;
    const mid = raw([...tms(pscale(X, c)), ...tms(pscale(Y, d))]);
    steps = [`$A$、$B$ を代入して、${$(`${expr}=${subst}`)}。`, $(`${subst}=${mid}=${ptex(res)}`)];
    const yt = tms(pscale(Y, d)), lastKey = Object.keys(res).sort().pop();
    wrongs = [padd(pscale(X, c), pscale(Y, -d)), P([...tms(pscale(X, c)), yt[0], ...tms(Y).slice(1)]), flipTerm(res, lastKey), pneg(res)];
  } else {
    const eTx = ab(e) === 1 ? `(${Yt})` : `${ab(e)}(${Yt})`, dTx = d === 1 ? `(${Xt})` : `${d}(${Xt})`;
    const inner = padd(pscale(X, d), pscale(Y, e));
    expr = `${c}${Xn}-(${d === 1 ? "" : d}${Xn}${sg(e)}${ab(e) === 1 ? "" : ab(e)}${Yn})`;
    subst = `${c}(${Xt})-(${dTx}${sg(e)}${eTx})`;
    const mid = `${c}(${Xt})-(${ptex(inner)})`;
    steps = [`$A$、$B$ を代入して、${$(`${expr}=${subst}`)}。`, `内側のかっこを先に計算して、${$(`${subst}=${mid}`)}。`, $(`${mid}=${raw([...tms(pscale(X, c)), ...tms(pneg(inner))])}=${ptex(res)}`)];
    wrongs = [padd(psub(pscale(X, c), pscale(X, d)), pscale(Y, e)), padd(pscale(X, c + d), pscale(Y, e)), psub(pscale(X, c), pscale(X, d)), pneg(res)];
  }
  const hint = `$A$、$B$ にそれぞれの式を代入して、分配法則でかっこをはずそう。${form === 2 ? "−( ) をはずすと、各項の符号はどうなるかな。" : "かける数の符号にも気をつけよう。"}`;
  const head = `$A=${ptex(A)}$、$B=${ptex(B)}$ のとき、${$(expr)} を計算する。`;
  if (mode === "num") {
    const k = pickKey(r, res);
    return { q: `${head}答えの ${askText(k)}は？`, ans: ansQ(coefOf(res, k)), hint, steps };
  }
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${head}答えはどれか。`, ans, choices, hint, steps };
};

// ── 台形の面積（dr.7）────────────────────────────────────
const trapBuild = (r, mode) => {
  const L2 = pick(r, LET2), sh = SH2(L2);
  let top, bot, h, area, sum;
  for (let i = 0; i < 100; i++) {
    top = lin2(r, sh, 1, 6); bot = lin2(r, sh, 1, 6); h = r(2, 9);
    sum = P([...top, ...bot]);
    if ((sum[keyOf(sh[0])][0] * h) % 2 === 0 && (sum[keyOf(sh[1])][0] * h) % 2 === 0) break;
  }
  area = pscale(sum, [h, 2]);
  const expr = `上底が ${$(`(${raw(top)})`)} cm、下底が ${$(`(${raw(bot)})`)} cm、高さが ${h} cm の台形の面積（cm²）を簡単な式で表す。`;
  const kq = Q(h, 2);
  const steps = ["台形の面積は、(上底＋下底)×高さ÷2。", $(`\\frac{1}{2}\\times((${raw(top)})+(${raw(bot)}))\\times ${h}=\\frac{1}{2}\\times(${ptex(sum)})\\times ${h}=${kStr(kq)}(${ptex(sum)})=${ptex(area)}`) + "（cm²）"];
  const hint = "台形の面積の公式を思い出そう。かっこの中を先にまとめてから、数をかけよう。";
  if (mode === "num") {
    const e = pickKey(r, area);
    return { q: `${expr}答えの ${askText(e)}は？`, ans: ansQ(coefOf(area, e)), hint, steps };
  }
  const ts = tms(area);
  const wrongs = [pscale(area, 2), P([ts[0], ...tms(sum).filter(([, e]) => keyOf(e) !== keyOf(ts[0][1]))]), P(ts.map((tt, i) => (i === ts.length - 1 ? negT(tt) : tt))), pscale(sum, [1, 2])];
  const { ans, choices } = polyChoices(r, area, wrongs);
  return { q: `${expr}答えはどれか。`, ans, choices, hint, steps };
};

// ── ある式 A（dr.9）─────────────────────────────────────
const kTimesBuild = (r, mode) => {
  const L2 = pick(r, LET2), sh = SH2(L2), minus = r(0, 1) === 0, k = r(2, 5);
  let A, B, C, kA;
  for (let i = 0; i < 100; i++) {
    A = P(lin2(r, sh, -6, 6)); B = P(lin2(r, sh, -6, 6)); kA = pscale(A, k);
    C = minus ? psub(kA, B) : padd(kA, B);
    if (Object.keys(C).length === 2 && Object.keys(A).length === 2) break;
  }
  const Bt = ptex(B), Ct = ptex(C), kAt = ptex(kA);
  const head = `ある式 $A$ を ${k}倍して、${$(`(${Bt})`)} を${minus ? "ひく" : "たす"}と、${$(Ct)} になった。$A$ を求めよう。`;
  const steps = [
    `条件を式にすると、${$(`${k}A${minus ? "-" : "+"}(${Bt})=${Ct}`)}。`,
    `${$(`${k}A=(${Ct})${minus ? "+" : "-"}(${Bt})=${raw([...tms(C), ...(minus ? tms(B) : tms(B).map(negT))])}=${kAt}`)}`,
    `${$(`A=(${kAt})\\div ${k}=${ptex(A)}`)}`,
  ];
  const hint = "ある式 $A$ を使って、条件を式に表そう。$A$ のかたまりを、先に求めよう。";
  if (mode === "num") {
    const e = pickKey(r, A);
    return { q: `${head}$A$ の ${askText(e)}は？`, ans: ansQ(coefOf(A, e)), hint, steps };
  }
  const wrongs = [kA, minus ? pscale(psub(C, B), [1, k]) : pscale(padd(C, B), [1, k]), pscale(C, [1, k]), pneg(A)];
  const { ans, choices } = polyChoices(r, A, wrongs);
  return { q: `${head}$A$ はどれか。`, ans, choices, hint, steps };
};

// ── ある式から ○ をひくと △（qz.5）───────────────────────
const unknownFracBuild = (r, mode) => {
  const L2 = pick(r, LET2), sh = SH2(L2), minus = r(0, 1) === 0;
  let NB, dB, NC, dC, c, ok = false;
  for (let i = 0; i < 200 && !ok; i++) {
    [dB, dC] = pick(r, [[2, 4], [3, 6], [2, 3], [3, 4], [4, 2], [6, 3], [2, 6], [4, 6], [3, 2]]);
    NB = lin2(r, sh, -4, 4); NC = lin2(r, sh, -4, 4);
    c = fracCalc(NC, dC, NB, dB, minus ? "+" : "-");           // ある式 ＝ C ＋ B（ひいた）／ C − B（たした）
    ok = !pisz(c.num) && (mode !== "num" || gcdAll([...Object.values(c.num).map((q) => Math.abs(q[0])), c.L]) === 1);
  }
  const Bf = `\\frac{${raw(NB)}}{${dB}}`, Cf = `\\frac{${raw(NC)}}{${dC}}`;
  const head = minus ? `ある式から ${$(Bf)} をひくと、${$(Cf)} になった。` : `ある式に ${$(Bf)} をたすと、${$(Cf)} になった。`;
  const steps = [minus ? `ある式は、${$(Cf)} に ${$(Bf)} をたしたもの。` : `ある式は、${$(Cf)} から ${$(Bf)} をひいたもの。`, $(c.chain1), $(c.chain2)];
  const hint = minus ? "「ある式 − ○ ＝ △」から、ある式を求める式を考えよう。通分のとき、ひく分数の分子は、かっこをつけて、どう計算するのだったかな。" : "「ある式 ＋ ○ ＝ △」から、ある式を求める式を考えよう。通分のとき、ひく分数の分子は、かっこをつけて、どう計算するのだったかな。";
  if (mode === "num") {
    const e = pickKey(r, c.num);
    return { q: `${head}ある式を、分母が ${c.L} の 1つの分数にまとめて表す。分子の ${askText(e)}は？`, ans: ansQ(coefOf(c.num, e)), hint, steps };
  }
  const ws = fracWrongs(NC, dC, NB, dB, minus ? "+" : "-");
  const rev = fracCalc(NC, dC, NB, dB, minus ? "-" : "+");              // たす・ひくを逆にしてしまう
  const { ans, choices } = fracChoices(r, { num: c.num, den: c.L }, [{ num: rev.num, den: rev.L }, ...ws]);
  return { q: `${head}ある式はどれか。`, ans, choices, hint, steps };
};

export const UNITS = [
  unit("03", {
    name: "多項式×数・多項式÷数と、分数の形の式",
    desc: "分配法則でかっこをはずす、通分して加減する",
    prereqs: ["J2-sk02", "J2-g2c1u1"],
    points: [
      "多項式に数をかけるときは、分配法則 $m(a+b)=ma+mb$ を使って、かっこの外の数を、かっこの中の全部の項にかける。$-2(x-5y)=-2x+10y$。",
      "多項式を数でわるときは、各項をその数でわるか、わる数の逆数（かけて 1 になる数）をかける。$(12x-18y)\\div 6=2x-3y$。",
      "分数の形の式の加減は、分母の最小公倍数にそろえて（通分して）、1つの分数にまとめる。ひく分数の分子には、かっこをつけて、全部の項の符号を変える。$\\frac{a+2b}{3}-\\frac{a-b}{6}=\\frac{2(a+2b)-(a-b)}{6}$。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 03d01a 数×多項式（4択）
        t("03d01a", (r) => mulBuild(r, "choice", { n: 1, frac: false, k: [-6, 6], c: 6 })),
        // 03d01b 数×多項式（係数）
        t("03d01b", (r) => mulBuild(r, "num", { n: 1, frac: false, k: [-6, 6], c: 6 })),
        // 03d01c 多項式÷数（4択）
        t("03d01c", (r) => divBuild(r, "choice", { k: [-6, 6], c: 6 })),
        // 03d01d 多項式÷数（係数）
        t("03d01d", (r) => divBuild(r, "num", { k: [-6, 6], c: 6 })),
        // 03d01e 分数×多項式（4択）
        t("03d01e", (r) => mulBuild(r, "choice", { n: 1, frac: true, c: 4 })),
        // 03d01f 分数×多項式（係数）
        t("03d01f", (r) => mulBuild(r, "num", { n: 1, frac: true, c: 4 })),
        // 03d02a 数×多項式の加減（4択）
        t("03d02a", (r) => mulBuild(r, "choice", { n: 2, frac: false, k: [-5, 5], c: 5 })),
        // 03d02b 数×多項式の加減（係数）
        t("03d02b", (r) => mulBuild(r, "num", { n: 2, frac: false, k: [-5, 5], c: 5 })),
        // 03q01a −3(2a−5b)（小テスト・4択）
        t("03q01a", (r) => mulBuild(r, "choice", { n: 1, frac: false, k: [-7, -2], c: 6 })),
        // 03q01b −3(2a−5b)（小テスト・係数）
        t("03q01b", (r) => mulBuild(r, "num", { n: 1, frac: false, k: [-7, -2], c: 6 })),
        // 03q02a (15x−10y)÷(−5)（小テスト・4択）
        t("03q02a", (r) => divBuild(r, "choice", { k: [-7, -2], c: 6 })),
        // 03q02b (15x−10y)÷(−5)（小テスト・係数）
        t("03q02b", (r) => divBuild(r, "num", { k: [-7, -2], c: 6 })),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 03d03a 分数の形の式の加減（4択）
        t("03d03a", (r) => fracSumBuild(r, "choice", { dens: DEN_BASIC, ops: ["+", "-"], intfrac: true, c: 5 })),
        // 03d03b 分数の形の式の加減（分子の係数）
        t("03d03b", (r) => fracSumBuild(r, "num", { dens: DEN_BASIC, ops: ["+", "-"], intfrac: true, c: 5 })),
        // 03d04a 分数×多項式の加減（4択）
        t("03d04a", (r) => mulBuild(r, "choice", { n: 2, frac: true, c: 4 })),
        // 03d04b 分数×多項式の加減（係数）
        t("03d04b", (r) => mulBuild(r, "num", { n: 2, frac: true, c: 4 })),
        // 03q03a 4(x+2y)−3(2x−y)（小テスト・4択）
        t("03q03a", (r) => mulBuild(r, "choice", { n: 2, frac: false, k: [-5, 5], c: 4 })),
        // 03q03b 4(x+2y)−3(2x−y)（小テスト・係数）
        t("03q03b", (r) => mulBuild(r, "num", { n: 2, frac: false, k: [-5, 5], c: 4 })),
        // 03q04a (3x+y)/2−(x−y)/3（小テスト・4択）
        t("03q04a", (r) => fracSumBuild(r, "choice", { dens: DEN_BASIC, ops: ["-", "-", "+"], intfrac: false, c: 5 })),
        // 03q04b (3x+y)/2−(x−y)/3（小テスト・分子の係数）
        t("03q04b", (r) => fracSumBuild(r, "num", { dens: DEN_BASIC, ops: ["-", "-", "+"], intfrac: false, c: 5 })),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 03d05a A, B を代入する計算（4択）
        t("03d05a", (r) => abBuild(r, "choice")),
        // 03d05b A, B を代入する計算（係数）
        t("03d05b", (r) => abBuild(r, "num")),
        // 03d06a 通分の計算のまちがいの場所を選ぶ
        t("03d06a", (r) => fracMistakeBuild(r, "where")),
        // 03d06b まちがいを直した、正しい答えの分子の係数
        t("03d06b", (r) => fracMistakeBuild(r, "num")),
        // 03d07a 台形の面積（4択）
        t("03d07a", (r) => trapBuild(r, "choice")),
        // 03d07b 台形の面積（係数）
        t("03d07b", (r) => trapBuild(r, "num")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 03d08a 数×多項式の加減（入試・係数）
        t("03d08a", (r) => mulBuild(r, "num", { n: 2, frac: false, k: [-5, 5], c: 7 })),
        // 03d08b 分数の形の式の加減（入試・4択）
        t("03d08b", (r) => fracSumBuild(r, "choice", { dens: DEN_HARD.concat(DEN_BASIC), ops: ["-", "+"], intfrac: false, c: 7 })),
        // 03d08c 分数×多項式の加減（入試・係数）
        t("03d08c", (r) => mulBuild(r, "num", { n: 2, frac: true, c: 6 })),
        // 03d09a ある式 A を k 倍して…（係数）
        t("03d09a", (r) => kTimesBuild(r, "num")),
        // 03d09b ある式 A を k 倍して…（4択）
        t("03d09b", (r) => kTimesBuild(r, "choice")),
        // 03q05a ある式から ○ をひくと △（チャレンジ・4択）
        t("03q05a", (r) => unknownFracBuild(r, "choice")),
        // 03q05b ある式から ○ をひくと △（チャレンジ・分子の係数）
        t("03q05b", (r) => unknownFracBuild(r, "num")),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第3時は、演習プリント 9問・小テスト 5問のすべてを移した
