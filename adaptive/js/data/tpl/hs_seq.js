// ============================================================
// tpl/hs_seq.js — 高校 数列（数B）
//   seq_arith / seq_geom / seq_sigma / seq_recur
//
//  すべて自作の数値・言い回し。答えは、項を1つずつ並べて足したり漸化式をくり返したりする素直な計算でも確かめている。
// ============================================================
import { num, choice } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, num as qnum, pow as qpow } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert } from "./util.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const sgnQ = (q) => (q.n < 0 ? tq(q) : `+${tq(q)}`);

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

export default {
  // ── 等差数列 ─────────────────────────────────
  seq_arith: [
    t("num", (r, lv) => {
      const build = (a, d, n) => Array.from({ length: n }, (_, i) => a + i * d);
      if (lv === 1) {
        const a = r.int(-5, 12);
        const d = r.nz(-6, 8);
        const n = r.int(8, 30);
        const ans = build(a, d, n)[n - 1];
        return num({
          q: `初項が $${a}$、公差が $${d}$ の等差数列 $\\{a_n\\}$ の第 $${n}$ 項 $a_{${n}}$ を求めなさい。`,
          ans,
          wrongs: [[a + n * d, "MC-SEQ-N-MINUS-1"], [a + (n - 2) * d, "MC-SEQ-N-MINUS-1"], [n * d, "MC-SEQ-N-MINUS-1"], [ans + d, "MC-SLIP"]],
          explain: `等差数列の一般項は $a_n=a+(n-1)d$。$a_{${n}}=${a}+(${n}-1)\\times(${d})=${a}+${(n - 1) * d}=${ans}$。（$n$ ではなく $n-1$ を使う：初項から第 $n$ 項まで、公差をたす回数は $n-1$ 回）`,
        });
      }
      if (lv === 2) {
        // 第p項と第q項がわかっている
        const a = r.int(-6, 10);
        const d = r.nz(-5, 6);
        const [p, q] = until(() => [r.int(2, 6), r.int(7, 14)], ([u, v]) => v > u + 2);
        const m = r.int(15, 25);
        const seq = build(a, d, m);
        const kind = r.pick(["term", "d", "first"]);
        const head = `等差数列 $\\{a_n\\}$ で、$a_{${p}}=${seq[p - 1]}$、$a_{${q}}=${seq[q - 1]}$ です。`;
        if (kind === "d") {
          return num({
            q: `${head}公差 $d$ を求めなさい。`,
            ans: d,
            wrongs: [[seq[q - 1] - seq[p - 1], "MC-SEQ-DIFF-INDEX"], [Q(seq[q - 1] - seq[p - 1], q), "MC-SEQ-DIFF-INDEX"], [-d, "MC-SLIP"], [Q(seq[q - 1] - seq[p - 1], q + p), "MC-SEQ-DIFF-INDEX"]],
            explain: `$a_{${q}}-a_{${p}}=(${q}-${p})d$ なので、$${seq[q - 1]}-${pn(seq[p - 1])}=${q - p}d$、$d=${d}$。（項の番号の差 $${q - p}$ でわる）`,
          });
        }
        if (kind === "first") {
          return num({
            q: `${head}初項 $a_1$ を求めなさい。`,
            ans: a,
            wrongs: [[seq[p - 1] - d * p, "MC-SEQ-N-MINUS-1"], [seq[p - 1] - d, "MC-SEQ-N-MINUS-1"], [seq[p - 1], "MC-SEQ-N-MINUS-1"], [a + d, "MC-SLIP"]],
            explain: `まず公差：$${seq[q - 1]}-${pn(seq[p - 1])}=${q - p}d$ より $d=${d}$。$a_{${p}}=a_1+${p - 1}d$ より $a_1=${seq[p - 1]}-${p - 1}\\times ${pn(d)}=${a}$。`,
          });
        }
        return num({
          q: `${head}第 $${m}$ 項 $a_{${m}}$ を求めなさい。`,
          ans: seq[m - 1],
          wrongs: [[seq[q - 1] + (m - q + 1) * d, "MC-SEQ-N-MINUS-1"], [seq[q - 1] + m * d, "MC-SEQ-N-MINUS-1"], [seq[m - 1] + d, "MC-SLIP"], [seq[p - 1] + (m - 1) * d, "MC-SEQ-N-MINUS-1"]],
          explain: `公差：$${seq[q - 1]}-${pn(seq[p - 1])}=${q - p}d$ より $d=${d}$。$a_{${m}}=a_{${q}}+(${m}-${q})d=${seq[q - 1]}+${m - q}\\times ${pn(d)}=${seq[m - 1]}$。`,
        });
      }
      // 和・何項目か・倍数の和
      const kind = r.pick(["sum", "which", "mult"]);
      if (kind === "sum") {
        const a = r.int(-4, 10);
        const d = r.nz(-4, 7);
        const n = r.int(8, 25);
        const seq = build(a, d, n);
        const ans = seq.reduce((x, y) => x + y, 0);
        assert(ans === (n * (2 * a + (n - 1) * d)) / 2, "等差数列の和の検算");
        return num({
          q: `初項 $${a}$、公差 $${d}$ の等差数列の、初項から第 $${n}$ 項までの和 $S_{${n}}$ を求めなさい。`,
          ans,
          wrongs: [[n * (2 * a + (n - 1) * d), "MC-SEQ-SUM-HALF"], [(n * (a + seq[n - 1] + d)) / 2, "MC-SEQ-N-MINUS-1"], [(n * (2 * a + n * d)) / 2, "MC-SEQ-N-MINUS-1"], [n * (a + seq[n - 1]), "MC-SEQ-SUM-HALF"]].filter(([v]) => Number.isInteger(v)),
          explain: `等差数列の和は $S_n=\\dfrac{n\\{2a+(n-1)d\\}}{2}$（または $\\dfrac{n(\\text{初項}+\\text{末項})}{2}$）。$S_{${n}}=\\dfrac{${n}\\{2\\times ${pn(a)}+${n - 1}\\times ${pn(d)}\\}}{2}=${ans}$。（最後に $2$ でわるのを忘れない）`,
        });
      }
      if (kind === "which") {
        const a = r.int(-6, 10);
        const d = r.nz(-4, 7);
        const m = r.int(8, 30);
        const V = a + (m - 1) * d;
        const seq = build(a, d, m + 2);
        assert(seq.indexOf(V) === m - 1, "第何項かの検算");
        return num({
          q: `等差数列 $\\{a_n\\}$ の初項が $${a}$、公差が $${d}$ のとき、$${V}$ は第何項ですか。`,
          ans: m,
          wrongs: [[m - 1, "MC-SEQ-N-MINUS-1"], [m + 1, "MC-SEQ-N-MINUS-1"], [V - a, "MC-SEQ-N-MINUS-1"], [V, "MC-SLIP"]],
          explain: `$a_n=${a}+(n-1)\\times ${pn(d)}=${V}$ を解きます。$(n-1)\\times ${pn(d)}=${V - a}$ より $n-1=${m - 1}$、$n=${m}$。（$n-1$ の値を出したところで終わりにしない）`,
        });
      }
      // 1 から N までの整数のうち、k の倍数の和
      const N = r.int(40, 100);
      const k = r.int(3, 9);
      const terms = [];
      for (let x = k; x <= N; x += k) terms.push(x);
      const ans = terms.reduce((x, y) => x + y, 0);
      const nn = terms.length;
      assert(ans === (nn * (k + terms[nn - 1])) / 2, "倍数の和の検算");
      return num({
        q: `$1$ から $${N}$ までの整数のうち、$${k}$ の倍数をすべてたした和を求めなさい。`,
        ans,
        wrongs: [[nn * (k + terms[nn - 1]), "MC-SEQ-SUM-HALF"], [(nn * (k + N)) / 2, "MC-SEQ-LAST-TERM"], [(Math.floor(N / k) * (k + N)) / 2, "MC-SEQ-LAST-TERM"], [(nn * (k + terms[nn - 1] - k)) / 2, "MC-SEQ-N-MINUS-1"]].filter(([v]) => Number.isInteger(v)),
        explain: `$${k}$ の倍数は $${k},\\ ${2 * k},\\ \\dots,\\ ${terms[nn - 1]}$ で、初項 $${k}$、公差 $${k}$、項数 $${nn}$（$\\lfloor ${N}/${k}\\rfloor$）、末項 $${terms[nn - 1]}$（$${N}$ 以下で最大の倍数）の等差数列です。和は $\\dfrac{${nn}(${k}+${terms[nn - 1]})}{2}=${ans}$。（末項は $${N}$ ではなく、$${N}$ 以下の最大の倍数）`,
      });
    }),
  ],

  // ── 等比数列 ─────────────────────────────────
  seq_geom: [
    t("num", (r, lv) => {
      if (lv === 1) {
        const a = r.pick([1, 2, 3, 4, 5, -1, -2]);
        const rr = r.pick([2, 3, -2, Q(1, 2), Q(-1, 2)]);
        const R = typeof rr === "number" ? Q(rr) : rr;
        const n = R.d === 1 ? r.int(4, 8) : r.int(4, 7);
        let ans = Q(a);
        for (let i = 1; i < n; i++) ans = mul(ans, R);
        assert(eq(ans, mul(Q(a), qpow(R, n - 1))), "等比数列の項の検算");
        return num({
          q: `初項が $${a}$、公比が $${tq(R)}$ の等比数列 $\\{a_n\\}$ の第 $${n}$ 項 $a_{${n}}$ を求めなさい。`,
          ans,
          reduced: true,
          wrongs: [[mul(Q(a), qpow(R, n)), "MC-SEQ-GEOM-POWER"], [mul(mul(Q(a), R), Q(n - 1)), "MC-SEQ-GEOM-MULT"], [mul(Q(a), qpow(R, n - 2)), "MC-SEQ-GEOM-POWER"], [mul(Q(a * n), R), "MC-SEQ-GEOM-MULT"]],
          explain: `等比数列の一般項は $a_n=ar^{n-1}$。$a_{${n}}=${a}\\times(${tq(R)})^{${n - 1}}=${tq(ans)}$。（指数は $n$ ではなく $n-1$）`,
        });
      }
      if (lv === 2) {
        // 第p項と第q項 → 公比（q−p が奇数で一意に決まる）
        const a = r.pick([1, 2, 3, 5, -1, -2]);
        const rr = r.pick([2, 3, -2, -3]);
        const [p, q] = until(() => [r.int(1, 4), r.int(4, 8)], ([u, v]) => v > u && (v - u) % 2 === 1);
        const term = (i) => a * rr ** (i - 1);
        const kind = r.pick(["ratio", "first"]);
        const head = `等比数列 $\\{a_n\\}$ で、$a_{${p}}=${term(p)}$、$a_{${q}}=${term(q)}$ です。`;
        if (kind === "ratio") {
          return num({
            q: `${head}公比 $r$ を求めなさい。（実数）`,
            ans: rr,
            wrongs: [[Q(term(q), term(p)), "MC-SEQ-GEOM-RATIO-POWER"], [-rr, "MC-SLIP"], [q - p, "MC-SEQ-GEOM-RATIO-POWER"], [Math.abs(rr), "MC-SLIP"]],
            explain: `$a_{${q}}=a_{${p}}\\times r^{${q - p}}$ なので $r^{${q - p}}=\\dfrac{${term(q)}}{${term(p)}}=${rr ** (q - p)}$。指数が奇数なので、$r$ は実数でただ1つに決まり $r=${rr}$。（比 $\\dfrac{a_q}{a_p}$ は $r$ の $${q - p}$ 乗）`,
          });
        }
        return num({
          q: `${head}初項 $a_1$ を求めなさい。`,
          ans: a,
          wrongs: [[Q(term(p), rr ** p), "MC-SEQ-GEOM-POWER"], [Q(term(p), rr), "MC-SEQ-GEOM-POWER"], [term(p), "MC-SLIP"], [-a, "MC-SLIP"]],
          explain: `まず公比：$r^{${q - p}}=\\dfrac{${term(q)}}{${term(p)}}=${rr ** (q - p)}$ より $r=${rr}$。$a_{${p}}=a_1r^{${p - 1}}$ なので $a_1=\\dfrac{${term(p)}}{${rr}^{${p - 1}}}=${a}$。`,
        });
      }
      // 初項から第n項までの和
      const a = r.pick([1, 2, 3, 4, -1]);
      const rr = r.pick([2, 3, -2, Q(1, 2), Q(1, 3)]);
      const R = typeof rr === "number" ? Q(rr) : rr;
      const n = R.d === 1 ? r.int(4, 7) : r.int(3, 6);
      let sum = Q(0);
      let cur = Q(a);
      for (let i = 0; i < n; i++) {
        sum = add(sum, cur);
        cur = mul(cur, R);
      }
      const formula = div(mul(Q(a), sub(qpow(R, n), Q(1))), sub(R, Q(1)));
      assert(eq(sum, formula), "等比数列の和の検算");
      return num({
        q: `初項 $${a}$、公比 $${tq(R)}$ の等比数列の、初項から第 $${n}$ 項までの和 $S_{${n}}$ を求めなさい。`,
        ans: sum,
        reduced: true,
        wrongs: [[div(mul(Q(a), sub(qpow(R, n - 1), Q(1))), sub(R, Q(1))), "MC-SEQ-GEOM-SUM-EXP"], [div(mul(Q(a), sub(qpow(R, n), Q(1))), R), "MC-SEQ-GEOM-SUM-DENOM"], [mul(Q(a), qpow(R, n - 1)), "MC-SEQ-GEOM-SUM-LAST"], [div(mul(Q(a), add(qpow(R, n), Q(1))), add(R, Q(1))), "MC-SEQ-GEOM-SUM-SIGN"]],
        explain: `等比数列の和は、$r\\ne 1$ のとき $S_n=\\dfrac{a(r^n-1)}{r-1}$（$r<1$ なら $\\dfrac{a(1-r^n)}{1-r}$ でも同じ）。$S_{${n}}=\\dfrac{${a}\\{(${tq(R)})^{${n}}-1\\}}{${tq(R)}-1}=${tq(sum)}$。（1つずつたして確かめても同じ値になります）`,
      });
    }),
  ],

  // ── 和の公式（Σ） ─────────────────────────────
  seq_sigma: [
    t("num", (r, lv) => {
      // f(k) を多項式の係数 c = [c0, c1, c2, c3]（k^j の係数）で持ち、Σ を公式どおり／素直にたして確かめる
      const FS = {
        1: [
          { tex: "k", c: [0, 1] },
          { tex: "k^{2}", c: [0, 0, 1] },
          { tex: "k^{3}", c: [0, 0, 0, 1] },
          { tex: "2k-1", c: [-1, 2] },
        ],
        2: [
          { tex: "3k+2", c: [2, 3] },
          { tex: "k^{2}+k", c: [0, 1, 1] },
          { tex: "2k^{2}-1", c: [-1, 0, 2] },
          { tex: "k^{2}-2k", c: [0, -2, 1] },
          { tex: "4k-3", c: [-3, 4] },
        ],
        3: [
          { tex: "k(k+1)", c: [0, 1, 1] },
          { tex: "(k+1)^{2}", c: [1, 2, 1] },
          { tex: "3k^{2}-2k+1", c: [1, -2, 3] },
          { tex: "k^{3}+k", c: [0, 1, 0, 1] },
          { tex: "(2k-1)^{2}", c: [1, -4, 4] },
          { tex: "k(2k+1)", c: [0, 1, 2] },
        ],
      };
      const e = r.pick(FS[lv]);
      const n = r.int(lv === 1 ? 5 : 6, 12);
      const f = (k) => e.c.reduce((acc, cj, j) => acc + cj * k ** j, 0);
      let ans = 0;
      for (let k = 1; k <= n; k++) ans += f(k); // 素直にたす
      const S = [n, (n * (n + 1)) / 2, (n * (n + 1) * (2 * n + 1)) / 6, ((n * (n + 1)) / 2) ** 2]; // Σ1, Σk, Σk², Σk³
      const c = [0, 0, 0, 0].map((_, j) => e.c[j] ?? 0);
      const byFormula = c.reduce((acc, cj, j) => acc + cj * S[j], 0);
      assert(byFormula === ans, "和の公式の検算");
      // よくある誤り：公式の取りちがえ
      const wrongs = [];
      if (c[0] !== 0) wrongs.push([ans - c[0] * n + c[0], "MC-SIGMA-CONSTANT"]); // 定数 c を n 回でなく1回だけ
      if (c[2] !== 0) wrongs.push([ans - c[2] * S[2] + c[2] * S[1] * S[1], "MC-SIGMA-FORMULA"]); // Σk² を (Σk)² と
      if (c[3] !== 0) wrongs.push([ans - c[3] * S[3] + c[3] * S[2], "MC-SIGMA-FORMULA"]); // Σk³ を Σk² と
      if (c[1] !== 0) wrongs.push([ans - c[1] * S[1] + c[1] * n * (n + 1), "MC-SIGMA-FORMULA"]); // Σk を ×2 のまま
      wrongs.push([ans + n, "MC-SLIP"], [ans - n, "MC-SLIP"]);
      return num({
        q: `$n=${n}$ のとき、$\\displaystyle\\sum_{k=1}^{${n}}(${e.tex})$ の値を求めなさい。`,
        ans,
        wrongs,
        explain: `和の公式 $\\sum_{k=1}^{n}k=\\dfrac{n(n+1)}{2}$、$\\sum_{k=1}^{n}k^2=\\dfrac{n(n+1)(2n+1)}{6}$、$\\sum_{k=1}^{n}k^3=\\left\\{\\dfrac{n(n+1)}{2}\\right\\}^2$、$\\sum_{k=1}^{n}c=cn$ を使います。$n=${n}$ のとき $\\sum 1=${S[0]}$、$\\sum k=${S[1]}$、$\\sum k^2=${S[2]}$、$\\sum k^3=${S[3]}$。$${e.tex}$ を展開して項ごとに公式を当てはめると $${c.map((cj, j) => (cj === 0 ? "" : `${cj < 0 ? `(${cj})` : cj}\\times ${S[j]}`)).filter(Boolean).join("+")}=${ans}$。（定数をたすときは、$c$ ではなく $cn$）`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 和を n の式で表す
        const TABLE = {
          1: [
            { f: (k) => 2 * k - 1, tex: "2k-1", closed: "n^{2}" },
            { f: (k) => 2 * k, tex: "2k", closed: "n(n+1)" },
            { f: (k) => 3 * k - 1, tex: "3k-1", closed: "\\frac{n(3n+1)}{2}" },
          ],
          2: [
            { f: (k) => k * k + k, tex: "k^{2}+k", closed: "\\frac{n(n+1)(n+2)}{3}" },
            { f: (k) => 4 * k - 3, tex: "4k-3", closed: "n(2n-1)" },
            { f: (k) => 6 * k * k - 1, tex: "6k^{2}-1", closed: "n^{2}(2n+3)" },
          ],
          3: [
            { f: (k) => k * (k + 1) * (k + 2), tex: "k(k+1)(k+2)", closed: "\\frac{n(n+1)(n+2)(n+3)}{4}" },
            { f: (k) => k ** 3 + k, tex: "k^{3}+k", closed: "\\frac{n(n+1)(n^{2}+n+2)}{4}" },
            { f: (k) => (2 * k - 1) ** 2, tex: "(2k-1)^{2}", closed: "\\frac{n(2n-1)(2n+1)}{3}" },
          ],
        };
        // 閉じた式を JS の関数として評価する簡易パーサは使わず、テンプレごとに関数も持たせる
        const FN = {
          "n^{2}": (n) => n * n,
          "n(n+1)": (n) => n * (n + 1),
          "\\frac{n(3n+1)}{2}": (n) => (n * (3 * n + 1)) / 2,
          "\\frac{n(n+1)(n+2)}{3}": (n) => (n * (n + 1) * (n + 2)) / 3,
          "n(2n-1)": (n) => n * (2 * n - 1),
          "n^{2}(2n+3)": (n) => n * n * (2 * n + 3),
          "\\frac{n(n+1)(n+2)(n+3)}{4}": (n) => (n * (n + 1) * (n + 2) * (n + 3)) / 4,
          "\\frac{n(n+1)(n^{2}+n+2)}{4}": (n) => (n * (n + 1) * (n * n + n + 2)) / 4,
          "\\frac{n(2n-1)(2n+1)}{3}": (n) => (n * (2 * n - 1) * (2 * n + 1)) / 3,
          // 誤答用
          "n(n-1)": (n) => n * (n - 1),
          "\\frac{n(n+1)}{2}": (n) => (n * (n + 1)) / 2,
          "n^{2}+n+1": (n) => n * n + n + 1,
          "\\frac{n(3n-1)}{2}": (n) => (n * (3 * n - 1)) / 2,
          "\\frac{n(n+1)(2n+1)}{6}": (n) => (n * (n + 1) * (2 * n + 1)) / 6,
          "n^{2}(2n+1)": (n) => n * n * (2 * n + 1),
          "\\frac{n(n+1)(n+2)}{6}": (n) => (n * (n + 1) * (n + 2)) / 6,
          "\\frac{n(n+1)(n+2)(n+3)}{3}": (n) => (n * (n + 1) * (n + 2) * (n + 3)) / 3,
          "\\frac{n(n+1)(n^{2}+n+1)}{4}": (n) => (n * (n + 1) * (n * n + n + 1)) / 4,
          "\\frac{n(2n+1)(2n+3)}{3}": (n) => (n * (2 * n + 1) * (2 * n + 3)) / 3,
          "\\frac{n(n+1)(2n+1)}{3}": (n) => (n * (n + 1) * (2 * n + 1)) / 3,
          "n(2n+1)": (n) => n * (2 * n + 1),
          "n^{2}(2n-1)": (n) => n * n * (2 * n - 1),
          "2n^{2}": (n) => 2 * n * n,
          "n^{2}+n": (n) => n * n + n,
          "\\frac{n(n+1)(n^{2}+n-2)}{4}": (n) => (n * (n + 1) * (n * n + n - 2)) / 4,
        };
        const e = r.pick(TABLE[lv]);
        // 検算：n=1〜8 で、実際にたした値と一致
        let acc = 0;
        for (let n = 1; n <= 8; n++) {
          acc += e.f(n);
          assert(FN[e.closed](n) === acc, `和の公式の検算 ${e.tex}`);
        }
        // 誤答：n=1〜8 のどこかで実際の和とずれるものだけ
        const cands = Object.keys(FN).filter((c) => c !== e.closed);
        const ok = (c) => {
          let s2 = 0;
          for (let n = 1; n <= 8; n++) {
            s2 += e.f(n);
            if (FN[c](n) !== s2) return true; // ずれる＝誤答として使える
          }
          return false;
        };
        // 近い形のものを優先（同じ分母・同じ次数）
        const usable = r.shuffle(cands.filter(ok));
        const wrong = usable.slice(0, 6).map((c) => [c, c.includes("frac") ? "MC-SIGMA-FORMULA" : "MC-SIGMA-CONSTANT"]);
        return choice({
          q: `$\\displaystyle\\sum_{k=1}^{n}(${e.tex})$ を $n$ の式で表したものはどれですか。`,
          correct: $(e.closed),
          wrongs: labels(wrong, e.closed),
          explain: `和の公式を使って項ごとに計算し、整理します。たとえば $n=1$ のとき和は $${e.f(1)}$、$n=2$ のとき $${e.f(1) + e.f(2)}$、$n=3$ のとき $${e.f(1) + e.f(2) + e.f(3)}$ になるので、これらと一致するものを選べば確かめられます。結果は $${e.closed}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 漸化式 ───────────────────────────────────
  seq_recur: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // a_{n+1} = a_n + d ／ a_{n+1} = p a_n の、はじめの数項
        const kind = r.pick(["add", "mul"]);
        const a1 = r.int(1, 5);
        const n = r.int(5, 7);
        if (kind === "add") {
          const d = r.nz(-4, 5);
          let cur = a1;
          for (let i = 1; i < n; i++) cur += d;
          return num({
            q: `数列 $\\{a_n\\}$ が $a_1=${a1}$、$a_{n+1}=a_n${sgn(d)}$ で定められています。$a_{${n}}$ を求めなさい。`,
            ans: cur,
            wrongs: [[a1 + n * d, "MC-RECUR-INDEX"], [a1 + (n - 2) * d, "MC-RECUR-INDEX"], [a1 * d ** (n - 1), "MC-RECUR-TYPE"], [cur + d, "MC-SLIP"]],
            explain: `$a_{n+1}=a_n${sgn(d)}$ は「となりあう項の差が一定（$${d}$）」なので等差数列です。$a_n=a_1+(n-1)\\times ${pn(d)}$ より $a_{${n}}=${a1}+${n - 1}\\times ${pn(d)}=${cur}$。（第1項から第${n}項まで、${n - 1}回くり返す）`,
          });
        }
        const p = r.pick([2, 3, -2]);
        let cur = a1;
        for (let i = 1; i < n; i++) cur *= p;
        return num({
          q: `数列 $\\{a_n\\}$ が $a_1=${a1}$、$a_{n+1}=${p}a_n$ で定められています。$a_{${n}}$ を求めなさい。`,
          ans: cur,
          wrongs: [[a1 * p ** n, "MC-RECUR-INDEX"], [a1 + (n - 1) * p, "MC-RECUR-TYPE"], [a1 * p * (n - 1), "MC-RECUR-TYPE"], [cur * p, "MC-SLIP"]],
          explain: `$a_{n+1}=${p}a_n$ は「となりあう項の比が一定（$${p}$）」なので等比数列です。$a_n=a_1\\times ${pn(p)}^{n-1}$ より $a_{${n}}=${a1}\\times ${pn(p)}^{${n - 1}}=${cur}$。`,
        });
      }
      if (lv === 2) {
        // a_{n+1} = p a_n + q
        const p = r.pick([2, 3, 4, -2]);
        const q = r.nz(-4, 5);
        const a1 = r.int(-2, 5);
        const n = r.int(5, 7);
        let cur = a1;
        for (let i = 1; i < n; i++) cur = p * cur + q;
        return num({
          q: `数列 $\\{a_n\\}$ が $a_1=${a1}$、$a_{n+1}=${p}a_n${sgn(q)}$ で定められています。$a_{${n}}$ を求めなさい。`,
          ans: cur,
          wrongs: [[a1 * p ** (n - 1) + q * (n - 1), "MC-RECUR-MULT-ADD"], [(() => { let c = a1; for (let i = 1; i <= n; i++) c = p * c + q; return c; })(), "MC-RECUR-INDEX"], [a1 * p ** (n - 1) + q, "MC-RECUR-MULT-ADD"], [(() => { let c = a1; for (let i = 1; i < n; i++) c = p * (c + q); return c; })(), "MC-RECUR-PAREN"]],
          explain: `漸化式を順にくり返して求めます。${(() => {
            let c = a1;
            const seq = [a1];
            for (let i = 1; i < n; i++) {
              c = p * c + q;
              seq.push(c);
            }
            return seq.map((v, i) => `$a_{${i + 1}}=${v}$`).join("、");
          })()}。（$a_{n+1}=pa_n+q$ は、前の項を $p$ 倍してから $q$ をたす）`,
        });
      }
      // 階差数列：a_{n+1} = a_n + (2n+1) 型
      const c1 = r.pick([1, 2, 3]);
      const c0 = r.pick([1, 2, 3, 0, -1]);
      const a1 = r.int(0, 4);
      const n = r.int(5, 8);
      let cur = a1;
      for (let i = 1; i < n; i++) cur += c1 * i + c0;
      const closed = a1 + c1 * ((n - 1) * n) / 2 + c0 * (n - 1);
      assert(cur === closed, "階差数列の検算");
      return num({
        q: `数列 $\\{a_n\\}$ が $a_1=${a1}$、$a_{n+1}=a_n+${c1 === 1 ? "" : c1}n${c0 === 0 ? "" : sgn(c0)}$ で定められています。$a_{${n}}$ を求めなさい。`,
        ans: cur,
        wrongs: [[cur + c1 * n + c0, "MC-RECUR-INDEX"], [cur - (c1 * (n - 1) + c0), "MC-RECUR-INDEX"], [a1 + (c1 + c0) * (n - 1), "MC-RECUR-TYPE"], [cur + 1, "MC-SLIP"]],
        explain: `$a_{n+1}-a_n=${c1 === 1 ? "" : c1}n${c0 === 0 ? "" : sgn(c0)}$（階差）なので、順にたしていきます：$a_{${n}}=a_1+\\sum_{k=1}^{${n - 1}}(${c1 === 1 ? "" : c1}k${c0 === 0 ? "" : sgn(c0)})=${a1}+${cur - a1}=${cur}$。（$k$ は $1$ から $${n - 1}$ まで：$${n}$ までではない）`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 漸化式を解いた一般項。候補は { tex, fn(n) → Q } で持ち、実際の漸化式をくり返した値と n=1〜6 で比べる
        const kind = lv === 1 ? r.pick(["arith", "geom"]) : "alpha";
        let a1;
        let recur;
        let step; // a_n → a_{n+1}
        let good; // { tex, fn }
        let bad; // [{ tex, fn }]
        const pw = (p) => (p.d === 1 && p.n < 0 ? `(${tq(p)})` : p.d === 1 ? tq(p) : `\\left(${tq(p)}\\right)`);
        if (kind === "arith") {
          a1 = r.int(-2, 5);
          const d = r.nz(-4, 6);
          recur = `a_{n+1}=a_n${sgn(d)}`;
          step = (x) => add(x, Q(d));
          good = { tex: `${a1}${sgn(d)}(n-1)`, fn: (n) => Q(a1 + (n - 1) * d) };
          bad = [
            { tex: `${a1}${sgn(d)}n`, fn: (n) => Q(a1 + n * d) },
            { tex: `${a1}${sgn(d)}(n+1)`, fn: (n) => Q(a1 + (n + 1) * d) },
            { tex: `${a1 + d}${sgn(d)}(n-1)`, fn: (n) => Q(a1 + d + (n - 1) * d) },
            { tex: `${a1}\\cdot ${d < 0 ? `(${d})` : d}^{n-1}`, fn: (n) => mul(Q(a1), qpow(Q(d), n - 1)) },
          ];
        } else if (kind === "geom") {
          a1 = r.pick([1, 2, 3, -1, -2]);
          const p = r.pick([2, 3, -2, 4]);
          recur = `a_{n+1}=${p}a_n`;
          step = (x) => mul(x, Q(p));
          const co = (v) => (v === 1 ? "" : v === -1 ? "-" : `${v}\\cdot `);
          const pp = p < 0 ? `(${p})` : `${p}`;
          good = { tex: `${co(a1)}${pp}^{n-1}`, fn: (n) => mul(Q(a1), qpow(Q(p), n - 1)) };
          bad = [
            { tex: `${co(a1)}${pp}^{n}`, fn: (n) => mul(Q(a1), qpow(Q(p), n)) },
            { tex: `${a1}${sgn(p)}(n-1)`, fn: (n) => Q(a1 + p * (n - 1)) },
            { tex: `${co(a1 * p)}${pp}^{n-1}`, fn: (n) => mul(Q(a1 * p), qpow(Q(p), n - 1)) },
            { tex: `${co(a1)}${pp}^{n+1}`, fn: (n) => mul(Q(a1), qpow(Q(p), n + 1)) },
          ];
        } else {
          // a_{n+1} = p a_n + q → a_n = (a_1 − α) p^{n−1} + α、α = q/(1−p)
          const cfg = until(
            () => {
              const p = r.pick([Q(2), Q(3), Q(-2), Q(4), Q(1, 2)]);
              const q = r.nz(-6, 6);
              const alpha = div(Q(q), sub(Q(1), p));
              const a1_ = r.int(-2, 5);
              return { p, q, alpha, a1: a1_ };
            },
            ({ alpha, a1: a }) => alpha.d <= 4 && !eq(Q(a), alpha),
          );
          a1 = cfg.a1;
          const { p, q, alpha } = cfg;
          const coef = sub(Q(a1), alpha);
          recur = `a_{n+1}=${tq(p)}a_n${sgn(q)}`;
          step = (x) => add(mul(x, p), Q(q));
          const mk = (c, expo, al, fnExpo, fnSign = 1) => ({
            tex: `${tq(c)}\\cdot ${pw(p)}^{${expo}}${sgnQ(al)}`,
            fn: (n) => add(mul(c, qpow(p, n + fnExpo)), al),
          });
          good = mk(coef, "n-1", alpha, -1);
          bad = [mk(coef, "n", alpha, 0), mk(coef, "n-1", neg(alpha), -1), mk(Q(a1), "n-1", alpha, -1), mk(add(coef, alpha), "n-1", alpha, -1), mk(coef, "n-1", add(alpha, Q(1)), -1)];
        }
        // 検算：漸化式をくり返した値と、正解の式が n=1〜7 で一致する
        let cur = Q(a1);
        for (let n = 1; n <= 7; n++) {
          assert(eq(cur, good.fn(n)), `漸化式の一般項の検算 n=${n}`);
          cur = step(cur);
        }
        // 誤答は、実際の値とどこかでずれるものだけ
        const seq = [];
        let c2 = Q(a1);
        for (let n = 1; n <= 7; n++) {
          seq.push(c2);
          c2 = step(c2);
        }
        const wrongs = bad.filter((b) => seq.some((v, i) => !eq(v, b.fn(i + 1)))).map((b) => [`a_n=${b.tex}`, "MC-RECUR-CLOSED"]);
        return choice({
          q: `数列 $\\{a_n\\}$ が $a_1=${a1}$、$${recur}$ で定められています。一般項 $a_n$ はどれですか。`,
          correct: $(`a_n=${good.tex}`),
          wrongs: labels(wrongs, `a_n=${good.tex}`),
          explain:
            kind === "arith"
              ? `$a_{n+1}-a_n$ が一定なので等差数列です。一般項は $a_n=a_1+(n-1)d$ より $a_n=${good.tex}$。`
              : kind === "geom"
                ? `$a_{n+1}$ が $a_n$ の一定倍なので等比数列です。一般項は $a_n=a_1r^{n-1}$ より $a_n=${good.tex}$。`
                : `$\\alpha=p\\alpha+q$ を満たす $\\alpha$ を求めると、$a_{n+1}-\\alpha=p(a_n-\\alpha)$ と変形できます。すると $\\{a_n-\\alpha\\}$ は公比 $p$ の等比数列で、$a_n=(a_1-\\alpha)p^{n-1}+\\alpha$。したがって $a_n=${good.tex}$。（$n=1$ を代入して $a_1$ にもどるか確かめられます）`,
        });
      },
      { id: "b", db: 0.25 },
    ),
  ],
};

function pn(n) {
  return n < 0 ? `(${n})` : `${n}`;
}
