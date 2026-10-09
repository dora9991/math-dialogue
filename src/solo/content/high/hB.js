// ============================================================
// hB.js — 高校 数学B の単元（数学ラボ ソロ）
//   等差数列・等比数列 / Σと階差数列 / 漸化式と数学的帰納法 / 統計的な推測
// 書き方は docs/solo-問題データの書き方.md
// ============================================================
import {
  t, pick, rnz, shuffle, gcd, lcm, round, fracAns, fracTex, poly, signed, coefVar, signedVar,
  choices4, numChoices, tex,
} from "../kit.js";

const COURSE = { course: "数学B", rikei: false };

// ── 小さな道具 ─────────────────────────────────────────
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
/** c・base^{e} の TeX（c=±1 は省略） */
function geoTex(c, base, e) {
  const B = base < 0 ? `(${base})` : `${base}`;
  const pw = `${B}^{${e}}`;
  if (c === 1) return pw;
  if (c === -1) return `-${pw}`;
  return `${c}\\cdot ${pw}`;
}
/** 2項目以降に足す形 */
const plusTerm = (s) => (s.startsWith("-") ? s : `+${s}`);
/** 等差数列の和 */
const arSum = (a, d, n) => (n * (2 * a + (n - 1) * d)) / 2;
/** 小数を TeX で（4桁まで） */
const dec = (x, d = 4) => String(round(x, d));

// ============================================================
// 等差数列・等比数列
// ============================================================
const SURETSU = {
  id: "HB-suretsu", grade: "H2", area: "num", name: "等差数列・等比数列",
  desc: "一般項・和",
  prereqs: ["J2-g2c3u1", "HII-shisu"],
  ...COURSE,
  points: [
    "等差数列 $a_{n}=a+(n-1)d$，和 $S_{n}=\\frac{n(a_{1}+a_{n})}{2}=\\frac{n\\{2a+(n-1)d\\}}{2}$。",
    "等比数列 $a_{n}=ar^{n-1}$，和 $S_{n}=\\frac{a(r^{n}-1)}{r-1}\\ (r\\neq 1)$。指数が $n$ か $n-1$ かに注意。",
    "3つの数 $a,\\ b,\\ c$ がこの順に等差数列 $\\iff 2b=a+c$，等比数列 $\\iff b^{2}=ac$。",
  ],
  levels: {
    1: [
      t("HB-suretsu-1a", (r) => {
        const a = r(-10, 20), d = rnz(r, -7, 7), n = r(10, 30);
        const ans = a + (n - 1) * d;
        return {
          q: `初項 $${a}$，公差 $${d}$ の等差数列の第 $${n}$ 項を求めよ。`,
          ans,
          hint: "等差数列の一般項 $a_{n}=a+(n-1)d$ に代入する。",
          steps: [`$a_{n}=${a}+(n-1)\\cdot ${par(d)}$`, `$a_{${n}}=${a}+${n - 1}\\cdot ${par(d)}=${ans}$`],
        };
      }),
      t("HB-suretsu-1b", (r) => {
        const a = rnz(r, -5, 5), rr = pick(r, [2, 3, -2, -3]), n = Math.abs(rr) === 3 ? r(4, 6) : r(4, 8);
        const ans = a * rr ** (n - 1);
        return {
          q: `初項 $${a}$，公比 $${rr}$ の等比数列の第 $${n}$ 項を求めよ。`,
          ans,
          hint: "等比数列の一般項は $a_{n}=ar^{n-1}$（指数は $n-1$）。",
          steps: [`$a_{${n}}=${a}\\cdot ${par(rr)}^{${n - 1}}=${a}\\cdot ${par(rr ** (n - 1))}$`, `答え：$${ans}$`],
        };
      }),
      t("HB-suretsu-1c", (r) => {
        const a = r(-10, 15), d = rnz(r, -5, 6), n = r(8, 25);
        const ans = arSum(a, d, n), an = a + (n - 1) * d;
        return {
          q: `初項 $${a}$，公差 $${d}$ の等差数列の，初項から第 $${n}$ 項までの和を求めよ。`,
          ans,
          hint: "$S_{n}=\\frac{n(a_{1}+a_{n})}{2}$。まず末項 $a_{n}$ を求める。",
          steps: [`末項は $a_{${n}}=${a}+${n - 1}\\cdot ${par(d)}=${an}$`, `$S_{${n}}=\\frac{${n}(${a}${signed(an)})}{2}=${ans}$`],
        };
      }),
    ],
    2: [
      t("HB-suretsu-2a", (r) => {
        const a = r(-10, 15), d = rnz(r, -6, 6);
        const p = r(2, 6), q = p + r(2, 6), k = r(15, 30);
        const A = (n) => a + (n - 1) * d;
        return {
          q: `等差数列 $\\{a_{n}\\}$ において $a_{${p}}=${A(p)}$，$a_{${q}}=${A(q)}$ である。$a_{${k}}$ を求めよ。`,
          ans: A(k),
          hint: "$a_{n}=a+(n-1)d$ とおいて，2つの条件から $a,\\ d$ の連立方程式をつくる。",
          steps: [
            `$a+${p - 1}d=${A(p)}$，$a+${q - 1}d=${A(q)}$`,
            `引くと $${q - p}d=${A(q) - A(p)}$ より $d=${d}$，$a=${a}$`,
            `$a_{${k}}=${a}+${k - 1}\\cdot ${par(d)}=${A(k)}$`,
          ],
        };
      }),
      t("HB-suretsu-2b", (r) => {
        const a = r(1, 5), rr = pick(r, [2, 3, -2]), n = rr === 3 ? r(5, 7) : r(5, 8);
        const S = (m) => (a * (rr ** m - 1)) / (rr - 1);
        const ans = S(n);
        return {
          q: `初項 $${a}$，公比 $${rr}$ の等比数列の，初項から第 $${n}$ 項までの和を求めよ。`,
          ans,
          choices: numChoices(r, ans, [S(n - 1), S(n + 1), a * (rr ** n - 1)]),
          hint: "$S_{n}=\\frac{a(r^{n}-1)}{r-1}$。指数は項数 $n$。",
          steps: [`$S_{${n}}=\\frac{${a}\\{${par(rr)}^{${n}}-1\\}}{${rr}-1}=\\frac{${a}\\cdot(${rr ** n - 1})}{${rr - 1}}$`, `答え：$${ans}$`],
        };
      }),
      t("HB-suretsu-2c", (r) => {
        const D = r(2, 5), N = r(5, 15), e = r(0, D - 1), A = D * (N - 1) + e;
        const ans = arSum(A, -D, N);
        return {
          q: `初項 $${A}$，公差 $${-D}$ の等差数列の，初項から第 $n$ 項までの和 $S_{n}$ の最大値を求めよ。`,
          ans,
          hint: "項が正（または0）である間は和が増える。$a_{n}\\geqq 0$ となる $n$ の範囲を調べる。",
          steps: [
            `$a_{n}=${A}-${D}(n-1)=${poly([-D, A + D], "n")}$`,
            `$a_{n}\\geqq 0$ となるのは $n\\leqq ${N}$ まで（$a_{${N}}=${e}$，$a_{${N + 1}}=${e - D}$）`,
            `最大値は $S_{${N}}=\\frac{${N}(${A}+${e})}{2}=${ans}$`,
          ],
        };
      }),
    ],
    3: [
      t("HB-suretsu-3a", (r) => {
        const X = r(2, 20), qv = pick(r, [2, 3, 4, -2, -3]);
        const Y = X * (1 + qv), ans = X * (1 + qv + qv * qv);
        return {
          q: `等比数列 $\\{a_{n}\\}$ の初項から第 $n$ 項までの和が $${X}$，初項から第 $2n$ 項までの和が $${Y}$ である。初項から第 $3n$ 項までの和を求めよ。`,
          ans,
          hint: "第 $n+1$ 項から第 $2n$ 項までの和は，初項から第 $n$ 項までの和の $r^{n}$ 倍になる。",
          steps: [
            `第 $n+1$ 項〜第 $2n$ 項の和は $${Y}-${par(X)}=${Y - X}$ で，これは $r^{n}\\times ${X}$ だから $r^{n}=${qv}$`,
            `第 $2n+1$ 項〜第 $3n$ 項の和は $r^{2n}\\times ${X}=${qv * qv * X}$`,
            `答え：$${Y}+${par(qv * qv * X)}=${ans}$`,
          ],
        };
      }),
      t("HB-suretsu-3b", (r) => {
        const a = r(-10, 10), d = rnz(r, -5, 5), m = pick(r, [5, 10]);
        const A = arSum(a, d, m), B = arSum(a, d, 2 * m) - A, C = arSum(a, d, 3 * m) - arSum(a, d, 2 * m);
        return {
          q: `等差数列 $\\{a_{n}\\}$ の初項から第 $${m}$ 項までの和が $${A}$，第 $${m + 1}$ 項から第 $${2 * m}$ 項までの和が $${B}$ である。第 $${2 * m + 1}$ 項から第 $${3 * m}$ 項までの和を求めよ。`,
          ans: C,
          hint: `${m}項ずつ区切った和も等差数列になる。公差は $${m}^{2}d$。`,
          steps: [
            `区切った和 $${A},\\ ${B},\\ \\square$ は公差 $${m * m}d$ の等差数列`,
            `よって求める和は $${B}+(${B}-${par(A)})=${C}$`,
          ],
        };
      }),
      t("HB-suretsu-3c", (r) => {
        const m = r(2, 8);
        let d = r(1, m + 3);
        if (d === m) d = m + 1;
        const S = 3 * m, P = m * (m * m - d * d);
        return {
          q: `等差数列をなす3つの数があり，その和は $${S}$，積は $${P}$ である。3つの数のうち最大のものを求めよ。`,
          ans: m + d,
          hint: "3つの数を $a-d,\\ a,\\ a+d$ とおくと，和から $a$ がすぐ求まる。",
          steps: [
            `3つの数を $a-d,\\ a,\\ a+d$ とおくと，和 $3a=${S}$ より $a=${m}$`,
            `積 $${m}(${m}^{2}-d^{2})=${P}$ より $d^{2}=${d * d}$，$d=\\pm ${d}$`,
            `どちらでも3つの数は $${m - d},\\ ${m},\\ ${m + d}$。答え：$${m + d}$`,
          ],
        };
      }),
    ],
    4: [
      t("HB-suretsu-4a", (r) => {
        const p = r(2, 7);
        let q = r(2, 7);
        if (q === p || gcd(p, q) !== 1) return { skip: true };
        const u = r(-3, 4), v = r(-3, 4), k = r(5, 20);
        let c1 = null;
        for (let n = 1; n <= 200 && c1 === null; n++) {
          const x = p * n + u;
          if ((x - v) % q === 0 && (x - v) / q >= 1) c1 = x;
        }
        if (c1 === null) return { skip: true };
        const ans = c1 + (k - 1) * p * q;
        const first = (f, s) => [1, 2, 3, 4, 5].map((n) => f * n + s).join(",\\ ");
        return {
          q: `2つの数列 $a_{n}=${poly([p, u], "n")}$，$b_{n}=${poly([q, v], "n")}$（$n=1,\\ 2,\\ 3,\\ \\cdots$）に共通にふくまれる数を小さい順に並べてできる数列の，第 $${k}$ 項を求めよ。`,
          ans,
          hint: `共通な数は，最初の1つが見つかれば，${p} と ${q} の最小公倍数ずつ増えていく。`,
          steps: [
            `$\\{a_{n}\\}$：$${first(p, u)},\\ \\cdots$，$\\{b_{n}\\}$：$${first(q, v)},\\ \\cdots$`,
            `最初の共通な数は $${c1}$。以後は公差 $${p}\\times ${q}=${p * q}$ の等差数列`,
            `第 $${k}$ 項は $${c1}+${k - 1}\\cdot ${p * q}=${ans}$`,
          ],
        };
      }),
      t("HB-suretsu-4b", (r) => {
        const A = r(1, 3), B = r(-5, 5), C = rnz(r, -5, 5), m = r(5, 10);
        const a1 = A + B + C, an = (n) => A * (2 * n - 1) + B;
        let sum = a1;
        for (let j = 2; j <= m; j++) sum += an(2 * j - 1);
        return {
          q: `数列 $\\{a_{n}\\}$ の初項から第 $n$ 項までの和 $S_{n}$ が $S_{n}=${poly([A, B, C], "n")}$ であるとき，$a_{1}+a_{3}+a_{5}+\\cdots+a_{${2 * m - 1}}$ を求めよ。`,
          ans: sum,
          hint: "$a_{1}=S_{1}$，$n\\geqq 2$ のとき $a_{n}=S_{n}-S_{n-1}$。$a_{1}$ がこの式に合うかを確かめる。",
          steps: [
            `$a_{1}=S_{1}=${a1}$，$n\\geqq 2$ で $a_{n}=S_{n}-S_{n-1}=${poly([2 * A, B - A], "n")}$（$n=1$ では $${2 * A + B - A}$ となり一致しない）`,
            `$a_{2j-1}=${poly([4 * A, B - 3 * A], "j")}$（$j\\geqq 2$）は公差 $${4 * A}$ の等差数列`,
            `$a_{3}+\\cdots+a_{${2 * m - 1}}=\\frac{${m - 1}(${an(3)}+${an(2 * m - 1)})}{2}=${sum - a1}$`,
            `答え：$${a1}${signed(sum - a1)}=${sum}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// Σと階差数列
// ============================================================
const SIGMA = {
  id: "HB-sigma", grade: "H2", area: "num", name: "Σと階差数列",
  desc: "Σの公式・階差数列・分数の和",
  prereqs: ["HB-suretsu"],
  ...COURSE,
  points: [
    "$\\sum_{k=1}^{n}k=\\frac{1}{2}n(n+1)$，$\\sum_{k=1}^{n}k^{2}=\\frac{1}{6}n(n+1)(2n+1)$，$\\sum_{k=1}^{n}k^{3}=\\left\\{\\frac{1}{2}n(n+1)\\right\\}^{2}$。",
    "階差数列 $b_{n}=a_{n+1}-a_{n}$ のとき，$n\\geqq 2$ で $a_{n}=a_{1}+\\sum_{k=1}^{n-1}b_{k}$（和は $n-1$ まで）。",
    "分数の和は部分分数に分ける：$\\frac{1}{k(k+1)}=\\frac{1}{k}-\\frac{1}{k+1}$ で途中が消える。",
    "$S_{n}$ から一般項：$a_{1}=S_{1}$，$n\\geqq 2$ で $a_{n}=S_{n}-S_{n-1}$。",
  ],
  levels: {
    1: [
      t("HB-sigma-1a", (r) => {
        const n = r(5, 15), ans = (n * (n + 1) * (2 * n + 1)) / 6;
        return {
          q: `$\\sum_{k=1}^{${n}}k^{2}$ の値を求めよ。`,
          ans,
          choices: numChoices(r, ans, [(n * (n + 1)) / 2, ((n * (n + 1)) / 2) ** 2, (n * (n + 1) * (2 * n + 1)) / 3]),
          hint: "$\\sum_{k=1}^{n}k^{2}=\\frac{1}{6}n(n+1)(2n+1)$",
          steps: [`$\\frac{1}{6}\\cdot ${n}\\cdot ${n + 1}\\cdot ${2 * n + 1}=${ans}$`],
        };
      }),
      t("HB-sigma-1b", (r) => {
        const a = rnz(r, -5, 5), b = r(-9, 9), n = r(5, 20);
        const ans = (a * n * (n + 1)) / 2 + b * n;
        return {
          q: `$\\sum_{k=1}^{${n}}(${poly([a, b], "k")})$ の値を求めよ。`,
          ans,
          hint: "$\\sum(ak+b)=a\\sum k+\\sum b$。定数 $b$ の和は $bn$。",
          steps: [
            `$${a === 1 ? "" : a === -1 ? "-" : a}\\sum_{k=1}^{${n}}k${b ? `${signed(b)}\\times ${n}` : ""}=${a}\\cdot\\frac{${n}\\cdot ${n + 1}}{2}${b ? signed(b * n) : ""}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
    ],
    2: [
      t("HB-sigma-2a", (r) => {
        const c = pick(r, [1, 2, 3, 4, 5, -1, -2, -3]), K = 1 + 3 * c;
        const closed = (k) => (k % 2 === 0
          ? `\\frac{1}{3}n(n+1)(${poly([1, k / 2], "n")})`
          : `\\frac{1}{6}n(n+1)(${poly([2, k], "n")})`);
        const ans = tex(closed(K));
        const ws = [1 + c, 1 + 6 * c, 3 * c - 1, 3 * c + 2].filter((k) => k !== K && k !== 0).map((k) => tex(closed(k)));
        return {
          q: `$\\sum_{k=1}^{n}k(k${signed(c)})$ を求めよ。`,
          ans,
          choices: choices4(r, ans, ws, (i) => tex(closed(K + 2 * (i + 1) + 1))),
          hint: "$k(k+c)=k^{2}+ck$ と分けて，$\\sum k^{2}$ と $\\sum k$ の公式を使い，$\\frac{1}{6}n(n+1)$ でくくる。",
          steps: [
            `$\\sum k^{2}${c > 0 ? "+" : "-"}${Math.abs(c) === 1 ? "" : Math.abs(c)}\\sum k=\\frac{1}{6}n(n+1)(2n+1)${c > 0 ? "+" : "-"}\\frac{${Math.abs(c)}}{2}n(n+1)$`,
            `$=\\frac{1}{6}n(n+1)\\{(2n+1)${signed(3 * c)}\\}=\\frac{1}{6}n(n+1)(${poly([2, K], "n")})$`,
            `答え：$${closed(K)}$`,
          ],
        };
      }),
      t("HB-sigma-2b", (r) => {
        const p = pick(r, [2, 4, 6, -2, -4]), q = r(-5, 5), A = r(-5, 5);
        const P = (co) => tex(`a_{n}=${poly(co, "n")}`);
        const ans = P([p / 2, q - p / 2, A - q]);
        return {
          q: `数列 $\\{a_{n}\\}$ が $a_{1}=${A}$，$a_{n+1}-a_{n}=${poly([p, q], "n")}$ をみたすとき，一般項 $a_{n}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [P([p / 2, q + p / 2, A]), P([p / 2, q - p / 2, -q]), P([p, q - p, A - q])],
            (i) => P([p / 2, q - p / 2, A - q + i + 1])),
          hint: "$n\\geqq 2$ のとき $a_{n}=a_{1}+\\sum_{k=1}^{n-1}b_{k}$。和は $n-1$ までであることに注意。",
          steps: [
            `$n\\geqq 2$ のとき $a_{n}=${A}+\\sum_{k=1}^{n-1}(${poly([p, q], "k")})=${A}${signed(p / 2)}(n-1)n${signed(q)}(n-1)$`,
            `整理して $a_{n}=${poly([p / 2, q - p / 2, A - q], "n")}$（$n=1$ のときも $a_{1}=${A}$ で成り立つ）`,
          ],
        };
      }),
      t("HB-sigma-2c", (r) => {
        const a = pick(r, [1, 2, 3]);
        const b = pick(r, a === 1 ? [0, 1, 2] : a === 2 ? [-1, 0, 1] : [-2, -1, 0, 1]);
        const n = r(5, 20);
        const f1 = poly([a, b], "k"), f2 = poly([a, a + b], "k");
        const den = b === 0 ? `${f1}(${f2})` : `(${f1})(${f2})`;
        const L = a + b, R = a * n + a + b;
        return {
          q: `$\\sum_{k=1}^{${n}}\\frac{1}{${den}}$ の値を求めよ。`,
          ans: fracAns(n, L * R),
          hint: "部分分数に分けると，となりあう項が打ち消し合う。",
          steps: [
            `$\\frac{1}{${den}}=\\frac{1}{${a}}\\left(\\frac{1}{${f1}}-\\frac{1}{${f2}}\\right)$`,
            `和をとると途中が消えて $\\frac{1}{${a}}\\left(\\frac{1}{${L}}-\\frac{1}{${R}}\\right)$`,
            `答え：$${fracTex(n, L * R)}$`,
          ],
        };
      }),
    ],
    3: [
      t("HB-sigma-3a", (r) => {
        const p = pick(r, [1, 2, 3, -1]), q = r(-5, 5), c = rnz(r, -5, 5);
        const a1 = p + q + c, gen = poly([2 * p, q - p], "n");
        const ans = `$a_{1}=${a1}$，$n\\geqq 2$ のとき $a_{n}=${gen}$`;
        return {
          q: `数列 $\\{a_{n}\\}$ の初項から第 $n$ 項までの和 $S_{n}$ が $S_{n}=${poly([p, q, c], "n")}$ で表されるとき，一般項 $a_{n}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            `$a_{n}=${gen}$`,
            `$a_{1}=${a1}$，$n\\geqq 2$ のとき $a_{n}=${poly([2 * p, q - p + c], "n")}$`,
            `$a_{n}=${poly([2 * p, q + p], "n")}$`,
          ]),
          hint: "$a_{1}=S_{1}$ と，$n\\geqq 2$ での $a_{n}=S_{n}-S_{n-1}$ を別々に求める。",
          steps: [
            `$a_{1}=S_{1}=${a1}$`,
            `$n\\geqq 2$ のとき $a_{n}=S_{n}-S_{n-1}=${gen}$`,
            `$n=1$ を代入すると $${2 * p + q - p}\\neq ${a1}$ なので，$a_{1}$ は別に書く`,
          ],
        };
      }),
      t("HB-sigma-3b", (r) => {
        const rr = pick(r, [2, 3]), a = pick(r, [1, 2]), b = r(-1, 1), n = r(5, 8);
        let S = 0;
        for (let k = 1; k <= n; k++) S += (a * k + b) * rr ** (k - 1);
        const term = (k) => `${a * k + b}${k === 1 ? "" : `\\cdot ${rr}${k === 2 ? "" : `^{${k - 1}}`}`}`;
        return {
          q: `$S=\\sum_{k=1}^{${n}}${b === 0 ? poly([a, b], "k") : `(${poly([a, b], "k")})`}\\cdot ${rr}^{k-1}$ の値を求めよ。`,
          ans: S,
          hint: `$S-${rr}S$ を計算すると，等比数列の和が現れる。`,
          steps: [
            `$S=${term(1)}+${term(2)}+\\cdots+${term(n)}$`,
            `$S-${rr}S=${a + b}+${a === 1 ? "" : `${a}\\cdot `}(${rr}+${rr}^{2}+\\cdots+${rr}^{${n - 1}})-${a * n + b}\\cdot ${rr}^{${n}}$`,
            `$(1-${rr})S=${(1 - rr) * S}$ より，答え：$S=${S}$`,
          ],
        };
      }),
      t("HB-sigma-3c", (r) => {
        const rr = pick(r, [2, 3]), A = r(-5, 5);
        let corr, ws;
        if (rr === 2) {
          const c = (k) => (k ? signed(k) : "");
          corr = `2^{n}${c(A - 2)}`;
          ws = [`2^{n+1}${c(A - 2)}`, `2^{n-1}${c(A - 1)}`, `2^{n}${c(A)}`];
        } else {
          const f = (e, k) => `\\frac{3^{${e}}${k ? signed(k) : ""}}{2}`;
          corr = f("n", 2 * A - 3);
          ws = [f("n+1", 2 * A - 3), f("n-1", 2 * A - 1), f("n", 2 * A - 1)];
        }
        const ans = tex(`a_{n}=${corr}`);
        return {
          q: `数列 $\\{a_{n}\\}$ が $a_{1}=${A}$，$a_{n+1}-a_{n}=${rr}^{n}$ をみたすとき，一般項 $a_{n}$ を求めよ。`,
          ans,
          choices: choices4(r, ans, ws.map((w) => tex(`a_{n}=${w}`))),
          hint: `$n\\geqq 2$ で $a_{n}=a_{1}+\\sum_{k=1}^{n-1}${rr}^{k}$。初項 ${rr}，公比 ${rr}，項数 $n-1$ の等比数列の和。`,
          steps: [
            `$n\\geqq 2$ のとき $a_{n}=${A}+\\sum_{k=1}^{n-1}${rr}^{k}=${A}+\\frac{${rr}(${rr}^{n-1}-1)}{${rr}-1}$`,
            `整理して $a_{n}=${corr}$（$n=1$ でも成り立つ）`,
          ],
        };
      }),
    ],
    4: [
      t("HB-sigma-4a", (r) => {
        const N = r(30, 120), askSum = r(0, 1) === 1;
        const seq = [];
        for (let g = 1; seq.length < N; g++) for (let j = 1; j <= g && seq.length < N; j++) seq.push(j);
        let g = 1;
        while ((g * (g + 1)) / 2 < N) g++;
        const before = ((g - 1) * g) / 2, pos = N - before;
        const sum = seq.reduce((x, y) => x + y, 0);
        return {
          q: `数列 $1,\\ 1,\\ 2,\\ 1,\\ 2,\\ 3,\\ 1,\\ 2,\\ 3,\\ 4,\\ 1,\\ \\cdots$ の${askSum ? `初項から第 $${N}$ 項までの和` : `第 $${N}$ 項`}を求めよ。`,
          ans: askSum ? sum : seq[N - 1],
          hint: "$1\\,|\\,1,\\ 2\\,|\\,1,\\ 2,\\ 3\\,|\\,\\cdots$ と区切る（群数列）。第 $m$ 群には $m$ 個の項がある。",
          steps: [
            `第 $m$ 群までの項数は $\\frac{1}{2}m(m+1)$。$\\frac{1}{2}\\cdot ${g - 1}\\cdot ${g}=${before}<${N}\\leqq ${(g * (g + 1)) / 2}$`,
            `第 $${N}$ 項は第 $${g}$ 群の $${pos}$ 番目で，値は $${pos}$`,
            askSum
              ? `第 $m$ 群の和は $\\frac{1}{2}m(m+1)$。$\\sum_{m=1}^{${g - 1}}\\frac{1}{2}m(m+1)+(1+\\cdots+${pos})=${sum - (pos * (pos + 1)) / 2}+${(pos * (pos + 1)) / 2}=${sum}$`
              : `答え：$${pos}$`,
          ],
        };
      }),
      t("HB-sigma-4b", (r) => {
        if (r(0, 1) === 1) {
          const n = r(5, 20);
          return {
            q: `$\\sum_{k=1}^{${n}}\\frac{1}{k(k+1)(k+2)}$ の値を求めよ。`,
            ans: fracAns(n * (n + 3), 4 * (n + 1) * (n + 2)),
            hint: "$\\frac{1}{k(k+1)(k+2)}=\\frac{1}{2}\\left\\{\\frac{1}{k(k+1)}-\\frac{1}{(k+1)(k+2)}\\right\\}$ と分ける。",
            steps: [
              `$\\frac{1}{k(k+1)(k+2)}=\\frac{1}{2}\\left\\{\\frac{1}{k(k+1)}-\\frac{1}{(k+1)(k+2)}\\right\\}$`,
              `和をとると途中が消えて $\\frac{1}{2}\\left(\\frac{1}{2}-\\frac{1}{${n + 1}\\cdot ${n + 2}}\\right)$`,
              `答え：$${fracTex(n * (n + 3), 4 * (n + 1) * (n + 2))}$`,
            ],
          };
        }
        const s = r(4, 15), n = s * s - 1;
        return {
          q: `$\\sum_{k=1}^{${n}}\\frac{1}{\\sqrt{k}+\\sqrt{k+1}}$ の値を求めよ。`,
          ans: s - 1,
          hint: "分母を有理化すると $\\sqrt{k+1}-\\sqrt{k}$ になり，和で途中が消える。",
          steps: [
            `$\\frac{1}{\\sqrt{k}+\\sqrt{k+1}}=\\sqrt{k+1}-\\sqrt{k}$`,
            `和は $(\\sqrt{2}-\\sqrt{1})+(\\sqrt{3}-\\sqrt{2})+\\cdots+(\\sqrt{${n + 1}}-\\sqrt{${n}})=\\sqrt{${n + 1}}-1$`,
            `答え：$${s}-1=${s - 1}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 漸化式と数学的帰納法
// ============================================================
const ZENKA = {
  id: "HB-zenka", grade: "H2", area: "num", name: "漸化式と数学的帰納法",
  desc: "等差・等比・階差型・an+1=pan+q 型",
  prereqs: ["HB-sigma"],
  ...COURSE,
  points: [
    "等差型 $a_{n+1}=a_{n}+d$，等比型 $a_{n+1}=ra_{n}$，階差型 $a_{n+1}=a_{n}+f(n)$（$a_{n}=a_{1}+\\sum_{k=1}^{n-1}f(k)$）。",
    "$a_{n+1}=pa_{n}+q$ は，$\\alpha=p\\alpha+q$ をみたす $\\alpha$ を使って $a_{n+1}-\\alpha=p(a_{n}-\\alpha)$ と変形し，等比数列に帰着する。",
    "逆数をとる・$p^{n+1}$ で割るなど，おきかえで基本の型に直すのがコツ。",
    "数学的帰納法：$n=1$ で成り立つことを示し，$n=k$ で成り立つと仮定して $n=k+1$ でも成り立つことを示す。",
  ],
  levels: {
    1: [
      t("HB-zenka-1a", (r) => {
        const A = r(-3, 5), p = pick(r, [2, 3, -1, -2]), q = r(-5, 5), K = r(4, 5);
        const seq = [A];
        for (let i = 2; i <= K; i++) seq.push(p * seq[seq.length - 1] + q);
        return {
          q: `$a_{1}=${A}$，$a_{n+1}=${coefVar(p, "a_{n}")}${q ? signed(q) : ""}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${K}}$ を求めよ。`,
          ans: seq[K - 1],
          hint: "$n=1,\\ 2,\\ 3,\\ \\cdots$ を順に代入して計算する。",
          steps: [
            seq.slice(1).map((v, i) => `$a_{${i + 2}}=${p}\\cdot ${par(seq[i])}${q ? signed(q) : ""}=${v}$`).join("，"),
            `答え：$${seq[K - 1]}$`,
          ],
        };
      }),
      t("HB-zenka-1b", (r) => {
        if (r(0, 1) === 1) {
          const A = r(-5, 8), d = rnz(r, -5, 5);
          const P = (co) => tex(`a_{n}=${poly(co, "n")}`);
          const ans = P([d, A - d]);
          return {
            q: `$a_{1}=${A}$，$a_{n+1}=a_{n}${signed(d)}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
            ans,
            choices: choices4(r, ans, [P([d, A]), P([d, A + d]), P([-d, A + d])], (i) => P([d, A - d + i + 1])),
            hint: "隣どうしの差が一定なので等差数列。$a_{n}=a_{1}+(n-1)d$。",
            steps: [`初項 $${A}$，公差 $${d}$ の等差数列`, `$a_{n}=${A}+(n-1)\\cdot ${par(d)}=${poly([d, A - d], "n")}$`],
          };
        }
        const A = pick(r, [2, 3, 5, -2, -3]);
        let rr = pick(r, [2, 3, -2, -3]);
        if (rr === A) rr = -rr;
        const ans = tex(`a_{n}=${geoTex(A, rr, "n-1")}`);
        return {
          q: `$a_{1}=${A}$，$a_{n+1}=${rr}a_{n}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(`a_{n}=${geoTex(A, rr, "n")}`), tex(`a_{n}=${geoTex(A, rr, "n+1")}`), tex(`a_{n}=${geoTex(1, A * rr, "n-1")}`)]),
          hint: "前の項の一定倍になっているので等比数列。$a_{n}=a_{1}r^{n-1}$。",
          steps: [`初項 $${A}$，公比 $${rr}$ の等比数列`, `$a_{n}=${geoTex(A, rr, "n-1")}$`],
        };
      }),
    ],
    2: [
      t("HB-zenka-2a", (r) => {
        const p = pick(r, [2, 3, -2]), al = rnz(r, -4, 4), q = al * (1 - p);
        let A = r(-5, 6);
        if (A === al) A = al + 1;
        const c = A - al;
        const G = (cc, e, k) => (cc === 0 ? null : tex(`a_{n}=${geoTex(cc, p, e)}${k ? signed(k) : ""}`));
        const ans = G(c, "n-1", al);
        return {
          q: `$a_{1}=${A}$，$a_{n+1}=${coefVar(p, "a_{n}")}${signed(q)}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans,
          choices: choices4(r, ans, [G(c, "n", al), G(A + al, "n-1", -al), G(A, "n-1", al)], (i) => G(c + i + 1, "n-1", al)),
          hint: "$\\alpha=p\\alpha+q$ となる $\\alpha$ を求め，$a_{n+1}-\\alpha=p(a_{n}-\\alpha)$ と変形する。",
          steps: [
            `$\\alpha=${p}\\alpha${signed(q)}$ より $\\alpha=${al}$。$a_{n+1}${signed(-al)}=${p}(a_{n}${signed(-al)})$`,
            `数列 $\\{a_{n}${signed(-al)}\\}$ は初項 $${A}${signed(-al)}=${c}$，公比 $${p}$ の等比数列`,
            `$a_{n}${signed(-al)}=${geoTex(c, p, "n-1")}$ より $a_{n}=${geoTex(c, p, "n-1")}${signed(al)}$`,
          ],
        };
      }),
      t("HB-zenka-2b", (r) => {
        const A = r(-5, 5), p = rnz(r, -3, 4), q = r(-5, 5), k = r(6, 15);
        const ans = A + (p * (k - 1) * k) / 2 + q * (k - 1);
        return {
          q: `$a_{1}=${A}$，$a_{n+1}=a_{n}${plusTerm(poly([p, q], "n"))}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${k}}$ を求めよ。`,
          ans,
          hint: "階差数列 $b_{n}=a_{n+1}-a_{n}$ を使い，$a_{n}=a_{1}+\\sum_{k=1}^{n-1}b_{k}$。",
          steps: [
            `$a_{${k}}=${A}+\\sum_{j=1}^{${k - 1}}(${poly([p, q], "j")})$`,
            `$=${A}${signed(p)}\\cdot\\frac{${k - 1}\\cdot ${k}}{2}${q ? `${signed(q)}\\cdot ${k - 1}` : ""}=${ans}$`,
          ],
        };
      }),
    ],
    3: [
      t("HB-zenka-3a", (r) => {
        const p = pick(r, [2, 3]), c = pick(r, [1, 2, -1]);
        let A = r(1, 5);
        if (A === c * p) A = c * p + 1;
        const F = (co, e) => tex(`a_{n}=(${poly(co, "n")})\\cdot ${p}^{${e}}`);
        const ans = F([c * p, A - c * p], "n-1");
        const rec = `a_{n+1}=${p}a_{n}${c > 0 ? "+" : "-"}${Math.abs(c) === 1 ? "" : `${Math.abs(c)}\\cdot `}${p}^{n+1}`;
        return {
          q: `$a_{1}=${A}$，$${rec}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans,
          choices: choices4(r, ans, [F([c * p, A - c * p], "n"), A !== c ? F([c, A - c], "n-1") : null, F([c * p, A], "n-1")],
            (i) => F([c * p, A - c * p + i + 1], "n-1")),
          hint: `両辺を $${p}^{n+1}$ で割り，$b_{n}=\\frac{a_{n}}{${p}^{n}}$ とおく。`,
          steps: [
            `両辺を $${p}^{n+1}$ で割ると $\\frac{a_{n+1}}{${p}^{n+1}}=\\frac{a_{n}}{${p}^{n}}${signed(c)}$`,
            `$b_{n}=\\frac{a_{n}}{${p}^{n}}$ は初項 $${fracTex(A, p)}$，公差 $${c}$ の等差数列：$b_{n}=${fracTex(A, p)}${signedVar(c, "(n-1)")}$`,
            `$a_{n}=${p}^{n}b_{n}=(${poly([c * p, A - c * p], "n")})\\cdot ${p}^{n-1}$`,
          ],
        };
      }),
      t("HB-zenka-3b", (r) => {
        const q = r(-4, 4), c = r(-4, 4);
        if (q === 0 && c === 0) return { skip: true };
        const a1 = -(q + c);
        if (a1 === q) return { skip: true };
        const k = r(5, 9), ans = (a1 - q) * 2 ** (k - 1) + q;
        return {
          q: `数列 $\\{a_{n}\\}$ の初項から第 $n$ 項までの和 $S_{n}$ が $S_{n}=2a_{n}${q ? signedVar(q, "n") : ""}${c ? signed(c) : ""}$ をみたすとき，$a_{${k}}$ を求めよ。`,
          ans,
          hint: "$n=1$ を代入して $a_{1}$ を求め，$S_{n+1}-S_{n}=a_{n+1}$ から漸化式をつくる。",
          steps: [
            `$n=1$ とすると $a_{1}=2a_{1}${signed(q + c)}$ より $a_{1}=${a1}$`,
            `$S_{n+1}-S_{n}$ を計算すると $a_{n+1}=2a_{n+1}-2a_{n}${q ? signed(q) : ""}$ より $a_{n+1}=2a_{n}${q ? signed(-q) : ""}$`,
            q ? `$a_{n+1}${signed(-q)}=2(a_{n}${signed(-q)})$ より $a_{n}=${geoTex(a1 - q, 2, "n-1")}${signed(q)}$` : `公比 $2$ の等比数列なので $a_{n}=${geoTex(a1, 2, "n-1")}$`,
            `答え：$a_{${k}}=${ans}$`,
          ],
        };
      }),
      t("HB-zenka-3c", (r) => {
        const p = r(1, 4), A = r(1, 5), k = r(5, 12);
        const bk = A + p * (k - 1);
        return {
          q: `$a_{1}=${fracTex(1, A)}$，$a_{n+1}=\\frac{a_{n}}{${coefVar(p, "a_{n}")}+1}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${k}}$ を求めよ。`,
          ans: fracAns(1, bk),
          hint: "両辺の逆数をとると，$\\frac{1}{a_{n}}$ の漸化式が等差型になる。",
          steps: [
            `逆数をとると $\\frac{1}{a_{n+1}}=\\frac{1}{a_{n}}+${p}$`,
            `$\\frac{1}{a_{n}}$ は初項 $${A}$，公差 $${p}$ の等差数列：$\\frac{1}{a_{${k}}}=${A}+${p}\\cdot ${k - 1}=${bk}$`,
            `答え：$${fracTex(1, bk)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HB-zenka-4a", (r) => {
        const al = pick(r, [1, 2, 3, -1, -2]);
        let be = pick(r, [1, 2, 3, -1, -2]);
        if (be === al) return { skip: true };
        const c1 = rnz(r, -3, 3), c2 = rnz(r, -3, 3);
        const a1 = c1 + c2, a2 = c1 * al + c2 * be, s = al + be, pr = al * be;
        const term = (c, base, first, e) => (base === 1 ? (first ? String(c) : signed(c)) : first ? geoTex(c, base, e) : plusTerm(geoTex(c, base, e)));
        const form = (x1, b1, x2, b2, e = "n-1") => tex(`a_{n}=${term(x1, b1, true, e)}${term(x2, b2, false, e)}`);
        const rec = `a_{n+2}=${s === 0 ? coefVar(-pr, "a_{n}") : `${coefVar(s, "a_{n+1}")}${signedVar(-pr, "a_{n}")}`}`;
        const ans = form(c1, al, c2, be);
        return {
          q: `$a_{1}=${a1}$，$a_{2}=${a2}$，$${rec}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans,
          choices: choices4(r, ans, [form(c2, al, c1, be), form(c1, al, c2, be, "n"), form(c1, al, -c2, be)],
            (i) => form(c1 + i + 1, al, c2, be)),
          hint: "$x^{2}=(\\cdots)x+(\\cdots)$ の2解 $\\alpha,\\ \\beta$ を求め，$a_{n+2}-\\alpha a_{n+1}=\\beta(a_{n+1}-\\alpha a_{n})$ と変形する。",
          steps: [
            `$x^{2}=${s === 0 ? String(-pr) : `${coefVar(s)}${signed(-pr)}`}$ の解は $x=${al},\\ ${be}$`,
            `$a_{n+2}${signedVar(-al, "a_{n+1}")}=${par(be)}(a_{n+1}${signedVar(-al, "a_{n}")})$ などから，$a_{n}=p\\cdot ${par(al)}^{n-1}+q\\cdot ${par(be)}^{n-1}$ の形になる`,
            `$a_{1}=p+q=${a1}$，$a_{2}=${coefVar(al, "p")}${signedVar(be, "q")}=${a2}$ より $p=${c1}$，$q=${c2}$`,
          ],
        };
      }),
      t("HB-zenka-4b", (r) => {
        const rr = pick(r, [2, 3]), p = r(1, 3), A = r(1, 4), k = r(4, 7);
        let b = A;
        for (let i = 2; i <= k; i++) b = rr * b + p;
        const al = fracTex(-p, rr - 1), c = fracTex(A * (rr - 1) + p, rr - 1);
        return {
          q: `$a_{1}=${fracTex(1, A)}$，$a_{n+1}=\\frac{a_{n}}{${coefVar(p, "a_{n}")}+${rr}}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${k}}$ を求めよ。`,
          ans: fracAns(1, b),
          hint: "逆数 $b_{n}=\\frac{1}{a_{n}}$ をとると $b_{n+1}=pb_{n}+q$ 型の漸化式になる。",
          steps: [
            `$b_{n}=\\frac{1}{a_{n}}$ とおくと $b_{n+1}=${rr}b_{n}+${p}$，$b_{1}=${A}$`,
            `$\\alpha=${al}$ として $b_{n}-\\left(${al}\\right)=\\left(${c}\\right)\\cdot ${rr}^{n-1}$`,
            `$b_{${k}}=${b}$ より，答え：$a_{${k}}=${fracTex(1, b)}$`,
          ],
        };
      }),
      t("HB-zenka-4c", (r) => {
        const a = r(2, 9);
        return {
          q: `すべての自然数 $n$ について，$${a + 1}^{n}-${a}n-1$ を割り切る最大の自然数を求めよ。`,
          ans: a * a,
          hint: "$n=1,\\ 2,\\ 3$ で値を計算して見当をつけ，数学的帰納法で確かめる。",
          steps: [
            `$n=1$ で $0$，$n=2$ で $${(a + 1) ** 2 - 2 * a - 1}=${a}^{2}$。よって答えは $${a * a}$ 以下`,
            `$${a + 1}^{k}-${a}k-1=${a * a}M$ と仮定すると $${a + 1}^{k+1}-${a}(k+1)-1=${a + 1}(${a * a}M+${a}k+1)-${a}k-${a + 1}=${a * a}\\{${a + 1}M+k\\}$`,
            `数学的帰納法により常に $${a * a}$ で割り切れる。答え：$${a * a}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 統計的な推測
// ============================================================
const T1 = 0.3413, T2 = 0.4772;
const TAB = "ただし，標準正規分布に従う $Z$ について $P(0\\leqq Z\\leqq 1)=0.3413$，$P(0\\leqq Z\\leqq 2)=0.4772$ とする。";
const PFR = [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 3], [3, 4], [2, 5]];
/** 確率分布（3つの値と確率） */
function distr(r) {
  const xs = [];
  while (xs.length < 3) { const x = r(-2, 6); if (!xs.includes(x)) xs.push(x); }
  xs.sort((a, b) => a - b);
  const D = pick(r, [4, 5, 6, 8, 10]);
  const p1 = r(1, D - 2), p2 = r(1, D - p1 - 1), ps = [p1, p2, D - p1 - p2];
  const list = xs.map((x, i) => `$P(X=${x})=${fracTex(ps[i], D)}$`).join("，");
  const s1 = xs.reduce((a, x, i) => a + x * ps[i], 0), s2 = xs.reduce((a, x, i) => a + x * x * ps[i], 0);
  return { xs, ps, D, list, s1, s2 };
}
/** 正規近似の題材 [説明, n, p分子, p分母, m, σ] */
const BINOM = [
  ["1枚の硬貨を {n} 回投げるとき，表が出る回数", 100, 1, 2, 50, 5],
  ["1枚の硬貨を {n} 回投げるとき，表が出る回数", 400, 1, 2, 200, 10],
  ["1枚の硬貨を {n} 回投げるとき，表が出る回数", 900, 1, 2, 450, 15],
  ["1個のさいころを {n} 回投げるとき，1の目が出る回数", 180, 1, 6, 30, 5],
  ["1個のさいころを {n} 回投げるとき，1の目が出る回数", 720, 1, 6, 120, 10],
  ["1個のさいころを {n} 回投げるとき，3の倍数の目が出る回数", 450, 1, 3, 150, 10],
  ["1個のさいころを {n} 回投げるとき，3の倍数の目が出る回数", 288, 1, 3, 96, 8],
  ["当たりの確率が $\\frac{1}{5}$ のくじを {n} 回引く（毎回もどす）とき，当たりの回数", 400, 1, 5, 80, 8],
  ["当たりの確率が $\\frac{1}{5}$ のくじを {n} 回引く（毎回もどす）とき，当たりの回数", 625, 1, 5, 125, 10],
];

const TOUKEI = {
  id: "HB-toukei", grade: "H2", area: "data", name: "統計的な推測",
  desc: "確率変数・期待値と分散・二項分布・正規分布・推定",
  prereqs: ["HA-joken", "HI-data"],
  ...COURSE,
  points: [
    "期待値 $E(X)=\\sum x_{k}p_{k}$，分散 $V(X)=E(X^{2})-\\{E(X)\\}^{2}$，標準偏差 $\\sigma(X)=\\sqrt{V(X)}$。$E(aX+b)=aE(X)+b$，$V(aX+b)=a^{2}V(X)$。",
    "$X,\\ Y$ が独立なら $E(XY)=E(X)E(Y)$，$V(aX+bY)=a^{2}V(X)+b^{2}V(Y)$。二項分布 $B(n,\\ p)$ は $E(X)=np$，$V(X)=np(1-p)$。",
    "$X$ が正規分布 $N(m,\\ \\sigma^{2})$ に従うとき，$Z=\\frac{X-m}{\\sigma}$ は標準正規分布 $N(0,\\ 1)$ に従う。$n$ が大きい二項分布は $N(np,\\ np(1-p))$ で近似できる。",
    "母平均の信頼度95%の信頼区間は $\\overline{X}-1.96\\cdot\\frac{\\sigma}{\\sqrt{n}}\\leqq m\\leqq\\overline{X}+1.96\\cdot\\frac{\\sigma}{\\sqrt{n}}$。",
  ],
  levels: {
    1: [
      t("HB-toukei-1a", (r) => {
        const d = distr(r);
        return {
          q: `確率変数 $X$ のとる値と確率が ${d.list} であるとき，期待値 $E(X)$ を求めよ。`,
          ans: fracAns(d.s1, d.D),
          hint: "期待値は「値 × 確率」の和：$E(X)=\\sum x_{k}p_{k}$。",
          steps: [
            `$E(X)=${d.xs.map((x, i) => `${par(x)}\\cdot ${fracTex(d.ps[i], d.D)}`).join("+")}$`,
            `$=\\frac{${d.s1}}{${d.D}}${gcd(d.s1, d.D) === 1 && d.s1 !== 0 ? "" : `=${fracTex(d.s1, d.D)}`}$`,
          ],
        };
      }),
      t("HB-toukei-1b", (r) => {
        const m = r(-5, 10), s = r(1, 5), v = s * s, a = rnz(r, -4, 4), b = rnz(r, -10, 10), type = r(0, 2);
        const Y = `${coefVar(a, "X")}${signed(b)}`;
        const [what, ans, how] = [
          [`E(${Y})`, a * m + b, `${a}\\cdot ${par(m)}${signed(b)}`],
          [`V(${Y})`, a * a * v, `${par(a)}^{2}\\cdot ${v}`],
          [`\\sigma(${Y})`, Math.abs(a) * s, `|${a}|\\cdot\\sqrt{${v}}`],
        ][type];
        return {
          q: `確率変数 $X$ の期待値が $${m}$，分散が $${v}$ であるとき，$${what}$ を求めよ。`,
          ans,
          hint: "$E(aX+b)=aE(X)+b$，$V(aX+b)=a^{2}V(X)$，$\\sigma(aX+b)=|a|\\sigma(X)$。",
          steps: [`$${what}=${how}=${ans}$`],
        };
      }),
      t("HB-toukei-1c", (r) => {
        const [pn, pd] = pick(r, PFR), n = r(2, 20) * pd, askE = r(0, 1) === 1;
        const E = fracAns(n * pn, pd), V = fracAns(n * pn * (pd - pn), pd * pd);
        return {
          q: `確率変数 $X$ が二項分布 $B\\left(${n},\\ ${fracTex(pn, pd)}\\right)$ に従うとき，${askE ? "期待値 $E(X)$" : "分散 $V(X)$"} を求めよ。`,
          ans: askE ? E : V,
          hint: "二項分布 $B(n,\\ p)$ では $E(X)=np$，$V(X)=np(1-p)$。",
          steps: askE
            ? [`$E(X)=${n}\\times ${fracTex(pn, pd)}=${fracTex(n * pn, pd)}$`]
            : [`$V(X)=${n}\\times ${fracTex(pn, pd)}\\times ${fracTex(pd - pn, pd)}=${fracTex(n * pn * (pd - pn), pd * pd)}$`],
        };
      }),
    ],
    2: [
      t("HB-toukei-2a", (r) => {
        const d = distr(r);
        const num = d.D * d.s2 - d.s1 * d.s1, den = d.D * d.D;
        return {
          q: `確率変数 $X$ のとる値と確率が ${d.list} であるとき，分散 $V(X)$ を求めよ。`,
          ans: fracAns(num, den),
          hint: "$V(X)=E(X^{2})-\\{E(X)\\}^{2}$ を使うと計算が楽。",
          steps: [
            `$E(X)=${fracTex(d.s1, d.D)}$，$E(X^{2})=${d.xs.map((x, i) => `${par(x)}^{2}\\cdot ${fracTex(d.ps[i], d.D)}`).join("+")}=${fracTex(d.s2, d.D)}$`,
            `$V(X)=${fracTex(d.s2, d.D)}-\\left(${fracTex(d.s1, d.D)}\\right)^{2}=${fracTex(num, den)}$`,
          ],
        };
      }),
      t("HB-toukei-2b", (r) => {
        const m = r(40, 80), s = r(2, 10), type = r(0, 4), k = r(1, 2);
        const T = [0, T1, T2];
        let ev, ans, how;
        if (type === 0) { ev = `X\\geqq ${m + k * s}`; ans = 0.5 - T[k]; how = `P(Z\\geqq ${k})=0.5-${T[k]}`; }
        else if (type === 1) { ev = `X\\leqq ${m - k * s}`; ans = 0.5 - T[k]; how = `P(Z\\leqq -${k})=0.5-${T[k]}`; }
        else if (type === 2) { const k2 = 3 - k; ev = `${m - k * s}\\leqq X\\leqq ${m + k2 * s}`; ans = T[k] + T[k2]; how = `P(-${k}\\leqq Z\\leqq ${k2})=${T[k]}+${T[k2]}`; }
        else if (type === 3) { ev = `${m + s}\\leqq X\\leqq ${m + 2 * s}`; ans = T2 - T1; how = `P(1\\leqq Z\\leqq 2)=${T2}-${T1}`; }
        else { ev = `X\\leqq ${m + k * s}`; ans = 0.5 + T[k]; how = `P(Z\\leqq ${k})=0.5+${T[k]}`; }
        ans = round(ans, 4);
        return {
          q: `確率変数 $X$ が正規分布 $N(${m},\\ ${s}^{2})$ に従うとき，$P(${ev})$ を求めよ。${TAB}`,
          ans,
          hint: "$Z=\\frac{X-m}{\\sigma}$ で標準化し，$Z=0$ について左右対称であることを使う。",
          steps: [
            `$Z=\\frac{X-${m}}{${s}}$ とおくと $Z$ は $N(0,\\ 1)$ に従う`,
            `$P(${ev})=${how}=${dec(ans)}$`,
          ],
        };
      }),
      t("HB-toukei-2c", (r) => {
        const EX = r(-3, 6), VX = r(1, 9), EY = r(-3, 6), VY = r(1, 9), a = rnz(r, -3, 3), b = rnz(r, -3, 3), type = r(0, 2);
        const Z = `${coefVar(a, "X")}${signedVar(b, "Y")}`;
        const [what, ans, how] = [
          [`V(${Z})`, a * a * VX + b * b * VY, `${par(a)}^{2}\\cdot ${VX}+${par(b)}^{2}\\cdot ${VY}`],
          [`E(${Z})`, a * EX + b * EY, `${a}\\cdot ${par(EX)}${signed(b)}\\cdot ${par(EY)}`],
          ["E(XY)", EX * EY, `${par(EX)}\\cdot ${par(EY)}`],
        ][type];
        return {
          q: `互いに独立な確率変数 $X,\\ Y$ について，$E(X)=${EX}$，$V(X)=${VX}$，$E(Y)=${EY}$，$V(Y)=${VY}$ である。$${what}$ を求めよ。`,
          ans,
          hint: "独立なとき $V(aX+bY)=a^{2}V(X)+b^{2}V(Y)$（係数は2乗するので必ずたし算），$E(XY)=E(X)E(Y)$。",
          steps: [`$${what}=${how}=${ans}$`],
        };
      }),
    ],
    3: [
      t("HB-toukei-3a", (r) => {
        const [story, n, pn, pd, m, s] = pick(r, BINOM);
        const type = r(0, 2), k = r(1, 2), T = [0, T1, T2];
        let ev, ans, how;
        if (type === 0) { ev = `X\\geqq ${m + k * s}`; ans = 0.5 - T[k]; how = `P(Z\\geqq ${k})=0.5-${T[k]}`; }
        else if (type === 1) { ev = `X\\leqq ${m - k * s}`; ans = 0.5 - T[k]; how = `P(Z\\leqq -${k})=0.5-${T[k]}`; }
        else { ev = `${m - k * s}\\leqq X\\leqq ${m + k * s}`; ans = 2 * T[k]; how = `P(-${k}\\leqq Z\\leqq ${k})=2\\times ${T[k]}`; }
        ans = round(ans, 4);
        return {
          q: `${story.replace("{n}", `$${n}$`)}を $X$ とする。$P(${ev})$ の近似値を，正規分布で近似して求めよ。${TAB}`,
          ans,
          hint: "$X$ は二項分布 $B(n,\\ p)$ に従う。$m=np$，$\\sigma=\\sqrt{np(1-p)}$ を求めて標準化する。",
          steps: [
            `$X$ は $B\\left(${n},\\ ${fracTex(pn, pd)}\\right)$ に従い，$m=${m}$，$\\sigma=\\sqrt{${s * s}}=${s}$`,
            `$Z=\\frac{X-${m}}{${s}}$ は近似的に $N(0,\\ 1)$ に従う`,
            `$P(${ev})=${how}=${dec(ans)}$`,
          ],
        };
      }),
      t("HB-toukei-3b", (r) => {
        const e = pick(r, [0.5, 1, 1.5, 2, 2.5]), rn = pick(r, [6, 8, 10, 12, 20]), n = rn * rn;
        const sig = round(e * rn, 2), xb = r(50, 200);
        const I = (w) => tex(`${dec(xb - w, 2)}\\leqq m\\leqq ${dec(xb + w, 2)}`);
        const w = round(1.96 * e, 4);
        const ans = I(w);
        return {
          q: `母標準偏差が $${sig}$ の母集団から，大きさ $${n}$ の標本を無作為に抽出したところ，標本平均は $${xb}$ であった。母平均 $m$ に対する信頼度95%の信頼区間を求めよ。`,
          ans,
          choices: choices4(r, ans, [I(round(1.96 * sig, 4)), I(round((1.96 * sig) / n, 4)), I(round(2.58 * e, 4))],
            (i) => I(round(w + 0.5 * (i + 1), 4))),
          hint: "信頼区間は $\\overline{X}\\pm 1.96\\cdot\\frac{\\sigma}{\\sqrt{n}}$。$\\sqrt{n}$ で割るのを忘れない。",
          steps: [
            `$\\frac{\\sigma}{\\sqrt{n}}=\\frac{${sig}}{\\sqrt{${n}}}=\\frac{${sig}}{${rn}}=${dec(e)}$`,
            `$1.96\\times ${dec(e)}=${dec(w)}$`,
            `答え：${ans}`,
          ],
        };
      }),
      t("HB-toukei-3c", (r) => {
        const [pn, pd, story] = pick(r, [[1, 2, "1枚の硬貨を投げて表が出たら"], [1, 6, "1個のさいころを投げて1の目が出たら"], [1, 3, "1個のさいころを投げて3の倍数の目が出たら"]]);
        const n = r(2, 10) * pd * 2, a = r(2, 9), b = r(1, 5), askE = r(0, 1) === 1;
        const EX = [n * pn, pd], VX = [n * pn * (pd - pn), pd * pd];
        const ansE = fracAns((a + b) * EX[0] - b * n * EX[1], EX[1]);
        const ansV = fracAns((a + b) ** 2 * VX[0], VX[1]);
        return {
          q: `${story} $${a}$ 点，出なかったら $${-b}$ 点とするゲームを $${n}$ 回行う。得点の合計 $Y$ の${askE ? "期待値 $E(Y)$" : "分散 $V(Y)$"} を求めよ。`,
          ans: askE ? ansE : ansV,
          hint: "成功の回数を $X$ とすると $Y=aX-b(n-X)$ と表せる。$X$ は二項分布に従う。",
          steps: [
            `成功の回数を $X$ とすると $Y=${a}X-${b === 1 ? "" : b}(${n}-X)=${a + b}X-${b * n}$`,
            `$X$ は $B\\left(${n},\\ ${fracTex(pn, pd)}\\right)$ に従い，$E(X)=${fracTex(...EX)}$，$V(X)=${fracTex(...VX)}$`,
            askE
              ? `$E(Y)=${a + b}E(X)-${b * n}=${fracTex((a + b) * EX[0] - b * n * EX[1], EX[1])}$`
              : `$V(Y)=${a + b}^{2}V(X)=${fracTex((a + b) ** 2 * VX[0], VX[1])}$`,
          ],
        };
      }),
    ],
    4: [
      t("HB-toukei-4a", (r) => {
        const sig = r(2, 20), W = r(1, 6);
        if (3.92 * sig <= W) return { skip: true };
        const num = (392 * sig) ** 2, den = (100 * W) ** 2;
        const nmin = Math.floor((num + den - 1) / den);
        return {
          q: `母標準偏差が $${sig}$ の母集団から標本を抽出して，母平均を信頼度95%で推定する。信頼区間の幅を $${W}$ 以下にするには，標本の大きさ $n$ を少なくともいくつにすればよいか。`,
          ans: nmin,
          hint: "信頼区間の幅は $2\\times 1.96\\cdot\\frac{\\sigma}{\\sqrt{n}}$。これが指定の値以下となる $n$ を求める。",
          steps: [
            `幅は $2\\times 1.96\\times\\frac{${sig}}{\\sqrt{n}}=\\frac{${round(3.92 * sig, 2)}}{\\sqrt{n}}$`,
            `$\\frac{${round(3.92 * sig, 2)}}{\\sqrt{n}}\\leqq ${W}$ より $\\sqrt{n}\\geqq ${round((3.92 * sig) / W, 4)}$，$n\\geqq ${round(num / den, 4)}$`,
            `答え：$n=${nmin}$`,
          ],
        };
      }),
      t("HB-toukei-4b", (r) => {
        const [story, n, pn, pd, m, s] = pick(r, BINOM.filter((b) => b[5] !== 15));
        let d = r(Math.ceil(0.5 * s), 3 * s) * (r(0, 1) ? 1 : -1);
        const z = round(d / s, 4);
        if (Math.abs(Math.abs(z) - 1.96) < 0.1) return { skip: true };
        const X = m + d, rej = Math.abs(z) >= 1.96;
        const C = (zz, rj) => `$z=${dec(zz)}$ で，帰無仮説を${rj ? "棄却する（偏りがあるといえる）" : "棄却しない（偏りがあるとはいえない）"}`;
        const z2 = round(d / (s * s), 4);
        const ans = C(z, rej);
        return {
          q: `${story.replace("{n}", `$${n}$`)}を調べたところ $${X}$ 回であった。確率が $${fracTex(pn, pd)}$ であるという帰無仮説を，有意水準5%で両側検定する。検定統計量 $z=\\frac{X-m}{\\sigma}$ の値と結論の組として正しいものを選べ。ただし，正規分布で近似し，$P(|Z|\\geqq 1.96)=0.05$ とする。`,
          ans,
          choices: choices4(r, ans, [C(z, !rej), C(z2, Math.abs(z2) >= 1.96), C(z2, !(Math.abs(z2) >= 1.96))],
            (i) => C(round(z + 0.5 * (i + 1), 4), r(0, 1) === 1)),
          hint: "帰無仮説のもとで $X$ は $B(n,\\ p)$ に従う。$m=np$，$\\sigma=\\sqrt{np(1-p)}$ で標準化し，$|z|$ と $1.96$ を比べる。",
          steps: [
            `帰無仮説のもとで $m=${m}$，$\\sigma=${s}$`,
            `$z=\\frac{${X}-${m}}{${s}}=${dec(z)}$`,
            `$|z|${rej ? "\\geqq" : "<"}1.96$ なので，${rej ? "帰無仮説を棄却する" : "帰無仮説は棄却されない"}`,
          ],
        };
      }),
      t("HB-toukei-4c", (r) => {
        const [ph, sq] = pick(r, [[0.1, 0.3], [0.2, 0.4], [0.5, 0.5], [0.8, 0.4], [0.9, 0.3]]);
        const rn = pick(r, [10, 20, 30, 40, 50]), n = rn * rn, k = round(ph * n, 0);
        const se = round(sq / rn, 6), w = round(1.96 * se, 4);
        const I = (ww) => tex(`${dec(ph - ww)}\\leqq p\\leqq ${dec(ph + ww)}`);
        const ans = I(w);
        return {
          q: `ある意見について，無作為に選んだ $${n}$ 人にたずねたところ，$${k}$ 人が賛成した。賛成する人の母比率 $p$ に対する信頼度95%の信頼区間を求めよ。`,
          ans,
          choices: choices4(r, ans, [I(round(2.58 * se, 4)), I(round((1.96 * sq) / n, 4)), I(round((1.96 * sq * sq) / rn, 4))],
            (i) => I(round(w + 0.01 * (i + 1), 4))),
          hint: "標本比率を $\\hat{p}$ とすると，信頼区間は $\\hat{p}\\pm 1.96\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}$。",
          steps: [
            `$\\hat{p}=\\frac{${k}}{${n}}=${ph}$`,
            `$\\sqrt{\\frac{${ph}\\times ${round(1 - ph, 2)}}{${n}}}=\\frac{${sq}}{${rn}}=${dec(se, 6)}$，$1.96\\times ${dec(se, 6)}=${dec(w)}$`,
            `答え：${ans}`,
          ],
        };
      }),
    ],
  },
};

export const UNITS = [SURETSU, SIGMA, ZENKA, TOUKEI];
