// ============================================================
// shiki-07.js — 式の計算 第7時「連続する整数の和のきまりを見つけて、文字で説明しよう」
//   ikkan の演習プリント（shiki-07.dr.1〜10）・小テスト（shiki-07.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「07」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：07d03 ＝ shiki-07.dr.3
//   「説明しよう」の問題は、書けないので、説明の中の1つの段階（文字でおく・式を変形する・式を読む）を、
//   数で聞く（□ に入る数・整数の値）か、4択（式を選ぶ・正しい説明を選ぶ）にして移した。
//   整数の値や式の係数は、すべて計算で出す（手で書かない）。4択の誤答は、ありがちなまちがいで、正解と同じ数・式にならないものだけ。
// ============================================================
import { t, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("shiki");

// ── 小さな道具 ────────────────────────────────────────────
const $ = (s) => `$${s}$`;
const retry = (f, n = 500) => { for (let i = 0; i < n; i++) { const x = f(); if (x) return x; } return null; };
/** n を使った式の TeX："n"、"n+2"、"n-3" */
const off = (o) => (o === 0 ? "n" : o > 0 ? `n+${o}` : `n-${-o}`);
const offList = (os) => os.map(off).join(",\\ ");
/** 4択（式の TeX）：正解 right と、まちがい wrongs（同じ式・正解と同じものは除く） */
const mk4 = (r, right, wrongs) => {
  const ws = shuffle(r, [...new Set(wrongs)].filter((w) => w !== right));
  if (ws.length < 3) throw new Error(`誤答が足りない: ${right}`);
  return choices4(r, $(right), ws.map($));
};
/** 4択（文章）：正解と、まちがいの文 */
const mkText4 = (r, right, wrongs) => {
  const ws = shuffle(r, [...new Set(wrongs)].filter((w) => w !== right));
  if (ws.length < 3) throw new Error("誤答が足りない");
  return choices4(r, right, ws.slice(0, 3));
};
/** a n + b の TeX */
const lin = (a, b) => `${a === 1 ? "" : a}n${b > 0 ? `+${b}` : b < 0 ? `-${-b}` : ""}`;
/** 連続する k つの整数・偶数・奇数・3の倍数。まん中 mid（k が奇数のとき）か、いちばん小さい数 lo をもとにならべる */
const seq = (k, lo, step) => Array.from({ length: k }, (_, i) => lo + i * step);
const KINDS = [{ name: "整数", step: 1 }, { name: "偶数", step: 2 }, { name: "奇数", step: 2 }, { name: "3の倍数", step: 3 }];
/** その種類の数になる値（偶数なら偶数、奇数なら奇数、3の倍数なら 3の倍数）をひとつ選ぶ */
const fitKind = (kind, x) => (kind.name === "偶数" ? x * 2 : kind.name === "奇数" ? x * 2 + 1 : kind.name === "3の倍数" ? x * 3 : x);
/** k つの数のうち、小さいほうから i 番目（0 から）の数の呼び名 */
const kuraiText = (k, i) => (i === 0 ? "もっとも小さい数" : i === k - 1 ? "もっとも大きい数" : k % 2 && i === (k - 1) / 2 ? "まん中の数" : i < (k - 1) / 2 ? `小さいほうから ${i + 1}番目の数` : `大きいほうから ${k - i}番目の数`);

// ── n を使って表す（07d01a〜e、07q01a〜c） ─────────────────────
/** n より k 大きい／小さい整数 */
const moreLessQ = (r, which) => {
  const k = r(2, 9), plus = which ? which === "plus" : r(0, 1) === 1;
  const right = plus ? `n+${k}` : `n-${k}`;
  return {
    q: `n を整数とする。n より ${k} ${plus ? "大きい" : "小さい"}整数を、n を使って表すと、どれか。`,
    ans: $(right),
    choices: mk4(r, right, plus ? [`n-${k}`, `${k}n`, `${k}-n`, `\\frac{n}{${k}}`] : [`n+${k}`, `${k}n`, `${k}-n`, `\\frac{n}{${k}}`]),
    hint: `n より ${plus ? "大きい" : "小さい"}数は、n にどんな計算をした数かな。`,
    steps: [`n より ${k} ${plus ? "大きい" : "小さい"}数は、n ${plus ? "に" : "から"} ${k} を${plus ? "たした" : "ひいた"}数。`, `$${right}$ と表される。`],
  };
};
/** k の倍数 */
const multipleQ = (r) => {
  const k = r(3, 9), right = `${k}n`;
  return {
    q: `n を整数とする。${k}の倍数を、n を使って表すと、どれか。`,
    ans: $(right),
    choices: mk4(r, right, [`n+${k}`, `${k}n+1`, `n-${k}`, `\\frac{n}{${k}}`]),   // k(n+1) などは、やはり k の倍数になるので、誤答に入れない
    hint: `${k}の倍数は、${k} に どんな数をかけた数かな。`,
    steps: [`${k}の倍数は、${k} に整数をかけた数。`, `整数を n とすると、$${right}$ と表される。`],
  };
};
/** n の次の整数・前の整数 */
const nextPrevQ = (r) => {
  const next = r(0, 1) === 1, right = next ? "n+1" : "n-1";
  return {
    q: `n を整数とする。n の${next ? "次" : "前"}の整数を、n を使って表すと、どれか。`,
    ans: $(right),
    choices: mk4(r, right, next ? ["n-1", "2n", "n^{2}", "n+2"] : ["n+1", "2n", "\\frac{n}{2}", "n-2"]),
    hint: `n の${next ? "次" : "前"}の整数は、n といくつちがうかな。`,
    steps: [`n の${next ? "次" : "前"}の整数は、n に 1 を${next ? "たした" : "ひいた"}数。`, `$${right}$ と表される。`],
  };
};
/** n の次の整数の k倍（前の整数の k倍） */
const nextTimesQ = (r) => {
  const k = r(2, 9), next = r(0, 1) === 1, right = next ? `${k}(n+1)` : `${k}(n-1)`;
  return {
    q: `n を整数とする。n の${next ? "次" : "前"}の整数の ${k}倍を、n を使って表すと、どれか。`,
    ans: $(right),
    choices: mk4(r, right, next ? [`${k}n+1`, `${k}n`, `${k}(n-1)`, `n+${k}`] : [`${k}n-1`, `${k}n`, `${k}(n+1)`, `n-${k}`]),
    hint: `n の${next ? "次" : "前"}の整数は、n でどう表すかな。それを何倍するのかな。`,
    steps: [`n の${next ? "次" : "前"}の整数は $${next ? "n+1" : "n-1"}$。`, `その ${k}倍は、かっこをつけて $${right}$。`],
  };
};
/** k でわると r 余る整数 */
const remainderQ = (r) => {
  const k = r(3, 7), rem = r(1, k - 1), right = `${k}n+${rem}`;
  const others = [];
  for (let x = 0; x < k; x++) if (x !== rem) others.push(x === 0 ? `${k}n` : `${k}n+${x}`);
  return {
    q: `n を整数とする。${k}でわると ${rem} 余る整数を、n を使って表すと、どれか。`,
    ans: $(right),
    choices: mk4(r, right, [...shuffle(r, others).slice(0, 2), `n+${rem}`, `${rem}n+${k}`]),
    hint: `わり算の関係「わられる数＝わる数×商＋余り」を思い出そう。商を n とおく。`,
    steps: [`${k}でわると ${rem} 余る数は、（${k}×商）＋${rem}。`, `商を n とすると、$${right}$ と表される。`],
  };
};
/** 連続する k つの整数のうち、もっとも大きい（小さい・まん中の）整数が n のとき、k つの整数 */
const listQ = (r) => {
  const k = pick(r, [3, 4, 5]);
  const roles = k % 2 ? ["大きい", "小さい", "まん中の"] : ["大きい", "小さい"];
  const role = pick(r, roles);
  const sets = { 大きい: seq(k, -(k - 1), 1), 小さい: seq(k, 0, 1) };
  if (k % 2) sets["まん中の"] = seq(k, -(k - 1) / 2, 1);
  const right = offList(sets[role]);
  const wrongs = [];
  for (const lo of [-(k), -(k - 1) + 1, -1, 1, -(k - 1) + 2, -(k - 1) + 3]) wrongs.push(offList(seq(k, lo, 1)));
  for (const kk of Object.keys(sets)) if (kk !== role) wrongs.push(offList(sets[kk]));
  const roleText = role === "まん中の" ? "まん中の" : `もっとも${role}`;
  return {
    q: `n を整数とする。連続する${k}つの整数のうち、${roleText}整数が n のとき、${k}つの整数を小さい順に、n を使って表すと、どれか。`,
    ans: $(right),
    choices: mk4(r, right, wrongs),
    hint: "となり合う整数は 1ちがう。n が何番目の数かを考えて、前後の数を n で表そう。",
    steps: [`${roleText}整数が n だから、${role === "大きい" ? "それより小さい数を順に n−1、n−2、… と表す" : role === "小さい" ? "それより大きい数を順に n+1、n+2、… と表す" : "前の数を n−1、n−2、…、後ろの数を n+1、n+2、… と表す"}。`, `小さい順に、$${right}$。`],
  };
};

export const UNITS = [
  unit("07", {
    name: "連続する整数の和と、文字による説明",
    desc: "整数を n で表し、文字でおく → 式を変形する → 式を読む、の順に説明する",
    prereqs: ["J2-sk06"],
    points: [
      "n を整数とすると、n の次の整数は $n+1$、前の整数は $n-1$、$k$ の倍数は $kn$ と表せる。",
      "連続する3つの整数は、まん中の整数を $n$ として $n-1,\\ n,\\ n+1$、いちばん小さい整数を $n$ として $n,\\ n+1,\\ n+2$ と表せる。",
      "「いつでも成り立つ」ことは、文字でおく → 式を変形する → 式を読む（「…は整数だから、…の倍数である」）の順に説明する。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 07d01a n より 2 大きい整数・n より 3 小さい整数
        t("07d01a", (r) => moreLessQ(r)),
        // 07d01b 7の倍数
        t("07d01b", (r) => multipleQ(r)),
        // 07d01c n の次の整数の 4倍
        t("07d01c", (r) => nextTimesQ(r)),
        // 07d01d 3でわると 1 余る整数
        t("07d01d", (r) => remainderQ(r)),
        // 07d01e 連続する3つの整数のうち、もっとも大きい整数が n のとき、3つの整数
        t("07d01e", (r) => listQ(r)),
        // 07q01a 小テスト（1）① 5の倍数
        t("07q01a", (r) => multipleQ(r)),
        // 07q01b 小テスト（1）② n の次の整数
        t("07q01b", (r) => nextPrevQ(r)),
        // 07q01c 小テスト（1）③ n より 4 小さい整数
        t("07q01c", (r) => moreLessQ(r, "minus")),
        // 07d02 空欄をうめる説明：「まん中の整数を n とすると、小さい数は n−1、大きい数は n+1 …」
        t("07d02", (r) => {
          const m = r(1, 4), k = 2 * m + 1, kind = r(0, 2);
          if (kind === 0) {
            return {
              q: `連続する${k}つの整数のまん中の整数を $n$ とすると、もっとも小さい整数は $n-\\square$、もっとも大きい整数は $n+\\square$ と表される。同じ数が入る □ に入る数は？`,
              ans: m,
              hint: "まん中から、いちばん小さい数（大きい数）まで、いくつ離れているかな。",
              steps: [`${k}つの整数は、まん中の n から、前に ${m}つ、後ろに ${m}つならぶ。`, `いちばん小さい数は $n-${m}$、いちばん大きい数は $n+${m}$。`],
            };
          }
          if (kind === 1) {
            return {
              q: `連続する${k}つの整数について、まん中の整数を $n$ とすると、もっとも小さい整数は $n-${m}$、もっとも大きい整数は $n+${m}$ と表される。この2つの和は $(n-${m})+(n+${m})=\\square n$ となる。□ に入る数は？`,
              ans: 2,
              hint: `−${m} と +${m} は、たすとどうなるかな。n は何個あるかな。`,
              steps: [`$(n-${m})+(n+${m}) = n+n-${m}+${m}$`, `$= 2n$ となる。`],
            };
          }
          return {
            q: `連続する${k}つの整数の和は、まん中の整数を $n$ とすると、$\\square n$ と表される。したがって、まん中の整数の □ 倍になる。□ に入る数は？`,
            ans: k,
            hint: `文字でおいた ${k}つの整数をたすと、n が何個になるかな。`,
            steps: [`${k}つの整数は ${seq(k, -m, 1).map(off).map((s) => `$${s}$`).join("、")}。`, `和は $${seq(k, -m, 1).map(off).join("+")} = ${k}n$ だから、まん中の整数の ${k}倍。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 07d03 連続する3つの整数の和が 93 になった。この3つの整数を求めよう。
        t("07d03", (r) => {
          const m = r(8, 70), S = 3 * m, i = pick(r, [0, 2, 2, 0, 1]);
          const ns = seq(3, m - 1, 1), ans = ns[i];
          return {
            q: `連続する3つの整数の和が ${S} になった。この3つの整数のうち、${kuraiText(3, i)}は？`,
            ans,
            hint: "まん中の整数を n とおいて、3つの整数の和を n の式で表そう。",
            steps: ["まん中の整数を $n$ とすると、3つの整数は $n-1,\\ n,\\ n+1$。", `和は $3n = ${S}$ より、$n = ${m}$。3つの整数は ${ns.join("、")}。`, `${kuraiText(3, i)}は ${ans}。`],
          };
        }),
        // 07d04a 連続する整数の和を、もっとも小さい整数を n として式で表す（4択）
        t("07d04a", (r) => {
          const k = pick(r, [3, 5, 7]), c = (k * (k - 1)) / 2, role = pick(r, ["小さい", "小さい", "大きい", "まん中の"]);
          const sumOffs = role === "小さい" ? c : role === "大きい" ? -c : 0;
          const right = lin(k, sumOffs);
          const roleText = role === "まん中の" ? "まん中の" : `もっとも${role}`;
          // ありがちなまちがい：数の項の合計をまちがえる・n の係数をまちがえる・数の項を忘れる
          const wrongs = [lin(k, sumOffs + k), lin(k, sumOffs - k), lin(k, sumOffs + 1), lin(k, sumOffs - 1), lin(k, c), lin(k, -c), lin(k, 0), lin(k + 1, sumOffs), lin(1, sumOffs)];
          const list = role === "小さい" ? seq(k, 0, 1) : role === "大きい" ? seq(k, -(k - 1), 1) : seq(k, -(k - 1) / 2, 1);
          return {
            q: `連続する${k}つの整数のうち、${roleText}整数を $n$ とする。${k}つの整数の和を、n を使った式で表して整理すると、どれか。`,
            ans: $(right),
            choices: mk4(r, right, wrongs),
            hint: `まず、${k}つの整数を n で表そう。そのあと、n の項と数の項を、それぞれまとめる。`,
            steps: [`${k}つの整数は $${offList(list)}$。`, `和は $${list.map(off).join("+")} = ${right}$。`],
          };
        }),
        // 07d04b 和 5n+10 を 5(n+□) の形に変形する
        t("07d04b", (r) => {
          const k = pick(r, [3, 5, 7, 9]), h = (k - 1) / 2, small = r(0, 1) === 0;
          const c = k * h;
          return {
            q: `連続する${k}つの整数のうち、もっとも${small ? "小さい" : "大きい"}整数を $n$ とすると、${k}つの整数の和は $${k}n${small ? "+" : "-"}${c}$ と表される。この和は、$${k}(n${small ? "+" : "-"}\\square)$ と変形できる。□ に入る数は？`,
            ans: h,
            hint: `${c} は ${k} の何倍かな。共通の因数 ${k} をくくり出そう。`,
            steps: [`$${k}n${small ? "+" : "-"}${c} = ${k} \\times n ${small ? "+" : "-"} ${k} \\times ${h}$`, `$= ${k}(n${small ? "+" : "-"}${h})$。`],
          };
        }),
        // 07d04c 和を 5(n+2) と変形したとき、式を読んで言えることを選ぶ（4択）
        t("07d04c", (r) => {
          const k = pick(r, [3, 5, 7]), h = (k - 1) / 2, plus = r(0, 1) === 0;
          const e = `${k}(n${plus ? "+" : "-"}${h})`, inner = `n${plus ? "+" : "-"}${h}`;
          const right = `${$(inner)} は整数だから、${$(e)} は ${k} の倍数である。`;
          const wrongs = [
            `${$(inner)} は整数だから、${$(e)} は ${2 * k} の倍数である。`,
            `${$(inner)} は整数だから、${$(e)} は ${k + h} の倍数である。`,
            `${$(inner)} は整数だから、${$(e)} は偶数である。`,
            `${$(inner)} は整数だから、${$(e)} は ${$("n")} の倍数である。`,
          ];
          return {
            q: `連続する${k}つの整数のうち、もっとも${plus ? "小さい" : "大きい"}整数を $n$ とすると、和は $${e}$ と変形できた。この式を読んで、いつでも成り立つこととして正しいものは、どれか。（n は整数）`,
            ans: right,
            choices: mkText4(r, right, shuffle(r, wrongs)),
            hint: "かっこの中が整数なら、k×(整数) は何の倍数といえるかな。",
            steps: [`${$(inner)} は、整数 n に整数 ${h} をたし（ひい）た数だから、整数。`, `${$(e)} は ${k}×(整数) の形だから、${k} の倍数。`],
          };
        }),
        // 07d05 もっとも大きい数から、もっとも小さい数をひいた差は、いつも 2 になる
        t("07d05", (r) => {
          const k = r(3, 6), kind = pick(r, [KINDS[0], KINDS[0], KINDS[1], KINDS[2], KINDS[3]]);
          const d = (k - 1) * kind.step;
          return {
            q: `連続する${k}つの${kind.name}のうち、もっとも大きい数から、もっとも小さい数をひいた差は、いつも □ になる。□ に入る数は？`,
            ans: d,
            hint: `もっとも小さい数を n として、${k}つの数を n で表そう。`,
            steps: [`もっとも小さい数を $n$ とすると、${k}つの${kind.name}は $${offList(seq(k, 0, kind.step))}$。`, `差は $(n+${d}) - n = ${d}$。n がどんな数でも、差は ${d}。`],
          };
        }),
        // 07q02a 小テスト（2）の下書き：連続する3つの整数の和を、まん中の整数を n として整理する（4択）
        t("07q02a", (r) => {
          const k = pick(r, [3, 5, 7]), m = (k - 1) / 2, kind = pick(r, [KINDS[0], KINDS[0], KINDS[1], KINDS[2]]);
          const offs = seq(k, -m * kind.step, kind.step), right = `${k}n`;
          return {
            q: `連続する${k}つの${kind.name}のまん中の数を $n$ とする。${k}つの${kind.name}の和を、n を使った式で表して整理すると、どれか。`,
            ans: $(right),
            choices: mk4(r, right, [`${k}n+1`, `${k}n+${k}`, `n+${k}`, `${k}n-${k}`, `${k * 2}n`]),
            hint: "まん中の数を n としたとき、前の数・後ろの数を n でどう表すかな。",
            steps: [`${k}つの${kind.name}は $${offList(offs)}$。`, `和は $${offs.map(off).join("+")} = ${right}$。`],
          };
        }),
        // 07q02b 小テスト（2）「連続する3つの整数の和は、まん中の整数の3倍」を、文字で説明する → 正しい説明を選ぶ（4択）
        t("07q02b", (r) => {
          const k = pick(r, [3, 5, 7, 9]), m = (k - 1) / 2, offs = seq(k, -m, 1);
          const right = `まん中の整数を ${$("n")} とすると、${k}つの整数は ${$(offList(offs))} と表される。和は ${$(`${offs.map(off).join("+")}=${k}n`)} となるので、まん中の整数の ${k}倍になる。`;
          const ex = (a) => `${seq(k, a, 1).join("+")}=${seq(k, a, 1).reduce((x, y) => x + y, 0)}`;
          const wrongs = [
            `${$(ex(1))}、${$(ex(4))} のように、どちらも、まん中の整数の ${k}倍になっている。だから、いつでも成り立つ。`,
            `${k}つの整数を、すべて ${$("n")} とおくと、和は ${$(`${Array(k).fill("n").join("+")}=${k}n`)} となるので、まん中の整数の ${k}倍になる。`,
            `${k}つの整数を ${$(["a", "b", "c", "d", "e", "f", "g", "h", "i"].slice(0, k).join(",\\ "))} とおくと、和は ${$(["a", "b", "c", "d", "e", "f", "g", "h", "i"].slice(0, k).join("+"))} と表される。`,
          ];
          return {
            q: `連続する${k}つの整数の和は、まん中の整数の${k}倍になる。このことを、文字を使って説明するとき、正しい説明はどれか。`,
            ans: right,
            choices: mkText4(r, right, wrongs),
            hint: "「連続する」ということを、式にどう表すかな。どんな整数でも成り立つといえる説明はどれかな。",
            steps: [`まん中の整数を $n$ とおくと、前後の整数は $n-1$、$n+1$ のように表せる。`, `和を式にして整理すると、$${k}n$。これは、まん中の整数の ${k}倍。`],
          };
        }),
        // 07q03 小テスト（3）連続する3つの整数の和が 87 のとき、この3つの整数を求めよう。
        t("07q03", (r) => {
          const m = r(6, 80), S = 3 * m, i = r(0, 2);
          const ns = seq(3, m - 1, 1), ans = ns[i];
          return {
            q: `連続する3つの整数の和が ${S} のとき、この3つの整数のうち、${kuraiText(3, i)}は？`,
            ans,
            hint: "まん中の整数を n とおくと、和は n の式でどう表されるかな。",
            steps: ["まん中の整数を $n$ とすると、3つの整数は $n-1,\\ n,\\ n+1$。", `和は $3n = ${S}$ より、$n = ${m}$。3つの整数は ${ns.join("、")}。`, `${kuraiText(3, i)}は ${ans}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 07d06 連続する3つの整数の和が 100 になることはあるか
        t("07d06", (r) => {
          const k = pick(r, [3, 5]), multiple = r(0, 1) === 1;
          const m = r(4, 40);
          const N = multiple ? k * m : k * m + r(1, k - 1), q0 = Math.floor(N / k);
          let right, wrongs, steps;
          if (multiple) {
            right = `なる。まん中の整数が ${$(String(m))} のときである。`;
            wrongs = [`ならない。連続する${k}つの整数の和は、${k}の倍数にならないから。`, `なる。まん中の整数が ${$(String(m + 1))} のときである。`, `なる。まん中の整数が ${$(String(m - 1))} のときである。`, `なる。もっとも小さい整数が ${$(String(m))} のときである。`];
            steps = [`まん中の整数を $n$ とすると、和は $${k}n$。`, `$${k}n = ${N}$ とすると $n = ${m}$ で、整数になる。だから、なる（まん中の整数が ${m}）。`];
          } else {
            right = `ならない。連続する${k}つの整数の和は ${k} の倍数になるが、${N} は ${k} の倍数ではないから。`;
            wrongs = [`なる。まん中の整数が ${$(String(q0))} のときである。`, `なる。まん中の整数が ${$(String(q0 + 1))} のときである。`, `ならない。連続する${k}つの整数の和は、いつも偶数になるから。`, `なる。もっとも小さい整数が ${$(String(q0))} のときである。`];
            steps = [`まん中の整数を $n$ とすると、和は $${k}n$。`, `$${k}n = ${N}$ とすると $n = \\frac{${N}}{${k}}$ で、整数にならない。だから、ならない（和は ${k} の倍数だが、${N} は ${k} の倍数でない）。`];
          }
          return {
            q: `連続する${k}つの整数の和が ${N} になることはあるだろうか。正しい答えと理由を選ぼう。`,
            ans: right,
            choices: mkText4(r, right, wrongs),
            hint: `まん中の整数を n とおいて、和を n の式で表そう。その式が ${N} に等しくなる整数 n はあるかな。`,
            steps,
          };
        }),
        // 07d07 連続する5つの整数の和が 120 になるとき、5つの整数を求めよう。
        t("07d07", (r) => {
          const k = pick(r, [5, 5, 7]), kind = pick(r, [KINDS[0], KINDS[0], KINDS[1], KINDS[2]]);
          const mid = fitKind(kind, r(4, 18)), S = k * mid, ns = seq(k, mid - ((k - 1) / 2) * kind.step, kind.step);
          const i = pick(r, [0, 1, k - 2, k - 1]), ans = ns[i];
          const m = (k - 1) / 2;
          return {
            q: `連続する${k}つの${kind.name}の和が ${S} になった。この${k}つの${kind.name}のうち、${kuraiText(k, i)}は？`,
            ans,
            hint: `まん中の数を n とおくと、${k}つの${kind.name}は n でどう表されるかな。`,
            steps: [`まん中の数を $n$ とすると、${k}つの${kind.name}は $${offList(seq(k, -m * kind.step, kind.step))}$。`, `和は $${k}n = ${S}$ より、$n = ${mid}$。${k}つの${kind.name}は ${ns.join("、")}。`, `${kuraiText(k, i)}は ${ans}。`],
          };
        }),
        // 07d08 もっとも小さい数の2倍と、もっとも大きい数の和は、3でわると何余る数になるか
        t("07d08", (r) => {
          const a = r(2, 6), type = r(1, 4), m = a + 1;
          // 3つの整数 n、n+1、n+2 のうち、a倍する数と、もう1つの数の和
          const defs = {
            1: { x: "もっとも小さい数", y: "もっとも大きい数", f: (n) => a * n + (n + 2), expr: `${a}n+(n+2)` },
            2: { x: "もっとも大きい数", y: "もっとも小さい数", f: (n) => a * (n + 2) + n, expr: `${a}(n+2)+n` },
            3: { x: "まん中の数", y: "もっとも小さい数", f: (n) => a * (n + 1) + n, expr: `${a}(n+1)+n` },
            4: { x: "まん中の数", y: "もっとも大きい数", f: (n) => a * (n + 1) + (n + 2), expr: `${a}(n+1)+(n+2)` },
          }[type];
          const c0 = defs.f(0), c1 = defs.f(1) - defs.f(0);
          const rem = ((c0 % c1) + c1) % c1;
          return {
            q: `連続する3つの整数のうち、${defs.x}の ${a}倍と、${defs.y}の和は、${m}でわると何余る数になるか。（余りが 0 のときは 0）`,
            ans: rem,
            unit: "余る",
            hint: "もっとも小さい整数を n として、3つの整数を n で表し、和を n の式にしよう。そのあと、わる数の倍数の部分を取り出そう。",
            steps: ["もっとも小さい整数を $n$ とすると、3つの整数は $n,\\ n+1,\\ n+2$。", `和は $${defs.expr} = ${c1}n${c0 ? `+${c0}` : ""}$。`, `${c1}n は ${m} の倍数だから、${m}でわった余りは、${c0} を ${m}でわった余りの ${rem}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 07d09 連続する3つの整数の和に、まん中の整数をたすと、4の倍数になる
        t("07d09", (r) => {
          const k = pick(r, [3, 5, 7]), j = r(1, 3), m = (k - 1) / 2;
          const word = j === 1 ? "まん中の整数" : `まん中の整数の ${j}倍`;
          return {
            q: `連続する${k}つの整数の和に、${word}をたした数は、いつも □ の倍数になる。□ に入る数のうち、いちばん大きいものは？`,
            ans: k + j,
            hint: "まん中の整数を n とおいて、たした数を n の式で表そう。n の係数に注目する。",
            steps: [`まん中の整数を $n$ とすると、${k}つの整数の和は $${k}n$。`, `${word}をたすと $${k}n + ${j}n = ${k + j}n$。`, `n は整数だから、${k + j}n は ${k + j} の倍数。いつでも成り立つ最大の数は ${k + j}。`],
          };
        }),
        // 07d10a もっとも小さい整数を n とする。3つの整数の和が、n の5倍より 1 小さくなった。3つの整数を求めよう。
        t("07d10a", (r) => {
          const g = retry(() => {
            const a = r(4, 8), n = r(2, 25), c = (a - 3) * n - 3;
            return c >= 1 && c <= 40 ? { a, n, c } : null;
          });
          if (!g) return { skip: true };
          const { a, n, c } = g, ns = seq(3, n, 1), i = r(0, 2), ans = [n, n + 1, n + 2][i];
          return {
            q: `もっとも小さい整数を $n$ とする。連続する3つの整数の和が、$n$ の ${a}倍より ${c} 小さくなった。この3つの整数のうち、${kuraiText(3, i)}は？`,
            ans,
            hint: `3つの整数の和を n の式で表して、「n の ${a}倍より ${c} 小さい」を表す式と等しいとおこう。`,
            steps: ["3つの整数は $n,\\ n+1,\\ n+2$ だから、和は $3n+3$。", `$3n+3 = ${a}n-${c}$ を解くと $${a - 3}n = ${3 + c}$ より、$n = ${n}$。`, `3つの整数は ${ns.join("、")}。${kuraiText(3, i)}は ${ans}。`],
          };
        }),
        // 07d10b もっとも小さい整数を n とする。5つの整数の和が、n の6倍になった。5つの整数を求めよう。
        t("07d10b", (r) => {
          const g = retry(() => {
            const a = r(6, 8), n = r(2, 15), c = 10 - (a - 5) * n;   // 5n+10 = a n + c
            return Math.abs(c) <= 30 ? { a, n, c } : null;
          });
          if (!g) return { skip: true };
          const { a, n, c } = g, ns = seq(5, n, 1), i = r(0, 4), ans = ns[i];
          const rel = c === 0 ? `$n$ の ${a}倍` : c > 0 ? `$n$ の ${a}倍より ${c} 大きい数` : `$n$ の ${a}倍より ${-c} 小さい数`;
          return {
            q: `もっとも小さい整数を $n$ とする。連続する5つの整数の和が、${rel}になった。この5つの整数のうち、${kuraiText(5, i)}は？`,
            ans,
            hint: "5つの整数の和を n の式で表して、条件の式と等しいとおこう。",
            steps: ["5つの整数は $n,\\ n+1,\\ n+2,\\ n+3,\\ n+4$ だから、和は $5n+10$。", `$5n+10 = ${a}n${c === 0 ? "" : c > 0 ? `+${c}` : `-${-c}`}$ を解くと $n = ${n}$。`, `5つの整数は ${ns.join("、")}。${kuraiText(5, i)}は ${ans}。`],
          };
        }),
        // 07q04 小テスト チャレンジ：連続する5つの整数のうち、小さいほうから3つの和が 60 のとき、5つの整数の和を求めよう。
        t("07q04", (r) => {
          const k = pick(r, [5, 5, 7]), j = r(3, k - 2), fromSmall = r(0, 1) === 0, n = r(3, 40);
          const ns = seq(k, n, 1), part = fromSmall ? ns.slice(0, j) : ns.slice(k - j), S = part.reduce((a, b) => a + b, 0), total = ns.reduce((a, b) => a + b, 0);
          const lo = fromSmall ? 0 : k - j, c = (j * (j - 1)) / 2 + lo * j;
          return {
            q: `連続する${k}つの整数のうち、${fromSmall ? "小さい" : "大きい"}ほうから ${j}つの和が ${S} のとき、${k}つの整数の和は？`,
            ans: total,
            hint: `もっとも小さい整数を n として、${j}つの和の式をつくり、n の値を求めよう。`,
            steps: [`もっとも小さい整数を $n$ とすると、${k}つの整数は $${offList(seq(k, 0, 1))}$。`, `${fromSmall ? "小さい" : "大きい"}ほうから ${j}つの和は $${j}n+${c}$。$${j}n+${c} = ${S}$ より $n = ${n}$。`, `${k}つの整数は ${ns.join("、")}。和は ${total}。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし
//   「説明しよう」の問題（dr.2・4・5・8・9、qz.2）は、文字でおく・式を変形する・式を読む のうちの1段階を、数（□ に入る数）か4択に直して移した。
//   dr.6（和が 100 になることはあるか。理由も）は、結論と理由の組を選ぶ4択（07d06）にした。
export const SKIPPED = [];
