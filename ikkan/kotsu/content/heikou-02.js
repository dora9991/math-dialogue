// ============================================================
// heikou-02.js — 平行と合同 第2時「平行な2直線に1つの直線が交わると、角はどうなるだろう」（平行線の性質・平行線になる条件）
//   ikkan の演習プリント（heikou-02.dr.1〜7）・小テスト（heikou-02.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「02」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：02d03a ＝ heikou-02.dr.3 の（2回の関係を使って求める）
//   図は出せないので、点の名前と位置（ℓ が上、m が下、P が上の交点、A は P の右、…／折れ線は、右下・左下の順）を、問題文で言い切る。
//   2直線に1つの直線が交わる図の8つの角には、0〜7 の番号をつけて、位置関係（同位角・錯角・対頂角・一直線）は番号から決める。ℓ∥m のとき、番号の偶奇が同じ角は等しく、ちがう角は和が 180°。
//   角度は整数の度。答えは、問題文の数字から計算して出す（平行線の同位角・錯角は等しい／一直線の角は 180°／折れ線は補助線で錯角）。
//   答えが問題文の数と同じになる問い（平行線の同位角・錯角そのもの）は、「2つの角の和」のように聞いて、問題文に答えが出ないようにした。
//   dr.2・qz.2（平行かどうか＋わけ）は、「ℓ∥m といえるものを選ぶ4択」と「いくつあるか」にした。qz.3（正しいものをすべて選ぶ）は、「正しいものを1つ選ぶ4択」にした。
//   dr.4（a〜d のうち平行な組）は、直線と n のつくる角を言葉で言って、平行な組を選ぶ4択にした。
// ============================================================
import { t as t0, pick, choices4, shuffle, sample, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const mod = (a, n) => ((a % n) + n) % n;
const PTS = "ABCDEFGHJKPQRSTUVWXYZ".split("");   // 点の名前（I・L・M・N・O は、ほかと見まちがえるので使わない）
/** 直角でない角（度） */
const ang = (r, lo = 25, hi = 155) => { let a = r(lo, hi); while (a === 90) a = r(lo, hi); return a; };
/** 1次式 px+q の TeX（p＝1 なら x+q）と、(px+q)° */
const lin = (p, q) => `${p === 1 ? "" : p}x${q === 0 ? "" : q < 0 ? "-" : "+"}${q === 0 ? "" : Math.abs(q)}`;
const dgx = (p, q) => `$(${lin(p, q)})^\\circ$`;
/** 1次方程式 Px+Q＝total の解き方の途中式（TeX の文字列の配列）。同じ式を2回書かない */
const solveParts = (P, Q, total, x) => [...(Q !== 0 ? [`${lin(P, Q)}=${total}`] : []), ...(P !== 1 ? [`${P}x=${total - Q}`] : []), `x=${x}`];
/** px+q に x を入れた計算の TeX：2\times 25+10=60 */
const evalLin = (p, q, x) => `${p === 1 ? x : `${p}\\times ${x}`}${q < 0 ? "-" : "+"}${Math.abs(q)}=${p * x + q}`;
/** 式 (px+q)° が、x のとき a になる式（係数 p は 1〜4、定数項 q は 0 でなく、絶対値 60 以下） */
function expr(r, x, a, ps = [1, 2, 3, 4]) {
  for (let i = 0; i < 100; i++) {
    const p = pick(r, ps), q = a - p * x;
    if (q !== 0 && Math.abs(q) <= 60) return { p, q };
  }
  return null;
}

/** 4択を「当てやすく」しない：どの特徴（feats）でも、正解だけが最大にも最小にもならないようにする */
function noTell(feats, opts, correct) {
  return feats.every((f) => {
    const vs = opts.map(f), c = f(correct);
    const hi = vs.filter((v) => v > c).length, lo = vs.filter((v) => v < c).length;
    return !(hi === 0 && lo === 3) && !(lo === 0 && hi === 3);
  });
}

// ── 2直線に1つの直線が交わる図（同位角・錯角）──────────────────────────
// 8つの角に 0〜7 の番号：P（上の交点）のまわりが 0＝右上、1＝左上、2＝左下、3＝右下。Q（下の交点）のまわりが 4＝右上、5＝左上、6＝左下、7＝右下。
// 番号 4v＋k（v＝頂点 0:P 1:Q、k＝向き 0:右上 1:左上 2:左下 3:右下）として、
//   対頂角 … (v, k+2)　同位角 … (1−v, k)　錯角 … (1−v, k+2)（内側の角だけ）　同側内角 … 内側で同じがわ　となり合う角 … (v, k±1)
//   ℓ∥m のとき、番号の偶奇が同じ角どうしは等しく、ちがう角どうしは和が 180°
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
const sameClass = (i, j) => i % 2 === j % 2;

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
    (i) => [...lt(i)].filter((c) => lt(X).has(c)).length,
    (i) => (vtxOf(i) === vtxOf(X) ? 1 : 0),
  ];
  let last = null;
  for (let tries = 0; tries < 300; tries++) {
    const w = sample(r, pool, 3), opts = [correct, ...w];
    last = opts;
    const f2 = (i) => opts.reduce((s, j) => (j === i ? s : s + [...lt(i)].filter((c) => lt(j).has(c)).length), 0);
    if (noTell([...feats, f2], opts, correct)) return opts;
  }
  return last;
}

// ── ℓ∥m のとき、角の大きさを求める問題 ─────────────────────────────
/** 02d01a・b 同位角（rel＝corr）・錯角（rel＝alt）：ℓ∥m のとき、2つの角の大きさの和 */
function parSum(r, rel) {
  const S = trans(r, true);
  const X = rel === "alt" ? pick(r, [2, 3, 4, 5]) : r(0, 7), Y = rel === "alt" ? alt(X) : corr(X), a = ang(r);
  const word = rel === "alt" ? "錯角" : "同位角";
  return {
    q: `${S.intro}${S.nm(X)}＝${a}° のとき、${S.nm(X)} と ${S.nm(Y)} の大きさの和は何度か。`,
    ans: 2 * a,
    unit: "度",
    hint: `${S.nm(X)} と ${S.nm(Y)} は、それぞれどの点のどのあたりの角かな？ ℓ∥m のとき、この2つの角の大きさには、どんな関係があったかな？`,
    steps: [`${S.nm(X)} は${S.where(X)}、${S.nm(Y)} は${S.where(Y)}で、この2つは${word}。`, `ℓ∥m だから、${word}は等しく、${S.nm(Y)}＝${S.nm(X)}＝${a}°。`, `和は $${a}+${a}=${2 * a}$ より、${2 * a}°。`],
  };
}
/** 02d03a・02q01c ℓ∥m：∠X＝a° のとき、ちがう交点の、和が 180° になる角（同位角→一直線の2回の関係） */
function parSupp(r) {
  const S = trans(r, true), X = r(0, 7), a = ang(r);
  const Y = pick(r, [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => vtxOf(i) !== vtxOf(X) && !sameClass(i, X)));
  const Z = corr(X);   // Y は Z のとなり合う角
  return {
    q: `${S.intro}${S.nm(X)}＝${a}° のとき、${S.nm(Y)} の大きさは何度か。`,
    ans: 180 - a,
    unit: "度",
    hint: `${S.nm(X)} と ${S.nm(Y)} は、それぞれどの点のどのあたりの角かな？ ℓ∥m を使って大きさがわかる角と、一直線の角を、つないでいけないかな？`,
    steps: [
      `${S.nm(X)} の同位角は ${S.nm(Z)}（${S.where(Z)}）。ℓ∥m だから、${S.nm(Z)}＝${a}°。`,
      `${S.nm(Y)} は ${S.nm(Z)} と一直線にならぶ角（${S.where(Y)}）なので、$180-${a}=${180 - a}$ より、${180 - a}°。`,
    ],
  };
}
/** 02d03b ℓ∥m：∠X＝a° のとき、大きさが a° になる角を選ぶ4択（ちがう交点の、番号の偶奇が同じ角） */
function parSame(r) {
  const S = trans(r, true), X = r(0, 7), a = ang(r);
  const cand = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => vtxOf(i) !== vtxOf(X) && sameClass(i, X));
  const correct = pick(r, cand);
  const pool = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => !sameClass(i, X));
  const opts = angleOptions(r, S, X, correct, pool), ans = S.nm(correct);
  const wrongs = opts.filter((i) => i !== correct);
  const way = correct === corr(X) ? "同位角" : inner(X) ? "錯角" : `同位角 ${S.nm(corr(X))} の対頂角`;
  return {
    q: `${S.intro}${S.nm(X)}＝${a}° のとき、大きさが ${a}° であるといえる角は、次のうちどれか。`,
    ans,
    choices: choices4(r, ans, wrongs.map((i) => S.nm(i))),
    hint: `${S.nm(X)} は、どの点のどのあたりの角かな？ ℓ∥m のとき、どの位置の角が等しくなるのだったかな？`,
    steps: [
      `${S.nm(X)} は${S.where(X)}。${ans} は${S.where(correct)}で、${S.nm(X)} の${way}。ℓ∥m だから、等しく ${a}°。`,
      `ほかの選択肢は、${wrongs.map((i) => `${S.nm(i)}（${S.where(i)}）`).join("、")}。どれも ${S.nm(X)} とは和が 180° の角で、$180-${a}=${180 - a}$ より ${180 - a}°。`,
    ],
  };
}

// ── 平行かどうかの判断 ───────────────────────────────────────
// 条件 c＝{ x, y, vx, vy }：角 x の大きさが vx、角 y の大きさが vy（x と y は、ちがう交点の角）。
// ℓ∥m といえるのは、同じ組（番号の偶奇が同じ）なら vx＝vy、ちがう組なら vx＋vy＝180 のとき
const isPar = (c) => (sameClass(c.x, c.y) ? c.vx === c.vy : c.vx + c.vy === 180);
const TYPES = {
  "corr=": { par: true, word: "同位角" },
  "alt=": { par: true, word: "錯角" },
  "corr!": { par: false, word: "同位角" },
  "alt!": { par: false, word: "錯角" },
  "ssi=": { par: false, word: "同側" },
  "corr180": { par: false, word: "同位角" },
  "alt180": { par: false, word: "錯角" },
};
/** 条件の種類から、条件をつくる */
function mkCond(r, type) {
  const innerX = type.startsWith("alt") || type.startsWith("ssi");
  const x = innerX ? pick(r, [2, 3, 4, 5]) : r(0, 7);
  const y = type.startsWith("alt") ? alt(x) : type.startsWith("ssi") ? ssi(x) : corr(x);
  const a = ang(r, 30, 150);
  let vy = a;
  if (type.endsWith("!")) { const d = pick(r, [-1, 1]) * r(6, 40); vy = a + d; if (vy < 20 || vy > 160 || vy === 90) vy = a - d; }
  if (type.endsWith("180")) vy = 180 - a;
  const c = { type, x, y, vx: a, vy };
  if (isPar(c) !== TYPES[type].par) return null;
  return c;
}
const condText = (S, c) => `${S.nm(c.x)}＝${c.vx}°、${S.nm(c.y)}＝${c.vy}°`;
/** 条件が ℓ∥m を言えるか／言えないかの、わけ（「…ので」につなぐ形） */
const condWhy = (S, c) => {
  const w = TYPES[c.type].word, two = `${S.nm(c.x)} と ${S.nm(c.y)}`;
  if (c.type === "ssi=") return `${two} は内側の同じがわの角で、同位角でも錯角でもない`;
  if (TYPES[c.type].par) return `${two} は${w}で、どちらも ${c.vx}° で等しい`;
  return `${two} は${w}だが、${c.vx}° と ${c.vy}° で等しくない`;
};
/** 条件を n 個つくる（par の個数を指定）。同じ角の組を2回使わない */
function condSet(r, S, nPar, nTotal, forceSsi = false) {
  for (let t1 = 0; t1 < 300; t1++) {
    const types = [
      ...Array.from({ length: nPar }, () => pick(r, ["corr=", "alt="])),
      ...(forceSsi && nTotal - nPar > 0 ? ["ssi="] : []),
      ...Array.from({ length: nTotal - nPar - (forceSsi && nTotal - nPar > 0 ? 1 : 0) }, () => pick(r, ["corr!", "alt!", "corr180", "alt180", "ssi="])),
    ];
    const cs = types.map((ty) => mkCond(r, ty));
    if (cs.some((c) => !c)) continue;
    const keys = cs.map((c) => `${Math.min(c.x, c.y)}-${Math.max(c.x, c.y)}`);
    if (new Set(keys).size !== keys.length) continue;
    return cs;
  }
  return null;
}
/** 02d02a・02q02 4つの条件のうち、ℓ∥m といえるものを選ぶ4択 */
function judgeChoice(r) {
  for (let i = 0; i < 100; i++) {
    const S = trans(r, false), cs = condSet(r, S, 1, 4, true);
    if (!cs) continue;
    const ok = cs.find((c) => TYPES[c.type].par), opts = cs;
    const ans = condText(S, ok);
    const feats = [(c) => (c.vx === c.vy ? 1 : 0), (c) => Math.abs(c.vx - c.vy), (c) => (c.vx + c.vy === 180 ? 1 : 0)];
    if (!noTell(feats, opts, ok)) continue;
    const wrongs = cs.filter((c) => c !== ok);
    return {
      q: `${S.intro}次の4つの条件のうち、その条件がわかれば ℓ∥m といえるものは、どれか。`,
      ans,
      choices: choices4(r, ans, wrongs.map((c) => condText(S, c))),
      hint: "2直線が平行になるのは、どんな角が等しいときだったかな？ それぞれの条件の2つの角は、どの位置の角どうしかな？",
      steps: [
        `同位角か錯角が等しいとき、2直線は平行になる。`,
        `「${ans}」は、${condWhy(S, ok)}ので、ℓ∥m といえる。`,
        `ほかは、${wrongs.map((c) => `「${condText(S, c)}」（${condWhy(S, c)}）`).join("、")}。`,
      ],
    };
  }
}
/** 02d02b 3つの条件ア〜ウのうち、ℓ∥m といえるものはいくつあるか */
function judgeCount(r) {
  for (let i = 0; i < 100; i++) {
    const S = trans(r, false), k = pick(r, [0, 1, 1, 2, 2, 3]), cs = condSet(r, S, k, 3, false);
    if (!cs) continue;
    const order = shuffle(r, cs), LET = ["ア", "イ", "ウ"];
    const parNames = order.map((c, j) => (TYPES[c.type].par ? LET[j] : null)).filter(Boolean);
    return {
      q: `${S.intro}次のア〜ウは、それぞれ別の図で、角の大きさがわかっているとする。ℓ∥m といえるものは、いくつあるか。\n${order.map((c, j) => `${LET[j]} ${condText(S, c)}`).join("\n")}`,
      ans: k,
      unit: "個",
      hint: "2直線が平行になるのは、どんな角が等しいときだったかな？ アイウの2つの角は、それぞれどの位置の角どうしかな？",
      steps: [
        ...order.map((c, j) => `${LET[j]} … ${condWhy(S, c)}ので、${TYPES[c.type].par ? "ℓ∥m といえる" : "ℓ∥m とはいえない"}。`),
        `ℓ∥m といえるのは、${parNames.length ? `${parNames.join("、")} の` : ""}${k}個。`,
      ],
    };
  }
}

// ── 4本の直線 a、b、c、d（dr.4）──────────────────────────────────
const MATCH = [[["a", "c"], ["b", "d"]], [["a", "b"], ["c", "d"]], [["a", "d"], ["b", "c"]]];
const matchText = (m) => m.map(([x, y]) => `${x}∥${y}`).join(" と ");
function fourLines(r) {
  for (let i = 0; i < 200; i++) {
    const mi = r(0, 2), M = MATCH[mi], v = ang(r, 35, 145);
    let w = r(0, 2) === 0 ? 180 - v : ang(r, 35, 145);
    if (w === v) continue;
    const val = {}; M[0].forEach((l) => (val[l] = v)); M[1].forEach((l) => (val[l] = w));
    const side = {}; ["a", "b", "c", "d"].forEach((l) => (side[l] = r(0, 2) === 0 ? "左上" : "右上"));
    const nLeft = Object.values(side).filter((s) => s === "左上").length;
    if (nLeft < 1 || nLeft > 2) continue;
    const given = {}; ["a", "b", "c", "d"].forEach((l) => (given[l] = side[l] === "右上" ? val[l] : 180 - val[l]));
    if (new Set(Object.values(given)).size < 3) continue;   // 同じ数が3つ以上ならぶ組は使わない
    const ans = matchText(M), wrongs = [...MATCH.filter((_, j) => j !== mi).map(matchText), "どの組も平行ではない"];
    const desc = ["a", "b", "c", "d"].map((l) => `${l} は${side[l]}の角が ${given[l]}°`).join("、");
    return {
      q: `直線 n に、4本の直線 a、b、c、d が、上から順に交わっている。各直線が n と交わる点のまわりの角のうち、n の上のほうにあって、その直線の右がわにある角を「右上の角」、左がわにある角を「左上の角」とよぶ。${desc}。平行な直線の組として、正しいものはどれか。`,
      ans,
      choices: choices4(r, ans, wrongs),
      hint: "2直線が平行になる条件は、何だったかな？ くらべる角の位置は、そろっているかな？",
      steps: [
        `右上の角にそろえる。${["a", "b", "c", "d"].map((l) => (side[l] === "右上" ? `${l} … ${given[l]}°` : `${l} … $180-${given[l]}=${val[l]}$ より ${val[l]}°`)).join("、")}。`,
        `同位角が等しい直線の組は平行だから、${ans}。`,
      ],
    };
  }
}

// ── 折れ線（補助線をひいて、錯角を使う）────────────────────────────
/** 02d05・02q04 折れ線 A−E−C：ℓ 上の A、m 上の C、あいだの E。∠BAE＝α、∠DCE＝γ のとき ∠AEC＝α＋γ */
function zig(r, mode) {
  const [A, B, C, D, E] = sample(r, PTS, 5);
  const right = r(0, 1) === 0, dw = right ? "右" : "左";
  const al = r(15, 85);
  let ga = r(15, 85);
  while (al + ga > 165) ga = r(15, 85);
  const x = al + ga, ask = mode === "x" ? "x" : pick(r, ["x", "x", "al", "ga"]);
  const given = { x: `∠${A}${E}${C}＝${x}°`, al: `∠${B}${A}${E}＝${al}°`, ga: `∠${D}${C}${E}＝${ga}°` };
  const target = { x: `∠${A}${E}${C}`, al: `∠${B}${A}${E}`, ga: `∠${D}${C}${E}` }[ask];
  const ans = { x, al, ga }[ask];
  const keys = ["al", "ga", "x"].filter((k) => k !== ask);
  const known = keys.map((k) => given[k]).join("、");
  const steps = ask === "x"
    ? [`点 ${E} を通って ℓ に平行な直線をひく。この直線は m にも平行。`, `錯角が等しいから、∠${A}${E}${C} は ${al}° と ${ga}° の和になる。`, `$${al}+${ga}=${x}$ より、${x}°。`]
    : [`点 ${E} を通って ℓ に平行な直線をひく。この直線は m にも平行。`, `錯角が等しいから、∠${A}${E}${C}＝∠${B}${A}${E}＋∠${D}${C}${E}。`, ask === "al" ? `$${x}-${ga}=${al}$ より、∠${B}${A}${E}＝${al}°。` : `$${x}-${al}=${ga}$ より、∠${D}${C}${E}＝${ga}°。`];
  return {
    q: `ℓ∥m。点 ${A}、${B} は ℓ 上に、点 ${C}、${D} は m 上にあり、${B} は ${A} の${dw}、${D} は ${C} の${dw}にある。点 ${E} は、ℓ と m のあいだにあり、${A} と ${E}、${C} と ${E} を線分で結ぶ。${known} のとき、${target} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: `点 ${E} を通る、ℓ に平行な直線をひくと、角はどう分けられるかな？ 平行線の錯角は、どんな関係だったかな？`,
    steps,
  };
}
/** 02d07・02q05 折れ線 A−B−C−D：A は ℓ 上、D は m 上。B は A の右下、C は B の左下、D は C の右下（左右を入れかえたものもある）。
 *  ∠RAB＝α、∠ABC＝β＝α＋δ、∠BCD＝γ＝δ＋ε、∠CDL＝x＝ε （R は A の右の点、L は D の左の点）。α＋γ＝β＋x */
function zz(r, mode) {
  const [A, B, C, D, R, L] = sample(r, PTS, 6);
  const right = r(0, 1) === 0;
  const dw = right ? "右" : "左", dw2 = right ? "左" : "右";
  const al = r(10, 70), de = r(10, 70), ep = r(10, 70), be = al + de, ga = de + ep, x = ep;
  const ask = mode === "x" ? "x" : pick(r, ["x", "x", "al"]);
  const given = { al: `∠${R}${A}${B}＝${al}°`, be: `∠${A}${B}${C}＝${be}°`, ga: `∠${B}${C}${D}＝${ga}°`, x: `∠${C}${D}${L}＝${x}°` };
  const target = { al: `∠${R}${A}${B}`, x: `∠${C}${D}${L}` }[ask];
  const ans = { al, x }[ask];
  const known = ["al", "be", "ga", "x"].filter((k) => k !== ask).map((k) => given[k]).join("、");
  const steps = ask === "x"
    ? [`点 ${B}、${C} を通って ℓ に平行な直線をひく。`, `${B} で、∠${A}${B}${C}＝${be}° のうち、錯角 ${al}° の残りは $${be}-${al}=${de}$ より ${de}°。`, `${C} で、∠${B}${C}${D}＝${ga}° のうち、錯角 ${de}° の残りは $${ga}-${de}=${ep}$ より ${ep}°。`, `${ep}° は m との錯角だから、∠${C}${D}${L}＝${ep}°。`]
    : [`点 ${B}、${C} を通って ℓ に平行な直線をひく。`, `${C} で、∠${B}${C}${D}＝${ga}° のうち、m との錯角 ${x}° の残りは $${ga}-${x}=${de}$ より ${de}°。`, `${B} で、∠${A}${B}${C}＝${be}° のうち、${C} での錯角 ${de}° の残りは $${be}-${de}=${al}$ より ${al}°。`, `${al}° は ℓ との錯角だから、∠${R}${A}${B}＝${al}°。`];
  return {
    q: `ℓ∥m。点 ${A} は ℓ 上、点 ${D} は m 上にあり、点 ${B}、${C} は ℓ と m のあいだにある。${A}、${B}、${C}、${D} を順に線分で結んだ折れ線は、${A} から ${dw}下の ${B}、${dw2}下の ${C}、${dw}下の ${D} の順に進む。ℓ 上に ${A} の${dw}の点 ${R}、m 上に ${D} の${dw2}の点 ${L} をとる。${known} のとき、${target} の大きさは何度か。`,
    ans,
    unit: "度",
    hint: `点 ${B}、${C} を通る、ℓ に平行な直線をひくと、角はどう分けられるかな？ 平行線の錯角は、どんな関係だったかな？`,
    steps,
  };
}

// ── 式を使う問題（dr.6）────────────────────────────────────────
/** 02d06a・b ℓ∥m：∠X＝(px+q)°、∠Y＝(rx+s)° のとき、x（または∠X の大きさ） */
function parEq(r, askAngle) {
  for (let i = 0; i < 300; i++) {
    const S = trans(r, true), x = r(5, 35), a = ang(r, 30, 150);
    const X = r(0, 7), Y = pick(r, [0, 1, 2, 3, 4, 5, 6, 7].filter((j) => vtxOf(j) !== vtxOf(X)));
    const eq = sameClass(X, Y), vy = eq ? a : 180 - a;
    // 等しい組は、同位角か錯角のどちらか（そのまま使える組）だけ
    if (eq && Y !== corr(X) && Y !== alt(X)) continue;
    const e1 = expr(r, x, a), e2 = expr(r, x, vy);
    if (!e1 || !e2 || (eq && e1.p === e2.p)) continue;
    const Z = corr(X);
    const rel = Y === corr(X) ? "同位角" : "錯角";
    const sumP = e1.p + e2.p, sumQ = e1.q + e2.q, d = Math.abs(e1.p - e2.p);
    const eqSteps = (() => {
      if (!eq) return solveParts(sumP, sumQ, 180, x);
      const big = e1.p > e2.p ? e1 : e2, small = big === e1 ? e2 : e1, rhs = small.q - big.q;
      return d === 1 ? [`x=${x}`] : [`${d}x=${rhs}`, `x=${x}`];
    })();
    return {
      q: `${S.intro}${S.nm(X)}＝${dgx(e1.p, e1.q)}、${S.nm(Y)}＝${dgx(e2.p, e2.q)} のとき、${askAngle ? `${S.nm(X)} の大きさは何度か。` : "$x$ の値は？"}`,
      ans: askAngle ? a : x,
      unit: askAngle ? "度" : undefined,
      hint: `${S.nm(X)} と ${S.nm(Y)} は、それぞれどの点のどのあたりの角かな？ ℓ∥m のとき、この2つの角の大きさには、どんな関係があるかな？`,
      steps: [
        eq ? `${S.nm(X)} と ${S.nm(Y)} は${rel}。ℓ∥m だから、等しい。` : `${S.nm(X)} の同位角は ${S.nm(Z)}（${S.where(Z)}）で、ℓ∥m だから ${S.nm(Z)}＝${S.nm(X)}。${S.nm(Z)} と ${S.nm(Y)} は一直線にならぶので、${S.nm(X)}＋${S.nm(Y)}＝180°。`,
        eq ? `${$(`${lin(e1.p, e1.q)}=${lin(e2.p, e2.q)}`)} より、${eqSteps.map($).join("、")}` : `${$(`(${lin(e1.p, e1.q)})+(${lin(e2.p, e2.q)})=180`)} より、${eqSteps.map($).join("、")}`,
        ...(askAngle ? [`${S.nm(X)}＝$${evalLin(e1.p, e1.q, x)}$ より、${a}°。`] : []),
      ],
    };
  }
}

// ── 平行線の性質・平行線になる条件のことがら（qz.3）─────────────────────
const TRUE_ST = [
  ["2直線が平行ならば、同位角は等しい。", "平行線の性質（同位角は等しい）そのもの。"],
  ["2直線が平行ならば、錯角は等しい。", "平行線の性質（錯角は等しい）そのもの。"],
  ["同位角が等しければ、2直線は平行である。", "平行線になる条件（同位角が等しいとき平行）そのもの。"],
  ["錯角が等しければ、2直線は平行である。", "平行線になる条件（錯角が等しいとき平行）そのもの。"],
  ["同位角が等しくなければ、2直線は平行ではない。", "同位角が等しいときだけ平行になるので、等しくなければ平行ではない。"],
  ["錯角が等しくなければ、2直線は平行ではない。", "錯角が等しいときだけ平行になるので、等しくなければ平行ではない。"],
];
const FALSE_ST = [
  ["同位角が等しくなければ、2直線は平行である。", "同位角が等しくないときは、平行ではない。"],
  ["錯角が等しくなければ、2直線は平行である。", "錯角が等しくないときは、平行ではない。"],
  ["2直線が平行ならば、錯角の和は 180° である。", "平行線の錯角は等しいが、和が 180° になるとは限らない。"],
  ["2直線が平行ならば、同位角は 90° である。", "平行線の同位角は等しいが、90° とは限らない。"],
  ["同位角が等しければ、2直線は垂直である。", "同位角が等しいと平行になるが、垂直とは限らない。"],
  ["錯角が等しければ、2直線は交わる。", "錯角が等しいと平行になり、交わらない。"],
];
function stmtChoice(r) {
  const T = pick(r, TRUE_ST), Fs = sample(r, FALSE_ST, 3);
  return {
    q: "次のうち、正しいものはどれか。（正しいものは、1つだけ）",
    ans: T[0],
    choices: choices4(r, T[0], Fs.map((f) => f[0])),
    hint: "平行線の性質と、平行線になる条件は、それぞれどんなことがらだったかな？ 「ならば」の前と後ろを入れかえても、正しいかな？",
    steps: [`正しいのは「${T[0]}」。${T[1]}`, ...Fs.map((f) => `「${f[0]}」は正しくない。${f[1]}`)],
  };
}

export const UNITS = [
  unit("02", {
    name: "平行線の性質と、平行線になる条件",
    desc: "平行な2直線の同位角・錯角は等しい。同位角か錯角が等しければ、2直線は平行",
    prereqs: ["J2-hk01"],
    points: [
      "2直線が平行ならば、同位角は等しく、錯角も等しい（平行線の性質）。",
      "2直線に1つの直線が交わるとき、同位角か錯角が等しければ、その2直線は平行である（平行線になる条件）。「ℓ と m が平行」は、記号で ℓ∥m と書く。",
      "平行線の性質と、一直線の角が 180° であることを組み合わせると、いろいろな角の大きさが求められる。折れ線の角は、折れ曲がる点を通って、ℓ に平行な補助線をひくと求められる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 02d01a ①③ 同位角
        t("02d01a", (r) => parSum(r, "corr")),
        // 02d01b ② 錯角
        t("02d01b", (r) => parSum(r, "alt")),
        // 02d02a ア〜ウ 平行といえるものを選ぶ
        t("02d02a", judgeChoice),
        // 02d02b ア〜ウ 平行といえるものはいくつ
        t("02d02b", judgeCount),
        // 02q01a・b 小テスト（1）同位角・錯角
        t("02q01a", (r) => parSum(r, "corr")),
        t("02q01b", (r) => parSum(r, "alt")),
        // 02q02 a と b は平行か
        t("02q02", judgeChoice),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 02d03a ①③ 平行線の性質と一直線の角（180°−○○°）
        t("02d03a", parSupp),
        // 02d03b ② 同位角と対頂角（大きさが同じ角）
        t("02d03b", parSame),
        // 02q01c 小テスト（1）③ 同位角と一直線の角
        t("02q01c", parSupp),
        // 02q03 正しいことがらを選ぶ
        t("02q03", stmtChoice),
        // 02q04 折れ線（E を通る補助線）
        t("02q04", (r) => zig(r, "x")),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 02d04 a〜d のうち、平行な組
        t("02d04", fourLines),
        // 02d05 折れ線（E を通る補助線）
        t("02d05", (r) => zig(r, "any")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 02d06a (2x−10)° と (3x+20)° → x
        t("02d06a", (r) => parEq(r, false)),
        // 02d06b 同じ問題で、角の大きさ
        t("02d06b", (r) => parEq(r, true)),
        // 02d07 折れ線 A−B−C−D（B、C を通る補助線）
        t("02d07", (r) => zz(r, "any")),
        // 02q05 チャレンジ：折れ線 A−B−C−D
        t("02q05", (r) => zz(r, "x")),
      ],
    },
  }),
];

// 移さなかった問題はない
export const SKIPPED = [];
