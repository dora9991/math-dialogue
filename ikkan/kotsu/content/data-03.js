// ============================================================
// data-03.js — データの活用 第3時「データを、1つの数で代表させよう」（平均値・中央値・最頻値・範囲）
//   ikkan の演習プリント（data-03.dr.1〜8）・小テスト（data-03.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「03」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：03d01b ＝ data-03.dr.1 の2つ目、03q05a ＝ data-03.qz.5 の1つ目
//   平均値・中央値・最頻値・範囲・階級値は、すべて stats.js で計算する（手で書かない）。
//   平均値を聞くデータは、合計が個数でわり切れる（平均値が整数になる）組を選ぶ。度数分布表から平均値を求める問題は、四捨五入の位を問題文に書き、ちょうど 5 の境目になる組は使わない。
//   ヒストグラム（dr.3）は、「長方形の高さ（度数）は、○以上○未満が 3人、…」と文章で言い切る。
//   dr.5（場面にあう代表値）は、4択。理由を書く部分は、解説（steps）に書いた。
// ============================================================
import { t, pick, choices4, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, mean, median, modes, range, sorted, classes, meanFromFreq, roundHalf, isTie, medianClass, cumulative } from "../stats.js";

const unit = unitFor("data");

const show = (x) => String(round(x, 6));
const list = (a) => a.join("　");
const KIND = { mean: "平均値", median: "中央値", mode: "最頻値", range: "範囲" };

// ── データの場面（個々の値） ─────────────────────────────
const VCTX = [
  { name: "1分間の腕立て伏せの回数", u: "回", lo: 5, hi: 25 },
  { name: "テストの得点", u: "点", lo: 40, hi: 95 },
  { name: "1週間の読書時間", u: "時間", lo: 1, hi: 12 },
  { name: "ボール投げの記録", u: "m", lo: 10, hi: 40 },
  { name: "握力", u: "kg", lo: 15, hi: 40 },
  { name: "ゲームの得点", u: "点", lo: 2, hi: 20 },
];

/** n 個のデータ（kind に合う組。mean は合計が n でわり切れる、mode は最頻値が 1 つだけで 2 回以上）をつくる。ない場合は null */
function genList(r, kind, n, lo, hi) {
  for (let i = 0; i < 500; i++) {
    const d = Array.from({ length: n }, () => r(lo, hi));
    if (kind === "mean" && sum(d) % n !== 0) continue;
    if (kind === "mode") { const m = modes(d); if (m.length !== 1 || d.filter((x) => x === m[0]).length < 2) continue; }
    if (kind === "median" && n % 2 === 0 && sorted(d)[n / 2 - 1] === sorted(d)[n / 2] && r(0, 2) > 0) continue;   // まん中の 2つが同じ値の組は、ときどきだけ
    return d;
  }
  return null;
}

/** データから kind の値を求める問題。ctx があれば場面つき、なければ「次のデータの＿＿を求めよう」 */
function statQ(r, kind, { n, lo, hi, ctx = null, sortedShow = false }) {
  const d = genList(r, kind, n, lo, hi);
  if (!d) return { skip: true };
  const s = sorted(d), shown = sortedShow ? s : d;
  const nm = KIND[kind];
  let ans, hint, steps;
  if (kind === "mean") {
    ans = mean(d);
    hint = "平均値は、データの合計と個数を使って、どう求めるのだったかな。";
    steps = [`合計 ＝ ${shown.join("+")} ＝ ${sum(d)}`, `平均値 ＝ ${sum(d)}÷${n} ＝ ${ans}`];
  } else if (kind === "median") {
    ans = median(d);
    hint = n % 2 ? "データを小さい順に並べると、まん中の値は、何番目かな。" : "個数が偶数のとき、中央値は、どの値を使って求めるのだったかな。小さい順に並べると、それは何番目と何番目かな。";
    steps = [`小さい順に並べる：${list(s)}`, n % 2 ? `${n}個だから、まん中は ${(n + 1) / 2}番目の ${ans}。` : `${n}個だから、まん中は ${n / 2}番目の ${s[n / 2 - 1]}と ${n / 2 + 1}番目の ${s[n / 2]}。(${s[n / 2 - 1]}+${s[n / 2]})÷2 ＝ ${show(ans)}`];
  } else if (kind === "mode") {
    ans = modes(d)[0];
    hint = "データの中で、いちばん多く出てくる値は、どれかな。";
    steps = [`小さい順に並べる：${list(s)}`, `${ans}が ${d.filter((x) => x === ans).length}回出てくる。いちばん多いので、最頻値は ${ans}。`];
  } else {
    ans = range(d);
    hint = "範囲は、どの 2つの値を使って求めるのだったかな。";
    steps = [`最大値は ${Math.max(...d)}、最小値は ${Math.min(...d)}。`, `範囲 ＝ ${Math.max(...d)}−${Math.min(...d)} ＝ ${ans}`];
  }
  return {
    q: ctx ? `${n}人の${ctx.name}（${ctx.u}）を調べた。［${list(shown)}］　${nm}は？` : `次のデータの${nm}を求めよう。［${list(shown)}］`,
    ans: round(ans),
    ...(ctx ? { unit: ctx.u } : {}),
    hint,
    steps,
  };
}

// ── 度数分布表・ヒストグラム ─────────────────────────────
const FCTX = [
  { name: "通学時間", u: "分", los: [0], ws: [5, 10], max: 60, pk: [10, 35] },
  { name: "ボール投げの記録", u: "m", los: [10, 15, 20], ws: [5], max: 50, pk: [22, 42] },
  { name: "上体起こしの記録", u: "回", los: [10, 15, 20], ws: [5], max: 50, pk: [20, 40] },
  { name: "身長", u: "cm", los: [140, 145, 150], ws: [5], max: 180, pk: [150, 170] },
  { name: "テストの得点", u: "点", los: [0, 40], ws: [10], max: 100, pk: [35, 85] },
];
/** 度数分布表の場面 c（なければ選ぶ）で、階級を k 個つくる（テストの得点は、階級の上のはしが 100 をこえないようにする） */
const fsetup = (r, k, c = null) => {
  c = c || pick(r, FCTX);
  let w = pick(r, c.ws), lo = pick(r, c.los);
  if (c.max && lo + w * k > c.max) lo = Math.min(...c.los);   // 階級の上のはしが、場面にあう上限（満点・身長など）をこえないようにする
  if (c.max && lo + w * k > c.max) w = Math.min(...c.ws);
  return { c, u: c.u, w, lo, k, cls: classes(lo, w, k) };
};
/** 山の位置（階級の番号）：階級値が場面の「ふつうの範囲」pk の中にある階級から選ぶ（k が 5 以上なら、両はしの階級は山にしない） */
const pickPeak = (r, cls, pk) => {
  const k = cls.length, all = Array.from({ length: k }, (_, i) => i).filter((i) => k < 5 || (i > 0 && i < k - 1));
  const ok = pk ? all.filter((i) => cls[i].mid >= pk[0] && cls[i].mid <= pk[1]) : all;
  return pick(r, ok.length ? ok : all);
};
const lb = (c, u, d = 0) => `${d ? Number(c.lo).toFixed(d) : c.lo}${u}以上${d ? Number(c.hi).toFixed(d) : c.hi}${u}未満`;
const fs = (cls, f, u, d = 0) => cls.map((c, i) => `${lb(c, u, d)}が ${f[i]}人`).join("、");
const bell = (r, k, n) => {
  const f = Array(k).fill(0);
  for (let i = 0; i < n; i++) f[Math.floor((r(0, 10 * k - 1) + r(0, 10 * k - 1)) / 20)]++;
  return f;
};
/** 山の位置 p がいろいろ（p の階級がいちばん多くなりやすい）で、k 個の階級に n 人を分ける */
const peaked = (r, k, n, p) => {
  const w = Array.from({ length: k }, (_, i) => Math.round(1000 / (1 + 0.6 * Math.abs(i - p)) ** 2));
  const tot = w.reduce((a, b) => a + b, 0), f = Array(k).fill(0);
  for (let i = 0; i < n; i++) { let x = r(1, tot), j = 0; while (x > w[j]) { x -= w[j]; j++; } f[j]++; }
  return f;
};
const uniqMax = (f) => f.filter((x) => x === Math.max(...f)).length === 1;
/** 階級の位置が近い順に、正解（j）以外の階級の番号：j−1、j+1、j−2、j+2、…（誤答がいつも k−1 個そろう） */
const near = (j, k) => Array.from({ length: k }, (_, i) => i).filter((i) => i !== j).sort((a, b) => Math.abs(a - j) - Math.abs(b - j) || a - b);
/** 度数分布表 f（階級 cls）の、階級値×度数の和の式と、平均値の解説 */
function meanSteps(cls, f, u, ndigit) {
  const terms = cls.map((c, i) => `${show(c.mid)}×${f[i]}`).join("+");
  const S = f.reduce((a, v, i) => a + cls[i].mid * v, 0), n = sum(f), M = S / n;
  const exact = Math.abs(M - round(M, 3)) < 1e-9;
  const out = [
    `階級値×度数の和 ＝ ${terms} ＝ ${show(S)}`,
    `平均値 ＝ ${show(S)}÷${n} ${exact ? "＝" : "≒"} ${round(M, 3)}（${u}）`,
  ];
  if (Math.abs(M - roundHalf(M, ndigit)) > 1e-9) out.push(`${ndigit === 1 ? "小数第2位" : "小数第1位"}を四捨五入して ${show(roundHalf(M, ndigit))}（${u}）`);
  return out;
}

// ── 場面にあう代表値（dr.5） ─────────────────────────────
const SCENES = [
  ["mode", "くつ屋が、いちばん多く仕入れるサイズを決める。", "いちばん多くの人がはくサイズを、多く仕入れたいので、いちばん多く出てくる値の最頻値がよい。"],
  ["mode", "洋服店が、いちばん売れた色を調べて、次に多く仕入れる色を決める。", "いちばん売れた（いちばん多い）色を知りたいので、最頻値がよい。"],
  ["mode", "学校の売店が、いちばん多く買われているパンの種類を調べて、多く仕入れる種類を決める。", "いちばん多く買われた種類を知りたいので、最頻値がよい。"],
  ["mode", "ラーメン店が、いちばん多く注文されるトッピングを調べて、仕入れる量を決める。", "いちばん多く注文された（いちばん多い）トッピングを知りたいので、最頻値がよい。"],
  ["mode", "制服店が、生徒のサイズを調べて、いちばん多いサイズの制服を多くそろえる。", "いちばん多いサイズ（いちばん多く出てくる値）を知りたいので、最頻値がよい。"],
  ["mode", "ケーキ店が、お客さんにいちばんよく売れた味を調べて、次の仕入れを決める。", "いちばんよく売れた（いちばん多い）味を知りたいので、最頻値がよい。"],
  ["mode", "スポーツ用品店が、いちばん多くの人がはくスニーカーのサイズを調べて、多く仕入れるサイズを決める。", "いちばん多くの人がはくサイズ（いちばん多く出てくる値）を知りたいので、最頻値がよい。"],
  ["mode", "自動販売機の管理人が、いちばん多く売れた飲み物の種類を調べて、多くならべる種類を決める。", "いちばん多く売れた（いちばん多い）種類を知りたいので、最頻値がよい。"],
  ["mode", "本屋が、いちばん多く売れた本の種類（小説・図鑑など）を調べて、多く仕入れる種類を決める。", "いちばん多く売れた（いちばん多い）種類を知りたいので、最頻値がよい。"],
  ["mean", "7日間の1日の歩数から、1年間の歩数の合計を見積もる。", "1日の平均値 × 日数 で、合計がわかるので、平均値がよい。"],
  ["mean", "4か月分の食費から、1年間の食費の合計を見積もる。", "1か月の平均値 × 12で、1年間の合計がわかるので、平均値がよい。"],
  ["mean", "5日間の給食の残りの量から、1か月の残りの量の合計を見積もる。", "1日の平均値 × 日数 で、合計がわかるので、平均値がよい。"],
  ["mean", "20日間の1日のごみの量から、1年間のごみの量の合計を見積もる。", "1日の平均値 × 日数 で、合計がわかるので、平均値がよい。"],
  ["mean", "3か月分の電気代から、1年間の電気代の合計を見積もる。", "1か月の平均値 × 12で、1年間の合計がわかるので、平均値がよい。"],
  ["mean", "10日間の1日の売り上げから、1年間の売り上げの合計を見積もる。", "1日の平均値 × 日数 で、合計がわかるので、平均値がよい。"],
  ["mean", "5日間の水道の使用量から、1か月の使用量の合計を見積もる。", "1日の平均値 × 日数 で、合計がわかるので、平均値がよい。"],
  ["median", "10人の貯金額は、人によってバラバラで、同じ金額の人はほとんどいない。1人だけ、とびぬけて金額が大きい。ふつうの人の貯金額のめやすを、1つの数で表したい。", "平均値は、とびぬけた1人の金額に引っぱられて大きくなる。同じ値がほとんどないので、最頻値もあてにならない。まん中の値の中央値がよい。"],
  ["median", "15人のアルバイト代は、人によってバラバラで、同じ金額の人はほとんどいない。1人だけ、とびぬけて多い。ふつうの人のアルバイト代のめやすを、1つの数で表したい。", "平均値は、とびぬけて多い1人に引っぱられて大きくなる。同じ値がほとんどないので、最頻値もあてにならない。まん中の値の中央値がよい。"],
  ["median", "10匹の魚の重さは、1匹ずつちがい、同じ重さの魚はほとんどいない。1匹だけ、とびぬけて重い。ふつうの魚の重さのめやすを、1つの数で表したい。", "平均値は、とびぬけて重い1匹に引っぱられて大きくなる。同じ値がほとんどないので、最頻値もあてにならない。まん中の値の中央値がよい。"],
  ["median", "12人のスマホ料金は、人によってバラバラで、同じ金額の人はほとんどいない。1人だけ、とびぬけて高い。ふつうの人のスマホ料金のめやすを、1つの数で表したい。", "平均値は、とびぬけて高い1人に引っぱられて大きくなる。同じ値がほとんどないので、最頻値もあてにならない。まん中の値の中央値がよい。"],
  ["median", "9軒の家の広さは、家ごとにちがい、同じ広さの家はほとんどない。1軒だけ、とびぬけて広い。ふつうの家の広さのめやすを、1つの数で表したい。", "平均値は、とびぬけて広い1軒に引っぱられて大きくなる。同じ値がほとんどないので、最頻値もあてにならない。まん中の値の中央値がよい。"],
  ["median", "20人のおこづかいは、人によってバラバラで、同じ金額の人はほとんどいない。1人だけ、とびぬけて多い。ふつうの人のおこづかいのめやすを、1つの数で表したい。", "平均値は、とびぬけて多い1人に引っぱられて大きくなる。同じ値がほとんどないので、最頻値もあてにならない。まん中の値の中央値がよい。"],
];

export const UNITS = [
  unit("03", {
    name: "代表値（平均値・中央値・最頻値・範囲）",
    desc: "平均値・中央値・最頻値・範囲の求め方と、度数分布表から求める代表値",
    prereqs: ["J1-dk02", "E6-data"],
    points: [
      "データ全体のようすを1つの数で表したものを代表値という。平均値＝（データの合計）÷（データの個数）。",
      "中央値は、データを大きさの順に並べたときのまん中の値。データの個数が偶数のときは、まん中の2つの値の平均。最頻値は、もっとも多く出てくる値。",
      "範囲＝（最大値）−（最小値）。データのちらばりぐあいを表す。（代表値ではない。）",
      "度数分布表では、最頻値は度数がもっとも多い階級の階級値（階級のまん中の値）。平均値は、（階級値×度数）の和 ÷（度数の合計）で求めるおよその値。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 03d01a〜d データの平均値・中央値・最頻値・範囲（小さい順にならんだデータ）
        t("03d01a", (r) => statQ(r, "mean", { n: r(5, 7), lo: 2, hi: 25, sortedShow: true })),
        t("03d01b", (r) => statQ(r, "median", { n: r(5, 8), lo: 2, hi: 25, sortedShow: true })),
        t("03d01c", (r) => statQ(r, "mode", { n: r(5, 8), lo: 2, hi: 15, sortedShow: true })),
        t("03d01d", (r) => statQ(r, "range", { n: r(5, 7), lo: 2, hi: 30, sortedShow: true })),
        // 03d02 10人のデータ（ばらばら）から、代表値を求める
        t("03d02", (r) => {
          const kind = pick(r, ["mean", "median", "mode", "range"]), ctx = pick(r, VCTX);
          return statQ(r, kind, { n: pick(r, [8, 10, 12]), lo: ctx.lo, hi: ctx.hi, ctx });
        }),
        // 03q01 7人のデータの平均値・最頻値・範囲
        t("03q01", (r) => {
          const kind = pick(r, ["mean", "mode", "range"]);
          return statQ(r, kind, { n: r(6, 9), lo: 2, hi: 15, ctx: VCTX[5] });
        }),
        // 03q04 平均値から合計
        t("03q04", (r) => {
          const n = r(4, 12);
          const [name, u, lo, hi] = pick(r, [["テストの得点", "点", 50, 90], ["1週間の読書時間", "時間", 2, 8], ["ボール投げの記録", "m", 15, 35], ["1分間の腕立て伏せの回数", "回", 8, 25], ["通学時間", "分", 8, 40], ["握力", "kg", 18, 36]]);
          const m = r(lo, hi);
          return {
            q: `${n}人の${name}（${u}）の平均値が${m}${u}のとき、${n}人の合計はいくつか。`,
            ans: n * m,
            unit: u,
            hint: "平均値は、合計と個数からどう求めたかな。合計を求めるには、その式をどう変えたらいいかな。",
            steps: [`平均値 ＝ 合計 ÷ 個数 だから、合計 ＝ 平均値 × 個数`, `合計 ＝ ${m}×${n} ＝ ${n * m}（${u}）`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 03d03a ヒストグラムから最頻値
        t("03d03a", (r) => {
          const k = r(6, 8), { c, cls } = fsetup(r, k), n = pick(r, [24, 28, 30, 32, 36, 40]), pk = pickPeak(r, cls, c.pk), f = peaked(r, k, n, pk);
          if (!uniqMax(f) || f.indexOf(Math.max(...f)) !== pk) return { skip: true };   // ねらった山の階級が、そのまま最頻値の階級になる組だけ
          const j = f.indexOf(Math.max(...f)), mid = cls[j].mid;
          return {
            q: `${n}人の${c.name}（${c.u}）のヒストグラムがある。長方形の高さは、${fs(cls, f, c.u)}である。最頻値を求めよう。`,
            ans: mid,
            unit: c.u,
            hint: "度数分布表やヒストグラムでの最頻値は、どの階級の、どの値で表すのだったかな。",
            steps: [`いちばん高い長方形は、${f[j]}人の「${lb(cls[j], c.u)}」。`, `最頻値は、その階級値 (${cls[j].lo}+${cls[j].hi})÷2 ＝ ${show(mid)}（${c.u}）`],
          };
        }),
        // 03d03b ヒストグラムから平均値（小数第2位を四捨五入）
        t("03d03b", (r) => {
          const k = r(6, 8), { c, cls } = fsetup(r, k), n = pick(r, [24, 28, 30, 32, 36, 40]), f = peaked(r, k, n, pickPeak(r, cls, c.pk));
          const M = meanFromFreq(cls, f);
          if (isTie(M, 1)) return { skip: true };
          return {
            q: `${n}人の${c.name}（${c.u}）のヒストグラムがある。長方形の高さは、${fs(cls, f, c.u)}である。平均値を求めよう。（小数第2位を四捨五入して、小数第1位まで）`,
            ans: roundHalf(M, 1),
            unit: c.u,
            hint: "度数分布表から平均値を求めるとき、それぞれの階級の人を、みな何の値とみなすのだったかな。",
            steps: meanSteps(cls, f, c.u, 1),
          };
        }),
        // 03d04 n回の平均値から、n+1回の平均値
        t("03d04", (r) => {
          const n = r(3, 9), m = r(55, 85), tt = pick(r, [-2, -1, 1, 2, 3]), s = m + (n + 1) * tt;
          if (s < 35 || s > 100) return { skip: true };
          const ans = (n * m + s) / (n + 1);
          return {
            q: `${n}回のテストの得点の平均値は ${m}点だった。${n + 1}回目のテストで ${s}点をとると、${n + 1}回の平均値は何点になるか。`,
            ans,
            unit: "点",
            hint: "平均値と回数から、これまでの合計はわかるかな。新しい得点をふくめた合計と回数から、新しい平均値は求められるかな。",
            steps: [`${n}回の合計 ${n}×${m} ＝ ${n * m}　${n + 1}回の合計 ${n * m}+${s} ＝ ${n * m + s}`, `平均値 ${n * m + s}÷${n + 1} ＝ ${ans}（点）`],
          };
        }),
        // 03q02 中央値（偶数個）
        t("03q02", (r) => {
          const n = pick(r, [4, 6, 6, 8]), d = [];
          for (let i = 0; i < n; i++) d.push(r(1, 15));
          const s = sorted(d), ans = median(d);
          if (new Set(d).size < n - 1) return { skip: true };
          return {
            q: `${n}人のデータ［${list(d)}］の中央値を求めよう。`,
            ans: round(ans),
            hint: "個数が偶数のとき、中央値は、どの値を使って求めるのだったかな。小さい順に並べると、それは何番目と何番目かな。",
            steps: [`小さい順に並べる：${list(s)}`, `まん中の 2つは ${s[n / 2 - 1]}と ${s[n / 2]}。中央値 ＝ (${s[n / 2 - 1]}+${s[n / 2]})÷2 ＝ ${show(ans)}`],
          };
        }),
        // 03q03a 度数分布表の最頻値
        t("03q03a", (r) => {
          const { c, cls } = fsetup(r, 4), pk = pickPeak(r, cls, c.pk), f = peaked(r, 4, 20, pk);
          if (!uniqMax(f) || f.indexOf(Math.max(...f)) !== pk) return { skip: true };
          const j = f.indexOf(Math.max(...f));
          return {
            q: `20人の${c.name}（${c.u}）の度数分布表は、${fs(cls, f, c.u)}である。最頻値を求めよう。`,
            ans: cls[j].mid,
            unit: c.u,
            hint: "度数分布表での最頻値は、どの階級の、どの値で表すのだったかな。",
            steps: [`度数がもっとも多いのは、${f[j]}人の「${lb(cls[j], c.u)}」。`, `最頻値は、その階級値 (${cls[j].lo}+${cls[j].hi})÷2 ＝ ${show(cls[j].mid)}（${c.u}）`],
          };
        }),
        // 03q03b 度数分布表の平均値（四捨五入して整数）
        t("03q03b", (r) => {
          const { c, cls } = fsetup(r, 4);
          let f = null, M = 0;
          for (let i = 0; i < 60 && !f; i++) { const g = peaked(r, 4, 20, pickPeak(r, cls, c.pk)); M = meanFromFreq(cls, g); if (!isTie(M, 0)) f = g; }   // ちょうど 5の境目の組は使わない
          if (!f) return { skip: true };
          return {
            q: `20人の${c.name}（${c.u}）の度数分布表は、${fs(cls, f, c.u)}である。平均値を、小数第1位を四捨五入して、整数で求めよう。`,
            ans: roundHalf(M, 0),
            unit: c.u,
            hint: "度数分布表から平均値を求めるとき、それぞれの階級の人を、みな何の値とみなすのだったかな。",
            steps: meanSteps(cls, f, c.u, 0),
          };
        }),
        // 03d07a 度数分布表の最頻値（50m走）
        t("03d07a", (r) => {
          const T = freqT(r), j = T.f.indexOf(Math.max(...T.f));
          if (!uniqMax(T.f)) return { skip: true };
          return {
            q: `${T.q}最頻値を求めよう。`,
            ans: round(T.cls[j].mid, 6),
            unit: "秒",
            hint: "度数分布表での最頻値は、どの階級の、どの値で表すのだったかな。",
            steps: [`度数がもっとも多いのは、${T.f[j]}人の「${lb(T.cls[j], "秒", 1)}」。`, `最頻値は、その階級値 (${T.cls[j].lo.toFixed(1)}+${T.cls[j].hi.toFixed(1)})÷2 ＝ ${show(T.cls[j].mid)}（秒）`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 03d05 場面にあう代表値
        t("03d05", (r) => {
          const [k, scene, why] = pick(r, SCENES), ans = KIND[k];
          return {
            q: `${scene}　この場面で、知りたいことに合う数として、使うのがよいのは、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, ["平均値", "中央値", "最頻値", "範囲"].filter((x) => x !== ans)),
            hint: "平均値・中央値・最頻値・範囲は、それぞれ何を表す数だったかな。この場面で知りたいことは何かな。",
            steps: [why, `答えは「${ans}」。`],
          };
        }),
        // 03d06a 中央値から x を求める
        t("03d06a", (r) => xQ(r, "x")),
        // 03d06b 中央値から x を求めて、平均値を求める
        t("03d06b", (r) => xQ(r, "mean")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 03d07b 中央値がふくまれる階級
        t("03d07b", (r) => {
          const T = freqT(r), j = medianClass(T.f);
          if (j === null || j === -1) return { skip: true };
          const cu = cumulative(T.f), ans = lb(T.cls[j], "秒", 1), n = T.n;
          const nums = n % 2 ? `${(n + 1) / 2}番目` : `${n / 2}番目と${n / 2 + 1}番目`;
          return {
            q: `${T.q}中央値がふくまれる階級は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, near(j, T.cls.length).map((i) => lb(T.cls[i], "秒", 1))),
            hint: "中央値は、小さい順に並べたときの、まん中の人の記録。まん中の人は、何番目（と何番目）かな。その人は、人数をたしていくと、どの階級に入るかな。",
            steps: [`${n}人だから、中央値は ${nums}の人の記録。`, `度数を小さいほうから順にたす：${cu.join("、")}（人）。`, `${nums}は、たした人数がはじめてそこに届く「${ans}」の階級にいる。`],
          };
        }),
        // 03d07c 平均値（小数第2位を四捨五入）
        t("03d07c", (r) => {
          const T = freqT(r), M = meanFromFreq(T.cls, T.f);
          if (isTie(M, 1)) return { skip: true };
          return {
            q: `${T.q}平均値を、小数第2位を四捨五入して求めよう。`,
            ans: roundHalf(M, 1),
            unit: "秒",
            hint: "度数分布表から平均値を求めるとき、それぞれの階級の人を、みな何の値とみなすのだったかな。",
            steps: meanSteps(T.cls, T.f, "秒", 1),
          };
        }),
        // 03d08 n人の平均値から、1人ふえたときの新しい人の得点
        t("03d08", (r) => {
          const n = r(5, 12), m = r(60, 80), dl = pick(r, [-3, -2, -1, 1, 2, 3, 4]), m2 = m + dl, s = m + (n + 1) * dl;
          if (s < 20 || s > 100) return { skip: true };
          return {
            q: `${n}人のグループの、テストの平均値は ${m}点だった。新しく 1人が入ると、${n + 1}人の平均値が ${m2}点になった。新しく入った人の得点を求めよう。`,
            ans: s,
            unit: "点",
            hint: "平均値と人数から、入る前の合計と、入った後の合計は、わかるかな。入る前と入った後で、合計はどれだけちがうかな。",
            steps: [`${n}人の合計 ${n}×${m} ＝ ${n * m}　${n + 1}人の合計 ${n + 1}×${m2} ＝ ${(n + 1) * m2}`, `新しく入った人 ${(n + 1) * m2}−${n * m} ＝ ${s}（点）`],
          };
        }),
        // 03q05a 平均値から x
        t("03q05a", (r) => avgX(r, "x")),
        // 03q05b 平均値から x を求めて、中央値
        t("03q05b", (r) => avgX(r, "median")),
      ],
    },
  }),
];

// ── 50m走の度数分布表（dr.7）：階級の幅 0.5 秒、5 つの階級 ───────────
function freqT(r) {
  const lo = pick(r, [7, 7.5, 8]), k = lo + 0.5 * 6 > 10.5 ? 5 : pick(r, [5, 5, 6]), cls = classes(lo, 0.5, k), n = pick(r, [36, 40, 40, 44, 45, 50]);
  const f = peaked(r, k, n, pickPeak(r, cls, [8, 9.5]));   // 50m走の山は 8.0〜9.5 秒あたり
  return { cls, f, n, q: `${n}人の50m走の記録の度数分布表は、${fs(cls, f, "秒", 1)}である。` };
}

// ── 03d06：6 つのデータ ア〜 の x（中央値から） ───────────────
function xQ(r, ask) {
  const v3 = r(4, 12), x = v3 + 2 * r(1, 4), m = (v3 + x) / 2;
  const v5 = x + r(0, 4), v2 = v3 - r(1, 3), v1 = v2 - r(1, 3);
  if (v1 < 1) return { skip: true };
  // v6：合計が 6 でわり切れ、v5 より大きい値（v5+1〜v5+6 のどれか 1 つ）
  const base = v1 + v2 + v3 + x + v5;
  let v6 = null;
  for (let a = v5 + 1; a <= v5 + 6; a++) if ((base + a) % 6 === 0) { v6 = a; break; }
  if (v6 === null) return { skip: true };
  const data = [v1, v2, v3, "x", v5, v6], full = [v1, v2, v3, x, v5, v6], S = sum(full);
  const head = `6つのデータ［${list(data)}］がある。x は ${v3}以上${v5}以下の数で、中央値は ${m}である。`;
  if (ask === "x") {
    return {
      q: `${head}x を求めよう。`,
      ans: x,
      hint: "データが 6個（偶数）のとき、中央値はどう求めたかな。x は、小さい順で何番目にあるかな。",
      steps: [`6個だから、中央値は 3番目の ${v3}と 4番目の x の平均。`, `(${v3}+x)÷2 ＝ ${m}　より　${v3}+x ＝ ${2 * m}　x ＝ ${x}`],
    };
  }
  return {
    q: `${head}x を求めて、6つのデータの平均値も求めよう。平均値は？`,
    ans: S / 6,
    hint: "中央値から、x はわかるかな。データが 6個（偶数）のとき、中央値はどう求めたかな。x がわかれば、平均値は求められるかな。",
    steps: [`中央値は 3番目の ${v3}と 4番目の x の平均だから　(${v3}+x)÷2 ＝ ${m}　x ＝ ${x}`, `平均値 ＝ (${full.join("+")})÷6 ＝ ${S}÷6 ＝ ${S / 6}`],
  };
}

// ── 03q05：5 つのデータ（平均値から x、中央値） ───────────────
function avgX(r, ask) {
  const known = Array.from({ length: 4 }, () => r(2, 16)), K = sum(known);
  const m = r(Math.ceil((K + 1) / 5), Math.floor((K + 24) / 5)), x = 5 * m - K;
  if (x < 1 || x > 24) return { skip: true };
  const all = sorted([...known, x]), med = all[2];
  const head = `5つのデータ［${list(known)}　x］の平均値は ${m}である。`;
  if (ask === "x") {
    return {
      q: `${head}x を求めよう。`,
      ans: x,
      hint: "平均値は、合計と個数からどう求めたかな。合計を、平均値から求められないかな。",
      steps: [`合計 ＝ 平均値 × 個数 ＝ ${m}×5 ＝ ${5 * m}`, `${known.join("+")}+x ＝ ${5 * m}　${K}+x ＝ ${5 * m}　x ＝ ${x}`],
    };
  }
  return {
    q: `${head}x を求めて、5つのデータの中央値も求めよう。中央値は？`,
    ans: med,
    hint: "平均値から、x はわかるかな。x がわかったら、5つのデータを小さい順に並べると、まん中の値はどれかな。",
    steps: [`合計 ＝ ${m}×5 ＝ ${5 * m}　${K}+x ＝ ${5 * m}　x ＝ ${x}`, `小さい順に並べる：${list(all)}`, `5個だから、まん中は 3番目の ${med}。`],
  };
}

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 演習プリント 8問・小テスト 5問のすべてを移した（dr.5の理由を書く部分は、場面にあう代表値を選ぶ 4択にして、理由は解説に書いた）
