// ============================================================
// tpl/mid_alg2.js — 中学校 式の計算・連立方程式・展開と因数分解・2次方程式
//   poly_addsub / mono_muldiv / poly_calc_mixed / lit_eq_solve / simul_add / simul_sub / simul_word /
//   expand_basic / expand_formula / factor_common / factor_formula / quad_eq_basic /
//   quad_eq_formula / quad_eq_word
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, eq, neg, abs, cmp, toDecimalString } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert, gcd, lcm, NAMES } from "./util.js";
import { sqrtParts } from "./mid_num.js";

const $ = (s) => `$${s}$`;
const tx = (p, order = ["x"]) => p.toTeX({ order });
const L = (a, b, v = "x") => P.lin(a, b, v);
/** 整数係数の多項式 [定数項, 1次, 2次, …] */
const C = (cs, v = "x") => P.coeffs(cs, v);
const cases = (eqs) => `\\begin{cases} ${eqs.join(" \\\\ ")} \\end{cases}`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const cnz = (r, lo, hi) => r.nz(lo, hi);
/** ax + by = c を TeX に（係数 1, -1 は数字を省く） */
function lineTeX(a, b, c, vx = "x", vy = "y") {
  const co = (k, v, first) => (k === 0 ? "" : `${k < 0 ? "-" : first ? "" : "+"}${Math.abs(k) === 1 ? "" : Math.abs(k)}${v}`);
  return `${co(a, vx, true)}${co(b, vy, a === 0)}=${c}`;
}

/** 多項式を「(…)」で囲んだ TeX */
const wrap = (p, order) => `(${tx(p, order)})`;

/** 同類項でない次数の低い2項を、1つの項にまとめてしまう誤り（例 3x²+2x+1 → 3x²+3x） */
function mergeLast(p) {
  const terms = [...p.t.values()].sort((u, v) => Object.values(v.e).reduce((a, b) => a + b, 0) - Object.values(u.e).reduce((a, b) => a + b, 0));
  if (terms.length < 2) return p.add(P.c(1));
  const [u, v] = terms.slice(-2);
  let out = new Poly();
  for (const tm of terms.slice(0, -2)) out = out.add(Poly.mono(tm.c, tm.e));
  return out.add(Poly.mono(add(u.c, v.c), u.e));
}

/** 係数の最大公約数 */
const coefGcd = (p) => [...p.t.values()].map((t_) => Math.abs(t_.c.n)).reduce((g, v) => gcd(g, v), 0);

export default {
  // ── 多項式の加法・減法 ─────────────────────────
  poly_addsub: [
    t("choice", (r, lv) => {
      let A, B, order;
      if (lv === 1) {
        A = C([cnz(r, -7, 8), cnz(r, -6, 7), cnz(r, 1, 4)]);
        B = C([cnz(r, -7, 8), cnz(r, -6, 7), cnz(r, -3, 4)]);
        order = ["x"];
      } else if (lv === 2) {
        A = L(cnz(r, -5, 6), 0, "a").add(L(cnz(r, -5, 6), 0, "b"));
        B = L(cnz(r, -5, 6), 0, "a").add(L(cnz(r, -5, 6), 0, "b"));
        order = ["a", "b"];
      } else {
        A = C([cnz(r, -6, 7), cnz(r, -6, 7), cnz(r, -4, 4)]).add(P.mono(cnz(r, -3, 3), { x: 3 }));
        B = C([cnz(r, -6, 7), cnz(r, -6, 7), cnz(r, -4, 4)]);
        order = ["x"];
      }
      const plus = lv === 1 ? r.chance(0.5) : false;
      const correct = plus ? A.add(B) : A.sub(B);
      // 誤答：ひく式の一部の項だけ符号を変える／符号を変えない／同類項の合成ミス
      const terms = [...B.t.values()].sort((u, v) => Object.values(v.e).reduce((p, q) => p + q, 0) - Object.values(u.e).reduce((p, q) => p + q, 0));
      const first = terms[0];
      const wrongPartial = plus ? A.add(B.neg()) : A.sub(B).add(Poly.mono(mul(first.c, 2), first.e)); // 先頭項だけ符号を変えない
      const wrongNoFlip = A.add(B);
      const wrongs = [
        [wrongPartial, "MC-POLY-SUB-SIGN"],
        [plus ? A.sub(B) : wrongNoFlip, "MC-POLY-SUB-SIGN"],
        [correct.neg(), "MC-POLY-SUB-SIGN"],
        [correct.add(P.c(2)), "MC-SLIP"],
        [mergeLast(correct), "MC-EXPR-UNLIKE"],
      ];
      return choice({
        q: `次の計算をしなさい。\n$${wrap(A, order)}${plus ? "+" : "-"}${wrap(B, order)}$`,
        correct: $(tx(correct, order)),
        wrongs: wrongs.map(([p, mc]) => [$(tx(p, order)), mc]),
        explain: `${plus ? "" : "ひくかっこをはずすときは、中のすべての項の符号を変えます。"}$${tx(A, order)}${plus ? "" : "-"}(${tx(B, order)})$ を同類項どうしでまとめて $${tx(correct, order)}$。`,
      });
    }),
  ],

  // ── 単項式の乗法・除法 ─────────────────────────
  mono_muldiv: [
    t("choice", (r, lv) => {
      const ex = (v) => ({ [v]: 1 });
      let given, correct, wrongs, explain;
      if (lv === 1) {
        const [c1, c2] = [cnz(r, -6, 7), cnz(r, -6, 7)];
        const [p, q] = [r.int(1, 2), r.int(1, 2)];
        const A = Poly.mono(c1, { a: p });
        const B = Poly.mono(c2, { a: q });
        correct = A.mul(B);
        given = `${tx(A, ["a"])}\\times ${c2 < 0 ? "(" + tx(B, ["a"]) + ")" : tx(B, ["a"])}`;
        wrongs = [[Poly.mono(c1 * c2, { a: p * q }), "MC-MONO-EXP-MUL"], [Poly.mono(c1 + c2, { a: p + q }), "MC-MONO-COEF-ADD"], [Poly.mono(c1 * c2, { a: Math.max(p, q) }), "MC-MONO-EXP-ADD"], [correct.neg(), "MC-NEG-MUL-SIGN"]];
        explain = `係数どうし $${c1}\\times ${c2 < 0 ? "(" + c2 + ")" : c2}=${c1 * c2}$、文字どうし $a^{${p}}\\times a^{${q}}=a^{${p + q}}$（指数はたす）。答えは $${tx(correct, ["a"])}$。`;
      } else if (lv === 2) {
        const isMul = r.chance(0.5);
        if (isMul) {
          const [c1, c2] = [cnz(r, -4, 5), cnz(r, -4, 5)];
          const A = Poly.mono(c1, { x: 2, y: 1 });
          const B = Poly.mono(c2, { x: 1, y: 2 });
          correct = A.mul(B);
          given = `(${tx(A, ["x", "y"])})\\times(${tx(B, ["x", "y"])})`;
          wrongs = [[Poly.mono(c1 * c2, { x: 2, y: 2 }), "MC-MONO-EXP-MUL"], [Poly.mono(c1 + c2, { x: 3, y: 3 }), "MC-MONO-COEF-ADD"], [Poly.mono(c1 * c2, { x: 3, y: 2 }), "MC-MONO-EXP-ADD"], [correct.neg(), "MC-NEG-MUL-SIGN"]];
          explain = `係数どうし $${c1}\\times(${c2})=${c1 * c2}$。$x$ どうし $x^2\\times x=x^3$、$y$ どうし $y\\times y^2=y^3$。答えは $${tx(correct, ["x", "y"])}$。`;
        } else {
          const k = cnz(r, -4, 5);
          const c = cnz(r, 2, 4);
          const A = Poly.mono(k * c, { a: 2, b: 1 });
          const B = Poly.mono(c, { a: 1 });
          correct = Poly.mono(k, { a: 1, b: 1 });
          given = `(${tx(A, ["a", "b"])})\\div ${tx(B, ["a"])}`;
          wrongs = [[Poly.mono(k, { a: 3, b: 1 }), "MC-MONO-EXP-ADD"], [Poly.mono(k * c * c, { a: 1, b: 1 }), "MC-MONO-COEF-ADD"], [Poly.mono(k, { a: 2, b: 1 }), "MC-MONO-EXP-ADD"], [Poly.mono(k, { b: 1 }), "MC-MONO-EXP-ADD"]];
          explain = `係数 $${k * c}\\div ${c}=${k}$、文字 $a^2\\div a=a$、$b$ はそのまま。答えは $${tx(correct, ["a", "b"])}$。（わり算は約分と同じ）`;
        }
      } else {
        const kind = r.int(1, 2);
        if (kind === 1) {
          const c = cnz(r, -4, 4);
          const k = r.int(2, 3);
          const A = Poly.mono(c, { x: 1 });
          correct = A.pow(k);
          given = `(${tx(A)})^{${k}}`;
          const wrongBase = Poly.mono(c, { x: k });
          wrongs = [[wrongBase, "MC-MONO-POWER-PAREN"], [Poly.mono(c * k, { x: k }), "MC-MONO-POWER-PAREN"], [Poly.mono(-Math.abs(c ** k), { x: k }), "MC-MONO-POWER-PAREN"], [Poly.mono(c ** k, { x: 1 }), "MC-MONO-EXP-MUL"]];
          explain = `かっこの中のすべて（係数も文字も）を $${k}$ 乗します。$(${c}x)^{${k}}=(${c})^{${k}}x^{${k}}=${c ** k}x^{${k}}$。`;
        } else {
          const [c1, c2, c3] = [cnz(r, -3, 4), cnz(r, 2, 3), cnz(r, -3, 4)];
          const A = Poly.mono(c1 * c2, { a: 2, b: 1 });
          const B = Poly.mono(c2, { a: 1 });
          const Cc = Poly.mono(c3, { b: 1 });
          correct = Poly.mono(c1 * c3, { a: 1, b: 2 });
          given = `(${tx(A, ["a", "b"])})\\div(${tx(B, ["a"])})\\times(${tx(Cc, ["b"])})`;
          wrongs = [[Poly.mono(c1 * c3, { a: 3, b: 2 }), "MC-MONO-EXP-ADD"], [Poly.mono(c1 * c3 * c2 * c2, { a: 1, b: 2 }), "MC-MONO-COEF-ADD"], [Poly.mono(c1 * c3, { a: 1, b: 1 }), "MC-MONO-EXP-ADD"], [correct.neg(), "MC-NEG-MUL-SIGN"]];
          explain = `左から順に計算します。$(${tx(A, ["a", "b"])})\\div(${tx(B, ["a"])})=${tx(Poly.mono(c1, { a: 1, b: 1 }), ["a", "b"])}$、これに $${tx(Cc, ["b"])}$ をかけて $${tx(correct, ["a", "b"])}$。`;
        }
      }
      wrongs.push([correct.add(P.c(1)), "MC-SLIP"], [correct.scale(2), "MC-MONO-COEF-ADD"]);
      return choice({
        q: `次の計算をしなさい。\n$${given}$`,
        correct: $(tx(correct, ["x", "y", "a", "b"])),
        wrongs: wrongs.map(([p, mc]) => [$(tx(p, ["x", "y", "a", "b"])), mc]),
        explain,
      });
    }),
  ],

  // ── 分数を含む式の計算 ─────────────────────────
  poly_calc_mixed: [
    t("choice", (r, lv) => {
      const v = until(
        () => {
          const [d1, d2] = [r.int(2, 6), r.int(2, 6)];
          const A = L(cnz(r, -4, 5), cnz(r, -6, 6));
          const B = L(cnz(r, -4, 5), cnz(r, -6, 6));
          const plus = lv === 1 ? true : r.chance(0.5);
          const l = lcm(d1, d2);
          const total = plus ? A.scale(l / d1).add(B.scale(l / d2)) : A.scale(l / d1).sub(B.scale(l / d2));
          return { d1, d2, A, B, plus, l, total };
        },
        (x) => x.d1 !== x.d2 && (lv === 1 || gcd(x.d1, x.d2) === 1) && x.total.coeff(1).n !== 0 && gcd(coefGcd(x.total), x.l) === 1,
      );
      const { d1, d2, A, B, plus, l, total } = v;
      const num1 = A.scale(l / d1);
      const num2 = B.scale(l / d2);
      const frac = (p, dd) => `\\frac{${tx(p)}}{${dd}}`;
      const correct = frac(total, l);
      const wrongs = [
        [frac(num1.add(num2), l), "MC-FRAC-EXPR-SIGN"], // ひく式の符号を変えない
        [frac(A.add(plus ? B : B.neg()), l), "MC-FRAC-EXPR-SCALE"], // 通分しても分子にかけない
        [frac(total, d1 + d2), "MC-FRAC-ADD-BOTH"],
        [frac(num1.sub(num2), l), "MC-FRAC-EXPR-SIGN"],
        [frac(total.add(P.c(1)), l), "MC-SLIP"],
      ];
      return choice({
        q: `次の計算をしなさい。\n$\\dfrac{${tx(A)}}{${d1}}${plus ? "+" : "-"}\\dfrac{${tx(B)}}{${d2}}$`,
        correct: $(correct),
        wrongs: wrongs.map(([s_, mc]) => [$(s_), mc]),
        explain: `分母 $${d1}$ と $${d2}$ の最小公倍数 $${l}$ で通分します。$\\dfrac{${l / d1}(${tx(A)})${plus ? "+" : "-"}${l / d2}(${tx(B)})}{${l}}$。${plus ? "" : "ひくほうの分子は、かっこで囲んで各項の符号を変えます。"}分子をまとめると $${correct.replace(/^\\frac/, "\\dfrac")}$。`,
      });
    }),
  ],

  // ── 等式の変形 ─────────────────────────────────
  lit_eq_solve: [
    t("choice", (r, lv) => {
      let q, correct, wrongs, explain;
      if (lv === 1) {
        const a = r.int(2, 6);
        const c = cnz(r, 3, 15);
        q = `等式 $${a}x+y=${c}$ を $y$ について解きなさい。`;
        correct = `y=-${a}x+${c}`;
        wrongs = [[`y=${a}x+${c}`, "MC-LITEQ-SIGN"], [`y=${a}x-${c}`, "MC-LITEQ-SIGN"], [`y=-${a}x-${c}`, "MC-LITEQ-SIGN"], [`y=\\frac{${c}}{${a}x}`, "MC-LITEQ-DIV"]];
        explain = `$${a}x$ を右辺に移項すると符号が変わり、$y=${c}-${a}x$、つまり $y=-${a}x+${c}$。`;
      } else if (lv === 2) {
        const [a, b] = until(() => [r.int(2, 6), r.int(2, 6)], ([p, s]) => gcd(p, s) === 1);
        const c = cnz(r, 4, 18);
        q = `等式 $${a}x+${b}y=${c}$ を $y$ について解きなさい。`;
        correct = `y=\\frac{${c}-${a}x}{${b}}`;
        wrongs = [[`y=${c}-\\frac{${a}x}{${b}}`, "MC-LITEQ-DIV"], [`y=\\frac{${c}+${a}x}{${b}}`, "MC-LITEQ-SIGN"], [`y=\\frac{${c}-${a}x}{${a}}`, "MC-LITEQ-DIV"], [`y=${c}-${a}x-${b}`, "MC-LITEQ-DIV"]];
        explain = `$${a}x$ を移項して $${b}y=${c}-${a}x$。両辺を $${b}$ でわって $y=\\dfrac{${c}-${a}x}{${b}}$。右辺の全体を $${b}$ でわります。`;
      } else {
        const kind = r.int(1, 3);
        if (kind === 1) {
          q = `等式 $S=\\dfrac{1}{2}(a+b)h$ を $b$ について解きなさい。`;
          correct = `b=\\frac{2S}{h}-a`;
          wrongs = [[`b=\\frac{2S-a}{h}`, "MC-LITEQ-DIV"], [`b=\\frac{2S}{h}+a`, "MC-LITEQ-SIGN"], [`b=2Sh-a`, "MC-LITEQ-DIV"], [`b=\\frac{S}{2h}-a`, "MC-LITEQ-DIV"]];
          explain = `両辺に $2$ をかけて $2S=(a+b)h$。両辺を $h$ でわって $a+b=\\dfrac{2S}{h}$。$a$ を移項して $b=\\dfrac{2S}{h}-a$。`;
        } else if (kind === 2) {
          q = `等式 $V=\\dfrac{1}{3}\\pi r^{2}h$ を $h$ について解きなさい。`;
          correct = `h=\\frac{3V}{\\pi r^{2}}`;
          wrongs = [[`h=\\frac{V}{3\\pi r^{2}}`, "MC-LITEQ-DIV"], [`h=3V\\pi r^{2}`, "MC-LITEQ-DIV"], [`h=\\frac{3V}{\\pi r}`, "MC-LITEQ-DIV"], [`h=\\frac{\\pi r^{2}}{3V}`, "MC-LITEQ-DIV"]];
          explain = `両辺に $3$ をかけて $3V=\\pi r^{2}h$。両辺を $\\pi r^{2}$ でわって $h=\\dfrac{3V}{\\pi r^{2}}$。`;
        } else {
          const m = r.int(2, 5);
          q = `等式 $\\dfrac{x+y}{${m}}=z$ を $x$ について解きなさい。`;
          correct = `x=${m}z-y`;
          wrongs = [[`x=\\frac{z}{${m}}-y`, "MC-LITEQ-DIV"], [`x=${m}z+y`, "MC-LITEQ-SIGN"], [`x=\\frac{${m}z}{y}`, "MC-LITEQ-DIV"], [`x=${m}(z-y)`, "MC-LITEQ-DIV"]];
          explain = `両辺に $${m}$ をかけて $x+y=${m}z$。$y$ を移項して $x=${m}z-y$。`;
        }
      }
      return choice({ q, correct: $(correct), wrongs: wrongs.map(([s, mc]) => [$(s), mc]), explain });
    }),
  ],

  // ── 連立方程式（加減法） ───────────────────────
  simul_add: [
    t("fields", (r, lv) => {
      const { x, y, a1, b1, a2, b2 } = until(
        () => {
          const x = cnz(r, -6, 7);
          const y = cnz(r, -6, 7);
          if (lv === 1) {
            const s = r.pick([1, -1]);
            return { x, y, a1: 1, b1: 1, a2: 1, b2: -1 * s };
          }
          if (lv === 2) {
            const k = r.pick([2, 3]);
            return { x, y, a1: cnz(r, 2, 4), b1: cnz(r, -4, 4), a2: 1, b2: cnz(r, -4, 4) / 1 };
          }
          return { x, y, a1: cnz(r, 2, 5), b1: cnz(r, -5, 5), a2: cnz(r, 2, 5), b2: cnz(r, -5, 5) };
        },
        (v) => v.a1 * v.b2 - v.a2 * v.b1 !== 0 && (lv !== 3 || (v.a1 !== v.a2 && v.b1 !== v.b2)) && Math.abs(v.a1 * v.x + v.b1 * v.y) < 40 && Math.abs(v.a2 * v.x + v.b2 * v.y) < 40,
      );
      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      const line = lineTeX;
      return fields({
        q: `次の連立方程式を解きなさい。\n$${cases([line(a1, b1, c1), line(a2, b2, c2)])}$`,
        layout: "inline",
        fields: [
          { id: "x", value: x, pre: "$x=$" },
          { id: "y", value: y, pre: "$y=$" },
        ],
        wrongs: [
          { values: { x, y: -y }, mc: "MC-SIMUL-SIGN" },
          { values: { x: -x, y }, mc: "MC-SIMUL-SIGN" },
          { values: { x: y, y: x }, mc: "MC-SIMUL-SWAP" },
        ],
        explain: `文字の係数の絶対値をそろえて、2つの式をたす（ひく）と、$y$（または $x$）が消えます。求めた値をもとの式に代入して、$x=${x}$、$y=${y}$。（たしかめ：$${a1}\\times(${x})+(${b1})\\times(${y})=${c1}$、$${a2}\\times(${x})+(${b2})\\times(${y})=${c2}$）`,
      });
    }),
  ],

  // ── 連立方程式（代入法・複雑な形） ───────────────
  simul_sub: [
    t("fields", (r, lv) => {
      const x = cnz(r, -5, 6);
      const y = cnz(r, -5, 6);
      let eqs;
      let expl;
      if (lv === 1) {
        const m = cnz(r, -3, 3);
        const k = y - m * x;
        const a = cnz(r, 2, 4);
        const b = cnz(r, 1, 3);
        const c = a * x + b * y;
        eqs = [`y=${tx(L(m, k))}`, lineTeX(a, b, c)];
        expl = `1つ目の式を2つ目の式の $y$ に代入します。$${a}x+${b}(${tx(L(m, k))})=${c}$ を解いて $x=${x}$、$y=${y}$。`;
      } else if (lv === 2) {
        const m = cnz(r, -3, 3);
        const k = x - m * y;
        const a = cnz(r, 2, 4);
        const b = cnz(r, -3, 3);
        const c = a * x + b * y;
        eqs = [`x=${tx(L(m, k, "y"), ["y"])}`, lineTeX(a, b, c)];
        expl = `1つ目の式を2つ目の式の $x$ に代入します。$${a}(${tx(L(m, k, "y"), ["y"])})${b < 0 ? "" : "+"}${b}y=${c}$ を解いて $y=${y}$、$x=${x}$。`;
      } else {
        const { a1, b1, a2, b2 } = until(
          () => ({ a1: cnz(r, 1, 4), b1: cnz(r, -4, 4), a2: cnz(r, 1, 4), b2: cnz(r, -4, 4) }),
          (v) => v.a1 * v.b2 - v.a2 * v.b1 !== 0 && Math.abs(v.b1) === 1,
        );
        const c1 = a1 * x + b1 * y;
        const c2 = a2 * x + b2 * y;
        const line = lineTeX;
        eqs = [line(a1, b1, c1), line(a2, b2, c2)];
        expl = `係数が $\\pm1$ の文字がある式を、その文字について解いてから代入します。求めた値を代入して $x=${x}$、$y=${y}$。`;
      }
      return fields({
        q: `次の連立方程式を解きなさい。\n$${cases(eqs)}$`,
        layout: "inline",
        fields: [
          { id: "x", value: x, pre: "$x=$" },
          { id: "y", value: y, pre: "$y=$" },
        ],
        wrongs: [
          { values: { x, y: -y }, mc: "MC-SIMUL-SIGN" },
          { values: { x: -x, y }, mc: "MC-SIMUL-SIGN" },
          { values: { x: y, y: x }, mc: "MC-SIMUL-SWAP" },
        ],
        explain: expl,
      });
    }),
  ],

  // ── 連立方程式の利用 ───────────────────────────
  simul_word: [
    t("num", (r, lv) => {
      // 2種類の買い物の代金から、1つの単価を求める
      const { p, n, a1, b1, a2, b2 } = until(
        () => ({ p: r.int(4, 15) * 10, n: r.int(4, 20) * 10, a1: r.int(2, 5), b1: r.int(1, 4), a2: r.int(1, 5), b2: r.int(2, 5) }),
        (v) => v.a1 * v.b2 !== v.a2 * v.b1 && v.p !== v.n,
      );
      const t1 = a1 * p + b1 * n;
      const t2 = a2 * p + b2 * n;
      const askN = r.chance(0.5);
      const det = a1 * b2 - a2 * b1;
      return num({
        q: `えんぴつ ${a1} 本とノート ${b1} 冊を買うと ${t1} 円、えんぴつ ${a2} 本とノート ${b2} 冊を買うと ${t2} 円でした。${askN ? "ノート1冊" : "えんぴつ1本"}の値段は何円ですか。`,
        ans: askN ? n : p,
        post: "円",
        wrongs: [[askN ? p : n, "MC-SIMUL-SWAP"], [Q(t1, a1 + b1), "MC-WORD-EQ-SETUP"], [Q(askN ? t2 - t1 : t1 + t2, 1), "MC-WORD-EQ-SETUP"]],
        explain: `えんぴつ1本を $x$ 円、ノート1冊を $y$ 円とすると、$${cases([`${a1}x+${b1}y=${t1}`, `${a2}x+${b2}y=${t2}`])}$。加減法で解くと $x=${p}$、$y=${n}$。${askN ? "ノート" : "えんぴつ"}は $${askN ? n : p}$ 円。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 大人と子どもの人数
        const { A, B, fa, fb } = until(
          () => ({ A: r.int(3, 20), B: r.int(3, 20), fa: r.pick([500, 600, 800, 1000, 1200]), fb: r.pick([200, 300, 400, 500, 600]) }),
          (v) => v.fa > v.fb,
        );
        const askAdult = r.chance(0.5);
        return num({
          q: `ある施設の入場料は、大人 1 人 ${fa} 円、子ども 1 人 ${fb} 円です。大人と子どもあわせて ${A + B} 人が入場し、入場料の合計は ${fa * A + fb * B} 円でした。${askAdult ? "大人" : "子ども"}は何人ですか。`,
          ans: askAdult ? A : B,
          post: "人",
          wrongs: [[askAdult ? B : A, "MC-SIMUL-SWAP"], [Q(fa * A + fb * B, fa + fb), "MC-WORD-EQ-SETUP"], [Q(A + B, 2), "MC-WORD-EQ-SETUP"]],
          explain: `大人を $x$ 人、子どもを $y$ 人とすると、$${cases([`x+y=${A + B}`, `${fa}x+${fb}y=${fa * A + fb * B}`])}$。1つ目を $${fb}$ 倍して2つ目からひくと $${fa - fb}x=${fa * A + fb * B - fb * (A + B)}$ より $x=${A}$、$y=${B}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 単項式×多項式・(a+b)(c+d)の展開 ─────────────
  expand_basic: [
    t("choice", (r, lv) => {
      let A, B, order;
      if (lv === 1) {
        A = Poly.mono(cnz(r, -4, 5), { x: 1 });
        B = C([cnz(r, -6, 6), cnz(r, -5, 5)]);
        order = ["x"];
      } else if (lv === 2) {
        A = L(cnz(r, 1, 3), cnz(r, -6, 6));
        B = L(cnz(r, 1, 3), cnz(r, -6, 6));
        order = ["x"];
      } else {
        A = L(cnz(r, 1, 3), cnz(r, -4, 4));
        B = C([cnz(r, -4, 4), cnz(r, -3, 3), cnz(r, 1, 2)]);
        order = ["x"];
      }
      const correct = A.mul(B);
      const wrongs = [];
      if (lv === 1) {
        const k = A.coeff(1).n;
        const [b1, b0] = [B.coeff(1).n, B.coeff(0).n];
        wrongs.push([C([b0, 0, k * b1]), "MC-EXPAND-DISTRIB"]); // 定数項にかけ忘れ
        wrongs.push([C([0, -k * b0, k * b1]), "MC-EXPAND-SIGN"]);
        wrongs.push([C([0, k * (b1 + b0)]), "MC-EXPAND-EXP"]); // x×x を x と考える
      } else {
        const lead = (p) => Poly.mono(p.coeff(p.degree()), { x: p.degree() });
        const cst = (p) => Poly.const(p.coeff(0));
        wrongs.push([lead(A).mul(lead(B)).add(cst(A).mul(cst(B))), "MC-EXPAND-CROSS"]); // 内側・外側の積を忘れる
        wrongs.push([correct.sub(cst(A).mul(cst(B)).scale(2)), "MC-EXPAND-SIGN"]); // 定数項の符号
        wrongs.push([A.mul(lead(B)).add(cst(B)), "MC-EXPAND-DISTRIB"]); // 一方の一部の項にしかかけない
      }
      wrongs.push([correct.neg(), "MC-EXPAND-SIGN"], [correct.add(P.c(1)), "MC-SLIP"]);
      const q = lv === 1 ? `${tx(A)}(${tx(B)})` : `(${tx(A)})(${tx(B)})`;
      return choice({
        q: `次の式を展開しなさい。\n$${q}$`,
        correct: $(tx(correct)),
        wrongs: wrongs.map(([p, mc]) => [$(tx(p)), mc]),
        explain: `分配法則で、一方のかっこの中の各項を、もう一方のすべての項にかけます。${lv === 1 ? "" : `$(${tx(A)})(${tx(B)})$ は 4 つ（または 6 つ）の積の和になり、`}同類項をまとめて $${tx(correct)}$。`,
      });
    }),
  ],

  // ── 乗法公式による展開 ─────────────────────────
  expand_formula: [
    t("choice", (r, lv) => {
      const a = r.int(1, 9);
      const b = r.int(1, 9);
      let given, correct, wrongs, order = ["x"];
      const kind = lv === 1 ? r.pick(["sq+", "sq-", "diff"]) : lv === 2 ? r.pick(["xa xb", "xa xb", "diff"]) : r.pick(["ax sq", "xy sq", "ax diff"]);
      if (kind === "sq+") {
        given = `(x+${a})^2`;
        correct = C([a * a, 2 * a, 1]);
        wrongs = [[C([a * a, 0, 1]), "MC-EXPAND-SQUARE-SUM"], [C([2 * a, 2 * a, 1]), "MC-EXPAND-2AB"], [C([a * a, a, 1]), "MC-EXPAND-2AB"], [C([a * a, -2 * a, 1]), "MC-EXPAND-SIGN"]];
      } else if (kind === "sq-") {
        given = `(x-${a})^2`;
        correct = C([a * a, -2 * a, 1]);
        wrongs = [[C([-a * a, 0, 1]), "MC-EXPAND-SQUARE-DIFF"], [C([a * a, 0, 1]), "MC-EXPAND-SQUARE-SUM"], [C([a * a, 2 * a, 1]), "MC-EXPAND-SIGN"], [C([-a * a, -2 * a, 1]), "MC-EXPAND-SIGN"]];
      } else if (kind === "diff") {
        given = `(x+${a})(x-${a})`;
        correct = C([-a * a, 0, 1]);
        wrongs = [[C([a * a, 0, 1]), "MC-EXPAND-DIFF-SIGN"], [C([-a * a, -2 * a, 1]), "MC-EXPAND-CROSS"], [C([-a * a, 2 * a, 1]), "MC-EXPAND-CROSS"], [C([0, 0, 1]).sub(P.c(2 * a)), "MC-EXPAND-CROSS"]];
      } else if (kind === "xa xb") {
        const [p, q] = until(() => [cnz(r, -8, 9), cnz(r, -8, 9)], ([u, v]) => u + v !== 0);
        given = `(x${sgn(p)})(x${sgn(q)})`;
        correct = C([p * q, p + q, 1]);
        wrongs = [[C([p * q, 0, 1]), "MC-EXPAND-CROSS"], [C([p + q, p * q, 1]), "MC-EXPAND-SUM-PROD"], [C([-p * q, p + q, 1]), "MC-EXPAND-SIGN"], [C([p * q, -(p + q), 1]), "MC-EXPAND-SIGN"]];
      } else if (kind === "ax sq") {
        const c = r.int(2, 4);
        const d = cnz(r, -6, 6);
        given = `(${c}x${sgn(d)})^2`;
        correct = C([d * d, 2 * c * d, c * c]);
        wrongs = [[C([d * d, 0, c * c]), "MC-EXPAND-SQUARE-SUM"], [C([d * d, c * d, c * c]), "MC-EXPAND-2AB"], [C([d * d, 2 * c * d, c]), "MC-EXPAND-POWER-COEF"], [C([d * d, -2 * c * d, c * c]), "MC-EXPAND-SIGN"]];
      } else if (kind === "xy sq") {
        const c = cnz(r, -4, 4);
        given = `(x${sgn(c)}y)^2`;
        correct = Poly.mono(1, { x: 2 }).add(Poly.mono(2 * c, { x: 1, y: 1 })).add(Poly.mono(c * c, { y: 2 }));
        wrongs = [[Poly.mono(1, { x: 2 }).add(Poly.mono(c * c, { y: 2 })), "MC-EXPAND-SQUARE-SUM"], [Poly.mono(1, { x: 2 }).add(Poly.mono(c, { x: 1, y: 1 })).add(Poly.mono(c * c, { y: 2 })), "MC-EXPAND-2AB"], [Poly.mono(1, { x: 2 }).add(Poly.mono(-2 * c, { x: 1, y: 1 })).add(Poly.mono(c * c, { y: 2 })), "MC-EXPAND-SIGN"]];
        order = ["x", "y"];
      } else {
        const c = r.int(2, 4);
        const d = r.int(1, 6);
        given = `(${c}x+${d})(${c}x-${d})`;
        correct = C([-d * d, 0, c * c]);
        wrongs = [[C([d * d, 0, c * c]), "MC-EXPAND-DIFF-SIGN"], [C([-d * d, 0, c]), "MC-EXPAND-POWER-COEF"], [C([-d * d, 2 * c * d, c * c]), "MC-EXPAND-CROSS"], [C([-d * d, -2 * c * d, c * c]), "MC-EXPAND-CROSS"]];
      }
      wrongs.push([correct.add(P.c(1)), "MC-SLIP"]);
      return choice({
        q: `次の式を展開しなさい。\n$${given}$`,
        correct: $(tx(correct, order)),
        wrongs: wrongs.map(([p, mc]) => [$(tx(p, order)), mc]),
        explain: `乗法公式を使います。$(a+b)^2=a^2+2ab+b^2$、$(a-b)^2=a^2-2ab+b^2$、$(a+b)(a-b)=a^2-b^2$、$(x+p)(x+q)=x^2+(p+q)x+pq$。$${given}=${tx(correct, order)}$。`,
      });
    }),
  ],

  // ── 共通因数でくくる ───────────────────────────
  factor_common: [
    t("choice", (r, lv) => {
      let given, correct, wrongs;
      if (lv === 1) {
        const k = r.pick([4, 6, 8, 9, 10, 12]);
        const [m, n] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => gcd(u, v) === 1);
        const sg_ = r.chance(0.5) ? 1 : -1;
        const P1 = L(k * m, sg_ * k * n);
        given = tx(P1);
        correct = `${k}(${tx(L(m, sg_ * n))})`;
        const d = [2, 3].find((f) => k % f === 0 && k / f > 1) || 1; // kの真の約数（部分的にしかくくらない誤り）
        wrongs = [
          [`${k}(${tx(L(m, -sg_ * n))})`, "MC-FACTOR-SIGN"],
          [`${k}(${tx(L(k * m, sg_ * n))})`, "MC-FACTOR-PARTIAL"], // 第1項を割り忘れ
          [`${k}(${tx(L(m, sg_ * k * n))})`, "MC-FACTOR-PARTIAL"], // 第2項を割り忘れ
        ];
        if (d > 1) wrongs.push([`${d}(${tx(L((k * m) / d, (sg_ * k * n) / d))})`, "MC-FACTOR-PARTIAL"]);
      } else if (lv === 2) {
        const k = r.int(2, 5);
        const [m, n] = until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => gcd(u, v) === 1);
        const sg_ = r.chance(0.5) ? 1 : -1;
        const P1 = Poly.mono(k * m, { x: 2 }).add(Poly.mono(sg_ * k * n, { x: 1 }));
        given = tx(P1);
        correct = `${k}x(${tx(L(m, sg_ * n))})`;
        wrongs = [
          [`${k}(${tx(Poly.mono(m, { x: 2 }).add(Poly.mono(sg_ * n, { x: 1 })))})`, "MC-FACTOR-PARTIAL"], // x をくくらない
          [`x(${tx(L(k * m, sg_ * k * n))})`, "MC-FACTOR-PARTIAL"], // 数をくくらない
          [`${k}x(${tx(L(m, -sg_ * n))})`, "MC-FACTOR-SIGN"],
          [`${k}x(${tx(L(k * m, sg_ * n))})`, "MC-FACTOR-PARTIAL"],
        ];
      } else {
        const g = r.int(2, 6);
        const [m, n] = until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => gcd(u, v) === 1 && u !== v);
        const O = ["a", "b"];
        const P1 = Poly.mono(g * m, { a: 2, b: 1 }).add(Poly.mono(-g * n, { a: 1, b: 2 }));
        given = tx(P1, O);
        correct = `${g}ab(${tx(Poly.mono(m, { a: 1 }).add(Poly.mono(-n, { b: 1 })), O)})`;
        wrongs = [
          [`${g}a(${tx(Poly.mono(m, { a: 1, b: 1 }).add(Poly.mono(-n, { b: 2 })), O)})`, "MC-FACTOR-PARTIAL"],
          [`${g}ab(${tx(Poly.mono(m, { a: 1 }).add(Poly.mono(n, { b: 1 })), O)})`, "MC-FACTOR-SIGN"],
          [`ab(${tx(Poly.mono(g * m, { a: 1 }).add(Poly.mono(-g * n, { b: 1 })), O)})`, "MC-FACTOR-PARTIAL"],
          [`${g}b(${tx(Poly.mono(m, { a: 2 }).add(Poly.mono(-n, { a: 1, b: 1 })), O)})`, "MC-FACTOR-PARTIAL"],
        ];
      }
      return choice({
        q: `次の式を因数分解しなさい。\n$${given}$`,
        correct: $(correct),
        wrongs: wrongs.map(([s_, mc]) => [$(s_), mc]),
        explain: `すべての項に共通する因数（数は最大公約数、文字は共通の文字）をできるだけ多くくくり出します。$${given}=${correct}$。展開してもとにもどることで確かめられます。`,
      });
    }),
  ],

  // ── 公式による因数分解 ─────────────────────────
  factor_formula: [
    t("choice", (r, lv) => {
      let given, correct, wrongs;
      const kind = lv === 1 ? r.pick(["pq", "pq", "sq"]) : lv === 2 ? r.pick(["pq", "diff", "sq"]) : r.pick(["common pq", "common diff"]);
      if (kind === "pq") {
        const [p, q] = until(() => [cnz(r, -8, 9), cnz(r, -8, 9)], ([u, v]) => u + v !== 0 && u !== v);
        const fac = (u, v) => `(x${sgn(Math.min(u, v))})(x${sgn(Math.max(u, v))})`; // 順序をそろえて、同じ答えが2つ並ばないように
        given = tx(C([p * q, p + q, 1]));
        correct = fac(p, q);
        // 積が同じで和がちがう組を誤答に
        const alt = [];
        for (let u = -Math.abs(p * q); u <= Math.abs(p * q); u++) if (u !== 0 && (p * q) % u === 0) alt.push([u, (p * q) / u]);
        const cand = alt.filter(([u, v]) => u + v !== p + q && u <= v);
        wrongs = cand.slice(0, 2).map(([u, v]) => [fac(u, v), "MC-FACTOR-SUM"]);
        wrongs.push([fac(-p, -q), "MC-FACTOR-SIGN"], [fac(p, -q), "MC-FACTOR-SIGN"], [fac(-p, q), "MC-FACTOR-SIGN"], [fac(p + q, p * q), "MC-FACTOR-SUM"], [fac(p * q, 1), "MC-FACTOR-SUM"], [fac(-p * q, 1), "MC-FACTOR-SUM"]);
        // 積が ±1 のときなど、0 が入る・正解と同じになるものは除く
        wrongs = wrongs.filter(([w]) => w !== correct && !/[+-]0\)/.test(w));
      } else if (kind === "diff") {
        const a = r.int(2, 12);
        given = `x^{2}-${a * a}`;
        correct = `(x+${a})(x-${a})`;
        wrongs = [[`(x-${a})^{2}`, "MC-FACTOR-DIFF-SQUARE"], [`(x+${a})^{2}`, "MC-FACTOR-DIFF-SQUARE"], [`(x-${a * a})(x+1)`, "MC-FACTOR-SUM"], [`(x+${a * a})(x-1)`, "MC-FACTOR-SUM"]];
      } else if (kind === "sq") {
        const a = r.int(1, 9);
        const s = r.chance(0.5) ? 1 : -1;
        given = tx(C([a * a, s * 2 * a, 1]));
        correct = `(x${sgn(s * a)})^{2}`;
        wrongs = [[`(x${sgn(-s * a)})^{2}`, "MC-FACTOR-SIGN"], [`(x${sgn(s * a)})(x${sgn(-s * a)})`, "MC-FACTOR-DIFF-SQUARE"], [`(x${sgn(s * 2 * a)})(x${sgn(a * a)})`, "MC-FACTOR-SUM"]];
        // a=1 のとき (x±1)(x±1) は正解と同じ式になるので、別の誤答にする
        wrongs.push(a === 1 ? [`(x${sgn(s * 2)})(x${sgn(-s)})`, "MC-FACTOR-SUM"] : [`(x${sgn(s * a * a)})(x${sgn(s)})`, "MC-FACTOR-SUM"]);
      } else if (kind === "common pq") {
        const k = r.int(2, 5);
        const [p, q] = until(() => [cnz(r, -6, 7), cnz(r, -6, 7)], ([u, v]) => u + v !== 0 && u !== v);
        given = tx(C([k * p * q, k * (p + q), k]));
        const fac2 = (u, v) => `(x${sgn(Math.min(u, v))})(x${sgn(Math.max(u, v))})`;
        correct = `${k}${fac2(p, q)}`;
        wrongs = [[`(${k}x${sgn(Math.min(p, q))})(x${sgn(Math.max(p, q))})`, "MC-FACTOR-PARTIAL"], [fac2(p, q), "MC-FACTOR-PARTIAL"], [`${k}${fac2(-p, -q)}`, "MC-FACTOR-SIGN"], [`${k}${fac2(p, -q)}`, "MC-FACTOR-SIGN"]];
      } else {
        const k = r.int(2, 5);
        const a = r.int(1, 6);
        given = tx(C([-k * a * a, 0, k]));
        correct = `${k}(x+${a})(x-${a})`;
        wrongs = [[`(${k}x+${a})(x-${a})`, "MC-FACTOR-PARTIAL"], [`${k}(x-${a})^{2}`, "MC-FACTOR-DIFF-SQUARE"], [`${k}(x^{2}-${a * a})`, "MC-FACTOR-PARTIAL"], [`(x+${a})(x-${a})`, "MC-FACTOR-PARTIAL"]];
      }
      return choice({
        q: `次の式を因数分解しなさい。\n$${given}$`,
        correct: $(correct),
        wrongs: wrongs.map(([s, mc]) => [$(s), mc]),
        explain: `因数分解は展開の逆です。まず共通因数があればくくり、次に公式を使います。$x^2+(p+q)x+pq=(x+p)(x+q)$（かけて $pq$、たして $p+q$ になる2数を探す）、$a^2-b^2=(a+b)(a-b)$、$a^2\\pm2ab+b^2=(a\\pm b)^2$。答えは $${correct}$。`,
      });
    }),
  ],

  // ── 2次方程式（平方根・因数分解） ───────────────
  quad_eq_basic: [
    t("fields", (r, lv) => {
      let given, x1, x2, expl;
      if (lv === 1) {
        [x1, x2] = until(() => [cnz(r, -7, 8), cnz(r, -7, 8)], ([u, v]) => u !== v);
        given = `(x${sgn(-x1)})(x${sgn(-x2)})=0`;
        expl = `$AB=0$ ならば $A=0$ または $B=0$。$x${sgn(-x1)}=0$ より $x=${x1}$、$x${sgn(-x2)}=0$ より $x=${x2}$。`;
      } else if (lv === 2) {
        [x1, x2] = until(() => [cnz(r, -8, 9), cnz(r, -8, 9)], ([u, v]) => u !== v);
        given = `${tx(C([x1 * x2, -(x1 + x2), 1]))}=0`;
        expl = `左辺を因数分解します。$${x1 * x2}$ になる2数で、和が $${-(x1 + x2)}$ になるものは $${-x1}$ と $${-x2}$。$(x${sgn(-x1)})(x${sgn(-x2)})=0$ より $x=${x1},\\ ${x2}$。`;
      } else {
        const kind = r.int(1, 2);
        if (kind === 1) {
          const a = r.int(2, 12);
          [x1, x2] = [a, -a];
          given = `x^{2}=${a * a}`;
          expl = `$x^2=${a * a}$ の解は、$${a * a}$ の平方根。$x=\\pm${a}$。（正と負の2つ）`;
        } else {
          const [p, k] = [cnz(r, -6, 6), r.int(1, 6)];
          [x1, x2] = [p + k, p - k];
          given = `(x${sgn(-p)})^{2}=${k * k}`;
          expl = `$x${sgn(-p)}=\\pm${k}$ より、$x=${p}\\pm${k}$。$x=${p + k},\\ ${p - k}$。`;
        }
      }
      return fields({
        q: `次の2次方程式を解きなさい。（解が2つあります。順序は自由）\n$${given}$`,
        layout: "inline",
        orderFree: true,
        fields: [
          { id: "a", value: x1, pre: "$x=$" },
          { id: "b", value: x2, pre: "$,\\ x=$" },
        ],
        wrongs: [
          { values: { a: -x1, b: -x2 }, mc: "MC-QEQ-SIGN" },
          { values: { a: x1, b: x1 }, mc: "MC-QEQ-ONE-ROOT" },
          { values: { a: -x1, b: x2 }, mc: "MC-QEQ-SIGN" },
        ],
        explain: expl,
      });
    }),
  ],

  // ── 2次方程式（解の公式） ─────────────────────
  quad_eq_formula: [
    t("choice", (r, lv) => {
      const { a, b, c } = until(
        () => ({ a: lv === 1 ? 1 : r.int(1, 3), b: cnz(r, -7, 7), c: cnz(r, -6, 6) }),
        (v) => {
          const D = v.b * v.b - 4 * v.a * v.c;
          return D > 0 && sqrtParts(D).a === 1 && !Number.isInteger(Math.sqrt(D));
        },
      );
      const D = b * b - 4 * a * c;
      const eqTex = tx(C([c, b, a]));
      const sol = (num_, root, den) => `x=\\frac{${num_}\\pm\\sqrt{${root}}}{${den}}`;
      const correct = sol(-b, D, 2 * a);
      const wrongs = [
        [sol(b, D, 2 * a), "MC-QFORM-B-SIGN"],
        [sol(-b, D, a), "MC-QFORM-DENOM"],
        [sol(-b, b * b + 4 * a * c, 2 * a), "MC-QFORM-DISC"],
        [sol(-b, b * b - 4 * c, 2 * a), "MC-QFORM-DISC"],
        [sol(-b, b * b - a * c, 2 * a), "MC-QFORM-DISC"],
        [sol(-b, D, 2), "MC-QFORM-DENOM"],
      ];
      return choice({
        q: `2次方程式 $${eqTex}=0$ を解の公式で解いたとき、正しい解はどれですか。`,
        correct: $(correct),
        wrongs: wrongs.map(([s, mc]) => [$(s), mc]),
        explain: `解の公式 $x=\\dfrac{-b\\pm\\sqrt{b^2-4ac}}{2a}$ に $a=${a},\\ b=${b},\\ c=${c}$ を代入します。$b^2-4ac=${b * b}-4\\times ${a}\\times(${c})=${D}$。$x=\\dfrac{${-b}\\pm\\sqrt{${D}}}{${2 * a}}$。`,
      });
    }),
  ],

  // ── 2次方程式の利用 ───────────────────────────
  quad_eq_word: [
    t("num", (r, lv) => {
      const kind = lv === 1 ? 1 : r.pick([1, 2, 3]);
      if (kind === 1) {
        const n = r.int(4, 14);
        const prod = n * (n + 1);
        return num({
          q: `連続する2つの正の整数があり、その積が ${prod} です。小さい方の整数を求めなさい。`,
          ans: n,
          wrongs: [[-(n + 1), "MC-QWORD-NEGATIVE"], [n + 1, "MC-QWORD-SETUP"], [Q(prod, 2), "MC-QWORD-SETUP"]],
          explain: `小さい方を $x$ とすると、大きい方は $x+1$。$x(x+1)=${prod}$ を整理して $x^2+x-${prod}=0$、因数分解して $(x-${n})(x+${n + 1})=0$ より $x=${n},\\ -${n + 1}$。正の整数なので $x=${n}$。`,
        });
      }
      if (kind === 2) {
        const w = r.int(3, 9);
        const d = r.int(2, 5);
        const area = w * (w + d);
        return num({
          q: `たてが横より ${d} cm 長い長方形があり、面積は ${area} cm² です。横の長さを求めなさい。`,
          ans: w,
          post: "cm",
          wrongs: [[w + d, "MC-QWORD-SETUP"], [-(w + d), "MC-QWORD-NEGATIVE"], [Q(area, d), "MC-QWORD-SETUP"]],
          explain: `横を $x$ cm とするとたては $x+${d}$ cm。$x(x+${d})=${area}$ を整理して $x^2+${d}x-${area}=0$、因数分解して $(x-${w})(x+${w + d})=0$。長さは正なので $x=${w}$。`,
        });
      }
      const k = r.int(2, 4);
      const x = r.int(k + 1, 9);
      const m = x * x - k * x; // 2乗した数が、もとの数の k 倍より m 大きい
      return num({
        q: `ある正の数を2乗した数は、もとの数の ${k} 倍より ${m} 大きくなります。もとの数を求めなさい。`,
        ans: x,
        wrongs: [[k - x, "MC-QWORD-NEGATIVE"], [m, "MC-QWORD-SETUP"], [-x, "MC-QWORD-NEGATIVE"]],
        explain: `もとの数を $x$ とすると $x^2=${k}x+${m}$。整理して $x^2-${k}x-${m}=0$、因数分解して $(x-${x})(x+${x - k})=0$ より $x=${x}$ または $x=${k - x}$。正の数なので $x=${x}$。`,
      });
    }),
  ],
};
