// ============================================================
// kukan-01.js — 空間図形 第1時「立体を仲間分けして、特徴をとらえよう」
//   ikkan の演習プリント（kukan-01.dr.1〜11）・小テスト（kukan-01.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「01」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号。例：01d04 ＝ kukan-01.dr.4、01q03 ＝ kukan-01.qz.3
//   面・辺・頂点の数は、solids.js の立体から数える（手で書かない）。
// ============================================================
import { t, pick, choices4, shuffle } from "../kit.js";
import { unit } from "../kukan-kit.js";
import { prism, pyramid, counts, prismName, pyramidName, hedronName, NGON } from "../solids.js";

const WHAT = { F: "面", E: "辺", V: "頂点" };
const UNIT = { F: "個", E: "本", V: "個" };
const NAME = { F: "面の数", E: "辺の数", V: "頂点の数" };

/** n角柱・n角錐の、面・辺・頂点の数（立体から数える） */
const cnt = (kind, n) => counts(kind === "柱" ? prism(n) : pyramid(n));
const nm = (kind, n) => (kind === "柱" ? prismName(n) : pyramidName(n));

export const UNITS = [
  unit("01", {
    name: "立体の仲間分け（角柱・角錐・多面体）",
    desc: "面・辺・頂点の数と、立体の特徴",
    prereqs: ["E6-kakuchu"],
    points: [
      "角柱は、合同で平行な2つの底面と、長方形の側面でできている。角錐は、底面が1つで、側面は三角形。",
      "$n$ 角柱の面は $n+2$ こ、辺は $3n$ 本、頂点は $2n$ こ。$n$ 角錐の面は $n+1$ こ、辺は $2n$ 本、頂点は $n+1$ こ。",
      "平面だけで囲まれた立体を多面体という。円柱・円錐・球は、曲面があるので多面体ではない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 01d01 底面・側面の形
        t("01d01", (r) => {
          const n = r(3, 8), which = pick(r, ["side", "base"]);
          const solid = pick(r, [["柱", n], ["錐", n], ["円柱"], ["円錐"]]);
          const nameOf = solid.length === 1 ? solid[0] : nm(solid[0], solid[1]);
          if (which === "side") {
            const ans = solid[0] === "柱" ? "長方形" : solid[0] === "錐" ? "三角形" : "曲面";
            return {
              q: `${nameOf}の、側面の形は？`,
              ans,
              choices: choices4(r, ans, (solid[0] === "柱" ? ["三角形", "台形", "曲面", "円"] : solid[0] === "錐" ? ["長方形", "台形", "曲面", "円"] : ["三角形", "台形", "五角形", "四角形"]).filter((x) => x !== ans)),   // 円柱・円錐の側面（曲面）の誤答に「長方形」は入れない。角柱の誤答に「平行四辺形」「台形」は入れない（長方形は平行四辺形・台形のなかまと数える見方があるため、正解の長方形と区別がつく三角形・円・曲面を先に）
              hint: solid[0] === "柱" ? "角柱の側面は、上下の底面をつなぐ面。" : solid[0] === "錐" ? "角錐の側面は、頂点に集まる面。" : "円柱・円錐の側面は、平らではない。",
              steps: [solid[0] === "柱" ? "角柱の側面は、すべて長方形。" : solid[0] === "錐" ? "角錐の側面は、すべて三角形。" : "円柱・円錐の側面は、曲面。", `${nameOf}の側面は「${ans}」。`],
            };
          }
          if (solid.length === 1) { // 円柱・円錐の底面は円
            return {
              q: `${nameOf}の、底面の形は？`,
              ans: "円",
              choices: choices4(r, "円", ["三角形", "四角形", "おうぎ形"]),
              hint: "底面は、立体を置いたときの、下の面。",
              steps: [`${nameOf}の底面は円。`],
            };
          }
          const ans = NGON[n];
          return {
            q: `${nameOf}の、底面の形は？`,
            ans,
            choices: choices4(r, ans, [NGON[n + 1], NGON[n - 1 < 3 ? n + 2 : n - 1], n === 4 ? "六角形" : "長方形", "円"]),   // 底面が四角形のとき、「長方形」は誤答にしない（底面が長方形の四角柱もあるので）
            hint: `${nameOf}の名前に、底面の形が入っている。`,
            steps: [`${nameOf}の底面は、${NGON[n]}。`],
          };
        }),
        // 01d02 何面体か
        t("01d02", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = r(3, 6);
          const c = cnt(kind, n), ans = c.F;
          return {
            q: `${nm(kind, n)}は、何面体か。□面体の □は？`,
            ans,
            unit: "",
            hint: "面の数を数えて、「〇面体」とよぶ。",
            steps: [kind === "柱" ? `${prismName(n)}の面は、底面2つと側面${n}つ。` : `${pyramidName(n)}の面は、底面1つと側面${n}つ。`, `面の数は ${ans} だから、${hedronName(ans)}。`],
          };
        }),
        // 01d03 六角柱と五角錐の面・辺・頂点の数
        t("01d03", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = r(3, 8), w = pick(r, ["F", "E", "V"]);
          const c = cnt(kind, n), ans = c[w];
          const ex = kind === "柱"
            ? { F: `底面 2 + 側面 ${n} = ${ans}`, E: `底面の辺 ${n}×2 + 側面の辺 ${n} = ${ans}`, V: `上の底面 ${n} + 下の底面 ${n} = ${ans}` }
            : { F: `底面 1 + 側面 ${n} = ${ans}`, E: `底面の辺 ${n} + 側面の辺 ${n} = ${ans}`, V: `底面 ${n} + 頂点 1 = ${ans}` };
          return {
            q: `${nm(kind, n)}の、${NAME[w]}は？`,
            ans,
            unit: UNIT[w],
            hint: "底面と側面に分けて、数えよう。",
            steps: [ex[w], `${nm(kind, n)}の${NAME[w]}は ${ans}。`],
          };
        }),
        // 01q01 特徴から、立体の名前を答える
        t("01q01", (r) => {
          const n = r(3, 8), kind = pick(r, ["柱", "錐"]), ans = nm(kind, n);
          const wrongs = kind === "柱"
            ? [pyramidName(n), prismName(n === 8 ? 7 : n + 1), "円柱"]
            : [prismName(n), pyramidName(n === 8 ? 7 : n + 1), "円錐"];
          return {
            q: kind === "柱" ? `底面が${NGON[n]}で、側面がすべて長方形の立体の名前は？` : `底面が${NGON[n]}で、側面がすべて三角形の立体の名前は？`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: kind === "柱" ? "側面が長方形なのは、角柱。" : "側面が三角形なのは、角錐。",
            steps: [kind === "柱" ? "側面がすべて長方形の立体は、角柱。" : "側面がすべて三角形の立体は、角錐。", `底面が${NGON[n]}だから、${ans}。`],
          };
        }),
        // 01q02 多面体を選ぶ
        t("01q02", (r) => {
          const ans = pick(r, [prismName(r(3, 8)), pyramidName(r(3, 8)), "立方体", "直方体"]);
          const wrongs = shuffle(r, ["円柱", "円錐", "球", "半球"]).slice(0, 3);
          return {
            q: "次のうち、多面体はどれか。",
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "多面体は、平面だけで囲まれた立体。曲面があるものは、多面体ではない。",
            steps: [`${ans}は、平面だけで囲まれている。`, "円柱・円錐・球・半球には、曲面がある。"],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 01d04 八角柱の面・辺・頂点の数
        t("01d04", (r) => {
          const n = r(7, 11), w = pick(r, ["F", "E", "V"]);
          const ans = cnt("柱", n)[w];
          return {
            q: `${prismName(n)}の、${NAME[w]}は？`,
            ans,
            unit: UNIT[w],
            hint: `${prismName(n)}は、底面が${NGON[n]}。底面と側面に分けて数えよう。`,
            steps: [
              `面 … 底面 2 + 側面 ${n} = ${n + 2}`,
              `辺 … 底面の辺 ${n}×2 + 側面の辺 ${n} = ${3 * n}`,
              `頂点 … ${n}×2 = ${2 * n}`,
              `${NAME[w]}は ${ans}。`,
            ],
          };
        }),
        // 01d05 八角錐の面・辺・頂点の数
        t("01d05", (r) => {
          const n = r(7, 11), w = pick(r, ["F", "E", "V"]);
          const ans = cnt("錐", n)[w];
          return {
            q: `${pyramidName(n)}の、${NAME[w]}は？`,
            ans,
            unit: UNIT[w],
            hint: `${pyramidName(n)}は、底面が${NGON[n]}。底面と側面に分けて数えよう。`,
            steps: [
              `面 … 底面 1 + 側面 ${n} = ${n + 1}`,
              `辺 … 底面の辺 ${n} + 側面の辺 ${n} = ${2 * n}`,
              `頂点 … 底面の ${n} + 頂点 1 = ${n + 1}`,
              `${NAME[w]}は ${ans}。`,
            ],
          };
        }),
        // 01d06 頂点が 12個の角柱は何角柱か。辺の数は
        t("01d06", (r) => {
          const n = r(4, 9), V = cnt("柱", n).V, E = cnt("柱", n).E;
          return {
            q: `頂点が ${V}個ある角柱の、辺の数は？`,
            ans: E,
            unit: "本",
            hint: "角柱の頂点は、上下の底面に同じ数ずつ。底面は何角形かな？",
            steps: [`角柱の頂点は 2n 個。2n = ${V} より n = ${n}（${prismName(n)}）。`, `辺は 3n = 3×${n} = ${E} 本。`],
          };
        }),
        // 01q03 七角柱の面・辺・頂点の数
        t("01q03", (r) => {
          const n = r(5, 9), w = pick(r, ["F", "E", "V"]), ans = cnt("柱", n)[w];
          return {
            q: `${prismName(n)}の、${NAME[w]}は？`,
            ans,
            unit: UNIT[w],
            hint: "底面と側面に分けて数えよう。",
            steps: [`面 … ${n} + 2 = ${n + 2}`, `辺 … 3×${n} = ${3 * n}`, `頂点 … 2×${n} = ${2 * n}`, `${NAME[w]}は ${ans}。`],
          };
        }),
        // 01q04 辺の数が 18 の角錐は何角錐か。面の数は
        t("01q04", (r) => {
          const n = r(4, 12), c = cnt("錐", n), w = pick(r, ["F", "V"]);
          return {
            q: `辺の数が ${c.E} 本の角錐の、${NAME[w]}は？`,
            ans: c[w],
            unit: UNIT[w],
            hint: "角錐の辺は 2n 本（n 角錐のとき）。まず、何角錐かを求めよう。",
            steps: [`角錐の辺は 2n 本。2n = ${c.E} より n = ${n}（${pyramidName(n)}）。`, `面は n + 1 = ${c.F}、頂点も n + 1 = ${c.V}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 01d07 辺の数が21の角柱 → 面の数・頂点の数
        t("01d07", (r) => {
          const n = r(5, 12), c = cnt("柱", n), w = pick(r, ["F", "V"]);
          return {
            q: `辺の数が ${c.E} 本の角柱の、${NAME[w]}は？`,
            ans: c[w],
            unit: UNIT[w],
            hint: "角柱の辺は 3n 本（n 角柱のとき）。まず、何角柱かを求めよう。",
            steps: [`辺は 3n 本。3n = ${c.E} より n = ${n}（${prismName(n)}）。`, w === "F" ? `面は n + 2 = ${c.F}。` : `頂点は 2n = ${c.V}。`],
          };
        }),
        // 01d08 多面体でないものを選ぶ
        t("01d08", (r) => {
          const poly = [prismName(r(3, 8)), pyramidName(r(3, 8)), "立方体", "直方体", "正四面体"];
          const curved = ["円柱", "円錐", "球", "半球"];
          const ans = pick(r, curved);
          const wrongs = shuffle(r, poly).slice(0, 3);
          return {
            q: "次のうち、多面体ではないものはどれか。",
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "多面体は、平面だけで囲まれた立体。",
            steps: [`${ans}には、平らでない面（曲面）がある。`, "曲面をもつ立体は、多面体ではない。"],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 01d09 面の数 F、辺の数 E の多面体の頂点の数（V−E+F=2）
        t("01d09", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = r(4, 9), c = cnt(kind, n);
          return {
            q: `面の数が ${c.F}、辺の数が ${c.E} の多面体がある。頂点の数は？`,
            ans: c.V,
            unit: "個",
            hint: "（頂点の数）−（辺の数）+（面の数）= 2 が、いつでも成り立つ。",
            steps: ["頂点を V とすると　V − 辺 + 面 = 2", `V − ${c.E} + ${c.F} = 2`, `V = 2 + ${c.E} − ${c.F} = ${c.V}`],
          };
        }),
        // 01d10 角柱の面・辺・頂点の合計が 50 → 何角柱か
        t("01d10", (r) => {
          const n = r(5, 12), c = cnt("柱", n), sum = c.F + c.E + c.V;
          return {
            q: `ある角柱の、面の数と辺の数と頂点の数を、すべて合わせると ${sum} になった。この角柱は、□角柱。□は？`,
            ans: n,
            hint: "n 角柱の面・辺・頂点を、n を使って表して、合計の式をつくろう。",
            steps: ["n 角柱の面は n+2、辺は 3n、頂点は 2n。", `合計は (n+2) + 3n + 2n = 6n + 2`, `6n + 2 = ${sum} より n = ${n}`],
          };
        }),
        // 01d11 立方体の8つの角を切り落とした立体
        t("01d11", (r) => {
          const w = pick(r, ["F", "E", "V"]);
          const v = { F: 14, E: 36, V: 24 };
          return {
            q: `立方体の 8つの角を、それぞれの角に集まる 3本の辺を 3等分する点を通る平面で、すべて切り落とした立体の、${NAME[w]}は？`,
            ans: v[w],
            unit: UNIT[w],
            hint: "もとの面・辺と、切り口でふえた面・辺に分けて数えよう。",
            steps: ["面 … もとの面 6 + 切り口 8 = 14", "頂点 … 切り口の三角形の頂点 3×8 = 24", "辺 … もとの辺 12 + 切り口の辺 3×8 = 36", "確かめ　24 − 36 + 14 = 2"],
          };
        }),
        // 01q05 面がすべて三角形で、面の数が 8 の多面体の辺・頂点の数
        t("01q05", (r) => {
          const F = pick(r, [4, 6, 8, 10, 12]), E = (3 * F) / 2, V = E - F + 2, w = pick(r, ["E", "V"]);
          return {
            q: `面がすべて三角形で、面の数が ${F} の多面体がある。${NAME[w]}は？（「頂点−辺+面＝2」を使ってよい）`,
            ans: w === "E" ? E : V,
            unit: UNIT[w],
            hint: "辺を面ごとに数えると、どの辺も 2つの面に使われている。",
            steps: [`辺を面ごとに数えると 3×${F} = ${3 * F}。どの辺も 2つの面に使われるので ${3 * F}÷2 = ${E}（本）`, `頂点は　V − ${E} + ${F} = 2　より　V = ${V}`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 第1時は、演習プリント 11問・小テスト 5問のすべてを移した（説明を求める問いは、数値か4択に直した）
