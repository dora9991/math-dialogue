// ============================================================
// data-05.js — データの活用 第5時「「ある値未満」の割合を、累積度数・累積相対度数で調べよう」
//   ikkan の演習プリント（data-05.dr.1〜6）・小テスト（data-05.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「05」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：05d01a ＝ data-05.dr.1 の ①（人数）
//   度数分布表は図にできないので、問題文の中で「30回以上35回未満が 2人、…」と文章で言う（stats.js の freqSentence）。
//   度数・累積度数・累積相対度数・中央値の階級は、すべて stats.js で計算する（手で書かない）。割合は、ちょうど 5 の境目になる組を使わない。
//   累積相対度数のグラフ（05d05）は、点の値を「10分未満が 0.10、20分未満が 0.30、…」と文章で言い切る。
// ============================================================
import { t, pick, choices4, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, classes, cumulative, relFreq, medianClass, clsLabel, freqSentence } from "../stats.js";

const unit = unitFor("data");

// ── 度数分布表の場面 ─────────────────────────────────────
const CTX = [
  { topic: "反復横とびの記録", u: "回", lo: 30, w: 5 },
  { topic: "1日の睡眠時間", u: "時間", lo: 5, w: 1 },
  { topic: "1週間の読書時間", u: "時間", lo: 0, w: 2 },
  { topic: "通学時間", u: "分", lo: 0, w: 10 },
  { topic: "立ち幅とびの記録", u: "cm", lo: 120, w: 20 },
  { topic: "ソフトボール投げの記録", u: "m", lo: 10, w: 5 },
  { topic: "握力の記録", u: "kg", lo: 15, w: 5 },
  { topic: "テストの得点", u: "点", lo: 40, w: 10 },
];

/** 合計 n 人を k 個の階級に分ける（山が1つ。どの階級も 1 人以上）。うまくいかなければ null */
function genFreq(r, n, k) {
  for (let tr = 0; tr < 60; tr++) {
    const p = r(1, k - 2);
    const w = Array.from({ length: k }, (_, i) => (Math.pow(1.7, -Math.abs(i - p)) * (70 + r(0, 60))) / 100);
    const tot = sum(w);
    const f = w.map((x) => Math.max(1, Math.round((n * x) / tot)));
    const i = f.indexOf(Math.max(...f));
    f[i] += n - sum(f);
    if (f.every((x) => x >= 1) && f[i] === Math.max(...f)) return f;
  }
  return null;
}

/** 度数分布表（場面・人数・階級・度数・累積度数） */
function tbl(r, ns, kk = [5, 6]) {
  const ctx = pick(r, CTX), n = pick(r, ns), k = pick(r, kk);
  const f = genFreq(r, n, k);
  if (!f) return null;
  return { ctx, n, k, f, cls: classes(ctx.lo, ctx.w, k), cu: cumulative(f) };
}
/** 度数分布表を文章にした、問題文の頭 */
const intro = (T) => `${T.n}人の、${T.ctx.topic}（${T.ctx.u}）を度数分布表にまとめたところ、${freqSentence(T.cls, T.f, T.ctx.u)}であった。`;
const under = (T, j) => `${T.cls[j].hi}${T.ctx.u}未満`;
const lab = (T, i) => clsLabel(T.cls[i], T.ctx.u);
/** 割合が整数の % にぴったりなるか（ならないときは、問題文に四捨五入のことわりを書く） */
const isExact = (c, n) => Number.isInteger(round((100 * c) / n, 6));
const NOTE = "（累積相対度数は、小数第3位を四捨五入して求め、%で答える）";

// ── 共通の型（演習・小テストで、人数や場面をかえて使う） ──────────────
/** ○○未満の人は、何人か（累積度数） */
const mkUnderNum = (ns) => (r) => {
  const T = tbl(r, ns); if (!T) return { skip: true };
  const j = r(1, T.k - 2), c = T.cu[j];
  return {
    q: `${intro(T)}${under(T, j)}の人は、何人か。`,
    ans: c,
    unit: "人",
    hint: "「〜未満」の人数は、いちばん小さい階級から順に、その階級まで度数を足していけばわかる。",
    steps: [`${under(T, j)}の人数 ＝ その階級までの度数の合計（累積度数）`, `${T.f.slice(0, j + 1).join(" + ")} ＝ ${c}（人）`],
  };
};
/** ○○未満の人は、全体の何%か（累積相対度数） */
const mkUnderPct = (ns) => (r) => {
  const T = tbl(r, ns); if (!T) return { skip: true };
  const j = r(1, T.k - 2), c = T.cu[j], rel = relFreq(c, T.n, 2);
  if (rel == null) return { skip: true };
  const ans = Math.round(rel * 100), ex = isExact(c, T.n);
  return {
    q: `${intro(T)}${under(T, j)}の人は、全体の何%か。${ex ? "" : NOTE}`,
    ans,
    unit: "%",
    hint: "割合は、（その人数）÷（全体の人数）。「〜未満」の人数は、いちばん小さい階級から順に足して求める。",
    steps: [`累積度数 ＝ ${T.f.slice(0, j + 1).join(" + ")} ＝ ${c}（人）`, `累積相対度数 ＝ ${c} ÷ ${T.n} ${ex ? "＝" : "≒"} ${rel.toFixed(2)}`, `${under(T, j)}の人は、全体の ${ans}%。`],
  };
};
/** ○○以上の人は、全体の何%か（1 − 未満の累積相対度数） */
const mkOverPct = (ns) => (r) => {
  const T = tbl(r, ns); if (!T) return { skip: true };
  const j = r(1, T.k - 2), c = T.cu[j], rel = relFreq(c, T.n, 2);
  if (rel == null) return { skip: true };
  const ex = isExact(c, T.n), ans = 100 - Math.round(rel * 100), x = `${T.cls[j].hi}${T.ctx.u}`;
  return {
    q: `${intro(T)}${x}以上の人は、全体の何%か。${ex ? "" : NOTE}`,
    ans,
    unit: "%",
    hint: "「〜以上」と「〜未満」は、たして全体（100%）になる。先に、「〜未満」の割合を求めよう。",
    steps: [`「${x}以上」の割合 ＝ 1 − 「${x}未満」の累積相対度数`, `${x}未満の累積相対度数 ＝ ${c} ÷ ${T.n} ${ex ? "＝" : "≒"} ${rel.toFixed(2)}`, `1 − ${rel.toFixed(2)} ＝ ${(1 - rel).toFixed(2)}　→　${ans}%`],
  };
};
/** 中央値は、どの階級にふくまれるか（4択） */
const mkMedClass = (ns) => (r) => {
  const T = tbl(r, ns); if (!T) return { skip: true };
  const ans = medianClass(T.f);
  if (ans == null || ans < 0) return { skip: true };
  const mx = T.f.indexOf(Math.max(...T.f)), mid = Math.floor((T.k - 1) / 2);
  const wrongs = [mx, mid, ans - 1, ans + 1].filter((i) => i >= 0 && i < T.k && i !== ans).map((i) => lab(T, i));
  const m = (T.n + 1) / 2;
  return {
    q: `${intro(T)}中央値は、どの階級にふくまれるか。`,
    ans: lab(T, ans),
    choices: choices4(r, lab(T, ans), wrongs, (i) => lab(T, i % T.k)),
    hint: "中央値は、小さいほうから数えて、まん中にくる人の値。累積度数を、小さい階級から順に見ていこう。",
    steps: T.n % 2
      ? [`${T.n}人の中央値は、小さいほうから ${m} 番目の値。`, `累積度数は ${T.cu.join("、")}。はじめて ${m} 以上になるのは、${lab(T, ans)}の階級。`]
      : [`${T.n}人の中央値は、${T.n / 2}番目と ${T.n / 2 + 1}番目の値の平均。`, `累積度数が ${T.n / 2} 以上になるのも、${T.n / 2 + 1} 以上になるのも、${lab(T, ans)}の階級。`],
  };
};

// ── 累積相対度数の表（5% きざみ）：入試レベル ──────────────────────
const OG = [
  { topic: "通学時間", u: "分", w: 10 },
  { topic: "1週間の読書時間", u: "時間", w: 2 },
  { topic: "1週間の運動時間", u: "分", w: 20 },
  { topic: "1日のスマートフォンの使用時間", u: "時間", w: 1 },
];
/** 累積相対度数（5% きざみで増える k−1 個＋100%）から、度数をもどす。n は 20 の倍数なので、人数は整数になる */
function ogive(r, ns) {
  const g = pick(r, OG), n = pick(r, ns), k = pick(r, [5, 6]);
  const set = new Set();
  while (set.size < k - 1) set.add(r(1, 19));
  const v = [...set].sort((a, b) => a - b).map((x) => x * 5);
  v.push(100);
  const cu = v.map((p) => (n * p) / 100), f = cu.map((c, i) => c - (i ? cu[i - 1] : 0));
  return { g, n, k, v, cu, f, cls: classes(0, g.w, k) };
}
const relS = (p) => (p / 100).toFixed(2);
/** 「10分未満が 0.10、20分未満が 0.30、…」 */
const ogSentence = (O) => O.cls.map((c, i) => `${c.hi}${O.g.u}未満が ${relS(O.v[i])}`).join("、");
const ogIntro = (O) => `ある学年${O.n}人の、${O.g.topic}（${O.g.u}）について、累積相対度数を調べたところ、${ogSentence(O)}であった。`;

/** 累積相対度数の一部がわからない表（ア）：入試レベル。a＝ア、b＝ある階級の人数 */
function hidden(r, ns, which) {
  const g = pick(r, [
    { topic: "ソフトボール投げの記録", u: "m", lo: 10, w: 5 },
    { topic: "立ち幅とびの記録", u: "cm", lo: 120, w: 20 },
    { topic: "握力の記録", u: "kg", lo: 15, w: 5 },
    { topic: "テストの得点", u: "点", lo: 40, w: 10 },
  ]);
  const n = pick(r, ns), k = pick(r, [5, 6]);
  const set = new Set();
  while (set.size < k - 1) set.add(r(1, 19));
  const v = [...set].sort((a, b) => a - b).map((x) => x * 5);
  v.push(100);
  const cls = classes(g.lo, g.w, k), cu = v.map((p) => (n * p) / 100);
  const j = r(1, k - 3);   // ア ＝ j 番目の階級の累積相対度数。j+1 番目の階級の人数が、わかっている
  const m = cu[j + 1] - cu[j];
  const given = cls.map((c, i) => `${clsLabel(c, g.u)}の階級で ${i === j ? "ア" : relS(v[i])}`).join("、");
  const ca = `${clsLabel(cls[j + 1], g.u)}の階級の人は ${m}人である`;
  const base = `${n}人の、${g.topic}（${g.u}）について、累積相対度数を調べたところ、${given}であった。${ca}。`;
  const s1 = `${clsLabel(cls[j + 1], g.u)}の階級の累積度数は ${n} × ${relS(v[j + 1])} ＝ ${cu[j + 1]}（人）`;
  const s2 = `${clsLabel(cls[j], g.u)}の階級の累積度数は ${cu[j + 1]} − ${m} ＝ ${cu[j]}（人）`;
  if (which === "a") {
    return {
      q: `${base}ア にあてはまる数は？`,
      ans: round(v[j] / 100, 2),
      hint: "累積相対度数 ＝ 累積度数 ÷ 度数の合計。わかっている人数から、ア の階級までの累積度数を求めよう。",
      steps: [s1, s2, `ア ＝ ${cu[j]} ÷ ${n} ＝ ${relS(v[j])}`],
    };
  }
  const prev = cu[j - 1], d = cu[j] - prev;
  return {
    q: `${base}${clsLabel(cls[j], g.u)}の階級の人は、何人か。`,
    ans: d,
    unit: "人",
    hint: "ア の階級までの累積度数から、ひとつ前の階級までの累積度数をひくと、その階級だけの人数になる。",
    steps: [s1, s2, `${clsLabel(cls[j - 1], g.u)}の階級の累積度数は ${n} × ${relS(v[j - 1])} ＝ ${prev}（人）`, `${cu[j]} − ${prev} ＝ ${d}（人）`],
  };
}

export const UNITS = [
  unit("05", {
    name: "累積度数・累積相対度数（「ある値未満」の割合）",
    desc: "累積度数・累積相対度数を求めて、「〜未満」「〜以上」の人数や割合、中央値のある階級を読み取る",
    prereqs: ["J1-dk04", "J1-d3"],
    points: [
      "累積度数は、いちばん小さい階級から、その階級までの度数を足し合わせたもの。「〜未満」の人数は、累積度数で読み取れる。",
      "累積相対度数 ＝ 累積度数 ÷ 度数の合計。「〜未満」の割合がわかる。「〜以上」の割合は、1 − （「〜未満」の累積相対度数）で求める。",
      "データが $n$ 個で、$n$ が奇数のとき、中央値は小さいほうから $\\frac{n+1}{2}$ 番目の値。累積度数がはじめてその番号以上になる階級に、中央値がふくまれる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 05d01a ① 45回未満の人は、何人か
        t("05d01a", mkUnderNum([20, 25, 30, 40, 50])),
        // 05d01b ① 45回未満の人は、全体の何%か
        t("05d01b", mkUnderPct([20, 25, 40, 50])),
        // 05d01c ② 中央値は、どの階級にふくまれるか
        t("05d01c", mkMedClass([21, 23, 25, 27, 29, 31, 33, 35])),
        // 05d01d ③ 45回以上の人は、全体の何%か
        t("05d01d", mkOverPct([20, 25, 40, 50])),
        // 05q01 表を完成させる：ある階級の累積度数・累積相対度数
        t("05q01", (r) => {
          const T = tbl(r, [20, 25, 30, 40, 50]); if (!T) return { skip: true };
          const j = r(1, T.k - 2), c = T.cu[j], cnt = pick(r, [true, false]);
          if (cnt) {
            return {
              q: `${intro(T)}累積度数の表をつくる。${lab(T, j)}の階級の、累積度数は？`,
              ans: c,
              unit: "人",
              hint: "累積度数は、いちばん小さい階級から、その階級までの度数の合計。",
              steps: [`${T.f.slice(0, j + 1).join(" + ")} ＝ ${c}`, `${lab(T, j)}の階級の累積度数は ${c}（人）。`],
            };
          }
          const rel = relFreq(c, T.n, 2);
          if (rel == null) return { skip: true };
          return {
            q: `${intro(T)}累積相対度数の表をつくる。${lab(T, j)}の階級の、累積相対度数は？（小数第3位を四捨五入して、小数第2位まで）`,
            ans: rel,
            hint: "累積相対度数 ＝ 累積度数 ÷ 度数の合計。まず、その階級までの度数を足して、累積度数を求めよう。",
            steps: [`累積度数 ＝ ${T.f.slice(0, j + 1).join(" + ")} ＝ ${c}`, `累積相対度数 ＝ ${c} ÷ ${T.n} ${isExact(c, T.n) ? "＝" : "≒"} ${rel.toFixed(2)}`],
          };
        }),
        // 05q02a 6時間未満の人は、何人か
        t("05q02a", mkUnderNum([20, 25, 30, 40, 50])),
        // 05q02b 6時間未満の人は、全体の何%か
        t("05q02b", mkUnderPct([20, 25, 50, 40])),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 05d02a ① 7時間未満は、全体の何%か（累積度数÷32 を小数第3位で四捨五入）
        t("05d02a", mkUnderPct([30, 32, 36, 45, 48, 60])),
        // 05d02b ② 8時間未満は、何人か
        t("05d02b", mkUnderNum([30, 32, 36, 45, 48, 60])),
        // 05d02c ③ 8時間以上は、全体の何%か
        t("05d02c", mkOverPct([30, 32, 36, 45, 48, 60])),
        // 05q03 中央値は、どの階級にふくまれるか（人数が偶数のこともある）
        t("05q03", mkMedClass([20, 21, 23, 24, 25, 27, 30, 31, 33, 35, 40])),
        // 05q04 8時間以上の人は、全体の何%か
        t("05q04", mkOverPct([20, 25, 30, 40, 50])),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 05d03 となり合う2つの階級の累積相対度数と、あとの階級の度数から、度数の合計
        t("05d03", (r) => {
          const N = pick(r, [20, 40, 60, 80, 100, 120, 200]), a = r(1, 12) * 5, d = r(2, 10) * 5, b = a + d;
          if (b > 95) return { skip: true };
          const m = (N * d) / 100;
          return {
            q: `ある度数分布表で、となり合う 2つの階級の、累積相対度数が、順に ${relS(a)}、${relS(b)} だった（どちらも、ちょうどの値）。あとの階級の度数が ${m}人のとき、度数の合計は何人か。`,
            ans: N,
            unit: "人",
            hint: "累積相対度数の差が、あとの階級だけの相対度数になる。相対度数 ＝ 度数 ÷ 度数の合計。",
            steps: [`あとの階級の相対度数は ${relS(b)} − ${relS(a)} ＝ ${relS(d)}`, `度数の合計を x 人とすると　x × ${relS(d)} ＝ ${m}`, `x ＝ ${m} ÷ ${relS(d)} ＝ ${N}（人）`],
          };
        }),
        // 05d04 A組・B組の、20分未満の人の割合をくらべる
        t("05d04", (r) => {
          const ctx = pick(r, [
            { what: "通学時間", u: "分", ths: [10, 15, 20, 30] },
            { what: "1週間の読書時間", u: "時間", ths: [2, 4, 6] },
            { what: "ソフトボール投げの記録", u: "m", ths: [15, 20, 25] },
            { what: "家庭学習の時間", u: "分", ths: [30, 45, 60] },
          ]);
          const th = pick(r, ctx.ths), names = pick(r, [["A組", "B組"], ["1組", "2組"], ["男子", "女子"]]);
          const sizes = [20, 25, 30, 40, 50, 60], n1 = pick(r, sizes), n2 = pick(r, sizes);
          // 割合がちょうどの % になる人数だけを選ぶ
          const okC = (n) => Array.from({ length: Math.floor(n * 0.8) - Math.ceil(n * 0.2) + 1 }, (_, i) => Math.ceil(n * 0.2) + i).filter((c) => (100 * c) % n === 0);
          const c1 = pick(r, okC(n1)), c2 = pick(r, okC(n2));
          const p1 = (100 * c1) / n1, p2 = (100 * c2) / n2;
          if (n1 === n2 || p1 === p2) return { skip: true };
          const big = p1 > p2 ? 0 : 1, nm = names[big], pm = Math.max(p1, p2);
          return {
            q: `${names[0]} ${n1}人のうち、${ctx.what}が ${th}${ctx.u}未満の人は ${c1}人。${names[1]} ${n2}人のうち、${th}${ctx.u}未満の人は ${c2}人である。${th}${ctx.u}未満の人の割合が大きいほうの、その割合は何%か。`,
            ans: pm,
            unit: "%",
            hint: "人数がちがうので、人数そのものではなく、割合（その人数 ÷ 全体の人数）でくらべる。",
            steps: [`${names[0]}　${c1} ÷ ${n1} ＝ ${(p1 / 100).toFixed(2)}`, `${names[1]}　${c2} ÷ ${n2} ＝ ${(p2 / 100).toFixed(2)}`, `割合が大きいのは ${nm}。その割合は ${pm}%。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 05d05a ① 30分未満の人は、何人か（累積相対度数のグラフ → 値を文章で）
        t("05d05a", (r) => {
          const O = ogive(r, [40, 60, 80, 100, 120, 200]), j = r(0, O.k - 2);
          return {
            q: `${ogIntro(O)}${O.cls[j].hi}${O.g.u}未満の人は、何人か。`,
            ans: O.cu[j],
            unit: "人",
            hint: "累積相対度数 ＝ 累積度数 ÷ 度数の合計。度数の合計にかければ、人数がわかる。",
            steps: [`${O.cls[j].hi}${O.g.u}未満の累積相対度数は ${relS(O.v[j])}`, `${O.n} × ${relS(O.v[j])} ＝ ${O.cu[j]}（人）`],
          };
        }),
        // 05d05b ② 中央値は、どの階級にふくまれるか
        t("05d05b", (r) => {
          const O = ogive(r, [40, 60, 80, 100, 120, 200]), ans = medianClass(O.f);
          if (ans == null || ans < 0) return { skip: true };
          const L = (i) => clsLabel(O.cls[i], O.g.u);
          const mx = O.f.indexOf(Math.max(...O.f));
          const wrongs = [mx, Math.floor((O.k - 1) / 2), ans - 1, ans + 1].filter((i) => i >= 0 && i < O.k && i !== ans).map(L);
          const m1 = O.n / 2;
          return {
            q: `${ogIntro(O)}中央値は、どの階級にふくまれるか。`,
            ans: L(ans),
            choices: choices4(r, L(ans), wrongs, (i) => L(i % O.k)),
            hint: "中央値は、小さいほうから数えたときのまん中の人の値。各階級までの人数を、累積相対度数から求めよう。",
            steps: [`${O.n}人の中央値は、${m1}番目と ${m1 + 1}番目の値の平均。`, `各階級までの人数は ${O.cls.map((c, i) => `${c.hi}${O.g.u}未満が ${O.cu[i]}人`).join("、")}。`, `${m1}番目も ${m1 + 1}番目も ${L(ans)}の階級に入る。`],
          };
        }),
        // 05d05c ③ 通学時間が長いほうから数えて 15%の人は、何分以上か
        t("05d05c", (r) => {
          const O = ogive(r, [40, 60, 80, 100, 120, 200]), j = r(0, O.k - 2), p = 100 - O.v[j], x = O.cls[j].hi;
          return {
            q: `${ogIntro(O)}${O.g.topic}が長いほうから数えて ${p}%の人は、何${O.g.u}以上か。`,
            ans: x,
            unit: O.g.u,
            hint: "「長いほうから」の割合は、全体から「短いほう」（〜未満）の割合をひいたもの。累積相対度数のどこと合うか、さがそう。",
            steps: [`長いほうから ${p}%　→　短いほうは 100 − ${p} ＝ ${O.v[j]}%`, `累積相対度数が ${relS(O.v[j])} なのは、${x}${O.g.u}未満。`, `長いほうから ${p}%の人は、${x}${O.g.u}以上。`],
          };
        }),
        // 05d06a ア にあてはまる数（60人、30m以上35m未満が15人）
        t("05d06a", (r) => hidden(r, [40, 60, 80, 100, 120], "a")),
        // 05d06b 25m以上30m未満の人数
        t("05d06b", (r) => hidden(r, [40, 60, 80, 100, 120], "b")),
        // 05q05a （チャレンジ）40人、30m以上35m未満が8人 → ア
        t("05q05a", (r) => hidden(r, [40, 60, 80, 100], "a")),
        // 05q05b （チャレンジ）25m以上30m未満の人数
        t("05q05b", (r) => hidden(r, [40, 60, 80, 100], "b")),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第5時は、演習プリント 6問・小テスト 5問のすべてを移した（グラフ・表は、値を文章で言い切った）
