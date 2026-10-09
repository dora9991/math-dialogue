// ============================================================
// tpl/hs_num.js — 高校 数と計算（数I・数II）
//   real_calc_hs / exp_law / complex_calc / log_calc
//
//  すべて自作の数値・言い回し。答えは別の方法（浮動小数の計算）でも確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, num as qnum, pow as qpow } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, gcd } from "./util.js";
import { nearly, isqrt } from "./hs_util.js";

const $ = (s) => `$${s}$`;

/** 単項式（変数→指数）の TeX */
function monoTex(exps) {
  const parts = [];
  for (const [v, e] of Object.entries(exps)) {
    const q = typeof e === "number" ? Q(e) : e;
    if (q.n === 0) continue;
    parts.push(q.n === 1 && q.d === 1 ? v : `${v}^{${tq(q)}}`);
  }
  return parts.length ? parts.join("") : "1";
}

/** 複素数 re + im i の TeX */
function cTex(re, im) {
  re = typeof re === "number" ? Q(re) : re;
  im = typeof im === "number" ? Q(im) : im;
  const imPart = (q, first) => {
    const a = q.n < 0 ? neg(q) : q;
    const co = a.n === 1 && a.d === 1 ? "" : tq(a);
    return `${q.n < 0 ? "-" : first ? "" : "+"}${co}i`;
  };
  if (im.n === 0) return tq(re);
  if (re.n === 0) return imPart(im, true);
  return `${tq(re)}${imPart(im, false)}`;
}
const cmul = (z, w) => [sub(mul(z[0], w[0]), mul(z[1], w[1])), add(mul(z[0], w[1]), mul(z[1], w[0]))];
function cdiv(z, w) {
  const d = add(mul(w[0], w[0]), mul(w[1], w[1]));
  const n = cmul(z, [w[0], neg(w[1])]);
  return [div(n[0], d), div(n[1], d)];
}
const iPow = (n) => [[Q(1), Q(0)], [Q(0), Q(1)], [Q(-1), Q(0)], [Q(0), Q(-1)]][((n % 4) + 4) % 4];

export default {
  // ── 分母が2項の有理化・二重根号 ─────────────────
  real_calc_hs: [
    t("fields", (r, lv) => {
      const pool = [2, 3, 5, 6, 7, 10];
      if (lv <= 2) {
        // k / (√m ± √n) = k(√m ∓ √n)/(m−n)
        const [m, n] = until(() => [r.pick(pool), r.pick(pool)], ([u, v]) => u > v && (lv === 1 ? u - v <= 3 : true));
        const s = r.chance(0.5) ? 1 : -1; // 分母の符号
        const k = lv === 1 ? 1 : r.pick([1, 2, 3, 4, 6]);
        const dd = m - n;
        const p = Q(k, dd);
        const q = Q(-s * k, dd);
        nearly(k / (Math.sqrt(m) + s * Math.sqrt(n)), qnum(p) * Math.sqrt(m) + qnum(q) * Math.sqrt(n), "有理化の検算");
        const den = `\\sqrt{${m}}${s > 0 ? "+" : "-"}\\sqrt{${n}}`;
        return fields({
          q: `$\\dfrac{${k}}{${den}}$ の分母を有理化して、$p\\sqrt{${m}}+q\\sqrt{${n}}$ の形に表します。$p$、$q$ の値を答えなさい。`,
          fields: [
            { id: "p", value: p, pre: "$p=$" },
            { id: "q", value: q, pre: "$q=$" },
          ],
          wrongs: [
            { values: { p: Q(k, m + n), q: Q(-s * k, m + n) }, mc: "MC-RATIONALIZE-DENOM" },
            { values: { p: Q(k), q: Q(-s * k) }, mc: "MC-RATIONALIZE-DENOM" },
            { values: { p: Q(k, dd), q: Q(s * k, dd) }, mc: "MC-RATIONALIZE-CONJ" },
          ],
          explain: `分母の $${den}$ と、符号だけがちがう $\\sqrt{${m}}${s > 0 ? "-" : "+"}\\sqrt{${n}}$ を、分母と分子にかけます。分母は $(a+b)(a-b)=a^2-b^2$ より $(\\sqrt{${m}})^2-(\\sqrt{${n}})^2=${dd}$。分子は $${k}(\\sqrt{${m}}${s > 0 ? "-" : "+"}\\sqrt{${n}})$。よって $p=${tq(p)}$、$q=${tq(q)}$。`,
        });
      }
      // (√m + s√n)/(√m − s√n) = (m + n + 2s√(mn)) / (m − n)
      const [m, n] = until(() => [r.pick([2, 3, 5, 7]), r.pick([2, 3, 5, 7])], ([u, v]) => u > v);
      const s = r.chance(0.5) ? 1 : -1;
      const dd = m - n;
      const a0 = Q(m + n, dd);
      const b0 = Q(2 * s, dd);
      nearly((Math.sqrt(m) + s * Math.sqrt(n)) / (Math.sqrt(m) - s * Math.sqrt(n)), qnum(a0) + qnum(b0) * Math.sqrt(m * n), "有理化(3)の検算");
      const top = `\\sqrt{${m}}${s > 0 ? "+" : "-"}\\sqrt{${n}}`;
      const bot = `\\sqrt{${m}}${s > 0 ? "-" : "+"}\\sqrt{${n}}`;
      return fields({
        q: `$\\dfrac{${top}}{${bot}}$ を有理化して、$p+q\\sqrt{${m * n}}$ の形に表します。$p$、$q$ の値を答えなさい。`,
        fields: [
          { id: "p", value: a0, pre: "$p=$" },
          { id: "q", value: b0, pre: "$q=$" },
        ],
        wrongs: [
          { values: { p: Q(m + n, m + n), q: Q(2 * s, m + n) }, mc: "MC-RATIONALIZE-DENOM" },
          { values: { p: Q(m + n, dd), q: Q(s, dd) }, mc: "MC-SQUARE-CROSS-TERM" },
          { values: { p: Q(m - n, dd), q: Q(2 * s, dd) }, mc: "MC-SQUARE-CROSS-TERM" },
        ],
        explain: `分母と分子に、分母と符号だけがちがう $${top}$ をかけます。分母は $(\\sqrt{${m}})^2-(\\sqrt{${n}})^2=${dd}$。分子は $(${top})^2=${m}+${n}${s > 0 ? "+" : "-"}2\\sqrt{${m * n}}$（真ん中の項は $2\\sqrt{${m}}\\sqrt{${n}}=2\\sqrt{${m * n}}$）。よって $\\dfrac{${m + n}${s > 0 ? "+" : "-"}2\\sqrt{${m * n}}}{${dd}}$ で、$p=${tq(a0)}$、$q=${tq(b0)}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        if (lv <= 2) {
          // 二重根号：√(a+b ± 2√(ab)) = √a ± √b
          const [a, b] = until(() => [r.int(2, 9), r.int(1, 8)], ([u, v]) => u > v && isqrt(u * v) === null);
          const plus = lv === 1 ? true : r.chance(0.5);
          const m = a + b;
          const nn = a * b;
          nearly(Math.sqrt(m + (plus ? 1 : -1) * 2 * Math.sqrt(nn)), Math.sqrt(a) + (plus ? 1 : -1) * Math.sqrt(b), "二重根号の検算");
          return fields({
            q: `$\\sqrt{${m}${plus ? "+" : "-"}2\\sqrt{${nn}}}=\\sqrt{a}${plus ? "+" : "-"}\\sqrt{b}$ となる正の整数 $a$, $b$（$a>b$）を求めなさい。`,
            fields: [
              { id: "a", value: a, pre: "$a=$" },
              { id: "b", value: b, pre: "$b=$" },
            ],
            wrongs: [{ values: { a: b, b: a }, mc: "MC-DOUBLE-RADICAL-SWAP" }, { values: { a: m, b: 1 }, mc: "MC-DOUBLE-RADICAL-PAIR" }],
            explain: `和が $${m}$、積が $${nn}$ になる2数を探します。$${a}+${b}=${m}$、$${a}\\times ${b}=${nn}$。よって $${m}${plus ? "+" : "-"}2\\sqrt{${nn}}=(\\sqrt{${a}}${plus ? "+" : "-"}\\sqrt{${b}})^2$ で、$\\sqrt{${m}${plus ? "+" : "-"}2\\sqrt{${nn}}}=\\sqrt{${a}}${plus ? "+" : "-"}\\sqrt{${b}}$（$a>b$ なので正の値）。`,
          });
        }
        // √(m + k√n) = a + b√n の形（(a+b√n)² = a²+b²n + 2ab√n）。(a, b) が一意に決まるものだけ
        const cand = [];
        for (const n of [2, 3, 5, 6, 7]) {
          for (let a = 1; a <= 5; a++) {
            for (let b = 1; b <= 4; b++) {
              const m = a * a + b * b * n;
              const kk = 2 * a * b;
              let cnt = 0;
              for (let a2 = 1; a2 <= 12; a2++) for (let b2 = 1; b2 <= 12; b2++) if (a2 * a2 + b2 * b2 * n === m && 2 * a2 * b2 === kk) cnt++;
              if (cnt === 1) cand.push({ n, a, b, m, kk });
            }
          }
        }
        const c = r.pick(cand);
        nearly(Math.sqrt(c.m + c.kk * Math.sqrt(c.n)), c.a + c.b * Math.sqrt(c.n), "二重根号(3)の検算");
        return fields({
          q: `$\\sqrt{${c.m}+${c.kk}\\sqrt{${c.n}}}=a+b\\sqrt{${c.n}}$ となる正の整数 $a$, $b$ を求めなさい。`,
          fields: [
            { id: "a", value: c.a, pre: "$a=$" },
            { id: "b", value: c.b, pre: "$b=$" },
          ],
          wrongs: [{ values: { a: c.b, b: c.a }, mc: "MC-DOUBLE-RADICAL-SWAP" }, { values: { a: c.a, b: c.b + 1 }, mc: "MC-SLIP" }],
          explain: `$(a+b\\sqrt{${c.n}})^2=a^2+${c.n}b^2+2ab\\sqrt{${c.n}}$ なので、$a^2+${c.n}b^2=${c.m}$ かつ $2ab=${c.kk}$ となる正の整数を探します。$a=${c.a}$、$b=${c.b}$ のとき $${c.a * c.a}+${c.n}\\times ${c.b * c.b}=${c.m}$、$2\\times ${c.a}\\times ${c.b}=${c.kk}$ で成り立ちます。`,
        });
      },
      { id: "b", db: 0.5 },
    ),
  ],

  // ── 指数法則（整数・有理数の指数） ───────────────
  exp_law: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // 整数の指数：a^m × a^n ／ a^m ÷ a^n ／ (a^m)^n
        const base = r.pick([2, 3, 5, 10]);
        const kind = r.pick(["mul", "div", "pow"]);
        const [m, n] = until(
          () => (kind === "pow" ? [r.int(-3, 3), r.pick([-3, -2, -1, 2, 3])] : [r.int(-3, 5), r.int(-3, 5)]),
          ([u, v]) => {
            const e = kind === "mul" ? u + v : kind === "div" ? u - v : u * v;
            return Math.abs(e) <= 5 && u !== 0 && v !== 0 && u !== 1 && v !== 1;
          },
        );
        const e = kind === "mul" ? m + n : kind === "div" ? m - n : m * n;
        const ex = kind === "mul" ? `${base}^{${m}}\\times ${base}^{${n}}` : kind === "div" ? `${base}^{${m}}\\div ${base}^{${n}}` : `(${base}^{${m}})^{${n}}`;
        nearly(kind === "mul" ? Math.pow(base, m) * Math.pow(base, n) : kind === "div" ? Math.pow(base, m) / Math.pow(base, n) : Math.pow(Math.pow(base, m), n), qnum(qpow(Q(base), e)), "指数法則の検算");
        const wrongE = kind === "mul" ? [[m * n, "MC-EXP-MULT-ADD"], [m - n, "MC-EXP-MULT-ADD"], [-e, "MC-EXP-NEG-SIGN"]] : kind === "div" ? [[m + n, "MC-EXP-DIV-SUB"], [n - m, "MC-EXP-DIV-SUB"], [m * n, "MC-EXP-DIV-SUB"]] : [[m + n, "MC-EXP-POW-ADD"], [-e, "MC-EXP-NEG-SIGN"], [e + 1, "MC-SLIP"]];
        return num({
          q: `次の値を求めなさい。\n$${ex}$`,
          ans: qpow(Q(base), e),
          wrongs: wrongE.filter(([k]) => Math.abs(k) <= 8).map(([k, mc]) => [qpow(Q(base), k), mc]),
          explain: `指数法則を使います。${kind === "mul" ? `$a^m\\times a^n=a^{m+n}$ より $${base}^{${m}+(${n})}=${base}^{${e}}$` : kind === "div" ? `$a^m\\div a^n=a^{m-n}$ より $${base}^{${m}-(${n})}=${base}^{${e}}$` : `$(a^m)^n=a^{mn}$ より $${base}^{${m}\\times(${n})}=${base}^{${e}}$`}。${e < 0 ? `$a^{-k}=\\dfrac{1}{a^k}$ なので ` : ""}答えは $${tq(qpow(Q(base), e))}$。`,
        });
      }
      if (lv === 2) {
        // 有理数の指数：(b^k)^{j/k} = b^j。底は b^k または 1/b^k
        const b = r.pick([2, 3, 5]);
        const k = b === 2 ? r.pick([2, 3, 4]) : b === 3 ? r.pick([2, 3]) : 2;
        const [j] = until(() => [r.pick([1, 2, 3, -1, -2, -3])], ([x]) => gcd(Math.abs(x), k) === 1);
        const inv = r.chance(0.3);
        const baseVal = Math.pow(b, k);
        const baseTex = inv ? `\\left(\\dfrac{1}{${baseVal}}\\right)` : `${baseVal}`;
        const ansE = inv ? -j : j;
        nearly(Math.pow(inv ? 1 / baseVal : baseVal, j / k), qnum(qpow(Q(b), ansE)), "有理数指数の検算");
        const wr = [
          [qpow(Q(b), -ansE), "MC-EXP-NEG-RECIP"],
          [qpow(Q(baseVal), j * (inv ? -1 : 1)), "MC-EXP-FRAC-ROOT"],
          [Q(baseVal * Math.abs(j), k), "MC-EXP-FRAC-ROOT"],
          [qpow(Q(b), ansE * k), "MC-EXP-FRAC-ROOT"],
        ];
        return num({
          q: `次の値を求めなさい。\n$${baseTex}^{${tq(Q(j, k))}}$`,
          ans: qpow(Q(b), ansE),
          wrongs: wr.filter(([v]) => Math.abs(qnum(v)) < 1e5 && Math.abs(qnum(v)) > 1e-4),
          explain: `$a^{\\frac{m}{n}}=\\sqrt[n]{a^m}$（$n$ 乗根をとってから $m$ 乗する）。$${baseVal}=${b}^{${k}}$ なので、${inv ? `$\\dfrac{1}{${baseVal}}=${b}^{-${k}}$ より ` : ""}$(${b}^{${inv ? -k : k}})^{${tq(Q(j, k))}}=${b}^{${ansE}}$。答えは $${tq(qpow(Q(b), ansE))}$。`,
        });
      }
      // 3つの因数：(b^k)^{j/d} を ×，÷ でつなぐ。各因数が b の整数べきになるもの（d は k の約数）だけ
      const b = r.pick([2, 3]);
      const { facs, total } = until(
        () => {
          const facs = [];
          let total = 0;
          for (let i = 0; i < 3; i++) {
            const k = b === 2 ? r.pick([1, 2, 3, 4]) : r.pick([1, 2, 3]);
            const d = r.pick([1, 2, 3, 4].filter((x) => k % x === 0));
            const j = r.pick([1, 2, 3, -1, -2]);
            const op = i === 0 ? 1 : r.chance(0.5) ? 1 : -1;
            const inner = (k * j) / d;
            facs.push({ k, j, d, op, inner });
            total += op * inner;
          }
          return { facs, total };
        },
        ({ facs, total }) => Math.abs(total) <= 6 && facs.every((f) => gcd(Math.abs(f.j), f.d) === 1),
      );
      const ex = facs.map((f, i) => `${i === 0 ? "" : f.op > 0 ? "\\times " : "\\div "}${Math.pow(b, f.k)}^{${tq(Q(f.j, f.d))}}`).join("");
      const numeric = facs.reduce((acc, f) => (f.op > 0 ? acc * Math.pow(Math.pow(b, f.k), f.j / f.d) : acc / Math.pow(Math.pow(b, f.k), f.j / f.d)), 1);
      nearly(numeric, qnum(qpow(Q(b), total)), "指数法則(3)の検算");
      const last = facs[2];
      const wr = [
        [total + 1, "MC-SLIP"],
        [total - 1, "MC-SLIP"],
        [-total, "MC-EXP-NEG-SIGN"],
        [total + 2 * last.op * last.inner, "MC-EXP-DIV-SUB"],
        [total - 2 * facs[0].inner, "MC-EXP-NEG-SIGN"],
      ];
      return num({
        q: `次の値を求めなさい。\n$${ex}$`,
        ans: qpow(Q(b), total),
        wrongs: wr.filter(([k]) => Math.abs(k) <= 8).map(([k, mc]) => [qpow(Q(b), k), mc]),
        explain: `それぞれを $${b}$ のべきで表します。${facs.map((f) => `$${Math.pow(b, f.k)}^{${tq(Q(f.j, f.d))}}=(${b}^{${f.k}})^{${tq(Q(f.j, f.d))}}=${b}^{${f.inner}}$`).join("、")}。かけ算は指数のたし算、わり算は指数のひき算なので、指数は $${facs.map((f, i) => `${i === 0 ? "" : f.op > 0 ? "+" : "-"}(${f.inner})`).join("")}=${total}$。答えは $${b}^{${total}}=${tq(qpow(Q(b), total))}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 文字式の指数計算
        if (lv === 1) {
          const kind = r.pick(["A", "B"]);
          const [m, n, k] = until(() => [r.int(-3, 5), r.int(-3, 5), r.int(-3, 5)], ([u, v, w]) => u !== 0 && v !== 0 && w !== 0 && u !== 1 && v !== 1 && Math.abs(kind === "A" ? u + v - w : u * v + w) <= 8);
          const e = kind === "A" ? m + n - k : m * n + k;
          const ex = kind === "A" ? `a^{${m}}\\times a^{${n}}\\div a^{${k}}` : `(a^{${m}})^{${n}}\\times a^{${k}}`;
          const cand = kind === "A" ? [[m * n - k, "MC-EXP-MULT-ADD"], [m + n + k, "MC-EXP-DIV-SUB"], [m - n - k, "MC-EXP-MULT-ADD"], [-e, "MC-EXP-NEG-SIGN"], [e + 1, "MC-SLIP"], [e - 1, "MC-SLIP"]] : [[m + n + k, "MC-EXP-POW-ADD"], [m * n - k, "MC-EXP-DIV-SUB"], [m * n * k, "MC-EXP-MULT-ADD"], [-e, "MC-EXP-NEG-SIGN"], [e - 1, "MC-SLIP"], [e + 1, "MC-SLIP"]];
          return choice({
            q: `次の式を簡単にしなさい。\n$${ex}$`,
            correct: $(monoTex({ a: e })),
            wrongs: cand.map(([x, mc]) => [$(monoTex({ a: x })), mc]),
            explain: `${kind === "A" ? `かけ算は指数をたし、わり算は指数をひきます。$${m}+(${n})-(${k})=${e}$` : `$(a^m)^n=a^{mn}$ なので $(a^{${m}})^{${n}}=a^{${m * n}}$。あとは指数をたして $${m * n}+(${k})=${e}$`}。答えは $${monoTex({ a: e })}$。`,
          });
        }
        if (lv === 2) {
          const div_ = r.chance(0.4);
          const [p, q, rr, s, tt] = until(
            () => [r.int(-2, 3), r.int(-2, 3), r.pick([2, 3, -1, -2]), r.int(-3, 4), r.int(-3, 4)],
            ([a, b, c, d, e]) => a !== 0 && b !== 0 && d !== 0 && e !== 0 && Math.abs(a * c + (div_ ? -d : d)) <= 9 && Math.abs(b * c + (div_ ? -e : e)) <= 9,
          );
          const ea = p * rr + (div_ ? -s : s);
          const eb = q * rr + (div_ ? -tt : tt);
          const ex = `(a^{${p}}b^{${q}})^{${rr}}${div_ ? "\\div" : "\\times"}\\left(a^{${s}}b^{${tt}}\\right)`;
          const cand = [
            [{ a: p + rr + (div_ ? -s : s), b: q + rr + (div_ ? -tt : tt) }, "MC-EXP-POW-ADD"],
            [{ a: ea, b: q + rr + (div_ ? -tt : tt) }, "MC-EXP-POW-ADD"],
            [{ a: p * rr + (div_ ? s : -s), b: q * rr + (div_ ? tt : -tt) }, "MC-EXP-DIV-SUB"],
            [{ a: p * rr, b: q * rr }, "MC-EXP-MULT-ADD"],
            [{ a: eb, b: ea }, "MC-SLIP"],
            [{ a: ea + 1, b: eb }, "MC-SLIP"],
            [{ a: ea, b: eb - 1 }, "MC-SLIP"],
          ];
          return choice({
            q: `次の式を簡単にしなさい。\n$${ex}$`,
            correct: $(monoTex({ a: ea, b: eb })),
            wrongs: cand.map(([x, mc]) => [$(monoTex(x)), mc]),
            explain: `まずかっこの累乗を、文字ごとに指数をかけて外します（$(a^p b^q)^r=a^{pr}b^{qr}$）：$a^{${p * rr}}b^{${q * rr}}$。次に文字ごとに、${div_ ? "わり算は指数をひきます" : "かけ算は指数をたします"}。$a$：$${p * rr}${div_ ? "-" : "+"}(${s})=${ea}$、$b$：$${q * rr}${div_ ? "-" : "+"}(${tt})=${eb}$。答えは $${monoTex({ a: ea, b: eb })}$。`,
          });
        }
        // 有理数の指数：根号や a^{j/d} を ×，÷ でつなぐ
        const { facs, E } = until(
          () => {
            const n = r.pick([2, 3]);
            const facs = [];
            let E = Q(0);
            for (let i = 0; i < n; i++) {
              const d = r.pick([2, 3, 4, 6]);
              const j = r.pick([1, 2, 3, -1, -2, -3, 5]);
              const op = i === 0 ? 1 : r.chance(0.5) ? 1 : -1;
              facs.push({ j, d, op });
              E = add(E, mul(Q(op), Q(j, d)));
            }
            return { facs, E };
          },
          ({ facs, E }) => facs.every((f) => gcd(Math.abs(f.j), f.d) === 1) && E.n !== 0 && E.d !== 1 && Math.abs(qnum(E)) <= 4,
        );
        const fTex = (f) => {
          if (f.j > 0 && f.d >= 2) {
            if (f.j === 1) return f.d === 2 ? "\\sqrt{a}" : `\\sqrt[${f.d}]{a}`;
            return f.d === 2 ? `\\sqrt{a^{${f.j}}}` : `\\sqrt[${f.d}]{a^{${f.j}}}`;
          }
          return `a^{${tq(Q(f.j, f.d))}}`;
        };
        const ex = facs.map((f, i) => `${i === 0 ? "" : f.op > 0 ? "\\times " : "\\div "}${fTex(f)}`).join("");
        const numeric = facs.reduce((acc, f) => (f.op > 0 ? acc * Math.pow(1.7, f.j / f.d) : acc / Math.pow(1.7, f.j / f.d)), 1);
        nearly(numeric, Math.pow(1.7, qnum(E)), "指数法則(文字)の検算");
        // よくある誤り：分子どうし・分母どうしをそれぞれたす／÷を×として計算
        const sumN = facs.reduce((acc, f) => acc + f.op * f.j, 0);
        const sumD = facs.reduce((acc, f) => acc + f.d, 0);
        const allMul = facs.reduce((acc, f) => add(acc, Q(f.j, f.d)), Q(0));
        const cand = [
          [Q(sumN, sumD), "MC-EXP-FRAC-ADD"],
          [allMul, "MC-EXP-DIV-SUB"],
          [neg(E), "MC-EXP-NEG-SIGN"],
          [facs.reduce((acc, f) => mul(acc, Q(f.j, f.d)), Q(1)), "MC-EXP-MULT-ADD"],
          [add(E, Q(1, 6)), "MC-SLIP"],
          [add(E, Q(1)), "MC-SLIP"],
          [sub(E, Q(1)), "MC-SLIP"],
          [mul(E, Q(2)), "MC-SLIP"],
        ];
        return choice({
          q: `$a>0$ とします。次の式を $a$ の累乗の形に簡単にしなさい。\n$${ex}$`,
          correct: $(monoTex({ a: E })),
          wrongs: cand.filter(([x]) => x.n !== 0 && !(x.n === E.n && x.d === E.d)).map(([x, mc]) => [$(monoTex({ a: x })), mc]),
          explain: `根号は $\\sqrt[n]{a^m}=a^{\\frac{m}{n}}$ で指数に直します。${facs.map((f) => `$${fTex(f)}=a^{${tq(Q(f.j, f.d))}}$`).join("、")}。かけ算は指数をたし、わり算は指数をひくので、指数は $${facs.map((f, i) => `${i === 0 ? "" : f.op > 0 ? "+" : "-"}\\left(${tq(Q(f.j, f.d))}\\right)`).join("")}=${tq(E)}$（通分して計算）。答えは $${monoTex({ a: E })}$。`,
        });
      },
      { id: "b", db: 0.1 },
    ),
  ],

  // ── 複素数の計算 ───────────────────────────────
  complex_calc: [
    t("fields", (r, lv) => {
      let z;
      let ex;
      let expl;
      let wrongs;
      if (lv === 1 && r.chance(0.5)) {
        // i の累乗
        const n = r.int(5, 42);
        z = iPow(n);
        ex = `i^{${n}}`;
        const cyc = [0, 1, 2, 3].map((k) => iPow(k));
        expl = `$i^2=-1$、$i^3=-i$、$i^4=1$ で、$4$ つごとにくり返します。$${n}=4\\times ${Math.floor(n / 4)}+${n % 4}$ なので $i^{${n}}=i^{${n % 4}}=${cTex(z[0], z[1])}$。`;
        wrongs = cyc.filter((c) => !(c[0].n === z[0].n && c[1].n === z[1].n)).map((c) => ({ values: { re: c[0], im: c[1] }, mc: "MC-COMPLEX-CYCLE" }));
      } else if (lv === 1) {
        const [a, b, c, d] = [r.int(-6, 7), r.nz(-6, 7), r.int(-6, 7), r.nz(-6, 7)];
        const minus = r.chance(0.5);
        z = minus ? [Q(a - c), Q(b - d)] : [Q(a + c), Q(b + d)];
        ex = `(${cTex(a, b)})${minus ? "-" : "+"}(${cTex(c, d)})`;
        expl = `実部どうし、虚部どうしを計算します。実部は $${a}${minus ? "-" : "+"}(${c})=${qnum(z[0])}$、虚部は $${b}${minus ? "-" : "+"}(${d})=${qnum(z[1])}$。答えは $${cTex(z[0], z[1])}$。`;
        wrongs = [{ values: { re: Q(a - c), im: Q(b + d) }, mc: "MC-COMPLEX-SUB-SIGN" }, { values: { re: Q(a + c), im: Q(b - d) }, mc: "MC-COMPLEX-SUB-SIGN" }, { values: { re: Q(a + b + c + d), im: Q(0) }, mc: "MC-COMPLEX-MIX" }];
      } else if (lv === 2) {
        const [a, b, c, d] = [r.nz(-4, 5), r.nz(-4, 5), r.nz(-4, 5), r.nz(-4, 5)];
        const sq = r.chance(0.4);
        const w = sq ? [Q(a), Q(b)] : [Q(c), Q(d)];
        z = cmul([Q(a), Q(b)], w);
        ex = sq ? `(${cTex(a, b)})^2` : `(${cTex(a, b)})(${cTex(c, d)})`;
        const [c2, d2] = sq ? [a, b] : [c, d];
        const pn = (n) => (n < 0 ? `(${n})` : `${n}`);
        expl = `分配法則で展開し、$i^2=-1$ を使います。$(${cTex(a, b)})(${cTex(c2, d2)})$ の実部は $${pn(a)}\\times ${pn(c2)}+${pn(b)}\\times ${pn(d2)}\\times i^2=${a * c2}${-b * d2 >= 0 ? "+" : ""}${-b * d2}=${qnum(z[0])}$、虚部は $${pn(a)}\\times ${pn(d2)}+${pn(b)}\\times ${pn(c2)}=${qnum(z[1])}$。答えは $${cTex(z[0], z[1])}$。`;
        wrongs = [
          { values: { re: Q(a * c2 + b * d2), im: Q(a * d2 + b * c2) }, mc: "MC-COMPLEX-I2" },
          { values: { re: Q(a * c2 - b * d2), im: Q(a * d2 - b * c2) }, mc: "MC-SLIP" },
          { values: { re: Q(a * c2), im: Q(b * d2) }, mc: "MC-COMPLEX-MULT-PARTS" },
        ];
      } else {
        const [a, b, c, d] = until(() => [r.nz(-5, 6), r.nz(-5, 6), r.nz(-3, 4), r.nz(-3, 4)], ([, , x, y]) => x * x + y * y <= 13);
        z = cdiv([Q(a), Q(b)], [Q(c), Q(d)]);
        ex = `\\dfrac{${cTex(a, b)}}{${cTex(c, d)}}`;
        const dd = c * c + d * d;
        expl = `分母と共役な複素数 $${cTex(c, -d)}$ を、分母と分子にかけます。分母は $(${c})^2+(${d})^2=${dd}$。分子は $(${cTex(a, b)})(${cTex(c, -d)})=${cTex(a * c + b * d, b * c - a * d)}$。よって答えは $\\dfrac{${a * c + b * d}}{${dd}}$ を実部、$\\dfrac{${b * c - a * d}}{${dd}}$ を虚部とする数で、$${cTex(z[0], z[1])}$。`;
        wrongs = [
          { values: { re: Q(a, c), im: Q(b, d) }, mc: "MC-COMPLEX-DIV-NAIVE" },
          { values: { re: Q(a * c - b * d, dd), im: Q(a * d + b * c, dd) }, mc: "MC-COMPLEX-CONJ" },
          { values: { re: Q(a * c + b * d, dd), im: Q(a * d - b * c, dd) }, mc: "MC-COMPLEX-CONJ" },
        ];
      }
      return fields({
        q: `次の計算をして、$a+bi$ の形にしたときの実部 $a$ と虚部 $b$ を答えなさい。\n$${ex}$`,
        fields: [
          { id: "re", value: z[0], pre: "実部 $a=$" },
          { id: "im", value: z[1], pre: "虚部 $b=$" },
        ],
        wrongs,
        explain: expl,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          const [a, b] = [r.nz(-6, 6), r.nz(-6, 6)];
          return num({
            q: `$z=${cTex(a, b)}$ のとき、$z$ と共役な複素数 $\\bar z$ との積 $z\\bar z$ の値を求めなさい。`,
            ans: a * a + b * b,
            wrongs: [[a * a - b * b, "MC-COMPLEX-I2"], [(a + b) * (a + b), "MC-COMPLEX-MODULUS"], [a * a + b * b + 2 * a * b, "MC-COMPLEX-MODULUS"]],
            explain: `$\\bar z=${cTex(a, -b)}$。$(a+bi)(a-bi)=a^2-b^2i^2=a^2+b^2$ なので、$${a * a}+${b * b}=${a * a + b * b}$。`,
          });
        }
        if (lv === 2) {
          const [a, b] = r.pick([[3, 4], [4, 3], [5, 12], [12, 5], [6, 8], [8, 6], [8, 15], [15, 8], [7, 24], [20, 21]]);
          const sa = r.chance(0.5) ? a : -a;
          const sb = r.chance(0.5) ? b : -b;
          return num({
            q: `$z=${cTex(sa, sb)}$ の絶対値 $|z|$ を求めなさい。`,
            ans: Math.sqrt(a * a + b * b),
            wrongs: [[a * a + b * b, "MC-COMPLEX-MODULUS"], [a + b, "MC-COMPLEX-MODULUS"], [Math.abs(a - b), "MC-COMPLEX-MODULUS"]],
            explain: `$|a+bi|=\\sqrt{a^2+b^2}$（原点からの距離）。$\\sqrt{${a * a}+${b * b}}=\\sqrt{${a * a + b * b}}=${Math.sqrt(a * a + b * b)}$。`,
          });
        }
        // |z1 z2| = |z1||z2| ／ z + z̄, z z̄ から虚部
        if (r.chance(0.5)) {
          const [p1, p2] = until(() => [r.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]]), r.pick([[3, 4, 5], [5, 12, 13], [8, 6, 10], [15, 8, 17]])], ([u, v]) => u[2] !== v[2] || u[0] !== v[0]);
          const z1 = [Q(p1[0]), Q(p1[1])];
          const z2 = [Q(-p2[0]), Q(p2[1])];
          const prod = cmul(z1, z2);
          nearly(Math.hypot(qnum(prod[0]), qnum(prod[1])), p1[2] * p2[2], "|z1z2| の検算");
          return num({
            q: `$z_1=${cTex(p1[0], p1[1])}$、$z_2=${cTex(-p2[0], p2[1])}$ のとき、積 $z_1z_2$ の絶対値 $|z_1z_2|$ を求めなさい。`,
            ans: p1[2] * p2[2],
            wrongs: [[p1[2] + p2[2], "MC-COMPLEX-MODULUS"], [p1[2] * p2[2] * p1[2] * p2[2], "MC-COMPLEX-MODULUS"], [Math.abs(p1[0] * p2[0] + p1[1] * p2[1]), "MC-COMPLEX-MODULUS"]],
            explain: `積の絶対値は絶対値の積：$|z_1z_2|=|z_1||z_2|$。$|z_1|=\\sqrt{${p1[0] ** 2}+${p1[1] ** 2}}=${p1[2]}$、$|z_2|=\\sqrt{${p2[0] ** 2}+${p2[1] ** 2}}=${p2[2]}$。よって $${p1[2]}\\times ${p2[2]}=${p1[2] * p2[2]}$。（先に展開して $${cTex(prod[0], prod[1])}$ の絶対値を求めても同じです）`,
          });
        }
        const [a, b] = [r.int(-4, 5), r.int(1, 6)];
        return num({
          q: `虚部が正の複素数 $z$ について、$z+\\bar z=${2 * a}$、$z\\bar z=${a * a + b * b}$ です。$z$ の虚部を求めなさい。`,
          ans: b,
          wrongs: [[a, "MC-COMPLEX-MODULUS"], [a * a + b * b, "MC-COMPLEX-MODULUS"], [b * b, "MC-COMPLEX-MODULUS"], [-b, "MC-SLIP"]],
          explain: `$z=x+yi$（$y>0$）とおくと、$z+\\bar z=2x$ より $x=${a}$。$z\\bar z=x^2+y^2$ より $${a * a}+y^2=${a * a + b * b}$、$y^2=${b * b}$。$y>0$ なので $y=${b}$。`,
        });
      },
      { id: "b", db: 0.15 },
    ),
  ],

  // ── 対数の計算 ───────────────────────────────
  log_calc: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // log_b (b^k)。真数は数のまま出す
        const [b, k] = until(() => [r.pick([2, 3, 5, 10]), r.pick([2, 3, 4, -1, -2, -3, 5])], ([bb, kk]) => (bb >= 5 ? Math.abs(kk) <= 3 : true));
        const argQ = qpow(Q(b), k);
        const argTex = b === 10 && k < 0 ? String(qnum(argQ)) : tq(argQ);
        nearly(Math.log(qnum(argQ)) / Math.log(b), k, "対数の検算");
        return num({
          q: `次の値を求めなさい。\n$\\log_{${b}} ${argTex}$`,
          ans: k,
          wrongs: [[-k, "MC-LOG-MEANING"], [b * k, "MC-LOG-MEANING"], [qnum(argQ) === b ? 2 : Math.round(qnum(argQ)) || k + 1, "MC-LOG-MEANING"], [k + 1, "MC-SLIP"]],
          explain: `$\\log_{${b}} M=x$ は「$${b}$ を何乗すると $M$ になるか」。$${b}^{${k}}=${tq(argQ)}$ なので、答えは $${k}$。`,
        });
      }
      if (lv === 2) {
        // 和・差を1つにまとめる
        const tab = [
          [6, 2, 3, 1], [6, 4, 9, 2], [6, 12, 3, 2], [6, 8, 27, 3], [6, 24, 9, 3],
          [10, 2, 5, 1], [10, 4, 25, 2], [10, 20, 5, 2], [10, 50, 20, 3], [10, 8, 125, 3],
          [12, 3, 4, 1], [12, 2, 6, 1], [12, 9, 16, 2],
          [2, 4, 8, 5], [2, 2, 16, 5], [2, 32, 2, 6],
          [3, 9, 27, 5], [3, 3, 9, 3],
        ];
        if (r.chance(0.55)) {
          const [b, M, N, k] = r.pick(tab);
          nearly(Math.log(M) / Math.log(b) + Math.log(N) / Math.log(b), k, "対数の和の検算");
          return num({
            q: `次の値を求めなさい。\n$\\log_{${b}} ${M}+\\log_{${b}} ${N}$`,
            ans: k,
            wrongs: [[M + N, "MC-LOG-MEANING"], [M * N, "MC-LOG-MEANING"], [k + 1, "MC-SLIP"], [k - 1, "MC-SLIP"]],
            explain: `対数の和は真数の積：$\\log_a M+\\log_a N=\\log_a MN$。$\\log_{${b}} (${M}\\times ${N})=\\log_{${b}} ${M * N}$ で、$${M * N}=${b}^{${k}}$ なので答えは $${k}$。`,
          });
        }
        const [b, N, k] = [r.pick([2, 3, 5, 6]), r.pick([2, 3, 5, 7]), r.int(1, 4)];
        const M = N * Math.pow(b, k);
        nearly(Math.log(M) / Math.log(b) - Math.log(N) / Math.log(b), k, "対数の差の検算");
        return num({
          q: `次の値を求めなさい。\n$\\log_{${b}} ${M}-\\log_{${b}} ${N}$`,
          ans: k,
          wrongs: [[M - N, "MC-LOG-MEANING"], [Math.pow(b, k), "MC-LOG-MEANING"], [k + 1, "MC-SLIP"], [-k, "MC-LOG-SUM-SIGN"]],
          explain: `対数の差は真数の商：$\\log_a M-\\log_a N=\\log_a \\dfrac{M}{N}$。$\\dfrac{${M}}{${N}}=${Math.pow(b, k)}=${b}^{${k}}$ なので答えは $${k}$。`,
        });
      }
      // 底の変換：log_{b^p} (b^q) = q/p ／ 積の形
      if (r.chance(0.6)) {
        const b = r.pick([2, 3, 5]);
        const [p, q] = until(() => [r.int(1, 4), r.int(1, 5)], ([u, v]) => u !== v && gcd(u, v) === 1 && u > 1 && Math.pow(b, v) <= 700 && Math.pow(b, u) <= 700);
        const base = Math.pow(b, p);
        const arg = Math.pow(b, q);
        nearly(Math.log(arg) / Math.log(base), q / p, "底の変換の検算");
        return num({
          q: `次の値を求めなさい。（分数で答えます）\n$\\log_{${base}} ${arg}$`,
          ans: Q(q, p),
          wrongs: [[Q(p, q), "MC-LOG-BASE-CHANGE-INVERT"], [q - p, "MC-LOG-BASE-CHANGE-INVERT"], [q * p, "MC-LOG-BASE-CHANGE-INVERT"], [Q(q, p + 1), "MC-SLIP"]],
          explain: `底を $${b}$ にそろえます。$${base}=${b}^{${p}}$、$${arg}=${b}^{${q}}$。底の変換公式 $\\log_{a^p} a^q=\\dfrac{q}{p}$ より、答えは $\\dfrac{${q}}{${p}}$。（$\\log_{${base}} ${arg}=\\dfrac{\\log_{${b}} ${arg}}{\\log_{${b}} ${base}}=\\dfrac{${q}}{${p}}$）`,
        });
      }
      // log_{b1} b2 × log_{b2} b3 = log_{b1} b3（b1, b3 が同じ素数のべきなら有理数になる）
      const b = r.pick([2, 3, 5]);
      const [p, q] = until(() => [r.int(1, 3), r.int(1, 4)], ([u, v]) => u !== v && Math.pow(b, Math.max(u, v)) <= 130);
      const b1 = Math.pow(b, p);
      const b3 = Math.pow(b, q);
      const b2 = until(() => r.pick([2, 3, 5, 6, 7, 10, 11]), (x) => x !== b1 && x !== b3);
      const frac = Q(q, p);
      nearly((Math.log(b2) / Math.log(b1)) * (Math.log(b3) / Math.log(b2)), q / p, "対数の積の検算");
      return num({
        q: `次の値を求めなさい。（整数または分数で答えます）\n$\\log_{${b1}} ${b2}\\times\\log_{${b2}} ${b3}$`,
        ans: frac,
        wrongs: [[Q(b1 * b3, 1), "MC-LOG-PRODUCT-SPLIT"], [b3 - b1, "MC-LOG-PRODUCT-SPLIT"], [add(frac, Q(1)), "MC-SLIP"]],
        explain: `底の変換公式 $\\log_a b=\\dfrac{\\log_c b}{\\log_c a}$ を使うと、$\\log_{${b1}} ${b2}\\times\\log_{${b2}} ${b3}=\\dfrac{\\log ${b2}}{\\log ${b1}}\\times\\dfrac{\\log ${b3}}{\\log ${b2}}=\\dfrac{\\log ${b3}}{\\log ${b1}}=\\log_{${b1}} ${b3}$ と、真ん中の $${b2}$ が消えます。これは $${tq(frac)}$ です。`,
      });
    }),
  ],
};
