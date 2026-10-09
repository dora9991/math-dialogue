// ============================================================
// tpl/hs_calc_deriv2.js — 高校 微分（数III）
//   deriv_rules（積・商・合成関数）/ deriv_transc（三角・指数・対数関数）
//
//  すべて自作の数値・言い回し。答えは、数値微分（中心差分の5点公式）や、公式を使わない別の経路でも確かめている。
//  ※ $\log$ は底が e の自然対数として出題する。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, gcd, num as qnum, pow as qpow } from "../../core/rational.js";
import { tq, tp } from "../../core/tex.js";
import { P } from "../../core/poly.js";
import { t, until, assert } from "./util.js";
import { numDeriv, nearly, polyDeriv, polyFn } from "./hs_util.js";
import { $, px, poly, at, checkDeriv } from "./hs_calc_deriv.js";

/** 数値の一致（相対 1e-6） */
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
/** e^{kx} の TeX */
const expTex = (k) => `e^{${k === 1 ? "" : k === -1 ? "-" : k}x}`;
/** kx の TeX */
const kx = (k) => `${k === 1 ? "" : k === -1 ? "-" : k}x`;
/** 項 [[係数, 本体TeX], …] を + と − でつないだ TeX（係数 0 の項は省く。定数項は本体を "" にする） */
function sumTex(terms) {
  return terms
    .filter(([c]) => c !== 0)
    .map(([c, body], i) => {
      const ac = Math.abs(c);
      return `${c < 0 ? "-" : i === 0 ? "" : "+"}${ac === 1 && body !== "" ? "" : ac}${body}`;
    })
    .join("");
}
/** 係数の TeX（1 は省き、-1 は "-"） */
const co = (k) => (k === 1 ? "" : k === -1 ? "-" : String(k));
/** (e^{kx})' の TeX */
const dexp = (k) => `${co(k)}e^{${kx(k)}}`;
/** 接線 y=mx+n の右辺 */
const lineTex = (m, n) => P.lin(m, n).toTeX({ order: ["x"] });
/** べき乗の TeX（指数 1 は省く） */
const pw = (base, e) => (e === 1 ? base : `${base}^{${e}}`);

/** 候補式 [TeX, 関数, mc] のうち、本当の導関数と（テスト点で）一致しないものだけを選択肢にする */
function numericLabels(f, cands, pts) {
  const out = [];
  const seen = new Set();
  for (const [tex, fn, mc] of cands) {
    if (seen.has(tex)) continue;
    seen.add(tex);
    if (pts.every((x) => close(numDeriv(f, x), fn(x)))) continue; // 同じ関数になっている式は誤答にしない
    out.push([$(tex), mc]);
  }
  return out;
}

export default {
  // ── 積・商・合成関数の微分 ─────────────────────
  deriv_rules: [
    t("num", (r, lv) => {
      // 積の微分
      const fs =
        lv === 1
          ? [P.lin(1, r.nz(-4, 4)), poly([[1, 2], [r.nz(-4, 4), 1], [r.int(-5, 5), 0]])]
          : lv === 2
            ? [poly([[1, 2], [r.int(-3, 3), 1], [r.int(-4, 4), 0]]), poly([[1, 3], [r.nz(-3, 3), 1], [r.int(-5, 5), 0]])]
            : [poly([[1, 2], [r.int(1, 3), 0]]), P.lin(1, r.nz(-4, 4)), P.lin(1, r.nz(-4, 4))];
      const x0 = r.int(-3, 3);
      const f = fs.reduce((u, v) => u.mul(v));
      const fp = polyDeriv(f);
      checkDeriv(f, fp);
      const ans = at(fp, Q(x0));
      // 積の微分の公式（1 つずつ微分して他をかける）で別に計算して、展開して微分した結果と比べる
      const vals = fs.map((g) => at(g, Q(x0)));
      const ders = fs.map((g) => at(polyDeriv(g), Q(x0)));
      let viaRule = Q(0);
      fs.forEach((_, i) => {
        let term = ders[i];
        vals.forEach((v, j) => {
          if (j !== i) term = mul(term, v);
        });
        viaRule = add(viaRule, term);
      });
      assert(eq(ans, viaRule), "積の微分の検算");
      const allDers = ders.reduce((u, v) => mul(u, v), Q(1));
      const firstOnly = vals.slice(1).reduce((u, v) => mul(u, v), ders[0]);
      const wrongs = [[allDers, "MC-DERIV-PRODUCT-SEPARATE"], [firstOnly, "MC-DERIV-PRODUCT-FIRST"], [at(f, Q(x0)), "MC-DERIV-EVAL-INSTEAD"]];
      if (fs.length === 2) wrongs.push([sub(mul(ders[0], vals[1]), mul(vals[0], ders[1])), "MC-DERIV-PRODUCT-SIGN"]);
      const fx = fs.map((g) => `(${px(g)})`).join("");
      const how =
        fs.length === 2
          ? `$g(x)=${px(fs[0])}$、$h(x)=${px(fs[1])}$ とおくと $g'(x)=${px(polyDeriv(fs[0]))}$、$h'(x)=${px(polyDeriv(fs[1]))}$。$x=${x0}$ で $g=${tq(vals[0])}$、$g'=${tq(ders[0])}$、$h=${tq(vals[1])}$、$h'=${tq(ders[1])}$。積の微分 $(gh)'=g'h+gh'$ より $f'(${x0})=${tp(ders[0])}\\times ${tp(vals[1])}+${tp(vals[0])}\\times ${tp(ders[1])}=${tq(ans)}$。`
          : `3 つの積の微分は $(ghk)'=g'hk+gh'k+ghk'$。$x=${x0}$ での値は ${fs.map((g, i) => `$${["g", "h", "k"][i]}=${tq(vals[i])}$、$${["g", "h", "k"][i]}'=${tq(ders[i])}$`).join("、")}。よって $f'(${x0})=${tp(ders[0])}\\cdot ${tp(vals[1])}\\cdot ${tp(vals[2])}+${tp(vals[0])}\\cdot ${tp(ders[1])}\\cdot ${tp(vals[2])}+${tp(vals[0])}\\cdot ${tp(vals[1])}\\cdot ${tp(ders[2])}=${tq(ans)}$。`;
      return num({
        q: `$f(x)=${fx}$ のとき、$f'(${x0})$ の値を求めなさい。`,
        ans,
        wrongs,
        explain: `${how}（展開してから微分しても同じ値になる。「それぞれを微分してかける」のではない）`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        // 商の微分：分母が 0 にならず、導関数の値が 0 でない (N, D, x0) を作る
        const gen = () =>
          lv === 1
            ? [P.lin(r.nz(-3, 3), r.nz(-5, 5)), P.lin(r.pick([1, 2, 3]), r.nz(-4, 4))]
            : lv === 2
              ? r.pick([
                  [poly([[1, 2], [r.int(-3, 3), 1], [r.int(-4, 4), 0]]), P.lin(1, r.nz(-4, 4))],
                  [P.lin(r.nz(-3, 3), r.int(-4, 4)), poly([[1, 2], [r.int(1, 4), 0]])],
                ])
              : [poly([[1, 2], [r.int(-3, 3), 1], [r.int(-4, 4), 0]]), poly([[1, 2], [r.pick([-1, 1]) * r.int(1, 2), 1], [r.int(2, 5), 0]])];
        const { N, D, x0 } = until(
          () => {
            const [nn, dd] = gen();
            return { N: nn, D: dd, x0: r.int(-3, 3) };
          },
          ({ N: nn, D: dd, x0: x }) => {
            const dx = at(dd, Q(x));
            if (eq(dx, Q(0))) return false;
            const v = sub(mul(at(polyDeriv(nn), Q(x)), dx), mul(at(nn, Q(x)), at(polyDeriv(dd), Q(x))));
            return !eq(v, Q(0));
          },
          500,
        );
        const Np = polyDeriv(N);
        const Dp = polyDeriv(D);
        const [n0, d0, n1, d1] = [at(N, Q(x0)), at(D, Q(x0)), at(Np, Q(x0)), at(Dp, Q(x0))];
        const top = sub(mul(n1, d0), mul(n0, d1)); // N'D − ND'
        const ans = div(top, mul(d0, d0));
        const F = (x) => polyFn(N)(x) / polyFn(D)(x);
        nearly(numDeriv(F, x0), qnum(ans), "商の微分の検算", 1e-6);
        const wrongs = [
          [div(neg(top), mul(d0, d0)), "MC-DERIV-QUOTIENT-ORDER"],
          [div(top, d0), "MC-DERIV-QUOTIENT-SQUARE"],
          [div(add(mul(n1, d0), mul(n0, d1)), mul(d0, d0)), "MC-DERIV-QUOTIENT-SIGN"],
        ];
        if (!eq(d1, Q(0))) wrongs.push([div(n1, d1), "MC-DERIV-QUOTIENT-SEPARATE"]);
        return num({
          q: `$f(x)=\\dfrac{${px(N)}}{${px(D)}}$ のとき、$f'(${x0})$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs,
          explain: `商の微分 $\\left(\\dfrac{N}{D}\\right)'=\\dfrac{N'D-ND'}{D^{2}}$。$N=${px(N)}$、$N'=${px(Np)}$、$D=${px(D)}$、$D'=${px(Dp)}$。$x=${x0}$ で $N=${tq(n0)}$、$N'=${tq(n1)}$、$D=${tq(d0)}$、$D'=${tq(d1)}$ なので $f'(${x0})=\\dfrac{${tp(n1)}\\times ${tp(d0)}-${tp(n0)}\\times ${tp(d1)}}{${tp(d0)}^{2}}=${tq(ans)}$。（分子は「分子の微分 × 分母 − 分子 × 分母の微分」の順。分母は 2 乗）`,
        });
      },
      { id: "b", db: 0.2 },
    ),

    t(
      "num",
      (r, lv) => {
        // 合成関数の微分：f'(x0) を求める
        const [x0, a, b] = until(
          () => [r.int(-2, 2), r.pick([2, 3, -1, -2]), r.nz(-4, 4)],
          ([x, aa, bb]) => aa * x + bb !== 0,
        );
        const base = a * x0 + b; // ax0+b
        const kind = lv === 1 ? "pow" : lv === 2 ? r.pick(["quadpow", "negpow"]) : r.pick(["sqrt", "prodchain"]);
        if (kind === "pow") {
          const n = r.int(2, 5);
          const B = Q(base);
          const ans = mul(Q(n * a), qpow(B, n - 1));
          const F = (x) => Math.pow(a * x + b, n);
          nearly(numDeriv(F, x0), qnum(ans), "合成関数の微分の検算", 1e-6);
          return num({
            q: `$f(x)=(${px(P.lin(a, b))})^{${n}}$ のとき、$f'(${x0})$ の値を求めなさい。`,
            ans,
            wrongs: [[mul(Q(n), qpow(B, n - 1)), "MC-DERIV-CHAIN-INNER"], [mul(Q(n * a), qpow(B, n)), "MC-DERIV-EXP-KEEP"], [mul(Q(a), qpow(B, n - 1)), "MC-DERIV-CHAIN-N"], [qpow(B, n), "MC-DERIV-EVAL-INSTEAD"]],
            explain: `合成関数の微分 $\\{g(x)^{n}\\}'=n\\,g(x)^{n-1}\\cdot g'(x)$ を使います。$g(x)=${px(P.lin(a, b))}$、$g'(x)=${a}$ なので $f'(x)=${n}(${px(P.lin(a, b))})^{${n - 1}}\\times ${tp(a)}$。$x=${x0}$ で $g(${x0})=${base}$ だから $f'(${x0})=${n}\\times ${tp(base)}^{${n - 1}}\\times ${tp(a)}=${tq(ans)}$。（かっこの中の微分 $${a}$ をかけ忘れない）`,
          });
        }
        if (kind === "quadpow") {
          const p = r.int(-3, 3);
          const q0 = r.int(-3, 3);
          const n = r.int(2, 3);
          const u = x0 * x0 + p * x0 + q0;
          const du = 2 * x0 + p;
          const ans = mul(Q(n * du), qpow(Q(u), n - 1));
          const F = (x) => Math.pow(x * x + p * x + q0, n);
          nearly(numDeriv(F, x0), qnum(ans), "合成関数の微分の検算", 1e-6);
          const g = poly([[1, 2], [p, 1], [q0, 0]]);
          return num({
            q: `$f(x)=(${px(g)})^{${n}}$ のとき、$f'(${x0})$ の値を求めなさい。`,
            ans,
            wrongs: [[mul(Q(n), qpow(Q(u), n - 1)), "MC-DERIV-CHAIN-INNER"], [mul(Q(n * du), qpow(Q(u), n)), "MC-DERIV-EXP-KEEP"], [mul(Q(du), qpow(Q(u), n - 1)), "MC-DERIV-CHAIN-N"]],
            explain: `$g(x)=${px(g)}$、$g'(x)=${px(polyDeriv(g))}$ とすると $f'(x)=${n}\\{g(x)\\}^{${n - 1}}\\cdot g'(x)$。$x=${x0}$ で $g=${u}$、$g'=${du}$ なので $f'(${x0})=${n}\\times ${tp(u)}^{${n - 1}}\\times ${tp(du)}=${tq(ans)}$。（内側の関数の微分 $g'(${x0})=${du}$ をかける）`,
          });
        }
        if (kind === "negpow") {
          const n = r.int(1, 3);
          const B = Q(base);
          const ans = div(Q(-n * a), qpow(B, n + 1));
          const F = (x) => 1 / Math.pow(a * x + b, n);
          nearly(numDeriv(F, x0), qnum(ans), "合成関数の微分の検算", 1e-6);
          return num({
            q: `$f(x)=\\dfrac{1}{(${px(P.lin(a, b))})^{${n}}}$ のとき、$f'(${x0})$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[div(Q(-n), qpow(B, n + 1)), "MC-DERIV-CHAIN-INNER"], [div(Q(n * a), qpow(B, n + 1)), "MC-DERIV-CHAIN-SIGN"], [div(Q(-n * a), qpow(B, n)), "MC-DERIV-EXP-KEEP"]],
            explain: `$f(x)=(${px(P.lin(a, b))})^{-${n}}$ と書けるので $f'(x)=-${n}(${px(P.lin(a, b))})^{-${n + 1}}\\times ${tp(a)}=\\dfrac{${-n * a}}{(${px(P.lin(a, b))})^{${n + 1}}}$。$x=${x0}$ のとき $g(${x0})=${base}$ なので $f'(${x0})=\\dfrac{${-n * a}}{${tp(base)}^{${n + 1}}}=${tq(ans)}$。（指数が負になっても $-n$ を前に出して指数を 1 つ下げる。内側の微分 $${a}$ も忘れない）`,
          });
        }
        if (kind === "sqrt") {
          // √(ax+b) を、中身が平方数になる x0 で
          const s = r.int(1, 4);
          const aa = r.pick([2, 3, 4, 6]);
          const x1 = r.int(-2, 3);
          const bb = s * s - aa * x1;
          const ans = Q(aa, 2 * s);
          const F = (x) => Math.sqrt(aa * x + bb);
          nearly(numDeriv(F, x1), qnum(ans), "合成関数の微分の検算", 1e-6);
          return num({
            q: `$f(x)=\\sqrt{${px(P.lin(aa, bb))}}$ のとき、$f'(${x1})$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(1, 2 * s), "MC-DERIV-CHAIN-INNER"], [Q(aa, s), "MC-DERIV-SQRT-HALF"], [Q(aa, 2 * s * s), "MC-DERIV-EXP-KEEP"], [Q(s), "MC-DERIV-EVAL-INSTEAD"]],
            explain: `$f(x)=(${px(P.lin(aa, bb))})^{\\frac12}$ なので $f'(x)=\\dfrac12(${px(P.lin(aa, bb))})^{-\\frac12}\\times ${aa}=\\dfrac{${aa}}{2\\sqrt{${px(P.lin(aa, bb))}}}$。$x=${x1}$ で $\\sqrt{${px(P.lin(aa, bb))}}=\\sqrt{${s * s}}=${s}$ なので $f'(${x1})=\\dfrac{${aa}}{2\\times ${s}}=${tq(ans)}$。（$\\dfrac12$ と内側の微分 $${aa}$ の両方が必要）`,
          });
        }
        // prodchain: x·(ax+b)^n
        const n = r.int(2, 4);
        const B = Q(base);
        const ans = add(qpow(B, n), mul(Q(x0 * n * a), qpow(B, n - 1)));
        const F = (x) => x * Math.pow(a * x + b, n);
        nearly(numDeriv(F, x0), qnum(ans), "積と合成の微分の検算", 1e-6);
        return num({
          q: `$f(x)=x(${px(P.lin(a, b))})^{${n}}$ のとき、$f'(${x0})$ の値を求めなさい。`,
          ans,
          wrongs: [[mul(Q(x0 * n * a), qpow(B, n - 1)), "MC-DERIV-PRODUCT-FIRST"], [qpow(B, n), "MC-DERIV-PRODUCT-FIRST"], [add(qpow(B, n), mul(Q(x0 * n), qpow(B, n - 1))), "MC-DERIV-CHAIN-INNER"], [mul(Q(n * a), qpow(B, n - 1)), "MC-DERIV-PRODUCT-SEPARATE"]],
          explain: `積の微分 $(gh)'=g'h+gh'$ で $g=x$、$h=(${px(P.lin(a, b))})^{${n}}$ とします。$g'=1$、$h'=${n}(${px(P.lin(a, b))})^{${n - 1}}\\times ${tp(a)}$（合成関数の微分）。$f'(x)=(${px(P.lin(a, b))})^{${n}}+x\\cdot ${n}\\times ${tp(a)}(${px(P.lin(a, b))})^{${n - 1}}$。$x=${x0}$ のとき $g(${x0})=${base}$ だから $f'(${x0})=${tp(base)}^{${n}}+${tp(x0)}\\times ${n}\\times ${tp(a)}\\times ${tp(base)}^{${n - 1}}=${tq(ans)}$。`,
        });
      },
      { id: "c", db: 0.1 },
    ),

    t(
      "choice",
      (r, lv) => {
        // 合成関数の導関数の形を選ぶ
        const pts = [0.7, 1.9];
        const kind = lv === 1 ? "pow" : lv === 2 ? r.pick(["pow2", "quad"]) : r.pick(["sqrt", "inv"]);
        if (kind === "pow" || kind === "pow2") {
          const a = kind === "pow" ? r.pick([2, 3, -2]) : r.pick([3, 4, -3]);
          const b = r.nz(-4, 4);
          const n = kind === "pow" ? r.int(3, 5) : r.int(4, 7);
          const g = px(P.lin(a, b));
          const f = (x) => Math.pow(a * x + b, n);
          return choice({
            q: `関数 $f(x)=(${g})^{${n}}$ の導関数はどれですか。`,
            correct: $(`${n * a}(${g})^{${n - 1}}`),
            wrongs: numericLabels(f, [
              [`${n}(${g})^{${n - 1}}`, (x) => n * Math.pow(a * x + b, n - 1), "MC-DERIV-CHAIN-INNER"],
              [`${n * a}(${g})^{${n}}`, (x) => n * a * Math.pow(a * x + b, n), "MC-DERIV-EXP-KEEP"],
              [`${a}(${g})^{${n - 1}}`, (x) => a * Math.pow(a * x + b, n - 1), "MC-DERIV-CHAIN-N"],
              [`${n}(${g})^{${n - 1}}\\cdot ${a}x`, (x) => n * Math.pow(a * x + b, n - 1) * a * x, "MC-DERIV-CHAIN-INNER"],
            ], pts),
            explain: `$\\{g(x)^{n}\\}'=n\\,g(x)^{n-1}\\cdot g'(x)$ を使います。$g(x)=${g}$、$g'(x)=${a}$ なので $f'(x)=${n}(${g})^{${n - 1}}\\times ${tp(a)}=${n * a}(${g})^{${n - 1}}$。（内側の微分 $${a}$ をかけ忘れない）`,
          });
        }
        if (kind === "quad") {
          const q0 = r.int(1, 5);
          const n = r.int(2, 5);
          const f = (x) => Math.pow(x * x + q0, n);
          const g = `x^{2}+${q0}`;
          return choice({
            q: `関数 $f(x)=(${g})^{${n}}$ の導関数はどれですか。`,
            correct: $(`${2 * n}x(${g})^{${n - 1}}`),
            wrongs: numericLabels(f, [
              [`${n}(${g})^{${n - 1}}`, (x) => n * Math.pow(x * x + q0, n - 1), "MC-DERIV-CHAIN-INNER"],
              [`${2 * n}x(${g})^{${n}}`, (x) => 2 * n * x * Math.pow(x * x + q0, n), "MC-DERIV-EXP-KEEP"],
              [`${2}x(${g})^{${n - 1}}`, (x) => 2 * x * Math.pow(x * x + q0, n - 1), "MC-DERIV-CHAIN-N"],
              [`${n}x(${g})^{${n - 1}}`, (x) => n * x * Math.pow(x * x + q0, n - 1), "MC-DERIV-CHAIN-INNER"],
            ], pts),
            explain: `$g(x)=${g}$ とすると $g'(x)=2x$。$f'(x)=${n}(${g})^{${n - 1}}\\cdot 2x=${2 * n}x(${g})^{${n - 1}}$。（内側の微分 $2x$ をかける）`,
          });
        }
        if (kind === "sqrt") {
          const a = r.pick([2, 3, 4]);
          const b = r.int(1, 5);
          const g = px(P.lin(a, b));
          const f = (x) => Math.sqrt(a * x + b);
          return choice({
            q: `関数 $f(x)=\\sqrt{${g}}$ の導関数はどれですか。`,
            correct: $(`\\dfrac{${a}}{2\\sqrt{${g}}}`),
            wrongs: numericLabels(f, [
              [`\\dfrac{1}{2\\sqrt{${g}}}`, (x) => 1 / (2 * Math.sqrt(a * x + b)), "MC-DERIV-CHAIN-INNER"],
              [`\\dfrac{${a}}{\\sqrt{${g}}}`, (x) => a / Math.sqrt(a * x + b), "MC-DERIV-SQRT-HALF"],
              [`\\dfrac{${a}\\sqrt{${g}}}{2}`, (x) => (a * Math.sqrt(a * x + b)) / 2, "MC-DERIV-EXP-KEEP"],
              [`\\dfrac{${a}}{2(${g})}`, (x) => a / (2 * (a * x + b)), "MC-DERIV-EXP-KEEP"],
            ], pts),
            explain: `$f(x)=(${g})^{\\frac12}$ と書けるので $f'(x)=\\dfrac12(${g})^{-\\frac12}\\times ${a}=\\dfrac{${a}}{2\\sqrt{${g}}}$。（外側の $\\dfrac12$ と、内側の微分 $${a}$ の両方が出る）`,
          });
        }
        const q0 = r.int(1, 5);
        const g = `x^{2}+${q0}`;
        const f = (x) => 1 / (x * x + q0);
        return choice({
          q: `関数 $f(x)=\\dfrac{1}{${g}}$ の導関数はどれですか。`,
          correct: $(`-\\dfrac{2x}{(${g})^{2}}`),
          wrongs: numericLabels(f, [
            [`\\dfrac{2x}{(${g})^{2}}`, (x) => (2 * x) / Math.pow(x * x + q0, 2), "MC-DERIV-QUOTIENT-SIGN"],
            [`-\\dfrac{1}{(${g})^{2}}`, (x) => -1 / Math.pow(x * x + q0, 2), "MC-DERIV-CHAIN-INNER"],
            [`-\\dfrac{2x}{${g}}`, (x) => (-2 * x) / (x * x + q0), "MC-DERIV-EXP-KEEP"],
            [`\\dfrac{2x}{${g}}`, (x) => (2 * x) / (x * x + q0), "MC-DERIV-EXP-KEEP"],
          ], pts),
          explain: `$f(x)=(${g})^{-1}$ と書けるので $f'(x)=-(${g})^{-2}\\cdot 2x=-\\dfrac{2x}{(${g})^{2}}$。（商の微分 $\\left(\\dfrac{1}{D}\\right)'=-\\dfrac{D'}{D^{2}}$ でも同じ）`,
        });
      },
      { id: "d", db: 0.05 },
    ),
  ],

  // ── 三角・指数・対数関数の微分 ──────────────────
  deriv_transc: [
    t("choice", (r, lv) => {
      // 導関数の形を選ぶ。候補式はどれも数値で確かめ、本当の導関数と一致しない式だけを誤答にする
      const pts = [0.7, 1.9];
      const S = Math.sin;
      const C = Math.cos;
      const k = r.pick([2, 3, 4]);
      const a = r.pick([2, 3]);
      const b = r.pick([1, 2, 3]);
      const ln = Math.log;
      const E = Math.exp;
      const L1 = [
        { f: "\\sin x", fn: S, cor: ["\\cos x", C], wr: [["-\\cos x", (x) => -C(x), "MC-DERIV-SIN-SIGN"], ["-\\sin x", (x) => -S(x), "MC-DERIV-SIN-COS-CONFUSE"], ["\\sin x", S, "MC-DERIV-SIN-COS-CONFUSE"]] },
        { f: "\\cos x", fn: C, cor: ["-\\sin x", (x) => -S(x)], wr: [["\\sin x", S, "MC-DERIV-COS-SIGN"], ["-\\cos x", (x) => -C(x), "MC-DERIV-SIN-COS-CONFUSE"], ["\\cos x", C, "MC-DERIV-SIN-COS-CONFUSE"]] },
        { f: "\\tan x", fn: Math.tan, cor: ["\\dfrac{1}{\\cos^{2}x}", (x) => 1 / (C(x) * C(x))], wr: [["\\dfrac{1}{\\sin^{2}x}", (x) => 1 / (S(x) * S(x)), "MC-DERIV-TAN-SIN"], ["-\\dfrac{1}{\\cos^{2}x}", (x) => -1 / (C(x) * C(x)), "MC-DERIV-TAN-SIGN"], ["\\dfrac{1}{\\cos x}", (x) => 1 / C(x), "MC-DERIV-TAN-POWER"]] },
        { f: "e^{x}", fn: E, cor: ["e^{x}", E], wr: [["xe^{x-1}", (x) => x * E(x - 1), "MC-DERIV-EXP-AS-POWER"], ["e^{x-1}", (x) => E(x - 1), "MC-DERIV-EXP-AS-POWER"], ["xe^{x}", (x) => x * E(x), "MC-DERIV-EXP-AS-POWER"]] },
        { f: "\\log x", fn: ln, cor: ["\\dfrac{1}{x}", (x) => 1 / x], wr: [["x\\log x-x", (x) => x * ln(x) - x, "MC-DERIV-INTEGRATE"], ["\\dfrac{\\log x}{x}", (x) => ln(x) / x, "MC-DERIV-LOG-KEEP"], ["e^{x}", E, "MC-DERIV-LOG-EXP-CONFUSE"]], log: true },
        { f: `${a}^{x}`, fn: (x) => Math.pow(a, x), cor: [`${a}^{x}\\log ${a}`, (x) => Math.pow(a, x) * ln(a)], wr: [[`x\\cdot ${a}^{x-1}`, (x) => x * Math.pow(a, x - 1), "MC-DERIV-EXP-AS-POWER"], [`${a}^{x}`, (x) => Math.pow(a, x), "MC-DERIV-EXP-BASE-LOG"], [`\\dfrac{${a}^{x}}{\\log ${a}}`, (x) => Math.pow(a, x) / ln(a), "MC-DERIV-EXP-LOG-DIV"]], log: true },
      ];
      const L2 = [
        { f: `\\sin ${k}x`, fn: (x) => S(k * x), cor: [`${k}\\cos ${k}x`, (x) => k * C(k * x)], wr: [[`\\cos ${k}x`, (x) => C(k * x), "MC-DERIV-CHAIN-INNER"], [`-${k}\\cos ${k}x`, (x) => -k * C(k * x), "MC-DERIV-SIN-SIGN"], [`${k}\\sin ${k}x`, (x) => k * S(k * x), "MC-DERIV-SIN-COS-CONFUSE"]] },
        { f: `\\cos ${k}x`, fn: (x) => C(k * x), cor: [`-${k}\\sin ${k}x`, (x) => -k * S(k * x)], wr: [[`-\\sin ${k}x`, (x) => -S(k * x), "MC-DERIV-CHAIN-INNER"], [`${k}\\sin ${k}x`, (x) => k * S(k * x), "MC-DERIV-COS-SIGN"], [`-${k}\\cos ${k}x`, (x) => -k * C(k * x), "MC-DERIV-SIN-COS-CONFUSE"]] },
        { f: `\\tan ${k}x`, fn: (x) => Math.tan(k * x), cor: [`\\dfrac{${k}}{\\cos^{2}${k}x}`, (x) => k / (C(k * x) * C(k * x))], wr: [[`\\dfrac{1}{\\cos^{2}${k}x}`, (x) => 1 / (C(k * x) * C(k * x)), "MC-DERIV-CHAIN-INNER"], [`\\dfrac{${k}}{\\sin^{2}${k}x}`, (x) => k / (S(k * x) * S(k * x)), "MC-DERIV-TAN-SIN"], [`-\\dfrac{${k}}{\\cos^{2}${k}x}`, (x) => -k / (C(k * x) * C(k * x)), "MC-DERIV-TAN-SIGN"]] },
        { f: `e^{${k}x}`, fn: (x) => E(k * x), cor: [`${k}e^{${k}x}`, (x) => k * E(k * x)], wr: [[`e^{${k}x}`, (x) => E(k * x), "MC-DERIV-CHAIN-INNER"], [`\\dfrac{e^{${k}x}}{${k}}`, (x) => E(k * x) / k, "MC-DERIV-CHAIN-DIVIDE"], [`${k}xe^{${k}x-1}`, (x) => k * x * E(k * x - 1), "MC-DERIV-EXP-AS-POWER"]] },
        { f: `e^{-x}`, fn: (x) => E(-x), cor: ["-e^{-x}", (x) => -E(-x)], wr: [["e^{-x}", (x) => E(-x), "MC-DERIV-CHAIN-INNER"], ["-e^{x}", (x) => -E(x), "MC-DERIV-CHAIN-INNER"], ["-xe^{-x-1}", (x) => -x * E(-x - 1), "MC-DERIV-EXP-AS-POWER"]] },
        { f: `\\log(${a}x+${b})`, fn: (x) => ln(a * x + b), cor: [`\\dfrac{${a}}{${a}x+${b}}`, (x) => a / (a * x + b)], wr: [[`\\dfrac{1}{${a}x+${b}}`, (x) => 1 / (a * x + b), "MC-DERIV-CHAIN-INNER"], [`\\dfrac{${a}}{x}`, (x) => a / x, "MC-DERIV-LOG-KEEP"], [`\\dfrac{${a}x+${b}}{${a}}`, (x) => (a * x + b) / a, "MC-DERIV-LOG-INVERT"]], log: true },
      ];
      const L3 = [
        { f: "xe^{x}", fn: (x) => x * E(x), cor: ["(x+1)e^{x}", (x) => (x + 1) * E(x)], wr: [["e^{x}", E, "MC-DERIV-PRODUCT-SEPARATE"], ["xe^{x}", (x) => x * E(x), "MC-DERIV-PRODUCT-FIRST"], ["(x-1)e^{x}", (x) => (x - 1) * E(x), "MC-DERIV-PRODUCT-SIGN"]] },
        { f: "x\\log x", fn: (x) => x * ln(x), cor: ["\\log x+1", (x) => ln(x) + 1], wr: [["\\log x", ln, "MC-DERIV-PRODUCT-FIRST"], ["\\dfrac{1}{x}", (x) => 1 / x, "MC-DERIV-PRODUCT-SEPARATE"], ["\\log x-1", (x) => ln(x) - 1, "MC-DERIV-PRODUCT-SIGN"]], log: true },
        { f: "e^{x}\\sin x", fn: (x) => E(x) * S(x), cor: ["e^{x}(\\sin x+\\cos x)", (x) => E(x) * (S(x) + C(x))], wr: [["e^{x}\\cos x", (x) => E(x) * C(x), "MC-DERIV-PRODUCT-SEPARATE"], ["e^{x}(\\sin x-\\cos x)", (x) => E(x) * (S(x) - C(x)), "MC-DERIV-PRODUCT-SIGN"], ["e^{x}\\sin x", (x) => E(x) * S(x), "MC-DERIV-PRODUCT-FIRST"]] },
        { f: "e^{x}\\cos x", fn: (x) => E(x) * C(x), cor: ["e^{x}(\\cos x-\\sin x)", (x) => E(x) * (C(x) - S(x))], wr: [["-e^{x}\\sin x", (x) => -E(x) * S(x), "MC-DERIV-PRODUCT-SEPARATE"], ["e^{x}(\\cos x+\\sin x)", (x) => E(x) * (C(x) + S(x)), "MC-DERIV-COS-SIGN"], ["e^{x}\\cos x", (x) => E(x) * C(x), "MC-DERIV-PRODUCT-FIRST"]] },
        { f: "\\sin x\\cos x", fn: (x) => S(x) * C(x), cor: ["\\cos^{2}x-\\sin^{2}x", (x) => C(x) * C(x) - S(x) * S(x)], wr: [["-\\sin x\\cos x", (x) => -S(x) * C(x), "MC-DERIV-PRODUCT-SEPARATE"], ["\\cos^{2}x+\\sin^{2}x", () => 1, "MC-DERIV-PRODUCT-SIGN"], ["\\cos^{2}x", (x) => C(x) * C(x), "MC-DERIV-PRODUCT-FIRST"]] },
        { f: "\\log(x^{2}+1)", fn: (x) => ln(x * x + 1), cor: ["\\dfrac{2x}{x^{2}+1}", (x) => (2 * x) / (x * x + 1)], wr: [["\\dfrac{1}{x^{2}+1}", (x) => 1 / (x * x + 1), "MC-DERIV-CHAIN-INNER"], ["\\dfrac{2x}{(x^{2}+1)^{2}}", (x) => (2 * x) / Math.pow(x * x + 1, 2), "MC-DERIV-QUOTIENT-SQUARE"], ["2x\\log(x^{2}+1)", (x) => 2 * x * ln(x * x + 1), "MC-DERIV-LOG-KEEP"]], log: true },
        { f: "\\sin^{2}x", fn: (x) => S(x) * S(x), cor: ["2\\sin x\\cos x", (x) => 2 * S(x) * C(x)], wr: [["2\\sin x", (x) => 2 * S(x), "MC-DERIV-CHAIN-INNER"], ["\\cos^{2}x", (x) => C(x) * C(x), "MC-DERIV-CHAIN-FUNC-SWAP"], ["2\\cos x", (x) => 2 * C(x), "MC-DERIV-CHAIN-INNER"]] },
        { f: "e^{x^{2}}", fn: (x) => E(x * x), cor: ["2xe^{x^{2}}", (x) => 2 * x * E(x * x)], wr: [["e^{x^{2}}", (x) => E(x * x), "MC-DERIV-CHAIN-INNER"], ["x^{2}e^{x^{2}-1}", (x) => x * x * E(x * x - 1), "MC-DERIV-EXP-AS-POWER"], ["2xe^{x}", (x) => 2 * x * E(x), "MC-DERIV-CHAIN-EXP-DROP"]] },
        { f: "\\dfrac{\\log x}{x}", fn: (x) => ln(x) / x, cor: ["\\dfrac{1-\\log x}{x^{2}}", (x) => (1 - ln(x)) / (x * x)], wr: [["\\dfrac{\\log x-1}{x^{2}}", (x) => (ln(x) - 1) / (x * x), "MC-DERIV-QUOTIENT-ORDER"], ["\\dfrac{1-\\log x}{x}", (x) => (1 - ln(x)) / x, "MC-DERIV-QUOTIENT-SQUARE"], ["\\dfrac{1}{x^{2}}", (x) => 1 / (x * x), "MC-DERIV-QUOTIENT-SEPARATE"]], log: true },
      ];
      const e = r.pick(lv === 1 ? L1 : lv === 2 ? L2 : L3);
      // 本当の導関数と、正解の式が一致していることを確かめる
      for (const x of pts) nearly(numDeriv(e.fn, x), e.cor[1](x), "導関数の検算", 1e-6);
      const wrongs = numericLabels(e.fn, e.wr.map(([tex, fn, mc]) => [tex, fn, mc]), pts);
      return choice({
        q: `関数 $f(x)=${e.f}$ の導関数 $f'(x)$ はどれですか。${e.log ? "（$\\log$ は自然対数）" : ""}`,
        correct: $(e.cor[0]),
        wrongs,
        explain: `$f(x)=${e.f}$ の導関数は $f'(x)=${e.cor[0]}$。（公式：$(\\sin x)'=\\cos x$、$(\\cos x)'=-\\sin x$、$(\\tan x)'=\\dfrac{1}{\\cos^{2}x}$、$(e^{x})'=e^{x}$、$(a^{x})'=a^{x}\\log a$、$(\\log x)'=\\dfrac1x$。中に別の関数が入っているときは、その微分をかけ、積や商は積・商の微分の公式を使う）`,
      });
    }),

    t(
      "fields",
      (r, lv) => {
        // f を微分した式の係数を答える
        const A = r.nz(-4, 4);
        const C0 = r.nz(-4, 4);
        const B = lv === 1 ? 1 : r.pick([2, 3, -1, -2]);
        const D = lv === 1 ? 1 : r.pick([2, 3, 4]);
        const kind = lv === 3 ? "log" : r.pick(["sin", "cos"]);
        const E = Math.exp;
        if (kind === "sin") {
          const f = (x) => A * E(B * x) + C0 * Math.sin(D * x);
          const g = (x) => A * B * E(B * x) + C0 * D * Math.cos(D * x);
          for (const x of [0.4, -0.9]) nearly(numDeriv(f, x), g(x), "導関数の検算", 1e-6);
          return fields({
            q: `$f(x)=${sumTex([[A, expTex(B)], [C0, `\\sin ${kx(D)}`]])}$ の導関数は $f'(x)=p\\,${expTex(B)}+q\\cos ${kx(D)}$ の形に表せます。$p$、$q$ の値を求めなさい。`,
            fields: [
              { id: "p", value: A * B, pre: "$p=$" },
              { id: "q", value: C0 * D, pre: "$q=$" },
            ],
            wrongs: [{ values: { p: A, q: C0 }, mc: "MC-DERIV-CHAIN-INNER" }, { values: { p: A * B, q: -C0 * D }, mc: "MC-DERIV-SIN-SIGN" }, { values: { p: A, q: C0 * D }, mc: "MC-DERIV-CHAIN-INNER" }],
            explain: `$(e^{${kx(B)}})'=${dexp(B)}$、$(\\sin ${kx(D)})'=${co(D)}\\cos ${kx(D)}$ なので $f'(x)=${sumTex([[A * B, expTex(B)], [C0 * D, `\\cos ${kx(D)}`]])}$。よって $p=${A * B}$、$q=${C0 * D}$。${lv === 1 ? "" : "（中の関数の微分（$x$ の係数）をかけるのを忘れない）"}`,
          });
        }
        if (kind === "cos") {
          const f = (x) => A * E(B * x) + C0 * Math.cos(D * x);
          const g = (x) => A * B * E(B * x) - C0 * D * Math.sin(D * x);
          for (const x of [0.4, -0.9]) nearly(numDeriv(f, x), g(x), "導関数の検算", 1e-6);
          return fields({
            q: `$f(x)=${sumTex([[A, expTex(B)], [C0, `\\cos ${kx(D)}`]])}$ の導関数は $f'(x)=p\\,${expTex(B)}+q\\sin ${kx(D)}$ の形に表せます。$p$、$q$ の値を求めなさい。`,
            fields: [
              { id: "p", value: A * B, pre: "$p=$" },
              { id: "q", value: -C0 * D, pre: "$q=$" },
            ],
            wrongs: [{ values: { p: A * B, q: C0 * D }, mc: "MC-DERIV-COS-SIGN" }, { values: { p: A, q: -C0 }, mc: "MC-DERIV-CHAIN-INNER" }, { values: { p: A, q: C0 * D }, mc: "MC-DERIV-COS-SIGN" }],
            explain: `$(e^{${kx(B)}})'=${dexp(B)}$、$(\\cos ${kx(D)})'=-${co(D)}\\sin ${kx(D)}$ なので $f'(x)=${sumTex([[A * B, expTex(B)], [-C0 * D, `\\sin ${kx(D)}`]])}$。よって $p=${A * B}$、$q=${-C0 * D}$。（$\\cos$ を微分すると符号が変わる）`,
          });
        }
        const f = (x) => A * E(B * x) + C0 * Math.log(D * x + 1);
        const g = (x) => A * B * E(B * x) + (C0 * D) / (D * x + 1);
        for (const x of [0.4, 1.3]) nearly(numDeriv(f, x), g(x), "導関数の検算", 1e-6);
        return fields({
          q: `$f(x)=${sumTex([[A, expTex(B)], [C0, `\\log(${kx(D)}+1)`]])}$ の導関数は $f'(x)=p\\,${expTex(B)}+\\dfrac{q}{${kx(D)}+1}$ の形に表せます。$p$、$q$ の値を求めなさい。（$\\log$ は自然対数）`,
          fields: [
            { id: "p", value: A * B, pre: "$p=$" },
            { id: "q", value: C0 * D, pre: "$q=$" },
          ],
          wrongs: [{ values: { p: A, q: C0 }, mc: "MC-DERIV-CHAIN-INNER" }, { values: { p: A * B, q: C0 }, mc: "MC-DERIV-CHAIN-INNER" }, { values: { p: A, q: C0 * D }, mc: "MC-DERIV-CHAIN-INNER" }],
          explain: `$(e^{${kx(B)}})'=${dexp(B)}$、$\\{\\log(${kx(D)}+1)\\}'=\\dfrac{${D}}{${kx(D)}+1}$（中の関数の微分 $${D}$ が分子に出る）。$f'(x)=${sumTex([[A * B, expTex(B)]])}${C0 * D < 0 ? "-" : "+"}\\dfrac{${Math.abs(C0 * D)}}{${kx(D)}+1}$。よって $p=${A * B}$、$q=${C0 * D}$。`,
        });
      },
      { id: "b", db: 0.15 },
    ),

    t(
      "num",
      (r, lv) => {
        // 値が有理数になる点での微分係数
        const E = Math.exp;
        const S = Math.sin;
        const C = Math.cos;
        const T = Math.tan;
        const kinds = lv === 1 ? ["expPoly", "expSin"] : lv === 2 ? ["logPoly", "tanPi", "sinSq", "cosPi"] : ["expQuot", "logProd"];
        const kind = r.pick(kinds);
        if (kind === "expPoly") {
          // (ax²+bx+c)e^{kx} の x=0 での微分係数 = b + kc
          const [a, b, c, k] = until(
            () => [r.int(-3, 3), r.int(-4, 4), r.nz(-4, 4), r.pick([1, 2, 3, -1, -2])],
            ([, bb, cc, kk]) => bb + kk * cc !== 0,
          );
          const g = poly([[a, 2], [b, 1], [c, 0]]);
          const F = (x) => (a * x * x + b * x + c) * E(k * x);
          const ans = b + k * c;
          nearly(numDeriv(F, 0), ans, "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=(${px(g)})e^{${kx(k)}}$ のとき、$f'(0)$ の値を求めなさい。`,
            ans,
            wrongs: [[b, "MC-DERIV-PRODUCT-SEPARATE"], [c, "MC-DERIV-EVAL-INSTEAD"], [b + c, "MC-DERIV-CHAIN-INNER"], [k * c, "MC-DERIV-PRODUCT-FIRST"]],
            explain: `積の微分 $f'(x)=(${px(polyDeriv(g))})e^{${kx(k)}}+(${px(g)})\\cdot(${dexp(k)})$（$e^{${kx(k)}}$ の微分は $${dexp(k)}$）。$x=0$ を代入し $e^{0}=1$ を使うと $f'(0)=${b}+${tp(c)}\\times ${tp(k)}=${ans}$。`,
          });
        }
        if (kind === "expSin") {
          // e^{kx} sin(mx) の x=0 での微分係数 = m
          const k = r.pick([1, 2, -1, -2]);
          const m = r.pick([2, 3, 4, -2]);
          const F = (x) => E(k * x) * S(m * x);
          nearly(numDeriv(F, 0), m, "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=e^{${kx(k)}}\\sin ${kx(m)}$ のとき、$f'(0)$ の値を求めなさい。`,
            ans: m,
            wrongs: [[k, "MC-DERIV-PRODUCT-FIRST"], [k + m, "MC-DERIV-PRODUCT-SEPARATE"], [k * m, "MC-DERIV-PRODUCT-SEPARATE"], [1, "MC-DERIV-EVAL-INSTEAD"]],
            explain: `積の微分 $f'(x)=(${dexp(k)})\\sin ${kx(m)}+e^{${kx(k)}}\\cdot ${co(m)}\\cos ${kx(m)}$。$x=0$ で $e^{0}=1$、$\\sin 0=0$、$\\cos 0=1$ なので $f'(0)=${tp(k)}\\times 1\\times 0+1\\times ${tp(m)}\\times 1=${m}$。`,
          });
        }
        if (kind === "logPoly") {
          // log(g(x)) の x0 での微分係数 = g'(x0)/g(x0)
          const g = poly([[r.pick([1, 2]), 2], [r.int(-3, 3), 1], [r.int(1, 5), 0]]);
          const x0 = until(() => r.int(-2, 3), (x) => qnum(at(g, Q(x))) > 0 && !eq(at(polyDeriv(g), Q(x)), Q(0)));
          const g0 = at(g, Q(x0));
          const d0 = at(polyDeriv(g), Q(x0));
          const ans = div(d0, g0);
          const F = (x) => Math.log(polyFn(g)(x));
          nearly(numDeriv(F, x0), qnum(ans), "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=\\log(${px(g)})$ のとき、$f'(${x0})$ の値を求めなさい。（$\\log$ は自然対数）`,
            ans,
            reduced: true,
            wrongs: [[div(Q(1), g0), "MC-DERIV-CHAIN-INNER"], [d0, "MC-DERIV-LOG-KEEP"], [div(g0, d0), "MC-DERIV-LOG-INVERT"]],
            explain: `$\\{\\log g(x)\\}'=\\dfrac{g'(x)}{g(x)}$。$g(x)=${px(g)}$、$g'(x)=${px(polyDeriv(g))}$。$x=${x0}$ で $g=${tq(g0)}$、$g'=${tq(d0)}$ なので $f'(${x0})=\\dfrac{${tq(d0)}}{${tq(g0)}}$${g0.n === 1 || gcd(d0.n, g0.n) > 1 ? `$=${tq(ans)}$` : ""}。（分子は中の関数の微分）`,
          });
        }
        if (kind === "tanPi") {
          // tan(kx) の x=π/(4k) での微分係数 = 2k
          const k = r.pick([1, 2, 3]);
          const x0 = Math.PI / (4 * k);
          nearly(numDeriv((x) => T(k * x), x0), 2 * k, "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=\\tan ${kx(k)}$ のとき、$f'\\!\\left(\\dfrac{\\pi}{${4 * k}}\\right)$ の値を求めなさい。`,
            ans: 2 * k,
            wrongs: [[k, "MC-DERIV-TAN-POWER"], [1, "MC-DERIV-CHAIN-INNER"], [4 * k, "MC-DERIV-TAN-POWER"], [-2 * k, "MC-DERIV-TAN-SIGN"]],
            explain: `$f'(x)=\\dfrac{${k}}{\\cos^{2}${kx(k)}}$。$x=\\dfrac{\\pi}{${4 * k}}$ のとき $${kx(k)}=\\dfrac{\\pi}{4}$ で、$\\cos\\dfrac{\\pi}{4}=\\dfrac{1}{\\sqrt2}$ より $\\cos^{2}\\dfrac{\\pi}{4}=\\dfrac12$。よって $f'=\\dfrac{${k}}{\\frac12}=${2 * k}$。（中の関数の微分 $${k}$ をかける）`,
          });
        }
        if (kind === "sinSq") {
          // sin²(kx) の x=π/(4k) での微分係数 = k
          const k = r.pick([1, 2, 3]);
          const x0 = Math.PI / (4 * k);
          nearly(numDeriv((x) => S(k * x) * S(k * x), x0), k, "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=\\sin^{2}${kx(k)}$ のとき、$f'\\!\\left(\\dfrac{\\pi}{${4 * k}}\\right)$ の値を求めなさい。`,
            ans: k,
            wrongs: [[2 * k, "MC-DERIV-CHAIN-INNER"], [1, "MC-DERIV-CHAIN-INNER"], [k / 2 === Math.floor(k / 2) ? k / 2 : 0, "MC-SLIP"], [0, "MC-DERIV-CHAIN-FUNC-SWAP"]],
            explain: `$\\sin^{2}${kx(k)}=\\{\\sin ${kx(k)}\\}^{2}$ なので $f'(x)=2\\sin ${kx(k)}\\cdot ${k}\\cos ${kx(k)}=${k}\\sin ${kx(2 * k)}$（2 倍角の公式）。$x=\\dfrac{\\pi}{${4 * k}}$ で $${kx(2 * k)}=\\dfrac{\\pi}{2}$ だから $f'=${k}\\times 1=${k}$。`,
          });
        }
        if (kind === "cosPi") {
          // cos(kx) の x=π/(2k) での微分係数 = -k
          const k = r.pick([2, 3, 4, 5]);
          const x0 = Math.PI / (2 * k);
          nearly(numDeriv((x) => C(k * x), x0), -k, "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=\\cos ${kx(k)}$ のとき、$f'\\!\\left(\\dfrac{\\pi}{${2 * k}}\\right)$ の値を求めなさい。`,
            ans: -k,
            wrongs: [[k, "MC-DERIV-COS-SIGN"], [-1, "MC-DERIV-CHAIN-INNER"], [0, "MC-DERIV-EVAL-INSTEAD"], [1, "MC-DERIV-COS-SIGN"]],
            explain: `$f'(x)=-${k}\\sin ${kx(k)}$。$x=\\dfrac{\\pi}{${2 * k}}$ のとき $${kx(k)}=\\dfrac{\\pi}{2}$ で $\\sin\\dfrac{\\pi}{2}=1$ なので $f'=-${k}$。（$\\cos$ の微分は $-\\sin$、さらに中の $${k}$ もかける）`,
          });
        }
        if (kind === "expQuot") {
          // e^{kx}/(x+m) の x=0 での微分係数 = (km − 1)/m²
          const [k, m] = until(
            () => [r.pick([1, 2, 3, -1, -2]), r.pick([1, 2, 3, -1, -2])],
            ([kk, mm]) => kk * mm !== 1,
          );
          const ans = Q(k * m - 1, m * m);
          const F = (x) => E(k * x) / (x + m);
          nearly(numDeriv(F, 0), qnum(ans), "微分係数の検算", 1e-6);
          return num({
            q: `$f(x)=\\dfrac{e^{${kx(k)}}}{x${m > 0 ? "+" : ""}${m}}$ のとき、$f'(0)$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(1 - k * m, m * m), "MC-DERIV-QUOTIENT-ORDER"], [Q(k * m - 1, m), "MC-DERIV-QUOTIENT-SQUARE"], [Q(k, 1), "MC-DERIV-QUOTIENT-SEPARATE"], [Q(k * m, m * m), "MC-DERIV-CHAIN-INNER"]],
            explain: `商の微分 $f'(x)=\\dfrac{(${dexp(k)})(x${m > 0 ? "+" : ""}${m})-e^{${kx(k)}}\\cdot 1}{(x${m > 0 ? "+" : ""}${m})^{2}}$。$x=0$ で $e^{0}=1$ より $f'(0)=\\dfrac{${k}\\times ${tp(m)}-1}{${tp(m)}^{2}}=${tq(ans)}$。（分子は「分子の微分 × 分母 − 分子 × 分母の微分」）`,
          });
        }
        // logProd: (x²+p) log x の x=1 での微分係数 = p + 1
        const p = until(() => r.int(-4, 5), (v) => v !== -1);
        const F = (x) => (x * x + p) * Math.log(x);
        nearly(numDeriv(F, 1), p + 1, "微分係数の検算", 1e-6);
        return num({
          q: `$f(x)=(x^{2}${p >= 0 ? "+" : ""}${p})\\log x$ のとき、$f'(1)$ の値を求めなさい。（$\\log$ は自然対数）`,
          ans: p + 1,
          wrongs: [[2, "MC-DERIV-PRODUCT-FIRST"], [1, "MC-DERIV-PRODUCT-SEPARATE"], [p, "MC-DERIV-PRODUCT-FIRST"], [p - 1, "MC-DERIV-PRODUCT-SIGN"]],
          explain: `積の微分 $f'(x)=2x\\log x+(x^{2}${p >= 0 ? "+" : ""}${p})\\cdot\\dfrac1x$。$x=1$ で $\\log 1=0$ より $f'(1)=2\\times 1\\times 0+(1${p >= 0 ? "+" : ""}${p})\\times 1=${p + 1}$。`,
        });
      },
      { id: "c", db: 0.15 },
    ),

    t(
      "fields",
      (r, lv) => {
        // 接線 y=mx+n（接点の値が有理数になる点で）
        const E = Math.exp;
        const kinds = lv === 1 ? ["sinCos", "expLin"] : lv === 2 ? ["expLin", "expProd", "logAt1"] : ["expProd", "logAt1"];
        const kind = r.pick(kinds);
        let stemF;
        let x0;
        let m;
        let n;
        let F;
        let how;
        if (kind === "sinCos") {
          const A = r.nz(-3, 3);
          const B = r.nz(-3, 3);
          const k = r.pick([1, 2, 3]);
          x0 = 0;
          m = A * k;
          n = B;
          F = (x) => A * Math.sin(k * x) + B * Math.cos(x);
          stemF = sumTex([[A, `\\sin ${kx(k)}`], [B, "\\cos x"]]);
          how = `$f'(x)=${sumTex([[A * k, `\\cos ${kx(k)}`], [-B, "\\sin x"]])}$。$f(0)=${B}$、$f'(0)=${m}$。接線は $y-${tp(B)}=${tp(m)}(x-0)$ より $y=${lineTex(m, n)}$。`;
        } else if (kind === "expLin") {
          const k = r.pick([1, 2, 3, -1, -2]);
          const a = r.nz(-3, 3);
          const b = r.int(-4, 4);
          x0 = 0;
          m = k + b;
          n = 1;
          F = (x) => E(k * x) + a * x * x + b * x;
          stemF = sumTex([[1, expTex(k)], [a, "x^{2}"], [b, "x"]]);
          how = `$f'(x)=${sumTex([[k, expTex(k)], [2 * a, "x"], [b, ""]])}$。$f(0)=e^{0}=1$、$f'(0)=${k}+${tp(b)}=${m}$。接線は $y-1=${tp(m)}x$ より $y=${lineTex(m, n)}$。`;
        } else if (kind === "expProd") {
          const a = r.nz(-3, 3);
          const b = r.nz(-3, 3);
          const k = r.pick([1, 2, -1]);
          x0 = 0;
          m = a + k * b;
          n = b;
          F = (x) => (a * x + b) * E(k * x);
          stemF = `(${px(P.lin(a, b))})e^{${kx(k)}}`;
          how = `積の微分 $f'(x)=${co(a)}e^{${kx(k)}}+(${px(P.lin(a, b))})\\cdot(${dexp(k)})$。$e^{0}=1$ より $f(0)=${b}$、$f'(0)=${a}+${tp(b)}\\times ${tp(k)}=${m}$。接線は $y-${tp(b)}=${tp(m)}x$ より $y=${lineTex(m, n)}$。`;
        } else {
          // log(ax+b): 真数が 1 になる点 x0
          const a = r.nz(-3, 3);
          x0 = r.pick([1, 2, 3, -1, -2]);
          const b = 1 - a * x0;
          m = a;
          n = -a * x0;
          const dom = (x) => a * x + b;
          F = (x) => Math.log(dom(x));
          stemF = `\\log(${px(P.lin(a, b))})`;
          how = `$f'(x)=\\dfrac{${a}}{${px(P.lin(a, b))}}$。$x=${x0}$ で真数は $${a}\\times ${tp(x0)}+${tp(b)}=1$ なので $f(${x0})=\\log 1=0$、$f'(${x0})=${a}$。接線は $y-0=${tp(a)}(x-${tp(x0)})$ より $y=${lineTex(m, n)}$。`;
        }
        nearly(numDeriv(F, x0), m, "傾きの検算", 1e-6);
        nearly(F(x0), m * x0 + n, "接線が接点を通る", 1e-6); // 接線 y=mx+n が点 (x0, f(x0)) を通る
        return fields({
          q: `曲線 $y=${stemF}$ 上の $x=${x0}$ の点における接線の方程式を $y=mx+n$ と表すとき、$m$、$n$ の値を求めなさい。${kind === "logAt1" ? "（$\\log$ は自然対数）" : ""}`,
          fields: [
            { id: "m", value: m, pre: "$m=$" },
            { id: "n", value: n, pre: "$n=$" },
          ],
          wrongs: [{ values: { m, n: -n }, mc: "MC-TANGENT-INTERCEPT-SIGN" }, { values: { m: n, n: m }, mc: "MC-TANGENT-SLOPE-VALUE" }, { values: { m, n: n === 0 ? 1 : 0 }, mc: "MC-TANGENT-INTERCEPT" }],
          explain: how,
        });
      },
      { id: "d", db: 0.3 },
    ),

    t(
      "num",
      (r, lv) => {
        // 増減が入れかわる点の x 座標（x の値が有理数になるもの）
        const E = Math.exp;
        const kinds = lv === 1 ? ["axLog", "xExp"] : lv === 2 ? ["axLog", "sqLog", "xExp"] : ["sqLog", "xSqExp", "xExp"];
        const kind = r.pick(kinds);
        if (kind === "axLog") {
          // f = a x − log x（x>0）: f' = a − 1/x → x = 1/a
          const a = r.int(2, 6);
          const F = (x) => a * x - Math.log(x);
          nearly(numDeriv(F, 1 / a), 0, "極値の検算", 1e-6);
          assert(F(1 / a - 0.05) > F(1 / a) && F(1 / a + 0.05) > F(1 / a), "極小の検算");
          return num({
            q: `$x>0$ で定義された関数 $f(x)=${a}x-\\log x$ が最小になる $x$ の値を求めなさい。（$\\log$ は自然対数）`,
            ans: Q(1, a),
            reduced: true,
            wrongs: [[a, "MC-EXTREMA-INVERT"], [Q(1), "MC-EXTREMA-XVALUE"], [Q(-1, a), "MC-SLIP"], [neg(Q(a)), "MC-SLIP"]],
            explain: `$f'(x)=${a}-\\dfrac1x$。$f'(x)=0$ より $x=\\dfrac1{${a}}$。$0<x<\\dfrac1{${a}}$ では $f'<0$、$x>\\dfrac1{${a}}$ では $f'>0$ なので、$x=\\dfrac1{${a}}$ で最小になります。`,
          });
        }
        if (kind === "sqLog") {
          // f = x² − 2s² log x（x>0）: f' = 2x − 2s²/x → x = s
          const s = r.int(1, 4);
          const F = (x) => x * x - 2 * s * s * Math.log(x);
          nearly(numDeriv(F, s), 0, "極値の検算", 1e-6);
          assert(F(s - 0.05) > F(s) && F(s + 0.05) > F(s), "極小の検算");
          return num({
            q: `$x>0$ で定義された関数 $f(x)=x^{2}-${2 * s * s}\\log x$ が最小になる $x$ の値を求めなさい。（$\\log$ は自然対数）`,
            ans: s,
            wrongs: [[s * s, "MC-EXTREMA-SQRT-FORGET"], [2 * s, "MC-SLIP"], [-s, "MC-EXTREMA-DOMAIN"], [1, "MC-SLIP"]],
            explain: `$f'(x)=2x-\\dfrac{${2 * s * s}}{x}=\\dfrac{2(x^{2}-${s * s})}{x}$。$x>0$ で $f'(x)=0$ になるのは $x=${s}$（$x=-${s}$ は定義域外）。$x=${s}$ の前後で $f'$ は負から正に変わるので最小です。`,
          });
        }
        if (kind === "xExp") {
          // f = x e^{-kx}: f' = (1−kx)e^{-kx} → x = 1/k で最大
          const k = r.int(2, 5);
          const F = (x) => x * E(-k * x);
          nearly(numDeriv(F, 1 / k), 0, "極値の検算", 1e-6);
          assert(F(1 / k - 0.05) < F(1 / k) && F(1 / k + 0.05) < F(1 / k), "極大の検算");
          return num({
            q: `関数 $f(x)=xe^{-${k}x}$ が最大になる $x$ の値を求めなさい。`,
            ans: Q(1, k),
            reduced: true,
            wrongs: [[k, "MC-EXTREMA-INVERT"], [Q(-1, k), "MC-SLIP"], [Q(1), "MC-EXTREMA-XVALUE"], [0, "MC-DERIV-EVAL-INSTEAD"]],
            explain: `積の微分と合成関数の微分より $f'(x)=e^{-${k}x}+x\\cdot(-${k})e^{-${k}x}=(1-${k}x)e^{-${k}x}$。$e^{-${k}x}>0$ なので、$f'(x)=0$ となるのは $1-${k}x=0$、$x=\\dfrac1{${k}}$。この前後で $f'$ は正から負に変わるので最大です。`,
          });
        }
        // xSqExp: f = x² e^{-x}: f' = x(2−x)e^{-x} → x=2 で極大（x=0 で極小）
        const F = (x) => x * x * E(-x);
        nearly(numDeriv(F, 2), 0, "極値の検算", 1e-6);
        return num({
          q: `関数 $f(x)=x^{2}e^{-x}$ が極大になる $x$ の値を求めなさい。`,
          ans: 2,
          wrongs: [[0, "MC-EXTREMA-MAXMIN-SWAP"], [1, "MC-SLIP"], [4, "MC-EXTREMA-XVALUE"], [-2, "MC-SLIP"]],
          explain: `積の微分と合成関数の微分より $f'(x)=2xe^{-x}-x^{2}e^{-x}=x(2-x)e^{-x}$。$e^{-x}>0$ なので符号は $x(2-x)$ で決まり、$x<0$ で負、$0<x<2$ で正、$x>2$ で負。$x=0$ では負から正なので極小、$x=2$ では正から負なので極大です。`,
        });
      },
      { id: "e", db: 0.35 },
    ),
  ],
};
