// ============================================================
// kit.js — 問題テンプレートを書くための小さな道具箱（数学ラボ ソロ）
//
// 【テンプレートの形】
//   t("E3-warizan-1a", (r) => ({ q, ans, choices?, unit?, hint, steps }))
//     r(min, max) … min 以上 max 以下の整数を返す乱数（呼び出し側が渡す）
//
//   q       : 問題文。数式は $...$（KaTeX の LaTeX）で書く。日本語は $ の外に。
//   ans     : 正解。
//               choices なし → 入力式。数値（整数・有限小数）か、約分済みの分数文字列 "3/4" "-5/2"
//               choices あり → 4択。choices のどれか1つと「同じ値」
//   choices : 4択の選択肢（文字列 or 数値。$...$ 可）。省略すると入力式になる
//   unit    : 入力欄の後ろに出す単位（"cm"、"個"、"度" など。任意）
//   hint    : 考え方のヒント（1行）
//   steps   : 解き方の解説（1〜4行の配列。$...$ 可）
//   skip    : true なら作り直し（割り切れない等）
//
// 詳しい書き方は docs/solo-問題データの書き方.md
// ============================================================

/** テンプレートを作る */
export const t = (id, build) => ({ id, build });

/** 配列から1つ選ぶ */
export const pick = (r, arr) => arr[r(0, arr.length - 1)];

/** 0 以外の整数 */
export const rnz = (r, a, b) => {
  let x = 0;
  for (let i = 0; i < 50 && x === 0; i++) x = r(a, b);
  return x || 1;
};

/** ±1 */
export const sgn = (r) => (r(0, 1) ? 1 : -1);

/** シャッフルした新しい配列 */
export function shuffle(r, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = r(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 重複なしで k 個選ぶ */
export function sample(r, arr, k) {
  return shuffle(r, arr).slice(0, k);
}

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

/** 小数の誤差を丸める（0.1+0.2 → 0.3） */
export const round = (x, d = 6) => {
  const k = 10 ** d;
  return Math.round(x * k) / k;
};

// ── 分数 ─────────────────────────────────────────────
/** 約分した [分子, 分母]（分母は正） */
export function reduce(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
}

/** 入力式の答え用：約分した分数文字列 "3/4" "-5/2"、整数なら数値 */
export function fracAns(n, d) {
  const [a, b] = reduce(n, d);
  return b === 1 ? a : `${a}/${b}`;
}

/** TeX の分数 "\frac{3}{4}" "-\frac{5}{2}"、整数なら "3" */
export function fracTex(n, d) {
  const [a, b] = reduce(n, d);
  if (b === 1) return String(a);
  return `${a < 0 ? "-" : ""}\\frac{${Math.abs(a)}}{${b}}`;
}

// ── 平方根 ───────────────────────────────────────────
/** √n を a√b に（[a, b]） 例 sqrtSimp(18) → [3, 2] */
export function sqrtSimp(n) {
  let a = 1, b = n;
  for (let k = Math.floor(Math.sqrt(n)); k >= 2; k--) {
    if (b % (k * k) === 0) { a = k; b = b / (k * k); break; }
  }
  return [a, b];
}

/** m√n を簡単にした TeX 例 sqrtTex(1,18) → "3\sqrt{2}"、sqrtTex(2,9) → "6" */
export function sqrtTex(m, n) {
  if (n === 0 || m === 0) return "0";
  const [a, b] = sqrtSimp(n);
  const c = m * a;
  if (b === 1) return String(c);
  const ac = Math.abs(c);
  return `${c < 0 ? "-" : ""}${ac === 1 ? "" : ac}\\sqrt{${b}}`;
}

// ── 式の文字列（TeX） ─────────────────────────────────
/**
 * 多項式の TeX。係数は高次から。poly([1,-3,2]) → "x^2-3x+2"、poly([2,0,-1],"t") → "2t^2-1"
 * 係数0の項は省略。すべて0なら "0"。
 */
export function poly(coeffs, v = "x") {
  const n = coeffs.length - 1;
  let s = "";
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const e = n - i;
    const ac = Math.abs(c);
    const body = e === 0 ? String(ac) : `${ac === 1 ? "" : ac}${v}${e === 1 ? "" : `^{${e}}`}`;
    if (s === "") s = (c < 0 ? "-" : "") + body;
    else s += (c < 0 ? "-" : "+") + body;
  });
  return s || "0";
}

/** 符号つきの項 "+3" "-3"（先頭以外で使う） */
export const signed = (n) => (n < 0 ? `-${Math.abs(n)}` : `+${n}`);

/** 係数つき1次の項 "3x" "-x" "x"（先頭用） */
export function coefVar(c, v = "x") {
  if (c === 0) return "0";
  if (c === 1) return v;
  if (c === -1) return `-${v}`;
  return `${c}${v}`;
}

/** 係数つき1次の項を「+」「-」付きで（2項目以降用） "+3x" "-x" */
export function signedVar(c, v = "x") {
  if (c === 0) return "";
  if (c === 1) return `+${v}`;
  if (c === -1) return `-${v}`;
  return c < 0 ? `-${Math.abs(c)}${v}` : `+${c}${v}`;
}

// ── 4択 ─────────────────────────────────────────────
/**
 * 正解＋誤答候補から、重複なしの4択を作ってシャッフル。
 *   wrongs は「ありがちな誤答」を前から優先。足りないときは fill() で補う（任意）。
 *   比較は文字列（空白を除く）で行う。
 */
export function choices4(r, correct, wrongs = [], fill = null) {
  const key = (x) => String(x).replace(/\s/g, "");
  const seen = new Set([key(correct)]);
  const out = [correct];
  const add = (x) => {
    if (x == null || out.length >= 4) return;
    if (typeof x === "number" && !Number.isFinite(x)) return;
    const k = key(x);
    if (k === "" || /NaN|undefined|Infinity/.test(k) || seen.has(k)) return;
    seen.add(k);
    out.push(x);
  };
  wrongs.forEach(add);
  for (let i = 0; fill && out.length < 4 && i < 60; i++) add(fill(i));
  return shuffle(r, out);
}

/** 数値の4択（正解のまわりのもっともらしい値で埋める） */
export function numChoices(r, ans, traps = []) {
  const isInt = Number.isInteger(ans);
  const mag = Math.max(1, Math.abs(ans));
  const ds = isInt
    ? [1, -1, 2, -2, 3, 5, -3, Math.max(1, Math.round(mag * 0.1)), Math.max(2, Math.round(mag * 0.2)), 10]
    : [0.1, -0.1, 0.2, 0.5, -0.5, 1, -1, 2];
  return choices4(r, ans, traps.map((x) => (isInt ? x : round(x))), (i) => {
    const d = ds[(i + r(0, ds.length - 1)) % ds.length];
    return isInt ? ans + d : round(ans + d);
  });
}

/** $...$ で包む */
export const tex = (s) => `$${s}$`;
