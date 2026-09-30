// ============================================================
// tpl/hs_data.js — 高校 集合と論理・場合の数（数A）
//   sets_logic / perm_comb
//
//  すべて自作の数値・言い回し。場合の数は、すべての並べ方・組合せを数え上げて検算している。
// ============================================================
import { num, choice } from "../../core/items.js";
import { Q, sub } from "../../core/rational.js";
import { t, until, assert, gcd, lcm } from "./util.js";
import { fact, nCr, nPr } from "./hs_util.js";

/** 全数え上げ：0..n-1 から k 個を順に選ぶ（重複なし）並べ方をすべて渡す */
function forEachPerm(n, k, cb, used = [], cur = []) {
  if (cur.length === k) {
    cb(cur);
    return;
  }
  for (let i = 0; i < n; i++) {
    if (used[i]) continue;
    used[i] = true;
    cur.push(i);
    forEachPerm(n, k, cb, used, cur);
    cur.pop();
    used[i] = false;
  }
}
/** 0..n-1 から k 個を選ぶ組合せをすべて渡す */
function forEachComb(n, k, cb, start = 0, cur = []) {
  if (cur.length === k) {
    cb(cur);
    return;
  }
  for (let i = start; i < n; i++) {
    cur.push(i);
    forEachComb(n, k, cb, i + 1, cur);
    cur.pop();
  }
}
function countPerm(n, k, pred = () => true) {
  let c = 0;
  forEachPerm(n, k, (p) => {
    if (pred(p)) c++;
  });
  return c;
}
function countComb(n, k, pred = () => true) {
  let c = 0;
  forEachComb(n, k, (p) => {
    if (pred(p)) c++;
  });
  return c;
}

// ------------------------------------------------------------
// 必要条件・十分条件：条件を述語で持ち、ペアの関係を全数チェックで決める
// ------------------------------------------------------------
const COND_R = [
  // 実数 x についての条件（−12〜12 を 1/4 きざみで調べる）
  { lv: 1, tex: "x=2", f: (x) => x === 2 },
  { lv: 1, tex: "x^2=4", f: (x) => x * x === 4 },
  { lv: 1, tex: "x>1", f: (x) => x > 1 },
  { lv: 1, tex: "x>3", f: (x) => x > 3 },
  { lv: 1, tex: "x\\ge 3", f: (x) => x >= 3 },
  { lv: 1, tex: "x<5", f: (x) => x < 5 },
  { lv: 1, tex: "x>0", f: (x) => x > 0 },
  { lv: 1, tex: "x=-1", f: (x) => x === -1 },
  { lv: 2, tex: "|x|<3", f: (x) => Math.abs(x) < 3 },
  { lv: 2, tex: "x^2>4", f: (x) => x * x > 4 },
  { lv: 2, tex: "x^2-x-6=0", f: (x) => x * x - x - 6 === 0 },
  { lv: 2, tex: "x=3", f: (x) => x === 3 },
  { lv: 2, tex: "x^2=x", f: (x) => x * x === x },
  { lv: 2, tex: "x=0\\ \\text{または}\\ x=1", f: (x) => x === 0 || x === 1 },
  { lv: 2, tex: "|x|>2", f: (x) => Math.abs(x) > 2 },
  { lv: 3, tex: "x^2-5x+6<0", f: (x) => x * x - 5 * x + 6 < 0 },
  { lv: 3, tex: "2<x<3", f: (x) => x > 2 && x < 3 },
  { lv: 3, tex: "|x-1|<2", f: (x) => Math.abs(x - 1) < 2 },
  { lv: 3, tex: "-1<x<3", f: (x) => x > -1 && x < 3 },
  { lv: 3, tex: "x(x-3)=0", f: (x) => x * (x - 3) === 0 },
  { lv: 3, tex: "x^2\\le 4", f: (x) => x * x <= 4 },
  { lv: 3, tex: "-2\\le x\\le 2", f: (x) => x >= -2 && x <= 2 },
];
const COND_Z = [
  // 整数 n についての条件（−60〜60 で調べる）
  { lv: 1, tex: "n\\text{ は }6\\text{ の倍数}", f: (n) => n % 6 === 0 },
  { lv: 1, tex: "n\\text{ は }3\\text{ の倍数}", f: (n) => n % 3 === 0 },
  { lv: 1, tex: "n\\text{ は偶数}", f: (n) => n % 2 === 0 },
  { lv: 1, tex: "n\\text{ は }12\\text{ の倍数}", f: (n) => n % 12 === 0 },
  { lv: 2, tex: "n\\text{ は }3\\text{ の倍数かつ偶数}", f: (n) => n % 3 === 0 && n % 2 === 0 },
  { lv: 2, tex: "n\\text{ は }4\\text{ の倍数}", f: (n) => n % 4 === 0 },
  { lv: 2, tex: "n^2\\text{ は偶数}", f: (n) => (n * n) % 2 === 0 },
  { lv: 2, tex: "n\\text{ は }2\\text{ の倍数または }3\\text{ の倍数}", f: (n) => n % 2 === 0 || n % 3 === 0 },
  { lv: 3, tex: "n^2\\text{ は }4\\text{ の倍数}", f: (n) => (n * n) % 4 === 0 },
  { lv: 3, tex: "n\\text{ は }9\\text{ の倍数}", f: (n) => n % 9 === 0 },
  { lv: 3, tex: "n^2\\text{ は }3\\text{ の倍数}", f: (n) => (n * n) % 3 === 0 },
  { lv: 3, tex: "n\\text{ は }6\\text{ の倍数または }4\\text{ の倍数}", f: (n) => n % 6 === 0 || n % 4 === 0 },
];
// 反例は「整数で、絶対値の小さいもの」から探す（説明に出したときに読みやすいように）
const domainOf = (pool) =>
  (pool === COND_R ? Array.from({ length: 97 }, (_, i) => -12 + i / 4) : Array.from({ length: 121 }, (_, i) => i - 60)).sort((a, b) => (Number.isInteger(a) ? 0 : 1) - (Number.isInteger(b) ? 0 : 1) || Math.abs(a) - Math.abs(b) || b - a);
/** p ⇒ q と q ⇒ p を全数チェックして関係を決める。反例（p を満たすが q を満たさない値など）も返す */
function relationOf(pool, p, q) {
  let pqCounter = null; // p かつ not q
  let qpCounter = null; // q かつ not p
  for (const v of domainOf(pool)) {
    if (p.f(v) && !q.f(v) && pqCounter === null) pqCounter = v;
    if (q.f(v) && !p.f(v) && qpCounter === null) qpCounter = v;
  }
  const pq = pqCounter === null;
  const qp = qpCounter === null;
  return { rel: pq && qp ? "iff" : pq ? "suff" : qp ? "nec" : "none", pqCounter, qpCounter };
}
// 全ペアの関係を先に計算しておく（条件が空集合・全体になるものは除く）
const PAIRS = [];
for (const [key, pool] of [["R", COND_R], ["Z", COND_Z]]) {
  for (const p of pool) {
    for (const q of pool) {
      if (p === q) continue;
      const info = relationOf(pool, p, q);
      // 同じ条件を言いかえただけのペアは、必要十分の例として少数だけ残す
      PAIRS.push({ key, p, q, ...info, lv: Math.max(p.lv, q.lv) });
    }
  }
}
const REL_LABEL = {
  suff: "十分条件であるが、必要条件ではない",
  nec: "必要条件であるが、十分条件ではない",
  iff: "必要十分条件である",
  none: "必要条件でも十分条件でもない",
};

export default {
  // ── 集合・要素の個数／必要条件と十分条件 ───────────
  sets_logic: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // n(A∪B) = n(A)+n(B)−n(A∩B)
        const nA = r.int(8, 30);
        const nB = r.int(8, 30);
        const nAB = r.int(2, Math.min(nA, nB) - 2);
        const ask = r.pick(["union", "inter", "onlyA"]);
        const union = nA + nB - nAB;
        // 検算：具体的な集合（整数の集まり）をつくって数える
        const A = new Set(Array.from({ length: nA }, (_, i) => i));
        const B = new Set(Array.from({ length: nB }, (_, i) => nA - nAB + i));
        assert(new Set([...A, ...B]).size === union && [...A].filter((x) => B.has(x)).length === nAB, "集合の要素数の検算");
        if (ask === "union") {
          return num({
            q: `$n(A)=${nA}$、$n(B)=${nB}$、$n(A\\cap B)=${nAB}$ のとき、$n(A\\cup B)$ を求めなさい。`,
            ans: union,
            wrongs: [[nA + nB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA + nB - 2 * nAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA + nB + nAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [Math.max(nA, nB), "MC-SETS-NO-SUBTRACT-INTERSECT"]],
            explain: `$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$。共通部分を2回数えているので1回ぶんひきます。$${nA}+${nB}-${nAB}=${union}$。`,
          });
        }
        if (ask === "inter") {
          return num({
            q: `$n(A)=${nA}$、$n(B)=${nB}$、$n(A\\cup B)=${union}$ のとき、$n(A\\cap B)$ を求めなさい。`,
            ans: nAB,
            wrongs: [[nA + nB + union, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA + nB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [union - Math.max(nA, nB), "MC-SETS-NO-SUBTRACT-INTERSECT"], [nAB + 1, "MC-SLIP"]],
            explain: `$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$ を $n(A\\cap B)$ について解きます。$n(A\\cap B)=n(A)+n(B)-n(A\\cup B)=${nA}+${nB}-${union}=${nAB}$。`,
          });
        }
        return num({
          q: `$n(A)=${nA}$、$n(A\\cap B)=${nAB}$ のとき、$A$ には入るが $B$ には入らない要素の個数 $n(A\\cap\\overline{B})$ を求めなさい。`,
          ans: nA - nAB,
          wrongs: [[nA + nAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA - nAB + 1, "MC-SLIP"]],
          explain: `$A$ の要素は、$B$ にも入る $${nAB}$ 個と、$B$ に入らないものに分かれます。$n(A\\cap\\overline{B})=n(A)-n(A\\cap B)=${nA}-${nAB}=${nA - nAB}$。`,
        });
      }
      if (lv === 2) {
        // 全体 U のうち「どちらでもない」など
        const [nU, nA, nB, nAB] = until(
          () => {
            const nAB = r.int(3, 12);
            return [r.pick([30, 35, 40, 45, 50]), r.int(nAB + 3, 25), r.int(nAB + 3, 25), nAB];
          },
          ([U, A, B, AB]) => A + B - AB <= U - 2,
        );
        const ask = r.pick(["neither", "one", "onlyB"]);
        const union = nA + nB - nAB;
        // 検算：人を番号で表して、条件ごとに数える
        const like = (i) => [i < nA, i >= nA - nAB && i < nA - nAB + nB];
        let cNeither = 0;
        let cOne = 0;
        let cOnlyB = 0;
        for (let i = 0; i < nU; i++) {
          const [a, b] = like(i);
          if (!a && !b) cNeither++;
          if (a !== b) cOne++;
          if (!a && b) cOnlyB++;
        }
        assert(cNeither === nU - union && cOne === nA + nB - 2 * nAB && cOnlyB === nB - nAB, "人数の検算");
        const story = `ある学級の生徒 $${nU}$ 人について調べたところ、Aが好きな人が $${nA}$ 人、Bが好きな人が $${nB}$ 人、両方好きな人が $${nAB}$ 人いました。`;
        if (ask === "neither") {
          return num({
            q: `${story}AもBも好きでない人は何人ですか。`,
            ans: nU - union,
            wrongs: [[nU - nA - nB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nU - nA - nB + 2 * nAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [union, "MC-SETS-COMPLEMENT"], [nU - union + nAB, "MC-SLIP"]],
            explain: `どちらかが好きな人は $n(A\\cup B)=${nA}+${nB}-${nAB}=${union}$ 人。どちらも好きでない人は全体からひいて $${nU}-${union}=${nU - union}$ 人。（ベン図をかいて整理すると確かめられます）`,
          });
        }
        if (ask === "one") {
          return num({
            q: `${story}AとBのどちらか一方だけが好きな人は何人ですか。`,
            ans: nA + nB - 2 * nAB,
            wrongs: [[union, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA + nB - nAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA + nB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [nA - nAB, "MC-SETS-ONLY"]],
            explain: `Aだけが好きな人は $${nA}-${nAB}=${nA - nAB}$ 人、Bだけが好きな人は $${nB}-${nAB}=${nB - nAB}$ 人。合わせて $${nA + nB - 2 * nAB}$ 人。（両方好きな人を2回ひく：$n(A)+n(B)-2n(A\\cap B)$）`,
          });
        }
        return num({
          q: `${story}Bだけが好きな人は何人ですか。`,
          ans: nB - nAB,
          wrongs: [[nB, "MC-SETS-ONLY"], [nA - nAB, "MC-SETS-ONLY"], [nB + nAB, "MC-SETS-ONLY"], [nU - nA, "MC-SETS-COMPLEMENT"]],
          explain: `Bが好きな $${nB}$ 人のうち、Aも好きな $${nAB}$ 人をひいたものが「Bだけ」です。$${nB}-${nAB}=${nB - nAB}$ 人。`,
        });
      }
      // 1〜N の整数のうち、a の倍数・b の倍数の個数
      const [a, b] = r.pick([[3, 5], [4, 6], [2, 7], [6, 10], [4, 10], [3, 4], [5, 7], [6, 8], [9, 6], [4, 14], [3, 8]]);
      const N = r.pick([50, 60, 100, 120]);
      const ask = r.pick(["either", "neither", "aNotB"]);
      let cA = 0;
      let cB = 0;
      let cAB = 0;
      let cEither = 0;
      let cNeither = 0;
      let cANotB = 0;
      for (let k = 1; k <= N; k++) {
        const ia = k % a === 0;
        const ib = k % b === 0;
        if (ia) cA++;
        if (ib) cB++;
        if (ia && ib) cAB++;
        if (ia || ib) cEither++;
        else cNeither++;
        if (ia && !ib) cANotB++;
      }
      const L = lcm(a, b);
      assert(cAB === Math.floor(N / L) && cA === Math.floor(N / a) && cB === Math.floor(N / b), "倍数の個数の検算");
      const head = `$1$ から $${N}$ までの整数のうち、`;
      if (ask === "either") {
        return num({
          q: `${head}$${a}$ の倍数または $${b}$ の倍数であるものは何個ありますか。`,
          ans: cEither,
          wrongs: [[cA + cB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [cA + cB - Math.floor(N / (a * b)), "MC-SETS-LCM"], [cA + cB - 2 * cAB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [cEither + 1, "MC-SLIP"]],
          explain: `$${a}$ の倍数は $\\lfloor ${N}/${a}\\rfloor=${cA}$ 個、$${b}$ の倍数は $\\lfloor ${N}/${b}\\rfloor=${cB}$ 個。両方の倍数（$${a}$ と $${b}$ の最小公倍数 $${L}$ の倍数）は $\\lfloor ${N}/${L}\\rfloor=${cAB}$ 個。$n(A\\cup B)=${cA}+${cB}-${cAB}=${cEither}$。（最小公倍数は $${a}\\times ${b}$ とは限りません）`,
        });
      }
      if (ask === "neither") {
        return num({
          q: `${head}$${a}$ の倍数でも $${b}$ の倍数でもないものは何個ありますか。`,
          ans: cNeither,
          wrongs: [[N - cA - cB, "MC-SETS-NO-SUBTRACT-INTERSECT"], [cEither, "MC-SETS-COMPLEMENT"], [N - cA - cB + Math.floor(N / (a * b)), "MC-SETS-LCM"], [cNeither - 1, "MC-SLIP"]],
          explain: `$${a}$ の倍数または $${b}$ の倍数は $${cA}+${cB}-${cAB}=${cEither}$ 個（共通は最小公倍数 $${L}$ の倍数）。どちらでもないものは全体からひいて $${N}-${cEither}=${cNeither}$ 個。`,
        });
      }
      return num({
        q: `${head}$${a}$ の倍数であるが $${b}$ の倍数ではないものは何個ありますか。`,
        ans: cANotB,
        wrongs: [[cA, "MC-SETS-ONLY"], [cA - Math.floor(N / (a * b)), "MC-SETS-LCM"], [cB - cAB, "MC-SETS-ONLY"], [cANotB + 1, "MC-SLIP"]],
        explain: `$${a}$ の倍数は $${cA}$ 個。そのうち $${b}$ の倍数でもあるもの（$${L}$ の倍数）が $${cAB}$ 個あるので、ひいて $${cA}-${cAB}=${cANotB}$ 個。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 必要条件・十分条件：条件の関係を全数チェックで決めてある
        const want = r.pick(["suff", "nec", "iff", "none"]);
        const pool = PAIRS.filter((x) => x.rel === want && (lv === 3 ? x.lv === 3 : x.lv <= lv) && !(x.rel === "iff" && x.p.tex === x.q.tex));
        // 関係が「必要十分」のペアは少ないので、なければ別の関係にする
        const pick = pool.length ? r.pick(pool) : r.pick(PAIRS.filter((x) => x.rel !== "iff" && (lv === 3 ? x.lv === 3 : x.lv <= lv)));
        const { p, q, rel, pqCounter, qpCounter } = pick;
        const showV = (v) => (Number.isInteger(v) ? String(v) : String(v));
        const varName = pick.key === "R" ? "x" : "n";
        const why = [
          pqCounter === null ? `「$p\\Rightarrow q$」は成り立ちます（$p$ を満たす $${varName}$ はすべて $q$ を満たす）。` : `「$p\\Rightarrow q$」は成り立ちません。反例：$${varName}=${showV(pqCounter)}$ は $p$ を満たしますが $q$ を満たしません。`,
          qpCounter === null ? `「$q\\Rightarrow p$」は成り立ちます。` : `「$q\\Rightarrow p$」は成り立ちません。反例：$${varName}=${showV(qpCounter)}$ は $q$ を満たしますが $p$ を満たしません。`,
        ].join("");
        const correct = REL_LABEL[rel];
        const wrongMc = { suff: "MC-COND-CONFUSE", nec: "MC-COND-CONFUSE", iff: "MC-COND-BOTH", none: "MC-COND-NEITHER" };
        const wrongs = Object.entries(REL_LABEL)
          .filter(([k]) => k !== rel)
          .map(([k, label]) => [label, rel === "suff" && k === "nec" ? "MC-COND-CONFUSE" : rel === "nec" && k === "suff" ? "MC-COND-CONFUSE" : wrongMc[k]]);
        return choice({
          q: `${pick.key === "R" ? "実数" : "整数"} $${varName}$ について、条件 $p$、$q$ を次のように定めます。\n$p$：$${p.tex}$\n$q$：$${q.tex}$\nこのとき、$p$ は $q$ であるための何条件ですか。`,
          correct,
          wrongs,
          explain: `「$p\\Rightarrow q$」が成り立てば $p$ は $q$ の十分条件、「$q\\Rightarrow p$」が成り立てば必要条件です。${why}よって、$p$ は $q$ であるための${correct}。（矢印の向きと、条件の名前を取りちがえない：矢印の根もとが十分条件）`,
        });
      },
      { id: "b", db: 0.25 },
    ),
  ],

  // ── 順列・組合せ ─────────────────────────────
  perm_comb: [
    t("num", (r, lv) => {
      const kind = r.pick(lv === 1 ? ["comb", "perm", "line"] : lv === 2 ? ["mix", "digits", "circle"] : ["adjacent", "notadj", "repeat", "atleast"]);
      const Cn = (n, k) => `{}_{${n}}\\mathrm{C}_{${k}}`;
      const Pn = (n, k) => `{}_{${n}}\\mathrm{P}_{${k}}`;
      if (kind === "comb") {
        const n = r.int(5, 9);
        const k = r.int(2, 4);
        const ans = nCr(n, k);
        assert(countComb(n, k) === ans, "組合せの検算");
        return num({
          q: `${n}人の中から ${k}人の代表を選ぶ選び方は何通りありますか。（代表の間に区別はありません）`,
          ans,
          wrongs: [[nPr(n, k), "MC-PERM-COMB-CONFUSE"], [n * k, "MC-COMB-MULT-ADD"], [ans + n, "MC-SLIP"], [nCr(n, k - 1), "MC-SLIP"]],
          explain: `選ぶ順番を区別しないので組合せです。$${Cn(n, k)}=\\dfrac{${Array.from({ length: k }, (_, i) => n - i).join("\\times ")}}{${Array.from({ length: k }, (_, i) => k - i).join("\\times ")}}=${ans}$。`,
        });
      }
      if (kind === "perm") {
        const n = r.int(5, 9);
        const k = r.int(2, 3);
        const ans = nPr(n, k);
        assert(countPerm(n, k) === ans, "順列の検算");
        return num({
          q: `${n}人の中から ${k === 2 ? "会長と副会長" : "会長・副会長・書記"}を1人ずつ選ぶ選び方は何通りありますか。（兼任はしません）`,
          ans,
          wrongs: [[nCr(n, k), "MC-PERM-COMB-CONFUSE"], [n ** k, "MC-PERM-REPEAT"], [n * k, "MC-COMB-MULT-ADD"], [fact(n), "MC-PERM-COMB-CONFUSE"]],
          explain: `役職がちがうので、選ぶ順番を区別する順列です。$${Pn(n, k)}=${Array.from({ length: k }, (_, i) => n - i).join("\\times ")}=${ans}$。（1人目は${n}通り、2人目は残りの${n - 1}通り…）`,
        });
      }
      if (kind === "line") {
        const n = r.int(4, 7);
        const ans = fact(n);
        assert(countPerm(n, n) === ans, "並べ方の検算");
        return num({
          q: `${n}人が1列に並ぶ並び方は何通りありますか。`,
          ans,
          wrongs: [[n * n, "MC-COMB-MULT-ADD"], [fact(n - 1), "MC-PERM-FACT-OFF"], [n * (n - 1), "MC-PERM-FACT-OFF"], [2 ** n, "MC-COMB-MULT-ADD"]],
          explain: `先頭は${n}通り、次は残りの${n - 1}通り…と順にかけて $${n}!=${Array.from({ length: n }, (_, i) => n - i).join("\\times ")}=${ans}$。`,
        });
      }
      if (kind === "mix") {
        const a = r.int(4, 6);
        const b = r.int(3, 5);
        const k = r.int(1, 3);
        const l = r.int(1, 2);
        const ans = nCr(a, k) * nCr(b, l);
        // 独立な検算：全員から k+l 人を選ぶ組合せのうち、男子がちょうど k 人のものを数える
        assert(countComb(a + b, k + l, (c) => c.filter((i) => i < a).length === k) === ans, "男女選びの検算");
        return num({
          q: `男子 ${a}人、女子 ${b}人の中から、男子 ${k}人と女子 ${l}人を選ぶ選び方は何通りありますか。`,
          ans,
          wrongs: [[nCr(a, k) + nCr(b, l), "MC-COMB-MULT-ADD"], [nCr(a + b, k + l), "MC-COMB-NO-CONDITION"], [nPr(a, k) * nPr(b, l), "MC-PERM-COMB-CONFUSE"], [ans * 2, "MC-SLIP"]],
          explain: `男子の選び方と女子の選び方は同時に起こるので、かけ算（積の法則）です。$${Cn(a, k)}\\times ${Cn(b, l)}=${nCr(a, k)}\\times ${nCr(b, l)}=${ans}$。（「または」のときはたし算、「かつ（同時に）」のときはかけ算）`,
        });
      }
      if (kind === "digits") {
        const withZero = r.chance(0.6);
        const nd = r.int(4, 6);
        const digits = withZero ? Array.from({ length: nd }, (_, i) => i) : Array.from({ length: nd }, (_, i) => i + 1);
        const ans = countPerm(nd, 3, (p) => digits[p[0]] !== 0);
        const formula = withZero ? (nd - 1) * (nd - 1) * (nd - 2) : nPr(nd, 3);
        assert(ans === formula, "3けたの整数の検算");
        return num({
          q: `${digits.join("、")} の ${nd}個の数字から、異なる3個を選んで並べ、3けたの整数をつくります。何個できますか。`,
          ans,
          wrongs: withZero
            ? [[nPr(nd, 3), "MC-DIGITS-ZERO-LEAD"], [nd ** 3, "MC-PERM-REPEAT"], [(nd - 1) ** 3, "MC-PERM-REPEAT"], [nd * (nd - 1) * (nd - 2) - (nd - 1) * (nd - 2), "MC-SLIP"]]
            : [[nd ** 3, "MC-PERM-REPEAT"], [nCr(nd, 3), "MC-PERM-COMB-CONFUSE"], [nd * 3, "MC-COMB-MULT-ADD"], [nPr(nd, 3) + 1, "MC-SLIP"]],
          explain: withZero ? `百の位に $0$ は使えません。百の位は $0$ 以外の${nd - 1}通り、十の位は残りの${nd - 1}通り（$0$ を含む）、一の位は残りの${nd - 2}通り。$${nd - 1}\\times ${nd - 1}\\times ${nd - 2}=${ans}$。` : `百の位は${nd}通り、十の位は${nd - 1}通り、一の位は${nd - 2}通り。$${Pn(nd, 3)}=${nd}\\times ${nd - 1}\\times ${nd - 2}=${ans}$。`,
        });
      }
      if (kind === "circle") {
        const n = r.int(4, 7);
        const ans = fact(n - 1);
        assert(fact(n) / n === ans, "円順列の検算");
        return num({
          q: `${n}人が円形のテーブルのまわりにすわる並び方は何通りありますか。（回転して重なる並び方は同じとみなします）`,
          ans,
          wrongs: [[fact(n), "MC-CIRCULAR-N"], [fact(n - 1) / 2, "MC-CIRCULAR-HALF"], [n * (n - 1), "MC-PERM-FACT-OFF"], [fact(n - 2), "MC-PERM-FACT-OFF"]],
          explain: `1人の席を固定すると、残り${n - 1}人の並べ方が全体の並び方に対応します（回転で重なるものを1つと数える）。円順列は $(n-1)!$ なので $${n - 1}!=${ans}$。（$n!$ を回転の $n$ 通りでわると考えてもよい）`,
        });
      }
      if (kind === "adjacent") {
        const n = r.int(4, 7);
        const ans = countPerm(n, n, (p) => Math.abs(p.indexOf(0) - p.indexOf(1)) === 1);
        assert(ans === 2 * fact(n - 1), "隣り合う並べ方の検算");
        return num({
          q: `${n}人が1列に並ぶとき、AさんとBさんが隣り合う並び方は何通りありますか。`,
          ans,
          wrongs: [[fact(n - 1), "MC-PERM-ADJACENT-MISS"], [fact(n), "MC-PERM-ADJACENT-MISS"], [fact(n) / 2, "MC-PERM-ADJACENT-MISS"], [2 * fact(n - 2), "MC-PERM-FACT-OFF"]],
          explain: `AとBを1つのかたまりと考えると、${n - 1}個のものの並べ方で $${n - 1}!=${fact(n - 1)}$ 通り。かたまりの中でAとBの順序が2通りあるので、$${fact(n - 1)}\\times 2=${ans}$。（順序の2通りを忘れない）`,
        });
      }
      if (kind === "notadj") {
        const n = r.int(4, 7);
        const ans = countPerm(n, n, (p) => Math.abs(p.indexOf(0) - p.indexOf(1)) > 1);
        assert(ans === fact(n) - 2 * fact(n - 1), "隣り合わない並べ方の検算");
        return num({
          q: `${n}人が1列に並ぶとき、AさんとBさんが隣り合わない並び方は何通りありますか。`,
          ans,
          wrongs: [[2 * fact(n - 1), "MC-PERM-ADJACENT-COMPLEMENT"], [fact(n) - fact(n - 1), "MC-PERM-ADJACENT-MISS"], [fact(n) / 2, "MC-PERM-ADJACENT-COMPLEMENT"], [fact(n - 2) * (n - 1) * (n - 2), "MC-SLIP"]],
          explain: `「隣り合わない」は、全体から「隣り合う」をひきます（余事象）。全体は $${n}!=${fact(n)}$ 通り、隣り合うのは $2\\times ${n - 1}!=${2 * fact(n - 1)}$ 通り。$${fact(n)}-${2 * fact(n - 1)}=${ans}$。`,
        });
      }
      if (kind === "repeat") {
        const counts = r.pick([[2, 2, 1], [3, 2], [2, 1, 1, 1], [3, 1, 1], [2, 2, 2], [3, 2, 1]]);
        const n = counts.reduce((x, y) => x + y, 0);
        const names = "ABCD";
        const seq = counts.flatMap((c, i) => Array(c).fill(names[i]));
        const seen = new Set();
        forEachPerm(n, n, (p) => seen.add(p.map((i) => seq[i]).join("")));
        const ans = seen.size;
        const formula = fact(n) / counts.reduce((x, c) => x * fact(c), 1);
        assert(ans === formula, "同じものを含む順列の検算");
        return num({
          q: `${seq.join("、")} の ${n}文字を1列に並べる並べ方は何通りありますか。`,
          ans,
          wrongs: [[fact(n), "MC-PERM-REPEAT-IGNORED"], [fact(n) / fact(counts[0]), "MC-PERM-REPEAT-IGNORED"], [nCr(n, counts[0]), "MC-PERM-COMB-CONFUSE"], [ans * 2, "MC-SLIP"]],
          explain: `同じ文字を区別して並べると $${n}!=${fact(n)}$ 通りですが、同じ文字どうしの入れかえ（${counts.filter((c) => c > 1).map((c) => `${c}!=${fact(c)}`).join("、")}）は同じ並びなので、その分でわります。$\\dfrac{${n}!}{${counts.map((c) => `${c}!`).join("\\times ")}}=${ans}$。`,
        });
      }
      // atleast：少なくとも1人（余事象）
      const [a, b, k] = until(() => [r.int(3, 6), r.int(2, 4), r.int(2, 4)], ([x, y, z]) => z <= x && z <= x + y);
      const ans = countComb(a + b, k, (c) => c.some((i) => i >= a));
      assert(ans === nCr(a + b, k) - nCr(a, k), "少なくとも1人の検算");
      return num({
        q: `男子 ${a}人、女子 ${b}人の中から ${k}人を選ぶとき、女子が少なくとも1人ふくまれる選び方は何通りありますか。`,
        ans,
        wrongs: [[nCr(a + b, k), "MC-ATLEAST-NOCOMPLEMENT"], [b * nCr(a + b - 1, k - 1), "MC-ATLEAST-DOUBLECOUNT"], [nCr(a, k), "MC-ATLEAST-NOCOMPLEMENT"], [nCr(b, 1) * nCr(a, k - 1), "MC-ATLEAST-DOUBLECOUNT"]],
        explain: `「少なくとも1人」は、全体から「1人もふくまれない」場合をひきます（余事象）。全体は $${Cn(a + b, k)}=${nCr(a + b, k)}$ 通り、女子が0人（男子だけ）は $${Cn(a, k)}=${nCr(a, k)}$ 通り。$${nCr(a + b, k)}-${nCr(a, k)}=${ans}$。`,
      });
    }),
  ],
};
