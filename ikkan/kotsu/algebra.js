// ============================================================
// algebra.js — 式の計算・連立方程式の問題用の道具：有理数・多項式（文字は何種類でも）・連立方程式を「計算で」出す
//
//  問題を書くとき、式の展開・計算の答えを手で書かない。多項式をつくって、padd・pmul・pdivMono などで計算し、ptex で TeX にする。
//  答えは、有理数 Q（[分子, 分母]。約分済み・分母は正）。入力式の答えには fracAns(...q) を使う（kit.js）。
// ============================================================
import { gcd } from "./kit.js";

// ── 有理数 ───────────────────────────────────────────────
/** 約分済みの [分子, 分母] */
export const Q = (n, d = 1) => {
  if (d === 0) throw new Error("分母が 0");
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
};
export const qadd = (a, b) => Q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const qsub = (a, b) => Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const qmul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
export const qdiv = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
export const qneg = (a) => [-a[0], a[1]];
export const qiszero = (a) => a[0] === 0;
export const qeq = (a, b) => a[0] === b[0] && a[1] === b[1];
export const qisint = (a) => a[1] === 1;
export const qval = (a) => a[0] / a[1];
/** TeX："3"、"-\frac{3}{4}" */
export const qtex = (a) => (a[1] === 1 ? String(a[0]) : `${a[0] < 0 ? "-" : ""}\\frac{${Math.abs(a[0])}}{${a[1]}}`);

// ── 多項式（単項式の和。文字は、1文字の英小文字）──────────────
// 内部の形：{ 単項式のキー: Q }。キーは、"x2y1" のように、文字の名前順に「文字＋指数」をならべたもの（定数項は ""）。
const keyOf = (exps) => Object.keys(exps).filter((v) => exps[v] !== 0).sort().map((v) => v + exps[v]).join("");
const expsOf = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
const degOf = (exps) => Object.values(exps).reduce((a, c) => a + Math.max(0, c), 0);
const clean = (p) => { const o = {}; for (const k of Object.keys(p)) if (!qiszero(p[k])) o[k] = p[k]; return o; };

/** 単項式 coef×(文字^指数)。term(3, {x:2, y:1}) ＝ 3x²y。coef は整数か Q */
export const term = (coef, exps = {}) => clean({ [keyOf(exps)]: Array.isArray(coef) ? Q(...coef) : Q(coef) });
/** 多項式：poly([3, {x:2}], [-2, {x:1}], [5, {}]) ＝ 3x²−2x+5 */
export const poly = (...ts) => ts.reduce((p, [c, e]) => padd(p, term(c, e || {})), {});
export const padd = (p, q) => { const o = { ...p }; for (const k of Object.keys(q)) o[k] = o[k] ? qadd(o[k], q[k]) : q[k]; return clean(o); };
export const pneg = (p) => { const o = {}; for (const k of Object.keys(p)) o[k] = qneg(p[k]); return o; };
export const psub = (p, q) => padd(p, pneg(q));
export const pscale = (p, c) => { const cq = Array.isArray(c) ? Q(...c) : Q(c), o = {}; for (const k of Object.keys(p)) o[k] = qmul(p[k], cq); return clean(o); };
export const pmul = (p, q) => {
  let o = {};
  for (const a of Object.keys(p)) for (const b of Object.keys(q)) {
    const e = { ...expsOf(a) }; for (const [v, n] of Object.entries(expsOf(b))) e[v] = (e[v] || 0) + n;
    o = padd(o, { [keyOf(e)]: qmul(p[a], q[b]) });
  }
  return o;
};
/** 単項式でわる（わる式は term(...) でつくった 1項の式）。指数が負になっていいなら、結果は分母に文字が出る */
export const pdivMono = (p, m) => {
  const mk = Object.keys(m)[0], me = expsOf(mk), mc = m[mk];
  let o = {};
  for (const k of Object.keys(p)) {
    const e = { ...expsOf(k) }; for (const [v, n] of Object.entries(me)) e[v] = (e[v] || 0) - n;
    o = padd(o, { [keyOf(e)]: qdiv(p[k], mc) });
  }
  return o;
};
/** 文字に数（Q か整数）を入れる。vars：{ x: 3, y: [-1, 2] }。足りない文字があればエラー */
export const peval = (p, vars) => {
  let s = Q(0);
  for (const k of Object.keys(p)) {
    let t = p[k];
    for (const [v, n] of Object.entries(expsOf(k))) {
      if (!(v in vars)) throw new Error(`文字 ${v} の値がない`);
      const x = Array.isArray(vars[v]) ? vars[v] : Q(vars[v]);
      for (let i = 0; i < Math.abs(n); i++) t = n > 0 ? qmul(t, x) : qdiv(t, x);
    }
    s = qadd(s, t);
  }
  return s;
};
export const pdeg = (p) => Math.max(0, ...Object.keys(p).map((k) => degOf(expsOf(k))));
export const pterms = (p) => Object.keys(p).length;
export const pisz = (p) => Object.keys(p).length === 0;
export const peq = (p, q) => pisz(psub(p, q));

/** 単項式の TeX（符号はつけない。係数の絶対値だけ）。係数が分数のときは、\frac{2xy}{3} の形（文字は、分子に入れる）。分母に文字が出るときは \frac{3}{2x} */
const monoBody = (coefAbs, exps) => {
  const vs = Object.keys(exps).filter((v) => exps[v] !== 0).sort();
  const pw = (v, n) => v + (n === 1 ? "" : `^{${n}}`);
  const num = vs.filter((v) => exps[v] > 0).map((v) => pw(v, exps[v])).join("");
  const den = vs.filter((v) => exps[v] < 0).map((v) => pw(v, -exps[v])).join("");
  const [n, d] = coefAbs;
  const top = num ? (n === 1 ? "" : String(n)) + num : String(n);   // 分子（係数 1 は省く。文字がなければ、数）
  const bot = (d === 1 ? "" : String(d)) + den;                   // 分母
  return bot ? `\\frac{${top}}{${bot}}` : top;
};
/** 項のならび（TeX にするとき）：次数の高い順、同じ次数なら、文字の名前順に、指数の大きいほうを先に、定数項は最後 */
const sortedKeys = (p, order) => Object.keys(p).sort((a, b) => {
  const ea = expsOf(a), eb = expsOf(b), da = degOf(ea), db = degOf(eb);
  if (da !== db) return db - da;
  const vs = order || [...new Set([...Object.keys(ea), ...Object.keys(eb)])].sort();
  for (const v of vs) { const x = (ea[v] || 0) - (eb[v] || 0); if (x) return -x; }
  return 0;
});
/** 多項式の TeX。例 3x^{2}-2xy+5。order：文字の優先順（省略すると名前順）。0 のときは "0" */
export const ptex = (p, order) => {
  const ks = sortedKeys(p, order);
  if (!ks.length) return "0";
  return ks.map((k, i) => {
    const c = p[k], neg = c[0] < 0, body = monoBody([Math.abs(c[0]), c[1]], expsOf(k));
    return (i === 0 ? (neg ? "-" : "") : neg ? "-" : "+") + body;
  }).join("");
};
/** かっこつき："(" + ptex + ")"（2項以上のとき。1項なら、そのまま。負の1項は、かっこをつける） */
export const ptexp = (p, order) => (pterms(p) > 1 || Object.values(p).some((c) => c[0] < 0) ? `(${ptex(p, order)})` : ptex(p, order));

// ── 連立方程式 ───────────────────────────────────────────
/** a x + b y = c の TeX（係数 0 の項は書かない。1・−1 の係数は省く）。vars：['x','y'] */
export const linTex = (a, b, c, vars = ["x", "y"]) => {
  const p = poly([a, { [vars[0]]: 1 }], [b, { [vars[1]]: 1 }]);
  return `${ptex(p, vars)}=${c}`;
};
/** 連立方程式の TeX（KaTeX の cases）。eqs：['2x+y=7', 'x-y=2']（TeX の文字列）の配列 */
export const casesTex = (eqs) => `\\begin{cases}${eqs.join("\\\\")}\\end{cases}`;
/** a1x+b1y=c1, a2x+b2y=c2 の解 [x, y]（Q）。一意に決まらないなら null */
export const solve2 = ([a1, b1, c1], [a2, b2, c2]) => {
  const det = a1 * b2 - a2 * b1;
  if (det === 0) return null;
  return [Q(c1 * b2 - c2 * b1, det), Q(a1 * c2 - a2 * c1, det)];
};
