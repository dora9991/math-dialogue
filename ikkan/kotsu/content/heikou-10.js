// ============================================================
// heikou-10.js — 平行と合同 第10時「合同条件を使って、合同な三角形を見つけよう」
//   ikkan の演習プリント（heikou-10.dr.1〜8）・小テスト（heikou-10.qz.1〜4）と、ワークシートの例題・考えようを、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「10」＋ d（演習）／q（小テスト）／w（ワークシートの K ブロック。2＝例題、3＝考えよう）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：10d04b ＝ heikou-10.dr.4 の「使う合同条件」
//   図は出せないので、点の名前・位置関係（中点・対角線・平行・交わる線分・辺上の点）を、問題文で言い切る。
//   合同条件の判定は judge() が、等しい組（辺の番号・角の番号）から計算する（手で答えを書かない）。
//   等しい辺・角は、条件にあるものと、共通な辺（角）・対頂角・平行線の錯角から見つける。これ以外（二等辺三角形の底角・三平方の定理 など）は、使わない約束にして、問題文に書く。
//   「いえるものを、すべて選ぼう」は、いくつあるかを数える問題と、選んだ組を選ぶ4択に、「説明しよう」は、正しい説明を選ぶ4択に直した。
//   正解の合同条件の番号が毎回同じにならないよう、図の設定の「型」（FAMILY）を、合同条件（①②③と、合同とはいえない）ごとにまぜて出す。正方形・正三角形の図は、辺をまわした型と、条件を「辺」「角」にかえた型をまぜる。
//   「あと1つ」の問題（10d05・10w03）は、いまわかっていること（known）に 1つ足して judge() にかけ、合同条件の形になるものを正解、ならないものを誤答にする（3つの合同条件の形ではないが合同になるもの＝AAS は、使わない）。
//   4択の誤答は、できるだけ正解と同じ形の文だけにし、正解の長さ・ほかとの似かた・問題文との似かたが、毎回同じ向きにならないように選ぶ（pickBal）。
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
const L4 = [["A", "B", "C", "D"], ["P", "Q", "R", "S"], ["E", "F", "G", "H"], ["K", "L", "M", "N"], ["W", "X", "Y", "Z"], ["J", "K", "L", "M"], ["S", "T", "U", "V"], ["D", "E", "F", "G"], ["B", "C", "D", "E"]];
const L5 = [["A", "B", "C", "D", "E"], ["P", "Q", "R", "S", "T"], ["F", "G", "H", "J", "K"], ["K", "L", "M", "N", "X"], ["U", "V", "W", "X", "Y"]];
const L6 = [["A", "B", "C", "D", "E", "P"], ["P", "Q", "R", "S", "T", "U"], ["K", "L", "M", "N", "X", "Y"], ["X", "Y", "Z", "U", "V", "W"]];
const L7 = [["A", "B", "C", "D", "E", "F", "P"], ["P", "Q", "R", "S", "T", "U", "V"], ["K", "L", "M", "N", "X", "Y", "Z"], ["W", "X", "Y", "Z", "U", "V", "T"], ["E", "F", "G", "H", "J", "K", "L"]];
const PAIRS3 = [[["A", "B", "C"], ["D", "E", "F"]], [["P", "Q", "R"], ["X", "Y", "Z"]], [["K", "L", "M"], ["N", "P", "Q"]], [["D", "E", "F"], ["G", "H", "J"]], [["L", "M", "N"], ["R", "S", "T"]], [["X", "Y", "Z"], ["U", "V", "W"]]];
const strip = (x) => String(x).replace(/[\s$]/g, "");
const cdist = (a, b) => { const m = new Map(); for (const c of strip(a)) m.set(c, (m.get(c) || 0) + 1); for (const c of strip(b)) m.set(c, (m.get(c) || 0) - 1); let d = 0; for (const v of m.values()) d += Math.abs(v); return d; };
const gram2 = (x) => { const t = strip(x), g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
const jacc = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
/** 正解 ans と誤答 ws（3つ）で、ans の「長さの順位」「字の近さの順位」「文字の並びの重なりの順位」を調べる。順位 0＝いちばん短い／いちばんほかに近い。同点なら範囲 [最小, 最大] */
function rankOf(ans, ws) {
  const all = [ans, ...ws], len = all.map((x) => strip(x).length), raw = all.map((x) => String(x).length);
  const rlo = ws.filter((x) => String(x).length < raw[0]).length, rties = ws.filter((x) => String(x).length === raw[0]).length;
  const lo = ws.filter((x) => strip(x).length < len[0]).length, ties = ws.filter((x) => strip(x).length === len[0]).length;
  const cs = all.map((c, j) => all.reduce((acc, d, k) => (k === j ? acc : acc + cdist(c, d)), 0));
  const clo = cs.slice(1).filter((v) => v < cs[0]).length, cties = cs.slice(1).filter((v) => v === cs[0]).length;
  const G = all.map(gram2), js = G.map((g, j) => G.reduce((acc, h, k) => (k === j ? acc : acc + jacc(g, h)), 0));
  const jlo = js.slice(1).filter((v) => v > js[0] + 1e-9).length, jties = js.slice(1).filter((v) => Math.abs(v - js[0]) <= 1e-9).length;
  return [[rlo, rlo + rties], [lo, lo + ties], [clo, clo + cties], [jlo, jlo + jties]];
}
/** 誤答の組をつくる関数 make（3つの配列を返す）を何回か試して、正解の「長さ」「字の近さ」「文字の重なり」の順位が、どれも（ランダムにえらんだ）順位になる組をえらぶ
 *  （長さや、ほかの選択肢との似かたで、正解を当てられないように）。全部は合わないときは、いちばん多く合う組のなかから、ランダムに */
function pickBal(r, ans, make, tries = 200) {
  const T = [r(0, 3), r(0, 3), r(0, 3), r(0, 3)], W = [3, 2, 1, 1];   // 長さ（文字列そのまま・空白と記号をのぞく）、字の近さ、文字の重なり、の順位
  let best = [], bestScore = -1;
  for (let i = 0; i < tries; i++) {
    const w = make();
    if (!w || w.length < 3) continue;
    const sc = rankOf(ans, w).reduce((acc, k, m) => acc + (T[m] >= k[0] && T[m] <= k[1] ? W[m] : 0), 0);
    if (sc > bestScore) { best = [w]; bestScore = sc; } else if (sc === bestScore) best.push(w);
  }
  return best.length ? pick(r, best) : null;
}
const seg = (x, y) => [x, y].sort().join("");

// ── 等しい組 ──────────────────────────────────────────────
/** k＝"S"（辺）か "A"（角）、i＝T1 の頂点の番号（辺は、その頂点の向かいの辺）、text＝文、src＝わけ、
 *  rsn＝問題文に書いてないときの見つけ方、ask＝「〜といえるのは、どうしてか」で聞く式 */
const fact = (k, i, text, src, rsn, ask) => ({ k, i, text, src, rsn, ask });
const factLine = (facts) => facts.map((f) => `${f.text}${f.src ? `（${f.src}）` : ""}`).join("、");
const RSN = {   // どれも 8〜9字（長さで当てられないように）
  side: "共通する辺だから",
  angleC: "共通する角だから",
  vert: "対頂角になるから",
  alt: "錯角どうしだから",
  sq: "正方形の辺だから",
  sqA: "正方形の角だから",
  tri: "正三角形の辺だから",
  triA: "正三角形の角だから",
};
const RSN_WHY = {
  side: "どちらの三角形にもふくまれる辺だから、共通な辺。",
  angleC: "どちらの三角形にもふくまれる角だから、共通な角。",
  vert: "2直線が交わってできる、向かい合った角だから、対頂角。",
  alt: "平行な2直線に1本の直線が交わるとき、2直線の間で、交わる直線をはさんで反対がわにある角どうしだから、錯角。",
  sq: "正方形の4つの辺は、どれも等しいから。",
  sqA: "正方形の4つの角は、どれも 90° で、等しいから。",
  tri: "正三角形の3つの辺は、どれも等しいから。",
  triA: "正三角形の3つの角は、どれも 60° で、等しいから。",
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
    name: "overlap", intro: `△${a}${b}${c} で、辺 ${a}${b} 上に点 ${d}、辺 ${a}${c} 上に点 ${e} がある（${d}、${e} は頂点とは異なる点）。点 ${b} と ${e}、点 ${c} と ${d} を、それぞれ結ぶ。`,
    given: V.given, T1: [a, b, e], T2: [a, c, d], facts: V.facts,
    commonAngle: { ans: `∠${b}${a}${c}`, wrongs: [`∠${a}${b}${e}`, `∠${a}${c}${d}`, `∠${a}${e}${b}`, `∠${a}${d}${c}`] },
  };
};
const introOf = (cfg) => `${cfg.intro}${cfg.given ? `${cfg.given} である。` : ""}`;

/** 四角形 abcd で、対角線 ac をひく。ab＝ad、∠bac＝∠dac（2組の辺とその間の角。ac は共通） */
const cfgKiteSAS = ([a, b, c, d]) => ({
  name: "kiteSAS", intro: `四角形 ${a}${b}${c}${d} で、対角線 ${a}${c} をひく。`, given: `${a}${b}＝${a}${d}、∠${b}${a}${c}＝∠${d}${a}${c}`,
  T1: [a, b, c], T2: [a, d, c],
  facts: [fact("S", 2, `${a}${b}＝${a}${d}`, "条件"), fact("A", 0, `∠${b}${a}${c}＝∠${d}${a}${c}`, "条件"), fact("S", 1, `${a}${c} は共通`, "", "side", `${a}${c}＝${a}${c}`)],
});
/** 四角形 abcd で、対角線 ac をひく。ab＝ad、∠acb＝∠acd（等しい角が、等しい2辺の間にない。合同とはいえない） */
const cfgKiteNone = ([a, b, c, d]) => ({
  name: "kiteNone", intro: `四角形 ${a}${b}${c}${d} で、対角線 ${a}${c} をひく。`, given: `${a}${b}＝${a}${d}、∠${a}${c}${b}＝∠${a}${c}${d}`,
  T1: [a, b, c], T2: [a, d, c],
  facts: [fact("S", 2, `${a}${b}＝${a}${d}`, "条件"), fact("A", 2, `∠${a}${c}${b}＝∠${a}${c}${d}`, "条件"), fact("S", 1, `${a}${c} は共通`, "", "side", `${a}${c}＝${a}${c}`)],
});
/** 正方形 n0n1n2n3 の、辺 bc 上に点 e、辺 cd 上に点 g（b、c、d は、k だけまわした頂点）。variant：1＝be＝cg、2＝∠bae＝∠cbg。△abe≡△bcg */
const cfgSquare = (N, k, [E, G, P], variant) => {
  const a = N[k % 4], b = N[(k + 1) % 4], c = N[(k + 2) % 4], d = N[(k + 3) % 4];
  const given = variant === 1 ? `${b}${E}＝${c}${G}` : `∠${b}${a}${E}＝∠${c}${b}${G}`;
  return {
    name: "square", intro: `正方形 ${N.join("")} の辺 ${b}${c} 上に点 ${E}、辺 ${c}${d} 上に点 ${G} がある（${E}、${G} は頂点とは異なる点）。${a}${E} と ${b}${G} の交点を ${P} とする。`, given,
    T1: [a, b, E], T2: [b, c, G],
    facts: [fact("S", 2, `${a}${b}＝${b}${c}`, "正方形の辺", "sq", `${a}${b}＝${b}${c}`), fact("A", 1, `∠${a}${b}${E}＝∠${b}${c}${G}`, "正方形の角（どちらも 90°）", "sqA", `∠${a}${b}${E}＝∠${b}${c}${G}`), variant === 1 ? fact("S", 0, `${b}${E}＝${c}${G}`, "条件") : fact("A", 0, `∠${b}${a}${E}＝∠${c}${b}${G}`, "条件")],
  };
};
/** 正三角形 n0n1n2 の、辺 bc 上に点 d、辺 ca 上に点 e（a、b、c は、k だけまわした頂点）。variant：1＝bd＝ce、2＝∠bad＝∠cbe。△abd≡△bce */
const cfgRegTri = (N, k, [D, E, P], variant) => {
  const a = N[k % 3], b = N[(k + 1) % 3], c = N[(k + 2) % 3];
  const given = variant === 1 ? `${b}${D}＝${c}${E}` : `∠${b}${a}${D}＝∠${c}${b}${E}`;
  return {
    name: "tri", intro: `正三角形 ${N.join("")} の辺 ${b}${c} 上に点 ${D}、辺 ${c}${a} 上に点 ${E} がある（${D}、${E} は頂点とは異なる点）。${a}${D} と ${b}${E} の交点を ${P} とする。`, given,
    T1: [a, b, D], T2: [b, c, E],
    facts: [fact("S", 2, `${a}${b}＝${b}${c}`, "正三角形の辺", "tri", `${a}${b}＝${b}${c}`), fact("A", 1, `∠${a}${b}${D}＝∠${b}${c}${E}`, "正三角形の角（どちらも 60°）", "triA", `∠${a}${b}${D}＝∠${b}${c}${E}`), variant === 1 ? fact("S", 0, `${b}${D}＝${c}${E}`, "条件") : fact("A", 0, `∠${b}${a}${D}＝∠${c}${b}${E}`, "条件")],
  };
};

// ── 図の設定の「型」：合同条件ごと（SSS＝①、SAS＝②、ASA＝③）に、いくつかの型をまぜる ─────────────────
//   どの問題も、合同条件の番号が毎回同じにならないよう、まず番号（合同条件）をえらび、つぎに、その番号の型をえらぶ
const FAMILY = {
  kite: (r) => cfgKite(perm4(r)), opp: (r) => cfgOpp(perm4(r)), isoMid: (r) => cfgIsoMid(perm4(r)),
  parEq: (r) => cfgParEq(perm4(r)), parEq2: (r) => cfgParEq2(perm4(r)), isoBis: (r) => cfgIsoBis(perm4(r)), kiteSAS: (r) => cfgKiteSAS(perm4(r)),
  ovl1: (r) => cfgOverlap(pick(r, L5), 1), crossSAS: (r) => cfgCross(cross5(r), ["OA", "OC"]),
  parPar: (r) => cfgParPar(perm4(r)), ovl2: (r) => cfgOverlap(pick(r, L5), 2), ovl3: (r) => cfgOverlap(pick(r, L5), 3),
  crossA: (r) => cfgCross(cross5(r), ["OA", "A0"]), crossB: (r) => cfgCross(cross5(r), ["OC", "A2"]),
  crossP1: (r) => cfgCross(cross5(r), ["PAR", "OA"]), crossP2: (r) => cfgCross(cross5(r), ["PAR", "OC"]), crossP3: (r) => cfgCross(cross5(r), ["PAR", "AC"]),
  sqr: (r) => { const L = pick(r, L7); return cfgSquare(L.slice(0, 4), r(0, 3), L.slice(4), pick(r, [1, 2])); },
  regt: (r) => { const L = pick(r, L6); return cfgRegTri(L.slice(0, 3), r(0, 2), L.slice(3), pick(r, [1, 2])); },
  // 合同とはいえない型
  noneAA: (r) => cfgCross(cross5(r), ["A0", "A2"]), noneOA: (r) => cfgCross(cross5(r), ["OA", "AC"]), noneOC: (r) => cfgCross(cross5(r), ["OC", "AC"]), kiteNone: (r) => cfgKiteNone(perm4(r)),
};
/** W＝{ SSS: 重み, SAS: 重み, ASA: 重み }、P＝{ SSS: [型の名前…], … } */
function byClass(r, W, P) {
  const keys = Object.keys(W), total = keys.reduce((acc, k) => acc + W[k], 0);
  let x = (r(0, 9999) / 10000) * total, cls = keys[keys.length - 1];
  for (const k of keys) { if (x < W[k]) { cls = k; break; } x -= W[k]; }
  return FAMILY[pick(r, P[cls])](r);
}

const NUM = { SSS: "①", SAS: "②", ASA: "③" };
const LEGEND = "（合同条件　① 3組の辺が、それぞれ等しい　② 2組の辺とその間の角が、それぞれ等しい　③ 1組の辺とその両端の角が、それぞれ等しい）";
const GRID_ASK = [
  "合同な三角形の組（記号 ≡ で表す）と、使う合同条件の番号の組として、いつでも正しいものは、次のうちどれか。",
  "三角形の頂点は、対応する順に書いてある。合同な三角形の組と、使う合同条件の番号が、どちらも、いつでも正しいものを選ぼう。",
  "合同な三角形を記号 ≡ で表したものと、そのとき使う合同条件の番号の組のうち、いつでも正しいものを選ぼう。",
];
/** 設定 cfg から、(合同な三角形の組) × (使う合同条件の番号) の 2×2 の4択をつくる。合同条件は番号にして、選択肢の長さをそろえる（正解だけ短い・長い、にならないように） */
/** 2×2 の4択で、誤答の組 bad を、候補 cands からえらぶ。正解の組 ok と bad のどちらが、(1) 問題文と文字がよく重なるか、(2) 4つの選択肢のなかで「ほかとよく似ている」か、が、
 *  毎回同じ向きにならないように（どちらかの組が、いつも目立たないように）、向きをランダムにきめて、それに合う bad をえらぶ。 */
function pickBadPair(r, q, ok, cands, nOk, nBad) {
  const gs = (x) => { const t = strip(x), g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
  const jc = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
  const Q = gs(q), ov = (x) => { const g = gs(x); let c = 0; for (const y of g) if (Q.has(y)) c++; return c / (g.size || 1); };
  const want = [r(0, 1) ? 1 : -1, r(0, 1) ? 1 : -1, r(0, 1) ? 1 : -1];
  const scored = cands.map((bad) => {
    const opts = [`${ok}、${nOk}`, `${ok}、${nBad}`, `${bad}、${nOk}`, `${bad}、${nBad}`], G = opts.map(gs);
    const jsum = G.map((g, j) => G.reduce((acc, h, k) => (k === j ? acc : acc + jc(g, h)), 0));
    const csum = opts.map((c, j) => opts.reduce((acc, d, k) => (k === j ? acc : acc + cdist(c, d)), 0));
    return { bad, t: [ov(ok) - ov(bad), jsum[0] + jsum[1] - jsum[2] - jsum[3], csum[2] + csum[3] - csum[0] - csum[1]] };
  });
  // t[0]＞0 … 正解の組のほうが、問題文と重なる。t[1]＞0 … 正解の組のほうが、ほかとよく似ている。t[2]＞0 … 同じく、字の近さ
  const fit = (z) => z.t.reduce((acc, v, i) => acc + (Math.abs(v) < 1e-9 || Math.sign(v) === want[i] ? 1 : 0), 0);
  const top = Math.max(...scored.map(fit));
  return pick(r, scored.filter((z) => fit(z) === top)).bad;
}
function gridQ(r, cfg, { note = NOTE } = {}) {
  const cls = clsOf(cfg.facts);
  if (!CONDS3.includes(cls)) throw new Error(`gridQ：合同条件の形でない ${cfg.name} ${cls}`);
  // 三角形の頂点の書きはじめ（3通り）と、左右の入れかえ（2通り）を、ランダムにかえる。どちらの三角形も、同じだけ頂点をまわして書くので、対応する順は、かわらない
  const k = r(0, 2), flip = r(0, 1) === 1, rot = (arr) => arr.map((_, i) => arr[(i + k) % 3]);
  const A1 = rot(cfg.T1), A2 = rot(cfg.T2), pair = (X, Y) => (flip ? `${tri(Y)}≡${tri(X)}` : `${tri(X)}≡${tri(Y)}`);
  const ok = pair(A1, A2);
  const q = `${introOf(cfg)}\n${note}\n${LEGEND}\n${pick(r, GRID_ASK)}`;
  const wc = pick(r, CONDS3.filter((c) => c !== cls));
  const bad = pickBadPair(r, q, ok, (cfg.wrongs || permsOf(cfg.T2)).map((T) => pair(A1, rot(T))), NUM[cls], NUM[wc]);
  const ans = `${ok}、${NUM[cls]}`;
  return {
    q,
    ans,
    choices: choices4(r, ans, [`${ok}、${NUM[wc]}`, `${bad}、${NUM[cls]}`, `${bad}、${NUM[wc]}`]),
    hint: `${tri(cfg.T1)} と ${tri(cfg.T2)} で、等しい辺や角を3つ見つけられるかな？ 3つがそろったら、3つの合同条件のどれかの形になっているかな？`,
    steps: [
      `${tri(cfg.T1)} と ${tri(cfg.T2)} で、${factLine(cfg.facts)}。`,
      `${NUM[cls]}（${COND[cls]}）が、それぞれ等しいから　${ok}。`,
      `頂点は、対応する順に書く（${A1.map((v, i) => `${v} に ${A2[i]}`).join("、")}）。答えは「${ans}」。`,
    ],
  };
}

/** 設定 cfg の、問題文に書いていない等しい組について、「どうして等しいといえるか」の4択。
 *  誤答の理由は、同じテンプレートのほかの問題で「正解」になる理由から、同じ出かたでえらぶ（ある理由が、正解のときにしか出ない・誤答のときにしか出ない、ということがないように）。
 *  fams＝そのテンプレートがえらぶ図の型の名前の一覧 */
function reasonQ(r, cfg, fams) {
  const f = pick(r, cfg.facts.filter((x) => x.rsn)), ans = RSN[f.rsn];
  const drawn = [];
  for (let i = 0; i < 40; i++) { const hs = FAMILY[pick(r, fams)](r).facts.filter((x) => x.rsn); if (hs.length) drawn.push(RSN[pick(r, hs).rsn]); }
  const wrongs = pickBal(r, ans, () => {
    const set = new Set(); let guard = 0;
    while (set.size < 3 && guard++ < 60) { const w = pick(r, drawn); if (w !== ans) set.add(w); }
    if (set.size < 3) for (const v of shuffle(r, Object.values(RSN))) { if (set.size >= 3) break; if (v !== ans) set.add(v); }
    return [...set];
  });
  return {
    q: `${introOf(cfg)}\n${tri(cfg.T1)} と ${tri(cfg.T2)} で、${pick(r, [`${f.ask} といえる理由は、次のうちどれか。`, `${f.ask} といえるのは、どうしてか。次のうちから選ぼう。`])}`,
    ans,
    choices: choices4(r, ans, wrongs),
    hint: "この等しい組は、問題の条件に書いてあるかな？ 書いていないとき、2つの三角形の形のうえから等しいといえる理由には、どんなものがあったかな？",
    steps: [`「${f.ask}」は、問題の条件に書いていない。`, RSN_WHY[f.rsn], `答えは「${ans}」。`],
  };
}

// ── 「あと1つ」の問題：いま等しいとわかっていること（known）に、1つ足すと、合同条件の形になるもの ─────────────────
//   cands の各文は fact（k＝S/A、i＝番号、text＝文）。known と cand をあわせて judge() にかけ、SSS／SAS／ASA ＝ 正解、NONE ＝ 誤答の候補。
//   AAS（3つの合同条件の形ではないが、合同にはなるもの）は、正解にも誤答にも使わない。irrel＝足しても合同条件の形にならない、ほかの文（S＝辺、A＝角どうし、A90＝直角、P＝平行）。
//   誤答は、できるだけ、正解と同じ形の文だけにする（形で、正解を当てられないように）。同じ形の誤答が足りないときだけ、ちがう形の文で補う。
const NOTE_USE = "（共通な辺（角）・対頂角・平行線の錯角は、すでに使ってよい。）";
function pickMix(r, ans, same, other) {
  return pickBal(r, ans, () => (same.length >= 3 ? shuffle(r, same).slice(0, 3) : [...shuffle(r, same), ...shuffle(r, other)].slice(0, 3)));
}
function extraQ(r, { stem, T1, T2, known, cands, irrel }) {
  const cls = (c) => clsOf([...known, c]);
  const good = cands.filter((c) => CONDS3.includes(cls(c))), bad = cands.filter((c) => cls(c) === "NONE");
  const g = pick(r, good), form = g.k, ans = g.text, goodTexts = new Set(good.map((c) => c.text));
  const clean = (arr) => [...new Set(arr)].filter((x) => !goodTexts.has(x));
  const sameWr = clean(form === "S" ? [...bad.filter((c) => c.k === "S").map((c) => c.text), ...irrel.S] : [...bad.filter((c) => c.k === "A").map((c) => c.text), ...irrel.A]);
  const otherWr = clean(form === "S" ? [...bad.filter((c) => c.k === "A").map((c) => c.text), ...irrel.A, ...irrel.A90, ...irrel.P] : [...bad.filter((c) => c.k === "S").map((c) => c.text), ...irrel.S, ...irrel.A90, ...irrel.P]);
  const wrongs = pickMix(r, ans, sameWr, otherWr);
  return {
    q: `${stem}\n${NOTE_USE}`,
    ans,
    choices: choices4(r, ans, wrongs),
    hint: "いま等しいとわかっている辺や角を、書き出してみよう。3つの合同条件のどれかの形にするには、あと何が足りないかな？",
    steps: [
      `${tri(T1)} と ${tri(T2)} で、いま等しいとわかっているのは　${factLine(known)}。`,
      `あと ${ans} がわかれば、${COND[cls(g)]}が、それぞれ等しくなって、${tri(T1)}≡${tri(T2)} がいえる。`,
      `ほかの選択肢をたしても、3つの合同条件のどれの形にもならない。答えは「${ans}」。`,
    ],
  };
}
const ASK_ONE = (r, T1, T2) => pick(r, [
  `${tri(T1)}≡${tri(T2)} といえるためには、あと1つ、次のどれがわかればよいか。`,
  `${tri(T1)}≡${tri(T2)} が、いつでもいえるようにするには、次のどれを条件にくわえればよいか。`,
  `${tri(T1)}≡${tri(T2)} を示すとき、あと1つわかれば、3つの合同条件のどれかの形になるのは、次のうちどれか。`,
]);
/** 四角形 abcd で、対角線 ac。三角形 abc と adc（kind：S2＝ab＝ad、A2＝∠acb＝∠acd、A0＝∠bac＝∠dac、S0＝cb＝cd）、または ab∥dc の三角形 abc と cda（PAR） */
function diagExtra(r, kind) {
  const [a, b, c, d] = perm4(r);
  if (kind === "PAR") {
    const T1 = [a, b, c], T2 = [c, d, a], t = (k, i, text, src) => fact(k, i, text, src);
    const known = [t("A", 0, `∠${b}${a}${c}＝∠${d}${c}${a}`, "平行線の錯角"), t("S", 1, `${a}${c} は共通`, "")];
    const cands = [t("S", 2, `${a}${b}＝${c}${d}`), t("A", 2, `∠${a}${c}${b}＝∠${c}${a}${d}`), t("S", 0, `${b}${c}＝${d}${a}`)];
    return extraQ(r, {
      stem: `四角形 ${a}${b}${c}${d} で、${a}${b}∥${d}${c} である。対角線 ${a}${c} をひく。${ASK_ONE(r, T1, T2)}`, T1, T2, known, cands,
      irrel: { S: [`${a}${b}＝${b}${c}`, `${a}${c}＝${b}${d}`, `${a}${d}＝${d}${c}`], A: [`∠${b}${a}${c}＝∠${b}${c}${a}`, `∠${d}${a}${c}＝∠${d}${c}${a}`, `∠${a}${c}${b}＝∠${a}${c}${d}`, `∠${b}${a}${c}＝∠${d}${a}${c}`], A90: [`∠${a}${b}${c}＝90°`, `∠${b}${a}${d}＝90°`], P: [] },
    });
  }
  const T1 = [a, b, c], T2 = [a, d, c], F = {
    S0: fact("S", 0, `${b}${c}＝${d}${c}`), S2: fact("S", 2, `${a}${b}＝${a}${d}`),
    A0: fact("A", 0, `∠${b}${a}${c}＝∠${d}${a}${c}`), A2: fact("A", 2, `∠${a}${c}${b}＝∠${a}${c}${d}`),
  };
  const known = [{ ...F[kind], src: "条件" }, fact("S", 1, `${a}${c} は共通`, "")], cands = Object.keys(F).filter((k) => k !== kind).map((k) => F[k]);
  return extraQ(r, {
    stem: `四角形 ${a}${b}${c}${d} で、${F[kind].text} である。対角線 ${a}${c} をひく。${ASK_ONE(r, T1, T2)}`, T1, T2, known, cands,
    irrel: {
      S: [`${b}${c}＝${a}${d}`, `${a}${c}＝${b}${d}`, `${a}${b}＝${b}${c}`, `${c}${d}＝${a}${d}`, `${a}${b}＝${c}${d}`],
      A: [`∠${b}${c}${d}＝∠${b}${a}${d}`, `∠${b}${a}${c}＝∠${b}${c}${a}`, `∠${d}${a}${c}＝∠${d}${c}${a}`, `∠${a}${b}${c}＝∠${b}${c}${d}`, `∠${a}${d}${c}＝∠${a}${c}${d}`],
      A90: [`∠${b}${a}${d}＝90°`, `∠${a}${b}${c}＝90°`],
      P: [`${a}${b}∥${d}${c}`, `${a}${d}∥${b}${c}`],
    },
  });
}
/** 線分 ad と bc が点 o で交わる。△aob と △doc（kind：PAR＝ab∥cd、S2＝ao＝do、A0＝∠oab＝∠odc、S0＝bo＝co） */
function crossExtra(r, kind) {
  const [a, b, c, d] = perm4(r), o = "O", T1 = [a, o, b], T2 = [d, o, c];
  const vert = fact("A", 1, `∠${a}${o}${b}＝∠${d}${o}${c}`, "対頂角");
  const F = { S0: fact("S", 0, `${b}${o}＝${c}${o}`), S1: fact("S", 1, `${a}${b}＝${d}${c}`), S2: fact("S", 2, `${a}${o}＝${d}${o}`), A0: fact("A", 0, `∠${o}${a}${b}＝∠${o}${d}${c}`), A2: fact("A", 2, `∠${o}${b}${a}＝∠${o}${c}${d}`) };
  let given, known, cands;
  if (kind === "PAR") {
    given = `${a}${b}∥${c}${d}`;
    known = [{ ...F.A0, src: "平行線の錯角" }, { ...F.A2, src: "平行線の錯角" }, vert];
    cands = [F.S0, F.S1, F.S2, F.A0, F.A2, vert];
  } else {
    given = F[kind].text;
    known = [{ ...F[kind], src: "条件" }, vert];
    cands = ["S0", "S1", "S2", "A0", "A2"].filter((k) => k !== kind).map((k) => F[k]);
  }
  return extraQ(r, {
    stem: `線分 ${a}${d} と ${b}${c} が点 ${o} で交わっている（${o} は、${a}${d} の間にも ${b}${c} の間にもある）。${given} である。${ASK_ONE(r, T1, T2)}`, T1, T2, known, cands,
    irrel: { S: [`${a}${o}＝${b}${o}`, `${a}${d}＝${b}${c}`, `${b}${o}＝${d}${o}`, `${a}${o}＝${c}${o}`], A: [`∠${o}${a}${b}＝∠${o}${b}${a}`, `∠${o}${d}${c}＝∠${o}${c}${d}`, `∠${o}${a}${b}＝∠${o}${c}${d}`, `∠${o}${b}${a}＝∠${o}${d}${c}`], A90: [`∠${a}${o}${b}＝90°`], P: [] },
  });
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
        t("10d01a", (r) => gridQ(r, byClass(r, { SSS: 34, SAS: 33, ASA: 33 }, { SSS: ["isoMid", "isoMid", "kite"], SAS: ["isoBis", "isoBis", "ovl1"], ASA: ["ovl2", "ovl3"] }))),
        // 10d01b 演習（1）問題文に書いていない等しい組（AD は共通 など）の理由
        t("10d01b", (r) => { const fams = ["isoMid", "kite", "opp", "ovl1", "ovl2", "ovl3", "crossSAS", "crossA", "crossB", "crossP1", "parEq", "parPar", "sqr", "sqr", "regt", "regt"]; return reasonQ(r, FAMILY[pick(r, fams)](r), fams); }),
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
        t("10d02a", (r) => gridQ(r, byClass(r, { SSS: 25, SAS: 35, ASA: 40 }, { SSS: ["opp", "kite"], SAS: ["parEq", "parEq", "parEq2"], ASA: ["parPar", "crossP1", "crossP2", "crossP3"] }))),
        // 10d02b 演習（2）平行線の錯角・共通な辺の理由
        t("10d02b", (r) => { const fams = ["parEq", "parPar", "crossP1", "crossP3", "kite", "opp", "isoBis", "ovl1", "ovl2", "ovl3", "crossSAS", "sqr", "sqr", "regt", "regt"]; return reasonQ(r, FAMILY[pick(r, fams)](r), fams); }),
        // 10d03a 演習（3）線分 AB と CD が点 O で交わり、…（1組の辺とその両端の角。対頂角）
        t("10d03a", (r) => gridQ(r, byClass(r, { SSS: 20, SAS: 40, ASA: 40 }, { SSS: ["opp", "kite"], SAS: ["crossSAS", "crossSAS", "crossSAS", "kiteSAS"], ASA: ["crossA", "crossB", "crossP1", "crossP2", "crossP3"] }))),
        // 10d03b 演習（3）対頂角の理由
        t("10d03b", (r) => { const fams = ["crossSAS", "crossA", "crossB", "crossP1", "crossP2", "parPar", "ovl2", "ovl3", "kite", "opp", "isoBis", "sqr", "sqr", "regt", "regt"]; return reasonQ(r, FAMILY[pick(r, fams)](r), fams); }),
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
        // 10d05 演習（5）AB＝AD の四角形 ABCD、対角線 AC。△ABC≡△ADC といえるために、あと1つ（2通りのうち1つを選ぶ4択に直した）。等しい条件を、辺・角にかえた型と、AB∥DC の型もまぜる
        t("10d05", (r) => diagExtra(r, pick(r, ["S2", "S2", "A2", "A0", "S0", "PAR"]))),
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
        t("10q02", (r) => gridQ(r, byClass(r, { SSS: 38, SAS: 31, ASA: 31 }, { SSS: ["opp", "opp", "kite", "isoMid"], SAS: ["isoBis", "ovl1", "crossSAS", "kiteSAS"], ASA: ["crossA", "crossB", "ovl2", "ovl3"] }))),
        // 10q03 小テスト（3）AD∥BC、AD＝CB、対角線 BD → △ADB≡△CBD（2組の辺とその間の角）
        t("10q03", (r) => gridQ(r, byClass(r, { SSS: 31, SAS: 38, ASA: 31 }, { SSS: ["opp", "isoMid"], SAS: ["parEq2", "parEq2", "parEq", "isoBis", "crossSAS"], ASA: ["parPar", "crossP1", "crossP3", "ovl3"] }))),
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
          // 「いえる／いえない」と理由の 4択。誤答も、それだけで読めば自己矛盾しない文にする（「いえる」＋「間の角ではない」のような矛盾で、消せないように）。
          //   「いえる」と「いえない」が、2つずつ。どの誤答も、問題にない（まちがった）ことを理由にしている。
          const between = r(0, 1) === 1, x = between ? v : pick(r, sides), X = `∠${T1[x]}`, bet = `${s1} と ${s2} の間の角`;
          const OKY = `いえる。${X} は ${bet}で、2組の辺とその間の角が、それぞれ等しいから。`, OKN = `いえない。${X} は ${bet}ではなく、2組の辺とその間の角が、それぞれ等しいとはいえないから。`;
          const YES_W = [`いえる。3組の辺が、それぞれ等しいから。`, `いえる。1組の辺とその両端の角が、それぞれ等しいから。`, `いえる。3組の辺が、それぞれ等しく、3つの合同条件のどれかにあてはまるから。`];
          const NO_W = [`いえない。等しい辺が1組しかないから。`, `いえない。等しい角が1組もないから。`, `いえない。等しい辺が1組しかなくて、2組の辺とその間の角が、そろっていないから。`, `いえない。等しい角が1組もなくて、2組の辺とその間の角が、そろっていないから。`];
          const ans = between ? OKY : OKN;
          const wrongs = pickBal(r, ans, () => (between ? [pick(r, YES_W), ...shuffle(r, [...NO_W, OKN]).slice(0, 2)] : [pick(r, NO_W), ...shuffle(r, [...YES_W, `いえる。等しい辺が2組、等しい角が1組あって、2組の辺とその間の角と同じだから。`, OKY]).slice(0, 2)]));
          return {
            q: `${tri(T1)} と ${tri(T2)} で、${s1}＝${e1}、${s2}＝${e2}、∠${T1[x]}＝∠${T2[x]} であるとき、${tri(T1)}≡${tri(T2)} といえるか。理由もふくめて、正しいものを選ぼう。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "2組の辺とその間の角が等しければ合同になるのだったね。「間の角」とは、どの角のことだったかな？ 等しい角は、等しい2辺のどことどこの間にあるかな？",
            steps: [`等しい2辺は ${s1} と ${s2}。この2辺の間の角は ∠${T1[v]}。`, between ? `等しい角 ∠${T1[x]} は、2辺の間の角。2組の辺とその間の角が、それぞれ等しいから、合同といえる。` : `等しい角 ∠${T1[x]} は、2辺の間の角 ∠${T1[v]} ではない。2組の辺と、その間にない角が等しいだけでは、合同条件にあてはまらず、合同とはいえない。`, `答えは「${ans}」。`],
          };
        }),
        // 10d06b 演習（6）条件から、合同といえるか（といえないときもある）。合同条件ごと（①②③と、合同とはいえない）に、型をえらぶ
        t("10d06b", (r) => {
          const want = pick(r, ["SSS", "SAS", "ASA", "NONE"]);
          const P6 = {
            SSS: ["kite", "opp", "isoMid"], SAS: ["crossSAS", "kiteSAS", "parEq", "isoBis", "ovl1"], ASA: ["crossA", "crossB", "crossP1", "parPar", "ovl2"],
            NONE: ["noneAA", "noneOA", "noneOC", "kiteNone"],
          };
          const cfg = FAMILY[pick(r, P6[want])](r), cls = clsOf(cfg.facts), ans = COND[cls];
          return {
            q: `${introOf(cfg)}\n${tri(cfg.T1)}≡${tri(cfg.T2)} といえるか。いえるなら、使う合同条件を選ぼう。（共通な辺（角）・対頂角・平行線の錯角は、使ってよい。それ以外の性質は使わない。）`,
            ans,
            choices: choices4(r, ans, Object.values(COND).filter((x) => x !== ans)),
            hint: "条件に書いてある、等しい辺や角を、書き出してみよう。形のうえから、ほかに等しいものは見つかるかな？ 3つそろったら、3つの合同条件のどれかの形になっているかな？",
            steps: [
              `${tri(cfg.T1)} と ${tri(cfg.T2)} で、${factLine(cfg.facts)}。`,
              cls === "NONE" ? (cfg.facts.some((f) => f.k === "S") ? `等しい辺が2組あるが、等しい角は、その2辺の間の角ではない。` : `等しいのは3つの角だけで、辺が1組もない。`) : `${COND[cls]}が、それぞれ等しい。`,
              cls === "NONE" ? `どの合同条件にもあてはまらないから、合同とはいえない。答えは「${ans}」。` : `だから　${tri(cfg.T1)}≡${tri(cfg.T2)}。答えは「${ans}」。`,
            ],
          };
        }),
        // 10w03 ワークシート 考えよう：線分 AD と BC が点 O で交わり、AB∥CD。△AOB≡△DOC といえるために、あと1つ（AB∥CD のかわりに、辺・角がわかっている型もまぜる）
        t("10w03", (r) => crossExtra(r, pick(r, ["PAR", "PAR", "S2", "A0", "S0"]))),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 10d07a 演習（7）①正方形 ABCD の辺 BC 上に E、辺 CD 上に F、BE＝CF。△ABE≡△BCF（2組の辺とその間の角）。辺をまわした型と、BE＝CF のかわりに ∠BAE＝∠CBF の型（1組の辺とその両端の角）もまぜる
        t("10d07a", (r) => {
          const L = pick(r, L7);
          return gridQ(r, cfgSquare(L.slice(0, 4), r(0, 3), L.slice(4), pick(r, [1, 2])), { note: "（合同条件を考えるときは、問題の条件と、正方形の辺・角の性質だけを使う。）" });
        }),
        // 10d07b 演習（7）②∠BAE＝x° のとき ∠ABG・∠BGC・∠APB（交点 P）の大きさ（または ∠ABG から ∠BAE）。合同から ∠CBG＝∠BAE
        t("10d07b", (r) => {
          const [A, B, C, D, E, G, P] = pick(r, L7);
          const m = r(12, 43), ask = pick(r, ["ABG", "BGC", "BAE", "APB"]);
          const head = `正方形 ${A}${B}${C}${D} の辺 ${B}${C} 上に点 ${E}、辺 ${C}${D} 上に点 ${G} を、${B}${E}＝${C}${G} となるようにとる（${E}、${G} は頂点とは異なる点）。` + (ask === "APB" ? `${A}${E} と ${B}${G} の交点を ${P} とする。` : "");
          const common = `△${A}${B}${E} と △${B}${C}${G} で、${A}${B}＝${B}${C}（正方形の辺）、∠${A}${B}${E}＝∠${B}${C}${G}＝90°、${B}${E}＝${C}${G}（条件）。2組の辺とその間の角が、それぞれ等しいから　△${A}${B}${E}≡△${B}${C}${G}。`;
          let q, steps, ans;
          if (ask === "BAE") {
            const y = 90 - m; ans = m;
            q = `${head}∠${A}${B}${G}＝${y}° のとき、∠${B}${A}${E} の大きさは？`;
            steps = [common, `対応する角は等しいから　∠${B}${A}${E}＝∠${C}${B}${G}。`, `∠${C}${B}${G}＝∠${A}${B}${C}−∠${A}${B}${G}＝90°−${y}°＝${m}° だから、∠${B}${A}${E}＝${m}°。`];
          } else if (ask === "APB") {
            ans = 90;
            q = `${head}∠${B}${A}${E}＝${m}° のとき、∠${A}${P}${B} の大きさは？`;
            steps = [common, `対応する角は等しいから　∠${C}${B}${G}＝∠${B}${A}${E}＝${m}°。だから　∠${A}${B}${P}＝∠${A}${B}${C}−∠${C}${B}${G}＝90°−${m}°。`, `△${A}${B}${P} の内角の和から　∠${A}${P}${B}＝180°−∠${B}${A}${P}−∠${A}${B}${P}＝180°−${m}°−(90°−${m}°)＝${ans}°`];
          } else {
            ans = 90 - m;
            q = `${head}∠${B}${A}${E}＝${m}° のとき、∠${ask === "ABG" ? `${A}${B}${G}` : `${B}${G}${C}`} の大きさは？`;
            steps = [common, `対応する角は等しいから　∠${C}${B}${G}＝∠${B}${A}${E}＝${m}°。`, ask === "ABG" ? `∠${A}${B}${G}＝∠${A}${B}${C}−∠${C}${B}${G}＝90°−${m}°＝${ans}°` : `△${B}${C}${G} の内角の和から　∠${B}${G}${C}＝180°−90°−${m}°＝${ans}°`];
          }
          return { q, ans, unit: "度", hint: "どの2つの三角形が合同になるかな？ 合同な図形では、対応する角について、何がいえたかな？", steps };
        }),
        // 10d08a 演習（8）①正三角形 ABC の辺 BC 上に D、辺 CA 上に E、BD＝CE。△ABD と合同な三角形と合同条件。辺をまわした型と、BD＝CE のかわりに ∠BAD＝∠CBE の型もまぜる
        t("10d08a", (r) => {
          const L = pick(r, L6);
          return gridQ(r, cfgRegTri(L.slice(0, 3), r(0, 2), L.slice(3), pick(r, [1, 2])), { note: "（合同条件を考えるときは、問題の条件と、正三角形の辺・角の性質だけを使う。）" });
        }),
        // 10d08b 演習（8）②∠BAD＝x° のとき ∠ABE・∠BEC・∠APE（交点 P）の大きさ。合同から ∠CBE＝∠BAD
        t("10d08b", (r) => {
          const [A, B, C, D, E, P] = pick(r, L6);
          const x = r(10, 48), ask = pick(r, ["ABE", "BEC", "APE"]);
          const head = `正三角形 ${A}${B}${C} の辺 ${B}${C} 上に点 ${D}、辺 ${C}${A} 上に点 ${E} を、${B}${D}＝${C}${E} となるようにとる（${D}、${E} は頂点とは異なる点）。` + (ask === "APE" ? `${A}${D} と ${B}${E} の交点を ${P} とする。` : "");
          const common = `△${A}${B}${D} と △${B}${C}${E} で、${A}${B}＝${B}${C}（正三角形の辺）、∠${A}${B}${D}＝∠${B}${C}${E}＝60°、${B}${D}＝${C}${E}（条件）。2組の辺とその間の角が、それぞれ等しいから　△${A}${B}${D}≡△${B}${C}${E}。`;
          const ans = ask === "ABE" ? 60 - x : ask === "BEC" ? 120 - x : 60;
          return {
            q: `${head}∠${B}${A}${D}＝${x}° のとき、∠${ask === "ABE" ? `${A}${B}${E}` : ask === "BEC" ? `${B}${E}${C}` : `${A}${P}${E}`} の大きさは？`,
            ans, unit: "度",
            hint: "どの2つの三角形が合同になるかな？ 合同な図形では、対応する角について、何がいえたかな？",
            steps: [common, `対応する角は等しいから　∠${C}${B}${E}＝∠${B}${A}${D}＝${x}°。`, ask === "ABE" ? `∠${A}${B}${E}＝∠${A}${B}${C}−∠${C}${B}${E}＝60°−${x}°＝${ans}°` : ask === "BEC" ? `△${B}${C}${E} の内角の和から　∠${B}${E}${C}＝180°−60°−${x}°＝${ans}°` : `∠${A}${B}${P}＝∠${A}${B}${C}−∠${C}${B}${E}＝60°−${x}°。△${A}${B}${P} の外角だから　∠${A}${P}${E}＝∠${B}${A}${P}＋∠${A}${B}${P}＝${x}°＋(60°−${x}°)＝${ans}°`],
          };
        }),
        // 10q04a チャレンジ 正n角形の、となり合う3つの頂点でつくる三角形の合同（△ABC≡△BCD）。対応する辺、対応する角、または、使う合同条件
        t("10q04a", (r) => {
          const n = r(5, 8), V = "ABCDEFGH".slice(0, n), i = r(0, n - 4), [w, x, y, z] = [V[i], V[i + 1], V[i + 2], V[i + 3]], nm = `正${"五六七八"[n - 5]}角形`;
          const u = V[(i + 4) % n], srt = (p1, p2) => [p1, p2].sort().join("");
          const kind = r(0, 5);
          if (kind === 0) {
            const ans = COND.SAS;
            return {
              q: `${nm} ${V} で、対角線 ${w}${y}、${x}${z} をひく。△${w}${x}${y}≡△${x}${y}${z} を示すとき、使う合同条件は、次のうちどれか。（使ってよいのは、正多角形の辺・角の性質だけとする。）`,
              ans,
              choices: choices4(r, ans, Object.values(COND).filter((c) => c !== ans)),
              hint: "正多角形では、辺の長さや、内角の大きさについて、何がいえたかな？ 2つの三角形で、等しいところを書き出してみよう。",
              steps: [`${nm}だから、すべての辺が等しく　${w}${x}＝${x}${y}、${x}${y}＝${y}${z}。すべての内角も等しく　∠${w}${x}${y}＝∠${x}${y}${z}。`, `∠${w}${x}${y}、∠${x}${y}${z} は、等しい2辺の間の角。`, `2組の辺とその間の角が、それぞれ等しいから　△${w}${x}${y}≡△${x}${y}${z}。答えは「${ans}」。`],
            };
          }
          const head = `${nm} ${V} で、対角線 ${w}${y}、${x}${z} をひくと、△${w}${x}${y}≡△${x}${y}${z} となる。このとき、`;
          const map1 = { [w]: x, [x]: y, [y]: z }, map2 = { [x]: w, [y]: x, [z]: y };
          if (kind <= 2) {
            // 角 → 対応する角（角の名前は、両はしの文字をアルファベット順にそろえて書く）
            const ang = (p1, v, p2) => { const [a1, a2] = [p1, p2].sort(); return `∠${a1}${v}${a2}`; };
            const A1 = [ang(x, w, y), ang(w, x, y), ang(w, y, x)], A2 = [ang(y, x, z), ang(x, y, z), ang(x, z, y)];   // △wxy の w・x・y の角、△xyz の x・y・z の角
            const k = r(0, 2), fromFirst = r(0, 1) === 0, ask = fromFirst ? A1[k] : A2[k], ans = fromFirst ? A2[k] : A1[k];
            const pool = [...A1, ...A2, ang(w, y, z), ang(w, x, z)].filter((a) => a !== ask && a !== ans);
            const wrongs = pickBal(r, ans, () => shuffle(r, pool).slice(0, 3));
            const vOf = (a) => a[2];   // 角の頂点
            const from = fromFirst ? [w, x, y] : [x, y, z], to = fromFirst ? [x, y, z] : [w, x, y];
            return {
              q: `${head}${ask} に対応する角は、次のうちどれか。`,
              ans,
              choices: choices4(r, ans, wrongs),
              hint: `合同な三角形は、頂点を対応する順に書くのだったね。△${w}${x}${y} の ${w}、${x}、${y} には、△${x}${y}${z} のどの頂点が対応するかな？`,
              steps: [`△${w}${x}${y}≡△${x}${y}${z} だから、対応する頂点は　${w} と ${x}、${x} と ${y}、${y} と ${z}。`, `${ask} の頂点 ${vOf(ask)} に対応する頂点は ${to[from.indexOf(vOf(ask))]}。両はしの文字も、対応する頂点にかえて、${ans}。`, `答えは「${ans}」。`],
            };
          }
          // 辺 → 対応する辺（聞く辺は、片方の三角形にしかない辺。△wxy にしかない辺は wx・wy、△xyz にしかない辺は yz・xz）
          const ask = pick(r, [{ s: `${w}${x}`, a: `${x}${y}`, t: "1" }, { s: `${w}${y}`, a: `${x}${z}`, t: "1" }, { s: `${y}${z}`, a: `${x}${y}`, t: "2" }, { s: `${x}${z}`, a: `${w}${y}`, t: "2" }]);
          // 誤答の候補：ほかの辺（三角形の辺と、対角線 wz）と、三角形の外にある多角形の辺（ほかの頂点 u をふくむもの）
          const pool = [`${w}${x}`, `${x}${y}`, `${w}${y}`, `${y}${z}`, `${x}${z}`, `${w}${z}`, srt(z, u), srt(u, w)].filter((e) => e !== ask.s && e !== ask.a);
          const ans = `辺 ${ask.a}`;
          const all = pickBal(r, ans, () => shuffle(r, pool).slice(0, 3).map((e) => `辺 ${e}`)).map((e) => e.slice(2));
          return {
            q: `${head}辺 ${ask.s} に対応する辺は、次のうちどれか。`,
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
