// ============================================================
// tex.js — 数を TeX の文字列にする小道具
//
//  問題文は「文章＋$…$で囲んだ TeX」の混在文字列（マークアップ）で持つ。
//  表示は ui 側で KaTeX に渡す。ここは純粋な文字列整形だけ。
// ============================================================
import { toQ, toDecimalString } from "./rational.js";

/** 有理数 → TeX。整数はそのまま、分数は \frac。負は先頭に - */
export function tq(q) {
  q = toQ(q);
  if (q.d === 1) return String(q.n);
  return `${q.n < 0 ? "-" : ""}\\frac{${Math.abs(q.n)}}{${q.d}}`;
}

/** 分子・分母から \frac（約分しない。約分前の途中式に使う） */
export function tfrac(n, d) {
  return `\\frac{${n}}{${d}}`;
}

/** 負なら ( ) で囲む。式の中に数を埋め込むとき用 */
export function tp(q) {
  q = toQ(q);
  return q.n < 0 ? `(${tq(q)})` : tq(q);
}

/** 符号つき（項として並べるとき）。正なら + を付ける */
export function ts(q) {
  q = toQ(q);
  return q.n < 0 ? tq(q) : `+${tq(q)}`;
}

/** 仮分数 → 帯分数の TeX（整数部が 0 なら通常の分数） */
export function tmixed(q) {
  q = toQ(q);
  const a = Math.abs(q.n);
  const w = Math.floor(a / q.d);
  const r = a % q.d;
  const sign = q.n < 0 ? "-" : "";
  if (q.d === 1) return `${sign}${w}`;
  if (w === 0) return `${sign}\\frac{${r}}{${q.d}}`;
  if (r === 0) return `${sign}${w}`;
  return `${sign}${w}\\frac{${r}}{${q.d}}`;
}

/** 有限小数なら小数の TeX（例 3/4 → 0.75）。そうでなければ null */
export function tdec(q) {
  return toDecimalString(q);
}

/** 浮動小数を n 桁に丸めて、末尾の 0 を落とした文字列にする */
export function fmt(x, digits = 6) {
  if (Number.isInteger(x)) return String(x);
  let s = x.toFixed(digits);
  s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}

/** 整数の桁区切り（4桁ごとではなく3桁ごとのカンマ） */
export function comma(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** $…$ で囲む */
export const m = (tex) => `$${tex}$`;

/** 平方根の TeX（a√b の形。a=1 なら √b、b=1 なら a） */
export function tsqrt(a, b) {
  if (b === 1) return String(a);
  const inner = `\\sqrt{${b}}`;
  if (a === 1) return inner;
  if (a === -1) return `-${inner}`;
  return `${a}${inner}`;
}

/** 度 */
export const deg = (x) => `${x}^{\\circ}`;
