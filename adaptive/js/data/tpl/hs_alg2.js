// ============================================================
// tpl/hs_alg2.js — 高校 式と方程式（数II）
//   poly_div / binomial / higher_eq / quad_roots_coef
//
//  すべて自作の数値・言い回し。答えは別の方法（筆算の割り算・展開・実際の解の数値計算）でも確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert, gcd } from "./util.js";
import { polyFromRoots, polyDivMod, laurentPow, nCr, nearly, coeffsOf } from "./hs_util.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const px = (p, order = ["x"]) => p.toTeX({ order });
const C = (cs, v = "x") => P.coeffs(cs, v);
const pn = (n) => (n < 0 ? `(${n})` : `${n}`);
/** 1次式 α x + β の TeX */
function linTex(al, be) {
  return `${al === 1 ? "" : al}x${be === 0 ? "" : sgn(be)}`;
}
/** 実数係数の2次方程式の解（D ≥ 0） */
function realRoots(a, b, c) {
  const D = b * b - 4 * a * c;
  const sq = Math.sqrt(D);
  return [(-b + sq) / (2 * a), (-b - sq) / (2 * a)];
}
const isSquare = (n) => n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
/** 組合せ nCk の TeX（文字列の中で `$` と `{` が続かないよう、関数で作る） */
const Cnk = (n, k) => `{}_{${n}}\\mathrm{C}_{${k}}`;

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

export default {
  // ── 整式の除法・剰余の定理・因数定理 ─────────────
  poly_div: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        // 3次式 P(x) を x−a／x+a／αx−β でわった余り
        const [cs, al, be] = until(
          () => [
            [r.int(-9, 9), r.int(-6, 6), r.int(-5, 5), lv === 1 ? 1 : r.pick([1, 2, -1])],
            lv === 1 ? 1 : r.pick([1, 1, 2, 2, 3]),
            lv === 1 ? r.nz(-3, 3) : r.pick([-3, -2, -1, 1, 2, 3]),
          ],
          ([c_, a_, b_]) => (a_ === 1 || gcd(a_, Math.abs(b_)) === 1) && qnum(C(c_).eval({ x: Q(b_, a_) })) !== 0,
        );
        const root = Q(be, al);
        const poly = C(cs);
        const rem = poly.eval({ x: root });
        // 独立な検算：筆算の割り算で出した余りと一致
        const dm = polyDivMod(cs, [-be, al]);
        assert(eq(dm.rem[0], rem), "余りの検算");
        const divTex = linTex(al, -be);
        const wrong = [
          [poly.eval({ x: neg(root) }), "MC-REMAINDER-SIGN"],
          [al === 1 ? Q(cs[0]) : poly.eval({ x: Q(be) }), al === 1 ? "MC-REMAINDER-CONST" : "MC-REMAINDER-BY-SUBST-COEF"],
          [al === 1 ? add(rem, Q(1)) : poly.eval({ x: Q(al) }), al === 1 ? "MC-SLIP" : "MC-REMAINDER-BY-SUBST-COEF"],
          [neg(rem), "MC-SLIP"],
        ];
        return num({
          q: `整式 $P(x)=${px(poly)}$ を $${divTex}$ でわったときの余りを求めなさい。`,
          ans: rem,
          wrongs: wrong,
          explain: `剰余の定理：$P(x)$ を $${divTex}$ でわった余りは、$${divTex}=0$ となる $x$ の値 $x=${tq(root)}$ を代入した $P(${tq(root)})$ です。$P(${tq(root)})=${tq(rem)}$。（余りは $${tq(rem)}$）`,
        });
      }
      // 割り切れる（または余りが R）ように x² の係数 k を決める
      const a = r.pick([1, 2, 3, -1, -2, -3]);
      const k = r.nz(-4, 4);
      const c1 = r.nz(-5, 5);
      const zero = r.chance(0.6);
      const c0 = zero ? -(a ** 3 + k * a * a + c1 * a) : r.int(-9, 9);
      const R = a ** 3 + k * a * a + c1 * a + c0;
      assert(zero ? R === 0 : true, "割り切れる条件の検算");
      const dm = polyDivMod([c0, c1, k, 1], [-a, 1]);
      assert(eq(dm.rem[0], Q(R)), "余りの検算(3)");
      const others = `x^{3}+kx^{2}${c1 === 1 ? "+" : c1 === -1 ? "-" : sgn(c1)}x${c0 === 0 ? "" : sgn(c0)}`;
      const kWrong = (a2) => div(Q(R - (a2 ** 3 + c1 * a2 + c0)), Q(a2 * a2)); // P(a2)=R となる k
      return num({
        q: `整式 $P(x)=${others}$ を $x${sgn(-a)}$ でわると、${zero ? "割り切れます" : `余りが $${R}$ になります`}。定数 $k$ の値を求めなさい。`,
        ans: k,
        wrongs: [[kWrong(-a), "MC-REMAINDER-SIGN"], [neg(Q(k)), "MC-SLIP"], [Q(k + 1), "MC-SLIP"], [Q(k - 1), "MC-SLIP"]],
        explain: `剰余の定理より、$P(${a})=${zero ? "0" : R}$。$P(${a})=${a ** 3}+k\\times ${pn(a * a)}${sgn(c1 * a)}${sgn(c0)}=${a * a}k${sgn(a ** 3 + c1 * a + c0)}$。これが $${zero ? "0" : R}$ に等しいので $${a * a}k=${R - (a ** 3 + c1 * a + c0)}$、$k=${k}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 筆算の割り算：商と余り
        if (lv === 1) {
          const a = r.nz(-3, 3);
          const cs = [r.int(-9, 9), r.int(-6, 6), r.int(-5, 5), 1];
          const dm = polyDivMod(cs, [-a, 1]);
          const [q0, q1, q2] = dm.quo;
          assert(eq(q2, Q(1)), "商の最高次");
          const rem = dm.rem[0];
          // 再構成による検算
          const recon = P.lin(1, -a).mul(C([qnum(q0), qnum(q1), 1])).add(P.c(rem));
          assert(recon.equals(C(cs)), "割り算の検算");
          return fields({
            q: `$${px(C(cs))}$ を $x${sgn(-a)}$ でわったときの商を $x^2+bx+c$、余りを $r$ とします。$b$、$c$、$r$ の値を答えなさい。`,
            fields: [
              { id: "b", value: q1, pre: "$b=$" },
              { id: "c", value: q0, pre: "$c=$" },
              { id: "r", value: rem, pre: "$r=$" },
            ],
            wrongs: (() => {
              const dm2 = polyDivMod(cs, [a, 1]);
              return [
                { values: { b: dm2.quo[1], c: dm2.quo[0], r: dm2.rem[0] }, mc: "MC-DIVISION-SIGN" },
                { values: { b: q1, c: q0, r: Q(cs[0]) }, mc: "MC-DIVISION-REMAINDER" },
                { values: { b: Q(cs[2]), c: Q(cs[1]), r: Q(cs[0]) }, mc: "MC-DIVISION-DROP" },
              ];
            })(),
            explain: `組立除法（または筆算）で割ります。$x^3$ の係数 $1$ をそのまま下ろし、$x=${a}$ をかけて次の係数にたす、を順にくり返します。係数は $1,\\ ${q1.n},\\ ${q0.n}$ と順に決まり、最後の数 $${rem.n}$ が余りです。商は $x^2${sgn(qnum(q1))}x${sgn(qnum(q0))}$、余りは $${rem.n}$。`,
          });
        }
        if (lv === 2) {
          const a = r.nz(-3, 3);
          const lead = r.pick([2, 3, -2]);
          const cs = [r.int(-9, 9), r.int(-6, 6), r.int(-5, 5), lead];
          const dm = polyDivMod(cs, [a, 1]); // x + a でわる
          const [q0, q1, q2] = dm.quo;
          const rem = dm.rem[0];
          const recon = P.lin(1, a).mul(C([qnum(q0), qnum(q1), qnum(q2)])).add(P.c(rem));
          assert(recon.equals(C(cs)), "割り算(2)の検算");
          const dmw = polyDivMod(cs, [-a, 1]);
          return fields({
            q: `$${px(C(cs))}$ を $x${sgn(a)}$ でわったときの商を $ax^2+bx+c$、余りを $r$ とします。$a$、$b$、$c$、$r$ の値を答えなさい。`,
            fields: [
              { id: "a", value: q2, pre: "$a=$" },
              { id: "b", value: q1, pre: "$b=$" },
              { id: "c", value: q0, pre: "$c=$" },
              { id: "r", value: rem, pre: "$r=$" },
            ],
            wrongs: [
              { values: { a: dmw.quo[2], b: dmw.quo[1], c: dmw.quo[0], r: dmw.rem[0] }, mc: "MC-DIVISION-SIGN" },
              { values: { a: q2, b: q1, c: q0, r: Q(cs[0]) }, mc: "MC-DIVISION-REMAINDER" },
              { values: { a: Q(1), b: q1, c: q0, r: rem }, mc: "MC-DIVISION-DROP" },
            ],
            explain: `$x${sgn(a)}=x-(${-a})$ でわるので、組立除法では $x=${-a}$ を使います。係数 $${lead},\\ ${cs[2]},\\ ${cs[1]},\\ ${cs[0]}$ を順に処理して、商の係数は $${q2.n},\\ ${q1.n},\\ ${q0.n}$、余りは $${rem.n}$ と決まります。（$x-(-a)$ の形にして $-a$ を使うのがコツ）`,
          });
        }
        // 3次式 ÷ 2次式：商 u x + v、余り w x + z（作ってから検算）
        const [p1, q1_] = [r.nz(-3, 3), r.nz(-4, 4)];
        const [u, v, w, z] = [r.pick([1, 2, -1]), r.nz(-4, 4), r.nz(-3, 3), r.nz(-5, 5)];
        const D2 = C([q1_, p1, 1]);
        const Pp = D2.mul(C([v, u])).add(C([z, w]));
        const cs = coeffsOf(Pp, 3).map(qnum);
        const dm = polyDivMod(cs, [q1_, p1, 1]);
        assert(eq(dm.quo[1], Q(u)) && eq(dm.quo[0], Q(v)) && eq(dm.rem[1], Q(w)) && eq(dm.rem[0], Q(z)), "3次÷2次の検算");
        return fields({
          q: `$${px(Pp)}$ を $${px(D2)}$ でわったときの商を $ax+b$、余りを $cx+d$ とします。$a$、$b$、$c$、$d$ の値を答えなさい。`,
          fields: [
            { id: "a", value: u, pre: "$a=$" },
            { id: "b", value: v, pre: "$b=$" },
            { id: "c", value: w, pre: "$c=$" },
            { id: "d", value: z, pre: "$d=$" },
          ],
          wrongs: [
            { values: { a: u, b: v, c: z, d: w }, mc: "MC-DIVISION-REMAINDER" },
            { values: { a: u, b: Q(cs[1]), c: w, d: z }, mc: "MC-DIVISION-DROP" },
            { values: { a: u, b: v, c: w, d: z + 1 }, mc: "MC-SLIP" },
          ],
          explain: `次数の高い項から順に消していきます。$x^3$ を消すために商の最初の項は $${u === 1 ? "" : u}x$。$${u === 1 ? "" : u}x\\times(${px(D2)})$ をひくと次の式が残り、その最高次の項から商の次の項 $${v}$ が決まります。最後に残った $${px(C([z, w]))}$ が余り（2次式より次数が低いのでここで止める）。答えは $a=${u}$、$b=${v}$、$c=${w}$、$d=${z}$。`,
        });
      },
      { id: "b", db: 0.3 },
    ),
    t(
      "choice",
      (r, lv) => {
        // 因数定理：次のうち P(x) の因数はどれか
        let roots;
        let leadFactor = null; // L3: (2x + s)
        let poly;
        if (lv === 1) {
          roots = until(() => [r.nz(-3, 3), r.nz(-3, 3), r.nz(-3, 3)], (v) => new Set(v).size === 3);
          poly = polyFromRoots(roots);
        } else if (lv === 2) {
          roots = until(() => [r.nz(-3, 3), r.nz(-3, 3), r.nz(-3, 3), r.nz(-3, 3)], (v) => new Set(v).size === 4);
          poly = polyFromRoots(roots);
        } else {
          const s = r.pick([1, -1]);
          roots = until(() => [r.nz(-3, 3), r.nz(-3, 3)], (v) => v[0] !== v[1] && v[0] !== -s && v[1] !== -s);
          leadFactor = [2, s];
          poly = P.lin(2, s).mul(polyFromRoots(roots));
        }
        const isFactor = (al, be) => qnum(poly.eval({ x: Q(-be, al) })) === 0;
        // 正解：根のひとつ、または (2x+s)
        const correct = leadFactor ? leadFactor : [1, -r.pick(roots)];
        assert(isFactor(correct[0], correct[1]), "因数の検算");
        const cand = [];
        const tagged = leadFactor ? [[2, -leadFactor[1], "MC-FACTOR-THEOREM-SIGN"], [1, leadFactor[1], "MC-FACTOR-THEOREM-COEF"], [1, -leadFactor[1], "MC-FACTOR-THEOREM-COEF"]] : [[1, -correct[1], "MC-FACTOR-THEOREM-SIGN"]];
        for (const [al, be, mc] of tagged) if (!isFactor(al, be)) cand.push([al, be, mc]);
        for (const be of [-4, -3, -2, -1, 1, 2, 3, 4]) if (!isFactor(1, be) && !cand.some((c) => c[0] === 1 && c[1] === be)) cand.push([1, be, null]);
        const wrong = cand.map(([al, be, mc]) => [linTex(al, be), mc]);
        const correctTex = linTex(correct[0], correct[1]);
        return choice({
          q: `$P(x)=${px(poly)}$ の因数であるものを、次から1つ選びなさい。`,
          correct: $(correctTex),
          wrongs: collect(wrong, correctTex),
          explain: `因数定理：$P(a)=0$ となる $a$ があれば、$P(x)$ は $x-a$ を因数にもちます。${leadFactor ? `$(2x${sgn(leadFactor[1])})$ の場合は $x=${tq(Q(-leadFactor[1], 2))}$ を代入します。` : ""}$${linTex(correct[0], correct[1])}=0$ となる $x=${tq(Q(-correct[1], correct[0]))}$ を $P(x)$ に代入すると $0$ になるので、$${correctTex}$ が因数です。（他の選択肢は代入しても $0$ になりません）`,
        });
      },
      { id: "c", db: 0.2 },
    ),
  ],

  // ── 二項定理 ─────────────────────────────────
  binomial: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        // (a x + b)^n の x^k の係数
        const n = lv === 1 ? r.int(3, 5) : r.int(4, 6);
        const a = lv === 1 ? 1 : r.pick([2, 3]);
        const b = r.pick(lv === 1 ? [1, 2, 3, -1, -2, -3] : [1, 2, -1, -2, -3]);
        const k = r.int(1, n - 1);
        const ans = nCr(n, k) * a ** k * b ** (n - k);
        assert(qnum(P.lin(a, b).pow(n).coeff(k)) === ans, "二項定理の検算");
        return num({
          q: `$(${a === 1 ? "" : a}x${sgn(b)})^{${n}}$ を展開したとき、$${k === 1 ? "x" : `x^{${k}}`}$ の項の係数を求めなさい。`,
          ans,
          wrongs: [
            [nCr(n, k) * a ** k, "MC-BINOM-COEF-POWER"],
            [nCr(n, k) * a ** (n - k) * b ** k, "MC-BINOM-INDEX"],
            [a ** k * b ** (n - k), "MC-BINOM-NO-COMB"],
            [nCr(n, k) * b ** (n - k), "MC-BINOM-COEF-POWER"],
          ],
          explain: `二項定理：$(a+b)^n$ の展開の一般項は $${Cnk("n", "r")}\\,a^{n-r}b^{r}$（$b$ を $r$ 個かける項）です。ここで $a=${a === 1 ? "" : a}x$、$b=${b}$、$n=${n}$。$x^{${k}}$ の項は $a$ が $${k}$ 個、$b$ が $${n - k}$ 個かけられる項なので $r=${n - k}$。$${Cnk(n, n - k)}\\times ${a}^{${k}}\\times(${b})^{${n - k}}=${nCr(n, k)}\\times ${a ** k}\\times ${pn(b ** (n - k))}=${ans}$。`,
        });
      }
      // (x^p + c x^{-q})^n の x^m の係数（m=0 なら定数項）
      const [p, q, n, k, c] = until(
        () => [r.pick([1, 2]), r.pick([1, 2]), r.int(4, 7), r.int(1, 6), r.pick([1, -1, 2, -2])],
        ([, , nn, kk]) => kk < nn,
      );
      const m = p * (n - k) - q * k;
      const ans = nCr(n, k) * c ** k;
      const lp = laurentPow({ [p]: 1, [-q]: c }, n);
      assert(qnum(lp[m] ?? Q(0)) === ans, "ローラン展開の検算");
      const second = `${c < 0 ? "-" : "+"}\\dfrac{${Math.abs(c)}}{${q === 1 ? "x" : `x^{${q}}`}}`;
      const target = m === 0 ? "定数項" : `$${m === 1 ? "x" : `x^{${m}}`}$ の項の係数`;
      return num({
        q: `$\\left(${p === 1 ? "x" : `x^{${p}}`}${second}\\right)^{${n}}$ を展開したとき、${target}を求めなさい。`,
        ans,
        wrongs: [[nCr(n, k), "MC-BINOM-COEF-POWER"], [c ** k, "MC-BINOM-NO-COMB"], [nCr(n, n - k - 1 < 0 ? 0 : n - k - 1) * c ** (k + 1), "MC-BINOM-INDEX"], [nCr(n, k) * c ** (n - k), "MC-BINOM-INDEX"]],
        explain: `一般項は $${Cnk(n, "k")}\\,(${p === 1 ? "x" : `x^{${p}}`})^{${n}-k}\\left(${tq(Q(c))}\\cdot x^{-${q}}\\right)^{k}$。$x$ の指数は $${p}(${n}-k)-${q}k=${p * n}-${p + q}k$。これが $${m}$ になるのは $k=${k}$ のとき。係数は $${Cnk(n, k)}\\times(${c})^{${k}}=${nCr(n, k)}\\times ${pn(c ** k)}=${ans}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          const n = r.int(4, 9);
          return num({
            q: `$${Cnk(n, 0)}+${Cnk(n, 1)}+${Cnk(n, 2)}+\\cdots+${Cnk(n, n)}$ の値を求めなさい。`,
            ans: 2 ** n,
            wrongs: [[2 * n, "MC-BINOM-SUM"], [2 ** n - 1, "MC-BINOM-SUM"], [2 ** (n + 1), "MC-BINOM-SUM"], [n * n, "MC-BINOM-SUM"]],
            explain: `$(1+x)^n=\\sum_{k=0}^{n} ${Cnk("n", "k")}x^k$ に $x=1$ を代入すると、$${Cnk("n", 0)}+${Cnk("n", 1)}+\\cdots+${Cnk("n", "n")}=2^n$。$n=${n}$ なので $2^{${n}}=${2 ** n}$。`,
          });
        }
        if (lv === 2) {
          // 係数の総和：x = 1 を代入
          const a = r.pick([1, 2, 3]);
          const b = r.pick([1, 2, -1, -2, -3]);
          const n = r.int(3, 5);
          const ans = (a + b) ** n;
          assert(P.lin(a, b).pow(n).eval({ x: 1 }).n === ans, "係数の総和の検算");
          return num({
            q: `$(${a === 1 ? "" : a}x${sgn(b)})^{${n}}$ を展開したときの、すべての項の係数の和を求めなさい。`,
            ans,
            wrongs: [[b ** n, "MC-BINOM-SUM"], [a ** n + b ** n, "MC-BINOM-SUM"], [(a * b) ** n, "MC-BINOM-SUM"], [a + b, "MC-BINOM-SUM"]],
            explain: `展開式に $x=1$ を代入すると、各項の $x$ が $1$ になって、係数の和がそのまま出ます。$(${a}\\times 1${sgn(b)})^{${n}}=${a + b}^{${n}}=${ans}$。（展開しなくても求められます）`,
          });
        }
        // Σ C(n,k) m^k = (1+m)^n
        const n = r.int(3, 6);
        const m = r.pick([2, 3, -2, 4]);
        let ans = 0;
        for (let k = 0; k <= n; k++) ans += nCr(n, k) * m ** k;
        assert(ans === (1 + m) ** n, "二項定理の和の検算");
        const mt = m < 0 ? `(${m})` : `${m}`;
        const term = (k) => (k === 0 ? Cnk(n, 0) : `${k === 1 ? mt : `${mt}^{${k}}`}\\,${Cnk(n, k)}`);
        return num({
          q: `$${term(0)}+${term(1)}+${term(2)}+\\cdots+${term(n)}$ の値を求めなさい。`,
          ans,
          wrongs: [[m ** n, "MC-BINOM-SUM"], [2 ** n, "MC-BINOM-SUM"], [n * (1 + m), "MC-BINOM-SUM"], [(1 + m) ** n + 1, "MC-SLIP"]],
          explain: `二項定理 $(1+x)^n=\\sum_{k=0}^{n} ${Cnk("n", "k")}x^k$ の $x$ に $${m}$ を代入したものです。$(1+${pn(m)})^{${n}}=${pn(1 + m)}^{${n}}=${ans}$。`,
        });
      },
      { id: "b", db: 0.15 },
    ),
  ],

  // ── 高次方程式 ───────────────────────────────
  higher_eq: [
    t("fields", (r, lv) => {
      let roots;
      let distinct;
      let poly;
      if (lv === 1) {
        roots = until(() => [r.nz(-3, 3), r.nz(-3, 3), r.nz(-3, 3)], (v) => new Set(v).size === 3);
        distinct = roots;
        poly = polyFromRoots(roots);
      } else if (lv === 2) {
        const bi = r.chance(0.5);
        if (bi) {
          const [m, n] = until(() => [r.int(1, 3), r.int(2, 4)], ([u, v]) => u < v);
          roots = [-n, -m, m, n];
        } else roots = until(() => [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)], (v) => new Set(v).size === 4);
        distinct = roots;
        poly = polyFromRoots(roots);
      } else {
        // 重解をふくむ：(x−a)²(x−b)。異なる解をすべて答える
        const [a, b] = until(() => [r.nz(-3, 3), r.nz(-3, 3)], ([u, v]) => u !== v);
        roots = [a, a, b];
        distinct = [a, b];
        poly = polyFromRoots(roots);
      }
      // 検算：各解を代入すると 0
      for (const x of distinct) assert(eq(poly.eval({ x }), Q(0)), "解の検算");
      const ids = distinct.map((_, i) => `x${i + 1}`);
      const bad1 = distinct.map((x) => -x);
      const wrongs = [{ values: Object.fromEntries(ids.map((id, i) => [id, bad1[i]])), mc: "MC-HIGHER-SIGN" }];
      if (distinct.length >= 3) wrongs.push({ values: Object.fromEntries(ids.map((id, i) => [id, i === distinct.length - 1 ? distinct[0] : distinct[i]])), mc: "MC-HIGHER-MISS-ROOT" });
      else wrongs.push({ values: Object.fromEntries(ids.map((id, i) => [id, i === 1 ? -distinct[1] : distinct[i]])), mc: "MC-HIGHER-SIGN" });
      const fac = roots.map((x) => (x === 0 ? "x" : `(x${sgn(-x)})`)).join("");
      return fields({
        q: `方程式 $${px(poly)}=0$ の${lv === 3 ? "異なる実数解をすべて" : "解をすべて"}求めなさい。`,
        orderFree: true,
        fields: ids.map((id, i) => ({ id, value: distinct[i], pre: "$x=$" })),
        wrongs,
        explain: `因数定理で解を1つ見つけ、因数分解します。${lv === 3 ? "" : ""}左辺は $${fac}$ と因数分解できます（たとえば $x=${roots[0]}$ を代入すると $0$ になるので、${roots[0] === 0 ? "$x$" : `$(x${sgn(-roots[0])})$`} を因数にもちます）。各因数が $0$ になる $x$ が解で、${lv === 3 ? `$(x${sgn(-roots[0])})^2$ は重解 $x=${roots[0]}$ なので、異なる解は ` : "答えは "}$x=${distinct.join(",\\ ")}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 異なる実数解の個数（因数の種類から決まる）
        const sqNon = [2, 3, 5, 6, 7, 8, 10];
        const lin = (x) => P.lin(1, -x);
        let factors; // [Poly, 異なる実数解の個数, 重複度による「重複込み」の個数, 表示用TeX(省略可)]
        const rep_ = (a, k) => [lin(a).pow(k), 1, k, `(x${sgn(-a)})^{${k}}`];
        if (lv === 1) {
          const a = r.nz(-3, 3);
          const m = r.int(1, 4);
          const pick = r.pick(["irr", "lin3", "sq"]);
          if (pick === "irr") factors = [[lin(a), 1, 1], [C([m, 0, 1]), 0, 0]];
          else if (pick === "lin3") {
            const [b, c] = until(() => [r.nz(-3, 3), r.nz(-3, 3)], ([u, v]) => u !== v && u !== a && v !== a);
            factors = [[lin(a), 1, 1], [lin(b), 1, 1], [lin(c), 1, 1]];
          } else {
            const s = r.pick(sqNon);
            factors = [[lin(a), 1, 1], [C([-s, 0, 1]), 2, 2]];
          }
        } else if (lv === 2) {
          const pick = r.pick(["irr-sq", "sq-sq", "irr-irr", "lin-lin-irr"]);
          if (pick === "irr-sq") factors = [[C([r.int(1, 5), 0, 1]), 0, 0], [C([-r.pick(sqNon), 0, 1]), 2, 2]];
          else if (pick === "sq-sq") {
            const [s1, s2] = until(() => [r.pick(sqNon), r.pick(sqNon)], ([u, v]) => u < v);
            factors = [[C([-s1, 0, 1]), 2, 2], [C([-s2, 0, 1]), 2, 2]];
          } else if (pick === "irr-irr") {
            const [m1, m2] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u < v);
            factors = [[C([m1, 0, 1]), 0, 0], [C([m2, 0, 1]), 0, 0]];
          } else {
            const [b, c] = until(() => [r.nz(-3, 3), r.nz(-3, 3)], ([u, v]) => u !== v);
            factors = [[lin(b), 1, 1], [lin(c), 1, 1], [C([r.int(1, 4), 0, 1]), 0, 0]];
          }
        } else {
          const pick = r.pick(["dbl-lin", "dbl-irr", "triple", "dbl-dbl"]);
          const [a, b] = until(() => [r.nz(-3, 3), r.nz(-3, 3)], ([u, v]) => u !== v);
          if (pick === "dbl-lin") factors = [rep_(a, 2), [lin(b), 1, 1]];
          else if (pick === "dbl-irr") factors = [rep_(a, 2), [C([r.int(1, 4), 0, 1]), 0, 0]];
          else if (pick === "triple") factors = [rep_(a, 3)];
          else factors = [rep_(a, 2), rep_(b, 2)];
        }
        const poly = factors.reduce((acc, [f]) => acc.mul(f), P.c(1));
        const ans = factors.reduce((s, f) => s + f[1], 0);
        const withMult = factors.reduce((s, f) => s + f[2], 0);
        const complexAlso = poly.degree();
        return num({
          q: `方程式 $${px(poly)}=0$ の、異なる実数解は何個ありますか。`,
          ans,
          wrongs: [[withMult, "MC-HIGHER-MULTIPLICITY"], [complexAlso, "MC-HIGHER-DEGREE"], [ans + 1, "MC-SLIP"], [Math.max(ans - 1, 0), "MC-SLIP"]],
          explain: `左辺を因数分解します：$${factors.map(([f, , , tex]) => tex ?? (f.t.size > 1 ? `(${px(f)})` : px(f))).join("")}$。${factors.map(([f, k, , tex]) => `$${tex ?? (f.t.size > 1 ? `(${px(f)})` : px(f))}$ から実数解が ${k} 個`).join("、")}（同じ解は1個と数える）。合計 $${ans}$ 個。（$x^2+m$ の形で $m>0$ のものは実数解をもたない）`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 解と係数の関係 ───────────────────────────
  quad_roots_coef: [
    t("num", (r, lv) => {
      // a x² + b x + c = 0 で D>0 かつ完全平方でない（解が無理数）
      const a = lv === 1 ? 1 : r.pick([1, 2, 3]);
      const [b, c] = until(
        () => [r.nz(-8, 8), r.nz(-6, 6)],
        ([bb, cc]) => {
          const D = bb * bb - 4 * a * cc;
          return D > 0 && !isSquare(D);
        },
      );
      const s = Q(-b, a);
      const p = Q(c, a);
      const [al, be] = realRoots(a, b, c);
      let kind;
      let ans;
      let fnum;
      let label;
      let how;
      if (lv === 1) {
        kind = r.pick(["sum", "prod"]);
        ans = kind === "sum" ? s : p;
        fnum = kind === "sum" ? al + be : al * be;
        label = kind === "sum" ? "\\alpha+\\beta" : "\\alpha\\beta";
        how = kind === "sum" ? `$\\alpha+\\beta=-\\dfrac{b}{a}=-\\dfrac{${b}}{${a}}=${tq(ans)}$` : `$\\alpha\\beta=\\dfrac{c}{a}=\\dfrac{${c}}{${a}}=${tq(ans)}$`;
      } else if (lv === 2) {
        kind = r.pick(["sq", "recip"]);
        if (kind === "recip") {
          ans = div(s, p);
          fnum = 1 / al + 1 / be;
          label = "\\dfrac{1}{\\alpha}+\\dfrac{1}{\\beta}";
          how = `$\\dfrac{1}{\\alpha}+\\dfrac{1}{\\beta}=\\dfrac{\\alpha+\\beta}{\\alpha\\beta}=\\dfrac{${tq(s)}}{${tq(p)}}=${tq(ans)}$`;
        } else {
          ans = sub(mul(s, s), mul(p, Q(2)));
          fnum = al * al + be * be;
          label = "\\alpha^2+\\beta^2";
          how = `$\\alpha^2+\\beta^2=(\\alpha+\\beta)^2-2\\alpha\\beta=(${tq(s)})^2-2\\times(${tq(p)})=${tq(ans)}$`;
        }
      } else {
        kind = r.pick(["diff", "cube"]);
        if (kind === "diff") {
          ans = sub(mul(s, s), mul(p, Q(4)));
          fnum = (al - be) ** 2;
          label = "(\\alpha-\\beta)^2";
          how = `$(\\alpha-\\beta)^2=(\\alpha+\\beta)^2-4\\alpha\\beta=(${tq(s)})^2-4\\times(${tq(p)})=${tq(ans)}$`;
        } else {
          ans = sub(mul(mul(s, s), s), mul(mul(Q(3), s), p));
          fnum = al ** 3 + be ** 3;
          label = "\\alpha^3+\\beta^3";
          how = `$\\alpha^3+\\beta^3=(\\alpha+\\beta)^3-3\\alpha\\beta(\\alpha+\\beta)=(${tq(s)})^3-3\\times(${tq(p)})\\times(${tq(s)})=${tq(ans)}$`;
        }
      }
      nearly(fnum, qnum(ans), "解と係数の関係の検算", 1e-9);
      const wrong = {
        sum: [[neg(s), "MC-VIETA-SIGN"], [Q(b, a), "MC-VIETA-SIGN"], [p, "MC-VIETA-SWAP"]],
        prod: [[neg(p), "MC-VIETA-SIGN"], [s, "MC-VIETA-SWAP"], [Q(-c, a), "MC-VIETA-SIGN"]],
        sq: [[mul(s, s), "MC-VIETA-SQ"], [add(mul(s, s), mul(p, Q(2))), "MC-VIETA-SQ"], [add(s, neg(mul(p, Q(2)))), "MC-VIETA-SQ"]],
        recip: [[div(p, s), "MC-VIETA-RECIP"], [add(s, p), "MC-VIETA-RECIP"], [neg(div(s, p)), "MC-VIETA-SIGN"]],
        diff: [[sub(mul(s, s), mul(p, Q(2))), "MC-VIETA-SQ"], [sub(s, mul(p, Q(4))), "MC-VIETA-SQ"], [add(mul(s, s), mul(p, Q(4))), "MC-VIETA-SQ"]],
        cube: [[mul(mul(s, s), s), "MC-VIETA-SQ"], [sub(mul(mul(s, s), s), mul(s, p)), "MC-VIETA-SQ"], [add(mul(mul(s, s), s), mul(mul(Q(3), s), p)), "MC-VIETA-SQ"]],
      }[kind];
      const eqTex = px(C([c, b, a]));
      return num({
        q: `2次方程式 $${eqTex}=0$ の2つの解を $\\alpha$、$\\beta$ とするとき、$${label}$ の値を求めなさい。（解そのものは求めなくてかまいません）`,
        ans,
        wrongs: wrong,
        reduced: true,
        explain: `解と係数の関係：$ax^2+bx+c=0$ の2解について $\\alpha+\\beta=-\\dfrac{b}{a}$、$\\alpha\\beta=\\dfrac{c}{a}$。ここでは $\\alpha+\\beta=${tq(s)}$、$\\alpha\\beta=${tq(p)}$。${how}。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        if (lv === 1) {
          const [al, be] = until(() => [r.nz(-6, 6), r.nz(-6, 6)], ([u, v]) => u !== v);
          return fields({
            q: `$${al}$ と $${be}$ を解とする2次方程式のうち、$x^2+px+q=0$ の形のものを求めます。$p$、$q$ の値を答えなさい。`,
            fields: [
              { id: "p", value: -(al + be), pre: "$p=$" },
              { id: "q", value: al * be, pre: "$q=$" },
            ],
            wrongs: [{ values: { p: al + be, q: al * be }, mc: "MC-VIETA-SIGN" }, { values: { p: -(al + be), q: -(al * be) }, mc: "MC-VIETA-SIGN" }, { values: { p: al * be, q: -(al + be) }, mc: "MC-VIETA-SWAP" }],
            explain: `解が $\\alpha$、$\\beta$ で $x^2$ の係数が $1$ の2次方程式は $(x-\\alpha)(x-\\beta)=x^2-(\\alpha+\\beta)x+\\alpha\\beta=0$。$\\alpha+\\beta=${al + be}$、$\\alpha\\beta=${al * be}$ なので $x^2${sgn(-(al + be))}x${sgn(al * be)}=0$。$p=${-(al + be)}$、$q=${al * be}$。`,
          });
        }
        if (lv === 2) {
          // m ± √n を解とする
          const m = r.nz(-4, 4);
          const n = r.pick([2, 3, 5, 6, 7, 10]);
          const pp = -2 * m;
          const qq = m * m - n;
          const rr = realRoots(1, pp, qq);
          nearly(rr[0] + rr[1], 2 * m, "共役な解の和");
          nearly(rr[0] * rr[1], qq, "共役な解の積");
          return fields({
            q: `$${m}+\\sqrt{${n}}$ と $${m}-\\sqrt{${n}}$ を解とする2次方程式のうち、$x^2+px+q=0$ の形のものを求めます。$p$、$q$ の値を答えなさい。`,
            fields: [
              { id: "p", value: pp, pre: "$p=$" },
              { id: "q", value: qq, pre: "$q=$" },
            ],
            wrongs: [{ values: { p: 2 * m, q: qq }, mc: "MC-VIETA-SIGN" }, { values: { p: pp, q: m * m + n }, mc: "MC-SQUARE-CROSS-TERM" }, { values: { p: pp, q: -n }, mc: "MC-SQUARE-CROSS-TERM" }],
            explain: `2つの解の和は $(${m}+\\sqrt{${n}})+(${m}-\\sqrt{${n}})=${2 * m}$、積は $(${m}+\\sqrt{${n}})(${m}-\\sqrt{${n}})=${m}^2-${n}=${qq}$（$(a+b)(a-b)=a^2-b^2$）。$x^2-(\\text{和})x+(\\text{積})=0$ より $p=${pp}$、$q=${qq}$。`,
          });
        }
        // x² + b x + c = 0 の2解 α, β に対して、変換した2数を解とする方程式
        const [b, c] = until(() => [r.nz(-6, 6), r.nz(-5, 5)], ([bb, cc]) => bb * bb - 4 * cc > 0);
        const kind = r.pick(["shift", "scale", "recip"]);
        const s = -b;
        const p0 = c;
        const [al, be] = realRoots(1, b, c);
        let newS;
        let newP;
        let desc;
        let numS;
        let numP;
        if (kind === "shift") {
          const u = r.nz(-3, 3);
          newS = Q(s + 2 * u);
          newP = Q(p0 + u * s + u * u);
          desc = `$\\alpha${sgn(u)}$、$\\beta${sgn(u)}$`;
          numS = al + u + be + u;
          numP = (al + u) * (be + u);
        } else if (kind === "scale") {
          const k = r.pick([2, 3, -1, -2]);
          newS = Q(k * s);
          newP = Q(k * k * p0);
          desc = `$${k === -1 ? "-" : k}\\alpha$、$${k === -1 ? "-" : k}\\beta$`;
          numS = k * al + k * be;
          numP = k * al * k * be;
        } else {
          newS = Q(s, p0);
          newP = Q(1, p0);
          desc = `$\\dfrac{1}{\\alpha}$、$\\dfrac{1}{\\beta}$`;
          numS = 1 / al + 1 / be;
          numP = 1 / (al * be);
        }
        nearly(numS, qnum(newS), "変換後の和の検算", 1e-9);
        nearly(numP, qnum(newP), "変換後の積の検算", 1e-9);
        return fields({
          q: `2次方程式 $x^2${sgn(b)}x${sgn(c)}=0$ の2つの解を $\\alpha$、$\\beta$ とします。${desc} を解とする2次方程式 $x^2+px+q=0$ の $p$、$q$ の値を答えなさい。`,
          fields: [
            { id: "p", value: neg(newS), pre: "$p=$" },
            { id: "q", value: newP, pre: "$q=$" },
          ],
          wrongs: [
            { values: { p: newS, q: newP }, mc: "MC-VIETA-SIGN" },
            { values: { p: Q(-s), q: Q(p0) }, mc: "MC-VIETA-NOT-TRANSFORMED" },
            { values: { p: neg(newS), q: neg(newP) }, mc: "MC-VIETA-SIGN" },
          ],
          explain: `元の方程式から $\\alpha+\\beta=${s}$、$\\alpha\\beta=${p0}$。新しい2数の和は $${tq(newS)}$、積は $${tq(newP)}$（和と積を $\\alpha+\\beta$、$\\alpha\\beta$ で表して代入）。$x^2-(\\text{和})x+(\\text{積})=0$ なので $p=${tq(neg(newS))}$、$q=${tq(newP)}$。`,
        });
      },
      { id: "b", db: 0.15 },
    ),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 1つの解が他の解の m 倍
          const m = r.pick([2, 3]);
          const a0 = r.int(1, 4) * r.pick([1, -1]);
          const sVal = (1 + m) * a0;
          const kVal = m * a0 * a0;
          const rr = realRoots(1, -sVal, kVal);
          nearly(Math.max(rr[0] / rr[1], rr[1] / rr[0]), m, "解の比の検算");
          return num({
            q: `2次方程式 $x^2${sgn(-sVal)}x+k=0$ の1つの解が、もう1つの解の $${m}$ 倍であるとき、定数 $k$ の値を求めなさい。`,
            ans: kVal,
            wrongs: [[m * sVal, "MC-VIETA-SWAP"], [sVal * sVal / (1 + m), "MC-VIETA-SWAP"], [a0 * a0, "MC-VIETA-SWAP"], [-kVal, "MC-VIETA-SIGN"]].filter(([v]) => Number.isInteger(v)),
            explain: `2つの解を $\\alpha$、$${m}\\alpha$ とおきます。解と係数の関係より、和：$\\alpha+${m}\\alpha=${sVal}$ から $\\alpha=${a0}$。積：$k=\\alpha\\times${m}\\alpha=${m}\\alpha^2=${m}\\times ${a0 * a0}=${kVal}$。`,
          });
        }
        if (lv === 2) {
          // 2解の差
          const [al, be] = until(() => [r.int(-6, 6), r.int(-6, 6)], ([u, v]) => u > v && u - v >= 1);
          const sVal = al + be;
          const dVal = al - be;
          const kVal = al * be;
          return num({
            q: `2次方程式 $x^2${sgn(-sVal)}x+k=0$ の2つの解の差が $${dVal}$ であるとき、定数 $k$ の値を求めなさい。（解の差は、大きい方から小さい方をひいたもの）`,
            ans: kVal,
            wrongs: [[(sVal * sVal + dVal * dVal) / 4, "MC-VIETA-SQ"], [(sVal * sVal - dVal) / 4, "MC-VIETA-SQ"], [sVal * sVal - dVal * dVal, "MC-VIETA-SQ"], [-kVal, "MC-VIETA-SIGN"]].filter(([v]) => Number.isInteger(v)),
            explain: `2つの解を $\\alpha>\\beta$ とすると、$\\alpha+\\beta=${sVal}$、$\\alpha-\\beta=${dVal}$。この2式から $\\alpha=${al}$、$\\beta=${be}$。よって $k=\\alpha\\beta=${kVal}$。（または $(\\alpha-\\beta)^2=(\\alpha+\\beta)^2-4\\alpha\\beta$ より $${dVal * dVal}=${sVal * sVal}-4k$）`,
          });
        }
        // α² + β² が与えられた値
        const [sVal, kVal] = until(() => [r.nz(-6, 6), r.int(-6, 6)], ([u, v]) => u * u - 4 * v > 0);
        const g = sVal * sVal - 2 * kVal;
        const rr = realRoots(1, -sVal, kVal);
        nearly(rr[0] ** 2 + rr[1] ** 2, g, "2乗和の検算", 1e-9);
        return num({
          q: `2次方程式 $x^2${sgn(-sVal)}x+k=0$ の2つの解 $\\alpha$、$\\beta$ について、$\\alpha^2+\\beta^2=${g}$ が成り立ちます。定数 $k$ の値を求めなさい。`,
          ans: kVal,
          wrongs: [[(sVal * sVal + g) / 2, "MC-VIETA-SQ"], [sVal * sVal - g, "MC-VIETA-SQ"], [g - sVal, "MC-VIETA-SQ"], [-kVal, "MC-VIETA-SIGN"]].filter(([v]) => Number.isInteger(v)),
          explain: `解と係数の関係より $\\alpha+\\beta=${sVal}$、$\\alpha\\beta=k$。$\\alpha^2+\\beta^2=(\\alpha+\\beta)^2-2\\alpha\\beta$ なので $${g}=${sVal * sVal}-2k$。これを解いて $k=${kVal}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],
};
