// ============================================================
// data-04.js — データの活用 第4時「人数のちがう2つの集団を、公平にくらべよう」（相対度数）
//   ikkan の演習プリント（data-04.dr.1〜8）・小テスト（data-04.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「04」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：04d03b ＝ data-04.dr.3 の2つ目、04q05a ＝ data-04.qz.5 の1つ目
//   相対度数は、割り切れる（有限小数になる）組の度数・度数の合計だけを使う。四捨五入が出るのは dr.5 だけで、境目（ちょうど 5）になる組は使わない（stats.js の relFreq が null）。
//   表（度数と相対度数）は、度数分布表を文章で言う。表を完成させる問題（dr.1・dr.3①・dr.4①・qz.1）は、表の 1 つの階級の値を聞く。
//   「合計が 1 にならないわけ」（dr.5）は、四捨五入した相対度数の合計を聞く問題と、わけを選ぶ 4択にした。
// ============================================================
import { t, pick, choices4, shuffle, round, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, classes, relFreq } from "../stats.js";

const unit = unitFor("data");

const show = (x) => String(round(x, 6));
const p2 = (k) => (k / 100).toFixed(2);   // 百分率の整数 k → 0.15のような小数（2けた）の文字列

// ── 場面 ─────────────────────────────────────────────
/** name＝「＿＿を調べた」、u＝単位、lo＝階級のはじめ、w＝階級の幅 */
const CTX = [
  { name: "通学時間", u: "分", lo: 0, w: 10 },
  { name: "1日のゲーム時間", u: "分", lo: 0, w: 30 },
  { name: "1週間の読書時間", u: "時間", lo: 0, w: 5 },
  { name: "ボール投げの記録", u: "m", lo: 15, w: 5 },
  { name: "テストの得点", u: "点", lo: 0, w: 10 },
];
const lb = (c, u) => `${c.lo}${u}以上${c.hi}${u}未満`;
const fs = (cls, f, u) => cls.map((c, i) => `${lb(c, u)}が ${f[i]}人`).join("、");
const bell = (r, k, n) => {
  const f = Array(k).fill(0);
  for (let i = 0; i < n; i++) f[Math.floor((r(0, 10 * k - 1) + r(0, 10 * k - 1)) / 20)]++;
  return f;
};
/** total を parts 個の min 以上の整数に分ける（まん中が多くなりやすい） */
const partition = (r, total, parts, min = 1) => {
  const a = Array(parts).fill(min);
  for (let left = total - min * parts; left > 0; left--) a[Math.floor((r(0, 10 * parts - 1) + r(0, 10 * parts - 1)) / 20)]++;
  return a;
};
/** 度数の合計 N のとき、相対度数が 2けた（k/100）でちょうどになる度数の最小の刻み（k の刻み）。例 N=40 → 5、N=150 → 2、N=100 → 1 */
const kUnit = (N) => 100 / gcd(N, 100);

// 度数の合計 N と、割り切れる度数（相対度数が有限小数）
const NS_EXACT = [20, 25, 40, 50];
// 04d08・04q05：度数の合計の候補（相対度数が 2けたの小数で、度数が整数になる組をつくれるもの）
const NS_D8 = [20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 125, 150, 200];
const NS_Q5 = [25, 40, 50, 60, 75, 80, 100, 120, 125, 150, 200, 250];

export const UNITS = [
  unit("04", {
    name: "相対度数",
    desc: "人数のちがう集団を、相対度数でくらべる",
    prereqs: ["J1-dk03", "E6-data"],
    points: [
      "相対度数とは、全体に対する、その階級の度数の割合のこと。相対度数 ＝（その階級の度数）÷（度数の合計）。",
      "度数 ＝ 相対度数 ×（度数の合計）。相対度数をすべての階級でたすと 1になる。（四捨五入した値をたすと、0.99 や 1.01になることもある。）",
      "人数のちがう集団をくらべるときは、度数のままではなく、相対度数でくらべる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 04d01 20人のボール投げ：相対度数を求める（表の 1 つの階級）
        t("04d01", (r) => {
          const c = pick(r, CTX), n = pick(r, NS_EXACT), k = 5, cls = classes(c.lo, c.w, k), f = bell(r, k, n);
          const j = r(0, k - 1);
          if (f[j] === 0) return { skip: true };
          const ans = round(f[j] / n, 6);
          return {
            q: `${n}人の${c.name}（${c.u}）の度数分布表は、${fs(cls, f, c.u)}である。「${lb(cls[j], c.u)}」の階級の相対度数を求めよう。`,
            ans,
            hint: "相対度数は、その階級の度数が、全体（度数の合計）のどれだけにあたるかを表す。何を何でわればよいかな。",
            steps: ["相対度数 ＝（その階級の度数）÷（度数の合計）", `度数の合計は ${n}人。${f[j]}÷${n} ＝ ${ans}`],
          };
        }),
        // 04d02a 度数の合計と度数から相対度数
        t("04d02a", (r) => relCalc(r)),
        // 04d02b 度数の合計と相対度数から度数
        t("04d02b", (r) => freqCalc(r)),
        // 04q02 度数の合計と度数から相対度数（小テスト）
        t("04q02", (r) => relCalc(r)),
        // 04q03 度数の合計と相対度数から度数（小テスト）
        t("04q03", (r) => freqCalc(r)),
        // 04q04 相対度数をすべての階級でたすと（合計・百分率・残りの階級）
        t("04q04", (r) => {
          const n = pick(r, [20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60, 64, 80, 100, 120, 150, 200]);
          const kind = pick(r, ["sum", "sum", "pct", "rest", "rest"]);
          if (kind === "pct") {
            return {
              q: `度数の合計が${n}の度数分布表がある。すべての階級の相対度数をたした値を、百分率で表すと、何%か。`,
              ans: 100,
              choices: choices4(r, 100, [1, 10, 50]),
              hint: "相対度数をすべてたすと、いくつになるかな。その数を百分率にすると？",
              steps: ["相対度数をすべてたすと 1になる。", "1を百分率で表すと 100%。"],
            };
          }
          if (kind === "rest") {
            const k = pick(r, [5, 10, 15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90]), pp = k / 100, ans = round(1 - pp, 2);   // 0.50 だと、1−0.50 が同じ値になるので使わない
            return {
              q: `度数分布表で、ある階級の相対度数は${p2(k)}である。それ以外のすべての階級の相対度数をたすと、いくつになるか。`,
              ans,
              choices: choices4(r, ans, [round(pp, 2), round(1 + pp, 2), 1]),
              hint: "相対度数をすべての階級でたすと、いくつになるかな。",
              steps: ["すべての階級の相対度数をたすと 1になる。", `それ以外の階級の合計は 1−${p2(k)} ＝ ${show(ans)}`],
            };
          }
          return {
            q: `度数の合計が${n}の度数分布表がある。すべての階級の相対度数をたすと、いくつになるか。`,
            ans: 1,
            choices: choices4(r, 1, [n, 10, 0.5]),
            hint: "各階級の相対度数は、（その階級の度数）÷（度数の合計）。度数を全部たすと、何になるかな。",
            steps: ["相対度数をすべてたすと、（各階級の度数の和）÷（度数の合計）になる。", `各階級の度数の和は、度数の合計${n}と同じだから、${n}÷${n} ＝ 1`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 04d03a 2つの組のうちの 1 つの組の相対度数（表の 1 つの階級）
        t("04d03a", (r) => {
          const c = pick(r, CTX), nm = pick(r, ["C組", "D組", "A組", "B組", "1組", "2組"]);
          const n = pick(r, NS_EXACT), cls = classes(c.lo, c.w, 4), f = bell(r, 4, n), j = r(0, 3);
          if (f[j] === 0) return { skip: true };
          const ans = round(f[j] / n, 6);
          return {
            q: `${nm}の${n}人の${c.name}（${c.u}）の度数分布表は、${fs(cls, f, c.u)}である。「${lb(cls[j], c.u)}」の階級の相対度数を求めよう。`,
            ans,
            hint: "相対度数は、何を何でわって求めたかな。度数の合計は、その組の人数。",
            steps: ["相対度数 ＝（その階級の度数）÷（度数の合計）", `${f[j]}÷${n} ＝ ${ans}`],
          };
        }),
        // 04d03b 人数のちがう 2 つの組で、○以上の人の割合が大きいのは
        t("04d03b", (r) => {
          const c = pick(r, CTX), names = pick(r, [["A組", "B組"], ["C組", "D組"], ["1組", "2組"]]);
          const ns = shuffle(r, NS_EXACT).slice(0, 2), trap = r(0, 1) === 0;
          const cls = classes(c.lo, c.w, 4), x = cls[2].lo;
          // 各組で、x 以上の人数 cc を決める（trap なら、人数の多いほうが、割合は小さくなる組）
          let cc = null;
          for (let i = 0; i < 300 && !cc; i++) {
            const a = ns.map((n) => r(Math.ceil(n * 0.25), Math.floor(n * 0.65)));
            const rt = a.map((v, i2) => v / ns[i2]);
            if (Math.abs(rt[0] - rt[1]) < 1e-9) continue;
            const isTrap = a[0] === a[1] || (a[0] - a[1]) * (rt[0] - rt[1]) < 0;
            if (trap && !isTrap) continue;
            cc = a;
          }
          if (!cc) return { skip: true };
          const fs2 = ns.map((n, g) => {
            const up = cc[g], low = n - up;
            const a1 = Math.min(low - 1, Math.max(1, r(Math.ceil(low * 0.3), Math.floor(low * 0.7)))), b1 = Math.min(up - 1, Math.max(1, r(Math.ceil(up * 0.3), Math.floor(up * 0.7))));
            return [a1, low - a1, b1, up - b1];
          });
          if (fs2.some((f) => f.some((v) => v < 1))) return { skip: true };
          const rt = cc.map((v, g) => v / ns[g]), win = rt[0] > rt[1] ? 0 : 1;
          const ans = names[win];
          return {
            q: `${names[0]}の${ns[0]}人と、${names[1]}の${ns[1]}人の${c.name}（${c.u}）を調べた。度数分布表は、${names[0]}が ${fs(cls, fs2[0], c.u)}、${names[1]}が ${fs(cls, fs2[1], c.u)}である。${c.name}が ${x}${c.u}以上の人の割合が大きいのは、どちらの組か。`,
            ans,
            choices: choices4(r, ans, [names[1 - win], "どちらも同じ", "表だけでは決められない"]),
            hint: "人数がちがうので、人数のままではくらべられない。それぞれの組で、割合（相対度数）を求めてくらべよう。",
            steps: [
              `${x}${c.u}以上は、「${lb(cls[2], c.u)}」と「${lb(cls[3], c.u)}」。`,
              `${names[0]}：(${fs2[0][2]}+${fs2[0][3]})÷${ns[0]} ＝ ${cc[0]}÷${ns[0]} ＝ ${show(rt[0])}　${names[1]}：(${fs2[1][2]}+${fs2[1][3]})÷${ns[1]} ＝ ${cc[1]}÷${ns[1]} ＝ ${show(rt[1])}`,
              `${show(rt[win])}のほうが大きいので、${ans}。`,
            ],
          };
        }),
        // 04d04a 相対度数と度数の合計から、度数
        t("04d04a", (r) => {
          const c = pick(r, CTX), N = pick(r, [40, 60, 80, 100, 120, 140, 160, 200]), cls = classes(c.lo, c.w, 4);
          const ks = partition(r, 20, 4, 1).map((m) => m * 5), j = r(0, 3);
          const f = ks.map((k) => (N * k) / 100);
          const rel = ks.map((k) => p2(k));
          return {
            q: `${N}人の${c.name}（${c.u}）を調べた。相対度数は、${cls.map((cl, i) => `${lb(cl, c.u)}が ${rel[i]}`).join("、")}だった。「${lb(cls[j], c.u)}」の階級の度数は？`,
            ans: f[j],
            unit: "人",
            hint: "相対度数 ＝ 度数 ÷ 度数の合計 だった。度数を求めるには、この式をどう変えるかな。",
            steps: ["度数 ＝ 相対度数 ×（度数の合計）", `${N}×${rel[j]} ＝ ${f[j]}（人）`],
          };
        }),
        // 04d04b 相対度数から、○以上の人数
        t("04d04b", (r) => {
          const c = pick(r, CTX), N = pick(r, [40, 60, 80, 100, 120, 140, 160, 200]), cls = classes(c.lo, c.w, 4);
          const ks = partition(r, 20, 4, 1).map((m) => m * 5), j = r(1, 2);
          const f = ks.map((k) => (N * k) / 100), rel = ks.map((k) => p2(k));
          const cnt = sum(f.slice(j));
          return {
            q: `${N}人の${c.name}（${c.u}）を調べた。相対度数は、${cls.map((cl, i) => `${lb(cl, c.u)}が ${rel[i]}`).join("、")}だった。${c.name}が ${cls[j].lo}${c.u}以上の人は、何人か。`,
            ans: cnt,
            unit: "人",
            hint: "相対度数 ＝ 度数 ÷ 度数の合計 だった。まず、各階級の度数を求めよう。「以上」にふくまれる階級は、どれとどれかな。",
            steps: [`度数は、${cls.map((cl, i) => `${N}×${rel[i]} ＝ ${f[i]}`).join("、")}（人）。`, `${cls[j].lo}${c.u}以上は、${f.slice(j).join("+")} ＝ ${cnt}（人）`],
          };
        }),
        // 04q01 25人の読書時間：相対度数（表の 1 つの階級）
        t("04q01", (r) => {
          const c = CTX[2], n = pick(r, NS_EXACT), cls = classes(0, 10, 4), f = bell(r, 4, n), j = r(0, 3);
          if (f[j] === 0) return { skip: true };
          const ans = round(f[j] / n, 6);
          return {
            q: `${n}人の${c.name}（${c.u}）を調べた。度数分布表は、${fs(cls, f, c.u)}である。「${lb(cls[j], c.u)}」の階級の相対度数を求めよう。`,
            ans,
            hint: "相対度数は、何を何でわって求めたかな。",
            steps: ["相対度数 ＝（その階級の度数）÷（度数の合計）", `${f[j]}÷${n} ＝ ${ans}`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 04d05a 四捨五入した相対度数の合計
        t("04d05a", (r) => {
          const d = r(1, 3) === 1 ? 1 : 2, T = roundedRel(r, d);   // 小数第2位まで（2/3）か、小数第1位まで（1/3）
          if (!T) return { skip: true };
          const up = d === 1 ? "小数第2位" : "小数第3位", to = d === 1 ? "小数第1位" : "小数第2位";
          return {
            q: `${T.n}人の${T.c.name}（${T.c.u}）の度数分布表で、各階級の度数は、${T.f.map((v) => v + "人").join("、")}である。それぞれの階級の相対度数を、${up}を四捨五入して${to}まで求め、それらをすべてたすと、いくつになるか。`,
            ans: T.S,
            hint: `それぞれの相対度数を、先に四捨五入して、${to}までの数にしてから、たそう。`,
            steps: [`相対度数は ${T.f.map((v) => `${v}÷${T.n}${Math.abs(v / T.n - round(v / T.n, 4)) < 1e-12 ? "＝" : "≒"}${round(v / T.n, 4)}`).join("、")}。`, `${up}を四捨五入して ${T.rel.map((v) => v.toFixed(d)).join("、")}。`, `たすと ${T.rel.map((v) => v.toFixed(d)).join("+")} ＝ ${T.S.toFixed(d)}`],
          };
        }),
        // 04d05b 合計が 1 にならないわけ
        t("04d05b", (r) => {
          const T = roundedRel(r, 2);
          if (!T) return { skip: true };
          const ans = "四捨五入で切り上げた分と切り捨てた分が、ちょうど打ち消し合わなかったから";
          return {
            q: `${T.n}人の度数分布表で、各階級の度数は、${T.f.map((v) => v + "人").join("、")}である。相対度数を、小数第3位を四捨五入して小数第2位まで求めて、すべてたしたら、1ではなく ${T.S.toFixed(2)}になった。1にならなかったのは、なぜか。`,
            ans,
            choices: choices4(r, ans, [
              "階級の幅が階級ごとにちがっていて、割合が正しく求められなかったから",
              "相対度数は度数を階級の数でわって求めるので、合計がずれるから",
              "度数の合計が全体の人数と合っていなくて、わる数がずれていたから",
            ]),
            hint: "四捨五入していない相対度数をすべてたすと、いくつになるかな。四捨五入すると、数はどうなるかな。",
            steps: ["四捨五入する前の相対度数は、すべてたすとちょうど 1になる。", `四捨五入で、切り上げた分と切り捨てた分が打ち消し合わなかったので、合計が ${T.S.toFixed(2)}になった。`],
          };
        }),
        // 04d06a 度数と相対度数から、度数の合計
        t("04d06a", (r) => tot6(r, "N")),
        // 04d06b 度数と相対度数から合計を求めて、別の階級の度数
        t("04d06b", (r) => tot6(r, "f")),
        // 04d07c 25m 以上の生徒は、全体の何%か（表の相対度数から）
        t("04d07c", (r) => tbl7(r, "pct")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 04d07a ア（見えない度数）
        t("04d07a", (r) => tbl7(r, "ア")),
        // 04d07b ウ（見えない相対度数）
        t("04d07b", (r) => tbl7(r, "ウ")),
        // 04d08a 相対度数の差と度数の差から、度数の合計
        t("04d08a", (r) => diffQ(r, "N", NS_D8)),
        // 04d08b 2つの階級の度数
        t("04d08b", (r) => diffQ(r, "f", NS_D8)),
        // 04q05a チャレンジ：度数の合計
        t("04q05a", (r) => diffQ(r, "N", NS_Q5)),
        // 04q05b チャレンジ：階級の度数
        t("04q05b", (r) => diffQ(r, "f", NS_Q5)),
      ],
    },
  }),
];

// ── 04d02a・04q02：度数の合計と度数から、相対度数 ───────────────
function relCalc(r) {
  const N = pick(r, [20, 25, 40, 50, 100, 200]), f = r(1, Math.floor(N / 2)), ans = round(f / N, 6);
  return {
    q: `度数の合計が ${N}で、ある階級の度数が ${f}のとき、その階級の相対度数は？`,
    ans,
    hint: "相対度数は、その階級の度数が、度数の合計のどれだけにあたるか。何を何でわるかな。",
    steps: ["相対度数 ＝（その階級の度数）÷（度数の合計）", `${f}÷${N} ＝ ${ans}`],
  };
}
// ── 04d02b・04q03：度数の合計と相対度数から、度数 ───────────────
function freqCalc(r) {
  const N = pick(r, [20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 120, 125, 150, 160, 200]);
  const ks = [];
  for (let k = 5; k <= 60; k += 5) if ((N * k) % 100 === 0) ks.push(k);
  const k = pick(r, ks), f = (N * k) / 100;
  return {
    q: `度数の合計が ${N}で、ある階級の相対度数が ${p2(k)}のとき、その階級の度数は？`,
    ans: f,
    unit: "人",
    hint: "相対度数 ＝ 度数 ÷ 度数の合計。この式をもとに、度数を求める式を考えよう。",
    steps: ["度数 ＝ 相対度数 ×（度数の合計）", `${N}×${p2(k)} ＝ ${f}（人）`],
  };
}

// ── 04d05：四捨五入した相対度数（合計が 1 にならない組） ─────────────
function roundedRel(r, d = 2) {
  const c = pick(r, CTX), n = pick(r, [30, 35, 45, 60, 70, 90]), k = 5;
  for (let i = 0; i < 200; i++) {
    const f = bell(r, k, n);
    if (f.some((v) => v === 0)) continue;
    const rel = f.map((v) => relFreq(v, n, d));
    if (rel.some((v) => v === null || v === 0)) continue;
    const S = round(sum(rel), d);
    if (Math.abs(S - 1) < 1e-9) continue;   // 合計が 1にならない組だけを使う
    return { c, n, f, rel, S };
  }
  return null;
}

// ── 04d06：度数 f・相対度数 p から、度数の合計 N（"N"）、または別の階級の度数（"f"） ─
function tot6(r, ask) {
  const N = pick(r, [20, 25, 30, 40, 50, 60, 70, 75, 80, 100, 120, 150, 200]), u = kUnit(N);
  const k1 = u * r(Math.ceil(10 / u), Math.floor(45 / u));
  let k2 = u * r(Math.ceil(10 / u), Math.floor(45 / u));
  if (k2 === k1) k2 = k1 + u;
  const f1 = (N * k1) / 100, f2 = (N * k2) / 100;
  const c = pick(r, CTX);
  if (f1 < 3) return { skip: true };
  const head = `${c.name}（${c.u}）を調べた度数分布表で、ある階級の度数は ${f1}人で、相対度数は ${p2(k1)}である。`;
  if (ask === "N") {
    return {
      q: `${head}度数の合計を求めよう。`,
      ans: N,
      unit: "人",
      hint: "相対度数 ＝ 度数 ÷ 度数の合計。度数の合計を x 人として、式にあてはめよう。",
      steps: [`度数の合計を x 人とすると　x×${p2(k1)} ＝ ${f1}`, `x ＝ ${f1}÷${p2(k1)} ＝ ${N}（人）`],
    };
  }
  return {
    q: `${head}相対度数が ${p2(k2)}の階級の度数を求めよう。`,
    ans: f2,
    unit: "人",
    hint: "まず、度数の合計を求めよう。（相対度数 ＝ 度数 ÷ 度数の合計）。そのあと、度数 ＝ 相対度数 ×（度数の合計）。",
    steps: [`度数の合計を x 人とすると　x×${p2(k1)} ＝ ${f1}　x ＝ ${f1}÷${p2(k1)} ＝ ${N}`, `${N}×${p2(k2)} ＝ ${f2}（人）`],
  };
}

// ── 04d07：度数と相対度数の表（ア・イ・ウ） ───────────────────────
function tbl7(r, ask) {
  const c = pick(r, CTX.filter((x) => x.w === 5 || x.w === 10)), cls = classes(c.lo, c.w, 5);
  const N = pick(r, [100, 120, 150, 200, 250, 300]), u = kUnit(N);
  const m = partition(r, 100 / u, 5, Math.max(1, Math.ceil(4 / u)));
  const ks = m.map((v) => v * u), f = ks.map((k) => (N * k) / 100);
  const a = r(0, 2), b = 3;   // a：度数 ア・相対度数 ウ が見えない階級　b：度数 イ が見えない階級（相対度数はわかる）
  const cell = (i) => (i === a ? `度数 ア人、相対度数 ウ` : i === b ? `度数 イ人、相対度数 ${p2(ks[i])}` : `度数 ${f[i]}人、相対度数 ${p2(ks[i])}`);
  const head = `${N}人の${c.name}（${c.u}）の度数分布表は、${cls.map((cl, i) => `${lb(cl, c.u)}は、${cell(i)}`).join("；")}である。`;
  const others = f.filter((_, i) => i !== a && i !== b);
  const stI = `イ ＝ ${N}×${p2(ks[b])} ＝ ${f[b]}（人）`;
  const stA = `ア ＝ ${N}−(${[...others, f[b]].join("+")}) ＝ ${f[a]}（人）`;
  if (ask === "ア") {
    return { q: `${head}ア にあてはまる数は？`, ans: f[a], unit: "人", hint: "度数が見えているイのほうから、順に求めよう。相対度数がわかっていれば、度数も求められる。", steps: [stI, stA] };
  }
  if (ask === "ウ") {
    return {
      q: `${head}ウ にあてはまる数は？`,
      ans: round(ks[a] / 100, 6),
      hint: "ウは、アの階級の相対度数。まず、アの度数を求めよう。そのために、イの度数から順に求める。",
      steps: [stI, stA, `ウ ＝ ${f[a]}÷${N} ＝ ${show(ks[a] / 100)}`],
    };
  }
  const x = cls[b].lo, pc = ks[b] + ks[4];
  return {
    q: `${head}${c.name}が ${x}${c.u}以上の人は、全体の何%か。`,
    ans: pc,
    unit: "%",
    hint: "「以上」にふくまれる階級は、どれかな。その階級の相対度数は、表でわかっているかな。",
    steps: [`${x}${c.u}以上は、「${lb(cls[b], c.u)}」と「${lb(cls[4], c.u)}」。`, `相対度数の和 ${p2(ks[b])}+${p2(ks[4])} ＝ ${show(pc / 100)}`, `百分率にして ${pc}%`],
  };
}

// ── 04d08・04q05：相対度数の差と度数の差から、度数の合計・度数 ─────────
function diffQ(r, ask, Ns) {
  for (let i = 0; i < 40; i++) { const p = diffTry(r, ask, Ns); if (!p.skip) return p; }
  return { skip: true };
}
function diffTry(r, ask, Ns) {
  const N = pick(r, Ns), u = kUnit(N);
  const lo = Math.ceil(8 / u), hi = Math.floor(45 / u);
  const m1 = r(lo, hi - 1), m2 = r(m1 + 1, Math.min(hi, m1 + 8));
  const k1 = m1 * u, k2 = m2 * u, f1 = (N * k1) / 100, f2 = (N * k2) / 100, d = f2 - f1;
  if (m2 > hi || f1 < 2 || d < 3 || d > 40) return { skip: true };
  const dk = (k2 - k1) / 100;
  const head = `ある階級の相対度数は ${p2(k1)}で、となりの階級の相対度数は ${p2(k2)}である。この 2つの階級の度数の差は ${d}人である。`;
  const st1 = `度数の合計を N 人とすると　${p2(k2)}N−${p2(k1)}N ＝ ${d}　${show(dk)}N ＝ ${d}　N ＝ ${N}`;
  if (ask === "N") {
    return { q: `${head}度数の合計を求めよう。`, ans: N, unit: "人", hint: "度数の合計を N 人として、2つの階級の度数を N を使って表そう。（度数 ＝ 相対度数 × 度数の合計）", steps: [st1, `度数の合計は ${N}人。`] };
  }
  const big = r(0, 1) === 0;
  return {
    q: `${head}相対度数が ${p2(big ? k2 : k1)}の階級の度数を求めよう。`,
    ans: big ? f2 : f1,
    unit: "人",
    hint: "度数の合計を N 人として、2つの階級の度数を N を使って表そう。（度数 ＝ 相対度数 × 度数の合計）まず、N を求める。",
    steps: [st1, `${N}×${p2(k1)} ＝ ${f1}（人）、${N}×${p2(k2)} ＝ ${f2}（人）`, `相対度数が ${p2(big ? k2 : k1)}の階級の度数は ${big ? f2 : f1}人。`],
  };
}

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 演習プリント 8問・小テスト 5問のすべてを移した（表を完成させる問題は表の 1 つの階級の値を聞く形に、dr.5の「わけ」は四捨五入した合計を聞く問題と 4択にした）
