// ============================================================
// hIII.js — 高校 数学III の単元（数学ラボ ソロ）
//   極限 / 微分法 / 微分の応用 / 積分法 / 積分の応用
// 書き方は docs/solo-問題データの書き方.md を参照
// ============================================================
import { t, pick, rnz, sgn, gcd, reduce, fracAns, fracTex, sqrtSimp, poly, signed, choices4 } from "../kit.js";

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
    ],
    2: [
      t("HIII-kyokugen-2a", (r) => {
        const a = r(-6, 6), b = r(0, 5), c = r(-6, 6);
        if (a === c) return { skip: true };
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
            q: `$f(x)=\\log(${inner})$ のとき、$f'(${c})$ の値を求めよ。`,
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
            `$x=\\frac{${R}}{\\sqrt{3}}$ で最大：$V=${surd(4 * R3, 9, 3)}\\pi$`,
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
            steps: [`$\\int ${L}^{${n}}dx=\\frac{1}{${a}}\\cdot\\frac{${L}^{${n + 1}}}{${n + 1}}+C$`, `$=${termTex(1, a * (n + 1), body)}+C$`],
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
    ],
  },
};

export const UNITS = [KYOKUGEN, BIBUN, BIBUNOUYO, SEKIBUN, SEKIBUNOUYO];
