// ============================================================
// heikou-01.js — 平行と合同 第1時「2直線が交わってできる角には、どんな関係があるだろう」（対頂角・同位角・錯角）
//   ikkan の演習プリント（heikou-01.dr.1〜7）・小テスト（heikou-01.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「01」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：01d02b ＝ heikou-01.dr.2 の「錯角」
//   図は出せないので、点の名前と位置（O は AB の間にも CD の間にもある／ℓ が上、m が下、P が上の交点、A は P の右、…）を、問題文で言い切る。
//   角度は整数の度。答えは、問題文の数字から計算して出す（対頂角は等しい・一直線の角は 180°）。
//   同位角・錯角の「角の名前」は、頂点と両はしの点の3文字（∠APE など）で決める。8つの角に 0〜7 の番号をつけて、位置関係（同位角・錯角・対頂角…）は番号から決める。
//   答えが問題文の数と同じになる問い（対頂角の大きさ そのもの）は、「2つの対頂角の和」のように聞いて、問題文に答えが出ないようにした。
//   「理由も説明しよう」（dr.5・dr.7）は、理由は聞かず、大きさだけを聞く。「一直線の角は 180° を使って説明しよう」（qz.3）は、正しい説明を選ぶ4択に直した。
//   dr.5（∠a＋∠b＋∠c は何度か）は、答えがいつも 180° になるので、「となり合わない3つの角のうち、1つの大きさ」を聞く形にした。
// ============================================================
import { t as t0, pick, choices4, shuffle, sample, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、次の組は作り直す（skip）：数の答えが、問題文に書かれた角の大きさ・式の数とたまたま同じ／解説に同じ式が2回出る */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  if (!p || p.skip) return p;
  if (typeof p.ans === "number") {
    const shown = [...p.q.matchAll(/(\d+)°/g)].map((m) => +m[1]).concat([...p.q.matchAll(/\$[^$]*\$/g)].flatMap((m) => (m[0].match(/\d+/g) || []).map(Number)));
    if (shown.includes(p.ans)) return { skip: true };
  }
  const maths = (p.steps || []).flatMap((s) => [...s.matchAll(/\$([^$]*)\$/g)].map((m) => m[1])).filter((m) => m.length > 4);
  return maths.some((m, k) => maths.indexOf(m) !== k) ? { skip: true } : p;
});

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const mod = (a, n) => ((a % n) + n) % n;
const PTS = "ABCDEFGHJKPQRSTUVWXYZ".split("");   // 点の名前（I・L・M・N・O は、ほかと見まちがえるので使わない）
const SETS4 = [["A", "B", "C", "D"], ["P", "Q", "R", "S"], ["E", "F", "G", "H"], ["W", "X", "Y", "Z"], ["J", "K", "T", "U"]];
/** 直角でない角（度） */
const ang = (r, lo = 25, hi = 155) => { let a = r(lo, hi); while (a === 90) a = r(lo, hi); return a; };
/** 1次式 px+q の TeX（p＝1 なら x+q）と、(px+q)° */
const lin = (p, q) => `${p === 1 ? "" : p}x${q === 0 ? "" : q < 0 ? "-" : "+"}${q === 0 ? "" : Math.abs(q)}`;
const dgx = (p, q) => `$(${lin(p, q)})^\\circ$`;
const sumLin = (es) => es.reduce((s, e) => ({ p: s.p + e.p, q: s.q + e.q }), { p: 0, q: 0 });
const eqLeft = (es) => es.map((e) => `(${lin(e.p, e.q)})`).join("+");

// ── 4択の誤答を選ぶ道具 ────────────────────────────────────────
/** 4択を「当てやすく」しない：どの特徴（feats）でも、正解だけが最大にも最小にもならないようにする */
function noTell(feats, opts, correct) {
  return feats.every((f) => {
    const vs = opts.map(f), c = f(correct);
    const hi = vs.filter((v) => v > c).length, lo = vs.filter((v) => v < c).length;
    return !(hi === 0 && lo === 3) && !(lo === 0 && hi === 3);
  });
}
const bigrams = (s) => { const t2 = String(s).replace(/\s/g, ""), m = new Map(); for (let i = 0; i < t2.length - 1; i++) m.set(t2.slice(i, i + 2), (m.get(t2.slice(i, i + 2)) || 0) + 1); return m; };
/** 文字列どうしの似かた（2文字ずつの一致の割合） */
const sim = (a, b) => { const A = bigrams(a), B = bigrams(b); let i = 0, u = 0; for (const x of new Set([...A.keys(), ...B.keys()])) { i += Math.min(A.get(x) || 0, B.get(x) || 0); u += Math.max(A.get(x) || 0, B.get(x) || 0); } return u ? i / u : 0; };
const digitsOf = (s) => String(s).match(/\d+/g) || [];
/** 誤答を、候補 pool から3つ、ランダムに選ぶ。正解だけが、文字の長さ・ほかの選択肢との似かた・数字の重なりで、目立たないようにする */
function fairPick(r, correct, pool, q = "") {
  let last = null;
  for (let tries = 0; tries < 300; tries++) {
    const w = sample(r, pool, Math.min(3, pool.length)), opts = [correct, ...w].map(String);
    last = w;
    const feats = [
      (o) => o.length,
      (o) => opts.reduce((s, p) => (p === o ? s : s + sim(o, p)), 0),
      (o) => opts.reduce((s, p) => (p === o ? s : s + digitsOf(o).filter((n) => digitsOf(p).includes(n)).length), 0),
      (o) => digitsOf(o).filter((n) => digitsOf(q).includes(n)).length,
      (o) => [...bigrams(o).keys()].filter((b) => bigrams(q).has(b)).length,                          // 問題文と、同じ言葉（2文字）がいくつあるか
    ];
    if (noTell(feats, opts, String(correct))) return w;
  }
  return last;
}

// ── 2直線が点 O で交わる図 ──────────────────────────────────────
/** 直線 pq と 直線 su が点 O で交わる。O のまわりに、半直線が p, s, q, u の順にならぶ。角 k0＝∠pOs、k1＝∠sOq、k2＝∠qOu、k3＝∠uOp（k と k+2 が対頂角、k と k+1 が一直線） */
function cross2(r, extra = 0) {
  const base = shuffle(r, pick(r, SETS4)), [p, q, s, u] = base;
  const ring = [p, s, q, u];
  const rest = shuffle(r, PTS.filter((x) => !base.includes(x))).slice(0, extra);
  return {
    p, q, s, u, ring, rest,
    intro: `2直線 ${p}${q} と ${s}${u} が点 O で交わっている（O は、${p} と ${q} のあいだにも、${s} と ${u} のあいだにもある）。`,
    nm: (i) => `∠${ring[mod(i, 4)]}O${ring[mod(i + 1, 4)]}`,
  };
}

/** 3直線が点 O で交わる図。6本の半直線 O…は、この順に O のまわりにならぶ。部屋 i＝∠(R[i])O(R[i+1])。部屋 i と i+3 が対頂角、i から i+2 の3つが一直線 */
function cross3(r) {
  const R = sample(r, PTS, 6).sort();
  return {
    R,
    intro: `3直線 ${R[0]}${R[3]}、${R[1]}${R[4]}、${R[2]}${R[5]} が点 O で交わっていて、半直線 ${R.map((x) => `O${x}`).join("、")} は、この順に O のまわりにならんでいる（O は、${R[0]} と ${R[3]}、${R[1]} と ${R[4]}、${R[2]} と ${R[5]} のあいだにある）。`,
    nm: (i) => `∠${R[mod(i, 6)]}O${R[mod(i + 1, 6)]}`,
  };
}
/** 3直線のとき、部屋の大きさ：3つの角 p, q, s（和が 180°）が、p q s p q s の順にならぶ */
const rooms3 = (r, lo = 20, hi = 120) => {
  for (let i = 0; i < 200; i++) {
    const p = r(lo, hi), q = r(lo, hi), s = 180 - p - q;
    if (s >= lo && s <= hi && !(p === q && q === s)) return [p, q, s];
  }
  return [40, 55, 85];
};

// ── 2直線に1つの直線が交わる図（同位角・錯角）──────────────────────────
// 8つの角に 0〜7 の番号：P（上の交点）のまわりが 0＝右上、1＝左上、2＝左下、3＝右下。Q（下の交点）のまわりが 4＝右上、5＝左上、6＝左下、7＝右下。
// 番号 4v＋k（v＝頂点 0:P 1:Q、k＝向き 0:右上 1:左上 2:左下 3:右下）として、
//   対頂角 … (v, k+2)　同位角 … (1−v, k)　錯角 … (1−v, k+2)（内側の角だけ）　同側内角 … 内側で同じがわ　となり合う角 … (v, k±1)
const POS = ["右上", "左上", "左下", "右下"];
const vtxOf = (i) => (i < 4 ? 0 : 1);
const qd = (i) => i % 4;
const idx = (v, k) => 4 * v + mod(k, 4);
const vert = (i) => idx(vtxOf(i), qd(i) + 2);
const corr = (i) => idx(1 - vtxOf(i), qd(i));
const inner = (i) => (vtxOf(i) === 0 ? qd(i) >= 2 : qd(i) <= 1);
const alt = (i) => (inner(i) ? idx(1 - vtxOf(i), qd(i) + 2) : -1);
const ssi = (i) => (inner(i) ? { 2: 5, 3: 4, 4: 3, 5: 2 }[i] : -1);
const adj = (i) => [idx(vtxOf(i), qd(i) + 1), idx(vtxOf(i), qd(i) + 3)];

/** 点の名前をつけて、8つの角の名前を決める。par＝true なら「ℓ∥m。」から始める */
function trans(r, par = false) {
  const [P, Q, A, B, C, D, E, F] = sample(r, PTS, 8);
  const tri = [[A, P, E], [E, P, B], [B, P, Q], [Q, P, A], [C, Q, P], [P, Q, D], [D, Q, F], [F, Q, C]];
  const flip = tri.map(() => r(0, 1) === 1);
  const nm = (i) => { const [x, v, y] = tri[i]; return flip[i] ? `∠${y}${v}${x}` : `∠${x}${v}${y}`; };
  const intro = `${par ? "ℓ∥m。" : ""}直線 n が、2直線 ℓ、m と、それぞれ点 ${P}、${Q} で交わっている（ℓ が上、m が下で、${P} が上、${Q} が下）。ℓ 上に ${P} の右の点 ${A} と左の点 ${B}、m 上に ${Q} の右の点 ${C} と左の点 ${D}、n 上に ${P} より上の点 ${E} と ${Q} より下の点 ${F} をとる。`;
  const where = (i) => `点 ${i < 4 ? P : Q} の${POS[qd(i)]}の角`;
  return { P, Q, tri, nm, intro, where, letters: (i) => new Set(tri[i]) };
}

/** 4択の角の組（正解 correct と、誤答の候補 pool から3つ）。問題の角 X と、4つの選択肢の文字の重なり・頂点から、正解が目立たないようにする */
function angleOptions(r, S, X, correct, pool) {
  const lt = (i) => S.letters(i);
  const feats = [
    (i) => [...lt(i)].filter((c) => lt(X).has(c)).length,                                  // 問題の角と、文字がいくつ重なるか
    (i) => (vtxOf(i) === vtxOf(X) ? 1 : 0),                                                // 問題の角と同じ頂点か
  ];
  let last = null;
  for (let tries = 0; tries < 300; tries++) {
    const w = sample(r, pool, 3), opts = [correct, ...w];
    last = opts;
    const f2 = (i) => opts.reduce((s, j) => (j === i ? s : s + [...lt(i)].filter((c) => lt(j).has(c)).length), 0);   // ほかの選択肢と、文字がいくつ重なるか
    const f3 = (i) => opts.reduce((s, j) => (j === i ? s : s + sim(S.nm(i), S.nm(j))), 0);                          // ほかの選択肢と、名前がどれだけ似ているか
    if (noTell([...feats, f2, f3], opts, correct)) return opts;
  }
  return last;
}

/** 「∠X の □□ はどれか」4択（rel＝corr 同位角／alt 錯角／vert 対頂角） */
function partnerQ(r, rel, par = false) {
  const S = trans(r, par);
  const X = rel === "alt" ? pick(r, [2, 3, 4, 5]) : r(0, 7);
  const word = { corr: "同位角", alt: "錯角", vert: "対頂角" }[rel];
  const correct = { corr, alt, vert }[rel](X);
  const all = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== X && i !== correct);
  // 誤答の候補：ほかの呼び名の角（対頂角・同位角・錯角・同側内角）と、となり合う角。どれも、正解にはなりえない
  const pool = all.filter((i) => {
    const kinds = [vert(X), corr(X), alt(X), ssi(X), ...adj(X)];
    return kinds.includes(i) || [vert(correct), corr(correct), ...adj(correct)].includes(i);
  });
  const opts = angleOptions(r, S, X, correct, pool);
  const ans = S.nm(correct);
  const why = (i) => {
    if (i === vert(X)) return "向かい合う角（対頂角）";
    if (i === corr(X)) return "同位角";
    if (i === alt(X)) return "錯角";
    if (adj(X).includes(i)) return "となり合う角";
    if (i === ssi(X)) return "内側の同じがわの角";
    return "位置がちがう角";
  };
  const wrongs = opts.filter((i) => i !== correct);
  const defn = { corr: "同位角は、もう一方の直線のまわりで、同じ位置にある角。", alt: "錯角は、2直線の内側で、ななめ向かいにある角。", vert: "対頂角は、同じ交点で向かい合う角。" }[rel];
  return {
    q: `${S.intro}${S.nm(X)} の${word}は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs.map((i) => S.nm(i))),
    hint: `まず、${S.nm(X)} が、どの点のどのあたりの角か、自分で図にかいてみよう。${word}は、どんな位置の角どうしのことだったかな？`,
    steps: [
      `${S.nm(X)} は、${S.where(X)}。${defn}`,
      `${S.nm(X)} の${word}は、${S.where(correct)}の ${ans}。`,
      `ほかの選択肢は、${wrongs.map((i) => `${S.nm(i)}（${S.where(i)}。${why(i)}）`).join("、")}。`,
    ],
  };
}
/** 2つの角 X、Y の関係を答える4択（対頂角・同位角・錯角・どれでもない） */
const REL_NAMES = ["対頂角", "同位角", "錯角", "どれでもない"];
function relationQ(r, par = false) {
  const S = trans(r, par);
  const kind = pick(r, [0, 1, 2, 3]);
  let X, Y;
  if (kind === 0) { X = r(0, 7); Y = vert(X); }
  else if (kind === 1) { X = r(0, 7); Y = corr(X); }
  else if (kind === 2) { X = pick(r, [2, 3, 4, 5]); Y = alt(X); }
  else if (r(0, 1)) { X = r(0, 7); Y = pick(r, adj(X)); }
  else { X = pick(r, [2, 3, 4, 5]); Y = ssi(X); }
  if (r(0, 1)) [X, Y] = [Y, X];
  const ans = REL_NAMES[kind];
  const rule = ["同じ交点で、向かい合う角", "もう一方の直線のまわりで、同じ位置にある角", "2直線の内側で、ななめ向かいにある角", "対頂角でも、同位角でも、錯角でもない"][kind];
  return {
    q: `${S.intro}${S.nm(X)} と ${S.nm(Y)} の関係として、正しいものはどれか。（どれにもあてはまらないときは、「どれでもない」）`,
    ans,
    choices: choices4(r, ans, REL_NAMES.filter((x) => x !== ans)),
    hint: `${S.nm(X)} と ${S.nm(Y)} が、それぞれどの点のどのあたりの角か、自分で図にかいてみよう。対頂角・同位角・錯角は、どんな位置の角だったかな？`,
    steps: [
      `${S.nm(X)} は、${S.where(X)}。${S.nm(Y)} は、${S.where(Y)}。`,
      kind === 3 ? `この2つは、${rule}。` : `この2つは、${rule}だから、${ans}。`,
      `答えは「${ans}」。`,
    ],
  };
}

// ── 問題 ───────────────────────────────────────────────
/** 01d01a 対頂角：2つの対頂角の和 */
function vertSum(r) {
  const X = cross2(r), k = r(0, 3), a = ang(r);
  return {
    q: `${X.intro}${X.nm(k)}＝${a}° のとき、${X.nm(k)} と ${X.nm(k + 2)} の大きさの和は何度か。`,
    ans: 2 * a,
    unit: "度",
    hint: `${X.nm(k)} と ${X.nm(k + 2)} は、どんな位置の角かな？ その2つの大きさには、どんな関係があったかな？`,
    steps: [`${X.nm(k)} と ${X.nm(k + 2)} は、向かい合う角（対頂角）だから、等しい。`, `${X.nm(k + 2)}＝${X.nm(k)}＝${a}°`, `和は $${a}+${a}=${2 * a}$ より、${2 * a}°。`],
  };
}
/** 01d01b 一直線の角：となり合う角 */
function straightAng(r) {
  const X = cross2(r), k = r(0, 3), a = ang(r), j = r(0, 1) ? k + 1 : k + 3;
  return {
    q: `${X.intro}${X.nm(k)}＝${a}° のとき、${X.nm(j)} の大きさは何度か。`,
    ans: 180 - a,
    unit: "度",
    hint: `${X.nm(k)} と ${X.nm(j)} は、どんな位置の角かな？ その2つの大きさの和について、何がいえたかな？`,
    steps: [`${X.nm(k)} と ${X.nm(j)} は、一直線の上にならぶ角だから、和が 180°。`, `$180-${a}=${180 - a}$ より、${X.nm(j)}＝${180 - a}°。`],
  };
}
/** 01d01c 3直線で、一直線にならぶ3つの角：2つがわかっていて、残りの1つ */
function threeStraight(r) {
  const X = cross3(r), [p, q, s] = rooms3(r), v = [p, q, s], j = r(0, 5), u = r(0, 2);   // 部屋 j, j+1, j+2 が一直線。u 番目が求める角
  const room = (i) => v[mod(i, 3)];
  const known = [0, 1, 2].filter((i) => i !== u);
  const lead = X.R[mod(j, 6)], end = X.R[mod(j + 3, 6)];
  return {
    q: `${X.intro}${known.map((i) => `${X.nm(j + i)}＝${room(j + i)}°`).join("、")} のとき、${X.nm(j + u)} の大きさは何度か。`,
    ans: room(j + u),
    unit: "度",
    hint: `${X.nm(j)}、${X.nm(j + 1)}、${X.nm(j + 2)} の3つの角をあわせると、どんな角になるかな？ その角は、何度だったかな？`,
    steps: [`${lead}、O、${end} は一直線上にあるから、${X.nm(j)}、${X.nm(j + 1)}、${X.nm(j + 2)} の和は 180°。`, `$180-${room(j + known[0])}-${room(j + known[1])}=${room(j + u)}$ より、${X.nm(j + u)}＝${room(j + u)}°。`],
  };
}
/** 3直線のとき、1つおきの3つの角（部屋 j, j+2, j+4）の和が 180° になるわけ（対頂角を使って、一直線にならべる） */
const altReason = (X, j) => `${X.nm(j + 2)} の対頂角は ${X.nm(j + 5)}、${X.nm(j + 4)} の対頂角は ${X.nm(j + 1)}。${X.nm(j + 5)}、${X.nm(j)}、${X.nm(j + 1)} が一直線にならぶので、${X.nm(j)}、${X.nm(j + 2)}、${X.nm(j + 4)} の和も 180°。`;
/** 01d03a 3直線：1つおきの3つの角のうち、2つがわかっているとき、残りの1つ */
function altRoomsFind(r) {
  const X = cross3(r), vals = rooms3(r, 25, 110), j = r(0, 5), trio = [j, j + 2, j + 4], u = r(0, 2), known = [0, 1, 2].filter((i) => i !== u);
  const ans = vals[u];
  return {
    q: `${X.intro}${known.map((i) => `${X.nm(trio[i])}＝${vals[i]}°`).join("、")} のとき、${X.nm(trio[u])} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: `${X.nm(trio[u])} の対頂角を考えると、一直線にならぶ角が見つからないかな？ 対頂角は、どんな関係だったかな？`,
    steps: [altReason(X, j), `$180-${vals[known[0]]}-${vals[known[1]]}=${ans}$ より、${X.nm(trio[u])}＝${ans}°。`],
  };
}
/** 01d05 3直線：1つおきの3つの角のうち、2つの和がわかっているとき、残りの1つ */
function altRoomsSum(r) {
  const X = cross3(r), vals = rooms3(r, 25, 110), j = r(0, 5), trio = [j, j + 2, j + 4], u = r(0, 2), known = [0, 1, 2].filter((i) => i !== u);
  const sum = vals[known[0]] + vals[known[1]], ans = vals[u];
  return {
    q: `${X.intro}${X.nm(trio[known[0]])}＋${X.nm(trio[known[1]])}＝${sum}° のとき、${X.nm(trio[u])} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: `${X.nm(trio[u])} の対頂角は、どの角かな？ 一直線にならぶ角の和は、何度だったかな？`,
    steps: [altReason(X, j), `$180-${sum}=${ans}$ より、${X.nm(trio[u])}＝${ans}°。`],
  };
}

/** 式 (px+q)° が、x のとき a になる式を選ぶ（係数 p は 1〜4、定数項 q は 0 でなく、絶対値 60 以下） */
function expr(r, x, a, ps = [1, 2, 3, 4]) {
  for (let i = 0; i < 100; i++) {
    const p = pick(r, ps), q = a - p * x;
    if (q !== 0 && Math.abs(q) <= 60) return { p, q };
  }
  return null;
}

/** 1次方程式 Px+Q＝total の解き方の途中式（TeX の文字列の配列）。同じ式を2回書かない */
const solveParts = (P, Q, total, x) => [...(Q !== 0 ? [`${lin(P, Q)}=${total}`] : []), ...(P !== 1 ? [`${P}x=${total - Q}`] : []), `x=${x}`];
/** px+q に x を入れた計算の TeX：2\\times 25+10=60 */
const evalLin = (p, q, x) => `${p === 1 ? x : `${p}\\times ${x}`}${q < 0 ? "-" : "+"}${Math.abs(q)}=${p * x + q}`;

/** 01d03b 対頂角が等しい：(px+q)° ＝ (rx+s)° から x */
function vertEq(r) {
  for (let i = 0; i < 200; i++) {
    const x = r(5, 40), a = ang(r, 30, 150), e1 = expr(r, x, a), e2 = expr(r, x, a);
    if (!e1 || !e2 || e1.p === e2.p) continue;
    const X = cross2(r), k = r(0, 3);
    const big = e1.p > e2.p ? e1 : e2, small = big === e1 ? e2 : e1, d = big.p - small.p, rhs = small.q - big.q;
    return {
      q: `${X.intro}${X.nm(k)}＝${dgx(e1.p, e1.q)}、${X.nm(k + 2)}＝${dgx(e2.p, e2.q)} のとき、$x$ の値は？`,
      ans: x,
      hint: `${X.nm(k)} と ${X.nm(k + 2)} は、どんな位置の角かな？ その2つの大きさには、どんな関係があるかな？ それを式にできないかな？`,
      steps: [
        `${X.nm(k)} と ${X.nm(k + 2)} は対頂角だから、等しい。`,
        `${$(`${lin(e1.p, e1.q)}=${lin(e2.p, e2.q)}`)} より、${(d === 1 ? [`x=${x}`] : [`${d}x=${rhs}`, `x=${x}`]).map($).join("、")}`,
      ],
    };
  }
}
/** 01d03c 一直線の角：(px+q)° ＋ (rx+s)° ＝ 180° から x */
function straightEq(r) {
  for (let i = 0; i < 200; i++) {
    const x = r(5, 40), a = ang(r, 30, 150), e1 = expr(r, x, a), e2 = expr(r, x, 180 - a);
    if (!e1 || !e2) continue;
    const X = cross2(r), k = r(0, 3), j = r(0, 1) ? k + 1 : k + 3, s = sumLin([e1, e2]);
    return {
      q: `${X.intro}${X.nm(k)}＝${dgx(e1.p, e1.q)}、${X.nm(j)}＝${dgx(e2.p, e2.q)} のとき、$x$ の値は？`,
      ans: x,
      hint: `${X.nm(k)} と ${X.nm(j)} は、どんな位置の角かな？ その2つの大きさには、どんな関係があるかな？ それを式にできないかな？`,
      steps: [
        `${X.nm(k)} と ${X.nm(j)} は一直線の上にならぶ角だから、和が 180°。`,
        `${$(`(${lin(e1.p, e1.q)})+(${lin(e2.p, e2.q)})=180`)} より、${solveParts(s.p, s.q, 180, x).map($).join("、")}`,
      ],
    };
  }
}
/** 01d04 ∠a＋∠c＝S（対頂角の和）のとき、となり合う角 */
function vertSumGiven(r) {
  const X = cross2(r), k = r(0, 1), a = ang(r, 30, 150), S = 2 * a, j = r(0, 1) ? k + 1 : k + 3;
  return {
    q: `${X.intro}${X.nm(k)}＋${X.nm(k + 2)}＝${S}° のとき、${X.nm(j)} の大きさは何度か。`,
    ans: 180 - a,
    unit: "度",
    hint: `${X.nm(k)} と ${X.nm(k + 2)} は、どんな位置の角かな？ そのことから、${X.nm(k)} 1つの大きさは、どう求められるかな？`,
    steps: [`${X.nm(k)} と ${X.nm(k + 2)} は対頂角だから等しく、どちらも ${S}° の半分で ${a}°。`, `${X.nm(j)} は ${X.nm(k)} と一直線にならぶので、$180-${a}=${180 - a}$ より、${180 - a}°。`],
  };
}
/** 01d06 3直線：1つおきの3つの角が (px+q)° など。x、またはその角の大きさ */
function altEq(r, askAngle) {
  for (let i = 0; i < 500; i++) {
    const x = r(4, 30), ps = [pick(r, [1, 2, 3, 4]), pick(r, [1, 2, 3, 4]), pick(r, [1, 2, 3, 4])];
    if (ps.every((p) => p === ps[0])) continue;
    const q1 = rnz(r, -40, 40), q2 = rnz(r, -40, 40), q3 = 180 - x * (ps[0] + ps[1] + ps[2]) - q1 - q2, qs = [q1, q2, q3];
    const vals = ps.map((p, k) => p * x + qs[k]);
    if (qs.some((v) => v === 0 || Math.abs(v) > 60) || vals.some((v) => v < 20 || v > 130)) continue;
    const es = ps.map((p, k) => ({ p, q: qs[k] }));
    const X = cross3(r), j = r(0, 5), trio = [j, j + 2, j + 4], u = r(0, 2), s = sumLin(es);
    return {
      q: `${X.intro}${trio.map((n, k) => `${X.nm(n)}＝${dgx(es[k].p, es[k].q)}`).join("、")} のとき、${askAngle ? `${X.nm(trio[u])} の大きさは何度か。` : "$x$ の値は？"}`,
      ans: askAngle ? vals[u] : x,
      unit: askAngle ? "度" : undefined,
      hint: "この3つの角の和は、何度になるかな？ 対頂角や一直線の角は、どう使えるかな？",
      steps: [
        altReason(X, j),
        `${$(`${eqLeft(es)}=180`)} より、${solveParts(s.p, s.q, 180, x).map($).join("、")}`,
        ...(askAngle ? [`${X.nm(trio[u])}＝$${evalLin(es[u].p, es[u].q, x)}$ より、${vals[u]}°。`] : []),
      ],
    };
  }
}

/** 二等分線の図：直線 pq と su が O で交わり、∠pOs＝2k。半直線 Oe は ∠pOs を2等分し、半直線 Of は eO を O の先へのばしたもの */
function bisectFig(r) {
  const X = cross2(r, 2), [e, f] = X.rest, k = r(10, 80), [p, s, q, u] = X.ring;
  const stem = `${X.intro}∠${p}O${s}＝${2 * k}° で、半直線 O${e} は ∠${p}O${s} を 2等分している。さらに、半直線 O${f} は、${e}O を O の先へのばした半直線である（${e}、O、${f} は一直線上にある）。`;
  return { e, f, k, p, s, q, u, stem };
}
/** 01d07a 二等分線：対頂角になる角（∠qOf など） */
function bisectVert(r) {
  const { e, f, k, p, s, q, u, stem } = bisectFig(r), c = pick(r, [{ x: q, mate: p }, { x: u, mate: s }]);
  return {
    q: `${stem}∠${c.x}O${f} の大きさは何度か。`,
    ans: k,
    unit: "度",
    hint: `∠${p}O${e} の大きさは、どう求められるかな？ ∠${c.x}O${f} は、どの角と対頂角になっているかな？`,
    steps: [
      `∠${p}O${s} を 2等分しているので、∠${c.mate}O${e} は ${2 * k}° の半分で ${k}°。`,
      `${e}、O、${f} が一直線で、${c.mate}、O、${c.x} も一直線だから、∠${c.x}O${f} は ∠${c.mate}O${e} の対頂角。`,
      `対頂角は等しいから、∠${c.x}O${f}＝${k}°。`,
    ],
  };
}
/** 01d07b 二等分線：一直線にならぶ角（180°−k） */
function bisectSupp(r) {
  const { e, f, k, p, s, q, u, stem } = bisectFig(r);
  const c = pick(r, [
    { x: q, y: e, mate: p, how: `∠${q}O${e} は、∠${p}O${e} と一直線にならぶ（${p}、O、${q} が一直線）。` },
    { x: u, y: e, mate: s, how: `∠${u}O${e} は、∠${s}O${e} と一直線にならぶ（${s}、O、${u} が一直線）。` },
    { x: p, y: f, mate: p, how: `∠${p}O${f} は、∠${p}O${e} と一直線にならぶ（${e}、O、${f} が一直線）。` },
    { x: s, y: f, mate: s, how: `∠${s}O${f} は、∠${s}O${e} と一直線にならぶ（${e}、O、${f} が一直線）。` },
  ]);
  return {
    q: `${stem}∠${c.x}O${c.y} の大きさは何度か。`,
    ans: 180 - k,
    unit: "度",
    hint: `∠${p}O${e} の大きさは、どう求められるかな？ ∠${c.x}O${c.y} は、どの角と一直線にならんでいるかな？`,
    steps: [`∠${p}O${s} を 2等分しているので、∠${c.mate}O${e} は ${2 * k}° の半分で ${k}°。`, c.how, `$180-${k}=${180 - k}$ より、∠${c.x}O${c.y}＝${180 - k}°。`],
  };
}

/** 01q03 「一直線の角」を使った説明（対頂角が等しいわけ）を選ぶ4択 */
function whyEqual(r) {
  const X = cross2(r), i = r(0, 3), T1 = X.nm(i), M = X.nm(i + 1), T2 = X.nm(i + 2), N = X.nm(i + 3);
  const right = `${T1}＋${M} も ${T2}＋${M} も一直線の角で、どちらも 180° だから、${M} をひいて ${T1}＝${T2} となる。`;
  const pool = [
    `${T1}＋${T2} も ${M}＋${N} も一直線の角で、どちらも 180° だから、共通の角をひいて ${T1}＝${T2} となる。`,   // 一直線にならない組を足している
    `${T1}＋${M} も ${T2}＋${N} も一直線の角で、どちらも 180° だから、共通の角をひいて ${T1}＝${T2} となる。`,   // 共通でない角をひいている
    `${T1}＋${M} も ${T2}＋${N} も一直線の角で、どちらも 180° だから、${M} と ${T2} をひいて ${T1}＝${T2} となる。`,
    `${T1} と ${T2} は向かい合う角で、向かい合う角は一直線の角と同じ 180° だから、${T1}＝${T2} となる。`,
    `${T1}＋${M} は一直線の角で 180° だが、${T2} は ${M} と一直線にならないから、${T1}＝${T2} とはいえない。`,
    `${T1}＋${M} も ${T2}＋${M} も一直線の角で、どちらも 180° だから、${T1} と ${T2} をたして ${M}＝${M} となる。`,
  ];
  const q = `${X.intro}対頂角 ${T1} と ${T2} が等しいことを、一直線の角の大きさを使って説明したい。正しい説明は、次のうちどれか。`;
  return {
    q,
    ans: right,
    choices: choices4(r, right, fairPick(r, right, pool, q)),
    hint: `${T1} と ${T2} は、それぞれ、どの角と一直線にならんでいるかな？ 共通の角はどれかな？`,
    steps: [
      `${T1} と ${M} は一直線にならぶので、${T1}＋${M}＝180°。${T2} と ${M} も一直線にならぶので、${T2}＋${M}＝180°。`,
      `どちらも 180° で同じ大きさだから、共通の ${M} をひいて、${T1}＝${T2}。`,
      `正しい説明は「${right}」`,
    ],
  };
}

export const UNITS = [
  unit("01", {
    name: "2直線が交わってできる角（対頂角・同位角・錯角）",
    desc: "対頂角は等しい。同位角・錯角を、位置のことばで見分ける",
    prereqs: ["J2-ik17"],
    points: [
      "2直線が交わってできる、向かい合う角を対頂角という。対頂角は等しい。そのわけは、一直線の角が 180° であることから説明できる。",
      "一直線にならぶ角の和は 180°。3本の直線が1点で交わるときも、一直線にならぶ角の和は 180° になる。",
      "2直線に1つの直線が交わるとき、同じ位置にある角を同位角、2直線の内側で、ななめ向かいにある角を錯角という。同位角は F の形、錯角は Z の形に見える。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 01d01a 対頂角（和）
        t("01d01a", vertSum),
        // 01d01b 一直線の角（となり合う角）
        t("01d01b", straightAng),
        // 01d01c 3直線で、一直線にならぶ3つの角
        t("01d01c", threeStraight),
        // 01d02a ∠X の同位角
        t("01d02a", (r) => partnerQ(r, "corr")),
        // 01d02b ∠X の錯角
        t("01d02b", (r) => partnerQ(r, "alt")),
        // 01d02c ∠X の対頂角
        t("01d02c", (r) => partnerQ(r, "vert")),
        // 01d02d 2つの角の関係
        t("01d02d", (r) => relationQ(r)),
        // 01q01a〜c 小テスト（1）対頂角・一直線・3直線
        t("01q01a", vertSum),
        t("01q01b", straightAng),
        t("01q01c", threeStraight),
        // 01q02a ∠a の同位角、01q02b ∠d の錯角
        t("01q02a", (r) => partnerQ(r, "corr")),
        t("01q02b", (r) => partnerQ(r, "alt")),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 01d03a 3直線：1つおきの3つの角が一直線（85°、55° から x）
        t("01d03a", altRoomsFind),
        // 01d03b 対頂角が等しい：3x−10 ＝ 2x+20
        t("01d03b", vertEq),
        // 01d03c 一直線の角：(px+q)＋(rx+s)＝180
        t("01d03c", straightEq),
        // 01q03 「一直線の角は 180°」を使った説明（∠a＝∠c のわけ）
        t("01q03", whyEqual),
        // 01q04 ∠a＋∠c＝100° のとき ∠b
        t("01q04", vertSumGiven),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 01d04 ∠a＋∠c＝100° のとき ∠b
        t("01d04", vertSumGiven),
        // 01d05 3直線：∠a＋∠b＋∠c（1つおきの3つの角）が一直線 → 残りの1つ
        t("01d05", altRoomsSum),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 01d06a 3直線：1つおきの3つの角が (2x−5)°、(x+10)°、(3x+25)° → x
        t("01d06a", (r) => altEq(r, false)),
        // 01d06b 同じ問題で、角の大きさ
        t("01d06b", (r) => altEq(r, true)),
        // 01d07a 二等分線：∠BOF（対頂角）
        t("01d07a", bisectVert),
        // 01d07b 二等分線：一直線にならぶ角
        t("01d07b", bisectSupp),
        // 01q05 チャレンジ：3直線 → x
        t("01q05", (r) => altEq(r, false)),
      ],
    },
  }),
];

// 移さなかった問題はない
export const SKIPPED = [];
