// ============================================================
// hII.js — 高校 数学II の単元（数学ラボ ソロ）
//   式と証明 / 複素数と2次方程式 / 高次方程式 / 図形と方程式 /
//   三角関数 / 指数関数 / 対数関数 / 微分 / 積分
// 書き方は docs/solo-問題データの書き方.md
// ============================================================
import {
  t, pick, rnz, shuffle, sample, gcd, lcm, round, reduce, fracAns, fracTex,
  sqrtSimp, sqrtTex, poly, signed, coefVar, signedVar, choices4, numChoices, tex,
} from "../kit.js";

const COURSE = { course: "数学II", rikei: false };

// ── 小さな道具 ─────────────────────────────────────────
/** 負なら括弧 */
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
/** x の累乗 "x" "x^{3}" */
const xp = (k, v = "x") => (k === 1 ? v : `${v}^{${k}}`);
/** 二項係数 */
function nCr(n, k) {
  if (k < 0 || k > n) return 0;
  let v = 1;
  for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i;
  return Math.round(v);
}
/** 組合せの記号 */
const Cn = (n, k) => `{}_{${n}}\\mathrm{C}_{${k}}`;
/** 因数 (x-a)。a=0 なら x */
const fx = (a, v = "x") => (a === 0 ? v : `(${poly([1, -a], v)})`);
/** 2つの因数の積（0 の因数を先に） */
const fx2 = (a, b, v = "x") => (b === 0 && a !== 0 ? fx(b, v) + fx(a, v) : fx(a, v) + fx(b, v));
/** b^e mod m */
function modpow(b, e, m) {
  let res = 1;
  b = ((b % m) + m) % m;
  for (let i = 0; i < e; i++) res = (res * b) % m;
  return res;
}
/** 複素数 a+bi の TeX */
function cx(a, b) {
  if (b === 0) return String(a);
  const im = b === 1 ? "i" : b === -1 ? "-i" : `${b}i`;
  if (a === 0) return im;
  return `${a}${b > 0 ? "+" : ""}${im}`;
}
/** 直線 ax+by+c=0 の TeX（約分・先頭を正に） */
function lineTex(a, b, c) {
  const g = gcd(gcd(a, b), c);
  a /= g; b /= g; c /= g;
  if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; c = -c; }
  let s = a === 0 ? "" : coefVar(a, "x");
  if (b !== 0) s += s ? signedVar(b, "y") : coefVar(b, "y");
  if (c !== 0) s += signed(c);
  return `${s}=0`;
}
/** 分数式（分子が数） */
const fe = (num, den) => (num < 0 ? `-\\frac{${-num}}{${den}}` : `\\frac{${num}}{${den}}`);
/** 小さい順に並べた値のリスト "a=1,\ 3" */
const listTex = (name, vals) => `${name}=${[...vals].sort((x, y) => x - y).join(",\\ ")}`;

// ============================================================
// 式と証明
// ============================================================
const SHIKI = {
  id: "HII-shiki", grade: "H2", area: "num", name: "式と証明",
  desc: "二項定理・分数式・恒等式・相加相乗平均",
  prereqs: ["HI-tenkai", "HA-baai"],
  ...COURSE,
  points: [
    "二項定理：$(a+b)^{n}$ の一般項は ${}_{n}\\mathrm{C}_{r}\\,a^{n-r}b^{r}$。特定の項の係数は、指数を比べて $r$ を決める。",
    "恒等式は「両辺の係数を比べる」か「都合のよい値を代入する」で係数を決める。分数式は因数分解してから約分・通分する。",
    "相加平均と相乗平均：$a>0,\\ b>0$ のとき $a+b\\geqq 2\\sqrt{ab}$（等号は $a=b$）。積が一定のとき和の最小値がわかる。",
  ],
  levels: {
    1: [
      t("HII-shiki-1a", (r) => {
        const n = r(4, 6), b = rnz(r, -3, 3), k = r(1, n - 1), j = n - k;
        const ans = nCr(n, j) * b ** j;
        return {
          q: `$(x${signed(b)})^{${n}}$ を展開したとき，$${xp(k)}$ の係数を求めよ。`,
          ans,
          hint: `一般項は $${Cn(n, "r")}\\,x^{${n}-r}\\cdot ${par(b)}^{r}$。$x$ の指数が ${k} になる $r$ を探そう。`,
          steps: [
            `$x$ の指数が ${k} になるのは $r=${j}$ のとき`,
            `係数は $${Cn(n, j)}\\times ${par(b)}^{${j}}=${nCr(n, j)}\\times ${par(b ** j)}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
      t("HII-shiki-1b", (r) => {
        const a = rnz(r, -5, 5);
        let b = rnz(r, -5, 5);
        if (b === a) b = -a;
        const m = r(1, 3), p = a + b, q = m * (a - b);
        const askA = r(0, 1) === 1;
        const ans = askA ? a : b;
        return {
          q: `等式 $a(x+${m})+b(x-${m})=${poly([p, q])}$ が $x$ についての恒等式となるように，定数 $a,\\ b$ を定める。$${askA ? "a" : "b"}$ の値を求めよ。`,
          ans,
          hint: "左辺を $x$ について整理して，両辺の係数を比べる。",
          steps: [
            `左辺 $=(a+b)x+${m === 1 ? "" : m}(a-b)$`,
            `係数を比べて $a+b=${p}$，$a-b=${a - b}$`,
            `これを解いて $a=${a}$，$b=${b}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
      t("HII-shiki-1c", (r) => {
        const a = r(1, 4), m = r(1, 5), b = a * m * m;
        const ans = 2 * a * m, ax = coefVar(a);
        return {
          q: `$x>0$ のとき，$${ax}+\\frac{${b}}{x}$ の最小値を求めよ。`,
          ans,
          hint: "2つの正の数の和には，相加平均と相乗平均の関係 $A+B\\geqq 2\\sqrt{AB}$ が使える。",
          steps: [
            `$${ax}>0$，$\\frac{${b}}{x}>0$ だから $${ax}+\\frac{${b}}{x}\\geqq 2\\sqrt{${ax}\\cdot\\frac{${b}}{x}}=2\\sqrt{${a * b}}=${ans}$`,
            `等号は $${ax}=\\frac{${b}}{x}$ すなわち $x=${m}$ のとき成り立つ`,
            `答え：最小値 $${ans}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-shiki-2a", (r) => {
        const n = r(4, 6), a = pick(r, [2, 3, -2]), b = rnz(r, -3, 3), k = r(2, n - 1), j = n - k;
        const c = nCr(n, j);
        const ans = c * a ** k * b ** j;
        return {
          q: `$(${poly([a, b])})^{${n}}$ を展開したとき，$${xp(k)}$ の係数を求めよ。`,
          ans,
          choices: numChoices(r, ans, [c * b ** j, c * a * b ** j, c * a ** k]),
          hint: `一般項は $${Cn(n, "r")}(${coefVar(a)})^{${n}-r}\\cdot ${par(b)}^{r}$。$x$ の係数 ${a} も累乗されることに注意。`,
          steps: [
            `$x^{${k}}$ の項は $r=${j}$ のとき：$${Cn(n, j)}(${coefVar(a)})^{${k}}\\cdot ${par(b)}^{${j}}$`,
            `係数は $${c}\\times ${par(a ** k)}\\times ${par(b ** j)}=${ans}$`,
          ],
        };
      }),
      t("HII-shiki-2b", (r) => {
        const a = rnz(r, -5, 5);
        let b = rnz(r, -5, 5);
        if (b === a) b = -a;
        const D = `(${poly([1, -a])})(${poly([1, -b])})`;
        const ans = tex(fe(a - b, D));
        return {
          q: `$\\frac{1}{${poly([1, -a])}}-\\frac{1}{${poly([1, -b])}}$ を計算せよ。`,
          ans,
          choices: choices4(r, ans, [
            tex(fe(b - a, D)),
            tex(`\\frac{${poly([2, -(a + b)])}}{${D}}`),
            tex(fracTex(1, b - a)),
          ], (i) => tex(fe(a - b + i + 1, D))),
          hint: "分母を $(x-\\square)(x-\\triangle)$ にそろえて通分する。分子の引き算の符号に注意。",
          steps: [
            `通分すると $\\frac{(${poly([1, -b])})-(${poly([1, -a])})}{${D}}$`,
            `分子 $=${a - b}$`,
            `答え：$${fe(a - b, D)}$`,
          ],
        };
      }),
      t("HII-shiki-2c", (r) => {
        const a = r(-4, 4);
        let b = r(-4, 4);
        if (b === a) b = a + r(1, 3);
        const c = rnz(r, -6, 6);
        const askA = r(0, 1) === 1;
        const ans = askA ? fracAns(c, a - b) : fracAns(c, b - a);
        const den = fx2(a, b);
        return {
          q: `等式 $\\frac{${c}}{${den}}=\\frac{A}{${poly([1, -a])}}+\\frac{B}{${poly([1, -b])}}$ が $x$ についての恒等式となるように定数 $A,\\ B$ を定めるとき，$${askA ? "A" : "B"}$ の値を求めよ。`,
          ans,
          hint: "両辺に分母をかけて分母を払い，$x$ に都合のよい値を代入する。",
          steps: [
            `両辺に $${den}$ をかけて $${c}=A${fx(b)}+B${fx(a)}$`,
            `$x=${a}$ を代入すると $${c}=${a - b}A$，$x=${b}$ を代入すると $${c}=${b - a}B$`,
            `よって $A=${fracTex(c, a - b)}$，$B=${fracTex(c, b - a)}$`,
          ],
        };
      }),
    ],
    3: [
      t("HII-shiki-3a", (r) => {
        const [pp, qq] = pick(r, [[2, 1], [1, 2]]);
        const n = r(5, 7), a = pick(r, [1, 2, -1, -2]), k = r(1, n - 1);
        const e = pp * (n - k) - qq * k;
        const ans = nCr(n, k) * a ** k;
        const base = `${xp(pp)}${a < 0 ? "-" : "+"}\\frac{${Math.abs(a)}}{${xp(qq)}}`;
        const target = e === 0 ? "定数項" : e > 0 ? `$${xp(e)}$ の係数` : `$\\frac{1}{${xp(-e)}}$ の係数`;
        const first = pp === 1 ? `x^{${n}-r}` : `(x^{2})^{${n}-r}`;
        return {
          q: `$\\left(${base}\\right)^{${n}}$ の展開式における${target}を求めよ。`,
          ans,
          hint: "一般項を $x$ の累乗にまとめ，$x$ の指数が目的の値になる $r$ を求める。",
          steps: [
            `一般項は $${Cn(n, "r")}\\,${first}\\left(${a < 0 ? "-" : ""}\\frac{${Math.abs(a)}}{${xp(qq)}}\\right)^{r}=${Cn(n, "r")}\\cdot ${par(a)}^{r}\\,x^{${pp * n}-${pp + qq}r}$`,
            `指数 $${pp * n}-${pp + qq}r=${e}$ より $r=${k}$`,
            `求める値は $${Cn(n, k)}\\cdot ${par(a)}^{${k}}=${nCr(n, k)}\\times ${par(a ** k)}=${ans}$`,
          ],
        };
      }),
      t("HII-shiki-3b", (r) => {
        const p = r(1, 5), qv = r(1, 5), c = r(2, 12);
        const ans = fracAns(c * c, 4 * p * qv);
        const pq = p * qv;
        return {
          q: `$x>0,\\ y>0$ で $${coefVar(p)}+${coefVar(qv, "y")}=${c}$ のとき，$xy$ の最大値を求めよ。`,
          ans,
          hint: `$${coefVar(p)}$ と $${coefVar(qv, "y")}$ に相加平均・相乗平均の関係を使う。`,
          steps: [
            `$${c}=${coefVar(p)}+${coefVar(qv, "y")}\\geqq 2\\sqrt{${pq === 1 ? "" : pq}xy}$`,
            `両辺を2乗して $${c * c}\\geqq ${4 * pq}xy$ より $xy\\leqq ${fracTex(c * c, 4 * pq)}$`,
            `等号は $${coefVar(p)}=${coefVar(qv, "y")}=${fracTex(c, 2)}$ のとき成り立つ`,
            `答え：最大値 $${fracTex(c * c, 4 * pq)}$`,
          ],
        };
      }),
      t("HII-shiki-3c", (r) => {
        const c = r(1, 4), e = pick(r, [1, -1]), base = 10 * c + e, n = r(10, 60);
        const ans = modpow(base, n, 100);
        const lin = e ** n + 10 * c * n * e ** (n - 1);
        return {
          q: `$${base}^{${n}}$ を $100$ で割った余りを求めよ。`,
          ans,
          hint: `$${base}=${10 * c}${signed(e)}$ と見て二項定理で展開する。`,
          steps: [
            `$${base}^{${n}}=(${10 * c}${signed(e)})^{${n}}$ を展開すると，$${10 * c}^{2}$ 以上をふくむ項はすべて $100$ の倍数`,
            `残るのは $${par(e)}^{${n}}+${Cn(n, 1)}\\cdot ${10 * c}\\cdot ${par(e)}^{${n - 1}}=${lin}$`,
            `$${lin}$ を $100$ で割った余りは $${ans}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-shiki-4a", (r) => {
        const a = pick(r, [1, 1, 2, 3]);
        const n = a === 1 ? r(5, 10) : a === 2 ? r(4, 7) : r(4, 5);
        const ans = n * a * (1 + a) ** (n - 1);
        const term = a === 1 ? `k\\,${Cn(n, "k")}` : `k\\,${Cn(n, "k")}\\cdot ${a}^{k}`;
        const na = a === 1 ? `${n}` : `${n}\\cdot ${a}`;
        return {
          q: `$\\sum_{k=1}^{${n}} ${term}$ の値を求めよ。`,
          ans,
          hint: `$k\\,${Cn(n, "k")}$ を $${Cn(n - 1, "k-1")}$ を使って書きかえると，二項定理の形になる。`,
          steps: [
            `$k\\,${Cn(n, "k")}=k\\cdot\\frac{${n}!}{k!\\,(${n}-k)!}=${n}\\,${Cn(n - 1, "k-1")}$`,
            `与式 $=${na}\\sum_{k=1}^{${n}}${Cn(n - 1, "k-1")}${a === 1 ? "" : `\\cdot ${a}^{k-1}`}=${na}\\cdot(1+${a})^{${n - 1}}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
      t("HII-shiki-4b", (r) => {
        const s = r(1, 4);
        let u = r(1, 4);
        if (u === s) u = s === 4 ? 1 : s + 1;
        const A = s * s, B = u * u, ans = (s + u) ** 2;
        return {
          q: `$x>0,\\ y>0$ で $\\frac{${A}}{x}+\\frac{${B}}{y}=1$ のとき，$x+y$ の最小値を求めよ。`,
          ans,
          choices: numChoices(r, ans, [4 * s * u, A + B, 2 * (s + u)]),
          hint: `$x+y=(x+y)\\left(\\frac{${A}}{x}+\\frac{${B}}{y}\\right)$ と見て展開してから，相加・相乗平均を使う。`,
          steps: [
            `$x+y=(x+y)\\left(\\frac{${A}}{x}+\\frac{${B}}{y}\\right)=${A + B}+\\frac{${A}y}{x}+\\frac{${B}x}{y}$`,
            `$\\frac{${A}y}{x}+\\frac{${B}x}{y}\\geqq 2\\sqrt{${A * B}}=${2 * s * u}$ より $x+y\\geqq ${ans}$`,
            `等号は $x=${s * (s + u)},\\ y=${u * (s + u)}$ のとき成り立つ（条件式に直接2回使うと等号が同時に成り立たず誤り）`,
            `答え：最小値 $${ans}$`,
          ],
        };
      }),
    ],
  },
};
