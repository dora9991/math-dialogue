// ============================================================
// data-11.js — データの活用 第11時「「データの活用」で学んだことを、整理して確かめよう」（単元のまとめ）
//   ikkan の演習プリント（data-11.dr.1〜8）・小テスト（data-11.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「11」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：11d02c ＝ data-11.dr.2 の中央値（個数が偶数）、11q04 ＝ data-11.qz.4
//   度数分布表・ヒストグラムは、問題文の中で「0分以上10分未満が 6人、…」と文章で言う（stats.js の freqSentence）。
//   平均値・中央値・最頻値・範囲・度数分布表の最頻値・平均値は、stats.js で計算で出す（手で書かない）。
//   ikkan の「ヒストグラムを見て、正しいものをすべて選ぶ」（11d06）は、度数を文章で言い、正しいものを1つ選ぶ4択に直した。
// ============================================================
import { t, pick, choices4, shuffle, sample, round, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, mean, median, modes, range, sorted, classes, clsLabel, freqSentence, cumulative, medianClass, listData, meanFromFreq } from "../stats.js";

const unit = unitFor("data");

// ── 小さな道具 ───────────────────────────────────────────
const dec = (x, d) => Math.abs(x * 10 ** d - Math.round(x * 10 ** d)) < 1e-7;
const shown = (x, d = 4) => {
  const k = 10 ** d, y = Math.floor(x * k + 1e-9) / k;
  return Math.abs(y - x) < 1e-9 ? String(round(y, d)) : `${round(y, d)}…`;
};
/** n回のうち k回（lo≦k÷n≦hi）で、k÷n が小数第 d 位までの小数でぴったり表せる k を選ぶ。なければ null */
const pickK = (r, n, lo, hi, d = 2) => {
  const ks = [];
  for (let k = Math.max(1, Math.ceil(n * lo - 1e-9)); k <= Math.min(n - 1, Math.floor(n * hi + 1e-9)); k++) if (dec(k / n, d)) ks.push(k);
  return ks.length ? pick(r, ks) : null;
};

/** 度数の合計 N を、k 個の階級に分けた度数（相対度数が、小数第2位でぴったり表せる数だけ。どの階級も 1 以上）。
 *  shape：desc＝右へ向かって減る／mound＝山形／any＝ばらばら */
function counts(r, N, k, shape = "mound", exact = true) {
  const step = exact ? N / gcd(N, 100) : 1, U = N / step, u = () => r(0, 1000) / 1000;
  let w;
  if (shape === "desc") { const rho = 0.35 + 0.25 * u(); w = Array.from({ length: k }, (_, i) => rho ** i * (0.8 + 0.4 * u())); }
  else if (shape === "mound") { const c = (k - 1) / 2 + (u() - 0.5), sg = 0.8 + 0.6 * u(); w = Array.from({ length: k }, (_, i) => Math.exp(-((i - c) ** 2) / (2 * sg * sg)) * (0.8 + 0.4 * u())); }
  else w = Array.from({ length: k }, () => 0.3 + u());
  const tot = sum(w), parts = w.map((x) => Math.max(1, Math.round((U * x) / tot)));
  let diff = U - sum(parts);
  while (diff !== 0) {
    const i = parts.indexOf(Math.max(...parts));
    if (diff < 0 && parts[i] <= 1) break;
    parts[i] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return parts.map((x) => x * step);
}

// ── 度数分布表の場面（人数の表） ──────────────────────────────
//   who＝場面の文のはじめ、u＝階級の単位、lo＝階級のはじめの値の候補、w＝階級の幅、k＝階級の数の候補
const TBL = [
  { who: (N) => `ある学校の 1年生 ${N}人の、通学時間を調べたら、`, what: "通学時間", u: "分", lo: [0], w: [10], k: [5] },
  { who: (N) => `${N}人の生徒の、1日の家庭学習の時間を調べたら、`, what: "家庭学習の時間", u: "分", lo: [0], w: [30], k: [5] },
  { who: (N) => `${N}人の生徒の、握力を調べたら、`, what: "握力", u: "kg", lo: [10, 20], w: [10], k: [4, 5] },
  { who: (N) => `${N}人の生徒の、ソフトボール投げの記録を調べたら、`, what: "ソフトボール投げの記録", u: "m", lo: [10, 20], w: [10], k: [4, 5] },
  { who: (N) => `${N}人の生徒の、数学のテストの得点を調べたら、`, what: "テストの得点", u: "点", lo: [20, 30, 40], w: [10], k: [5] },
];
const NP = [20, 25, 40, 50, 40, 50];
/** 場面 C の表をつくる：{ N, cls, f, k, lo, w, sentence } */
function makeTable(r, C, Nopt) {
  const N = Nopt || pick(r, NP), k = pick(r, C.k), lo = pick(r, C.lo), w = pick(r, C.w);
  const cls = classes(lo, w, k), f = counts(r, N, k, "mound");
  return { N, cls, f, k, lo, w, sentence: `${C.who(N)}${freqSentence(cls, f, C.u, "人")}であった。` };
}
/** 度数がいちばん大きい階級が1つだけか */
const uniqueMax = (f) => f.filter((x) => x === Math.max(...f)).length === 1;
const addList = (list) => (list.length > 1 ? `${list.join("+")} ＝ ${sum(list)}` : String(list[0]));

// ── 個々のデータ ─────────────────────────────────────────
//   w＝何のデータか、u＝単位、lo〜hi＝値のはんい
const DCTX = [
  { w: "ソフトボール投げの記録", u: "m", lo: 10, hi: 40 },
  { w: "数学の小テストの得点", u: "点", lo: 2, hi: 10 },
  { w: "1週間に読んだ本の冊数", u: "冊", lo: 1, hi: 12 },
  { w: "通学にかかる時間", u: "分", lo: 5, hi: 35 },
  { w: "けん玉が続いた回数", u: "回", lo: 1, hi: 25 },
];
/** n 個のデータ（lo〜hi）。meanDec＝平均値が小数第何位までの小数でぴったり表せるか（null なら不問）。uniqueMode＝最頻値が1つだけ（2回以上）。なければ null */
function genData(r, n, lo, hi, { meanDec = null, uniqueMode = false } = {}) {
  for (let i = 0; i < 400; i++) {
    const a = Array.from({ length: n }, () => r(lo, hi));
    if (new Set(a).size < 3) continue;
    if (meanDec != null && !dec(mean(a), meanDec)) continue;
    if (uniqueMode) { const m = modes(a); if (m.length !== 1 || a.filter((x) => x === m[0]).length < 2) continue; }
    return a;
  }
  return null;
}
/** 個数 n のデータの問題文のはじめ */
const dataQ = (C, n, arr) => `ある学級の ${n}人の、${C.w}（${C.u}）を調べたら、次のようになった。${listData(arr)}　`;

// ── 確率（第9時と同じ型） ─────────────────────────────────
const TRY = [
  { n: [200, 250, 400, 500, 800, 1000], lo: 0.3, hi: 0.7, f: (n, k) => `ある画びょうを ${n}回投げたら、針が上向きになったのは ${k}回だった。`, ev: "針が上向きになる確率", g: (N) => `この画びょうを ${N}回投げると、針が上向きになるのは、およそ何回と予想できるか。`, u: "回" },
  { n: [200, 250, 400, 500, 800, 1000], lo: 0.3, hi: 0.7, f: (n, k) => `あるボタンを ${n}回投げたら、表が ${k}回出た。`, ev: "表が出る確率", g: (N) => `このボタンを ${N}回投げると、表が出るのは、およそ何回と予想できるか。`, u: "回" },
  { n: [100, 200, 250, 400, 500, 1000], lo: 0.04, hi: 0.3, f: (n, k) => `あるくじを ${n}回引いたら、当たりが ${k}回出た。`, ev: "当たる確率", g: (N) => `このくじを ${N}回引くと、当たりは、およそ何回出ると予想できるか。`, u: "回" },
  { n: [20, 40, 50, 80, 100, 200], lo: 0.3, hi: 0.8, f: (n, k) => `ある選手がシュートを ${n}本打って、${k}本入れた。`, ev: "シュートが入る確率", g: (N) => `この選手が ${N}本シュートを打つと、およそ何本入ると予想できるか。`, u: "本" },
  { n: [100, 200, 250, 400, 500], lo: 0.6, hi: 0.95, f: (n, k) => `ある植物の種を ${n}粒まいたら、${k}粒が発芽した。`, ev: "発芽する確率", g: (N) => `この種を ${N}粒まくと、およそ何粒が発芽すると予想できるか。`, u: "粒" },
];

// ── 2つの集団を合わせた平均値 ─────────────────────────────
//   a・b＝2つの集団の名前、n1・n2＝人数のはんい、m＝平均値のはんい（0.1 きざみ）
const GM = [
  { a: "男子", b: "女子", what: "体重", u: "kg", un: "人", m: [350, 550], n: [10, 30], f: (n1, m1, n2, m2) => `男子 ${n1}人の体重の平均値は ${m1}kg、女子 ${n2}人の体重の平均値は ${m2}kg である。この ${n1 + n2}人の、体重の平均値を求めよう。` },
  { a: "A組", b: "B組", what: "50m走の記録", u: "秒", un: "人", m: [75, 95], n: [10, 30], f: (n1, m1, n2, m2) => `A組 ${n1}人の、50m走の記録の平均値は ${m1}秒、B組 ${n2}人の平均値は ${m2}秒であった。2つの組を合わせた ${n1 + n2}人の、平均値を求めよう。` },
  { a: "A組", b: "B組", what: "数学のテストの得点", u: "点", un: "人", m: [550, 800], n: [10, 30], f: (n1, m1, n2, m2) => `数学のテストで、A組 ${n1}人の平均点は ${m1}点、B組 ${n2}人の平均点は ${m2}点であった。2つの組を合わせた ${n1 + n2}人の、平均点を求めよう。` },
  { a: "1班", b: "2班", what: "ソフトボール投げの記録", u: "m", un: "人", m: [150, 300], n: [10, 30], f: (n1, m1, n2, m2) => `ソフトボール投げの記録は、1班 ${n1}人の平均値が ${m1}m、2班 ${n2}人の平均値が ${m2}m であった。2つの班を合わせた ${n1 + n2}人の、平均値を求めよう。` },
];
/** 2つの集団を合わせた平均値の問題の本体（ctxs＝使う場面）。答えが小数第2位までで表せる組だけ選ぶ */
function groupMean(r, ctxs) {
  const C = pick(r, ctxs);
  for (let i = 0; i < 200; i++) {
    const n1 = r(C.n[0], C.n[1]), n2 = r(C.n[0], C.n[1]), M1 = r(C.m[0], C.m[1]), M2 = r(C.m[0], C.m[1]);
    if (n1 === n2 || Math.abs(M1 - M2) < 3) continue;
    const ans = round((n1 * M1 + n2 * M2) / (10 * (n1 + n2)));
    if (!dec(ans, 2) || Math.abs(ans - (M1 + M2) / 20) < 0.04) continue;
    const m1 = M1 / 10, m2 = M2 / 10, s1 = round(n1 * m1, 4), s2 = round(n2 * m2, 4), tot = round(s1 + s2, 4);
    return {
      q: C.f(n1, m1, n2, m2),
      ans,
      unit: C.u,
      hint: "（平均値）×（人数）で、それぞれの合計がわかる。2つの平均値を平均しても、全体の平均値にはならないよ。",
      steps: [`${C.a}の合計 ＝ ${m1}×${n1} ＝ ${s1}（${C.u}）　${C.b}の合計 ＝ ${m2}×${n2} ＝ ${s2}（${C.u}）`, `全体の合計 ＝ ${s1}+${s2} ＝ ${tot}（${C.u}）`, `平均値 ＝ ${tot}÷${n1 + n2} ＝ ${ans}（${C.u}）`, `（${m1} と ${m2} の平均 ${round((m1 + m2) / 2, 4)} ではない）`],
    };
  }
  return { skip: true };
}

export const UNITS = [
  unit("11", {
    name: "「データの活用」のまとめ",
    desc: "度数分布表・代表値・範囲・相対度数・累積相対度数・確率を整理して確かめる",
    prereqs: ["J1-dk10", "J1-d3"],
    points: [
      "度数分布表は、階級ごとの度数をまとめた表。度数分布表の最頻値は、度数がいちばん多い階級の階級値。平均値は、（階級値×度数）の合計 ÷ 度数の合計 で求めるおよその値。",
      "代表値は、平均値・中央値・最頻値。ちらばりは、範囲 ＝ 最大値 − 最小値。中央値は、小さい順に並べたまん中の値（個数が偶数のときは、まん中の2つの平均）。",
      "相対度数 ＝ 度数 ÷ 度数の合計。最初の階級から順にたした相対度数が累積相対度数。多数回の実験で相対度数が近づく値を、確率として用いる。",
      "2つの組を合わせた平均値は、2つの平均値を平均するのではなく、（合計）÷（人数）で求める。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 11d01a (1)① 度数分布表（40人の通学時間）：相対度数・累積相対度数
        t("11d01a", (r) => {
          const C = pick(r, TBL), T = makeTable(r, C), cum = r(0, 1) === 1, j = cum ? r(1, T.k - 2) : r(0, T.k - 1);
          const lab = clsLabel(T.cls[j], C.u);
          if (!cum) {
            const ans = round(T.f[j] / T.N);
            return {
              q: `${T.sentence}${lab}の階級の相対度数を求めよう。`,
              ans,
              hint: "相対度数は、（その階級の度数）÷（度数の合計）。",
              steps: ["相対度数 ＝ 度数 ÷ 度数の合計", `${T.f[j]}÷${T.N} ＝ ${ans}`],
            };
          }
          const S = sum(T.f.slice(0, j + 1)), ans = round(S / T.N);
          return {
            q: `${T.sentence}${lab}の階級の累積相対度数を求めよう。（累積相対度数は、最初の階級からその階級まで、相対度数をたしたもの）`,
            ans,
            hint: "最初の階級から、その階級までの度数をたして、度数の合計でわってもよい。",
            steps: ["累積相対度数 ＝ 最初の階級からその階級までの度数の合計 ÷ 度数の合計", `${addList(T.f.slice(0, j + 1))}　→　${S}÷${T.N} ＝ ${ans}`],
          };
        }),
        // 11d01b (1)② 最頻値（度数がいちばん多い階級の階級値）
        t("11d01b", (r) => {
          const C = pick(r, TBL);
          let T = null;
          for (let i = 0; i < 30 && !T; i++) { const x = makeTable(r, C); if (uniqueMax(x.f)) T = x; }
          if (!T) return { skip: true };
          const m = T.f.indexOf(Math.max(...T.f)), ans = T.cls[m].mid;
          return {
            q: `${T.sentence}この度数分布表の、最頻値を求めよう。`,
            ans,
            unit: C.u,
            hint: "度数分布表の最頻値は、度数がいちばん多い階級の、階級値。階級値は、階級のまん中の値。",
            steps: [`度数がいちばん多いのは ${clsLabel(T.cls[m], C.u)}の階級（${T.f[m]}人）。`, `階級値 ＝ (${T.cls[m].lo}+${T.cls[m].hi})÷2 ＝ ${ans}`, `最頻値は ${ans}${C.u}。`],
          };
        }),
        // 11d01c (1)③ 30分未満の人の割合
        t("11d01c", (r) => {
          const C = pick(r, TBL), T = makeTable(r, C), j = r(1, T.k - 1), S = sum(T.f.slice(0, j)), ans = round(S / T.N), x = T.lo + j * T.w;
          return {
            q: `${T.sentence}${x}${C.u}未満の人の割合を、小数で求めよう。`,
            ans,
            hint: "「未満」の割合は、その値より下の階級の度数をたして、度数の合計でわる。累積相対度数を使ってもよい。",
            steps: [`${x}${C.u}未満は、最初の階級から ${clsLabel(T.cls[j - 1], C.u)}の階級まで。`, `${addList(T.f.slice(0, j))}　→　${S}÷${T.N} ＝ ${ans}`],
          };
        }),
        // 11d02a (2) 平均値
        t("11d02a", (r) => {
          const C = pick(r, DCTX), n = pick(r, [5, 6, 7, 8, 9]), a = genData(r, n, C.lo, C.hi, { meanDec: 1 });
          if (!a) return { skip: true };
          const s = sum(a), ans = round(mean(a));
          return {
            q: `${dataQ(C, n, sorted(a))}このデータの、平均値を求めよう。`,
            ans,
            unit: C.u,
            hint: "平均値は、データの合計 ÷ データの個数。",
            steps: ["平均値 ＝ データの合計 ÷ データの個数", `(${sorted(a).join("+")})÷${n} ＝ ${s}÷${n} ＝ ${ans}`],
          };
        }),
        // 11d02b (2) 中央値（個数が奇数）
        t("11d02b", (r) => {
          const C = pick(r, DCTX), n = pick(r, [5, 7, 9]), a = genData(r, n, C.lo, C.hi);
          if (!a) return { skip: true };
          const s = sorted(a), ans = median(a);
          return {
            q: `${dataQ(C, n, s)}（小さい順にならべてある）このデータの、中央値を求めよう。`,
            ans,
            unit: C.u,
            hint: "中央値は、小さい順にならべたとき、まん中にくる値。データは何個あるかな。",
            steps: [`${n}個だから、まん中は ${(n + 1) / 2}番目。`, `${(n + 1) / 2}番目の値は ${ans}。`, `中央値は ${ans}${C.u}。`],
          };
        }),
        // 11d02d (2) 最頻値
        t("11d02d", (r) => {
          const C = pick(r, DCTX), n = pick(r, [7, 8, 9, 10]), a = genData(r, n, C.lo, C.hi, { uniqueMode: true });
          if (!a) return { skip: true };
          const m = modes(a)[0], c = a.filter((x) => x === m).length;
          return {
            q: `${dataQ(C, n, shuffle(r, a))}このデータの、最頻値を求めよう。`,
            ans: m,
            unit: C.u,
            hint: "最頻値は、データの中で、いちばん多く出てくる値。",
            steps: [`同じ値を数えると、${m}が ${c}回で、いちばん多い。`, `最頻値は ${m}${C.u}。`],
          };
        }),
        // 11d02e (2) 範囲
        t("11d02e", (r) => {
          const C = pick(r, DCTX), n = pick(r, [6, 7, 8, 9]), a = genData(r, n, C.lo, C.hi);
          if (!a) return { skip: true };
          const ans = range(a);
          return {
            q: `${dataQ(C, n, shuffle(r, a))}このデータの、範囲を求めよう。`,
            ans,
            unit: C.u,
            hint: "範囲は、データのちらばりを表す。最大値と最小値をさがそう。",
            steps: ["範囲 ＝ 最大値 − 最小値", `${Math.max(...a)}−${Math.min(...a)} ＝ ${ans}`],
          };
        }),
        // 11d03a (3)① 画びょうを 800回投げて上向きが 336回 → 確率
        t("11d03a", (r) => {
          const C = pick(r, TRY), n = pick(r, C.n), k = pickK(r, n, C.lo, C.hi, 2);
          if (k == null) return { skip: true };
          const p = round(k / n);
          return {
            q: `${C.f(n, k)}${C.ev}を、小数で求めよう。`,
            ans: p,
            hint: "確率は、（起こった回数）÷（全体の回数）で求める。",
            steps: ["確率 ＝ 起こった回数 ÷ 全体の回数", `${k}÷${n} ＝ ${p}`],
          };
        }),
        // 11q01a 次の 7個のデータの平均値
        t("11q01a", (r) => {
          const n = pick(r, [5, 6, 7, 7, 8]), a = genData(r, n, 1, 20, { meanDec: 1 });
          if (!a) return { skip: true };
          const s = sorted(a), ans = round(mean(a));
          return {
            q: `次の ${n}個のデータの、平均値を求めよう。${listData(s)}`,
            ans,
            hint: "平均値は、データの合計 ÷ データの個数。",
            steps: ["平均値 ＝ データの合計 ÷ データの個数", `(${s.join("+")})÷${n} ＝ ${sum(a)}÷${n} ＝ ${ans}`],
          };
        }),
        // 11q01b 次の 7個のデータの中央値
        t("11q01b", (r) => {
          const n = pick(r, [5, 7, 7, 9]), a = genData(r, n, 1, 20);
          if (!a) return { skip: true };
          const s = sorted(a), ans = median(a);
          return {
            q: `次の ${n}個のデータの、中央値を求めよう。（小さい順にならべてある）${listData(s)}`,
            ans,
            hint: "中央値は、小さい順にならべたときの、まん中の値。",
            steps: [`${n}個だから、まん中は ${(n + 1) / 2}番目。`, `中央値は ${ans}。`],
          };
        }),
        // 11q02 度数の合計が 40 で、相対度数が 0.35 → 度数
        t("11q02", (r) => {
          const N = pick(r, [20, 25, 40, 50, 80, 100, 200]), pps = [];
          for (let pp = 5; pp <= 60; pp++) if ((N * pp) % 100 === 0) pps.push(pp);
          const pp = pick(r, pps), p = pp / 100, ans = (N * pp) / 100;
          return {
            q: `度数の合計が ${N}人の度数分布表で、ある階級の相対度数が ${p} のとき、その階級の度数は何人か。`,
            ans,
            unit: "人",
            hint: "相対度数 ＝ 度数 ÷ 度数の合計。このしくみを逆にたどろう。",
            steps: ["相対度数 ＝ 度数 ÷ 度数の合計 だから、度数 ＝ 度数の合計 × 相対度数", `${N}×${p} ＝ ${ans}`, `度数は ${ans}人。`],
          };
        }),
        // 11q03 ボタンを 600回投げたら表が 258回 → 確率
        t("11q03", (r) => {
          const C = pick(r, [
            { n: [200, 250, 400, 500, 600, 800], lo: 0.3, hi: 0.7, f: (n, k) => `あるボタンを ${n}回投げたら、表が ${k}回出た。`, ev: "表が出る確率" },
            { n: [200, 250, 400, 500, 600, 800], lo: 0.3, hi: 0.7, f: (n, k) => `ペットボトルのキャップを ${n}回投げたら、上向きが ${k}回だった。`, ev: "上向きになる確率" },
            { n: [100, 200, 250, 400, 500], lo: 0.1, hi: 0.6, f: (n, k) => `あるガチャを ${n}回回したら、レアが ${k}回出た。`, ev: "レアが出る確率" },
          ]);
          const n = pick(r, C.n), k = pickK(r, n, C.lo, C.hi, 2);
          if (k == null) return { skip: true };
          const p = round(k / n);
          return {
            q: `${C.f(n, k)}${C.ev}を、小数で求めよう。`,
            ans: p,
            hint: "確率は、（起こった回数）÷（全体の回数）で求める。",
            steps: ["確率 ＝ 起こった回数 ÷ 全体の回数", `${k}÷${n} ＝ ${p}`],
          };
        }),
        // 11q04 20人の握力。30kg未満の人の割合
        t("11q04", (r) => {
          const C = pick(r, TBL), T = makeTable(r, C, pick(r, [20, 25, 40, 50])), j = r(1, T.k - 1), S = sum(T.f.slice(0, j)), x = T.lo + j * T.w;
          const ans = round((S / T.N) * 100);
          if (!dec(ans, 1)) return { skip: true };
          return {
            q: `${T.sentence}${x}${C.u}未満の人は、全体の何%か。`,
            ans,
            unit: "%",
            hint: "「未満」の人数をたして、全体の人数でわる。割合を百分率になおそう。",
            steps: [`${x}${C.u}未満は、最初の階級から ${clsLabel(T.cls[j - 1], C.u)}の階級まで。`, `${addList(T.f.slice(0, j))}　→　${S}÷${T.N} ＝ ${round(S / T.N)}`, `${round(S / T.N)}×100 ＝ ${ans}（%）`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 11d01d (1)④ 中央値がふくまれる階級
        t("11d01d", (r) => {
          const C = pick(r, TBL);
          let T = null, mc = null;
          for (let i = 0; i < 40 && T == null; i++) { const x = makeTable(r, C, pick(r, [25, 30, 40, 50])), m = medianClass(x.f); if (m != null) { T = x; mc = m; } }
          if (!T) return { skip: true };
          const labs = T.cls.map((c) => clsLabel(c, C.u)), mi = T.f.indexOf(Math.max(...T.f)), mid = Math.floor(T.k / 2);
          const ans = labs[mc], cu = cumulative(T.f), N = T.N;
          return {
            q: `${T.sentence}中央値がふくまれる階級は、どれか。`,
            ans,
            choices: choices4(r, ans, [labs[mi], labs[mid], ...labs.filter((_, i) => i !== mc)]),
            hint: "中央値は、小さいほうから数えて、まん中にくる人の値。何番目の人かを考えて、累積度数で、どの階級に入るかをさがそう。",
            steps: N % 2
              ? [`${N}人だから、中央値は ${(N + 1) / 2}番目の人の値。`, `累積度数は ${cu.join("、")}（人）。`, `${(N + 1) / 2}番目の人は、${ans}の階級にいる。`]
              : [`${N}人だから、中央値は ${N / 2}番目と ${N / 2 + 1}番目の人の値の平均。`, `累積度数は ${cu.join("、")}（人）。`, `${N / 2}番目も ${N / 2 + 1}番目も、${ans}の階級にいる。`],
          };
        }),
        // 11d02c (2) 中央値（個数が偶数）
        t("11d02c", (r) => {
          const C = pick(r, DCTX), n = pick(r, [6, 8, 10]), a = genData(r, n, C.lo, C.hi);
          if (!a) return { skip: true };
          const s = sorted(a), ans = median(a), x = s[n / 2 - 1], y = s[n / 2];
          return {
            q: `${dataQ(C, n, shuffle(r, a))}このデータの、中央値を求めよう。`,
            ans,
            unit: C.u,
            hint: "まず、小さい順にならべかえよう。個数が偶数のときの中央値は、どうやって求めたかな。",
            steps: [`小さい順にならべる：${s.join("、")}`, `${n}個だから、${n / 2}番目の ${x} と ${n / 2 + 1}番目の ${y} の平均。`, `(${x}+${y})÷2 ＝ ${ans}（${C.u}）`],
          };
        }),
        // 11d03b (3)② 336/800 → 5000回投げると上向きはおよそ何回
        t("11d03b", (r) => {
          const C = pick(r, TRY), n = pick(r, C.n), k = pickK(r, n, C.lo, C.hi, 2), N = pick(r, [1000, 2000, 3000, 4000, 5000]);
          if (k == null || (N * k) % n !== 0) return { skip: true };
          const p = round(k / n), ans = (N * k) / n;
          return {
            q: `${C.f(n, k)}${C.g(N)}`,
            ans,
            unit: C.u,
            hint: "まず、起こった回数から確率を求める。その確率を使って、回数を予想しよう。",
            steps: [`確率 ＝ ${k}÷${n} ＝ ${p}`, `${N}×${p} ＝ ${ans}`, `およそ ${ans}${C.u}。`],
          };
        }),
        // 11d04 (4) ペットを飼っている人の割合が大きいのは、どちらの組か
        t("11d04", (r) => {
          const G = pick(r, [["A組", "B組"], ["1組", "2組"], ["A組", "B組"], ["男子", "女子"]]);
          const AT = pick(r, ["ペットを飼っている", "自転車で通学している", "朝食を毎日食べている", "部活動に入っている", "兄や姉がいる"]);
          let n1, k1, n2, k2, ok = false;
          for (let i = 0; i < 200 && !ok; i++) {
            n1 = pick(r, [20, 25, 40, 50]); n2 = pick(r, [20, 25, 40, 50]);
            k1 = pickK(r, n1, 0.2, 0.8, 3); k2 = pickK(r, n2, 0.2, 0.8, 3);
            if (n1 === n2 || k1 == null || k2 == null) continue;
            const d = k1 / n1 - k2 / n2, top = k1 > k2 ? 0 : 1;
            if (Math.abs(d) >= 0.03 && (d > 0 ? 0 : 1) !== top && k1 !== k2) ok = true;
          }
          if (!ok) return { skip: true };
          const r1 = k1 / n1, r2 = k2 / n2, ans = r1 > r2 ? G[0] : G[1];
          return {
            q: `${AT}人は、${G[0]}（${n1}人）が ${k1}人、${G[1]}（${n2}人）が ${k2}人である。${AT}人の割合が大きいのは、どちらか。`,
            ans,
            choices: choices4(r, ans, [G[0] === ans ? G[1] : G[0], "どちらも同じ", "人数がちがうので、くらべられない"]),
            hint: "人数がちがうとき、人数そのものでくらべてよいかな。何でくらべるとよいだろう。",
            steps: ["人数がちがうので、相対度数（割合）でくらべる。", `${G[0]} … ${k1}÷${n1} ＝ ${round(r1)}　${G[1]} … ${k2}÷${n2} ＝ ${round(r2)}`, `${ans}のほうが、割合が大きい。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 11d05 (5) 階級値を使って、平均値を求める（およその値）
        t("11d05", (r) => {
          const C = pick(r, TBL);
          let T = null, ans = null;
          for (let i = 0; i < 100 && !T; i++) {
            const x = makeTable(r, C, pick(r, [20, 25, 40, 50])), m = meanFromFreq(x.cls, x.f);
            if (dec(m, 2)) { T = x; ans = round(m); }
          }
          if (!T) return { skip: true };
          const mids = T.cls.map((c) => c.mid), terms = mids.map((m, i) => `${m}×${T.f[i]}`).join("+"), tot = sum(mids.map((m, i) => m * T.f[i]));
          return {
            q: `${T.sentence}階級値を使って、${T.N}人の${C.what}の平均値を求めよう。（およその値）`,
            ans,
            unit: C.u,
            hint: "度数分布表の平均値は、（階級値×度数）をぜんぶたして、度数の合計でわる。階級値は、階級のまん中の値。",
            steps: [`階級値は ${mids.join("、")}（${C.u}）`, `(${terms})÷${T.N} ＝ ${tot}÷${T.N} ＝ ${ans}`, `およそ ${ans}${C.u}。`],
          };
        }),
        // 11d06 (6) 28人のスマホの使用時間のヒストグラム → 正しいものはどれか
        t("11d06", (r) => {
          const C = pick(r, [
            { what: "1日のスマホの使用時間", u: "時間", lo: 0, w: 1 },
            { what: "1日の家庭学習の時間", u: "分", lo: 0, w: 30 },
            { what: "通学にかかる時間", u: "分", lo: 0, w: 10 },
          ]);
          const N = pick(r, [20, 24, 25, 28, 30, 32, 36, 40]), k = 5, cls = classes(C.lo, C.w, k), labs = cls.map((c) => clsLabel(c, C.u));
          // 条件に合う度数分布をさがす：最頻値の階級が1つ／中央値の階級が決まる／最頻値と度数の数がちがう／最後の階級の割合が 5% 以上
          let f = null, mc = null, j = 1, tl = 0, share = 0, Pt = 0;
          for (let i = 0; i < 200 && !f; i++) {
            const g = counts(r, N, k, "mound", false), m = medianClass(g), mi0 = g.indexOf(Math.max(...g));
            if (m == null || !uniqueMax(g) || g[mi0] === cls[mi0].mid) continue;
            const jj = r(1, 2), t0 = sum(g.slice(k - jj)), sh = (t0 / N) * 100;
            if (Math.floor(sh / 5) * 5 < 5) continue;
            f = g; mc = m; j = jj; tl = t0; share = sh; Pt = Math.floor(sh / 5) * 5;
          }
          if (!f) return { skip: true };
          const mi = f.indexOf(Math.max(...f)), cu = cumulative(f), x = cls[k - j].lo;
          const Qf = Pt + 5 - share < 1 ? Pt + 10 : Pt + 5;
          const others0 = labs.map((_, i) => i).filter((i) => i !== mc);
          // 4種類のことがら：人数／最頻値／中央値の階級／割合。そのうち1つだけが正しい
          const T4 = {
            N: { t: `人数は ${N}人である。`, f: `人数は ${N + pick(r, [-3, -2, 2, 3])}人である。` },
            M: { t: `最頻値は ${cls[mi].mid}${C.u}である。`, f: `最頻値は ${f[mi]}${C.u}である。` },
            D: { t: `中央値は、${labs[mc]}の階級にある。`, f: `中央値は、${labs[pick(r, others0)]}の階級にある。` },
            P: { t: `${x}${C.u}以上の人は、全体の ${Pt}% 以上である。`, f: `${x}${C.u}以上の人は、全体の ${Qf}% 以上である。` },
          };
          const keys = ["N", "M", "D", "P"], tk = pick(r, keys), ans = T4[tk].t;
          const others = keys.filter((kk) => kk !== tk).map((kk) => T4[kk].f);
          const pos = N % 2 ? `${(N + 1) / 2}番目` : `${N / 2}番目と ${N / 2 + 1}番目`;
          return {
            q: `${N}人の、${C.what}を調べて、${C.w}${C.u}ごとの階級に分けたヒストグラム（度数分布表）は、${freqSentence(cls, f, C.u, "人")}である。次のうち、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, others),
            hint: "ヒストグラムの柱の高さは、度数（人数）。最頻値は階級値、中央値は累積度数から、割合は度数÷合計から、ひとつずつ確かめよう。",
            steps: [`人数 ＝ ${addList(f)}（人）。${x}${C.u}以上は ${tl}人で、${tl}÷${N} ＝ ${shown(tl / N, 3)}　→　${round(share, 1)}%`, `最頻値 … 度数がいちばん多い階級は ${labs[mi]}（${f[mi]}人）。最頻値は階級値の ${cls[mi].mid}${C.u}で、${f[mi]} は度数`, `中央値 … ${N}人だから ${pos}の人の値。累積度数は ${cu.join("、")}（人）で、${labs[mc]}の階級`, `正しいのは「${ans}」。`],
          };
        }),
        // 11d07 (7) 場面に合う道具を選ぶ（ヒストグラム・相対度数・確率）
        t("11d07", (r) => {
          const SC = {
            相対度数: [
              ["人数のちがう 2つの学級で、「ある記録以上の人」の割合をくらべたい。", "人数がちがっても、割合でくらべられるから。"],
              ["生徒数のちがう A 中学校と B 中学校で、通学に 30分以上かかる生徒の割合をくらべたい。", "全体の人数がちがっても、割合（度数÷合計）でくらべられるから。"],
              ["男子 18人と女子 25人で、部活動に入っている人の割合をくらべたい。", "人数がちがうので、人数ではなく、割合でくらべるから。"],
              ["40人の学級と 32人の学級で、ある得点以上の人の割合をくらべたい。", "人数がちがっても、割合でくらべられるから。"],
            ],
            ヒストグラム: [
              ["30人の記録の、分布のようすを、ひと目で見たい。", "柱の高さで、分布のようすが見えるから。"],
              ["50人の通学時間が、どのあたりに多く、どのくらいちらばっているかを、ひと目で見たい。", "柱の高さで、多いところとちらばりが見えるから。"],
              ["学年全員のテストの得点の分布を、グラフにして、ひと目でとらえたい。", "度数分布をグラフにしたものがヒストグラムだから。"],
            ],
            確率: [
              ["1回ごとには結果が決まらないことがらの、起こりやすさを数で表したい。", "多数回の実験で、相対度数が近づく値で表せるから。"],
              ["これから 1回投げたときに表が出ることがらの、起こりやすさを数で表したい。", "結果が前もって決まらないことがらの起こりやすさは、確率で表すから。"],
              ["明日の天気のように、結果が前もって決まらないことがらの、起こりやすさを数で表したい。", "結果が前もって決まらないことがらの起こりやすさは、確率で表すから。"],
            ],
          };
          const ans = pick(r, ["相対度数", "ヒストグラム", "確率"]), [scene, why] = pick(r, SC[ans]);
          const others = ["ヒストグラム", "相対度数", "確率"].filter((x) => x !== ans);
          return {
            q: `次の場面では、どの道具を使うとよいか。${scene}`,
            ans,
            choices: choices4(r, ans, [...others, pick(r, ["範囲", "最頻値", "中央値"])]),
            hint: "ヒストグラム・相対度数・確率は、それぞれ何をするための道具だったかな。",
            steps: [`この場面では「${ans}」を使う。`, why],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 11d08 (8) 男子 18人の体重の平均値 40.0kg、女子 12人 35.0kg → 30人の平均値
        t("11d08", (r) => groupMean(r, GM)),
        // 11q05 （チャレンジ）A組 30人 8.0秒、B組 20人 8.5秒 → 50人の平均値
        t("11q05", (r) => groupMean(r, [GM[1], GM[2], GM[3]])),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 第11時は、演習プリント 8問・小テスト 5問のすべてを移した（ヒストグラムは度数を文章で言い、「すべて選ぶ」は4択に直した）
