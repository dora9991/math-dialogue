// ============================================================
// data-06.js — データの活用 第6時「どちらの作戦がよいか、調べる計画を立てて、データを整理しよう」
//   ikkan の演習プリント（data-06.dr.1〜8）・小テスト（data-06.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「06」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：06d03a ＝ data-06.dr.3 の「平均値のおよその値」
//   データ（平均値が整数や .5 になる組、最頻値が1つに決まる組）は、乱数でつくって、条件に合うものだけを使う。答えは stats.js で計算する。
//   度数分布表は、問題文の中で「20個以上30個未満が 3日、…」と文章で言う（freqSentence）。
//   記述（方法を書く・わけを書く）の問題は、「適切な方法・調べ方を選ぶ」4択に直した（06d05・06q03）。
// ============================================================
import { t, pick, choices4, shuffle, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, mean, median, modes, range, classes, cumulative, medianClass, roundHalf, isTie, pct, clsLabel, freqSentence, listData } from "../stats.js";

const unit = unitFor("data");

// ── データ（小さい順の整数の列）を条件つきでつくる ─────────────────────
/** n 個の整数データ（lo〜hi）を小さい順に。mean：0＝整数の平均値、1＝.5 まで、mode：最頻値が1つ（2回以上）、minRange：範囲の下限 */
function genData(r, n, lo, hi, o = {}) {
  for (let tr = 0; tr < 500; tr++) {
    const a = Array.from({ length: n }, () => r(lo, hi)).sort((x, y) => x - y);
    const m = mean(a);
    if (o.half ? !Number.isInteger(m * 2) : !Number.isInteger(m)) continue;
    if (o.mode) { const md = modes(a); if (md.length !== 1 || a.filter((x) => x === md[0]).length < 2) continue; }
    if (range(a) < (o.minRange || 0)) continue;
    return a;
  }
  return null;
}
const DC = [
  { topic: "漢字テスト（10点満点）の得点", u: "点", lo: 3, hi: 10 },
  { topic: "腕立てふせの回数", u: "回", lo: 3, hi: 20 },
  { topic: "ボール投げの記録", u: "m", lo: 10, hi: 30 },
  { topic: "1分間のなわとびの回数", u: "回", lo: 30, hi: 80 },
  { topic: "1日の読書時間", u: "分", lo: 5, hi: 45 },
];
const fmt = (x) => String(round(x, 2));

// ── 度数分布表 ──────────────────────────────────────────
const FT = [
  { who: "日", lead: (n) => `あるパン屋さんの、${n}日間の、1日に売れたパンの個数（個）を`, u: "個", lo: 20, w: 10 },
  { who: "人", lead: (n) => `${n}人の、通学時間（分）を`, u: "分", lo: 0, w: 10 },
  { who: "人", lead: (n) => `${n}人の、数学のテストの得点（点）を`, u: "点", lo: 30, w: 10 },
  { who: "人", lead: (n) => `${n}人の、1日の家庭学習の時間（分）を`, u: "分", lo: 0, w: 20 },
  { who: "人", lead: (n) => `${n}人の、ソフトボール投げの記録（m）を`, u: "m", lo: 10, w: 10 },
];
/** 合計 n を k 個の階級に分ける（山が1つ。どの階級も 1 以上）。うまくいかなければ null */
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
function tbl(r, ns, kk = [5, 5, 6]) {
  const ctx = pick(r, FT), n = pick(r, ns), k = pick(r, kk);
  const f = genFreq(r, n, k);
  if (!f) return null;
  return { ctx, n, k, f, cls: classes(ctx.lo, ctx.w, k) };
}
const intro = (T) => `${T.ctx.lead(T.n)}度数分布表にまとめたところ、${freqSentence(T.cls, T.f, T.ctx.u, T.ctx.who)}であった。`;
const lab = (T, i) => clsLabel(T.cls[i], T.ctx.u);

// ── 平均値・中央値・最頻値・範囲 ──────────────────────────────
const WORDS = ["平均値", "中央値", "最頻値", "範囲"];
/** 5数のうち w を求める問題（odd＝奇数個、half＝平均値が .5 までの偶数個） */
function stat(r, ns, ws, o) {
  const c = pick(r, DC), n = pick(r, ns), w = pick(r, ws);
  const a = genData(r, n, c.lo, c.hi, { half: o.half, mode: true, minRange: Math.max(4, Math.floor((c.hi - c.lo) / 3)) });
  if (!a) return { skip: true };
  const m = mean(a), md = median(a), mo = modes(a)[0], rg = range(a);
  const ans = { 平均値: m, 中央値: md, 最頻値: mo, 範囲: rg }[w];
  const mid = n % 2 ? `小さい順にならべて、まん中の ${(n + 1) / 2} 番目の値` : `小さい順にならべて、まん中の 2つ（${n / 2}番目と ${n / 2 + 1}番目）の平均`;
  const how = {
    平均値: [`平均値 ＝ 合計 ÷ 個数`, `(${a.join(" + ")}) ÷ ${n} ＝ ${sum(a)} ÷ ${n} ＝ ${fmt(m)}`],
    中央値: n % 2 ? [`中央値は、${mid}。`, `${(n + 1) / 2}番目は ${md} だから、中央値は ${md}。`] : [`中央値は、${mid}。`, `(${a[n / 2 - 1]} + ${a[n / 2]}) ÷ 2 ＝ ${fmt(md)}`],
    最頻値: [`最頻値は、いちばん多く出てくる値。`, `${mo} が ${a.filter((x) => x === mo).length}回で、いちばん多い。`],
    範囲: [`範囲 ＝ 最大値 − 最小値`, `${a[n - 1]} − ${a[0]} ＝ ${rg}`],
  }[w];
  const hint = { 平均値: "平均値は、データの合計を、データの個数でわる。", 中央値: n % 2 ? "データを大きさの順にならべたときの、まん中の値。何番目の値になるかな。" : "データを大きさの順にならべたときの、まん中の値。個数が偶数のときは、まん中の2つを考える。", 最頻値: "データの中で、いちばん多く出てくる値。", 範囲: "データの散らばりぐあいを表す。最大値と最小値に目をつけよう。" }[w];
  return {
    q: `${n}人の、${c.topic}は、小さい順に次のようになった。${listData(a)}　このデータの${w}は？`,
    ans: round(ans, 2),
    unit: c.u,
    hint,
    steps: how,
  };
}

/** 度数分布表の、中央値がふくまれる階級（4択） */
const medClass = (ns) => (r) => {
  const T = tbl(r, ns); if (!T) return { skip: true };
  const ans = medianClass(T.f);
  if (ans == null || ans < 0) return { skip: true };
  const cu = cumulative(T.f), mx = T.f.indexOf(Math.max(...T.f)), mid = Math.floor((T.k - 1) / 2);
  const wrongs = [mx, mid, ans - 1, ans + 1].filter((i) => i >= 0 && i < T.k && i !== ans).map((i) => lab(T, i));
  const m = (T.n + 1) / 2;
  return {
    q: `${intro(T)}中央値がふくまれる階級は、どれか。`,
    ans: lab(T, ans),
    choices: choices4(r, lab(T, ans), wrongs, (i) => lab(T, i % T.k)),
    hint: "中央値は、小さいほうから数えて、まん中にくる値。度数を小さい階級から順に足して、その番号に届く階級をさがそう。",
    steps: T.n % 2
      ? [`${T.n}${T.ctx.who}の中央値は、小さいほうから ${m} 番目の値。`, `累積度数は ${cu.join("、")}。はじめて ${m} 以上になるのは、${lab(T, ans)}の階級。`]
      : [`${T.n}${T.ctx.who}の中央値は、${T.n / 2}番目と ${T.n / 2 + 1}番目の値の平均。`, `累積度数が ${T.n / 2} 以上になるのも、${T.n / 2 + 1} 以上になるのも、${lab(T, ans)}の階級。`],
  };
};

// ── 方法を選ぶ（記述 → 4択） ─────────────────────────────
const GOOD_COMPARE = [
  "それぞれの平均値や中央値を求めて、くらべる",
  "それぞれをヒストグラムに表して、形をくらべる",
];

export const UNITS = [
  unit("06", {
    name: "代表値と範囲・データの整理の計画",
    desc: "平均値・中央値・最頻値・範囲、度数分布表から平均値のおよその値、データを使って判断する流れと、人数がちがうときの比べ方",
    prereqs: ["J1-dk05", "J1-d2"],
    points: [
      "平均値 ＝ データの合計 ÷ データの個数。中央値は、データを大きさの順にならべたまん中の値（偶数個なら、まん中の2つの平均）。最頻値は、いちばん多く出てくる値。この3つを代表値という。範囲 ＝ 最大値 − 最小値。",
      "度数分布表では、階級のまん中の値（階級値）を使って、平均値のおよその値を、（階級値 × 度数）の合計 ÷ 度数の合計 で求める。最頻値は、度数がいちばん多い階級の階級値。",
      "データを使って判断するときは、問題をはっきりさせる → 計画を立てる → データを整理する → 結論を出す、の順に進める。人数がちがうものをくらべるときは、人数ではなく、割合（相対度数）でくらべる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 06d01 9人の得点：平均値・中央値・最頻値・範囲
        t("06d01", (r) => stat(r, [7, 9, 11], WORDS, { half: false })),
        // 06d02 8人の記録：平均値・中央値・範囲（偶数個）
        t("06d02", (r) => stat(r, [6, 8, 10], ["平均値", "中央値", "範囲"], { half: true })),
        // 06q01 7人の腕立てふせ：平均値・中央値・範囲
        t("06q01", (r) => stat(r, [5, 7, 9], ["平均値", "中央値", "範囲"], { half: false })),
        // 06q02 6個のデータの中央値
        t("06q02", (r) => {
          const n = pick(r, [4, 6, 8]);
          const a = Array.from({ length: n }, () => r(1, 30)).sort((x, y) => x - y);
          if (new Set(a).size < n) return { skip: true };
          const md = median(a);
          return {
            q: `${n}個のデータ　${listData(a)}　の中央値は？`,
            ans: round(md, 2),
            hint: "個数が偶数のときの中央値は、まん中の2つの値を、どうすればよいかな。",
            steps: [`${n}個だから、まん中の 2つ（${n / 2}番目と ${n / 2 + 1}番目）の平均。`, `(${a[n / 2 - 1]} + ${a[n / 2]}) ÷ 2 ＝ ${fmt(md)}`],
          };
        }),
        // 06q04 データを使って判断するときの順に、ア〜エをならべる
        t("06q04", (r) => {
          const S = ["問題をはっきりさせる", "計画を立てる", "データを整理する", "結論を出す"], K = "アイウエ";
          const perm = shuffle(r, [0, 1, 2, 3]);   // perm[i]＝手順 i につける字の番号
          const list = [0, 1, 2, 3].map((p) => `${K[p]} ${S[perm.indexOf(p)]}`).join("　");
          const orderOf = (steps) => steps.map((s) => K[perm[s]]).join(" → ");
          const ans = orderOf([0, 1, 2, 3]);
          const wrongs = [orderOf([0, 2, 1, 3]), orderOf([1, 0, 2, 3]), orderOf([0, 1, 3, 2]), orderOf([3, 2, 1, 0])];
          return {
            q: `データを使って判断するときの順に、ア〜エをならべると、どうなるか。${list}`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "まず何をはっきりさせて、最後に何をするか。「整理」と「結論」は、どちらが先かな。",
            steps: ["データを使って判断する順は、問題をはっきりさせる → 計画を立てる → データを整理する → 結論を出す。", `${list}　だから、${ans}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 06d03a 階級値を使って、平均値のおよその値
        t("06d03a", (r) => {
          const T = tbl(r, [20, 25, 30, 40, 50]); if (!T) return { skip: true };
          const tot = sum(T.cls.map((c, i) => c.mid * T.f[i])), x = tot / T.n;
          if (isTie(x, 1)) return { skip: true };
          const ans = roundHalf(x, 1), ex = Number.isInteger(round(x * 10, 6));
          return {
            q: `${intro(T)}階級値を使って、平均値のおよその値を求めよう。（小数第2位を四捨五入して、小数第1位まで）`,
            ans,
            unit: T.ctx.u,
            hint: "階級のまん中の値（階級値）を、その階級のみんなの値と考える。（階級値 × 度数）を全部足して、度数の合計でわる。",
            steps: [`階級値は ${T.cls.map((c) => c.mid).join("、")}`, `(${T.cls.map((c, i) => `${c.mid}×${T.f[i]}`).join(" + ")}) ÷ ${T.n} ＝ ${tot} ÷ ${T.n} ${ex ? "＝" : "≒"} ${ans}（${T.ctx.u}）`],
          };
        }),
        // 06d03b 最頻値（階級値で）
        t("06d03b", (r) => {
          const T = tbl(r, [20, 25, 30, 40, 50]); if (!T) return { skip: true };
          const mx = Math.max(...T.f);
          if (T.f.filter((x) => x === mx).length !== 1) return { skip: true };
          const i = T.f.indexOf(mx);
          return {
            q: `${intro(T)}最頻値は、いくつか。（階級値で答える）`,
            ans: T.cls[i].mid,
            unit: T.ctx.u,
            hint: "度数がいちばん多い階級をさがす。度数分布表では、その階級のまん中の値を最頻値とする。",
            steps: [`度数がいちばん多いのは、${lab(T, i)}の階級（${mx}${T.ctx.who}）。`, `階級値は (${T.cls[i].lo} + ${T.cls[i].hi}) ÷ 2 ＝ ${T.cls[i].mid}。最頻値は ${T.cls[i].mid}${T.ctx.u}。`],
          };
        }),
        // 06d03c 中央値がふくまれる階級
        t("06d03c", medClass([20, 24, 25, 27, 30, 31, 35, 40, 45, 50])),
        // 06d04a 40個以上の日は何日か
        t("06d04a", (r) => {
          const T = tbl(r, [20, 25, 30, 40, 50, 60]); if (!T) return { skip: true };
          const j = r(1, T.k - 2), c = sum(T.f.slice(j)), x = `${T.cls[j].lo}${T.ctx.u}`;
          return {
            q: `${intro(T)}${x}以上の${T.ctx.who}は、何${T.ctx.who}か。`,
            ans: c,
            unit: T.ctx.who,
            hint: "「以上」は、その値をふくむ階級から上を、全部足す。",
            steps: [`${x}以上は、${lab(T, j)}の階級から上の階級。`, `${T.f.slice(j).join(" + ")} ＝ ${c}（${T.ctx.who}）`],
          };
        }),
        // 06d04b 40個以上の日は、全体の何%か
        t("06d04b", (r) => {
          const T = tbl(r, [20, 25, 30, 40, 50, 60]); if (!T) return { skip: true };
          const j = r(1, T.k - 2), c = sum(T.f.slice(j)), x = `${T.cls[j].lo}${T.ctx.u}`, ans = pct(c, T.n, 0);
          if (ans == null) return { skip: true };
          const ex = Number.isInteger(round((100 * c) / T.n, 6));
          return {
            q: `${intro(T)}${x}以上の${T.ctx.who}は、全体の何%か。（割合を小数第3位で四捨五入して、%で答える）`,
            ans,
            unit: "%",
            hint: "まず、「以上」の度数を足す。割合は、（その度数）÷（度数の合計）。",
            steps: [`${x}以上は ${T.f.slice(j).join(" + ")} ＝ ${c}（${T.ctx.who}）`, `${c} ÷ ${T.n} ${ex ? "＝" : "≒"} ${(ans / 100).toFixed(2)}　→　${ans}%`],
          };
        }),
        // 06q03 2つのクラスの記録をくらべて、どちらが…かを決めたい。何を調べればよいか
        t("06q03", (r) => {
          const s = pick(r, [
            { rec: "100m走の記録", goal: "どちらのクラスが速いか" },
            { rec: "ボール投げの記録", goal: "どちらのクラスが遠くまで投げられるか" },
            { rec: "反復横とびの記録", goal: "どちらのクラスが多くとべるか" },
            { rec: "握力の記録", goal: "どちらのクラスが力が強いか" },
          ]);
          const ans = pick(r, ["それぞれのクラスの平均値や中央値を求めて、くらべる", "それぞれのクラスの度数分布表やヒストグラムをつくって、くらべる"]);
          const wrongs = shuffle(r, [
            "それぞれのクラスの人数を調べて、人数の多いほうを選ぶ",
            "それぞれのクラスで、いちばんよかった1人の記録だけをくらべる",
            "記録をとった日の天気を調べて、くらべる",
            "それぞれのクラスの出席番号の順番を調べて、くらべる",
          ]).slice(0, 3);
          return {
            q: `2つのクラスの、${s.rec}をくらべて、${s.goal}を決めたい。調べる方法として、適切なものはどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "2つのクラスの記録全体のようすを、くらべられる数やグラフにするには、どうすればよいかな。",
            steps: ["クラスの記録全体のようすをくらべるには、平均値や中央値などの代表値を求めたり、度数分布表やヒストグラムに整理したりする。", "人数・天気・順番などは、記録のよしあしをくらべる理由にならない。1人だけの記録でも、クラス全体のようすはわからない。"],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 06d05 1年生は2年生より睡眠時間が短いといえるか → 整理して比べる方法
        t("06d05", (r) => {
          const s = pick(r, [
            { g: ["1年生", "2年生"], topic: "1日の睡眠時間", dir: "短い" },
            { g: ["A中学校", "B中学校"], topic: "通学時間", dir: "短い" },
            { g: ["1年生", "2年生"], topic: "1日の読書時間", dir: "長い" },
            { g: ["A市の中学生", "B市の中学生"], topic: "1日の家庭学習の時間", dir: "長い" },
          ]);
          const n1 = pick(r, [60, 75, 80, 90, 120, 150]), n2 = pick(r, [50, 65, 70, 85, 100, 110]);
          const ans = pick(r, [
            ...GOOD_COMPARE,
            "人数がちがうので、度数分布表の度数ではなく、相対度数でくらべる",
          ]);
          const wrongs = shuffle(r, [
            `${s.g[0]}と${s.g[1]}の、人数だけをくらべる`,
            "度数分布表の度数（人数）を、そのままくらべる",
            `${s.g[0]}のいちばん大きい値と、${s.g[1]}のいちばん小さい値だけをくらべる`,
            `${s.g[0]}と${s.g[1]}のデータを、1つにまぜてから平均値を求める`,
          ]).slice(0, 3);
          return {
            q: `「${s.g[0]}は、${s.g[1]}より、${s.topic}が${s.dir}」といえるかどうかを調べたい。${s.g[0]} ${n1}人、${s.g[1]} ${n2}人の、${s.topic}のデータがある。このデータを整理してくらべる方法として、適切なものはどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "2つの集団の人数がちがうとき、度数（人数）そのものをくらべてもよいかな。それぞれのデータ全体のようすを、どう表すか考えよう。",
            steps: ["くらべる方法は、平均値や中央値などの代表値を求める、ヒストグラムの形をくらべる、人数がちがうので相対度数（割合）でくらべる、など。", "人数だけ・度数のそのまま・一部の値だけ・まぜて平均、では、2つの集団のちがいがわからない。"],
          };
        }),
        // 06d06a 8、12、ア、15、20 の平均値が 13 のとき、ア
        t("06d06a", (r) => unknown(r, "a")),
        // 06d06b 同じ設定で中央値
        t("06d06b", (r) => unknown(r, "b")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 06d07 度数分布表の一部が読めない。階級値を使って求めた平均値から、ア・イ
        t("06d07", (r) => {
          const ctx = pick(r, FT.filter((c) => c.who === "人")), n = pick(r, [20, 25, 30, 40, 50]), k = 5;
          const f = genFreq(r, n, k);
          if (!f) return { skip: true };
          const cls = classes(ctx.lo, ctx.w, k), tot = sum(cls.map((c, i) => c.mid * f[i])), mn = tot / n;
          if (!Number.isInteger(round(mn * 10, 6))) return { skip: true };
          const ia = r(0, k - 2), ib = r(ia + 1, k - 1);
          if (f[ia] === f[ib]) return { skip: true };
          const show = f.map((x, i) => (i === ia ? "ア" : i === ib ? "イ" : x));
          const known = f.filter((_, i) => i !== ia && i !== ib), S = f[ia] + f[ib];
          const kSum = sum(cls.map((c, i) => (i === ia || i === ib ? 0 : c.mid * f[i]))), rest = tot - kSum;
          const mA = cls[ia].mid, mB = cls[ib].mid, w = pick(r, ["ア", "イ"]), ans = w === "ア" ? f[ia] : f[ib];
          return {
            q: `ある学級${n}人の、${ctx.lead(n).replace(/^\d+人の、/, "")}度数分布表にまとめたが、一部が読めない。度数は、${freqSentence(cls, show, ctx.u, "人")}であった。階級値を使って求めた平均値は ${mn.toFixed(1)}${ctx.u}である。${w} にあてはまる数は？`,
            ans,
            unit: "人",
            hint: "ア と イ の人数の合計は、全体の人数からわかる。もう1つの式は、階級値 × 度数 の合計 ＝ 平均値 × 度数の合計 からつくれる。",
            steps: [
              `ア + イ ＝ ${n} − (${known.join(" + ")}) ＝ ${S}`,
              `階級値 × 度数の合計は ${mn.toFixed(1)} × ${n} ＝ ${tot}。わかっている階級の分は ${kSum} だから、ア・イ の分は ${rest}。`,
              `ア を x 人とすると、イ は (${S} − x) 人。 ${mA}x + ${mB}(${S} − x) ＝ ${rest}`,
              `x ＝ ${f[ia]}　だから　ア ＝ ${f[ia]}、イ ＝ ${S} − ${f[ia]} ＝ ${f[ib]}。${w} は ${ans}。`,
            ],
          };
        }),
        // 06d08 8個のデータの平均値が 12、1個加えて 9個で平均値 13 → 加えた値
        t("06d08", (r) => {
          const n = r(5, 12), m1 = r(8, 20), d = pick(r, [-3, -2, -1, 1, 2, 3]), m2 = m1 + d, x = (n + 1) * m2 - n * m1;
          if (x < 1 || x > 80) return { skip: true };
          return {
            q: `${n}個のデータの平均値は ${m1} だった。新しく 1個を加えて ${n + 1}個にしたところ、平均値は ${m2} になった。加えたデータの値は？`,
            ans: x,
            hint: "平均値 × 個数 ＝ 合計。加える前と加えたあとの、合計を求めて、くらべよう。",
            steps: [`${n}個の合計　${m1} × ${n} ＝ ${m1 * n}　　${n + 1}個の合計　${m2} × ${n + 1} ＝ ${m2 * (n + 1)}`, `加えた値　${m2 * (n + 1)} − ${m1 * n} ＝ ${x}`],
          };
        }),
        // 06q05 5個のデータ 4、6、ア、12、イ（小さい順）。平均値 9、範囲 12 → ア、イ、中央値
        t("06q05", (r) => {
          let v = null;
          for (let tr = 0; tr < 200 && !v; tr++) {
            const x1 = r(2, 8), x2 = x1 + r(1, 6), x3 = x2 + r(1, 8), x4 = x3 + r(1, 8), x5 = x4 + r(1, 10);
            if ((x1 + x2 + x3 + x4 + x5) % 5 === 0 && x5 - x1 <= 30) v = [x1, x2, x3, x4, x5];
          }
          if (!v) return { skip: true };
          const [x1, x2, x3, x4, x5] = v, tot = sum(v), rg = x5 - x1;
          const w = pick(r, ["ア", "イ", "中央値"]);
          const ans = w === "イ" ? x5 : x3;
          return {
            q: `5個のデータ　${x1}、${x2}、ア、${x4}、イ　（小さい順）がある。平均値は ${tot / 5}、範囲は ${rg} である。${w === "中央値" ? "中央値は？" : `${w} にあてはまる数は？`}`,
            ans,
            hint: w === "イ" ? "範囲 ＝ 最大値 − 最小値。小さい順にならんでいるから、最大値と最小値はどれかな。" : "範囲から イ が決まる。平均値 × 個数 ＝ 合計 から、ア がわかる。中央値は小さい順のまん中。",
            steps: [`範囲　イ − ${x1} ＝ ${rg}　より　イ ＝ ${x5}`, `合計　${tot / 5} × 5 ＝ ${tot}　より　ア ＝ ${tot} − (${x1} + ${x2} + ${x4} + ${x5}) ＝ ${x3}`, w === "中央値" ? `小さい順に　${x1}、${x2}、${x3}、${x4}、${x5}　だから、中央値は 3番目の ${x3}。` : `${w} は ${ans}。`],
          };
        }),
      ],
    },
  }),
];

/** 06d06：8、12、ア、15、20 の平均値が 13 のとき、ア（a）／中央値（b） */
function unknown(r, which) {
  const n = pick(r, [5, 5, 6, 7]), m = r(8, 20), x = r(3, 28);
  let known = null;
  for (let tr = 0; tr < 100 && !known; tr++) {
    const head = Array.from({ length: n - 2 }, () => r(3, 28)), last = n * m - x - sum(head);
    if (last >= 3 && last <= 28 && ![...head, last].includes(x)) known = [...head, last].sort((p, q) => p - q);
  }
  if (!known) return { skip: true };
  const all = [...known, x].sort((p, q) => p - q), i = all.indexOf(x);
  const shown = all.map((v, j) => (j === i ? "ア" : v)).join("、");
  const md = median(all);
  const s1 = `合計は ${m} × ${n} ＝ ${n * m}`, s2 = `${known.join(" + ")} ＝ ${sum(known)} だから　ア ＝ ${n * m} − ${sum(known)} ＝ ${x}`;
  if (which === "a") {
    return { q: `${n}個のデータ　${shown}　の平均値が ${m} のとき、ア にあてはまる数は？`, ans: x, hint: "平均値 × 個数 ＝ データの合計。わかっているデータの合計をひけば、ア がわかる。", steps: [s1, s2] };
  }
  return {
    q: `${n}個のデータ　${shown}　の平均値が ${m} のとき、このデータの中央値は？`,
    ans: round(md, 2),
    hint: "まず、平均値からデータの合計を求めて、ア を決めよう。そのあと、小さい順にならべる。",
    steps: [s1, s2, n % 2 ? `小さい順に　${all.join("、")}　だから、中央値は ${(n + 1) / 2}番目の ${fmt(md)}。` : `小さい順に　${all.join("、")}　だから、中央値は ${n / 2}番目と ${n / 2 + 1}番目の平均で ${fmt(md)}。`],
  };
}

// 移さなかった問題
export const SKIPPED = [];   // 第6時は、演習プリント 8問・小テスト 5問のすべてを移した（方法を書く問いは、適切な方法を選ぶ4択に直した）
