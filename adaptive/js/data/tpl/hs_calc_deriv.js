// ============================================================
// tpl/hs_calc_deriv.js — 高校 微分（数II・数III）
//   deriv_basic / deriv_tangent / deriv_extrema
//
//  すべて自作の数値・言い回し。導関数・接線・極値は、数値微分や全数探索など別の経路でも確かめている。
//  （積・商・合成、三角・指数・対数の微分は hs_calc_deriv2.js）
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, cmp, num as qnum } from "../../core/rational.js";
import { tq, tp } from "../../core/tex.js";
import { P, Poly } from "../../core/poly.js";
import { t, until, assert } from "./util.js";
import { numDeriv, nearly, polyDeriv, polyFn, polyDivMod, coeffsOf } from "./hs_util.js";

export const $ = (s) => `$${s}$`;
export const px = (p) => p.toTeX({ order: ["x"] });

/** [[係数, 次数], …] → 多項式 */
export const poly = (terms) => terms.reduce((acc, [c, k]) => acc.add(P.mono(c, { x: k })), new Poly());
/** 多項式の項 [[係数, 次数], …] */
export const termsOf = (p) => [...p.t.values()].map((tm) => [tm.c, tm.e.x || 0]);
/** x = v での値（Q） */
export const at = (p, v) => p.eval({ x: v });

/** 導関数の検算：数値微分（5点公式）と比べる */
export function checkDeriv(f, fp) {
  assert(polyDeriv(f).equals(fp), "導関数の一致");
  const F = polyFn(f);
  const G = polyFn(fp);
  for (const x of [-1.7, 0.6, 2.3]) nearly(numDeriv(F, x), G(x), "微分の検算", 1e-6);
}

/** 誤答の多項式 [Poly, mc] を、正解と等しいものや見た目が同じものを除いて選択肢にする */
function dlabels(correct, list) {
  const seen = new Set([px(correct)]);
  const out = [];
  for (const [p, mc] of list) {
    if (p.equals(correct)) continue;
    const s = px(p);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push([$(s), mc]);
  }
  return out;
}

/** 接線 y=mx+n が x=a で接していること：f−(mx+n) が (x−a)² でわり切れる */
function checkTangent(f, a, m, n) {
  checkDeriv(f, polyDeriv(f));
  const diff = f.sub(P.lin(m, n));
  const { rem } = polyDivMod(coeffsOf(diff, f.degree()), [a * a, -2 * a, 1]);
  assert(
    rem.every((q) => q.n === 0),
    "接線の検算（(x-a)^2 でわり切れない）",
  );
}

/** 接線の式の右辺（mx+n）の TeX */
const lineTex = (m, n) => P.lin(m, n).toTeX({ order: ["x"] });

/** 3次関数 f'(x)=3k(x−al)(x−be)。f = kx³ − (3k/2)(al+be)x² + 3k·al·be·x + d（係数は整数になるようにする） */
function pickCubic(r, lv) {
  const k = lv === 1 ? r.pick([1, -1]) : r.pick([1, 2, -1, -2]);
  const al = r.int(-3, 2);
  let gap = r.int(1, lv === 3 ? 5 : 4);
  if (Math.abs(k) === 1 && gap % 2 === 1) gap += 1; // al+be を偶数にして x² の係数を整数にする
  const be = al + gap;
  const d = r.int(-6, 6);
  const f = poly([[k, 3], [Q(-3 * k * (al + be), 2), 2], [3 * k * al * be, 1], [d, 0]]);
  return { f, k, al, be, d };
}

/** x=c のまわりで f が極大(極小)になっているか、近くの点と比べて確かめる */
function checkLocal(f, c, kind) {
  const F = polyFn(f);
  for (const h of [0.05, 0.2]) {
    const ok = kind === "max" ? F(c - h) < F(c) && F(c + h) < F(c) : F(c - h) > F(c) && F(c + h) > F(c);
    assert(ok, `極${kind === "max" ? "大" : "小"}の検算`);
  }
}

/** 因数 (v − a) の TeX。a が負なら (v + |a|)、0 なら v */
const fac = (a, v = "x") => (a === 0 ? v : a < 0 ? `(${v}+${-a})` : `(${v}-${a})`);

/** 区間表示の TeX */
const lt = (a, b) => `${a}<x<${b}`;

export default {
  // ── 微分（多項式） ────────────────────────────
  deriv_basic: [
    t("choice", (r, lv) => {
      let f;
      let fx;
      let how;
      let extra = [];
      if (lv < 3) {
        const exps = lv === 1 ? [r.int(2, 4), 1, 0] : [r.int(4, 5), r.int(2, 3), 1, 0];
        f = poly(exps.map((k) => [k === 0 ? r.nz(-9, 9) : k === 1 ? r.nz(-8, 8) : lv === 1 ? r.nz(-6, 6) : Q(r.nz(-6, 6), k), k]));
        fx = px(f);
        how = `各項を $(x^n)'=nx^{n-1}$ で微分し、定数項の微分は $0$ にします。`;
      } else {
        const typ = r.pick(["prod2", "prod3", "cube"]);
        if (typ === "prod2") {
          const a = r.pick([1, 2, 3]);
          const c = r.pick([1, 2, 3]);
          const g = P.lin(a, r.nz(-5, 5));
          const h = P.lin(c, r.nz(-5, 5));
          f = g.mul(h);
          fx = `(${px(g)})(${px(h)})`;
          extra = [
            [polyDeriv(g).mul(polyDeriv(h)), "MC-DERIV-PRODUCT-SEPARATE"],
            [polyDeriv(g).mul(h), "MC-DERIV-PRODUCT-FIRST"],
          ];
        } else if (typ === "prod3") {
          const g = P.lin(1, r.nz(-4, 4));
          const h = poly([[1, 2], [r.nz(-4, 4), 1], [r.nz(-6, 6), 0]]);
          f = g.mul(h);
          fx = `(${px(g)})(${px(h)})`;
          extra = [
            [polyDeriv(g).mul(polyDeriv(h)), "MC-DERIV-PRODUCT-SEPARATE"],
            [polyDeriv(g).mul(h), "MC-DERIV-PRODUCT-FIRST"],
          ];
        } else {
          const g = P.lin(r.pick([1, 1, 2, -1]), r.nz(-4, 4));
          f = g.pow(3);
          fx = `(${px(g)})^{3}`;
        }
        how = `まず展開して $f(x)=${px(f)}$ とし、各項を微分します。（かっこのまま「それぞれを微分してかける」ことはできません）`;
      }
      const fp = polyDeriv(f);
      checkDeriv(f, fp);
      const T = termsOf(f);
      const keepExp = poly(T.filter(([, k]) => k > 0).map(([c, k]) => [mul(c, Q(k)), k]));
      const noCoef = poly(T.filter(([, k]) => k > 0).map(([c, k]) => [c, k - 1]));
      const integ = poly(T.map(([c, k]) => [div(c, Q(k + 1)), k + 1]));
      const constKeep = fp.add(P.c(f.coeff(0)));
      const top = f.degree() - 1;
      const flipped = fp.add(P.mono(mul(fp.coeff(top), Q(-2)), { x: top }));
      return choice({
        q: `関数 $f(x)=${fx}$ の導関数 $f'(x)$ はどれですか。`,
        correct: $(px(fp)),
        wrongs: dlabels(fp, [
          ...extra,
          [keepExp, "MC-DERIV-EXP-KEEP"],
          [noCoef, "MC-DERIV-COEF-SKIP"],
          [constKeep, "MC-DERIV-CONST-KEEP"],
          [integ, "MC-DERIV-INTEGRATE"],
          [flipped, "MC-SLIP"],
        ]),
        explain: `${how}$f'(x)=${px(fp)}$。（定数項は微分すると消える。$x^n$ は「指数をおろして係数にかけ、指数を 1 へらす」）`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 平均変化率（2次関数）
          const f = poly([[r.pick([1, 2, 3, -1, -2]), 2], [r.int(-6, 6), 1], [r.int(-9, 9), 0]]);
          const a = r.int(-3, 2);
          const b = a + r.int(1, 4);
          const fa = at(f, Q(a));
          const fb = at(f, Q(b));
          const ans = div(sub(fb, fa), Q(b - a));
          // 2次関数では、平均変化率は区間の真ん中での微分係数に等しい（別の経路の確認）
          nearly(qnum(ans), numDeriv(polyFn(f), (a + b) / 2), "平均変化率の検算", 1e-6);
          const fp = polyDeriv(f);
          return num({
            q: `関数 $f(x)=${px(f)}$ で、$x$ が $${a}$ から $${b}$ まで変化するときの平均変化率を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[at(fp, Q(a)), "MC-DERIV-AVG-DERIV"], [at(fp, Q(b)), "MC-DERIV-AVG-DERIV"], [sub(fb, fa), "MC-DERIV-AVG-NO-DIV"]],
            explain: `平均変化率は $\\dfrac{f(${b})-f(${a})}{${b}-${tp(a)}}$。$f(${b})=${tq(fb)}$、$f(${a})=${tq(fa)}$ なので $\\dfrac{${tq(fb)}-${tp(fa)}}{${b - a}}=${tq(ans)}$。（$y$ の増加量を $x$ の増加量でわる。微分係数（ある 1 点での変化の割合）とは別のもの）`,
          });
        }
        if (lv === 2) {
          const f = poly([[r.nz(-3, 3), 3], [r.int(-5, 5), 2], [r.int(-6, 6), 1], [r.int(-8, 8), 0]]);
          const a = r.int(-3, 3);
          const fp = polyDeriv(f);
          checkDeriv(f, fp);
          const ans = at(fp, Q(a));
          const T = termsOf(f);
          const noCoef = poly(T.filter(([, k]) => k > 0).map(([c, k]) => [c, k - 1]));
          return num({
            q: `関数 $f(x)=${px(f)}$ について、微分係数 $f'(${a})$ を求めなさい。`,
            ans,
            wrongs: [[at(f, Q(a)), "MC-DERIV-EVAL-INSTEAD"], [at(fp.add(P.c(f.coeff(0))), Q(a)), "MC-DERIV-CONST-KEEP"], [at(noCoef, Q(a)), "MC-DERIV-COEF-SKIP"], [at(fp, Q(-a)), "MC-SLIP"]],
            explain: `$f'(x)=${px(fp)}$。$x=${a}$ を代入して $f'(${a})=${tq(ans)}$。（$f(${a})$ ではなく $f'(${a})$ を求める）`,
          });
        }
        // 極限の形で表された微分係数
        const f = poly([[r.nz(-2, 2), 3], [r.int(-4, 4), 2], [r.int(-5, 5), 1], [r.int(-6, 6), 0]]);
        const a = r.int(-2, 3);
        const [p, q] = r.pick([[2, 0], [3, 0], [1, 1], [2, 1], [3, 1], [4, 0]]);
        const fp = polyDeriv(f);
        checkDeriv(f, fp);
        const d = at(fp, Q(a));
        const ans = mul(Q(p + q), d);
        const F = polyFn(f);
        const h = 1e-6;
        nearly((F(a + p * h) - F(a - q * h)) / h, qnum(ans), "極限の検算", 2e-3);
        const kh = (s) => `${Math.abs(s) === 1 ? "" : Math.abs(s)}h`; // 1h → h
        const arg = (s) => (s === 0 ? `${a}` : a === 0 ? `${s < 0 ? "-" : ""}${kh(s)}` : `${a}${s > 0 ? "+" : "-"}${kh(s)}`);
        const co = (k) => (k === 1 ? "" : String(k));
        const wrongs = [[d, "MC-DERIV-DEF-COEF"], [mul(Q(p), d), "MC-DERIV-DEF-COEF"], [mul(Q(Math.max(p - q, 1)), d), "MC-DERIV-DEF-COEF"]];
        return num({
          q: `$f(x)=${px(f)}$ のとき、$\\displaystyle\\lim_{h\\to0}\\frac{f(${arg(p)})-f(${arg(-q)})}{h}$ の値を求めなさい。`,
          ans,
          wrongs,
          explain:
            q === 0
              ? `$\\dfrac{f(${arg(p)})-f(${a})}{h}=${p}\\cdot\\dfrac{f(${a}+${p}h)-f(${a})}{${p}h}$ と変形すると、$h\\to0$ で $${p}f'(${a})$ になります。$f'(x)=${px(fp)}$ より $f'(${a})=${tq(d)}$。答えは $${p}\\times ${tp(d)}=${tq(ans)}$。（分母を $${p}h$ にそろえるために $${p}$ 倍が出る）`
              : `分子を $\\{f(${arg(p)})-f(${a})\\}+\\{f(${a})-f(${arg(-q)})\\}$ に分けると、前半は $${co(p)}f'(${a})$、後半は $${co(q)}f'(${a})$ に近づきます。$f'(x)=${px(fp)}$ より $f'(${a})=${tq(d)}$。答えは $(${p}+${q})\\times ${tp(d)}=${tq(ans)}$。（$f'(${a})$ そのものではなく、$h$ の係数の和だけ倍になる）`,
        });
      },
      { id: "b", db: 0.1 },
    ),

    t(
      "fields",
      (r, lv) => {
        // 展開してから微分：f'(x) = a x² + b x + c の各係数
        let f;
        let fx;
        let sep = null;
        if (lv === 1) {
          f = poly([[r.pick([1, 2, 3, -1, -2]), 3], [r.int(-5, 5), 2], [r.int(-6, 6), 1], [r.int(-8, 8), 0]]);
          fx = px(f);
        } else if (lv === 2) {
          const [p, q, s] = [r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4)];
          f = P.lin(1, p).mul(P.lin(1, q)).mul(P.lin(1, s));
          fx = `(x${p > 0 ? "+" : ""}${p})(x${q > 0 ? "+" : ""}${q})(x${s > 0 ? "+" : ""}${s})`;
          sep = { a: 0, b: 0, c: 1 };
        } else {
          const a = r.pick([1, 2]);
          const c = r.pick([1, 2, -1]);
          const b = r.nz(-4, 4);
          const d = r.nz(-4, 4);
          const g = P.lin(a, b);
          const h = P.lin(c, d);
          f = g.pow(2).mul(h);
          fx = `(${px(g)})^{2}(${px(h)})`;
          sep = { a: 0, b: 2 * a * a * c, c: 2 * a * b * c };
        }
        const fp = polyDeriv(f);
        checkDeriv(f, fp);
        assert(f.degree() === 3, "3次式");
        const [c3, c2, c1, c0] = [3, 2, 1, 0].map((k) => f.coeff(k));
        const wrongs = [
          { values: { a: c3, b: c2, c: c1 }, mc: "MC-DERIV-COEF-SKIP" },
          { values: { a: mul(c3, Q(3)), b: mul(c2, Q(2)), c: add(c1, c0) }, mc: "MC-DERIV-CONST-KEEP" },
        ];
        if (sep) wrongs.push({ values: sep, mc: "MC-DERIV-PRODUCT-SEPARATE" });
        return fields({
          q: `$f(x)=${fx}$ の導関数を $f'(x)=ax^{2}+bx+c$ の形に表すとき、$a$、$b$、$c$ の値を求めなさい。`,
          fields: [
            { id: "a", value: fp.coeff(2), pre: "$a=$" },
            { id: "b", value: fp.coeff(1), pre: "$b=$" },
            { id: "c", value: fp.coeff(0), pre: "$c=$" },
          ],
          wrongs,
          explain: `${lv === 1 ? "" : `展開すると $f(x)=${px(f)}$。`}各項を微分して $f'(x)=${px(fp)}$。よって $a=${tq(fp.coeff(2))}$、$b=${tq(fp.coeff(1))}$、$c=${tq(fp.coeff(0))}$。`,
        });
      },
      { id: "c", db: 0.1 },
    ),
  ],

  // ── 接線の方程式 ──────────────────────────────
  deriv_tangent: [
    t("fields", (r, lv) => {
      const f =
        lv === 1
          ? poly([[r.pick([1, 1, -1, 2]), 2], [r.int(-6, 6), 1], [r.int(-8, 8), 0]])
          : lv === 2
            ? poly([[1, 3], [r.int(-3, 3), 2], [r.int(-6, 6), 1], [r.int(-6, 6), 0]])
            : poly([[r.pick([2, -1, -2]), 3], [r.int(-4, 4), 2], [r.int(-6, 6), 1], [r.int(-6, 6), 0]]);
      const fp = polyDeriv(f);
      const a = until(() => r.int(-3, 3), (x) => !eq(at(fp, Q(x)), Q(0)));
      const m = at(fp, Q(a));
      const y0 = at(f, Q(a));
      const n = sub(y0, mul(m, Q(a)));
      checkTangent(f, a, m, n);
      return fields({
        q: `曲線 $y=${px(f)}$ 上の点 $(${a},\\ ${tq(y0)})$ における接線の方程式を $y=mx+n$ と表すとき、$m$、$n$ の値を求めなさい。`,
        fields: [
          { id: "m", value: m, pre: "$m=$" },
          { id: "n", value: n, pre: "$n=$" },
        ],
        wrongs: [
          { values: { m, n: y0 }, mc: "MC-TANGENT-INTERCEPT" },
          { values: { m, n: add(y0, mul(m, Q(a))) }, mc: "MC-TANGENT-INTERCEPT-SIGN" },
          { values: { m: y0, n: sub(y0, mul(y0, Q(a))) }, mc: "MC-TANGENT-SLOPE-VALUE" },
        ],
        explain: `$f'(x)=${px(fp)}$。接線の傾きは $f'(${a})=${tq(m)}$。点 $(${a},\\ ${tq(y0)})$ を通るので、$y-${tp(y0)}=${tp(m)}(x-${tp(a)})$、整理して $y=${lineTex(m, n)}$。よって $m=${tq(m)}$、$n=${tq(n)}$。（傾きは $f(${a})$ ではなく $f'(${a})$）`,
      });
    }),

    t(
      "num",
      (r, lv) => {
        const f = lv === 1 ? poly([[r.pick([1, -1, 2]), 2], [r.int(-6, 6), 1], [r.int(-8, 8), 0]]) : lv === 2 ? poly([[1, 3], [r.int(-3, 3), 2], [r.int(-5, 5), 1], [r.int(-6, 6), 0]]) : poly([[r.pick([1, -1, 2]), 2], [r.int(-6, 6), 1], [r.int(-8, 8), 0]]);
        const fp = polyDeriv(f);
        const [a, m, y0, n] = until(
          () => {
            const x = r.int(-3, 3);
            const mm = at(fp, Q(x));
            const yy = at(f, Q(x));
            return [x, mm, yy, sub(yy, mul(mm, Q(x)))];
          },
          ([, mm, , nn]) => !eq(mm, Q(0)) && !eq(nn, Q(0)),
        );
        checkTangent(f, a, m, n);
        const head = `曲線 $y=${px(f)}$ 上の $x=${a}$ の点における接線`;
        if (lv === 1) {
          return num({
            q: `${head}の $y$ 切片を求めなさい。`,
            ans: n,
            wrongs: [[y0, "MC-TANGENT-INTERCEPT"], [add(y0, mul(m, Q(a))), "MC-TANGENT-INTERCEPT-SIGN"], [m, "MC-TANGENT-SLOPE-VALUE"]],
            explain: `$f'(x)=${px(fp)}$ より傾きは $f'(${a})=${tq(m)}$、接点は $(${a},\\ ${tq(y0)})$。接線は $y=${lineTex(m, n)}$ で、$y$ 切片は $${tq(n)}$。（接点の $y$ 座標 $${tq(y0)}$ ではない）`,
          });
        }
        const xi = neg(div(n, m));
        if (lv === 2) {
          return num({
            q: `${head}の $x$ 切片（$x$ 軸との交点の $x$ 座標）を求めなさい。`,
            ans: xi,
            reduced: true,
            wrongs: [[div(n, m), "MC-TANGENT-XINT-SIGN"], [n, "MC-TANGENT-XINT-YINT"], [neg(div(m, n)), "MC-TANGENT-XINT-INVERT"]],
            explain: `$f'(x)=${px(fp)}$ より傾きは $${tq(m)}$、接線は $y=${lineTex(m, n)}$。$y=0$ とすると $${lineTex(m, n)}=0$ より $x=${tq(xi)}$。（$y$ 切片ではなく、$y=0$ のときの $x$ を求める）`,
          });
        }
        // 接線と x 軸・y 軸で囲まれる三角形の面積
        const area = div(mul(n, n), mul(Q(2), Q(Math.abs(m.n), m.d)));
        const s = (x) => Math.abs(qnum(x));
        nearly(qnum(area), 0.5 * s(n) * s(xi), "三角形の面積の検算");
        return num({
          q: `${head}と、$x$ 軸、$y$ 軸で囲まれる三角形の面積を求めなさい。`,
          ans: area,
          reduced: true,
          wrongs: [[mul(area, Q(2)), "MC-AREA-TRI-HALF"], [mul(Q(1, 2), mul(n, xi)), "MC-AREA-SIGNED"], [mul(area, Q(Math.abs(m.n), m.d)), "MC-TANGENT-SLOPE-VALUE"]],
          explain: `$f'(x)=${px(fp)}$ より接線は $y=${lineTex(m, n)}$。$y$ 切片は $${tq(n)}$、$x$ 切片は $${tq(xi)}$。三角形の底辺と高さは $${tq(Q(Math.abs(xi.n), xi.d))}$ と $${tq(Q(Math.abs(n.n), n.d))}$ なので、面積は $\\dfrac12\\times ${tq(Q(Math.abs(xi.n), xi.d))}\\times ${tq(Q(Math.abs(n.n), n.d))}=${tq(area)}$。（切片の符号は面積では絶対値にする。$\\dfrac12$ を忘れない）`,
        });
      },
      { id: "b", db: 0.15 },
    ),

    t(
      "fields",
      (r, lv) => {
        // 放物線の外の点から引いた 2 本の接線の接点
        const [a, b, c] = lv === 1 ? [1, 0, r.int(-3, 3)] : lv === 2 ? [1, r.pick([-4, -2, 2, 4]), r.int(-4, 4)] : [r.pick([2, -1, -2]), r.pick([-4, -2, 0, 2, 4]), r.int(-4, 4)];
        const f = poly([[a, 2], [b, 1], [c, 0]]);
        const fp = polyDeriv(f);
        const t1 = r.int(-4, 2);
        const t2 = t1 + 2 * r.int(1, 3);
        const p = (t1 + t2) / 2;
        const qy = a * t1 * t2 + b * p + c;
        for (const tt of [t1, t2]) {
          // 接点 (tt, f(tt)) での接線が点 (p, qy) を通る
          const lhs = add(at(f, Q(tt)), mul(at(fp, Q(tt)), Q(p - tt)));
          assert(eq(lhs, Q(qy)), "接線が指定の点を通らない");
        }
        const quad = Poly.fromCoeffs([t1 * t2, -2 * p, 1], "t").toTeX({ order: ["t"] });
        return fields({
          q: `放物線 $y=${px(f)}$ に、点 $(${p},\\ ${qy})$ から 2 本の接線を引くとき、2 つの接点の $x$ 座標を求めなさい。`,
          orderFree: true,
          fields: [
            { id: "x1", value: t1, pre: "$x=$" },
            { id: "x2", value: t2, pre: "$x=$" },
          ],
          wrongs: [
            { values: { x1: -t1, x2: -t2 }, mc: "MC-SLIP" },
            { values: { x1: at(f, Q(t1)), x2: at(f, Q(t2)) }, mc: "MC-TANGENT-XY-CONFUSE" },
          ],
          explain: `接点を $(t,\\ f(t))$ とすると、接線は $y=f'(t)(x-t)+f(t)$。これが点 $(${p},\\ ${qy})$ を通るので $${qy}=f'(t)(${p}-t)+f(t)$。$f(t)=${Poly.fromCoeffs([c, b, a], "t").toTeX({ order: ["t"] })}$、$f'(t)=${Poly.fromCoeffs([b, 2 * a], "t").toTeX({ order: ["t"] })}$ を代入して整理し${a === 1 ? "" : `、$${a}$ でわる`}と $${quad}=0$。$${fac(t1, "t")}${fac(t2, "t")}=0$ より $t=${t1},\\ ${t2}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),

    t(
      "num",
      (r, lv) => {
        // 3次曲線とその接線の、接点以外の共有点
        const b = lv === 1 ? 0 : r.nz(-3, 3);
        const f = poly([[1, 3], [b, 2], [r.int(-6, 6), 1], [r.int(-6, 6), 0]]);
        const fp = polyDeriv(f);
        const a = until(
          () => r.nz(-3, 3),
          (x) => 3 * x !== -b && !eq(at(fp, Q(x)), Q(0)),
        );
        const m = at(fp, Q(a));
        const n = sub(at(f, Q(a)), mul(m, Q(a)));
        checkTangent(f, a, m, n);
        // f−(接線) を (x−a)² でわった商が (x−x3)。ここから 3 つめの共有点を取り出して確かめる
        const { quo } = polyDivMod(coeffsOf(f.sub(P.lin(m, n)), 3), [a * a, -2 * a, 1]);
        const x3 = neg(quo[0]);
        assert(eq(quo[1], Q(1)) && eq(x3, Q(-b - 2 * a)), "3つめの共有点の検算（解と係数の関係）");
        return num({
          q: `曲線 $y=${px(f)}$ 上の $x=${a}$ の点における接線は、この曲線と接点のほかにもう 1 点で交わります。その点の $x$ 座標を求めなさい。`,
          ans: x3,
          wrongs: [[a, "MC-TANGENT-OTHER-SELF"], [-2 * a, "MC-TANGENT-OTHER-SUM"], [-a, "MC-SLIP"], [2 * a + b, "MC-SLIP"]],
          explain: `$f(x)-(\\text{接線})$ は $x=${a}$ で接するので $${fac(a)}^{2}$ を因数にもち、残りの因数を $(x-\\beta)$ とおくと $f(x)-(\\text{接線})=${fac(a)}^{2}(x-\\beta)$。$x^{2}$ の係数を比べる（解と係数の関係）と $${tp(a)}+${tp(a)}+\\beta=${-b}$ より $\\beta=${x3.n}$。（接線の方程式を作って連立しても同じ。接点が 2 重解になることを使うと計算が短い）`,
        });
      },
      { id: "d", db: 0.4 },
    ),
  ],

  // ── 増減表・極値 ──────────────────────────────
  deriv_extrema: [
    t("num", (r, lv) => {
      const wantMax = r.chance(0.5);
      if (lv < 3) {
        const { f, k, al, be } = pickCubic(r, lv);
        const mx = k > 0 ? al : be;
        const mn = k > 0 ? be : al;
        checkLocal(f, mx, "max");
        checkLocal(f, mn, "min");
        const fp = polyDeriv(f);
        const fmax = at(f, Q(mx));
        const fmin = at(f, Q(mn));
        assert(eq(at(fp, Q(al)), Q(0)) && eq(at(fp, Q(be)), Q(0)), "f'(x)=0 の解の検算");
        const ans = wantMax ? fmax : fmin;
        const cx = wantMax ? mx : mn;
        return num({
          q: `関数 $f(x)=${px(f)}$ の${wantMax ? "極大値" : "極小値"}を求めなさい。`,
          ans,
          wrongs: [[cx, "MC-EXTREMA-XVALUE"], [wantMax ? fmin : fmax, "MC-EXTREMA-MAXMIN-SWAP"], [f.coeff(0), "MC-EXTREMA-CONST"], [wantMax ? mn : mx, "MC-EXTREMA-XVALUE"]],
          explain: `$f'(x)=${px(fp)}=${3 * k}${fac(al)}${fac(be)}$ より $x=${al},\\ ${be}$ で $f'(x)=0$。増減表をかくと、$x=${mx}$ の前後で $f'$ が正から負に変わるので極大、$x=${mn}$ の前後で負から正に変わるので極小です。${wantMax ? "極大値" : "極小値"}は $f(${cx})=${tq(ans)}$。（$x$ の値 $${cx}$ ではなく、そのときの $y$ の値）`,
        });
      }
      // 4次関数 f = k x⁴ − 2k s² x² + q（極値は x=0, ±s）
      const k = r.pick([1, 2, -1]);
      const s = r.pick([2, 3]);
      const q0 = r.int(-6, 6);
      const f = poly([[k, 4], [-2 * k * s * s, 2], [q0, 0]]);
      const fp = polyDeriv(f);
      assert(polyDeriv(f).equals(poly([[4 * k, 3], [-4 * k * s * s, 1]])), "導関数");
      const at0 = k > 0 ? "max" : "min";
      checkLocal(f, 0, at0);
      checkLocal(f, s, at0 === "max" ? "min" : "max");
      checkLocal(f, -s, at0 === "max" ? "min" : "max");
      const v0 = at(f, Q(0));
      const vs = at(f, Q(s));
      const wantAt0 = (k > 0) === wantMax; // 求めたい極値が x=0 でとるほうか
      const ans = wantAt0 ? v0 : vs;
      return num({
        q: `関数 $f(x)=${px(f)}$ の${wantMax ? "極大値" : "極小値"}を求めなさい。`,
        ans,
        wrongs: [[wantAt0 ? 0 : s, "MC-EXTREMA-XVALUE"], [wantAt0 ? vs : v0, "MC-EXTREMA-MAXMIN-SWAP"], [neg(ans), "MC-SLIP"]],
        explain: `$f'(x)=${px(fp)}=${4 * k}x(x-${s})(x+${s})$ より $x=-${s},\\ 0,\\ ${s}$ で $f'(x)=0$。増減を調べると、$x=0$ では${k > 0 ? "極大" : "極小"}、$x=\\pm ${s}$ では${k > 0 ? "極小" : "極大"}です。値は $f(0)=${tq(v0)}$、$f(\\pm ${s})=${tq(vs)}$。${wantMax ? "極大値" : "極小値"}は $${tq(ans)}$。（極値をとる点が 3 つあるので、大小を見まちがえない）`,
      });
    }),

    t(
      "fields",
      (r, lv) => {
        // 極値をとる x
        if (lv < 3) {
          const { f, k, al, be } = pickCubic(r, lv);
          const fp = polyDeriv(f);
          checkLocal(f, al, k > 0 ? "max" : "min");
          checkLocal(f, be, k > 0 ? "min" : "max");
          return fields({
            q: `関数 $f(x)=${px(f)}$ が極値をとる $x$ の値を、すべて答えなさい。`,
            orderFree: true,
            fields: [
              { id: "x1", value: al, pre: "$x=$" },
              { id: "x2", value: be, pre: "$x=$" },
            ],
            wrongs: [
              { values: { x1: at(f, Q(al)), x2: at(f, Q(be)) }, mc: "MC-EXTREMA-XVALUE" },
              { values: { x1: -al, x2: -be }, mc: "MC-SLIP" },
            ],
            explain: `$f'(x)=${px(fp)}$ を $0$ とおいて解くと $x=${al},\\ ${be}$。どちらも前後で $f'(x)$ の符号が変わるので、この 2 つで極値をとります。（極値そのものではなく、極値をとる $x$ を答える）`,
          });
        }
        const k = r.pick([1, 2, -1]);
        const s = r.pick([2, 3]);
        const f = poly([[k, 4], [-2 * k * s * s, 2], [r.int(-6, 6), 0]]);
        const fp = polyDeriv(f);
        return fields({
          q: `関数 $f(x)=${px(f)}$ が極値をとる $x$ の値を、すべて答えなさい。`,
          orderFree: true,
          fields: [
            { id: "x1", value: -s, pre: "$x=$" },
            { id: "x2", value: 0, pre: "$x=$" },
            { id: "x3", value: s, pre: "$x=$" },
          ],
          wrongs: [
            { values: { x1: -s * s, x2: 0, x3: s * s }, mc: "MC-EXTREMA-SQRT-FORGET" },
            { values: { x1: 0, x2: 0, x3: s }, mc: "MC-EXTREMA-LOST-ROOT" },
          ],
          explain: `$f'(x)=${px(fp)}=${4 * k}x(x^{2}-${s * s})=${4 * k}x(x-${s})(x+${s})$ より $x=-${s},\\ 0,\\ ${s}$。3 つとも前後で符号が変わるので極値をとります。（$x^{2}=${s * s}$ の解は $x=\\pm ${s}$ で、$x=0$ も忘れない）`,
        });
      },
      { id: "b", db: 0.15 },
    ),

    t(
      "choice",
      (r, lv) => {
        const { f, k, al, be } = pickCubic(r, lv);
        const fp = polyDeriv(f);
        const outer = k > 0 ? "増加" : "減少"; // f'(x) の符号が外側(x<α, β<x)で決まる向き
        const inner = k > 0 ? "減少" : "増加";
        const say = (lo, hi, o, i) => `$x<${lo},\\ ${hi}<x$ で${o}し、$${lt(lo, hi)}$ で${i}する`;
        return choice({
          q: `関数 $f(x)=${px(f)}$ の増減について、正しいものはどれですか。`,
          correct: say(al, be, outer, inner),
          wrongs: [
            [say(al, be, inner, outer), "MC-EXTREMA-SIGN-REVERSE"],
            [say(-be, -al, outer, inner), "MC-SLIP"],
            [`$x$ の全体でつねに${outer}する`, "MC-EXTREMA-MONOTONE"],
            [`$x<${al}$ で${outer}し、$${al}<x$ で${inner}する`, "MC-EXTREMA-PARTIAL"],
          ],
          explain: `$f'(x)=${px(fp)}=${3 * k}${fac(al)}${fac(be)}$。$x^{2}$ の係数が${k > 0 ? "正" : "負"}なので、$f'(x)$ は $x<${al}$ と $${be}<x$ で${k > 0 ? "正" : "負"}、$${lt(al, be)}$ で${k > 0 ? "負" : "正"}になります。$f'>0$ なら増加、$f'<0$ なら減少なので、$x<${al}$ と $${be}<x$ で${outer}、$${lt(al, be)}$ で${inner}します。`,
        });
      },
      { id: "c", db: 0 },
    ),

    t(
      "num",
      (r, lv) => {
        // 閉区間での最大値・最小値
        const { f, k, al, be } = pickCubic(r, lv);
        const inside = (c, lo, hi) => lo < c && c < hi;
        const [m, n] = until(
          () => {
            if (lv === 1) return [al - r.int(1, 2), be + r.int(1, 2)];
            const lo = r.int(-5, 2);
            return [lo, lo + r.int(2, lv === 2 ? 5 : 7)];
          },
          ([lo, hi]) => lv === 1 || (lv === 2 ? inside(al, lo, hi) !== inside(be, lo, hi) : lo < hi),
        );
        const cands = [m, n, ...[al, be].filter((c) => inside(c, m, n))];
        const vals = cands.map((c) => at(f, Q(c)));
        const best = (wantMax) => vals.reduce((u, v) => (wantMax ? (cmp(v, u) > 0 ? v : u) : cmp(v, u) < 0 ? v : u));
        const wantMax = r.chance(0.5);
        const ans = best(wantMax);
        // 全数チェック：¼ きざみの点すべてで値を求めて、最大(最小)を比べる
        let gridBest = at(f, Q(m));
        for (let x4 = 4 * m; x4 <= 4 * n; x4++) {
          const v = at(f, Q(x4, 4));
          if (wantMax ? cmp(v, gridBest) > 0 : cmp(v, gridBest) < 0) gridBest = v;
        }
        assert(eq(gridBest, ans), "閉区間の最大最小の検算");
        const fp = polyDeriv(f);
        const localMax = at(f, Q(k > 0 ? al : be));
        const localMin = at(f, Q(k > 0 ? be : al));
        const critIn = [al, be].filter((c) => inside(c, m, n));
        return num({
          q: `$${m}\\le x\\le ${n}$ における関数 $f(x)=${px(f)}$ の${wantMax ? "最大値" : "最小値"}を求めなさい。`,
          ans,
          wrongs: [[wantMax ? localMax : localMin, "MC-EXTREMA-DOMAIN"], [wantMax ? localMin : localMax, "MC-EXTREMA-DOMAIN"], [at(f, Q(m)), "MC-EXTREMA-DOMAIN"], [at(f, Q(n)), "MC-EXTREMA-DOMAIN"]],
          explain: `$f'(x)=${px(fp)}=${3 * k}${fac(al)}${fac(be)}$ より $x=${al},\\ ${be}$ で $f'(x)=0$。区間 $${m}\\le x\\le ${n}$ の中にある${critIn.length ? `のは $x=${critIn.join(",\\ ")}$` : "ものはありません"}。区間の両端と、区間内で $f'(x)=0$ になる点の値を並べます：${cands.map((c, i) => `$f(${c})=${tq(vals[i])}$`).join("、")}。${wantMax ? "最大値" : "最小値"}は $${tq(ans)}$。（極値だけでなく、区間の端も必ず比べる）`,
        });
      },
      { id: "d", db: 0.25 },
    ),

    t(
      "num",
      (r, lv) => {
        // 文章題：最大の値を求める（答えは整数になるよう寸法を選ぶ）
        const kind = r.pick(["box", "solid", "pair"]);
        if (kind === "box") {
          const k = r.int(1, lv === 1 ? 2 : 4);
          const a = 6 * k;
          const V = (x) => x * (a - 2 * x) * (a - 2 * x);
          let best = 0;
          for (let x4 = 1; x4 < 2 * a; x4++) best = Math.max(best, V(x4 / 4));
          assert(best === V(k) && V(k) === 16 * k * k * k, "箱の体積の最大値の検算");
          return num({
            q: `1 辺が $${a}$ cm の正方形の厚紙があります。四すみから 1 辺 $x$ cm の正方形を切り取り、残りを折り曲げてふたのない箱を作ります。箱の容積の最大値は何 cm³ ですか。`,
            ans: V(k),
            post: "$\\mathrm{cm}^3$",
            wrongs: [[k, "MC-EXTREMA-XVALUE"], [V(2 * k), "MC-EXTREMA-DOMAIN"], [a * a * k, "MC-SLIP"], [V(a / 3), "MC-EXTREMA-DOMAIN"]],
            explain: `底面は 1 辺 $${a}-2x$ の正方形、高さ $x$ なので容積は $V=x(${a}-2x)^{2}$（$0<x<${a / 2}$）。展開して $V=4x^{3}-${4 * a}x^{2}+${a * a}x$、$V'=12x^{2}-${8 * a}x+${a * a}=12(x-${k})(x-${3 * k})$。$0<x<${3 * k}$ で調べると $x=${k}$ で極大かつ最大。最大値は $V=${k}\\times ${a - 2 * k}^{2}=${V(k)}$。（答えは $x$ ではなく容積）`,
          });
        }
        if (kind === "solid") {
          const s = r.int(2, lv === 1 ? 4 : 6);
          const S = 6 * s * s;
          const V = (x) => (x * (S - 2 * x * x)) / 4;
          let best = -1;
          for (let x4 = 1; x4 * x4 < 8 * S; x4++) best = Math.max(best, V(x4 / 4));
          assert(Math.abs(best - s * s * s) < 1e-9, "直方体の体積の最大値の検算");
          return num({
            q: `底面が正方形の直方体があり、表面積が $${S}$ です。底面の 1 辺を $x$、高さを $h$ とするとき、体積の最大値を求めなさい。`,
            ans: s * s * s,
            wrongs: [[s, "MC-EXTREMA-XVALUE"], [s * s, "MC-SLIP"], [(s * s * s) / 2, "MC-SLIP"]],
            explain: `表面積は $2x^{2}+4xh=${S}$ より $h=\\dfrac{${S}-2x^{2}}{4x}$。体積は $V=x^{2}h=\\dfrac{x(${S}-2x^{2})}{4}=\\dfrac{${S}x-2x^{3}}{4}$。$V'=\\dfrac{${S}-6x^{2}}{4}$ で、$V'=0$ より $x^{2}=${s * s}$、$x=${s}$。$x=${s}$ の前後で $V'$ が正から負に変わるので最大で、最大値は $V=\\dfrac{${s}(${S}-${2 * s * s})}{4}=${s * s * s}$。`,
          });
        }
        const c = r.int(2, lv === 1 ? 4 : 6);
        const Vs = (x) => x * x * (3 * c - x);
        let best = -1;
        for (let x4 = 1; x4 < 12 * c; x4++) best = Math.max(best, Vs(x4 / 4));
        assert(best === 4 * c * c * c, "2数の積の最大値の検算");
        return num({
          q: `正の数 $x$、$y$ が $x+y=${3 * c}$ をみたすとき、$x^{2}y$ の最大値を求めなさい。`,
          ans: 4 * c * c * c,
          wrongs: [[2 * c, "MC-EXTREMA-XVALUE"], [2 * c * c * c, "MC-EXTREMA-SWAP-XY"], [c * c * 2 * c * 2, "MC-SLIP"]],
          explain: `$y=${3 * c}-x$（$0<x<${3 * c}$）を代入して $g(x)=x^{2}(${3 * c}-x)=-x^{3}+${3 * c}x^{2}$。$g'(x)=-3x^{2}+${6 * c}x=-3x(x-${2 * c})$。$0<x<${3 * c}$ で調べると $x=${2 * c}$ で増加から減少に変わるので最大。最大値は $g(${2 * c})=${(2 * c) * (2 * c)}\\times ${c}=${4 * c * c * c}$。（$x$ ではなく $x^{2}y$ の値）`,
        });
      },
      { id: "e", db: 0.5 },
    ),

    t(
      "fields",
      (r, lv) => {
        // f(x)=x³+ax²+bx が x=α, β で極値をとる → a, b
        const al = r.int(-3, 1);
        const gap = lv === 3 ? r.int(1, 4) : 2 * r.int(1, 2);
        const be = al + gap;
        const a = Q(-3 * (al + be), 2);
        const b = 3 * al * be;
        const f = poly([[1, 3], [a, 2], [b, 1]]);
        const fp = polyDeriv(f);
        assert(eq(at(fp, Q(al)), Q(0)) && eq(at(fp, Q(be)), Q(0)), "極値をとる点の検算");
        checkLocal(f, al, "max");
        checkLocal(f, be, "min");
        return fields({
          q: `関数 $f(x)=x^{3}+ax^{2}+bx$ が $x=${al}$ と $x=${be}$ で極値をとるとき、定数 $a$、$b$ の値を求めなさい。`,
          fields: [
            { id: "a", value: a, pre: "$a=$" },
            { id: "b", value: b, pre: "$b=$" },
          ],
          wrongs: [
            { values: { a: neg(a), b }, mc: "MC-SLIP" },
            { values: { a: Q(-3 * (al + be)), b }, mc: "MC-EXTREMA-COEF-2" },
            { values: { a, b: al * be }, mc: "MC-EXTREMA-COEF-3" },
          ],
          explain: `$f'(x)=3x^{2}+2ax+b$。$x=${al}$ と $x=${be}$ で極値をとるので、$f'(x)=0$ の解がこの 2 つで、$f'(x)=3${fac(al)}${fac(be)}$ と書けます。両辺の係数を比べると、$x$ の係数から $2a=-3(${tp(al)}+${tp(be)})=${-3 * (al + be)}$ で $a=${tq(a)}$、定数項から $b=3\\times ${tp(al)}\\times ${tp(be)}=${b}$。（右辺の先頭の $3$ をかけ忘れない）`,
        });
      },
      { id: "f", db: 0.35 },
    ),

    t(
      "num",
      (r, lv) => {
        // 方程式 f(x)=k が異なる 3 つの実数解をもつ整数 k の個数
        // 極大値と極小値の差 |k|·gap³/2 を、個数が小さすぎ(0 個)も大きすぎもしない範囲にする
        const [lo, hi] = lv === 1 ? [4, 12] : lv === 2 ? [4, 30] : [12, 40];
        const { f, k, al, be } = until(
          () => pickCubic(r, 2),
          (c) => {
            const d = (Math.abs(c.k) * (c.be - c.al) ** 3) / 2;
            return d >= lo && d <= hi;
          },
          500,
        );
        const fmax = at(f, Q(k > 0 ? al : be));
        const fmin = at(f, Q(k > 0 ? be : al));
        assert(cmp(fmax, fmin) > 0, "極大値 > 極小値");
        // 全数チェック：整数 k ごとに、y=f(x) と y=k の交点の個数（符号が変わる回数）を数える
        const F = polyFn(f);
        let count = 0;
        for (let kk = Math.floor(qnum(fmin)) - 3; kk <= Math.ceil(qnum(fmax)) + 3; kk++) {
          // 1/20 きざみの点で f(x)−kk の符号を調べ、符号が入れかわる回数（= 接する点は数えない）を数える
          let changes = 0;
          let last = 0;
          for (let i = -600; i <= 600; i++) {
            const v = F(i / 20) - kk;
            if (v === 0) continue;
            const s = Math.sign(v);
            if (last !== 0 && s !== last) changes++;
            last = s;
          }
          if (changes === 3) count++;
        }
        const ans = sub(sub(fmax, fmin), Q(1));
        assert(eq(ans, Q(count)), "3つの実数解をもつ k の個数の検算");
        const fp = polyDeriv(f);
        const diff = sub(fmax, fmin);
        return num({
          q: `方程式 $${px(f)}=k$ が異なる 3 つの実数解をもつような整数 $k$ は、全部で何個ありますか。`,
          ans,
          wrongs: [[diff, "MC-EXTREMA-COUNT-ENDS"], [add(diff, Q(1)), "MC-EXTREMA-COUNT-ENDS"], [Q(3), "MC-EXTREMA-COUNT-ROOTS"], [Q(2), "MC-EXTREMA-COUNT-ROOTS"]],
          explain: `$y=${px(f)}$ のグラフと直線 $y=k$ の共有点の個数を考えます。$f'(x)=${px(fp)}=${3 * k}${fac(al)}${fac(be)}$ より、極大値は $${tq(fmax)}$、極小値は $${tq(fmin)}$。共有点が 3 個になるのは $${tq(fmin)}<k<${tq(fmax)}$ のとき（端の値のときは 2 個になる）。この範囲の整数は $${tq(fmin)}+1$ から $${tq(fmax)}-1$ までの ${tq(ans)} 個です。`,
        });
      },
      { id: "g", db: 0.65 },
    ),
  ],
};
