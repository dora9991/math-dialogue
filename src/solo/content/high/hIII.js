// ============================================================
// hIII.js — 高校 数学III の単元（数学ラボ ソロ）
//   極限 / 微分法 / 微分の応用 / 積分法 / 積分の応用
// 書き方は docs/solo-問題データの書き方.md を参照
// ============================================================
import { t, pick, rnz, sgn, gcd, reduce, fracAns, fracTex, sqrtSimp, poly, signed, choices4, round } from "../kit.js";

// ── この単元で使う小道具 ─────────────────────────────────
/** (n/d)√s の TeX */
function surd(n, d = 1, s = 1) {
  if (n === 0 || s === 0) return "0";
  const [a0, b0] = sqrtSimp(s);
  const [p, q] = reduce(n * a0, d);
  if (b0 === 1) return fracTex(p, q);
  const sg = p < 0 ? "-" : "";
  const ap = Math.abs(p);
  const rt = `\\sqrt{${b0}}`;
  if (q === 1) return `${sg}${ap === 1 ? "" : ap}${rt}`;
  return `${sg}\\frac{${ap === 1 ? "" : ap}${rt}}{${q}}`;
}

/** 係数 n/d × 記号 sym（先頭用・符号込み）。sym が "" なら定数 */
function termTex(n, d, sym) {
  const [p, q] = reduce(n, d);
  if (sym === "") return fracTex(p, q);
  const sg = p < 0 ? "-" : "";
  const ap = Math.abs(p);
  if (q === 1) return `${sg}${ap === 1 ? "" : ap}${sym}`;
  return `${sg}\\frac{${ap}}{${q}}${sym}`;
}

/** 1次結合の TeX。terms = [[分子, 分母, 記号], ...] */
function lin(terms) {
  let s = "";
  for (const [n, d, sym] of terms) {
    if (n === 0) continue;
    const tt = termTex(n, d, sym);
    s += s === "" ? tt : tt.startsWith("-") ? tt : "+" + tt;
  }
  return s || "0";
}

/** (n/d)π^k の TeX（π を分子に入れる形） 例 \frac{3\pi^{2}}{16} */
function piT(n, d, k = 1) {
  const [p, q] = reduce(n, d);
  if (p === 0) return "0";
  if (k === 0) return fracTex(p, q);
  const P = k === 1 ? "\\pi" : `\\pi^{${k}}`;
  const sg = p < 0 ? "-" : "";
  const ap = Math.abs(p);
  const top = `${ap === 1 ? "" : ap}${P}`;
  return q === 1 ? `${sg}${top}` : `${sg}\\frac{${top}}{${q}}`;
}

/** e^{n/d} の TeX */
function eT(n, d = 1) {
  const [p, q] = reduce(n, d);
  if (p === 0) return "1";
  if (q === 1) return p === 1 ? "e" : `e^{${p}}`;
  return `e^{${p < 0 ? "-" : ""}\\frac{${Math.abs(p)}}{${q}}}`;
}

/** 負の数にかっこ */
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
/** e^{ax} の TeX */
const eax = (a, v = "x") => `e^{${a === 1 ? "" : a === -1 ? "-" : a}${v}}`;
/** sin ax などの TeX（a=1 なら \sin x） */
const trigF = (f, a) => `\\${f} ${a === 1 ? "" : a}x`;
/** x^k の TeX */
const xp = (k) => (k === 0 ? "" : k === 1 ? "x" : `x^{${k}}`);
/** 有理数の和 */
function addQ([a, b], [c, d]) {
  const [n, m] = reduce(a * d + b * c, b * d);
  return [n, m];
}

// ── 極限 ─────────────────────────────────────────────
const KYOKUGEN = {
  id: "HIII-kyokugen",
  grade: "H3",
  area: "func",
  name: "極限",
  desc: "数列の極限・無限級数・関数の極限",
  prereqs: ["HB-zenka", "HII-taisu"],
  course: "数学III",
  rikei: true,
  points: [
    "$\\frac{\\infty}{\\infty}$ 型は分母の最高次（いちばん強い項）で分母・分子をわる。$\\infty-\\infty$ 型の根号は有理化する。",
    "$\\lim_{n\\to\\infty}r^{n}$ は $|r|<1$ で $0$。無限等比級数 $\\sum_{n=1}^{\\infty}ar^{n-1}=\\frac{a}{1-r}$（$|r|<1$）。",
    "$\\lim_{x\\to0}\\frac{\\sin x}{x}=1$、$\\lim_{x\\to0}(1+x)^{\\frac{1}{x}}=e$、$\\lim_{x\\to0}\\frac{e^{x}-1}{x}=1$。",
    "分母 $\\to0$ で極限が有限なら、分子 $\\to0$ が必要（係数決定の第一歩）。",
  ],
  levels: {
    1: [
      t("HIII-kyokugen-1a", (r) => {
        const a = rnz(r, -5, 5), b = r(-6, 6), c = r(-6, 6);
        const d = rnz(r, -5, 5), e = r(-6, 6), f = r(-6, 6);
        if ([1, 2, 3, 4, 5, 6, 7].some((n) => d * n * n + e * n + f === 0)) return { skip: true }; // 分母が 0 になる項をつくらない
        const lower = r(0, 3) === 0;
        const num = lower ? [b === 0 ? 1 : b, c] : [a, b, c];
        const N = poly(num, "n"), D = poly([d, e, f], "n");
        const ans = lower ? 0 : fracAns(a, d);
        return {
          q: `$\\lim_{n\\to\\infty}\\frac{${N}}{${D}}$ を求めよ。`,
          ans,
          hint: "分母の最高次の項 $n^{2}$ で分母・分子をわる。",
          steps: [
            `分母・分子を $n^{2}$ でわる`,
            lower
              ? `分子は $\\frac{${N}}{n^{2}}\\to0$、分母は $${d}$ に近づくので極限は $0$`
              : `分子 $\\to ${a}$、分母 $\\to ${d}$ なので極限は $${fracTex(a, d)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-1b", (r) => {
        const [p, q] = pick(r, [[1, 2], [1, 3], [2, 3], [-1, 2], [1, 4], [3, 4], [-1, 3], [2, 5], [-2, 3]]);
        const a = rnz(r, -6, 6);
        const t1 = fracTex(a * p, q), t2 = fracTex(a * p * p, q * q);
        // ⋯ の前の符号は4項目 a·r^3 の符号（a·p の符号）に合わせる
        const ser = `${a}${t1.startsWith("-") ? t1 : "+" + t1}${t2.startsWith("-") ? t2 : "+" + t2}${a * p < 0 ? "-" : "+"}\\cdots`;
        return {
          q: `無限等比級数 $${ser}$ の和を求めよ。`,
          ans: fracAns(a * q, q - p),
          hint: "初項と公比を読みとり、$|r|<1$ を確かめてから $\\frac{a}{1-r}$。",
          steps: [
            `初項 $${a}$、公比 $${fracTex(p, q)}$（$|r|<1$ なので収束）`,
            `和は $\\frac{${a}}{1-\\left(${fracTex(p, q)}\\right)}=${fracTex(a * q, q - p)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-1c", (r) => {
        const a = r(1, 7), b = r(1, 7);
        const mode = r(0, 2);
        const ax = a === 1 ? "x" : `${a}x`, bx = b === 1 ? "x" : `${b}x`;
        const ex = [`\\frac{\\sin ${ax}}{${bx}}`, `\\frac{\\tan ${ax}}{${bx}}`, `\\frac{\\sin ${ax}}{\\sin ${bx}}`][mode];
        if (mode === 2 && a === b) return { skip: true };
        return {
          q: `$\\lim_{x\\to0}${ex}$ を求めよ。`,
          ans: fracAns(a, b),
          hint: "$\\lim_{\\theta\\to0}\\frac{\\sin\\theta}{\\theta}=1$ が使える形に変形する。",
          steps: [
            mode === 2
              ? `$\\frac{\\sin ${ax}}{${ax}}\\cdot\\frac{${bx}}{\\sin ${bx}}\\cdot${fracTex(a, b)}$ と変形`
              : `$\\frac{${mode === 0 ? "\\sin" : "\\tan"} ${ax}}{${ax}}${fracTex(a, b) === "1" ? "" : `\\cdot${fracTex(a, b)}`}$ と変形`,
            `$x\\to0$ で $1\\times${fracTex(a, b)}=${fracTex(a, b)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-1d", (r) => {
        const mode = r(0, 2);
        if (mode === 2) {
          const c = r(1, 5), C2 = c * c;
          return {
            q: `$\\lim_{x\\to0}\\frac{\\sqrt{x+${C2}}-${c}}{x}$ を求めよ。`,
            ans: fracAns(1, 2 * c),
            hint: "$\\frac{0}{0}$ 型。分子を有理化してから $x$ を約分する。",
            steps: [
              `$\\frac{\\sqrt{x+${C2}}-${c}}{x}=\\frac{(x+${C2})-${C2}}{x\\left(\\sqrt{x+${C2}}+${c}\\right)}=\\frac{1}{\\sqrt{x+${C2}}+${c}}$`,
              `$x\\to0$ で $\\frac{1}{${c}+${c}}=${fracTex(1, 2 * c)}$`,
            ],
          };
        }
        const a = rnz(r, -4, 4), b = r(-5, 5);
        if (b === a || (mode === 1 && b === -a)) return { skip: true };
        const X = (k) => poly([1, -k]);
        const fac = (k) => (k === 0 ? "x" : `(${X(k)})`);
        const D = poly([1, -(a + b), a * b]);
        const DF = b === 0 ? `x(${X(a)})` : `(${X(a)})(${X(b)})`;
        if (mode === 0) {
          return {
            q: `$\\lim_{x\\to ${a}}\\frac{${D}}{${X(a)}}$ を求めよ。`,
            ans: a - b,
            hint: "$\\frac{0}{0}$ 型。分子を因数分解して約分する。",
            steps: [`$${D}=${DF}$ より $\\frac{${D}}{${X(a)}}=${X(b)}$`, `$x\\to ${a}$ のとき $${X(b)}\\to ${a - b}$`],
          };
        }
        const N = poly([1, 0, -a * a]);
        return {
          q: `$\\lim_{x\\to ${a}}\\frac{${N}}{${D}}$ を求めよ。`,
          ans: fracAns(2 * a, a - b),
          hint: "$\\frac{0}{0}$ 型。分母・分子を因数分解して約分する。",
          steps: [
            `$\\frac{${N}}{${D}}=\\frac{(${X(a)})(${X(-a)})}{${DF}}=\\frac{${X(-a)}}{${X(b)}}$`,
            `$x\\to ${a}$ のとき $\\frac{${X(-a)}}{${X(b)}}\\to${fracTex(2 * a, a - b)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HIII-kyokugen-2a", (r) => {
        const a = r(-4, 6), b = r(0, 5), c = r(-1, 6); // c≧-1 なら n^2+cn≧0（n≧1）
        if (a === c || [1, 2, 3, 4, 5, 6].some((n) => n * n + a * n + b < 0)) return { skip: true };
        const S1 = `\\sqrt{${poly([1, a, b], "n")}}`;
        const S2 = c === 0 ? "n" : `\\sqrt{${poly([1, c, 0], "n")}}`;
        return {
          q: `$\\lim_{n\\to\\infty}\\left(${S1}-${S2}\\right)$ を求めよ。`,
          ans: fracAns(a - c, 2),
          hint: "$\\infty-\\infty$ 型。分子を有理化（$\\sqrt{A}-\\sqrt{B}=\\frac{A-B}{\\sqrt{A}+\\sqrt{B}}$）してから n でわる。",
          steps: [
            `有理化すると $\\frac{${poly([a - c, b], "n")}}{${S1}+${S2}}$`,
            `分母・分子を $n$ でわると、分子 $\\to ${a - c}$、分母 $\\to1+1=2$`,
            `極限は $${fracTex(a - c, 2)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-2b", (r) => {
        const p = r(3, 6), q = r(2, p - 1);
        const A = rnz(r, -3, 3), B = rnz(r, -4, 4), C = rnz(r, -3, 3), D = rnz(r, -3, 3);
        if ([...Array(15).keys()].some((k) => C * p ** (k + 1) + D * q ** (k + 2) === 0)) return { skip: true }; // 分母が 0 になる項をつくらない
        const tm = (c, base, e, first) => {
          const body = `${base}^{${e}}`;
          const s = c === 1 ? body : c === -1 ? `-${body}` : `${c}\\cdot ${body}`;
          return first || s.startsWith("-") ? s : `+${s}`;
        };
        const N = tm(A, p, "n+1", true) + tm(B, q, "n", false);
        const Dn = tm(C, p, "n", true) + tm(D, q, "n+1", false);
        return {
          q: `$\\lim_{n\\to\\infty}\\frac{${N}}{${Dn}}$ を求めよ。`,
          ans: fracAns(A * p, C),
          hint: `いちばん大きい底 $${p}^{n}$ で分母・分子をわる。`,
          steps: [
            `分母・分子を $${p}^{n}$ でわる`,
            `$\\left(\\frac{${q}}{${p}}\\right)^{n}\\to0$ より 分子 $\\to ${A * p}$、分母 $\\to ${C}$`,
            `極限は $${fracTex(A * p, C)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-2c", (r) => {
        const a = r(1, 6), b = r(1, 5);
        const ax = a === 1 ? "x" : `${a}x`;
        const mode = r(0, 1);
        const den = mode === 0 ? `${b === 1 ? "" : b}x^{2}` : `x\\sin ${b === 1 ? "" : b}x`;
        return {
          q: `$\\lim_{x\\to0}\\frac{1-\\cos ${ax}}{${den}}$ を求めよ。`,
          ans: fracAns(a * a, 2 * b),
          hint: "分母・分子に $1+\\cos$ をかけて $\\sin^{2}$ を作る。",
          steps: [
            `$1-\\cos ${ax}=\\frac{\\sin^{2}${ax}}{1+\\cos ${ax}}$`,
            mode === 0
              ? `$\\left(\\frac{\\sin ${ax}}{${ax}}\\right)^{2}\\cdot\\frac{${a * a}}{${b === 1 ? `1+\\cos ${ax}` : `${b}(1+\\cos ${ax})`}}\\to\\frac{${a * a}}{${2 * b}}$`
              : `$\\left(\\frac{\\sin ${ax}}{${ax}}\\right)^{2}\\cdot\\frac{${b === 1 ? "" : b}x}{\\sin ${b === 1 ? "" : b}x}\\cdot\\frac{${a * a}}{${b === 1 ? `1+\\cos ${ax}` : `${b}(1+\\cos ${ax})`}}\\to\\frac{${a * a}}{${2 * b}}$`,
            `極限は $${fracTex(a * a, 2 * b)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-2d", (r) => {
        const mode = r(0, 2);
        if (mode === 0) {
          const a = r(1, 6), fr = `\\frac{${a}}{x}`, two = r(0, 1) === 1;
          if (!two) {
            return {
              q: `$\\lim_{x\\to\\infty}x\\sin${fr}$ を求めよ。`,
              ans: a,
              hint: "$t=\\frac{1}{x}$ の形の置きかえで $x\\to\\infty$ を $t\\to0$ に直し、$\\frac{\\sin t}{t}$ を作る。",
              steps: [`$t=${fr}$ とおくと、$x\\to\\infty$ のとき $t\\to+0$、$x=\\frac{${a}}{t}$`, `$x\\sin${fr}=${a === 1 ? "" : `${a}\\cdot`}\\frac{\\sin t}{t}\\to ${a}$`],
            };
          }
          return {
            q: `$\\lim_{x\\to\\infty}x^{2}\\left(1-\\cos${fr}\\right)$ を求めよ。`,
            ans: fracAns(a * a, 2),
            hint: "$t=\\frac{1}{x}$ の形の置きかえで $x\\to\\infty$ を $t\\to0$ に直し、$\\frac{1-\\cos t}{t^{2}}$ を作る。",
            steps: [
              `$t=${fr}$ とおくと、$x\\to\\infty$ のとき $t\\to+0$、$x^{2}=\\frac{${a * a}}{t^{2}}$`,
              `$x^{2}(1-\\cos t)=${a * a === 1 ? "" : `${a * a}\\cdot`}\\frac{1-\\cos t}{t^{2}}=${a * a === 1 ? "" : `${a * a}\\cdot`}\\frac{\\sin^{2}t}{t^{2}(1+\\cos t)}\\to${fracTex(a * a, 2)}$`,
            ],
          };
        }
        if (mode === 1) {
          const a = r(1, 5), sg = a % 2 === 0 ? 1 : -1;
          const ax = a === 1 ? "x" : `${a}x`, at = a === 1 ? "t" : `${a}t`, aP = a === 1 ? "\\pi" : `${a}\\pi`;
          return {
            q: `$\\lim_{x\\to\\pi}\\frac{\\sin ${ax}}{x-\\pi}$ を求めよ。`,
            ans: sg * a,
            hint: "$t=x-\\pi$ とおくと $t\\to0$。$\\sin$ の中を $t$ で表す。",
            steps: [
              `$t=x-\\pi$ とおくと、$x\\to\\pi$ のとき $t\\to0$`,
              `$\\sin ${ax}=\\sin(${at}+${aP})=${sg < 0 ? "-" : ""}\\sin ${at}$`,
              `$\\frac{\\sin ${ax}}{x-\\pi}=${sg < 0 ? "-" : ""}${a === 1 ? "" : `${a}\\cdot`}\\frac{\\sin ${at}}{${at}}\\to ${sg * a}$`,
            ],
          };
        }
        const a = pick(r, [1, 3, 5]), sg = a % 4 === 1 ? -1 : 1; // cos(aπ/2+at)=sg·sin at
        const ax = a === 1 ? "x" : `${a}x`, at = a === 1 ? "t" : `${a}t`, aP = a === 1 ? "\\frac{\\pi}{2}" : `\\frac{${a}}{2}\\pi`;
        return {
          q: `$\\lim_{x\\to\\frac{\\pi}{2}}\\frac{\\cos ${ax}}{2x-\\pi}$ を求めよ。`,
          ans: fracAns(sg * a, 2),
          hint: "$t=x-\\frac{\\pi}{2}$ とおくと $t\\to0$。$\\cos$ の中を $t$ で表す。",
          steps: [
            `$t=x-\\frac{\\pi}{2}$ とおくと、$x\\to\\frac{\\pi}{2}$ のとき $t\\to0$、$2x-\\pi=2t$`,
            `$\\cos ${ax}=\\cos\\left(${at}+${aP}\\right)=${sg < 0 ? "-" : ""}\\sin ${at}$`,
            `$\\frac{\\cos ${ax}}{2x-\\pi}=${sg < 0 ? "-" : ""}\\frac{\\sin ${at}}{2t}=${sg < 0 ? "-" : ""}${fracTex(a, 2)}\\cdot\\frac{\\sin ${at}}{${at}}\\to ${fracTex(sg * a, 2)}$`,
          ],
        };
      }),
    ],
    3: [
      t("HIII-kyokugen-3a", (r) => {
        const [p, q] = pick(r, [[1, 2], [1, 3], [2, 3], [-1, 2], [1, 4], [3, 4], [-1, 3]]);
        const c = rnz(r, -6, 6), a1 = r(-5, 5);
        const L = [c * q, q - p];
        const rec = `a_{n+1}=${termTex(p, q, "a_{n}")}${signed(c)}`;
        return {
          q: `$a_{1}=${a1}$, $${rec}$ で定まる数列 $\\{a_{n}\\}$ の極限 $\\lim_{n\\to\\infty}a_{n}$ を求めよ。`,
          ans: fracAns(L[0], L[1]),
          hint: "$\\alpha=r\\alpha+c$ となる $\\alpha$ を引いて、$a_{n}-\\alpha$ が等比数列になる形にする。",
          steps: [
            `$\\alpha=${termTex(p, q, "\\alpha")}${signed(c)}$ より $\\alpha=${fracTex(L[0], L[1])}$`,
            `$a_{n+1}-\\alpha=${fracTex(p, q)}(a_{n}-\\alpha)$ より $a_{n}-\\alpha=\\left(${fracTex(p, q)}\\right)^{n-1}(a_{1}-\\alpha)\\to0$`,
            `$\\lim a_{n}=${fracTex(L[0], L[1])}$`,
          ],
        };
      }),
      t("HIII-kyokugen-3b", (r) => {
        const d = r(1, 4), c = r(1, 6);
        let H = [0, 1];
        for (let k = 1; k <= d; k++) H = addQ(H, [1, k]);
        const ans = [c * H[0], d * H[1]];
        const Hs = [...Array(d).keys()].map((k) => (k === 0 ? "1" : `\\frac{1}{${k + 1}}`)).join("+");
        const cd = fracTex(c, d) === "1" ? "" : fracTex(c, d);
        return {
          q: `$\\sum_{n=1}^{\\infty}\\frac{${c}}{n(n+${d})}$ を求めよ。`,
          ans: fracAns(ans[0], ans[1]),
          hint: "部分分数に分解すると、部分和で項が打ち消し合う。",
          steps: [
            `$\\frac{${c}}{n(n+${d})}=${cd}\\left(\\frac{1}{n}-\\frac{1}{n+${d}}\\right)$`,
            `部分和は $${cd}\\left(${Hs}-\\cdots\\right)$ の形で、引く側の項は $n\\to\\infty$ で $0$`,
            `和は $${cd}\\left(${Hs}\\right)=${fracTex(ans[0], ans[1])}$`,
          ],
        };
      }),
      t("HIII-kyokugen-3c", (r) => {
        const a = pick(r, [1, 2, 3, -1, -2]), b = r(1, 3);
        const mode = r(0, 1);
        const ans = `$${eT(a * b)}$`;
        const ex =
          mode === 0
            ? `\\lim_{x\\to0}(1${a < 0 ? "-" : "+"}${Math.abs(a) === 1 ? "" : Math.abs(a)}x)^{\\frac{${b}}{x}}`
            : `\\lim_{n\\to\\infty}\\left(1${a < 0 ? "-" : "+"}\\frac{${Math.abs(a)}}{n}\\right)^{${b === 1 ? "" : b}n}`;
        return {
          q: `$${ex}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${eT(a, b)}$`, `$${eT(a + b)}$`, "$1$", `$${eT(-a * b)}$`, `$${eT(b, a)}$`], (i) => `$${eT(a * b + i + 1)}$`),
          hint: "$(1+h)^{\\frac{1}{h}}\\to e$（$h\\to0$）の形を作り、指数を調整する。",
          steps: [
            mode === 0
              ? `$h=${a === 1 ? "" : a === -1 ? "-" : a}x$ とおくと $(1+h)^{\\frac{${b}}{x}}=\\left\\{(1+h)^{\\frac{1}{h}}\\right\\}${a * b === 1 ? "" : `^{${a * b}}`}$`
              : `$h=${a < 0 ? "-" : ""}\\frac{${Math.abs(a)}}{n}$ とおくと $\\left(1+h\\right)^{${b === 1 ? "" : b}n}=\\left\\{(1+h)^{\\frac{1}{h}}\\right\\}${a * b === 1 ? "" : `^{${a * b}}`}$`,
            `$h\\to0$ で $(1+h)^{\\frac{1}{h}}\\to e$ より極限は $${eT(a * b)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-3d", (r) => {
        const s = r(1, 6);
        const head = `1辺の長さ ${s} の正方形 ABCD の辺 AB, BC, CD, DA を`;
        if (r(0, 1) === 0) {
          const [m, n] = pick(r, [[1, 1], [1, 2], [2, 1], [1, 3], [2, 3], [3, 1], [1, 4], [3, 5]]);
          const [rn, rd] = reduce(m * m + n * n, (m + n) * (m + n));
          const rT = fracTex(rn, rd);
          return {
            q: `${head}それぞれ ${m}:${n} に内分する4点を結ぶと、正方形ができる。この正方形に同じ操作をくり返して、正方形を次々につくる。ABCD をふくむすべての正方形の面積の総和を求めよ。`,
            ans: fracAns(s * s * (m + n) * (m + n), 2 * m * n),
            hint: "となり合う正方形の面積の比は一定。面積の列は無限等比級数になる。",
            steps: [
              `1辺 $l$ の正方形からできる正方形の1辺は、三平方の定理より $\\sqrt{\\left(${fracTex(m, m + n)}l\\right)^{2}+\\left(${fracTex(n, m + n)}l\\right)^{2}}$`,
              `面積の比は $\\frac{${m * m}+${n * n}}{${(m + n) * (m + n)}}=${rT}$（一定）。面積は初項 $${s * s}$、公比 $${rT}$ の無限等比級数`,
              `総和は $\\frac{${s * s}}{1-${rT}}=${fracTex(s * s * (m + n) * (m + n), 2 * m * n)}$`,
            ],
          };
        }
        let [m, n, h] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
        if (r(0, 1) === 1) [m, n] = [n, m];
        const rT = fracTex(h, m + n);
        return {
          q: `${head}それぞれ ${m}:${n} に内分する4点を結ぶと、正方形ができる。この正方形に同じ操作をくり返して、正方形を次々につくる。ABCD をふくむすべての正方形の周の長さの総和を求めよ。`,
          ans: fracAns(4 * s * (m + n), m + n - h),
          hint: "となり合う正方形の1辺の長さの比は一定。周の長さの列は無限等比級数になる。",
          steps: [
            `1辺 $l$ の正方形からできる正方形の1辺は $\\sqrt{\\left(${fracTex(m, m + n)}l\\right)^{2}+\\left(${fracTex(n, m + n)}l\\right)^{2}}=${rT}l$`,
            `周の長さは初項 $${4 * s}$、公比 $${rT}$ の無限等比級数`,
            `総和は $\\frac{${4 * s}}{1-${rT}}=${fracTex(4 * s * (m + n), m + n - h)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HIII-kyokugen-4a", (r) => {
        const q = r(2, 5), a = r(1, 3), b = r(0, 3);
        const num = a * q + b * (q - 1), den = (q - 1) * (q - 1);
        return {
          q: `$\\sum_{n=1}^{\\infty}\\frac{${poly([a, b], "n")}}{${q}^{n}}$ を求めよ。`,
          ans: fracAns(num, den),
          hint: "$S_{n}-\\frac{1}{q}S_{n}$ をつくると等比数列の和になる。$\\lim_{n\\to\\infty}\\frac{n}{q^{n}}=0$ も使う。",
          steps: [
            `$x=\\frac{1}{${q}}$ とおくと $\\sum nx^{n}=\\frac{x}{(1-x)^{2}}=${fracTex(q, (q - 1) * (q - 1))}$（$S-xS$ の計算と $nx^{n}\\to0$ から）`,
            `$\\sum x^{n}=\\frac{x}{1-x}=${fracTex(1, q - 1)}$`,
            `和は $${a}\\times${fracTex(q, (q - 1) * (q - 1))}${b === 0 ? "" : `+${b}\\times${fracTex(1, q - 1)}`}=${fracTex(num, den)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-4b", (r) => {
        const s = r(2, 4), k = r(-3, 5), a = rnz(r, -4, 4);
        const m = s * s - k;
        const b = a * s;
        const xk = k === 0 ? "x" : `x${signed(-k)}`;
        const sq = m === 0 ? "\\sqrt{x}" : `\\sqrt{x${signed(m)}}`;
        const cT = fracTex(a, 2 * s);
        return {
          q: `$\\lim_{x\\to ${k}}\\frac{a${sq}-b}{${xk}}=${cT}$ が成り立つように定数 $a$, $b$ を定めるとき、$a+b$ の値を求めよ。`,
          ans: a + b,
          hint: "分母 $\\to0$ なので、極限が有限なら分子 $\\to0$。そこから b を a で表し、有理化する。",
          steps: [
            `分子 $\\to0$ が必要：$a\\sqrt{${k + m}}-b=0$ より $b=${s}a$`,
            `$\\frac{a(${sq}-${s})}{${xk}}=\\frac{a}{${sq}+${s}}\\to\\frac{a}{${2 * s}}$`,
            `$\\frac{a}{${2 * s}}=${cT}$ より $a=${a}$, $b=${b}$、$a+b=${a + b}$`,
          ],
        };
      }),
      t("HIII-kyokugen-4c", (r) => {
        if (r(0, 1) === 0) {
          const a = r(2, 9);
          const ans = `$\\log ${a}$`;
          return {
            q: `$\\lim_{n\\to\\infty}n\\left(${a}^{\\frac{1}{n}}-1\\right)$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${a}$`, `$${a - 1}$`, `$\\log ${a + 1}$`, `$\\frac{1}{\\log ${a}}$`]),
            hint: "$h=\\frac{1}{n}$ とおき、$a^{h}=e^{h\\log a}$ と書きかえる。",
            steps: [
              `$h=\\frac{1}{n}$ とおくと $\\frac{${a}^{h}-1}{h}=\\frac{e^{h\\log ${a}}-1}{h\\log ${a}}\\cdot\\log ${a}$`,
              `$\\lim_{t\\to0}\\frac{e^{t}-1}{t}=1$ より極限は $\\log ${a}$`,
            ],
          };
        }
        const a = r(2, 9);
        let b = r(2, 9);
        if (b === a) b = a === 9 ? 8 : a + 1;
        const [p, q] = reduce(a, b);
        const lg = (n, d) => (d === 1 ? `\\log ${n}` : `\\log\\frac{${n}}{${d}}`);
        const ans = `$${lg(p, q)}$`;
        return {
          q: `$\\lim_{x\\to0}\\frac{${a}^{x}-${b}^{x}}{x}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${lg(q, p)}$`, `$${a - b}$`, `$\\log ${a * b}$`, `$\\frac{\\log ${a}}{\\log ${b}}$`]),
          hint: "分子に $-1+1$ をはさみ、$\\frac{a^{x}-1}{x}\\to\\log a$ を2回使う。",
          steps: [
            `$\\frac{${a}^{x}-${b}^{x}}{x}=\\frac{${a}^{x}-1}{x}-\\frac{${b}^{x}-1}{x}$`,
            `$\\frac{a^{x}-1}{x}\\to\\log a$ より $\\log ${a}-\\log ${b}=${lg(p, q)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-4d", (r) => {
        const p = r(1, 3), q = r(1, 5);
        const P = p === 1 ? "" : p, Q = q === 1 ? "" : q;
        const sq = r(0, 1) === 1;
        const num = sq ? `k^{2}+${P}n^{2}` : `${P}n+k`;
        const den = sq ? `n^{3}+${Q}k` : `n^{2}+${Q}k`;
        const D0 = sq ? "n^{3}" : "n^{2}";
        const sumN = sq ? `\\frac{n(n+1)(2n+1)}{6}+${P}n^{3}` : `${P}n^{2}+\\frac{n(n+1)}{2}`;
        const [an, ad] = sq ? [3 * p + 1, 3] : [2 * p + 1, 2];
        return {
          q: `$\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\frac{${num}}{${den}}$ を求めよ。`,
          ans: fracAns(an, ad),
          hint: "分母に $k$ があるので、そのままでは区分求積の形にならない。分母を $k$ をふくまない式ではさんで評価する（はさみうち）。",
          steps: [
            `和を $S_{n}$ とする。$1\\leqq k\\leqq n$ より $${D0}+${q}\\leqq ${den}\\leqq ${D0}+${Q}n$`,
            `分子の和は $\\sum_{k=1}^{n}(${num})=${sumN}$ なので $\\frac{${sumN}}{${D0}+${Q}n}\\leqq S_{n}\\leqq\\frac{${sumN}}{${D0}+${q}}$`,
            `両端とも $n\\to\\infty$ で $${p}+\\frac{1}{${sq ? 3 : 2}}=${fracTex(an, ad)}$ に近づくので、はさみうちの原理より $\\lim S_{n}=${fracTex(an, ad)}$`,
          ],
        };
      }),
      t("HIII-kyokugen-4e", (r) => {
        const k = r(1, 4), m = r(1, 6), inv = m >= 2 && r(0, 1) === 1; // a1 = m（inv）または 1/m
        if (!inv && m === k) return { skip: true };
        // 1/a_n = (Pn+Q)/R、P = kR
        const [P, Q, R] = inv ? [m * k, 1 - m * k, m] : [k, m - k, 1];
        const a1 = inv ? `${m}` : m === 1 ? "1" : `\\frac{1}{${m}}`;
        const K = k === 1 ? "" : k;
        const L = lin([[P, 1, "n"], [Q, 1, ""]]);
        const Rn = `${R === 1 ? "" : R}n`;
        const ansT = fracTex(Q, k * P);
        const kL = k === 1 ? L : `${k}(${L})`, sgQ = Q < 0 ? "-" : "", aQ = Math.abs(Q);
        return {
          q: `$a_{1}=${a1}$, $a_{n+1}=\\frac{a_{n}}{1+${K}a_{n}}$ で定まる数列 $\\{a_{n}\\}$ について、$\\alpha=\\lim_{n\\to\\infty}na_{n}$ とする。$\\lim_{n\\to\\infty}n(\\alpha-na_{n})$ を求めよ。`,
          ans: fracAns(Q, k * P),
          hint: "$a_{n}>0$ なので逆数をとると、$\\left\\{\\frac{1}{a_{n}}\\right\\}$ は等差数列になる。$na_{n}$ を $n$ の式で表す。",
          steps: [
            `逆数をとると $\\frac{1}{a_{n+1}}=\\frac{1}{a_{n}}+${k}$ より $\\frac{1}{a_{n}}=${fracTex(R === 1 ? m : 1, R)}+${K}(n-1)=${R === 1 ? L : `\\frac{${L}}{${R}}`}$`,
            `$na_{n}=\\frac{${Rn}}{${L}}\\to${fracTex(1, k)}$ より $\\alpha=${fracTex(1, k)}$`,
            `$\\alpha-na_{n}=${fracTex(1, k)}-\\frac{${Rn}}{${L}}=${sgQ}\\frac{${aQ}}{${kL}}$`,
            `$n(\\alpha-na_{n})=${sgQ}\\frac{${aQ === 1 ? "" : aQ}n}{${kL}}\\to${ansT}$`,
          ],
        };
      }),
    ],
  },
};

// ── 微分法 ───────────────────────────────────────────
/** 係数 c × 本体（c=1 は省略、-1 は "-"） */
const co = (c, body) => `${c === 1 ? "" : c === -1 ? "-" : c}${body}`;
/** 符号つき分数 c / body */
const frT = (c, body) => `${c < 0 ? "-" : ""}\\frac{${Math.abs(c)}}{${body}}`;

const BIBUN = {
  id: "HIII-bibun",
  grade: "H3",
  area: "func",
  name: "微分法",
  desc: "積・商・合成関数・三角・指数・対数関数の微分",
  prereqs: ["HIII-kyokugen", "HII-bibun"],
  course: "数学III",
  rikei: true,
  points: [
    "積 $(fg)'=f'g+fg'$、商 $\\left(\\frac{f}{g}\\right)'=\\frac{f'g-fg'}{g^{2}}$（分子は「分子の微分 × 分母」が先）。",
    "合成関数 $\\{f(g(x))\\}'=f'(g(x))\\,g'(x)$。外を微分したら「中の微分」をかけ忘れない。",
    "$(\\sin x)'=\\cos x$、$(\\cos x)'=-\\sin x$、$(\\tan x)'=\\frac{1}{\\cos^{2}x}$、$(e^{x})'=e^{x}$、$(\\log|x|)'=\\frac{1}{x}$。",
    "積・商・累乗が入り組んだ式は、両辺の対数をとってから微分する（対数微分法）。",
  ],
  levels: {
    1: [
      t("HIII-bibun-1a", (r) => {
        const a = pick(r, [2, 3, 4, 5, -2, -3]), b = rnz(r, -5, 5), n = r(3, 6);
        const L = `(${poly([a, b])})`;
        const pw = (k) => (k === 1 ? L : `${L}^{${k}}`);
        if (r(0, 1) === 0) {
          const ans = `$${co(n * a, pw(n - 1))}$`;
          return {
            q: `関数 $y=${pw(n)}$ を微分せよ。`,
            ans,
            choices: choices4(r, ans, [`$${co(n, pw(n - 1))}$`, `$${co(n * a, pw(n))}$`, `$${co(a, pw(n - 1))}$`, `$${co((n - 1) * a, pw(n - 1))}$`]),
            hint: "合成関数の微分：外側 $u^{n}$ を微分して、中身 $u$ の微分をかける。",
            steps: [
              `$u=${poly([a, b])}$ とおくと $y=u^{${n}}$、$u'=${a}$`,
              `$y'=${n}u^{${n - 1}}\\cdot u'=${co(n * a, pw(n - 1))}$`,
            ],
          };
        }
        const ans = `$${frT(-n * a, pw(n + 1))}$`;
        return {
          q: `関数 $y=\\frac{1}{${pw(n)}}$ を微分せよ。`,
          ans,
          choices: choices4(r, ans, [`$${frT(-n, pw(n + 1))}$`, `$${frT(-n * a, pw(n - 1))}$`, `$${frT(n * a, pw(n + 1))}$`, `$${frT(-a, pw(n + 1))}$`]),
          hint: `$y=${L}^{-${n}}$ と書きかえて合成関数の微分。`,
          steps: [
            `$y=${L}^{-${n}}$ より $y'=-${n}${L}^{-${n + 1}}\\times${par(a)}$`,
            `$=${frT(-n * a, pw(n + 1))}$`,
          ],
        };
      }),
      t("HIII-bibun-1b", (r) => {
        const a = pick(r, [2, 3, 4, 5]);
        const kind = r(0, 3);
        const S = trigF("sin", a), C = trigF("cos", a), E = eax(a);
        const C2 = `\\cos^{2}${a}x`;
        const D = [
          [S, co(a, C), [C, co(-a, C), `\\frac{1}{${a}}${C}`]],
          [C, co(-a, S), [co(a, S), `-${S}`, `-\\frac{1}{${a}}${S}`]],
          [E, co(a, E), [E, `${a}xe^{${a}x-1}`, `\\frac{1}{${a}}${E}`]],
          [`\\tan ${a}x`, `\\frac{${a}}{${C2}}`, [`\\frac{1}{${C2}}`, `\\frac{${a}}{${C}}`, `-\\frac{${a}}{\\sin^{2}${a}x}`]],
        ][kind];
        const ans = `$${D[1]}$`;
        return {
          q: `関数 $y=${D[0]}$ を微分せよ。`,
          ans,
          choices: choices4(r, ans, D[2].map((w) => `$${w}$`)),
          hint: `$${a}x$ をひとかたまり $u$ と見て、最後に $u'=${a}$ をかける。`,
          steps: [`$u=${a}x$ とおくと $y'=\\frac{dy}{du}\\cdot\\frac{du}{dx}$`, `$y'=${D[1]}$`],
        };
      }),
      t("HIII-bibun-1c", (r) => {
        if (r(0, 1) === 0) {
          const a = r(1, 4), b = r(-3, 5), c = r(-2, 3);
          const v = a * c + b;
          if (v <= 0) return { skip: true };
          const inner = poly([a, b]);
          return {
            q: `$f(x)=\\log${inner === "x" ? " x" : `(${inner})`}$ のとき、$f'(${c})$ の値を求めよ。`,
            ans: fracAns(a, v),
            hint: "$\\{\\log u\\}'=\\frac{u'}{u}$。",
            steps: [`$f'(x)=\\frac{${a}}{${inner}}$`, `$f'(${c})=${v === 1 || gcd(a, v) === 1 ? "" : `\\frac{${a}}{${v}}=`}${fracTex(a, v)}$`],
          };
        }
        const s = r(1, 5), a = r(1, 4), c = r(-2, 3);
        const b = s * s - a * c;
        const inner = poly([a, b]);
        return {
          q: `$f(x)=\\sqrt{${inner}}$ のとき、$f'(${c})$ の値を求めよ。`,
          ans: fracAns(a, 2 * s),
          hint: "$\\sqrt{u}=u^{\\frac{1}{2}}$ と見て合成関数の微分。",
          steps: [`$f'(x)=\\frac{${a}}{2\\sqrt{${inner}}}$`, `$f'(${c})=\\frac{${a}}{2\\sqrt{${s * s}}}=${fracTex(a, 2 * s)}$`],
        };
      }),
      t("HIII-bibun-1d", (r) => {
        const p = r(-1, 1), k = pick(r, [1, 2, 3, -1, -2, -3]);
        const x0 = rnz(r, -3, 3), y0 = rnz(r, -3, 3);
        const c = x0 * x0 + p * x0 * y0 + k * y0 * y0;
        const nu = 2 * x0 + p * y0, de = p * x0 + 2 * k * y0;
        if (c <= 0 || de === 0) return { skip: true };
        const F = `x^{2}${p === 0 ? "" : p > 0 ? "+xy" : "-xy"}${k === 1 ? "+" : k === -1 ? "-" : signed(k)}y^{2}`;
        const dX = "\\frac{dy}{dx}";
        return {
          q: `曲線 $${F}=${c}$ 上の点 $(${x0},\\ ${y0})$ における $\\frac{dy}{dx}$ の値を求めよ。`,
          ans: fracAns(-nu, de),
          hint: "$y$ を $x$ の関数とみて、両辺を $x$ で微分する。$(y^{2})'=2y\\frac{dy}{dx}$ に注意。",
          steps: [
            `両辺を $x$ で微分すると $2x${p === 0 ? "" : `${p > 0 ? "+" : "-"}\\left(y+x${dX}\\right)`}${k > 0 ? "+" : "-"}${Math.abs(2 * k)}y${dX}=0$`,
            `$${dX}=-\\frac{${lin([[2, 1, "x"], [p, 1, "y"]])}}{${lin([[p, 1, "x"], [2 * k, 1, "y"]])}}$`,
            `$x=${x0}$, $y=${y0}$ を代入して $${dX}=${fracTex(-nu, de)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HIII-bibun-2a", (r) => {
        if (r(0, 2) > 0) {
          const m = r(1, 3), a = pick(r, [1, 2, 3, -1, -2]);
          const E = eax(a);
          const body = (A, M) => {
            const g = gcd(A, M) * (A < 0 ? -1 : 1);
            return `${g === 1 ? "" : g === -1 ? "-" : g}${xp(m - 1)}(${poly([A / g, M / g])})${E}`;
          };
          const ans = `$${body(a, m)}$`;
          return {
            q: `関数 $y=${xp(m)}${E}$ を微分せよ。`,
            ans,
            choices: choices4(r, ans, [`$${co(m * a, xp(m - 1) + E) || E}$`, `$${body(1, m)}$`, `$${body(a, -m)}$`, `$${body(a, m + 1)}$`]),
            hint: "積の微分 $(fg)'=f'g+fg'$。$e^{ax}$ の微分では $a$ が前に出る。",
            steps: [
              `$y'=(${xp(m)})'${E}+${xp(m)}(${E})'$`,
              `$=${m === 1 ? "" : co(m, xp(m - 1))}${E}${a < 0 ? "-" : "+"}${Math.abs(a) === 1 ? "" : Math.abs(a)}${xp(m)}${E}$`,
              `$=${body(a, m)}$`,
            ],
          };
        }
        const m = r(2, 4);
        const ans = `$${xp(m - 1)}(${m}\\log x+1)$`;
        return {
          q: `関数 $y=${xp(m)}\\log x$ を微分せよ。`,
          ans,
          choices: choices4(r, ans, [`$${co(m, xp(m - 2)) || m}$`, `$${xp(m - 1)}(\\log x+1)$`, `$${xp(m - 1)}(${m}\\log x-1)$`, `$${m}${xp(m - 1)}\\log x$`]),
          hint: "積の微分 $(fg)'=f'g+fg'$、$(\\log x)'=\\frac{1}{x}$。",
          steps: [`$y'=${m}${xp(m - 1)}\\log x+${xp(m)}\\cdot\\frac{1}{x}$`, `$=${xp(m - 1)}(${m}\\log x+1)$`],
        };
      }),
      t("HIII-bibun-2b", (r) => {
        if (r(0, 1) === 0) {
          const a = rnz(r, -4, 4), b = rnz(r, -5, 5), c = rnz(r, -3, 3), d = rnz(r, -5, 5);
          const D = a * d - b * c;
          if (D === 0) return { skip: true };
          const g = poly([c, d]);
          const ans = `$${frT(D, `(${g})^{2}`)}$`;
          return {
            q: `関数 $y=\\frac{${poly([a, b])}}{${g}}$ を微分せよ。`,
            ans,
            choices: choices4(r, ans, [`$${frT(-D, `(${g})^{2}`)}$`, `$${frT(D, g)}$`, a * d + b * c === 0 ? null : `$${frT(a * d + b * c, `(${g})^{2}`)}$`], (i) => `$${frT(D * (i + 2), `(${g})^{2}`)}$`),
            hint: "商の微分 $\\frac{f'g-fg'}{g^{2}}$。分子の引き算の順番に注意。",
            steps: [
              `$y'=\\frac{${par(a)}(${g})-(${poly([a, b])})\\cdot${par(c)}}{(${g})^{2}}$`,
              `分子 $=${a * d}${signed(-b * c)}=${D}$ より $y'=${frT(D, `(${g})^{2}`)}$`,
            ],
          };
        }
        const k = r(1, 6);
        const g = `x^{2}+${k}`;
        const ans = `$\\frac{${k}-x^{2}}{(${g})^{2}}$`;
        return {
          q: `関数 $y=\\frac{x}{${g}}$ を微分せよ。`,
          ans,
          choices: choices4(r, ans, [`$\\frac{x^{2}-${k}}{(${g})^{2}}$`, `$\\frac{${k}-x^{2}}{${g}}$`, `$\\frac{3x^{2}+${k}}{(${g})^{2}}$`]),
          hint: "商の微分 $\\frac{f'g-fg'}{g^{2}}$。",
          steps: [`$y'=\\frac{1\\cdot(${g})-x\\cdot2x}{(${g})^{2}}$`, `$=\\frac{${k}-x^{2}}{(${g})^{2}}$`],
        };
      }),
      t("HIII-bibun-2c", (r) => {
        const a = r(1, 3), b = r(-4, 4), c = r(1, 6);
        if (b * b >= 4 * a * c) return { skip: true };
        const u = poly([a, b, c]), du = poly([2 * a, b]);
        const ans = `$\\frac{${du}}{${u}}$`;
        return {
          q: `関数 $y=\\log(${u})$ を微分せよ。`,
          ans,
          choices: choices4(r, ans, [`$\\frac{1}{${u}}$`, `$\\frac{${du}}{(${u})^{2}}$`, `$(${du})\\log(${u})$`, `$\\frac{${poly([2, b])}}{${u}}$`]),
          hint: "$\\{\\log u\\}'=\\frac{u'}{u}$（中身の微分を分子に）。",
          steps: [`$u=${u}$ とおくと $u'=${du}$`, `$y'=\\frac{u'}{u}=\\frac{${du}}{${u}}$`],
        };
      }),
      t("HIII-bibun-2d", (r) => {
        const mode = r(0, 2);
        const hint = "$y=g(x)$ のとき $x=f(y)$ なので $g'(x)=\\frac{1}{f'(y)}$。まず $g$ の値（$f(y)$ がその値になる $y$）を見つける。";
        if (mode === 0) {
          const p = r(1, 4), q = r(-3, 3), t0 = r(-2, 2);
          const b = t0 ** 3 + p * t0 + q, d = 3 * t0 * t0 + p;
          return {
            q: `関数 $f(x)=${poly([1, 0, p, q])}$ の逆関数を $g(x)$ とするとき、$g'(${b})$ の値を求めよ。`,
            ans: fracAns(1, d),
            hint,
            steps: [
              `$f(${t0})=${b}$ なので $g(${b})=${t0}$`,
              `$f'(x)=${poly([3, 0, p])}$ より $f'(${t0})=${d}$`,
              `$g'(${b})=\\frac{1}{f'(${t0})}=${fracTex(1, d)}$`,
            ],
          };
        }
        if (mode === 1) {
          const k = r(1, 4);
          return {
            q: `関数 $f(x)=x+${eax(k)}$ の逆関数を $g(x)$ とするとき、$g'(1)$ の値を求めよ。`,
            ans: fracAns(1, k + 1),
            hint,
            steps: [`$f(0)=1$ なので $g(1)=0$`, `$f'(x)=1+${co(k, eax(k))}$ より $f'(0)=${k + 1}$`, `$g'(1)=\\frac{1}{f'(0)}=${fracTex(1, k + 1)}$`],
          };
        }
        const k = r(2, 5);
        return {
          q: `関数 $f(x)=${k}x+\\sin x$ の逆関数を $g(x)$ とするとき、$g'(${k}\\pi)$ の値を求めよ。`,
          ans: fracAns(1, k - 1),
          hint,
          steps: [`$f(\\pi)=${k}\\pi$ なので $g(${k}\\pi)=\\pi$`, `$f'(x)=${k}+\\cos x$ より $f'(\\pi)=${k - 1}$`, `$g'(${k}\\pi)=\\frac{1}{f'(\\pi)}=${fracTex(1, k - 1)}$`],
        };
      }),
    ],
    3: [
      t("HIII-bibun-3a", (r) => {
        const a = pick(r, [1, 2, 3, -1, -2]), b = r(1, 3);
        const isSin = r(0, 1) === 1;
        const E = eax(a), S = trigF("sin", b), C = trigF("cos", b);
        const f = isSin ? S : C;
        // sin: a sin + b cos、cos: a cos - b sin
        const inner = (A, B) => (isSin ? lin([[A, 1, S], [B, 1, C]]) : lin([[A, 1, C], [-B, 1, S]]));
        const ans = `$${E}(${inner(a, b)})$`;
        return {
          q: `関数 $y=${E}${f}$ を微分せよ。`,
          ans,
          choices: choices4(r, ans, [
            `$${E}(${inner(a, -b)})$`,
            `$${E}(${inner(a, 1)})$`,
            `$${E}(${inner(1, b)})$`,
            `$${co(isSin ? a * b : -a * b, E)}${isSin ? C : S}$`,
          ], (i) => `$${E}(${inner(-a, b + i)})$`),
          hint: "積の微分。$e^{ax}$ の微分も三角関数の微分も、中の微分（係数）が前に出る。",
          steps: [
            `$y'=(${E})'${f}+${E}(${f})'$`,
            `$=${co(a, E)}${f}${isSin ? "+" : "-"}${co(b, E)}${isSin ? C : S}$`,
            `$=${E}(${inner(a, b)})$`,
          ],
        };
      }),
      t("HIII-bibun-3b", (r) => {
        const bases = [1, 2, 3, 4];
        const p = pick(r, bases);
        const q = pick(r, bases.filter((x) => x !== p));
        const s = pick(r, bases.filter((x) => x !== p && x !== q));
        const a = r(1, 2), b = r(1, 2), c = r(1, 2);
        const fac = (k, e) => (e === 1 ? `(x+${k})` : `(x+${k})^{${e}}`);
        const den = c === 1 ? `x+${s}` : fac(s, c);
        const y0 = [p ** a * q ** b, s ** c];
        let S = [a, p];
        S = addQ(S, [b, q]);
        S = addQ(S, [-c, s]);
        const ans = [y0[0] * S[0], y0[1] * S[1]];
        return {
          q: `$f(x)=\\frac{${fac(p, a)}${fac(q, b)}}{${den}}$ のとき、$f'(0)$ の値を求めよ。`,
          ans: fracAns(ans[0], ans[1]),
          hint: "両辺の絶対値の対数をとって微分する（対数微分法）と $\\frac{f'}{f}$ が和の形になる。",
          steps: [
            `$\\log|f(x)|=${a === 1 ? "" : a}\\log|x+${p}|+${b === 1 ? "" : b}\\log|x+${q}|-${c === 1 ? "" : c}\\log|x+${s}|$`,
            `微分して $\\frac{f'(x)}{f(x)}=\\frac{${a}}{x+${p}}+\\frac{${b}}{x+${q}}-\\frac{${c}}{x+${s}}$`,
            `$x=0$：$f(0)=${fracTex(y0[0], y0[1])}$、$\\frac{f'(0)}{f(0)}=${fracTex(S[0], S[1])}$`,
            `$f'(0)=${fracTex(ans[0], ans[1])}$`,
          ],
        };
      }),
      t("HIII-bibun-3c", (r) => {
        if (r(0, 2) > 0) {
          const a = rnz(r, -2, 2), b = r(-3, 3), c = rnz(r, -2, 2), d = r(-4, 4), k = rnz(r, -2, 2);
          const dx = 2 * a * k + b, dy = 3 * c * k * k + d;
          if (dx === 0) return { skip: true };
          return {
            q: `$x=${poly([a, b, 0], "t")}$, $y=${poly([c, 0, d, 0], "t")}$ で表される曲線について、$t=${k}$ に対応する点での $\\frac{dy}{dx}$ の値を求めよ。`,
            ans: fracAns(dy, dx),
            hint: "媒介変数の微分：$\\frac{dy}{dx}=\\frac{dy}{dt}\\div\\frac{dx}{dt}$。",
            steps: [
              `$\\frac{dx}{dt}=${poly([2 * a, b], "t")}$, $\\frac{dy}{dt}=${poly([3 * c, 0, d], "t")}$`,
              `$t=${k}$ で $\\frac{dx}{dt}=${dx}$, $\\frac{dy}{dt}=${dy}$`,
              `$\\frac{dy}{dx}=${fracTex(dy, dx)}$`,
            ],
          };
        }
        const a = r(1, 6), b = r(1, 6);
        const [tT, cot] = pick(r, [["\\frac{\\pi}{4}", 1], ["\\frac{3}{4}\\pi", -1], ["\\frac{5}{4}\\pi", 1], ["\\frac{7}{4}\\pi", -1]]);
        return {
          q: `$x=${a === 1 ? "" : a}\\cos t$, $y=${b === 1 ? "" : b}\\sin t$ で表される曲線について、$t=${tT}$ に対応する点での $\\frac{dy}{dx}$ の値を求めよ。`,
          ans: fracAns(-b * cot, a),
          hint: "$\\frac{dy}{dx}=\\frac{dy}{dt}\\div\\frac{dx}{dt}$。",
          steps: [
            `$\\frac{dx}{dt}=${co(-a, "\\sin t")}$, $\\frac{dy}{dt}=${co(b, "\\cos t")}$`,
            `$\\frac{dy}{dx}=-\\frac{${co(b, "\\cos t")}}{${co(a, "\\sin t")}}$、$t=${tT}$ では $\\frac{\\cos t}{\\sin t}=${cot}$`,
            `$\\frac{dy}{dx}=${fracTex(-b * cot, a)}$`,
          ],
        };
      }),
      t("HIII-bibun-3d", (r) => {
        const hint = "$\\frac{d^{2}y}{dx^{2}}=\\frac{d}{dx}\\left(\\frac{dy}{dx}\\right)=\\frac{d}{dt}\\left(\\frac{dy}{dx}\\right)\\div\\frac{dx}{dt}$ を使う。";
        if (r(0, 1) === 0) {
          const a = r(1, 3), c = pick(r, [1, 2, 3, -1, -2]), s = r(-3, 3), k = rnz(r, -2, 2);
          const Y1 = poly([3 * c, 0, s], "t"), N2 = poly([3 * c, 0, -s], "t");
          return {
            q: `$x=${poly([a, 0, 0], "t")}$, $y=${poly([c, 0, s, 0], "t")}$ で表される曲線について、$t=${k}$ に対応する点での $\\frac{d^{2}y}{dx^{2}}$ の値を求めよ。`,
            ans: fracAns(3 * c * k * k - s, 4 * a * a * k ** 3),
            hint,
            steps: [
              `$\\frac{dx}{dt}=${2 * a}t$, $\\frac{dy}{dt}=${Y1}$ より $\\frac{dy}{dx}=\\frac{${Y1}}{${2 * a}t}$`,
              `$\\frac{d}{dt}\\left(\\frac{dy}{dx}\\right)=\\frac{${6 * c}t\\cdot${2 * a}t-(${Y1})\\cdot${2 * a}}{${4 * a * a}t^{2}}=\\frac{${N2}}{${2 * a}t^{2}}$`,
              `$\\frac{d^{2}y}{dx^{2}}=\\frac{${N2}}{${2 * a}t^{2}}\\div${2 * a}t=\\frac{${N2}}{${4 * a * a}t^{3}}$`,
              `$t=${k}$ を代入して $${fracTex(3 * c * k * k - s, 4 * a * a * k ** 3)}$`,
            ],
          };
        }
        const a = r(1, 3);
        const [tT, on, od] = pick(r, [["\\frac{\\pi}{3}", 1, 2], ["\\frac{\\pi}{2}", 1, 1], ["\\frac{2}{3}\\pi", 3, 2], ["\\pi", 2, 1], ["\\frac{4}{3}\\pi", 3, 2], ["\\frac{3}{2}\\pi", 1, 1], ["\\frac{5}{3}\\pi", 1, 2]]); // 1-cos t = on/od
        const A = a === 1 ? "" : a;
        return {
          q: `サイクロイド $x=${a === 1 ? "t-\\sin t" : `${a}(t-\\sin t)`}$, $y=${a === 1 ? "1-\\cos t" : `${a}(1-\\cos t)`}$ について、$t=${tT}$ に対応する点での $\\frac{d^{2}y}{dx^{2}}$ の値を求めよ。`,
          ans: fracAns(-od * od, a * on * on),
          hint,
          steps: [
            `$\\frac{dx}{dt}=${a === 1 ? "1-\\cos t" : `${a}(1-\\cos t)`}$, $\\frac{dy}{dt}=${A}\\sin t$ より $\\frac{dy}{dx}=\\frac{\\sin t}{1-\\cos t}$`,
            `$\\frac{d}{dt}\\left(\\frac{dy}{dx}\\right)=\\frac{\\cos t(1-\\cos t)-\\sin^{2}t}{(1-\\cos t)^{2}}=-\\frac{1}{1-\\cos t}$`,
            `$\\frac{d^{2}y}{dx^{2}}=-\\frac{1}{1-\\cos t}\\div ${A}(1-\\cos t)=-\\frac{1}{${A}(1-\\cos t)^{2}}$`,
            `$t=${tT}$ では $1-\\cos t=${fracTex(on, od)}$ なので $${fracTex(-od * od, a * on * on)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HIII-bibun-4a", (r) => {
        const a = pick(r, [1, 2, -1, -2, 3]), n = r(3, 7);
        const sq = r(0, 1) === 1;
        const E = eax(a);
        const ans = sq ? n * (n - 1) * a ** (n - 2) : n * a ** (n - 1);
        return {
          q: `$f(x)=${sq ? "x^{2}" : "x"}${E}$ のとき、第 ${n} 次導関数の値 $f^{(${n})}(0)$ を求めよ。`,
          ans,
          hint: "$g(x)=e^{ax}$ とすると $g^{(k)}(x)=a^{k}e^{ax}$。何回か微分して規則を見つける（または積の高次導関数の公式）。",
          steps: sq
            ? [
                `$(x^{2}g)^{(n)}=x^{2}g^{(n)}+2nx\\,g^{(n-1)}+n(n-1)g^{(n-2)}$`,
                `$x=0$ では最後の項だけ残る：$f^{(${n})}(0)=${n}\\times${n - 1}\\times${par(a)}${n - 2 === 1 ? "" : `^{${n - 2}}`}$`,
                `$=${ans}$`,
              ]
            : [
                `$(xg)^{(n)}=x\\,g^{(n)}+n\\,g^{(n-1)}$`,
                `$x=0$ では $f^{(${n})}(0)=${n}\\times${par(a)}^{${n - 1}}$`,
                `$=${ans}$`,
              ],
        };
      }),
      t("HIII-bibun-4b", (r) => {
        const p = r(1, 4), q = r(1, 4);
        const mode = r(0, 3);
        let fT, a0, dN, dD, dT;
        if (mode === 0) { a0 = r(1, 5); fT = "\\log x"; dN = 1; dD = a0; dT = `\\frac{1}{x}`; }
        else if (mode === 1) { const n = r(2, 4); a0 = rnz(r, -2, 2); fT = `x^{${n}}`; dN = n * a0 ** (n - 1); dD = 1; dT = n === 2 ? "2x" : `${n}x^{${n - 1}}`; }
        else if (mode === 2) { const s = r(1, 4); a0 = s * s; fT = "\\sqrt{x}"; dN = 1; dD = 2 * s; dT = "\\frac{1}{2\\sqrt{x}}"; }
        else { const k = pick(r, [1, 2, 3, -1]); a0 = 0; fT = eax(k); dN = k; dD = 1; dT = co(k, eax(k)); }
        const P = lin([[a0, 1, ""], [p, 1, "h"]]), M = lin([[a0, 1, ""], [-q, 1, "h"]]);
        return {
          q: `$f(x)=${fT}$ のとき、$\\lim_{h\\to0}\\frac{f(${P})-f(${M})}{h}$ を求めよ。`,
          ans: fracAns((p + q) * dN, dD),
          hint: "分子に $-f(a)+f(a)$ をはさみ、微分係数の定義 $\\lim\\frac{f(a+k)-f(a)}{k}=f'(a)$ の形を2つ作る。",
          steps: [
            `$\\frac{f(${P})-f(${a0})}{${termTex(p, 1, "h")}}${p === 1 ? "" : `\\cdot${p}`}+\\frac{f(${M})-f(${a0})}{${termTex(-q, 1, "h")}}${q === 1 ? "" : `\\cdot${q}`}$ と変形`,
            `$\\to(${p}+${q})f'(${a0})$`,
            `$f'(x)=${dT}$ より $f'(${a0})=${fracTex(dN, dD)}$、極限は $${fracTex((p + q) * dN, dD)}$`,
          ],
        };
      }),
      t("HIII-bibun-4c", (r) => {
        const a = r(1, 4), A = r(-5, 5), B = rnz(r, -5, 5);
        const sq = r(0, 1) === 1;
        const xa = `x-${a}`;
        const ans = sq ? 2 * a * A - a * a * B : A - a * B;
        const num = sq ? `x^{2}f(${a})-${a === 1 ? "" : a * a}f(x)` : `xf(${a})-${a === 1 ? "" : a}f(x)`;
        return {
          q: `微分可能な関数 $f(x)$ が $f(${a})=${A}$, $f'(${a})=${B}$ を満たすとき、$\\lim_{x\\to ${a}}\\frac{${num}}{${xa}}$ を求めよ。`,
          ans,
          hint: `分子に $-${(sq ? a * a : a) === 1 ? "" : sq ? a * a : a}f(${a})+${(sq ? a * a : a) === 1 ? "" : sq ? a * a : a}f(${a})$ をはさんで、微分係数の定義が見える形に分ける。`,
          steps: sq
            ? [
                `分子 $=(x^{2}-${a * a})f(${a})-${a === 1 ? "" : a * a}\\{f(x)-f(${a})\\}$`,
                `$\\frac{${num}}{${xa}}=(x+${a})f(${a})-${a === 1 ? "" : `${a * a}\\cdot`}\\frac{f(x)-f(${a})}{${xa}}$`,
                `$\\to ${2 * a}\\times${par(A)}-${a * a}\\times${par(B)}=${ans}$`,
              ]
            : [
                `分子 $=(${xa})f(${a})-${a === 1 ? "" : a}\\{f(x)-f(${a})\\}$`,
                `$\\to f(${a})-${a === 1 ? "" : a}f'(${a})=${A}-${a === 1 ? "" : `${a}\\times`}${par(B)}=${ans}$`,
              ],
        };
      }),
      t("HIII-bibun-4d", (r) => {
        const p = rnz(r, -3, 3), q = rnz(r, -3, 3), x0 = r(1, 3);
        const cubic = r(0, 1) === 1;
        const sp = p > 0 ? "+" : "-", ap = Math.abs(p) === 1 ? "" : Math.abs(p);
        const extra = cubic ? `${sp}${ap}xy(x+y)` : `${sp}${ap}xy`;
        const extraH = cubic ? `${sp}${ap}xh(x+h)` : `${sp}${ap}xh`;
        const lim2 = cubic ? `${sp}${ap}x(x+h)` : `${sp}${ap}x`;
        const fp = lin([[q, 1, ""], [p, 1, cubic ? "x^{2}" : "x"]]);
        const fx = lin([[q, 1, "x"], [p, cubic ? 3 : 2, cubic ? "x^{3}" : "x^{2}"]]);
        const [an, ad] = cubic ? [3 * q * x0 + p * x0 ** 3, 3] : [2 * q * x0 + p * x0 ** 2, 2];
        return {
          q: `微分可能な関数 $f(x)$ が、すべての実数 $x$, $y$ について $f(x+y)=f(x)+f(y)${extra}$ を満たし、$f'(0)=${q}$ であるとき、$f(${x0})$ の値を求めよ。`,
          ans: fracAns(an, ad),
          hint: "$x=y=0$ とおいて $f(0)$ を求め、導関数の定義 $f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}$ に与えられた式を使う。",
          steps: [
            `$x=y=0$ とおくと $f(0)=2f(0)$ より $f(0)=0$`,
            `$\\frac{f(x+h)-f(x)}{h}=\\frac{f(h)${extraH}}{h}=\\frac{f(h)-f(0)}{h}${lim2}\\to f'(0)${cubic ? `${sp}${ap}x^{2}` : `${sp}${ap}x`}$ より $f'(x)=${fp}$`,
            `$f(0)=0$ より $f(x)=${fx}$`,
            `$f(${x0})=${fracTex(an, ad)}$`,
          ],
        };
      }),
      t("HIII-bibun-4e", (r) => {
        const s = pick(r, [1, -1]), isSin = r(0, 1) === 1, n = r(3, 10);
        let re = 1, im = 0; // (s+i)^n
        for (let k = 0; k < n; k++) [re, im] = [s * re - im, re + s * im];
        const ans = isSin ? im : re;
        const E = s === 1 ? "e^{x}" : "e^{-x}", T = isSin ? "\\sin" : "\\cos";
        const kk = s === 1 ? 1 : 3, th = s === 1 ? "\\frac{\\pi}{4}" : "\\frac{3}{4}\\pi";
        const d1 = s === 1 ? (isSin ? `${E}(\\sin x+\\cos x)` : `${E}(\\cos x-\\sin x)`) : isSin ? `${E}(\\cos x-\\sin x)` : `-${E}(\\sin x+\\cos x)`;
        return {
          q: `$f(x)=${E}${T} x$ のとき、第 ${n} 次導関数の値 $f^{(${n})}(0)$ を求めよ。`,
          ans,
          hint: `$f'(x)$ を三角関数の合成で $\\sqrt{2}${E}${T}(x+\\alpha)$ の形に直すと、微分するたびに同じ変化がくり返される。`,
          steps: [
            `$f'(x)=${d1}=\\sqrt{2}${E}${T}\\left(x+${th}\\right)$`,
            `微分するたびに $\\sqrt{2}$ 倍になり角が $${th}$ ずつ増えるので $f^{(n)}(x)=(\\sqrt{2})^{n}${E}${T}\\left(x+\\frac{${kk === 1 ? "" : kk}n\\pi}{4}\\right)$`,
            `$f^{(${n})}(0)=(\\sqrt{2})^{${n}}${T} ${piT(n * kk, 4)}=${ans}$`,
          ],
        };
      }),
    ],
  },
};

// ── 微分の応用 ───────────────────────────────────────
const E_ = Math.E;
/** 1/(a e) の TeX */
const invAE = (a) => (a === 1 ? "\\frac{1}{e}" : `\\frac{1}{${a}e}`);

const BIBUNOUYO = {
  id: "HIII-bibunouyo",
  grade: "H3",
  area: "func",
  name: "微分の応用",
  desc: "接線・増減・極値・凹凸・最大最小",
  prereqs: ["HIII-bibun"],
  course: "数学III",
  rikei: true,
  points: [
    "接線 $y-f(a)=f'(a)(x-a)$。曲線外の点から引く接線は、接点を $(t,f(t))$ とおいて通る条件を立てる。",
    "$f'(x)$ の符号で増減・極値、$f''(x)$ の符号で凹凸（符号が変わる点が変曲点）。",
    "最大・最小は「極値」と「区間の端」を比べる。$\\lim$ で端の様子も確認。",
    "方程式 $f(x)=k$ の実数解の個数は、$y=f(x)$ のグラフと直線 $y=k$ の共有点の個数（定数を分離する）。",
  ],
  levels: {
    1: [
      t("HIII-bibunouyo-1a", (r) => {
        const kind = r(0, 2);
        const c = rnz(r, -3, 3);
        let fT, m;
        if (kind === 0) { const a = pick(r, [1, 2, 3, -1, -2]); fT = co(c, eax(a)); m = a * c; }
        else if (kind === 1) { const a = r(1, 3); fT = `${trigF("sin", a)}${signed(c)}`; m = a; }
        else { const a = r(1, 3); fT = `\\log(${poly([a, 1])})${signed(c)}`; m = a; }
        const b = c;
        const line = (M, Md, B) => `$y=${lin([[M, Md, "x"], [B, 1, ""]])}$`;
        const ans = line(m, 1, b);
        return {
          q: `曲線 $y=${fT}$ 上の点 $(0,\\ ${b})$ における接線の方程式を求めよ。`,
          ans,
          choices: choices4(r, ans, [line(m, 1, 0), line(b, 1, m), line(m, 1, -b), line(-1, m, b)]),
          hint: "接線は $y-f(0)=f'(0)(x-0)$。まず $f'(0)$ を求める。",
          steps: [`$f'(0)=${m}$、$f(0)=${b}$`, `接線は ${ans}`],
        };
      }),
      t("HIII-bibunouyo-1b", (r) => {
        if (r(0, 1) === 0) {
          const a = r(2, 6);
          const ans = `$${a}-${a}\\log ${a}$`;
          return {
            q: `関数 $f(x)=x-${a}\\log x$（$x>0$）の極小値を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${a}+${a}\\log ${a}$`, `$${a}\\log ${a}-${a}$`, "$1$", `$${a}-\\log ${a}$`]),
            hint: "$f'(x)=0$ となる x を求め、その前後で $f'(x)$ の符号を調べる。",
            steps: [
              `$f'(x)=1-\\frac{${a}}{x}=\\frac{x-${a}}{x}$`,
              `$0<x<${a}$ で $f'<0$、$x>${a}$ で $f'>0$ なので $x=${a}$ で極小`,
              `極小値は $f(${a})=${a}-${a}\\log ${a}$`,
            ],
          };
        }
        const a = r(1, 4);
        const ans = `$${invAE(a)}$`;
        return {
          q: `関数 $f(x)=x${eax(-a)}$ の極大値を求めよ。`,
          ans,
          choices: choices4(r, ans, a === 1 ? ["$e$", "$1$", "$\\frac{1}{e^{2}}$"] : [`$\\frac{1}{${eT(a)}}$`, `$\\frac{${a}}{e}$`, `$\\frac{e}{${a}}$`, `$\\frac{1}{${a}}$`, `$\\frac{1}{${a}e^{2}}$`]),
          hint: "積の微分で $f'(x)$ を求め、$f'(x)=0$ の x を代入する。",
          steps: [
            `$f'(x)=(1${a === 1 ? "-x" : `-${a}x`})${eax(-a)}$`,
            `$x=${fracTex(1, a)}$ の前後で $f'$ は正から負に変わるので極大`,
            `極大値は $f\\left(${fracTex(1, a)}\\right)=${a === 1 ? "" : fracTex(1, a)}e^{-1}=${invAE(a)}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-1c", (r) => {
        if (r(0, 1) === 0) {
          const a = pick(r, [1, 2, 3, -1, -2, -3]);
          return {
            q: `曲線 $y=x${eax(a)}$ の変曲点の x 座標を求めよ。`,
            ans: fracAns(-2, a),
            hint: "$y''$ を求め、符号が変わる x を探す。",
            steps: [
              `$y'=(${poly([a, 1])})${eax(a)}$`,
              `$y''=${co(a, `(${poly([a, 2])})`)}${eax(a)}$`,
              `$x=${fracTex(-2, a)}$ の前後で $y''$ の符号が変わるので変曲点の x 座標は $${fracTex(-2, a)}$`,
            ],
          };
        }
        const s = r(1, 4);
        return {
          q: `曲線 $y=\\log(x^{2}+${s * s})$ の変曲点のうち、x 座標が正であるものの x 座標を求めよ。`,
          ans: s,
          hint: "$y''$ を求め、符号が変わる x を探す。",
          steps: [
            `$y'=\\frac{2x}{x^{2}+${s * s}}$`,
            `$y''=\\frac{2(${s * s}-x^{2})}{(x^{2}+${s * s})^{2}}$`,
            `$x=\\pm${s}$ で $y''$ の符号が変わるので、正の方は $x=${s}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-1d", (r) => {
        const mode = r(0, 2), e = rnz(r, -3, 3), d = e / 100;
        const dec = (v) => String(round(v));
        const pm = (v) => (v < 0 ? `-${dec(-v)}` : `+${dec(v)}`);
        const hint = "$h$ が $0$ に近いとき $f(a+h)\\fallingdotseq f(a)+f'(a)h$（1次の近似式）。計算しやすい $a$ を選ぶ。";
        if (mode === 2) {
          const x = round(1 + d);
          return {
            q: `1次の近似式を用いて、$\\frac{1}{${dec(x)}}$ の近似値を求めよ。`,
            ans: round(1 - d),
            hint,
            steps: [`$f(x)=\\frac{1}{x}$ とすると $f'(x)=-\\frac{1}{x^{2}}$。$a=1$, $h=${dec(d)}$ とする`, `$\\frac{1}{${dec(x)}}\\fallingdotseq f(1)+f'(1)h=1${pm(-d)}=${dec(1 - d)}$`],
          };
        }
        const cube = mode === 1;
        const a = cube ? r(1, 3) : r(1, 5), A = cube ? a ** 3 : a * a, h = round((cube ? 3 * a * a : 2 * a) * d), x = round(A + h);
        const rt = (v) => (cube ? `\\sqrt[3]{${v}}` : `\\sqrt{${v}}`);
        return {
          q: `1次の近似式を用いて、$${rt(dec(x))}$ の近似値を求めよ。`,
          ans: round(a + d),
          hint,
          steps: [
            cube
              ? `$f(x)=\\sqrt[3]{x}$ とすると $f'(x)=\\frac{1}{3\\sqrt[3]{x^{2}}}$。$a=${A}$, $h=${dec(h)}$ とする`
              : `$f(x)=\\sqrt{x}$ とすると $f'(x)=\\frac{1}{2\\sqrt{x}}$。$a=${A}$, $h=${dec(h)}$ とする`,
            `$${rt(dec(x))}\\fallingdotseq ${a}+\\frac{1}{${cube ? 3 * a * a : 2 * a}}\\times${h < 0 ? `(${dec(h)})` : dec(h)}=${a}${pm(d)}=${dec(a + d)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HIII-bibunouyo-2a", (r) => {
        const al = r(-3, 2), be = r(al + 1, 3);
        const b = -(al + be) - 2, c = al * be - b;
        const askMax = r(0, 1) === 1;
        return {
          q: `関数 $f(x)=${b === 0 && c === 0 ? "x^{2}" : `(${poly([1, b, c])})`}e^{x}$ が${askMax ? "極大値" : "極小値"}をとる x の値を求めよ。`,
          ans: askMax ? al : be,
          hint: "積の微分で $f'(x)$ を「2次式 × $e^{x}$」の形にする。$e^{x}>0$ なので2次式の符号だけ見ればよい。",
          steps: [
            `$f'(x)=(${poly([1, b + 2, b + c])})e^{x}=${al === 0 ? "x" : `(x${signed(-al)})`}${be === 0 ? "x" : `(x${signed(-be)})`}e^{x}$`,
            `$x<${al}$ で $f'>0$、$${al}<x<${be}$ で $f'<0$、$x>${be}$ で $f'>0$`,
            `極大は $x=${al}$、極小は $x=${be}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-2b", (r) => {
        const PI = Math.PI, R2 = Math.SQRT2, R3 = Math.sqrt(3);
        const T = pick(r, [
          { f: "x+2\\cos x", d: "1-2\\sin x", z: "\\frac{\\pi}{6},\\ \\frac{5}{6}\\pi", v: [["0", "2", 2], ["\\frac{\\pi}{6}", "\\frac{\\pi}{6}+\\sqrt{3}", PI / 6 + R3], ["\\frac{5}{6}\\pi", "\\frac{5}{6}\\pi-\\sqrt{3}", (5 * PI) / 6 - R3], ["\\pi", "\\pi-2", PI - 2]] },
          { f: "x+\\sqrt{2}\\cos x", d: "1-\\sqrt{2}\\sin x", z: "\\frac{\\pi}{4},\\ \\frac{3}{4}\\pi", v: [["0", "\\sqrt{2}", R2], ["\\frac{\\pi}{4}", "\\frac{\\pi}{4}+1", PI / 4 + 1], ["\\frac{3}{4}\\pi", "\\frac{3}{4}\\pi-1", (3 * PI) / 4 - 1], ["\\pi", "\\pi-\\sqrt{2}", PI - R2]] },
          { f: "x-2\\sin x", d: "1-2\\cos x", z: "\\frac{\\pi}{3}", v: [["0", "0", 0], ["\\frac{\\pi}{3}", "\\frac{\\pi}{3}-\\sqrt{3}", PI / 3 - R3], ["\\pi", "\\pi", PI]] },
          { f: "x-\\sqrt{2}\\sin x", d: "1-\\sqrt{2}\\cos x", z: "\\frac{\\pi}{4}", v: [["0", "0", 0], ["\\frac{\\pi}{4}", "\\frac{\\pi}{4}-1", PI / 4 - 1], ["\\pi", "\\pi", PI]] },
          { f: "2\\sin x+\\sin 2x", d: "2\\cos x+2\\cos 2x=2(2\\cos x-1)(\\cos x+1)", z: "\\frac{\\pi}{3},\\ \\pi", v: [["0", "0", 0], ["\\frac{\\pi}{3}", "\\frac{3\\sqrt{3}}{2}", (3 * R3) / 2], ["\\pi", "0", 0]] },
          { f: "e^{x}\\sin x", d: "e^{x}(\\sin x+\\cos x)", z: "\\frac{3}{4}\\pi", v: [["0", "0", 0], ["\\frac{3}{4}\\pi", "\\frac{\\sqrt{2}}{2}e^{\\frac{3}{4}\\pi}", (R2 / 2) * Math.exp((3 * PI) / 4)], ["\\pi", "0", 0]] },
        ]);
        const askMax = r(0, 1) === 1;
        const best = T.v.reduce((acc, x) => (askMax ? (x[2] > acc[2] ? x : acc) : x[2] < acc[2] ? x : acc));
        const ans = `$${best[1]}$`;
        const crit = T.v.filter((x) => x[0] !== "0" && x[0] !== "\\pi");
        return {
          q: `関数 $f(x)=${T.f}$（$0\\leqq x\\leqq\\pi$）の${askMax ? "最大値" : "最小値"}を求めよ。`,
          ans,
          choices: choices4(r, ans, [...T.v.map((x) => `$${x[1]}$`), ...crit.map((x) => `$${x[0]}$`), "$1$", "$\\pi+1$"]),
          hint: "$f'(x)=0$ となる x と区間の両端での値をすべて比べる。",
          steps: [
            `$f'(x)=${T.d}$、$f'(x)=0$ となるのは $x=${T.z}$`,
            T.v.map((x) => `$f(${x[0]})=${x[1]}$`).join("、"),
            `値を比べて${askMax ? "最大値" : "最小値"}は $${best[1]}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-2c", (r) => {
        if (r(0, 1) === 0) {
          const a = pick(r, [1, 2, 3, -1, -2]);
          const ans = `$${co(a, "e")}$`;
          return {
            q: `原点から曲線 $y=${eax(a)}$ に引いた接線の傾きを求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${a}$`, `$${co(a, "e^{2}")}$`, `$${a > 0 ? "-" : ""}\\frac{1}{${Math.abs(a) === 1 ? "" : Math.abs(a)}e}$`, `$${co(-a, "e")}$`]),
            hint: "接点を $(t,\\ e^{at})$ とおき、接線が原点を通る条件から t を決める。",
            steps: [
              `接点 $(t,\\ ${eax(a, "t")})$ での接線：$y=${co(a, eax(a, "t"))}(x-t)+${eax(a, "t")}$`,
              `原点を通る：$0=${co(-a, "t")}${eax(a, "t")}+${eax(a, "t")}$ より $t=${fracTex(1, a)}$`,
              `傾き $${co(a, eax(a, "t"))}$ に $t=${fracTex(1, a)}$ を代入して $${co(a, "e")}$`,
            ],
          };
        }
        const c = r(1, 4);
        const ans = `$\\frac{${c}}{e}$`;
        return {
          q: `原点から曲線 $y=${c === 1 ? "" : c}\\log x$ に引いた接線の傾きを求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${c}$`, `$${co(c, "e")}$`, `$\\frac{${c}}{e^{2}}$`, `$${invAE(c)}$`, `$\\frac{${c + 1}}{e}$`]),
          hint: "接点を $(t,\\ c\\log t)$ とおき、接線が原点を通る条件から t を決める。",
          steps: [
            `接点 $(t,\\ ${c === 1 ? "" : c}\\log t)$ での接線：$y=\\frac{${c}}{t}(x-t)+${c === 1 ? "" : c}\\log t$`,
            `原点を通る：$0=-${c}+${c === 1 ? "" : c}\\log t$ より $t=e$`,
            `傾きは $\\frac{${c}}{e}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-2d", (r) => {
        const a = r(1, 2), b = r(-4, 4), c = r(-5, 5), d = rnz(r, -3, 3);
        const K = b + a * d, R = c + d * K; // ax^2+bx+c=(x-d)(ax+K)+R
        if (R === 0) return { skip: true };
        const num = poly([a, b, c]), den = poly([1, -d]), Q = lin([[a, 1, "x"], [K, 1, ""]]);
        const L = (k) => `y=${lin([[a, 1, "x"], [k, 1, ""]])}`;
        const ch = (X, k) => `$x=${X}$, $${L(k)}$`;
        const ans = ch(d, K);
        const fr = `${R < 0 ? "-" : "+"}\\frac{${Math.abs(R)}}{${den}}`;
        return {
          q: `曲線 $y=\\frac{${num}}{${den}}$ の漸近線を求めよ。`,
          ans,
          choices: choices4(r, ans, [ch(-d, K), ch(d, b), ch(d, b - a * d), ch(d, 0)]),
          hint: "分子を分母でわって $y=mx+k+\\frac{c}{x-p}$ の形にし、$x\\to\\pm\\infty$ と $x\\to p$ のようすを調べる。",
          steps: [
            `$${num}=(${den})(${Q})${signed(R)}$ より $y=${Q}${fr}$`,
            `$x\\to\\pm\\infty$ のとき $${fr.replace(/^\+/, "")}\\to0$ なので、直線 $${L(K)}$ は漸近線`,
            `$x\\to ${d}$ のとき $|y|\\to\\infty$ なので、直線 $x=${d}$ も漸近線`,
          ],
        };
      }),
    ],
    3: [
      t("HIII-bibunouyo-3a", (r) => {
        const fam = r(0, 2);
        const EPS = 1e-9;
        let eq, k, cnt, steps;
        if (fam === 0) {
          k = pick(r, [["-1", -1], ["\\frac{1}{2}", 0.5], ["2", 2], ["e", E_], ["e", E_], ["3", 3], ["2e", 2 * E_], ["e^{2}", E_ * E_], ["\\frac{e}{2}", E_ / 2]]);
          cnt = k[1] < 0 ? 1 : Math.abs(k[1] - E_) < EPS ? 1 : k[1] < E_ ? 0 : 2;
          eq = `e^{x}=${k[0] === "-1" ? "-" : k[0]}x`;
          steps = [
            "$x=0$ は解でないので $\\frac{e^{x}}{x}=k$ と分離する",
            "$g(x)=\\frac{e^{x}}{x}$ は $x<0$ で減少して値は負、$x>0$ では $x=1$ で最小値 $e$",
          ];
        } else if (fam === 1) {
          k = pick(r, [["-1", -1], ["0", 0], ["\\frac{1}{4}", 0.25], ["\\frac{1}{3}", 1 / 3], ["\\frac{1}{e}", 1 / E_], ["\\frac{1}{e}", 1 / E_], ["\\frac{1}{2}", 0.5], ["1", 1], ["\\frac{1}{e^{2}}", 1 / (E_ * E_)]]);
          cnt = k[1] <= 0 ? 1 : Math.abs(k[1] - 1 / E_) < EPS ? 1 : k[1] < 1 / E_ ? 2 : 0;
          eq = k[0] === "0" ? "\\log x=0" : `\\log x=${k[0] === "-1" ? "-" : k[0] === "1" ? "" : k[0]}x`;
          steps = [
            "$\\frac{\\log x}{x}=k$（$x>0$）と分離する",
            "$g(x)=\\frac{\\log x}{x}$ は $x=e$ で最大値 $\\frac{1}{e}$、$x\\to+0$ で $-\\infty$、$x\\to\\infty$ で $0$ に近づく（正の値のまま）",
          ];
        } else {
          k = pick(r, [["-1", -1], ["0", 0], ["\\frac{1}{4}", 0.25], ["\\frac{1}{3}", 1 / 3], ["\\frac{1}{e}", 1 / E_], ["\\frac{1}{e}", 1 / E_], ["\\frac{1}{2}", 0.5], ["\\frac{1}{e^{2}}", 1 / (E_ * E_)]]);
          cnt = k[1] <= 0 ? 1 : Math.abs(k[1] - 1 / E_) < EPS ? 1 : k[1] < 1 / E_ ? 2 : 0;
          eq = `xe^{-x}=${k[0]}`;
          steps = [
            "$g(x)=xe^{-x}$ とおくと $g'(x)=(1-x)e^{-x}$",
            "$g$ は $x=1$ で最大値 $\\frac{1}{e}$、$x\\to-\\infty$ で $-\\infty$、$x\\to\\infty$ で $0$ に近づく（正の値のまま）",
          ];
        }
        return {
          q: `方程式 $${eq}$ の異なる実数解の個数を求めよ。`,
          ans: cnt,
          unit: "個",
          hint: "定数を分離して $g(x)=k$ の形にし、$y=g(x)$ のグラフと直線 $y=k$ の共有点を数える。",
          steps: [...steps, `$k=${k[0]}$ との共有点は ${cnt} 個`],
        };
      }),
      t("HIII-bibunouyo-3b", (r) => {
        const n = r(1, 4);
        if (r(0, 1) === 0) {
          const ans = `$${invAE(n)}$`;
          return {
            q: `関数 $f(x)=\\frac{\\log x}{${xp(n)}}$（$x>0$）の最大値を求めよ。`,
            ans,
            choices: choices4(r, ans, ["$\\frac{1}{e}$", `$${eT(1, n)}$`, `$\\frac{${n}}{e}$`, `$\\frac{1}{${eT(n)}}$`, "$\\frac{1}{e^{2}}$", "$\\frac{1}{2e}$"]),
            hint: "商の微分で $f'(x)$ を求め、$f'(x)=0$ となる x を $e$ の累乗で表す。",
            steps: [
              `$f'(x)=\\frac{1-${n === 1 ? "" : n}\\log x}{${xp(n + 1)}}$`,
              `$\\log x=${fracTex(1, n)}$ すなわち $x=${eT(1, n)}$ の前後で $f'$ は正から負へ`,
              `最大値は $f(${eT(1, n)})=${n === 1 ? "" : `\\frac{${fracTex(1, n)}}{e}=`}${invAE(n)}$`,
            ],
          };
        }
        const N = n ** n;
        const ans = `$\\frac{${N}}{${eT(n)}}$`;
        return {
          q: `関数 $f(x)=${xp(n)}e^{-x}$（$x\\geqq0$）の最大値を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${n}$`, `$\\frac{${n}}{e}$`, `$\\frac{${N}}{e}$`, `$\\frac{${N}}{${eT(n + 1)}}$`, `$${N}$`, "$e$", `$\\frac{${n + 1}}{e}$`]),
          hint: "積の微分で $f'(x)$ を求め、増減表をかく。",
          steps: [
            `$f'(x)=${n === 1 ? "" : xp(n - 1)}(${n}-x)e^{-x}$`,
            `$x=${n}$ の前後で $f'$ は正から負へ変わる`,
            `最大値は $f(${n})=\\frac{${N}}{${eT(n)}}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-3c", (r) => {
        const s = r(1, 3), tt = r(s + 1, 4);
        if (r(0, 1) === 0) {
          const m = r(1, 3);
          const a = m * s * s, b = m * tt * tt;
          return {
            q: `関数 $f(x)=\\frac{1}{x}$ と区間 $${a}\\leqq x\\leqq${b}$ について、平均値の定理 $\\frac{f(${b})-f(${a})}{${b}-${a}}=f'(c)$, $${a}<c<${b}$ を満たす c の値を求めよ。`,
            ans: m * s * tt,
            hint: "左辺を計算し、$f'(c)=-\\frac{1}{c^{2}}$ と等しいとおく。",
            steps: [
              `左辺 $=\\frac{\\frac{1}{${b}}-${a === 1 ? "1" : `\\frac{1}{${a}}`}}{${b - a}}=-\\frac{1}{${a * b}}$`,
              `$-\\frac{1}{c^{2}}=-\\frac{1}{${a * b}}$ より $c^{2}=${a * b}$`,
              `$${a}<c<${b}$ より $c=${m * s * tt}$`,
            ],
          };
        }
        const a = s * s, b = tt * tt;
        return {
          q: `関数 $f(x)=\\sqrt{x}$ と区間 $${a}\\leqq x\\leqq${b}$ について、平均値の定理 $\\frac{f(${b})-f(${a})}{${b}-${a}}=f'(c)$, $${a}<c<${b}$ を満たす c の値を求めよ。`,
          ans: fracAns((s + tt) * (s + tt), 4),
          hint: "左辺を計算し、$f'(c)=\\frac{1}{2\\sqrt{c}}$ と等しいとおく。",
          steps: [
            `左辺 $=\\frac{${tt}-${s}}{${b - a}}=\\frac{1}{${s + tt}}$`,
            `$\\frac{1}{2\\sqrt{c}}=\\frac{1}{${s + tt}}$ より $\\sqrt{c}=${fracTex(s + tt, 2)}$`,
            `$c=${fracTex((s + tt) * (s + tt), 4)}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-3d", (r) => {
        const t0 = r(1, 3), M = r(1, 4);
        const a = 2 * t0 * M, b = M * (1 - t0 * t0), T = t0 === 1 ? "" : t0;
        return {
          q: `関数 $f(x)=\\frac{ax+b}{x^{2}+1}$ が $x=${t0}$ で極大値 $${M}$ をとるように、定数 $a$, $b$ の値を定める。このとき、$f(x)$ の極小値を求めよ。`,
          ans: -M * t0 * t0,
          hint: `$f'(${t0})=0$ と $f(${t0})=${M}$ から $a$, $b$ を求め、増減を調べて本当に $x=${t0}$ で極大になることを確かめる。`,
          steps: [
            `$f'(x)=\\frac{a(x^{2}+1)-(ax+b)\\cdot2x}{(x^{2}+1)^{2}}=\\frac{-ax^{2}-2bx+a}{(x^{2}+1)^{2}}$`,
            `$f'(${t0})=0$ より $${lin([[1 - t0 * t0, 1, "a"], [-2 * t0, 1, "b"]])}=0$、$f(${t0})=${M}$ より $${lin([[t0, 1, "a"], [1, 1, "b"]])}=${M * (t0 * t0 + 1)}$。よって $a=${a}$, $b=${b}$`,
            `このとき $f'(x)=\\frac{-${2 * M}(${T}x+1)(x-${t0})}{(x^{2}+1)^{2}}$ で、$x=${t0}$ で極大（条件に合う）、$x=${fracTex(-1, t0)}$ で極小`,
            `極小値は $f\\left(${fracTex(-1, t0)}\\right)=${-M * t0 * t0}$`,
          ],
        };
      }),
    ],
    4: [
      t("HIII-bibunouyo-4a", (r) => {
        const n = r(1, 3);
        const thT = ["", "e", "\\frac{e^{2}}{4}", "\\frac{e^{3}}{27}"][n];
        const th = E_ ** n / n ** n;
        const A = r(0, 3) === 0 ? [thT, th] : pick(r, [["1", 1], ["2", 2], ["3", 3], ["\\frac{1}{2}", 0.5], ["e", E_], ["\\frac{e^{2}}{4}", (E_ * E_) / 4], ["\\frac{e^{3}}{27}", E_ ** 3 / 27], ["\\frac{e^{2}}{2}", (E_ * E_) / 2], ["\\frac{1}{4}", 0.25]]);
        const cnt = Math.abs(A[1] - th) < 1e-9 ? 1 : A[1] < th ? 0 : 2;
        const rhs = `${A[0] === "1" ? "" : A[0]}${xp(n)}`;
        return {
          q: `方程式 $e^{x}=${rhs}$ の正の実数解の個数を求めよ。`,
          ans: cnt,
          unit: "個",
          hint: `$\\frac{e^{x}}{${xp(n)}}=a$ と定数を分離し、左辺の最小値と比べる。`,
          steps: [
            `$x>0$ で $g(x)=\\frac{e^{x}}{${xp(n)}}$ とおくと $g'(x)=\\frac{e^{x}(x-${n})}{${xp(n + 1)}}$`,
            `$g$ は $x=${n}$ で最小値 $${thT}$、$x\\to+0$ と $x\\to\\infty$ で $\\infty$`,
            `$${A[0]}$ と $${thT}$ を比べて、共有点は ${cnt} 個`,
          ],
        };
      }),
      t("HIII-bibunouyo-4b", (r) => {
        const R = r(1, 6), R3 = R ** 3;
        if (r(0, 1) === 0) {
          const ans = `$${piT(32 * R3, 81)}$`;
          return {
            q: `半径 ${R} の球に内接する直円錐の体積の最大値を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(32 * R3, 27)}$`, `$${piT(16 * R3, 81)}$`, `$${piT(R3, 3)}$`]),
            hint: "円錐の高さ h を変数にし、底面の半径を h で表して体積を h の3次関数にする。",
            steps: [
              `高さ $h$（$0<h<${2 * R}$）、底面の半径 $\\rho$ とすると $\\rho^{2}=h(${2 * R}-h)$`,
              `$V=\\frac{\\pi}{3}h^{2}(${2 * R}-h)$、$V'=\\frac{\\pi}{3}h(${4 * R}-3h)$`,
              `$h=${fracTex(4 * R, 3)}$ で最大：$V=${piT(32 * R3, 81)}$`,
            ],
          };
        }
        const ans = `$${surd(4 * R3, 9, 3)}\\pi$`;
        return {
          q: `半径 ${R} の球に内接する直円柱の体積の最大値を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${surd(2 * R3, 9, 3)}\\pi$`, `$${surd(R3, 2, 2)}\\pi$`, `$${piT(4 * R3, 3)}$`]),
          hint: "球の中心から底面までの距離 x を変数にする（高さは 2x）。",
          steps: [
            `球の中心から底面までの距離を $x$（$0<x<${R}$）とすると、底面の半径の2乗は $${R * R}-x^{2}$、高さは $2x$`,
            `$V=2\\pi(${R === 1 ? "" : R * R}x-x^{3})$、$V'=2\\pi(${R * R}-3x^{2})$`,
            `$x=${surd(R, 3, 3)}$ で最大：$V=${surd(4 * R3, 9, 3)}\\pi$`,
          ],
        };
      }),
      t("HIII-bibunouyo-4c", (r) => {
        if (r(0, 1) === 0) {
          const n = pick(r, [0.5, 1, 2, 3]);
          let cur, ans, wr;
          if (n === 0.5) { cur = "y=a\\sqrt{x}"; ans = "\\frac{2}{e}"; wr = ["\\frac{1}{2e}", "\\frac{e}{2}", "\\frac{1}{e}", "\\frac{2}{e^{2}}"]; }
          else if (n === 1) { cur = "y=ax"; ans = invAE(1); wr = ["e", "1", "\\frac{1}{e^{2}}", "\\frac{2}{e}"]; }
          else { cur = `y=a${xp(n)}`; ans = invAE(n); wr = ["\\frac{1}{e}", `\\frac{e}{${n}}`, `\\frac{1}{${n}}`, `\\frac{1}{${n}e^{2}}`, `\\frac{${n}}{e}`]; }
          const TAN = {
            0.5: ["$a\\sqrt{t}=\\log t$, $\\frac{a}{2\\sqrt{t}}=\\frac{1}{t}$", "$a\\sqrt{t}=2$"],
            1: ["$at=\\log t$, $a=\\frac{1}{t}$", "$at=1$"],
            2: ["$at^{2}=\\log t$, $2at=\\frac{1}{t}$", "$at^{2}=\\frac{1}{2}$"],
            3: ["$at^{3}=\\log t$, $3at^{2}=\\frac{1}{t}$", "$at^{3}=\\frac{1}{3}$"],
          };
          return {
            q: `${n === 1 ? "直線" : "曲線"} $${cur}$ と曲線 $y=\\log x$ が接するとき、正の定数 $a$ の値を求めよ。`,
            ans: `$${ans}$`,
            choices: choices4(r, `$${ans}$`, wr.map((w) => `$${w}$`)),
            hint: "接点の x 座標を t とし、「y 座標が等しい」「傾きが等しい」の2式を立てる。",
            steps: [
              `接点の x 座標を $t$ とすると ${TAN[n][0]}`,
              `2式目より ${TAN[n][1]}、1式目に代入して $\\log t=${n === 0.5 ? 2 : fracTex(1, n)}$`,
              `$a=${ans}$`,
            ],
          };
        }
        const n = r(1, 3);
        const ans = ["", "e", "\\frac{e^{2}}{4}", "\\frac{e^{3}}{27}"][n];
        const wr = n === 1 ? ["1", "e^{2}", "\\frac{1}{e}"] : [`\\frac{${eT(n)}}{${n}}`, eT(n), `\\frac{${eT(n)}}{${n ** (n - 1)}}`, `\\frac{${eT(n - 1)}}{${n ** n}}`];
        return {
          q: `曲線 $y=e^{x}$ と${n === 1 ? "直線" : "曲線"} $y=a${xp(n)}$（$x>0$）が接するとき、定数 $a$ の値を求めよ。`,
          ans: `$${ans}$`,
          choices: choices4(r, `$${ans}$`, wr.map((w) => `$${w}$`)),
          hint: "接点の x 座標を t とし、「y 座標が等しい」「傾きが等しい」の2式を立てる。",
          steps: [
            `接点の x 座標を $t$（$t>0$）とすると $e^{t}=a${xp(n).replace("x", "t")}$, $e^{t}=${n === 1 ? "a" : `${n}at${n === 2 ? "" : `^{${n - 1}}`}`}$`,
            `2式を比べて $t=${n}$`,
            `$a=${n === 1 ? "" : `\\frac{${eT(n)}}{${n}^{${n}}}=`}${ans}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-4d", (r) => {
        const p = r(1, 3), mode = r(0, 3);
        const P = p === 1 ? "" : p, px = `${P}x`;
        const h2 = fracTex(p * p, 2);
        if (mode === 0) {
          return {
            q: `すべての $x\\geqq0$ に対して $e^{${px}}\\geqq1+${px}+ax^{2}$ が成り立つような定数 $a$ の最大値を求めよ。`,
            ans: fracAns(p * p, 2),
            hint: `$g(x)=e^{${px}}-1-${px}-ax^{2}$ とおくと $g(0)=g'(0)=0$。$g''(0)$ の符号から $a$ の条件をしぼり、その $a$ で $g(x)\\geqq0$ を確かめる。`,
            steps: [
              `$g(x)=e^{${px}}-1-${px}-ax^{2}$ とおくと $g(0)=0$、$g'(x)=${P}e^{${px}}-${p}-2ax$ で $g'(0)=0$、$g''(x)=${p * p === 1 ? "" : p * p}e^{${px}}-2a$`,
              `$a>${h2}$ なら $g''(0)<0$ なので、$x=0$ の近くで $g''(x)<0$。すると $g'(x)<0$、$g(x)<0$（$x>0$ が小さいとき）となり不適`,
              `$a=${h2}$ のとき、$x\\geqq0$ で $g''(x)=${p === 1 ? "e^{x}-1" : `${p * p}(e^{${px}}-1)`}\\geqq0$ より $g'(x)\\geqq g'(0)=0$、$g(x)\\geqq g(0)=0$ で成り立つ`,
              `よって最大値は $${h2}$`,
            ],
          };
        }
        if (mode === 1) {
          return {
            q: `すべての $x\\geqq0$ に対して $\\log(1+${px})\\geqq ${px}-ax^{2}$ が成り立つような定数 $a$ の最小値を求めよ。`,
            ans: fracAns(p * p, 2),
            hint: `$g(x)=\\log(1+${px})-${px}+ax^{2}$ とおくと $g(0)=0$。$g'(x)$ を通分して、$x>0$ が小さいときの符号から $a$ の条件をしぼる。`,
            steps: [
              `$g(x)=\\log(1+${px})-${px}+ax^{2}$ とおくと $g(0)=0$、$g'(x)=\\frac{${p}}{1+${px}}-${p}+2ax=\\frac{x\\{2a(1+${px})-${p * p}\\}}{1+${px}}$`,
              `$a<${h2}$ なら、$x>0$ が小さいとき $2a(1+${px})-${p * p}<0$ で $g'(x)<0$、$g(x)<0$ となり不適`,
              `$a=${h2}$ のとき $g'(x)=\\frac{${p ** 3 === 1 ? "" : p ** 3}x^{2}}{1+${px}}\\geqq0$ より $g(x)\\geqq g(0)=0$ で成り立つ`,
              `よって最小値は $${h2}$`,
            ],
          };
        }
        if (mode === 2) {
          return {
            q: `すべての実数 $x$ に対して $\\cos ${px}\\geqq1-ax^{2}$ が成り立つような定数 $a$ の最小値を求めよ。`,
            ans: fracAns(p * p, 2),
            hint: `$g(x)=\\cos ${px}-1+ax^{2}$ は偶関数なので $x\\geqq0$ で考える。$g(0)=g'(0)=0$、$g''(0)$ の符号から $a$ の条件をしぼる。`,
            steps: [
              `$g(x)=\\cos ${px}-1+ax^{2}$ は偶関数なので $x\\geqq0$ で考える。$g(0)=0$、$g'(x)=-${P}\\sin ${px}+2ax$ で $g'(0)=0$、$g''(x)=-${p * p === 1 ? "" : p * p}\\cos ${px}+2a$`,
              `$a<${h2}$ なら $g''(0)<0$ なので、$x>0$ が小さいとき $g'(x)<0$、$g(x)<0$ となり不適`,
              `$a=${h2}$ のとき $g''(x)=${p === 1 ? "1-\\cos x" : `${p * p}(1-\\cos ${px})`}\\geqq0$ より $g'(x)\\geqq0$、$g(x)\\geqq0$（$x\\geqq0$）で成り立つ`,
              `よって最小値は $${h2}$`,
            ],
          };
        }
        const h3 = fracTex(p ** 3, 6);
        return {
          q: `すべての $x\\geqq0$ に対して $\\sin ${px}\\geqq ${px}-ax^{3}$ が成り立つような定数 $a$ の最小値を求めよ。`,
          ans: fracAns(p ** 3, 6),
          hint: `$g(x)=\\sin ${px}-${px}+ax^{3}$ とおくと $g(0)=g'(0)=g''(0)=0$。$g'''(0)$ の符号から $a$ の条件をしぼり、その $a$ で $g(x)\\geqq0$ を確かめる。`,
          steps: [
            `$g(x)=\\sin ${px}-${px}+ax^{3}$ とおくと $g(0)=g'(0)=g''(0)=0$、$g'''(x)=-${p ** 3 === 1 ? "" : p ** 3}\\cos ${px}+6a$`,
            `$a<${h3}$ なら $g'''(0)<0$ なので、$x>0$ が小さいとき $g''<0$、$g'<0$、$g<0$ となり不適`,
            `$a=${h3}$ のとき $g'''(x)=${p === 1 ? "1-\\cos x" : `${p ** 3}(1-\\cos ${px})`}\\geqq0$ より $g''\\geqq0$、$g'\\geqq0$、$g\\geqq0$（$x\\geqq0$）で成り立つ`,
            `よって最小値は $${h3}$`,
          ],
        };
      }),
      t("HIII-bibunouyo-4e", (r) => {
        const c = pick(r, [2, 3]), k = c === 2 ? r(2, 6) : r(2, 7);
        const xs = k / Math.log(c), n0 = Math.floor(xs);
        const up = (n0 + 1) ** k, dn = c * n0 ** k; // a_{n0+1}/a_{n0} = up/dn
        if (up === dn) return { skip: true };
        const N = up > dn ? n0 + 1 : n0;
        return {
          q: `数列 $a_{n}=\\frac{n^{${k}}}{${c}^{n}}$（$n=1,\\ 2,\\ 3,\\ \\cdots$）について、$a_{n}$ が最大となる $n$ の値を求めよ。`,
          ans: N,
          hint: `関数 $f(x)=\\frac{x^{${k}}}{${c}^{x}}$（$x>0$）の増減を調べて候補の $n$ を2つにしぼり、その2項を比べる。`,
          steps: [
            `$f(x)=x^{${k}}\\cdot${c}^{-x}$ とおくと $f'(x)=${xp(k - 1)}\\cdot${c}^{-x}(${k}-x\\log ${c})$。$x=\\frac{${k}}{\\log ${c}}\\fallingdotseq${xs.toFixed(2)}$ まで増加し、その後減少する`,
            `よって最大となるのは $n=${n0}$ か $n=${n0 + 1}$。$\\frac{a_{${n0 + 1}}}{a_{${n0}}}=\\frac{${n0 + 1}^{${k}}}{${c}\\cdot${n0}^{${k}}}=\\frac{${up}}{${dn}}${up > dn ? ">" : "<"}1$`,
            `したがって $a_{n}$ が最大となるのは $n=${N}$`,
          ],
        };
      }),
    ],
  },
};

// ── 積分法 ───────────────────────────────────────────
/** 先頭以外に置く項（+ を補う） */
const plusT = (s) => (s.startsWith("-") ? s : "+" + s);

const SEKIBUN = {
  id: "HIII-sekibun",
  grade: "H3",
  area: "func",
  name: "積分法",
  desc: "置換積分・部分積分・定積分",
  prereqs: ["HIII-bibun", "HII-sekibun"],
  course: "数学III",
  rikei: true,
  points: [
    "$\\int(ax+b)^{n}dx=\\frac{1}{a}\\cdot\\frac{(ax+b)^{n+1}}{n+1}+C$。中が1次式なら「中の係数でわる」。",
    "$\\int\\frac{f'(x)}{f(x)}dx=\\log|f(x)|+C$。置換積分 $x=g(t)$ では $dx=g'(t)\\,dt$、定積分は区間も置きかえる。",
    "部分積分 $\\int f g'\\,dx=fg-\\int f'g\\,dx$。微分して簡単になる方（$x$ や $\\log x$）を $f$ にする。",
    "$\\frac{1}{x^{2}+a^{2}}$ は $x=a\\tan\\theta$、$\\sqrt{a^{2}-x^{2}}$ は $x=a\\sin\\theta$ とおく。",
  ],
  levels: {
    1: [
      t("HIII-sekibun-1a", (r) => {
        const mode = r(0, 2);
        if (mode === 0) {
          const a = pick(r, [2, 3, 4, -2, -3]), b = rnz(r, -5, 5), n = r(2, 5);
          const L = `(${poly([a, b])})`;
          const body = `${L}^{${n + 1}}`;
          const ans = `$${termTex(1, a * (n + 1), body)}+C$`;
          return {
            q: `不定積分 $\\int ${L}^{${n}}dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${termTex(1, n + 1, body)}+C$`, `$${termTex(a, n + 1, body)}+C$`, `$${termTex(1, a * n, n === 2 ? L : `${L}^{${n - 1}}`)}+C$`]),
            hint: "$ax+b=u$ と見て積分し、最後に中の係数 a でわる。",
            steps: [`$\\int ${L}^{${n}}dx=${fracTex(1, a)}\\cdot\\frac{${L}^{${n + 1}}}{${n + 1}}+C$`, `$=${termTex(1, a * (n + 1), body)}+C$`],
          };
        }
        if (mode === 1) {
          const a = pick(r, [2, 3, 4, -2, -3]), b = r(-3, 3);
          const E = `e^{${poly([a, b])}}`;
          const ans = `$${termTex(1, a, E)}+C$`;
          return {
            q: `不定積分 $\\int ${E}dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${E}+C$`, `$${termTex(a, 1, E)}+C$`, `$${termTex(-1, a, E)}+C$`]),
            hint: "$e^{u}$ の積分は $e^{u}$。中が1次式なら係数でわる。",
            steps: [`$\\int ${E}dx=${termTex(1, a, E)}+C$`],
          };
        }
        const a = r(2, 5);
        const isCos = r(0, 1) === 1;
        const S = trigF("sin", a), C = trigF("cos", a);
        const ans = isCos ? `$${termTex(1, a, S)}+C$` : `$${termTex(-1, a, C)}+C$`;
        const wr = isCos
          ? [`$${termTex(-1, a, S)}+C$`, `$${co(a, S)}+C$`, `$${S}+C$`]
          : [`$${termTex(1, a, C)}+C$`, `$${co(-a, C)}+C$`, `$-${C}+C$`];
        return {
          q: `不定積分 $\\int ${isCos ? C : S}\\,dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, wr),
          hint: isCos ? "$\\int\\cos u\\,du=\\sin u$。中の係数でわる。" : "$\\int\\sin u\\,du=-\\cos u$。符号と中の係数に注意。",
          steps: [`$${a}x=u$ とおくと $dx=\\frac{1}{${a}}du$`, `答えは ${ans}`],
        };
      }),
      t("HIII-sekibun-1b", (r) => {
        const mode = r(0, 2);
        if (mode === 0) {
          const k = r(1, 3), c = r(1, 5);
          return {
            q: `定積分 $\\int_{1}^{${eT(k)}}\\frac{${c}}{x}dx$ を求めよ。`,
            ans: c * k,
            hint: "$\\int\\frac{1}{x}dx=\\log|x|$。$\\log e^{k}=k$。",
            steps: [`$\\left[${c === 1 ? "" : c}\\log x\\right]_{1}^{${eT(k)}}=${c === 1 ? "" : c}\\log ${eT(k)}-0=${c * k}$`],
          };
        }
        if (mode === 1) {
          const a = r(1, 5);
          const v = (1 - (a % 2 === 0 ? 1 : -1));
          return {
            q: `定積分 $\\int_{0}^{\\pi}\\sin ${a === 1 ? "" : a}x\\,dx$ を求めよ。`,
            ans: fracAns(v, a),
            hint: "$\\int\\sin ax\\,dx=-\\frac{1}{a}\\cos ax$。$\\cos k\\pi=(-1)^{k}$。",
            steps: [
              `$\\left[${termTex(-1, a, `\\cos ${a === 1 ? "" : a}x`)}\\right]_{0}^{\\pi}=${a === 1 ? "-" : termTex(-1, a, "")}(\\cos ${a === 1 ? "" : a}\\pi-1)$`,
              `$\\cos ${a === 1 ? "" : a}\\pi=${a % 2 === 0 ? 1 : -1}$ より $${fracTex(v, a)}$`,
            ],
          };
        }
        const k = r(2, 6), m = r(1, 2);
        const ex = m === 1 ? "e^{x}" : "e^{2x}";
        return {
          q: `定積分 $\\int_{0}^{\\log ${k}}${ex}\\,dx$ を求めよ。`,
          ans: fracAns(k ** m - 1, m),
          hint: "$e^{\\log k}=k$ を使う。",
          steps: [
            `$\\left[${m === 1 ? "e^{x}" : "\\frac{1}{2}e^{2x}"}\\right]_{0}^{\\log ${k}}=${m === 1 ? "" : "\\frac{1}{2}"}(${k}${m === 1 ? "" : "^{2}"}-1)$`,
            `$=${fracTex(k ** m - 1, m)}$`,
          ],
        };
      }),
      t("HIII-sekibun-1c", (r) => {
        const mode = r(0, 2);
        if (mode === 0) {
          const m = r(1, 4), k = r(1, 5);
          const L = `\\log(x^{2}+${k})`;
          const ans = `$${termTex(m, 2, L)}+C$`;
          return {
            q: `不定積分 $\\int\\frac{${m === 1 ? "" : m}x}{x^{2}+${k}}dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${termTex(m, 1, L)}+C$`, `$${termTex(2 * m, 1, L)}+C$`, `$-\\frac{${m % 2 === 0 ? m / 2 : m}}{${m % 2 === 0 ? "" : "2"}(x^{2}+${k})}+C$`]),
            hint: "分母を微分すると $2x$。$\\frac{f'(x)}{f(x)}$ の形を作る。",
            steps: [`$\\frac{${m === 1 ? "" : m}x}{x^{2}+${k}}=${fracTex(m, 2)}\\cdot\\frac{2x}{x^{2}+${k}}$`, `$\\int=${termTex(m, 2, L)}+C$`],
          };
        }
        if (mode === 1) {
          const k = r(1, 5);
          const ans = `$\\log(e^{x}+${k})+C$`;
          return {
            q: `不定積分 $\\int\\frac{e^{x}}{e^{x}+${k}}dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$e^{x}\\log(e^{x}+${k})+C$`, `$\\frac{1}{e^{x}+${k}}+C$`, `$x-\\log(e^{x}+${k})+C$`]),
            hint: "分母を微分すると分子になっている。",
            steps: [`$(e^{x}+${k})'=e^{x}$ なので $\\frac{f'(x)}{f(x)}$ の形`, `$\\int=\\log(e^{x}+${k})+C$`],
          };
        }
        const b = r(-4, 4), c = r(1, 6);
        if (b * b >= 4 * c) return { skip: true };
        const u = poly([1, b, c]);
        const ans = `$\\log(${u})+C$`;
        return {
          q: `不定積分 $\\int\\frac{${poly([2, b])}}{${u}}dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$\\frac{1}{${u}}+C$`, `$\\log|${poly([2, b])}|+C$`, `$(${poly([2, b])})\\log(${u})+C$`]),
          hint: "分母を微分してみる。",
          steps: [`$(${u})'=${poly([2, b])}$ なので $\\frac{f'(x)}{f(x)}$ の形（分母は常に正）`, `$\\int=\\log(${u})+C$`],
        };
      }),
      t("HIII-sekibun-1d", (r) => {
        if (r(0, 1) === 0) {
          const isSin = r(0, 1) === 1;
          const [bT, bd, sq] = pick(r, [["\\frac{\\pi}{6}", 6, 3], ["\\frac{\\pi}{4}", 4, 1], ["\\frac{\\pi}{3}", 3, 3], ["\\frac{\\pi}{2}", 2, 0], ["\\pi", 1, 0]]);
          // ∫_0^b = b/2 ∓ sin2b/4。sin2b/4 は sq=3: √3/8, sq=1: 1/4, sq=0: 0
          const tm = (k) => (sq === 3 ? surd(k, 8, 3) : sq === 1 ? fracTex(k, 4) : "");
          const V = (pn, pd, sg, k = 1) => `$${piT(pn, pd)}${sq === 0 ? "" : `${sg < 0 ? "-" : "+"}${tm(k)}`}$`;
          const sg = isSin ? -1 : 1;
          const ans = V(1, 2 * bd, sg);
          const f = isSin ? "\\sin^{2}x" : "\\cos^{2}x";
          return {
            q: `定積分 $\\int_{0}^{${bT}}${f}\\,dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [V(1, 2 * bd, -sg), V(1, bd, sg), V(1, 2 * bd, sg, 2), `$${piT(1, 2 * bd)}$`], (i) => [`$${piT(1, 4 * bd)}$`, "$1$", `$${piT(3, 2 * bd)}$`][i]),
            hint: `半角の公式 $${f}=\\frac{1${isSin ? "-" : "+"}\\cos 2x}{2}$ で次数を下げてから積分する。`,
            steps: [
              `$\\int_{0}^{${bT}}${f}\\,dx=\\int_{0}^{${bT}}\\frac{1${isSin ? "-" : "+"}\\cos 2x}{2}dx=\\left[\\frac{x}{2}${isSin ? "-" : "+"}\\frac{\\sin 2x}{4}\\right]_{0}^{${bT}}$`,
              `$=${ans.slice(1, -1)}$`,
            ],
          };
        }
        const [m, n] = pick(r, [[3, 1], [2, 1], [1, 2], [1, 3], [3, 2], [2, 3], [4, 1], [1, 4]]);
        const S = m + n, Df = m - n, aD = Math.abs(Df);
        const c4 = (k) => [1, 0, -1, 0][((k % 4) + 4) % 4]; // cos(kπ/2)
        const part = (k) => [1 - c4(k), k]; // ∫_0^{π/2} sin kx dx = (1-cos(kπ/2))/k
        const [vn, vd] = addQ(part(S), part(Df));
        const sx = (k) => `\\sin ${k === 1 ? "" : k}x`;
        const cOver = (k) => (k === 1 ? "\\cos x" : `\\frac{\\cos ${k}x}{${k}}`);
        return {
          q: `定積分 $\\int_{0}^{\\frac{\\pi}{2}}${sx(m)}\\cos ${n === 1 ? "" : n}x\\,dx$ を求めよ。`,
          ans: fracAns(vn, 2 * vd),
          hint: "積を和に直す公式 $\\sin A\\cos B=\\frac{1}{2}\\{\\sin(A+B)+\\sin(A-B)\\}$ を使う。",
          steps: [
            `$${sx(m)}\\cos ${n === 1 ? "" : n}x=\\frac{1}{2}(${sx(S)}${Df > 0 ? "+" : "-"}${sx(aD)})$`,
            `$\\int_{0}^{\\frac{\\pi}{2}}=\\frac{1}{2}\\left[-${cOver(S)}${Df > 0 ? "-" : "+"}${cOver(aD)}\\right]_{0}^{\\frac{\\pi}{2}}$`,
            `$=${fracTex(vn, 2 * vd)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HIII-sekibun-2a", (r) => {
        const mode = r(0, 2);
        if (mode === 0) {
          const a = r(1, 2), b = r(1, 3), n = r(1, 3);
          const top = a * a + b;
          const num = top ** (n + 1) - b ** (n + 1), den = 2 * (n + 1);
          return {
            q: `定積分 $\\int_{0}^{${a}}x(x^{2}+${b})${n === 1 ? "" : `^{${n}}`}\\,dx$ を求めよ。`,
            ans: fracAns(num, den),
            hint: "$t=x^{2}+" + b + "$ とおく。積分区間も t の範囲に直す。",
            steps: [
              `$t=x^{2}+${b}$ とおくと $dt=2x\\,dx$、x: $0\\to ${a}$ のとき t: $${b}\\to ${top}$`,
              `$\\int_{${b}}^{${top}}\\frac{1}{2}${n === 1 ? "t" : `t^{${n}}`}\\,dt=\\frac{1}{2}\\left[\\frac{t^{${n + 1}}}{${n + 1}}\\right]_{${b}}^{${top}}$`,
              `$=\\frac{${top ** (n + 1)}-${b ** (n + 1)}}{${den}}=${fracTex(num, den)}$`,
            ],
          };
        }
        if (mode === 1) {
          const n = r(1, 5), m = r(1, 2);
          return {
            q: `定積分 $\\int_{1}^{${eT(m)}}\\frac{${n === 1 ? "\\log x" : `(\\log x)^{${n}}`}}{x}dx$ を求めよ。`,
            ans: fracAns(m ** (n + 1), n + 1),
            hint: "$t=\\log x$ とおくと $dt=\\frac{1}{x}dx$。",
            steps: [
              `$t=\\log x$、x: $1\\to ${eT(m)}$ のとき t: $0\\to ${m}$`,
              `$\\int_{0}^{${m}}${n === 1 ? "t" : `t^{${n}}`}dt=${m === 1 ? "" : `\\frac{${m}^{${n + 1}}}{${n + 1}}=`}${fracTex(m ** (n + 1), n + 1)}$`,
            ],
          };
        }
        const n = r(1, 6);
        return {
          q: `定積分 $\\int_{0}^{\\frac{\\pi}{2}}${n === 1 ? "\\sin x" : `\\sin^{${n}}x`}\\cos x\\,dx$ を求めよ。`,
          ans: fracAns(1, n + 1),
          hint: "$t=\\sin x$ とおくと $dt=\\cos x\\,dx$。",
          steps: [`$t=\\sin x$、x: $0\\to\\frac{\\pi}{2}$ のとき t: $0\\to1$`, `$\\int_{0}^{1}${n === 1 ? "t" : `t^{${n}}`}\\,dt=${fracTex(1, n + 1)}$`],
        };
      }),
      t("HIII-sekibun-2b", (r) => {
        if (r(0, 1) === 0) {
          const a = pick(r, [1, 2, 3, -1, -2]);
          const E = eax(a);
          const F = (p) => `$${termTex(1, a * a, `(${poly([a, p])})${E}`)}+C$`;
          const ans = F(-1);
          return {
            q: `不定積分 $\\int x${E}dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [F(1), a === -1 ? null : `$${termTex(1, a, `(x-1)${E}`)}+C$`, `$${termTex(1, a, `x${E}`)}+C$`, `$${termTex(1, a * a, `(${poly([a, -a])})${E}`)}+C$`], (i) => F(-(i + 2))),
            hint: "部分積分：$x$ を微分する側、$e^{ax}$ を積分する側にする。",
            steps: [
              `$\\int x${E}dx=${termTex(1, a, `x${E}`)}-\\int ${termTex(1, a, E)}dx$`,
              `$=${termTex(1, a, `x${E}`)}${plusT(termTex(-1, a * a, E))}+C$`,
              `$=${termTex(1, a * a, `(${poly([a, -1])})${E}`)}+C$`,
            ],
          };
        }
        const a = r(1, 3);
        const S = trigF("sin", a), C = trigF("cos", a);
        const isCos = r(0, 1) === 1;
        const F = (s1, s2, d2 = a * a) => `$${isCos ? lin([[s1, a, `x${S}`], [s2, d2, C]]) : lin([[s1, a, `x${C}`], [s2, d2, S]])}+C$`;
        const ans = isCos ? F(1, 1) : F(-1, 1);
        const wr = isCos ? [F(1, -1), F(-1, 1), F(1, 1, a)] : [F(-1, -1), F(1, 1), F(-1, 1, a)];
        return {
          q: `不定積分 $\\int x${isCos ? C : S}\\,dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, wr, (i) => F(i + 2, 1)),
          hint: "部分積分：$x$ を微分する側、三角関数を積分する側にする。",
          steps: isCos
            ? [`$\\int x${C}\\,dx=${termTex(1, a, `x${S}`)}-\\int ${termTex(1, a, S)}\\,dx$`, `$=${termTex(1, a, `x${S}`)}+${termTex(1, a * a, C)}+C$`]
            : [`$\\int x${S}\\,dx=${termTex(-1, a, `x${C}`)}+\\int ${termTex(1, a, C)}\\,dx$`, `$=${termTex(-1, a, `x${C}`)}+${termTex(1, a * a, S)}+C$`],
        };
      }),
      t("HIII-sekibun-2c", (r) => {
        const a = r(1, 4);
        const ax = a === 1 ? "x" : `${a}x`;
        const sg = a % 2 === 1 ? 1 : -1; // (-1)^{a+1}
        if (r(0, 1) === 0) {
          const ans = `$${piT(sg, a)}$`;
          return {
            q: `定積分 $\\int_{0}^{\\pi}x\\sin ${ax}\\,dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(-sg, a)}$`, `$${piT(sg, a * a)}$`, `$${piT(2 * sg, a)}$`, "$0$"]),
            hint: "部分積分。$\\cos a\\pi=(-1)^{a}$ に注意。",
            steps: [
              `$\\int_{0}^{\\pi}x\\sin ${ax}\\,dx=\\left[${termTex(-1, a, `x\\cos ${ax}`)}\\right]_{0}^{\\pi}+${a === 1 ? "" : termTex(1, a, "")}\\int_{0}^{\\pi}\\cos ${ax}\\,dx$`,
              `第1項 $=${termTex(-1, a, "\\pi")}\\times(${sg === 1 ? -1 : 1})$、第2項 $=0$`,
              `$=${piT(sg, a)}$`,
            ],
          };
        }
        const v = (a % 2 === 0 ? 1 : -1) - 1;
        return {
          q: `定積分 $\\int_{0}^{\\pi}x\\cos ${ax}\\,dx$ を求めよ。`,
          ans: fracAns(v, a * a),
          hint: "部分積分。$\\sin a\\pi=0$, $\\cos a\\pi=(-1)^{a}$。",
          steps: [
            `$=\\left[${termTex(1, a, `x\\sin ${ax}`)}\\right]_{0}^{\\pi}-${a === 1 ? "" : termTex(1, a, "")}\\int_{0}^{\\pi}\\sin ${ax}\\,dx$`,
            `$=0+\\left[${termTex(1, a * a, `\\cos ${ax}`)}\\right]_{0}^{\\pi}=${a === 1 ? "" : termTex(1, a * a, "")}(${a % 2 === 0 ? 1 : -1}-1)$`,
            `$=${fracTex(v, a * a)}$`,
          ],
        };
      }),
      t("HIII-sekibun-2d", (r) => {
        const p = r(0, 2), d = r(1, 2), q = p + d, k = r(1, 2);
        const a = p === 0 ? 1 : r(0, 1), b = a + 1, c = d * k;
        const [N, D] = reduce((b + p) * (a + q), (b + q) * (a + p));
        const lg = (n, m) => { const [x, y] = reduce(n, m); return y === 1 ? `\\log ${x}` : `\\log\\frac{${x}}{${y}}`; };
        const K = k === 1 ? "" : k;
        const X = (z) => poly([1, z]);
        const den = p === 0 ? `x(${X(q)})` : `(${X(p)})(${X(q)})`;
        const ans = `$${K}${lg(N, D)}$`;
        const W = (z) => (k === 1 ? z : `${k}\\left(${z}\\right)`);
        return {
          q: `定積分 $\\int_{${a}}^{${b}}\\frac{${c}}{${den}}dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${K}${lg(D, N)}$`, `$${c === 1 ? "" : c}${lg(N, D)}$`, `$${K}${lg(b + p, b + q)}$`, `$${K}${lg((b + p) * (b + q), (a + p) * (a + q))}$`], (i) => `$${i + 2}${lg(N, D)}$`),
          hint: `部分分数に分ける：$\\frac{1}{(x+p)(x+q)}=\\frac{1}{q-p}\\left(\\frac{1}{x+p}-\\frac{1}{x+q}\\right)$`,
          steps: [
            `$\\frac{${c}}{${den}}=${W(`\\frac{1}{${X(p)}}-\\frac{1}{${X(q)}}`)}$`,
            `$\\int_{${a}}^{${b}}=${K}\\left[\\log\\frac{${X(p)}}{${X(q)}}\\right]_{${a}}^{${b}}=${W(`${lg(b + p, b + q)}-${lg(a + p, a + q)}`)}$`,
            `$=${K}${lg(N, D)}$`,
          ],
        };
      }),
    ],
    3: [
      t("HIII-sekibun-3a", (r) => {
        const m = pick(r, [6, 4, 3]);
        if (r(0, 1) === 0) {
          const a = r(1, 4);
          const bT = m === 6 ? surd(a, 3, 3) : m === 4 ? String(a) : surd(a, 1, 3);
          const ans = `$${piT(1, m * a)}$`;
          const others = [6, 4, 3].filter((x) => x !== m);
          return {
            q: `定積分 $\\int_{0}^{${bT}}\\frac{dx}{x^{2}+${a * a}}$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(1, m)}$`, `$${piT(a, m)}$`, `$${piT(1, m * a * a)}$`, `$${piT(1, others[0] * a)}$`, `$${piT(1, others[1] * a)}$`], (i) => `$${piT(i + 2, m * a)}$`),
            hint: `$x=${a === 1 ? "" : a}\\tan\\theta$ とおく。`,
            steps: [
              `$x=${a === 1 ? "" : a}\\tan\\theta$ とおくと $dx=\\frac{${a}}{\\cos^{2}\\theta}d\\theta$、$x^{2}+${a * a}=\\frac{${a * a}}{\\cos^{2}\\theta}$`,
              `θ: $0\\to ${piT(1, m)}$、被積分関数は $${fracTex(1, a)}$ になる`,
              `$${a === 1 ? "" : `\\frac{1}{${a}}\\times`}${piT(1, m)}${a === 1 ? "" : `=${piT(1, m * a)}`}$`,
            ],
          };
        }
        const a = r(2, 4);
        const bT = m === 6 ? fracTex(a, 2) : m === 4 ? surd(a, 2, 2) : surd(a, 2, 3);
        const ans = `$${piT(1, m)}$`;
        const others = [6, 4, 3].filter((x) => x !== m);
        return {
          q: `定積分 $\\int_{0}^{${bT}}\\frac{dx}{\\sqrt{${a * a}-x^{2}}}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${piT(1, m * a)}$`, `$${piT(1, others[0])}$`, `$${piT(1, others[1])}$`, `$${piT(a, m)}$`]),
          hint: `$x=${a}\\sin\\theta$ とおく。`,
          steps: [
            `$x=${a}\\sin\\theta$ とおくと $dx=${a}\\cos\\theta\\,d\\theta$、$\\sqrt{${a * a}-x^{2}}=${a}\\cos\\theta$`,
            `θ: $0\\to ${piT(1, m)}$、被積分関数は $1$ になる`,
            `$\\int_{0}^{${piT(1, m)}}d\\theta=${piT(1, m)}$`,
          ],
        };
      }),
      t("HIII-sekibun-3b", (r) => {
        const n = r(1, 5);
        const N = (n + 1) ** 2;
        const top = co(n, eT(n + 1));
        const ans = `$\\frac{${top}+1}{${N}}$`;
        return {
          q: `定積分 $\\int_{1}^{e}${xp(n)}\\log x\\,dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$\\frac{${top}-1}{${N}}$`, `$\\frac{${eT(n + 1)}+1}{${N}}$`, `$\\frac{${eT(n + 1)}}{${n + 1}}$`, `$\\frac{${top}+1}{${n + 1}}$`]),
          hint: "部分積分：$\\log x$ を微分する側にする。",
          steps: [
            `$=\\left[\\frac{x^{${n + 1}}}{${n + 1}}\\log x\\right]_{1}^{e}-\\int_{1}^{e}\\frac{${xp(n)}}{${n + 1}}dx$`,
            `$=\\frac{${eT(n + 1)}}{${n + 1}}-\\frac{${eT(n + 1)}-1}{${N}}$`,
            `$=\\frac{${top}+1}{${N}}$`,
          ],
        };
      }),
      t("HIII-sekibun-3c", (r) => {
        const a = r(1, 4);
        const [kn, kd] = pick(r, [[1, 1], [-1, 1], [2, 1], [1, 3], [-1, 2], [-2, 1]]);
        const ax = a === 1 ? "x" : `${a}x`;
        const F = (n, d) => `$f(x)=${ax}${d === 0 ? "" : plusT(piT(n, d))}$`;
        const ans = F(kn * a, kd - 2 * kn);
        const wr = [F(-kn * a, kd - 2 * kn), F(kn * a, kd)];
        if (kd !== kn) wr.push(F(kn * a, kd - kn));
        const kT = termTex(kn, kd, "\\int_{0}^{\\pi}f(t)\\sin t\\,dt");
        return {
          q: `関数 $f(x)$ が $f(x)=${ax}${plusT(kT)}$ を満たすとき、$f(x)$ を求めよ。`,
          ans,
          choices: choices4(r, ans, wr, (i) => F(kn * a * (i + 2), kd - 2 * kn)),
          hint: "定積分 $\\int_{0}^{\\pi}f(t)\\sin t\\,dt$ は定数。これを $I$ とおいて $f(x)$ に代入する。",
          steps: [
            `$I=\\int_{0}^{\\pi}f(t)\\sin t\\,dt$ とおくと $f(x)=${ax}${plusT(termTex(kn, kd, "I"))}$`,
            `$I=\\int_{0}^{\\pi}\\left(${a === 1 ? "" : a}t${plusT(termTex(kn, kd, "I"))}\\right)\\sin t\\,dt=${a === 1 ? "" : a}\\pi${plusT(termTex(2 * kn, kd, "I"))}$（$\\int_{0}^{\\pi}t\\sin t\\,dt=\\pi$, $\\int_{0}^{\\pi}\\sin t\\,dt=2$）`,
            `$I=${piT(a * kd, kd - 2 * kn)}$ より ${ans}`,
          ],
        };
      }),
      t("HIII-sekibun-3d", (r) => {
        const E = (n) => (n === 1 ? "e" : `e^{${n}}`);
        if (r(0, 1) === 0) {
          const a = r(1, 2), b = r(a + 1, 3);
          // ∫_0^b |e^x-e^a| dx = e^b+(2a-b-2)e^a+1
          const V = (cb, ca, c0) => `$${lin([[cb, 1, E(b)], [ca, 1, E(a)], [c0, 1, ""]])}$`;
          const ans = V(1, 2 * a - b - 2, 1);
          return {
            q: `定積分 $\\int_{0}^{${b}}\\left|e^{x}-${E(a)}\\right|dx$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [V(1, -b, -1), V(1, 2 * a - b, 1), V(1, 2 * a - b - 2, -1), V(1, -(2 * a - b - 2), 1)], (i) => V(1, 2 * a - b - 3 - i, 1)),
            hint: `$e^{x}-${E(a)}$ の符号が変わる $x=${a}$ で積分区間を分け、絶対値をはずす。`,
            steps: [
              `$0\\leqq x\\leqq${a}$ では $e^{x}\\leqq ${E(a)}$、$${a}\\leqq x\\leqq${b}$ では $e^{x}\\geqq ${E(a)}$`,
              `$\\int_{0}^{${a}}(${E(a)}-e^{x})dx=\\left[${E(a)}x-e^{x}\\right]_{0}^{${a}}=${lin([[a - 1, 1, E(a)], [1, 1, ""]])}$`,
              `$\\int_{${a}}^{${b}}(e^{x}-${E(a)})dx=\\left[e^{x}-${E(a)}x\\right]_{${a}}^{${b}}=${lin([[1, 1, E(b)], [-(b - a + 1), 1, E(a)]])}$`,
              `合計して $${ans.slice(1, -1)}$`,
            ],
          };
        }
        const k = r(1, 2), m = r(1, 2);
        // ∫_{e^{-k}}^{e^{m}} |log x| dx = 2-(k+1)e^{-k}+(m-1)e^{m}
        const V = (c0, ck, cm) => {
          let s = c0 === 0 ? "" : String(c0);
          if (ck !== 0) s += `${ck < 0 ? "-" : s === "" ? "" : "+"}\\frac{${Math.abs(ck)}}{${E(k)}}`;
          if (cm !== 0) s += `${cm < 0 ? "-" : s === "" ? "" : "+"}${Math.abs(cm) === 1 ? "" : Math.abs(cm)}${E(m)}`;
          return `$${s || "0"}$`;
        };
        const ans = V(2, -(k + 1), m - 1);
        return {
          q: `定積分 $\\int_{\\frac{1}{${E(k)}}}^{${E(m)}}|\\log x|\\,dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [V(0, k + 1, m - 1), V(2, k + 1, m - 1), V(1, -(k + 1), m - 1), V(2, -(k + 1), m + 1)], (i) => V(2, -(k + 2 + i), m - 1)),
          hint: "$\\log x$ の符号が変わる $x=1$ で区間を分ける。$\\int\\log x\\,dx=x\\log x-x+C$。",
          steps: [
            `$\\frac{1}{${E(k)}}\\leqq x\\leqq1$ では $\\log x\\leqq0$、$1\\leqq x\\leqq ${E(m)}$ では $\\log x\\geqq0$`,
            `$\\int_{\\frac{1}{${E(k)}}}^{1}(-\\log x)dx=\\left[x-x\\log x\\right]_{\\frac{1}{${E(k)}}}^{1}=${V(1, -(k + 1), 0).slice(1, -1)}$`,
            `$\\int_{1}^{${E(m)}}\\log x\\,dx=\\left[x\\log x-x\\right]_{1}^{${E(m)}}=${V(1, 0, m - 1).slice(1, -1)}$`,
            `合計して $${ans.slice(1, -1)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HIII-sekibun-4a", (r) => {
        const n = r(2, 6);
        const even = n % 2 === 0;
        const X = even ? "\\pi" : "\\log 2";
        // [P, Q]：I = P + Q X（P, Q は [分子, 分母]）
        const run = (sgn, off) => {
          let cur = even ? [[0, 1], [1, 4]] : [[0, 1], [1, 2]];
          for (let k = even ? 2 : 3; k <= n; k += 2) {
            const P = addQ([1, k - 1 + off], [sgn * cur[0][0], cur[0][1]]);
            cur = [P, [sgn * cur[1][0], cur[1][1]]];
          }
          return cur;
        };
        const tex = ([P, Q], flip = 1) => {
          const xt = even ? piT(flip * Q[0], Q[1]) : termTex(flip * Q[0], Q[1], X);
          return P[0] === 0 ? `$${xt}$` : `$${fracTex(P[0], P[1])}${plusT(xt)}$`;
        };
        const right = run(-1, 0);
        const ans = tex(right);
        return {
          q: `$I_{n}=\\int_{0}^{\\frac{\\pi}{4}}\\tan^{n}x\\,dx$ とする。$I_{${n}}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(right, -1), tex(run(1, 0)), tex(run(-1, 2))], (i) => tex([[right[0][0] + (i + 1) * right[0][1], right[0][1]], right[1]])),
          hint: "$\\tan^{2}x=\\frac{1}{\\cos^{2}x}-1$ を使うと $I_{n}+I_{n-2}=\\frac{1}{n-1}$ が導ける。",
          steps: [
            `$I_{n}+I_{n-2}=\\int_{0}^{\\frac{\\pi}{4}}\\tan^{n-2}x\\cdot\\frac{1}{\\cos^{2}x}dx=\\left[\\frac{\\tan^{n-1}x}{n-1}\\right]_{0}^{\\frac{\\pi}{4}}=\\frac{1}{n-1}$`,
            even ? `$I_{0}=\\frac{\\pi}{4}$ から順に求める` : `$I_{1}=\\left[-\\log(\\cos x)\\right]_{0}^{\\frac{\\pi}{4}}=\\frac{1}{2}\\log 2$ から順に求める`,
            `$I_{${n}}=${ans.slice(1, -1)}$`,
          ],
        };
      }),
      t("HIII-sekibun-4b", (r) => {
        const n = r(1, 6);
        const W = { 1: [1, 1, 0], 2: [1, 4, 1], 3: [2, 3, 0], 4: [3, 16, 1], 5: [8, 15, 0], 6: [5, 32, 1] }[n];
        const [wn, wd, wk] = W;
        const sn = n === 1 ? "\\sin " : `\\sin^{${n}}`;
        const ans = `$${piT(wn, wd, wk + 1)}$`;
        return {
          q: `定積分 $\\int_{0}^{\\pi}x${sn}x\\,dx$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${piT(wn, 2 * wd, wk + 1)}$`, `$${piT(wn, wd, wk)}$`, `$${piT(2 * wn, wd, wk + 1)}$`, `$${piT(wn, wd, wk + 2)}$`]),
          hint: "$x=\\pi-t$ と置換すると、もとの積分 I がもう一度あらわれる。",
          steps: [
            `$x=\\pi-t$ とおくと $I=\\int_{0}^{\\pi}(\\pi-t)${sn}t\\,dt=\\pi\\int_{0}^{\\pi}${sn}t\\,dt-I$`,
            `$I=\\frac{\\pi}{2}\\int_{0}^{\\pi}${sn}x\\,dx=\\pi\\int_{0}^{\\frac{\\pi}{2}}${sn}x\\,dx$`,
            `$\\int_{0}^{\\frac{\\pi}{2}}${sn}x\\,dx=${piT(wn, wd, wk)}$ より $I=${piT(wn, wd, wk + 1)}$`,
          ],
        };
      }),
      t("HIII-sekibun-4c", (r) => {
        const a = r(1, 3), A3 = a ** 3;
        const third = r(0, 1) === 1;
        const bT = third ? surd(a, 1, 3) : String(a);
        const T = (pd, cn, cd, cs, sg = "+") => `$${piT(1, pd)}${sg}${surd(cn, cd, cs)}$`;
        const ans = third ? T(6 * A3, 1, 8 * A3, 3) : T(8 * A3, 1, 4 * A3, 1);
        const wr = third
          ? [T(6 * A3, 1, 8 * A3, 3, "-"), T(3 * A3, 1, 4 * A3, 3), T(6 * A3 * a, 1, 8 * A3 * a, 3), `$${piT(1, 6 * A3)}$`]
          : [T(8 * A3, 1, 4 * A3, 1, "-"), T(4 * A3, 1, 2 * A3, 1), T(8 * A3 * a, 1, 4 * A3 * a, 1), `$${piT(1, 8 * A3)}$`];
        const end = third ? "\\frac{\\pi}{3}" : "\\frac{\\pi}{4}";
        return {
          q: `定積分 $\\int_{0}^{${bT}}\\frac{dx}{(x^{2}+${a * a})^{2}}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, wr),
          hint: `$x=${a === 1 ? "" : a}\\tan\\theta$ とおき、$\\cos^{2}\\theta$ は半角の公式で次数を下げる。`,
          steps: [
            `$x=${a === 1 ? "" : a}\\tan\\theta$ とおくと $dx=\\frac{${a}}{\\cos^{2}\\theta}d\\theta$、$(x^{2}+${a * a})^{2}=\\frac{${a ** 4}}{\\cos^{4}\\theta}$`,
            `与式 $=${A3 === 1 ? "" : `\\frac{1}{${A3}}`}\\int_{0}^{${end}}\\cos^{2}\\theta\\,d\\theta=${A3 === 1 ? "" : `\\frac{1}{${A3}}`}\\left[\\frac{\\theta}{2}+\\frac{\\sin2\\theta}{4}\\right]_{0}^{${end}}$`,
            `$=${ans.slice(1, -1)}$`,
          ],
        };
      }),
      t("HIII-sekibun-4d", (r) => {
        const k = r(1, 2), K = k === 1 ? "" : k;
        const hint = `$x=-t$ と置換した式をもとの式と足すと、$\\frac{1}{1+e^{${K}x}}+\\frac{e^{${K}x}}{e^{${K}x}+1}=1$ となって分母が消える。`;
        if (r(0, 2) > 0) {
          const a = r(1, 3), e2 = 2 * r(1, 2);
          return {
            q: `定積分 $\\int_{-${a}}^{${a}}\\frac{x^{${e2}}}{1+e^{${K}x}}dx$ を求めよ。`,
            ans: fracAns(a ** (e2 + 1), e2 + 1),
            hint,
            steps: [
              `求める積分を $I$ とし、$x=-t$ とおくと $I=\\int_{-${a}}^{${a}}\\frac{t^{${e2}}}{1+e^{-${K}t}}dt=\\int_{-${a}}^{${a}}\\frac{t^{${e2}}e^{${K}t}}{e^{${K}t}+1}dt$`,
              `もとの式と足すと $2I=\\int_{-${a}}^{${a}}x^{${e2}}\\,dx$`,
              `$I=\\int_{0}^{${a}}x^{${e2}}\\,dx=${fracTex(a ** (e2 + 1), e2 + 1)}$`,
            ],
          };
        }
        const [aT, sn, sd] = pick(r, [["\\frac{\\pi}{2}", 1, 1], ["\\frac{\\pi}{6}", 1, 2]]);
        return {
          q: `定積分 $\\int_{-${aT}}^{${aT}}\\frac{\\cos x}{1+e^{${K}x}}dx$ を求めよ。`,
          ans: fracAns(sn, sd),
          hint,
          steps: [
            `求める積分を $I$ とし、$x=-t$ とおくと $I=\\int_{-${aT}}^{${aT}}\\frac{\\cos t}{1+e^{-${K}t}}dt=\\int_{-${aT}}^{${aT}}\\frac{e^{${K}t}\\cos t}{e^{${K}t}+1}dt$`,
            `もとの式と足すと $2I=\\int_{-${aT}}^{${aT}}\\cos x\\,dx$`,
            `$I=\\int_{0}^{${aT}}\\cos x\\,dx=\\sin ${aT}=${fracTex(sn, sd)}$`,
          ],
        };
      }),
      t("HIII-sekibun-4e", (r) => {
        let fT, intT, an, ad, bd;
        if (r(0, 1) === 0) {
          const c = r(1, 4);
          fT = `\\frac{1}{x+${c}}`; intT = `\\frac{x^{n}}{x+${c}}`; [an, ad] = [1, c + 1]; bd = fracTex(1, c * c);
        } else {
          const pp = r(1, 3), qq = r(1, 3);
          fT = `\\frac{${pp}}{x^{2}+${qq}}`; intT = `\\frac{${pp === 1 ? "" : pp}x^{n}}{x^{2}+${qq}}`; [an, ad] = [pp, qq + 1]; bd = fracTex(2 * pp, qq * qq);
        }
        return {
          q: `$\\lim_{n\\to\\infty}n\\int_{0}^{1}${intT}dx$ を求めよ。`,
          ans: fracAns(an, ad),
          hint: "$f(x)$ とおき、$x^{n}$ を積分する側にして部分積分する。残った積分は $n\\to\\infty$ で $0$ になることを不等式で評価する。",
          steps: [
            `$f(x)=${fT}$ とおくと、部分積分で $\\int_{0}^{1}x^{n}f(x)\\,dx=\\frac{f(1)}{n+1}-\\frac{1}{n+1}\\int_{0}^{1}x^{n+1}f'(x)\\,dx$`,
            `$0\\leqq x\\leqq1$ で $|f'(x)|\\leqq ${bd}$ なので $\\left|\\int_{0}^{1}x^{n+1}f'(x)\\,dx\\right|\\leqq ${bd === "1" ? "" : `${bd}\\cdot`}\\frac{1}{n+2}\\to0$`,
            `よって $n\\int_{0}^{1}x^{n}f(x)\\,dx=\\frac{n}{n+1}f(1)-\\frac{n}{n+1}\\int_{0}^{1}x^{n+1}f'(x)\\,dx\\to f(1)=${fracTex(an, ad)}$`,
          ],
        };
      }),
    ],
  },
};

// ── 積分の応用 ───────────────────────────────────────
const SEKIBUNOUYO = {
  id: "HIII-sekibunouyo",
  grade: "H3",
  area: "func",
  name: "積分の応用",
  desc: "面積・回転体の体積・区分求積",
  prereqs: ["HIII-sekibun"],
  course: "数学III",
  rikei: true,
  points: [
    "面積 $S=\\int_{a}^{b}\\{(\\text{上})-(\\text{下})\\}dx$。まず交点を求め、上下を確認する。".replace("(\\text{上})-(\\text{下})", "f(x)-g(x)"),
    "x 軸のまわりの回転体 $V=\\pi\\int_{a}^{b}\\{f(x)\\}^{2}dx$。$\\pi$ と2乗を忘れない。",
    "区分求積 $\\lim_{n\\to\\infty}\\frac{1}{n}\\sum_{k=1}^{n}f\\left(\\frac{k}{n}\\right)=\\int_{0}^{1}f(x)\\,dx$。",
    "曲線の長さ $L=\\int_{a}^{b}\\sqrt{1+\\{f'(x)\\}^{2}}\\,dx$、媒介変数なら $\\int\\sqrt{\\left(\\frac{dx}{dt}\\right)^{2}+\\left(\\frac{dy}{dt}\\right)^{2}}\\,dt$。",
  ],
  levels: {
    1: [
      t("HIII-sekibunouyo-1a", (r) => {
        const mode = r(0, 2), c = r(1, 4);
        if (mode === 0) {
          const k = r(2, 7);
          return {
            q: `曲線 $y=${c === 1 ? "" : c}e^{x}$ と x 軸、y 軸、直線 $x=\\log ${k}$ で囲まれた部分の面積を求めよ。`,
            ans: c * (k - 1),
            hint: "$e^{x}>0$ なので、そのまま $0$ から $\\log k$ まで積分する。",
            steps: [`$\\int_{0}^{\\log ${k}}${c === 1 ? "" : c}e^{x}dx=${c === 1 ? "" : c}\\left[e^{x}\\right]_{0}^{\\log ${k}}=${c === 1 ? "" : c}(${k}-1)=${c * (k - 1)}$`],
          };
        }
        if (mode === 1) {
          const k = r(1, 3);
          return {
            q: `曲線 $y=\\frac{${c}}{x}$ と x 軸、2直線 $x=1$, $x=${eT(k)}$ で囲まれた部分の面積を求めよ。`,
            ans: c * k,
            hint: "$\\int\\frac{1}{x}dx=\\log x$（$x>0$）。",
            steps: [`$\\int_{1}^{${eT(k)}}\\frac{${c}}{x}dx=${c === 1 ? "" : c}\\left[\\log x\\right]_{1}^{${eT(k)}}=${c * k}$`],
          };
        }
        const a = r(1, 4);
        const ax = a === 1 ? "x" : `${a}x`;
        return {
          q: `曲線 $y=${c === 1 ? "" : c}\\sin ${ax}$（$0\\leqq x\\leqq${piT(1, a)}$）と x 軸で囲まれた部分の面積を求めよ。`,
          ans: fracAns(2 * c, a),
          hint: "この範囲で $\\sin$ は 0 以上。$\\int\\sin ax\\,dx=-\\frac{1}{a}\\cos ax$。",
          steps: [`$\\int_{0}^{${piT(1, a)}}${c === 1 ? "" : c}\\sin ${ax}\\,dx=\\left[${termTex(-c, a, `\\cos ${ax}`)}\\right]_{0}^{${piT(1, a)}}=${fracTex(2 * c, a)}$`],
        };
      }),
      t("HIII-sekibunouyo-1b", (r) => {
        const mode = r(0, 2), b = r(1, 3);
        if (mode === 0) {
          const a = r(1, 3);
          const ans = `$${piT(a * a * b ** 3, 3)}$`;
          return {
            q: `直線 $y=${a === 1 ? "" : a}x$ と x 軸、直線 $x=${b}$ で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(a * b * b, 2)}$`, `$${fracTex(a * a * b ** 3, 3)}$`, `$${piT(a * a * b ** 3, 1)}$`]),
            hint: "$V=\\pi\\int_{0}^{b}y^{2}dx$（$y$ を2乗する）。",
            steps: [`$V=\\pi\\int_{0}^{${b}}${a * a === 1 ? "" : a * a}x^{2}dx=\\pi\\left[${termTex(a * a, 3, "x^{3}")}\\right]_{0}^{${b}}$`, `$=${piT(a * a * b ** 3, 3)}$`],
          };
        }
        if (mode === 1) {
          const ans = `$${piT(b ** 5, 5)}$`;
          return {
            q: `曲線 $y=x^{2}$ と x 軸、直線 $x=${b}$ で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(b ** 3, 3)}$`, `$${fracTex(b ** 5, 5)}$`, `$${piT(b ** 4, 4)}$`]),
            hint: "$V=\\pi\\int_{0}^{b}(x^{2})^{2}dx$。",
            steps: [`$V=\\pi\\int_{0}^{${b}}x^{4}dx=\\pi\\left[\\frac{x^{5}}{5}\\right]_{0}^{${b}}=${piT(b ** 5, 5)}$`],
          };
        }
        const a = r(1, 4);
        const ans = `$${piT(a * b * b, 2)}$`;
        return {
          q: `曲線 $y=\\sqrt{${a === 1 ? "" : a}x}$ と x 軸、直線 $x=${b}$ で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${fracTex(a * b * b, 2)}$`, `$${piT(a * b * b, 1)}$`, `$${piT(2 * b * b * b * a, 3)}$`, `$${piT(a * a * b ** 3, 3)}$`]),
          hint: "$V=\\pi\\int y^{2}dx$。$y^{2}$ にすると根号が消える。",
          steps: [`$V=\\pi\\int_{0}^{${b}}${a === 1 ? "" : a}x\\,dx=\\pi\\left[${termTex(a, 2, "x^{2}")}\\right]_{0}^{${b}}=${piT(a * b * b, 2)}$`],
        };
      }),
      t("HIII-sekibunouyo-1c", (r) => {
        const m = r(1, 5);
        const pw = (v) => (m === 1 ? v : `${v}^{${m}}`);
        const mode = r(0, 2);
        if (mode === 2) {
          const mm = r(1, 3);
          return {
            q: `$\\lim_{n\\to\\infty}\\frac{1}{n}\\sum_{k=1}^{n}\\left(1+\\frac{k}{n}\\right)${mm === 1 ? "" : `^{${mm}}`}$ を求めよ。`,
            ans: fracAns(2 ** (mm + 1) - 1, mm + 1),
            hint: "$\\frac{1}{n}\\sum f\\left(\\frac{k}{n}\\right)\\to\\int_{0}^{1}f(x)\\,dx$。",
            steps: [`$=\\int_{0}^{1}(1+x)${mm === 1 ? "" : `^{${mm}}`}dx=\\left[\\frac{(1+x)^{${mm + 1}}}{${mm + 1}}\\right]_{0}^{1}=${fracTex(2 ** (mm + 1) - 1, mm + 1)}$`],
          };
        }
        const ex =
          mode === 0
            ? `\\lim_{n\\to\\infty}\\frac{1}{n}\\sum_{k=1}^{n}${pw("\\left(\\frac{k}{n}\\right)")}`
            : `\\lim_{n\\to\\infty}\\frac{1}{n^{${m + 1}}}\\sum_{k=1}^{n}${pw("k")}`;
        return {
          q: `$${ex}$ を求めよ。`,
          ans: fracAns(1, m + 1),
          hint: "$\\frac{1}{n}\\sum f\\left(\\frac{k}{n}\\right)$ の形に直して定積分にする。",
          steps: [
            mode === 1 ? `$\\frac{1}{n^{${m + 1}}}\\sum ${pw("k")}=\\frac{1}{n}\\sum${pw("\\left(\\frac{k}{n}\\right)")}$` : `$f(x)=${pw("x")}$ の区分求積`,
            `$=\\int_{0}^{1}${pw("x")}\\,dx=${fracTex(1, m + 1)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-1d", (r) => {
        const al = r(0, 2), be = r(al + 1, al + 3), T = r(be, be + 2);
        const v = poly([1, -(al + be), al * be], "t");
        // F(t) = t^3/3 - (α+β)t^2/2 + αβ t（6倍して整数で計算）
        const F6 = (t) => 2 * t ** 3 - 3 * (al + be) * t * t + 6 * al * be * t;
        const pos = r(0, 2) === 0; // true：位置（変位）を問う
        const d1 = F6(al) - F6(0), d2 = F6(be) - F6(al), d3 = F6(T) - F6(be);
        const dist = Math.abs(d1) + Math.abs(d2) + Math.abs(d3), disp = F6(T) - F6(0);
        const vF = lin([[1, 3, "t^{3}"], [-(al + be), 2, "t^{2}"], [al * be, 1, "t"]]);
        const vT = `${al === 0 ? "t" : `(t-${al})`}(t-${be})`;
        return {
          q: pos
            ? `数直線上を動く点 P の時刻 $t$ における速度が $v(t)=${v}$ で、$t=0$ のとき P は原点にある。$t=${T}$ のときの P の座標を求めよ。`
            : `数直線上を動く点 P の時刻 $t$ における速度が $v(t)=${v}$ である。$t=0$ から $t=${T}$ までに P が動く道のりを求めよ。`,
          ans: fracAns(pos ? disp : dist, 6),
          hint: pos ? "位置の変化は $\\int_{0}^{T}v(t)\\,dt$（符号をそのまま足す）。" : "道のりは $\\int_{0}^{T}|v(t)|\\,dt$。$v(t)$ の符号が変わる時刻で区間を分ける。",
          steps: pos
            ? [`$\\int_{0}^{${T}}(${v})dt=\\left[${vF}\\right]_{0}^{${T}}$`, `$=${fracTex(disp, 6)}$ なので座標は $${fracTex(disp, 6)}$`]
            : [
                `$v(t)=${vT}$ は $${al}<t<${be}$ で負、${al === 0 ? "" : `$0<t<${al}$ と `}$t>${be}$ で正`,
                `道のりは $${al === 0 ? "" : `\\int_{0}^{${al}}v\\,dt`}-\\int_{${al}}^{${be}}v\\,dt${T === be ? "" : `+\\int_{${be}}^{${T}}v\\,dt`}$`,
                `$=${[al === 0 ? "" : fracTex(Math.abs(d1), 6), fracTex(Math.abs(d2), 6), T === be ? "" : fracTex(Math.abs(d3), 6)].filter((z) => z !== "").join("+")}${al === 0 && T === be ? "" : `=${fracTex(dist, 6)}`}$`,
              ],
        };
      }),
    ],
    2: [
      t("HIII-sekibunouyo-2a", (r) => {
        const k = r(2, 6);
        const h = fracTex(k * k - 1, 2);
        const L = `${k}\\log ${k}`;
        const ans = `$${h}-${L}$`;
        return {
          q: `曲線 $y=\\frac{${k}}{x}$ と直線 $y=-x+${k + 1}$ で囲まれた部分の面積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${h}+${L}$`, `$${k * k - 1}-${L}$`, `$${L}-${h}$`]),
          hint: "まず交点の x 座標を求め、どちらが上かを確かめてから積分する。",
          steps: [
            `$\\frac{${k}}{x}=-x+${k + 1}$ より $x^{2}-${k + 1}x+${k}=0$、$x=1,\\ ${k}$`,
            `$1\\leqq x\\leqq${k}$ では直線が上：$S=\\int_{1}^{${k}}\\left(-x+${k + 1}-\\frac{${k}}{x}\\right)dx$`,
            `$=\\left[-\\frac{x^{2}}{2}+${k + 1}x-${k}\\log x\\right]_{1}^{${k}}=${h}-${L}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-2b", (r) => {
        if (r(0, 1) === 0) {
          const a = r(1, 4);
          const ans = `$${piT(a * a, 2, 2)}$`;
          return {
            q: `曲線 $y=${a === 1 ? "" : a}\\sin x$（$0\\leqq x\\leqq\\pi$）と x 軸で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(2 * a, 1)}$`, `$${piT(a * a, 2)}$`, `$${piT(a * a, 1, 2)}$`, `$${piT(a, 2, 2)}$`], (i) => `$${piT(a * a + i + 1, 2, 2)}$`),
            hint: "$\\sin^{2}x=\\frac{1-\\cos2x}{2}$ で次数を下げる。",
            steps: [`$V=\\pi\\int_{0}^{\\pi}${a * a === 1 ? "" : a * a}\\sin^{2}x\\,dx=${piT(a * a, 1)}\\int_{0}^{\\pi}\\frac{1-\\cos2x}{2}dx$`, `$=${piT(a * a, 1)}\\times\\frac{\\pi}{2}=${piT(a * a, 2, 2)}$`],
          };
        }
        const k = r(2, 5);
        const ans = `$${piT(k * k - 1, 2)}$`;
        return {
          q: `曲線 $y=e^{x}$ と x 軸、y 軸、直線 $x=\\log ${k}$ で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${piT(k - 1, 1)}$`, `$${fracTex(k * k - 1, 2)}$`, `$${piT(k * k - 1, 1)}$`]),
          hint: "$(e^{x})^{2}=e^{2x}$ を積分する。",
          steps: [`$V=\\pi\\int_{0}^{\\log ${k}}e^{2x}dx=\\pi\\left[\\frac{e^{2x}}{2}\\right]_{0}^{\\log ${k}}$`, `$=\\frac{\\pi}{2}(${k * k}-1)=${piT(k * k - 1, 2)}$`],
        };
      }),
      t("HIII-sekibunouyo-2c", (r) => {
        const b = r(1, 4);
        const lg = (n, d, arg) => `${termTex(n, d, `\\log ${arg}`)}`;
        if (r(0, 1) === 0) {
          const ans = `$${lg(1, b, b + 1)}$`;
          return {
            q: `$\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\frac{1}{n${b === 1 ? "+" : `+${b}`}k}$ を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$\\log ${b + 1}$`, `$${lg(b, 1, b + 1)}$`, `$${lg(1, b, b + 2)}$`, `$${lg(1, b + 1, b + 1)}$`], (i) => `$${lg(i + 2, b, b + 1)}$`),
            hint: "$\\frac{1}{n}$ をくくり出して $\\frac{1}{n}\\sum f\\left(\\frac{k}{n}\\right)$ の形にする。",
            steps: [
              `$\\frac{1}{n${b === 1 ? "+" : `+${b}`}k}=\\frac{1}{n}\\cdot\\frac{1}{1+${b === 1 ? "" : `${b}\\cdot`}\\frac{k}{n}}$`,
              `$\\to\\int_{0}^{1}\\frac{dx}{1+${b === 1 ? "" : b}x}=\\left[${lg(1, b, `(1+${b === 1 ? "" : b}x)`)}\\right]_{0}^{1}=${lg(1, b, b + 1)}$`,
            ],
          };
        }
        const ans = `$${lg(1, 2 * b, b + 1)}$`;
        return {
          q: `$\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\frac{k}{n^{2}${b === 1 ? "+" : `+${b}`}k^{2}}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${lg(1, b, b + 1)}$`, `$${lg(1, 2, b + 1)}$`, `$\\log ${b + 1}$`], (i) => `$${lg(1, 2 * b + i + 1, b + 1)}$`),
          hint: "分母・分子を $n^{2}$ でわって $\\frac{1}{n}\\sum f\\left(\\frac{k}{n}\\right)$ の形にする。",
          steps: [
            `$\\frac{k}{n^{2}${b === 1 ? "+" : `+${b}`}k^{2}}=\\frac{1}{n}\\cdot\\frac{\\frac{k}{n}}{1+${b === 1 ? "" : b}\\left(\\frac{k}{n}\\right)^{2}}$`,
            `$\\to\\int_{0}^{1}\\frac{x}{1+${b === 1 ? "" : b}x^{2}}dx=\\left[${lg(1, 2 * b, `(1+${b === 1 ? "" : b}x^{2})`)}\\right]_{0}^{1}=${lg(1, 2 * b, b + 1)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-2d", (r) => {
        const mode = r(0, 2);
        const tail = "で囲まれた部分を y 軸のまわりに1回転させてできる立体の体積を求めよ。";
        if (mode === 2) {
          const k = r(1, 2), E2 = `e^{${2 * k}}`;
          const ans = `$\\frac{\\pi}{2}(${E2}-1)$`;
          return {
            q: `曲線 $y=\\log x$ と x 軸、y 軸、直線 $y=${k}$ ${tail}`,
            ans,
            choices: choices4(r, ans, [`$\\pi(${E2}-1)$`, `$\\frac{\\pi}{2}(e^{${k === 1 ? "" : k}}-1)$`.replace("e^{}", "e"), `$\\frac{\\pi}{2}${E2}$`, `$\\pi(${k === 1 ? "e" : `e^{${k}}`}-1)$`]),
            hint: "y 軸のまわりの回転体は $V=\\pi\\int x^{2}dy$。$x$ を $y$ で表す（$x=e^{y}$）。",
            steps: [`$y=\\log x$ より $x=e^{y}$、$0\\leqq y\\leqq${k}$`, `$V=\\pi\\int_{0}^{${k}}e^{2y}dy=\\pi\\left[\\frac{e^{2y}}{2}\\right]_{0}^{${k}}=\\frac{\\pi}{2}(${E2}-1)$`],
          };
        }
        if (mode === 1) {
          const h = r(1, 2);
          const ans = `$${piT(h ** 5, 5)}$`;
          return {
            q: `曲線 $y=\\sqrt{x}$ と y 軸、直線 $y=${h}$ ${tail}`,
            ans,
            choices: choices4(r, ans, [`$${piT(h ** 3, 3)}$`, `$${piT(h ** 4, 2)}$`, `$${fracTex(h ** 5, 5)}$`, `$${piT(2 * h ** 5, 5)}$`]),
            hint: "y 軸のまわりの回転体は $V=\\pi\\int x^{2}dy$。$x$ を $y$ で表す（$x=y^{2}$）。",
            steps: [`$y=\\sqrt{x}$ より $x=y^{2}$、$0\\leqq y\\leqq${h}$`, `$V=\\pi\\int_{0}^{${h}}y^{4}dy=\\pi\\left[\\frac{y^{5}}{5}\\right]_{0}^{${h}}=${piT(h ** 5, 5)}$`],
          };
        }
        const a = r(1, 2), h = r(1, 4), A = a === 1 ? "" : a;
        const ans = `$${piT(h * h, 2 * a)}$`;
        return {
          q: `曲線 $y=${A}x^{2}$（$x\\geqq0$）と y 軸、直線 $y=${h}$ ${tail}`,
          ans,
          choices: choices4(r, ans, [`$${piT(h * h, a)}$`, `$${piT(h ** 3, 3 * a)}$`, `$${fracTex(h * h, 2 * a)}$`, `$${piT(h * h * a, 2)}$`], (i) => `$${piT(h * h * (i + 3), 2 * a)}$`),
          hint: "y 軸のまわりの回転体は $V=\\pi\\int x^{2}dy$。$x^{2}$ を $y$ で表す。",
          steps: [`$y=${A}x^{2}$ より $x^{2}=${a === 1 ? "y" : `\\frac{y}{${a}}`}$、$0\\leqq y\\leqq${h}$`, `$V=\\pi\\int_{0}^{${h}}${a === 1 ? "y" : `\\frac{y}{${a}}`}\\,dy=\\pi\\left[${a === 1 ? "\\frac{y^{2}}{2}" : `\\frac{y^{2}}{${2 * a}}`}\\right]_{0}^{${h}}=${piT(h * h, 2 * a)}$`],
        };
      }),
    ],
    3: [
      t("HIII-sekibunouyo-3a", (r) => {
        const a = r(1, 4), b = r(1, 3);
        const X = fracTex(a * a, b * b);
        return {
          q: `曲線 $y=${a === 1 ? "" : a}\\sqrt{x}$ と直線 $y=${b === 1 ? "" : b}x$ で囲まれた部分の面積を求めよ。`,
          ans: fracAns(a ** 4, 6 * b ** 3),
          hint: "交点の x 座標を求め、その間で（曲線）−（直線）を積分する。",
          steps: [
            `$${a === 1 ? "" : a}\\sqrt{x}=${b === 1 ? "" : b}x$ より $x=0,\\ ${X}$。この間は曲線が上`,
            `$S=\\int_{0}^{${X}}\\left(${a === 1 ? "" : a}\\sqrt{x}-${b === 1 ? "" : b}x\\right)dx=\\left[${termTex(2 * a, 3, "x^{\\frac{3}{2}}")}-${termTex(b, 2, "x^{2}")}\\right]_{0}^{${X}}$`,
            `$=${fracTex(a ** 4, 6 * b ** 3)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-3b", (r) => {
        const a = r(1, 3), b = r(1, 3);
        const X = fracTex(a * a, b * b);
        const ans = `$${piT(a ** 6, 6 * b ** 4)}$`;
        return {
          q: `曲線 $y=${a === 1 ? "" : a}\\sqrt{x}$ と直線 $y=${b === 1 ? "" : b}x$ で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${piT(a ** 6, 30 * b ** 4)}$`, `$${fracTex(a ** 6, 6 * b ** 4)}$`, `$${piT(a ** 4, 6 * b ** 3)}$`, `$${piT(a ** 6, 2 * b ** 4)}$`]),
          hint: "外側の回転体から内側の回転体を引く：$\\pi\\int(f^{2}-g^{2})dx$。$\\pi\\int(f-g)^{2}dx$ ではない。",
          steps: [
            `交点の x 座標は $0,\\ ${X}$`,
            `$V=\\pi\\int_{0}^{${X}}\\left(${a * a === 1 ? "" : a * a}x-${b * b === 1 ? "" : b * b}x^{2}\\right)dx=\\pi\\left[${termTex(a * a, 2, "x^{2}")}-${termTex(b * b, 3, "x^{3}")}\\right]_{0}^{${X}}$`,
            `$=${piT(a ** 6, 6 * b ** 4)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-3c", (r) => {
        if (r(0, 1) === 0) {
          const s = r(2, 4);
          const B = s * s - 1;
          return {
            q: `曲線 $y=\\frac{2}{3}x^{\\frac{3}{2}}$（$0\\leqq x\\leqq${B}$）の長さを求めよ。`,
            ans: fracAns(2 * (s ** 3 - 1), 3),
            hint: "$L=\\int\\sqrt{1+(y')^{2}}\\,dx$。",
            steps: [`$y'=\\sqrt{x}$ より $\\sqrt{1+(y')^{2}}=\\sqrt{1+x}$`, `$L=\\int_{0}^{${B}}\\sqrt{1+x}\\,dx=\\left[\\frac{2}{3}(1+x)^{\\frac{3}{2}}\\right]_{0}^{${B}}=\\frac{2}{3}(${s ** 3}-1)=${fracTex(2 * (s ** 3 - 1), 3)}$`],
          };
        }
        const k = r(2, 6);
        return {
          q: `曲線 $y=\\frac{e^{x}+e^{-x}}{2}$（$0\\leqq x\\leqq\\log ${k}$）の長さを求めよ。`,
          ans: fracAns(k * k - 1, 2 * k),
          hint: "$1+(y')^{2}$ が完全平方になる。",
          steps: [
            `$y'=\\frac{e^{x}-e^{-x}}{2}$、$1+(y')^{2}=\\left(\\frac{e^{x}+e^{-x}}{2}\\right)^{2}$`,
            `$L=\\int_{0}^{\\log ${k}}\\frac{e^{x}+e^{-x}}{2}dx=\\left[\\frac{e^{x}-e^{-x}}{2}\\right]_{0}^{\\log ${k}}=\\frac{1}{2}\\left(${k}-\\frac{1}{${k}}\\right)$`,
            `$=${fracTex(k * k - 1, 2 * k)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-3d", (r) => {
        const E2 = "\\frac{e-2}{2}";
        const fr = (n, d) => (d === 1 ? n : `\\frac{${n}}{${d}}`);
        if (r(0, 1) === 0) {
          const a = r(1, 3), ax = a === 1 ? "x" : `${a}x`;
          const ans = `$${a === 1 ? E2 : `\\frac{e-2}{${2 * a}}`}$`;
          return {
            q: `原点から曲線 $y=e^{${ax}}$ に引いた接線と、曲線 $y=e^{${ax}}$ および y 軸で囲まれた部分の面積を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${fr("e-1", a)}$`, `$${fr("e", 2 * a)}$`, `$${fr("e+2", 2 * a)}$`, `$${fr("e-2", a)}$`]),
            hint: "接点を $(t,\\ e^{at})$ とおいて原点を通る接線を求め、$0\\leqq x\\leqq t$ で（曲線）−（接線）を積分する。",
            steps: [
              `接点の x 座標を $t$ とすると、接線 $y=${a === 1 ? "" : a}e^{${a === 1 ? "" : a}t}(x-t)+e^{${a === 1 ? "" : a}t}$ が原点を通るので $t=${fracTex(1, a)}$、接線は $y=${a === 1 ? "" : a}ex$`,
              `$0\\leqq x\\leqq${fracTex(1, a)}$ で曲線が上：$S=\\int_{0}^{${fracTex(1, a)}}(e^{${ax}}-${a === 1 ? "" : a}ex)dx$`,
              `$=\\left[${a === 1 ? "e^{x}" : `\\frac{e^{${ax}}}{${a}}`}-\\frac{${a === 1 ? "" : a}e}{2}x^{2}\\right]_{0}^{${fracTex(1, a)}}=${ans.slice(1, -1)}$`,
            ],
          };
        }
        const c = r(1, 3), C = c === 1 ? "" : c;
        const ans = `$${c === 1 ? E2 : `\\frac{${c}(e-2)}{2}`}$`;
        return {
          q: `原点から曲線 $y=${C}\\log x$ に引いた接線と、曲線 $y=${C}\\log x$ および x 軸で囲まれた部分の面積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${c === 1 ? "\\frac{e}{2}+1" : `${c}\\left(\\frac{e}{2}+1\\right)`}$`, `$\\frac{${C}e}{2}$`, `$${c === 1 ? "e-2" : `${c}(e-2)`}$`, `$${c}$`]),
          hint: "接点を $(t,\\ c\\log t)$ とおいて原点を通る接線を求める。（接線の下の三角形）−（曲線の下の部分）で面積を出す。",
          steps: [
            `接点の x 座標を $t$ とすると、接線 $y=\\frac{${c}}{t}(x-t)+${C}\\log t$ が原点を通るので $t=e$、接線は $y=\\frac{${c}}{e}x$`,
            `接線と x 軸、直線 $x=e$ で囲まれた三角形の面積は $\\frac{1}{2}\\cdot e\\cdot${c}=\\frac{${C}e}{2}$`,
            `$\\int_{1}^{e}${C}\\log x\\,dx=${C === "" ? "" : C}\\left[x\\log x-x\\right]_{1}^{e}=${c}$ なので、$S=\\frac{${C}e}{2}-${c}=${ans.slice(1, -1)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HIII-sekibunouyo-4a", (r) => {
        const v = r(0, 3);
        if (v === 3) {
          const ans = "$\\frac{3\\sqrt{3}}{e}$";
          return {
            q: `$\\lim_{n\\to\\infty}\\frac{1}{n}\\sqrt[n]{(n+2)(n+4)\\cdots(n+2n)}$ を求めよ。`,
            ans,
            choices: choices4(r, ans, ["$3\\sqrt{3}$", "$\\frac{3}{e}$", "$3\\sqrt{3}e$", "$\\frac{4}{e}$"]),
            hint: "対数をとると $\\frac{1}{n}\\sum\\log\\left(1+\\frac{2k}{n}\\right)$ になる。",
            steps: [
              `対数をとると $\\frac{1}{n}\\sum_{k=1}^{n}\\log\\left(1+\\frac{2k}{n}\\right)\\to\\int_{0}^{1}\\log(1+2x)\\,dx$`,
              `$=\\left[\\frac{(1+2x)\\log(1+2x)}{2}-x\\right]_{0}^{1}=\\frac{3}{2}\\log3-1$`,
              `極限は $e^{\\frac{3}{2}\\log3-1}=\\frac{3\\sqrt{3}}{e}$`,
            ],
          };
        }
        const a = v + 1;
        const N = (a + 1) ** (a + 1), D = a ** a;
        const [p, q] = reduce(N, D);
        const ans = `$\\frac{${p}}{${q === 1 ? "" : q}e}$`;
        const prod = a === 1 ? "(n+1)(n+2)\\cdots(n+n)" : `(${a}n+1)(${a}n+2)\\cdots(${a}n+n)`;
        return {
          q: `$\\lim_{n\\to\\infty}\\frac{1}{n}\\sqrt[n]{${prod}}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${fracTex(p, q)}$`, `$${q === 1 ? `${p}e` : `\\frac{${p}e}{${q}}`}$`, `$\\frac{${a + 1}}{e}$`, `$\\frac{${p}}{${q === 1 ? "" : q}e^{2}}$`]),
          hint: `対数をとると $\\frac{1}{n}\\sum\\log\\left(${a}+\\frac{k}{n}\\right)$ になり、区分求積が使える。`,
          steps: [
            `対数をとると $\\frac{1}{n}\\sum_{k=1}^{n}\\log\\left(${a}+\\frac{k}{n}\\right)\\to\\int_{0}^{1}\\log(${a}+x)\\,dx$`,
            `$=\\left[(${a}+x)\\log(${a}+x)-x\\right]_{0}^{1}=${a + 1}\\log ${a + 1}${a === 1 ? "" : `-${a}\\log ${a}`}-1$`,
            `極限は $e^{(\\text{これ})}=${ans.slice(1, -1)}$`.replace("(\\text{これ})", "\\cdots"),
          ],
        };
      }),
      t("HIII-sekibunouyo-4b", (r) => {
        if (r(0, 1) === 0) {
          const a = r(1, 4);
          const ans = `$${piT(2 * a, 1, 2)}$`;
          return {
            q: `曲線 $y=${a === 1 ? "" : a}\\sin x$（$0\\leqq x\\leqq\\pi$）と x 軸で囲まれた部分を y 軸のまわりに1回転させてできる立体の体積を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(a, 1, 2)}$`, `$${piT(a * a, 2, 2)}$`, `$${piT(2 * a, 1)}$`, `$${piT(4 * a, 1, 2)}$`]),
            hint: "y 軸のまわりの回転体は $V=2\\pi\\int_{a}^{b}x f(x)\\,dx$（薄い円筒を重ねる考え方）で計算できる。",
            steps: [
              `$V=2\\pi\\int_{0}^{\\pi}x\\cdot${a === 1 ? "" : a}\\sin x\\,dx$`,
              `部分積分で $\\int_{0}^{\\pi}x\\sin x\\,dx=\\left[-x\\cos x\\right]_{0}^{\\pi}+\\int_{0}^{\\pi}\\cos x\\,dx=\\pi$`,
              `$V=2\\pi\\times${a === 1 ? "" : a}\\pi=${piT(2 * a, 1, 2)}$`,
            ],
          };
        }
        const p = r(1, 4);
        const ans = `$${piT(p ** 4, 6)}$`;
        return {
          q: `曲線 $y=x(${p}-x)$ と x 軸で囲まれた部分を y 軸のまわりに1回転させてできる立体の体積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${piT(p ** 4, 12)}$`, `$${piT(p ** 5, 30)}$`, `$${piT(p ** 3, 6)}$`, `$${piT(p ** 4, 3)}$`]),
          hint: "y 軸のまわりの回転体は $V=2\\pi\\int_{a}^{b}x f(x)\\,dx$（薄い円筒を重ねる考え方）で計算できる。",
          steps: [
            `$V=2\\pi\\int_{0}^{${p}}x\\cdot x(${p}-x)\\,dx=2\\pi\\int_{0}^{${p}}(${p === 1 ? "" : p}x^{2}-x^{3})\\,dx$`,
            `$=2\\pi\\left(${fracTex(p ** 4, 3)}-${fracTex(p ** 4, 4)}\\right)=${piT(p ** 4, 6)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-4c", (r) => {
        const a = r(1, 4);
        const mode = r(0, 2);
        const cyc = `x=${a === 1 ? "t-\\sin t" : `${a}(t-\\sin t)`}$, $y=${a === 1 ? "1-\\cos t" : `${a}(1-\\cos t)`}$（$0\\leqq t\\leqq2\\pi$）`;
        if (mode === 0) {
          const ans = `$${piT(3 * a * a, 1)}$`;
          return {
            q: `サイクロイド $${cyc} と x 軸で囲まれた部分の面積を求めよ。`,
            ans,
            choices: choices4(r, ans, [`$${piT(2 * a * a, 1)}$`, `$${piT(3 * a, 1)}$`, `$${piT(a * a, 1)}$`, `$${piT(3 * a * a, 1, 2)}$`]),
            hint: "$S=\\int y\\,dx=\\int_{0}^{2\\pi}y\\frac{dx}{dt}dt$ と置換する。",
            steps: [
              `$S=\\int_{0}^{2\\pi}${a * a === 1 ? "" : a * a}(1-\\cos t)^{2}dt$`,
              `$(1-\\cos t)^{2}=1-2\\cos t+\\frac{1+\\cos2t}{2}$ より $\\int_{0}^{2\\pi}(1-\\cos t)^{2}dt=3\\pi$`,
              `$S=${piT(3 * a * a, 1)}$`,
            ],
          };
        }
        if (mode === 1) {
          return {
            q: `サイクロイド $${cyc} の長さを求めよ。`,
            ans: 8 * a,
            hint: "$\\sqrt{\\left(\\frac{dx}{dt}\\right)^{2}+\\left(\\frac{dy}{dt}\\right)^{2}}$ を半角の公式で整理する。",
            steps: [
              `$\\left(\\frac{dx}{dt}\\right)^{2}+\\left(\\frac{dy}{dt}\\right)^{2}=${2 * a * a}(1-\\cos t)=${4 * a * a}\\sin^{2}\\frac{t}{2}$`,
              `$0\\leqq t\\leqq2\\pi$ で $\\sin\\frac{t}{2}\\geqq0$ より $L=\\int_{0}^{2\\pi}${2 * a}\\sin\\frac{t}{2}dt$`,
              `$=${2 * a}\\left[-2\\cos\\frac{t}{2}\\right]_{0}^{2\\pi}=${8 * a}$`,
            ],
          };
        }
        const ans = `$${piT(5 * a ** 3, 1, 2)}$`;
        return {
          q: `サイクロイド $${cyc} と x 軸で囲まれた部分を x 軸のまわりに1回転させてできる立体の体積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${piT(5 * a ** 3, 1)}$`, `$${piT(3 * a ** 3, 1, 2)}$`, `$${piT(5 * a * a, 1, 2)}$`, `$${piT(5 * a ** 3, 2, 2)}$`]),
          hint: "$V=\\pi\\int y^{2}dx=\\pi\\int_{0}^{2\\pi}y^{2}\\frac{dx}{dt}dt$。",
          steps: [
            `$V=\\pi\\int_{0}^{2\\pi}${a ** 3 === 1 ? "" : a ** 3}(1-\\cos t)^{3}dt$`,
            `$\\int_{0}^{2\\pi}(1-\\cos t)^{3}dt=\\int_{0}^{2\\pi}\\left(1-3\\cos t+3\\cos^{2}t-\\cos^{3}t\\right)dt=2\\pi+3\\pi=5\\pi$`,
            `$V=${piT(5 * a ** 3, 1, 2)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-4d", (r) => {
        const rr = r(1, 4), R3 = rr ** 3;
        if (r(0, 1) === 0) {
          const k = r(1, 2);
          const ang = k === 1 ? "底面と $45^{\\circ}$ の角をなす平面" : "底面とのなす角 $\\theta$ が $\\tan\\theta=2$ を満たす平面";
          return {
            q: `底面の半径が ${rr} で高さが十分ある直円柱を、底面の直径 AB を通り、${ang}で切る。切り取られた小さい方の立体（くさび形）の体積を求めよ。`,
            ans: fracAns(2 * k * R3, 3),
            hint: "直径 AB を x 軸にとり、x 軸に垂直な平面で切った切り口（直角三角形）の面積を x で表して積分する。",
            steps: [
              `底面の中心を原点、AB を x 軸にとる。点 $(x,\\ 0)$ を通り x 軸に垂直な平面で切ると、切り口は底辺 $\\sqrt{${rr * rr}-x^{2}}$、高さ $${k === 1 ? "" : k}\\sqrt{${rr * rr}-x^{2}}$ の直角三角形`,
              `切り口の面積は $${k === 2 ? `${rr * rr}-x^{2}` : `${fracTex(k, 2)}(${rr * rr}-x^{2})`}$`,
              `$V=\\int_{-${rr}}^{${rr}}${k === 2 ? `(${rr * rr}-x^{2})` : `${fracTex(k, 2)}(${rr * rr}-x^{2})`}\\,dx=${fracTex(2 * k * R3, 3)}$`,
            ],
          };
        }
        return {
          q: `半径 ${rr} の2つの直円柱が、中心軸が直角に交わるように交わっている。2つの直円柱の共通部分の体積を求めよ。`,
          ans: fracAns(16 * R3, 3),
          hint: "2本の中心軸の両方に垂直な方向で切ると、切り口は正方形になる。",
          steps: [
            `2本の中心軸を x 軸、y 軸にとると、共通部分は $x^{2}+z^{2}\\leqq${rr * rr}$ かつ $y^{2}+z^{2}\\leqq${rr * rr}$`,
            `平面 $z=t$（$-${rr}\\leqq t\\leqq${rr}$）で切ると、切り口は1辺 $2\\sqrt{${rr * rr}-t^{2}}$ の正方形で、面積は $4(${rr * rr}-t^{2})$`,
            `$V=\\int_{-${rr}}^{${rr}}4(${rr * rr}-t^{2})\\,dt=${fracTex(16 * R3, 3)}$`,
          ],
        };
      }),
      t("HIII-sekibunouyo-4e", (r) => {
        const a = r(1, 3), b = r(1, 2), A = a === 1 ? "" : a, ax = `${A}x`, bx = b === 1 ? "x" : `${b}x`, Q = a * a + b * b;
        const P = piT(a, b), P1 = piT(1, b), B = b === 1 ? "" : b;
        const ans = `$\\frac{${b === 1 ? "" : `${b}(`}e^{${P}}+1${b === 1 ? "" : ")"}}{${Q}(e^{${P}}-1)}$`;
        const wr = (num, den) => `$\\frac{${num}}{${den}}$`;
        return {
          q: `曲線 $y=e^{-${ax}}\\sin ${bx}$（$x\\geqq0$）と x 軸で囲まれた部分の面積の総和を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            wr(`${b === 1 ? "" : `${b}(`}e^{${P}}-1${b === 1 ? "" : ")"}`, `${Q}(e^{${P}}+1)`),
            wr(`e^{${P}}+1`, `e^{${P}}-1`),
            wr(`${b === 1 ? "" : `${b}(`}e^{${P}}+1${b === 1 ? "" : ")"}`, `${Q}e^{${P}}`),
            wr(`${B === "" ? "1" : B}`, `${Q}(e^{${P}}-1)`),
          ]),
          hint: `$\\sin ${bx}=0$ となる $x$ で区切り、$k$ 番目の部分の面積 $S_{k}$ を考える。$x=t+(k-1)${P1}$ と置換すると $S_{k}$ が等比数列になる。`,
          steps: [
            `$S_{k}=\\int_{(k-1)${P1}}^{k${P1}}|e^{-${ax}}\\sin ${bx}|\\,dx$ で $x=t+(k-1)${P1}$ とおくと $|\\sin ${bx}|=|\\sin ${b === 1 ? "t" : `${b}t`}|$ より $S_{k}=e^{-(k-1)${P}}S_{1}$`,
            `$S_{1}=\\int_{0}^{${P1}}e^{-${ax}}\\sin ${bx}\\,dx=\\left[-\\frac{e^{-${ax}}(${A}\\sin ${bx}+${B}\\cos ${bx})}{${Q}}\\right]_{0}^{${P1}}=\\frac{${B === "" ? `1+e^{-${P}}` : `${B}(1+e^{-${P}})`}}{${Q}}$`,
            `総和は初項 $S_{1}$、公比 $e^{-${P}}$ の無限等比級数で $\\frac{S_{1}}{1-e^{-${P}}}=${ans.slice(1, -1)}$`,
          ],
        };
      }),
    ],
  },
};

export const UNITS = [KYOKUGEN, BIBUN, BIBUNOUYO, SEKIBUN, SEKIBUNOUYO];
