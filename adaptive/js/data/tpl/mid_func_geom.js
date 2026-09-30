// ============================================================
// tpl/mid_func_geom.js — 中学校 関数・図形・データの活用
//   coord_basic / prop_func / prop_graph / linear_basic / linear_eq / linear_intersect /
//   quad_func_basic / quad_func_apps /
//   sector / solid_area_vol / parallel_angle / congruence / similar_basic / similar_area_vol /
//   circle_angle / pythagorean / pythagorean_apps /
//   freq_table / prob_basic / prob_multi / quartile_box
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, eq, neg, abs, toDecimalString, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { P } from "../../core/poly.js";
import { t, until, assert, gcd, lcm, dec } from "./util.js";
import { coordPlane, rightTriangle, circleAngle, parallelLines, triangleParallel, sector as sectorFig, bars, boxPlot } from "./fig.js";
import { sqrtParts } from "./mid_num.js";

const decStr = (q) => toDecimalString(q) ?? tq(q);
const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const frac = (n, d) => `\\frac{${n}}{${d}}`;
/** y = ax + b の TeX（a, b は Q または整数） */
function lineEq(a, b, v = "x", lhs = "y") {
  const A = Q(typeof a === "number" ? a : a.n, typeof a === "number" ? 1 : a.d);
  const B = Q(typeof b === "number" ? b : b.n, typeof b === "number" ? 1 : b.d);
  let s = "";
  if (A.n !== 0) {
    const abs_ = abs(A);
    const coef = abs_.n === 1 && abs_.d === 1 ? "" : abs_.d === 1 ? `${abs_.n}` : `\\frac{${abs_.n}}{${abs_.d}}`;
    s += `${A.n < 0 ? "-" : ""}${coef}${v}`;
  }
  if (B.n !== 0) s += `${B.n < 0 ? "-" : s ? "+" : ""}${tq(abs(B))}`;
  return `${lhs}=${s || "0"}`;
}
/** 点の TeX */
const pt = (x, y) => `(${tq(Q(x.n ?? x, x.d ?? 1))},\\ ${tq(Q(y.n ?? y, y.d ?? 1))})`;
const P2 = (x, y) => ({ x, y });

export default {
  // ── 座標 ───────────────────────────────────────
  coord_basic: [
    t("choice", (r, lv) => {
      const [x, y] = [r.nz(-9, 9), r.nz(-9, 9)];
      const quad = x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : 4;
      const label = (k) => `第${k}象限`;
      // 誤答：x と y を取りちがえる／時計回りの番号づけ
      const swapQuad = y > 0 && x > 0 ? 1 : y < 0 && x > 0 ? 2 : y < 0 && x < 0 ? 3 : 4;
      const clockwise = { 1: 1, 2: 4, 3: 3, 4: 2 }[quad];
      const others = [1, 2, 3, 4].filter((k) => k !== quad);
      return choice({
        q: `点 $A(${x},\\ ${y})$ は、第何象限にありますか。`,
        correct: label(quad),
        wrongs: others.map((k) => [label(k), k === clockwise || k === swapQuad ? "MC-COORD-QUADRANT" : null]),
        count: 4,
        explain: `第1象限は $(+,+)$、第2象限は $(-,+)$、第3象限は $(-,-)$、第4象限は $(+,-)$ で、反時計回りに数えます。$x=${x}$ は${x > 0 ? "正" : "負"}、$y=${y}$ は${y > 0 ? "正" : "負"}なので第${quad}象限。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const [x, y] = [r.nz(-8, 8), r.nz(-8, 8)];
        const axis = r.pick(["x軸", "y軸", "原点"]);
        const [ax, ay] = axis === "x軸" ? [x, -y] : axis === "y軸" ? [-x, y] : [-x, -y];
        return fields({
          q: `点 $A(${x},\\ ${y})$ と、${axis}について対称な点の座標を答えなさい。`,
          layout: "inline",
          fields: [
            { id: "x", value: ax, pre: "$($" },
            { id: "y", value: ay, pre: "$,$", post: "$)$" },
          ],
          wrongs: [
            { values: { x, y }, mc: "MC-COORD-REFLECT" },
            { values: { x: -x, y: -y }, mc: "MC-COORD-REFLECT" },
            { values: { x: ay, y: ax }, mc: "MC-COORD-XY-SWAP" },
            { values: { x: axis === "x軸" ? -x : x, y: axis === "x軸" ? y : -y }, mc: "MC-COORD-REFLECT" },
          ],
          explain: `${axis === "x軸" ? "x軸について対称な点は、x座標が同じで y座標の符号が変わります" : axis === "y軸" ? "y軸について対称な点は、y座標が同じで x座標の符号が変わります" : "原点について対称な点は、x座標も y座標も符号が変わります"}。答えは $(${ax},\\ ${ay})$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        const y0 = r.int(-3, 3);
        const x1 = r.int(-6, -1);
        const x2 = r.int(2, 6);
        const apexX = r.int(x1 + 1, x2 - 1);
        const apexY = until(() => y0 + r.pick([2, 3, 4, 5, -2, -3]), (v) => v >= -5 && v <= 6);
        const base = x2 - x1;
        const height = Math.abs(apexY - y0);
        const area = Q(base * height, 2);
        return num({
          q: `3点 $A(${x1},\\ ${y0})$、$B(${x2},\\ ${y0})$、$C(${apexX},\\ ${apexY})$ を頂点とする三角形 $ABC$ の面積を求めなさい。（座標の1目もりを $1$ とします）`,
          fig: coordPlane({ x: [-7, 7], y: [-6, 7], cell: 20, points: [{ x: x1, y: y0, label: "A" }, { x: x2, y: y0, label: "B" }, { x: apexX, y: apexY, label: "C" }], segments: [[x1, y0, x2, y0], [x1, y0, apexX, apexY], [x2, y0, apexX, apexY]] }),
          ans: area,
          wrongs: [[base * height, "MC-AREA-HALF"], [Q(base + height, 2), "MC-AREA-HALF"], [Q(base * (Math.abs(apexX - x1) || 1), 2), "MC-COORD-HEIGHT"]],
          explain: `AB は x軸に平行で、長さは $${x2}-(${x1})=${base}$。C から AB までの高さは $|${apexY}-(${y0})|=${height}$。面積は $\\frac12\\times ${base}\\times ${height}=${decStr(area)}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],

  // ── 比例・反比例の式 ───────────────────────────
  prop_func: [
    t("choice", (r, lv) => {
      const inverse = lv >= 2 && r.chance(0.6);
      const [x0, k] = until(() => [r.nz(-6, 6), r.nz(-5, 5)], ([u, v]) => Math.abs(u) > 1 && Math.abs(v) > 1);
      if (!inverse) {
        const a = k;
        const y0 = a * x0;
        return choice({
          q: `$y$ は $x$ に比例し、$x=${x0}$ のとき $y=${y0}$ です。$y$ を $x$ の式で表しなさい。`,
          correct: $(`y=${a === 1 ? "" : a === -1 ? "-" : a}x`),
          wrongs: [
            [$(`y=${-a === 1 ? "" : -a === -1 ? "-" : -a}x`), "MC-PROP-SIGN"],
            [$(`y=\\frac{${y0}}{x}`), "MC-PROP-INV-CONFUSE"],
            [$(`y=${y0 * x0 === 1 ? "" : y0 * x0}x`), "MC-PROP-COEF"],
            [$(`y=${x0}x`), "MC-PROP-COEF"],
          ],
          explain: `比例の式は $y=ax$。$x=${x0}$、$y=${y0}$ を代入すると $${y0}=a\\times(${x0})$ より $a=${a}$。よって $y=${a}x$。`,
        });
      }
      const a = x0 * k;
      return choice({
        q: `$y$ は $x$ に反比例し、$x=${x0}$ のとき $y=${k}$ です。$y$ を $x$ の式で表しなさい。`,
        correct: $(`y=\\frac{${a}}{x}`.replace("\\frac{-", "-\\frac{")),
        wrongs: [
          [$(`y=${k}x`), "MC-PROP-INV-CONFUSE"],
          [$(`y=\\frac{${-a}}{x}`.replace("\\frac{-", "-\\frac{")), "MC-PROP-SIGN"],
          [$(`y=\\frac{x}{${a}}`.replace("\\frac{x}{-", "-\\frac{x}{")), "MC-PROP-INV-CONFUSE"],
          [$(`y=\\frac{${k}}{x}`), "MC-PROP-COEF"],
        ],
        explain: `反比例の式は $y=\\dfrac{a}{x}$、つまり $xy=a$。$x=${x0}$、$y=${k}$ を代入すると $a=${x0}\\times(${k})=${a}$。よって $y=\\dfrac{${a}}{x}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const inverse = lv >= 2 && r.chance(0.5);
        const [x0, k] = until(() => [r.nz(-6, 6), r.nz(-5, 5)], ([u, v]) => Math.abs(u) > 1);
        const x1 = until(() => r.nz(-9, 9), (v) => v !== x0);
        if (!inverse) {
          const a = k;
          return num({
            q: `$y$ は $x$ に比例し、$x=${x0}$ のとき $y=${a * x0}$ です。$x=${x1}$ のときの $y$ の値を求めなさい。`,
            ans: a * x1,
            wrongs: [[-a * x1, "MC-PROP-SIGN"], [Q(a * x0 * x0, x1), "MC-PROP-INV-CONFUSE"], [a * x0 + (x1 - x0), "MC-PROP-ADD"]],
            explain: `$y=ax$ に $x=${x0}$、$y=${a * x0}$ を代入して $a=${a}$。$y=${a}x$ に $x=${x1}$ を代入して $y=${a * x1}$。`,
          });
        }
        const a = x0 * k;
        return num({
          q: `$y$ は $x$ に反比例し、$x=${x0}$ のとき $y=${k}$ です。$x=${x1}$ のときの $y$ の値を求めなさい。`,
          ans: Q(a, x1),
          wrongs: [[Q(-a, x1), "MC-PROP-SIGN"], [mul(k, x1), "MC-PROP-INV-CONFUSE"], [Q(k * x0 * x0, x1), "MC-PROP-INV-CONFUSE"]],
          explain: `$xy=a$ に $x=${x0}$、$y=${k}$ を代入して $a=${a}$。$xy=${a}$ に $x=${x1}$ を代入すると $y=${a}\\div(${x1})=${tq(Q(a, x1))}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 比例・反比例のグラフ ───────────────────────
  prop_graph: [
    t("choice", (r, lv) => {
      if (lv === 1 || lv === 3) {
        const a = until(() => r.pick([Q(r.nz(-4, 4)), Q(r.nz(-5, 5), r.pick([2, 3]))]), (q) => q.n !== 0 && !eq(q, Q(1)));
        const x0 = a.d;
        const y0 = a.n;
        return choice({
          q: `図は、原点を通る直線のグラフです。点 $A(${x0},\\ ${y0})$ を通るとき、この直線の式を求めなさい。`,
          fig: coordPlane({ x: [-5, 5], y: [-5, 5], cell: 22, lines: [{ a: qnum(a), b: 0 }], points: [{ x: x0, y: y0, label: `A(${x0}, ${y0})` }] }),
          correct: $(lineEq(a, 0)),
          wrongs: [
            [$(lineEq(neg(a), 0)), "MC-PROP-SIGN"],
            [$(lineEq(Q(x0, y0), 0)), "MC-PROP-COEF"],
            [$(`y=\\frac{${a.n * a.d}}{x}`.replace("\\frac{-", "-\\frac{")), "MC-PROP-INV-CONFUSE"],
            [$(lineEq(Q(y0 + x0, 1), 0)), "MC-PROP-COEF"],
          ],
          explain: `原点を通る直線は比例のグラフ $y=ax$。点 $A(${x0},\\ ${y0})$ を通るので $${y0}=a\\times ${x0}$ より $a=${tq(a)}$。よって $${lineEq(a, 0)}$。`,
        });
      }
      const [px, py] = until(() => [r.nz(-4, 4), r.nz(-4, 4)], ([u, v]) => Math.abs(u * v) >= 2 && Math.abs(u * v) <= 8 && Math.abs(u) !== Math.abs(v) + 100);
      const a = px * py;
      return choice({
        q: `図は、反比例のグラフです。点 $A(${px},\\ ${py})$ を通るとき、$y$ を $x$ の式で表しなさい。`,
        fig: coordPlane({ x: [-6, 6], y: [-6, 6], cell: 20, curves: [{ fn: (x) => (x > 0 ? a / x : NaN) }, { fn: (x) => (x < 0 ? a / x : NaN) }], points: [{ x: px, y: py, label: `A(${px}, ${py})` }] }),
        correct: $(`y=\\frac{${a}}{x}`.replace("\\frac{-", "-\\frac{")),
        wrongs: [
          [$(`y=\\frac{${-a}}{x}`.replace("\\frac{-", "-\\frac{")), "MC-PROP-SIGN"],
          [$(`y=${lineEq(Q(py, px), 0).slice(2)}`), "MC-PROP-INV-CONFUSE"],
          [$(`y=\\frac{x}{${a}}`.replace("\\frac{x}{-", "-\\frac{x}{")), "MC-PROP-INV-CONFUSE"],
          [$(`y=\\frac{${px + py}}{x}`.replace("\\frac{-", "-\\frac{")), "MC-PROP-COEF"],
        ],
        explain: `反比例の式 $y=\\dfrac{a}{x}$ に $x=${px}$、$y=${py}$ を代入して $a=${px}\\times(${py})=${a}$。よって $y=\\dfrac{${a}}{x}$。（グラフが原点を通らない曲線なので反比例）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const a = Q(r.nz(-5, 5), r.pick([2, 3, 4]));
        const x1 = a.d * r.nz(-3, 3);
        const ans = mul(a, x1);
        return num({
          q: `比例 $${lineEq(a, 0)}$ のグラフ上の点で、$x$ 座標が $${x1}$ である点の $y$ 座標を求めなさい。`,
          fig: coordPlane({ x: [-6, 6], y: [-6, 6], cell: 18, lines: [{ a: qnum(a), b: 0 }] }),
          ans,
          wrongs: [[neg(ans), "MC-PROP-SIGN"], [div(x1, a), "MC-PROP-INV-CONFUSE"], [add(a, x1), "MC-PROP-ADD"]],
          explain: `$y=${tq(a)}x$ に $x=${x1}$ を代入して $y=${tq(a)}\\times(${x1})=${tq(ans)}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 1次関数（式・変化の割合・傾き） ──────────────
  linear_basic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [a, b] = [r.nz(-5, 6), r.nz(-6, 6)];
        const [x1, x2] = until(() => [r.int(-3, 3), r.int(-2, 6)], ([u, v]) => v > u);
        return num({
          q: `1次関数 $${lineEq(a, b)}$ で、$x$ の値が $${x1}$ から $${x2}$ まで増加するとき、$y$ の増加量を求めなさい。`,
          ans: a * (x2 - x1),
          wrongs: [[a, "MC-LINEAR-RATE"], [x2 - x1, "MC-LINEAR-RATE"], [a * (x2 + x1) + 2 * b, "MC-LINEAR-RATE"], [-a * (x2 - x1), "MC-PROP-SIGN"]],
          explain: `1次関数では、変化の割合（$\\frac{yの増加量}{xの増加量}$）が傾き $${a}$ で一定です。$x$ の増加量は $${x2}-(${x1})=${x2 - x1}$ なので、$y$ の増加量は $${a}\\times ${x2 - x1}=${a * (x2 - x1)}$。`.replace("\\frac{yの増加量}{xの増加量}", "\\frac{y\\text{の増加量}}{x\\text{の増加量}}"),
        });
      }
      if (lv === 2) {
        const [x1, y1] = [r.int(-2, 2), r.int(-4, 4)];
        const dx = r.int(2, 4);
        const a = r.nz(-4, 4);
        return num({
          q: `1次関数のグラフで、$x$ の値が $${dx}$ 増加すると、$y$ の値は $${a * dx > 0 ? "" : "-"}${Math.abs(a * dx)}$ ${a * dx > 0 ? "増加" : "減少"}します。この1次関数の傾きを求めなさい。`,
          ans: a,
          wrongs: [[-a, "MC-LINEAR-RATE"], [Q(dx, a * dx), "MC-LINEAR-RATE"], [a * dx, "MC-LINEAR-RATE"]],
          explain: `傾き ＝ 変化の割合 ＝ $y$ の増加量 ÷ $x$ の増加量 $=${a * dx}\\div ${dx}=${a}$。（減少のときは増加量が負）`,
        });
      }
      const [a, b] = [r.nz(-4, 4), r.nz(-5, 5)];
      const [x1, x2] = until(() => [r.int(-4, 0), r.int(1, 4)], ([u, v]) => v > u);
      const ys = [a * x1 + b, a * x2 + b];
      const wantMax = r.chance(0.5);
      return num({
        q: `1次関数 $${lineEq(a, b)}$ で、$x$ の変域が $${x1}\\le x\\le ${x2}$ のとき、$y$ の${wantMax ? "最大" : "最小"}値を求めなさい。`,
        ans: wantMax ? Math.max(...ys) : Math.min(...ys),
        wrongs: [[wantMax ? Math.min(...ys) : Math.max(...ys), "MC-LINEAR-DOMAIN"], [b, "MC-LINEAR-DOMAIN"], [a * (x2 - x1), "MC-LINEAR-DOMAIN"]],
        explain: `1次関数は、$a>0$ なら $x$ が大きいほど $y$ も大きく、$a<0$ なら $x$ が大きいほど $y$ は小さくなります。$x=${x1}$ のとき $y=${ys[0]}$、$x=${x2}$ のとき $y=${ys[1]}$。${wantMax ? "最大" : "最小"}値は $${wantMax ? Math.max(...ys) : Math.min(...ys)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // グラフから傾きを読みとる
        const [a, b, x1, x2] = until(
          () => {
            const a = Q(r.nz(-3, 3), r.pick([1, 1, 2]));
            const x1 = r.int(-2, 0) * a.d;
            return [a, r.int(-2, 2), x1, x1 + r.int(1, 2) * a.d];
          },
          ([a, b, x1, x2]) => [x1, x2].every((x) => Math.abs(qnum(a) * x + b) <= 5.5),
        );
        const p1 = [x1, qnum(a) * x1 + b];
        const p2 = [x2, qnum(a) * x2 + b];
        return num({
          q: `図の直線は、2点 $A(${p1[0]},\\ ${p1[1]})$、$B(${p2[0]},\\ ${p2[1]})$ を通っています。この直線の傾きを求めなさい。`,
          fig: coordPlane({ x: [-6, 6], y: [-6, 6], cell: 18, lines: [{ a: qnum(a), b }], points: [{ x: p1[0], y: p1[1], label: "A" }, { x: p2[0], y: p2[1], label: "B" }] }),
          ans: a,
          wrongs: [[neg(a), "MC-LINEAR-RATE"], [Q(p2[0] - p1[0], p2[1] - p1[1]), "MC-LINEAR-RATE"], [b, "MC-LINEAR-RATE"]],
          explain: `傾き ＝ $\\dfrac{y\\text{の増加量}}{x\\text{の増加量}}=\\dfrac{${p2[1]}-(${p1[1]})}{${p2[0]}-(${p1[0]})}=${tq(a)}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 1次関数の式を求める ───────────────────────
  linear_eq: [
    t("choice", (r, lv) => {
      let q;
      let a;
      let b;
      let fig;
      let explain;
      if (lv === 1) {
        a = r.nz(-4, 4);
        const [px, py] = [r.int(-3, 4), r.int(-5, 6)];
        b = py - a * px;
        q = `傾きが $${a}$ で、点 $(${px},\\ ${py})$ を通る直線の式を求めなさい。`;
        explain = `傾きが $${a}$ なので $y=${a}x+b$。点 $(${px},\\ ${py})$ を通るので $${py}=${a}\\times(${px})+b$ より $b=${b}$。`;
      } else if (lv === 2) {
        let q2;
        let p;
        [p, q2, a, b] = until(
          () => {
            const a = r.nz(-3, 3);
            const b = r.int(-3, 3);
            const x0 = r.int(-3, -1);
            return [[x0, a * x0 + b], r.int(1, 4), a, b];
          },
          ([p, q2, a, b]) => Math.abs(p[1]) <= 6 && Math.abs(a * (p[0] + q2) + b) <= 6,
        );
        const pp = [p[0] + q2, a * (p[0] + q2) + b];
        q = `図の直線は、2点 $A(${p[0]},\\ ${p[1]})$、$B(${pp[0]},\\ ${pp[1]})$ を通っています。この直線の式を求めなさい。`;
        fig = coordPlane({ x: [-6, 6], y: [-7, 7], cell: 18, lines: [{ a, b }], points: [{ x: p[0], y: p[1], label: "A" }, { x: pp[0], y: pp[1], label: "B" }] });
        explain = `傾きは $\\dfrac{${pp[1]}-(${p[1]})}{${pp[0]}-(${p[0]})}=${a}$。$y=${a}x+b$ に $A(${p[0]},\\ ${p[1]})$ を代入して $b=${b}$。`;
      } else {
        // x 軸との交点 (x0, 0) と y 切片 b を通る直線
        const x0 = until(() => r.nz(-6, 6), (v) => Math.abs(v) >= 2);
        b = until(() => r.nz(-6, 6), (v) => v !== x0 && v !== -x0);
        a = Q(-b, x0);
        q = `$x$ 軸と点 $(${x0},\\ 0)$ で交わり、$y$ 切片が $${b}$ の直線の式を求めなさい。`;
        explain = `2点 $(${x0},\\ 0)$ と $(0,\\ ${b})$ を通る直線です。傾きは $\\dfrac{${b}-0}{0-(${x0})}=${tq(a)}$。$y$ 切片が $${b}$ なので $${lineEq(a, b)}$。`;
      }
      const A = typeof a === "number" ? Q(a) : a;
      const B = Q(b);
      return choice({
        q,
        fig,
        correct: $(lineEq(A, B)),
        wrongs: [
          [$(lineEq(A, neg(B))), "MC-LINEAR-INTERCEPT"],
          [$(lineEq(neg(A), B)), "MC-LINEAR-SLOPE"],
          [$(lineEq(A, add(B, Q(1)))), "MC-SLIP"],
          [$(lineEq(A, add(B, mul(A, 2)))), "MC-LINEAR-INTERCEPT"],
          [$(lineEq(B, A)), "MC-LINEAR-SLOPE"],
        ],
        explain,
      });
    }),
  ],

  // ── 2直線の交点 ───────────────────────────────
  linear_intersect: [
    t("fields", (r, lv) => {
      const { x, y, a1, b1, a2, b2 } = until(
        () => {
          const x = r.int(-5, 6);
          const a1 = r.nz(-3, 4);
          const a2 = r.nz(-3, 4);
          const b1 = r.int(-5, 5);
          return { x, a1, a2, b1, y: a1 * x + b1, b2: a1 * x + b1 - a2 * x };
        },
        (v) => v.a1 !== v.a2 && Math.abs(v.b2) <= 8 && Math.abs(v.y) <= 12,
      );
      return fields({
        q: `2直線 $${lineEq(a1, b1)}$ と $${lineEq(a2, b2)}$ の交点の座標を求めなさい。`,
        layout: "inline",
        fields: [
          { id: "x", value: x, pre: "$($" },
          { id: "y", value: y, pre: "$,$", post: "$)$" },
        ],
        wrongs: [
          { values: { x: y, y: x }, mc: "MC-COORD-XY-SWAP" },
          { values: { x: -x, y }, mc: "MC-SIMUL-SIGN" },
          { values: { x, y: a2 * x + b1 }, mc: "MC-LINEAR-INTERSECT" },
        ],
        explain: `交点は、2つの式を同時に満たす点です。$${a1}x${sgn(b1)}=${a2}x${sgn(b2)}$ を解くと $x=${x}$。これを $y=${lineEq(a1, b1).slice(2)}$ に代入して $y=${y}$。交点は $(${x},\\ ${y})$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 2直線と y 軸で作る三角形の面積
        const { a1, b1, a2, b2, x } = until(
          () => {
            const x = r.nz(-6, 6);
            const a1 = r.nz(-3, 3);
            const a2 = r.nz(-3, 3);
            const b1 = r.int(-4, 4);
            return { x, a1, a2, b1, b2: a1 * x + b1 - a2 * x };
          },
          (v) => v.a1 !== v.a2 && v.b1 !== v.b2 && Math.abs(v.b2) <= 8,
        );
        const area = Q(Math.abs(b1 - b2) * Math.abs(x), 2);
        return num({
          q: `2直線 $${lineEq(a1, b1)}$ と $${lineEq(a2, b2)}$ の交点を $P$ とし、それぞれの $y$ 切片を $A$、$B$ とします。$\\triangle PAB$ の面積を求めなさい。（座標の1目もりを $1$ とします）`,
          ans: area,
          wrongs: [[Math.abs(b1 - b2) * Math.abs(x), "MC-AREA-HALF"], [Q(Math.abs(b1 - b2), 2), "MC-COORD-HEIGHT"], [Q(Math.abs(b1 + b2) * Math.abs(x), 2), "MC-COORD-HEIGHT"]],
          explain: `交点 $P$ の $x$ 座標は $${a1}x${sgn(b1)}=${a2}x${sgn(b2)}$ より $x=${x}$。$A(0,\\ ${b1})$、$B(0,\\ ${b2})$ なので $AB=|${b1}-(${b2})|=${Math.abs(b1 - b2)}$（$y$ 軸上の線分を底辺にする）。高さは $P$ の $x$ 座標の絶対値 $${Math.abs(x)}$。面積は $\\frac12\\times ${Math.abs(b1 - b2)}\\times ${Math.abs(x)}=${decStr(area)}$。`,
        });
      },
      { id: "b", db: 0.5 },
    ),
  ],

  // ── 関数 y=ax² ─────────────────────────────────
  quad_func_basic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [a, px, py] = until(
          () => {
            const a = Q(r.nz(-4, 4), r.pick([1, 1, 2]));
            const px = a.d === 2 ? 2 * r.nz(-2, 2) : r.nz(-3, 3);
            return [a, px, mul(a, px * px)];
          },
          ([, , py]) => Math.abs(qnum(py)) <= 5.5, // 図の枠におさまること
        );
        return num({
          q: `$y=ax^2$ のグラフが点 $(${px},\\ ${tq(py)})$ を通るとき、$a$ の値を求めなさい。`,
          fig: coordPlane({ x: [-5, 5], y: [-6, 6], cell: 18, curves: [{ fn: (x) => qnum(a) * x * x }], points: [{ x: px, y: qnum(py), label: "" }] }),
          ans: a,
          wrongs: [[div(py, px), "MC-QF-SQUARE"], [neg(a), "MC-PROP-SIGN"], [div(py, 2 * px), "MC-QF-SQUARE"]],
          reduced: true,
          explain: `$y=ax^2$ に $x=${px}$、$y=${tq(py)}$ を代入すると $${tq(py)}=a\\times(${px})^2=${px * px}a$。よって $a=${tq(a)}$。（$x^2$ は $x$ を2回かけたもの）`,
        });
      }
      if (lv === 2) {
        const a = Q(r.nz(-4, 4), r.pick([1, 2]));
        const x1 = a.d === 2 ? 2 * r.nz(-3, 3) : r.nz(-4, 4);
        const ans = mul(a, x1 * x1);
        return num({
          q: `関数 $${lineEq(a, 0, "x^{2}")}$ で、$x=${x1}$ のときの $y$ の値を求めなさい。`,
          ans,
          wrongs: [[mul(a, 2 * x1), "MC-QF-SQUARE"], [mul(a, -x1 * x1), "MC-QF-SIGN"], [mul(a, x1), "MC-QF-SQUARE"]],
          explain: `$x=${x1}$ を代入すると $y=${tq(a)}\\times(${x1})^2=${tq(a)}\\times ${x1 * x1}=${tq(ans)}$。負の数を2乗すると正の数になります。`,
        });
      }
      const a = r.pick([1, 2, -1, -2, 3, -3]);
      const kind = r.pick(["rate", "range"]);
      if (kind === "rate") {
        const [x1, x2] = until(() => [r.int(-3, 2), r.int(1, 5)], ([u, v]) => v > u);
        const ans = Q(a * (x2 * x2 - x1 * x1), x2 - x1);
        return num({
          q: `関数 $y=${a === 1 ? "" : a === -1 ? "-" : a}x^2$ で、$x$ の値が $${x1}$ から $${x2}$ まで増加するときの変化の割合を求めなさい。`,
          ans,
          wrongs: [[a * (x2 + x1) + 0, "MC-QF-RATE"], [Q(a * x2 * x2 - a * x1 * x1, 1), "MC-QF-RATE"], [a * (x2 - x1), "MC-QF-RATE"]],
          explain: `変化の割合 ＝ $y$ の増加量 ÷ $x$ の増加量。$x=${x1}$ のとき $y=${a * x1 * x1}$、$x=${x2}$ のとき $y=${a * x2 * x2}$。$\\dfrac{${a * x2 * x2}-(${a * x1 * x1})}{${x2}-(${x1})}=${tq(ans)}$。（$y=ax^2$ の変化の割合は一定ではありません）`,
        });
      }
      const [x1, x2] = until(() => [r.int(-4, -1), r.int(1, 4)], ([u, v]) => u !== -v);
      const ys = [a * x1 * x1, a * x2 * x2, 0];
      const wantMax = a > 0 ? true : r.chance(0.5);
      const ans = wantMax ? Math.max(...ys) : Math.min(...ys);
      return num({
        q: `関数 $y=${a === 1 ? "" : a === -1 ? "-" : a}x^2$ で、$x$ の変域が $${x1}\\le x\\le ${x2}$ のとき、$y$ の${wantMax ? "最大" : "最小"}値を求めなさい。`,
        ans,
        wrongs: [[wantMax ? Math.min(a * x1 * x1, a * x2 * x2) : Math.max(a * x1 * x1, a * x2 * x2), "MC-QF-RANGE"], [a * x1 * x1 === ans ? a * x2 * x2 : a * x1 * x1, "MC-QF-RANGE"], [ans + a, "MC-SLIP"]],
        explain: `変域に $x=0$ がふくまれるので、$y=${a}x^2$ は $x=0$ で ${a > 0 ? "最小値 $0$" : "最大値 $0$"} になります。端の値は $x=${x1}$ で $${a * x1 * x1}$、$x=${x2}$ で $${a * x2 * x2}$。${wantMax ? "最大" : "最小"}値は $${ans}$。`,
      });
    }),
  ],

  // ── 放物線と直線 ───────────────────────────────
  quad_func_apps: [
    t("fields", (r, lv) => {
      const a = lv === 1 ? 1 : r.pick([1, 2, Q(1, 2)]);
      const A = typeof a === "number" ? Q(a) : a;
      const [x1, x2] = until(() => [r.int(-4, -1), r.int(1, 4)], ([u, v]) => u !== -v);
      const y1 = mul(A, x1 * x1);
      const y2 = mul(A, x2 * x2);
      const m = div(sub(y2, y1), x2 - x1);
      const n = sub(y1, mul(m, x1));
      return fields({
        q: `放物線 $${lineEq(A, 0, "x^{2}")}$ と直線 $${lineEq(m, n)}$ の2つの交点のうち、$x$ 座標が正である点の座標を求めなさい。`,
        fig: Math.max(qnum(y1), qnum(y2)) <= 9 ? coordPlane({ x: [-5, 5], y: [-3, 9], cell: 20, curves: [{ fn: (x) => qnum(A) * x * x }], lines: [{ a: qnum(m), b: qnum(n) }] }) : undefined,
        layout: "inline",
        fields: [
          { id: "x", value: x2, pre: "$($" },
          { id: "y", value: y2, pre: "$,$", post: "$)$" },
        ],
        wrongs: [
          { values: { x: x1, y: y1 }, mc: "MC-QF-INTERSECT" },
          { values: { x: x2, y: add(mul(m, x2), Q(0)) }, mc: "MC-QF-INTERSECT" },
          { values: { x: y2, y: x2 }, mc: "MC-COORD-XY-SWAP" },
        ],
        explain: `交点では、放物線の式と直線の式の $y$ が等しくなります。$${tq(A)}x^2=${tq(m)}x${sgn(qnum(n))}$ を解くと $x=${x1},\\ ${x2}$。$x$ 座標が正なのは $x=${x2}$。$y=${tq(A)}\\times ${x2}^2=${tq(y2)}$。交点は $(${x2},\\ ${tq(y2)})$。`.replace(/\+\-/g, "-"),
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 原点 O と放物線上の2点 A, B でできる三角形の面積
        const A = lv === 1 ? Q(1) : r.pick([Q(1), Q(2), Q(1, 2)]);
        const [x1, x2] = until(() => [r.int(-4, -1), r.int(1, 4)], ([u, v]) => u !== -v);
        const y1 = mul(A, x1 * x1);
        const y2 = mul(A, x2 * x2);
        const m = div(sub(y2, y1), x2 - x1);
        const n = sub(y1, mul(m, x1)); // y 切片
        const area = mul(abs(n), Q(x2 - x1, 2));
        return num({
          q: `放物線 $${lineEq(A, 0, "x^{2}")}$ 上に、$x$ 座標が $${x1}$ の点 $A$ と $${x2}$ の点 $B$ があります。原点を $O$ とするとき、$\\triangle OAB$ の面積を求めなさい。（座標の1目もりを $1$ とします）`,
          // 点が枠の外に出るときは図を出さない（文章だけで条件は足りている）
          fig: Math.max(qnum(y1), qnum(y2)) <= 9 ? coordPlane({ x: [-5, 5], y: [-3, 9], cell: 20, curves: [{ fn: (x) => qnum(A) * x * x }], points: [{ x: x1, y: qnum(y1), label: "A" }, { x: x2, y: qnum(y2), label: "B" }], segments: [[x1, qnum(y1), x2, qnum(y2)], [0, 0, x1, qnum(y1)], [0, 0, x2, qnum(y2)]] }) : undefined,
          ans: area,
          wrongs: [[mul(abs(n), x2 - x1), "MC-AREA-HALF"], [mul(abs(n), Q(x2, 2)), "MC-QF-AREA"], [mul(abs(y2), Q(x2 - x1, 2)), "MC-QF-AREA"]],
          explain: `直線 $AB$ の式を求めます。傾きは $\\dfrac{${tq(y2)}-${tq(y1)}}{${x2}-(${x1})}=${tq(m)}$、$y$ 切片は $${tq(n)}$。$AB$ と $y$ 軸の交点を $C(0,\\ ${tq(n)})$ とすると、$\\triangle OAB=\\triangle OCA+\\triangle OCB=\\frac12\\times OC\\times(|x_A|+|x_B|)=\\frac12\\times ${tq(abs(n))}\\times ${x2 - x1}=${tq(area)}$。`,
        });
      },
      { id: "b", db: 0.6 },
    ),
  ],

  // ── おうぎ形の弧の長さと面積 ───────────────────
  sector: [
    t("num", (r, lv) => {
      const deg = r.pick(lv === 1 ? [45, 60, 90, 120, 180] : [30, 40, 45, 60, 72, 90, 120, 135, 150, 240, 270]);
      const rr = r.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
      const askArc = lv === 1 ? true : r.chance(0.5);
      if (lv === 3) {
        // 逆算：弧の長さや面積から中心角
        const d = r.pick([60, 90, 120, 150, 180, 240, 270]);
        const rad_ = r.pick([4, 6, 8, 9, 12]);
        const arcCoef = Q(2 * rad_ * d, 360);
        return num({
          q: `半径 $${rad_}\\,\\mathrm{cm}$ で、弧の長さが $${tq(arcCoef)}\\pi\\,\\mathrm{cm}$ のおうぎ形の中心角は何度ですか。`,
          ans: d,
          post: "度",
          wrongs: [[Math.round((d * 2) % 360) || 180, "MC-SECTOR-FRACTION"], [Math.round(d / 2), "MC-SECTOR-FRACTION"], [Math.min(360, d * 2)  === d ? d + 30 : Math.min(359, Math.round(d * 1.5)), "MC-SECTOR-FRACTION"]],
          explain: `半径 $${rad_}$ の円の円周は $2\\pi\\times ${rad_}=${2 * rad_}\\pi$。弧の長さは円周の $\\dfrac{中心角}{360}$ 倍なので $\\dfrac{x}{360}=\\dfrac{${tq(arcCoef)}}{${2 * rad_}}=\\dfrac{${d}}{360}$。中心角は $${d}^\\circ$。`.replace("\\dfrac{中心角}{360}", "\\dfrac{\\text{中心角}}{360}"),
        });
      }
      const fracDeg = Q(deg, 360);
      const arc = mul(2 * rr, fracDeg);
      const area = mul(rr * rr, fracDeg);
      return num({
        q: `半径 $${rr}\\,\\mathrm{cm}$、中心角 $${deg}^\\circ$ のおうぎ形の${askArc ? "弧の長さ" : "面積"}を、$\\pi$ を使って表しなさい。（$\\pi$ の係数を答えます）`,
        fig: sectorFig({ deg, rLabel: `${rr} cm`, angleLabel: `${deg}°` }),
        ans: askArc ? arc : area,
        post: askArc ? "π cm" : "π cm²",
        wrongs: askArc
          ? [[area, "MC-SECTOR-AREA-ARC"], [mul(rr, fracDeg), "MC-SECTOR-RADIUS-DIAM"], [Q(2 * rr, 1), "MC-SECTOR-FRACTION"], [mul(4 * rr, fracDeg), "MC-SECTOR-RADIUS-DIAM"]]
          : [[arc, "MC-SECTOR-AREA-ARC"], [mul(rr * rr * 4, fracDeg), "MC-SECTOR-RADIUS-DIAM"], [Q(rr * rr, 1), "MC-SECTOR-FRACTION"], [mul(rr, fracDeg), "MC-SECTOR-AREA-ARC"]],
        explain: askArc
          ? `弧の長さは、円周 $2\\pi r$ の $\\dfrac{${deg}}{360}$ 倍。$2\\pi\\times ${rr}\\times\\dfrac{${deg}}{360}=${tq(arc)}\\pi$（$\\mathrm{cm}$）。`
          : `面積は、円の面積 $\\pi r^2$ の $\\dfrac{${deg}}{360}$ 倍。$\\pi\\times ${rr}^2\\times\\dfrac{${deg}}{360}=${tq(area)}\\pi$（$\\mathrm{cm}^2$）。`,
      });
    }),
  ],

  // ── 立体の表面積・体積（錐・球） ───────────────
  solid_area_vol: [
    t("num", (r, lv) => {
      const kind = lv === 1 ? r.pick(["cone-v", "sphere-v"]) : lv === 2 ? r.pick(["sphere-s", "cone-v", "sphere-v"]) : r.pick(["cone-s", "pyramid-v", "hemi-s"]);
      if (kind === "cone-v") {
        const [rr, h] = [r.pick([2, 3, 4, 5, 6]), r.pick([3, 6, 9, 12, 4, 5, 8])];
        const ans = Q(rr * rr * h, 3);
        return num({
          q: `底面の半径が $${rr}\\,\\mathrm{cm}$、高さが $${h}\\,\\mathrm{cm}$ の円錐の体積を、$\\pi$ を使って表しなさい。（$\\pi$ の係数を答えます）`,
          ans,
          post: "π cm³",
          wrongs: [[rr * rr * h, "MC-VOL-PYRAMID-THIRD"], [Q(2 * rr * h, 3), "MC-SECTOR-RADIUS-DIAM"], [Q(rr * h, 3), "MC-SECTOR-RADIUS-DIAM"]],
          explain: `円錐の体積 ＝ $\\dfrac13\\times$ 底面積 $\\times$ 高さ $=\\dfrac13\\times\\pi\\times ${rr}^2\\times ${h}=${tq(ans)}\\pi$（$\\mathrm{cm}^3$）。`,
        });
      }
      if (kind === "sphere-v") {
        const rr = r.pick([1, 2, 3, 4, 5, 6]);
        const ans = Q(4 * rr ** 3, 3);
        return num({
          q: `半径が $${rr}\\,\\mathrm{cm}$ の球の体積を、$\\pi$ を使って表しなさい。（$\\pi$ の係数を答えます）`,
          ans,
          post: "π cm³",
          wrongs: [[4 * rr * rr, "MC-SPHERE-FORMULA"], [Q(4 * rr * rr, 3), "MC-SPHERE-FORMULA"], [Q(rr ** 3, 3), "MC-SPHERE-FORMULA"]],
          explain: `球の体積は $\\dfrac43\\pi r^3$。$\\dfrac43\\pi\\times ${rr}^3=${tq(ans)}\\pi$（$\\mathrm{cm}^3$）。`,
        });
      }
      if (kind === "sphere-s") {
        const rr = r.pick([1, 2, 3, 4, 5, 6, 7]);
        return num({
          q: `半径が $${rr}\\,\\mathrm{cm}$ の球の表面積を、$\\pi$ を使って表しなさい。（$\\pi$ の係数を答えます）`,
          ans: 4 * rr * rr,
          post: "π cm²",
          wrongs: [[Q(4 * rr ** 3, 3), "MC-SPHERE-FORMULA"], [2 * rr * rr, "MC-SPHERE-FORMULA"], [Q(4 * rr * rr, 3), "MC-SPHERE-FORMULA"]],
          explain: `球の表面積は $4\\pi r^2$。$4\\pi\\times ${rr}^2=${4 * rr * rr}\\pi$（$\\mathrm{cm}^2$）。（体積の公式 $\\frac43\\pi r^3$ と混同しないこと）`,
        });
      }
      if (kind === "cone-s") {
        const [rr, l] = r.pick([[3, 5], [4, 5], [3, 6], [5, 13], [5, 8], [6, 10], [2, 7], [4, 9]]);
        const ans = rr * l + rr * rr;
        return num({
          q: `底面の半径が $${rr}\\,\\mathrm{cm}$、母線の長さが $${l}\\,\\mathrm{cm}$ の円錐の表面積を、$\\pi$ を使って表しなさい。（$\\pi$ の係数を答えます）`,
          ans,
          post: "π cm²",
          wrongs: [[rr * l, "MC-CONE-SURFACE"], [rr * l + 2 * rr * rr, "MC-CONE-SURFACE"], [Q(rr * l, 2) && rr * l + rr, "MC-CONE-SURFACE"]],
          explain: `円錐の表面積 ＝ 側面積 ＋ 底面積。側面積は $\\pi\\times$ 母線 $\\times$ 半径 $=\\pi\\times ${l}\\times ${rr}=${rr * l}\\pi$、底面積は $\\pi\\times ${rr}^2=${rr * rr}\\pi$。合わせて $${ans}\\pi$（$\\mathrm{cm}^2$）。`,
        });
      }
      if (kind === "hemi-s") {
        const rr = r.pick([2, 3, 4, 5, 6]);
        return num({
          q: `半径が $${rr}\\,\\mathrm{cm}$ の半球（底面の円をふくむ）の表面積を、$\\pi$ を使って表しなさい。（$\\pi$ の係数を答えます）`,
          ans: 3 * rr * rr,
          post: "π cm²",
          wrongs: [[2 * rr * rr, "MC-SPHERE-FORMULA"], [4 * rr * rr, "MC-SPHERE-FORMULA"], [Q(4 * rr ** 3, 3) && 5 * rr * rr, "MC-SPHERE-FORMULA"]],
          explain: `曲面の部分は球の表面積の半分で $\\dfrac12\\times 4\\pi r^2=2\\pi r^2=${2 * rr * rr}\\pi$。底面の円は $\\pi r^2=${rr * rr}\\pi$。合わせて $${3 * rr * rr}\\pi$（$\\mathrm{cm}^2$）。`,
        });
      }
      const [a, h] = [r.pick([3, 4, 5, 6, 9]), r.pick([3, 6, 9, 4, 5])];
      return num({
        q: `底面が1辺 $${a}\\,\\mathrm{cm}$ の正方形で、高さが $${h}\\,\\mathrm{cm}$ の正四角錐の体積を求めなさい。`,
        ans: Q(a * a * h, 3),
        post: "cm³",
        wrongs: [[a * a * h, "MC-VOL-PYRAMID-THIRD"], [Q(a * h, 3), "MC-VOL-PYRAMID-THIRD"], [Q(a * a * h, 2), "MC-VOL-PYRAMID-THIRD"]],
        explain: `角錐の体積 ＝ $\\dfrac13\\times$ 底面積 $\\times$ 高さ $=\\dfrac13\\times ${a * a}\\times ${h}=${tq(Q(a * a * h, 3))}$（$\\mathrm{cm}^3$）。`,
      });
    }),
  ],

  // ── 平行線と角・多角形の外角 ───────────────────
  parallel_angle: [
    t("num", (r, lv) => {
      const theta = r.pick([50, 55, 60, 65, 70, 75, 110, 115, 120, 125]);
      const posList = ["NE", "NW", "SW", "SE"];
      const measure = (pos) => (pos === "NE" || pos === "SW" ? theta : 180 - theta);
      // 求めたい角と、与えられた角の位置
      const [gp, ap] = until(
        () => [
          { at: r.pick(["P", "Q"]), pos: r.pick(posList) },
          { at: r.pick(["P", "Q"]), pos: r.pick(posList) },
        ],
        ([g, a]) => !(g.at === a.at && g.pos === a.pos) && (lv > 1 || g.at !== a.at),
      );
      const givenVal = measure(gp.pos);
      const askedVal = measure(ap.pos);
      // 関係の名前
      const opposite = { NE: "SW", SW: "NE", NW: "SE", SE: "NW" };
      let rel;
      if (gp.at === ap.at) rel = opposite[gp.pos] === ap.pos ? "対頂角は等しい" : "一直線の角は $180^\\circ$";
      else if (gp.pos === ap.pos) rel = "平行線の同位角は等しい";
      else if (opposite[gp.pos] === ap.pos) rel = "平行線の錯角は等しい";
      else rel = givenVal === askedVal ? "平行線の性質（同位角・錯角）と対頂角から等しい" : "平行線の同側内角の和は $180^\\circ$（または、同位角と一直線の角から）";
      const same = askedVal === givenVal;
      return num({
        q: "図で、直線 $l$ と $m$ は平行です。$x$ の大きさを求めなさい。",
        fig: parallelLines({ theta, given: { at: gp.at, pos: gp.pos, text: `${givenVal}°` }, asked: { at: ap.at, pos: ap.pos, text: "x" } }),
        ans: askedVal,
        post: "度",
        wrongs: [[same ? 180 - givenVal : givenVal, "MC-PARALLEL-RELATION"], [90 - (givenVal % 90), "MC-PARALLEL-RELATION"], [360 - givenVal - askedVal, "MC-PARALLEL-RELATION"]],
        explain: same ? `${rel}ので、$x=${givenVal}^\\circ$。` : `${rel}。$x=180^\\circ-${givenVal}^\\circ=${askedVal}^\\circ$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const kind = lv === 1 ? r.pick(["ext-tri", "ext-poly"]) : lv === 2 ? r.pick(["ext-tri", "poly-n", "ext-poly"]) : r.pick(["poly-n", "ext-poly-n", "inner-outer"]);
        if (kind === "ext-tri") {
          const [a, b] = until(() => [r.int(30, 80), r.int(30, 80)], ([u, v]) => u + v < 170);
          return num({
            q: `三角形の2つの内角が $${a}^\\circ$ と $${b}^\\circ$ です。残りの内角の外角の大きさを求めなさい。`,
            ans: a + b,
            post: "度",
            wrongs: [[180 - a - b, "MC-EXTERIOR-ANGLE"], [180 - a, "MC-EXTERIOR-ANGLE"], [360 - a - b, "MC-EXTERIOR-ANGLE"]],
            explain: `三角形の外角は、それととなり合わない2つの内角の和に等しいので $${a}+${b}=${a + b}$（度）。（残りの内角は $${180 - a - b}^\\circ$ で、外角は $180-${180 - a - b}=${a + b}$）`,
          });
        }
        if (kind === "ext-poly") {
          const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18]);
          return num({
            q: `正${n}角形の1つの外角の大きさを求めなさい。`,
            ans: Q(360, n),
            post: "度",
            wrongs: [[Q(180 * (n - 2), n), "MC-POLY-EXTERIOR"], [Q(180, n), "MC-POLY-EXTERIOR"], [Q(360, n - 1) && Math.round(360 / (n - 1)), "MC-POLY-EXTERIOR"]],
            explain: `多角形の外角の和は、いつも $360^\\circ$ です。正${n}角形は外角がすべて等しいので、$360\\div ${n}=${decStr(Q(360, n))}$（度）。`,
          });
        }
        if (kind === "ext-poly-n") {
          const ext = r.pick([12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72]);
          return num({
            q: `1つの外角が $${ext}^\\circ$ である正多角形は、正何角形ですか。`,
            ans: 360 / ext,
            post: "角形",
            wrongs: [[Math.round(180 / ext), "MC-POLY-EXTERIOR"], [360 / ext + 2, "MC-POLY-EXTERIOR"], [Math.round(360 / ext) - 2, "MC-POLY-EXTERIOR"]],
            explain: `外角の和は $360^\\circ$ なので、角の数は $360\\div ${ext}=${360 / ext}$。正${360 / ext}角形です。`,
          });
        }
        if (kind === "poly-n") {
          const n = r.int(5, 12);
          return num({
            q: `内角の和が $${180 * (n - 2)}^\\circ$ である多角形は、何角形ですか。`,
            ans: n,
            post: "角形",
            wrongs: [[n - 1, "MC-POLY-N-1"], [n + 1, "MC-POLY-180N"], [Q(180 * (n - 2), 180), "MC-POLY-180N"]],
            explain: `$n$ 角形の内角の和は $180(n-2)$ です。$180(n-2)=${180 * (n - 2)}$ より $n-2=${n - 2}$、$n=${n}$。`,
          });
        }
        const n = r.pick([6, 8, 9, 10, 12]);
        return num({
          q: `正${n}角形の1つの内角の大きさは、1つの外角の大きさの何倍ですか。`,
          ans: Q(180 * (n - 2), 360),
          post: "倍",
          wrongs: [[Q(360, 180 * (n - 2)), "MC-POLY-EXTERIOR"], [n - 2, "MC-POLY-EXTERIOR"], [Q(n - 2, 1) && Q(n, 2), "MC-POLY-EXTERIOR"]],
          explain: `1つの内角は $180-\\dfrac{360}{${n}}=${decStr(Q(180 * (n - 2), n))}^\\circ$、1つの外角は $\\dfrac{360}{${n}}=${decStr(Q(360, n))}^\\circ$。その比は $${decStr(Q(180 * (n - 2), 360))}$ 倍。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 三角形の合同条件 ───────────────────────────
  congruence: [
    t("choice", (r, lv) => {
      const good = [
        "3組の辺がそれぞれ等しい",
        "2組の辺とその間の角がそれぞれ等しい",
        "1組の辺とその両端の角がそれぞれ等しい",
      ];
      const bad = [
        ["3組の角がそれぞれ等しい", "MC-CONGRUENCE-AAA"],
        ["2組の辺と、その間ではない角がそれぞれ等しい", "MC-CONGRUENCE-SSA"],
        ["1組の辺と、1組の角がそれぞれ等しい", "MC-CONGRUENCE-SA"],
        ["周の長さが等しく、1つの角が等しい", "MC-CONGRUENCE-AAA"],
      ];
      const g = r.pick(good);
      const wrongs = r.sample(bad, 3);
      return choice({
        q: "2つの三角形が合同であるといえる条件は、次のうちどれですか。",
        correct: g,
        wrongs,
        explain: `三角形の合同条件は、①3組の辺がそれぞれ等しい ②2組の辺とその間の角がそれぞれ等しい ③1組の辺とその両端の角がそれぞれ等しい の3つ（直角三角形では斜辺と他の1辺、斜辺と1鋭角もあります）。「3つの角が等しい」だけでは形が同じ（相似）でも大きさがちがうことがあります。「その間ではない角」ではだめな場合があります。`,
      });
    }),
  ],

  // ── 相似比・平行線と線分の比 ───────────────────
  similar_basic: [
    t("num", (r, lv) => {
      const askDE = lv <= 2 ? r.chance(0.5) : false;
      if (askDE) {
        const { ad, db, de, bc } = until(
          () => {
            const ad = r.int(2, 6);
            const db = r.int(1, 6);
            const de = r.int(2, 9);
            return { ad, db, de, bc: (de * (ad + db)) / ad };
          },
          (v) => Number.isInteger(v.bc) && v.bc <= 30,
        );
        const t_ = ad / (ad + db);
        return num({
          q: `図で、$DE\\parallel BC$ です。$AD=${ad}\\,\\mathrm{cm}$、$DB=${db}\\,\\mathrm{cm}$、$BC=${bc}\\,\\mathrm{cm}$ のとき、$DE$ の長さを求めなさい。`,
          fig: triangleParallel({ t: t_, labels: { AD: `${ad}`, DB: `${db}`, BC: `${bc}`, DE: "?" } }),
          ans: de,
          post: "cm",
          wrongs: [[Q(bc * db, ad + db), "MC-SIM-RATIO"], [Q(bc * ad, db), "MC-SIM-RATIO"], [Q(bc * (ad + db), ad), "MC-SIM-RATIO"]],
          explain: `$DE\\parallel BC$ なので $\\triangle ADE\\sim\\triangle ABC$。相似比は $AD:AB=${ad}:${ad + db}$。$DE:BC=${ad}:${ad + db}$ より $DE=${bc}\\times\\dfrac{${ad}}{${ad + db}}=${de}$（$\\mathrm{cm}$）。（$DB$ ではなく $AB=AD+DB$ との比です）`,
        });
      }
      const { ad, db, ec, ae } = until(
        () => {
          const ad = r.int(2, 6);
          const db = r.int(1, 6);
          const ec = r.int(1, 6);
          return { ad, db, ec, ae: (ad * ec) / db };
        },
        (v) => Number.isInteger(v.ae),
      );
      return num({
        q: `図で、$DE\\parallel BC$ です。$AD=${ad}\\,\\mathrm{cm}$、$DB=${db}\\,\\mathrm{cm}$、$EC=${ec}\\,\\mathrm{cm}$ のとき、$AE$ の長さを求めなさい。`,
        fig: triangleParallel({ t: ad / (ad + db), labels: { AD: `${ad}`, DB: `${db}`, EC: `${ec}`, AE: "?" } }),
        ans: ae,
        post: "cm",
        wrongs: [[Q(ec * db, ad), "MC-SIM-RATIO"], [ad + ec, "MC-SIM-RATIO"], [Q(ec * (ad + db), ad), "MC-SIM-RATIO"]],
        explain: `$DE\\parallel BC$ ならば $AD:DB=AE:EC$。$${ad}:${db}=AE:${ec}$ より $AE=${ec}\\times\\dfrac{${ad}}{${db}}=${ae}$（$\\mathrm{cm}$）。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const [p, q] = until(() => [r.int(1, 5), r.int(2, 7)], ([u, v]) => u !== v && gcd(u, v) === 1);
        const k = r.int(2, 4);
        const ab = p * k;
        const de_ = q * k;
        const bc = r.int(2, 9) * p;
        return num({
          q: `$\\triangle ABC\\sim\\triangle DEF$ で、$AB=${ab}\\,\\mathrm{cm}$、$DE=${de_}\\,\\mathrm{cm}$、$BC=${bc}\\,\\mathrm{cm}$ です。$EF$ の長さを求めなさい。`,
          ans: Q(bc * q, p),
          post: "cm",
          wrongs: [[Q(bc * p, q), "MC-SIM-RATIO"], [bc + (de_ - ab), "MC-SIM-RATIO"], [Q(bc * ab, de_), "MC-SIM-RATIO"]],
          explain: `相似な図形では、対応する辺の比が等しくなります。$AB:DE=${ab}:${de_}=${p}:${q}$、$BC:EF=${p}:${q}$ より $EF=${bc}\\times\\dfrac{${q}}{${p}}=${tq(Q(bc * q, p))}$（$\\mathrm{cm}$）。（対応する辺を取りちがえないこと）`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 相似比と面積比・体積比 ─────────────────────
  similar_area_vol: [
    t("num", (r, lv) => {
      const [p, q] = until(() => [r.int(1, 4), r.int(2, 5)], ([u, v]) => u < v && gcd(u, v) === 1);
      const isVol = lv >= 2 && r.chance(0.5);
      const e = isVol ? 3 : 2;
      const unit = isVol ? "cm³" : "cm²";
      const askBig = r.chance(0.5);
      const ratio = Q(q ** e, p ** e); // 大きい方 / 小さい方
      const small = p ** e * r.int(1, 3);
      const big = mul(small, ratio);
      const noun = isVol ? "体積" : "面積";
      const given = askBig ? Q(small) : big;
      return num({
        q: `相似な${isVol ? "2つの立体" : "2つの図形"} $P$、$Q$ の相似比は $${p}:${q}$ です。${askBig ? `$P$ の${noun}が $${small}\\,\\mathrm{${unit.replace("cm³", "cm}^3").replace("cm²", "cm}^2")}$` : `$Q$ の${noun}が $${tq(big)}\\,\\mathrm{${unit.replace("cm³", "cm}^3").replace("cm²", "cm}^2")}$`}のとき、${askBig ? "$Q$" : "$P$"}の${noun}を求めなさい。`.replace(/\\mathrm\{cm\}\^(\d)\$/g, "\\mathrm{cm}^$1$"),
        ans: askBig ? big : Q(small),
        post: unit,
        wrongs: askBig
          ? [[mul(small, Q(q, p)), "MC-SIM-AREA-LINEAR"], [mul(small, Q(q ** (e === 2 ? 3 : 2), p ** (e === 2 ? 3 : 2))), "MC-SIM-AREA-LINEAR"], [mul(small, Q(p ** e, q ** e)), "MC-SIM-RATIO"]]
          : [[mul(big, Q(p, q)), "MC-SIM-AREA-LINEAR"], [mul(big, Q(p ** (e === 2 ? 3 : 2), q ** (e === 2 ? 3 : 2))), "MC-SIM-AREA-LINEAR"], [mul(big, Q(q ** e, p ** e)), "MC-SIM-RATIO"]],
        explain: `相似比が $${p}:${q}$ のとき、${noun}比は $${p}^${e}:${q}^${e}=${p ** e}:${q ** e}$ です。${askBig ? `$Q$ の${noun}は $P$ の $\\dfrac{${q ** e}}{${p ** e}}$ 倍で $${small}\\times\\dfrac{${q ** e}}{${p ** e}}=${tq(big)}$。` : `$P$ の${noun}は $Q$ の $\\dfrac{${p ** e}}{${q ** e}}$ 倍で $${tq(big)}\\times\\dfrac{${p ** e}}{${q ** e}}=${small}$。`}（相似比をそのままかけてはいけません）`,
      });
    }),
  ],

  // ── 円周角の定理 ───────────────────────────────
  circle_angle: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const central = r.pick([60, 80, 100, 120, 140, 150, 160]);
        return num({
          q: `図で、$O$ は円の中心です。$\\angle AOB=${central}^\\circ$ のとき、円周上の点 $C$ に対する $\\angle ACB$ の大きさを求めなさい。`,
          fig: circleAngle({ points: { A: 270 - central / 2, B: 270 + central / 2, C: 90 }, center: true, lines: [["O", "A"], ["O", "B"], ["C", "A"], ["C", "B"]], angleMarks: [{ at: "O", between: ["A", "B"], text: `${central}°` }, { at: "C", between: ["A", "B"], text: "x" }] }),
          ans: central / 2,
          post: "度",
          wrongs: [[central, "MC-CIRCLE-ANGLE-CENTRAL"], [central * 2 > 360 ? 360 - central : central * 2, "MC-CIRCLE-ANGLE-CENTRAL"], [180 - central, "MC-CIRCLE-ANGLE-CENTRAL"]],
          explain: `同じ弧に対する円周角は、中心角の半分です。$\\angle ACB=\\dfrac12\\angle AOB=\\dfrac12\\times ${central}^\\circ=${central / 2}^\\circ$。`,
        });
      }
      if (lv === 2) {
        const insc = r.pick([25, 30, 35, 40, 50, 55, 65]);
        return num({
          q: `図で、$O$ は円の中心です。$\\angle ACB=${insc}^\\circ$ のとき、中心角 $\\angle AOB$ の大きさを求めなさい。`,
          fig: circleAngle({ points: { A: 270 - insc, B: 270 + insc, C: 90 }, center: true, lines: [["O", "A"], ["O", "B"], ["C", "A"], ["C", "B"]], angleMarks: [{ at: "C", between: ["A", "B"], text: `${insc}°` }, { at: "O", between: ["A", "B"], text: "x" }] }),
          ans: insc * 2,
          post: "度",
          wrongs: [[insc, "MC-CIRCLE-ANGLE-CENTRAL"], [180 - insc, "MC-CIRCLE-ANGLE-CENTRAL"], [insc * 4, "MC-CIRCLE-ANGLE-CENTRAL"]],
          explain: `中心角は、同じ弧に対する円周角の2倍です。$\\angle AOB=2\\times ${insc}^\\circ=${insc * 2}^\\circ$。`,
        });
      }
      const kind = r.pick(["diam", "cyc"]);
      if (kind === "diam") {
        const a = r.pick([25, 30, 35, 40, 50, 55, 60]);
        return num({
          q: `図で、$AB$ は円の直径、$C$ は円周上の点です。$\\angle CAB=${a}^\\circ$ のとき、$\\angle ABC$ の大きさを求めなさい。`,
          fig: circleAngle({ points: { A: 180, B: 0, C: 2 * a }, center: true, oLabel: [0, 18], lines: [["A", "B"], ["A", "C"], ["B", "C"]], angleMarks: [{ at: "A", between: ["B", "C"], text: `${a}°` }, { at: "B", between: ["A", "C"], text: "x" }] }),
          ans: 90 - a,
          post: "度",
          wrongs: [[180 - a, "MC-CIRCLE-ANGLE-DIAM"], [90 + a, "MC-CIRCLE-ANGLE-DIAM"], [a, "MC-CIRCLE-ANGLE-DIAM"]],
          explain: `直径に対する円周角は $90^\\circ$ なので $\\angle ACB=90^\\circ$。三角形の内角の和より $\\angle ABC=180-90-${a}=${90 - a}^\\circ$。`,
        });
      }
      const a = r.pick([70, 80, 95, 100, 105, 110, 115]);
      return num({
        q: `四角形 $ABCD$ は円に内接しています。$\\angle A=${a}^\\circ$ のとき、$\\angle C$ の大きさを求めなさい。`,
        fig: circleAngle({ points: { A: 200 + 2 * a + 180 - a, B: 200, C: 200 + a, D: 200 + 2 * a }, lines: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]], angleMarks: [{ at: "A", between: ["B", "D"], text: `${a}°` }, { at: "C", between: ["B", "D"], text: "x" }] }),
        ans: 180 - a,
        post: "度",
        wrongs: [[a, "MC-CIRCLE-ANGLE-CYCLIC"], [360 - a, "MC-CIRCLE-ANGLE-CYCLIC"], [90 - (a % 90), "MC-CIRCLE-ANGLE-CYCLIC"]],
        explain: `円に内接する四角形の向かい合う角の和は $180^\\circ$ です。$\\angle C=180^\\circ-${a}^\\circ=${180 - a}^\\circ$。`,
      });
    }),
  ],

  // ── 三平方の定理 ───────────────────────────────
  pythagorean: [
    t("num", (r, lv) => {
      const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
      const [a0, b0, c0] = r.pick(lv === 1 ? triples.slice(0, 3) : triples);
      const k = lv === 1 ? r.pick([1, 2, 3]) : r.pick([1, 2, 3, 4]);
      const [a, b, c] = [a0 * k, b0 * k, c0 * k];
      const askHyp = lv === 1 ? true : r.chance(0.4);
      if (askHyp) {
        return num({
          q: `直角をはさむ2辺の長さが $${a}\\,\\mathrm{cm}$ と $${b}\\,\\mathrm{cm}$ の直角三角形の、斜辺の長さを求めなさい。`,
          fig: rightTriangle({ base: b, height: a, baseLabel: `${b}`, heightLabel: `${a}`, hypLabel: "?" }),
          ans: c,
          post: "cm",
          wrongs: [[a + b, "MC-PYTH-ADD"], [Math.round(Math.sqrt(a * a + b * b)) === c ? c + 1 : a * a + b * b, "MC-PYTH-NOSQRT"], [Math.abs(b - a), "MC-PYTH-ADD"]],
          explain: `斜辺を $c$ とすると $a^2+b^2=c^2$。$${a}^2+${b}^2=${a * a}+${b * b}=${c * c}$ より $c=\\sqrt{${c * c}}=${c}$（$\\mathrm{cm}$）。`,
        });
      }
      return num({
        q: `斜辺の長さが $${c}\\,\\mathrm{cm}$、他の1辺が $${a}\\,\\mathrm{cm}$ の直角三角形の、残りの1辺の長さを求めなさい。`,
        fig: rightTriangle({ base: b, height: a, baseLabel: "?", heightLabel: `${a}`, hypLabel: `${c}` }),
        ans: b,
        post: "cm",
        wrongs: [[c - a, "MC-PYTH-ADD"], [c * c - a * a, "MC-PYTH-NOSQRT"], [Math.round(Math.sqrt(c * c + a * a)), "MC-PYTH-HYP-LEG"]],
        explain: `斜辺が $c=${c}$ なので、$a^2+x^2=c^2$。$x^2=${c}^2-${a}^2=${c * c}-${a * a}=${b * b}$ より $x=${b}$（$\\mathrm{cm}$）。斜辺は他の2辺の和にはなりません。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 答えが a√b になる（根号を含む）
        const { a, b } = until(
          () => ({ a: r.int(1, 6), b: r.int(1, 7) }),
          (v) => v.a !== v.b && sqrtParts(v.a * v.a + v.b * v.b).b > 1,
        );
        const n = a * a + b * b;
        const { a: ca, b: cb } = sqrtParts(n);
        return fields({
          q: `直角をはさむ2辺の長さが $${a}\\,\\mathrm{cm}$ と $${b}\\,\\mathrm{cm}$ の直角三角形の、斜辺の長さを $a\\sqrt{b}$ の形で答えなさい。（$a=1$ のときは $1$ と答えます）`,
          fig: rightTriangle({ base: b, height: a, baseLabel: `${b}`, heightLabel: `${a}`, hypLabel: "?" }),
          layout: "sqrt",
          fields: [
            { id: "a", value: ca },
            { id: "b", value: cb },
          ],
          wrongs: [{ values: { a: 1, b: n }, mc: "MC-SQRT-PARTIAL" }, { values: { a: a + b, b: 1 }, mc: "MC-PYTH-ADD" }, { values: { a: cb, b: ca }, mc: "MC-SQRT-SWAP" }],
          explain: `斜辺を $c$ とすると $c^2=${a}^2+${b}^2=${n}$。$c=\\sqrt{${n}}${ca > 1 ? `=${ca}\\sqrt{${cb}}` : ""}$（$\\mathrm{cm}$）。`,
        });
      },
      { id: "b", db: 0.4 },
    ),
  ],

  // ── 三平方の定理の利用 ─────────────────────────
  pythagorean_apps: [
    t("fields", (r, lv) => {
      const kind = lv === 1 ? r.pick(["45", "60"]) : r.pick(["45", "60", "tri-h"]);
      if (kind === "45") {
        const s = r.int(2, 9);
        return fields({
          q: `直角二等辺三角形で、等しい2辺の長さが $${s}\\,\\mathrm{cm}$ のとき、斜辺の長さを $a\\sqrt{b}$ の形で答えなさい。`,
          layout: "sqrt",
          fields: [
            { id: "a", value: s },
            { id: "b", value: 2 },
          ],
          wrongs: [{ values: { a: 2 * s, b: 1 }, mc: "MC-PYTH-45" }, { values: { a: s, b: 3 }, mc: "MC-PYTH-45" }, { values: { a: 1, b: s * s }, mc: "MC-SQRT-PARTIAL" }, { values: { a: s, b: 1 }, mc: "MC-PYTH-45" }],
          explain: `直角二等辺三角形の辺の比は $1:1:\\sqrt{2}$。斜辺は $${s}\\times\\sqrt{2}=${s}\\sqrt{2}$（$\\mathrm{cm}$）。（三平方の定理 $${s}^2+${s}^2=${2 * s * s}$、$\\sqrt{${2 * s * s}}=${s}\\sqrt2$）`,
        });
      }
      if (kind === "60") {
        const s = r.int(1, 8) * 2;
        return fields({
          q: `正三角形の1辺の長さが $${s}\\,\\mathrm{cm}$ のとき、この正三角形の高さを $a\\sqrt{b}$ の形で答えなさい。`,
          layout: "sqrt",
          fields: [
            { id: "a", value: s / 2 },
            { id: "b", value: 3 },
          ],
          wrongs: [{ values: { a: s, b: 3 }, mc: "MC-PYTH-60" }, { values: { a: s / 2, b: 2 }, mc: "MC-PYTH-60" }, { values: { a: s / 2, b: 1 }, mc: "MC-PYTH-60" }, { values: { a: s, b: 1 }, mc: "MC-PYTH-60" }].filter((w) => !(w.values.a === s / 2 && w.values.b === 3)),
          explain: `高さで2つの直角三角形（辺の比 $1:2:\\sqrt{3}$）に分けます。底辺の半分は $${s / 2}$、斜辺は $${s}$。高さは $\\sqrt{${s}^2-${s / 2}^2}=\\sqrt{${s * s - (s * s) / 4}}=${s / 2}\\sqrt{3}$（$\\mathrm{cm}$）。`,
        });
      }
      const s = r.int(1, 6) * 2;
      return fields({
        q: `直角三角形で、鋭角の1つが $30^\\circ$ で、斜辺の長さが $${s}\\,\\mathrm{cm}$ です。斜辺に対して $60^\\circ$ の角のとなりにある辺（$30^\\circ$ の角の対辺ではない、長い方の辺）の長さを $a\\sqrt{b}$ の形で答えなさい。`,
        layout: "sqrt",
        fields: [
          { id: "a", value: s / 2 },
          { id: "b", value: 3 },
        ],
        wrongs: [{ values: { a: s, b: 3 }, mc: "MC-PYTH-60" }, { values: { a: s / 2, b: 1 }, mc: "MC-PYTH-60" }, { values: { a: s / 2, b: 2 }, mc: "MC-PYTH-60" }].filter((w) => !(w.values.a === s / 2 && w.values.b === 3)),
        explain: `$30^\\circ,\\ 60^\\circ,\\ 90^\\circ$ の直角三角形の辺の比は $1:2:\\sqrt{3}$。斜辺が $${s}$ なので、短い辺は $${s / 2}$、長い辺は $${s / 2}\\sqrt{3}$（$\\mathrm{cm}$）。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const kind = lv <= 2 ? r.pick(["box", "cone"]) : r.pick(["box", "chord", "cone"]);
        if (kind === "box") {
          const [a, b, c, d] = r.pick([[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 10, 11, 15], [3, 4, 12, 13], [2, 6, 9, 11], [4, 4, 7, 9]]);
          return num({
            q: `たて $${a}\\,\\mathrm{cm}$、横 $${b}\\,\\mathrm{cm}$、高さ $${c}\\,\\mathrm{cm}$ の直方体の対角線の長さを求めなさい。`,
            ans: d,
            post: "cm",
            wrongs: [[a + b + c, "MC-PYTH-ADD"], [a * a + b * b + c * c, "MC-PYTH-NOSQRT"], [Math.round(Math.sqrt(a * a + b * b)) + c, "MC-PYTH-BOX"]],
            explain: `直方体の対角線の長さは $\\sqrt{a^2+b^2+c^2}$。$\\sqrt{${a}^2+${b}^2+${c}^2}=\\sqrt{${a * a + b * b + c * c}}=${d}$（$\\mathrm{cm}$）。`,
          });
        }
        if (kind === "cone") {
          const [rr, h, l] = r.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [4, 3, 5], [12, 5, 13]]);
          return num({
            q: `底面の半径が $${rr}\\,\\mathrm{cm}$、母線の長さが $${l}\\,\\mathrm{cm}$ の円錐の高さを求めなさい。`,
            ans: h,
            post: "cm",
            wrongs: [[l - rr, "MC-PYTH-ADD"], [l * l - rr * rr, "MC-PYTH-NOSQRT"], [Math.round(Math.sqrt(l * l + rr * rr)), "MC-PYTH-HYP-LEG"]],
            explain: `円錐の高さ・底面の半径・母線は、母線を斜辺とする直角三角形をつくります。$h^2+${rr}^2=${l}^2$ より $h^2=${l * l - rr * rr}$、$h=${h}$（$\\mathrm{cm}$）。`,
          });
        }
        const [R, dd, half] = r.pick([[5, 3, 4], [13, 5, 12], [10, 6, 8], [17, 8, 15], [5, 4, 3]]);
        return num({
          q: `半径 $${R}\\,\\mathrm{cm}$ の円で、中心から $${dd}\\,\\mathrm{cm}$ の距離にある弦の長さを求めなさい。`,
          ans: 2 * half,
          post: "cm",
          wrongs: [[half, "MC-PYTH-CHORD"], [2 * (R - dd), "MC-PYTH-CHORD"], [2 * Math.round(Math.sqrt(R * R + dd * dd)), "MC-PYTH-CHORD"]],
          explain: `中心から弦に垂線をひくと、弦の中点を通ります。半径・中心からの距離・弦の半分で直角三角形ができるので、弦の半分は $\\sqrt{${R}^2-${dd}^2}=${half}$。弦の長さは $2\\times ${half}=${2 * half}$（$\\mathrm{cm}$）。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── ヒストグラム・度数分布・相対度数 ────────────
  freq_table: [
    t("num", (r, lv) => {
      const nclass = 5;
      const start = r.pick([140, 150, 20, 40]);
      const width = start >= 100 ? 5 : 10;
      const freq = until(() => Array.from({ length: nclass }, () => r.int(1, 12)), (v) => v.reduce((a, b) => a + b, 0) % 4 === 0 || v.reduce((a, b) => a + b, 0) % 5 === 0);
      const total = freq.reduce((a, b) => a + b, 0);
      const labels = Array.from({ length: nclass }, (_, i) => `${start + i * width}`);
      const unit = start >= 100 ? "cm" : "点";
      const cls = (i) => `${start + i * width}以上${start + (i + 1) * width}未満`;
      const idx = r.int(0, nclass - 1);
      const table = freq.map((f_, i) => `${cls(i)}: ${f_}人`).join("、");
      const head = `ある学年の${unit === "cm" ? "身長" : "テストの点数"}を調べて、次の度数分布表を作りました（単位は${unit}）。\n${table}（合計 ${total} 人）`;
      if (lv === 1) {
        const rel = Q(freq[idx], total);
        return num({
          q: `${head}\n「${cls(idx)}」の階級の相対度数を求めなさい。`,
          fig: bars({ labels, values: freq, unit: "人" }),
          ans: rel,
          wrongs: [[Q(freq[idx], 1), "MC-FREQ-REL"], [Q(total, freq[idx]), "MC-FREQ-REL"], [Q(freq[idx], nclass), "MC-FREQ-REL"]],
          explain: `相対度数 ＝ その階級の度数 ÷ 度数の合計。$${freq[idx]}\\div ${total}=${decStr(rel)}$。`,
        });
      }
      if (lv === 2) {
        const cum = freq.slice(0, idx + 1).reduce((a, b) => a + b, 0);
        return num({
          q: `${head}\n「${cls(idx)}」の階級までの累積度数を求めなさい。`,
          fig: bars({ labels, values: freq, unit: "人" }),
          ans: cum,
          post: "人",
          wrongs: [[freq[idx], "MC-FREQ-CUM"], [Q(cum, total), "MC-FREQ-CUM"], [cum - freq[0], "MC-FREQ-CUM"]],
          explain: `累積度数は、いちばん小さい階級から、その階級までの度数を順にたした数です。$${freq.slice(0, idx + 1).join("+")}=${cum}$（人）。`,
        });
      }
      const mids = freq.map((_, i) => start + i * width + width / 2);
      const meanQ = Q(freq.reduce((s, f_, i) => s + f_ * mids[i] * 2, 0), total * 2);
      return num({
        q: `${head}\n階級値を使って、平均値を求めなさい。（階級値は、その階級の真ん中の値です）`,
        ans: meanQ,
        post: unit,
        wrongs: [[Q(Math.round(mids.reduce((a, b) => a + b, 0) * 2), nclass * 2), "MC-FREQ-MEAN"], [Q(freq.reduce((s, f_, i) => s + f_ * (start + i * width), 0), total), "MC-FREQ-MEAN"], [mids[freq.indexOf(Math.max(...freq))], "MC-FREQ-MEAN"]],
        explain: `（階級値 × 度数）の合計を、度数の合計でわります。階級値は ${mids.join("、")}。$\\dfrac{${freq.map((f_, i) => `${mids[i]}\\times ${f_}`).join("+")}}{${total}}=${decStr(meanQ)}$。`,
      });
    }),
  ],

  // ── 確率 ───────────────────────────────────────
  prob_basic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [red, white] = until(() => [r.int(1, 7), r.int(1, 8)], ([u, v]) => u !== v);
        return num({
          q: `袋の中に、赤玉が ${red} 個、白玉が ${white} 個入っています。この袋から玉を1個取り出すとき、赤玉が出る確率を求めなさい。（すべての玉の出やすさは同じとします）`,
          reduced: true,
          ans: Q(red, red + white),
          wrongs: [[Q(red, white), "MC-PROB-RATIO"], [Q(1, red + white), "MC-PROB-RATIO"], [Q(white, red + white), "MC-PROB-COMPLEMENT"]],
          explain: `確率 ＝ 起こる場合の数 ÷ 全体の場合の数。全体は $${red}+${white}=${red + white}$ 通り、赤玉は $${red}$ 通り。$\\dfrac{${red}}{${red + white}}$ ${gcd(red, red + white) > 1 ? `$=${tq(Q(red, red + white))}$` : ""}。（白玉の個数でわってはいけません）`,
        });
      }
      if (lv === 2) {
        const kind = r.pick(["multiple", "prime", "gt"]);
        const n = 6;
        if (kind === "multiple") {
          const k = r.pick([2, 3]);
          const cnt = Math.floor(n / k);
          return num({
            q: `1つのさいころを投げるとき、${k} の倍数の目が出る確率を求めなさい。`,
            reduced: true,
            ans: Q(cnt, n),
            wrongs: [[Q(1, k), "MC-PROB-RATIO"], [Q(cnt, n - cnt), "MC-PROB-RATIO"], [Q(n - cnt, n), "MC-PROB-COMPLEMENT"]],
            explain: `全体は $6$ 通り。${k} の倍数は ${Array.from({ length: cnt }, (_, i) => (i + 1) * k).join("、")} の $${cnt}$ 通り。確率は $\\dfrac{${cnt}}{6}=${tq(Q(cnt, 6))}$。`,
          });
        }
        if (kind === "prime") {
          return num({
            q: `1つのさいころを投げるとき、素数の目が出る確率を求めなさい。`,
            reduced: true,
            ans: Q(3, 6),
            wrongs: [[Q(2, 6), "MC-PROB-PRIME"], [Q(4, 6), "MC-PROB-PRIME"], [Q(1, 6), "MC-PROB-RATIO"]],
            explain: `素数は $2,\\ 3,\\ 5$ の $3$ 通り（$1$ は素数ではありません）。確率は $\\dfrac{3}{6}=\\dfrac12$。`,
          });
        }
        const k = r.int(2, 5);
        return num({
          q: `1から10までの整数を1つずつ書いた10枚のカードから、1枚ひくとき、${k} より大きい数が出る確率を求めなさい。`,
          reduced: true,
          ans: Q(10 - k, 10),
          wrongs: [[Q(11 - k, 10), "MC-PROB-BOUNDARY"], [Q(k, 10), "MC-PROB-COMPLEMENT"], [Q(9 - k, 10), "MC-PROB-BOUNDARY"]],
          explain: `${k} より大きい数は ${k + 1} から 10 までの $${10 - k}$ 通り（${k} はふくみません）。確率は $\\dfrac{${10 - k}}{10}=${tq(Q(10 - k, 10))}$。`,
        });
      }
      const kind = r.pick(["atleast", "coins"]);
      if (kind === "atleast") {
        const n = r.pick([3, 4]);
        return num({
          q: `硬貨を ${n} 枚同時に投げるとき、少なくとも1枚は表が出る確率を求めなさい。`,
          reduced: true,
          ans: Q(2 ** n - 1, 2 ** n),
          wrongs: [[Q(1, 2 ** n), "MC-PROB-COMPLEMENT"], [Q(n, 2 ** n), "MC-PROB-COUNT"], [Q(1, 2), "MC-PROB-COUNT"]],
          explain: `「少なくとも1枚は表」の反対（余事象）は「すべて裏」で、その確率は $\\left(\\dfrac12\\right)^{${n}}=\\dfrac{1}{${2 ** n}}$。求める確率は $1-\\dfrac{1}{${2 ** n}}=\\dfrac{${2 ** n - 1}}{${2 ** n}}$。`,
        });
      }
      const [a, b] = r.pick([[3, 2], [4, 2], [4, 3], [5, 3]]);
      const total = a + b;
      return num({
        q: `赤玉が ${a} 個、白玉が ${b} 個入った袋から、玉を1個取り出して色を確かめ、もとにもどしてからもう1個取り出します。2回とも赤玉が出る確率を求めなさい。`,
        reduced: true,
        ans: Q(a * a, total * total),
        wrongs: [[Q(a * (a - 1), total * (total - 1)), "MC-PROB-REPLACE"], [Q(2 * a, total * 2), "MC-PROB-COUNT"], [Q(a, total), "MC-PROB-COUNT"]],
        explain: `もとにもどすので、1回目も2回目も赤玉の確率は $\\dfrac{${a}}{${total}}$。2回とも赤玉の確率は積で $\\dfrac{${a}}{${total}}\\times\\dfrac{${a}}{${total}}=\\dfrac{${a * a}}{${total * total}}$。`,
      });
    }),
  ],

  // ── 確率（2つのさいころ・くじ・順に取り出す） ─────
  prob_multi: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const target = r.pick([3, 4, 5, 6, 7, 8, 9, 10, 11]);
        const cnt = target <= 7 ? target - 1 : 13 - target;
        return num({
          q: `大小2つのさいころを同時に投げるとき、目の和が ${target} になる確率を求めなさい。`,
          reduced: true,
          ans: Q(cnt, 36),
          wrongs: [[Q(cnt, 21), "MC-PROB-DISTINCT"], [Q(1, 36), "MC-PROB-COUNT"], [Q(cnt, 12), "MC-PROB-DISTINCT"]],
          explain: `2つのさいころの目の出方は全部で $6\\times 6=36$ 通り（大小を区別）。和が ${target} になるのは $${cnt}$ 通り。確率は $\\dfrac{${cnt}}{36}=${tq(Q(cnt, 36))}$。`,
        });
      }
      if (lv === 2) {
        const [red, white] = r.pick([[2, 3], [3, 2], [2, 2], [3, 3], [1, 4], [4, 2], [2, 4], [3, 4], [4, 3], [5, 2]]);
        const total = red + white;
        const cnt = (red * (red - 1)) / 2;
        const all = (total * (total - 1)) / 2;
        return num({
          q: `赤玉が ${red} 個、白玉が ${white} 個入った袋から、同時に2個の玉を取り出すとき、2個とも赤玉である確率を求めなさい。`,
          reduced: true,
          ans: Q(cnt, all),
          wrongs: [[Q(red * red, total * total), "MC-PROB-REPLACE"], [Q(red * (red - 1), total * (total - 1)) && Q(cnt * 2, all), "MC-PROB-DISTINCT"], [Q(red, total), "MC-PROB-COUNT"]],
          explain: `玉を区別して、2個の選び方は全部で $\\dfrac{${total}\\times ${total - 1}}{2}=${all}$ 通り。2個とも赤玉になるのは $\\dfrac{${red}\\times ${red - 1}}{2}=${cnt}$ 通り。確率は $\\dfrac{${cnt}}{${all}}=${tq(Q(cnt, all))}$。`,
        });
      }
      const [red, white] = r.pick([[3, 2], [4, 3], [3, 4], [5, 3], [2, 3], [4, 2], [5, 2], [2, 5], [6, 3], [3, 5]]);
      const total = red + white;
      const cnt = red * white * 2;
      const all = total * (total - 1);
      return num({
        q: `赤玉が ${red} 個、白玉が ${white} 個入った袋から、玉を1個取り出してもとにもどさずに、続けてもう1個取り出します。1個目と2個目の色がちがう確率を求めなさい。`,
        reduced: true,
        ans: Q(cnt, all),
        wrongs: [[Q(red * white, total * total), "MC-PROB-REPLACE"], [Q(red * white, all), "MC-PROB-ORDER"], [Q(2 * red * white, total * total), "MC-PROB-REPLACE"]],
        explain: `もとにもどさないので、全体は $${total}\\times ${total - 1}=${all}$ 通り。（赤→白）は $${red}\\times ${white}$ 通り、（白→赤）も $${white}\\times ${red}$ 通りで、合わせて $${cnt}$ 通り。確率は $\\dfrac{${cnt}}{${all}}=${tq(Q(cnt, all))}$。`,
      });
    }),
  ],

  // ── 四分位数・箱ひげ図 ─────────────────────────
  quartile_box: [
    t("num", (r, lv) => {
      const n = lv === 1 ? 7 : lv === 2 ? 8 : 11;
      const data = until(() => Array.from({ length: n }, () => r.int(2, 40)).sort((a, b) => a - b), (v) => new Set(v).size === n);
      const median = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
      const half = Math.floor(n / 2);
      const lower = data.slice(0, half);
      const upper = data.slice(n - half);
      const q1 = median(lower);
      const q3 = median(upper);
      const shuffled = r.shuffle(data);
      const iqr = q3 - q1;
      // 誤答：奇数個のとき中央値を下位・上位にふくめる
      const lowerWith = n % 2 ? data.slice(0, half + 1) : lower;
      const upperWith = n % 2 ? data.slice(n - half - 1) : upper;
      const wrongIqr = median(upperWith) - median(lowerWith);
      return num({
        q: `次の ${n} 個のデータの四分位範囲（第3四分位数 − 第1四分位数）を求めなさい。\n${shuffled.join("、")}`,
        ans: Q(Math.round(iqr * 2), 2),
        wrongs: [[Q(Math.round(wrongIqr * 2), 2), "MC-QUARTILE-MEDIAN"], [data[n - 1] - data[0], "MC-QUARTILE-RANGE"], [Q(Math.round(median(data) * 2), 2), "MC-QUARTILE-MEDIAN"], [Q(Math.round((q3 + q1) * 2), 2), "MC-QUARTILE-RANGE"]],
        explain: `小さい順に並べると $${data.join(",\\ ")}$。中央値で前半・後半に分けます${n % 2 ? "（データの数が奇数のときは、中央値そのものはどちらにもふくめません）" : ""}。前半 $${lower.join(",\\ ")}$ の中央値が第1四分位数 $${decStr(Q(Math.round(q1 * 2), 2))}$、後半 $${upper.join(",\\ ")}$ の中央値が第3四分位数 $${decStr(Q(Math.round(q3 * 2), 2))}$。四分位範囲は $${decStr(Q(Math.round(q3 * 2), 2))}-${decStr(Q(Math.round(q1 * 2), 2))}=${decStr(Q(Math.round(iqr * 2), 2))}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const min = r.int(2, 12);
        const q1 = min + r.int(3, 8);
        const med = q1 + r.int(2, 8);
        const q3 = med + r.int(2, 9);
        const max = q3 + r.int(3, 12);
        const lo = Math.floor(min / 5) * 5;
        const hi = Math.ceil(max / 5) * 5;
        const which = r.pick(["range", "iqr", "half"]);
        const ans = which === "range" ? max - min : which === "iqr" ? q3 - q1 : Math.round(0);
        if (which === "half") {
          return num({
            q: `図は、あるデータの箱ひげ図です。最小値 $${min}$、第1四分位数 $${q1}$、中央値 $${med}$、第3四分位数 $${q3}$、最大値 $${max}$ です。データの個数が $40$ 個のとき、$${med}$ 以上の値は少なくとも何個ありますか。`,
            fig: boxPlot({ min, q1, med, q3, max, lo, hi }),
            ans: 20,
            post: "個",
            wrongs: [[10, "MC-QUARTILE-COUNT"], [30, "MC-QUARTILE-COUNT"], [40, "MC-QUARTILE-COUNT"]],
            explain: `中央値より大きい（以上）のデータは全体の約半分。$40$ 個のデータでは、中央値以上のデータは $20$ 個以上あります。（第3四分位数以上なら約 $10$ 個）`,
          });
        }
        return num({
          q: `図は、あるデータの箱ひげ図です。最小値 $${min}$、第1四分位数 $${q1}$、中央値 $${med}$、第3四分位数 $${q3}$、最大値 $${max}$ です。${which === "range" ? "範囲（最大値 − 最小値）" : "四分位範囲（第3四分位数 − 第1四分位数）"}を求めなさい。`,
          fig: boxPlot({ min, q1, med, q3, max, lo, hi }),
          ans,
          wrongs: which === "range" ? [[q3 - q1, "MC-QUARTILE-RANGE"], [max, "MC-QUARTILE-RANGE"], [max - med, "MC-QUARTILE-RANGE"]] : [[max - min, "MC-QUARTILE-RANGE"], [q3 - med, "MC-QUARTILE-RANGE"], [med - q1, "MC-QUARTILE-RANGE"]],
          explain: which === "range" ? `範囲は、ひげの両端の差。$${max}-${min}=${max - min}$。` : `四分位範囲は、箱の幅。$${q3}-${q1}=${q3 - q1}$。`,
        });
      },
      { id: "b", db: 0.1 },
    ),
  ],
};
