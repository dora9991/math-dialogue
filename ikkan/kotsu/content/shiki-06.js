// ============================================================
// shiki-06.js — 式の計算 第6時「式の計算ビンゴで、計算をたしかなものにしよう」（第1〜5時の復習）
//   ikkan の演習プリント（shiki-06.dr.1〜16）・小テスト（shiki-06.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「06」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：06d03 ＝ shiki-06.dr.3
//   ビンゴ（ア〜シ）は、ひとりでは遊べないので、ビンゴの12問（dr.1〜12）を、それぞれ1問の計算問題として移した。
//   式は入力欄で打てないので、(a) 次数・式の値など数で聞く（数値入力）、(b) 計算の答えの式を選ぶ（4択）の2通りで移した。
//   答えは、すべて algebra.js で計算して出す（手で書かない）。4択の誤答は、ありがちなまちがい
//   （ひく式の符号を変えない・分配法則の掛け忘れ・わり算を1項だけ・同類項でないものをまとめる・累乗のまちがい・÷ の後ろの文字をかけてしまう など）を計算で出し、
//   正解と式として同じ（peq）ものは入れない。「まちがい探し」（dr.14）は、まちがいの理由を選ぶ4択に直した。
// ============================================================
import { t, pick, choices4, shuffle, fracAns, rnz, sgn, gcd, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { qmul, qdiv, qtex, qisint, term, poly, padd, pmul, pscale, psub, pdivMono, peval, peq, pneg, pdeg, pterms, ptex, ptexp } from "../algebra.js";

const unit = unitFor("shiki");

// ── 小さな道具 ────────────────────────────────────────────
const $ = (s) => `$${s}$`;
const PAIRS = [["x", "y"], ["a", "b"]];
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
const chainTex = (items) => items.map((x, i) => (i === 0 ? "" : x.op === "/" ? " \\div " : " \\times ") + itemTex(x, i)).join("");
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
const chainSteps = (items, right) => {
  const steps = [];
  const sqs = items.filter((x) => x.sq);
  if (sqs.length) steps.push("累乗を先に計算する。 " + $(sqs.map((x) => `(${ptex(x.m)})^{2}=${ptex(sqv(x))}`).join(",\\ ")));
  const allInt = items.every((x) => Object.values(sqv(x)).every((c) => c[1] === 1));
  const negs = items.filter((x) => coefOf(sqv(x))[0] < 0).length;
  if (allInt) {
    if (negs) steps.push(`負の数が ${negs} 個（${negs % 2 ? "奇数" : "偶数"}個）だから、答えの符号は ${negs % 2 ? "−" : "+"}。`);
    const num = items.filter((x, i) => i === 0 || x.op !== "/").map((x) => absTex(sqv(x))).join(" \\times ");
    const den = items.filter((x, i) => i > 0 && x.op === "/").map((x) => absTex(sqv(x))).join(" \\times ");
    steps.push("1つの分数の形にまとめて、約分する。 " + $(`${chainTex(items)} = ${negs % 2 ? "-" : ""}\\frac{${num}}{${den}} = ${ptex(right)}`));
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
const chainQ = (r, items, hint, head = "次の計算をしたときの答えは、どれか。（÷のあとの項は、全体でわる）") => {
  const right = run(items);
  if (!nonneg(right) || Object.keys(right).length === 0) return { skip: true };
  const rt = ptex(right);
  return {
    q: `${head}${$(chainTex(items))}`,
    ans: $(rt),
    choices: (() => { const w = chainWrongs(items, right); return pick4(r, rt, right, w.main.map(asCand), w.low.map(asCand)); })(),
    hint,
    steps: chainSteps(items, right),
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
    q: `${valsSay(u, v, vals)} のとき、${$(chainTex(items))} の値を求めよう。（÷のあとの項は、全体でわる）`,
    ans: qAns(res),
    hint,
    steps: [
      "先に式を簡単にする。 " + $(`${chainTex(items)} = ${ptex(simp)}`),
      "文字に数を代入する（負の数にはかっこをつける）。 " + $(`${ptex(simp)} = ${substTex(simp, vals)} = ${valTex(res)}`),
    ],
  };
};

// ── 第6時だけの道具 ──────────────────────────────────────────
/** 項を、書いた順にならべた TeX：seqTex([[5,{a:1}],[3,{b:1}],[-2,{a:1}]]) → 5a+3b-2a */
const seqTex = (ts) => ts.map(([c, e], i) => (c < 0 ? "-" : i ? "+" : "") + ptex(term(Math.abs(c), e))).join("");
/** 係数（スロット）の一部を、ありがちなまちがいに置きかえた式のリスト */
const slotPolys = (slots, build) => {
  const right = slots.map((s) => s.right);
  const out = [];
  slots.forEach((s, i) => s.alts.forEach((a) => out.push(build(right.map((x, j) => (j === i ? a : x))))));
  slots.forEach((s, i) => slots.forEach((s2, j) => {
    if (i < j && s.alts.length && s2.alts.length) out.push(build(right.map((x, k) => (k === i ? s.alts[0] : k === j ? s2.alts[0] : x))));
  }));
  return out;
};
/** 係数が分数でもよい式を、「分子 / 分母」（分母は最小の共通分母。約分ずみ）の TeX にする */
const fracForm = (E) => {
  const L = Object.values(E).reduce((a, c) => lcm(a, c[1]), 1);
  const N = pscale(E, L);
  const g = Object.values(N).reduce((a, c) => gcd(a, c[0]), L);
  const N2 = pscale(N, [1, g]);
  return L / g === 1 ? ptex(N2) : `\\frac{${ptex(N2)}}{${L / g}}`;
};
/** 式 E の 1項の係数を ±1 した式（誤答が足りないときの補い） */
const perturbs = (E) => Object.keys(E).flatMap((k) => { const e = expsOfKey(k); return [padd(E, term(1, e)), padd(E, term(-1, e))]; });
const nz = (r, a, b) => rnz(r, a, b);
/** 負の数にはかっこをつける */
const brk = (n) => (n < 0 ? `(${n})` : String(n));

// ── 多項式の次数（06d01・06q01） ───────────────────────────────
const degQ = (r, nTerms, maxDeg) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const seen = new Set(), ts = [];
    for (let i = 0; i < nTerms; i++) {
      const eu = r(0, maxDeg - 1), ev = r(0, maxDeg - 1);
      if (eu + ev < 1 || eu + ev > maxDeg || seen.has(`${eu},${ev}`)) return null;
      seen.add(`${eu},${ev}`);
      ts.push([nz(r, -9, 9), { [u]: eu, [v]: ev }]);
    }
    if (ts[0][0] < 0) ts[0][0] = -ts[0][0];
    const P = poly(...ts);
    const ds = ts.map(([, e]) => Object.values(e).reduce((a, b) => a + b, 0));
    return pterms(P) === nTerms && new Set(ds).size >= 2 && Math.max(...ds) >= 2 ? { ts, P, ds } : null;
  });
  if (!g) return { skip: true };
  const { ts, P, ds } = g, d = pdeg(P);
  return {
    q: `次の多項式は、何次式か。${$(seqTex(ts))}`,
    ans: d,
    unit: "次式",
    hint: "各項の次数をくらべよう。多項式の次数は、そのうちのどれになるのだったかな。",
    steps: ["各項の次数を調べる。 " + ts.map(([c, e], i) => `${$(ptex(term(c, e)))} は ${ds[i]}次`).join("、"), `いちばん大きい次数は ${d} だから、${d}次式。`],
  };
};

// ── 同類項をまとめる（06d02・06q02a） ─────────────────────────────
const likeQ = (r) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const order = shuffle(r, [u, u, v, v]), cs = order.map(() => nz(r, -9, 9));
    if (cs[0] < 0) cs[0] = -cs[0];
    const pu = cs.filter((_, i) => order[i] === u), pv = cs.filter((_, i) => order[i] === v);
    return pu[0] + pu[1] !== 0 && pv[0] + pv[1] !== 0 ? { order, cs, pu, pv } : null;
  });
  const ts = g.order.map((l, i) => [g.cs[i], { [l]: 1 }]);
  const E = poly(...ts), cu = g.pu[0] + g.pu[1], cv = g.pv[0] + g.pv[1];
  const build = ([a, b]) => poly([a, { [u]: 1 }], [b, { [v]: 1 }]);
  const wrongs = slotPolys([
    { right: cu, alts: [g.pu[0] - g.pu[1], Math.abs(g.pu[0]) + Math.abs(g.pu[1]), -cu] },
    { right: cv, alts: [g.pv[0] - g.pv[1], Math.abs(g.pv[0]) + Math.abs(g.pv[1]), -cv] },
  ], build);
  const mix = cu + cv !== 0 ? [poly([cu + cv, { [u]: 1, [v]: 1 }])] : [];   // ちがう文字の項まで、まとめてしまう
  const rt = ptex(E);
  return {
    q: `次の計算をしたときの答えは、どれか。${$(seqTex(ts))}`,
    ans: $(rt),
    choices: pick4(r, rt, E, [...mix, ...wrongs].map(asCand), perturbs(E).map(asCand)),
    hint: "同じ文字の項（同類項）を集めて、係数どうしを計算しよう。",
    steps: ["同類項を集める。 " + $(`${seqTex(ts)} = ${seqTex([...ts.filter(([, e]) => e[u]), ...ts.filter(([, e]) => e[v])])}`), "係数を計算する。 " + $(`= ${rt}`)],
  };
};

// ── かっこのあるひき算（06d03・06q02b・06d14a の下書き） ────────────────
const subGen = (r) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const p1 = r(1, 5), p2 = nz(r, -5, 5), q1 = nz(r, -5, 5), q2 = nz(r, -5, 5);
    return p1 !== q1 && p2 !== q2 && p1 + q1 !== 0 && p2 + q2 !== 0 ? { p1, p2, q1, q2 } : null;
  });
  return { u, v, ...g };
};
const subQ = (r) => {
  const { u, v, p1, p2, q1, q2 } = subGen(r);
  const P = poly([p1, { [u]: 1 }], [p2, { [v]: 1 }]), Q = poly([q1, { [u]: 1 }], [q2, { [v]: 1 }]), E = psub(P, Q);
  const build = ([a, b]) => poly([a, { [u]: 1 }], [b, { [v]: 1 }]);
  const wrongs = [...slotPolys([{ right: p1 - q1, alts: [p1 + q1] }, { right: p2 - q2, alts: [p2 + q2] }], build), pneg(E)];
  const ex = `(${ptex(P)})-(${ptex(Q)})`, rt = ptex(E);
  return {
    q: `次の計算をしたときの答えは、どれか。${$(ex)}`,
    ans: $(rt),
    choices: pick4(r, rt, E, wrongs.map(asCand), perturbs(E).map(asCand)),
    hint: "ひく式のかっこをはずすとき、ひく式の各項の符号は、どうなるのだったかな。",
    steps: ["ひく式の各項の符号を変えて、かっこをはずす。 " + $(`${ex} = ${seqTex([[p1, { [u]: 1 }], [p2, { [v]: 1 }], [-q1, { [u]: 1 }], [-q2, { [v]: 1 }]])}`), "同類項をまとめる。 " + $(`= ${rt}`)],
  };
};

// ── 数をかけたかっこの加減：分配法則（06d04・06q02c・06d15a） ───────────────
const distQ = (r, k2lo) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const k1 = r(2, 5), k2 = r(k2lo, 5), p1 = r(1, 4), p2 = nz(r, -4, 4), q1 = nz(r, -4, 4), q2 = nz(r, -4, 4);
    return k1 * p1 - k2 * q1 !== 0 && k1 * p2 - k2 * q2 !== 0 ? { k1, k2, p1, p2, q1, q2 } : null;
  });
  const { k1, k2, p1, p2, q1, q2 } = g;
  const P = poly([p1, { [u]: 1 }], [p2, { [v]: 1 }]), Q = poly([q1, { [u]: 1 }], [q2, { [v]: 1 }]);
  const E = psub(pscale(P, k1), pscale(Q, k2));
  const build = ([a, b]) => poly([a, { [u]: 1 }], [b, { [v]: 1 }]);
  const wrongs = [...slotPolys([
    { right: k1 * p1 - k2 * q1, alts: [k1 * p1 + k2 * q1, p1 - k2 * q1, k1 * p1 - q1] },
    { right: k1 * p2 - k2 * q2, alts: [k1 * p2 + k2 * q2, p2 - k2 * q2, k1 * p2 - q2] },
  ], build), pneg(E)];
  const ex = `${k1}(${ptex(P)})-${k2 === 1 ? "" : k2}(${ptex(Q)})`, rt = ptex(E);
  return {
    q: `次の計算をしたときの答えは、どれか。${$(ex)}`,
    ans: $(rt),
    choices: pick4(r, rt, E, wrongs.map(asCand), perturbs(E).map(asCand)),
    hint: "数をかけたかっこは、分配法則で、かっこの中の全部の項に数をかけてはずそう。",
    steps: ["分配法則でかっこをはずす。 " + $(`${ex} = ${seqTex([[k1 * p1, { [u]: 1 }], [k1 * p2, { [v]: 1 }], [-k2 * q1, { [u]: 1 }], [-k2 * q2, { [v]: 1 }]])}`), "同類項をまとめる。 " + $(`= ${rt}`)],
  };
};

// ── 多項式を数でわる（06d05・06q02d） ───────────────────────────────
const divNumQ = (r) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const d = pick(r, [2, 3, 4, 5, 6, 8, 9, -2, -3, -4, -6, -8]), x = nz(r, -7, 7), y = nz(r, -7, 7);
    return d < 0 || x < 0 || y < 0 ? { d, x, y } : null;   // 符号のまちがいが、ありうる組だけ
  });
  const { d, x, y } = g, p1 = d * x, p2 = d * y;
  const P = poly([p1, { [u]: 1 }], [p2, { [v]: 1 }]), E = poly([x, { [u]: 1 }], [y, { [v]: 1 }]);
  const build = ([a, b]) => poly([a, { [u]: 1 }], [b, { [v]: 1 }]);
  const dT = d < 0 ? `(${d})` : String(d);
  const wrongs = [build([p1, y]), build([x, p2]), build([-x, y]), build([x, -y]), build([-x, -y])];
  const rt = ptex(E), t1 = ptex(term(p1, { [u]: 1 })), t2 = ptex(term(Math.abs(p2), { [v]: 1 }));
  return {
    q: `次の計算をしたときの答えは、どれか。${$(`(${ptex(P)}) \\div ${dT}`)}`,
    ans: $(rt),
    choices: pick4(r, rt, E, wrongs.map(asCand), perturbs(E).map(asCand)),
    hint: "多項式を数でわるときは、どの項をわればよいかな。逆数をかけると考えてもよい。",
    steps: ["すべての項を、同じ数でわる。 " + $(`(${ptex(P)}) \\div ${dT} = (${t1}) \\div ${dT} ${p2 < 0 ? "-" : "+"} ${t2} \\div ${dT}`), $(`= ${rt}`)],
  };
};

// ── 分数の式の加減（06d06・06d15b） ──────────────────────────────
const PQ = [[2, 3], [3, 2], [3, 4], [4, 3], [2, 5], [5, 2], [3, 5], [5, 3], [4, 5], [5, 4], [2, 4], [4, 2], [3, 6], [6, 3], [4, 6], [6, 4]];
const fracSumQ = (r, op) => {
  const [u, v] = pick(r, PAIRS);
  const sg = op === "+" ? 1 : -1;
  const g = retry(() => {
    const [p, q] = pick(r, PQ), a1 = r(1, 3), b1 = nz(r, -3, 3), a2 = r(1, 3), b2 = nz(r, -3, 3), L = lcm(p, q);
    const k1 = L / p, k2 = L / q;
    if (gcd(gcd(a1, b1), p) !== 1 || gcd(gcd(a2, b2), q) !== 1) return null;   // 分子が分母で約分できる分数は使わない
    return k1 * a1 + sg * k2 * a2 !== 0 && k1 * b1 + sg * k2 * b2 !== 0 ? { p, q, a1, b1, a2, b2, L, k1, k2 } : null;
  });
  const { p, q, a1, b1, a2, b2, L, k1, k2 } = g;
  const P1 = poly([a1, { [u]: 1 }], [b1, { [v]: 1 }]), P2 = poly([a2, { [u]: 1 }], [b2, { [v]: 1 }]);
  const E = padd(pscale(P1, [1, p]), pscale(P2, [sg, q]));
  const f = (num, den) => pscale(num, [1, den]);
  const sP2 = sg === 1 ? P2 : pneg(P2);
  const cands = [
    f(padd(pscale(P1, k1), sP2), L),                                   // 2つめの分子に、かけ忘れる
    f(padd(P1, pscale(P2, sg * k2)), L),                                // 1つめの分子に、かけ忘れる
    f(padd(P1, sP2), L),                                                // 分子にどちらもかけ忘れる
    f(padd(pscale(P1, k1), pscale(P2, -sg * k2)), L),                   // たすとひくを、まちがえる
    f(padd(P1, sP2), p + q),                                            // 分母を たしてしまう
    ...(sg === -1 ? [f(padd(pscale(P1, k1), poly([-k2 * a2, { [u]: 1 }], [k2 * b2, { [v]: 1 }])), L)] : []),   // ひく式の、はじめの項だけ符号を変える
  ].map((val) => ({ tex: fracForm(val), val }));
  const rt = fracForm(E);
  const kp = (k, P) => (k === 1 ? `(${ptex(P)})` : `${k}(${ptex(P)})`);
  const num = padd(pscale(P1, k1), pscale(P2, sg * k2));
  const ex = `\\frac{${ptex(P1)}}{${p}} ${op} \\frac{${ptex(P2)}}{${q}}`;
  const steps = [
    "通分する。 " + $(`${ex} = \\frac{${kp(k1, P1)} ${op} ${kp(k2, P2)}}{${L}}`),
    "分子を整理する。 " + $(`= \\frac{${seqTex([[k1 * a1, { [u]: 1 }], [k1 * b1, { [v]: 1 }], [sg * k2 * a2, { [u]: 1 }], [sg * k2 * b2, { [v]: 1 }]])}}{${L}} = \\frac{${ptex(num)}}{${L}}`),
  ];
  if (rt !== `\\frac{${ptex(num)}}{${L}}`) steps.push("約分できるときは、約分する。 " + $(`= ${rt}`));
  return {
    q: `次の計算をしたときの答えは、どれか。${$(ex)}`,
    ans: $(rt),
    choices: pick4(r, rt, E, cands, perturbs(E).map((val) => ({ tex: fracForm(val), val }))),
    hint: "分母がちがうときは、通分してから、分子を計算しよう。",
    steps,
  };
};

// ── 単項式の積（06d07） ───────────────────────────────────────
const monoProdQ = (r) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const c1 = nz(r, -9, 9), c2 = nz(r, -9, 9), e1 = [r(1, 3), r(0, 2)], e2 = [r(0, 2), r(1, 2)];
    return Math.abs(c1) >= 2 && Math.abs(c2) >= 2 && (c1 < 0 || c2 < 0) && e1[0] + e2[0] >= 2 && e1[1] + e2[1] >= 1 ? { c1, c2, e1, e2 } : null;
  });
  const { c1, c2, e1, e2 } = g;
  const A = term(c1, { [u]: e1[0], [v]: e1[1] }), B = term(c2, { [u]: e2[0], [v]: e2[1] }), E = pmul(A, B);
  const eu = e1[0] + e2[0], ev = e1[1] + e2[1];
  const build = ([c, a, b]) => term(c, { [u]: a, [v]: b });
  const wrongs = slotPolys([
    { right: c1 * c2, alts: [c1 + c2, -c1 * c2] },
    { right: eu, alts: [Math.max(e1[0], e2[0]), e1[0] * e2[0], eu - 1] },
    { right: ev, alts: [Math.max(e1[1], e2[1]), e1[1] * e2[1], ev + 1] },
  ], build);
  const rt = ptex(E), L1 = ptex(term(1, { [u]: e1[0], [v]: e1[1] })), L2 = ptex(term(1, { [u]: e2[0], [v]: e2[1] }));
  return {
    q: `次の計算をしたときの答えは、どれか。${$(`${ptexp(A)} \\times ${ptexp(B)}`)}`,
    ans: $(rt),
    choices: pick4(r, rt, E, wrongs.map(asCand), perturbs(E).map(asCand)),
    hint: "係数どうし、文字どうしをかけよう。同じ文字のかけ算は、指数がどうなるかな。",
    steps: ["係数どうし、文字どうしをかける。 " + $(`${ptexp(A)} \\times ${ptexp(B)} = ${brk(c1)} \\times ${brk(c2)} \\times ${L1} \\times ${L2}`), $(`= ${rt}`)],
  };
};

// ── 単項式の累乗（06d08・06q03a） ───────────────────────────────
const powQ = (r, allowTwoLetters) => {
  const [u, v] = pick(r, PAIRS);
  const c = r(2, 9), s = r(0, 3) ? -1 : 1, two = allowTwoLetters && r(0, 2) === 0;
  const base = term(s * c, two ? { [u]: 1, [v]: 1 } : { [u]: 1 }), E = pmul(base, base);
  const build = ([cc, a, b]) => term(cc, two ? { [u]: a, [v]: b } : { [u]: a });
  const slots = [{ right: c * c, alts: [-c * c, 2 * c, -2 * c, c] }, { right: 2, alts: [1] }];
  if (two) slots.push({ right: 2, alts: [1] });
  const rt = ptex(E);
  return {
    q: `次の計算をしたときの答えは、どれか。${$(`(${ptex(base)})^{2}`)}`,
    ans: $(rt),
    choices: pick4(r, rt, E, slotPolys(slots, build).map(asCand), perturbs(E).map(asCand)),
    hint: "(  )² は、かっこの中の式を 2回かけること。係数にも文字にも 2乗がかかる。",
    steps: [$(`(${ptex(base)})^{2} = (${ptex(base)}) \\times (${ptex(base)})`), "係数どうし、文字どうしをかける。 " + $(`= ${rt}`)],
  };
};

// ── 数・式の値（06d12・06q04） ───────────────────────────────
const bracketValQ = (r, valPick) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const k1 = r(2, 4), k2 = r(2, 4), p1 = r(1, 2), p2 = nz(r, -3, 3), q1 = nz(r, -3, 3), q2 = nz(r, -3, 3);
    return k1 * p1 - k2 * q1 !== 0 && k1 * p2 - k2 * q2 !== 0 && k1 !== k2 ? { k1, k2, p1, p2, q1, q2 } : null;
  });
  const { k1, k2, p1, p2, q1, q2 } = g;
  const P = poly([p1, { [u]: 1 }], [p2, { [v]: 1 }]), Q = poly([q1, { [u]: 1 }], [q2, { [v]: 1 }]);
  const E = psub(pscale(P, k1), pscale(Q, k2));
  const vals = valPick(u, v);
  const ex = `${k1}(${ptex(P)})-${k2}(${ptex(Q)})`, res = peval(E, vals);
  return {
    q: `${valsSay(u, v, vals)} のとき、${$(ex)} の値を求めよう。`,
    ans: qAns(res),
    hint: "かっこをはずして式を簡単にしてから、負の数にはかっこをつけて代入しよう。",
    steps: ["かっこをはずして、整理する。 " + $(`${ex} = ${ptex(E)}`), "文字に数を代入する（負の数にはかっこをつける）。 " + $(`${ptex(E)} = ${substTex(E, vals)} = ${valTex(res)}`)],
  };
};

// ── 式の魔方陣（06d13） ───────────────────────────────────────
// x の係数・y の係数を、それぞれ「縦・横・ななめの和が一定」になる 3×3 の並べ方（0・1・2 のくり返し）でつくる。
const LINES = [[[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]], [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]];
const LATIN = [];
for (const s of [1, 2]) for (const tt of [1, 2]) for (let c = 0; c < 3; c++) {
  const g = (i, j) => (s * i + tt * j + c) % 3;
  if (LINES.every((l) => l.reduce((a, [i, j]) => a + g(i, j), 0) === 3)) LATIN.push((i, j) => g(i, j));
}
/** 2つの並べ方の組が、9マスすべてちがう（x の係数, y の係数）の組になる */
const ORTHO = [];
LATIN.forEach((gx, a) => LATIN.forEach((gy, b) => {
  const seen = new Set();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) seen.add(`${gx(i, j)},${gy(i, j)}`);
  if (seen.size === 9) ORTHO.push([a, b]);
}));
const SYMS = [(i, j) => [i, j], (i, j) => [j, i], (i, j) => [i, 2 - j], (i, j) => [2 - i, j], (i, j) => [2 - i, 2 - j], (i, j) => [j, 2 - i], (i, j) => [2 - j, i], (i, j) => [2 - j, 2 - i]];
const KNOWN = [0, 4, 5, 6, 8], BLANK = [1, 2, 3, 7];

const magicQ = (r) => {
  const [u, v] = pick(r, PAIRS);
  const [a, b] = pick(r, ORTHO), gx = LATIN[a], gy = LATIN[b], sym = pick(r, SYMS);
  const bx = r(1, 2), mx = r(1, 2), by = r(0, 1), my = r(1, 2);
  const grid = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const [si, sj] = sym(i, j); grid.push(poly([bx + mx * gx(si, sj), { [u]: 1 }], [by + my * gy(si, sj), { [v]: 1 }])); }
  const S = poly([3 * bx + 3 * mx, { [u]: 1 }], [3 * by + 3 * my, { [v]: 1 }]);
  const idx = pick(r, BLANK), ansP = grid[idx];
  const cell = (k) => (k === idx ? "\\boxed{?}" : KNOWN.includes(k) ? ptex(grid[k]) : "\\square");
  const arr = `\\begin{array}{|c|c|c|}\\hline ${[0, 1, 2].map((i) => [0, 1, 2].map((j) => cell(3 * i + j)).join(" & ")).join(" \\\\ \\hline ")} \\\\ \\hline\\end{array}`;
  const ac = ptex(ansP);
  const sum = (ks) => ks.map((k) => ptex(grid[k])).join("+");
  const steps = [`左上から右下へのななめの和が、どの列の和でもある。 ${$(`${sum([0, 4, 8])} = ${ptex(S)}`)}`];
  const via = { 3: [[4, 5], "中の段"], 7: [[6, 8], "下の段"], 2: [[4, 6], "右上から左下へのななめ"] }[idx];
  if (idx === 1) {
    steps.push(`まず、右上のマスを、右上から左下へのななめで求める。 ${$(`${ptex(S)} - (${sum([4, 6])}) = ${ptex(grid[2])}`)}`);
    steps.push(`上の段から、 ${$(`${ptex(S)} - (${sum([0, 2])}) = ${ac}`)}`);
  } else {
    steps.push(`${via[1]}から、 ${$(`${ptex(S)} - (${sum(via[0])}) = ${ac}`)}`);
  }
  // ありがちなまちがい：となりあう2マスのかわりに、ちがう2マスの式をひく
  const wrongs = [];
  for (let i = 0; i < KNOWN.length; i++) for (let j = i + 1; j < KNOWN.length; j++) wrongs.push(psub(S, padd(grid[KNOWN[i]], grid[KNOWN[j]])));
  const cu = ansP[`${u}1`] ? ansP[`${u}1`][0] : 0, cv = ansP[`${v}1`] ? ansP[`${v}1`][0] : 0;
  const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [cv - cu, cu - cv]].map(([da, db]) => poly([cu + da, { [u]: 1 }], [cv + db, { [v]: 1 }]));
  const nonNegP = (p) => Object.values(p).every((c) => c[0] > 0) && pterms(p) >= 1;
  return {
    q: `3×3のマスに、縦・横・ななめに並んだ3つの式の和が、どれも等しくなるように式を入れる。□ のマスにも式が入る。？ のマスに入る式は、どれか。${$(arr)}`,
    ans: $(ac),
    choices: pick4(r, ac, ansP, wrongs.filter(nonNegP).map(asCand), [...wrongs, ...near].map(asCand)),
    hint: "縦・横・ななめの和は、どれも同じ。そろっている列から、その和を求めよう。",
    steps,
  };
};

// ── 式の変形のまちがい探し：まちがいの理由を選ぶ（06d14a・b・c） ───────────────
const reasonQ = (r, line, right, wrongs) => ({
  q: `次の計算には、まちがいがある。まちがいの理由として正しいものは、どれか。${$(line)}`,
  ans: right,
  choices: choices4(r, right, wrongs),
});
const ER = (c, l) => $(ptex(term(c, { [l]: 1 })));   // 「5b」「-5b」のような 1つの項の TeX（$ つき）

// 06d14a (3a+2b)−(4a−5b)＝3a+2b−4a−5b＝−a−3b
const err14a = (r) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const p1 = nz(r, -6, 6), p2 = nz(r, -6, 6), c = r(2, 7), d = r(2, 7);
    return p1 !== c && p2 !== d && p2 + d !== 0 && p1 - c !== 0 && p2 - d !== 0 ? { p1, p2, c, d } : null;
  });
  const { p1, p2, c, d } = g;
  const P = poly([p1, { [u]: 1 }], [p2, { [v]: 1 }]), Q = poly([c, { [u]: 1 }], [-d, { [v]: 1 }]);
  const bad = poly([p1 - c, { [u]: 1 }], [p2 - d, { [v]: 1 }]), good = psub(P, Q);
  const line = `(${ptex(P)})-(${ptex(Q)})=${seqTex([[p1, { [u]: 1 }], [p2, { [v]: 1 }], [-c, { [u]: 1 }], [-d, { [v]: 1 }]])}=${ptex(bad)}`;
  const right = `ひく式 ${$(`(${ptex(Q)})`)} のかっこをはずすとき、${ER(-d, v)} の符号を変えていない（正しくは ${ER(d, v)}）。`;
  const wrongs = [
    `${ER(p1, u)} と ${ER(c, u)} の計算が、まちがっている。`,
    `${ER(p2, v)} と ${ER(-d, v)} は同類項ではないので、まとめてはいけない。`,
    `ひかれる式 ${$(`(${ptex(P)})`)} の各項の符号も、変えなければならない。`,
  ];
  const out = reasonQ(r, line, right, wrongs);
  return {
    ...out,
    hint: "かっこの前が − のとき、かっこの中の各項の符号は、どうなるのだったかな。",
    steps: ["ひく式の各項の符号を変えて、かっこをはずす。 " + $(`(${ptex(P)})-(${ptex(Q)}) = ${seqTex([[p1, { [u]: 1 }], [p2, { [v]: 1 }], [-c, { [u]: 1 }], [d, { [v]: 1 }]])}`), "同類項をまとめて、 " + $(`= ${ptex(good)}`) + " が正しい答え。"],
  };
};

// 06d14b (6a−9b)÷3＝2a−9b
const err14b = (r) => {
  const [u, v] = pick(r, PAIRS);
  const d = r(2, 6), k1 = nz(r, -6, 6), k2 = nz(r, -6, 6);
  const P = poly([d * k1, { [u]: 1 }], [d * k2, { [v]: 1 }]), bad = poly([k1, { [u]: 1 }], [d * k2, { [v]: 1 }]), good = poly([k1, { [u]: 1 }], [k2, { [v]: 1 }]);
  const line = `(${ptex(P)}) \\div ${d}=${ptex(bad)}`;
  const right = `${ER(d * k2, v)} も ${$(String(d))} でわらなければならないのに、わっていない。`;
  const wrongs = [
    `${ER(d * k1, u)} を ${$(String(d))} でわった ${ER(k1, u)} が、まちがっている。`,
    `わる数 ${$(String(d))} は、負の数にしてから計算しなければならない。`,
    `文字がちがう項は、わり算ができないので、そのまま残す決まりである。`,
  ];
  const out = reasonQ(r, line, right, wrongs);
  return {
    ...out,
    hint: "多項式を数でわるとき、数でわるのは、どの項だったかな。",
    steps: ["すべての項を、同じ数でわる。 " + $(`(${ptex(P)}) \\div ${d} = ${ptex(good)}`), `正しい答えは ${$(ptex(good))}。`],
  };
};

// 06d14c 2a×3a＝6a
const err14c = (r) => {
  const u = pick(r, ["a", "b", "x", "y"]);
  const c1 = r(2, 9), c2 = r(2, 9);
  const bad = term(c1 * c2, { [u]: 1 }), good = term(c1 * c2, { [u]: 2 });
  const line = `${ptex(term(c1, { [u]: 1 }))} \\times ${ptex(term(c2, { [u]: 1 }))}=${ptex(bad)}`;
  const right = `${$(`${u} \\times ${u}`)} は ${$(`${u}^{2}`)} になるのに、${$(u)} のままにしている。`;
  const wrongs = [
    `${$(`${c1} \\times ${c2}`)} の計算が、まちがっている。`,
    `文字どうしのかけ算は、係数をたしてまとめるので、${$(ptex(term(c1 + c2, { [u]: 1 })))} になる。`,
    `同じ文字をかけるときは、文字を消して、数だけにする。`,
  ];
  const out = reasonQ(r, line, right, wrongs);
  return {
    ...out,
    hint: "同じ文字をかけるとき、指数はどうなるのだったかな。",
    steps: ["係数どうし、文字どうしをかける。 " + $(`${ptex(term(c1, { [u]: 1 }))} \\times ${ptex(term(c2, { [u]: 1 }))} = ${c1} \\times ${c2} \\times ${u} \\times ${u} = ${ptex(good)}`), `正しい答えは ${$(ptex(good))}。`],
  };
};

// ── 2つの式 A、B の和と差から、A・B を求める（06d16a・b） ──────────────────
const abQ = (r, who) => {
  const [u, v] = pick(r, PAIRS);
  const g = retry(() => {
    const a1 = nz(r, -4, 4), a2 = nz(r, -4, 4), b1 = nz(r, -4, 4), b2 = nz(r, -4, 4);
    return a1 + b1 !== 0 && a2 + b2 !== 0 && a1 - b1 !== 0 && a2 - b2 !== 0 && !(a1 === b1 && a2 === b2) ? { a1, a2, b1, b2 } : null;
  });
  const { a1, a2, b1, b2 } = g;
  const A = poly([a1, { [u]: 1 }], [a2, { [v]: 1 }]), B = poly([b1, { [u]: 1 }], [b2, { [v]: 1 }]);
  const S = padd(A, B), D = psub(A, B), X = who === "A" ? A : B;
  const sum2 = padd(S, D), dif2 = psub(S, D);
  const cands = who === "A" ? [sum2, B, dif2, pneg(A), S, D] : [dif2, A, sum2, pneg(B), S, D];
  const rt = ptex(X);
  return {
    q: `2つの式 ${$("A")}、${$("B")} があり、${$(`A+B=${ptex(S)}`)}、${$(`A-B=${ptex(D)}`)} である。${$(who)} を表す式は、どれか。`,
    ans: $(rt),
    choices: pick4(r, rt, X, cands.map(asCand), perturbs(X).map(asCand)),
    hint: who === "A" ? "2つの式を辺々たすと、B が消える。" : "2つの式を辺々ひくと、A が消える。",
    steps: who === "A"
      ? ["2つの式をたすと、B が消える。 " + $(`(A+B)+(A-B) = 2A = (${ptex(S)})+(${ptex(D)}) = ${ptex(sum2)}`), $(`A = ${rt}`)]
      : ["2つの式をひくと、A が消える。 " + $(`(A+B)-(A-B) = 2B = (${ptex(S)})-(${ptex(D)}) = ${ptex(dif2)}`), $(`B = ${rt}`)],
  };
};

// ── 円錐と円柱の体積（06q05a・b） ───────────────────────────────
const CONES = [];
for (const p of [3, 6, 9]) for (const q of [1, 2, 3, 4, 5, 6]) for (const s of [1, 2, 3]) {
  const k = qdiv([p * p * q, 1], [3 * s * s, 1]);
  if (k[1] === 1 && k[0] >= 1 && k[0] <= 24 && s < p) CONES.push({ p, q, s, k: k[0] });
}
const coneQ = (r, numeric) => {
  const { p, q, s, k } = pick(r, CONES);
  const [u, v] = pick(r, [["a", "b"], ["x", "y"]]);
  const rad = ptex(term(p, { [u]: 1 })), hei = ptex(term(q, { [v]: 1 })), rad2 = ptex(term(s, { [u]: 1 }));
  const base = `底面の半径が ${$(rad)} cm、高さが ${$(hei)} cm の円錐の体積は、底面の半径が ${$(rad2)} cm の円柱の体積と等しい。`;
  const Vc = qdiv([p * p * q, 1], [3, 1]);
  const V = `${Vc[0] === 1 && Vc[1] === 1 ? "" : qtex(Vc)}\\pi ${u}^{2}${v}`;
  const steps = [
    "円錐の体積 ＝ 底面積 × 高さ ÷ 3 より、 " + $(`\\frac{1}{3} \\times \\pi \\times (${rad})^{2} \\times ${hei} = ${V}`),
    "円柱の高さを " + $("h") + " cm とすると、 " + $(`\\pi \\times ${s === 1 ? `${u}^{2}` : `(${rad2})^{2}`} \\times h = ${V}`),
  ];
  if (numeric) {
    const a = r(1, 4), b = r(1, 5);
    return {
      q: `${base}${$(`${u}=${a}`)}、${$(`${v}=${b}`)} のとき、この円柱の高さは何 cm か。`,
      ans: k * b,
      unit: "cm",
      hint: "円錐の体積は、底面積×高さ÷3。円柱の体積は、底面積×高さ。",
      steps: [...steps, $(`h = ${V} \\div ${s * s === 1 ? "" : s * s}\\pi ${u}^{2} = ${k}${v}`) + `。 ${$(`${v}=${b}`)} だから ${k * b}（cm）`],
    };
  }
  const rt = ptex(term(k, { [v]: 1 }));
  const wr = [3 * k, qdiv([p * q, 1], [3 * s * s, 1]), qdiv([k, 1], [3, 1]), 2 * k, k + 3, k - 1].map((c) => (Array.isArray(c) ? c : [c, 1]));
  return {
    q: `${base}この円柱の高さを、${$(u)}、${$(v)} を使った式で表すと、どれか。`,
    ans: $(rt),
    choices: pick4(r, rt, term(k, { [v]: 1 }), wr.map((c) => asCand(term(c, { [v]: 1 }))), [asCand(term(k + 1, { [v]: 1 })), asCand(term(k + 2, { [v]: 1 }))]),
    hint: "円錐の体積を、底面積×高さ÷3 で表して、円柱の体積の式と等しいとおこう。",
    steps: [...steps, $(`h = ${V} \\div ${s * s === 1 ? "" : s * s}\\pi ${u}^{2} = ${rt}`)],
  };
};

export const UNITS = [
  unit("06", {
    name: "式の計算ビンゴ（第1〜5時の復習）",
    desc: "次数・同類項・加減・数との乗除・単項式の乗除・式の値をたしかなものに",
    prereqs: ["J2-sk05"],
    points: [
      "多項式の次数は、各項の次数のうち、いちばん大きいもの。同類項は、係数を計算して 1つの項にまとめる。",
      "ひき算は、ひく式の各項の符号を変えてかっこをはずす。多項式に数をかけるときは分配法則を使い、数でわるときは、すべての項をその数でわる（逆数をかけると考えてもよい）。",
      "単項式の乗除は、1つの分数の形にして約分する。式の値は、式を簡単にしてから、負の数にはかっこをつけて代入する。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 06d01 多項式の次数（4ab²−a³+b は何次式か）
        t("06d01", (r) => degQ(r, 3, 4)),
        // 06d02 同類項をまとめる（5a+3b−2a+4b）
        t("06d02", (r) => likeQ(r)),
        // 06d03 かっこのあるひき算（(2x−3y)−(5x−y)）
        t("06d03", (r) => subQ(r)),
        // 06d04 分配法則（3(4x−y)−5(x−2y)）
        t("06d04", (r) => distQ(r, 2)),
        // 06d05 多項式を数でわる（(−20a+8b)÷4）
        t("06d05", (r) => divNumQ(r)),
        // 06d06 分数の式の加法（(x−y)/4+(2x+3y)/3）
        t("06d06", (r) => fracSumQ(r, "+")),
        // 06q01 小テスト（1）多項式の次数（xy³−y²+x）
        t("06q01", (r) => degQ(r, 3, 4)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 06d07 単項式の積（(−2x²y)×5xy）
        t("06d07", (r) => monoProdQ(r)),
        // 06d08 単項式の累乗（(−7a)²）
        t("06d08", (r) => powQ(r, false)),
        // 06d09 分数でわる（14xy÷(−7/3 x)）
        t("06d09", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const p = pick(r, [2, 3, 5, 7]), q = pick(r, [2, 3, 4, 5]), c1 = r(4, 30);
            const res = qdiv(qmul([c1, 1], [q, 1]), [-p, 1]);
            return gcd(p, q) === 1 && res[1] === 1 && Math.abs(res[0]) <= 30 ? [it(null, c1, { [u]: 1, [v]: 1 }), it("/", [-p, q], { [u]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "分数でわるときは、わる式の逆数をかけると考えよう。");
        }),
        // 06d10 乗除の混じった式（8a²b×3b÷6ab）
        t("06d10", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const c1 = r(2, 12), c2 = r(2, 6), c3 = r(2, 12);
            return (c1 * c2) % c3 === 0 && (c1 * c2) / c3 <= 24 && c3 !== c1 ? [it(null, c1, { [u]: 2, [v]: 1 }), it("*", c2, { [v]: 1 }), it("/", c3, { [u]: 1, [v]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "かける式は分子、わる式は分母にして、1つの分数にまとめよう。");
        }),
        // 06d11 符号をふくむ乗除（(−6ab)×4a÷(−8b)）
        t("06d11", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const s = [sgn(r), sgn(r), sgn(r)];
            if (s.every((x) => x > 0)) return null;
            const c1 = r(2, 9), c2 = r(2, 8), c3 = r(2, 12);
            return (c1 * c2) % c3 === 0 && (c1 * c2) / c3 <= 24 ? [it(null, s[0] * c1, { [u]: 1, [v]: 1 }), it("*", s[1] * c2, { [u]: 1 }), it("/", s[2] * c3, { [v]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "−の数が奇数個か偶数個かで、答えの符号を先に決めよう。");
        }),
        // 06d12 式の値（a＝−3、b＝2 のとき 3(a+2b)−2(2a−b)）
        t("06d12", (r) => bracketValQ(r, (u, v) => ({ [u]: -r(1, 5), [v]: r(1, 5) }))),
        // 06q02a 小テスト（2）① 4a+5b−a−2b
        t("06q02a", (r) => likeQ(r)),
        // 06q02b 小テスト（2）② (3x−y)−(x−4y)
        t("06q02b", (r) => subQ(r)),
        // 06q02c 小テスト（2）③ 5(a−b)−(3a−4b)
        t("06q02c", (r) => distQ(r, 1)),
        // 06q02d 小テスト（2）④ (−24a+16b)÷(−8)
        t("06q02d", (r) => divNumQ(r)),
        // 06q03a 小テスト（3）① (−6y)²
        t("06q03a", (r) => powQ(r, true)),
        // 06q03b 小テスト（3）② 32ab÷(−8b)
        t("06q03b", (r) => {
          const [u, v] = pick(r, PAIRS);
          const c2 = r(2, 9), k = r(2, 8);
          return chainQ(r, [it(null, c2 * k, { [u]: 1, [v]: 1 }), it("/", -c2, { [v]: 1 })], "わる式の係数と文字を、分母に書いて約分しよう。−の数があるときの符号にも気をつけよう。");
        }),
        // 06q03c 小テスト（3）③ 6x²y×4y÷12xy
        t("06q03c", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const c1 = r(2, 9), c2 = r(2, 9), c3 = r(6, 18);
            return (c1 * c2) % c3 === 0 && (c1 * c2) / c3 <= 12 && c3 > c1 ? [it(null, c1, { [u]: 2, [v]: 1 }), it("*", c2, { [v]: 1 }), it("/", c3, { [u]: 1, [v]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "かける式は分子、わる式は分母にして、約分しよう。");
        }),
        // 06q04 小テスト（4）a＝3、b＝−2 のとき 2(a+2b)−3(a−b)
        t("06q04", (r) => bracketValQ(r, (u, v) => ({ [u]: r(1, 5), [v]: -r(1, 5) }))),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 06d13 式の魔方陣（縦・横・ななめの和が等しい）
        t("06d13", (r) => magicQ(r)),
        // 06d14a まちがい探し① (3a+2b)−(4a−5b)＝3a+2b−4a−5b＝−a−3b
        t("06d14a", (r) => err14a(r)),
        // 06d14b まちがい探し② (6a−9b)÷3＝2a−9b
        t("06d14b", (r) => err14b(r)),
        // 06d14c まちがい探し③ 2a×3a＝6a
        t("06d14c", (r) => err14c(r)),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 06d15a 入試（1）5(x−2y)−2(3x−4y)
        t("06d15a", (r) => distQ(r, 2)),
        // 06d15b 入試（2）(3a+b)/5−(a−2b)/2
        t("06d15b", (r) => fracSumQ(r, "-")),
        // 06d15c 入試（3）(−5x)²×2y÷(−10xy)
        t("06d15c", (r) => {
          const [u, v] = pick(r, PAIRS);
          const items = retry(() => {
            const c1 = r(2, 9), c2 = r(2, 6), c3 = r(3, 20);
            return (c1 * c1 * c2) % c3 === 0 && (c1 * c1 * c2) / c3 <= 30 ? [it(null, -c1, { [u]: 1 }, true), it("*", c2, { [v]: 1 }), it("/", -c3, { [u]: 1, [v]: 1 })] : null;
          });
          if (!items) return { skip: true };
          return chainQ(r, items, "累乗を先に計算し、符号を決めてから、分数の形にして約分しよう。");
        }),
        // 06d16a 入試 A+B と A−B から A を求める
        t("06d16a", (r) => abQ(r, "A")),
        // 06d16b 入試 A+B と A−B から B を求める
        t("06d16b", (r) => abQ(r, "B")),
        // 06q05a 小テスト チャレンジ：円錐と円柱の体積から、円柱の高さを式で表す
        t("06q05a", (r) => coneQ(r, false)),
        // 06q05b 同じ問題を、a、b に数を入れたときの高さ（cm）で聞く
        t("06q05b", (r) => coneQ(r, true)),
      ],
    },
  }),
];

// 移さなかった問題：なし
//   ビンゴ（ア〜シ）の12問（dr.1〜12）は、それぞれ1問の計算問題（数値入力か4択）として移した。
//   dr.13（式の魔方陣：表に式を書き入れる）は、3×3のマスを文章と式で見せ、？のマスに入る式を選ぶ4択にした。
//   dr.14（まちがい探し：説明して正しく計算する）は、「まちがいの理由として正しいもの」を選ぶ4択（06d14a・b・c）にした。
//   dr.16（A、B を求める）は、A と B を別々の4択（06d16a・b）にした。qz.5（円錐と円柱）は、式を選ぶ4択（06q05a）と、数を入れた高さ（06q05b）にした。
export const SKIPPED = [];
