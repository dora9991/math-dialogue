// ============================================================
// e6.js — 小学6年の単元（数学ラボ ソロ）
//   書き方は docs/solo-問題データの書き方.md
// ============================================================
import { t, pick, shuffle, sample, gcd, lcm, round, reduce, fracAns, fracTex, choices4, numChoices } from "../kit.js";

// ── この学年で使う小さな道具 ─────────────────────────────

const $ = (s) => `$${s}$`;

/** 真分数 [a, b]（約分ずみ、分母 2〜max） */
function properFrac(r, min = 2, max = 9) {
  const b = r(min, max);
  let a = r(1, b - 1);
  while (gcd(a, b) !== 1) a = r(1, b - 1);
  return [a, b];
}

/** 分数の TeX（約分しない） */
const fr = (a, b) => `\\frac{${a}}{${b}}`;

/** 分数の4択（fracTex で約分するので、値が同じなら同じ文字列になる） */
function fracChoices(r, [n, d], traps) {
  const f = ([a, b]) => (a > 0 && b > 0 ? $(fracTex(a, b)) : null);
  const ans = f([n, d]);
  return { ans, choices: choices4(r, ans, traps.map(f), (i) => f([n + (i % 2 ? -1 : 1) * (Math.floor(i / 2) + 1), d])) };
}

/** 比を簡単にした文字列 "2 : 3" */
const ratio = (a, b) => {
  const g = gcd(a, b);
  return `${a / g} : ${b / g}`;
};

/** 中央値 */
function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

const NAMES = ["ゆうと", "さくら", "はると", "あおい", "そうた", "ひなた", "れん", "ゆい"];

export const UNITS = [
  // ────────────────────────────────────────────────────────
  {
    id: "E6-bunsukake",
    grade: "E6",
    area: "num",
    name: "分数のかけ算・わり算",
    desc: "逆数・約分",
    prereqs: ["E5-bunsu"],
    points: [
      "分数 × 分数は、分母どうし、分子どうしをかける。とちゅうで約分すると計算がらくだよ。",
      "2つの数をかけて1になるとき、一方をもう一方の逆数という。$\\frac{2}{3}$ の逆数は $\\frac{3}{2}$。",
      "分数でわるときは、わる数の逆数をかけるよ。$\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}$",
    ],
    levels: {
      1: [
        t("E6-bunsukake-1a", (r) => {
          const [a, b] = properFrac(r);
          const n = r(2, 9);
          const div = r(0, 1) === 1;
          if (div) {
            return {
              q: `$${fr(a, b)} \\div ${n}$ を計算しましょう。`,
              ans: fracAns(a, b * n),
              hint: "分数 ÷ 整数は、分子はそのままで、分母に整数をかけるよ。",
              steps: [`$${fr(a, b)} \\div ${n}=\\frac{${a}}{${b} \\times ${n}}$`, `$=${fracTex(a, b * n)}$`],
            };
          }
          return {
            q: `$${fr(a, b)} \\times ${n}$ を計算しましょう。`,
            ans: fracAns(a * n, b),
            hint: "分数 × 整数は、分母はそのままで、分子に整数をかけるよ。約分できたら約分しよう。",
            steps: [`$${fr(a, b)} \\times ${n}=\\frac{${a} \\times ${n}}{${b}}$`, `$=${fracTex(a * n, b)}$${gcd(a * n, b) > 1 ? "（約分した）" : ""}`],
          };
        }),
        t("E6-bunsukake-1b", (r) => {
          const [a, b] = properFrac(r);
          const [c, d] = properFrac(r);
          return {
            q: `$${fr(a, b)} \\times ${fr(c, d)}$ を計算しましょう。`,
            ans: fracAns(a * c, b * d),
            hint: "分母どうし、分子どうしをかけよう。とちゅうで約分できるかな？",
            steps: [`$${fr(a, b)} \\times ${fr(c, d)}=\\frac{${a} \\times ${c}}{${b} \\times ${d}}$`, `$=${fracTex(a * c, b * d)}$`],
          };
        }),
        t("E6-bunsukake-1c", (r) => {
          const k = r(0, 2);
          if (k === 0) {
            const [a, b] = properFrac(r, 2, 12);
            return {
              q: `$${fr(a, b)}$ の逆数を求めましょう。`,
              ans: fracAns(b, a),
              hint: "分母と分子を入れかえよう。",
              steps: [`分母と分子を入れかえて $${fracTex(b, a)}$`, `たしかめ：$${fr(a, b)} \\times ${fr(b, a)} = 1$`],
            };
          }
          if (k === 1) {
            const n = r(2, 15);
            return {
              q: `${n} の逆数を求めましょう。`,
              ans: fracAns(1, n),
              hint: `${n} は $\\frac{${n}}{1}$ と考えよう。`,
              steps: [`${n} ＝ $\\frac{${n}}{1}$`, `分母と分子を入れかえて $\\frac{1}{${n}}$`],
            };
          }
          const x = pick(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
          return {
            q: `${x / 10} の逆数を求めましょう。`,
            ans: fracAns(10, x),
            hint: `${x / 10} を分数になおしてから考えよう。`,
            steps: [`${x / 10} ＝ $\\frac{${x}}{10}$`, `分母と分子を入れかえて $\\frac{10}{${x}}${gcd(10, x) > 1 ? `=${fracTex(10, x)}` : ""}$`],
          };
        }),
      ],
      2: [
        t("E6-bunsukake-2a", (r) => {
          const [a, b] = properFrac(r);
          const [c, d] = properFrac(r);
          if (a === c && b === d) return { skip: true };
          return {
            q: `$${fr(a, b)} \\div ${fr(c, d)}$ を計算しましょう。`,
            ans: fracAns(a * d, b * c),
            hint: "わる数の逆数をかけよう。",
            steps: [`$${fr(a, b)} \\div ${fr(c, d)}=${fr(a, b)} \\times ${fr(d, c)}$`, `$=\\frac{${a} \\times ${d}}{${b} \\times ${c}}=${fracTex(a * d, b * c)}$`],
          };
        }),
        t("E6-bunsukake-2b", (r) => {
          const [a, b] = properFrac(r);
          const [c, d] = properFrac(r);
          if (a * d === b * c) return { skip: true };
          const { ans, choices } = fracChoices(r, [a * d, b * c], [[a * c, b * d], [b * c, a * d], [b * d, a * c]]);
          return {
            q: `$${fr(a, b)} \\div ${fr(c, d)}$ を計算すると、どれになりますか。`,
            ans,
            choices,
            hint: "わられる数ではなく、わる数を逆数にしてかけるよ。",
            steps: [`$${fr(a, b)} \\times ${fr(d, c)}$`, `答え ${ans}`],
          };
        }),
        t("E6-bunsukake-2c", (r) => {
          const w = r(1, 3);
          const [a, b] = properFrac(r, 2, 6);
          const [c, d] = properFrac(r, 2, 9);
          const N = w * b + a;
          if (r(0, 1)) {
            return {
              q: `$${w}${fr(a, b)} \\times ${fr(c, d)}$ を計算しましょう。`,
              ans: fracAns(N * c, b * d),
              hint: "帯分数は、仮分数になおしてから計算しよう。",
              steps: [`$${w}${fr(a, b)}=${fr(N, b)}$`, `$${fr(N, b)} \\times ${fr(c, d)}=${fracTex(N * c, b * d)}$`],
            };
          }
          return {
            q: `$${w}${fr(a, b)} \\div ${fr(c, d)}$ を計算しましょう。`,
            ans: fracAns(N * d, b * c),
            hint: "帯分数は仮分数になおし、わる数の逆数をかけよう。",
            steps: [`$${w}${fr(a, b)}=${fr(N, b)}$`, `$${fr(N, b)} \\times ${fr(d, c)}=${fracTex(N * d, b * c)}$`],
          };
        }),
      ],
      3: [
        t("E6-bunsukake-3a", (r) => {
          const [a, b] = properFrac(r);
          const c = r(2, 9);
          const d = r(2, 9);
          if (gcd(c, d) !== 1 || c === d) return { skip: true };
          return {
            q: `1m の重さが $${fr(a, b)}$kg のぼうがあります。このぼう $${fr(c, d)}$m の重さは何kgですか。`,
            ans: fracAns(a * c, b * d),
            unit: "kg",
            hint: "1m の重さ × 長さ で求められるよ。",
            steps: [`$${fr(a, b)} \\times ${fr(c, d)}$`, `$=${fracTex(a * c, b * d)}$（kg）`],
          };
        }),
        t("E6-bunsukake-3b", (r) => {
          const [a, b] = properFrac(r);
          const [c, d] = properFrac(r);
          return {
            q: `$${fr(c, d)}$m の重さが $${fr(a, b)}$kg のぼうがあります。このぼう1m の重さは何kgですか。`,
            ans: fracAns(a * d, b * c),
            unit: "kg",
            hint: "1m あたりの重さ ＝ 重さ ÷ 長さ",
            steps: [`$${fr(a, b)} \\div ${fr(c, d)}=${fr(a, b)} \\times ${fr(d, c)}$`, `$=${fracTex(a * d, b * c)}$（kg）`],
          };
        }),
        t("E6-bunsukake-3c", (r) => {
          if (r(0, 1)) {
            const [a, b] = properFrac(r);
            const [c, d] = properFrac(r);
            const [e, f] = properFrac(r);
            return {
              q: `$${fr(a, b)} \\times ${fr(c, d)} \\div ${fr(e, f)}$ を計算しましょう。`,
              ans: fracAns(a * c * f, b * d * e),
              hint: "わり算は逆数のかけ算になおして、1つの分数にまとめてから約分しよう。",
              steps: [`$${fr(a, b)} \\times ${fr(c, d)} \\times ${fr(f, e)}$`, `$=\\frac{${a} \\times ${c} \\times ${f}}{${b} \\times ${d} \\times ${e}}=${fracTex(a * c * f, b * d * e)}$`],
            };
          }
          const x = r(1, 9);
          const [a, b] = properFrac(r);
          const n = r(2, 6);
          return {
            q: `$${x / 10} \\times ${fr(a, b)} \\div ${n}$ を計算しましょう。`,
            ans: fracAns(x * a, 10 * b * n),
            hint: "小数を分数になおしてから計算しよう。",
            steps: [`$${x / 10}=${fr(x, 10)}$、$\\div ${n}$ は $\\times ${fr(1, n)}$`, `$${fr(x, 10)} \\times ${fr(a, b)} \\times ${fr(1, n)}=${fracTex(x * a, 10 * b * n)}$`],
          };
        }),
      ],
      4: [
        t("E6-bunsukake-4a", (r) => {
          const [a, b] = properFrac(r, 2, 5);
          const [c, d] = properFrac(r, 2, 9);
          const [xn, xd] = reduce(c * a, d * b);
          if (reduce(xn * a, xd * b)[1] > 100) return { skip: true };
          return {
            q: `ある数に $${fr(a, b)}$ をかけるところを、まちがえて $${fr(a, b)}$ でわってしまったので、答えが $${fr(c, d)}$ になりました。正しい答えを求めましょう。`,
            ans: fracAns(xn * a, xd * b),
            hint: "まず、まちがえた計算を逆にたどって「ある数」を求めよう。",
            steps: [`ある数 ＝ $${fr(c, d)} \\times ${fr(a, b)}=${fracTex(xn, xd)}$`, `正しい答え ＝ $${fracTex(xn, xd)} \\times ${fr(a, b)}=${fracTex(xn * a, xd * b)}$`],
          };
        }),
        t("E6-bunsukake-4b", (r) => {
          const g = pick(r, [1, 2, 2, 3, 3, 4, 5]);
          let n1 = 0;
          let n2 = 0;
          let d1 = 0;
          let d2 = 0;
          let ok = false;
          for (let k = 0; k < 60 && !ok; k++) {
            n1 = g * r(1, 4);
            n2 = g * r(1, 4);
            d1 = r(2, 15);
            d2 = r(2, 15);
            ok = n1 !== n2 && d1 !== d2 && gcd(n1, d1) === 1 && gcd(n2, d2) === 1 && n1 > 1 && n2 > 1;
          }
          if (!ok) return { skip: true };
          const P = lcm(d1, d2);
          const Q = gcd(n1, n2);
          return {
            q: `$${fr(n1, d1)}$ にかけても、$${fr(n2, d2)}$ にかけても、答えが整数になる分数のうち、いちばん小さいものを求めましょう。`,
            ans: fracAns(P, Q),
            hint: "かける分数の分子は、2つの分母でわり切れる数。分母は、2つの分子をわり切れる数にしよう。",
            steps: [
              `かける分数を $\\frac{\\square}{\\triangle}$ とすると、□ は ${d1} と ${d2} の公倍数、△ は ${n1} と ${n2} の公約数`,
              `いちばん小さくするには、□ は最小公倍数 ${P}、△ は最大公約数 ${Q}`,
              `答え $${fracTex(P, Q)}$`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-moji",
    grade: "E6",
    area: "num",
    name: "文字と式",
    desc: "x を使った式・式の値",
    prereqs: ["E4-keisan"],
    points: [
      "わからない数や、いろいろ変わる数のかわりに、$x$ や $a$ などの文字を使って式に表せるよ。",
      "$x$ にあてはめた数を $x$ の値、そのときの式の答えを式の値というよ。",
      "$x \\times 3 + 5 = 20$ のような式は、逆にたどって $x$ の値を求めよう。",
    ],
    levels: {
      1: [
        t("E6-moji-1a", (r) => {
          const a = r(2, 9);
          const b = r(1, 30);
          const c = r(2, 12);
          if (r(0, 1)) {
            return {
              q: `$x \\times ${a} + ${b}$ で、$x$ の値が ${c} のときの式の値を求めましょう。`,
              ans: c * a + b,
              hint: "$x$ のところに数をあてはめて計算しよう。",
              steps: [`$${c} \\times ${a} + ${b}$`, `$= ${c * a} + ${b} = ${c * a + b}$`],
            };
          }
          if (c * a <= b) return { skip: true };
          return {
            q: `$${a} \\times x - ${b}$ で、$x$ の値が ${c} のときの式の値を求めましょう。`,
            ans: a * c - b,
            hint: "$x$ のところに数をあてはめて計算しよう。",
            steps: [`$${a} \\times ${c} - ${b}$`, `$= ${a * c} - ${b} = ${a * c - b}$`],
          };
        }),
        t("E6-moji-1b", (r) => {
          const x = r(2, 40);
          const a = r(2, 9);
          const k = r(0, 3);
          if (k === 0) return { q: `$x + ${a * 3} = ${x + a * 3}$ のとき、$x$ の値を求めましょう。`, ans: x, hint: "たし算の逆はひき算だよ。", steps: [`$x = ${x + a * 3} - ${a * 3}$`, `$x = ${x}$`] };
          if (k === 1) return { q: `$x - ${a * 2} = ${x}$ のとき、$x$ の値を求めましょう。`, ans: x + a * 2, hint: "ひき算の逆はたし算だよ。", steps: [`$x = ${x} + ${a * 2}$`, `$x = ${x + a * 2}$`] };
          if (k === 2) return { q: `$x \\times ${a} = ${x * a}$ のとき、$x$ の値を求めましょう。`, ans: x, hint: "かけ算の逆はわり算だよ。", steps: [`$x = ${x * a} \\div ${a}$`, `$x = ${x}$`] };
          return { q: `$x \\div ${a} = ${x}$ のとき、$x$ の値を求めましょう。`, ans: x * a, hint: "わり算の逆はかけ算だよ。", steps: [`$x = ${x} \\times ${a}$`, `$x = ${x * a}$`] };
        }),
        t("E6-moji-1c", (r) => {
          const p = r(6, 15) * 10;
          const n = r(2, 6);
          const m = r(10, 25) * 10;
          const ans = `$x \\times ${n} + ${m}$`;
          return {
            q: `1本 $x$ 円のえんぴつを ${n}本と、${m}円のノートを1さつ買ったときの代金を表す式はどれですか。`,
            ans,
            choices: choices4(r, ans, [`$(x + ${m}) \\times ${n}$`, `$x + ${n} \\times ${m}$`, `$x \\times ${m} + ${n}$`, `$x \\times ${n} - ${m}$`]),
            hint: `えんぴつの代金は「1本のねだん × 本数」。それにノートの代金 ${m}円をたそう。たとえば $x$ が ${p} ならいくらかな？`,
            steps: [`えんぴつ ${n}本の代金は $x \\times ${n}$`, `ノートの代金 ${m}円をたして ${ans}`],
          };
        }),
      ],
      2: [
        t("E6-moji-2a", (r) => {
          const x = r(2, 20);
          const a = r(2, 9);
          const b = r(1, 30);
          const c = x * a + b;
          return {
            q: `$x \\times ${a} + ${b} = ${c}$ のとき、$x$ の値を求めましょう。`,
            ans: x,
            hint: "うしろから逆にたどろう。まず、$x \\times " + a + "$ はいくつ？",
            steps: [`$x \\times ${a} = ${c} - ${b} = ${c - b}$`, `$x = ${c - b} \\div ${a} = ${x}$`],
          };
        }),
        t("E6-moji-2b", (r) => {
          const a = r(2, 20);
          const x = a + r(1, 15);
          const b = r(2, 9);
          const c = (x - a) * b;
          return {
            q: `$(x - ${a}) \\times ${b} = ${c}$ のとき、$x$ の値を求めましょう。`,
            ans: x,
            hint: "( ) の中をひとまとまりと考えて、逆にたどろう。",
            steps: [`$x - ${a} = ${c} \\div ${b} = ${x - a}$`, `$x = ${x - a} + ${a} = ${x}$`],
          };
        }),
        t("E6-moji-2c", (r) => {
          const x = r(15, 45) * 10;
          const n = r(2, 6);
          const m = r(1, 5) * 50;
          const T = x * n + m;
          return {
            q: `1こ $x$ 円のケーキを ${n}こ買って、${m}円の箱に入れてもらったら、代金は ${T}円でした。$x$ の値を求めましょう。`,
            ans: x,
            hint: `代金の式は $x \\times ${n} + ${m}$ だね。`,
            steps: [`$x \\times ${n} + ${m} = ${T}$`, `$x \\times ${n} = ${T - m}$`, `$x = ${T - m} \\div ${n} = ${x}$`],
          };
        }),
      ],
      3: [
        t("E6-moji-3a", (r) => {
          const x = r(8, 25) * 10;
          const n = r(2, 5);
          const p = r(6, 15) * 10;
          const m = r(2, 4);
          const T = x * n + p * m;
          return {
            q: `1さつ $x$ 円のノートを ${n}さつと、1本 ${p}円のペンを ${m}本買うと、代金は ${T}円でした。ノート1さつのねだんは何円ですか。`,
            ans: x,
            unit: "円",
            hint: "代金を $x$ を使った式に表してから、逆にたどろう。",
            steps: [`$x \\times ${n} + ${p} \\times ${m} = ${T}$`, `$x \\times ${n} = ${T} - ${p * m} = ${T - p * m}$`, `$x = ${T - p * m} \\div ${n} = ${x}$（円）`],
          };
        }),
        t("E6-moji-3b", (r) => {
          const k = r(0, 3);
          const a = r(3, 9) * 10;
          const S = pick(r, [24, 36, 48, 60]);
          const all = [`$y = x \\times 3$`, `$y = ${a} \\times x + ${a * 2}$`, `$x \\times y = ${S}$`, `$y = 1000 - x$`, `$y = x + 3$`, `$y = x \\times ${a}$`];
          const [text, ans] = [
            ["1辺が $x$ cm の正三角形のまわりの長さを $y$ cm とします。", all[0]],
            [`1こ ${a}円のおかしを $x$ こ買って、${a * 2}円のふくろに入れてもらったときの代金を $y$ 円とします。`, all[1]],
            [`面積が ${S}cm² の長方形のたての長さを $x$ cm、横の長さを $y$ cm とします。`, all[2]],
            ["1000円持っていて、$x$ 円使ったときののこりのお金を $y$ 円とします。", all[3]],
          ][k];
          const wrongs = all.filter((s) => s !== ans);
          return {
            q: `${text}$x$ と $y$ の関係を表す式はどれですか。`,
            ans,
            choices: choices4(r, ans, sample(r, wrongs, 3)),
            hint: "$x$ に 1、2、3 などの数をあてはめて、$y$ がどうなるか考えてみよう。",
            steps: [["正三角形の3つの辺はみな同じ長さなので、まわりは $x \\times 3$", `代金 ＝ ${a} × こ数 ＋ ふくろ代`, "長方形の面積 ＝ たて × 横", "のこり ＝ 1000 − 使ったお金"][k], `式は ${ans}`],
          };
        }),
        t("E6-moji-3c", (r) => {
          const a = r(8, 15) * 10;
          const b = r(3, 7) * 10;
          const ans = "りんごとみかんの代金の合計";
          return {
            q: `1こ ${a}円のりんごを $x$ こと、1こ ${b}円のみかんを $y$ こ買いました。このとき、$${a} \\times x + ${b} \\times y$ は何を表していますか。`,
            ans,
            choices: choices4(r, ans, ["りんごとみかんのこ数の合計", "りんごの代金", "りんご1ことみかん1このねだんの合計", "りんごとみかんの代金のちがい"]),
            hint: `$${a} \\times x$ は何を表しているかな？`,
            steps: [`$${a} \\times x$ はりんごの代金、$${b} \\times y$ はみかんの代金`, `それをたしているので「${ans}」`],
          };
        }),
      ],
      4: [
        t("E6-moji-4a", (r) => {
          const x = r(2, 20);
          const a = r(2, 9);
          const b = r(2, 9);
          const c = x * (a + b);
          return {
            q: `$x \\times ${a} + x \\times ${b} = ${c}$ のとき、$x$ の値を求めましょう。`,
            ans: x,
            hint: "分配のきまりを使って、$x$ をひとまとめにしよう。",
            steps: [`$x \\times ${a} + x \\times ${b} = x \\times (${a} + ${b}) = x \\times ${a + b}$`, `$x \\times ${a + b} = ${c}$`, `$x = ${c} \\div ${a + b} = ${x}$`],
          };
        }),
        t("E6-moji-4b", (r) => {
          const x = r(2, 20);
          const a = r(2, 9);
          const b = r(1, 10);
          const c = r(1, 20);
          const d = a * (x + b) - c;
          if (d <= 0) return { skip: true };
          return {
            q: `$${a} \\times (x + ${b}) - ${c} = ${d}$ のとき、$x$ の値を求めましょう。`,
            ans: x,
            hint: "いちばん外側の計算から、順に逆にたどろう。",
            steps: [`$${a} \\times (x + ${b}) = ${d} + ${c} = ${d + c}$`, `$x + ${b} = ${d + c} \\div ${a} = ${x + b}$`, `$x = ${x + b} - ${b} = ${x}$`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-hi",
    grade: "E6",
    area: "func",
    name: "比",
    desc: "比の値・等しい比・比の利用",
    prereqs: ["E5-baisu", "E5-wariai"],
    points: [
      "2つの量の割合を「a : b」（a 対 b）のように表したものを比というよ。",
      "a : b の比の値は $a \\div b$。比の値が等しい比どうしは「等しい比」。",
      "a と b に同じ数をかけても、同じ数でわっても比は等しい。できるだけ小さい整数の比にすることを「比をかんたんにする」というよ。",
    ],
    levels: {
      1: [
        t("E6-hi-1a", (r) => {
          const a = r(1, 12);
          const b = r(2, 12);
          if (a === b) return { skip: true };
          return {
            q: `${a} : ${b} の比の値を求めましょう。`,
            ans: fracAns(a, b),
            hint: "a : b の比の値は a ÷ b だよ。",
            steps: [`${a} ÷ ${b} ＝ $${fr(a, b)}$`, gcd(a, b) > 1 ? `約分して $${fracTex(a, b)}$` : `答え $${fracTex(a, b)}$`],
          };
        }),
        t("E6-hi-1b", (r) => {
          const a = r(1, 9);
          const b = r(1, 9);
          if (a === b || gcd(a, b) !== 1) return { skip: true };
          const k = pick(r, [4, 6, 8, 9, 10, 12, 15]);
          const p = [2, 3, 5].find((q) => k % q === 0 && q !== k);
          const ans = `${a} : ${b}`;
          return {
            q: `${a * k} : ${b * k} をかんたんにすると、どれになりますか。`,
            ans,
            choices: choices4(r, ans, [`${(a * k) / p} : ${(b * k) / p}`, `${b} : ${a}`, `${a + 1} : ${b}`, `${a} : ${b + 1}`]),
            hint: `${a * k} と ${b * k} の最大公約数でわろう。`,
            steps: [`${a * k} と ${b * k} の最大公約数は ${k}`, `両方を ${k} でわって ${ans}`],
          };
        }),
        t("E6-hi-1c", (r) => {
          const a = r(1, 9);
          const b = r(2, 9);
          const k = r(2, 9);
          if (a === b) return { skip: true };
          if (r(0, 1)) {
            return {
              q: `${a} : ${b} ＝ □ : ${b * k} の □ にあてはまる数はいくつですか。`,
              ans: a * k,
              hint: `${b} を何倍すると ${b * k} になるかな？`,
              steps: [`${b} × ${k} ＝ ${b * k}`, `${a} にも ${k} をかけて ${a * k}`],
            };
          }
          return {
            q: `${a * k} : ${b * k} ＝ ${a} : □ の □ にあてはまる数はいくつですか。`,
            ans: b,
            hint: `${a * k} を何でわると ${a} になるかな？`,
            steps: [`${a * k} ÷ ${k} ＝ ${a}`, `${b * k} も ${k} でわって ${b}`],
          };
        }),
      ],
      2: [
        t("E6-hi-2a", (r) => {
          const x = r(1, 30);
          const y = r(1, 30);
          if (x === y || x % 10 === 0 || y % 10 === 0) return { skip: true };
          const ans = ratio(x, y);
          return {
            q: `${x / 10} : ${y / 10} をかんたんにすると、どれになりますか。`,
            ans,
            choices: choices4(r, ans, [`${x} : ${y}`, ratio(y, x), ratio(x + 1, y), ratio(x, y + 1)]),
            hint: "まず両方を10倍して、整数の比にしよう。",
            steps: [`両方を10倍して ${x} : ${y}`, gcd(x, y) > 1 ? `${gcd(x, y)} でわって ${ans}` : `これ以上かんたんにできないので ${ans}`],
          };
        }),
        t("E6-hi-2b", (r) => {
          const [a, b] = properFrac(r, 2, 9);
          const [c, d] = properFrac(r, 2, 9);
          if (a * d === b * c) return { skip: true };
          const ans = ratio(a * d, c * b);
          return {
            q: `$${fr(a, b)} : ${fr(c, d)}$ をかんたんにすると、どれになりますか。`,
            ans,
            choices: choices4(r, ans, [ratio(a, c), ratio(b, d), ratio(c * b, a * d), ratio(a * c, b * d)]),
            hint: `分母の最小公倍数 ${lcm(b, d)} を両方にかけてみよう。`,
            steps: [`両方に ${lcm(b, d)} をかけると ${(a * lcm(b, d)) / b} : ${(c * lcm(b, d)) / d}`, `かんたんにして ${ans}`],
          };
        }),
        t("E6-hi-2c", (r) => {
          const a = r(2, 9);
          const b = r(2, 9);
          const k = r(2, 9);
          if (a === b || gcd(a, b) !== 1) return { skip: true };
          return {
            q: `たてと横の長さの比が ${a} : ${b} の長方形があります。横の長さが ${b * k}cm のとき、たての長さは何cmですか。`,
            ans: a * k,
            unit: "cm",
            hint: `${b} が ${b * k} になったのは何倍かな？`,
            steps: [`${b * k} ÷ ${b} ＝ ${k}（倍）`, `たては ${a} × ${k} ＝ ${a * k}（cm）`],
          };
        }),
      ],
      3: [
        t("E6-hi-3a", (r) => {
          const a = r(1, 7);
          const b = r(1, 7);
          if (a === b || gcd(a, b) !== 1) return { skip: true };
          const u = r(1, 9) * 50;
          const T = (a + b) * u;
          return {
            q: `${T}円を、兄と弟で ${a} : ${b} になるように分けます。兄の分は何円ですか。`,
            ans: a * u,
            unit: "円",
            hint: `全体を ${a} ＋ ${b} ＝ ${a + b} として考えよう。`,
            steps: [`全体は ${a} ＋ ${b} ＝ ${a + b}`, `兄の分は全体の $${fr(a, a + b)}$`, `${T} × $${fr(a, a + b)}$ ＝ ${a * u}（円）`],
          };
        }),
        t("E6-hi-3b", (r) => {
          const a = r(3, 9);
          const b = r(1, a - 1);
          if (gcd(a, b) !== 1) return { skip: true };
          const u = r(2, 12);
          const D = (a - b) * u;
          return {
            q: `姉と妹の持っているカードの数の比は ${a} : ${b} で、姉は妹より ${D}まい多く持っています。姉は何まい持っていますか。`,
            ans: a * u,
            unit: "まい",
            hint: `比の ${a} と ${b} のちがい ${a - b} が、${D}まいにあたるね。`,
            steps: [`比のちがい ${a} − ${b} ＝ ${a - b} が ${D}まい`, `比の1にあたるのは ${D} ÷ ${a - b} ＝ ${u}（まい）`, `姉は ${a} × ${u} ＝ ${a * u}（まい）`],
          };
        }),
        t("E6-hi-3c", (r) => {
          const a = r(1, 5);
          const b = r(1, 5);
          if (a === b || gcd(a, b) !== 1) return { skip: true };
          const u = r(2, 10) * 10;
          return {
            q: `ジュースと牛にゅうを ${a} : ${b} の割合でまぜて、ミックスジュースをつくります。牛にゅうを ${b * u}mL 使うと、ミックスジュースは全部で何mL できますか。`,
            ans: (a + b) * u,
            unit: "mL",
            hint: `牛にゅうの比 ${b} が ${b * u}mL にあたるね。`,
            steps: [`比の1にあたるのは ${b * u} ÷ ${b} ＝ ${u}（mL）`, `ジュースは ${a} × ${u} ＝ ${a * u}（mL）`, `全部で ${a * u} ＋ ${b * u} ＝ ${(a + b) * u}（mL）`],
          };
        }),
      ],
      4: [
        t("E6-hi-4a", (r) => {
          let a = 0;
          let b = 0;
          let c = 0;
          let d = 0;
          for (let k = 0; k < 60; k++) {
            a = r(1, 7);
            b = r(2, 7);
            c = r(2, 7);
            d = r(1, 7);
            if (gcd(a, b) === 1 && gcd(c, d) === 1 && b !== c && a !== b && c !== d) break;
          }
          if (gcd(a, b) !== 1 || gcd(c, d) !== 1 || b === c || a === b || c === d) return { skip: true };
          const ans = ratio(a * c, b * d);
          return {
            q: `A : B ＝ ${a} : ${b}、B : C ＝ ${c} : ${d} のとき、A : C をかんたんな比で表すとどれですか。`,
            ans,
            choices: choices4(r, ans, [ratio(a, d), ratio(a * d, b * c), ratio(b * d, a * c), ratio(a + c, b + d)]),
            hint: `2つの比で、B の数をそろえよう（${b} と ${c} の最小公倍数）。`,
            steps: [
              `B を ${lcm(b, c)} にそろえる：A : B ＝ ${(a * lcm(b, c)) / b} : ${lcm(b, c)}、B : C ＝ ${lcm(b, c)} : ${(d * lcm(b, c)) / c}`,
              `A : B : C ＝ ${(a * lcm(b, c)) / b} : ${lcm(b, c)} : ${(d * lcm(b, c)) / c}`,
              `A : C ＝ ${ans}`,
            ],
          };
        }),
        t("E6-hi-4b", (r) => {
          let a = 0;
          let b = 0;
          let c = 0;
          let d = 0;
          let ok = false;
          for (let k = 0; k < 80 && !ok; k++) {
            a = r(3, 7);
            b = r(2, 6);
            c = r(1, 5);
            d = r(2, 6);
            ok = gcd(a, b) === 1 && gcd(c, d) === 1 && a * d > c * b && a * d * 10 <= 3000 / 1;
          }
          if (!ok) return { skip: true };
          const t0 = r(1, 6) * 10;
          const A = a * d * t0;
          const B = b * d * t0;
          const x = (a * d - c * b) * t0;
          if (A > 3000) return { skip: true };
          return {
            q: `AさんとBさんの持っているお金の比は ${a} : ${b} でした。Aさんが ${x}円使ったので、2人の持っているお金の比は ${c} : ${d} になりました。Aさんがはじめに持っていたお金は何円ですか。`,
            ans: A,
            unit: "円",
            hint: "Bさんのお金は変わっていないね。2つの比で B の数をそろえよう。",
            steps: [
              `B をそろえると、はじめ ${a * d} : ${b * d}、あと ${c * b} : ${d * b}`,
              `A のへった分 ${a * d} − ${c * b} ＝ ${a * d - c * b} が ${x}円なので、1 あたり ${t0}円`,
              `はじめの A は ${a * d} × ${t0} ＝ ${A}（円）`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-enmenseki",
    grade: "E6",
    area: "geo",
    name: "円の面積",
    desc: "半径×半径×3.14",
    prereqs: ["E5-enshu", "E5-menseki"],
    points: [
      "円の面積 ＝ 半径 × 半径 × 3.14。",
      "直径がわかっているときは、まず半分にして半径を求めよう。",
      "半円は円の面積 ÷ 2、円を4等分した形は円の面積 ÷ 4 だよ。",
    ],
    levels: {
      1: [
        t("E6-enmenseki-1a", (r) => {
          const a = r(1, 15);
          const ans = round(a * a * 3.14);
          return {
            q: `半径 ${a}cm の円の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "円の面積 ＝ 半径 × 半径 × 3.14",
            steps: [`${a} × ${a} × 3.14 ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-1b", (r) => {
          const d = 2 * r(1, 10);
          const a = d / 2;
          const ans = round(a * a * 3.14);
          return {
            q: `直径 ${d}cm の円の面積は何cm²ですか。`,
            ans,
            choices: numChoices(r, ans, [round(d * d * 3.14), round(d * 3.14), round(a * 2 * 3.14) === round(d * 3.14) ? round(a * 3.14) : round(a * 2 * 3.14)]),
            hint: "まず半径を求めよう。",
            steps: [`半径は ${d} ÷ 2 ＝ ${a}（cm）`, `${a} × ${a} × 3.14 ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-1c", (r) => {
          const a = r(2, 12);
          const ans = round((a * a * 3.14) / 2);
          return {
            q: `半径 ${a}cm の円を半分にした形（半円）の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "円の面積を求めてから、2でわろう。",
            steps: [`円の面積：${a} × ${a} × 3.14 ＝ ${round(a * a * 3.14)}`, `${round(a * a * 3.14)} ÷ 2 ＝ ${ans}（cm²）`],
          };
        }),
      ],
      2: [
        t("E6-enmenseki-2a", (r) => {
          const a = r(2, 12);
          const ans = round((a * a * 3.14) / 4);
          return {
            q: `半径 ${a}cm の円を、中心を通る2本の直線で4等分した形の1つ（中心の角が直角の形）の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "円の面積を求めてから、4でわろう。",
            steps: [`円の面積：${a} × ${a} × 3.14 ＝ ${round(a * a * 3.14)}`, `${round(a * a * 3.14)} ÷ 4 ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-2b", (r) => {
          const a = r(2, 10);
          const C = round(2 * a * 3.14);
          const ans = round(a * a * 3.14);
          return {
            q: `円周の長さが ${C}cm の円の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "まず、円周の長さから半径を求めよう。",
            steps: [`直径：${C} ÷ 3.14 ＝ ${2 * a}、半径：${a}cm`, `${a} × ${a} × 3.14 ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-2c", (r) => {
          const R = r(3, 12);
          const s = r(1, R - 1);
          const ans = round((R * R - s * s) * 3.14);
          return {
            q: `半径 ${R}cm の円から、同じ中心で半径 ${s}cm の円を切り取った形（ドーナツ形）の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "大きい円の面積から、小さい円の面積をひこう。",
            steps: [`大きい円：${R} × ${R} × 3.14 ＝ ${round(R * R * 3.14)}、小さい円：${s} × ${s} × 3.14 ＝ ${round(s * s * 3.14)}`, `${round(R * R * 3.14)} − ${round(s * s * 3.14)} ＝ ${ans}（cm²）`],
          };
        }),
      ],
      3: [
        t("E6-enmenseki-3a", (r) => {
          const L = 2 * r(1, 10);
          const a = L / 2;
          const ans = round(a * a * 3.14);
          return {
            q: `1辺が ${L}cm の正方形の中に、4つの辺にぴったりくっつく円をかきました。この円の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "円の直径は、正方形の1辺と同じ長さだよ。",
            steps: [`円の直径は ${L}cm なので、半径は ${a}cm`, `${a} × ${a} × 3.14 ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-3b", (r) => {
          const L = 2 * r(1, 10);
          const a = L / 2;
          const circle = round(a * a * 3.14);
          const ans = round(L * L - circle);
          return {
            q: `1辺が ${L}cm の正方形の紙から、4つの辺にぴったりくっつく円を切り取りました。のこりの紙の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "正方形の面積から、円の面積をひこう。",
            steps: [`正方形：${L} × ${L} ＝ ${L * L}`, `円：${a} × ${a} × 3.14 ＝ ${circle}`, `${L * L} − ${circle} ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-3c", (r) => {
          const s = r(1, 5);
          const k = r(2, 4);
          const R = s * k;
          return {
            q: `半径 ${R}cm の円の面積は、半径 ${s}cm の円の面積の何倍ですか。`,
            ans: k * k,
            unit: "倍",
            hint: "それぞれの面積の式をくらべてみよう。3.14 は共通だね。",
            steps: [`${R} × ${R} × 3.14 と ${s} × ${s} × 3.14 をくらべる`, `${R * R} ÷ ${s * s} ＝ ${k * k}（倍）`, `半径が ${k} 倍になると、面積は ${k} × ${k} ＝ ${k * k} 倍`],
          };
        }),
      ],
      4: [
        t("E6-enmenseki-4a", (r) => {
          const a = 2 * r(1, 10);
          const q = round((a * a * 3.14) / 4);
          const ans = round(q * 2 - a * a);
          return {
            q: `1辺が ${a}cm の正方形 ABCD の中に、頂点 B を中心とする半径 ${a}cm の円の4分の1と、頂点 D を中心とする半径 ${a}cm の円の4分の1をかきました。2つが重なった部分（葉っぱのような形）の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "円の4分の1の形を2つ合わせると、重なった部分を2回数えて、正方形より大きくなるね。",
            steps: [`円の4分の1：${a} × ${a} × 3.14 ÷ 4 ＝ ${q}`, `2つをあわせると正方形全体をおおい、重なった部分だけを2回数えているので、合計 ${round(q * 2)} は正方形 ${a * a} より重なった部分の分だけ大きい`, `${round(q * 2)} − ${a * a} ＝ ${ans}（cm²）`],
          };
        }),
        t("E6-enmenseki-4b", (r) => {
          const a = r(2, 12);
          const sq = 2 * a * a;
          if (r(0, 1)) {
            return {
              q: `半径 ${a}cm の円の中に、4つの頂点が円周上にある正方形をかきました。この正方形の面積は何cm²ですか。`,
              ans: sq,
              unit: "cm²",
              hint: "正方形はひし形の仲間。対角線の長さはいくつかな？",
              steps: [`正方形の対角線は円の直径で ${2 * a}cm`, `正方形（ひし形）の面積 ＝ 対角線 × 対角線 ÷ 2`, `${2 * a} × ${2 * a} ÷ 2 ＝ ${sq}（cm²）`],
            };
          }
          const ans = round(a * a * 3.14 - sq);
          return {
            q: `半径 ${a}cm の円の中に、4つの頂点が円周上にある正方形をかきました。円の中で、正方形の外側の部分の面積は何cm²ですか。`,
            ans,
            unit: "cm²",
            hint: "正方形の対角線は円の直径だよ。正方形の面積は「対角線 × 対角線 ÷ 2」で求められる。",
            steps: [`円：${a} × ${a} × 3.14 ＝ ${round(a * a * 3.14)}`, `正方形：${2 * a} × ${2 * a} ÷ 2 ＝ ${sq}`, `${round(a * a * 3.14)} − ${sq} ＝ ${ans}（cm²）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-kakuchu",
    grade: "E6",
    area: "geo",
    name: "角柱・円柱の体積",
    desc: "底面積×高さ",
    prereqs: ["E5-taiseki", "E6-enmenseki"],
    points: [
      "角柱・円柱の体積 ＝ 底面積 × 高さ。",
      "底面が三角形なら「底辺 × 高さ ÷ 2」、円なら「半径 × 半径 × 3.14」で底面積を出そう。",
      "柱の「高さ」は、2つの底面の間の長さだよ。",
    ],
    levels: {
      1: [
        t("E6-kakuchu-1a", (r) => {
          const S = r(5, 60);
          const h = r(2, 15);
          const kind = pick(r, ["角柱", "円柱"]);
          return {
            q: `底面積が ${S}cm²、高さが ${h}cm の${kind}の体積は何cm³ですか。`,
            ans: S * h,
            unit: "cm³",
            hint: "体積 ＝ 底面積 × 高さ",
            steps: [`${S} × ${h} ＝ ${S * h}（cm³）`],
          };
        }),
        t("E6-kakuchu-1b", (r) => {
          let a = r(3, 12);
          const b = r(2, 10);
          if ((a * b) % 2) a += 1;
          const h = r(2, 15);
          const S = (a * b) / 2;
          return {
            q: `底面が、底辺 ${a}cm、高さ ${b}cm の三角形で、高さが ${h}cm の三角柱の体積は何cm³ですか。`,
            ans: S * h,
            unit: "cm³",
            hint: "まず底面積（三角形の面積）を求めよう。",
            steps: [`底面積：${a} × ${b} ÷ 2 ＝ ${S}（cm²）`, `${S} × ${h} ＝ ${S * h}（cm³）`],
          };
        }),
        t("E6-kakuchu-1c", (r) => {
          const a = r(1, 10);
          const h = r(2, 15);
          const ans = round(a * a * 3.14 * h);
          return {
            q: `底面の半径が ${a}cm、高さが ${h}cm の円柱の体積は何cm³ですか。`,
            ans,
            unit: "cm³",
            hint: "底面積（円の面積）× 高さ",
            steps: [`底面積：${a} × ${a} × 3.14 ＝ ${round(a * a * 3.14)}（cm²）`, `${round(a * a * 3.14)} × ${h} ＝ ${ans}（cm³）`],
          };
        }),
      ],
      2: [
        t("E6-kakuchu-2a", (r) => {
          const d = 2 * r(1, 6);
          const a = d / 2;
          const h = r(2, 10);
          const ans = round(a * a * 3.14 * h);
          return {
            q: `底面の直径が ${d}cm、高さが ${h}cm の円柱の体積は何cm³ですか。`,
            ans,
            choices: numChoices(r, ans, [round(d * d * 3.14 * h), round(d * 3.14 * h), round(a * a * 3.14 * h / 2)]),
            hint: "底面の半径を先に求めよう。",
            steps: [`半径 ${a}cm、底面積：${a} × ${a} × 3.14 ＝ ${round(a * a * 3.14)}`, `${round(a * a * 3.14)} × ${h} ＝ ${ans}（cm³）`],
          };
        }),
        t("E6-kakuchu-2b", (r) => {
          const p = r(2, 8);
          const q = r(p + 1, 14);
          let k = r(2, 8);
          if (((p + q) * k) % 2) k += 1;
          const h = r(2, 12);
          const S = ((p + q) * k) / 2;
          return {
            q: `底面が、上底 ${p}cm、下底 ${q}cm、高さ ${k}cm の台形で、高さが ${h}cm の四角柱の体積は何cm³ですか。`,
            ans: S * h,
            unit: "cm³",
            hint: "まず底面積（台形の面積）を求めよう。台形の高さと柱の高さを区別してね。",
            steps: [`底面積：(${p} ＋ ${q}) × ${k} ÷ 2 ＝ ${S}（cm²）`, `${S} × ${h} ＝ ${S * h}（cm³）`],
          };
        }),
        t("E6-kakuchu-2c", (r) => {
          const S = r(6, 50);
          const h = r(2, 15);
          return {
            q: `体積が ${S * h}cm³ で、底面積が ${S}cm² の角柱の高さは何cmですか。`,
            ans: h,
            unit: "cm",
            hint: "体積 ＝ 底面積 × 高さ を逆に使おう。",
            steps: [`${S} × □ ＝ ${S * h}`, `□ ＝ ${S * h} ÷ ${S} ＝ ${h}（cm）`],
          };
        }),
      ],
      3: [
        t("E6-kakuchu-3a", (r) => {
          const a = pick(r, [5, 10, 15, 20]);
          const h = pick(r, [10, 20, 30, 40]);
          const cm3 = round(a * a * 3.14 * h);
          const ans = round(cm3 / 1000);
          return {
            q: `内側の底面の半径が ${a}cm、深さが ${h}cm の円柱の形をした入れ物があります。この入れ物には、水が何L 入りますか。`,
            ans,
            unit: "L",
            hint: "体積を cm³ で求めてから、1L ＝ 1000cm³ でなおそう。",
            steps: [`${a} × ${a} × 3.14 × ${h} ＝ ${cm3}（cm³）`, `${cm3} ÷ 1000 ＝ ${ans}（L）`],
          };
        }),
        t("E6-kakuchu-3b", (r) => {
          const R = r(3, 10);
          const s = r(1, R - 1);
          const h = r(2, 12);
          const ans = round((R * R - s * s) * 3.14 * h);
          return {
            q: `底面の半径が ${R}cm、高さが ${h}cm の円柱から、同じ中心で底面の半径が ${s}cm の円柱をくりぬいて、つつの形をつくりました。この立体の体積は何cm³ですか。`,
            ans,
            unit: "cm³",
            hint: "底面積（ドーナツ形）× 高さ で求めよう。",
            steps: [`底面積：(${R} × ${R} − ${s} × ${s}) × 3.14 ＝ ${round((R * R - s * s) * 3.14)}`, `${round((R * R - s * s) * 3.14)} × ${h} ＝ ${ans}（cm³）`],
          };
        }),
        t("E6-kakuchu-3c", (r) => {
          const a = r(6, 15);
          const b = r(6, 15);
          const h = r(3, 12);
          const s = r(1, Math.floor(Math.min(a, b) / 2) - 1);
          const box = a * b * h;
          const cyl = round(s * s * 3.14 * h);
          const ans = round(box - cyl);
          return {
            q: `たて ${a}cm、横 ${b}cm、高さ ${h}cm の直方体から、底面の半径が ${s}cm で高さが ${h}cm の円柱をくりぬきました。のこりの立体の体積は何cm³ですか。`,
            ans,
            unit: "cm³",
            hint: "直方体の体積から、円柱の体積をひこう。",
            steps: [`直方体：${a} × ${b} × ${h} ＝ ${box}`, `円柱：${s} × ${s} × 3.14 × ${h} ＝ ${cyl}`, `${box} − ${cyl} ＝ ${ans}（cm³）`],
          };
        }),
      ],
      4: [
        t("E6-kakuchu-4a", (r) => {
          const [p, q] = pick(r, [[2, 1], [3, 1], [1, 2], [3, 2], [2, 3], [1, 3]]);
          const u = r(1, 3) * 2;
          const R = p * u;
          const S = q * u;
          const h = q * q * r(1, 6);
          const ans = (h * p * p) / (q * q);
          if (ans > 60) return { skip: true };
          return {
            q: `底面の半径が ${R}cm の円柱の形をした入れ物に、水が深さ ${h}cm まで入っています。この水を全部、底面の半径が ${S}cm の円柱の形をした入れ物にうつすと、水の深さは何cmになりますか。（水はあふれないものとします）`,
            ans,
            unit: "cm",
            hint: "水の体積は変わらないね。底面積が何倍になるかを考えよう。",
            steps: [
              `水の体積：${R} × ${R} × 3.14 × ${h}`,
              `うつしたあとの底面積は ${S} × ${S} × 3.14 なので、深さ ＝ ${R} × ${R} × ${h} ÷ (${S} × ${S})`,
              `＝ ${R * R * h} ÷ ${S * S} ＝ ${ans}（cm）`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-hirei",
    grade: "E6",
    area: "func",
    name: "比例と反比例",
    desc: "y＝決まった数×x",
    prereqs: ["E5-tani", "E6-hi"],
    points: [
      "$y = $ 決まった数 $\\times x$ のとき、$y$ は $x$ に比例する。$x$ が2倍、3倍…になると、$y$ も2倍、3倍…になるよ。",
      "$x \\times y = $ 決まった数 のとき、$y$ は $x$ に反比例する。$x$ が2倍になると、$y$ は $\\frac{1}{2}$ 倍になるよ。",
      "比例のグラフは、0 の点を通る直線になるよ。",
    ],
    levels: {
      1: [
        t("E6-hirei-1a", (r) => {
          const k = r(2, 9);
          const a = r(2, 6);
          const c = r(3, 12);
          if (a === c) return { skip: true };
          return {
            q: `$y$ は $x$ に比例し、$x = ${a}$ のとき $y = ${k * a}$ です。$x = ${c}$ のときの $y$ の値を求めましょう。`,
            ans: k * c,
            hint: "まず、決まった数（$y \\div x$）を求めよう。",
            steps: [`決まった数は ${k * a} ÷ ${a} ＝ ${k}、式は $y = ${k} \\times x$`, `$y = ${k} \\times ${c} = ${k * c}$`],
          };
        }),
        t("E6-hirei-1b", (r) => {
          const k = r(2, 15);
          const a = r(2, 9);
          return {
            q: `$y$ は $x$ に比例し、$x = ${a}$ のとき $y = ${k * a}$ です。$y = $ 決まった数 $\\times x$ の「決まった数」を求めましょう。`,
            ans: k,
            hint: "決まった数 ＝ $y \\div x$",
            steps: [`${k * a} ÷ ${a} ＝ ${k}`],
          };
        }),
        t("E6-hirei-1c", (r) => {
          const a = r(2, 6);
          const b = r(2, 12);
          const P = a * b;
          const cs = [];
          for (let c = 1; c <= P; c++) if (P % c === 0 && c !== a) cs.push(c);
          const c = pick(r, cs);
          return {
            q: `$y$ は $x$ に反比例し、$x = ${a}$ のとき $y = ${b}$ です。$x = ${c}$ のときの $y$ の値を求めましょう。`,
            ans: P / c,
            hint: "反比例では、$x \\times y$ がいつも同じ数になるよ。",
            steps: [`$x \\times y = ${a} \\times ${b} = ${P}$`, `$${c} \\times y = ${P}$ なので $y = ${P} \\div ${c} = ${P / c}$`],
          };
        }),
      ],
      2: [
        t("E6-hirei-2a", (r) => {
          const p = r(3, 15) * 10;
          const S = pick(r, [12, 18, 24, 36]);
          const A = r(5, 20) * 100;
          const D = pick(r, [12, 24, 60]);
          const P = r(10, 30);
          const hi = [`1本 ${p}円のえんぴつを $x$ 本買ったときの代金 $y$ 円`, `時速 ${p / 10}km で $x$ 時間進んだときの道のり $y$ km`, "1辺が $x$ cm の正方形のまわりの長さ $y$ cm"];
          const han = [`面積が ${S}cm² の長方形のたて $x$ cm と横 $y$ cm`, `${D}km の道のりを時速 $x$ km で進むときにかかる時間 $y$ 時間`, `${S * 2}このあめを $x$ 人で同じ数ずつ分けるときの1人分の数 $y$ こ`];
          const non = [`${A}円持っていて $x$ 円使ったときの、のこりのお金 $y$ 円`, `まわりの長さが ${P}cm の長方形のたて $x$ cm と横 $y$ cm`, "1辺が $x$ cm の正方形の面積 $y$ cm²", "$x$ 才の人の身長 $y$ cm"];
          const want = r(0, 1) === 0;
          const ans = pick(r, want ? hi : han);
          const wrongs = [pick(r, want ? han : hi), ...sample(r, non, 2)];
          return {
            q: `${pick(r, NAMES)}さんは、ともなって変わる2つの量 $x$ と $y$ を調べました。次のうち、$y$ が $x$ に${want ? "比例" : "反比例"}するものはどれですか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: want ? "「$y = $ 決まった数 $\\times x$」の式になるものをさがそう。" : "「$x \\times y = $ 決まった数」になるものをさがそう。",
            steps: [want ? "$x$ が2倍、3倍…になると $y$ も2倍、3倍…になるものが比例" : "$x$ が2倍、3倍…になると $y$ が $\\frac{1}{2}$ 倍、$\\frac{1}{3}$ 倍…になるものが反比例", `答え：${ans}`],
          };
        }),
        t("E6-hirei-2b", (r) => {
          const w = r(2, 9);
          const n = pick(r, [10, 20, 50]);
          const N = r(3, 30) * 10;
          return {
            q: `同じくぎ ${n}本の重さをはかったら ${w * n}g でした。くぎ全部の重さが ${w * N}g のとき、くぎは全部で何本ありますか。`,
            ans: N,
            unit: "本",
            hint: "くぎの本数と重さは比例するよ。",
            steps: [`1本の重さは ${w * n} ÷ ${n} ＝ ${w}（g）`, `${w * N} ÷ ${w} ＝ ${N}（本）`],
          };
        }),
        t("E6-hirei-2c", (r) => {
          const a = r(2, 12) * 5;
          const tt = r(2, 6);
          const D = a * tt;
          const bs = [];
          for (let b = 5; b <= 120; b += 5) if (D % b === 0 && b !== a) bs.push(b);
          if (!bs.length) return { skip: true };
          const b = pick(r, bs);
          return {
            q: `時速 ${a}km で ${tt}時間かかる道のりを、時速 ${b}km で進むと、何時間かかりますか。`,
            ans: D / b,
            unit: "時間",
            hint: "道のりが同じとき、速さとかかる時間は反比例するよ。",
            steps: [`道のりは ${a} × ${tt} ＝ ${D}（km）`, `${D} ÷ ${b} ＝ ${D / b}（時間）`],
          };
        }),
      ],
      3: [
        t("E6-hirei-3a", (r) => {
          const A = r(10, 40);
          const n = r(2, 12);
          const Bs = [];
          for (let b = 8; b <= 60; b++) if ((A * n) % b === 0 && b !== A) Bs.push(b);
          if (!Bs.length) return { skip: true };
          const B = pick(r, Bs);
          return {
            q: `歯の数が ${A} の歯車Aと、歯の数が ${B} の歯車Bがかみ合っています。Aが ${n}回転するとき、Bは何回転しますか。`,
            ans: (A * n) / B,
            unit: "回転",
            hint: "かみ合った歯の数は、AとBで同じだね。歯の数と回転数は反比例するよ。",
            steps: [`Aが ${n}回転すると、かみ合う歯の数は ${A} × ${n} ＝ ${A * n}`, `Bの回転数は ${A * n} ÷ ${B} ＝ ${(A * n) / B}（回転）`],
          };
        }),
        t("E6-hirei-3b", (r) => {
          const a = r(2, 8);
          const b = r(2, 12);
          const P = a * b;
          const cs = [];
          for (let c = 1; c <= P; c++) if (P % c === 0 && c !== b) cs.push(c);
          const c = pick(r, cs);
          return {
            q: `$y$ は $x$ に反比例し、$x = ${a}$ のとき $y = ${b}$ です。$y = ${c}$ になるのは、$x$ の値がいくつのときですか。`,
            ans: P / c,
            hint: "反比例では、$x \\times y$ がいつも同じ数になるよ。",
            steps: [`$x \\times y = ${a} \\times ${b} = ${P}$`, `$x \\times ${c} = ${P}$ なので $x = ${P} \\div ${c} = ${P / c}$`],
          };
        }),
        t("E6-hirei-3c", (r) => {
          const a = r(2, 12);
          const tt = r(3, 12);
          const W = a * tt;
          const t2s = [];
          for (let k = 2; k <= 40; k++) if (W % k === 0 && k !== tt) t2s.push(k);
          if (!t2s.length) return { skip: true };
          const t2 = pick(r, t2s);
          if (r(0, 1)) {
            return {
              q: `水そうに毎分 ${a}L ずつ水を入れると、${tt}分でいっぱいになります。${t2}分でいっぱいにするには、毎分何L ずつ水を入れればよいですか。`,
              ans: W / t2,
              unit: "L",
              hint: "水そうに入る水の量は変わらないね。1分間の量と時間は反比例するよ。",
              steps: [`水そうに入る水は ${a} × ${tt} ＝ ${W}（L）`, `${W} ÷ ${t2} ＝ ${W / t2}（L）`],
            };
          }
          return {
            q: `ある仕事を ${a}人ですると ${tt}日かかります。同じ仕事を ${W / t2}人ですると、何日かかりますか。（1人が1日にする仕事の量はみな同じとします）`,
            ans: t2,
            unit: "日",
            hint: "人数とかかる日数は反比例するよ。全部の仕事の量を「人 × 日」で考えよう。",
            steps: [`仕事の量は ${a} × ${tt} ＝ ${W}（人・日）`, `${W} ÷ ${W / t2} ＝ ${t2}（日）`],
          };
        }),
      ],
      4: [
        t("E6-hirei-4a", (r) => {
          const k = r(2, 9);
          const a = r(2, 5);
          const c = r(6, 20);
          return {
            q: `$y$ は $x$ に比例し、$x$ が ${a} ふえると $y$ は ${k * a} ふえます。$x = ${c}$ のときの $y$ の値を求めましょう。`,
            ans: k * c,
            hint: "比例では、$x$ が1ふえると $y$ はいつも同じだけふえるよ。",
            steps: [`$x$ が1ふえると $y$ は ${k * a} ÷ ${a} ＝ ${k} ふえる`, `比例なので $x = 0$ のとき $y = 0$、式は $y = ${k} \\times x$`, `$y = ${k} \\times ${c} = ${k * c}$`],
          };
        }),
        t("E6-hirei-4b", (r) => {
          const a = r(12, 40);
          const b = r(10, 50);
          const n = r(2, 12);
          if (a === b) return { skip: true };
          const cs = [];
          for (let c = 8; c <= 60; c++) if ((a * n) % c === 0 && c !== a && c !== b) cs.push(c);
          if (!cs.length) return { skip: true };
          const c = pick(r, cs);
          return {
            q: `歯の数が ${a} の歯車A、${b} の歯車B、${c} の歯車Cが、A と B、B と C の順にかみ合っています。Aが ${n}回転するとき、Cは何回転しますか。`,
            ans: (a * n) / c,
            unit: "回転",
            hint: "AとB、BとCで、かみ合う歯の数はそれぞれ同じ。Bの歯の数は答えに関係するかな？",
            steps: [`Aが ${n}回転すると、かみ合う歯は ${a} × ${n} ＝ ${a * n}。Bも ${a * n} 歯分まわる`, `BとCでも、かみ合う歯の数は同じ ${a * n}`, `Cは ${a * n} ÷ ${c} ＝ ${(a * n) / c}（回転）（Bの歯の数は関係ない）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-kakudai",
    grade: "E6",
    area: "geo",
    name: "拡大図と縮図",
    desc: "縮尺・実際の長さ",
    prereqs: ["E6-hi"],
    points: [
      "形を変えずに大きくした図が拡大図、小さくした図が縮図。対応する辺の長さの比はすべて等しく、対応する角の大きさはそれぞれ等しいよ。",
      "実際の長さを縮めた割合を縮尺という。「1 : 25000」は、実際の長さを $\\frac{1}{25000}$ にしたということ。",
      "実際の長さ ＝ 地図上の長さ × 縮尺の分母。cm → m → km の単位のなおし方に気をつけよう。",
    ],
    levels: {
      1: [
        t("E6-kakudai-1a", (r) => {
          const k = r(2, 4);
          const a = r(2, 15);
          return {
            q: `三角形 ABC の ${k}倍の拡大図 DEF をかきました。辺 AB の長さが ${a}cm のとき、AB に対応する辺 DE の長さは何cmですか。`,
            ans: a * k,
            unit: "cm",
            hint: `${k}倍の拡大図では、辺の長さはすべて ${k}倍になるよ。`,
            steps: [`${a} × ${k} ＝ ${a * k}（cm）`],
          };
        }),
        t("E6-kakudai-1b", (r) => {
          const k = r(2, 5);
          const a = k * r(2, 10);
          return {
            q: `四角形 ABCD の $\\frac{1}{${k}}$ の縮図をかきました。辺 AB の長さが ${a}cm のとき、縮図で AB に対応する辺の長さは何cmですか。`,
            ans: a / k,
            unit: "cm",
            hint: `$\\frac{1}{${k}}$ の縮図では、辺の長さはすべて $\\frac{1}{${k}}$ になるよ。`,
            steps: [`${a} × $\\frac{1}{${k}}$ ＝ ${a} ÷ ${k} ＝ ${a / k}（cm）`],
          };
        }),
        t("E6-kakudai-1c", (r) => {
          const k = r(2, 4);
          const A = r(25, 110);
          const ans = `${A}°`;
          return {
            q: `三角形 ABC の ${k}倍の拡大図 DEF をかきました。角 A の大きさが ${A}° のとき、角 A に対応する角 D の大きさはどれですか。`,
            ans,
            choices: choices4(r, ans, [`${A * k}°`, `${180 - A}°`, `${Math.round(A / k)}°`, `${A + 90}°`], (i) => `${A + 10 * (i + 1)}°`),
            hint: "拡大図や縮図で、対応する角の大きさはどうなるかな？",
            steps: ["拡大図・縮図では、対応する角の大きさは等しい", `角 D ＝ ${A}°`],
          };
        }),
      ],
      2: [
        t("E6-kakudai-2a", (r) => {
          const N = pick(r, [1000, 2000, 5000, 10000, 25000]);
          const d = r(2, 15);
          const ans = (d * N) / 100;
          return {
            q: `縮尺 1 : ${N} の地図で、${d}cm の長さは、実際には何m ですか。`,
            ans,
            unit: "m",
            hint: "実際の長さ ＝ 地図上の長さ × " + N + "。cm を m になおそう。",
            steps: [`${d} × ${N} ＝ ${d * N}（cm）`, `${d * N}cm ＝ ${ans}m`],
          };
        }),
        t("E6-kakudai-2b", (r) => {
          const N = pick(r, [10000, 20000, 25000, 50000, 100000]);
          const D = r(1, 10);
          const ans = (D * 100000) / N;
          return {
            q: `実際の長さが ${D}km の道のりは、縮尺 1 : ${N} の地図上では何cm になりますか。`,
            ans,
            unit: "cm",
            hint: "まず km を cm になおしてから、" + N + " でわろう。",
            steps: [`${D}km ＝ ${D * 100000}cm`, `${D * 100000} ÷ ${N} ＝ ${ans}（cm）`],
          };
        }),
        t("E6-kakudai-2c", (r) => {
          const a = r(2, 9);
          const b = r(2, 9);
          const k = pick(r, [2, 3, 1.5, 2.5]);
          const DE = round(a * k);
          const ans = round(b * k);
          if (a === b) return { skip: true };
          return {
            q: `三角形 DEF は三角形 ABC の拡大図で、辺 AB と辺 DE、辺 BC と辺 EF が対応しています。AB ＝ ${a}cm、BC ＝ ${b}cm、DE ＝ ${DE}cm のとき、EF の長さは何cmですか。`,
            ans,
            unit: "cm",
            hint: "AB と DE から、何倍の拡大図かを求めよう。",
            steps: [`${DE} ÷ ${a} ＝ ${k} なので ${k}倍の拡大図`, `EF ＝ ${b} × ${k} ＝ ${ans}（cm）`],
          };
        }),
      ],
      3: [
        t("E6-kakudai-3a", (r) => {
          const N = pick(r, [500, 1000, 2000]);
          const a = r(2, 8);
          const b = r(2, 8);
          const A = (a * N) / 100;
          const B = (b * N) / 100;
          return {
            q: `縮尺 1 : ${N} の地図で、たて ${a}cm、横 ${b}cm の長方形の土地があります。この土地の実際の面積は何m² ですか。`,
            ans: A * B,
            unit: "m²",
            hint: "面積を先に求めるのではなく、たてと横の実際の長さを先に求めよう。",
            steps: [`実際のたて：${a} × ${N} ＝ ${a * N}cm ＝ ${A}m、横：${b} × ${N} ＝ ${b * N}cm ＝ ${B}m`, `${A} × ${B} ＝ ${A * B}（m²）`],
          };
        }),
        t("E6-kakudai-3b", (r) => {
          const h = r(1, 2);
          const s = pick(r, [0.5, 1.5, 2, 2.5, 3]);
          const k = r(2, 8);
          const S = round(s * k);
          const ans = round(h * k);
          return {
            q: `同じ時こくに、長さ ${h}m のぼうをまっすぐ立てると、かげの長さは ${s}m でした。このとき、かげの長さが ${S}m の木の高さは何m ですか。`,
            ans,
            unit: "m",
            hint: "ぼうとかげでできる三角形と、木とかげでできる三角形は、拡大図・縮図の関係になっているよ。",
            steps: [`木のかげはぼうのかげの ${S} ÷ ${s} ＝ ${k}（倍）`, `木の高さもぼうの ${k}倍で ${h} × ${k} ＝ ${ans}（m）`],
          };
        }),
        t("E6-kakudai-3c", (r) => {
          const N = pick(r, [10000, 20000, 25000, 50000]);
          const d = r(2, 12);
          const D = (d * N) / 100000;
          return {
            q: `ある地図で、実際の道のり ${D}km が ${d}cm で表されています。この地図の縮尺は 1 : □ です。□ にあてはまる数はいくつですか。`,
            ans: N,
            hint: "単位をそろえてから、実際の長さが地図上の長さの何倍かを考えよう。",
            steps: [`${D}km ＝ ${round(D * 100000)}cm`, `${round(D * 100000)} ÷ ${d} ＝ ${N}`, `縮尺は 1 : ${N}`],
          };
        }),
      ],
      4: [
        t("E6-kakudai-4a", (r) => {
          const k = r(2, 5);
          const big = r(0, 1) === 1;
          const ans = big ? `${k * k}倍` : `$\\frac{1}{${k * k}}$倍`;
          return {
            q: big
              ? `三角形を ${k}倍に拡大した図をかきました。拡大図の面積は、もとの三角形の面積の何倍ですか。`
              : `正方形の $\\frac{1}{${k}}$ の縮図をかきました。縮図の面積は、もとの正方形の面積の何倍ですか。`,
            ans,
            choices: big
              ? choices4(r, ans, [`${k}倍`, `${2 * k}倍`, `${k * k * k}倍`], (i) => `${k * k + i + 1}倍`)
              : choices4(r, ans, [`$\\frac{1}{${k}}$倍`, `$\\frac{1}{${2 * k}}$倍`, `$\\frac{1}{${k * k * k}}$倍`], (i) => `$\\frac{1}{${k * k + 2 * i + 2}}$倍`),
            hint: "底辺と高さ（たてと横）が、それぞれ何倍になるかを考えよう。",
            steps: big
              ? [`底辺も高さも ${k}倍になる`, `面積は ${k} × ${k} ＝ ${k * k}（倍）`]
              : [`1辺が $\\frac{1}{${k}}$ になる`, `面積は $\\frac{1}{${k}} \\times \\frac{1}{${k}} = \\frac{1}{${k * k}}$（倍）`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-taisho",
    grade: "E6",
    area: "geo",
    name: "対称な図形",
    desc: "線対称・点対称",
    prereqs: ["E5-kakudo"],
    points: [
      "1本の直線を折り目にして折ると、ぴったり重なる図形が線対称な図形。その直線を対称の軸というよ。",
      "1つの点のまわりに 180° 回すと、もとの図形にぴったり重なる図形が点対称な図形。その点を対称の中心というよ。",
      "線対称では、対応する点を結ぶ直線は対称の軸と垂直に交わる。点対称では、対応する点を結ぶ直線は対称の中心を通り、中心で半分に分けられるよ。",
    ],
    levels: {
      1: [
        t("E6-taisho-1a", (r) => {
          const n = r(3, 12);
          const name = n === 4 ? "正方形" : `正${["", "", "", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][n]}角形`;
          return {
            q: `${name}には、対称の軸が何本ありますか。`,
            ans: n,
            unit: "本",
            hint: "正多角形の対称の軸の数は、頂点の数と関係があるよ。",
            steps: [`正多角形の対称の軸は、頂点（辺）の数と同じだけある`, `${name}は ${n}本`],
          };
        }),
        t("E6-taisho-1b", (r) => {
          const pointOnly = ["平行四辺形"];
          const both = ["長方形", "ひし形", "正方形", "円", "正六角形"];
          const lineOnly = ["正三角形", "二等辺三角形", "正五角形", "等脚台形"];
          const wantPoint = r(0, 1) === 0;
          const ans = wantPoint ? pick(r, [...pointOnly, ...both]) : pick(r, lineOnly);
          const wrongs = wantPoint ? sample(r, [...lineOnly, "直角三角形"], 3) : [...pointOnly, ...sample(r, both, 2)];
          const choices = choices4(r, ans, wrongs);
          return {
            q: wantPoint ? `${choices.join("、")} のうち、点対称な図形はどれですか。` : `${choices.join("、")} のうち、線対称であるが、点対称ではない図形はどれですか。`,
            ans,
            choices,
            hint: "180° 回すと重なるか、折ると重なるかを、頭の中で動かして考えよう。",
            steps: [wantPoint ? `${ans}は、対称の中心のまわりに 180° 回すと重なる` : `${ans}は、折ると重なるが、180° 回しても重ならない`, `答え：${ans}`],
          };
        }),
        t("E6-taisho-1c", (r) => {
          const d = 2 * r(2, 12);
          return {
            q: `点対称な図形で、対応する2つの点 A と C を結ぶ直線の長さが ${d}cm です。点 A から対称の中心 O までの長さは何cmですか。`,
            ans: d / 2,
            unit: "cm",
            hint: "対応する点を結ぶ直線は、対称の中心を通り、中心で半分に分けられるよ。",
            steps: [`AO ＝ CO なので、${d} ÷ 2 ＝ ${d / 2}（cm）`],
          };
        }),
      ],
      2: [
        t("E6-taisho-2a", (r) => {
          const both = ["長方形", "ひし形", "正方形", "円", "正六角形"];
          const notBoth = ["平行四辺形", "正三角形", "二等辺三角形", "正五角形", "等脚台形"];
          const ans = pick(r, both);
          const choices = choices4(r, ans, sample(r, notBoth, 3));
          return {
            q: `${choices.join("、")} のうち、線対称でもあり、点対称でもある図形はどれですか。`,
            ans,
            choices,
            hint: "折って重なるか、180° 回して重なるか、両方を調べよう。",
            steps: [`${ans}は、折っても重なり、180° 回しても重なる`, "平行四辺形は点対称だけ、正三角形・二等辺三角形・正五角形・等脚台形は線対称だけ"],
          };
        }),
        t("E6-taisho-2b", (r) => {
          const d = 2 * r(2, 12);
          const a = r(30, 80);
          if (r(0, 1)) {
            return {
              q: `線対称な図形で、対応する2つの点 A と B を結ぶ直線が、対称の軸と点 M で交わっています。AB ＝ ${d}cm のとき、AM の長さは何cmですか。`,
              ans: d / 2,
              unit: "cm",
              hint: "対応する点を結ぶ直線は、対称の軸で半分に分けられるよ。",
              steps: [`AM ＝ BM なので ${d} ÷ 2 ＝ ${d / 2}（cm）`],
            };
          }
          const x = r(3, 12);
          return {
            q: `対角線 AC を対称の軸とする線対称な四角形 ABCD があります。角 B が ${a + 40}°、辺 AB が ${x}cm のとき、角 D は何度ですか。`,
            ans: a + 40,
            unit: "度",
            hint: "対称の軸 AC で折ると、点 B はどの点に重なるかな？",
            steps: ["AC で折ると、B は D に重なる（B と D が対応する点）", `対応する角は等しいので、角 D ＝ 角 B ＝ ${a + 40}°`, `（同じように、辺 AD ＝ 辺 AB ＝ ${x}cm）`],
          };
        }),
        t("E6-taisho-2c", (r) => {
          const names = { 3: "正三角形", 5: "正五角形", 6: "正六角形", 7: "正七角形", 8: "正八角形", 9: "正九角形", 10: "正十角形", 4: "正方形" };
          const want = r(0, 1) === 0;
          const evens = [4, 6, 8, 10];
          const odds = [3, 5, 7, 9];
          const ansN = pick(r, want ? evens : odds);
          const wr = sample(r, want ? odds : evens, 3);
          const choices = choices4(r, names[ansN], wr.map((n) => names[n]));
          return {
            q: `${choices.join("、")} のうち、点対称${want ? "である" : "ではない"}ものはどれですか。`,
            ans: names[ansN],
            choices,
            hint: "頂点の数が偶数か奇数かに注目しよう。",
            steps: ["頂点の数が偶数の正多角形は点対称、奇数の正多角形は点対称ではない", `答え：${names[ansN]}`],
          };
        }),
      ],
      3: [
        t("E6-taisho-3a", (r) => {
          const axes = { 正方形: 4, 長方形: 2, ひし形: 2, 正三角形: 3, 正五角形: 5, 正六角形: 6, 二等辺三角形: 1, 平行四辺形: 0, 正八角形: 8 };
          const keys = Object.keys(axes);
          let pickd = [];
          for (let g = 0; g < 50; g++) {
            pickd = sample(r, keys, 4);
            if (new Set(pickd.map((k) => axes[k])).size === 4) break;
          }
          if (new Set(pickd.map((k) => axes[k])).size !== 4) return { skip: true };
          const big = r(0, 1) === 1;
          const target = pickd.reduce((m, k) => (big ? (axes[k] > axes[m] ? k : m) : axes[k] < axes[m] ? k : m));
          return {
            q: `${pickd.join("、")} のうち、対称の軸の数がいちばん${big ? "多い" : "少ない"}図形はどれですか。`,
            ans: target,
            choices: shuffle(r, pickd),
            hint: "それぞれ、折って重なる折り目が何本あるか考えよう。",
            steps: [`対称の軸の数：${pickd.map((k) => `${k} ${axes[k]}本`).join("、")}`, `いちばん${big ? "多い" : "少ない"}のは ${target}`],
          };
        }),
        t("E6-taisho-3b", (r) => {
          const a = r(2, 9);
          const b = r(2, 9);
          const c = r(2, 9);
          return {
            q: `点対称な六角形 ABCDEF があります。辺 AB ＝ ${a}cm、辺 BC ＝ ${b}cm、辺 CD ＝ ${c}cm のとき、この六角形のまわりの長さは何cmですか。`,
            ans: 2 * (a + b + c),
            unit: "cm",
            hint: "点対称な六角形 ABCDEF では、AB と DE、BC と EF、CD と FA が対応するよ。",
            steps: [`対応する辺は等しいので DE ＝ ${a}、EF ＝ ${b}、FA ＝ ${c}`, `(${a} ＋ ${b} ＋ ${c}) × 2 ＝ ${2 * (a + b + c)}（cm）`],
          };
        }),
        t("E6-taisho-3c", (r) => {
          const pointSym = ["N", "S", "Z", "H", "X", "O", "I"];
          const notPoint = ["A", "B", "C", "D", "E", "K", "M", "T", "U", "V", "W", "Y", "F", "G", "J", "L", "P", "R"];
          const ans = pick(r, ["N", "S", "Z", "H", "X"]);
          const choices = choices4(r, ans, sample(r, notPoint.filter((c) => !pointSym.includes(c)), 3));
          return {
            q: `アルファベットの大文字 ${choices.join("、")} のうち、点対称なものはどれですか。（ゴシック体の文字で考えます）`,
            ans,
            choices,
            hint: "文字を 180° 回して、もとの形と同じになるか考えよう。",
            steps: [`${ans} は 180° 回すと、もとの形と重なる`, "A・M・T・U などは線対称だけれど、点対称ではない"],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-baai",
    grade: "E6",
    area: "data",
    name: "場合の数",
    desc: "並べ方・組み合わせ",
    prereqs: ["E2-kuku"],
    points: [
      "並べ方や組み合わせは、図（樹形図）や表をかいて、落ちや重なりがないように調べよう。",
      "並べ方は「1番目が □ 通り、そのそれぞれに2番目が △ 通り…」とかけ算で数えられるよ。",
      "組み合わせは順番を考えない。「AとB」と「BとA」は同じ1通りだから、並べ方より少なくなるよ。",
    ],
    levels: {
      1: [
        t("E6-baai-1a", (r) => {
          const n = r(3, 5);
          const f = [1, 1, 2, 6, 24, 120][n];
          const who = sample(r, ["A", "B", "C", "D", "E"], n).sort();
          return {
            q: `${who.join("、")} の${n}人が、1列にならびます。ならび方は全部で何通りありますか。`,
            ans: f,
            unit: "通り",
            hint: "1番目は何通り？ そのそれぞれに、2番目は何通り？",
            steps: [`1番目は ${n}通り、2番目は ${n - 1}通り、…`, `${Array.from({ length: n }, (_, i) => n - i).join(" × ")} ＝ ${f}（通り）`],
          };
        }),
        t("E6-baai-1b", (r) => {
          const n = r(4, 8);
          const ans = (n * (n - 1)) / 2;
          return {
            q: `${n}チームで、どのチームとも1回ずつ試合をします。試合は全部で何試合になりますか。`,
            ans,
            unit: "試合",
            hint: "表にかいて考えよう。「AとB」と「BとA」は同じ試合だよ。",
            steps: [`1つのチームは ${n - 1}試合する。${n} × ${n - 1} ＝ ${n * (n - 1)}`, `同じ試合を2回数えているので ${n * (n - 1)} ÷ 2 ＝ ${ans}（試合）`],
          };
        }),
        t("E6-baai-1c", (r) => {
          const n = r(2, 4);
          const ans = 2 ** n;
          return {
            q: `1まいのコインを ${n}回続けて投げます。表と裏の出方は、全部で何通りありますか。`,
            ans,
            unit: "通り",
            hint: "1回ごとに、表と裏の2通りずつあるね。",
            steps: [`${Array(n).fill(2).join(" × ")} ＝ ${ans}（通り）`],
          };
        }),
      ],
      2: [
        t("E6-baai-2a", (r) => {
          const n = r(4, 8);
          return {
            q: `${n}人の中から、委員長と副委員長を1人ずつ選びます。選び方は全部で何通りありますか。`,
            ans: n * (n - 1),
            unit: "通り",
            hint: "委員長と副委員長は役わりがちがうので、順番を考えるよ。",
            steps: [`委員長は ${n}通り、そのそれぞれに副委員長は ${n - 1}通り`, `${n} × ${n - 1} ＝ ${n * (n - 1)}（通り）`],
          };
        }),
        t("E6-baai-2b", (r) => {
          const n = r(4, 7);
          const ans = (n * (n - 1)) / 2;
          return {
            q: `${n}種類のくだものの中から、ちがう2種類を選んでかごに入れます。選び方は全部で何通りありますか。`,
            ans,
            choices: numChoices(r, ans, [n * (n - 1), n * 2, ans + n]),
            hint: "選んだ2種類の順番は関係ないね。",
            steps: [`順番を考えると ${n} × ${n - 1} ＝ ${n * (n - 1)}通り`, `「AとB」と「BとA」は同じなので ${n * (n - 1)} ÷ 2 ＝ ${ans}（通り）`],
          };
        }),
        t("E6-baai-2c", (r) => {
          const zero = r(0, 1) === 1;
          const ds = (zero ? [0] : []).concat(sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9], zero ? 3 : 4)).sort((a, b) => a - b);
          let cnt = 0;
          for (const a of ds) for (const b of ds) for (const c of ds) if (a !== 0 && a !== b && b !== c && a !== c) cnt++;
          return {
            q: `${ds.join("、")} の4まいのカードから3まいを選んでならべ、3けたの整数をつくります。整数は全部で何こできますか。`,
            ans: cnt,
            unit: "こ",
            hint: zero ? "百の位に 0 はおけないことに注意しよう。" : "百の位、十の位、一の位の順に、何通りずつあるか考えよう。",
            steps: zero ? ["百の位は 0 以外の 3通り", "十の位は のこり3まいから 3通り、一の位は 2通り", `3 × 3 × 2 ＝ ${cnt}（こ）`] : ["百の位は 4通り、十の位は 3通り、一の位は 2通り", `4 × 3 × 2 ＝ ${cnt}（こ）`],
          };
        }),
      ],
      3: [
        t("E6-baai-3a", (r) => {
          const n = r(4, 7);
          const ans = (n * (n - 1) * (n - 2)) / 6;
          return {
            q: `${n}種類のアイスクリームの中から、ちがう3種類を選びます。選び方は全部で何通りありますか。`,
            ans,
            unit: "通り",
            hint: "順番を考えた数を出してから、同じ組み合わせが何回ずつ出てくるか考えよう。",
            steps: [`順番を考えると ${n} × ${n - 1} × ${n - 2} ＝ ${n * (n - 1) * (n - 2)}通り`, `同じ3種類のならび方は 3 × 2 × 1 ＝ 6通りずつある`, `${n * (n - 1) * (n - 2)} ÷ 6 ＝ ${ans}（通り）`],
          };
        }),
        t("E6-baai-3b", (r) => {
          const zero = r(0, 1) === 1;
          const ds = (zero ? [0] : []).concat(sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9], zero ? 3 : 4)).sort((a, b) => a - b);
          const even = r(0, 1) === 1;
          const list = [];
          for (const a of ds) for (const b of ds) if (a !== 0 && a !== b && (b % 2 === 0) === even) list.push(10 * a + b);
          if (list.length === 0) return { skip: true };
          return {
            q: `${ds.join("、")} の4まいのカードから2まいを選んでならべ、2けたの整数をつくります。${even ? "偶数" : "奇数"}は全部で何こできますか。`,
            ans: list.length,
            unit: "こ",
            hint: `一の位が${even ? "偶数" : "奇数"}になるカードを先に決めよう。${zero ? "十の位に 0 はおけないよ。" : ""}`,
            steps: [`一の位が${even ? "偶数（0, 2, 4, 6, 8）" : "奇数（1, 3, 5, 7, 9）"}のものを書き出す`, `${list.join("、")}`, `全部で ${list.length}こ`],
          };
        }),
        t("E6-baai-3c", (r) => {
          const n = r(3, 5);
          const ans = n * (n - 1) * (n - 1);
          return {
            q: `横に1列にならんだ3つの部分 A、B、C を、${n}色の絵の具でぬり分けます。となりあう部分（AとB、BとC）は、ちがう色にします。同じ色を何回使ってもよいとき、ぬり方は全部で何通りありますか。`,
            ans,
            unit: "通り",
            hint: "A → B → C の順に、何色ずつ使えるか考えよう。A と C は同じ色でもいいよ。",
            steps: [`A は ${n}通り、B は A とちがう色で ${n - 1}通り`, `C は B とちがう色で ${n - 1}通り（A と同じ色でもよい）`, `${n} × ${n - 1} × ${n - 1} ＝ ${ans}（通り）`],
          };
        }),
      ],
      4: [
        t("E6-baai-4a", (r) => {
          const kinds = sample(r, [1, 5, 10, 50, 100, 500], 3).sort((a, b) => a - b);
          const cnt = kinds.map(() => r(1, 2));
          const sums = new Set();
          for (let i = 0; i <= cnt[0]; i++) for (let j = 0; j <= cnt[1]; j++) for (let k = 0; k <= cnt[2]; k++) {
            const s = i * kinds[0] + j * kinds[1] + k * kinds[2];
            if (s > 0) sums.add(s);
          }
          const desc = kinds.map((k, i) => `${k}円玉が${cnt[i]}まい`).join("、");
          return {
            q: `${desc}あります。これらの一部または全部を使って、おつりのないようにはらえる金額は、何通りありますか。`,
            ans: sums.size,
            unit: "通り",
            hint: "それぞれの硬貨を何まい使うか（0まいもふくめて）の組み合わせを考えよう。同じ金額にならないか注意。",
            steps: [`使うまい数の組み合わせは ${cnt.map((c) => c + 1).join(" × ")} ＝ ${cnt.reduce((a, c) => a * (c + 1), 1)}通り（全部0まいもふくむ）`, `全部0まいの1通りをのぞき、同じ金額になるものを1つにまとめる`, `${[...sums].sort((a, b) => a - b).join("、")} 円の ${sums.size}通り`],
          };
        }),
        t("E6-baai-4b", (r) => {
          const ds = [0].concat(sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9], 4)).sort((a, b) => a - b);
          const m = pick(r, [3, 4]);
          const list = [];
          for (const a of ds) for (const b of ds) for (const c of ds) {
            if (a === 0 || a === b || b === c || a === c) continue;
            const v = 100 * a + 10 * b + c;
            if (v % m === 0) list.push(v);
          }
          if (list.length === 0) return { skip: true };
          return {
            q: `${ds.join("、")} の5まいのカードから3まいを選んでならべ、3けたの整数をつくります。${m} の倍数は全部で何こできますか。`,
            ans: list.length,
            unit: "こ",
            hint: m === 3 ? "各位の数字の和が 3 の倍数になると、その数は 3 の倍数だよ。" : "下2けたが 4 の倍数（00 をふくむ）になると、その数は 4 の倍数だよ。",
            steps: m === 3
              ? ["数字の和が 3 の倍数になる3まいの組を見つけて、それぞれのならべ方を数える（百の位に 0 はおけない）", `${list.length <= 16 ? list.join("、") : list.slice(0, 16).join("、") + "、…"}`, `全部で ${list.length}こ`]
              : ["下2けたが 4 の倍数になる組を見つけて、百の位をのこりのカードから選ぶ（0 はおけない）", `${list.length <= 16 ? list.join("、") : list.slice(0, 16).join("、") + "、…"}`, `全部で ${list.length}こ`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E6-data",
    grade: "E6",
    area: "data",
    name: "データの調べ方",
    desc: "平均値・中央値・最頻値",
    prereqs: ["E5-heikin"],
    points: [
      "平均値 ＝ データの合計 ÷ データの個数。",
      "中央値は、データを大きさの順にならべたときの真ん中の値。個数が偶数なら、真ん中の2つの平均だよ。",
      "最頻値は、データの中でいちばん多く出てくる値。度数分布表やヒストグラムで、ちらばりのようすも調べよう。",
    ],
    levels: {
      1: [
        t("E6-data-1a", (r) => {
          const n = pick(r, [5, 6, 8]);
          const m = r(4, 12);
          const dev = Array.from({ length: n - 1 }, () => r(-4, 4));
          const last = -dev.reduce((a, b) => a + b, 0);
          if (Math.abs(last) > 5) return { skip: true };
          const xs = [...dev, last].map((d) => m + d);
          if (xs.some((x) => x < 0)) return { skip: true };
          return {
            q: `${n}人が、1か月に読んだ本のさっ数は ${xs.join("、")}（さつ）でした。平均値は何さつですか。`,
            ans: m,
            unit: "さつ",
            hint: "平均値 ＝ 合計 ÷ 個数",
            steps: [`合計：${xs.join(" ＋ ")} ＝ ${m * n}`, `${m * n} ÷ ${n} ＝ ${m}（さつ）`],
          };
        }),
        t("E6-data-1b", (r) => {
          const n = pick(r, [5, 7, 9]);
          const xs = Array.from({ length: n }, () => r(10, 40));
          const s = [...xs].sort((a, b) => a - b);
          const med = s[(n - 1) / 2];
          return {
            q: `ソフトボール投げの記録（m）は ${xs.join("、")} でした。中央値は何m ですか。`,
            ans: med,
            unit: "m",
            hint: "まず、小さい順にならべかえよう。",
            steps: [`小さい順に：${s.join("、")}`, `${n}こなので、真ん中は ${(n + 1) / 2}番目の ${med}（m）`],
          };
        }),
        t("E6-data-1c", (r) => {
          const vals = sample(r, [3, 4, 5, 6, 7, 8, 9, 10], 5);
          const mode = vals[0];
          const xs = [mode, mode, mode, vals[1], vals[1], vals[2], vals[3], vals[4]];
          const shown = shuffle(r, xs);
          return {
            q: `あるクラスの8人の小テストの点数（10点満点）は ${shown.join("、")}（点）でした。最頻値は何点ですか。`,
            ans: mode,
            unit: "点",
            hint: "いちばん多く出てくる値をさがそう。",
            steps: [`${mode}点が3人でいちばん多い`, `最頻値は ${mode}点`],
          };
        }),
      ],
      2: [
        t("E6-data-2a", (r) => {
          const n = pick(r, [6, 8, 10]);
          const xs = Array.from({ length: n }, () => r(20, 60));
          const s = [...xs].sort((a, b) => a - b);
          const med = median(xs);
          return {
            q: `${n}人の反復横とびの回数は ${xs.join("、")}（回）でした。中央値は何回ですか。`,
            ans: med,
            unit: "回",
            hint: "個数が偶数のときは、真ん中の2つの平均が中央値だよ。",
            steps: [`小さい順に：${s.join("、")}`, `真ん中の2つは ${s[n / 2 - 1]} と ${s[n / 2]}`, `(${s[n / 2 - 1]} ＋ ${s[n / 2]}) ÷ 2 ＝ ${med}（回）`],
          };
        }),
        t("E6-data-2b", (r) => {
          const lo = pick(r, [10, 15, 20]);
          const w = 5;
          const cs = Array.from({ length: 5 }, () => r(1, 9));
          const labels = cs.map((_, i) => `${lo + w * i}m以上${lo + w * (i + 1)}m未満 ${cs[i]}人`);
          const k = r(1, 4);
          const B = lo + w * k;
          const above = r(0, 1) === 1;
          const ans = above ? cs.slice(k).reduce((a, b) => a + b, 0) : cs.slice(0, k).reduce((a, b) => a + b, 0);
          return {
            q: `ソフトボール投げの記録を度数分布表にまとめました。${labels.join("、")}。記録が ${B}m ${above ? "以上" : "未満"}の人は何人ですか。`,
            ans,
            unit: "人",
            hint: `「以上」はその数をふくみ、「未満」はその数をふくまないよ。${B}m がどの階級に入るか考えよう。`,
            steps: [`${B}m ${above ? "以上" : "未満"}の階級は ${above ? labels.slice(k).map((s) => s.split(" ")[0]).join("、") : labels.slice(0, k).map((s) => s.split(" ")[0]).join("、")}`, (above ? cs.slice(k) : cs.slice(0, k)).length > 1 ? `${(above ? cs.slice(k) : cs.slice(0, k)).join(" ＋ ")} ＝ ${ans}（人）` : `${ans}人`],
          };
        }),
        t("E6-data-2c", (r) => {
          for (let g = 0; g < 80; g++) {
            const mode = r(2, 8);
            const xs = [mode, mode, mode, ...Array.from({ length: 4 }, () => r(0, 10))];
            const cnt = {};
            xs.forEach((x) => (cnt[x] = (cnt[x] || 0) + 1));
            if (Object.entries(cnt).some(([v, c]) => Number(v) !== mode && c >= 3)) continue;
            const mean = round(xs.reduce((a, b) => a + b, 0) / xs.length, 4);
            const med = median(xs);
            if (!Number.isInteger(mean * 7) || mean === med || mean === mode || med === mode) continue;
            const sum = xs.reduce((a, b) => a + b, 0);
            if (sum % 7 !== 0) continue;
            const vals = { 平均値: sum / 7, 中央値: med, 最頻値: mode };
            const big = r(0, 1) === 1;
            const ans = Object.keys(vals).reduce((m, k) => (big ? (vals[k] > vals[m] ? k : m) : vals[k] < vals[m] ? k : m));
            const shown = shuffle(r, xs);
            return {
              q: `7人のゲームの得点は ${shown.join("、")}（点）でした。平均値・中央値・最頻値のうち、いちばん${big ? "大きい" : "小さい"}ものはどれですか。`,
              ans,
              choices: shuffle(r, ["平均値", "中央値", "最頻値"]),
              hint: "3つの代表値をそれぞれ求めて、くらべよう。",
              steps: [`小さい順に：${[...xs].sort((a, b) => a - b).join("、")}`, `平均値 ${sum} ÷ 7 ＝ ${sum / 7}、中央値 ${med}、最頻値 ${mode}`, `いちばん${big ? "大きい" : "小さい"}のは ${ans}`],
            };
          }
          return { skip: true };
        }),
      ],
      3: [
        t("E6-data-3a", (r) => {
          const n = r(4, 6);
          const m = r(60, 85);
          const xs = Array.from({ length: n - 1 }, () => r(m - 15, m + 15));
          const x = m * n - xs.reduce((a, b) => a + b, 0);
          if (x < 0 || x > 100) return { skip: true };
          return {
            q: `${n}回のテストのうち、${n - 1}回の点数は ${xs.join("、")}（点）でした。${n}回の平均点を ${m}点にするには、のこりの1回で何点とればよいですか。`,
            ans: x,
            unit: "点",
            hint: "平均点から、" + n + "回の合計点を求めよう。",
            steps: [`${n}回の合計は ${m} × ${n} ＝ ${m * n}（点）`, `${n - 1}回の合計は ${xs.reduce((a, b) => a + b, 0)}（点）`, `${m * n} − ${xs.reduce((a, b) => a + b, 0)} ＝ ${x}（点）`],
          };
        }),
        t("E6-data-3b", (r) => {
          const lo = pick(r, [10, 15, 20]);
          const w = 5;
          const cs = Array.from({ length: 5 }, () => r(2, 8));
          const total = cs.reduce((a, b) => a + b, 0);
          const labs = cs.map((_, i) => `${lo + w * i}m以上${lo + w * (i + 1)}m未満`);
          const k = r(1, total);
          let acc = 0;
          let idx = 0;
          for (let i = 4; i >= 0; i--) {
            acc += cs[i];
            if (acc >= k) {
              idx = i;
              break;
            }
          }
          const ans = labs[idx];
          return {
            q: `${total}人のソフトボール投げの記録を度数分布表にまとめました。${labs.map((l, i) => `${l} ${cs[i]}人`).join("、")}。記録のよいほう（長いほう）から数えて ${k}番目の人は、どの階級に入っていますか。`,
            ans,
            choices: choices4(r, ans, sample(r, labs.filter((l) => l !== ans), 3)),
            hint: "記録の長い階級から、人数を順にたしていこう。",
            steps: [`長い階級から人数をたしていくと ${cs.slice().reverse().reduce((a, c) => [...a, (a[a.length - 1] || 0) + c], []).join(" → ")}`, `${k}番目の人は ${ans} の階級`],
          };
        }),
        t("E6-data-3c", (r) => {
          const total = pick(r, [20, 25, 40, 50]);
          let cs;
          for (let g = 0; g < 50; g++) {
            cs = Array.from({ length: 4 }, () => r(1, Math.floor(total / 3)));
            const last = total - cs.reduce((a, b) => a + b, 0);
            if (last >= 1 && last <= total / 2) {
              cs.push(last);
              break;
            }
            cs = null;
          }
          if (!cs) return { skip: true };
          const lo = 20;
          const w = 5;
          const labs = cs.map((_, i) => `${lo + w * i}m以上${lo + w * (i + 1)}m未満`);
          const k = r(2, 4);
          const part = cs.slice(k).reduce((a, b) => a + b, 0);
          const pct = round((part / total) * 100);
          return {
            q: `${total}人のソフトボール投げの記録は、${labs.map((l, i) => `${l} ${cs[i]}人`).join("、")} でした。記録が ${lo + w * k}m 以上の人は、全体の何％ですか。`,
            ans: pct,
            unit: "％",
            hint: "まず、" + (lo + w * k) + "m 以上の人数を求めて、全体の人数でわろう。",
            steps: [`${lo + w * k}m 以上の人数：${cs.slice(k).length > 1 ? `${cs.slice(k).join(" ＋ ")} ＝ ` : ""}${part}（人）`, `${part} ÷ ${total} ＝ ${round(part / total)}`, `${pct}％`],
          };
        }),
      ],
    },
  },
];
