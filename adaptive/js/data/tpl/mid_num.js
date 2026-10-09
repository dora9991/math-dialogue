// ============================================================
// tpl/mid_num.js — 中学校 数と計算（正負の数・素因数分解・平方根）と比例式
//   neg_order / neg_add / neg_sub / neg_muldiv / neg_power_mixed / prime_factor /
//   sqrt_meaning / sqrt_simplify / sqrt_addsub / ratio_eq
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, eq, cmp, abs, neg, num as qnum, toDecimalString } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert, gcd } from "./util.js";
import { evalTokens, texTokens } from "./arith.js";

const decStr = (q) => toDecimalString(q) ?? tq(q);

/** n = a²·b（b は平方因子をもたない）の {a, b} */
export function sqrtParts(n) {
  let a = 1;
  let b = n;
  for (let f = 2; f * f <= b; f++) {
    while (b % (f * f) === 0) {
      b /= f * f;
      a *= f;
    }
  }
  return { a, b };
}
const primesOf = (n) => {
  const out = [];
  let m = n;
  for (let f = 2; f * f <= m; f++) {
    let e = 0;
    while (m % f === 0) {
      m /= f;
      e++;
    }
    if (e) out.push([f, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
};
/** 括弧つきの整数（負なら括弧） */
const P = (n) => (n < 0 ? `(${n})` : `${n}`);

/** 「(-a)^n」を「-a^n」にしてしまう誤り：負の数の括弧をはずしたトークン列 */
function dropNegParen(tk) {
  const out = [];
  for (let i = 0; i < tk.length; i++) {
    if (tk[i] === "(" && tk[i + 1] === "-" && typeof tk[i + 2] !== "string" && tk[i + 3] === ")" && tk[i + 4] === "^") {
      out.push("-", tk[i + 2]);
      i += 3;
    } else out.push(tk[i]);
  }
  return out;
}

export default {
  // ── 正負の数（数直線・大小・絶対値） ─────────────
  neg_order: [
    t("choice", (r, lv) => {
      const pool = () => {
        if (lv === 1) return Array.from({ length: 4 }, () => Q(r.int(-9, 9), 1));
        if (lv === 2) return Array.from({ length: 4 }, () => Q(r.int(-99, 99), 10));
        return Array.from({ length: 4 }, () => Q(r.int(-9, 9), r.pick([2, 3, 4, 5, 6])));
      };
      const vals = until(pool, (v) => new Set(v.map((q) => `${q.n}/${q.d}`)).size === 4 && v.filter((q) => q.n < 0).length >= 2);
      const smallest = r.chance(0.5);
      const sorted = vals.slice().sort((x, y) => cmp(x, y));
      const target = smallest ? sorted[0] : sorted[3];
      // 誤りの典型：絶対値の小さい負の数を「小さい」と考える／絶対値の大きい数を「大きい」と考える
      const byAbs = vals.slice().sort((x, y) => cmp(abs(x), abs(y)));
      const trap = smallest ? vals.filter((q) => q.n < 0).sort((x, y) => cmp(abs(x), abs(y)))[0] : vals.filter((q) => q.n < 0).sort((x, y) => cmp(abs(y), abs(x)))[0];
      const show = (q) => `$${lv === 3 && q.d > 1 ? tq(q) : decStr(q)}$`;
      return choice({
        q: `次の4つの数のうち、いちばん${smallest ? "小さい" : "大きい"}数はどれですか。`,
        correct: show(target),
        wrongs: vals.filter((q) => !eq(q, target)).map((q) => [show(q), trap && eq(q, trap) ? "MC-NEG-ORDER-ABS" : null]),
        explain: `負の数は、絶対値が大きいほど小さくなります。小さい順に並べると ${sorted.map(show).join(" < ")}。よって、いちばん${smallest ? "小さい" : "大きい"}のは ${show(target)}。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          const n = r.int(1, 12);
          const a = r.chance(0.5) ? -n : n;
          const b = r.int(1, 9);
          return num({
            q: `$|${a}|+|${-b}|$ の値を求めなさい。`,
            ans: Math.abs(a) + b,
            wrongs: [[a - b, "MC-NEG-ABS-SIGN"], [a + -b, "MC-NEG-ABS-SIGN"], [Math.abs(a) - b, "MC-NEG-ABS-SIGN"]],
            explain: `絶対値は、0からの距離です。$|${a}|=${Math.abs(a)}$、$|${-b}|=${b}$ なので、$${Math.abs(a)}+${b}=${Math.abs(a) + b}$。`,
          });
        }
        if (lv === 2) {
          const n = r.int(3, 9);
          return num({
            q: `絶対値が $${n}$ 以下の整数は、全部で何個ありますか。`,
            ans: 2 * n + 1,
            post: "個",
            wrongs: [[n, "MC-NEG-ABS-COUNT"], [2 * n, "MC-NEG-ABS-COUNT"], [2 * n - 1, "MC-NEG-ABS-COUNT"]],
            explain: `$-${n}$ から $${n}$ までの整数で、$0$ もふくみます。正の数が $${n}$ 個、負の数が $${n}$ 個、0 が 1 個で、$${2 * n + 1}$ 個。`,
          });
        }
        const x = Q(r.int(15, 45), 10);
        const n = Math.floor(qnum(x));
        return num({
          q: `絶対値が $${decStr(x)}$ 以下の整数は、全部で何個ありますか。`,
          ans: 2 * n + 1,
          post: "個",
          wrongs: [[n, "MC-NEG-ABS-COUNT"], [2 * n, "MC-NEG-ABS-COUNT"], [2 * n + 3, "MC-NEG-ABS-COUNT"]],
          explain: `絶対値が $${decStr(x)}$ 以下なので、$-${decStr(x)}$ 以上 $${decStr(x)}$ 以下の整数です。$-${n}$ から $${n}$ までで、$${2 * n + 1}$ 個。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 正負の数の加法 ─────────────────────────────
  neg_add: [
    t("num", (r, lv) => {
      const mk = () => {
        if (lv === 1) return [r.nz(-9, 9), r.nz(-9, 9)];
        if (lv === 2) return [r.nz(-40, 40), r.nz(-40, 40)];
        return [Q(r.nz(-49, 49), 10), Q(r.nz(-49, 49), 10)];
      };
      const [a, b] = until(mk, ([x, y]) => (typeof x === "number" ? x * y < 0 || r.chance(0.5) : true) && !eq(x, neg(y)));
      const ans = add(a, b);
      const show = (x) => (typeof x === "number" ? P(x) : `(${decStr(x)})`);
      const ta = show(a);
      const tb = show(b);
      const absA = abs(a);
      const absB = abs(b);
      const mixed = qnum(a) * qnum(b) < 0;
      const wrongs = [[neg(ans), "MC-NEG-ADD-SIGN"]];
      if (mixed) wrongs.push([add(absA, absB), "MC-NEG-ADD-ABS"], [neg(add(absA, absB)), "MC-NEG-ADD-ABS"]);
      else wrongs.push([neg(ans), "MC-NEG-ADD-SIGN"], [sub(absA, absB), "MC-NEG-ADD-SIGN"]);
      const form = typeof a === "number" && lv === 2 && r.chance(0.5) ? `${a}${b < 0 ? "-" + -b : "+" + b}` : `${ta}+${tb}`;
      const explain = mixed
        ? `符号がちがうときは、絶対値の大きい方から小さい方をひき、絶対値の大きい方の符号をつけます。$|${decStr(a)}|$ と $|${decStr(b)}|$ では ${cmp(absA, absB) > 0 ? "前" : "後"}の方が大きいので、答えは ${qnum(ans) < 0 ? "負" : "正"}で $${decStr(ans)}$。`
        : `同じ符号のときは、絶対値の和に共通の符号をつけます。$${decStr(absA)}+${decStr(absB)}=${decStr(add(absA, absB))}$、符号は${qnum(a) < 0 ? "負" : "正"}なので $${decStr(ans)}$。`;
      return num({ q: `次の計算をしなさい。\n$${form}$`, ans, wrongs, explain });
    }),
  ],

  // ── 正負の数の減法 ─────────────────────────────
  neg_sub: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        const [a, b] = until(() => [r.nz(lv === 1 ? -9 : -30, lv === 1 ? 9 : 30), r.nz(lv === 1 ? -9 : -30, lv === 1 ? 9 : 30)], ([x, y]) => x !== y);
        const ans = a - b;
        const wrongs = [[a + b, "MC-NEG-SUB-NOFLIP"], [-(a - b), "MC-NEG-SUB-SIGN"], [Math.abs(a) - Math.abs(b), "MC-NEG-SUB-SIGN"], [-a - b, "MC-NEG-SUB-NOFLIP"]];
        return num({
          q: `次の計算をしなさい。\n$${P(a)}-${P(b)}$`,
          ans,
          wrongs,
          explain: `ひき算は、ひく数の符号を変えたたし算になおします。$${P(a)}-${P(b)}=${P(a)}+${P(-b)}$。これを計算して $${ans}$。（数直線で「$${b}$ から $${a}$ までの移動」と考えることもできます）`,
        });
      }
      // 加減混合
      const nums = until(() => Array.from({ length: 4 }, () => r.nz(-12, 12)), (v) => v.every((x, i) => i === 0 || true));
      const [a, b, c, d] = nums;
      const ans = a - b + c - d;
      // 一部の項だけ符号を変えたときの誤答
      const partial = a + b + c - d; // 第1のひき算で符号を変えなかった
      const wrongs = [[partial, "MC-NEG-SUB-NOFLIP"], [a - b + c + d, "MC-NEG-SUB-NOFLIP"], [-ans, "MC-NEG-SUB-SIGN"]];
      return num({
        q: `次の計算をしなさい。\n$${P(a)}-${P(b)}+${P(c)}-${P(d)}$`,
        ans,
        wrongs,
        explain: `ひき算をたし算になおします。$${P(a)}+${P(-b)}+${P(c)}+${P(-d)}$。正の数の和は $${[a, -b, c, -d].filter((x) => x > 0).reduce((p, q) => p + q, 0)}$、負の数の和は $${[a, -b, c, -d].filter((x) => x < 0).reduce((p, q) => p + q, 0)}$ なので、$${ans}$。`,
      });
    }),
  ],

  // ── 正負の数の乗法・除法 ───────────────────────
  neg_muldiv: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const isMul = r.chance(0.6);
        const [a, b] = until(() => [r.nz(-9, 9), r.nz(-9, 9)], ([x, y]) => Math.abs(x) > 1 && Math.abs(y) > 1);
        if (isMul) {
          const ans = a * b;
          return num({
            q: `次の計算をしなさい。\n$${P(a)}\\times ${P(b)}$`,
            ans,
            wrongs: [[-ans, "MC-NEG-MUL-SIGN"], [a + b, "MC-NEG-MUL-ADD"], [Math.abs(ans), "MC-NEG-MUL-SIGN"]],
            explain: `符号が${a * b > 0 ? "同じ" : "ちがう"}ので答えは${a * b > 0 ? "正" : "負"}。絶対値の積は $${Math.abs(a)}\\times ${Math.abs(b)}=${Math.abs(ans)}$。答えは $${ans}$。`,
          });
        }
        const q = r.nz(-9, 9);
        const dv = r.nz(-9, 9);
        const dividend = q * dv;
        return num({
          q: `次の計算をしなさい。\n$${P(dividend)}\\div ${P(dv)}$`,
          ans: q,
          wrongs: [[-q, "MC-NEG-MUL-SIGN"], [dividend + dv, "MC-NEG-MUL-ADD"], [Math.abs(q), "MC-NEG-MUL-SIGN"]],
          explain: `符号が${q > 0 ? "同じ" : "ちがう"}ので答えは${q > 0 ? "正" : "負"}。$${Math.abs(dividend)}\\div ${Math.abs(dv)}=${Math.abs(q)}$。答えは $${q}$。`,
        });
      }
      if (lv === 2) {
        const [a, b, c] = until(() => [r.nz(-6, 6), r.nz(-6, 6), r.nz(-6, 6)], ([x, y, z]) => Math.abs(x) > 1 && Math.abs(y) > 1 && Math.abs(z) > 1);
        const ans = a * b * c;
        const negs = [a, b, c].filter((x) => x < 0).length;
        return num({
          q: `次の計算をしなさい。\n$${P(a)}\\times ${P(b)}\\times ${P(c)}$`,
          ans,
          wrongs: [[-ans, "MC-NEG-MUL-SIGN"], [a * b + c, "MC-NEG-MUL-ADD"], [Math.abs(ans), "MC-NEG-MUL-SIGN"]],
          explain: `負の数が ${negs} 個（${negs % 2 ? "奇数" : "偶数"}個）なので、答えは${negs % 2 ? "負" : "正"}。絶対値の積は $${Math.abs(a)}\\times ${Math.abs(b)}\\times ${Math.abs(c)}=${Math.abs(ans)}$。答えは $${ans}$。`,
        });
      }
      const f1 = Q(r.nz(-9, 9), r.int(2, 6));
      const f2 = Q(r.nz(-9, 9), r.int(2, 6));
      const isMul = r.chance(0.5);
      const ans = isMul ? mul(f1, f2) : div(f1, f2);
      return num({
        q: `次の計算をしなさい。（答えは約分してください）\n$\\left(${tq(f1)}\\right)${isMul ? "\\times" : "\\div"}\\left(${tq(f2)}\\right)$`,
        reduced: true,
        ans,
        wrongs: [[neg(ans), "MC-NEG-MUL-SIGN"], [isMul ? div(f1, f2) : mul(f1, f2), "MC-FRAC-DIV-NO-INVERT"], [abs(ans), "MC-NEG-MUL-SIGN"]],
        explain: `符号は、負の数の個数で決まります。${isMul ? "" : "わり算は、わる数の逆数をかけるかけ算になおします。"}絶対値を計算して約分し、答えは $${tq(ans)}$。`,
      });
    }),
  ],

  // ── 累乗と正負の数の四則混合 ───────────────────
  neg_power_mixed: [
    t("num", (r, lv) => {
      const build = () => {
        if (lv === 1) {
          const a = r.int(2, 5);
          const k = r.pick([2, 2, 3]);
          return r.pick([
            ["(", "-", a, ")", "^", k],
            ["-", a, "^", k],
            [Q(r.int(1, 3)), "-", "(", "-", a, ")", "^", 2],
          ]);
        }
        if (lv === 2) {
          const a = r.int(2, 4);
          const b = r.int(2, 6);
          const c = r.int(2, 9);
          return r.pick([
            ["-", a, "^", 2, "+", "(", "-", b, ")", "^", 2],
            [c, "-", "(", "-", a, ")", "^", 2, "×", 2],
            ["(", "-", a, ")", "^", 3, "+", c, "×", "(", "-", b, ")"],
            [c * b, "÷", "(", "-", b, ")", "+", "(", "-", a, ")", "^", 2],
          ]);
        }
        const a = r.int(2, 4);
        const b = r.int(2, 5);
        const c = r.int(2, 6);
        return r.pick([
          ["(", "-", a, ")", "^", 3, "÷", 4, "-", "(", "-", b, ")", "^", 2, "×", "(", "-", 2, ")"],
          ["-", a, "^", 2, "×", "(", "-", b, ")", "-", c * 2, "÷", "(", "-", 2, ")", "^", 2],
          ["(", c, "-", "(", "-", a, ")", "^", 2, ")", "×", "(", "-", b, ")", "+", "(", "-", 2, ")", "^", 3],
        ]);
      };
      const tk = until(build, (v) => {
        const e = evalTokens(v, "std");
        return e && e.d === 1 && Math.abs(e.n) < 200;
      });
      const ans = evalTokens(tk, "std");
      const wrongs = [];
      const dn = evalTokens(dropNegParen(tk), "std");
      if (dn && !eq(dn, ans)) wrongs.push([dn, "MC-NEG-POWER-PAREN"]);
      const ltr = evalTokens(tk, "ltr");
      if (ltr && !eq(ltr, ans) && ltr.d === 1) wrongs.push([ltr, "MC-ORDER-LTR"]);
      const np = evalTokens(tk.filter((x) => x !== "(" && x !== ")"), "std");
      if (np && !eq(np, ans) && np.d === 1) wrongs.push([np, "MC-PAREN-IGNORE"]);
      wrongs.push([neg(ans), "MC-NEG-MUL-SIGN"], [add(ans, 2), "MC-SLIP"]);
      return num({
        q: `次の計算をしなさい。\n$${texTokens(tk)}$`,
        ans,
        wrongs,
        explain: `$(-a)^2$ は「$-a$ を2回かける」ので正の数、$-a^2$ は「$a^2$ に $-$ をつけた数」で負の数です。累乗 → かっこ・かけ算・わり算 → たし算・ひき算 の順に計算して $${tq(ans)}$。`,
      });
    }),
  ],

  // ── 素数と素因数分解 ───────────────────────────
  prime_factor: [
    t("choice", (r, lv) => {
      const n = lv === 1 ? r.pick([12, 18, 20, 24, 28, 36, 40, 45, 48, 50, 54, 60]) : lv === 2 ? r.pick([72, 90, 84, 96, 108, 126, 150, 180, 210]) : r.pick([252, 360, 400, 432, 450, 504, 540, 600]);
      const pf = primesOf(n);
      const tex = (list) => list.map(([p, e]) => (e === 1 ? `${p}` : `${p}^{${e}}`)).join("\\times ");
      const correct = `$${tex(pf)}$`;
      const wrongs = [];
      const p0 = pf[0][0] ** pf[0][1];
      // 素数でない数が残っている分解
      wrongs.push([`$${p0}\\times ${n / p0}$`, "MC-PRIME-NOT-PRIME"]);
      if (pf.length >= 2) {
        const last = pf[pf.length - 1];
        wrongs.push([`$${tex(pf.slice(0, -1))}\\times ${last[0] ** last[1]}$`, "MC-PRIME-NOT-PRIME"]);
      }
      // 指数のまちがい
      wrongs.push([`$${tex(pf.map(([p, e], i) => (i === 0 ? [p, e + 1] : [p, e])))}$`, "MC-PRIME-EXP"]);
      if (pf[0][1] > 1) wrongs.push([`$${tex(pf.map(([p, e], i) => (i === 0 ? [p, e - 1] : [p, e])))}$`, "MC-PRIME-EXP"]);
      if (pf.length >= 2 && pf[0][1] !== pf[1][1]) wrongs.push([`$${tex(pf.map(([p, e], i) => [p, pf[(i + 1) % pf.length][1]]))}$`, "MC-PRIME-EXP"]);
      // 素因数を1つ落とした／余分に加えた分解
      if (pf.length >= 2) wrongs.push([`$${tex(pf.slice(0, -1))}$`, "MC-PRIME-EXP"]);
      wrongs.push([`$${tex(pf.map(([p, e], i) => (i === pf.length - 1 ? [p, e + 1] : [p, e])))}$`, "MC-PRIME-EXP"]);
      return choice({
        q: `$${n}$ を素因数分解したものはどれですか。`,
        correct,
        wrongs,
        explain: `小さい素数から順にわっていきます。${(() => {
          let m = n;
          const steps = [];
          for (const [p, e] of pf) for (let i = 0; i < e; i++) {
            steps.push(`$${m}\\div ${p}=${m / p}$`);
            m /= p;
          }
          return steps.join("、");
        })()}。よって $${n}=${tex(pf)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 平方数にするための最小の自然数
        const base = r.pick([2, 3, 5, 6, 7, 10, 11, 13, 14, 15]);
        const sq = r.pick([2, 3, 4, 5]);
        const n = base * sq * sq;
        const mode = lv === 3 ? r.pick(["mul", "div"]) : "mul";
        if (mode === "mul") {
          const m = n; // n に何をかければ平方数
          const ans = sqrtParts(m).b;
          return num({
            q: `$${m}$ にできるだけ小さい自然数をかけて、ある自然数の2乗にしたい。かける数を求めなさい。`,
            ans,
            wrongs: [[m, "MC-PRIME-SQUARE"], [sqrtParts(m).a, "MC-PRIME-SQUARE"], [ans * 2, "MC-PRIME-SQUARE"]],
            explain: `$${m}$ を素因数分解すると $${primesOf(m).map(([p, e]) => (e === 1 ? p : `${p}^{${e}}`)).join("\\times ")}$。2乗の形にするには、すべての素数の指数が偶数になればよいので、指数が奇数の素数をかけます。答えは $${ans}$。`,
          });
        }
        const ans = sqrtParts(n).b;
        return num({
          q: `$${n}$ をできるだけ小さい自然数でわって、ある自然数の2乗にしたい。わる数を求めなさい。`,
          ans,
          wrongs: [[n, "MC-PRIME-SQUARE"], [sqrtParts(n).a, "MC-PRIME-SQUARE"], [ans * 2, "MC-PRIME-SQUARE"]],
          explain: `$${n}$ を素因数分解して、指数が奇数の素数を1つずつわると、すべての指数が偶数になり、2乗の形になります。答えは $${ans}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 平方根の意味・大小 ─────────────────────────
  sqrt_meaning: [
    t("fields", (r, lv) => {
      // 平方根が有理数になる数（2乗した数）を出して、平方根を2つ答えさせる
      const root = lv === 1 ? Q(r.int(2, 12)) : lv === 2 ? Q(r.int(11, 39), 10) : until(() => Q(r.int(1, 8), r.int(2, 9)), (q) => q.d > 1 && q.n > 0 && q.n < q.d * 2);
      const sq = mul(root, root);
      const sqTex = sq.d === 1 || toDecimalString(sq) ? decStr(sq) : tq(sq);
      return fields({
        q: `$${sqTex}$ の平方根をすべて答えなさい。`,
        layout: "inline",
        orderFree: true,
        fields: [
          { id: "a", value: root },
          { id: "b", value: neg(root), pre: "と" },
        ],
        wrongs: [
          { values: { a: root, b: root }, mc: "MC-SQRT-ONLY-POSITIVE" },
          { values: { a: mul(root, 2), b: neg(mul(root, 2)) }, mc: "MC-SQRT-HALF" },
          { values: { a: div(root, 2), b: neg(div(root, 2)) }, mc: "MC-SQRT-HALF" },
        ],
        explain: `2乗して $${sqTex}$ になる数を答えます。$(${tq(root)})^2=${tq(sq)}$、$(${tq(neg(root))})^2=${tq(sq)}$ なので、平方根は $${tq(root)}$ と $${tq(neg(root))}$ の2つです。（正と負の2つあります）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          const k = r.int(2, 15);
          const form = r.pick(["sqrt", "sq", "negsqrt", "sqsqrt"]);
          if (form === "sqrt") return num({ q: `$\\sqrt{${k * k}}$ の値を求めなさい。`, ans: k, wrongs: [[-k, "MC-SQRT-SIGN"], [Q(k * k, 2), "MC-SQRT-HALF"], [k * k, "MC-SQRT-HALF"]], explain: `$\\sqrt{${k * k}}$ は、2乗して $${k * k}$ になる正の数なので $${k}$。` });
          if (form === "negsqrt") return num({ q: `$-\\sqrt{${k * k}}$ の値を求めなさい。`, ans: -k, wrongs: [[k, "MC-SQRT-SIGN"], [-Q(k * k, 2).n, "MC-SQRT-HALF"], [k * k, "MC-SQRT-HALF"]].filter(([v]) => typeof v !== "object" || v), explain: `$\\sqrt{${k * k}}=${k}$ に $-$ をつけて $-${k}$。` });
          if (form === "sq") return num({ q: `$(\\sqrt{${k + 1}})^2$ の値を求めなさい。`, ans: k + 1, wrongs: [[Q(k + 1, 2), "MC-SQRT-HALF"], [(k + 1) * (k + 1), "MC-SQRT-HALF"], [-(k + 1), "MC-SQRT-SIGN"]], explain: `$\\sqrt{a}$ は2乗すると $a$ になる数なので、$(\\sqrt{${k + 1}})^2=${k + 1}$。` });
          return num({ q: `$\\sqrt{(-${k})^2}$ の値を求めなさい。`, ans: k, wrongs: [[-k, "MC-SQRT-SIGN"], [k * k, "MC-SQRT-HALF"], [Q(k * k, 2), "MC-SQRT-HALF"]], explain: `$(-${k})^2=${k * k}$ なので、$\\sqrt{${k * k}}=${k}$。（$\\sqrt{a^2}=|a|$ で、負にはなりません）` });
        }
        if (lv === 2) {
          const root = Q(r.int(1, 15), 10);
          const sq = mul(root, root);
          return num({
            q: `$\\sqrt{${decStr(sq)}}$ の値を求めなさい。`,
            ans: root,
            wrongs: [[div(sq, 2), "MC-SQRT-HALF"], [Q(root.n, root.d * 10), "MC-SQRT-DEC"], [mul(root, 10), "MC-SQRT-DEC"]],
            explain: `$(${decStr(root)})^2=${decStr(sq)}$ なので、$\\sqrt{${decStr(sq)}}=${decStr(root)}$。小数点以下のけた数は半分になります。`,
          });
        }
        const n = r.pick([30, 40, 50, 60, 70, 80, 90, 110, 130]);
        const ip = Math.floor(Math.sqrt(n));
        return num({
          q: `$\\sqrt{${n}}$ の整数部分を答えなさい。`,
          ans: ip,
          wrongs: [[ip + 1, "MC-SQRT-INTEGER-PART"], [Math.round(n / 10), "MC-SQRT-INTEGER-PART"], [Math.floor(n / 2), "MC-SQRT-HALF"]],
          explain: `$${ip}^2=${ip * ip}$、$${ip + 1}^2=${(ip + 1) * (ip + 1)}$ で、$${ip * ip}<${n}<${(ip + 1) * (ip + 1)}$ なので $${ip}<\\sqrt{${n}}<${ip + 1}$。整数部分は $${ip}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        if (lv <= 2) {
          const a = r.int(2, 8);
          const b = a + r.int(1, 3);
          const cnt = b * b - a * a - 1;
          return num({
            q: `$${a}<\\sqrt{n}<${b}$ を満たす自然数 $n$ は、全部で何個ありますか。`,
            ans: cnt,
            post: "個",
            wrongs: [[cnt + 1, "MC-COUNT-OFF"], [cnt + 2, "MC-COUNT-OFF"], [b * b - a * a, "MC-COUNT-OFF"]],
            explain: `各辺を2乗して $${a * a}<n<${b * b}$。$n$ は $${a * a + 1}$ から $${b * b - 1}$ までの自然数で、$${b * b - 1}-${a * a + 1}+1=${cnt}$ 個。（両端の $${a * a}$ と $${b * b}$ はふくみません）`,
          });
        }
        const k = r.pick([2, 3, 5, 6, 7]);
        const base = k * r.pick([1, 4, 9]);
        const ans = sqrtParts(base).b;
        return num({
          q: `$\\sqrt{${base}n}$ が自然数になる、最小の自然数 $n$ を求めなさい。`,
          ans,
          wrongs: [[base, "MC-PRIME-SQUARE"], [sqrtParts(base).a, "MC-PRIME-SQUARE"], [ans * 2, "MC-PRIME-SQUARE"]],
          explain: `$${base}n$ が自然数の2乗になればよい。$${base}=${primesOf(base).map(([p, e]) => (e === 1 ? p : `${p}^{${e}}`)).join("\\times ")}$ で、指数が奇数の素数を補うので $n=${ans}$。`,
        });
      },
      { id: "c", db: 0.2 },
    ),
  ],

  // ── 根号を含む式の乗除・変形 ───────────────────
  sqrt_simplify: [
    t("fields", (r, lv) => {
      const bs = lv === 1 ? [2, 3, 5, 6, 7] : [2, 3, 5, 6, 7, 10, 11];
      const a = lv === 1 ? r.int(2, 5) : lv === 2 ? r.int(2, 9) : r.int(4, 14);
      const b = r.pick(bs);
      const n = a * a * b;
      const parts = sqrtParts(n);
      assert(parts.a === a && parts.b === b, "平方因子の検算");
      const wrongs = [{ values: { a: a * a, b }, mc: "MC-SQRT-OUT-NOT-ROOT" }];
      const f = primesOf(a).length ? primesOf(a)[0][0] : a;
      if (a !== f) wrongs.push({ values: { a: f, b: b * (a / f) * (a / f) }, mc: "MC-SQRT-PARTIAL" });
      else wrongs.push({ values: { a: 1, b: n }, mc: "MC-SQRT-PARTIAL" });
      wrongs.push({ values: { a: b, b: a * a }, mc: "MC-SQRT-SWAP" });
      return fields({
        q: `$\\sqrt{${n}}$ を $a\\sqrt{b}$ の形に直しなさい。（$b$ はできるだけ小さい自然数）`,
        layout: "sqrt",
        fields: [
          { id: "a", value: a },
          { id: "b", value: b },
        ],
        wrongs,
        explain: `根号の中を、平方数と他の数の積に分けます。$${n}=${a * a}\\times ${b}=${a}^2\\times ${b}$ なので、$\\sqrt{${n}}=\\sqrt{${a}^2\\times ${b}}=${a}\\sqrt{${b}}$。平方数の平方根は根号の外に出ます。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const isMul = lv <= 2 ? r.chance(0.6) : r.chance(0.5);
        if (isMul) {
          const [x, y] = until(() => [r.int(2, lv === 1 ? 7 : 15), r.int(2, lv === 1 ? 7 : 15)], ([p, q]) => p !== q && !(Math.sqrt(p * q) % 1 === 0));
          const { a, b } = sqrtParts(x * y);
          return fields({
            q: `$\\sqrt{${x}}\\times\\sqrt{${y}}$ を計算して、$a\\sqrt{b}$ の形にしなさい。（$a=1$ のときは $1$ と答えます）`,
            layout: "sqrt",
            fields: [
              { id: "a", value: a },
              { id: "b", value: b },
            ],
            wrongs: [{ values: { a: 1, b: x * y }, mc: "MC-SQRT-PARTIAL" }, { values: { a: x, b: y }, mc: "MC-SQRT-MUL-COEF" }, { values: { a: 1, b: x + y }, mc: "MC-SQRT-ADD-INSIDE" }].filter((w) => !(w.values.a === a && w.values.b === b)),
            explain: `$\\sqrt{a}\\times\\sqrt{b}=\\sqrt{ab}$ なので、$\\sqrt{${x}}\\times\\sqrt{${y}}=\\sqrt{${x * y}}$。${a > 1 ? `根号の中を平方数で整理して $${a}\\sqrt{${b}}$。` : `$${x * y}$ は平方数を因数にもたないので、これで完成。`}`,
          });
        }
        // √(y·w²·z) ÷ √y = w√z
        const y = r.pick([2, 3, 5, 6, 7]);
        const w = r.int(1, 3);
        const z = until(() => r.pick([2, 3, 5, 6, 7, 10]), (v) => v !== y);
        const x = y * w * w * z;
        return fields({
          q: `$\\sqrt{${x}}\\div\\sqrt{${y}}$ を計算して、$a\\sqrt{b}$ の形にしなさい。`,
          layout: "sqrt",
          fields: [
            { id: "a", value: w },
            { id: "b", value: z },
          ],
          wrongs: [{ values: { a: 1, b: x / y }, mc: "MC-SQRT-PARTIAL" }, { values: { a: w * w, b: z }, mc: "MC-SQRT-OUT-NOT-ROOT" }, { values: { a: 1, b: x - y }, mc: "MC-SQRT-ADD-INSIDE" }].filter((q) => !(q.values.a === w && q.values.b === z)),
          explain: `$\\sqrt{a}\\div\\sqrt{b}=\\sqrt{a\\div b}$ なので、$\\sqrt{${x}}\\div\\sqrt{${y}}=\\sqrt{${x / y}}$。${w > 1 ? `根号の中を平方数で整理して $${w}\\sqrt{${z}}$。` : `これ以上簡単にできないので $\\sqrt{${z}}$。`}`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 平方根の加減・分母の有理化 ───────────────────
  sqrt_addsub: [
    t("fields", (r, lv) => {
      const b = r.pick([2, 3, 5, 6, 7]);
      if (lv === 1) {
        const [p, q] = until(() => [r.nz(-6, 9), r.nz(-6, 9)], ([x, y]) => x + y !== 0 && Math.abs(x) > 0);
        const ans = p + q;
        return fields({
          q: `$${p === 1 ? "" : p === -1 ? "-" : p}\\sqrt{${b}}${q < 0 ? "-" : "+"}${Math.abs(q) === 1 ? "" : Math.abs(q)}\\sqrt{${b}}$ を計算して、$a\\sqrt{b}$ の形にしなさい。`,
          layout: "sqrt",
          fields: [
            { id: "a", value: ans },
            { id: "b", value: b },
          ],
          wrongs: [{ values: { a: p + q, b: 2 * b }, mc: "MC-SQRT-ADD-INSIDE" }, { values: { a: 1, b: b * (p + q) }, mc: "MC-SQRT-ADD-INSIDE" }, { values: { a: p * q, b }, mc: "MC-SQRT-MUL-COEF" }],
          explain: `$\\sqrt{${b}}$ の部分が同じなので、係数どうしを計算します（$3x+2x=5x$ と同じ）。$(${p})+(${q})=${ans}$ より、$${ans}\\sqrt{${b}}$。`,
        });
      }
      const [k1, k2] = until(() => [r.int(2, 5), r.int(2, 5)], ([x, y]) => x !== y);
      const sub_ = lv === 3 && r.chance(0.5);
      const n1 = k1 * k1 * b;
      const n2 = k2 * k2 * b;
      const ans = sub_ ? k1 - k2 : k1 + k2;
      return fields({
        q: `$\\sqrt{${n1}}${sub_ ? "-" : "+"}\\sqrt{${n2}}$ を計算して、$a\\sqrt{b}$ の形にしなさい。`,
        layout: "sqrt",
        fields: [
          { id: "a", value: ans },
          { id: "b", value: b },
        ],
        wrongs: [{ values: { a: 1, b: sub_ ? Math.abs(n1 - n2) : n1 + n2 }, mc: "MC-SQRT-ADD-INSIDE" }, { values: { a: k1 * k1 + (sub_ ? -1 : 1) * k2 * k2, b }, mc: "MC-SQRT-OUT-NOT-ROOT" }],
        explain: `それぞれ簡単にします。$\\sqrt{${n1}}=${k1}\\sqrt{${b}}$、$\\sqrt{${n2}}=${k2}\\sqrt{${b}}$。根号の中がそろったので、$${k1}\\sqrt{${b}}${sub_ ? "-" : "+"}${k2}\\sqrt{${b}}=${ans}\\sqrt{${b}}$。根号の中どうしをたしてはいけません。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 分母の有理化：k/(m√n) = k√n/(m n)
        const n = r.pick([2, 3, 5, 6, 7]);
        const m = lv === 1 ? 1 : r.int(1, 3);
        const k = r.pick(lv === 1 ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 9]);
        const den = m * n;
        const g = gcd(k, den);
        const a = k / g;
        const c = den / g;
        const denTex = m === 1 ? `\\sqrt{${n}}` : `${m}\\sqrt{${n}}`;
        return fields({
          q: `$\\dfrac{${k}}{${denTex}}$ の分母を有理化して、$\\dfrac{a\\sqrt{b}}{c}$ の形にしなさい。（約分できるときは約分し、分母が $1$ のときは $c=1$ と答えます）`,
          layout: "sqrtfrac",
          fields: [
            { id: "a", value: a },
            { id: "b", value: n },
            { id: "c", value: c },
          ],
          wrongs: [{ values: { a: k, b: n, c: m }, mc: "MC-SQRT-RATIONALIZE" }, { values: { a: k, b: n, c: den * n }, mc: "MC-SQRT-RATIONALIZE" }],
          explain: `分母と分子に $\\sqrt{${n}}$ をかけます。$\\dfrac{${k}}{${denTex}}=\\dfrac{${k}\\times\\sqrt{${n}}}{${denTex}\\times\\sqrt{${n}}}=\\dfrac{${k}\\sqrt{${n}}}{${den}}$。${g > 1 ? `約分して $\\dfrac{${a === 1 ? "" : a}\\sqrt{${n}}}{${c}}$。` : ""}`,
        });
      },
      { id: "b", db: 0.3 },
    ),
  ],

  // ── 比例式 ─────────────────────────────────────
  ratio_eq: [
    t("num", (r, lv) => {
      const [p, q] = until(() => [r.int(1, 9), r.int(2, 9)], ([x, y]) => x !== y && gcd(x, y) === 1);
      const k = r.int(2, lv === 1 ? 6 : 9);
      const [a, b] = [p * k, q * k];
      if (lv === 1 || lv === 2) {
        // x を 4 か所のどこかに置く
        const pos = r.int(0, 3);
        const terms = [p, q, a, b]; // p:q = a:b
        const ans = terms[pos];
        const shown = terms.map((x, i) => (i === pos ? "x" : String(x)));
        return num({
          q: `比例式 $${shown[0]}:${shown[1]}=${shown[2]}:${shown[3]}$ を満たす $x$ の値を求めなさい。`,
          ans,
          wrongs: [[Q(p * q, ans) && Q(terms[(pos + 1) % 4] * terms[(pos + 2) % 4], terms[(pos + 3) % 4]), "MC-RATIO-EQ-INVERT"], [terms[pos] + (k - 1), "MC-RATIO-ADD-SAME"], [ans + 1, "MC-SLIP"]],
          explain: `比例式では「内項の積 ＝ 外項の積」です。$${shown[0]}\\times ${shown[3]}=${shown[1]}\\times ${shown[2]}$ より、$x=${ans}$。`,
        });
      }
      const c = r.int(1, 5);
      const x = r.int(2, 9);
      const lhs = x + c;
      const [pp, qq] = [lhs, r.int(2, 9)];
      const kk = r.int(2, 4);
      return num({
        q: `比例式 $(x+${c}):${qq}=${lhs * kk}:${qq * kk}$ を満たす $x$ の値を求めなさい。`,
        ans: x,
        wrongs: [[lhs, "MC-RATIO-EQ-PAREN"], [lhs * kk, "MC-RATIO-EQ-PAREN"], [x + c, "MC-RATIO-EQ-PAREN"]],
        explain: `外項の比 $${lhs * kk}:${qq * kk}$ を簡単にすると $${lhs}:${qq}$。$(x+${c}):${qq}=${lhs}:${qq}$ なので $x+${c}=${lhs}$。$x=${lhs}-${c}=${x}$。`,
      });
    }),
  ],
};
