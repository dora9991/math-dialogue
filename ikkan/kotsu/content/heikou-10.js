// ============================================================
// heikou-10.js — 平行と合同 第10時「合同条件を使って、合同な三角形を見つけよう」
//   ikkan の演習プリント（heikou-10.dr.1〜8）・小テスト（heikou-10.qz.1〜4）と、ワークシートの例題・考えようを、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「10」＋ d（演習）／q（小テスト）／w（ワークシートの K ブロック。2＝例題、3＝考えよう）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：10d04b ＝ heikou-10.dr.4 の「使う合同条件」
//   図は出せないので、点の名前・位置関係（中点・対角線・平行・交わる線分・辺上の点）を、問題文で言い切る。
//   合同条件の判定は judge() が、等しい組（辺の番号・角の番号）から計算する（手で答えを書かない）。
//   等しい辺・角は、条件にあるものと、共通な辺（角）・対頂角・平行線の錯角から見つける。これ以外（二等辺三角形の底角・三平方の定理 など）は、使わない約束にして、問題文に書く。
//   「いえるものを、すべて選ぼう」は、いくつあるかを数える問題と、選んだ組を選ぶ4択に、「説明しよう」は、正しい説明を選ぶ4択に直した。
// ============================================================
import { t as t0, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

// ── 合同条件の判定 ────────────────────────────────────────────
const COND = { SSS: "3組の辺", SAS: "2組の辺とその間の角", ASA: "1組の辺とその両端の角", NONE: "合同とはいえない" };
const CONDS3 = ["SSS", "SAS", "ASA"];
/** 三角形の6つの要素：辺 0,1,2（頂点 0,1,2 の向かいの辺）と、角 0,1,2（頂点 0,1,2 の角）。
 *  S＝等しい辺の番号、A＝等しい角の番号。返す値：SSS／SAS／ASA／NONE（どの合同条件にもあてはまらない）／
 *  AAS（2つの角と、その間でない辺。内角の和から ASA にできるが、3つの合同条件の形ではないので、出題には使わない） */
function judge(S, A) {
  const s = new Set(S), a = new Set(A);
  if (s.size === 3) return "SSS";
  if (s.size === 2 && a.has([0, 1, 2].find((i) => !s.has(i)))) return "SAS";
  for (const i of s) { const o = [0, 1, 2].filter((x) => x !== i); if (a.has(o[0]) && a.has(o[1])) return "ASA"; }
  if (a.size >= 2 && s.size >= 1) return "AAS";
  return "NONE";
}
const tri = (T) => `△${T.join("")}`;
const clsOf = (facts) => judge(facts.filter((f) => f.k === "S").map((f) => f.i), facts.filter((f) => f.k === "A").map((f) => f.i));

// ── 点の名前 ──────────────────────────────────────────────
const L4 = [["A", "B", "C", "D"], ["P", "Q", "R", "S"], ["E", "F", "G", "H"], ["K", "L", "M", "N"], ["W", "X", "Y", "Z"]];
const L5 = [["A", "B", "C", "D", "E"], ["P", "Q", "R", "S", "T"], ["F", "G", "H", "J", "K"]];
const L6 = [["A", "B", "C", "D", "E", "P"], ["P", "Q", "R", "S", "T", "U"], ["K", "L", "M", "N", "X", "Y"]];
const L7 = [["A", "B", "C", "D", "E", "F", "P"], ["P", "Q", "R", "S", "T", "U", "V"], ["K", "L", "M", "N", "X", "Y", "Z"]];
const PAIRS3 = [[["A", "B", "C"], ["D", "E", "F"]], [["P", "Q", "R"], ["X", "Y", "Z"]], [["K", "L", "M"], ["N", "P", "Q"]]];
const seg = (x, y) => [x, y].sort().join("");
/** 誤答の候補 pool から3つえらぶ。正解 ans の「長さの順位」（いちばん短い〜いちばん長い）が、かたよらないように（長さで当てられないように） */
function pickWrongs(r, ans, pool, k = 3) {
  const target = r(0, k), len = (x) => String(x).length;
  let first = null;
  for (let i = 0; i < 60; i++) {
    const w = shuffle(r, pool).slice(0, k), lo = w.filter((x) => len(x) < len(ans)).length, ties = w.filter((x) => len(x) === len(ans)).length;
    if (!first) first = w;
    if (target >= lo && target <= lo + ties) return w;
  }
  return first;
}


// ── 等しい組 ──────────────────────────────────────────────
/** k＝"S"（辺）か "A"（角）、i＝T1 の頂点の番号（辺は、その頂点の向かいの辺）、text＝文、src＝わけ、
 *  rsn＝問題文に書いてないときの見つけ方、ask＝「〜といえるのは、どうしてか」で聞く式 */
const fact = (k, i, text, src, rsn, ask) => ({ k, i, text, src, rsn, ask });
const factLine = (facts) => facts.map((f) => `${f.text}${f.src ? `（${f.src}）` : ""}`).join("、");
const RSN = {   // どれも8字（長さで当てられないように）
  side: "共通する辺だから",
  angleC: "共通する角だから",
  vert: "対頂角であるから",
  alt: "錯角どうしだから",
};
const RSN_WHY = {
  side: "どちらの三角形にもふくまれる辺だから、共通な辺。",
  angleC: "どちらの三角形にもふくまれる角だから、共通な角。",
  vert: "2直線が交わってできる、向かい合った角だから、対頂角。",
  alt: "平行な2直線に1本の直線が交わるとき、2直線の間で、交わる直線をはさんで反対がわにある角どうしだから、錯角。",
};
/** 三角形 ok の頂点の並べ方を、かえたもの（5通り） */
const permsOf = (ok) => [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => ok[i])).filter((v) => v.join("") !== ok.join(""));
const sidesOf = (T) => [0, 1, 2].map((i) => seg(T[(i + 1) % 3], T[(i + 2) % 3]));

// ── 図の設定（点の名前と位置関係を、文章で約束する）────────────────────────
const NOTE = "（等しい辺や角は、条件にあるもののほか、共通な辺（角）・対頂角・平行線の錯角から見つける。それ以外の性質は使わない。）";

/** 四角形 abcd で ab＝ad、cb＝cd。対角線 ac */
const cfgKite = ([a, b, c, d]) => ({
  name: "kite", intro: `四角形 ${a}${b}${c}${d} で、${a}${b}＝${a}${d}、${c}${b}＝${c}${d} である。対角線 ${a}${c} をひく。`,
  T1: [a, b, c], T2: [a, d, c],
  facts: [fact("S", 2, `${a}${b}＝${a}${d}`, "条件"), fact("S", 0, `${c}${b}＝${c}${d}`, "条件"), fact("S", 1, `${a}${c} は共通`, "", "side", `${a}${c}＝${a}${c}`)],
});
/** 四角形 abcd で ab＝cd、ad＝cb。対角線 ac */
const cfgOpp = ([a, b, c, d]) => ({
  name: "opp", intro: `四角形 ${a}${b}${c}${d} で、${a}${b}＝${c}${d}、${a}${d}＝${c}${b} である。対角線 ${a}${c} をひく。`,
  T1: [a, b, c], T2: [c, d, a],
  facts: [fact("S", 2, `${a}${b}＝${c}${d}`, "条件"), fact("S", 0, `${c}${b}＝${a}${d}`, "条件"), fact("S", 1, `${a}${c} は共通`, "", "side", `${a}${c}＝${c}${a}`)],
});
/** 四角形 abcd で ab∥dc、ab＝dc。対角線 ac */
const cfgParEq = ([a, b, c, d]) => ({
  name: "parEq", intro: `四角形 ${a}${b}${c}${d} で、${a}${b}∥${d}${c}、${a}${b}＝${d}${c} である。対角線 ${a}${c} をひく。`,
  T1: [a, b, c], T2: [c, d, a],
  facts: [fact("S", 2, `${a}${b}＝${c}${d}`, "条件"), fact("A", 0, `∠${b}${a}${c}＝∠${d}${c}${a}`, "平行線の錯角", "alt", `∠${b}${a}${c}＝∠${d}${c}${a}`), fact("S", 1, `${a}${c} は共通`, "", "side", `${a}${c}＝${c}${a}`)],
});
/** 四角形 abcd で ad∥bc、ad＝cb。対角線 bd */
const cfgParEq2 = ([a, b, c, d]) => ({
  name: "parEq2", intro: `四角形 ${a}${b}${c}${d} で、${a}${d}∥${b}${c}、${a}${d}＝${c}${b} である。対角線 ${b}${d} をひく。`,
  T1: [a, d, b], T2: [c, b, d],
  facts: [fact("S", 2, `${a}${d}＝${c}${b}`, "条件"), fact("A", 1, `∠${a}${d}${b}＝∠${c}${b}${d}`, "平行線の錯角", "alt", `∠${a}${d}${b}＝∠${c}${b}${d}`), fact("S", 0, `${b}${d} は共通`, "", "side", `${d}${b}＝${b}${d}`)],
});
/** 四角形 abcd で ab∥dc、ad∥bc。対角線 ac */
const cfgParPar = ([a, b, c, d]) => ({
  name: "parPar", intro: `四角形 ${a}${b}${c}${d} で、${a}${b}∥${d}${c}、${a}${d}∥${b}${c} である。対角線 ${a}${c} をひく。`,
  T1: [a, b, c], T2: [c, d, a],
  facts: [fact("A", 0, `∠${b}${a}${c}＝∠${d}${c}${a}`, `${a}${b}∥${d}${c} の錯角`, "alt", `∠${b}${a}${c}＝∠${d}${c}${a}`), fact("A", 2, `∠${b}${c}${a}＝∠${d}${a}${c}`, `${a}${d}∥${b}${c} の錯角`, "alt", `∠${b}${c}${a}＝∠${d}${a}${c}`), fact("S", 1, `${a}${c} は共通`, "", "side", `${a}${c}＝${c}${a}`)],
});
/** △abc で ab＝ac。辺 bc の中点 d。ad をひく */
const cfgIsoMid = ([a, b, c, d]) => ({
  name: "isoMid", intro: `△${a}${b}${c} で、${a}${b}＝${a}${c} である。辺 ${b}${c} の中点を ${d} とし、${a} と ${d} を結ぶ。`,
  T1: [a, b, d], T2: [a, c, d],
  wrongs: [[a, d, c], [c, d, a], [d, a, c], [d, c, a], [a, b, c]],   // d が最後でない並べ方と、大きい三角形（d が最後の別の並べ方は、特別な形で成り立つことがあるので、使わない）
  facts: [fact("S", 2, `${a}${b}＝${a}${c}`, "条件"), fact("S", 0, `${b}${d}＝${c}${d}`, `${d} は辺 ${b}${c} の中点`), fact("S", 1, `${a}${d} は共通`, "", "side", `${a}${d}＝${a}${d}`)],
});
/** △abc で ab＝ac。∠a の二等分線と辺 bc の交点 d */
const cfgIsoBis = ([a, b, c, d]) => ({
  name: "isoBis", intro: `△${a}${b}${c} で、${a}${b}＝${a}${c} である。∠${a} の二等分線が辺 ${b}${c} と交わる点を ${d} とする。`,
  T1: [a, b, d], T2: [a, c, d],
  wrongs: [[a, d, c], [c, d, a], [d, a, c], [d, c, a], [a, b, c]],
  facts: [fact("S", 2, `${a}${b}＝${a}${c}`, "条件"), fact("A", 0, `∠${b}${a}${d}＝∠${c}${a}${d}`, `${a}${d} は ∠${a} の二等分線`), fact("S", 1, `${a}${d} は共通`, "", "side", `${a}${d}＝${a}${d}`)],
});
/** 線分 ab と cd が点 o で交わる。given＝条件にする2つの等しい組の名前 */
const crossFacts = ([a, b, c, d, o]) => ({
  OA: fact("S", 2, `${o}${a}＝${o}${b}`, "条件"), OC: fact("S", 0, `${o}${c}＝${o}${d}`, "条件"), AC: fact("S", 1, `${a}${c}＝${b}${d}`, "条件"),
  A0: fact("A", 0, `∠${o}${a}${c}＝∠${o}${b}${d}`, "条件"), A2: fact("A", 2, `∠${o}${c}${a}＝∠${o}${d}${b}`, "条件"),
  hid: fact("A", 1, `∠${a}${o}${c}＝∠${b}${o}${d}`, "対頂角", "vert", `∠${a}${o}${c}＝∠${b}${o}${d}`),
});
const cfgCross = (L, given) => {
  const [a, b, c, d, o] = L, fs = crossFacts(L), par = given.includes("PAR"), g2 = given.filter((g) => g !== "PAR");
  const alt = (i) => fact("A", i, i === 0 ? `∠${o}${a}${c}＝∠${o}${b}${d}` : `∠${o}${c}${a}＝∠${o}${d}${b}`, "平行線の錯角", "alt", i === 0 ? `∠${o}${a}${c}＝∠${o}${b}${d}` : `∠${o}${c}${a}＝∠${o}${d}${b}`);
  return {
    name: "cross", intro: `線分 ${a}${b} と ${c}${d} が点 ${o} で交わっている（${o} は、${a}${b} の間にも ${c}${d} の間にもある）。`,
    given: [...(par ? [`${a}${c}∥${d}${b}`] : []), ...g2.map((g) => fs[g].text)].join("、"),
    T1: [a, o, c], T2: [b, o, d],
    facts: [...g2.map((g) => fs[g]), ...(par ? [alt(0), alt(2)] : []), fs.hid],
  };
};
/** △abc で、辺 ab 上に d、辺 ac 上に e。variant：1＝ab＝ac・ad＝ae、2＝ab＝ac・∠abe＝∠acd、3＝ad＝ae・∠adc＝∠aeb */
const cfgOverlap = ([a, b, c, d, e], variant) => {
  const hid = fact("A", 0, `∠${b}${a}${e}＝∠${c}${a}${d}`, "共通な角", "angleC", `∠${b}${a}${e}＝∠${c}${a}${d}`);
  const V = {
    1: { given: `${a}${b}＝${a}${c}、${a}${d}＝${a}${e}`, facts: [fact("S", 2, `${a}${b}＝${a}${c}`, "条件"), fact("S", 1, `${a}${e}＝${a}${d}`, "条件"), hid] },
    2: { given: `${a}${b}＝${a}${c}、∠${a}${b}${e}＝∠${a}${c}${d}`, facts: [fact("S", 2, `${a}${b}＝${a}${c}`, "条件"), fact("A", 1, `∠${a}${b}${e}＝∠${a}${c}${d}`, "条件"), hid] },
    3: { given: `${a}${d}＝${a}${e}、∠${a}${d}${c}＝∠${a}${e}${b}`, facts: [fact("S", 1, `${a}${e}＝${a}${d}`, "条件"), fact("A", 2, `∠${a}${e}${b}＝∠${a}${d}${c}`, "条件"), hid] },
  }[variant];
  return {
    name: "overlap", intro: `△${a}${b}${c} で、辺 ${a}${b} 上に点 ${d}、辺 ${a}${c} 上に点 ${e} がある（${d}、${e} は頂点とは異なる点）。${b}${e} と ${c}${d} をひく。`,
    given: V.given, T1: [a, b, e], T2: [a, c, d], facts: V.facts,
    commonAngle: { ans: `∠${b}${a}${c}`, wrongs: [`∠${a}${b}${e}`, `∠${a}${c}${d}`, `∠${a}${e}${b}`, `∠${a}${d}${c}`] },
  };
};
const introOf = (cfg) => `${cfg.intro}${cfg.given ? `${cfg.given} である。` : ""}`;

const NUM = { SSS: "①", SAS: "②", ASA: "③" };
const LEGEND = "（合同条件　① 3組の辺が、それぞれ等しい　② 2組の辺とその間の角が、それぞれ等しい　③ 1組の辺とその両端の角が、それぞれ等しい）";
/** 設定 cfg から、(合同な三角形の組) × (使う合同条件の番号) の 2×2 の4択をつくる。合同条件は番号にして、選択肢の長さをそろえる（正解だけ短い・長い、にならないように） */
function gridQ(r, cfg, { note = NOTE } = {}) {
  const cls = clsOf(cfg.facts);
  if (!CONDS3.includes(cls)) throw new Error(`gridQ：合同条件の形でない ${cfg.name} ${cls}`);
  const ok = `${tri(cfg.T1)}≡${tri(cfg.T2)}`;
  const bad = `${tri(cfg.T1)}≡${tri(pick(r, cfg.wrongs || permsOf(cfg.T2)))}`;
  const wc = pick(r, CONDS3.filter((c) => c !== cls));
  const ans = `${ok}、${NUM[cls]}`;
  return {
    q: `${introOf(cfg)}\n${note}\n${LEGEND}\n合同な三角形の組（記号 ≡ で表す）と、使う合同条件の番号の組として、いつでも正しいものは、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, [`${ok}、${NUM[wc]}`, `${bad}、${NUM[cls]}`, `${bad}、${NUM[wc]}`]),
    hint: `${tri(cfg.T1)} と ${tri(cfg.T2)} で、等しい辺や角を3つ見つけられるかな？ 3つがそろったら、3つの合同条件のどれかの形になっているかな？`,
    steps: [
      `${tri(cfg.T1)} と ${tri(cfg.T2)} で、${factLine(cfg.facts)}。`,
      `${NUM[cls]}（${COND[cls]}）が、それぞれ等しいから　${ok}。`,
      `頂点は、対応する順に書く（${cfg.T1.map((v, i) => `${v} に ${cfg.T2[i]}`).join("、")}）。答えは「${ans}」。`,
    ],
  };
}

/** 設定 cfg の、問題文に書いていない等しい組について、「どうして等しいといえるか」の4択 */
function reasonQ(r, cfg) {
  const f = pick(r, cfg.facts.filter((x) => x.rsn)), ans = RSN[f.rsn];
  return {
    q: `${introOf(cfg)}\n${tri(cfg.T1)} と ${tri(cfg.T2)} で、${f.ask} といえる理由は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, Object.values(RSN).filter((x) => x !== ans)),
    hint: "この等しい組は、問題の条件に書いてあるかな？ 書いていないとき、図の形から等しいといえる理由には、どんなものがあったかな？",
    steps: [`「${f.ask}」は、問題の条件に書いていない。`, RSN_WHY[f.rsn], `答えは「${ans}」。`],
  };
}

// ── 3つの等しい組（△ABC と △DEF のように、ほかに何も約束しない場合）──────────────────
const sideTxt = (T, i) => `${T[(i + 1) % 3]}${T[(i + 2) % 3]}`;
const sideEq = (r, T1, T2, i) => { let a = sideTxt(T1, i), b = sideTxt(T2, i); if (r(0, 2) === 0) { a = [...a].reverse().join(""); b = [...b].reverse().join(""); } return `${a}＝${b}`; };
const angEq = (T1, T2, i) => `∠${T1[i]}＝∠${T2[i]}`;
const PURE = {
  SSS: () => ({ S: [0, 1, 2], A: [] }),
  SAS: (r) => { const v = r(0, 2); return { S: [0, 1, 2].filter((x) => x !== v), A: [v] }; },
  ASA: (r) => { const i = r(0, 2); return { S: [i], A: [0, 1, 2].filter((x) => x !== i) }; },
  SSA: (r) => { const v = r(0, 2), o = [0, 1, 2].filter((x) => x !== v); return { S: o, A: [pick(r, o)] }; },
  AAA: () => ({ S: [], A: [0, 1, 2] }),
};
/** 種類 kind の、3つの等しい組。{ S, A, cls, key, texts（順番をまぜた文）} */
function pureFacts(r, kind, T1, T2) {
  const p = PURE[kind](r), cls = judge(p.S, p.A);
  const items = shuffle(r, [...p.S.map((i) => ({ k: "S", i })), ...p.A.map((i) => ({ k: "A", i }))]);
  return { ...p, cls, key: items.map((x) => x.k + x.i).sort().join(""), texts: items.map((x) => (x.k === "S" ? sideEq(r, T1, T2, x.i) : angEq(T1, T2, x.i))) };
}
/** 3つの等しい組が、なぜその判定になるかの説明（2行） */
function whyPure(p, T1) {
  const sides = p.S.map((i) => sideTxt(T1, i));
  if (p.cls === "SSS") return [`3つの辺 ${sides.join("、")} が、それぞれ等しい。`, `3組の辺が、それぞれ等しいから、合同といえる。`];
  if (p.cls === "SAS") return [`等しい辺は ${sides.join("、")} の2組。∠${T1[p.A[0]]} は、その2辺の間の角。`, `2組の辺とその間の角が、それぞれ等しいから、合同といえる。`];
  if (p.cls === "ASA") return [`等しい辺は ${sides[0]} の1組。その両端の角 ${p.A.map((i) => `∠${T1[i]}`).join("、")} も等しい。`, `1組の辺とその両端の角が、それぞれ等しいから、合同といえる。`];
  if (p.S.length) return [`等しい辺は ${sides.join("、")} の2組。しかし、等しい角 ∠${T1[p.A[0]]} は、その2辺の間の角ではない。`, `どの合同条件にもあてはまらないから、合同とはいえない。`];
  return [`等しいのは、3つの角だけ。`, `3組の角が等しくても、大きさがちがう三角形がある。どの合同条件にもあてはまらないから、合同とはいえない。`];
}
const CLS_LABEL = { SSS: COND.SSS, SAS: COND.SAS, ASA: COND.ASA, NONE: "×（合同とはいえない）" };
const pickPairs = (r) => pick(r, PAIRS3);
const perm4 = (r) => pick(r, L4);
const cross5 = (r) => [...pick(r, L4), "O"];

/** 3つの等しい組を4つ（ア〜エ）。合同といえるものが k 個。{ list（4つ）, T1, T2 } */
function fourSets(r, k) {
  const [T1, T2] = pickPairs(r), used = new Set(), items = [];
  const add = (kind) => { for (let i = 0; i < 40; i++) { const p = pureFacts(r, kind, T1, T2); if (!used.has(p.key)) { used.add(p.key); items.push(p); return true; } } return false; };
  for (let i = 0; i < k; i++) if (!add(pick(r, ["SSS", "SAS", "SAS", "ASA", "ASA"]))) return null;
  for (let i = 0; i < 4 - k; i++) if (!add(pick(r, ["SSA", "SSA", "AAA"]))) return null;
  return { list: shuffle(r, items), T1, T2 };
}
const LET = ["ア", "イ", "ウ", "エ"];

export const UNITS = [
  unit("10", {
    name: "合同条件を使って、合同な三角形を見つける",
    desc: "共通な辺（角）・対頂角・平行線の錯角に目をつけて、等しい辺や角を見つけ、3つの合同条件のどれが使えるかを調べる",
    prereqs: ["J2-hk09"],
    points: [
      "2つの三角形は、①3組の辺が、それぞれ等しい　②2組の辺とその間の角が、それぞれ等しい　③1組の辺とその両端の角が、それぞれ等しい　のどれかが成り立つとき、合同である（三角形の合同条件）。",
      "等しい辺や角は、問題の条件に書いてあるものだけでなく、図の中からも見つける。2つの三角形のどちらにもふくまれる辺（角）は共通。2直線が交わってできる向かい合った角（対頂角）は等しい。平行な2直線では、錯角が等しい。",
      "3組の角が等しいだけでは、合同とはいえない。また、2組の辺と、その間にない角が等しいだけでも、合同とはいえない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 10d01a 演習（1）AB＝AC、D は辺 BC の中点 → 合同な三角形と合同条件（3組の辺）。二等分線の場合は、2組の辺とその間の角
        t("10d01a", (r) => gridQ(r, pick(r, [cfgIsoMid, cfgIsoMid, cfgIsoBis])(perm4(r)))),
        // 10d01b 演習（1）問題文に書いていない等しい組（AD は共通 など）の理由
        t("10d01b", (r) => reasonQ(r, pick(r, [
          () => pick(r, [cfgIsoMid, cfgIsoBis, cfgKite, cfgOpp])(perm4(r)),        // 共通な辺
          () => cfgOverlap(pick(r, L5), pick(r, [1, 2, 3])),                       // 共通な角
          () => cfgCross(cross5(r), pick(r, [["OA", "OC"], ["OA", "A0"], ["OC", "A2"]])),   // 対頂角
          () => pick(r, [cfgParEq, cfgParEq2, cfgParPar])(perm4(r)),               // 錯角（または共通な辺）
        ])())),
        // 10d01c 演習（1）共通な辺（角）を選ぶ
        t("10d01c", (r) => {
          const ang = r(0, 4) === 0;
          if (ang) {
            const cfg = cfgOverlap(pick(r, L5), pick(r, [1, 2, 3])), cm = cfg.commonAngle, [a, b, c, d, e] = [cfg.T1[0], cfg.T1[1], cfg.T2[1], cfg.T2[2], cfg.T1[2]];
            return {
              q: `${introOf(cfg)}\n${tri(cfg.T1)} と ${tri(cfg.T2)} に共通な角は、次のうちどれか。`,
              ans: cm.ans,
              choices: choices4(r, cm.ans, shuffle(r, cm.wrongs).slice(0, 3)),
              hint: `2つの三角形の、角を1つずつ書き出してみよう。${e} は辺 ${a}${c} 上、${d} は辺 ${a}${b} 上にあるね。どちらにも出てくる角はどれかな？`,
              steps: [`${e} は辺 ${a}${c} 上、${d} は辺 ${a}${b} 上にあるから、${tri(cfg.T1)} の ∠${b}${a}${e} も、${tri(cfg.T2)} の ∠${c}${a}${d} も、∠${b}${a}${c} と同じ角。`, `答えは「${cm.ans}」。`],
            };
          }
          const cfg = pick(r, [cfgIsoMid, cfgIsoBis, cfgKite, cfgOpp, cfgParEq, cfgParEq2, cfgParPar])(perm4(r));
          const s1 = sidesOf(cfg.T1), s2 = sidesOf(cfg.T2), com = s1.filter((x) => s2.includes(x));
          if (com.length !== 1) return { skip: true };
          // 図にある、三角形の辺ではない線分（もう1本の対角線、または、もとの三角形の辺）も、誤答の候補に入れる
          const vs = [...new Set([...cfg.T1, ...cfg.T2])].sort(), others = [];
          for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) { const e = vs[i] + vs[j]; if (!s1.includes(e) && !s2.includes(e)) others.push(e); }
          const ans = `辺 ${com[0]}`, wrongs = [...new Set([...s1, ...s2].filter((x) => x !== com[0]))];
          const pool = shuffle(r, wrongs).slice(0, 3 - Math.min(others.length, 1)).concat(others.length ? [pick(r, others)] : []);
          return {
            q: `${introOf(cfg)}\n${tri(cfg.T1)} と ${tri(cfg.T2)} に共通な辺は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, pool.map((x) => `辺 ${x}`)),
            hint: "2つの三角形の、辺を3本ずつ書き出してみよう。どちらにも出てくる辺はどれかな？",
            steps: [`${tri(cfg.T1)} の辺は ${s1.join("、")}、${tri(cfg.T2)} の辺は ${s2.join("、")}。`, `どちらにも出てくる辺は「${com[0]}」。答えは「${ans}」。`],
          };
        }),
        // 10d02a 演習（2）AB∥DC、AB＝DC → △ABC≡△CDA（2組の辺とその間の角。錯角と共通な辺）
        t("10d02a", (r) => gridQ(r, cfgParEq(perm4(r)))),
        // 10d02b 演習（2）平行線の錯角・共通な辺の理由
        t("10d02b", (r) => reasonQ(r, pick(r, [cfgParEq, cfgParEq2, cfgParPar])(perm4(r)))),
        // 10d03a 演習（3）線分 AB と CD が点 O で交わり、…（1組の辺とその両端の角。対頂角）
        t("10d03a", (r) => gridQ(r, cfgCross(cross5(r), pick(r, [["OA", "OC"], ["OA", "A0"], ["OC", "A2"], ["PAR", "OA"], ["PAR", "OC"], ["PAR", "AC"]])))),
        // 10d03b 演習（3）対頂角の理由
        t("10d03b", (r) => reasonQ(r, cfgCross(cross5(r), pick(r, [["OA", "OC"], ["PAR", "OA"], ["PAR", "OC"], ["PAR", "AC"]])))),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 10d04a 演習（4）ア〜エのうち、合同といえるものはいくつあるか
        t("10d04a", (r) => {
          const k = r(1, 3), s = fourSets(r, k);
          if (!s) return { skip: true };
          const { list, T1, T2 } = s, res = (i) => `${LET[i]} … ${CLS_LABEL[list[i].cls]}`;
          return {
            q: `${tri(T1)} と ${tri(T2)} で、次のア〜エのことがわかっているとき、${tri(T1)}≡${tri(T2)} といえるものは、いくつあるか。\n${list.map((p, i) => `${LET[i]} ${p.texts.join("、")}`).join("\n")}`,
            ans: k,
            unit: "個",
            hint: "アから順に、等しい辺と角を数えてみよう。3つの合同条件のどれかの形になっているかな？ 角は、どの2辺の間にあるかな？",
            steps: [`${res(0)}　　${res(1)}`, `${res(2)}　　${res(3)}`, `合同といえるのは ${k}個。`],
          };
        }),
        // 10d04b 演習（4）3つの等しい組から、使う合同条件
        t("10d04b", (r) => {
          const [T1, T2] = pickPairs(r), p = pureFacts(r, pick(r, ["SSS", "SAS", "ASA", "SSA", "AAA", "SAS", "ASA"]), T1, T2), ans = COND[p.cls];
          return {
            q: `${tri(T1)} と ${tri(T2)} で、${p.texts.join("、")} がわかっている。${tri(T1)}≡${tri(T2)} の根拠になる合同条件は、次のうちどれか。（合同といえないときは、「合同とはいえない」を選ぶ。）`,
            ans,
            choices: choices4(r, ans, Object.values(COND).filter((x) => x !== ans)),
            hint: "わかっている3つのうち、辺はいくつ、角はいくつあるかな？ 角は、どの2辺の間の角かな？",
            steps: [...whyPure(p, T1), `答えは「${ans}」。`],
          };
        }),
        // 10d05 演習（5）AB＝AD の四角形 ABCD、対角線 AC。△ABC≡△ADC といえるために、あと1つ（2通りのうち1つを選ぶ4択に直した）
        t("10d05", (r) => {
          const [a, b, c, d] = perm4(r);
          const g = pick(r, [{ t: `${c}${b}＝${c}${d}`, c: "SSS" }, { t: `∠${b}${a}${c}＝∠${d}${a}${c}`, c: "SAS" }]);
          const angW = [`∠${a}${c}${b}＝∠${a}${c}${d}`, `∠${b}${a}${d}＝90°`], oth = [`${a}${b}∥${d}${c}`, `${a}${d}∥${b}${c}`, `${b}${c}＝${a}${d}`, `${a}${c}＝${b}${d}`];
          // 正解が「角の式」のときは、誤答にも「角の式」を1つ入れ、「式の形」で当たらないようにする
          const bad = g.c === "SAS" ? [pick(r, angW), ...pickWrongs(r, g.t, oth, 2)] : [pick(r, angW), ...shuffle(r, oth).slice(0, 2)];
          return {
            q: `四角形 ${a}${b}${c}${d} で、${a}${b}＝${a}${d} である。対角線 ${a}${c} をひくとき、${tri([a, b, c])}≡${tri([a, d, c])} といえるためには、あと1つ、次のどれがわかればよいか。`,
            ans: g.t,
            choices: choices4(r, g.t, bad),
            hint: `${a}${b}＝${a}${d} はわかっているね。${a}${c} は、2つの三角形で、どうなっているかな？ あと1つで、3つの合同条件のどれかの形になるのは、どんな等しさかな？`,
            steps: [`${a}${b}＝${a}${d}（条件）、${a}${c} は共通（共通な辺）。`, g.c === "SSS" ? `あと ${g.t} がわかれば、3組の辺が、それぞれ等しくなる。` : `あと ${g.t} がわかれば、等しい2辺 ${a}${b}、${a}${c} の間の角が等しくなり、2組の辺とその間の角が、それぞれ等しくなる。`, `ほかの選択肢では、どの合同条件の形にもならない。答えは「${g.t}」。`],
          };
        }),
        // 10w02a ワークシート 例題（重なった三角形）：△ABE≡△ACD
        t("10w02a", (r) => gridQ(r, cfgOverlap(pick(r, L5), pick(r, [1, 1, 2, 3])))),
        // 10q01 小テスト（1）ア〜エのうち、合同といえるものを、すべて選んだ組
        t("10q01", (r) => {
          const k = pick(r, [1, 2, 2, 3]), s = fourSets(r, k);
          if (!s) return { skip: true };
          const { list, T1, T2 } = s;
          const yes = [0, 1, 2, 3].filter((i) => list[i].cls !== "NONE"), no = [0, 1, 2, 3].filter((i) => !yes.includes(i));
          const flip = (set, x) => (set.includes(x) ? set.filter((y) => y !== x) : [...set, x].sort((m, n) => m - n));
          // 正解の集合 yes を、1つずつ入れかえた集合と、2つとも入れかえた集合（2×2）。空の集合・4つ全部の集合にならないように、入れかえる要素をえらぶ
          let a, b;
          if (yes.length === 2) { a = pick(r, yes); b = pick(r, no); } else if (yes.length === 1) { [a, b] = shuffle(r, no).slice(0, 2); } else { [a, b] = shuffle(r, yes).slice(0, 2); }
          const setTxt = (s2) => (s2.length === 1 ? `${LET[s2[0]]}だけ` : s2.map((i) => LET[i]).join("と"));
          const ans = setTxt(yes), res = (i) => `${LET[i]} … ${CLS_LABEL[list[i].cls]}`;
          return {
            q: `${tri(T1)} と ${tri(T2)} で、次のア〜エのことがわかっているとき、${tri(T1)}≡${tri(T2)} といえるものを、すべて選んだ組はどれか。\n${list.map((p, i) => `${LET[i]} ${p.texts.join("、")}`).join("\n")}`,
            ans,
            choices: choices4(r, ans, [setTxt(flip(yes, a)), setTxt(flip(yes, b)), setTxt(flip(flip(yes, a), b))]),
            hint: "アから順に、等しい辺と角を数えよう。3つの合同条件のどれかの形になっているものだけが、合同といえるよ。",
            steps: [`${res(0)}　　${res(1)}`, `${res(2)}　　${res(3)}`, `合同といえるのは ${yes.map((i) => LET[i]).join("、")}。答えは「${ans}」。`],
          };
        }),
        // 10q02 小テスト（2）AB＝CD、AD＝CB、対角線 AC → △ABC≡△CDA（3組の辺）
        t("10q02", (r) => gridQ(r, cfgOpp(perm4(r)))),
        // 10q03 小テスト（3）AD∥BC、AD＝CB、対角線 BD → △ADB≡△CBD（2組の辺とその間の角）
        t("10q03", (r) => gridQ(r, cfgParEq2(perm4(r)))),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 10d06a 演習（6）AB＝DE、BC＝EF、∠C＝∠F … 「間の角」のことばで、合同といえるか（といえないわけ）／あと1組、どの角が等しければよいか
        t("10d06a", (r) => {
          const [T1, T2] = pickPairs(r), v = r(0, 2), sides = [0, 1, 2].filter((x) => x !== v);
          const [s1, s2] = sides.map((i) => sideTxt(T1, i)), [e1, e2] = sides.map((i) => sideTxt(T2, i));
          if (r(0, 1) === 0) {
            const ans = `∠${T1[v]}＝∠${T2[v]}`, odd = "どの角でもよい";
            return {
              q: `${tri(T1)} と ${tri(T2)} で、${s1}＝${e1}、${s2}＝${e2} である。あと1組、角が等しいことがわかったとき、2組の辺とその間の角が、それぞれ等しくなって、${tri(T1)}≡${tri(T2)} がいつでもいえるのは、どの角が等しいときか。`,
              ans,
              choices: choices4(r, ans, [0, 1, 2].filter((x) => x !== v).map((x) => `∠${T1[x]}＝∠${T2[x]}`).concat([odd])),
              hint: "2組の辺とその間の角が等しければ合同になるのだったね。「間の角」とは、どの角のことだったかな？ 等しい2辺は、どの頂点に集まっているかな？",
              steps: [`等しい2辺は ${s1} と ${s2}。この2辺は、頂点 ${T1[v]} に集まっている。`, `2辺の間の角は ∠${T1[v]}。∠${T1[v]}＝∠${T2[v]} なら、2組の辺とその間の角が、それぞれ等しくなる。`, `ほかの角では、等しい2辺の間の角にならず、合同条件にあてはまらない。答えは「${ans}」。`],
            };
          }
          const between = r(0, 1) === 1, x = between ? v : pick(r, sides);
          const stmt = (yes, bet) => `${yes ? "いえる" : "いえない"}。∠${T1[x]} は、${s1} と ${s2} の間の角${bet ? "だから" : "ではないから"}。`;
          const ans = stmt(between, between);
          return {
            q: `${tri(T1)} と ${tri(T2)} で、${s1}＝${e1}、${s2}＝${e2}、∠${T1[x]}＝∠${T2[x]} であるとき、${tri(T1)}≡${tri(T2)} といえるか。理由もふくめて、正しいものを選ぼう。`,
            ans,
            choices: choices4(r, ans, [stmt(!between, between), stmt(between, !between), stmt(!between, !between)]),
            hint: "2組の辺とその間の角が等しければ合同になるのだったね。「間の角」とは、どの角のことだったかな？ 等しい角は、等しい2辺のどことどこの間にあるかな？",
            steps: [`等しい2辺は ${s1} と ${s2}。この2辺の間の角は ∠${T1[v]}。`, between ? `等しい角 ∠${T1[x]} は、2辺の間の角。2組の辺とその間の角が、それぞれ等しいから、合同といえる。` : `等しい角 ∠${T1[x]} は、2辺の間の角 ∠${T1[v]} ではない。2組の辺と、その間にない角が等しいだけでは、合同条件にあてはまらず、合同とはいえない。`, `答えは「${ans}」。`],
          };
        }),
        // 10d06b 演習（6）交わる線分で、2つの条件から、合同といえるか（といえないときもある）
        t("10d06b", (r) => {
          const cfg = cfgCross(cross5(r), pick(r, [["OA", "OC"], ["OA", "A0"], ["OC", "A2"], ["A0", "A2"], ["OA", "AC"], ["OC", "AC"]]));
          const cls = clsOf(cfg.facts), ans = COND[cls];
          return {
            q: `${cfg.intro}${cfg.given} のとき、${tri(cfg.T1)}≡${tri(cfg.T2)} といえるか。いえるなら、使う合同条件を選ぼう。（共通な辺（角）・対頂角・平行線の錯角は、使ってよい。それ以外の性質は使わない。）`,
            ans,
            choices: choices4(r, ans, Object.values(COND).filter((x) => x !== ans)),
            hint: "条件から等しい組を2つ、図の形から等しい組をあと1つ見つけられるかな？ 3つそろったら、3つの合同条件のどれかの形になっているかな？",
            steps: [
              `${tri(cfg.T1)} と ${tri(cfg.T2)} で、${factLine(cfg.facts)}。`,
              cls === "NONE" ? (cfg.facts.some((f) => f.k === "S") ? `等しい辺が2組あるが、等しい角は、その2辺の間の角ではない。` : `等しいのは3つの角だけで、辺が1組もない。`) : `${COND[cls]}が、それぞれ等しい。`,
              cls === "NONE" ? `どの合同条件にもあてはまらないから、合同とはいえない。答えは「${ans}」。` : `だから　${tri(cfg.T1)}≡${tri(cfg.T2)}。答えは「${ans}」。`,
            ],
          };
        }),
        // 10w03 ワークシート 考えよう：線分 AD と BC が点 O で交わり、AB∥CD。△AOB≡△DOC といえるために、あと1つ
        t("10w03", (r) => {
          const [a, b, c, d] = perm4(r), o = "O";
          const good = [`${a}${o}＝${d}${o}`, `${b}${o}＝${c}${o}`, `${a}${b}＝${d}${c}`];
          const angs = [`∠${o}${a}${b}＝∠${o}${d}${c}`, `∠${o}${b}${a}＝∠${o}${c}${d}`, `∠${a}${o}${b}＝∠${d}${o}${c}`];
          const sides = [`${a}${o}＝${b}${o}`, `${a}${d}＝${b}${c}`, `${a}${o}＝${c}${o}`, `${b}${o}＝${d}${o}`];
          const g = pick(r, good), w = [pick(r, angs), ...shuffle(r, sides).slice(0, 2)];
          return {
            q: `線分 ${a}${d} と ${b}${c} が点 ${o} で交わり、${a}${b}∥${c}${d} である（${o} は、${a}${d} の間にも ${b}${c} の間にもある）。${tri([a, o, b])}≡${tri([d, o, c])} といえるために、あと1つ、次のどれがわかればよいか。（共通な辺（角）・対頂角・平行線の錯角は、すでに使ってよい。）`,
            ans: g,
            choices: choices4(r, g, w),
            hint: "条件と図の形から、等しい角は何組見つかるかな？ 角だけで合同といえるかな？ 足りないのは、角かな、辺かな？",
            steps: [`${a}${b}∥${c}${d} だから、平行線の錯角は等しく　∠${o}${a}${b}＝∠${o}${d}${c}、∠${o}${b}${a}＝∠${o}${c}${d}。対頂角は等しく　∠${a}${o}${b}＝∠${d}${o}${c}。`, `等しい角は3組だが、角だけでは合同といえない。辺が1組、対応して等しければ、1組の辺とその両端の角が、それぞれ等しくなる。`, `対応する辺は、${a}${o} と ${d}${o}、${b}${o} と ${c}${o}、${a}${b} と ${d}${c}。答えは「${g}」。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 10d07a 演習（7）①正方形 ABCD の辺 BC 上に E、辺 CD 上に F、BE＝CF。△ABE≡△BCF（2組の辺とその間の角）
        t("10d07a", (r) => {
          const [A, B, C, D, E, G, P] = pick(r, L7);
          const cfg = {
            name: "square", intro: `正方形 ${A}${B}${C}${D} の辺 ${B}${C} 上に点 ${E}、辺 ${C}${D} 上に点 ${G} を、${B}${E}＝${C}${G} となるようにとる（${E}、${G} は頂点とは異なる点）。${A}${E} と ${B}${G} の交点を ${P} とする。`,
            T1: [A, B, E], T2: [B, C, G],
            facts: [fact("S", 2, `${A}${B}＝${B}${C}`, "正方形の辺"), fact("A", 1, `∠${A}${B}${E}＝∠${B}${C}${G}`, "正方形の角（どちらも 90°）"), fact("S", 0, `${B}${E}＝${C}${G}`, "条件")],
          };
          return gridQ(r, cfg, { note: "（合同条件を考えるときは、問題の条件と、正方形の辺・角の性質だけを使う。）" });
        }),
        // 10d07b 演習（7）②∠BAE＝x° のとき ∠ABF（または ∠BFC）の大きさ。合同から ∠CBF＝∠BAE
        t("10d07b", (r) => {
          const [A, B, C, D, E, G, P] = pick(r, L7);
          const m = r(12, 43), ask = pick(r, ["ABG", "BGC", "BAE"]);
          const head = `正方形 ${A}${B}${C}${D} の辺 ${B}${C} 上に点 ${E}、辺 ${C}${D} 上に点 ${G} を、${B}${E}＝${C}${G} となるようにとる（${E}、${G} は頂点とは異なる点）。${A}${E} と ${B}${G} の交点を ${P} とする。`;
          const common = `△${A}${B}${E} と △${B}${C}${G} で、${A}${B}＝${B}${C}（正方形の辺）、∠${A}${B}${E}＝∠${B}${C}${G}＝90°、${B}${E}＝${C}${G}（条件）。2組の辺とその間の角が、それぞれ等しいから　△${A}${B}${E}≡△${B}${C}${G}。`;
          let q, steps, ans;
          if (ask === "BAE") {
            const y = 90 - m; ans = m;
            q = `${head}∠${A}${B}${G}＝${y}° のとき、∠${B}${A}${E} の大きさは？`;
            steps = [common, `対応する角は等しいから　∠${B}${A}${E}＝∠${C}${B}${G}。`, `∠${C}${B}${G}＝∠${A}${B}${C}−∠${A}${B}${G}＝90°−${y}°＝${m}° だから、∠${B}${A}${E}＝${m}°。`];
          } else {
            ans = 90 - m;
            q = `${head}∠${B}${A}${E}＝${m}° のとき、∠${ask === "ABG" ? `${A}${B}${G}` : `${B}${G}${C}`} の大きさは？`;
            steps = [common, `対応する角は等しいから　∠${C}${B}${G}＝∠${B}${A}${E}＝${m}°。`, ask === "ABG" ? `∠${A}${B}${G}＝∠${A}${B}${C}−∠${C}${B}${G}＝90°−${m}°＝${ans}°` : `△${B}${C}${G} の内角の和から　∠${B}${G}${C}＝180°−90°−${m}°＝${ans}°`];
          }
          return { q, ans, unit: "度", hint: "合同な三角形を見つけると、等しい角がわかるよ。合同な三角形は、どれとどれかな？ その対応する角は？", steps };
        }),
        // 10d08a 演習（8）①正三角形 ABC の辺 BC 上に D、辺 CA 上に E、BD＝CE。△ABD と合同な三角形と合同条件
        t("10d08a", (r) => {
          const [A, B, C, D, E, P] = pick(r, L6);
          const cfg = {
            name: "tri", intro: `正三角形 ${A}${B}${C} の辺 ${B}${C} 上に点 ${D}、辺 ${C}${A} 上に点 ${E} を、${B}${D}＝${C}${E} となるようにとる（${D}、${E} は頂点とは異なる点）。${A}${D} と ${B}${E} の交点を ${P} とする。`,
            T1: [A, B, D], T2: [B, C, E],
            facts: [fact("S", 2, `${A}${B}＝${B}${C}`, "正三角形の辺"), fact("A", 1, `∠${A}${B}${D}＝∠${B}${C}${E}`, "正三角形の角（どちらも 60°）"), fact("S", 0, `${B}${D}＝${C}${E}`, "条件")],
          };
          return gridQ(r, cfg, { note: "（合同条件を考えるときは、問題の条件と、正三角形の辺・角の性質だけを使う。）" });
        }),
        // 10d08b 演習（8）②∠BAD＝x° のとき ∠ABE（または ∠BEC）の大きさ。合同から ∠CBE＝∠BAD
        t("10d08b", (r) => {
          const [A, B, C, D, E, P] = pick(r, L6);
          const x = r(10, 48), ask = pick(r, ["ABE", "BEC"]);
          const head = `正三角形 ${A}${B}${C} の辺 ${B}${C} 上に点 ${D}、辺 ${C}${A} 上に点 ${E} を、${B}${D}＝${C}${E} となるようにとる（${D}、${E} は頂点とは異なる点）。${A}${D} と ${B}${E} の交点を ${P} とする。`;
          const common = `△${A}${B}${D} と △${B}${C}${E} で、${A}${B}＝${B}${C}（正三角形の辺）、∠${A}${B}${D}＝∠${B}${C}${E}＝60°、${B}${D}＝${C}${E}（条件）。2組の辺とその間の角が、それぞれ等しいから　△${A}${B}${D}≡△${B}${C}${E}。`;
          const ans = ask === "ABE" ? 60 - x : 120 - x;
          return {
            q: `${head}∠${B}${A}${D}＝${x}° のとき、∠${ask === "ABE" ? `${A}${B}${E}` : `${B}${E}${C}`} の大きさは？`,
            ans, unit: "度",
            hint: "合同な三角形を見つけると、等しい角がわかるよ。合同な三角形は、どれとどれかな？ その対応する角は？",
            steps: [common, `対応する角は等しいから　∠${C}${B}${E}＝∠${B}${A}${D}＝${x}°。`, ask === "ABE" ? `∠${A}${B}${E}＝∠${A}${B}${C}−∠${C}${B}${E}＝60°−${x}°＝${ans}°` : `△${B}${C}${E} の内角の和から　∠${B}${E}${C}＝180°−60°−${x}°＝${ans}°`],
          };
        }),
        // 10q04a チャレンジ 正n角形の、となり合う3つの頂点でつくる三角形の合同（△ABC≡△BCD）。対応する辺、または、使う合同条件
        t("10q04a", (r) => {
          const n = r(5, 8), V = "ABCDEFGH".slice(0, n), i = r(0, n - 4), [w, x, y, z] = [V[i], V[i + 1], V[i + 2], V[i + 3]], nm = `正${"五六七八"[n - 5]}角形`;
          if (r(0, 3) === 0) {
            const ans = COND.SAS;
            return {
              q: `${nm} ${V} で、対角線 ${w}${y}、${x}${z} をひく。△${w}${x}${y}≡△${x}${y}${z} を示すとき、使う合同条件は、次のうちどれか。（使ってよいのは、正多角形の辺・角の性質だけとする。）`,
              ans,
              choices: choices4(r, ans, Object.values(COND).filter((c) => c !== ans)),
              hint: "正多角形では、辺の長さや、内角の大きさについて、何がいえたかな？ 2つの三角形で、等しいところを書き出してみよう。",
              steps: [`${nm}だから、すべての辺が等しく　${w}${x}＝${x}${y}、${x}${y}＝${y}${z}。すべての内角も等しく　∠${w}${x}${y}＝∠${x}${y}${z}。`, `∠${w}${x}${y}、∠${x}${y}${z} は、等しい2辺の間の角。`, `2組の辺とその間の角が、それぞれ等しいから　△${w}${x}${y}≡△${x}${y}${z}。答えは「${ans}」。`],
            };
          }
          // 辺 → 対応する辺（聞く辺は、片方の三角形にしかない辺。△wxy にしかない辺は wx・wy、△xyz にしかない辺は yz・xz）
          const ask = pick(r, [{ s: `${w}${x}`, a: `${x}${y}`, t: "1" }, { s: `${w}${y}`, a: `${x}${z}`, t: "1" }, { s: `${y}${z}`, a: `${x}${y}`, t: "2" }, { s: `${x}${z}`, a: `${w}${y}`, t: "2" }]);
          const all = shuffle(r, [`${w}${x}`, `${x}${y}`, `${w}${y}`, `${y}${z}`, `${x}${z}`].filter((e) => e !== ask.s && e !== ask.a)).slice(0, 2).concat([`${w}${z}`]);
          const ans = `辺 ${ask.a}`, map1 = { [w]: x, [x]: y, [y]: z }, map2 = { [x]: w, [y]: x, [z]: y };
          return {
            q: `${nm} ${V} で、対角線 ${w}${y}、${x}${z} をひくと、△${w}${x}${y}≡△${x}${y}${z} となる。このとき、辺 ${ask.s} に対応する辺は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, all.map((e) => `辺 ${e}`)),
            hint: `合同な三角形は、頂点を対応する順に書くのだったね。△${w}${x}${y} の ${w}、${x}、${y} には、△${x}${y}${z} のどの頂点が対応するかな？`,
            steps: [`△${w}${x}${y}≡△${x}${y}${z} だから、対応する頂点は　${w} と ${x}、${x} と ${y}、${y} と ${z}。`, `辺 ${ask.s} の両はしの ${ask.s[0]}、${ask.s[1]} に対応するのは、${[...ask.s].map((c) => (ask.t === "1" ? map1[c] : map2[c])).join("、")}。`, `答えは「${ans}」。`],
          };
        }),
        // 10q04c チャレンジ 対角線の長さから、ほかの対角線の長さの和（となり合う3つの頂点でつくる三角形は合同、対応する辺は等しい）
        t("10q04c", (r) => {
          const n = r(5, 8), V = "ABCDEFGH".slice(0, n), d = r(3, 9), m = n === 5 ? 2 : r(2, 3);
          const ids = shuffle(r, Array.from({ length: n - 2 }, (_, k) => k)).slice(0, m + 1), dn = (k) => `${V[k]}${V[k + 2]}`;
          const given = ids[0], others = ids.slice(1).sort((u, v) => u - v).map(dn);
          return {
            q: `正${"五六七八"[n - 5]}角形 ${V} で、対角線 ${dn(given)} の長さが ${d} cm のとき、対角線 ${others.join(" と ")} の長さの和は何 cm か。（${[given, ...ids.slice(1)].sort((u, v) => u - v).map(dn).join("、")} は、となり合う頂点を1つとばして結んだ対角線。）`,
            ans: m * d, unit: "cm",
            hint: "となり合う3つの頂点でつくる三角形は、どれも合同になるかな？ 合同な図形の、対応する辺について、何がいえたかな？",
            steps: [`となり合う3つの頂点でつくる三角形は、2組の辺とその間の角が、それぞれ等しいから、どれも合同（例：△${V[0]}${V[1]}${V[2]}≡△${V[1]}${V[2]}${V[3]}）。`, `合同な図形の、対応する辺は等しいから　${[dn(given), ...others].join("＝")}＝${d} cm。`, `${others.map(() => d).join(" + ")}＝${m * d}（cm）`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし（ikkan の演習プリント 8問・小テスト 4問のすべてを移した。「すべて選ぼう」「説明しよう」は、数・選んだ組・正しい説明を選ぶ4択に直した）
export const SKIPPED = [];
