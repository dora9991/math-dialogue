// ============================================================
// e2.js — 小学2年の単元（数学ラボ ソロ）
//   たし算とひき算の筆算 / 1000までの数・10000までの数 / かけ算（九九） /
//   長さとかさ / 時こくと時間 / 三角形と四角形 / 分数のはじまり / 表とグラフ
//   書き方は docs/solo-問題データの書き方.md
//   小2 までに習う かん字だけを つかう（辺→へん、頂点→ちょう点、位→くらい など）。
// ============================================================
import { t, pick, choices4, sample, shuffle } from "../kit.js";

// ── 小さな道具 ─────────────────────────────────────────
/** 数の4択（min より小さい数は出さない） */
const nc = (r, ans, traps = [], min = 0) => {
  const ds = [1, -1, 2, -2, 10, -10, 3, 5, -5, 20];
  const off = r(0, ds.length - 1);
  return choices4(r, ans, traps.filter((x) => Number.isInteger(x) && x >= min), (i) => {
    const v = ans + ds[(i + off) % ds.length];
    return v >= min ? v : null;
  });
};
const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const PL = ["一", "十", "百", "千", "一万"];
/** 3時 / 3時25分 */
const jif = (h, m) => (m === 0 ? `${h}時` : `${h}時${m}分`);
const frac = (a, b) => `$\\frac{${a}}{${b}}$`;

/** たし算の筆算の とき方 */
function addSteps(a, b) {
  const out = [];
  const len = String(Math.max(a, b)).length, lb = String(b).length;
  let c = 0;
  for (let i = 0; i < len; i++) {
    const x = dig(a, i), y = dig(b, i), s = x + y + c;
    const body = i < lb ? `${x} + ${y}${c ? " + 1" : ""}` : `${x}${c ? " + 1" : ""}`;
    out.push(`${PL[i]}のくらい　${body} = ${s}${s >= 10 ? `（${PL[i + 1]}のくらいに 1 くり上げる）` : ""}`);
    c = s >= 10 ? 1 : 0;
  }
  out.push(`答え　${a + b}`);
  return out;
}
/** ひき算の筆算の とき方 */
function subSteps(a, b) {
  const out = [];
  const len = String(a).length;
  let br = 0;
  for (let i = 0; i < len; i++) {
    const raw = dig(a, i), y = dig(b, i);
    const x = raw - br;
    if (i === len - 1 && x === 0 && y === 0) break; // 上の くらいが 0 に なった
    const head = `${PL[i]}のくらい　`;
    if (i >= String(b).length && x >= 0) {
      out.push(`${head}${br ? `1 へって ${x}` : `${x} を そのまま おろす`}`);
      br = 0;
      continue;
    }
    if (x < 0) {
      // 0 から かしたので、さらに 上から かりる
      out.push(`${head}0 なので ${PL[i + 1]}のくらいから かりて 10、下に 1 かして ${9}。${9} − ${y} = ${9 - y}`);
      br = 1;
    } else if (x < y) {
      out.push(`${head}${br ? `1 へって ${x}。` : ""}${x} − ${y} は できないので、${PL[i + 1]}のくらいから 1 くり下げて ${x + 10} − ${y} = ${x + 10 - y}`);
      br = 1;
    } else {
      out.push(`${head}${br ? `1 へって ${x}。` : ""}${x} − ${y} = ${x - y}`);
      br = 0;
    }
  }
  out.push(`答え　${a - b}`);
  return out;
}
/** くり上がりを わすれた たし算（くらいごとに 一のくらいだけ 書く） */
const noCarrySum = (a, b) => {
  let s = 0;
  for (let i = 0; i < 4; i++) s += ((dig(a, i) + dig(b, i)) % 10) * 10 ** i;
  return s;
};
/** くらいごとに「大きい方 − 小さい方」を してしまう まちがい */
const absDigitDiff = (a, b) => {
  let s = 0;
  for (let i = 0; i < 4; i++) s += Math.abs(dig(a, i) - dig(b, i)) * 10 ** i;
  return s;
};

/** a × b = c × □ が 九九の はんいで なりたつ 組（c は a、b と ちがう） */
const KUKU_SWAP = [];
for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) for (let c = 2; c <= 9; c++) {
  if (c !== a && c !== b && (a * b) % c === 0 && (a * b) / c <= 9 && (a * b) / c >= 2) KUKU_SWAP.push([a, b, c]);
}

// 表とグラフの しらべる こと
const HYO_SETS = [
  { what: "すきな くだもの", ask: "すきな くだものを 1人 1つずつ", items: ["りんご", "みかん", "バナナ", "いちご", "ぶどう"] },
  { what: "すきな あそび", ask: "すきな あそびを 1人 1つずつ", items: ["おにごっこ", "なわとび", "ドッジボール", "かくれんぼ", "ぶらんこ"] },
  { what: "すきな 色", ask: "すきな 色を 1人 1つずつ", items: ["赤", "青", "黄色", "みどり", "白"] },
  { what: "すきな 生きもの", ask: "すきな 生きものを 1人 1つずつ", items: ["犬", "ねこ", "うさぎ", "金魚", "ハムスター"] },
];
/** 表の 文章（りんご 5人、みかん 3人、…） */
function tableText(items, counts) {
  return items.map((it, i) => `${it} ${counts[i]}人`).join("、");
}

export const UNITS = [
  // ────────────────────────────────────────────────────────
  {
    id: "E2-hissan",
    grade: "E2",
    area: "num",
    name: "たし算とひき算の筆算",
    desc: "2けた・3けたの筆算",
    prereqs: ["E1-kuri", "E1-100"],
    points: [
      "ひっ算は くらいを たてに そろえて 書き、一のくらいから じゅんに 計算するよ。",
      "たして 10 を こえたら、上の くらいに 1 くり上げる。",
      "ひけない ときは、上の くらいから 1 くり下げて 10 を かりる。",
      "ひき算の 答えの たしかめ：答え ＋ ひく数 ＝ ひかれる数。",
    ],
    levels: {
      1: [
        t("E2-hissan-1a", (r) => {
          const a = r(10, 80), b = r(10, 99 - a);
          if (b < 10) return { skip: true };
          return {
            q: `${a} + ${b} を ひっ算で 計算しよう。`,
            ans: a + b,
            hint: "くらいを そろえて、一のくらいから たそう。",
            steps: addSteps(a, b),
          };
        }),
        t("E2-hissan-1b", (r) => {
          const a = r(20, 99), b = r(10, a - 1);
          return {
            q: `${a} − ${b} を ひっ算で 計算しよう。`,
            ans: a - b,
            hint: "くらいを そろえて、一のくらいから ひこう。",
            steps: subSteps(a, b),
          };
        }),
      ],
      2: [
        t("E2-hissan-2a", (r) => {
          const big = r(0, 1) === 1;
          const a1 = r(1, 9), b1 = r(10 - a1, 9);
          const a = (big ? 10 * r(10, 89) : 10 * r(1, 9)) + a1, b = 10 * r(1, 9) + b1;
          if (a + b > 999) return { skip: true };
          const s = a + b;
          return {
            q: `${a} + ${b} の 答えは どれ？`,
            choices: nc(r, s, [s - 10, noCarrySum(a, b), s + 10, s - 100], 1),
            ans: s,
            hint: "くり上げた 1 を たすのを わすれないように。",
            steps: addSteps(a, b),
          };
        }),
        t("E2-hissan-2b", (r) => {
          const a = r(101, 199), b = r(Math.max(11, a - 99), 99);
          if (a % 10 >= b % 10 && r(0, 2) > 0) return { skip: true };
          const d = a - b;
          return {
            q: `${a} − ${b} の 答えは どれ？`,
            choices: nc(r, d, [absDigitDiff(a, b), d + 10, d - 10, d + 100], 1),
            ans: d,
            hint: "一のくらいが ひけない ときは、十のくらいから 1 くり下げよう。",
            steps: subSteps(a, b),
          };
        }),
        t("E2-hissan-2c", (r) => {
          const item = pick(r, ["けしゴム", "えんぴつ", "シール", "ものさし"]);
          if (r(0, 1)) {
            const a = r(100, 250), b = r(30, 99);
            const big = pick(r, ["ノート", "のり", "ペン", "絵本"]);
            return {
              q: `${a}円の ${big}と ${b}円の ${item}を 買います。あわせて 何円ですか。`,
              ans: a + b,
              unit: "円",
              hint: "「あわせて」は たし算。ひっ算で 計算しよう。",
              steps: [`しき　${a} + ${b} = ${a + b}`, `答え　${a + b}円`],
            };
          }
          const a = r(100, 199), b = r(Math.max(30, a - 90), 99);
          return {
            q: `${a}円 もって います。${b}円の ${item}を 買うと、のこりは 何円ですか。`,
            ans: a - b,
            unit: "円",
            hint: "「のこり」は ひき算。ひっ算で 計算しよう。",
            steps: [`しき　${a} − ${b} = ${a - b}`, `答え　${a - b}円`],
          };
        }),
      ],
      3: [
        t("E2-hissan-3a", (r) => {
          const a = r(20, 80), b = r(10, 60), c = r(10, a + b - 5);
          const ans = a + b - c;
          return {
            q: `シールを ${a}まい もって いました。友だちから ${b}まい もらって、妹に ${c}まい あげました。いま 何まい もって いますか。`,
            ans,
            unit: "まい",
            hint: "もらうと ふえる、あげると へる。じゅんに 計算しよう。",
            steps: [`もらったので　${a} + ${b} = ${a + b}`, `あげたので　${a + b} − ${c} = ${ans}`, `答え　${ans}まい`],
          };
        }),
        t("E2-hissan-3b", (r) => {
          const ty = r(1, 3);
          if (ty === 1) {
            const x = r(15, 80), b = r(12, 99 - x), c = x + b;
            if (b < 12) return { skip: true };
            return {
              q: `□ + ${b} = ${c} の □ に 入る 数は いくつですか。`,
              ans: x,
              hint: "ぜんたいの 数から、わかって いる 方を ひけば よいね。",
              steps: [`□ は ${c} から ${b} を ひいた 数`, `${c} − ${b} = ${x}`, `□ は ${x}`],
            };
          }
          if (ty === 2) {
            const a = r(40, 99), c = r(11, a - 11), x = a - c;
            return {
              q: `${a} − □ = ${c} の □ に 入る 数は いくつですか。`,
              ans: x,
              hint: `${a} から いくつ ひくと ${c} に なるかを 考えよう。`,
              steps: [`□ は ${a} と ${c} の ちがい`, `${a} − ${c} = ${x}`, `□ は ${x}`],
            };
          }
          const b = r(12, 60), c = r(12, 99 - b), x = b + c;
          return {
            q: `□ − ${b} = ${c} の □ に 入る 数は いくつですか。`,
            ans: x,
            hint: `□ から ${b} を ひくと ${c} が のこる。もとの 数を 考えよう。`,
            steps: [`□ は のこりの ${c} と ひいた ${b} を あわせた 数`, `${c} + ${b} = ${x}`, `□ は ${x}`],
          };
        }),
        t("E2-hissan-3c", (r) => {
          const b = r(12, 40);
          if (r(0, 1)) {
            const x = r(b + 5, 99 - b), wrong = x - b, ok = x + b;
            return {
              q: `ある 数に ${b} を たす ところを、まちがえて ${b} を ひいて しまったので、答えが ${wrong} に なりました。正しい 答えは いくつですか。`,
              ans: ok,
              hint: "まず「ある 数」を もとめよう。",
              steps: [`ある 数は　${wrong} + ${b} = ${x}`, `正しい 計算は　${x} + ${b} = ${ok}`, `答え　${ok}`],
            };
          }
          const x = r(2 * b + 5, 99 - b), wrong = x + b, ok = x - b;
          return {
            q: `ある 数から ${b} を ひく ところを、まちがえて ${b} を たして しまったので、答えが ${wrong} に なりました。正しい 答えは いくつですか。`,
            ans: ok,
            hint: "まず「ある 数」を もとめよう。",
            steps: [`ある 数は　${wrong} − ${b} = ${x}`, `正しい 計算は　${x} − ${b} = ${ok}`, `答え　${ok}`],
          };
        }),
      ],
      4: [
        t("E2-hissan-4a", (r) => {
          const A = r(1, 8), p = r(0, 9), q = r(1, 8), D = r(0, 9);
          const x = 10 * A + p, y = 10 * q + D, S = x + y;
          const c = p + D >= 10 ? 1 : 0;
          const askBox = r(0, 1) === 1;
          return {
            q: `□ と △ には、0 から 9 までの 数字が 1つずつ 入ります。${A}□ + △${D} = ${S} の とき、${askBox ? "□" : "△"} に 入る 数字は 何ですか。`,
            ans: askBox ? p : q,
            hint: "一のくらいから 考えよう。くり上がりが あるかにも 気をつけて。",
            steps: [
              `一のくらい　□ + ${D} の 一のくらいが ${S % 10} に なるので □ = ${p}${c ? "（十のくらいへ 1 くり上がる）" : ""}`,
              `十のくらい　${A} + △${c ? " + 1" : ""} = ${Math.floor(S / 10)} なので △ = ${q}`,
              `たしかめ　${x} + ${y} = ${S}`,
            ],
          };
        }),
        t("E2-hissan-4b", (r) => {
          const ds = sample(r, range(1, 9), 3);
          const s = [...ds].sort((p, q) => p - q);
          const max = 10 * s[2] + s[1], min = 10 * s[0] + s[1];
          const ans = max - min;
          return {
            q: `${ds.join("、")} の 3まいの 数字カードから 2まいを えらんで ならべ、2けたの 数を つくります。いちばん 大きい 数と いちばん 小さい 数の ちがいは いくつですか。`,
            ans,
            hint: "十のくらいに どの カードを おくと 大きく（小さく）なるかを 考えよう。",
            steps: [`いちばん 大きい 数は ${max}`, `いちばん 小さい 数は ${min}`, `${max} − ${min} = ${ans}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-1000",
    grade: "E2",
    area: "num",
    name: "1000までの数・10000までの数",
    desc: "位取り・大小・何十何百",
    prereqs: ["E1-100"],
    points: [
      "100 が 3こ、10 が 4こ、1 が 5こ で 345。",
      "1000 は 100 を 10こ あつめた 数。10000 は 1000 を 10こ あつめた 数。",
      "数の 大きさは、上の くらいから じゅんに くらべるよ。",
    ],
    levels: {
      1: [
        t("E2-1000-1a", (r) => {
          const a = r(1, 9), b = r(0, 9), c = r(0, 9), n = 100 * a + 10 * b + c;
          const parts = [`100を ${a}こ`, b ? `10を ${b}こ` : "", c ? `1を ${c}こ` : ""].filter(Boolean);
          return {
            q: `${parts.join("、")} あわせた 数は いくつですか。`,
            ans: n,
            hint: "100 の まとまりが 百のくらい、10 が 十のくらい、1 が 一のくらい だよ。",
            steps: [`百のくらいが ${a}、十のくらいが ${b}、一のくらいが ${c}`, `答え　${n}`],
          };
        }),
        t("E2-1000-1b", (r) => {
          const four = r(0, 1) === 1;
          const n = four ? r(1000, 9999) : r(100, 999);
          const i = r(0, four ? 3 : 2);
          const d = dig(n, i);
          return {
            q: `${n} の ${PL[i]}のくらいの 数字は 何ですか。`,
            ans: d,
            hint: "右から じゅんに 一、十、百、千 の くらい だよ。",
            steps: [
              four
                ? `${n} は 1000が ${dig(n, 3)}こ、100が ${dig(n, 2)}こ、10が ${dig(n, 1)}こ、1が ${dig(n, 0)}こ`
                : `${n} は 100が ${dig(n, 2)}こ、10が ${dig(n, 1)}こ、1が ${dig(n, 0)}こ`,
              `${PL[i]}のくらいの 数字は ${d}`,
            ],
          };
        }),
      ],
      2: [
        t("E2-1000-2a", (r) => {
          const ty = r(1, 3);
          let k = r(11, 99);
          if (k % 10 === 0) k += r(1, 9);
          if (ty === 1) {
            return {
              q: `10 を ${k}こ あつめた 数は いくつですか。`,
              ans: 10 * k,
              hint: "10 が 10こで 100。10 が いくつ あるか まとまりで 考えよう。",
              steps: [`10 が ${Math.floor(k / 10) * 10}こで ${Math.floor(k / 10) * 100}、10 が ${k % 10}こで ${(k % 10) * 10}`, `答え　${10 * k}`],
            };
          }
          if (ty === 2) {
            return {
              q: `${10 * k} は 10 を 何こ あつめた 数ですか。`,
              ans: k,
              unit: "こ",
              hint: "100 は 10 が 10こ。百のくらいと 十のくらいに 分けて 考えよう。",
              steps: [`${Math.floor(k / 10) * 100} は 10 が ${Math.floor(k / 10) * 10}こ、${(k % 10) * 10} は 10 が ${k % 10}こ`, `答え　${k}こ`],
            };
          }
          return {
            q: `100 を ${k}こ あつめた 数は いくつですか。`,
            ans: 100 * k,
            hint: "100 が 10こで 1000 だよ。",
            steps: [`100 が ${Math.floor(k / 10) * 10}こで ${Math.floor(k / 10) * 1000}、100 が ${k % 10}こで ${(k % 10) * 100}`, `答え　${100 * k}`],
          };
        }),
        t("E2-1000-2b", (r) => {
          const ty = r(1, 4);
          if (ty === 1) {
            const a = r(3, 9), b = r(11 - a, 9);
            return {
              q: `${10 * a} + ${10 * b} を 計算しよう。`,
              ans: 10 * (a + b),
              hint: "10 の まとまりが いくつに なるかを 考えよう。",
              steps: [`10 が ${a}こ と ${b}こ で ${a + b}こ`, `10 が ${a + b}こ で ${10 * (a + b)}`],
            };
          }
          if (ty === 2) {
            const a = r(11, 18), b = r(a - 9, 9);
            return {
              q: `${10 * a} − ${10 * b} を 計算しよう。`,
              ans: 10 * (a - b),
              hint: "10 の まとまりで 考えよう。",
              steps: [`10 が ${a}こ から ${b}こ ひいて ${a - b}こ`, `10 が ${a - b}こ で ${10 * (a - b)}`],
            };
          }
          if (ty === 3) {
            const a = r(1, 8), b = r(1, 10 - a), plus = r(0, 1) === 1 || a + b === 10;
            if (plus) {
              return {
                q: `${100 * a} + ${100 * b} を 計算しよう。`,
                ans: 100 * (a + b),
                hint: "100 の まとまりで 考えよう。",
                steps: [`100 が ${a}こ と ${b}こ で ${a + b}こ`, `100 が ${a + b}こ で ${100 * (a + b)}`],
              };
            }
            const big = a + b;
            return {
              q: `${100 * big} − ${100 * b} を 計算しよう。`,
              ans: 100 * a,
              hint: "100 の まとまりで 考えよう。",
              steps: [`100 が ${big}こ から ${b}こ ひいて ${a}こ`, `100 が ${a}こ で ${100 * a}`],
            };
          }
          const b = r(1, 9);
          return {
            q: `1000 − ${100 * b} を 計算しよう。`,
            ans: 1000 - 100 * b,
            hint: "1000 は 100 が 10こ だよ。",
            steps: [`1000 は 100 が 10こ`, `100 が 10こ から ${b}こ ひいて ${10 - b}こ`, `答え　${1000 - 100 * b}`],
          };
        }),
        t("E2-1000-2c", (r) => {
          const k = pick(r, [1, 10, 100, 1000]), up = r(0, 1) === 1;
          const n = up ? r(100, 9999 - k) : r(100 + k, 9999);
          const ans = up ? n + k : n - k;
          return {
            q: `${n} より ${k} ${up ? "大きい" : "小さい"} 数は いくつですか。`,
            ans,
            hint: k === 1 ? "1 ずつ 数えて みよう。" : `${PL[String(k).length - 1]}のくらいの 数字が どう かわるか 考えよう。`,
            steps: [`${n} ${up ? "+" : "−"} ${k} = ${ans}`, `答え　${ans}`],
          };
        }),
      ],
      3: [
        t("E2-1000-3a", (r) => {
          const ds = sample(r, range(1, 9), 4);
          const set = new Set();
          for (let i = 0; set.size < 4 && i < 50; i++) set.add(Number(shuffle(r, ds).join("")));
          if (set.size < 4) return { skip: true };
          const xs = [...set], big = r(0, 1) === 1;
          const ans = big ? Math.max(...xs) : Math.min(...xs);
          return {
            q: `${xs.join("、")} の 中で、いちばん ${big ? "大きい" : "小さい"} 数は どれですか。`,
            choices: choices4(r, ans, xs.filter((x) => x !== ans)),
            ans,
            hint: "千のくらいから じゅんに くらべよう。",
            steps: [`小さい じゅんに ${[...xs].sort((p, q) => p - q).join("、")}`, `いちばん ${big ? "大きい" : "小さい"}のは ${ans}`],
          };
        }),
        t("E2-1000-3b", (r) => {
          const a = r(1, 9), b = r(0, 9), c = r(1, 9), tens = r(0, 1) === 1;
          const n = 1000 * a + 100 * b + (tens ? 10 * c : c);
          const parts = [`1000を ${a}こ`, b ? `100を ${b}こ` : "", tens ? `10を ${c}こ` : `1を ${c}こ`].filter(Boolean);
          return {
            q: `${parts.join("、")} あわせた 数は いくつですか。`,
            ans: n,
            hint: "くらいごとに 数字を 書いて、ない くらいには 0 を 書こう。",
            steps: [`千のくらい ${a}、百のくらい ${b}、十のくらい ${tens ? c : 0}、一のくらい ${tens ? 0 : c}`, `答え　${n}`],
          };
        }),
        t("E2-1000-3c", (r) => {
          const h = r(1, 9), u = r(0, 9), N = 100 * h + r(10, 89);
          const less = r(0, 1) === 1;
          const ok = range(0, 9).filter((d) => (less ? 100 * h + 10 * d + u < N : 100 * h + 10 * d + u > N));
          if (ok.length === 0 || ok.length === 10) return { skip: true };
          return {
            q: `${h}□${u} は ${N} より ${less ? "小さい" : "大きい"} 数です。□ に 入る 数字は 何こ ありますか。（□ には 0 から 9 までの 数字が 1つ 入ります）`,
            ans: ok.length,
            unit: "こ",
            hint: "百のくらいは 同じ。十のくらいを くらべて、同じ ときは 一のくらいを くらべよう。",
            steps: [`□ に 0 から 9 を じゅんに 入れて たしかめる`, `なりたつのは □ が ${ok.join("、")} の とき`, `答え　${ok.length}こ`],
          };
        }),
      ],
      4: [
        t("E2-1000-4a", (r) => {
          const ds = [0, ...sample(r, range(1, 9), 3)];
          const all = new Set();
          const perm = (arr, pre = []) => {
            if (!arr.length) { if (pre[0] !== 0) all.add(Number(pre.join(""))); return; }
            arr.forEach((x, i) => perm([...arr.slice(0, i), ...arr.slice(i + 1)], [...pre, x]));
          };
          perm(ds);
          const xs = [...all].sort((p, q) => p - q);
          const [label, idx] = pick(r, [["いちばん 小さい", 0], ["2番目に 小さい", 1], ["いちばん 大きい", xs.length - 1], ["2番目に 大きい", xs.length - 2]]);
          const ans = xs[idx];
          const small = idx < 2;
          return {
            q: `${shuffle(r, ds).join("、")} の 4まいの 数字カードを ぜんぶ ならべて、4けたの 数を つくります。${label} 数は いくつですか。`,
            ans,
            hint: small ? "千のくらいに 0 は おけないね。上の くらいから 小さい 数字を おこう。" : "上の くらいから 大きい 数字を おいて いこう。",
            steps: small
              ? [`千のくらいには 0 を おけないので、0 いがいで いちばん 小さい ${xs[0].toString()[0]} を おく`, `小さい じゅんに ${xs.slice(0, 3).join("、")}、…`, `答え　${ans}`]
              : [`上の くらいから 大きい 数字を じゅんに おく`, `大きい じゅんに ${xs.slice(-3).reverse().join("、")}、…`, `答え　${ans}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-kuku",
    grade: "E2",
    area: "num",
    name: "かけ算（九九）",
    desc: "九九・かけ算の意味",
    prereqs: ["E1-tashi"],
    points: [
      "「1つ分の 数 × いくつ分 ＝ ぜんぶの 数」。3こずつ 4さら分で 3 × 4 = 12。",
      "かける数が 1 ふえると、答えは かけられる数だけ ふえる（3 × 5 は 3 × 4 より 3 大きい）。",
      "かける数と かけられる数を 入れかえても、答えは 同じ（3 × 4 = 4 × 3）。",
    ],
    levels: {
      1: [
        t("E2-kuku-1a", (r) => {
          const a = r(1, 9), b = r(1, 9);
          return {
            q: `${a} × ${b} を 計算しよう。`,
            ans: a * b,
            hint: `${a}のだんの 九九を となえて みよう。`,
            steps: [`${a}のだん：${range(1, b).map((k) => a * k).join("、")}`, `${a} × ${b} = ${a * b}`],
          };
        }),
        t("E2-kuku-1b", (r) => {
          const a = r(2, 9), b = r(2, 9);
          const [q, c] = pick(r, [
            [`1さらに みかんが ${a}こずつ のって います。${b}さら分では、みかんは ぜんぶで 何こですか。`, "こ"],
            [`1ふくろに あめが ${a}こずつ 入って います。${b}ふくろ では、あめは ぜんぶで 何こですか。`, "こ"],
            [`長いすが ${b}きゃく あります。1きゃくに ${a}人ずつ すわると、ぜんぶで 何人 すわれますか。`, "人"],
          ]);
          return {
            q,
            ans: a * b,
            unit: c,
            hint: "「1つ分の 数」と「いくつ分」を 見つけよう。",
            steps: [`1つ分は ${a}、いくつ分は ${b}`, `しき　${a} × ${b} = ${a * b}`, `答え　${a * b}${c}`],
          };
        }),
      ],
      2: [
        t("E2-kuku-2a", (r) => {
          const a = r(3, 9), b = r(3, 9), ans = a * b;
          return {
            q: `${a} × ${b} の 答えは どれ？`,
            choices: nc(r, ans, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b], 1),
            ans,
            hint: `${a}のだんを じゅんに となえて、まちがえやすい ところに 気をつけよう。`,
            steps: [`${a} × ${b - 1} = ${a * (b - 1)}`, `それに ${a} を たして ${a} × ${b} = ${ans}`],
          };
        }),
        t("E2-kuku-2b", (r) => {
          const a = r(2, 9), b = r(2, 9), p = a * b;
          if (r(0, 1)) {
            return {
              q: `${a} × □ = ${p} の □ に 入る 数は いくつですか。`,
              ans: b,
              hint: `${a}のだんで、答えが ${p} に なるのは どれかな。`,
              steps: [`${a}のだんを となえる：${range(1, b).map((k) => a * k).join("、")}`, `${a} × ${b} = ${p} なので □ は ${b}`],
            };
          }
          return {
            q: `□ × ${b} = ${p} の □ に 入る 数は いくつですか。`,
            ans: a,
            hint: `□ × ${b} は ${b} × □ と 同じ。${b}のだんで さがそう。`,
            steps: [`${b} × ${a} = ${p}`, `かける じゅんを 入れかえても 答えは 同じなので □ は ${a}`],
          };
        }),
        t("E2-kuku-2c", (r) => {
          const a = r(2, 9), b = r(2, 9);
          return {
            q: `${a} × ${b} の 答えは、${a} × ${b - 1} の 答えより いくつ 大きいですか。`,
            ans: a,
            hint: "かける数が 1 ふえると、答えは どれだけ ふえるかな。",
            steps: [`${a} × ${b - 1} = ${a * (b - 1)}、${a} × ${b} = ${a * b}`, `${a * b} − ${a * (b - 1)} = ${a}`, `かける数が 1 ふえると かけられる数の ${a} だけ ふえる`],
          };
        }),
      ],
      3: [
        t("E2-kuku-3a", (r) => {
          const a = r(3, 9), b = r(3, 9), c = r(2, 9), ans = a * b + c;
          return {
            q: `子どもが ${a}人ずつ ${b}れつに ならんで います。あとから ${c}人 来ました。子どもは みんなで 何人に なりましたか。`,
            ans,
            unit: "人",
            hint: "まず、ならんで いる 子どもの 数を かけ算で もとめよう。",
            steps: [`ならんで いる 子ども　${a} × ${b} = ${a * b}`, `あとから 来た 子どもを たす　${a * b} + ${c} = ${ans}`, `答え　${ans}人`],
          };
        }),
        t("E2-kuku-3b", (r) => {
          const a = r(5, 9), b = r(2, 9), c = r(2, 9), d = r(2, 9);
          if (a === c) return { skip: true };
          const ans = a * b + c * d;
          return {
            q: `1こ ${a}円の ガムを ${b}こと、1こ ${c}円の あめを ${d}こ 買いました。あわせて 何円ですか。`,
            ans,
            unit: "円",
            hint: "ガムの だい金と あめの だい金を べつべつに もとめよう。",
            steps: [`ガム　${a} × ${b} = ${a * b}`, `あめ　${c} × ${d} = ${c * d}`, `${a * b} + ${c * d} = ${ans}　答え ${ans}円`],
          };
        }),
        t("E2-kuku-3c", (r) => {
          const [a, b, c] = pick(r, KUKU_SWAP);
          const p = a * b, ans = p / c;
          return {
            q: `${a} × ${b} = ${c} × □ の □ に 入る 数は いくつですか。`,
            ans,
            hint: `まず ${a} × ${b} を 計算して、${c}のだんで その 答えを さがそう。`,
            steps: [`${a} × ${b} = ${p}`, `${c}のだんで ${p} に なるのは ${c} × ${ans}`, `□ は ${ans}`],
          };
        }),
      ],
      4: [
        t("E2-kuku-4a", (r) => {
          const n = r(1, 9) * r(1, 9);
          const list = [];
          for (let x = 1; x <= 9; x++) for (let y = 1; y <= 9; y++) if (x * y === n) list.push(`${x} × ${y}`);
          if (list.length < 2 && r(0, 3) > 0) return { skip: true };
          return {
            q: `九九の ひょうの 中で、答えが ${n} に なる ところは いくつ ありますか。`,
            ans: list.length,
            unit: "こ",
            hint: "1のだんから 9のだんまで、じゅんに しらべよう。",
            steps: [`答えが ${n} に なるのは ${list.join("、")}`, `ぜんぶで ${list.length}こ`],
          };
        }),
        t("E2-kuku-4b", (r) => {
          const a = r(2, 9), sum = a * 45;
          return {
            q: `${a}のだんの 九九の 答え（${a} × 1 から ${a} × 9 まで）を ぜんぶ たすと いくつに なりますか。`,
            ans: sum,
            hint: `${a} × 1 と ${a} × 9、${a} × 2 と ${a} × 8 … と 組に して たして みよう。`,
            steps: [
              `${a} × 1 + ${a} × 9 = ${a * 10}、${a} × 2 + ${a} × 8 = ${a * 10}、… と ${a * 10} の 組が 4つ`,
              `のこりは ${a} × 5 = ${a * 5}`,
              `${a * 10} が 4つで ${a * 40}、${a * 40} + ${a * 5} = ${sum}`,
            ],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-nagasa",
    grade: "E2",
    area: "func",
    name: "長さとかさ",
    desc: "cm・mm・m、L・dL・mL",
    prereqs: ["E1-100"],
    points: [
      "1cm ＝ 10mm、1m ＝ 100cm。",
      "1L ＝ 10dL、1L ＝ 1000mL、1dL ＝ 100mL。",
      "たしたり ひいたり する ときは、同じ たんいに そろえてから 計算するよ。",
    ],
    levels: {
      1: [
        t("E2-nagasa-1a", (r) => {
          const a = r(1, 20), b = r(1, 9), ans = 10 * a + b;
          return {
            q: `${a}cm${b}mm は 何mm ですか。`,
            ans,
            unit: "mm",
            hint: "1cm は 10mm だよ。",
            steps: [`${a}cm は ${10 * a}mm`, `${10 * a}mm と ${b}mm で ${ans}mm`],
          };
        }),
        t("E2-nagasa-1b", (r) => {
          const a = r(1, 9), b = r(1, 9), ans = 10 * a + b;
          return {
            q: `${a}L${b}dL は 何dL ですか。`,
            ans,
            unit: "dL",
            hint: "1L は 10dL だよ。",
            steps: [`${a}L は ${10 * a}dL`, `${10 * a}dL と ${b}dL で ${ans}dL`],
          };
        }),
      ],
      2: [
        t("E2-nagasa-2a", (r) => {
          const a = r(1, 3), b = r(0, 1) ? r(1, 9) : r(10, 99), cm = 100 * a + b;
          const correct = `${cm}cm`;
          return {
            q: `${a}m${b}cm は 何cm ですか。`,
            choices: choices4(r, correct, [`${a}${b}cm`, `${100 * a + 10 * b}cm`, `${10 * a + b}cm`, `${1000 * a + b}cm`], (i) => `${cm + [10, -10, 100, 1][i % 4]}cm`),
            ans: correct,
            hint: "1m は 100cm。くらいが ずれないように 気をつけよう。",
            steps: [`${a}m は ${100 * a}cm`, `${100 * a}cm と ${b}cm で ${cm}cm`],
          };
        }),
        t("E2-nagasa-2b", (r) => {
          const a = r(2, 9), b = r(1, 9), c = r(2, 9), d = r(1, 9);
          const ans = 10 * (a + c) + b + d;
          return {
            q: `${a}cm${b}mm の テープと ${c}cm${d}mm の テープを、かさならないように まっすぐ つなぎます。ぜんたいの 長さは 何mm ですか。`,
            ans,
            unit: "mm",
            hint: "どちらも mm に なおしてから たそう。",
            steps: [`${a}cm${b}mm = ${10 * a + b}mm、${c}cm${d}mm = ${10 * c + d}mm`, `${10 * a + b} + ${10 * c + d} = ${ans}`, `答え　${ans}mm`],
          };
        }),
        t("E2-nagasa-2c", (r) => {
          const ty = r(1, 3), a = r(1, 9);
          const [q, ok, traps, why] =
            ty === 1
              ? [`${a}L は 何dL ですか。`, `${10 * a}dL`, [`${a}dL`, `${100 * a}dL`, `${1000 * a}dL`], "1L は 10dL"]
              : ty === 2
                ? [`${a}dL は 何mL ですか。`, `${100 * a}mL`, [`${10 * a}mL`, `${1000 * a}mL`, `${a}mL`], "1dL は 100mL"]
                : [`${a}L は 何mL ですか。`, `${1000 * a}mL`, [`${100 * a}mL`, `${10 * a}mL`, `${10000 * a}mL`], "1L は 1000mL"];
          return {
            q,
            choices: choices4(r, ok, traps),
            ans: ok,
            hint: "1L、1dL、1mL の かんけいを 思い出そう。",
            steps: [why, `答え　${ok}`],
          };
        }),
      ],
      3: [
        t("E2-nagasa-3a", (r) => {
          const a = r(1, 4), b = r(0, 9), all = 10 * a + b, c = r(b + 1, all - 1);
          const ans = all - c;
          return {
            q: `水が ${a}L${b ? `${b}dL` : ""} あります。${c}dL つかうと、のこりは 何dL ですか。`,
            ans,
            unit: "dL",
            hint: "はじめの かさを dL に なおそう。",
            steps: [`${a}L${b ? `${b}dL` : ""} = ${all}dL`, `${all} − ${c} = ${ans}`, `答え　${ans}dL`],
          };
        }),
        t("E2-nagasa-3b", (r) => {
          const a = r(1, 2), b = r(0, 9) * 5, all = 100 * a + b, c = r(10, Math.min(99, all - 10));
          const ans = all - c;
          return {
            q: `${a}m${b ? `${b}cm` : ""} の ひもから ${c}cm を 切りとりました。のこりは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: "はじめの 長さを cm に なおしてから ひこう。",
            steps: [`${a}m${b ? `${b}cm` : ""} = ${all}cm`, `${all} − ${c} = ${ans}`, `答え　${ans}cm`],
          };
        }),
        t("E2-nagasa-3c", (r) => {
          const vals = new Set();
          const base = r(101, 290);
          for (let i = 0; vals.size < 4 && i < 50; i++) vals.add(base + pick(r, [-20, -10, -9, -5, 0, 5, 9, 10, 20, 90, -90]));
          const vs = [...vals].filter((v) => v > 0);
          if (vs.length < 4) return { skip: true };
          const show = (v, k) => (k === 0 ? `${v}cm` : k === 1 ? `${10 * v}mm` : v % 100 === 0 ? `${v / 100}m` : `${Math.floor(v / 100)}m${v % 100}cm`);
          const labels = vs.map((v) => show(v, r(0, 2)));
          const long = r(0, 1) === 1;
          const target = long ? Math.max(...vs) : Math.min(...vs);
          const ans = labels[vs.indexOf(target)];
          return {
            q: `${labels.join("、")} の 中で、いちばん ${long ? "長い" : "みじかい"} ものは どれですか。`,
            choices: choices4(r, ans, labels.filter((l) => l !== ans)),
            ans,
            hint: "ぜんぶ 同じ たんい（たとえば cm）に そろえて くらべよう。",
            steps: [`cm に そろえると ${vs.map((v, i) => `${labels[i]} → ${v}cm`).join("、")}`, `いちばん ${long ? "長い" : "みじかい"}のは ${ans}`],
          };
        }),
      ],
      4: [
        t("E2-nagasa-4a", (r) => {
          const a = pick(r, [6, 7, 8, 9, 10, 20]), n = r(3, 5), b = r(1, 2);
          const ans = n * a - (n - 1) * b;
          return {
            q: `長さ ${a}cm の テープを ${n}本、つなぎめを ${b}cm ずつ かさねて 1本に つなぎます。ぜんたいの 長さは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: `つなぎめは いくつ できるかな？ ${n}本を つなぐ ときの つなぎめの 数を 考えよう。`,
            steps: [`かさねない ときの 長さ　${a} × ${n} = ${n * a}`, `つなぎめは ${n - 1}こ、かさなる 長さは ${b} × ${n - 1} = ${b * (n - 1)}`, `${n * a} − ${b * (n - 1)} = ${ans}　答え ${ans}cm`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-jikan",
    grade: "E2",
    area: "func",
    name: "時こくと時間",
    desc: "何分後・何分前・何時間",
    prereqs: ["E1-tokei"],
    points: [
      "「時こく」は 時計が さす その時、「時間」は 時こくと 時こくの 間の 長さ。",
      "1時間 ＝ 60分、1日 ＝ 24時間。",
      "午前は 夜中の 12時から 昼の 12時まで、午後は 昼の 12時から 夜中の 12時まで。",
    ],
    levels: {
      1: [
        t("E2-jikan-1a", (r) => {
          if (r(0, 3) === 0) {
            return {
              q: "2時間は 何分ですか。",
              ans: 120,
              unit: "分",
              hint: "1時間は 何分だったかな。",
              steps: ["1時間 ＝ 60分", "60 + 60 = 120　答え 120分"],
            };
          }
          const m = r(1, 11) * 5;
          return {
            q: `1時間${m}分は 何分ですか。`,
            ans: 60 + m,
            unit: "分",
            hint: "1時間は 何分だったかな。",
            steps: ["1時間 ＝ 60分", `60 + ${m} = ${60 + m}　答え ${60 + m}分`],
          };
        }),
        t("E2-jikan-1b", (r) => {
          const h = r(1, 11), m = r(0, 9) * 5, k = r(1, 11 - m / 5) * 5;
          const ok = jif(h, m + k);
          return {
            q: `${jif(h, m)}から ${k}分 たつと、何時何分ですか。`,
            choices: choices4(r, ok, [jif(h + 1, m + k), m >= k ? jif(h, m - k) : null, jif(h, k), m + k + 10 < 60 ? jif(h, m + k + 10) : null], (i) => jif(h, (m + k + 5 * (i + 3)) % 60)),
            ans: ok,
            hint: `長い はりが ${k}分 すすむと、どこを さすかな。`,
            steps: [`${m}分 から ${k}分 すすむと ${m + k}分`, `答え　${ok}`],
          };
        }),
      ],
      2: [
        t("E2-jikan-2a", (r) => {
          const h = r(1, 11), m = r(4, 11) * 5, k = r(1, 11) * 5;
          if (m + k <= 60 || m + k >= 120) return { skip: true };
          const nm = m + k - 60, ok = jif(h + 1, nm);
          return {
            q: `${jif(h, m)}から ${k}分後の 時こくは 何時何分ですか。`,
            choices: choices4(r, ok, [`${h}時${m + k}分`, jif(h, nm), jif(h + 1, nm + 10), jif(h + 2, nm)], (i) => jif(h + 1, (nm + 5 * (i + 3)) % 60)),
            ans: ok,
            hint: `まず ${h + 1}時（ちょうど）まで あと 何分かを 考えよう。`,
            steps: [`${jif(h, m)}から ${60 - m}分で ${h + 1}時`, `のこりは ${k} − ${60 - m} = ${nm}分`, `答え　${ok}`],
          };
        }),
        t("E2-jikan-2b", (r) => {
          const h = r(2, 12), m = r(1, 8) * 5, k = r(m / 5 + 1, 11) * 5;
          const nm = m - k + 60, ok = jif(h - 1, nm);
          return {
            q: `${jif(h, m)}の ${k}分前の 時こくは 何時何分ですか。`,
            choices: choices4(r, ok, [jif(h, k - m), `${h - 1}時${m - k + 100}分`, jif(h - 1, k - m), jif(h, nm)], (i) => jif(h - 1, (nm + 5 * (i + 1)) % 60)),
            ans: ok,
            hint: `まず ${h}時（ちょうど）まで 何分 もどるかを 考えよう。`,
            steps: [`${jif(h, m)}から ${m}分 もどると ${h}時`, `のこり ${k - m}分 もどると ${jif(h - 1, nm)}`, `答え　${ok}`],
          };
        }),
        t("E2-jikan-2c", (r) => {
          const h = r(1, 10), m1 = r(2, 11) * 5, m2 = r(0, m1 / 5 - 1) * 5;
          const ans = 60 - m1 + m2;
          return {
            q: `${jif(h, m1)}から ${jif(h + 1, m2)}までの 時間は 何分ですか。`,
            ans,
            unit: "分",
            hint: `${h + 1}時（ちょうど）で 分けて 考えよう。`,
            steps: [`${jif(h, m1)}から ${h + 1}時まで ${60 - m1}分`, `${h + 1}時から ${jif(h + 1, m2)}まで ${m2}分`, `${60 - m1} + ${m2} = ${ans}　答え ${ans}分`],
          };
        }),
      ],
      3: [
        t("E2-jikan-3a", (r) => {
          const a = r(6, 11), b = r(1, 7), ans = 12 - a + b;
          return {
            q: `午前${a}時から 午後${b}時までの 時間は 何時間ですか。`,
            ans,
            unit: "時間",
            hint: "昼の 12時（正午）で 分けて 考えよう。",
            steps: [`午前${a}時から 正午まで ${12 - a}時間`, `正午から 午後${b}時まで ${b}時間`, `${12 - a} + ${b} = ${ans}　答え ${ans}時間`],
          };
        }),
        t("E2-jikan-3b", (r) => {
          const h = r(7, 9), m = r(0, 9) * 5, k = r(2, 5) * 5, j = r(2, 8) * 5;
          const total = m + k + j;
          if (total >= 120) return { skip: true };
          const ok = jif(h + Math.floor(total / 60), total % 60);
          return {
            q: `${jif(h, m)}に 家を 出て、${k}分 歩いて えきに つきました。そこから ${j}分 電車に のりました。電車を おりたのは 何時何分ですか。`,
            choices: choices4(r, ok, [total >= 60 ? `${h}時${total}分` : null, jif(h, (m + k) % 60), jif(h + Math.floor(total / 60), (total + 10) % 60), jif(h + 1 + Math.floor(total / 60), total % 60)], (i) => jif(h + Math.floor(total / 60), (total + 5 * (i + 3)) % 60)),
            ans: ok,
            hint: "歩いた 時間と 電車の 時間を あわせると 何分かな。",
            steps: [`かかった 時間は ${k} + ${j} = ${k + j}分`, `${jif(h, m)}の ${k + j}分後`, `答え　${ok}`],
          };
        }),
        t("E2-jikan-3c", (r) => {
          const n = r(61, 179);
          if (n % 60 === 0) return { skip: true };
          const h = Math.floor(n / 60), m = n % 60, ok = `${h}時間${m}分`;
          return {
            q: `${n}分は 何時間何分ですか。`,
            choices: choices4(r, ok, [n >= 100 ? `${Math.floor(n / 100)}時間${n % 100}分` : null, m + 10 < 60 ? `${h}時間${m + 10}分` : null, `${h + 1}時間${m}分`, `${h === 1 ? 3 : 1}時間${m}分`], (i) => `${h}時間${(m + 5 * (i + 3)) % 60 || 5}分`),
            ans: ok,
            hint: "60分で 1時間。60分の まとまりが いくつ とれるかな。",
            steps: [`60分 ＝ 1時間`, `${n} = ${Array(h).fill(60).join(" + ")} + ${m}`, `答え　${ok}`],
          };
        }),
      ],
      4: [
        t("E2-jikan-4a", (r) => {
          const k = r(2, 5), h = r(2, 6), late = k * h;
          if (late >= 60) return { skip: true };
          const ok = `午後${h - 1}時${60 - late}分`;
          return {
            q: `ある 時計は、1時間に ${k}分ずつ おくれます。正午（昼の 12時）に 正しい 時こくに あわせました。正しい 時こくが 午後${h}時の とき、この 時計は 何時何分を さして いますか。`,
            choices: choices4(r, ok, [`午後${h}時${late}分`, `午後${h - 1}時${60 - k}分`, `午後${h}時`, `午後${h - 1}時${late}分`]),
            ans: ok,
            hint: `正午から 午後${h}時までに、何時間 たったかな。`,
            steps: [`正午から 午後${h}時まで ${h}時間`, `おくれは ${k} × ${h} = ${late}分`, `午後${h}時の ${late}分前で ${ok}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-zukei",
    grade: "E2",
    area: "geo",
    name: "三角形と四角形",
    desc: "長方形・正方形・直角三角形",
    prereqs: ["E1-katachi"],
    points: [
      "3本の 直線で かこまれた 形が 三角形、4本の 直線で かこまれた 形が 四角形。",
      "4つの かどが みんな 直角の 四角形が 長方形。そのうえ 4つの へんの 長さが みんな 同じなら 正方形。",
      "直角の かどが ある 三角形を 直角三角形と いうよ。",
    ],
    levels: {
      1: [
        t("E2-zukei-1a", (r) => {
          const [shape, kind, ans] = pick(r, [
            ["三角形", "へん", 3],
            ["三角形", "ちょう点", 3],
            ["四角形", "へん", 4],
            ["四角形", "ちょう点", 4],
            ["長方形", "直角", 4],
            ["正方形", "直角", 4],
            ["直角三角形", "直角", 1],
            ["直角三角形", "ちょう点", 3],
          ]);
          const q =
            kind === "へん" ? `${shape}には へんが 何本 ありますか。`
              : kind === "ちょう点" ? `${shape}には ちょう点が いくつ ありますか。`
                : `${shape}には 直角の かどが いくつ ありますか。`;
          return {
            q,
            ans,
            unit: kind === "へん" ? "本" : "こ",
            hint: `${shape}の 形を 思いうかべて 数えよう。`,
            steps: [`${shape}の ${kind === "直角" ? "直角の かど" : kind}を 数える`, `答え　${ans}${kind === "へん" ? "本" : "こ"}`],
          };
        }),
        t("E2-zukei-1b", (r) => {
          const [q, ok, wrongs] = pick(r, [
            ["4つの かどが みんな 直角で、4つの へんの 長さが みんな 同じ 四角形を 何と いいますか。", "正方形", ["長方形", "直角三角形", "三角形"]],
            ["4つの かどが みんな 直角で、たてと よこの 長さが ちがう 四角形を 何と いいますか。", "長方形", ["正方形", "直角三角形", "三角形"]],
            ["直角の かどが ある 三角形を 何と いいますか。", "直角三角形", ["長方形", "正方形", "四角形"]],
            ["3本の 直線で かこまれた 形を 何と いいますか。", "三角形", ["四角形", "長方形", "正方形"]],
            ["4本の 直線で かこまれた 形を 何と いいますか。", "四角形", ["三角形", "直角三角形", "まる"]],
          ]);
          return {
            q,
            choices: choices4(r, ok, wrongs),
            ans: ok,
            hint: "かどの 数・直角が あるか・へんの 長さに 目を つけよう。",
            steps: [`答え　${ok}`],
          };
        }),
      ],
      2: [
        t("E2-zukei-2a", (r) => {
          if (r(0, 1)) {
            const a = r(2, 9);
            return {
              q: `1つの へんの 長さが ${a}cm の 正方形が あります。まわりの 長さは 何cm ですか。`,
              ans: 4 * a,
              unit: "cm",
              hint: "正方形の 4つの へんの 長さは みんな 同じ だよ。",
              steps: [`${a}cm の へんが 4つ`, `${a} × 4 = ${4 * a}`, `答え　${4 * a}cm`],
            };
          }
          const a = r(2, 9), b = r(2, 9);
          if (a === b) return { skip: true };
          const ans = 2 * (a + b);
          return {
            q: `たて ${a}cm、よこ ${b}cm の 長方形が あります。まわりの 長さは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: "長方形の むかいあう へんの 長さは 同じ だよ。",
            steps: [`へんは ${a}cm が 2つ、${b}cm が 2つ`, `${a} + ${b} + ${a} + ${b} = ${ans}`, `答え　${ans}cm`],
          };
        }),
        t("E2-zukei-2b", (r) => {
          const a = r(1, 5), b = r(1, 5), ans = 4 * a + b;
          return {
            q: `長方形の 紙が ${a}まいと、直角三角形の 紙が ${b}まい あります。直角の かどは ぜんぶで いくつ ありますか。`,
            ans,
            unit: "こ",
            hint: "長方形 1まい、直角三角形 1まいに 直角は いくつ あるかな。",
            steps: [`長方形は 直角が 4つ：${4} × ${a} = ${4 * a}`, `直角三角形は 直角が 1つ：${b}`, `${4 * a} + ${b} = ${ans}　答え ${ans}こ`],
          };
        }),
      ],
      3: [
        t("E2-zukei-3a", (r) => {
          const a = r(2, 9), p = 4 * a;
          return {
            q: `まわりの 長さが ${p}cm の 正方形が あります。1つの へんの 長さは 何cm ですか。`,
            ans: a,
            unit: "cm",
            hint: "正方形は 同じ 長さの へんが 4つ。4のだんで 考えよう。",
            steps: [`□ × 4 = ${p} に なる □ を さがす`, `${a} × 4 = ${p}`, `答え　${a}cm`],
          };
        }),
        t("E2-zukei-3b", (r) => {
          const a = r(2, 9), b = r(2, 9);
          if (a === b) return { skip: true };
          const p = 2 * (a + b);
          return {
            q: `まわりの 長さが ${p}cm、たての 長さが ${a}cm の 長方形が あります。よこの 長さは 何cm ですか。`,
            ans: b,
            unit: "cm",
            hint: "まわりの 長さから、たての へん 2つ分を ひいて みよう。",
            steps: [`たての へん 2つ分は ${a} + ${a} = ${2 * a}`, `のこり ${p} − ${2 * a} = ${2 * b} が よこの へん 2つ分`, `${b} + ${b} = ${2 * b} なので よこは ${b}cm`],
          };
        }),
        t("E2-zukei-3c", (r) => {
          const m = r(1, 4), n = r(2, 5), s = 2;
          const h = s * m, w = s * n, ans = 2 * (h + w);
          return {
            q: `1つの へんが 2cm の 正方形の 紙を、すきまなく たてに ${m}まい、よこに ${n}まい ならべて、大きな 長方形を つくりました。大きな 長方形の まわりの 長さは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: "大きな 長方形の たてと よこの 長さを まず もとめよう。",
            steps: [`たて ${s} × ${m} = ${h}cm、よこ ${s} × ${n} = ${w}cm`, `${h} + ${w} + ${h} + ${w} = ${ans}`, `答え　${ans}cm`],
          };
        }),
      ],
      4: [
        t("E2-zukei-4a", (r) => {
          const m = r(1, 4), n = r(1, 4), ans = (m + 1) * (n + 1);
          return {
            q: `正方形の 紙を、たての 直線 ${m}本と よこの 直線 ${n}本で 切りわけます（直線は へんから へんまで まっすぐ 引きます）。四角形は いくつ できますか。`,
            ans,
            unit: "こ",
            hint: `たての 直線 ${m}本で、まず いくつに 分かれるかな。`,
            steps: [`たての 直線 ${m}本で ${m + 1}つの れつに 分かれる`, `よこの 直線 ${n}本で それぞれが ${n + 1}つに 分かれる`, `${m + 1} × ${n + 1} = ${ans}　答え ${ans}こ`],
          };
        }),
        t("E2-zukei-4b", (r) => {
          const s = r(1, 3), k = r(2, 9), ans = 2 * (s + s * k);
          return {
            q: `1つの へんが ${s}cm の 正方形を ${k}まい、よこ 1れつに すきまなく ならべて 長方形を つくりました。この 長方形の まわりの 長さは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: "できた 長方形の たてと よこの 長さを 考えよう。",
            steps: [`たては ${s}cm、よこは ${s} × ${k} = ${s * k}cm`, `${s} + ${s * k} + ${s} + ${s * k} = ${ans}`, `答え　${ans}cm`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-bunsu",
    grade: "E2",
    area: "num",
    name: "分数のはじまり",
    desc: "1/2・1/4 の大きさ",
    prereqs: ["E2-kuku"],
    points: [
      "同じ 大きさに 2つに 分けた 1つ分を「二分の一」と いい、$\\frac{1}{2}$ と 書くよ。",
      "同じ 大きさに 4つに 分けた 1つ分が $\\frac{1}{4}$。$\\frac{1}{4}$ が 2つで $\\frac{1}{2}$ と 同じ 大きさ。",
      "8こ の $\\frac{1}{4}$ は、8こ を 同じ 数ずつ 4つに 分けた 1つ分で 2こ。",
    ],
    levels: {
      1: [
        t("E2-bunsu-1a", (r) => {
          const n = pick(r, [2, 3, 4, 8]);
          const ok = frac(1, n);
          return {
            q: `同じ 大きさに ${n}つに 分けた 1つ分の 大きさを、分数で 書くと どれですか。`,
            choices: choices4(r, ok, [frac(n, 1), frac(2, n), frac(1, n + 1), frac(1, 2 * n)]),
            ans: ok,
            hint: "分けた 数を 下に、そのうちの いくつ分かを 上に 書くよ。",
            steps: [`${n}つに 分けた 1つ分`, `答え　${ok}`],
          };
        }),
        t("E2-bunsu-1b", (r) => {
          const k = r(1, 9), a = 2 * k;
          return {
            q: `${a}こ の ${frac(1, 2)} は 何こですか。`,
            ans: k,
            unit: "こ",
            hint: `${a}こ を 同じ 数ずつ 2つに 分けよう。`,
            steps: [`${a}こ を 同じ 数ずつ 2つに 分ける`, `${k} + ${k} = ${a} なので 1つ分は ${k}こ`],
          };
        }),
      ],
      2: [
        t("E2-bunsu-2a", (r) => {
          const n = pick(r, [2, 4, 8]), k = r(1, 9), a = n * k;
          return {
            q: `${a}cm の テープの ${frac(1, n)} の 長さは 何cm ですか。`,
            ans: k,
            unit: "cm",
            hint: `${a}cm を 同じ 長さずつ ${n}つに 分けよう。${n}のだんの 九九が つかえるよ。`,
            steps: [`${n}つに 分けた 1つ分`, `${n} × ${k} = ${a} なので 1つ分は ${k}cm`],
          };
        }),
        t("E2-bunsu-2b", (r) => {
          const [small, big, ans, why] = pick(r, [
            [4, 2, 2, "4つに 分けた 2つ分が 半分"],
            [8, 2, 4, "8つに 分けた 4つ分が 半分"],
            [8, 4, 2, "8つに 分けた 2つ分が 4つに 分けた 1つ分"],
            [2, 1, 2, "2つ あつめると もとの 大きさ"],
            [4, 1, 4, "4つ あつめると もとの 大きさ"],
            [8, 1, 8, "8つ あつめると もとの 大きさ"],
          ]);
          return {
            q: big === 1
              ? `${frac(1, small)} を 何こ あつめると、もとの 大きさに なりますか。`
              : `${frac(1, small)} を 何こ あつめると、${frac(1, big)} と 同じ 大きさに なりますか。`,
            ans,
            unit: "こ",
            hint: "紙を おって 分けた ところを 思いうかべよう。",
            steps: [why, `答え　${ans}こ`],
          };
        }),
        t("E2-bunsu-2c", (r) => {
          const k = pick(r, [2, 3, 4, 8]), x = r(2, 5), a = x * k;
          const ok = frac(1, k);
          return {
            q: `${x}こ は、${a}こ の 何分の一ですか。`,
            choices: choices4(r, ok, [frac(1, x), frac(1, a), frac(1, k + 1), frac(1, 2 * k), frac(1, k - 1)].filter((s) => s !== frac(1, 1))),
            ans: ok,
            hint: `${a}こ を ${x}こずつ 分けると、いくつに 分かれるかな。`,
            steps: [`${x} × ${k} = ${a}`, `${a}こ を ${k}つに 分けた 1つ分が ${x}こ`, `答え　${ok}`],
          };
        }),
      ],
      3: [
        t("E2-bunsu-3a", (r) => {
          const n = pick(r, [2, 3, 4, 8]), x = r(2, 9), ans = n * x;
          return {
            q: `ある テープの ${frac(1, n)} の 長さは ${x}cm です。もとの テープの 長さは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: `もとの 長さは、${x}cm の いくつ分かな。`,
            steps: [`${frac(1, n)} は ${n}つに 分けた 1つ分`, `もとの 長さは ${x}cm の ${n}つ分`, `${x} × ${n} = ${ans}　答え ${ans}cm`],
          };
        }),
        t("E2-bunsu-3b", (r) => {
          const k = r(1, 6), a = 4 * k, half = 2 * k;
          return {
            q: `あめが ${a}こ あります。その ${frac(1, 2)} を 食べました。のこりの ${frac(1, 2)} を 弟に あげました。いま 何こ のこって いますか。`,
            ans: k,
            unit: "こ",
            hint: "まず、はじめに 食べた あとの のこりを もとめよう。",
            steps: [`${a}こ の ${frac(1, 2)} は ${half}こ。食べた のこりは ${half}こ`, `${half}こ の ${frac(1, 2)} は ${k}こ を 弟に あげる`, `のこりは ${half} − ${k} = ${k}　答え ${k}こ`],
          };
        }),
        t("E2-bunsu-3c", (r) => {
          const a = 4 * r(1, 6), b = 2 * r(1, 9);
          const x = a / 4, y = b / 2;
          if (x === y) return { skip: true };
          const ans = Math.abs(x - y);
          return {
            q: `${a}こ の ${frac(1, 4)} と、${b}こ の ${frac(1, 2)} の ちがいは 何こですか。`,
            ans,
            unit: "こ",
            hint: "それぞれ 何こ に なるかを 先に もとめよう。",
            steps: [`${a}こ の ${frac(1, 4)} は ${x}こ`, `${b}こ の ${frac(1, 2)} は ${y}こ`, `ちがいは ${Math.max(x, y)} − ${Math.min(x, y)} = ${ans}　答え ${ans}こ`],
          };
        }),
      ],
      4: [
        t("E2-bunsu-4a", (r) => {
          const n = r(2, 4), parts = 2 ** n;
          if (r(0, 1)) {
            return {
              q: `正方形の おり紙を、半分に おる ことを ${n}回 くりかえしてから ひらきました。おり目で 同じ 大きさの 形に いくつに 分かれて いますか。`,
              ans: parts,
              unit: "こ",
              hint: "1回 おるごとに、分かれる 数は どう かわるかな。",
              steps: [`1回 おるごとに 分かれる 数は 2ばいに なる`, `${range(1, n).map((i) => 2 ** i).join(" → ")}`, `答え　${parts}こ`],
            };
          }
          const ok = frac(1, parts);
          return {
            q: `正方形の おり紙を、半分に おる ことを ${n}回 くりかえしてから ひらきました。おり目で 分かれた 1つ分は、もとの おり紙の 何分の一ですか。`,
            choices: choices4(r, ok, [frac(1, 2 * n), frac(1, n + 1), frac(1, 2 * parts), frac(1, parts / 2), frac(1, parts + 2)].filter((s) => s !== frac(1, 1)), (i) => frac(1, [3, 6, 10, 12, 5, 32][i % 6])),
            ans: ok,
            hint: "1回 おるごとに、分かれる 数は どう かわるかな。",
            steps: [`1回 おるごとに 分かれる 数は 2ばい：${range(1, n).map((i) => 2 ** i).join(" → ")}`, `${parts}こ に 分かれるので 1つ分は ${ok}`],
          };
        }),
      ],
    },
  },

  // ────────────────────────────────────────────────────────
  {
    id: "E2-hyo",
    grade: "E2",
    area: "data",
    name: "表とグラフ",
    desc: "数を数えて表・グラフにする",
    prereqs: ["E1-100"],
    points: [
      "しらべる ときは、しゅるいごとに 分けて 数えると まちがえにくいよ。",
      "数えた ものに しるしを つけると、数えわすれや 2回 数える まちがいを ふせげる。",
      "ひょうに すると 数が わかりやすく、○の グラフに すると 多い 少ないが 一目で わかる。",
    ],
    levels: {
      1: [
        t("E2-hyo-1a", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 3);
          const counts = items.map(() => r(1, 5));
          const list = shuffle(r, items.flatMap((it, i) => Array(counts[i]).fill(it)));
          const j = r(0, 2);
          return {
            q: `${C.what}を 1人 1つずつ 聞いたら、答えは じゅんに「${list.join("、")}」でした。${items[j]}と 答えた 人は 何人ですか。`,
            ans: counts[j],
            unit: "人",
            hint: `${items[j]}に しるしを つけながら 数えよう。`,
            steps: [`しゅるいごとに 数えると ${items.map((it, i) => `${it} ${counts[i]}人`).join("、")}`, `${items[j]}は ${counts[j]}人`],
          };
        }),
        t("E2-hyo-1b", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 4);
          const counts = sample(r, range(2, 12), 4);
          const most = r(0, 1) === 1;
          const target = most ? Math.max(...counts) : Math.min(...counts);
          const ok = items[counts.indexOf(target)];
          return {
            q: `${C.what}を しらべて ひょうに しました。${tableText(items, counts)}。いちばん ${most ? "多い" : "少ない"}のは どれですか。`,
            choices: choices4(r, ok, items.filter((x) => x !== ok)),
            ans: ok,
            hint: "ひょうの 数を くらべよう。",
            steps: [`いちばん ${most ? "多い" : "少ない"}のは ${target}人`, `答え　${ok}`],
          };
        }),
      ],
      2: [
        t("E2-hyo-2a", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 4);
          const counts = items.map(() => r(2, 12));
          const s = counts.reduce((p, q) => p + q, 0);
          return {
            q: `${C.what}を しらべて ひょうに しました。${tableText(items, counts)}。しらべた 人は ぜんぶで 何人ですか。`,
            ans: s,
            unit: "人",
            hint: "ひょうの 数を ぜんぶ たそう。",
            steps: [`${counts.join(" + ")} = ${s}`, `答え　${s}人`],
          };
        }),
        t("E2-hyo-2b", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 4);
          const counts = sample(r, range(2, 15), 4);
          const [i, j] = sample(r, [0, 1, 2, 3], 2);
          const [a, b] = counts[i] > counts[j] ? [i, j] : [j, i];
          const d = counts[a] - counts[b];
          return {
            q: `${C.what}を しらべて ひょうに しました。${tableText(items, counts)}。${items[a]}は ${items[b]}より 何人 多いですか。`,
            ans: d,
            unit: "人",
            hint: "2つの 数の ちがいを もとめよう。",
            steps: [`${items[a]} ${counts[a]}人、${items[b]} ${counts[b]}人`, `${counts[a]} − ${counts[b]} = ${d}　答え ${d}人`],
          };
        }),
        t("E2-hyo-2c", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 4);
          const counts = items.map(() => r(1, 9));
          const mx = Math.max(...counts), mn = Math.min(...counts);
          if (mx === mn) return { skip: true };
          return {
            q: `${C.what}を しらべて、1人を ○ 1こ として ○の グラフに しました。○の 数は、${items.map((it, i) => `${it} ${counts[i]}こ`).join("、")} です。いちばん 多い ものと いちばん 少ない ものの ちがいは 何人ですか。`,
            ans: mx - mn,
            unit: "人",
            hint: "○が いちばん 高い ものと いちばん ひくい ものを 見つけよう。",
            steps: [`いちばん 多いのは ${mx}人、いちばん 少ないのは ${mn}人`, `${mx} − ${mn} = ${mx - mn}　答え ${mx - mn}人`],
          };
        }),
      ],
      3: [
        t("E2-hyo-3a", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 4);
          const counts = items.map(() => r(2, 9));
          const n = counts.reduce((p, q) => p + q, 0);
          return {
            q: `クラスの ${n}人に ${C.what}を 1人 1つずつ 聞きました。${items.slice(0, 3).map((it, i) => `${it} ${counts[i]}人`).join("、")}で、のこりの 人は みんな ${items[3]}でした。${items[3]}と 答えた 人は 何人ですか。`,
            ans: counts[3],
            unit: "人",
            hint: "わかって いる 人数を 先に たして みよう。",
            steps: [`${counts.slice(0, 3).join(" + ")} = ${n - counts[3]}`, `${n} − ${n - counts[3]} = ${counts[3]}`, `答え　${counts[3]}人`],
          };
        }),
        t("E2-hyo-3b", (r) => {
          const C = pick(r, HYO_SETS);
          const items = sample(r, C.items, 3);
          const counts = items.map(() => r(3, 12));
          const mx = Math.max(counts[1], counts[2]);
          if (counts[0] >= mx) return { skip: true };
          const ans = mx - counts[0] + 1;
          return {
            q: `${C.what}を しらべました。${tableText(items, counts)}。${items[0]}と 答える 人が あと 何人 ふえると、${items[0]}が ただ 1つ いちばん 多く なりますか。いちばん 少ない 人数を 答えましょう。`,
            ans,
            unit: "人",
            hint: "いまの いちばん 多い 人数と 同じに なるだけでは、まだ「ただ 1つ」では ないね。",
            steps: [`いま いちばん 多いのは ${mx}人`, `${items[0]}が ${mx + 1}人 に なれば ただ 1つ いちばん 多い`, `${mx + 1} − ${counts[0]} = ${ans}　答え ${ans}人`],
          };
        }),
      ],
      4: [
        t("E2-hyo-4a", (r) => {
          const both = r(1, 5), a = both + r(1, 8), b = both + r(1, 8);
          const ans = a + b - both;
          return {
            q: `クラスで、犬を かって いる 人と ねこを かって いる 人を しらべました。犬を かって いる 人は ${a}人、ねこを かって いる 人は ${b}人 で、そのうち 犬と ねこの りょうほうを かって いる 人は ${both}人 でした。犬か ねこを かって いる 人は（りょうほう かって いる 人も 入れて）ぜんぶで 何人ですか。`,
            ans,
            unit: "人",
            hint: `${a} + ${b} では、りょうほう かって いる 人を 2回 数えて いるよ。`,
            steps: [`${a} + ${b} = ${a + b} は、りょうほうの ${both}人を 2回 数えて いる`, `${a + b} − ${both} = ${ans}`, `答え　${ans}人`],
          };
        }),
      ],
    },
  },
];
