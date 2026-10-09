// ============================================================
// tpl/hs_geom.js — 高校 図形と計量・図形と方程式・ベクトル
//   trig_ratio / trig_laws / triangle_area_trig / coord_line / coord_circle / vector_basic
//
//  すべて自作の数値・言い回し・図。答えは浮動小数の計算や別の求め方でも確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert, gcd } from "./util.js";
import { nearly, isqrt } from "./hs_util.js";
import { rightTriangle } from "./fig.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const rad = (d) => (d * Math.PI) / 180;
const FN_TEX = { sin: "\\sin", cos: "\\cos", tan: "\\tan" };
const fnOf = (fn, x) => (fn === "sin" ? Math.sin(x) : fn === "cos" ? Math.cos(x) : Math.tan(x));

/** 浮動小数を、分母が小さい有理数として読みとる（見つからなければ null） */
function rationalize(v, maxDen = 16) {
  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(v * d);
    if (Math.abs(v * d - n) < 1e-9) return Q(n, d);
  }
  return null;
}
/** 整数を n = s²·m（m は平方因子なし）に分ける */
function sqrtSplit(n) {
  let s = 1;
  let m = n;
  for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) [m, s] = [m / (f * f), s * f];
  return { s, m };
}

/** 負の数は括弧つきで */
const pnn = (n) => (n < 0 ? `(${n})` : `${n}`);

/** 円の方程式 (x−a)²+(y−b)²=r² の TeX。asRadius=true なら右辺を r（√ つき）にする（誤答用） */
function circleTex(a, b, r2, asRadius = false) {
  const term = (v, name) => (v === 0 ? `${name}^{2}` : `(${name}${v < 0 ? "+" : "-"}${Math.abs(v)})^{2}`);
  const rt = Math.round(Math.sqrt(r2));
  const rhs = asRadius ? (rt * rt === r2 ? String(rt) : `\\sqrt{${r2}}`) : String(r2);
  return `${term(a, "x")}+${term(b, "y")}=${rhs}`;
}

/** 三辺が整数の直角三角形（脚, 脚, 斜辺） */
const TRI = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [6, 8, 10]];

/** 誤答候補 [TeX, mc] を重複なしで選択肢にする */
function labels(list, correct) {
  const seen = new Set([correct]);
  const out = [];
  for (const [w, mc] of list) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push([$(w), mc]);
  }
  return out;
}

// ------------------------------------------------------------
// 特別な角の値でつくる式（値が有理数になるものだけ集める）
// ------------------------------------------------------------
const ATOMS = [];
for (const fn of ["sin", "cos", "tan"]) for (const d of [30, 45, 60]) ATOMS.push({ fn, d, tex: `${FN_TEX[fn]}\\,${d}^{\\circ}`, tex2: `${FN_TEX[fn]}^{2}${d}^{\\circ}`, val: fnOf(fn, rad(d)) });
const COMBOS = { 1: [], 2: [], 3: [] };
(function buildCombos() {
  const seen = new Set();
  const push = (lv, tex, v) => {
    const q = rationalize(v);
    if (!q || seen.has(tex)) return;
    seen.add(tex);
    COMBOS[lv].push({ tex, ans: q });
  };
  for (const a of ATOMS) {
    for (const b of ATOMS) {
      if (a === b) continue;
      push(1, `${a.tex}+${b.tex}`, a.val + b.val);
      push(1, `${a.tex}\\times ${b.tex}`, a.val * b.val);
      push(2, `${a.tex}-${b.tex}`, a.val - b.val);
      push(2, `${a.tex2}+${b.tex2}`, a.val ** 2 + b.val ** 2);
      push(2, `${a.tex2}-${b.tex2}`, a.val ** 2 - b.val ** 2);
      for (const c of ATOMS) {
        if (c === a || c === b) continue;
        push(3, `${a.tex}\\times ${b.tex}+${c.tex}`, a.val * b.val + c.val);
        push(3, `${a.tex}\\times ${b.tex}-${c.tex2}`, a.val * b.val - c.val ** 2);
      }
    }
  }
})();

export default {
  // ── 三角比 ────────────────────────────────────
  trig_ratio: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        const [p, q, h] = r.pick(lv === 1 ? TRI.slice(0, 4) : TRI);
        const [base, height] = r.chance(0.5) ? [q, p] : [p, q];
        const at = lv === 1 ? "B" : r.pick(["B", "C"]);
        // θ の対辺・隣辺
        const [opp, adj] = at === "B" ? [height, base] : [base, height];
        const fn = r.pick(["sin", "cos", "tan"]);
        const ans = fn === "sin" ? Q(opp, h) : fn === "cos" ? Q(adj, h) : Q(opp, adj);
        nearly(fnOf(fn, Math.atan2(opp, adj)), qnum(ans), "三角比の検算", 1e-9);
        const wrongs =
          fn === "sin"
            ? [[Q(adj, h), "MC-TRIG-RATIO-OPP-ADJ"], [Q(h, opp), "MC-TRIG-RATIO-INVERT"], [Q(opp, adj), "MC-TRIG-RATIO-OPP-ADJ"]]
            : fn === "cos"
              ? [[Q(opp, h), "MC-TRIG-RATIO-OPP-ADJ"], [Q(h, adj), "MC-TRIG-RATIO-INVERT"], [Q(adj, opp), "MC-TRIG-RATIO-OPP-ADJ"]]
              : [[Q(adj, opp), "MC-TRIG-RATIO-INVERT"], [Q(opp, h), "MC-TRIG-RATIO-OPP-ADJ"], [Q(adj, h), "MC-TRIG-RATIO-OPP-ADJ"]];
        return num({
          q: `図の直角三角形で、$\\angle ${at}=\\theta$ とします。${lv === 2 ? "斜辺の長さは自分で求めて、" : ""}$${FN_TEX[fn]}\\theta$ の値を求めなさい。（分数で答えます）`,
          fig: rightTriangle({ base, height, baseLabel: String(base), heightLabel: String(height), hypLabel: lv === 2 ? "?" : String(h), vertexLabels: true, theta: at }),
          ans,
          reduced: true,
          wrongs,
          explain: `$\\theta$ の位置で「対辺」「隣辺」「斜辺」を決めます。$\\angle ${at}$ の対辺は ${opp}、隣辺は ${adj}${lv === 2 ? `、斜辺は三平方の定理より $\\sqrt{${p}^2+${q}^2}=${h}$` : `、斜辺は ${h}`}。$\\sin\\theta=\\dfrac{\\text{対辺}}{\\text{斜辺}}$、$\\cos\\theta=\\dfrac{\\text{隣辺}}{\\text{斜辺}}$、$\\tan\\theta=\\dfrac{\\text{対辺}}{\\text{隣辺}}$ なので、$${FN_TEX[fn]}\\theta=${tq(ans)}$。`,
        });
      }
      // 鈍角：sin や cos が与えられて、もう一方（符号に注意）
      const [p, q, h] = r.pick(TRI.slice(0, 5));
      const known = r.pick(["sin", "cos"]);
      const ask = r.pick(["cos", "sin", "tan"].filter((f) => f !== known));
      const theta = known === "sin" ? Math.PI - Math.asin(p / h) : Math.acos(-p / h);
      const givenTex = known === "sin" ? `\\sin\\theta=\\dfrac{${p}}{${h}}` : `\\cos\\theta=-\\dfrac{${p}}{${h}}`;
      const s2 = known === "sin" ? Q(p, h) : Q(q, h);
      const c2 = known === "sin" ? Q(-q, h) : Q(-p, h);
      const ans = ask === "sin" ? s2 : ask === "cos" ? c2 : div(s2, c2);
      nearly(fnOf(ask, theta), qnum(ans), "鈍角の三角比の検算", 1e-9);
      const abs = (x) => (x.n < 0 ? neg(x) : x);
      return num({
        q: `$\\theta$ は鈍角（$90^{\\circ}<\\theta<180^{\\circ}$）で、$${givenTex}$ です。$${FN_TEX[ask]}\\theta$ の値を求めなさい。（分数で答えます）`,
        ans,
        reduced: true,
        wrongs: [[abs(ans), "MC-TRIG-SIGN-QUADRANT"], [neg(ans), "MC-TRIG-SIGN-QUADRANT"], [ask === "tan" ? div(c2, s2) : ask === "sin" ? abs(c2) : abs(s2), "MC-TRIG-SIN-COS-SWAP"]],
        explain: `$\\sin^2\\theta+\\cos^2\\theta=1$ を使います。${known === "sin" ? `$\\cos^2\\theta=1-\\left(\\dfrac{${p}}{${h}}\\right)^2=\\dfrac{${q * q}}{${h * h}}$` : `$\\sin^2\\theta=1-\\left(\\dfrac{${p}}{${h}}\\right)^2=\\dfrac{${q * q}}{${h * h}}$`}。鈍角（第2象限）では $\\sin\\theta>0$、$\\cos\\theta<0$、$\\tan\\theta<0$ なので、$${FN_TEX[ask]}\\theta=${tq(ans)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 特別な角の値でつくる式（値が有理数になるものだけ）
        const c = r.pick(COMBOS[lv]);
        return num({
          q: `次の式の値を求めなさい。（分数で答えます）\n$${c.tex}$`,
          ans: c.ans,
          reduced: true,
          wrongs: [[neg(c.ans), "MC-TRIG-VALUE-SWAP"], [add(c.ans, Q(1, 2)), "MC-SLIP"], [mul(c.ans, Q(2)), "MC-SLIP"], [add(c.ans, Q(1)), "MC-SLIP"]],
          explain: `特別な角の値を代入して計算します。$\\sin 30^{\\circ}=\\dfrac12$、$\\cos 30^{\\circ}=\\dfrac{\\sqrt3}{2}$、$\\tan 30^{\\circ}=\\dfrac{1}{\\sqrt3}$、$\\sin 45^{\\circ}=\\cos 45^{\\circ}=\\dfrac{\\sqrt2}{2}$、$\\tan 45^{\\circ}=1$、$\\sin 60^{\\circ}=\\dfrac{\\sqrt3}{2}$、$\\cos 60^{\\circ}=\\dfrac12$、$\\tan 60^{\\circ}=\\sqrt3$。代入して計算すると $${tq(c.ans)}$。（ルートどうしの積や2乗で、ルートが消えます）`,
        });
      },
      { id: "b", db: 0.05 },
    ),
    t(
      "num",
      (r, lv) => {
        // 三角比の相互関係
        if (lv === 1) {
          const [p, q, h] = r.pick(TRI.slice(0, 4));
          const sinVal = Q(p, h);
          const ask = r.pick(["cos", "tan"]);
          const ans = ask === "cos" ? Q(q, h) : Q(p, q);
          nearly(fnOf(ask, Math.asin(p / h)), qnum(ans), "相互関係の検算", 1e-9);
          return num({
            q: `$0^{\\circ}<\\theta<90^{\\circ}$ で $\\sin\\theta=${tq(sinVal)}$ のとき、$${FN_TEX[ask]}\\theta$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[ask === "cos" ? Q(p * p, h * h) : Q(q, p), "MC-TRIG-IDENTITY"], [ask === "cos" ? sub(Q(1), sinVal) : Q(p, h), "MC-TRIG-IDENTITY"], [neg(ans), "MC-TRIG-SIGN-QUADRANT"]],
            explain: `$\\sin^2\\theta+\\cos^2\\theta=1$ より $\\cos^2\\theta=1-\\left(\\dfrac{${p}}{${h}}\\right)^2=\\dfrac{${q * q}}{${h * h}}$。$\\theta$ は鋭角なので $\\cos\\theta>0$ で $\\cos\\theta=\\dfrac{${q}}{${h}}$。${ask === "tan" ? `$\\tan\\theta=\\dfrac{\\sin\\theta}{\\cos\\theta}=\\dfrac{${p}}{${q}}=${tq(ans)}$。` : ""}`,
          });
        }
        if (lv === 2) {
          // tanθ = t → sinθ cosθ = t/(1+t²)
          const tv = r.pick([2, 3, 4, Q(1, 2), Q(1, 3), Q(3, 4), Q(2, 3)]);
          const T = typeof tv === "number" ? Q(tv) : tv;
          const ans = div(T, add(Q(1), mul(T, T)));
          const th = Math.atan(qnum(T));
          nearly(Math.sin(th) * Math.cos(th), qnum(ans), "sinθcosθ の検算", 1e-9);
          return num({
            q: `$0^{\\circ}<\\theta<90^{\\circ}$ で $\\tan\\theta=${tq(T)}$ のとき、$\\sin\\theta\\cos\\theta$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[T, "MC-TRIG-IDENTITY"], [div(T, add(Q(1), T)), "MC-TRIG-IDENTITY"], [div(Q(1), add(Q(1), mul(T, T))), "MC-TRIG-IDENTITY"], [div(T, Q(2)), "MC-TRIG-IDENTITY"]],
            explain: `$\\sin\\theta\\cos\\theta=\\tan\\theta\\cos^2\\theta$ で、$1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$ より $\\cos^2\\theta=\\dfrac{1}{1+\\tan^2\\theta}=\\dfrac{1}{1+${tq(mul(T, T))}}$。よって $\\sin\\theta\\cos\\theta=\\dfrac{${tq(T)}}{1+${tq(mul(T, T))}}=${tq(ans)}$。`,
          });
        }
        // sinθ + cosθ = s → sinθ cosθ = (s² − 1)/2
        const s = r.pick([Q(1, 2), Q(1, 3), Q(3, 5), Q(4, 5), Q(-1, 2), Q(-1, 3), Q(7, 5), Q(6, 5)]);
        const ans = div(sub(mul(s, s), Q(1)), Q(2));
        // 実際の θ で確かめる： √2 sin(θ + 45°) = s
        const th = Math.asin(qnum(s) / Math.SQRT2) - Math.PI / 4;
        nearly(Math.sin(th) + Math.cos(th), qnum(s), "sin+cos の検算", 1e-9);
        nearly(Math.sin(th) * Math.cos(th), qnum(ans), "sinθcosθ の検算(3)", 1e-9);
        return num({
          q: `$\\sin\\theta+\\cos\\theta=${tq(s)}$ のとき、$\\sin\\theta\\cos\\theta$ の値を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[mul(s, s), "MC-TRIG-IDENTITY"], [sub(mul(s, s), Q(1)), "MC-TRIG-IDENTITY"], [div(add(mul(s, s), Q(1)), Q(2)), "MC-SQUARE-CROSS-TERM"], [neg(ans), "MC-SLIP"]],
          explain: `両辺を2乗します。$(\\sin\\theta+\\cos\\theta)^2=\\sin^2\\theta+2\\sin\\theta\\cos\\theta+\\cos^2\\theta=1+2\\sin\\theta\\cos\\theta$。左辺は $(${tq(s)})^2=${tq(mul(s, s))}$ なので、$2\\sin\\theta\\cos\\theta=${tq(sub(mul(s, s), Q(1)))}$、$\\sin\\theta\\cos\\theta=${tq(ans)}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],

  // ── 正弦定理・余弦定理 ───────────────────────
  trig_laws: [
    t("fields", (r, lv) => {
      // 特別な角の sin：n √rad / d
      const SIN = { 30: { n: 1, rad: 1, d: 2 }, 45: { n: 1, rad: 2, d: 2 }, 60: { n: 1, rad: 3, d: 2 }, 90: { n: 1, rad: 1, d: 1 }, 120: { n: 1, rad: 3, d: 2 }, 135: { n: 1, rad: 2, d: 2 }, 150: { n: 1, rad: 1, d: 2 } };
      const sinVal = (A) => Math.sin(rad(A));
      if (lv === 1) {
        // 外接円の半径：a / sin A = 2R（A が 30°, 150° なら R = a、90° なら R = a/2）
        const A = r.pick([30, 150, 90]);
        const a = A === 90 ? 2 * r.int(2, 9) : r.int(3, 14);
        const R = A === 90 ? Q(a, 2) : Q(a);
        nearly(a / sinVal(A) / 2, qnum(R), "外接円の半径の検算", 1e-9);
        return fields({
          q: `△ABC で、$BC=${a}$、$\\angle A=${A}^{\\circ}$ です。この三角形の外接円の半径 $R$ を求めなさい。`,
          fields: [{ id: "R", value: R, pre: "$R=$" }],
          wrongs: [
            { values: { R: A === 90 ? Q(a) : Q(2 * a) }, mc: "MC-LAW-2R" },
            { values: { R: A === 90 ? Q(2 * a) : Q(a, 2) }, mc: "MC-LAW-2R" },
            { values: { R: Q(a * (A === 90 ? 1 : 3), 2) }, mc: "MC-LAW-2R" },
          ],
          explain: `正弦定理 $\\dfrac{a}{\\sin A}=2R$ より、$2R=\\dfrac{${a}}{\\sin ${A}^{\\circ}}=\\dfrac{${a}}{${A === 90 ? "1" : "\\frac12"}}=${A === 90 ? a : 2 * a}$。よって $R=${tq(R)}$。（$2R$ であることに注意：わり算の答えは直径）`,
        });
      }
      if (lv === 2) {
        // 辺の長さ b = a sinB / sinA（a√b の形）
        const pairs = [];
        for (const A of [30, 45, 60]) {
          for (const B of [30, 45, 60]) {
            if (A === B) continue;
            const sa = SIN[A];
            const sb = SIN[B];
            // b = a sinB / sinA = a·(nB dA)/(dB nA rA)·√(rA rB)
            const k = Q(sb.n * sa.d, sb.d * sa.n * sa.rad);
            const { s: sq, m } = sqrtSplit(sa.rad * sb.rad);
            if (m === 1) continue;
            pairs.push({ A, B, k: mul(k, Q(sq)), m });
          }
        }
        const pr = r.pick(pairs);
        // a を、係数 k·a が整数になるような値にする
        const a = until(() => r.int(2, 24), (v) => mul(pr.k, Q(v)).d === 1);
        const coef = mul(pr.k, Q(a));
        nearly((a * sinVal(pr.B)) / sinVal(pr.A), qnum(coef) * Math.sqrt(pr.m), "正弦定理の検算", 1e-9);
        // 誤答：比を逆にした（b = a sinA / sinB）
        const inv = (() => {
          const sa = SIN[pr.B];
          const sb = SIN[pr.A];
          const k = Q(sb.n * sa.d, sb.d * sa.n * sa.rad);
          const { s: sq, m } = sqrtSplit(sa.rad * sb.rad);
          return m === 1 ? null : { coef: mul(mul(k, Q(sq)), Q(a)), m };
        })();
        return fields({
          q: `△ABC で、$BC=${a}$、$\\angle A=${pr.A}^{\\circ}$、$\\angle B=${pr.B}^{\\circ}$ のとき、辺 $CA$ の長さを求めなさい。（$\\square\\sqrt{\\square}$ の形で答えます）`,
          layout: "sqrt",
          fields: [
            { id: "a", value: coef },
            { id: "b", value: pr.m },
          ],
          wrongs: [
            ...(inv ? [{ values: { a: inv.coef, b: inv.m }, mc: "MC-LAW-SIN-INVERT" }] : []),
            { values: { a: Q(a), b: Q(pr.m) }, mc: "MC-LAW-SIN-RATIO" },
            { values: { a: add(coef, Q(1)), b: Q(pr.m) }, mc: "MC-SLIP" },
          ],
          explain: `正弦定理 $\\dfrac{BC}{\\sin A}=\\dfrac{CA}{\\sin B}$ より、$CA=\\dfrac{${a}\\sin ${pr.B}^{\\circ}}{\\sin ${pr.A}^{\\circ}}$。値を代入して整理（分母の有理化もする）すると $CA=${tq(coef)}\\sqrt{${pr.m}}$。（辺と、その向かい合う角の組を取りちがえない）`,
        });
      }
      // 外接円の半径 R = a/(2 sinA)（A = 45°, 60°, 120°, 135°）：a√b の形
      const A = r.pick([45, 60, 120, 135]);
      const sa = SIN[A];
      const K0 = Q(sa.d, 2 * sa.n * sa.rad); // R = a × K0 × √rad
      const a = until(() => r.int(2, 30), (v) => mul(K0, Q(v)).d === 1);
      const coef = mul(K0, Q(a));
      nearly(a / sinVal(A) / 2, qnum(coef) * Math.sqrt(sa.rad), "外接円の半径(2)の検算", 1e-9);
      return fields({
        q: `△ABC で、$BC=${a}$、$\\angle A=${A}^{\\circ}$ です。この三角形の外接円の半径 $R$ を求めなさい。（$\\square\\sqrt{\\square}$ の形で答えます）`,
        layout: "sqrt",
        fields: [
          { id: "a", value: coef },
          { id: "b", value: sa.rad },
        ],
        wrongs: [
          { values: { a: mul(coef, Q(2)), b: Q(sa.rad) }, mc: "MC-LAW-2R" },
          { values: { a: Q(a), b: Q(sa.rad) }, mc: "MC-LAW-2R" },
          { values: { a: div(coef, Q(2)), b: Q(sa.rad) }, mc: "MC-LAW-2R" },
        ],
        explain: `正弦定理 $\\dfrac{a}{\\sin A}=2R$ より $R=\\dfrac{${a}}{2\\sin ${A}^{\\circ}}=\\dfrac{${a}}{2\\times\\frac{\\sqrt{${sa.rad}}}{2}}=\\dfrac{${a}}{\\sqrt{${sa.rad}}}$。分母を有理化して $\\dfrac{${a}\\sqrt{${sa.rad}}}{${sa.rad}}=${tq(coef)}\\sqrt{${sa.rad}}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 余弦定理：60°／120° で c が整数
          const cands = [];
          for (let a = 1; a <= 24; a++) {
            for (let b = a; b <= 24; b++) {
              for (const [ang, sgnv] of [[60, -1], [120, 1]]) {
                const c2 = a * a + b * b + sgnv * a * b;
                const c = Math.round(Math.sqrt(c2));
                if (c * c === c2 && a !== b) cands.push({ a, b, c, ang, c2 });
              }
            }
          }
          const e = r.pick(cands);
          nearly(Math.sqrt(e.a * e.a + e.b * e.b - 2 * e.a * e.b * Math.cos(rad(e.ang))), e.c, "余弦定理の検算", 1e-9);
          return num({
            q: `△ABC で、$AB=${e.a}$、$AC=${e.b}$、$\\angle A=${e.ang}^{\\circ}$ のとき、辺 $BC$ の長さを求めなさい。`,
            ans: e.c,
            wrongs: [[e.a * e.a + e.b * e.b, "MC-LAW-COS-SIGN"], [e.c * e.c, "MC-LAW-COS-SQUARE"], [e.a + e.b, "MC-LAW-COS-SIGN"], [Math.abs(e.a - e.b), "MC-LAW-COS-SIGN"]],
            explain: `余弦定理 $BC^2=AB^2+AC^2-2\\times AB\\times AC\\times\\cos A$ を使います。$\\cos ${e.ang}^{\\circ}=${e.ang === 60 ? "\\frac12" : "-\\frac12"}$ なので、$BC^2=${e.a * e.a}+${e.b * e.b}-2\\times ${e.a}\\times ${e.b}\\times\\left(${e.ang === 60 ? "\\frac12" : "-\\frac12"}\\right)=${e.c2}$。$BC>0$ より $BC=${e.c}$。（2倍の項と、$\\cos$ の符号に注意）`,
          });
        }
        if (lv === 2) {
          // 3辺から cos
          const [a, b, c] = until(
            () => [r.int(3, 10), r.int(3, 10), r.int(3, 10)],
            ([x, y, z]) => x + y > z && y + z > x && z + x > y && x !== y && y !== z && x !== z,
          );
          const ans = Q(b * b + c * c - a * a, 2 * b * c);
          nearly(Math.acos(qnum(ans)), Math.acos((b * b + c * c - a * a) / (2 * b * c)), "cosA の検算", 1e-9);
          return num({
            q: `△ABC で、$BC=${a}$、$CA=${b}$、$AB=${c}$ のとき、$\\cos A$ の値を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs: [[Q(a * a + b * b - c * c, 2 * a * b), "MC-LAW-COS-CHOICE"], [Q(b * b + c * c + a * a, 2 * b * c), "MC-LAW-COS-SIGN"], [Q(b * b + c * c - a * a, b * c), "MC-LAW-COS-2BC"], [neg(ans), "MC-LAW-COS-SIGN"]],
            explain: `余弦定理 $\\cos A=\\dfrac{b^2+c^2-a^2}{2bc}$（$A$ の対辺 $a=BC$ が最後にひかれる）。$\\cos A=\\dfrac{${b}^2+${c}^2-${a}^2}{2\\times ${b}\\times ${c}}=\\dfrac{${b * b + c * c - a * a}}{${2 * b * c}}=${tq(ans)}$。`,
          });
        }
        // b, c, cos A から a²
        const b = r.pick([2, 3, 4, 5, 6]);
        const c = r.pick([3, 4, 5, 6, 8]);
        const cosA = until(() => Q(r.pick([1, 2, 3, -1, -2, -3]), r.pick([3, 4, 5, 6, 8])), (v) => Math.abs(qnum(v)) < 0.85 && (2 * b * c * v.n) % v.d === 0);
        const a2 = b * b + c * c - qnum(mul(Q(2 * b * c), cosA));
        assert(Number.isInteger(a2) && a2 > 0, "a² が正の整数");
        return num({
          q: `△ABC で、$b=CA=${b}$、$c=AB=${c}$、$\\cos A=${tq(cosA)}$ のとき、辺 $BC$ の長さの2乗 $BC^2$ の値を求めなさい。`,
          ans: a2,
          wrongs: [[b * b + c * c + qnum(mul(Q(2 * b * c), cosA)), "MC-LAW-COS-SIGN"], [b * b + c * c - qnum(mul(Q(b * c), cosA)), "MC-LAW-COS-2BC"], [b * b + c * c, "MC-LAW-COS-SIGN"], [b + c - qnum(cosA), "MC-SLIP"]].filter(([v]) => Number.isInteger(v)),
          explain: `余弦定理 $a^2=b^2+c^2-2bc\\cos A$ に代入します。$a^2=${b * b}+${c * c}-2\\times ${b}\\times ${c}\\times\\left(${tq(cosA)}\\right)=${a2}$。（$\\cos A$ が負のときは、ひき算が「たし算」になります）`,
        });
      },
      { id: "b", db: 0.2 },
    ),
    t(
      "choice",
      (r, lv) => {
        // どの定理を使うか
        const CASES = {
          1: [
            ["直角三角形で、2辺の長さがわかっていて、残りの辺を求める", "三平方の定理"],
            ["△ABC で、2辺 $b$、$c$ とその間の角 $A$ がわかっていて、残りの辺 $a$ を求める", "余弦定理"],
            ["△ABC で、1辺 $a$ とその両端の角 $B$、$C$ がわかっていて、辺 $b$ を求める", "正弦定理"],
          ],
          2: [
            ["△ABC で、3辺の長さがすべてわかっていて、角 $A$ の $\\cos$ を求める", "余弦定理"],
            ["△ABC で、外接円の半径 $R$ と角 $A$ がわかっていて、辺 $a$ を求める", "正弦定理"],
            ["△ABC で、辺 $a$、角 $A$、角 $B$ がわかっていて、辺 $b$ を求める", "正弦定理"],
            ["△ABC で、辺 $b$、辺 $c$、間の角 $A$ がわかっていて、面積を求める", "面積の公式 $\\frac12 bc\\sin A$"],
          ],
          3: [
            ["△ABC で、辺 $a$、辺 $b$、角 $A$（$a$ の対角）がわかっていて、角 $B$ の $\\sin$ を求める", "正弦定理"],
            ["△ABC で、辺 $a$、辺 $b$、その間でない角 $B$ がわかっていて、辺 $c$ を求める（$c$ の2次方程式にする）", "余弦定理"],
            ["△ABC で、3辺がわかっていて、外接円の半径 $R$ を求める（まず1つの角を求める）", "余弦定理"],
          ],
        };
        const [scene, ans] = r.pick(CASES[lv]);
        const names = ["正弦定理", "余弦定理", "三平方の定理", "面積の公式 $\\frac12 bc\\sin A$"];
        const opts = names.filter((n) => n !== ans);
        return choice({
          q: `次の場合に、いちばんはじめに使う公式・定理はどれですか。\n${scene}`,
          correct: ans,
          wrongs: opts.map((n) => [n, "MC-LAW-CHOICE"]),
          explain: `${ans === "三平方の定理" ? "直角三角形なので三平方の定理です。" : ans === "正弦定理" ? "「辺とその対角の組」が2組出てくる（$\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=2R$）ときは正弦定理です。" : ans === "余弦定理" ? "「2辺とその間の角」または「3辺」がわかっているときは、余弦定理 $a^2=b^2+c^2-2bc\\cos A$ です。" : "2辺とその間の角から面積を求めるので $S=\\frac12 bc\\sin A$ です。"}`,
        });
      },
      { id: "c", db: 0.1, finite: true },
    ),
  ],

  // ── 三角形の面積（½ ab sin C） ─────────────────
  triangle_area_trig: [
    t("fields", (r, lv) => {
      if (lv === 1) {
        // C = 30°, 150°, 90° → 有理数
        const C = r.pick([30, 150, 90]);
        const a = r.int(3, 14);
        const b = r.int(3, 14);
        const S = C === 90 ? Q(a * b, 2) : Q(a * b, 4);
        nearly(0.5 * a * b * Math.sin(rad(C)), qnum(S), "面積の検算", 1e-9);
        return fields({
          q: `△ABC で、$AB=${a}$、$AC=${b}$、$\\angle A=${C}^{\\circ}$ のとき、面積 $S$ を求めなさい。`,
          fields: [{ id: "S", value: S, pre: "$S=$" }],
          wrongs: [
            { values: { S: C === 90 ? Q(a * b) : Q(a * b, 2) }, mc: "MC-AREA-TRIG-HALF" },
            { values: { S: Q(a * b, C === 90 ? 4 : 2) }, mc: "MC-AREA-TRIG-SIN" },
            { values: { S: Q(a * b) }, mc: "MC-AREA-TRIG-HALF" },
          ],
          explain: `2辺とその間の角がわかっているので $S=\\dfrac12\\times AB\\times AC\\times\\sin A$。$\\sin ${C}^{\\circ}=${C === 90 ? "1" : "\\frac12"}$ なので $S=\\dfrac12\\times ${a}\\times ${b}\\times ${C === 90 ? "1" : "\\frac12"}=${tq(S)}$。`,
        });
      }
      if (lv === 2) {
        // C = 60°, 120°, 45°, 135° → (p√q)/r
        const C = r.pick([60, 120, 45, 135]);
        const rad_ = C === 60 || C === 120 ? 3 : 2;
        const a = r.int(2, 12);
        const b = r.int(2, 12);
        const g = gcd(a * b, 4);
        const numr = (a * b) / g;
        const den = 4 / g;
        nearly(0.5 * a * b * Math.sin(rad(C)), (numr * Math.sqrt(rad_)) / den, "面積(√)の検算", 1e-9);
        return fields({
          q: `△ABC で、$AB=${a}$、$AC=${b}$、$\\angle A=${C}^{\\circ}$ のとき、面積 $S$ を $\\dfrac{p\\sqrt{q}}{r}$ の形で求めなさい。（約分できるときは約分し、分母が $1$ のときは $r=1$ と答えます）`,
          layout: "sqrtfrac",
          fields: [
            { id: "a", value: numr },
            { id: "b", value: rad_ },
            { id: "c", value: den },
          ],
          wrongs: [
            { values: { a: (a * b * 2) / gcd(a * b * 2, 4), b: rad_, c: 4 / gcd(a * b * 2, 4) }, mc: "MC-AREA-TRIG-HALF" },
            { values: { a: a * b, b: rad_, c: 2 }, mc: "MC-AREA-TRIG-HALF" },
            { values: { a: numr, b: rad_ === 3 ? 2 : 3, c: den }, mc: "MC-TRIG-VALUE-SWAP" },
          ],
          explain: `$S=\\dfrac12\\times ${a}\\times ${b}\\times\\sin ${C}^{\\circ}$。$\\sin ${C}^{\\circ}=\\dfrac{\\sqrt{${rad_}}}{2}$ なので $S=\\dfrac{${a * b}\\sqrt{${rad_}}}{4}$。${g > 1 ? `約分して $\\dfrac{${numr === 1 ? "" : numr}\\sqrt{${rad_}}}{${den}}$。` : "これ以上約分できません。"}`,
        });
      }
      // ヘロンの公式（面積が整数になる三角形）
      const heron = [];
      for (let a = 3; a <= 26; a++) for (let b = a; b <= 26; b++) for (let c = b; c <= 26; c++) {
        if (a + b <= c) continue;
        const s2 = a + b + c;
        const v = s2 * (s2 - 2 * a) * (s2 - 2 * b) * (s2 - 2 * c); // 16 S²
        const rt = Math.round(Math.sqrt(v));
        if (rt * rt === v && rt % 4 === 0 && a !== b && b !== c) heron.push({ a, b, c, S: rt / 4 });
      }
      const e = r.pick(heron);
      const s = (e.a + e.b + e.c) / 2;
      nearly(Math.sqrt(s * (s - e.a) * (s - e.b) * (s - e.c)), e.S, "ヘロンの検算", 1e-9);
      return fields({
        q: `3辺の長さが $${e.a}$、$${e.b}$、$${e.c}$ の三角形の面積 $S$ を求めなさい。（ヘロンの公式 $S=\\sqrt{s(s-a)(s-b)(s-c)}$、$s=\\dfrac{a+b+c}{2}$）`,
        fields: [{ id: "S", value: e.S, pre: "$S=$" }],
        wrongs: [
          { values: { S: Q(s * (s - e.a) * (s - e.b) * (s - e.c)) }, mc: "MC-AREA-HERON-ROOT" },
          { values: { S: Q(e.S, 2) }, mc: "MC-AREA-TRIG-HALF" },
          { values: { S: Q(e.a + e.b + e.c) }, mc: "MC-SLIP" },
        ],
        explain: `$s=\\dfrac{${e.a}+${e.b}+${e.c}}{2}=${tq(Q(e.a + e.b + e.c, 2))}$。$S=\\sqrt{s(s-a)(s-b)(s-c)}=\\sqrt{${tq(Q(e.a + e.b + e.c, 2))}\\times ${tq(Q(e.b + e.c - e.a, 2))}\\times ${tq(Q(e.a + e.c - e.b, 2))}\\times ${tq(Q(e.a + e.b - e.c, 2))}}=${e.S}$。（$\\sqrt{}$ をとり忘れない）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 2辺と面積から sin C
          const [p, q_] = r.pick([[1, 2], [3, 5], [4, 5], [5, 13], [12, 13], [3, 4], [1, 3], [2, 3]].filter(([x, y]) => x < y));
          const a = r.pick([4, 5, 6, 8, 10, 12]);
          const b = r.pick([5, 6, 8, 10, 15]);
          const S = mul(Q(a * b, 2), Q(p, q_));
          nearly(0.5 * a * b * (p / q_), qnum(S), "sin C の検算", 1e-9);
          return num({
            q: `△ABC で、$AB=${a}$、$AC=${b}$、面積が $${tq(S)}$ です。$\\angle A$ が鋭角のとき、$\\sin A$ の値を求めなさい。（分数で答えます）`,
            ans: Q(p, q_),
            reduced: true,
            wrongs: [[mul(Q(2), Q(p, q_)), "MC-AREA-TRIG-HALF"], [div(Q(p, q_), Q(2)), "MC-AREA-TRIG-HALF"], [div(S, Q(a * b)), "MC-AREA-TRIG-HALF"], [Q(q_ - p, q_), "MC-TRIG-SIN-COS-SWAP"]],
            explain: `$S=\\dfrac12\\times AB\\times AC\\times\\sin A$ に代入します。$${tq(S)}=\\dfrac12\\times ${a}\\times ${b}\\times\\sin A=${a * b / 2}\\sin A$。よって $\\sin A=\\dfrac{${tq(S)}}{${a * b / 2}}=${tq(Q(p, q_))}$。`,
          });
        }
        // ヘロンの三角形：L2 は sin C、L3 は内接円の半径
        const heron = [];
        for (let a = 3; a <= 26; a++) for (let b = a; b <= 26; b++) for (let c = b; c <= 26; c++) {
          if (a + b <= c) continue;
          const s2 = a + b + c;
          const v = s2 * (s2 - 2 * a) * (s2 - 2 * b) * (s2 - 2 * c);
          const rt = Math.round(Math.sqrt(v));
          if (rt * rt === v && rt % 4 === 0 && a !== b && b !== c) heron.push({ a, b, c, S: rt / 4 });
        }
        const e = r.pick(heron);
        const s = e.a + e.b + e.c;
        if (lv === 2) {
          const sinC = Q(2 * e.S, e.a * e.b);
          nearly(Math.sin(Math.acos((e.a * e.a + e.b * e.b - e.c * e.c) / (2 * e.a * e.b))), qnum(sinC), "sin C の検算(2)", 1e-9);
          return num({
            q: `3辺が $BC=${e.a}$、$CA=${e.b}$、$AB=${e.c}$ の三角形の面積は $${e.S}$ です。$\\sin C$ の値を求めなさい。（分数で答えます）`,
            ans: sinC,
            reduced: true,
            wrongs: [[Q(e.S, e.a * e.b), "MC-AREA-TRIG-HALF"], [Q(4 * e.S, e.a * e.b), "MC-AREA-TRIG-HALF"], [Q(2 * e.S, e.b * e.c), "MC-LAW-COS-CHOICE"], [Q(e.a * e.b, 2 * e.S), "MC-TRIG-RATIO-INVERT"]],
            explain: `$C$ をはさむ2辺は $BC=${e.a}$ と $CA=${e.b}$。$S=\\dfrac12\\times ${e.a}\\times ${e.b}\\times\\sin C$ より $${e.S}=${e.a * e.b / 2}\\sin C$、$\\sin C=\\dfrac{${e.S}}{${e.a * e.b / 2}}=${tq(sinC)}$。`,
          });
        }
        const rIn = Q(2 * e.S, s);
        return num({
          q: `3辺の長さが $${e.a}$、$${e.b}$、$${e.c}$ で面積が $${e.S}$ の三角形の、内接円の半径 $r$ を求めなさい。（面積 $S=\\dfrac12 r(a+b+c)$）`,
          ans: rIn,
          reduced: true,
          wrongs: [[Q(e.S, s), "MC-AREA-INRADIUS"], [Q(e.S, s / 2 === Math.floor(s / 2) ? s / 2 : s), "MC-AREA-INRADIUS"], [Q(2 * e.S, e.a), "MC-AREA-INRADIUS"], [Q(s, 2 * e.S), "MC-TRIG-RATIO-INVERT"]],
          explain: `三角形を、内心と3つの頂点で3つの三角形に分けて考えると、$S=\\dfrac12 r(a+b+c)$。$${e.S}=\\dfrac12\\times r\\times ${s}$ より $r=\\dfrac{2\\times ${e.S}}{${s}}=${tq(rIn)}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 直線の方程式・点と直線の距離 ─────────────────
  coord_line: [
    t("fields", (r, lv) => {
      if (lv === 1) {
        // 傾き m と通る点 → y = m x + n
        const m = r.pick([1, 2, 3, -1, -2, -3, Q(1, 2), Q(-1, 2), Q(3, 2)]);
        const M = typeof m === "number" ? Q(m) : m;
        const x0 = M.d === 2 ? 2 * r.nz(-3, 3) : r.nz(-4, 4);
        const y0 = r.int(-6, 6);
        const n = sub(Q(y0), mul(M, Q(x0)));
        return fields({
          q: `傾きが $${tq(M)}$ で、点 $(${x0},\\ ${y0})$ を通る直線の方程式を $y=mx+n$ の形で表すとき、$m$、$n$ の値を答えなさい。`,
          fields: [
            { id: "m", value: M, pre: "$m=$" },
            { id: "n", value: n, pre: "$n=$" },
          ],
          wrongs: [
            { values: { m: M, n: add(Q(y0), mul(M, Q(x0))) }, mc: "MC-LINE-INTERCEPT-SIGN" },
            { values: { m: M, n: Q(y0) }, mc: "MC-LINE-INTERCEPT" },
            { values: { m: neg(M), n: add(Q(y0), mul(M, Q(x0))) }, mc: "MC-LINE-INTERCEPT-SIGN" },
          ],
          explain: `点 $(x_1,\\ y_1)$ を通り傾き $m$ の直線は $y-y_1=m(x-x_1)$。$y-(${y0})=${tq(M)}(x-(${x0}))$ を整理して $y=${tq(M)}x${n.n >= 0 ? "+" : ""}${tq(n)}$。$m=${tq(M)}$、$n=${tq(n)}$。（$n$ は $y$ 切片：$x=0$ を代入して確かめられます）`,
        });
      }
      if (lv === 2) {
        // 2点を通る直線
        const [p1, p2] = until(
          () => [[r.int(-4, 4), r.int(-5, 5)], [r.int(-4, 4), r.int(-5, 5)]],
          ([u, v]) => u[0] !== v[0] && u[1] !== v[1],
        );
        const m = Q(p2[1] - p1[1], p2[0] - p1[0]);
        const n = sub(Q(p1[1]), mul(m, Q(p1[0])));
        // 検算：2点とも直線上
        for (const [x, y] of [p1, p2]) assert(eq(add(mul(m, Q(x)), n), Q(y)), "2点を通る直線の検算");
        return fields({
          q: `2点 $(${p1[0]},\\ ${p1[1]})$、$(${p2[0]},\\ ${p2[1]})$ を通る直線を $y=mx+n$ と表すとき、$m$、$n$ の値を答えなさい。`,
          fields: [
            { id: "m", value: m, pre: "$m=$" },
            { id: "n", value: n, pre: "$n=$" },
          ],
          wrongs: [
            { values: { m: Q(p2[0] - p1[0], p2[1] - p1[1]), n }, mc: "MC-LINE-SLOPE-INVERT" },
            { values: { m: neg(m), n: add(Q(p1[1]), mul(m, Q(p1[0]))) }, mc: "MC-LINE-SLOPE-SIGN" },
            { values: { m, n: Q(p1[1]) }, mc: "MC-LINE-INTERCEPT" },
          ],
          explain: `傾きは $m=\\dfrac{y_2-y_1}{x_2-x_1}=\\dfrac{${p2[1]}-(${p1[1]})}{${p2[0]}-(${p1[0]})}=${tq(m)}$。点 $(${p1[0]},\\ ${p1[1]})$ を通るので $${p1[1]}=${tq(m)}\\times(${p1[0]})+n$ より $n=${tq(n)}$。`,
        });
      }
      // 平行・垂直：y = m0 x + n0 に平行／垂直で点 (x0, y0) を通る
      const m0 = r.pick([2, 3, -2, -3, Q(1, 2), Q(-1, 2), Q(2, 3), Q(-3, 2)]);
      const M0 = typeof m0 === "number" ? Q(m0) : m0;
      const perp = r.chance(0.5);
      const M = perp ? neg(div(Q(1), M0)) : M0;
      const x0 = r.nz(-4, 4) * M.d;
      const y0 = r.int(-5, 5);
      const n = sub(Q(y0), mul(M, Q(x0)));
      assert(perp ? eq(mul(M, M0), Q(-1)) : eq(M, M0), "平行・垂直の検算");
      const n0 = r.nz(-4, 4);
      return fields({
        q: `直線 $y=${tq(M0)}x${sgn(n0)}$ に${perp ? "垂直" : "平行"}で、点 $(${x0},\\ ${y0})$ を通る直線を $y=mx+n$ と表すとき、$m$、$n$ の値を答えなさい。`,
        fields: [
          { id: "m", value: M, pre: "$m=$" },
          { id: "n", value: n, pre: "$n=$" },
        ],
        wrongs: perp
          ? [
              { values: { m: div(Q(1), M0), n: sub(Q(y0), mul(div(Q(1), M0), Q(x0))) }, mc: "MC-LINE-SLOPE-PERP" },
              { values: { m: neg(M0), n: sub(Q(y0), mul(neg(M0), Q(x0))) }, mc: "MC-LINE-SLOPE-PERP" },
              { values: { m: M0, n: sub(Q(y0), mul(M0, Q(x0))) }, mc: "MC-LINE-PARALLEL-PERP" },
            ]
          : [
              { values: { m: neg(M0), n: sub(Q(y0), mul(neg(M0), Q(x0))) }, mc: "MC-LINE-SLOPE-SIGN" },
              { values: { m: M0, n: Q(n0) }, mc: "MC-LINE-INTERCEPT" },
              { values: { m: div(Q(1), M0), n: sub(Q(y0), mul(div(Q(1), M0), Q(x0))) }, mc: "MC-LINE-PARALLEL-PERP" },
            ],
        explain: `${perp ? `垂直な2直線の傾きの積は $-1$ なので、$m=-\\dfrac{1}{${tq(M0)}}=${tq(M)}$。` : `平行な直線は傾きが等しいので $m=${tq(M0)}$。`}点 $(${x0},\\ ${y0})$ を通るので $${y0}=${tq(M)}\\times(${x0})+n$ より $n=${tq(n)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 点と直線の距離 |a x0 + b y0 + c| / √(a²+b²)（√ が整数になる組）
        const AB = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17], [15, 8, 17]];
        const [a0, b0, h] = r.pick(AB);
        const sa = r.chance(0.5) ? 1 : -1;
        const sb = r.chance(0.5) ? 1 : -1;
        const a = a0 * sa;
        const b = b0 * sb;
        const lineTex = (c) => `${a === 1 ? "" : a === -1 ? "-" : a}x${b > 0 ? "+" : "-"}${Math.abs(b) === 1 ? "" : Math.abs(b)}y${c === 0 ? "" : sgn(c)}=0`;
        if (lv === 1) {
          // 原点からの距離
          const c = r.nz(-30, 30);
          const ans = Q(Math.abs(c), h);
          nearly(Math.abs(c) / Math.hypot(a, b), qnum(ans), "原点と直線の距離の検算", 1e-9);
          return num({
            q: `原点と直線 $${lineTex(c)}$ の距離を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(Math.abs(c), a0 * a0 + b0 * b0), "MC-DIST-DENOM"], [Q(c, h), "MC-DIST-ABS"], [Q(Math.abs(c), a0 + b0), "MC-DIST-DENOM"], [Q(Math.abs(c)), "MC-DIST-DENOM"]],
            explain: `点 $(x_0,\\ y_0)$ と直線 $ax+by+c=0$ の距離は $\\dfrac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$。原点 $(0,0)$ なので $\\dfrac{|${c}|}{\\sqrt{${a * a}+${b * b}}}=\\dfrac{${Math.abs(c)}}{${h}}=${tq(ans)}$。`,
          });
        }
        if (lv === 2) {
          const [x0, y0, c] = until(() => [r.nz(-5, 5), r.nz(-5, 5), r.nz(-12, 12)], ([u, v, w]) => a * u + b * v + w !== 0);
          const val = a * x0 + b * y0 + c;
          const ans = Q(Math.abs(val), h);
          nearly(Math.abs(val) / Math.hypot(a, b), qnum(ans), "点と直線の距離の検算", 1e-9);
          return num({
            q: `点 $(${x0},\\ ${y0})$ と直線 $${lineTex(c)}$ の距離を求めなさい。`,
            ans,
            reduced: true,
            wrongs: [[Q(val, h), "MC-DIST-ABS"], [Q(Math.abs(val), a0 * a0 + b0 * b0), "MC-DIST-DENOM"], [Q(Math.abs(a * x0 + b * y0), h), "MC-DIST-CONST"], [Q(Math.abs(val), a0 + b0), "MC-DIST-DENOM"]],
            explain: `距離の公式 $\\dfrac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$ に代入します。分子は $|${a}\\times(${x0})+(${b})\\times(${y0})+(${c})|=|${val}|=${Math.abs(val)}$、分母は $\\sqrt{${a * a}+${b * b}}=${h}$。よって $${tq(ans)}$。（分子には絶対値をつける）`,
          });
        }
        // 平行な2直線の距離
        const [c1, c2] = until(() => [r.int(-15, 15), r.int(-15, 15)], ([u, v]) => u !== v);
        const ans = Q(Math.abs(c1 - c2), h);
        nearly(Math.abs(c1 - c2) / Math.hypot(a, b), qnum(ans), "平行線の距離の検算", 1e-9);
        return num({
          q: `平行な2直線 $${lineTex(c1)}$、$${lineTex(c2)}$ の距離を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(Math.abs(c1 - c2), a0 * a0 + b0 * b0), "MC-DIST-DENOM"], [Q(Math.abs(c1) + Math.abs(c2), h), "MC-DIST-CONST"], [Q(Math.abs(c1 - c2)), "MC-DIST-DENOM"], [Q(c1 - c2, h), "MC-DIST-ABS"]],
          explain: `一方の直線上の点を1つとり、もう一方の直線までの距離を求めます。または、$ax+by+c_1=0$ と $ax+by+c_2=0$ の距離が $\\dfrac{|c_1-c_2|}{\\sqrt{a^2+b^2}}$ になることを使います。$\\dfrac{|${c1}-(${c2})|}{${h}}=${tq(ans)}$。`,
        });
      },
      { id: "b", db: 0.1 },
    ),
    t(
      "fields",
      (r, lv) => {
        if (lv <= 2) {
          // 2直線の交点（整数）
          const x0 = r.int(-4, 4);
          const y0 = r.int(-4, 4);
          const gen = () => {
            const p = r.nz(-3, 3);
            const q = r.nz(-3, 3);
            return [p, q, p * x0 + q * y0];
          };
          const [l1, l2] = until(() => [gen(), gen()], ([u, v]) => u[0] * v[1] - u[1] * v[0] !== 0);
          const lineTex = ([p, q, c]) => `${p === 1 ? "" : p === -1 ? "-" : p}x${q > 0 ? "+" : "-"}${Math.abs(q) === 1 ? "" : Math.abs(q)}y=${c}`;
          const yForm = (m, n) => `y=${tq(m)}x${n.n >= 0 ? "+" : ""}${tq(n)}`;
          if (lv === 1) {
            // y = m x + n の2本
            const mm = until(() => [r.nz(-3, 3), r.nz(-3, 3)], ([u, v]) => u !== v);
            const n1 = y0 - mm[0] * x0;
            const n2 = y0 - mm[1] * x0;
            return fields({
              q: `2直線 $${yForm(Q(mm[0]), Q(n1))}$ と $${yForm(Q(mm[1]), Q(n2))}$ の交点の座標を求めなさい。`,
              fields: [
                { id: "x", value: x0, pre: "$($" },
                { id: "y", value: y0, pre: "$,$", post: "$)$" },
              ],
              wrongs: [{ values: { x: y0, y: x0 }, mc: "MC-COORD-XY-SWAP" }, { values: { x: -x0, y: y0 }, mc: "MC-SIMUL-SIGN" }, { values: { x: x0, y: n1 }, mc: "MC-LINE-INTERCEPT" }],
              explain: `交点では2つの式の $y$ が等しいので $${mm[0]}x${sgn(n1)}=${mm[1]}x${sgn(n2)}$。これを解くと $x=${x0}$。$y=${mm[0]}\\times(${x0})${sgn(n1)}=${y0}$。交点は $(${x0},\\ ${y0})$。`,
            });
          }
          return fields({
            q: `2直線 $${lineTex(l1)}$、$${lineTex(l2)}$ の交点の座標を求めなさい。`,
            fields: [
              { id: "x", value: x0, pre: "$($" },
              { id: "y", value: y0, pre: "$,$", post: "$)$" },
            ],
            wrongs: [{ values: { x: y0, y: x0 }, mc: "MC-COORD-XY-SWAP" }, { values: { x: -x0, y: -y0 }, mc: "MC-SIMUL-SIGN" }, { values: { x: x0, y: -y0 }, mc: "MC-SIMUL-SIGN" }],
            explain: `2直線の交点は、2つの式を連立させた解です。加減法か代入法で $x$、$y$ を求めると $x=${x0}$、$y=${y0}$。交点は $(${x0},\\ ${y0})$。（両方の式に代入して確かめられます）`,
          });
        }
        // 内分点・外分点
        const [A, B] = [[r.int(-5, 3), r.int(-4, 4)], [r.int(-2, 8), r.int(-4, 6)]];
        const [m, n] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]]);
        const ext = r.chance(0.4);
        // 内分：(n A + m B)/(m+n)、外分（m:n, m≠n）：(−n A + m B)/(m−n)
        const den = ext ? m - n : m + n;
        const pt = (i) => Q((ext ? -n : n) * A[i] + m * B[i], den);
        const P = [pt(0), pt(1)];
        return fields({
          q: `2点 $A(${A[0]},\\ ${A[1]})$、$B(${B[0]},\\ ${B[1]})$ を結ぶ線分 $AB$ を $${m}:${n}$ に${ext ? "外分" : "内分"}する点 $P$ の座標を求めなさい。`,
          fields: [
            { id: "x", value: P[0], pre: "$($" },
            { id: "y", value: P[1], pre: "$,$", post: "$)$" },
          ],
          wrongs: [
            { values: { x: Q((ext ? -m : m) * A[0] + n * B[0], den), y: Q((ext ? -m : m) * A[1] + n * B[1], den) }, mc: "MC-DIVIDE-RATIO-SWAP" },
            { values: { x: Q(A[0] + B[0], 2), y: Q(A[1] + B[1], 2) }, mc: "MC-DIVIDE-MIDPOINT" },
            { values: { x: Q(m * A[0] + n * B[0], m + n), y: Q(m * A[1] + n * B[1], m + n) }, mc: "MC-DIVIDE-RATIO-SWAP" },
          ],
          explain: `${ext ? `外分点の公式：$P=\\left(\\dfrac{-nx_1+mx_2}{m-n},\\ \\dfrac{-ny_1+my_2}{m-n}\\right)$` : `内分点の公式：$P=\\left(\\dfrac{nx_1+mx_2}{m+n},\\ \\dfrac{ny_1+my_2}{m+n}\\right)$`}。$m=${m}$、$n=${n}$ を代入して、$x=${tq(P[0])}$、$y=${tq(P[1])}$。（$A$ 側の座標に $n$、$B$ 側の座標に $m$ をかける：たすきがけ）`,
        });
      },
      { id: "c", db: 0.15 },
    ),
  ],


  // ── 円の方程式 ───────────────────────────────
  coord_circle: [
    t("fields", (r, lv) => {
      const a = r.int(-5, 5);
      const b = r.int(-5, 5);
      const P = -2 * a;
      const Qc = -2 * b;
      const expandedOf = (S) => `x^{2}+y^{2}${P === 0 ? "" : `${P > 0 ? "+" : "-"}${Math.abs(P) === 1 ? "" : Math.abs(P)}x`}${Qc === 0 ? "" : `${Qc > 0 ? "+" : "-"}${Math.abs(Qc) === 1 ? "" : Math.abs(Qc)}y`}${S === 0 ? "" : sgn(S)}=0`;
      if (lv === 1) {
        const rr = r.int(1, 8);
        return fields({
          q: `円 $${circleTex(a, b, rr * rr)}$ の中心の座標 $(p,\\ q)$ と半径 $r$ を求めなさい。`,
          fields: [
            { id: "p", value: a, pre: "中心 $p=$" },
            { id: "q", value: b, pre: "$q=$" },
            { id: "r", value: rr, pre: "半径 $r=$" },
          ],
          wrongs: [
            { values: { p: -a, q: -b, r: rr }, mc: "MC-CIRCLE-CENTER-SIGN" },
            { values: { p: a, q: b, r: rr * rr }, mc: "MC-CIRCLE-R-SQUARED" },
            { values: { p: -a, q: -b, r: rr * rr }, mc: "MC-CIRCLE-R-SQUARED" },
          ],
          explain: `円の方程式 $(x-p)^2+(y-q)^2=r^2$ の形と見くらべます。$(x${sgn(-a)})$ は $(x-(${a}))$ なので $p=${a}$、$(y${sgn(-b)})$ は $(y-(${b}))$ なので $q=${b}$。右辺 $${rr * rr}=r^2$ より $r=${rr}$（右辺は半径の2乗）。`,
        });
      }
      if (lv === 2) {
        const rr = r.int(1, 8);
        const S = a * a + b * b - rr * rr;
        return fields({
          q: `方程式 $${expandedOf(S)}$ は円を表します。中心の座標 $(p,\\ q)$ と半径 $r$ を求めなさい。`,
          fields: [
            { id: "p", value: a, pre: "中心 $p=$" },
            { id: "q", value: b, pre: "$q=$" },
            { id: "r", value: rr, pre: "半径 $r=$" },
          ],
          wrongs: [
            { values: { p: -a, q: -b, r: rr }, mc: "MC-CIRCLE-CENTER-SIGN" },
            { values: { p: P, q: Qc, r: rr }, mc: "MC-CIRCLE-COMPLETE" },
            { values: { p: a, q: b, r: Math.max(1, Math.abs(a * a + b * b + S)) }, mc: "MC-CIRCLE-COMPLETE" },
          ],
          explain: `$x$ と $y$ について平方完成します。$(x${sgn(-a)})^2+(y${sgn(-b)})^2=${a * a}+${b * b}${sgn(-S)}=${rr * rr}$ と変形できます（$x^2${P >= 0 ? "+" : ""}${P}x$ を $(x${sgn(-a)})^2-${a * a}$ に直すので、定数がその分だけ移る）。したがって中心 $(${a},\\ ${b})$、半径 $\\sqrt{${rr * rr}}=${rr}$。`,
        });
      }
      // r² が平方数でない：半径の2乗 r² を答える
      const r2 = r.pick([2, 3, 5, 6, 7, 10, 11, 12, 13, 15, 17]);
      const S = a * a + b * b - r2;
      return fields({
        q: `方程式 $${expandedOf(S)}$ は円を表します。中心の座標 $(p,\\ q)$ と、半径の2乗 $r^2$ を求めなさい。`,
        fields: [
          { id: "p", value: a, pre: "中心 $p=$" },
          { id: "q", value: b, pre: "$q=$" },
          { id: "r2", value: r2, pre: "$r^2=$" },
        ],
        wrongs: [
          { values: { p: -a, q: -b, r2 }, mc: "MC-CIRCLE-CENTER-SIGN" },
          { values: { p: a, q: b, r2: a * a + b * b + S }, mc: "MC-CIRCLE-COMPLETE" },
          { values: { p: a, q: b, r2: -S }, mc: "MC-CIRCLE-COMPLETE" },
        ],
        explain: `平方完成して $(x${sgn(-a)})^2+(y${sgn(-b)})^2=${a * a}+${b * b}${sgn(-S)}=${r2}$。中心は $(${a},\\ ${b})$、右辺が半径の2乗なので $r^2=${r2}$（$r=\\sqrt{${r2}}$）。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 円の方程式を選ぶ
        let a;
        let b;
        let r2;
        let scene;
        let detail;
        if (lv === 1) {
          a = r.int(-4, 4);
          b = r.int(-4, 4);
          const rr = r.int(2, 6);
          r2 = rr * rr;
          scene = `中心が点 $(${a},\\ ${b})$ で、半径が $${rr}$ の円`;
          detail = `半径 $${rr}$ なので $r^2=${r2}$。`;
        } else if (lv === 2) {
          a = r.int(-3, 3);
          b = r.int(-3, 3);
          const [dx, dy] = until(() => [r.int(-4, 4), r.int(-4, 4)], ([u, v]) => u !== 0 || v !== 0);
          r2 = dx * dx + dy * dy;
          scene = `中心が点 $(${a},\\ ${b})$ で、点 $(${a + dx},\\ ${b + dy})$ を通る円`;
          detail = `半径は中心と円上の点の距離なので $r^2=(${dx})^2+(${dy})^2=${r2}$。`;
        } else {
          // 直径の両端 A, B（座標の差を偶数にして、中心も r² も整数にする）
          const [x1, y1] = [r.int(-4, 3), r.int(-4, 3)];
          const [dx, dy] = until(() => [2 * r.int(-3, 3), 2 * r.int(-3, 3)], ([u, v]) => u !== 0 || v !== 0);
          const [x2, y2] = [x1 + dx, y1 + dy];
          a = (x1 + x2) / 2;
          b = (y1 + y2) / 2;
          r2 = (dx * dx + dy * dy) / 4;
          assert((x1 - a) ** 2 + (y1 - b) ** 2 === r2 && (x2 - a) ** 2 + (y2 - b) ** 2 === r2, "直径の円の検算");
          scene = `2点 $A(${x1},\\ ${y1})$、$B(${x2},\\ ${y2})$ を直径の両端とする円`;
          detail = `中心は $AB$ の中点 $(${a},\\ ${b})$、半径は $AB$ の半分なので $r^2=\\dfrac{(${dx})^2+(${dy})^2}{4}=${r2}$。`;
        }
        const correct = circleTex(a, b, r2);
        const cand = [
          [circleTex(-a, -b, r2), "MC-CIRCLE-CENTER-SIGN"],
          [circleTex(a, b, r2, true), "MC-CIRCLE-R-SQUARED"],
          [circleTex(-a, -b, r2, true), "MC-CIRCLE-R-SQUARED"],
          [circleTex(b, a, r2), "MC-COORD-XY-SWAP"],
          [circleTex(a, b, lv === 3 ? 4 * r2 : r2 + 1), lv === 3 ? "MC-CIRCLE-DIAM-R" : "MC-SLIP"],
          [circleTex(-a, b, r2), "MC-CIRCLE-CENTER-SIGN"],
          [circleTex(a, -b, r2), "MC-CIRCLE-CENTER-SIGN"],
          [circleTex(a + 1, b, r2), "MC-SLIP"],
          [circleTex(a, b + 1, r2), "MC-SLIP"],
        ];
        return choice({
          q: `${scene}の方程式はどれですか。`,
          correct: $(correct),
          wrongs: labels(cand, correct),
          explain: `中心 $(p,\\ q)$、半径 $r$ の円は $(x-p)^2+(y-q)^2=r^2$。${detail}中心 $(${a},\\ ${b})$、$r^2=${r2}$ を代入して $${correct}$。（右辺は $r$ ではなく $r^2$、$x$ と $y$ の項は符号が逆）`,
        });
      },
      { id: "b", db: 0.1 },
    ),
    t(
      "num",
      (r, lv) => {
        // 円 x²+y²=R² と直線 ax+by+c=0
        const [a0, b0, h] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 15, 17]]);
        const a = r.chance(0.5) ? a0 : -a0;
        const b = b0;
        const lineTex = (c) => `${a === 1 ? "" : a === -1 ? "-" : a}x+${b}y${c === 0 ? "" : sgn(c)}=0`;
        if (lv === 1) {
          const R = r.int(2, 8);
          const kind = r.pick([0, 1, 2]);
          const c = kind === 1 ? r.pick([1, -1]) * R * h : kind === 2 ? r.pick([1, -1]) * r.int(0, R * h - 1) : r.pick([1, -1]) * (R * h + r.int(1, 2 * h));
          const d = Math.abs(c) / h;
          const cnt = d < R - 1e-12 ? 2 : Math.abs(d - R) < 1e-12 ? 1 : 0;
          assert(cnt === kind, "共有点の個数の検算");
          return num({
            q: `円 $x^2+y^2=${R * R}$ と直線 $${lineTex(c)}$ は、何個の共有点をもちますか。`,
            ans: cnt,
            wrongs: [0, 1, 2].filter((k) => k !== cnt).map((k) => [k, "MC-CIRCLE-LINE-COMPARE"]),
            explain: `円の中心（原点）から直線までの距離 $d$ を求め、半径 $R=${R}$ と比べます。$d=\\dfrac{|${c}|}{\\sqrt{${a * a}+${b * b}}}=\\dfrac{${Math.abs(c)}}{${h}}=${tq(Q(Math.abs(c), h))}$。${cnt === 2 ? "$d<R$ なので、2点で交わります" : cnt === 1 ? "$d=R$ なので、接します（共有点は1個）" : "$d>R$ なので、共有点はありません"}。答えは $${cnt}$ 個。`,
          });
        }
        if (lv === 2) {
          const R = r.int(2, 9);
          const ans = R * h;
          return num({
            q: `円 $x^2+y^2=${R * R}$ と直線 $${a === 1 ? "" : a === -1 ? "-" : a}x+${b}y+k=0$ が接するような定数 $k$ のうち、正のものを求めなさい。`,
            ans,
            wrongs: [[R, "MC-CIRCLE-LINE-COMPARE"], [R * R, "MC-CIRCLE-LINE-COMPARE"], [R * (a0 + b0), "MC-DIST-DENOM"], [-ans, "MC-SLIP"]],
            explain: `接する ⟺ 円の中心（原点）から直線までの距離が半径に等しい。$\\dfrac{|k|}{\\sqrt{${a * a}+${b * b}}}=\\dfrac{|k|}{${h}}=${R}$ より $|k|=${R * h}$。正のものは $k=${ans}$。`,
          });
        }
        // 弦の長さ：R² = d² + (弦/2)²
        const [dd, half, R] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 6, 10], [6, 8, 10], [15, 8, 17]]);
        const c = r.pick([1, -1]) * dd * h;
        const chord = 2 * half;
        nearly(2 * Math.sqrt(R * R - (Math.abs(c) / Math.hypot(a, b)) ** 2), chord, "弦の長さの検算", 1e-9);
        return num({
          q: `円 $x^2+y^2=${R * R}$ が直線 $${lineTex(c)}$ から切りとる線分（弦）の長さを求めなさい。`,
          ans: chord,
          wrongs: [[half, "MC-CIRCLE-CHORD-HALF"], [dd, "MC-CIRCLE-CHORD-HALF"], [2 * R, "MC-CIRCLE-CHORD-HALF"], [2 * (R - dd), "MC-CIRCLE-CHORD-HALF"]],
          explain: `中心から直線までの距離は $d=\\dfrac{|${c}|}{${h}}=${dd}$。半径 $R=${R}$ の円で、弦の半分を $\\ell$ とすると三平方の定理より $\\ell^2+d^2=R^2$。$\\ell=\\sqrt{${R * R}-${dd * dd}}=${half}$。弦の長さは $2\\ell=${chord}$。（半分ではなく、両側で2倍）`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],

  // ── ベクトルの成分と内積 ─────────────────────
  vector_basic: [
    t("fields", (r, lv) => {
      const vec = (u) => `(${u[0]},\\ ${u[1]})`;
      if (lv <= 2) {
        const a = [r.int(-5, 5), r.int(-5, 5)];
        const b = [r.int(-5, 5), r.int(-5, 5)];
        const [k, l, sign] = lv === 1 ? [1, 1, r.pick([1, -1])] : [r.pick([2, 3, -1, -2]), r.pick([2, 3, 1]), r.pick([1, -1])];
        const res = [k * a[0] + sign * l * b[0], k * a[1] + sign * l * b[1]];
        const coef = (n) => (n === 1 ? "" : n === -1 ? "-" : n);
        const exprTex = `${coef(k)}\\vec{a}${sign > 0 ? "+" : "-"}${l === 1 ? "" : l}\\vec{b}`;
        const comp = (i) => `${pnn(k)}\\times ${pnn(a[i])}${sign > 0 ? "+" : "-"}${l}\\times ${pnn(b[i])}`;
        return fields({
          q: `$\\vec{a}=${vec(a)}$、$\\vec{b}=${vec(b)}$ のとき、$${exprTex}$ の成分を求めなさい。`,
          fields: [
            { id: "x", value: res[0], pre: "$($" },
            { id: "y", value: res[1], pre: "$,$", post: "$)$" },
          ],
          wrongs: [
            { values: { x: k * a[0] - sign * l * b[0], y: k * a[1] - sign * l * b[1] }, mc: "MC-VECTOR-SIGN" },
            { values: { x: k * a[0] + sign * b[0], y: k * a[1] + sign * b[1] }, mc: "MC-VECTOR-COEF" },
            { values: { x: res[1], y: res[0] }, mc: "MC-COORD-XY-SWAP" },
          ],
          explain: `ベクトルの計算は、成分ごとに行います。$x$ 成分：$${comp(0)}=${res[0]}$、$y$ 成分：$${comp(1)}=${res[1]}$。答えは $${vec(res)}$。`,
        });
      }
      // 点の座標から：k AB − BC
      const A = [r.int(-4, 4), r.int(-4, 4)];
      const B = [r.int(-4, 4), r.int(-4, 4)];
      const Cc = [r.int(-4, 4), r.int(-4, 4)];
      const AB = [B[0] - A[0], B[1] - A[1]];
      const BC = [Cc[0] - B[0], Cc[1] - B[1]];
      const k = r.pick([2, 3]);
      const res = [k * AB[0] - BC[0], k * AB[1] - BC[1]];
      return fields({
        q: `3点 $A${vec(A)}$、$B${vec(B)}$、$C${vec(Cc)}$ について、$${k}\\overrightarrow{AB}-\\overrightarrow{BC}$ の成分を求めなさい。`,
        fields: [
          { id: "x", value: res[0], pre: "$($" },
          { id: "y", value: res[1], pre: "$,$", post: "$)$" },
        ],
        wrongs: [
          { values: { x: k * (A[0] - B[0]) - (B[0] - Cc[0]), y: k * (A[1] - B[1]) - (B[1] - Cc[1]) }, mc: "MC-VECTOR-SUB-ORDER" },
          { values: { x: k * AB[0] + BC[0], y: k * AB[1] + BC[1] }, mc: "MC-VECTOR-SIGN" },
          { values: { x: k * (A[0] - B[0]) - BC[0], y: k * (A[1] - B[1]) - BC[1] }, mc: "MC-VECTOR-SUB-ORDER" },
        ],
        explain: `$\\overrightarrow{AB}$ は「終点 $B$ の座標 − 始点 $A$ の座標」。$\\overrightarrow{AB}=${vec(AB)}$、$\\overrightarrow{BC}=${vec(BC)}$。$${k}\\overrightarrow{AB}-\\overrightarrow{BC}=${vec([k * AB[0], k * AB[1]])}-${vec(BC)}=${vec(res)}$。（始点と終点の順序に注意）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        const P2 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25]];
        const vecTex = (u) => `(${u[0]},\\ ${u[1]})`;
        if (lv === 1) {
          const [x, y, h] = r.pick(P2);
          const u = [r.chance(0.5) ? x : -x, r.chance(0.5) ? y : -y];
          if (r.chance(0.5)) {
            return num({
              q: `$\\vec{a}=${vecTex(u)}$ のとき、大きさ $|\\vec{a}|$ を求めなさい。`,
              ans: h,
              wrongs: [[x * x + y * y, "MC-VECTOR-NORM"], [x + y, "MC-VECTOR-NORM"], [Math.abs(x - y), "MC-VECTOR-NORM"], [h * h - 1, "MC-SLIP"]],
              explain: `$|\\vec{a}|=\\sqrt{a_1^2+a_2^2}$（三平方の定理）。$\\sqrt{(${u[0]})^2+(${u[1]})^2}=\\sqrt{${x * x + y * y}}=${h}$。`,
            });
          }
          const v = [r.int(-5, 5), r.int(-5, 5)];
          const ip = u[0] * v[0] + u[1] * v[1];
          return num({
            q: `$\\vec{a}=${vecTex(u)}$、$\\vec{b}=${vecTex(v)}$ のとき、内積 $\\vec{a}\\cdot\\vec{b}$ を求めなさい。`,
            ans: ip,
            wrongs: [[u[0] * v[1] + u[1] * v[0], "MC-VECTOR-DOT-CROSS"], [u[0] + v[0] + u[1] + v[1], "MC-VECTOR-DOT-ADD"], [u[0] * v[0] - u[1] * v[1], "MC-VECTOR-DOT-SIGN"], [-ip, "MC-SLIP"]],
            explain: `成分表示の内積は $\\vec{a}\\cdot\\vec{b}=a_1b_1+a_2b_2$。$(${u[0]})(${v[0]})+(${u[1]})(${v[1]})=${u[0] * v[0]}${u[1] * v[1] >= 0 ? "+" : ""}${u[1] * v[1]}=${ip}$。（答えは数で、ベクトルではありません）`,
          });
        }
        if (lv === 2) {
          // なす角の cos（|a|, |b| が整数）
          const [x1, y1, h1] = r.pick(P2.slice(0, 4));
          const [x2, y2, h2] = r.pick(P2.slice(0, 4));
          const a = [r.chance(0.5) ? x1 : -x1, r.chance(0.5) ? y1 : -y1];
          const b = [r.chance(0.5) ? x2 : -x2, r.chance(0.5) ? y2 : -y2];
          const ip = a[0] * b[0] + a[1] * b[1];
          const ans = Q(ip, h1 * h2);
          const th = Math.atan2(b[1], b[0]) - Math.atan2(a[1], a[0]);
          nearly(Math.cos(th), qnum(ans), "なす角の検算", 1e-9);
          return num({
            q: `$\\vec{a}=${vecTex(a)}$、$\\vec{b}=${vecTex(b)}$ のなす角を $\\theta$ とするとき、$\\cos\\theta$ の値を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs: [[Q(ip, h1 + h2), "MC-VECTOR-COS"], [Q(ip), "MC-VECTOR-COS"], [Q(ip, h1 * h1 * h2 * h2), "MC-VECTOR-COS"], [neg(ans), "MC-SLIP"]],
            explain: `$\\cos\\theta=\\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$。内積は $${pnn(a[0])}\\times ${pnn(b[0])}+${pnn(a[1])}\\times ${pnn(b[1])}=${ip}$、$|\\vec{a}|=${h1}$、$|\\vec{b}|=${h2}$ なので $\\cos\\theta=\\dfrac{${ip}}{${h1}\\times ${h2}}=${tq(ans)}$。`,
          });
        }
        // 垂直・平行になる t：a = (t, p), b = (u, v)
        const perp = r.chance(0.5);
        const p = r.nz(-4, 4);
        const [u, v] = [r.nz(-4, 4), r.nz(-4, 4)];
        // 垂直：t u + p v = 0 → t = −p v / u。平行：t v − p u = 0 → t = p u / v
        const tv = perp ? Q(-p * v, u) : Q(p * u, v);
        return num({
          q: `$\\vec{a}=(t,\\ ${p})$、$\\vec{b}=(${u},\\ ${v})$ について、$\\vec{a}$ と $\\vec{b}$ が${perp ? "垂直" : "平行"}になるような $t$ の値を求めなさい。`,
          ans: tv,
          reduced: true,
          wrongs: perp
            ? [[Q(p * u, v), "MC-VECTOR-PERP-PARALLEL"], [Q(p * v, u), "MC-VECTOR-DOT-SIGN"], [Q(-p * u, v), "MC-VECTOR-PERP-PARALLEL"]]
            : [[Q(-p * v, u), "MC-VECTOR-PERP-PARALLEL"], [Q(p * v, u), "MC-VECTOR-PARALLEL-RATIO"], [Q(-p * u, v), "MC-VECTOR-SIGN"]],
          explain: perp
            ? `垂直 ⟺ 内積が $0$。$\\vec{a}\\cdot\\vec{b}=t\\times ${pnn(u)}+${pnn(p)}\\times ${pnn(v)}=0$ より $${u}t${sgn(p * v)}=0$、$t=${tq(tv)}$。`
            : `平行 ⟺ 成分の比が等しい（$a_1b_2-a_2b_1=0$）。$t\\times ${pnn(v)}-${pnn(p)}\\times ${pnn(u)}=0$ より $${v}t=${p * u}$、$t=${tq(tv)}$。`,
        });
      },
      { id: "b", db: 0.15 },
    ),
    t(
      "num",
      (r, lv) => {
        const P = (u) => `(${u[0]},\\ ${u[1]})`;
        if (lv <= 2) {
          // 三角形の面積 S = ½|x1 y2 − x2 y1|（L1: O が頂点、L2: 一般の3点）
          const pts = until(
            () => (lv === 1 ? [[0, 0], [r.nz(-6, 6), r.nz(-6, 6)], [r.nz(-6, 6), r.nz(-6, 6)]] : [[r.int(-4, 4), r.int(-4, 4)], [r.int(-4, 4), r.int(-4, 4)], [r.int(-4, 4), r.int(-4, 4)]]),
            ([p0, p1, p2]) => (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]) !== 0,
          );
          const [p0, p1, p2] = pts;
          const u = [p1[0] - p0[0], p1[1] - p0[1]];
          const w = [p2[0] - p0[0], p2[1] - p0[1]];
          const cross = u[0] * w[1] - u[1] * w[0];
          const S = Q(Math.abs(cross), 2);
          // 検算：ヘロンの公式(辺の長さから)ではなく、座標の差を使ったシューレース公式でも同じ
          const shoelace = Math.abs(p0[0] * (p1[1] - p2[1]) + p1[0] * (p2[1] - p0[1]) + p2[0] * (p0[1] - p1[1])) / 2;
          nearly(shoelace, qnum(S), "三角形の面積の検算", 1e-9);
          return num({
            q: `${lv === 1 ? `原点 $O$ と 2点 $A${P(p1)}$、$B${P(p2)}$ を頂点とする` : `3点 $P${P(p0)}$、$Q${P(p1)}$、$R${P(p2)}$ を頂点とする`}三角形の面積を求めなさい。`,
            ans: S,
            reduced: true,
            wrongs: [[Q(Math.abs(cross)), "MC-VECTOR-AREA-HALF"], [Q(cross, 2), "MC-VECTOR-AREA-ABS"], [Q(Math.abs(u[0] * w[0] + u[1] * w[1]), 2), "MC-VECTOR-AREA-DOT"], [Q(Math.abs(u[0] * w[1] + u[1] * w[0]), 2), "MC-VECTOR-AREA-DOT"]],
            explain: `${lv === 1 ? "" : `$\\overrightarrow{PQ}=${P(u)}$、$\\overrightarrow{PR}=${P(w)}$ とします。`}2つのベクトル $(x_1,\\ y_1)$、$(x_2,\\ y_2)$ でつくる三角形の面積は $\\dfrac12|x_1y_2-x_2y_1|$。$\\dfrac12|(${u[0]})(${w[1]})-(${u[1]})(${w[0]})|=\\dfrac12|${cross}|=${tq(S)}$。（絶対値をつけ、$\\frac12$ を忘れない）`,
          });
        }
        // 3点が一直線上にあるように t を決める：AB ∥ AC
        const A = [r.int(-3, 3), r.int(-3, 3)];
        const [dx, dy, K] = until(
          () => [r.nz(-3, 3), r.nz(-4, 4), r.pick([Q(2), Q(3), Q(-1), Q(-2), Q(1, 2)])],
          ([u, v, kk]) => mul(kk, Q(u)).d === 1,
        );
        const B = [A[0] + dx, A[1] + dy];
        const xC = A[0] + qnum(mul(K, Q(dx)));
        const tv = add(Q(A[1]), mul(K, Q(dy)));
        return num({
          q: `3点 $A${P(A)}$、$B${P(B)}$、$C(${xC},\\ t)$ が一直線上にあるとき、$t$ の値を求めなさい。`,
          ans: tv,
          reduced: true,
          wrongs: [[add(Q(B[1]), mul(K, Q(dy))), "MC-VECTOR-PARALLEL-RATIO"], [neg(tv), "MC-SLIP"], [Q(A[1] + dy), "MC-VECTOR-PARALLEL-RATIO"]],
          explain: `一直線上 ⟺ $\\overrightarrow{AB}$ と $\\overrightarrow{AC}$ が平行。$\\overrightarrow{AB}=${P([dx, dy])}$、$\\overrightarrow{AC}=(${xC - A[0]},\\ t-(${A[1]}))$。成分の比が等しいので $(${dx})(t-(${A[1]}))-(${dy})(${xC - A[0]})=0$ を解いて $t=${tq(tv)}$。`,
        });
      },
      { id: "c", db: 0.2 },
    ),
  ],
};
