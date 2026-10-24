// ============================================================
// shiki-05.js — 式の計算 第5時「乗法と除法の混じった式を計算し、式の値を求めよう」
//   ikkan の演習プリント（shiki-05.dr.1〜10）・小テスト（shiki-05.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「05」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：05d03 ＝ shiki-05.dr.3
//   式そのものは入力欄で打てないので、(a) 式の値・数で聞く（数値入力）、(b) 計算の答えの式を選ぶ（4択）の2通りで移した。
//   答えは、すべて algebra.js で計算して出す（手で書かない）。4択の誤答は、ありがちなまちがい
//   （÷ の後ろの文字をかけてしまう／わらない・係数をかけてしまう・符号・文字の数のまちがい）を計算で出し、正解と式として同じものは入れない。
//   「÷4xy のように、×をはぶいてつづく部分は、まとめてわる」は、問題文に書く（言い方は DIV_NOTE にそろえる）。
// ============================================================
import { t, pick, choices4, shuffle, fracAns, rnz, sgn, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { qmul, qdiv, qtex, qisint, term, poly, pmul, pscale, psub, pdivMono, peval, peq, pneg, pterms, ptex, ptexp } from "../algebra.js";

const unit = unitFor("shiki");

// ── 小さな道具 ────────────────────────────────────────────
const $ = (s) => `$${s}$`;
const PAIRS = [["x", "y"], ["x", "y"], ["a", "b"], ["a", "b"], ["m", "n"], ["p", "q"], ["s", "t"]];   // 文字の組（x、y と a、b を多めに）
/** ÷ のあとの読み方の注意書き（連鎖の計算の問題文に、そろえて入れる） */
const DIV_NOTE = "（÷のあとの 4xy のように、×をはぶいてつづく部分は、まとめてわる）";
const INTS5 = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
/** 条件に合うものが見つかるまで、くり返す（見つからなければ null） */
const retry = (f, n = 500) => { for (let i = 0; i < n; i++) { const x = f(); if (x) return x; } return null; };
/** 入力式の答え：整数は数、分数は約分した文字列 */
const qAns = (q) => (q[1] === 1 ? q[0] : fracAns(q[0], q[1]));

// ── 単項式の「かけ算・わり算のつながり」 ─────────────────────
// items：[{ op: null|"*"|"/", m: 単項式, sq: true なら (m)^2 }]
const it = (op, c, e, sq = false) => ({ op, m: term(c, e), sq });
const coefOf = (m) => Object.values(m)[0];
const lettersOf = (m) => pdivMono(m, term(coefOf(m)));
const nonneg = (p) => !Object.keys(p).some((k) => k.includes("-"));
const sqv = (x) => (x.sq ? pmul(x.m, x.m) : x.m);
const run = (items) => items.slice(1).reduce((acc, x) => (x.op === "/" ? pdivMono(acc, sqv(x)) : pmul(acc, sqv(x))), sqv(items[0]));
const itemTex = (x, i) => (x.ph ? "\\square" : x.sq ? `(${ptex(x.m)})^{2}` : i === 0 ? ptex(x.m) : ptexp(x.m));
/** つながりの TeX。par＝true のときは、÷ のあとの項に、かっこをつける（問題文に注意書きがないとき用） */
const chainTex = (items, par = false) => items.map((x, i) => {
  if (i === 0) return itemTex(x, i);
  let s = itemTex(x, i);
  if (par && x.op === "/" && !x.ph && !s.startsWith("(")) s = `(${s})`;
  return (x.op === "/" ? " \\div " : " \\times ") + s;
}).join("");
const absTex = (m) => ptex(coefOf(m)[0] < 0 ? pneg(m) : m);
const lettersIn = (items) => [...new Set(items.flatMap((x) => Object.keys(x.m).join("").match(/[a-z]/g) || []))].sort();

/** ありがちなまちがい（計算で出す）。main＝よくあるまちがい、low＝あまり出ないまちがい（ほかが足りないときだけ使う） */
const chainWrongs = (items, right) => {
  const vs = items.map(sqv);
  const fold = (f) => vs.slice(1).reduce((acc, v, i) => f(acc, v, items[i + 1].op), vs[0]);
  const foldWith = (ws) => ws.slice(1).reduce((acc, v, i) => (items[i + 1].op === "/" ? pdivMono(acc, v) : pmul(acc, v)), ws[0]);
  const main = [
    fold((acc, v, op) => (op === "/" ? pmul(pdivMono(acc, term(coefOf(v))), lettersOf(v)) : pmul(acc, v))),   // ÷ のうしろの文字を、かけてしまう
    fold((acc, v, op) => (op === "/" ? pdivMono(acc, term(coefOf(v))) : pmul(acc, v))),                        // ÷ のうしろの文字を、わらない
    fold((acc, v, op) => (op === "/" ? pmul(pdivMono(acc, lettersOf(v)), term(coefOf(v))) : pmul(acc, v))),   // ÷ のうしろの係数を、かけてしまう
  ];
  if (items.some((x) => coefOf(x.m)[0] < 0 && !x.sq)) main.push(pneg(right));   // 符号
  items.forEach((x, i) => {
    if (!x.sq) return;
    const c = coefOf(x.m), l = lettersOf(x.m), l2 = pmul(l, l);
    const put = (w) => foldWith(vs.map((v, j) => (j === i ? w : v)));
    if (c[0] < 0) main.push(put(pneg(vs[i])));                 // (−2x)² を −4x² にしてしまう
    main.push(put(pmul(term(c), l2)));                          // 係数を 2乗し忘れる
    main.push(put(pmul(term(qmul(c, c)), l)));                  // 文字を 2乗し忘れる
  });
  for (const l of lettersIn(items)) {
    main.push(pmul(right, term(1, { [l]: 1 })));       // 文字が 1つ多い
    main.push(pdivMono(right, term(1, { [l]: 1 })));   // 文字が 1つ少ない
  }
  return { main: main.filter(nonneg), low: [pneg(right), vs.reduce((a, b) => pmul(a, b))].filter(nonneg) };
};

/** 4択：正解（tex と値）と、まちがい候補 [{tex, val}] から。値が正解と同じ（peq）になるものは入れない。low は、足りないときだけ使う */
const pick4 = (r, rtex, rval, cands, low = [], must = []) => {
  const seen = new Set([rtex]);
  const ws = [];
  const add = (c) => {
    if (!c || seen.has(c.tex)) return;
    if (c.val && rval && peq(c.val, rval)) return;
    seen.add(c.tex);
    ws.push($(c.tex));
  };
  const isBig = (c) => c.val && Object.values(c.val).some((q) => Math.abs(q[0]) > 100 || q[1] > 100);   // 数が大きすぎるものは、あとまわし
  const isZero = (c) => c.val && Object.keys(c.val).length === 0;
  const okc = cands.filter((c) => !isZero(c) && !isBig(c));
  must.forEach(add);
  shuffle(r, okc).forEach(add);
  if (ws.length < 3) shuffle(r, [...low, ...cands.filter(isBig)].filter((c) => !isZero(c))).forEach(add);
  if (ws.length < 3) throw new Error(`誤答が足りない（${rtex}）`);
  return choices4(r, $(rtex), ws);
};
const asCand = (p) => ({ tex: ptex(p), val: p });

/** 計算の解説（1〜4行） */
const chainSteps = (items, right, par = false) => {
  const steps = [];
  const sqs = items.filter((x) => x.sq);
  if (sqs.length) steps.push("累乗を先に計算する。 " + $(sqs.map((x) => `(${ptex(x.m)})^{2}=${ptex(sqv(x))}`).join(",\\ ")));
  const allInt = items.every((x) => Object.values(sqv(x)).every((c) => c[1] === 1));
  const negs = items.filter((x) => coefOf(sqv(x))[0] < 0).length;
  if (allInt) {
    if (negs) steps.push(`負の数が ${negs} 個（${negs % 2 ? "奇数" : "偶数"}個）だから、答えの符号は ${negs % 2 ? "−" : "+"}。`);
    const num = items.filter((x, i) => i === 0 || x.op !== "/").map((x) => absTex(sqv(x))).join(" \\times ");
    const den = items.filter((x, i) => i > 0 && x.op === "/").map((x) => absTex(sqv(x))).join(" \\times ");
    steps.push("1つの分数の形にまとめて、約分する。 " + $(`${chainTex(items, par)} = ${negs % 2 ? "-" : ""}\\frac{${num}}{${den}} = ${ptex(right)}`));
  } else {
    let acc = sqv(items[0]);
    items.slice(1).forEach((x) => {
      const v = sqv(x);
      const next = x.op === "/" ? pdivMono(acc, v) : pmul(acc, v);
      if (x.op === "/") {
        const rec = pdivMono(term(1), v);
        steps.push("左から順に計算する。 " + $(`${ptex(acc)} \\div ${ptexp(v)} = ${ptex(acc)} \\times ${ptexp(rec)} = ${ptex(next)}`));
      } else {
        steps.push("左から順に計算する。 " + $(`${ptex(acc)} \\times ${ptexp(v)} = ${ptex(next)}`));
      }
      acc = next;
    });
  }
  return steps;
};

/** 「計算の答えを選ぶ」4択 */
const chainQ = (r, items, hint, head = `次の計算をしたときの答えは、どれか。${DIV_NOTE}`, par = false) => {
  const right = run(items);
  if (!nonneg(right) || Object.keys(right).length === 0) return { skip: true };
  const rt = ptex(right);
  return {
    q: `${head}${$(chainTex(items))}`,
    ans: $(rt),
    choices: (() => { const w = chainWrongs(items, right); return pick4(r, rt, right, w.main.map(asCand), w.low.map(asCand)); })(),
    hint,
    steps: chainSteps(items, right, par),
  };
};

// ── 代入の式（TeX） ────────────────────────────────────────
const expsOfKey = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
const degOfExps = (e) => Object.values(e).reduce((a, c) => a + Math.max(0, c), 0);
/** ptex と同じ項のならび */
const sortedKeys = (p) => Object.keys(p).sort((a, b) => {
  const ea = expsOfKey(a), eb = expsOfKey(b), da = degOfExps(ea), db = degOfExps(eb);
  if (da !== db) return db - da;
  for (const v of [...new Set([...Object.keys(ea), ...Object.keys(eb)])].sort()) { const x = (ea[v] || 0) - (eb[v] || 0); if (x) return -x; }
  return 0;
});
const isFrac = (v) => Array.isArray(v) && v[1] !== 1;
const isNegV = (v) => (Array.isArray(v) ? v[0] < 0 : v < 0);
const valTex = (v) => (Array.isArray(v) ? qtex(v) : String(v));
const paren = (v) => (isFrac(v) ? `\\left(${valTex(v)}\\right)` : `(${valTex(v)})`);
const powV = (v, e) => (e > 1 ? (isNegV(v) || isFrac(v) ? paren(v) : valTex(v)) + `^{${e}}` : isNegV(v) ? paren(v) : valTex(v));
/** 簡単にした式 p の文字に、数を入れた式（負の数にはかっこをつける） */
const substTex = (p, vals) => sortedKeys(p).map((k, i) => {
  const c = p[k], neg = c[0] < 0, e = expsOfKey(k), ca = [Math.abs(c[0]), c[1]];
  const fs = Object.keys(e).sort().filter((v) => e[v] > 0).map((v) => powV(vals[v], e[v]));
  const cs = ca[0] === 1 && ca[1] === 1 && fs.length ? [] : [qtex(ca)];
  return (i === 0 ? (neg ? "-" : "") : neg ? "-" : "+") + [...cs, ...fs].join(" \\times ");
}).join("");
const valsSay = (u, v, vals) => `${$(`${u}=${valTex(vals[u])}`)}、${$(`${v}=${valTex(vals[v])}`)}`;

const INTS = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
const FRACS = [[1, 2], [-1, 2], [1, 3], [-1, 3], [1, 4], [-1, 4], [1, 5], [-1, 5], [2, 3], [-2, 3]];

/** 式の値（数値入力）。items のつながりを簡単にしてから代入する。vals は { 文字: 数 } */
const chainValueQ = (items, vals, u, v, hint) => {
  const simp = run(items);
  const res = peval(simp, vals);
  return {
    q: `${valsSay(u, v, vals)} のとき、${$(chainTex(items))} の値を求めよう。${DIV_NOTE}`,
    ans: qAns(res),
    hint,
    steps: [
      "先に式を簡単にする。 " + $(`${chainTex(items)} = ${ptex(simp)}`),
      "文字に数を代入する（負の数にはかっこをつける）。 " + $(`${ptex(simp)} = ${substTex(simp, vals)} = ${valTex(res)}`),
    ],
  };
};

export const UNITS = [
  unit("05", {
    name: "乗除の混じった式の計算と式の値",
    desc: "かける式は分子・わる式は分母。符号を先に決めて約分し、式の値を求める",
    prereqs: ["J2-sk04"],
    points: [
      "乗法と除法が混じった式は、1つの分数の形にまとめて約分する。かける式は分子に、わる式は分母に書く。$\\div 6xy$ は、$6xy$ 全体でわる。",
      "累乗があれば先に計算する。答えの符号は先に決める（$-$ の数が奇数個なら $-$、偶数個なら $+$）。",
      "式の値は、式を簡単にしてから、文字に数を代入すると計算が楽。負の数は、かっこをつけて代入する。",
      "三角形の高さは、（面積）×2÷（底辺）。□ をふくむ式は、かけ算とわり算の関係を使って、両辺に同じ数をかけたり、同じ数でわったりして、□ を求める。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 05d01 乗除の混じった単項式の計算（6x×4y÷8x ／ 10a²÷5a×3b ／ 12xy÷4x÷3y）
        t("05d01", (r) => {
          const [u, v] = pick(r, PAIRS), kind = r(1, 3);
          const items = retry(() => {
            if (kind === 1) {   // 6x × 4y ÷ 8x
              const c1 = r(2, 12), c2 = r(2, 9), c3 = r(2, 12);
              return (c1 * c2) % c3 === 0 && (c1 * c2) / c3 <= 36 && c3 !== c1 && c3 !== c2 ? [it(null, c1, { [u]: 1 }), it("*", c2, { [v]: 1 }), it("/", c3, { [u]: 1 })] : null;
            }
            if (kind === 2) {   // 10a² ÷ 5a × 3b
              const c1 = r(4, 20), c2 = r(2, 9), c3 = r(2, 9);
              return (c1 * c3) % c2 === 0 && (c1 * c3) / c2 <= 36 && c1 !== c2 ? [it(null, c1, { [u]: 2 }), it("/", c2, { [u]: 1 }), it("*", c3, { [v]: 1 })] : null;
            }
            const c2 = r(2, 6), c3 = r(2, 4), k = r(1, 3);   // 12xy ÷ 4x ÷ 3y
            return [it(null, c2 * c3 * k, { [u]: 1, [v]: 1 }), it("/", c2, { [u]: 1 }), it("/", c3, { [v]: 1 })];
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "かける式は分子、わる式は分母に書いて、1つの分数にまとめよう。");
        }),
        // 05d02 符号をふくむ乗除（3a×(−8b)÷6ab ／ (−4x)²×y÷8x ／ 18x²y÷(−6x)÷3y）
        t("05d02", (r) => {
          const [u, v] = pick(r, PAIRS), kind = r(1, 3);
          const items = retry(() => {
            const s = [sgn(r), sgn(r), sgn(r)];
            if (kind === 1) {   // 3a × (−8b) ÷ 6ab
              if (s.every((x) => x > 0)) return null;
              const c1 = r(2, 9), c2 = r(2, 9), c3 = r(2, 12);
              return (c1 * c2) % c3 === 0 && (c1 * c2) / c3 <= 36 ? [it(null, s[0] * c1, { [u]: 1 }), it("*", s[1] * c2, { [v]: 1 }), it("/", s[2] * c3, { [u]: 1, [v]: 1 })] : null;
            }
            if (kind === 2) {   // (−4x)² × y ÷ 8x
              const c1 = r(2, 9), c2 = r(2, 16);
              return (c1 * c1) % c2 === 0 && c2 > 1 ? [it(null, -c1, { [u]: 1 }, true), it("*", 1, { [v]: 1 }), it("/", s[2] * c2, { [u]: 1 })] : null;
            }
            if (s[1] > 0 && s[2] > 0) return null;   // 18x²y ÷ (−6x) ÷ 3y
            const c2 = r(2, 6), c3 = r(2, 4), k = r(1, 3);
            return [it(null, c2 * c3 * k, { [u]: 2, [v]: 1 }), it("/", s[1] * c2, { [u]: 1 }), it("/", s[2] * c3, { [v]: 1 })];
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "累乗があれば先に計算し、−の数の個数で答えの符号を先に決めよう。");
        }),
        // 05d03 式の値（かっこをはずして整理してから代入）：4(x−y)−3(x+2y)、5(a−2b)−2(2a−3b)
        t("05d03", (r) => {
          const [u, v] = pick(r, PAIRS);
          const g = retry(() => {
            const a = r(2, 5), c = r(2, 4), b = rnz(r, -3, 3), d = rnz(r, -3, 3), p = pick(r, [1, 1, 2, 3]);
            const P1 = poly([1, { [u]: 1 }], [b, { [v]: 1 }]), P2 = poly([p, { [u]: 1 }], [d, { [v]: 1 }]);
            const E = psub(pscale(P1, a), pscale(P2, c));
            return pterms(E) === 2 ? { a, c, P1, P2, E } : null;
          });
          if (!g) return { skip: true };
          // 基礎：答えは 0 でなく、絶対値 50 以下
          const vals = retry(() => { const o = { [u]: pick(r, INTS5), [v]: pick(r, INTS5) }; const x = peval(g.E, o)[0]; return x !== 0 && Math.abs(x) <= 50 ? o : null; });
          if (!vals) return { skip: true };
          const ex = `${g.a}(${ptex(g.P1)})-${g.c}(${ptex(g.P2)})`;
          const res = peval(g.E, vals);
          return {
            q: `${valsSay(u, v, vals)} のとき、${$(ex)} の値を求めよう。`,
            ans: qAns(res),
            hint: "かっこをはずして同類項をまとめ、式を簡単にしてから代入しよう。",
            steps: ["かっこをはずして、整理する。 " + $(`${ex} = ${ptex(g.E)}`), "文字に数を代入する（負の数にはかっこをつける）。 " + $(`${ptex(g.E)} = ${substTex(g.E, vals)} = ${valTex(res)}`)],
          };
        }),
        // 05q01a 小テスト（1）① 14a×3b÷7a
        t("05q01a", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const c3 = r(2, 9), c1 = c3 * r(2, 3), c2 = r(2, 9);
            return c1 <= 30 ? [it(null, c1, { [u]: 1 }), it("*", c2, { [v]: 1 }), it("/", c3, { [u]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "かける式は分子、わる式は分母に書いて、約分しよう。");
        }),
        // 05q01b 小テスト（1）② 20xy²÷(−5y)÷2x
        t("05q01b", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const i = r(1, 2), j = r(1, 2), k = r(1, 6), c2 = r(2, 6), c3 = r(2, 6), s2 = sgn(r), s3 = sgn(r);
            if (s2 > 0 && s3 > 0) return null;   // −の数がある（20xy²÷(−5y)÷2x）
            return c2 * c3 * k <= 72 ? [it(null, c2 * c3 * k, { [u]: i, [v]: j + 1 }), it("/", s2 * c2, { [v]: 1 }), it("/", s3 * c3, { [u]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "−の数が奇数個か偶数個かで、答えの符号を先に決めよう。");
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 05d04 分数の係数・累乗をふくむ乗除： (3/4)a×8b÷(−3/2 a) ／ (−3a)²÷(−6ab)×4b²
        t("05d04", (r) => {
          const [u, v] = pick(r, PAIRS);
          let items;
          if (r(0, 1)) {
            items = retry(() => {
              const p = r(1, 5), q = r(2, 6), c = r(2, 16), s = r(1, 5), d = r(2, 6);
              if (gcd(p, q) !== 1 || gcd(s, d) !== 1 || q === 1) return null;
              const res = qdiv(qmul([p, q], [c, 1]), [-s, d]);
              return res[1] === 1 && Math.abs(res[0]) <= 30 ? [it(null, [p, q], { [u]: 1 }), it("*", c, { [v]: 1 }), it("/", [-s, d], { [u]: 1 })] : null;
            });
            if (!items) return { skip: true };
            return chainQ(r, items, "分数でわるときは、わる式の逆数をかけると考えよう。");
          }
          items = retry(() => {
            const c1 = r(2, 9), c2 = r(2, 12), c3 = r(2, 8);
            return (c1 * c1 * c3) % c2 === 0 && (c1 * c1 * c3) / c2 <= 36 ? [it(null, -c1, { [u]: 1 }, true), it("/", -c2, { [u]: 1, [v]: 1 }), it("*", c3, { [v]: 2 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "累乗を先に計算し、符号を決めてから、分数の形にして約分しよう。");
        }),
        // 05d05 式の値（乗除）：x＝−4、y＝1/2 のとき 12x²y÷(−3x) ／ x＝2、y＝−3 のとき (−3xy)²÷(−9xy)
        t("05d05", (r) => {
          const [u, v] = pick(r, PAIRS), kind = r(1, 2);
          const items = retry(() => {
            if (kind === 1) {
              const c2 = r(2, 9), k = r(1, 6);
              return [it(null, c2 * k, { [u]: 2, [v]: 1 }), it("/", -c2, { [u]: 1 })];
            }
            const c1 = r(2, 5), c2 = r(2, 12);
            return (c1 * c1) % c2 === 0 ? [it(null, -c1, { [u]: 1, [v]: 1 }, true), it("/", -c2, { [u]: 1, [v]: 1 })] : null;
          });
          if (!items) return { skip: true };
          const simp = run(items);
          const vals = retry(() => {
            const o = { [u]: pick(r, INTS), [v]: r(0, 1) ? pick(r, INTS) : pick(r, FRACS) };
            const res = peval(simp, o);
            return qisint(res) && res[0] !== 0 && Math.abs(res[0]) <= 60 ? o : null;
          });
          if (!vals) return { skip: true };
          return chainValueQ(items, vals, u, v, "先に式を簡単にしてから、負の数や分数にはかっこをつけて代入しよう。");
        }),
        // 05d06a 三角形の高さを式で表す（4択）：底辺 6ab cm、面積 12a²b cm²
        t("05d06a", (r) => {
          const g = triGen(r);
          if (!g) return { skip: true };
          const { u, v, B, H, S } = g;
          const rt = ptex(H);
          const used = lettersIn([{ m: B }, { m: S }]);   // 問題文に出てくる文字だけを使う
          const cands = [pdivMono(S, B), pdivMono(pdivMono(S, B), term(2)), pscale(H, 2), ...used.flatMap((l) => [pmul(H, term(1, { [l]: 1 })), pdivMono(H, term(1, { [l]: 1 }))])].filter(nonneg).map(asCand);
          const P2 = pmul(S, term(2));
          return {
            q: `底辺が ${$(ptex(B))} cm、面積が ${$(ptex(S))} cm² の三角形がある。この三角形の高さを表す式は、どれか。`,
            ans: $(rt),
            choices: pick4(r, rt, H, cands),
            hint: "三角形の面積を求める公式を、高さを求める式に直そう。",
            steps: ["（三角形の面積）＝（底辺）×（高さ）÷2 だから、（高さ）＝（面積）×2÷（底辺）。", $(`${ptex(S)} \\times 2 \\div (${ptex(B)}) = \\frac{${ptex(P2)}}{${ptex(B)}} = ${rt}`)],
          };
        }),
        // 05d06b 三角形の高さ（数値）：a＝2、b＝3 のとき何 cm か
        t("05d06b", (r) => {
          const g = triGen(r);
          if (!g) return { skip: true };
          const { u, v, B, H, S } = g;
          const used = lettersIn([{ m: B }, { m: S }]);
          const vals = { [u]: r(1, 5), [v]: r(1, 5) };
          const res = peval(H, vals);
          return {
            q: `底辺が ${$(ptex(B))} cm、面積が ${$(ptex(S))} cm² の三角形がある。${used.map((l) => $(`${l}=${vals[l]}`)).join("、")} のとき、この三角形の高さは何 cm か。`,
            ans: qAns(res),
            unit: "cm",
            hint: "三角形の面積の公式から、高さを求める式をつくろう。",
            steps: ["（高さ）＝（面積）×2÷（底辺）", $(`${ptex(S)} \\times 2 \\div (${ptex(B)}) = ${ptex(H)}`), `${$(`${ptex(H)} = ${substTex(H, vals)} = ${valTex(res)}`)}（cm）`],
          };
        }),
        // 05q02 小テスト（2）a＝−1、b＝4 のとき 4(a−b)−3(a−2b)
        t("05q02", (r) => {
          const [u, v] = pick(r, PAIRS);
          const g = retry(() => {
            const a = r(2, 6), c = r(2, 6), b = rnz(r, -3, 3), d = rnz(r, -3, 3);
            const P1 = poly([1, { [u]: 1 }], [b, { [v]: 1 }]), P2 = poly([1, { [u]: 1 }], [d, { [v]: 1 }]);
            const E = psub(pscale(P1, a), pscale(P2, c));
            return pterms(E) === 2 && b !== d ? { a, c, P1, P2, E } : null;
          });
          if (!g) return { skip: true };
          const vals = retry(() => { const o = { [u]: -r(1, 5), [v]: r(1, 6) }; const x = peval(g.E, o)[0]; return x !== 0 && Math.abs(x) <= 80 ? o : null; });
          if (!vals) return { skip: true };
          const ex = `${g.a}(${ptex(g.P1)})-${g.c}(${ptex(g.P2)})`;
          const res = peval(g.E, vals);
          return {
            q: `${valsSay(u, v, vals)} のとき、${$(ex)} の値を求めよう。`,
            ans: qAns(res),
            hint: "かっこをはずして式を簡単にしてから、負の数にはかっこをつけて代入しよう。",
            steps: ["かっこをはずして、整理する。 " + $(`${ex} = ${ptex(g.E)}`), "代入する。 " + $(`${ptex(g.E)} = ${substTex(g.E, vals)} = ${valTex(res)}`)],
          };
        }),
        // 05q03 小テスト（3）x＝−3、y＝2 のとき (−2x)²×y÷(−4x)
        t("05q03", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const c1 = r(2, 6), c2 = r(2, 12);
            return (c1 * c1) % c2 === 0 ? [it(null, -c1, { [u]: 1 }, true), it("*", 1, { [v]: 1 }), it("/", -c2, { [u]: 1 })] : null;
          });
          if (!items) return { skip: true };
          const simp = run(items);
          const vals = retry(() => { const o = { [u]: -r(1, 6), [v]: pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5]) }; return Math.abs(peval(simp, o)[0]) <= 120 ? o : null; });
          if (!vals) return { skip: true };
          return chainValueQ(items, vals, u, v, "累乗を先に計算し、式を簡単にしてから代入しよう。");
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 05d07 式の値（分数の値を代入）：x＝7、y＝−1/7 のとき 14x²y×3y÷(−6xy)
        t("05d07", (r) => {
          const [u, v] = pick(r, PAIRS), kind = r(1, 2);
          const items = retry(() => {
            if (kind === 1) {   // 14x²y × 3y ÷ (−6xy)
              const c1 = r(2, 16), c2 = r(2, 6), c3 = r(2, 12);
              return (c1 * c2) % c3 === 0 && (c1 * c2) / c3 <= 24 ? [it(null, c1, { [u]: 2, [v]: 1 }), it("*", c2, { [v]: 1 }), it("/", -c3, { [u]: 1, [v]: 1 })] : null;
            }
            const c1 = r(2, 6), c2 = r(2, 12), c3 = r(2, 6);   // (−3xy)² ÷ (−6xy) × 4y
            return (c1 * c1 * c3) % c2 === 0 && (c1 * c1 * c3) / c2 <= 24 ? [it(null, -c1, { [u]: 1, [v]: 1 }, true), it("/", -c2, { [u]: 1, [v]: 1 }), it("*", c3, { [v]: 1 })] : null;
          });
          if (!items) return { skip: true };
          const simp = run(items);
          const vals = retry(() => {
            const o = { [u]: pick(r, [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]), [v]: pick(r, [...FRACS, [1, 6], [-1, 6], [1, 7], [-1, 7], [1, 8], [-1, 8], [1, 9], [-1, 9]]) };
            const res = peval(simp, o);
            return qisint(res) && res[0] !== 0 && Math.abs(res[0]) <= 150 ? o : null;
          });
          if (!vals) return { skip: true };
          return chainValueQ(items, vals, u, v, "先に式を簡単にしてから代入すると、分数どうしの計算が楽になる。");
        }),
        // 05d08a まちがい探し①を、正しい答えを選ぶ4択に：6ab÷2a×3b（÷2a のあとの ×3b まで、÷の中に入れてしまうまちがい）
        t("05d08a", (r) => {
          const [u, v] = pick(r, PAIRS);
          const g = retry(() => {
            const c2 = r(2, 6), c3 = r(2, 6), k = r(1, 4), e = r(1, 2);
            return c2 * c3 * k <= 60 ? { c1: c2 * c3 * k, c2, c3, e } : null;
          });
          const { c1, c2, c3, e } = g;
          const m0 = term(c1, { [u]: e, [v]: 1 }), m1 = term(c2, { [u]: 1 }), m2 = term(c3, { [v]: 1 });
          const items = [{ op: null, m: m0 }, { op: "/", m: m1 }, { op: "*", m: m2 }];
          const right = run(items);
          const mid = pdivMono(m0, m1);
          const wrong = pdivMono(m0, pmul(m1, m2));   // ÷(2a×3b) としてしまう
          const rt = ptex(right);
          return {
            q: `次のうち、${$(chainTex(items))} を正しく計算した結果は、どれか。`,
            ans: $(rt),
            choices: (() => { const w = chainWrongs(items, right); return pick4(r, rt, right, w.main.map(asCand), w.low.map(asCand), [asCand(wrong)]); })(),
            hint: "乗法と除法が混じった式は、どの順に計算するのだったかな。",
            steps: [
              `${$(`${ptex(m0)} \\div (${ptex(m1)} \\times ${ptex(m2)}) = ${ptex(wrong)}`)} のように、×${ptex(m2)} まで ÷ の中に入れるのは、まちがい。`,
              "乗法と除法は、左から順に計算する。 " + $(`${chainTex(items, true)} = ${ptex(mid)} \\times ${ptexp(m2)} = ${rt}`),
            ],
          };
        }),
        // 05d08b まちがい探し②を、数値に：x＝−2 のとき 3x²（負の数はかっこをつけて代入する）。−3x²、3x³、3x²y（x、y が負）もまぜる
        t("05d08b", (r) => {
          const [u, v] = pick(r, PAIRS), form = pick(r, [1, 2, 3, 3, 4, 4, 4]);
          const g = retry(() => {
            const k = r(2, 6), x = -r(2, form === 3 ? 4 : 5), y = -r(2, 4);
            const p = form === 1 ? term(k, { [u]: 2 }) : form === 2 ? term(-k, { [u]: 2 }) : form === 3 ? term(k, { [u]: 3 }) : term(k, { [u]: 2, [v]: 1 });
            const vals = form === 4 ? { [u]: x, [v]: y } : { [u]: x };
            const res = peval(p, vals);
            return Math.abs(res[0]) <= 150 ? { p, vals, res, k } : null;
          });
          if (!g) return { skip: true };
          const { p, vals, res } = g;
          // 数どうしの計算の式：（係数）×（文字の値）…
          const k0 = coefOf(p);
          const e = Object.fromEntries([...Object.keys(p)[0].matchAll(/([a-z])(\d+)/g)].map((m) => [m[1], +m[2]]));
          const facs = Object.keys(e).sort().map((l) => vals[l] ** e[l]);
          const wrapN = (n) => (n < 0 ? `(${n})` : String(n));
          const calc = [String(k0[0]), ...facs.map(wrapN)].join(" \\times ");
          return {
            q: `${form === 4 ? valsSay(u, v, vals) : $(`${u}=${vals[u]}`)} のとき、${$(ptex(p))} の値を求めよう。`,
            ans: qAns(res),
            hint: "負の数を代入するときは、どうするのだったかな。",
            steps: ["負の数を代入するときは、かっこをつける。 " + $(`${ptex(p)} = ${substTex(p, vals)}`), $(`= ${calc} = ${valTex(res)}`)],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 05d09 □ にあてはまる式（4択）：12x²y÷□×3y＝−9xy²
        t("05d09", (r) => {
          const [u, v] = pick(r, PAIRS), form = r(1, 3);
          const g = retry(() => {
            let X, items, R;
            if (form === 1) {   // m0 ÷ □ × m2 = R
              const c1 = r(2, 16), c2 = r(2, 9), c3 = r(2, 6);
              X = term(sgn(r) * c2, { [u]: 1 });
              items = [{ op: null, m: term(c1, { [u]: 2, [v]: 1 }) }, { op: "/", m: X, ph: true }, { op: "*", m: term(c3, { [v]: 1 }) }];
            } else if (form === 2) {   // m0 × □ ÷ m2 = R
              const c1 = r(2, 9), c2 = r(2, 9), c3 = r(2, 9);
              X = term(sgn(r) * c2, { [v]: 2 });
              items = [{ op: null, m: term(c1, { [u]: 1 }) }, { op: "*", m: X, ph: true }, { op: "/", m: term(c3, { [u]: 1, [v]: 1 }) }];
            } else {   // □ ÷ m1 × m2 = R
              const c1 = r(2, 12), c2 = r(2, 6), c3 = r(2, 6);
              X = term(sgn(r) * c1, { [u]: 2, [v]: 1 });
              items = [{ op: null, m: X, ph: true }, { op: "/", m: term(c2, { [u]: 1 }) }, { op: "*", m: term(c3, { [v]: 1 }) }];
            }
            R = run(items);
            if (!nonneg(R) || !Object.values(R).every((c) => c[1] === 1) || Math.abs(Object.values(R)[0][0]) > 60) return null;
            return { X, items, R };
          });
          if (!g) return { skip: true };
          const { X, items, R } = g;
          const m = items.map((x) => x.m);
          let steps;
          const pr = (p) => `(${ptex(p)})`;
          if (form === 1) {
            const P = pmul(m[0], m[2]);
            steps = [`かけ算を先にまとめる。 ${$(`${ptex(m[0])} \\times ${ptex(m[2])} = ${ptex(P)}`)}`, `${$(`${ptex(P)} \\div \\square = ${ptex(R)}`)} だから、 ${$(`\\square = ${ptex(P)} \\div ${pr(R)} = ${ptex(X)}`)}`];
          } else if (form === 2) {
            const P = pmul(R, m[2]);
            steps = [`両辺に $${ptex(m[2])}$ をかける。 ${$(`${ptex(m[0])} \\times \\square = ${ptex(R)} \\times ${pr(m[2])} = ${ptex(P)}`)}`, `両辺を $${ptex(m[0])}$ でわって、 ${$(`\\square = ${ptex(P)} \\div ${pr(m[0])} = ${ptex(X)}`)}`];
          } else {
            const P = pdivMono(R, m[2]);
            steps = [`両辺を $${ptex(m[2])}$ でわる。 ${$(`\\square \\div ${pr(m[1])} = ${ptex(R)} \\div ${pr(m[2])} = ${ptex(P)}`)}`, `両辺に $${ptex(m[1])}$ をかけて、 ${$(`\\square = ${ptex(P)} \\times ${pr(m[1])} = ${ptex(X)}`)}`];
          }
          const ls = lettersIn(items);
          const cands = [pneg(X), ...ls.flatMap((l) => [pmul(X, term(1, { [l]: 1 })), pdivMono(X, term(1, { [l]: 1 }))]), pscale(X, 2), pscale(X, [1, 2]), pscale(pneg(X), 2)].filter(nonneg).map(asCand);
          return {
            q: `次の □ にあてはまる式は、どれか。${DIV_NOTE}${$(`${chainTex(items)} = ${ptex(R)}`)}`,
            ans: $(ptex(X)),
            choices: pick4(r, ptex(X), X, cands),
            hint: "かけ算とわり算の関係を使って、□ を求める式をつくろう。",
            steps,
          };
        }),
        // 05d10a A×B÷C を計算する（4択）：A＝4a²b、B＝−6ab²、C＝2ab
        t("05d10a", (r) => {
          const g = abcGen(r);
          if (!g) return { skip: true };
          const { items, defs } = g;
          const out = chainQ(r, items, "A、B、C を式に直して、1つの分数にまとめよう。", undefined, true);
          if (out.skip) return out;
          return { ...out, q: `${defs} のとき、${$("A \\times B \\div C")} を計算した答えは、どれか。`, steps: ["A、B、C を代入する。 " + $(`A \\times B \\div C = ${chainTex(items, true)}`), ...out.steps] };
        }),
        // 05d10b A×B÷C の値（数値）：a＝−1、b＝2 のとき
        t("05d10b", (r) => {
          const g = abcGen(r);
          if (!g) return { skip: true };
          const { items, defs, u, v } = g;
          const simp = run(items);
          const vals = retry(() => { const o = { [u]: pick(r, [-3, -2, -1, 1, 2, 3]), [v]: pick(r, [-3, -2, -1, 1, 2, 3]) }; return Math.abs(peval(simp, o)[0]) <= 300 ? o : null; });
          if (!vals) return { skip: true };
          const res = peval(simp, vals);
          return {
            q: `${defs} のとき、${$("A \\times B \\div C")} の値を、${valsSay(u, v, vals)} として求めよう。`,
            ans: qAns(res),
            hint: "先に A×B÷C を簡単にしてから、代入しよう。",
            steps: ["A、B、C を代入して簡単にする。 " + $(`${chainTex(items, true)} = ${ptex(simp)}`), "文字に数を代入する。 " + $(`${ptex(simp)} = ${substTex(simp, vals)} = ${valTex(res)}`)],
          };
        }),
        // 05q04 小テスト チャレンジ：x＝−3、y＝1/3 のとき (−4xy)²÷(−8y)×x
        t("05q04", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const c1 = r(2, 6), c2 = r(2, 12);
            return (c1 * c1) % c2 === 0 && c2 > 1 ? [it(null, -c1, { [u]: 1, [v]: 1 }, true), it("/", -c2, { [v]: 1 }), it("*", 1, { [u]: 1 })] : null;
          });
          if (!items) return { skip: true };
          const simp = run(items);
          const vals = retry(() => {
            const o = { [u]: pick(r, [-4, -3, -2, 2, 3, 4]), [v]: pick(r, [[1, 2], [-1, 2], [1, 3], [-1, 3], [1, 4], [-1, 4], [2, 3], [-2, 3]]) };
            const res = peval(simp, o);
            return qisint(res) && res[0] !== 0 && Math.abs(res[0]) <= 250 ? o : null;
          });
          if (!vals) return { skip: true };
          return chainValueQ(items, vals, u, v, "先に累乗を計算して、式を簡単にしてから代入しよう。");
        }),
      ],
    },
  }),
];

// ── 三角形の底辺・高さ・面積（05d06a・05d06b） ──────────────────
function triGen(r) {
  return retry(() => {
    const [u, v] = pick(r, PAIRS);
    const bc = pick(r, [2, 3, 4, 5, 6, 8, 10]), hc = pick(r, [2, 3, 4, 5, 6, 8]);
    if ((bc * hc) % 2) return null;
    const be = pick(r, [[1, 1], [1, 0], [0, 1], [2, 1], [1, 2]]), he = pick(r, [[1, 0], [0, 1], [1, 1], [2, 0], [0, 2]]);
    const B = term(bc, { [u]: be[0], [v]: be[1] }), H = term(hc, { [u]: he[0], [v]: he[1] });
    return { u, v, B, H, S: pdivMono(pmul(B, H), term(2)) };
  });
}

// ── A、B、C の単項式（05d10a・05d10b） ──────────────────────────
function abcGen(r) {
  return retry(() => {
    const [u, v] = ["a", "b"];
    const c1 = r(2, 9), c2 = r(2, 9), c3 = r(2, 6);
    if ((c1 * c2) % c3 !== 0 || (c1 * c2) / c3 > 40) return null;
    const A = term(c1 * sgn(r), { [u]: pick(r, [1, 2]), [v]: pick(r, [1, 2]) }), B = term(c2 * sgn(r), { [u]: pick(r, [1, 2]), [v]: pick(r, [1, 2]) }), C = term(c3, { [u]: 1, [v]: 1 });
    const items = [{ op: null, m: A }, { op: "*", m: B }, { op: "/", m: C }];
    if (!nonneg(run(items))) return null;
    const defs = `${$(`A=${ptex(A)}`)}、${$(`B=${ptex(B)}`)}、${$(`C=${ptex(C)}`)}`;
    return { items, defs, u, v };
  });
}

// 移さなかった問題：なし
//   shiki-05.dr.8（まちがい探し：「どこがまちがっているか説明して、正しく計算しよう」）は、①を「正しい計算結果を選ぶ」4択（05d08a）、②を「負の数を代入した値」（05d08b）に直して移した。
export const SKIPPED = [];
