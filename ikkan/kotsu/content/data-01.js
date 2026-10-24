// ============================================================
// data-01.js — データの活用 第1時「ばらばらのデータを整理して、傾向を読み取ろう」（度数分布表）
//   ikkan の演習プリント（data-01.dr.1〜8）・小テスト（data-01.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「01」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：01d02b ＝ data-01.dr.2 の2つ目、01q03 ＝ data-01.qz.3
//   データ（個々の値）や度数分布表は、乱数でつくったデータから stats.js で数えて出す（度数・割合を手で書かない）。
//   表をつくる問題（dr.1・qz.2）は、「表のうちの 1 つの階級の度数」を聞く。表が要る問題は、度数分布表を文章（freqSentence）で言う。
// ============================================================
import { t, pick, choices4, shuffle, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, classes, freqs, cumulative, pct, clsLabel, freqSentence, listData } from "../stats.js";

const unit = unitFor("data");

// ── 場面 ─────────────────────────────────────────────
/** name＝「20人の＿＿」に入る言葉、u＝単位、los＝階級のはじめの候補、ws＝階級の幅の候補、max＝階級の上のはしの上限 */
const CTX = [
  { name: "ボール投げの記録", u: "m", los: [10, 15, 20], ws: [5], max: 50 },
  { name: "通学時間", u: "分", los: [0], ws: [5, 10], max: 60 },
  { name: "1週間の読書時間", u: "時間", los: [0], ws: [2, 5], max: 20 },
  { name: "テストの得点", u: "点", los: [0, 40], ws: [10], max: 100 },
  { name: "1分間の腕立て伏せの回数", u: "回", los: [0, 5], ws: [5] },
  { name: "1日のゲーム時間", u: "分", los: [0], ws: [20, 30] },
  { name: "握力", u: "kg", los: [10, 15, 20], ws: [5], max: 50 },
];

/** 場面 c（なければ選ぶ）で、階級を k 個（lo から幅 w）つくる */
const setup = (r, k = null, c = null) => {
  c = c || pick(r, CTX);
  k = k || r(5, 6);
  let w = pick(r, c.ws), lo = pick(r, c.los);
  if (c.max && lo + w * k > c.max) lo = Math.min(...c.los);   // 階級の上のはしが、場面にあう上限（満点など）をこえないようにする
  if (c.max && lo + w * k > c.max) w = Math.min(...c.ws);
  return { c, u: c.u, w, k, lo, cls: classes(lo, w, k) };
};
/** 階級のはんいの中に、山の形（まん中が多い）で n 個のデータをつくる */
const genData = (r, n, cls) => {
  const L = cls[0].lo, M = cls[cls.length - 1].hi - L;
  return Array.from({ length: n }, () => L + Math.floor((r(0, M - 1) + r(0, M - 1)) / 2));
};
const lab = (c, u) => clsLabel(c, u);
/** 割り算の式と百分率：割り切れるときは「＝」、割り切れないときは「≒」 */
const divPct = (a, b) => {
  const q = a / b, ex = Math.abs(q - round(q, 5)) < 1e-12;
  return `${a}÷${b} ${ex ? "＝" : "≒"} ${round(q, 5)}　百分率にして${ex ? " " : "約 "}${round(q * 100, 3)}%`;
};
/** たし算の式：1つだけなら「5（人）」、いくつかなら「2+3 ＝ 5（人）」 */
const tot = (a) => (a.length > 1 ? `${a.join("+")} ＝ ${sum(a)}（人）` : `${a[0]}（人）`);
const uniqMax = (f) => f.filter((x) => x === Math.max(...f)).length === 1;
const uniqMin = (f) => f.filter((x) => x === Math.min(...f)).length === 1;
/** 階級の位置が近い順に、正解（j）以外の階級の番号をならべる：j−1、j+1、j−2、j+2、…（誤答がいつも k−1 個そろう） */
const nearIdx = (j, k) => Array.from({ length: k }, (_, i) => i).filter((i) => i !== j).sort((a, b) => Math.abs(a - j) - Math.abs(b - j) || a - b);
/** 度数のちがいが近い順に、正解以外の階級の番号をならべる（誤答に使う） */
const nearOrder = (f, j) => f.map((v, i) => i).filter((i) => i !== j).sort((a, b) => Math.abs(f[a] - f[j]) - Math.abs(f[b] - f[j]) || a - b);

// ── 度数が見えない 2 つの階級（ア・イ）の問題 ───────────────
/** 度数分布表で、ア・イ の 2 つの階級の度数が見えない。倍率の関係から、ア・イを求める。
 *  mul＝"イ"：イ＝ratio×ア　／　mul＝"ア"：ア＝ratio×イ。offs があれば「ratio倍より e人多い（少ない）」の形（入試レベル） */
function pairQ(r, { k, ratios, mul, nameCtx, offs = null }) {
  const s = setup(r, k, nameCtx);
  const ratio = pick(r, ratios), m = r(2, 8);
  const e = offs ? pick(r, offs) * (r(0, 1) ? 1 : -1) : 0;   // e＞0：多い、e＜0：少ない
  const idx = shuffle(r, Array.from({ length: k }, (_, i) => i));
  const pa = idx[0], pi = idx[1];
  const known = Array.from({ length: k }, () => r(2, 9));
  const base = mul === "イ" ? "ア" : "イ", mult = mul === "イ" ? "イ" : "ア";
  const bv = m, mv = ratio * m + e;   // base の度数、mult の度数
  const a = mul === "イ" ? bv : mv, b = mul === "イ" ? mv : bv;   // a＝アの度数、b＝イの度数
  const f = known.slice();
  f[pa] = a; f[pi] = b;
  const n = sum(f);
  const kn = f.filter((_, i) => i !== pa && i !== pi);
  const rest = n - sum(kn);
  const sent = s.cls.map((c, i) => `${lab(c, s.u)}が ${i === pa ? "ア" : i === pi ? "イ" : f[i]}人`).join("、");
  const ask = pick(r, ["ア", "イ"]);
  if (mv < 2) return { skip: true };
  const eTxt = e === 0 ? "である" : e > 0 ? `より${e}人多い` : `より${-e}人少ない`;
  const rel = `${mult}の度数は、${base}の度数の${ratio}倍${eTxt}`;
  const expr = e === 0 ? `${ratio}×${base}` : e > 0 ? `${ratio}×${base}+${e}` : `${ratio}×${base}−${-e}`;
  const lines = e === 0
    ? [`${mult} ＝ ${ratio}×${base} だから　${base}+${ratio}×${base} ＝ ${rest}　${ratio + 1}×${base} ＝ ${rest}`]
    : [`${mult} ＝ ${expr} だから　${base}+(${expr}) ＝ ${rest}　${ratio + 1}×${base} ＝ ${rest - e}`];
  return {
    q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${sent}である。${rel}。${ask}の度数は？`,
    ans: ask === "ア" ? a : b,
    unit: "人",
    hint: e === 0
      ? "アとイの度数の和は、全体の人数とわかっている度数から、わかるかな。アとイの関係を、式で表せるかな。"
      : "アとイの度数の和は、全体の人数とわかっている度数から、わかるかな。「何倍より何人多い（少ない）」を、式で表すと、どうなるかな。",
    steps: [
      `ア+イ ＝ ${n}−(${kn.join("+")}) ＝ ${rest}（人）`,
      ...lines,
      `${base} ＝ ${bv}、${mult} ＝ ${mv}。${ask}の度数は${ask === "ア" ? a : b}（人）。`,
    ],
  };
}

// ── 用語（小テスト 1） ───────────────────────────────
const TERMS = [
  ["階級", "データを整理するために区切った区間を、何というか。", "データを整理するために区切った区間を「階級」という。"],
  ["階級", "「0分以上10分未満」「10分以上20分未満」のような、ひとつひとつの区間を、何というか。", "データを整理するために区切った、ひとつひとつの区間を「階級」という。"],
  ["階級の幅", "データを整理するために区切った区間の、幅（たとえば「10分以上20分未満」の 10分）を、何というか。", "区間の幅を「階級の幅」という（「10分以上20分未満」なら 10分）。"],
  ["階級の幅", "データを「0点以上5点未満」「5点以上10点未満」…のように区切るとき、区間の幅（5点）にあたるものを、何というか。", "区間の幅を「階級の幅」という（「5点以上10点未満」なら 5点）。"],
  ["度数", "各階級に入るデータの個数を、何というか。", "各階級に入るデータの個数を「度数」という。"],
  ["度数", "「15分以上20分未満の階級に 8人」というときの、8人にあたるものを、何というか。", "各階級に入るデータの個数（人数）を「度数」という。"],
  ["度数分布表", "階級ごとに度数をまとめた表を、何というか。", "階級ごとに度数をまとめた表を「度数分布表」という。"],
  ["度数分布表", "データを階級に分けて、階級ごとの度数をならべた表を、何というか。", "データを階級に分けて、階級ごとの度数をまとめた表を「度数分布表」という。"],
];

export const UNITS = [
  unit("01", {
    name: "度数分布表（階級・度数）",
    desc: "データを階級に分けて、度数分布表に整理する",
    prereqs: ["E6-data"],
    points: [
      "データを整理するために区切った区間を階級、区間の幅を階級の幅、各階級に入るデータの個数を度数という。階級ごとに度数をまとめた表が、度数分布表。",
      "「10分以上15分未満」の階級には、10分はふくまれ、15分はふくまれない。ちょうど 15分のデータは、次の階級に入る。",
      "度数の合計が、データ全体の個数（人数）。「全体の何%か」は、（その階級の度数）÷（度数の合計）を百分率にして求める。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 01d01 20人のボール投げ → 度数分布表（1 つの階級の度数）
        t("01d01", (r) => {
          const s = setup(r), n = r(16, 24), data = genData(r, n, s.cls), f = freqs(data, s.cls);
          const j = r(0, s.k - 1), ans = f[j];
          if (ans === 0) return { skip: true };
          const inCls = data.filter((x) => x >= s.cls[j].lo && x < s.cls[j].hi);
          return {
            q: `${n}人の${s.c.name}（${s.u}）を調べたら、次のとおりだった。［${listData(data)}］　階級の幅を${s.w}${s.u}にして、${s.cls[0].lo}${s.u}以上から順に区切り、度数分布表に整理する。「${lab(s.cls[j], s.u)}」の階級の度数は？`,
            ans,
            unit: "人",
            hint: "数え落としを防ぐには、データにどんな印をつけながら数えたらいいかな。ちょうどさかいの値のデータは、どちらの階級に入るかな。",
            steps: [`「${lab(s.cls[j], s.u)}」に入るデータを、1つずつ拾う。`, `${inCls.join("、")}の${ans}個。度数は${ans}（人）。`],
          };
        }),
        // 01d02a 階級の幅
        t("01d02a", (r) => {
          const s = setup(r), j = r(0, s.k - 3);
          const three = s.cls.slice(j, j + 3).map((c) => lab(c, s.u)).join("、");
          return {
            q: `${s.c.name}（${s.u}）の度数分布表の階級が、${three}、…のように区切られている。階級の幅は？`,
            ans: s.w,
            unit: s.u,
            hint: "階級の幅は、ひとつの階級の上のはしと下のはしを使って、どう求めるかな。",
            steps: [`${s.cls[j].hi}${s.u}−${s.cls[j].lo}${s.u} ＝ ${s.w}${s.u}`, `階級の幅は ${s.w}${s.u}。`],
          };
        }),
        // 01d02b 度数がもっとも多い（少ない）階級
        t("01d02b", (r) => {
          const s = setup(r), n = r(16, 24), f = freqs(genData(r, n, s.cls), s.cls);
          const most = r(0, 4) > 0;   // 多いほうを 4/5
          if (!(most ? uniqMax(f) : uniqMin(f))) return { skip: true };
          const target = most ? Math.max(...f) : Math.min(...f);
          const j = f.indexOf(target);
          const wrongs = nearOrder(f, j).slice(0, 3).map((i) => lab(s.cls[i], s.u));
          const ans = lab(s.cls[j], s.u);
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${freqSentence(s.cls, f, s.u)}である。度数がもっとも${most ? "多い" : "少ない"}階級は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: `表の中で、人数がいちばん${most ? "多い" : "少ない"}のは、どの階級かな。`,
            steps: [`度数は、${f.map((v, i) => `${v}`).join("、")}（人）。`, `${most ? "もっとも多い" : "もっとも少ない"}のは ${target}人の「${ans}」。`],
          };
        }),
        // 01d02c ちょうどさかいの値は、どの階級に入るか
        t("01d02c", (r) => {
          const s = setup(r), edge = r(0, 9) < 7;
          const j = edge ? r(1, s.k - 1) : r(0, s.k - 1);
          const x = edge ? s.cls[j].lo : s.cls[j].lo + r(1, s.w - 1);
          const ans = lab(s.cls[j], s.u);
          const wrongs = nearIdx(j, s.k).map((i) => lab(s.cls[i], s.u));
          return {
            q: `${s.c.name}（${s.u}）を、${s.cls[0].lo}${s.u}以上から、幅${s.w}${s.u}で区切って階級に分ける。${s.c.name}が ${x}${s.u}の人は、どの階級に入るか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "この数は、どの階級の「以上」と「未満」の間にあるかな。ちょうどさかいの数のときは、どちらの階級に入るかな。",
            steps: edge
              ? [`${x}${s.u}は、「${x}${s.u}未満」の階級にはふくまれない。`, `${x}${s.u}以上の階級に入る。答えは「${ans}」。`]
              : [`${x}${s.u}は、${s.cls[j].lo}${s.u}以上${s.cls[j].hi}${s.u}未満の間にある。`, `答えは「${ans}」。`],
          };
        }),
        // 01q01 用語（階級・階級の幅・度数・度数分布表）
        t("01q01", (r) => {
          const [ans, q, def] = pick(r, TERMS);
          return {
            q,
            ans,
            choices: choices4(r, ans, ["階級", "階級の幅", "度数", "度数分布表"].filter((x) => x !== ans)),
            hint: "「区間」「区間の幅」「個数」「表」の、どれにあたるかな。",
            steps: [def, `答えは「${ans}」。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 01d03a ○以上の人数
        t("01d03a", (r) => {
          const s = setup(r), n = pick(r, [20, 25, 30, 40]), f = freqs(genData(r, n, s.cls), s.cls);
          const j = r(1, s.k - 1), cnt = sum(f.slice(j));
          if (cnt === 0 || cnt === n) return { skip: true };
          const x = s.cls[j].lo;
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${freqSentence(s.cls, f, s.u)}である。${x}${s.u}以上の人は何人か。`,
            ans: cnt,
            unit: "人",
            hint: "「以上」にふくまれる階級を、すべて探そう。それは、いくつあるかな。（さかいの値は、ふくまれるかな。）",
            steps: [`${x}${s.u}以上の階級は、${s.cls.slice(j).map((c) => `「${lab(c, s.u)}」`).join("・")}。`, tot(f.slice(j))],
          };
        }),
        // 01d03b ○以上の人は全体の何%か
        t("01d03b", (r) => {
          const s = setup(r), n = pick(r, [20, 25, 50]), f = freqs(genData(r, n, s.cls), s.cls);
          const j = r(1, s.k - 1), cnt = sum(f.slice(j));
          if (cnt === 0 || cnt === n) return { skip: true };
          const x = s.cls[j].lo;
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${freqSentence(s.cls, f, s.u)}である。${x}${s.u}以上の人は、全体の何%か。`,
            ans: round((cnt / n) * 100),
            unit: "%",
            hint: "まず、その人数を求めよう。全体の人数は、どうすればわかるかな。割合は、何を何でわって求めるかな。",
            steps: [`${x}${s.u}以上の人は ${tot(f.slice(j))}`, `${cnt}÷${n} ＝ ${round(cnt / n, 4)}　百分率にして ${round((cnt / n) * 100)}%`],
          };
        }),
        // 01d03c 小さい（大きい）ほうから k 番目の人は、どの階級にいるか
        t("01d03c", (r) => {
          const s = setup(r), n = r(16, 24), f = freqs(genData(r, n, s.cls), s.cls);
          const fromSmall = r(0, 1) === 0, k = r(1, n);
          const rank = fromSmall ? k : n - k + 1;   // 小さいほうから数えた順位
          const cu = cumulative(f), j = cu.findIndex((c) => c >= rank);
          const ans = lab(s.cls[j], s.u);
          const wrongs = nearIdx(j, s.k).map((i) => lab(s.cls[i], s.u));
          const cuSteps = fromSmall ? cu : cumulative([...f].reverse());
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${freqSentence(s.cls, f, s.u)}である。${s.c.name}の${fromSmall ? "小さい" : "大きい"}ほうから数えて ${k}番目の人は、どの階級にいるか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: `${fromSmall ? "小さい" : "大きい"}ほうの階級から、度数を順にたしていこう。たした人数が${k}に届くのは、どの階級かな。`,
            steps: fromSmall
              ? [`度数を小さいほうから順にたす：${cu.join("、")}（人）。`, `${k}番目は、たした人数がはじめて ${k} 以上になる「${ans}」。`]
              : [`度数を大きいほうから順にたす：${cuSteps.join("、")}（人）。`, `${k}番目は、たした人数がはじめて ${k} 以上になる「${ans}」。`],
          };
        }),
        // 01d04a 見えない階級の度数
        t("01d04a", (r) => {
          const s = setup(r, 5), n = r(24, 48), f = freqs(genData(r, n, s.cls), s.cls);
          const j = r(0, 4);
          if (f[j] === 0) return { skip: true };
          const rest = f.filter((_, i) => i !== j);
          const sent = s.cls.map((c, i) => `${lab(c, s.u)}が ${i === j ? "ア" : f[i]}人`).join("、");
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${sent}である。アにあてはまる数は？`,
            ans: f[j],
            unit: "人",
            hint: "度数の合計は、何を表しているかな。",
            steps: [`ア ＝ ${n}−(${rest.join("+")})`, `ア ＝ ${n}−${sum(rest)} ＝ ${f[j]}（人）`],
          };
        }),
        // 01d04b ○未満の人は全体の何%か（四捨五入）
        t("01d04b", (r) => {
          const s = setup(r, 5), n = r(24, 48), f = freqs(genData(r, n, s.cls), s.cls);
          const j = r(1, 3), cnt = sum(f.slice(0, j)), x = s.cls[j].lo;
          const ans = pct(cnt, n, 0);
          if (ans === null || cnt === 0 || cnt === n) return { skip: true };
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${freqSentence(s.cls, f, s.u)}である。${x}${s.u}未満の人は、全体の何%か。百分率で、小数第1位を四捨五入して、整数で答えよう。`,
            ans,
            unit: "%",
            hint: "まず、その人数を求めよう。割合は、何を何でわって求めるかな。",
            steps: [`${x}${s.u}未満の人は ${tot(f.slice(0, j))}`, divPct(cnt, n), ...(Math.abs(cnt / n * 100 - ans) < 1e-9 ? [] : [`小数第1位を四捨五入して ${ans}%`])],
          };
        }),
        // 01q02 データを度数分布表に整理 → 1 つの階級の度数（12人の読書時間）
        t("01q02", (r) => {
          const s = setup(r, 3, CTX[2]), n = pick(r, [12, 15, 16, 18]), data = genData(r, n, s.cls), f = freqs(data, s.cls);
          const j = r(0, 2), ans = f[j];
          if (ans === 0) return { skip: true };
          const inCls = data.filter((x) => x >= s.cls[j].lo && x < s.cls[j].hi);
          return {
            q: `${n}人の${s.c.name}（${s.u}）を調べたら、次のとおりだった。［${listData(data)}］　幅${s.w}${s.u}で、${s.cls[0].lo}${s.u}以上から 3つの階級に分けて度数分布表に整理する。「${lab(s.cls[j], s.u)}」の階級の度数は？`,
            ans,
            unit: "人",
            hint: "数え落としを防ぐには、データにどんな印をつけながら数えたらいいかな。ちょうどさかいの値のデータは、どちらの階級に入るかな。",
            steps: [`「${lab(s.cls[j], s.u)}」に入るデータは${inCls.join("、")}。`, `度数は ${ans}（人）。（3つの階級の度数は ${f.join("、")}、合計 ${n}）`],
          };
        }),
        // 01q03 度数がもっとも多い階級（データから）
        t("01q03", (r) => {
          const s = setup(r, 4, CTX[2]), n = pick(r, [14, 15, 16, 18, 20]), data = genData(r, n, s.cls), f = freqs(data, s.cls);
          if (!uniqMax(f)) return { skip: true };
          const j = f.indexOf(Math.max(...f)), ans = lab(s.cls[j], s.u);
          const wrongs = s.cls.map((c, i) => i).filter((i) => i !== j).map((i) => lab(s.cls[i], s.u));
          return {
            q: `${n}人の${s.c.name}（${s.u}）を調べたら、次のとおりだった。［${listData(data)}］　幅${s.w}${s.u}で、${s.cls[0].lo}${s.u}以上から 4つの階級に分けて度数分布表に整理すると、度数がもっとも多い階級はどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "4つの階級に、それぞれ何人入るかな。いちばん多いのはどれかな。",
            steps: [`度数は ${s.cls.map((c, i) => `「${lab(c, s.u)}」${f[i]}人`).join("、")}。`, `もっとも多いのは「${ans}」。`],
          };
        }),
        // 01q04 ○以上の人は全体の何%か（データから、四捨五入）
        t("01q04", (r) => {
          const s = setup(r, 3, CTX[2]), n = pick(r, [12, 15, 16, 18, 24]), data = genData(r, n, s.cls), f = freqs(data, s.cls);
          const j = r(1, 2), cnt = sum(f.slice(j)), x = s.cls[j].lo;
          const ans = pct(cnt, n, 0);
          if (ans === null || cnt === 0 || cnt === n) return { skip: true };
          return {
            q: `${n}人の${s.c.name}（${s.u}）を調べたら、次のとおりだった。［${listData(data)}］　${x}${s.u}以上の人は、全体の何%か。百分率で、小数第1位を四捨五入して、整数で答えよう。`,
            ans,
            unit: "%",
            hint: "まず、その人数を数えよう。割合は、何を何でわって求めるかな。",
            steps: [`${x}${s.u}以上のデータは${data.filter((v) => v >= x).sort((a, b) => a - b).join("、")}の${cnt}個。`, divPct(cnt, n), ...(Math.abs(cnt / n * 100 - ans) < 1e-9 ? [] : [`小数第1位を四捨五入して ${ans}%`])],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 01d05 満点の人が入る階級をふやす
        t("01d05", (r) => {
          const mx = pick(r, [20, 25, 30, 40, 50, 60, 80, 100]);
          const w = pick(r, [5, 10, 20, 25].filter((x) => mx % x === 0 && mx / x >= 3 && mx / x <= 10));
          const k = mx / w;
          return {
            q: `${mx}点満点のテストの得点を、階級の幅${w}点で、「0点以上${w}点未満」から「${mx - w}点以上${mx}点未満」まで、全部で${k}個の階級に分けた。満点の ${mx}点の人は、どの階級にも入らない。階級を 1つふやして、満点の人も入るようにする。ふやす階級を「□点以上○点未満」とする（幅は同じ）。○にあてはまる数は？`,
            ans: mx + w,
            unit: "点",
            hint: "「未満」には、その数がふくまれない。満点の人が入るのは、何点以上の階級かな。階級の幅は、これまでと同じにそろえる。",
            steps: [`${mx}点は、「${mx}点未満」の階級に入らない。${mx}点が入るのは「${mx}点以上」の階級。`, `幅は ${w}点だから「${mx}点以上${mx + w}点未満」。○ ＝ ${mx}+${w} ＝ ${mx + w}`],
          };
        }),
        // 01d06 イの度数はアの度数の 2 倍
        t("01d06", (r) => pairQ(r, { k: 5, ratios: [2, 3], mul: "イ" })),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 01d07 30 分以上は全体の 15% → ア・イ
        t("01d07", (r) => {
          const s = setup(r, 4, CTX[1]);
          const n = pick(r, [40, 50, 60, 80, 100]), p = pick(r, [5, 10, 15, 20, 25]);
          const last = (n * p) / 100;
          if (!Number.isInteger(last) || last < 2) return { skip: true };
          const pa = r(0, 2);   // ア の階級（最後の階級は イ）
          const f = [0, 0, 0, last];
          let left = n - last;
          const others = [0, 1, 2].filter((i) => i !== pa);
          f[others[0]] = r(Math.max(2, Math.floor(left * 0.15)), Math.max(3, Math.floor(left * 0.4)));
          f[others[1]] = r(Math.max(2, Math.floor(left * 0.15)), Math.max(3, Math.floor(left * 0.4)));
          f[pa] = n - last - f[others[0]] - f[others[1]];
          if (f[pa] < 1) return { skip: true };
          const sent = s.cls.map((c, i) => `${lab(c, s.u)}が ${i === pa ? "ア" : i === 3 ? "イ" : f[i]}人`).join("、");
          const ask = pick(r, ["ア", "イ"]);
          const x = s.cls[3].lo;
          const kn = [others[0], others[1]].sort().map((i) => f[i]);
          return {
            q: `${n}人の${s.c.name}（${s.u}）の度数分布表は、${sent}である。${x}${s.u}以上の人は、全体の${p}%である。${ask}の度数は？`,
            ans: ask === "ア" ? f[pa] : last,
            unit: "人",
            hint: "問題文の「以上」にふくまれる階級は、どれかな。その階級の人数は、全体の人数の何%にあたるかを考えよう。",
            steps: [`${x}${s.u}以上は、「${lab(s.cls[3], s.u)}」だけ。イ ＝ ${n}×${p / 100} ＝ ${last}（人）`, `ア ＝ ${n}−(${[...kn, last].join("+")}) ＝ ${f[pa]}（人）`, `${ask}の度数は${ask === "ア" ? f[pa] : last}（人）。`],
          };
        }),
        // 01d08 A さんは、速い（小さい）ほうから何番目から何番目の間か
        t("01d08", (r) => {
          const k = 5, n = r(36, 48), lo10 = pick(r, [70, 75, 80]);
          // 階級を 0.5 秒きざみ（10倍した整数で持つ）
          const cls = Array.from({ length: k }, (_, i) => ({ lo: lo10 + 5 * i, hi: lo10 + 5 * (i + 1) }));
          const f = freqs(Array.from({ length: n }, () => lo10 + Math.floor((r(0, 24) + r(0, 24)) / 2)), cls);
          const j = r(1, 3);
          if (f[j] < 2) return { skip: true };
          const x10 = cls[j].lo + r(1, 4);
          const cu = cumulative(f), from = (j ? cu[j - 1] : 0) + 1, to = cu[j];
          const L = (v) => (v / 10).toFixed(1);
          const sent = cls.map((c, i) => `${L(c.lo)}秒以上${L(c.hi)}秒未満が ${f[i]}人`).join("、");
          const askFrom = r(0, 1) === 0;
          return {
            q: `${n}人の50m走の記録の度数分布表は、${sent}である。Aさんの記録は${L(x10)}秒だった。Aさんは、速いほうから数えて、□番目から△番目の間にいる。${askFrom ? "□" : "△"}にあてはまる数は？`,
            ans: askFrom ? from : to,
            unit: "番目",
            hint: "Aさんが入る階級にいる人たちの順位は、はっきり決められるかな。その階級より速い人は、何人いるかな。",
            steps: [
              `${L(x10)}秒は、「${L(cls[j].lo)}秒以上${L(cls[j].hi)}秒未満」の階級。`,
              `${L(cls[j].lo)}秒未満は ${tot(f.slice(0, j))}。だから、${from}番目から。`,
              `${L(cls[j].hi)}秒未満は ${from - 1}+${f[j]} ＝ ${to}（人）。だから、${to}番目まで。`,
              `${askFrom ? "□" : "△"} ＝ ${askFrom ? from : to}`,
            ],
          };
        }),
        // 01q05 アの度数はイの度数の 2 倍より 3 人多い（チャレンジ。01d06 より一段むずかしい形）
        t("01q05", (r) => pairQ(r, { k: 4, ratios: [2, 3], mul: "ア", nameCtx: CTX[5], offs: [1, 2, 3, 4] })),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 演習プリント 8問・小テスト 5問のすべてを移した（表をつくる問題は、表の 1 つの階級の度数を聞く形にした）
