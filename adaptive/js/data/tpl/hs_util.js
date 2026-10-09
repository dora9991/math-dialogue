// ============================================================
// tpl/hs_util.js — 高校範囲のテンプレで使う小道具
//
//  ここにあるのは、テンプレの「答えを別の方法で確かめる」ための道具が中心。
//  （数値微分・数値積分・順列組合せの全数チェックなど）
// ============================================================
import { Q, toQ, mul, add, sub, div, neg, num as qnum } from "../../core/rational.js";
import { Poly } from "../../core/poly.js";
import { assert } from "./util.js";

/** 階乗・順列・組合せ */
export function fact(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
export const nPr = (n, k) => (k < 0 || k > n ? 0 : fact(n) / fact(n - k));
export function nCr(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** 浮動小数の一致（相対 1e-7 まで） */
export function nearly(a, b, msg = "数値が一致しない", tol = 1e-7) {
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  if (!ok) throw new Error(`${msg}: ${a} vs ${b}`);
}

/** 数値微分（5 点公式） */
export function numDeriv(f, x, h = 1e-3) {
  return (-f(x + 2 * h) + 8 * f(x + h) - 8 * f(x - h) + f(x - 2 * h)) / (12 * h);
}

/** 数値積分（シンプソン則） */
export function numInteg(f, a, b, n = 4000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** 根 [r1, r2, …] から monic な多項式 ∏(x − ri)（x は変数名） */
export function polyFromRoots(roots, v = "x") {
  let p = Poly.const(1);
  for (const r of roots) p = p.mul(Poly.v(v, 1).sub(Poly.const(r)));
  return p;
}

/** 多項式（単変数）の不定積分（定数項なし）。係数は有理数のまま */
export function polyIntegral(p, v = "x") {
  let out = new Poly();
  for (const tm of p.t.values()) {
    const k = tm.e[v] || 0;
    out = out.add(Poly.mono(div(tm.c, k + 1), { [v]: k + 1 }));
  }
  return out;
}

/** 多項式（単変数）の導関数 */
export function polyDeriv(p, v = "x") {
  let out = new Poly();
  for (const tm of p.t.values()) {
    const k = tm.e[v] || 0;
    if (k > 0) out = out.add(Poly.mono(mul(tm.c, k), k - 1 ? { [v]: k - 1 } : {}));
  }
  return out;
}

/** 単変数の多項式を JS 関数にする（数値検算用。浮動小数のホーナー法なので、小数を代入しても桁あふれしない） */
export function polyFn(p, v = "x") {
  const deg = p.degree();
  const cs = Array.from({ length: deg + 1 }, (_, k) => qnum(p.coeff(k, v)));
  return (x) => {
    let s = 0;
    for (let k = deg; k >= 0; k--) s = s * x + cs[k];
    return s;
  };
}

/** 単変数多項式の定積分 ∫_a^b（厳密） */
export function defInteg(p, a, b, v = "x") {
  const F = polyIntegral(p, v);
  return sub(F.eval({ [v]: b }), F.eval({ [v]: a }));
}

/** 係数の配列 [定数項, 1次, …] を取り出す（次数 deg まで） */
export function coeffsOf(p, deg, v = "x") {
  return Array.from({ length: deg + 1 }, (_, k) => p.coeff(k, v));
}

/**
 * 多項式のわり算（筆算）。係数は低次から並べた配列（数 or Q）。
 *  num = div × quo + rem となる { quo, rem }（どちらも Q の配列。rem は div より低次）
 *  ※ 剰余の定理や因数定理を使わず、筆算そのままで商と余りを出す（テンプレの答えの検算用）
 */
export function polyDivMod(numC, divC) {
  const rem = numC.map(toQ);
  const d = divC.map(toQ);
  const dd = d.length - 1;
  const lead = d[dd];
  const quo = Array(Math.max(rem.length - dd, 1)).fill(Q(0));
  for (let i = rem.length - 1; i >= dd; i--) {
    const c = div(rem[i], lead);
    quo[i - dd] = c;
    for (let j = 0; j <= dd; j++) rem[i - dd + j] = sub(rem[i - dd + j], mul(c, d[j]));
  }
  return { quo, rem: rem.slice(0, dd) };
}

/** ローラン多項式（負の指数もある）の n 乗。terms は { 指数: 係数(Q or 数) } → 同じ形 */
export function laurentPow(terms, n) {
  let cur = { 0: Q(1) };
  for (let i = 0; i < n; i++) {
    const next = {};
    for (const [e1, c1] of Object.entries(cur)) {
      for (const [e2, c2] of Object.entries(terms)) {
        const e = Number(e1) + Number(e2);
        next[e] = add(next[e] ?? Q(0), mul(c1, c2));
      }
    }
    cur = next;
  }
  return cur;
}

/** 整数の平方根（完全平方数なら整数、そうでなければ null） */
export function isqrt(n) {
  if (n < 0) return null;
  const s = Math.round(Math.sqrt(n));
  return s * s === n ? s : null;
}

/** 配列から重複を除く（要素が文字列のとき） */
export const uniq = (arr) => [...new Set(arr)];

/** 「1 / 2 / 3」のように整数を最大公約数で約分した [a, b] */
export function reduceInts(a, b) {
  const g = (function gcd2(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) [x, y] = [y, x % y];
    return x;
  })(a, b);
  return [a / g, b / g];
}

export { assert, Q, mul, add, sub, div, neg };
