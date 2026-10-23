// ============================================================
// shiki-02.js — 式の計算 第2時「文字が2種類でも、同類項をまとめて、たし算・ひき算をしよう」
//   ikkan の演習プリント（shiki-02.dr.1〜10）・小テスト（shiki-02.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「02」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：02d03a ＝ shiki-02.dr.3 の4択、02d03b ＝ 同じ型で係数を聞く数の問い
//   式の答えは入力欄で打てないので、(a) 4択（正解は algebra.js で計算。誤答は「符号を変え忘れる」「同類項でないものをまとめる」など、
//   正解と式として同じにならないもの）と、(b) 答えの式の係数（数）を聞く問い、の2つの型にした。
//   「まちがいを説明する」(dr.7) は「最初にまちがえているところ」を選ぶ4択と、正しく計算した答えの係数を聞く問いにした。
// ============================================================
import { t, pick, choices4, shuffle, fracAns, fracTex, rnz, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, term, poly, padd, psub, pneg, pscale, pisz, peq, ptex } from "../algebra.js";

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
const par = (s) => `(${s})`;
const keyOf = (e) => Object.keys(e).filter((v) => e[v] !== 0).sort().map((v) => v + e[v]).join("");
const expsOf = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
const negT = ([c, e]) => [Array.isArray(c) ? [-c[0], c[1]] : -c, e];
const coefOf = (p, e = {}) => p[keyOf(e)] || Q(0);
const ansQ = (q) => fracAns(q[0], q[1]);
const flipTerm = (p, k) => ({ ...p, [k]: [-p[k][0], p[k][1]] });
const LET2 = [["x", "y"], ["a", "b"], ["m", "n"], ["p", "q"], ["s", "t"]];
const sgnStr = (c) => (c < 0 ? `-${-c}` : `+${c}`);
/** 多項式 → 項の配列 */
const tms = (p) => Object.entries(p).map(([k, c]) => [c, expsOf(k)]);

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

/** 項のかたちの組（shapes）。u,v は文字 */
const SHP = {
  uv: (L) => [{ [L[0]]: 1 }, { [L[1]]: 1 }],
  uvc: (L) => [{ [L[0]]: 1 }, { [L[1]]: 1 }, {}],
  u2u: (L) => [{ [L[0]]: 2 }, { [L[0]]: 1 }],
  u2uc: (L) => [{ [L[0]]: 2 }, { [L[0]]: 1 }, {}],
};
/** 答えの式 p のどの項の係数を聞くか：項 e を選ぶ */
const askText = (e) => (Object.keys(e).length === 0 ? "数だけの項（符号もふくめた数）" : `${$(ptex(term(1, e)))} の係数`);
/** 「答えの □ の係数は？」（数だけの項のときは、間の空白なし） */
const ansAsk = (e, pre = "答えの") => `${pre}${Object.keys(e).length === 0 ? "" : " "}${askText(e)}は？`;
const pickKey = (r, p) => expsOf(pick(r, Object.keys(p)));
/** 数の問い：式 p の、項 e の係数 */
const numAsk = (r, p, lead, hint, steps, pre = "") => {
  const e = pickKey(r, p), tx = askText(e);
  return { q: `${lead}${pre}${pre && tx.startsWith("$") ? " " : ""}${tx}は？`, ans: ansQ(coefOf(p, e)), hint, steps };
};

// ── 同類項をまとめる（dr.1・qz.1）──────────────────────────
/** 同類項が 2組ある 4つの項（shapes は2つ）。どちらの組も、まとめると 0 にならない */
const likeTerms = (r, shapes, lo, hi) => {
  const c1 = rnz(r, lo, hi), c2 = rnz(r, lo, hi);
  let c3, c4;
  do { c3 = rnz(r, lo, hi); } while (c3 === -c1);
  do { c4 = rnz(r, lo, hi); } while (c4 === -c2);
  return shuffle(r, [[c1, shapes[0]], [c2, shapes[1]], [c3, shapes[0]], [c4, shapes[1]]]);
};
/** 同類項のまとめかたを書いた式：(4+2)a+(3-1)b */
const groupForm = (ts) => {
  const keys = [...new Set(ts.map(([, e]) => keyOf(e)))];
  return joinTex(keys.map((k) => {
    const cs = ts.filter(([, e]) => keyOf(e) === k).map(([c]) => c);
    return `(${cs.map((c, i) => (i === 0 ? String(c) : sgnStr(c))).join("")})${ptex(term(1, expsOf(k)))}`;
  }));
};
/** 同類項のまとめ方のまちがい：ちがう文字・次数のものまでまとめる／ひき算にしてしまう／符号 */
const likeWrongs = (ts) => {
  const p = P(ts), keys = [...new Set(ts.map(([, e]) => keyOf(e)))];
  const maxE = {};
  ts.forEach(([, e]) => { for (const v in e) maxE[v] = Math.max(maxE[v] || 0, e[v]); });
  const lump = P([[ts.reduce((a, [c]) => a + c, 0), maxE]]);
  const diff = P(keys.map((k) => { const cs = ts.filter(([, e]) => keyOf(e) === k).map(([c]) => c); return [cs[0] - cs.slice(1).reduce((a, b) => a + b, 0), expsOf(k)]; }));
  return [lump, diff, ...Object.keys(p).map((k) => flipTerm(p, k)), pneg(p)];
};
const likeBuild = (r, mode, shapeKey, lo, hi, lead) => {
  const L = pick(r, LET2), ts = likeTerms(r, SHP[shapeKey](L).slice(0, 2), lo, hi), p = P(ts), ex = raw(ts);
  const steps = ["同じ文字の部分の項（同類項）を、分配法則でまとめる。", `${$(`${ex}=${groupForm(ts)}=${ptex(p)}`)}`];
  const hint = "文字の部分が同じ項どうしを、分配法則でまとめよう（$ma+na=(m+n)a$）。文字の部分がちがう項は、まとめられない。";
  if (mode === "num") return numAsk(r, p, `${$(ex)} を、同類項をまとめて簡単にしたとき、`, hint, steps);
  const { ans, choices } = polyChoices(r, p, likeWrongs(ts));
  return { q: `${$(ex)} を、同類項をまとめて簡単にすると？`, ans, choices, hint, steps };
};

// ── 多項式の加法・減法（dr.2〜4、qz.2〜4）────────────────────
/** 減法 A−B のありがちな誤答：符号を変えずに加える／最初の項だけ変える／最後の項だけ変えない／ひく順がぎゃく */
const subWrongs = (A, B) => {
  const pa = P(A), pb = P(B), res = P(A.concat(B.map(negT)));
  return [
    padd(pa, P([negT(B[0]), ...B.slice(1)])),
    padd(pa, pb),
    padd(pa, P(B.map((b, i) => (i === B.length - 1 ? b : negT(b))))),
    psub(pb, pa),
    ...Object.keys(res).map((k) => flipTerm(res, k)),
  ];
};
const addSubBuild = (r, op, mode, shapeKey, lo, hi, hint0) => {
  const L = pick(r, LET2), sh = SHP[shapeKey](L);
  let A, B, mid, res;
  for (let i = 0; i < 80; i++) {
    A = sh.map((e) => [rnz(r, lo, hi), e]); B = sh.map((e) => [rnz(r, lo, hi), e]);
    mid = op === "+" ? A.concat(B) : A.concat(B.map(negT));
    res = P(mid);
    if (Object.keys(res).length === sh.length) break;    // 同類項をまとめても、どの項もきえない
  }
  const ex = `(${raw(A)})${op}(${raw(B)})`;
  const steps = op === "+"
    ? ["かっこをはずして、同類項をまとめる。", $(`${ex}=${raw(mid)}=${ptex(res)}`)]
    : ["ひく式の各項の符号を変えて、かっこをはずす。", $(`${ex}=${raw(mid)}=${ptex(res)}`)];
  const hint = hint0 || (op === "+" ? "かっこをはずして、同類項をまとめよう。たし算では、かっこの中の符号は変わらない。" : "ひく式のかっこをはずすとき、かっこの中の全部の項の符号を変えよう。");
  if (mode === "num") return numAsk(r, res, `${$(ex)} を計算する。`, hint, steps, "答えの");
  const { ans, choices } = polyChoices(r, res, op === "+" ? likeWrongs(A.concat(B)) : subWrongs(A, B));
  return { q: `${$(ex)} を計算すると？`, ans, choices, hint, steps };
};

// ── 縦に書く計算（dr.5）──────────────────────────────────
const verticalBuild = (r, what) => {
  const L = pick(r, LET2), sh = SHP.uvc(L);
  let A, B, res;
  for (let i = 0; i < 80; i++) {
    A = sh.map((e) => [rnz(r, -9, 9), e]); B = sh.map((e) => [rnz(r, -9, 9), e]);
    res = P(A.concat(B.map(negT)));
    if (Object.keys(res).length === 3) break;
  }
  const ex = `(${raw(A)})-(${raw(B)})`, flipped = B.map(negT), e = pick(r, sh);
  const steps = [`ひく式の各項の符号を変える。${$(`-(${raw(B)})=${raw(flipped)}`)}`, "縦にそろえて、同じ文字の項（数の項）を上から順にたす。", `答えは ${$(`${ex}=${ptex(res)}`)}。`];
  if (what === "flip") {
    return {
      q: `${$(ex)} を、縦に書いて計算する。ひく式の符号を変えた式 ${$(`-(${raw(B)})`)} の、${askText(e)}は？`,
      ans: ansQ(coefOf(P(flipped), e)),
      hint: "ひく式の、すべての項の符号を変える。",
      steps,
    };
  }
  return {
    q: `${$(ex)} を、縦に書いて計算する。${ansAsk(e)}`,
    ans: ansQ(coefOf(res, e)),
    hint: "ひく式の符号を変えた式を、もとの式の下に書いて、同じ文字の項を縦にたそう。",
    steps,
  };
};

// ── 係数が分数（dr.6）────────────────────────────────────
const FRC = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [5, 6]];
const fu = (n, d) => `${n < 0 ? "-" : ""}\\frac{${Math.abs(n)}}{${d}}`;   // 約分しない分数の TeX
const fracBuild = (r, mode) => {
  const L = pick(r, LET2), [u, v] = L;
  const mk = () => { const [n, d] = pick(r, FRC); return [pick(r, [1, -1]) * n, d]; };
  let cs, sums;
  for (let i = 0; i < 80; i++) {
    cs = [mk(), mk(), mk(), mk()];   // A の u・v、B の u・v の係数
    sums = [qadd(Q(...cs[0]), Q(...cs[2])), qadd(Q(...cs[1]), Q(...cs[3]))];
    if (sums.every((q) => q[0] !== 0)) break;
  }
  const A = [[cs[0], { [u]: 1 }], [cs[1], { [v]: 1 }]], B = [[cs[2], { [u]: 1 }], [cs[3], { [v]: 1 }]];
  const res = P([[sums[0], { [u]: 1 }], [sums[1], { [v]: 1 }]]);
  const ex = `(${raw(A)})+(${raw(B)})`;
  const grp = (c, c2) => {
    const L2 = lcm(c[1], c2[1]), a1 = c[0] * (L2 / c[1]), a2 = c2[0] * (L2 / c2[1]), s = qadd(Q(...c), Q(...c2));
    const rest = [fu(c[0], c[1]) + "+" + (c2[0] < 0 ? par(fu(c2[0], c2[1])) : fu(c2[0], c2[1])), fu(a1, L2) + "+" + (a2 < 0 ? par(fu(a2, L2)) : fu(a2, L2)), fu(a1 + a2, L2), fracTex(s[0], s[1])];
    return rest.filter((x, i) => i === 0 || x !== rest[i - 1]).join("=");
  };
  const steps = [`かっこをはずして、同類項の係数どうしを、通分してたす。`, `${$(grp(cs[0], cs[2]))}（${$(u)} の係数）`, `${$(grp(cs[1], cs[3]))}（${$(v)} の係数）`, `${$(`${ex}=${raw(A.concat(B))}=${ptex(res)}`)}`];
  const hint = "同類項の係数どうしを、分母をそろえて（通分して）たそう。";
  if (mode === "num") return numAsk(r, res, `${$(ex)} を計算する。`, hint, steps, "答えの");
  // 4択の誤答：分子どうし・分母どうしをたす／ひき算にする／符号
  const bad = (a, b) => Q(a[0] + b[0], a[1] + b[1]);
  const w1 = P([[bad(cs[0], cs[2]), { [u]: 1 }], [bad(cs[1], cs[3]), { [v]: 1 }]]);
  const w2 = P([[bad(cs[0], cs[2]), { [u]: 1 }], [sums[1], { [v]: 1 }]]);
  const w3 = P([[sums[0], { [u]: 1 }], [bad(cs[1], cs[3]), { [v]: 1 }]]);
  const wrongs = [w1, w2, w3, ...Object.keys(res).map((k) => flipTerm(res, k)), P(A.concat(B.map(negT)))];
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${$(ex)} を計算すると？`, ans, choices, hint, steps };
};

// ── まちがいさがし（dr.7）────────────────────────────────
const mistakeBuild = (r, what) => {
  const L = pick(r, LET2), [u, v] = L, sh = SHP.uv(L);
  let A, B, tt, wrongMid, W, right;
  for (let i = 0; i < 80; i++) {
    A = sh.map((e) => [rnz(r, -9, 9), e]); B = sh.map((e) => [rnz(r, -9, 9), e]); tt = r(0, 1);
    wrongMid = A.concat(B.map((b, j) => (j === tt ? b : negT(b))));    // tt 番目の項の符号だけ、変えていない
    W = P(wrongMid); right = P(A.concat(B.map(negT)));
    if (Object.keys(W).length === 2 && Object.keys(right).length === 2) break;
  }
  const ex = `(${raw(A)})-(${raw(B)})`, line = `${ex}=${raw(wrongMid)}=${ptex(W)}`;
  const steps = [
    `ひく式のかっこをはずすとき、かっこの中の全部の項の符号を変える。${$(`-(${raw(B)})=${raw(B.map(negT))}`)}`,
    `${$(T1(B[tt]))} の符号を変えていないのが、まちがい。`,
    `正しくは ${$(`${ex}=${raw(A.concat(B.map(negT)))}=${ptex(right)}`)}。`,
  ];
  if (what === "where") {
    const sT = T1(B[tt]), sO = T1(B[1 - tt]);
    const ans = `かっこをはずすとき、ひく式の ${$(sT)} の符号を変えていない。`;
    const wrongs = [`かっこをはずすとき、ひく式の ${$(sO)} の符号を変えていない。`, `同類項をまとめるとき、${$(u)} の項の計算をまちがえている。`, `同類項をまとめるとき、${$(v)} の項の計算をまちがえている。`];
    return {
      q: `次の計算には、まちがいがある。${$(line)} 最初にまちがえているところを説明した文として、正しいものはどれか。`,
      ans,
      choices: choices4(r, ans, wrongs),
      hint: "−( ) をはずすとき、かっこの中の全部の項がどうなるか、1つ1つ確かめよう。",
      steps,
    };
  }
  const e = pick(r, sh);
  return {
    q: `次の計算には、まちがいがある。${$(line)} 正しく計算したとき、${ansAsk(e)}`,
    ans: ansQ(coefOf(right, e)),
    hint: "−( ) をはずすとき、かっこの中の全部の項の符号を変えて、計算し直そう。",
    steps,
  };
};

// ── 三角形の周の長さ（dr.8）──────────────────────────────
const sideOf = (r, L, neg) => { const p = r(1, 5); return [[p, { [L[0]]: 1 }], [neg ? -r(1, p) : r(1, 6), { [L[1]]: 1 }]]; };
const perimBuild = (r, mode) => {
  const L = pick(r, LET2), [u, v] = L;
  if (mode === "perim") {
    let S, res, hasNeg;
    for (let i = 0; i < 50; i++) {
      const negIdx = r(0, 2), useNeg = r(0, 1) === 1;
      S = [0, 1, 2].map((j) => sideOf(r, L, useNeg && j === negIdx)); hasNeg = useNeg;
      res = P(S.flat());
      if (Object.keys(res).length === 2) break;
    }
    const sides = S.map((s) => `${$(`(${raw(s)})`)} cm`).join("、"), e = pick(r, [{ [u]: 1 }, { [v]: 1 }]);
    const ex = S.map((s) => `(${raw(s)})`).join("+");
    return {
      q: `3辺の長さが ${sides} の三角形の、周の長さを簡単な式で表す${hasNeg ? `（ただし ${$(`${u}>${v}`)} とする）` : ""}。答えの ${$(ptex(term(1, e)))} の係数は？`,
      ans: ansQ(coefOf(res, e)),
      hint: "周の長さは、3辺の長さの和。かっこをはずして、同類項をまとめよう。",
      steps: ["周の長さは、3辺の長さの和。", `${$(`${ex}=${raw(S.flat())}=${ptex(res)}`)}（cm）`],
    };
  }
  // 周の長さと2辺から、残りの辺
  const S = [0, 1, 2].map(() => [[r(1, 6), { [u]: 1 }], [r(1, 6), { [v]: 1 }]]);
  const total = P(S.flat()), rest = P(S[2]), Lt = ptex(total);
  const sub = `(${Lt})-(${raw(S[0])})-(${raw(S[1])})`, mid = joinTex([Lt, ...S[0].map(negT).map(T1), ...S[1].map(negT).map(T1)]);
  const head = `周の長さが ${$(`(${Lt})`)} cm の三角形がある。2辺の長さが ${$(`(${raw(S[0])})`)} cm と ${$(`(${raw(S[1])})`)} cm のとき、残りの辺の長さを簡単な式で表す。`;
  const steps = ["周から、わかっている 2辺の長さをひく。", `${$(`${sub}=${mid}=${ptex(rest)}`)}（cm）`];
  const hint = "3辺の長さの和が、周の長さ。残りの辺は、どう求められるかな。";
  if (mode === "restNum") {
    const e = pick(r, [{ [u]: 1 }, { [v]: 1 }]);
    return { q: `${head}答えの ${$(ptex(term(1, e)))} の係数は？`, ans: ansQ(coefOf(rest, e)), hint, steps };
  }
  const wrongs = [
    P([...tms(total), ...S[0].map(negT), ...S[1]]),          // 2つめの辺の符号を変えない
    P([...tms(total), ...S[0].map(negT)]),                   // 1辺しかひかない
    P([...tms(total).map(negT), ...S[0], ...S[1]]),          // ひく順がぎゃく
    P([...tms(total), ...S[0], ...S[1]]),                    // たしてしまう
  ];
  const { ans, choices } = polyChoices(r, rest, wrongs);
  return { q: head, ans, choices, hint, steps };
};

// ── ある式から ○ をひくところを、まちがえてたした（dr.9）────────────
const undoBuild = (r, mode) => {
  const L = pick(r, LET2), sh = SHP.uv(L), add = r(0, 1) === 0;    // add：ひくところを、まちがえてたした
  let Y, Wp, Xp, right;
  for (let i = 0; i < 80; i++) {
    Y = sh.map((e) => [rnz(r, -6, 6), e]);
    Wp = P(sh.map((e) => [rnz(r, -9, 9), e]));
    Xp = add ? psub(Wp, P(Y)) : padd(Wp, P(Y));                     // ある式
    right = add ? psub(Xp, P(Y)) : padd(Xp, P(Y));                  // 正しい答え
    if (Object.keys(Xp).length === 2 && !pisz(right)) break;
  }
  const Wt = ptex(Wp), Yt = raw(Y), Xt = ptex(Xp), yp = `(${Yt})`;
  const head = add
    ? `ある式から ${$(Yt)} をひくところを、まちがえてたしてしまったので、答えが ${$(Wt)} になった。`
    : `ある式に ${$(Yt)} をたすところを、まちがえてひいてしまったので、答えが ${$(Wt)} になった。`;
  const negY = Y.map(negT).map(T1), posY = Y.map(T1);
  const steps = add
    ? [`ある式は、答えの ${$(Wt)} から ${$(Yt)} をひいたもの。`, $(`(${Wt})-${yp}=${joinTex([Wt, ...negY])}=${Xt}`), `正しい答えは、ある式から ${$(Yt)} をひいたもの。`, $(`(${Xt})-${yp}=${joinTex([Xt, ...negY])}=${ptex(right)}`)]
    : [`ある式は、答えの ${$(Wt)} に ${$(Yt)} をたしたもの。`, $(`(${Wt})+${yp}=${joinTex([Wt, ...posY])}=${Xt}`), `正しい答えは、ある式に ${$(Yt)} をたしたもの。`, $(`(${Xt})+${yp}=${joinTex([Xt, ...posY])}=${ptex(right)}`)];
  const hint = "まちがえた計算を式で表して、まず「ある式」を求めよう。";
  if (mode === "num") {
    const e = pickKey(r, right);
    return { q: `${head}${ansAsk(e, "正しい答えの")}`, ans: ansQ(coefOf(right, e)), hint, steps };
  }
  const wrongs = [Xp, Wp, add ? padd(Wp, P(Y)) : psub(Wp, P(Y)), pneg(right), add ? padd(Xp, P(Y)) : psub(Xp, P(Y))];
  const { ans, choices } = polyChoices(r, right, wrongs);
  return { q: `${head}正しい答えはどれか。`, ans, choices, hint, steps };
};

// ── 文字の係数を求める（dr.10）───────────────────────────
const unkBuild = (r) => {
  const plus = r(0, 1) === 0, m = plus ? 1 : -1;
  const p = rnz(r, -6, 6), q = rnz(r, -9, 9), rr = rnz(r, -5, 5), s = pick(r, [1, -1]), w = rnz(r, -9, 9);
  let b = 1, tt = 0;
  for (let i = 0; i < 50 && tt === 0; i++) { b = r(1, 9); tt = p + m * s * b; }
  const a = -m * rr;
  const c = (k, body) => (k === 1 ? "" : k === -1 ? "-" : String(k)) + body;
  const first = joinTex(["ax^{2}", c(p, "x"), String(q)]);
  const second = joinTex([c(rr, "x^{2}"), `${s < 0 ? "-" : ""}bx`, String(w)]);
  const ex = `(${first})${plus ? "+" : "-"}(${second})`;
  const ask = pick(r, ["a", "b", "a+b"]), ansV = ask === "a" ? a : ask === "b" ? b : a + b;
  const x2 = `a${plus === (rr < 0) ? "-" : "+"}${Math.abs(rr)}`;      // x^2 の係数：たす a+rr、ひく a−rr
  const x1 = `${p}${m * s > 0 ? "+" : "-"}b`;                            // x の係数：p ± b
  return {
    q: `${$(ex)} が 1次式になり、$x$ の係数が $${tt}$ になるとき、$${ask}$ の値は？`,
    ans: ansV,
    hint: "1次式になるのは、$x^2$ の項がきえるとき。$x^2$ の係数と $x$ の係数を、それぞれ $a$、$b$ を使って表そう。",
    steps: [
      `${plus ? "和" : "差"}の $x^{2}$ の係数は $${x2}$。1次式だから $${x2}=0$ より $a=${a}$。`,
      `${plus ? "和" : "差"}の $x$ の係数は $${x1}$。これが $${tt}$ だから $${x1}=${tt}$ より $b=${b}$。`,
      ask === "a+b" ? `$a+b=${a}${sgnStr(b)}=${ansV}$。` : `求める値は $${ask}=${ansV}$。`,
    ],
  };
};

// ── A, B を代入する計算（qz.5）────────────────────────────
const abBuild = (r) => {
  let A, B, X, Y, inner, res, Xn, Yn, c, d;
  for (let i = 0; i < 80; i++) {
    A = P([[rnz(r, -4, 4), { x: 1 }], [rnz(r, -4, 4), { y: 1 }]]); B = P([[rnz(r, -4, 4), { x: 1 }], [rnz(r, -4, 4), { y: 1 }]]);
    c = r(1, 2); d = r(1, 2);
    [Xn, Yn] = r(0, 1) ? ["A", "B"] : ["B", "A"];
    X = Xn === "A" ? A : B; Y = Xn === "A" ? B : A;
    inner = psub(pscale(Y, d), X); res = psub(pscale(X, c), inner);
    if (!pisz(res)) break;
  }
  const expr = `${c === 1 ? "" : "2"}${Xn}-(${d === 1 ? "" : "2"}${Yn}-${Xn})`;
  const Xt = ptex(X), Yt = ptex(Y);
  const s0 = c === 1 ? `(${Xt})` : `2(${Xt})`;
  const s1 = `${s0}-(${d === 1 ? `(${Yt})` : `2(${Yt})`}-(${Xt}))`, s2 = `${s0}-(${ptex(inner)})`;
  const s3 = joinTex([ptex(pscale(X, c)), ...tms(inner).map(negT).map(T1)]);
  const e = pickKey(r, res);
  return {
    q: `$A=${ptex(A)}$、$B=${ptex(B)}$ のとき、${$(expr)} を計算する。${ansAsk(e)}`,
    ans: ansQ(coefOf(res, e)),
    hint: "$A$、$B$ に式を代入したら、内側のかっこの中から計算しよう。かっこの前の − に注意。",
    steps: [`$A$、$B$ を代入して ${$(`${expr}=${s1}`)}。`, `内側のかっこを先に計算して ${$(`${s1}=${s2}`)}。`, `${$(`${s2}=${s3}=${ptex(res)}`)}。`],
  };
};

export const UNITS = [
  unit("02", {
    name: "同類項と多項式の加法・減法",
    desc: "同類項をまとめる、かっこをはずして加減する",
    prereqs: ["J2-sk01", "J1-v5"],
    points: [
      "文字の部分が同じ項を同類項という。同類項は、分配法則を使って 1つの項にまとめられる。$3a+5a=(3+5)a=8a$。$a$ と $b$、$a^2$ と $a$ のように、文字の部分がちがう項は同類項ではなく、まとめられない。",
      "多項式の加法は、かっこをはずして、同類項をまとめる。$(3a+2b)+(a-5b)=3a+2b+a-5b=4a-3b$。",
      "多項式の減法は、ひく式の各項の符号を変えて、加える。$-(a-2b)=-a+2b$。かっこの中の全部の項の符号を変えるのを、わすれない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 02d01a 同類項をまとめる（4択）
        t("02d01a", (r) => likeBuild(r, "choice", "uv", -9, 9)),
        // 02d01b 同類項をまとめたときの係数
        t("02d01b", (r) => likeBuild(r, "num", "uv", -9, 9)),
        // 02d02a 加法（4択）
        t("02d02a", (r) => addSubBuild(r, "+", "choice", "uv", -9, 9)),
        // 02d02b 加法の答えの係数
        t("02d02b", (r) => addSubBuild(r, "+", "num", "uv", -9, 9)),
        // 02d03a 減法（4択）
        t("02d03a", (r) => addSubBuild(r, "-", "choice", "uv", -9, 9)),
        // 02d03b 減法の答えの係数
        t("02d03b", (r) => addSubBuild(r, "-", "num", "uv", -9, 9)),
        // 02q01a 同類項をまとめる（小テスト・4択）
        t("02q01a", (r) => likeBuild(r, "choice", "uv", -7, 7)),
        // 02q01b 同類項をまとめたときの係数（小テスト）
        t("02q01b", (r) => likeBuild(r, "num", "uv", -7, 7)),
        // 02q02a 加法（小テスト・4択）
        t("02q02a", (r) => addSubBuild(r, "+", "choice", "uv", -8, 8)),
        // 02q02b 加法の答えの係数（小テスト）
        t("02q02b", (r) => addSubBuild(r, "+", "num", "uv", -8, 8)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 02d04a x^2 と x が混じる、同類項のまとめ（4択）
        t("02d04a", (r) => likeBuild(r, "choice", "u2u", -6, 6)),
        // 02d04b 2次の項をふくむ減法（4択）
        t("02d04b", (r) => addSubBuild(r, "-", "choice", "u2uc", -6, 6)),
        // 02d04c 3項の多項式の加法（係数）
        t("02d04c", (r) => addSubBuild(r, "+", "num", "uvc", -6, 6)),
        // 02d05a 縦に書く：ひく式の符号を変えた行
        t("02d05a", (r) => verticalBuild(r, "flip")),
        // 02d05b 縦に書く：答えの係数
        t("02d05b", (r) => verticalBuild(r, "ans")),
        // 02q03a 減法（小テスト・4択）
        t("02q03a", (r) => addSubBuild(r, "-", "choice", "uv", -7, 7)),
        // 02q03b 減法の答えの係数（小テスト）
        t("02q03b", (r) => addSubBuild(r, "-", "num", "uv", -7, 7)),
        // 02q04a 2次の項をふくむ減法（小テスト・4択）
        t("02q04a", (r) => addSubBuild(r, "-", "choice", "u2u", -6, 6)),
        // 02q04b 2次の項をふくむ減法の答えの係数（小テスト）
        t("02q04b", (r) => addSubBuild(r, "-", "num", "u2u", -6, 6)),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 02d06a 係数が分数の加法（係数）
        t("02d06a", (r) => fracBuild(r, "num")),
        // 02d06b 係数が分数の加法（4択）
        t("02d06b", (r) => fracBuild(r, "choice")),
        // 02d07a まちがいの場所を選ぶ
        t("02d07a", (r) => mistakeBuild(r, "where")),
        // 02d07b まちがいを直して、正しい答えの係数
        t("02d07b", (r) => mistakeBuild(r, "num")),
        // 02d08a 三角形の周の長さ
        t("02d08a", (r) => perimBuild(r, "perim")),
        // 02d08b 周と2辺から、残りの辺（係数）
        t("02d08b", (r) => perimBuild(r, "restNum")),
        // 02d08c 周と2辺から、残りの辺（4択）
        t("02d08c", (r) => perimBuild(r, "restChoice")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 02d09a ひくところをまちがえてたした：正しい答えの係数
        t("02d09a", (r) => undoBuild(r, "num")),
        // 02d09b ひくところをまちがえてたした：正しい答え（4択）
        t("02d09b", (r) => undoBuild(r, "choice")),
        // 02d10 1次式になる条件から、文字の係数を求める
        t("02d10", (r) => unkBuild(r)),
        // 02q05 チャレンジ：A, B を代入する
        t("02q05", (r) => abBuild(r)),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第2時は、演習プリント 10問・小テスト 5問のすべてを移した（dr.5 の表は、「ひく式の符号を変えた行」や「答え」の1つの値を聞く形にした）
