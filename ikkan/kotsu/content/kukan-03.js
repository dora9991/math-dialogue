// ============================================================
// kukan-03.js — 空間図形 第3時「空間にある2つの直線は、どんな位置関係になるだろう」
//   ikkan の演習プリント（kukan-03.dr.1〜11）・小テスト（kukan-03.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「03」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：03d04a ＝ kukan-03.dr.4 の1つ目、03q05b ＝ kukan-03.qz.5 の2つ目
//   辺と辺の関係（平行・垂直に交わる・ねじれの位置）は、solids.js の立体（直方体・立方体・三角柱・正四角錐）から計算する（手で書かない）。
//   問題文の頭には、立体の紹介文（頂点の名前の約束）を入れる。「すべて答えよう」は、「何本か」の数の問いか、「1つ選ぶ」4択に直した。
// ============================================================
import { t, pick, choices4, shuffle, sample } from "../kit.js";
import { unit } from "../kukan-kit.js";
import { cuboid, rtPrism, prism, pyramid, lineRel, intro, edgeLabel, listEdges, same, prismName, pyramidName, NGON } from "../solids.js";

const CUBE = cuboid(3, 3, 3);   // 位置関係は、長さによらないので、辺の長さは問題文に出さない
const BOX = cuboid(4, 3, 2);
const RT = rtPrism(3, 4, 5);
const PR3 = prism(3);
const PY4 = pyramid(4);

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
const uniqLab = (a, b) => [eLab(a), eLab(b)].sort();
const pairName = (a, b) => { const [x, y] = uniqLab(a, b); return `辺 ${x} と 辺 ${y}`; };

/** 2本の辺（直線）の関係：parallel（平行）／perpX（垂直に交わる）／intersect（垂直でなく交わる）／perpSkew・skew（ねじれの位置） */
function kindOf(S, a, b) {
  const x = lineRel(S, a, b);
  return x.rel === "parallel" ? "parallel" : x.rel === "intersect" ? (x.perp ? "perpX" : "intersect") : x.perp ? "perpSkew" : "skew";
}
const WORD = { parallel: "平行", perpX: "垂直に交わる", intersect: "交わる（垂直ではない）", perpSkew: "ねじれの位置", skew: "ねじれの位置" };
const isSkew = (k) => k === "perpSkew" || k === "skew";

/** グループごとにシャッフルして、1つずつ順にとって並べる（ありがちな誤答を、いろいろな種類から出す） */
function mix(r, groups) {
  const gs = groups.map((g) => shuffle(r, g));
  const out = [];
  for (let i = 0; gs.some((g) => i < g.length); i++) gs.forEach((g) => { if (i < g.length) out.push(g[i]); });
  return out;
}

// 平行・垂直に交わる・ねじれの位置、それぞれの、答えの種類と「ありがちな誤答」の種類
const REL = {
  parallel: {
    kinds: ["parallel"], phrase: "と平行な辺",
    trap: [["perpSkew", "skew"], ["perpX", "intersect"]],
    hint: "平行な辺は、向きが同じで、どこまでのばしても交わらない辺。同じ向きの辺をさがそう。",
  },
  perp: {
    kinds: ["perpX"], phrase: "と垂直に交わる辺",
    trap: [["perpSkew", "skew"], ["parallel"], ["intersect"]],
    hint: "1つの頂点で交わって、そこが直角になっている辺をさがそう。交わらない辺は、ちがう。",
  },
  skew: {
    kinds: ["perpSkew", "skew"], phrase: "とねじれの位置にある辺",
    trap: [["parallel"], ["perpX", "intersect"]],
    hint: "先に、平行な辺と、交わる辺を消していこう。のこりが、ねじれの位置にある辺。",
  },
};

/** 辺 e と rel の関係の辺を、4択で答える問題 */
function edgeChoiceQ(r, S, rel, { cube = false, pool = S.E } = {}) {
  const R = REL[rel], e = pick(r, pool);
  const rest = S.E.filter((x) => !same(x, e));
  const ok = rest.filter((x) => R.kinds.includes(kindOf(S, e, x)));
  if (!ok.length) return { skip: true };
  const ans = eName(pick(r, ok));
  const wrongs = mix(r, R.trap.map((ks) => rest.filter((x) => ks.includes(kindOf(S, e, x))))).slice(0, 3);
  if (wrongs.length < 3) return { skip: true };
  return {
    q: `${introOf(S, cube)}で、辺 ${eLab(e)} ${R.phrase}は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs.map(eName)),
    hint: R.hint,
    steps: [
      `辺 ${eLab(e)} ${R.phrase}は、${listEdges(ok)}。`,
      `ほかの選択肢は、${wrongs.map((x) => `${eName(x)}（${WORD[kindOf(S, e, x)]}）`).join("、")}。`,
      `答えは「${ans}」。`,
    ],
  };
}

/** 辺 e と rel の関係の辺は、全部で何本か（数の問い） */
function edgeCountQ(r, S, rel, { cube = false, pool = S.E } = {}) {
  const R = REL[rel], e = pick(r, pool);
  const ok = S.E.filter((x) => !same(x, e) && R.kinds.includes(kindOf(S, e, x)));
  if (!ok.length) return { skip: true };
  return {
    q: `${introOf(S, cube)}で、辺 ${eLab(e)} ${R.phrase}は、全部で何本あるか。`,
    ans: ok.length,
    unit: "本",
    hint: R.hint,
    steps: [`辺 ${eLab(e)} ${R.phrase}は、${listEdges(ok)}。`, `全部で ${ok.length}本。`],
  };
}

// ── 3つの直線 ℓ、m、n の問題（03d07）：直方体の辺から、成り立たない例（反例）を計算でさがす ──
const lr = (a, b) => lineRel(CUBE, a, b);
const STM = [
  { ok: true, text: "ℓ と m が平行で、m と n が平行ならば、ℓ と n は平行である。", why: "平行な直線は、どれも同じ向きだから、ℓ と n も同じ向きで、平行になる。" },
  { ok: true, text: "ℓ と m が平行で、m と n が交わるならば、ℓ と n は平行ではない。", why: "もし ℓ と n が平行なら、m も n と平行になってしまい、m と n が交わることと合わない。" },
  { short: "垂直に交わる・垂直に交わる ⇒ 平行", text: "ℓ と m が垂直に交わり、m と n が垂直に交わるならば、ℓ と n は平行である。", prem: (a, b) => a.rel === "intersect" && a.perp && b.rel === "intersect" && b.perp, bad: (c) => c.rel !== "parallel" },
  { short: "交わる・交わる ⇒ 交わる", text: "ℓ と m が交わり、m と n が交わるならば、ℓ と n は交わる。", prem: (a, b) => a.rel === "intersect" && b.rel === "intersect", bad: (c) => c.rel !== "intersect" },
  { short: "ねじれの位置・ねじれの位置 ⇒ ねじれの位置", text: "ℓ と m がねじれの位置にあり、m と n がねじれの位置にあるならば、ℓ と n もねじれの位置にある。", prem: (a, b) => a.rel === "skew" && b.rel === "skew", bad: (c) => c.rel !== "skew" },
  { short: "平行・交わる ⇒ 交わる", text: "ℓ と m が平行で、m と n が交わるならば、ℓ と n は交わる。", prem: (a, b) => a.rel === "parallel" && b.rel === "intersect", bad: (c) => c.rel !== "intersect" },
];
const kindWord = (a, b) => WORD[kindOf(CUBE, a, b)].replace("（垂直ではない）", "");
STM.forEach((s) => {
  if (s.ok) return;
  s.examples = [];
  for (const a of CUBE.E) for (const b of CUBE.E) for (const c of CUBE.E) {
    if (same(a, b) || same(b, c) || same(a, c)) continue;
    if (s.prem(lr(a, b), lr(b, c)) && s.bad(lr(a, c))) s.examples.push([a, b, c]);
  }
  if (!s.examples.length) throw new Error(`反例が見つからない: ${s.text}`);
});

// ── 面の対角線（立方体）──
const lab2 = (d) => [...d].sort().join("");
const DIAGS = CUBE.F.flatMap((f) => [f[0] + f[2], f[1] + f[3]]).map(lab2);   // 12本
const faceOf = (d) => CUBE.F.find((f) => [...d].every((v) => f.includes(v)));
const diagKind = (a, b) => kindOf(CUBE, a, b);

export const UNITS = [
  unit("03", {
    name: "空間の2直線の位置関係（交わる・平行・ねじれの位置）",
    desc: "直方体や角柱の辺で、平行・垂直に交わる・ねじれの位置を見分ける",
    prereqs: ["J1-kk02"],
    points: [
      "空間にある2つの直線の位置関係は、交わる・平行・ねじれの位置の3つ。平行でなく、交わらない2直線を、ねじれの位置にあるという。",
      "交わる2直線と平行な2直線は、同じ平面上にある。ねじれの位置にある2直線は、同じ平面上にない。",
      "ねじれの位置の辺は、まわりの辺から、「交わる辺」と「平行な辺」を消して、のこりを見つける。見取図の上で交わって見えても、空間では交わらないことがある。",
      "直方体の1本の辺には、平行な辺が3本、垂直に交わる辺が4本、ねじれの位置にある辺が4本ある。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 03d01 辺 AD と平行な辺（立方体）
        t("03d01", (r) => { const S = pick(r, [CUBE, BOX]); return edgeChoiceQ(r, S, "parallel", { cube: S === CUBE }); }),
        // 03d02 辺 AD と垂直に交わる辺
        t("03d02", (r) => { const S = pick(r, [CUBE, BOX]); return edgeChoiceQ(r, S, "perp", { cube: S === CUBE }); }),
        // 03d03 辺 AD とねじれの位置にある辺
        t("03d03", (r) => { const S = pick(r, [CUBE, BOX]); return edgeChoiceQ(r, S, "skew", { cube: S === CUBE }); }),
        // 03q01 空間の2直線の位置関係を3つ（→ 正しい組を選ぶ4択）
        t("03q01", (r) => {
          const ans = "交わる・平行・ねじれの位置";
          const ws = sample(r, ["交わる・平行・垂直", "交わる・垂直・ねじれの位置", "平行・垂直・ねじれの位置", "交わる・平行・同じ平面上にある"], 3);
          return {
            q: "空間にある2つの直線の位置関係は、3つに分けられる。その3つの組として、正しいものはどれか。",
            ans,
            choices: choices4(r, ans, ws),
            hint: "同じ平面上にある2直線は、交わるか平行。同じ平面上にないとき、何というか。",
            steps: ["2直線が同じ平面上にあれば、「交わる」か「平行」。同じ平面上になければ、「ねじれの位置」。", "「垂直」は、交わる2直線の角が直角のときの呼び名で、位置関係を分ける3つには入らない。"],
          };
        }),
        // 03q02 辺 EH と平行な辺（→ 何本か）
        t("03q02", (r) => { const S = pick(r, [BOX, CUBE]); return edgeCountQ(r, S, "parallel", { cube: S === CUBE }); }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 03d04a 三角柱 ABC−DEF で、辺 BE とねじれの位置にある辺（4択）
        t("03d04a", (r) => edgeChoiceQ(r, PR3, "skew")),
        // 03d04b 同じ問題を、何本かで
        t("03d04b", (r) => edgeCountQ(r, PR3, "skew")),
        // 03d05a 四角錐 O−ABCD で、辺 OA とねじれの位置にある辺（4択）
        t("03d05a", (r) => edgeChoiceQ(r, PY4, "skew")),
        // 03d05b 同じ問題を、何本かで
        t("03d05b", (r) => edgeCountQ(r, PY4, "skew")),
        // 03d06 2つの辺の組のうち、ねじれの位置にあるもの（「すべて」→ 1つ選ぶ。ねじれの位置にないものを選ぶ形もある）
        t("03d06", (r) => {
          const S = pick(r, [CUBE, BOX]), neg = r(0, 1) === 1, E = S.E;
          const pairs = [];
          for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) pairs.push({ a: E[i], b: E[j], k: kindOf(S, E[i], E[j]) });
          const sk = pairs.filter((p) => isSkew(p.k)), ns = pairs.filter((p) => !isSkew(p.k));
          const one = pick(r, neg ? ns : sk);
          const ws = (neg ? shuffle(r, sk) : mix(r, [ns.filter((p) => p.k === "parallel"), ns.filter((p) => p.k !== "parallel")])).slice(0, 3);
          const txt = (p) => pairName(p.a, p.b);
          const line = (p) => `${txt(p)} … ${WORD[p.k]}`;
          return {
            q: `${introOf(S, S === CUBE)}で、次の 2つの辺の組のうち、${neg ? "ねじれの位置にないもの" : "ねじれの位置にあるもの"}はどれか。`,
            ans: txt(one),
            choices: choices4(r, txt(one), ws.map(txt)),
            hint: neg ? "ねじれの位置は、交わらず、平行でもない。組を1つずつ調べて、そうでないものをさがそう。" : "組を1つずつ調べて、交わるもの、平行なものを消していこう。のこりが、ねじれの位置。",
            steps: [...ws.map(line), `${line(one)}　← これが答え`],
          };
        }),
        // 03q03 辺 EH と垂直に交わる辺（→ 何本か。立体もいろいろ）
        t("03q03", (r) => {
          const S = pick(r, [BOX, BOX, RT, PR3]);
          return edgeCountQ(r, S, "perp", { cube: false });
        }),
        // 03q04 辺 EH とねじれの位置にある辺（→ 何本か）
        t("03q04", (r) => {
          const S = pick(r, [BOX, BOX, RT, PR3]);
          return edgeCountQ(r, S, "skew", { cube: false });
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 03d07 3つの直線 ℓ、m、n（いつも成り立つものを選ぶ。成り立たないものは、直方体の辺の例で確かめる）
        t("03d07", (r) => {
          const T = pick(r, STM.filter((s) => s.ok)), Fs = sample(r, STM.filter((s) => !s.ok), 3);
          const exLine = (s) => {
            const [a, b, c] = pick(r, s.examples);
            return `「${s.short}」は成り立たない … 例：${pairName(a, b)}（${kindWord(a, b)}）、${pairName(b, c)}（${kindWord(b, c)}）のとき、${pairName(a, c)} は「${kindWord(a, c)}」。`;
          };
          return {
            q: "空間にある 3つの直線 ℓ、m、n（どれも別々の直線）について、次のうち、いつも成り立つものはどれか。",
            ans: T.text,
            choices: choices4(r, T.text, Fs.map((s) => s.text)),
            hint: "成り立たない例（反例）が1つでも見つかれば、その文は「いつも成り立つ」とはいえない。直方体の辺でためそう。",
            steps: [`直方体 ABCD−EFGH の辺で確かめる。${T.why}`, ...Fs.map(exLine)],
          };
        }),
        // 03d08a 立方体の面 EFGH の対角線 FH とねじれの位置にある辺は、全部で何本か
        t("03d08a", (r) => {
          const S = CUBE, f = pick(r, S.F), d = pick(r, [f[0] + f[2], f[1] + f[3]]);
          const by = (...ks) => S.E.filter((x) => ks.includes(kindOf(S, d, x)));
          const cross = by("perpX", "intersect"), par = by("parallel"), sk = by("perpSkew", "skew");
          return {
            q: `${introOf(S, true)}で、面 ${f} の対角線 ${d} とねじれの位置にある辺は、全部で何本あるか。`,
            ans: sk.length,
            unit: "本",
            hint: "対角線 " + d + " の両はしを通る辺は、対角線と交わる。それらと、平行な辺を消して、のこりを数えよう。",
            steps: [`対角線 ${d} と交わる辺は、${listEdges(cross)}（${cross.length}本）。`, `平行な辺は${par.length ? listEdges(par) : "ない"}。`, `ねじれの位置にある辺は、${listEdges(sk)}の ${sk.length}本。`],
          };
        }),
        // 03d08b 同じ問題を、4択で
        t("03d08b", (r) => {
          const S = CUBE, f = pick(r, S.F), d = pick(r, [f[0] + f[2], f[1] + f[3]]);
          const sk = S.E.filter((x) => isSkew(kindOf(S, d, x))), cross = S.E.filter((x) => kindOf(S, d, x) === "perpX" || kindOf(S, d, x) === "intersect");
          const ans = eName(pick(r, sk)), ws = shuffle(r, cross).slice(0, 3);
          return {
            q: `${introOf(S, true)}で、面 ${f} の対角線 ${d} とねじれの位置にある辺は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, ws.map(eName)),
            hint: "対角線の両はしを通る辺は、対角線と交わる。それ以外の辺で、平行でないものが、ねじれの位置。",
            steps: [`対角線 ${d} と交わる辺は、${listEdges(cross)}。`, `ねじれの位置にある辺は、${listEdges(sk)}。`, `選択肢で、ねじれの位置にあるのは「${ans}」。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 03d09a 立方体の面の対角線 AF と BG は、交わる・平行・ねじれの位置のどれか
        t("03d09a", (r) => {
          const want = pick(r, ["parallel", "skew", "intersect"]);
          const cand = [];
          for (let i = 0; i < DIAGS.length; i++) for (let j = i + 1; j < DIAGS.length; j++) {
            const k = diagKind(DIAGS[i], DIAGS[j]);
            if (want === "skew" ? isSkew(k) : want === "intersect" ? k === "intersect" : k === "parallel") cand.push([DIAGS[i], DIAGS[j], k]);
          }
          const [d1, d2] = pick(r, cand);
          const ANS = { parallel: "平行", intersect: "交わる", skew: "ねじれの位置" };
          const ans = ANS[want], f1 = faceOf(d1), f2 = faceOf(d2);
          const share = [...d1].find((v) => d2.includes(v));
          const steps = [`${d1} は 面 ${f1} の対角線、${d2} は 面 ${f2} の対角線。`];
          if (want === "intersect") {
            const x1 = [...d1].find((v) => v !== share), x2 = [...d2].find((v) => v !== share);
            steps.push(`どちらも頂点 ${share} を通るので、交わる。`, `3点 ${share}、${x1}、${x2} を結ぶと、3辺とも面の対角線で長さが等しい正三角形。角は 60° で、90° ではない。`);
          } else if (want === "parallel") {
            steps.push(`向かい合う面の上の、同じ向きの対角線だから、平行。`);
          } else {
            steps.push(`共通の頂点がなく（対角線は、頂点以外では交わらない）、向きもちがうので、交わらず、平行でもない。`, `同じ平面上にないので、ねじれの位置。`);
          }
          steps.push(`答えは「${ans}」。`);
          return {
            q: `${introOf(CUBE, true)}で、面の対角線 ${d1} と ${d2} の位置関係として、正しいものはどれか。（「垂直に交わる」は、2直線が交わり、その角が 90° のときにだけ使う）`,
            ans,
            choices: choices4(r, ans, ["交わる", "平行", "ねじれの位置", "垂直に交わる"].filter((x) => x !== ans)),
            hint: "2本が同じ頂点を通るか、向かい合う面の上で同じ向きか、どちらでもないか、を調べよう。",
            steps,
          };
        }),
        // 03d09b 面の対角線 AF とねじれの位置にある、面の対角線を選ぶ
        t("03d09b", (r) => {
          const d1 = pick(r, DIAGS), rest = DIAGS.filter((x) => x !== d1);
          const sk = rest.filter((x) => isSkew(diagKind(d1, x)));
          const ans = pick(r, sk), others = rest.filter((x) => !isSkew(diagKind(d1, x)));
          const ws = mix(r, [others.filter((x) => diagKind(d1, x) === "parallel"), others.filter((x) => diagKind(d1, x) === "intersect"), others.filter((x) => diagKind(d1, x) === "perpX")]).slice(0, 3);
          const nm = (d) => `対角線 ${d}`;
          const R = (d) => (diagKind(d1, d) === "parallel" ? "平行" : isSkew(diagKind(d1, d)) ? "ねじれの位置" : "交わる");
          return {
            q: `${introOf(CUBE, true)}で、面の対角線 ${d1} とねじれの位置にある面の対角線は、次のうちどれか。`,
            ans: nm(ans),
            choices: choices4(r, nm(ans), ws.map(nm)),
            hint: "同じ頂点を通る対角線は、交わる。同じ面の上にある対角線も交わる。向かい合う面で同じ向きなら、平行。",
            steps: [...ws.map((d) => `${nm(d)} … ${R(d)}`), `${nm(ans)} … ${R(ans)}　← これが答え`],
          };
        }),
        // 03d10 辺から2本を選ぶとき、ねじれの位置にある2本の選び方（立方体・三角柱・正四角錐）
        t("03d10", (r) => {
          const S = pick(r, [CUBE, CUBE, PR3, PY4]);
          const per = S.E.map((e) => S.E.filter((x) => !same(x, e) && isSkew(kindOf(S, e, x))).length);   // 辺ごとの、ねじれの位置にある辺の数
          const total = per.reduce((a, b) => a + b, 0);
          if (total % 2) return { skip: true };
          const groups = {}; per.forEach((c) => { groups[c] = (groups[c] || 0) + 1; });
          const gl = Object.keys(groups).map(Number).sort((a, b) => a - b);
          const ans = total / 2;
          return {
            q: `${introOf(S, true)}の ${S.E.length}本の辺から 2本を選ぶとき、ねじれの位置にある 2本の選び方は、何通りあるか。`,
            ans,
            unit: "通り",
            hint: "1本の辺について、ねじれの位置にある辺の数を数えて、全部の辺について合計する。同じ組を、2回ずつ数えていることに注意。",
            steps: [
              gl.length === 1 ? `どの辺も、ねじれの位置にある辺は ${gl[0]}本。` : `ねじれの位置にある辺の数は、${gl.map((c) => `${c}本の辺が ${groups[c]}本`).join("、")}。`,
              `のべ ${gl.map((c) => `${groups[c]}×${c}`).join(" + ")} = ${total}（組）`,
              `同じ組を 2回ずつ数えているので　${total}÷2 = ${ans}（通り）`,
            ],
          };
        }),
        // 03d11a 底面が ∠B＝90° の直角三角形の三角柱で、辺と平行な辺
        t("03d11a", (r) => edgeChoiceQ(r, RT, "parallel")),
        // 03d11b 辺とねじれの位置にある辺
        t("03d11b", (r) => edgeChoiceQ(r, RT, "skew")),
        // 03d11c 辺と垂直に交わる辺（斜辺は、交わるが垂直ではない）
        t("03d11c", (r) => edgeChoiceQ(r, RT, "perp")),
        // 03q05a 辺 AB ともねじれの位置にあり、辺 EH ともねじれの位置にある辺は、何本か
        t("03q05a", (r) => {
          const S = BOX, e1 = pick(r, S.E), e2 = pick(r, S.E.filter((x) => !same(x, e1)));
          const both = S.E.filter((x) => !same(x, e1) && !same(x, e2) && isSkew(kindOf(S, e1, x)) && isSkew(kindOf(S, e2, x)));
          if (!both.length) return { skip: true };
          const s1 = S.E.filter((x) => !same(x, e1) && isSkew(kindOf(S, e1, x))), s2 = S.E.filter((x) => !same(x, e2) && isSkew(kindOf(S, e2, x)));
          return {
            q: `${introOf(S)}で、辺 ${eLab(e1)} ともねじれの位置にあり、辺 ${eLab(e2)} ともねじれの位置にある辺は、全部で何本あるか。`,
            ans: both.length,
            unit: "本",
            hint: "辺ごとに、ねじれの位置にある辺を全部書き出して、どちらにも入っている辺をさがそう。",
            steps: [`辺 ${eLab(e1)} とねじれの位置 … ${listEdges(s1)}`, `辺 ${eLab(e2)} とねじれの位置 … ${listEdges(s2)}`, `どちらにもあてはまる辺 … ${listEdges(both)}の ${both.length}本。`],
          };
        }),
        // 03q05b 同じ問題を、4択で（あてはまる辺が1本になる組だけ）
        t("03q05b", (r) => {
          const S = BOX, e1 = pick(r, S.E), e2 = pick(r, S.E.filter((x) => !same(x, e1)));
          const rest = S.E.filter((x) => !same(x, e1) && !same(x, e2));
          const both = rest.filter((x) => isSkew(kindOf(S, e1, x)) && isSkew(kindOf(S, e2, x)));
          if (both.length !== 1) return { skip: true };
          const only1 = rest.filter((x) => isSkew(kindOf(S, e1, x)) !== isSkew(kindOf(S, e2, x))), none = rest.filter((x) => !isSkew(kindOf(S, e1, x)) && !isSkew(kindOf(S, e2, x)));
          const ws = mix(r, [only1, none]).slice(0, 3);
          if (ws.length < 3) return { skip: true };
          const ans = eName(both[0]);
          const rel = (x) => `${eLab(e1)}と${isSkew(kindOf(S, e1, x)) ? "ねじれ" : WORD[kindOf(S, e1, x)].replace("（垂直ではない）", "")}、${eLab(e2)}と${isSkew(kindOf(S, e2, x)) ? "ねじれ" : WORD[kindOf(S, e2, x)].replace("（垂直ではない）", "")}`;
          return {
            q: `${introOf(S)}で、辺 ${eLab(e1)} ともねじれの位置にあり、辺 ${eLab(e2)} ともねじれの位置にある辺は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, ws.map(eName)),
            hint: "選択肢の辺を1つずつ、辺 " + eLab(e1) + " との関係と、辺 " + eLab(e2) + " との関係に分けて調べよう。",
            steps: [...ws.map((x) => `${eName(x)} … ${rel(x)}`), `${ans} … ${rel(both[0])}　← 両方ねじれの位置`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式（数値か4択）で答えられないもの）
export const SKIPPED = [];   // 第3時は、演習プリント 11問・小テスト 5問のすべてを移した（「すべて答えよう」は、数か4択に。理由つきの問い（dr.9）は、位置関係を選ぶ4択に直した）
