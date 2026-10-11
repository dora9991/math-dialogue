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
  const pp = `${B}^{${e}}`;
  if (c === 1) return pp;
  if (c === -1) return `-${pp}`;
  return `${c}\\cdot ${pp}`;
}
/** 2項目以降に足す形 */
const plusTerm = (s) => (s.startsWith("-") ? s : `+${s}`);
/** 等差数列の和 */
const arSum = (a, d, n) => (n * (2 * a + (n - 1) * d)) / 2;
/** 小数を TeX で（4桁まで） */
const dec = (x, d = 4) => String(round(x, d));
/** c・x の TeX（c=1 なら x，c=-1 なら -x。x は必要ならかっこをつけて渡す） */
const mulTex = (c, x) => (c === 1 ? x : c === -1 ? `-${x}` : `${c}\\cdot ${x}`);
/** 2項目以降の c・x（符号つき） */
const smulTex = (c, x) => (c < 0 ? `-${mulTex(-c, x)}` : `+${mulTex(c, x)}`);
/** 係数としての分数（1 なら省略，-1 なら "-"） */
const cfTex = (n, d) => { const s = fracTex(n, d); return s === "1" ? "" : s === "-1" ? "-" : s; };
/** 累乗（指数1なら底だけ） */
const pw = (b, e) => (e === 1 ? `${b}` : `${b}^{${e}}`);
/** n + c の形（c=0 なら n） */
const plusC = (v, c) => (c === 0 ? v : `${v}${signed(c)}`);
/** 組合せ */
function nCr(n, k) { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; }
const Cn = (n, k) => `{}_{${n}}\\mathrm{C}_{${k}}`;
/** 4択（式）：誤答を n=1〜6 の「値」で重複除去して，いつも4つにする。選択肢は { tex, f(n) } */
function choicesByValue(r, correct, wrongs, fill = null) {
  const sig = (c) => [1, 2, 3, 4, 5, 6].map((n) => round(c.f(n), 6)).join(",");
  const seen = new Set([sig(correct)]);
  const ws = [];
  const add = (w) => {
    if (!w || ws.length >= 3 || w.tex === correct.tex || ws.includes(w.tex)) return;
    const s = sig(w);
    if (seen.has(s)) return;
    seen.add(s);
    ws.push(w.tex);
  };
  wrongs.forEach(add);
  for (let i = 0; fill && ws.length < 3 && i < 60; i++) add(fill(i));
  return choices4(r, correct.tex, ws);
}

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
    "3つの数 $a,\\ b,\\ c$ がこの順に等差数列 $\\iff 2b=a+c$。0でない3つの数 $a,\\ b,\\ c$ がこの順に等比数列 $\\iff b^{2}=ac$。",
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
          steps: [`$a_{${n}}=${mulTex(a, `${par(rr)}^{${n - 1}}`)}=${mulTex(a, par(rr ** (n - 1)))}$`, `答え：$${ans}$`],
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
      t("HB-suretsu-1d", (r) => {
        const a = r(-10, 20), d = pick(r, [2, 3, 4, 5, 6, 7, -2, -3, -4, -5]), n = r(10, 40);
        const X = a + (n - 1) * d, gen = poly([d, a - d], "n");
        return {
          q: `等差数列 $${a},\\ ${a + d},\\ ${a + 2 * d},\\ \\cdots$ において，$${X}$ は第何項か。`,
          ans: n,
          hint: "初項と公差から一般項 $a_{n}$ を求め，$a_{n}$ がその数に等しくなる $n$ を求める。",
          steps: [
            `初項 $${a}$，公差 $${d}$ より $a_{n}=${a}+(n-1)\\cdot ${par(d)}=${gen}$`,
            `$${gen}=${X}$ を解くと $${d}n=${n * d}$ より $n=${n}$`,
            `答え：第 $${n}$ 項`,
          ],
        };
      }),
      t("HB-suretsu-1e", (r) => {
        if (r(0, 1) === 1) {
          const w = r(1, 3), u = r(1, 5);
          let v = r(1, 6);
          if (v === u) v = u + 1;
          const sg = pick(r, [1, -1]), P = sg * w * u * u, Q = sg * w * v * v, x = w * u * v;
          return {
            q: `3つの数 $${P},\\ x,\\ ${Q}$ がこの順に等比数列をなすとき，正の数 $x$ の値を求めよ。`,
            ans: x,
            hint: "0でない3つの数 $a,\\ b,\\ c$ がこの順に等比数列 $\\iff b^{2}=ac$。",
            steps: [`$x^{2}=${P}\\cdot ${par(Q)}=${P * Q}$`, `$x>0$ より $x=${x}$`],
          };
        }
        const P = r(-10, 20), x = P + rnz(r, -8, 8), Q = 2 * x - P;
        return {
          q: `3つの数 $${P},\\ x,\\ ${Q}$ がこの順に等差数列をなすとき，$x$ の値を求めよ。`,
          ans: x,
          hint: "3つの数 $a,\\ b,\\ c$ がこの順に等差数列 $\\iff 2b=a+c$。",
          steps: [`$2x=${P}${signed(Q)}=${P + Q}$`, `答え：$x=${x}$`],
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
            `$a+${coefVar(p - 1, "d")}=${A(p)}$，$a+${q - 1}d=${A(q)}$`,
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
          steps: [
            `$S_{${n}}=\\frac{${a === 1 ? `${par(rr)}^{${n}}-1` : `${a}\\{${par(rr)}^{${n}}-1\\}`}}{${rr}-1}=${rr === 2 ? "" : `${rr < 0 ? "-" : ""}\\frac{`}${mulTex(a, par(rr ** n - 1))}${rr === 2 ? "" : `}{${Math.abs(rr - 1)}}`}$`,
            `答え：$${ans}$`,
          ],
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
      t("HB-suretsu-2d", (r) => {
        const a = rnz(r, -3, 3), rr = pick(r, [2, 3, -2, -3]), p = r(1, 3);
        const k = pick(r, [p + 1, p + 2, p + 4, p + 5]);
        const A = (n) => a * rr ** (n - 1);
        return {
          q: `等比数列 $\\{a_{n}\\}$ において $a_{${p}}=${A(p)}$，$a_{${p + 3}}=${A(p + 3)}$ である。公比が実数のとき，$a_{${k}}$ を求めよ。`,
          ans: A(k),
          hint: `公比を $r$ とすると $a_{${p + 3}}=a_{${p}}r^{3}$ である。`,
          steps: [
            `公比を $r$ とすると $a_{${p + 3}}=a_{${p}}r^{3}$ より $r^{3}=${A(p + 3)}\\div ${par(A(p))}=${rr ** 3}$。$r$ は実数なので $r=${rr}$`,
            `$a_{${k}}=a_{${p}}\\cdot ${pw("r", k - p)}=${mulTex(A(p), pw(par(rr), k - p))}=${A(k)}$`,
          ],
        };
      }),
      t("HB-suretsu-2e", (r) => {
        const m = r(3, 9), s = r(0, m - 1), N = r(60, 200);
        const f = s === 0 ? m : s, cnt = Math.floor((N - f) / m) + 1, l = f + (cnt - 1) * m;
        const ans = (cnt * (f + l)) / 2;
        return {
          q: s === 0 ? `$${N}$ 以下の自然数のうち，$${m}$ の倍数の和を求めよ。` : `$${N}$ 以下の自然数のうち，$${m}$ で割ると $${s}$ 余る数の和を求めよ。`,
          ans,
          hint: "条件をみたす数を小さい順に並べると等差数列になる。末項と項数を求める。",
          steps: [
            `$${f},\\ ${f + m},\\ ${f + 2 * m},\\ \\cdots,\\ ${l}$ は初項 $${f}$，公差 $${m}$ の等差数列で，項数は $\\frac{${l}-${f}}{${m}}+1=${cnt}$`,
            `和は $\\frac{${cnt}(${f}+${l})}{2}=${ans}$`,
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
      t("HB-suretsu-3d", (r) => {
        const p = r(2, 5), N = r(12, 25), z = r(3, N - 4), q = p * z + r(0, p - 1), sg = pick(r, [1, -1]);
        const T = (n) => (p * n * (n + 1)) / 2 - q * n; // (pk-q) の k=1〜n の和
        const ans = T(N) - 2 * T(z), b = poly([p, -q], "k");
        return {
          q: `一般項が $a_{n}=${poly([sg * p, -sg * q], "n")}$ で表される数列 $\\{a_{n}\\}$ について，$|a_{1}|+|a_{2}|+\\cdots+|a_{${N}}|$ を求めよ。`,
          ans,
          hint: "絶対値の中の符号が変わるところで，和を2つに分ける。",
          steps: [
            `$|a_{k}|=|${b}|$ で，$${b}$ は $k\\leqq ${z}$ のとき $0$ 以下，$k\\geqq ${z + 1}$ のとき正`,
            `$T_{n}=\\sum_{k=1}^{n}(${b})$ とすると，求める和は $-T_{${z}}+(T_{${N}}-T_{${z}})=T_{${N}}-2T_{${z}}$`,
            `$T_{${N}}=${T(N)}$，$T_{${z}}=${T(z)}$ より，答え：$${T(N)}-2\\cdot ${par(T(z))}=${ans}$`,
          ],
        };
      }),
      t("HB-suretsu-3e", (r) => {
        const [p, q] = pick(r, [[2, 3], [2, 5], [3, 5], [3, 4], [2, 7], [3, 7], [4, 5]]);
        const M = r(10, 99), N = M + r(60, 140);
        const mul = (k) => { const f = Math.ceil(M / k) * k, l = Math.floor(N / k) * k, c = (l - f) / k + 1; return { f, l, c, s: (c * (f + l)) / 2 }; };
        const T = ((N - M + 1) * (M + N)) / 2, A = mul(p), B = mul(q), C = mul(p * q);
        const ans = T - A.s - B.s + C.s;
        const say = (k, X) => `$${k}$ の倍数は $${X.f},\\ \\cdots,\\ ${X.l}$ の $${X.c}$ 個で和は $${X.s}$`;
        return {
          q: `$${M}$ 以上 $${N}$ 以下の整数のうち，$${p}$ でも $${q}$ でも割り切れない数の和を求めよ。`,
          ans,
          hint: `全体の和から $${p}$ の倍数の和と $${q}$ の倍数の和を引き，引きすぎた $${p * q}$ の倍数の和を足しもどす。`,
          steps: [
            `全体（$${N - M + 1}$ 個）の和は $\\frac{${N - M + 1}(${M}+${N})}{2}=${T}$`,
            `${say(p, A)}，${say(q, B)}，${say(p * q, C)}`,
            `答え：$${T}-${A.s}-${B.s}+${C.s}=${ans}$`,
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
      t("HB-suretsu-4c", (r) => {
        const [m, p, q] = pick(r, [[6, 2, 3], [10, 2, 5], [12, 2, 3], [14, 2, 7], [15, 3, 5], [18, 2, 3], [20, 2, 5], [21, 3, 7]]);
        const N = r(2, 9);
        const c = m - m / p - m / q + m / (p * q); // 1〜m で m と互いに素な数の個数
        const ans = (N * N * c) / 2;
        return {
          q: `分母が $${m}$ の分数 $\\frac{k}{${m}}$（$k$ は自然数）のうち，$0$ より大きく $${N}$ より小さく，それ以上約分できないものすべての和を求めよ。`,
          ans,
          hint: `$\\frac{k}{${m}}$ と $${N}-\\frac{k}{${m}}$ を組にして考える。`,
          steps: [
            `約分できないのは $k$ が $${p}$ でも $${q}$ でも割り切れないとき。$1\\leqq k\\leqq ${m}$ には $${m}-${m / p}-${m / q}+${m / (p * q)}=${c}$ 個あり，$1\\leqq k<${m * N}$ には $${N}\\times ${c}=${N * c}$ 個ある`,
            `$\\frac{k}{${m}}$ が約分できなければ $${N}-\\frac{k}{${m}}=\\frac{${m * N}-k}{${m}}$ も約分できない。この2つを組にすると和は $${N}$ で，$${(N * c) / 2}$ 組できる`,
            `答え：$${N}\\times ${(N * c) / 2}=${ans}$`,
          ],
        };
      }),
      t("HB-suretsu-4d", (r) => {
        const [b, md] = pick(r, [[2, 3], [2, 5], [2, 7], [2, 9], [3, 5], [3, 7], [3, 8]]);
        const rem = [b % md];
        while (rem[rem.length - 1] !== 1) rem.push((rem[rem.length - 1] * b) % md);
        const T = rem.length; // b^T を md で割ると 1 余る（余りの周期）
        const j = r(1, T), s = rem[j - 1], F = b ** j, R = b ** T;
        let k = r(2, 4);
        while (k > 2 && F * R ** (k - 1) > 1e6) k--;
        const ans = (F * (R ** k - 1)) / (R - 1);
        const cs = Array.from({ length: k }, (_, i) => `c_{${i + 1}}`).join("+");
        return {
          q: `数列 $${b},\\ ${b}^{2},\\ ${b}^{3},\\ \\cdots$ の項のうち，$${md}$ で割ると $${s}$ 余るものを小さい順に $c_{1},\\ c_{2},\\ c_{3},\\ \\cdots$ とする。$${cs}$ を求めよ。`,
          ans,
          hint: `$${b}^{n}$ を $${md}$ で割った余りを $n=1,\\ 2,\\ 3,\\ \\cdots$ と順に調べると，周期的にくり返す。`,
          steps: [
            `$${b}^{n}$ を $${md}$ で割った余りは，$n=1,\\ 2,\\ \\cdots$ で $${rem.join(",\\ ")}$ をくり返す（$${b}^{${T}}$ を $${md}$ で割った余りが $1$ だから）`,
            `余りが $${s}$ になるのは $n=${j},\\ ${j + T},\\ ${j + 2 * T},\\ \\cdots$ のとき。$\\{c_{n}\\}$ は初項 $${j === 1 ? `${F}` : `${b}^{${j}}=${F}`}$，公比 $${b}^{${T}}=${R}$ の等比数列`,
            `答え：$\\frac{${F}(${R}^{${k}}-1)}{${R}-1}=${ans}$`,
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
            `$${a === 1 ? "" : a === -1 ? "-" : a}\\sum_{k=1}^{${n}}k${b ? `${signed(b)}\\times ${n}` : ""}=${mulTex(a, `\\frac{${n}\\cdot ${n + 1}}{2}`)}${b ? signed(b * n) : ""}$`,
            `答え：$${ans}$`,
          ],
        };
      }),
      t("HB-sigma-1c", (r) => {
        const rr = pick(r, [2, 3]), a = pick(r, [1, 2, 3, 5, -2]), e = pick(r, ["k-1", "k"]), n = rr === 3 ? r(4, 6) : r(4, 8);
        const F = a * (e === "k" ? rr : 1), ans = (F * (rr ** n - 1)) / (rr - 1);
        return {
          q: `$\\sum_{k=1}^{${n}}${a === 1 ? "" : `${par(a)}\\cdot `}${rr}^{${e}}$ の値を求めよ。`,
          ans,
          hint: "等比数列の和になる。初項（$k=1$ のときの値）・公比・項数を読みとる。",
          steps: [
            `初項 $${F}$，公比 $${rr}$，項数 $${n}$ の等比数列の和`,
            `$\\frac{${F === 1 ? `${rr}^{${n}}-1` : `${F}(${rr}^{${n}}-1)`}}{${rr}-1}=${ans}$`,
          ],
        };
      }),
      t("HB-sigma-1d", (r) => {
        const e = pick(r, [2, 2, 3]), m = r(3, 10), n = m + r(4, 10);
        const S = (x) => (e === 2 ? (x * (x + 1) * (2 * x + 1)) / 6 : ((x * (x + 1)) / 2) ** 2);
        const F = (x) => (e === 2 ? `\\frac{1}{6}\\cdot ${x}\\cdot ${x + 1}\\cdot ${2 * x + 1}` : `\\left(\\frac{1}{2}\\cdot ${x}\\cdot ${x + 1}\\right)^{2}`);
        const ans = S(n) - S(m - 1);
        return {
          q: `$\\sum_{k=${m}}^{${n}}k^{${e}}$ の値を求めよ。`,
          ans,
          hint: "$\\sum_{k=m}^{n}=\\sum_{k=1}^{n}-\\sum_{k=1}^{m-1}$（引くのは第 $m-1$ 項まで）。",
          steps: [
            `$\\sum_{k=${m}}^{${n}}k^{${e}}=\\sum_{k=1}^{${n}}k^{${e}}-\\sum_{k=1}^{${m - 1}}k^{${e}}$`,
            `$=${F(n)}-${F(m - 1)}=${S(n)}-${S(m - 1)}=${ans}$`,
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
            `$\\sum k^{2}${c > 0 ? "+" : "-"}${Math.abs(c) === 1 ? "" : Math.abs(c)}\\sum k=\\frac{1}{6}n(n+1)(2n+1)${c > 0 ? "+" : "-"}${cfTex(Math.abs(c), 2)}n(n+1)$`,
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
            `$n\\geqq 2$ のとき $a_{n}=${A}+\\sum_{k=1}^{n-1}(${poly([p, q], "k")})=${A}${signedVar(p / 2, "(n-1)n")}${signedVar(q, "(n-1)")}$`,
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
            `$\\frac{1}{${den}}=${a === 1 ? "" : `\\frac{1}{${a}}`}\\left(\\frac{1}{${f1}}-\\frac{1}{${f2}}\\right)$`,
            `和をとると途中が消えて $${a === 1 ? "" : `\\frac{1}{${a}}`}\\left(\\frac{1}{${L}}-\\frac{1}{${R}}\\right)$`,
            `答え：$${fracTex(n, L * R)}$`,
          ],
        };
      }),
      t("HB-sigma-2d", (r) => {
        const N = r(8, 20);
        const F = pick(r, [
          { sh: (k) => `${k}\\cdot ${k + 1}`, gen: "k(k+1)=k^{2}+k", co: [1, 1, 0] },
          { sh: (k) => `${2 * k - 1}^{2}`, gen: "(2k-1)^{2}=4k^{2}-4k+1", co: [4, -4, 1] },
          { sh: (k) => `${k}\\cdot ${2 * k + 1}`, gen: "k(2k+1)=2k^{2}+k", co: [2, 1, 0] },
          { sh: (k) => `${2 * k - 1}\\cdot ${2 * k + 1}`, gen: "(2k-1)(2k+1)=4k^{2}-1", co: [4, 0, -1] },
        ]);
        const [A, B, C] = F.co, s1 = (N * (N + 1)) / 2, s2 = (N * (N + 1) * (2 * N + 1)) / 6;
        const ans = A * s2 + B * s1 + C * N;
        const parts = `${mulTex(A, `${s2}`)}${B ? smulTex(B, `${s1}`) : ""}${C ? smulTex(C, `${N}`) : ""}`;
        return {
          q: `$${F.sh(1)}+${F.sh(2)}+${F.sh(3)}+\\cdots+${F.sh(N)}$ の値を求めよ。`,
          ans,
          hint: "第 $k$ 項を $k$ の式で表してから，$\\sum$ の公式を使う。",
          steps: [
            `第 $k$ 項は $${F.gen}$`,
            `$\\sum_{k=1}^{${N}}k^{2}=${s2}$，$\\sum_{k=1}^{${N}}k=${s1}$ より，和は $\\sum_{k=1}^{${N}}(${poly([A, B, C], "k")})=${parts}=${ans}$`,
          ],
        };
      }),
    ],
    3: [
      t("HB-sigma-3a", (r) => {
        const p = pick(r, [1, 2, 3, -1]), q = r(-5, 5), c = rnz(r, -5, 5);
        const a1 = p + q + c, gen = poly([2 * p, q - p], "n");
        // 選択肢は { tex, f(n) }（値で重複除去する）
        const pwc = (u, v) => ({ tex: `$a_{1}=${a1}$，$n\\geqq 2$ のとき $a_{n}=${poly([u, v], "n")}$`, f: (n) => (n === 1 ? a1 : u * n + v) });
        const all = (u, v) => ({ tex: `$a_{n}=${poly([u, v], "n")}$`, f: (n) => u * n + v });
        const corr = pwc(2 * p, q - p);
        const ans = corr.tex;
        return {
          q: `数列 $\\{a_{n}\\}$ の初項から第 $n$ 項までの和 $S_{n}$ が $S_{n}=${poly([p, q, c], "n")}$ で表されるとき，一般項 $a_{n}$ を求めよ。`,
          ans,
          choices: choicesByValue(r, corr, [all(2 * p, q - p), pwc(2 * p, q - p + c), all(2 * p, q + p)],
            (i) => [all(2 * p, q - p + c), pwc(2 * p, q + p)][i] || all(2 * p, q - p + i)),
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
            `$S=${a + b === 0 ? "" : `${term(1)}+`}${term(2)}+\\cdots+${term(n)}$`,
            `$S-${rr}S=${a + b === 0 ? "" : `${a + b}+`}${a === 1 ? "" : `${a}\\cdot `}(${rr}+${rr}^{2}+\\cdots+${rr}^{${n - 1}})-${a * n + b}\\cdot ${rr}^{${n}}$`,
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
      t("HB-sigma-3d", (r) => {
        const N = r(8, 30), s1 = (N * (N + 1)) / 2, s2 = (N * (N + 1) * (2 * N + 1)) / 6, ans = (N + 1) * s1 - s2;
        return {
          q: `$1\\cdot ${N}+2\\cdot ${N - 1}+3\\cdot ${N - 2}+\\cdots+${N}\\cdot 1$ の値を求めよ。`,
          ans,
          hint: "第 $k$ 項を $k$ の式で表す。各項の2つの数の和がいつも同じであることに注目する。",
          steps: [
            `第 $k$ 項は $k(${N + 1}-k)=${N + 1}k-k^{2}$`,
            `和は $${N + 1}\\sum_{k=1}^{${N}}k-\\sum_{k=1}^{${N}}k^{2}=${N + 1}\\cdot ${s1}-${s2}=${ans}$`,
          ],
        };
      }),
      t("HB-sigma-3e", (r) => {
        const type = r(0, 2);
        const head = "正の奇数の列を，第 $m$ 群に $m$ 個の数が入るように $1\\,|\\,3,\\ 5\\,|\\,7,\\ 9,\\ 11\\,|\\,13,\\ \\cdots$ と群に分ける。";
        const hint = "第 $m$ 群までに入る数の個数は $1+2+\\cdots+m=\\frac{1}{2}m(m+1)$。";
        if (type === 2) {
          const M = r(6, 20), j = r(1, M), T = (M * (M - 1)) / 2, T2 = (M * (M + 1)) / 2, X = 2 * (T + j) - 1;
          return {
            q: `${head}$${X}$ は第何群に入るか。`,
            ans: M,
            hint,
            steps: [
              `$${X}$ は小さい方から $\\frac{${X}+1}{2}=${T + j}$ 番目の奇数`,
              `$\\frac{1}{2}\\cdot ${M - 1}\\cdot ${M}=${T}$，$\\frac{1}{2}\\cdot ${M}\\cdot ${M + 1}=${T2}$ で，$${T}<${T + j}\\leqq ${T2}$`,
              `答え：第 $${M}$ 群（その $${j}$ 番目）`,
            ],
          };
        }
        const M = r(5, 20), T = (M * (M - 1)) / 2, F = 2 * T + 1;
        const s1 = `第 $${M - 1}$ 群までに $\\frac{1}{2}\\cdot ${M - 1}\\cdot ${M}=${T}$ 個の奇数があるので，第 $${M}$ 群の最初の数は $${T + 1}$ 番目の奇数で $2\\cdot ${T + 1}-1=${F}$`;
        if (type === 0) return { q: `${head}第 $${M}$ 群の最初の数を求めよ。`, ans: F, hint, steps: [s1, `答え：$${F}$`] };
        return {
          q: `${head}第 $${M}$ 群に入る数の和を求めよ。`,
          ans: M ** 3,
          hint,
          steps: [s1, `第 $${M}$ 群は初項 $${F}$，公差 $2$，項数 $${M}$ の等差数列なので，和は $\\frac{${M}\\{2\\cdot ${F}+(${M}-1)\\cdot 2\\}}{2}=${M ** 3}$`],
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
              ? `第 $m$ 群の和は $\\frac{1}{2}m(m+1)$。$\\sum_{m=1}^{${g - 1}}\\frac{1}{2}m(m+1)+${pos === 1 ? "1" : pos === 2 ? "(1+2)" : `(1+\\cdots+${pos})`}=${sum - (pos * (pos + 1)) / 2}+${(pos * (pos + 1)) / 2}=${sum}$`
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
      t("HB-sigma-4c", (r) => {
        const type = r(0, 2);
        let N, S1, S2, list, sums;
        if (type === 0) {
          N = r(6, 20); S1 = (N * (N + 1)) / 2; S2 = (N * (N + 1) * (2 * N + 1)) / 6; list = `1,\\ 2,\\ 3,\\ \\cdots,\\ ${N}`;
          sums = `$1+2+\\cdots+${N}=${S1}$，$1^{2}+2^{2}+\\cdots+${N}^{2}=${S2}$`;
        } else if (type === 1) {
          N = r(5, 15); S1 = N * N; S2 = (N * (2 * N - 1) * (2 * N + 1)) / 3; list = `1,\\ 3,\\ 5,\\ \\cdots,\\ ${2 * N - 1}`;
          sums = `$1+3+\\cdots+${2 * N - 1}=${N}^{2}=${S1}$，$1^{2}+3^{2}+\\cdots+${2 * N - 1}^{2}=\\sum_{k=1}^{${N}}(2k-1)^{2}=${S2}$`;
        } else {
          N = r(4, 10); S1 = 2 ** N - 1; S2 = (4 ** N - 1) / 3; list = `1,\\ 2,\\ 2^{2},\\ \\cdots,\\ 2^{${N - 1}}`;
          sums = `$1+2+\\cdots+2^{${N - 1}}=2^{${N}}-1=${S1}$，$1^{2}+2^{2}+\\cdots+(2^{${N - 1}})^{2}=1+4+\\cdots+4^{${N - 1}}=\\frac{4^{${N}}-1}{3}=${S2}$`;
        }
        const ans = (S1 * S1 - S2) / 2, pairs = (N * (N - 1)) / 2;
        return {
          q: `$${N}$ 個の数 $${list}$ から異なる2個を選ぶ選び方 $${pairs}$ 通りのそれぞれについて，2数の積をつくる。それら $${pairs}$ 個の積の総和を求めよ。`,
          ans,
          hint: `$${N}$ 個の数の和を2乗して展開した式を考える。`,
          steps: [
            `求める総和を $S$ とすると，$(x_{1}+x_{2}+\\cdots+x_{${N}})^{2}=(x_{1}^{2}+x_{2}^{2}+\\cdots+x_{${N}}^{2})+2S$`,
            sums,
            `$2S=${S1}^{2}-${S2}$ より，答え：$S=\\frac{${S1 * S1}-${S2}}{2}=${ans}$`,
          ],
        };
      }),
      t("HB-sigma-4d", (r) => {
        const N = r(20, 200);
        let M = 1;
        while ((M + 1) ** 2 <= N) M++;
        const full = ((M - 1) * M * (2 * M - 1)) / 3 + ((M - 1) * M) / 2; // m=1〜M-1 の m(2m+1) の和
        const part = M * (N - M * M + 1), ans = full + part;
        return {
          q: `実数 $x$ に対して，$x$ を超えない最大の整数を $[x]$ で表す。$\\sum_{k=1}^{${N}}[\\sqrt{k}]$ を求めよ。`,
          ans,
          hint: "$[\\sqrt{k}]$ の値が同じになる $k$ をまとめて数える。",
          steps: [
            `$m^{2}\\leqq k\\leqq (m+1)^{2}-1$ のとき $[\\sqrt{k}]=m$ で，そのような $k$ は $2m+1$ 個`,
            `$${M}^{2}\\leqq ${N}<${M + 1}^{2}$ なので，$m=1$〜$${M - 1}$ の分はすべて入り，$m=${M}$ の分は ${N === M * M ? `$k=${N}$ の $1$ 個` : `$k=${M * M}$〜$${N}$ の $${N - M * M + 1}$ 個`}`,
            `和は $\\sum_{m=1}^{${M - 1}}m(2m+1)+${M}\\cdot ${N - M * M + 1}=${full}+${part}=${ans}$`,
          ],
        };
      }),
    ],
  },
};

// ============================================================
// 漸化式と数学的帰納法
// ============================================================
/** 数学的帰納法で示す等式 [左辺, 右辺, n=k+1 で両辺に加える項, 誤答, 加えたあとの右辺の確かめ] */
const IND = [
  ["1+2+3+\\cdots+n", "\\frac{1}{2}n(n+1)", "k+1", ["k", "k+2", "\\frac{1}{2}(k+1)(k+2)"], "\\frac{1}{2}k(k+1)+(k+1)=\\frac{1}{2}(k+1)(k+2)"],
  ["1+3+5+\\cdots+(2n-1)", "n^{2}", "2k+1", ["2k-1", "2k+3", "(k+1)^{2}"], "k^{2}+(2k+1)=(k+1)^{2}"],
  ["1^{2}+2^{2}+3^{2}+\\cdots+n^{2}", "\\frac{1}{6}n(n+1)(2n+1)", "(k+1)^{2}", ["k^{2}", "(k+2)^{2}", "k+1"], "\\frac{1}{6}k(k+1)(2k+1)+(k+1)^{2}=\\frac{1}{6}(k+1)(k+2)(2k+3)"],
  ["1^{3}+2^{3}+3^{3}+\\cdots+n^{3}", "\\frac{1}{4}n^{2}(n+1)^{2}", "(k+1)^{3}", ["k^{3}", "(k+2)^{3}", "(k+1)^{2}"], "\\frac{1}{4}k^{2}(k+1)^{2}+(k+1)^{3}=\\frac{1}{4}(k+1)^{2}(k+2)^{2}"],
  ["1\\cdot 2+2\\cdot 3+3\\cdot 4+\\cdots+n(n+1)", "\\frac{1}{3}n(n+1)(n+2)", "(k+1)(k+2)", ["k(k+1)", "(k+2)(k+3)", "(k+1)^{2}"], "\\frac{1}{3}k(k+1)(k+2)+(k+1)(k+2)=\\frac{1}{3}(k+1)(k+2)(k+3)"],
  ["1+2+2^{2}+\\cdots+2^{n-1}", "2^{n}-1", "2^{k}", ["2^{k-1}", "2^{k+1}", "2^{k}-1"], "(2^{k}-1)+2^{k}=2^{k+1}-1"],
  ["1+3+3^{2}+\\cdots+3^{n-1}", "\\frac{1}{2}(3^{n}-1)", "3^{k}", ["3^{k-1}", "3^{k+1}", "3^{k}-1"], "\\frac{1}{2}(3^{k}-1)+3^{k}=\\frac{1}{2}(3^{k+1}-1)"],
  ["\\frac{1}{1\\cdot 2}+\\frac{1}{2\\cdot 3}+\\cdots+\\frac{1}{n(n+1)}", "\\frac{n}{n+1}", "\\frac{1}{(k+1)(k+2)}", ["\\frac{1}{k(k+1)}", "\\frac{1}{(k+2)(k+3)}", "\\frac{k+1}{k+2}"], "\\frac{k}{k+1}+\\frac{1}{(k+1)(k+2)}=\\frac{k+1}{k+2}"],
];
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
/** n≧N で成り立つ不等式 [左辺, 右辺, 左辺の値, 右辺の値, n=k+1 で成り立つ理由] */
const INEQ = [
  ["2^{n}", "n^{2}", (n) => 2 ** n, (n) => n * n, "$2^{k+1}=2\\cdot 2^{k}>2k^{2}$ で，$2k^{2}-(k+1)^{2}=(k-1)^{2}-2>0$"],
  ["2^{n}", "n^{3}", (n) => 2 ** n, (n) => n ** 3, "$2^{k+1}=2\\cdot 2^{k}>2k^{3}$ で，$k\\geqq 4$ なら $\\left(1+\\frac{1}{k}\\right)^{3}<2$ より $2k^{3}>(k+1)^{3}$"],
  ["3^{n}", "n^{3}", (n) => 3 ** n, (n) => n ** 3, "$3^{k+1}=3\\cdot 3^{k}>3k^{3}$ で，$k\\geqq 3$ なら $\\left(1+\\frac{1}{k}\\right)^{3}<3$ より $3k^{3}>(k+1)^{3}$"],
  ["2^{n}", "2n+1", (n) => 2 ** n, (n) => 2 * n + 1, "$2^{k+1}=2\\cdot 2^{k}>2(2k+1)=4k+2>2(k+1)+1$"],
  ["2^{n}", "10n", (n) => 2 ** n, (n) => 10 * n, "$2^{k+1}=2\\cdot 2^{k}>20k\\geqq 10(k+1)$"],
  ["3^{n}", "5n^{2}", (n) => 3 ** n, (n) => 5 * n * n, "$3^{k+1}=3\\cdot 3^{k}>15k^{2}$ で，$15k^{2}-5(k+1)^{2}=5(2k^{2}-2k-1)>0$"],
  ["n!", "2^{n}", (n) => fact(n), (n) => 2 ** n, "$(k+1)!=(k+1)\\cdot k!>(k+1)\\cdot 2^{k}>2\\cdot 2^{k}=2^{k+1}$"],
  ["n!", "3^{n}", (n) => fact(n), (n) => 3 ** n, "$(k+1)!=(k+1)\\cdot k!>(k+1)\\cdot 3^{k}>3\\cdot 3^{k}=3^{k+1}$"],
];

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
            seq.slice(1).map((v, i) => `$a_{${i + 2}}=${mulTex(p, par(seq[i]))}${q ? signed(q) : ""}=${v}$`).join("，"),
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
      t("HB-zenka-1c", (r) => {
        const [pn, pd] = pick(r, [[2, 1], [3, 1], [4, 1], [-1, 1], [-2, 1], [-3, 1], [1, 2], [1, 3], [2, 3], [-1, 2]]);
        const q = rnz(r, -9, 9), pc = cfTex(pn, pd);
        return {
          q: `漸化式 $a_{n+1}=${pc}a_{n}${signed(q)}$ を $a_{n+1}-\\alpha=${pc}(a_{n}-\\alpha)$ の形に変形するとき，定数 $\\alpha$ の値を求めよ。`,
          ans: fracAns(q * pd, pd - pn),
          hint: "$a_{n+1}$ と $a_{n}$ をどちらも $\\alpha$ におきかえた式 $\\alpha=p\\alpha+q$ を解く。",
          steps: [
            `$a_{n+1}-\\alpha=${pc}(a_{n}-\\alpha)$ を展開してもとの式と比べると，$\\alpha=${pc}\\alpha${signed(q)}$ をみたせばよい`,
            `$${cfTex(pd - pn, pd)}\\alpha=${q}$ より，答え：$\\alpha=${fracTex(q * pd, pd - pn)}$`,
          ],
        };
      }),
      t("HB-zenka-1d", (r) => {
        const [L, R, add, ws, chk] = pick(r, IND);
        const ans = tex(add);
        return {
          q: `等式 $${L}=${R}$ がすべての自然数 $n$ について成り立つことを，数学的帰納法で証明する。$n=k$ のとき成り立つと仮定して $n=k+1$ のときを示すには，仮定の等式の両辺に何を加えればよいか。`,
          ans,
          choices: choices4(r, ans, ws.map(tex)),
          hint: "$n=k+1$ のときの左辺は，$n=k$ のときの左辺より項が1つ多い。",
          steps: [
            `$n=k+1$ のときの左辺は，$n=k$ のときの左辺に第 $k+1$ 項 $${add}$ を加えたもの`,
            `仮定の等式の両辺に $${add}$ を加えると，右辺は $${chk}$ となり，$n=k+1$ のときも成り立つ`,
          ],
        };
      }),
    ],
    2: [
      t("HB-zenka-2a", (r) => {
        const p = pick(r, [2, 3, -2]), al = rnz(r, -4, 4), q = al * (1 - p);
        let A = r(-5, 6);
        if (A === al) A = al + 1;
        const c = A - al;
        // 選択肢は { tex, f(n) }（値で重複除去する）
        const G = (cc, e, k) => (cc === 0 ? null : { tex: tex(`a_{n}=${geoTex(cc, p, e)}${k ? signed(k) : ""}`), f: (n) => cc * p ** (e === "n" ? n : n - 1) + k });
        const corr = G(c, "n-1", al);
        const ans = corr.tex;
        return {
          q: `$a_{1}=${A}$，$a_{n+1}=${coefVar(p, "a_{n}")}${signed(q)}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans,
          choices: choicesByValue(r, corr, [G(c, "n", al), G(A + al, "n-1", -al), G(A, "n-1", al)], (i) => G(c + i + 1, "n-1", al)),
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
            `$=${A}${smulTex(p, `\\frac{${k - 1}\\cdot ${k}}{2}`)}${q ? smulTex(q, `${k - 1}`) : ""}=${ans}$`,
          ],
        };
      }),
      t("HB-zenka-2c", (r) => {
        const type = r(0, 2);
        let N, Nk, Nk1, d, box, ws, how;
        if (type === 0) {
          const [b, c, dd] = pick(r, [[4, 5, 3], [5, 3, 4], [7, 5, 6], [6, 4, 5], [3, -1, 2], [5, -1, 4], [9, -1, 8], [4, 2, 3]]);
          const e = (c * (b - 1)) / dd, f = (v) => `${b}^{${v}}${signed(c)}`;
          d = dd; N = f("n"); Nk = f("k"); Nk1 = f("k+1");
          box = `${b}m${signed(-e)}`;
          ws = [`${b}m${signed(e)}`, `m${signed(-e)}`, `${b}m${signed(-c * (b - 1))}`];
          how = `$${b}^{k}=${d}m${signed(-c)}$ を使うと $${Nk1}=${b}(${d}m${signed(-c)})${signed(c)}=${b * d}m${signed(-c * (b - 1))}=${d}(${box})$`;
        } else if (type === 1) {
          const [b, a] = pick(r, [[7, 4], [8, 3], [5, 2], [7, 3], [9, 4], [6, 2]]);
          d = b - a; N = `${b}^{n}-${a}^{n}`; Nk = `${b}^{k}-${a}^{k}`; Nk1 = `${b}^{k+1}-${a}^{k+1}`;
          box = `${b}m+${a}^{k}`;
          ws = [`${b}m+${a}^{k+1}`, `${b}m-${a}^{k}`, `m+${a}^{k}`];
          how = `$${b}^{k}=${d}m+${a}^{k}$ を使うと $${Nk1}=${b}(${d}m+${a}^{k})-${a}\\cdot ${a}^{k}=${b * d}m+${d}\\cdot ${a}^{k}=${d}(${box})$`;
        } else {
          const [nt, dd, bx, wx, hw] = pick(r, [
            ["n^{3}+2n", 3, "m+k^{2}+k+1", ["m+k^{2}+k", "m+3k^{2}+3k+3", "m+k^{2}+1"], "(k^{3}+2k)+3k^{2}+3k+3=3m+3(k^{2}+k+1)"],
            ["2n^{3}+3n^{2}+n", 6, "m+k^{2}+2k+1", ["m+k^{2}+2k", "m+6k^{2}+12k+6", "m+k^{2}+k+1"], "(2k^{3}+3k^{2}+k)+6k^{2}+12k+6=6m+6(k^{2}+2k+1)"],
          ]);
          d = dd; N = nt; Nk = nt.replace(/n/g, "k"); Nk1 = nt.replace(/n/g, "(k+1)");
          box = bx; ws = wx;
          how = `$${Nk1}=${hw}=${d}(${box})$`;
        }
        const ans = tex(box);
        return {
          q: `すべての自然数 $n$ について $${N}$ が $${d}$ の倍数であることを，数学的帰納法で証明する。$n=k$ のとき $${Nk}=${d}m$（$m$ は整数）と仮定すると，$${Nk1}=${d}\\left(\\square\\right)$ と表せる。$\\square$ にあてはまる式を選べ。`,
          ans,
          choices: choices4(r, ans, ws.map(tex)),
          hint: `仮定の式を使って $n=k+1$ のときの式を $m$ で表し，$${d}$ でくくる形をめざす。`,
          steps: [how, `$\\square$ は整数なので，$n=k+1$ のときも $${d}$ の倍数である`],
        };
      }),
      t("HB-zenka-2d", (r) => {
        const [f, g, F, G, why] = pick(r, INEQ);
        let N = 1;
        for (let n = 1; n <= 40; n++) if (!(F(n) > G(n))) N = n + 1;
        return {
          q: `不等式 $${f}>${g}$ が，$n\\geqq N$ をみたすすべての自然数 $n$ について成り立つような，最小の自然数 $N$ を求めよ。`,
          ans: N,
          hint: "小さい $n$ から順に両辺の値を比べ，成り立たない最後の $n$ を見つける。その先は数学的帰納法で示せる。",
          steps: [
            `$n=${N - 1}$ のとき（左辺）$=${F(N - 1)}$，（右辺）$=${G(N - 1)}$ で成り立たない。$n=${N}$ のとき（左辺）$=${F(N)}$，（右辺）$=${G(N)}$ で成り立つ`,
            `$n=k\\ (k\\geqq ${N})$ で成り立つと仮定すると，${why}。よって $n=k+1$ でも成り立つ`,
            `答え：$N=${N}$`,
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
            `$n=1$ とすると $a_{1}=2a_{1}${q + c ? signed(q + c) : ""}$ より $a_{1}=${a1}$`,
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
            `$\\frac{1}{a_{n}}$ は初項 $${A}$，公差 $${p}$ の等差数列：$\\frac{1}{a_{${k}}}=${A}+${mulTex(p, `${k - 1}`)}=${bk}$`,
            `答え：$${fracTex(1, bk)}$`,
          ],
        };
      }),
      t("HB-zenka-3d", (r) => {
        const m = r(1, 8), K = r(10, 40);
        const wrap = (v, c) => (c === 0 ? v : `(${plusC(v, c)})`);
        if (r(0, 1) === 0) {
          // a1=(m-1)/m，a_{n+1}=1/(2-a_n) → a_n=(n+m-2)/(n+m-1)
          const A = (n) => fracTex(n + m - 2, n + m - 1);
          return {
            q: `$a_{1}=${A(1)}$，$a_{n+1}=\\frac{1}{2-a_{n}}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${K}}$ を求めよ。`,
            ans: fracAns(K + m - 2, K + m - 1),
            hint: "$a_{2},\\ a_{3},\\ a_{4}$ を計算して一般項を推測し，数学的帰納法で確かめる。",
            steps: [
              `$a_{2}=${A(2)}$，$a_{3}=${A(3)}$，$a_{4}=${A(4)}$ から $a_{n}=\\frac{${plusC("n", m - 2)}}{${plusC("n", m - 1)}}$ と推測できる`,
              `$a_{k}=\\frac{${plusC("k", m - 2)}}{${plusC("k", m - 1)}}$ と仮定すると $a_{k+1}=\\frac{1}{2-a_{k}}=\\frac{${plusC("k", m - 1)}}{2${wrap("k", m - 1)}-${wrap("k", m - 2)}}=\\frac{${plusC("k", m - 1)}}{${plusC("k", m)}}$ となり，$n=k+1$ でも成り立つ`,
              `答え：$a_{${K}}=${A(K)}$`,
            ],
          };
        }
        // a1=(m+1)/m，a_{n+1}=2-1/a_n → a_n=(n+m)/(n+m-1)
        const A = (n) => fracTex(n + m, n + m - 1);
        return {
          q: `$a_{1}=${A(1)}$，$a_{n+1}=2-\\frac{1}{a_{n}}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${K}}$ を求めよ。`,
          ans: fracAns(K + m, K + m - 1),
          hint: "$a_{2},\\ a_{3},\\ a_{4}$ を計算して一般項を推測し，数学的帰納法で確かめる。",
          steps: [
            `$a_{2}=${A(2)}$，$a_{3}=${A(3)}$，$a_{4}=${A(4)}$ から $a_{n}=\\frac{${plusC("n", m)}}{${plusC("n", m - 1)}}$ と推測できる`,
            `$a_{k}=\\frac{${plusC("k", m)}}{${plusC("k", m - 1)}}$ と仮定すると $a_{k+1}=2-\\frac{${plusC("k", m - 1)}}{${plusC("k", m)}}=\\frac{${plusC("k", m + 1)}}{${plusC("k", m)}}$ となり，$n=k+1$ でも成り立つ`,
            `答え：$a_{${K}}=${A(K)}$`,
          ],
        };
      }),
      t("HB-zenka-3e", (r) => {
        const p = pick(r, [2, 3]), al = rnz(r, -3, 3), be = r(-4, 4), A = r(-3, 5);
        const C = A + al + be;
        if (C === 0 || Math.abs(C) === p) return { skip: true }; // 2・2^{n-1} のような形を避ける
        const q = al * (p - 1), rc = be * (p - 1) - al;
        const lin = (x, y) => `${signedVar(x, "n")}${y ? signed(y) : ""}`; // +xn+y の形
        // 選択肢は { tex, f(n) }（値で重複除去する）
        const F = (c, e, x, y) => (c === 0 ? null : { tex: tex(`a_{n}=${geoTex(c, p, e)}${lin(-x, -y)}`), f: (n) => c * p ** (e === "n" ? n : n - 1) - x * n - y });
        const corr = F(C, "n-1", al, be), sq = `a_{n}${lin(al, be)}`, k1 = p - 1 === 1 ? "" : p - 1;
        return {
          q: `$a_{1}=${A}$，$a_{n+1}=${p}a_{n}${signedVar(q, "n")}${rc ? signed(rc) : ""}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans: corr.tex,
          choices: choicesByValue(r, corr, [F(C, "n", al, be), F(A - al - be, "n-1", -al, -be), F(A, "n-1", al, be)], (i) => F(C + i + 1, "n-1", al, be)),
          hint: "$a_{n}+\\alpha n+\\beta$ が等比数列になるように，定数 $\\alpha,\\ \\beta$ を決める。",
          steps: [
            `$a_{n+1}+\\alpha(n+1)+\\beta=${p}(a_{n}+\\alpha n+\\beta)$ を展開してもとの式と比べると，$${k1}\\alpha=${q}$，$${k1}\\beta-\\alpha=${rc}$ より $\\alpha=${al}$，$\\beta=${be}$`,
            `数列 $\\{${sq}\\}$ は初項 $${A}${signed(al)}${be ? signed(be) : ""}=${C}$，公比 $${p}$ の等比数列`,
            `$${sq}=${geoTex(C, p, "n-1")}$ より $a_{n}=${geoTex(C, p, "n-1")}${lin(-al, -be)}$`,
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
        // 選択肢は { tex, f(n) }（値で重複除去する）
        const form = (x1, b1, x2, b2, e = "n-1") => (x1 === 0 || x2 === 0 ? null : {
          tex: tex(`a_{n}=${term(x1, b1, true, e)}${term(x2, b2, false, e)}`),
          f: (n) => { const m = e === "n" ? n : n - 1; return x1 * b1 ** m + x2 * b2 ** m; },
        });
        const rec = `a_{n+2}=${s === 0 ? coefVar(-pr, "a_{n}") : `${coefVar(s, "a_{n+1}")}${signedVar(-pr, "a_{n}")}`}`;
        const corr = form(c1, al, c2, be);
        const ans = corr.tex;
        const bt = (sym, b) => (b === 1 ? sym : `${sym}\\cdot ${par(b)}^{n-1}`);
        return {
          q: `$a_{1}=${a1}$，$a_{2}=${a2}$，$${rec}$ で定められる数列 $\\{a_{n}\\}$ の一般項を求めよ。`,
          ans,
          choices: choicesByValue(r, corr, [form(c2, al, c1, be), form(c1, al, c2, be, "n"), form(c1, al, -c2, be)],
            (i) => form(c1 + i + 1, al, c2, be)),
          hint: "$x^{2}=(\\cdots)x+(\\cdots)$ の2解 $\\alpha,\\ \\beta$ を求め，$a_{n+2}-\\alpha a_{n+1}=\\beta(a_{n+1}-\\alpha a_{n})$ と変形する。",
          steps: [
            `$x^{2}=${s === 0 ? String(-pr) : `${coefVar(s)}${signed(-pr)}`}$ の解は $x=${al},\\ ${be}$`,
            `$a_{n+2}${signedVar(-al, "a_{n+1}")}=${par(be)}(a_{n+1}${signedVar(-al, "a_{n}")})$ などから，$a_{n}=${bt("p", al)}+${bt("q", be)}$ の形になる`,
            `$a_{1}=p+q=${a1}$，$a_{2}=${coefVar(al, "p")}${signedVar(be, "q")}=${a2}$ より $p=${c1}$，$q=${c2}$`,
            `答え：${ans}`,
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
            `$\\alpha=${al}$ として $b_{n}+${fracTex(p, rr - 1)}=${c}\\cdot ${rr}^{n-1}$`,
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
      t("HB-zenka-4d", (r) => {
        const K = r(3, 6);
        if (r(0, 1) === 0) {
          const [sn, sd] = pick(r, [[0, 1], [1, 2], [1, 4]]); // とどまる確率 s
          const mv = fracTex(sd - sn, 2 * sd); // ほかの頂点へ移る確率（それぞれ）
          const ln = 3 * sn - sd, ld = 2 * sd, lt = fracTex(ln, ld); // p_{n+1}-1/3=(s-mv)(p_n-1/3)
          const move = sn === 0
            ? "いまいる頂点以外の2つの頂点のどちらかへ，それぞれ確率 $\\frac{1}{2}$ で移る"
            : `確率 $${fracTex(sn, sd)}$ でいまいる頂点にとどまり，残りの2つの頂点へそれぞれ確率 $${mv}$ で移る`;
          const N = ld ** K + 2 * ln ** K, D = 3 * ld ** K;
          return {
            q: `正三角形 ABC の頂点を動く点 P がある。P は1秒ごとに，${move}。最初 P は頂点 A にある。$n$ 秒後に P が A にある確率を $p_{n}$ とするとき，$p_{${K}}$ を求めよ。`,
            ans: fracAns(N, D),
            hint: "最後の1秒で場合分けして，$p_{n+1}$ を $p_{n}$ で表す。",
            steps: [
              sn === 0
                ? `$n+1$ 秒後に A にあるのは，$n$ 秒後に A 以外にあって A へ移るとき：$p_{n+1}=\\frac{1}{2}(1-p_{n})$`
                : `$n+1$ 秒後に A にあるのは，$n$ 秒後に A にあってとどまるか，A 以外にあって A へ移るとき：$p_{n+1}=${fracTex(sn, sd)}p_{n}+${mv}(1-p_{n})$`,
              `$p_{n+1}-\\frac{1}{3}=${lt}\\left(p_{n}-\\frac{1}{3}\\right)$，最初（$0$ 秒後）は A にあるので $p_{0}=1$。よって $p_{n}=\\frac{1}{3}+\\frac{2}{3}\\left(${lt}\\right)^{n}$`,
              `答え：$p_{${K}}=\\frac{1}{3}+\\frac{2}{3}\\left(${lt}\\right)^{${K}}=${fracTex(N, D)}$`,
            ],
          };
        }
        const [qn, qd, ev] = pick(r, [[1, 6, "1の目"], [1, 3, "3の倍数の目"], [1, 6, "6の目"]]);
        const lt = fracTex(qd - 2 * qn, qd), ln = qd - 2 * qn, ld = qd; // p_{n+1}-1/2=(1-2q)(p_n-1/2)
        const N = ld ** K + ln ** K, D = 2 * ld ** K;
        return {
          q: `1個のさいころを $n$ 回投げるとき，${ev}が出る回数が偶数である確率を $p_{n}$ とする（$0$ 回も偶数とする）。$p_{${K}}$ を求めよ。`,
          ans: fracAns(N, D),
          hint: "最後の1回で場合分けして，$p_{n+1}$ を $p_{n}$ で表す。",
          steps: [
            `$n+1$ 回目までで偶数回となるのは，$n$ 回目までで偶数回で $n+1$ 回目に出ないか，奇数回で $n+1$ 回目に出るとき：$p_{n+1}=${fracTex(qd - qn, qd)}p_{n}+${fracTex(qn, qd)}(1-p_{n})$`,
            `$p_{n+1}-\\frac{1}{2}=${lt}\\left(p_{n}-\\frac{1}{2}\\right)$，$p_{0}=1$ より $p_{n}=\\frac{1}{2}+\\frac{1}{2}\\left(${lt}\\right)^{n}$`,
            `答え：$p_{${K}}=\\frac{1}{2}+\\frac{1}{2}\\left(${lt}\\right)^{${K}}=${fracTex(N, D)}$`,
          ],
        };
      }),
      t("HB-zenka-4e", (r) => {
        const A = r(1, 6), K = r(5, 30);
        if (r(0, 1) === 0) {
          return {
            q: `数列 $\\{a_{n}\\}$ が $a_{1}=${A}$，$a_{1}+a_{2}+\\cdots+a_{n}=n^{2}a_{n}$（$n=1,\\ 2,\\ 3,\\ \\cdots$）をみたすとき，$a_{${K}}$ を求めよ。`,
            ans: fracAns(2 * A, K * (K + 1)),
            hint: "$S_{n}=a_{1}+\\cdots+a_{n}$ とおき，$S_{n}-S_{n-1}=a_{n}$ を使って $a_{n}$ と $a_{n-1}$ の関係式をつくる。",
            steps: [
              `$S_{n}=a_{1}+\\cdots+a_{n}$ とする。$n\\geqq 2$ のとき $a_{n}=S_{n}-S_{n-1}=n^{2}a_{n}-(n-1)^{2}a_{n-1}$ より $(n+1)(n-1)a_{n}=(n-1)^{2}a_{n-1}$，$a_{n}=\\frac{n-1}{n+1}a_{n-1}$`,
              `これをくり返して $a_{n}=\\frac{n-1}{n+1}\\cdot\\frac{n-2}{n}\\cdot\\frac{n-3}{n-1}\\cdots\\frac{2}{4}\\cdot\\frac{1}{3}a_{1}=\\frac{2}{n(n+1)}a_{1}=\\frac{${2 * A}}{n(n+1)}$`,
              `答え：$a_{${K}}=\\frac{${2 * A}}{${K}\\cdot ${K + 1}}=${fracTex(2 * A, K * (K + 1))}$`,
            ],
          };
        }
        return {
          q: `$a_{1}=${A}$，$na_{n+1}=(n+2)a_{n}$ で定められる数列 $\\{a_{n}\\}$ の $a_{${K}}$ を求めよ。`,
          ans: (A * K * (K + 1)) / 2,
          hint: "両辺を $n(n+1)(n+2)$ で割ると，一定になる式が見つかる。",
          steps: [
            `両辺を $n(n+1)(n+2)$ で割ると $\\frac{a_{n+1}}{(n+1)(n+2)}=\\frac{a_{n}}{n(n+1)}$`,
            `よって $\\frac{a_{n}}{n(n+1)}$ は一定で $\\frac{a_{1}}{1\\cdot 2}=${fracTex(A, 2)}$。$a_{n}=${cfTex(A, 2)}n(n+1)$`,
            `答え：$a_{${K}}=${A === 2 ? "" : `${fracTex(A, 2)}\\cdot `}${K}\\cdot ${K + 1}=${(A * K * (K + 1)) / 2}$`,
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

/** 片側検定の題材 [文（{n} {x} に数を入れる）, n, p分子, p分母, m, σ, 向き(1:大きい -1:小さい), X の説明, 帰無仮説, 主張] */
const ONE = [
  ["ある種子の発芽率はこれまで $\\frac{4}{5}$ であった。品種を改良した種子を {n} 個まいたところ，{x} 個が発芽した。", 400, 4, 5, 320, 8, 1, "発芽した個数", "発芽率は $\\frac{4}{5}$ である", "発芽率は上がった"],
  ["ある種子の発芽率はこれまで $\\frac{4}{5}$ であった。品種を改良した種子を {n} 個まいたところ，{x} 個が発芽した。", 625, 4, 5, 500, 10, 1, "発芽した個数", "発芽率は $\\frac{4}{5}$ である", "発芽率は上がった"],
  ["ある政策の支持率はこれまで $\\frac{1}{2}$ であった。無作為に選んだ {n} 人に調査したところ，{x} 人が支持した。", 400, 1, 2, 200, 10, 1, "支持した人数", "支持率は $\\frac{1}{2}$ である", "支持率は上がった"],
  ["ある政策の支持率はこれまで $\\frac{1}{2}$ であった。無作為に選んだ {n} 人に調査したところ，{x} 人が支持した。", 400, 1, 2, 200, 10, -1, "支持した人数", "支持率は $\\frac{1}{2}$ である", "支持率は下がった"],
  ["ある政策の支持率はこれまで $\\frac{1}{2}$ であった。無作為に選んだ {n} 人に調査したところ，{x} 人が支持した。", 100, 1, 2, 50, 5, -1, "支持した人数", "支持率は $\\frac{1}{2}$ である", "支持率は下がった"],
  ["ある製品の不良品の割合はこれまで $\\frac{1}{5}$ であった。製造方法を改良したあと，無作為に {n} 個を調べたところ，不良品は {x} 個であった。", 400, 1, 5, 80, 8, -1, "不良品の個数", "不良品の割合は $\\frac{1}{5}$ である", "不良品の割合は下がった"],
  ["1個のさいころを {n} 回投げたところ，1の目が {x} 回出た。", 180, 1, 6, 30, 5, 1, "1の目が出た回数", "1の目が出る確率は $\\frac{1}{6}$ である", "1の目が出やすい"],
  ["1個のさいころを {n} 回投げたところ，1の目が {x} 回出た。", 720, 1, 6, 120, 10, 1, "1の目が出た回数", "1の目が出る確率は $\\frac{1}{6}$ である", "1の目が出やすい"],
];

const TOUKEI = {
  id: "HB-toukei", grade: "H2", area: "data", name: "統計的な推測",
  desc: "確率変数・期待値と分散・二項分布・正規分布・推定・検定",
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
            `$=\\frac{${d.s1}}{${d.D}}${gcd(d.s1, d.D) === 1 && d.s1 > 0 ? "" : `=${fracTex(d.s1, d.D)}`}$`,
          ],
        };
      }),
      t("HB-toukei-1b", (r) => {
        const m = r(-5, 10), s = r(1, 5), v = s * s, a = rnz(r, -4, 4), b = rnz(r, -10, 10), type = r(0, 2);
        const Y = `${coefVar(a, "X")}${signed(b)}`;
        const [what, ans, how] = [
          [`E(${Y})`, a * m + b, `${coefVar(a, "E(X)")}${signed(b)}=${mulTex(a, par(m))}${signed(b)}`],
          [`V(${Y})`, a * a * v, Math.abs(a) === 1 ? "V(X)" : `${par(a)}^{2}V(X)=${par(a)}^{2}\\cdot ${v}`],
          [`\\sigma(${Y})`, Math.abs(a) * s, `${Math.abs(a) === 1 ? "\\sigma(X)" : `|${a}|\\sigma(X)`}=${mulTex(Math.abs(a), `\\sqrt{${v}}`)}`],
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
      t("HB-toukei-1d", (r) => {
        const [pn, pd] = pick(r, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [1, 6]]);
        const n = r(3, 6), k = r(1, n - 1), c = nCr(n, k);
        const P = fracTex(pn, pd), Qt = fracTex(pd - pn, pd);
        const num = c * pn ** k * (pd - pn) ** (n - k), den = pd ** n;
        return {
          q: `確率変数 $X$ が二項分布 $B\\left(${n},\\ ${P}\\right)$ に従うとき，$P(X=${k})$ を求めよ。`,
          ans: fracAns(num, den),
          hint: "二項分布 $B(n,\\ p)$ では $P(X=k)={}_{n}\\mathrm{C}_{k}\\,p^{k}(1-p)^{n-k}$。",
          steps: [
            `$P(X=${k})=${Cn(n, k)}${pw(`\\left(${P}\\right)`, k)}${pw(`\\left(${Qt}\\right)`, n - k)}$`,
            `$=${c}\\cdot\\frac{${pn ** k}}{${pd ** k}}\\cdot\\frac{${(pd - pn) ** (n - k)}}{${pd ** (n - k)}}=${fracTex(num, den)}$`,
          ],
        };
      }),
      t("HB-toukei-1e", (r) => {
        const rn = pick(r, [2, 4, 5, 10, 20]), n = rn * rn, sig = r(2, 30), m = r(20, 80), askV = r(0, 1) === 1;
        return {
          q: `母平均 $${m}$，母標準偏差 $${sig}$ の母集団から，大きさ $${n}$ の標本を無作為に抽出する。標本平均 $\\overline{X}$ の${askV ? "分散 $V(\\overline{X})$" : "標準偏差 $\\sigma(\\overline{X})$"} を求めよ。`,
          ans: askV ? fracAns(sig * sig, n) : round(sig / rn, 4),
          hint: "標本平均 $\\overline{X}$ の期待値は母平均 $m$，分散は $\\frac{\\sigma^{2}}{n}$，標準偏差は $\\frac{\\sigma}{\\sqrt{n}}$。",
          steps: askV
            ? [`$V(\\overline{X})=\\frac{\\sigma^{2}}{n}=\\frac{${sig}^{2}}{${n}}=${fracTex(sig * sig, n)}$`]
            : [`$\\sigma(\\overline{X})=\\frac{\\sigma}{\\sqrt{n}}=\\frac{${sig}}{\\sqrt{${n}}}=\\frac{${sig}}{${rn}}=${dec(sig / rn)}$`],
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
        const sqV = (c, V) => (Math.abs(c) === 1 ? V : `${par(c)}^{2}${V}`), sqN = (c, v) => (Math.abs(c) === 1 ? `${v}` : `${par(c)}^{2}\\cdot ${v}`);
        const [what, ans, how] = [
          [`V(${Z})`, a * a * VX + b * b * VY, `${sqV(a, "V(X)")}+${sqV(b, "V(Y)")}=${sqN(a, VX)}+${sqN(b, VY)}`],
          [`E(${Z})`, a * EX + b * EY, `${coefVar(a, "E(X)")}${signedVar(b, "E(Y)")}=${mulTex(a, par(EX))}${smulTex(b, par(EY))}`],
          ["E(XY)", EX * EY, `${par(EX)}\\cdot ${par(EY)}`],
        ][type];
        return {
          q: `互いに独立な確率変数 $X,\\ Y$ について，$E(X)=${EX}$，$V(X)=${VX}$，$E(Y)=${EY}$，$V(Y)=${VY}$ である。$${what}$ を求めよ。`,
          ans,
          hint: "独立なとき $V(aX+bY)=a^{2}V(X)+b^{2}V(Y)$（係数は2乗するので必ずたし算），$E(XY)=E(X)E(Y)$。",
          steps: [`$${what}=${how}=${ans}$`],
        };
      }),
      t("HB-toukei-2d", (r) => {
        const a = r(2, 5), b = r(2, 5), c = pick(r, [2, 3]), askE = r(0, 1) === 1;
        const T = nCr(a + b, c), xs = [];
        for (let x = Math.max(0, c - b); x <= Math.min(c, a); x++) xs.push([x, nCr(a, x) * nCr(b, c - x)]);
        const s1 = xs.reduce((s, [x, w]) => s + x * w, 0), s2 = xs.reduce((s, [x, w]) => s + x * x * w, 0);
        const vN = T * s2 - s1 * s1, vD = T * T;
        return {
          q: `袋の中に赤玉 $${a}$ 個と白玉 $${b}$ 個が入っている。この袋から同時に $${c}$ 個の玉を取り出すとき，取り出した赤玉の個数を $X$ とする。$X$ の${askE ? "期待値 $E(X)$" : "分散 $V(X)$"} を求めよ。`,
          ans: askE ? fracAns(s1, T) : fracAns(vN, vD),
          hint: "まず $X$ の確率分布（それぞれの値をとる確率）を組合せで求める。",
          steps: [
            `$P(X=x)=\\frac{${Cn(a, "x")}\\times ${Cn(b, `${c}-x`)}}{${Cn(a + b, c)}}$ より ${xs.map(([x, w]) => `$P(X=${x})=${fracTex(w, T)}$`).join("，")}`,
            askE
              ? `$E(X)=${xs.map(([x, w]) => `${x}\\cdot ${fracTex(w, T)}`).join("+")}=${fracTex(s1, T)}$`
              : `$E(X)=${fracTex(s1, T)}$，$E(X^{2})=${xs.map(([x, w]) => `${x}^{2}\\cdot ${fracTex(w, T)}`).join("+")}=${fracTex(s2, T)}$ より $V(X)=${fracTex(s2, T)}-\\left(${fracTex(s1, T)}\\right)^{2}=${fracTex(vN, vD)}$`,
          ],
        };
      }),
      t("HB-toukei-2e", (r) => {
        const c = r(2, 6), inc = r(0, 1) === 1;
        const s = r(0, c - 1);
        let u = r(s + 1, c);
        if (s === 0 && u === c) u = c - 1;
        const num = inc ? u * u - s * s : (c - s) ** 2 - (c - u) ** 2;
        const k = fracTex(2, c * c), fx = inc ? `${k}x` : `${k}(${c}-x)`;
        const sq = (x) => `${x}^{2}`, diff = (x, y) => (y === 0 ? sq(x) : `${sq(x)}-${sq(y)}`);
        return {
          q: `確率変数 $X$ のとる値の範囲が $0\\leqq X\\leqq ${c}$ で，その確率密度関数が $f(x)=${inc ? "kx" : `k(${c}-x)`}$（$k$ は定数）であるとき，$P(${s}\\leqq X\\leqq ${u})$ を求めよ。`,
          ans: fracAns(num, c * c),
          hint: "確率は $y=f(x)$ のグラフと $x$ 軸の間の部分の面積。まず全体の面積が $1$ になるように $k$ を決める。",
          steps: [
            `全体の確率は $1$ なので $\\int_{0}^{${c}}f(x)\\,dx=\\frac{1}{2}\\cdot ${c}\\cdot ${c}k=1$ より $k=${k}$`,
            `$P(${s}\\leqq X\\leqq ${u})=\\int_{${s}}^{${u}}${fx}\\,dx=\\frac{${inc ? diff(u, s) : diff(c - s, c - u)}}{${c * c}}=${fracTex(num, c * c)}$`,
          ],
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
      t("HB-toukei-3d", (r) => {
        const rn = pick(r, [4, 5, 6, 8, 10, 12, 20]);
        const sx = pick(r, rn % 2 === 0 ? [0.5, 1, 1.5, 2, 2.5, 3] : [1, 2, 3]);
        const n = rn * rn, sig = round(sx * rn, 4), m = r(40, 80), type = r(0, 3), k = r(1, 2);
        const T = [0, T1, T2], at = (j) => dec(m + j * sx);
        let ev, ans, how;
        if (type === 0) { ev = `\\overline{X}\\geqq ${at(k)}`; ans = 0.5 - T[k]; how = `P(Z\\geqq ${k})=0.5-${T[k]}`; }
        else if (type === 1) { ev = `\\overline{X}\\leqq ${at(-k)}`; ans = 0.5 - T[k]; how = `P(Z\\leqq -${k})=0.5-${T[k]}`; }
        else if (type === 2) { ev = `${at(-k)}\\leqq\\overline{X}\\leqq ${at(k)}`; ans = 2 * T[k]; how = `P(-${k}\\leqq Z\\leqq ${k})=2\\times ${T[k]}`; }
        else { ev = `${at(-1)}\\leqq\\overline{X}\\leqq ${at(2)}`; ans = T1 + T2; how = `P(-1\\leqq Z\\leqq 2)=${T1}+${T2}`; }
        ans = round(ans, 4);
        return {
          q: `母平均 $${m}$，母標準偏差 $${sig}$ の母集団から，大きさ $${n}$ の標本を無作為に抽出する。標本平均 $\\overline{X}$ について，$P(${ev})$ を求めよ。$\\overline{X}$ は正規分布に従うとみなしてよい。${TAB}`,
          ans,
          hint: "$\\overline{X}$ は正規分布 $N\\left(m,\\ \\frac{\\sigma^{2}}{n}\\right)$ に従う。標準偏差 $\\frac{\\sigma}{\\sqrt{n}}$ で標準化する。",
          steps: [
            `$\\overline{X}$ の期待値は $${m}$，標準偏差は $\\frac{${sig}}{\\sqrt{${n}}}=${dec(sx)}$`,
            `$Z=\\frac{\\overline{X}-${m}}{${dec(sx)}}$ とおくと，$Z$ は $N(0,\\ 1)$ に従う`,
            `$P(${ev})=${how}=${dec(ans)}$`,
          ],
        };
      }),
      t("HB-toukei-3e", (r) => {
        const [story, n, pn, pd, m, s, dir, xName, h0, claim] = pick(r, ONE);
        const d = dir * r(Math.ceil(0.5 * s), 3 * s), z = round(d / s, 4);
        if (Math.abs(Math.abs(z) - 1.64) < 0.05) return { skip: true };
        const x = m + d, rej = dir * z >= 1.64, z2 = round(d / (s * s), 4);
        const C = (zz, rj) => `$z=${dec(zz)}$ で，帰無仮説を${rj ? `棄却する（${claim}といえる）` : `棄却しない（${claim}とはいえない）`}`;
        const ans = C(z, rej);
        return {
          q: `${story.replace("{n}", `$${n}$`).replace("{x}", `$${x}$`)}${claim}と判断してよいか。帰無仮説を「${h0}」として，有意水準5%で片側検定する。${xName}を $X$ とし，検定統計量 $z=\\frac{X-m}{\\sigma}$（$m,\\ \\sigma$ は帰無仮説のもとでの $X$ の期待値と標準偏差）の値と結論の組として正しいものを選べ。ただし，正規分布で近似し，$P(Z\\geqq 1.64)=0.05$ とする。`,
          ans,
          choices: choices4(r, ans, [C(z, !rej), C(z2, dir * z2 >= 1.64), C(z2, !(dir * z2 >= 1.64))],
            (i) => C(round(z + 0.5 * (i + 1), 4), i % 2 === 0)),
          hint: "「上がった（大きい）」かを調べるなら棄却域は右側の $Z\\geqq 1.64$ だけ，「下がった（小さい）」なら左側の $Z\\leqq -1.64$ だけにとる（片側検定）。",
          steps: [
            `帰無仮説のもとで $X$ は二項分布 $B\\left(${n},\\ ${fracTex(pn, pd)}\\right)$ に従い，$m=${m}$，$\\sigma=\\sqrt{${s * s}}=${s}$`,
            `$z=\\frac{${x}-${m}}{${s}}=${dec(z)}$`,
            `棄却域は $Z${dir > 0 ? "\\geqq 1.64" : "\\leqq -1.64"}$ で，$z$ は棄却域に${rej ? "入る" : "入らない"}。よって${rej ? "帰無仮説を棄却する" : "帰無仮説は棄却されない"}`,
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
        // 割り切れないときは小数第2位までで切って「…」をつける
        const cut = (x) => { const tr = Math.floor(x * 100 + 1e-9) / 100; return Math.abs(tr - x) < 1e-9 ? String(round(x, 2)) : `${tr.toFixed(2)}\\ldots`; };
        return {
          q: `母標準偏差が $${sig}$ の母集団から標本を抽出して，母平均を信頼度95%で推定する。信頼区間の幅を $${W}$ 以下にするには，標本の大きさ $n$ を少なくともいくつにすればよいか。`,
          ans: nmin,
          hint: "信頼区間の幅は $2\\times 1.96\\cdot\\frac{\\sigma}{\\sqrt{n}}$。これが指定の値以下となる $n$ を求める。",
          steps: [
            `幅は $2\\times 1.96\\times\\frac{${sig}}{\\sqrt{n}}=\\frac{${round(3.92 * sig, 2)}}{\\sqrt{n}}$`,
            `$\\frac{${round(3.92 * sig, 2)}}{\\sqrt{n}}\\leqq ${W}$ より $\\sqrt{n}\\geqq ${cut((3.92 * sig) / W)}$，$n\\geqq ${cut(num / den)}$`,
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
          q: `${story.replace("{n}", `$${n}$`).replace("のくじ", "とされるくじ")}を調べたところ $${X}$ 回であった。確率が $${fracTex(pn, pd)}$ であるという帰無仮説を，有意水準5%で両側検定する。検定統計量 $z=\\frac{X-m}{\\sigma}$ の値と結論の組として正しいものを選べ。ただし，正規分布で近似し，$P(|Z|\\geqq 1.96)=0.05$ とする。`,
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
        const eqs = (x, shown) => (Math.abs(x - shown) < 1e-12 ? "=" : "\\fallingdotseq "); // 丸めたときは ≒
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
            `$\\sqrt{\\frac{${ph}\\times ${round(1 - ph, 2)}}{${n}}}=\\frac{${sq}}{${rn}}${eqs(sq / rn, se)}${dec(se, 6)}$，$1.96\\times ${dec(se, 6)}${eqs(1.96 * se, w)}${dec(w)}$`,
            `答え：${ans}`,
          ],
        };
      }),
      t("HB-toukei-4d", (r) => {
        const [pn, pd, story] = pick(r, [
          [1, 6, "1個のさいころを {n} 回投げるとき，1の目がちょうど $k$ 回出る確率"],
          [1, 3, "1個のさいころを {n} 回投げるとき，3の倍数の目がちょうど $k$ 回出る確率"],
          [2, 3, "1個のさいころを {n} 回投げるとき，3の倍数でない目がちょうど $k$ 回出る確率"],
          [1, 5, "当たりの確率が $\\frac{1}{5}$ のくじを {n} 回引く（毎回もどす）とき，ちょうど $k$ 回当たる確率"],
        ]);
        const n = r(10, 80), x = ((n + 1) * pn) / pd;
        if (Number.isInteger(x)) return { skip: true };
        const K = Math.floor(x), P = fracTex(pn, pd), Qt = fracTex(pd - pn, pd);
        const lhs = pn === 1 ? `${n}-k` : `${pn}(${n}-k)`, rhs = `${pd - pn === 1 ? "" : pd - pn}(k+1)`;
        return {
          q: `${story.replace("{n}", `$${n}$`)}を $p_{k}$ とする（$k=0,\\ 1,\\ \\cdots,\\ ${n}$）。$p_{k}$ が最大となる $k$ を求めよ。`,
          ans: K,
          hint: "となり合う確率の比 $\\frac{p_{k+1}}{p_{k}}$ が $1$ より大きいかどうかを調べる。",
          steps: [
            `$p_{k}=${Cn(n, "k")}\\left(${P}\\right)^{k}\\left(${Qt}\\right)^{${n}-k}$ より $\\frac{p_{k+1}}{p_{k}}=\\frac{${n}-k}{k+1}\\cdot ${fracTex(pn, pd - pn)}$`,
            `$\\frac{p_{k+1}}{p_{k}}>1\\iff ${lhs}>${rhs}\\iff k<${fracTex((n + 1) * pn - pd, pd)}$`,
            `よって $p_{0}<p_{1}<\\cdots<p_{${K}}$，$p_{${K}}>p_{${K + 1}}>\\cdots>p_{${n}}$ となり，最大となるのは $k=${K}$`,
          ],
        };
      }),
      t("HB-toukei-4e", (r) => {
        if (r(0, 1) === 0) {
          const n = r(2, 6), num = 6 ** n - 5 ** n;
          return {
            q: `1個のさいころを $${n}$ 回投げるとき，出た目の種類の数を $X$ とする（同じ目が何回出ても1種類と数える）。$X$ の期待値を求めよ。`,
            ans: fracAns(num, 6 ** (n - 1)),
            hint: "$X$ を「目 $i$ が出たら $1$，出なければ $0$」となる確率変数の和に分けて，期待値の和の性質を使う。",
            steps: [
              `$i=1,\\ 2,\\ \\cdots,\\ 6$ について，目 $i$ が少なくとも1回出れば $1$，出なければ $0$ となる確率変数を $X_{i}$ とすると $X=X_{1}+X_{2}+\\cdots+X_{6}$`,
              `目 $i$ が1回も出ない確率は $\\left(\\frac{5}{6}\\right)^{${n}}$ なので $E(X_{i})=1-\\left(\\frac{5}{6}\\right)^{${n}}=${fracTex(num, 6 ** n)}$`,
              `$E(X)=E(X_{1})+E(X_{2})+\\cdots+E(X_{6})=6\\times ${fracTex(num, 6 ** n)}=${fracTex(num, 6 ** (n - 1))}$`,
            ],
          };
        }
        const m = pick(r, [3, 4]), n = r(3, 6), num = (m - 1) ** n, den = m ** (n - 1);
        return {
          q: `$${n}$ 個の玉を $${m}$ 個の箱に1個ずつ入れていく。どの玉もどの箱にも同じ確率 $\\frac{1}{${m}}$ で入るとき，空の箱の個数を $X$ とする。$X$ の期待値を求めよ。`,
          ans: fracAns(num, den),
          hint: "$X$ を「箱 $j$ が空なら $1$，空でなければ $0$」となる確率変数の和に分けて，期待値の和の性質を使う。",
          steps: [
            `箱 $j$（$j=1,\\ \\cdots,\\ ${m}$）が空なら $1$，空でなければ $0$ となる確率変数を $Y_{j}$ とすると $X=Y_{1}+\\cdots+Y_{${m}}$`,
            `箱 $j$ が空になるのは，どの玉もほかの箱に入るときなので $E(Y_{j})=\\left(\\frac{${m - 1}}{${m}}\\right)^{${n}}$`,
            `$E(X)=${m}\\times\\left(\\frac{${m - 1}}{${m}}\\right)^{${n}}=${fracTex(num, den)}$`,
          ],
        };
      }),
    ],
  },
};

export const UNITS = [SURETSU, SIGMA, ZENKA, TOUKEI];
