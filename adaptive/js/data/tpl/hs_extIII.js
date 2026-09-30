// ============================================================
// tpl/hs_extIII.js — 高校 数学Ⅲ の追加単元
//   func_frac_irr（分数関数・無理関数・逆関数・合成関数）
//   deriv_implicit（媒介変数・陰関数・高次導関数）／deriv_graph（法線・変曲点・漸近線）
//   deriv_app（最大最小・速度・方程式の解の個数）
//   integ_riemann（区分求積法）／integ_app（体積・曲線の長さ・道のり）
//
//  すべて自作の数値・言い回し。答えは、数値微分・数値積分・グラフの点の数え上げ・
//  有理数のままの代入など、別の方法でも計算し直して確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, toQ, add, sub, mul, div, neg, eq, cmp, num as qnum } from "../../core/rational.js";
import { tq, tp } from "../../core/tex.js";
import { P, Poly } from "../../core/poly.js";
import { t, until, assert, gcd } from "./util.js";
import { nearly, isqrt, numDeriv, numInteg, polyDeriv, polyFn, defInteg } from "./hs_util.js";
import { radTex } from "./hs_trig.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
/** 有理数を符号つきの項に（+\frac{1}{2}、−3 など） */
const sq = (q) => {
  q = toQ(q);
  return q.n < 0 ? tq(q) : `+${tq(q)}`;
};
const px = (p) => p.toTeX({ order: ["x"] });
const pt_ = (p) => p.toTeX({ order: ["t"] });
/** 符号つきの項（+3x、−x など。係数 0 なら空） */
const term = (c, v) => (c === 0 ? "" : `${c < 0 ? "-" : "+"}${Math.abs(c) === 1 ? "" : Math.abs(c)}${v}`);
/** 項を並べた式（先頭の + はとる。すべて空なら 0） */
function sumTex(...parts) {
  const s = parts.join("");
  return s === "" ? "0" : s.startsWith("+") ? s.slice(1) : s;
}
/** 符号つきの定数項（0 なら空） */
const cst = (c) => (c === 0 ? "" : sgn(c));
/** x−p の形（p＝0 なら x） */
const xm = (p, v = "x") => (p === 0 ? v : `${v}${sgn(-p)}`);
/** 0°〜360° にそろえる */
const mod360 = (d) => ((d % 360) + 360) % 360;
const toRad = (deg) => (deg * Math.PI) / 180;

/** n 階の数値微分（中心差分。n＝1〜4） */
function numDerivN(f, x, n) {
  if (n === 1) return numDeriv(f, x);
  if (n === 2) {
    const h = 1e-3;
    return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  }
  const h = 1e-2;
  if (n === 3) return (f(x + 2 * h) - 2 * f(x + h) + 2 * f(x - h) - f(x - 2 * h)) / (2 * h ** 3);
  return (f(x + 2 * h) - 4 * f(x + h) + 6 * f(x) - 4 * f(x - h) + f(x - 2 * h)) / h ** 4;
}
/** 区間 [a, b] で g(x)＝0 の解の個数を数える（符号の変わり目＋接する点 tangents）。
 *  ちょうど 0 になる格子点は飛ばし、直前の 0 でない値と符号を比べる */
function countRoots(g, a, b, steps = 200000, tangents = []) {
  let cnt = 0;
  let last = Math.sign(g(a));
  for (let i = 1; i <= steps; i++) {
    const s = Math.sign(g(a + ((b - a) * i) / steps));
    if (s === 0) continue;
    if (last !== 0 && s !== last) cnt++;
    last = s;
  }
  return cnt + tangents.length;
}

export default {
  // ── 分数関数・無理関数・逆関数・合成関数 ──────────────────
  func_frac_irr: [
    t("fields", (r, lv) => {
      const fl = (vx, hy) => [
        { id: "vx", value: vx, pre: "縦の漸近線 $x=$" },
        { id: "hy", value: hy, pre: "横の漸近線 $y=$" },
      ];
      const ask = "のグラフの漸近線を2つ求めなさい。";
      if (lv === 1) {
        // y = k/(x−p) + q
        const k = r.nz(-6, 6);
        const p = r.nz(-5, 5);
        const q = r.nz(-5, 5);
        const f = (x) => k / (x - p) + q;
        nearly(f(1e7), q, "横の漸近線の検算", 1e-5);
        assert(Math.abs(f(p + 1e-7)) > 1e5, "縦の漸近線の検算");
        return fields({
          q: `関数 $y=${k < 0 ? "-" : ""}\\dfrac{${Math.abs(k)}}{${xm(p)}}${sgn(q)}$ ${ask}`,
          fields: fl(p, q),
          layout: "lines",
          wrongs: [
            { values: { vx: -p, hy: q }, mc: "MC-ASYMPTOTE-SIGN" },
            { values: { vx: p, hy: -q }, mc: "MC-ASYMPTOTE-SIGN" },
            { values: { vx: q, hy: p }, mc: "MC-COORD-XY-SWAP" },
          ],
          explain: `$y=${k < 0 ? "-" : ""}\\dfrac{${Math.abs(k)}}{x}$ のグラフ（漸近線は $x=0$ と $y=0$）を、$x$ 軸方向に $${p}$、$y$ 軸方向に $${q}$ だけ平行移動したグラフです。漸近線も同じだけ動いて、$x=${p}$ と $y=${q}$。`,
        });
      }
      // y = (ax + b)/(cx + d)。L2 は c＝1
      const [a, b, c, d] = until(
        () => [r.nz(-5, 5), r.int(-6, 6), lv === 2 ? 1 : r.pick([2, 3, -2, 4]), r.nz(-6, 6)],
        ([a_, b_, c_, d_]) => a_ * d_ - b_ * c_ !== 0 && !(b_ === 0 && d_ === 0),
      );
      const vx = Q(-d, c);
      const hy = Q(a, c);
      const f = (x) => (a * x + b) / (c * x + d);
      nearly(f(1e8), qnum(hy), "横の漸近線の検算", 1e-6);
      assert(Math.abs(f(qnum(vx) + 1e-8)) > 1e5, "縦の漸近線の検算");
      const numer = sumTex(term(a, "x"), cst(b));
      const denom = sumTex(term(c, "x"), cst(d));
      const rem = sub(b, mul(hy, d)); // (ax+b) = (a/c)(cx+d) + (b − ad/c)
      const wrongs = [
        { values: { vx: neg(vx), hy }, mc: "MC-ASYMPTOTE-SIGN" },
        ...(b !== 0 && d !== 0 ? [{ values: { vx, hy: Q(b, d) }, mc: "MC-ASYMPTOTE-RATIO" }] : []),
        ...(c !== 1 ? [{ values: { vx, hy: a }, mc: "MC-ASYMPTOTE-RATIO" }] : [{ values: { vx, hy: b }, mc: "MC-ASYMPTOTE-RATIO" }]),
      ];
      return fields({
        q: `関数 $y=\\dfrac{${numer}}{${denom}}$ ${ask}`,
        fields: fl(vx, hy),
        layout: "lines",
        wrongs,
        explain:
          c === 1
            ? `分子を分母でわって $y=\\dfrac{${tq(rem)}}{${denom}}${sq(hy)}$ と変形します。分母が $0$ になる $x=${tq(vx)}$ が縦の漸近線、$x$ が大きくなると近づく $y=${tq(hy)}$ が横の漸近線です。`
            : `分母が $0$ になる $x=${tq(vx)}$ が縦の漸近線です。また $y=\\dfrac{${tq(hy) === "1" ? "" : tq(hy) === "-1" ? "-" : tq(hy)}(${denom})${sq(rem)}}{${denom}}=\\dfrac{${tq(rem)}}{${denom}}${sq(hy)}$ と変形でき、$x$ が大きくなると $y$ は $\\dfrac{${a}}{${c}}=${tq(hy)}$（$x$ の係数どうしの比）に近づくので、横の漸近線は $y=${tq(hy)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 1次関数の逆関数の値
          const a = r.pick([2, 3, 4, 5, -2, -3]);
          const b = r.int(-6, 6);
          const m = r.int(-4, 5);
          const k = a * m + b; // f(m) = k → f⁻¹(k) = m
          const fk = a * k + b;
          return num({
            q: `$f(x)=${sumTex(term(a, "x"), cst(b))}$ の逆関数を $f^{-1}(x)$ とするとき、$f^{-1}(${k})$ の値を求めなさい。`,
            ans: m,
            wrongs: [[fk, "MC-INVERSE-EVAL"], ...(fk !== 0 ? [[Q(1, fk), "MC-INVERSE-RECIP"]] : [])],
            explain: `$f^{-1}(${k})$ は「$f(x)=${k}$ となる $x$」のことです。$${sumTex(term(a, "x"), cst(b))}=${k}$ を解いて $x=${m}$。（$f^{-1}(x)$ は $\\dfrac{1}{f(x)}$ ではありません）`,
          });
        }
        if (lv === 2) {
          // 合成関数の値
          const a = r.nz(-3, 3);
          const b = r.int(-4, 4);
          const c = r.int(-5, 5);
          const neg2 = r.chance(0.3);
          const f = (x) => a * x + b;
          const g = (x) => (neg2 ? c - x * x : x * x + c);
          const fTex = sumTex(term(a, "x"), cst(b));
          const gTex = neg2 ? sumTex(cst(c), "-x^2") : sumTex("x^2", cst(c));
          const k = r.int(-3, 3);
          const gf = r.chance(0.5); // (g∘f)(k) か (f∘g)(k) か
          const ans = gf ? g(f(k)) : f(g(k));
          const other = gf ? f(g(k)) : g(f(k));
          return num({
            q: `$f(x)=${fTex}$、$g(x)=${gTex}$ のとき、$(${gf ? "g\\circ f" : "f\\circ g"})(${k})$ の値を求めなさい。`,
            ans,
            wrongs: [[other, "MC-COMPOSE-ORDER"], [f(k) + g(k), "MC-COMPOSE-SUM"]],
            explain: `$(${gf ? "g\\circ f" : "f\\circ g"})(${k})=${gf ? "g(f(" : "f(g("}${k}))$ で、内側から計算します。$${gf ? `f(${k})=${f(k)}` : `g(${k})=${g(k)}`}$ なので、$${gf ? `g(${f(k)})` : `f(${g(k)})`}=${ans}$。（$${gf ? "f\\circ g" : "g\\circ f"}$ とは順番がちがうので、ふつう値もちがいます）`,
          });
        }
        if (r.chance(0.6)) {
          // 分数関数の逆関数の値：y＝(ax＋b)/(cx＋d) を x について解く
          const [a, b, c, d] = until(() => [r.nz(-4, 4), r.int(-5, 5), r.nz(-3, 3), r.int(-5, 5)], ([a_, b_, c_, d_]) => a_ * d_ - b_ * c_ !== 0);
          const k = until(() => r.int(-5, 5), (v) => v !== 0 && c * v - a !== 0 && c * v + d !== 0 && b - d * v !== 0);
          const ans = Q(b - d * k, c * k - a);
          // 検算：f(ans) = k（有理数のまま）
          assert(eq(div(add(mul(a, ans), b), add(mul(c, ans), d)), Q(k)), "逆関数の値の検算");
          const fk = Q(a * k + b, c * k + d);
          const numer = sumTex(term(a, "x"), cst(b));
          const denom = sumTex(term(c, "x"), cst(d));
          return num({
            q: `$f(x)=\\dfrac{${numer}}{${denom}}$ の逆関数を $f^{-1}(x)$ とするとき、$f^{-1}(${k})$ の値を求めなさい。`,
            ans,
            wrongs: [[fk, "MC-INVERSE-EVAL"], ...(fk.n !== 0 ? [[div(1, fk), "MC-INVERSE-RECIP"]] : []), [neg(ans), "MC-EQ-TRANSPOSE"]],
            explain: `$f(x)=${k}$ となる $x$ を求めます。$\\dfrac{${numer}}{${denom}}=${k}$ の分母をはらうと $${numer}=${k}(${denom})$。$x$ について解くと $x=${tq(ans)}$。`,
          });
        }
        // 無理関数の逆関数：f(x)＝√(x−p)＋q → f⁻¹(x)＝(x−q)²＋p（x≧q）
        const p = r.int(-4, 4);
        const q = r.int(-3, 3);
        const k = q + r.int(1, 5);
        const ans = (k - q) ** 2 + p;
        nearly(Math.sqrt(ans - p) + q, k, "逆関数の値の検算", 1e-12);
        const fk = k - p >= 0 && isqrt(k - p) !== null ? isqrt(k - p) + q : null;
        return num({
          q: `$f(x)=\\sqrt{${xm(p)}}${cst(q)}$ の逆関数を $f^{-1}(x)$ とするとき、$f^{-1}(${k})$ の値を求めなさい。`,
          ans,
          wrongs: [...(fk !== null && fk !== ans ? [[fk, "MC-INVERSE-EVAL"]] : []), [(k - q) ** 2 - p, "MC-EQ-TRANSPOSE"], [k - q + p, "MC-IRR-SQUARE"]],
          explain: `$f(x)=${k}$ となる $x$ を求めます。$\\sqrt{${xm(p)}}=${k}${sgn(-q)}=${k - q}$ の両辺を2乗して $${xm(p)}=${(k - q) ** 2}$、$x=${ans}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "fields",
      (r, lv) => {
        if (lv === 1) {
          if (r.chance(0.5)) {
            // √(x＋a)＝b
            const a = r.int(-6, 8);
            const b = r.int(1, 6);
            const ans = b * b - a;
            nearly(Math.sqrt(ans + a), b, "無理方程式の検算", 1e-12);
            return fields({
              q: `方程式 $\\sqrt{${sumTex("x", cst(a))}}=${b}$ を解きなさい。`,
              fields: [{ id: "x", value: ans, pre: "$x=$" }],
              wrongs: [{ values: { x: b - a }, mc: "MC-IRR-SQUARE" }, { values: { x: b * b + a }, mc: "MC-EQ-TRANSPOSE" }],
              explain: `両辺を2乗すると $${sumTex("x", cst(a))}=${b * b}$。よって $x=${ans}$（右辺は正なので、この解は元の式を満たします）。`,
            });
          }
          // √(ax＋b) の定義域
          const a = r.pick([1, 2, 3, 4]);
          const b = r.nz(-8, 8);
          const e = Q(-b, a);
          return fields({
            q: `関数 $y=\\sqrt{${sumTex(term(a, "x"), cst(b))}}$ の定義域を $x\\ge \\square$ の形で答えなさい。`,
            fields: [{ id: "x", value: e, pre: "$x\\ge$" }],
            wrongs: [{ values: { x: neg(e) }, mc: "MC-EQ-TRANSPOSE" }, ...(a !== 1 ? [{ values: { x: -b }, mc: "MC-EQ-DIV" }] : [])],
            explain: `根号の中が $0$ 以上になる範囲です。$${sumTex(term(a, "x"), cst(b))}\\ge 0$ を解いて $x\\ge ${tq(e)}$。`,
          });
        }
        // √(mx＋a)＝sx＋c（2乗すると解が2つ出る。元の式を満たすものだけが解）
        //  右辺が減る形（s＝−1）では、解が2つとも適することはない
        const s = lv === 2 ? 1 : r.pick([1, -1]);
        const one = lv === 2 || s === -1 || r.chance(0.5);
        const m = one ? r.pick([1, 1, 2]) : r.pick([2, 4, 6]);
        const { a, c, r1, r2 } = until(
          () => {
            const c_ = r.int(-3, 3);
            const r1_ = r.int(-6, 8);
            const r2_ = m - 2 * s * c_ - r1_; // 2つの解の和は m−2sc
            return { a: c_ * c_ - r1_ * r2_, c: c_, r1: r1_, r2: r2_ };
          },
          (v) => {
            const ok1 = s * v.r1 + v.c >= 0;
            const ok2 = s * v.r2 + v.c >= 0;
            return v.r1 !== v.r2 && Math.abs(v.a) <= 24 && (one ? ok1 && !ok2 : ok1 && ok2);
          },
        );
        const roots = [r1, r2].filter((x) => s * x + c >= 0);
        for (const x of [r1, r2]) assert(m * x + a === (s * x + c) ** 2, "2乗した式の解の検算");
        for (const x of roots) nearly(Math.sqrt(m * x + a), s * x + c, "元の式の検算", 1e-12);
        const n = roots.length;
        const big = Math.max(...roots);
        const rhs = s === 1 ? sumTex("x", cst(c)) : c === 0 ? "-x" : `${c}-x`;
        const inner = sumTex(term(m, "x"), cst(a));
        const lhs = `\\sqrt{${inner}}`;
        const quad = sumTex("x^2", term(2 * s * c - m, "x"), cst(c * c - a));
        return fields({
          q: `方程式 $${lhs}=${rhs}$ の実数解の個数と、そのうち最も大きい解を答えなさい。`,
          fields: [
            { id: "n", value: n, pre: "解の個数", post: "個" },
            { id: "x", value: big, pre: "最も大きい解 $x=$" },
          ],
          layout: "lines",
          wrongs: one ? [{ values: { n: 2, x: Math.max(r1, r2) }, mc: "MC-IRR-EXTRANEOUS" }] : [{ values: { n: 1, x: Math.min(r1, r2) }, mc: "MC-IRR-EXTRANEOUS" }],
          explain: `両辺を2乗すると $${inner}=(${rhs})^2$、整理して $${quad}=0$、$x=${Math.min(r1, r2)},\\ ${Math.max(r1, r2)}$。ただし左辺は $0$ 以上なので、右辺 $${rhs}$ も $0$ 以上でなければなりません。${[r1, r2]
            .map((x) => `$x=${x}$ のとき右辺は $${s * x + c}$ で${s * x + c >= 0 ? "適する" : "不適（2乗したために出てきた解）"}`)
            .join("、")}。よって解は ${n} 個で、最も大きい解は $x=${big}$。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── いろいろな関数の微分（媒介変数・陰関数・高次導関数） ─────────
  deriv_implicit: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // x＝a t²＋b t、y＝t³＋c t
        const { a, b, c, t0 } = until(
          () => ({ a: r.pick([1, 2, -1]), b: r.int(-4, 4), c: r.int(-5, 5), t0: r.nz(-3, 3) }),
          (v) => 2 * v.a * v.t0 + v.b !== 0 && 3 * v.t0 * v.t0 + v.c !== 0,
        );
        const dx = 2 * a * t0 + b;
        const dy = 3 * t0 * t0 + c;
        const ans = Q(dy, dx);
        const X = (tt) => a * tt * tt + b * tt;
        const Y = (tt) => tt ** 3 + c * tt;
        nearly((Y(t0 + 1e-5) - Y(t0 - 1e-5)) / (X(t0 + 1e-5) - X(t0 - 1e-5)), qnum(ans), "dy/dx の検算", 1e-6);
        const xT = sumTex(term(a, "t^2"), term(b, "t"));
        const yT = sumTex("t^3", term(c, "t"));
        return num({
          q: `媒介変数 $t$ で $x=${xT}$、$y=${yT}$ と表される曲線について、$t=${t0}$ のときの $\\dfrac{dy}{dx}$ の値を求めなさい。`,
          ans,
          wrongs: [[Q(dx, dy), "MC-DYDX-INVERT"], [dy, "MC-DYDX-PART"]],
          explain: `$\\dfrac{dx}{dt}=${sumTex(term(2 * a, "t"), cst(b))}$、$\\dfrac{dy}{dt}=${sumTex("3t^2", cst(c))}$。$\\dfrac{dy}{dx}=\\dfrac{dy/dt}{dx/dt}$ に $t=${t0}$ を代入して $\\dfrac{${dy}}{${dx}}${gcd(Math.abs(dy), Math.abs(dx)) === 1 && dx > 0 ? "" : `=${tq(ans)}`}$。`,
        });
      }
      if (lv === 2) {
        // x＝A(eᵗ＋e⁻ᵗ)、y＝B(eᵗ−e⁻ᵗ)（入れかえもある）、t＝log k
        const k = r.pick([2, 3, 4]);
        const A = r.int(1, 3);
        const B = r.int(1, 3);
        const swap = r.chance(0.4);
        const plus = Q(k * k + 1, k); // eᵗ＋e⁻ᵗ
        const minus = Q(k * k - 1, k); // eᵗ−e⁻ᵗ
        // dx/dt、dy/dt（(eᵗ＋e⁻ᵗ)′＝eᵗ−e⁻ᵗ、(eᵗ−e⁻ᵗ)′＝eᵗ＋e⁻ᵗ）
        const dx = swap ? mul(A, plus) : mul(A, minus);
        const dy = swap ? mul(B, minus) : mul(B, plus);
        const ans = div(dy, dx);
        const X = (tt) => A * (swap ? Math.exp(tt) - Math.exp(-tt) : Math.exp(tt) + Math.exp(-tt));
        const Y = (tt) => B * (swap ? Math.exp(tt) + Math.exp(-tt) : Math.exp(tt) - Math.exp(-tt));
        const t0 = Math.log(k);
        nearly((Y(t0 + 1e-5) - Y(t0 - 1e-5)) / (X(t0 + 1e-5) - X(t0 - 1e-5)), qnum(ans), "dy/dx の検算", 1e-6);
        const ep = "(e^{t}+e^{-t})";
        const em = "(e^{t}-e^{-t})";
        // 係数が 1 ならかっこをつけない
        const withCo = (n, e) => (n === 1 ? e.slice(1, -1) : `${n}${e}`);
        const xT = withCo(A, swap ? em : ep);
        const yT = withCo(B, swap ? ep : em);
        return num({
          q: `媒介変数 $t$ で $x=${xT}$、$y=${yT}$ と表される曲線について、$t=\\log ${k}$ のときの $\\dfrac{dy}{dx}$ の値を求めなさい。（$\\log$ は自然対数）`,
          ans,
          wrongs: [[div(dx, dy), "MC-DYDX-INVERT"], [dy, "MC-DYDX-PART"]],
          explain: `$(e^{t})'=e^{t}$、$(e^{-t})'=-e^{-t}$ なので $\\dfrac{dx}{dt}=${withCo(A, swap ? ep : em)}$、$\\dfrac{dy}{dt}=${withCo(B, swap ? em : ep)}$。$t=\\log ${k}$ のとき $e^{t}=${k}$、$e^{-t}=\\dfrac{1}{${k}}$ なので $e^{t}+e^{-t}=${tq(plus)}$、$e^{t}-e^{-t}=${tq(minus)}$。$\\dfrac{dy}{dx}=\\dfrac{${tq(dy)}}{${tq(dx)}}=${tq(ans)}$。`,
        });
      }
      // 楕円 x＝A cos t、y＝B sin t（t＝π/4 の奇数倍）
      const [A, B] = until(() => [r.int(1, 6), r.int(1, 6)], ([u, v]) => u !== v);
      const deg = r.pick([45, 135, 225, 315]);
      const cot = deg === 45 || deg === 225 ? 1 : -1;
      const ans = Q(-B * cot, A);
      const tt0 = toRad(deg);
      nearly((B * Math.sin(tt0 + 1e-5) - B * Math.sin(tt0 - 1e-5)) / (A * Math.cos(tt0 + 1e-5) - A * Math.cos(tt0 - 1e-5)), qnum(ans), "dy/dx の検算", 1e-6);
      const th = radTex(Q(deg, 180));
      return num({
        q: `媒介変数 $t$ で $x=${A === 1 ? "" : A}\\cos t$、$y=${B === 1 ? "" : B}\\sin t$ と表される曲線（楕円）について、$t=${th}$ のときの $\\dfrac{dy}{dx}$ の値を求めなさい。`,
        ans,
        wrongs: [[Q(-A * cot, B), "MC-DYDX-INVERT"], [neg(ans), "MC-DERIV-COS-SIGN"]],
        explain: `$\\dfrac{dx}{dt}=-${A === 1 ? "" : A}\\sin t$、$\\dfrac{dy}{dt}=${B === 1 ? "" : B}\\cos t$ なので $\\dfrac{dy}{dx}=-\\dfrac{${B}\\cos t}{${A}\\sin t}$。$t=${th}$ では $\\cos t$ と $\\sin t$ の${cot === 1 ? "符号が同じで" : "符号が反対で"}大きさが等しいので、$\\dfrac{\\cos t}{\\sin t}=${cot}$。よって $\\dfrac{dy}{dx}=${tq(ans)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 円 x²＋y²＝r²
          const [p0, q0, h] = r.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [0, 3, 3]]);
          const [x0, y0] = (r.chance(0.5) ? [p0, q0] : [q0, p0]).map((v) => v * r.sign());
          const [X0, Y0] = y0 === 0 ? [y0, x0] : [x0, y0]; // y0 が 0 だと傾きが決まらないので入れかえる
          const ans = Q(-X0, Y0);
          const F = (x) => Math.sign(Y0) * Math.sqrt(h * h - x * x);
          nearly(numDeriv(F, X0), qnum(ans), "接線の傾きの検算", 1e-6);
          return num({
            q: `円 $x^2+y^2=${h * h}$ 上の点 $(${X0},\\ ${Y0})$ における $\\dfrac{dy}{dx}$（接線の傾き）の値を求めなさい。`,
            ans,
            wrongs: [[neg(ans), "MC-EQ-TRANSPOSE"], ...(X0 !== 0 ? [[Q(-Y0, X0), "MC-DYDX-INVERT"]] : [])],
            explain: `両辺を $x$ で微分します。$y^2$ は $y$ が $x$ の関数なので $(y^2)'=2y\\dfrac{dy}{dx}$。$2x+2y\\dfrac{dy}{dx}=0$ より $\\dfrac{dy}{dx}=-\\dfrac{x}{y}$。点 $(${X0},\\ ${Y0})$ を代入して $${tq(ans)}$。`,
          });
        }
        if (lv === 2) {
          // αx²＋βy²＝γ（楕円）
          const [al, be] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u !== v);
          const [x0, y0] = [r.nz(-3, 3), r.nz(-3, 3)];
          const ga = al * x0 * x0 + be * y0 * y0;
          const ans = Q(-al * x0, be * y0);
          const F = (x) => Math.sign(y0) * Math.sqrt((ga - al * x * x) / be);
          nearly(numDeriv(F, x0), qnum(ans), "接線の傾きの検算", 1e-6);
          const eqTex = `${al === 1 ? "" : al}x^2+${be === 1 ? "" : be}y^2=${ga}`;
          return num({
            q: `曲線 $${eqTex}$ 上の点 $(${x0},\\ ${y0})$ における $\\dfrac{dy}{dx}$ の値を求めなさい。`,
            ans,
            wrongs: [[Q(-x0, y0), "MC-DERIV-COEF-SKIP"], [neg(ans), "MC-EQ-TRANSPOSE"], [Q(-be * y0, al * x0), "MC-DYDX-INVERT"]],
            explain: `両辺を $x$ で微分すると $${2 * al}x+${2 * be}y\\dfrac{dy}{dx}=0$（$y^2$ の微分は $2y\\dfrac{dy}{dx}$）。よって $\\dfrac{dy}{dx}=-\\dfrac{${al === 1 ? "" : al}x}{${be === 1 ? "" : be}y}$。点 $(${x0},\\ ${y0})$ を代入して $${tq(ans)}$。`,
          });
        }
        // x²＋kxy＋y²＝γ（積の微分が必要）
        const { k, x0, y0 } = until(
          () => ({ k: r.pick([1, -1, 3, -3]), x0: r.nz(-3, 3), y0: r.nz(-3, 3) }),
          (v) => v.k * v.x0 + 2 * v.y0 !== 0 && 2 * v.x0 + v.k * v.y0 !== 0 && v.x0 * v.x0 + v.k * v.x0 * v.y0 + v.y0 * v.y0 > 0,
        );
        const ga = x0 * x0 + k * x0 * y0 + y0 * y0;
        const ans = Q(-(2 * x0 + k * y0), k * x0 + 2 * y0);
        // 検算：点の近くで曲線を y について解き（2次方程式）、数値微分
        const F = (x) => {
          // y² + kx·y + (x² − γ) = 0
          const B = k * x;
          const C = x * x - ga;
          const D = Math.sqrt(B * B - 4 * C);
          const y1 = (-B + D) / 2;
          const y2 = (-B - D) / 2;
          return Math.abs(y1 - y0) < Math.abs(y2 - y0) ? y1 : y2;
        };
        nearly(F(x0), y0, "点が曲線上にあるかの検算", 1e-9);
        nearly(numDeriv(F, x0, 1e-4), qnum(ans), "接線の傾きの検算", 1e-5);
        const kxy = k === 1 ? "+xy" : k === -1 ? "-xy" : `${sgn(k)}xy`;
        const sep = Q(-2 * x0, 2 * y0 + k); // xy の微分を y′ だけにしたまちがい：2x＋k y′＋2y y′＝0
        return num({
          q: `曲線 $x^2${kxy}+y^2=${ga}$ 上の点 $(${x0},\\ ${y0})$ における $\\dfrac{dy}{dx}$ の値を求めなさい。`,
          ans,
          wrongs: [...(2 * y0 + k !== 0 ? [[sep, "MC-DERIV-PRODUCT-SEPARATE"]] : []), [neg(ans), "MC-EQ-TRANSPOSE"], [div(1, ans), "MC-DYDX-INVERT"]],
          explain: `両辺を $x$ で微分します。$xy$ は積なので $(xy)'=y+x\\dfrac{dy}{dx}$。$2x${k === 1 ? "+" : k === -1 ? "-" : sgn(k)}\\left(y+x\\dfrac{dy}{dx}\\right)+2y\\dfrac{dy}{dx}=0$ より $\\dfrac{dy}{dx}=-\\dfrac{2x${k === 1 ? "+" : k === -1 ? "-" : sgn(k)}y}{${k === 1 ? "" : k === -1 ? "-" : k}x+2y}$。点 $(${x0},\\ ${y0})$ を代入して $${tq(ans)}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 多項式の第2次・第3次導関数
          const cs = [r.int(-5, 5), r.int(-5, 5), r.int(-4, 4), r.int(-3, 3), r.nz(-2, 2)]; // x⁰〜x⁴
          const f = Poly.fromCoeffs(cs.map((c) => Q(c)));
          const n = r.pick([2, 3]);
          const x0 = r.int(-2, 2);
          let d = f;
          for (let i = 0; i < n; i++) d = polyDeriv(d);
          const ans = d.eval({ x: x0 });
          nearly(numDerivN(polyFn(f), x0, n), qnum(ans), "高次導関数の検算", 1e-4);
          const d1 = polyDeriv(f).eval({ x: x0 });
          let dn1 = f;
          for (let i = 0; i < n - 1; i++) dn1 = polyDeriv(dn1);
          return num({
            q: `$f(x)=${px(f)}$ のとき、$f^{${n === 2 ? "\\prime\\prime" : "\\prime\\prime\\prime"}}(${x0})$ の値を求めなさい。`,
            ans,
            wrongs: [[d1, "MC-HIGHER-ORDER"], [dn1.eval({ x: x0 }), "MC-HIGHER-ORDER"], [f.eval({ x: x0 }), "MC-DERIV-EVAL-INSTEAD"]],
            explain: `${n} 回微分します。$f'(x)=${px(polyDeriv(f))}$、$f''(x)=${px(polyDeriv(polyDeriv(f)))}$${n === 3 ? `、$f'''(x)=${px(d)}$` : ""}。$x=${x0}$ を代入して $${tq(ans)}$。`,
          });
        }
        // 超越関数の高次導関数の x＝0 での値
        const k = lv === 2 ? r.pick([2, 3, -2, -3]) : r.pick([2, 3, -2, 1, -1]);
        const kx = k === 1 ? "x" : k === -1 ? "-x" : `${k}x`;
        const arg = k < 0 ? `(${kx})` : kx; // sin・cos の中身（負ならかっこ）
        const onePlus = sumTex("1", term(k, "x")); // 1＋kx
        const fams =
          lv === 2
            ? [
                { tex: `e^{${kx}}`, fn: (x) => Math.exp(k * x), n: 3, ans: k ** 3, wr: [[3 * k, "MC-HIGHER-ORDER"], [k, "MC-HIGHER-ORDER"]], how: `微分するたびに $${k}$ がかかるので $f'''(x)=${k ** 3}e^{${kx}}$` },
                { tex: `\\sin ${arg}`, fn: (x) => Math.sin(k * x), n: 3, ans: -(k ** 3), wr: [[k ** 3, "MC-DERIV-COS-SIGN"], [-k, "MC-DERIV-CHAIN-INNER"]], how: `$f'(x)=${k}\\cos ${arg}$、$f''(x)=${-(k * k)}\\sin ${arg}$、$f'''(x)=${-(k ** 3)}\\cos ${arg}$` },
                { tex: `\\cos ${arg}`, fn: (x) => Math.cos(k * x), n: 2, ans: -(k * k), wr: [[k * k, "MC-DERIV-COS-SIGN"], [-k, "MC-DERIV-CHAIN-INNER"]], how: `$f'(x)=${-k}\\sin ${arg}$、$f''(x)=${-(k * k)}\\cos ${arg}$` },
              ]
            : [
                { tex: `xe^{${kx}}`, fn: (x) => x * Math.exp(k * x), n: 2, ans: 2 * k, wr: [[k * k, "MC-DERIV-PRODUCT-SEPARATE"], [k, "MC-HIGHER-ORDER"]], how: `$f'(x)=(${onePlus})e^{${kx}}$、$f''(x)=(${2 * k}${k * k === 1 ? "+" : `+${k * k}`}x)e^{${kx}}$` },
                { tex: `x^2e^{${kx}}`, fn: (x) => x * x * Math.exp(k * x), n: 2, ans: 2, wr: [[2 * k * k, "MC-DERIV-PRODUCT-SEPARATE"], [0, "MC-HIGHER-ORDER"]], how: `$f'(x)=(2x${k === 1 ? "+" : k === -1 ? "-" : sgn(k)}x^2)e^{${kx}}$、$f''(x)=(2${sgn(4 * k)}x${k * k === 1 ? "+" : `+${k * k}`}x^2)e^{${kx}}$` },
                { tex: `\\log(${onePlus})`, fn: (x) => Math.log(1 + k * x), n: 2, ans: -(k * k), wr: [[k * k, "MC-DERIV-QUOTIENT-SIGN"], [k, "MC-HIGHER-ORDER"]], how: `$f'(x)=\\dfrac{${k}}{${onePlus}}$、$f''(x)=-\\dfrac{${k * k}}{(${onePlus})^2}$` },
              ];
        const F = r.pick(fams);
        nearly(numDerivN(F.fn, 0, F.n), F.ans, "高次導関数の検算", 2e-3);
        const prime = F.n === 2 ? "\\prime\\prime" : "\\prime\\prime\\prime";
        return num({
          q: `$f(x)=${F.tex}$ のとき、$f^{${prime}}(0)$ の値を求めなさい。${F.tex.includes("\\log") ? "（$\\log$ は自然対数）" : ""}`,
          ans: F.ans,
          wrongs: F.wr,
          explain: `${F.how}。$x=0$ を代入して $${F.ans}$。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── グラフの概形（法線・変曲点・漸近線） ─────────────────────
  deriv_graph: [
    t("fields", (r, lv) => {
      let fTex;
      let x0;
      let y0;
      let s; // 接線の傾き f′(x0)
      let fn;
      let how;
      if (lv === 1) {
        const a = r.nz(-3, 3);
        const b = r.int(-5, 5);
        const c = r.int(-5, 5);
        x0 = until(() => r.int(-3, 3), (v) => 2 * a * v + b !== 0);
        const f = Poly.fromCoeffs([Q(c), Q(b), Q(a)]);
        fTex = px(f);
        y0 = f.eval({ x: x0 });
        s = Q(2 * a * x0 + b);
        fn = polyFn(f);
        how = `$y'=${px(polyDeriv(f))}$ なので、接線の傾きは $${tq(s)}$`;
      } else if (lv === 2) {
        const kind = r.pick(["sqrt", "inv", "cube"]);
        if (kind === "sqrt") {
          const k = r.int(1, 3);
          [x0, y0, s, fTex, fn] = [k * k, Q(k), Q(1, 2 * k), "\\sqrt{x}", Math.sqrt];
          how = `$y'=\\dfrac{1}{2\\sqrt{x}}$ なので、接線の傾きは $\\dfrac{1}{2\\sqrt{${x0}}}=${tq(s)}$`;
        } else if (kind === "inv") {
          const k = r.nz(-3, 3);
          [x0, y0, s, fTex, fn] = [k, Q(1, k), Q(-1, k * k), "\\dfrac{1}{x}", (x) => 1 / x];
          how = `$y'=-\\dfrac{1}{x^2}$ なので、接線の傾きは $-\\dfrac{1}{${tp(k)}^2}=${tq(s)}$`;
        } else {
          const k = r.nz(-2, 2);
          [x0, y0, s, fTex, fn] = [k, Q(k ** 3), Q(3 * k * k), "x^3", (x) => x ** 3];
          how = `$y'=3x^2$ なので、接線の傾きは $3\\times${tp(k)}^2=${tq(s)}$`;
        }
      } else {
        // y＝√(ax＋b)、値が整数になる点で
        const a = r.pick([1, 2, 3, 4]);
        const v = r.int(1, 4);
        x0 = r.int(-3, 5);
        const b = v * v - a * x0;
        const inner = sumTex(term(a, "x"), cst(b));
        [y0, s, fTex, fn] = [Q(v), Q(a, 2 * v), `\\sqrt{${inner}}`, (x) => Math.sqrt(a * x + b)];
        how = `$y'=\\dfrac{${a}}{2\\sqrt{${inner}}}$ なので、接線の傾きは $\\dfrac{${a}}{2\\times ${v}}=${tq(s)}$`;
      }
      nearly(numDeriv(fn, x0, 1e-4), qnum(s), "接線の傾きの検算", 1e-6);
      const m = div(-1, s);
      const n = add(y0, div(x0, s));
      assert(eq(add(mul(m, x0), n), y0) && eq(mul(m, s), Q(-1)), "法線の検算（点を通り、接線と垂直）");
      return fields({
        q: `曲線 $y=${fTex}$ 上の点 $(${x0},\\ ${tq(y0)})$ における法線の方程式を $y=mx+n$ の形で表すとき、$m$ と $n$ の値を求めなさい。`,
        fields: [
          { id: "m", value: m, pre: "$m=$" },
          { id: "n", value: n, pre: "$n=$" },
        ],
        layout: "lines",
        wrongs: [
          { values: { m: s, n: sub(y0, mul(s, x0)) }, mc: "MC-NORMAL-TANGENT" },
          { values: { m: neg(s), n: add(y0, mul(s, x0)) }, mc: "MC-LINE-SLOPE-PERP" },
          { values: { m: div(1, s), n: sub(y0, div(x0, s)) }, mc: "MC-LINE-SLOPE-PERP" },
        ],
        explain: `${how}。法線は接線に垂直なので、傾きは $-1\\div${tp(s)}=${tq(m)}$（傾きの積が $-1$）。点 $(${x0},\\ ${tq(y0)})$ を通るので、${x0 === 0 ? "" : `$y=${tq(m) === "1" ? "" : tq(m) === "-1" ? "-" : tq(m)}(${xm(x0)})${sq(y0)}$ を整理して `}$y=${P.lin(m, n).toTeX({ order: ["x"] })}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const d2 = (f) => polyDeriv(polyDeriv(f));
        const signChange = (g, x) => {
          const l = g(x - 0.05);
          const rr = g(x + 0.05);
          assert(l * rr < 0, "変曲点の検算（f″ の符号が変わる）");
        };
        if (lv === 1) {
          // 3次関数：f′＝3a(x−p)(x−q)、変曲点は x＝(p＋q)/2
          const a = r.pick([1, -1]);
          const h = r.int(-2, 2);
          const g = r.int(1, 3);
          const [p, q] = [h - g, h + g];
          const d = r.int(-4, 4);
          const f = Poly.fromCoeffs([Q(d), Q(3 * a * p * q), Q(-3 * a * h), Q(a)]);
          assert(d2(f).eval({ x: h }).n === 0, "f″(h)＝0 の検算");
          signChange(polyFn(d2(f)), h);
          assert(polyDeriv(f).eval({ x: p }).n === 0 && polyDeriv(f).eval({ x: q }).n === 0, "極値の点の検算");
          const at = (x) => f.eval({ x });
          return fields({
            q: `曲線 $y=${px(f)}$ の変曲点の座標を求めなさい。`,
            fields: [
              { id: "x", value: h, pre: "変曲点 $($" },
              { id: "y", value: at(h), pre: "$,$", post: "$)$" },
            ],
            wrongs: [
              { values: { x: p, y: at(p) }, mc: "MC-INFLECT-STATIONARY" },
              { values: { x: q, y: at(q) }, mc: "MC-INFLECT-STATIONARY" },
              ...(h !== 0 ? [{ values: { x: -h, y: at(-h) }, mc: "MC-EQ-TRANSPOSE" }] : []),
            ],
            explain: `$y'=${px(polyDeriv(f))}$、$y''=${px(d2(f))}$。$y''=0$ となる $x=${h}$ の前後で $y''$ の符号が変わるので、ここが変曲点です（$y'=0$ の $x=${p},\\ ${q}$ は極値の点で、変曲点ではありません）。$y=${tq(at(h))}$ なので、変曲点は $(${h},\\ ${tq(at(h))})$。`,
          });
        }
        if (lv === 2) {
          // 4次関数：f″＝12(x−p)(x−q)
          const [p, q] = until(() => [r.int(-3, 3), r.int(-3, 3)], ([u, v]) => u < v);
          const e = r.int(-4, 4);
          const d = r.int(-5, 5);
          const f = Poly.fromCoeffs([Q(d), Q(e), Q(6 * p * q), Q(-2 * (p + q)), Q(1)]);
          assert(d2(f).eval({ x: p }).n === 0 && d2(f).eval({ x: q }).n === 0, "f″＝0 の検算");
          signChange(polyFn(d2(f)), p);
          signChange(polyFn(d2(f)), q);
          return fields({
            q: `曲線 $y=${px(f)}$ の変曲点の $x$ 座標をすべて求めなさい。`,
            fields: [
              { id: "x1", value: p, pre: "$x=$" },
              { id: "x2", value: q, pre: "$,$" },
            ],
            orderFree: true,
            wrongs: [{ values: { x1: -p, x2: -q }, mc: "MC-EQ-TRANSPOSE" }],
            explain: `$y'=${px(polyDeriv(f))}$、$y''=${px(d2(f))}=12${p === 0 ? "x" : `(${xm(p)})`}${q === 0 ? "x" : `(${xm(q)})`}$。$y''=0$ となる $x=${p},\\ ${q}$ の前後で $y''$ の符号が変わる（グラフの凹凸が入れかわる）ので、変曲点の $x$ 座標は $${p},\\ ${q}$。`,
          });
        }
        // 指数・対数をふくむ関数
        const k = r.int(1, 3);
        const eg = k === 1 ? "e^{-\\frac{x^2}{2}}" : `e^{-\\frac{x^2}{${2 * k * k}}}`;
        const ex = k === 1 ? "e^{-x}" : `e^{-\\frac{x}{${k}}}`;
        const fams = [
          { tex: eg, fn: (x) => Math.exp(-(x * x) / (2 * k * k)), xs: [-k, k], stat: 0, how: `$y'=-${k === 1 ? "x" : `\\dfrac{x}{${k * k}}`}${eg}$、$y''=${k === 1 ? "(x^2-1)" : `\\dfrac{x^2-${k * k}}{${k ** 4}}`}${eg}$ で、$x^2=${k * k}$ のとき $0$` },
          { tex: `\\log(x^2+${k * k})`, fn: (x) => Math.log(x * x + k * k), xs: [-k, k], stat: 0, how: `$y'=\\dfrac{2x}{x^2+${k * k}}$、$y''=\\dfrac{2(${k * k}-x^2)}{(x^2+${k * k})^2}$ で、$x^2=${k * k}$ のとき $0$` },
          { tex: `x${ex}`, fn: (x) => x * Math.exp(-x / k), xs: [2 * k], stat: k, how: `$y'=${k === 1 ? "(1-x)" : `\\dfrac{${k}-x}{${k}}`}${ex}$、$y''=${k === 1 ? "(x-2)" : `\\dfrac{x-${2 * k}}{${k * k}}`}${ex}$ で、$x=${2 * k}$ のとき $0$` },
        ];
        const F = r.pick(fams);
        for (const x of F.xs) {
          nearly(numDerivN(F.fn, x, 2), 0, "f″＝0 の検算", 1e-5);
          signChange((z) => numDerivN(F.fn, z, 2), x);
        }
        nearly(numDeriv(F.fn, F.stat), 0, "極値の点の検算", 1e-7);
        const two = F.xs.length === 2;
        return fields({
          q: `曲線 $y=${F.tex}$ の変曲点の $x$ 座標をすべて求めなさい。${F.tex.includes("\\log") ? "（$\\log$ は自然対数）" : ""}`,
          fields: two
            ? [
                { id: "x1", value: F.xs[0], pre: "$x=$" },
                { id: "x2", value: F.xs[1], pre: "$,$" },
              ]
            : [{ id: "x1", value: F.xs[0], pre: "$x=$" }],
          orderFree: two,
          wrongs: two ? [] : [{ values: { x1: F.stat }, mc: "MC-INFLECT-STATIONARY" }],
          explain: `${F.how}。その前後で $y''$ の符号が変わるので、変曲点の $x$ 座標は $${F.xs.join(",\\ ")}$。（$y'=0$ の $x=${F.stat}$ は極値の点で、変曲点ではありません）`,
        });
      },
      { id: "b" },
    ),
    t(
      "choice",
      (r, lv) => {
        if (lv === 1) {
          // 3次関数の凹凸
          const a = r.pick([1, -1]);
          const h = r.int(-2, 2);
          const g = r.int(1, 3);
          const [p, q] = [h - g, h + g];
          const f = Poly.fromCoeffs([Q(r.int(-4, 4)), Q(3 * a * p * q), Q(-3 * a * h), Q(a)]);
          const down = r.chance(0.5); // 下に凸な範囲を聞く（false なら上に凸）
          const d2 = polyDeriv(polyDeriv(f));
          // 下に凸 ⇔ f″＞0。f″＝6a(x−h)
          const right = (down && a > 0) || (!down && a < 0); // 答えが x＞h か
          const want = down ? 1 : -1;
          const sR = Math.sign(qnum(d2.eval({ x: h + 1 })));
          const sL = Math.sign(qnum(d2.eval({ x: h - 1 })));
          assert((sR === want) === right && (sL === want) === !right, "凹凸の検算");
          const gt = (v) => `$x>${v}$`;
          const lt = (v) => `$x<${v}$`;
          return choice({
            q: `曲線 $y=${px(f)}$ が${down ? "下に凸" : "上に凸"}になる $x$ の範囲を選びなさい。`,
            correct: right ? gt(h) : lt(h),
            wrongs: [
              [right ? lt(h) : gt(h), "MC-CONCAVE-DIR"],
              [`$${p}<x<${q}$`, "MC-INFLECT-STATIONARY"],
              [`$x<${p},\\ ${q}<x$`, "MC-INFLECT-STATIONARY"],
              ...(h !== 0 ? [[right ? gt(-h) : lt(-h), "MC-EQ-TRANSPOSE"]] : []),
            ],
            explain: `$y''=${px(d2)}$。$y''>0$ の範囲で下に凸、$y''<0$ の範囲で上に凸です。$y''${down ? ">" : "<"}0$ を解いて ${right ? gt(h) : lt(h)}。（$y'$ の符号で決まるのは増減で、凹凸ではありません）`,
          });
        }
        // 漸近線：y＝ax＋b＋k/(x−p)。L3 は分数の形で出す
        const a = r.pick([1, 2, -1, 3]);
        const b = r.int(-3, 3);
        const k = r.nz(-4, 4);
        const p = r.nz(-3, 3);
        const f = (x) => a * x + b + k / (x - p);
        nearly(f(1e6) - (a * 1e6 + b), 0, "斜めの漸近線の検算", 1e-5);
        assert(Math.abs(f(p + 1e-7)) > 1e5, "縦の漸近線の検算");
        const line = sumTex(term(a, "x"), cst(b));
        const lab = (xv, yv) => `直線 $x=${xv}$ と 直線 $y=${yv}$`;
        let fTex;
        if (lv === 2) {
          fTex = `${line}${k < 0 ? "-" : "+"}\\dfrac{${Math.abs(k)}}{${xm(p)}}`;
        } else {
          // (ax＋b)(x−p)＋k を展開した分子
          const numer = sumTex(term(a, "x^2"), term(b - a * p, "x"), cst(k - b * p));
          fTex = `\\dfrac{${numer}}{${xm(p)}}`;
          const back = (x) => (a * x * x + (b - a * p) * x + (k - b * p)) / (x - p);
          nearly(back(2.37), f(2.37), "分数の形の検算", 1e-12);
        }
        return choice({
          q: `曲線 $y=${fTex}$ の漸近線をすべて選んだものはどれですか。`,
          correct: lab(p, line),
          wrongs: [
            [`直線 $x=${p}$ と 直線 $y=${b}$`, "MC-ASYMPTOTE-OBLIQUE"],
            [`直線 $x=${p}$ だけ`, "MC-ASYMPTOTE-OBLIQUE"],
            [lab(-p, line), "MC-ASYMPTOTE-SIGN"],
            ...(lv === 3 ? [[lab(p, sumTex(term(a, "x"))), "MC-ASYMPTOTE-OBLIQUE"]] : []),
          ],
          explain: `${lv === 3 ? `分子を分母でわると $y=${line}${k < 0 ? "-" : "+"}\\dfrac{${Math.abs(k)}}{${xm(p)}}$。` : ""}分母が $0$ になる $x=${p}$ の近くで $|y|$ はいくらでも大きくなるので、直線 $x=${p}$ は漸近線。また $x$ が大きくなると $\\dfrac{${Math.abs(k)}}{${xm(p)}}$ は $0$ に近づくので、曲線は直線 $y=${line}$ に近づきます（斜めの漸近線）。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 微分の応用（最大・最小、速度、方程式の解の個数） ─────────────
  deriv_app: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const k = r.int(1, 4);
        const second = r.chance(0.4);
        const fn = second ? (x) => x * x + (2 * k ** 3) / x : (x) => x + (k * k) / x;
        const ans = second ? 3 * k * k : 2 * k;
        let best = Infinity;
        for (let i = 1; i <= 40000; i++) best = Math.min(best, fn(i / 1000));
        nearly(best, ans, "最小値の検算", 1e-6);
        nearly(fn(k), ans, "最小値の検算（x＝k）", 1e-12);
        const tex = second ? `x^2+\\dfrac{${2 * k ** 3}}{x}` : `x+\\dfrac{${k * k}}{x}`;
        return num({
          q: `$x>0$ のとき、関数 $y=${tex}$ の最小値を求めなさい。`,
          ans,
          wrongs: [[k, "MC-EXTREMA-XVALUE"]],
          explain: second
            ? `$y'=2x-\\dfrac{${2 * k ** 3}}{x^2}=\\dfrac{2(x^3-${k ** 3})}{x^2}$。$x>0$ では $x=${k}$ で $y'$ が負から正に変わるので、ここで最小。最小値は $${k * k}+\\dfrac{${2 * k ** 3}}{${k}}=${ans}$。`
            : `$y'=1-\\dfrac{${k * k}}{x^2}=\\dfrac{(x+${k})(x-${k})}{x^2}$。$x>0$ では $x=${k}$ で $y'$ が負から正に変わるので、ここで最小。最小値は $${k}+\\dfrac{${k * k}}{${k}}=${ans}$。`,
        });
      }
      if (lv === 2) {
        // y＝a sin x＋cos 2x（t＝sin x の2次関数に直す）
        const a = r.pick([1, 2, 3, 4, -1, -2, -3, -4]);
        const askMax = r.chance(0.6);
        const mx = add(1, Q(a * a, 8));
        const mn = -1 - Math.abs(a);
        const ans = askMax ? mx : Q(mn);
        let hi = -Infinity;
        let lo = Infinity;
        for (let i = 0; i < 72000; i++) {
          const x = (i / 72000) * 2 * Math.PI;
          const v = a * Math.sin(x) + Math.cos(2 * x);
          hi = Math.max(hi, v);
          lo = Math.min(lo, v);
        }
        nearly(askMax ? hi : lo, qnum(ans), "最大・最小の検算", 1e-6);
        const aT = a === 1 ? "" : a === -1 ? "-" : a;
        return num({
          q: `$0\\le x<2\\pi$ のとき、関数 $y=${aT}\\sin x+\\cos 2x$ の${askMax ? "最大値" : "最小値"}を求めなさい。`,
          ans,
          wrongs: askMax ? [[add(1, Q(a * a, 4)), "MC-VERTEX-COMPLETE-SQ"], [Q(a, 4), "MC-EXTREMA-XVALUE"]] : [[mx, "MC-EXTREMA-MAXMIN-SWAP"]],
          explain: `$\\cos 2x=1-2\\sin^2x$ なので、$t=\\sin x$ とおくと $y=-2t^2${a === 1 ? "+" : a === -1 ? "-" : sgn(a)}t+1$（$-1\\le t\\le 1$）。平方完成すると $y=-2\\left(t${a > 0 ? "-" : "+"}${tq(Q(Math.abs(a), 4))}\\right)^2+${tq(mx)}$。${askMax ? `$t=${tq(Q(a, 4))}$ は範囲内なので、最大値は $${tq(mx)}$。` : `最小になるのは、頂点から遠い端 $t=${a > 0 ? -1 : 1}$ のときで、最小値は $${mn}$。`}`,
        });
      }
      const kind = r.pick(["frac", "semi", "sqrt"]);
      if (kind === "frac") {
        const k = r.int(1, 4);
        const askMax = r.chance(0.5);
        const ans = Q(askMax ? 1 : -1, 2 * k);
        const fn = (x) => x / (x * x + k * k);
        nearly(fn(askMax ? k : -k), qnum(ans), "最大・最小の検算", 1e-12);
        let hi = -Infinity;
        let lo = Infinity;
        for (let i = -60000; i <= 60000; i++) {
          const v = fn(i / 1000);
          hi = Math.max(hi, v);
          lo = Math.min(lo, v);
        }
        nearly(askMax ? hi : lo, qnum(ans), "最大・最小の検算（全体）", 1e-6);
        return num({
          q: `関数 $y=\\dfrac{x}{x^2+${k * k}}$ の${askMax ? "最大値" : "最小値"}を求めなさい。`,
          ans,
          wrongs: [[askMax ? k : -k, "MC-EXTREMA-XVALUE"], [neg(ans), "MC-EXTREMA-MAXMIN-SWAP"]],
          explain: `$y'=\\dfrac{(x^2+${k * k})-x\\cdot 2x}{(x^2+${k * k})^2}=\\dfrac{${k * k}-x^2}{(x^2+${k * k})^2}$。$x=${-k}$ で極小、$x=${k}$ で極大。$x$ が大きくなると $y$ は $0$ に近づくので、${askMax ? `最大値は $x=${k}$ のときの $\\dfrac{${k}}{${2 * k * k}}=${tq(ans)}$` : `最小値は $x=${-k}$ のときの $-\\dfrac{${k}}{${2 * k * k}}=${tq(ans)}$`}。`,
        });
      }
      if (kind === "semi") {
        // y＝x√(k²−x²)（0≦x≦k）の最大値 k²/2
        const k = r.int(2, 6);
        const ans = Q(k * k, 2);
        let hi = 0;
        for (let i = 0; i <= 100000; i++) {
          const x = (k * i) / 100000;
          hi = Math.max(hi, x * Math.sqrt(k * k - x * x));
        }
        nearly(hi, qnum(ans), "最大値の検算", 1e-6);
        return num({
          q: `$0\\le x\\le ${k}$ のとき、関数 $y=x\\sqrt{${k * k}-x^2}$ の最大値を求めなさい。`,
          ans,
          wrongs: [[Q(k ** 4, 4), "MC-EXTREMA-SQRT-FORGET"]],
          explain: `$y'=\\sqrt{${k * k}-x^2}+x\\cdot\\dfrac{-x}{\\sqrt{${k * k}-x^2}}=\\dfrac{${k * k}-2x^2}{\\sqrt{${k * k}-x^2}}$。$x^2=\\dfrac{${k * k}}{2}$ のとき最大で、このとき $y=\\sqrt{x^2(${k * k}-x^2)}=\\sqrt{\\dfrac{${k * k}}{2}\\cdot\\dfrac{${k * k}}{2}}=${tq(ans)}$。`,
        });
      }
      // y＝√x＋√(k−x)（0≦x≦k）の最大値 √(2k)
      const m = r.int(1, 4);
      const k = 2 * m * m; // √(2k) が整数 2m になる
      const ans = 2 * m;
      let hi = 0;
      for (let i = 0; i <= 100000; i++) {
        const x = (k * i) / 100000;
        hi = Math.max(hi, Math.sqrt(x) + Math.sqrt(k - x));
      }
      nearly(hi, ans, "最大値の検算", 1e-6);
      return num({
        q: `$0\\le x\\le ${k}$ のとき、関数 $y=\\sqrt{x}+\\sqrt{${k}-x}$ の最大値を求めなさい。`,
        ans,
        wrongs: [[m * m, "MC-EXTREMA-XVALUE"], [2 * k, "MC-EXTREMA-SQRT-FORGET"]],
        explain: `$y'=\\dfrac{1}{2\\sqrt{x}}-\\dfrac{1}{2\\sqrt{${k}-x}}$ は、$x=${k / 2}$（区間のまん中）で $0$ になり、そこで正から負に変わります。最大値は $\\sqrt{${k / 2}}+\\sqrt{${k / 2}}=2\\times ${m}=${ans}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        if (lv === 1) {
          // 数直線上の運動 x(t)＝t³＋bt²＋ct＋d
          const [b, c, d] = [r.int(-6, 3), r.int(-6, 9), r.int(-5, 5)];
          const t0 = r.int(1, 3);
          const X = Poly.fromCoeffs([Q(d), Q(c), Q(b), Q(1)], "t");
          const V = polyDeriv(X, "t");
          const A = polyDeriv(V, "t");
          const at = (p) => p.eval({ t: t0 });
          nearly(numDeriv(polyFn(X, "t"), t0), qnum(at(V)), "速度の検算", 1e-6);
          return fields({
            q: `数直線上を動く点 P の時刻 $t$ における位置が $x=${pt_(X)}$ で表されるとき、$t=${t0}$ における P の速度 $v$ と加速度 $\\alpha$ を求めなさい。`,
            fields: [
              { id: "v", value: at(V), pre: "速度 $v=$" },
              { id: "a", value: at(A), pre: "加速度 $\\alpha=$" },
            ],
            layout: "lines",
            wrongs: [
              { values: { v: at(X), a: at(V) }, mc: "MC-MOTION-LEVEL" },
              { values: { v: 3 * t0 * t0 + b * t0 + c, a: 6 * t0 + b }, mc: "MC-DERIV-COEF-SKIP" },
            ],
            explain: `速度は位置を $t$ で微分したもの、加速度は速度を $t$ で微分したものです。$v=\\dfrac{dx}{dt}=${pt_(V)}$、$\\alpha=\\dfrac{dv}{dt}=${pt_(A)}$。$t=${t0}$ を代入して $v=${tq(at(V))}$、$\\alpha=${tq(at(A))}$。`,
          });
        }
        if (lv === 2) {
          // 単振動 x＝A sin ωt（または cos）
          const Aa = r.int(1, 5);
          const w = r.int(1, 3);
          const useSin = r.chance(0.5);
          const j = r.int(1, 4); // ωt₀＝jπ/2
          const tq0 = Q(j, 2 * w); // t₀ は π の何倍か
          const S = [0, 1, 0, -1][j % 4]; // sin(jπ/2)
          const C = [1, 0, -1, 0][j % 4]; // cos(jπ/2)
          const v = useSin ? Aa * w * C : -Aa * w * S;
          const acc = useSin ? -Aa * w * w * S : -Aa * w * w * C;
          const t0 = qnum(tq0) * Math.PI;
          const Xf = (tt) => Aa * (useSin ? Math.sin(w * tt) : Math.cos(w * tt));
          nearly(numDeriv(Xf, t0), v, "速度の検算", 1e-6);
          nearly(numDerivN(Xf, t0, 2), acc, "加速度の検算", 1e-4);
          const fnTex = `${Aa === 1 ? "" : Aa}\\${useSin ? "sin" : "cos"} ${w === 1 ? "t" : `${w}t`}`;
          return fields({
            q: `数直線上を動く点 P の時刻 $t$ における位置が $x=${fnTex}$ で表されるとき、$t=${radTex(tq0)}$ における P の速度 $v$ と加速度 $\\alpha$ を求めなさい。`,
            fields: [
              { id: "v", value: v, pre: "速度 $v=$" },
              { id: "a", value: acc, pre: "加速度 $\\alpha=$" },
            ],
            layout: "lines",
            wrongs: [
              ...(w !== 1 ? [{ values: { v: useSin ? Aa * C : -Aa * S, a: useSin ? -Aa * S : -Aa * C }, mc: "MC-DERIV-CHAIN-INNER" }] : []),
              { values: { v: -v, a: -acc }, mc: useSin ? "MC-DERIV-SIN-SIGN" : "MC-DERIV-COS-SIGN" },
            ],
            explain: `$v=\\dfrac{dx}{dt}=${useSin ? `${Aa * w}\\cos ${w === 1 ? "t" : `${w}t`}` : `-${Aa * w}\\sin ${w === 1 ? "t" : `${w}t`}`}$、$\\alpha=\\dfrac{dv}{dt}=-${Aa * w * w}\\${useSin ? "sin" : "cos"} ${w === 1 ? "t" : `${w}t`}$（中の $${w}t$ の微分 $${w}$ もかける）。$t=${radTex(tq0)}$ のとき $${w === 1 ? "t" : `${w}t`}=${radTex(Q(j, 2))}$ で、$\\sin$ の値は $${S}$、$\\cos$ の値は $${C}$。よって $v=${v}$、$\\alpha=${acc}$。`,
          });
        }
        // 平面上の運動 (x, y)＝(at, bt−ct²)：速度と速さ
        const [p0, q0, h] = r.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 6, 10], [4, 3, 5], [12, 5, 13]]);
        const t0 = r.int(1, 3);
        const c = r.int(1, 2);
        const vy = q0 * r.sign();
        const b = vy + 2 * c * t0;
        const vx = p0;
        nearly(Math.hypot(vx, b - 2 * c * t0), h, "速さの検算", 1e-12);
        const yT = sumTex(term(b, "t"), term(-c, "t^2"));
        return fields({
          q: `座標平面上を動く点 P の時刻 $t$ における座標が $(x,\\ y)=(${vx === 1 ? "" : vx}t,\\ ${yT})$ で表されるとき、$t=${t0}$ における P の速度 $\\vec{v}=(v_x,\\ v_y)$ と速さ $|\\vec{v}|$ を求めなさい。`,
          fields: [
            { id: "vx", value: vx, pre: "$v_x=$" },
            { id: "vy", value: vy, pre: "$v_y=$" },
            { id: "s", value: h, pre: "速さ $=$" },
          ],
          layout: "lines",
          wrongs: [{ values: { vx, vy, s: h * h }, mc: "MC-VECTOR-NORM" }],
          explain: `$v_x=\\dfrac{dx}{dt}=${vx}$、$v_y=\\dfrac{dy}{dt}=${sumTex(cst(b), term(-2 * c, "t"))}$ なので、$t=${t0}$ では $\\vec v=(${vx},\\ ${vy})$。速さは速度の大きさで、$\\sqrt{${vx * vx}+${vy * vy}}=${h}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "choice",
      (r, lv) => {
        const cnt = (n) => `${n} 個`;
        const all = (n, mc = "MC-ROOTCOUNT-GRAPH") => [0, 1, 2, 3].filter((v) => v !== n).map((v) => [cnt(v), mc]);
        if (lv === 1) {
          const a = r.pick([1, 2]);
          const M = 2 * a ** 3;
          const K = r.pick([M + r.int(1, 4), M, r.int(-M + 1, M - 1), -M, -M - r.int(1, 4)]);
          const n = Math.abs(K) > M ? 1 : Math.abs(K) === M ? 2 : 3;
          const g = (x) => x ** 3 - 3 * a * a * x - K;
          const tangents = Math.abs(K) === M ? [K > 0 ? -a : a] : [];
          for (const x of tangents) nearly(g(x), 0, "接する点の検算", 1e-12);
          assert(countRoots(g, -20, 20, 200000, tangents) === n, "解の個数の検算");
          return choice({
            q: `方程式 $x^3-${3 * a * a === 1 ? "" : 3 * a * a}x=${K}$ の異なる実数解の個数を答えなさい。`,
            correct: cnt(n),
            wrongs: all(n),
            explain: `$f(x)=x^3-${3 * a * a}x$ とおくと $f'(x)=3(x+${a})(x-${a})$ で、$x=${-a}$ で極大値 $${M}$、$x=${a}$ で極小値 $${-M}$。解の個数は、グラフ $y=f(x)$ と直線 $y=${K}$ の共有点の数です。$${K}$ は${n === 3 ? `$${-M}$ と $${M}$ の間なので 3 個` : n === 2 ? "極値と等しい（直線がグラフに接する）ので 2 個" : "極大値より大きい（または極小値より小さい）ので 1 個"}。`,
          });
        }
        if (lv === 2) {
          // eˣ＝kx：直線 y＝kx と曲線 y＝eˣ（接するのは k＝e のとき）
          const k = r.pick([-2, -1, 1, 2, 3, 4, 5]);
          const n = k < 0 ? 1 : k < Math.E ? 0 : 2;
          assert(countRoots((x) => Math.exp(x) - k * x, -40, 40) === n, "解の個数の検算");
          return choice({
            q: `方程式 $e^{x}=${k === 1 ? "" : k === -1 ? "-" : k}x$ の異なる実数解の個数を答えなさい。（$e$ は自然対数の底で、$e=2.71\\cdots$）`,
            correct: cnt(n),
            wrongs: all(n),
            explain: `曲線 $y=e^{x}$ と直線 $y=${k === 1 ? "" : k === -1 ? "-" : k}x$ の共有点の数を考えます。原点を通る直線が $y=e^{x}$ に接するのは、傾きが $e$ のとき（接点 $(1,\\ e)$）。${k < 0 ? "傾きが負なら、共有点はちょうど 1 個" : k < Math.E ? `傾き $${k}$ は $e$ より小さいので、共有点はありません（0 個）` : `傾き $${k}$ は $e$ より大きいので、共有点は 2 個`}。`,
          });
        }
        // log x＝kx ⇔ k＝(log x)/x、または xe⁻ˣ＝k
        if (r.chance(0.5)) {
          const kk = r.pick([Q(-1), Q(-1, 2), Q(1, 2), Q(1, 3), Q(1, 4), Q(1), Q(1, 5)]);
          const kv = qnum(kk);
          const n = kv <= 0 ? 1 : kv < 1 / Math.E ? 2 : 0;
          assert(countRoots((x) => Math.log(x) - kv * x, 1e-6, 400, 400000) === n, "解の個数の検算");
          return choice({
            q: `方程式 $\\log x=${kk.n === 1 && kk.d === 1 ? "" : kk.n === -1 && kk.d === 1 ? "-" : tq(kk)}x$ の異なる実数解の個数を答えなさい。（$\\log$ は自然対数、$e=2.71\\cdots$）`,
            correct: cnt(n),
            wrongs: all(n),
            explain: `$x>0$ で両辺を $x$ でわると $\\dfrac{\\log x}{x}=${tq(kk)}$。$g(x)=\\dfrac{\\log x}{x}$ は $g'(x)=\\dfrac{1-\\log x}{x^2}$ より $x=e$ で最大値 $\\dfrac{1}{e}$（$=0.36\\cdots$）をとり、$x\\to+0$ で $-\\infty$、$x\\to\\infty$ で $0$ に近づきます。直線 $y=${tq(kk)}$ との共有点は、${kv <= 0 ? "1 個" : kv < 1 / Math.E ? `$0<${tq(kk)}<\\dfrac{1}{e}$ なので 2 個` : `$${tq(kk)}>\\dfrac{1}{e}$ なので 0 個`}。`,
          });
        }
        const kk = r.pick([Q(-1), Q(-2), Q(1, 4), Q(1, 3), Q(1, 2), Q(1), Q(1, 5)]);
        const kv = qnum(kk);
        const n = kv < 0 ? 1 : kv < 1 / Math.E ? 2 : 0;
        assert(countRoots((x) => x * Math.exp(-x) - kv, -30, 400, 400000) === n, "解の個数の検算");
        return choice({
          q: `方程式 $xe^{-x}=${tq(kk)}$ の異なる実数解の個数を答えなさい。（$e=2.71\\cdots$）`,
          correct: cnt(n),
          wrongs: all(n),
          explain: `$g(x)=xe^{-x}$ とおくと $g'(x)=(1-x)e^{-x}$ なので、$x=1$ で最大値 $\\dfrac{1}{e}$（$=0.36\\cdots$）。$x\\to-\\infty$ で $-\\infty$、$x\\to\\infty$ で $0$ に近づきます（$0$ より大きいまま）。直線 $y=${tq(kk)}$ との共有点は、${kv < 0 ? "1 個" : kv < 1 / Math.E ? `$0<${tq(kk)}<\\dfrac{1}{e}$ なので 2 個` : `$${tq(kk)}>\\dfrac{1}{e}$ なので 0 個`}。`,
        });
      },
      { id: "c", finite: true },
    ),
  ],

  // ── 区分求積法 ─────────────────────────────────
  integ_riemann: [
    t("num", (r, lv) => {
      const N = 20000;
      const riemann = (f, k0, k1) => {
        let s = 0;
        for (let k = k0; k <= k1; k++) s += f(k, N);
        return s;
      };
      const pw = (base, p) => (p === 1 ? base : `${base}^{${p}}`);
      const kn = (p) => (p === 1 ? "\\dfrac{k}{n}" : `\\left(\\dfrac{k}{n}\\right)^{${p}}`); // (k/n)^p
      if (lv === 1) {
        const p = r.int(1, 4);
        const c = r.pick([1, 2, 3]);
        const ans = Q(c, p + 1);
        nearly((c * riemann((k, n) => (k / n) ** p, 1, N)) / N, qnum(ans), "区分求積の検算", 1e-3);
        const form = r.chance(0.5);
        const q = form
          ? `\\displaystyle\\lim_{n\\to\\infty}\\dfrac{${c}}{n^{${p + 1}}}\\sum_{k=1}^{n}${pw("k", p)}`
          : `\\displaystyle\\lim_{n\\to\\infty}\\dfrac{${c}}{n}\\sum_{k=1}^{n}${kn(p)}`;
        return num({
          q: `極限値 $${q}$ を求めなさい。`,
          ans,
          wrongs: [[Q(c, p), "MC-INTEG-DIV-N"], [c, "MC-INTEG-NO-DIV"]],
          explain: `${form ? `$\\dfrac{${c}}{n^{${p + 1}}}\\sum ${pw("k", p)}=\\dfrac{${c}}{n}\\sum ${kn(p)}$ と変形します。` : ""}区分求積法により、$\\displaystyle\\lim_{n\\to\\infty}\\dfrac{1}{n}\\sum_{k=1}^{n}f\\left(\\dfrac{k}{n}\\right)=\\int_0^1 f(x)\\,dx$。よって $\\displaystyle\\int_0^1 ${c === 1 ? "" : c}${pw("x", p)}\\,dx=${tq(ans)}$。`,
        });
      }
      if (lv === 2) {
        const p = r.int(1, 2);
        if (r.chance(0.55)) {
          // k＝1〜mn → ∫₀ᵐ
          const m = r.pick([2, 3]);
          const ans = Q(m ** (p + 1), p + 1);
          nearly(riemann((k, n) => (k / n) ** p, 1, m * N) / N, qnum(ans), "区分求積の検算", 1e-3);
          return num({
            q: `極限値 $\\displaystyle\\lim_{n\\to\\infty}\\dfrac{1}{n}\\sum_{k=1}^{${m}n}${kn(p)}$ を求めなさい。`,
            ans,
            wrongs: [[Q(1, p + 1), "MC-RIEMANN-RANGE"], [Q(m, p + 1), "MC-RIEMANN-RANGE"]],
            explain: `$\\dfrac{k}{n}$ は $\\dfrac{1}{n}$ から $\\dfrac{${m}n}{n}=${m}$ まで動くので、区間は $0$ から $${m}$。$\\displaystyle\\int_0^{${m}}${pw("x", p)}\\,dx=\\dfrac{${m ** (p + 1)}}{${p + 1}}${ans.d === p + 1 ? "" : `=${tq(ans)}`}$。`,
          });
        }
        // k＝n＋1〜2n → ∫₁²
        const ans = Q(2 ** (p + 1) - 1, p + 1);
        nearly(riemann((k, n) => (k / n) ** p, N + 1, 2 * N) / N, qnum(ans), "区分求積の検算", 1e-3);
        return num({
          q: `極限値 $\\displaystyle\\lim_{n\\to\\infty}\\dfrac{1}{n}\\sum_{k=n+1}^{2n}${kn(p)}$ を求めなさい。`,
          ans,
          wrongs: [[Q(2 ** (p + 1), p + 1), "MC-INTEG-DEF-UPPER-ONLY"], [Q(1, p + 1), "MC-RIEMANN-RANGE"]],
          explain: `$\\dfrac{k}{n}$ は $\\dfrac{n+1}{n}$（ほぼ $1$）から $2$ まで動くので、区間は $1$ から $2$。$\\displaystyle\\int_1^{2}${pw("x", p)}\\,dx=\\dfrac{${2 ** (p + 1)}-1}{${p + 1}}=${tq(ans)}$。`,
        });
      }
      if (r.chance(0.5)) {
        // Σ(an＋bk)²/n³ → ∫₀¹(a＋bx)²dx
        const a = r.int(1, 3);
        const b = r.nz(-2, 3);
        const ans = Q(3 * a * a + 3 * a * b + b * b, 3);
        nearly(riemann((k, n) => (a * n + b * k) ** 2 / n ** 3, 1, N), qnum(ans), "区分求積の検算", 1e-3);
        const inner = `${a === 1 ? "" : a}n${b > 0 ? "+" : "-"}${Math.abs(b) === 1 ? "" : Math.abs(b)}k`;
        const innerX = `${a}${b > 0 ? "+" : "-"}${Math.abs(b) === 1 ? "" : Math.abs(b)}x`;
        return num({
          q: `極限値 $\\displaystyle\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\dfrac{(${inner})^2}{n^3}$ を求めなさい。`,
          ans,
          wrongs: [[(a + b) ** 2, "MC-RIEMANN-ENDPOINT"], [Q(3 * a * a + b * b, 3), "MC-SQUARE-CROSS-TERM"]],
          explain: `$\\dfrac{(${inner})^2}{n^3}=\\dfrac{1}{n}\\left(${a}${b > 0 ? "+" : "-"}${Math.abs(b) === 1 ? "" : Math.abs(b)}\\cdot\\dfrac{k}{n}\\right)^2$ と変形すると、区分求積法により $\\displaystyle\\int_0^1(${innerX})^2\\,dx=\\int_0^1\\left(${a * a}${sgn(2 * a * b)}x${b * b === 1 ? "+" : `+${b * b}`}x^2\\right)dx=${a * a}${sq(Q(a * b))}${sq(Q(b * b, 3))}=${tq(ans)}$。`,
        });
      }
      // Σk(cn−k)/n³ → ∫₀¹x(c−x)dx
      const c = r.int(1, 4);
      const ans = Q(3 * c - 2, 6);
      nearly(riemann((k, n) => (k * (c * n - k)) / n ** 3, 1, N), qnum(ans), "区分求積の検算", 1e-3);
      return num({
        q: `極限値 $\\displaystyle\\lim_{n\\to\\infty}\\sum_{k=1}^{n}\\dfrac{k(${c === 1 ? "" : c}n-k)}{n^3}$ を求めなさい。`,
        ans,
        wrongs: [[c - 1, "MC-RIEMANN-ENDPOINT"]],
        explain: `$\\dfrac{k(${c === 1 ? "" : c}n-k)}{n^3}=\\dfrac{1}{n}\\cdot\\dfrac{k}{n}\\left(${c}-\\dfrac{k}{n}\\right)$ と変形すると、区分求積法により $\\displaystyle\\int_0^1 x(${c}-x)\\,dx=\\dfrac{${c}}{2}-\\dfrac{1}{3}=${tq(ans)}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        const I = (a, b, f) => `$\\displaystyle\\int_{${a}}^{${b}}${f}\\,dx$`;
        const L1 = [
          { term: "\\sqrt{\\dfrac{k}{n}}", f: "\\sqrt{x}" },
          { term: "e^{\\frac{k}{n}}", f: "e^{x}" },
          { term: "\\dfrac{1}{1+\\frac{k}{n}}", f: "\\dfrac{1}{1+x}" },
          { term: "\\sin\\dfrac{k\\pi}{n}", f: "\\sin\\pi x" },
          { term: "\\left(\\dfrac{k}{n}\\right)^3", f: "x^3" },
          { term: "\\cos\\dfrac{k\\pi}{2n}", f: "\\cos\\dfrac{\\pi x}{2}" },
        ];
        if (lv === 1) {
          const e = r.pick(L1);
          return choice({
            q: `$\\displaystyle\\lim_{n\\to\\infty}\\dfrac{1}{n}\\sum_{k=1}^{n}${e.term}$ を定積分で表したものはどれですか。`,
            correct: I(0, 1, e.f),
            wrongs: [[I(0, "n", e.f), "MC-RIEMANN-RANGE"], [I(1, 2, e.f), "MC-RIEMANN-RANGE"], [`$\\displaystyle n\\int_{0}^{1}${e.f}\\,dx$`, "MC-RIEMANN-FORM"]],
            explain: `$\\dfrac{k}{n}$ を $x$、$\\dfrac{1}{n}$ を $dx$ と見ます。$k$ が $1$ から $n$ まで動くと $x=\\dfrac{k}{n}$ は $0$ から $1$ まで動くので、${I(0, 1, e.f)}。`,
          });
        }
        if (lv === 2) {
          const L2 = [
            { sum: "\\sum_{k=1}^{n}\\dfrac{1}{n+k}", how: "\\dfrac{1}{n}\\cdot\\dfrac{1}{1+\\frac{k}{n}}", f: "\\dfrac{1}{1+x}", w: [[I(0, 1, "\\dfrac{1}{x}"), "MC-RIEMANN-FORM"], [I(1, 2, "\\dfrac{1}{1+x}"), "MC-RIEMANN-RANGE"], [I(0, 1, "\\dfrac{n}{1+x}"), "MC-RIEMANN-FORM"]] },
            { sum: "\\sum_{k=1}^{n}\\dfrac{n}{n^2+k^2}", how: "\\dfrac{1}{n}\\cdot\\dfrac{1}{1+\\left(\\frac{k}{n}\\right)^2}", f: "\\dfrac{1}{1+x^2}", w: [[I(0, 1, "\\dfrac{1}{1+x}"), "MC-RIEMANN-FORM"], [I(0, 1, "\\dfrac{x}{1+x^2}"), "MC-RIEMANN-FORM"], [I(1, 2, "\\dfrac{1}{1+x^2}"), "MC-RIEMANN-RANGE"]] },
            { sum: "\\sum_{k=1}^{n}\\dfrac{k}{n^2+k^2}", how: "\\dfrac{1}{n}\\cdot\\dfrac{\\frac{k}{n}}{1+\\left(\\frac{k}{n}\\right)^2}", f: "\\dfrac{x}{1+x^2}", w: [[I(0, 1, "\\dfrac{1}{1+x^2}"), "MC-RIEMANN-FORM"], [I(0, 1, "\\dfrac{x}{1+x}"), "MC-RIEMANN-FORM"], [I(1, 2, "\\dfrac{x}{1+x^2}"), "MC-RIEMANN-RANGE"]] },
            { sum: "\\sum_{k=1}^{n}\\dfrac{\\sqrt{k}}{n\\sqrt{n}}", how: "\\dfrac{1}{n}\\sqrt{\\dfrac{k}{n}}", f: "\\sqrt{x}", w: [[I(0, 1, "x\\sqrt{x}"), "MC-RIEMANN-FORM"], [I(0, "n", "\\sqrt{x}"), "MC-RIEMANN-RANGE"], [I(1, 2, "\\sqrt{x}"), "MC-RIEMANN-RANGE"]] },
            { sum: "\\sum_{k=1}^{n}\\dfrac{k^2}{n^3}", how: "\\dfrac{1}{n}\\left(\\dfrac{k}{n}\\right)^2", f: "x^2", w: [[I(0, 1, "x^3"), "MC-RIEMANN-FORM"], [I(0, 1, "x"), "MC-RIEMANN-FORM"], [I(0, "n", "x^2"), "MC-RIEMANN-RANGE"]] },
          ];
          const e = r.pick(L2);
          return choice({
            q: `$\\displaystyle\\lim_{n\\to\\infty}${e.sum}$ を定積分で表したものはどれですか。`,
            correct: I(0, 1, e.f),
            wrongs: e.w,
            explain: `$\\dfrac{1}{n}$ をくくり出して $\\dfrac{k}{n}$ の式にします。1つの項は $${e.how}$ なので、区分求積法により ${I(0, 1, e.f)}。`,
          });
        }
        const L3 = [
          { lo: 1, hi: "2n", f: "x^2", term: "\\left(\\dfrac{k}{n}\\right)^2", a: 0, b: 2, w: [[I(0, 1, "x^2"), "MC-RIEMANN-RANGE"], [`$\\displaystyle 2\\int_{0}^{1}x^2\\,dx$`, "MC-RIEMANN-RANGE"], [I(1, 2, "x^2"), "MC-RIEMANN-RANGE"]] },
          { lo: 1, hi: "3n", f: "e^{x}", term: "e^{\\frac{k}{n}}", a: 0, b: 3, w: [[I(0, 1, "e^{x}"), "MC-RIEMANN-RANGE"], [`$\\displaystyle 3\\int_{0}^{1}e^{x}\\,dx$`, "MC-RIEMANN-RANGE"], [I(1, 3, "e^{x}"), "MC-RIEMANN-RANGE"]] },
          { lo: "n+1", hi: "2n", f: "\\sqrt{x}", term: "\\sqrt{\\dfrac{k}{n}}", a: 1, b: 2, w: [[I(0, 1, "\\sqrt{x}"), "MC-RIEMANN-RANGE"], [I(0, 2, "\\sqrt{x}"), "MC-RIEMANN-RANGE"], [I("n", "2n", "\\sqrt{x}"), "MC-RIEMANN-RANGE"]] },
          { lo: "n+1", hi: "2n", f: "\\dfrac{1}{x}", term: "\\dfrac{n}{k}", a: 1, b: 2, w: [[I(0, 1, "\\dfrac{1}{x}"), "MC-RIEMANN-RANGE"], [I(0, 2, "\\dfrac{1}{x}"), "MC-RIEMANN-RANGE"], [I(1, 2, "\\dfrac{1}{1+x}"), "MC-RIEMANN-FORM"]] },
          { lo: "n+1", hi: "3n", f: "x^3", term: "\\left(\\dfrac{k}{n}\\right)^3", a: 1, b: 3, w: [[I(0, 2, "x^3"), "MC-RIEMANN-RANGE"], [I(0, 3, "x^3"), "MC-RIEMANN-RANGE"], [I(1, 2, "x^3"), "MC-RIEMANN-RANGE"]] },
        ];
        const e = r.pick(L3);
        return choice({
          q: `$\\displaystyle\\lim_{n\\to\\infty}\\dfrac{1}{n}\\sum_{k=${e.lo}}^{${e.hi}}${e.term}$ を定積分で表したものはどれですか。`,
          correct: I(e.a, e.b, e.f),
          wrongs: e.w,
          explain: `$x=\\dfrac{k}{n}$ とおくと、$k=${e.lo}$ のとき $x$ はほぼ $${e.a}$、$k=${e.hi}$ のとき $x=${e.b}$。区間の端を $k$ の動く範囲から決めて ${I(e.a, e.b, e.f)}。`,
        });
      },
      { id: "b", finite: true },
    ),
  ],

  // ── 積分の応用（体積・曲線の長さ・道のり） ──────────────────
  integ_app: [
    t("num", (r, lv) => {
      const ask = "を $x$ 軸のまわりに1回転してできる立体の体積は $\\square\\,\\pi$ です。$\\square$ に入る数を求めなさい。";
      const vol = (f, a, b) => numInteg((x) => f(x) ** 2, a, b);
      if (lv === 1) {
        if (r.chance(0.5)) {
          // 円すい：y＝mx（0≦x≦h）
          const m = r.pick([Q(1), Q(2), Q(1, 2), Q(3)]);
          const h = r.int(1, 4);
          const ans = div(mul(mul(m, m), h ** 3), 3);
          nearly(vol((x) => qnum(m) * x, 0, h), qnum(ans), "体積の検算", 1e-9);
          return num({
            q: `直線 $y=${m.d === 1 && m.n === 1 ? "" : tq(m)}x$ と $x$ 軸、直線 $x=${h}$ で囲まれた部分${ask}`,
            ans,
            wrongs: [[div(mul(m, h * h), 2), "MC-VOLUME-NO-SQUARE"], [mul(mul(m, m), h ** 3), "MC-INTEG-NO-DIV"]],
            explain: `$V=\\pi\\displaystyle\\int_0^{${h}}y^2\\,dx=\\pi\\int_0^{${h}}${tq(mul(m, m)) === "1" ? "" : tq(mul(m, m))}x^2\\,dx=\\pi\\left[${tq(div(mul(m, m), 3)) === "1" ? "" : tq(div(mul(m, m), 3))}x^3\\right]_0^{${h}}=${tq(ans)}\\pi$。（底面の半径 $${tq(mul(m, h))}$、高さ $${h}$ の円すいの体積と同じ）`,
          });
        }
        // y＝√(kx)（0≦x≦h）
        const k = r.int(1, 4);
        const h = r.int(1, 4);
        const ans = Q(k * h * h, 2);
        nearly(vol((x) => Math.sqrt(k * x), 0, h), qnum(ans), "体積の検算", 1e-9);
        const noSq = isqrt(k * h ** 3); // ∫√(kx)dx＝(2/3)√k·h^{3/2}（有理数になるときだけ誤答に使う）
        return num({
          q: `曲線 $y=\\sqrt{${k === 1 ? "" : k}x}$ と $x$ 軸、直線 $x=${h}$ で囲まれた部分${ask}`,
          ans,
          wrongs: [[k * h * h, "MC-INTEG-NO-DIV"], ...(noSq !== null ? [[Q(2 * noSq, 3), "MC-VOLUME-NO-SQUARE"]] : [])],
          explain: `$V=\\pi\\displaystyle\\int_0^{${h}}y^2\\,dx=\\pi\\int_0^{${h}}${k === 1 ? "" : k}x\\,dx=\\pi\\left[\\dfrac{${k === 1 ? "" : k}x^2}{2}\\right]_0^{${h}}=${tq(ans)}\\pi$。（$y$ ではなく $y^2$ を積分する）`,
        });
      }
      if (lv === 2) {
        if (r.chance(0.5)) {
          const a = r.int(1, 3);
          const ans = Q(a ** 5, 5);
          nearly(vol((x) => x * x, 0, a), qnum(ans), "体積の検算", 1e-9);
          return num({
            q: `曲線 $y=x^2$ と $x$ 軸、直線 $x=${a}$ で囲まれた部分${ask}`,
            ans,
            wrongs: [[Q(a ** 3, 3), "MC-VOLUME-NO-SQUARE"], [Q(a ** 5, 4), "MC-INTEG-DIV-N"]],
            explain: `$V=\\pi\\displaystyle\\int_0^{${a}}(x^2)^2\\,dx=\\pi\\int_0^{${a}}x^4\\,dx=\\pi\\left[\\dfrac{x^5}{5}\\right]_0^{${a}}=${tq(ans)}\\pi$。`,
          });
        }
        // 楕円 x²/A²＋y²/B²＝1 を x 軸のまわりに：4πAB²/3
        const [A, B] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u !== v);
        const ans = Q(4 * A * B * B, 3);
        const xa = A === 1 ? "x^2" : `\\dfrac{x^2}{${A * A}}`; // x²/A²
        nearly(vol((x) => B * Math.sqrt(Math.max(0, 1 - (x * x) / (A * A))), -A, A), qnum(ans), "体積の検算", 1e-6);
        return num({
          q: `楕円 $${xa}+${B === 1 ? "y^2" : `\\dfrac{y^2}{${B * B}}`}=1$ で囲まれた部分${ask}`,
          ans,
          wrongs: [[Q(4 * A * A * B, 3), "MC-VOLUME-AXIS"], [Q(2 * A * B * B, 3), "MC-SYMMETRY-FACTOR"]],
          explain: `$y^2=${B * B}\\left(1-${xa}\\right)$ なので $V=\\pi\\displaystyle\\int_{-${A}}^{${A}}${B * B}\\left(1-${xa}\\right)dx=2\\pi\\int_{0}^{${A}}${B * B}\\left(1-${xa}\\right)dx=2\\pi\\times ${B * B}\\times\\left(${A}-\\dfrac{${A}}{3}\\right)=${tq(ans)}\\pi$。`,
        });
      }
      // 2曲線ではさまれた部分（ドーナツ型）：外側² − 内側²
      if (r.chance(0.5)) {
        const k = r.int(1, 3);
        const ans = Q(2 * k ** 5, 15);
        nearly(numInteg((x) => (k * x) ** 2 - x ** 4, 0, k), qnum(ans), "体積の検算", 1e-9);
        return num({
          q: `直線 $y=${k === 1 ? "" : k}x$ と放物線 $y=x^2$ で囲まれた部分${ask}`,
          ans,
          wrongs: [[Q(k ** 5, 30), "MC-VOLUME-WASHER"], [Q(k ** 3, 6), "MC-VOLUME-NO-SQUARE"]],
          explain: `交点は $x=0,\\ ${k}$ で、この間では直線が上（外側）。回転体は「外側の立体から内側の立体をくりぬいた形」なので、$V=\\pi\\displaystyle\\int_0^{${k}}\\left\\{(${k === 1 ? "" : k}x)^2-(x^2)^2\\right\\}dx=\\pi\\left(\\dfrac{${k * k}\\cdot ${k ** 3}}{3}-\\dfrac{${k ** 5}}{5}\\right)=${tq(ans)}\\pi$。（差を2乗するのではなく、2乗の差）`,
        });
      }
      const k = r.int(1, 4);
      const ans = Q(k ** 3, 6);
      nearly(numInteg((x) => k * x - x * x, 0, k), qnum(ans), "体積の検算", 1e-9);
      return num({
        q: `曲線 $y=\\sqrt{${k === 1 ? "" : k}x}$ と直線 $y=x$ で囲まれた部分${ask}`,
        ans,
        wrongs: [[Q(k ** 3, 30), "MC-VOLUME-WASHER"]],
        explain: `交点は $x=0,\\ ${k}$ で、この間では $y=\\sqrt{${k === 1 ? "" : k}x}$ が上（外側）。$V=\\pi\\displaystyle\\int_0^{${k}}\\left\\{(\\sqrt{${k === 1 ? "" : k}x})^2-x^2\\right\\}dx=\\pi\\int_0^{${k}}(${k === 1 ? "" : k}x-x^2)\\,dx=${tq(ans)}\\pi$。（差を2乗するのではなく、2乗の差）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const len = (dy, a, b) => numInteg((x) => Math.sqrt(1 + dy(x) ** 2), a, b);
        if (lv === 1) {
          // y＝(2k/3)x^{3/2}：y′＝k√x、√(1＋y′²)＝√(1＋k²x)
          const k = r.pick([1, 2]);
          const a = k === 1 ? r.pick([3, 8, 15, 24]) : r.pick([2, 6, 12]);
          const s = isqrt(1 + k * k * a);
          const ans = Q(2 * (s ** 3 - 1), 3 * k * k);
          nearly(len((x) => k * Math.sqrt(x), 0, a), qnum(ans), "曲線の長さの検算", 1e-7);
          const kx = k === 1 ? "x" : `${k * k}x`;
          return num({
            q: `曲線 $y=\\dfrac{${2 * k}}{3}x\\sqrt{x}$ の $0\\le x\\le ${a}$ の部分の長さを求めなさい。`,
            ans,
            wrongs: [[Q(2 * a + k * k * a * a, 2), "MC-ARCLEN-FORMULA"]],
            explain: `$y'=${k === 1 ? "" : k}\\sqrt{x}$ なので $\\sqrt{1+(y')^2}=\\sqrt{1+${kx}}$。長さは $\\displaystyle\\int_0^{${a}}\\sqrt{1+${kx}}\\,dx=\\left[\\dfrac{2}{3${k === 1 ? "" : `\\cdot ${k * k}`}}(1+${kx})^{\\frac{3}{2}}\\right]_0^{${a}}=\\dfrac{2}{${3 * k * k}}(${s ** 3}-1)=${tq(ans)}$。`,
          });
        }
        if (lv === 2) {
          if (r.chance(0.5)) {
            // y＝(1/3)(x²＋2)^{3/2}：√(1＋y′²)＝x²＋1
            const a = r.int(1, 3);
            const ans = Q(a ** 3 + 3 * a, 3);
            nearly(len((x) => x * Math.sqrt(x * x + 2), 0, a), qnum(ans), "曲線の長さの検算", 1e-7);
            return num({
              q: `曲線 $y=\\dfrac{1}{3}(x^2+2)\\sqrt{x^2+2}$ の $0\\le x\\le ${a}$ の部分の長さを求めなさい。`,
              ans,
              wrongs: [[add(Q(a ** 5, 5), Q(2 * a ** 3 + 3 * a, 3)), "MC-ARCLEN-FORMULA"]],
              explain: `$y'=x\\sqrt{x^2+2}$ なので $1+(y')^2=x^4+2x^2+1=(x^2+1)^2$。長さは $\\displaystyle\\int_0^{${a}}(x^2+1)\\,dx=\\dfrac{${a ** 3}}{3}+${a}=${tq(ans)}$。`,
            });
          }
          // y＝x³/6＋1/(2x)：√(1＋y′²)＝x²/2＋1/(2x²)
          const a = r.int(2, 4);
          const ans = add(sub(Q(a ** 3, 6), Q(1, 2 * a)), Q(1, 3));
          nearly(len((x) => (x * x) / 2 - 1 / (2 * x * x), 1, a), qnum(ans), "曲線の長さの検算", 1e-7);
          const dh = sub(add(Q(a ** 3, 6), Q(1, 2 * a)), Q(2, 3)); // y(a)−y(1)
          return num({
            q: `曲線 $y=\\dfrac{x^3}{6}+\\dfrac{1}{2x}$ の $1\\le x\\le ${a}$ の部分の長さを求めなさい。`,
            ans,
            wrongs: [[dh, "MC-ARCLEN-FORMULA"]],
            explain: `$y'=\\dfrac{x^2}{2}-\\dfrac{1}{2x^2}$ なので $1+(y')^2=\\left(\\dfrac{x^2}{2}+\\dfrac{1}{2x^2}\\right)^2$。長さは $\\displaystyle\\int_1^{${a}}\\left(\\dfrac{x^2}{2}+\\dfrac{1}{2x^2}\\right)dx=\\left[\\dfrac{x^3}{6}-\\dfrac{1}{2x}\\right]_1^{${a}}=${tq(ans)}$。`,
          });
        }
        // 媒介変数で表された曲線の長さ
        const kind = r.pick(["cyc", "ast", "tsch"]);
        const speedLen = (dx, dy, a, b) => numInteg((tt) => Math.hypot(dx(tt), dy(tt)), a, b, 20000);
        if (kind === "cyc") {
          const a = r.int(1, 4);
          nearly(speedLen((tt) => a * (1 - Math.cos(tt)), (tt) => a * Math.sin(tt), 0, 2 * Math.PI), 8 * a, "曲線の長さの検算", 1e-6);
          return num({
            q: `サイクロイド $x=${a === 1 ? "" : a}(t-\\sin t)$、$y=${a === 1 ? "" : a}(1-\\cos t)$ の $0\\le t\\le 2\\pi$ の部分の長さを求めなさい。`,
            ans: 8 * a,
            explain: `$\\left(\\dfrac{dx}{dt}\\right)^2+\\left(\\dfrac{dy}{dt}\\right)^2=${a * a}\\{(1-\\cos t)^2+\\sin^2t\\}=${2 * a * a}(1-\\cos t)=${4 * a * a}\\sin^2\\dfrac{t}{2}$。$0\\le t\\le 2\\pi$ で $\\sin\\dfrac{t}{2}\\ge 0$ なので、長さは $\\displaystyle\\int_0^{2\\pi}${2 * a}\\sin\\dfrac{t}{2}\\,dt=\\left[-${4 * a}\\cos\\dfrac{t}{2}\\right]_0^{2\\pi}=${8 * a}$。`,
          });
        }
        if (kind === "ast") {
          const a = r.int(1, 4);
          nearly(speedLen((tt) => -3 * a * Math.cos(tt) ** 2 * Math.sin(tt), (tt) => 3 * a * Math.sin(tt) ** 2 * Math.cos(tt), 0, 2 * Math.PI), 6 * a, "曲線の長さの検算", 1e-6);
          return num({
            q: `アステロイド $x=${a === 1 ? "" : a}\\cos^3t$、$y=${a === 1 ? "" : a}\\sin^3t$（$0\\le t\\le 2\\pi$）の長さ（1周）を求めなさい。`,
            ans: 6 * a,
            wrongs: [[0, "MC-INTEG-ABS-IGNORE"], [Q(3 * a, 2), "MC-SYMMETRY-FACTOR"]],
            explain: `$\\left(\\dfrac{dx}{dt}\\right)^2+\\left(\\dfrac{dy}{dt}\\right)^2=${9 * a * a}\\sin^2t\\cos^2t(\\cos^2t+\\sin^2t)=${9 * a * a}\\sin^2t\\cos^2t$。図形は4つの部分が同じ形なので、$0\\le t\\le\\dfrac{\\pi}{2}$ の長さを4倍します。$4\\displaystyle\\int_0^{\\frac{\\pi}{2}}${3 * a}\\sin t\\cos t\\,dt=4\\times\\dfrac{${3 * a}}{2}=${6 * a}$。`,
          });
        }
        const T = r.int(1, 3);
        const ans = 3 * T + T ** 3;
        nearly(speedLen((tt) => 6 * tt, (tt) => 3 - 3 * tt * tt, 0, T), ans, "曲線の長さの検算", 1e-7);
        return num({
          q: `$x=3t^2$、$y=3t-t^3$ で表される曲線の $0\\le t\\le ${T}$ の部分の長さを求めなさい。`,
          ans,
          wrongs: [[add(Q(9 * T), add(Q(6 * T ** 3), Q(9 * T ** 5, 5))), "MC-ARCLEN-FORMULA"]],
          explain: `$\\left(\\dfrac{dx}{dt}\\right)^2+\\left(\\dfrac{dy}{dt}\\right)^2=36t^2+(3-3t^2)^2=9(1+t^2)^2$。長さは $\\displaystyle\\int_0^{${T}}3(1+t^2)\\,dt=3\\times ${T}+${T}^3=${ans}$。（√ をとってから積分する）`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        const ask = "動く道のり（実際に動いた距離の合計）を求めなさい。";
        if (lv === 1) {
          // v＝a(t−p)（0≦t≦T、0＜p＜T）
          const a = r.int(1, 3);
          const T = r.int(2, 6);
          const p = r.int(1, T - 1);
          const dist = Q(a * (p * p + (T - p) ** 2), 2);
          const disp = Q(a * (T * T - 2 * p * T), 2);
          nearly(numInteg((tt) => Math.abs(a * (tt - p)), 0, T, 20000), qnum(dist), "道のりの検算", 1e-7);
          const vT = sumTex(term(a, "t"), cst(-a * p));
          return num({
            q: `数直線上を動く点の時刻 $t$ における速度が $v=${vT}$ のとき、$t=0$ から $t=${T}$ までにこの点が${ask}`,
            ans: dist,
            wrongs: [[disp, "MC-DISTANCE-DISPLACEMENT"], ...(disp.n < 0 ? [[neg(disp), "MC-DISTANCE-DISPLACEMENT"]] : [])],
            explain: `道のりは $\\displaystyle\\int_0^{${T}}|v|\\,dt$。$v$ は $t=${p}$ で符号が変わる（それまでは負、そのあとは正）ので、分けて計算します。$\\displaystyle\\int_0^{${p}}(-v)\\,dt+\\int_{${p}}^{${T}}v\\,dt=${tq(Q(a * p * p, 2))}+${tq(Q(a * (T - p) ** 2, 2))}=${tq(dist)}$。（$\\displaystyle\\int_0^{${T}}v\\,dt=${tq(disp)}$ は位置の変化で、道のりではありません）`,
          });
        }
        if (lv === 2) {
          // v＝(t−p)(t−q)（0≦t≦T）
          const p = r.int(1, 2);
          const q = r.int(p + 1, 4);
          const T = r.int(q, 5);
          const V = Poly.fromCoeffs([Q(p * q), Q(-(p + q)), Q(1)], "t");
          const I = (a, b) => defInteg(V, a, b, "t");
          const parts = [I(0, p), neg(I(p, q)), ...(T > q ? [I(q, T)] : [])];
          const dist = parts.reduce((s, v) => add(s, v), Q(0));
          const disp = I(0, T);
          nearly(numInteg((tt) => Math.abs((tt - p) * (tt - q)), 0, T, 40000), qnum(dist), "道のりの検算", 1e-6);
          return num({
            q: `数直線上を動く点の時刻 $t$ における速度が $v=${pt_(V)}$ のとき、$t=0$ から $t=${T}$ までにこの点が${ask}`,
            ans: dist,
            wrongs: [[disp, "MC-DISTANCE-DISPLACEMENT"], ...(disp.n < 0 ? [[neg(disp), "MC-DISTANCE-DISPLACEMENT"]] : [])],
            explain: `$v=(${xm(p, "t")})(${xm(q, "t")})$ は $${p}<t<${q}$ で負、それ以外で正（または 0）。道のりは $|v|$ の積分なので、$\\displaystyle\\int_0^{${p}}v\\,dt-\\int_{${p}}^{${q}}v\\,dt${T > q ? `+\\int_{${q}}^{${T}}v\\,dt` : ""}=${parts.map((v) => tq(v)).join("+")}=${tq(dist)}$。`,
          });
        }
        // v＝A sin t または A cos t（0≦t≦jπ/2）
        const Aa = r.int(1, 4);
        const useSin = r.chance(0.5);
        const j = r.int(2, 6);
        const dist = Aa * j;
        const disp = useSin ? Aa * (1 - [1, 0, -1, 0][j % 4]) : Aa * [0, 1, 0, -1][j % 4];
        const T = (j * Math.PI) / 2;
        const vf = (tt) => Aa * (useSin ? Math.sin(tt) : Math.cos(tt));
        nearly(numInteg((tt) => Math.abs(vf(tt)), 0, T, 60000), dist, "道のりの検算", 1e-6);
        nearly(numInteg(vf, 0, T, 60000), disp, "位置の変化の検算", 1e-6);
        return num({
          q: `数直線上を動く点の時刻 $t$ における速度が $v=${Aa === 1 ? "" : Aa}\\${useSin ? "sin" : "cos"} t$ のとき、$t=0$ から $t=${radTex(Q(j, 2))}$ までにこの点が${ask}`,
          ans: dist,
          wrongs: [...(disp !== dist ? [[disp, "MC-DISTANCE-DISPLACEMENT"]] : [])],
          explain: `$|\\${useSin ? "sin" : "cos"} t|$ のグラフは、幅 $\\dfrac{\\pi}{2}$ ごとに同じ面積 $1$ の山をくり返します（$\\displaystyle\\int_0^{\\frac{\\pi}{2}}\\${useSin ? "sin" : "cos"} t\\,dt=1$）。$0$ から $${radTex(Q(j, 2))}$ までにその山が $${j}$ つ分あるので、道のりは $${Aa}\\times ${j}=${dist}$。`,
        });
      },
      { id: "c" },
    ),
  ],
};
