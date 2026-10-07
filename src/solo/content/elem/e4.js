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
            q: `次の数のうち、いちばん${big ? "大きい" : "小さい"}数はどれですか。`,
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
          return {
            q: `${a} ÷ ${b} を計算しましょう。`,
            ans: q,
            hint: `${b} を ${g} とみて、商の見当をつけよう。`,
            steps: [`${b} を ${g} とみると、商はだいたい ${Math.max(1, Math.floor(a / g))}`, `${b} × ${q} ＝ ${a} なので`, `答え ${q}`],
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
            choices: choices4(r, ans, [`${q - 1}本とれて、${m + b}cm あまる`, `${q + 1}本とれて、${m}cm あまる`, `${q}本とれて、${b - m}cm あまる`]),
            hint: `${n} ÷ ${b} を計算しよう。`,
            steps: [...hissan(n, b), `${q}本とれて、${m}cm あまる`],
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
          const traps = [$(mixParts(q + 1, m, d)), $(mixParts(q, m, n)), $(mixParts(q, d - m, d))];
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
          const b1 = r(1, d - 1);
          const b2 = r(1, d - 1);
          const s = b1 + b2;
          if (s <= d) return { skip: true };
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
            choices: choices4(r, ans, [$(mixParts(a1 - a2, b2 - b1, d)), $(mixParts(a1 - a2, d + b1 - b2, d)), $(mixParts(a1 - a2 - 1, b2 - b1, d)), $(mixParts(a1 - a2 + 1, d + b1 - b2, d))]),
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
            q: `次の分数のうち、いちばん${big ? "大きい" : "小さい"}ものはどれですか。`,
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
            choices: choices4(r, ans, [$(mixParts(a1, b2 - b1, d)), $(mixParts(a1, d + b1 - b2, d)), $(mixParts(a1 - 1, b2 - b1, d)), $(mixParts(a1 + 1, b2 - b1, d))]),
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
            q: `$\\frac{□}{${d}}=${q}\\frac{${m}}{${d}}$ の □ にあてはまる数はいくつですか。`,
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
            choices: choices4(r, ans, [$(mix(N + 2 * f, d)), $(mix(N + d, d)), N > d ? $(mix(N - d, d)) : null, $(mixParts(a + c, b + e, d))]),
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
            hint: "時計の数字と数字の間（1目もり分の大きな目もり）は何度かな？",
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
