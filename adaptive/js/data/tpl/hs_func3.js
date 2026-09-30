// ============================================================
// tpl/hs_func3.js — 高校 指数関数・対数関数（数II）
//   exp_func / log_func
//
//  すべて自作の数値・言い回し。答えは Math.pow / Math.log での代入や格子点の全数チェックでも確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, num as qnum, pow as qpow } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert, gcd, lcm } from "./util.js";
import { nearly } from "./hs_util.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const opTex = { "<": "<", ">": ">", "<=": "\\le ", ">=": "\\ge " };
const flipOp = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
const OPS = ["<", ">", "<=", ">="];
const holdsF = (op, a, b) => (op === "<" ? a < b - 1e-12 : op === ">" ? a > b + 1e-12 : op === "<=" ? a <= b + 1e-12 : a >= b - 1e-12);

/** a x + c の TeX */
function linTex(a, c, v = "x") {
  const ax = a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`;
  return c === 0 ? ax : `${ax}${sgn(c)}`;
}

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

/** x の範囲の書き方：lo, hi は Q または null（無限）。loOpen/hiOpen は端を含まないか */
function rangeTex(lo, hi, loClosed = false, hiClosed = false) {
  if (lo !== null && hi !== null) return `${tq(lo)}${loClosed ? "\\le " : "<"}x${hiClosed ? "\\le " : "<"}${tq(hi)}`;
  if (lo !== null) return `x${loClosed ? "\\ge " : ">"}${tq(lo)}`;
  return `x${hiClosed ? "\\le " : "<"}${tq(hi)}`;
}

// 対数方程式 log_b x + log_b (x − s) = k で、x = r > s が整数解になる (b, k, s, r) を集めておく
const LOG_EQ1 = [];
for (const b of [2, 3, 5]) {
  for (let k = 1; k <= 4; k++) {
    const N = b ** k;
    if (N > 250) continue;
    for (let s = 1; s <= 9; s++) for (let rr = s + 1; rr <= N; rr++) if (rr * (rr - s) === N) LOG_EQ1.push({ b, k, s, r: rr });
  }
}
// log_b (x + a) + log_b (x − a) = k：x² − a² = b^k
const LOG_EQ2 = [];
for (const b of [2, 3, 5]) {
  for (let k = 1; k <= 4; k++) {
    const N = b ** k;
    for (let a = 1; a <= 9; a++) {
      const sq = N + a * a;
      const rt = Math.round(Math.sqrt(sq));
      if (rt * rt === sq && rt > a) LOG_EQ2.push({ b, k, a, r: rt });
    }
  }
}
// log_b (x + p) − log_b (x − q) = k：x = (b^k q + p)/(b^k − 1) が x > q の整数
const LOG_EQ3 = [];
for (const b of [2, 3]) {
  for (let k = 1; k <= 3; k++) {
    const N = b ** k;
    for (let p = 1; p <= 9; p++) {
      for (let q = -2; q <= 6; q++) {
        if ((N * q + p) % (N - 1) === 0) {
          const x = (N * q + p) / (N - 1);
          if (x > q && x + p > 0 && x > 0) LOG_EQ3.push({ b, k, p, q, r: x });
        }
      }
    }
  }
}

export default {
  // ── 指数関数・指数方程式 ─────────────────────
  exp_func: [
    t("num", (r, lv) => {
      // 指数方程式
      let tex;
      let ans; // Q
      let lhs; // x → 浮動小数
      let rhs;
      let expl;
      let wrongs;
      if (lv === 1) {
        const [b, k] = until(() => [r.pick([2, 3, 5]), r.pick([2, 3, 4, -1, -2, -3])], ([bb, kk]) => bb !== 5 || Math.abs(kk) <= 3);
        tex = `${b}^{x}=${tq(qpow(Q(b), k))}`;
        ans = Q(k);
        lhs = (x) => b ** x;
        rhs = () => b ** k;
        expl = `右辺を底 $${b}$ の累乗で表します。$${tq(qpow(Q(b), k))}=${b}^{${k}}$。よって $${b}^x=${b}^{${k}}$ で、指数を比べて $x=${k}$。`;
        wrongs = [[-k, "MC-EXPEQ-SIGN"], [qpow(Q(b), k), "MC-EXPEQ-DIVIDE"], [Q(b * k), "MC-EXPEQ-DIVIDE"], [k + 1, "MC-SLIP"]];
      } else if (lv === 2) {
        const kind = r.pick(["shift", "coef", "power"]);
        if (kind === "shift") {
          const b = r.pick([2, 3]);
          const c = r.pick([1, 2, 3, -1, -2]);
          const k = r.int(2, 5);
          tex = `${b}^{x${sgn(c)}}=${b ** k}`;
          ans = Q(k - c);
          lhs = (x) => b ** (x + c);
          rhs = () => b ** k;
          expl = `$${b ** k}=${b}^{${k}}$ なので、指数を比べて $x${sgn(c)}=${k}$、$x=${k - c}$。`;
          wrongs = [[k + c, "MC-EXPEQ-SIGN"], [k, "MC-EXPEQ-SHIFT"], [Q(b ** k - c), "MC-EXPEQ-DIVIDE"], [k - c + 1, "MC-SLIP"]];
        } else if (kind === "coef") {
          const b = r.pick([2, 3]);
          const a = r.pick([2, 3]);
          const k = until(() => r.int(2, 6), (v) => v % a !== 0);
          tex = `${b}^{${a}x}=${b ** k}`;
          ans = Q(k, a);
          lhs = (x) => b ** (a * x);
          rhs = () => b ** k;
          expl = `$${b ** k}=${b}^{${k}}$ なので $${a}x=${k}$。よって $x=${tq(ans)}$。`;
          wrongs = [[k, "MC-EXPEQ-COEF"], [Q(a, k), "MC-EXPEQ-COEF"], [k - a, "MC-EXPEQ-COEF"], [Q(k, a + 1), "MC-SLIP"]];
        } else {
          // (b^m)^x = b^n → x = n/m
          const b = r.pick([2, 3]);
          const [m, n] = until(() => [r.int(2, 3), r.int(1, 5)], ([u, v]) => u !== v && gcd(u, v) === 1 && (b === 2 ? b ** Math.max(u, v) <= 32 : b ** Math.max(u, v) <= 27));
          tex = `${b ** m}^{x}=${b ** n}`;
          ans = Q(n, m);
          lhs = (x) => (b ** m) ** x;
          rhs = () => b ** n;
          expl = `底を $${b}$ にそろえます。$${b ** m}=${b}^{${m}}$、$${b ** n}=${b}^{${n}}$ なので、$(${b}^{${m}})^x=${b}^{${m}x}=${b}^{${n}}$。指数を比べて $${m}x=${n}$、$x=${tq(ans)}$。`;
          wrongs = [[Q(m, n), "MC-EXPEQ-BASE"], [Q(b ** n, b ** m), "MC-EXPEQ-BASE"], [n - m, "MC-EXPEQ-BASE"], [Q(n, m + 1), "MC-SLIP"]];
        }
      } else {
        const kind = r.pick(["recip", "both"]);
        if (kind === "recip") {
          const b = r.pick([2, 3]);
          const c = r.pick([1, 2, -1]);
          const k = r.int(2, 4);
          // (1/b)^{x−c} = b^k  → −(x − c) = k → x = c − k
          tex = `\\left(\\dfrac{1}{${b}}\\right)^{x${sgn(-c)}}=${b ** k}`;
          ans = Q(c - k);
          lhs = (x) => (1 / b) ** (x - c);
          rhs = () => b ** k;
          expl = `$\\dfrac{1}{${b}}=${b}^{-1}$ なので左辺は $${b}^{-(x${sgn(-c)})}$、右辺は $${b}^{${k}}$。指数を比べて $-(x${sgn(-c)})=${k}$、$x=${c - k}$。`;
          wrongs = [[k + c, "MC-EXPEQ-SIGN"], [k - c, "MC-EXPEQ-SIGN"], [c + k, "MC-EXPEQ-SIGN"], [c - k + 1, "MC-SLIP"]];
        } else {
          // (b^m)^{x + c1} = (b^n)^{x + c2} → m(x + c1) = n(x + c2)
          const b = r.pick([2, 3]);
          const [m, n] = until(() => [r.int(1, 3), r.int(1, 3)], ([u, v]) => u !== v);
          const [c1, c2] = [r.pick([1, 2, -1, -2]), r.pick([1, 2, -1, -2, 3])];
          const x = Q(n * c2 - m * c1, m - n);
          tex = `${b ** m}^{x${sgn(c1)}}=${b ** n}^{x${sgn(c2)}}`;
          ans = x;
          lhs = (xv) => (b ** m) ** (xv + c1);
          rhs = (xv) => (b ** n) ** (xv + c2);
          expl = `底を $${b}$ にそろえます。$${b ** m}=${b}^{${m}}$、$${b ** n}=${b}^{${n}}$ なので、左辺は $${b}^{${m}(x${sgn(c1)})}$、右辺は $${b}^{${n}(x${sgn(c2)})}$。指数を比べて $${m}(x${sgn(c1)})=${n}(x${sgn(c2)})$ を解くと $x=${tq(x)}$。`;
          wrongs = [[neg(x), "MC-EXPEQ-SIGN"], [Q(c2 - c1), "MC-EXPEQ-BASE"], [Q(n * c2 + m * c1, m - n), "MC-EXPEQ-SIGN"], [add(x, Q(1)), "MC-SLIP"]];
        }
      }
      const xv = qnum(ans);
      nearly(lhs(xv), rhs(xv), "指数方程式の検算", 1e-9);
      return num({ q: `方程式 $${tex}$ を解きなさい。`, ans, reduced: true, wrongs, explain: expl });
    }),
    t(
      "choice",
      (r, lv) => {
        // 指数不等式：B^{a x + c} (op) N。B = b または 1/b
        const b = r.pick([2, 3, 5]);
        const recip = lv >= 2 && r.chance(0.6);
        const a = lv <= 2 ? 1 : r.pick([2, -1, 1]);
        const c = lv <= 2 ? 0 : r.nz(-3, 3);
        const m = r.int(-2, 4);
        const op = r.pick(OPS);
        const N = qpow(Q(b), m);
        // 指数の不等式に直す：a x + c (op2) t
        const t_ = recip ? -m : m;
        const op2 = recip ? flipOp[op] : op;
        // x について解く（a<0 で向きが反転）
        const bound = div(Q(t_ - c), Q(a));
        const opX = a < 0 ? flipOp[op2] : op2;
        const closed = opX === "<=" || opX === ">=";
        const correct = opX === "<" || opX === "<=" ? rangeTex(null, bound, false, closed) : rangeTex(bound, null, closed, false);
        // 全数チェック
        const B = recip ? 1 / b : b;
        for (let i = -12; i <= 12; i++) {
          const x = qnum(bound) + i * 0.5;
          const orig = holdsF(op, Math.pow(B, a * x + c), qnum(N));
          const pred = opX === "<" ? x < qnum(bound) - 1e-12 : opX === ">" ? x > qnum(bound) + 1e-12 : opX === "<=" ? x <= qnum(bound) + 1e-12 : x >= qnum(bound) - 1e-12;
          assert(orig === pred, "指数不等式の検算");
        }
        const mk = (o, bd) => (o === "<" || o === "<=" ? rangeTex(null, bd, false, o === "<=") : rangeTex(bd, null, o === ">=", false));
        const wrong = [
          [mk(flipOp[opX], bound), recip || a < 0 ? "MC-EXPINEQ-FLIP" : "MC-EXPINEQ-DIRECTION"],
          [mk(opX.includes("=") ? opX.replace("=", "") : `${opX}=`, bound), "MC-EXPINEQ-EQUAL"],
          [mk(opX, neg(bound)), "MC-EXPINEQ-SIGN"],
          [mk(opX, add(bound, Q(1))), "MC-SLIP"],
          [mk(flipOp[opX], neg(bound)), "MC-EXPINEQ-FLIP"],
        ];
        const baseTex = recip ? `\\left(\\dfrac{1}{${b}}\\right)` : `${b}`;
        return choice({
          q: `次の不等式を解きなさい。\n$${baseTex}^{${linTex(a, c)}}${opTex[op]}${tq(N)}$`,
          correct: $(correct),
          wrongs: labels(wrong, correct),
          explain: `右辺を底 $${b}$ の累乗にして指数を比べます。$${tq(N)}=${b}^{${m}}$。${recip ? `底が $\\dfrac{1}{${b}}=${b}^{-1}$ なので、指数は符号が変わって $${b}^{-(${linTex(a, c)})}$ です。` : ""}${recip ? "底が 1 より小さい（$0<$底$<1$）ので、指数を比べるときに不等号の向きが逆になります。" : "底が 1 より大きいので、指数の大小と同じ向きです。"}${a < 0 ? `さらに $x$ の係数が負なので、両辺を負の数でわるときにもう一度向きが逆になります。` : ""}${a === 1 && c === 0 ? `よって $${correct}$。` : `$${linTex(a, c)}${opTex[op2]}${t_}$ を解いて $${correct}$。`}`,
        });
      },
      { id: "b", db: 0.15 },
    ),
    t(
      "fields",
      (r, lv) => {
        // t = b^x とおく2次方程式：A t² − B t + C = 0
        const b = r.pick([2, 3]);
        const pool = lv === 1 ? [0, 1, 2] : lv === 2 ? [0, 1, 2, 3] : [-2, -1, 0, 1, 2, 3];
        const [k1, k2] = until(() => [r.pick(pool), r.pick(pool)], ([u, v]) => u < v);
        const t1 = qpow(Q(b), k1);
        const t2 = qpow(Q(b), k2);
        const scale = lcm(lcm(t1.d, t2.d), mul(t1, t2).d);
        const A = scale;
        const B = qnum(mul(Q(scale), add(t1, t2)));
        const Cc = qnum(mul(Q(scale), mul(t1, t2)));
        assert(Number.isInteger(B) && Number.isInteger(Cc), "係数が整数");
        // 検算：x = k1, k2 を元の式に代入すると 0
        for (const k of [k1, k2]) nearly(A * (b * b) ** k - B * b ** k + Cc, 0, "指数の2次方程式の検算", 1e-9);
        const first = A === 1 ? `${b * b}^{x}` : `${A}\\cdot ${b * b}^{x}`;
        const eqTex = `${first}-${B}\\cdot ${b}^{x}${Cc >= 0 ? "+" : ""}${Cc}=0`;
        return fields({
          q: `方程式 $${eqTex}$ の解をすべて求めなさい。（ヒント：$${b}^x=t$ とおくと $${b * b}^x=t^2$）`,
          orderFree: true,
          fields: [
            { id: "x1", value: k1, pre: "$x=$" },
            { id: "x2", value: k2, pre: "$x=$" },
          ],
          wrongs: [
            { values: { x1: t1, x2: t2 }, mc: "MC-EXPEQ-QUAD-T" },
            { values: { x1: k1, x2: k1 }, mc: "MC-EXPEQ-ONE-SOLUTION" },
            { values: { x1: -k1, x2: -k2 }, mc: "MC-EXPEQ-SIGN" },
          ],
          explain: `$${b}^x=t$ とおくと $${b * b}^x=(${b}^x)^2=t^2$。方程式は $${A === 1 ? "" : A}t^2-${B}t${Cc >= 0 ? "+" : ""}${Cc}=0$。${A === 1 ? "" : ""}因数分解して $(t-${tq(t1)})(t-${tq(t2)})${A === 1 ? "" : `\\times ${A}`}=0$ より $t=${tq(t1)},\\ ${tq(t2)}$。$t=${b}^x$ にもどして、$${b}^x=${tq(t1)}$ から $x=${k1}$、$${b}^x=${tq(t2)}$ から $x=${k2}$。（$t=b^x>0$ なので、$t$ が負の解はありません）`,
        });
      },
      { id: "c", db: 0.35 },
    ),
  ],

  // ── 対数関数・対数方程式 ─────────────────────
  log_func: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // log_b x = k、または log_b (x + c) = k
        const [b, k] = until(() => [r.pick([2, 3, 5]), r.pick([2, 3, 4, -1, -2])], ([bb, kk]) => bb !== 5 || Math.abs(kk) <= 3);
        const shifted = r.chance(0.5);
        const c = shifted ? r.pick([1, 2, 3, -1, -2]) : 0;
        const val = qpow(Q(b), k);
        const ans = sub(val, Q(c));
        nearly(Math.log(qnum(ans) + c) / Math.log(b), k, "対数方程式の検算", 1e-9);
        return num({
          q: `方程式 $\\log_{${b}} ${shifted ? `(x${sgn(c)})` : "x"}=${k}$ を解きなさい。`,
          ans,
          reduced: true,
          wrongs: [[Q(b * k - c), "MC-LOGEQ-MEANING"], [Q(k * k), "MC-LOGEQ-MEANING"], [add(val, Q(c)), "MC-LOGEQ-SIGN"], [sub(Q(k), Q(c)), "MC-LOGEQ-MEANING"]],
          explain: `$\\log_{${b}} M=k$ は $M=${b}^{${k}}$ ということです。${shifted ? `$x${sgn(c)}=${b}^{${k}}=${tq(val)}$ より $x=${tq(ans)}$。` : `$x=${b}^{${k}}=${tq(val)}$。`}`,
        });
      }
      if (lv === 2) {
        const which = r.chance(0.5);
        if (which) {
          const e = r.pick(LOG_EQ1);
          // log_b x + log_b (x − s) = k → x(x − s) = b^k → x = r, s − r（後者は真数条件に反する）
          nearly(Math.log(e.r) / Math.log(e.b) + Math.log(e.r - e.s) / Math.log(e.b), e.k, "対数方程式(2)の検算", 1e-9);
          const other = e.s - e.r;
          return num({
            q: `方程式 $\\log_{${e.b}} x+\\log_{${e.b}} (x-${e.s})=${e.k}$ を解きなさい。（真数条件に注意します）`,
            ans: e.r,
            wrongs: [[other, "MC-LOGEQ-DOMAIN"], [e.b ** e.k, "MC-LOGEQ-SPLIT"], [e.k * e.b, "MC-LOGEQ-MEANING"], [e.r + e.s, "MC-SLIP"]],
            explain: `真数条件：$x>0$ かつ $x-${e.s}>0$ より $x>${e.s}$。左辺は $\\log_{${e.b}} x(x-${e.s})$ とまとめられるので $x(x-${e.s})=${e.b}^{${e.k}}=${e.b ** e.k}$。整理して $x^2-${e.s}x-${e.b ** e.k}=0$、$(x-${e.r})(x${sgn(e.r - e.s)})=0$ より $x=${e.r},\\ ${other}$。真数条件 $x>${e.s}$ を満たすのは $x=${e.r}$ だけ。`,
          });
        }
        const e = r.pick(LOG_EQ2);
        nearly(Math.log(e.r + e.a) / Math.log(e.b) + Math.log(e.r - e.a) / Math.log(e.b), e.k, "対数方程式(2b)の検算", 1e-9);
        return num({
          q: `方程式 $\\log_{${e.b}} (x+${e.a})+\\log_{${e.b}} (x-${e.a})=${e.k}$ を解きなさい。（真数条件に注意します）`,
          ans: e.r,
          wrongs: [[-e.r, "MC-LOGEQ-DOMAIN"], [e.b ** e.k, "MC-LOGEQ-SPLIT"], [e.b ** e.k + e.a, "MC-LOGEQ-SPLIT"], [e.r + 1, "MC-SLIP"]],
          explain: `真数条件：$x+${e.a}>0$ かつ $x-${e.a}>0$ より $x>${e.a}$。$\\log_{${e.b}} (x+${e.a})(x-${e.a})=${e.k}$ より $x^2-${e.a * e.a}=${e.b ** e.k}$、$x^2=${e.r * e.r}$、$x=\\pm ${e.r}$。真数条件 $x>${e.a}$ を満たすのは $x=${e.r}$。`,
        });
      }
      // log_b (x + p) − log_b (x − q) = k
      const e = r.pick(LOG_EQ3);
      const N = e.b ** e.k;
      nearly(Math.log(e.r + e.p) / Math.log(e.b) - Math.log(e.r - e.q) / Math.log(e.b), e.k, "対数方程式(3)の検算", 1e-9);
      const qTex = e.q === 0 ? "x" : `x${sgn(-e.q)}`;
      return num({
        q: `方程式 $\\log_{${e.b}} (x${sgn(e.p)})-\\log_{${e.b}} (${qTex})=${e.k}$ を解きなさい。（真数条件に注意します）`,
        ans: e.r,
        wrongs: [[N, "MC-LOGEQ-SPLIT"], [e.r + 1, "MC-SLIP"], [e.r - 1, "MC-SLIP"], [e.p + e.q, "MC-LOGEQ-SPLIT"]],
        explain: `真数条件：$x${sgn(e.p)}>0$ かつ $${qTex}>0$。差は商にまとめて $\\log_{${e.b}} \\dfrac{x${sgn(e.p)}}{${qTex}}=${e.k}$ より $\\dfrac{x${sgn(e.p)}}{${qTex}}=${e.b}^{${e.k}}=${N}$。両辺に $${qTex}$ をかけて $x${sgn(e.p)}=${N}(${qTex})$、これを解いて $x=${e.r}$。真数条件も満たします。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 対数不等式・真数条件
        if (lv === 1) {
          // 真数条件：log_b (a x + c) が定義される x の範囲
          const a = r.pick([1, 2, 3, -1, -2]);
          const c = r.nz(-6, 6);
          const b = r.pick([2, 3, 10]);
          const bd = div(Q(-c), Q(a)); // a x + c > 0
          const correct = a > 0 ? rangeTex(bd, null, false, false) : rangeTex(null, bd, false, false);
          for (let i = -8; i <= 8; i++) {
            const x = qnum(bd) + i * 0.5;
            const defined = a * x + c > 1e-12;
            const pred = a > 0 ? x > qnum(bd) + 1e-12 : x < qnum(bd) - 1e-12;
            assert(defined === pred, "真数条件の検算");
          }
          const wrong = [
            [a > 0 ? rangeTex(null, bd, false, false) : rangeTex(bd, null, false, false), "MC-LOGDOM-DIRECTION"],
            [a > 0 ? rangeTex(bd, null, true, false) : rangeTex(null, bd, false, true), "MC-LOGDOM-EQUAL"],
            [a > 0 ? rangeTex(neg(bd), null, false, false) : rangeTex(null, neg(bd), false, false), "MC-LOGDOM-SIGN"],
            [a > 0 ? rangeTex(Q(c), null, false, false) : rangeTex(null, Q(c), false, false), "MC-LOGDOM-SIGN"],
            [a > 0 ? rangeTex(null, neg(bd), false, false) : rangeTex(neg(bd), null, false, false), "MC-LOGDOM-DIRECTION"],
          ];
          return choice({
            q: `関数 $y=\\log_{${b}} (${linTex(a, c)})$ が定義される $x$ の範囲を求めなさい。`,
            correct: $(correct),
            wrongs: labels(wrong, correct),
            explain: `対数の真数は正でなければなりません。$${linTex(a, c)}>0$ を解きます。${a < 0 ? `$x$ の係数が負なので、両辺を負の数 $${a}$ でわるときに不等号の向きが逆になります。` : ""}$${correct}$。（等号は含まない：真数は $0$ にもなれない）`,
          });
        }
        // log_B (x + c) (op) k。B = b（>1）または 1/b（<1）
        const b = r.pick([2, 3]);
        const recip = lv === 3 || r.chance(0.3);
        const c = lv === 2 ? 0 : r.pick([-2, -1, 1, 2, 3]);
        const k = r.pick([1, 2, 3, -1, -2]);
        const op = r.pick(OPS);
        const Bv = recip ? 1 / b : b;
        // arg (op*) A 、A = B^k
        const A = recip ? qpow(Q(b), -k) : qpow(Q(b), k);
        const opA = recip ? flipOp[op] : op;
        // arg = x + c > 0 → x > −c
        const domLo = Q(-c);
        const upper = sub(A, Q(c));
        let correct;
        if (opA === "<" || opA === "<=") correct = rangeTex(domLo, upper, false, opA === "<=");
        else correct = rangeTex(upper, null, opA === ">=", false);
        // 全数チェック：真数条件の端のまわりと、解の端のまわりの点で確かめる
        const tests = [];
        for (let i = -8; i <= 8; i++) tests.push(-c + i * 0.25, qnum(upper) + i * 0.25);
        for (const xv of tests) {
          const arg = xv + c;
          const orig = arg > 1e-12 && holdsF(op, Math.log(arg) / Math.log(Bv), k);
          let pred;
          if (opA === "<" || opA === "<=") pred = xv > -c + 1e-12 && (opA === "<" ? xv < qnum(upper) - 1e-12 : xv <= qnum(upper) + 1e-12);
          else pred = opA === ">" ? xv > qnum(upper) + 1e-12 : xv >= qnum(upper) - 1e-12;
          assert(orig === pred, "対数不等式の検算");
        }
        const isLess = opA === "<" || opA === "<=";
        const edgeFlip = { "<": "<=", ">": ">=", "<=": "<", ">=": ">" }[opA];
        const mk = (o, bd, lo = domLo) => (o === "<" || o === "<=" ? rangeTex(lo, bd, false, o === "<=") : rangeTex(bd, null, o === ">=", false));
        const wrong = [
          // 真数条件を忘れた（不等式が「<」型のとき、左端が消える）
          ...(isLess ? [[rangeTex(null, upper, false, opA === "<="), "MC-LOGINEQ-DOMAIN"]] : []),
          // 底の大きさに応じた向きの変え方をまちがえた
          [mk(flipOp[opA], upper), recip ? "MC-LOGINEQ-FLIP" : "MC-LOGINEQ-DIRECTION"],
          // 端を含む／含まない
          [mk(edgeFlip, upper), "MC-LOGINEQ-EQUAL"],
          // 真数と x を混同（c を引き忘れ）
          ...(c !== 0 ? [[mk(opA, A), "MC-LOGINEQ-SHIFT"]] : []),
          // 符号・大きさのまちがい
          [mk(opA, neg(upper), isLess ? domLo : domLo), "MC-LOGINEQ-SIGN"],
          [mk(opA, Q(b * k - c)), "MC-LOGINEQ-MEANING"],
          [mk(opA, add(upper, Q(1))), "MC-SLIP"],
        ];
        const baseTex = recip ? `\\frac{1}{${b}}` : `${b}`;
        return choice({
          q: `次の不等式を解きなさい。\n$\\log_{${baseTex}} ${c === 0 ? "x" : `(x${sgn(c)})`}${opTex[op]}${k}$`,
          correct: $(correct),
          wrongs: labels(wrong, correct),
          explain: `まず真数条件：${c === 0 ? "$x>0$" : `$x${sgn(c)}>0$ より $x>${-c}$`}。次に右辺を対数で表します。$${k}=\\log_{${baseTex}} \\left(${recip ? `\\frac{1}{${b}}` : b}\\right)^{${k}}=\\log_{${baseTex}} ${tq(A)}$。${recip ? "底が 1 より小さい（$0<$底$<1$）ので、真数どうしを比べるときに不等号の向きが逆になります。" : "底が 1 より大きいので、真数どうしの大小はそのままです。"}$${c === 0 ? "x" : `x${sgn(c)}`}${opTex[opA]}${tq(A)}$ と真数条件を合わせて、$${correct}$。`,
        });
      },
      { id: "b", db: 0.3 },
    ),
  ],
};
