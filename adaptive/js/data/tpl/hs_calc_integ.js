// ============================================================
// tpl/hs_calc_integ.js — 高校 積分（数II・数III）
//   integ_basic / integ_area / integ_adv
//
//  すべて自作の数値・言い回し。定積分・面積はシンプソン則の数値積分でも確かめ、
//  不定積分の候補は「微分してもとの関数にもどるか」を数値微分で確かめている。
//  ※ $\log$ は底が e の自然対数として出題する。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, cmp, num as qnum, pow as qpow } from "../../core/rational.js";
import { tq, tp, ts as tsign } from "../../core/tex.js";
import { P, Poly } from "../../core/poly.js";
import { coordPlane } from "./fig.js";
import { t, until, assert } from "./util.js";
import { numInteg, numDeriv, nearly, polyDeriv, polyIntegral, polyFn, defInteg, coeffsOf } from "./hs_util.js";
import { $, px, poly, at, checkDeriv } from "./hs_calc_deriv.js";

/** ∫_lo^hi 本体 dx の TeX */
const intTex = (body, lo, hi) => `\\displaystyle\\int_{${lo}}^{${hi}}${body}\\,dx`;
/** 係数の TeX（1 は省き、-1 は "-"） */
const co = (k) => (k === 1 ? "" : k === -1 ? "-" : String(k));
/** 因数 (x − a) の TeX */
const fac = (a) => (a === 0 ? "x" : a < 0 ? `(x+${-a})` : `(x-${a})`);
const absQ = (q) => (q.n < 0 ? neg(q) : q);
/** 変数を t にした多項式の TeX（積分変数 t の被積分関数を書くため） */
const inT = (p) => Poly.fromCoeffs(coeffsOf(p, p.degree()), "t").toTeX({ order: ["t"] });

/**
 * 面積の図。曲線 curves=[{fn,label?}] を描き、x0〜x1 で 2 曲線にはさまれた部分（上端 hi・下端 lo）を塗る。
 * 図の枠は、曲線の値の範囲から整数で決める。
 */
function areaFigure({ curves, x0, x1, hi, lo }) {
  const xmin = Math.floor(Math.min(x0, 0)) - 1;
  const xmax = Math.ceil(Math.max(x1, 0)) + 1;
  let ymin = 0;
  let ymax = 0;
  for (const c of curves) {
    for (let i = 0; i <= 200; i++) {
      const y = c.fn(x0 + ((x1 - x0) * i) / 200);
      ymin = Math.min(ymin, y);
      ymax = Math.max(ymax, y);
    }
  }
  ymin = Math.floor(ymin) - 1;
  ymax = Math.ceil(ymax) + 1;
  const span = Math.max(xmax - xmin, ymax - ymin);
  const cell = Math.max(11, Math.min(28, Math.floor(320 / span)));
  const tick = span <= 14 ? 1 : span <= 28 ? 2 : 5;
  return coordPlane({
    x: [xmin, xmax],
    y: [ymin, ymax],
    cell,
    tick,
    curves: curves.map((c, i) => ({ fn: c.fn, color: i === 0 ? "#2b6cb0" : "#c0392b", label: c.label, lx: c.lx, ly: c.ly })),
    fills: [{ x0, x1, hi, lo }],
  });
}

export default {
  // ── 不定積分・定積分 ──────────────────────────
  integ_basic: [
    t("fields", (r, lv) => {
      // 不定積分の係数
      let f;
      let fx;
      if (lv === 1) {
        f = poly([[3 * r.nz(-4, 4), 2], [2 * r.nz(-4, 4), 1], [r.nz(-6, 6), 0]]);
        fx = px(f);
      } else if (lv === 2) {
        f = poly([[r.nz(-6, 6), 2], [r.nz(-6, 6), 1], [r.nz(-6, 6), 0]]);
        fx = px(f);
      } else if (r.chance(0.5)) {
        const g = P.lin(1, r.nz(-4, 4));
        const h = P.lin(r.pick([1, 2, 3]), r.nz(-4, 4));
        f = g.mul(h);
        fx = `(${px(g)})(${px(h)})`;
      } else {
        const g = P.lin(r.pick([2, 3, -1, -2]), r.nz(-3, 3));
        f = g.pow(2);
        fx = `(${px(g)})^{2}`;
      }
      const F = polyIntegral(f);
      checkDeriv(F, f); // F を微分すると f にもどる
      const [a2, a1, a0] = [2, 1, 0].map((k) => f.coeff(k));
      return fields({
        q: `$\\displaystyle\\int ${lv === 3 ? fx : `(${fx})`}\\,dx=px^{3}+qx^{2}+rx+C$ が成り立つとき、$p$、$q$、$r$ の値を求めなさい。（$C$ は積分定数）`,
        fields: [
          { id: "p", value: F.coeff(3), pre: "$p=$" },
          { id: "q", value: F.coeff(2), pre: "$q=$" },
          { id: "r", value: F.coeff(1), pre: "$r=$" },
        ],
        wrongs: [
          { values: { p: a2, q: a1, r: a0 }, mc: "MC-INTEG-NO-DIV" },
          { values: { p: 0, q: mul(a2, Q(2)), r: a1 }, mc: "MC-INTEG-DERIV" },
          { values: { p: div(a2, Q(2)), q: a1, r: a0 }, mc: "MC-INTEG-DIV-N" },
        ],
        explain: `${lv === 3 ? `展開すると $${px(f)}$。` : ""}$\\displaystyle\\int x^{n}dx=\\dfrac{x^{n+1}}{n+1}+C$ を各項に使います。$${px(f)}$ の積分は $${px(F)}+C$。よって $p=${tq(F.coeff(3))}$、$q=${tq(F.coeff(2))}$、$r=${tq(F.coeff(1))}$。（指数を 1 増やして、その新しい指数でわる）`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        // 定積分
        let f;
        let fx;
        let a;
        let b;
        if (lv === 1) {
          f = poly([[r.nz(-3, 3), 2], [r.int(-4, 4), 1], [r.int(-5, 5), 0]]);
          fx = px(f);
          a = 0;
          b = r.int(1, 3);
        } else if (lv === 2) {
          f = poly([[r.nz(-3, 3), 3], [r.int(-3, 3), 2], [r.int(-4, 4), 1], [r.int(-5, 5), 0]]);
          fx = px(f);
          a = r.int(-2, 0);
          b = a + r.int(1, 3);
        } else {
          const g = P.lin(1, r.nz(-3, 3));
          const h = P.lin(r.pick([1, 2, 3]), r.nz(-3, 3));
          f = g.mul(h);
          fx = `(${px(g)})(${px(h)})`;
          a = r.int(-3, 0);
          b = a + r.int(2, 4);
        }
        const F = polyIntegral(f);
        const ans = defInteg(f, Q(a), Q(b));
        nearly(numInteg(polyFn(f), a, b), qnum(ans), "定積分の検算", 1e-7);
        const Fa = at(F, Q(a));
        const Fb = at(F, Q(b));
        // 割らずに指数だけ 1 増やした「積分もどき」
        const noDiv = poly([...f.t.values()].map((tm) => [tm.c, (tm.e.x || 0) + 1]));
        return num({
          q: `$${intTex(lv === 3 ? fx : `(${fx})`, a, b)}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Fb, "MC-INTEG-DEF-UPPER-ONLY"], [sub(Fa, Fb), "MC-INTEG-DEF-REVERSE"], [add(Fa, Fb), "MC-INTEG-DEF-ADD"], [defInteg(noDiv, Q(a), Q(b)), "MC-INTEG-NO-DIV"]],
          explain: `${lv === 3 ? `展開すると $${px(f)}$。` : ""}原始関数は $F(x)=${px(F)}$。$\\displaystyle\\int_{${a}}^{${b}}f(x)\\,dx=F(${b})-F(${a})=${tq(Fb)}-${tp(Fa)}=${tq(ans)}$。（上端の値から下端の値をひく）`,
        });
      },
      { id: "b", db: 0 },
    ),

    t(
      "num",
      (r, lv) => {
        // F'(x)=f(x), F(x0)=y0 → F(x1)
        const f = lv === 1 ? poly([[3 * r.nz(-2, 2), 2], [2 * r.nz(-3, 3), 1], [r.int(-4, 4), 0]]) : poly([[r.nz(-4, 4), 3], [r.nz(-5, 5), 2], [r.nz(-6, 6), 1], [r.int(-5, 5), 0]]);
        const x0 = r.int(-2, 1);
        const x1 = x0 + r.int(1, 3);
        const y0 = r.int(-6, 6);
        const Fp = polyIntegral(f);
        const C = sub(Q(y0), at(Fp, Q(x0)));
        const ans = add(at(Fp, Q(x1)), C);
        // 別の経路：y0 に、x0 から x1 までの定積分をたす
        assert(eq(ans, add(Q(y0), defInteg(f, Q(x0), Q(x1)))), "初期条件つきの検算");
        nearly(qnum(ans), y0 + numInteg(polyFn(f), x0, x1), "初期条件つきの数値検算", 1e-7);
        const withoutC = at(Fp, Q(x1));
        return num({
          q: `関数 $F(x)$ は $F'(x)=${px(f)}$ をみたし、$F(${x0})=${y0}$ です。$F(${x1})$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[withoutC, "MC-INTEG-NO-C"], [defInteg(f, Q(x0), Q(x1)), "MC-INTEG-INITIAL-IGNORE"], [sub(withoutC, C), "MC-SLIP"]],
          explain: `$F(x)=\\displaystyle\\int (${px(f)})\\,dx=${px(Fp)}+C$。$F(${x0})=${y0}$ より $C=${y0}-(${tq(at(Fp, Q(x0)))})=${tq(C)}$。よって $F(${x1})=${tq(withoutC)}${tsign(C)}=${tq(ans)}$。（積分定数 $C$ は初期条件で決める）`,
        });
      },
      { id: "c", db: 0.15 },
    ),

    t(
      "num",
      (r, lv) => {
        // 絶対値を含む定積分
        if (lv === 1) {
          const a = r.int(1, 4);
          const b = r.int(1, 4);
          const ans = Q(a * a + b * b, 2);
          nearly(numInteg((x) => Math.abs(x), -a, b, 20000), qnum(ans), "絶対値の積分の検算", 1e-6);
          return num({
            q: `$${intTex("|x|", -a, b)}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(b * b - a * a, 2), "MC-INTEG-ABS-IGNORE"], [Q(a * a + b * b), "MC-AREA-TRI-HALF"], [Q(Math.max(a, b) ** 2, 2), "MC-INTEG-ABS-ONE-SIDE"]],
            explain: `$x<0$ では $|x|=-x$、$x\\ge 0$ では $|x|=x$ なので、$x=0$ で区切って $\\displaystyle\\int_{-${a}}^{0}(-x)\\,dx+\\int_{0}^{${b}}x\\,dx=\\dfrac{${a * a}}{2}+\\dfrac{${b * b}}{2}=${tq(ans)}$。（グラフは V 字形。左右の三角形の面積の和）`,
          });
        }
        if (lv === 2) {
          const c = r.int(-1, 2);
          const a = c - r.int(1, 3);
          const b = c + r.int(1, 3);
          const ans = Q((c - a) ** 2 + (b - c) ** 2, 2);
          nearly(numInteg((x) => Math.abs(x - c), a, b, 20000), qnum(ans), "絶対値の積分の検算", 1e-6);
          return num({
            q: `$${intTex(`|${c === 0 ? "x" : c < 0 ? `x+${-c}` : `x-${c}`}|`, a, b)}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q((b - c) ** 2 - (c - a) ** 2, 2), "MC-INTEG-ABS-IGNORE"], [Q((b - a) ** 2, 2), "MC-INTEG-ABS-IGNORE"], [Q((c - a) ** 2 + (b - c) ** 2), "MC-AREA-TRI-HALF"]],
            explain: `中身が 0 になる $x=${c}$ で区切ります。$x<${c}$ では絶対値がはずれて符号が変わります。$\\displaystyle\\int_{${a}}^{${c}}\\{-(x${c >= 0 ? "-" : "+"}${Math.abs(c)})\\}dx+\\int_{${c}}^{${b}}(x${c >= 0 ? "-" : "+"}${Math.abs(c)})\\,dx=\\dfrac{${(c - a) ** 2}}{2}+\\dfrac{${(b - c) ** 2}}{2}=${tq(ans)}$。`,
          });
        }
        // 2 次式の絶対値：|(x−p)(x−q)|
        const [p, q0] = until(
          () => [r.int(-2, 2), r.int(0, 4)],
          ([u, v]) => v > u,
        );
        const d = P.lin(1, -p).mul(P.lin(1, -q0));
        const [a, b] = [p - r.int(0, 2), q0 + r.int(0, 2)];
        const cuts = [a, p, q0, b].filter((v, i, arr) => i === 0 || v !== arr[i - 1]);
        let ans = Q(0);
        for (let i = 0; i + 1 < cuts.length; i++) ans = add(ans, absQ(defInteg(d, Q(cuts[i]), Q(cuts[i + 1]))));
        nearly(numInteg((x) => Math.abs(polyFn(d)(x)), a, b, 20000), qnum(ans), "絶対値の積分の検算", 1e-6);
        return num({
          q: `$${intTex(`|${px(d)}|`, a, b)}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[defInteg(d, Q(a), Q(b)), "MC-INTEG-ABS-IGNORE"], [absQ(defInteg(d, Q(a), Q(b))), "MC-INTEG-ABS-IGNORE"], [absQ(defInteg(d, Q(p), Q(q0))), "MC-INTEG-ABS-ONE-SIDE"]],
          explain: `$${px(d)}=${fac(p)}${fac(q0)}$ なので、$x=${p}$ と $x=${q0}$ の前後で符号が変わります。符号が変わる点 $x=${cuts.slice(1, -1).join(",\\ ")}$ で区切り、負の部分は符号を入れかえて（絶対値をつけて）積分します：${cuts
            .slice(0, -1)
            .map((c0, i) => `$\\left|\\int_{${c0}}^{${cuts[i + 1]}}\\right|=${tq(absQ(defInteg(d, Q(c0), Q(cuts[i + 1]))))}$`)
            .join("、")}。合計 $${tq(ans)}$。（区切らずに積分すると、正負が打ち消し合ってしまう）`,
        });
      },
      { id: "d", db: 0.3 },
    ),

    t(
      "num",
      (r, lv) => {
        // 定積分で表された関数：f(x)=ax²+bx+k∫_0^1 f(t)dt
        const k = r.pick([2, 3, -1, -2]);
        const c = r.nz(-3, 3); // ∫_0^1 f(t)dt の値
        const al = r.int(-3, 3);
        const be = c * (1 - k) - al; // a/3 + b/2 = c(1−k)
        const A = 3 * al;
        const B = 2 * be;
        const f = poly([[A, 2], [B, 1], [k * c, 0]]);
        // f を定積分して c にもどるか確かめる
        assert(eq(defInteg(f, Q(0), Q(1)), Q(c)), "定積分の値の検算");
        nearly(numInteg(polyFn(f), 0, 1), c, "定積分の数値検算", 1e-7);
        const askAt = lv === 3 ? r.pick([0, 1, 2]) : r.pick([0, 1]);
        const ans = at(f, Q(askAt));
        const kc = `${k >= 0 ? "+" : "-"}${Math.abs(k) === 1 ? "" : Math.abs(k)}c`; // 「+kc」の項
        const stem = `${px(poly([[A, 2], [B, 1]]))}${k >= 0 ? "+" : "-"}${Math.abs(k) === 1 ? "" : Math.abs(k)}\\displaystyle\\int_{0}^{1}f(t)\\,dt`;
        return num({
          q: `関数 $f(x)$ が $f(x)=${stem}$ をみたすとき、$f(${askAt})$ の値を求めなさい。`,
          ans,
          wrongs: [[c, "MC-INTEG-CONST-EQ"], [k * c, "MC-INTEG-CONST-EQ"], [at(poly([[A, 2], [B, 1]]), Q(askAt)), "MC-INTEG-CONST-DROP"]],
          explain: `$\\displaystyle\\int_{0}^{1}f(t)\\,dt$ は定数なので $c$ とおくと $f(x)=${px(poly([[A, 2], [B, 1]]))}${kc}$。$c=\\displaystyle\\int_{0}^{1}f(t)\\,dt=\\dfrac{${A}}{3}+\\dfrac{${B}}{2}${kc}$（$\\dfrac{${A}}{3}+\\dfrac{${B}}{2}=${al + be}$）より $c(1-${tp(k)})=${al + be}$、$c=${c}$。したがって $f(x)=${px(f)}$ で、$f(${askAt})=${tq(ans)}$。`,
        });
      },
      { id: "e", db: 0.6 },
    ),

    t(
      "num",
      (r, lv) => {
        // 微分と積分の関係
        if (lv < 3) {
          const f = lv === 1 ? poly([[3 * r.nz(-2, 2), 2], [2 * r.nz(-3, 3), 1], [r.int(-4, 4), 0]]) : poly([[r.nz(-3, 3), 3], [r.int(-4, 4), 2], [r.nz(-4, 4), 1], [r.int(-5, 5), 0]]);
          const a = r.int(-2, 2);
          const x0 = r.int(-2, 3);
          const ans = at(f, Q(x0));
          // G(x)=∫_a^x f(t)dt を数値的に微分して f(x0) と比べる
          const G = (x) => numInteg(polyFn(f), a, x, 400);
          nearly(numDeriv(G, x0, 1e-2), qnum(ans), "微積分の基本定理の検算", 1e-5);
          return num({
            q: `$G(x)=\\displaystyle\\int_{${a}}^{x}(${inT(f)})\\,dt$ のとき、$G'(${x0})$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[at(polyIntegral(f), Q(x0)), "MC-INTEG-FTC-INTEGRATE"], [at(polyDeriv(f), Q(x0)), "MC-INTEG-FTC-DERIV"], [defInteg(f, Q(a), Q(x0)), "MC-INTEG-FTC-INTEGRATE"]],
            explain: `$\\dfrac{d}{dx}\\displaystyle\\int_{a}^{x}f(t)\\,dt=f(x)$ なので $G'(x)=${px(f)}$（$t$ を $x$ に書きかえたもの）。$G'(${x0})=${tq(ans)}$。（積分を実行しなくても、上端の $x$ に $${x0}$ を入れるだけ）`,
          });
        }
        // G(x)=∫_a^x (t²−s²)dt が極小になる x
        const s = r.int(1, 4);
        const a = r.int(-2, 2);
        const f = poly([[1, 2], [-s * s, 0]]);
        const G = (x) => numInteg(polyFn(f), a, x, 400);
        nearly(numDeriv(G, s, 1e-2), 0, "微積分の基本定理の検算", 1e-5);
        assert(G(s - 0.3) > G(s) && G(s + 0.3) > G(s), "G が x=s で極小");
        return num({
          q: `$G(x)=\\displaystyle\\int_{${a}}^{x}(t^{2}-${s * s})\\,dt$ が極小になる $x$ の値を求めなさい。`,
          ans: s,
          wrongs: [[-s, "MC-EXTREMA-MAXMIN-SWAP"], [s * s, "MC-EXTREMA-SQRT-FORGET"], [a, "MC-INTEG-FTC-LOWER"]],
          explain: `$G'(x)=x^{2}-${s * s}=(x-${s})(x+${s})$。$G'(x)=0$ より $x=\\pm ${s}$。$x=-${s}$ の前後で $G'$ は正から負（極大）、$x=${s}$ の前後で負から正（極小）。よって極小になるのは $x=${s}$。（下端の $${a}$ は $G'(x)$ に影響しない）`,
        });
      },
      { id: "f", db: 0.3 },
    ),
  ],

  // ── 積分と面積 ────────────────────────────────
  integ_area: [
    t("num", (r, lv) => {
      // 曲線と x 軸ではさまれた（x 軸の上側の）図形の面積
      let f;
      let p;
      let q0;
      if (lv === 1) {
        if (r.chance(0.5)) {
          const s = r.int(1, 3);
          const al = r.pick([1, 2]);
          f = poly([[-al, 2], [al * s * s + r.int(0, 3), 0]]);
          [p, q0] = [-s, s];
        } else {
          f = poly([[r.pick([1, 2]), 2], [r.int(1, 4), 0]]);
          [p, q0] = [0, r.int(1, 3)];
        }
      } else {
        const gen = () => (lv === 2 ? poly([[r.nz(-2, 2), 2], [r.int(-4, 4), 1], [r.int(-2, 8), 0]]) : poly([[r.nz(-1, 1), 3], [r.int(-3, 3), 2], [r.int(-4, 4), 1], [r.int(0, 6), 0]]));
        [f, p, q0] = until(
          () => {
            const g = gen();
            const lo = r.int(-2, 1);
            return [g, lo, lo + r.int(2, 3)];
          },
          ([g, lo, hi]) => {
            const F = polyFn(g);
            for (let i = 0; i <= 60; i++) if (F(lo + ((hi - lo) * i) / 60) < 0.3) return false;
            return true;
          },
          800,
        );
      }
      const F = polyIntegral(f);
      const ans = defInteg(f, Q(p), Q(q0));
      nearly(numInteg(polyFn(f), p, q0), qnum(ans), "面積の検算", 1e-7);
      assert(cmp(ans, Q(0)) > 0, "面積は正");
      const fn = polyFn(f);
      return num({
        q: `曲線 $y=${px(f)}$ と $x$ 軸、および 2 直線 $x=${p}$、$x=${q0}$ で囲まれた図形の面積 $S$ を求めなさい。`,
        ans,
        reduced: true,
        fig: areaFigure({ curves: [{ fn }], x0: p, x1: q0, hi: fn, lo: () => 0 }),
        wrongs: [[at(F, Q(q0)), "MC-INTEG-DEF-UPPER-ONLY"], [mul(Q(q0 - p), at(f, Q(q0))), "MC-AREA-RECT"], [neg(ans), "MC-INTEG-DEF-REVERSE"]],
        explain: `この区間で $y\\ge 0$ なので $S=\\displaystyle\\int_{${p}}^{${q0}}(${px(f)})\\,dx$。原始関数 $F(x)=${px(F)}$ より $S=F(${q0})-F(${p})=${tq(at(F, Q(q0)))}-${tp(at(F, Q(p)))}=${tq(ans)}$。（上端 − 下端）`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        // 放物線と x 軸（または直線）で囲まれた図形の面積：|a|(β−α)³/6
        const a = lv === 1 ? r.pick([1, -1]) : r.pick([1, -1, 2, -2, Q(1, 2), Q(-1, 2)]);
        const al = r.int(-3, 1);
        const be = al + r.int(1, lv === 3 ? 4 : 3);
        const useLine = lv === 3;
        const m = useLine ? r.int(-2, 2) : 0;
        const n = useLine ? r.int(-3, 3) : 0;
        const d = poly([[a, 2], [mul(a, Q(-(al + be))), 1], [mul(a, Q(al * be)), 0]]); // a(x−α)(x−β)
        const line = P.lin(m, n);
        const f = d.add(line); // 放物線 y = a(x−α)(x−β) + (mx+n)
        const aQ = typeof a === "number" ? Q(a) : a;
        const A = absQ(aQ);
        const ans = div(mul(A, Q((be - al) ** 3)), Q(6));
        // 別の経路：α から β までの定積分（差 f−g）の絶対値と、数値積分
        assert(eq(ans, absQ(defInteg(d, Q(al), Q(be)))), "面積の公式との一致");
        nearly(numInteg((x) => Math.abs(polyFn(d)(x)), al, be, 4000), qnum(ans), "面積の数値検算", 1e-7);
        const fn = polyFn(f);
        const gn = polyFn(line);
        const curves = useLine ? [{ fn }, { fn: gn }] : [{ fn }];
        const wrongs = [[mul(ans, Q(2)), "MC-AREA-FORMULA"], [div(mul(A, Q((be - al) ** 3)), Q(3)), "MC-AREA-FORMULA"], [defInteg(d, Q(al), Q(be)), "MC-AREA-SIGNED"]];
        if (useLine) wrongs.push([absQ(defInteg(f, Q(al), Q(be))), "MC-AREA-ONE-CURVE"]);
        return num({
          q: useLine ? `放物線 $y=${px(f)}$ と直線 $y=${px(line)}$ で囲まれた図形の面積 $S$ を求めなさい。` : `放物線 $y=${px(f)}$ と $x$ 軸で囲まれた図形の面積 $S$ を求めなさい。`,
          ans,
          reduced: true,
          fig: areaFigure({ curves, x0: al, x1: be, hi: (x) => Math.max(fn(x), gn(x)), lo: (x) => Math.min(fn(x), gn(x)) }),
          wrongs,
          explain: `${useLine ? `交点：$${px(f)}=${px(line)}$ を整理すると $${px(d)}=0$` : `$x$ 軸との交点：$${px(f)}=0$`}、すなわち $${aQ.d === 1 ? co(aQ.n) : tq(aQ)}${fac(al)}${fac(be)}=0$ より $x=${al},\\ ${be}$。面積は $S=\\displaystyle\\int_{${al}}^{${be}}|${px(d)}|\\,dx$ で、この区間では $${px(d)}$ は${aQ.n > 0 ? "負" : "正"}です。公式 $\\displaystyle\\int_{\\alpha}^{\\beta}(x-\\alpha)(x-\\beta)\\,dx=-\\dfrac{(\\beta-\\alpha)^{3}}{6}$ を使うと $S=\\dfrac{|${tq(aQ)}|}{6}(${be}-${tp(al)})^{3}=${tq(ans)}$。（公式を使わず、原始関数で計算しても同じ値になる）`,
        });
      },
      { id: "b", db: 0.25 },
    ),

    t(
      "num",
      (r, lv) => {
        // 符号が入れかわる区間 / 2 曲線が交わる区間の面積
        const k = r.pick([1, -1, 2, -2]);
        let x0;
        let x1;
        let d;
        let line = null;
        let cuts;
        let roots;
        if (lv === 1) {
          const [r1, r2] = until(
            () => [r.int(-1, 2), r.int(1, 4)],
            ([u, v]) => v - u >= 2,
          );
          d = poly([[k, 2], [-k * (r1 + r2), 1], [k * r1 * r2, 0]]);
          x0 = r1 - 1;
          x1 = r2 + 1;
          cuts = [x0, r1, r2, x1];
          roots = [r1, r2];
        } else {
          const [r1, r2, r3] = until(
            () => {
              const u = r.int(-3, 0);
              return [u, u + r.int(1, 2), u + r.int(3, 4)];
            },
            ([u, v, w]) => v > u && w > v,
          );
          d = P.lin(1, -r1).mul(P.lin(1, -r2)).mul(P.lin(1, -r3)).scale(Q(k));
          x0 = r1;
          x1 = r3;
          cuts = [r1, r2, r3];
          roots = [r1, r2, r3];
          if (lv === 3) line = P.lin(r.int(-2, 2), r.int(-2, 2));
        }
        const f = line ? d.add(line) : d;
        let ans = Q(0);
        for (let i = 0; i + 1 < cuts.length; i++) ans = add(ans, absQ(defInteg(d, Q(cuts[i]), Q(cuts[i + 1]))));
        nearly(numInteg((x) => Math.abs(polyFn(d)(x)), x0, x1, 20000), qnum(ans), "面積の数値検算", 1e-6);
        const fn = polyFn(f);
        const gn = line ? polyFn(line) : () => 0;
        const first = absQ(defInteg(d, Q(cuts[0]), Q(cuts[1])));
        return num({
          q: line
            ? `曲線 $y=${px(f)}$ と直線 $y=${px(line)}$ で囲まれた図形（2 つの部分からなる）の面積の合計 $S$ を求めなさい。`
            : `曲線 $y=${px(f)}$ と $x$ 軸、および 2 直線 $x=${x0}$、$x=${x1}$ で囲まれた図形の面積 $S$ を求めなさい。`,
          ans,
          reduced: true,
          fig: areaFigure({ curves: line ? [{ fn }, { fn: gn }] : [{ fn }], x0, x1, hi: (x) => Math.max(fn(x), gn(x)), lo: (x) => Math.min(fn(x), gn(x)) }),
          wrongs: [[defInteg(d, Q(x0), Q(x1)), "MC-AREA-SIGNED"], [first, "MC-AREA-NO-SPLIT"], [mul(first, Q(2)), "MC-AREA-NO-SPLIT"], [absQ(defInteg(d, Q(x0), Q(x1))), "MC-AREA-SIGNED"]],
          explain: `${line ? `交点：$${px(f)}=${px(line)}$ を整理して $${px(d)}=0$` : `$y=0$ となる点：$${px(d)}=0$`}、すなわち $x=${roots.join(",\\ ")}$。この点の前後で上下が入れかわる（符号が変わる）ので、区切ってそれぞれ絶対値をとって加えます：${cuts
            .slice(0, -1)
            .map((c0, i) => `$\\left|\\int_{${c0}}^{${cuts[i + 1]}}\\right|=${tq(absQ(defInteg(d, Q(c0), Q(cuts[i + 1]))))}$`)
            .join("、")}。合計 $${tq(ans)}$。（区切らずに積分すると、正負が打ち消し合って面積にならない）`,
        });
      },
      { id: "c", db: 0.45 },
    ),
  ],

  // ── 置換積分・部分積分 ────────────────────────
  integ_adv: [
    t("num", (r, lv) => {
      // 置換積分（答えが有理数になるもの）
      const kinds = lv === 1 ? ["lin"] : lv === 2 ? ["xsq", "lin", "gg"] : ["gg", "sincos", "logsub", "expsub"];
      const kind = r.pick(kinds);
      const pi = Math.PI;
      if (kind === "lin") {
        const pp = r.pick([2, 3, -1, -2]);
        const qq = r.nz(-3, 3);
        const n = r.int(2, 4);
        const a = r.int(-1, 1);
        const b = a + r.int(1, 2);
        const G = (x) => qpow(Q(pp * x + qq), n + 1);
        const core = sub(G(b), G(a));
        const ans = div(core, Q(pp * (n + 1)));
        nearly(numInteg((x) => Math.pow(pp * x + qq, n), a, b), qnum(ans), "置換積分の検算", 1e-7);
        return num({
          q: `$${intTex(`(${px(P.lin(pp, qq))})^{${n}}`, a, b)}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[div(core, Q(n + 1)), "MC-INTEG-SUB-COEF"], [div(core, Q(pp)), "MC-INTEG-NO-DIV"], [mul(core, Q(pp)), "MC-INTEG-SUB-COEF"]].filter(([v]) => !eq(v, ans)),
          explain: `$u=${px(P.lin(pp, qq))}$ とおくと $du=${pp}\\,dx$ なので $dx=\\dfrac{1}{${tp(pp)}}du$。$\\displaystyle\\int u^{${n}}\\cdot\\dfrac{1}{${tp(pp)}}du=\\dfrac{u^{${n + 1}}}{${tp(pp)}\\times ${n + 1}}$ で、$x=${b}$ のとき $u=${pp * b + qq}$、$x=${a}$ のとき $u=${pp * a + qq}$。$\\dfrac{(${pp * b + qq})^{${n + 1}}-(${pp * a + qq})^{${n + 1}}}{${pp * (n + 1)}}=${tq(ans)}$。（$x$ の係数 $${pp}$ でわる）`,
        });
      }
      if (kind === "xsq") {
        const c = r.int(1, 3);
        const n = r.int(2, 3);
        const b = r.int(1, 2);
        const G = (x) => qpow(Q(x * x + c), n + 1);
        const core = sub(G(b), G(0));
        const ans = div(core, Q(2 * (n + 1)));
        nearly(numInteg((x) => x * Math.pow(x * x + c, n), 0, b), qnum(ans), "置換積分の検算", 1e-7);
        return num({
          q: `$${intTex(`x(x^{2}+${c})^{${n}}`, 0, b)}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[div(core, Q(n + 1)), "MC-INTEG-SUB-COEF"], [div(sub(qpow(Q(b), n + 1), Q(0)), Q(2 * (n + 1))), "MC-INTEG-SUB-LIMITS"], [core, "MC-INTEG-NO-DIV"]],
          explain: `$u=x^{2}+${c}$ とおくと $du=2x\\,dx$ なので $x\\,dx=\\dfrac12du$。$x:0\\to ${b}$ のとき $u:${c}\\to ${b * b + c}$。$\\displaystyle\\int_{${c}}^{${b * b + c}}u^{${n}}\\cdot\\dfrac12\\,du=\\dfrac12\\cdot\\dfrac{(${b * b + c})^{${n + 1}}-${c}^{${n + 1}}}{${n + 1}}=${tq(ans)}$。（積分の範囲も $u$ の値に変える。$\\dfrac12$ を忘れない）`,
        });
      }
      if (kind === "gg") {
        // (2x+k)(x²+kx+m)^n の形（g'(x) g(x)^n）
        const kk = r.nz(-3, 3);
        const m = r.int(-2, 3);
        const n = r.int(2, 3);
        const a = r.int(-1, 1);
        const b = a + r.int(1, 2);
        const g = (x) => x * x + kk * x + m;
        const core = sub(qpow(Q(g(b)), n + 1), qpow(Q(g(a)), n + 1));
        const ans = div(core, Q(n + 1));
        nearly(numInteg((x) => (2 * x + kk) * Math.pow(g(x), n), a, b), qnum(ans), "置換積分の検算", 1e-7);
        const gTex = px(poly([[1, 2], [kk, 1], [m, 0]]));
        return num({
          q: `$${intTex(`(${px(P.lin(2, kk))})(${gTex})^{${n}}`, a, b)}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[core, "MC-INTEG-NO-DIV"], [mul(core, Q(1, 2 * (n + 1))), "MC-INTEG-SUB-COEF"], [div(sub(qpow(Q(b), n + 1), qpow(Q(a), n + 1)), Q(n + 1)), "MC-INTEG-SUB-LIMITS"]],
          explain: `$u=${gTex}$ とおくと $du=(${px(P.lin(2, kk))})\\,dx$ で、被積分関数は $u^{${n}}\\,du$ の形。$x:${a}\\to ${b}$ のとき $u:${g(a)}\\to ${g(b)}$。$\\displaystyle\\int_{${g(a)}}^{${g(b)}}u^{${n}}\\,du=\\dfrac{(${g(b)})^{${n + 1}}-(${g(a)})^{${n + 1}}}{${n + 1}}=${tq(ans)}$。（かっこの外の式が、かっこの中の式の導関数になっている）`,
        });
      }
      if (kind === "sincos") {
        const n = r.int(2, 4);
        const A = r.pick([1, 2, 3, -1]);
        const useSin = r.chance(0.5);
        const ans = Q(A, n + 1);
        const f = useSin ? (x) => A * Math.pow(Math.sin(x), n) * Math.cos(x) : (x) => A * Math.pow(Math.cos(x), n) * Math.sin(x);
        nearly(numInteg(f, 0, pi / 2), qnum(ans), "置換積分の検算", 1e-7);
        const body = useSin ? `${co(A)}\\sin^{${n}}x\\cos x` : `${co(A)}\\cos^{${n}}x\\sin x`;
        return num({
          q: `$${intTex(body, "0", "\\frac{\\pi}{2}")}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(A), "MC-INTEG-NO-DIV"], [Q(-A, n + 1), "MC-INTEG-SUB-SIGN"], [Q(A, n), "MC-INTEG-DIV-N"]].filter(([v]) => !eq(v, ans)),
          explain: `${useSin ? "$u=\\sin x$ とおくと $du=\\cos x\\,dx$" : "$u=\\cos x$ とおくと $du=-\\sin x\\,dx$"}。$x:0\\to\\dfrac{\\pi}{2}$ のとき ${useSin ? "$u:0\\to 1$" : "$u:1\\to 0$"}。${useSin ? `$\\displaystyle\\int_{0}^{1}${co(A)}u^{${n}}\\,du$` : `$\\displaystyle\\int_{1}^{0}${co(-A)}u^{${n}}\\,du$`} $=${tq(ans)}$。（${useSin ? "" : "$\\cos$ のときは $du$ に負の符号がつき、上端と下端も入れかわる。"}答えは $\\dfrac{${A}}{${n + 1}}$）`,
        });
      }
      if (kind === "logsub") {
        const n = r.int(1, 3);
        const A = r.pick([1, 2, 3, 4]);
        const ans = Q(A, n + 1);
        nearly(numInteg((x) => (A * Math.pow(Math.log(x), n)) / x, 1, Math.E), qnum(ans), "置換積分の検算", 1e-7);
        return num({
          q: `$${intTex(`\\dfrac{${co(A)}(\\log x)${n === 1 ? "" : `^{${n}}`}}{x}`, "1", "e")}$ の値を求めなさい。（$\\log$ は自然対数）`,
          ans,
          reduced: true,
          wrongs: [[Q(A), "MC-INTEG-NO-DIV"], [Q(A, n), "MC-INTEG-DIV-N"], [Q(A * n, n + 1), "MC-INTEG-SUB-COEF"]].filter(([v]) => !eq(v, ans)),
          explain: `$u=\\log x$ とおくと $du=\\dfrac{1}{x}dx$。$x:1\\to e$ のとき $u:0\\to 1$。$\\displaystyle\\int_{0}^{1}${co(A)}u^{${n}}\\,du=${A}\\cdot\\dfrac{1}{${n + 1}}=${tq(ans)}$。（$\\log 1=0$、$\\log e=1$）`,
        });
      }
      // expsub: ∫_0^{log 2} e^x (e^x+1)^n dx
      const n = r.int(1, 3);
      const ans = Q(Math.pow(3, n + 1) - Math.pow(2, n + 1), n + 1);
      nearly(numInteg((x) => Math.exp(x) * Math.pow(Math.exp(x) + 1, n), 0, Math.log(2)), qnum(ans), "置換積分の検算", 1e-7);
      return num({
        q: `$${intTex(`e^{x}(e^{x}+1)^{${n}}`, "0", "\\log 2")}$ の値を求めなさい。（$\\log$ は自然対数）`,
        ans,
        reduced: true,
        wrongs: [[Q(Math.pow(3, n + 1), n + 1), "MC-INTEG-SUB-LIMITS"], [Q(Math.pow(2, n + 1) - Math.pow(1, n + 1), n + 1), "MC-INTEG-SUB-LIMITS"], [Q(Math.pow(3, n + 1) - Math.pow(2, n + 1)), "MC-INTEG-NO-DIV"]],
        explain: `$u=e^{x}+1$ とおくと $du=e^{x}\\,dx$。$x:0\\to\\log 2$ のとき $u:2\\to 3$（$e^{0}=1$、$e^{\\log 2}=2$）。$\\displaystyle\\int_{2}^{3}u^{${n}}\\,du=\\dfrac{3^{${n + 1}}-2^{${n + 1}}}{${n + 1}}=${tq(ans)}$。`,
      });
    }),

    t(
      "choice",
      (r, lv) => {
        // 部分積分で求めた不定積分の形を選ぶ。候補式は数値微分で「もとの関数にもどるか」を確かめる
        const E = Math.exp;
        const S = Math.sin;
        const C = Math.cos;
        const ln = Math.log;
        const k = r.pick([2, 3]);
        const pts = [0.7, 1.9];
        const L1 = [
          { f: "xe^{x}", fn: (x) => x * E(x), cor: ["(x-1)e^{x}+C", (x) => (x - 1) * E(x)], wr: [["(x+1)e^{x}+C", (x) => (x + 1) * E(x), "MC-INTEG-PARTS-SIGN"], ["xe^{x}+C", (x) => x * E(x), "MC-INTEG-PARTS-DROP"], ["\\dfrac{x^{2}}{2}e^{x}+C", (x) => (x * x * E(x)) / 2, "MC-INTEG-PARTS-SWAP"]], how: "$u=x$、$v'=e^{x}$ として $\\int xe^{x}dx=xe^{x}-\\int e^{x}dx=xe^{x}-e^{x}+C$" },
          { f: "x\\sin x", fn: (x) => x * S(x), cor: ["-x\\cos x+\\sin x+C", (x) => -x * C(x) + S(x)], wr: [["x\\cos x+\\sin x+C", (x) => x * C(x) + S(x), "MC-INTEG-PARTS-SIGN"], ["-x\\cos x-\\sin x+C", (x) => -x * C(x) - S(x), "MC-INTEG-PARTS-SIGN"], ["-x\\cos x+C", (x) => -x * C(x), "MC-INTEG-PARTS-DROP"]], how: "$u=x$、$v'=\\sin x$ として $\\int x\\sin x\\,dx=-x\\cos x+\\int\\cos x\\,dx=-x\\cos x+\\sin x+C$" },
          { f: "x\\cos x", fn: (x) => x * C(x), cor: ["x\\sin x+\\cos x+C", (x) => x * S(x) + C(x)], wr: [["x\\sin x-\\cos x+C", (x) => x * S(x) - C(x), "MC-INTEG-PARTS-SIGN"], ["x\\sin x+C", (x) => x * S(x), "MC-INTEG-PARTS-DROP"], ["-x\\sin x+\\cos x+C", (x) => -x * S(x) + C(x), "MC-INTEG-PARTS-SIGN"]], how: "$u=x$、$v'=\\cos x$ として $\\int x\\cos x\\,dx=x\\sin x-\\int\\sin x\\,dx=x\\sin x+\\cos x+C$" },
        ];
        const L2 = [
          { f: `xe^{${k}x}`, fn: (x) => x * E(k * x), cor: [`\\left(\\dfrac{x}{${k}}-\\dfrac{1}{${k * k}}\\right)e^{${k}x}+C`, (x) => (x / k - 1 / (k * k)) * E(k * x)], wr: [[`\\left(\\dfrac{x}{${k}}+\\dfrac{1}{${k * k}}\\right)e^{${k}x}+C`, (x) => (x / k + 1 / (k * k)) * E(k * x), "MC-INTEG-PARTS-SIGN"], [`\\dfrac{x}{${k}}e^{${k}x}+C`, (x) => (x / k) * E(k * x), "MC-INTEG-PARTS-DROP"], [`\\left(x-\\dfrac{1}{${k}}\\right)e^{${k}x}+C`, (x) => (x - 1 / k) * E(k * x), "MC-INTEG-SUB-COEF"]], how: `$u=x$、$v'=e^{${k}x}$（$v=\\dfrac{1}{${k}}e^{${k}x}$）として $\\int xe^{${k}x}dx=\\dfrac{x}{${k}}e^{${k}x}-\\dfrac{1}{${k}}\\int e^{${k}x}dx=\\dfrac{x}{${k}}e^{${k}x}-\\dfrac{1}{${k * k}}e^{${k}x}+C$` },
          { f: "\\log x", fn: ln, cor: ["x\\log x-x+C", (x) => x * ln(x) - x], wr: [["x\\log x+C", (x) => x * ln(x), "MC-INTEG-PARTS-DROP"], ["x\\log x+x+C", (x) => x * ln(x) + x, "MC-INTEG-PARTS-SIGN"], ["\\dfrac{(\\log x)^{2}}{2}+C", (x) => (ln(x) * ln(x)) / 2, "MC-INTEG-LOG-POWER"]], how: "$\\log x=1\\cdot\\log x$ と見て $u=\\log x$、$v'=1$ として $\\int\\log x\\,dx=x\\log x-\\int x\\cdot\\dfrac1x\\,dx=x\\log x-x+C$" },
          { f: "x\\log x", fn: (x) => x * ln(x), cor: ["\\dfrac{x^{2}}{2}\\log x-\\dfrac{x^{2}}{4}+C", (x) => (x * x * ln(x)) / 2 - (x * x) / 4], wr: [["\\dfrac{x^{2}}{2}\\log x-\\dfrac{x^{2}}{2}+C", (x) => (x * x * ln(x)) / 2 - (x * x) / 2, "MC-INTEG-PARTS-COEF"], ["\\dfrac{x^{2}}{2}\\log x+\\dfrac{x^{2}}{4}+C", (x) => (x * x * ln(x)) / 2 + (x * x) / 4, "MC-INTEG-PARTS-SIGN"], ["\\dfrac{x^{2}}{2}\\log x+C", (x) => (x * x * ln(x)) / 2, "MC-INTEG-PARTS-DROP"]], how: "$u=\\log x$、$v'=x$（$v=\\dfrac{x^{2}}{2}$）として $\\int x\\log x\\,dx=\\dfrac{x^{2}}{2}\\log x-\\int\\dfrac{x^{2}}{2}\\cdot\\dfrac1x\\,dx=\\dfrac{x^{2}}{2}\\log x-\\dfrac{x^{2}}{4}+C$" },
        ];
        const L3 = [
          { f: "x^{2}e^{x}", fn: (x) => x * x * E(x), cor: ["(x^{2}-2x+2)e^{x}+C", (x) => (x * x - 2 * x + 2) * E(x)], wr: [["(x^{2}-2x)e^{x}+C", (x) => (x * x - 2 * x) * E(x), "MC-INTEG-PARTS-DROP"], ["(x^{2}+2x+2)e^{x}+C", (x) => (x * x + 2 * x + 2) * E(x), "MC-INTEG-PARTS-SIGN"], ["(x^{2}-2x-2)e^{x}+C", (x) => (x * x - 2 * x - 2) * E(x), "MC-INTEG-PARTS-SIGN"]], how: "部分積分を 2 回行います。$\\int x^{2}e^{x}dx=x^{2}e^{x}-2\\int xe^{x}dx=x^{2}e^{x}-2(x-1)e^{x}+C=(x^{2}-2x+2)e^{x}+C$" },
          { f: "xe^{-x}", fn: (x) => x * E(-x), cor: ["-(x+1)e^{-x}+C", (x) => -(x + 1) * E(-x)], wr: [["(x+1)e^{-x}+C", (x) => (x + 1) * E(-x), "MC-INTEG-PARTS-SIGN"], ["-(x-1)e^{-x}+C", (x) => -(x - 1) * E(-x), "MC-INTEG-PARTS-SIGN"], ["-xe^{-x}+C", (x) => -x * E(-x), "MC-INTEG-PARTS-DROP"]], how: "$u=x$、$v'=e^{-x}$（$v=-e^{-x}$）として $\\int xe^{-x}dx=-xe^{-x}+\\int e^{-x}dx=-xe^{-x}-e^{-x}+C$" },
          { f: `x\\sin ${k}x`, fn: (x) => x * S(k * x), cor: [`-\\dfrac{x}{${k}}\\cos ${k}x+\\dfrac{1}{${k * k}}\\sin ${k}x+C`, (x) => (-x / k) * C(k * x) + S(k * x) / (k * k)], wr: [[`-\\dfrac{x}{${k}}\\cos ${k}x+\\dfrac{1}{${k}}\\sin ${k}x+C`, (x) => (-x / k) * C(k * x) + S(k * x) / k, "MC-INTEG-SUB-COEF"], [`-\\dfrac{x}{${k}}\\cos ${k}x-\\dfrac{1}{${k * k}}\\sin ${k}x+C`, (x) => (-x / k) * C(k * x) - S(k * x) / (k * k), "MC-INTEG-PARTS-SIGN"], [`-x\\cos ${k}x+\\dfrac{1}{${k * k}}\\sin ${k}x+C`, (x) => -x * C(k * x) + S(k * x) / (k * k), "MC-INTEG-SUB-COEF"]], how: `$u=x$、$v'=\\sin ${k}x$（$v=-\\dfrac{1}{${k}}\\cos ${k}x$）として $\\int x\\sin ${k}x\\,dx=-\\dfrac{x}{${k}}\\cos ${k}x+\\dfrac{1}{${k}}\\int\\cos ${k}x\\,dx=-\\dfrac{x}{${k}}\\cos ${k}x+\\dfrac{1}{${k * k}}\\sin ${k}x+C$` },
        ];
        const e = r.pick(lv === 1 ? L1 : lv === 2 ? L2 : L3);
        // 正解の式を微分して、もとの関数にもどることを確かめる
        for (const x of pts) nearly(numDeriv(e.cor[1], x), e.fn(x), "不定積分の検算", 1e-6);
        // 誤答は、微分してももとの関数にもどらない式だけ
        const wrongs = e.wr.filter(([, fn]) => pts.some((x) => Math.abs(numDeriv(fn, x) - e.fn(x)) > 1e-6 * Math.max(1, Math.abs(e.fn(x))))).map(([tex, , mc]) => [$(tex), mc]);
        return choice({
          q: `不定積分 $\\displaystyle\\int ${e.f}\\,dx$ を求めたものはどれですか。（$C$ は積分定数${e.f.includes("\\log") ? "、$\\log$ は自然対数" : ""}）`,
          correct: $(e.cor[0]),
          wrongs,
          explain: `部分積分 $\\displaystyle\\int f g'\\,dx=fg-\\int f'g\\,dx$ を使います。${e.how}。（微分してもとの関数にもどるか確かめるとまちがいを防げる）`,
        });
      },
      { id: "b", db: 0.2, finite: true },
    ),

    t(
      "num",
      (r, lv) => {
        // 三角関数の定積分（答えが有理数になるもの）
        const pi = Math.PI;
        if (lv === 1) {
          const k = r.pick([2, 3, 4]);
          const A = r.pick([1, 2, 3, -1]);
          const useSin = r.chance(0.5);
          const ans = useSin ? Q(2 * A, k) : Q(A, k);
          const f = useSin ? (x) => A * Math.sin(k * x) : (x) => A * Math.cos(k * x);
          const hi = useSin ? pi / k : pi / (2 * k);
          nearly(numInteg(f, 0, hi), qnum(ans), "三角関数の積分の検算", 1e-7);
          return num({
            q: useSin ? `$${intTex(`${co(A)}\\sin ${k}x`, "0", `\\frac{\\pi}{${k}}`)}$ の値を求めなさい。` : `$${intTex(`${co(A)}\\cos ${k}x`, "0", `\\frac{\\pi}{${2 * k}}`)}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: useSin ? [[Q(-2 * A, k), "MC-INTEG-TRIG-SIGN"], [Q(2 * A), "MC-INTEG-SUB-COEF"], [Q(A, k), "MC-SLIP"]] : [[Q(-A, k), "MC-INTEG-TRIG-SIGN"], [Q(A), "MC-INTEG-SUB-COEF"], [Q(A, k * k), "MC-INTEG-SUB-COEF"]],
            explain: useSin ? `$\\displaystyle\\int\\sin ${k}x\\,dx=-\\dfrac{1}{${k}}\\cos ${k}x$ なので、$\\left[-\\dfrac{${A}}{${k}}\\cos ${k}x\\right]_{0}^{\\pi/${k}}=-\\dfrac{${A}}{${k}}(\\cos\\pi-\\cos 0)=-\\dfrac{${A}}{${k}}\\times(-2)=${tq(ans)}$。（$\\sin$ の積分は $-\\cos$、$x$ の係数 $${k}$ でわる）` : `$\\displaystyle\\int\\cos ${k}x\\,dx=\\dfrac{1}{${k}}\\sin ${k}x$ なので、$\\left[\\dfrac{${A}}{${k}}\\sin ${k}x\\right]_{0}^{\\pi/${2 * k}}=\\dfrac{${A}}{${k}}(\\sin\\dfrac{\\pi}{2}-\\sin 0)=${tq(ans)}$。（$x$ の係数 $${k}$ でわる）`,
          });
        }
        if (lv === 2) {
          const k = r.pick([1, 2, 3, 5, 6]);
          const useSin = r.chance(0.6);
          const useK = useSin ? k : r.pick([1, 3, 5]);
          const cosv = [1, 0, -1, 0][useK % 4];
          const sinv = [0, 1, 0, -1][useK % 4];
          const ans = useSin ? Q(1 - cosv, useK) : Q(sinv, useK);
          const f = useSin ? (x) => Math.sin(useK * x) : (x) => Math.cos(useK * x);
          nearly(numInteg(f, 0, pi / 2), qnum(ans), "三角関数の積分の検算", 1e-7);
          return num({
            q: `$${intTex(useSin ? `\\sin ${useK === 1 ? "" : useK}x` : `\\cos ${useK === 1 ? "" : useK}x`, "0", "\\frac{\\pi}{2}")}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: useSin ? [[Q(cosv - 1, useK), "MC-INTEG-TRIG-SIGN"], [Q(1 - cosv), "MC-INTEG-SUB-COEF"], [Q(1, useK), "MC-SLIP"]] : [[Q(-sinv, useK), "MC-INTEG-TRIG-SIGN"], [Q(sinv), "MC-INTEG-SUB-COEF"], [Q(1, useK), "MC-SLIP"]],
            explain: useSin ? `$\\left[-\\dfrac{1}{${useK}}\\cos ${useK === 1 ? "" : useK}x\\right]_{0}^{\\pi/2}=-\\dfrac{1}{${useK}}\\left(\\cos\\dfrac{${useK}\\pi}{2}-\\cos 0\\right)=-\\dfrac{1}{${useK}}(${cosv}-1)=${tq(ans)}$。（$\\cos\\dfrac{${useK}\\pi}{2}=${cosv}$）` : `$\\left[\\dfrac{1}{${useK}}\\sin ${useK === 1 ? "" : useK}x\\right]_{0}^{\\pi/2}=\\dfrac{1}{${useK}}\\left(\\sin\\dfrac{${useK}\\pi}{2}-\\sin 0\\right)=\\dfrac{${sinv}}{${useK}}=${tq(ans)}$。（$\\sin\\dfrac{${useK}\\pi}{2}=${sinv}$）`,
          });
        }
        // 部分積分：∫_0^{π/(2k)} x sin kx dx = 1/k²、∫_0^{π/k} x cos kx dx = −2/k²
        const k = r.pick([1, 2, 3]);
        const useSin = r.chance(0.5);
        const ans = useSin ? Q(1, k * k) : Q(-2, k * k);
        const f = useSin ? (x) => x * Math.sin(k * x) : (x) => x * Math.cos(k * x);
        const hi = useSin ? pi / (2 * k) : pi / k;
        nearly(numInteg(f, 0, hi), qnum(ans), "部分積分の検算", 1e-7);
        return num({
          q: useSin ? `$${intTex(`x\\sin ${k === 1 ? "" : k}x`, "0", k === 1 ? "\\frac{\\pi}{2}" : `\\frac{\\pi}{${2 * k}}`)}$ の値を求めなさい。` : `$${intTex(`x\\cos ${k === 1 ? "" : k}x`, "0", k === 1 ? "\\pi" : `\\frac{\\pi}{${k}}`)}$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: useSin ? [[Q(-1, k * k), "MC-INTEG-PARTS-SIGN"], [Q(1, k), "MC-INTEG-SUB-COEF"], [Q(0), "MC-INTEG-PARTS-DROP"]] : [[Q(2, k * k), "MC-INTEG-PARTS-SIGN"], [Q(-2, k), "MC-INTEG-SUB-COEF"], [Q(0), "MC-INTEG-PARTS-DROP"]],
          explain: useSin ? `部分積分 $u=x$、$v'=\\sin ${k}x$ より $\\displaystyle\\int x\\sin ${k}x\\,dx=-\\dfrac{x}{${k}}\\cos ${k}x+\\dfrac{1}{${k * k}}\\sin ${k}x$。$x=\\dfrac{\\pi}{${2 * k}}$ で $\\cos\\dfrac{\\pi}{2}=0$、$\\sin\\dfrac{\\pi}{2}=1$ より値は $\\dfrac{1}{${k * k}}$、$x=0$ で $0$。答えは $${tq(ans)}$。` : `部分積分 $u=x$、$v'=\\cos ${k}x$ より $\\displaystyle\\int x\\cos ${k}x\\,dx=\\dfrac{x}{${k}}\\sin ${k}x+\\dfrac{1}{${k * k}}\\cos ${k}x$。$x=\\dfrac{\\pi}{${k}}$ で $\\sin\\pi=0$、$\\cos\\pi=-1$ より $-\\dfrac{1}{${k * k}}$、$x=0$ で $\\dfrac{1}{${k * k}}$。差は $${tq(ans)}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),

    t(
      "num",
      (r, lv) => {
        // 指数・対数関数の定積分（答えが有理数になるもの）
        const A = r.pick([1, 2, 3, -1, -2]);
        if (lv === 1) {
          const k = r.pick([1, 2, 3]);
          const ans = Q(A * (Math.pow(2, k) - 1), k);
          nearly(numInteg((x) => A * Math.exp(k * x), 0, Math.log(2)), qnum(ans), "指数関数の積分の検算", 1e-7);
          return num({
            q: `$${intTex(`${co(A)}e^{${k === 1 ? "" : k}x}`, "0", "\\log 2")}$ の値を求めなさい。（$\\log$ は自然対数）`,
            ans,
            reduced: true,
            wrongs: [[Q(A * (Math.pow(2, k) - 1)), "MC-INTEG-SUB-COEF"], [Q(A * (2 * k - 1), k), "MC-INTEG-EXP-EVAL"], [Q(A * (Math.pow(2, k) + 1), k), "MC-SLIP"]].filter(([v]) => !eq(v, ans)),
            explain: `$\\displaystyle\\int e^{${k === 1 ? "" : k}x}dx=\\dfrac{1}{${k}}e^{${k === 1 ? "" : k}x}$ なので、$\\left[\\dfrac{${A}}{${k}}e^{${k === 1 ? "" : k}x}\\right]_{0}^{\\log 2}=\\dfrac{${A}}{${k}}(e^{${k === 1 ? "" : k}\\log 2}-1)=\\dfrac{${A}}{${k}}(2^{${k}}-1)=${tq(ans)}$。（$e^{${k}\\log 2}=(e^{\\log 2})^{${k}}=2^{${k}}$）`,
          });
        }
        if (lv === 2) {
          const [k, m] = until(
            () => [r.int(1, 3), r.int(1, 3)],
            ([u, v]) => u !== v,
          );
          const B = r.pick([1, 2, -1, 3]);
          const ans = add(Q(A * (Math.pow(2, k) - 1), k), Q(B * (Math.pow(2, m) - 1), m));
          nearly(numInteg((x) => A * Math.exp(k * x) + B * Math.exp(m * x), 0, Math.log(2)), qnum(ans), "指数関数の積分の検算", 1e-7);
          return num({
            q: `$${intTex(`\\left(${sumT([[A, `e^{${k === 1 ? "" : k}x}`], [B, `e^{${m === 1 ? "" : m}x}`]])}\\right)`, "0", "\\log 2")}$ の値を求めなさい。（$\\log$ は自然対数）`,
            ans,
            reduced: true,
            wrongs: [[Q(A * (Math.pow(2, k) - 1) + B * (Math.pow(2, m) - 1)), "MC-INTEG-SUB-COEF"], [add(Q(A * (Math.pow(2, k) - 1), k), Q(B * (Math.pow(2, m) - 1))), "MC-INTEG-SUB-COEF"], [add(Q(A * (Math.pow(2, k) - 1)), Q(B * (Math.pow(2, m) - 1), m)), "MC-INTEG-SUB-COEF"]].filter(([v]) => !eq(v, ans)),
            explain: `各項を積分します：$\\left[\\dfrac{${A}}{${k}}e^{${k === 1 ? "" : k}x}+\\dfrac{${B}}{${m}}e^{${m === 1 ? "" : m}x}\\right]_{0}^{\\log 2}=\\dfrac{${A}}{${k}}(2^{${k}}-1)+\\dfrac{${B}}{${m}}(2^{${m}}-1)=${tq(ans)}$。（$e^{k\\log 2}=2^{k}$、$e^{0}=1$）`,
          });
        }
        const kind = r.pick(["logpow", "xex", "logint"]);
        if (kind === "logpow") {
          const n = r.int(1, 3);
          const ans = Q(A, n + 1);
          nearly(numInteg((x) => (A * Math.pow(Math.log(x), n)) / x, 1, Math.E), qnum(ans), "対数関数の積分の検算", 1e-7);
          return num({
            q: `$${intTex(`\\dfrac{${co(A)}(\\log x)${n === 1 ? "" : `^{${n}}`}}{x}`, "1", "e")}$ の値を求めなさい。（$\\log$ は自然対数）`,
            ans,
            reduced: true,
            wrongs: [[Q(A), "MC-INTEG-NO-DIV"], [Q(A, n), "MC-INTEG-DIV-N"], [Q(-A, n + 1), "MC-INTEG-SUB-SIGN"]].filter(([v]) => !eq(v, ans)),
            explain: `$u=\\log x$ とおくと $du=\\dfrac1x\\,dx$、$x:1\\to e$ のとき $u:0\\to 1$。$\\displaystyle\\int_{0}^{1}${co(A)}u^{${n}}\\,du=\\dfrac{${A}}{${n + 1}}=${tq(ans)}$。`,
          });
        }
        if (kind === "xex") {
          const ans = Q(A);
          nearly(numInteg((x) => A * x * Math.exp(x), 0, 1), A, "部分積分の検算", 1e-7);
          return num({
            q: `$${intTex(`${co(A)}xe^{x}`, "0", "1")}$ の値を求めなさい。`,
            ans,
            wrongs: [[Q(0), "MC-INTEG-PARTS-DROP"], [Q(-A), "MC-INTEG-PARTS-SIGN"], [Q(2 * A), "MC-SLIP"]],
            explain: `部分積分 $u=x$、$v'=e^{x}$ より $\\displaystyle\\int xe^{x}dx=xe^{x}-e^{x}=(x-1)e^{x}$。$\\left[${co(A)}(x-1)e^{x}\\right]_{0}^{1}=${A}(0-(-1))=${A}$。（$e^{0}=1$ なので $e$ は消える）`,
          });
        }
        const ans = Q(A);
        nearly(numInteg((x) => A * Math.log(x), 1, Math.E), A, "部分積分の検算", 1e-7);
        return num({
          q: `$${intTex(`${co(A)}\\log x`, "1", "e")}$ の値を求めなさい。（$\\log$ は自然対数）`,
          ans,
          wrongs: [[Q(A, 2), "MC-INTEG-LOG-POWER"], [Q(2 * A), "MC-SLIP"], [Q(-A), "MC-INTEG-PARTS-SIGN"]],
          explain: `部分積分より $\\displaystyle\\int\\log x\\,dx=x\\log x-x$。$\\left[${co(A)}(x\\log x-x)\\right]_{1}^{e}=${A}\\{(e-e)-(0-1)\\}=${A}$。（$\\log e=1$、$\\log 1=0$）`,
        });
      },
      { id: "d", db: 0.3 },
    ),
  ],
};

/** 項 [[係数, 本体TeX], …] を + と − でつないだ TeX */
function sumT(terms) {
  return terms
    .filter(([c]) => c !== 0)
    .map(([c, body], i) => `${c < 0 ? "-" : i === 0 ? "" : "+"}${Math.abs(c) === 1 ? "" : Math.abs(c)}${body}`)
    .join("");
}
