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
import { t, pick, choices4, sample, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

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

// 合同条件
const COND = { SSS: "3組の辺", SAS: "2組の辺とその間の角", ASA: "1組の辺とその両端の角", NONE: "どれにもあてはまらない" };
const condChoices = (r, key) => choices4(r, COND[key], Object.keys(COND).filter((k) => k !== key).map((k) => COND[k]));
/** 三角形の頂点の番号 0, 1, 2 で、等しいものを言う。辺 SIDE(i, j)（頂点 i と j をむすぶ辺）、角 ANG(i)（頂点 i の角） */
const SIDE = (i, j) => ({ k: "s", i, j });
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
/** 三角形の頂点の並び V の、頂点 i の角の名前（i 以外の 2頂点を、番号の小さい順にはさむ）。例 V=[A,O,B] なら、i=0 → OAB、i=1 → AOB、i=2 → ABO */
const angName = (V, i) => { const o = [0, 1, 2].filter((x) => x !== i); return V[o[0]] + V[i] + V[o[1]]; };
/** 等しいもの e を、「AB＝DE」「∠OAB＝∠ODC」の形の文字にする。short＝true なら、角は「∠B＝∠E」の短い形（頂点の名前がすべてちがう 2つの三角形用） */
const elText = (e, V1, V2, short = false) => {
  if (e.k === "s") { const [i, j] = (e.i + 1) % 3 === e.j || (e.j + 1) % 3 === e.i ? ((e.i + 1) % 3 === e.j ? [e.i, e.j] : [e.j, e.i]) : [e.i, e.j]; return `${V1[i]}${V1[j]}＝${V2[i]}${V2[j]}`; }
  return short ? `∠${V1[e.i]}＝∠${V2[e.i]}` : `∠${angName(V1, e.i)}＝∠${angName(V2, e.i)}`;
};

/** 証明の穴うめの問題。holes＝穴の候補 { 名前: { ans, pool（誤答の候補）, steps } }。lines(H)＝証明の行（H(名前) は、その穴なら「（　）」、そうでなければ正しいことば） */
function fillQ(r, N, head, lines, holes) {
  const key = pick(r, Object.keys(holes));
  const H = (k) => (k === key ? "（　）" : holes[k].ans);
  const h = holes[key];
  return {
    q: N(`${head}次は、その証明である。（　）にあてはまるものは？\n${lines(H).join("\n")}`),
    ans: h.ans,
    choices: choices4(r, h.ans, sample(r, h.pool, 3)),
    hint: "証明は、仮定や共通・対頂角などを示す行、合同条件の行、合同から結論を導く行の順に書いた。空欄は、どの行にあるかな？",
    steps: h.steps.map(N),
  };
}
const holeCond = (key, say) => ({ ans: COND[key], pool: [...["SSS", "SAS", "ASA"].filter((k) => k !== key).map((k) => COND[k]), "3組の角"], steps: [...say, `だから、合同条件は「${COND[key]}」。`] });
const holeCorr = (word, concl, tri1, tri2) => ({ ans: word, pool: ["辺", "角", "頂点", "直線", "面"].filter((x) => x !== word), steps: [`${tri1}≡${tri2} だから、対応する辺や角は等しい。`, `結論の ${concl} は${word}の等しさだから、「対応する${word}は等しい」を使う。`] });

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
/** 平行線と角の問題：角 a の大きさが g のとき、角 b の大きさ。道すじの解説つき */
function parProblem(r, a, b) {
  const N = namer(r, 8);
  const g = pick(r, [r(35, 85), r(95, 145)]);
  const path = route(a, b);
  let v = g;
  const steps = path.map((s) => {
    const nm = ANG8[s.to.pt][s.to.pos], from = ANG8[s.from.pt][s.from.pos];
    if (s.kind === "line") { const nv = 180 - v; const t1 = `一直線の角は 180° だから、∠${nm}＝180°−${v}°＝${nv}°`; v = nv; return t1; }
    const word = { vert: "対頂角", corr: "平行線の同位角", alt: "平行線の錯角" }[s.kind];
    return `${word}は等しいから、∠${nm}＝∠${from}＝${v}°`;
  });
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
const PAIRS = (f) => NODES8.flatMap((a) => NODES8.filter((b) => nodeKey(a) !== nodeKey(b) && f(a, b)).map((b) => [a, b]));
const CROSS = PAIRS((a, b) => cls8(a.pos) !== cls8(b.pos));                                // 答えが 180°−（与えられた角）
const CROSS_PT = PAIRS((a, b) => cls8(a.pos) !== cls8(b.pos) && a.pt !== b.pt);             // 2つの角が、A と B にわかれている（答えは 180°−（与えられた角）。道すじは 2回）
const SAME_FAR = PAIRS((a, b) => cls8(a.pos) === cls8(b.pos) && a.pt !== b.pt && !interior(a));   // 答えが与えられた角に等しくなるもの。外がわの角どうしで、道すじが 2回（対頂角と同位角）

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
          const [a, b] = r(0, 9) < 7 ? pick(r, CROSS) : pick(r, SAME_FAR);   // 答えが 180°−（与えられた角）になるものが多いが、等しくなるもの（道すじが2回）も、まぜる
          return parProblem(r, a, b);
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
          const [a, b] = r(0, 9) < 8 ? pick(r, CROSS_PT) : pick(r, SAME_FAR);
          return parProblem(r, a, b);
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
            ? [pick(r, [...SSSs, ...SASs, ...ASAs]), ...sample(r, [...SSAs, ...AAAs], 3)]
            : [pick(r, [...SSAs, ...AAAs]), pick(r, SSSs), pick(r, SASs), pick(r, ASAs)];   // 3組の辺・2組の辺とその間の角・1組の辺とその両端の角を 1つずつ
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
        // 14d04b 演習（4）条件から、合同条件を答える
        t("14d04b", (r) => {
          const N = namer(r, 6), V1 = ["A", "B", "C"], V2 = ["D", "E", "F"];
          const kind = pick(r, ["SSS", "SAS", "SAS", "ASA", "ASA", "SSA", "SSA", "AAA"]);
          const v = r(0, 2), x = (v + 1) % 3, y = (v + 2) % 3;
          const els = kind === "SSS" ? [SIDE(0, 1), SIDE(1, 2), SIDE(2, 0)]
            : kind === "SAS" ? [SIDE(v, x), SIDE(v, y), ANG(v)]
            : kind === "ASA" ? [SIDE(v, x), ANG(v), ANG(x)]
            : kind === "SSA" ? [SIDE(v, x), SIDE(v, y), ANG(pick(r, [x, y]))]
            : [ANG(0), ANG(1), ANG(2)];
          const key = judge(els), tx = shuffle(r, els).map((e) => elText(e, V1, V2, true));
          const angs = els.filter((e) => e.k === "a");
          return {
            q: N(`△ABC と △DEF で、${tx.join("、")} のとき、三角形の合同条件のうち、あてはまるものは？`),
            ans: COND[key],
            choices: condChoices(r, key),
            hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
            steps: [
              `等しいのは、${tx.join("、")}。`,
              kind === "SAS" ? `∠${V1[v]} は、辺 ${V1[v]}${V1[x]} と ${V1[v]}${V1[y]} の間の角。`
                : kind === "ASA" ? `辺 ${V1[v]}${V1[x]} の両端の角（∠${V1[v]} と ∠${V1[x]}）が、それぞれ等しい。`
                : kind === "SSS" ? "辺が 3組とも、それぞれ等しい。"
                : kind === "SSA" ? `∠${V1[angs[0].i]} は、等しい 2辺の間の角ではない（間の角は ∠${V1[v]}）。`
                : "3組の角が等しいだけでは、大きさがちがう三角形もある。",
              key === "NONE" ? "だから、3つの合同条件のどれにもあてはまらない。" : `だから、合同条件は「${COND[key]}」。`,
            ].map(N),
          };
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
          const wrongSide = () => { const [i, j] = pick(r, sidesAll); const [i2, j2] = pick(r, sidesAll.filter(([p, q]) => !(p === i && q === j))); return sideEq(i, j, i2, j2); };
          const wrongAng = () => { const i = r(0, 2), j = (i + r(1, 2)) % 3; return angEq(i, j); };
          const side = r(0, 1) === 0;
          const ansT = side ? (() => { const [i, j] = pick(r, sidesAll); return sideEq(i, j, i, j); })() : (() => { const i = r(0, 2); return angEq(i, i); })();
          const mk = side ? [wrongSide, wrongSide, wrongAng] : [wrongAng, wrongAng, wrongSide];   // 答えが辺のときも角のときも、誤答に辺と角の両方を入れる
          const ws = new Set();
          for (let n = 0; n < 80 && ws.size < 3; n++) { const w = mk[ws.size](); if (w !== ansT) ws.add(w); }
          if (ws.size < 3) return { skip: true };
          return {
            q: N(`△${V1.join("")}≡△${V2.join("")} のとき、次のうち、必ず成り立つものはどれか。`),
            ans: N(ansT),
            choices: choices4(r, N(ansT), [...ws].map(N)),
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
        // 14q03a 小テスト（3）AO＝BO、∠OAC＝∠OBD → AC＝BD の穴うめ（対頂角・合同条件・対応する辺）
        t("14q03a", (r) => {
          const N = namer(r, 4, "O"), t1 = "△AOC", t2 = "△BOD";
          return fillQ(r, N, "線分 AB と CD が点 O で交わり、AO＝BO、∠OAC＝∠OBD ならば、AC＝BD である。",
            (H) => [
              `${t1} と ${t2} において`,
              "仮定より　AO＝BO …①　　∠OAC＝∠OBD …②",
              `${H("vert")}は等しいから　∠AOC＝∠BOD …③`,
              `①、②、③より、${H("cond")}が、それぞれ等しいから　${t1}≡${t2}`,
              `合同な図形の、対応する${H("corr")}は等しいから　AC＝BD`,
            ],
            {
              vert: { ans: "対頂角", pool: ["同位角", "錯角", "外角", "内角"], steps: ["∠AOC と ∠BOD は、直線 AB と CD が交わってできる、向かい合う角。", "向かい合う角を「対頂角」といい、対頂角は等しい。"] },
              cond: holeCond("ASA", ["等しいのは、AO＝BO、∠OAC＝∠OBD、∠AOC＝∠BOD。", "辺 AO の両端の角（∠OAC と ∠AOC）が、それぞれ等しい。"]),
              corr: holeCorr("辺", "AC＝BD", t1, t2),
            });
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
        // 14d05c 演習（5）証明の各行の根拠（中点・錯角・対頂角）／合同条件
        t("14d05c", (r) => {
          const N = namer(r, 4, "M");
          const head = "線分 AB の中点を M とする。M を通る線分 CD を、C が AB の上がわ、D が下がわになるようにひく（M は CD 上にある）。AC∥DB である。CM＝DM を証明するために、△AMC と △BMD の合同を示す。";
          const k = pick(r, ["mid", "alt", "vert", "cond"]);
          if (k === "cond") {
            const V1 = ["A", "M", "C"], V2 = ["B", "M", "D"], els = [SIDE(0, 1), ANG(0), ANG(1)], key = judge(els);
            return {
              q: N(`${head}AM＝BM、∠MAC＝∠MBD、∠AMC＝∠BMD がいえるとき、合同条件は、次のうちどれか。`),
              ans: COND[key],
              choices: condChoices(r, key),
              hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
              steps: [
                "等しいのは、AM＝BM、∠MAC＝∠MBD、∠AMC＝∠BMD。",
                "辺 AM の両端の角（∠MAC と ∠AMC）が、それぞれ等しい。",
                `だから、合同条件は「${COND[key]}」。`,
              ].map(N),
            };
          }
          const eq = { mid: "AM＝BM", alt: "∠MAC＝∠MBD", vert: "∠AMC＝∠BMD" }[k];
          const ans = { mid: "M は AB の中点だから", alt: "平行線の錯角は等しいから", vert: "対頂角は等しいから" }[k];
          const wrongs = [...["M は AB の中点だから", "平行線の錯角は等しいから", "対頂角は等しいから"].filter((x) => x !== ans), pick(r, ["平行線の同位角は等しいから", "共通だから"])];
          const why = { mid: ["AM と BM は、AB を 2つに分けた線分。M は AB の中点（真ん中の点）。", "だから、根拠は「M は AB の中点だから」。"], alt: ["AC∥DB で、直線 AB が 2直線に交わっている。C と D は、AB をはさんで反対がわにある。", "だから、∠MAC と ∠MBD は錯角。根拠は「平行線の錯角は等しいから」。"], vert: ["直線 AB と CD が M で交わってできる、向かい合う角。", "だから、根拠は「対頂角は等しいから」。"] }[k];
          return {
            q: N(`${head}${eq} と書く根拠として、正しいものは、次のうちどれか。`),
            ans: N(ans),
            choices: choices4(r, N(ans), wrongs.map(N)),
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
        // 14d07b 演習（7）②∠A＝a° のとき、∠BIC を a で表す式（4択）。∠IBC＋∠ICB を a で表す問い、∠B・∠C から ∠BIC を表す問いもある
        t("14d07b", (r) => {
          const N = namer(r, 3), v = pick(r, ["a", "a", "ibc", "bc"]);
          const head = "△ABC の ∠B、∠C の二等分線の交点を I とする。";
          const hint = "文字を、具体的な数（たとえば 56° など）におきかえて、求める角を計算してみよう。その手順を、文字のままで、たどってみよう。";
          const spec = {
            a: {
              q: `${head}∠A＝$a$° のとき、∠BIC の大きさ（単位は度）を $a$ を使って表した式として、正しいものは、次のうちどれか。`,
              ans: "$90+\\frac{1}{2}a$", near: ["$90-\\frac{1}{2}a$", "$180-\\frac{1}{2}a$", "$90+a$"], far: ["$180-a$", "$\\frac{1}{2}a$", "$2a$"],
              steps: ["∠B＋∠C＝180°−$a$°。二等分線だから、∠IBC＋∠ICB＝$\\frac{1}{2}(180-a)$°。", "△IBC の内角の和は 180° だから、∠BIC＝180°−$\\frac{1}{2}(180-a)$°＝$90+\\frac{1}{2}a$°。"],
            },
            ibc: {
              q: `${head}∠A＝$a$° のとき、∠IBC と ∠ICB の大きさの和（単位は度）を $a$ を使って表した式として、正しいものは、次のうちどれか。`,
              ans: "$90-\\frac{1}{2}a$", near: ["$90+\\frac{1}{2}a$", "$180-\\frac{1}{2}a$", "$90-a$"], far: ["$180-a$", "$\\frac{1}{2}a$", "$2a$"],
              steps: ["∠B＋∠C＝180°−$a$°。", "二等分線だから、∠IBC＋∠ICB＝(∠B＋∠C)÷2＝$\\frac{1}{2}(180-a)$°＝$90-\\frac{1}{2}a$°。"],
            },
            bc: {
              q: `${head}∠B＝$b$°、∠C＝$c$° のとき、∠BIC の大きさ（単位は度）を $b$、$c$ を使って表した式として、正しいものは、次のうちどれか。`,
              ans: "$180-\\frac{1}{2}(b+c)$", near: ["$180-(b+c)$", "$90+\\frac{1}{2}(b+c)$", "$90-\\frac{1}{2}(b+c)$"], far: ["$\\frac{1}{2}(b+c)$", "$b+c$"],
              steps: ["二等分線だから、∠IBC＝$\\frac{1}{2}b$°、∠ICB＝$\\frac{1}{2}c$°。", "△IBC の内角の和は 180° だから、∠BIC＝180°−($\\frac{1}{2}b+\\frac{1}{2}c$)°＝$180-\\frac{1}{2}(b+c)$°。"],
            },
          }[v];
          const ws = [...sample(r, spec.near, 2), pick(r, spec.far)];
          return { q: N(spec.q), ans: spec.ans, choices: choices4(r, spec.ans, ws), hint, steps: spec.steps.map(N) };
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
