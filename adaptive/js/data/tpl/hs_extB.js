// ============================================================
// tpl/hs_extB.js — 高校 数学B の追加単元
//   seq_diff / seq_induction（数列）
//   rv_var / binom_dist / normal_dist / estimate / hypo_test（統計的な推測）
//
//  すべて自作の数値・言い回し。答えは、項を1つずつ計算した値・全数の数え上げ・
//  正規分布の数値計算（誤差関数）など、別の方法でも確かめている。
//  正規分布表の値は、標準正規分布の確率（公開の数学的事実）を4けたに丸めたもの。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, cmp, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert, gcd } from "./util.js";
import { nearly, isqrt, nCr } from "./hs_util.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const pn = (p) => p.toTeX({ order: ["n"] });

/** 標準正規分布の P(0 ≤ Z ≤ z)（数値計算。表の値の検算用） */
function phi0(z) {
  // ∫₀^z e^{−t²/2} dt = Σ (−1)^k z^{2k+1} / (2^k k! (2k+1)) を級数で計算する
  let s = 0;
  let term = z; // (−1)^k z^{2k+1} / (2^k k!)
  for (let k = 0; k < 200; k++) {
    s += term / (2 * k + 1);
    term *= (-z * z) / (2 * (k + 1));
    if (Math.abs(term) < 1e-17) break;
  }
  return s / Math.sqrt(2 * Math.PI);
}
/** 正規分布表（P(0≤Z≤z) を小数第4位に丸めたもの） */
const ZTAB = { "0.5": 0.1915, "0.8": 0.2881, "1.0": 0.3413, "1.2": 0.3849, "1.4": 0.4192, "1.5": 0.4332, "1.6": 0.4452, "1.8": 0.4641, "1.96": 0.475, "2.0": 0.4772, "2.2": 0.4861, "2.4": 0.4918, "2.5": 0.4938, "3.0": 0.4987 };
for (const [z, v] of Object.entries(ZTAB)) nearly(Math.round(phi0(Number(z)) * 10000) / 10000, v, `正規分布表 z=${z}`, 1e-9);
const zKey = (z) => (Number.isInteger(z) ? z.toFixed(1) : String(z));
const zTexList = (zs) => [...new Set(zs.map(zKey))].map((k) => `P(0\\le Z\\le ${k})=${ZTAB[k].toFixed(4)}`).join(",\\ ");
/** 小数の Q（有限小数） */
const dQ = (x, digits = 4) => Q(Math.round(x * 10 ** digits), 10 ** digits);

export default {
  // ── 階差数列・和と一般項 ───────────────────────────
  seq_diff: [
    t("choice", (r, lv) => {
      // 階差数列から一般項を求める（選択肢）。a1 = 0 だと「a1 を落とす」誤答が正解と同じになるので除く
      const a1 = r.nz(-3, 6);
      let bOf; // k 番目の階差（k ≥ 1）
      let evalAns; // 一般項の値（検算用）
      let texAns;
      let wrongTex;
      let expl;
      if (lv === 1) {
        const [p, q] = until(() => [r.int(1, 4), r.int(-2, 4)], ([u, v]) => u + v !== 0);
        bOf = (k) => p * k + q;
        // a_n = a1 + Σ_{k=1}^{n−1}(pk+q) = (p/2)n² + (q − p/2)n + (a1 − q)
        const ans = P.coeffs([a1 - q, sub(q, Q(p, 2)), Q(p, 2)], "n");
        evalAns = (n) => qnum(ans.eval({ n }));
        texAns = pn(ans);
        // 誤答：Σ を n まで（n−1 でなく）とった式・a1 を落とした式・等差数列とみた式
        const upToN = P.coeffs([a1, add(Q(p, 2), q), Q(p, 2)], "n");
        const noA1 = ans.sub(P.c(a1));
        const arith = P.lin(p + q, a1 - (p + q), "n");
        // Σk の公式で 2 でわり忘れる：a1 + p n(n−1) + q(n−1)
        const noHalf = P.coeffs([a1 - q, q - p, p], "n");
        wrongTex = [[pn(upToN), "MC-SEQDIFF-UPTO"], [pn(noA1), "MC-SEQDIFF-A1"], [pn(arith), "MC-SEQDIFF-TYPE"], [pn(noHalf), "MC-SEQDIFF-SUM"]];
        const qTerm = q === 0 ? "" : q === 1 ? "+(n-1)" : q === -1 ? "-(n-1)" : `${sgn(q)}(n-1)`;
        expl = `階差数列は $b_n=${pn(P.lin(p, q, "n"))}$。$n\\ge2$ のとき $a_n=a_1+\\sum_{k=1}^{n-1}(${P.lin(p, q, "k").toTeX({ order: ["k"] })})=${a1}+${p === 1 ? "" : `${p}\\cdot`}\\dfrac{(n-1)n}{2}${qTerm}=${texAns}$。これは $n=1$ のときも成り立ちます。`;
      } else {
        const rr = r.pick([2, 3]);
        const c = r.pick([1, 2, 3, 4].filter((v) => rr === 2 || v % 2 === 0));
        const d = lv === 3 ? r.nz(-2, 3) : 0;
        bOf = (k) => c * rr ** (k - 1) + d;
        // a_n = a1 + c (rr^{n−1} − 1)/(rr − 1) + d(n − 1) = A·rr^{n−1} + d·n + C
        const A = c / (rr - 1);
        const C = a1 - A - d;
        evalAns = (n) => A * rr ** (n - 1) + d * n + C;
        /** A·rr^{e} + d·n + C の TeX（0 の項は書かない、係数 ±1 は省く） */
        const geo = (A_, e, d_, C_) => {
          let out = A_ === 0 ? "" : `${A_ === 1 ? "" : A_ === -1 ? "-" : `${A_}\\cdot `}${rr}^{${e}}`;
          if (d_ !== 0) out += `${d_ > 0 && out ? "+" : d_ < 0 ? "-" : ""}${Math.abs(d_) === 1 ? "" : Math.abs(d_)}n`;
          if (C_ !== 0 || !out) out += `${C_ >= 0 && out ? "+" : ""}${C_}`;
          return out;
        };
        texAns = geo(A, "n-1", d, C);
        wrongTex = [
          [geo(A, "n", d, a1 - A), "MC-SEQDIFF-UPTO"], // Σ を n までとる
          [geo(A, "n-1", d, -A - d), "MC-SEQDIFF-A1"], // a1 を落とす
          [geo(a1, "n-1", 0, 0), "MC-SEQDIFF-TYPE"], // 等比数列とみる
          [geo(c, "n-1", d, a1 - c - d), "MC-SEQDIFF-SUM"], // 等比数列の和の公式で r−1 でわり忘れる
          [geo(2 * A, "n-1", d, C), "MC-SEQDIFF-SUM"], // 和の公式の係数を誤る
        ];
        expl = `階差数列は $b_n=${geo(c, "n-1", 0, d)}$。$n\\ge2$ のとき $a_n=${a1}+\\sum_{k=1}^{n-1}b_k=${a1}+\\dfrac{${c}(${rr}^{n-1}-1)}{${rr}-1}${d === 0 ? "" : `${sgn(d)}(n-1)`}=${texAns}$。$n=1$ のときも成り立ちます。`;
      }
      // 検算：数列を1項ずつ作り、式の値と比べる
      const seq = [a1];
      for (let k = 1; k < 9; k++) seq.push(seq[k - 1] + bOf(k));
      for (let n = 1; n <= 9; n++) nearly(evalAns(n), seq[n - 1], "一般項の検算", 1e-9);
      return choice({
        q: `数列 $\\{a_n\\}$ が $${seq.slice(0, 6).join(",\\ ")},\\ \\ldots$ で、その階差数列が${lv === 1 ? "等差数列" : lv === 2 ? "等比数列" : "「等比数列＋定数」の形"}になっています。一般項 $a_n$ はどれですか。`,
        correct: $(`a_n=${texAns}`),
        wrongs: wrongTex.map(([w, mc]) => [$(`a_n=${w}`), mc]),
        explain: expl,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 和 S_n から一般項
        if (lv <= 2) {
          const [p, q] = [r.int(1, 4), r.int(-5, 5)];
          const c = lv === 2 ? r.nz(-5, 5) : 0;
          const S = (n) => p * n * n + q * n + c;
          const askFirst = lv === 2 && r.chance(0.5);
          const k = askFirst ? 1 : r.int(5, 15);
          const ans = k === 1 ? S(1) : S(k) - S(k - 1);
          // 検算：a_n = p(2n−1) + q（n ≥ 2）
          if (k >= 2) assert(ans === p * (2 * k - 1) + q, "S_n から a_n の検算");
          const STex = pn(P.coeffs([c, q, p], "n"));
          return num({
            q: `数列 $\\{a_n\\}$ の初項から第 $n$ 項までの和が $S_n=${STex}$ で表されます。$a_{${k}}$ を求めなさい。`,
            ans,
            wrongs: [[S(k), "MC-SN-AS-AN"], ...(k === 1 ? [[p * 1 + q, "MC-SN-A1-TRAP"]] : [[S(k) - S(k - 2), "MC-SLIP"], [p * (2 * k - 1) + q + c, "MC-SN-A1-TRAP"]])],
            explain:
              k === 1
                ? `$a_1=S_1=${S(1)}$。（$n\\ge2$ のときの式 $a_n=S_n-S_{n-1}=${pn(P.lin(2 * p, q - p, "n"))}$ に $n=1$ を入れた $${p + q}$ とは${c === 0 ? "一致します" : "一致しません"}）`
                : `$n\\ge2$ のとき $a_n=S_n-S_{n-1}=${pn(P.lin(2 * p, q - p, "n"))}$。よって $a_{${k}}=${ans}$。（$S_{${k}}-S_{${k - 1}}=${S(k)}-${S(k - 1)}$ と計算しても同じ）`,
          });
        }
        // S_n = c(r^n − 1)
        const rr = r.pick([2, 3]);
        const c = r.int(1, 4);
        const S = (n) => c * (rr ** n - 1);
        const k = r.int(3, 7);
        const ans = S(k) - S(k - 1);
        assert(ans === c * (rr - 1) * rr ** (k - 1), "等比型の和からの一般項の検算");
        return num({
          q: `数列 $\\{a_n\\}$ の初項から第 $n$ 項までの和が $S_n=${c === 1 ? "" : c}(${rr}^n-1)$ で表されます。$a_{${k}}$ を求めなさい。`,
          ans,
          wrongs: [[S(k), "MC-SN-AS-AN"], [c * rr ** (k - 1), "MC-SEQDIFF-TYPE"], [c * rr ** k, "MC-SN-AS-AN"]],
          explain: `$a_{${k}}=S_{${k}}-S_{${k - 1}}=${S(k)}-${S(k - 1)}=${ans}$。（一般に $n\\ge2$ で $a_n=${c * (rr - 1) === 1 ? "" : c * (rr - 1)}\\cdot ${rr}^{n-1}$）`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        // 数列の第 k 項（階差を見つける）
        const a1 = r.int(1, 6);
        let bOf;
        if (lv === 1) {
          const [p, q] = [r.int(1, 3), r.int(1, 4)];
          bOf = (k) => p * k + q;
        } else if (lv === 2) {
          const rr = r.pick([2, 3]);
          bOf = (k) => rr ** (k - 1);
        } else {
          // 第2階差が一定（3次式の数列）
          const [p, q, s] = [r.int(1, 2), r.int(0, 3), r.int(1, 4)];
          bOf = (k) => p * k * k + q * k + s;
        }
        const seq = [a1];
        for (let k = 1; k < 30; k++) seq.push(seq[k - 1] + bOf(k));
        const k = r.int(lv === 2 ? 7 : 10, lv === 2 ? 9 : 20);
        const ans = seq[k - 1];
        return num({
          q: `次の数列の第 $${k}$ 項を求めなさい。\n$${seq.slice(0, 6).join(",\\ ")},\\ \\ldots$`,
          ans,
          wrongs: [[seq[k - 2], "MC-SEQDIFF-UPTO"], [seq[k], "MC-SEQDIFF-UPTO"], [a1 + bOf(k - 1) * (k - 1), "MC-SEQDIFF-TYPE"]],
          explain: `となりどうしの差（階差）は $${seq.slice(1, 6).map((v, i) => v - seq[i]).join(",\\ ")},\\ \\ldots$ ${lv === 3 ? "で、その差がさらに規則的に変わります" : lv === 2 ? "で、等比数列になっています" : "で、等差数列になっています"}。$a_{${k}}=a_1+(b_1+b_2+\\cdots+b_{${k - 1}})=${ans}$。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 数学的帰納法 ─────────────────────────────────
  seq_induction: [
    t("choice", (r, lv) => {
      // 等式 Σ f(i) = F(n) の証明の [2]
      // term：Σ の中の式（i の式）、fk・fk1：第 k 項・第 k+1 項を整理した TeX、F：右辺（n の式）
      const IDS = [
        { term: "i", fk: "k", fk1: "(k+1)", F: (v) => `\\dfrac{${v}(${v}+1)}{2}`, Fk1: "\\dfrac{(k+1)(k+2)}{2}", Fn: (n) => (n * (n + 1)) / 2, fn: (i) => i, wrongK1: ["\\dfrac{k(k+1)}{2}+1", "\\dfrac{(k+1)(k+1)}{2}"] },
        { term: "(2i-1)", fk: "(2k-1)", fk1: "(2k+1)", F: (v) => `${v}^2`, Fk1: "(k+1)^2", Fn: (n) => n * n, fn: (i) => 2 * i - 1, wrongK1: ["k^2+1", "k^2+2k"] },
        { term: "i^2", fk: "k^2", fk1: "(k+1)^2", F: (v) => `\\dfrac{${v}(${v}+1)(2${v}+1)}{6}`, Fk1: "\\dfrac{(k+1)(k+2)(2k+3)}{6}", Fn: (n) => (n * (n + 1) * (2 * n + 1)) / 6, fn: (i) => i * i, wrongK1: ["\\dfrac{k(k+1)(2k+1)}{6}+1", "\\dfrac{(k+1)(k+2)(2k+1)}{6}"] },
        { term: "i(i+1)", fk: "k(k+1)", fk1: "(k+1)(k+2)", F: (v) => `\\dfrac{${v}(${v}+1)(${v}+2)}{3}`, Fk1: "\\dfrac{(k+1)(k+2)(k+3)}{3}", Fn: (n) => (n * (n + 1) * (n + 2)) / 3, fn: (i) => i * (i + 1), wrongK1: ["\\dfrac{k(k+1)(k+2)}{3}+1", "\\dfrac{(k+1)(k+1)(k+2)}{3}"] },
        { term: "2^{i-1}", fk: "2^{k-1}", fk1: "2^{k}", F: (v) => `2^{${v}}-1`, Fk1: "2^{k+1}-1", Fn: (n) => 2 ** n - 1, fn: (i) => 2 ** (i - 1), wrongK1: ["2^{k}", "2^{k+1}"] },
        { term: "\\dfrac{1}{i(i+1)}", fk: "\\dfrac{1}{k(k+1)}", fk1: "\\dfrac{1}{(k+1)(k+2)}", F: (v) => `\\dfrac{${v}}{${v}+1}`, Fk1: "\\dfrac{k+1}{k+2}", Fn: (n) => n / (n + 1), fn: (i) => 1 / (i * (i + 1)), wrongK1: ["\\dfrac{k}{k+1}+1", "\\dfrac{k+1}{k+1}"] },
        { term: "3^{i-1}", fk: "3^{k-1}", fk1: "3^{k}", F: (v) => `\\dfrac{3^{${v}}-1}{2}`, Fk1: "\\dfrac{3^{k+1}-1}{2}", Fn: (n) => (3 ** n - 1) / 2, fn: (i) => 3 ** (i - 1), wrongK1: ["\\dfrac{3^{k}-1}{2}+1", "\\dfrac{3^{k}+1}{2}"] },
        { term: "i^3", fk: "k^3", fk1: "(k+1)^3", F: (v) => `\\left\\{\\dfrac{${v}(${v}+1)}{2}\\right\\}^2`, Fk1: "\\left\\{\\dfrac{(k+1)(k+2)}{2}\\right\\}^2", Fn: (n) => ((n * (n + 1)) / 2) ** 2, fn: (i) => i ** 3, wrongK1: ["\\left\\{\\dfrac{k(k+1)}{2}\\right\\}^2+1", "\\left\\{\\dfrac{(k+1)(k+1)}{2}\\right\\}^2"] },
      ];
      const pool = lv === 3 ? IDS.slice(4) : IDS.slice(0, 5);
      const id = r.pick(pool);
      // 検算：等式そのものが n = 1..12 で成り立つ
      for (let n = 1; n <= 12; n++) {
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += id.fn(i);
        nearly(sum, id.Fn(n), "証明する等式の検算", 1e-9);
      }
      const stmt = `\\displaystyle\\sum_{i=1}^{n}${id.term}=${id.F("n")}`;
      if (lv === 1) {
        return choice({
          q: `等式 $${stmt}$ ……(A) を数学的帰納法で証明します。「$n=k$ のとき (A) が成り立つと仮定して、$n=k+1$ のときも成り立つことを示す」とき、$n=k+1$ のときの (A) の右辺はどれですか。`,
          correct: $(id.Fk1),
          wrongs: [[$(id.wrongK1[0]), "MC-INDUCT-SUBST"], [$(id.wrongK1[1]), "MC-INDUCT-SUBST"], [$(id.F("k")), "MC-INDUCT-SUBST"]],
          explain: `右辺の $n$ をすべて $k+1$ に置きかえます：$${id.Fk1}$。（1か所だけ置きかえたり、$n=k$ のときの式に $1$ をたしたりするのは誤りです）`,
        });
      }
      // n = k+1 のときの左辺を、仮定を使って表す
      const correct = `${id.F("k")}+${id.fk1}`;
      return choice({
        q: `等式 $${stmt}$ ……(A) を数学的帰納法で証明します。$n=k$ のとき (A) が成り立つと仮定すると、$n=k+1$ のときの左辺 $\\displaystyle\\sum_{i=1}^{k+1}${id.term}$ はどのように表せますか。`,
        correct: $(correct),
        wrongs: [
          [$(`${id.F("k")}+${id.fk}`), "MC-INDUCT-TERM"],
          [$(`${id.Fk1}+${id.fk1}`), "MC-INDUCT-CIRCULAR"],
          [$(`${id.F("k")}\\times ${id.fk1}`), "MC-INDUCT-TERM"],
        ],
        explain: `$\\displaystyle\\sum_{i=1}^{k+1}${id.term}=\\sum_{i=1}^{k}${id.term}+${id.fk1}$ と、最後の1項（$i=k+1$ の項）を分けます。仮定より $\\displaystyle\\sum_{i=1}^{k}${id.term}=${id.F("k")}$ なので、$${correct}$。これを計算して $${id.Fk1}$ になることを示せば証明が終わります。`,
      });
    }, { finite: true }), // 証明の型を問う問題なので、等式の種類は数が限られる（仕様）
    t(
      "num",
      (r, lv) => {
        // 不等式が「すべての n ≥ m」で成り立つ最小の m（数学的帰納法の出発点）
        const INEQS = [
          { tex: "2^n>n^2", f: (n) => 2n ** n > n * n },
          { tex: "2^n>n^3", f: (n) => 2n ** n > n ** 3n },
          { tex: "3^n>n^3", f: (n) => 3n ** n > n ** 3n },
          { tex: "2^n>2n+1", f: (n) => 2n ** n > 2n * n + 1n },
          { tex: "n!>2^n", f: (n) => fact(n) > 2n ** n },
          { tex: "n!>3^n", f: (n) => fact(n) > 3n ** n },
          { tex: "2^n>5n", f: (n) => 2n ** n > 5n * n },
          { tex: "3^n>2^n+n^2", f: (n) => 3n ** n > 2n ** n + n * n },
        ];
        const pool = lv === 1 ? INEQS.slice(0, 4) : lv === 2 ? INEQS.slice(2, 7) : INEQS.slice(4);
        const iq = r.pick(pool);
        // 1〜200 まで調べて、そこから先はずっと成り立つ最小の m
        let m = null;
        for (let n = 200n; n >= 1n; n--) {
          if (!iq.f(n)) {
            m = Number(n) + 1;
            break;
          }
        }
        if (m === null) m = 1;
        let firstTrue = 1;
        while (!iq.f(BigInt(firstTrue))) firstTrue++;
        const wrongs = [[m - 1, "MC-INDUCT-START"], [m + 1, "MC-INDUCT-START"]];
        if (firstTrue !== m) wrongs.unshift([firstTrue, "MC-INDUCT-START"]);
        return num({
          q: `不等式 $${iq.tex}$ が「$n\\ge m$ を満たすすべての自然数 $n$」で成り立つような、最小の自然数 $m$ を求めなさい。（数学的帰納法で証明するときの出発点になります）`,
          ans: m,
          wrongs,
          explain: `$n=1,2,3,\\ldots$ と順に調べると、${firstTrue !== m ? `$n=${firstTrue}$ では成り立ちますが、その後に成り立たない $n$ があり、` : ""}$n=${m - 1}$ では成り立たず、$n=${m}$ からは成り立ちます。$n\\ge ${m}$ のすべてで成り立つことは、$n=k$ で成り立つと仮定して $n=k+1$ を示す数学的帰納法で証明できます。答えは $${m}$。`,
        });
      },
      { id: "b", finite: true }, // 代表的な不等式を選ぶ問題なので、種類は限られる（仕様）
    ),
  ],

  // ── 確率変数の分散と aX+b ──────────────────────────
  rv_var: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // 確率分布の表から分散
        const d = r.pick([4, 5, 6, 8, 10]);
        const k = d <= 5 ? 3 : r.pick([3, 4]);
        const [xs, cs] = until(
          () => {
            const x0 = r.sample([0, 1, 2, 3, 4, 5, 6], k).sort((a, b) => a - b);
            const c0 = Array.from({ length: k }, () => r.int(1, d));
            return [x0, c0];
          },
          ([, c0]) => c0.reduce((a, b) => a + b, 0) === d,
          2000,
        );
        const pr = cs.map((c) => Q(c, d));
        const E = xs.reduce((s, x, i) => add(s, mul(x, pr[i])), Q(0));
        const E2 = xs.reduce((s, x, i) => add(s, mul(x * x, pr[i])), Q(0));
        const V = sub(E2, mul(E, E));
        // 検算：定義 Σ(x−E)²p
        const Vdef = xs.reduce((s, x, i) => add(s, mul(mul(sub(x, E), sub(x, E)), pr[i])), Q(0));
        assert(eq(V, Vdef), "分散の検算");
        const table = `\\begin{array}{c|${"c".repeat(k)}|c} X & ${xs.join(" & ")} & \\text{計} \\\\ \\hline P & ${pr.map((p) => (p.d === 1 ? String(p.n) : `\\frac{${p.n}}{${p.d}}`)).join(" & ")} & 1 \\end{array}`;
        return num({
          q: `確率変数 $X$ の確率分布が次の表のとおりです。$X$ の分散 $V(X)$ を求めなさい。（分数または小数で答えます）\n$${table}$`,
          ans: V,
          wrongs: [[E2, "MC-VAR-FORMULA"], [sub(E2, E), "MC-VAR-FORMULA"], [E, "MC-VAR-MEAN"]],
          explain: `$E(X)=${tq(E)}$、$E(X^2)=${xs.map((x, i) => `${x}^2\\cdot${tq(pr[i])}`).join("+")}=${tq(E2)}$。$V(X)=E(X^2)-\\{E(X)\\}^2=${tq(E2)}-\\left(${tq(E)}\\right)^2=${tq(V)}$。`,
        });
      }
      if (lv === 2) {
        const m = r.int(-3, 8);
        const s = r.int(1, 5);
        const v = s * s;
        const a = r.pick([-3, -2, 2, 3, 4, 5]);
        const b = r.nz(-6, 6);
        const ask = r.pick(["E", "V", "S"]);
        const ans = ask === "E" ? a * m + b : ask === "V" ? a * a * v : Math.abs(a) * s;
        const lin = `${a === -1 ? "-" : a}X${sgn(b)}`;
        const wrongs =
          ask === "E"
            ? [[a * m, "MC-VAR-ADD-B"], [m + b, "MC-VAR-LINEAR-A"], [a * (m + b), "MC-VAR-ADD-B"]]
            : ask === "V"
              ? [[a * v, "MC-VAR-LINEAR-A"], [a * a * v + b, "MC-VAR-ADD-B"], [Math.abs(a) * v, "MC-VAR-LINEAR-A"]]
              : [[a * s, "MC-VAR-LINEAR-A"], [a * a * s, "MC-VAR-LINEAR-A"], [Math.abs(a) * s + b, "MC-VAR-ADD-B"]];
        return num({
          q: `確率変数 $X$ の期待値が $${m}$、標準偏差が $${s}$ です。$Y=${lin}$ とするとき、${ask === "E" ? "$Y$ の期待値 $E(Y)$" : ask === "V" ? "$Y$ の分散 $V(Y)$" : "$Y$ の標準偏差 $\\sigma(Y)$"} を求めなさい。`,
          ans,
          // 分散・標準偏差は負にならないので、負の誤答は選ばない
          wrongs: wrongs.filter(([w]) => w !== ans && (ask === "E" || w >= 0)),
          explain:
            ask === "E"
              ? `$E(aX+b)=aE(X)+b$ より $E(Y)=${a}\\times ${m}${sgn(b)}=${ans}$。`
              : ask === "V"
                ? `$V(X)=${s}^2=${v}$。$V(aX+b)=a^2V(X)$（足した定数 $b$ はちらばりに影響しない）より $V(Y)=(${a})^2\\times ${v}=${ans}$。`
                : `$\\sigma(aX+b)=|a|\\sigma(X)$ より $\\sigma(Y)=${Math.abs(a)}\\times ${s}=${ans}$。`,
        });
      }
      // コインを n 枚投げたときの表の枚数 X（すべて数え上げる）
      const n = r.pick([2, 3, 4]);
      const a = r.pick([2, 3, -2]);
      const b = r.nz(-5, 5);
      let E = Q(0);
      let E2 = Q(0);
      const total = 2 ** n;
      for (let m = 0; m < total; m++) {
        let h = 0;
        for (let i = 0; i < n; i++) if ((m >> i) & 1) h++;
        E = add(E, Q(h, total));
        E2 = add(E2, Q(h * h, total));
      }
      const V = sub(E2, mul(E, E));
      assert(eq(V, Q(n, 4)), "コインの枚数の分散の検算");
      const ans = mul(a * a, V);
      return num({
        q: `$${n}$ 枚のコインを同時に投げて、表が出た枚数を $X$ とします。$Y=${a}X${sgn(b)}$ の分散 $V(Y)$ を求めなさい。（分数または小数で答えます）`,
        ans,
        wrongs: [[mul(a, V), "MC-VAR-LINEAR-A"], [add(ans, b), "MC-VAR-ADD-B"], [V, "MC-VAR-LINEAR-A"], [mul(a * a, E2), "MC-VAR-FORMULA"]],
        explain: `$X$ のとりうる値は $0$〜$${n}$ で、全部で $${total}$ 通りの出方を数えると、$E(X)=${tq(E)}$、$E(X^2)=${tq(E2)}$、$V(X)=${tq(E2)}-\\left(${tq(E)}\\right)^2=${tq(V)}$。$V(Y)=(${a})^2V(X)=${tq(ans)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 独立な確率変数の和・差
        if (lv <= 2) {
          const [vx, vy] = [r.int(1, 9), r.int(1, 9)];
          const [a, b] = lv === 1 ? [1, r.pick([1, -1])] : [r.pick([2, 3, -2]), r.pick([2, -3, 3, -2])];
          const ans = a * a * vx + b * b * vy;
          const expr = `${a === 1 ? "" : a}X${b > 0 ? "+" : "-"}${Math.abs(b) === 1 ? "" : Math.abs(b)}Y`;
          return num({
            q: `確率変数 $X$、$Y$ は互いに独立で、$V(X)=${vx}$、$V(Y)=${vy}$ です。$V(${expr})$ を求めなさい。`,
            ans,
            wrongs: [[a * a * vx - b * b * vy, "MC-VAR-DIFF"], [Math.abs(a) * vx + Math.abs(b) * vy, "MC-VAR-LINEAR-A"], [a * vx + b * vy, "MC-VAR-LINEAR-A"]],
            explain: `$X$ と $Y$ が独立なら $V(aX+bY)=a^2V(X)+b^2V(Y)$。${b < 0 ? "ひき算でも、分散はたし算になります（$(-" + Math.abs(b) + ")^2$ は正）。" : ""}$V(${expr})=${a * a}\\times ${vx}+${b * b}\\times ${vy}=${ans}$。`,
          });
        }
        // 面の数がちがう2つのさいころ（正四面体・立方体・正八面体）の目の和・差・積（すべて数え上げて検算）
        const [f1, f2] = until(() => [r.pick([4, 6, 8]), r.pick([4, 6, 8])], ([u, v]) => u <= v);
        const kind = r.pick(["sum", "diff", "prod"]);
        const one = (f) => {
          // 1 から f の目が等しい確率で出るさいころの期待値と分散
          const E1 = Q(f + 1, 2);
          const V1 = Q(f * f - 1, 12);
          return { E1, V1 };
        };
        const A = one(f1);
        const B = one(f2);
        let E = Q(0);
        let E2 = Q(0);
        for (let x = 1; x <= f1; x++) {
          for (let y = 1; y <= f2; y++) {
            const v = kind === "sum" ? x + y : kind === "diff" ? x - y : x * y;
            E = add(E, Q(v, f1 * f2));
            E2 = add(E2, Q(v * v, f1 * f2));
          }
        }
        const V = sub(E2, mul(E, E));
        const dieName = (f) => (f === 4 ? "正四面体" : f === 6 ? "立方体" : "正八面体");
        const intro = `1から${f1}までの目が同じ確率で出る${dieName(f1)}のさいころと、1から${f2}までの目が同じ確率で出る${dieName(f2)}のさいころを1回ずつ投げ、出た目をそれぞれ $X$、$Y$ とします。`;
        if (kind === "prod") {
          assert(eq(E, mul(A.E1, B.E1)), "目の積の期待値の検算（独立なら積の期待値＝期待値の積）");
          return num({
            q: `${intro}積 $XY$ の期待値を求めなさい。（分数または小数で答えます）`,
            ans: E,
            wrongs: [[add(A.E1, B.E1), "MC-VAR-MEAN"]],
            explain: `$X$ と $Y$ は独立なので $E(XY)=E(X)E(Y)=${tq(A.E1)}\\times${tq(B.E1)}=${tq(E)}$。（$${f1 * f2}$ 通りをすべて数えても同じ）`,
          });
        }
        assert(eq(V, add(A.V1, B.V1)), "和・差の分散の検算（独立なら分散の和）");
        return num({
          q: `${intro}${kind === "sum" ? "和 $X+Y$" : "差 $X-Y$"} の分散を求めなさい。（分数または小数で答えます）`,
          ans: V,
          // 分散をひき算してしまう誤り（f1 ≤ f2 なので V(Y) − V(X) ≥ 0）と、期待値を答えてしまう誤り
          wrongs: [[sub(B.V1, A.V1), "MC-VAR-DIFF"], [kind === "sum" ? add(A.E1, B.E1) : sub(A.E1, B.E1), "MC-VAR-MEAN"]],
          explain: `1から $f$ までの目が同じ確率で出るとき、分散は $E(X^2)-\\{E(X)\\}^2=\\dfrac{f^2-1}{12}$。$V(X)=${tq(A.V1)}$、$V(Y)=${tq(B.V1)}$。$X$、$Y$ は独立なので、${kind === "sum" ? "和" : "差"}の分散は $V(X)+V(Y)=${tq(V)}$。${kind === "diff" ? "（差でも分散はたし算）" : ""}`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 二項分布 ─────────────────────────────────
  binom_dist: [
    t("num", (r, lv) => {
      const ctx = r.pick([
        { what: (n) => `1個のさいころを $${n}$ 回投げるとき、$1$ の目が出る回数`, p: Q(1, 6) },
        { what: (n) => `1枚のコインを $${n}$ 回投げるとき、表が出る回数`, p: Q(1, 2) },
        { what: (n) => `1個のさいころを $${n}$ 回投げるとき、$3$ の倍数の目が出る回数`, p: Q(1, 3) },
        { what: (n) => `当たる確率が $\\dfrac15$ のくじを $${n}$ 回引く（毎回もとにもどす）とき、当たる回数`, p: Q(1, 5) },
        { what: (n) => `1個のさいころを $${n}$ 回投げるとき、$5$ 以上の目が出る回数`, p: Q(1, 3) },
      ]);
      const p = ctx.p;
      const q = sub(1, p);
      if (lv <= 2) {
        // 標準偏差を聞くとき（L2）は、np(1−p) が平方数になる n を表から選ぶ
        const SQ_N = { 2: [16, 36, 64, 100, 144, 400], 3: [18, 72, 162], 5: [25, 100, 225, 400], 6: [180, 720] };
        const n = lv === 1 ? p.d * r.int(2, 60) : r.pick(SQ_N[p.d]);
        if (lv === 2) assert(isqrt(qnum(mul(mul(n, p), q))) !== null, "np(1−p) が平方数");
        const Ex = mul(n, p);
        const Vx = mul(Ex, q);
        const ask = lv === 1 ? r.pick(["E", "V"]) : "S";
        const ans = ask === "E" ? Ex : ask === "V" ? Vx : Q(isqrt(qnum(Vx)));
        return num({
          q: `${ctx.what(n)}を $X$ とします。$X$ の${ask === "E" ? "期待値 $E(X)$" : ask === "V" ? "分散 $V(X)$" : "標準偏差 $\\sigma(X)$"} を求めなさい。${ask === "V" ? "（分数または小数で答えます）" : ""}`,
          ans,
          wrongs: ask === "E" ? [[mul(n, q), "MC-BINOM-PARAM"], [Vx, "MC-BINOM-MEAN-VAR"]] : ask === "V" ? [[Ex, "MC-BINOM-MEAN-VAR"], [mul(Ex, p), "MC-BINOM-VAR-P2"], [mul(n, mul(q, q)), "MC-BINOM-VAR-P2"]] : [[Vx, "MC-BINOM-SD"], [Ex, "MC-BINOM-MEAN-VAR"]],
          explain: `$X$ は二項分布 $B\\left(${n},\\ ${tq(p)}\\right)$ に従います。$E(X)=np=${n}\\times${tq(p)}=${tq(Ex)}$、$V(X)=np(1-p)=${tq(Ex)}\\times${tq(q)}=${tq(Vx)}$${ask === "S" ? `、$\\sigma(X)=\\sqrt{${tq(Vx)}}=${tq(ans)}$` : ""}。`,
        });
      }
      // P(X = k)（小さい n）
      const n = r.int(3, 6);
      const k = r.int(1, n - 1);
      const ans = mul(mul(Q(nCr(n, k)), powQ(p, k)), powQ(q, n - k));
      // 検算：全数の数え上げ（試行ごとの成功・失敗の並びを列挙）
      let tot = Q(0);
      for (let m = 0; m < 2 ** n; m++) {
        let h = 0;
        let pr = Q(1);
        for (let i = 0; i < n; i++) {
          if ((m >> i) & 1) {
            h++;
            pr = mul(pr, p);
          } else pr = mul(pr, q);
        }
        if (h === k) tot = add(tot, pr);
      }
      assert(eq(tot, ans), "二項分布の確率の検算");
      return num({
        q: `${ctx.what(n)}を $X$ とします。$P(X=${k})$ を求めなさい。（分数で答えます）`,
        ans,
        reduced: true,
        wrongs: [[mul(powQ(p, k), powQ(q, n - k)), "MC-PROB-BINOM-COMB"], [mul(Q(nCr(n, k)), powQ(p, k)), "MC-PROB-BINOM-POWER"], [Q(k, n), "MC-BINOM-MEAN-VAR"]],
        explain: `$X$ は $B\\left(${n},\\ ${tq(p)}\\right)$ に従うので、$P(X=${k})={}_{${n}}\\mathrm{C}_{${k}}\\left(${tq(p)}\\right)^{${k}}\\left(${tq(q)}\\right)^{${n - k}}=${tq(ans)}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        const n = r.int(10, 60);
        const ctx = r.pick([
          { s: `1個のさいころを $${n}$ 回投げるとき、$6$ の目が出る回数`, p: "\\frac16", q: "\\frac56" },
          { s: `1枚のコインを $${n}$ 回投げるとき、裏が出る回数`, p: "\\frac12", q: "\\frac12" },
          { s: `赤玉 $2$ 個と白玉 $3$ 個の袋から1個取り出して色を見てもどすことを $${n}$ 回くり返すとき、赤玉が出る回数`, p: "\\frac25", q: "\\frac35" },
          { s: `1個のさいころを $${n}$ 回投げるとき、奇数の目が出る回数`, p: "\\frac12", q: "\\frac12" },
          { s: `正解の確率が $\\frac14$ の問題に $${n}$ 問でたらめに答えるとき、正解する問題の数`, p: "\\frac14", q: "\\frac34" },
        ]);
        const B = (a, b) => `B\\left(${a},\\ ${b}\\right)`;
        const wr = [[B(ctx.p, n), "MC-BINOM-PARAM"], [B(n, ctx.q), "MC-BINOM-PARAM"], [`N\\left(${n},\\ ${ctx.p}\\right)`, "MC-BINOM-PARAM"]];
        if (ctx.p === ctx.q) wr.splice(1, 1, [B(2 * n, ctx.p), "MC-BINOM-PARAM"]);
        return choice({
          q: `${ctx.s}を $X$ とします。$X$ が従う確率分布はどれですか。`,
          correct: $(B(n, ctx.p)),
          wrongs: wr.map(([w, mc]) => [$(w), mc]),
          explain: `1回ごとの成功の確率が $${ctx.p}$ で、それを $${n}$ 回（独立に）くり返したときの成功の回数なので、二項分布 $${B(n, ctx.p)}$ に従います。（$B(n,\\ p)$ の $n$ は回数、$p$ は1回の成功の確率）`,
        });
      },
      { id: "b", finite: true },
    ),
  ],

  // ── 正規分布 ─────────────────────────────────
  normal_dist: [
    t("num", (r, lv) => {
      const zs = ["0.5", "0.8", "1.0", "1.2", "1.4", "1.5", "1.6", "1.8", "2.0", "2.2", "2.4", "2.5"];
      const ph = (k) => ZTAB[k];
      if (lv === 1) {
        const kind = r.pick(["tail", "between0", "straddle", "range"]);
        const [z1, z2] = until(() => [r.pick(zs), r.pick(zs)], ([a, b]) => Number(a) < Number(b));
        let ans;
        let q;
        let wrongs;
        let expl;
        if (kind === "tail") {
          const neg_ = r.chance(0.5);
          ans = dQ(0.5 - ph(z2));
          q = neg_ ? `P(Z\\le -${z2})` : `P(Z\\ge ${z2})`;
          wrongs = [[dQ(ph(z2)), "MC-NORMAL-TAIL"], [dQ(0.5 + ph(z2)), "MC-NORMAL-TAIL"]];
          expl = `$${q}=0.5-P(0\\le Z\\le ${z2})=0.5-${ph(z2).toFixed(4)}=${dQ(0.5 - ph(z2)).n / 10000}$。（分布は $0$ について対称で、半分は $0.5$）`;
        } else if (kind === "between0") {
          ans = dQ(ph(z2));
          q = `P(-${z2}\\le Z\\le 0)`;
          wrongs = [[dQ(0.5 - ph(z2)), "MC-NORMAL-TAIL"], [dQ(2 * ph(z2)), "MC-NORMAL-SIDE"]];
          expl = `対称性から $P(-${z2}\\le Z\\le 0)=P(0\\le Z\\le ${z2})=${ph(z2).toFixed(4)}$。`;
        } else if (kind === "straddle") {
          ans = dQ(ph(z1) + ph(z2));
          q = `P(-${z1}\\le Z\\le ${z2})`;
          wrongs = [[dQ(ph(z2) - ph(z1)), "MC-NORMAL-SIDE"], [dQ(1 - ph(z1) - ph(z2)), "MC-NORMAL-TAIL"]];
          expl = `$0$ をはさむので、2つに分けてたします。$P(-${z1}\\le Z\\le 0)+P(0\\le Z\\le ${z2})=${ph(z1).toFixed(4)}+${ph(z2).toFixed(4)}=${(ph(z1) + ph(z2)).toFixed(4)}$。`;
        } else {
          ans = dQ(ph(z2) - ph(z1));
          q = `P(${z1}\\le Z\\le ${z2})`;
          wrongs = [[dQ(ph(z1) + ph(z2)), "MC-NORMAL-SIDE"], [dQ(ph(z2)), "MC-NORMAL-SIDE"]];
          expl = `$P(0\\le Z\\le ${z2})-P(0\\le Z\\le ${z1})=${ph(z2).toFixed(4)}-${ph(z1).toFixed(4)}=${(ph(z2) - ph(z1)).toFixed(4)}$。`;
        }
        // 検算：数値計算した確率と、表から出した答えの差が小さい
        const exact = kind === "tail" ? 0.5 - phi0(Number(z2)) : kind === "between0" ? phi0(Number(z2)) : kind === "straddle" ? phi0(Number(z1)) + phi0(Number(z2)) : phi0(Number(z2)) - phi0(Number(z1));
        nearly(exact, qnum(ans), "正規分布の確率の検算", 2e-4);
        return num({
          q: `確率変数 $Z$ は標準正規分布 $N(0,\\ 1)$ に従います。$${zTexList([z1, z2].filter((z) => q.includes(z)))}$ として、$${q}$ を求めなさい。（小数で答えます）`,
          ans,
          wrongs,
          explain: expl,
        });
      }
      if (lv === 2) {
        const m = r.pick([50, 60, 65, 70, 100, 170]);
        const s = r.pick([4, 5, 8, 10, 20]);
        const [z1, z2] = until(() => [r.pick(zs.slice(0, 9)), r.pick(zs.slice(0, 9))], ([a, b]) => Number(a) <= Number(b));
        const lo = m - Number(z1) * s;
        const hi = m + Number(z2) * s;
        const oneSide = r.chance(0.4);
        const ans = oneSide ? dQ(0.5 - ph(z2)) : dQ(ph(z1) + ph(z2));
        const exact = oneSide ? 0.5 - phi0(Number(z2)) : phi0(Number(z1)) + phi0(Number(z2));
        nearly(exact, qnum(ans), "正規分布の確率の検算", 2e-4);
        const fmt = (v) => String(Math.round(v * 100) / 100);
        return num({
          q: `確率変数 $X$ は正規分布 $N(${m},\\ ${s}^2)$ に従います。$${zTexList(oneSide ? [z2] : [z1, z2])}$ として、$${oneSide ? `P(X\\ge ${fmt(hi)})` : `P(${fmt(lo)}\\le X\\le ${fmt(hi)})`}$ を求めなさい。（小数で答えます）`,
          ans,
          wrongs: oneSide ? [[dQ(ph(z2)), "MC-NORMAL-TAIL"], [dQ(0.5 + ph(z2)), "MC-NORMAL-TAIL"]] : [[dQ(ph(z2) - ph(z1)), "MC-NORMAL-SIDE"], [dQ(2 * ph(z2)), "MC-NORMAL-SIDE"]],
          explain: `$Z=\\dfrac{X-${m}}{${s}}$ とおくと、$Z$ は $N(0,\\ 1)$ に従います。${oneSide ? `$X\\ge ${fmt(hi)}$ は $Z\\ge ${z2}$ なので、$0.5-${ph(z2).toFixed(4)}=${qnum(ans).toFixed(4)}$。` : `$${fmt(lo)}\\le X\\le ${fmt(hi)}$ は $-${z1}\\le Z\\le ${z2}$ なので、$${ph(z1).toFixed(4)}+${ph(z2).toFixed(4)}=${qnum(ans).toFixed(4)}$。`}`,
        });
      }
      // 集団の人数・二項分布の近似
      if (r.chance(0.5)) {
        const N = r.pick([500, 1000, 2000]);
        const m = r.pick([55, 60, 62, 70]);
        const s = r.pick([8, 10, 12, 15]);
        const z = r.pick(["1.0", "1.5", "2.0", "2.5"]);
        const cut = m + Number(z) * s;
        const pr = 0.5 - ph(z);
        const cnt = Math.round(N * pr);
        nearly(N * (0.5 - phi0(Number(z))), N * pr, "人数の検算", N * 2e-4);
        return num({
          q: `ある試験の受験者 $${N}$ 人の得点は、平均 $${m}$ 点、標準偏差 $${s}$ 点の正規分布に従うとみなせます。$${zTexList([z])}$ として、$${cut}$ 点以上の人はおよそ何人か求めなさい。（小数第1位を四捨五入して整数で答えます）`,
          ans: cnt,
          wrongs: [[Math.round(N * ph(z)), "MC-NORMAL-TAIL"], [Math.round(N * (0.5 + ph(z))), "MC-NORMAL-TAIL"]],
          explain: `$${cut}$ 点は $Z=\\dfrac{${cut}-${m}}{${s}}=${z}$ にあたります。$P(Z\\ge ${z})=0.5-${ph(z).toFixed(4)}=${pr.toFixed(4)}$ なので、$${N}\\times ${pr.toFixed(4)}=${(N * pr).toFixed(1)}$、およそ $${cnt}$ 人。`,
        });
      }
      // 二項分布の正規分布による近似
      const [n, p, mu, sd] = r.pick([[100, Q(1, 2), 50, 5], [400, Q(1, 2), 200, 10], [900, Q(1, 2), 450, 15], [180, Q(1, 6), 30, 5], [720, Q(1, 6), 120, 10], [100, Q(1, 5), 20, 4], [400, Q(1, 5), 80, 8]]);
      assert(eq(mul(n, p), Q(mu)) && eq(mul(mul(n, p), sub(1, p)), Q(sd * sd)), "平均と標準偏差の検算");
      const z = r.pick(["1.0", "1.5", "2.0", "2.5"]);
      const k = mu + Number(z) * sd;
      const ans = dQ(0.5 - ph(z));
      return num({
        q: `確率変数 $X$ が二項分布 $B\\left(${n},\\ ${tq(p)}\\right)$ に従うとき、$X$ は近似的に正規分布に従うとみなせます。$${zTexList([z])}$ として、$P(X\\ge ${k})$ の近似値を求めなさい。（小数で答えます）`,
        ans,
        wrongs: [[dQ(ph(z)), "MC-NORMAL-TAIL"], [dQ(0.5 + ph(z)), "MC-NORMAL-TAIL"]],
        explain: `$E(X)=${n}\\times${tq(p)}=${mu}$、$\\sigma(X)=\\sqrt{${n}\\times${tq(p)}\\times${tq(sub(1, p))}}=${sd}$。$Z=\\dfrac{X-${mu}}{${sd}}$ は近似的に $N(0,\\ 1)$ に従い、$X\\ge ${k}$ は $Z\\ge ${z}$。$0.5-${ph(z).toFixed(4)}=${qnum(ans).toFixed(4)}$。`,
      });
    }),
  ],

  // ── 母平均・母比率の推定 ───────────────────────────
  estimate: [
    t("fields", (r, lv) => {
      const Z = Q(196, 100);
      const dec = (q) => String(Math.round(qnum(q) * 1e6) / 1e6);
      if (lv !== 2) {
        // 母平均の信頼区間：x̄ ± 1.96 σ/√n
        const rn = r.pick(lv === 1 ? [4, 5, 8, 10] : [10, 16, 20, 25]);
        const n = rn * rn;
        const sigma = r.pick([4, 5, 6, 8, 10, 12, 15, 20]);
        const xbar = lv === 1 ? Q(r.int(40, 180)) : Q(r.int(1500, 1800), 10);
        const half = div(mul(Z, sigma), rn);
        const lo = sub(xbar, half);
        const hi = add(xbar, half);
        nearly(qnum(hi) - qnum(lo), (2 * 1.96 * sigma) / Math.sqrt(n), "信頼区間の幅の検算", 1e-12);
        return fields({
          q: `ある母集団から大きさ $${n}$ の標本を無作為に抽出したところ、標本平均が $${dec(xbar)}$ でした。母標準偏差を $${sigma}$ として、母平均の信頼度 $95\\%$ の信頼区間を求めなさい。（小数で答えます）`,
          fields: [
            { id: "lo", value: lo, pre: "$\\left[\\right.$" },
            { id: "hi", value: hi, pre: "$,\\ $", post: "$\\left.\\right]$" },
          ],
          wrongs: [
            { values: { lo: sub(xbar, mul(Z, sigma)), hi: add(xbar, mul(Z, sigma)) }, mc: "MC-ESTIMATE-NO-SQRTN" },
            { values: { lo: sub(xbar, div(mul(Z, sigma), n)), hi: add(xbar, div(mul(Z, sigma), n)) }, mc: "MC-ESTIMATE-N-NOT-SQRT" },
            { values: { lo: sub(xbar, div(mul(Q(258, 100), sigma), rn)), hi: add(xbar, div(mul(Q(258, 100), sigma), rn)) }, mc: "MC-ESTIMATE-WRONG-Z" },
          ],
          explain: `信頼区間は $\\left[\\overline{X}-1.96\\cdot\\dfrac{\\sigma}{\\sqrt n},\\ \\overline{X}+1.96\\cdot\\dfrac{\\sigma}{\\sqrt n}\\right]$。$1.96\\times\\dfrac{${sigma}}{\\sqrt{${n}}}=1.96\\times\\dfrac{${sigma}}{${rn}}=${dec(half)}$ なので、$[${dec(lo)},\\ ${dec(hi)}]$。`,
        });
      }
      // 母比率の信頼区間：p̂ ± 1.96 √(p̂(1−p̂)/n)（小数第4位を四捨五入）
      const [pHat, s] = r.pick([[Q(1, 10), Q(3, 10)], [Q(2, 10), Q(4, 10)], [Q(36, 100), Q(48, 100)], [Q(5, 10), Q(5, 10)], [Q(64, 100), Q(48, 100)], [Q(8, 10), Q(4, 10)], [Q(9, 10), Q(3, 10)]]);
      assert(eq(mul(s, s), mul(pHat, sub(1, pHat))), "p̂(1−p̂) が平方数");
      const rn = r.pick([10, 20, 50]);
      const n = rn * rn;
      const half = div(mul(Z, s), rn);
      const round3 = (q) => Q(Math.floor((2 * q.n * 1000 + q.d) / (2 * q.d)), 1000); // 正の数を小数第3位に四捨五入
      const lo = round3(sub(pHat, half));
      const hi = round3(add(pHat, half));
      nearly(qnum(hi), Math.round((qnum(pHat) + 1.96 * Math.sqrt((qnum(pHat) * (1 - qnum(pHat))) / n)) * 1000) / 1000, "母比率の信頼区間の検算", 1e-12);
      return fields({
        q: `ある意見について、無作為に選んだ $${n}$ 人に聞いたところ、賛成の人の割合は $${dec(pHat)}$ でした。母比率の信頼度 $95\\%$ の信頼区間を求めなさい。（小数第4位を四捨五入して、小数第3位まで答えます）`,
        fields: [
          { id: "lo", value: lo, pre: "$\\left[\\right.$" },
          { id: "hi", value: hi, pre: "$,\\ $", post: "$\\left.\\right]$" },
        ],
        wrongs: [
          { values: { lo: round3(sub(pHat, mul(Z, s))), hi: round3(add(pHat, mul(Z, s))) }, mc: "MC-ESTIMATE-NO-SQRTN" },
          { values: { lo: round3(sub(pHat, div(mul(Z, s), n))), hi: round3(add(pHat, div(mul(Z, s), n))) }, mc: "MC-ESTIMATE-N-NOT-SQRT" },
        ].filter((w) => qnum(w.values.lo) >= 0),
        explain: `標本比率 $R=${dec(pHat)}$ のとき、信頼区間は $\\left[R-1.96\\sqrt{\\dfrac{R(1-R)}{n}},\\ R+1.96\\sqrt{\\dfrac{R(1-R)}{n}}\\right]$。$\\sqrt{\\dfrac{${dec(pHat)}\\times${dec(sub(1, pHat))}}{${n}}}=\\dfrac{${dec(s)}}{${rn}}$ なので、$1.96\\times\\dfrac{${dec(s)}}{${rn}}=${dec(half)}$。区間は $[${dec(sub(pHat, half))},\\ ${dec(add(pHat, half))}]$、四捨五入して $[${dec(lo)},\\ ${dec(hi)}]$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          const rn = r.pick([4, 5, 8, 10, 20]);
          const sigma = r.pick([5, 8, 10, 15, 20]);
          const width = div(mul(Q(392, 100), sigma), rn);
          nearly(qnum(width), (2 * 1.96 * sigma) / rn, "幅の検算", 1e-12);
          return num({
            q: `母標準偏差が $${sigma}$ の母集団から、大きさ $${rn * rn}$ の標本をとります。母平均の信頼度 $95\\%$ の信頼区間の幅（上の端 − 下の端）を求めなさい。（小数で答えます）`,
            ans: width,
            wrongs: [[div(width, 2), "MC-ESTIMATE-HALF"], [div(mul(Q(392, 100), sigma), rn * rn), "MC-ESTIMATE-N-NOT-SQRT"], [mul(Q(392, 100), sigma), "MC-ESTIMATE-NO-SQRTN"]],
            explain: `幅は $2\\times1.96\\cdot\\dfrac{\\sigma}{\\sqrt n}=3.92\\times\\dfrac{${sigma}}{${rn}}=${String(Math.round(qnum(width) * 1e6) / 1e6)}$。（標本平均の値によらない）`,
          });
        }
        if (lv === 2) {
          // 幅を W 以下にする最小の n
          const [sigma, W] = until(() => [r.pick([5, 6, 8, 10, 12, 15, 20]), r.pick([1, 2, 3, 4, 5])], ([sg, w]) => {
            const bound = ((3.92 * sg) / w) ** 2;
            return bound > 20 && bound < 3000 && Math.abs(bound - Math.round(bound)) > 1e-6;
          });
          const bound = mul(div(mul(Q(392, 100), sigma), W), div(mul(Q(392, 100), sigma), W));
          const ans = Math.ceil(qnum(bound));
          // 検算：ans では幅が W 以下、ans − 1 では W をこえる
          assert((3.92 * sigma) / Math.sqrt(ans) <= W + 1e-12 && (3.92 * sigma) / Math.sqrt(ans - 1) > W, "必要な標本の大きさの検算");
          return num({
            q: `母標準偏差が $${sigma}$ の母集団について、母平均の信頼度 $95\\%$ の信頼区間の幅を $${W}$ 以下にしたいと考えています。標本の大きさ $n$ を最小でいくつにすればよいですか。`,
            ans,
            wrongs: [[Math.ceil((3.92 * sigma) / W), "MC-ESTIMATE-SIZE"], [Math.floor(qnum(bound)), "MC-ESTIMATE-SIZE"], [Math.ceil(((1.96 * sigma) / W) ** 2), "MC-ESTIMATE-HALF"]],
            explain: `幅は $2\\times1.96\\cdot\\dfrac{${sigma}}{\\sqrt n}\\le ${W}$。$\\sqrt n\\ge\\dfrac{3.92\\times${sigma}}{${W}}=${Math.round(((3.92 * sigma) / W) * 10000) / 10000}$ なので、$n\\ge ${Math.round(qnum(bound) * 10000) / 10000}$。これを満たす最小の整数は $${ans}$。`,
          });
        }
        const k = r.pick([2, 3, 4]);
        const askN = r.chance(0.5);
        return num({
          q: askN
            ? `母平均の信頼度 $95\\%$ の信頼区間の幅を、いまの $\\dfrac{1}{${k}}$ にしたいと考えています。標本の大きさを何倍にすればよいですか。（母標準偏差は同じとします）`
            : `母平均の信頼度 $95\\%$ の信頼区間について、標本の大きさを $${k * k}$ 倍にすると、区間の幅は何倍になりますか。（分数で答えます）`,
          ans: askN ? k * k : Q(1, k),
          wrongs: askN ? [[k, "MC-ESTIMATE-SIZE"], [2 * k, "MC-ESTIMATE-SIZE"]] : [[Q(1, k * k), "MC-ESTIMATE-SIZE"], [Q(k), "MC-ESTIMATE-SIZE"]],
          explain: `幅は $3.92\\cdot\\dfrac{\\sigma}{\\sqrt n}$ で、$\\sqrt n$ に反比例します。${askN ? `幅を $\\dfrac1{${k}}$ にするには $\\sqrt n$ を $${k}$ 倍、つまり $n$ を $${k * k}$ 倍にします。` : `$n$ を $${k * k}$ 倍にすると $\\sqrt n$ は $${k}$ 倍なので、幅は $\\dfrac{1}{${k}}$ 倍。`}`,
        });
      },
      { id: "b" },
    ),
    t(
      "choice",
      (r, lv) => {
        if (lv <= 2) {
          const opts = [
            ["同じ方法で標本をとって信頼区間を作ることをくり返すと、そのうちおよそ $95\\%$ の区間が母平均をふくむ", null],
            ["母集団の値の $95\\%$ が、この区間に入っている", "MC-ESTIMATE-POP"],
            ["標本の値の $95\\%$ が、この区間に入っている", "MC-ESTIMATE-SAMPLE"],
            ["標本平均の $95\\%$ が母平均に等しい", "MC-ESTIMATE-SAMPLE"],
          ];
          return choice({
            q: `母平均の「信頼度 $95\\%$ の信頼区間」の意味として、最も適切なものはどれですか。`,
            correct: opts[0][0],
            wrongs: opts.slice(1),
            explain: `信頼度 $95\\%$ とは、「この方法で区間を作ると、およそ $95\\%$ の場合に母平均をふくむ区間ができる」という、区間の作り方の確からしさです。母集団や標本の値の何％が入るか、という意味ではありません。`,
          });
        }
        const item = r.pick([
          ["信頼度を $95\\%$ から $99\\%$ に上げると、信頼区間の幅はどうなりますか。", "広くなる", [["せまくなる", "MC-ESTIMATE-WRONG-Z"], ["変わらない", "MC-ESTIMATE-WRONG-Z"], ["標本の大きさによって、広くなるときもせまくなるときもある", "MC-ESTIMATE-WRONG-Z"]], "信頼度 99% では 1.96 のかわりに 2.58 を使うので、幅は広くなります（確実にふくむためには、区間を広くとる必要がある）。"],
          ["標本の大きさ $n$ を大きくすると、母平均の信頼区間の幅はどうなりますか（信頼度は同じ）。", "せまくなる", [["広くなる", "MC-ESTIMATE-SIZE"], ["変わらない", "MC-ESTIMATE-SIZE"], ["$n$ に比例して広くなる", "MC-ESTIMATE-SIZE"]], "幅は $\\dfrac{\\sigma}{\\sqrt n}$ に比例するので、$n$ を大きくすると幅はせまくなります（推定の精度が上がる）。"],
        ]);
        return choice({
          q: item[0],
          correct: item[1],
          wrongs: item[2],
          explain: item[3],
        });
      },
      { id: "c", finite: true },
    ),
  ],

  // ── 仮説検定（正規分布の利用） ─────────────────────────
  hypo_test: [
    t("num", (r, lv) => {
      const setup = testSetup(r, lv);
      const { zq, q, expl, wrongs } = setup;
      return num({
        q: `${q}\n帰無仮説のもとで、検定に使う $Z$ の値を求めなさい。（小数で答えます）`,
        ans: zq,
        wrongs,
        explain: expl,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        const setup = testSetup(r, lv, true);
        const rej = Math.abs(qnum(setup.zq)) >= 1.96;
        const yes = `「${setup.claim}」と判断できる（帰無仮説を棄却する）`;
        const no = `「${setup.claim}」とは判断できない（帰無仮説を棄却しない）`;
        return choice({
          q: `${setup.q}\n有意水準 $5\\%$ の両側検定で、どのように判断できますか。（$|Z|\\ge 1.96$ のとき棄却します）`,
          correct: rej ? yes : no,
          wrongs: [
            [rej ? no : yes, "MC-HYPO-REVERSE"],
            [`「${setup.nullText}」と判断できる`, "MC-HYPO-ACCEPT"],
            [`「${setup.opposite}」と判断できる`, "MC-HYPO-TAIL-SIDE"],
          ],
          explain: `${setup.expl}$|Z|=${Math.abs(qnum(setup.zq))}$ ${rej ? "$\\ge 1.96$ なので棄却域に入り、帰無仮説を棄却します。" : "$<1.96$ なので棄却域に入らず、帰無仮説は棄却できません（「帰無仮説が正しい」と言えるわけではありません）。"}`,
        });
      },
      { id: "b" },
    ),
  ],
};

/**
 * 仮説検定の設定（コイン・さいころ・母平均）。Z がきれいな小数になるように数を選ぶ。
 *  decision=true のときは |Z| が 1.96 から少し離れるようにする。
 */
function testSetup(r, lv, decision = false) {
  const zOk = (z) => !decision || Math.abs(Math.abs(z) - 1.96) >= 0.15;
  if (lv <= 2) {
    const cases = lv === 1 ? [[100, Q(1, 2), 5], [400, Q(1, 2), 10], [900, Q(1, 2), 15], [1600, Q(1, 2), 20]] : [[180, Q(1, 6), 5], [720, Q(1, 6), 10], [100, Q(1, 5), 4], [400, Q(1, 5), 8], [192, Q(1, 4), 6]];
    const [n, p, sd] = r.pick(cases);
    const mu = qnum(mul(n, p));
    assert(eq(mul(mul(n, p), sub(1, p)), Q(sd * sd)), "標準偏差の検算");
    // 観測値と平均の差 dd を選ぶ。Z = dd/sd が有限小数（sd の 2・5 以外の素因数が dd で約分される）で、1.1〜2.9 の範囲のもの
    const terminating = (qq) => {
      let d0 = qq.d;
      for (const f of [2, 5]) while (d0 % f === 0) d0 /= f;
      return d0 === 1;
    };
    const dd = until(
      () => r.sign() * r.int(Math.ceil(1.1 * sd), Math.floor(2.9 * sd)),
      (v) => terminating(Q(v, sd)) && zOk(v / sd),
    );
    const z = dd / sd;
    const X = mu + dd;
    const zq = Q(X - mu, sd);
    nearly(qnum(zq), z, "Z の検算", 1e-12);
    const coin = p.n === 1 && p.d === 2;
    // 「〜の確率」と「〜の回数」の言い方（場面ごと）
    const [probOf, countOf] = coin ? ["表の出る確率", "表の回数"] : p.d === 6 ? ["1の目の出る確率", "1の目の回数"] : p.d === 5 ? ["当たる確率", "当たりの回数"] : ["正解する確率", "正解の数"];
    const story = coin
      ? `あるコインを $${n}$ 回投げたところ、表が $${X}$ 回出ました。このコインの表の出る確率が $\\frac12$ であるかどうかを検定します。`
      : p.d === 6
        ? `あるさいころを $${n}$ 回投げたところ、1の目が $${X}$ 回出ました。このさいころの1の目の出る確率が $\\frac16$ であるかどうかを検定します。`
        : p.d === 5
          ? `当たりの確率が $\\frac15$ とされるくじを $${n}$ 回引いたところ（引くたびにもどす）、当たりが $${X}$ 回でした。当たりの確率が $\\frac15$ であるかどうかを検定します。`
          : `4つの選択肢から正解を選ぶ問題 $${n}$ 問に、ある人がでたらめに答えたところ $${X}$ 問が正解でした。正解する確率が $\\frac14$ であるかどうかを検定します。`;
    return {
      zq,
      q: `${story}帰無仮説を「${probOf}は $${tq(p)}$ である」とし、${countOf} $X$ が正規分布で近似できるものとします。`,
      claim: `${probOf}は $${tq(p)}$ ではない`,
      nullText: `${probOf}は $${tq(p)}$ である`,
      opposite: z > 0 ? `${probOf}は $${tq(p)}$ より小さい` : `${probOf}は $${tq(p)}$ より大きい`,
      wrongs: [[Q(X - mu, sd * sd), "MC-HTEST-SD"], [Q(X - mu, n), "MC-HTEST-SD"], [neg(zq), "MC-HTEST-ZCALC"]],
      expl: `帰無仮説のもとで $E(X)=${n}\\times${tq(p)}=${mu}$、$\\sigma(X)=\\sqrt{${n}\\times${tq(p)}\\times${tq(sub(1, p))}}=${sd}$。$Z=\\dfrac{X-${mu}}{${sd}}=\\dfrac{${X}-${mu}}{${sd}}=${qnum(zq)}$。`,
    };
  }
  // 母平均の検定：Z = (x̄ − m0)/(σ/√n)
  const rn = r.pick([10, 20]);
  const n = rn * rn;
  const sigma = r.pick([5, 8, 10, 12, 15, 20]);
  const se = Q(sigma, rn);
  const m0 = r.pick([50, 60, 100, 250, 500]);
  const z = until(() => r.pick([-2.6, -2.4, -2.2, -1.8, -1.6, -1.2, 1.2, 1.6, 1.8, 2.2, 2.4, 2.6]), (zz) => zOk(zz));
  const xbar = add(Q(m0), mul(Q(Math.round(z * 10), 10), se));
  const zq = div(sub(xbar, m0), se);
  nearly(qnum(zq), z, "母平均の検定の Z の検算", 1e-12);
  const dec = (q) => String(Math.round(qnum(q) * 1e6) / 1e6);
  return {
    zq,
    q: `ある工場で作る製品の重さの平均は $${m0}\\,\\mathrm{g}$、標準偏差は $${sigma}\\,\\mathrm{g}$ とされています。無作為に $${n}$ 個を取り出して重さをはかったところ、平均は $${dec(xbar)}\\,\\mathrm{g}$ でした。帰無仮説を「平均は $${m0}\\,\\mathrm{g}$ である」とします。`,
    claim: `平均は $${m0}\\,\\mathrm{g}$ ではない`,
    nullText: `平均は $${m0}\\,\\mathrm{g}$ である`,
    opposite: z > 0 ? `平均は $${m0}\\,\\mathrm{g}$ より小さい` : `平均は $${m0}\\,\\mathrm{g}$ より大きい`,
    wrongs: [[div(sub(xbar, m0), sigma), "MC-HTEST-SD"], [div(sub(xbar, m0), Q(sigma, n)), "MC-HTEST-SD"], [neg(zq), "MC-HTEST-ZCALC"]],
    expl: `標本平均の標準偏差は $\\dfrac{${sigma}}{\\sqrt{${n}}}=${dec(se)}$。$Z=\\dfrac{${dec(xbar)}-${m0}}{${dec(se)}}=${qnum(zq)}$。`,
  };
}

/** 有理数の累乗 */
function powQ(q, k) {
  let out = Q(1);
  for (let i = 0; i < k; i++) out = mul(out, q);
  return out;
}

/** BigInt の階乗 */
function fact(n) {
  let r = 1n;
  for (let i = 2n; i <= n; i++) r *= i;
  return r;
}
