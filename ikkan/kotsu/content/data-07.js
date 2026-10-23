// ============================================================
// data-07.js — データの活用 第7時「データを根拠にして判断し、「本当にそういえるか」を確かめよう」
//   ikkan の演習プリント（data-07.dr.1〜7）・小テスト（data-07.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「07」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：07d02a ＝ data-07.dr.2 の ①
//   データ（平均値が同じで、ちらばりがちがう2人の得点）は、乱数でつくって、条件に合うものだけを使う。割合・平均値・範囲は stats.js などで計算する。
//   「どちらを選ぶか」「説明は正しいか」「気をつけること」は、選択肢を4つ（または3つ）の文にした4択に直した。
//   縦軸が 0 から始まらない棒グラフ（07d05）は、「縦軸が 380冊から始まるグラフで 2倍に見える」と文章で言い、実際の倍率を聞く。
//   ヒストグラム（07d07）は、度数を文章で言う。「正しいものをすべて選ぶ」は、「正しいものはどれか（1つだけ正しい）」に直した。
// ============================================================
import { t, pick, choices4, shuffle, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { sum, mean, median, range, classes, medianClass, clsLabel, freqSentence, listData } from "../stats.js";

const unit = unitFor("data");
const f2 = (x) => x.toFixed(2);

// ── 平均値が同じで、ちらばりがちがう2人 ─────────────────────────
/** n 個の整数（lo〜hi）で合計が total になる組を、小さい順に。見つからなければ null */
function withSum(r, n, lo, hi, total) {
  for (let tr = 0; tr < 300; tr++) {
    const head = Array.from({ length: n - 1 }, () => r(lo, hi)), last = total - sum(head);
    if (last >= lo && last <= hi) return [...head, last].sort((x, y) => x - y);
  }
  return null;
}
/** 平均値 m が同じ2人。ひとりは m±wa、もうひとりは m±wb（範囲が 2倍以上）。順番は、ランダム */
function pairData(r, n, m, wa, wb, lo) {
  const A = withSum(r, n, m - wa, m + wa, n * m), B = withSum(r, n, Math.max(lo, m - wb), m + wb, n * m);
  if (!A || !B || range(A) < 2 || range(B) < 2 * range(A)) return null;
  return r(0, 1) ? [B, A] : [A, B];
}
const NAMES = ["Aさん", "Bさん"];
/** 「Aさん」「Bさん」「平均値が同じなので、どちらを選んでも同じ」の3択（正解は person 番号） */
const who3 = (r, person) => choices4(r, NAMES[person], [NAMES[1 - person], "平均値が同じなので、どちらを選んでも同じ"]);

/** 平均値か範囲を、Aさん・Bさんのどちらかについて聞く */
function meanRange(r, pd, u, listIntro) {
  const who = r(0, 1), w = pick(r, ["平均値", "範囲"]), a = pd[who];
  const ans = w === "平均値" ? mean(a) : range(a);
  return {
    q: `${listIntro}${NAMES[0]} … ${listData(pd[0])}　${NAMES[1]} … ${listData(pd[1])}　${NAMES[who]}の${w}は？`,
    ans,
    unit: u,
    hint: w === "平均値" ? "平均値は、データの合計を、データの個数でわる。" : "範囲は、データの最大値と最小値でわかる。",
    steps: [w === "平均値" ? `${NAMES[who]}の平均値 ＝ (${a.join(" + ")}) ÷ ${a.length} ＝ ${sum(a)} ÷ ${a.length} ＝ ${mean(a)}（${u}）` : `${NAMES[who]}の範囲 ＝ 最大値 − 最小値 ＝ ${a[a.length - 1]} − ${a[0]} ＝ ${range(a)}（${u}）`],
  };
}
/** 「T点以上で勝てる／T点未満だと負ける」などの条件で、どちらを選ぶか（割合でくらべる） */
function chooseBy(r, pd, kind, T) {
  const test = kind === "以上" ? (x) => x >= T : (x) => x < T;
  const c = pd.map((a) => a.filter(test).length), n = pd[0].length;
  if (c[0] === c[1]) return null;
  const person = kind === "以上" ? (c[0] > c[1] ? 0 : 1) : (c[0] < c[1] ? 0 : 1);
  return { person, c, n };
}

// 07d03：人数の少ない組（n0 人のうち c0 人）と、多い組（n1 人のうち c1 人）。人数は多いほうが c1 > c0 だが、割合は小さい（% がちょうどの値）
const PAIRS_D03 = [];
for (const n0 of [20, 25, 30, 40]) for (const n1 of [40, 50, 60, 80]) {
  if (n0 >= n1) continue;
  for (let c0 = Math.ceil(n0 * 0.2); c0 <= Math.floor(n0 * 0.8); c0++) for (let c1 = Math.ceil(n1 * 0.2); c1 <= Math.floor(n1 * 0.8); c1++) {
    if ((100 * c0) % n0 === 0 && (100 * c1) % n1 === 0 && c1 > c0 && c1 / n1 < c0 / n0) PAIRS_D03.push([n0, c0, n1, c1]);
  }
}

export const UNITS = [
  unit("07", {
    name: "データを根拠に判断する（割合・ちらばり・グラフの読み方）",
    desc: "目的に合わせて割合や範囲で判断する、人数のちがう集団の比べ方、縦軸が 0 から始まらないグラフ、平均値と中央値の使い分け",
    prereqs: ["J1-dk06", "J1-d3"],
    points: [
      "判断の理由になる数や事実を根拠という。判断の目的がちがえば、見る数（割合・平均値・範囲など）も、結論も、ちがってよい。",
      "平均値が同じでも、データのちらばりはちがうことがある。ちらばりは、範囲やヒストグラムでとらえる。人数のちがう集団をくらべるときは、人数ではなく、割合（相対度数）を使う。",
      "縦軸が 0 から始まらない棒グラフは、実際の差よりも大きく見える。目もりを読んで、実際の数でくらべる。極端な値があると平均値はそれに引っぱられるので、平均値や中央値などの代表値を、あわせて見る。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 07d01 シュートゲーム 10回ずつ：平均値と範囲
        t("07d01", (r) => {
          const pd = pairData(r, 10, r(6, 8), 2, 5, 0); if (!pd) return { skip: true };
          return meanRange(r, pd, "点", "AさんとBさんが、シュートゲームを 10回ずつした。入った得点は、次のとおりである。");
        }),
        // 07d02a ① 8点以上とれば勝てる → どちらを選ぶか（割合で）
        t("07d02a", (r) => {
          const m = r(6, 8), pd = pairData(r, 10, m, 2, 5, 0); if (!pd) return { skip: true };
          const T = r(m - 3, m + 4), res = chooseBy(r, pd, "以上", T); if (!res) return { skip: true };
          const { person, c, n } = res;
          return {
            q: `AさんとBさんが、シュートゲームを 10回ずつした。入った得点は、次のとおりである。${NAMES[0]} … ${listData(pd[0])}　${NAMES[1]} … ${listData(pd[1])}　${T}点以上とれば勝てる。割合を使って考えると、どちらを選ぶのがよいか。`,
            ans: NAMES[person],
            choices: who3(r, person),
            hint: "勝てるのは、何回のうち何回か。それぞれの割合をくらべよう。",
            steps: [`${T}点以上の割合　${NAMES[0]} ${c[0]} ÷ ${n} ＝ ${f2(c[0] / n)}　　${NAMES[1]} ${c[1]} ÷ ${n} ＝ ${f2(c[1] / n)}`, `割合が大きい ${NAMES[person]} を選ぶ。（平均値は同じでも、割合はちがう。）`],
          };
        }),
        // 07d02b ② 5点未満だと負ける → どちらを選ぶか
        t("07d02b", (r) => {
          const m = r(6, 8), pd = pairData(r, 10, m, 2, 5, 0); if (!pd) return { skip: true };
          const T = r(m - 4, m + 3), res = chooseBy(r, pd, "未満", T); if (!res) return { skip: true };
          const { person, c, n } = res;
          return {
            q: `AさんとBさんが、シュートゲームを 10回ずつした。入った得点は、次のとおりである。${NAMES[0]} … ${listData(pd[0])}　${NAMES[1]} … ${listData(pd[1])}　${T}点未満だと負ける。割合を使って考えると、負けにくいのは、どちらか。`,
            ans: NAMES[person],
            choices: who3(r, person),
            hint: "負けるのは、何回のうち何回か。それぞれの割合をくらべて、小さいほうを選ぼう。",
            steps: [`${T}点未満の割合　${NAMES[0]} ${c[0]} ÷ ${n} ＝ ${f2(c[0] / n)}　　${NAMES[1]} ${c[1]} ÷ ${n} ＝ ${f2(c[1] / n)}`, `負ける割合が小さい ${NAMES[person]} を選ぶ。`],
          };
        }),
        // 07q01 テスト 4回の得点：平均値と範囲
        t("07q01", (r) => {
          const pd = pairData(r, 4, 5 * r(10, 15), 4, 22, 0); if (!pd) return { skip: true };
          return meanRange(r, pd, "点", "AさんとBさんの、テスト 4回の得点である。");
        }),
        // 07q02 毎回、同じくらいの点がとれるのはどちらか
        t("07q02", (r) => {
          const pd = pairData(r, 4, 5 * r(10, 15), 4, 22, 0); if (!pd) return { skip: true };
          const person = range(pd[0]) < range(pd[1]) ? 0 : 1;
          return {
            q: `AさんとBさんの、テスト 4回の得点である。${NAMES[0]} … ${listData(pd[0])}　${NAMES[1]} … ${listData(pd[1])}　毎回、同じくらいの点がとれるのは、どちらのほうか。`,
            ans: NAMES[person],
            choices: who3(r, person),
            hint: "平均値は同じ。点数のちらばりぐあいは、何を見るとわかるかな。",
            steps: [`範囲　${NAMES[0]} ${pd[0][3]} − ${pd[0][0]} ＝ ${range(pd[0])}（点）　　${NAMES[1]} ${pd[1][3]} − ${pd[1][0]} ＝ ${range(pd[1])}（点）`, `範囲が小さい ${NAMES[person]} のほうが、得点が安定している。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 07d03 A組 30人・B組 40人：「人数が多いから割合も大きい」という説明
        t("07d03", (r) => {
          const ctx = pick(r, [
            { what: "通学時間が", th: [15, 20, 30], u: "分" },
            { what: "1日の家庭学習の時間が", th: [30, 45, 60], u: "分" },
            { what: "握力が", th: [25, 30, 35], u: "kg" },
          ]);
          const th = pick(r, ctx.th), names = pick(r, [["A組", "B組"], ["1組", "2組"], ["東中学校", "西中学校"]]);
          const [n0, c0, n1, c1] = pick(r, PAIRS_D03), ns = [n0, n1], cs = [c0, c1], ps = cs.map((c, i) => (100 * c) / ns[i]);
          const order = r(0, 1) ? [0, 1] : [1, 0];   // 問題文で先に書くほう
          const x = `${th}${ctx.u}以上`;
          const text = order.map((i) => `${names[i]} ${ns[i]}人のうち ${cs[i]}人`).join("、");
          const ans = `${x}の割合は、${names[0]}が ${ps[0]}%、${names[1]}が ${ps[1]}% なので、${names[0]}のほうが大きい`;
          const wrongs = [
            `${x}の人数が${names[1]}のほうが多いので、割合も${names[1]}のほうが大きい`,
            `${x}の割合は、${names[0]}が ${ps[1]}%、${names[1]}が ${ps[0]}% なので、${names[1]}のほうが大きい`,
            "人数がちがうので、どちらの割合が大きいかは決められない",
          ];
          return {
            q: `${ctx.what} ${x}の人は、${text}だった。次のうち、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "人数がちがうとき、人数そのものでくらべてよいかな。割合は、（その人数）÷（全体の人数）。",
            steps: [`${names[0]}　${cs[0]} ÷ ${ns[0]} ＝ ${f2(ps[0] / 100)}　　${names[1]}　${cs[1]} ÷ ${ns[1]} ＝ ${f2(ps[1] / 100)}`, `人数は${names[1]}のほうが多いが、割合は${names[0]}のほうが大きい。`, "人数がちがうときは、人数ではなく、割合でくらべる。"],
          };
        }),
        // 07d04 A市とB市の30日間の最高気温：34℃以上の日数のちがい
        t("07d04", (r) => {
          const names = pick(r, [["A市", "B市"], ["東町", "西町"], ["北区", "南区"]]), k = 5, cls = classes(28, 2, k);
          const fa = genFreq(r, 30, k), fb = genFreq(r, 30, k); if (!fa || !fb) return { skip: true };
          const j = r(2, 3), ta = sum(fa.slice(j)), tb = sum(fb.slice(j));
          if (Math.abs(ta - tb) < 3) return { skip: true };
          const big = ta > tb ? 0 : 1, th = cls[j].lo;
          return {
            q: `${names[0]}と${names[1]}の、夏の 30日間の最高気温（℃）を度数分布表にまとめたところ、${names[0]}は、${freqSentence(cls, fa, "℃", "日")}。${names[1]}は、${freqSentence(cls, fb, "℃", "日")}であった。最高気温が ${th}℃以上の日は、${names[big]}は${names[1 - big]}より、何日多いか。`,
            ans: Math.abs(ta - tb),
            unit: "日",
            hint: "同じ 30日で、それぞれ「以上」の日数を求めて、くらべよう。「以上」は、その階級から上を全部足す。",
            steps: [`${names[0]}の ${th}℃以上は ${fa.slice(j).join(" + ")} ＝ ${ta}（日）`, `${names[1]}の ${th}℃以上は ${fb.slice(j).join(" + ")} ＝ ${tb}（日）`, `${names[big]}のほうが ${Math.abs(ta - tb)} 日多い。（日数は同じ 30日だから、そのまま比べられる。）`],
          };
        }),
        // 07q03 70点以上をとれば代表になれる（1回だけの試験）：見こみが大きいのは
        t("07q03", (r) => {
          const m = 5 * r(10, 15), pd = pairData(r, 4, m, 4, 22, 0); if (!pd) return { skip: true };
          const T = 5 * r(Math.ceil((m - 20) / 5), Math.floor((m + 20) / 5)), res = chooseBy(r, pd, "以上", T); if (!res) return { skip: true };
          const { person, c, n } = res;
          return {
            q: `AさんとBさんの、テスト 4回の得点である。${NAMES[0]} … ${listData(pd[0])}　${NAMES[1]} … ${listData(pd[1])}　「${T}点以上をとれば、代表になれる」（1回だけの試験）。代表になれる見こみが大きいのは、どちらか。`,
            ans: NAMES[person],
            choices: who3(r, person),
            hint: `平均値は同じ。「${T}点以上」は、4回のうち何回あるかを、くらべよう。`,
            steps: [`${T}点以上の回数　${NAMES[0]} ${c[0]}回　${NAMES[1]} ${c[1]}回（4回のうち）`, `${T}点以上をとる割合が大きい ${NAMES[person]} のほうが、見こみが大きい。`],
          };
        }),
        // 07q04 グラフの縦軸が 0 から始まらないとき、読む人が気をつけること
        t("07q04", (r) => {
          const what = pick(r, ["月ごとの売り上げ", "2つのクラスの平均点", "駅の乗降客数", "図書室の貸し出し冊数"]);
          const ans = pick(r, [
            "縦軸の目もりを読んで、実際の数でくらべる",
            "棒の高さの比ではなく、目もりが表す実際の数でくらべる",
            "差が実際より大きく見えることがあるので、目もりを確かめて判断する",
          ]);
          const wrongs = shuffle(r, [
            "棒の高さの比は、そのまま実際の数量の比だと考えてよい",
            "縦軸の目もりは、読まなくてよい",
            "棒が高いほど、実際の数量の差も、同じ割合で大きいと考える",
            "グラフはまちがっているので、信用しない",
            "棒の高さが低いほうが、数量が多いと考える",
          ]).slice(0, 3);
          return {
            q: `${what}を表す棒グラフの縦軸が、0 から始まっていない。このようなグラフを読むときに気をつけることとして、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "縦軸が 0 から始まらないと、棒の高さの差が、実際の差とくらべてどう見えるかな。",
            steps: ["縦軸が 0 から始まらないと、差が実際より大きく見えることがある。", "グラフの数がまちがっているわけではない。縦軸の目もりを読んで、実際の数でくらべる。"],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 07d05 図書室の貸し出し冊数：縦軸が 380 から始まるグラフで 6月は 4月の 2倍に見える → 実際は何倍か
        t("07d05", (r) => {
          const ctx = pick(r, [
            { what: "ある学校の図書室の貸し出し冊数", u: "冊", m1: "4月", m2: "6月" },
            { what: "ある店のパンの売れた個数", u: "個", m1: "月曜日", m2: "金曜日" },
            { what: "ある球場の入場者数", u: "人", m1: "1日目", m2: "3日目" },
            { what: "ある町のペットボトルの回収数", u: "本", m1: "1月", m2: "7月" },
          ]);
          const a = pick(r, [200, 250, 400, 500, 800, 1000]), d = pick(r, [10, 20, 25, 30, 40, 50]), k = pick(r, [2, 2, 3]);
          const s = a - d, b = s + k * d, ratio = b / a;
          if (ratio < 1.03 || ratio > 1.3 || Math.abs(round(ratio, 3) - ratio) > 1e-9) return { skip: true };
          return {
            q: `${ctx.what}は、${ctx.m1}が ${a}${ctx.u}、${ctx.m2}が ${b}${ctx.u}であった。これを、縦軸が ${s}${ctx.u}から始まる棒グラフに表すと、${ctx.m2}の棒の高さは、${ctx.m1}の棒の高さの ${k}倍に見える。実際には、${ctx.m2}は${ctx.m1}の何倍か。`,
            ans: round(ratio, 3),
            hint: "グラフの棒の高さではなく、実際の数どうしで、わり算をする。",
            steps: [`棒の高さは、縦軸の ${s} からの高さ。${a} − ${s} ＝ ${d}、${b} − ${s} ＝ ${b - s} だから、${k}倍に見える。`, `実際の倍率は ${b} ÷ ${a} ＝ ${round(ratio, 3)}（倍）`],
          };
        }),
        // 07d06a 5人の年収：平均値は中央値より何万円大きいか
        t("07d06a", (r) => {
          const w = wage(r); if (!w) return { skip: true };
          return {
            q: `社員 5人の年収は、${w.a.join("、")}（万円）である。平均値は、中央値より何万円大きいか。`,
            ans: w.mean - w.med,
            unit: "万円",
            hint: "平均値は、5人の年収の合計を人数でわる。中央値は、小さい順にならべたときのまん中の値。",
            steps: [`平均値 ＝ (${w.a.join(" + ")}) ÷ 5 ＝ ${sum(w.a)} ÷ 5 ＝ ${w.mean}（万円）`, `中央値は 3番目の ${w.med}万円。`, `${w.mean} − ${w.med} ＝ ${w.mean - w.med}（万円）`],
          };
        }),
        // 07d06b 求人広告の「平均 600万円」は、社員のようすをよく表しているか
        t("07d06b", (r) => {
          const w = wage(r); if (!w) return { skip: true };
          const hi = w.a[4], ans = `いえない。5人のうち 4人は平均値より少なく、${hi}万円という大きい値に引っぱられて、平均値が大きくなっているから`;
          const wrongs = [
            "いえる。平均値は、全員の年収を合計して人数でわった値なので、社員のようすをいちばんよく表すから",
            `いえる。5人のうち 4人が、平均値の ${w.mean}万円より多くもらっているから`,
            "いえない。平均値は、いつも中央値より小さくなるから",
          ];
          return {
            q: `求人広告に、「社員 5人の平均年収は ${w.mean}万円です」と書いてある。5人の年収は、${w.a.join("、")}（万円）である。この「平均 ${w.mean}万円」は、社員のようすをよく表しているといえるか。正しい説明を選ぼう。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "平均値のほかに、中央値も求めて、5人の年収とくらべてみよう。平均値より少ない人は、何人いるかな。",
            steps: [`平均値は ${sum(w.a)} ÷ 5 ＝ ${w.mean}（万円）、中央値は 3番目の ${w.med}万円。`, `平均値より少ないのは、${w.a.slice(0, 4).join("、")}の 4人。1人だけ ${hi}万円と大きいので、平均値が大きくなっている。`, "このような場合、平均値は社員のようすをよく表していない。中央値のほうが、ようすに近い。"],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 07d07 A組とB組のヒストグラム：ア〜エのうち正しいもの
        t("07d07", (r) => {
          const k = 5, cls = classes(0, 20, k), nA = pick(r, [20, 25, 30, 35, 40]), nB = pick(r, [30, 35, 40, 45, 50]);
          if (nA === nB) return { skip: true };
          const fa = genFreq(r, nA, k), fb = genFreq(r, nB, k); if (!fa || !fb) return { skip: true };
          const j = r(2, 3), th = cls[j].lo, ca = sum(fa.slice(j)), cb = sum(fb.slice(j));
          const mca = medianClass(fa), mcb = medianClass(fb);
          if (ca === cb || ca / nA === cb / nB || mca == null || mcb == null || mca < 0 || mcb < 0) return { skip: true };
          const G = ["A組", "B組"], more = ca > cb ? 0 : 1, larger = ca / nA > cb / nB ? 0 : 1;
          const L = (i) => clsLabel(cls[i], "点");
          const other = (i) => pick(r, [0, 1, 2, 3, 4].filter((x) => x !== i));
          // 4つの文：[人数, 割合, A組の中央値, B組の中央値]。正しいのは 1つ
          const truth = r(0, 3);
          const stm = [
            [`${th}点以上の人数は、${G[truth === 0 ? more : 1 - more]}のほうが多い`],
            [`${th}点以上の割合は、${G[truth === 1 ? larger : 1 - larger]}のほうが大きい`],
            [`A組の中央値は、${L(truth === 2 ? mca : other(mca))}の階級にある`],
            [`B組の中央値は、${L(truth === 3 ? mcb : other(mcb))}の階級にある`],
          ].map((x) => x[0]);
          return {
            q: `A組（${nA}人）とB組（${nB}人）の、テストの得点を度数分布表にまとめたところ、A組は、${freqSentence(cls, fa, "点", "人")}。B組は、${freqSentence(cls, fb, "点", "人")}であった。次のうち、正しいものはどれか。`,
            ans: stm[truth],
            choices: shuffle(r, stm),
            hint: "人数がちがうので、「人数」と「割合」は別のこと。中央値は、小さいほうから数えて、まん中にくる値で、累積度数を使って階級をさがす。",
            steps: [`${th}点以上の人数は、A組 ${fa.slice(j).join(" + ")} ＝ ${ca}人、B組 ${fb.slice(j).join(" + ")} ＝ ${cb}人。割合は、A組 ${ca} ÷ ${nA} ≒ ${f2(ca / nA)}、B組 ${cb} ÷ ${nB} ≒ ${f2(cb / nB)}。`, `中央値は、A組が ${L(mca)}の階級、B組が ${L(mcb)}の階級。`, `人数が多いのは ${G[more]}、割合が大きいのは ${G[larger]}。正しいのは「${stm[truth]}」。`],
          };
        }),
        // 07q05 （チャレンジ）平均点 60点で、50点から70点の人が1人もいない5人の得点（例を選ぶ）
        t("07q05", (r) => {
          const outside = () => (r(0, 1) ? r(0, 49) : r(71, 100));
          const fmtSet = (a) => [...a].sort((x, y) => x - y).join("、");
          const inOut = (x) => x >= 0 && x <= 100 && (x < 50 || x > 70);
          // 正解：合計 300、すべて 50 未満か 70 より大きい
          let good = null;
          for (let tr = 0; tr < 500 && !good; tr++) {
            const a = Array.from({ length: 4 }, outside), last = 300 - sum(a);
            if (inOut(last)) good = [...a, last];
          }
          // 誤答A：合計 300 だが、50 以上 70 以下の人がいる
          let badA = null;
          for (let tr = 0; tr < 500 && !badA; tr++) {
            const a = [r(52, 68), ...Array.from({ length: 3 }, () => r(0, 100))], last = 300 - sum(a);
            if (last >= 0 && last <= 100) badA = [...a, last];
          }
          // 誤答B：50 以上 70 以下の人はいないが、合計が 300 でない
          const badB = [];
          for (let tr = 0; tr < 500 && badB.length < 2; tr++) {
            const a = Array.from({ length: 5 }, outside), s = sum(a);
            if (s !== 300 && Math.abs(s - 300) <= 60 && !badB.some((b) => sum(b) === s)) badB.push(a);
          }
          if (!good || !badA || badB.length < 2) return { skip: true };
          const ans = fmtSet(good);
          return {
            q: "「クラスの平均点は 60点だ。だから、このクラスの人は、ほとんど 60点前後だ」という説明が、正しくない例を探したい。次のうち、平均点が 60点で、50点以上 70点以下の人が 1人もいない、5人の得点（0〜100点）はどれか。",
            ans,
            choices: choices4(r, ans, [fmtSet(badA), fmtSet(badB[0]), fmtSet(badB[1])]),
            hint: "平均点が 60点になるには、5人の得点の合計がいくつになればよいかな。そのうえで、どの得点も 50点より下か 70点より上かを確かめよう。",
            steps: ["平均点が 60点だから、5人の合計は 60 × 5 ＝ 300点。", `${ans}　は、合計が ${sum(good)} で、どの得点も 50点未満か 70点より大きい。`, `ほかの組は、合計が 300 でないか、50点以上 70点以下の人がいる。`],
          };
        }),
      ],
    },
  }),
];

// ── 補助 ───────────────────────────────────────────────
/** 合計 n を k 個の階級に分ける（山が1つ。どの階級も 1 以上）。うまくいかなければ null */
function genFreq(r, n, k) {
  for (let tr = 0; tr < 60; tr++) {
    const p = r(1, k - 2);
    const w = Array.from({ length: k }, (_, i) => (Math.pow(1.7, -Math.abs(i - p)) * (70 + r(0, 60))) / 100);
    const tot = sum(w);
    const f = w.map((x) => Math.max(1, Math.round((n * x) / tot)));
    const i = f.indexOf(Math.max(...f));
    f[i] += n - sum(f);
    if (f.every((x) => x >= 1) && f[i] === Math.max(...f)) return f;
  }
  return null;
}
/** 社員 5人の年収（万円）：4人は 250〜500、1人だけ大きい。4人とも平均値より少ない。平均値は整数 */
function wage(r) {
  const base = Array.from({ length: 4 }, () => 50 * r(5, 10)).sort((x, y) => x - y), hi = 50 * r(24, 50);
  const a = [...base, hi], m = sum(a) / 5;
  if (!Number.isInteger(m) || base[3] >= m || m - median(a) < 100) return null;
  return { a, mean: m, med: median(a) };
}

// 移さなかった問題
export const SKIPPED = [];   // 第7時は、演習プリント 7問・小テスト 5問のすべてを移した（「説明する・理由を書く」問いは、正しい説明を選ぶ4択に、グラフは文章に直した）
