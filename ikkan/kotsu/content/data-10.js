// ============================================================
// data-10.js — データの活用 第10時「確率を根拠にして、判断しよう」
//   ikkan の演習プリント（data-10.dr.1〜7）・小テスト（data-10.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「10」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：10d01b ＝ data-10.dr.1 の②（x分以上の確率）、10q05a ＝ data-10.qz.5 の①
//   度数分布表は、問題文の中で「0分以上2分未満が 70日、…」と文章で言う（stats.js の freqSentence）。度数は、相対度数が小数第2位でぴったり表せる数だけにする。
//   「売り切れる」＝仕入れた（つくった）個数以上売れること。「売れ残りが ○個より多い」＝売れた個数が（仕入れた個数−○）個未満。階級は「以上〜未満」。
//   「理由を書く」問いは、正しい説明を選ぶ4択に直した（10d02b・10d04b・10d05・10d07b・10q04）。
// ============================================================
import { t, pick, choices4, sample, shuffle, round, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { classes, clsLabel, freqSentence } from "../stats.js";

const unit = unitFor("data");

// ── 小さな道具 ───────────────────────────────────────────
const dec = (x, d) => Math.abs(x * 10 ** d - Math.round(x * 10 ** d)) < 1e-7;
const f2 = (x) => x.toFixed(2);
const sumOf = (a) => a.reduce((s, x) => s + x, 0);
/** 度数の合計 N を、k 個の階級に分けた度数（相対度数が、小数第2位でぴったり表せる数だけ。どの階級も 1 以上）。
 *  shape：desc＝右へ向かって減る／mound＝山形／any＝ばらばら */
function counts(r, N, k, shape = "any") {
  const step = N / gcd(N, 100), U = N / step, u = () => r(0, 1000) / 1000;
  let w;
  if (shape === "desc") { const rho = 0.35 + 0.25 * u(); w = Array.from({ length: k }, (_, i) => rho ** i * (0.8 + 0.4 * u())); }
  else if (shape === "mound") { const c = (k - 1) / 2 + (u() - 0.5), sg = 0.8 + 0.6 * u(); w = Array.from({ length: k }, (_, i) => Math.exp(-((i - c) ** 2) / (2 * sg * sg)) * (0.8 + 0.4 * u())); }
  else w = Array.from({ length: k }, () => 0.3 + u());
  const tot = sumOf(w), parts = w.map((x) => Math.max(1, Math.round((U * x) / tot)));
  // 合計を U にそろえる（いちばん大きい階級で調整）
  let diff = U - sumOf(parts);
  while (diff !== 0) {
    const i = diff > 0 ? parts.indexOf(Math.max(...parts)) : parts.indexOf(Math.max(...parts));
    if (diff < 0 && parts[i] <= 1) break;
    parts[i] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return parts.map((x) => x * step);
}
const NS = [100, 100, 100, 100, 50, 50, 200, 80, 40, 25, 20];
/** i 番目以降の度数の合計（「x以上」）、i 番目より前の度数の合計（「x未満」） */
const tail = (f, i) => sumOf(f.slice(i));
const head = (f, i) => sumOf(f.slice(0, i));
/** 度数の足し算の式：(8+4)÷100 ＝ 0.12 */
const calc = (list, N, ans) => `${list.length > 1 ? `(${list.join("+")})` : list[0]}÷${N} ＝ ${ans}`;
/** 度数を足した式：「2+2 ＝ 4」。1つだけのときは「9」 */
const addList = (list) => (list.length > 1 ? `${list.join("+")} ＝ ${sumOf(list)}` : String(list[0]));

// ── 度数分布表の場面（日数の表） ──────────────────────────────
//   intro＝場面の文のはじめ、u＝階級の単位、lo＝階級のはじめの値の候補、w＝階級の幅の候補、k＝階級の数の候補
//   ge(x)／lt(x)＝「x以上になる」「x未満である」の言い方
const CTX = [
  { intro: (N) => `ある駅で、電車が朝、何分おくれて着くかを ${N}日間調べたら、`, u: "分", lo: [0], w: [2, 3], k: [4, 5], shape: "desc", ge: (x) => `おくれが ${x}分以上になる`, lt: (x) => `おくれが ${x}分未満である` },
  { intro: (N) => `あるバス停で、バスが来るまでの待ち時間を ${N}日間調べたら、`, u: "分", lo: [0], w: [5, 3], k: [3, 4], shape: "desc", ge: (x) => `待ち時間が ${x}分以上になる`, lt: (x) => `待ち時間が ${x}分未満である` },
  { intro: (N) => `学校の売店で、おにぎりが 1日に何個売れるかを ${N}日間調べたら、`, u: "個", lo: [30, 40, 50], w: [10], k: [4, 5], shape: "mound", ge: (x) => `売れる個数が ${x}個以上になる`, lt: (x) => `売れる個数が ${x}個未満である` },
  { intro: (N) => `図書室で、1日に貸し出された本の冊数を ${N}日間調べたら、`, u: "冊", lo: [10, 20, 30], w: [10, 5], k: [4, 5], shape: "mound", ge: (x) => `貸し出しが ${x}冊以上になる`, lt: (x) => `貸し出しが ${x}冊未満である` },
  { intro: (N) => `ある店で、1日の来店者数を ${N}日間調べたら、`, u: "人", lo: [100, 200], w: [50, 100], k: [4, 5], shape: "mound", ge: (x) => `来店者が ${x}人以上になる`, lt: (x) => `来店者が ${x}人未満である` },
];
/** 場面 C の表をつくる：{ N, cls, f, sentence, bounds } */
function makeTable(r, C, Nopt) {
  const N = Nopt || pick(r, NS), k = pick(r, C.k), lo = pick(r, C.lo), w = pick(r, C.w);
  const cls = classes(lo, w, k), f = counts(r, N, k, C.shape);
  return { N, cls, f, k, lo, w, sentence: `${C.intro(N)}${freqSentence(cls, f, C.u, C.u2 || "日")}であった。` };
}

export const UNITS = [
  unit("10", {
    name: "確率を根拠にして、判断しよう",
    desc: "相対度数を確率とみなして、「以上」「未満」の確率を求めて判断する。確率の意味と、使うときの注意",
    prereqs: ["J1-dk09", "J1-d3"],
    points: [
      "度数分布表の相対度数は、その階級になる確率とみなして、予想や判断の根拠に使える。",
      "「ある値以上」になる確率は、その階級から上の階級の相対度数をたして求める。「ある値未満」になる確率は、その値より下の階級の相対度数をたして求める（累積相対度数）。",
      "確率は「およその見こみ」で、「かならずそうなる」わけではない。調べた回数（人数）が少ないと、相対度数はばらつくので、あまり信頼できない。",
      "判断は、何を大事にするか（たとえば、売り切れを少なくしたいのか、売れ残りを少なくしたいのか）で変わってよい。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 10d01a (1)① 度数分布表の、ある階級の相対度数
        t("10d01a", (r) => {
          const C = pick(r, CTX), T = makeTable(r, C), j = r(0, T.k - 1), ans = round(T.f[j] / T.N);
          return {
            q: `${T.sentence}${clsLabel(T.cls[j], C.u)}の階級の相対度数を求めよう。`,
            ans,
            hint: "相対度数は、（その階級の度数）÷（度数の合計）。度数の合計は何日かな？",
            steps: ["相対度数 ＝ 度数 ÷ 度数の合計", `${T.f[j]}÷${T.N} ＝ ${ans}`],
          };
        }),
        // 10d01b (1)② ○分以上おくれる確率
        t("10d01b", (r) => {
          const C = pick(r, CTX), T = makeTable(r, C), j = r(1, T.k - 1), S = tail(T.f, j), ans = round(S / T.N);
          return {
            q: `${T.sentence}相対度数を確率とみなすとき、${C.ge(T.lo + j * T.w)}確率を求めよう。`,
            ans,
            hint: "「以上」の確率は、その値から上の階級の相対度数（または度数）をたして求める。",
            steps: [`${T.lo + j * T.w}${C.u}以上は、${clsLabel(T.cls[j], C.u)}の階級から上のすべて。`, `度数の合計 ＝ ${addList(T.f.slice(j))}`, `${S}÷${T.N} ＝ ${ans}`],
          };
        }),
        // 10d01c (1)③ 4分未満なら間に合う → 間に合う確率
        t("10d01c", (r) => {
          const C = pick(r, CTX), T = makeTable(r, C), j = r(1, T.k - 1), S = head(T.f, j), ans = round(S / T.N);
          return {
            q: `${T.sentence}相対度数を確率とみなすとき、${C.lt(T.lo + j * T.w)}確率を求めよう。`,
            ans,
            hint: "「未満」の確率は、その値より下の階級の相対度数（または度数）をたして求める。",
            steps: [`${T.lo + j * T.w}${C.u}未満は、最初の階級から ${clsLabel(T.cls[j - 1], C.u)}の階級まで。`, `度数の合計 ＝ ${addList(T.f.slice(0, j))}`, `${S}÷${T.N} ＝ ${ans}`],
          };
        }),
        // 10d02a (2) シュートの練習で、入った割合（相対度数）が高いのは、どちらか
        t("10d02a", (r) => {
          const C = pick(r, [{ f: "シュート", u: "本", v: "入った" }, { f: "サーブ", u: "本", v: "入った" }, { f: "フリースロー", u: "本", v: "入った" }]);
          let ns, pps;
          for (let i = 0; i < 80; i++) {
            pps = sample(r, [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90], 3).sort((a, b) => a - b);
            if (pps[1] - pps[0] < 10 || pps[2] - pps[1] < 10) continue;
            pps = shuffle(r, pps);
            ns = [0, 1, 2].map(() => pick(r, [20, 40, 60, 80, 100, 120, 150, 200]));
            const ks = ns.map((n, j) => (n * pps[j]) / 100);
            const top = (a) => a.indexOf(Math.max(...a));
            if (ks.every(Number.isInteger) && top(ks) !== top(pps)) { ns.ks = ks; break; }
            ns = null;
          }
          if (!ns) return { skip: true };
          const NM = ["A さん", "B さん", "C さん"], ks = ns.ks, best = pps.indexOf(Math.max(...pps)), ans = NM[best];
          return {
            q: `${C.f}の練習で、${NM.map((m, j) => `${m}は ${ns[j]}${C.u}中 ${ks[j]}${C.u}`).join("、")}、${C.v}。${C.v}割合（相対度数）がいちばん高いのは、だれか。`,
            ans,
            choices: choices4(r, ans, [...NM.filter((m) => m !== ans), "3人とも同じ"]),
            hint: "打った本数がちがうとき、入った本数そのものでくらべてよいかな。何でくらべるとよいだろう。",
            steps: ["打った本数がちがうので、入った割合（相対度数）でくらべる。", NM.map((m, j) => `${m} … ${ks[j]}÷${ns[j]} ＝ ${f2(pps[j] / 100)}`).join("　"), `いちばん高いのは ${ans}。`],
          };
        }),
        // 10q01 バス停で待ち時間を 80日調べた。相対度数を求めて表を完成させよう → 1つの階級の相対度数
        t("10q01", (r) => {
          const C = pick(r, [CTX[1], CTX[0]]), T = makeTable(r, C), j = r(0, T.k - 1), ans = round(T.f[j] / T.N);
          return {
            q: `${T.sentence}${clsLabel(T.cls[j], C.u)}の階級の相対度数を求めよう。`,
            ans,
            hint: "相対度数は、（その階級の度数）÷（度数の合計）。",
            steps: ["相対度数 ＝ 度数 ÷ 度数の合計", `${T.f[j]}÷${T.N} ＝ ${ans}`],
          };
        }),
        // 10q02 10分以上待つ確率
        t("10q02", (r) => {
          const C = pick(r, [CTX[1], CTX[0]]), T = makeTable(r, C), j = r(1, T.k - 1), S = tail(T.f, j), ans = round(S / T.N);
          return {
            q: `${T.sentence}相対度数を確率とみなすとき、${C.ge(T.lo + j * T.w)}確率を求めよう。`,
            ans,
            hint: "「以上」の確率は、その値から上の階級をたして求める。",
            steps: [`${T.lo + j * T.w}${C.u}以上は、${clsLabel(T.cls[j], C.u)}の階級から上のすべて。`, calc(T.f.slice(j), T.N, ans)],
          };
        }),
        // 10q03 待ち時間が 10分未満である確率
        t("10q03", (r) => {
          const C = pick(r, [CTX[1], CTX[0]]), T = makeTable(r, C), j = r(1, T.k - 1), S = head(T.f, j), ans = round(S / T.N);
          return {
            q: `${T.sentence}相対度数を確率とみなすとき、${C.lt(T.lo + j * T.w)}確率を求めよう。`,
            ans,
            hint: "「未満」の確率は、その値より下の階級をたして求める。",
            steps: [`${T.lo + j * T.w}${C.u}未満は、最初の階級から ${clsLabel(T.cls[j - 1], C.u)}の階級まで。`, calc(T.f.slice(0, j), T.N, ans)],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 10d02b (2) A さんと B さんの割合の差が小さい → はっきりした差といえるか
        t("10d02b", (r) => {
          const C = pick(r, [{ f: "シュート", u: "本" }, { f: "サーブ", u: "本" }, { f: "フリースロー", u: "本" }]);
          const NL = [20, 25, 40, 50, 60, 80, 100, 120, 150, 200];
          const cands = [];
          for (const n1 of NL) for (const n2 of NL) {
            if (n1 === n2) continue;
            for (let k1 = Math.ceil(n1 * 0.4); k1 <= Math.floor(n1 * 0.9); k1++) {
              if (!dec(k1 / n1, 2)) continue;
              for (let d = 1; d <= 4; d++) {
                const k2 = Math.round(((k1 / n1) * 100 - d) * n2 / 100);
                if (dec(k2 / n2, 2) && Math.abs(Math.round((k1 / n1 - k2 / n2) * 100) - d) === 0 && k2 / n2 > 0.35) cands.push([n1, k1, n2, k2]);
              }
            }
          }
          const [nx, kx, ny, ky] = pick(r, cands), a = r(0, 1) ? ["A", "B"] : ["B", "A"];   // X＝割合が高い人、Y＝低い人
          const X = `${a[0]} さん`, Y = `${a[1]} さん`;
          const first = r(0, 1) ? 0 : 1, line = [`${X}は ${nx}${C.u}中 ${kx}${C.u}`, `${Y}は ${ny}${C.u}中 ${ky}${C.u}`];
          const ordered = first ? [line[1], line[0]] : line;
          const ans = "相対度数の差が小さく、本数もちがうので、はっきりした差とはいえない。";
          return {
            q: `${C.f}の練習で、${ordered[0]}、${ordered[1]}、入った。入った割合（相対度数）は、${X}のほうが高い。このことから、「${X}のほうが入りやすい」と、はっきりいえるか。正しい説明を選ぼう。`,
            ans,
            choices: choices4(r, ans, [`相対度数が高いので、${X}のほうが入りやすいと、はっきりいえる。`, "入った本数が多い人のほうが、入りやすいといえる。", "相対度数に差があれば、その差がどんなに小さくても、はっきりした差がある。"]),
            hint: "相対度数の差はどのくらいかな。それに、打った本数は同じかな。",
            steps: [`${X} … ${kx}÷${nx} ＝ ${f2(kx / nx)}　${Y} … ${ky}÷${ny} ＝ ${f2(ky / ny)}`, `${X}のほうが高いが、差は ${f2(kx / nx - ky / ny)} と小さい。`, "本数もちがうので、はっきりした差とはいえない。"],
          };
        }),
        // 10d03a (3)① 60個・70個・80個つくったとき、売り切れる確率
        t("10d03a", (r) => {
          const P = pick(r, ["お弁当", "サンドイッチ", "パン", "おにぎり"]), N = pick(r, [80, 100, 100, 50, 200]), lo = pick(r, [40, 50, 60]);
          const cls = classes(lo, 10, 4), f = counts(r, N, 4, "mound"), j = r(1, 3), q = lo + j * 10, S = tail(f, j), ans = round(S / N);
          return {
            q: `ある店で、${P}を毎日つくる。過去 ${N}日の「1日に売れた個数」は、${freqSentence(cls, f, "個", "日")}であった。相対度数を確率とみなすとき、${q}個つくったとき、売り切れる（つくった個数以上売れる）確率を求めよう。`,
            ans,
            hint: "売り切れる ＝ つくった個数以上売れる。「以上」の確率は、その値から上の階級をたして求める。",
            steps: [`${q}個つくって売り切れる ＝ ${q}個以上売れる。`, `${q}個以上は、${clsLabel(cls[j], "個")}の階級から上のすべて。`, calc(f.slice(j), N, ans)],
          };
        }),
        // 10d03b (3)② 売り切れをできるだけ少なくしたいとき、何個つくるのがよいか
        t("10d03b", (r) => {
          const P = pick(r, ["お弁当", "サンドイッチ", "パン", "おにぎり"]), N = pick(r, [80, 100, 100, 50, 200]), lo = pick(r, [40, 50, 60]), k = pick(r, [4, 5]);
          const cls = classes(lo, 10, k), f = counts(r, N, k, "mound");
          const js = sample(r, Array.from({ length: k - 1 }, (_, i) => i + 1), 3).sort((a, b) => a - b), qs = js.map((j) => lo + j * 10), best = js[2];
          const lab = (x) => `${x}個`, ans = lab(qs[2]);
          return {
            q: `ある店で、${P}を毎日つくる。過去 ${N}日の「1日に売れた個数」は、${freqSentence(cls, f, "個", "日")}であった。相対度数を確率とみなす。売り切れる（つくった個数以上売れる）ことをできるだけ少なくしたいとき、何個つくるのがよいか。次の中から選ぼう。`,
            ans,
            choices: choices4(r, ans, [lab(lo), lab(qs[0]), lab(qs[1])]),
            hint: "それぞれの個数で、売り切れる確率を求めてくらべよう。つくる個数をふやすと、売り切れる確率はどうなるかな。",
            steps: [...qs.map((x, i) => `${x}個 … ${calc(f.slice(js[i]), N, round(tail(f, js[i]) / N))}`), `売り切れる確率がいちばん小さいのは ${qs[2]}個（個数をふやすほど、売り切れにくい）。`],
          };
        }),
        // 10q04 降水確率 40% の意味として正しいものを選ぶ
        t("10q04", (r) => {
          const pp = pick(r, [10, 20, 30, 40, 50, 60, 70, 80]);
          const ans = `同じような気象の状態が 100回あったとすると、そのうち、およそ ${pp}回は雨が降る。`;
          return {
            q: `天気予報で「降水確率 ${pp}%」と発表された。意味として正しいものを選ぼう。`,
            ans,
            choices: choices4(r, ans, [`1日のうち、${pp}% の時間は、雨が降る。`, `その地域の ${pp}% の場所で、雨が降る。`, `降る雨の量が、${pp}ミリメートルになる。`]),
            hint: "降水確率も、確率の一つ。確率は、同じことがらを多数回くり返したとき、どうなる割合を表していたかな。",
            steps: [`降水確率 ${pp}% ＝ 確率 ${pp / 100}`, "確率は、同じ条件のことがらを多数回くり返したときの、起こる割合の見こみ。", `同じような気象の状態が 100回あれば、およそ ${pp}回は雨が降る、という意味。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 10d04a (4)①② 過去40年間の8月15日に雨が降った年は6年 → 確率 → 20年間で何回
        t("10d04a", (r) => {
          const C = pick(r, [
            { s: (n, k) => `A 町で、過去 ${n}年間の 8月15日に、雨が降った年は ${k}年だった。`, g: (M) => `これからの ${M}年間で、この日に雨が降る年は、およそ何回と予想できるか。` },
            { s: (n, k) => `B 市で、過去 ${n}年間の 1月1日に、雪が降った年は ${k}年だった。`, g: (M) => `これからの ${M}年間で、この日に雪が降る年は、およそ何回と予想できるか。` },
            { s: (n, k) => `C 町で、過去 ${n}年間の 10月10日（運動会の日）に、雨が降った年は ${k}年だった。`, g: (M) => `これからの ${M}年間で、この日に雨が降る年は、およそ何回と予想できるか。` },
            { s: (n, k) => `D 市で、過去 ${n}年間の 7月20日に、最高気温が 35度以上になった年は ${k}年だった。`, g: (M) => `これからの ${M}年間で、この日に最高気温が 35度以上になる年は、およそ何回と予想できるか。` },
          ]);
          const n = pick(r, [20, 25, 40, 50]), M = pick(r, [10, 20, 30, 40, 50, 60, 100]);
          const ks = [];
          for (let k = 2; k <= n * 0.6; k++) if (dec(k / n, 2) && (M * k) % n === 0) ks.push(k);
          if (!ks.length) return { skip: true };
          const k = pick(r, ks), p = round(k / n), ans = (M * k) / n;
          return {
            q: `${C.s(n, k)}相対度数を確率とみなして、${C.g(M)}`,
            ans,
            unit: "回",
            hint: "まず、過去の記録から確率を求める。その確率を使って、これからの年数のうちの回数を予想しよう。",
            steps: [`確率 ＝ ${k}÷${n} ＝ ${p}`, `${M}×${p} ＝ ${ans}`, `およそ ${ans}回。`],
          };
        }),
        // 10d04b (4)③ 10年間だけの記録で確率を求めたら、40年間の記録より信頼できるか
        t("10d04b", (r) => {
          const n1 = pick(r, [5, 8, 10]), n2 = pick(r, [40, 50, 100]), C = pick(r, ["雨が降る", "雪が降る", "最高気温が 35度以上になる"]), D = pick(r, ["8月15日", "1月1日", "7月20日"]);
          const ans = "年数が少ないと、相対度数がばらつきやすいので、あまり信頼できない。";
          return {
            q: `ある町で、${n2}年間の${D}の記録から、この日に${C}確率を求めた。もし、そのうちの ${n1}年間だけの記録で確率を求めたら、その値は、${n2}年間の記録で求めた値とくらべて、どうだろうか。正しい説明を選ぼう。`,
            ans,
            choices: choices4(r, ans, ["年数が少ないほうが、確率を正確に求められるので、より信頼できる。", "記録の年数がちがっても、相対度数は同じ値になるので、同じくらい信頼できる。", "どちらの値も信頼できない。確率では、この日のようすを考えられないから。"]),
            hint: "前の時間に学んだ、「くり返す回数が少ないとき、相対度数はどうなるか」を思い出そう。",
            steps: ["記録の年数（くり返す回数）が少ないと、相対度数は大きくばらつく。", `${n1}年間だけの記録は、${n2}年間の記録より、あまり信頼できない。`],
          };
        }),
        // 10d05 (5) 確率が 0.88。だから明日はかならず間に合う、といってよいか
        t("10d05", (r) => {
          const C = pick(r, [
            { s: (p) => `ある駅で、電車のおくれが 4分未満である確率が ${p} と求められた。`, ok: "おくれが 4分未満になる", ng: "おくれが 4分以上になる", d: "日", base: "明日は", also: "おくれが 4分以上になる日もある。" },
            { s: (p) => `あるバス停で、バスが時刻表どおりに着く確率が ${p} と求められた。`, ok: "時刻表どおりに着く", ng: "時刻表どおりに着かない", d: "日", base: "明日は", also: "時刻表どおりに着かない日もある。" },
            { s: (p) => `あるくじで、当たる確率が ${p} と求められた。`, ok: "当たる", ng: "はずれる", d: "回", base: "明日、くじを引くと", also: "はずれることもある。" },
          ]);
          const pp = pick(r, [75, 80, 84, 85, 88, 90, 92, 95]), p = pp / 100, ng = 100 - pp;
          const ans = `100${C.d}のうち、およそ ${pp}${C.d}は${C.ok}見こみ。${C.also}`;
          return {
            q: `${C.s(p)}「確率が ${p} だから、${C.base}かならず${C.ok}」といってよいか。正しい説明を選ぼう。`,
            ans,
            choices: choices4(r, ans, [`確率が ${p} だから、${C.base}かならず${C.ok}。`, `${C.ng}確率も ${p} である。`, `100${C.d}のうち、ちょうど ${pp}${C.d}は${C.ok}。`]),
            hint: "確率は、多数回くり返したときの割合の見こみ。「かならず」と言ってよいかな。",
            steps: [`確率 ${p} は、100${C.d}のうち、およそ ${pp}${C.d}は${C.ok}という見こみ。`, `${C.ng}確率は 1−${p} ＝ ${round(1 - p)} で、およそ ${ng}${C.d}は${C.ng}。`, "「かならず」とはいえない。"],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 10d06a (6)① 売り切れる確率を 0.10 以下にしたい。何個以上仕入れるか
        t("10d06a", (r) => sellOut(r, [0.05, 0.1, 0.1, 0.15, 0.2])),
        // 10d06b (6)② 80個仕入れたとき、売れ残りが20個より多くなる確率
        t("10d06b", (r) => leftover(r)),
        // 10d07a (7)① A店 15/20、B店 140/200 の相対度数
        t("10d07a", (r) => {
          const nA = pick(r, [20, 25, 40, 50]), nB = pick(r, [100, 200, 250, 400, 500]), which = r(0, 1);
          const ca = [], cb = [];
          for (let k = Math.ceil(nA * 0.55); k <= Math.floor(nA * 0.9); k++) if (dec(k / nA, 2)) ca.push(k);
          for (let k = Math.ceil(nB * 0.5); k <= Math.floor(nB * 0.85); k++) if (dec(k / nB, 2)) cb.push(k);
          const pairs = [];
          for (const a of ca) for (const b of cb) if (a / nA > b / nB && a / nA - b / nB <= 0.12) pairs.push([a, b]);
          if (!pairs.length) return { skip: true };
          const [kA, kB] = pick(r, pairs), name = which ? "B 店" : "A 店", k = which ? kB : kA, n = which ? nB : nA, ans = round(k / n);
          return {
            q: `ある 2つの店で、新しい商品について聞いた。A 店は ${nA}人中 ${kA}人、B 店は ${nB}人中 ${kB}人が、「また買いたい」と答えた。${name}の、「また買いたい」と答えた人の相対度数を求めよう。`,
            ans,
            hint: "相対度数は、（「また買いたい」と答えた人数）÷（聞いた人数）。聞いた人数は、店ごとにちがう。",
            steps: ["相対度数 ＝ 答えた人数 ÷ 聞いた人数", `${name} … ${k}÷${n} ＝ ${ans}`],
          };
        }),
        // 10d07b (7)② 「A店のほうが割合が高いから、A店のほうが人気がある」といってよいか
        t("10d07b", (r) => {
          const nA = pick(r, [20, 25, 40, 50]), nB = pick(r, [100, 200, 250, 400, 500]);
          const ca = [], cb = [];
          for (let k = Math.ceil(nA * 0.55); k <= Math.floor(nA * 0.9); k++) if (dec(k / nA, 2)) ca.push(k);
          for (let k = Math.ceil(nB * 0.5); k <= Math.floor(nB * 0.85); k++) if (dec(k / nB, 2)) cb.push(k);
          const pairs = [];
          for (const a of ca) for (const b of cb) if (a / nA > b / nB && a / nA - b / nB <= 0.12) pairs.push([a, b]);
          if (!pairs.length) return { skip: true };
          const [kA, kB] = pick(r, pairs);
          const ans = "いいきれない。A 店は、聞いた人数が少なく、相対度数が大きくばらつくから。";
          return {
            q: `ある 2つの店で、新しい商品について聞いた。A 店は ${nA}人中 ${kA}人、B 店は ${nB}人中 ${kB}人が、「また買いたい」と答えた。「A 店のほうが割合が高いから、A 店のほうが人気がある」といってよいか。正しい説明を選ぼう。`,
            ans,
            choices: choices4(r, ans, ["いえる。相対度数が高いほうが、かならず人気がある。", "いえる。聞いた人数が少ないほうが、相対度数は正確だから。", "B 店のほうが聞いた人数が多いので、B 店のほうが人気があるといえる。"]),
            hint: "A 店と B 店で、聞いた人数がちがう。人数が少ないとき、相対度数はどうなるだろう。",
            steps: [`A 店 ${kA}÷${nA} ＝ ${round(kA / nA)}　B 店 ${kB}÷${nB} ＝ ${round(kB / nB)}`, `A 店のほうが高いが、A 店は ${nA}人だけ。人数が少ないと、相対度数は大きくばらつく。`, `${nB}人に聞いた B 店のほうが、信頼できる。A 店のほうが人気があるとは、いいきれない。`],
          };
        }),
        // 10q05a （チャレンジ）①  売り切れる確率を 0.15 以下にしたい。何個以上仕入れるか
        t("10q05a", (r) => sellOut(r, [0.1, 0.15, 0.15, 0.2, 0.25])),
        // 10q05b （チャレンジ）② 80個仕入れたとき、売れ残りが20個より多くなる確率
        t("10q05b", (r) => leftover(r)),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 第10時は、演習プリント 7問・小テスト 5問のすべてを移した（理由を書く問いは、正しい説明を選ぶ4択に直した）

// ── 入試レベル：売り切れの確率／売れ残りの確率（10d06・10q05 で共通） ──────────
const SHOPS = [
  { s: "売店のおにぎり", v: "仕入れる" }, { s: "パン屋のパン", v: "仕入れる" }, { s: "喫茶店のサンドイッチ", v: "仕入れる" }, { s: "売店の牛乳パック", v: "仕入れる" }, { s: "ケーキ屋のケーキ", v: "仕入れる" },
];
function sellTable(r) {
  const S = pick(r, SHOPS), lo = pick(r, [30, 40, 50]), k = pick(r, [5, 5, 6]), cls = classes(lo, 10, k), f = counts(r, 100, k, "mound");
  return { S, lo, k, cls, f, N: 100, intro: `${S.s}の、過去 100日の「1日に売れた個数」は、${freqSentence(cls, f, "個", "日")}であった。` };
}
/** ① 売り切れる確率を t 以下にするには、何個以上仕入れるか（階級のさかいの個数で） */
function sellOut(r, targets) {
  const T = sellTable(r), { f, lo, k, N } = T, tl = (j) => tail(f, j) / N;
  const tg = pick(r, targets);
  const j = Array.from({ length: k }, (_, i) => i).find((i) => round(tl(i)) <= tg + 1e-9);
  if (j == null || j < 2 || j > k - 1 || round(tl(j)) >= tg - 1e-9) return { skip: true };
  const bounds = Array.from({ length: k - 1 }, (_, i) => lo + (i + 1) * 10), ans = lo + j * 10;
  return {
    q: `${T.intro}売り切れる（${T.S.v}個数以上売れる）確率を ${tg} 以下にしたい。相対度数を確率とみなして、${T.S.v}個数は何個以上にすればよいか。階級のさかいの個数（${bounds.join("、")}）の中から、いちばん少ない個数で答えよう。`,
    ans,
    unit: "個",
    hint: "仕入れる個数ごとに、売り切れる確率（その個数以上売れる確率）を求めて、基準以下になるものをさがそう。",
    steps: [`売り切れる確率 ＝ ${T.S.v}個数以上売れる確率`, bounds.map((b, i) => `${b}個 … ${round(tl(i + 1))}`).join("　"), `${tg} 以下になるのは、${ans}個以上のとき。`],
  };
}
/** ② q 個仕入れたとき、売れ残りが m 個より多くなる確率 */
function leftover(r) {
  const T = sellTable(r), { f, lo, k, N } = T;
  const iq = r(3, k), s = r(1, iq - 1), q = lo + iq * 10, m = s * 10, i = iq - s, S = head(f, i), ans = round(S / N);
  return {
    q: `${T.intro}${q}個${T.S.v}ときの、売れ残りが ${m}個より多くなる確率を求めよう。（売れ残り ＝ ${T.S.v}個数 − 売れた個数。相対度数を確率とみなす）`,
    ans,
    hint: "売れ残りが多い ＝ 売れた個数が少ない。売れた個数が何個未満のときかを考えよう。",
    steps: [`売れ残りが ${m}個より多い ⇔ 売れた個数が ${q}−${m} ＝ ${q - m}個未満`, `${q - m}個未満は、最初の階級から ${clsLabel(T.cls[i - 1], "個")}の階級まで。`, calc(f.slice(0, i), N, ans)],
  };
}
