// ============================================================
// tpl/mid_alg1.js — 中学校 文字式・1次式・1次方程式とその利用
//   lit_notation / lit_evaluate / linear_expr_calc / eq_linear_basic / eq_linear_adv / eq_word_linear
// ============================================================
import { num, choice } from "../../core/items.js";
import { Q, add, sub, mul, div, eq, neg, toDecimalString } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert, gcd, lcm, NAMES } from "./util.js";

const decStr = (q) => toDecimalString(q) ?? tq(q);
const $ = (s) => `$${s}$`;
const tx = (p, order = ["x"]) => p.toTeX({ order });
/** a x + b の Poly */
const L = (a, b, v = "x") => P.lin(a, b, v);
/** 方程式 a1 x + b1 = a2 x + b2 の解 */
const solve = (a1, b1, a2, b2) => (eq(sub(a1, a2), 0) ? null : div(sub(b2, b1), sub(a1, a2))); // 分母が0になる誤答は作らない

export default {
  // ── 文字式の表し方 ─────────────────────────────
  lit_notation: [
    t("choice", (r, lv) => {
      const k = r.int(2, 9);
      const m = r.int(2, 5);
      const recipes = {
        1: [
          () => ({ given: `a\\times ${k}`, correct: `${k}a`, wrongs: [[`a${k}`, "MC-LIT-NUM-AFTER"], [`a+${k}`, "MC-LIT-OP"], [`a^{${k}}`, "MC-LIT-POWER"], [`a\\times ${k}`, "MC-LIT-OP"]] }),
          () => ({ given: `x\\times y\\times ${k}`, correct: `${k}xy`, wrongs: [[`xy${k}`, "MC-LIT-NUM-AFTER"], [`${k}+xy`, "MC-LIT-OP"], [`${k}x+y`, "MC-LIT-OP"], [`x^{${k}}y`, "MC-LIT-POWER"]] }),
          () => ({ given: `a\\div ${k}`, correct: `\\frac{a}{${k}}`, wrongs: [[`\\frac{${k}}{a}`, "MC-LIT-DIV-INVERT"], [`${k}a`, "MC-LIT-OP"], [`a-${k}`, "MC-LIT-OP"], [`a^{${k}}`, "MC-LIT-POWER"]] }),
          () => ({ given: `(-1)\\times a`, correct: `-a`, wrongs: [[`-1a`, "MC-LIT-ONE"], [`1a`, "MC-LIT-ONE"], [`a-1`, "MC-LIT-OP"], [`\\frac{1}{a}`, "MC-LIT-DIV-INVERT"]] }),
        ],
        2: [
          () => ({ given: `a\\times a\\times ${k}`, correct: `${k}a^{2}`, wrongs: [[`${2 * k}a`, "MC-LIT-POWER"], [`a^{2}${k}`, "MC-LIT-NUM-AFTER"], [`(${k}a)^{2}`, "MC-LIT-POWER"], [`a^{${k}}`, "MC-LIT-POWER"]] }),
          () => ({ given: `(a+b)\\times ${k}`, correct: `${k}(a+b)`, wrongs: [[`${k}a+b`, "MC-LIT-PAREN-DROP"], [`(a+b)${k}`, "MC-LIT-NUM-AFTER"], [`a+b+${k}`, "MC-LIT-OP"], [`${k}ab`, "MC-LIT-OP"]] }),
          () => ({ given: `(a+b)\\div ${m}`, correct: `\\frac{a+b}{${m}}`, wrongs: [[`a+\\frac{b}{${m}}`, "MC-LIT-PAREN-DROP"], [`\\frac{a}{${m}}+b`, "MC-LIT-PAREN-DROP"], [`${m}(a+b)`, "MC-LIT-DIV-INVERT"], [`\\frac{${m}}{a+b}`, "MC-LIT-DIV-INVERT"]] }),
          () => ({ given: `x\\div y\\times ${k}`, correct: `\\frac{${k}x}{y}`, wrongs: [[`\\frac{x}{${k}y}`, "MC-LIT-DIV-ORDER"], [`\\frac{x}{y${k}}`, "MC-LIT-DIV-ORDER"], [`${k}xy`, "MC-LIT-DIV-ORDER"], [`\\frac{y}{${k}x}`, "MC-LIT-DIV-INVERT"]] }),
        ],
        3: [
          () => ({ given: `1個 x 円のりんごを ${k} 個と、1個 y 円のみかんを ${m} 個買ったときの代金の合計`, correct: `${k}x+${m}y`, wrongs: [[`${k}${m}xy`, "MC-LIT-OP"], [`x${k}+y${m}`, "MC-LIT-NUM-AFTER"], [`${k}+${m}+x+y`, "MC-LIT-OP"], [`(x+y)\\times ${k + m}`, "MC-LIT-OP"]] }),
          () => ({ given: `たて a cm、横 b cm の長方形の周の長さ`, correct: `2(a+b)`, wrongs: [[`2a+b`, "MC-LIT-PAREN-DROP"], [`a+b`, "MC-LIT-OP"], [`ab`, "MC-LIT-OP"], [`2ab`, "MC-LIT-OP"]] }),
          () => ({ given: `x km の道のりを時速 v km で進むときにかかる時間（時間）`, correct: `\\frac{x}{v}`, wrongs: [[`xv`, "MC-LIT-DIV-INVERT"], [`\\frac{v}{x}`, "MC-LIT-DIV-INVERT"], [`x-v`, "MC-LIT-OP"], [`x+v`, "MC-LIT-OP"]] }),
          () => ({ given: `a 円の品物の ${r.pick([10, 20, 30])}% 引きの値段`, correct: null }),
        ],
      };
      const list = recipes[lv];
      let rec = r.pick(list)();
      if (rec.correct === null) {
        const off = Number(String(rec.given).match(/(\d+)%/)[1]);
        rec = { given: rec.given, correct: `${decStr(Q(100 - off, 100))}a`, wrongs: [[`a-${decStr(Q(off, 100))}`, "MC-LIT-OP"], [`${decStr(Q(off, 100))}a`, "MC-LIT-OP"], [`a-${off}`, "MC-LIT-OP"], [`a-${off}a`, "MC-LIT-OP"]] };
      }
      const word = lv === 3;
      return choice({
        q: word ? `次の数量を、文字式の表し方にしたがって表しなさい。\n${rec.given}` : `次の式を、文字式の表し方にしたがって書き直しなさい。\n$${rec.given}$`,
        correct: $(rec.correct),
        wrongs: rec.wrongs.map(([x, mc]) => [$(x), mc]),
        explain: `文字式の約束：①かけ算の記号 $\\times$ は省く ②数は文字の前に書く ③同じ文字の積は累乗で表す ④わり算は分数で表す。${word ? "" : `$${rec.given}$ は `}$${rec.correct}$ と書きます。`,
      });
    }),
  ],

  // ── 式の値（代入） ─────────────────────────────
  lit_evaluate: [
    t("num", (r, lv) => {
      const flipEven = (poly, env) => {
        // 負の数を代入したとき、偶数乗の項の符号を誤って負にする
        let s = Q(0);
        for (const term of poly.t.values()) {
          let v = term.c;
          for (const [name, k] of Object.entries(term.e)) {
            const base = Q(env[name]);
            let pw = Q(1);
            for (let i = 0; i < k; i++) pw = mul(pw, Q(Math.abs(base.n), base.d));
            v = mul(v, pw);
            if (base.n < 0) v = mul(v, Q(-1)); // 負の数を代入した文字は、指数にかかわらず「−」を付けてしまう誤り
          }
          s = add(s, v);
        }
        return s;
      };
      if (lv === 1) {
        const [a, b] = [r.nz(-6, 7), r.nz(-9, 9)];
        const x = r.int(-6, -2);
        const poly = L(a, b);
        const ans = poly.eval({ x });
        return num({
          q: `$x=${x}$ のとき、$${tx(poly)}$ の値を求めなさい。`,
          ans,
          wrongs: [[poly.eval({ x: -x }), "MC-SUBST-SIGN"], [add(mul(a, Math.abs(x)), b), "MC-SUBST-SIGN"], [add(ans, 2), "MC-SLIP"]],
          explain: `文字に負の数を代入するときは、かっこをつけて代入します。$${a}\\times(${x})${b < 0 ? "-" : "+"}${Math.abs(b)}=${tq(ans)}$。`,
        });
      }
      if (lv === 2) {
        const [a, b, c] = [r.nz(-4, 4), r.nz(-6, 6), r.nz(-9, 9)];
        const x = r.int(-5, -2);
        const poly = P.mono(a, { x: 2 }).add(L(b, c));
        const ans = poly.eval({ x });
        return num({
          q: `$x=${x}$ のとき、$${tx(poly)}$ の値を求めなさい。`,
          ans,
          wrongs: [[flipEven(poly, { x }), "MC-SUBST-PAREN"], [poly.eval({ x: -x }), "MC-SUBST-SIGN"], [add(ans, 1), "MC-SLIP"]],
          explain: `$x^2$ に $x=${x}$ を代入すると $(${x})^2=${x * x}$（負の数を2乗すると正）。$${a}\\times ${x * x}${b < 0 ? "" : "+"}${b}\\times(${x})${c < 0 ? "" : "+"}${c}=${tq(ans)}$。`,
        });
      }
      const a = r.nz(-3, 3);
      const b = r.nz(-4, 4);
      const [x, y] = until(() => [r.nz(-4, 4), r.nz(-4, 4)], ([p, q]) => p < 0 || q < 0);
      const poly = P.mono(a, { x: 2, y: 1 }).add(P.mono(b, { x: 1, y: 1 })).add(P.mono(-1, { y: 2 }));
      const ans = poly.eval({ x, y });
      return num({
        q: `$x=${x},\\ y=${y}$ のとき、$${tx(poly, ["x", "y"])}$ の値を求めなさい。`,
        ans,
        wrongs: [[flipEven(poly, { x, y }), "MC-SUBST-PAREN"], [poly.eval({ x: Math.abs(x), y: Math.abs(y) }), "MC-SUBST-SIGN"], [add(ans, 2), "MC-SLIP"]],
        explain: `それぞれ（かっこをつけて）代入します。$x^2y$ は $(${x})^2\\times(${y})$、$xy$ は $(${x})\\times(${y})$、$y^2$ は $(${y})^2$。計算して $${tq(ans)}$。`,
      });
    }),
  ],

  // ── 1次式の加減・数との乗除 ─────────────────────
  linear_expr_calc: [
    t("choice", (r, lv) => {
      const A = L(r.nz(-6, 7), r.nz(-9, 9));
      const B = L(r.nz(-6, 7), r.nz(-9, 9));
      const [a, b] = [A.coeff(1).n, A.coeff(0).n]; // 係数は整数
      const [c, d] = [B.coeff(1).n, B.coeff(0).n];
      const sg = (n) => (n >= 0 ? `+${n}` : `${n}`);
      const wrap = (p) => `(${tx(p)})`;
      let correct, given, wrongs, explain;
      if (lv === 1) {
        const plus = r.chance(0.5);
        correct = plus ? A.add(B) : A.sub(B);
        given = `${wrap(A)}${plus ? "+" : "-"}${wrap(B)}`;
        wrongs = plus
          ? [[L(a + c, b - d), "MC-EXPR-SIGN"], [L(a + c + b + d, 0), "MC-EXPR-UNLIKE"], [L(a - c, b + d), "MC-EXPR-SIGN"], [correct.neg(), "MC-EXPR-SIGN"], [L(b + d, a + c), "MC-EXPR-UNLIKE"]]
          : [[L(a - c, b + d), "MC-EXPR-SUB-SIGN"], [L(a + c, b - d), "MC-EXPR-SUB-SIGN"], [L(a - c, d - b), "MC-EXPR-SIGN"], [correct.neg(), "MC-EXPR-SIGN"], [L(a + c, b + d), "MC-EXPR-SUB-SIGN"]];
        explain = plus ? `かっこをはずして、$x$ の項どうし、数の項どうしをまとめます。$${tx(A)}${sg(c)}x${sg(d)}$ をまとめて $${tx(correct)}$。` : `ひくかっこをはずすときは、中の各項の符号をすべて変えます。$${tx(A)}${sg(-c)}x${sg(-d)}$ をまとめて $${tx(correct)}$。`;
      } else if (lv === 2) {
        const [k, m] = [r.nz(-4, 5), r.nz(-4, 5)];
        correct = A.scale(k).add(B.scale(m));
        given = `${k === 1 ? "" : k === -1 ? "-" : k}${wrap(A)}${m < 0 ? "-" : "+"}${Math.abs(m) === 1 ? "" : Math.abs(m)}${wrap(B)}`;
        wrongs = [
          [L(k * a, b).add(B.scale(m)), "MC-EXPR-DISTRIB"],
          [A.scale(k).add(L(m * c, d)), "MC-EXPR-DISTRIB"],
          [L(k * a + m * c, k * b - m * d), "MC-EXPR-SIGN"],
          [correct.neg(), "MC-EXPR-SIGN"],
          [L(k * a, b).add(L(m * c, d)), "MC-EXPR-DISTRIB"],
        ];
        explain = `分配法則で、かっこの前の数を中のすべての項にかけます。$${k}(${tx(A)})=${tx(A.scale(k))}$、$${m}(${tx(B)})=${tx(B.scale(m))}$。これらをまとめて $${tx(correct)}$。`;
      } else {
        const k = r.pick([2, 3, 4, 6]);
        const inner = L(r.nz(-5, 5) * k, r.nz(-5, 5) * k);
        const q = inner.scale(Q(1, k));
        correct = q;
        given = `(${tx(inner)})\\div ${k}`;
        const [ia, ib] = [inner.coeff(1).n, inner.coeff(0).n];
        wrongs = [[L(Q(ia, k), ib), "MC-EXPR-DISTRIB"], [L(ia, Q(ib, k)), "MC-EXPR-DISTRIB"], [L(ia * k, ib * k), "MC-EXPR-DISTRIB"], [q.neg(), "MC-EXPR-SIGN"]];
        explain = `わり算は、かっこの中のすべての項をその数でわります。$${ia}x\\div ${k}=${tq(div(ia, k))}x$、$${ib}\\div ${k}=${tq(div(ib, k))}$。答えは $${tx(q)}$。`;
      }
      wrongs.push([correct.add(P.c(1)), "MC-SLIP"], [correct.add(P.x()), "MC-SLIP"]);
      return choice({
        q: `次の計算をしなさい。\n$${given}$`,
        correct: $(tx(correct)),
        wrongs: wrongs.map(([p, mc]) => [$(tx(p)), mc]),
        explain,
      });
    }),
  ],

  // ── 1次方程式（基本） ──────────────────────────
  eq_linear_basic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const x = r.nz(-9, 12);
        const kind = r.int(1, 3);
        if (kind === 1) {
          const a = r.nz(-9, 9);
          return num({
            q: `方程式 $x${a > 0 ? "+" : "-"}${Math.abs(a)}=${x + a}$ を解きなさい。`,
            ans: x,
            wrongs: [[x + 2 * a, "MC-EQ-TRANSPOSE"], [-x, "MC-EQ-SIGN"], [x + a, "MC-EQ-TRANSPOSE"]],
            explain: `${a > 0 ? "左辺の $+" + a + "$" : "左辺の $-" + Math.abs(a) + "$"} を移項すると符号が変わり、$x=${x + a}${a > 0 ? "-" : "+"}${Math.abs(a)}=${x}$。（たしかめ：$${x}${a > 0 ? "+" : "-"}${Math.abs(a)}=${x + a}$）`,
          });
        }
        if (kind === 2) {
          const a = r.pick([-9, -8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
          return num({
            q: `方程式 $${a}x=${a * x}$ を解きなさい。`,
            ans: x,
            wrongs: [[-x, "MC-EQ-SIGN"], [a * x - a, "MC-EQ-DIV"], [a * a * x, "MC-EQ-DIV"]],
            explain: `両辺を $${a}$ でわります。$x=${a * x}\\div(${a})=${x}$。`,
          });
        }
        const a = r.pick([2, 3, 4, 5]);
        return num({
          q: `方程式 $\\dfrac{x}{${a}}=${x}$ を解きなさい。`,
          ans: x * a,
          wrongs: [[Q(x, a), "MC-EQ-DIV"], [x - a, "MC-EQ-TRANSPOSE"], [-x * a, "MC-EQ-SIGN"]],
          explain: `両辺に $${a}$ をかけます。$x=${x}\\times ${a}=${x * a}$。`,
        });
      }
      if (lv === 2) {
        if (r.chance(0.5)) {
          const [a, x, b] = [r.pick([-7, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), r.nz(-8, 9), r.nz(-12, 12)];
          const c = a * x + b;
          return num({
            q: `方程式 $${a}x${b >= 0 ? "+" : "-"}${Math.abs(b)}=${c}$ を解きなさい。`,
            ans: x,
            wrongs: [[Q(c + b, a), "MC-EQ-TRANSPOSE"], [Q(c, a), "MC-EQ-TRANSPOSE"], [-x, "MC-EQ-SIGN"]],
            explain: `$${b >= 0 ? "+" + b : "-" + Math.abs(b)}$ を移項して $${a}x=${c}${b >= 0 ? "-" : "+"}${Math.abs(b)}=${c - b}$。両辺を $${a}$ でわって $x=${x}$。`,
          });
        }
        const { a1, b1, a2, b2, x } = until(
          () => {
            const x = r.nz(-6, 8);
            const a1 = r.nz(-7, 8);
            const a2 = r.nz(-7, 8);
            const b1 = r.nz(-12, 12);
            return { a1, b1, a2, b2: a1 * x + b1 - a2 * x, x };
          },
          (v) => v.a1 !== v.a2 && Math.abs(v.b2) < 30 && v.b2 !== 0,
        );
        const sh = (a, b) => tx(L(a, b));
        return num({
          q: `方程式 $${sh(a1, b1)}=${sh(a2, b2)}$ を解きなさい。`,
          ans: x,
          wrongs: [[solve(a1, b1, -a2, b2), "MC-EQ-TRANSPOSE"], [solve(a1, b1, a2, -b2), "MC-EQ-TRANSPOSE"], [neg(x), "MC-EQ-SIGN"]],
          explain: `$x$ の項を左辺、数の項を右辺に移項します（移項すると符号が変わる）。$${tx(L(sub(a1, a2), 0))}=${b2 - b1}$。両辺を $${a1 - a2}$ でわって $x=${x}$。`,
        });
      }
      const { a1, b1, a2, b2 } = until(
        () => ({ a1: r.nz(-9, 9), b1: r.nz(-15, 15), a2: r.nz(-9, 9), b2: r.nz(-15, 15) }),
        (v) => v.a1 !== v.a2 && solve(v.a1, v.b1, v.a2, v.b2).d > 1 && solve(v.a1, v.b1, v.a2, v.b2).d <= 8 && Math.abs(solve(v.a1, v.b1, v.a2, v.b2).n) < 30,
      );
      const ans = solve(a1, b1, a2, b2);
      return num({
        q: `方程式 $${tx(L(a1, b1))}=${tx(L(a2, b2))}$ を解きなさい。（答えは分数で答えます）`,
        reduced: true,
        ans,
        wrongs: [[solve(a1, b1, -a2, b2), "MC-EQ-TRANSPOSE"], [solve(a1, b1, a2, -b2), "MC-EQ-TRANSPOSE"], [neg(ans), "MC-EQ-SIGN"]],
        explain: `$x$ の項を左辺に、数の項を右辺に移項すると $${tx(L(sub(a1, a2), 0))}=${b2 - b1}$。両辺を $${a1 - a2}$ でわって $x=${tq(ans)}$。`,
      });
    }),
  ],

  // ── かっこ・分数・小数を含む1次方程式 ─────────────
  eq_linear_adv: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // 数(x+b) = cx + d
        const { a, b, c, d, x } = until(
          () => {
            const x = r.nz(-6, 8);
            const a = r.pick([2, 3, 4, 5, -2, -3]);
            const b = r.nz(-6, 6);
            const c = r.nz(-3, 5);
            return { a, b, c, x, d: a * (x + b) - c * x };
          },
          (v) => v.a !== v.c && Math.abs(v.d) < 25 && v.d !== 0,
        );
        const bTx = b > 0 ? `+${b}` : `${b}`;
        const wrongRoot = solve(a, b, c, d); // 分配法則で b にかけ忘れ：a x + b = c x + d
        return num({
          q: `方程式 $${a === 1 ? "" : a}(x${bTx})=${tx(L(c, d))}$ を解きなさい。`,
          ans: x,
          wrongs: [[wrongRoot, "MC-EQ-DISTRIB"], [neg(x), "MC-EQ-SIGN"], [solve(a, a * b, c, -d), "MC-EQ-TRANSPOSE"]],
          explain: `まずかっこをはずします。$${a}(x${bTx})=${tx(L(a, a * b))}$。$${tx(L(a, a * b))}=${tx(L(c, d))}$ を解くと $${tx(L(a - c, 0))}=${d - a * b}$ より $x=${x}$。`,
        });
      }
      if (lv === 2) {
        // x/a + x/b = c （または x/a - b = x/c）
        const [p, q] = until(() => [r.int(2, 6), r.int(2, 6)], ([u, v]) => u !== v);
        const l = lcm(p, q);
        const x = l * r.nz(-3, 4);
        const rhs = add(Q(x, p), Q(x, q));
        const sign = r.chance(0.5) ? 1 : -1;
        const c = sign > 0 ? rhs : sub(Q(x, p), Q(x, q));
        return num({
          q: `方程式 $\\dfrac{x}{${p}}${sign > 0 ? "+" : "-"}\\dfrac{x}{${q}}=${tq(c)}$ を解きなさい。`,
          ans: x,
          wrongs: [
            [div(c, sign > 0 ? Q(l / p + l / q) : Q(l / p - l / q)), "MC-EQ-FRAC-CLEAR"], // 右辺にかけ忘れ
            [div(mul(c, l), sign > 0 ? add(Q(l, p), Q(1, q)) : sub(Q(l, p), Q(1, q))), "MC-EQ-FRAC-CLEAR"], // 一方の項にかけ忘れ
            [neg(x), "MC-EQ-SIGN"],
          ],
          explain: `分母 $${p}$ と $${q}$ の最小公倍数 $${l}$ を両辺にかけて分母をはらいます。$${l / p}x${sign > 0 ? "+" : "-"}${l / q}x=${tq(mul(c, l))}$。$${sign > 0 ? l / p + l / q : l / p - l / q}x=${tq(mul(c, l))}$ より $x=${x}$。すべての項に同じ数をかけます。`,
        });
      }
      // 小数：0.a x + 0.b = 0.c x + d
      const { p, q, rr, ss, x } = until(
        () => {
          const x = r.nz(-9, 9);
          const p = r.nz(-9, 9);
          const q = r.nz(-9, 9);
          const rr = r.nz(-9, 9);
          return { x, p, q, rr, ss: p * x + rr - q * x };
        },
        (v) => v.p !== v.q && Math.abs(v.ss) < 20 && v.ss !== 0,
      );
      const dq = (k) => decStr(Q(k, 10));
      return num({
        q: `方程式 $${dq(p)}x${rr >= 0 ? "+" : ""}${dq(rr)}=${dq(q)}x${ss >= 0 ? "+" : ""}${dq(ss)}$ を解きなさい。`,
        ans: x,
        wrongs: [[solve(p, rr * 10, q, ss), "MC-EQ-FRAC-CLEAR"], [solve(p * 10, rr, q * 10, ss), "MC-EQ-FRAC-CLEAR"], [neg(x), "MC-EQ-SIGN"]],
        explain: `両辺を $10$ 倍して小数をなくします（定数項にも忘れずにかける）。$${p}x${rr >= 0 ? "+" : ""}${rr}=${q}x${ss >= 0 ? "+" : ""}${ss}$。移項して $${p - q}x=${ss - rr}$ より $x=${x}$。`,
      });
    }),
  ],

  // ── 1次方程式の利用（文章題） ─────────────────
  eq_word_linear: [
    t("num", (r, lv) => {
      // 過不足：x 人に a 個ずつ配ると p 個あまり、b 個ずつ配ると q 個足りない
      const { n, a, b, p, q } = until(
        () => {
          const n = lv === 1 ? r.int(8, 15) : lv === 2 ? r.int(12, 25) : r.int(20, 40);
          const a = r.int(3, 6);
          const b = a + (lv === 1 ? 1 : r.int(1, 2));
          const p = r.int(2, 9);
          return { n, a, b, p, q: b * n - (a * n + p) };
        },
        (v) => v.q > 0 && v.q < 20,
      );
      const item = r.pick(["あめ", "クッキー", "シール", "えんぴつ"]);
      const total = a * n + p;
      return num({
        q: `${item}を子どもたちに配ります。1人に ${a} こずつ配ると ${p} こあまり、1人に ${b} こずつ配ると ${q} こ足りません。子どもの人数を求めなさい。`,
        ans: n,
        post: "人",
        wrongs: [[p + q, "MC-WORD-EQ-SETUP"], [total, "MC-WORD-EQ-SETUP"], [solve(a, p, b, q), "MC-WORD-EQ-SETUP"]],
        explain: `子どもの人数を $x$ 人とします。${item}の数は2通りに表せます：$${a}x+${p}$ と $${b}x-${q}$。これが等しいので $${a}x+${p}=${b}x-${q}$。移項して $${b - a}x=${p + q}$ より $x=${n}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 年齢：x 年後に親の年齢が子の k 倍
        const { child, parent, years, k } = until(
          () => {
            const child = r.int(8, 15);
            const k = lv === 1 ? 2 : r.pick([2, 3]);
            const years = r.int(2, lv === 1 ? 6 : 12);
            const parent = k * (child + years) - years;
            return { child, parent, years, k };
          },
          (v) => v.parent >= 28 && v.parent <= 55,
        );
        const nm = r.pick(NAMES);
        return num({
          q: `${nm}さんは ${child} 才、${nm}さんの親は ${parent} 才です。何年後に、親の年齢が${nm}さんの年齢の ${k} 倍になりますか。`,
          ans: years,
          post: "年後",
          wrongs: [[Q(parent - k * child, k), "MC-WORD-EQ-SETUP"], [parent - child, "MC-WORD-EQ-SETUP"], [years + 1, "MC-SLIP"]],
          explain: `$x$ 年後とすると、親は $${parent}+x$ 才、${nm}さんは $${child}+x$ 才です。$${parent}+x=${k}(${child}+x)$ を解くと、かっこをはずして $${parent}+x=${k * child}+${k}x$、$${parent - k * child}=${k - 1}x$ より $x=${years}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
    t(
      "num",
      (r, lv) => {
        // 代金：ノート x 冊とペン (n-x) 本
        const { n, x, pn, pp } = until(
          () => {
            const n = r.int(8, 20);
            const x = r.int(2, n - 2);
            const pn = lv === 1 ? r.pick([100, 120, 150]) : r.pick([60, 80, 90, 100, 120, 150, 180]);
            const pp = lv === 1 ? r.pick([50, 70, 80]) : r.pick([50, 70, 110, 130, 140, 160, 170]);
            return { n, x, pn, pp };
          },
          (v) => v.pn !== v.pp,
        );
        const total = pn * x + pp * (n - x);
        return num({
          q: `1冊 ${pn} 円のノートと 1本 ${pp} 円のペンを、合わせて ${n} 個買ったところ、代金の合計は ${total} 円でした。ノートは何冊買いましたか。`,
          ans: x,
          post: "冊",
          wrongs: [[n - x, "MC-WORD-EQ-SETUP"], [Q(total, pn + pp), "MC-WORD-EQ-SETUP"], [Q(total - pp * n, pn), "MC-WORD-EQ-SETUP"]],
          explain: `ノートを $x$ 冊とすると、ペンは $(${n}-x)$ 本。代金は $${pn}x+${pp}(${n}-x)=${total}$。かっこをはずして $${pn - pp}x+${pp * n}=${total}$、$${pn - pp}x=${total - pp * n}$ より $x=${x}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],
};
