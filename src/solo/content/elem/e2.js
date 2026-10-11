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

// ── 場面を ふやす ための 一覧 ─────────────────────────────
const NAMES = ["ゆい", "けん", "はると", "さくら", "そうた", "めい", "りく", "あおい", "ひなた", "ゆうま", "こはる", "たくみ"];
/** ちがう 名前を k こ（〜さん を つけて つかう） */
const names = (r, k = 2) => sample(r, NAMES, k);
/** もの・数え方・うごき（v：〜ました／います、vq：〜ましたか／いますか） */
const THINGS = [
  { it: "どんぐり", c: "こ", v: "ひろいました", vq: "ひろいましたか" },
  { it: "くり", c: "こ", v: "ひろいました", vq: "ひろいましたか" },
  { it: "シール", c: "まい", v: "もって います", vq: "もって いますか" },
  { it: "カード", c: "まい", v: "もって います", vq: "もって いますか" },
  { it: "色紙", c: "まい", v: "もって います", vq: "もって いますか" },
  { it: "ビー玉", c: "こ", v: "もって います", vq: "もって いますか" },
];
/** 漢数字（1万 未満）　4070 → 四千七十 */
const KD = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const kan = (n) =>
  [[1000, "千"], [100, "百"], [10, "十"], [1, ""]]
    .map(([p, s]) => {
      const d = Math.floor(n / p) % 10;
      return d === 0 ? "" : (d === 1 && p > 1 ? "" : KD[d]) + s;
    })
    .join("");
/** 分数の 読み方に つかう 漢数字 */
const KN = { 2: "二", 3: "三", 4: "四", 8: "八" };
/** 0時からの 分 → 3時25分 */
const jifT = (t) => jif(Math.floor(t / 60), t % 60);

/** 量の 見当：[もの, 数, 正しい たんい, はっきり おかしい たんい] */
const MIERU = [
  ["えんぴつの 長さ", 17, "cm", ["mm", "m"]],
  ["教室の たての 長さ", 9, "m", ["mm", "cm"]],
  ["プールの たての 長さ", 25, "m", ["mm", "cm"]],
  ["ノートの あつさ", 5, "mm", ["cm", "m"]],
  ["つくえの 高さ", 70, "cm", ["mm", "m"]],
  ["はがきの よこの 長さ", 10, "cm", ["mm", "m"]],
  ["ありの 体の 長さ", 4, "mm", ["cm", "m"]],
  ["2年生の しん長", 120, "cm", ["mm", "m"]],
  ["学校の たてものの 高さ", 12, "m", ["mm", "cm"]],
  ["コップ 1ぱいの 水の かさ", 2, "dL", ["mL", "L"]],
  ["やかんに 入る 水の かさ", 2, "L", ["mL", "dL"]],
  ["かんジュース 1本の かさ", 350, "mL", ["dL", "L"]],
  ["大きな 牛にゅうパックの かさ", 1, "L", ["mL", "dL"]],
  ["水とうに 入る 水の かさ", 8, "dL", ["mL", "L"]],
  ["大きな ペットボトルの かさ", 2, "L", ["mL", "dL"]],
  ["スプーン 1ぱいの 水の かさ", 5, "mL", ["dL", "L"]],
];
const isLen = (m) => ["mm", "cm", "m"].includes(m[2]);

/** 図形の やくそく（T：正しい、F：まちがい） */
const PROP = {
  長方形: {
    T: ["4つの かどは みんな 直角", "むかいあう へんの 長さは 同じ", "へんは 4本、ちょう点は 4つ"],
    F: ["4つの へんの 長さは いつも みんな 同じ", "直角の かどは 2つ だけ", "むかいあう へんの 長さは ちがう", "ちょう点は 3つ"],
  },
  正方形: {
    T: ["4つの かどは みんな 直角", "4つの へんの 長さは みんな 同じ", "へんは 4本、ちょう点は 4つ"],
    F: ["直角の かどは 1つ だけ", "となりあう へんの 長さは いつも ちがう", "へんは 3本", "4つの かどの うち 2つは 直角では ない"],
  },
  直角三角形: {
    T: ["直角の かどが 1つ ある", "へんは 3本、ちょう点は 3つ", "三角形の なかま"],
    F: ["直角の かどが 2つ ある", "へんが 4本 ある", "3つの かどが みんな 直角", "ちょう点が 4つ ある"],
  },
};

// 曜日ごとの しらべ
const DAY5 = ["月", "火", "水", "木", "金"];
const WEEK_SETS = [
  { what: "図書室で 本を かりた 人の 数", c: "人" },
  { what: "休み時間に 校ていで あそんだ 人の 数", c: "人" },
  { what: "朝 早く 学校に 来た 人の 数", c: "人" },
  { what: "ほけん室に 来た 人の 数", c: "人" },
];
/** 月 8人、火 6人、… */
const dayText = (cs, c) => DAY5.map((d, i) => `${d} ${cs[i]}${c}`).join("、");

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
        t("E2-hissan-1c", (r) => {
          const b = r(2, 9);
          if (r(0, 1)) {
            const T = r(2, 8), o = r(0, 9), a = 10 * T + o, s = a + b, carry = o + b >= 10;
            return {
              q: `${a} + ${b} を ひっ算で 計算します。答えは どれですか。`,
              choices: nc(r, s, [a + 10 * b, carry ? s - 10 : s + 10, s + 1], 1),
              ans: s,
              hint: `ひっ算では、${b} を 一のくらいに そろえて 書こう。`,
              steps: [
                `${b} は 一のくらいに そろえて 書く`,
                `一のくらい　${o} + ${b} = ${o + b}${carry ? "（十のくらいに 1 くり上げる）" : ""}`,
                carry ? `十のくらい　${T} + 1 = ${T + 1}` : `十のくらい　${T} を そのまま おろす`,
                `答え　${s}`,
              ],
            };
          }
          const a = 10 * r(2, 9) + r(0, 9), d = a - b, borrow = a % 10 < b;
          return {
            q: `${a} − ${b} を ひっ算で 計算します。答えは どれですか。`,
            choices: nc(r, d, [a - 10 * b, borrow ? d + 10 : d - 10, borrow ? absDigitDiff(a, b) : d + 1], 1),
            ans: d,
            hint: `ひっ算では、${b} を 一のくらいに そろえて 書こう。`,
            steps: [`${b} は 一のくらいに そろえて 書く`, ...subSteps(a, b)],
          };
        }),
        t("E2-hissan-1d", (r) => {
          const [A, B] = names(r), T = pick(r, THINGS);
          const x = r(25, 98), y = r(11, x - 6), d = x - y;
          const ty = r(1, 3);
          const ask =
            ty === 1 ? `${A}さんは ${B}さんより 何${T.c} 多く ${T.vq}。`
              : ty === 2 ? `${B}さんは ${A}さんより 何${T.c} 少ないですか。`
                : `2人の 数の ちがいは 何${T.c}ですか。`;
          return {
            q: `${T.it}を、${A}さんは ${x}${T.c}、${B}さんは ${y}${T.c} ${T.v}。${ask}`,
            ans: d,
            unit: T.c,
            hint: "「どれだけ 多い」「どれだけ 少ない」「ちがい」は、ひき算で もとめるよ。",
            steps: ["多い ほうから 少ない ほうを ひく", `しき　${x} − ${y} = ${d}`, `答え　${d}${T.c}`],
          };
        }),
        t("E2-hissan-1e", (r) => {
          if (r(0, 2) > 0) {
            const a = r(30, 99), b = r(11, a - 12), c = a - b;
            if (b === c) return { skip: true };
            const ok = `${c} + ${b} = ${a}`;
            return {
              q: `${a} − ${b} = ${c} の 答えの たしかめに なる 計算は どれですか。`,
              choices: choices4(r, ok, [`${a} + ${b} = ${a + b}`, `${a} + ${c} = ${a + c}`, c > b ? `${c} − ${b} = ${c - b}` : `${b} − ${c} = ${b - c}`]),
              ans: ok,
              hint: "ひき算の 答えの たしかめは、たし算で できるよ。",
              steps: ["答え ＋ ひく数 ＝ ひかれる数 に なれば 正しい", `${c} + ${b} = ${a} で、ひかれる数の ${a} に なる`],
            };
          }
          const a = r(15, 70), b = r(11, 98 - a);
          if (a === b) return { skip: true };
          const s = a + b, ok = `${b} + ${a} = ${s}`;
          return {
            q: `${a} + ${b} = ${s} の 答えの たしかめに なる 計算は どれですか。`,
            choices: choices4(r, ok, [`${s} + ${b} = ${s + b}`, `${s} + ${a} = ${s + a}`, a > b ? `${a} − ${b} = ${a - b}` : `${b} − ${a} = ${b - a}`]),
            ans: ok,
            hint: "たされる数と たす数を 入れかえて 計算しても、答えは 同じに なるよ。",
            steps: ["たされる数と たす数を 入れかえて 計算する", `${b} + ${a} = ${s} で、同じ 答えに なる`],
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
        t("E2-hissan-2d", (r) => {
          const nm = pick(r, NAMES);
          if (r(0, 1)) {
            const D = ["くり上げた 1 を たして いない", "くらいを そろえずに 書いて いる", "くり上がりが ない のに、1 くり上げて いる", "一のくらいの 答えを、2けたの まま 書いて いる"];
            const ty = r(0, 3);
            let A, x, B, y;
            if (ty === 1) { A = r(2, 7); x = r(0, 9); B = 0; y = r(2, 9 - A); }
            else {
              A = r(1, 7); B = r(1, 8 - A);
              if (ty === 2) { x = r(0, 8); y = r(1, 9 - x); } else { x = r(2, 9); y = r(10 - x, 9); }
            }
            const a = 10 * A + x, b = 10 * B + y, s = a + b, carry = x + y >= 10;
            const vals = [carry ? s - 10 : null, a + 10 * b, carry ? null : s + 10, carry ? (A + B) * 100 + x + y : null];
            const w = vals[ty];
            if (w == null || vals.some((v, i) => i !== ty && v === w)) return { skip: true };
            const why = [
              `一のくらいは ${x} + ${y} = ${x + y} で、十のくらいに 1 くり上げる`,
              `${b} は 一のくらいに そろえて 書く`,
              `一のくらいは ${x} + ${y} = ${x + y} で、くり上がりは ない`,
              `一のくらいは ${x} + ${y} = ${x + y}。${(x + y) % 10} を 書いて、1 は 十のくらいに くり上げる`,
            ][ty];
            return {
              q: `${nm}さんは ${a} + ${b} を ひっ算で 計算して、答えを ${w} と しました。どんな まちがいを して いますか。`,
              choices: choices4(r, D[ty], D.filter((_, i) => i !== ty)),
              ans: D[ty],
              hint: `自分で ひっ算を して、${nm}さんの 答えと くらべよう。`,
              steps: [`正しく 計算すると ${a} + ${b} = ${s}`, why, `${nm}さんは「${D[ty]}」`],
            };
          }
          const D = ["くり下げた のに、十のくらいを 1 へらして いない", "一のくらいで、ひく数から ひかれる数を ひいて いる", "くらいを そろえずに 書いて いる", "くり下げなくて よい のに、くり下げて いる"];
          const ty = r(0, 3);
          let A, x, B, y;
          if (ty === 2) { B = 0; y = r(2, 8); A = r(y + 1, 9); x = r(0, 9); }
          else if (ty === 3) { A = r(3, 9); B = r(1, A - 2); x = r(1, 9); y = r(0, x - 1); }
          else { A = r(2, 9); B = r(1, A - 1); x = r(0, 8); y = r(x + 1, 9); }
          const a = 10 * A + x, b = 10 * B + y, d = a - b, borrow = x < y;
          const vals = [borrow ? d + 10 : null, borrow ? absDigitDiff(a, b) : null, a - 10 * b > 0 ? a - 10 * b : null, !borrow && d - 10 > 0 ? d - 10 : null];
          const w = vals[ty];
          if (w == null || vals.some((v, i) => i !== ty && v === w)) return { skip: true };
          const why = [
            `一のくらいで 1 くり下げたので、十のくらいは ${A} − 1 = ${A - 1} に なる`,
            `一のくらいは ${x} − ${y} が できないので、くり下げて ${x + 10} − ${y} = ${x + 10 - y}`,
            `${b} は 一のくらいに そろえて 書く`,
            `一のくらいは ${x} − ${y} = ${x - y} で、くり下げなくて よい`,
          ][ty];
          return {
            q: `${nm}さんは ${a} − ${b} を ひっ算で 計算して、答えを ${w} と しました。どんな まちがいを して いますか。`,
            choices: choices4(r, D[ty], D.filter((_, i) => i !== ty)),
            ans: D[ty],
            hint: `自分で ひっ算を して、${nm}さんの 答えと くらべよう。`,
            steps: [`正しく 計算すると ${a} − ${b} = ${d}`, why, `${nm}さんは「${D[ty]}」`],
          };
        }),
        t("E2-hissan-2e", (r) => {
          const bo = r(1, 9), b = 10 * r(1, 3) + bo, c = 10 - bo, a = r(12, 59);
          const bc = b + c, s = a + bc;
          const paren = r(0, 1) === 1;
          return {
            q: paren ? `${a} + (${b} + ${c}) を 計算しよう。` : `${a} + ${b} + ${c} を くふうして 計算しよう。`,
            ans: s,
            hint: paren ? "( ) の 中を 先に 計算しよう。" : `うしろの 2つを 先に たすと、ちょうど 何十に なるよ。`,
            steps: [
              paren ? `( ) の 中を 先に 計算する　${b} + ${c} = ${bc}` : `${a} + (${b} + ${c}) と して、${b} + ${c} = ${bc} を 先に 計算する`,
              `${a} + ${bc} = ${s}`,
              `答え　${s}`,
            ],
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
        t("E2-hissan-3d", (r) => {
          const nm = pick(r, NAMES);
          const hint = "わからない 数を □ に して、お話の とおりに しきに 書いて みよう。";
          const ty = r(1, 4);
          if (ty === 1) {
            const b = r(12, 45), c = r(12, 99 - b), x = b + c;
            return {
              q: `${nm}さんは 色紙を 何まいか もって いました。妹に ${b}まい あげたので、のこりが ${c}まいに なりました。はじめに 何まい もって いましたか。`,
              ans: x,
              unit: "まい",
              hint,
              steps: [`はじめの 数を □ と すると　□ − ${b} = ${c}`, `□ は のこりと あげた 数を あわせた 数で　${c} + ${b} = ${x}`, `答え　${x}まい`],
            };
          }
          if (ty === 2) {
            const b = r(12, 40), x = r(12, 99 - b), c = x + b;
            return {
              q: `電車に 何人か のって いました。えきで ${b}人 のって きたので、みんなで ${c}人に なりました。はじめに 何人 のって いましたか。`,
              ans: x,
              unit: "人",
              hint,
              steps: [`はじめの 人数を □ と すると　□ + ${b} = ${c}`, `□ は　${c} − ${b} = ${x}`, `答え　${x}人`],
            };
          }
          if (ty === 3) {
            const a = r(40, 99), c = r(11, a - 12), x = a - c;
            return {
              q: `${nm}さんは どんぐりを ${a}こ もって いました。弟に 何こか あげたので、のこりが ${c}こに なりました。弟に 何こ あげましたか。`,
              ans: x,
              unit: "こ",
              hint,
              steps: [`あげた 数を □ と すると　${a} − □ = ${c}`, `□ は　${a} − ${c} = ${x}`, `答え　${x}こ`],
            };
          }
          const a = r(12, 60), x = r(12, 99 - a), c = a + x;
          return {
            q: `校ていで 子どもが ${a}人 あそんで いました。そこへ 何人か 来たので、みんなで ${c}人に なりました。あとから 来たのは 何人ですか。`,
            ans: x,
            unit: "人",
            hint,
            steps: [`あとから 来た 人数を □ と すると　${a} + □ = ${c}`, `□ は　${c} − ${a} = ${x}`, `答え　${x}人`],
          };
        }),
        t("E2-hissan-3e", (r) => {
          const [A, B] = names(r), T = pick(r, THINGS);
          const d = r(11, 39);
          const hint = "どちらが 多いのかを まず たしかめよう。ことばだけで たし算か ひき算かを きめないように。";
          if (r(0, 1)) {
            const x = r(d + 12, 99), y = x - d;
            return {
              q: `${A}さんは ${T.it}を ${x}${T.c} ${T.v}。これは ${B}さんより ${d}${T.c} 多い 数です。${B}さんは ${T.it}を 何${T.c} ${T.vq}。`,
              ans: y,
              unit: T.c,
              hint,
              steps: [`${A}さんの ほうが ${d}${T.c} 多いので、${B}さんは ${A}さんより ${d}${T.c} 少ない`, `しき　${x} − ${d} = ${y}`, `答え　${y}${T.c}`],
            };
          }
          const x = r(12, 99 - d), y = x + d;
          return {
            q: `${A}さんは ${T.it}を ${x}${T.c} ${T.v}。これは ${B}さんより ${d}${T.c} 少ない 数です。${B}さんは ${T.it}を 何${T.c} ${T.vq}。`,
            ans: y,
            unit: T.c,
            hint,
            steps: [`${A}さんの ほうが ${d}${T.c} 少ないので、${B}さんは ${A}さんより ${d}${T.c} 多い`, `しき　${x} + ${d} = ${y}`, `答え　${y}${T.c}`],
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
        t("E2-1000-1c", (r) => {
          const four = r(0, 2) > 0;
          const pat = four
            ? pick(r, [[1, 0, 1, 1], [1, 1, 0, 1], [1, 0, 0, 1], [1, 0, 1, 0], [1, 1, 0, 0], [1, 1, 1, 0]])
            : pick(r, [[1, 0, 1], [1, 1, 0]]);
          const ds = pat.map((on) => (on ? r(1, 9) : 0));
          const n = Number(ds.join("")), len = ds.length;
          // よく ある まちがい：0 を 1つ わすれる・数字の 場所が ずれる・聞いた とおりに ならべる
          const drop = Number(ds.join("").replace("0", ""));
          const swaps = [];
          for (let i = 1; i < len - 1; i++) {
            if ((ds[i] === 0) !== (ds[i + 1] === 0)) {
              const e = [...ds];
              [e[i], e[i + 1]] = [e[i + 1], e[i]];
              swaps.push(Number(e.join("")));
            }
          }
          const cat = ds.map((d, i) => (d ? String(d * 10 ** (len - 1 - i)) : "")).join("");
          const traps = [drop, ...shuffle(r, swaps), cat.length <= 5 ? Number(cat) : null];
          const place = (four ? ["千", "百", "十", "一"] : ["百", "十", "一"]).map((p, i) => `${p}のくらい ${ds[i]}`).join("、");
          if (r(0, 1)) {
            return {
              q: `「${kan(n)}」を 数字で 書くと どれですか。`,
              choices: nc(r, n, traps, 1),
              ans: n,
              hint: "数字の ない くらいには 0 を 書くよ。上の くらいから じゅんに たしかめよう。",
              steps: [place, `答え　${n}`],
            };
          }
          const ok = kan(n);
          return {
            q: `${n} を かん字で 書くと どれですか。`,
            choices: choices4(r, ok, [drop, ...swaps].map(kan), (i) => kan(n + [10, 100, -10, 1, -1][i % 5])),
            ans: ok,
            hint: "0 の くらいは 読まないよ。上の くらいから じゅんに たしかめよう。",
            steps: [place, `答え　${ok}`],
          };
        }),
        t("E2-1000-1d", (r) => {
          let x, y, why;
          if (r(0, 4) === 0) {
            x = r(950, 999);
            y = r(1000, 1050);
            if (r(0, 1)) [x, y] = [y, x];
            why = `${Math.min(x, y)} は 3けた、${Math.max(x, y)} は 4けた`;
          } else {
            const four = r(0, 1) === 1, len = four ? 4 : 3;
            x = four ? r(1000, 9999) : r(100, 999);
            const xs = String(x).split("").map(Number), ys = [...xs];
            const p = r(0, 3) > 0 ? r(1, len - 1) : 0; // 左から p ばんめの くらいで ちがう
            let nd;
            do nd = p === 0 ? r(1, 9) : r(0, 9); while (nd === xs[p]);
            ys[p] = nd;
            for (let k = p + 1; k < len; k++) ys[k] = r(0, 9);
            y = Number(ys.join(""));
            const same = p === 0 ? "" : p === 1 ? `${PL[len - 1]}のくらいは 同じ。` : `${PL[len - 1]}のくらいから ${PL[len - p]}のくらいまでは 同じ。`;
            why = `${same}${PL[len - 1 - p]}のくらいで くらべると ${xs[p]} と ${ys[p]}`;
          }
          const ok = x > y ? ">" : "<";
          return {
            q: `□ に 入る きごうは どれですか。　${x} □ ${y}`,
            choices: choices4(r, ok, [">", "<", "="]),
            ans: ok,
            hint: "上の くらいから じゅんに くらべよう。「>」「<」は、ひらいて いる ほうが 大きい 数だよ。",
            steps: [why, `${x} の ほうが ${x > y ? "大きい" : "小さい"}ので　${x} ${ok} ${y}`],
          };
        }),
        t("E2-1000-1e", (r) => {
          const step = pick(r, [2, 5, 10, 10, 50, 100, 100, 1000]);
          const up = r(0, 2) > 0;
          let start;
          if (step === 1000) start = up ? 1000 * r(1, 6) : 1000 * r(5, 10);
          else {
            const unitB = step >= 50 ? 1000 : pick(r, [100, 1000]);
            const B = unitB * r(1, 9); // ここを またぐ
            const off = r(1, 3);
            start = up ? B - step * off : B + step * off;
          }
          const seq = range(0, 4).map((k) => start + (up ? 1 : -1) * k * step);
          if (seq.some((v) => v < 1 || v > 10000)) return { skip: true };
          const hole = r(1, 4), ans = seq[hole];
          const shown = seq.map((v, i) => (i === hole ? "□" : v));
          return {
            q: `きまりに したがって 数が ならんで います。□ に 入る 数は いくつですか。　${shown.join("、")}`,
            ans,
            hint: "となりあう 数が、いくつずつ かわって いるかを 見つけよう。",
            steps: [`${step}ずつ ${up ? "大きく" : "小さく"} なって いる`, `□ は　${seq[hole - 1]} ${up ? "+" : "−"} ${step} = ${ans}`],
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
        t("E2-1000-2d", (r) => {
          const u = pick(r, [1, 10, 100]), k = r(2, 9);
          const s = u === 1 ? r(100, 990) : u === 10 ? 10 * r(10, 980) : 100 * r(1, 90);
          const hint = `数直線は、右へ 行くほど 数が 大きく なるよ。1目もりが ${u} で ある ことに 気を つけよう。`;
          const ty = r(1, 3);
          if (ty === 1) {
            const ans = s + u * k;
            if (ans > 10000) return { skip: true };
            return {
              q: `1目もりが ${u} の 数直線が あります。${s} から 右へ ${k}目もり すすんだ ところの 数は いくつですか。`,
              ans,
              hint,
              steps: [`1目もりが ${u} なので、${k}目もりで ${u * k}`, `${s} + ${u * k} = ${ans}`],
            };
          }
          if (ty === 2) {
            const ans = s - u * k;
            if (ans < 0) return { skip: true };
            return {
              q: `1目もりが ${u} の 数直線が あります。${s} から 左へ ${k}目もり もどった ところの 数は いくつですか。`,
              ans,
              hint,
              steps: [`1目もりが ${u} なので、${k}目もりで ${u * k}`, `${s} − ${u * k} = ${ans}`],
            };
          }
          const t2 = s + u * k;
          if (t2 > 10000) return { skip: true };
          return {
            q: `1目もりが ${u} の 数直線で、${s} の 目もりから ${t2} の 目もりまでは、何目もり ありますか。`,
            ans: k,
            unit: "目もり",
            hint,
            steps: [`${t2} と ${s} の ちがいは ${t2 - s}`, `${u} の ${k}つ分が ${t2 - s} なので ${k}目もり`],
          };
        }),
        t("E2-1000-2e", (r) => {
          const u = pick(r, [10, 100]);
          let L, v;
          const ty = r(1, 3);
          if (ty === 1) {
            const a = r(1, 9), b = r(1, Math.max(1, (u === 10 ? 15 : 10) - a));
            L = `${u * a} + ${u * b}`; v = u * (a + b);
          } else if (ty === 2) {
            const a = r(3, u === 10 ? 15 : 9), b = r(1, a - 1);
            L = `${u * a} − ${u * b}`; v = u * (a - b);
          } else {
            const b = r(1, 9);
            L = `1000 − ${100 * b}`; v = 1000 - 100 * b;
          }
          const rel = r(0, 2), du = ty === 3 ? 100 : u;
          const R = rel === 0 ? v : rel === 1 ? v - du * r(1, 2) : v + du * r(1, 2);
          if (R <= 0) return { skip: true };
          const ok = v > R ? ">" : v < R ? "<" : "=";
          return {
            q: `□ に 入る きごうは どれですか。　${L} □ ${R}`,
            choices: choices4(r, ok, [">", "<", "="]),
            ans: ok,
            hint: "左の しきを 先に 計算してから、右の 数と くらべよう。",
            steps: [`${L} = ${v}`, `${v} と ${R} を くらべると　${L} ${ok} ${R}`],
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
        t("E2-1000-3d", (r) => {
          const ty = r(1, 3);
          let n, M;
          if (ty === 1) {
            const th = r(1, 8);
            n = 1000 * th + 100 * r(1, 9);
            M = 1000 * (th + 1);
          } else if (ty === 2) {
            n = 10 * r(50, 99);
            if (n % 100 === 0) n += 10 * r(1, 9);
            M = 1000;
          } else {
            n = 10 * r(990, 999);
            M = 10000;
          }
          const u = n % 100 === 0 ? 100 : 10, ans = M - n;
          const q = pick(r, [
            `${n} は、${M} より いくつ 小さい 数ですか。`,
            `${n} は、あと いくつで ${M} に なりますか。`,
            `${M} は、${n} より いくつ 大きい 数ですか。`,
          ]);
          return {
            q,
            ans,
            hint: `${u} の まとまりで 考えよう。${M} は ${u} が いくつ あつまった 数かな。`,
            steps: [`${M} は ${u} が ${M / u}こ、${n} は ${u} が ${n / u}こ`, `ちがいは ${u} が ${ans / u}こ で ${ans}`, `答え　${ans}`],
          };
        }),
        t("E2-1000-3e", (r) => {
          const T = pick(r, [1000, 100 * r(2, 9), 1000 * r(2, 9)]);
          const ds = sample(r, range(2, 45), 4).sort((p, q) => p - q);
          const signs = [r(0, 4) < 3 ? -1 : 1, ...ds.slice(1).map(() => (r(0, 1) ? 1 : -1))];
          if (signs.every((s) => s === signs[0])) signs[3] = -signs[0];
          const xs = ds.map((d, i) => T + signs[i] * d);
          const ans = xs[0];
          return {
            q: `数直線で、${T} に いちばん 近い 数は どれですか。`,
            choices: choices4(r, ans, xs.slice(1)),
            ans,
            hint: `${T} より 大きい 数も 小さい 数も、${T} との ちがいを 考えよう。`,
            steps: [`${T} との ちがいは　${xs.map((x) => `${x} → ${Math.abs(x - T)}`).join("、")}`, `ちがいが いちばん 小さいのは ${ans}`],
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
        t("E2-1000-4b", (r) => {
          const a = r(0, 5), b = r(10, 39), c = r(0, 1) ? r(11, 49) : r(1, 9);
          const n = 1000 * a + 100 * b + 10 * c;
          if (n > 9999) return { skip: true };
          const parts = [a ? `1000 を ${a}こ` : "", `100 を ${b}こ`, `10 を ${c}こ`].filter(Boolean);
          const split = (k, big, small) => `${big} が ${Math.floor(k / 10)}こ${k % 10 ? ` と ${small} が ${k % 10}こ` : ""}`;
          const tenTxt = c >= 10 ? `10 が ${c}こ は、${split(c, 100, 10)} で ${10 * c}` : `10 が ${c}こ で ${10 * c}`;
          return {
            q: `${parts.join("、")} あわせた 数は いくつですか。`,
            ans: n,
            hint: "100 が 10こで 1000、10 が 10こで 100 に なるね。まとまりを 作りなおそう。",
            steps: [
              `100 が ${b}こ は、${split(b, 1000, 100)} で ${100 * b}`,
              tenTxt,
              `${[a ? 1000 * a : null, 100 * b, 10 * c].filter((x) => x !== null).join(" + ")} = ${n}`,
              `答え　${n}`,
            ],
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
        t("E2-kuku-1c", (r) => {
          const a = r(2, 9), b = r(2, 9), ans = a * b;
          if (r(0, 1)) {
            return {
              q: `${a}cm の ${b}ばいの 長さは 何cm ですか。`,
              ans,
              unit: "cm",
              hint: `${b}ばいは、${b}つ分の こと だよ。`,
              steps: [`${a}cm の ${b}ばいは、${a}cm の ${b}つ分`, `しき　${a} × ${b} = ${ans}`, `答え　${ans}cm`],
            };
          }
          const [A, B] = names(r), T = pick(r, THINGS);
          return {
            q: `${A}さんは ${T.it}を ${a}${T.c} ${T.v}。${B}さんは、${A}さんの ${b}ばいの 数の ${T.it}を ${T.v}。${B}さんは ${T.it}を 何${T.c} ${T.vq}。`,
            ans,
            unit: T.c,
            hint: `${b}ばいは、${b}つ分の こと だよ。`,
            steps: [`${a}${T.c} の ${b}ばいは、${a}${T.c} の ${b}つ分`, `しき　${a} × ${b} = ${ans}`, `答え　${ans}${T.c}`],
          };
        }),
        t("E2-kuku-1d", (r) => {
          const a = r(2, 9), b = r(3, 6);
          const ok = `${a} × ${b}`;
          return {
            q: `${Array(b).fill(a).join(" + ")} を、かけ算の しきに すると どれですか。`,
            choices: choices4(r, ok, [`${a} × ${b + 1}`, `${a} × ${b - 1}`, `${a} + ${b}`, `${a} × ${a}`].filter((s) => s !== `${b} × ${a}`)),
            ans: ok,
            hint: `${a} が いくつ ならんで いるかを 数えよう。`,
            steps: [`${a} が ${b}つ ある`, `${a} の ${b}つ分 なので　${ok}`, `答えは ${a * b}`],
          };
        }),
        t("E2-kuku-1e", (r) => {
          const a = r(2, 9), s = r(1, 5), hole = r(1, 4);
          const xs = range(s, s + 4).map((k) => a * k), ans = xs[hole];
          const shown = xs.map((x, i) => (i === hole ? "□" : x)).join("、");
          const named = r(0, 1) === 1;
          return {
            q: named
              ? `${a}のだんの 九九の 答えを じゅんに ならべました。□ に 入る 数は いくつですか。　${shown}`
              : `九九の ある だんの 答えを じゅんに ならべました。□ に 入る 数は いくつですか。　${shown}`,
            ans,
            hint: named ? `${a}のだんの 答えは、いくつずつ ふえて いくかな。` : "となりあう 数が いくつずつ ふえて いるかを 見て、何のだんかを 考えよう。",
            steps: [`${a}のだんの 答えは ${a} ずつ ふえる`, `□ は　${a} × ${s + hole} = ${ans}`],
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
        t("E2-kuku-2d", (r) => {
          const a = r(2, 9), b = r(2, 9);
          const lo = Math.min(a, b), hi = a === b ? a + r(2, 5) : Math.max(a, b);
          const S = pick(r, [
            {
              ok: `1ふくろに あめが ${a}こずつ 入って いて、${b}ふくろ あります。あめは ぜんぶで 何こ？`,
              why: [`${a}こずつ`, `${b}ふくろ`],
              w: [`あめが ${a}こ あって、${b}こ もらいました。あめは ぜんぶで 何こ？`, `赤い あめが ${a}こ、青い あめが ${b}こ あります。あわせて 何こ？`, `あめが ${hi}こ あって、${lo}こ 食べました。のこりは 何こ？`],
            },
            {
              ok: `花びんが ${b}つ あり、どの 花びんにも 花が ${a}本ずつ 入って います。花は ぜんぶで 何本？`,
              why: [`${a}本ずつ`, `花びん ${b}つ`],
              w: [`赤い 花が ${a}本、白い 花が ${b}本 さいて います。あわせて 何本？`, `花が ${a}本 さいて いて、あとから ${b}本 さきました。ぜんぶで 何本？`, `花が ${hi}本 あって、${lo}本 つみました。のこりは 何本？`],
            },
            {
              ok: `長いすが ${b}きゃく あり、どの 長いすにも 子どもが ${a}人ずつ すわって います。子どもは みんなで 何人？`,
              why: [`${a}人ずつ`, `長いす ${b}きゃく`],
              w: [`子どもが ${a}人 いて、${b}人 来ました。みんなで 何人？`, `赤い ぼうしの 子どもが ${a}人、白い ぼうしの 子どもが ${b}人 います。みんなで 何人？`, `子どもが ${hi}人 いて、${lo}人 帰りました。のこりは 何人？`],
            },
          ]);
          return {
            q: `しきが ${a} × ${b} に なる お話は どれですか。`,
            choices: choices4(r, S.ok, S.w),
            ans: S.ok,
            hint: "「1つ分の 数」と「いくつ分」が ある お話を さがそう。",
            steps: [`「${S.why[0]}」が 1つ分の 数、「${S.why[1]}」が いくつ分`, `だから しきは ${a} × ${b}`, "ほかの お話は、たし算か ひき算の しきに なる"],
          };
        }),
        t("E2-kuku-2e", (r) => {
          const prod = (s) => s.split(" × ").map(Number).reduce((p, q) => p * q, 1);
          const near = (x, y, n) =>
            [[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y], [x + 1, y - 1], [x - 1, y + 1]]
              .filter(([p, q]) => p >= 1 && p <= 9 && q >= 1 && q <= 9 && p * q !== n)
              .map(([p, q]) => `${p} × ${q}`);
          let n, ok, others, q;
          if (r(0, 1)) {
            const x = r(2, 9), y = r(2, 9);
            n = x * y;
            ok = `${x} × ${y}`;
            others = sample(r, near(x, y, n), 3);
            q = `答えが ${n} に なる 九九は どれですか。`;
          } else {
            n = pick(r, [6, 8, 12, 16, 18, 24, 36]);
            const all = [];
            for (let x = 1; x <= 9; x++) for (let y = 1; y <= 9; y++) if (x * y === n) all.push(`${x} × ${y}`);
            others = sample(r, all, 3);
            const [x, y] = others[0].split(" × ").map(Number);
            ok = pick(r, near(x, y, n));
            q = `答えが ${n} に ならない 九九は どれですか。`;
          }
          const ch = choices4(r, ok, others);
          return {
            q,
            choices: ch,
            ans: ok,
            hint: "1つずつ 九九を となえて、答えを たしかめよう。",
            steps: [ch.map((c) => `${c} = ${prod(c)}`).join("、"), `答え　${ok}`],
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
        t("E2-kuku-3d", (r) => {
          const ty = r(1, 3);
          if (ty === 1) {
            const a = r(2, 9), b = r(10, 12), ans = a * b;
            return {
              q: `${a} × ${b} の 答えを もとめよう。`,
              ans,
              hint: `${a} × 9 の 答えから 考えよう。かける数が 1 ふえると、答えは どう かわるかな。`,
              steps: [
                `${a} × 9 = ${a * 9}`,
                `かける数が 1 ふえると、答えは ${a} ふえる`,
                range(10, b).map((k) => `${a} × ${k} = ${a * k}`).join("、"),
                `答え　${ans}`,
              ],
            };
          }
          const b = r(11, 13), a = r(2, ty === 2 ? 6 : 4), ans = b * a;
          const steps = [`${b} を 10 と ${b - 10} に 分ける`, `10 × ${a} = ${10 * a}、${b - 10} × ${a} = ${(b - 10) * a}`, `${10 * a} + ${(b - 10) * a} = ${ans}`];
          if (ty === 2) {
            return {
              q: `${b} × ${a} の 答えを もとめよう。`,
              ans,
              hint: `${b} を 10 と ${b - 10} に 分けて 考えよう。`,
              steps: [...steps, `答え　${ans}`],
            };
          }
          const [it, c, box] = pick(r, [["クッキー", "まい", "ふくろ"], ["チョコレート", "こ", "はこ"], ["えんぴつ", "本", "はこ"]]);
          return {
            q: `1${box}に ${it}が ${b}${c}ずつ 入って います。${a}${box} では、${it}は ぜんぶで 何${c}ですか。`,
            ans,
            unit: c,
            hint: `しきは ${b} × ${a}。${b} を 10 と ${b - 10} に 分けて 考えよう。`,
            steps: [...steps, `答え　${ans}${c}`],
          };
        }),
        t("E2-kuku-3e", (r) => {
          const [A, B, C] = names(r, 3);
          const a = r(2, 9), b = r(2, 9), big = a * b;
          const first = `${A}さんの テープは ${a}cm です。${B}さんの テープは、${A}さんの テープの ${b}ばいの 長さです。`;
          const s1 = `${B}さんの テープ　${a} × ${b} = ${big}cm`;
          const ty = r(1, 3);
          if (ty === 1) {
            const ans = big - a;
            return {
              q: `${first}${B}さんの テープは、${A}さんの テープより 何cm 長いですか。`,
              ans,
              unit: "cm",
              hint: `まず ${B}さんの テープの 長さを もとめよう。`,
              steps: [s1, `${big} − ${a} = ${ans}`, `答え　${ans}cm`],
            };
          }
          if (ty === 2) {
            const ans = big + a;
            return {
              q: `${first}2本の テープの 長さを あわせると 何cm ですか。`,
              ans,
              unit: "cm",
              hint: `まず ${B}さんの テープの 長さを もとめよう。`,
              steps: [s1, `${big} + ${a} = ${ans}`, `答え　${ans}cm`],
            };
          }
          const c = r(2, Math.min(15, big - 2)), ans = big - c;
          return {
            q: `${first}${C}さんの テープは、${B}さんの テープより ${c}cm みじかいです。${C}さんの テープは 何cm ですか。`,
            ans,
            unit: "cm",
            hint: `まず ${B}さんの テープの 長さを もとめよう。`,
            steps: [s1, `${big} − ${c} = ${ans}`, `答え　${ans}cm`],
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
        t("E2-nagasa-1c", (r) => {
          const m = pick(r, MIERU);
          const [what, n, unit, bad] = m;
          return {
            q: `${what}は、およそ ${n}□ です。□ に あてはまる たんいは どれですか。`,
            choices: choices4(r, unit, bad),
            ans: unit,
            hint: isLen(m) ? "1mm・1cm・1m が どれくらいの 長さかを 思いうかべよう。" : "1mL・1dL・1L が どれくらいの かさかを 思いうかべよう。",
            steps: [`${n}${bad[0]} や ${n}${bad[1]} では、${what}と して おかしい`, `${what}は およそ ${n}${unit}　答え ${unit}`],
          };
        }),
        t("E2-nagasa-1d", (r) => {
          const ty = r(1, 3);
          if (ty === 1) {
            const t1 = r(1, 9), o = r(1, 9), n = 10 * t1 + o, ok = `${t1}cm${o}mm`;
            return {
              q: `${n}mm は 何cm何mm ですか。`,
              choices: choices4(r, ok, [`${n}cm`, `${10 * t1}cm${o}mm`, o !== t1 ? `${o}cm${t1}mm` : null, `${t1}cm${o + 1}mm`]),
              ans: ok,
              hint: "10mm で 1cm。10mm の まとまりが いくつ あるかな。",
              steps: [`${n}mm は 10mm が ${t1}こ と ${o}mm`, `10mm ＝ 1cm なので ${ok}`],
            };
          }
          if (ty === 2) {
            const h = r(1, 3), rem = r(1, 99), n = 100 * h + rem;
            if (rem % 10 === 0 && r(0, 1)) return { skip: true };
            const ok = `${h}m${rem}cm`;
            return {
              q: `${n}cm は 何m何cm ですか。`,
              choices: choices4(r, ok, [`${Math.floor(n / 10)}m${n % 10}cm`, `${n}m`, rem < 10 ? `${h}m${rem * 10}cm` : `${h}m${rem % 10}cm`, `${h + 1}m${rem}cm`]),
              ans: ok,
              hint: "100cm で 1m。100cm の まとまりが いくつ あるかな。",
              steps: [`${n}cm は 100cm が ${h}こ と ${rem}cm`, `100cm ＝ 1m なので ${ok}`],
            };
          }
          const t1 = r(1, 9), o = r(1, 9), n = 10 * t1 + o, ok = `${t1}L${o}dL`;
          return {
            q: `${n}dL は 何L何dL ですか。`,
            choices: choices4(r, ok, [`${n}L`, `${10 * t1}L${o}dL`, o !== t1 ? `${o}L${t1}dL` : null, `${t1}L${o + 1}dL`]),
            ans: ok,
            hint: "10dL で 1L。10dL の まとまりが いくつ あるかな。",
            steps: [`${n}dL は 10dL が ${t1}こ と ${o}dL`, `10dL ＝ 1L なので ${ok}`],
          };
        }),
        t("E2-nagasa-1e", (r) => {
          const [U, u] = r(0, 1) ? ["cm", "mm"] : ["L", "dL"];
          const ty = r(1, 3);
          let q, ok, wrongs, steps;
          if (ty === 1) {
            const a = r(1, 6), c = r(1, 9 - a), b = r(1, 7), d = r(1, 9 - b);
            ok = `${a + c}${U}${b + d}${u}`;
            q = `${a}${U}${b}${u} + ${c}${U}${d}${u} の 答えは どれですか。`;
            wrongs = [`${a + c}${U}${b}${u}`, `${a}${U}${b + d}${u}`, `${b + d}${U}${a + c}${u}`, `${a + c + 1}${U}${b + d}${u}`];
            steps = [`${U} どうし　${a} + ${c} = ${a + c}`, `${u} どうし　${b} + ${d} = ${b + d}`, `答え　${ok}`];
          } else if (ty === 2) {
            const a = r(1, 9), b = r(1, 7), d = r(1, 9 - b);
            ok = `${a}${U}${b + d}${u}`;
            q = `${a}${U}${b}${u} + ${d}${u} の 答えは どれですか。`;
            wrongs = [`${a + d}${U}${b}${u}`, `${a + d}${U}${b + d}${u}`, `${a}${U}${b + d + 1}${u}`, `${a + 1}${U}${b + d}${u}`];
            steps = [`${u} どうし　${b} + ${d} = ${b + d}`, `${U} は そのまま ${a}`, `答え　${ok}`];
          } else {
            const a = r(3, 9), c = r(1, a - 1), b = r(2, 9), d = r(1, b - 1);
            ok = `${a - c}${U}${b - d}${u}`;
            q = `${a}${U}${b}${u} − ${c}${U}${d}${u} の 答えは どれですか。`;
            wrongs = [`${a - c}${U}${b}${u}`, `${a}${U}${b - d}${u}`, `${a - c}${U}${b + d}${u}`, `${b - d}${U}${a - c}${u}`];
            steps = [`${U} どうし　${a} − ${c} = ${a - c}`, `${u} どうし　${b} − ${d} = ${b - d}`, `答え　${ok}`];
          }
          return {
            q,
            choices: choices4(r, ok, wrongs),
            ans: ok,
            hint: `${U} は ${U} どうし、${u} は ${u} どうしで 計算しよう。`,
            steps,
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
