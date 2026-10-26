// ============================================================
// heikou-14.js — 平行と合同 第14時「「平行と合同」で学んだことを、整理して確かめよう」
//   ikkan の演習プリント（heikou-14.dr.1〜7）・小テスト（heikou-14.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「14」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：14d01a ＝ heikou-14.dr.1 ①（平行線と角）
//   図は出せないので、点の名前・位置関係（上・下・左・右・あいだ・同じがわ）・平行・等しい辺や角（仮定）を、すべて問題文に書いた。「右の図」とは書かない。
//   ・平行線と角：2直線 ℓ∥m と、それに交わる直線 n の、8つの角を、位置（右上・左上・右下・左下）で決め、同位角・錯角・対頂角・一直線の角をたどって、角の大きさを出す（最短の道すじを探して、解説にする）。
//   ・三角形・多角形の角：内角の和 180°×(n−2)、外角の和 360°、正n角形の1つの内角・外角、三角形の外角を、問題文の数字から計算する。
//   ・合同：等しいものの組（辺・角の位置）から、合同条件（3組の辺／2組の辺とその間の角／1組の辺とその両端の角／あてはまらない）を judge で判定する。
//   ・証明（仮定・結論・根拠）：証明は書けないので、穴うめ（4択）・根拠を選ぶ4択・合同から出る角の大きさ（数値入力）に直した。SKIPPED は 0。
//   答えは、問題文の数字・等しいものの組から計算して出す（手で書かない）。
// ============================================================
import { t as t0, pick, choices4, sample, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // I と O は、1・0 とまぎらわしいので、のぞく
const CAN = "ABCDEFGHJKLMN";                     // 問題をかくときの仮の名前（A, B, C, …）
/** 仮の名前 A, B, C, … を、連続した文字（ABCD…／EFGH…／KLMN…／PQRS…）にとりかえる関数。k＝使う文字の数。avoid＝使わない文字（M・O など） */
function namer(r, k, avoid = "") {
  const seqs = [];
  for (let s = 0; s + k <= LETTERS.length; s++) {
    if (!"AEKP".includes(LETTERS[s])) continue;
    const seq = LETTERS.slice(s, s + k);
    if ([...avoid].some((c) => seq.includes(c))) continue;
    seqs.push(seq);
  }
  const seq = pick(r, seqs);
  return (str) => str.replace(/[A-Z]/g, (c) => { const i = CAN.indexOf(c); return i >= 0 && i < k ? seq[i] : c; });
}

const kan = (n) => (n < 10 ? "〇一二三四五六七八九"[n] : n < 20 ? "十" + (n % 10 ? "一二三四五六七八九"[n % 10 - 1] : "") : "二三四五六七八九"[Math.floor(n / 10) - 2] + "十" + (n % 10 ? "一二三四五六七八九"[n % 10 - 1] : ""));
const gon = (n) => `${kan(n)}角形`;                 // 十二角形
const rgon = (n) => (n === 3 ? "正三角形" : n === 4 ? "正方形" : `正${gon(n)}`);   // 正十二角形
const DIV360 = [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30];   // 360 の約数（正n角形の1つの外角が整数の度になる n）

/** 誤答の候補 pool から k 個えらぶ。正解 ans の「長さの順位」が、かたよらないように（長さで当てられないように） */
function pickWrongs(r, ans, pool, k = 3) {
  const target = r(0, k), len = (x) => String(x).length;
  let first = null;
  for (let i = 0; i < 80; i++) {
    const w = shuffle(r, pool).slice(0, k), lo = w.filter((x) => len(x) < len(ans)).length, ties = w.filter((x) => len(x) === len(ans)).length;
    if (!first) first = w;
    if (target >= lo && target <= lo + ties) return w;
  }
  return first;
}
/** 重みつきで 1つえらぶ */
function pickW(r, keys, w) {
  const tot = keys.reduce((s, k) => s + w[k], 0);
  let x = r(0, 9999) / 10000 * tot;
  for (const k of keys) { if (x < w[k]) return k; x -= w[k]; }
  return keys[keys.length - 1];
}

// 合同条件
const COND = { SSS: "3組の辺", SAS: "2組の辺とその間の角", ASA: "1組の辺とその両端の角", NONE: "どれにもあてはまらない" };
const condChoices = (r, key) => choices4(r, COND[key], Object.keys(COND).filter((k) => k !== key).map((k) => COND[k]));
/** 三角形の頂点の番号 0, 1, 2 で、等しいものを言う。辺 SIDE(i, j)（頂点 i と j をむすぶ辺。common＝true なら「辺 ○○ が共通」）、角 ANG(i)（頂点 i の角） */
const SIDE = (i, j, common = false) => ({ k: "s", i, j, common });
const ANG = (i) => ({ k: "a", i });
/** 等しいもの 3つから、あてはまる合同条件を判定する（SSS／SAS／ASA／NONE）。辺2・角1 は、角が2辺の間（2辺に共通な頂点）の角のときだけ SAS。辺1・角2 は、2つの角が辺の両端のときだけ ASA */
function judge(els) {
  const ss = els.filter((e) => e.k === "s"), aa = els.filter((e) => e.k === "a");
  if (ss.length === 3) return "SSS";
  if (ss.length === 2 && aa.length === 1) {
    const common = [ss[0].i, ss[0].j].find((v) => v === ss[1].i || v === ss[1].j);
    return aa[0].i === common ? "SAS" : "NONE";
  }
  if (ss.length === 1 && aa.length === 2) {
    const ends = [ss[0].i, ss[0].j];
    if (aa.every((a) => ends.includes(a.i))) return "ASA";
    throw new Error("辺1・角2 で、角が辺の両端でない組は、使わない（AAS）");
  }
  return "NONE";
}
/** 三角形の頂点の並び V の、頂点 i の角の名前（i 以外の 2頂点を、番号の小さい順にはさむ）。例 V=[A,O,B] なら、i=0 → OAB、i=1 → AOB、i=2 → ABO。short＝true なら、頂点の名前だけ（B） */
const angName = (V, i, short = false) => { if (short) return V[i]; const o = [0, 1, 2].filter((x) => x !== i); return V[o[0]] + V[i] + V[o[1]]; };
const sorted2 = (e) => (e.i < e.j ? [e.i, e.j] : [e.j, e.i]);
/** 等しいもの e を、「AB＝DE」「∠OAB＝∠ODC」「辺 AC が共通」の形の文字にする。short＝true なら、角は「∠B＝∠E」の短い形（頂点の名前がすべてちがう 2つの三角形用） */
const elText = (e, V1, V2, short = false) => {
  if (e.k === "s") { const [i, j] = sorted2(e); return e.common ? `辺 ${V1[i]}${V1[j]} が共通` : `${V1[i]}${V1[j]}＝${V2[i]}${V2[j]}`; }
  return `∠${angName(V1, e.i, short)}＝∠${angName(V2, e.i, short)}`;
};
const oth = (v) => [0, 1, 2].filter((z) => z !== v);
/** 等しいもの 3つの組の全部（種類ごと）。SSA＝2辺と、その間にない角。AAA＝3組の角 */
const TRI = {
  SSS: [[SIDE(0, 1), SIDE(1, 2), SIDE(0, 2)]],
  SAS: [0, 1, 2].map((v) => [SIDE(v, oth(v)[0]), SIDE(v, oth(v)[1]), ANG(v)]),
  ASA: [[0, 1], [1, 2], [0, 2]].map(([i, j]) => [SIDE(i, j), ANG(i), ANG(j)]),
  SSA: [0, 1, 2].flatMap((v) => oth(v).map((w) => [SIDE(v, oth(v)[0]), SIDE(v, oth(v)[1]), ANG(w)])),
  AAA: [[ANG(0), ANG(1), ANG(2)]],
};
/** 合同条件の解説（3行）。els＝等しいもの 3つ、key＝judge の答え */
function condSteps(els, V1, V2, key, short = false) {
  const ss = els.filter((e) => e.k === "s"), aa = els.filter((e) => e.k === "a");
  let mid;
  if (key === "SSS") mid = "辺が 3組とも、それぞれ等しい。";
  else if (key === "SAS") {
    const v = aa[0].i, [x, y] = ss.map((e) => [e.i, e.j].find((z) => z !== v));
    mid = `∠${angName(V1, v, short)} は、辺 ${V1[v]}${V1[Math.min(x, y)]} と ${V1[v]}${V1[Math.max(x, y)]} の間の角。`;
  } else if (key === "ASA") {
    const [i, j] = sorted2(ss[0]);
    mid = `辺 ${V1[i]}${V1[j]} の両端の角（∠${angName(V1, i, short)} と ∠${angName(V1, j, short)}）が、それぞれ等しい。`;
  } else if (aa.length === 3) mid = "3組の角が等しいだけでは、大きさがちがう三角形もある。";
  else {
    const v = [ss[0].i, ss[0].j].find((z) => z === ss[1].i || z === ss[1].j);
    mid = `∠${angName(V1, aa[0].i, short)} は、等しい 2辺の間の角ではない（間の角は ∠${angName(V1, v, short)}）。`;
  }
  return [`等しいのは、${els.map((e) => elText(e, V1, V2, short)).join("、")}。`, mid, key === "NONE" ? "だから、3つの合同条件のどれにもあてはまらない。" : `だから、合同条件は「${COND[key]}」。`];
}
/**
 * 合同条件を聞く問題。intro＋等しいもの 3つ＋outro。kinds＝{ SSS: [組, …], SAS: […], ASA: […], NONE: […] }（等しいものの組。空の種類は出さない）。
 * 答えが、種類ごとに同じくらい出る。
 */
function condQ(r, N, { intro, outro = "。三角形の合同条件のうち、あてはまるものは？", V1, V2, kinds, short = false }) {
  const key = pick(r, Object.keys(kinds).filter((k) => kinds[k].length));
  const els0 = pick(r, kinds[key]);
  if (judge(els0) !== key) throw new Error(`種類がちがう: ${key}`);
  return {
    q: N(`${intro}${shuffle(r, els0).map((e) => elText(e, V1, V2, short)).join("、")}${outro}`),
    ans: COND[key],
    choices: condChoices(r, key),
    hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
    steps: condSteps(els0, V1, V2, key, short).map(N),
  };
}

// ── 線分 AB と CD が点 O で交わる図（AO＝BO のような形）の、証明の穴うめ ──
/**
 * 三角形 △AOC と △BOD の証明。kind＝asa（AO＝BO、∠OAC＝∠OBD）／sas（AO＝BO、CO＝DO）／sss（AO＝BO、CO＝DO、AC＝BD）。
 * 空欄の候補：eq3（③の行ぜんぶ＝どの角が等しいか。sss の証明にはない）／cond（合同条件）。
 * 「仮定より」「対頂角」「対応する辺（角）は等しい」の語の空欄は、正解が 1〜2通りしかなく、問題を読まずに絞りこめてしまうので、つくらない。
 */
function xbowProof(r, kind) {
  const V1 = ["A", "O", "C"], V2 = ["B", "O", "D"], t1 = "△AOC", t2 = "△BOD";
  const spec = {
    asa: { els: [SIDE(0, 1), ANG(0), ANG(1)], concls: [SIDE(0, 2), SIDE(1, 2), ANG(2)], w: { eq3: 2, cond: 2 } },
    sas: { els: [SIDE(0, 1), SIDE(1, 2), ANG(1)], concls: [SIDE(0, 2), ANG(0), ANG(2)], w: { eq3: 2, cond: 2 } },
    sss: { els: [SIDE(0, 1), SIDE(1, 2), SIDE(0, 2)], concls: [ANG(0), ANG(2)], w: { cond: 2 } },
  }[kind];
  const key = judge(spec.els), vert = "∠AOC＝∠BOD";
  const hyps = kind === "sss" ? spec.els.map((e) => elText(e, V1, V2)) : spec.els.filter((e) => !(e.k === "a" && e.i === 1)).map((e) => elText(e, V1, V2));
  const c = pick(r, spec.concls), conclTx = elText(c, V1, V2);
  const others = ["SSS", "SAS", "ASA"].filter((k) => k !== key).map((k) => COND[k]);
  const holes = {
    cond: { w: spec.w.cond, ans: COND[key], pool: [...others, "3組の角"], steps: condSteps(spec.els, V1, V2, key) },
  };
  if (kind !== "sss") {
    holes.eq3 = { w: spec.w.eq3, ans: vert, pool: ["∠COB＝∠DOA", "∠OCA＝∠ODB", "∠AOC＝∠COB"], steps: [`${t1} の ∠AOC に対応する、${t2} の角は ∠BOD。`, "∠AOC と ∠BOD は、向かい合う角（対頂角）だから等しい。"] };
  }
  return {
    head: `線分 AB と CD が点 O で交わり、${hyps.join("、")} ならば、${conclTx} である。`,
    holes,
    lines: (k) => [
      `${t1} と ${t2} において`,
      kind === "sss" ? `仮定より　${hyps[0]} …①　　${hyps[1]} …②　　${hyps[2]} …③` : `仮定より　${hyps[0]} …①　　${hyps[1]} …②`,
      ...(kind === "sss" ? [] : [k === "eq3" ? "（　） …③" : `対頂角は等しいから　${vert} …③`]),
      `①、②、③より、${k === "cond" ? "（　）" : COND[key]}が、それぞれ等しいから　${t1}≡${t2}`,
      `合同な図形の、対応する${c.k === "s" ? "辺" : "角"}は等しいから　${conclTx}`,
    ],
  };
}
/** 証明の穴うめの問題をつくる。proof＝{ head, holes, lines(穴の名前) }。穴は、出やすさ w で選ぶ */
function proofQ(r, N, proof) {
  const keys = Object.keys(proof.holes), k = pickW(r, keys, Object.fromEntries(keys.map((x) => [x, proof.holes[x].w])));
  const h = proof.holes[k], ans = N(h.ans);
  return {
    q: N(`${proof.head}次は、その証明である。（　）にあてはまるものは？\n${proof.lines(k).join("\n")}`),
    ans,
    choices: choices4(r, ans, pickWrongs(r, ans, h.pool.map(N))),
    hint: "証明は、等しいものを3つ示す行、合同条件の行、合同から結論を導く行の順に書いた。空欄は、何を書くところかな？",
    steps: h.steps.map(N),
  };
}

// ── 平行線と角 ───────────────────────────────────────────
// ℓ∥m（ℓ が上、m が下）。直線 n が、ℓ と A、m と B で交わる。ℓ 上に A の左 C・右 D、m 上に B の左 E・右 F、n 上に A より上 G・B より下 H。
// 角の位置：UR＝右上、UL＝左上、DR＝右下、DL＝左下（A と B のそれぞれで）。pt 0＝A、pt 1＝B。
const PAR_SETUP = "ℓ∥m で、ℓ が上、m が下にある。直線 n が、ℓ と点 A、m と点 B で交わっている。ℓ 上に、A の左に点 C、右に点 D をとり、m 上に、B の左に点 E、右に点 F をとる。また、n 上に、A より上に点 G、B より下に点 H をとる。";
const ANG8 = {
  0: { UR: "GAD", UL: "GAC", DR: "BAD", DL: "BAC" },
  1: { UR: "ABF", UL: "ABE", DR: "HBF", DL: "HBE" },
};
const flipV = (p) => (p[0] === "U" ? "D" : "U") + p[1];
const flipH = (p) => p[0] + (p[1] === "R" ? "L" : "R");
const opposite = (p) => flipV(flipH(p));
const cls8 = (p) => (p === "UR" || p === "DL" ? 0 : 1);    // 0＝∠α と等しい角、1＝180°−∠α の角
const interior = (n) => (n.pt === 0 ? n.pos[0] === "D" : n.pos[0] === "U");   // ℓ と m のあいだがわの角
const POS4 = ["UR", "UL", "DR", "DL"];
const NODES8 = [0, 1].flatMap((pt) => POS4.map((pos) => ({ pt, pos })));
const nodeKey = (n) => `${n.pt}${n.pos}`;
/** 角 n から 1回で行ける角と、その理由（錯角は、内がわの角どうしだけ） */
const moves = (n) => [
  ...(interior(n) ? [{ to: { pt: 1 - n.pt, pos: opposite(n.pos) }, kind: "alt" }] : []),
  { to: { pt: 1 - n.pt, pos: n.pos }, kind: "corr" },
  { to: { pt: n.pt, pos: opposite(n.pos) }, kind: "vert" },
  { to: { pt: n.pt, pos: flipV(n.pos) }, kind: "line" },
  { to: { pt: n.pt, pos: flipH(n.pos) }, kind: "line" },
];
/** 角 a から角 b までの、いちばん短い道すじ（幅優先）：[{ from, to, kind }, …] */
function route(a, b) {
  const seen = new Map([[nodeKey(a), []]]);
  const queue = [a];
  while (queue.length) {
    const cur = queue.shift();
    if (nodeKey(cur) === nodeKey(b)) return seen.get(nodeKey(cur));
    for (const m of moves(cur)) {
      if (!seen.has(nodeKey(m.to))) { seen.set(nodeKey(m.to), [...seen.get(nodeKey(cur)), { from: cur, to: m.to, kind: m.kind }]); queue.push(m.to); }
    }
  }
  throw new Error("道すじがない");
}
/** 角 a の大きさが v0 のとき、角 b の大きさ。道すじの解説（1行ずつ）と、答え */
function parWalk(a, b, v0) {
  let v = v0;
  const steps = route(a, b).map((s) => {
    const nm = ANG8[s.to.pt][s.to.pos], from = ANG8[s.from.pt][s.from.pos];
    if (s.kind === "line") { const nv = 180 - v; const t1 = `一直線の角は 180° だから、∠${nm}＝180°−${v}°＝${nv}°`; v = nv; return t1; }
    const word = { vert: "対頂角", corr: "平行線の同位角", alt: "平行線の錯角" }[s.kind];
    return `${word}は等しいから、∠${nm}＝∠${from}＝${v}°`;
  });
  return { steps, v };
}
/** 平行線と角の問題：角 a の大きさが g のとき、角 b の大きさ。道すじの解説つき */
function parProblem(r, a, b) {
  const N = namer(r, 8);
  const g = pick(r, [r(35, 85), r(95, 145)]);
  const { steps, v } = parWalk(a, b, g);
  const ans = cls8(a.pos) === cls8(b.pos) ? g : 180 - g;
  if (v !== ans) throw new Error("道すじと答えが合わない");
  return {
    q: N(`${PAR_SETUP}∠${ANG8[a.pt][a.pos]}＝${g}° のとき、∠${ANG8[b.pt][b.pos]} の大きさは何度か。`),
    ans,
    unit: "度",
    hint: "平行な2直線に1本の直線が交わるとき、同位角や錯角はどうなるかな？ 対頂角や、一直線の角は？",
    steps: steps.map(N),
  };
}
/**
 * 平行線と角の問題（角の大きさを言わず、同じ点にできる 2つの角 X、Y の関係「X は Y の k倍」「X は Y より d° 大きい」を言う）。
 * X＋Y＝180°（一直線の角）から X、Y を出し、同位角・錯角・対頂角で、別の角 b にうつす。答えは、問題文の数字にない。
 * far＝true なら、b は X、Y とはちがう点（A か B）の角。
 */
function relProblem(r, far) {
  const N = namer(r, 8);
  const pt0 = r(0, 1), p1 = pick(r, POS4), p2 = pick(r, [flipV(p1), flipH(p1)]);
  const X = { pt: pt0, pos: p1 }, Y = { pt: pt0, pos: p2 };   // X が大きいほうの角
  const times = r(0, 1) === 0;
  const k = pick(r, [2, 3, 4, 5]), d = pick(r, [20, 40, 60, 80, 100]);
  const y = times ? 180 / (k + 1) : (180 - d) / 2, x = times ? y * k : (180 + d) / 2;
  const b = pick(r, NODES8.filter((n) => nodeKey(n) !== nodeKey(X) && nodeKey(n) !== nodeKey(Y) && (!far || n.pt !== pt0)));
  const src = cls8(b.pos) === cls8(X.pos) ? X : Y, v0 = src === X ? x : y;
  const { steps, v } = parWalk(src, b, v0);
  const nx = ANG8[X.pt][X.pos], ny = ANG8[Y.pt][Y.pos];
  return {
    q: N(`${PAR_SETUP}∠${nx} は ∠${ny} ${times ? `の ${k}倍` : `より ${d}° 大きい`}。∠${ANG8[b.pt][b.pos]} の大きさは何度か。`),
    ans: v,
    unit: "度",
    hint: "平行な2直線に1本の直線が交わるとき、同位角や錯角はどうなるかな？ 対頂角や、一直線の角は？",
    steps: [
      times
        ? `∠${nx}＋∠${ny}＝180°（一直線の角）で、∠${nx} は ∠${ny} の ${k}倍だから、∠${ny}＝180°÷(${k}+1)＝${y}°、∠${nx}＝${y}°×${k}＝${x}°。`
        : `∠${nx}＋∠${ny}＝180°（一直線の角）で、∠${nx} は ∠${ny} より ${d}° 大きいから、∠${ny}＝(180°−${d}°)÷2＝${y}°、∠${nx}＝${y}°+${d}°＝${x}°。`,
      ...steps,
    ].map(N),
  };
}
/**
 * 平行線と角の問題（角 a の大きさ g を言って、a と同じ大きさの角 2つ（または 180°−g の角 2つ）の「和」を聞く）。
 * 答えは 2g か 360°−2g で、問題文の数字にも、180°−g にもならない。far＝true なら、2つの角は a とはちがう点（A か B）の角。
 */
function sumProblem(r, far) {
  const N = namer(r, 8);
  const a = pick(r, NODES8), g = pick(r, [r(35, 85), r(95, 145)]);
  const same = r(0, 1) === 0;
  const pool = NODES8.filter((n) => nodeKey(n) !== nodeKey(a) && (cls8(n.pos) === cls8(a.pos)) === same && (!far || n.pt !== a.pt));
  const [b, c] = sample(r, pool, 2);
  const w1 = parWalk(a, b, g), w2 = parWalk(a, c, g);
  const ans = same ? 2 * g : 360 - 2 * g;
  if (w1.v + w2.v !== ans) throw new Error("道すじと答えが合わない");
  const nb = ANG8[b.pt][b.pos], nc = ANG8[c.pt][c.pos];
  return {
    q: N(`${PAR_SETUP}∠${ANG8[a.pt][a.pos]}＝${g}° のとき、∠${nb} と ∠${nc} の大きさの和は何度か。`),
    ans,
    unit: "度",
    hint: "平行な2直線に1本の直線が交わるとき、同位角や錯角はどうなるかな？ 対頂角や、一直線の角は？ まず、それぞれの角の大きさを求めよう。",
    steps: [...w1.steps, ...w2.steps, `∠${nb}＋∠${nc}＝${w1.v}°＋${w2.v}°＝${ans}°。`].map(N),
  };
}
const PAIRS = (f) => NODES8.flatMap((a) => NODES8.filter((b) => nodeKey(a) !== nodeKey(b) && f(a, b)).map((b) => [a, b]));
const CROSS = PAIRS((a, b) => cls8(a.pos) !== cls8(b.pos));                                // 答えが 180°−（与えられた角）
const CROSS_PT = PAIRS((a, b) => cls8(a.pos) !== cls8(b.pos) && a.pt !== b.pt);             // 2つの角が、A と B にわかれている（答えは 180°−（与えられた角）。道すじは 2回）

// ── 角の問題の、ことばを整える ──
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

export const UNITS = [
  unit("14", {
    name: "平行と合同のまとめ（平行線と角・多角形の角・合同・証明）",
    desc: "平行線と角、三角形と多角形の角、三角形の合同条件、証明の組み立てを、まとめて確かめる",
    prereqs: ["J2-hk13"],
    points: [
      "平行な2直線に1本の直線が交わるとき、同位角も錯角も等しい。向かい合う角（対頂角）は等しく、一直線の角は 180°。",
      "三角形の内角の和は 180°。三角形の外角は、それととなり合わない 2つの内角の和に等しい。$n$ 角形の内角の和は $180\\times(n-2)$°、外角の和は 360°。正 $n$ 角形の外角は、すべて等しい。",
      "三角形の合同条件は 3つ。3組の辺／2組の辺とその間の角／1組の辺とその両端の角が、それぞれ等しい。合同な図形では、対応する辺や角は等しい。",
      "証明は、仮定から出発して、根拠（性質）をあげながら、結論までみちびく。図の見た目では、根拠にならない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 14d01a 演習（1）①平行線と角：一直線の角と同位角（など）で、角の大きさを求める
        t("14d01a", (r) => {
          const m = r(0, 9);
          if (m < 4) { const [a, b] = pick(r, CROSS); return parProblem(r, a, b); }   // 角の大きさを 1つ言って、聞く（答えは 180°−その角）
          if (m < 7) return relProblem(r, false);                                      // 2つの角の関係（○倍・○°大きい）を言って、聞く（答えは問題文にない数）
          return sumProblem(r, false);                                                 // 角の大きさを 1つ言って、2つの角の和を聞く（答えは 2g か 360°−2g）
        }),
        // 14d01b 演習（1）②三角形の内角の和（外角の問いも）
        t("14d01b", (r) => {
          const N = namer(r, 4);
          const ext = r(0, 1) === 1;
          if (!ext) {
            const v = r(0, 2), others = [0, 1, 2].filter((x) => x !== v), x = r(35, 85), y = r(35, 85), z = 180 - x - y;
            if (z < 25 || z > 100 || z === x || z === y) return { skip: true };
            const nm = ["A", "B", "C"];
            return {
              q: N(`△ABC で、∠${nm[others[0]]}＝${x}°、∠${nm[others[1]]}＝${y}° のとき、∠${nm[v]} の大きさは何度か。`),
              ans: z,
              unit: "度",
              hint: "三角形の内角の和は何度だったかな？ 辺をのばしてできる外角には、どんな性質があったかな？",
              steps: [`三角形の内角の和は 180° だから、∠${nm[v]}＝180°−(${x}°+${y}°)＝${z}°。`].map(N),
            };
          }
          const v = r(0, 2), prev = (v + 2) % 3, next = (v + 1) % 3, nm = ["A", "B", "C"], x = r(30, 80), y = r(30, 80), z = x + y;
          if (z > 150 || x === y) return { skip: true };
          return {
            q: N(`△ABC で、∠${nm[prev]}＝${x}°、∠${nm[next]}＝${y}° である。辺 ${nm[prev]}${nm[v]} を ${nm[v]} のほうへのばした直線上に点 D をとる。∠${nm[next]}${nm[v]}D の大きさは何度か。`),
            ans: z,
            unit: "度",
            hint: "三角形の内角の和は何度だったかな？ 辺をのばしてできる外角には、どんな性質があったかな？",
            steps: [`三角形の外角は、それととなり合わない 2つの内角の和に等しいから、∠${nm[next]}${nm[v]}D＝∠${nm[prev]}＋∠${nm[next]}＝${x}°+${y}°＝${z}°。`].map(N),
          };
        }),
        // 14d01c 演習（1）③四角形（五角形）の内角の和から、のこりの角
        t("14d01c", (r) => {
          const n = pick(r, [4, 4, 5]), N = namer(r, n), total = 180 * (n - 2);
          const ang = Array.from({ length: n - 1 }, () => r(60, 140));
          const last = total - sum(ang);
          if (last < 40 || last > 150) return { skip: true };
          const miss = r(0, n - 1), all = [...ang.slice(0, miss), last, ...ang.slice(miss)];
          const nm = CAN.slice(0, n).split(""), given = nm.map((c, i) => [c, all[i]]).filter((_, i) => i !== miss);
          return {
            q: N(`${n === 4 ? "四角形" : "五角形"} ${nm.join("")} で、${given.map(([c, v]) => `∠${c}＝${v}°`).join("、")} のとき、∠${nm[miss]} の大きさは何度か。`),
            ans: last,
            unit: "度",
            hint: `${n === 4 ? "四角形" : "五角形"}の内角の和は、どんな式で求めたかな？`,
            steps: [`${n === 4 ? "四角形" : "五角形"}の内角の和は 180°×(${n}−2)＝${total}°。`, `∠${nm[miss]}＝${total}°−(${given.map(([, v]) => `${v}°`).join("+")})＝${last}°。`].map(N),
          };
        }),
        // 14d02a 演習（2）①n角形の内角の和
        t("14d02a", (r) => {
          const n = r(7, 14);
          return {
            q: `${gon(n)}の内角の和は何度か。`,
            ans: 180 * (n - 2),
            unit: "度",
            hint: "n角形の内角の和は、どんな式で求めたかな？ 1つの頂点から対角線をひくと、三角形はいくつできる？",
            steps: [`${gon(n)}の内角の和は、180°×(${n}−2)＝${180 * (n - 2)}°。`],
          };
        }),
        // 14d02b 演習（2）②正n角形の 1つの内角
        t("14d02b", (r) => {
          const n = pick(r, DIV360.filter((x) => x >= 8)), ex = 360 / n, ans = 180 - ex;
          return {
            q: `${rgon(n)}の 1つの内角は何度か。`,
            ans,
            unit: "度",
            hint: "正多角形の外角は、すべて等しいね。外角の和は何度だったかな？ 内角と外角の関係は？",
            steps: [`外角の和は 360° だから、1つの外角は 360°÷${n}＝${ex}°。`, `内角は 180°−${ex}°＝${ans}°。`],
          };
        }),
        // 14d02c 演習（2）③1つの外角から、正何角形か
        t("14d02c", (r) => {
          const n = pick(r, [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]), ex = 360 / n;
          return {
            q: `1つの外角が ${ex}° の正多角形は、正何角形か。「正□角形」の □ にあてはまる数は？`,
            ans: n,
            hint: "多角形の外角の和は何度だったかな？ 正多角形の外角は、すべて等しいね。",
            steps: [`外角の和は 360° で、1つの外角が ${ex}° だから、360°÷${ex}°＝${n}。`, `正${n}角形。`],
          };
        }),
        // 14q01 小テスト（1）平行線と角：A と B にわかれた角どうし（同位角・錯角・対頂角・一直線の角）
        t("14q01", (r) => {
          const m = r(0, 9);
          if (m < 4) { const [a, b] = pick(r, CROSS_PT); return parProblem(r, a, b); }
          if (m < 7) return relProblem(r, true);
          return sumProblem(r, true);
        }),
        // 14q02a 小テスト（2）①n角形の内角の和
        t("14q02a", (r) => {
          const n = r(11, 16);
          return {
            q: `${gon(n)}の内角の和は何度か。`,
            ans: 180 * (n - 2),
            unit: "度",
            hint: "n角形の内角の和は、どんな式で求めたかな？",
            steps: [`${gon(n)}の内角の和は、180°×(${n}−2)＝${180 * (n - 2)}°。`],
          };
        }),
        // 14q02b 小テスト（2）②正n角形の 1つの外角
        t("14q02b", (r) => {
          const n = pick(r, DIV360.filter((x) => x >= 9)), ans = 360 / n;
          return {
            q: `${rgon(n)}の 1つの外角は何度か。`,
            ans,
            unit: "度",
            hint: "多角形の外角の和は何度だったかな？ 正多角形の外角は、すべて等しいね。",
            steps: [`外角の和は 360° で、正${n}角形の外角は ${n}個とも等しいから、360°÷${n}＝${ans}°。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 14d03 演習（3）ℓ∥m：折れ線 A−C−B（C は ℓ と m のあいだ）で ∠ACB ＝ ∠DAC ＋ ∠EBC
        t("14d03", (r) => {
          const N = namer(r, 5), a = r(20, 80), b = r(20, 80), ans = a + b;
          if (a === b) return { skip: true };
          const left = r(0, 1) === 0;
          return {
            q: N(`ℓ∥m で、ℓ が上、m が下にある。ℓ 上に点 A、m 上に点 B、ℓ と m のあいだに点 C をとり、線分 AC、BC をひく。A と B は、どちらも C より${left ? "左" : "右"}にある。ℓ 上に、A の${left ? "右" : "左"}に点 D、m 上に、B の${left ? "右" : "左"}に点 E をとる。∠DAC＝${a}°、∠EBC＝${b}° のとき、∠ACB の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "平行線の錯角や同位角を使うには、図に、どんな線をかき足せばいいかな？",
            steps: [
              "C を通り、ℓ に平行な直線をひく。ℓ∥m だから、この直線は m にも平行。",
              `∠ACB は、この直線で 2つに分かれ、それぞれ錯角が等しいから、∠DAC＝${a}° と ∠EBC＝${b}° に等しい。`,
              `∠ACB＝${a}°+${b}°＝${ans}°。`,
            ].map(N),
          };
        }),
        // 14d04a 演習（4）合同といえるもの（または、いえないもの）を選ぶ
        t("14d04a", (r) => {
          const N = namer(r, 6), V1 = ["A", "B", "C"], V2 = ["D", "E", "F"];
          const SSSs = [[SIDE(0, 1), SIDE(1, 2), SIDE(2, 0)]];
          const SASs = [0, 1, 2].map((v) => [SIDE(v, (v + 1) % 3), SIDE(v, (v + 2) % 3), ANG(v)]);
          const ASAs = [0, 1, 2].map((s) => [SIDE(s, (s + 1) % 3), ANG(s), ANG((s + 1) % 3)]);
          const SSAs = [0, 1, 2].flatMap((v) => [(v + 1) % 3, (v + 2) % 3].map((w) => [SIDE(v, (v + 1) % 3), SIDE(v, (v + 2) % 3), ANG(w)]));
          const AAAs = [[ANG(0), ANG(1), ANG(2)]];
          const pos = r(0, 1) === 0;   // 「合同といえるもの」を選ぶか、「合同といえないもの」を選ぶか
          const picked = pos
            ? [pick(r, pick(r, [SSSs, SASs, ASAs])), AAAs[0], ...sample(r, SSAs, 2)]
            : [pick(r, pick(r, [SSAs, AAAs])), pick(r, SSSs), pick(r, SASs), pick(r, ASAs)];   // 3組の辺・2組の辺とその間の角・1組の辺とその両端の角を 1つずつ
          const items = picked.map((els, n) => ({ isAns: n === 0, els, tx: shuffle(r, els).map((e) => elText(e, V1, V2, true)).join("、"), key: judge(els) }));
          const say = (it) => (it.key === "SSS" ? "3組の辺が、それぞれ等しい" : it.key === "SAS" ? "2組の辺とその間の角が、それぞれ等しい" : it.key === "ASA" ? "1組の辺とその両端の角が、それぞれ等しい"
            : it.els.every((e) => e.k === "a") ? "3組の角だけでは、大きさがちがう三角形もある" : `∠${V1[it.els.find((e) => e.k === "a").i]} は、等しい 2辺の間の角ではない`);
          return {
            q: N(`△ABC と △DEF について、次のうち、${pos ? "△ABC≡△DEF といえるもの" : "△ABC≡△DEF といえないもの"}はどれか。`),
            ans: N(items[0].tx),
            choices: choices4(r, N(items[0].tx), items.slice(1).map((it) => N(it.tx))),
            hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
            steps: shuffle(r, items).map((it) => N(`${it.tx} … ${say(it)}から、合同${it.key === "NONE" ? "といえない" : "といえる"}${it.isAns ? "　← 答え" : ""}`)),
          };
        }),
        // 14d04b 演習（4）条件から、合同条件を答える（答えが、3組の辺・2組の辺とその間の角・1組の辺とその両端の角・あてはまらない、のどれも、同じくらい出る）
        t("14d04b", (r) => {
          const N = namer(r, 6);
          return condQ(r, N, {
            intro: "△ABC と △DEF で、", outro: " のとき、三角形の合同条件のうち、あてはまるものは？",
            V1: ["A", "B", "C"], V2: ["D", "E", "F"], short: true,
            kinds: { SSS: TRI.SSS, SAS: TRI.SAS, ASA: TRI.ASA, NONE: [...TRI.SSA, ...TRI.AAA, ...TRI.AAA, ...TRI.AAA] },
          });
        }),
        // 14d04c 演習（4）の続き：△ABC≡△DEF のとき、対応する角の大きさ（三角形の内角の和もつかう）
        t("14d04c", (r) => {
          const N = namer(r, 6), V1 = ["A", "B", "C"], V2 = shuffle(r, ["D", "E", "F"]);
          const i = r(0, 2), j = (i + r(1, 2)) % 3, k = 3 - i - j;
          const a = r(30, 100), b = r(30, 100), c = 180 - a - b;
          if (c < 15 || c === a || c === b || a === b) return { skip: true };
          const askSecond = r(0, 1) === 1;
          return {
            q: N(`△${V1.join("")}≡△${V2.join("")} である。∠${V1[i]}＝${a}°、∠${V2[j]}＝${b}° のとき、∠${askSecond ? V2[k] : V1[k]} の大きさは何度か。`),
            ans: c,
            unit: "度",
            hint: "合同な図形の、対応する角はどうなるかな？ 三角形の内角の和は何度だったかな？",
            steps: [
              `対応する頂点は、${V1.map((p, m) => `${p}と${V2[m]}`).join("、")}。`,
              `∠${V2[j]}＝∠${V1[j]}＝${b}° だから、△${V1.join("")} の内角は、∠${V1[i]}＝${a}°、∠${V1[j]}＝${b}°。`,
              `∠${V1[k]}＝180°−${a}°−${b}°＝${c}°${askSecond ? `。対応する角は等しいから、∠${V2[k]}＝${c}°` : ""}。`,
            ].map(N),
          };
        }),
        // 14d04d 演習（4）の続き：△ABC≡△DEF のとき、必ず成り立つもの（対応する辺・角）を選ぶ
        t("14d04d", (r) => {
          const N = namer(r, 6), V1 = ["A", "B", "C"], V2 = shuffle(r, ["D", "E", "F"]);
          const sidesAll = [[0, 1], [1, 2], [2, 0]];
          const sideEq = (i, j, i2, j2) => `${V1[i]}${V1[j]}＝${V2[i2]}${V2[j2]}`;
          const angEq = (i, j) => `∠${V1[i]}＝∠${V2[j]}`;
          // 対応している組（辺3・角3）が正解の候補、対応していない組（辺6・角6）が誤答の候補。辺か角かで、正解を当てられないようにする
          const right = [...sidesAll.map(([i, j]) => sideEq(i, j, i, j)), ...[0, 1, 2].map((i) => angEq(i, i))];
          const wrong = [...sidesAll.flatMap(([i, j]) => sidesAll.filter(([p, q]) => !(p === i && q === j)).map(([i2, j2]) => sideEq(i, j, i2, j2))), ...[0, 1, 2].flatMap((i) => oth(i).map((j) => angEq(i, j)))];
          const ansT = pick(r, right);
          const ws = pickWrongs(r, ansT, wrong);
          return {
            q: N(`△${V1.join("")}≡△${V2.join("")} のとき、次のうち、必ず成り立つものはどれか。`),
            ans: N(ansT),
            choices: choices4(r, N(ansT), ws.map(N)),
            hint: "合同な図形を「≡」で書くとき、対応する頂点は、どんな順にならべたかな？",
            steps: [
              `対応する頂点は、${V1.map((p, m) => `${p}と${V2[m]}`).join("、")}。`,
              `対応する辺や角は等しいから、必ず成り立つのは「${ansT}」。`,
              "ほかの選択肢は、対応していない辺や角をくらべているから、等しいとは限らない。",
            ].map(N),
          };
        }),
        // 14q02c 小テスト（2）③1つの内角から、正何角形か
        t("14q02c", (r) => {
          const n = pick(r, DIV360), ex = 360 / n, inn = 180 - ex;
          return {
            q: `1つの内角が ${inn}° の正多角形は、正何角形か。「正□角形」の □ にあてはまる数は？`,
            ans: n,
            hint: "1つの内角と、となり合う1つの外角を、あわせると何度になるかな？ 外角の和は何度だったかな？",
            steps: [`外角は 180°−${inn}°＝${ex}°。`, `外角の和は 360° だから、360°÷${ex}°＝${n}。正${n}角形。`],
          };
        }),
        // 14q03a 小テスト（3）線分 AB と CD が点 O で交わる図の、証明の穴うめ（AO＝BO、∠OAC＝∠OBD ／ AO＝BO、CO＝DO ／ AO＝BO、CO＝DO、AC＝BD の、3つの証明のどれか）
        t("14q03a", (r) => {
          const N = namer(r, 4, "O");
          // 合同条件の空欄の答えが、3つとも同じくらい出るように（sss の証明は、空欄の候補が合同条件だけなので、重みを小さくする）
          return proofQ(r, N, xbowProof(r, pick(r, ["asa", "asa", "sas", "sas", "sss"])));
        }),
        // 14q03b 小テスト（3）の続き：△AOC≡△BOD の対応する角（∠ODB）
        t("14q03b", (r) => {
          const N = namer(r, 4, "O"), a = r(30, 80), b = r(40, 110), c = 180 - a - b;
          if (c < 15 || c === a || c === b) return { skip: true };
          return {
            q: N(`線分 AB と CD が点 O で交わり、AO＝BO、∠OAC＝∠OBD である。∠OAC＝${a}°、∠AOC＝${b}° のとき、∠ODB の大きさは何度か。`),
            ans: c,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 三角形の内角の和は何度だったかな？",
            steps: [
              "△AOC と △BOD は、AO＝BO、∠OAC＝∠OBD、∠AOC＝∠BOD（対頂角）で、1組の辺とその両端の角が等しく合同。",
              `対応する角は等しいから、∠ODB＝∠OCA。`,
              `△AOC の内角の和は 180° だから、∠OCA＝180°−${a}°−${b}°＝${c}°。よって ∠ODB＝${c}°。`,
            ].map(N),
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 14d05a 演習（5）M は AB の中点、AC∥DB：△AMC≡△BMD の対応する角（∠MDB など）
        t("14d05a", (r) => {
          const N = namer(r, 4, "M"), a = r(30, 80), b = r(40, 110), c = 180 - a - b;
          if (c < 15 || c === a || c === b) return { skip: true };
          const flip = r(0, 1) === 1;
          const setup = "線分 AB の中点を M とする。M を通る線分 CD を、C が AB の上がわ、D が下がわになるようにひく（M は CD 上にある）。AC∥DB である。";
          return {
            q: N(flip
              ? `${setup}∠MBD＝${a}°、∠BMD＝${b}° のとき、∠MCA の大きさは何度か。`
              : `${setup}∠MAC＝${a}°、∠AMC＝${b}° のとき、∠MDB の大きさは何度か。`),
            ans: c,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 三角形の内角の和は何度だったかな？",
            steps: [
              "M は AB の中点だから AM＝BM。AC∥DB より、平行線の錯角は等しいから ∠MAC＝∠MBD。対頂角は等しいから ∠AMC＝∠BMD。",
              "よって、△AMC≡△BMD（1組の辺とその両端の角が、それぞれ等しい）。対応する角は等しいから、∠MCA＝∠MDB。",
              flip ? `△BMD の内角の和は 180° だから、∠MDB＝180°−${a}°−${b}°＝${c}°。よって ∠MCA＝${c}°。` : `△AMC の内角の和は 180° だから、∠MCA＝180°−${a}°−${b}°＝${c}°。よって ∠MDB＝${c}°。`,
            ].map(N),
          };
        }),
        // 14d05b 演習（5）CM＝DM の利用：AB と CM の長さから、AM＋DM
        t("14d05b", (r) => {
          const N = namer(r, 4, "M"), ab = 2 * r(3, 10), cm = r(3, 12), ans = ab / 2 + cm;
          return {
            q: N(`線分 AB の中点を M とする。M を通る線分 CD を、C が AB の上がわ、D が下がわになるようにひく（M は CD 上にある）。AC∥DB である。AB＝${ab}cm、CM＝${cm}cm のとき、AM の長さと DM の長さの和は何cmか。`),
            ans,
            unit: "cm",
            hint: "中点とは、どんな点だったかな？ 合同になる三角形はどれかな？ 合同な図形の、対応する辺はどうなる？",
            steps: [
              `M は AB の中点だから、AM＝${ab}÷2＝${ab / 2}(cm)。`,
              `△AMC≡△BMD（1組の辺とその両端の角が等しい）で、対応する辺は等しいから、DM＝CM＝${cm}cm。`,
              `AM＋DM＝${ab / 2}＋${cm}＝${ans}(cm)。`,
            ].map(N),
          };
        }),
        // 14d05c 演習（5）証明の各行の根拠（中点・錯角・対頂角）／合同条件（3つの等式だけを使う。3組の辺・2組の辺とその間の角・1組の辺とその両端の角）
        t("14d05c", (r) => {
          const N = namer(r, 4, "M");
          const head = "線分 AB の中点を M とする。M を通る線分 CD を、C が AB の上がわ、D が下がわになるようにひく（M は CD 上にある）。AC∥DB である。CM＝DM を証明するために、△AMC と △BMD の合同を示す。";
          const k = pick(r, ["mid", "alt", "vert", "cond"]);
          if (k === "cond") {
            return condQ(r, N, {
              intro: `${head}次の 3つだけがわかっている（ほかのことは使わない）。`,
              V1: ["A", "M", "C"], V2: ["B", "M", "D"],
              kinds: { SSS: TRI.SSS, SAS: TRI.SAS, ASA: TRI.ASA },
            });
          }
          // 3つの根拠（中点・錯角・対頂角）は、どれも、どこかで正解になる。のこり 1つは、いつも誤答
          const U = { mid: "M は AB の中点だから", alt: "平行線の錯角は等しいから", vert: "対頂角は等しいから" };
          const far = ["平行線の同位角は等しいから", "M は CD の中点だから"];
          const eq = { mid: "AM＝BM", alt: "∠MAC＝∠MBD", vert: "∠AMC＝∠BMD" }[k];
          const ans = N(U[k]), fixed = ["mid", "alt", "vert"].filter((x) => x !== k).map((x) => N(U[x]));
          const why = { mid: ["AM と BM は、AB を 2つに分けた線分。M は AB の中点（真ん中の点）。", "だから、根拠は「M は AB の中点だから」。"], alt: ["AC∥DB で、直線 AB が 2直線に交わっている。C と D は、AB をはさんで反対がわにある。", "だから、∠MAC と ∠MBD は錯角。根拠は「平行線の錯角は等しいから」。"], vert: ["直線 AB と CD が M で交わってできる、向かい合う角。", "だから、根拠は「対頂角は等しいから」。"] }[k];
          return {
            q: N(`${head}${eq} と書く根拠として、正しいものは、次のうちどれか。`),
            ans,
            choices: choices4(r, ans, [...fixed, ...pickWrongs(r, ans, far.map(N), 1)]),
            hint: "証明の各行で、等しいと書いたわけを思い出そう。どんな性質を使ったかな？",
            steps: why.map(N),
          };
        }),
        // 14d06 演習（6）内角が外角の k倍（または、外角より ○° 大きい）正多角形は、正何角形か
        t("14d06", (r) => {
          const mode = pick(r, ["times", "plus"]);
          if (mode === "times") {
            const k = pick(r, [2, 3, 4, 5, 8, 9, 11]), ex = 180 / (k + 1), n = 360 / ex;
            return {
              q: `ある正多角形の 1つの内角は、1つの外角の ${k}倍である。正何角形か。「正□角形」の □ にあてはまる数は？`,
              ans: n,
              hint: "1つの内角と、となり合う1つの外角を、あわせると何度になるかな？ 外角の和は何度だったかな？",
              steps: [
                `1つの外角を $x$° とすると、内角は $${k}x$° と表せる。`,
                `内角と外角の和は 180° だから、$${k}x+x=180$ より、$x=${ex}$。`,
                `外角の和は 360° だから、360÷${ex}＝${n}。正${n}角形。`,
              ],
            };
          }
          const ex = pick(r, [20, 24, 30, 36, 40, 45, 60]), d = 180 - 2 * ex, n = 360 / ex;
          return {
            q: `ある正多角形の 1つの内角は、1つの外角より ${d}° 大きい。正何角形か。「正□角形」の □ にあてはまる数は？`,
            ans: n,
            hint: "1つの内角と、となり合う1つの外角を、あわせると何度になるかな？ 外角の和は何度だったかな？",
            steps: [
              `1つの外角を $x$° とすると、内角は $(x+${d})$° と表せる。`,
              `内角と外角の和は 180° だから、$x+(x+${d})=180$ より、$x=${ex}$。`,
              `外角の和は 360° だから、360÷${ex}＝${n}。正${n}角形。`,
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 14d07a 演習（7）①∠B、∠C の二等分線の交点 I：∠A（または ∠B、∠C）から ∠BIC
        t("14d07a", (r) => {
          const N = namer(r, 3), mode = pick(r, ["A", "BC"]);
          if (mode === "A") {
            const a = 2 * r(15, 70), ans = 90 + a / 2;
            return {
              q: N(`△ABC の ∠B、∠C の二等分線の交点を I とする。∠A＝${a}° のとき、∠BIC の大きさは何度か。`),
              ans,
              unit: "度",
              hint: "三角形の内角の和は何度だったかな？ 角の二等分線は、角を何等分する線かな？",
              steps: [`∠B＋∠C＝180°−${a}°＝${180 - a}°。`, `∠IBC＋∠ICB＝(∠B＋∠C)÷2＝${180 - a}°÷2＝${(180 - a) / 2}°。`, `△IBC の内角の和は 180° だから、∠BIC＝180°−${(180 - a) / 2}°＝${ans}°。`].map(N),
            };
          }
          const b = 2 * r(15, 60), c = 2 * r(15, 60), a = 180 - b - c;
          if (a < 20 || a > 140 || a === b || a === c) return { skip: true };
          const ans = 180 - (b + c) / 2;
          return {
            q: N(`△ABC の ∠B、∠C の二等分線の交点を I とする。∠B＝${b}°、∠C＝${c}° のとき、∠BIC の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "三角形の内角の和は何度だったかな？ 角の二等分線は、角を何等分する線かな？",
            steps: [`∠IBC＝${b}°÷2＝${b / 2}°、∠ICB＝${c}°÷2＝${c / 2}°。`, `△IBC の内角の和は 180° だから、∠BIC＝180°−(${b / 2}°+${c / 2}°)＝${ans}°。`].map(N),
          };
        }),
        // 14d07b 演習（7）②∠A＝a° のとき、∠BIC を a で表す式（4択）。∠B・∠C から表す問い、∠IBC＋∠ICB・∠A などを表す問いもある
        t("14d07b", (r) => {
          const N = namer(r, 3), G = pick(r, ["a", "bc"]);
          const head = "△ABC の ∠B、∠C の二等分線の交点を I とする。";
          // 3つの式は、どれも、どこかで正解になる（聞くものがちがう）。のこり 1つは、いつも誤答
          const spec = G === "a"
            ? {
              given: "∠A＝$a$°", vars: "$a$",
              items: [
                { ask: "∠BIC の大きさ", ans: "$90+\\frac{1}{2}a$", steps: ["∠B＋∠C＝180°−$a$°。二等分線だから、∠IBC＋∠ICB＝$\\frac{1}{2}(180-a)$°。", "△IBC の内角の和は 180° だから、∠BIC＝180°−$\\frac{1}{2}(180-a)$°＝$90+\\frac{1}{2}a$°。"] },
                { ask: "∠IBC と ∠ICB の大きさの和", ans: "$90-\\frac{1}{2}a$", steps: ["∠B＋∠C＝180°−$a$°。", "二等分線だから、∠IBC＋∠ICB＝(∠B＋∠C)÷2＝$\\frac{1}{2}(180-a)$°＝$90-\\frac{1}{2}a$°。"] },
                { ask: "∠B と ∠C の大きさの和", ans: "$180-a$", steps: ["三角形の内角の和は 180° だから、∠B＋∠C＝180°−$a$°。"] },
              ],
              never: ["$180-\\frac{1}{2}a$", "$90+a$", "$\\frac{1}{2}a$", "$2a$"],
            }
            : {
              given: "∠B＝$b$°、∠C＝$c$°", vars: "$b$、$c$",
              items: [
                { ask: "∠BIC の大きさ", ans: "$180-\\frac{1}{2}(b+c)$", steps: ["二等分線だから、∠IBC＝$\\frac{1}{2}b$°、∠ICB＝$\\frac{1}{2}c$°。", "△IBC の内角の和は 180° だから、∠BIC＝180°−($\\frac{1}{2}b+\\frac{1}{2}c$)°＝$180-\\frac{1}{2}(b+c)$°。"] },
                { ask: "∠A の大きさ", ans: "$180-(b+c)$", steps: ["三角形の内角の和は 180° だから、∠A＝180°−($b+c$)°＝$180-(b+c)$°。"] },
                { ask: "∠IBC と ∠ICB の大きさの和", ans: "$\\frac{1}{2}(b+c)$", steps: ["二等分線だから、∠IBC＝$\\frac{1}{2}b$°、∠ICB＝$\\frac{1}{2}c$°。", "和は、$\\frac{1}{2}b+\\frac{1}{2}c=\\frac{1}{2}(b+c)$°。"] },
              ],
              never: ["$90+\\frac{1}{2}(b+c)$", "$90-\\frac{1}{2}(b+c)$", "$b+c$", "$180+\\frac{1}{2}(b+c)$"],
            };
          const item = pick(r, spec.items), fixed = spec.items.filter((x) => x !== item).map((x) => x.ans);
          return {
            q: N(`${head}${spec.given} のとき、${item.ask}（単位は度）を ${spec.vars} を使って表した式として、正しいものは、次のうちどれか。`),
            ans: item.ans,
            choices: choices4(r, item.ans, [...fixed, ...pickWrongs(r, item.ans, spec.never, 1)]),
            hint: "文字を、具体的な数（たとえば 56° など）におきかえて、求める角を計算してみよう。その手順を、文字のままで、たどってみよう。",
            steps: item.steps.map(N),
          };
        }),
        // 14d07c 演習（7）の逆：∠BIC から ∠A
        t("14d07c", (r) => {
          const N = namer(r, 3), a = 2 * r(15, 70), bic = 90 + a / 2;
          return {
            q: N(`△ABC の ∠B、∠C の二等分線の交点を I とする。∠BIC＝${bic}° のとき、∠A の大きさは何度か。`),
            ans: a,
            unit: "度",
            hint: N("∠BIC と、∠IBC＋∠ICB を、あわせると何度になるかな？ 二等分線だから、∠B＋∠C はその何倍？"),
            steps: [
              `△IBC の内角の和は 180° だから、∠IBC＋∠ICB＝180°−${bic}°＝${180 - bic}°。`,
              `二等分線だから、∠B＋∠C＝${180 - bic}°×2＝${2 * (180 - bic)}°。`,
              `△ABC の内角の和は 180° だから、∠A＝180°−${2 * (180 - bic)}°＝${a}°。`,
            ].map(N),
          };
        }),
        // 14q04 小テスト（4）チャレンジ：ℓ∥m の間の折れ線 A−B−C−D：∠BCD ＝ ∠EAB ＋ ∠ABC − ∠CDF
        t("14q04", (r) => {
          const N = namer(r, 6), a = r(30, 70), phi = r(10, 70), e = 180 - a - phi, c = r(30, 80), ans = a + e - c;
          if (ans < 20 || ans > 150 || [a, e, c].includes(ans)) return { skip: true };
          const left = r(0, 1) === 0;
          const h1 = left ? "右" : "左", h2 = left ? "左" : "右";
          return {
            q: N(`ℓ∥m で、ℓ が上、m が下にある。ℓ 上に点 A、m 上に点 D、ℓ と m のあいだに点 B、C をとり、A、B、C、D の順に線分でつなぐ。B は A の${h1}下、C は B の${h1}上、D は C の${h1}下にある。ℓ 上に、A の${h1}に点 E、m 上に、D の${h2}に点 F をとる。∠EAB＝${a}°、∠ABC＝${e}°、∠CDF＝${c}° のとき、∠BCD の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "平行線の錯角や同位角を使うには、図に、どんな線をかき足せばいいかな？",
            steps: [
              `B を通り、ℓ に平行な直線をひく。錯角は等しいから、この直線と BA がつくる角は ${a}°。`,
              `だから、B で、この直線と BC がつくる角は 180°−${e}°−${a}°＝${phi}°。`,
              `C を通る平行線をひくと、錯角が等しいから、C で、BC と平行線がつくる角は ${phi}°、CD と平行線がつくる角は ${c}°。`,
              `∠BCD＝180°−${phi}°−${c}°＝${ans}°。`,
            ].map(N),
          };
        }),
      ],
    },
  }),
];

export const SKIPPED = [];
