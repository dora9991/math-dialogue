// ============================================================
// tpl/hs_extA.js — 高校 数学A（新しい学習指導要領で加わった・抜けていた単元）
//   prob_cond / int_divisor / int_eq / int_base / geom_centers / geom_ratio / geom_circle_hs / polyhedron
//
//  すべて自作の数値・言い回し・図。答えは、全数の数え上げ・座標で作図した値など、
//  問題文の公式とは別の方法でも計算し直して確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, eq, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert, gcd, lcm } from "./util.js";
import { nearly } from "./hs_util.js";
import { geoFigure } from "./fig.js";

const $ = (s) => `$${s}$`;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** TeX の表（1行目が見出し）。rows は文字列の2次元配列。見出しの行と、最後の行（計）の前に横線 */
function texTable(head, rows, { total = false } = {}) {
  const cols = head.length;
  const spec = total ? `c|${"c".repeat(cols - 2)}|c` : `c|${"c".repeat(cols - 1)}`;
  const line = (r) => r.join(" & ");
  const body = rows.map(line);
  const last = total ? [body.slice(0, -1).join(" \\\\ "), body[body.length - 1]].join(" \\\\ \\hline ") : body.join(" \\\\ ");
  return `\\begin{array}{${spec}} ${line(head)} \\\\ \\hline ${last} \\end{array}`;
}
const tx = (s) => `\\text{${s}}`;
/** n/d を \dfrac で書き、約分できるときは「＝約分した形」も続ける */
const fracEq = (n, d) => (gcd(n, d) === 1 ? `\\dfrac{${n}}{${d}}` : `\\dfrac{${n}}{${d}}=${tq(Q(n, d))}`);

/** 角 PVQ（度）。点は [x, y] */
function angleAt(V, P, Q_) {
  const a1 = Math.atan2(P[1] - V[1], P[0] - V[0]);
  const a2 = Math.atan2(Q_[1] - V[1], Q_[0] - V[0]);
  let d = Math.abs(deg(a1 - a2));
  if (d > 180) d = 360 - d;
  return d;
}
const dist = (P, Q_) => Math.hypot(P[0] - Q_[0], P[1] - Q_[1]);

/** 3つの角（度）から三角形の頂点を作る。B=(0,0)、C=(1,0)、A は上側 */
function triFromAngles(A, B) {
  const C = 180 - A - B;
  // 正弦定理：BC = sin A、CA = sin B、AB = sin C（比だけが大事）。B から角 B の方向へ AB の長さ
  const s = 1 / Math.sin(rad(A));
  const ab = Math.sin(rad(C)) * s;
  return { A: [ab * Math.cos(rad(B)), ab * Math.sin(rad(B))], B: [0, 0], C: [1, 0] };
}
/** 3辺の長さから三角形の頂点を作る。B=(0,0)、C=(a,0)、A は上側（a=BC, b=CA, c=AB） */
function triFromSides(a, b, c) {
  const x = (a * a + c * c - b * b) / (2 * a);
  const y = Math.sqrt(c * c - x * x);
  return { A: [x, y], B: [0, 0], C: [a, 0] };
}
/** 外心 */
function circumcenter(A, B, C) {
  const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
  const sq = (P) => P[0] * P[0] + P[1] * P[1];
  return [(sq(A) * (B[1] - C[1]) + sq(B) * (C[1] - A[1]) + sq(C) * (A[1] - B[1])) / d, (sq(A) * (C[0] - B[0]) + sq(B) * (A[0] - C[0]) + sq(C) * (B[0] - A[0])) / d];
}
/** 内心（各頂点の対辺の長さで重みをつけた平均） */
function incenter(A, B, C) {
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const s = a + b + c;
  return [(a * A[0] + b * B[0] + c * C[0]) / s, (a * A[1] + b * B[1] + c * C[1]) / s];
}
/** 2直線 P1P2 と P3P4 の交点 */
function intersect(P1, P2, P3, P4) {
  const d = (P1[0] - P2[0]) * (P3[1] - P4[1]) - (P1[1] - P2[1]) * (P3[0] - P4[0]);
  const a = P1[0] * P2[1] - P1[1] * P2[0];
  const b = P3[0] * P4[1] - P3[1] * P4[0];
  return [(a * (P3[0] - P4[0]) - (P1[0] - P2[0]) * b) / d, (a * (P3[1] - P4[1]) - (P1[1] - P2[1]) * b) / d];
}

/** 比 a:b を最も簡単な整数の比に（a, b は Q または数） */
function simpleRatio(a, b) {
  const qa = typeof a === "number" ? Q(a) : a;
  const qb = typeof b === "number" ? Q(b) : b;
  // a:b = (a.n b.d):(b.n a.d)
  let x = qa.n * qb.d;
  let y = qb.n * qa.d;
  const g = gcd(x, y);
  x /= g;
  y /= g;
  return [x, y];
}
const ratioFields = ([x, y], names = ["m", "n"]) => [
  { id: names[0], value: x },
  { id: names[1], value: y, pre: "$:$" },
];

export default {
  // ── 条件付き確率 ────────────────────────────────
  prob_cond: [
    t("num", (r, lv) => {
      if (lv === 1) {
        // クロス集計表から P_A(B)
        const ctx = r.pick([
          { who: "ある高校の1年生", unit: "人", A: ["女子", "男子"], B: ["自転車通学", "それ以外"], iA: 0, iB: 0, askA: "女子", askB: "自転車通学である" },
          { who: "ある部活動の部員", unit: "人", A: ["1年生", "2年生"], B: ["めがねあり", "めがねなし"], iA: 1, iB: 0, askA: "2年生", askB: "めがねをかけている" },
          { who: "ある図書館の利用者", unit: "人", A: ["大人", "子ども"], B: ["本を借りた", "借りなかった"], iA: 1, iB: 0, askA: "子ども", askB: "本を借りた人である" },
          { who: "ある工場の製品", unit: "個", A: ["機械P", "機械Q"], B: ["不良品", "良品"], iA: 1, iB: 0, askA: "機械Q で作ったもの", askB: "不良品である" },
          { who: "ある町の住民", unit: "人", A: ["20歳以上", "20歳未満"], B: ["朝食をとる", "とらない"], iA: 0, iB: 1, askA: "20歳以上の人", askB: "朝食をとらない人である" },
        ]);
        const n = until(() => [r.int(4, 30), r.int(4, 30), r.int(4, 30), r.int(4, 30)], ([a, b, c, d]) => a + b + c + d <= 90 && a * d !== b * c);
        const { iA, iB } = ctx;
        const cell = (i, j) => n[i * 2 + j];
        const rowT = (i) => cell(i, 0) + cell(i, 1);
        const colT = (j) => cell(0, j) + cell(1, j);
        const N = rowT(0) + rowT(1);
        // 独立な検算：1人ずつ並べた名簿から数える
        const people = [];
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < cell(i, j); k++) people.push([i, j]);
        const inA = people.filter((p) => p[0] === iA);
        const ans = Q(inA.filter((p) => p[1] === iB).length, inA.length);
        assert(eq(ans, Q(cell(iA, iB), rowT(iA))), "条件付き確率の検算");
        const table = texTable(
          ["", ...ctx.B.map(tx), tx("計")],
          [...[0, 1].map((i) => [tx(ctx.A[i]), cell(i, 0), cell(i, 1), rowT(i)]), [tx("計"), colT(0), colT(1), N]],
          { total: true },
        );
        return num({
          q: `${ctx.who} $${N}$ ${ctx.unit}について調べた結果が、次の表です。\n$${table}$\nこの中から1${ctx.unit === "人" ? "人" : "つ"}を選んだところ、${ctx.askA}でした。それが${ctx.askB}確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [
            [Q(cell(iA, iB), N), "MC-PCOND-JOINT"],
            [Q(cell(iA, iB), colT(iB)), "MC-PCOND-REVERSE"],
            [Q(colT(iB), N), "MC-PCOND-IGNORE"],
          ],
          explain: `「${ctx.askA}」という条件のもとでの確率なので、全体を「${ctx.A[iA]}」の $${rowT(iA)}$ にしぼって考えます。そのうち「${ctx.B[iB]}」は $${cell(iA, iB)}$ なので、$${fracEq(cell(iA, iB), rowT(iA))}$。（全体 $${N}$ でわると「両方にあてはまる確率」になってしまいます）`,
        });
      }
      // 全確率・原因の確率（％の文章題）
      const ctx = r.pick([
        { A: ["工場A", "工場B"], B: "不良品", intro: (a) => `ある製品は、全体の $${a}\\%$ を工場A、残りを工場Bでつくっています。`, one: "製品を1個", from: "工場Aの製品" },
        { A: ["路線A", "路線B"], B: "遅刻した人", intro: (a) => `ある会社の社員の $${a}\\%$ は路線A、残りは路線Bのバスで通勤しています。`, one: "社員を1人", from: "路線Aで通勤する人" },
        { A: ["箱A", "箱B"], B: "当たりくじ", intro: (a) => `たくさんのくじが2つの箱に分けて入っていて、全体の $${a}\\%$ は箱A、残りは箱Bに入っています。`, one: "くじを1本", from: "箱Aのくじ" },
      ]);
      const [pa, p1, p2] = until(() => [r.pick([20, 25, 30, 40, 50, 60, 70, 75, 80]), r.pick([1, 2, 3, 4, 5, 6, 8, 10]), r.pick([1, 2, 3, 4, 5, 6, 8, 10])], ([a, b, c]) => b !== c);
      const PA = Q(pa, 100);
      const PB_A = Q(p1, 100);
      const PB_notA = Q(p2, 100);
      const joint1 = mul(PA, PB_A);
      const joint2 = mul(sub(1, PA), PB_notA);
      const PB = add(joint1, joint2);
      // 独立な検算：10000 個（人）で数える
      const cnt1 = (10000 * pa) / 100;
      const bad1 = (cnt1 * p1) / 100;
      const bad2 = ((10000 - cnt1) * p2) / 100;
      assert(eq(PB, Q(bad1 + bad2, 10000)), "全確率の検算");
      const story = `${ctx.intro(pa)}${ctx.A[0]}のもののうち $${p1}\\%$、${ctx.A[1]}のもののうち $${p2}\\%$ が${ctx.B}です。`;
      if (lv === 2) {
        return num({
          q: `${story}\n全体から${ctx.one}選ぶとき、それが${ctx.B}である確率を求めなさい。（小数または分数で答えます）`,
          ans: PB,
          wrongs: [
            [joint1, "MC-PCOND-TOTAL-PART"],
            [Q(p1 + p2, 100), "MC-PCOND-TOTAL-ADD"],
            [Q(p1 + p2, 200), "MC-PCOND-TOTAL-ADD"],
          ],
          explain: `${ctx.A[0]}で${ctx.B}：$${tq(PA)}\\times${tq(PB_A)}=${tq(joint1)}$。${ctx.A[1]}で${ctx.B}：$${tq(sub(1, PA))}\\times${tq(PB_notA)}=${tq(joint2)}$。2つの場合をたして $${tq(PB)}$（$=${bad1 + bad2}\\div 10000$）。`,
        });
      }
      const ans = div(joint1, PB);
      assert(eq(ans, Q(bad1, bad1 + bad2)), "原因の確率の検算");
      return num({
        q: `${story}\n全体から${ctx.one}選んだところ、${ctx.B}でした。それが${ctx.from}である確率を求めなさい。（分数で答えます）`,
        ans,
        reduced: true,
        wrongs: [
          [joint1, "MC-PCOND-JOINT"],
          [PA, "MC-PCOND-BASE"],
          [PB_A, "MC-PCOND-REVERSE"],
          [Q(p1, p1 + p2), "MC-PCOND-BASE"],
        ],
        explain: `$A$：${ctx.A[0]}のもの、$E$：${ctx.B}とすると、求めるのは $P_E(A)=\\dfrac{P(A\\cap E)}{P(E)}$。$P(A\\cap E)=${tq(PA)}\\times${tq(PB_A)}=${tq(joint1)}$、$P(E)=${tq(joint1)}+${tq(joint2)}=${tq(PB)}$。よって $${tq(joint1)}\\div ${tq(PB)}=${tq(ans)}$。（10000 個で考えると、${ctx.B} $${bad1 + bad2}$ 個のうち${ctx.A[0]}のものは $${bad1}$ 個）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // さいころ・コイン：すべての出方を数え上げて P_A(B)
        let space;
        let evA;
        let evB;
        let setup;
        if (lv === 1) {
          space = [1, 2, 3, 4, 5, 6].map((v) => [v]);
          const conds = [
            ["偶数の目が出た", (x) => x[0] % 2 === 0],
            ["奇数の目が出た", (x) => x[0] % 2 === 1],
            ["3以上の目が出た", (x) => x[0] >= 3],
            ["4以下の目が出た", (x) => x[0] <= 4],
            ["2以上の目が出た", (x) => x[0] >= 2],
          ];
          const targets = [
            ["その目が6の約数である", (x) => 6 % x[0] === 0],
            ["その目が素数である", (x) => [2, 3, 5].includes(x[0])],
            ["その目が3の倍数である", (x) => x[0] % 3 === 0],
            ["その目が5以上である", (x) => x[0] >= 5],
            ["その目が4の約数である", (x) => 4 % x[0] === 0],
          ];
          [evA, evB] = until(
            () => [r.pick(conds), r.pick(targets)],
            ([a, b]) => {
              const nA = space.filter(a[1]).length;
              const nAB = space.filter((x) => a[1](x) && b[1](x)).length;
              return nAB > 0 && nAB < nA;
            },
          );
          setup = "1個のさいころを投げます。";
        } else if (lv === 2) {
          space = [];
          for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) space.push([a, b]);
          const k = r.int(5, 9);
          const m = r.int(1, 6);
          const conds = [
            [`出た目の和が $${k}$ である`, (x) => x[0] + x[1] === k],
            [`少なくとも一方の目が $${m}$ である`, (x) => x[0] === m || x[1] === m],
            ["出た目の和が偶数である", (x) => (x[0] + x[1]) % 2 === 0],
            [`出た目の和が $${k}$ 以上である`, (x) => x[0] + x[1] >= k],
          ];
          const targets = [
            ["2つの目が同じである", (x) => x[0] === x[1]],
            [`少なくとも一方の目が $${m}$ である`, (x) => x[0] === m || x[1] === m],
            ["大きいさいころの目のほうが大きい", (x) => x[0] > x[1]],
            ["2つの目の積が偶数である", (x) => (x[0] * x[1]) % 2 === 0],
          ];
          [evA, evB] = until(
            () => [r.pick(conds), r.pick(targets)],
            ([a, b]) => {
              const nA = space.filter(a[1]).length;
              const nAB = space.filter((x) => a[1](x) && b[1](x)).length;
              return a[0] !== b[0] && nAB > 0 && nAB < nA;
            },
          );
          setup = "大小2個のさいころを同時に投げます。";
        } else {
          const n = r.pick([3, 4]);
          space = [];
          for (let m = 0; m < 1 << n; m++) space.push(Array.from({ length: n }, (_, i) => (m >> i) & 1));
          const heads = (x) => x.reduce((s, v) => s + v, 0);
          const k = r.int(1, n - 1);
          const j = r.int(1, n);
          const conds = [
            [`少なくとも $${k}$ 枚が表である`, (x) => heads(x) >= k],
            ["1枚目が表である", (x) => x[0] === 1],
            [`表がちょうど $${k}$ 枚である`, (x) => heads(x) === k],
          ];
          const targets = [
            [`表がちょうど $${j}$ 枚である`, (x) => heads(x) === j],
            ["1枚目が表である", (x) => x[0] === 1],
            ["すべて表である", (x) => heads(x) === n],
          ];
          [evA, evB] = until(
            () => [r.pick(conds), r.pick(targets)],
            ([a, b]) => {
              const nA = space.filter(a[1]).length;
              const nAB = space.filter((x) => a[1](x) && b[1](x)).length;
              return a[0] !== b[0] && nAB > 0 && nAB < nA;
            },
          );
          setup = `$${n}$ 枚のコインを同時に投げます（どのコインも表と裏が同じ確からしさで出ます）。`;
        }
        const nA = space.filter(evA[1]).length;
        const nB = space.filter(evB[1]).length;
        const nAB = space.filter((x) => evA[1](x) && evB[1](x)).length;
        const ans = Q(nAB, nA);
        // 独立な検算：P(A∩B) ÷ P(A)
        assert(eq(ans, div(Q(nAB, space.length), Q(nA, space.length))), "P(A∩B)/P(A) の検算");
        return num({
          q: `${setup}${evA[0]}ことがわかったとき、${evB[0]}確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [
            [Q(nAB, space.length), "MC-PCOND-JOINT"],
            [Q(nB, space.length), "MC-PCOND-IGNORE"],
            [Q(nAB, nB), "MC-PCOND-REVERSE"],
          ],
          explain: `起こりうる場合は全部で $${space.length}$ 通り。そのうち「${evA[0].replace(/\$/g, "")}」は $${nA}$ 通りで、この中で「${evB[0].replace(/\$/g, "")}」にもあてはまるのは $${nAB}$ 通り。条件付き確率は $${fracEq(nAB, nA)}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        // くじ引き（引いたくじは戻さない）
        const nn = r.int(6, 12);
        const k = r.int(2, Math.min(5, nn - 2));
        // 全員の引き方（A, B の順番つき）を数え上げる
        let both = 0;
        let bWin = 0;
        let total = 0;
        for (let a = 0; a < nn; a++) {
          for (let b = 0; b < nn; b++) {
            if (a === b) continue;
            total++;
            const aw = a < k;
            const bw = b < k;
            if (aw && bw) both++;
            if (bw) bWin++;
          }
        }
        const head = `当たりくじ $${k}$ 本をふくむ $${nn}$ 本のくじがあります。A、B の2人がこの順に1本ずつ引きます（引いたくじはもとにもどしません）。`;
        if (lv === 1) {
          const ans = Q(both, total);
          assert(eq(ans, mul(Q(k, nn), Q(k - 1, nn - 1))), "乗法定理の検算");
          return num({
            q: `${head}A、B がどちらも当たる確率を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs: [
              [mul(Q(k, nn), Q(k, nn)), "MC-PCOND-INDEP"],
              [mul(Q(k, nn), Q(k - 1, nn)), "MC-PCOND-DENOM"],
              [Q(k - 1, nn - 1), "MC-PCOND-IGNORE"],
            ],
            explain: `A が当たる確率は $\\dfrac{${k}}{${nn}}$。A が当たったあとは、当たり $${k - 1}$ 本・全部で $${nn - 1}$ 本なので、B が当たる確率は $\\dfrac{${k - 1}}{${nn - 1}}$。乗法定理より $\\dfrac{${k}}{${nn}}\\times\\dfrac{${k - 1}}{${nn - 1}}=${tq(ans)}$。`,
          });
        }
        if (lv === 2) {
          const ans = Q(bWin, total);
          assert(eq(ans, Q(k, nn)), "くじの公平性の検算");
          const aw = mul(Q(k, nn), Q(k - 1, nn - 1));
          const al = mul(Q(nn - k, nn), Q(k, nn - 1));
          assert(eq(add(aw, al), ans), "場合分けの検算");
          return num({
            q: `${head}B が当たる確率を求めなさい。（分数で答えます）`,
            ans,
            reduced: true,
            wrongs: [
              [Q(k - 1, nn - 1), "MC-PCOND-ORDER"],
              [aw, "MC-PCOND-TOTAL-PART"],
              [Q(k, nn - 1), "MC-PCOND-ORDER"],
            ],
            explain: `A が当たる場合と外れる場合に分けます。A 当たり→B 当たり：$\\dfrac{${k}}{${nn}}\\times\\dfrac{${k - 1}}{${nn - 1}}=${tq(aw)}$。A 外れ→B 当たり：$\\dfrac{${nn - k}}{${nn}}\\times\\dfrac{${k}}{${nn - 1}}=${tq(al)}$。合わせて $${tq(ans)}$。（先に引いても後に引いても、当たる確率は同じです）`,
          });
        }
        const ans = Q(both, bWin);
        assert(eq(ans, Q(k - 1, nn - 1)), "B が当たったときの条件付き確率の検算");
        return num({
          q: `${head}B が当たったことがわかったとき、A も当たっていた確率を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [
            [Q(k, nn), "MC-PCOND-IGNORE"],
            [Q(both, total), "MC-PCOND-JOINT"],
            [Q(k, nn - 1), "MC-PCOND-DENOM"],
          ],
          explain: `求めるのは $P_{B}(A)=\\dfrac{P(A\\cap B)}{P(B)}$。$P(A\\cap B)=\\dfrac{${k}}{${nn}}\\times\\dfrac{${k - 1}}{${nn - 1}}=${tq(Q(both, total))}$、$P(B)=\\dfrac{${k}}{${nn}}$（くじは引く順番によらない）。よって $${tq(ans)}$。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 約数・倍数と余り（ユークリッドの互除法） ───────────
  int_divisor: [
    t("num", (r, lv) => {
      const primes = [2, 3, 5, 7];
      const divisors = (n) => {
        const out = [];
        for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
        return out;
      };
      if (lv <= 2) {
        const k = lv === 1 ? 2 : 3;
        const [ps, es, N] = until(
          () => {
            const ps2 = r.sample(primes, k).sort((a, b) => a - b);
            const es2 = ps2.map(() => r.int(1, lv === 1 ? 4 : 3));
            return [ps2, es2, ps2.reduce((acc, p, i) => acc * p ** es2[i], 1)];
          },
          ([, es2, n]) => n >= 30 && n <= (lv === 1 ? 1000 : 6000) && es2.some((e) => e >= 2),
        );
        const ans = es.reduce((acc, e) => acc * (e + 1), 1);
        assert(ans === divisors(N).length, "約数の個数の検算");
        const fac = ps.map((p, i) => (es[i] === 1 ? `${p}` : `${p}^{${es[i]}}`)).join("\\cdot ");
        return num({
          q: `$${N}$ の正の約数は全部で何個ありますか。`,
          ans,
          wrongs: [
            [es.reduce((acc, e) => acc * e, 1), "MC-DIVISOR-COUNT-NO-PLUS1"],
            [es.reduce((acc, e) => acc + e + 1, 0), "MC-DIVISOR-COUNT-ADD"],
            [ans - 2, "MC-DIVISOR-COUNT-ADD"],
          ],
          explain: `素因数分解すると $${N}=${fac}$。約数は ${ps.map((p, i) => `$${p}^0$〜$${p}^{${es[i]}}$ の $${es[i] + 1}$ 通り`).join("、")} を1つずつ選んでかけたものなので、$${es.map((e) => e + 1).join("\\times ")}=${ans}$ 個。`,
        });
      }
      // 約数の総和、または偶数の約数の個数
      const [p1, e1, p2, e2, N] = until(
        () => {
          const [a, b] = r.sample(primes, 2).sort((x, y) => x - y);
          const ea = r.int(1, 4);
          const eb = r.int(1, 3);
          return [a, ea, b, eb, a ** ea * b ** eb];
        },
        ([a, , , , n]) => n >= 40 && n <= 1500 && a === 2,
      );
      const ds = divisors(N);
      if (r.chance(0.5)) {
        const ans = ds.reduce((s, d) => s + d, 0);
        const g1 = (p1 ** (e1 + 1) - 1) / (p1 - 1);
        const g2 = (p2 ** (e2 + 1) - 1) / (p2 - 1);
        assert(ans === g1 * g2, "約数の総和の検算");
        return num({
          q: `$${N}$ の正の約数の総和を求めなさい。`,
          ans,
          wrongs: [
            [ans - N, "MC-DIVISOR-SUM-FORMULA"],
            [g1 + g2, "MC-DIVISOR-SUM-FORMULA"],
            [(e1 + 1) * (e2 + 1), "MC-DIVISOR-SUM-FORMULA"],
          ],
          explain: `$${N}=${p1}^{${e1}}\\cdot ${p2}^{${e2}}$ なので、約数の総和は $(1+${Array.from({ length: e1 }, (_, i) => `${p1}^{${i + 1}}`).join("+")})(1+${Array.from({ length: e2 }, (_, i) => `${p2}^{${i + 1}}`).join("+")})=${g1}\\times${g2}=${ans}$。（展開すると、約数がちょうど1回ずつ出てくる）`,
        });
      }
      const ans = ds.filter((d) => d % 2 === 0).length;
      assert(ans === e1 * (e2 + 1), "偶数の約数の個数の検算");
      return num({
        q: `$${N}$ の正の約数のうち、偶数であるものは何個ありますか。`,
        ans,
        wrongs: [
          [(e1 + 1) * (e2 + 1), "MC-DIVISOR-COUNT-ADD"],
          [e2 + 1, "MC-DIVISOR-COUNT-NO-PLUS1"],
          [(e1 + 1) * (e2 + 1) - 1, "MC-DIVISOR-COUNT-ADD"],
        ],
        explain: `$${N}=2^{${e1}}\\cdot ${p2}^{${e2}}$。偶数の約数は $2$ を少なくとも1つふくむので、$2$ の指数は $1$〜$${e1}$ の $${e1}$ 通り、$${p2}$ の指数は $0$〜$${e2}$ の $${e2 + 1}$ 通り。$${e1}\\times${e2 + 1}=${ans}$ 個。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // ユークリッドの互除法
        const euclid = (a, b) => {
          const steps = [];
          while (b) {
            steps.push([a, b, Math.floor(a / b), a % b]);
            [a, b] = [b, a % b];
          }
          return { g: a, steps };
        };
        if (lv <= 2) {
          const [a, b] = until(
            () => {
              const g = r.pick(lv === 1 ? [7, 11, 13, 17, 19, 23] : [13, 17, 19, 23, 29, 31, 37]);
              const m = r.int(5, lv === 1 ? 30 : 60);
              const n = r.int(3, m - 1);
              return [g * m, g * n];
            },
            ([x, y]) => x < (lv === 1 ? 800 : 3000) && euclid(x, y).steps.length >= 3,
          );
          const { g, steps } = euclid(a, b);
          assert(g === gcd(a, b), "互除法の検算");
          const lastRem = steps.length >= 2 ? steps[steps.length - 2][3] : a % b;
          const show = steps.map(([x, y, q, rr]) => `${x}=${y}\\times ${q}+${rr}`).join(",\\ ");
          if (lv === 1) {
            return num({
              q: `ユークリッドの互除法を使って、$${a}$ と $${b}$ の最大公約数を求めなさい。`,
              ans: g,
              wrongs: [
                [lastRem === g ? steps[0][3] : lastRem, "MC-EUCLID-STOP"],
                [steps[0][3], "MC-EUCLID-STOP"],
                [(a * b) / g, "MC-GCD-LCM-SWAP"],
              ],
              explain: `大きい方を小さい方でわり、「わる数」と「余り」で同じことをくり返します。$${show}$。余りが $0$ になったときの「わる数」$${g}$ が最大公約数です。`,
            });
          }
          const L = (a * b) / g;
          assert(L % a === 0 && L % b === 0 && gcd(L / a, L / b) === 1, "最小公倍数の検算");
          return num({
            q: `$${a}$ と $${b}$ の最小公倍数を求めなさい。`,
            ans: L,
            wrongs: [
              [a * b, "MC-LCM-PRODUCT"],
              [g, "MC-GCD-LCM-SWAP"],
              [L / g === Math.round(L / g) ? L * g : L + g, "MC-LCM-PRODUCT"],
            ],
            explain: `まず互除法で最大公約数を求めます：$${show}$ より、最大公約数は $${g}$。最小公倍数は $\\dfrac{${a}\\times ${b}}{${g}}=${L}$。`,
          });
        }
        // 最大公約数・最小公倍数・和から2数を決める
        const [g, m, n] = until(
          () => [r.int(3, 15), r.int(1, 9), r.int(2, 11)],
          ([gg, mm, nn]) => mm < nn && gcd(mm, nn) === 1,
        );
        const a = g * m;
        const b = g * n;
        const L = g * m * n;
        const S = a + b;
        // 独立な検算：条件を満たす組 (a, b)（a<b）をすべて探し、ただ1つであること
        const sols = [];
        for (let x = 1; x < S - x; x++) {
          const y = S - x;
          if (gcd(x, y) === g && (x * y) / g === L) sols.push([x, y]);
        }
        assert(sols.length === 1 && sols[0][0] === a, "2数の決定の検算");
        return num({
          q: `2つの自然数 $a$、$b$（$a<b$）の最大公約数が $${g}$、最小公倍数が $${L}$、和が $${S}$ です。$a$ を求めなさい。`,
          ans: a,
          wrongs: [
            [b, "MC-GCD-LCM-SWAP"],
            [m, "MC-GCD-LCM-SWAP"],
            [g, "MC-GCD-LCM-SWAP"],
          ],
          explain: `$a=${g}a'$、$b=${g}b'$（$a'$ と $b'$ は互いに素、$a'<b'$）とおくと、最小公倍数は $${g}a'b'=${L}$ より $a'b'=${m * n}$、和は $${g}(a'+b')=${S}$ より $a'+b'=${m + n}$。これを満たすのは $a'=${m}$、$b'=${n}$ なので、$a=${a}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        // 余り
        const m = r.pick([5, 6, 7, 8, 9, 11]);
        if (lv === 1) {
          const rr = r.int(1, m - 1);
          const [k, c] = until(() => [r.int(2, 5), r.int(1, 9)], ([kk, cc]) => (kk * rr + cc) >= m);
          const ans = (k * rr + c) % m;
          // 独立な検算：条件を満たす数をいくつか作って確かめる
          for (const q of [3, 10, 25]) assert((k * (m * q + rr) + c) % m === ans, "余りの検算");
          return num({
            q: `整数 $n$ を $${m}$ でわると $${rr}$ 余ります。$${k}n+${c}$ を $${m}$ でわった余りを求めなさい。`,
            ans,
            wrongs: [[k * rr + c, "MC-MOD-NOT-REDUCED"], [(rr + c) % m, "MC-SLIP"], [(k * rr) % m, "MC-SLIP"]],
            explain: `$n=${m}q+${rr}$（$q$ は整数）とおくと、$${k}n+${c}=${m}\\cdot ${k}q+${k * rr + c}$。$${k * rr + c}$ を $${m}$ でわった余りは $${ans}$ なので、答えは $${ans}$。（余りは $0$ 以上 $${m - 1}$ 以下にする）`,
          });
        }
        if (lv === 2) {
          const rr = r.int(2, m - 1);
          const e = r.pick([2, 3]);
          const ans = rr ** e % m;
          for (const q of [2, 7, 13]) assert((m * q + rr) ** e % m === ans, "累乗の余りの検算");
          return num({
            q: `整数 $n$ を $${m}$ でわると $${rr}$ 余ります。$n^{${e}}$ を $${m}$ でわった余りを求めなさい。`,
            ans,
            wrongs: [[rr ** e, "MC-MOD-NOT-REDUCED"], [(rr * e) % m, "MC-SLIP"], [rr, "MC-SLIP"]],
            explain: `$n=${m}q+${rr}$ とおいて展開すると、$${m}$ の倍数の項をのぞいて $${rr}^{${e}}=${rr ** e}$ が残ります。$${rr ** e}$ を $${m}$ でわった余りは $${ans}$。`,
          });
        }
        // 大きな累乗の余り（周期）
        const [base, mod] = until(() => [r.int(2, 9), r.pick([5, 7, 9, 11, 13])], ([b, md]) => b % md !== 0 && b % md !== 1);
        const N = r.int(20, 99);
        // 周期を求める
        const seq = [];
        let v = 1;
        for (let i = 1; i <= 20; i++) {
          v = (v * base) % mod;
          seq.push(v);
          if (v === 1) break;
        }
        const period = seq.length;
        let ans = 1;
        for (let i = 0; i < N; i++) ans = (ans * base) % mod; // 独立な検算（直接かけ算）
        assert(ans === seq[(N - 1) % period], "周期による余りの検算");
        return num({
          q: `$${base}^{${N}}$ を $${mod}$ でわった余りを求めなさい。`,
          ans,
          wrongs: [
            [seq[N % period], "MC-MOD-CYCLE"],
            [seq[(N - 2 + period) % period], "MC-MOD-CYCLE"],
            [(base * N) % mod, "MC-MOD-CYCLE"],
          ],
          explain: `$${base}^1, ${base}^2, \\ldots$ を $${mod}$ でわった余りを順に調べると $${seq.join(",\\ ")}$ となり、$${base}^{${period}}$ の余りが $1$ なので、余りは $${period}$ 個ごとにくり返します。$${N}=${period}\\times ${Math.floor(N / period)}+${N % period}$ なので、${N % period === 0 ? `$${base}^{${period}}$ と同じ余り $1$` : `$${base}^{${N % period}}$ と同じ余り $${seq[(N % period) - 1]}$`}。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 1次不定方程式 ──────────────────────────────
  int_eq: [
    t("fields", (r, lv) => {
      const [a, b] = until(() => [r.int(2, 13), r.int(2, 13)], ([x, y]) => x !== y && gcd(x, y) === 1 && x * y > 10);
      if (lv <= 2) {
        const sub_ = lv === 2; // ax − by = c
        const c = lv === 1 ? until(() => r.int(a * b + 1, 3 * a * b), (cc) => {
          let cnt = 0;
          for (let x = 1; a * x < cc; x++) if ((cc - a * x) % b === 0) cnt++;
          return cnt >= 1;
        }) : r.int(1, 9);
        // 全数で探す
        let sol = null;
        for (let x = 1; x <= 200 && !sol; x++) {
          const rest = sub_ ? a * x - c : c - a * x;
          if (rest % b === 0 && (sub_ ? rest / b >= 0 && rest / b >= (sub_ ? 0 : 1) : rest / b >= 1)) sol = [x, rest / b];
        }
        assert(sol && (sub_ ? a * sol[0] - b * sol[1] === c : a * sol[0] + b * sol[1] === c), "不定方程式の解の検算");
        const [x0, y0] = sol;
        const eqTex = sub_ ? `${a}x-${b}y=${c}` : `${a}x+${b}y=${c}`;
        return fields({
          q: sub_
            ? `方程式 $${eqTex}$ を満たす整数 $x$、$y$ の組のうち、$x$ が最小の正の整数で、$y$ が $0$ 以上であるものを求めなさい。`
            : `方程式 $${eqTex}$ を満たす正の整数 $x$、$y$ の組のうち、$x$ が最小のものを求めなさい。`,
          fields: [
            { id: "x", value: x0, pre: "$x=$" },
            { id: "y", value: y0, pre: "$y=$" },
          ],
          layout: "lines",
          wrongs: [
            { values: { x: y0, y: x0 }, mc: "MC-COORD-XY-SWAP" },
            { values: { x: x0 + b, y: sub_ ? y0 + a : y0 - a }, mc: "MC-DIOPH-SIGN" },
          ],
          explain: `$x=1,\\ 2,\\ 3,\\ \\ldots$ と順に入れて、${sub_ ? `$${a}x-${c}$` : `$${c}-${a}x$`} が $${b}$ でわり切れるものを探します。$x=${x0}$ のとき ${sub_ ? `$${a}\\times ${x0}-${c}=${a * x0 - c}$` : `$${c}-${a}\\times ${x0}=${c - a * x0}$`} で、$y=${y0}$。`,
        });
      }
      // 一般解：x = b k + p（0 ≤ p < b）、y = … − a k（ax + by = 1 型）
      const c = r.pick([1, 1, 2, 3]);
      let x0 = null;
      for (let x = 0; x < b; x++) if (((c - a * x) % b + b) % b === 0) x0 = x;
      const y0 = (c - a * x0) / b;
      assert(Number.isInteger(y0) && a * x0 + b * y0 === c, "特殊解の検算");
      // 独立な検算：k を変えても成り立つ
      for (const k of [-3, 1, 5]) assert(a * (b * k + x0) + b * (y0 - a * k) === c, "一般解の検算");
      return fields({
        q: `方程式 $${a}x+${b}y=${c}$ のすべての整数解は、整数 $k$ を使って\n$x=${b}k+p$、$y=q-${a}k$（ただし $0\\le p<${b}$）\nと表せます。$p$、$q$ の値を求めなさい。`,
        fields: [
          { id: "p", value: x0, pre: "$p=$" },
          { id: "q", value: y0, pre: "$q=$" },
        ],
        layout: "lines",
        wrongs: [
          { values: { p: x0, q: -y0 }, mc: "MC-DIOPH-SIGN" },
          { values: { p: y0, q: x0 }, mc: "MC-COORD-XY-SWAP" },
        ],
        explain: `まず1組の解を見つけます。$x=0,1,2,\\ldots$ と調べると、$x=${x0}$ のとき $${a}\\times ${x0}+${b}y=${c}$ より $y=${y0}$。もとの式から $${a}\\times ${x0}+${b}\\times (${y0})=${c}$ を引くと $${a}(x-${x0})=-${b}(y-(${y0}))$。$${a}$ と $${b}$ は互いに素なので $x-${x0}=${b}k$、$y-(${y0})=-${a}k$。よって $p=${x0}$、$q=${y0}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv <= 2) {
          // 解が2つ以上あるように、先に1つの解 (x0, y0) を決めてから c を作る
          const countSols = (a, b, c, minX) => {
            let cnt = 0;
            for (let x = minX; a * x <= c; x++) if ((c - a * x) % b === 0 && (c - a * x) / b >= minX) cnt++;
            return cnt;
          };
          const [a, b, c] = until(
            () => {
              const [p, q] = lv === 1 ? [r.int(2, 9), r.int(2, 9)] : [r.pick([6, 7, 8, 9, 11, 12, 13, 15]), r.pick([6, 7, 8, 9, 11, 12, 13, 15])];
              const unit = lv === 1 ? 1 : 10;
              const x0 = r.int(1, 6);
              const y0 = r.int(1, 12);
              return [p * unit, q * unit, (p * x0 + q * y0 + (lv === 1 ? 0 : p * q * r.int(0, 2))) * unit];
            },
            ([p, q, cc]) => p !== q && gcd(p, q) === (lv === 1 ? 1 : 10) && countSols(p, q, cc, lv === 1 ? 0 : 1) >= 2 && countSols(p, q, cc, lv === 1 ? 0 : 1) <= 12 && (lv === 1 ? cc >= 15 && cc <= 80 : cc >= 600 && cc <= 4000),
          );
          let cnt = 0;
          let cntLoose = 0; // 0 を含めてしまった数え方
          for (let x = 0; a * x <= c; x++) {
            if ((c - a * x) % b !== 0) continue;
            const y = (c - a * x) / b;
            cntLoose++;
            if (lv === 1 || (x >= 1 && y >= 1)) cnt++;
          }
          if (lv === 1) {
            return num({
              q: `$x$、$y$ が $0$ 以上の整数のとき、$${a}x+${b}y=${c}$ を満たす組 $(x,\\ y)$ は何組ありますか。`,
              ans: cnt,
              wrongs: [[cnt - 1, "MC-DIOPH-COUNT"], [cnt + 1, "MC-DIOPH-COUNT"]],
              explain: `$x=0,1,2,\\ldots$ と順に調べて、$${c}-${a}x$ が $${b}$ の倍数（$0$ 以上）になるものを数えます。見つけた解は $x$ が $${b}$ ずつ、$y$ が $${a}$ ずつ変わっていきます。全部で $${cnt}$ 組。`,
            });
          }
          return num({
            q: `1個 $${a}$ 円のノートと1本 $${b}$ 円のペンを、合わせてちょうど $${c}$ 円分買います。どちらも1つ以上買うとき、買い方は何通りありますか。`,
            ans: cnt,
            wrongs: [[cntLoose, "MC-DIOPH-COUNT"], [cnt - 1, "MC-DIOPH-COUNT"], [cnt + 1, "MC-DIOPH-COUNT"]],
            explain: `ノートを $x$ 冊、ペンを $y$ 本とすると $${a}x+${b}y=${c}$、つまり $${a / 10}x+${b / 10}y=${c / 10}$（$x\\ge1$、$y\\ge1$）。$x$ を $1$ から順に調べると、条件を満たすのは $${cnt}$ 通り。（$x=0$ や $y=0$ の組は「どちらも1つ以上」に合わないので数えません）`,
          });
        }
        // 2つの余りの条件を満たす最小の3けたの数
        const [m1, m2] = until(() => [r.pick([4, 5, 6, 7, 8, 9]), r.pick([5, 7, 9, 11, 13])], ([x, y]) => x !== y && gcd(x, y) === 1);
        const r1 = r.int(1, m1 - 1);
        const r2 = r.int(1, m2 - 1);
        let ans = null;
        for (let n = 100; n < 1000 && ans == null; n++) if (n % m1 === r1 && n % m2 === r2) ans = n;
        const period = m1 * m2;
        let small = null;
        for (let n = 1; n <= period && small == null; n++) if (n % m1 === r1 && n % m2 === r2) small = n;
        assert(ans != null && (ans - small) % period === 0, "2つの余りの条件の検算");
        return num({
          q: `$${m1}$ でわると $${r1}$ 余り、$${m2}$ でわると $${r2}$ 余る自然数のうち、最も小さい3けたの数を求めなさい。`,
          ans,
          wrongs: [[small, "MC-DIOPH-COUNT"], [ans + period, "MC-DIOPH-COUNT"], [ans - 1, "MC-SLIP"]],
          explain: `条件を満たす最小の自然数を探すと $${small}$（$${m1}$ でわると $${r1}$ 余り、$${m2}$ でわると $${r2}$ 余る）。条件を満たす数は $${m1}\\times ${m2}=${period}$ ごとに現れるので、$${small}+${period}k$ の形。3けたで最小のものは $${ans}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── n 進法 ────────────────────────────────────
  int_base: [
    t("num", (r, lv) => {
      const base = r.pick(lv === 1 ? [2, 3, 5] : [2, 3, 4, 5, 6, 7, 8]);
      const sub = (b) => `_{(${b})}`;
      if (lv === 1) {
        const len = base === 2 ? r.int(4, 6) : r.int(3, 4);
        const digits = until(() => Array.from({ length: len }, (_, i) => r.int(i === 0 ? 1 : 0, base - 1)), (ds) => ds.some((d, i) => i > 0 && d > 0));
        const str = digits.join("");
        const ans = parseInt(str, base);
        const byHand = digits.reduce((s, d) => s * base + d, 0);
        assert(ans === byHand, "n進法→10進法の検算");
        const rev = parseInt([...digits].reverse().join(""), base);
        const shifted = digits.reduce((s, d, i) => s + d * base ** (len - i), 0);
        return num({
          q: `$${str}${sub(base)}$ を10進法で表しなさい。`,
          ans,
          wrongs: [
            [rev, "MC-BASE-REVERSE"],
            [shifted, "MC-BASE-PLACE"],
            [Number(str), "MC-BASE-AS-DECIMAL"],
          ],
          explain: `右の位から $1$、$${base}$、$${base}^2$、… の位です。$${digits.map((d, i) => `${d}\\times ${base}^{${len - 1 - i}}`).join("+")}=${ans}$。`,
        });
      }
      if (lv === 2) {
        const N = r.int(base === 2 ? 20 : 30, base === 2 ? 120 : 400);
        const rep = N.toString(base);
        const ans = Number(rep);
        // 独立な検算：わり算をくり返して余りを集める
        const rems = [];
        let v = N;
        while (v > 0) {
          rems.push(v % base);
          v = Math.floor(v / base);
        }
        assert(rems.slice().reverse().join("") === rep, "10進法→n進法の検算");
        const wrongRev = Number(rems.join(""));
        return num({
          q: `10進法の $${N}$ を ${base}進法で表しなさい。（例えば $${(base + 1).toString(base) === "11" ? "11" : (base + 1).toString(base)}${sub(base)}$ なら「$${(base + 1).toString(base)}$」と、数字を並べて答えます）`,
          ans,
          wrongs: [
            [wrongRev, "MC-BASE-REVERSE"],
            [N, "MC-BASE-AS-DECIMAL"],
          ],
          explain: `$${base}$ でわって、余りを下から順に並べます。${(() => {
            const lines = [];
            let x = N;
            while (x > 0) {
              lines.push(`${x}\\div ${base}=${Math.floor(x / base)}\\ \\text{余り}\\ ${x % base}`);
              x = Math.floor(x / base);
            }
            return `$${lines.join(",\\ ")}$`;
          })()}。余りを最後から並べて $${rep}${sub(base)}$。`,
        });
      }
      // 2進法の小数 → 10進法（分数）
      if (r.chance(0.5)) {
        const len = r.int(2, 4);
        const digits = until(() => Array.from({ length: len }, () => r.int(0, 1)), (ds) => ds[ds.length - 1] === 1 && ds.some((d, i) => d === 1 && i < ds.length - 1));
        const ip = r.int(0, 3);
        const ipStr = ip.toString(2);
        let ans = Q(ip);
        digits.forEach((d, i) => {
          if (d) ans = add(ans, Q(1, 2 ** (i + 1)));
        });
        nearly(qnum(ans), ip + digits.reduce((s, d, i) => s + d / 2 ** (i + 1), 0), "2進法の小数の検算");
        const wrong = add(Q(ip), Q(parseInt(digits.join(""), 2), 10 ** len));
        return num({
          q: `$${ipStr}.${digits.join("")}${sub(2)}$ を10進法の分数（または小数）で表しなさい。`,
          ans,
          wrongs: [[wrong, "MC-BASE-AS-DECIMAL"], [add(Q(ip), Q(parseInt(digits.join(""), 2), 2 ** (len + 1))), "MC-BASE-PLACE"]],
          explain: `小数点の右は $\\frac12$、$\\frac14$、$\\frac18$、… の位です。${ipStr}.${digits.join("")} は $${ip}+${digits.map((d, i) => `${d}\\times\\frac{1}{${2 ** (i + 1)}}`).join("+")}=${tq(ans)}$。`,
        });
      }
      // n 進法どうしの足し算（答えも n 進法で）
      const b2 = r.pick([2, 3, 5]);
      const [x, y] = until(() => [r.int(b2 ** 2, b2 ** 3 * 2), r.int(b2 ** 2, b2 ** 3 * 2)], ([p, q]) => p !== q);
      const sum = x + y;
      const ans = Number(sum.toString(b2));
      return num({
        q: `次の計算をして、答えを ${b2}進法で表しなさい。（数字を並べて答えます）\n$${x.toString(b2)}${sub(b2)}+${y.toString(b2)}${sub(b2)}$`,
        ans,
        wrongs: [
          [Number(x.toString(b2)) + Number(y.toString(b2)), "MC-BASE-AS-DECIMAL"],
          [sum, "MC-BASE-AS-DECIMAL"],
        ],
        explain: `10進法になおすと $${x}+${y}=${sum}$。これを ${b2}進法にもどすと $${sum.toString(b2)}${sub(b2)}$。（${b2}進法のまま、各位で $${b2}$ になったら上の位にくり上げて計算しても同じ）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 桁数と個数
        if (lv === 1) {
          const base = r.pick([2, 3, 5]);
          const N = r.int(20, 500);
          const ans = N.toString(base).length;
          let k = 0;
          while (base ** k <= N) k++;
          assert(k === ans, "桁数の検算");
          return num({
            q: `10進法の $${N}$ を ${base}進法で表すと、何けたの数になりますか。`,
            ans,
            wrongs: [[ans - 1, "MC-BASE-PLACE"], [ans + 1, "MC-BASE-PLACE"], [String(N).length, "MC-BASE-AS-DECIMAL"]],
            explain: `$${base}^{${ans - 1}}=${base ** (ans - 1)}\\le ${N}<${base ** ans}=${base}^{${ans}}$ なので、${base}進法で $${ans}$ けたです。`,
          });
        }
        if (lv === 2) {
          const base = r.pick([2, 3, 4, 5, 6, 7]);
          const k = r.int(2, 4);
          const ans = base ** k - base ** (k - 1);
          let cnt = 0;
          for (let n = 1; n < base ** k; n++) if (n.toString(base).length === k) cnt++;
          assert(cnt === ans, "k けたの数の個数の検算");
          return num({
            q: `${base}進法で表すと、ちょうど $${k}$ けたになる自然数は何個ありますか。`,
            ans,
            wrongs: [[base ** k, "MC-BASE-PLACE"], [base ** (k - 1), "MC-BASE-PLACE"], [(base - 1) ** k, "MC-SLIP"]],
            explain: `${base}進法で $${k}$ けたの数は、$${base}^{${k - 1}}=${base ** (k - 1)}$ 以上 $${base}^{${k}}=${base ** k}$ 未満。個数は $${base ** k}-${base ** (k - 1)}=${ans}$。（最高位は $0$ 以外、他の位は $0$〜$${base - 1}$ なので $${base - 1}\\times ${base}^{${k - 1}}$ と数えても同じ）`,
          });
        }
        const [b1, b2, k1, k2] = until(
          () => [r.pick([2, 3, 4]), r.pick([3, 5, 6, 7]), r.int(3, 6), r.int(2, 4)],
          ([x, y, j1, j2]) => x < y && Math.min(x ** j1, y ** j2) - Math.max(x ** (j1 - 1), y ** (j2 - 1)) > 0 && Math.min(x ** j1, y ** j2) - Math.max(x ** (j1 - 1), y ** (j2 - 1)) < 500,
        );
        let cnt = 0;
        const lo = Math.max(b1 ** (k1 - 1), b2 ** (k2 - 1));
        const hi = Math.min(b1 ** k1, b2 ** k2);
        for (let n = 1; n < 5000; n++) if (n.toString(b1).length === k1 && n.toString(b2).length === k2) cnt++;
        const ans = Math.max(0, hi - lo);
        assert(cnt === ans, "2つの進法のけた数の検算");
        return num({
          q: `${b1}進法で表すと $${k1}$ けた、${b2}進法で表すと $${k2}$ けたになる自然数は何個ありますか。`,
          ans,
          wrongs: [[ans + 1, "MC-SLIP"], [b1 ** k1 - b1 ** (k1 - 1), "MC-BASE-PLACE"], [b2 ** k2 - b2 ** (k2 - 1), "MC-BASE-PLACE"]],
          explain: `${b1}進法で $${k1}$ けた：$${b1 ** (k1 - 1)}\\le n<${b1 ** k1}$。${b2}進法で $${k2}$ けた：$${b2 ** (k2 - 1)}\\le n<${b2 ** k2}$。両方を満たすのは $${lo}\\le n<${hi}$ で、$${hi}-${lo}=${ans}$ 個。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 三角形の重心・外心・内心 ────────────────────────
  geom_centers: [
    t("num", (r, lv) => {
      // 鋭角三角形（外心・内心が三角形の内部にある）
      const [A, B] = until(() => [r.int(38, 72), r.int(42, 74)], ([a, b]) => 180 - a - b >= 42 && 180 - a - b <= 76 && a !== b && a % 2 === 0 && b % 2 === 0);
      const C = 180 - A - B;
      const T = triFromAngles(A, B);
      const O = circumcenter(T.A, T.B, T.C);
      const I = incenter(T.A, T.B, T.C);
      const R = dist(O, T.A);
      const inr = Math.abs(I[1]); // BC は x 軸上
      const deg0 = (v) => `${v}°`; // 図の中の文字（SVG なので TeX ではなく記号の ° を使う）
      const pts = { A: T.A, B: T.B, C: T.C };
      const tri = [["A", "B"], ["B", "C"], ["C", "A"]];
      if (lv === 1) {
        const BOC = angleAt(O, T.B, T.C);
        nearly(BOC, 2 * A, "∠BOC = 2∠A の検算", 1e-6);
        const askO = r.chance(0.5);
        const fig = geoFigure({
          points: { ...pts, O },
          segments: [...tri, ["O", "B", { dash: "4 3" }], ["O", "C", { dash: "4 3" }]],
          circles: [{ c: O, r: R, color: "#8889" }],
          angleMarks: [{ at: "A", between: ["B", "C"], text: askO ? deg0(A) : "x" }, { at: "O", between: ["B", "C"], text: askO ? "x" : deg0(2 * A), textR: 22 }],
          labelDir: { O: [12, -6] },
        });
        return num({
          q: askO ? `点 O は △ABC の外心です。$\\angle BAC=${A}^{\\circ}$ のとき、$\\angle BOC=x$ を求めなさい。` : `点 O は △ABC の外心です。$\\angle BOC=${2 * A}^{\\circ}$ のとき、$\\angle BAC=x$ を求めなさい。`,
          fig,
          ans: askO ? 2 * A : A,
          post: "$^{\\circ}$",
          wrongs: askO
            ? [[A, "MC-CENTER-HALF"], [180 - A, "MC-CENTER-HALF"], [90 + A / 2, "MC-CENTER-CONFUSE"], [180 - 2 * A, "MC-CENTER-HALF"]]
            : [[4 * A, "MC-CENTER-HALF"], [180 - 2 * A, "MC-CENTER-HALF"], [2 * (2 * A - 90) > 0 ? 2 * (2 * A - 90) : 90 - A, "MC-CENTER-CONFUSE"]],
          explain: `外心 O は外接円の中心です。$\\angle BOC$ は弧 BC に対する中心角、$\\angle BAC$ は同じ弧に対する円周角なので、$\\angle BOC=2\\angle BAC$。${askO ? `$x=2\\times ${A}^{\\circ}=${2 * A}^{\\circ}$` : `$x=${2 * A}^{\\circ}\\div 2=${A}^{\\circ}$`}。`,
        });
      }
      if (lv === 2) {
        const BIC = angleAt(I, T.B, T.C);
        nearly(BIC, 90 + A / 2, "∠BIC = 90° + ∠A/2 の検算", 1e-6);
        const fromBC = r.chance(0.5);
        const fig = geoFigure({
          points: { ...pts, I },
          segments: [...tri, ["I", "B", { dash: "4 3" }], ["I", "C", { dash: "4 3" }]],
          circles: [{ c: I, r: inr, color: "#8889" }],
          angleMarks: fromBC
            ? [{ at: "B", between: ["A", "C"], text: deg0(B) }, { at: "C", between: ["A", "B"], text: deg0(C) }, { at: "I", between: ["B", "C"], text: "x", textR: 22 }]
            : [{ at: "A", between: ["B", "C"], text: deg0(A) }, { at: "I", between: ["B", "C"], text: "x", textR: 22 }],
          labelDir: { I: [12, -6] },
        });
        const ans = 90 + A / 2;
        return num({
          q: fromBC ? `点 I は △ABC の内心です。$\\angle ABC=${B}^{\\circ}$、$\\angle ACB=${C}^{\\circ}$ のとき、$\\angle BIC=x$ を求めなさい。` : `点 I は △ABC の内心です。$\\angle BAC=${A}^{\\circ}$ のとき、$\\angle BIC=x$ を求めなさい。`,
          fig,
          ans,
          post: "$^{\\circ}$",
          wrongs: [[2 * A, "MC-CENTER-CONFUSE"], [180 - A, "MC-INCENTER-HALF"], [90 + A, "MC-INCENTER-HALF"], [180 - A / 2, "MC-INCENTER-HALF"]],
          explain: `内心 I は内角の二等分線の交点なので、$\\angle IBC=\\frac12\\angle B$、$\\angle ICB=\\frac12\\angle C$。△IBC で $x=180^{\\circ}-\\frac12(\\angle B+\\angle C)$${fromBC ? `$=180^{\\circ}-\\frac12(${B}^{\\circ}+${C}^{\\circ})=${ans}^{\\circ}$` : `。$\\angle B+\\angle C=180^{\\circ}-${A}^{\\circ}=${B + C}^{\\circ}$ なので $x=180^{\\circ}-${(B + C) / 2}^{\\circ}=${ans}^{\\circ}$`}。（$x=90^{\\circ}+\\frac12\\angle A$ とも表せます）`,
        });
      }
      // 発展：外心で ∠OBC から ∠A、内心で ∠BIC から ∠A
      if (r.chance(0.5)) {
        const OBC = 90 - A;
        nearly(angleAt(T.B, O, T.C), OBC, "∠OBC = 90° − ∠A の検算", 1e-6);
        const fig = geoFigure({
          points: { ...pts, O },
          segments: [...tri, ["O", "B", { dash: "4 3" }], ["O", "C", { dash: "4 3" }]],
          circles: [{ c: O, r: R, color: "#8889" }],
          angleMarks: [{ at: "B", between: ["O", "C"], text: deg0(OBC), r: 22, textR: 40 }, { at: "A", between: ["B", "C"], text: "x" }],
          labelDir: { O: [12, -6] },
        });
        return num({
          q: `点 O は △ABC の外心です。$\\angle OBC=${OBC}^{\\circ}$ のとき、$\\angle BAC=x$ を求めなさい。（△ABC は鋭角三角形）`,
          fig,
          ans: A,
          post: "$^{\\circ}$",
          wrongs: [[180 - 2 * OBC, "MC-CENTER-HALF"], [2 * OBC, "MC-CENTER-HALF"], [90 + OBC, "MC-CENTER-CONFUSE"], [OBC, "MC-CENTER-CONFUSE"]],
          explain: `$OB=OC$（外接円の半径）なので △OBC は二等辺三角形で、$\\angle OCB=${OBC}^{\\circ}$。よって $\\angle BOC=180^{\\circ}-2\\times ${OBC}^{\\circ}=${180 - 2 * OBC}^{\\circ}$。円周角は中心角の半分なので $x=${A}^{\\circ}$。`,
        });
      }
      const BIC = 90 + A / 2;
      const fig = geoFigure({
        points: { ...pts, I },
        segments: [...tri, ["I", "B", { dash: "4 3" }], ["I", "C", { dash: "4 3" }]],
        circles: [{ c: I, r: inr, color: "#8889" }],
        angleMarks: [{ at: "I", between: ["B", "C"], text: deg0(BIC), textR: 24 }, { at: "A", between: ["B", "C"], text: "x" }],
        labelDir: { I: [12, -6] },
      });
      return num({
        q: `点 I は △ABC の内心です。$\\angle BIC=${BIC}^{\\circ}$ のとき、$\\angle BAC=x$ を求めなさい。`,
        fig,
        ans: A,
        post: "$^{\\circ}$",
        wrongs: [[BIC - 90, "MC-INCENTER-HALF"], [180 - BIC, "MC-INCENTER-HALF"], [BIC / 2, "MC-CENTER-CONFUSE"]],
        explain: `$\\angle IBC+\\angle ICB=180^{\\circ}-${BIC}^{\\circ}=${180 - BIC}^{\\circ}$。I は角の二等分線の交点なので $\\angle B+\\angle C=2\\times ${180 - BIC}^{\\circ}=${2 * (180 - BIC)}^{\\circ}$。よって $x=180^{\\circ}-${2 * (180 - BIC)}^{\\circ}=${A}^{\\circ}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 重心：中線の比・面積・平行線
        const T = until(() => triFromSides(r.int(6, 10), r.int(5, 9), r.int(5, 9)), (tr) => Number.isFinite(tr.A[1]) && tr.A[1] > 2.5 && tr.A[0] > 0.5 && tr.A[0] < dist(tr.B, tr.C) - 0.5);
        const D = [(T.B[0] + T.C[0]) / 2, (T.B[1] + T.C[1]) / 2];
        const G = [(T.A[0] + T.B[0] + T.C[0]) / 3, (T.A[1] + T.B[1] + T.C[1]) / 3];
        nearly(dist(T.A, G) / dist(G, D), 2, "重心が中線を 2:1 に分けることの検算", 1e-9);
        const pts = { A: T.A, B: T.B, C: T.C, D, G };
        const tri = [["A", "B"], ["B", "C"], ["C", "A"]];
        if (lv === 1) {
          const m = 3 * r.int(2, 8);
          const askAG = r.chance(0.5);
          return num({
            q: `点 G は △ABC の重心で、D は辺 BC の中点です。中線 AD の長さが $${m}$ のとき、${askAG ? "AG" : "GD"} の長さを求めなさい。`,
            fig: geoFigure({ points: pts, segments: [...tri, ["A", "D"]], segLabels: [] , labelDir: { G: [12, -2], D: [0, 16] } }),
            ans: askAG ? (2 * m) / 3 : m / 3,
            wrongs: [[m / 2, "MC-CENTROID-HALF"], [askAG ? m / 3 : (2 * m) / 3, "MC-CENTROID-RATIO"], [m, "MC-CENTROID-HALF"]],
            explain: `重心は中線を、頂点の側から $2:1$ に内分します。$AG=${m}\\times\\dfrac{2}{3}=${(2 * m) / 3}$、$GD=${m}\\times\\dfrac13=${m / 3}$。答えは $${askAG ? (2 * m) / 3 : m / 3}$。`,
          });
        }
        if (lv === 2) {
          const S = 6 * r.int(3, 15);
          const which = r.pick(["GBC", "GAB", "GBD"]);
          const areaOf = (P1, P2, P3) => Math.abs((P2[0] - P1[0]) * (P3[1] - P1[1]) - (P3[0] - P1[0]) * (P2[1] - P1[1])) / 2;
          const whole = areaOf(T.A, T.B, T.C);
          const ratio = which === "GBC" ? areaOf(G, T.B, T.C) / whole : which === "GAB" ? areaOf(G, T.A, T.B) / whole : areaOf(G, T.B, D) / whole;
          const ans = which === "GBD" ? S / 6 : S / 3;
          nearly(ratio * S, ans, "面積比の検算", 1e-9);
          const name = which === "GBC" ? "△GBC" : which === "GAB" ? "△GAB" : "△GBD";
          return num({
            q: `点 G は △ABC の重心で、D は辺 BC の中点です。△ABC の面積が $${S}$ のとき、${name} の面積を求めなさい。`,
            fig: geoFigure({ points: pts, segments: [...tri, ["A", "D"], ["G", "B", { dash: "4 3" }], ...(which === "GBC" ? [["G", "C", { dash: "4 3" }]] : [])], labelDir: { G: [12, -2], D: [0, 16] } }),
            ans,
            wrongs: which === "GBD" ? [[S / 3, "MC-CENTROID-RATIO"], [S / 4, "MC-CENTROID-HALF"], [S / 2, "MC-CENTROID-HALF"]] : [[S / 2, "MC-CENTROID-HALF"], [S / 6, "MC-CENTROID-RATIO"], [(2 * S) / 3, "MC-CENTROID-RATIO"]],
            explain:
              which === "GBD"
                ? `△ABD の面積は △ABC の半分で $${S / 2}$。$GD:AD=1:3$ なので、△GBD の面積は △ABD の $\\frac13$ で $${S / 6}$。`
                : `${which === "GBC" ? "△GBC と △ABC は底辺 BC が共通で、高さの比は $GD:AD=1:3$" : "3本の中線で、△GAB・△GBC・△GCA の面積はすべて等しく"}。よって ${name} の面積は △ABC の $\\frac13$ で $${S / 3}$。`,
          });
        }
        // G を通り BC に平行な直線が AB、AC と交わる点 P、Q
        const a = 3 * r.int(2, 9);
        const P = [T.A[0] + ((T.B[0] - T.A[0]) * 2) / 3, T.A[1] + ((T.B[1] - T.A[1]) * 2) / 3];
        const Qp = [T.A[0] + ((T.C[0] - T.A[0]) * 2) / 3, T.A[1] + ((T.C[1] - T.A[1]) * 2) / 3];
        nearly(P[1], G[1], "PQ が G を通ることの検算", 1e-9);
        nearly(dist(P, Qp) / dist(T.B, T.C), 2 / 3, "PQ:BC の検算", 1e-9);
        return num({
          q: `点 G は △ABC の重心です。G を通り辺 BC に平行な直線が、辺 AB、AC と交わる点をそれぞれ P、Q とします。$BC=${a}$ のとき、PQ の長さを求めなさい。`,
          fig: geoFigure({ points: { A: T.A, B: T.B, C: T.C, G, P, Q: Qp, D }, segments: [["A", "B"], ["B", "C"], ["C", "A"], ["P", "Q"], ["A", "D", { dash: "4 3" }]], segLabels: [{ seg: ["B", "C"], text: String(a) }], labelDir: { G: [0, -12], D: [10, 16], P: [-14, 0], Q: [14, 0] } }),
          ans: (2 * a) / 3,
          wrongs: [[a / 2, "MC-CENTROID-HALF"], [a / 3, "MC-CENTROID-RATIO"], [(3 * a) / 4, "MC-CENTROID-HALF"]],
          explain: `中線 AD 上で $AG:AD=2:3$。PQ // BC なので △APQ ∽ △ABC で、相似比は $AG:AD=2:3$。よって $PQ=${a}\\times\\dfrac23=${(2 * a) / 3}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "fields",
      (r, lv) => {
        // 座標と重心
        const pt = () => [r.int(-6, 6), r.int(-6, 6)];
        const vec = (p) => `(${p[0]},\\ ${p[1]})`;
        const [A, B, C] = until(() => [pt(), pt(), pt()], ([a, b, c]) => (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]) !== 0 && (a[0] + b[0] + c[0]) % 3 === 0 && (a[1] + b[1] + c[1]) % 3 === 0);
        const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
        const fl = (x, y) => [
          { id: "x", value: x, pre: "$($" },
          { id: "y", value: y, pre: "$,$", post: "$)$" },
        ];
        if (lv === 1) {
          return fields({
            q: `3点 $A${vec(A)}$、$B${vec(B)}$、$C${vec(C)}$ を頂点とする △ABC の重心 G の座標を求めなさい。`,
            fields: fl(G[0], G[1]),
            wrongs: [
              { values: { x: A[0] + B[0] + C[0], y: A[1] + B[1] + C[1] }, mc: "MC-CENTROID-NO-DIV3" },
              { values: { x: Q(A[0] + B[0] + C[0], 2), y: Q(A[1] + B[1] + C[1], 2) }, mc: "MC-CENTROID-NO-DIV3" },
              { values: { x: G[1], y: G[0] }, mc: "MC-COORD-XY-SWAP" },
            ],
            explain: `重心の座標は、3つの頂点の座標の平均です。$x=\\dfrac{${A[0]}+(${B[0]})+(${C[0]})}{3}=${G[0]}$、$y=\\dfrac{${A[1]}+(${B[1]})+(${C[1]})}{3}=${G[1]}$。`,
          });
        }
        if (lv === 2) {
          return fields({
            q: `△ABC の頂点が $A${vec(A)}$、$B${vec(B)}$ で、重心が $G${vec(G)}$ です。頂点 C の座標を求めなさい。`,
            fields: fl(C[0], C[1]),
            wrongs: [
              { values: { x: G[0] - A[0] - B[0], y: G[1] - A[1] - B[1] }, mc: "MC-CENTROID-NO-DIV3" },
              { values: { x: 2 * G[0] - A[0] - B[0], y: 2 * G[1] - A[1] - B[1] }, mc: "MC-CENTROID-NO-DIV3" },
              { values: { x: C[1], y: C[0] }, mc: "MC-COORD-XY-SWAP" },
            ],
            explain: `C の座標を $(p,\\ q)$ とすると、$\\dfrac{${A[0]}+(${B[0]})+p}{3}=${G[0]}$、$\\dfrac{${A[1]}+(${B[1]})+q}{3}=${G[1]}$。これを解いて $p=${C[0]}$、$q=${C[1]}$。`,
          });
        }
        // 辺を m:n に内分する点でできる三角形の重心（もとの重心と一致する）
        const [m, n] = until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => u !== v && gcd(u, v) === 1);
        const divPt = (P1, P2) => [Q(n * P1[0] + m * P2[0], m + n), Q(n * P1[1] + m * P2[1], m + n)];
        const Dp = divPt(B, C);
        const Ep = divPt(C, A);
        const Fp = divPt(A, B);
        const Gx = div(add(add(Dp[0], Ep[0]), Fp[0]), 3);
        const Gy = div(add(add(Dp[1], Ep[1]), Fp[1]), 3);
        assert(eq(Gx, Q(G[0])) && eq(Gy, Q(G[1])), "△DEF の重心が △ABC の重心と一致することの検算");
        return fields({
          q: `3点 $A${vec(A)}$、$B${vec(B)}$、$C${vec(C)}$ があります。辺 BC、CA、AB を $${m}:${n}$ に内分する点をそれぞれ D、E、F とするとき、△DEF の重心の座標を求めなさい。`,
          fields: fl(G[0], G[1]),
          wrongs: [
            { values: { x: Dp[0], y: Dp[1] }, mc: "MC-CENTROID-HALF" },
            { values: { x: A[0] + B[0] + C[0], y: A[1] + B[1] + C[1] }, mc: "MC-CENTROID-NO-DIV3" },
          ],
          explain: `D、E、F の座標は $D\\left(${tq(Dp[0])},\\ ${tq(Dp[1])}\\right)$、$E\\left(${tq(Ep[0])},\\ ${tq(Ep[1])}\\right)$、$F\\left(${tq(Fp[0])},\\ ${tq(Fp[1])}\\right)$。3つの $x$ 座標の平均は $${G[0]}$、$y$ 座標の平均は $${G[1]}$ です。（どの比で内分しても、△DEF の重心は △ABC の重心と一致します）`,
        });
      },
      { id: "c" },
    ),
    t(
      "choice",
      (r, lv) => {
        const NAMES5 = ["重心", "外心", "内心", "垂心"];
        if (lv === 1) {
          const item = r.pick([
            ["3本の中線の交点", "重心"],
            ["3辺の垂直二等分線の交点", "外心"],
            ["3つの内角の二等分線の交点", "内心"],
            ["3つの頂点から対辺（またはその延長）に引いた垂線の交点", "垂心"],
          ]);
          return choice({
            q: `三角形の「${item[0]}」を何といいますか。`,
            correct: item[1],
            wrongs: NAMES5.filter((x) => x !== item[1]).map((x) => [x, "MC-CENTER-CONFUSE"]),
            explain: `重心＝中線の交点、外心＝辺の垂直二等分線の交点（外接円の中心）、内心＝内角の二等分線の交点（内接円の中心）、垂心＝垂線の交点。「${item[0]}」は${item[1]}です。`,
          });
        }
        if (lv === 2) {
          const item = r.pick([
            ["3つの頂点から等しい距離にある点", "外心"],
            ["3つの辺から等しい距離にある点", "内心"],
            ["各中線を、頂点の側から $2:1$ に内分する点", "重心"],
            ["外接円の中心", "外心"],
            ["内接円の中心", "内心"],
          ]);
          return choice({
            q: `三角形について、「${item[0]}」はどれですか。`,
            correct: item[1],
            wrongs: NAMES5.filter((x) => x !== item[1]).map((x) => [x, "MC-CENTER-CONFUSE"]),
            explain: `外心は3頂点から等距離（外接円の中心）、内心は3辺から等距離（内接円の中心）、重心は中線を $2:1$ に内分する点です。答えは${item[1]}。`,
          });
        }
        const item = r.pick([
          ["直角三角形の外心の位置", "斜辺の中点", ["直角の頂点", "三角形の内部（辺の上にない点）", "三角形の外部"]],
          ["鈍角三角形の外心の位置", "三角形の外部", ["三角形の内部（辺の上にない点）", "いちばん長い辺の中点", "鈍角の頂点"]],
          ["正三角形の重心・外心・内心・垂心の位置関係", "4つとも同じ点になる", ["重心と内心だけが一致する", "4つとも異なる点になる", "外心と垂心だけが一致する"]],
          ["直角三角形の垂心の位置", "直角の頂点", ["斜辺の中点", "三角形の内部（辺の上にない点）", "三角形の外部"]],
        ]);
        return choice({
          q: `${item[0]}として正しいものはどれですか。`,
          correct: item[1],
          wrongs: item[2].map((x) => [x, "MC-CENTER-CONFUSE"]),
          explain:
            item[1] === "斜辺の中点"
              ? "直角三角形では、直角の頂点から見た斜辺の円周角が $90^{\\circ}$ なので、斜辺が外接円の直径になります。外心は斜辺の中点です。"
              : item[1] === "三角形の外部"
                ? "鈍角三角形では、鈍角に向かい合う辺の垂直二等分線と他の辺の垂直二等分線が、三角形の外で交わります。外心は三角形の外部にあります。"
                : item[1] === "直角の頂点"
                  ? "直角三角形では、直角をはさむ2辺がそのまま2本の「垂線」になるので、垂線の交点（垂心）は直角の頂点です。"
                  : "正三角形は対称なので、中線・垂直二等分線・角の二等分線・垂線がすべて同じ直線になり、4つの点は一致します。",
        });
      },
      { id: "d", finite: true },
    ),
  ],

  // ── 角の二等分線・チェバ・メネラウスの定理 ─────────────
  geom_ratio: [
    t("num", (r, lv) => {
      // 3辺 a=BC, b=CA, c=AB（整数）で、答えが整数になるものを選ぶ
      const pickTri = (need) =>
        until(
          () => {
            const b = r.int(3, 12);
            const c = r.int(3, 12);
            const a = r.int(3, 16);
            return [a, b, c];
          },
          ([a, b, c]) => {
            if (!(b !== c && a < b + c && b < a + c && c < a + b && need(a, b, c))) return false;
            // 図が細長くなりすぎないよう、どの角も 28°〜125° にする
            const ang = (x, y, z) => deg(Math.acos((y * y + z * z - x * x) / (2 * y * z)));
            return [ang(a, b, c), ang(b, c, a), ang(c, a, b)].every((v) => v >= 28 && v <= 125);
          },
        );
      if (lv === 1) {
        const [a, b, c] = pickTri((a, b, c) => (a * c) % (b + c) === 0);
        const T = triFromSides(a, b, c);
        const u = [(T.B[0] - T.A[0]) / c + (T.C[0] - T.A[0]) / b, (T.B[1] - T.A[1]) / c + (T.C[1] - T.A[1]) / b];
        const D = intersect(T.A, [T.A[0] + u[0], T.A[1] + u[1]], T.B, T.C);
        const BD = (a * c) / (b + c);
        nearly(dist(T.B, D), BD, "角の二等分線の比の検算", 1e-9);
        const askBD = r.chance(0.5);
        return num({
          q: `△ABC で、$AB=${c}$、$AC=${b}$、$BC=${a}$ です。$\\angle A$ の二等分線と辺 BC の交点を D とするとき、${askBD ? "BD" : "DC"} の長さを求めなさい。`,
          fig: geoFigure({ points: { A: T.A, B: T.B, C: T.C, D }, segments: [["A", "B"], ["B", "C"], ["C", "A"], ["A", "D"]], segLabels: [{ seg: ["A", "B"], text: String(c) }, { seg: ["A", "C"], text: String(b) }], angleMarks: [{ at: "A", between: ["B", "D"], text: "", r: 20 }, { at: "A", between: ["D", "C"], text: "", r: 24 }], labelDir: { D: [0, 16] } }),
          ans: askBD ? BD : a - BD,
          wrongs: [[askBD ? a - BD : BD, "MC-BISECTOR-SWAP"], [Q(a, 2), "MC-BISECTOR-MIDPOINT"]],
          explain: `角の二等分線の性質から $BD:DC=AB:AC=${c}:${b}$。$BC=${a}$ をこの比に分けて、$BD=${a}\\times\\dfrac{${c}}{${b + c}}=${BD}$、$DC=${a}\\times\\dfrac{${b}}{${b + c}}=${a - BD}$。答えは $${askBD ? BD : a - BD}$。`,
        });
      }
      if (lv === 2) {
        // 外角の二等分線：AB>AC のとき、BC の C の側の延長上に E。BE:EC=AB:AC
        const [a, b, c] = pickTri((a, b, c) => c > b && (a * b) % (c - b) === 0 && (a * b) / (c - b) <= 2.2 * a);
        const T = triFromSides(a, b, c);
        const u = [(T.B[0] - T.A[0]) / c - (T.C[0] - T.A[0]) / b, (T.B[1] - T.A[1]) / c - (T.C[1] - T.A[1]) / b];
        const E = intersect(T.A, [T.A[0] + u[0], T.A[1] + u[1]], T.B, T.C);
        const CE = (a * b) / (c - b);
        nearly(dist(T.C, E), CE, "外角の二等分線の検算", 1e-9);
        assert(E[0] > T.C[0], "E が C の側の延長上にあること");
        return num({
          q: `△ABC で、$AB=${c}$、$AC=${b}$、$BC=${a}$ です。$\\angle A$ の外角の二等分線と、辺 BC の延長の交点を E とするとき、CE の長さを求めなさい。`,
          fig: geoFigure({ points: { A: T.A, B: T.B, C: T.C, E }, segments: [["A", "B"], ["B", "C"], ["C", "A"], ["C", "E", { dash: "4 3" }], ["A", "E"]], segLabels: [{ seg: ["A", "B"], text: String(c) }, { seg: ["A", "C"], text: String(b) }, { seg: ["B", "C"], text: String(a) }], labelDir: { E: [8, 14] } }),
          ans: CE,
          wrongs: [[Q(a * b, b + c), "MC-BISECTOR-EXTERNAL"], [(a * c) / (c - b), "MC-BISECTOR-SWAP"], [Q(a * c, b + c), "MC-BISECTOR-EXTERNAL"]],
          explain: `外角の二等分線は、対辺 BC を $AB:AC$ に外分します。$BE:EC=${c}:${b}$ なので、$CE=x$ とおくと $(${a}+x):x=${c}:${b}$。$${b}(${a}+x)=${c}x$ より $x=\\dfrac{${a * b}}{${c - b}}=${CE}$。`,
        });
      }
      // 内心：AI:ID=(b+c):a
      const [a, b, c] = pickTri(() => true);
      const T = triFromSides(a, b, c);
      const I = incenter(T.A, T.B, T.C);
      const D = intersect(T.A, I, T.B, T.C);
      const ans = Q(b + c, a);
      nearly(dist(T.A, I) / dist(I, D), qnum(ans), "AI:ID の検算", 1e-9);
      return num({
        q: `△ABC で、$AB=${c}$、$BC=${a}$、$CA=${b}$ です。内心を I とし、直線 AI と辺 BC の交点を D とするとき、$\\dfrac{AI}{ID}$ の値を求めなさい。`,
        fig: geoFigure({ points: { A: T.A, B: T.B, C: T.C, I, D }, segments: [["A", "B"], ["B", "C"], ["C", "A"], ["A", "D"], ["B", "I", { dash: "4 3" }]], segLabels: [{ seg: ["A", "B"], text: String(c) }, { seg: ["A", "C"], text: String(b) }, { seg: ["B", "C"], text: String(a) }], labelDir: { D: [4, 16], I: [12, -4] } }),
        ans,
        reduced: true,
        wrongs: [[Q(a, b + c), "MC-RATIO-REVERSE"], [Q(c, b), "MC-BISECTOR-SWAP"], [Q(a + b + c, a), "MC-BISECTOR-SWAP"]],
        explain: `まず $BD:DC=AB:AC=${c}:${b}$ から $BD=${a}\\times\\dfrac{${c}}{${b + c}}=${tq(Q(a * c, b + c))}$。BI は $\\angle B$ の二等分線なので、△ABD で $AI:ID=BA:BD=${c}:${tq(Q(a * c, b + c))}=${b + c}:${a}$。よって $\\dfrac{AI}{ID}=${tq(ans)}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // チェバ・メネラウス：基準の三角形 A(0,0), B(1,0), C(0,1) の上で、比を有理数のまま計算する
        const solve2 = (P1, P2, P3, P4) => {
          // P1 + u(P2−P1) = P3 + v(P4−P3) を解いて u を返す
          const d1 = [sub(P2[0], P1[0]), sub(P2[1], P1[1])];
          const d2 = [sub(P4[0], P3[0]), sub(P4[1], P3[1])];
          const rhs = [sub(P3[0], P1[0]), sub(P3[1], P1[1])];
          const det = sub(mul(d1[0], d2[1]), mul(d1[1], d2[0]));
          return div(sub(mul(rhs[0], d2[1]), mul(rhs[1], d2[0])), det);
        };
        const at = (P1, P2, u) => [add(P1[0], mul(u, sub(P2[0], P1[0]))), add(P1[1], mul(u, sub(P2[1], P1[1])))];
        const A = [Q(0), Q(0)];
        const B = [Q(1), Q(0)];
        const C = [Q(0), Q(1)];
        const pair = () => until(() => [r.int(1, 4), r.int(1, 4)], ([x, y]) => x !== y && gcd(x, y) === 1);
        // 図：実際の三角形に写す
        const TA = [2.2, 3.6];
        const TB = [0, 0];
        const TC = [5, 0];
        const real = (P) => [TA[0] + qnum(P[0]) * (TB[0] - TA[0]) + qnum(P[1]) * (TC[0] - TA[0]), TA[1] + qnum(P[0]) * (TB[1] - TA[1]) + qnum(P[1]) * (TC[1] - TA[1])];
        const tri = [["A", "B"], ["B", "C"], ["C", "A"]];
        let q;
        let ansR;
        let wrongs;
        let expl;
        let figPts;
        let segs;
        if (lv === 1) {
          const [p1, p2] = pair();
          const [q1, q2] = pair();
          const P = [Q(p2, p1 + p2), Q(p1, p1 + p2)]; // BP:PC = p1:p2
          const Qp = [Q(0), Q(q2, q1 + q2)]; // CQ:QA = q1:q2
          const O = at(A, P, solve2(A, P, B, Qp));
          const w = div(1, sub(1, O[1]));
          const R = [mul(w, O[0]), Q(0)];
          ansR = simpleRatio(R[0], sub(1, R[0]));
          const byCeva = simpleRatio(Q(p2 * q2), Q(p1 * q1));
          assert(ansR[0] === byCeva[0] && ansR[1] === byCeva[1], "チェバの定理の検算");
          q = `△ABC の辺 BC、CA 上にそれぞれ点 P、Q があり、$BP:PC=${p1}:${p2}$、$CQ:QA=${q1}:${q2}$ です。AP と BQ の交点を O とし、直線 CO と辺 AB の交点を R とするとき、$AR:RB$ を最も簡単な整数の比で求めなさい。`;
          wrongs = [{ values: { m: ansR[1], n: ansR[0] }, mc: "MC-RATIO-REVERSE" }, { values: Object.fromEntries(simpleRatio(Q(p2 * q1), Q(p1 * q2)).map((v, i) => [i ? "n" : "m", v])), mc: "MC-CEVA-ORDER" }];
          expl = `チェバの定理 $\\dfrac{BP}{PC}\\cdot\\dfrac{CQ}{QA}\\cdot\\dfrac{AR}{RB}=1$ より、$\\dfrac{${p1}}{${p2}}\\cdot\\dfrac{${q1}}{${q2}}\\cdot\\dfrac{AR}{RB}=1$。$\\dfrac{AR}{RB}=\\dfrac{${p2 * q2}}{${p1 * q1}}$ なので、$AR:RB=${ansR[0]}:${ansR[1]}$。`;
          figPts = { A: real(A), B: real(B), C: real(C), P: real(P), Q: real(Qp), R: real(R), O: real(O) };
          segs = [...tri, ["A", "P"], ["B", "Q"], ["C", "R"]];
        } else {
          const [r1, r2] = pair();
          const [s1, s2] = pair();
          const R = [Q(r1, r1 + r2), Q(0)]; // AR:RB = r1:r2
          const Qp = [Q(0), Q(s1, s1 + s2)]; // AQ:QC = s1:s2
          const u = solve2(B, Qp, C, R); // O = B + u(Q−B)
          const O = at(B, Qp, u);
          const P = [div(O[0], add(O[0], O[1])), div(O[1], add(O[0], O[1]))];
          figPts = { A: real(A), B: real(B), C: real(C), P: real(P), Q: real(Qp), R: real(R), O: real(O) };
          segs = [...tri, ["A", "P"], ["B", "Q"], ["C", "R"]];
          const head = `△ABC の辺 AB、AC 上にそれぞれ点 R、Q があり、$AR:RB=${r1}:${r2}$、$AQ:QC=${s1}:${s2}$ です。BQ と CR の交点を O とします。`;
          if (lv === 2) {
            ansR = simpleRatio(u, sub(1, u));
            const byMene = simpleRatio(Q(r2 * (s1 + s2)), Q(r1 * s2));
            assert(ansR[0] === byMene[0] && ansR[1] === byMene[1], "メネラウスの定理の検算");
            q = `${head}$BO:OQ$ を最も簡単な整数の比で求めなさい。`;
            wrongs = [{ values: { m: ansR[1], n: ansR[0] }, mc: "MC-RATIO-REVERSE" }, { values: Object.fromEntries(simpleRatio(Q(r2 * s1), Q(r1 * s2)).map((v, i) => [i ? "n" : "m", v])), mc: "MC-CEVA-ORDER" }];
            expl = `△ABQ と直線 RC にメネラウスの定理を使います：$\\dfrac{AR}{RB}\\cdot\\dfrac{BO}{OQ}\\cdot\\dfrac{QC}{CA}=1$。$\\dfrac{${r1}}{${r2}}\\cdot\\dfrac{BO}{OQ}\\cdot\\dfrac{${s2}}{${s1 + s2}}=1$ より $\\dfrac{BO}{OQ}=\\dfrac{${r2 * (s1 + s2)}}{${r1 * s2}}$。$BO:OQ=${ansR[0]}:${ansR[1]}$。`;
          } else {
            const w = div(1, add(O[0], O[1])); // P = w·O
            ansR = simpleRatio(Q(1), sub(w, 1));
            // 独立な検算：チェバで BP:PC を出し、△ABP と直線 CR にメネラウスを使う
            const bp = Q(r2 * s1); // チェバ：BP:PC = (RB·AQ):(AR·QC) = (r2·s1):(r1·s2)
            const pc = Q(r1 * s2);
            const BPoverBC = div(bp, add(bp, pc));
            // △ABP と直線 R-O-C：(AR/RB)(BC/CP)(PO/OA)=1 → PO/OA = (RB/AR)(CP/BC)
            const POoverOA = mul(Q(r2, r1), div(pc, add(bp, pc)));
            const alt = simpleRatio(Q(1), POoverOA);
            assert(alt[0] === ansR[0] && alt[1] === ansR[1] && eq(div(P[1], 1), BPoverBC), "AO:OP の検算");
            q = `${head}直線 AO と辺 BC の交点を P とするとき、$AO:OP$ を最も簡単な整数の比で求めなさい。`;
            wrongs = [{ values: { m: ansR[1], n: ansR[0] }, mc: "MC-RATIO-REVERSE" }, { values: Object.fromEntries(simpleRatio(Q(r1 * s2), Q(r2 * s1)).map((v, i) => [i ? "n" : "m", v])), mc: "MC-CEVA-ORDER" }];
            expl = `まずチェバの定理で $BP:PC$ を求めます：$\\dfrac{BP}{PC}\\cdot\\dfrac{CQ}{QA}\\cdot\\dfrac{AR}{RB}=1$ より $BP:PC=${simpleRatio(bp, pc).join(":")}$。次に △ABP と直線 RC にメネラウスの定理：$\\dfrac{AR}{RB}\\cdot\\dfrac{BC}{CP}\\cdot\\dfrac{PO}{OA}=1$。これを解いて $AO:OP=${ansR[0]}:${ansR[1]}$。`;
          }
        }
        // 実際の三角形でも比を確かめる
        const fp = figPts;
        const lenRatio = lv === 1 ? dist(fp.A, fp.R) / dist(fp.R, fp.B) : lv === 2 ? dist(fp.B, fp.O) / dist(fp.O, fp.Q) : dist(fp.A, fp.O) / dist(fp.O, fp.P);
        nearly(lenRatio, ansR[0] / ansR[1], "図の上での比の検算", 1e-9);
        return fields({
          q,
          fig: geoFigure({ points: figPts, segments: segs, labelDir: { O: [12, -4], P: [0, 16] } }),
          fields: ratioFields(ansR),
          wrongs,
          explain: expl,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 円の性質（内接四角形・接弦定理・方べきの定理） ───────
  geom_circle_hs: [
    t("num", (r, lv) => {
      const onC = (d) => [Math.cos(rad(d)), Math.sin(rad(d))];
      const dg = (v) => `${v}°`;
      if (lv === 1) {
        // 円に内接する四角形 ABCD（弧 AB=α, BC=β, CD=γ, DA=δ）
        const arcs = until(() => [r.int(28, 55) * 2, r.int(28, 55) * 2, r.int(28, 55) * 2], ([a, b, c]) => 360 - a - b - c >= 56 && 360 - a - b - c <= 110);
        const [al, be, ga] = arcs;
        const de = 360 - al - be - ga;
        const posA = 115;
        const P = { A: onC(posA), B: onC(posA + al), C: onC(posA + al + be), D: onC(posA + al + be + ga) };
        const angA = (be + ga) / 2;
        const angC = (de + al) / 2;
        nearly(angleAt(P.A, P.B, P.D), angA, "内接四角形の角 A の検算", 1e-6);
        nearly(angleAt(P.C, P.B, P.D), angC, "内接四角形の角 C の検算", 1e-6);
        const ext = r.chance(0.5);
        if (!ext) {
          return num({
            q: `四角形 ABCD は円に内接しています。$\\angle BAD=${angA}^{\\circ}$ のとき、$\\angle BCD=x$ を求めなさい。`,
            fig: geoFigure({ points: P, circles: [{ c: [0, 0], r: 1 }], segments: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]], angleMarks: [{ at: "A", between: ["B", "D"], text: dg(angA) }, { at: "C", between: ["B", "D"], text: "x" }], noDot: [] }),
            ans: angC,
            post: "$^{\\circ}$",
            wrongs: [[angA, "MC-CYCLIC-EQUAL"], [360 - angA, "MC-CYCLIC-EQUAL"], [angA / 2, "MC-CENTER-HALF"]],
            explain: `円に内接する四角形では、向かい合う角の和が $180^{\\circ}$ です。$x=180^{\\circ}-${angA}^{\\circ}=${angC}^{\\circ}$。`,
          });
        }
        // 外角：辺 BC を C の側に延長した点 E で ∠DCE = ∠A
        const E = [P.C[0] + 0.55 * (P.C[0] - P.B[0]), P.C[1] + 0.55 * (P.C[1] - P.B[1])];
        nearly(angleAt(P.C, P.D, E), angA, "外角と内対角の検算", 1e-6);
        return num({
          q: `四角形 ABCD は円に内接しています。辺 BC を C の側に延長した直線上に点 E をとります。$\\angle BAD=${angA}^{\\circ}$ のとき、$\\angle DCE=x$ を求めなさい。`,
          fig: geoFigure({ points: { ...P, E }, circles: [{ c: [0, 0], r: 1 }], segments: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], ["C", "E"]], angleMarks: [{ at: "A", between: ["B", "D"], text: dg(angA) }, { at: "C", between: ["D", "E"], text: "x" }] }),
          ans: angA,
          post: "$^{\\circ}$",
          wrongs: [[180 - angA, "MC-CYCLIC-EXTERIOR"], [angA / 2, "MC-CENTER-HALF"], [90 - angA / 2, "MC-CYCLIC-EXTERIOR"]],
          explain: `円に内接する四角形では、1つの外角は、それととなり合う内角の対角に等しくなります。$\\angle BCD=180^{\\circ}-${angA}^{\\circ}$ なので、$x=180^{\\circ}-\\angle BCD=${angA}^{\\circ}$。`,
        });
      }
      // 接弦定理：A での接線 ST（S は左、T は右）。B は右側、C は左上
      const t0 = r.int(26, 70);
      const b0 = lv === 3 ? until(() => r.int(24, 72), (v) => 180 - t0 - v >= 30) : r.int(30, 70);
      const phiB = 270 + 2 * t0;
      const phiC = 270 - 2 * b0;
      const P = { A: onC(270), B: onC(phiB), C: onC(phiC), T: [0.95, -1], S: [-0.95, -1] };
      nearly(angleAt(P.A, P.T, P.B), t0, "接線と弦の角の検算", 1e-6);
      nearly(angleAt(P.C, P.A, P.B), t0, "接弦定理の検算", 1e-6);
      nearly(angleAt(P.B, P.A, P.C), b0, "∠ABC の検算", 1e-6);
      const base = { points: P, circles: [{ c: [0, 0], r: 1 }], segments: [["S", "T"], ["A", "B"], ["B", "C"], ["C", "A"]], noDot: ["S", "T"], labelDir: { A: [0, 16], S: [-4, 14], T: [4, 14] } };
      if (lv === 2) {
        const askC = r.chance(0.5);
        return num({
          q: askC
            ? `直線 ST は点 A で円に接しています。$\\angle TAB=${t0}^{\\circ}$ のとき、$\\angle ACB=x$ を求めなさい。`
            : `直線 ST は点 A で円に接しています。$\\angle ACB=${t0}^{\\circ}$ のとき、$\\angle TAB=x$ を求めなさい。`,
          fig: geoFigure({ ...base, angleMarks: [{ at: "A", between: ["T", "B"], text: askC ? dg(t0) : "x", r: 18, textR: 34 }, { at: "C", between: ["A", "B"], text: askC ? "x" : dg(t0) }] }),
          ans: t0,
          post: "$^{\\circ}$",
          wrongs: [[180 - t0, "MC-TANGENT-CHORD-SIDE"], [2 * t0, "MC-TANGENT-CHORD-DOUBLE"], [90 - t0, "MC-TANGENT-CHORD-SIDE"]],
          explain: `接弦定理：接線と弦 AB のつくる角 $\\angle TAB$ は、その角の内側にある弧 AB に対する円周角 $\\angle ACB$ に等しい。よって $x=${t0}^{\\circ}$。`,
        });
      }
      const ans = 180 - t0 - b0;
      nearly(angleAt(P.A, P.B, P.C), ans, "∠BAC の検算", 1e-6);
      return num({
        q: `直線 ST は点 A で円に接しています。$\\angle TAB=${t0}^{\\circ}$、$\\angle ABC=${b0}^{\\circ}$ のとき、$\\angle BAC=x$ を求めなさい。`,
        fig: geoFigure({ ...base, angleMarks: [{ at: "A", between: ["T", "B"], text: dg(t0), r: 18, textR: 34 }, { at: "B", between: ["A", "C"], text: dg(b0) }, { at: "A", between: ["B", "C"], text: "x", r: 26, textR: 44 }] }),
        ans,
        post: "$^{\\circ}$",
        // 反対側の弧と取りちがえる（∠ACB＝180°−t0 とする）／中心角と取りちがえる（∠ACB＝2t0 とする）と、残りの角の計算がずれる
        wrongs: [...(t0 - b0 > 0 ? [[t0 - b0, "MC-TANGENT-CHORD-SIDE"]] : []), ...(180 - 2 * t0 - b0 > 0 ? [[180 - 2 * t0 - b0, "MC-TANGENT-CHORD-DOUBLE"]] : []), [180 - t0, "MC-TANGENT-CHORD-SIDE"]],
        explain: `接弦定理より $\\angle ACB=\\angle TAB=${t0}^{\\circ}$。△ABC の内角の和から、$x=180^{\\circ}-${t0}^{\\circ}-${b0}^{\\circ}=${ans}^{\\circ}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 方べきの定理（図は、指定の長さになるように実際に作図する）
        if (lv === 1) {
          // 線分の長さの比が極端にならないようにする（図で点が円周に寄りすぎない）
          const [a, b, c] = until(() => [r.int(2, 9), r.int(2, 9), r.int(2, 9)], ([x, y, z]) => (x * y) % z === 0 && z !== x && z !== y && (x * y) / z !== z && Math.max(x, y, z, (x * y) / z) <= 3 * Math.min(x, y, z, (x * y) / z));
          const dd = (a * b) / c;
          // P を (d,0)、中心を原点に。弦 AB、CD を P を通るように作る
          const d = Math.max(Math.abs(a - b), Math.abs(c - dd)) / 2 + 1.2;
          const R = Math.sqrt(d * d + a * b);
          const u1 = Math.acos((a - b) / (2 * d));
          const u2 = -Math.acos((c - dd) / (2 * d));
          const Pp = [d, 0];
          const along = (th, tt) => [Pp[0] + tt * Math.cos(th), Pp[1] + tt * Math.sin(th)];
          const pts = { A: along(u1, -a), B: along(u1, b), C: along(u2, -c), D: along(u2, dd), P: Pp };
          for (const k of ["A", "B", "C", "D"]) nearly(Math.hypot(...pts[k]), R, "作図の検算（円周上）", 1e-9);
          return num({
            q: `円の2つの弦 AB、CD が点 P で交わっています。$PA=${a}$、$PB=${b}$、$PC=${c}$ のとき、PD の長さを求めなさい。`,
            fig: geoFigure({ points: pts, circles: [{ c: [0, 0], r: R }], segments: [["A", "B"], ["C", "D"]], labelDir: { P: [14, -2] } }),
            ans: dd,
            wrongs: [[Q(a * c, b), "MC-POWER-PAIRING"], [a + b - c, "MC-POWER-PAIRING"], [Q(b * c, a), "MC-POWER-PAIRING"]],
            explain: `方べきの定理 $PA\\cdot PB=PC\\cdot PD$ より、$${a}\\times ${b}=${c}\\times PD$。$PD=\\dfrac{${a * b}}{${c}}=${dd}$。`,
          });
        }
        if (lv === 2) {
          // P から引いた2本の直線：P−A−B、P−C−D（A, C が P に近い）
          const [a, x, c] = until(() => [r.int(2, 8), r.int(2, 9), r.int(2, 8)], ([p, q, z]) => (p * (p + q)) % z === 0 && z !== p && (p * (p + q)) / z - z >= 2 && (p * (p + q)) / z <= 16);
          const pd = (a * (a + x)) / c;
          const cd = pd - c;
          const d = Math.max(a + x / 2, (c + pd) / 2) + 0.9;
          const R = Math.sqrt(d * d - a * (a + x));
          const Pp = [d, 0];
          const u1 = Math.PI - Math.acos(((2 * a + x) / 2) / d);
          const u2 = Math.PI + Math.acos(((c + pd) / 2) / d);
          const along = (th, tt) => [Pp[0] + tt * Math.cos(th), Pp[1] + tt * Math.sin(th)];
          const pts = { A: along(u1, a), B: along(u1, a + x), C: along(u2, c), D: along(u2, pd), P: Pp };
          for (const k of ["A", "B", "C", "D"]) nearly(Math.hypot(...pts[k]), R, "作図の検算（円周上）", 1e-9);
          return num({
            q: `円の外の点 P から2本の直線を引き、1本は円と A、B で、もう1本は C、D で交わっています（A、C が P に近い点）。$PA=${a}$、$AB=${x}$、$PC=${c}$ のとき、CD の長さを求めなさい。`,
            fig: geoFigure({ points: pts, circles: [{ c: [0, 0], r: R }], segments: [["P", "B"], ["P", "D"]], labelDir: { P: [14, -2] } }),
            ans: cd,
            wrongs: [[Q(a * x, c), "MC-POWER-SEGMENT"], [pd, "MC-POWER-SEGMENT"]],
            explain: `方べきの定理 $PA\\cdot PB=PC\\cdot PD$。$PB=${a}+${x}=${a + x}$ なので $${a}\\times ${a + x}=${c}\\times PD$、$PD=${pd}$。よって $CD=PD-PC=${pd}-${c}=${cd}$。（$PA\\cdot AB$ ではなく、P から測った長さどうしをかけます）`,
          });
        }
        // 接線：PT² = PA·PB
        const [a, x] = until(() => [r.int(1, 9), r.int(2, 16)], ([p, q]) => Number.isInteger(Math.sqrt(p * (p + q))) && q !== p);
        const pt = Math.sqrt(a * (a + x));
        const d = a + x / 2 + 1.1;
        const R = Math.sqrt(d * d - pt * pt);
        const Pp = [d, 0];
        const u1 = Math.PI - Math.acos((a + x / 2) / d);
        const along = (th, tt) => [Pp[0] + tt * Math.cos(th), Pp[1] + tt * Math.sin(th)];
        // 接点：中心 O、P、T が直角三角形（OT ⟂ PT）
        const angT = Math.acos(R / d);
        const T = [R * Math.cos(-angT), R * Math.sin(-angT)];
        nearly(dist(Pp, T), pt, "接線の長さの検算", 1e-9);
        const pts = { A: along(u1, a), B: along(u1, a + x), P: Pp, T };
        nearly(Math.hypot(...pts.A), R, "作図の検算", 1e-9);
        const askPT = r.chance(0.5);
        if (askPT) {
          return num({
            q: `円の外の点 P から円に接線 PT を引きます（T は接点）。また、P を通る直線が円と A、B で交わっています（A が P に近い点）。$PA=${a}$、$AB=${x}$ のとき、PT の長さを求めなさい。`,
            fig: geoFigure({ points: pts, circles: [{ c: [0, 0], r: R }], segments: [["P", "B"], ["P", "T"]], labelDir: { P: [14, -2], T: [0, 16] } }),
            ans: pt,
            wrongs: [[a * (a + x), "MC-POWER-TANGENT"], [Math.sqrt(a * x) === Math.round(Math.sqrt(a * x)) ? Math.sqrt(a * x) : a * x, "MC-POWER-SEGMENT"], [Q(a + a + x, 2), "MC-POWER-TANGENT"]],
            explain: `接線についての方べきの定理 $PT^2=PA\\cdot PB$。$PB=${a + x}$ なので $PT^2=${a}\\times ${a + x}=${a * (a + x)}$、$PT=${pt}$。`,
          });
        }
        return num({
          q: `円の外の点 P から円に接線 PT を引きます（T は接点）。また、P を通る直線が円と A、B で交わっています（A が P に近い点）。$PT=${pt}$、$PA=${a}$ のとき、AB の長さを求めなさい。`,
          fig: geoFigure({ points: pts, circles: [{ c: [0, 0], r: R }], segments: [["P", "B"], ["P", "T"]], labelDir: { P: [14, -2], T: [0, 16] } }),
          ans: x,
          wrongs: [[a + x, "MC-POWER-SEGMENT"], [Q(pt, a), "MC-POWER-TANGENT"]],
          explain: `$PT^2=PA\\cdot PB$ より $${pt}^2=${a}\\times PB$、$PB=${a + x}$。よって $AB=PB-PA=${a + x}-${a}=${x}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 多面体（オイラーの多面体定理）・空間の直線の位置関係 ─────
  polyhedron: [
    t("num", (r, lv) => {
      const REG = [
        { name: "正四面体", F: 4, k: 3, m: 3, shape: "正三角形" },
        { name: "正六面体", F: 6, k: 4, m: 3, shape: "正方形" },
        { name: "正八面体", F: 8, k: 3, m: 4, shape: "正三角形" },
        { name: "正十二面体", F: 12, k: 5, m: 3, shape: "正五角形" },
        { name: "正二十面体", F: 20, k: 3, m: 5, shape: "正三角形" },
      ];
      const euler = (V, E, F) => assert(V - E + F === 2, "オイラーの多面体定理の検算");
      if (lv === 1) {
        const p = r.pick(REG);
        const E = (p.F * p.k) / 2;
        const V = (p.F * p.k) / p.m;
        euler(V, E, p.F);
        const askE = r.chance(0.5);
        return num({
          q: `${p.name}は、$${p.F}$ 個の合同な${p.shape}の面でできていて、1つの頂点には $${p.m}$ つの面が集まっています。${askE ? "辺" : "頂点"}の数を求めなさい。`,
          ans: askE ? E : V,
          wrongs: askE ? [[p.F * p.k, "MC-POLY-EDGE-DOUBLE"], [V, "MC-POLY-VERTEX-SHARED"]] : [[p.F * p.k, "MC-POLY-VERTEX-SHARED"], [E, "MC-POLY-VERTEX-SHARED"]],
          explain: askE
            ? `面ごとに辺を数えると $${p.F}\\times ${p.k}=${p.F * p.k}$。どの辺も2つの面で共有されているので、辺の数は $${p.F * p.k}\\div 2=${E}$。`
            : `面ごとに頂点を数えると $${p.F}\\times ${p.k}=${p.F * p.k}$。どの頂点も $${p.m}$ つの面で共有されているので、頂点の数は $${p.F * p.k}\\div ${p.m}=${V}$。（オイラーの多面体定理 $v-e+f=2$ でも確かめられます）`,
        });
      }
      if (lv === 2) {
        const n = r.int(5, 12);
        const fam = r.pick([
          { name: `${n}角柱`, V: 2 * n, E: 3 * n, F: n + 2 },
          { name: `${n}角錐`, V: n + 1, E: 2 * n, F: n + 1 },
        ]);
        euler(fam.V, fam.E, fam.F);
        if (r.chance(0.5)) {
          // オイラーの多面体定理で、残りの1つを求める
          const which = r.pick(["V", "E", "F"]);
          const lab = { V: "頂点", E: "辺", F: "面" };
          const given = ["V", "E", "F"].filter((k) => k !== which);
          const ans = fam[which];
          const wrong = which === "V" ? fam.E + fam.F + 2 : which === "E" ? fam.V + fam.F + 2 : fam.E - fam.V - 2;
          return num({
            q: `へこみのない多面体で、${given.map((k) => `${lab[k]}の数が $${fam[k]}$`).join("、")}です。${lab[which]}の数を求めなさい。`,
            ans,
            wrongs: [[wrong, "MC-EULER-SIGN"], [which === "E" ? fam.V + fam.F : which === "V" ? fam.E - fam.F : fam.E - fam.V, "MC-EULER-SIGN"]],
            explain: `オイラーの多面体定理（頂点）$-$（辺）$+$（面）$=2$ を使います。${which === "V" ? `頂点 $=2+${fam.E}-${fam.F}=${ans}$` : which === "E" ? `辺 $=${fam.V}+${fam.F}-2=${ans}$` : `面 $=2-${fam.V}+${fam.E}=${ans}$`}。（例えば${fam.name}がこの数になっています）`,
          });
        }
        const which = r.pick(["V", "E", "F"]);
        const lab = { V: "頂点", E: "辺", F: "面" };
        return num({
          q: `${fam.name}の${lab[which]}の数を求めなさい。`,
          ans: fam[which],
          wrongs: which === "E" ? [[fam.name.includes("柱") ? 2 * n : n, "MC-POLY-EDGE-DOUBLE"], [fam.E * 2, "MC-POLY-EDGE-DOUBLE"]] : which === "V" ? [[fam.name.includes("柱") ? n : n + 2, "MC-POLY-VERTEX-SHARED"]] : [[n, "MC-POLY-VERTEX-SHARED"], [fam.F + 1, "MC-SLIP"]],
          explain: fam.name.includes("柱")
            ? `${n}角柱は、上下の ${n}角形 2 つと、側面の長方形 $${n}$ 個でできています。頂点は $${n}\\times 2=${2 * n}$、辺は上下 $${n}\\times 2$ と側面 $${n}$ で $${3 * n}$、面は $${n}+2=${n + 2}$。（$${2 * n}-${3 * n}+${n + 2}=2$）`
            : `${n}角錐は、底面の ${n}角形と、側面の三角形 $${n}$ 個でできています。頂点は $${n}+1=${n + 1}$、辺は底面 $${n}$ と側面 $${n}$ で $${2 * n}$、面は $${n}+1=${n + 1}$。（$${n + 1}-${2 * n}+${n + 1}=2$）`,
        });
      }
      // 切頂（すべての頂点を切り落とす）
      const p = r.pick(REG);
      const V = (p.F * p.k) / p.m;
      const E = (p.F * p.k) / 2;
      const V2 = p.m * V;
      const E2 = E + p.m * V;
      const F2 = p.F + V;
      euler(V2, E2, F2);
      // 独立な検算：面の辺の数の合計 ÷ 2 ＝ 辺の数（もとの面は辺が2倍の多角形、新しい面は m 角形）
      assert((p.F * 2 * p.k + V * p.m) / 2 === E2, "切頂の辺の数の検算");
      const which = r.pick(["V", "E", "F"]);
      const lab = { V: "頂点", E: "辺", F: "面" };
      const ans = { V: V2, E: E2, F: F2 }[which];
      return num({
        q: `${p.name}（頂点 $${V}$、辺 $${E}$、面 $${p.F}$）のすべての頂点を、その頂点に集まる辺の途中を通る平面で小さく切り落として、新しい立体を作ります（切り口どうしは重なりません）。できた立体の${lab[which]}の数を求めなさい。`,
        ans,
        wrongs: which === "V" ? [[V, "MC-POLY-VERTEX-SHARED"], [V + p.m, "MC-POLY-VERTEX-SHARED"], [2 * V, "MC-POLY-VERTEX-SHARED"]] : which === "E" ? [[E, "MC-POLY-EDGE-DOUBLE"], [E + V, "MC-POLY-EDGE-DOUBLE"], [2 * E, "MC-POLY-EDGE-DOUBLE"]] : [[p.F, "MC-POLY-VERTEX-SHARED"], [p.F + E, "MC-POLY-VERTEX-SHARED"]],
        explain: `1つの頂点を切り落とすと、そこに $${p.m}$ 角形の切り口（新しい面）ができ、頂点が $${p.m}$ 個に増えます。面：$${p.F}+${V}=${F2}$。頂点：$${p.m}\\times ${V}=${V2}$。辺：もとの $${E}$ 本に、切り口の辺 $${p.m}\\times ${V}=${p.m * V}$ 本が加わって $${E2}$。（$${V2}-${E2}+${F2}=2$ で確かめられます）`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 立方体 ABCD-EFGH（上の面 ABCD、下の面 EFGH、AE・BF・CG・DH が縦の辺）
        const V3 = { A: [0, 0, 1], B: [1, 0, 1], C: [1, 1, 1], D: [0, 1, 1], E: [0, 0, 0], F: [1, 0, 0], G: [1, 1, 0], H: [0, 1, 0] };
        const EDGES = ["AB", "BC", "CD", "DA", "EF", "FG", "GH", "HE", "AE", "BF", "CG", "DH"];
        const dir = (s2) => V3[s2[1]].map((v, i) => v - V3[s2[0]][i]);
        const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
        const isZero = (u) => u.every((x) => Math.abs(x) < 1e-12);
        /** 2本の直線（線分 s1, s2 を延ばしたもの）の位置関係 */
        const rel = (s1, s2) => {
          const d1 = dir(s1);
          const d2 = dir(s2);
          const w = V3[s2[0]].map((v, i) => v - V3[s1[0]][i]);
          if (isZero(cross(d1, d2))) return isZero(cross(d1, w)) ? "same" : "parallel";
          return Math.abs(dot3(w, cross(d1, d2))) < 1e-12 ? "intersect" : "skew";
        };
        const perp = (s1, s2) => Math.abs(dot3(dir(s1), dir(s2))) < 1e-12;
        // 図（斜めから見た立方体。見えない頂点 H につながる辺は点線）
        const proj = (p3) => [p3[0] + 0.48 * p3[1], p3[2] + 0.34 * p3[1]];
        const pts = Object.fromEntries(Object.entries(V3).map(([k, v]) => [k, proj(v)]));
        const hidden = new Set(["GH", "HE", "DH"]);
        let ref;
        let refLabel;
        let want;
        let qText;
        if (lv === 1) {
          ref = r.pick(EDGES);
          refLabel = `辺 ${ref}`;
          want = (e) => rel(ref, e) === "skew";
          qText = `立方体 ABCD-EFGH で、辺 ${ref} とねじれの位置にある辺はどれですか。`;
        } else if (lv === 2) {
          ref = r.pick(["AC", "BD", "EG", "FH", "AF", "BE", "CH", "DG", "AH", "DE", "BG", "CF"]);
          refLabel = `線分 ${ref}`;
          want = (e) => rel(ref, e) === "skew";
          qText = `立方体 ABCD-EFGH で、面の対角線 ${ref} とねじれの位置にある辺はどれですか。`;
        } else {
          ref = r.pick(EDGES);
          refLabel = `辺 ${ref}`;
          want = (e) => rel(ref, e) === "skew" && perp(ref, e);
          qText = `立方体 ABCD-EFGH で、辺 ${ref} と垂直で、しかもねじれの位置にある辺はどれですか。`;
        }
        const others = EDGES.filter((e) => e !== ref);
        const good = others.filter(want);
        assert(good.length >= 1, "正解の辺がある");
        const correct = r.pick(good);
        const bad = others.filter((e) => !want(e) && rel(ref, e) !== "same");
        const mcOf = (e) => (rel(ref, e) === "parallel" ? "MC-SKEW-PARALLEL" : rel(ref, e) === "intersect" ? "MC-SKEW-INTERSECT" : "MC-PERP-SKEW-MISS");
        const wrongPool = r.shuffle(bad);
        // 平行・交わる（・垂直でないねじれ）を少なくとも1つずつ混ぜる
        const picks = [];
        for (const kind of ["parallel", "intersect", "skew"]) {
          const c = wrongPool.find((e) => rel(ref, e) === kind && !picks.includes(e));
          if (c) picks.push(c);
        }
        for (const e of wrongPool) if (picks.length < 5 && !picks.includes(e)) picks.push(e);
        const segs = EDGES.map((e) => [e[0], e[1], hidden.has(e) ? { dash: "4 3" } : {}]);
        if (lv === 2) segs.push([ref[0], ref[1], { color: "#c0392b" }]);
        return choice({
          q: qText,
          fig: geoFigure({ points: pts, segments: segs, labelDir: { A: [-12, -4], B: [6, 10], C: [10, -4], D: [-8, -8], E: [-12, 6], F: [10, 8], G: [12, 4], H: [-10, -8] }, width: 220 }),
          correct: `辺 ${correct}`,
          wrongs: picks.map((e) => [`辺 ${e}`, mcOf(e)]),
          explain: `空間の2直線は「交わる」「平行」「ねじれの位置（平行でなく交わらない）」のどれか。${refLabel} と、${bad.filter((e) => rel(ref, e) === "parallel").map((e) => `辺 ${e}`).join("・") || "（なし）"} は平行、${bad.filter((e) => rel(ref, e) === "intersect").map((e) => `辺 ${e}`).join("・")} は交わります。${lv === 3 ? `ねじれの位置にある辺のうち、${refLabel} と垂直なのは ${good.map((e) => `辺 ${e}`).join("・")}。` : `ねじれの位置にあるのは ${good.map((e) => `辺 ${e}`).join("・")}。`}`,
        });
      },
      { id: "b" },
    ),
  ],
};

export { texTable, tx, triFromAngles, triFromSides, circumcenter, incenter, intersect, angleAt, dist, simpleRatio, ratioFields };
