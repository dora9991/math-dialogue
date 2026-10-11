// ============================================================
// e4.js — 小学4年の単元（数学ラボ ソロ）
//   書き方は docs/solo-問題データの書き方.md
// ============================================================
import { t, pick, shuffle, sample, gcd, choices4, numChoices, fracAns, round } from "../kit.js";

// ── この学年で使う小さな道具 ─────────────────────────────

/** 大きな数を「3兆5000億200万」の形に */
function jp(n) {
  let s = "";
  let rest = n;
  for (const [u, name] of [[1e12, "兆"], [1e8, "億"], [1e4, "万"]]) {
    const q = Math.floor(rest / u);
    if (q > 0) {
      s += q + name;
      rest -= q * u;
    }
  }
  if (rest > 0 || s === "") s += rest;
  return s;
}

/** 数字を右から4けたずつ区切った文字列 "52 7300 0000" */
function group4(s) {
  const out = [];
  for (let i = s.length; i > 0; i -= 4) out.unshift(s.slice(Math.max(0, i - 4), i));
  return out.join(" ");
}

const PLACE = ["一", "十", "百", "千", "一万", "十万", "百万", "千万", "一億", "十億", "百億", "千億", "一兆"];

/** 四捨五入して u の位までのがい数に */
const gaisu = (n, u) => Math.round(n / u) * u;

/** 帯分数（約分しない・4年用）の TeX。整数部分 w、分子 m、分母 d */
function mixParts(w, m, d) {
  if (m === 0) return String(w);
  if (w === 0) return `\\frac{${m}}{${d}}`;
  return `${w}\\frac{${m}}{${d}}`;
}
/** 仮分数 n/d を帯分数（約分しない）の TeX に */
const mix = (n, d) => mixParts(Math.floor(n / d), n % d, d);
const $ = (s) => `$${s}$`;
/** 帯分数の4択の補充用：正解 n/d の近くの値 */
const mixFill = (n, d) => (i) => {
  const v = n + [1, -1, 2, -2, 3, 4, 5][i % 7];
  return v > 0 ? $(mix(v, d)) : null;
};

/** わり算の筆算の手順（1行ずつ） */
function hissan(a, b) {
  const lines = [];
  let cur = 0;
  let started = false;
  for (const ch of String(a)) {
    cur = cur * 10 + Number(ch);
    const q = Math.floor(cur / b);
    if (started || q > 0) {
      const m = cur - q * b;
      lines.push(`${cur} ÷ ${b} → ${q} をたてる${m ? `、あまり ${m}` : ""}`);
      started = true;
    }
    cur -= q * b;
  }
  return lines;
}

const NAMES = ["ゆうと", "さくら", "はると", "あおい", "そうた", "ひなた", "れん", "ゆい"];

const KD = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
/** 1〜9999 を漢字で（1000 は「千」、10 は「十」） */
function kan4(x) {
  let s = "";
  for (const [u, name] of [[1000, "千"], [100, "百"], [10, "十"], [1, ""]]) {
    const d = Math.floor(x / u) % 10;
    if (d > 0) s += (d === 1 && u > 1 ? "" : KD[d]) + name;
  }
  return s;
}
/** 大きな数を漢字だけで（30520000000 → 三百五億二千万） */
function kanji(n) {
  let s = "";
  let rest = n;
  for (const [u, name] of [[1e12, "兆"], [1e8, "億"], [1e4, "万"], [1, ""]]) {
    const q = Math.floor(rest / u);
    if (q > 0) {
      s += kan4(q) + name;
      rest -= q * u;
    }
  }
  return s;
}

/** 買い物の品物と数え方 */
const SHOP = [["パン", "こ"], ["おにぎり", "こ"], ["ノート", "さつ"], ["ジュース", "本"], ["えんぴつ", "本"], ["ケーキ", "こ"]];

export const UNITS = [
  // ────────────────────────────────────────────────────────
  {
    id: "E4-ookina",
    grade: "E4",
    area: "num",
    name: "大きな数（億・兆）",
    desc: "位取り・10倍・10でわる",
    prereqs: ["E3-ookina"],
    points: [
      "大きな数は、右から4けたずつ区切ると読みやすいよ。区切りごとに、万・億・兆と位の名前が変わる。",
      "1000万を10こ集めると1億、1000億を10こ集めると1兆になるよ。",
      "10倍すると位が1つ上がり（0が1つふえる）、10でわると位が1つ下がる（0が1つへる）よ。",
    ],
    levels: {
      1: [
        t("E4-ookina-1a", (r) => {
          const k = r(1, 9);
          const [s, b] = pick(r, [["1000万", "億"], ["1000億", "兆"]]);
          return {
            q: `${s}を ${10 * k} こ集めた数は何${b}ですか。`,
            ans: k,
            unit: b,
            hint: `${s}を10こ集めると、いくつになるかな？`,
            steps: [`${s}を10こ集めると1${b}`, `${10 * k} こは「10こ」の ${k} つ分だから、${k}${b}`],
          };
        }),
        t("E4-ookina-1b", (r) => {
          const len = r(9, 13);
          const d = [r(1, 9)];
          for (let i = 1; i < len; i++) d.push(r(0, 9));
          const s = d.join("");
          const pos = r(4, len - 1);
          const ans = d[len - 1 - pos];
          return {
            q: `${s} の${PLACE[pos]}の位の数字は何ですか。`,
            ans,
            hint: "右から4けたずつ区切ると、万・億・兆の区切りが見つかるよ。",
            steps: [`4けたずつ区切ると ${group4(s)}`, `読むと ${jp(Number(s))}`, `${PLACE[pos]}の位の数字は ${ans}`],
          };
        }),
        t("E4-ookina-1c", (r) => {
          const a = r(2, 9);
          const k = r(0, 2);
          if (k === 0) {
            return {
              q: `${a}億を10倍した数は何億ですか。`,
              ans: a * 10,
              unit: "億",
              hint: "10倍すると、位が1つ上がるよ。",
              steps: [`${a}億の10倍は、${a} を10倍して`, `${a * 10}億`],
            };
          }
          if (k === 1) {
            return {
              q: `${a}億を10でわった数は何万ですか。`,
              ans: a * 1000,
              unit: "万",
              hint: "10でわると、位が1つ下がるよ。1億を10でわるといくつ？",
              steps: ["1億 ÷ 10 ＝ 1000万", `${a}億 ÷ 10 ＝ ${a}000万`],
            };
          }
          return {
            q: `${a}兆を10でわった数は何億ですか。`,
            ans: a * 1000,
            unit: "億",
            hint: "10でわると、位が1つ下がるよ。1兆を10でわるといくつ？",
            steps: ["1兆 ÷ 10 ＝ 1000億", `${a}兆 ÷ 10 ＝ ${a}000億`],
          };
        }),
        t("E4-ookina-1d", (r) => {
          // 0 のある大きな数の読み方・書き方（数字 ↔ 漢字）
          const top = r(9, 13);
          const ps = [top];
          while (ps.length < 3) {
            const p = r(0, 2) ? r(4, top - 1) : r(0, top - 1);
            if (!ps.includes(p)) ps.push(p);
          }
          const digs = ps.map(() => r(1, 9));
          const N = ps.reduce((s, p, i) => s + digs[i] * 10 ** p, 0);
          // まちがえやすい数：0 が1つ多い・少ない、数字が1つとなりの位にずれる
          const wrongNs = [N * 10];
          if (N % 10 === 0) wrongNs.push(N / 10);
          ps.forEach((p, i) => {
            if (i === 0) return;
            for (const np of [p + 1, p - 1]) {
              if (np >= 0 && np < top && !ps.includes(np)) wrongNs.push(N - digs[i] * 10 ** p + digs[i] * 10 ** np);
            }
          });
          const s = String(N);
          if (r(0, 1)) {
            const ans = kanji(N);
            return {
              q: `${s} の読み方を、漢字で書いたものはどれですか。`,
              ans,
              choices: choices4(r, ans, shuffle(r, wrongNs).map(kanji)),
              hint: "右から4けたずつ区切って、万・億・兆の区切りを見つけよう。",
              steps: [`右から4けたずつ区切ると ${group4(s)}`, `${jp(N)} なので「${ans}」と読む`],
            };
          }
          return {
            q: `「${kanji(N)}」を数字で書いたものはどれですか。`,
            ans: s,
            choices: choices4(r, s, shuffle(r, wrongNs).map(String)),
            hint: "兆・億・万の区切りごとに4けたずつ書こう。数字のない位には 0 を書くよ。",
            steps: [`${kanji(N)} は ${jp(N)}`, `区切りごとに4けたで書くと ${group4(s)}`, `答え ${s}`],
          };
        }),
        t("E4-ookina-1e", (r) => {
          // 1億を□こ、1000万を□こ… あわせた数
          const U = [[1e12, "1兆"], [1e11, "1000億"], [1e10, "100億"], [1e9, "10億"], [1e8, "1億"], [1e7, "1000万"], [1e6, "100万"], [1e5, "10万"], [1e4, "1万"]];
          const group = (i) => (i === 0 ? 0 : i <= 4 ? 1 : 2);
          const idx = sample(r, [0, 1, 2, 3, 4, 5, 6, 7, 8], 3).sort((a, b) => a - b);
          if (new Set(idx.map(group)).size < 2) return { skip: true };
          const terms = idx.map((i) => [U[i][0], U[i][1], r(1, 9)]);
          const N = terms.reduce((s, [v, , c]) => s + v * c, 0);
          const ans = jp(N);
          const wrongNs = [];
          terms.forEach(([v, , c]) => {
            wrongNs.push(N + v * c * 9); // 位を1つ上にまちがえる
            wrongNs.push(N - (v * c * 9) / 10); // 位を1つ下にまちがえる
          });
          return {
            q: `${terms.map(([, name, c]) => `${name}を ${c}こ`).join("、")} あわせた数はどれですか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, wrongNs).map(jp)),
            hint: `それぞれがいくつになるかを先に考えよう。${terms[1][1]}を ${terms[1][2]}こ集めると、いくつかな？`,
            steps: [terms.map(([v, name, c]) => `${name}を${c}こで ${jp(v * c)}`).join("、"), `あわせて ${ans}`],
          };
        }),
      ],
      2: [
        t("E4-ookina-2a", (r) => {
          const N = r(1, 99) * 1e8 + r(1, 99) * 1e6;
          const [lab, m, traps, how] = pick(r, [
            ["10倍した数", 10, [100, 1, 0.1], "10倍すると、位が1つ上がる（0が1つふえる）"],
            ["100倍した数", 100, [10, 1000, 1], "100倍すると、位が2つ上がる（0が2つふえる）"],
            ["10でわった数", 0.1, [0.01, 10, 1], "10でわると、位が1つ下がる（0が1つへる）"],
          ]);
          const val = (x) => jp(Math.round(N * x));
          const ans = val(m);
          return {
            q: `${jp(N)} を${lab}はどれですか。`,
            ans,
            choices: choices4(r, ans, traps.map(val)),
            hint: "10倍・100倍・10でわると、位がいくつ動くかな？",
            steps: [how, `${jp(N)} → ${ans}`],
          };
        }),
        t("E4-ookina-2b", (r) => {
          const E = r(7, 9);
          const vals = [];
          while (vals.length < 4) {
            const e = vals.length < 2 ? E : E - 1;
            const v = r(101, 999) * 10 ** e;
            if (!vals.includes(v)) vals.push(v);
          }
          const big = r(0, 1) === 1;
          const target = big ? Math.max(...vals) : Math.min(...vals);
          const sorted = [...vals].sort((a, b) => b - a).map(jp);
          return {
            q: `${vals.map(jp).join("、")} のうち、いちばん${big ? "大きい" : "小さい"}数はどれですか。`,
            ans: jp(target),
            choices: shuffle(r, vals.map(jp)),
            hint: "まず、いちばん上の区切り（兆・億・万）がどこまであるかをくらべよう。",
            steps: [`大きい順にならべると ${sorted.join("、")}`, `いちばん${big ? "大きい" : "小さい"}のは ${jp(target)}`],
          };
        }),
        t("E4-ookina-2c", (r) => {
          const a = r(1, 9);
          const b = r(1, 9999);
          const N = a * 1e12 + b * 1e8;
          return {
            q: `${jp(N)} は、1億を何こ集めた数ですか。`,
            ans: a * 10000 + b,
            unit: "こ",
            hint: "1兆は、1億を何こ集めた数かな？",
            steps: [`1兆は1億を10000こ集めた数なので、${a}兆は1億の ${a * 10000} こ分`, `${b}億は1億の ${b} こ分`, `あわせて ${a * 10000 + b} こ`],
          };
        }),
        t("E4-ookina-2d", (r) => {
          // 億・兆のたし算・ひき算（くり上がり・くり下がりあり）
          const plus = r(0, 1) === 1;
          const [S, bg, sm] = pick(r, [[1e8, "億", "万"], [1e8, "億", "万"], [1e12, "兆", "億"]]);
          const big = S === 1e8 ? () => r(12, 98) : () => r(1, 9);
          let X = big();
          let Y = big();
          let a = r(1, 9);
          let b = r(1, 9);
          if (plus && a + b < 10) [a, b] = [10 - b + r(0, b - 1), b];
          if (!plus) {
            if (X === Y) return { skip: true };
            if (X < Y) [X, Y] = [Y, X];
            if (a >= b) {
              a = r(1, 8);
              b = r(a + 1, 9);
            }
          }
          const x = X * S + a * (S / 10);
          const y = Y * S + b * (S / 10);
          const res = plus ? x + y : x - y;
          const ans = `${jp(res)}円`;
          const [A, B] = pick(r, [["A市の1年間の予算", "B市の1年間の予算"], ["A社の1年間の売り上げ", "B社の1年間の売り上げ"], ["A県の1年間の予算", "B県の1年間の予算"]]);
          // くり上がりをわすれる／小さい区切りを逆にひく（くり下げない）など
          const wrongNs = plus ? [res - S, res + S, res + 10 * S] : [(X - Y) * S + (b - a) * (S / 10), res + S, res - S, res + 10 * S];
          const steps = plus
            ? [`${bg}どうし：${X} ＋ ${Y} ＝ ${X + Y}（${bg}）、${sm}どうし：${a}000${sm} ＋ ${b}000${sm} ＝ ${a + b}000${sm}`, `${a + b}000${sm} ＝ 1${bg}${a + b > 10 ? `${a + b - 10}000${sm}` : ""} なので、1${bg}くり上げる`, `答え ${ans}`]
            : [`${a}000${sm} から ${b}000${sm} はひけないので、${bg}から1くり下げて 1${a}000${sm} と考える`, `${bg}どうし：${X} − 1 − ${Y} ＝ ${X - 1 - Y}（${bg}）、${sm}どうし：1${a}000 − ${b}000 ＝ ${10 + a - b}000（${sm}）`, `答え ${ans}`];
          return {
            q: `${A}は ${jp(x)}円、${B}は ${jp(y)}円です。${plus ? "あわせて" : "ちがいは"}何円ですか。`,
            ans,
            choices: choices4(r, ans, wrongNs.filter((v) => v > 0).map((v) => `${jp(v)}円`)),
            hint: `${bg}の部分と${sm}の部分に分けて計算しよう。1${bg} ＝ 10000${sm} だよ。`,
            steps,
          };
        }),
        t("E4-ookina-2e", (r) => {
          // 数直線の目もり（1目もりの大きさを考えてから読む）
          const [S, D] = pick(r, [[1e7, 10], [1e7, 10], [1e11, 10], [1e6, 10], [2e7, 5]]);
          const B = r(1, 9) * S * D;
          const n = r(1, D - 1);
          const val = B + n * S;
          const ans = jp(val);
          const wrongNs = [B + n * S * 10, B + (n * S) / 10, B + (n + 1) * S, B + (D - n) * S, B + (n - 1) * S];
          return {
            q: `${jp(B)} から ${jp(B + S * D)} までを ${D}等分した数直線があります。${jp(B)} から右へ ${n}目もりのところの数はどれですか。`,
            ans,
            choices: choices4(r, ans, wrongNs.filter((v) => v > B).map(jp)),
            hint: `まず、1目もりの大きさを考えよう。${jp(S * D)} を ${D}等分すると、いくつかな？`,
            steps: [`${jp(S * D)} を ${D}等分すると、1目もりは ${jp(S)}`, `${jp(B)} から ${n}目もり進むと、${jp(S)} × ${n} ＝ ${jp(n * S)} ふえる`, `答え ${ans}`],
          };
        }),
      ],
      3: [
        t("E4-ookina-3a", (r) => {
          const big = r(0, 1) === 1;
          const s = big ? "9876543210" : "1023456789";
          const pos = r(0, 9);
          const ans = Number(s[9 - pos]);
          return {
            q: `0から9までの数字カードを1まいずつ全部使って、10けたの数をつくります。いちばん${big ? "大きい" : "小さい"}数の、${PLACE[pos]}の位の数字は何ですか。`,
            ans,
            hint: big ? "大きい位に、大きい数字から順におこう。" : "いちばん上の位に 0 はおけないよ。",
            steps: big
              ? ["大きい位から 9, 8, 7, … と順にならべると 9876543210", `${PLACE[pos]}の位の数字は ${ans}`]
              : ["いちばん上の位には 0 をおけないので 1、そのつぎに 0、あとは小さい順", "いちばん小さい数は 1023456789", `${PLACE[pos]}の位の数字は ${ans}`],
          };
        }),
        t("E4-ookina-3b", (r) => {
          const X = r(11, 999) * 10 ** r(7, 9);
          const ans = jp(X * 10);
          return {
            q: `ある数を10倍したら ${jp(X)} になりました。もとの数を100倍した数はどれですか。`,
            ans,
            choices: choices4(r, ans, [jp(X * 100), jp(X), jp(X / 10), jp(X * 1000)]),
            hint: "まず、10倍する前の「もとの数」を求めよう。",
            steps: [`もとの数は ${jp(X)} ÷ 10 ＝ ${jp(X / 10)}`, `それを100倍して ${ans}`],
          };
        }),
        t("E4-ookina-3c", (r) => {
          const a = r(2, 9);
          if (r(0, 1)) {
            return {
              q: `${a}億円を、すべて1万円札にすると何まいになりますか。`,
              ans: a * 10000,
              unit: "まい",
              hint: "1億は、1万を何こ集めた数かな？",
              steps: ["1億は1万を10000こ集めた数", `${a}億円は1万円札 ${a} × 10000 ＝ ${a * 10000} まい`],
            };
          }
          const b = r(1, 9);
          return {
            q: `${a}億${b}000万円を、1000万円ずつのたばにすると、何たばになりますか。`,
            ans: a * 10 + b,
            unit: "たば",
            hint: "1億は、1000万を何こ集めた数かな？",
            steps: [`${a}億は1000万の ${a * 10} こ分`, `${b}000万は1000万の ${b} こ分`, `あわせて ${a * 10 + b} たば`],
          };
        }),
        t("E4-ookina-3d", (r) => {
          // 1万円札を重ねた高さ（大きな数のわり算）
          const intro = "1万円札を 100まい重ねると、高さはおよそ 1cm になります。";
          if (r(0, 1)) {
            const N = r(1, 9) * 1e8 + r(0, 9) * 1e7;
            const mai = N / 1e4;
            const cm = mai / 100;
            return {
              q: `${intro}${jp(N)}円を全部 1万円札にして重ねると、高さはおよそ何cmになりますか。`,
              ans: cm,
              unit: "cm",
              hint: "まず、1万円札が何まいになるかを考えよう。",
              steps: [`${jp(N)}円は 1万円の ${mai}こ分なので、1万円札 ${mai}まい`, `100まいで 1cm なので ${mai} ÷ 100 ＝ ${cm}`, `およそ ${cm}cm`],
            };
          }
          const a = r(1, 9);
          const mai = a * 1e8;
          const cm = mai / 100;
          const km = cm / 100000;
          return {
            q: `${intro}${a}兆円を全部 1万円札にして重ねると、高さはおよそ何kmになりますか。`,
            ans: km,
            unit: "km",
            hint: "1万円札のまい数 → cm → m → km の順に考えよう。",
            steps: [`1兆は1万の1億倍なので、${a}兆円は 1万円札 ${jp(mai)}まい`, `100まいで 1cm なので ${jp(mai)} ÷ 100 ＝ ${jp(cm)}（cm）`, `${jp(cm)}cm ＝ ${jp(cm / 100)}m ＝ ${km}km`],
          };
        }),
        t("E4-ookina-3e", (r) => {
          // 0 のある大きな数のかけ算（0 をのぞいて計算し、あとで0をつける）
          if (r(0, 1)) {
            const a = r(2, 30);
            const b = r(2, 9);
            const v = a * b;
            const ans = jp(v * 1e8);
            return {
              q: `${a}万 × ${b}万 はいくつですか。`,
              ans,
              choices: choices4(r, ans, [jp(v * 1e4), jp(v * 1e12), jp(v * 1e7), jp(v * 1e9)]),
              hint: "1万 × 1万 は、1万の1万倍だよ。",
              steps: [`${a} × ${b} ＝ ${v}`, `1万 × 1万 ＝ 1億 なので、${a}万 × ${b}万 ＝ ${v}億`],
            };
          }
          const a = r(1, 9) * 10 + r(1, 9);
          const b = r(1, 9) * 10 + r(1, 9);
          const v = a * b;
          const ans = jp(v * 1e4);
          return {
            q: `${a * 100} × ${b * 100} はいくつですか。`,
            ans,
            choices: choices4(r, ans, [jp(v * 1e3), jp(v * 1e5), jp(v * 1e2), jp(v * 1e6)]),
            hint: "0 をのぞいた数どうしをかけてから、0 をいくつつけるか考えよう。",
            steps: [`${a} × ${b} ＝ ${v}`, `${a * 100} と ${b * 100} の 0 は、あわせて 4こ`, `${v} に 0 を4こつけて ${v * 10000}（${ans}）`],
          };
        }),
      ],
      4: [
        t("E4-ookina-4a", (r) => {
          const d = r(2, 9);
          const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
          const up = all.filter((x) => x !== d);
          const above = String(d) + up.join("");
          const down = all.filter((x) => x !== d - 1).sort((a, b) => b - a);
          const below = String(d - 1) + down.join("");
          const T = d * 1e9;
          const da = Number(above) - T;
          const db = T - Number(below);
          const ans = da < db ? above : below;
          const t1 = String(d) + "10" + up.filter((x) => x > 1).join("");
          const t2 = below.slice(0, 8) + below[9] + below[8];
          return {
            q: `0から9までの数字カードを1まいずつ全部使って10けたの数をつくります。${jp(T)} にいちばん近い数はどれですか。`,
            ans,
            choices: choices4(r, ans, [da < db ? below : above, t1, t2]),
            hint: `${jp(T)} より少し大きい数と、少し小さい数の両方を考えよう。`,
            steps: [
              `${jp(T)} より大きくていちばん近いのは ${above}、小さくていちばん近いのは ${below}`,
              `${jp(T)} とのちがいは、${da} と ${db}`,
              `ちがいが小さいほうの ${ans}`,
            ],
          };
        }),
        t("E4-ookina-4b", (r) => {
          // □ に入る数字（大小くらべ）
          const L = r(3, 4);
          const ds = [r(1, 9)];
          for (let i = 1; i < L; i++) ds.push(r(0, 9));
          const j = r(1, L - 1);
          const bs = [...ds];
          bs[j] = r(1, 8);
          for (let i = j + 1; i < L; i++) bs[i] = r(0, 9);
          const unit = pick(r, ["億", "兆", "万"]);
          const big = r(0, 1) === 1;
          const B = Number(bs.join(""));
          const ok = [];
          for (let d = 0; d <= 9; d++) {
            const a = [...ds];
            a[j] = d;
            const v = Number(a.join(""));
            if (big ? v > B : v < B) ok.push(d);
          }
          if (ok.length === 0 || ok.length === 10) return { skip: true };
          const x = bs[j];
          const show = ds.map((d, i) => (i === j ? "□" : d)).join("");
          const restA = ds.slice(j + 1).join("");
          const restB = bs.slice(j + 1).join("");
          const eqOk = ok.includes(x);
          const eqLine =
            j === L - 1
              ? `□ が ${x} のときは ${B}${unit} と同じ数になるので、あてはまらない`
              : `□ が ${x} のときは、その下の位をくらべて ${restA} と ${restB} なので、${eqOk ? "あてはまる" : "あてはまらない"}`;
          return {
            q: `${show}${unit} は、${B}${unit} より${big ? "大きい" : "小さい"}数です。□ には 0 から 9 までの数字が1つ入ります。□ にあてはまる数字は何こありますか。`,
            ans: ok.length,
            unit: "こ",
            hint: "上の位から順にくらべよう。□ の位の数字が同じになるときに気をつけよう。",
            steps: [`□ より上の位は同じなので、□ の位の数字で大きさが決まる（${B}${unit} のその位は ${x}）`, eqLine, `あてはまる数字は ${ok.join("、")} の ${ok.length}こ`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-warihissan",
    grade: "E4",
    area: "num",
    name: "わり算の筆算",
    desc: "÷1けた・÷2けた",
    prereqs: ["E3-amari", "E3-kakezan"],
    points: [
      "わり算の筆算は、大きい位から「たてる → かける → ひく → おろす」をくり返すよ。",
      "あまりは、いつもわる数より小さくなるようにしよう。",
      "÷2けたは、わる数を何十とみて商の見当をつける。大きすぎたら1小さくしよう。",
      "たしかめ：わる数 × 商 ＋ あまり ＝ わられる数。",
    ],
    levels: {
      1: [
        t("E4-warihissan-1a", (r) => {
          const b = r(2, 9);
          const q = r(Math.ceil(100 / b), Math.floor(999 / b));
          const a = b * q;
          return {
            q: `${a} ÷ ${b} を筆算で計算しましょう。`,
            ans: q,
            hint: "大きい位から順に「たてる → かける → ひく → おろす」。",
            steps: [...hissan(a, b), `答え ${q}（たしかめ：${b} × ${q} ＝ ${a}）`],
          };
        }),
        t("E4-warihissan-1b", (r) => {
          const b = r(3, 9);
          const q = r(10, Math.floor((100 - b) / b));
          const m = r(1, b - 1);
          const a = b * q + m;
          const ans = `${q} あまり ${m}`;
          return {
            q: `${a} ÷ ${b} の商とあまりはどれですか。`,
            ans,
            choices: choices4(r, ans, [`${q - 1} あまり ${m + b}`, `${q + 1} あまり ${m}`, `${q} あまり ${b - m}`, `${q - 1} あまり ${m}`]),
            hint: "あまりは、わる数より小さくなるよ。",
            steps: [...hissan(a, b), `たしかめ：${b} × ${q} ＋ ${m} ＝ ${a}`],
          };
        }),
        t("E4-warihissan-1c", (r) => {
          const b = r(11, 32);
          const q = r(2, Math.floor(99 / b));
          const a = b * q;
          const g = Math.round(b / 10) * 10;
          const tq = Math.max(1, Math.floor(a / g));
          const fix = tq === q ? [] : [`${b} × ${tq} ＝ ${b * tq} で${tq > q ? "大きすぎる" : "小さすぎる"}ので、商を ${q} にする`];
          return {
            q: `${a} ÷ ${b} を計算しましょう。`,
            ans: q,
            hint: `${b} を ${g} とみて、商の見当をつけよう。`,
            steps: [`${b} を ${g} とみて、${a} ÷ ${g} から仮の商 ${tq} をたてる`, ...fix, `${b} × ${q} ＝ ${a} なので、答え ${q}`],
          };
        }),
        t("E4-warihissan-1d", (r) => {
          // 10・100 のまとまりで考えるわり算
          const b = r(2, 9);
          const q = r(2, 9);
          const k = r(0, 2);
          if (k === 0) {
            const a = 10 * b * q;
            return {
              q: `${a} ÷ ${b} を計算しましょう。`,
              ans: 10 * q,
              hint: "10 のまとまりが何こあるかで考えよう。",
              steps: [`${a} は 10 が ${b * q}こ`, `${b * q} ÷ ${b} ＝ ${q} なので、10 が ${q}こ`, `答え ${10 * q}`],
            };
          }
          if (k === 1) {
            const a = 100 * b * q;
            return {
              q: `${a} ÷ ${b} を計算しましょう。`,
              ans: 100 * q,
              hint: "100 のまとまりが何こあるかで考えよう。",
              steps: [`${a} は 100 が ${b * q}こ`, `${b * q} ÷ ${b} ＝ ${q} なので、100 が ${q}こ`, `答え ${100 * q}`],
            };
          }
          const a = 10 * b * q;
          return {
            q: `${a} ÷ ${10 * b} を計算しましょう。`,
            ans: q,
            hint: "10 のまとまりで考えると、何 ÷ 何になるかな？",
            steps: [`10 のまとまりで考えると ${b * q} ÷ ${b}`, `${b * q} ÷ ${b} ＝ ${q}`, `答え ${q}`],
          };
        }),
        t("E4-warihissan-1e", (r) => {
          // わり算の文章題（等分除・包含除、わり切れる）
          const b = r(2, 9);
          const q = r(12, Math.min(99, Math.floor(999 / b)));
          const n = b * q;
          const [text, u] = pick(r, [
            [`色紙が ${n}まいあります。${b}人で同じ数ずつ分けると、1人分は何まいになりますか。`, "まい"],
            [`${n}cm のリボンを、${b}cm ずつに切ります。${b}cm のリボンは何本できますか。`, "本"],
            [`あめが ${n}こあります。${b}つのふくろに同じ数ずつ入れると、1つのふくろのあめは何こになりますか。`, "こ"],
            [`${n}ページの本を、毎日同じページ数ずつ読んで、${b}日で読み終えます。1日に何ページ読めばよいですか。`, "ページ"],
            [`${n}人が、${b}人ずつのグループに分かれます。グループはいくつできますか。`, "グループ"],
          ]);
          return {
            q: text,
            ans: q,
            unit: u,
            hint: "同じ数ずつ分けるときや、いくつ分かを求めるときは、わり算を使うよ。",
            steps: [`式：${n} ÷ ${b}`, `${n} ÷ ${b} ＝ ${q}`, `答え ${q}${u}`],
          };
        }),
      ],
      2: [
        t("E4-warihissan-2a", (r) => {
          const b = r(3, 9);
          const q = r(Math.ceil(100 / b), Math.floor((999 - b) / b));
          const m = r(1, b - 1);
          const a = b * q + m;
          const ans = `${q} あまり ${m}`;
          return {
            q: `${a} ÷ ${b} の商とあまりはどれですか。`,
            ans,
            choices: choices4(r, ans, [`${q - 1} あまり ${m + b}`, `${q + 1} あまり ${m}`, `${q} あまり ${b - m}`, `${q - 10} あまり ${m}`]),
            hint: "百の位から順に計算しよう。あまりはわる数より小さいよ。",
            steps: [...hissan(a, b), `たしかめ：${b} × ${q} ＋ ${m} ＝ ${a}`],
          };
        }),
        t("E4-warihissan-2b", (r) => {
          const b = r(12, 79);
          const q = r(Math.max(2, Math.ceil(100 / b)), Math.floor(999 / b));
          const a = b * q;
          return {
            q: `${a} ÷ ${b} を筆算で計算しましょう。`,
            ans: q,
            hint: `${b} を何十とみて、商の見当をつけよう。`,
            steps: [...hissan(a, b), `答え ${q}（たしかめ：${b} × ${q} ＝ ${a}）`],
          };
        }),
        t("E4-warihissan-2c", (r) => {
          const b = r(3, 25);
          const q = r(11, 60);
          const m = r(1, b - 1);
          return {
            q: `わる数が ${b}、商が ${q}、あまりが ${m} のわり算があります。わられる数はいくつですか。`,
            ans: b * q + m,
            hint: "たしかめの式「わる数 × 商 ＋ あまり」を使おう。",
            steps: [`わる数 × 商 ＋ あまり ＝ わられる数`, `${b} × ${q} ＋ ${m} ＝ ${b * q + m}`],
          };
        }),
        t("E4-warihissan-2d", (r) => {
          // 商の見当：商は何の位からたつか
          const PL = ["百の位", "十の位", "一の位"];
          if (r(0, 1)) {
            const b = r(2, 9);
            const start = r(0, 1) === 1;
            const h = start ? r(b, 9) : r(1, b - 1);
            const a = h * 100 + r(0, 99);
            const ans = start ? "百の位" : "十の位";
            return {
              q: `${a} ÷ ${b} を筆算でするとき、商は何の位からたちますか。`,
              ans,
              choices: choices4(r, ans, PL.filter((x) => x !== ans)),
              hint: "わられる数の上の位から順に、わる数でわれるかどうかを見ていこう。",
              steps: start
                ? [`百の位の ${h} は ${b} 以上なので、${h} ÷ ${b} で百の位に商がたつ`, `商は3けたの数になる`]
                : [`百の位の ${h} は ${b} より小さいので、百の位に商はたたない`, `上から2けたの ${Math.floor(a / 10)} ÷ ${b} で、十の位から商がたつ（商は2けた）`],
            };
          }
          const b = r(12, 79);
          const start = r(0, 1) === 1;
          const top2 = start ? r(b, 99) : r(10, b - 1);
          const a = top2 * 10 + r(0, 9);
          const ans = start ? "十の位" : "一の位";
          return {
            q: `${a} ÷ ${b} を筆算でするとき、商は何の位からたちますか。`,
            ans,
            choices: choices4(r, ans, PL.filter((x) => x !== ans)),
            hint: "わられる数の上から2けたが、わる数より大きいか小さいかを見よう。",
            steps: start
              ? [`上から2けたの ${top2} は ${b} 以上なので、${top2} ÷ ${b} で十の位に商がたつ`, `商は2けたの数になる`]
              : [`上から2けたの ${top2} は ${b} より小さいので、十の位に商はたたない`, `${a} ÷ ${b} で、一の位に商がたつ（商は1けた）`],
          };
        }),
        t("E4-warihissan-2e", (r) => {
          // わり算のきまり：わられる数とわる数に同じ数をかけても、同じ数でわっても、商は変わらない
          if (r(0, 2) === 0) {
            const [d, k, B] = pick(r, [[25, 4, 100], [50, 2, 100], [5, 2, 10]]);
            const q = r(3, 40);
            const A = d * q;
            return {
              q: `${A} ÷ ${d} を、わられる数とわる数に同じ数をかけて、くふうして計算しましょう。`,
              ans: q,
              hint: `${d} に何をかけると、計算しやすい数になるかな？`,
              steps: [`わられる数とわる数に ${k} をかけても、商は変わらない`, `${A} ÷ ${d} ＝ ${A * k} ÷ ${B}`, `＝ ${q}`],
            };
          }
          const q = r(2, 9);
          const b0 = r(2, 9);
          const m = r(2, 3);
          const A = q * b0 * 10 ** m;
          const B = b0 * 10 ** m;
          const cut = r(1, m);
          const ex = (i, j) => `${A / 10 ** i} ÷ ${B / 10 ** j}`;
          const ans = ex(cut, cut);
          const wrongs = [ex(cut, 0), ex(0, cut), ex(cut, cut - 1), ex(cut - 1, cut), ex(m, 0), ex(0, m)].filter((s, i, arr) => arr.indexOf(s) === i);
          return {
            q: `${A} ÷ ${B} と商が同じになる式はどれですか。`,
            ans,
            choices: choices4(r, ans, wrongs.filter((s) => s !== ans)),
            hint: "わられる数とわる数を、同じ数でわっても、商は変わらないよ。",
            steps: [`わられる数とわる数を、どちらも ${10 ** cut} でわると ${ans}`, `${ans} ＝ ${q} なので、${A} ÷ ${B} ＝ ${q}`],
          };
        }),
        t("E4-warihissan-2f", (r) => {
          // 倍の計算（何倍か・もとにする大きさ）
          const [X, Y, u, bMax, scale] = pick(r, [
            ["赤いテープの長さ", "白いテープの長さ", "cm", 25, 1],
            ["ビルの高さ", "木の高さ", "m", 9, 1],
            [`${pick(r, NAMES)}さんの家から駅までの道のり`, "家から公園までの道のり", "m", 25, 10],
          ]);
          const k = r(3, 12);
          const Bv = r(4, bMax) * scale;
          const A = Bv * k;
          if (r(0, 1)) {
            return {
              q: `${X}は ${A}${u}、${Y}は ${Bv}${u} です。${X}は、${Y}の何倍ですか。`,
              ans: k,
              unit: "倍",
              hint: "何倍かを求めるときは、わり算を使うよ。",
              steps: [`${A} ÷ ${Bv} ＝ ${k}`, `${k}倍`],
            };
          }
          return {
            q: `${X}は ${A}${u} で、${Y}の ${k}倍です。${Y}は何${u}ですか。`,
            ans: Bv,
            unit: u,
            hint: `${Y}を □${u} として、□ × ${k} ＝ ${A} の式を考えよう。`,
            steps: [`□ × ${k} ＝ ${A}`, `□ ＝ ${A} ÷ ${k} ＝ ${Bv}`, `${Bv}${u}`],
          };
        }),
      ],
      3: [
        t("E4-warihissan-3a", (r) => {
          const b = r(3, 9);
          const k = r(4, 15);
          const m = r(1, b - 1);
          const n = b * k + m;
          const [text, who, u] = pick(r, [
            [`${n}人が、長いす1きゃくに${b}人ずつすわります。全員がすわるには、長いすは何きゃくいりますか。`, "人", "きゃく"],
            [`${n}このボールを、1箱に${b}こずつ入れます。全部のボールを入れるには、箱は何こいりますか。`, "こ", "こ"],
            [`${n}人が、ボート1そうに${b}人ずつ乗ります。全員が乗るには、ボートは何そういりますか。`, "人", "そう"],
          ]);
          return {
            q: text,
            ans: k + 1,
            unit: u,
            hint: "あまりが出たとき、あまりの分はどうすればいいかな？",
            steps: [`${n} ÷ ${b} ＝ ${k} あまり ${m}`, `あまりの ${m}${who}の分も、もう1${u}いる`, `${k} ＋ 1 ＝ ${k + 1}（${u}）`],
          };
        }),
        t("E4-warihissan-3b", (r) => {
          const b = r(3, 9);
          const k = r(12, Math.floor(999 / b));
          const x = b * k;
          let c = r(2, 8);
          if (c >= b) c += 1;
          const q = Math.floor(x / c);
          const m = x % c;
          return {
            q: `ある数を ${b} でわるところを、まちがえて ${c} でわってしまったので、${m ? `商が ${q} で、あまりが ${m}` : `わり切れて、商が ${q}`} になりました。正しい答えはいくつですか。`,
            ans: k,
            hint: "まず、まちがえた計算から「ある数」を求めよう。",
            steps: [`ある数は ${c} × ${q}${m ? ` ＋ ${m}` : ""} ＝ ${x}`, `正しい計算は ${x} ÷ ${b} ＝ ${k}`],
          };
        }),
        t("E4-warihissan-3c", (r) => {
          const b = r(12, 40);
          let n = r(150, 999);
          if (n % b === 0) n += 1;
          const q = Math.floor(n / b);
          const m = n % b;
          const ans = `${q}本とれて、${m}cm あまる`;
          return {
            q: `${n}cm のテープから、${b}cm のテープを切り取ります。${b}cm のテープは何本とれて、何cm あまりますか。`,
            ans,
            choices: choices4(r, ans, [`${q - 1}本とれて、${m + b}cm あまる`, `${q + 1}本とれて、${m}cm あまる`, `${q}本とれて、${b - m}cm あまる`, `${q - 1}本とれて、${m}cm あまる`]),
            hint: `${n} ÷ ${b} を計算しよう。`,
            steps: [...hissan(n, b), `${q}本とれて、${m}cm あまる`],
          };
        }),
        t("E4-warihissan-3d", (r) => {
          // まちがいさがし：筆算のどこがまちがっているか
          const R = ["商の十の位に 0 を書いていない", "あまりが、わる数より大きい", "あまりに 0 をつけわすれている", "一の位の数字をおろしていない"];
          const k = r(0, 3);
          let a, d, wrong, right, why;
          if (k === 0) {
            // 商に 0 がたつのに書いていない
            d = r(2, 9);
            const maxQ = Math.floor(999 / d);
            const h = r(1, Math.floor(maxQ / 100));
            const o = r(1, Math.min(9, maxQ - 100 * h));
            const q = 100 * h + o;
            const m = r(0, 2) === 0 ? r(1, d - 1) : 0;
            a = d * q + m;
            if (a > 999) return { skip: true };
            const T = (Math.floor(a / 100) % d) * 10 + (Math.floor(a / 10) % 10);
            right = `${q}${m ? ` あまり ${m}` : ""}`;
            wrong = `${h}${o}${m ? ` あまり ${m}` : ""}`;
            why = T === 0 ? `十の位は 0 なので、商の十の位に 0 を書く` : `十の位は ${T} ÷ ${d} で商がたたないので、商の十の位に 0 を書く`;
          } else if (k === 1) {
            // あまりがわる数より大きいまま
            d = r(3, 9);
            const m = r(1, d - 1);
            const q = r(10, Math.floor((99 - m) / d));
            a = d * q + m;
            right = `${q} あまり ${m}`;
            wrong = `${q - 1} あまり ${m + d}`;
            why = `あまりの ${m + d} は、わる数の ${d} より大きいので、商をもう1大きくできる`;
          } else if (k === 2) {
            // 何十でわるときのあまり
            const b = r(2, 9);
            d = 10 * b;
            const m = r(1, b - 1);
            const q = r(2, Math.floor((99 - m) / b));
            a = 10 * (b * q + m);
            right = `${q} あまり ${10 * m}`;
            wrong = `${q} あまり ${m}`;
            why = `10 のまとまりで ${a / 10} ÷ ${b} ＝ ${q} あまり ${m}。あまりは 10 が ${m}こで ${10 * m}`;
          } else {
            // 一の位をおろしわすれ
            d = r(2, 9);
            const t2 = r(Math.max(d, 10), 99);
            a = t2 * 10 + r(0, 9);
            const q = Math.floor(a / d);
            if (q % 10 === 0) return { skip: true };
            const m = a % d;
            right = `${q}${m ? ` あまり ${m}` : ""}`;
            wrong = `${Math.floor(t2 / d)}${t2 % d ? ` あまり ${t2 % d}` : ""}`;
            why = `${t2} ÷ ${d} のあと、一の位の ${a % 10} をおろして計算をつづける`;
          }
          return {
            q: `${pick(r, NAMES)}さんは、${a} ÷ ${d} を筆算で計算して、答えを「${wrong}」としました。どこがまちがっていますか。`,
            ans: R[k],
            choices: choices4(r, R[k], R.filter((_, i) => i !== k)),
            hint: "たしかめの計算（わる数 × 商 ＋ あまり）をしたり、あまりとわる数をくらべたりしてみよう。",
            steps: [`正しくは ${a} ÷ ${d} ＝ ${right}`, why, `答え：「${R[k]}」`],
          };
        }),
        t("E4-warihissan-3e", (r) => {
          // 0 を消して計算したときのあまり
          const z = r(1, 2);
          const Z = 10 ** z;
          const b = r(2, 9);
          const q = r(2, 19);
          const m = r(1, b - 1);
          const A = (b * q + m) * Z;
          const B = b * Z;
          const ans = `${q} あまり ${m * Z}`;
          return {
            q: `${A} ÷ ${B} の商とあまりはどれですか。`,
            ans,
            choices: choices4(r, ans, [`${q} あまり ${m}`, `${q} あまり ${m * Z * 10}`, `${q * Z} あまり ${m}`, `${q - 1} あまり ${(m + b) * Z}`]),
            hint: `0 を同じ数だけ消して ${b * q + m} ÷ ${b} と考えると、商が分かるよ。あまりの大きさに気をつけよう。`,
            steps: [`0 を ${z}こずつ消して ${b * q + m} ÷ ${b} ＝ ${q} あまり ${m}`, `あまりの ${m} は、${Z} が ${m}こ分なので ${m * Z}`, `たしかめ：${B} × ${q} ＋ ${m * Z} ＝ ${A}`, `答え ${ans}`],
          };
        }),
        t("E4-warihissan-3f", (r) => {
          // あまりの処理：切り捨てと「あと何こあれば」
          const b = r(3, 9);
          const q = r(8, 40);
          const m = r(1, b - 1);
          const n = b * q + m;
          const [text, per, u] = pick(r, [
            [`色紙が ${n}まいあります。1人に ${b}まいずつ配ると、何人に配れますか。また、あと何まいあれば、もう1人に配れますか。`, "人", "まい"],
            [`クッキーが ${n}こあります。1ふくろに ${b}こずつ入れると、何ふくろできますか。また、あと何こあれば、もう1ふくろできますか。`, "ふくろ", "こ"],
            [`${n}cm のリボンから、${b}cm のリボンを切り取ります。何本とれますか。また、あと何cm長ければ、もう1本とれますか。`, "本", "cm"],
          ]);
          const verb = per === "人" ? "に配れて" : per === "ふくろ" ? "できて" : "とれて";
          const fmt = (x, y) => `${x}${per}${verb}、あと ${y}${u}`;
          const ans = fmt(q, b - m);
          return {
            q: text,
            ans,
            choices: choices4(r, ans, [fmt(q, m), fmt(q + 1, b - m), fmt(q + 1, m), fmt(q, b)]),
            hint: "わり算のあまりの分では、もう1つ分にたりないね。あまりとわる数をくらべよう。",
            steps: [`${n} ÷ ${b} ＝ ${q} あまり ${m}`, `${q}${per}${verb}、${m}${u} あまる`, `もう1${per}分には ${b} − ${m} ＝ ${b - m}（${u}）たりない`],
          };
        }),
      ],
      4: [
        t("E4-warihissan-4a", (r) => {
          const b = r(6, 29);
          const m = r(1, b - 1);
          const big = r(0, 1) === 1;
          let x = big ? 999 : 100;
          while (x % b !== m) x += big ? -1 : 1;
          return {
            q: `${b} でわると ${m} あまる3けたの整数のうち、いちばん${big ? "大きい" : "小さい"}数はいくつですか。`,
            ans: x,
            hint: big ? `999 を ${b} でわって、あまりを調べてみよう。` : `100 を ${b} でわって、あまりを調べてみよう。`,
            steps: big
              ? [`999 ÷ ${b} ＝ ${Math.floor(999 / b)} あまり ${999 % b}`, `あまりが ${m} になるように調整すると ${b} × ${Math.floor(x / b)} ＋ ${m} ＝ ${x}`]
              : [`100 ÷ ${b} ＝ ${Math.floor(100 / b)} あまり ${100 % b}`, `あまりが ${m} になるいちばん小さい3けたの数は ${b} × ${Math.floor(x / b)} ＋ ${m} ＝ ${x}`],
          };
        }),
        t("E4-warihissan-4b", (r) => {
          const b = r(4, 15);
          const ans = (b + 1) * (b - 1);
          return {
            q: `ある整数を ${b} でわったところ、商とあまりが同じ数になりました。このような整数のうち、いちばん大きい数はいくつですか。`,
            ans,
            hint: "あまりは、わる数より小さいことを使おう。",
            steps: [
              `商とあまりを □ とすると、ある数 ＝ ${b} × □ ＋ □ ＝ ${b + 1} × □`,
              `あまりは ${b} より小さいので、□ はいちばん大きくて ${b - 1}`,
              `${b + 1} × ${b - 1} ＝ ${ans}`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-gaisu",
    grade: "E4",
    area: "num",
    name: "がい数",
    desc: "四捨五入・見積もり",
    prereqs: ["E4-ookina"],
    points: [
      "およその数を「がい数」というよ。",
      "四捨五入：求める位の1つ下の位の数字が 0〜4 なら切り捨て、5〜9 なら切り上げる。",
      "「上から2けたのがい数」は、上から3けた目を四捨五入するよ。",
      "見積もりは、がい数にしてから計算すると速くできるよ。",
    ],
    levels: {
      1: [
        t("E4-gaisu-1a", (r) => {
          const n = r(10000, 99999);
          const [lab, u, low] = pick(r, [["千の位", 1000, "百"], ["百の位", 100, "十"], ["一万の位", 10000, "千"]]);
          const dig = Math.floor(n / (u / 10)) % 10;
          const ans = gaisu(n, u);
          return {
            q: `${n} を四捨五入して、${lab}までのがい数にしましょう。`,
            ans,
            hint: `${lab}の1つ下の、${low}の位の数字を見よう。`,
            steps: [`${low}の位の数字は ${dig}`, `${dig < 5 ? "0〜4 なので切り捨てて" : "5〜9 なので切り上げて"} ${ans}`],
          };
        }),
        t("E4-gaisu-1b", (r) => {
          const n = r(1000, 999999);
          const L = String(n).length;
          const u = 10 ** (L - 2);
          const dig = Math.floor(n / (u / 10)) % 10;
          const ans = gaisu(n, u);
          return {
            q: `${n} を四捨五入して、上から2けたのがい数にしましょう。`,
            ans,
            hint: "上から3けた目の数字を見よう。",
            steps: [`上から3けた目の数字は ${dig}`, `${dig < 5 ? "切り捨てて" : "切り上げて"} ${ans}`],
          };
        }),
        t("E4-gaisu-1c", (r) => {
          const X = r(2, 9);
          const lo = X * 1000 - 500;
          const hi = X * 1000 + 500;
          const ok = pick(r, [lo + r(0, 40), hi - 1 - r(0, 40), r(lo, hi - 1)]);
          return {
            q: `四捨五入して千の位までのがい数にすると ${X * 1000} になる数はどれですか。`,
            ans: ok,
            choices: choices4(r, ok, [hi + r(0, 60), lo - 1 - r(0, 60), X * 1000 + 1000 + r(0, 400), X * 100 + r(1, 99)]),
            hint: "百の位の数字を見て、切り捨てか切り上げかを考えよう。",
            steps: [`${X * 1000} になるのは ${lo} 以上 ${hi} 未満の数`, `あてはまるのは ${ok}`],
          };
        }),
        t("E4-gaisu-1d", (r) => {
          // 切り上げ・切り捨て（四捨五入とはちがう答えになる数で）
          const up = r(0, 1) === 1;
          const [u, lab] = pick(r, [[100, "百"], [1000, "千"], [10000, "一万"]]);
          const P = r(10, 99);
          const rest = up ? r(1, u / 2 - 1) : r(u / 2, u - 1);
          const n = P * u + rest;
          const ans = up ? (P + 1) * u : P * u;
          return {
            q: `${n} を、${up ? "切り上げ" : "切り捨て"}て、${lab}の位までのがい数にしましょう。`,
            ans,
            hint: `${lab}の位より下の位を見よう。${up ? "切り上げ" : "切り捨て"}は、四捨五入とどこがちがうかな？`,
            steps: up
              ? [`${lab}の位より下の位が 0 でないので、${lab}の位を1大きくして、下の位をすべて 0 にする`, `${n} → ${ans}`]
              : [`${lab}の位より下の位を、すべて 0 にする`, `${n} → ${ans}`],
          };
        }),
        t("E4-gaisu-1e", (r) => {
          // 以上・以下・未満
          const a = r(5, 60);
          const b = a + r(4, 9);
          const k = r(0, 2);
          if (k === 0) {
            return {
              q: `${a} 以上 ${b} 未満の整数は、何こありますか。`,
              ans: b - a,
              unit: "こ",
              hint: "「以上」はその数をふくむ、「未満」はその数をふくまないよ。",
              steps: [`${a} 以上 ${b} 未満の整数は、${a} から ${b - 1} まで`, `${b - 1} − ${a} ＋ 1 ＝ ${b - a}（こ）`],
            };
          }
          if (k === 1) {
            return {
              q: `${a} 以上 ${b} 以下の整数は、何こありますか。`,
              ans: b - a + 1,
              unit: "こ",
              hint: "「以上」「以下」は、どちらもその数をふくむよ。",
              steps: [`${a} 以上 ${b} 以下の整数は、${a} から ${b} まで`, `${b} − ${a} ＋ 1 ＝ ${b - a + 1}（こ）`],
            };
          }
          const x = r(0, 1) ? a : r(a + 1, b - 1);
          return {
            q: `次の数のうち、「${a} 以上 ${b} 未満」に入る数はどれですか。`,
            ans: x,
            choices: choices4(r, x, [b, a - 1, b + r(1, 3)]),
            hint: "「以上」はその数をふくむ、「未満」はその数をふくまないよ。",
            steps: [`「${a} 以上 ${b} 未満」は、${a} をふくみ、${b} をふくまない`, `あてはまるのは ${x}`],
          };
        }),
      ],
      2: [
        t("E4-gaisu-2a", (r) => {
          const [u, lab] = pick(r, [[10, "十"], [100, "百"], [1000, "千"]]);
          const B = r(3, 99) * u;
          const big = r(0, 1) === 1;
          const ans = big ? B + u / 2 - 1 : B - u / 2;
          return {
            q: `四捨五入して${lab}の位までのがい数にすると ${B} になる整数のうち、いちばん${big ? "大きい" : "小さい"}数はいくつですか。`,
            ans,
            hint: `${lab}の位の1つ下の位で、切り捨てになる数・切り上げになる数を考えよう。`,
            steps: [`${B} になるのは ${B - u / 2} 以上 ${B + u / 2} 未満の整数`, `いちばん${big ? "大きい" : "小さい"}のは ${ans}`],
          };
        }),
        t("E4-gaisu-2b", (r) => {
          const plus = r(0, 1) === 1;
          let a = r(10000, 99999);
          let b = r(10000, 99999);
          if (!plus && a < b) [a, b] = [b, a];
          const ra = gaisu(a, 1000);
          const rb = gaisu(b, 1000);
          if (!plus && ra === rb) return { skip: true };
          const ans = plus ? ra + rb : ra - rb;
          const op = plus ? "＋" : "−";
          return {
            q: `${a} ${op} ${b} を、それぞれ四捨五入して千の位までのがい数にしてから計算しましょう。`,
            ans,
            hint: "先に、2つの数をそれぞれがい数にしよう。",
            steps: [`${a} → ${ra}、${b} → ${rb}`, `${ra} ${op} ${rb} ＝ ${ans}`],
          };
        }),
        t("E4-gaisu-2c", (r) => {
          const [u, lab] = pick(r, [[10, "十"], [100, "百"]]);
          const B = r(3, 99) * u;
          const lo = B - u / 2;
          const hi = B + u / 2;
          const ans = `${lo}以上${hi}未満`;
          return {
            q: `四捨五入して${lab}の位までのがい数にすると ${B} になる整数のはんいはどれですか。`,
            ans,
            choices: choices4(r, ans, [`${lo}以上${hi}以下`, `${B}以上${B + u}未満`, `${lo + 1}以上${hi + 1}未満`, `${B - u}以上${B}未満`]),
            hint: `${hi} を四捨五入すると、いくつになるかな？`,
            steps: [`いちばん小さいのは ${lo}、${hi} は切り上げて ${B + u} になってしまう`, `だから ${ans}`],
          };
        }),
        t("E4-gaisu-2d", (r) => {
          // 商の見積もり（上から1けたのがい数にしてから計算）
          const k = r(3, 4);
          const K = 10 ** k;
          let dA = 0;
          let dn = 0;
          for (let i = 0; i < 50; i++) {
            dA = r(1, 9);
            dn = r(2, 9);
            if ((dA * K) % (dn * 10) === 0 && (dA * K) / (dn * 10) >= 10) break;
            dA = 0;
          }
          if (!dA) return { skip: true };
          const RA = dA * K;
          const Rn = dn * 10;
          let A = r(Math.max(K, RA - K / 2), RA + K / 2 - 1);
          if (A === RA) A += r(1, 9) * (K / 100);
          let n = r(Rn - 5, Rn + 4);
          if (n === Rn) n += 1;
          const ans = RA / Rn;
          const [text, u] = pick(r, [
            [`遠足のバス代 ${A}円を、${n}人で同じように分けます。1人分はおよそ何円ですか。`, "円"],
            [`工場で作ったボール ${A}こを、${n}箱に同じ数ずつ入れます。1箱分はおよそ何こですか。`, "こ"],
            [`色紙 ${A}まいを、${n}人で同じ数ずつ分けます。1人分はおよそ何まいですか。`, "まい"],
          ]);
          return {
            q: `${text}わられる数とわる数を、それぞれ上から1けたのがい数にして見積もりましょう。`,
            ans,
            unit: u,
            hint: "上から2けた目を四捨五入して、上から1けたのがい数にしよう。",
            steps: [`${A} → ${RA}、${n} → ${Rn}`, `${RA} ÷ ${Rn} ＝ ${ans}`, `およそ ${ans}${u}`],
          };
        }),
        t("E4-gaisu-2e", (r) => {
          // どの位までのがい数にしたか
          const n = r(10000, 99999);
          const opts = [[10, "十の位"], [100, "百の位"], [1000, "千の位"], [10000, "一万の位"]];
          const [u, lab] = pick(r, opts);
          const R = gaisu(n, u);
          if (R === n || opts.filter(([v]) => gaisu(n, v) === R).length > 1) return { skip: true };
          return {
            q: `${n} を四捨五入して、${R} にしました。何の位までのがい数にしましたか。`,
            ans: lab,
            choices: choices4(r, lab, opts.filter(([v]) => v !== u).map(([, l]) => l)),
            hint: "それぞれの位までのがい数にして、くらべてみよう。",
            steps: [opts.map(([v, l]) => `${l}まで → ${gaisu(n, v)}`).join("、"), `${R} になるのは ${lab}までのがい数`],
          };
        }),
      ],
      3: [
        t("E4-gaisu-3a", (r) => {
          const p = r(110, 940);
          const n = r(11, 94);
          const rp = gaisu(p, 100);
          const rn = gaisu(n, 10);
          const ans = rp * rn;
          return {
            q: `1こ ${p}円のおかしを ${n}こ買います。代金はおよそ何円ですか。ねだんと こ数を、それぞれ上から1けたのがい数にして見積もりましょう。`,
            ans,
            unit: "円",
            hint: "上から2けた目を四捨五入して、上から1けたのがい数にしよう。",
            steps: [`${p} → ${rp}、${n} → ${rn}`, `${rp} × ${rn} ＝ ${ans}`, `およそ ${ans}円`],
          };
        }),
        t("E4-gaisu-3b", (r) => {
          if (r(0, 1)) {
            let n = r(1001, 9999);
            if (n % 1000 === 0) n += 1;
            const ans = Math.ceil(n / 1000);
            return {
              q: `${n}円の買い物を、1000円札だけではらいます。1000円札は少なくとも何まいいりますか。`,
              ans,
              unit: "まい",
              hint: "たりないと買えないね。切り上げ・切り捨てのどちらを使うかな？",
              steps: [`${n}円を千の位までのがい数にする。足りなくならないように切り上げる`, `${n} → ${ans * 1000}`, `1000円札 ${ans} まい`],
            };
          }
          const n = r(250, 2999);
          const ans = Math.floor(n / 100);
          return {
            q: `画用紙が ${n}まいあります。100まいずつのたばにすると、100まいのたばはいくつできますか。`,
            ans,
            unit: "たば",
            hint: "100まいにならない分は、たばにできないね。切り上げ・切り捨てのどちらかな？",
            steps: [`百の位までのがい数にする。100まいにならない分は切り捨てる`, `${n} → ${ans * 100}`, `${ans} たば`],
          };
        }),
        t("E4-gaisu-3c", (r) => {
          const x = r(101, 940);
          const A = gaisu(x, 10);
          const B = gaisu(x, 100);
          let ans = 0;
          for (let y = 0; y < 2000; y++) {
            if (gaisu(y, 10) === A && gaisu(y, 100) === B) {
              ans = y;
              break;
            }
          }
          return {
            q: `四捨五入して十の位までのがい数にすると ${A} になり、百の位までのがい数にすると ${B} になる整数のうち、いちばん小さい数はいくつですか。`,
            ans,
            hint: "2つの条件のはんいを、それぞれ「〜以上〜未満」で書いてみよう。",
            steps: [`十の位までで ${A} になるのは ${A - 5} 以上 ${A + 5} 未満`, `百の位までで ${B} になるのは ${B - 50} 以上 ${B + 50} 未満`, `両方にあてはまるいちばん小さい整数は ${ans}`],
          };
        }),
        t("E4-gaisu-3d", (r) => {
          // 目的にあわせた見積もり方（足りるか → 切り上げ、こえるか → 切り捨て）
          const name = pick(r, NAMES);
          const enough = r(0, 1) === 1;
          const hs = [];
          let B;
          if (enough) {
            B = pick(r, [1000, 1500, 2000, 2500, 3000]);
            const T = B / 100 - 3; // 切り上げた合計が B 以下になるように
            hs.push(r(1, Math.min(9, T - 2)));
            hs.push(r(1, Math.min(9, T - 1 - hs[0])));
            hs.push(r(1, Math.min(9, T - hs[0] - hs[1])));
          } else {
            B = pick(r, [1000, 1500, 2000]);
            const T = B / 100; // 切り捨てた合計が B 以上になるように
            hs.push(r(Math.max(1, T - 18), 9));
            hs.push(r(Math.max(1, T - hs[0] - 9), 9));
            hs.push(r(Math.max(1, T - hs[0] - hs[1]), 9));
          }
          const ps = hs.map((h) => h * 100 + r(1, 99));
          const up = hs.reduce((s, h) => s + (h + 1) * 100, 0);
          const down = hs.reduce((s, h) => s + h * 100, 0);
          const rd = ps.reduce((s, p) => s + gaisu(p, 100), 0);
          const items = `${ps.join("円、")}円`;
          if (enough) {
            const say = (how, v, end) => `${how}て ${v}円と見積もる。${B}円以下なので、${end}`;
            const ans = say("切り上げ", up, "足りると言える");
            return {
              q: `${name}さんは ${B}円を持って買い物に行きます。${items}の品物を買うとき、お金が足りるかどうかを、ねだんを百の位までのがい数にして見積もります。正しい考え方はどれですか。`,
              ans,
              choices: choices4(r, ans, [say("切り捨て", down, "足りると言える"), say("四捨五入し", rd, "足りると言える"), say("切り上げ", up, "足りるかどうかは分からない")]),
              hint: "見積もった代金が、本当の代金より多くなるか少なくなるかを考えよう。",
              steps: [`切り上げると、本当の代金より多めに見積もることになる`, `多めに見積もった ${up}円でも ${B}円以下なので、本当の代金なら足りると言える`, `切り捨てや四捨五入では、本当の代金より少なく見積もることがあるので、足りるとは言い切れない`],
            };
          }
          const say = (how, v, end) => `${how}て ${v}円と見積もる。${B}円以上なので、${end}`;
          const ans = say("切り捨て", down, "くじが引けると言える");
          return {
            q: `${B}円以上の買い物をすると、くじが1回引けます。${name}さんは ${items}の品物を買います。くじが引けるかどうかを、ねだんを百の位までのがい数にして見積もります。正しい考え方はどれですか。`,
            ans,
            choices: choices4(r, ans, [say("切り上げ", up, "くじが引けると言える"), say("四捨五入し", rd, "くじが引けると言える"), say("切り捨て", down, "くじが引けるかどうかは分からない")]),
            hint: "見積もった代金が、本当の代金より多くなるか少なくなるかを考えよう。",
            steps: [`切り捨てると、本当の代金より少なめに見積もることになる`, `少なめに見積もった ${down}円でも ${B}円以上なので、本当の代金ならくじが引けると言える`, `切り上げや四捨五入では、本当の代金より多く見積もることがあるので、引けるとは言い切れない`],
          };
        }),
        t("E4-gaisu-3e", (r) => {
          // がい数にして、ぼうグラフの目もりに表す
          const [u, lab, scale, sLab] = pick(r, [
            [10000, "一万の位", 10000, "1万人"],
            [10000, "一万の位", 20000, "2万人"],
            [1000, "千の位", 1000, "1000人"],
            [1000, "千の位", 2000, "2000人"],
          ]);
          const town = pick(r, ["A市", "B市", "C町", "ある市"]);
          const ticks = r(6, 30);
          const R = ticks * scale;
          let n = R - u / 2 + r(0, u - 1);
          if (n === R) n += r(1, u / 2 - 1);
          return {
            q: `${town}の人口は ${n}人です。人口を四捨五入して${lab}までのがい数にし、1目もりが ${sLab} のぼうグラフに表します。ぼうの長さは何目もりになりますか。`,
            ans: ticks,
            unit: "目もり",
            hint: "まず、人口をがい数にしよう。そのあと、1目もりの何こ分かを考えよう。",
            steps: [`${n} → ${R}（${lab}までのがい数）`, `${R} ÷ ${scale} ＝ ${ticks}`, `${ticks}目もり`],
          };
        }),
      ],
      4: [
        t("E4-gaisu-4a", (r) => {
          const p = r(23, 97);
          const n0 = r(5, 30);
          const B = gaisu(p * n0, 100);
          let ans = n0;
          while (gaisu(p * (ans + 1), 100) === B) ans++;
          return {
            q: `1こ ${p}円のガムを何こか買いました。代金を四捨五入して百の位までのがい数にすると ${B}円でした。買ったガムの数として考えられるうち、いちばん多いのは何こですか。`,
            ans,
            unit: "こ",
            hint: `代金は「何円以上何円未満」か考えよう。`,
            steps: [`代金は ${B - 50}円以上 ${B + 50}円未満`, `${p} × ${ans} ＝ ${p * ans}、${p} × ${ans + 1} ＝ ${p * (ans + 1)}`, `${B + 50}円未満になるいちばん多い数は ${ans}こ`],
          };
        }),
        t("E4-gaisu-4b", (r) => {
          // がい数のもとの数のはんいから、和・差のいちばん大きい・小さい数を考える
          const [u, lab] = pick(r, [[10, "十"], [100, "百"]]);
          let RA = r(3, 49) * u;
          let RB = r(3, 49) * u;
          if (RA === RB) return { skip: true };
          const k = r(0, 2);
          if (k === 2 && RA < RB) [RA, RB] = [RB, RA];
          const loA = RA - u / 2;
          const hiA = RA + u / 2 - 1;
          const loB = RB - u / 2;
          const hiB = RB + u / 2 - 1;
          const [what, ans, line] = [
            ["A ＋ B として考えられる、いちばん大きい数", hiA + hiB, `A も B もいちばん大きいとき：${hiA} ＋ ${hiB} ＝ ${hiA + hiB}`],
            ["A ＋ B として考えられる、いちばん小さい数", loA + loB, `A も B もいちばん小さいとき：${loA} ＋ ${loB} ＝ ${loA + loB}`],
            ["A − B として考えられる、いちばん大きい数", hiA - loB, `A がいちばん大きく、B がいちばん小さいとき：${hiA} − ${loB} ＝ ${hiA - loB}`],
          ][k];
          return {
            q: `2つの整数 A と B があります。A を四捨五入して${lab}の位までのがい数にすると ${RA}、B を四捨五入して${lab}の位までのがい数にすると ${RB} になります。${what}はいくつですか。`,
            ans,
            hint: "A と B が、それぞれ「何以上何以下」の整数かを考えよう。",
            steps: [`A は ${loA} 以上 ${hiA} 以下、B は ${loB} 以上 ${hiB} 以下の整数`, line, `答え ${ans}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-keisan",
    grade: "E4",
    area: "num",
    name: "計算のきまり",
    desc: "( )・四則混合・分配のきまり",
    prereqs: ["E4-warihissan"],
    points: [
      "( ) のある式は、( ) の中を先に計算するよ。",
      "× と ÷ は、＋ と − より先に計算する。あとは左から順に。",
      "分配のきまり：$(a+b) \\times c = a \\times c + b \\times c$。計算の工夫に使えるよ。",
    ],
    levels: {
      1: [
        t("E4-keisan-1a", (r) => {
          const b = r(2, 9);
          const c = r(2, 9);
          if (r(0, 1)) {
            const a = r(2, 60);
            return {
              q: `${a} ＋ ${b} × ${c} を計算しましょう。`,
              ans: a + b * c,
              hint: "× を先に計算するよ。",
              steps: [`先に ${b} × ${c} ＝ ${b * c}`, `${a} ＋ ${b * c} ＝ ${a + b * c}`],
            };
          }
          const a = b * c + r(1, 40);
          return {
            q: `${a} − ${b} × ${c} を計算しましょう。`,
            ans: a - b * c,
            hint: "× を先に計算するよ。",
            steps: [`先に ${b} × ${c} ＝ ${b * c}`, `${a} − ${b * c} ＝ ${a - b * c}`],
          };
        }),
        t("E4-keisan-1b", (r) => {
          const c = r(2, 9);
          const k = r(0, 2);
          if (k === 0) {
            const a = r(2, 30);
            const b = r(2, 30);
            return {
              q: `(${a} ＋ ${b}) × ${c} を計算しましょう。`,
              ans: (a + b) * c,
              hint: "( ) の中を先に計算するよ。",
              steps: [`( ) の中：${a} ＋ ${b} ＝ ${a + b}`, `${a + b} × ${c} ＝ ${(a + b) * c}`],
            };
          }
          if (k === 1) {
            const b = r(2, 30);
            const a = b + r(1, 20);
            return {
              q: `(${a} − ${b}) × ${c} を計算しましょう。`,
              ans: (a - b) * c,
              hint: "( ) の中を先に計算するよ。",
              steps: [`( ) の中：${a} − ${b} ＝ ${a - b}`, `${a - b} × ${c} ＝ ${(a - b) * c}`],
            };
          }
          const s = c * r(3, 12);
          const a = r(1, s - 1);
          return {
            q: `(${a} ＋ ${s - a}) ÷ ${c} を計算しましょう。`,
            ans: s / c,
            hint: "( ) の中を先に計算するよ。",
            steps: [`( ) の中：${a} ＋ ${s - a} ＝ ${s}`, `${s} ÷ ${c} ＝ ${s / c}`],
          };
        }),
        t("E4-keisan-1c", (r) => {
          const c = r(2, 9);
          const k = r(2, 9);
          const b = c * k;
          if (r(0, 1)) {
            const a = r(2, 60);
            return {
              q: `${a} ＋ ${b} ÷ ${c} を計算しましょう。`,
              ans: a + k,
              hint: "÷ を先に計算するよ。",
              steps: [`先に ${b} ÷ ${c} ＝ ${k}`, `${a} ＋ ${k} ＝ ${a + k}`],
            };
          }
          const a = k + r(1, 50);
          return {
            q: `${a} − ${b} ÷ ${c} を計算しましょう。`,
            ans: a - k,
            hint: "÷ を先に計算するよ。",
            steps: [`先に ${b} ÷ ${c} ＝ ${k}`, `${a} − ${k} ＝ ${a - k}`],
          };
        }),
      ],
      2: [
        t("E4-keisan-2a", (r) => {
          const a = r(3, 12);
          const b = r(3, 12);
          if (r(0, 1)) {
            const c = r(2, 9);
            const d = r(2, 9);
            if (a * b <= c * d) return { skip: true };
            return {
              q: `${a} × ${b} − ${c} × ${d} を計算しましょう。`,
              ans: a * b - c * d,
              hint: "かけ算を2つとも先に計算しよう。",
              steps: [`${a} × ${b} ＝ ${a * b}、${c} × ${d} ＝ ${c * d}`, `${a * b} − ${c * d} ＝ ${a * b - c * d}`],
            };
          }
          const d = r(2, 9);
          const k = r(2, 9);
          return {
            q: `${a} × ${b} ＋ ${d * k} ÷ ${d} を計算しましょう。`,
            ans: a * b + k,
            hint: "× と ÷ を先に計算しよう。",
            steps: [`${a} × ${b} ＝ ${a * b}、${d * k} ÷ ${d} ＝ ${k}`, `${a * b} ＋ ${k} ＝ ${a * b + k}`],
          };
        }),
        t("E4-keisan-2b", (r) => {
          const a = r(2, 20);
          const b = r(2, 20);
          const c = r(2, 9);
          const e = r(2, 9);
          const k = r(2, 9);
          const d = e * k;
          const v = (a + b) * c - k;
          if (v < 0) return { skip: true };
          return {
            q: `(${a} ＋ ${b}) × ${c} − ${d} ÷ ${e} を計算しましょう。`,
            ans: v,
            hint: "( ) → × と ÷ → ＋ と − の順に計算しよう。",
            steps: [`( ) の中：${a} ＋ ${b} ＝ ${a + b}`, `${a + b} × ${c} ＝ ${(a + b) * c}、${d} ÷ ${e} ＝ ${k}`, `${(a + b) * c} − ${k} ＝ ${v}`],
          };
        }),
        t("E4-keisan-2c", (r) => {
          const k = r(0, 2);
          if (k === 0) {
            const n = r(3, 49);
            return {
              q: `25 × ${n} × 4 をくふうして計算しましょう。`,
              ans: 100 * n,
              hint: "かける順番を変えてもいいよ。25 × 4 はいくつ？",
              steps: ["25 × 4 を先に計算すると 100", `100 × ${n} ＝ ${100 * n}`],
            };
          }
          if (k === 1) {
            const n = r(3, 49);
            return {
              q: `${n} × 99 をくふうして計算しましょう。`,
              ans: n * 99,
              hint: "99 ＝ 100 − 1 と考えよう。",
              steps: [`${n} × 99 ＝ ${n} × (100 − 1)`, `＝ ${n * 100} − ${n}`, `＝ ${n * 99}`],
            };
          }
          const n = r(3, 49);
          return {
            q: `${n} × 101 をくふうして計算しましょう。`,
            ans: n * 101,
            hint: "101 ＝ 100 ＋ 1 と考えよう。",
            steps: [`${n} × 101 ＝ ${n} × (100 ＋ 1)`, `＝ ${n * 100} ＋ ${n}`, `＝ ${n * 101}`],
          };
        }),
      ],
      3: [
        t("E4-keisan-3a", (r) => {
          const a = r(6, 18) * 10;
          const b = r(2, 5);
          const c = r(8, 20) * 10;
          const total = a * b + c;
          const pay = Math.ceil((total + 1) / 1000) * 1000;
          return {
            q: `1こ ${a}円のパンを ${b}こと、${c}円のジュースを1本買って、${pay}円出しました。おつりは何円ですか。`,
            ans: pay - total,
            unit: "円",
            hint: "代金を ( ) でまとめて、1つの式に表してみよう。",
            steps: [`1つの式で ${pay} − (${a} × ${b} ＋ ${c})`, `＝ ${pay} − ${total}`, `＝ ${pay - total}`],
          };
        }),
        t("E4-keisan-3b", (r) => {
          const c = r(2, 9);
          const a = r(2, 30);
          const x = r(2, 30);
          if (r(0, 1)) {
            const d = (a + x) * c;
            return {
              q: `(${a} ＋ □) × ${c} ＝ ${d} の □ にあてはまる数はいくつですか。`,
              ans: x,
              hint: "うしろから逆にたどってみよう。まず ( ) の中はいくつ？",
              steps: [`( ) の中は ${d} ÷ ${c} ＝ ${a + x}`, `□ ＝ ${a + x} − ${a} ＝ ${x}`],
            };
          }
          const d = x * c - a;
          if (d <= 0) return { skip: true };
          return {
            q: `□ × ${c} − ${a} ＝ ${d} の □ にあてはまる数はいくつですか。`,
            ans: x,
            hint: "うしろから逆にたどってみよう。まず □ × " + c + " はいくつ？",
            steps: [`□ × ${c} ＝ ${d} ＋ ${a} ＝ ${x * c}`, `□ ＝ ${x * c} ÷ ${c} ＝ ${x}`],
          };
        }),
        t("E4-keisan-3c", (r) => {
          const c = r(3, 19);
          const k = r(0, 2);
          if (k === 0) {
            const a = r(11, 89);
            const b = 100 - a;
            return {
              q: `${a} × ${c} ＋ ${b} × ${c} をくふうして計算しましょう。`,
              ans: 100 * c,
              hint: "分配のきまりを使って、( ) でまとめてみよう。",
              steps: [`${a} × ${c} ＋ ${b} × ${c} ＝ (${a} ＋ ${b}) × ${c}`, `＝ 100 × ${c}`, `＝ ${100 * c}`],
            };
          }
          if (k === 1) {
            const b = r(11, 89);
            const a = b + 100;
            return {
              q: `${a} × ${c} − ${b} × ${c} をくふうして計算しましょう。`,
              ans: 100 * c,
              hint: "分配のきまりを使って、( ) でまとめてみよう。",
              steps: [`${a} × ${c} − ${b} × ${c} ＝ (${a} − ${b}) × ${c}`, `＝ 100 × ${c}`, `＝ ${100 * c}`],
            };
          }
          const a = r(11, 49);
          const d1 = r(11, 89);
          return {
            q: `${a} × ${d1} ＋ ${a} × ${100 - d1} をくふうして計算しましょう。`,
            ans: 100 * a,
            hint: "同じ数 " + a + " をかけているところに注目しよう。",
            steps: [`${a} × ${d1} ＋ ${a} × ${100 - d1} ＝ ${a} × (${d1} ＋ ${100 - d1})`, `＝ ${a} × 100`, `＝ ${100 * a}`],
          };
        }),
      ],
      4: [
        t("E4-keisan-4a", (r) => {
          const OPS = ["＋", "−", "×", "÷"];
          const f = (o, x, y) => {
            if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
            if (o === "＋") return x + y;
            if (o === "−") return x - y;
            if (o === "×") return x * y;
            return y !== 0 && x % y === 0 ? x / y : NaN;
          };
          const form = r(0, 2);
          const A = form === 2 ? r(20, 60) : r(4, 30);
          const B = r(2, 9);
          const C = r(2, 9);
          const ev = (o) => {
            const addSub = o === "＋" || o === "−";
            if (form === 0) return addSub ? f(o, A, B * C) : f("×", f(o, A, B), C);
            if (form === 1) return f("×", f(o, A, B), C);
            return addSub ? f(o, A - B, C) : A - f(o, B, C);
          };
          const op = pick(r, OPS);
          const D = ev(op);
          if (Number.isNaN(D) || D < 0) return { skip: true };
          if (OPS.some((o) => o !== op && ev(o) === D)) return { skip: true };
          const show = (o) => (form === 0 ? `${A} ${o} ${B} × ${C}` : form === 1 ? `(${A} ${o} ${B}) × ${C}` : `${A} − ${B} ${o} ${C}`);
          return {
            q: `次の式の □ に ＋、−、×、÷ のどれを入れると、正しい式になりますか。　${show("□")} ＝ ${D}`,
            ans: op,
            choices: choices4(r, op, OPS.filter((o) => o !== op)),
            hint: "4つとも入れてためしてみよう。計算の順番（× と ÷ が先）に気をつけて。",
            steps: ["× と ÷ は、＋ と − より先に計算する（( ) があればその中が先）", `${show(op)} を計算すると ${D}`, `答えは ${op}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-shosu",
    grade: "E4",
    area: "num",
    name: "小数の計算",
    desc: "小数のたし算ひき算・小数×÷整数",
    prereqs: ["E3-shosu", "E4-warihissan"],
    points: [
      "小数のたし算・ひき算は、小数点の位置をそろえて書いてから計算するよ。",
      "小数 × 整数は、小数点がないものとして計算して、あとで小数点をうつ。",
      "小数 ÷ 整数は、商の小数点を、わられる数の小数点にそろえてうつよ。",
    ],
    levels: {
      1: [
        t("E4-shosu-1a", (r) => {
          const x = r(101, 999) / 100;
          const y = r(11, 99) / 10;
          const [p, q] = r(0, 1) ? [x, y] : [y, x];
          const ans = round(p + q);
          return {
            q: `${p} ＋ ${q} を計算しましょう。`,
            ans,
            hint: "小数点の位置をそろえて、位ごとにたそう。",
            steps: ["小数点の位置をそろえて筆算する", `${p} ＋ ${q} ＝ ${ans}`],
          };
        }),
        t("E4-shosu-1b", (r) => {
          const y = r(101, 499) / 100;
          const x = r(0, 1) ? r(6, 12) : r(Math.ceil(y * 10) + 5, 99) / 10;
          const ans = round(x - y);
          return {
            q: `${x} − ${y} を計算しましょう。`,
            ans,
            hint: Number.isInteger(x) ? `${x} を ${x}.00 と考えて、小数点をそろえよう。` : `${x} を ${x}0 と考えて、小数点をそろえよう。`,
            steps: [Number.isInteger(x) ? `${x} を ${x}.00 と考えて、小数点をそろえる` : `${x} を ${x}0 と考えて、小数点をそろえる`, `${x} − ${y} ＝ ${ans}`],
          };
        }),
        t("E4-shosu-1c", (r) => {
          const X = r(11, 99);
          if (X % 10 === 0) return { skip: true };
          const n = r(2, 9);
          const ans = round((X * n) / 10);
          return {
            q: `${X / 10} × ${n} を計算しましょう。`,
            ans,
            hint: "小数点がないものとして計算して、あとで小数点をうとう。",
            steps: [`${X} × ${n} ＝ ${X * n} と計算する`, `かけられる数が小数第1位までなので、小数点をうって ${ans}`],
          };
        }),
      ],
      2: [
        t("E4-shosu-2a", (r) => {
          const two = r(0, 1) === 1;
          const X = two ? r(101, 999) : r(11, 99);
          if (X % 10 === 0) return { skip: true };
          const k = two ? 100 : 10;
          const n = r(12, 49);
          const ans = round((X * n) / k);
          return {
            q: `${X / k} × ${n} を計算しましょう。`,
            ans,
            hint: "小数点がないものとして計算して、あとで小数点をうとう。",
            steps: [`${X} × ${n} ＝ ${X * n} と計算する`, `かけられる数が小数第${two ? 2 : 1}位までなので、小数点をうって ${ans}`],
          };
        }),
        t("E4-shosu-2b", (r) => {
          const n = r(0, 1) ? r(2, 9) : r(12, 25);
          const Q = r(11, 99);
          if (Q % 10 === 0) return { skip: true };
          const q = Q / 10;
          const x = round(q * n);
          return {
            q: `${x} ÷ ${n} を計算しましょう。`,
            ans: q,
            hint: "整数のわり算と同じように計算して、商の小数点を、わられる数の小数点にそろえよう。",
            steps: [`${round(x * 10)} ÷ ${n} ＝ ${Q} と同じように計算する`, `商の小数点をそろえて ${q}`],
          };
        }),
        t("E4-shosu-2c", (r) => {
          const n = pick(r, [4, 5, 6, 8, 12, 15, 16, 25]);
          const step = 10 / gcd(n, 10);
          const k = step * r(Math.ceil(12 / step), Math.floor(400 / step));
          if (k % 10 === 0) return { skip: true };
          const q = k / 100;
          const a = round(q * n);
          return {
            q: `${a} ÷ ${n} を、わり切れるまで計算しましょう。`,
            ans: q,
            hint: "わり切れないときは、わられる数の右に 0 があると考えて、わり進めよう。",
            steps: [`${a} を ${Number.isInteger(a) ? `${a}.00` : `${a}0`} と考えて、0 をつけたしながらわり進める`, `${a} ÷ ${n} ＝ ${q}`],
          };
        }),
      ],
      3: [
        t("E4-shosu-3a", (r) => {
          const X = r(11, 25);
          if (X % 10 === 0) return { skip: true };
          const n = r(3, 12);
          const ans = round((X * n) / 10);
          return {
            q: `1本に ${X / 10}L 入ったジュースが ${n}本あります。ジュースは全部で何Lありますか。`,
            ans,
            unit: "L",
            hint: "1本分 × 本数 で求められるよ。",
            steps: [`${X / 10} × ${n}`, `${X} × ${n} ＝ ${X * n} だから、小数点をうって ${ans}`, `${ans}L`],
          };
        }),
        t("E4-shosu-3b", (r) => {
          const n = r(3, 9);
          const Q = r(15, 250);
          if (Q % 10 === 0) return { skip: true };
          const q = Q / 100;
          const a = round(q * n);
          return {
            q: `${a}m のリボンを、${n}人で同じ長さに分けます。1人分は何mになりますか。`,
            ans: q,
            unit: "m",
            hint: "全部の長さ ÷ 人数 で求められるよ。",
            steps: [`${a} ÷ ${n}`, `商の小数点を、わられる数の小数点にそろえて ${q}`, `${q}m`],
          };
        }),
        t("E4-shosu-3c", (r) => {
          const b = r(3, 9);
          const A = 10 * r(10, 59) + r(1, 9);
          const q = Math.floor(A / (10 * b));
          if (q < 2) return { skip: true };
          const m10 = A - 10 * b * q;
          const m = m10 / 10;
          const a = A / 10;
          const ans = `${q}本できて、${m}m あまる`;
          return {
            q: `${a}m のロープを、${b}m ずつに切ります。${b}m のロープは何本できて、何m あまりますか。`,
            ans,
            choices: choices4(r, ans, [`${q}本できて、${m10}m あまる`, `${q}本できて、${round(m / 10)}m あまる`, `${q - 1}本できて、${round(m + b)}m あまる`]),
            hint: "商は一の位まで求めて、あまりの小数点は、わられる数の小数点にそろえよう。",
            steps: [`${a} ÷ ${b} の商を一の位まで求めると ${q}`, `あまりは ${a} − ${b} × ${q} ＝ ${m}`, `たしかめ：${b} × ${q} ＋ ${m} ＝ ${a}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-bunsu",
    grade: "E4",
    area: "num",
    name: "分数（仮分数・帯分数）",
    desc: "大きさ比べ・同じ分母の計算",
    prereqs: ["E3-bunsu"],
    points: [
      "分子が分母より小さい分数が真分数。分子が分母と同じか大きい分数が仮分数だよ。",
      "$1\\frac{2}{3}$ のように、整数と真分数をあわせた分数が帯分数。$1\\frac{2}{3}=\\frac{5}{3}$ だよ。",
      "分母が同じ分数のたし算・ひき算は、分母はそのままで、分子だけを計算するよ。",
    ],
    levels: {
      1: [
        t("E4-bunsu-1a", (r) => {
          const d = r(2, 9);
          const q = r(1, 4);
          const m = r(1, d - 1);
          const n = q * d + m;
          const ans = $(mixParts(q, m, d));
          const traps = [$(mixParts(q + 1, m, d)), $(mixParts(q, m, n)), $(mixParts(q, d - m, d)), $(mixParts(q, m + 1, d)), $(mixParts(q + 1, m + 1, d))];
          if (q < d && q !== m) traps.unshift($(mixParts(m, q, d)));
          return {
            q: `$\\frac{${n}}{${d}}$ を帯分数になおすと、どれになりますか。`,
            ans,
            choices: choices4(r, ans, traps),
            hint: `${n} の中に ${d} がいくつあるか、わり算で考えよう。`,
            steps: [`${n} ÷ ${d} ＝ ${q} あまり ${m}`, `整数の部分が ${q}、分子が ${m} で $${mixParts(q, m, d)}$`],
          };
        }),
        t("E4-bunsu-1b", (r) => {
          const d = r(2, 9);
          let m = r(1, d - 1);
          while (gcd(m, d) !== 1) m = r(1, d - 1);
          const q = r(1, 5);
          const n = q * d + m;
          return {
            q: `$${q}\\frac{${m}}{${d}}$ を仮分数になおしましょう。`,
            ans: fracAns(n, d),
            hint: `1 は $\\frac{${d}}{${d}}$ だよ。整数の部分は $\\frac{1}{${d}}$ がいくつ分かな？`,
            steps: [`分子は ${d} × ${q} ＋ ${m} ＝ ${n}`, `$${q}\\frac{${m}}{${d}} = \\frac{${n}}{${d}}$`],
          };
        }),
        t("E4-bunsu-1c", (r) => {
          const d = r(3, 12);
          const k = r(0, 2);
          if (k === 0) {
            const a = r(1, d - 2);
            const b = r(1, d - 1 - a);
            const s = a + b;
            if (gcd(s, d) !== 1) return { skip: true };
            return {
              q: `$\\frac{${a}}{${d}}+\\frac{${b}}{${d}}$ を計算しましょう。`,
              ans: fracAns(s, d),
              hint: "分母はそのままで、分子どうしをたそう。",
              steps: [`分子どうしをたす：${a} ＋ ${b} ＝ ${s}`, `$\\frac{${a}}{${d}}+\\frac{${b}}{${d}}=\\frac{${s}}{${d}}$`],
            };
          }
          if (k === 1) {
            const a = r(2, d - 1);
            const b = r(1, a - 1);
            const s = a - b;
            if (gcd(s, d) !== 1) return { skip: true };
            return {
              q: `$\\frac{${a}}{${d}}-\\frac{${b}}{${d}}$ を計算しましょう。`,
              ans: fracAns(s, d),
              hint: "分母はそのままで、分子どうしをひこう。",
              steps: [`分子どうしをひく：${a} − ${b} ＝ ${s}`, `$\\frac{${a}}{${d}}-\\frac{${b}}{${d}}=\\frac{${s}}{${d}}$`],
            };
          }
          const a = r(1, d - 1);
          if (gcd(d - a, d) !== 1) return { skip: true };
          return {
            q: `$1-\\frac{${a}}{${d}}$ を計算しましょう。`,
            ans: fracAns(d - a, d),
            hint: `1 を $\\frac{${d}}{${d}}$ になおそう。`,
            steps: [`$1=\\frac{${d}}{${d}}$`, `$\\frac{${d}}{${d}}-\\frac{${a}}{${d}}=\\frac{${d - a}}{${d}}$`],
          };
        }),
      ],
      2: [
        t("E4-bunsu-2a", (r) => {
          const d = r(3, 9);
          const a1 = r(1, 4);
          const a2 = r(1, 4);
          const b1 = r(2, d - 1);
          const b2 = r(d - b1 + 1, d - 1);
          const s = b1 + b2;
          const W = a1 + a2;
          const ans = $(mixParts(W + 1, s - d, d));
          return {
            q: `$${a1}\\frac{${b1}}{${d}}+${a2}\\frac{${b2}}{${d}}$ を計算しましょう。`,
            ans,
            choices: choices4(r, ans, [$(mixParts(W, s - d, d)), $(mixParts(W, s, 2 * d)), $(mixParts(W + 1, s - d, 2 * d)), $(mixParts(W + 2, s - d, d))]),
            hint: "整数どうし、分数どうしをたそう。分数が1より大きくなったら整数にくり上げる。",
            steps: [`整数どうし：${a1} ＋ ${a2} ＝ ${W}、分数どうし：$\\frac{${b1}}{${d}}+\\frac{${b2}}{${d}}=\\frac{${s}}{${d}}$`, `$\\frac{${s}}{${d}}=${mixParts(1, s - d, d)}$ なので、くり上げる`, `答え ${ans}`],
          };
        }),
        t("E4-bunsu-2b", (r) => {
          const d = r(3, 9);
          const a1 = r(2, 5);
          const a2 = r(1, a1 - 1);
          const b1 = r(1, d - 2);
          const b2 = r(b1 + 1, d - 1);
          const n = a1 * d + b1 - (a2 * d + b2);
          const ans = $(mix(n, d));
          return {
            q: `$${a1}\\frac{${b1}}{${d}}-${a2}\\frac{${b2}}{${d}}$ を計算しましょう。`,
            ans,
            choices: choices4(r, ans, [$(mixParts(a1 - a2, b2 - b1, d)), $(mixParts(a1 - a2, d + b1 - b2, d)), $(mixParts(a1 - a2 - 1, b2 - b1, d)), $(mixParts(a1 - a2 + 1, d + b1 - b2, d))], mixFill(n, d)),
            hint: `分数の部分がひけないときは、整数から1くり下げよう。`,
            steps: [`$\\frac{${b1}}{${d}}$ から $\\frac{${b2}}{${d}}$ はひけないので、$${a1}\\frac{${b1}}{${d}}=${mixParts(a1 - 1, d + b1, d)}$ と考える`, `$${mixParts(a1 - 1, d + b1, d)}-${a2}\\frac{${b2}}{${d}}=${mix(n, d)}$`],
          };
        }),
        t("E4-bunsu-2c", (r) => {
          const d = r(3, 9);
          const pool = [];
          for (let n = d + 1; n <= 4 * d; n++) if (n % d !== 0) pool.push(n);
          const ns = sample(r, pool, 4);
          const show = ns.map((n) => (r(0, 1) ? $(`\\frac{${n}}{${d}}`) : $(mix(n, d))));
          const big = r(0, 1) === 1;
          const target = big ? Math.max(...ns) : Math.min(...ns);
          const ans = show[ns.indexOf(target)];
          return {
            q: `${show.join("、")} のうち、いちばん${big ? "大きい" : "小さい"}分数はどれですか。`,
            ans,
            choices: shuffle(r, show),
            hint: "帯分数を仮分数になおして、分子をくらべよう。",
            steps: [`全部を仮分数になおすと ${[...ns].sort((a, b) => a - b).map((n) => `$\\frac{${n}}{${d}}$`).join("、")}`, `分母が同じなので、分子がいちばん${big ? "大きい" : "小さい"}ものをえらんで ${ans}`],
          };
        }),
      ],
      3: [
        t("E4-bunsu-3a", (r) => {
          const d = r(3, 9);
          const a1 = r(1, 4);
          const b1 = r(1, d - 2);
          const b2 = r(b1 + 1, d - 1);
          const n = a1 * d + b1 - b2;
          const ans = $(mix(n, d));
          return {
            q: `リボンが $${a1}\\frac{${b1}}{${d}}$m あります。$\\frac{${b2}}{${d}}$m 使うと、のこりは何m ですか。`,
            ans,
            choices: choices4(r, ans, [$(mixParts(a1, b2 - b1, d)), $(mixParts(a1, d + b1 - b2, d)), $(mixParts(a1 - 1, b2 - b1, d)), $(mix(a1 * d + b1 + b2, d)), $(mixParts(a1 + 1, b2 - b1, d))], mixFill(n, d)),
            hint: "分数の部分がひけないときは、整数から1くり下げよう。",
            steps: [`$${a1}\\frac{${b1}}{${d}}-\\frac{${b2}}{${d}}$`, `$${a1}\\frac{${b1}}{${d}}=${mixParts(a1 - 1, d + b1, d)}$ と考えて計算する`, `のこりは ${ans}m`],
          };
        }),
        t("E4-bunsu-3b", (r) => {
          const d = r(2, 9);
          const q = r(1, 6);
          const m = r(1, d - 1);
          const n = q * d + m;
          return {
            q: `$\\frac{\\square}{${d}}=${q}\\frac{${m}}{${d}}$ の □ にあてはまる数はいくつですか。`,
            ans: n,
            hint: `整数の ${q} は、$\\frac{1}{${d}}$ の何こ分かな？`,
            steps: [`${q} は $\\frac{1}{${d}}$ の ${q * d} こ分`, `${q * d} ＋ ${m} ＝ ${n}`, `□ ＝ ${n}`],
          };
        }),
        t("E4-bunsu-3c", (r) => {
          const d = r(3, 9);
          const a = r(1, 3);
          const b = r(1, d - 1);
          const c = r(1, 3);
          const e = r(1, d - 1);
          const f = r(1, d - 1);
          const N = a * d + b + c * d + e - f;
          const ans = $(mix(N, d));
          return {
            q: `バケツに水が $${a}\\frac{${b}}{${d}}$L 入っています。そこへ $${c}\\frac{${e}}{${d}}$L 水を入れてから、$\\frac{${f}}{${d}}$L 使いました。バケツの水は何L になりましたか。`,
            ans,
            choices: choices4(r, ans, [$(mix(N + 2 * f, d)), $(mix(N + d, d)), N > d ? $(mix(N - d, d)) : null, $(mixParts(a + c, b + e, d))], mixFill(N, d)),
            hint: "入れた分はたし算、使った分はひき算。順に計算しよう。",
            steps: [`$${a}\\frac{${b}}{${d}}+${c}\\frac{${e}}{${d}}=${mix(a * d + b + c * d + e, d)}$`, `$${mix(a * d + b + c * d + e, d)}-\\frac{${f}}{${d}}=${mix(N, d)}$`, `答え ${ans}L`],
          };
        }),
      ],
      4: [
        t("E4-bunsu-4a", (r) => {
          const d = r(3, 9);
          const n1 = r(d + 1, 3 * d);
          const q = r(Math.floor(n1 / d) + 1, Math.floor(n1 / d) + 2);
          const m = r(1, d - 1);
          const n2 = q * d + m;
          const ans = n2 - n1 - 1;
          return {
            q: `分母が ${d} の分数で、$\\frac{${n1}}{${d}}$ より大きく、$${q}\\frac{${m}}{${d}}$ より小さいものは何こありますか。`,
            ans,
            unit: "こ",
            hint: "帯分数を仮分数になおして、分子の数で考えよう。",
            steps: [`$${q}\\frac{${m}}{${d}}=\\frac{${n2}}{${d}}$`, `分子が ${n1 + 1} から ${n2 - 1} までの分数`, `${n2 - 1} − ${n1 + 1} ＋ 1 ＝ ${ans}（こ）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-kakudo",
    grade: "E4",
    area: "geo",
    name: "角の大きさ",
    desc: "一回転360°・三角じょうぎの角",
    prereqs: ["E3-sankaku"],
    points: [
      "角の大きさは「度（°）」で表すよ。直角は 90°、半回転は 180°、1回転は 360°。",
      "1組の三角じょうぎの角は、90°・45°・45° と 90°・60°・30° だよ。",
      "180° より大きい角は、「180° ＋ のこり」や「360° − のこり」で求められるよ。",
    ],
    levels: {
      1: [
        t("E4-kakudo-1a", (r) => {
          if (r(0, 1)) {
            const n = r(1, 4);
            return {
              q: `直角 ${n} こ分の角は何度ですか。`,
              ans: 90 * n,
              unit: "度",
              hint: "直角は 90° だよ。",
              steps: [`直角は 90°`, `90 × ${n} ＝ ${90 * n}（度）`],
            };
          }
          const m = r(1, 11) * 5;
          return {
            q: `時計の長いはりが ${m} 分間に回る角度は何度ですか。`,
            ans: 6 * m,
            unit: "度",
            hint: "長いはりは 60 分で 1回転（360°）するよ。1分では何度？",
            steps: ["長いはりは 60 分で 360° 回るので、1分で 6°", `6 × ${m} ＝ ${6 * m}（度）`],
          };
        }),
        t("E4-kakudo-1b", (r) => {
          const a = pick(r, [45, 90]);
          const b = pick(r, [30, 60, 90]);
          if (r(0, 1) || a === b) {
            return {
              q: `1組の三角じょうぎの ${a}° の角と ${b}° の角をぴったりあわせると、何度の角ができますか。`,
              ans: a + b,
              unit: "度",
              hint: "あわせた角は、たし算で求められるよ。",
              steps: [`${a} ＋ ${b} ＝ ${a + b}（度）`],
            };
          }
          const big = Math.max(a, b);
          const small = Math.min(a, b);
          return {
            q: `1組の三角じょうぎの ${big}° の角と ${small}° の角の大きさのちがいは何度ですか。`,
            ans: big - small,
            unit: "度",
            hint: "ちがいは、ひき算で求められるよ。",
            steps: [`${big} − ${small} ＝ ${big - small}（度）`],
          };
        }),
        t("E4-kakudo-1c", (r) => {
          const a = r(20, 160);
          return {
            q: `2本の直線が交わってできる角のうち、1つが ${a}° のとき、そのとなりの角は何度ですか。`,
            ans: 180 - a,
            unit: "度",
            hint: "となりあう2つの角をあわせると、一直線（半回転）になるよ。",
            steps: ["となりあう2つの角をあわせると 180°", `180 − ${a} ＝ ${180 - a}（度）`],
          };
        }),
      ],
      2: [
        t("E4-kakudo-2a", (r) => {
          const a = r(20, 170);
          return {
            q: `1つの点から出る2本の直線でできる角のうち、小さいほうの角が ${a}° でした。大きいほうの角（180° より大きい角）は何度ですか。`,
            ans: 360 - a,
            unit: "度",
            hint: "2つの角をあわせると、1回転の角になるよ。",
            steps: ["2つの角をあわせると 1回転で 360°", `360 − ${a} ＝ ${360 - a}（度）`],
          };
        }),
        t("E4-kakudo-2b", (r) => {
          const h = r(1, 11);
          if (r(0, 1)) {
            return {
              q: `時計の短いはりは、${h} 時間で何度回りますか。`,
              ans: 30 * h,
              unit: "度",
              hint: "短いはりは 12 時間で 1回転（360°）するよ。1時間では何度？",
              steps: ["短いはりは 12 時間で 360° 回るので、1時間で 30°", `30 × ${h} ＝ ${30 * h}（度）`],
            };
          }
          return {
            q: `時計の短いはりが ${30 * h}° 回るのは、何時間たったときですか。`,
            ans: h,
            unit: "時間",
            hint: "短いはりは 1時間で何度回るかな？",
            steps: ["短いはりは 1時間で 30° 回る", `${30 * h} ÷ 30 ＝ ${h}（時間）`],
          };
        }),
        t("E4-kakudo-2c", (r) => {
          const base = [30, 45, 60, 90];
          const can = new Set();
          for (const x of base) for (const y of base) { can.add(x + y); if (x !== y) can.add(Math.abs(x - y)); }
          const no = [20, 40, 50, 70, 80, 100, 110, 130, 140, 160, 170];
          const yes = [...can].filter((v) => v > 0);
          const ng = pick(r, no);
          const ans = `${ng}°`;
          return {
            q: `${pick(r, NAMES)}さんは、1組の三角じょうぎの角を2つ組み合わせて（たしたり、ひいたりして）、いろいろな角を作りました。作ることができない角はどれですか。`,
            ans,
            choices: choices4(r, ans, sample(r, yes, 3).map((v) => `${v}°`)),
            hint: "三角じょうぎの角は 30°・45°・60°・90° だよ。たしたり、ひいたりしてみよう。",
            steps: [
              "使える角は 30°・45°・60°・90°",
              `たとえば 45 ＋ 30 ＝ 75、60 − 45 ＝ 15 のように作れる角はすべて 15 の倍数`,
              `${ng}° は作れない`,
            ],
          };
        }),
      ],
      3: [
        t("E4-kakudo-3a", (r) => {
          const h = r(1, 11);
          const big = 30 * h;
          const ans = Math.min(big, 360 - big);
          return {
            q: `${h}時ちょうどのとき、時計の長いはりと短いはりがつくる角のうち、小さいほうの角は何度ですか。`,
            ans,
            unit: "度",
            hint: "時計の数字と数字の間は何度かな？",
            steps: ["数字と数字の間は 360 ÷ 12 ＝ 30°", `${h}時は、長いはりと短いはりの間が数字 ${Math.min(h, 12 - h)} つ分`, `30 × ${Math.min(h, 12 - h)} ＝ ${ans}（度）`],
          };
        }),
        t("E4-kakudo-3b", (r) => {
          if (r(0, 1)) {
            const a = r(20, 90);
            const b = r(20, 160 - a);
            return {
              q: `直線の上の1つの点から2本の直線をひいて、一直線の角（180°）を3つの角に分けました。2つの角が ${a}° と ${b}° のとき、のこりの角は何度ですか。`,
              ans: 180 - a - b,
              unit: "度",
              hint: "3つの角をあわせると 180° になるよ。",
              steps: ["3つの角の合計は 180°", `180 − ${a} − ${b} ＝ ${180 - a - b}（度）`],
            };
          }
          const a = r(40, 120);
          const b = r(40, 120);
          const c = r(20, 300 - a - b);
          if (360 - a - b - c < 20) return { skip: true };
          return {
            q: `1つの点のまわりの角（1回転の角）を4つの角に分けました。3つの角が ${a}°、${b}°、${c}° のとき、のこりの角は何度ですか。`,
            ans: 360 - a - b - c,
            unit: "度",
            hint: "4つの角をあわせると 1回転、360° になるよ。",
            steps: ["4つの角の合計は 360°", `360 − ${a} − ${b} − ${c} ＝ ${360 - a - b - c}（度）`],
          };
        }),
        t("E4-kakudo-3c", (r) => {
          const h = r(1, 6);
          return {
            q: `午後1時から午後6時までのうちで、時計の長いはりと短いはりのつくる小さいほうの角が ${30 * h}° になるのは、何時ちょうどのときですか。`,
            ans: h,
            unit: "時",
            hint: "ちょうどの時こくでは、長いはりは 12 をさしているよ。数字1つ分は何度？",
            steps: ["数字と数字の間は 30°", `${30 * h} ÷ 30 ＝ ${h} なので、短いはりは 12 から数字 ${h} つ分`, `${h}時`],
          };
        }),
      ],
      4: [
        t("E4-kakudo-4a", (r) => {
          const h = r(1, 11);
          const m = 2 * r(1, 29);
          const L = 6 * m;
          const S = 30 * h + m / 2;
          const diff = Math.abs(S - L);
          const ans = Math.min(diff, 360 - diff);
          return {
            q: `${h}時${m}分のとき、時計の長いはりと短いはりがつくる角のうち、小さいほうの角は何度ですか。`,
            ans,
            unit: "度",
            hint: "短いはりも少しずつ動いているよ。短いはりは1分で何度進むかな？",
            steps: [`長いはりは 12 から 6 × ${m} ＝ ${L}° 進んでいる`, `短いはりは 12 から 30 × ${h} ＋ 0.5 × ${m} ＝ ${S}° 進んでいる（1分で 0.5°）`, `ちがいは ${diff}°、小さいほうの角は ${ans}°`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-menseki",
    grade: "E4",
    area: "geo",
    name: "面積",
    desc: "長方形・正方形・cm²・m²",
    prereqs: ["E3-kakezan", "E2-zukei"],
    points: [
      "1辺が 1cm の正方形の面積を 1cm²（1平方センチメートル）というよ。",
      "長方形の面積 ＝ たて × 横、正方形の面積 ＝ 1辺 × 1辺。",
      "1m² ＝ 10000cm²、1a ＝ 100m²、1ha ＝ 10000m²、1km² ＝ 1000000m²。",
    ],
    levels: {
      1: [
        t("E4-menseki-1a", (r) => {
          const a = r(2, 20);
          const b = r(2, 20);
          const u = pick(r, ["cm", "m"]);
          return {
            q: `たて ${a}${u}、横 ${b}${u} の長方形の面積は何${u}²ですか。`,
            ans: a * b,
            unit: `${u}²`,
            hint: "長方形の面積 ＝ たて × 横",
            steps: [`${a} × ${b} ＝ ${a * b}`, `${a * b}${u}²`],
          };
        }),
        t("E4-menseki-1b", (r) => {
          const a = r(2, 25);
          const u = pick(r, ["cm", "m"]);
          return {
            q: `1辺が ${a}${u} の正方形の面積は何${u}²ですか。`,
            ans: a * a,
            unit: `${u}²`,
            hint: "正方形の面積 ＝ 1辺 × 1辺",
            steps: [`${a} × ${a} ＝ ${a * a}`, `${a * a}${u}²`],
          };
        }),
        t("E4-menseki-1c", (r) => {
          const a = r(2, 15);
          const b = r(2, 15);
          return {
            q: `面積が ${a * b}cm² で、たての長さが ${a}cm の長方形があります。横の長さは何cmですか。`,
            ans: b,
            unit: "cm",
            hint: `たて × 横 ＝ 面積 だから、${a} × □ ＝ ${a * b} の □ を考えよう。`,
            steps: [`${a} × □ ＝ ${a * b}`, `□ ＝ ${a * b} ÷ ${a} ＝ ${b}`, `${b}cm`],
          };
        }),
      ],
      2: [
        t("E4-menseki-2a", (r) => {
          const [from, to, f, label] = pick(r, [
            ["m²", "cm²", 10000, "m²"],
            ["a", "m²", 100, "a（アール）"],
            ["ha", "m²", 10000, "ha（ヘクタール）"],
            ["km²", "m²", 1000000, "km²"],
            ["ha", "a", 100, "ha（ヘクタール）"],
          ]);
          const a = r(2, 9);
          const ans = `${a * f}${to}`;
          return {
            q: `${a}${label} は何${to}ですか。`,
            ans,
            choices: choices4(r, ans, [`${(a * f) / 10}${to}`, `${(a * f) / 100}${to}`, `${a * f * 10}${to}`, `${a * f * 100}${to}`]),
            hint: `1${from} は何${to}かを思い出そう。`,
            steps: [`1${from} ＝ ${f}${to}`, `${a}${from} ＝ ${f} × ${a} ＝ ${a * f}${to}`],
          };
        }),
        t("E4-menseki-2b", (r) => {
          const a = r(2, 5);
          const b = r(2, 9) * 10;
          return {
            q: `たて ${a}m、横 ${b}cm の長方形の面積は何cm²ですか。`,
            ans: a * 100 * b,
            unit: "cm²",
            hint: "長さの単位をそろえてから計算しよう。",
            steps: [`${a}m ＝ ${a * 100}cm にそろえる`, `${a * 100} × ${b} ＝ ${a * 100 * b}`, `${a * 100 * b}cm²`],
          };
        }),
        t("E4-menseki-2c", (r) => {
          const a = r(1, 9) * 10;
          const b = r(2, 9) * 10;
          const S = a * b;
          return {
            q: `たて ${a}m、横 ${b}m の長方形の畑の面積は何a（アール）ですか。`,
            ans: S / 100,
            unit: "a",
            hint: "1a ＝ 100m² だよ。",
            steps: [`${a} × ${b} ＝ ${S}（m²）`, `1a ＝ 100m² なので ${S} ÷ 100 ＝ ${S / 100}`, `${S / 100}a`],
          };
        }),
      ],
      3: [
        t("E4-menseki-3a", (r) => {
          const A = r(6, 20);
          const B = r(6, 20);
          const c = r(2, A - 2);
          const d = r(2, B - 2);
          const ans = A * B - c * d;
          return {
            q: `たて ${A}cm、横 ${B}cm の長方形の紙から、たて ${c}cm、横 ${d}cm の長方形を1つ切り取りました。のこりの紙の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "全体の面積から、切り取った面積をひこう。",
            steps: [`全体：${A} × ${B} ＝ ${A * B}`, `切り取った部分：${c} × ${d} ＝ ${c * d}`, `${A * B} − ${c * d} ＝ ${ans}（cm²）`],
          };
        }),
        t("E4-menseki-3b", (r) => {
          if (r(0, 1)) {
            const s = r(3, 20);
            return {
              q: `まわりの長さが ${4 * s}cm の正方形の面積は何cm²ですか。`,
              ans: s * s,
              unit: "cm²",
              hint: "まず、1辺の長さを求めよう。",
              steps: [`1辺は ${4 * s} ÷ 4 ＝ ${s}（cm）`, `${s} × ${s} ＝ ${s * s}（cm²）`],
            };
          }
          const a = r(2, 15);
          const b = r(2, 15);
          if (a === b) return { skip: true };
          const P = 2 * (a + b);
          return {
            q: `まわりの長さが ${P}cm で、たての長さが ${a}cm の長方形の面積は何cm²ですか。`,
            ans: a * b,
            unit: "cm²",
            hint: "たて ＋ 横 は、まわりの長さの半分だよ。",
            steps: [`たて ＋ 横 ＝ ${P} ÷ 2 ＝ ${a + b}`, `横 ＝ ${a + b} − ${a} ＝ ${b}`, `${a} × ${b} ＝ ${a * b}（cm²）`],
          };
        }),
        t("E4-menseki-3c", (r) => {
          const a = r(6, 25);
          const b = r(6, 25);
          const ans = (a - 1) * (b - 1);
          return {
            q: `たて ${a}m、横 ${b}m の長方形の土地に、はば 1m の道が、たての辺に平行に1本、横の辺に平行に1本、十字に通っています。道をのぞいた土地の面積は何m²ですか。`,
            ans,
            unit: "m²",
            hint: "道を土地のはしによせて考えると、のこりは1つの長方形になるよ。",
            steps: [`道をはしによせると、のこりは たて ${a - 1}m、横 ${b - 1}m の長方形`, `${a - 1} × ${b - 1} ＝ ${ans}（m²）`],
          };
        }),
      ],
      4: [
        t("E4-menseki-4a", (r) => {
          const s = r(3, 15);
          const P = 4 * s;
          return {
            q: `まわりの長さが ${P}cm の長方形を作ります。たても横も cm の単位で整数の長さにするとき、面積がいちばん大きくなるのは何cm²ですか。（正方形も長方形の仲間とします）`,
            ans: s * s,
            unit: "cm²",
            hint: `たて ＋ 横 ＝ ${P / 2} だよ。いろいろなたての長さで面積をためしてみよう。`,
            steps: [`たて ＋ 横 ＝ ${P / 2}`, `たてと横の長さが近いほど面積は大きくなり、たて ＝ 横 ＝ ${s} のとき最大`, `${s} × ${s} ＝ ${s * s}（cm²）`],
          };
        }),
        t("E4-menseki-4b", (r) => {
          const a = r(12, 30);
          const b = r(12, 30);
          const w = r(1, 3);
          const n1 = r(1, 3);
          const n2 = r(1, 2);
          const ans = (b - n1 * w) * (a - n2 * w);
          return {
            q: `たて ${a}m、横 ${b}m の長方形の土地に、はば ${w}m のまっすぐな道を、たての辺に平行に ${n1}本、横の辺に平行に ${n2}本 つくりました。道をのぞいた土地の面積は何m²ですか。`,
            ans,
            unit: "m²",
            hint: "道をすべて土地のはしによせると、のこりは1つの長方形になるよ。",
            steps: [
              `たての辺に平行な道で、横の長さが ${n1 * w}m へる → ${b - n1 * w}m`,
              `横の辺に平行な道で、たての長さが ${n2 * w}m へる → ${a - n2 * w}m`,
              `${a - n2 * w} × ${b - n1 * w} ＝ ${ans}（m²）`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-henka",
    grade: "E4",
    area: "func",
    name: "変わり方",
    desc: "ともなって変わる2つの量",
    prereqs: ["E4-keisan"],
    points: [
      "いっしょに変わる2つの量は、表にかいてきまりを見つけよう。",
      "「○ が1ふえると △ はいくつふえる？」「○ ＋ △ や △ − ○ がいつも同じ？」を調べるといいよ。",
      "きまりがわかったら、○ と △ を使った式に表せるよ。",
    ],
    levels: {
      1: [
        t("E4-henka-1a", (r) => {
          const p = r(3, 15) * 10;
          const n = r(6, 15);
          return {
            q: `1こ ${p}円のパンを買います。買う数を ○こ、代金を △円 とすると、○ が 1、2、3、4 のとき、△ は ${p}、${2 * p}、${3 * p}、${4 * p} です。○ が ${n} のとき、△ はいくつですか。`,
            ans: p * n,
            hint: "○ が1ふえると、△ はいくつふえるかな？",
            steps: [`○ が1ふえると △ は ${p} ふえる。△ ＝ ${p} × ○`, `${p} × ${n} ＝ ${p * n}`],
          };
        }),
        t("E4-henka-1b", (r) => {
          const s = r(8, 25);
          const a = r(2, s - 2);
          return {
            q: `まわりの長さが ${2 * s}cm の長方形を作ります。たての長さが ${a}cm のとき、横の長さは何cmですか。`,
            ans: s - a,
            unit: "cm",
            hint: "たて ＋ 横 は、いつも同じ数になるよ。",
            steps: [`たて ＋ 横 ＝ ${2 * s} ÷ 2 ＝ ${s}`, `横 ＝ ${s} − ${a} ＝ ${s - a}（cm）`],
          };
        }),
        t("E4-henka-1c", (r) => {
          const d = r(2, 7);
          const b = r(d + 3, d + 20);
          return {
            q: `姉は妹より ${d}才年上です。姉が ${b}才のとき、妹は何才ですか。`,
            ans: b - d,
            unit: "才",
            hint: "2人の年れいのちがいは、何年たっても変わらないよ。",
            steps: [`姉 − 妹 ＝ ${d}（いつも同じ）`, `${b} − ${d} ＝ ${b - d}（才）`],
          };
        }),
      ],
      2: [
        t("E4-henka-2a", (r) => {
          const xs = [1, 2, 3, 4];
          const kind = r(0, 2);
          let k;
          let ys;
          let ans;
          if (kind === 0) {
            k = r(2, 9);
            ys = xs.map((x) => x * k);
            ans = `△ ＝ ○ × ${k}`;
          } else if (kind === 1) {
            k = r(2, 9);
            ys = xs.map((x) => x + k);
            ans = `△ ＝ ○ ＋ ${k}`;
          } else {
            k = r(8, 15);
            ys = xs.map((x) => k - x);
            ans = `○ ＋ △ ＝ ${k}`;
          }
          const y1 = ys[0];
          const wrongs = [];
          if (kind !== 0) wrongs.push(`△ ＝ ○ × ${y1}`);
          if (kind !== 1 && y1 > 1) wrongs.push(`△ ＝ ○ ＋ ${y1 - 1}`);
          if (kind !== 2) wrongs.push(`○ ＋ △ ＝ ${y1 + 1}`);
          wrongs.push(`△ ＝ ○ − ${k}`, `△ ＝ ○ × ${k + 1}`, `○ ＋ △ ＝ ${k + 3}`);
          return {
            q: `○ が 1、2、3、4 のとき、△ は ${ys.join("、")} になります。○ と △ の関係を表す式はどれですか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "1つの組だけでなく、表の全部の組にあてはまるかたしかめよう。",
            steps: [kind === 0 ? `どの組も △ は ○ の ${k} 倍` : kind === 1 ? `どの組も △ は ○ より ${k} 大きい` : `どの組も ○ ＋ △ が ${k}`, `式は ${ans}`],
          };
        }),
        t("E4-henka-2b", (r) => {
          const n = r(5, 20);
          if (r(0, 1)) {
            return {
              q: `同じ長さのぼうを使って、正方形を横に1列につなげた形を作ります。正方形が1こで4本、2こで7本、3こで10本使います。正方形が ${n}このとき、ぼうは何本使いますか。`,
              ans: 3 * n + 1,
              unit: "本",
              hint: "正方形が1こふえると、ぼうは何本ふえるかな？",
              steps: ["正方形が1こふえると、ぼうは3本ふえる", `はじめの1本と、3本ずつ ${n} こ分と考えて 1 ＋ 3 × ${n}`, `＝ ${3 * n + 1}（本）`],
            };
          }
          return {
            q: `同じ長さのぼうを使って、正三角形を横に1列につなげた形を作ります。正三角形が1こで3本、2こで5本、3こで7本使います。正三角形が ${n}このとき、ぼうは何本使いますか。`,
            ans: 2 * n + 1,
            unit: "本",
            hint: "正三角形が1こふえると、ぼうは何本ふえるかな？",
            steps: ["正三角形が1こふえると、ぼうは2本ふえる", `はじめの1本と、2本ずつ ${n} こ分と考えて 1 ＋ 2 × ${n}`, `＝ ${2 * n + 1}（本）`],
          };
        }),
        t("E4-henka-2c", (r) => {
          const a = r(2, 20);
          const b = r(2, 9);
          const n = r(3, 15);
          return {
            q: `水そうに水が ${a}L 入っています。ここに1分間に ${b}L ずつ水を入れていきます。${n}分後には、水そうの水は何L になりますか。`,
            ans: a + b * n,
            unit: "L",
            hint: `1分ごとに ${b}L ずつふえるね。${n}分でふえる量は？`,
            steps: [`${n}分でふえる水は ${b} × ${n} ＝ ${b * n}（L）`, `${a} ＋ ${b * n} ＝ ${a + b * n}（L）`],
          };
        }),
      ],
      3: [
        t("E4-henka-3a", (r) => {
          const n = r(8, 30);
          const N = 3 * n + 1;
          return {
            q: `同じ長さのぼうを使って、正方形を横に1列につなげた形を作ります。正方形が1こで4本、2こで7本、3こで10本使います。ぼうを ${N}本 全部使うと、正方形は何こできますか。`,
            ans: n,
            unit: "こ",
            hint: "正方形の数とぼうの数の関係を式にしてから、逆に考えよう。",
            steps: ["ぼうの数 ＝ 1 ＋ 3 × 正方形の数", `3 × 正方形の数 ＝ ${N} − 1 ＝ ${N - 1}`, `正方形の数 ＝ ${N - 1} ÷ 3 ＝ ${n}（こ）`],
          };
        }),
        t("E4-henka-3b", (r) => {
          const p = r(8, 18) * 10;
          const c = r(10, 30) * 10;
          const n = r(3, 12);
          const T = p * n + c;
          return {
            q: `1こ ${p}円のりんごを何こかと、${c}円のかごを1つ買います。代金が ${T}円のとき、りんごは何こ買いましたか。`,
            ans: n,
            unit: "こ",
            hint: "代金 ＝ りんごの代金 ＋ かごの代金。逆にたどってみよう。",
            steps: [`りんごの代金は ${T} − ${c} ＝ ${T - c}（円）`, `${T - c} ÷ ${p} ＝ ${n}（こ）`],
          };
        }),
        t("E4-henka-3c", (r) => {
          const n = r(4, 20);
          const ans = 4 * (n - 1);
          return {
            q: `おはじきを、正方形の形に、まわりだけならべます。1辺に ${n}こずつならべると、おはじきは全部で何こいりますか。`,
            ans,
            choices: numChoices(r, ans, [4 * n, 4 * n - 2, 4 * (n - 2), 4 * n + 4]),
            hint: "かどのおはじきは、2つの辺に入っているよ。",
            steps: [`${n} × 4 ＝ ${4 * n} だと、かどの4こを2回ずつ数えている`, `${4 * n} − 4 ＝ ${ans}（こ）`],
          };
        }),
      ],
      4: [
        t("E4-henka-4a", (r) => {
          const n = r(5, 15);
          const ans = (n * (n + 1)) / 2;
          return {
            q: `1辺 1cm の正方形の紙を、1だん目に1まい、2だん目に2まい、3だん目に3まい、…と、かいだんの形にならべます。${n}だん目までならべると、紙は全部で何まいいりますか。`,
            ans,
            unit: "まい",
            hint: "同じかいだんの形をもう1つ、さかさにしてくっつけると長方形になるよ。",
            steps: [`1 ＋ 2 ＋ … ＋ ${n} を求める`, `同じ形をさかさにあわせると、たて ${n}、横 ${n + 1} の長方形で ${n * (n + 1)} まい`, `その半分で ${ans}まい`],
          };
        }),
        t("E4-henka-4b", (r) => {
          const n = r(5, 30);
          const N = 4 * (n - 1);
          return {
            q: `おはじきを、正方形の形に、まわりだけならべたら、全部で ${N}こ使いました。正方形の1辺には、おはじきが何こならんでいますか。`,
            ans: n,
            unit: "こ",
            hint: "かどのおはじきを先にのぞいて考えてみよう。",
            steps: [`かどの4こをのぞくと ${N} − 4 ＝ ${N - 4}（こ）`, `1辺のかどをのぞいた数は ${N - 4} ÷ 4 ＝ ${n - 2}（こ）`, `かどの2こをたして、1辺は ${n}こ`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E4-oresen",
    grade: "E4",
    area: "data",
    name: "折れ線グラフ",
    desc: "変化の読み取り・2つの表",
    prereqs: ["E3-graph"],
    points: [
      "折れ線グラフは、気温のように、時間とともに変わっていくようすを表すのにべんりだよ。",
      "線のかたむきが急なところほど、変わり方が大きいよ。",
      "2つのことがらを調べるときは、たてと横に分けた表に整理すると見やすいよ。",
    ],
    levels: {
      1: [
        t("E4-oresen-1a", (r) => {
          const { hs, ts, peak } = temps(r);
          return {
            q: `ある日の気温を1時間ごとに調べて、折れ線グラフに表しました。${list(hs, ts)}。気温がいちばん高かったのは何時ですか。`,
            ans: hs[peak],
            unit: "時",
            hint: "折れ線グラフで、点がいちばん上にあるところだよ。",
            steps: [`いちばん高い気温は ${ts[peak]}度`, `それは ${hs[peak]}時`],
          };
        }),
        t("E4-oresen-1b", (r) => {
          const { hs, ts, peak } = temps(r);
          const i = r(0, peak - 1);
          const j = r(i + 1, peak);
          return {
            q: `ある日の気温を1時間ごとに調べました。${list(hs, ts)}。${hs[i]}時から${hs[j]}時までに、気温は何度上がりましたか。`,
            ans: ts[j] - ts[i],
            unit: "度",
            hint: "あとの気温から、前の気温をひこう。",
            steps: [`${hs[i]}時は ${ts[i]}度、${hs[j]}時は ${ts[j]}度`, `${ts[j]} − ${ts[i]} ＝ ${ts[j] - ts[i]}（度）`],
          };
        }),
        t("E4-oresen-1c", (r) => {
          const good = ["1日の気温の変わり方", "1年間の、月ごとの気温の変わり方", "子犬の体重の、月ごとの変わり方", "1日の、プールの水温の変わり方", "毎年の、学校の児童数の変わり方", "1時間ごとの、かげの長さの変わり方"];
          const bad = ["クラスの人のすきなくだものと人数", "組ごとの、図書室でかりた本のさっ数", "4年生のすきなスポーツと人数", "町ごとの人口", "クラスごとの、けがをした人の数", "色ごとの、家にあるかさの数"];
          const ans = pick(r, good);
          return {
            q: `${pick(r, NAMES)}さんは、いろいろなことを調べてグラフに表そうとしています。折れ線グラフに表すのにいちばん向いているものはどれですか。`,
            ans,
            choices: choices4(r, ans, sample(r, bad, 3)),
            hint: "折れ線グラフは「時間とともに変わるようす」を表すのがとくいだよ。",
            steps: ["折れ線グラフは、時間がたつにつれて変わっていく量を表すのに向いている", `だから「${ans}」`],
          };
        }),
      ],
      2: [
        t("E4-oresen-2a", (r) => {
          const { hs, ts } = temps(r);
          const ds = hs.slice(0, -1).map((_, i) => ts[i + 1] - ts[i]);
          const mx = Math.max(...ds);
          if (ds.filter((d) => d === mx).length > 1) return { skip: true };
          const lab = (i) => `${hs[i]}時から${hs[i + 1]}時`;
          const k = ds.indexOf(mx);
          const others = ds.map((_, i) => i).filter((i) => i !== k);
          return {
            q: `ある日の気温を1時間ごとに調べました。${list(hs, ts)}。気温の上がり方がいちばん大きいのは、何時から何時の間ですか。`,
            ans: lab(k),
            choices: choices4(r, lab(k), sample(r, others, 3).map(lab)),
            hint: "1時間ごとに、気温がいくつ変わったかを計算しよう。折れ線グラフでは、線のかたむきがいちばん急な右上がりのところ。",
            steps: [`1時間ごとの上がり方：${ds.filter((d) => d > 0).length ? ds.map((d, i) => (d > 0 ? `${lab(i)} ${d}度` : null)).filter(Boolean).join("、") : ""}`, `いちばん大きく上がったのは ${lab(k)}（${mx}度）`],
          };
        }),
        t("E4-oresen-2b", (r) => {
          const { hs, ts } = temps(r, true);
          const ds = hs.slice(0, -1).map((_, i) => ts[i] - ts[i + 1]);
          const mx = Math.max(...ds);
          if (mx <= 0 || ds.filter((d) => d === mx).length > 1) return { skip: true };
          const lab = (i) => `${hs[i]}時から${hs[i + 1]}時`;
          const k = ds.indexOf(mx);
          const others = ds.map((_, i) => i).filter((i) => i !== k);
          return {
            q: `ある日の気温を1時間ごとに調べました。${list(hs, ts)}。気温の下がり方がいちばん大きいのは、何時から何時の間ですか。`,
            ans: lab(k),
            choices: choices4(r, lab(k), sample(r, others, 3).map(lab)),
            hint: "折れ線グラフでは、線のかたむきがいちばん急な右下がりのところだよ。",
            steps: [`それぞれの1時間で、前の気温 − あとの気温 を計算する`, `いちばん大きく下がったのは ${lab(k)}（${mx}度）`],
          };
        }),
        t("E4-oresen-2c", (r) => {
          const N = r(28, 36);
          const A = r(8, 16);
          const C = r(2, A - 2);
          const B = r(C + 2, 14);
          if (A + B - C > N) return { skip: true };
          const [x, y, yes, no] = pick(r, [
            ["犬", "ねこ", "をかっている", "をかっていない"],
            ["自転車", "一輪車", "に乗れる", "に乗れない"],
            ["ピアノ", "水泳", "を習っている", "を習っていない"],
          ]);
          return {
            q: `4年1組 ${N}人のうち、${x}${yes}人は ${A}人、${y}${yes}人は ${B}人、${x}と${y}の両方${yes.slice(1)}人は ${C}人です。${x}${yes}けれど、${y}${no}人は何人ですか。`,
            ans: A - C,
            unit: "人",
            hint: `${x}${yes}人の中に、「両方」の人も入っているね。`,
            steps: [`${x}${yes} ${A}人の中に、両方の人 ${C}人がふくまれている`, `${A} − ${C} ＝ ${A - C}（人）`],
          };
        }),
      ],
      3: [
        t("E4-oresen-3a", (r) => {
          const N = r(28, 36);
          const A = r(8, 16);
          const C = r(2, A - 2);
          const B = r(C + 2, 14);
          const none = N - (A + B - C);
          if (none < 1) return { skip: true };
          return {
            q: `4年1組 ${N}人に、犬とねこをかっているかを調べました。犬をかっている人は ${A}人、ねこをかっている人は ${B}人、両方かっている人は ${C}人でした。どちらもかっていない人は何人ですか。`,
            ans: none,
            unit: "人",
            hint: "犬だけ・ねこだけ・両方・どちらもない の4つに分けて表にしよう。",
            steps: [`犬かねこの少なくとも一方をかっている人は ${A} ＋ ${B} − ${C} ＝ ${A + B - C}（人）`, `${N} − ${A + B - C} ＝ ${none}（人）`],
          };
        }),
        t("E4-oresen-3b", (r) => {
          const { hs, ts } = temps(r);
          const us = ts.map((v) => v - r(0, 6));
          const ds = ts.map((v, i) => v - us[i]);
          const mx = Math.max(...ds);
          if (ds.filter((d) => d === mx).length > 1) return { skip: true };
          const k = ds.indexOf(mx);
          return {
            q: `A市とB市の気温を1時間ごとに調べました。A市は ${list(hs, ts)}。B市は ${list(hs, us)}。2つの市の気温のちがいがいちばん大きいのは何時ですか。`,
            ans: hs[k],
            unit: "時",
            hint: "同じ時こくどうしで、A市 − B市 を計算しよう。2本の折れ線がいちばんはなれているところだよ。",
            steps: [`同じ時こくのちがい：${hs.map((h, i) => `${h}時 ${ds[i]}度`).join("、")}`, `いちばん大きいのは ${hs[k]}時（${mx}度）`],
          };
        }),
        t("E4-oresen-3c", (r) => {
          const N = r(28, 36);
          const A = r(8, 16);
          const C = r(2, A - 2);
          const B = r(C + 2, 14);
          const none = N - (A + B - C);
          if (none < 1) return { skip: true };
          return {
            q: `4年1組 ${N}人に、犬とねこをかっているかを調べました。犬をかっている人は ${A}人、両方かっている人は ${C}人、どちらもかっていない人は ${none}人でした。ねこをかっている人は何人ですか。`,
            ans: B,
            unit: "人",
            hint: "まず「犬もねこもかっていない人」と「犬をかっている人」をのぞいてみよう。",
            steps: [`犬をかっていない人は ${N} − ${A} ＝ ${N - A}（人）`, `そのうち ねこだけの人は ${N - A} − ${none} ＝ ${N - A - none}（人）`, `ねこをかっている人は ${N - A - none} ＋ ${C} ＝ ${B}（人）`],
          };
        }),
      ],
    },
  },
];

// ── 折れ線グラフ用 ─────────────────────────────────────

/** 1時間ごとの気温（上がってから下がる）。down=true なら下がる時間を長く */
function temps(r, down = false) {
  const hs = [9, 10, 11, 12, 13, 14, 15];
  const peak = down ? r(2, 3) : r(3, 5);
  const ts = [r(8, 18)];
  for (let i = 1; i < hs.length; i++) ts.push(ts[i - 1] + (i <= peak ? r(1, 4) : -r(1, 4)));
  return { hs, ts, peak };
}

function list(hs, ts) {
  return hs.map((h, i) => `${h}時 ${ts[i]}度`).join("、");
}
