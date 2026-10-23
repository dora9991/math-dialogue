// ============================================================
// data-02.js — データの活用 第2時「ヒストグラムと度数折れ線に表して、分布を読み取ろう」
//   ikkan の演習プリント（data-02.dr.1〜6）・小テスト（data-02.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「02」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：02d02b ＝ data-02.dr.2 の2つ目、02q03 ＝ data-02.qz.3
//   図（ヒストグラム）は出せないので、「長方形の高さ（度数）は、○以上○未満が 3人、…」と文章で言い切る。
//   ヒストグラムをかく問題（dr.1）は、「長方形の高さ・幅・個数」を聞く。説明を求める問い（dr.4②・dr.6②・qz.4）は、正しい説明を選ぶ 4択にした。
//   度数折れ線の両はしの点・長方形の上の辺の中点は、階級値（階級のまん中）から計算で出す。
// ============================================================
import { t, pick, choices4, round } from "../kit.js";
import { unitFor, fixed } from "../unit-kit.js";
import { sum, classes, cumulative } from "../stats.js";

const unit = unitFor("data");

// ── 場面 ─────────────────────────────────────────────
/** name＝「＿＿のヒストグラム」に入る言葉、u＝単位、los＝階級のはじめの候補、ws＝階級の幅の候補、d＝目盛りの小数の桁数 */
const CTX = [
  { name: "上体起こしの記録", u: "回", los: [10, 15, 20], ws: [5], d: 0 },
  { name: "通学時間", u: "分", los: [0], ws: [5, 10], d: 0 },
  { name: "50m走の記録", u: "秒", los: [7, 7.5, 8], ws: [0.5], d: 1 },
  { name: "テストの得点", u: "点", los: [0, 40], ws: [10], d: 0 },
  { name: "ボール投げの記録", u: "m", los: [10, 15, 20], ws: [5], d: 0 },
  { name: "身長", u: "cm", los: [140, 145, 150], ws: [5], d: 0 },
];
const fmt = (x, d) => (d ? Number(x).toFixed(d) : String(round(x)));
/** 計算でできた値（階級のまん中など）を、そのまま書く：12.5、7.75、45 */
const show = (x) => String(round(x, 6));
/** 階級の言い方：「7.5秒以上8.0秒未満」 */
const lb = (c, u, d) => `${fmt(c.lo, d)}${u}以上${fmt(c.hi, d)}${u}未満`;
/** ヒストグラムの長方形の高さを、文章で（度数分布表を文章にしたもの） */
const hsent = (cls, f, u, d) => cls.map((c, i) => `${lb(c, u, d)}が ${f[i]}人`).join("、");

/** 場面 c（なければ選ぶ）で、階級を k 個つくる */
const setup = (r, k = null, c = null) => {
  c = c || pick(r, CTX);
  const w = pick(r, c.ws), lo = pick(r, c.los);
  k = k || r(5, 6);
  return { c, u: c.u, d: c.d, w, k, lo, cls: classes(lo, w, k) };
};
/** まん中が多い山の形で、k 個の階級に n 人を分ける */
const bell = (r, k, n) => {
  const f = Array(k).fill(0);
  for (let i = 0; i < n; i++) f[Math.floor((r(0, 10 * k - 1) + r(0, 10 * k - 1)) / 20)]++;
  return f;
};
const uniqMax = (f) => f.filter((x) => x === Math.max(...f)).length === 1;
/** たし算の式：1つだけなら「5（人）」、いくつかなら「2+3 ＝ 5（人）」 */
const tot = (a) => (a.length > 1 ? `${a.join("+")} ＝ ${sum(a)}（人）` : `${a[0]}（人）`);
const near = (j, k) => [j - 1, j + 1, j - 2, j + 2].filter((i) => i >= 0 && i < k);

// ── 分布のかたち ─────────────────────────────────────
const SHAPE = {
  sym: "山がまん中にあり、左右のすそが同じくらい",
  rt: "山が左に寄り、右にすそが長くのびている",
  lt: "山が右に寄り、左にすそが長くのびている",
  two: "山が 2つあり、その間がへこんでいる",
};
/** 山がひとつの度数のならび（sym＝まん中が山で左右対称、rt＝左に山で右にすそが長い、lt＝右に山で左にすそが長い） */
function shapeFreq(r, kind) {
  if (kind === "sym") {
    const k = pick(r, [5, 7]), mid = (k - 1) / 2, step = r(1, 2), top = step * mid + r(2, 4);
    return Array.from({ length: k }, (_, i) => top - step * Math.abs(i - mid));
  }
  const k = r(5, 6), p = r(0, 1), peak = r(8, 12), f = Array(k).fill(0);
  f[p] = peak;
  if (p === 1) f[0] = r(2, 4);
  for (let i = p + 1; i < k; i++) f[i] = Math.max(1, f[i - 1] - r(1, 3));
  return kind === "rt" ? f : f.reverse();
}

export const UNITS = [
  unit("02", {
    name: "ヒストグラムと度数折れ線",
    desc: "ヒストグラム・度数折れ線のかき方と、分布の読み取り",
    prereqs: ["J1-dk01", "E6-data"],
    points: [
      "度数分布表を長方形で表したグラフが、ヒストグラム。横軸は階級、縦軸は度数で、長方形の高さが度数を表す。",
      "長方形の上の辺の中点を順に結んだ折れ線が、度数折れ線。両はしは、度数が 0 の階級があると考えて、そのまん中の点から横軸まで結ぶ。",
      "分布のようすは、山の位置（いちばん高い所）と、すそ（山の左右へのびるようす）で読み取る。",
      "長方形の面積の和は、（階級の幅）×（度数の合計）。度数折れ線と横軸で囲まれた部分の面積も、これと等しい。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 02d01 度数分布表をヒストグラムにかく（長方形の高さ・幅・個数）
        t("02d01", (r) => {
          const s = setup(r), n = r(20, 40), f = bell(r, s.k, n);
          if (f.some((v) => v === 0)) return { skip: true };
          const kind = pick(r, ["h", "h", "w", "n"]), j = r(0, s.k - 1);
          const table = `${n}人の${s.c.name}（${s.u}）の度数分布表は、${hsent(s.cls, f, s.u, s.d)}である。これを、ヒストグラムに表す。`;
          if (kind === "h") {
            return {
              q: `${table}「${lb(s.cls[j], s.u, s.d)}」の長方形の高さ（縦軸の目盛りの数）は？`,
              ans: f[j],
              unit: "人",
              hint: "ヒストグラムの縦軸は、何を表しているかな。",
              steps: ["ヒストグラムでは、縦軸が度数を表し、長方形の高さがその階級の度数になる。", `「${lb(s.cls[j], s.u, s.d)}」の度数は ${f[j]}人だから、高さは ${f[j]}。`],
            };
          }
          if (kind === "w") {
            return {
              q: `${table}長方形1つの、横の長さ（横軸の目盛りでの幅）は？`,
              ans: s.w,
              unit: s.u,
              hint: "長方形の横の長さは、横軸の、階級の上のはしと下のはしの間。",
              steps: ["ヒストグラムでは、横軸が階級を表し、長方形の横の長さが階級の幅になる。", `${fmt(s.cls[0].hi, s.d)}${s.u}−${fmt(s.cls[0].lo, s.d)}${s.u} ＝ ${fmt(s.w, s.d)}${s.u}`],
            };
          }
          return {
            q: `${table}長方形は、全部で何個かくことになるか。`,
            ans: s.k,
            unit: "個",
            hint: "長方形は、階級ごとに 1つずつかく。",
            steps: ["ヒストグラムの長方形は、階級ひとつにつき 1つ。", `階級は ${s.k}つあるから、長方形も ${s.k}個。`],
          };
        }),
        // 02d02a 度数折れ線の両はしの点
        t("02d02a", (r) => {
          const s = setup(r), left = r(0, 1) === 0 && s.cls[0].lo - s.w / 2 >= 0;   // 左はしの点が負の値になる組は、右はしを聞く
          const cx = (left ? s.cls[0].lo : s.cls[s.k - 1].hi) + (left ? -1 : 1) * (s.w / 2);
          return {
            q: `${s.c.name}（${s.u}）のヒストグラムは、階級の幅が ${fmt(s.w, s.d)}${s.u} で、${fmt(s.cls[0].lo, s.d)}${s.u}以上から ${fmt(s.cls[s.k - 1].hi, s.d)}${s.u}未満までの ${s.k}つの階級でできている。このヒストグラムに度数折れ線をかくとき、折れ線の${left ? "左" : "右"}はしの点は、横軸の何${s.u}のところにとるか。`,
            ans: round(cx, 6),
            unit: s.u,
            hint: "度数折れ線の両はしの点は、どの階級のまん中にとるのだったかな。",
            steps: left
              ? [`左の外に、度数 0 の階級「${fmt(s.cls[0].lo - s.w, s.d)}${s.u}以上${fmt(s.cls[0].lo, s.d)}${s.u}未満」があると考える。`, `そのまん中は (${fmt(s.cls[0].lo - s.w, s.d)}+${fmt(s.cls[0].lo, s.d)})÷2 ＝ ${show(cx)}`]
              : [`右の外に、度数 0 の階級「${fmt(s.cls[s.k - 1].hi, s.d)}${s.u}以上${fmt(s.cls[s.k - 1].hi + s.w, s.d)}${s.u}未満」があると考える。`, `そのまん中は (${fmt(s.cls[s.k - 1].hi, s.d)}+${fmt(s.cls[s.k - 1].hi + s.w, s.d)})÷2 ＝ ${show(cx)}`],
          };
        }),
        // 02d02b 長方形の上の辺の中点は、横軸のどこか
        t("02d02b", (r) => {
          const s = setup(r), j = r(0, s.k - 1), c = s.cls[j];
          const mid = round(c.lo + s.w / 2, 6);
          return {
            q: `${s.c.name}（${s.u}）のヒストグラムで、「${lb(c, s.u, s.d)}」の長方形の上の辺の中点は、横軸の何${s.u}のところにあるか。`,
            ans: mid,
            unit: s.u,
            hint: "長方形の上の辺の中点は、その階級の、横軸のまん中の真上にある。",
            steps: [`階級のまん中は (${fmt(c.lo, s.d)}+${fmt(c.hi, s.d)})÷2 ＝ ${mid}`, `中点は、横軸の ${mid}${s.u} のところ。`],
          };
        }),
        // 02q01 度数がもっとも多い階級
        t("02q01", (r) => {
          const s = setup(r, 5), n = r(18, 30), f = bell(r, 5, n);
          if (!uniqMax(f)) return { skip: true };
          const j = f.indexOf(Math.max(...f)), ans = lb(s.cls[j], s.u, s.d);
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。度数がもっとも多い階級は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, near(j, s.k).map((i) => lb(s.cls[i], s.u, s.d))),
            hint: "いちばん高い長方形の階級を探そう。",
            steps: [`長方形の高さは ${f.join("、")}（人）。`, `いちばん高いのは ${f[j]}人の「${ans}」。`],
          };
        }),
        // 02q02 ○以上の人は何人か
        t("02q02", (r) => {
          const s = setup(r, 5), n = r(18, 30), f = bell(r, 5, n);
          const j = r(2, 4), cnt = sum(f.slice(j)), x = s.cls[j].lo;
          if (cnt === 0) return { skip: true };
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。${s.c.name}が ${fmt(x, s.d)}${s.u}以上の人は、何人か。`,
            ans: cnt,
            unit: "人",
            hint: "「以上」にふくまれる長方形は、どれとどれかな。",
            steps: [`${fmt(x, s.d)}${s.u}以上の階級は、${s.cls.slice(j).map((c) => `「${lb(c, s.u, s.d)}」`).join("・")}。`, tot(f.slice(j))],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 02d03a ○未満（以上）の人は何人か
        t("02d03a", (r) => {
          const s = setup(r, r(5, 6)), n = r(30, 48), f = bell(r, s.k, n);
          const j = r(1, s.k - 1), below = r(0, 1) === 0, x = s.cls[j].lo;
          const cnt = below ? sum(f.slice(0, j)) : sum(f.slice(j));
          if (cnt === 0) return { skip: true };
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。${s.c.name}が ${fmt(x, s.d)}${s.u}${below ? "未満" : "以上"}の人は、何人か。`,
            ans: cnt,
            unit: "人",
            hint: below ? "「未満」は、その数をふくまない。どの長方形までをたせばよいかな。" : "「以上」は、その数をふくむ。どの長方形からをたせばよいかな。",
            steps: below
              ? [`${fmt(x, s.d)}${s.u}未満の階級は、${j === 1 ? `「${lb(s.cls[0], s.u, s.d)}」だけ` : `「${lb(s.cls[0], s.u, s.d)}」から「${lb(s.cls[j - 1], s.u, s.d)}」まで`}。`, tot(f.slice(0, j))]
              : [`${fmt(x, s.d)}${s.u}以上の階級は、${j === s.k - 1 ? `「${lb(s.cls[j], s.u, s.d)}」だけ` : `「${lb(s.cls[j], s.u, s.d)}」から「${lb(s.cls[s.k - 1], s.u, s.d)}」まで`}。`, tot(f.slice(j))],
          };
        }),
        // 02d03b 小さい（大きい）ほうから k 番目の人は、どの階級か
        t("02d03b", (r) => {
          const s = setup(r, r(5, 6)), n = r(30, 48), f = bell(r, s.k, n);
          const fromSmall = r(0, 1) === 0, k = r(1, n), rank = fromSmall ? k : n - k + 1;
          const cu = cumulative(f), j = cu.findIndex((c) => c >= rank), ans = lb(s.cls[j], s.u, s.d);
          const cu2 = fromSmall ? cu : cumulative([...f].reverse());
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。${s.c.name}の${fromSmall ? "小さい" : "大きい"}ほうから数えて ${k}番目の人は、どの階級にいるか。`,
            ans,
            choices: choices4(r, ans, near(j, s.k).map((i) => lb(s.cls[i], s.u, s.d))),
            hint: `${fromSmall ? "小さい" : "大きい"}ほうの長方形から、高さ（度数）を順にたしていこう。たした人数が ${k} に届くのは、どの階級かな。`,
            steps: [`度数を${fromSmall ? "小さい" : "大きい"}ほうから順にたす：${cu2.join("、")}（人）。`, `${k}番目は、たした人数がはじめて ${k} 以上になる「${ans}」。`],
          };
        }),
        // 02q03 度数折れ線の両はしの点（小テスト）
        t("02q03", (r) => {
          const s = setup(r, 5), n = r(18, 30), f = bell(r, 5, n), left = r(0, 1) === 0 && s.cls[0].lo - s.w / 2 >= 0;
          const cx = round((left ? s.cls[0].lo : s.cls[4].hi) + (left ? -1 : 1) * (s.w / 2), 6);
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。度数折れ線をかくとき、折れ線の${left ? "左" : "右"}はしの点は、横軸の何${s.u}のところにとればよいか。`,
            ans: cx,
            unit: s.u,
            hint: "度数折れ線の両はしの点は、どの階級のまん中にとるのだったかな。",
            steps: left
              ? [`左の外に、度数 0 の階級「${fmt(s.cls[0].lo - s.w, s.d)}${s.u}以上${fmt(s.cls[0].lo, s.d)}${s.u}未満」があると考える。`, `そのまん中は ${cx}${s.u} のところ。`]
              : [`右の外に、度数 0 の階級「${fmt(s.cls[4].hi, s.d)}${s.u}以上${fmt(s.cls[4].hi + s.w, s.d)}${s.u}未満」があると考える。`, `そのまん中は ${cx}${s.u} のところ。`],
          };
        }),
        // 02q04 分布のようす（山の位置とすそののび方）
        t("02q04", (r) => {
          const kind = pick(r, ["sym", "rt", "lt"]), f = shapeFreq(r, kind), n = sum(f);
          const s = setup(r, f.length), ans = SHAPE[kind];
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。この分布のようすとして、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, Object.keys(SHAPE).filter((x) => x !== kind).map((x) => SHAPE[x])),
            hint: "いちばん高い長方形（山）は、左・まん中・右のどこかな。山の左右で、すそののび方はどうちがうかな。",
            steps: [`長方形の高さは ${f.join("、")}（人）。`, `山（いちばん高い長方形）は ${f.indexOf(Math.max(...f)) + 1}番目の階級。${kind === "sym" ? "左右の高さがほぼ同じようにへっていく。" : kind === "rt" ? "右へ、ゆるやかにへっていく。" : "左へ、ゆるやかにへっていく。"}`, `答えは「${ans}」。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 02d04a 山はどの階級にあるか
        t("02d04a", (r) => {
          const kind = pick(r, ["sym", "rt", "lt"]), f = shapeFreq(r, kind), n = sum(f), s = setup(r, f.length);
          const j = f.indexOf(Math.max(...f)), ans = lb(s.cls[j], s.u, s.d);
          return {
            q: `${n}人の${s.c.name}（${s.u}）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, s.u, s.d)}である。このヒストグラムの山は、どの階級にあるか。`,
            ans,
            choices: choices4(r, ans, near(j, s.k).map((i) => lb(s.cls[i], s.u, s.d))),
            hint: "山は、いちばん高い長方形のところ。",
            steps: [`長方形の高さは ${f.join("、")}（人）。`, `いちばん高いのは ${f[j]}人の「${ans}」。ここが山。`],
          };
        }),
        // 02d04b 分布のようす
        t("02d04b", (r) => {
          const kind = pick(r, ["sym", "rt", "lt"]), f = shapeFreq(r, kind), n = sum(f), s = setup(r, f.length, CTX[3]), ans = SHAPE[kind];
          return {
            q: `${n}人のテストの得点（点）のヒストグラムがある。長方形の高さは、${hsent(s.cls, f, "点", 0)}である。山の位置とすそののび方から、この分布のようすを表しているのは、どれか。`,
            ans,
            choices: choices4(r, ans, Object.keys(SHAPE).filter((x) => x !== kind).map((x) => SHAPE[x])),
            hint: "山の位置と、山から左右へ、どのようにへっていくかを見くらべよう。",
            steps: [`長方形の高さは ${f.join("、")}（人）。`, kind === "sym" ? "山は階級のまん中にあり、左右とも同じようにへっていく。" : kind === "rt" ? "山は左に寄っていて、右へ長くへっていく（右にすそが長い）。" : "山は右に寄っていて、左へ長くへっていく（左にすそが長い）。", `答えは「${ans}」。`],
          };
        }),
        // 02d05a 高さの比から、もっとも高い長方形の度数
        t("02d05a", (r) => {
          const ratio = pick(r, [[1, 3, 5, 3], [1, 2, 4, 3], [2, 3, 5, 2], [1, 4, 5, 2], [2, 5, 4, 1], [1, 3, 4, 2, 1], [1, 2, 5, 3, 1]]);
          const m = r(2, 5), f = ratio.map((x) => x * m), n = sum(f), S = sum(ratio);
          const s = setup(r, ratio.length, CTX[3]);
          const top = Math.max(...f);
          return {
            q: `${n}人のテストの得点（点）を、${s.cls.map((c) => lb(c, "点", 0)).join("、")}の ${ratio.length}つの階級に分けて、ヒストグラムをかいたら、長方形の高さの比が ${ratio.join("：")} になった。もっとも高い長方形の階級の度数は？`,
            ans: top,
            unit: "人",
            hint: "長方形の高さは、度数に比例する。比の和で、全体の人数をわって、比の 1 にあたる人数を求めよう。",
            steps: [`比の和は ${ratio.join("+")} ＝ ${S}。比の 1 にあたる人数は ${n}÷${S} ＝ ${m}（人）。`, `度数は ${f.join("、")}（人）。もっとも高いのは ${Math.max(...ratio)}×${m} ＝ ${top}（人）。`],
          };
        }),
        // 02d05b 高さの比から、低いほうから k 番目の人の階級
        t("02d05b", (r) => {
          const ratio = pick(r, [[1, 3, 5, 3], [1, 2, 4, 3], [2, 3, 5, 2], [1, 4, 5, 2], [2, 5, 4, 1], [1, 3, 4, 2, 1], [1, 2, 5, 3, 1]]);
          const m = r(2, 5), f = ratio.map((x) => x * m), n = sum(f), S = sum(ratio);
          const s = setup(r, ratio.length, CTX[3]);
          const cu = cumulative(f), idx = r(0, ratio.length - 2), k = cu[idx] + (r(0, 1) ? 0 : 1);
          const j = cu.findIndex((c) => c >= k), ans = lb(s.cls[j], "点", 0);
          return {
            q: `${n}人のテストの得点（点）を、${s.cls.map((c) => lb(c, "点", 0)).join("、")}の ${ratio.length}つの階級に分けて、ヒストグラムをかいたら、長方形の高さの比が ${ratio.join("：")} になった。得点の低いほうから数えて ${k}番目の人は、どの階級にいるか。`,
            ans,
            choices: choices4(r, ans, near(j, s.k).map((i) => lb(s.cls[i], "点", 0))),
            hint: "まず、それぞれの階級の度数を求めよう。次に、低いほうの階級から順にたしていく。",
            steps: [`比の和 ${ratio.join("+")} ＝ ${S}。比の 1 にあたる人数は ${n}÷${S} ＝ ${m}（人）。度数は ${f.join("、")}（人）。`, `低いほうから順にたす：${cu.join("、")}（人）。`, `${k}番目は、たした人数がはじめて ${k} 以上になる「${ans}」。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 02d06a 長方形の面積の和
        t("02d06a", (r) => {
          const s = setup(r, r(6, 8), CTX[1]), n = r(20, 40), f = bell(r, s.k, n);
          return {
            q: `${n}人の通学時間（分）のヒストグラムがある。階級の幅は ${s.w}分 で、長方形の高さは、${hsent(s.cls, f, "分", 0)}である。長方形の面積の和を求めよう。（面積は「分×人」と考える）`,
            ans: s.w * n,
            hint: "長方形1つの面積は、（横の長さ）×（高さ）。横の長さは、どの長方形も同じ。",
            steps: [`長方形の面積は、（階級の幅 ${s.w}）×（度数）。`, `面積の和 ＝ ${s.w}×(${f.join("+")}) ＝ ${s.w}×${n} ＝ ${s.w * n}`],
          };
        }),
        // 02d06b 度数折れ線と横軸で囲まれた面積が、長方形の面積の和と等しいわけ
        fixed("02d06b", (r) => {
          const ans = "となり合う長方形の境目で、折れ線からはみ出す三角形と、へこむ三角形ができる。この 2つは合同で面積が等しいので、打ち消し合うから";
          return {
            q: "ヒストグラムに度数折れ線をかいた。度数折れ線と横軸で囲まれた部分の面積は、ヒストグラムの長方形の面積の和と等しい。そのわけとして、正しいものはどれか。",
            ans,
            choices: choices4(r, ans, [
              "度数折れ線は、長方形の上の辺の左はしの点を結んだものなので、長方形の上の辺とぴったり重なるから",
              "度数折れ線の点の数が、長方形の数とまったく同じだから",
              "度数折れ線は、どの長方形の上の辺とも重なっているから",
            ]),
            hint: "度数折れ線は、長方形の上の辺の「どこ」を結んでいるかな。となり合う長方形の境目で、折れ線と長方形はどうなっているかな。",
            steps: ["度数折れ線は、長方形の上の辺の中点を結んでいる。", "境目の線のところで、折れ線からはみ出す三角形と、へこむ三角形ができる。この 2つは合同で、面積が等しい。両はしも同じ。", "だから、はみ出す分とへこむ分が打ち消し合い、面積の和は変わらない。"],
          };
        }),
        // 02q05 度数折れ線と横軸で囲まれた部分の面積（チャレンジ）
        t("02q05", (r) => {
          const s = setup(r, 5, CTX[0]), n = r(18, 30), f = bell(r, 5, n);
          return {
            q: `${n}人の上体起こしの記録（回）のヒストグラムがある。階級の幅は ${s.w}回 で、長方形の高さは、${hsent(s.cls, f, "回", 0)}である。このヒストグラムに度数折れ線をかいたとき、度数折れ線と横軸で囲まれた部分の面積は、いくつか。（面積は「回×人」と考える）`,
            ans: s.w * n,
            hint: "度数折れ線と横軸で囲まれた部分の面積は、長方形の面積の和と、どんな関係があったかな。",
            steps: [`長方形の面積の和は ${s.w}×(${f.join("+")}) ＝ ${s.w}×${n} ＝ ${s.w * n}`, `度数折れ線と横軸で囲まれた部分の面積は、長方形の面積の和と等しい。答えは ${s.w * n}。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 演習プリント 6問・小テスト 5問のすべてを移した（ヒストグラムをかく問題は長方形の高さ・幅・個数を聞く形に、説明を求める問いは 4択に直した）
