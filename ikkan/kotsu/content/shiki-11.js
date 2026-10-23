// ============================================================
// shiki-11.js — 式の計算 第11時「「式の計算」で学んだことを、整理して確かめよう」
//   ikkan の演習プリント（shiki-11.dr.1〜11）・小テスト（shiki-11.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「11」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：11d03b ＝ shiki-11.dr.3 の2つ目（②）、11q02a ＝ shiki-11.qz.2 の1つ目
//   式を答える計算（同類項・かっこ・単項式の乗除・分数の形の加減）は、入力欄では打てないので、4択にした。
//     正解は algebra.js の多項式の計算（padd・pmul・pdivMono など）で出し、誤答は「ありがちな間違い」（かっこの外し忘れ・符号・
//     同類項でないものをまとめる・指数をたさない・÷を逆に使う など）を同じ道具で計算してつくる。正解と式として同じ（peq）になるものは入れない。
//   項・次数・係数・式の値・「□ に入る数」は、数値入力にした。
//   「説明しよう」は、(a) 説明の中の式（和の定数項・変形したあとの式）を数で聞く、(b) 式から言えること（○の倍数・偶数）を4択で聞く、に直した。
//   等式の変形（おうぎ形の弧の長さ・5x−2y＝10）は、数を入れて確かめる4択（公式）と、algebra.js の多項式の4択に分けた。
// ============================================================
import { t, pick, choices4, shuffle, sample, rnz, fracAns, gcd, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qiszero, qeq, qtex, qisint, term, poly, padd, psub, pneg, pscale, pmul, pdivMono, peval, pdeg, pterms, peq, ptex, ptexp } from "../algebra.js";
const unit = unitFor("shiki");
const tx = (s) => `$${s}$`;

// ── 式の表示 ───────────────────────────────────────────────
const expsOf = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
const degOf = (e) => Object.values(e).reduce((a, c) => a + Math.max(0, c), 0);
const sortedKeys = (p, order) => Object.keys(p).sort((a, b) => {
  const ea = expsOf(a), eb = expsOf(b), da = degOf(ea), db = degOf(eb);
  if (da !== db) return db - da;
  const vs = order || [...new Set([...Object.keys(ea), ...Object.keys(eb)])].sort();
  for (const v of vs) { const x = (ea[v] || 0) - (eb[v] || 0); if (x) return -x; }
  return 0;
});
/** 項を keys の順にならべた TeX */
const ptK = (p, keys) => keys.map((k, i) => {
  const c = p[k], neg = c[0] < 0, body = ptex({ [k]: [Math.abs(c[0]), c[1]] });
  return (i === 0 ? (neg ? "-" : "") : neg ? "-" : "+") + body;
}).join("");
/** 先頭がマイナスの項のとき、あとのプラスの項を先頭に出した TeX（9−3y の形） */
const pt = (p, order) => {
  const ks = sortedKeys(p, order);
  if (!ks.length) return "0";
  const i = ks.findIndex((k) => p[k][0] > 0);
  if (i > 0 && p[ks[0]][0] < 0) ks.unshift(ks.splice(i, 1)[0]);
  return ptK(p, ks);
};
/** 分数の係数は、共通の分母の分数にして書く（(5x-10)/2 の形）。pt を使う */
const ftex = (p, pos = false) => {
  const f = pos ? pt : ptex, ks = Object.keys(p);
  if (!ks.length) return "0";
  let L = 1;
  for (const k of ks) L = lcm(L, p[k][1]);
  if (L === 1) return f(p);
  const num = pscale(p, L);
  if (ks.length === 1) { const neg = num[ks[0]][0] < 0; return `${neg ? "-" : ""}\\frac{${f(neg ? pneg(num) : num)}}{${L}}`; }
  return `\\frac{${f(num)}}{${L}}`;
};
/** a の TeX に b の TeX をつないだもの（b がマイナスで始まらなければ + を入れる） */
const catTex = (a, b) => { const s2 = ptex(b); return ptex(a) + (s2[0] === "-" ? "" : "+") + s2; };
/** 項のリスト（単項式の多項式の配列）を、そのままの順に + でつないだ TeX */
const joinTex = (list) => list.map((p, i) => { const s = ptex(p); return i === 0 || s[0] === "-" ? s : `+${s}`; }).join("");
/** 数のかっこ：負の数や分数は \left( \right) で囲む */
const qparen = (q) => (q[0] < 0 ? `\\left(${qtex(q)}\\right)` : qtex(q));
const par = (x) => (x < 0 ? `(${x})` : String(x));
/** 文章用（TeX の外）：負の数は − で書く */
const ms = (x) => (x < 0 ? `−${-x}` : String(x));
const tp = (x) => (x < 0 ? `(−${-x})` : String(x));
/** a n + b */
const lin = (a, b) => ptex(poly([a, { n: 1 }], [b, {}]));
/** 単項式 coef·(文字^指数) の係数を取り出すための、キー */
const keyOf = (exps) => Object.keys(exps).filter((v) => exps[v] !== 0).sort().map((v) => v + exps[v]).join("");
const sumTex = (a, b) => `${a}+${par(b)}`;

/** 4択（式）：正解と誤答の候補から。正解と同じ値になる候補・同じ値どうしの候補は除き、足りなければ係数を少しずらして補う */
const choicePoly = (r, correct, cands, txt = ptex) => {
  const ok = [];
  const push = (w) => { if (w && Object.keys(w).length && !peq(w, correct) && !ok.some((o) => peq(o, w))) ok.push(w); };
  cands.forEach(push);
  const keys = Object.keys(correct);
  for (let i = 0; ok.length < 3 && i < 40; i++) push(padd(correct, { [keys[i % keys.length]]: Q([1, -1, 2, -2][r(0, 3)]) }));
  const ans = tx(txt(correct));
  return { ans, choices: choices4(r, ans, ok.slice(0, 3).map((p) => tx(txt(p)))) };
};

// ── 式の値（11d06・11q03）────────────────────────────────────
/** k1(P1) − k2(P2) と、その代入の解説 */
const valueProblem = (r, { vars, k2Max = 4, intX = false, negs = false }) => {
  const [u, w] = vars;
  for (let i = 0; i < 400; i++) {
    const k1 = r(2, 4), k2 = r(1, k2Max);
    const P1 = poly([rnz(r, -5, 5), { [u]: 1 }], [rnz(r, -5, 5), { [w]: 1 }]);
    const P2 = poly([rnz(r, -6, 6), { [u]: 1 }], [rnz(r, -6, 6), { [w]: 1 }]);
    const S = psub(pscale(P1, k1), pscale(P2, k2));
    if (!S[`${u}1`] || !S[`${w}1`]) continue;
    const xv = intX ? Q(rnz(r, -6, 6)) : pick(r, [Q(1, 2), Q(-1, 2), Q(1, 3), Q(-1, 3), Q(1, 4), Q(-1, 4), Q(3, 2), Q(-3, 2), Q(2, 3), Q(5, 2)]);
    const yv = Q(rnz(r, -6, 6));
    if (negs && xv[0] > 0 && yv[0] > 0) continue;
    const val = peval(S, { [u]: xv, [w]: yv });
    if (!qisint(val) || Math.abs(val[0]) > 40) continue;
    return { k1, k2, P1, P2, S, xv, yv, val: val[0], u, w };
  }
  return null;
};
const exprTex = (k1, P1, k2, P2) => `${k1}(${ptex(P1)})-${k2 === 1 ? "" : k2}(${ptex(P2)})`;
/** 解説：簡単にして、代入 */
const valueSteps = (V) => {
  const { k1, k2, P1, P2, S, xv, yv, u, w } = V;
  const parts = [[S[`${u}1`], xv], [S[`${w}1`], yv]];
  let s1 = "", s2 = "";
  parts.forEach(([c, val], i) => {
    const neg = c[0] < 0, ac = [Math.abs(c[0]), c[1]];
    const body = qeq(ac, Q(1)) ? qparen(val) : `${qtex(ac)}\\times ${qparen(val)}`;
    s1 += (i === 0 ? (neg ? "-" : "") : neg ? "-" : "+") + body;
    const prod = qmul(c, val);
    s2 += i === 0 ? qtex(prod) : prod[0] < 0 ? `-${qtex(qneg(prod))}` : `+${qtex(prod)}`;
  });
  return [
    `式を簡単にする。$${exprTex(k1, P1, k2, P2)}=${catTex(pscale(P1, k1), pneg(pscale(P2, k2)))}=${ptex(S)}$`,
    `$${u}=${qtex(xv)}$、$${w}=${qtex(yv)}$ を代入して、$${s1}=${s2}=${V.val}$`,
  ];
};

// ── 単項式の乗除の材料 ─────────────────────────────────────────
/** 単項式 c·(u^i w^j)：exps は { u: i, w: j } */
const M = (c, exps) => term(c, exps);
const expsList = (m) => expsOf(Object.keys(m)[0]);
const coefOf = (m) => m[Object.keys(m)[0]];
const letterTerm = (v) => term(1, { [v]: 1 });

/** 単項式のかけ算 A×B：共通の文字をもつ2つの単項式。 */
const buildMul = (r) => {
  const [u, w] = pick(r, [["a", "b"], ["x", "y"], ["x", "y"]]);
  for (let i = 0; i < 100; i++) {
    const sub = () => { const k = pick(r, [[u], [w], [u, w], [u, w]]); const e = {}; k.forEach((v) => { e[v] = pick(r, [1, 1, 2]); }); return e; };
    const eA = sub(), eB = sub();
    const shared = Object.keys(eA).filter((v) => v in eB);
    if (!shared.length) continue;
    const c1 = rnz(r, -7, 7), c2 = rnz(r, -7, 7);
    if (Math.abs(c1) < 2 && Math.abs(c2) < 2) continue;
    if (Math.abs(c1 * c2) > 40) continue;
    return { A: M(c1, eA), B: M(c2, eB), eA, eB, shared, c1, c2 };
  }
  return null;
};

// ── 公式の4択（数を入れて確かめる）────────────────────────────
const checkFam = (F) => {
  const vals = {};
  F.vars.forEach((x, i) => { vals[x] = [3.7, 2.3, 5.9, 4.3, 6.1][i % 5]; });
  vals[F.v] = F.f(vals);
  if (Math.abs(F.resid(vals)) > 1e-9) throw new Error(`${F.name}：解が合わない`);
  for (const [, g] of F.wrongs) if (Math.abs(g(vals) - F.f(vals)) < 1e-6) throw new Error(`${F.name}：誤答が正解と同じ値`);
};

export const UNITS = [
  unit("11", {
    name: "「式の計算」の整理と確かめ",
    desc: "単項式・多項式・次数・同類項・式の値・等式の変形・文字式による説明のまとめ",
    prereqs: ["J2-sk10", "J1-v5"],
    points: [
      "乗法だけでできた式を単項式、単項式の和の形の式を多項式という。多項式の1つ1つの単項式を項といい、文字をふくむ項のうち次数がいちばん大きいものの次数が、多項式の次数。単項式の次数は、かけ合わされている文字の個数で、数だけの項（定数項）は次数を考えない。",
      "同類項（文字の部分が同じ項）はまとめられる。かっこをはずすとき、ひく式のかっこの中は、すべての符号がかわる。数とかっこの式は、かっこの中の全部の項に数をかける。",
      "単項式の乗法は、係数どうし、文字どうしをかける。除法は、分数の形にして約分するか、わる式の逆数をかける。文字の式の値は、式を簡単にしてから代入すると、計算しやすい。",
      "等式を、目的に合わせて $x=\\cdots$ の形に変形することを、$x$ について解くという。文字式による説明は、文字でおく → 式を変形する → 式を読む、の順に進める。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 11d01a 多項式の次数・項の数
        t("11d01a", (r) => {
          const [u, w] = pick(r, [["a", "b"], ["x", "y"], ["m", "n"]]);
          const POOL = [{ [u]: 1 }, { [w]: 1 }, { [u]: 2 }, { [w]: 2 }, { [u]: 1, [w]: 1 }, { [u]: 2, [w]: 1 }, { [u]: 1, [w]: 2 }, { [u]: 3 }, { [w]: 3 }, { [u]: 2, [w]: 2 }, { [u]: 3, [w]: 1 }, { [u]: 1, [w]: 3 }];
          let P = {};
          sample(r, POOL, r(3, 4)).forEach((e) => { P = padd(P, term(rnz(r, -9, 9), e)); });
          if (r(0, 4) > 0) P = padd(P, term(rnz(r, -9, 9), {}));
          const keys = shuffle(r, Object.keys(P));
          const expr = ptK(P, keys);
          const ask = pick(r, ["deg", "deg", "terms"]);
          const deg = pdeg(P), nT = pterms(P);
          const line = keys.map((k) => (k === "" ? `$${ptK(P, [k])}$ は数だけの項（次数は考えない）` : `$${ptK(P, [k])}$ は ${degOf(expsOf(k))}次`)).join("、");
          return ask === "deg"
            ? {
              q: `多項式 $${expr}$ は、何次式か。□ 次式の □ は？`,
              ans: deg,
              hint: "それぞれの項の次数（かけ合わされている文字の個数）を調べて、いちばん大きいものを見つけよう。数だけの項は？",
              steps: [`各項の次数を調べる。${line}。`, `いちばん大きい次数は ${deg} だから、${deg}次式。`],
            }
            : {
              q: `多項式 $${expr}$ の項は、全部でいくつあるか。`,
              ans: nT,
              hint: "式を、単項式のたし算の形に直して数えよう。ひき算の項も、符号つきの1つの項。",
              steps: [`項は ${keys.map((k) => `$${ptK(P, [k])}$`).join("、")}。`, `全部で ${nT}つ。`],
            };
        }),
        // 11d01b 単項式の係数・次数
        t("11d01b", (r) => {
          const [u, w] = pick(r, [["a", "b"], ["x", "y"], ["m", "n"]]);
          const E = pick(r, [{ [u]: 2, [w]: 2 }, { [u]: 2, [w]: 1 }, { [u]: 1, [w]: 2 }, { [u]: 3, [w]: 1 }, { [u]: 1, [w]: 1 }, { [u]: 2 }, { [w]: 3 }, { [u]: 3, [w]: 2 }, { [u]: 1, [w]: 3 }]);
          const co = pick(r, [[-5, 6], [3, 4], [-2, 3], [7, 2], [-3, 5], [4, 1], [-6, 1], [5, 1], [-1, 1], [1, 1], [-9, 1], [2, 5], [-8, 3]]);
          const m = term(co, E), deg = degOf(E);
          const letters = ptex(term(1, E));
          if (pick(r, ["coef", "deg"]) === "coef") {
            return {
              q: `単項式 $${ptex(m)}$ の、係数は？`,
              ans: fracAns(co[0], co[1]),
              hint: "係数は、文字にかけてある数。符号も係数の一部。",
              steps: [`単項式は、数と文字の積。$${ptex(m)}=${qparen(Q(...co))}\\times ${letters}$ と書ける。`, `だから、係数は $${qtex(Q(...co))}$。`],
            };
          }
          return {
            q: `単項式 $${ptex(m)}$ の、次数は？`,
            ans: deg,
            hint: "次数は、かけ合わされている文字の個数。同じ文字は、かけた回数だけ数える。",
            steps: [`文字の部分は $${letters}$。`, `文字をかけ合わせた個数は ${Object.values(E).join("+")}＝${deg}。次数は ${deg}。`],
          };
        }),
        // 11d02a 同類項をまとめる（4x²−3x+2x²+8x）
        t("11d02a", (r) => {
          const v = pick(r, ["x", "a", "y", "m"]);
          let c1, c2, c3, c4, c5 = 0, c6 = 0;
          do { c1 = rnz(r, -9, 9); c3 = rnz(r, -9, 9); } while (c1 + c3 === 0);
          do { c2 = rnz(r, -9, 9); c4 = rnz(r, -9, 9); } while (c2 + c4 === 0);
          const withConst = r(0, 2) === 0;
          if (withConst) do { c5 = rnz(r, -9, 9); c6 = rnz(r, -9, 9); } while (c5 + c6 === 0);
          const T2 = (c) => term(c, { [v]: 2 }), T1 = (c) => term(c, { [v]: 1 }), T0 = (c) => term(c, {});
          const items = [T2(c1), T1(c2), T2(c3), T1(c4)].concat(withConst ? [T0(c5), T0(c6)] : []);
          const S2 = c1 + c3, S1 = c2 + c4, S0 = c5 + c6;
          const correct = poly([S2, { [v]: 2 }], [S1, { [v]: 1 }], [S0, {}]);
          const cands = [
            poly([S2, { [v]: 2 }], [c2 - c4, { [v]: 1 }], [S0, {}]),     // 2つめの x の項の符号をまちがえた
            poly([c1 - c3, { [v]: 2 }], [S1, { [v]: 1 }], [S0, {}]),     // x² の項の符号をまちがえた
            poly([S2 + S1, { [v]: 2 }], [S0, {}]),                        // x² と x を同類項としてまとめた
            poly([S2, { [v]: 4 }], [S1, { [v]: 1 }], [S0, {}]),          // x²＋x² を x⁴ とした
            ...(withConst ? [poly([S2, { [v]: 2 }], [S1, { [v]: 1 }], [-S0, {}])] : []),   // 数の項の符号をまちがえた
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
          return {
            q: `次の計算をしよう。 $${joinTex(shuffle(r, items))}$`,
            ans, choices,
            hint: `文字の部分が同じ項（同類項）を見つけて、係数どうしを計算しよう。$${v}^2$ と $${v}$ は同類項かな。`,
            steps: [`同類項どうしをまとめる。$${v}^{2}$ の項どうし、$${v}$ の項どうし${withConst ? "、数どうし" : ""}。`, `$(${sumTex(c1, c3)})${v}^{2}+(${sumTex(c2, c4)})${v}${withConst ? `+(${sumTex(c5, c6)})` : ""}=${ptex(correct)}$`],
          };
        }),
        // 11d02b・11q01a ひく式のかっこをはずす
        t("11d02b", (r) => subBuild(r)),
        // 11d03a −4(2a−3b)
        t("11d03a", (r) => {
          const [u, w] = pick(r, [["a", "b"], ["x", "y"]]);
          const k = pick(r, [-1, -1, 1]) * r(2, 9);
          const p1 = rnz(r, -9, 9), p2 = rnz(r, -9, 9);
          const t1 = term(p1, { [u]: 1 }), t2 = term(p2, { [w]: 1 });
          const P = padd(t1, t2), correct = pscale(P, k);
          const cands = [
            padd(pscale(t1, k), t2),                      // 2つめの項にかけ忘れた
            psub(pscale(t1, k), pscale(t2, k)),           // 2つめの項の符号をまちがえた
            padd(t1, pscale(t2, k)),                      // 1つめの項にかけ忘れた
            pneg(correct),                                // 全部の符号がちがう
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
          return {
            q: `次の計算をしよう。 $${k}(${ptex(P)})$`,
            ans, choices,
            hint: "かっこの外の数は、かっこの中の全部の項にかける。負の数をかけると、符号はどうなる？",
            steps: [`かっこの中の、すべての項に ${ms(k)} をかける。`, `$${k}(${ptex(P)})=${par(k)}\\times ${ptexp(t1)}+${par(k)}\\times ${ptexp(t2)}=${ptex(correct)}$`],
          };
        }),
        // 11d03b (18x−24y)÷(−6)
        t("11d03b", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
          const d = pick(r, [-1, -1, 1]) * r(2, 9);
          const r1 = rnz(r, -9, 9), r2 = rnz(r, -9, 9);
          const t1 = term(r1 * d, { [u]: 1 }), t2 = term(r2 * d, { [w]: 1 });
          const P = padd(t1, t2), q1 = pscale(t1, [1, d]), q2 = pscale(t2, [1, d]), correct = padd(q1, q2);
          const cands = [
            padd(q1, t2),                // 2つめの項をわり忘れた
            psub(q1, q2),                // 2つめの項の符号をまちがえた
            padd(t1, q2),                // 1つめの項をわり忘れた
            padd(pneg(q1), q2),          // 1つめの項の符号をまちがえた
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
          const rec = d < 0 ? `-\\frac{1}{${-d}}` : `\\frac{1}{${d}}`;
          return {
            q: `次の計算をしよう。 $(${ptex(P)})\\div ${d < 0 ? `(${d})` : d}$`,
            ans, choices,
            hint: "わり算は、わる数の逆数をかけるか、分数の形にして、かっこの中の全部の項をわる。",
            steps: [`${ms(d)} でわるのは、逆数 $${rec}$ をかけるのと同じ。`, `$(${ptex(P)})\\times \\left(${rec}\\right)=${ptex(correct)}$`],
          };
        }),
        // 11d03c 分数の形の加減
        t("11d03c", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
          const [d1, d2] = pick(r, [[6, 4], [3, 6], [2, 3], [4, 6], [3, 4], [2, 5], [6, 9], [4, 8], [3, 5]]);
          const minus = r(0, 3) > 0, s2 = minus ? -1 : 1;
          const comb = (a2, b2, sg) => (sg < 0 ? psub(a2, b2) : padd(a2, b2));
          let N1, N2, correct;
          for (let i = 0; i < 200; i++) {
            N1 = poly([rnz(r, -5, 5), { [u]: 1 }], [rnz(r, -5, 5), { [w]: 1 }]);
            N2 = poly([rnz(r, -5, 5), { [u]: 1 }], [rnz(r, -5, 5), { [w]: 1 }]);
            correct = comb(pscale(N1, [1, d1]), pscale(N2, [1, d2]), s2);
            const red = (N, d) => gcd(gcd(Math.abs(N[`${u}1`][0]), Math.abs(N[`${w}1`][0])), d) > 1;
            if (Object.keys(correct).length === 2 && !peq(N1, N2) && !red(N1, d1) && !red(N2, d2)) break;
          }
          const L = lcm(d1, d2), m1 = L / d1, m2 = L / d2;
          const n1 = pscale(N1, m1), n2 = pscale(N2, m2);
          const n2u = pscale(term(N2[`${u}1`], { [u]: 1 }), m2), n2w = pscale(term(N2[`${w}1`], { [w]: 1 }), m2);
          const cands = [
            ...(minus ? [pscale(padd(psub(n1, n2u), n2w), [1, L])] : []),   // 2つめの分子の、2つめの項の符号がかわらなかった
            pscale(comb(N1, N2, s2), [1, L]),                              // 分子に、通分の数をかけ忘れた
            pscale(comb(n1, n2, s2), [1, d1 * d2]),                        // 分母を、最小公倍数ではなく積にした
            pscale(comb(n1, n2, -s2), [1, L]),                             // たす・ひくをまちがえた
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands), ftex);
          const op = minus ? "-" : "+";
          const first = m1 === 1 ? ptex(N1) : `${m1}(${ptex(N1)})`;
          const second = minus ? `-${m2 === 1 ? `(${ptex(N2)})` : `${m2}(${ptex(N2)})`}` : (() => { const x = m2 === 1 ? ptex(N2) : `${m2}(${ptex(N2)})`; return (x[0] === "-" ? "" : "+") + x; })();
          return {
            q: `次の計算をしよう。 $\\frac{${ptex(N1)}}{${d1}}${op}\\frac{${ptex(N2)}}{${d2}}$`,
            ans, choices,
            hint: "分母の最小公倍数で通分する。ひくときは、ひく分数の分子全体に、かっこをつけて符号をかえる。",
            steps: [
              `分母 ${d1} と ${d2} の最小公倍数 ${L} で通分する。$\\frac{${first}${second}}{${L}}$`,
              `$=\\frac{${catTex(n1, minus ? pneg(n2) : n2)}}{${L}}=${ftex(correct)}$`,
            ],
          };
        }),
        // 11q01a (2a−b)−(a−4b)
        t("11q01a", (r) => subBuild(r)),
        // 11q01b 3(2x−y)+2(x+4y)
        t("11q01b", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
          const k1 = r(2, 4), k2 = r(2, 4);
          let P, Q2, correct;
          for (let i = 0; i < 100; i++) {
            P = poly([rnz(r, -5, 5), { [u]: 1 }], [rnz(r, -5, 5), { [w]: 1 }]);
            Q2 = poly([rnz(r, -5, 5), { [u]: 1 }], [rnz(r, -5, 5), { [w]: 1 }]);
            correct = padd(pscale(P, k1), pscale(Q2, k2));
            if (Object.keys(correct).length === 2) break;
          }
          const p1 = term(P[`${u}1`], { [u]: 1 }), p2 = term(P[`${w}1`], { [w]: 1 }), q1 = term(Q2[`${u}1`], { [u]: 1 }), q2 = term(Q2[`${w}1`], { [w]: 1 });
          const cands = [
            padd(pscale(P, k1), padd(pscale(q1, k2), q2)),         // 2つめのかっこの、2つめの項にかけ忘れた
            padd(padd(pscale(p1, k1), p2), pscale(Q2, k2)),        // 1つめのかっこの、2つめの項にかけ忘れた
            padd(pscale(P, k1), Q2),                               // 2つめのかっこに数をかけ忘れた
            psub(pscale(P, k1), pscale(Q2, k2)),                   // ひき算にしてしまった
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
          return {
            q: `次の計算をしよう。 $${k1}(${ptex(P)})+${k2}(${ptex(Q2)})$`,
            ans, choices,
            hint: "かっこの外の数を、かっこの中の全部の項にかけてから、同類項をまとめよう。",
            steps: [`かっこをはずす。$${k1}(${ptex(P)})+${k2}(${ptex(Q2)})=${catTex(pscale(P, k1), pscale(Q2, k2))}$`, `同類項をまとめて、$${ptex(correct)}$。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 11d04a 5ab×(−3a)
        t("11d04a", (r) => mulProblem(r)),
        // 11d04b (−3x)²
        t("11d04b", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
          const c = pick(r, [-1, -1, 1]) * r(2, 6);
          const e = pick(r, [{ [u]: 1 }, { [u]: 1 }, { [u]: 1, [w]: 1 }, { [u]: 2 }, { [w]: 1 }]);
          const base = M(c, e), correct = pmul(base, base);
          const e2 = Object.fromEntries(Object.entries(e).map(([v, n]) => [v, 2 * n]));
          const cands = [
            pneg(correct),                                   // 符号がマイナスになるとまちがえた
            M(c, e2),                                        // 係数を2乗しなかった
            M(2 * c, e2),                                    // 係数を2倍した
            M(c * c, e),                                     // 文字を2乗しなかった
            M(-c * c, e),
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
          return {
            q: `次の計算をしよう。 $(${ptex(base)})^{2}$`,
            ans, choices,
            hint: "$(\\ )^2$ は、かっこの中をそのまま2回かけること。係数にも、文字にも、2乗がかかる。",
            steps: [`$(${ptex(base)})^{2}=(${ptex(base)})\\times (${ptex(base)})$`, `係数は ${tp(c)}×${tp(c)}＝${c * c}、文字は $${ptex(term(1, e))}$ を2回かけて $${ptex(term(1, e2))}$。`, `答え　$${ptex(correct)}$`],
          };
        }),
        // 11d04c・11q02b 14xy²÷(−7/2 y)
        t("11d04c", (r) => divProblem(r)),
        // 11d05a 10x²×3y÷6xy
        t("11d05a", (r) => {
          for (let tries = 0; tries < 300; tries++) {
            const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
            const Re = { [u]: r(0, 2), [w]: r(0, 2) };
            if (!Re[u] && !Re[w]) continue;
            const Ce = { [u]: r(0, 1), [w]: r(0, 1) };
            if (!Ce[u] && !Ce[w]) continue;
            const rc = r(1, 9), cc = r(2, 6), pc = rc * cc;
            if (pc > 60) continue;
            const divs = [];
            for (let d = 2; d <= pc; d++) if (pc % d === 0 && pc / d >= 2) divs.push(d);
            if (!divs.length) continue;
            const ac = pick(r, divs), bc = pc / ac;
            const Pe = { [u]: Re[u] + Ce[u], [w]: Re[w] + Ce[w] };
            const Ae = { [u]: r(0, Pe[u]), [w]: r(0, Pe[w]) }, Be = { [u]: Pe[u] - Ae[u], [w]: Pe[w] - Ae[w] };
            const hasL = (e) => Object.values(e).some((n) => n > 0);
            if (!hasL(Ae) || !hasL(Be)) continue;
            const A = M(ac, Ae), B = M(bc, Be), C = M(cc, Ce), R = M(rc, Re);
            if (peq(B, C) || peq(A, C)) continue;
            const correct = pdivMono(pmul(A, B), C);
            if (!peq(correct, R)) throw new Error("積と商が合わない");
            const Cl = Object.keys(Ce).filter((v) => Ce[v] > 0);
            const v = pick(r, Cl);
            const cands = [
              M(ac * bc * cc, Re),                                  // わらずに、かけてしまった
              pmul(R, letterTerm(v)),                               // 文字が1つ約分されずに残った
              M(ac + bc - cc, Re),                                  // 係数をたし引きした
              pdivMono(R, letterTerm(v)),                           // 文字を余分に約分した
            ];
            const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
            return {
              q: `次の計算をしよう。 $${ptex(A)}\\times ${ptex(B)}\\div ${ptex(C)}$`,
              ans, choices,
              hint: "乗除の混じった計算は、すべてを1つの分数にして、係数と文字を約分しよう。",
              steps: [`分数の形にする。$${ptex(A)}\\times ${ptex(B)}\\div ${ptex(C)}=\\frac{${ptex(A)}\\times ${ptex(B)}}{${ptex(C)}}=\\frac{${ptex(pmul(A, B))}}{${ptex(C)}}$`, `約分して、$${ptex(correct)}$。`],
            };
          }
          return { skip: true };
        }),
        // 11d05b 12a²b÷(−4ab)×2a
        t("11d05b", (r) => {
          for (let tries = 0; tries < 300; tries++) {
            const [u, w] = pick(r, [["a", "b"], ["x", "y"]]);
            const Re = { [u]: r(1, 2), [w]: r(0, 1) };
            const Be = { [u]: r(0, 1), [w]: r(0, 1) };
            if (!Be[u] && !Be[w]) continue;
            const rc = r(2, 9), bc = r(2, 6), pc = rc * bc;
            const divs = [];
            for (let d = 2; d <= 6; d++) if (pc % d === 0 && pc / d >= 2) divs.push(d);
            if (!divs.length || pc > 60) continue;
            const cc = pick(r, divs), ac = pc / cc;
            const Pe = { [u]: Re[u] + Be[u], [w]: Re[w] + Be[w] };
            const Ce = { [u]: r(0, Math.min(1, Pe[u])), [w]: r(0, Math.min(1, Pe[w])) };
            if (!Ce[u] && !Ce[w]) continue;
            const Ae = { [u]: Pe[u] - Ce[u], [w]: Pe[w] - Ce[w] };
            if (!Ae[u] && !Ae[w]) continue;
            const A = M(ac, Ae), B = M(-bc, Be), C = M(cc, Ce), R = M(-rc, Re);
            if (peq(A, pneg(B)) || peq(C, pneg(B)) || peq(A, C)) continue;
            const correct = pmul(pdivMono(A, B), C);
            if (!peq(correct, R)) throw new Error("積と商が合わない");
            const lv = Object.keys(Ae).filter((v) => Ae[v] > 0 || Re[v] > 0);
            const v = pick(r, lv);
            const cands = [
              pdivMono(A, pmul(B, C)),                              // ÷B×C を ÷(B×C) としてしまった
              pneg(correct),                                        // 符号をまちがえた
              pmul(R, letterTerm(v)),                               // 文字が約分されずに残った
              pdivMono(R, letterTerm(v)),                           // 文字を余分に約分した
            ];
            const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
            return {
              q: `次の計算をしよう。 $${ptex(A)}\\div (${ptex(B)})\\times ${ptex(C)}$`,
              ans, choices,
              hint: "乗除の混じった計算は、左から順に、わる数は逆数にしてかけるか、1つの分数にして約分しよう。÷ の後ろにある × の数は、分母と分子のどちらに入るかな。",
              steps: [`分数の形にする。$${ptex(A)}\\div (${ptex(B)})\\times ${ptex(C)}=\\frac{${ptex(A)}\\times ${ptex(C)}}{${ptex(B)}}=\\frac{${ptex(pmul(A, C))}}{${ptex(B)}}$`, `約分して、$${ptex(correct)}$。`],
            };
          }
          return { skip: true };
        }),
        // 11d06 x＝1/2、y＝−2 のとき 3(4x−y)−2(5x−3y) の値
        t("11d06", (r) => {
          const V = valueProblem(r, { vars: ["x", "y"] });
          if (!V) return { skip: true };
          return {
            q: `$x=${qtex(V.xv)}$、$y=${qtex(V.yv)}$ のとき、$${exprTex(V.k1, V.P1, V.k2, V.P2)}$ の値は？`,
            ans: V.val,
            hint: "先に、かっこをはずして同類項をまとめ、式を簡単にしてから、数を代入しよう。",
            steps: valueSteps(V),
          };
        }),
        // 11q02a 7x×(−2xy)
        t("11q02a", (r) => mulProblem(r)),
        // 11q02b 10ab²÷(−5/2 b)
        t("11q02b", (r) => divProblem(r)),
        // 11q03 a＝−5、b＝−2 のとき 4(a−3b)−(3a−7b) の値
        t("11q03", (r) => {
          const V = valueProblem(r, { vars: ["a", "b"], k2Max: 1, intX: true, negs: true });
          if (!V) return { skip: true };
          return {
            q: `$a=${qtex(V.xv)}$、$b=${qtex(V.yv)}$ のとき、$${exprTex(V.k1, V.P1, V.k2, V.P2)}$ の値は？`,
            ans: V.val,
            hint: "先に、かっこをはずして同類項をまとめ、式を簡単にしてから、負の数はかっこをつけて代入しよう。",
            steps: valueSteps(V),
          };
        }),
        // 11q04a 5x−2y＝10 を y について解く
        t("11q04a", (r) => {
          const E = eqPair(r);
          const correct = E.sol;
          const cands = [
            E.wrong1, E.wrong2, E.wrong3, E.wrong4,
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands), (p) => `y=${ftex(p, true)}`);
          return {
            q: `等式 $${E.eq}$ を、$y$ について解くと？`,
            ans, choices,
            hint: "$y$ をふくむ項を左辺に残し、ほかの項を移項する。$y$ にかかっている数で、両辺の全部をわるとき、符号はどうなる？",
            steps: [`$y$ をふくむ項を左辺に残して移項すると、$${E.step1}$。`, `両辺を $-${E.beta}$ でわって、$y=\\frac{${E.gamma}-${E.alpha}x}{-${E.beta}}=${ftex(correct, true)}$。`],
          };
        }),
        // 11q04b 5x−2y＝10 で x＝4 のときの y の値
        t("11q04b", (r) => {
          const E = eqPair(r, true);
          return {
            q: `等式 $${E.eq}$ で、$x=${E.xv}$ のとき、$y$ の値は？`,
            ans: E.yv,
            hint: "$y$ について解いた式をつくって、$x$ の値を入れよう。（先に $x$ の値を入れて、$y$ の方程式として解いてもよい）",
            steps: [`$y$ について解くと、$y=\\frac{${E.alpha}x-${E.gamma}}{${E.beta}}$。`, `$x=${E.xv}$ を代入して、$y=\\frac{${E.alpha}\\times ${E.xv}-${E.gamma}}{${E.beta}}=\\frac{${E.alpha * E.xv - E.gamma}}{${E.beta}}=${E.yv}$`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 11d07a 連続する整数・奇数・偶数の和：Mn＋□
        t("11d07a", (r) => {
          const F = pick(r, CONSEC), S = F.sum();
          const wr = (p) => (pterms(p) > 1 ? `(${ptex(p)})` : ptex(p));
          return {
            q: `$n$ を整数とする。${F.name}のうち、いちばん小さい数を $${ptex(F.terms[0])}$ とすると、${F.terms.length}つの数の和は $${ptex(poly([S["n1"][0], { n: 1 }]))}+\\square$ と表される。□は？`,
            ans: S[""][0],
            hint: `${F.terms.length}つの数を、それぞれ $n$ を使って表してから、たそう。`,
            steps: [`${F.terms.length}つの数は ${F.terms.map((p) => `$${ptex(p)}$`).join("、")}。`, `和は $${F.terms.map(wr).join("+")}=${ptex(S)}$。`],
          };
        }),
        // 11d07b 和を変形した式から言えること（K の倍数）
        t("11d07b", (r) => {
          const F = pick(r, CONSEC), S = F.sum(), K = F.K();
          const Qp = pscale(S, [1, K]);
          const divK = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12].filter((m) => K % m !== 0);
          const ans = `${K} の倍数になる`;
          return {
            q: `$n$ を整数とする。${F.name}の和は、$${ptex(S)}=${K}(${ptex(Qp)})$ と変形できる。このことから、いつも言えることはどれか。`,
            ans,
            choices: choices4(r, ans, sample(r, divK, 3).map((m) => `${m} の倍数になる`)),
            hint: "式を $\\square\\times $（整数）の形に変形すると、□ の倍数であることが言える。かっこの中は、整数になるかな。",
            steps: [`$n$ が整数なら、$${ptex(Qp)}$ も整数。`, `和は ${K}×（整数）の形だから、${K} の倍数になる。`],
          };
        }),
        // 11d08a 奇数を3倍して1を加えた数：6n＋□
        t("11d08a", (r) => {
          const { k, c, up } = oddPick(r);
          const body = 2 * k, m = k + (up ? c : -c);
          return {
            q: `$n$ を整数とすると、奇数は $2n+1$ と表される。奇数を ${k}倍して ${c} を${up ? "加え" : "ひい"}た数は、$${body}n+\\square$ と表される。□は？`,
            ans: m,
            hint: "奇数を $2n+1$ とおいて、式にしてから、かっこをはずそう。",
            steps: [`式にすると $${k}(2n+1)${up ? "+" : "-"}${c}$。`, `かっこをはずして $${body}n+${k}${up ? "+" : "-"}${c}=${lin(body, m)}$。`, `□ は ${m}。`],
          };
        }),
        // 11d08b 変形した式から言えること（偶数・奇数）
        t("11d08b", (r) => {
          const { k, c, up } = oddPick(r);
          const body = 2 * k, m = k + (up ? c : -c), even = m % 2 === 0;
          const half = even ? m / 2 : (m - 1) / 2;
          const form = even ? `2(${ptex(poly([k, { n: 1 }], [half, {}]))})` : `2(${ptex(poly([k, { n: 1 }], [half, {}]))})+1`;
          const ans = even ? "いつも偶数になる" : "いつも奇数になる";
          return {
            q: `$n$ を整数とする。奇数 $2n+1$ を ${k}倍して ${c} を${up ? "加え" : "ひい"}た数は、$${lin(body, m)}=${form}$ と変形できる。このことから、いつも言えることはどれか。`,
            ans,
            choices: choices4(r, ans, [even ? "いつも奇数になる" : "いつも偶数になる", "偶数にも奇数にもなる", "いつも 4 の倍数になる"]),
            hint: "$2\\times $（整数）の形は偶数、$2\\times $（整数）$+1$ の形は奇数。かっこの中は整数になるかな。",
            steps: [`$n$ が整数なら、$${ptex(poly([k, { n: 1 }], [half, {}]))}$ も整数。`, even ? "2×（整数）の形だから、いつも偶数になる。" : "2×（整数）に 1 をたした形だから、いつも奇数になる。"],
          };
        }),
        // 11d09a おうぎ形の弧の長さ ℓ＝2πr×a/360 を a について解く
        t("11d09a", (r) => {
          const F = pick(r, SECTOR);
          checkFam(F);
          const ans = tx(F.ans);
          return {
            q: `${F.stmt}$${F.eq}$ と表される。この等式を、$${F.v}$ について解くと？`,
            ans,
            choices: choices4(r, ans, shuffle(r, F.wrongs).slice(0, 3).map(([s]) => tx(s))),
            hint: "まず、両辺に 360 をかけて分母をはらおう。そのあと、解く文字にかかっているものの全部で、両辺をわる。",
            steps: F.steps,
          };
        }),
        // 11d09b r＝6、ℓ＝4π のときの a の値
        t("11d09b", (r) => {
          const { a, rad, k } = pick(r, SECTOR_NUM);
          return {
            q: `おうぎ形の弧の長さ $\\ell$ は、半径 $r$、中心角 $a^\\circ$ のとき、$\\ell=2\\pi r\\times \\frac{a}{360}$ と表される。$r=${rad}$、$\\ell=${kp(k)}$ のとき、$a$ の値は？（$r$、$\\ell$ の単位は cm）`,
            ans: a, unit: "度",
            hint: "$a$ について解いた式をつくって、$r$ と $\\ell$ の値を代入しよう。$\\pi$ は約分される。",
            steps: ["$\\ell=2\\pi r\\times \\frac{a}{360}$ を $a$ について解くと、$a=\\frac{180\\ell}{\\pi r}$。", `$r=${rad}$、$\\ell=${kp(k)}$ を代入して、$a=\\frac{180\\times ${kp(k)}}{\\pi\\times ${rad}}=\\frac{${180 * k}}{${rad}}=${a}$（度）`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 11d10a カレンダーで縦に並んだ k個の数の和：kn＋□
        t("11d10a", (r) => {
          const k = pick(r, [3, 4, 4, 5]), c = (7 * k * (k - 1)) / 2;
          const start = r(1, 31 - 7 * (k - 1));
          const ex = Array.from({ length: k }, (_, i) => start + 7 * i).join("、");
          return {
            q: `カレンダーで、縦に並んだ${k}つの数（例：${ex}）のうち、いちばん上の数を $n$（整数）とする。${k}つの数の和は $${k}n+\\square$ と表される。□は？`,
            ans: c,
            hint: `縦に並んだ数は、1段下がるごとに 7 ずつ大きくなる。${k}つの数を $n$ の式で表して、たそう。`,
            steps: [`${k}つの数は ${Array.from({ length: k }, (_, i) => `$${lin(1, 7 * i)}$`).join("、")}。`, `和は $${k}n+(${Array.from({ length: k }, (_, i) => 7 * i).join("+")})=${k}n+${c}$。`],
          };
        }),
        // 11d10b 縦に並んだ数の和が S のとき、ある位置の数
        t("11d10b", (r) => {
          const k = pick(r, [3, 4, 4, 5]), c = (7 * k * (k - 1)) / 2;
          const n = r(1, Math.min(14, 31 - 7 * (k - 1))), S = k * n + c;
          const [nm, o] = pick(r, [["いちばん上の数", 0], ["いちばん下の数", 7 * (k - 1)], ["上から2番目の数", 7]]);
          return {
            q: `カレンダーで、縦に並んだ${k}つの数の和が ${S} のとき、${nm}は？`,
            ans: n + o,
            hint: "いちばん上の数を $n$ とおいて、和を $n$ の式で表し、等式にしよう。",
            steps: [`いちばん上の数を $n$ とすると、${k}つの数の和は $${k}n+${c}$。`, `$${k}n+${c}=${S}$ より $n=${n}$。`, `${nm}は $${lin(1, o)}$ だから、${n + o}。`],
          };
        }),
        // 11d11 x−2y＝3 のとき 4x−8y+7 の値
        t("11d11", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
          const p = pick(r, [1, 1, 2, 3]), qq = pick(r, [-1, -2, -3, 1, 2]), m = pick(r, [2, 3, 4, 5, -2, -3]), c = rnz(r, -9, 9), s = r(-6, 9);
          if (gcd(p, qq) !== 1 || Math.abs(m * s + c) > 60) return { skip: true };
          const given = poly([p, { [u]: 1 }], [qq, { [w]: 1 }]), E = padd(pscale(given, m), term(c, {}));
          return {
            q: `$${ptex(given)}=${s}$ のとき、$${ptex(E)}$ の値は？`,
            ans: m * s + c,
            hint: `求める式をよく見よう。$${ptex(given)}$ をひとまとまりとして使えないかな。（$${u}$ について解いて代入してもよい）`,
            steps: [`$${ptex(E)}=${m}(${ptex(given)})${c < 0 ? "-" : "+"}${Math.abs(c)}$ と変形できる。`, `$${ptex(given)}=${s}$ を代入して、$${m}\\times ${par(s)}${c < 0 ? "-" : "+"}${Math.abs(c)}=${m * s}${c < 0 ? "-" : "+"}${Math.abs(c)}=${m * s + c}$`],
          };
        }),
        // 11q05a 数当て：いつも同じ数になる
        t("11q05a", (r) => {
          const D = digit(r);
          return {
            q: `好きな整数を思いうかべて、次の順に計算する。① ${D.k} を加える　② ${D.m}倍する　③ ${D.j} をひく　④ ${D.m} でわる　⑤ 思いうかべた整数をひく　どんな整数を思いうかべても、答えはいつも同じ数になる。その数は？`,
            ans: D.k - D.j / D.m,
            hint: "思いうかべた整数を $n$ として、①〜⑤の計算を順に式にしよう。最後に $n$ が消える。",
            steps: D.steps,
          };
        }),
        // 11q05b 数当て：途中までの式（3倍して6をひく）
        t("11q05b", (r) => {
          const D = digit(r);
          const correct = poly([D.m, { n: 1 }], [D.k * D.m - D.j, {}]);
          const cands = [
            poly([1, { n: 1 }], [D.k * D.m - D.j, {}]),          // n に m をかけ忘れた
            poly([D.m, { n: 1 }], [D.k - D.j, {}]),              // k に m をかけ忘れた
            poly([D.m, { n: 1 }], [D.k * D.m + D.j, {}]),        // ひくところを、たしてしまった
            poly([D.m, { n: 1 }], [D.k * D.m - D.j - D.m, {}]),  // 計算ミス（m 少ない）
          ];
          const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
          return {
            q: `好きな整数 $n$ を思いうかべて、① ${D.k} を加える　② ${D.m}倍する　③ ${D.j} をひく、の順に計算する。③ の結果を $n$ を使って、かっこのない式で表すと？`,
            ans, choices,
            hint: "① は、$n$ に数をたした式。② では、かっこ全体に数をかけるので、かっこをはずすとき、全部の項にかける。",
            steps: [`① $n+${D.k}$　② $${D.m}(n+${D.k})$　③ $${D.m}(n+${D.k})-${D.j}$`, `かっこをはずして、$${D.m}n+${D.m * D.k}-${D.j}=${ptex(correct)}$。`],
          };
        }),
      ],
    },
  }),
];

// ── ひく式のかっこ（11d02b・11q01a）───────────────────────────
function subBuild(r) {
  const [u, w] = pick(r, [["a", "b"], ["x", "y"]]);
  let P, Qp, correct;
  for (let i = 0; i < 200; i++) {
    P = poly([rnz(r, -6, 6), { [u]: 1 }], [rnz(r, -6, 6), { [w]: 1 }]);
    Qp = poly([rnz(r, -6, 6), { [u]: 1 }], [rnz(r, -6, 6), { [w]: 1 }]);
    correct = psub(P, Qp);
    if (Object.keys(correct).length === 2 && Object.keys(Qp).length === 2 && Object.keys(P).length === 2) break;
  }
  const q1 = term(Qp[`${u}1`], { [u]: 1 }), q2 = term(Qp[`${w}1`], { [w]: 1 });
  const cands = [
    padd(psub(P, q1), q2),            // 2つめの項の符号をかえ忘れた
    padd(P, Qp),                      // たし算にしてしまった
    psub(Qp, P),                      // 引く順をまちがえた
    padd(padd(P, q1), pneg(q2)),      // 1つめの項の符号を、まちがえてかえた
  ];
  const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
  return {
    q: `次の計算をしよう。 $(${ptex(P)})-(${ptex(Qp)})$`,
    ans, choices,
    hint: "ひく式のかっこをはずすとき、かっこの中の符号は、すべてどうなる？ そのあと、同類項をまとめる。",
    steps: [`ひくかっこの中は、すべての項の符号がかわる。$(${ptex(P)})-(${ptex(Qp)})=${catTex(P, pneg(Qp))}$`, `同類項をまとめて、$${ptex(correct)}$。`],
  };
}

// ── 単項式のかけ算（11d04a・11q02a）──────────────────────────
function mulProblem(r) {
  const D = buildMul(r);
  if (!D) return { skip: true };
  const { A, B, eA, eB, shared, c1, c2 } = D;
  const correct = pmul(A, B), eP = expsList(correct);
  const ePwrong = { ...eP };
  shared.forEach((v) => { const a = eA[v], b = eB[v]; ePwrong[v] = a * b === a + b ? Math.max(a, b) : a * b; });
  const onlyOne = Object.keys(eP).filter((v) => !shared.includes(v));
  const eDrop = Object.fromEntries(Object.entries(eP).filter(([v]) => shared.includes(v)));
  const cands = [
    M(c1 * c2, ePwrong),                          // 指数をたさなかった
    M(c1 + c2, eP),                               // 係数をたしてしまった
    pneg(correct),                                // 符号をまちがえた
    ...(onlyOne.length ? [M(c1 * c2, eDrop)] : []),   // 共通でない文字を落とした
  ];
  const { ans, choices } = choicePoly(r, correct, shuffle(r, cands));
  const sh = shared[0];
  return {
    q: `次の計算をしよう。 $${ptex(A)}\\times ${ptexp(B)}$`,
    ans, choices,
    hint: "係数どうし、文字どうしをかける。同じ文字をかけると、指数はどうなる？",
    steps: [`係数は ${tp(c1)}×${tp(c2)}＝${ms(c1 * c2)}。`, `文字は、$${sh}$ が ${eA[sh]}個と ${eB[sh]}個で ${eA[sh] + eB[sh]}個（$${sh}^{${eA[sh] + eB[sh]}}$）。ほかの文字もそのまま書く。`, `答え　$${ptex(correct)}$`],
  };
}

// ── 単項式のわり算（11d04c・11q02b）──────────────────────────
function divProblem(r) {
  const [u, w] = pick(r, [["x", "y"], ["a", "b"]]);
  const [p, q] = pick(r, [[7, 2], [5, 2], [3, 2], [5, 3], [7, 3], [3, 4], [5, 4], [1, 2], [1, 3]]);
  const k = r(1, Math.max(1, Math.floor(12 / q)));
  const sg = pick(r, [-1, -1, -1, 1]), rs = pick(r, [-1, 1]);
  const Re = { [u]: r(1, 2), [w]: r(0, 1) }, De = { [w]: 1 };
  const Dc = [sg * p, q], Rc = rs * q * k;
  const Dm = term(Dc, De), R = M(Rc, Re);
  const A = pmul(R, Dm);
  const correct = pdivMono(A, Dm);
  if (!peq(correct, R)) throw new Error("商が合わない");
  const Ac = coefOf(A);
  if (!qisint(Ac)) return { skip: true };
  const cands = [
    pmul(A, Dm),                                    // 逆数をかけずに、そのままかけた
    M(Rc / q, Re),                                  // 分母の数を落とした（分子だけでわった）
    pneg(R),                                        // 符号をまちがえた
    pmul(R, letterTerm(w)),                         // 文字が約分されずに残った
  ];
  const { ans, choices } = choicePoly(r, R, shuffle(r, cands));
  const recip = pdivMono(poly([1, {}]), Dm);
  return {
    q: `次の計算をしよう。 $${ptex(A)}\\div \\left(${ptex(Dm)}\\right)$`,
    ans, choices,
    hint: "分数でわるときは、わる式の逆数をかける。わる式が文字をふくむときは、その逆数も分数の形になる。",
    steps: [`わる式 $${ptex(Dm)}$ の逆数は $${ptex(recip)}$。`, `$${ptex(A)}\\times \\left(${ptex(recip)}\\right)=${ptex(R)}$`],
  };
}

// ── 5x−2y＝10 を y について解く（11q04）───────────────────────
function eqPair(r, forValue) {
  for (let i = 0; i < 400; i++) {
    const alpha = r(2, 7), beta = r(2, 5), gamma = r(4, 20);
    const xv = r(1, 8);
    if (forValue && (alpha * xv - gamma) % beta !== 0) continue;
    const yv = (alpha * xv - gamma) / beta;
    if (forValue && (yv === 0 || Math.abs(yv) > 12)) continue;
    // α x − β y ＝ γ  →  y ＝ (α x − γ)/β
    const sol = poly([[alpha, beta], { x: 1 }], [[-gamma, beta], {}]);
    if (!forValue && (alpha % beta === 0 || gamma % beta === 0)) continue;
    return {
      alpha, beta, gamma, xv, yv, sol,
      eq: `${alpha}x-${beta}y=${gamma}`,
      step1: `-${beta}y=${gamma}-${alpha}x`,
      wrong1: poly([[-alpha, beta], { x: 1 }], [[gamma, beta], {}]),         // 符号をかえ忘れた（(10−5x)/2）
      wrong2: poly([alpha, { x: 1 }], [-gamma, {}]),                           // わらなかった
      wrong3: poly([[alpha, beta], { x: 1 }], [-gamma, {}]),                   // 一部の項だけをわった
      wrong4: poly([[alpha, beta], { x: 1 }], [[gamma, beta], {}]),            // 移項の符号をまちがえた
    };
  }
  throw new Error("eqPair");
}

// ── 連続する整数・奇数・偶数（11d07）──────────────────────────
const CONSEC = [];
const mkSeq = (name, terms) => CONSEC.push({ name, terms, sum: () => terms.reduce((a, b) => padd(a, b), {}), K: () => { const S = terms.reduce((a, b) => padd(a, b), {}); return Object.values(S).reduce((g, c) => gcd(g, c[0]), 0); } });
const L1 = (a, b) => poly([a, { n: 1 }], [b, {}]);
mkSeq("連続する3つの奇数", [L1(2, 1), L1(2, 3), L1(2, 5)]);
mkSeq("連続する3つの偶数", [L1(2, 0), L1(2, 2), L1(2, 4)]);
mkSeq("連続する3つの整数", [L1(1, 0), L1(1, 1), L1(1, 2)]);
mkSeq("連続する5つの整数", [L1(1, 0), L1(1, 1), L1(1, 2), L1(1, 3), L1(1, 4)]);
mkSeq("連続する2つの奇数", [L1(2, 1), L1(2, 3)]);
mkSeq("連続する4つの偶数", [L1(2, 0), L1(2, 2), L1(2, 4), L1(2, 6)]);
mkSeq("連続する5つの奇数", [L1(2, 1), L1(2, 3), L1(2, 5), L1(2, 7), L1(2, 9)]);

// ── 奇数を k倍して c を加える・ひく（11d08）────────────────────
const oddPick = (r) => {
  for (let i = 0; i < 100; i++) {
    const k = pick(r, [3, 3, 5, 7]), c = pick(r, [1, 1, 2, 3, 4, 5]), up = r(0, 3) > 0;
    const m = k + (up ? c : -c);
    if (m > 0) return { k, c, up };
  }
  return { k: 3, c: 1, up: true };
};

// ── おうぎ形の公式（11d09）─────────────────────────────────
const SECTOR = [
  {
    name: "弧の長さ→a", stmt: "おうぎ形の弧の長さ $\\ell$ は、半径 $r$、中心角 $a^\\circ$ のとき、", eq: "\\ell=2\\pi r\\times \\frac{a}{360}", v: "a", vars: ["l", "r", "a"],
    resid: (x) => x.l - 2 * Math.PI * x.r * (x.a / 360), f: (x) => (360 * x.l) / (2 * Math.PI * x.r),
    ans: "a=\\frac{180\\ell}{\\pi r}",
    wrongs: [["a=\\frac{\\ell}{720\\pi r}", (x) => x.l / (720 * Math.PI * x.r)], ["a=\\frac{720\\pi r}{\\ell}", (x) => (720 * Math.PI * x.r) / x.l], ["a=\\frac{360\\ell}{\\pi r}", (x) => (360 * x.l) / (Math.PI * x.r)], ["a=\\frac{180\\pi r}{\\ell}", (x) => (180 * Math.PI * x.r) / x.l]],
    steps: ["両辺に 360 をかけて、$360\\ell=2\\pi ra$。", "両辺を $2\\pi r$ でわって、$a=\\frac{360\\ell}{2\\pi r}=\\frac{180\\ell}{\\pi r}$。"],
  },
  {
    name: "弧の長さ→r", stmt: "おうぎ形の弧の長さ $\\ell$ は、半径 $r$、中心角 $a^\\circ$ のとき、", eq: "\\ell=2\\pi r\\times \\frac{a}{360}", v: "r", vars: ["l", "r", "a"],
    resid: (x) => x.l - 2 * Math.PI * x.r * (x.a / 360), f: (x) => (360 * x.l) / (2 * Math.PI * x.a),
    ans: "r=\\frac{180\\ell}{\\pi a}",
    wrongs: [["r=\\frac{360\\ell}{\\pi a}", (x) => (360 * x.l) / (Math.PI * x.a)], ["r=\\frac{\\ell}{720\\pi a}", (x) => x.l / (720 * Math.PI * x.a)], ["r=\\frac{180\\pi a}{\\ell}", (x) => (180 * Math.PI * x.a) / x.l], ["r=\\frac{180\\ell}{a}", (x) => (180 * x.l) / x.a]],
    steps: ["両辺に 360 をかけて、$360\\ell=2\\pi ra$。", "両辺を $2\\pi a$ でわって、$r=\\frac{360\\ell}{2\\pi a}=\\frac{180\\ell}{\\pi a}$。"],
  },
  {
    name: "面積→a", stmt: "おうぎ形の面積 $S$ は、半径 $r$、中心角 $a^\\circ$ のとき、", eq: "S=\\pi r^{2}\\times \\frac{a}{360}", v: "a", vars: ["S", "r", "a"],
    resid: (x) => x.S - Math.PI * x.r * x.r * (x.a / 360), f: (x) => (360 * x.S) / (Math.PI * x.r * x.r),
    ans: "a=\\frac{360S}{\\pi r^{2}}",
    wrongs: [["a=\\frac{S}{360\\pi r^{2}}", (x) => x.S / (360 * Math.PI * x.r * x.r)], ["a=\\frac{360S}{\\pi r}", (x) => (360 * x.S) / (Math.PI * x.r)], ["a=\\frac{360\\pi r^{2}}{S}", (x) => (360 * Math.PI * x.r * x.r) / x.S], ["a=\\frac{180S}{\\pi r^{2}}", (x) => (180 * x.S) / (Math.PI * x.r * x.r)]],
    steps: ["両辺に 360 をかけて、$360S=\\pi r^{2}a$。", "両辺を $\\pi r^{2}$ でわって、$a=\\frac{360S}{\\pi r^{2}}$。"],
  },
];
/** 弧の長さ ℓ＝k π（cm）になる、半径 r・中心角 a の組（k＝r·a÷180 が整数） */
const kp = (k) => (k === 1 ? "\\pi" : `${k}\\pi`);
const SECTOR_NUM = [];
for (const a of [30, 40, 45, 60, 72, 90, 120, 135, 144, 150, 180, 200, 240]) for (let rad = 2; rad <= 12; rad++) if ((rad * a) % 180 === 0 && (rad * a) / 180 <= 30) SECTOR_NUM.push({ a, rad, k: (rad * a) / 180 });

// ── 数当て（11q05）────────────────────────────────────────
/** ① k を加える ② m倍 ③ j をひく ④ m でわる ⑤ n をひく → いつも k − j/m */
const digit = (r) => {
  const k = r(3, 9), m = r(2, 5), tt = r(1, k - 1), j = m * tt;
  return {
    k, m, j,
    steps: [`思いうかべた整数を $n$ とする。①〜③ は $${m}(n+${k})-${j}=${m}n+${m * k - j}$。`, `④ は $(${m}n+${m * k - j})\\div ${m}=n+${(m * k - j) / m}$。`, `⑤ は $(n+${(m * k - j) / m})-n=${(m * k - j) / m}$。$n$ が消えて、いつも ${(m * k - j) / m}。`],
  };
};

// 移さなかった問題（なし）
export const SKIPPED = [];   // 第11時は、演習プリント 11問・小テスト 5問のすべてを移した（項・次数・値は数値入力、計算は4択、説明は式の中の数か「言えること」の4択に直した）
