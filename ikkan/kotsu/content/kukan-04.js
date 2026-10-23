// ============================================================
// kukan-04.js — 空間図形 第4時「直線と平面、平面と平面の位置関係を調べよう」
//   ikkan の演習プリント（kukan-04.dr.1〜10）・小テスト（kukan-04.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「04」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：04d05c ＝ kukan-04.dr.5 の3つ目、04q04a ＝ kukan-04.qz.4 の1つ目
//   辺と面・面と面の関係、点と面のきょりは、solids.js の立体（直方体・立方体・三角柱・正四角錐）から計算する（手で書かない）。
//   問題文の頭には、立体の紹介文（頂点の名前の約束）を入れる。「すべて答えよう」は、「何本か（いくつか）」の数の問いか、「1つ選ぶ」4択に直した。
// ============================================================
import { t, pick, choices4, shuffle, sample } from "../kit.js";
import { unit } from "../kukan-kit.js";
import {
  cuboid, rtPrism, prism, pyramid, lineRel, lineFaceRel, faceFaceRel, edgesToFace, facesWhere, distPointFace, distFaceFace,
  intro, edgeLabel, listEdges, same, prismName, pyramidName,
} from "../solids.js";

const CUBE = cuboid(3, 3, 3);   // 位置関係は、長さによらないので、辺の長さは問題文に出さない
const BOX = cuboid(4, 3, 2);
const RT = rtPrism(3, 4, 5);
const PY4 = pyramid(4);
const PR3 = prism(3);

const REGPOLY = { 3: "正三角形", 4: "正方形", 5: "正五角形", 6: "正六角形" };
/** 立体の紹介文（頂点の名前の約束）。立方体は「立方体」、角柱・角錐は漢数字の名前で */
function introOf(S, cube = false) {
  if (S.kind === "cuboid") return cube ? intro(S).replace("直方体", "立方体") : intro(S);
  if (S.kind === "prism") {
    const n = S.F[0].length, bot = S.F[0], top = S.F[1];
    return `${prismName(n)} ${bot}−${top}（底面 ${bot}・${top} は合同な${REGPOLY[n]}。${[...top].join("・")} は、${[...bot].join("・")} の真上）`;
  }
  if (S.kind === "pyramid") {
    const n = S.F[0].length;
    return `正${pyramidName(n)} O−${S.F[0]}（底面 ${S.F[0]} は${REGPOLY[n]}。頂点 O は、底面の中心の真上）`;
  }
  return intro(S);
}

const eLab = edgeLabel;
const eName = (e) => `辺 ${eLab(e)}`;
const fName = (f) => `面 ${f}`;
const listFaces = (fs) => (fs.length ? fs.map(fName).join("、") : "なし");
const has = (f, e) => [...e].every((v) => f.includes(v));   // 辺 e が、面 f にふくまれるか（両はしが f の頂点）
const WORDF = { on: "面の上にある", parallel: "平行", perp: "垂直", cross: "1点で交わるが垂直ではない" };

/** グループごとにシャッフルして、1つずつ順にとって並べる（ありがちな誤答を、いろいろな種類から出す） */
function mix(r, groups) {
  const gs = groups.map((g) => shuffle(r, g));
  const out = [];
  for (let i = 0; gs.some((g) => i < g.length); i++) gs.forEach((g) => { if (i < g.length) out.push(g[i]); });
  return out;
}

// 面と辺：平行・垂直、それぞれの答えの種類と「ありがちな誤答」の種類
const RELF = {
  parallel: {
    phrase: "と平行な辺", trap: [["on"], ["perp"], ["cross"]],
    hint: "面と平行な辺は、面の上になくて、どこまでのばしても面と交わらない辺。面の上にある辺は、「平行」とはいわない。",
  },
  perp: {
    phrase: "と垂直な辺", trap: [["on"], ["parallel"], ["cross"]],
    hint: "面と垂直な辺は、面と1点で交わって、その点を通る、面の上のどの辺とも直角になっている辺。",
  },
};

/** 面 f と rel の関係の辺を、4択で答える問題 */
function edgeFaceChoiceQ(r, S, rel, { cube = false, faces = S.F } = {}) {
  const R = RELF[rel], f = pick(r, faces);
  const ok = edgesToFace(S, f, rel);
  if (!ok.length) return { skip: true };
  const rest = S.E.filter((e) => !ok.some((o) => same(o, e)));
  const wrongs = mix(r, R.trap.map((ks) => rest.filter((e) => ks.includes(lineFaceRel(S, e, f))))).slice(0, 3);
  if (wrongs.length < 3) return { skip: true };
  const ans = eName(pick(r, ok));
  return {
    q: `${introOf(S, cube)}で、${fName(f)} ${R.phrase}は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs.map(eName)),
    hint: R.hint,
    steps: [
      `${fName(f)} ${R.phrase}は、${listEdges(ok)}。`,
      `ほかの選択肢は、${wrongs.map((x) => `${eName(x)}（${WORDF[lineFaceRel(S, x, f)]}）`).join("、")}。`,
      `答えは「${ans}」。`,
    ],
  };
}

/** 面 f と rel の関係の辺は、全部で何本か */
function edgeFaceCountQ(r, S, rel, { cube = false, faces = S.F } = {}) {
  const R = RELF[rel], f = pick(r, faces);
  const ok = edgesToFace(S, f, rel);
  if (!ok.length) return { skip: true };
  return {
    q: `${introOf(S, cube)}で、${fName(f)} ${R.phrase}は、全部で何本あるか。`,
    ans: ok.length,
    unit: "本",
    hint: R.hint,
    steps: [`${fName(f)} ${R.phrase}は、${listEdges(ok)}。`, `全部で ${ok.length}本。`],
  };
}

/** 三角柱の面 f について、「平行でも垂直でもない面」ごとの説明（2つの側面が垂直かどうかは、底面の角が直角かどうかで決まる） */
function crossReasons(S, f) {
  const base = S.F[0];
  const rightAt = (v) => {   // 底面の頂点 v で、底面の 2辺が直角か
    const o = S.V[v], [a, b] = [...base].filter((x) => x !== v).map((x) => S.V[x].map((c, i) => c - o[i]));
    return Math.abs(a.reduce((sum, c, i) => sum + c * b[i], 0)) < 1e-9;
  };
  const cross = S.F.filter((g) => g !== f && faceFaceRel(S, f, g) === "cross");
  const out = [];
  for (const g of cross) {
    const sh = [...f].filter((v) => g.includes(v)), v = sh.find((x) => base.includes(x));
    if (rightAt(v)) return null;   // 直角なら cross にならないはず（検算）
    out.push(`${fName(g)} は、${fName(f)} と ${eName(sh.join(""))} で交わるが、底面の ∠${v} が直角ではないので、垂直ではない。`);
  }
  return out;
}

/** 辺の長さ（座標から） */
const elen = (S, e) => Math.round(Math.hypot(...S.V[e[1]].map((x, i) => x - S.V[e[0]][i])) * 1e6) / 1e6;
/** 直方体 AB＝a、AD＝b、AE＝c（たがいにちがう長さ） */
const dims = (r) => sample(r, [2, 3, 4, 5, 6, 7, 8, 9], 3);
const givenEdge = (S, e) => ["AB", "AD", "AE"].find((g) => same(g, e) || lineRel(S, g, e).rel === "parallel");   // e と同じ長さで、問題文に書いてある辺

// ── いつも成り立つか（04d07）：直方体から、成り立たない例（反例）を計算でさがす ──
/** 反例の材料を、直方体 BOX から集める */
const EX = { linePar: [], planePar: [], linePerp: [], planePerp: [] };
for (const g of BOX.F) {
  const ps = edgesToFace(BOX, g, "parallel");
  for (const a of ps) for (const b of ps) if (a < b && lineRel(BOX, a, b).rel !== "parallel") EX.linePar.push([g, a, b]);       // 面 g に平行な2本の辺で、平行でないもの
  for (const f1 of BOX.F) for (const f2 of BOX.F) if (f1 < f2 && faceFaceRel(BOX, g, f1) === "perp" && faceFaceRel(BOX, g, f2) === "perp" && faceFaceRel(BOX, f1, f2) !== "parallel") EX.planePerp.push([g, f1, f2]);   // 面 g に垂直な2つの面で、平行でないもの
}
for (const l of BOX.E) {
  const fs = BOX.F.filter((f) => lineFaceRel(BOX, l, f) === "parallel");
  for (const f1 of fs) for (const f2 of fs) if (f1 < f2 && faceFaceRel(BOX, f1, f2) !== "parallel") EX.planePar.push([l, f1, f2]);     // 辺 l に平行な2つの面で、平行でないもの
  const ps = BOX.E.filter((x) => !same(x, l) && lineRel(BOX, l, x).rel === "intersect" && lineRel(BOX, l, x).perp);
  for (const a of ps) for (const b of ps) if (a < b && lineRel(BOX, a, b).rel !== "parallel") EX.linePerp.push([l, a, b]);               // 辺 l に垂直に交わる2本の辺で、平行でないもの
}
Object.entries(EX).forEach(([k, v]) => { if (!v.length) throw new Error(`反例が見つからない: ${k}`); });
const commonEdge = (f1, f2) => `辺 ${eLab([...f1].filter((v) => f2.includes(v)).join(""))}`;

const STM = [
  { ok: true, text: "1つの直線に垂直な 2つの平面は、平行である。", why: "直線に垂直な平面は、どれも同じ向きだから、平行になる。（例：辺 AE は 面 ABCD とも 面 EFGH とも垂直で、この 2つの面は平行）" },
  { ok: true, text: "1つの平面に垂直な 2つの直線は、平行である。", why: "平面に垂直な直線は、どれも同じ向きだから、平行になる。（例：辺 AE と辺 BF は、どちらも 面 ABCD に垂直で、平行）" },
  { ok: true, text: "1つの平面に平行な 2つの平面は、平行である。", why: "平面に平行な平面は、どれも同じ向きだから、たがいに平行になる。" },
  { ok: false, text: "1つの平面に平行な 2つの直線は、平行である。", ex: (r) => { const [g, a, b] = pick(r, EX.linePar); const k = lineRel(BOX, a, b); return `${eName(a)} と ${eName(b)} は、どちらも ${fName(g)} と平行だが、この 2本は${k.rel === "intersect" ? ` ${k.share} で交わっていて` : "ねじれの位置にあって"}、平行ではない。`; } },
  { ok: false, text: "1つの直線に平行な 2つの平面は、平行である。", ex: (r) => { const [l, f1, f2] = pick(r, EX.planePar); return `${eName(l)} は、${fName(f1)} とも ${fName(f2)} とも平行だが、この 2つの面は ${commonEdge(f1, f2)} で交わっていて、平行ではない。`; } },
  { ok: false, text: "1つの直線に垂直な 2つの直線は、平行である。", ex: (r) => { const [l, a, b] = pick(r, EX.linePerp); const k = lineRel(BOX, a, b); return `${eName(a)} と ${eName(b)} は、どちらも ${eName(l)} と垂直に交わるが、この 2本は${k.rel === "intersect" ? ` ${k.share} で交わっていて` : "ねじれの位置にあって"}、平行ではない。`; } },
  { ok: false, text: "1つの平面に垂直な 2つの平面は、平行である。", ex: (r) => { const [g, f1, f2] = pick(r, EX.planePerp); return `${fName(f1)} と ${fName(f2)} は、どちらも ${fName(g)} と垂直だが、この 2つの面は ${commonEdge(f1, f2)} で交わっていて、平行ではない。`; } },
];

export const UNITS = [
  unit("04", {
    name: "直線と平面・平面と平面の位置関係、きょり",
    desc: "平行・垂直・きょりを、直方体や角柱の辺と面で判断する",
    prereqs: ["J1-kk03"],
    points: [
      "直線と平面の位置関係は、直線が平面上にある・1点で交わる・平行である、の3つ。2つの平面の位置関係は、交わる・平行である、の2つ。",
      "直線 $\\ell$ が平面 $P$ と点 O で交わり、O を通る $P$ 上のすべての直線と垂直なとき、$\\ell$ と $P$ は垂直であるといい、$\\ell \\perp P$ と書く。$P$ 上の、交わる2本の直線に垂直なら、$\\ell \\perp P$ といえる。",
      "点 A から平面 $P$ にひいた垂線と $P$ との交点を H とするとき、線分 AH の長さを、A と $P$ とのきょりという。平行な2つの面のきょりは、一方の面上の点から、もう一方の面にひいた垂線の長さ。",
      "面の上にある辺は、その面と「平行」ではない。「平面上にある」と「平行」を、区別する。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 04d01 面 BFGC と平行な辺
        t("04d01", (r) => { const S = pick(r, [CUBE, BOX]); return edgeFaceChoiceQ(r, S, "parallel", { cube: S === CUBE }); }),
        // 04d02 面 BFGC と垂直な辺
        t("04d02", (r) => { const S = pick(r, [CUBE, BOX]); return edgeFaceChoiceQ(r, S, "perp", { cube: S === CUBE }); }),
        // 04d03a 面 BFGC と平行な面（4択）
        t("04d03a", (r) => {
          const S = pick(r, [CUBE, BOX]), f = pick(r, S.F);
          const par = facesWhere(S, f, "parallel"), perp = facesWhere(S, f, "perp");
          if (par.length !== 1 || perp.length < 3) return { skip: true };
          const ans = fName(par[0]), ws = shuffle(r, perp).slice(0, 3);
          return {
            q: `${introOf(S, S === CUBE)}で、${fName(f)} と平行な面は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, ws.map(fName)),
            hint: "平行な面は、向かい合っている面。おたがいに、辺で交わらない。",
            steps: [`${fName(f)} と平行な面は、${listFaces(par)}。`, `ほかの選択肢は、${fName(f)} と垂直な面（${ws.map(fName).join("、")}）。`, `答えは「${ans}」。`],
          };
        }),
        // 04d03b 面 BFGC と垂直な面は、いくつあるか（直方体・直角三角形が底の三角柱・正三角柱）
        t("04d03b", (r) => {
          const S = pick(r, [BOX, CUBE, RT, PR3]), f = pick(r, S.F);
          const perp = facesWhere(S, f, "perp"), par = facesWhere(S, f, "parallel");
          if (!perp.length) return { skip: true };
          const prismS = S.kind === "prism" || S.kind === "rtPrism";
          const why = prismS ? crossReasons(S, f) : [];
          if (why === null) return { skip: true };
          const isBase = prismS && (f === S.F[0] || f === S.F[1]);
          return {
            q: `${introOf(S, S === CUBE)}で、${fName(f)} と垂直な面は、全部でいくつあるか。`,
            ans: perp.length,
            unit: "個",
            hint: `${fName(f)} 以外の面を、1つずつ、平行か、垂直か、そのどちらでもないか、調べよう。${prismS && !isBase ? "側面どうしが垂直かどうかは、底面の角を見る。" : ""}`,
            steps: [
              `${fName(f)} と平行な面は${par.length ? `、${listFaces(par)}` : "ない"}。`,
              `垂直な面は、${listFaces(perp)}（${perp.length}個）。${prismS ? (isBase ? "側面は、底面に垂直に立っているので、すべて垂直。" : "底面は、側面に垂直。") : ""}`,
              ...why,
            ],
          };
        }),
        // 04q01 直線と平面の位置関係を3つ（→ 正しい組を選ぶ4択）
        t("04q01", (r) => {
          const ans = "平面上にある・1点で交わる・平行である";
          const ws = sample(r, ["平面上にある・1点で交わる・ねじれの位置にある", "平面上にある・平行である・垂直である", "1点で交わる・平行である・ねじれの位置にある", "平面上にある・平行である・2点で交わる"], 3);
          return {
            q: "空間にある直線と平面の位置関係は、3つに分けられる。その3つの組として、正しいものはどれか。",
            ans,
            choices: choices4(r, ans, ws),
            hint: "直線と平面が、共通にもつ点は、いくつあるだろう？　場合に分けて、考えてみよう。",
            steps: ["直線が平面の上にある／平面と1点で交わる／平面と交わらない（平行）の3つ。", "「ねじれの位置」は、直線どうしの関係。「垂直」は、1点で交わるときの特別な場合。"],
          };
        }),
        // 04q02 面 DCGH と垂直な辺（→ 何本か）
        t("04q02", (r) => {
          const S = pick(r, [BOX, CUBE, RT, PR3]);
          return edgeFaceCountQ(r, S, "perp", { cube: S === CUBE });
        }),
        // 04q03 面 DCGH と平行な辺（→ 何本か）
        t("04q03", (r) => {
          const S = pick(r, [BOX, CUBE, RT, PR3]);
          return edgeFaceCountQ(r, S, "parallel", { cube: S === CUBE });
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 04d04a 点と面のきょり
        t("04d04a", (r) => {
          const [a, b, c] = dims(r), S = cuboid(a, b, c), f = pick(r, S.F);
          const v = pick(r, Object.keys(S.V).filter((x) => !f.includes(x)));
          const ans = distPointFace(S, v, f);
          const e = S.E.find((x) => x.includes(v) && lineFaceRel(S, x, f) === "perp"), g = givenEdge(S, e);
          return {
            q: `${intro(S)}で、AB＝${a}cm、AD＝${b}cm、AE＝${c}cm とする。点 ${v} と ${fName(f)} のきょりは、何 cm か。`,
            ans,
            unit: "cm",
            hint: "点から面にひいた垂線の長さが、きょり。点 " + v + " から、面に垂直な辺は、どれかな？",
            steps: [`点 ${v} から ${fName(f)} にひいた垂線は、${eName(e)}（${fName(f)} に垂直）。`, `${eName(e)} の長さは、${same(g, e) ? "" : `${eName(g)} と同じ`}${ans}cm。`, `きょりは ${ans}cm。`],
          };
        }),
        // 04d04b 面と面のきょり
        t("04d04b", (r) => {
          const [a, b, c] = dims(r), S = cuboid(a, b, c), f1 = pick(r, S.F), f2 = facesWhere(S, f1, "parallel")[0];
          const ans = distFaceFace(S, f1, f2), es = edgesToFace(S, f1, "perp"), g = givenEdge(S, es[0]);
          return {
            q: `${intro(S)}で、AB＝${a}cm、AD＝${b}cm、AE＝${c}cm とする。${fName(f1)} と ${fName(f2)} のきょりは、何 cm か。`,
            ans,
            unit: "cm",
            hint: "平行な2つの面のきょりは、一方の面上の点から、もう一方の面にひいた垂線の長さ。2つの面にはさまれた辺に目をつけよう。",
            steps: [`${fName(f1)} と ${fName(f2)} は平行。`, `2つの面にはさまれた辺（${listEdges(es)}）は、どれも面に垂直で、長さは同じ。`, `${eName(es[0])} の長さは、${same(g, es[0]) ? "" : `${eName(g)} と同じ`}${ans}cm。きょりは ${ans}cm。`],
          };
        }),
        // 04d05a 底面が ∠B＝90° の三角柱で、面と垂直な辺（4択）
        t("04d05a", (r) => edgeFaceChoiceQ(r, RT, "perp", { faces: RT.F.filter((f) => edgesToFace(RT, f, "perp").length > 0) })),
        // 04d05b 面 ABED と垂直な面は、いくつあるか
        t("04d05b", (r) => {
          const f = pick(r, RT.F), perp = facesWhere(RT, f, "perp"), par = facesWhere(RT, f, "parallel");
          const why = crossReasons(RT, f);
          if (why === null) return { skip: true };
          return {
            q: `${introOf(RT)}で、${fName(f)} と垂直な面は、全部でいくつあるか。`,
            ans: perp.length,
            unit: "個",
            hint: "底面は、側面と垂直。側面どうしが垂直かどうかは、底面の角が直角かどうかで決まる。",
            steps: [
              `${fName(f)} と垂直な面は、${listFaces(perp)}。`,
              ...par.map((g) => `${fName(g)} は、${fName(f)} と平行（垂直ではない）。`),
              ...why,
              `垂直な面は、全部で ${perp.length}個。`,
            ],
          };
        }),
        // 04d05c 辺 CF と平行な面（4択）
        t("04d05c", (r) => {
          const e = pick(r, RT.E), par = RT.F.filter((f) => lineFaceRel(RT, e, f) === "parallel");
          if (par.length !== 1) return { skip: true };
          const rest = RT.F.filter((f) => f !== par[0]);
          const wrongs = mix(r, [["on"], ["perp"], ["cross"]].map((ks) => rest.filter((f) => ks.includes(lineFaceRel(RT, e, f))))).slice(0, 3);
          if (wrongs.length < 3) return { skip: true };
          const ans = fName(par[0]);
          return {
            q: `${introOf(RT)}で、${eName(e)} と平行な面は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, wrongs.map(fName)),
            hint: "辺をふくむ面は、「平行」ではない。辺と交わらない面をさがそう。",
            steps: [`${eName(e)} と平行な面は、${fName(par[0])}。`, `ほかの選択肢は、${wrongs.map((f) => `${fName(f)}（${WORDF[lineFaceRel(RT, e, f)]}）`).join("、")}。`, `答えは「${ans}」。`],
          };
        }),
        // 04d06a 辺 CG をふくみ、面 ABCD と垂直な面は、いくつあるか
        t("04d06a", (r) => {
          const S = pick(r, [CUBE, BOX]), e = pick(r, S.E), g = pick(r, S.F);
          const ok = S.F.filter((f) => has(f, e) && faceFaceRel(S, f, g) === "perp"), con = S.F.filter((f) => has(f, e));
          if (!ok.length) return { skip: true };
          return {
            q: `${introOf(S, S === CUBE)}で、${eName(e)} をふくむ面のうち、${fName(g)} と垂直な面は、全部でいくつあるか。`,
            ans: ok.length,
            unit: "個",
            hint: "辺をふくむ面は2つ。その2つの面が、それぞれ " + fName(g) + " と、平行か垂直か、調べよう。",
            steps: [`${eName(e)} をふくむ面は、${listFaces(con)}。`, con.map((f) => `${fName(f)} と ${fName(g)} … ${f === g ? "同じ面" : faceFaceRel(S, f, g) === "perp" ? "垂直" : "平行"}`).join("、") + "。", `垂直な面は ${ok.length}個。`],
          };
        }),
        // 04d06b 同じ問題を、4択で（あてはまる面が1つになる組だけ）
        t("04d06b", (r) => {
          const S = pick(r, [CUBE, BOX]), e = pick(r, S.E), g = pick(r, S.F);
          const ok = S.F.filter((f) => has(f, e) && faceFaceRel(S, f, g) === "perp");
          if (ok.length !== 1) return { skip: true };
          const rest = S.F.filter((f) => f !== ok[0]);
          const wrongs = mix(r, [rest.filter((f) => has(f, e)), rest.filter((f) => !has(f, e) && faceFaceRel(S, f, g) === "perp"), rest.filter((f) => !has(f, e) && faceFaceRel(S, f, g) !== "perp")]).slice(0, 3);
          const why = (f) => (has(f, e) ? `${eName(e)} をふくむが、${fName(g)} と${f === g ? "同じ面" : "平行"}` : `${eName(e)} をふくまない`);
          const ans = fName(ok[0]);
          return {
            q: `${introOf(S, S === CUBE)}で、${eName(e)} をふくみ、${fName(g)} と垂直な面は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, wrongs.map(fName)),
            hint: "辺をふくむ面は2つ。そのうち、" + fName(g) + " と垂直なほうをさがそう。",
            steps: [`${eName(e)} をふくむ面は、${listFaces(S.F.filter((f) => has(f, e)))}。`, `ほかの選択肢：${wrongs.map((f) => `${fName(f)}（${why(f)}）`).join("、")}。`, `${ans} は、${eName(e)} をふくみ、${fName(g)} と垂直。`],
          };
        }),
        // 04q04a 点と面のきょり（小テスト）
        t("04q04a", (r) => {
          const [a, b, c] = dims(r), S = cuboid(a, b, c), f = pick(r, S.F);
          const v = pick(r, Object.keys(S.V).filter((x) => !f.includes(x)));
          const ans = distPointFace(S, v, f), e = S.E.find((x) => x.includes(v) && lineFaceRel(S, x, f) === "perp"), g = givenEdge(S, e);
          return {
            q: `${intro(S)}で、AB＝${a}cm、AD＝${b}cm、AE＝${c}cm のとき、点 ${v} と ${fName(f)} のきょりは、何 cm か。`,
            ans,
            unit: "cm",
            hint: "点から面にひいた垂線の長さが、きょり。点 " + v + " から面に垂直な辺は、どれかな？",
            steps: [`点 ${v} から ${fName(f)} にひいた垂線は、${eName(e)}。`, `${eName(e)} の長さは、${same(g, e) ? "" : `${eName(g)} と同じ`}${ans}cm。`, `きょりは ${ans}cm。`],
          };
        }),
        // 04q04b 面と面のきょり（小テスト）
        t("04q04b", (r) => {
          const [a, b, c] = dims(r), S = cuboid(a, b, c), f1 = pick(r, S.F), f2 = facesWhere(S, f1, "parallel")[0];
          const ans = distFaceFace(S, f1, f2), es = edgesToFace(S, f1, "perp"), g = givenEdge(S, es[0]);
          return {
            q: `${intro(S)}で、AB＝${a}cm、AD＝${b}cm、AE＝${c}cm のとき、${fName(f1)} と ${fName(f2)} のきょりは、何 cm か。`,
            ans,
            unit: "cm",
            hint: "平行な2つの面にはさまれた辺は、どちらの面にも垂直。その辺の長さがきょり。",
            steps: [`${fName(f1)} と ${fName(f2)} は平行で、はさまれた辺（${listEdges(es)}）は面に垂直。`, `${eName(es[0])} の長さは、${same(g, es[0]) ? "" : `${eName(g)} と同じ`}${ans}cm。きょりは ${ans}cm。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 04d07 いつも成り立つもの／成り立つとはいえないもの（ア〜エ → 1つ選ぶ4択）
        t("04d07", (r) => {
          const Ts = STM.filter((s) => s.ok), Fs = STM.filter((s) => !s.ok), modeA = r(0, 1) === 1;
          if (modeA) {   // いつも成り立つものを選ぶ（正しい文1つ＋成り立たない文3つ）
            const T = pick(r, Ts), fs = sample(r, Fs, 3);
            return {
              q: "次のうち、空間で、いつも成り立つものはどれか。（直線や平面は、どれも別々のもの）",
              ans: T.text,
              choices: choices4(r, T.text, fs.map((s) => s.text)),
              hint: "成り立たない例（反例）が1つでも見つかれば、その文は「いつも成り立つ」とはいえない。直方体の辺と面でためそう。",
              steps: [`${introOf(BOX)}の辺と面で確かめる。${T.why}`, ...fs.map((s) => `「${s.text.replace(/。$/, "")}」は成り立たない … ${s.ex(r)}`)],
            };
          }
          const F = pick(r, Fs), ts = sample(r, Ts, 3);   // いつも成り立つとはいえないものを選ぶ（成り立たない文1つ＋正しい文3つ）
          return {
            q: "次のうち、空間で、いつも成り立つとはいえないものはどれか。（直線や平面は、どれも別々のもの）",
            ans: F.text,
            choices: choices4(r, F.text, ts.map((s) => s.text)),
            hint: "成り立たない例（反例）が見つかる文を、さがそう。直方体の辺と面でためそう。",
            steps: [`${introOf(BOX)}の辺と面で確かめる。「${F.text.replace(/。$/, "")}」は成り立たない … ${F.ex(r)}`, "ほかの 3つは、いつも成り立つ。（同じ平面や直線に垂直、または平行なものは、同じ向きになる）"],
          };
        }),
        // 04d08 正四角錐 O−ABCD で、OH が高さといえるのは、OH と底面がどんな関係にあるからか（頂点から底面にひいた垂線が高さ）
        t("04d08", (r) => {
          const n = pick(r, [3, 4]), S = pyramid(n), base = S.F[0];
          const cen = (vs) => [0, 1, 2].map((i) => vs.reduce((s, v) => s + S.V[v][i], 0) / vs.length);
          const S2 = { ...S, V: { ...S.V, H: cen([...base]), M: cen(["A", "B"]) } };   // 底面の中心 H と、辺 AB の中点 M をくわえる
          const where = n === 4 ? "底面の対角線の交点を H" : "底面の正三角形の中心を H";
          const lat = [...base].map((v) => `O${v}`).join("＝");
          const introPyr = `正${pyramidName(n)} O−${base}（底面 ${base} は${REGPOLY[n]}。${lat} で、長さがすべて等しい）`;   // 「真上」とは書かない
          if (r(0, 1) === 0) {   // 形A：OH が高さといえる理由
            const rel = lineFaceRel(S2, "OH", base);
            const MAP = { perp: "垂直である", parallel: "平行である", on: `面 ${base} の上にある`, cross: "垂直ではなく、斜めに交わっている" };
            const ans = MAP[rel];
            return {
              q: `${introPyr}で、${where} とする。OH が、この角錐の高さといえるのは、OH と底面 ${base} が、どんな関係にあるからか。`,
              ans,
              choices: choices4(r, ans, Object.values(MAP).filter((x) => x !== ans)),
              hint: "角錐の高さは、頂点と底面とのきょり。点と面のきょりは、何の長さだったかな？",
              steps: ["頂点 O から底面にひいた線分 OH は、底面の中心 H で底面と交わる。", `OH は、底面 ${base} と${ans.replace("である", "")}。`, "高さ ＝ 頂点と底面とのきょり ＝ 頂点から底面にひいた垂線の長さ。だから、OH が高さといえるのは、OH が底面に垂直だから。"],
            };
          }
          // 形B：高さを表す線分を選ぶ（側面の辺 OA や、側面の三角形の高さ OM とまちがえない）
          const SEG = [["OH", "線分 OH"], ["OA", "線分 OA（側面の辺）"], ["OM", "線分 OM（M は辺 AB の中点）"], ["AH", "線分 AH"]];
          const rel = (d) => lineFaceRel(S2, d, base), WORDS = { perp: "底面に垂直", cross: "底面と斜めに交わる", on: "底面の上にある", parallel: "底面と平行" };
          const ok = SEG.filter(([d]) => rel(d) === "perp");
          if (ok.length !== 1) return { skip: true };
          const ans = ok[0][1], ws = SEG.filter(([d]) => rel(d) !== "perp");
          return {
            q: `${introPyr}で、${where}、辺 AB の中点を M とする。この角錐の高さ（頂点から底面にひいた垂線の長さ）を表す線分は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, ws.map((x) => x[1])),
            hint: "高さは、頂点から底面にひいた垂線。底面に垂直になっている線分をさがそう。",
            steps: [...ws.map(([d, nm]) => `${nm} … ${WORDS[rel(d)]}`), `${ans} … ${WORDS.perp}　← これが高さ`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 04d09 机の上に立てた、開いたノート：ℓ が机の面に垂直と言い切るのに、じゅうぶんな理由
        t("04d09", (r) => {
          const ans = "m と n は、机の面の上の、O で交わる 2直線で、ℓ は、そのどちらとも垂直だから。";
          const ws = sample(r, [
            "ℓ は、机の面の上の 1本の直線 m と垂直だから。",
            "ℓ は、机の面と点 O で交わっているから。",
            "ℓ は、表紙の面の上にあるから。",
            "ℓ は、ノートの表紙（長方形）の1辺だから。",
          ], 3);
          return {
            q: "机の上に、ノートを開いて立てる。とじ目の直線 ℓ は、机の面と点 O で交わっている。表紙の下のふち m、n は、どちらも机の面の上にあって O を通り、ℓ と m、ℓ と n は、どちらも垂直である。ℓ が机の面に垂直だと言い切るために、じゅうぶんな理由はどれか。（どの選択肢も、事実としては正しい）",
            ans,
            choices: choices4(r, ans, ws),
            hint: "平面に垂直と言い切るには、平面の上の、何本の、どんな直線に垂直であればよいか。本数と、交わり方に目をつけよう。",
            steps: ["ℓ が平面に垂直だと言い切れるのは、平面の上の、交わる 2直線に垂直なとき。", "m、n は、机の面の上で O を通る（交わる）2直線で、ℓ は、そのどちらとも垂直。だから、ℓ は机の面に垂直。", "「1本だけに垂直」「1点で交わっているだけ」「表紙の上にある」「表紙の1辺」は、事実でも、ℓ がまだたおれるので、言い切るには、じゅうぶんでない。"],
          };
        }),
        // 04d10 辺と面が平行になる組は、全部で何組か
        t("04d10", (r) => {
          const S = pick(r, [BOX, PR3, RT, PY4]);
          const per = S.E.map((e) => S.F.filter((f) => lineFaceRel(S, e, f) === "parallel").length);   // 辺ごとの、平行な面の数
          const total = per.reduce((a, b) => a + b, 0);
          const groups = {}; per.forEach((c) => { groups[c] = (groups[c] || 0) + 1; });
          const keys = Object.keys(groups).map(Number).sort((a, b) => b - a), gl = keys.filter((c) => c > 0);
          return {
            q: `${introOf(S)}の ${S.E.length}本の辺と ${S.F.length}つの面について、辺と面が平行になる組（辺が面の上にあるものは、数えない）は、全部で何組あるか。`,
            ans: total,
            unit: "組",
            hint: "1本の辺について、平行な面がいくつあるか数えて、全部の辺について合計しよう。",
            steps: [
              keys.length === 1 ? `どの辺も、平行な面は ${keys[0]}つ。` : `${keys.map((c) => (c ? `平行な面が ${c}つある辺は ${groups[c]}本` : `平行な面がない辺は ${groups[c]}本`)).join("、")}。`,
              `${gl.map((c) => `${groups[c]}×${c}`).join(" + ")} = ${total}（組）`,
            ],
          };
        }),
        // 04q05 辺 AE が面 ABCD に垂直と言い切る理由（形A：じゅうぶんな理由を選ぶ）／ 垂直といえるかの判断（形B：交わる2直線か、平行な2直線か、1本か）
        t("04q05", (r) => {
          const S = pick(r, [BOX, CUBE]), f = pick(r, S.F);
          const e = pick(r, edgesToFace(S, f, "perp"));
          const P = [...e].find((v) => f.includes(v));
          const ps = S.E.filter((x) => has(f, x) && x.includes(P));   // 面 f 上で P を通る2本の辺
          const [p1, p2] = ps;
          const opp = S.E.find((x) => has(f, x) && !x.includes(P) && lineRel(S, x, p1).rel === "parallel");   // p1 と平行な、面 f 上の辺
          const wrapUp = "1本だけ、平行な 2本だけ、1点で交わっているだけでは、辺がたおれるので、言い切るには、じゅうぶんでない。";
          if (r(0, 1) === 0) {   // 形A
            const ans = `${eName(e)} は、${fName(f)} 上の、${P} で交わる 2直線 ${eLab(p1)}、${eLab(p2)} と垂直だから。`;
            const ws = [
              `${eName(e)} は、${fName(f)} 上の 1本の直線 ${eLab(p1)} と垂直だから。`,
              `${eName(e)} は、${fName(f)} 上の、平行な 2直線 ${eLab(p1)}、${eLab(opp)} と垂直だから。`,
              `${eName(e)} は、${fName(f)} と点 ${P} で交わっているから。`,
            ];
            return {
              q: `${introOf(S, S === CUBE)}で、${eName(e)} が ${fName(f)} に垂直だと言い切るために、じゅうぶんな理由はどれか。（どの選択肢も、事実としては正しい）`,
              ans,
              choices: choices4(r, ans, ws),
              hint: "平面に垂直と言い切るには、平面の上の、何本の、どんな直線に垂直であればよいか。本数と、交わり方に目をつけよう。",
              steps: [
                `${eName(e)} は、${fName(f)} 上の ${eLab(p1)}、${eLab(p2)} と、${P} で垂直に交わっている。`,
                `${eLab(p1)} と ${eLab(p2)} は、点 ${P} で交わる 2直線。交わる 2直線に垂直だから、${eName(e)} は ${fName(f)} に垂直。`,
                wrapUp,
              ],
            };
          }
          // 形B：「このことだけから」、垂直といえるか
          const KIND = {
            cross2: [`${fName(f)} 上の、${P} で交わる 2直線 ${eLab(p1)}、${eLab(p2)} と垂直である`, true, `${eLab(p1)} と ${eLab(p2)} は、点 ${P} で交わる 2直線。交わる 2直線に垂直だから、垂直といえる。`],
            par2: [`${fName(f)} 上の、平行な 2直線 ${eLab(p1)}、${eLab(opp)} と垂直である`, false, `${eLab(p1)} と ${eLab(opp)} は平行な 2直線。平行な 2本に垂直なだけでは、辺がたおれるので、垂直とは言い切れない。`],
            one: [`${fName(f)} 上の 1本の直線 ${eLab(p1)} と垂直である`, false, `${fName(f)} 上の 1本に垂直なだけでは、辺がたおれるので、垂直とは言い切れない。`],
          };
          const key = pick(r, ["cross2", "cross2", "par2", "one"]), [premise, yes, why] = KIND[key];
          const YES = "垂直である", NO = "垂直かどうかは、これだけでは言い切れない";
          const ans = yes ? YES : NO;
          return {
            q: `${introOf(S, S === CUBE)}で、${eName(e)} は ${fName(f)} と点 ${P} で交わっていて、${premise}。このことだけから、${eName(e)} と ${fName(f)} の位置関係について、いえることはどれか。`,
            ans,
            choices: choices4(r, ans, [YES, NO, "平行である", `${fName(f)} の上にある`].filter((x) => x !== ans)),
            hint: "平面に垂直と言い切るには、平面の上の、何本の、どんな直線に垂直であればよいか。本数と、交わり方に目をつけよう。",
            steps: [`${eName(e)} は、${premise}。`, why, `${eName(e)} は ${fName(f)} と点 ${P} で交わっているので、平行でも、面の上にあるのでもない。`, `答えは「${ans}」。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 第4時は、演習プリント 10問・小テスト 5問のすべてを移した（「すべて答えよう」は、数か4択に。理由の説明（dr.8・dr.9・qz.5）は、「正しい理由を選ぶ」4択に直した）
