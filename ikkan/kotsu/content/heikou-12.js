// ============================================================
// heikou-12.js — 平行と合同 第12時「証明のしくみを読み取ろう」（証明の各行の根拠・空欄）
//   ikkan の演習プリント（heikou-12.dr.1〜6）・小テスト（heikou-12.qz.1〜3）と、ワークシートの例題・考えようを、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「12」＋ d（演習）／q（小テスト）／w（ワークシートの K ブロック。2＝例題、3＝考えよう）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：12d02c ＝ heikou-12.dr.2 の「いくつあるか」
//   図は出せないので、点の名前・位置関係（線分が点 O で交わる、辺上の点、正三角形が頂点を共有する、中点を通る直線への垂線）を、問題文で言い切る。
//   証明は、行ごとに文字列でもち（証明のデータ：proof ～）、空欄を1か所だけ □ にして出す。空欄の答えと誤答は、座標で確かめてある（誤答は、図によっては成り立たない）。
//   「根拠を、すべて選ぼう」は、ア〜エからしてよい（いけない）ものを、すべて選んだ組を選ぶ4択・いくつあるかを数える問題に、「まちがいを指摘して直そう」は、まちがいを正しく言いあてた説明を選ぶ4択に、
//   「ばらばらの証明を、ならべよう」は、最初（最後）に書く行を選ぶ問題に直した。証明を全部書かせる問題はない。
// ============================================================
import { t as t0, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

const strip = (x) => String(x).replace(/[\s$]/g, "");
const cdist = (a, b) => { const m = new Map(); for (const c of strip(a)) m.set(c, (m.get(c) || 0) + 1); for (const c of strip(b)) m.set(c, (m.get(c) || 0) - 1); let d = 0; for (const v of m.values()) d += Math.abs(v); return d; };
const gram2 = (x) => { const t = strip(x), g = new Set(); for (let i = 0; i < t.length - 1; i++) g.add(t.slice(i, i + 2)); return g; };
const jacc = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
/** 正解 ans と誤答 ws（3つ）で、ans の「長さの順位」「字の近さの順位」「文字の並びの重なりの順位」（と、q があれば「問題文との重なりの順位」）を調べる。順位 0＝いちばん短い／いちばんほかに近い／いちばん問題文と重なる。同点なら範囲 [最小, 最大] */
function rankOf(ans, ws, q) {
  const all = [ans, ...ws], len = all.map((x) => strip(x).length);
  const lo = ws.filter((x) => strip(x).length < len[0]).length, ties = ws.filter((x) => strip(x).length === len[0]).length;
  const cs = all.map((c, j) => all.reduce((acc, d, k) => (k === j ? acc : acc + cdist(c, d)), 0));
  const clo = cs.slice(1).filter((v) => v < cs[0]).length, cties = cs.slice(1).filter((v) => v === cs[0]).length;
  const G = all.map(gram2), js = G.map((g, j) => G.reduce((acc, h, k) => (k === j ? acc : acc + jacc(g, h)), 0));
  const jlo = js.slice(1).filter((v) => v > js[0] + 1e-9).length, jties = js.slice(1).filter((v) => Math.abs(v - js[0]) <= 1e-9).length;
  const out = [[lo, lo + ties], [clo, clo + cties], [jlo, jlo + jties]];
  if (q) {
    const Q = gram2(q), ov = G.map((g) => { let c = 0; for (const y of g) if (Q.has(y)) c++; return c / (g.size || 1); });
    const olo = ov.slice(1).filter((v) => v > ov[0] + 1e-9).length, oties = ov.slice(1).filter((v) => Math.abs(v - ov[0]) <= 1e-9).length;
    out.push([olo, olo + oties]);
  }
  return out;
}
const RANK_W = [3, 1, 1, 1];   // 長さの順位を、いちばん優先する
/** 誤答の組をつくる関数 make（3つの配列を返す）を何回か試して、正解の「長さ」「字の近さ」「文字の重なり」（と、q があれば「問題文との重なり」）の順位が、
 *  どれも（ランダムにえらんだ）順位になる組をえらぶ（長さや、ほかの選択肢との似かた、問題文との似かたで、正解を当てられないように）。全部は合わないときは、いちばん多く合う組のなかから、ランダムに */
function pickBal(r, ans, make, tries = 200, q = "") {
  const T = [r(0, 3), r(0, 3), r(0, 3), r(0, 3)];
  let best = [], bestScore = -1;
  for (let i = 0; i < tries; i++) {
    const w = make();
    if (!w || w.length < 3) continue;
    const sc = rankOf(ans, w, q).reduce((acc, k, m) => acc + (T[m] >= k[0] && T[m] <= k[1] ? RANK_W[m] : 0), 0);
    if (sc > bestScore) { best = [w]; bestScore = sc; } else if (sc === bestScore) best.push(w);
  }
  return best.length ? pick(r, best) : null;
}
const pickWrongs = (r, ans, pool, k = 3, q = "") => pickBal(r, ans, () => shuffle(r, pool).slice(0, k), 200, q);

// ── 証明の材料 ────────────────────────────────────────────────
//   空欄 B(id, 答え, 誤答の候補, 種類, なぜそうなるか)。種類：assume（仮定より…）／word（対頂角・錯角・共通 など、ことば）／cond（合同条件）／prop（合同な図形の性質）／corr（対応する辺・角）／sum（内角の和）
const B = (id, ans, wr, kind, why) => ({ id, ans, wr, kind, why });
const COND3 = ["3組の辺", "2組の辺とその間の角", "1組の辺とその両端の角"];
const condB = (id, ans, why) => B(id, ans, [...COND3.filter((c) => c !== ans), "3組の角", "2組の辺と、その間にない角", "1組の辺と、その片方の端の角"], "cond", why);   // 誤答の言いかたは、長さがいろいろ（合同条件の名前の長さで、正解を当てられないように）
const PROP_SIDE = "合同な図形の、対応する辺は等しい", PROP_ANG = "合同な図形の、対応する角は等しい";
const propB = (id, ang, why) => B(id, ang ? PROP_ANG : PROP_SIDE, [ang ? PROP_SIDE : PROP_ANG, "三角形の合同条件", "対頂角は等しい", "平行線の錯角は等しい", "三角形の内角の和は 180°"], "prop", why);
const HINT = {
  assume: "「仮定より」の行は、問題文に書いてあることだね。問題文では、どの辺（角）が等しいと言っていたかな？",
  word: "この行で等しいといっている角は、どんな位置にある角かな？ 習った『等しくなるわけ』のうち、どれにあてはまるかな？",
  cond: "①、②、③ で等しいといったのは、辺が何組、角が何組かな？ 角は、どの辺の間にあるかな？",
  prop: "合同がいえたあとで使えることは、何だったかな？ 示したいのは、辺かな、角かな？",
  corr: "合同な図形は、頂点を対応する順に書くのだったね。この辺（角）に対応するのは、どれかな？",
  sum: "角の大きさを求めるとき、三角形の3つの内角について、何がいえたかな？",
};
const flat = (P) => P.lines.flat().filter((x) => typeof x !== "string");
const show = (P, hole) => P.lines.map((l) => l.map((x) => (typeof x === "string" ? x : x.id === hole ? "□" : x.ans)).join("")).join("\n");
/** 証明 P の空欄 b を、□ にして出す4択 */
function blankQ(r, P, b) {
  const filled = P.lines.find((l) => l.includes(b)).map((x) => (typeof x === "string" ? x : x.ans)).join("");
  return {
    q: `${P.setup}\n次の証明で、□ にあてはまるものは、どれか。\n${show(P, b.id)}`,
    ans: b.ans,
    choices: choices4(r, b.ans, pickWrongs(r, b.ans, b.wr, 3, `${P.setup}\n${show(P, b.id)}`)),
    hint: HINT[b.kind],
    steps: [`□ をふくむ行は　${filled}`, b.why, `答えは「${b.ans}」。`],
  };
}
const pickBlank = (r, P, kinds) => pick(r, flat(P).filter((b) => !kinds || kinds.includes(b.kind)));

// ── 点の名前 ──────────────────────────────────────────────────
const L5 = [["P", "Q", "R", "S", "T"], ["A", "B", "C", "D", "E"], ["K", "L", "M", "N", "X"]];
const L5x = [["A", "B", "C", "D", "O"], ["P", "Q", "R", "S", "O"], ["E", "F", "G", "H", "O"], ["K", "L", "M", "N", "O"], ["W", "X", "Y", "Z", "O"]];
const L5e = [["A", "B", "C", "D", "E"], ["P", "Q", "R", "S", "T"], ["K", "L", "M", "N", "X"]];
const L6 = [["O", "P", "A", "B", "X", "Y"], ["O", "Q", "R", "S", "T", "U"], ["O", "M", "K", "L", "E", "F"]];

// 1) 辺 PQ・PR 上の点 S・T：PS＝PT、SQ＝TR ならば QT＝RS（2組の辺とその間の角。∠P は共通）
function pfSides([p, q, r, s, t]) {
  return {
    setup: `△${p}${q}${r} の辺 ${p}${q} 上に点 ${s}、辺 ${p}${r} 上に点 ${t} があり（${s}、${t} は頂点とは異なる点）、${p}${s}＝${p}${t}、${s}${q}＝${t}${r} である。このとき、${q}${t}＝${r}${s} である。`,
    lines: [
      [`△${p}${q}${t} と △${p}${r}${s} において`],
      [`仮定より　${p}${s}＝`, B("b1", `${p}${t}`, [`${p}${q}`, `${s}${q}`, `${t}${r}`, `${q}${t}`], "assume", `仮定に　${p}${s}＝${p}${t}　とある。`), " …①"],
      [`${p}${q}＝${p}${s}+${s}${q}、${p}${r}＝${p}${t}+${t}${r} で、仮定より ${s}${q}＝`, B("b2", `${t}${r}`, [`${p}${t}`, `${p}${s}`, `${q}${t}`, `${r}${s}`], "assume", `仮定に　${s}${q}＝${t}${r}　とある。これで　${p}${q}＝${p}${s}+${s}${q}＝${p}${t}+${t}${r}＝${p}${r}。`), ` だから　${p}${q}＝${p}${r} …②`],
      [`∠${p} は`, B("b3", "共通", ["対頂角", "同位角", "錯角"], "word", `∠${p} は、△${p}${q}${t} にも △${p}${r}${s} にもふくまれる角だから、共通。`), " …③"],
      ["①、②、③ より、", condB("b4", "2組の辺とその間の角", `①、②、③ は、辺 2組（${p}${s}＝${p}${t}、${p}${q}＝${p}${r}）と、その間の角 ∠${p} の内容。`), `が、それぞれ等しいから　△${p}${q}${t}≡△${p}${r}${s}`],
      [`合同な図形の、対応する辺は等しいから　${q}${t}＝`, B("b5", `${r}${s}`, [`${r}${t}`, `${q}${s}`, `${p}${s}`, `${s}${t}`], "corr", `△${p}${q}${t}≡△${p}${r}${s} で、${p} に ${p}、${q} に ${r}、${t} に ${s} が対応するから、辺 ${q}${t} に対応する辺は ${r}${s}。`)],
    ],
  };
}
// 2) 線分 AB・CD が点 O で交わり、AC∥DB、(AO＝BO か CO＝DO) ならば (CO＝DO か AO＝BO)（1組の辺とその両端の角。対頂角と錯角）
function pfAsa([a, b, c, d, o], swap = false) {
  const [g1, g2] = swap ? [`${c}${o}`, `${d}${o}`] : [`${a}${o}`, `${b}${o}`], [k1, k2] = swap ? [`${a}${o}`, `${b}${o}`] : [`${c}${o}`, `${d}${o}`];
  const ang = swap ? [`∠${o}${c}${a}`, `∠${o}${d}${b}`] : [`∠${o}${a}${c}`, `∠${o}${b}${d}`];
  return {
    setup: `線分 ${a}${b} と ${c}${d} が点 ${o} で交わり（${o} は、${a}${b} の間にも ${c}${d} の間にもある）、${a}${c}∥${d}${b}、${g1}＝${g2} である。このとき、${k1}＝${k2} である。`,
    given: [g1, g2], concl: [k1, k2], ang, abcdo: [a, b, c, d, o],
    lines: [
      [`△${a}${o}${c} と △${b}${o}${d} において`],
      [`仮定より　${g1}＝${g2} …①`],
      [B("b1", "対頂角", ["錯角", "同位角", "共通な角"], "word", `${a}${b} と ${c}${d} が交わってできる、向かい合った角だから、対頂角。`), `は等しいから　∠${a}${o}${c}＝∠${b}${o}${d} …②`],
      [`${a}${c}∥${d}${b} で、平行線の`, B("b2", "錯角", ["同位角", "対頂角", "外角"], "word", `${a}${c}∥${d}${b} のとき、${ang[0]} と ${ang[1]} は、直線 ${c}${d}（${a}${b}）をはさんで反対がわにある角だから、錯角。`), `は等しいから　${ang[0]}＝${ang[1]} …③`],
      ["①、②、③ より、", condB("b3", "1組の辺とその両端の角", `①、②、③ は、辺 1組（${g1}＝${g2}）と、その両端の角 2組の内容。`), `が、それぞれ等しいから　△${a}${o}${c}≡△${b}${o}${d}`],
      [B("b4", PROP_SIDE, [PROP_ANG, "三角形の合同条件", "対頂角は等しい", "平行線の錯角は等しい", "三角形の内角の和は 180°"], "prop", `合同がいえたあとで、${k1}、${k2} が等しい（辺）ことを導くのは、合同な図形の、対応する辺は等しいという性質。`), `から　${k1}＝${k2}`],
    ],
  };
}
// 3) 線分 AC・BD が点 O で交わり、AO＝CO、BO＝DO ならば AB∥DC（2組の辺とその間の角。対頂角、対応する角、錯角）
function pfPar([a, b, c, d, o]) {
  return {
    setup: `線分 ${a}${c} と ${b}${d} が点 ${o} で交わり（${o} は、${a}${c} の間にも ${b}${d} の間にもある）、${a}${o}＝${c}${o}、${b}${o}＝${d}${o} である。このとき、${a}${b}∥${d}${c} である。`,
    lines: [
      [`△${a}${o}${b} と △${c}${o}${d} において`],
      [`仮定より　${a}${o}＝`, B("b1", `${c}${o}`, [`${b}${o}`, `${d}${o}`, `${a}${b}`, `${c}${d}`], "assume", `仮定に　${a}${o}＝${c}${o}　とある。`), " …①　", `${b}${o}＝`, B("b2", `${d}${o}`, [`${a}${o}`, `${c}${o}`, `${a}${b}`, `${c}${d}`], "assume", `仮定に　${b}${o}＝${d}${o}　とある。`), " …②"],
      [B("b3", "対頂角", ["錯角", "同位角", "共通な角"], "word", `${a}${c} と ${b}${d} が交わってできる、向かい合った角だから、対頂角。`), `は等しいから　∠${a}${o}${b}＝∠`, B("b4", `${c}${o}${d}`, [`${c}${o}${b}`, `${d}${o}${a}`, `${o}${c}${d}`], "corr", `∠${a}${o}${b} の対頂角は、∠${c}${o}${d}。`), " …③"],
      ["①、②、③ より、", condB("b5", "2組の辺とその間の角", `①、②、③ は、辺 2組（${a}${o}＝${c}${o}、${b}${o}＝${d}${o}）と、その間の角 ∠${a}${o}${b} の内容。`), `が、それぞれ等しいから　△${a}${o}${b}≡△${c}${o}${d}`],
      [`合同な図形の、対応する角は等しいから　∠${o}${a}${b}＝∠`, B("b6", `${o}${c}${d}`, [`${o}${d}${c}`, `${c}${o}${d}`, `${o}${a}${d}`, `${o}${c}${b}`], "corr", `△${a}${o}${b}≡△${c}${o}${d} で、${a} に ${c}、${o} に ${o}、${b} に ${d} が対応するから、∠${o}${a}${b} に対応する角は ∠${o}${c}${d}。`)],
      [B("b7", "錯角", ["同位角", "対頂角", "内角"], "word", `∠${o}${a}${b}（＝∠${c}${a}${b}）と ∠${o}${c}${d}（＝∠${a}${c}${d}）は、直線 ${a}${c} をはさんで反対がわにある角だから、錯角。`), `が等しいから　${a}${b}∥${d}${c}`],
    ],
  };
}
// 4) 正三角形 ABC と正三角形 ADE（A のまわりに半直線 AB、AC、AD、AE がこの順）ならば BD＝CE
function pfEq([a, b, c, d, e]) {
  return {
    setup: `正三角形 ${a}${b}${c} と正三角形 ${a}${d}${e} があり、${a} のまわりに半直線 ${a}${b}、${a}${c}、${a}${d}、${a}${e} がこの順に並んでいる（2つの三角形は重ならない）。このとき、${b}${d}＝${c}${e} である。`,
    lines: [
      [`△${a}${b}${d} と △${a}${c}${e} において`],
      [`△${a}${b}${c} は正三角形だから　${a}${b}＝`, B("b1", `${a}${c}`, [`${a}${d}`, `${d}${e}`, `${b}${d}`, `${c}${e}`], "assume", `正三角形 ${a}${b}${c} の辺は、${a}${b}＝${b}${c}＝${c}${a}。△${a}${b}${d} の辺 ${a}${b} に対応するのは、△${a}${c}${e} の辺 ${a}${c}。`), " …①"],
      [`△${a}${d}${e} は正三角形だから　${a}${d}＝`, B("b2", `${a}${e}`, [`${a}${b}`, `${a}${c}`, `${b}${d}`, `${c}${e}`], "assume", `正三角形 ${a}${d}${e} の辺は、${a}${d}＝${d}${e}＝${e}${a}。△${a}${b}${d} の辺 ${a}${d} に対応するのは、△${a}${c}${e} の辺 ${a}${e}。`), " …②"],
      [`∠${b}${a}${d}＝60°+∠${c}${a}${d}、∠${c}${a}${e}＝60°+∠${c}${a}${d} だから　∠${b}${a}${d}＝∠`, B("b3", `${c}${a}${e}`, [`${c}${a}${d}`, `${d}${a}${e}`, `${b}${a}${c}`, `${a}${c}${e}`], "corr", `∠${b}${a}${d} と ∠${c}${a}${e} は、どちらも 60°+∠${c}${a}${d} だから等しい。`), " …③"],
      ["①、②、③ より、", condB("b4", "2組の辺とその間の角", `①、②、③ は、辺 2組（${a}${b}＝${a}${c}、${a}${d}＝${a}${e}）と、その間の角 ∠${b}${a}${d}＝∠${c}${a}${e} の内容。`), `が、それぞれ等しいから　△${a}${b}${d}≡△${a}${c}${e}`],
      [B("b5", PROP_SIDE, [PROP_ANG, "三角形の合同条件", "対頂角は等しい", "平行線の錯角は等しい", "三角形の内角の和は 180°"], "prop", `合同がいえたあとで、${b}${d}、${c}${e} が等しい（辺）ことを導くのは、合同な図形の、対応する辺は等しいという性質。`), `から　${b}${d}＝${c}${e}`],
    ],
  };
}
// 5) 線分 AB の中点 M を通る直線 ℓ。A、B から ℓ への垂線の足 P、Q ならば AP＝BQ（1組の辺とその両端の角。対頂角、内角の和）
function pfMid([a, b, m, p, q]) {
  return {
    setup: `線分 ${a}${b} の中点を ${m} とし、${m} を通る直線 ℓ をひく（ℓ は ${a}${b} と重ならず、${a}${b} に垂直でもない）。${a}、${b} から ℓ にひいた垂線と ℓ との交点を、それぞれ ${p}、${q} とする。このとき、${a}${p}＝${b}${q} である。`,
    lines: [
      [`△${a}${p}${m} と △${b}${q}${m} において`],
      [`仮定より　${a}${m}＝${b}${m} …①`],
      [`仮定より　∠${a}${p}${m}＝∠${b}${q}${m}＝90° …②`],
      [B("b1", "対頂角", ["錯角", "同位角", "共通な角"], "word", `${a}${b} と ℓ が ${m} で交わってできる、向かい合った角だから、対頂角。`), `は等しいから　∠${a}${m}${p}＝∠${b}${m}${q} …③`],
      [`②、③ と、`, B("b2", "三角形の内角の和は 180°", ["合同な図形の、対応する角は等しい", "対頂角は等しい", "三角形の合同条件", "四角形の内角の和は 360°", "三角形の外角の和は 360°"], "sum", `②（直角どうし）と ③ から、2つの角が等しい。三角形の内角の和は 180° だから、残りの角も等しい。`), ` から　∠${p}${a}${m}＝∠${q}${b}${m} …④`],
      ["①、③、④ より、", condB("b3", "1組の辺とその両端の角", `①、③、④ は、辺 1組（${a}${m}＝${b}${m}）と、その両端の角 2組（∠${a}${m}${p}＝∠${b}${m}${q}、∠${p}${a}${m}＝∠${q}${b}${m}）の内容。`), `が、それぞれ等しいから　△${a}${p}${m}≡△${b}${q}${m}`],
      [B("b4", PROP_SIDE, [PROP_ANG, "三角形の合同条件", "対頂角は等しい", "平行線の錯角は等しい", "三角形の内角の和は 180°"], "prop", `合同がいえたあとで、${a}${p}、${b}${q} が等しい（辺）ことを導くのは、合同な図形の、対応する辺は等しいという性質。`), `から　${a}${p}＝${b}${q}`],
    ],
  };
}
// 6) OP が ∠XOY の二等分線、OA＝OB ならば PA＝PB（2組の辺とその間の角。OP は共通）
function pfBis([o, p, a, b, x, y]) {
  return {
    setup: `${o}${p} は ∠${x}${o}${y} の二等分線で、半直線 ${o}${x}、${o}${y} 上に ${o}${a}＝${o}${b} となる点 ${a}、${b} をとる。このとき、${p}${a}＝${p}${b} である。`,
    lines: [
      [`△${o}${a}${p} と △${o}${b}${p} において`],
      [`仮定より　${o}${a}＝`, B("b1", `${o}${b}`, [`${o}${p}`, `${p}${a}`, `${p}${b}`], "assume", `仮定に　${o}${a}＝${o}${b}　とある。`), " …①"],
      [`${o}${p} は ∠${x}${o}${y} の二等分線だから　∠${a}${o}${p}＝∠`, B("b2", `${b}${o}${p}`, [`${a}${o}${b}`, `${o}${p}${b}`, `${x}${o}${y}`], "corr", `${o}${p} が ∠${x}${o}${y} を二等分するから、∠${a}${o}${p}＝∠${b}${o}${p}。`), " …②"],
      [`${o}${p} は`, B("b3", "共通", ["対頂角", "同位角", "錯角"], "word", `${o}${p} は、△${o}${a}${p} にも △${o}${b}${p} にもふくまれる辺だから、共通。`), " …③"],
      ["①、②、③ より、", condB("b4", "2組の辺とその間の角", `①、②、③ は、辺 2組（${o}${a}＝${o}${b}、${o}${p} は共通）と、その間の角 ∠${a}${o}${p}＝∠${b}${o}${p} の内容。`), `が、それぞれ等しいから　△${o}${a}${p}≡△${o}${b}${p}`],
      [B("b5", PROP_SIDE, [PROP_ANG, "三角形の合同条件", "対頂角は等しい", "平行線の錯角は等しい", "三角形の内角の和は 180°"], "prop", `合同がいえたあとで、${p}${a}、${p}${b} が等しい（辺）ことを導くのは、合同な図形の、対応する辺は等しいという性質。`), `から　${p}${a}＝${p}${b}`],
    ],
  };
}

// ── 証明のまちがいさがし（dr.4）：AC∥DB、AO＝BO ならば CO＝DO の証明の、1行をかえる ───────────────
function flawQ(r) {
  const L = pick(r, L5x), swap = r(0, 1) === 1, P = pfAsa(L, swap);
  const [g1, g2] = P.given, [k1, k2] = P.concl, [x1, x2] = P.ang;
  const lines = P.lines.map((l) => l.map((x) => (typeof x === "string" ? x : x.ans)).join(""));   // 正しい証明（0〜5行目）
  // key：まちがいの種類。at＝かえた行の番号、bad＝まちがった行、desc＝まちがいの説明（正しく言いあてた文）
  const FLAW = {
    miss: { at: 4, bad: lines[4].replace("①、②、③ より", "①、② より"), desc: "等しいと示したのが ① と ② の2つだけで、合同条件に必要な3つめが書かれていない。", note: `③ として　${lines[3]}　を加えて、等しい組を3つそろえる。` },
    rsn: { at: 3, bad: lines[3].replace("平行線の錯角は等しい", "平行線の同位角は等しい"), desc: `③ の ${x1}＝${x2} の根拠を、錯角ではなく、同位角にしている。`, note: `正しくは　${lines[3]}` },
    look: { at: 3, bad: `図で等しく見えるから　${x1}＝${x2} …③`, desc: `③ の ${x1}＝${x2} の根拠を、図で等しく見えることにしている。`, note: `正しくは　${lines[3]}` },
    cond: { at: 4, bad: lines[4].replace("1組の辺とその両端の角", "2組の辺とその間の角"), desc: "①、②、③ は、1組の辺とその両端の角の内容なのに、合同条件を「2組の辺とその間の角」と書いている。", note: `正しくは　${lines[4]}` },
    prop: { at: 5, bad: lines[5].replace("対応する辺は等しい", "対応する角は等しい"), desc: `${k1}、${k2} は辺なのに、結論を導く根拠を「合同な図形の、対応する角は等しい」にしている。`, note: `正しくは　${lines[5]}` },
  };
  const key = pick(r, Object.keys(FLAW)), F = FLAW[key];
  let flawed;
  if (key === "miss") flawed = [lines[0], lines[1], lines[2], F.bad, lines[5]];   // ③ の行をぬいて、合同条件の行は ①、② だけ
  else flawed = lines.map((l, i) => (i === F.at ? F.bad : l));
  const wrongs = Object.keys(FLAW).filter((k) => k !== key).map((k) => FLAW[k].desc);
  const q = `${P.setup}\n次の証明には、まちがいが1か所ある。まちがいを正しく言いあてているものは、どれか。\n${flawed.join("\n")}`;
  return {
    q,
    ans: F.desc,
    choices: choices4(r, F.desc, pickWrongs(r, F.desc, wrongs, 3, q)),
    hint: "証明の1行ずつについて、「なぜそういえるか」をたしかめてみよう。ことばや数が、あっているかな？ 使った合同条件の形になっているかな？",
    steps: [`まちがっている行は　${F.bad}`, F.note, `答えは「${F.desc}」。`],
  };
}

// ── 根拠を答える問題（dr.1・qz.1）──────────────────────────────────────
const RSN = {
  vert: "対頂角は等しい",
  alt: "平行線の錯角は等しい",
  corr: "平行線の同位角は等しい",
  pc: "合同な図形の、対応する辺は等しい",
  pa: "合同な図形の、対応する角は等しい",
  sss: "三角形の合同条件（3組の辺）",
  sas: "三角形の合同条件（2組の辺とその間の角）",
  asa: "三角形の合同条件（1組の辺とその両端の角）",
  sum: "三角形の内角の和は 180°",
  reg: "正三角形の3つの辺は等しい",
};
const LP6 = [["A", "B", "C", "D", "E", "F"], ["G", "H", "J", "K", "L", "M"], ["R", "S", "T", "U", "V", "W"]];
const parIntro = ([A, B, C, D, E, F]) => `水平な 2直線 ℓ（上）と m（下）が平行で、直線 n が ℓ と点 P、m と点 Q で交わっている。ℓ 上に、P の左に点 ${A}、P の右に点 ${B}、m 上に、Q の左に点 ${C}、Q の右に点 ${D}、n 上に、P より上に点 ${E}、Q より下に点 ${F} がある。`;
const parAn = ([A, B, C, D, E, F]) => ({ UR_P: `∠${E}P${B}`, UL_P: `∠${E}P${A}`, LL_P: `∠${A}PQ`, LR_P: `∠${B}PQ`, UR_Q: `∠PQ${D}`, UL_Q: `∠PQ${C}`, LL_Q: `∠${C}Q${F}`, LR_Q: `∠${D}Q${F}` });
const SIDE = (T, i) => `${T[(i + 1) % 3]}${T[(i + 2) % 3]}`;
/** 根拠をたずねることがら（key は RSN のどれか） */
function stmtOf(r, key) {
  const [t1, t2] = pick(r, [[["A", "B", "C"], ["D", "E", "F"]], [["P", "Q", "R"], ["X", "Y", "Z"]], [["K", "L", "M"], ["N", "P", "Q"]]]);
  const tri = `△${t1.join("")}`, tri2 = `△${t2.join("")}`, i = r(0, 2), L = pick(r, L5x), [a, b, c, d, o] = L;
  const E3 = (kinds) => kinds.map((k) => (k[0] === "S" ? `${SIDE(t1, +k[1])}＝${SIDE(t2, +k[1])}` : `∠${t1[+k[1]]}＝∠${t2[+k[1]]}`));
  switch (key) {
    case "vert": return `線分 ${a}${b} と ${c}${d} が点 ${o} で交わっているとき、∠${a}${o}${c}＝∠${b}${o}${d}`;
    case "pc": return `${tri}≡${tri2} のとき、${SIDE(t1, i)}＝${SIDE(t2, i)}`;
    case "pa": return `${tri}≡${tri2} のとき、∠${t1[i]}＝∠${t2[i]}`;
    case "sss": return `${E3(shuffle(r, ["S0", "S1", "S2"])).join("、")} のとき、${tri}≡${tri2}`;
    case "sas": { const v = r(0, 2), o2 = [0, 1, 2].filter((x) => x !== v); return `${E3(shuffle(r, [`S${o2[0]}`, `A${v}`, `S${o2[1]}`])).join("、")} のとき、${tri}≡${tri2}`; }
    case "asa": { const s = r(0, 2), o2 = [0, 1, 2].filter((x) => x !== s); return `${E3(shuffle(r, [`A${o2[0]}`, `S${s}`, `A${o2[1]}`])).join("、")} のとき、${tri}≡${tri2}`; }
    case "alt": return `四角形 ${a}${b}${c}${d} で、${a}${b}∥${d}${c} のとき、∠${b}${a}${c}＝∠${d}${c}${a}`;
    case "sum": { const x = 5 * r(4, 17), y = 5 * r(4, 17); return `${tri} で、∠${t1[0]}＝${x}°、∠${t1[1]}＝${y}° のとき、∠${t1[2]}＝${180 - x - y}°`; }
    case "reg": return `${tri} が正三角形のとき、${t1[0]}${t1[1]}＝${t1[0]}${t1[2]}`;
    case "corr": case "altP": {
      const P = pick(r, LP6), AN = parAn(P), pr = key === "corr" ? pick(r, [["UR_P", "UR_Q"], ["UL_P", "UL_Q"], ["LL_P", "LL_Q"], ["LR_P", "LR_Q"]]) : pick(r, [["LL_P", "UR_Q"], ["LR_P", "UL_Q"]]);
      return `${parIntro(P)}ℓ∥m のとき、${AN[pr[0]]}＝${AN[pr[1]]}`;
    }
  }
}
function rsnQ(r, keys) {
  const key = pick(r, keys), text = stmtOf(r, key), real = key === "altP" ? "alt" : key, ans = RSN[real];
  const wrongs = Object.keys(RSN).filter((k) => k !== real).map((k) => RSN[k]);
  const q = `次のことがいえる根拠は、どれか。\n${text}`;
  return {
    q,
    ans,
    choices: choices4(r, ans, pickWrongs(r, ans, wrongs, 3, q)),
    hint: "このことは、問題の条件かな、習った性質かな？ 習った性質なら、どの性質にあてはまるかな？",
    steps: [real === "vert" ? "2直線が交わってできる、向かい合った角どうしだから、対頂角。" : real === "alt" ? "平行な 2直線に交わる直線をはさんで、反対がわにある角どうしだから、平行線の錯角。" : real === "corr" ? "平行な 2直線と交わる直線で、同じ位置にある角どうしだから、平行線の同位角。" : real === "pc" ? "合同だとわかっている図形の、対応する辺だから、合同な図形の性質（辺）。" : real === "pa" ? "合同だとわかっている図形の、対応する角だから、合同な図形の性質（角）。" : real === "sum" ? "三角形の3つの内角の和が 180° であることを使っている。" : real === "reg" ? "正三角形の定義から、3つの辺は等しい。" : "等しい辺と角の組み方が、三角形の合同条件のどれにあてはまるかを見る。", `答えは「${ans}」。`],
  };
}

// ── 証明の根拠にしてよいもの・いけないもの（dr.2）─────────────────────────────
const OKS = ["問題で、はじめに与えられていること（仮定）", "対頂角は等しい", "平行線の同位角は等しい", "平行線の錯角は等しい", "三角形の合同条件", "合同な図形の、対応する辺や角は等しい", "三角形の内角の和は 180°", "どちらの三角形にもふくまれる辺は、共通", "正三角形の3つの辺は等しい", "問題文に書いてある、等しい辺や角"];
const NGS = ["図を見て、等しく見えること", "これから示そうとしていること（結論）", "定規ではかった長さ", "分度器ではかった角の大きさ", "何個かの図で成り立ったこと", "なんとなく、成り立ちそうなこと", "友達が「そうだ」と言ったこと", "図で、ぴったり重なって見えること", "問題文に書いていない、自分で決めた条件", "はかったら、ほとんど同じだったこと"];
const LET4 = ["ア", "イ", "ウ", "エ"], LET6 = ["ア", "イ", "ウ", "エ", "オ", "カ"];
/** 4つ（ア〜エ）のうち、根拠にしてよいものが k 個。wantOk＝true なら「してよいもの」、false なら「してはいけないもの」を、すべて選んだ組をたずねる4択 */
function groundSetQ(r, wantOk) {
  const k = pick(r, [1, 2, 2, 3]), ok = shuffle(r, OKS).slice(0, k), ng = shuffle(r, NGS).slice(0, 4 - k);
  const list = shuffle(r, [...ok.map((x) => ({ x, v: true })), ...ng.map((x) => ({ x, v: false }))]);
  const target = [0, 1, 2, 3].filter((i) => list[i].v === wantOk), other = [0, 1, 2, 3].filter((i) => !target.includes(i));
  const flip = (set, x) => (set.includes(x) ? set.filter((y) => y !== x) : [...set, x].sort((m, n) => m - n));
  let a, b;
  if (target.length === 2) { a = pick(r, target); b = pick(r, other); } else if (target.length === 1) { [a, b] = shuffle(r, other).slice(0, 2); } else { [a, b] = shuffle(r, target).slice(0, 2); }
  const setTxt = (s2) => (s2.length === 1 ? `${LET4[s2[0]]}だけ` : s2.map((i) => LET4[i]).join("と"));
  const ans = setTxt(target), name = wantOk ? "してよい" : "してはいけない";
  const ask = pick(r, wantOk
    ? ["次のア〜エのうち、証明の根拠にしてよいものを、すべて選んだ組はどれか。", "証明の中で、そのまま理由として書いてよいものを、次のア〜エからすべて選んだ組はどれか。", "次のア〜エのうち、証明の根拠にしてよいものだけを集めた組はどれか。"]
    : ["次のア〜エのうち、証明の根拠にしてはいけないものを、すべて選んだ組はどれか。", "証明の中で、理由として書いてはいけないものを、次のア〜エからすべて選んだ組はどれか。", "次のア〜エのうち、証明の根拠にしてはいけないものだけを集めた組はどれか。"]);
  return {
    q: `${ask}\n${list.map((o, i) => `${LET4[i]} ${o.x}`).join("\n")}`,
    ans,
    choices: choices4(r, ans, [setTxt(flip(target, a)), setTxt(flip(target, b)), setTxt(flip(flip(target, a), b))]),
    hint: "ア〜エを1つずつ読んで、証明の中で理由として書いてよいかどうかを考えよう。証明の根拠にできるのは、どんなことだったかな？",
    steps: ["証明の根拠にできるのは、仮定と、すでに正しいと認められた性質。", `根拠にしてよいもの … ${list.map((o, i) => (o.v ? LET4[i] : null)).filter(Boolean).join("、")}　　根拠にしてはいけないもの … ${list.map((o, i) => (o.v ? null : LET4[i])).filter(Boolean).join("、")}`, `${name}ものを選ぶと　${ans}。`],
  };
}

export const UNITS = [
  unit("12", {
    name: "証明の各行の根拠を読み取る",
    desc: "証明の1行ずつの根拠（仮定・対頂角・錯角・合同条件・合同な図形の性質）を言い、空欄をうめる",
    prereqs: ["J2-hk11"],
    points: [
      "証明は、仮定から出発して、根拠を1つずつあげながら、結論までつなぐ。根拠にできるのは、仮定や、すでに正しいと認められたこと（対頂角は等しい、平行線の同位角・錯角は等しい、三角形の合同条件、合同な図形の対応する辺・角は等しい、など）。",
      "合同を使う証明の流れ：「△〜 と △〜 において」と、2つの三角形を選ぶ → 等しい辺・角を3組あげる（合同条件の形になるように）→ 合同条件を書いて △〜≡△〜 を示す → 合同な図形の、対応する辺（角）は等しいことから、結論をいう。",
      "図で等しく見えること、定規や分度器ではかった長さ・角、これから示そうとしていること（結論）は、根拠にしてはいけない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 12d01 演習（1）対頂角・合同な図形の性質・合同条件などの、根拠
        t("12d01", (r) => rsnQ(r, ["vert", "pc", "sss", "pa", "alt", "corr", "altP", "sum", "reg", "sas", "asa"])),
        // 12d02a 演習（2）証明の根拠にしてよいものを、すべて選んだ組
        t("12d02a", (r) => groundSetQ(r, true)),
        // 12d02b 演習（2）証明の根拠にしてはいけないものを、すべて選んだ組
        t("12d02b", (r) => groundSetQ(r, false)),
        // 12d02c 演習（2）6つのうち、根拠にしてよい（してはいけない）ものはいくつか
        t("12d02c", (r) => {
          const k = r(2, 4), ok = shuffle(r, OKS).slice(0, k), ng = shuffle(r, NGS).slice(0, 6 - k), list = shuffle(r, [...ok.map((x) => ({ x, v: true })), ...ng.map((x) => ({ x, v: false }))]);
          const wantOk = r(0, 1) === 0, n = wantOk ? k : 6 - k;
          return {
            q: `次のア〜カのうち、証明の根拠に${wantOk ? "してよい" : "してはいけない"}ものは、いくつあるか。\n${list.map((o, i) => `${LET6[i]} ${o.x}`).join("\n")}`,
            ans: n,
            unit: "個",
            hint: "ア〜カを1つずつ読んで、証明の中で理由として書いてよいかどうかを考えよう。証明の根拠にできるのは、どんなことだったかな？",
            steps: [`根拠にしてよいもの … ${list.map((o, i) => (o.v ? LET6[i] : null)).filter(Boolean).join("、")}`, `根拠にしてはいけないもの … ${list.map((o, i) => (o.v ? null : LET6[i])).filter(Boolean).join("、")}`, `${wantOk ? "してよい" : "してはいけない"}ものは ${n}個。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 12d03 演習（3）△PQT と △PRS の証明の空欄（PS＝PT、SQ＝TR ならば QT＝RS）
        t("12d03", (r) => { const P = pfSides(pick(r, L5)); return blankQ(r, P, pickBlank(r, P)); }),
        // 12q01 小テスト（1）根拠（対頂角・合同な図形の性質・合同条件 など）
        t("12q01", (r) => rsnQ(r, ["vert", "pc", "sss", "pa", "sas", "asa", "vert", "pc"])),
        // 12q02 小テスト（2）AC∥DB、CO＝DO ならば AO＝BO の証明の空欄
        t("12q02", (r) => { const P = pfAsa(pick(r, L5x), true); return blankQ(r, P, pickBlank(r, P)); }),
        // 12w02 ワークシート 例題：OP が ∠XOY の二等分線 … PA＝PB の証明の空欄
        t("12w02", (r) => { const P = pfBis(pick(r, L6)); return blankQ(r, P, pickBlank(r, P)); }),
        // 12w03 ワークシート 考えよう：ばらばらにした証明を、正しい順にならべるとき、最初（最後）に書く行
        t("12w03", (r) => {
          const [p, q, rr, s] = pick(r, L5x), lines = [
            { k: "start", t: `△${p}${q}${rr} と △${p}${s}${rr} において` },
            { k: "h1", t: `仮定より　${p}${q}＝${p}${s}` }, { k: "h2", t: `仮定より　${rr}${q}＝${rr}${s}` }, { k: "com", t: `${p}${rr} は共通` },
            { k: "cong", t: `3組の辺が、それぞれ等しいから　△${p}${q}${rr}≡△${p}${s}${rr}` }, { k: "end", t: `合同な図形の、対応する角は等しいから　∠${p}${q}${rr}＝∠${p}${s}${rr}` },
          ];
          const LAB = shuffle(r, ["ア", "イ", "ウ", "エ", "オ", "カ"]), lab = Object.fromEntries(lines.map((l, i) => [l.k, LAB[i]])), ord = "アイウエオカ";
          const shown = [...lines].sort((x, y) => ord.indexOf(lab[x.k]) - ord.indexOf(lab[y.k]));
          const ask = pick(r, ["first", "last", "before-end"]), key = { first: "start", last: "end", "before-end": "cong" }[ask], ans = lab[key];
          const others = shuffle(r, lines.filter((l) => l.k !== key).map((l) => lab[l.k])).slice(0, 3);
          return {
            q: `四角形 ${p}${q}${rr}${s} で、「${p}${q}＝${p}${s}、${rr}${q}＝${rr}${s} ならば、∠${p}${q}${rr}＝∠${p}${s}${rr} である」の証明を、ばらばらにして、次のア〜カに書いた。\n${shown.map((l) => `${lab[l.k]} ${l.t}`).join("\n")}\n正しい順にならべるとき、${ask === "first" ? "いちばん最初に書く" : ask === "last" ? "いちばん最後に書く" : "いちばん最後の行の、すぐ前に書く"}行は、どれか。`,
            ans,
            choices: choices4(r, ans, others),
            hint: "証明は、どんな順に書くのだったかな？ 合同を示す行と、合同がいえたあとの行は、どちらが先かな？",
            steps: ["証明は、「△〜 と △〜 において」で始め、等しい組（仮定・共通）をあげ、合同条件で合同を示し、合同な図形の性質で結論をいう。", `この順にならべると　${lab.start} → （${lab.h1}・${lab.h2}・${lab.com} は、どの順でもよい）→ ${lab.cong} → ${lab.end}`, `${ask === "first" ? "最初" : ask === "last" ? "最後" : "最後の行のすぐ前"}は ${ans}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 12d04 演習（4）まちがった証明を読んで、まちがいを言いあてる
        t("12d04", (r) => flawQ(r)),
        // 12d05 演習（5）AO＝CO、BO＝DO ならば AB∥DC の証明の空欄
        t("12d05", (r) => { const P = pfPar(pick(r, L5x)); return blankQ(r, P, pickBlank(r, P)); }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 12d06 演習（6）正三角形 ABC と ADE が頂点 A を共有 … BD＝CE の証明の空欄
        t("12d06", (r) => { const P = pfEq(pick(r, L5e)); return blankQ(r, P, pickBlank(r, P)); }),
        // 12q03 チャレンジ M は線分 AB の中点 … AP＝BQ の証明の空欄
        t("12q03", (r) => { const P = pfMid(pick(r, L5e)); return blankQ(r, P, pickBlank(r, P)); }),
      ],
    },
  }),
];

// 移さなかった問題：なし（ikkan の演習プリント 6問・小テスト 3問のすべてを移した。「すべて選ぼう」は、1つ選ぶ・数える問題に、「まちがいを指摘して直そう」は、まちがいを言いあてる4択に直した）
export const SKIPPED = [];
