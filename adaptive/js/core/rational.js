// ============================================================
// rational.js — 有理数（分数）の厳密計算と、入力文字列の解釈
//
//  Q = { n, d }（d > 0、既約）。答えの照合は必ずこの厳密比較で行う
//  （0.1+0.2 のような浮動小数点の誤差で正誤が変わらないように）。
// ============================================================

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** 有理数を作る。Q(6,-8) → {n:-3,d:4} */
export function Q(n, d = 1) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) throw new Error(`Q: 不正な分数 ${n}/${d}`);
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`Q: 整数でない ${n}/${d}`);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  const r = { n: n / g, d: d / g };
  if (!Number.isSafeInteger(r.n) || !Number.isSafeInteger(r.d)) throw new Error("Q: 桁あふれ");
  return r;
}

/**
 * 数または Q を Q に揃える。
 * 小数の JS 数値（152.5 など）は、有限小数として厳密に読みかえる（1e-9 までの誤差は許す）。
 */
export function toQ(x) {
  if (typeof x === "number") {
    if (Number.isInteger(x)) return Q(x, 1);
    for (let k = 1; k <= 9; k++) {
      const scale = Math.pow(10, k);
      const n = Math.round(x * scale);
      if (Math.abs(n / scale - x) < 1e-9) return Q(n, scale);
    }
    throw new Error(`toQ: 有限小数として扱えない数 ${x}`);
  }
  return x;
}

export const add = (a, b) => ((a = toQ(a)), (b = toQ(b)), Q(a.n * b.d + b.n * a.d, a.d * b.d));
export const sub = (a, b) => ((a = toQ(a)), (b = toQ(b)), Q(a.n * b.d - b.n * a.d, a.d * b.d));
export const mul = (a, b) => ((a = toQ(a)), (b = toQ(b)), Q(a.n * b.n, a.d * b.d));
export const div = (a, b) => {
  a = toQ(a);
  b = toQ(b);
  if (b.n === 0) throw new Error("Q: 0 でわった");
  return Q(a.n * b.d, a.d * b.n);
};
export const neg = (a) => ((a = toQ(a)), Q(-a.n, a.d));
export const abs = (a) => ((a = toQ(a)), Q(Math.abs(a.n), a.d));
export const inv = (a) => div(1, a);
export const eq = (a, b) => ((a = toQ(a)), (b = toQ(b)), a.n === b.n && a.d === b.d);
export const cmp = (a, b) => ((a = toQ(a)), (b = toQ(b)), a.n * b.d - b.n * a.d);
export const isInt = (a) => toQ(a).d === 1;
export const num = (a) => ((a = toQ(a)), a.n / a.d);

/** べき乗（整数指数、負も可） */
export function pow(a, k) {
  a = toQ(a);
  if (k < 0) return pow(inv(a), -k);
  let r = Q(1);
  for (let i = 0; i < k; i++) r = mul(r, a);
  return r;
}

/** 有限小数で表せるなら、その文字列（例: 3/4 → "0.75"）。表せなければ null */
export function toDecimalString(q) {
  q = toQ(q);
  let d = q.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) {
    d /= 2;
    twos++;
  }
  while (d % 5 === 0) {
    d /= 5;
    fives++;
  }
  if (d !== 1) return null;
  const k = Math.max(twos, fives);
  const scale = Math.pow(10, k);
  const scaled = (q.n * scale) / q.d; // 整数になる
  const neg_ = scaled < 0;
  let s = String(Math.abs(scaled)).padStart(k + 1, "0");
  if (k > 0) s = s.slice(0, s.length - k) + "." + s.slice(s.length - k);
  return (neg_ ? "-" : "") + s;
}

/** 小数文字列 → Q（"0.75" → 3/4）。数字と小数点だけを想定 */
export function fromDecimalString(str) {
  const m = /^(-?)(\d*)\.?(\d*)$/.exec(str);
  if (!m || (m[2] === "" && m[3] === "")) return null;
  const k = m[3].length;
  const n = parseInt((m[2] || "0") + m[3], 10) * (m[1] ? -1 : 1);
  return Q(n, Math.pow(10, k));
}

// ------------------------------------------------------------
// 入力文字列の解釈（生徒がキーパッドや手入力で打つ答え）
// ------------------------------------------------------------

/** 全角・記号ゆれを半角に揃える */
export function normalizeInput(s) {
  return String(s ?? "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[−–—ー－ｰ‐]/g, "-")
    .replace(/[＋]/g, "+")
    .replace(/[／÷]/g, "/")
    .replace(/[．。]/g, ".")
    .replace(/[，、]/g, ",")
    .replace(/　/g, " ")
    .trim();
}

/**
 * 答えの文字列を Q にする。解釈できなければ null。
 *  "12" "-3" "0.75" ".5" "3/4" "-3/4"、opts.mixed のとき "2 1/3"（帯分数）も。
 */
export function parseInput(text, opts = {}) {
  let s = normalizeInput(text);
  if (!s) return null;
  // 3桁区切り "1,200"
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  s = s.replace(/^\+/, "");
  let m;
  // 帯分数 "2 1/3" / "-2 1/3"
  if (opts.mixed && (m = /^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s))) {
    const w = parseInt(m[2], 10);
    const n = parseInt(m[3], 10);
    const d = parseInt(m[4], 10);
    if (d === 0) return null;
    const v = Q(w * d + n, d);
    return m[1] ? neg(v) : v;
  }
  // 分数 "3/4" "-3/4"
  if ((m = /^(-?)(\d+)\s*\/\s*(\d+)$/.exec(s))) {
    const d = parseInt(m[3], 10);
    if (d === 0) return null;
    const v = Q(parseInt(m[2], 10), d);
    return m[1] ? neg(v) : v;
  }
  // 整数・小数
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return fromDecimalString(s);
  return null;
}

/** 入力が「分数の形」だったか（約分の判定に使う） */
export function looksLikeFraction(text) {
  return /^-?\s*\d+\s*\/\s*\d+$/.test(normalizeInput(text));
}

/** 入力が分数として約分済みか（3/4 → true、6/8 → false）。分数でなければ true */
export function isReducedText(text) {
  const m = /^-?\s*(\d+)\s*\/\s*(\d+)$/.exec(normalizeInput(text));
  if (!m) return true;
  return gcd(parseInt(m[1], 10), parseInt(m[2], 10)) === 1;
}
