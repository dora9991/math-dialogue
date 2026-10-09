// ============================================================
// tpl/hs_calc_limit.js — 高校 極限（数III）
//   limit_seq（数列の極限・無限級数）/ limit_func（関数の極限）
//
//  すべて自作の数値・言い回し。答えは、十分大きい n（または 0 に十分近い x）での値を数値で計算して確かめている。
//  無限級数の和は、部分和を厳密に計算した式とも照らし合わせている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, gcd, num as qnum, pow as qpow } from "../../core/rational.js";
import { tq, tp } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert } from "./util.js";
import { nearly } from "./hs_util.js";
import { $, px, poly, at } from "./hs_calc_deriv.js";

/** n の多項式（係数は低次から）の TeX */
const pn = (cs) => Poly.fromCoeffs(cs, "n").toTeX({ order: ["n"] });
/** n → ∞ の極限の記号 */
const LIMN = "\\displaystyle\\lim_{n\\to\\infty}";
/** 係数の TeX（1 は省き、-1 は "-"） */
const co = (k) => (k === 1 ? "" : k === -1 ? "-" : String(k));

/** 分数 n/d の TeX。約分できる・分母が 1 のときだけ「=答え」を付ける */
function fracEq(n, d) {
  const raw = `\\dfrac{${n}}{${d}}`;
  return d > 1 && gcd(Math.abs(n), d) === 1 ? raw : `${raw}=${tq(Q(n, d))}`;
}

/** 選択肢の標準の言い回し */
const OPT = {
  zero: "$0$ に収束する",
  one: "$1$ に収束する",
  minusOne: "$-1$ に収束する",
  inf: "正の無限大に発散する",
  ninf: "負の無限大に発散する",
  osc: "振動して、極限はない",
  none: "極限は存在しない",
};

/** 数列 a_n の n が十分大きいときのふるまいを数値で判定する（"0" | 値 | "inf" | "-inf" | "osc"） */
function classify(seq, n0 = 60) {
  const v = [0, 1, 2, 3].map((i) => seq(n0 + i));
  if (v.every((x) => Math.abs(x) < 1e-6)) return "0";
  if (v.every((x) => Math.abs(x) > 1e6)) {
    if (v.every((x) => x > 0)) return "inf";
    if (v.every((x) => x < 0)) return "-inf";
    return "osc";
  }
  if (v.every((x) => Math.abs(x - v[0]) < 1e-6 * Math.max(1, Math.abs(v[0])))) return String(Math.round(v[0] * 1e6) / 1e6);
  return "osc";
}

export default {
  // ── 数列の極限・無限級数 ──────────────────────
  limit_seq: [
    t("num", (r, lv) => {
      // 分数式の極限
      if (lv === 1) {
        const a = r.nz(-5, 5);
        const b = r.int(-6, 6);
        const c = r.int(1, 4);
        const d = r.int(1, 6);
        const ans = Q(a, c);
        nearly((a * 1e7 + b) / (c * 1e7 + d), qnum(ans), "極限の検算", 1e-5);
        return num({
          q: `$${LIMN}\\dfrac{${pn([b, a])}}{${pn([d, c])}}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(a), "MC-LIM-COEF-NUM"], [Q(b, d), "MC-LIM-CONST-RATIO"], [Q(c, a), "MC-LIM-INVERT"], [Q(0), "MC-LIM-INF-OVER-INF"]],
          explain: `分母の最高次の項 $n$ で分子・分母をわると $\\dfrac{${a}+\\frac{${b}}{n}}{${c}+\\frac{${d}}{n}}$。$n\\to\\infty$ で $\\dfrac1n\\to 0$ なので、極限は $${fracEq(a, c)}$。（最高次の係数の比）`,
        });
      }
      if (lv === 2) {
        const a = r.nz(-5, 5);
        const b = r.int(-6, 6);
        const c = r.int(-6, 6);
        const d = r.int(1, 4);
        const e = r.int(0, 5);
        const f = r.int(1, 6);
        const ans = Q(a, d);
        const N = 1e7;
        nearly((a * N * N + b * N + c) / (d * N * N + e * N + f), qnum(ans), "極限の検算", 1e-5);
        return num({
          q: `$${LIMN}\\dfrac{${pn([c, b, a])}}{${pn([f, e, d])}}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(a), "MC-LIM-COEF-NUM"], [Q(c, f), "MC-LIM-CONST-RATIO"], [Q(b, e === 0 ? 1 : e), "MC-LIM-CONST-RATIO"], [Q(0), "MC-LIM-INF-OVER-INF"]],
          explain: `分母の最高次の項 $n^{2}$ で分子・分母をわると $\\dfrac{${a}+\\frac{${b}}{n}+\\frac{${c}}{n^{2}}}{${d}+\\frac{${e}}{n}+\\frac{${f}}{n^{2}}}$。$n\\to\\infty$ で $\\dfrac1n$、$\\dfrac1{n^{2}}$ は $0$ に近づくので、極限は $${fracEq(a, d)}$。（次数が同じなら最高次の係数の比）`,
        });
      }
      // 和の公式を使う形
      const kind = r.pick(["sum1", "sum2", "odd", "even"]);
      const N = 1e7;
      if (kind === "sum1") {
        const ans = Q(1, 2);
        nearly((N * (N + 1)) / 2 / (N * N), 0.5, "極限の検算", 1e-5);
        return num({
          q: `$${LIMN}\\dfrac{1+2+3+\\cdots+n}{n^{2}}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(1), "MC-LIM-SUM-TERMS"], [Q(0), "MC-LIM-INF-OVER-INF"], [Q(1, 4), "MC-SEQ-SUM-HALF"]],
          explain: `分子は等差数列の和で $1+2+\\cdots+n=\\dfrac{n(n+1)}{2}$。よって $\\dfrac{n(n+1)}{2n^{2}}=\\dfrac{1}{2}\\left(1+\\dfrac1n\\right)\\to\\dfrac12$。（先に和の公式で $n$ の式にしてから極限をとる）`,
        });
      }
      if (kind === "sum2") {
        const ans = Q(1, 3);
        nearly((N * (N + 1) * (2 * N + 1)) / 6 / (N * N * N), 1 / 3, "極限の検算", 1e-5);
        return num({
          q: `$${LIMN}\\dfrac{1^{2}+2^{2}+3^{2}+\\cdots+n^{2}}{n^{3}}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(1, 2), "MC-LIM-SUM-TERMS"], [Q(1, 6), "MC-LIM-COEF-NUM"], [Q(0), "MC-LIM-INF-OVER-INF"]],
          explain: `分子は $1^{2}+2^{2}+\\cdots+n^{2}=\\dfrac{n(n+1)(2n+1)}{6}$。よって $\\dfrac{n(n+1)(2n+1)}{6n^{3}}=\\dfrac16\\left(1+\\dfrac1n\\right)\\left(2+\\dfrac1n\\right)\\to\\dfrac{2}{6}=\\dfrac13$。`,
        });
      }
      if (kind === "odd") {
        nearly((N * N) / (N * N), 1, "極限の検算", 1e-9);
        return num({
          q: `$${LIMN}\\dfrac{1+3+5+\\cdots+(2n-1)}{n^{2}+n}$ の値を求めなさい。`,
          ans: Q(1),
          wrongs: [[Q(1, 2), "MC-LIM-SUM-TERMS"], [Q(2), "MC-LIM-SUM-TERMS"], [Q(0), "MC-LIM-INF-OVER-INF"]],
          explain: `分子は初項 $1$、公差 $2$、項数 $n$ の等差数列の和なので $n^{2}$。よって $\\dfrac{n^{2}}{n^{2}+n}=\\dfrac{1}{1+\\frac1n}\\to 1$。`,
        });
      }
      const k = r.int(2, 4);
      const ans = Q(k, 2);
      nearly(((k * N * (N + 1)) / 2) / (N * N), qnum(ans), "極限の検算", 1e-5);
      return num({
        q: `$${LIMN}\\dfrac{${k}\\cdot 1+${k}\\cdot 2+${k}\\cdot 3+\\cdots+${k}\\cdot n}{n^{2}}$ の値を求めなさい。`,
        ans,
        reduced: true,
        wrongs: [[Q(k), "MC-LIM-SUM-TERMS"], [Q(1, 2), "MC-LIM-SUM-TERMS"], [Q(0), "MC-LIM-INF-OVER-INF"]],
        explain: `分子は $${k}(1+2+\\cdots+n)=\\dfrac{${k}n(n+1)}{2}$。よって $\\dfrac{${k}n(n+1)}{2n^{2}}=\\dfrac{${k}}{2}\\left(1+\\dfrac1n\\right)\\to\\dfrac{${k}}{2}=${tq(ans)}$。`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        // 根号を含む差の極限
        const N = 1e6;
        if (lv === 1) {
          const a = r.int(1, 10);
          const ans = Q(a, 2);
          nearly(Math.sqrt(N * N + a * N) - N, qnum(ans), "極限の検算", 1e-4);
          return num({
            q: `$${LIMN}\\left(\\sqrt{n^{2}+${co(a)}n}-n\\right)$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a), "MC-LIM-SQRT-HALF"], [Q(0), "MC-LIM-INF-MINUS-INF"], [Q(a, 4), "MC-LIM-SQRT-HALF"]].filter(([v]) => !eq(v, ans)),
            explain: `$\\sqrt{n^{2}+${co(a)}n}+n$ を分子・分母にかける（有理化）と $\\dfrac{(n^{2}+${co(a)}n)-n^{2}}{\\sqrt{n^{2}+${co(a)}n}+n}=\\dfrac{${co(a)}n}{\\sqrt{n^{2}+${co(a)}n}+n}=\\dfrac{${a}}{\\sqrt{1+\\frac{${a}}{n}}+1}\\to${fracEq(a, 2)}$。（$\\infty-\\infty$ の形なので、有理化してから極限をとる）`,
          });
        }
        if (lv === 2) {
          const [a, b, c, d] = until(
            () => [r.int(1, 8), r.int(-3, 5), r.int(1, 8), r.int(-3, 5)],
            ([aa, , cc]) => aa !== cc,
          );
          const ans = Q(a - c, 2);
          nearly(Math.sqrt(N * N + a * N + b) - Math.sqrt(N * N + c * N + d), qnum(ans), "極限の検算", 1e-4);
          return num({
            q: `$${LIMN}\\left(\\sqrt{${pn([b, a, 1])}}-\\sqrt{${pn([d, c, 1])}}\\right)$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a - c), "MC-LIM-SQRT-HALF"], [Q(0), "MC-LIM-INF-MINUS-INF"], [Q(a + c, 2), "MC-SLIP"]].filter(([v]) => !eq(v, ans)),
            explain: `2 つの根号の和 $\\sqrt{${pn([b, a, 1])}}+\\sqrt{${pn([d, c, 1])}}$ を分子・分母にかけて有理化すると、分子は $(${pn([b, a, 1])})-(${pn([d, c, 1])})=${pn([b - d, a - c])}$。分母を $n$ でわると $\\sqrt{\\cdots}+\\sqrt{\\cdots}\\to 1+1=2$、分子を $n$ でわると $${a - c}$ に近づくので、極限は $\\dfrac{${a - c}}{2}=${tq(ans)}$。`,
          });
        }
        const kind = r.pick(["mult", "sqrtn"]);
        if (kind === "mult") {
          const m = r.pick([2, 3]);
          const a = r.int(1, 9);
          const ans = Q(a, 2 * m);
          nearly(Math.sqrt(m * m * N * N + a * N) - m * N, qnum(ans), "極限の検算", 1e-4);
          return num({
            q: `$${LIMN}\\left(\\sqrt{${m * m}n^{2}+${co(a)}n}-${m}n\\right)$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a, 2), "MC-LIM-SQRT-HALF"], [Q(a, m), "MC-LIM-SQRT-HALF"], [Q(0), "MC-LIM-INF-MINUS-INF"]].filter(([v]) => !eq(v, ans)),
            explain: `有理化すると $\\dfrac{(${m * m}n^{2}+${co(a)}n)-${m * m}n^{2}}{\\sqrt{${m * m}n^{2}+${co(a)}n}+${m}n}=\\dfrac{${co(a)}n}{\\sqrt{${m * m}n^{2}+${co(a)}n}+${m}n}$。分子・分母を $n$ でわると $\\dfrac{${a}}{\\sqrt{${m * m}+\\frac{${a}}{n}}+${m}}\\to\\dfrac{${a}}{${m}+${m}}=${tq(ans)}$。（$\\sqrt{${m * m}}=${m}$）`,
          });
        }
        const a = r.int(1, 9);
        const ans = Q(a, 2);
        nearly(Math.sqrt(N) * (Math.sqrt(N + a) - Math.sqrt(N)), qnum(ans), "極限の検算", 1e-4);
        return num({
          q: `$${LIMN}\\sqrt{n}\\left(\\sqrt{n+${a}}-\\sqrt{n}\\right)$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(a), "MC-LIM-SQRT-HALF"], [Q(0), "MC-LIM-INF-MINUS-INF"], [Q(a, 4), "MC-LIM-SQRT-HALF"]],
          explain: `$\\sqrt{n+${a}}-\\sqrt{n}=\\dfrac{${a}}{\\sqrt{n+${a}}+\\sqrt{n}}$ と有理化すると、$\\sqrt{n}\\cdot\\dfrac{${a}}{\\sqrt{n+${a}}+\\sqrt{n}}=\\dfrac{${a}}{\\sqrt{1+\\frac{${a}}{n}}+1}\\to\\dfrac{${a}}{2}$。（$\\infty\\times 0$ の形も、有理化で分数にすると見通せる）`,
        });
      },
      { id: "b", db: 0.3 },
    ),

    t(
      "num",
      (r, lv) => {
        // 指数の形の数列の極限：底が大きいほうの項が支配する
        const pairs = [[2, 1], [3, 1], [3, 2], [4, 1], [4, 3], [5, 1], [5, 2], [5, 3]]; // [大, 小]（小/大 ≦ 0.75）
        const [big, small] = r.pick(pairs);
        const A = r.pick([1, 2, 3, -1, -2]);
        const B = r.pick([1, 2, -1, 3]);
        const C = r.int(1, 3);
        const D = r.int(1, 3);
        const shift = () => (lv === 1 ? 0 : r.int(-1, 2));
        const [u, v, w, z] = [shift(), shift(), shift(), shift()];
        const bigFirst = r.chance(0.5);
        // 項 c·b^{n+s} の TeX（係数が 1 のときは省き、それ以外は c\\cdot で区切る。b=1 は定数）
        const term = (c, b, sh, first) => {
          const sign = c < 0 ? "-" : first ? "" : "+";
          const ac = Math.abs(c);
          if (b === 1) return `${sign}${ac}`;
          const power = `${b}^{n${sh === 0 ? "" : sh > 0 ? `+${sh}` : sh}}`;
          return `${sign}${ac === 1 ? "" : `${ac}\\cdot `}${power}`;
        };
        const mk = (c1, b1, s1, c2, b2, s2, order) => (order ? `${term(c1, b1, s1, true)}${term(c2, b2, s2, false)}` : `${term(c2, b2, s2, true)}${term(c1, b1, s1, false)}`);
        const numTex = mk(A, big, u, B, small, v, bigFirst);
        const denTex = mk(C, big, w, D, small, z, !bigFirst);
        // 支配する項（底が大きいほう）の係数の比：A·big^u / (C·big^w) = (A/C)·big^(u−w)
        const e = u - w;
        const ans = mul(div(Q(A), Q(C)), e >= 0 ? qpow(Q(big), e) : div(Q(1), qpow(Q(big), -e)));
        // n = 80 の値で確かめる
        const seq = (n) => (A * Math.pow(big, n + u) + B * Math.pow(small, n + v)) / (C * Math.pow(big, n + w) + D * Math.pow(small, n + z));
        nearly(seq(80), qnum(ans), "極限の検算", 1e-5);
        return num({
          q: `$${LIMN}\\dfrac{${numTex}}{${denTex}}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[div(Q(A), Q(C)), "MC-LIM-GEOM-SHIFT"], [div(Q(B), Q(D)), "MC-LIM-GEOM-BASE"], [Q(1), "MC-LIM-GEOM-BASE"], [Q(0), "MC-LIM-INF-OVER-INF"]],
          explain: `底が大きい $${big}^{n}$ で分子・分母をわると、$\\left(\\dfrac{${small}}{${big}}\\right)^{n}$ の項は $n\\to\\infty$ で $0$ に近づきます。$${big}^{n+s}=${big}^{s}\\cdot ${big}^{n}$ に直して係数を比べると、極限は $${tq(ans)}$。（$r^{n}$ は $|r|<1$ で $0$ に近づく。指数の $+1$ などは係数に直す）`,
        });
      },
      { id: "c", db: 0.4 },
    ),

    t(
      "choice",
      (r, lv) => {
        // 収束・発散の判定
        const cases =
          lv === 1
            ? [
                { tex: "\\left(\\dfrac12\\right)^{n}", fn: (n) => Math.pow(0.5, n), ok: "zero", bad: [["one", "MC-LIM-GEOM-BASE"], ["inf", "MC-LIM-GEOM-BASE"], ["osc", "MC-LIM-GEOM-ABS"]] },
                { tex: "2^{n}", fn: (n) => Math.pow(2, n), ok: "inf", bad: [["zero", "MC-LIM-GEOM-BASE"], ["one", "MC-LIM-GEOM-BASE"], ["osc", "MC-LIM-GEOM-ABS"]] },
                { tex: "\\left(-\\dfrac12\\right)^{n}", fn: (n) => Math.pow(-0.5, n), ok: "zero", bad: [["osc", "MC-LIM-GEOM-ABS"], ["ninf", "MC-LIM-GEOM-SIGN"], ["minusOne", "MC-LIM-GEOM-SIGN"]] },
                { tex: "(-2)^{n}", fn: (n) => Math.pow(-2, n), ok: "osc", bad: [["ninf", "MC-LIM-GEOM-SIGN"], ["zero", "MC-LIM-GEOM-BASE"], ["inf", "MC-LIM-GEOM-ABS"]] },
                { tex: "\\left(\\dfrac32\\right)^{n}", fn: (n) => Math.pow(1.5, n), ok: "inf", bad: [["zero", "MC-LIM-GEOM-BASE"], ["one", "MC-LIM-GEOM-BASE"], ["osc", "MC-LIM-GEOM-ABS"]] },
                { tex: "\\left(-\\dfrac32\\right)^{n}", fn: (n) => Math.pow(-1.5, n), ok: "osc", bad: [["ninf", "MC-LIM-GEOM-SIGN"], ["zero", "MC-LIM-GEOM-BASE"], ["inf", "MC-LIM-GEOM-ABS"]] },
              ]
            : lv === 2
              ? [
                  { tex: "\\dfrac{n^{2}}{n+1}", fn: (n) => (n * n) / (n + 1), ok: "inf", bad: [["one", "MC-LIM-DEGREE"], ["zero", "MC-LIM-DEGREE"], ["ninf", "MC-LIM-GEOM-SIGN"]] },
                  { tex: "\\dfrac{n+1}{n^{2}}", fn: (n) => (n + 1) / (n * n), ok: "zero", bad: [["one", "MC-LIM-DEGREE"], ["inf", "MC-LIM-DEGREE"], ["osc", "MC-LIM-GEOM-ABS"]] },
                  { tex: "\\dfrac{-n^{3}}{n^{2}+1}", fn: (n) => (-n * n * n) / (n * n + 1), ok: "ninf", bad: [["inf", "MC-LIM-GEOM-SIGN"], ["zero", "MC-LIM-DEGREE"], ["minusOne", "MC-LIM-DEGREE"]] },
                  { tex: "\\dfrac{n^{2}+n}{n^{2}+3}", fn: (n) => (n * n + n) / (n * n + 3), ok: "one", bad: [["zero", "MC-LIM-DEGREE"], ["inf", "MC-LIM-DEGREE"], ["minusOne", "MC-SLIP"]] },
                  { tex: "\\dfrac{(-1)^{n}\\,n}{n+1}", fn: (n) => (Math.pow(-1, n) * n) / (n + 1), ok: "osc", bad: [["one", "MC-LIM-ALTERNATING"], ["zero", "MC-LIM-ALTERNATING"], ["inf", "MC-LIM-ALTERNATING"]] },
                ]
              : [
                  { tex: "\\dfrac{n^{3}}{2^{n}}", fn: (n) => Math.pow(n, 3) / Math.pow(2, n), ok: "zero", bad: [["inf", "MC-LIM-POLY-VS-EXP"], ["one", "MC-LIM-POLY-VS-EXP"], ["osc", "MC-LIM-GEOM-ABS"]] },
                  { tex: "\\dfrac{3^{n}}{n^{5}}", fn: (n) => Math.pow(3, n) / Math.pow(n, 5), ok: "inf", bad: [["zero", "MC-LIM-POLY-VS-EXP"], ["one", "MC-LIM-POLY-VS-EXP"], ["osc", "MC-LIM-GEOM-ABS"]] },
                  { tex: "\\dfrac{(-2)^{n}}{3^{n}}", fn: (n) => Math.pow(-2, n) / Math.pow(3, n), ok: "zero", bad: [["osc", "MC-LIM-GEOM-ABS"], ["ninf", "MC-LIM-GEOM-SIGN"], ["minusOne", "MC-LIM-GEOM-SIGN"]] },
                  { tex: "\\dfrac{(-3)^{n}}{2^{n}}", fn: (n) => Math.pow(-3, n) / Math.pow(2, n), ok: "osc", bad: [["ninf", "MC-LIM-GEOM-SIGN"], ["zero", "MC-LIM-GEOM-BASE"], ["inf", "MC-LIM-GEOM-ABS"]] },
                  { tex: "\\dfrac{2^{n}+3^{n}}{3^{n}}", fn: (n) => (Math.pow(2, n) + Math.pow(3, n)) / Math.pow(3, n), ok: "one", bad: [["zero", "MC-LIM-GEOM-BASE"], ["inf", "MC-LIM-GEOM-BASE"], ["osc", "MC-LIM-GEOM-ABS"]] },
                ];
        const c = r.pick(cases);
        // 数値による判定と、こちらの答えが合っているか
        const seen = classify(c.fn, lv === 1 ? 60 : lv === 2 ? 1e7 : 90);
        const label = { zero: "0", one: "1", inf: "inf", ninf: "-inf", osc: "osc", minusOne: "-1" }[c.ok];
        assert(seen === label, `収束・発散の判定が数値と合わない: ${c.tex} ${seen} vs ${label}`);
        return choice({
          q: `数列 $\\left\\{${c.tex}\\right\\}$ について、$n\\to\\infty$ のときの記述として正しいものはどれですか。`,
          correct: OPT[c.ok],
          wrongs: c.bad.map(([k, mc]) => [OPT[k], mc]),
          explain: `${lv === 1 ? "等比数列 $r^{n}$ は、$|r|<1$ なら $0$ に収束、$r>1$ なら正の無限大に発散、$r\\le -1$ なら（$r=-1$ を含めて）振動して極限はありません。" : lv === 2 ? "分子と分母の次数を比べます。分子が高次なら発散、分母が高次なら $0$、同じ次数なら係数の比に収束します。符号が交互に変わる項があると、値は 2 つの方向に分かれて極限がありません。" : "指数関数 $a^{n}$（$a>1$）は、どんな多項式 $n^{k}$ よりも速く大きくなります。底の絶対値が大きい項で分子・分母をわって考えます。"}この数列は、${OPT[c.ok]}。`,
        });
      },
      { id: "d", db: 0.1, finite: true },
    ),

    t(
      "num",
      (r, lv) => {
        // 無限級数の和
        if (lv === 1) {
          const ratios = [Q(1, 2), Q(1, 3), Q(2, 3), Q(1, 4), Q(3, 4), Q(-1, 2), Q(-1, 3), Q(-2, 3)];
          const rr = r.pick(ratios);
          const a = r.nz(-6, 6);
          const first = [0, 1, 2].map((k) => mul(Q(a), qpow(rr, k)));
          const ans = div(Q(a), sub(Q(1), rr));
          let s = 0; // 最初の 120 項の和（浮動小数）が、公式の値に十分近いこと
          for (let k = 0; k < 120; k++) s += a * Math.pow(qnum(rr), k);
          nearly(s, qnum(ans), "無限等比級数の検算", 1e-6);
          return num({
            q: `無限級数 $${first.map((x) => tq(x)).join("+")}+\\cdots$ は、初項 $${a}$、公比 $${tq(rr)}$ の無限等比級数です。この和を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[div(Q(a), add(Q(1), rr)), "MC-LIM-SERIES-RATIO-SIGN"], [sub(ans, Q(a)), "MC-LIM-SERIES-START"], [Q(a), "MC-LIM-SERIES-FIRST"], [mul(ans, Q(-1)), "MC-SLIP"]],
            explain: `公比 $${tq(rr)}$ は $-1<${tq(rr)}<1$ なので収束し、和は $\\dfrac{\\text{初項}}{1-\\text{公比}}=\\dfrac{${a}}{1-(${tq(rr)})}=${tq(ans)}$。（収束の条件は $|\\text{公比}|<1$）`,
          });
        }
        if (lv === 2) {
          // 循環小数を分数に
          const kind = r.pick(["one", "two", "three"]);
          const len = kind === "one" ? 1 : kind === "two" ? 2 : 3;
          const digits = until(
            () => Array.from({ length: len }, () => r.int(0, 9)),
            (ds) => !(ds.every((x) => x === ds[0]) && len > 1) && ds.some((x) => x > 0) && !ds.every((x) => x === 9),
          );
          const nn = digits.reduce((acc, x) => acc * 10 + x, 0);
          const ans = Q(nn, Math.pow(10, len) - 1);
          // 別の経路：分数を小数に直す（筆算）と、同じ数字がくり返される
          let rem = ans.n;
          const gen = [];
          for (let i = 0; i < 3 * len; i++) {
            rem *= 10;
            gen.push(Math.floor(rem / ans.d));
            rem %= ans.d;
          }
          assert(gen.join("") === digits.join("").repeat(3), "循環小数の検算");
          const dots = len === 1 ? `\\dot{${digits[0]}}` : `\\dot{${digits[0]}}${digits.slice(1, -1).join("")}\\dot{${digits[len - 1]}}`;
          return num({
            q: `循環小数 $0.${dots}$ を分数（既約分数）で表しなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(nn, Math.pow(10, len)), "MC-LIM-REPEAT-DENOM"], [Q(nn, Math.pow(10, len) + 1), "MC-LIM-REPEAT-DENOM"], [Q(nn, 9 * len), "MC-LIM-REPEAT-DENOM"]],
            explain: `$0.${dots}=\\dfrac{${nn}}{${Math.pow(10, len)}}+\\dfrac{${nn}}{${Math.pow(10, 2 * len)}}+\\cdots$ は、初項 $\\dfrac{${nn}}{${Math.pow(10, len)}}$、公比 $\\dfrac{1}{${Math.pow(10, len)}}$ の無限等比級数です。和は $\\dfrac{${nn}/${Math.pow(10, len)}}{1-1/${Math.pow(10, len)}}=\\dfrac{${nn}}{${Math.pow(10, len) - 1}}$${gcd(nn, Math.pow(10, len) - 1) > 1 ? `、約分して $${tq(ans)}$` : ""}。（周期が $${len}$ 桁なら、分母は $${"9".repeat(len)}$）`,
          });
        }
        const kind = r.pick(["tele1", "tele2", "odd", "two", "mixed"]);
        if (kind === "tele1" || kind === "tele2") {
          const kk = kind === "tele1" ? 1 : r.pick([2, 3]);
          let H = Q(0);
          for (let j = 1; j <= kk; j++) H = add(H, Q(1, j));
          const ans = div(H, Q(kk));
          // 部分和 S_N を厳密に計算して、閉じた式 (1/k)(H_k − Σ 1/(N+j)) と比べる
          const N = 30;
          let S = Q(0);
          for (let n = 1; n <= N; n++) S = add(S, Q(1, n * (n + kk)));
          let tail = Q(0);
          for (let j = 1; j <= kk; j++) tail = add(tail, Q(1, N + j));
          assert(eq(S, div(sub(H, tail), Q(kk))), "部分和の検算");
          const heads = Array.from({ length: kk }, (_, j) => `\\dfrac1{${j + 1}}`).join("+");
          const tails = Array.from({ length: kk }, (_, j) => `\\dfrac1{N+${j + 1}}`).join("-");
          return num({
            q: `無限級数 $\\displaystyle\\sum_{n=1}^{\\infty}\\dfrac{1}{n(n+${kk})}$ の和を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(1, 1 + kk), "MC-LIM-TELE-FIRST"], [Q(1, kk), "MC-LIM-TELE-DROP"], [H, "MC-LIM-TELE-COEF"], [Q(0), "MC-LIM-INF-OVER-INF"]].filter(([v]) => !eq(v, ans)),
            explain:
              kk === 1
                ? `$\\dfrac{1}{n(n+1)}=\\dfrac1n-\\dfrac1{n+1}$ と分けると、部分和は $S_{N}=\\left(1-\\dfrac12\\right)+\\left(\\dfrac12-\\dfrac13\\right)+\\cdots+\\left(\\dfrac1N-\\dfrac1{N+1}\\right)=1-\\dfrac1{N+1}$ と、途中の項が消えます。$N\\to\\infty$ で $\\dfrac1{N+1}\\to 0$ なので、和は $1$。（部分分数に分けて、途中を消す）`
                : `$\\dfrac{1}{n(n+${kk})}=\\dfrac1{${kk}}\\left(\\dfrac1n-\\dfrac1{n+${kk}}\\right)$ と分けると、途中の項が消えて部分和は $S_{N}=\\dfrac1{${kk}}\\left(${heads}-${tails}\\right)$ となります。$N\\to\\infty$ で $\\dfrac1{N+j}\\to 0$ なので、和は $\\dfrac1{${kk}}\\left(${heads}\\right)=${tq(ans)}$。（前の $\\dfrac1{${kk}}$ を忘れない）`,
          });
        }
        if (kind === "odd") {
          const N = 40;
          let S = Q(0);
          for (let n = 1; n <= N; n++) S = add(S, Q(1, (2 * n - 1) * (2 * n + 1)));
          assert(eq(S, Q(N, 2 * N + 1)), "部分和の検算");
          return num({
            q: `無限級数 $\\displaystyle\\sum_{n=1}^{\\infty}\\dfrac{1}{(2n-1)(2n+1)}$ の和を求めなさい。`,
            ans: Q(1, 2),
            reduced: true,
            wrongs: [[Q(1), "MC-LIM-TELE-COEF"], [Q(1, 3), "MC-LIM-TELE-DROP"], [Q(2), "MC-LIM-TELE-COEF"]],
            explain: `$\\dfrac{1}{(2n-1)(2n+1)}=\\dfrac12\\left(\\dfrac1{2n-1}-\\dfrac1{2n+1}\\right)$ と分けると、部分和は $S_{N}=\\dfrac12\\left(1-\\dfrac1{2N+1}\\right)=\\dfrac{N}{2N+1}$。$N\\to\\infty$ で $\\dfrac12$。（前に $\\dfrac12$ がつく）`,
          });
        }
        if (kind === "two") {
          const [p, q0] = r.pick([[2, 3], [2, 4], [3, 4], [3, 5], [2, 5]]);
          const ans = add(div(Q(1), sub(Q(p), Q(1))), div(Q(1), sub(Q(q0), Q(1))));
          let s = 0;
          for (let n = 1; n <= 200; n++) s += Math.pow(1 / p, n) + Math.pow(1 / q0, n);
          nearly(s, qnum(ans), "無限級数の検算", 1e-6);
          return num({
            q: `無限級数 $\\displaystyle\\sum_{n=1}^{\\infty}\\left(\\dfrac{1}{${p}^{n}}+\\dfrac{1}{${q0}^{n}}\\right)$ の和を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[add(div(Q(p), Q(p - 1)), div(Q(q0), Q(q0 - 1))), "MC-LIM-SERIES-START"], [Q(1, p - 1), "MC-LIM-SERIES-DROP"], [add(Q(1, p), Q(1, q0)), "MC-LIM-SERIES-FIRST"]].filter(([v]) => !eq(v, ans)),
            explain: `2 つの無限等比級数に分けます。$\\displaystyle\\sum\\dfrac1{${p}^{n}}$ は初項 $\\dfrac1{${p}}$、公比 $\\dfrac1{${p}}$ で和は $\\dfrac{1/${p}}{1-1/${p}}=\\dfrac1{${p - 1}}$。同様に $\\displaystyle\\sum\\dfrac1{${q0}^{n}}$ は $\\dfrac1{${q0 - 1}}$。合計 $${tq(ans)}$。（どちらも $n=1$ から始まるので、初項は $\\dfrac1{${p}}$、$\\dfrac1{${q0}}$）`,
          });
        }
        // mixed: 0.a\dot{b}
        const a = r.int(1, 9);
        const b = r.int(1, 8);
        const ans = add(Q(a, 10), Q(b, 90));
        let rem = ans.n;
        const gen = [];
        for (let i = 0; i < 6; i++) {
          rem *= 10;
          gen.push(Math.floor(rem / ans.d));
          rem %= ans.d;
        }
        assert(gen.join("") === `${a}${String(b).repeat(5)}`, "循環小数の検算");
        return num({
          q: `循環小数 $0.${a}\\dot{${b}}$ を分数（既約分数）で表しなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(10 * a + b, 99), "MC-LIM-REPEAT-DENOM"], [Q(10 * a + b, 90), "MC-LIM-REPEAT-DENOM"], [add(Q(a, 10), Q(b, 9)), "MC-LIM-REPEAT-DENOM"]].filter(([v]) => !eq(v, ans)),
          explain: `$0.${a}\\dot{${b}}=\\dfrac{${a}}{10}+0.0${b}+0.00${b}+\\cdots$ と分けます。$0.0\\dot{${b}}$ は初項 $\\dfrac{${b}}{100}$、公比 $\\dfrac1{10}$ の無限等比級数で、和は $\\dfrac{${b}/100}{1-1/10}=\\dfrac{${b}}{90}$。合計 $\\dfrac{${a}}{10}+\\dfrac{${b}}{90}=${tq(ans)}$。（くり返しが始まる位置に注意）`,
        });
      },
      { id: "e", db: 0.3 },
    ),
  ],

  // ── 関数の極限 ────────────────────────────────
  limit_func: [
    t("num", (r, lv) => {
      // 0/0 の形：因数分解して約分
      const p = r.int(-3, 3);
      let lim;
      let N;
      let D;
      let g;
      let h;
      if (lv === 1) {
        // (x²−p²)/(x−p) → 2p、または (x²+bx+c)/(x−p)
        const q1 = until(() => r.int(-4, 4), (v) => v !== p);
        N = P.lin(1, -p).mul(P.lin(1, -q1));
        D = P.lin(1, -p);
        g = P.lin(1, -q1);
        h = P.c(1);
        lim = Q(p - q1);
      } else if (lv === 2) {
        const q1 = until(() => r.int(-4, 4), (v) => v !== p);
        const c = r.pick([1, 2, 3]);
        N = P.lin(1, -p).mul(P.lin(c, -q1));
        D = P.lin(1, -p);
        g = P.lin(c, -q1);
        h = P.c(1);
        lim = Q(c * p - q1);
      } else {
        const q1 = until(() => r.int(-4, 4), (v) => v !== p);
        const q2 = until(() => r.int(-4, 4), (v) => v !== p);
        const cc = r.pick([1, 2]);
        g = P.lin(cc, -q1);
        h = P.lin(1, -q2);
        N = P.lin(1, -p).mul(g);
        D = P.lin(1, -p).mul(h);
        lim = Q(cc * p - q1, p - q2);
      }
      // p の近く（左右 1e-5）での値が、求めた極限値に近いことを数値で確かめる
      const f = (x) => polyValue(N, x) / polyValue(D, x);
      for (const hh of [1e-5, -1e-5]) nearly(f(p + hh), qnum(lim), "極限の検算", 1e-3);
      const gp = at(g, Q(p));
      const hp = at(h, Q(p));
      return num({
        q: `$\\displaystyle\\lim_{x\\to ${p}}\\dfrac{${px(N)}}{${px(D)}}$ の値を求めなさい。`,
        ans: lim,
        reduced: true,
        wrongs: [[Q(0), "MC-LIM-ZERO-OVER-ZERO"], [gp, "MC-LIM-NUM-ONLY"], [hp.n === 0 || gp.n === 0 ? Q(1) : div(hp, gp), "MC-LIM-INVERT"]].filter(([v]) => !eq(v, lim)),
        explain: `$x=${p}$ を代入すると分子も分母も $0$ になる（$\\dfrac00$ の形）ので、そのままでは求められません。因数分解すると 分子 $=(${px(P.lin(1, -p))})(${px(g)})$、分母 $=(${px(P.lin(1, -p))})${h.degree() === 0 ? "" : `(${px(h)})`}$。$x\\ne ${p}$ のとき共通因数 $(${px(P.lin(1, -p))})$ を約分できて $${h.degree() === 0 ? px(g) : `\\dfrac{${px(g)}}{${px(h)}}`}$。ここで $x\\to ${p}$ とすると $${h.degree() === 0 ? `${px(g)}\\to ${tq(gp)}` : `\\dfrac{${tq(gp)}}{${tq(hp)}}=${tq(lim)}`}$。（$\\dfrac00$ の形は、まず約分してから代入する）`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        // 根号を含む 0/0：有理化して約分
        const h = 1e-5;
        if (lv < 3) {
          const q1 = r.int(2, 4);
          const rr = r.int(-3, 5);
          const pp = q1 * q1 - rr;
          const inv = lv === 2 && r.chance(0.5);
          const lim = inv ? Q(2 * q1) : Q(1, 2 * q1);
          const f = inv ? (x) => (x - rr) / (Math.sqrt(x + pp) - q1) : (x) => (Math.sqrt(x + pp) - q1) / (x - rr);
          for (const hh of [h, -h]) nearly(f(rr + hh), qnum(lim), "極限の検算", 1e-3);
          const rad = `\\sqrt{${px(P.lin(1, pp))}}`;
          return num({
            q: inv ? `$\\displaystyle\\lim_{x\\to ${rr}}\\dfrac{${px(P.lin(1, -rr))}}{${rad}-${q1}}$ の値を求めなさい。` : `$\\displaystyle\\lim_{x\\to ${rr}}\\dfrac{${rad}-${q1}}{${px(P.lin(1, -rr))}}$ の値を求めなさい。`,
            ans: lim,
            reduced: true,
            wrongs: inv ? [[Q(q1), "MC-LIM-RATIONALIZE-HALF"], [Q(1, 2 * q1), "MC-LIM-INVERT"], [Q(0), "MC-LIM-ZERO-OVER-ZERO"]] : [[Q(1, q1), "MC-LIM-RATIONALIZE-HALF"], [Q(2 * q1), "MC-LIM-INVERT"], [Q(0), "MC-LIM-ZERO-OVER-ZERO"]],
            explain: inv
              ? `$x=${rr}$ を代入すると $\\dfrac00$ の形です。分母の有理化のため、分母・分子に $${rad}+${q1}$ をかけると、分母は $(x+${pp})-${q1 * q1}=${px(P.lin(1, -rr))}$ となり、$\\dfrac{(${px(P.lin(1, -rr))})(${rad}+${q1})}{${px(P.lin(1, -rr))}}=${rad}+${q1}$。$x\\to ${rr}$ で $\\sqrt{${q1 * q1}}+${q1}=${2 * q1}$。`
              : `$x=${rr}$ を代入すると $\\dfrac00$ の形です。分子の有理化のため、分母・分子に $${rad}+${q1}$ をかけると、分子は $(x+${pp})-${q1 * q1}=${px(P.lin(1, -rr))}$ となり、$\\dfrac{${px(P.lin(1, -rr))}}{(${px(P.lin(1, -rr))})(${rad}+${q1})}=\\dfrac{1}{${rad}+${q1}}$。$x\\to ${rr}$ で $\\dfrac{1}{${q1}+${q1}}=\\dfrac{1}{${2 * q1}}$。（$\\sqrt{${q1 * q1}}=${q1}$）`,
          });
        }
        // √(x+a) − √(cx+b)：x=rr で値が同じ
        const q1 = r.int(2, 4);
        const rr = r.int(1, 4);
        const c = r.pick([2, 3, 4]);
        const a = q1 * q1 - rr;
        const b = q1 * q1 - c * rr;
        const lim = Q(1 - c, 2 * q1);
        const rad1 = `\\sqrt{${px(P.lin(1, a))}}`;
        const rad2 = `\\sqrt{${px(P.lin(c, b))}}`;
        const f = (x) => (Math.sqrt(x + a) - Math.sqrt(c * x + b)) / (x - rr);
        for (const hh of [h, -h]) nearly(f(rr + hh), qnum(lim), "極限の検算", 1e-3);
        return num({
          q: `$\\displaystyle\\lim_{x\\to ${rr}}\\dfrac{\\sqrt{${px(P.lin(1, a))}}-\\sqrt{${px(P.lin(c, b))}}}{x-${rr}}$ の値を求めなさい。`,
          ans: lim,
          reduced: true,
          wrongs: [[Q(1, 2 * q1), "MC-LIM-RATIONALIZE-HALF"], [Q(c - 1, 2 * q1), "MC-LIM-SIGN"], [Q(0), "MC-LIM-ZERO-OVER-ZERO"]].filter(([v]) => !eq(v, lim)),
          explain: `$x=${rr}$ で $\\sqrt{${rr + a}}=${q1}$、$\\sqrt{${c * rr + b}}=${q1}$ なので $\\dfrac00$ の形です。分子を有理化（$${rad1}+${rad2}$ をかける）すると、分子は $(${px(P.lin(1, a))})-(${px(P.lin(c, b))})=${px(P.lin(1 - c, a - b))}=${1 - c}(x-${rr})$ になり、$\\dfrac{${1 - c}(x-${rr})}{(x-${rr})(${rad1}+${rad2})}=\\dfrac{${1 - c}}{${rad1}+${rad2}}$。$x\\to ${rr}$ で $\\dfrac{${1 - c}}{${q1}+${q1}}=${tq(lim)}$。`,
        });
      },
      { id: "b", db: 0.3 },
    ),

    t(
      "num",
      (r, lv) => {
        // x → ∞、x → −∞ の極限
        const X = 1e6;
        if (lv === 1) {
          const a = r.nz(-5, 5);
          const b = r.int(-5, 5);
          const c = r.int(-4, 4);
          const d = r.int(1, 4);
          const e = r.int(-4, 4);
          const f0 = r.int(-5, 5);
          const ans = Q(a, d);
          nearly((a * X * X + b * X + c) / (d * X * X + e * X + f0), qnum(ans), "極限の検算", 1e-4);
          return num({
            q: `$\\displaystyle\\lim_{x\\to\\infty}\\dfrac{${px(poly([[a, 2], [b, 1], [c, 0]]))}}{${px(poly([[d, 2], [e, 1], [f0, 0]]))}}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a), "MC-LIM-COEF-NUM"], [Q(c, f0 === 0 ? 1 : f0), "MC-LIM-CONST-RATIO"], [Q(0), "MC-LIM-INF-OVER-INF"]].filter(([v]) => !eq(v, ans)),
            explain: `分母の最高次 $x^{2}$ で分子・分母をわると、$\\dfrac{${a}+\\frac{${b}}{x}+\\frac{${c}}{x^{2}}}{${d}+\\frac{${e}}{x}+\\frac{${f0}}{x^{2}}}$。$x\\to\\infty$ で $\\dfrac1x\\to 0$ なので極限は $\\dfrac{${a}}{${d}}=${tq(ans)}$。`,
          });
        }
        if (lv === 2) {
          const a = r.int(1, 9);
          const b = r.int(-3, 5);
          const c = r.int(1, 9);
          const d = r.int(-3, 5);
          const kind = a === c ? "single" : r.pick(["single", "double"]);
          if (kind === "single") {
            const ans = Q(a, 2);
            nearly(Math.sqrt(X * X + a * X) - X, qnum(ans), "極限の検算", 1e-4);
            return num({
              q: `$\\displaystyle\\lim_{x\\to\\infty}\\left(\\sqrt{x^{2}+${co(a)}x}-x\\right)$ の値を求めなさい。`,
              ans,
              reduced: true,
              wrongs: [[Q(a), "MC-LIM-SQRT-HALF"], [Q(0), "MC-LIM-INF-MINUS-INF"], [Q(a, 4), "MC-LIM-SQRT-HALF"]].filter(([v]) => !eq(v, ans)),
              explain: `有理化して $\\dfrac{${co(a)}x}{\\sqrt{x^{2}+${co(a)}x}+x}=\\dfrac{${a}}{\\sqrt{1+\\frac{${a}}{x}}+1}\\to\\dfrac{${a}}{2}$。（$\\infty-\\infty$ の形は有理化）`,
            });
          }
          const ans = Q(a - c, 2);
          nearly(Math.sqrt(X * X + a * X + b) - Math.sqrt(X * X + c * X + d), qnum(ans), "極限の検算", 1e-4);
          return num({
            q: `$\\displaystyle\\lim_{x\\to\\infty}\\left(\\sqrt{${px(poly([[1, 2], [a, 1], [b, 0]]))}}-\\sqrt{${px(poly([[1, 2], [c, 1], [d, 0]]))}}\\right)$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a - c), "MC-LIM-SQRT-HALF"], [Q(0), "MC-LIM-INF-MINUS-INF"], [Q(a + c, 2), "MC-SLIP"]].filter(([v]) => !eq(v, ans)),
            explain: `和 $\\sqrt{\\cdots}+\\sqrt{\\cdots}$ をかけて有理化すると分子は $(${px(poly([[1, 2], [a, 1], [b, 0]]))})-(${px(poly([[1, 2], [c, 1], [d, 0]]))})=${px(poly([[a - c, 1], [b - d, 0]]))}$。$x$ でわって $x\\to\\infty$ とすると、分子は $${a - c}$、分母は $1+1=2$ に近づくので $${tq(ans)}$。`,
          });
        }
        // x → −∞ の符号に注意
        const kind = r.pick(["diff", "frac"]);
        if (kind === "diff") {
          const a = r.int(1, 9);
          const ans = Q(-a, 2);
          const xx = -X; // x → −∞ のときの値
          nearly(Math.sqrt(xx * xx + a * xx) + xx, qnum(ans), "極限の検算", 1e-4);
          return num({
            q: `$\\displaystyle\\lim_{x\\to-\\infty}\\left(\\sqrt{x^{2}+${co(a)}x}+x\\right)$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a, 2), "MC-LIM-NEG-INF-SIGN"], [Q(0), "MC-LIM-INF-MINUS-INF"], [Q(-a), "MC-LIM-SQRT-HALF"]],
            explain: `$x=-t$（$t\\to\\infty$）とおくと $\\sqrt{t^{2}-${co(a)}t}-t=\\dfrac{-${co(a)}t}{\\sqrt{t^{2}-${co(a)}t}+t}=\\dfrac{-${a}}{\\sqrt{1-\\frac{${a}}{t}}+1}\\to-\\dfrac{${a}}{2}$。（$x<0$ のとき $\\sqrt{x^{2}}=-x$ なので、$x\\to\\infty$ のときと符号が変わる）`,
          });
        }
        const a = r.pick([2, 3, 4, 5, -2, -3]);
        const c = r.int(1, 4);
        const ans = Q(-a);
        const f = (x) => (a * x + 1) / Math.sqrt(x * x + c);
        nearly(f(-X), -a, "極限の検算", 1e-4);
        return num({
          q: `$\\displaystyle\\lim_{x\\to-\\infty}\\dfrac{${px(P.lin(a, 1))}}{\\sqrt{x^{2}+${c}}}$ の値を求めなさい。`,
          ans,
          wrongs: [[Q(a), "MC-LIM-NEG-INF-SIGN"], [Q(0), "MC-LIM-INF-OVER-INF"], [Q(1), "MC-SLIP"]].filter(([v]) => !eq(v, ans)),
          explain: `$x<0$ のとき $\\sqrt{x^{2}+${c}}=|x|\\sqrt{1+\\frac{${c}}{x^{2}}}=-x\\sqrt{1+\\frac{${c}}{x^{2}}}$ です。分子・分母を $x$ でわると（$x<0$ なので分母は $-\\sqrt{\\cdots}$ になり）$\\dfrac{${a}+\\frac1x}{-\\sqrt{1+\\frac{${c}}{x^{2}}}}\\to\\dfrac{${a}}{-1}=${-a}$。（$x\\to-\\infty$ のときは、$\\sqrt{x^{2}}=-x$ に注意）`,
        });
      },
      { id: "c", db: 0.25 },
    ),

    t(
      "choice",
      (r, lv) => {
        // 片側極限・無限大
        const a = r.int(-3, 3);
        const aTxt = a === 0 ? "" : a > 0 ? `x-${a}` : `x+${-a}`;
        const xa = a === 0 ? "x" : aTxt;
        const to = (side) => `x\\to ${a}${side === "+" ? "+0" : side === "-" ? "-0" : ""}`;
        const inf = "+\\infty";
        const ninf = "-\\infty";
        const label = { inf: `$${inf}$`, ninf: `$${ninf}$`, zero: "$0$", one: "$1$", m1: "$-1$", none: "極限は存在しない" };
        const cases =
          lv === 1
            ? [
                { tex: `\\displaystyle\\lim_{${to("+")}}\\dfrac{1}{${xa}}`, val: "inf", ev: (h) => 1 / h, side: 1, bad: [["ninf", "MC-LIM-ONESIDED-SIGN"], ["zero", "MC-LIM-INF-OVER-INF"], ["none", "MC-LIM-ONESIDED-BOTH"]] },
                { tex: `\\displaystyle\\lim_{${to("-")}}\\dfrac{1}{${xa}}`, val: "ninf", ev: (h) => 1 / h, side: -1, bad: [["inf", "MC-LIM-ONESIDED-SIGN"], ["zero", "MC-LIM-INF-OVER-INF"], ["none", "MC-LIM-ONESIDED-BOTH"]] },
                { tex: `\\displaystyle\\lim_{${to("+")}}\\dfrac{-1}{${xa}}`, val: "ninf", ev: (h) => -1 / h, side: 1, bad: [["inf", "MC-LIM-ONESIDED-SIGN"], ["zero", "MC-LIM-INF-OVER-INF"], ["none", "MC-LIM-ONESIDED-BOTH"]] },
              ]
            : lv === 2
              ? [
                  { tex: `\\displaystyle\\lim_{${to("")}}\\dfrac{1}{(${xa})^{2}}`, val: "inf", ev: (h) => 1 / (h * h), side: 0, bad: [["none", "MC-LIM-ONESIDED-BOTH"], ["zero", "MC-LIM-INF-OVER-INF"], ["ninf", "MC-LIM-ONESIDED-SIGN"]] },
                  { tex: `\\displaystyle\\lim_{${to("")}}\\dfrac{1}{${xa}}`, val: "none", ev: (h) => 1 / h, side: 0, bad: [["inf", "MC-LIM-ONESIDED-BOTH"], ["ninf", "MC-LIM-ONESIDED-BOTH"], ["zero", "MC-LIM-INF-OVER-INF"]] },
                  { tex: `\\displaystyle\\lim_{${to("")}}\\dfrac{-1}{(${xa})^{2}}`, val: "ninf", ev: (h) => -1 / (h * h), side: 0, bad: [["inf", "MC-LIM-ONESIDED-SIGN"], ["none", "MC-LIM-ONESIDED-BOTH"], ["zero", "MC-LIM-INF-OVER-INF"]] },
                ]
              : [
                  { tex: `\\displaystyle\\lim_{${to("+")}}\\dfrac{|${xa}|}{${xa}}`, val: "one", ev: (h) => Math.abs(h) / h, side: 1, bad: [["m1", "MC-LIM-ONESIDED-SIGN"], ["none", "MC-LIM-ONESIDED-BOTH"], ["zero", "MC-LIM-ZERO-OVER-ZERO"]] },
                  { tex: `\\displaystyle\\lim_{${to("-")}}\\dfrac{|${xa}|}{${xa}}`, val: "m1", ev: (h) => Math.abs(h) / h, side: -1, bad: [["one", "MC-LIM-ONESIDED-SIGN"], ["none", "MC-LIM-ONESIDED-BOTH"], ["zero", "MC-LIM-ZERO-OVER-ZERO"]] },
                  { tex: `\\displaystyle\\lim_{${to("")}}\\dfrac{|${xa}|}{${xa}}`, val: "none", ev: (h) => Math.abs(h) / h, side: 0, bad: [["one", "MC-LIM-ONESIDED-BOTH"], ["m1", "MC-LIM-ONESIDED-BOTH"], ["zero", "MC-LIM-ZERO-OVER-ZERO"]] },
                ];
        const c = r.pick(cases);
        // 数値による判定：a に右から/左から 1e-6 ずつ近づける
        const probe = (sgn) => c.ev(sgn * 1e-6);
        const cls = (v) => (Math.abs(v) > 1e5 ? (v > 0 ? "inf" : "ninf") : Math.abs(v - 1) < 1e-6 ? "one" : Math.abs(v + 1) < 1e-6 ? "m1" : Math.abs(v) < 1e-6 ? "zero" : "?");
        const truth = c.side === 1 ? cls(probe(1)) : c.side === -1 ? cls(probe(-1)) : cls(probe(1)) === cls(probe(-1)) ? cls(probe(1)) : "none";
        assert(truth === c.val, `片側極限の判定が合わない: ${c.tex} ${truth} vs ${c.val}`);
        return choice({
          q: `${$(c.tex)} の値として正しいものはどれですか。`,
          correct: label[c.val],
          wrongs: c.bad.map(([k, mc]) => [label[k], mc]),
          explain: `${c.side === 0 ? `$x$ を $${a}$ に右からも左からも近づけて調べます。` : `$x$ を $${a}$ に${c.side > 0 ? "右" : "左"}から近づけると、$${xa}$ は${c.side > 0 ? "正" : "負"}の小さな値になります。`}${c.val === "inf" || c.val === "ninf" ? `分母が $0$ に近づき、値は${c.val === "inf" ? "正" : "負"}の大きな数になるので $${c.val === "inf" ? inf : ninf}$。` : c.val === "none" ? "左右で近づく値がちがう（または一方が発散する）ので、極限は存在しません。" : `値は $${c.val === "one" ? "1" : "-1"}$ に一定なので、極限は $${c.val === "one" ? "1" : "-1"}$。`}（両側から近づいた値が一致して初めて極限が存在する）`,
        });
      },
      { id: "d", db: 0.15 },
    ),

    t(
      "num",
      (r, lv) => {
        // 三角関数の極限（x→0）
        const h = 1e-4;
        const a = r.pick([2, 3, 4, 5]);
        const b = r.pick([1, 2, 3, 4].filter((v) => v !== a));
        if (lv === 1) {
          const useTan = r.chance(0.4);
          const ans = Q(a, b);
          const f = useTan ? (x) => Math.tan(a * x) / (b * x) : (x) => Math.sin(a * x) / (b * x);
          for (const hh of [h, -h]) nearly(f(hh), qnum(ans), "三角関数の極限の検算", 1e-3);
          return num({
            q: `$\\displaystyle\\lim_{x\\to 0}\\dfrac{\\${useTan ? "tan" : "sin"}\\,${a}x}{${b === 1 ? "" : b}x}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(b, a), "MC-LIM-TRIG-INVERT"], [Q(a * b), "MC-LIM-TRIG-COEF"], [Q(1), "MC-LIM-TRIG-ONE"], [Q(0), "MC-LIM-ZERO-OVER-ZERO"]].filter(([v]) => !eq(v, ans)),
            explain: `$\\lim_{\\theta\\to0}\\dfrac{\\${useTan ? "tan" : "sin"}\\,\\theta}{\\theta}=1$ を使います。$\\dfrac{\\${useTan ? "tan" : "sin"}\\,${a}x}{${b === 1 ? "" : b}x}=\\dfrac{\\${useTan ? "tan" : "sin"}\\,${a}x}{${a}x}\\times\\dfrac{${a}}{${b}}\\to 1\\times\\dfrac{${a}}{${b}}=${tq(ans)}$。（分母を $\\theta=${a}x$ の形にそろえる）`,
          });
        }
        if (lv === 2) {
          const kind = r.pick(["ratio", "cos"]);
          if (kind === "ratio") {
            const ans = Q(a, b);
            const f = (x) => Math.sin(a * x) / Math.sin(b * x);
            for (const hh of [h, -h]) nearly(f(hh), qnum(ans), "三角関数の極限の検算", 1e-3);
            return num({
              q: `$\\displaystyle\\lim_{x\\to 0}\\dfrac{\\sin\\,${a}x}{\\sin\\,${b === 1 ? "" : b}x}$ の値を求めなさい。`,
              ans,
              reduced: true,
              wrongs: [[Q(b, a), "MC-LIM-TRIG-INVERT"], [Q(1), "MC-LIM-TRIG-ONE"], [Q(a - b), "MC-LIM-TRIG-COEF"]].filter(([v]) => !eq(v, ans)),
              explain: `分子・分母を $x$ でわると $\\dfrac{\\sin ${a}x}{x}\\Big/\\dfrac{\\sin ${b === 1 ? "" : b}x}{x}=${a}\\cdot\\dfrac{\\sin ${a}x}{${a}x}\\Big/\\left(${b}\\cdot\\dfrac{\\sin ${b === 1 ? "" : b}x}{${b === 1 ? "" : b}x}\\right)\\to\\dfrac{${a}}{${b}}=${tq(ans)}$。`,
            });
          }
          const ans = Q(a * a, 2 * b);
          const f = (x) => (1 - Math.cos(a * x)) / (b * x * x);
          for (const hh of [h, -h]) nearly(f(hh), qnum(ans), "三角関数の極限の検算", 1e-3);
          return num({
            q: `$\\displaystyle\\lim_{x\\to 0}\\dfrac{1-\\cos ${a}x}{${b === 1 ? "" : b}x^{2}}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a, 2 * b), "MC-LIM-TRIG-COEF"], [Q(a * a, b), "MC-LIM-TRIG-HALF"], [Q(0), "MC-LIM-ZERO-OVER-ZERO"]].filter(([v]) => !eq(v, ans)),
            explain: `分子・分母に $1+\\cos ${a}x$ をかけると $\\dfrac{1-\\cos^{2}${a}x}{${b === 1 ? "" : b}x^{2}(1+\\cos ${a}x)}=\\dfrac{\\sin^{2}${a}x}{${b === 1 ? "" : b}x^{2}(1+\\cos ${a}x)}=\\dfrac{${a * a}}{${b}}\\left(\\dfrac{\\sin ${a}x}{${a}x}\\right)^{2}\\dfrac{1}{1+\\cos ${a}x}\\to\\dfrac{${a * a}}{${b}}\\cdot 1\\cdot\\dfrac12=${tq(ans)}$。（$\\lim\\dfrac{1-\\cos x}{x^{2}}=\\dfrac12$）`,
          });
        }
        const kind = r.pick(["cossq", "sqsin"]);
        if (kind === "cossq") {
          const ans = Q(a * a, 2 * b * b);
          const f = (x) => (1 - Math.cos(a * x)) / Math.pow(Math.sin(b * x), 2);
          for (const hh of [h, -h]) nearly(f(hh), qnum(ans), "三角関数の極限の検算", 1e-3);
          return num({
            q: `$\\displaystyle\\lim_{x\\to 0}\\dfrac{1-\\cos ${a}x}{\\sin^{2}${b === 1 ? "" : b}x}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(a * a, 2 * b), "MC-LIM-TRIG-COEF"], [Q(a, b), "MC-LIM-TRIG-COEF"], [Q(a * a, b * b), "MC-LIM-TRIG-HALF"]].filter(([v]) => !eq(v, ans)),
            explain: `分子は $1-\\cos ${a}x=\\dfrac{(${a}x)^{2}}{2}$ 程度、分母は $\\sin^{2}${b === 1 ? "" : b}x=(${b}x)^{2}$ 程度です。正確には分子・分母を $x^{2}$ でわって $\\dfrac{1-\\cos ${a}x}{x^{2}}\\to\\dfrac{${a * a}}{2}$、$\\dfrac{\\sin^{2}${b === 1 ? "" : b}x}{x^{2}}\\to ${b * b}$ なので、極限は $\\dfrac{${a * a}}{${2 * b * b}}=${tq(ans)}$。`,
          });
        }
        const ans = Q(a * b);
        const f = (x) => (Math.sin(a * x) * Math.tan(b * x)) / (x * x);
        for (const hh of [h, -h]) nearly(f(hh), qnum(ans), "三角関数の極限の検算", 1e-3);
        return num({
          q: `$\\displaystyle\\lim_{x\\to 0}\\dfrac{\\sin ${a}x\\,\\tan ${b === 1 ? "" : b}x}{x^{2}}$ の値を求めなさい。`,
          ans,
          wrongs: [[Q(a + b), "MC-LIM-TRIG-COEF"], [Q(1), "MC-LIM-TRIG-ONE"], [Q(a, b), "MC-LIM-TRIG-INVERT"]].filter(([v]) => !eq(v, ans)),
          explain: `$\\dfrac{\\sin ${a}x\\,\\tan ${b === 1 ? "" : b}x}{x^{2}}=\\dfrac{\\sin ${a}x}{x}\\times\\dfrac{\\tan ${b === 1 ? "" : b}x}{x}=${a}\\cdot\\dfrac{\\sin ${a}x}{${a}x}\\times ${b}\\cdot\\dfrac{\\tan ${b === 1 ? "" : b}x}{${b === 1 ? "" : b}x}\\to ${a}\\times ${b}=${a * b}$。`,
        });
      },
      { id: "e", db: 0.35 },
    ),

    t(
      "fields",
      (r, lv) => {
        // 極限値から定数を決める：分子が (x−p)(x+c) と因数分解できることを使う
        const p = r.pick([-3, -2, -1, 1, 2, 3]);
        const fx = (v) => (v < 0 ? `x+${-v}` : `x-${v}`); // 因数 x−v
        if (lv < 3) {
          const L = lv === 1 ? r.nz(-4, 4) : r.int(-6, 6);
          const c = L - p; // 約分後の x+c を p に近づけると p+c=L
          const a = c - p;
          const b = -p * c;
          const f = (x) => (x * x + a * x + b) / (x - p);
          for (const hh of [1e-5, -1e-5]) nearly(f(p + hh), L, "極限の検算", 1e-3);
          assert(p * p + a * p + b === 0, "分子が x=p で 0");
          return fields({
            q: `$\\displaystyle\\lim_{x\\to ${p}}\\dfrac{x^{2}+ax+b}{${fx(p)}}=${L}$ が成り立つように、定数 $a$、$b$ の値を求めなさい。`,
            fields: [
              { id: "a", value: a, pre: "$a=$" },
              { id: "b", value: b, pre: "$b=$" },
            ],
            wrongs: [{ values: { a: -a, b }, mc: "MC-LIM-COEF-SIGN" }, { values: { a: L, b: -p * L }, mc: "MC-LIM-COEF-LIMIT" }, { values: { a, b: -b }, mc: "MC-LIM-COEF-SIGN" }],
            explain: `分母が $x\\to ${p}$ で $0$ になるのに極限値が有限なので、分子も $x=${p}$ で $0$ でなければなりません。つまり分子は $(${fx(p)})(x+c)$ の形です。約分すると $x+c$ で、$x\\to ${p}$ のとき $${p}+c=${L}$ より $c=${c}$。分子を展開すると $x^{2}+(c-p)x-pc$ で、$p=${p}$、$c=${c}$ を入れると $${px(poly([[1, 2], [a, 1], [b, 0]]))}$ なので $a=${a}$、$b=${b}$。（分子が $0$ にならないと、極限は無限大に発散してしまう）`,
          });
        }
        // 分母が x²−p²
        const c = r.int(-4, 4);
        const L = Q(p + c, 2 * p);
        const a = c - p;
        const b = -p * c;
        const f = (x) => (x * x + a * x + b) / (x * x - p * p);
        for (const hh of [1e-5, -1e-5]) nearly(f(p + hh), qnum(L), "極限の検算", 1e-3);
        assert(p * p + a * p + b === 0, "分子が x=p で 0");
        return fields({
          q: `$\\displaystyle\\lim_{x\\to ${p}}\\dfrac{x^{2}+ax+b}{x^{2}-${p * p}}=${tq(L)}$ が成り立つように、定数 $a$、$b$ の値を求めなさい。`,
          fields: [
            { id: "a", value: a, pre: "$a=$" },
            { id: "b", value: b, pre: "$b=$" },
          ],
          wrongs: [{ values: { a: -a, b }, mc: "MC-LIM-COEF-SIGN" }, { values: { a: c, b: -p * c }, mc: "MC-LIM-COEF-LIMIT" }, { values: { a, b: -b }, mc: "MC-LIM-COEF-SIGN" }],
          explain: `分母は $x^{2}-${p * p}=(${fx(p)})(${fx(-p)})$ で、$x=${p}$ のとき $0$。極限値が有限なので、分子も $x=${p}$ で $0$、つまり $(${fx(p)})(x+c)$ の形です。約分すると $\\dfrac{x+c}{${fx(-p)}}$ で、$x\\to ${p}$ のとき $\\dfrac{${p}+c}{${2 * p}}=${tq(L)}$。これより $c=${c}$。分子を展開すると $${px(poly([[1, 2], [a, 1], [b, 0]]))}$ なので $a=${a}$、$b=${b}$。`,
        });
      },
      { id: "f", db: 0.5 },
    ),
  ],
};

/** Poly を x=数値 で評価（浮動小数）。ホーナー法で、桁あふれしない */
function polyValue(p, x) {
  const deg = p.degree();
  let s = 0;
  for (let k = deg; k >= 0; k--) {
    const c = p.coeff(k);
    s = s * x + c.n / c.d;
  }
  return s;
}
