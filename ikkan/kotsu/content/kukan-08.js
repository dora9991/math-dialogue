// ============================================================
// kukan-08.js — 空間図形 第8時「ヒントを組み合わせて、立体を当てよう（立体当てクイズ）」
//   ikkan の演習プリント（kukan-08.dr.1〜10）・小テスト（kukan-08.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「08」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：08d01a ＝ kukan-08.dr.1 の1つ目
//
//   ヒントの文は、「立体ごとの特徴の表」（SOL）から計算でつくる。
//     ・表には、「かならずある特徴」（sure）のほかに、「場合によってはある特徴」（may）も持たせる。
//         例：四角錐は「底面が四角形」としか決まっていない。底面が長方形・正方形のときは、展開図に長方形（正方形）ができる。
//             正方形は長方形の一種、正四角錐は四角錐の特別なもの、など。
//     ・ヒントにあてはまる立体は「ありうる」（sure か may）で数える。
//     ・ヒントの組は、「答えにかならずあてはまり、ほかの立体には、2つのヒントの両方が『ありうる』立体がない」ものだけを使う。
//         → 2つのヒントで、厳密に 1つに決まる。ヒント1だけでは、決まらない（ありうる立体が 2つ以上）。
//     ・「場合による」立体が、数える問い・選択肢に紛れこまないよう、そのような立体は、問いの範囲から外す（問題文に範囲を書く）。
//   面・辺・頂点の数は、solids.js の立体から数える（手で書かない）。
//   ・「ヒントをつくる」「例をあげる」問い（dr.6、dr.8、qz.2、qz.4）は、「正しいものを選ぶ」4択に直した。
//   ・図（投影図）は、「立面図が…、平面図が…」と文章で言いきった。
// ============================================================
import { t, pick, choices4, shuffle } from "../kit.js";
import { unit, fixed } from "../kukan-kit.js";
import { cuboid, prism, pyramid, counts, prismName, pyramidName, NGON } from "../solids.js";

const cnt = (kind, n) => counts(kind === "柱" ? prism(n) : pyramid(n));
const strip = (s) => s.replace(/。$/, "");
const names = (a) => a.join("・");
const tsu = (k) => (k <= 9 ? `${k}つ` : `${k}`);   // 面の数の言い方：9つまでは「つ」、10以上は、ikkan にならって数だけ（「面が 12あり」）
const inter = (a, b) => a.filter((x) => b.includes(x));

// ───────── 立体ごとの「特徴の表」 ─────────
// 底面を下に置いたときの、見え方（plan＝平面図、elev＝立面図）・展開図（net）・側面（side）・底面（base）、面・頂点・辺の数（F・V・E）。
// plan・elev・net・side・base は「かならずある言い方」の配列。第3引数 may は、「場合によってはある言い方 → そのときの条件」。
const SOL = {};
const add = (name, o, may = {}) => { SOL[name] = { name, may, ...o }; };
const BASE_RECT = "底面が長方形のとき", BASE_SQ = "底面が正方形のとき", SQ_RECT = "正方形も長方形の一種と見れば";
add("円柱", { poly: false, rot: true, F: 3, side: ["曲面"], base: ["円"], plan: ["円"], elev: ["長方形"], net: ["長方形", "円"] });
add("円錐", { poly: false, rot: true, F: 2, side: ["曲面"], base: ["円"], plan: ["円"], elev: ["二等辺三角形"], net: ["おうぎ形", "円"] });
add("球", { poly: false, rot: true, F: 1, side: [], base: [], plan: ["円"], elev: ["円"], net: [] });
for (let n = 3; n <= 6; n++) {
  const a = cnt("柱", n), b = cnt("錐", n);
  add(prismName(n),
    { poly: true, rot: false, F: a.F, V: a.V, E: a.E, side: ["長方形"], base: [NGON[n]], plan: n === 3 ? ["三角形"] : [], elev: ["長方形"], net: n === 3 ? ["長方形", "三角形"] : n === 4 ? ["長方形"] : ["長方形", NGON[n]] },
    n === 4 ? { base: { 長方形: BASE_RECT, 正方形: BASE_SQ }, net: { 正方形: BASE_SQ } } : {});
  add(pyramidName(n),
    { poly: true, rot: false, F: b.F, V: b.V, E: b.E, side: ["三角形"], base: [NGON[n]], plan: [], elev: [], net: n <= 4 ? ["三角形"] : ["三角形", NGON[n]] },
    n === 4 ? { base: { 長方形: BASE_RECT, 正方形: BASE_SQ }, net: { 長方形: BASE_RECT, 正方形: BASE_SQ } } : {});
}
{ // 正四角錐（底面が正方形）。四角錐は「底面が四角形」だけ決まっている立体、正四角錐は、その特別なもの
  const b = cnt("錐", 4);
  add("正四角錐", { poly: true, rot: false, F: b.F, V: b.V, E: b.E, side: ["三角形"], base: ["正方形", "四角形"], plan: ["正方形（対角線入り）"], elev: ["二等辺三角形"], net: ["三角形", "正方形", "四角形"] },
    { net: { 長方形: SQ_RECT }, plan: { 正方形: "対角線入りの正方形" } });
  const c = counts(cuboid(3, 3, 3));   // 立方体
  add("立方体", { poly: true, rot: false, F: c.F, V: c.V, E: c.E, side: ["正方形"], base: ["正方形"], plan: ["正方形"], elev: ["正方形"], net: ["正方形"] },
    { elev: { 長方形: SQ_RECT }, net: { 長方形: SQ_RECT } });
}

// ───────── ヒント（特徴）の文 ─────────
// lv(s)：2＝かならずあてはまる／1＝場合によってはあてはまる／0＝あてはまらない
const LV = (key, v) => (s) => ((s[key] || []).includes(v) ? 2 : (s.may[key] || {})[v] ? 1 : 0);
const NOTE = (key, v) => (s) => (s.may[key] || {})[v] || "";
const feat = (g, text, key, v) => ({ g, text, lv: LV(key, v), note: NOTE(key, v) });
const num = (g, text, key, k) => ({ g, text, lv: (s) => (s[key] === k ? 2 : 0), note: () => "" });
const FT = {
  plan: (v) => feat("plan", `平面図は、${v}である。`, "plan", v),
  elev: (v) => feat("elev", `立面図は、${v}である。`, "elev", v),
  net: (v) => feat("net", `展開図に、${v}がある。`, "net", v),
  base: (v) => feat("base", `底面は、${v}である。`, "base", v),
  side: (v) => feat("side", v === "曲面" ? "側面は、曲面である。" : `側面は、すべて${v}である。`, "side", v),
  face: (k) => num("face", `面は ${tsu(k)}ある。`, "F", k),
  vert: (k) => num("vert", `頂点は ${k}個ある。`, "V", k),
  edge: (k) => num("edge", `辺は ${k}本ある。`, "E", k),
  poly: () => ({ g: "kind", text: "多面体である。", lv: (s) => (s.poly ? 2 : 0), note: () => "" }),
  rot: () => ({ g: "kind", text: "回転体である。", lv: (s) => (s.rot ? 2 : 0), note: () => "" }),
};
/** ヒントにあてはまる「ありうる」立体の名前（sure も may も） */
const possOf = (U, f) => U.filter((s) => f.lv(s) >= 1).map((s) => s.name);
/** 立体の名前の並びを、「場合による」ものには条件をそえて書く（fs＝そのヒント） */
const fmt = (list, ...fs) => list.map((n) => {
  const notes = fs.map((f) => (f.lv(SOL[n]) === 1 ? f.note(SOL[n]) : "")).filter(Boolean);
  return notes.length ? `${n}（${notes.join("・")}）` : n;
}).join("・");
const vals = (U, k) => [...new Set(U.map((s) => s[k]))].sort((x, y) => x - y);

/**
 * テーマ：立体の集まり（nameList）と、ヒント1・ヒント2に使える特徴から、次の組を、すべて求める。
 *   ・答え（AB の 1つ）は、2つのヒントに「かならず」あてはまる
 *   ・ヒント1・ヒント2のそれぞれで、あてはまりうる立体が 2つ以上（それだけでは決まらない）
 *   ・2つのヒントの両方があてはまりうる立体は、答えだけ
 * singles：「ヒント1だけで、いくつあてはまるか」を聞く特徴（場合による立体は、問いの範囲から外すので、かならずあてはまる立体が 2つ以上）
 */
function theme(nameList, h1s, h2s, countFs = h1s) {
  const U = nameList.map((n) => SOL[n]);
  const pairs = [];
  for (const a of h1s) for (const b of h2s) {
    if (a.g === b.g) continue;
    const A = possOf(U, a), B = possOf(U, b), AB = inter(A, B);
    if (A.length >= 2 && B.length >= 2 && AB.length === 1 && a.lv(SOL[AB[0]]) === 2 && b.lv(SOL[AB[0]]) === 2) pairs.push({ a, b, A, B, ans: AB[0] });
  }
  if (!pairs.length) throw new Error("ヒントの組がない");
  const singles = countFs.filter((f) => {
    const listed = U.filter((s) => f.lv(s) !== 1);
    return listed.length >= 4 && listed.filter((s) => f.lv(s) === 2).length >= 2;
  });
  return { names: nameList, U, pairs, singles };
}

// P：投影図（平面図・立面図）・展開図と、回転体・多面体
const NAMES_P = ["円柱", "円錐", "球", "三角柱", "正四角錐"];
const FP = [FT.plan("円"), FT.plan("三角形"), FT.plan("正方形（対角線入り）"), FT.elev("長方形"), FT.elev("二等辺三角形"), FT.elev("円"), FT.rot(), FT.poly(),
  FT.net("長方形"), FT.net("おうぎ形"), FT.net("三角形"), FT.net("円")];
const TP = theme(NAMES_P, FP, FP);
// N：面・頂点・辺の数と、側面・底面の形（角柱・角錐）
const NAMES_N = [3, 4, 5, 6].flatMap((n) => [prismName(n), pyramidName(n)]);
const UN = NAMES_N.map((n) => SOL[n]);
const FN = [...vals(UN, "F").map(FT.face), ...vals(UN, "V").map(FT.vert), ...vals(UN, "E").map(FT.edge), FT.side("長方形"), FT.side("三角形"), ...[3, 4, 5, 6].map((n) => FT.base(NGON[n]))];
const TN = theme(NAMES_N, FN, FN);
// T：展開図と、底面・側面（四角錐は「底面が四角形」としか決まっていないので、展開図の長方形は「場合による」）
const NAMES_T = ["円柱", "円錐", "三角柱", "四角柱", "五角柱", "三角錐", "四角錐", "五角錐"];
const FT_NET = [FT.net("長方形"), FT.net("おうぎ形"), FT.net("三角形"), FT.net("円"), FT.net("五角形")];
const FT_BASE = [FT.base("円"), FT.base("三角形"), FT.base("四角形"), FT.base("五角形")];
const FT_BS = [...FT_BASE, FT.side("曲面"), FT.side("長方形"), FT.side("三角形")];
const TT = theme(NAMES_T, FT_NET, FT_BS, [...FT_NET, ...FT_BASE]);

/** 「ヒント1とヒント2の両方にあてはまる立体は？」（4択）。ヒント1だけでは決まらず、ヒント2を足すと決まる */
const quizFinal = (th, note = "") => (r) => {
  const p = pick(r, th.pairs);
  const only1 = p.A.filter((x) => x !== p.ans), only2 = p.B.filter((x) => x !== p.ans);
  const rest = th.names.filter((x) => !p.A.includes(x) && !p.B.includes(x));
  const choices = choices4(r, p.ans, [...shuffle(r, only1), ...shuffle(r, only2), ...shuffle(r, rest)]);
  const range = [note, `立体は、${names(th.names)}の中から考える`].filter(Boolean).join("。");
  return {
    q: `ヒント1 … ${p.a.text}　ヒント2 … ${p.b.text}　ヒント1とヒント2の、両方にあてはまる立体は？（${range}）`,
    ans: p.ans,
    choices,
    hint: "ヒント1であてはまる立体を、先に全部あげよう。そのあと、ヒント2であてはまる立体にしぼる。",
    steps: [
      `ヒント1（${strip(p.a.text)}）だけでは … ${fmt(p.A, p.a)}（${p.A.length}つ）で、1つに決まらない。`,
      `ヒント2（${strip(p.b.text)}）にあてはまるのは … ${fmt(p.B, p.b)}。`,
      `ヒント2を足して、どちらにもあてはまるのは … ${p.ans}。`,
    ],
  };
};
/** 「ヒント1だけであてはまる立体は、何こか」（数）。「全部あげる」の数え方。「場合による」立体は、範囲から外す */
const quizCount = (th, note = "") => (r) => {
  const f = pick(r, th.singles);
  const listed = th.U.filter((s) => f.lv(s) !== 1), A = listed.filter((s) => f.lv(s) === 2).map((s) => s.name);
  return {
    q: `${names(listed.map((s) => s.name))}の ${listed.length}つの立体がある。ヒント1 … ${f.text}　ヒント1だけであてはまる立体は、何こあるか。${note}`,
    ans: A.length,
    unit: "こ",
    hint: "ヒント1を、立体1つずつにあてはめて、あてはまるものを数えよう。",
    steps: [`ヒント1（${strip(f.text)}）を、1つずつ調べる。`, `あてはまるのは … ${names(A)}。`, `全部で ${A.length}つ。`],
  };
};

// ───────── 正多面体 ─────────
const REG = [
  { name: "正四面体", F: 4, n: 3, k: 3 },
  { name: "立方体", F: 6, n: 4, k: 3 },
  { name: "正八面体", F: 8, n: 3, k: 4 },
  { name: "正十二面体", F: 12, n: 5, k: 3 },
  { name: "正二十面体", F: 20, n: 3, k: 5 },
].map((o) => {
  const E = (o.F * o.n) / 2, V = (o.F * o.n) / o.k;
  if (V - E + o.F !== 2) throw new Error(`${o.name}：頂点−辺+面 が 2 にならない`);
  return { ...o, E, V, face: o.n === 4 ? "正方形" : `正${NGON[o.n]}` };
});
const regFeature = (o) => `面が ${tsu(o.F)}あり、すべて合同な${o.face}で、どの頂点にも ${o.k}つの面が集まる`;
const regChoices = (r, o, pool = REG) => choices4(r, o.name, shuffle(r, pool.filter((x) => x.name !== o.name).map((x) => x.name)));
/** 辺・頂点の数を、「面ごとに数えて、2つ（k つ）の面に使われる」で求める説明 */
const regSteps = (o, w) => w === "E"
  ? [`面ごとの辺の数 ${o.n}×${o.F} = ${o.n * o.F}。1本の辺は 2つの面に使われているから、${o.n * o.F}÷2 = ${o.E}（本）`, `確かめ（頂点−辺+面）… ${o.V} − ${o.E} + ${o.F} = 2`]
  : [`面ごとの頂点の数 ${o.n}×${o.F} = ${o.n * o.F}。1つの頂点に ${o.k}つの面が集まるから、${o.n * o.F}÷${o.k} = ${o.V}（個）`, `確かめ（頂点−辺+面）… ${o.V} − ${o.E} + ${o.F} = 2`];

// ───────── 展開図から立体を当てる ─────────
const NETS = [
  { name: "円柱", text: "円2つと、長方形1つ", why: "底面の円が 2つ、側面が 1つの長方形に開く → 円柱" },
  { name: "円錐", text: "おうぎ形1つと、円1つ", why: "底面の円が 1つ、側面がおうぎ形に開く → 円錐" },
  { name: "三角柱", text: "三角形2つと、長方形3つ", why: "底面の三角形が 2つ、側面の長方形が 3つ → 三角柱" },
  { name: "四角錐", text: "四角形1つと、三角形4つ", why: "底面の四角形が 1つ、側面の三角形が 4つ → 四角錐" },
  { name: "五角柱", text: "五角形2つと、長方形5つ", why: "底面の五角形が 2つ、側面の長方形が 5つ → 五角柱" },
  { name: "五角錐", text: "五角形1つと、三角形5つ", why: "底面の五角形が 1つ、側面の三角形が 5つ → 五角錐" },
  { name: "正四面体", text: "合同な正三角形4つ", why: "合同な正三角形が 4つ → 正四面体" },
  { name: "立方体", text: "合同な正方形6つ", why: "合同な正方形が 6つ → 立方体" },
];
const netQuiz = (use) => (r) => {
  const pool = NETS.filter((x) => use.includes(x.name));
  const o = pick(r, pool);
  const others = shuffle(r, pool.filter((x) => x !== o)).map((x) => x.name);
  return {
    q: `展開図が、${o.text}でできている立体の名前は？`,
    ans: o.name,
    choices: choices4(r, o.name, others),
    hint: "展開図の面を、形ごとに数えて、底面と側面に分けて考えよう。",
    steps: [o.why, `展開図の面の数を数えると、${o.text}。だから ${o.name}。`],
  };
};

// ───────── 投影図（立面図・平面図）から立体を当てる ─────────
const NAMES_V = ["円柱", "円錐", "球", "三角柱", "正四角錐", "立方体"];
const viewQuiz = (use) => (r) => {
  const T = SOL[pick(r, use)];
  const e = T.elev[0], p = T.plan[0], fe = FT.elev(e), fp = FT.plan(p);
  const U = NAMES_V.map((n) => SOL[n]);
  const hit = U.filter((s) => fe.lv(s) >= 1 && fp.lv(s) >= 1);
  if (hit.length !== 1 || hit[0] !== T) throw new Error(`投影図の組が 1つに決まらない: ${T.name}`);
  const sameE = U.filter((s) => s !== T && fe.lv(s) >= 1).map((s) => s.name);
  const sameP = U.filter((s) => s !== T && fp.lv(s) >= 1).map((s) => s.name);
  const rest = U.filter((s) => s !== T && !sameE.includes(s.name) && !sameP.includes(s.name)).map((s) => s.name);
  return {
    q: (e === p ? `立面図も平面図も${e}になる立体は？` : `立面図が${e}で、平面図が${p}になる立体は？`) + (T.name === "球" ? "" : "（底面を下にして置く）"),
    ans: T.name,
    choices: choices4(r, T.name, [...shuffle(r, sameE), ...shuffle(r, sameP), ...shuffle(r, rest)]),
    hint: "立面図は正面から、平面図は真上から見た図。片方の図だけで決まらないときは、もう片方の図で、しぼろう。",
    steps: [
      `立面図が${e}になる立体は … ${fmt(possOf(U, fe), fe)}。`,
      `平面図が${p}になる立体は … ${fmt(possOf(U, fp), fp)}。`,
      `どちらにもあてはまるのは … ${T.name}。`,
    ],
  };
};
for (const n of ["円錐", "正四角錐", "三角柱", "円柱", ...NAMES_V]) viewQuiz([n])(() => 0);   // どの立体でも、1つに決まることを、読みこみ時に確かめる

export const UNITS = [
  unit("08", {
    name: "立体当てクイズ（ヒントを組み合わせて）",
    desc: "見方（投影図・展開図）と面・辺・頂点の数で、立体を決める",
    prereqs: ["J1-kk07", "J1-k1"],
    points: [
      "立体は、いろいろな見方（見取図・展開図・投影図）と、面・辺・頂点の数のヒントを組み合わせると、1つに決まる。",
      "ヒント1だけでは、あてはまる立体がいくつも残る。ヒント2・3を足して、しぼりこんでいく。",
      "立面図は正面から、平面図は真上から見た図。円柱は立面図が長方形・平面図が円、円錐は立面図が二等辺三角形・平面図が円。",
      "多面体では、（頂点の数）−（辺の数）＋（面の数）＝2 が成り立つ。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 08d01 ヒント1 … 平面図は円　ヒント2 … 立面図は二等辺三角形（投影図のヒント）
        t("08d01a", quizCount(TP, "（底面を下にして置く）")),
        t("08d01b", quizFinal(TP, "底面を下にして置く")),
        // 08d02 ヒント1 … 面は 5つ　ヒント2 … 側面は、すべて三角形（面・辺・頂点の数のヒント）
        t("08d02a", quizCount(TN)),
        t("08d02b", quizFinal(TN)),
        // 08d03 ヒント1 … 展開図に長方形がある　ヒント2 … 底面は三角形（展開図のヒント）
        t("08d03a", quizCount(TT)),
        t("08d03b", quizFinal(TT)),
        // 08q01 次の特徴をもつ立体の名前（ア 展開図／イ どこから見ても円／ウ 立面図・平面図）
        t("08q01a", netQuiz(["円錐", "円柱", "三角柱", "四角錐"])),
        fixed("08q01b", (r) => ({
          q: "どの方向から見ても、円に見える立体は？",
          ans: "球",
          choices: choices4(r, "球", shuffle(r, ["円柱", "円錐", "三角柱", "立方体"])),
          hint: "円柱や円錐は、真横から見ると、円にならない。",
          steps: ["円柱を横から見ると長方形、円錐を横から見ると二等辺三角形になる。", "どの方向から見ても円なのは、球。"],
        })),
        t("08q01c", viewQuiz(["円錐", "正四角錐", "三角柱", "円柱"])),
        // 08q02 「立面図が長方形である」立体を2つ答える → 当てはまるものを選ぶ4択
        t("08q02", (r) => {
          const U = NAMES_P.map((n) => SOL[n]);
          const shape = pick(r, ["長方形", "二等辺三角形", "円"]), f = FT.elev(shape);
          const ok = U.filter((s) => f.lv(s) === 2).map((s) => s.name), ng = U.filter((s) => f.lv(s) === 0).map((s) => s.name);
          const ans = pick(r, ok);
          return {
            q: `立面図が${shape}になる立体は、次のうちどれか。（底面を下にして置く）`,
            ans,
            choices: choices4(r, ans, shuffle(r, ng)),
            hint: "立面図は、正面から見た図。立体を1つずつ、正面から見て、形を思いうかべよう。",
            steps: [`立面図が${shape}になる立体は … ${names(ok)}。`, `${ans}は、正面から見ると${shape}になる。`, `${names(ng)}の立面図は、${shape}ではない。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 08d04 ヒント1 … 多面体　ヒント2 … 面は 6つ　ヒント3 … すべての面が合同な正方形
        t("08d04", (r) => {
          const o = pick(r, REG);
          const N = o.F, extra = N === 8 || N === 20;   // 面が 8つ・20の正三角形だけでは決まらないので、頂点に集まる面の数もそえる
          const h3 = extra ? `すべての面が、合同な${o.face}で、どの頂点にも ${o.k}つの面が集まる。` : `すべての面が、合同な${o.face}である。`;
          const cand = N === 4 ? "三角錐（四面体は、三角錐の形だけ）"
            : N === 20 ? `${o.name}のほか、角柱・角錐にもある`
            : `${prismName(N - 2)}（${N - 2}+2）・${pyramidName(N - 1)}（${N - 1}+1）・${o.name}など`;
          return {
            q: `ヒント1 … 多面体である。　ヒント2 … 面は ${tsu(N)}ある。　ヒント3 … ${h3}　あてはまる立体は？`,
            ans: o.name,
            choices: regChoices(r, o),
            hint: "ヒントを1つずつ足して、あてはまる立体がへっていくようすを、たどろう。",
            steps: [
              "ヒント1だけでは … 角柱・角錐・正多面体など、たくさん残る。",
              `ヒント2で … 面が ${tsu(N)}なのは ${cand}。`,
              `ヒント3で … ${extra ? `面がすべて合同な${o.face}で、頂点に ${o.k}つの面が集まる` : `面がすべて合同な${o.face}な`}のは、${o.name}だけ。`,
            ],
          };
        }),
        // 08d05 頂点が 6個、辺が 9本の多面体 → 面の数、立体の名前（頂点−辺+面＝2）
        t("08d05a", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = kind === "柱" ? r(3, 8) : r(4, 8), c = cnt(kind, n);
          return {
            q: `頂点が ${c.V}個、辺が ${c.E}本の、角柱か角錐がある。面の数は、いくつか。`,
            ans: c.F,
            unit: "個",
            hint: "「頂点の数−辺の数+面の数＝2」を使おう。",
            steps: ["頂点 − 辺 + 面 = 2 が成り立つ。", `${c.V} − ${c.E} + 面 = 2 より、面 = 2 − ${c.V} + ${c.E} = ${c.F}`],
          };
        }),
        t("08d05b", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = kind === "柱" ? r(3, 8) : r(4, 8), c = cnt(kind, n);
          const ans = kind === "柱" ? prismName(n) : pyramidName(n);
          const other = kind === "柱" ? pyramidName(c.F - 1) : prismName(c.F - 2);
          return {
            q: `頂点が ${c.V}個、辺が ${c.E}本の、角柱か角錐がある。この立体の名前は？`,
            ans,
            choices: choices4(r, ans, [other, kind === "柱" ? pyramidName(n) : prismName(n), kind === "柱" ? prismName(n + 1) : pyramidName(n + 1)]),
            hint: "まず、「頂点−辺+面＝2」で面の数を求める。面の数が同じ立体は、角柱と角錐に 1つずつ。頂点の数で見分けよう。",
            steps: [
              `面の数は 2 − ${c.V} + ${c.E} = ${c.F}`,
              `面が ${tsu(c.F)}の立体は、${prismName(c.F - 2)}（${c.F - 2}+2）と ${pyramidName(c.F - 1)}（${c.F - 1}+1）。`,
              `頂点が ${c.V}個なのは … ${ans}`,
            ],
          };
        }),
        // 08q03 頂点が 5個、辺が 8本の多面体 → 面の数、立体の名前
        t("08q03a", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = kind === "柱" ? r(3, 6) : r(4, 7), c = cnt(kind, n);
          return {
            q: `頂点が ${c.V}個、辺が ${c.E}本の多面体がある。この多面体は、角柱か角錐である。面の数は、いくつか。`,
            ans: c.F,
            unit: "個",
            hint: "「頂点の数−辺の数+面の数＝2」を使おう。",
            steps: ["頂点 − 辺 + 面 = 2 が成り立つ。", `${c.V} − ${c.E} + 面 = 2 より、面 = 2 − ${c.V} + ${c.E} = ${c.F}`],
          };
        }),
        t("08q03b", (r) => {
          const kind = pick(r, ["柱", "錐"]), n = kind === "柱" ? r(3, 6) : r(4, 7), c = cnt(kind, n);
          const ans = kind === "柱" ? prismName(n) : pyramidName(n);
          const other = kind === "柱" ? pyramidName(c.F - 1) : prismName(c.F - 2);
          return {
            q: `頂点が ${c.V}個、辺が ${c.E}本の多面体がある。この多面体は、角柱か角錐である。立体の名前は？`,
            ans,
            choices: choices4(r, ans, [other, kind === "柱" ? pyramidName(n) : prismName(n), kind === "柱" ? prismName(n + 1) : pyramidName(n + 1)]),
            hint: "面の数を求めてから、その面の数になる角柱と角錐を、頂点の数で見分けよう。",
            steps: [
              `面の数は 2 − ${c.V} + ${c.E} = ${c.F}`,
              `面が ${tsu(c.F)}なのは、${prismName(c.F - 2)}（${c.F - 2}+2）と ${pyramidName(c.F - 1)}（${c.F - 1}+1）。`,
              `頂点が ${c.V}個なのは … ${ans}`,
            ],
          };
        }),
        // 08q04 「回転体である」に、もう1つヒントを足して、円柱に決める → 足すヒントを選ぶ4択
        t("08q04", (r) => {
          const U = NAMES_P.map((n) => SOL[n]);
          const FQ = [FT.plan("円"), FT.plan("三角形"), FT.plan("正方形（対角線入り）"), FT.elev("長方形"), FT.elev("二等辺三角形"), FT.elev("円"),
            FT.net("長方形"), FT.net("おうぎ形"), FT.net("三角形"), FT.net("円"), FT.base("円"), FT.base("三角形"), FT.side("曲面"), FT.side("長方形"), FT.side("三角形")];
          const B = pick(r, [FT.rot(), FT.poly()]), SB = possOf(U, B);
          const T = pick(r, SB);
          const after = (f) => SB.filter((n) => f.lv(SOL[n]) >= 1);   // 足したあとに、ありうる立体
          const good = FQ.filter((f) => f.lv(SOL[T]) === 2 && after(f).length === 1);
          const bad1 = FQ.filter((f) => f.lv(SOL[T]) === 2 && after(f).length >= 2), bad2 = FQ.filter((f) => f.lv(SOL[T]) === 0 && after(f).length >= 1);
          const ans = pick(r, good);
          const wrongs = [...shuffle(r, bad1).slice(0, 2), ...shuffle(r, bad2), ...shuffle(r, bad1)];
          const ch = choices4(r, ans.text, wrongs.map((f) => f.text));
          const shown = ch.filter((x) => x !== ans.text).map((x) => FQ.find((f) => f.text === x));
          return {
            q: `「${strip(B.text)}」というヒントに、もう1つヒントを足して、${T}に決めたい。足すヒントとして、よいものはどれか。（立体は、${names(NAMES_P)}の中から考える）`,
            ans: ans.text,
            choices: ch,
            hint: "足したあとに、あてはまる立体が 1つだけ残るヒントをさがそう。",
            steps: [
              `「${strip(B.text)}」だけで、あてはまるのは … ${names(SB)}。`,
              `「${strip(ans.text)}」を足すと、${T}だけが残る。`,
              `ほかは … ${shown.map((f) => `「${strip(f.text)}」→ ${after(f).length ? fmt(after(f), f) : "あてはまる立体がない"}`).join("　／　")}`,
            ],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 08d06 正四角錐が答えになるように、ヒントを3つつくる → 正しいヒントの組を選ぶ4択
        t("08d06", (r) => {
          const nm5 = ["三角柱", "四角柱", "三角錐", "正四角錐", "五角錐"];
          const U = nm5.map((n) => SOL[n]);
          const F5 = [...vals(U, "F").map(FT.face), ...vals(U, "V").map(FT.vert), ...vals(U, "E").map(FT.edge), FT.side("長方形"), FT.side("三角形"),
            FT.base("三角形"), FT.base("四角形"), FT.base("五角形"), FT.base("正方形")];
          const tri = (T) => {   // 答えに「かならず」あてはまるヒントの組（3つ）と、ありうる立体の絞れ方
            const tf = F5.filter((f) => f.lv(T) === 2), out = [];
            for (const a of tf) for (const b of tf) for (const c of tf) {
              if (a.g === b.g || a.g === c.g || b.g === c.g) continue;
              const S1 = possOf(U, a), S12 = inter(S1, possOf(U, b)), S123 = inter(S12, possOf(U, c));
              out.push({ hs: [a, b, c], S1, S12, n1: S1.length, n123: S123.length });
            }
            return out;
          };
          const targets = U.filter((T) => tri(T).some((x) => x.n1 >= 2 && x.n123 === 1));
          const T = pick(r, targets);
          const all = tri(T);
          const good = all.filter((x) => x.n1 >= 2 && x.n123 === 1), single = all.filter((x) => x.n1 === 1), open = all.filter((x) => x.n1 >= 2 && x.n123 >= 2);
          const text = (hs) => `ヒント1 … ${hs[0].text}　ヒント2 … ${hs[1].text}　ヒント3 … ${hs[2].text}`;
          const key = (hs) => hs.map((h) => h.text).sort().join("|");
          const g = pick(r, good), used = new Set([key(g.hs)]);
          const wrongs = [];
          const tryAdd = (hs) => { if (hs && !used.has(key(hs)) && wrongs.length < 3) { used.add(key(hs)); wrongs.push(text(hs)); } };
          tryAdd(shuffle(r, single).map((x) => x.hs).find((hs) => !used.has(key(hs))));
          tryAdd(shuffle(r, open).map((x) => x.hs).find((hs) => !used.has(key(hs))));
          const falseF = F5.filter((f) => f.lv(T) === 0);   // 答えに「あてはまらない」とはっきり言えるヒントだけ（場合による、は使わない）
          for (let i = 0; i < 80 && wrongs.length < 3; i++) {   // 1つだけ、答えにあてはまらないヒントがまざった組
            const pos = r(0, 2), hs = [...pick(r, good).hs], f = pick(r, falseF);
            if (hs.some((h, j) => j !== pos && h.g === f.g)) continue;
            hs[pos] = f;
            tryAdd(hs);
          }
          const ans = text(g.hs);
          return {
            q: `${names(nm5)}のうち、どれか 1つを当てるクイズをつくる。答えを「${T.name}」にしたい。ヒントの組として、正しいものはどれか。（3つとも答えにあてはまり、ヒント1だけでは決まらず、3つそろうと 1つに決まる組）`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "ヒントを1つずつ足して、あてはまる立体が、どうへっていくか、たどってみよう。",
            steps: [
              `ヒント1（${strip(g.hs[0].text)}）だけで、あてはまるのは … ${fmt(g.S1, g.hs[0])}。1つには決まらない。`,
              `ヒント2・3を足すと、${T.name}だけに決まる。3つとも、${T.name}にあてはまっている。`,
              "ほかの組は、「答えにあてはまらないヒントがある」「ヒント1だけで決まってしまう」「3つそろっても決まらない」のどれか。",
            ],
          };
        }),
        // 08d07 投影図（上が立面図、下が平面図）は、どんな立体か
        t("08d07", viewQuiz(NAMES_V)),
        // 08d08 「面が 6つある」立体を 3つ答える → 面が 6つある立体を選ぶ4択
        t("08d08", (r) => {
          const N = pick(r, [5, 6, 7, 8]);
          const ok = [prismName(N - 2), pyramidName(N - 1)];
          if (N === 6) ok.push("立方体");
          if (N === 8) ok.push("正八面体");
          const ans = pick(r, ok);
          const pool = [];
          for (let n = 3; n <= 7; n++) { if (n + 2 !== N) pool.push(prismName(n)); if (n + 1 !== N) pool.push(pyramidName(n)); }
          if (N !== 6) pool.push("立方体");
          if (N !== 8) pool.push("正八面体");
          return {
            q: `面が ${tsu(N)}ある立体は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, pool)),
            hint: "n 角柱の面は「底面2つ+側面 n つ」、n 角錐の面は「底面1つ+側面 n つ」。",
            steps: ["角柱の面の数は n+2、角錐の面の数は n+1。", `面が ${tsu(N)}になるのは … ${ok.map((x) => x === prismName(N - 2) ? `${x}（${N - 2}+2）` : x === pyramidName(N - 1) ? `${x}（${N - 1}+1）` : x).join("・")}。`, `${ans}は、面が ${tsu(N)}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 08d09 A〜D：次の特徴をもつ立体の名前
        t("08d09a", (r) => {
          const o = pick(r, REG);
          return {
            q: `${regFeature(o)}立体の名前は？`,
            ans: o.name,
            choices: regChoices(r, o),
            hint: "面の数と、面の形から、正多面体の種類をしぼろう。",
            steps: ["正多面体は、正四面体・立方体（正六面体）・正八面体・正十二面体・正二十面体の 5種類。", `面が ${tsu(o.F)}、面の形が${o.face}、1つの頂点に ${o.k}つの面が集まるのは … ${o.name}。`],
          };
        }),
        t("08d09b", netQuiz(NETS.map((x) => x.name))),
        t("08d09c", (r) => {
          const n = r(4, 9), c = cnt("錐", n), ans = pyramidName(n);
          return {
            q: `頂点が ${c.V}個、辺が ${c.E}本で、側面はすべて三角形である立体の名前は？`,
            ans,
            choices: choices4(r, ans, [c.V % 2 === 0 && c.V / 2 >= 3 ? prismName(c.V / 2) : prismName(n), pyramidName(n + 1), pyramidName(n - 1), prismName(n)]),
            hint: "「頂点−辺+面＝2」で面の数を求めよう。側面が三角形の立体は、角錐。",
            steps: [`${c.V} − ${c.E} + 面 = 2 より、面の数は 2 − ${c.V} + ${c.E} = ${c.F}`, `側面がすべて三角形だから角錐。面は「底面1つ+側面 ${tsu(c.F - 1)}」`, `側面が ${tsu(c.F - 1)}で、底面が${NGON[n]} → ${ans}`],
          };
        }),
        t("08d09d", (r) => {
          const T = SOL[pick(r, ["立方体", "三角柱", "正四角錐"])];
          const e = T.elev[0], p = T.plan[0];
          const others = ["円柱", "円錐", "球", "三角柱", "正四角錐", "立方体"].filter((x) => x !== T.name);
          return {
            q: (e === p ? `立面図も平面図も${e}で、面は ${tsu(T.F)}ある立体の名前は？` : `立面図が${e}で、平面図が${p}で、面は ${tsu(T.F)}ある立体の名前は？`) + "（底面を下にして置く）",
            ans: T.name,
            choices: choices4(r, T.name, shuffle(r, others)),
            hint: "立面図と平面図の両方にあてはまる立体を考えて、面の数で確かめよう。",
            steps: [e === p ? `立面図も平面図も${e}になる立体は ${T.name}。` : `立面図が${e}、平面図が${p}になる立体は ${T.name}。`, `${T.name}の面の数は ${tsu(T.F)}で、ヒントと合っている。`],
          };
        }),
        // 08d10 （9）の A の立体の、辺の数と頂点の数
        t("08d10a", (r) => {
          const o = pick(r, REG);
          return { q: `${regFeature(o)}多面体がある。辺の数は？`, ans: o.E, unit: "本", hint: "面ごとに辺を数えると、1本の辺を、何回数えることになるかな？", steps: regSteps(o, "E") };
        }),
        t("08d10b", (r) => {
          const o = pick(r, REG);
          return { q: `${regFeature(o)}多面体がある。頂点の数は？`, ans: o.V, unit: "個", hint: "面ごとに頂点を数えると、1つの頂点を、何回数えることになるかな？", steps: regSteps(o, "V") };
        }),
        // 08q05 面が 8つあり、すべて合同な正三角形で、どの頂点にも 4つの面が集まる立体の名前、辺の数、頂点の数
        t("08q05a", (r) => {
          const o = pick(r, REG);
          return {
            q: `${regFeature(o)}立体の名前は？`,
            ans: o.name,
            choices: regChoices(r, o),
            hint: "面の数と、1つの頂点に集まる面の数から、正多面体の種類をしぼろう。",
            steps: [`面がすべて合同な${o.face}の正多面体は、${names(REG.filter((x) => x.n === o.n).map((x) => x.name))}${REG.filter((x) => x.n === o.n).length > 1 ? `の ${REG.filter((x) => x.n === o.n).length}種類` : "だけ"}。`, `面が ${tsu(o.F)}、1つの頂点に ${o.k}つの面が集まるのは … ${o.name}。`],
          };
        }),
        t("08q05b", (r) => {
          const o = pick(r, REG);
          return { q: `${regFeature(o)}多面体がある。辺の数は？`, ans: o.E, unit: "本", hint: "面ごとに辺を数えると、1本の辺を、何回数えることになるかな？", steps: regSteps(o, "E") };
        }),
        t("08q05c", (r) => {
          const o = pick(r, REG);
          return { q: `${regFeature(o)}多面体がある。頂点の数は？`, ans: o.V, unit: "個", hint: "面ごとに頂点を数えると、1つの頂点を、何回数えることになるかな？", steps: regSteps(o, "V") };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし。
//   第8時は、演習プリント 10問・小テスト 5問のすべてを移した。
//   「ヒントをつくる」「例をあげる」問い（dr.6、dr.8、qz.2、qz.4）は、「正しいものを選ぶ」4択に直した。
export const SKIPPED = [];
