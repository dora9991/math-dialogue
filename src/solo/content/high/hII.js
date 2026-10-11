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
    "二項定理：$(a+b)^{n}$ の一般項は ${}_{n}\\mathrm{C}_{r}\\,a^{n-r}b^{r}$。特定の項の係数は，指数を比べて $r$ を決める。",
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
            `$x=${a}$ を代入すると $${c}=${coefVar(a - b, "A")}$，$x=${b}$ を代入すると $${c}=${coefVar(b - a, "B")}$`,
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
            `$x+y=(x+y)\\left(\\frac{${A}}{x}+\\frac{${B}}{y}\\right)=${A + B}+\\frac{${coefVar(A, "y")}}{x}+\\frac{${coefVar(B)}}{y}$`,
            `$\\frac{${coefVar(A, "y")}}{x}+\\frac{${coefVar(B)}}{y}\\geqq 2\\sqrt{${A * B}}=${2 * s * u}$ より $x+y\\geqq ${ans}$`,
            `等号は $x=${s * (s + u)},\\ y=${u * (s + u)}$ のとき成り立つ（条件式に直接2回使うと等号が同時に成り立たず誤り）`,
            `答え：最小値 $${ans}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 複素数と2次方程式
// ============================================================
const FUKUSO = {
  id: "HII-fukuso", grade: "H2", area: "num", name: "複素数と2次方程式",
  desc: "虚数・判別式・解と係数の関係",
  prereqs: ["HI-nijifuto"],
  ...COURSE,
  points: [
    "$i^{2}=-1$。複素数の計算は $i$ を文字のように扱い，$i^{2}$ を $-1$ にかえる。割り算は分母の共役複素数を分母・分子にかける。",
    "$ax^{2}+bx+c=0$ の判別式 $D=b^{2}-4ac$：$D>0$ で異なる2つの実数解，$D=0$ で重解，$D<0$ で異なる2つの虚数解。",
    "解と係数の関係：$\\alpha+\\beta=-\\frac{b}{a},\\ \\alpha\\beta=\\frac{c}{a}$。対称式は和と積で表す（例 $\\alpha^{2}+\\beta^{2}=(\\alpha+\\beta)^{2}-2\\alpha\\beta$）。",
  ],
  levels: {
    1: [
      t("HII-fukuso-1a", (r) => {
        const a = rnz(r, -4, 4), b = rnz(r, -4, 4), c = rnz(r, -4, 4), d = rnz(r, -4, 4);
        const re = a * c - b * d, im = a * d + b * c;
        const ans = tex(cx(re, im));
        return {
          q: `$(${cx(a, b)})(${cx(c, d)})$ を計算せよ。`,
          ans,
          choices: choices4(r, ans, [tex(cx(a * c + b * d, im)), tex(cx(re, a * d - b * c)), tex(cx(a * c, b * d))],
            () => tex(cx(re + r(-3, 3), im + r(-3, 3)))),
          hint: "$i$ を文字のように展開し，$i^{2}$ を $-1$ に置きかえる。",
          steps: [
            `展開すると $${a * c}+(${a * d}${signed(b * c)})i${signed(b * d)}i^{2}$`,
            `$i^{2}=-1$ より $${a * c}${signed(-b * d)}+(${a * d}${signed(b * c)})i$`,
            `答え：$${cx(re, im)}$`,
          ],
        };
      }),
      t("HII-fukuso-1b", (r) => {
        const a = pick(r, [1, 2]), kind = r(0, 2);
        let b, c;
        if (kind === 1) {
          const m = rnz(r, -3, 3);
          b = a === 1 ? 2 * m : 4 * m;
          c = a === 1 ? m * m : 2 * m * m;
        } else {
          b = r(-6, 6);
          c = kind === 0 ? Math.floor((b * b - 1) / (4 * a)) - r(0, 4) : Math.floor((b * b) / (4 * a)) + r(1, 4);
        }
        const D = b * b - 4 * a * c;
        const ans = D > 0 ? "異なる2つの実数解" : D === 0 ? "重解" : "異なる2つの虚数解";
        return {
          q: `2次方程式 $${poly([a, b, c])}=0$ の解の種類を答えよ。`,
          ans,
          choices: ["異なる2つの実数解", "重解", "異なる2つの虚数解"],
          hint: "判別式 $D=b^{2}-4ac$ の符号を調べる。",
          steps: [
            `$D=${par(b)}^{2}-4\\cdot ${a}\\cdot ${par(c)}=${D}$`,
            `$D${D > 0 ? ">" : D === 0 ? "=" : "<"}0$ より，${ans}`,
          ],
        };
      }),
      t("HII-fukuso-1c", (r) => {
        const a = r(1, 4), b = rnz(r, -9, 9), c = rnz(r, -9, 9);
        const askSum = r(0, 1) === 1;
        const ans = askSum ? fracAns(-b, a) : fracAns(c, a);
        return {
          q: `2次方程式 $${poly([a, b, c])}=0$ の2つの解を $\\alpha,\\ \\beta$ とするとき，$${askSum ? "\\alpha+\\beta" : "\\alpha\\beta"}$ の値を求めよ。`,
          ans,
          hint: "解と係数の関係 $\\alpha+\\beta=-\\frac{b}{a}$，$\\alpha\\beta=\\frac{c}{a}$ を使う。",
          steps: askSum
            ? [`$\\alpha+\\beta=-\\frac{${b}}{${a}}${fracTex(-b, a) === `-\\frac{${b}}{${a}}` ? "" : `=${fracTex(-b, a)}`}$`]
            : [`$\\alpha\\beta=\\frac{${c}}{${a}}${fracTex(c, a) === `\\frac{${c}}{${a}}` ? "" : `=${fracTex(c, a)}`}$`],
        };
      }),
    ],
    2: [
      t("HII-fukuso-2a", (r) => {
        const a = r(1, 3), b = rnz(r, -7, 7), c = rnz(r, -7, 7), type = r(0, 2);
        const s = fracTex(-b, a), p = fracTex(c, a);
        const T = [
          ["\\alpha^{2}+\\beta^{2}", fracAns(b * b - 2 * a * c, a * a), `(\\alpha+\\beta)^{2}-2\\alpha\\beta=\\left(${s}\\right)^{2}-2\\cdot\\left(${p}\\right)`, fracTex(b * b - 2 * a * c, a * a)],
          ["(\\alpha-\\beta)^{2}", fracAns(b * b - 4 * a * c, a * a), `(\\alpha+\\beta)^{2}-4\\alpha\\beta=\\left(${s}\\right)^{2}-4\\cdot\\left(${p}\\right)`, fracTex(b * b - 4 * a * c, a * a)],
          ["\\alpha^{2}\\beta+\\alpha\\beta^{2}", fracAns(-b * c, a * a), `\\alpha\\beta(\\alpha+\\beta)=\\left(${p}\\right)\\cdot\\left(${s}\\right)`, fracTex(-b * c, a * a)],
        ][type];
        return {
          q: `2次方程式 $${poly([a, b, c])}=0$ の2つの解を $\\alpha,\\ \\beta$ とするとき，$${T[0]}$ の値を求めよ。`,
          ans: T[1],
          hint: "まず $\\alpha+\\beta$ と $\\alpha\\beta$ を求め，求める式を和と積で表す。",
          steps: [
            `$\\alpha+\\beta=${s}$，$\\alpha\\beta=${p}$`,
            `$${T[0]}=${T[2]}$`,
            `答え：$${T[3]}$`,
          ],
        };
      }),
      t("HII-fukuso-2b", (r) => {
        const p = r(-3, 3), q = rnz(r, -3, 3), c = r(-3, 3), d = rnz(r, -3, 3);
        const n1 = p * c - q * d, n2 = p * d + q * c, N = c * c + d * d;
        const ans = tex(cx(p, q));
        return {
          q: `$\\frac{${cx(n1, n2)}}{${cx(c, d)}}$ を計算せよ。`,
          ans,
          choices: choices4(r, ans, [tex(cx(p, -q)), tex(cx(-p, q)), tex(cx(q, p))],
            () => tex(cx(p + r(-2, 2), q + rnz(r, -2, 2)))),
          hint: "分母の共役複素数を分母と分子にかけて，分母を実数にする。",
          steps: [
            `分母・分子に $${cx(c, -d)}$ をかける`,
            `分母は $(${cx(c, d)})(${cx(c, -d)})=${N}$`,
            `分子は $(${cx(n1, n2)})(${cx(c, -d)})=${cx(p * N, q * N)}$`,
            `答え：$${cx(p, q)}$`,
          ],
        };
      }),
      t("HII-fukuso-2c", (r) => {
        const p = r(-4, 3), q = p + r(1, 5);
        const s = p + q, tt = -p * q;
        const eq = `x^{2}-2kx${s !== 0 ? signedVar(s, "k") : ""}${tt !== 0 ? signed(tt) : ""}=0`;
        const ans = tex(`${p}<k<${q}`);
        return {
          q: `2次方程式 $${eq}$ が虚数解をもつような定数 $k$ の値の範囲を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            tex(`k<${p},\\ ${q}<k`),
            tex(`${p}\\leqq k\\leqq ${q}`),
            tex(`${-q}<k<${-p}`),
          ], (i) => tex(`${p - i - 1}<k<${q + i + 1}`)),
          hint: "虚数解をもつ $\\iff$ 判別式 $D<0$。$x$ の係数が $-2k$ なので $\\frac{D}{4}$ を使うと楽。",
          steps: [
            `$\\frac{D}{4}=k^{2}-(${poly([s, tt], "k")})=${poly([1, -s, -tt], "k")}=${fx2(p, q, "k")}$`,
            `$\\frac{D}{4}<0$ より $${p}<k<${q}$`,
          ],
        };
      }),
    ],
    3: [
      t("HII-fukuso-3a", (r) => {
        const a = r(1, 3), b = rnz(r, -6, 6), c = rnz(r, -6, 6), type = r(0, 1);
        const s = fracTex(-b, a), p = fracTex(c, a);
        const T = type === 0
          ? ["\\alpha^{3}+\\beta^{3}", fracAns(-(b ** 3) + 3 * a * b * c, a ** 3), `(\\alpha+\\beta)^{3}-3\\alpha\\beta(\\alpha+\\beta)`, fracTex(-(b ** 3) + 3 * a * b * c, a ** 3)]
          : ["\\frac{\\beta}{\\alpha}+\\frac{\\alpha}{\\beta}", fracAns(b * b - 2 * a * c, a * c), `\\frac{\\alpha^{2}+\\beta^{2}}{\\alpha\\beta}=\\frac{(\\alpha+\\beta)^{2}-2\\alpha\\beta}{\\alpha\\beta}`, fracTex(b * b - 2 * a * c, a * c)];
        return {
          q: `2次方程式 $${poly([a, b, c])}=0$ の2つの解を $\\alpha,\\ \\beta$ とするとき，$${T[0]}$ の値を求めよ。`,
          ans: T[1],
          hint: "求める式を $\\alpha+\\beta$ と $\\alpha\\beta$ だけで表す。",
          steps: [
            `$\\alpha+\\beta=${s}$，$\\alpha\\beta=${p}$`,
            `$${T[0]}=${T[2]}$`,
            `値を代入して $${T[3]}$`,
          ],
        };
      }),
      t("HII-fukuso-3b", (r) => {
        const p = r(-5, 5), q = rnz(r, -6, 6), type = r(0, 1);
        let S, P, wrongs, label, how;
        if (type === 0) {
          const k = rnz(r, -3, 3);
          S = -p + 2 * k; P = q - p * k + k * k;
          wrongs = [poly([1, S, P]), poly([1, -S, q + k * k]), poly([1, -(-p + k), P])];
          label = `\\alpha${signed(k)},\\ \\beta${signed(k)}`;
          how = [`和 $=(\\alpha+\\beta)${signed(2 * k)}=${S}$`, `積 $=\\alpha\\beta${signedVar(k, "(\\alpha+\\beta)")}${signed(k * k)}=${P}$`];
        } else {
          const m = pick(r, [2, 3, -1, -2]);
          S = -m * p; P = m * m * q;
          wrongs = [poly([1, S, P]), poly([1, -S, m * q]), poly([1, -S, -P])];
          label = `${coefVar(m, "\\alpha")},\\ ${coefVar(m, "\\beta")}`;
          how = [`和 $=${m === -1 ? "-" : m}(\\alpha+\\beta)=${S}$`, `積 $=${m * m === 1 ? "" : m * m}\\alpha\\beta=${P}$`];
        }
        const ans = tex(`${poly([1, -S, P])}=0`);
        return {
          q: `2次方程式 $${poly([1, p, q])}=0$ の2つの解を $\\alpha,\\ \\beta$ とするとき，$${label}$ を2つの解とする2次方程式（$x^{2}$ の係数は1）を求めよ。`,
          ans,
          choices: choices4(r, ans, wrongs.map((w) => tex(`${w}=0`)), (i) => tex(`${poly([1, -S + i + 1, P])}=0`)),
          hint: "新しい2つの解の和と積を，$\\alpha+\\beta$ と $\\alpha\\beta$ で表す。",
          steps: [
            `$\\alpha+\\beta=${-p}$，$\\alpha\\beta=${q}$`,
            ...how,
            `和 $s$，積 $p$ の2数を解とする方程式は $x^{2}-sx+p=0$ だから $${poly([1, -S, P])}=0$`,
          ],
        };
      }),
      t("HII-fukuso-3c", (r) => {
        const rr = pick(r, [2, 3]), m = r(1, 4), qv = rr * m * m, K = (1 + rr) * m;
        const ans = tex(`k=\\pm ${K}`);
        return {
          q: `2次方程式 $x^{2}+kx+${qv}=0$ の2つの解の比が $1:${rr}$ であるとき，実数の定数 $k$ の値を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(`k=${K}`), tex(`k=${-K}`), tex(`k=\\pm ${rr * m}`)]),
          hint: `2つの解を $\\alpha,\\ ${rr}\\alpha$ とおいて，解と係数の関係を使う。`,
          steps: [
            `2つの解を $\\alpha,\\ ${rr}\\alpha$ とおくと $${1 + rr}\\alpha=-k$，$${rr}\\alpha^{2}=${qv}$`,
            `$\\alpha^{2}=${m * m}$ より $\\alpha=\\pm ${m}$`,
            `$k=-${1 + rr}\\alpha$ より $k=\\pm ${K}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-fukuso-4a", (r) => {
        const type = r(0, 1), n = r(5, 20);
        // 1+ω = -ω^2,  1+ω^2 = -ω
        const sign = n % 2 === 0 ? 1 : -1;
        const e = type === 0 ? (2 * n) % 3 : n % 3;
        const om = (sg, k) => {
          const kk = ((k % 3) + 3) % 3;
          const body = kk === 0 ? "1" : kk === 1 ? "\\omega" : "\\omega^{2}";
          return tex(`${sg < 0 ? "-" : ""}${body}`);
        };
        const ans = om(sign, e);
        const base = type === 0 ? "1+\\omega" : "1+\\omega^{2}";
        const rep = type === 0 ? "-\\omega^{2}" : "-\\omega";
        return {
          q: `方程式 $x^{2}+x+1=0$ の解の1つを $\\omega$ とする。$(${base})^{${n}}$ を簡単にせよ。`,
          ans,
          choices: choices4(r, ans, [om(-sign, e), om(sign, e + 1), om(sign, e + 2), om(-sign, e + 1)]),
          hint: "$\\omega^{2}+\\omega+1=0$ と $\\omega^{3}=1$ を使う。",
          steps: [
            `$\\omega^{2}+\\omega+1=0$ より $${base}=${rep}$。また $\\omega^{3}=1$`,
            `$(${base})^{${n}}=(${rep})^{${n}}=${sign < 0 ? "-" : ""}\\omega^{${type === 0 ? 2 * n : n}}$`,
            `$\\omega^{3}=1$ で指数を3で割った余りにすると，答え：${ans}`,
          ],
        };
      }),
      t("HII-fukuso-4b", (r) => {
        const s = rnz(r, -3, 3), p = rnz(r, -3, 3), N = pick(r, [4, 5]);
        const P = [2, s];
        for (let i = 2; i <= N; i++) P[i] = s * P[i - 1] - p * P[i - 2];
        const list = P.slice(1).map((v, i) => `P_{${i + 1}}=${v}`).join(",\\ ");
        return {
          q: `2次方程式 $${poly([1, -s, p])}=0$ の2つの解を $\\alpha,\\ \\beta$ とするとき，$\\alpha^{${N}}+\\beta^{${N}}$ の値を求めよ。`,
          ans: P[N],
          hint: "$P_{n}=\\alpha^{n}+\\beta^{n}$ とおくと $P_{n+2}=(\\alpha+\\beta)P_{n+1}-\\alpha\\beta P_{n}$ が成り立つ。",
          steps: [
            `$\\alpha+\\beta=${s}$，$\\alpha\\beta=${p}$ だから $P_{n+2}=${coefVar(s, "P_{n+1}")}${signedVar(-p, "P_{n}")}$`,
            `$P_{0}=2,\\ P_{1}=${s}$ から順に計算：$${list}$`,
            `答え：$${P[N]}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 高次方程式
// ============================================================
const KOUJI = {
  id: "HII-kouji", grade: "H2", area: "num", name: "高次方程式",
  desc: "剰余の定理・因数定理・3次方程式",
  prereqs: ["HII-fukuso", "HI-inbun"],
  ...COURSE,
  points: [
    "剰余の定理：整式 $P(x)$ を $x-a$ で割った余りは $P(a)$。",
    "因数定理：$P(a)=0 \\iff P(x)$ は $x-a$ で割り切れる。定数項の約数を代入して解を1つ見つけ，組立除法で次数を下げる。",
    "2次式で割った余りは $ax+b$ とおき，割る式が $0$ になる $x$ を代入して $a,\\ b$ を決める。",
    "実数係数の方程式が虚数解 $p+qi$ をもてば，共役な $p-qi$ も解。",
  ],
  levels: {
    1: [
      t("HII-kouji-1a", (r) => {
        const a = rnz(r, -3, 3), b = r(-5, 5), c = r(-5, 5), d = r(-5, 5);
        const P = (x) => x ** 3 + b * x ** 2 + c * x + d;
        const ans = P(a);
        return {
          q: `整式 $P(x)=${poly([1, b, c, d])}$ を $${poly([1, -a])}$ で割った余りを求めよ。`,
          ans,
          hint: "剰余の定理：$x-a$ で割った余りは $P(a)$。",
          steps: [
            `余りは $P(${a})=${par(a)}^{3}${b ? `${signed(b)}\\cdot ${par(a)}^{2}` : ""}${c ? `${signed(c)}\\cdot ${par(a)}` : ""}${d ? signed(d) : ""}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
      t("HII-kouji-1b", (r) => {
        const a = rnz(r, -3, 3), k = r(-5, 5), c = r(-5, 5);
        const d = -(a ** 3 + k * a * a + c * a);
        const P = `x^{3}+kx^{2}${c ? signedVar(c) : ""}${d ? signed(d) : ""}`;
        return {
          q: `整式 $P(x)=${P}$ が $${poly([1, -a])}$ で割り切れるように，定数 $k$ の値を定めよ。`,
          ans: k,
          hint: `因数定理：$${poly([1, -a])}$ で割り切れる $\\iff P(${a})=0$。`,
          steps: [
            `$P(${a})=${a ** 3}+${coefVar(a * a, "k")}${c ? signed(c * a) : ""}${d ? signed(d) : ""}=0$`,
            a * a === 1 ? `よって $k=${k}$` : `$${coefVar(a * a, "k")}=${-(a ** 3 + c * a + d)}$ より $k=${k}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-kouji-2a", (r) => {
        const p = rnz(r, -3, 3), be = r(-2, 2), m = r(1, 6);
        const B = 2 * be, Cc = be * be + m;
        const coeffs = [1, B - p, Cc - B * p, -p * Cc];
        const s = sqrtTex(1, m);
        const im = s === "1" ? "i" : `${s}i`;
        const rootT = (re) => `${re === 0 ? "" : re}\\pm ${im}`;
        const ans = tex(`x=${p},\\ ${rootT(-be)}`);
        return {
          q: `3次方程式 $${poly(coeffs)}=0$ を解け。`,
          ans,
          choices: choices4(r, ans, [
            tex(`x=${-p},\\ ${rootT(-be)}`),
            tex(`x=${p},\\ ${rootT(be)}`),
            tex(`x=${p},\\ ${-be === 0 ? "" : -be}\\pm ${s === "1" ? "1" : s}`),
          ], (i) => tex(`x=${p},\\ ${rootT(-be + i + 1)}`)),
          hint: "定数項の約数を代入して，$P(a)=0$ となる $a$ を探す。",
          steps: [
            `$x=${p}$ を代入すると $0$ になるので，$${poly([1, -p])}$ を因数にもつ`,
            `組立除法で $(${poly([1, -p])})(${poly([1, B, Cc])})=0$`,
            `$${poly([1, B, Cc])}=0$ を解くと $x=${rootT(-be)}$`,
            `答え：$x=${p},\\ ${rootT(-be)}$`,
          ],
        };
      }),
      t("HII-kouji-2b", (r) => {
        const p = rnz(r, -5, 5), q = r(-6, 6);
        const a = r(-3, 2), b = a + r(1, 4);
        const A = p * a + q, B = p * b + q;
        const ans = tex(poly([p, q]));
        return {
          q: `整式 $P(x)$ を $${poly([1, -a])}$ で割ると余りが $${A}$，$${poly([1, -b])}$ で割ると余りが $${B}$ である。$P(x)$ を $${fx2(a, b)}$ で割った余りを求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(poly([q, p])), tex(poly([p, -q])), tex(poly([-p, q]))],
            (i) => tex(poly([p + i + 1, q]))),
          hint: "2次式で割った余りは1次以下なので $ax+b$ とおき，剰余の定理を使う。",
          steps: [
            `$P(x)=${fx2(a, b)}Q(x)+sx+t$ とおく`,
            `$P(${a})=${a === 0 ? "t" : `${coefVar(a, "s")}+t`}=${A}$，$P(${b})=${b === 0 ? "t" : `${coefVar(b, "s")}+t`}=${B}$`,
            `これを解いて $s=${p}$，$t=${q}$`,
            `答え：$${poly([p, q])}$`,
          ],
        };
      }),
    ],
    3: [
      t("HII-kouji-3a", (r) => {
        const rr = rnz(r, -4, 4), u = r(-2, 2), v = r(1, 3), N = u * u + v * v;
        const d = -rr * N, A = -(rr + 2 * u), B = N + 2 * u * rr;
        const ask = r(0, 2);
        const ans = [rr, A, B][ask];
        const what = ["残りの実数解", "$a$ の値", "$b$ の値"][ask];
        return {
          q: `$a,\\ b$ を実数とする。3次方程式 $x^{3}+ax^{2}+bx${signed(d)}=0$ の1つの解が $${cx(u, v)}$ であるとき，${what}を求めよ。`,
          ans,
          hint: `係数が実数なので $${cx(u, -v)}$ も解。この2つを解にもつ2次式で左辺が割り切れる。`,
          steps: [
            `$${cx(u, v)}$ と $${cx(u, -v)}$ を解とする2次方程式は $${poly([1, -2 * u, N])}=0$`,
            `左辺は $(${poly([1, -2 * u, N])})(x-c)$ と表せて，定数項を比べると $-${N}c=${d}$ より $c=${rr}$`,
            `展開して $(${poly([1, -2 * u, N])})(${poly([1, -rr])})=${poly([1, A, B, d])}$ より $a=${A}$，$b=${B}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
      t("HII-kouji-3b", (r) => {
        const a = 1, b = pick(r, [2, -1, -2, 3]);
        const n = Math.abs(b) === 3 ? r(4, 7) : r(5, 9);
        const p = (b ** n - a ** n) / (b - a), q = (b * a ** n - a * b ** n) / (b - a);
        const ans = tex(poly([p, q]));
        return {
          q: `$x^{${n}}$ を $${poly([1, -(a + b), a * b])}$ で割った余りを求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(poly([q, p])), tex(poly([p, -q])), tex(poly([-p, q]))],
            (i) => tex(poly([p, q + i + 1]))),
          hint: "割る式を因数分解し，余りを $sx+t$ とおいて，割る式が $0$ になる $x$ を代入する。",
          steps: [
            `$${poly([1, -(a + b), a * b])}=${fx2(a, b)}$。$x^{${n}}=${fx2(a, b)}Q(x)+sx+t$ とおく`,
            `$x=${a}$：$s+t=${a ** n}$，$x=${b}$：$${coefVar(b, "s")}+t=${b ** n}$`,
            `これを解いて $s=${p}$，$t=${q}$`,
            `答え：$${poly([p, q])}$`,
          ],
        };
      }),
      t("HII-kouji-3c", (r) => {
        const p = rnz(r, -3, 3);
        let q = rnz(r, -3, 3);
        if (q === p) q = -p;
        const s = r(-4, 4);
        const coeffs = [1, -(p + q + s), p * q + q * s + s * p, -p * q * s];
        const roots = [...new Set([p, q, s])];
        const ans = roots.reduce((x, y) => x + y, 0);
        return {
          q: `3次方程式 $${poly(coeffs)}=0$ の異なる実数解をすべて求め，その和を答えよ。`,
          ans,
          hint: "定数項の約数を代入して解を1つ見つけ，組立除法で因数分解する。",
          steps: [
            `$x=${p}$ を代入すると $0$ になるので $${poly([1, -p])}$ で割り切れる`,
            `$(${poly([1, -p])})(${poly([1, -(q + s), q * s])})=0$ と因数分解でき，さらに $${fx(p)}${fx2(q, s)}=0$`,
            `異なる解は $x=${roots.sort((x, y) => x - y).join(",\\ ")}$`,
            `答え：和は $${ans}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-kouji-4a", (r) => {
        const a = pick(r, [1, -1, 2]);
        const n = a === 2 ? r(4, 7) : r(5, 15);
        const p = n * a ** (n - 1), q = -(n - 1) * a ** n;
        const ans = tex(poly([p, q]));
        return {
          q: `$x^{${n}}$ を $(${poly([1, -a])})^{2}$ で割った余りを求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(poly([p, -q])), tex(poly([a ** n])), tex(poly([p, -n * a ** n]))],
            (i) => tex(poly([p + i + 1, q]))),
          hint: `$x=(${poly([1, -a])})+${par(a)}$ と見て二項定理で展開すると，$(${poly([1, -a])})^{2}$ の倍数でない部分が見える。`,
          steps: [
            `$x^{${n}}=\\{(${poly([1, -a])})${signed(a)}\\}^{${n}}$ を展開すると，$(${poly([1, -a])})^{2}$ 以上をふくむ項は割り切れる`,
            `残るのは $${par(a)}^{${n}}+${n}\\cdot ${par(a)}^{${n - 1}}(${poly([1, -a])})$`,
            `整理して $${poly([p, q])}$（1次式なのでこれが余り）`,
          ],
        };
      }),
      t("HII-kouji-4b", (r) => {
        const m = r(5, 40);
        let n = r(5, 40);
        if (n === m) n = m + 1;
        const rem = (e) => [[0, 1], [1, 0], [-1, -1]][e % 3];
        const add = (u, v) => [u[0] + v[0], u[1] + v[1]];
        const [A, B] = add(rem(m), rem(n));
        const ans = tex(poly([A, B]));
        const remBad = (e) => [[0, 1], [1, 0], [1, 1]][e % 3];
        const bad = add(remBad(m), remBad(n));
        const others = [];
        for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) { const s = add(rem(i), rem(j)); others.push(tex(poly(s))); }
        return {
          q: `$x^{${m}}+x^{${n}}$ を $x^{2}+x+1$ で割った余りを求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(poly(bad)), ...shuffle(r, others)]),
          hint: "$x^{3}-1=(x-1)(x^{2}+x+1)$ なので，$x^{3}$ は $1$ と同じ余りになる。",
          steps: [
            `$x^{3}-1=(x-1)(x^{2}+x+1)$ より，$x^{3}$ を $x^{2}+x+1$ で割った余りは $1$`,
            `$x^{${m}}$ は $${["1", "x", "x^{2}"][m % 3]}$，$x^{${n}}$ は $${["1", "x", "x^{2}"][n % 3]}$ と同じ余り（$x^{2}$ の余りは $-x-1$）`,
            `答え：$${poly([A, B])}$`,
          ],
        };
      }),
      t("HII-kouji-4c", (r) => {
        const b = r(-5, 5), c = r(-6, 6), d = rnz(r, -8, 8), type = r(0, 1);
        const P = (x) => x ** 3 + b * x ** 2 + c * x + d;
        if (type === 0) {
          const k = rnz(r, -3, 3);
          const ans = -P(-k);
          const T = `(\\alpha${signed(k)})(\\beta${signed(k)})(\\gamma${signed(k)})`;
          return {
            q: `3次方程式 $${poly([1, b, c, d])}=0$ の3つの解を $\\alpha,\\ \\beta,\\ \\gamma$ とするとき，$${T}$ の値を求めよ。`,
            ans,
            hint: "$P(x)=(x-\\alpha)(x-\\beta)(x-\\gamma)$ と因数分解できることを使う。",
            steps: [
              `$P(x)=${poly([1, b, c, d])}=(x-\\alpha)(x-\\beta)(x-\\gamma)$`,
              `$x=${-k}$ を代入すると $P(${-k})=-${T}$`,
              `$P(${-k})=${P(-k)}$ より，答え：$${ans}$`,
            ],
          };
        }
        const ans = b * b - 2 * c;
        return {
          q: `3次方程式 $${poly([1, b, c, d])}=0$ の3つの解を $\\alpha,\\ \\beta,\\ \\gamma$ とするとき，$\\alpha^{2}+\\beta^{2}+\\gamma^{2}$ の値を求めよ。`,
          ans,
          hint: "3次方程式の解と係数の関係と，$(\\alpha+\\beta+\\gamma)^{2}$ の展開を使う。",
          steps: [
            `$\\alpha+\\beta+\\gamma=${-b}$，$\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha=${c}$`,
            `$\\alpha^{2}+\\beta^{2}+\\gamma^{2}=(\\alpha+\\beta+\\gamma)^{2}-2(\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha)=${par(-b)}^{2}-2\\cdot ${par(c)}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 図形と方程式
// ============================================================
/** 長さが整数になる (a,b) の組 [a, b, √(a²+b²)] */
const PYTH = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]];
/** 円 (x-p)^2+(y-q)^2=R2 の TeX */
const circTex = (p, q, R2) => `${p === 0 ? "x^{2}" : `(${poly([1, -p])})^{2}`}+${q === 0 ? "y^{2}" : `(${poly([1, -q], "y")})^{2}`}=${R2}`;

const ZUHOU = {
  id: "HII-zuhou", grade: "H2", area: "func", name: "図形と方程式",
  desc: "2点間の距離・直線・円・点と直線の距離・領域",
  prereqs: ["J2-g2c3u3", "J3-g3c7u4"],
  ...COURSE,
  points: [
    "2点間の距離 $\\sqrt{(x_{2}-x_{1})^{2}+(y_{2}-y_{1})^{2}}$。$m:n$ に内分する点は $\\left(\\frac{nx_{1}+mx_{2}}{m+n},\\ \\frac{ny_{1}+my_{2}}{m+n}\\right)$。",
    "2直線が平行 $\\iff$ 傾きが等しい，垂直 $\\iff$ 傾きの積が $-1$。",
    "円 $(x-a)^{2}+(y-b)^{2}=r^{2}$。点 $(x_{0},y_{0})$ と直線 $ax+by+c=0$ の距離は $\\frac{|ax_{0}+by_{0}+c|}{\\sqrt{a^{2}+b^{2}}}$。円と直線は中心との距離 $d$ と半径 $r$ を比べる。",
    "領域の最大・最小は，目的の式を $=k$ とおいた直線を動かして，領域の頂点などで調べる。",
  ],
  levels: {
    1: [
      t("HII-zuhou-1a", (r) => {
        const x1 = r(-5, 5), y1 = r(-5, 5);
        let x2 = r(-5, 5);
        const y2 = r(-5, 5);
        if (x2 === x1) x2 = x1 + r(1, 3);
        const dx = x2 - x1, dy = y2 - y1, d2 = dx * dx + dy * dy;
        const ans = tex(sqrtTex(1, d2));
        const sx = x1 + x2, sy = y1 + y2;
        return {
          q: `2点 $A(${x1},\\ ${y1})$，$B(${x2},\\ ${y2})$ の間の距離を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            sx * sx + sy * sy > 0 ? tex(sqrtTex(1, sx * sx + sy * sy)) : null,
            tex(String(Math.abs(dx) + Math.abs(dy))),
            Math.abs(dx * dx - dy * dy) > 0 ? tex(sqrtTex(1, Math.abs(dx * dx - dy * dy))) : null,
          ], (i) => tex(sqrtTex(1, d2 + i + 1))),
          hint: "$AB=\\sqrt{(x_{2}-x_{1})^{2}+(y_{2}-y_{1})^{2}}$",
          steps: [
            `$AB=\\sqrt{(${x2}-${par(x1)})^{2}+(${y2}-${par(y1)})^{2}}=\\sqrt{${dx * dx}+${dy * dy}}$`,
            `答え：$${sqrtTex(1, d2)}$`,
          ],
        };
      }),
      t("HII-zuhou-1b", (r) => {
        const x1 = r(-6, 6), y1 = r(-6, 6), x2 = r(-6, 6), y2 = r(-6, 6);
        if (x1 === x2 && y1 === y2) return { skip: true };
        const m = r(1, 4);
        let n = r(1, 4);
        if (n === m) n = m === 4 ? 1 : m + 1;
        const askX = r(0, 1) === 1;
        const ans = askX ? fracAns(n * x1 + m * x2, m + n) : fracAns(n * y1 + m * y2, m + n);
        const [u1, u2] = askX ? [x1, x2] : [y1, y2];
        return {
          q: `2点 $A(${x1},\\ ${y1})$，$B(${x2},\\ ${y2})$ を結ぶ線分 $AB$ を $${m}:${n}$ に内分する点の ${askX ? "$x$" : "$y$"} 座標を求めよ。`,
          ans,
          hint: "$m:n$ に内分する点の $x$ 座標は $\\frac{nx_{1}+mx_{2}}{m+n}$（$y$ 座標も同じ形）。",
          steps: [
            `$\\frac{${n}\\cdot ${par(u1)}+${m}\\cdot ${par(u2)}}{${m}+${n}}=\\frac{${n * u1 + m * u2}}{${m + n}}$`,
            `答え：$${fracTex(n * u1 + m * u2, m + n)}$`,
          ],
        };
      }),
      t("HII-zuhou-1c", (r) => {
        const p = r(-4, 4), q = r(-4, 4), R = r(1, 6);
        const a = -2 * p, b = -2 * q, c = p * p + q * q - R * R;
        const eq = `x^{2}+y^{2}${a ? signedVar(a) : ""}${b ? signedVar(b, "y") : ""}${c ? signed(c) : ""}=0`;
        return {
          q: `円 $${eq}$ の半径を求めよ。`,
          ans: R,
          hint: "$x$ と $y$ それぞれについて平方完成して，$(x-a)^{2}+(y-b)^{2}=r^{2}$ の形にする。",
          steps: [
            `平方完成すると $${circTex(p, q, R * R)}$`,
            `中心 $(${p},\\ ${q})$，半径 $${R}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-zuhou-2a", (r) => {
        let a = rnz(r, -4, 4), b = rnz(r, -4, 4), c = r(-6, 6);
        const x0 = r(-4, 4), y0 = r(-4, 4);
        // 問題文の直線（lineTex で約分・符号をそろえた形）と解説の係数を合わせる
        { const g = gcd(gcd(a, b), c), sg = a < 0 ? -1 : 1; a = (sg * a) / g; b = (sg * b) / g; c = (sg * c) / g; }
        const ans = tex(lineTex(b, -a, -b * x0 + a * y0));
        return {
          q: `点 $(${x0},\\ ${y0})$ を通り，直線 $${lineTex(a, b, c)}$ に垂直な直線の方程式を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            tex(lineTex(a, b, -a * x0 - b * y0)),
            tex(lineTex(b, a, -b * x0 - a * y0)),
            tex(lineTex(b, -a, b * x0 - a * y0)),
          ], (i) => tex(lineTex(b, -a, -b * x0 + a * y0 + i + 1))),
          hint: "直線 $ax+by+c=0$ に垂直な直線は $bx-ay+c'=0$ の形。傾きで考えてもよい（積が $-1$）。",
          steps: [
            `直線 $${lineTex(a, b, c)}$ に垂直な直線は $${coefVar(b)}${signedVar(-a, "y")}+k=0$ とおける`,
            `点 $(${x0},\\ ${y0})$ を通るので $k=${-b * x0 + a * y0}$`,
            `答え：$${lineTex(b, -a, -b * x0 + a * y0)}$`,
          ],
        };
      }),
      t("HII-zuhou-2b", (r) => {
        const [A0, B0, N] = pick(r, PYTH);
        const a = A0, b = B0 * (r(0, 1) ? 1 : -1), c = r(-10, 10);
        const x0 = r(-5, 5), y0 = r(-5, 5);
        const v = a * x0 + b * y0 + c;
        if (v === 0) return { skip: true };
        return {
          q: `点 $(${x0},\\ ${y0})$ と直線 $${coefVar(a)}${signedVar(b, "y")}${c ? signed(c) : ""}=0$ の距離を求めよ。`,
          ans: fracAns(Math.abs(v), N),
          hint: "点と直線の距離の公式 $\\frac{|ax_{0}+by_{0}+c|}{\\sqrt{a^{2}+b^{2}}}$ を使う。",
          steps: [
            `$\\frac{|${a}\\cdot ${par(x0)}${signed(b)}\\cdot ${par(y0)}${c ? signed(c) : ""}|}{\\sqrt{${par(a)}^{2}+${par(b)}^{2}}}=\\frac{${Math.abs(v)}}{${N}}$`,
            `答え：$${fracTex(Math.abs(v), N)}$`,
          ],
        };
      }),
      t("HII-zuhou-2c", (r) => {
        const [A0, B0, N] = pick(r, PYTH);
        const a = A0 * (r(0, 1) ? 1 : -1), b = B0 * (r(0, 1) ? 1 : -1);
        const p = r(-3, 3), q = r(-3, 3), R = r(1, 4);
        const kind = r(0, 2);
        const tt = kind === 2 ? r(0, R * N - 1) : kind === 1 ? R * N : R * N + r(1, 2 * N);
        const sg = r(0, 1) ? 1 : -1;
        const c = sg * tt - a * p - b * q;
        const d = fracTex(tt, N);
        const ans = `${kind}個`;
        return {
          q: `円 $${circTex(p, q, R * R)}$ と直線 $${coefVar(a)}${signedVar(b, "y")}${c ? signed(c) : ""}=0$ の共有点の個数を求めよ。`,
          ans,
          choices: ["0個", "1個", "2個"],
          hint: "円の中心と直線の距離 $d$ を求め，半径 $r$ と比べる。",
          steps: [
            `中心 $(${p},\\ ${q})$ と直線の距離は $d=\\frac{|${a}\\cdot ${par(p)}${signed(b)}\\cdot ${par(q)}${c ? signed(c) : ""}|}{${N}}=${d}$`,
            `半径は $${R}$ で，$d${kind === 2 ? "<" : kind === 1 ? "=" : ">"}${R}$`,
            `答え：${ans}`,
          ],
        };
      }),
    ],
    3: [
      t("HII-zuhou-3a", (r) => {
        const [a, rr, s] = pick(r, [[5, 3, 4], [5, 4, 3], [10, 6, 8], [10, 8, 6], [13, 5, 12], [13, 12, 5], [17, 8, 15], [17, 15, 8]]);
        const onX = r(0, 1) === 1, A = a * (r(0, 1) ? 1 : -1);
        const [num, den] = onX ? [rr, s] : [s, rr];
        const pm = (n, d) => tex(`\\pm ${fracTex(n, d)}`);
        const ans = pm(num, den);
        const P = onX ? `(${A},\\ 0)` : `(0,\\ ${A})`;
        const line = onX ? `y=m(x${signed(-A)})` : `y=mx${signed(A)}`;
        return {
          q: `点 $${P}$ から円 $x^{2}+y^{2}=${rr * rr}$ に引いた2本の接線の傾きを求めよ。`,
          ans,
          choices: choices4(r, ans, [pm(den, num), pm(rr, a), pm(s, a)], (i) => pm(num + i + 1, den)),
          hint: "接線を $y=m(x-p)+q$ とおき，円の中心と直線の距離が半径に等しいという条件を使う。",
          steps: [
            `接線を $${line}$ とおく。中心 $(0,\\ 0)$ との距離が半径 $${rr}$ に等しい`,
            `$\\frac{|${onX ? `${-A}m` : A}|}{\\sqrt{m^{2}+1}}=${rr}$ より $${a * a}${onX ? "m^{2}" : ""}=${rr * rr}(m^{2}+1)$`,
            `$m^{2}=${fracTex(num * num, den * den)}$ より，答え：$m=\\pm ${fracTex(num, den)}$`,
          ],
        };
      }),
      t("HII-zuhou-3b", (r) => {
        const [A0, B0, N] = pick(r, PYTH);
        const a = A0 * (r(0, 1) ? 1 : -1), b = B0 * (r(0, 1) ? 1 : -1);
        const R = r(2, 6), tt = rnz(r, -(R - 1), R - 1), c = N * tt;
        const k = R * R - tt * tt;
        const ans = tex(sqrtTex(2, k));
        return {
          q: `円 $x^{2}+y^{2}=${R * R}$ が直線 $${lineTex(a, b, c)}$ から切り取る弦の長さを求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(sqrtTex(1, k)), tex(sqrtTex(2, R * R + tt * tt)), tex(String(2 * (R - Math.abs(tt))))],
            (i) => tex(sqrtTex(2, k + i + 1))),
          hint: "中心から直線までの距離 $d$ を求め，三平方の定理で弦の半分の長さを出す。",
          steps: [
            `中心 $(0,\\ 0)$ と直線の距離は $d=${Math.abs(tt)}$`,
            `弦の半分の長さは $\\sqrt{${R}^{2}-${Math.abs(tt)}^{2}}=${sqrtTex(1, k)}$`,
            `答え：$${sqrtTex(2, k)}$`,
          ],
        };
      }),
      t("HII-zuhou-3c", (r) => {
        const X = r(1, 5), Y = r(1, 5);
        const [a1, b1] = pick(r, [[1, 2], [1, 3], [2, 3], [1, 4]]);
        const [a2, b2] = pick(r, [[2, 1], [3, 1], [3, 2], [4, 1]]);
        const c1 = a1 * X + b1 * Y, c2 = a2 * X + b2 * Y;
        const p = r(1, 5), q = r(1, 5);
        // 頂点 (0,0), (c2/a2, 0), (X, Y), (0, c1/b1)
        const V = [
          { tex: "(0,\\ 0)", n: 0, d: 1 },
          { tex: `(${fracTex(c2, a2)},\\ 0)`, n: p * c2, d: a2 },
          { tex: `(${X},\\ ${Y})`, n: p * X + q * Y, d: 1 },
          { tex: `(0,\\ ${fracTex(c1, b1)})`, n: q * c1, d: b1 },
        ];
        let best = V[0];
        for (const v of V) if (v.n / v.d > best.n / best.d) best = v;
        const obj = `${coefVar(p)}+${coefVar(q, "y")}`;
        return {
          q: `連立不等式 $x\\geqq 0$，$y\\geqq 0$，$${coefVar(a1)}+${coefVar(b1, "y")}\\leqq ${c1}$，$${coefVar(a2)}+${coefVar(b2, "y")}\\leqq ${c2}$ の表す領域を点 $(x,\\ y)$ が動くとき，$${obj}$ の最大値を求めよ。`,
          ans: fracAns(best.n, best.d),
          hint: `領域は四角形になる。$${obj}=k$ とおいた直線を動かすか，頂点での値を比べる。`,
          steps: [
            `2直線の交点は $(${X},\\ ${Y})$。領域は4点 ${V.map((v) => `$${v.tex}$`).join("，")} を頂点とする四角形`,
            `各頂点での $${obj}$ の値：${V.map((v) => `$${fracTex(v.n, v.d)}$`).join("，")}`,
            `最大値は頂点 $${best.tex}$ でとり，答え：$${fracTex(best.n, best.d)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-zuhou-4a", (r) => {
        const [m, n] = pick(r, [[2, 1], [3, 1], [1, 2], [1, 3], [3, 2], [2, 3]]);
        const b = r(2, 9), h = r(-3, 3);
        const askR = r(0, 1) === 1;
        const rad = fracAns(m * n * b, Math.abs(m * m - n * n));
        const cxv = fracAns(h * (m * m - n * n) + m * m * b, m * m - n * n);
        return {
          q: `2点 $A(${h},\\ 0)$，$B(${h + b},\\ 0)$ からの距離の比が $AP:BP=${m}:${n}$ である点 $P$ の軌跡は円である。この円の${askR ? "半径" : "中心の $x$ 座標"}を求めよ。`,
          ans: askR ? rad : cxv,
          hint: `$P(x,\\ y)$ とおき，$${n * n === 1 ? "" : n * n}AP^{2}=${m * m === 1 ? "" : m * m}BP^{2}$ を座標で書いて整理する。`,
          steps: [
            `$P(x,\\ y)$ とおくと $${n * n === 1 ? "" : n * n}\\{${fx(h)}^{2}+y^{2}\\}=${m * m === 1 ? "" : m * m}\\{${fx(h + b)}^{2}+y^{2}\\}$`,
            `整理して平方完成すると，中心 $(${fracTex(h * (m * m - n * n) + m * m * b, m * m - n * n)},\\ 0)$，半径 $${fracTex(m * n * b, Math.abs(m * m - n * n))}$ の円`,
            `答え：$${askR ? fracTex(m * n * b, Math.abs(m * m - n * n)) : fracTex(h * (m * m - n * n) + m * m * b, m * m - n * n)}$`,
          ],
        };
      }),
      t("HII-zuhou-4b", (r) => {
        const [a, rr, s] = pick(r, [[5, 3, 4], [5, 4, 3], [10, 6, 8], [13, 5, 12], [13, 12, 5], [17, 8, 15], [17, 15, 8], [25, 7, 24]]);
        const A = a * (r(0, 1) ? 1 : -1), askMax = r(0, 1) === 1;
        return {
          q: `点 $P(x,\\ y)$ が円 $x^{2}+y^{2}=${rr * rr}$ 上を動くとき，$\\frac{y}{x${signed(-A)}}$ の${askMax ? "最大値" : "最小値"}を求めよ。`,
          ans: fracAns(askMax ? rr : -rr, s),
          hint: `$\\frac{y}{x${signed(-A)}}=k$ とおくと，$k$ は点 $(${A},\\ 0)$ と点 $P$ を結ぶ直線の傾き。`,
          steps: [
            `$\\frac{y}{x${signed(-A)}}=k$ とおくと，直線 $y=k(x${signed(-A)})$ と円が共有点をもつ条件を考える`,
            `中心との距離 $\\frac{|${-A}k|}{\\sqrt{k^{2}+1}}\\leqq ${rr}$ より $${a * a - rr * rr}k^{2}\\leqq ${rr * rr}$`,
            `$${fracTex(-rr, s)}\\leqq k\\leqq ${fracTex(rr, s)}$（両端は接するとき）`,
            `答え：$${fracTex(askMax ? rr : -rr, s)}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 三角関数
// ============================================================
const DEG = Math.PI / 180;
/** (n/d)π の TeX */
function piTex(n, d) {
  [n, d] = reduce(n, d);
  if (n === 0) return "0";
  const sg = n < 0 ? "-" : "";
  const an = Math.abs(n);
  const num = an === 1 ? "\\pi" : `${an}\\pi`;
  return d === 1 ? `${sg}${num}` : `${sg}\\frac{${num}}{${d}}`;
}
const radTex = (deg) => piTex(deg, 180);
const KNOWN = [
  [0, "0"], [0.5, "\\frac{1}{2}"], [Math.SQRT2 / 2, "\\frac{\\sqrt{2}}{2}"], [Math.sqrt(3) / 2, "\\frac{\\sqrt{3}}{2}"],
  [1, "1"], [1 / Math.sqrt(3), "\\frac{1}{\\sqrt{3}}"], [Math.sqrt(3), "\\sqrt{3}"],
];
function valTex(v) {
  for (const [k, s] of KNOWN) if (Math.abs(Math.abs(v) - k) < 1e-9) return (v < -1e-9 ? "-" : "") + s;
  return null;
}
const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
/** 有名角の三角比の TeX（tan が定義されないときは null） */
function trig(fn, deg) {
  if (fn === "tan" && (((deg % 180) + 180) % 180) === 90) return null;
  return valTex(FN[fn](deg * DEG));
}
const negTex = (s) => (s === "0" ? "0" : s.startsWith("-") ? s.slice(1) : `-${s}`);
const pt = (s) => (s.startsWith("-") ? `\\left(${s}\\right)` : s);
/** sg·√n / d を簡単にした TeX */
function rootFrac(sg, n, d) {
  const [a, b] = sqrtSimp(n);
  if (b === 1) return fracTex(sg * a, d);
  const g = gcd(a, d), A = a / g, D = d / g;
  const num = `${A === 1 ? "" : A}\\sqrt{${b}}`;
  return (sg < 0 ? "-" : "") + (D === 1 ? num : `\\frac{${num}}{${D}}`);
}
/** v を c, c√2, c√3 の形の TeX に */
function niceTex(v) {
  for (const rt of [1, 2, 3]) {
    const c = v / Math.sqrt(rt);
    if (Math.abs(c - Math.round(c)) < 1e-9) return sqrtTex(Math.round(c), rt);
  }
  return null;
}
/** 合成用：a sinθ + b cosθ = R sin(θ+α) の係数 */
function synth(alpha, k) {
  const is45 = Math.abs(alpha) % 90 === 45;
  const R = is45 ? k * Math.SQRT2 : 2 * k;
  const coef = (v) => {
    for (const rt of [1, 3]) {
      const c = v / Math.sqrt(rt);
      if (Math.abs(c - Math.round(c)) < 1e-9) return { c: Math.round(c), rt };
    }
    return { c: 0, rt: 1 };
  };
  const term = ({ c, rt }, body, first) => {
    const ac = Math.abs(c);
    const mag = rt === 1 ? (ac === 1 ? "" : `${ac}`) : `${ac === 1 ? "" : ac}\\sqrt{${rt}}`;
    return `${c < 0 ? "-" : first ? "" : "+"}${mag}${body}`;
  };
  const A = coef(R * Math.cos(alpha * DEG)), B = coef(R * Math.sin(alpha * DEG));
  return {
    R, RT: is45 ? sqrtTex(k, 2) : String(2 * k), R2: is45 ? 2 * k * k : 4 * k * k,
    expr: term(A, "\\sin\\theta", true) + term(B, "\\cos\\theta", false),
    aT: niceTex(R * Math.cos(alpha * DEG)), bT: niceTex(R * Math.sin(alpha * DEG)),
  };
}
const normDeg = (x) => { const y = ((((x + 180) % 360) + 360) % 360) - 180; return y === -180 ? 180 : y; };
const angTex = (a) => (a > 0 ? `+${radTex(a)}` : `-${radTex(-a)}`);
const sinForm = (RT, a) => `${RT}\\sin\\left(\\theta${angTex(a)}\\right)`;

const SANKAKU = {
  id: "HII-sankaku", grade: "H2", area: "func", name: "三角関数",
  desc: "弧度法・加法定理・2倍角・合成",
  prereqs: ["HI-seigen"],
  ...COURSE,
  points: [
    "弧度法 $180^{\\circ}=\\pi$。$\\sin^{2}\\theta+\\cos^{2}\\theta=1$，$\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}$。符号は $\\theta$ の動径がある象限で決まる。",
    "加法定理 $\\sin(\\alpha\\pm\\beta)=\\sin\\alpha\\cos\\beta\\pm\\cos\\alpha\\sin\\beta$，$\\cos(\\alpha\\pm\\beta)=\\cos\\alpha\\cos\\beta\\mp\\sin\\alpha\\sin\\beta$。",
    "2倍角 $\\sin 2\\theta=2\\sin\\theta\\cos\\theta$，$\\cos 2\\theta=1-2\\sin^{2}\\theta=2\\cos^{2}\\theta-1$。",
    "合成 $a\\sin\\theta+b\\cos\\theta=\\sqrt{a^{2}+b^{2}}\\sin(\\theta+\\alpha)$（$\\cos\\alpha=\\frac{a}{\\sqrt{a^{2}+b^{2}}},\\ \\sin\\alpha=\\frac{b}{\\sqrt{a^{2}+b^{2}}}$）。最大・最小は $\\theta+\\alpha$ の範囲で考える。",
  ],
  levels: {
    1: [
      t("HII-sankaku-1a", (r) => {
        const deg = pick(r, [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 210, 225, 240, 270, 300, 315, 330, 36, 72]);
        if (r(0, 1) === 1) {
          return {
            q: `$${radTex(deg)}$ を度数法で表せ。`,
            ans: deg,
            unit: "度",
            hint: "$\\pi=180^{\\circ}$ を代入する。",
            steps: [`$\\pi=180^{\\circ}$ を代入する`, `$${radTex(deg)}=${deg}^{\\circ}$ より，答え：$${deg}$ 度`],
          };
        }
        const ans = tex(radTex(deg));
        return {
          q: `$${deg}^{\\circ}$ を弧度法で表せ。`,
          ans,
          choices: choices4(r, ans, [tex(piTex(deg, 360)), tex(piTex(180, deg)), tex(piTex(deg, 90))]),
          hint: "$1^{\\circ}=\\frac{\\pi}{180}$ を使う。",
          steps: [`$${deg}^{\\circ}=${deg}\\times\\frac{\\pi}{180}=${radTex(deg)}$`],
        };
      }),
      t("HII-sankaku-1b", (r) => {
        const fn = pick(r, ["sin", "cos", "tan"]);
        const degs = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].filter((d) => trig(fn, d) !== null);
        const deg = pick(r, degs);
        const v = trig(fn, deg);
        const ans = tex(v);
        const other = fn === "sin" ? "cos" : "sin";
        const ref = [0, 30, 45, 60, 90].find((x) => valTex(Math.abs(FN[fn](deg * DEG))) === trig(fn, x));
        const fills = ["0", "1", "\\frac{1}{2}", "\\frac{\\sqrt{3}}{2}", "\\frac{\\sqrt{2}}{2}", "\\sqrt{3}", "\\frac{1}{\\sqrt{3}}"];
        return {
          q: `$\\${fn} ${radTex(deg)}$ の値を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(negTex(v)), trig(other, deg) ? tex(trig(other, deg)) : null, tex(negTex(trig(other, deg) || "1"))],
            (i) => tex(i % 2 ? negTex(pick(r, fills)) : pick(r, fills))),
          hint: "単位円で，角 $\\theta$ の動径と円の交点を考える。$\\sin$ は $y$ 座標，$\\cos$ は $x$ 座標。",
          steps: [
            `$${radTex(deg)}=${deg}^{\\circ}$`,
            ref !== undefined ? `基準の角 $${ref}^{\\circ}$ の値に，象限による符号をつける` : "単位円で値を読む",
            `答え：$${v}$`,
          ],
        };
      }),
      t("HII-sankaku-1c", (r) => {
        const [p, q] = pick(r, [[1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 13], [12, 13]]);
        const quad = pick(r, [2, 3, 4]);
        const sinS = quad === 2 ? 1 : -1, cosS = quad === 4 ? 1 : -1;
        const givenSin = r(0, 1) === 1;
        const gS = givenSin ? sinS : cosS, aS = givenSin ? cosS : sinS;
        const n = q * q - p * p;
        const range = ["", "", "\\frac{\\pi}{2}<\\theta<\\pi", "\\pi<\\theta<\\frac{3\\pi}{2}", "\\frac{3\\pi}{2}<\\theta<2\\pi"][quad];
        const gf = givenSin ? "\\sin" : "\\cos", af = givenSin ? "\\cos" : "\\sin";
        const ans = tex(rootFrac(aS, n, q));
        return {
          q: `$${range}$ で $${gf}\\theta=${fracTex(gS * p, q)}$ のとき，$${af}\\theta$ の値を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(rootFrac(-aS, n, q)), tex(fracTex(aS * n, q * q)), tex(fracTex(aS * (q - p), q))],
            (i) => tex(rootFrac(aS, n + i + 1, q))),
          hint: "$\\sin^{2}\\theta+\\cos^{2}\\theta=1$ を使い，符号は $\\theta$ の範囲で決める。",
          steps: [
            `$${af}^{2}\\theta=1-\\left(${fracTex(gS * p, q)}\\right)^{2}=${fracTex(n, q * q)}$`,
            `$${range}$ では $${af}\\theta${aS > 0 ? ">" : "<"}0$`,
            `答え：$${rootFrac(aS, n, q)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-sankaku-2a", (r) => {
        const deg = pick(r, [15, 75, 105, 165]), fn = pick(r, ["sin", "cos", "tan"]);
        const [A, B, sg] = { 15: [45, 30, -1], 75: [45, 30, 1], 105: [60, 45, 1], 165: [120, 45, 1] }[deg];
        const s6 = Math.sqrt(6), s2 = Math.SQRT2, s3 = Math.sqrt(3);
        const list = fn === "tan"
          ? [[2 + s3, "2+\\sqrt{3}"], [2 - s3, "2-\\sqrt{3}"], [-2 - s3, "-2-\\sqrt{3}"], [-2 + s3, "-2+\\sqrt{3}"]]
          : [[(s6 + s2) / 4, "\\frac{\\sqrt{6}+\\sqrt{2}}{4}"], [(s6 - s2) / 4, "\\frac{\\sqrt{6}-\\sqrt{2}}{4}"], [-(s6 + s2) / 4, "-\\frac{\\sqrt{6}+\\sqrt{2}}{4}"], [(s2 - s6) / 4, "\\frac{\\sqrt{2}-\\sqrt{6}}{4}"]];
        const v = FN[fn](deg * DEG);
        const hit = list.find(([x]) => Math.abs(x - v) < 1e-9);
        const ans = tex(hit[1]);
        const T = (f, d) => pt(trig(f, d));
        const op = sg > 0 ? "+" : "-", nop = sg > 0 ? "-" : "+";
        const formula = fn === "sin"
          ? `\\sin ${A}^{\\circ}\\cos ${B}^{\\circ}${op}\\cos ${A}^{\\circ}\\sin ${B}^{\\circ}=${T("sin", A)}\\cdot ${T("cos", B)}${op}${T("cos", A)}\\cdot ${T("sin", B)}`
          : fn === "cos"
            ? `\\cos ${A}^{\\circ}\\cos ${B}^{\\circ}${nop}\\sin ${A}^{\\circ}\\sin ${B}^{\\circ}=${T("cos", A)}\\cdot ${T("cos", B)}${nop}${T("sin", A)}\\cdot ${T("sin", B)}`
            : `\\frac{\\tan ${A}^{\\circ}${op}\\tan ${B}^{\\circ}}{1${nop}\\tan ${A}^{\\circ}\\tan ${B}^{\\circ}}=\\frac{${T("tan", A)}${op}${T("tan", B)}}{1${nop}${T("tan", A)}\\cdot ${T("tan", B)}}`;
        return {
          q: `$\\${fn} ${deg}^{\\circ}$ の値を求めよ。`,
          ans,
          choices: choices4(r, ans, list.map((x) => tex(x[1]))),
          hint: `$${deg}^{\\circ}$ を有名角の和か差で表して，加法定理を使う。`,
          steps: [
            `$${deg}^{\\circ}=${A}^{\\circ}${op}${B}^{\\circ}$ と考える`,
            `$\\${fn}(${A}^{\\circ}${op}${B}^{\\circ})=${formula}$`,
            `答え：$${hit[1]}$`,
          ],
        };
      }),
      t("HII-sankaku-2b", (r) => {
        const type = r(0, 2);
        if (type < 2) {
          const [p, q] = pick(r, [[1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 2], [2, 7]]);
          const sg = r(0, 1) ? 1 : -1;
          const f = type === 0 ? "\\sin" : "\\cos";
          const ans = type === 0 ? fracAns(q * q - 2 * p * p, q * q) : fracAns(2 * p * p - q * q, q * q);
          return {
            q: `$${f}\\alpha=${fracTex(sg * p, q)}$ のとき，$\\cos 2\\alpha$ の値を求めよ。`,
            ans,
            hint: `2倍角の公式のうち，$${f}\\alpha$ だけで表せる形を選ぶ。`,
            steps: [
              type === 0 ? `$\\cos 2\\alpha=1-2\\sin^{2}\\alpha=1-2\\cdot ${fracTex(p * p, q * q)}$` : `$\\cos 2\\alpha=2\\cos^{2}\\alpha-1=2\\cdot ${fracTex(p * p, q * q)}-1$`,
              `答え：$${fracTex(type === 0 ? q * q - 2 * p * p : 2 * p * p - q * q, q * q)}$`,
            ],
          };
        }
        const [p, s, q] = pick(r, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17]]);
        const obtuse = r(0, 1) === 1;
        const c = obtuse ? -s : s;
        const range = obtuse ? "\\frac{\\pi}{2}<\\alpha<\\pi" : "0<\\alpha<\\frac{\\pi}{2}";
        return {
          q: `$${range}$ で $\\sin\\alpha=${fracTex(p, q)}$ のとき，$\\sin 2\\alpha$ の値を求めよ。`,
          ans: fracAns(2 * p * c, q * q),
          hint: "$\\sin 2\\alpha=2\\sin\\alpha\\cos\\alpha$。まず $\\cos\\alpha$ を符号に注意して求める。",
          steps: [
            `$\\cos^{2}\\alpha=1-${fracTex(p * p, q * q)}=${fracTex(s * s, q * q)}$，$${range}$ より $\\cos\\alpha=${fracTex(c, q)}$`,
            `$\\sin 2\\alpha=2\\cdot ${fracTex(p, q)}\\cdot ${pt(fracTex(c, q))}$`,
            `答え：$${fracTex(2 * p * c, q * q)}$`,
          ],
        };
      }),
      t("HII-sankaku-2c", (r) => {
        const alpha = pick(r, [30, 60, -30, -60, 120, 150, -120, -150, 45, -45, 135, -135]);
        const k = r(1, 2);
        const S = synth(alpha, k);
        const ans = tex(sinForm(S.RT, alpha));
        const ALL = [30, 60, -30, -60, 120, 150, -120, -150, 45, -45, 135, -135];
        return {
          q: `$${S.expr}$ を $r\\sin(\\theta+\\alpha)$ の形に表せ。ただし $r>0$，$-\\pi<\\alpha\\leqq\\pi$ とする。`,
          ans,
          choices: choices4(r, ans, [
            tex(sinForm(S.RT, normDeg(90 - alpha))),
            tex(sinForm(S.RT, -alpha)),
            tex(sinForm(String(S.R2), alpha)),
          ], () => tex(sinForm(S.RT, pick(r, ALL)))),
          hint: "点 $(a,\\ b)$ を座標平面にとり，原点からの距離 $r$ と，$x$ 軸の正の向きとのなす角 $\\alpha$ を読む。",
          steps: [
            `$r=\\sqrt{${pt(S.aT)}^{2}+${pt(S.bT)}^{2}}=${S.RT}$`,
            `$\\cos\\alpha=\\frac{${S.aT}}{${S.RT}}$，$\\sin\\alpha=\\frac{${S.bT}}{${S.RT}}$ より $\\alpha=${radTex(alpha)}$`,
            `答え：$${sinForm(S.RT, alpha)}$`,
          ],
        };
      }),
    ],
    3: [
      t("HII-sankaku-3a", (r) => {
        const fnT = pick(r, ["sin", "cos"]), other = fnT === "sin" ? "cos" : "sin";
        const p = pick(r, [1, -1]), q = pick(r, [-2, -1, 0, 1, 2]);
        const B = p + 2 * q, Cc = -p * q - 2;
        const sols = (fn, vals) => {
          const out = [];
          for (let d = 0; d < 360; d += 15) if (vals.some((v) => Math.abs(FN[fn](d * DEG) - v) < 1e-9)) out.push(d);
          return out;
        };
        const setTex = (ds) => (ds.length ? `\\theta=${ds.map(radTex).join(",\\ ")}` : null);
        const good = sols(fnT, [p / 2, q]);
        const ans = tex(setTex(good));
        const cands = [
          setTex(sols(other, [p / 2, q])),
          setTex(sols(fnT, [-p / 2, -q])),
          setTex(sols(fnT, [p / 2])),
          setTex(sols(fnT, [q, -p / 2])),
          setTex(sols(other, [-p / 2])),
        ].filter(Boolean).map(tex);
        const eq = `2\\${other}^{2}\\theta${B ? signedVar(B, `\\${fnT}\\theta`) : ""}${Cc ? signed(Cc) : ""}=0`;
        const q2 = `2\\${fnT}^{2}\\theta${B ? signedVar(-B, `\\${fnT}\\theta`) : ""}${p * q ? signed(p * q) : ""}=0`;
        const f2 = q === 0 ? `\\${fnT}\\theta` : `(\\${fnT}\\theta${signed(-q)})`;
        return {
          q: `$0\\leqq\\theta<2\\pi$ のとき，方程式 $${eq}$ を解け。`,
          ans,
          choices: choices4(r, ans, cands, () => tex(setTex(sols(pick(r, ["sin", "cos"]), [pick(r, [0.5, -0.5, 0, 1, -1])])))),
          hint: `$\\${other}^{2}\\theta=1-\\${fnT}^{2}\\theta$ で $\\${fnT}\\theta$ だけの式にする。`,
          steps: [
            `$\\${other}^{2}\\theta=1-\\${fnT}^{2}\\theta$ を代入して整理すると $${q2}$`,
            `$(2\\${fnT}\\theta${signed(-p)})${f2}=0$ より $\\${fnT}\\theta=${fracTex(p, 2)},\\ ${q}$`,
            `$-1\\leqq\\${fnT}\\theta\\leqq 1$ に注意して，答え：$${setTex(good)}$`,
          ],
        };
      }),
      t("HII-sankaku-3b", (r) => {
        const alpha = pick(r, [30, 60, -30, -60, 45, -45]), k = r(1, 2), L = pick(r, [180, 90]);
        const S = synth(alpha, k);
        const lo = alpha, hi = alpha + L;
        const pts = [lo, hi];
        for (const c of [-270, -90, 90, 270]) if (c > lo && c < hi) pts.push(c);
        const vals = pts.map((d) => S.R * Math.sin(d * DEG));
        const mx = Math.max(...vals), mn = Math.min(...vals);
        const pair = (a, b) => `最大値 $${niceTex(a)}$，最小値 $${niceTex(b)}$`;
        const ans = pair(mx, mn);
        const dom = L === 180 ? "0\\leqq\\theta\\leqq\\pi" : "0\\leqq\\theta\\leqq\\frac{\\pi}{2}";
        const ends = [S.R * Math.sin(lo * DEG), S.R * Math.sin(hi * DEG), S.R, -S.R];
        return {
          q: `$${dom}$ のとき，$y=${S.expr}$ の最大値と最小値を求めよ。`,
          ans,
          choices: choices4(r, ans, [pair(S.R, -S.R), pair(mx, -S.R), pair(S.R, mn)], () => {
            const u = pick(r, ends), v = pick(r, ends);
            return u > v + 1e-9 ? pair(u, v) : null;
          }),
          hint: "合成して $r\\sin(\\theta+\\alpha)$ の形にし，$\\theta+\\alpha$ の範囲を求める。",
          steps: [
            `$y=${sinForm(S.RT, alpha)}$`,
            `$${dom}$ より $${radTex(lo)}\\leqq\\theta${angTex(alpha)}\\leqq ${radTex(hi)}$`,
            `この範囲で $\\sin$ の最大・最小を単位円で調べる。答え：${ans}`,
          ],
        };
      }),
      t("HII-sankaku-3c", (r) => {
        const m1 = r(-4, 4);
        let m2 = r(-4, 4);
        if (m2 === m1) m2 = m1 + 1;
        if (1 + m1 * m2 === 0) return { skip: true };
        const c1 = r(-5, 5), c2 = r(-5, 5);
        const N = Math.abs(m1 - m2), D = Math.abs(1 + m1 * m2);
        return {
          q: `2直線 $y=${poly([m1, c1])}$，$y=${poly([m2, c2])}$ のなす鋭角を $\\theta$ とするとき，$\\tan\\theta$ の値を求めよ。`,
          ans: fracAns(N, D),
          hint: "2直線と $x$ 軸の正の向きとのなす角を $\\alpha,\\ \\beta$ とすると，$\\tan\\alpha,\\ \\tan\\beta$ は傾き。$\\tan(\\alpha-\\beta)$ を考える。",
          steps: [
            `$\\tan\\alpha=${m1}$，$\\tan\\beta=${m2}$ とすると $\\tan(\\alpha-\\beta)=\\frac{${m1}-${par(m2)}}{1+${par(m1)}\\cdot ${par(m2)}}=${fracTex(m1 - m2, 1 + m1 * m2)}$`,
            `鋭角なので絶対値をとって，答え：$\\tan\\theta=${fracTex(N, D)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-sankaku-4a", (r) => {
        const k = r(1, 4);
        let a = rnz(r, -2 * k, 2 * k);
        if (a * a > 2 * k * k) a = Math.sign(a) * k;
        const expr = `${k === 1 ? "" : k}\\sin\\theta\\cos\\theta${a === 1 ? "+" : a === -1 ? "-" : a > 0 ? `+${a}` : a}(\\sin\\theta+\\cos\\theta)`;
        const ans = fracAns(-(k * k + a * a), 2 * k);
        return {
          q: `$0\\leqq\\theta<2\\pi$ のとき，$y=${expr}$ の最小値を求めよ。`,
          ans,
          hint: "$t=\\sin\\theta+\\cos\\theta$ とおくと $\\sin\\theta\\cos\\theta=\\frac{t^{2}-1}{2}$。$t$ のとりうる値の範囲も忘れずに。",
          steps: [
            `$t=\\sin\\theta+\\cos\\theta=\\sqrt{2}\\sin\\left(\\theta+\\frac{\\pi}{4}\\right)$ より $-\\sqrt{2}\\leqq t\\leqq\\sqrt{2}$`,
            `$t^{2}=1+2\\sin\\theta\\cos\\theta$ より $y=${k === 2 ? "" : fracTex(k, 2)}(t^{2}-1)${signedVar(a, "t")}=${k === 2 ? "" : fracTex(k, 2)}\\left(t${a > 0 ? "+" : "-"}${fracTex(Math.abs(a), k)}\\right)^{2}-${fracTex(k * k + a * a, 2 * k)}$`,
            `$t=${fracTex(-a, k)}$ は範囲内なので，答え：最小値 $${fracTex(-(k * k + a * a), 2 * k)}$`,
          ],
        };
      }),
      t("HII-sankaku-4b", (r) => {
        const b = rnz(r, -3, 3), isSin = r(0, 1) === 1, ab = Math.abs(b);
        // 異なる4つの解 ⇔ t の方程式が -1<t<1 に異なる2解
        let lo, hi, lo2, eq, g, tv;
        if (isSin) {
          lo = [ab - 1, 1]; hi = [8 + b * b, 8]; lo2 = [-ab - 1, 1];
          eq = `\\cos 2\\theta${signedVar(b, "\\sin\\theta")}=k`;
          g = `-2t^{2}${signedVar(b, "t")}+1`; tv = "\\sin\\theta";
        } else {
          lo = [-(8 + b * b), 8]; hi = [1 - ab, 1]; lo2 = null;
          eq = `\\cos 2\\theta${signedVar(b, "\\cos\\theta")}=k`;
          g = `2t^{2}${signedVar(b, "t")}-1`; tv = "\\cos\\theta";
        }
        const L = fracTex(...lo), H = fracTex(...hi);
        const ans = tex(`${L}<k<${H}`);
        const wr = isSin
          ? [tex(`${fracTex(...lo2)}<k<${H}`), tex(`${L}\\leqq k<${H}`), tex(`${L}<k\\leqq ${H}`)]
          : [tex(`${L}<k<${1 + ab}`), tex(`${L}\\leqq k<${H}`), tex(`${L}<k\\leqq ${H}`)];
        const vt = isSin ? fracTex(b, 4) : fracTex(-b, 4);
        return {
          q: `$\\theta$ の方程式 $${eq}$ が $0\\leqq\\theta<2\\pi$ の範囲に異なる4つの解をもつような，定数 $k$ の値の範囲を求めよ。`,
          ans,
          choices: choices4(r, ans, wr),
          hint: `$t=${tv}$ とおく。$-1<t<1$ の1つの $t$ に対して $\\theta$ は2つ，$t=\\pm 1$ なら1つ。`,
          steps: [
            `$t=${tv}$ とおくと，左辺 $=${g}$（$-1\\leqq t\\leqq 1$）`,
            `$\\theta$ が4つ $\\iff$ $y=${g}$ と直線 $y=k$ が $-1<t<1$ で異なる2点で交わる`,
            `頂点は $t=${vt}$ で $y=${fracTex(...(isSin ? hi : lo))}$，端は $t=1$ で $${isSin ? b - 1 : 1 + b}$，$t=-1$ で $${isSin ? -b - 1 : 1 - b}$`,
            `グラフより，答え：$${L}<k<${H}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 指数関数
// ============================================================
/** 底 b^k の TeX（k<0 は分数） */
const powBase = (b, k) => (k === 1 ? `${b}` : k > 1 ? `${b ** k}` : `\\left(\\frac{1}{${b ** -k}}\\right)`);
/** 累乗根 */
const rootT = (q, x) => (q === 2 ? `\\sqrt{${x}}` : `\\sqrt[${q}]{${x}}`);
/** b^e の値（e<0 は分数文字列） */
const powAns = (b, e) => (e >= 0 ? b ** e : fracAns(1, b ** -e));

const SHISU = {
  id: "HII-shisu", grade: "H2", area: "func", name: "指数関数",
  desc: "指数法則・累乗根・指数方程式と不等式",
  prereqs: ["HI-jissu"],
  ...COURSE,
  points: [
    "指数法則 $a^{m}a^{n}=a^{m+n}$，$(a^{m})^{n}=a^{mn}$，$a^{-n}=\\frac{1}{a^{n}}$，$a^{\\frac{m}{n}}=\\sqrt[n]{a^{m}}$。",
    "方程式・不等式は底をそろえて指数を比べる。$a>1$ なら $a^{p}<a^{q}\\iff p<q$，$0<a<1$ なら不等号の向きが逆になる。",
    "$a^{2x}$ と $a^{x}$ が混ざる式は $t=a^{x}$ とおく。$t>0$ という条件を忘れない。",
  ],
  levels: {
    1: [
      t("HII-shisu-1a", (r) => {
        const n = pick(r, [2, 3]);
        const b = n === 2 ? r(2, 5) : r(2, 4);
        const m = pick(r, n === 2 ? [1, 3, -1, -3] : [1, 2, 4, -1, -2]);
        const expo = m > 0 ? `\\frac{${m}}{${n}}` : `-\\frac{${-m}}{${n}}`;
        return {
          q: `$${b ** n}^{${expo}}$ の値を求めよ。`,
          ans: powAns(b, m),
          hint: `$${b ** n}=${b}^{${n}}$ と表して指数法則を使う。`,
          steps: [
            `$${b ** n}^{${expo}}=(${b}^{${n}})^{${expo}}=${b}^{${m}}$`,
            `答え：$${m >= 0 ? b ** m : `\\frac{1}{${b ** -m}}`}$`,
          ],
        };
      }),
      t("HII-shisu-1b", (r) => {
        const b = pick(r, [2, 3]);
        const e = r(-3, b === 2 ? 6 : 4), p = r(-3, 5), rr = r(-3, 5), q = e - p + rr;
        if (q < -4 || q > 8) return { skip: true };
        return {
          q: `$${b}^{${p}}\\times ${b}^{${q}}\\div ${b}^{${rr}}$ を計算せよ。`,
          ans: powAns(b, e),
          hint: "かけ算は指数のたし算，わり算は指数のひき算。",
          steps: [
            `$${b}^{${p}${signed(q)}${signed(-rr)}}=${b}^{${e}}$`,
            `答え：$${e >= 0 ? b ** e : `\\frac{1}{${b ** -e}}`}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-shisu-2a", (r) => {
        const b = pick(r, [2, 3]);
        const [m, n] = sample(r, b === 2 ? [1, 2, 3, 4, -1, -2] : [1, 2, -1, -2], 2);
        const c1 = r(-3, 3), c2 = r(-3, 3);
        if (c1 === 0 && c2 === 0) return { skip: true };
        const mm = (k) => (k === 1 ? "" : k === -1 ? "-" : `${k}`);
        const e1 = poly([1, c1]), e2 = poly([1, c2]);
        return {
          q: `方程式 $${powBase(b, m)}^{${e1}}=${powBase(b, n)}^{${e2}}$ を解け。`,
          ans: fracAns(n * c2 - m * c1, m - n),
          hint: `両辺の底を ${b} にそろえて，指数を比べる。`,
          steps: [
            `底を ${b} にそろえると $${b}^{${mm(m)}(${e1})}=${b}^{${mm(n)}(${e2})}$`,
            `指数を比べて $${mm(m)}(${e1})=${mm(n)}(${e2})$`,
            `答え：$x=${fracTex(n * c2 - m * c1, m - n)}$`,
          ],
        };
      }),
      t("HII-shisu-2b", (r) => {
        const b = pick(r, [2, 3]);
        const cand = [];
        for (const q of [2, 3, 4, 5]) for (let p = 1; p <= q + 2; p++) if (gcd(p, q) === 1) cand.push([p, q]);
        const four = sample(r, cand, 4);
        if (new Set(four.map(([p, q]) => (p / q).toFixed(9))).size < 4) return { skip: true };
        const askMax = r(0, 1) === 1;
        const sorted = [...four].sort((x, y) => x[0] / x[1] - y[0] / y[1]);
        const best = askMax ? sorted[3] : sorted[0];
        const T = ([p, q]) => tex(rootT(q, b ** p));
        return {
          q: `4つの数 ${four.map(T).join("，")} のうち，${askMax ? "最も大きい" : "最も小さい"}ものを選べ。`,
          ans: T(best),
          choices: choices4(r, T(best), four.map(T)),
          hint: `すべて $${b}^{\\square}$ の形に直して指数を比べる。`,
          steps: [
            `${four.map(([p, q]) => `$${rootT(q, b ** p)}=${b}^{\\frac{${p}}{${q}}}$`).join("，")}`,
            `底 ${b} は1より大きいので，指数が大きいほど大きい`,
            `答え：${T(best)}`,
          ],
        };
      }),
    ],
    3: [
      t("HII-shisu-3a", (r) => {
        const p = r(0, 4), neg = r(0, 2) === 0;
        let r2, q2;
        if (neg) r2 = -r(1, 4);
        else { q2 = r(0, 4); if (q2 === p) q2 = (p + 1) % 5; r2 = 2 ** q2; }
        const r1 = 2 ** p, c = r1 + r2, d = r1 * r2;
        const xs = neg ? [p] : [p, q2];
        const ans = xs.reduce((x, y) => x + y, 0);
        const cT = c === 0 ? "" : c === 1 ? "-2^{x}" : c === -1 ? "+2^{x}" : c > 0 ? `-${c}\\cdot 2^{x}` : `+${-c}\\cdot 2^{x}`;
        return {
          q: `方程式 $4^{x}${cT}${signed(d)}=0$ のすべての実数解の和を求めよ。`,
          ans,
          hint: "$t=2^{x}$ とおくと $4^{x}=t^{2}$。$t>0$ に注意。",
          steps: [
            `$t=2^{x}\\ (t>0)$ とおくと $${poly([1, -c, d], "t")}=0$，$(t${signed(-r1)})(t${signed(-r2)})=0$`,
            neg ? `$t>0$ より $t=${r1}$（$t=${r2}$ は不適）` : `$t=${r1},\\ ${r2}$`,
            `$2^{x}=t$ より $x=${xs.join(",\\ ")}$。答え：和は $${ans}$`,
          ],
        };
      }),
      t("HII-shisu-3b", (r) => {
        const b = pick(r, [2, 3]), r1 = r(-3, 2), r2 = r1 + r(1, 4), S = r1 + r2, P = r1 * r2;
        const less = r(0, 1) === 1;
        const out = (u, v) => tex(`x<${u},\\ ${v}<x`), inn = (u, v) => tex(`${u}<x<${v}`);
        const ans = less ? out(r1, r2) : inn(r1, r2);
        const rhs = poly([-S, P]);
        return {
          q: `不等式 $\\left(\\frac{1}{${b}}\\right)^{x^{2}}${less ? "<" : ">"}${b}^{${rhs}}$ を解け。`,
          ans,
          choices: choices4(r, ans, [
            less ? inn(r1, r2) : out(r1, r2),
            less ? out(-r2, -r1) : inn(-r2, -r1),
            less ? tex(`x\\leqq ${r1},\\ ${r2}\\leqq x`) : tex(`${r1}\\leqq x\\leqq ${r2}`),
          ], (i) => (less ? out(r1 - i - 1, r2) : inn(r1 - i - 1, r2))),
          hint: `左辺を底 ${b} の形 $${b}^{-x^{2}}$ に直して，指数を比べる。`,
          steps: [
            `左辺 $=${b}^{-x^{2}}$。底 $${b}>1$ なので $-x^{2}${less ? "<" : ">"}${rhs}$`,
            `移項して $${poly([1, -S, P])}${less ? ">" : "<"}0$，$${fx2(r1, r2)}${less ? ">" : "<"}0$`,
            `答え：${ans}`,
          ],
        };
      }),
      t("HII-shisu-3c", (r) => {
        const lo = r(0, 1), hi = r(2, 3), a = r(1, 8), c = r(-5, 10);
        const tl = 2 ** lo, th = 2 ** hi, ts = Math.min(Math.max(a, tl), th);
        const ans = ts * ts - 2 * a * ts + c;
        return {
          q: `$${lo}\\leqq x\\leqq ${hi}$ のとき，$y=4^{x}-${a === 1 ? "" : `${a}\\cdot `}2^{x+1}${c ? signed(c) : ""}$ の最小値を求めよ。`,
          ans,
          hint: "$t=2^{x}$ とおいて $t$ の2次関数にする。$t$ の範囲に注意。",
          steps: [
            `$t=2^{x}$ とおくと $${tl}\\leqq t\\leqq ${th}$，$2^{x+1}=2t$`,
            `$y=t^{2}-${2 * a}t${c ? signed(c) : ""}=(t-${a})^{2}${c - a * a ? signed(c - a * a) : ""}$`,
            `${a === ts ? `軸 $t=${a}$ は範囲内なので` : `軸 $t=${a}$ は範囲外なので端の`} $t=${ts}$ で最小。答え：$${ans}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-shisu-4a", (r) => {
        const k = r(3, 5), p = r(1, 3), q = r(1, 3);
        const u = k * k - 2, w = u * u - 2, v = k ** 3 - 3 * k;
        return {
          q: `$x^{\\frac{1}{2}}+x^{-\\frac{1}{2}}=${k}$ のとき，$\\frac{x^{\\frac{3}{2}}+x^{-\\frac{3}{2}}+${p}}{x^{2}+x^{-2}+${q}}$ の値を求めよ。`,
          ans: fracAns(v + p, w + q),
          hint: "与式を2乗・3乗して，$x+x^{-1}$ や $x^{\\frac{3}{2}}+x^{-\\frac{3}{2}}$ を順に求める。",
          steps: [
            `2乗して $x+2+x^{-1}=${k * k}$ より $x+x^{-1}=${u}$。さらに2乗して $x^{2}+x^{-2}=${u}^{2}-2=${w}$`,
            `$x^{\\frac{3}{2}}+x^{-\\frac{3}{2}}=(x^{\\frac{1}{2}}+x^{-\\frac{1}{2}})^{3}-3(x^{\\frac{1}{2}}+x^{-\\frac{1}{2}})=${k ** 3}-${3 * k}=${v}$`,
            `与式 $=\\frac{${v}+${p}}{${w}+${q}}=${fracTex(v + p, w + q)}$`,
          ],
        };
      }),
      t("HII-shisu-4b", (r) => {
        const qs = pick(r, [[2, 3, 6], [2, 3, 4], [3, 4, 6], [2, 4, 6], [2, 3, 6]]);
        const L = qs.reduce((x, y) => lcm(x, y), 1);
        let items = null;
        for (let tries = 0; tries < 80 && !items; tries++) {
          const cand = qs.map((q) => {
            const a = r(2, q === 2 ? 6 : 10);
            return { q, a, v: a ** (L / q), real: a ** (1 / q), tx: rootT(q, a) };
          });
          if (new Set(cand.map((it) => it.v)).size < 3) continue;
          if (cand.some((it) => Math.round(it.real) ** it.q === it.a)) continue;
          const reals = cand.map((it) => it.real);
          if (Math.max(...reals) / Math.min(...reals) > 1.3) continue;
          const byV = [...cand].sort((x, y) => x.v - y.v).map((it) => it.a).join();
          const byA = [...cand].sort((x, y) => x.a - y.a).map((it) => it.a).join();
          if (byV === byA) continue;
          items = cand;
        }
        if (!items) return { skip: true };
        const order = (arr) => tex(arr.map((it) => it.tx).join("<"));
        const asc = [...items].sort((x, y) => x.v - y.v);
        const ans = order(asc);
        const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => order(p.map((i) => items[i])));
        return {
          q: `3つの数 ${items.map((it) => tex(it.tx)).join("，")} を小さい順に並べよ。`,
          ans,
          choices: choices4(r, ans, [
            order([...items].sort((x, y) => x.a - y.a || x.q - y.q)),
            order([...items].sort((x, y) => x.q - y.q || x.a - y.a)),
            order([...asc].reverse()),
            ...shuffle(r, perms),
          ]),
          hint: `どれも正の数なので，${L} 乗して整数にしてから比べる。`,
          steps: [
            `それぞれを ${L} 乗すると ${items.map((it) => `$(${it.tx})^{${L}}=${it.a}^{${L / it.q}}=${it.v}$`).join("，")}`,
            `正の数は ${L} 乗の大小と元の大小が一致する`,
            `答え：${ans}`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 対数関数
// ============================================================
/** 真数 (x-a)。a=0 なら x */
const logArg = (a) => (a === 0 ? "x" : `(${poly([1, -a])})`);
/** 4桁の常用対数（×10000 の整数）を小数の文字列に */
const dec4 = (n) => (n / 10000).toFixed(4);
/** log10 N を a=log2, b=log3 で表すベクトル（N=2^i 3^j 5^k） */
function logVec(N) {
  let i = 0, j = 0, k = 0;
  while (N % 2 === 0) { N /= 2; i++; }
  while (N % 3 === 0) { N /= 3; j++; }
  while (N % 5 === 0) { N /= 5; k++; }
  return [i - k, j, k];
}
function linAB([ca, cb, c0]) {
  let s = "";
  if (ca) s += coefVar(ca, "a");
  if (cb) s += s ? signedVar(cb, "b") : coefVar(cb, "b");
  if (c0) s += s ? signed(c0) : String(c0);
  return s || "0";
}
const LOGS = { 2: 3010, 3: 4771, 5: 6990, 6: 7781, 12: 10791, 15: 11761, 18: 12552 };
const LOGHOW = { 2: "\\log_{10}2", 3: "\\log_{10}3", 5: "1-\\log_{10}2", 6: "\\log_{10}2+\\log_{10}3", 12: "2\\log_{10}2+\\log_{10}3", 15: "\\log_{10}3+1-\\log_{10}2", 18: "\\log_{10}2+2\\log_{10}3" };

const TAISU = {
  id: "HII-taisu", grade: "H2", area: "func", name: "対数関数",
  desc: "対数の性質・底の変換・対数方程式・桁数",
  prereqs: ["HII-shisu"],
  ...COURSE,
  points: [
    "$a^{p}=M \\iff p=\\log_{a}M$。$\\log_{a}MN=\\log_{a}M+\\log_{a}N$，$\\log_{a}\\frac{M}{N}=\\log_{a}M-\\log_{a}N$，$\\log_{a}M^{k}=k\\log_{a}M$（$\\log_{a}(M+N)$ は分けられない）。",
    "底の変換 $\\log_{a}b=\\frac{\\log_{c}b}{\\log_{c}a}$。",
    "対数の方程式・不等式は，はじめに真数条件（真数 $>0$）を確認。底が $0<a<1$ なら不等号の向きが逆になる。",
    "桁数：$N$ が $n$ 桁 $\\iff 10^{n-1}\\leqq N<10^{n}$。$\\log_{10}N$ の整数部分に1を足すと桁数。",
  ],
  levels: {
    1: [
      t("HII-taisu-1a", (r) => {
        const a = pick(r, [2, 3, 5]), maxK = a === 2 ? 5 : a === 3 ? 4 : 3, type = r(0, 3);
        const ks = [];
        for (let x = 1; x <= maxK; x++) if ((type !== 2 || x % 2 === 1) && (type !== 3 || x % 3 !== 0)) ks.push(x);
        const k = pick(r, ks);
        const [argT, n, d, how] = [
          [`${a ** k}`, k, 1, `${a ** k}=${a}^{${k}}`],
          [`\\frac{1}{${a ** k}}`, -k, 1, `\\frac{1}{${a ** k}}=${a}^{-${k}}`],
          [`\\sqrt{${a ** k}}`, k, 2, `\\sqrt{${a ** k}}=${a}^{\\frac{${k}}{2}}`],
          [`\\sqrt[3]{${a ** k}}`, k, 3, `\\sqrt[3]{${a ** k}}=${a}^{\\frac{${k}}{3}}`],
        ][type];
        return {
          q: `$\\log_{${a}}${argT}$ の値を求めよ。`,
          ans: fracAns(n, d),
          hint: `真数を $${a}^{\\square}$ の形で表す。`,
          steps: [`$${how}$`, `答え：$${fracTex(n, d)}$`],
        };
      }),
      t("HII-taisu-1b", (r) => {
        if (r(0, 1) === 1) {
          const a = pick(r, [6, 10, 12]), k = r(1, 2), N = a ** k;
          const isPow = (x) => { let y = x; while (y % a === 0) y /= a; return y === 1; };
          const divs = [];
          for (let M = 2; M < N; M++) if (N % M === 0 && !isPow(M)) divs.push(M);
          const M = pick(r, divs);
          return {
            q: `$\\log_{${a}}${M}+\\log_{${a}}${N / M}$ を計算せよ。`,
            ans: k,
            hint: "$\\log_{a}M+\\log_{a}N=\\log_{a}MN$ でまとめる。",
            steps: [`$\\log_{${a}}(${M}\\times ${N / M})=\\log_{${a}}${N}=\\log_{${a}}${a}^{${k}}$`, `答え：$${k}$`],
          };
        }
        const a = pick(r, [2, 3, 5]), k = r(1, a === 2 ? 3 : 2);
        const Q = pick(r, [3, 5, 7, 6, 10].filter((x) => x % a !== 0 || x === 6 || x === 10).filter((x) => x !== a));
        return {
          q: `$\\log_{${a}}${a ** k * Q}-\\log_{${a}}${Q}$ を計算せよ。`,
          ans: k,
          hint: "$\\log_{a}M-\\log_{a}N=\\log_{a}\\frac{M}{N}$ でまとめる。",
          steps: [`$\\log_{${a}}\\frac{${a ** k * Q}}{${Q}}=\\log_{${a}}${a ** k}$`, `答え：$${k}$`],
        };
      }),
    ],
    2: [
      t("HII-taisu-2a", (r) => {
        const [a, b] = sample(r, [2, 3, 5], 2);
        const lim = (x) => (x === 2 ? 4 : x === 3 ? 3 : 2);
        const p = r(1, lim(a)), s = r(1, lim(a)), q = r(1, lim(b)), rr = r(1, lim(b));
        if (q * s === p * rr && r(0, 2) > 0) return { skip: true };
        return {
          q: `$\\log_{${a ** p}}${b ** q}\\cdot\\log_{${b ** rr}}${a ** s}$ の値を求めよ。`,
          ans: fracAns(q * s, p * rr),
          hint: "底の変換公式で，底を共通（たとえば 10）にそろえる。",
          steps: [
            `$\\log_{${a ** p}}${b ** q}=\\frac{${q === 1 ? "" : q}\\log ${b}}{${p === 1 ? "" : p}\\log ${a}}$，$\\log_{${b ** rr}}${a ** s}=\\frac{${s === 1 ? "" : s}\\log ${a}}{${rr === 1 ? "" : rr}\\log ${b}}$`,
            `かけると $\\log ${a}$ と $\\log ${b}$ が約分されて $${p * rr === 1 ? q * s : `\\frac{${q * s}}{${p * rr}}`}$`,
            `答え：$${fracTex(q * s, p * rr)}$`,
          ],
        };
      }),
      t("HII-taisu-2b", (r) => {
        const i = r(0, 3), j = r(0, 3), k = i + j;
        if (k === 0 || i === j) return { skip: true }; // i=j だと同じ log を2つ並べた式になる
        const x1 = r(-3, 8), a = x1 - 2 ** i, b = x1 - 2 ** j, x2 = a + b - x1;
        return {
          q: `方程式 $\\log_{2}${logArg(a)}+\\log_{2}${logArg(b)}=${k}$ を解け。`,
          ans: x1,
          hint: "まず真数条件を確認。左辺を1つの log にまとめる。",
          steps: [
            `真数条件より $x>${Math.max(a, b)}$`,
            `$\\log_{2}${fx2(a, b)}=\\log_{2}${2 ** k}$ より $${poly([1, -(a + b), a * b - 2 ** k])}=0$`,
            `$${x1 === x2 ? `(${poly([1, -x1])})^{2}` : fx2(x1, x2)}=0$ より $x=${[...new Set([x1, x2])].join(",\\ ")}$`,
            `真数条件をみたすのは，答え：$x=${x1}$`,
          ],
        };
      }),
      t("HII-taisu-2c", (r) => {
        const b = pick(r, [2, 3, 6, 12, 18, 5, 15]), n = r(15, 80);
        const L = n * LOGS[b], ip = Math.floor(L / 10000);
        if (Math.floor(n * Math.log10(b)) !== ip) return { skip: true };
        return {
          q: `$${b}^{${n}}$ は何桁の整数か。ただし $\\log_{10}2=0.3010$，$\\log_{10}3=0.4771$ とする。`,
          ans: ip + 1,
          unit: "桁",
          hint: "$\\log_{10}N$ を計算し，その整数部分を見る。",
          steps: [
            b === 2 || b === 3 ? `$\\log_{10}${b}=${dec4(LOGS[b])}$` : `$\\log_{10}${b}=${LOGHOW[b]}=${dec4(LOGS[b])}$`,
            `$\\log_{10}${b}^{${n}}=${n}\\times ${dec4(LOGS[b])}=${dec4(L)}$`,
            `$${ip}\\leqq\\log_{10}${b}^{${n}}<${ip + 1}$ より $10^{${ip}}\\leqq ${b}^{${n}}<10^{${ip + 1}}$。答え：$${ip + 1}$ 桁`,
          ],
        };
      }),
    ],
    3: [
      t("HII-taisu-3a", (r) => {
        const i = r(0, 1), j = r(i + 1, 3), k = i + j, a = r(-3, 5), b = a - (2 ** j - 2 ** i);
        const x1 = a + 2 ** i, x2 = a + b - x1;
        const ans = tex(`${a}<x\\leqq ${x1}`);
        return {
          q: `不等式 $\\log_{\\frac{1}{2}}${logArg(a)}+\\log_{\\frac{1}{2}}${logArg(b)}\\geqq ${-k}$ を解け。`,
          ans,
          choices: choices4(r, ans, [tex(`x\\geqq ${x1}`), tex(`${x2}\\leqq x\\leqq ${x1}`), tex(`${b}<x\\leqq ${x1}`)],
            (ii) => tex(`${a}<x<${x1 + ii + 1}`)),
          hint: "真数条件を先に求める。底 $\\frac{1}{2}$ は1より小さいので，真数を比べると不等号の向きが逆になる。",
          steps: [
            `真数条件：$x>${a}$ かつ $x>${b}$ より $x>${a}$`,
            `$\\log_{\\frac{1}{2}}${fx2(a, b)}\\geqq\\log_{\\frac{1}{2}}${2 ** k}$ で底が1より小さいので $${fx2(a, b)}\\leqq ${2 ** k}$`,
            `$${poly([1, -(a + b), a * b - 2 ** k])}\\leqq 0$ より $${x2}\\leqq x\\leqq ${x1}$`,
            `真数条件と合わせて，答え：$${a}<x\\leqq ${x1}$`,
          ],
        };
      }),
      t("HII-taisu-3b", (r) => {
        const u = r(0, 3), v = u + r(1, 4), m = r(Math.max(1, Math.ceil((u + v) / 2) - 1), u + v);
        const tl = 0, th = m;
        const ts = Math.min(Math.max((u + v) / 2, tl), th);
        const val = (tt) => (tt - u) * (tt - v);
        const [n, d] = Number.isInteger(ts) ? [val(ts), 1] : [-(v - u) * (v - u), 4];
        const lg = (w) => (w === 0 ? "\\log_{2}x" : `\\log_{2}\\frac{x}{${2 ** w}}`);
        return {
          q: `$1\\leqq x\\leqq ${2 ** m}$ のとき，$y=${lg(u)}\\cdot ${lg(v)}$ の最小値を求めよ。`,
          ans: fracAns(n, d),
          hint: "$t=\\log_{2}x$ とおくと，$y$ は $t$ の2次関数。$t$ の範囲も求める。",
          steps: [
            `$t=\\log_{2}x$ とおくと $0\\leqq t\\leqq ${m}$，$y=(t${signed(-u)})(t${signed(-v)})$`.replace("(t+0)", "t"),
            `軸は $t=${fracTex(u + v, 2)}$${ts === (u + v) / 2 ? "（範囲内）" : "（範囲外）"}`,
            `$t=${fracTex(Math.round(ts * 2), 2)}$ で最小。答え：$${fracTex(n, d)}$`,
          ],
        };
      }),
      t("HII-taisu-3c", (r) => {
        const P = [2, 3, 4, 5, 6, 8, 9, 12, 15, 18];
        if (r(0, 1) === 1) {
          const i = r(0, 3), j = r(0, 2), k = r(1, 2), N = 2 ** i * 3 ** j * 5 ** k;
          if (N > 500 || (j === 0 && i === k)) return { skip: true };
          const v = logVec(N);
          const ans = tex(linAB(v));
          return {
            q: `$\\log_{10}2=a$，$\\log_{10}3=b$ とするとき，$\\log_{10}${N}$ を $a,\\ b$ で表せ。`,
            ans,
            choices: choices4(r, ans, [tex(linAB([i + k, j + k, 0])), tex(linAB([i + k, j, k])), tex(linAB([i - k, j, -k]))],
              (ii) => tex(linAB([v[0], v[1], v[2] + ii + 1]))),
            hint: "$\\log_{10}5=\\log_{10}\\frac{10}{2}=1-a$ を使う。",
            steps: [
              `$${N}=${[i ? `2^{${i}}` : "", j ? `3^{${j}}` : "", `5^{${k}}`].filter(Boolean).join("\\cdot ")}$，$\\log_{10}5=1-a$`,
              `$\\log_{10}${N}=${[i ? `${i === 1 ? "" : i}a` : "", j ? `${j === 1 ? "" : j}b` : "", `${k === 1 ? "" : k}(1-a)`].filter(Boolean).join("+")}$`,
              `答え：$${linAB(v)}$`,
            ],
          };
        }
        const [m, n] = sample(r, P, 2);
        const same = (x, y) => ([2, 4, 8].includes(x) && [2, 4, 8].includes(y)) || ([3, 9].includes(x) && [3, 9].includes(y));
        // 4 と 9 の組は答えが 2b/2a（約分できる形）になるので除く
        if (same(m, n) || (m === 4 && n === 9) || (m === 9 && n === 4)) return { skip: true };
        const vm = logVec(m), vn = logVec(n);
        const fr = (top, bot) => tex(`\\frac{${linAB(top)}}{${linAB(bot)}}`);
        const bad5 = (v) => [v[0] + 2 * v[2], v[1] + v[2], 0];
        const ans = fr(vn, vm);
        return {
          q: `$\\log_{10}2=a$，$\\log_{10}3=b$ とするとき，$\\log_{${m}}${n}$ を $a,\\ b$ で表せ。`,
          ans,
          choices: choices4(r, ans, [fr(vm, vn), fr(bad5(vn), bad5(vm)), tex(linAB([vn[0] - vm[0], vn[1] - vm[1], vn[2] - vm[2]]))],
            (ii) => fr([vn[0] + ii + 1, vn[1], vn[2]], vm)),
          hint: "底を 10 にそろえる：$\\log_{m}n=\\frac{\\log_{10}n}{\\log_{10}m}$。$\\log_{10}5=1-a$。",
          steps: [
            `$\\log_{${m}}${n}=\\frac{\\log_{10}${n}}{\\log_{10}${m}}$`,
            `$\\log_{10}${n}=${linAB(vn)}$，$\\log_{10}${m}=${linAB(vm)}$`,
            `答え：$\\frac{${linAB(vn)}}{${linAB(vm)}}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-taisu-4a", (r) => {
        const LG = [0, 0, 3010, 4771, 6020, 6990, 7781, 8451, 9030, 9542, 10000];
        const b = pick(r, [2, 3, 6]), n = r(20, 60);
        const L = n * LOGS[b], ip = Math.floor(L / 10000), f = L - ip * 10000;
        let d = 1;
        for (let k = 9; k >= 1; k--) if (LG[k] <= f) { d = k; break; }
        const big = (BigInt(b) ** BigInt(n)).toString();
        if (Number(big[0]) !== d || big.length !== ip + 1) return { skip: true };
        return {
          q: `$${b}^{${n}}$ の最高位の数字を求めよ。ただし $\\log_{10}2=0.3010$，$\\log_{10}3=0.4771$，$\\log_{10}7=0.8451$ とする。`,
          ans: d,
          hint: "$\\log_{10}N$ の小数部分が，$\\log_{10}1,\\ \\log_{10}2,\\ \\cdots,\\ \\log_{10}9$ のどの間にあるかを調べる。",
          steps: [
            `$\\log_{10}${b}^{${n}}=${n}\\times ${dec4(LOGS[b])}=${dec4(L)}=${ip}+${dec4(f)}$`,
            `$\\log_{10}${d}=${dec4(LG[d])}\\leqq ${dec4(f)}<${dec4(LG[d + 1])}=\\log_{10}${d + 1}$`,
            `よって $${d}\\times 10^{${ip}}\\leqq ${b}^{${n}}<${d + 1}\\times 10^{${ip}}$。答え：$${d}$`,
          ],
        };
      }),
      t("HII-taisu-4b", (r) => {
        const [p, q, L] = pick(r, [[2, 3, 3010 - 4771], [3, 4, 4771 - 6020], [4, 5, 6020 - 6990], [3, 5, 4771 - 6990], [5, 6, 6990 - 7781], [2, 5, 3010 - 6990], [9, 10, 9542 - 10000]]);
        const k = r(1, 4);
        const n = Math.floor((k * 10000) / -L) + 1;
        const tl = Math.log10(p / q);
        if (!(n * tl < -k && (n - 1) * tl >= -k)) return { skip: true };
        const big = r(0, 1) === 1;
        const cond = big ? `\\left(\\frac{${q}}{${p}}\\right)^{n}>10^{${k}}` : `\\left(\\frac{${p}}{${q}}\\right)^{n}<10^{-${k}}`;
        return {
          q: `$${cond}$ をみたす最小の自然数 $n$ を求めよ。ただし $\\log_{10}2=0.3010$，$\\log_{10}3=0.4771$ とする。`,
          ans: n,
          hint: "両辺の常用対数をとる。負の数で割るときは不等号の向きに注意。",
          steps: [
            `$\\log_{10}\\frac{${p}}{${q}}=\\log_{10}${p}-\\log_{10}${q}=${dec4(L)}$`,
            big ? `両辺の常用対数をとると $${dec4(-L)}n>${k}$` : `両辺の常用対数をとると $${dec4(L)}n<-${k}$`,
            `$n>\\frac{${k}}{${dec4(-L)}}=${(Math.floor((k * 1000000) / -L) / 100).toFixed(2)}\\cdots$ より，答え：$n=${n}$`,
          ],
        };
      }),
      t("HII-taisu-4c", (r) => {
        const r1 = rnz(r, -3, 4);
        let r2 = rnz(r, -3, 4);
        if (r2 === r1) r2 = -r1 === r1 ? 1 : r1 + 1 === 0 ? 2 : r1 + 1;
        const b = r1 + r2, c = -r1 * r2;
        if (b === 0 || r1 === r2) return { skip: true };
        const coefT = c >= 0 ? `${2 ** c}` : `\\frac{1}{${2 ** -c}}`;
        const xT = b === 1 ? "x" : `x^{${b}}`;
        return {
          q: `方程式 $x^{\\log_{2}x}=${coefT}${xT}$ のすべての解の積を求めよ。`,
          ans: powAns(2, b),
          hint: "両辺の $2$ を底とする対数をとり，$t=\\log_{2}x$ の2次方程式にする。",
          steps: [
            `$x>0$。両辺の $\\log_{2}$ をとると $(\\log_{2}x)^{2}=${c}${signedVar(b, "\\log_{2}x")}$`,
            `$t=\\log_{2}x$ とおくと $${poly([1, -b, -c], "t")}=0$，解は $t=${Math.min(r1, r2)},\\ ${Math.max(r1, r2)}$`,
            `解の積は $2^{t_{1}}\\cdot 2^{t_{2}}=2^{t_{1}+t_{2}}=2^{${b}}$。答え：$${b >= 0 ? 2 ** b : `\\frac{1}{${2 ** -b}}`}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 微分
// ============================================================
/** f(x)=s{x^3 - (3/2)(α+β)x^2 + 3αβx} + d（α+β は偶数） */
function cubicAB(s, al, be, d) {
  const co = [s, (-s * 3 * (al + be)) / 2, s * 3 * al * be, d];
  const f = (x) => co[0] * x ** 3 + co[1] * x ** 2 + co[2] * x + co[3];
  return { co, f };
}
const range2 = (lo, hi, v = "k", eq = false) => tex(`${lo}${eq ? "\\leqq " : "<"}${v}${eq ? "\\leqq " : "<"}${hi}`);

const BIBUN = {
  id: "HII-bibun", grade: "H2", area: "func", name: "微分",
  desc: "導関数・接線・増減・極値・最大最小",
  prereqs: ["HI-saidai", "HII-zuhou"],
  ...COURSE,
  points: [
    "$(x^{n})'=nx^{n-1}$，定数の微分は $0$。$f'(a)$ は $x=a$ における接線の傾き。",
    "接線の方程式：$y-f(a)=f'(a)(x-a)$。",
    "$f'(x)$ の符号で増減表をつくる。$f'$ が $+$ から $-$ に変わる点で極大，$-$ から $+$ で極小。",
    "区間での最大・最小は「極値」と「区間の端の値」を比べる。方程式 $f(x)=k$ の実数解の個数は，$y=f(x)$ と $y=k$ の共有点の個数。",
  ],
  levels: {
    1: [
      t("HII-bibun-1a", (r) => {
        const a = rnz(r, -3, 3), b = r(-5, 5), c = r(-5, 5), d = r(-5, 5), k = r(-3, 3);
        const ans = 3 * a * k * k + 2 * b * k + c;
        return {
          q: `$f(x)=${poly([a, b, c, d])}$ のとき，$f'(${k})$ の値を求めよ。`,
          ans,
          hint: "まず導関数 $f'(x)$ を求めてから $x$ に代入する。",
          steps: [`$f'(x)=${poly([3 * a, 2 * b, c])}$`, `$f'(${k})=${ans}$`],
        };
      }),
      t("HII-bibun-1b", (r) => {
        const a = rnz(r, -4, 4), b = r(-5, 5), c = rnz(r, -6, 6), d = rnz(r, -5, 5);
        const ans = tex(poly([3 * a, 2 * b, c]));
        return {
          q: `$f(x)=${poly([a, b, c, d])}$ の導関数 $f'(x)$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(poly([a, b, c])), tex(poly([3 * a, 2 * b, c + d])), tex(poly([3 * a, 2 * b]))],
            (i) => tex(poly([3 * a, 2 * b + i + 1, c]))),
          hint: "$(x^{n})'=nx^{n-1}$。定数項は微分すると $0$。",
          steps: [
            `$f'(x)=${a}\\cdot 3x^{2}${signed(b)}\\cdot 2x${signed(c)}+0$`,
            `答え：$${poly([3 * a, 2 * b, c])}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-bibun-2a", (r) => {
        const a = pick(r, [1, -1]), b = r(-3, 3), c = r(-4, 4), d = r(-5, 5), x0 = rnz(r, -2, 2);
        const f = (x) => a * x ** 3 + b * x ** 2 + c * x + d, fp = (x) => 3 * a * x * x + 2 * b * x + c;
        const m = fp(x0), y0 = f(x0), n = y0 - m * x0;
        const ans = tex(`y=${poly([m, n])}`);
        return {
          q: `曲線 $y=${poly([a, b, c, d])}$ 上の点 $(${x0},\\ ${y0})$ における接線の方程式を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(`y=${poly([m, y0])}`), tex(`y=${poly([m, y0 + m * x0])}`), tex(`y=${poly([y0, n])}`)],
            (i) => tex(`y=${poly([m, n + i + 1])}`)),
          hint: "接線の傾きは $f'(a)$。$y-f(a)=f'(a)(x-a)$ に代入する。",
          steps: [
            `$y'=${poly([3 * a, 2 * b, c])}$ より，傾きは $${m}$`,
            `$y-${par(y0)}=${m}(x-${par(x0)})$`,
            `答え：$y=${poly([m, n])}$`,
          ],
        };
      }),
      t("HII-bibun-2b", (r) => {
        const al = r(-3, 2), be = al + 2 * r(1, 2), s = pick(r, [1, -1]), d = r(-5, 5);
        const { co, f } = cubicAB(s, al, be, d);
        const askMax = r(0, 1) === 1;
        const at = (s > 0) === askMax ? al : be;
        return {
          q: `関数 $f(x)=${poly(co)}$ の${askMax ? "極大値" : "極小値"}を求めよ。`,
          ans: f(at),
          hint: "$f'(x)=0$ となる $x$ を求め，$f'(x)$ の符号の変化（増減表）を調べる。",
          steps: [
            `$f'(x)=${poly([3 * s, -3 * s * (al + be), 3 * s * al * be])}=${s < 0 ? "-" : ""}3${fx2(al, be)}$`,
            `$f'(x)$ の符号は $x=${al}$ の前後で ${s > 0 ? "$+$ から $-$" : "$-$ から $+$"}，$x=${be}$ の前後で ${s > 0 ? "$-$ から $+$" : "$+$ から $-$"}`,
            `${askMax ? "極大" : "極小"}は $x=${at}$ のとき。答え：$f(${at})=${f(at)}$`,
          ],
        };
      }),
      t("HII-bibun-2c", (r) => {
        const al = r(-3, 2), be = al + 2 * r(1, 2), c = r(-5, 5);
        const { co, f } = cubicAB(1, al, be, c);
        return {
          q: `関数 $f(x)=x^{3}+ax^{2}+bx+c$ は $x=${al}$ で極大値 $${f(al)}$ をとり，$x=${be}$ で極小値をとる。極小値を求めよ。`,
          ans: f(be),
          hint: "$f'(x)=3(x-\\alpha)(x-\\beta)$ と表せることから $a,\\ b$ を決め，極大値の条件から $c$ を決める。",
          steps: [
            `$f'(x)=3${fx2(al, be)}=${poly([3, -3 * (al + be), 3 * al * be])}$ より $a=${co[1]}$，$b=${co[2]}$`,
            `$f(${al})=${f(al) - c}+c=${f(al)}$ より $c=${c}$`,
            `答え：極小値 $f(${be})=${f(be)}$`,
          ],
        };
      }),
    ],
    3: [
      t("HII-bibun-3a", (r) => {
        const al = r(-2, 1), be = al + 2 * r(1, 2), s = pick(r, [1, -1]), d = r(-4, 4);
        const { co, f } = cubicAB(s, al, be, d);
        const lo = al - r(0, 2), hi = be + r(-1, 2);
        if (hi <= al) return { skip: true };
        const cands = [lo, hi, al, be].filter((x) => x >= lo && x <= hi);
        const uniq = [...new Set(cands)].sort((x, y) => x - y);
        const askMax = r(0, 1) === 1;
        const vals = uniq.map(f);
        const ans = askMax ? Math.max(...vals) : Math.min(...vals);
        return {
          q: `関数 $f(x)=${poly(co)}$ の $${lo}\\leqq x\\leqq ${hi}$ における${askMax ? "最大値" : "最小値"}を求めよ。`,
          ans,
          hint: "増減表をかき，極値と区間の両端の値を比べる。",
          steps: [
            `$f'(x)=${s < 0 ? "-" : ""}3${fx2(al, be)}$ より $x=${al},\\ ${be}$ で $f'(x)=0$`,
            `候補の値：${uniq.map((x) => `$f(${x})=${f(x)}$`).join("，")}`,
            `答え：${askMax ? "最大値" : "最小値"} $${ans}$`,
          ],
        };
      }),
      t("HII-bibun-3b", (r) => {
        const m = rnz(r, -4, 4), c = r(-5, 5);
        const lo = Math.min(0, 3 * m), hi = Math.max(0, 3 * m);
        const out = (u, v, eq) => tex(`k${eq ? "\\leqq " : "<"}${u},\\ ${v}${eq ? "\\leqq " : "<"}k`);
        const ans = out(lo, hi);
        return {
          q: `関数 $f(x)=x^{3}+kx^{2}${signedVar(m, "kx")}${c ? signed(c) : ""}$ が極値をもつような，定数 $k$ の値の範囲を求めよ。`,
          ans,
          choices: choices4(r, ans, [range2(lo, hi), out(lo, hi, true), out(Math.min(0, m), Math.max(0, m))],
            (i) => out(lo - i - 1, hi)),
          hint: "3次関数が極値をもつ $\\iff$ $f'(x)=0$ が異なる2つの実数解をもつ（判別式 $>0$）。",
          steps: [
            `$f'(x)=3x^{2}+2kx${signedVar(m, "k")}$`,
            `$\\frac{D}{4}=k^{2}-${m === 1 ? "3" : `3\\cdot ${par(m)}`}k=k(k${signed(-3 * m)})>0$`,
            `答え：$k<${lo},\\ ${hi}<k$`,
          ],
        };
      }),
      t("HII-bibun-3c", (r) => {
        const al = r(-3, 1), be = al + r(1, 3);
        const co = [2, -3 * (al + be), 6 * al * be, 0];
        const f = (x) => 2 * x ** 3 + co[1] * x * x + co[2] * x;
        const M = f(al), m = f(be);
        const ans = range2(m, M);
        return {
          q: `方程式 $${poly(co)}=k$ が異なる3つの実数解をもつような，定数 $k$ の値の範囲を求めよ。`,
          ans,
          choices: choices4(r, ans, [range2(m, M, "k", true), tex(`k<${m},\\ ${M}<k`), range2(-M, -m)],
            (i) => range2(m - i - 1, M)),
          hint: "$y=f(x)$ のグラフと直線 $y=k$ の共有点が3つになる条件を考える。極大値・極小値を求める。",
          steps: [
            `$f(x)=${poly(co)}$ とおくと $f'(x)=6${fx2(al, be)}$`,
            `極大値 $f(${al})=${M}$，極小値 $f(${be})=${m}$`,
            `直線 $y=k$ が極小値と極大値の間にあればよい。答え：$${m}<k<${M}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-bibun-4a", (r) => {
        const a = rnz(r, -3, 3), c = r(-3, 3);
        const g0 = c * a, ga = a ** 3 + c * a;
        const lo = Math.min(g0, ga), hi = Math.max(g0, ga);
        const ans = range2(lo, hi);
        return {
          q: `点 $(${a},\\ k)$ から曲線 $y=${poly([1, 0, c, 0])}$ に異なる3本の接線が引けるような，定数 $k$ の値の範囲を求めよ。`,
          ans,
          choices: choices4(r, ans, [range2(lo, hi, "k", true), tex(`k<${lo},\\ ${hi}<k`), range2(Math.min(0, a ** 3), Math.max(0, a ** 3))],
            (i) => range2(lo - i - 1, hi + i)),
          hint: "接点の $x$ 座標を $t$ とおいて接線の式をつくり，点を通る条件を $t$ の3次方程式にする。3次関数では，異なる接点の数＝接線の本数。",
          steps: [
            `接点 $t$ での接線は $y=(${poly([3, 0, c], "t")})x-2t^{3}$`,
            `点 $(${a},\\ k)$ を通るので $k=g(t)=${poly([-2, 3 * a, 0, c * a], "t")}$`,
            `$g'(t)=${poly([-6, 6 * a, 0], "t")}=-6t(t${signed(-a)})$ より極値は $g(0)=${g0}$，$g(${a})=${ga}$`,
            `$k=g(t)$ が異なる3つの実数解をもつ条件から，答え：$${lo}<k<${hi}$`,
          ],
        };
      }),
      t("HII-bibun-4b", (r) => {
        const p = rnz(r, -4, 4), q = r(-3, 3);
        const L = fracTex(4 * q - p * p, 4);
        const ans = tex(`${L}<m<${q},\\ ${q}<m`);
        return {
          q: `曲線 $y=${poly([1, p, q, 0])}$ と直線 $y=mx$ が異なる3点で交わるような，定数 $m$ の値の範囲を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(`${L}<m`), tex(`m<${L}`), tex(`${L}\\leqq m<${q},\\ ${q}<m`)]),
          hint: "連立して $x(\\cdots)=0$ と因数分解。$x=0$ 以外に，$0$ でない異なる2つの解が必要。",
          steps: [
            `$${poly([1, p, q, 0])}=mx$ より $x(x^{2}${signedVar(p)}${q ? signed(q) : ""}-m)=0$`,
            `$x^{2}${signedVar(p)}${q ? signed(q) : ""}-m=0$ が $0$ でない異なる2つの実数解をもてばよい`,
            `判別式 $${p * p}-4(${q === 0 ? "-m" : `${q}-m`})>0$ より $m>${L}$。また $x=0$ が解にならないので $m\\neq ${q}$`,
            `答え：$${L}<m<${q},\\ ${q}<m$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 積分
// ============================================================
/** 分数係数の多項式 terms=[[分子, 分母, 次数], ...] */
function polyQ(terms, v = "x") {
  let s = "";
  for (const [n, d, e] of terms) {
    if (n === 0) continue;
    const [a, b] = reduce(n, d);
    const abs = Math.abs(a);
    const coef = b === 1 ? (abs === 1 && e > 0 ? "" : String(abs)) : `\\frac{${abs}}{${b}}`;
    const body = e === 0 ? coef || "1" : `${coef}${xp(e, v)}`;
    s += (a < 0 ? "-" : s ? "+" : "") + body;
  }
  return s || "0";
}

const SEKIBUN = {
  id: "HII-sekibun", grade: "H2", area: "func", name: "積分",
  desc: "不定積分・定積分・面積",
  prereqs: ["HII-bibun"],
  ...COURSE,
  points: [
    "$\\int x^{n}dx=\\frac{x^{n+1}}{n+1}+C$（$C$ は積分定数）。$\\int_{a}^{b}f(x)dx=F(b)-F(a)$。",
    "面積は，交点の $x$ 座標を求めてから「上の式 − 下の式」を積分する：$\\int_{a}^{b}\\{f(x)-g(x)\\}dx$（$a\\leqq x\\leqq b$ で $f(x)\\geqq g(x)$）。",
    "$\\int_{\\alpha}^{\\beta}(x-\\alpha)(x-\\beta)dx=-\\frac{(\\beta-\\alpha)^{3}}{6}$。放物線と直線で囲まれた面積はこれで速く求まる。",
    "$\\frac{d}{dx}\\int_{a}^{x}f(t)dt=f(x)$。$\\int_{a}^{b}f(t)dt$ は定数なので文字でおく。",
  ],
  levels: {
    1: [
      t("HII-sekibun-1a", (r) => {
        const a = pick(r, [3, 6, -3, 9, -6]), b = pick(r, [2, 4, -2, -4, 6, 0]), c = rnz(r, -5, 5);
        const F = poly([a / 3, b / 2, c, 0]);
        const ans = tex(`${F}+C`);
        return {
          q: `不定積分 $\\int(${poly([a, b, c])})\\,dx$ を求めよ。ただし $C$ は積分定数とする。`,
          ans,
          choices: choices4(r, ans, [tex(F), tex(`${poly([a, b, c, 0])}+C`), tex(`${poly([2 * a, b])}+C`)],
            (i) => tex(`${poly([a / 3, b / 2 + i + 1, c, 0])}+C`)),
          hint: "$\\int x^{n}dx=\\frac{x^{n+1}}{n+1}+C$。積分定数を忘れずに。",
          steps: [
            `$\\int(${poly([a, b, c])})\\,dx=${a}\\cdot\\frac{x^{3}}{3}${b ? `${signed(b)}\\cdot\\frac{x^{2}}{2}` : ""}${signedVar(c)}+C$`,
            `答え：$${F}+C$`,
          ],
        };
      }),
      t("HII-sekibun-1b", (r) => {
        const a = rnz(r, -3, 3), b = r(-4, 4), c = r(-4, 4), p = r(-2, 2), q = p + r(1, 3);
        const F6 = (x) => 2 * a * x ** 3 + 3 * b * x * x + 6 * c * x;
        const num = F6(q) - F6(p);
        return {
          q: `定積分 $\\int_{${p}}^{${q}}(${poly([a, b, c])})\\,dx$ を求めよ。`,
          ans: fracAns(num, 6),
          hint: "原始関数 $F(x)$ を1つ求め，$F(b)-F(a)$（上端の値 − 下端の値）を計算する。",
          steps: [
            `原始関数は $F(x)=${polyQ([[a, 3, 3], [b, 2, 2], [c, 1, 1]])}$`,
            `$F(${q})-F(${p})=${fracTex(F6(q), 6)}-${pt(fracTex(F6(p), 6))}$`,
            `答え：$${fracTex(num, 6)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HII-sekibun-2a", (r) => {
        const a = rnz(r, -3, 3), al = r(-3, 2), be = al + r(1, 4);
        const co = [a, -a * (al + be), a * al * be];
        const w = be - al;
        return {
          q: `放物線 $y=${poly(co)}$ と $x$ 軸で囲まれた部分の面積を求めよ。`,
          ans: fracAns(Math.abs(a) * w ** 3, 6),
          hint: "$x$ 軸との交点を求め，$\\int_{\\alpha}^{\\beta}(x-\\alpha)(x-\\beta)dx=-\\frac{(\\beta-\\alpha)^{3}}{6}$ を使う。",
          steps: [
            `$${poly(co)}=${a === 1 ? "" : a === -1 ? "-" : a}${fx2(al, be)}$ より交点は $x=${al},\\ ${be}$`,
            `${a > 0 ? "この区間で放物線は $x$ 軸の下側" : "この区間で放物線は $x$ 軸の上側"}なので $S=${a > 0 ? "-" : ""}\\int_{${al}}^{${be}}${a === 1 || a === -1 ? (a > 0 ? "" : "-") : a}${fx2(al, be)}dx$`,
            `$S=\\frac{${Math.abs(a) === 1 ? "" : Math.abs(a)}(${be}-${par(al)})^{3}}{6}=${fracTex(Math.abs(a) * w ** 3, 6)}$`,
          ],
        };
      }),
      t("HII-sekibun-2b", (r) => {
        const m = r(-3, 3), n = r(-3, 3), al = r(-3, 1), be = al + r(1, 4);
        const co = [1, m - (al + be), n + al * be];
        const w = be - al;
        return {
          q: `放物線 $y=${poly(co)}$ と直線 $y=${poly([m, n])}$ で囲まれた部分の面積を求めよ。`,
          ans: fracAns(w ** 3, 6),
          hint: "2式を連立して交点の $x$ 座標を求める。区間では直線が上，放物線が下。",
          steps: [
            `$${poly(co)}=${poly([m, n])}$ より $${poly([1, -(al + be), al * be])}=0$，$x=${al},\\ ${be}$`,
            `$S=\\int_{${al}}^{${be}}\\{(${poly([m, n])})-(${poly(co)})\\}dx=-\\int_{${al}}^{${be}}${fx2(al, be)}dx$`,
            `$S=\\frac{(${be}-${par(al)})^{3}}{6}=${fracTex(w ** 3, 6)}$`,
          ],
        };
      }),
      t("HII-sekibun-2c", (r) => {
        const r1 = r(-4, 3), r2 = r1 + r(1, 4), c = r(1, 3);
        const co = [c, -c * (r1 + r2), c * r1 * r2];
        const ans = tex(listTex("a", [r1, r2]));
        return {
          q: `等式 $\\int_{a}^{x}f(t)\\,dt=${poly(co)}$ をみたす関数 $f(x)$ と定数 $a$ がある。$a$ の値を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(listTex("a", [-r1, -r2])), tex(`a=${fracTex(r1 + r2, 2)}`), tex(listTex("a", [r1 + r2, r1 * r2].filter((x, i, arr) => arr.indexOf(x) === i)))],
            (i) => tex(listTex("a", [r1 - i - 1, r2]))),
          hint: "両辺に $x=a$ を代入すると，左辺は $\\int_{a}^{a}f(t)dt=0$ になる。",
          steps: [
            `$x=a$ を代入すると左辺は $0$ なので $${poly(co, "a")}=0$`,
            `$${c === 1 ? "" : c}${fx2(r1, r2, "a")}=0$ より $a=${r1},\\ ${r2}$`,
            `（両辺を微分すると $f(x)=${poly([2 * c, -c * (r1 + r2)])}$）`,
          ],
        };
      }),
    ],
    3: [
      t("HII-sekibun-3a", (r) => {
        const a = r(1, 4), c = a + r(1, 3);
        const num = 2 * a ** 3 + 2 * c ** 3 - 3 * a * c * c;
        return {
          q: `定積分 $\\int_{0}^{${c}}|${poly([1, -a, 0])}|\\,dx$ を求めよ。`,
          ans: fracAns(num, 6),
          hint: "絶対値の中の符号が変わる $x$ で積分区間を分ける。",
          steps: [
            `$0\\leqq x\\leqq ${a}$ では $${poly([1, -a, 0])}\\leqq 0$，$${a}\\leqq x\\leqq ${c}$ では $\\geqq 0$`,
            `与式 $=\\int_{0}^{${a}}(${poly([-1, a, 0])})dx+\\int_{${a}}^{${c}}(${poly([1, -a, 0])})dx$`,
            `$=${fracTex(a ** 3, 6)}+${fracTex(2 * c ** 3 - 3 * a * c * c + a ** 3, 6)}=${fracTex(num, 6)}$`,
          ],
        };
      }),
      t("HII-sekibun-3b", (r) => {
        const a1 = pick(r, [1, 2]), a2 = pick(r, [-1, -2]), dd = a1 - a2;
        const u = r(-3, 3), v = r(-3, 3), al = r(-3, 1), be = al + r(1, 3);
        const f = [a1, u, v];
        const g = [a2, u + dd * (al + be), v - dd * al * be];
        const w = be - al;
        return {
          q: `2つの放物線 $y=${poly(f)}$ と $y=${poly(g)}$ で囲まれた部分の面積を求めよ。`,
          ans: fracAns(dd * w ** 3, 6),
          hint: "2式の差をとって交点を求め，上の式から下の式を引いて積分する。",
          steps: [
            `差をとると $(${poly(g)})-(${poly(f)})=${poly([-dd, dd * (al + be), -dd * al * be])}=-${dd === 1 ? "" : dd}${fx2(al, be)}$`,
            `交点は $x=${al},\\ ${be}$。この間では $y=${poly(g)}$ が上`,
            `$S=-${dd === 1 ? "" : dd}\\int_{${al}}^{${be}}${fx2(al, be)}dx=\\frac{${dd === 1 ? "" : dd}(${be}-${par(al)})^{3}}{6}=${fracTex(dd * w ** 3, 6)}$`,
          ],
        };
      }),
      t("HII-sekibun-3c", (r) => {
        const a = rnz(r, -3, 3), b = r(-4, 4), c = pick(r, [2, 3, -1, -2]);
        const kN = 2 * a + 3 * b, kD = 6 * (1 - c);
        const num = 6 * (1 - c) * (a + b) + c * (2 * a + 3 * b), den = 6 * (1 - c);
        return {
          q: `関数 $f(x)$ が $f(x)=${poly([a, b, 0])}${signedVar(c, "\\int_{0}^{1}f(t)\\,dt")}$ をみたすとき，$f(1)$ の値を求めよ。`,
          ans: fracAns(num, den),
          hint: "$\\int_{0}^{1}f(t)\\,dt$ は定数なので $k$ とおき，$f(x)$ を代入して $k$ の方程式をつくる。",
          steps: [
            `$k=\\int_{0}^{1}f(t)\\,dt$ とおくと $f(x)=${poly([a, b, 0])}${signedVar(c, "k")}$`,
            `$k=\\int_{0}^{1}(${poly([a, b, 0], "t")}${signedVar(c, "k")})dt=${fracTex(2 * a + 3 * b, 6)}${signedVar(c, "k")}$ より $k=${fracTex(kN, kD)}$`,
            `$f(1)=${a + b}${signed(c)}\\cdot\\left(${fracTex(kN, kD)}\\right)=${fracTex(num, den)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HII-sekibun-4a", (r) => {
        const a = pick(r, [1, 1, 2]), al = r(-3, 1), be = al + r(1, 4), w = be - al;
        const P = `\\left(${fracTex(al + be, 2)},\\ ${a * al * be}\\right)`;
        return {
          q: `点 $${P}$ から放物線 $y=${a === 1 ? "" : a}x^{2}$ に2本の接線を引く。2本の接線と放物線で囲まれた部分の面積を求めよ。`,
          ans: fracAns(a * w ** 3, 12),
          hint: `接点を $(t,\\ ${a === 1 ? "" : a}t^{2})$ とおいて接線の式をつくり，点を通る条件から $t$ を求める。面積は2接線の交点で2つに分けて積分する。`,
          steps: [
            `接点の $x$ 座標を $t$ とすると接線は $y=${a === 1 ? "" : a * 2}${a === 1 ? "2" : ""}tx-${a === 1 ? "" : a}t^{2}$。点を通る条件から $t=${al},\\ ${be}$`,
            `2接線の交点の $x$ 座標は $${fracTex(al + be, 2)}$。放物線と接線の差は $${a === 1 ? "" : a}(x-t)^{2}$`,
            `$S=\\int_{${al}}^{${fracTex(al + be, 2)}}${a === 1 ? "" : a}(x-${par(al)})^{2}dx+\\int_{${fracTex(al + be, 2)}}^{${be}}${a === 1 ? "" : a}(x-${par(be)})^{2}dx=\\frac{${a === 1 ? "" : a}(${be}-${par(al)})^{3}}{12}$`,
            `答え：$${fracTex(a * w ** 3, 12)}$`,
          ],
        };
      }),
      t("HII-sekibun-4b", (r) => {
        const p = r(-3, 3), q = r(-4, 4), c = r(-3, 3), x0 = r(-2, 2);
        const s = -p - 2 * x0;
        if (s === x0) return { skip: true };
        const f = (x) => x ** 3 + p * x * x + q * x + c, fp = (x) => 3 * x * x + 2 * p * x + q;
        const m = fp(x0), n = f(x0) - m * x0;
        const w = s - x0;
        return {
          q: `曲線 $y=${poly([1, p, q, c])}$ 上の点 $(${x0},\\ ${f(x0)})$ における接線と，この曲線で囲まれた部分の面積を求めよ。`,
          ans: fracAns(w ** 4, 12),
          hint: "曲線の式から接線の式を引くと，$(x-t)^{2}$ を因数にもつ。もう1つの交点を求めて積分する。",
          steps: [
            `接線は $y=${poly([m, n])}$`,
            `$(${poly([1, p, q, c])})-(${poly([m, n])})=(x-${par(x0)})^{2}(x-${par(s)})$ より，もう1つの交点は $x=${s}$`,
            `$S=\\left|\\int_{${Math.min(x0, s)}}^{${Math.max(x0, s)}}(x-${par(x0)})^{2}(x-${par(s)})dx\\right|=\\frac{(${s}-${par(x0)})^{4}}{12}$`,
            `答え：$${fracTex(w ** 4, 12)}$`,
          ],
        };
      }),
      t("HII-sekibun-4c", (r) => {
        const a = pick(r, [2, 4, 6]), k = pick(r, [1, 2, 3]), K = k * a, h = K / 2;
        const ansT = h === 1 ? `${K}-\\sqrt[3]{4}` : `${K}-${h}\\sqrt[3]{4}`;
        const mk = k === 1 ? "m" : `\\frac{m}{${k}}`;
        const ans = tex(ansT);
        return {
          q: `放物線 $y=${poly([-k, k * a, 0])}$ と $x$ 軸で囲まれた部分の面積を，直線 $y=mx$ が2等分するとき，定数 $m$ の値を求めよ。`,
          ans,
          choices: choices4(r, ans, [tex(String(h)), tex(h === 1 ? `${K}-\\sqrt{2}` : `${K}-${h}\\sqrt{2}`), tex(h === 1 ? "\\sqrt[3]{4}" : `${h}\\sqrt[3]{4}`)]),
          hint: `直線と放物線の交点の $x$ 座標を $m$ で表し，囲まれた面積を $\\frac{(\\beta-\\alpha)^{3}}{6}$ 型の公式で表す。`,
          steps: [
            `全体の面積は $\\frac{${k === 1 ? "" : `${k}\\cdot `}${a}^{3}}{6}=${fracTex(k * a ** 3, 6)}$`,
            `直線との交点は $x=0,\\ ${a}-${mk}$。直線と放物線で囲まれた面積は $\\frac{${k}}{6}\\left(${a}-${mk}\\right)^{3}$`,
            `これが全体の半分なので $\\left(${a}-${mk}\\right)^{3}=\\frac{${a ** 3}}{2}$，$${a}-${mk}=\\frac{${a}}{\\sqrt[3]{2}}=${a / 2 === 1 ? "" : a / 2}\\sqrt[3]{4}$`,
            `答え：$m=${ansT}$`,
          ],
        };
      }),
    ],
  },
};

export const UNITS = [SHIKI, FUKUSO, KOUJI, ZUHOU, SANKAKU, SHISU, TAISU, BIBUN, SEKIBUN];
