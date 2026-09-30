// ============================================================
// tpl/hs_prob.js — 高校 確率・データの分析・期待値（数A・数I・数B）
//   prob_hs / variance_sd / expected_value
//
//  すべて自作の数値・言い回し。確率は、起こりうる場合をすべて数え上げて検算している。
// ============================================================
import { num } from "../../core/items.js";
import { Q, toQ, add, sub, mul, div, neg, eq, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert, gcd } from "./util.js";
import { nCr, nearly, isqrt } from "./hs_util.js";

/** 組合せ nCk の TeX（`$` の直後に `{` が続かないよう、関数で作る） */
const Cnk = (n, k) => `{}_{${n}}\\mathrm{C}_{${k}}`;

/** 各桁が 0..faces-1 の n 桁のすべての目の出方を渡す */
function forEachRoll(n, faces, cb, cur = []) {
  if (cur.length === n) {
    cb(cur);
    return;
  }
  for (let i = 0; i < faces; i++) {
    cur.push(i + 1);
    forEachRoll(n, faces, cb, cur);
    cur.pop();
  }
}
/** 条件を満たす出方の数と、全体の数 */
function countRolls(n, faces, pred) {
  let good = 0;
  let total = 0;
  forEachRoll(n, faces, (roll) => {
    total++;
    if (pred(roll)) good++;
  });
  return { good, total };
}
/** 0..N-1 から k 個の組合せ／順列をすべて渡す */
function forEachChoice(N, k, ordered, cb, cur = [], start = 0) {
  if (cur.length === k) {
    cb(cur);
    return;
  }
  for (let i = ordered ? 0 : start; i < N; i++) {
    if (ordered && cur.includes(i)) continue;
    cur.push(i);
    forEachChoice(N, k, ordered, cb, cur, i + 1);
    cur.pop();
  }
}
function countChoice(N, k, ordered, pred) {
  let good = 0;
  let total = 0;
  forEachChoice(N, k, ordered, (c) => {
    total++;
    if (pred(c)) good++;
  });
  return { good, total };
}

/** 確率の問題では、0〜1 の外の誤答（確率として起こりえない値）は出さない */
const numP = (spec) => num({ ...spec, wrongs: (spec.wrongs || []).filter(([v]) => qnum(toQ(v)) >= 0 && qnum(toQ(v)) <= 1) });

export default {
  // ── 確率（余事象・独立・反復試行） ─────────────────
  prob_hs: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // 大小2つのさいころ
        const events = [
          { tex: "出た目の和が $7$ になる", f: (v) => v[0] + v[1] === 7 },
          { tex: "出た目の和が $9$ 以上になる", f: (v) => v[0] + v[1] >= 9 },
          { tex: "出た目の和が $5$ の倍数になる", f: (v) => (v[0] + v[1]) % 5 === 0 },
          { tex: "出た目の積が奇数になる", f: (v) => (v[0] * v[1]) % 2 === 1 },
          { tex: "2つの目が同じになる", f: (v) => v[0] === v[1] },
          { tex: "2つの目の差が $2$ になる", f: (v) => Math.abs(v[0] - v[1]) === 2 },
          { tex: "2つとも $4$ 以下の目になる", f: (v) => v[0] <= 4 && v[1] <= 4 },
        ];
        const e = r.pick(events);
        const { good, total } = countRolls(2, 6, e.f);
        const ans = Q(good, total);
        return numP({
          q: `大小2つのさいころを同時に投げるとき、${e.tex}確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [[Q(good, 21), "MC-PROB-EQUALLY-LIKELY"], [Q(good, 6), "MC-PROB-TOTAL"], [Q(good + 1, total), "MC-SLIP"], [Q(total - good, total), "MC-PROB-COMPLEMENT"]],
          explain: `大小2つのさいころの目の出方は全部で $6\\times 6=36$ 通りで、どれも同じ確率で起こります（大と小を区別する）。条件に合うものを数えると ${good} 通り。確率は $\\dfrac{${good}}{36}=${tq(ans)}$。`,
        });
      }
      if (lv === 2) {
        // 余事象
        const kind = r.pick(["dice6", "diceEven", "coin", "diceBig"]);
        if (kind === "coin") {
          const n = r.int(3, 5);
          const { good, total } = countRolls(n, 2, (v) => v.some((x) => x === 1));
          const ans = Q(good, total);
          assert(eq(ans, sub(Q(1), Q(1, 2 ** n))), "コインの余事象の検算");
          return numP({
            q: `コインを ${n}回投げるとき、少なくとも1回は表が出る確率を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs: [[Q(1, 2 ** n), "MC-PROB-COMPLEMENT"], [Q(n, 2 ** n), "MC-PROB-ADD-INDEP"], [Q(1, 2), "MC-PROB-COMPLEMENT"], [sub(Q(1), Q(1, 2 ** (n - 1))), "MC-SLIP"]],
            explain: `「少なくとも1回は表」の余事象は「すべて裏」です。すべて裏になる確率は $\\left(\\dfrac12\\right)^{${n}}=\\dfrac{1}{${2 ** n}}$。よって $1-\\dfrac{1}{${2 ** n}}=${tq(ans)}$。`,
          });
        }
        const n = r.pick([2, 3]);
        const spec =
          kind === "dice6"
            ? { tex: `${n}個のさいころを同時に投げるとき、少なくとも1個は $6$ の目が出る`, f: (v) => v.some((x) => x === 6), notP: Q(5, 6) }
            : kind === "diceEven"
              ? { tex: `${n}個のさいころを同時に投げるとき、出た目の積が偶数になる`, f: (v) => v.reduce((a, b) => a * b, 1) % 2 === 0, notP: Q(1, 2) }
              : { tex: `${n}個のさいころを同時に投げるとき、少なくとも1個は $5$ 以上の目が出る`, f: (v) => v.some((x) => x >= 5), notP: Q(2, 3) };
        const { good, total } = countRolls(n, 6, spec.f);
        const ans = Q(good, total);
        let notAll = Q(1);
        for (let i = 0; i < n; i++) notAll = mul(notAll, spec.notP);
        assert(eq(ans, sub(Q(1), notAll)), "余事象の検算");
        return numP({
          q: `${spec.tex}確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [[notAll, "MC-PROB-COMPLEMENT"], [mul(Q(n), sub(Q(1), spec.notP)), "MC-PROB-ADD-INDEP"], [sub(Q(1), spec.notP), "MC-PROB-COMPLEMENT"], [add(ans, Q(1, total)), "MC-SLIP"]],
          explain: `「少なくとも1つ〜」や「〜が偶数」のように数えにくいときは、余事象を使います。余事象（そうならない場合）の確率は ${n > 0 ? `$\\left(${tq(spec.notP)}\\right)^{${n}}=${tq(notAll)}$` : ""}。よって $1-${tq(notAll)}=${tq(ans)}$。（ひとつずつの確率をかけるのは、それぞれが独立だから）`,
        });
      }
      // 反復試行：n 回のうちちょうど k 回
      const useCoin = r.chance(0.4);
      if (useCoin) {
        const n = r.int(4, 6);
        const k = r.int(1, n - 1);
        const { good, total } = countRolls(n, 2, (v) => v.filter((x) => x === 1).length === k);
        const ans = Q(good, total);
        assert(good === nCr(n, k), "反復試行(コイン)の検算");
        return numP({
          q: `コインを ${n}回投げるとき、ちょうど ${k}回表が出る確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [[Q(1, 2 ** n), "MC-PROB-BINOM-COMB"], [Q(k, n), "MC-PROB-BINOM-COMB"], [Q(nCr(n, k), 2 ** k), "MC-PROB-BINOM-POWER"], [Q(nCr(n, k) + 1, 2 ** n), "MC-SLIP"]],
          explain: `反復試行の確率：$1$ 回の試行で確率 $p$ の事象が、$n$ 回中ちょうど $k$ 回起こる確率は $${Cnk("n", "k")}\\,p^k(1-p)^{n-k}$。表の出る確率は $\\dfrac12$ なので $${Cnk(n, k)}\\left(\\dfrac12\\right)^{${k}}\\left(\\dfrac12\\right)^{${n - k}}=\\dfrac{${nCr(n, k)}}{${2 ** n}}=${tq(ans)}$。`,
        });
      }
      const n = r.int(4, 5);
      const ev = r.pick([
        { tex: "$3$ 以上の目", p: Q(2, 3), f: (x) => x >= 3 },
        { tex: "$1$ か $2$ の目", p: Q(1, 3), f: (x) => x <= 2 },
        { tex: "偶数の目", p: Q(1, 2), f: (x) => x % 2 === 0 },
      ]);
      const k = r.int(1, n - 1);
      const { good, total } = countRolls(n, 6, (v) => v.filter(ev.f).length === k);
      const ans = Q(good, total);
      let pk = Q(1);
      for (let i = 0; i < k; i++) pk = mul(pk, ev.p);
      let qk = Q(1);
      for (let i = 0; i < n - k; i++) qk = mul(qk, sub(Q(1), ev.p));
      assert(eq(ans, mul(Q(nCr(n, k)), mul(pk, qk))), "反復試行(さいころ)の検算");
      return numP({
        q: `1個のさいころを ${n}回投げるとき、${ev.tex}がちょうど ${k}回出る確率を求めなさい。（分数で答えます）`,
        ans,
        reduced: true,
        wrongs: [[mul(pk, qk), "MC-PROB-BINOM-COMB"], [mul(Q(nCr(n, k)), pk), "MC-PROB-BINOM-POWER"], [mul(Q(k), mul(pk, qk)), "MC-PROB-BINOM-COMB"], [add(ans, Q(1, 6 ** n)), "MC-SLIP"]],
        explain: `1回で${ev.tex}が出る確率は $${tq(ev.p)}$、出ない確率は $${tq(sub(Q(1), ev.p))}$。${n}回のうち${k}回だけ出る出方は $${nCr(n, k)}$ 通り（どの${k}回にするか）で、そのどれも確率は $\\left(${tq(ev.p)}\\right)^{${k}}\\left(${tq(sub(Q(1), ev.p))}\\right)^{${n - k}}$。よって $${nCr(n, k)}\\times ${tq(mul(pk, qk))}=${tq(ans)}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 袋から取り出す
        const [red, white] = until(() => [r.int(2, 5), r.int(2, 4)], ([a, b]) => a + b <= 8);
        const N = red + white;
        const isRed = (i) => i < red;
        if (lv === 1) {
          const kind = r.pick(["bothRed", "same", "diff"]);
          const pred = kind === "bothRed" ? (c) => c.every(isRed) : kind === "same" ? (c) => isRed(c[0]) === isRed(c[1]) : (c) => isRed(c[0]) !== isRed(c[1]);
          const { good, total } = countChoice(N, 2, false, pred);
          const ans = Q(good, total);
          const goodF = kind === "bothRed" ? nCr(red, 2) : kind === "same" ? nCr(red, 2) + nCr(white, 2) : red * white;
          assert(good === goodF && total === nCr(N, 2), "取り出しの検算");
          return numP({
            q: `袋の中に赤玉が ${red}個、白玉が ${white}個入っています。この袋から同時に2個の玉を取り出すとき、${kind === "bothRed" ? "2個とも赤玉である" : kind === "same" ? "2個が同じ色である" : "2個が異なる色である"}確率を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs: [[Q(goodF, N * (N - 1)), "MC-PROB-COMB-PERM"], [mul(Q(red, N), Q(red, N)), "MC-PROB-REPLACE"], [Q(goodF, N), "MC-PROB-TOTAL"], [Q(goodF + 1, total), "MC-SLIP"]],
            explain: `全部で ${N}個から2個を選ぶ選び方は $${Cnk(N, 2)}=${nCr(N, 2)}$ 通り。${kind === "bothRed" ? `2個とも赤玉になるのは $${Cnk(red, 2)}=${goodF}$ 通り` : kind === "same" ? `同じ色になるのは、赤2個が $${Cnk(red, 2)}=${nCr(red, 2)}$ 通り、白2個が $${Cnk(white, 2)}=${nCr(white, 2)}$ 通りで、合わせて ${goodF} 通り` : `異なる色になるのは、赤1個と白1個で $${red}\\times ${white}=${goodF}$ 通り`}。確率は $\\dfrac{${goodF}}{${nCr(N, 2)}}=${tq(ans)}$。`,
          });
        }
        if (lv === 2) {
          // 1個ずつ2回取り出す（もどさない）
          const kind = r.pick(["redThenWhite", "sameColor", "secondRed"]);
          const pred = kind === "redThenWhite" ? (c) => isRed(c[0]) && !isRed(c[1]) : kind === "sameColor" ? (c) => isRed(c[0]) === isRed(c[1]) : (c) => isRed(c[1]);
          const { good, total } = countChoice(N, 2, true, pred);
          const ans = Q(good, total);
          const p1 = kind === "redThenWhite" ? mul(Q(red, N), Q(white, N - 1)) : kind === "sameColor" ? add(mul(Q(red, N), Q(red - 1, N - 1)), mul(Q(white, N), Q(white - 1, N - 1))) : Q(red, N);
          assert(eq(ans, p1), "順に取り出す確率の検算");
          const label = kind === "redThenWhite" ? "1個目が赤玉、2個目が白玉である" : kind === "sameColor" ? "2個とも同じ色である" : "2個目が赤玉である";
          return numP({
            q: `袋の中に赤玉が ${red}個、白玉が ${white}個入っています。この袋から玉を1個ずつ、もとにもどさずに2個取り出すとき、${label}確率を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs:
              kind === "redThenWhite"
                ? [[mul(Q(red, N), Q(white, N)), "MC-PROB-REPLACE"], [add(Q(red, N), Q(white, N - 1)), "MC-PROB-ADD-INDEP"], [mul(Q(red, N), Q(red - 1, N - 1)), "MC-PROB-COMPLEMENT"], [Q(red * white, nCr(N, 2)), "MC-PROB-COMB-PERM"]]
                : kind === "sameColor"
                  ? [[add(mul(Q(red, N), Q(red, N)), mul(Q(white, N), Q(white, N))), "MC-PROB-REPLACE"], [mul(Q(red, N), Q(red - 1, N - 1)), "MC-PROB-ONE-CASE"], [Q(nCr(red, 2) + nCr(white, 2), N * (N - 1)), "MC-PROB-COMB-PERM"], [sub(Q(1), ans), "MC-PROB-COMPLEMENT"]]
                  : [[mul(Q(red, N), Q(red - 1, N - 1)), "MC-PROB-ONE-CASE"], [Q(red - 1, N - 1), "MC-PROB-ONE-CASE"], [Q(red, N - 1), "MC-PROB-ONE-CASE"], [Q(white, N), "MC-PROB-COMPLEMENT"]],
            explain: kind === "redThenWhite" ? `1個目が赤玉の確率は $\\dfrac{${red}}{${N}}$。そのとき残りは ${N - 1}個で白玉は ${white}個なので、2個目が白玉の確率は $\\dfrac{${white}}{${N - 1}}$。かけ合わせて $\\dfrac{${red}}{${N}}\\times\\dfrac{${white}}{${N - 1}}=${tq(ans)}$。（もどさないので、2回目は全体が1個減る）` : kind === "sameColor" ? `2個とも赤：$\\dfrac{${red}}{${N}}\\times\\dfrac{${red - 1}}{${N - 1}}$、2個とも白：$\\dfrac{${white}}{${N}}\\times\\dfrac{${white - 1}}{${N - 1}}$。この2つは同時に起こらないので、たして $${tq(ans)}$。` : `2個目が赤玉になるのは、「1個目が赤で2個目も赤」または「1個目が白で2個目が赤」の2通り。$\\dfrac{${red}}{${N}}\\times\\dfrac{${red - 1}}{${N - 1}}+\\dfrac{${white}}{${N}}\\times\\dfrac{${red}}{${N - 1}}=${tq(ans)}$。（1個目に関係なく、2個目が赤の確率は最初の赤の割合と同じ）`,
          });
        }
        // 3個同時：ちょうど 2個が赤
        const [red3, white3] = until(() => [r.int(3, 5), r.int(3, 4)], ([a, b]) => a + b <= 9);
        const N3 = red3 + white3;
        const { good, total } = countChoice(N3, 3, false, (c) => c.filter((i) => i < red3).length === 2);
        const ans = Q(good, total);
        assert(good === nCr(red3, 2) * white3, "3個取り出しの検算");
        return numP({
          q: `袋の中に赤玉が ${red3}個、白玉が ${white3}個入っています。この袋から同時に3個の玉を取り出すとき、赤玉がちょうど2個である確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [[Q(nCr(red3, 2), nCr(N3, 3)), "MC-PROB-BINOM-COMB"], [Q(nCr(red3, 2) * white3, N3 * (N3 - 1) * (N3 - 2)), "MC-PROB-COMB-PERM"], [mul(mul(Q(red3, N3), Q(red3 - 1, N3 - 1)), Q(white3, N3 - 2)), "MC-PROB-ONE-CASE"], [Q(nCr(red3, 2) + white3, nCr(N3, 3)), "MC-COMB-MULT-ADD"]],
          explain: `全体は $${Cnk(N3, 3)}=${nCr(N3, 3)}$ 通り。赤2個を選ぶのが $${Cnk(red3, 2)}=${nCr(red3, 2)}$ 通り、白1個を選ぶのが ${white3} 通りで、同時に起こるのでかけて $${nCr(red3, 2) * white3}$ 通り。確率は $\\dfrac{${nCr(red3, 2) * white3}}{${nCr(N3, 3)}}=${tq(ans)}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],

  // ── 分散・標準偏差 ─────────────────────────────
  variance_sd: [
    t("num", (r, lv) => {
      // 平均が整数で、偏差の2乗の和が n でわり切れるデータ
      const n = lv === 3 ? 6 : 5;
      const needSquare = lv === 3 && r.chance(0.5);
      const { m, d } = until(
        () => {
          const m = r.int(6, 20);
          const d = Array.from({ length: n - 1 }, () => r.int(-5, 5));
          d.push(-d.reduce((a, b) => a + b, 0));
          return { m, d };
        },
        ({ m, d }) => {
          const ss = d.reduce((a, x) => a + x * x, 0);
          return Math.abs(d[n - 1]) <= 6 && ss > 0 && ss % n === 0 && d.every((x) => m + x >= 1) && new Set(d).size >= 3 && (!needSquare || isqrt(ss / n) !== null);
        },
        5000,
      );
      const data = r.shuffle(d.map((x) => m + x));
      const ss = d.reduce((a, x) => a + x * x, 0);
      const varc = ss / n;
      // 独立な検算：平均と分散を素直に計算
      const mean = data.reduce((a, b) => a + b, 0) / n;
      nearly(mean, m, "平均の検算");
      nearly(data.reduce((a, x) => a + (x - mean) ** 2, 0) / n, varc, "分散の検算");
      const list = data.join(",\\ ");
      const sumSq = data.reduce((a, x) => a + x * x, 0);
      if (lv === 1) {
        return num({
          q: `次の${n}個のデータの平均値を求めなさい。\n$${list}$`,
          ans: m,
          wrongs: [[data.reduce((a, b) => a + b, 0), "MC-MEAN-NO-DIVIDE"], [[...data].sort((a, b) => a - b)[Math.floor(n / 2)] === m ? m + 1 : [...data].sort((a, b) => a - b)[Math.floor(n / 2)], "MC-MEAN-MEDIAN"], [m + 1, "MC-SLIP"], [m - 1, "MC-SLIP"]],
          explain: `平均値 ＝（データの合計）÷（データの個数）。合計は $${data.join("+")}=${data.reduce((a, b) => a + b, 0)}$、個数は ${n} なので $${data.reduce((a, b) => a + b, 0)}\\div ${n}=${m}$。`,
        });
      }
      if (lv === 2) {
        return num({
          q: `次の${n}個のデータの分散を求めなさい。\n$${list}$`,
          ans: varc,
          wrongs: [[ss, "MC-VAR-NO-DIVIDE"], [Q(ss, n - 1), "MC-VAR-DIVIDE-N1"], [Math.round(sumSq / n), "MC-VAR-NO-SUBTRACT-MEAN"], [isqrt(varc) !== null ? isqrt(varc) : varc + 1, "MC-VAR-SD-CONFUSE"]],
          explain: `平均は $${m}$。各データの平均との差（偏差）は $${d.map((x, i) => `${data[i]}-${m}=${data[i] - m}`).join(",\\ ")}$。偏差を2乗して平均をとると分散です：$\\dfrac{${data.map((x) => `(${x - m})^2`).join("+")}}{${n}}=\\dfrac{${ss}}{${n}}=${varc}$。（別の方法：「$x^{2}$ の平均」から「平均の 2 乗」をひいても求められる）`,
        });
      }
      if (needSquare) {
        const sd = isqrt(varc);
        return num({
          q: `次の${n}個のデータの標準偏差を求めなさい。\n$${list}$`,
          ans: sd,
          wrongs: [[varc, "MC-VAR-SD-CONFUSE"], [Q(ss, n - 1), "MC-VAR-DIVIDE-N1"], [ss, "MC-VAR-NO-DIVIDE"], [sd + 1, "MC-SLIP"]],
          explain: `平均は $${m}$。偏差の2乗の合計は $${ss}$、分散は $\\dfrac{${ss}}{${n}}=${varc}$。標準偏差は分散の正の平方根なので $\\sqrt{${varc}}=${sd}$。（分散のままで答えない）`,
        });
      }
      // 変量変換：分散 v の変量 x から y = a x + b をつくる
      const v = r.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
      const mu = r.int(3, 12);
      const a = r.pick([2, 3, -2, -3, 4]);
      const b = r.int(-5, 8);
      return num({
        q: `変量 $x$ のデータの平均値が $${mu}$、分散が $${v}$ です。$y=${a === -1 ? "-" : a}x${b >= 0 ? "+" : ""}${b}$ とおくとき、$y$ の分散を求めなさい。`,
        ans: a * a * v,
        wrongs: [[a * v, "MC-VAR-TRANSFORM"], [a * a * v + b, "MC-VAR-TRANSFORM"], [a * v + b, "MC-VAR-TRANSFORM"], [Math.abs(a) * v * v, "MC-VAR-TRANSFORM"]],
        explain: `$y=ax+b$ のとき、平均は $a\\times$（$x$の平均）$+b$ ですが、分散は $a^2\\times$（$x$の分散）になります（$b$ は分散に影響せず、$a$ は2乗で効く）。$(${a})^2\\times ${v}=${a * a * v}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 分散 ＝（2乗の平均）－（平均）²
          const m = r.int(3, 10);
          const v = r.int(1, 12);
          const s2 = m * m + v;
          return num({
            q: `あるデータについて、平均値が $${m}$、各値を2乗した値の平均が $${s2}$ です。このデータの分散を求めなさい。`,
            ans: v,
            wrongs: [[s2 - m, "MC-VAR-NO-SUBTRACT-MEAN"], [s2, "MC-VAR-NO-SUBTRACT-MEAN"], [s2 + m * m, "MC-VAR-NO-SUBTRACT-MEAN"], [m * m, "MC-VAR-NO-SUBTRACT-MEAN"]],
            explain: `分散 ＝（2乗の平均）−（平均の2乗）。$${s2}-${m}^2=${s2}-${m * m}=${v}$。（平均を2乗するのを忘れない）`,
          });
        }
        if (lv === 2) {
          const mu = r.int(3, 12);
          const sd = r.pick([2, 3, 4, 5]);
          const a = r.pick([2, 3, -2, 4]);
          const b = r.int(-5, 8);
          const askMean = r.chance(0.5);
          return num({
            q: `変量 $x$ のデータの平均値が $${mu}$、標準偏差が $${sd}$ です。$y=${a}x${b >= 0 ? "+" : ""}${b}$ とおくとき、$y$ の${askMean ? "平均値" : "標準偏差"}を求めなさい。`,
            ans: askMean ? a * mu + b : Math.abs(a) * sd,
            wrongs: askMean ? [[a * mu, "MC-MEAN-TRANSFORM"], [mu + b, "MC-MEAN-TRANSFORM"], [a * (mu + b), "MC-MEAN-TRANSFORM"], [a + mu + b, "MC-MEAN-TRANSFORM"]] : [[a * sd + b, "MC-VAR-TRANSFORM"], [a * a * sd, "MC-VAR-TRANSFORM"], [a * sd, "MC-VAR-TRANSFORM"], [sd, "MC-VAR-TRANSFORM"]],
            explain: askMean ? `平均は $y=ax+b$ と同じように変換されます。$${a}\\times ${mu}${b >= 0 ? "+" : ""}${b}=${a * mu + b}$。` : `標準偏差は $|a|$ 倍になり、$b$ は影響しません。$|${a}|\\times ${sd}=${Math.abs(a) * sd}$。（負の数をかけても、標準偏差は負にならない）`,
          });
        }
        // 2つのグループ全体の平均
        const [n1, n2] = until(() => [r.int(10, 30), r.int(10, 30)], ([x, y]) => x !== y);
        const m1 = r.int(50, 80);
        const m2 = r.int(50, 80);
        const ans = Q(n1 * m1 + n2 * m2, n1 + n2);
        return num({
          q: `A組 ${n1}人の数学の平均点は ${m1}点、B組 ${n2}人の平均点は ${m2}点でした。2つの組全体（${n1 + n2}人）の平均点を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [[Q(m1 + m2, 2), "MC-MEAN-WEIGHT"], [Q(n1 * m1 + n2 * m2, 2), "MC-MEAN-WEIGHT"], [Q(n1 * m1 + n2 * m2, n1 * n2), "MC-MEAN-WEIGHT"], [Q(n1 * m1 + n2 * m2 + 1, n1 + n2), "MC-SLIP"]],
          explain: `平均点を単純に平均してはいけません。それぞれの合計点を求めて全体の人数でわります。A組の合計は $${n1}\\times ${m1}=${n1 * m1}$、B組の合計は $${n2}\\times ${m2}=${n2 * m2}$。全体の平均は $\\dfrac{${n1 * m1}+${n2 * m2}}{${n1 + n2}}=${tq(ans)}$。`,
        });
      },
      { id: "b", db: 0.15 },
    ),
  ],

  // ── 期待値 ───────────────────────────────────
  expected_value: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // 面に書かれた数のさいころ
        const faces = r.shuffle(r.pick([[1, 1, 2, 3, 3, 6], [1, 2, 2, 2, 5, 6], [0, 0, 1, 2, 4, 5], [1, 1, 1, 2, 4, 6], [2, 2, 3, 3, 4, 8]]));
        const total = faces.reduce((a, b) => a + b, 0);
        const E = Q(total, 6);
        nearly(total / 6, qnum(E), "期待値の検算");
        return num({
          q: `6つの面に ${faces.join("、")} と書かれたさいころを1回投げるとき、出た面に書かれた数の期待値を求めなさい。（分数で答えます）`,
          ans: E,
          reduced: true,
          wrongs: [[Q(total, 21), "MC-EXPECT-NO-WEIGHT"], [Q(total), "MC-EXPECT-NO-WEIGHT"], [Q(Math.max(...faces) + Math.min(...faces), 2), "MC-EXPECT-NO-WEIGHT"], [add(E, Q(1, 6)), "MC-SLIP"]],
          explain: `期待値 ＝（値）×（その確率）の合計。どの面も出る確率は $\\dfrac16$ なので、$\\dfrac{${faces.join("+")}}{6}=\\dfrac{${total}}{6}=${tq(E)}$。（同じ数が複数の面に書かれていても、面の数ぶん数える）`,
        });
      }
      if (lv === 2) {
        // くじ：賞金と本数
        const PRIZE_SETS = [[[1000, 1], [100, 4]], [[500, 2], [50, 8]], [[2000, 1], [200, 3], [20, 10]], [[300, 2], [100, 5], [10, 10]], [[1000, 1], [100, 5], [10, 20]]];
        const [total, prizes] = until(
          () => [r.pick([20, 50, 100]), r.pick(PRIZE_SETS)],
          ([tt, ps]) => ps.reduce((a, [, c]) => a + c, 0) <= tt - 2,
        );
        const sum = prizes.reduce((a, [amt, c]) => a + amt * c, 0);
        const E = Q(sum, total);
        // 独立な検算：全部のくじを並べて平均
        const all = [];
        for (const [amt, c] of prizes) for (let i = 0; i < c; i++) all.push(amt);
        while (all.length < total) all.push(0);
        nearly(all.reduce((a, b) => a + b, 0) / total, qnum(E), "くじの期待値の検算");
        return num({
          q: `${total}本のくじの中に、${prizes.map(([a, c]) => `${a}円が${c}本`).join("、")}あり、残りははずれ（0円）です。このくじを1本ひくとき、もらえる金額の期待値を求めなさい。（円。分数で答えます）`,
          ans: E,
          post: "円",
          reduced: true,
          wrongs: [[Q(sum), "MC-EXPECT-NO-WEIGHT"], [Q(sum, prizes.length), "MC-EXPECT-NO-WEIGHT"], [Q(prizes.reduce((a, [amt]) => a + amt, 0), total), "MC-EXPECT-NO-WEIGHT"], [add(E, Q(1)), "MC-SLIP"]],
          explain: `期待値 ＝（金額）×（その確率）の合計。1本あたりの確率は $\\dfrac{1}{${total}}$ なので、$${prizes.map(([a, c]) => `${a}\\times\\dfrac{${c}}{${total}}`).join("+")}=\\dfrac{${prizes.map(([a, c]) => `${a * c}`).join("+")}}{${total}}=\\dfrac{${sum}}{${total}}=${tq(E)}$（円）。（はずれは $0$ 円なので、たしても変わらない）`,
        });
      }
      // E(aX+b)：表から E(X) を求めてから変換する
      const N = r.pick([5, 6, 8, 10]);
      const k = r.int(3, 4);
      const xs = r.shuffle([0, 1, 2, 3, 4, 5, 6, 8, 10]).slice(0, k).sort((u, v) => u - v);
      const cuts = until(
        () => Array.from({ length: k }, () => r.int(1, N - k + 1)),
        (cs) => cs.reduce((x, y) => x + y, 0) === N,
      );
      const a = r.pick([2, 3, -1, 5]);
      const b = r.int(-3, 9);
      const EX = Q(xs.reduce((sum, x, i) => sum + x * cuts[i], 0), N);
      const ans = add(mul(Q(a), EX), Q(b));
      // 独立な検算：Y = aX+b の値ごとに（値）×（確率）をたす
      let direct = Q(0);
      xs.forEach((x, i) => {
        direct = add(direct, mul(Q(a * x + b), Q(cuts[i], N)));
      });
      assert(eq(direct, ans), "E(aX+b) の検算");
      return num({
        q: `確率変数 $X$ のとりうる値と、その確率が次の表のとおりです。\n$X$：${xs.join("、")}\n確率：${cuts.map((c) => `$\\dfrac{${c}}{${N}}$`).join("、")}\n$Y=${a === -1 ? "-" : a}X${b >= 0 ? "+" : ""}${b}$ とするとき、$Y$ の期待値 $E(Y)$ を求めなさい。（分数で答えます）`,
        ans,
        reduced: true,
        wrongs: [[mul(Q(a), EX), "MC-EXPECT-TRANSFORM"], [add(EX, Q(b)), "MC-EXPECT-TRANSFORM"], [mul(Q(a), add(EX, Q(b))), "MC-EXPECT-TRANSFORM"], [sub(mul(Q(a), EX), Q(b)), "MC-EXPECT-TRANSFORM"]],
        explain: `まず $E(X)=${xs.map((x, i) => `${x}\\times\\dfrac{${cuts[i]}}{${N}}`).join("+")}=${tq(EX)}$。期待値には $E(aX+b)=aE(X)+b$ の関係があるので、$E(Y)=${a}\\times ${tq(EX)}${b >= 0 ? "+" : ""}${b}=${tq(ans)}$。（$a$ 倍して、あとから $b$ をたす）`,
      });
    }),
  ],
};
