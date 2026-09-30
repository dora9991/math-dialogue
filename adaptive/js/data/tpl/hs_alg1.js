// ============================================================
// tpl/hs_alg1.js — 高校 式と方程式（数I）
//   ineq_linear / abs_eq_ineq / quad_ineq / expand_hs（数Ⅱ）/ factor_hs / quad_discriminant
//
//  すべて自作の数値・言い回し。答えは別の方法（全数チェック・展開の照合）でも確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, cmp, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert, gcd } from "./util.js";
import { polyFromRoots, coeffsOf } from "./hs_util.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const px = (p, order = ["x"]) => p.toTeX({ order });
const C = (cs, v = "x") => P.coeffs(cs, v);

// ------------------------------------------------------------
// 不等式の解（選択肢）の書き方
// ------------------------------------------------------------
const N_ = (q) => tq(q);
const mkSol = (v) => ({
  lt: (a) => `${v}<${N_(a)}`,
  le: (a) => `${v}\\le ${N_(a)}`,
  gt: (a) => `${v}>${N_(a)}`,
  ge: (a) => `${v}\\ge ${N_(a)}`,
  between: (lo, hi, li = false, hi_ = false) => `${N_(lo)}${li ? "\\le " : "<"}${v}${hi_ ? "\\le " : "<"}${N_(hi)}`,
  outside: (lo, hi, incl = false) => `${v}${incl ? "\\le " : "<"}${N_(lo)},\\ ${N_(hi)}${incl ? "\\le " : "<"}${v}`,
  ne: (a) => `${v}\\ne ${N_(a)}`,
  eq: (a) => `${v}=${N_(a)}`,
  all: () => "\\text{すべての実数}",
  none: () => "\\text{解なし}",
});
const sol = mkSol("x");
const solK = mkSol("k");
const flipOp = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
const opTex = { "<": "<", ">": ">", "<=": "\\le ", ">=": "\\ge " };
const solOp = (op, a) => `x${opTex[op]}${N_(a)}`;
/** 不等号 op で a と b を比べる（厳密） */
function holds(op, a, b) {
  const c = cmp(a, b);
  return op === "<" ? c < 0 : op === ">" ? c > 0 : op === "<=" ? c <= 0 : c >= 0;
}
const OPS = ["<", ">", "<=", ">="];
const absQ = (q) => Q(Math.abs(q.n), q.d);

/** 誤答候補 [TeX, mc] から、正解や重複を除いてマークアップにする */
function collect(list, correct) {
  const seen = new Set([correct]);
  const out = [];
  for (const [label, mc] of list) {
    if (seen.has(label)) continue;
    seen.add(label);
    out.push([$(label), mc]);
  }
  return out;
}

/** a x + b の TeX（係数 ±1 は省く） */
function linTex(a, b, v = "x") {
  const ax = a === 0 ? "" : a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`;
  if (a === 0) return String(b);
  if (b === 0) return ax;
  return `${ax}${b > 0 ? "+" : "-"}${Math.abs(b)}`;
}

export default {
  // ── 1次不等式 ─────────────────────────────────
  ineq_linear: [
    t("choice", (r, lv) => {
      if (lv <= 2) {
        // a x + b (op) c x + d 。境界 x0 が整数になるように d を決める
        const [a, c, b, x0] =
          lv === 1
            ? [r.int(2, 5), 0, r.int(-8, 8), r.int(-6, 6)]
            : until(
                () => [r.int(-5, 5), r.int(-3, 4), r.int(-8, 8), r.int(-6, 6)],
                ([a_, c_]) => a_ - c_ !== 0 && (a_ - c_ < 0 || c_ !== 0),
              );
        const k = a - c; // 移項したあとの x の係数
        const d = k * x0 + b; // a x0 + b = c x0 + d
        const op = r.pick(OPS);
        const finalOp = k < 0 ? flipOp[op] : op;
        // 検算：もとの不等式と「x finalOp x0」が、いくつかの x で同じ真偽になる
        for (const xv of [x0 - 3, x0 - 1, x0, x0 + 1, x0 + 3]) {
          assert(holds(op, add(mul(a, xv), b), add(mul(c, xv), d)) === holds(finalOp, Q(xv), Q(x0)), "1次不等式の検算");
        }
        const correct = solOp(finalOp, Q(x0));
        const wrong = [
          [solOp(flipOp[finalOp], Q(x0)), k < 0 ? "MC-INEQ-FLIP" : "MC-INEQ-DIRECTION"],
          [solOp(finalOp.includes("=") ? finalOp.replace("=", "") : `${finalOp}=`, Q(x0)), "MC-INEQ-BOUNDARY"],
          [solOp(finalOp, Q(-x0)), "MC-INEQ-SIGN"],
          [solOp(finalOp, Q(x0 + 1)), "MC-SLIP"],
          [solOp(flipOp[finalOp], Q(-x0)), "MC-INEQ-FLIP"],
        ];
        return choice({
          q: `次の不等式を解きなさい。\n$${linTex(a, b)}${opTex[op]}${linTex(c, d)}$`,
          correct: $(correct),
          wrongs: collect(wrong, correct),
          explain: `$x$ を含む項を左辺に、数を右辺に移項します。$${linTex(k, 0)}${opTex[op]}${d - b}$。${k < 0 ? `両辺を負の数 $${k}$ でわるので、不等号の向きが逆になります。` : k === 1 ? "" : `両辺を正の数 $${k}$ でわります（向きは変わりません）。`}答えは $${correct}$。`,
        });
      }
      // 連立不等式：lo (<|≤) x (<|≤) hi
      const [lo, hi] = until(() => [r.int(-6, 3), r.int(-2, 8)], ([u, v]) => v - u >= 2);
      const a1 = r.int(2, 4);
      const b1 = r.int(-5, 5);
      const op1 = r.chance(0.5) ? ">" : ">=";
      const c1 = a1 * lo + b1; // a1 x + b1 op1 c1  →  x op1 lo
      const a2 = r.int(2, 4);
      const b2 = r.int(-5, 5);
      const op2 = r.chance(0.5) ? ">=" : ">";
      const c2 = b2 - a2 * hi; // −a2 x + b2 op2 c2  →  x (op2 の反転) hi
      const s2 = flipOp[op2];
      const loIncl = op1 === ">=";
      const hiIncl = s2 === "<=";
      const correct = sol.between(Q(lo), Q(hi), loIncl, hiIncl);
      for (const xv of [lo - 1, lo, lo + 1, hi - 1, hi, hi + 1]) {
        const orig = holds(op1, Q(a1 * xv + b1), Q(c1)) && holds(op2, Q(b2 - a2 * xv), Q(c2));
        const want = holds(loIncl ? "<=" : "<", Q(lo), Q(xv)) && holds(s2, Q(xv), Q(hi));
        assert(orig === want, "連立不等式の検算");
      }
      const wrong = [
        [loIncl ? sol.ge(Q(lo)) : sol.gt(Q(lo)), "MC-INEQ-SYSTEM"],
        [hiIncl ? sol.le(Q(hi)) : sol.lt(Q(hi)), "MC-INEQ-SYSTEM"],
        [sol.outside(Q(lo), Q(hi), false), "MC-INEQ-SYSTEM"],
        [sol.between(Q(lo), Q(hi), !loIncl, !hiIncl), "MC-INEQ-BOUNDARY"],
        [sol.between(Q(-hi), Q(-lo), hiIncl, loIncl), "MC-INEQ-FLIP"],
      ];
      return choice({
        q: `次の連立不等式を解きなさい。\n$\\begin{cases} ${linTex(a1, b1)}${opTex[op1]}${c1} \\\\ ${linTex(-a2, b2)}${opTex[op2]}${c2} \\end{cases}$`,
        correct: $(correct),
        wrongs: collect(wrong, correct),
        explain: `1つずつ解いて、共通する範囲を求めます。1つ目：$${linTex(a1, 0)}${opTex[op1]}${c1 - b1}$ より $x${opTex[op1]}${lo}$。2つ目：$${linTex(-a2, 0)}${opTex[op2]}${c2 - b2}$ を負の数 $${-a2}$ でわるので不等号の向きが逆になり、$x${opTex[s2]}${hi}$。2つの共通部分は $${correct}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 条件を満たす最大の整数／整数の個数（全数チェックで検算）
        const range = [];
        for (let i = -80; i <= 80; i++) range.push(i);
        if (lv <= 2) {
          const a = r.int(2, 5);
          const x0 = r.int(-5, 6);
          const b = r.int(-8, 8);
          const strict = r.chance(0.6);
          const neg_ = lv === 2; // 2: x の係数が負
          const s = neg_ ? -a : a;
          const c = s * x0 + b;
          // s x + b (<|≤|>|≥) c
          const op = neg_ ? (strict ? ">" : ">=") : strict ? "<" : "<=";
          const ok = (x) => holds(op, Q(s * x + b), Q(c));
          const ans = Math.max(...range.filter(ok));
          assert(ans === (strict ? x0 - 1 : x0), "最大の整数の検算");
          return num({
            q: `不等式 $${linTex(s, b)}${opTex[op]}${c}$ を満たす最大の整数 $x$ を求めなさい。`,
            ans,
            wrongs: [
              [strict ? x0 : x0 - 1, "MC-INEQ-BOUNDARY"],
              [neg_ ? x0 + 1 : ans + 2, neg_ ? "MC-INEQ-FLIP" : "MC-SLIP"],
              [ans - 1, "MC-SLIP"],
              [-x0, "MC-INEQ-SIGN"],
            ],
            explain: `${neg_ ? `$x$ の項を移項して $${linTex(s, 0)}${opTex[op]}${c - b}$。負の数 $${s}$ でわるので不等号の向きが逆になり、` : `解くと `}$x${strict ? "<" : "\\le "}${x0}$。${strict ? `$x=${x0}$ は含まれない（$<$ なので）ので、最大の整数は $${x0 - 1}$。` : `$x=${x0}$ を含む（$\\le$ なので）ので、最大の整数は $${x0}$。`}`,
          });
        }
        // 整数の個数：Lb (≤|<) a x + b (≤|<) Rb
        const a = r.int(2, 4);
        const b = r.int(-4, 4);
        const [x1, x2] = until(() => [r.int(-4, 2), r.int(1, 7)], ([u, v]) => v - u >= 3);
        const leftIncl = r.chance(0.5);
        const rightIncl = r.chance(0.5);
        const Lb = a * x1 + b;
        const Rb = a * x2 + b;
        const ok = (x) => (leftIncl ? a * x + b >= Lb : a * x + b > Lb) && (rightIncl ? a * x + b <= Rb : a * x + b < Rb);
        const found = range.filter(ok);
        assert(found.length === x2 - x1 + 1 - (leftIncl ? 0 : 1) - (rightIncl ? 0 : 1), "整数の個数の検算");
        return num({
          q: `不等式 $${Lb}${leftIncl ? "\\le " : "<"}${linTex(a, b)}${rightIncl ? "\\le " : "<"}${Rb}$ を満たす整数 $x$ は何個ありますか。`,
          ans: found.length,
          wrongs: [[x2 - x1, "MC-INEQ-COUNT"], [x2 - x1 + 1, "MC-INEQ-COUNT"], [found.length + 1, "MC-SLIP"], [found.length - 1, "MC-SLIP"]],
          explain: `各辺から $${b}$ をひき、$${a}$ でわると $${x1}${leftIncl ? "\\le " : "<"}x${rightIncl ? "\\le " : "<"}${x2}$。端を含むかどうかに注意して整数を数えると ${found.slice(0, 10).join("、")}${found.length > 10 ? "…" : ""} の $${found.length}$ 個。（端をふくむ整数の個数は「大きい方 − 小さい方 + 1」）`,
        });
      },
      { id: "b", db: 0.1 },
    ),
  ],

  // ── 絶対値を含む方程式・不等式 ────────────────────
  abs_eq_ineq: [
    t("fields", (r, lv) => {
      if (lv <= 2) {
        // |a x + b| = c 。a x + b = a(x − p) となるように作り、x = p ± q
        const a = lv === 1 ? 1 : r.pick([2, 3]);
        const p = r.int(-5, 5);
        const q = r.int(1, 6);
        const b = -a * p;
        const c = a * q;
        const bTex = b === 0 ? "" : b > 0 ? `+${b}` : `${b}`;
        const x1 = p + q;
        const x2 = p - q;
        assert(Math.abs(a * x1 + b) === c && Math.abs(a * x2 + b) === c, "絶対値の方程式の検算");
        const inner = `${a === 1 ? "" : a}x${bTex}`;
        return fields({
          q: `方程式 $|${inner}|=${c}$ の解をすべて求めなさい。`,
          orderFree: true,
          fields: [
            { id: "x1", value: x1, pre: "$x=$" },
            { id: "x2", value: x2, pre: "$x=$" },
          ],
          wrongs: [
            { values: { x1: x1, x2: -x1 }, mc: "MC-ABS-SIGN" },
            { values: { x1: x1, x2: x1 }, mc: "MC-ABS-ONE-CASE" },
            { values: { x1: p, x2: -q }, mc: "MC-ABS-SIGN" },
          ],
          explain: `$|A|=c$ のときは $A=c$ または $A=-c$ です。$${inner}=${c}$ より $x=${x1}$、$${inner}=${-c}$ より $x=${x2}$。答えは $x=${x1},\\ ${x2}$。`,
        });
      }
      // |x − p| = |x − q| （x は p と q の真ん中）
      const [p, q] = until(() => [r.int(-6, 4), r.int(-4, 7)], ([u, v]) => v - u >= 2 && (u + v) % 2 === 0);
      const mid = (p + q) / 2;
      assert(Math.abs(mid - p) === Math.abs(mid - q), "中点の検算");
      const e = (n) => (n === 0 ? "x" : n > 0 ? `x-${n}` : `x+${-n}`);
      return fields({
        q: `方程式 $|${e(p)}|=|${e(q)}|$ の解を求めなさい。（解は1つです）`,
        fields: [{ id: "x", value: mid, pre: "$x=$" }],
        wrongs: [{ values: { x: p }, mc: "MC-ABS-EXTRANEOUS" }, { values: { x: q }, mc: "MC-ABS-EXTRANEOUS" }, { values: { x: -mid }, mc: "MC-ABS-SIGN" }],
        explain: `$|A|=|B|$ は $A=B$ または $A=-B$。$A=B$ だと $${e(p)}=${e(q)}$ となり成り立ちません。$A=-B$ だと $${e(p)}=-(${e(q)})$ より $2x=${p + q}$、$x=${mid}$。（$x$ は $${p}$ と $${q}$ の真ん中の数）`,
      });
    }),
    t("choice", (r, lv) => {
      // 絶対値の不等式 |a x + b| (op) c
      const a = lv <= 1 ? 1 : r.pick([1, 2, 3]);
      const p = r.int(-5, 5);
      const q = r.int(1, 6);
      const b = -a * p;
      const c = a * q;
      const op = r.pick(OPS);
      const less = op === "<" || op === "<=";
      const incl = op === "<=" || op === ">=";
      const lo = p - q;
      const hi = p + q;
      const bTex = b === 0 ? "" : b > 0 ? `+${b}` : `${b}`;
      const inner = `${a === 1 ? "" : a}x${bTex}`;
      const correct = less ? sol.between(Q(lo), Q(hi), incl, incl) : sol.outside(Q(lo), Q(hi), incl);
      // 全数チェック
      for (let x = lo - 3; x <= hi + 3; x++) {
        const orig = holds(op, Q(Math.abs(a * x + b)), Q(c));
        const inside = incl ? x >= lo && x <= hi : x > lo && x < hi;
        const boundary = x === lo || x === hi;
        const want = less ? inside : boundary ? incl : !inside;
        assert(orig === want, "絶対値の不等式の検算");
      }
      const wrong = [
        [less ? sol.outside(Q(lo), Q(hi), incl) : sol.between(Q(lo), Q(hi), incl, incl), "MC-ABS-AND-OR"],
        [less ? sol.between(Q(lo), Q(hi), !incl, !incl) : sol.outside(Q(lo), Q(hi), !incl), "MC-ABS-BOUNDARY"],
        [less ? sol.between(Q(-hi), Q(-lo), incl, incl) : sol.outside(Q(-hi), Q(-lo), incl), "MC-ABS-SIGN"],
        [less ? (incl ? sol.le(Q(hi)) : sol.lt(Q(hi))) : incl ? sol.ge(Q(hi)) : sol.gt(Q(hi)), "MC-ABS-ONE-CASE"],
        [less ? sol.between(Q(-q), Q(q), incl, incl) : sol.outside(Q(-q), Q(q), incl), "MC-ABS-CENTER"],
      ];
      const tex = incl ? "\\le " : "<";
      return choice({
        q: `次の不等式を解きなさい。\n$|${inner}|${opTex[op]}${c}$`,
        correct: $(correct),
        wrongs: collect(wrong, correct),
        explain: less
          ? `$|A|${tex}c$ は $-c${tex}A${tex}c$（原点から $c$ 以内、つまり「間」）の形にします。$${-c}${tex}${inner}${tex}${c}$ より、各辺から $${b}$ をひいて${a === 1 ? "" : `$${a}$ でわると`}、$${correct}$。`
          : `$|A|${opTex[op]}c$ は $A${incl ? "\\le " : "<"}-c$ または $c${incl ? "\\le " : "<"}A$（原点から遠い「外側」）の形にします。$${inner}${incl ? "\\le " : "<"}${-c}$ または $${c}${incl ? "\\le " : "<"}${inner}$ を解いて、$${correct}$。`,
      });
    }, { id: "b" }),
    t(
      "num",
      (r, lv) => {
        // |x − p| = m x + n 。有効な解が1つだけで、もう1つの候補は不適（場合分けの範囲に入らない）
        const ms = lv === 1 ? [2, -2] : lv === 2 ? [2, 3, -2, -3] : [2, 3, 4, -2, -3];
        const found = [];
        for (const m of ms) {
          for (let p = -4; p <= 4; p++) {
            for (let n = -8; n <= 8; n++) {
              const xA = div(Q(p + n), Q(1 - m)); // x ≥ p の場合
              const xB = div(Q(p - n), Q(m + 1)); // x < p の場合
              const okA = cmp(xA, Q(p)) >= 0;
              const okB = cmp(xB, Q(p)) < 0;
              if (okA !== okB && xA.d === 1 && xB.d === 1 && !eq(xA, xB)) found.push({ m, p, n, xA, xB, okA });
            }
          }
        }
        const f = r.pick(found);
        const good = f.okA ? f.xA : f.xB;
        const bad = f.okA ? f.xB : f.xA;
        const e = f.p === 0 ? "x" : f.p > 0 ? `x-${f.p}` : `x+${-f.p}`;
        const rhs = `${f.m}x${f.n === 0 ? "" : sgn(f.n)}`;
        // 独立な検算：もとの式に代入する
        const holdsEq = (x) => eq(absQ(sub(x, Q(f.p))), add(mul(Q(f.m), x), Q(f.n)));
        assert(holdsEq(good) && !holdsEq(bad), "絶対値方程式の検算");
        return num({
          q: `方程式 $|${e}|=${rhs}$ の解を求めなさい。（解は1つです）`,
          ans: good,
          wrongs: [[bad, "MC-ABS-EXTRANEOUS"], [neg(good), "MC-ABS-SIGN"]],
          explain: `絶対値の中身の符号で場合分けします。(i) $x\\ge ${f.p}$ のとき $x${f.p === 0 ? "" : sgn(-f.p)}=${rhs}$ を解いて $x=${tq(f.xA)}$、(ii) $x<${f.p}$ のとき $-(${e})=${rhs}$ を解いて $x=${tq(f.xB)}$。ところが、${f.okA ? `(ii) の $x=${tq(f.xB)}$ は $x<${f.p}$ を満たしません` : `(i) の $x=${tq(f.xA)}$ は $x\\ge ${f.p}$ を満たしません`}ので不適。答えは $x=${tq(good)}$。（場合分けの範囲に入っているか、もとの式に代入して確かめる）`,
        });
      },
      { id: "c", db: 0.4 },
    ),
  ],

  // ── 2次不等式 ─────────────────────────────────
  quad_ineq: [
    t("choice", (r, lv) => {
      if (lv <= 2) {
        // a(x − r1)(x − r2) (op) 0
        const [r1, r2] = until(() => [r.int(-5, 3), r.int(-3, 6)], ([u, v]) => v - u >= 1 && v - u <= 8);
        const a = lv === 1 ? 1 : r.pick([1, -1, 2, -2]);
        const op = lv === 1 ? r.pick(["<", ">"]) : r.pick(OPS);
        const expr = polyFromRoots([r1, r2]).scale(a);
        const eff = a > 0 ? op : flipOp[op]; // 係数を正にしたあとの向き
        const less = eff === "<" || eff === "<=";
        const incl = eff === "<=" || eff === ">=";
        const correct = less ? sol.between(Q(r1), Q(r2), incl, incl) : sol.outside(Q(r1), Q(r2), incl);
        for (let x2 = (r1 - 3) * 2; x2 <= (r2 + 3) * 2; x2++) {
          const x = Q(x2, 2);
          const orig = holds(op, expr.eval({ x }), Q(0));
          const inside = incl ? cmp(x, Q(r1)) >= 0 && cmp(x, Q(r2)) <= 0 : cmp(x, Q(r1)) > 0 && cmp(x, Q(r2)) < 0;
          const onB = eq(x, Q(r1)) || eq(x, Q(r2));
          const want = less ? inside : onB ? incl : !inside;
          assert(orig === want, "2次不等式の検算");
        }
        const wrong = [
          [less ? sol.outside(Q(r1), Q(r2), incl) : sol.between(Q(r1), Q(r2), incl, incl), a > 0 ? "MC-QINEQ-DIRECTION" : "MC-QINEQ-NEG-LEAD"],
          [less ? sol.between(Q(r1), Q(r2), !incl, !incl) : sol.outside(Q(r1), Q(r2), !incl), "MC-QINEQ-EQUAL"],
          [less ? sol.between(Q(-r2), Q(-r1), incl, incl) : sol.outside(Q(-r2), Q(-r1), incl), "MC-QINEQ-ROOT-SIGN"],
          [less ? (incl ? sol.le(Q(r2)) : sol.lt(Q(r2))) : incl ? sol.ge(Q(r2)) : sol.gt(Q(r2)), "MC-QINEQ-DIRECTION"],
        ];
        return choice({
          q: `次の2次不等式を解きなさい。\n$${px(expr)}${opTex[op]}0$`,
          correct: $(correct),
          wrongs: collect(wrong, correct),
          explain: `${a < 0 ? `$x^2$ の係数が負なので、両辺を $${a}$ でわって（不等号の向きを逆にして）$x^2$ の係数を正にします。` : a > 1 ? `まず両辺を $${a}$ でわります。` : ""}左辺を因数分解すると $(x${sgn(-r1)})(x${sgn(-r2)})$ なので、$=0$ の解は $x=${r1},\\ ${r2}$。グラフは下に凸の放物線で、${less ? "$x$ 軸より下側は2つの解の間" : "$x$ 軸より上側は2つの解の外側"}。答えは $${correct}$。`,
        });
      }
      // 重解・実数解なし
      const kind = r.pick(["dz", "dn"]);
      const op = r.pick(OPS);
      let expr;
      let res;
      let info;
      if (kind === "dz") {
        const rr = r.nz(-6, 6);
        expr = polyFromRoots([rr, rr]);
        res = op === ">" ? sol.ne(Q(rr)) : op === ">=" ? sol.all() : op === "<" ? sol.none() : sol.eq(Q(rr));
        info = { rr };
      } else {
        const b = 2 * r.int(-4, 4);
        const c = (b * b) / 4 + r.int(1, 5);
        expr = C([c, b, 1]);
        res = op === ">" || op === ">=" ? sol.all() : sol.none();
        info = { b, c };
      }
      // 全数チェック（半整数の点で確かめる）
      const xs = [];
      for (let x2 = -30; x2 <= 30; x2++) xs.push(Q(x2, 2));
      const truth = xs.map((x) => holds(op, expr.eval({ x }), Q(0)));
      const cnt = truth.filter(Boolean).length;
      const expected = res === sol.all() ? xs.length : res === sol.none() ? 0 : kind === "dz" && res === sol.eq(Q(info.rr)) ? 1 : xs.length - 1;
      assert(cnt === expected, "特別な2次不等式の検算");
      const pool = [sol.all(), sol.none()];
      const cx = kind === "dz" ? info.rr : -info.b / 2;
      pool.push(sol.ne(Q(cx)), sol.eq(Q(cx)), sol.gt(Q(cx)), sol.lt(Q(cx)));
      return choice({
        q: `次の2次不等式を解きなさい。\n$${px(expr)}${opTex[op]}0$`,
        correct: $(res),
        wrongs: collect(pool.map((s) => [s, "MC-QINEQ-SPECIAL"]), res),
        explain:
          kind === "dz"
            ? `左辺は $(x${sgn(-info.rr)})^2$ と因数分解できます。平方は 0 以上で、0 になるのは $x=${info.rr}$ のときだけ。${op === ">" ? `「0 より大きい」のは $x=${info.rr}$ 以外のすべて` : op === ">=" ? "「0 以上」は常に成り立つ" : op === "<" ? "「0 より小さい」ことはない" : `「0 以下」は $x=${info.rr}$ のときだけ`}。答えは $${res}$。`
            : `判別式 $D=b^2-4ac=${info.b * info.b}-${4 * info.c}<0$ なので、放物線は $x$ 軸と交わりません（下に凸で、$x$ 軸より上にあります）。よって左辺は常に正。${op === ">" || op === ">=" ? "「0 より大きい／0 以上」は常に成り立つ" : "「0 より小さい／0 以下」ことはない"}。答えは $${res}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 2次不等式を満たす整数の個数
          const [r1, r2] = until(() => [r.int(-6, 1), r.int(2, 7)], ([u, v]) => v - u >= 3);
          const expr = polyFromRoots([r1, r2]);
          let cnt = 0;
          for (let x = -30; x <= 30; x++) if (qnum(expr.eval({ x })) < 0) cnt++;
          assert(cnt === r2 - r1 - 1, "整数の個数の検算");
          return num({
            q: `2次不等式 $${px(expr)}<0$ を満たす整数 $x$ は何個ありますか。`,
            ans: cnt,
            wrongs: [[r2 - r1, "MC-QINEQ-EQUAL"], [r2 - r1 + 1, "MC-QINEQ-EQUAL"], [cnt + 1, "MC-SLIP"]],
            explain: `因数分解して $(x${sgn(-r1)})(x${sgn(-r2)})<0$ より $${r1}<x<${r2}$。端は含まないので、整数は $${r1 + 1}$ から $${r2 - 1}$ までの $${cnt}$ 個。`,
          });
        }
        if (lv === 2) {
          // ≦ のときの整数の和
          const [r1, r2] = until(() => [r.int(-5, 0), r.int(1, 5)], ([u, v]) => v - u >= 3);
          const expr = polyFromRoots([r1, r2]);
          let sum = 0;
          let sumStrict = 0;
          for (let x = -30; x <= 30; x++) {
            const v = qnum(expr.eval({ x }));
            if (v <= 0) sum += x;
            if (v < 0) sumStrict += x;
          }
          return num({
            q: `2次不等式 $${px(expr)}\\le 0$ を満たす整数 $x$ の和を求めなさい。`,
            ans: sum,
            wrongs: [[sumStrict, "MC-QINEQ-EQUAL"], [-sum, "MC-SLIP"], [sum + r2, "MC-SLIP"], [sum - r1, "MC-SLIP"]],
            explain: `因数分解して $(x${sgn(-r1)})(x${sgn(-r2)})\\le 0$ より $${r1}\\le x\\le ${r2}$（端も含む）。整数は $${r1}$ から $${r2}$ までなので、その和は $${sum}$。`,
          });
        }
        // すべての実数 x で x² + b x + k > 0 が成り立つ最小の整数 k
        const b = r.int(-7, 7);
        const ans = Math.floor((b * b) / 4) + 1;
        const good = (k) => b * b - 4 * k < 0;
        assert(good(ans) && !good(ans - 1), "判別式の検算");
        return num({
          q: `すべての実数 $x$ について $x^2${b === 0 ? "" : b > 0 ? `+${b === 1 ? "" : b}x` : `${b === -1 ? "-" : b}x`}+k>0$ が成り立つような整数 $k$ のうち、最小のものを求めなさい。`,
          ans,
          wrongs: [[ans - 1, "MC-DISC-EQUAL"], [Math.round((b * b) / 4), "MC-DISC-FORMULA"], [ans + 1, "MC-SLIP"], [b * b, "MC-DISC-FORMULA"]],
          explain: `常に $x^2+bx+k>0$ となるのは、放物線が $x$ 軸と交わらないとき。判別式 $D=b^2-4k<0$。$D=${b * b}-4k<0$ より $k>${tq(Q(b * b, 4))}$。これを満たす最小の整数は $${ans}$。（$k=${ans - 1}$ だと $D=${b * b - 4 * (ans - 1)}\\ge 0$ で、$x$ 軸と接するか交わってしまう）`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 3次式の展開と因数分解（数Ⅱ） ─────────────────
  expand_hs: [
    t("choice", (r, lv) => {
      /** (p x + q [y])^3 の係数（x の次数の低い順）。2 変数のときは y^(3−k) をかける */
      const cubeCoefs = (p, q) => [q ** 3, 3 * p * q * q, 3 * p * p * q, p ** 3];
      const fromCoefs = (cs, two) => {
        let out = new Poly();
        cs.forEach((c, k) => {
          if (c !== 0) out = out.add(Poly.mono(c, two ? { x: k, y: 3 - k } : k ? { x: k } : {}));
        });
        return out;
      };
      let given;
      let correct;
      let wrongs; // [Poly, mc][]
      let two = false;
      let expl;
      const kind = lv === 1 ? "cube" : lv === 2 ? r.pick(["cube", "sumcube"]) : r.pick(["triple", "quadlin", "cube2"]);
      if (kind === "cube") {
        const p = lv === 1 ? 1 : r.pick([2, 3]);
        const q = r.pick(lv === 2 ? [1, 2, 3, -1, -2, -3] : [1, 2, 3, 4, -1, -2, -3, -4]);
        const cs = cubeCoefs(p, q);
        given = `(${p === 1 ? "" : p}x${sgn(q)})^{3}`;
        correct = fromCoefs(cs, false);
        assert(correct.equals(P.lin(p, q).pow(3)), "3乗の展開の検算");
        wrongs = [
          [fromCoefs([cs[0], 0, 0, cs[3]], false), "MC-CUBE-MIDDLE"],
          [fromCoefs([cs[0], cs[1] / 3, cs[2] / 3, cs[3]], false), "MC-CUBE-COEF"],
          [fromCoefs([-cs[0], cs[1], cs[2], cs[3]], false), "MC-CUBE-SIGN"],
          [fromCoefs([cs[0], cs[2], cs[1], cs[3]], false), "MC-CUBE-COEF"],
          [fromCoefs([Math.abs(cs[0]), Math.abs(cs[1]), cs[2], cs[3]], false), "MC-CUBE-SIGN"],
        ];
        const ap = p === 1 ? "x" : `${p}x`;
        expl = `$(a+b)^3=a^3+3a^2b+3ab^2+b^3$ を使います。$a=${ap}$、$b=${q}$ とすると、$(${ap})^3+3(${ap})^2(${q})+3(${ap})(${q})^2+(${q})^3$。まとめて $${px(correct)}$。（真ん中の2項の係数 $3$ と、$b$ の符号に注意）`;
      } else if (kind === "sumcube") {
        const p = r.pick([1, 2, 3]);
        const q = r.pick([1, 2, 3, -1, -2, -3]);
        // (p x + q)(p²x² − p q x + q²) = p³x³ + q³
        const f1 = P.lin(p, q);
        const f2 = fromCoefs([q * q, -p * q, p * p], false);
        given = `(${px(f1)})(${px(f2)})`;
        correct = f1.mul(f2);
        assert(correct.equals(fromCoefs([q ** 3, 0, 0, p ** 3], false)), "3乗の和差の検算");
        wrongs = [
          [fromCoefs([-(q ** 3), 0, 0, p ** 3], false), "MC-CUBE-SIGN"],
          [fromCoefs(cubeCoefs(p, q), false), "MC-CUBE-FORMULA-CONFUSE"],
          [fromCoefs([q * q, 0, 0, p ** 3], false), "MC-CUBE-COEF"],
          [fromCoefs([q ** 3, 0, 0, p * p], false), "MC-CUBE-COEF"],
          [fromCoefs([q ** 3, 0, 0, -(p ** 3)], false), "MC-CUBE-SIGN"],
        ];
        expl = `$(a+b)(a^2-ab+b^2)=a^3+b^3$ の形です。$a=${p === 1 ? "" : p}x$、$b=${q}$ とみて $a^3+b^3=${tq(Q(p ** 3))}x^3+(${q})^3=${px(correct)}$。（分配法則で全部かけても同じ結果になります）`;
      } else if (kind === "triple") {
        const [a, b, c] = until(() => [r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4)], ([u, v, w]) => u !== v && v !== w && u !== w);
        given = `(x${sgn(a)})(x${sgn(b)})(x${sgn(c)})`;
        correct = P.lin(1, a).mul(P.lin(1, b)).mul(P.lin(1, c));
        const cs = coeffsOf(correct, 3);
        const [c0, c1, c2] = cs.map(qnum);
        wrongs = [
          [C([c0, c2, c1, 1]), "MC-EXPAND-TRIPLE"],
          [C([-c0, c1, c2, 1]), "MC-EXPAND-TRIPLE"],
          [C([c0, c1, -c2, 1]), "MC-EXPAND-TRIPLE"],
          [C([c0, a * b + b * c, c2, 1]), "MC-EXPAND-TRIPLE"],
          [C([c0, c1 + 1, c2, 1]), "MC-SLIP"],
        ];
        expl = `2つずつ順にかけます。$(x${sgn(a)})(x${sgn(b)})=${px(P.lin(1, a).mul(P.lin(1, b)))}$。これに $(x${sgn(c)})$ をかけて同類項をまとめると $${px(correct)}$。（$x^2$ の係数は $a+b+c$、$x$ の係数は $ab+bc+ca$、定数項は $abc$）`;
      } else if (kind === "quadlin") {
        const a = r.nz(-3, 3);
        const b = r.nz(-4, 4);
        const c = r.nz(-4, 4);
        given = `(x^{2}${a === 1 ? "+" : a === -1 ? "-" : sgn(a)}x${sgn(b)})(x${sgn(c)})`;
        correct = C([b, a, 1]).mul(P.lin(1, c));
        const cs = coeffsOf(correct, 3).map(qnum);
        wrongs = [
          [C([cs[0], cs[1], cs[2] - c, 1]), "MC-EXPAND-TRIPLE"], // x²×c を忘れた
          [C([cs[0], cs[1] - a * c, cs[2], 1]), "MC-EXPAND-TRIPLE"], // ax×c を忘れた
          [C([cs[0], cs[1] - b, cs[2], 1]), "MC-EXPAND-TRIPLE"], // b×x を忘れた
          [C([-cs[0], cs[1], cs[2], 1]), "MC-EXPAND-TRIPLE"],
          [C([cs[0], cs[1] + 1, cs[2], 1]), "MC-SLIP"],
        ];
        expl = `分配法則で、前の式のすべての項に後ろの式の各項をかけます。$x^2\\times x=x^3$、$x^2\\times(${c})=${c}x^2$、$${a}x\\times x=${a}x^2$、…と全部で6個の項ができるので、同類項をまとめて $${px(correct)}$。`;
      } else {
        // (p x + q y)^3 （2文字）
        two = true;
        const p = r.pick([1, 2, 3]);
        const q = r.pick([1, 2, -1, -2, -3]);
        const cs = cubeCoefs(p, q);
        given = `(${p === 1 ? "" : p}x${q === 1 ? "+" : q === -1 ? "-" : sgn(q)}y)^{3}`;
        correct = fromCoefs(cs, true);
        assert(correct.equals(Poly.mono(p, { x: 1 }).add(Poly.mono(q, { y: 1 })).pow(3)), "2文字の3乗の検算");
        wrongs = [
          [fromCoefs([cs[0], 0, 0, cs[3]], true), "MC-CUBE-MIDDLE"],
          [fromCoefs([cs[0], cs[1] / 3, cs[2] / 3, cs[3]], true), "MC-CUBE-COEF"],
          [fromCoefs([-cs[0], cs[1], cs[2], cs[3]], true), "MC-CUBE-SIGN"],
          [fromCoefs([cs[0], cs[2], cs[1], cs[3]], true), "MC-CUBE-COEF"],
          [fromCoefs([cs[0], Math.abs(cs[1]), cs[2], cs[3]], true), "MC-CUBE-SIGN"],
        ];
        expl = `$(a+b)^3=a^3+3a^2b+3ab^2+b^3$ で $a=${p === 1 ? "" : p}x$、$b=${q === 1 ? "" : q === -1 ? "-" : q}y$。$${tq(Q(p ** 3))}x^3+3(${p}x)^2(${q}y)+3(${p}x)(${q}y)^2+(${q}y)^3$ をまとめて $${px(correct, ["x", "y"])}$。`;
      }
      const order = two ? ["x", "y"] : ["x"];
      const cor = px(correct, order);
      const list = wrongs.filter(([w]) => !w.equals(correct)).map(([w, mc]) => [px(w, order), mc]);
      return choice({
        q: `次の式を展開しなさい。\n$${given}$`,
        correct: $(cor),
        wrongs: collect(list, cor),
        explain: expl,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 展開したときの、ある項の係数
        if (lv === 1) {
          const a = r.nz(-5, 5);
          const which = r.pick([1, 2]);
          const cs = [a ** 3, 3 * a * a, 3 * a, 1];
          const p = P.lin(1, a).pow(3);
          assert(qnum(p.coeff(which)) === cs[which], "係数の検算");
          return num({
            q: `$(x${sgn(a)})^3$ を展開したとき、$${which === 1 ? "x" : "x^2"}$ の係数を求めなさい。`,
            ans: cs[which],
            wrongs: which === 1 ? [[a * a, "MC-CUBE-COEF"], [3 * a, "MC-CUBE-COEF"], [a ** 3, "MC-CUBE-MIDDLE"], [-3 * a * a, "MC-CUBE-SIGN"]] : [[a, "MC-CUBE-COEF"], [3 * a * a, "MC-CUBE-COEF"], [a ** 3, "MC-CUBE-MIDDLE"], [-3 * a, "MC-CUBE-SIGN"]],
            explain: `$(x+a)^3=x^3+3ax^2+3a^2x+a^3$。$a=${a}$ のとき、$x^2$ の係数は $3a=${3 * a}$、$x$ の係数は $3a^2=${3 * a * a}$。求める係数は $${cs[which]}$。`,
          });
        }
        if (lv === 2) {
          const [a, b, c] = until(() => [r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4)], ([u, v, w]) => u !== v && v !== w && u !== w);
          const which = r.pick([1, 2]);
          const p = P.lin(1, a).mul(P.lin(1, b)).mul(P.lin(1, c));
          const cs = [a * b * c, a * b + b * c + c * a, a + b + c, 1];
          assert(qnum(p.coeff(which)) === cs[which], "3つの積の係数の検算");
          return num({
            q: `$(x${sgn(a)})(x${sgn(b)})(x${sgn(c)})$ を展開したとき、$${which === 1 ? "x" : "x^2"}$ の係数を求めなさい。`,
            ans: cs[which],
            wrongs: which === 1 ? [[a + b + c, "MC-EXPAND-TRIPLE"], [a * b * c, "MC-EXPAND-TRIPLE"], [a * b + b * c, "MC-EXPAND-TRIPLE"], [-(a * b + b * c + c * a), "MC-EXPAND-TRIPLE"]] : [[a * b + b * c + c * a, "MC-EXPAND-TRIPLE"], [a * b * c, "MC-EXPAND-TRIPLE"], [-(a + b + c), "MC-EXPAND-TRIPLE"], [a + b, "MC-EXPAND-TRIPLE"]],
            explain: `3つの積を展開すると $x^3+(a+b+c)x^2+(ab+bc+ca)x+abc$ の形になります。$a=${a}$、$b=${b}$、$c=${c}$ のとき、$x^2$ の係数は $a+b+c=${a + b + c}$、$x$ の係数は $ab+bc+ca=(${a * b})+(${b * c})+(${c * a})=${a * b + b * c + c * a}$。求める係数は $${cs[which]}$。`,
          });
        }
        // (x² + a x + b)(x² + c x + d) の x² の係数、または (p x + q)^3 (x + s) の x の係数
        if (r.chance(0.5)) {
          const [a, b, c, d] = [r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4)];
          const p = C([b, a, 1]).mul(C([d, c, 1]));
          const ans = qnum(p.coeff(2));
          assert(ans === b + d + a * c, "x^2 の係数の検算");
          return num({
            q: `$(x^2${sgn(a)}x${sgn(b)})(x^2${sgn(c)}x${sgn(d)})$ を展開したとき、$x^2$ の係数を求めなさい。`,
            ans,
            wrongs: [[b + d, "MC-EXPAND-TRIPLE"], [a * c, "MC-EXPAND-TRIPLE"], [b * d, "MC-EXPAND-TRIPLE"], [b + d - a * c, "MC-EXPAND-TRIPLE"]],
            explain: `$x^2$ の項ができる組み合わせは3通り。$x^2\\times ${d}=${d}x^2$、$${a}x\\times ${c}x=${a * c}x^2$、$${b}\\times x^2=${b}x^2$。合計 $${d}+(${a * c})+${b}=${ans}$。`,
          });
        }
        const [p_, q_, s_] = until(() => [r.pick([1, 2]), r.nz(-2, 2), r.nz(-3, 3)], ([pp, qq, ss]) => !(pp === 1 && qq === ss));
        const poly = P.lin(p_, q_).pow(3).mul(P.lin(1, s_));
        const ans = qnum(poly.coeff(1));
        return num({
          q: `$(${p_ === 1 ? "" : p_}x${sgn(q_)})^3(x${sgn(s_)})$ を展開したとき、$x$ の係数を求めなさい。`,
          ans,
          wrongs: [[3 * p_ * q_ * q_, "MC-EXPAND-TRIPLE"], [q_ ** 3, "MC-EXPAND-TRIPLE"], [3 * p_ * q_ * q_ * s_, "MC-EXPAND-TRIPLE"], [ans + 1, "MC-SLIP"]],
          explain: `$(${p_ === 1 ? "" : p_}x${sgn(q_)})^3=${px(P.lin(p_, q_).pow(3))}$。これに $(x${sgn(s_)})$ をかけて、$x$ ができるのは「$x$の項×定数」と「定数×$x$」の2通り：$${tq(Q(3 * p_ * q_ * q_))}x\\times ${s_}$ と $${q_ ** 3}\\times x$。合計 $${3 * p_ * q_ * q_ * s_}+(${q_ ** 3})=${ans}$。`,
        });
      },
      { id: "b", db: 0.1 },
    ),
    t(
      "choice",
      (r, lv) => {
        // 3次式の因数分解：a³±b³（1文字・2文字）、(x+q)³ の展開形、共通因数をくくってから
        const order = ["x", "y"];
        const f2 = (f) => (f.t.size > 1 ? `(${px(f, order)})` : px(f, order));
        const prod = (fs) => fs.reduce((acc, f) => acc.mul(f), Poly.const(1));
        const kind = lv === 1 ? "cube" : lv === 2 ? r.pick(["cube", "cubeY"]) : r.pick(["perfect", "common"]);
        let given; // Poly
        let correct; // TeX
        let good; // Poly[]（定数倍もふくめた因数）
        let bad; // [TeX, Poly[], mc][]
        let expl;
        if (kind === "perfect") {
          const q = r.nz(-4, 4);
          given = C([q ** 3, 3 * q * q, 3 * q, 1]);
          good = [P.lin(1, q), P.lin(1, q), P.lin(1, q)];
          assert(prod(good).equals(P.lin(1, q).pow(3)) && prod(good).equals(given), "(x+q)³ の検算");
          const L = (u) => px(P.lin(1, u));
          correct = `(${L(q)})^{3}`;
          bad = [
            [`(${L(-q)})^{3}`, [P.lin(1, -q), P.lin(1, -q), P.lin(1, -q)], "MC-CUBE-SIGN"],
            [`(${L(q)})(${px(C([q * q, -q, 1]))})`, [P.lin(1, q), C([q * q, -q, 1])], "MC-CUBE-FORMULA-CONFUSE"],
            [`(${L(q)})(${px(C([q * q, q, 1]))})`, [P.lin(1, q), C([q * q, q, 1])], "MC-CUBE-FORMULA-CONFUSE"],
            [`(${L(q)})^{2}(${L(-q)})`, [P.lin(1, q), P.lin(1, q), P.lin(1, -q)], "MC-FACTOR-SIGN"],
            [`(${L(3 * q)})^{3}`, [P.lin(1, 3 * q), P.lin(1, 3 * q), P.lin(1, 3 * q)], "MC-CUBE-COEF"],
          ];
          expl = `$(a+b)^3=a^3+3a^2b+3ab^2+b^3$ の形になっているか確かめます。$a=x$、$b=${q}$ とすると $3a^2b=${3 * q}x^2$、$3ab^2=${3 * q * q}x$、$b^3=${q ** 3}$ で、すべて一致します。よって $${correct}$。`;
        } else {
          // p³X³ ± q³Y³ = (pX ± qY)(p²X² ∓ pq XY + q²Y²)。common のときは全体に k をかける
          const k = kind === "common" ? r.pick([2, 3, 5]) : 1;
          const withY = kind === "cubeY";
          const [p, q] = lv === 1 ? [1, r.int(1, 4)] : kind === "common" ? [1, r.int(1, 3)] : until(() => [r.int(1, 3), r.int(1, 3)], ([u, v]) => gcd(u, v) === 1 && u * v > 1);
          const plus = r.chance(0.5);
          const sq = plus ? q : -q;
          const Y = withY ? Poly.v("y") : Poly.const(1);
          const X = Poly.v("x");
          const lin = (a, b) => X.scale(a).add(Y.scale(b)); // aX + bY
          const quad = (m) => X.pow(2).scale(p * p).add(X.mul(Y).scale(m)).add(Y.pow(2).scale(q * q)); // p²X² + m XY + q²Y²
          given = X.pow(3).scale(k * p ** 3).add(Y.pow(3).scale(k * sq ** 3));
          const kP = Poly.const(k);
          good = [...(k > 1 ? [kP] : []), lin(p, sq), quad(-p * sq)];
          assert(prod(good).equals(given), "3乗の和・差の因数分解の検算");
          // 独立な検算：いくつかの値を代入して一致を確かめる
          for (const [xv, yv] of [[2, 3], [-1, 5], [4, -2]]) assert(eq(prod(good).eval({ x: xv, y: yv }), given.eval({ x: xv, y: yv })), "代入による検算");
          const kT = k > 1 ? String(k) : "";
          const show = (fs) => kT + fs.map(f2).join("");
          correct = show([lin(p, sq), quad(-p * sq)]);
          bad = [
            [show([lin(p, sq), quad(p * sq)]), [...(k > 1 ? [kP] : []), lin(p, sq), quad(p * sq)], "MC-FACTOR-CUBE-MIDDLE"],
            [show([lin(p, -sq), quad(p * sq)]), [...(k > 1 ? [kP] : []), lin(p, -sq), quad(p * sq)], "MC-FACTOR-CUBE-SIGN"],
            [show([lin(p, sq), quad(-2 * p * sq)]), [...(k > 1 ? [kP] : []), lin(p, sq), quad(-2 * p * sq)], "MC-FACTOR-CUBE-MIDDLE"],
            [kT + `(${px(lin(p, sq), order)})^{3}`, [...(k > 1 ? [kP] : []), lin(p, sq), lin(p, sq), lin(p, sq)], "MC-CUBE-FORMULA-CONFUSE"],
            ...(k > 1 ? [[[lin(p, sq), quad(-p * sq)].map(f2).join(""), [lin(p, sq), quad(-p * sq)], "MC-FACTOR-PARTIAL"]] : []),
          ];
          const A = `${p === 1 ? "" : p}x`;
          const B = `${q === 1 && withY ? "" : q}${withY ? "y" : ""}`;
          expl = `${k > 1 ? `まず共通因数 $${k}$ をくくり出して $${k}(${px(given.scale(Q(1, k)), order)})$。` : ""}${plus ? "$a^3+b^3=(a+b)(a^2-ab+b^2)$" : "$a^3-b^3=(a-b)(a^2+ab+b^2)$"} で、$a=${A}$、$b=${B}$ とみます。$${correct}$。（2次の因数の真ん中の項の符号は、1次の因数の符号と逆になります）`;
        }
        const g = prod(good);
        const list = bad.filter(([, fs]) => !prod(fs).equals(g)).map(([label, , mc]) => [label, mc]);
        return choice({
          q: `次の式を因数分解しなさい。\n$${px(given, order)}$`,
          correct: $(correct),
          wrongs: collect(list, correct),
          explain: expl,
        });
      },
      { id: "c", db: 0.2 },
    ),
  ],

  // ── たすき掛け・置き換えによる因数分解 ────────────
  factor_hs: [
    t("choice", (r, lv) => {
      // たすき掛け：(a x + b y0)(c x + d y0)
      const two = lv === 3;
      const pairs = lv === 1 ? [[1, 2], [1, 3]] : lv === 2 ? [[1, 2], [1, 3], [2, 3], [1, 4], [2, 5], [3, 4]] : [[2, 3], [1, 4], [2, 5], [3, 4], [2, 2], [3, 3]];
      const lim = lv === 1 ? 4 : 6;
      const [[a, c], b, d] = until(
        () => [r.pick(pairs), r.nz(-lim, lim), r.nz(-lim, lim)],
        ([[u, v], p, q]) => {
          const mid = u * q + p * v;
          const g = [u * v, mid, p * q].reduce((x, y) => {
            x = Math.abs(x);
            y = Math.abs(y);
            while (y) [x, y] = [y, x % y];
            return x;
          });
          return mid !== 0 && g === 1 && u * q !== p * v;
        },
      );
      const lin = (u, v) => Poly.mono(u, { x: 1 }).add(two ? Poly.mono(v, { y: 1 }) : Poly.const(v));
      const fac = (f, g) => {
        // 2つの1次式を、(x の係数, 定数) の小さい方を先にして並べる
        const key = (h) => [h.coeff(1) ? qnum(h.coeff(1)) : 0, two ? qnum(h.t.get("y1")?.c ?? Q(0)) : qnum(h.coeff(0))];
        const [k1, k2] = [key(f), key(g)];
        const first = k1[0] < k2[0] || (k1[0] === k2[0] && k1[1] <= k2[1]) ? [f, g] : [g, f];
        return first.map((h) => `(${px(h, two ? ["x", "y"] : ["x"])})`).join("");
      };
      const F1 = lin(a, b);
      const F2 = lin(c, d);
      const given = F1.mul(F2);
      const order = two ? ["x", "y"] : ["x"];
      const correct = fac(F1, F2);
      const cands = [
        [lin(a, d), lin(c, b), "MC-TASUKI-CROSS"],
        [lin(a, -b), lin(c, -d), "MC-FACTOR-SIGN"],
        [lin(a, b), lin(c, -d), "MC-FACTOR-SIGN"],
        [lin(a, -b), lin(c, d), "MC-FACTOR-SIGN"],
        [lin(a, -d), lin(c, -b), "MC-TASUKI-CROSS"],
        [lin(c, b), lin(a, d), "MC-TASUKI-CROSS"],
        [lin(a, b), lin(c, d + (d > 0 ? 1 : -1)), "MC-SLIP"],
      ];
      const list = cands.filter(([u, v]) => !u.mul(v).equals(given)).map(([u, v, mc]) => [fac(u, v), mc]);
      const mid = a * d + b * c;
      const pn = (n) => (n < 0 ? `(${n})` : `${n}`);
      return choice({
        q: `次の式を因数分解しなさい。\n$${px(given, order)}$`,
        correct: $(correct),
        wrongs: collect(list, correct),
        explain: `たすき掛けで探します。$x^2$ の係数 $${a * c}$ を $${a}\\times ${c}$、${two ? "$y^2$" : "定数項"} $${b * d}$ を $${pn(b)}\\times ${pn(d)}$ と分け、たすき（斜め）にかけてたした値が $x${two ? "y" : ""}$ の係数 $${mid}$ になる組み合わせを選びます。$${a}\\times ${pn(d)}+${pn(b)}\\times ${c}=${a * d}${b * c >= 0 ? "+" : ""}${b * c}=${mid}$ ✓。よって $${correct}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 置き換え・複2次式・平方の差を作る4次式・2文字の2次式（3次式の因数分解は数Ⅱの expand_hs）
        const kind = lv === 1 ? "subst" : lv === 2 ? r.pick(["subst", "quartic"]) : r.pick(["quartic2", "two"]);
        const linF = (k) => P.lin(1, k);
        const show = (fs) =>
          [...fs]
            .sort((f, g) => (f.degree() - g.degree()) || qnum(f.coeff(0)) - qnum(g.coeff(0)))
            .map((f) => (f.t.size > 1 ? `(${px(f)})` : px(f)))
            .join("");
        const prod = (fs) => fs.reduce((acc, f) => acc.mul(f), Poly.const(1));
        let given;
        let good; // Poly[]
        let bad; // [Poly[], mc][]
        let expl;
        if (kind === "subst") {
          const pp = r.nz(-3, 3);
          const [s, t_] = until(() => [r.nz(-5, 5), r.nz(-5, 5)], ([u, v]) => u < v && u + v !== 0);
          const m = s + t_;
          const n = s * t_;
          const u = `(x${sgn(pp)})`;
          given = `${u}^{2}${m === 1 ? "+" : m === -1 ? "-" : sgn(m)}${u}${sgn(n)}`;
          good = [linF(pp + s), linF(pp + t_)];
          const expanded = prod(good);
          // 独立な検算：与式を展開したものと一致
          const gv = P.lin(1, pp).pow(2).add(P.lin(1, pp).scale(m)).add(P.c(n));
          assert(gv.equals(expanded), "置き換えの因数分解の検算");
          bad = [
            [[linF(s), linF(t_)], "MC-FACTOR-SUBST"],
            [[linF(pp - s), linF(pp - t_)], "MC-FACTOR-SUBST"],
            [[linF(pp + s), linF(pp - t_)], "MC-FACTOR-SIGN"],
            [[linF(pp + s + t_), linF(pp)], "MC-FACTOR-SUM"],
            [[linF(-pp + s), linF(-pp + t_)], "MC-FACTOR-SUBST"],
          ];
          expl = `$x${sgn(pp)}=A$ とおくと、$A^2${m === 1 ? "+" : m === -1 ? "-" : sgn(m)}A${sgn(n)}=(A${sgn(s)})(A${sgn(t_)})$。$A$ をもとにもどして $(x${sgn(pp)}${sgn(s)})(x${sgn(pp)}${sgn(t_)})=${show(good)}$。（かっこの中を計算して簡単にするのを忘れずに）`;
        } else if (kind === "quartic") {
          const [m, n] = until(() => [r.int(1, 3), r.int(2, 5)], ([u, v]) => u < v);
          given = `x^{4}-${m * m + n * n}x^{2}+${m * m * n * n}`;
          good = [linF(-n), linF(-m), linF(m), linF(n)];
          assert(prod(good).equals(C([m * m * n * n, 0, -(m * m + n * n), 0, 1])), "4次式の検算");
          bad = [
            [[C([-m * m, 0, 1]), C([-n * n, 0, 1])], "MC-FACTOR-INCOMPLETE", true],
            [[linF(-n), linF(-m), linF(-m), linF(n)], "MC-FACTOR-SIGN"],
            [[linF(m), linF(m), linF(n), linF(n)], "MC-FACTOR-SIGN"],
            [[C([m * m, 0, 1]), C([n * n, 0, 1])], "MC-FACTOR-SIGN"],
            [[linF(-n), linF(m), linF(m), linF(n)], "MC-FACTOR-SIGN"],
          ];
          expl = `$x^2=A$ とおくと $A^2-${m * m + n * n}A+${m * m * n * n}=(A-${m * m})(A-${n * n})$。もどして $(x^2-${m * m})(x^2-${n * n})$。さらに $x^2-a^2=(x+a)(x-a)$ で分解して $${show(good)}$。（途中で止めずに、これ以上分解できなくなるまで）`;
        } else if (kind === "quartic2") {
          // x⁴ + k x² + a² = (x² + a)² − (b x)² = (x² + b x + a)(x² − b x + a)。2次の因数は実数の範囲でこれ以上分解できない（b² < 4a）
          const [a, b] = r.pick([[1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [3, 3], [4, 1], [4, 2], [4, 3]]);
          assert(b * b < 4 * a, "2次の因数が分解できない条件");
          const k = 2 * a - b * b;
          given = px(C([a * a, 0, k, 0, 1]));
          good = [C([a, b, 1]), C([a, -b, 1])];
          assert(prod(good).equals(C([a * a, 0, k, 0, 1])), "平方の差の検算");
          bad = [
            [[C([-a, b, 1]), C([-a, -b, 1])], "MC-FACTOR-SQDIFF"],
            [[C([a, b, 1]), C([a, b, 1])], "MC-FACTOR-SQDIFF"],
            [[C([a, 2 * b, 1]), C([a, -2 * b, 1])], "MC-FACTOR-SQDIFF"],
            [[C([a, 0, 1]), C([a, 0, 1])], "MC-FACTOR-SQDIFF"],
            [[C([b, a, 1]), C([b, -a, 1])], "MC-FACTOR-SQDIFF"],
          ];
          const kx2 = k === 0 ? "" : k === 1 ? "+x^2" : k === -1 ? "-x^2" : `${sgn(k)}x^2`;
          expl = `$x^2=A$ とおいても、そのままでは因数分解できません。$x^4${kx2}+${a * a}=(x^2+${a})^2-${b * b === 1 ? "" : b * b}x^2$ と「平方の差」に変形すると、$(x^2+${a})^2-(${b === 1 ? "" : b}x)^2=${show(good)}$。`;
        } else {
          // 2文字の2次式：(x + a y + b)(x + c y + d)。x について整理して、定数項（y の式）をたすき掛け
          const [a, c, b, d] = until(
            () => [r.nz(-3, 3), r.nz(-3, 3), r.nz(-4, 4), r.nz(-4, 4)],
            ([a1, c1, b1, d1]) => a1 !== c1 && a1 + c1 !== 0 && b1 + d1 !== 0 && a1 * d1 + b1 * c1 !== 0 && a1 * d1 !== b1 * c1,
          );
          const lin2 = (u, v) => Poly.v("x").add(Poly.mono(u, { y: 1 })).add(Poly.const(v));
          good = [lin2(a, b), lin2(c, d)];
          const g2 = prod(good);
          given = px(g2, ["x", "y"]);
          // 独立な検算：x について整理した形 x² + {(a+c)y + (b+d)}x + (ay+b)(cy+d) を作って比べる
          const byX = Poly.v("x", 2)
            .add(Poly.v("x").mul(Poly.mono(a + c, { y: 1 }).add(Poly.const(b + d))))
            .add(Poly.mono(a, { y: 1 }).add(Poly.const(b)).mul(Poly.mono(c, { y: 1 }).add(Poly.const(d))));
          assert(byX.equals(g2), "2文字の2次式の検算");
          bad = [
            [[lin2(a, d), lin2(c, b)], "MC-TASUKI-CROSS"],
            [[lin2(a, -b), lin2(c, -d)], "MC-FACTOR-SIGN"],
            [[lin2(-a, b), lin2(-c, d)], "MC-FACTOR-SIGN"],
            [[lin2(a, b), lin2(c, -d)], "MC-FACTOR-SIGN"],
            [[lin2(c, b), lin2(a, d)], "MC-TASUKI-CROSS"],
          ];
          const ty = (u, v) => `${u === 1 ? "" : u === -1 ? "-" : u}y${sgn(v)}`;
          const midX = a + c > 0 ? `+(${ty(a + c, b + d)})x` : `-(${ty(-(a + c), -(b + d))})x`;
          expl = `$x$ について整理すると $x^2${midX}+(${ty(a, b)})(${ty(c, d)})$。定数項（$y$ の式）を $(${ty(a, b)})$ と $(${ty(c, d)})$ に分けると、和が $x$ の係数 $${ty(a + c, b + d)}$ になるので、$${show(good)}$。`;
        }
        const correct = show(good);
        // 展開すると正解と同じになる選択肢は、「途中で止めた形」(incomplete) のときだけ残す
        const list2 = bad.filter(([fs, , incomplete]) => incomplete || !prod(fs).equals(prod(good))).map(([fs, mc]) => [show(fs), mc]);
        return choice({
          q: `次の式を因数分解しなさい。\n$${given}$`,
          correct: $(correct),
          wrongs: collect(list2, correct),
          explain: expl,
        });
      },
      { id: "b", db: 0.3 },
    ),
  ],

  // ── 判別式と解の個数 ─────────────────────────
  quad_discriminant: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const [b, c] = [r.int(-8, 8), r.int(-8, 8)];
        const D = b * b - 4 * c;
        return num({
          q: `2次方程式 $${px(C([c, b, 1]))}=0$ の判別式 $D=b^2-4ac$ の値を求めなさい。`,
          ans: D,
          wrongs: [[b * b + 4 * c, "MC-DISC-FORMULA"], [-b * b - 4 * c, "MC-DISC-FORMULA"], [b - 4 * c, "MC-DISC-FORMULA"], [b * b - 2 * c, "MC-DISC-FORMULA"]],
          explain: `$a=1$、$b=${b}$、$c=${c}$。$D=b^2-4ac=(${b})^2-4\\times 1\\times(${c})=${b * b}${-4 * c >= 0 ? "+" : ""}${-4 * c}=${D}$。${b < 0 ? "（$b$ が負でも、2乗するとプラスになります）" : ""}`,
        });
      }
      if (lv === 2) {
        // 異なる実数解の個数（0, 1, 2 をまんべんなく）
        const want = r.pick([0, 1, 2]);
        const [a, b, c] = until(
          () => {
            const a = r.pick([2, 3, -1, -2, -3]);
            if (want === 1) {
              const m = r.nz(-3, 3);
              return [a, 2 * a * m, a * m * m];
            }
            return [a, r.nz(-7, 7), r.nz(-6, 6)];
          },
          ([a, b, c]) => {
            const D = b * b - 4 * a * c;
            return want === 1 ? D === 0 : want === 2 ? D > 0 : D < 0;
          },
        );
        const D = b * b - 4 * a * c;
        const cnt = D > 0 ? 2 : D === 0 ? 1 : 0;
        assert(cnt === want, "解の個数の検算");
        return num({
          q: `2次方程式 $${px(C([c, b, a]))}=0$ の実数解は何個ありますか。`,
          ans: cnt,
          wrongs: [0, 1, 2].filter((k) => k !== cnt).map((k) => [k, D === 0 ? "MC-DISC-COUNT" : "MC-DISC-SIGN"]),
          explain: `判別式 $D=b^2-4ac=(${b})^2-4\\times(${a})\\times(${c})=${b * b}${-4 * a * c >= 0 ? "+" : ""}${-4 * a * c}=${D}$。${D > 0 ? "$D>0$ なので異なる2つの実数解" : D === 0 ? "$D=0$ なので重解（実数解は1個）" : "$D<0$ なので実数解なし"}。実数解の個数は $${cnt}$。`,
        });
      }
      // 両辺に項がある方程式を移項して判別式を求める
      const [a1, b1, c1] = [r.int(2, 4), r.nz(-5, 5), r.int(-3, 3)];
      const [a2, b2, c2] = [r.int(1, a1 - 1), r.nz(-5, 5), r.int(-6, 6)];
      const L = C([c1, b1, a1]);
      const R = C([c2, b2, a2]);
      const moved = L.sub(R);
      const A = a1 - a2;
      const B = b1 - b2;
      const Cc = c1 - c2;
      assert(moved.equals(C([Cc, B, A])), "移項の検算");
      const D = B * B - 4 * A * Cc;
      return num({
        q: `2次方程式 $${px(L)}=${px(R)}$ の判別式 $D$ の値を求めなさい。（まず右辺を左辺に移項して $ax^2+bx+c=0$ の形に整理します）`,
        ans: D,
        wrongs: [[b1 * b1 - 4 * a1 * c1, "MC-DISC-NOT-MOVED"], [B * B + 4 * A * Cc, "MC-DISC-FORMULA"], [(b1 + b2) ** 2 - 4 * (a1 + a2) * (c1 + c2), "MC-DISC-NOT-MOVED"], [B * B - 4 * A * (-Cc), "MC-DISC-FORMULA"]],
        explain: `右辺を左辺に移項すると $${px(moved)}=0$。$a=${A}$、$b=${B}$、$c=${Cc}$ なので $D=b^2-4ac=(${B})^2-4\\times ${A}\\times(${Cc})=${D}$。（左辺だけの係数で計算してはいけません）`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 重解をもつような k の値
        if (lv === 1) {
          const b = 2 * r.nz(-4, 4);
          const k = (b * b) / 4;
          return fields({
            q: `2次方程式 $x^2${b > 0 ? "+" : "-"}${Math.abs(b)}x+k=0$ が重解をもつような定数 $k$ の値を求めなさい。`,
            fields: [{ id: "k", value: k, pre: "$k=$" }],
            wrongs: [{ values: { k: b * b }, mc: "MC-DISC-FORMULA" }, { values: { k: b / 2 }, mc: "MC-DISC-FORMULA" }, { values: { k: -k }, mc: "MC-DISC-SIGN" }],
            explain: `重解をもつのは判別式 $D=0$ のとき。$D=(${b})^2-4\\times 1\\times k=${b * b}-4k=0$ より $k=${k}$。（確かめ：$x^2${sgn(b)}x+${k}=(x${sgn(b / 2)})^2$ となり重解）`,
          });
        }
        if (lv === 2) {
          // k x² + b x + c = 0 が重解 → k = b²/(4c)
          const [b, c] = until(() => [r.nz(-8, 8), r.nz(-4, 4)], ([u, v]) => (u * u) % (4 * v) === 0 && u * u / (4 * v) !== 0);
          const k = Q(b * b, 4 * c);
          return fields({
            q: `2次方程式 $kx^2${sgn(b)}x${sgn(c)}=0$ が重解をもつような定数 $k$ の値を求めなさい。（$k\\ne 0$）`,
            fields: [{ id: "k", value: k, pre: "$k=$" }],
            wrongs: [{ values: { k: Q(b, 2 * c) }, mc: "MC-DISC-FORMULA" }, { values: { k: neg(k) }, mc: "MC-DISC-SIGN" }, { values: { k: Q(b * b, 2 * c) }, mc: "MC-DISC-FORMULA" }],
            explain: `重解をもつのは $D=0$ のとき。$D=(${b})^2-4\\times k\\times(${c})=${b * b}${-4 * c >= 0 ? "+" : ""}${-4 * c}k=0$ より $k=${tq(k)}$。（$k\\ne 0$ を満たします）`,
          });
        }
        // x² + k x + (s k + t) = 0 が重解 → D(k) = (k − k1)(k − k2) = 0 の2つの k
        const table = [[-2, 6], [0, 4], [-4, 8], [2, 6], [-6, 2], [0, 8], [-8, 4], [4, 8]];
        const ok = table.filter(([k1, k2]) => (k1 + k2) % 4 === 0 && (k1 * k2) % 4 === 0);
        const [k1, k2] = r.pick(ok);
        const s = (k1 + k2) / 4;
        const tt = -(k1 * k2) / 4;
        // x² + k x + (s k + tt) = 0 の D = k² − 4 s k − 4 tt = (k − k1)(k − k2)
        const cons = s === 0 ? String(tt) : `${s === 1 ? "" : s === -1 ? "-" : s}k${tt === 0 ? "" : sgn(tt)}`;
        for (const k of [k1, k2]) assert(k * k - 4 * (s * k + tt) === 0, "重解の検算");
        return fields({
          q: `2次方程式 $x^2+kx${cons.startsWith("-") ? cons : `+${cons}`}=0$ が重解をもつような定数 $k$ の値をすべて求めなさい。`,
          orderFree: true,
          fields: [
            { id: "k1", value: k1, pre: "$k=$" },
            { id: "k2", value: k2, pre: "$k=$" },
          ],
          wrongs: [
            { values: { k1: -k1, k2: -k2 }, mc: "MC-DISC-SIGN" },
            { values: { k1: k1, k2: k1 }, mc: "MC-DISC-COUNT" },
            { values: { k1: k1 + k2, k2: k1 * k2 }, mc: "MC-DISC-FORMULA" },
          ],
          explain: `$D=k^2-4\\times 1\\times(${cons})=k^2${s === 0 ? "" : `${sgn(-4 * s)}k`}${sgn(-4 * tt)}$。重解なので $D=0$：因数分解して $(k${sgn(-k1)})(k${sgn(-k2)})=0$ より $k=${k1},\\ ${k2}$。`,
        });
      },
      { id: "b", db: 0.3 },
    ),
    t(
      "choice",
      (r, lv) => {
        // 異なる2つの実数解をもつ／実数解をもたない ような k の範囲
        const two = r.chance(0.5);
        const word = two ? "異なる2つの実数解をもつ" : "実数解をもたない";
        if (lv === 1) {
          const b = 2 * r.nz(-4, 4);
          const K = (b * b) / 4; // x² + b x + k：D = b² − 4k
          const correct = two ? solK.lt(Q(K)) : solK.gt(Q(K));
          for (let k2 = (K - 4) * 2; k2 <= (K + 4) * 2; k2++) {
            const k = k2 / 2;
            const D = b * b - 4 * k;
            assert((two ? D > 0 : D < 0) === (two ? k < K : k > K), "k の範囲の検算");
          }
          return choice({
            q: `2次方程式 $x^2${b > 0 ? "+" : "-"}${Math.abs(b)}x+k=0$ が${word}ような定数 $k$ の範囲を求めなさい。`,
            correct: $(correct),
            wrongs: collect(
              [
                [two ? solK.gt(Q(K)) : solK.lt(Q(K)), "MC-DISC-DIRECTION"],
                [two ? solK.le(Q(K)) : solK.ge(Q(K)), "MC-DISC-EQUAL"],
                [two ? solK.lt(Q(-K)) : solK.gt(Q(-K)), "MC-DISC-SIGN"],
                [two ? solK.lt(Q(b * b)) : solK.gt(Q(b * b)), "MC-DISC-FORMULA"],
              ],
              correct,
            ),
            explain: `判別式 $D=(${b})^2-4\\times 1\\times k=${b * b}-4k$。${two ? "異なる2つの実数解 ⟺ $D>0$" : "実数解をもたない ⟺ $D<0$"} なので $${b * b}-4k${two ? ">" : "<"}0$。$-4k${two ? ">" : "<"}${-b * b}$ の両辺を負の数 $-4$ でわると不等号の向きが逆になり、$${correct}$。`,
          });
        }
        // D(k) = (k − k1)(k − k2)。L2: x² + kx + m²（k1, k2 = ∓2m）／L3: x² + kx + (s k + t)
        let k1;
        let k2;
        let eqTex;
        let Dfn;
        if (lv === 2) {
          const m = r.int(1, 4);
          k1 = -2 * m;
          k2 = 2 * m;
          eqTex = `x^2+kx+${m * m}=0`;
          Dfn = (k) => k * k - 4 * m * m;
        } else {
          const table = [[-2, 6], [0, 4], [-4, 8], [2, 6], [-6, 2], [0, 8], [-8, 4], [4, 8]];
          const okT = table.filter(([u, v]) => (u + v) % 4 === 0 && (u * v) % 4 === 0);
          [k1, k2] = r.pick(okT);
          const s = (k1 + k2) / 4;
          const tt = -(k1 * k2) / 4;
          const cons = s === 0 ? String(tt) : `${s === 1 ? "" : s === -1 ? "-" : s}k${tt === 0 ? "" : sgn(tt)}`;
          eqTex = `x^2+kx${cons.startsWith("-") ? cons : `+${cons}`}=0`;
          Dfn = (k) => k * k - 4 * (s * k + tt);
        }
        const correct = two ? solK.outside(Q(k1), Q(k2)) : solK.between(Q(k1), Q(k2));
        for (let kx = (k1 - 4) * 2; kx <= (k2 + 4) * 2; kx++) {
          const k = kx / 2;
          const D = Dfn(k);
          const inside = k > k1 && k < k2;
          const onEdge = k === k1 || k === k2;
          assert(two ? D > 0 === (!inside && !onEdge) : D < 0 === inside, "k の範囲(2)の検算");
        }
        return choice({
          q: `2次方程式 $${eqTex}$ が${word}ような定数 $k$ の範囲を求めなさい。`,
          correct: $(correct),
          wrongs: collect(
            [
              [two ? solK.between(Q(k1), Q(k2)) : solK.outside(Q(k1), Q(k2)), "MC-QINEQ-DIRECTION"],
              [two ? solK.outside(Q(k1), Q(k2), true) : solK.between(Q(k1), Q(k2), true, true), "MC-DISC-EQUAL"],
              [two ? solK.outside(Q(-k2), Q(-k1)) : solK.between(Q(-k2), Q(-k1)), "MC-QINEQ-ROOT-SIGN"],
              [two ? solK.gt(Q(k2)) : solK.lt(Q(k2)), "MC-QINEQ-DIRECTION"],
            ],
            correct,
          ),
          explain: `判別式は $D=(k${sgn(-k1)})(k${sgn(-k2)})$ となります（展開して確かめられます）。${two ? "異なる2つの実数解 ⟺ $D>0$" : "実数解をもたない ⟺ $D<0$"}。$k$ の2次不等式 $(k${sgn(-k1)})(k${sgn(-k2)})${two ? ">" : "<"}0$ を解いて $${correct}$。`,
        });
      },
      { id: "c", db: 0.5 },
    ),
  ],
};
