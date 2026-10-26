// ============================================================
// heikou-04.js — 平行と合同 第4時「三角形の内角・外角の性質を使って、角の大きさを求めよう」
//   ikkan の演習プリント（heikou-04.dr.1〜8）・小テスト（heikou-04.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「04」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：04d03b ＝ heikou-04.dr.3 の ∠y
//   図は出せないので、点の名前（A、B、C、D、P、I）と位置関係（辺 BC を C の方へのばした先に点 D、辺 BC 上に点 D、二等分線の交点）を、問題文で言い切る。
//   角度は整数の度。答えは、問題文の数字から計算して出す（内角の和 180°・外角の性質）。
//   「説明しよう」（dr.8）は、正しい説明（理由）を選ぶ4択に直した。
// ============================================================
import { t as t0, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** 解説の算式（「180°−25°−75°＝80°」の形）を $…$ に入れる（° は ^\circ、∠ は \angle、× は \times、÷ は \div）。すでに $…$ の中にあるものは、そのまま */
const MATH_RUN = /[0-9A-Z∠△●○(][0-9A-Z∠△●○°+\-−×÷＝=().]*/g;
const mathify = (line) => line.split("$").map((seg, i) => (i % 2 ? seg : seg.replace(MATH_RUN, (run) => {
  if (!/[＝=+\-−×÷]/.test(run) || !/[0-9●○]/.test(run) || /[+\-−×÷＝=]$/.test(run)) return run;
  return "$" + run.replace(/∠/g, "\\angle ").replace(/△/g, "\\triangle ").replace(/°/g, "^\\circ").replace(/＝/g, "=").replace(/−/g, "-").replace(/×/g, "\\times ").replace(/÷/g, "\\div ").replace(/●/g, "\\bullet ").replace(/○/g, "\\bigcirc ") + "$";
}))).join("$");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は作り直し（skip）、解説の算式は $…$ に入れる */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  if (!p || p.skip) return p;
  if (typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans)) return { skip: true };
  return { ...p, steps: p.steps.map(mathify) };
});

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const TRI = ["鋭角三角形", "直角三角形", "鈍角三角形"];
const NONE = "三角形はできない";
/** 3つの内角から、三角形の種類（0＝鋭角、1＝直角、2＝鈍角） */
const kindOf = (...a) => { const m = Math.max(...a); return m > 90 ? 2 : m === 90 ? 1 : 0; };
const KIND_WHY = [
  "3つの内角が、どれも 90° より小さい（鋭角）",
  "1つの内角が 90°（直角）",
  "1つの内角が 90° より大きい（鈍角）",
];
const m5 = (r, lo, hi) => 5 * r(lo / 5, hi / 5);   // 5の倍数
const sg = (v) => String(v).replace("-", "−");   // 負の数の符号（−）
const alpha = (x, y) => (x < y ? [x, y] : [y, x]);

/** 2つの内角 [a, b]（5の倍数）で、残りの角と合わせた三角形の種類が k になる組 */
function pairOfKind(r, k) {
  for (let i = 0; i < 500; i++) {
    let a, b;
    if (k === 1) {
      if (r(0, 2) === 0) { a = 90; b = m5(r, 15, 75); }
      else { a = m5(r, 15, 75); b = 90 - a; }
    } else { a = m5(r, 15, 120); b = m5(r, 15, 120); }
    if (a + b > 165) continue;
    if (kindOf(a, b, 180 - a - b) === k) return shuffle(r, [a, b]);
  }
  return null;
}
const pairKey = (p) => [...p].sort((x, y) => x - y).join(",");

/** 2つの内角から三角形の種類を言う解説（3行） */
const stepsKind = (a, b) => {
  const c = 180 - a - b, k = kindOf(a, b, c);
  return [`残りの角は　180°−${a}°−${b}°＝${c}°`, `3つの内角は ${a}°、${b}°、${c}° で、${KIND_WHY[k]}。`, `よって、${TRI[k]}。`];
};

// ── 辺をのばして外角をつくる（△ABC の頂点 V の外角 ∠WVD ＝ ∠U＋∠W）──────────
/** 頂点 V の外角：辺 UV を V の方へのばした先に点 D。外角 ∠WVD は、V にとなりあわない 2つの内角 ∠U、∠W の和 */
function frame(r) {
  const V = pick(r, ["A", "B", "C"]);
  const rest = ["A", "B", "C"].filter((x) => x !== V);
  const U = pick(r, rest), W = rest.find((x) => x !== U);
  const text = pick(r, [
    `△ABC の辺 ${U}${V} を ${V} の方へのばして、その先に点 D をとる。`,
    `△ABC で、辺 ${U}${V} を ${V} の方へのばした先に点 D をとる。`,
  ]);
  return { V, U, W, text, ext: `∠${W}${V}D` };
}

/** 外角の性質で、外角を求める（2つの内角から） */
function extSum(r, lo, hi, step) {
  const f = frame(r);
  let a, b;
  do { a = step === 5 ? m5(r, lo, hi) : r(lo, hi); b = step === 5 ? m5(r, lo, hi) : r(lo, hi); } while (a + b > 165 || a === b);
  const [p, q] = alpha(f.U, f.W), vp = p === f.U ? a : b, vq = q === f.U ? a : b;
  return {
    q: `${f.text}∠${p}＝${vp}°、∠${q}＝${vq}° のとき、${f.ext} の大きさは？`,
    ans: a + b,
    unit: "度",
    hint: "外角の性質を思い出そう。外角は、どの角の和に等しいのだったかな？",
    steps: [`${f.ext} は、${f.V} にとなりあわない 2つの内角 ∠${p}、∠${q} の和に等しい（外角の性質）。`, `${f.ext}＝∠${p}+∠${q}＝${vp}°+${vq}°＝${a + b}°`],
  };
}

/** 外角と1つの内角から、もう1つの内角を求める */
function extDiff(r, lo, hi, step) {
  const f = frame(r);
  let e, u, w;
  do {
    e = step === 5 ? m5(r, lo, hi) : r(lo, hi);
    u = step === 5 ? m5(r, 20, e - 20) : r(20, e - 20);
    w = e - u;
  } while (w < 20 || w === u || e < 60 || e > 165);
  const [giv, ask] = pick(r, [[f.U, f.W], [f.W, f.U]]);
  const vg = giv === f.U ? u : w, va = ask === f.U ? u : w;
  return {
    q: `${f.text}${f.ext}＝${e}°、∠${giv}＝${vg}° のとき、∠${ask} の大きさは？`,
    ans: va,
    unit: "度",
    hint: "外角の性質を、式で表せないかな？ 外角と、となりあわない 2つの内角の間に、どんな関係があったかな？",
    steps: [`${f.ext} は、${f.V} にとなりあわない 2つの内角 ∠${giv}、∠${ask} の和に等しい（外角の性質）。`, `${e}°＝∠${giv}+∠${ask}＝${vg}°+∠${ask} だから、∠${ask}＝${e}°−${vg}°＝${va}°`],
  };
}

// ── 辺 BC 上の点 D で、△ABC を 2つに分ける ─────────────────────────────
/** 辺 PQ 上の点 D。∠P＝p、∠Q＝q、∠PAD＝s。ask＝ADQ（△APD の外角）／DAQ（∠A のうちの、のこり） */
function splitQ(r, ask, { pLo = 30, pHi = 80, sLo = 10 } = {}) {
  let p, q, s;
  do { p = r(pLo, pHi); q = r(pLo, pHi); s = r(sLo, 60); } while (s > 180 - p - q - 10 || p === q || s === p || s === q);
  const flip = r(0, 1) === 1, P = flip ? "C" : "B", Q = flip ? "B" : "C";
  const vp = p, vq = q;
  const [n1, n2] = alpha("B", "C"), v1 = n1 === P ? vp : vq, v2 = n2 === P ? vp : vq;
  const adq = p + s, daq = 180 - adq - q;
  const head = `△ABC の辺 BC 上に点 D がある。∠${n1}＝${v1}°、∠${n2}＝${v2}°、∠${P}AD＝${s}° のとき、`;
  if (ask === "ADQ") {
    return {
      q: `${head}∠AD${Q} の大きさは？`,
      ans: adq,
      unit: "度",
      hint: `∠AD${Q} は、どの三角形の外角になっているかな？`,
      steps: [`∠AD${Q} は △A${P}D の外角だから、それととなりあわない 2つの内角 ∠${P}、∠${P}AD の和に等しい。`, `∠AD${Q}＝∠${P}+∠${P}AD＝${p}°+${s}°＝${adq}°`],
    };
  }
  return {
    q: `${head}∠DA${Q} の大きさは？`,
    ans: daq,
    unit: "度",
    hint: `△AD${Q} の内角の和は 180°。先に求められる角は、どれかな？`,
    steps: [`∠AD${Q} は △A${P}D の外角だから　∠AD${Q}＝∠${P}+∠${P}AD＝${p}°+${s}°＝${adq}°`, `△AD${Q} の内角の和は 180° だから　∠DA${Q}＝180°−${adq}°−${q}°＝${daq}°`],
  };
}

// ── 3つの内角の関係（ある角をもとにした倍・差）────────────────────────────
/** 基準の角 ref をもとに、ほかの 2つの角が「k倍」か「m° 大きい／小さい」。ref の大きさ x が整数になる組 */
const FORMS = [{ k: 2, m: 0 }, { k: 3, m: 0 }, ...[10, 15, 20, 25, 30, 35, 40, 45, 50].flatMap((m) => [{ k: 1, m }, { k: 1, m: -m }])];
const RELS = (() => {
  const out = [];
  for (const ref of ["A", "B", "C"]) {
    const [n1, n2] = ["A", "B", "C"].filter((v) => v !== ref);
    for (const f1 of FORMS) for (const f2 of FORMS) {
      if (f1.k > 1 && f2.k > 1) continue;
      const S = f1.k + 1 + f2.k, R = 180 - f1.m - f2.m;
      if (R % S) continue;
      const x = R / S, v1 = f1.k * x + f1.m, v2 = f2.k * x + f2.m;
      if ([x, v1, v2].some((v) => v < 15 || v > 150) || v1 === v2 || v1 === x || v2 === x) continue;
      out.push({ ref, n1, n2, f1, f2, x, v1, v2, S, R, kind: kindOf(x, v1, v2), val: { [ref]: x, [n1]: v1, [n2]: v2 } });
    }
  }
  return out;
})();
// 三角形にならない関係（x が整数で、0° 以下の角ができる組）。「できる三角形は？」の問題で、ときどき出す
const FORMS_BIG = [{ k: 2, m: 0 }, { k: 3, m: 0 }, ...[10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120].flatMap((m) => [{ k: 1, m }, { k: 1, m: -m }])];
const RELS_NO = (() => {
  const out = [];
  for (const ref of ["A", "B", "C"]) {
    const [n1, n2] = ["A", "B", "C"].filter((v) => v !== ref);
    for (const f1 of FORMS_BIG) for (const f2 of FORMS_BIG) {
      if (f1.k > 1 && f2.k > 1) continue;
      const S = f1.k + 1 + f2.k, R = 180 - f1.m - f2.m;
      if (R % S) continue;
      const x = R / S, v1 = f1.k * x + f1.m, v2 = f2.k * x + f2.m;
      if (Math.min(x, v1, v2) > 0) continue;
      out.push({ ref, n1, n2, f1, f2, x, v1, v2, S, R, val: { [ref]: x, [n1]: v1, [n2]: v2 } });
    }
  }
  return out;
})();
const termX = (f) => (f.k > 1 ? `${f.k}x` : `(x${f.m > 0 ? "+" : "-"}${Math.abs(f.m)})`);
const phrase = (name, ref, f, first) => (f.k > 1 ? `∠${name} は ∠${ref} の ${f.k}倍${first ? "で、" : "である。"}` : `∠${name} は ∠${ref} より ${Math.abs(f.m)}° ${f.m > 0 ? (first ? "大きく、" : "大きい。") : (first ? "小さく、" : "小さい。")}`);
const relText = (R) => `△ABC で、${phrase(R.n1, R.ref, R.f1, true)}${phrase(R.n2, R.ref, R.f2, false)}`;
const relDraw = (R) => `三角形 ABC をかく。${phrase(R.n1, R.ref, R.f1, true)}${phrase(R.n2, R.ref, R.f2, false)}`;   // 「かく」問題（できないこともある）
/** 解説（4行）。tail(値の表) で、さいごの行を言う */
function relSteps(R, tail) {
  const { ref, n1, n2, f1, f2, x, S } = R, off = f1.m + f2.m, term = { [ref]: "x", [n1]: termX(f1), [n2]: termX(f2) };
  return [
    `∠${ref} を $x$° とすると、∠${n1}＝${$(term[n1])}°、∠${n2}＝${$(term[n2])}°`,
    `内角の和は 180° だから　${$(`${term.A}+${term.B}+${term.C}=180`)}`,
    off === 0 ? `${$(`${S}x=180`)} より　${$(`x=${x}`)}` : `${$(`${S}x${off > 0 ? "+" : "-"}${Math.abs(off)}=180`)}、${$(`${S}x=${R.R}`)} より　${$(`x=${x}`)}`,
    tail(R.val),
  ];
}
const relBad = (R, val) => [Math.abs(R.f1.m), Math.abs(R.f2.m), R.f1.k, R.f2.k].includes(val);   // 答えが、問題文の数と同じになる組は使わない

// ── 内角の比 ───────────────────────────────────────────────────────
/** 比 p：q：r（p＜q＜r、これ以上かんたんにできない比）で、合計が 180 の約数になるもの */
const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
const RATIOS = (() => {
  const out = [];
  for (let p = 1; p <= 7; p++) for (let q = p; q <= 9; q++) for (let s = q; s <= 9; s++) {
    const sum = p + q + s;
    if (180 % sum || p === q || q === s || gcd2(gcd2(p, q), s) !== 1) continue;   // 同じ数をふくむ比は、解説の式が重なるので使わない
    const u = 180 / sum, a = [p * u, q * u, s * u];
    if (a[0] < 10) continue;
    out.push({ p, q, s, sum, u, a, kind: kindOf(...a) });
  }
  return out;
})();
/** 比を、順番をかえて出す（ord＝並べかえた比）。解説は、その順で書く */
const ratioSteps = (R, ord) => [
  `比の合計は ${ord.join("+")}＝${R.sum}。比の 1 にあたる大きさは　180°÷${R.sum}＝${R.u}°`,
  `3つの内角は　${ord.map((v) => `${R.u}°×${v}＝${R.u * v}°`).join("、")}`,
];

// ── 二等分線の問題の、頂点の名前（X＝大きさがわかる角、Y・Z＝二等分する角）───────────
const perm3 = (r) => shuffle(r, ["A", "B", "C"]);

// ── 「かならず…がある」理由を選ぶ問題（04d08）──────────────────────────────
// 4つの選択肢は、どれも「（対象）が ○○° より小さい（大きい）とすると、3つの内角の和が ○○° を下まわり（上まわり）、三角形の内角の和の決まりに合わないから。」の形。
// 数（しきいの数 p と、その 3倍）は、4つとも同じ。変わるのは、次の 2つだけ：対象（3つのすべて／3つのうち 2つ）と、向き（下まわり／上まわり）。
// 正しい理由は、対象も向きも合っているもの。誤答は、どちらか一方か両方を変えたもの（どれも、仮定から導けない式になる）。
// 数が 4つとも同じなので、問題文の数や 180・3倍の数をさがしても、当たらない。
const CLAIMS = [
  {
    claim: () => "60° 以上のものが、かならず1つはある",
    p: () => 60, cmp: "小さい", dir: ["下まわり", "上まわり"],
    hint: () => "もし、60° 以上の角が1つもないとしたら、3つの内角の和を、三角形の内角の和の決まりとくらべると、どうなるかな？",
    steps: () => ["もし、60° 以上の内角が 1つもないとする。", "3つの内角がすべて 60° より小さいので、内角の和は 60°×3＝180° より小さくなる。", "しかし、三角形の内角の和は 180° だから、これは合わない。", "したがって、60° 以上の内角が、かならず 1つはある。対象と向きが合っている選択肢が、正しい説明。"],
  },
  {
    claim: () => "60° 以下のものが、かならず1つはある",
    p: () => 60, cmp: "大きい", dir: ["上まわり", "下まわり"],
    hint: () => "もし、60° 以下の角が1つもないとしたら、3つの内角の和を、三角形の内角の和の決まりとくらべると、どうなるかな？",
    steps: () => ["もし、60° 以下の内角が 1つもないとする。", "3つの内角がすべて 60° より大きいので、内角の和は 60°×3＝180° より大きくなる。", "しかし、三角形の内角の和は 180° だから、これは合わない。", "したがって、60° 以下の内角が、かならず 1つはある。対象と向きが合っている選択肢が、正しい説明。"],
  },
  {
    claim: (t) => `3つの内角が、すべて ${t}° より大きくなることはない`,
    p: (t) => t, cmp: "大きい", dir: ["上まわり", "下まわり"], ts: [65, 70, 75, 80, 90],
    hint: () => "もし、そうなったとしたら、3つの内角の和を、三角形の内角の和の決まりとくらべると、どうなるかな？",
    steps: (t) => [`もし、3つの内角がすべて ${t}° より大きくなったとする。`, `内角の和は ${t}°×3＝${3 * t}° より大きくなる。`, `しかし、三角形の内角の和は 180° で、${3 * t}° より大きくはならないから、これは合わない。`, "したがって、そうなることはない。対象と向きが合っている選択肢が、正しい説明。"],
  },
  {
    claim: (t) => `3つの内角が、すべて ${t}° より小さくなることはない`,
    p: (t) => t, cmp: "小さい", dir: ["下まわり", "上まわり"], ts: [40, 45, 50, 55],
    hint: () => "もし、そうなったとしたら、3つの内角の和を、三角形の内角の和の決まりとくらべると、どうなるかな？",
    steps: (t) => [`もし、3つの内角がすべて ${t}° より小さくなったとする。`, `内角の和は ${t}°×3＝${3 * t}° より小さくなる。`, `しかし、三角形の内角の和は 180° で、${3 * t}° より小さくはならないから、これは合わない。`, "したがって、そうなることはない。対象と向きが合っている選択肢が、正しい説明。"],
  },
];
const K_OK = "3つの内角の全部", K_BAD = "3つの内角の一部";   // 言葉の長さをそろえる（数字は入れない）
function claimQ(r) {
  const c = pick(r, CLAIMS), t = c.ts ? pick(r, c.ts) : null, p = c.p(t), [dOk, dBad] = c.dir;
  const opt = (K, d) => `${K}が ${p}° より${c.cmp}とすると、3つの内角の和が ${3 * p}° を${d}、三角形の内角の和の決まりに合わないから。`;
  const ans = opt(K_OK, dOk);
  return {
    q: `三角形の 3つの内角について、「${c.claim(t)}」。その理由として、正しいものはどれか。`,
    ans,
    choices: shuffle(r, [ans, opt(K_BAD, dOk), opt(K_OK, dBad), opt(K_BAD, dBad)]),
    hint: c.hint(t),
    steps: c.steps(t),
  };
}

export const UNITS = [
  unit("04", {
    name: "三角形の内角・外角の性質",
    desc: "外角の性質と内角の和で、三角形の角の大きさを求める。鋭角・直角・鈍角三角形",
    prereqs: ["J2-hk03"],
    points: [
      "三角形の内側の角を内角という。三角形の1つの辺をのばしたとき、のばした辺と、となりの辺がつくる角を外角という。三角形の3つの内角の和は 180° である。",
      "三角形の外角は、それととなりあわない2つの内角の和に等しい（外角の性質）。たとえば △ABC の辺 BC を C の方へのばして点 D をとると、∠ACD は、∠A と ∠B の和に等しい。",
      "90° より小さい角を鋭角、90° より大きく 180° より小さい角を鈍角という。3つの内角がすべて鋭角の三角形を鋭角三角形、1つが直角の三角形を直角三角形、1つが鈍角の三角形を鈍角三角形という。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 04d01a 演習（1）2つの内角から、三角形の種類（4択）
        t("04d01a", (r) => {
          const k = r(0, 3);
          if (k === 3) {   // 2つの内角の和が 180° 以上 → 三角形はできない
            let a, b;
            do { a = m5(r, 60, 140); b = m5(r, 60, 140); } while (a + b < 180 || a + b > 235);
            return {
              q: `三角形の 2つの内角を ${a}°、${b}° にしてかく。できる三角形は、次のうちどれか。`,
              ans: NONE,
              choices: choices4(r, NONE, TRI),
              hint: "三角形の3つの内角の和は何度だったかな？ 残りの角の大きさを求めると、何がわかるかな？",
              steps: [`2つの内角の和は　${a}°+${b}°＝${a + b}°`, "三角形の内角の和は 180° だから、残りの角が 0° 以下になってしまう。", `よって、答えは「${NONE}」。`],
            };
          }
          const pr = pairOfKind(r, k);
          if (!pr) return { skip: true };
          const [a, b] = pr, ans = TRI[k];
          return {
            q: `三角形の 2つの内角を ${a}°、${b}° にしてかく。できる三角形は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, [...TRI, NONE].filter((x) => x !== ans)),
            hint: "三角形の3つの内角の和は何度だったかな？ 残りの角の大きさを求めると、何がわかるかな？",
            steps: stepsKind(a, b),
          };
        }),
        // 04d02a 演習（2）①③ 2つの内角から、外角を求める
        t("04d02a", (r) => extSum(r, 20, 90, 5)),
        // 04d02b 演習（2）② 外角と1つの内角から、もう1つの内角を求める
        t("04d02b", (r) => extDiff(r, 80, 165, 5)),
        // 04q01 小テスト（1）4つの組のうち、ある種類の三角形になるものを選ぶ
        t("04q01", (r) => {
          const k = r(0, 2), others = [0, 1, 2].filter((x) => x !== k);
          const kinds = shuffle(r, [others[0], others[1], pick(r, others)]);
          const prs = [pairOfKind(r, k)], seen = new Set([pairKey(prs[0])]);
          for (const kk of kinds) {
            for (let i = 0; i < 80; i++) {
              const p = pairOfKind(r, kk);
              if (p && !seen.has(pairKey(p))) { seen.add(pairKey(p)); prs.push(p); break; }
            }
          }
          if (prs.length < 4 || prs.some((p) => !p)) return { skip: true };
          const txt = (p) => `${p[0]}°、${p[1]}°`, line = (p) => `${p[0]}° と ${p[1]}° → 残りは ${180 - p[0] - p[1]}°（${TRI[kindOf(p[0], p[1], 180 - p[0] - p[1])]}）`;
          return {
            q: `次の 4つの組は、それぞれ三角形の 2つの内角の大きさを表している。${TRI[k]}になるものは、どれか。`,
            ans: txt(prs[0]),
            choices: choices4(r, txt(prs[0]), prs.slice(1).map(txt)),
            hint: "三角形の3つの内角の和は何度だったかな？ 組ごとに、残りの角を求めると、種類がわかるかな？",
            steps: [`組ごとに、180° から 2つの角の和をひいて、残りの角を求める。`, `${line(prs[0])}　　${line(prs[1])}`, `${line(prs[2])}　　${line(prs[3])}`, `${TRI[k]}になるのは「${txt(prs[0])}」。`],
          };
        }),
        // 04q02 小テスト（2）外角を求める
        t("04q02", (r) => extSum(r, 25, 85, 1)),
        // 04q03 小テスト（3）外角と1つの内角から、もう1つの内角
        t("04q03", (r) => extDiff(r, 90, 160, 1)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 04d03a 演習（3）∠x：辺 BC 上の点 D で分けたときの ∠ADC
        t("04d03a", (r) => splitQ(r, "ADQ")),
        // 04d03b 演習（3）∠y：∠DAC
        t("04d03b", (r) => splitQ(r, "DAQ")),
        // 04d04a 演習（4）3つの内角の関係から、1つの角の大きさ
        t("04d04a", (r) => {
          const R = pick(r, RELS), ask = pick(r, ["A", "B", "C"]), val = R.val[ask];
          if (relBad(R, val)) return { skip: true };
          return {
            q: `${relText(R)}∠${ask} の大きさは？`,
            ans: val,
            unit: "度",
            hint: `∠${R.ref} を $x$° とおくと、ほかの 2つの角は $x$ を使ってどう表せるかな？ 3つの内角の和は何度だったかな？`,
            steps: relSteps(R, (v) => `∠A＝${v.A}°、∠B＝${v.B}°、∠C＝${v.C}° だから、∠${ask} は ${val}°。`),
          };
        }),
        // 04d04b 演習（4）3つの内角の関係から、三角形の種類（4択）
        t("04d04b", (r) => {
          const k = r(0, 3), R = pick(r, k === 3 ? RELS_NO : RELS.filter((x) => x.kind === k)), ans = k === 3 ? NONE : TRI[k];
          return {
            q: `${relDraw(R)}できる三角形は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, [...TRI, NONE].filter((x) => x !== ans)),
            hint: `∠${R.ref} を $x$° とおくと、ほかの 2つの角は $x$ を使ってどう表せるかな？ 3つの内角がすべて求められたら、何がわかるかな？`,
            steps: relSteps(R, (v) => (k === 3 ? `∠A＝${sg(v.A)}°、∠B＝${sg(v.B)}°、∠C＝${sg(v.C)}° で、0° 以下の角があるから、三角形はできない。` : `3つの内角は ${v.A}°、${v.B}°、${v.C}° で、${KIND_WHY[k]}。よって ${ans}。`)),
          };
        }),
        // 04q04 小テスト（4）辺 BC 上の点 D で分けたときの ∠DAC
        t("04q04", (r) => splitQ(r, "DAQ", { pLo: 30, pHi: 75, sLo: 15 })),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 04d05a 演習（5）内角の比から、三角形の種類（4択）
        t("04d05a", (r) => {
          const ord0 = (R) => shuffle(r, [R.p, R.q, R.s]);
          if (r(0, 1) === 0) {   // 比だけ → 種類
            const k = r(0, 2), R = pick(r, RATIOS.filter((x) => x.kind === k)), ans = TRI[k], ord = ord0(R);
            return {
              q: `三角形の 3つの内角の大きさの比が ${ord.join("：")} のとき、この三角形は、次のうちどれか。`,
              ans,
              choices: choices4(r, ans, [...TRI, NONE].filter((x) => x !== ans)),
              hint: "3つの内角の和は何度だったかな？ その和を、比の合計でわると、何がわかるかな？",
              steps: [...ratioSteps(R, ord), `${ord.map((v) => R.u * v).join("°、")}° は、${KIND_WHY[k]}。よって ${ans}。`],
            };
          }
          // 比と、いちばん小さい内角を決めてかく → できるとは限らない
          const R = pick(r, RATIOS), ord = ord0(R), ok = r(0, 4) >= 2;       // 3/5 はできる、2/5 はできない
          let u = R.u;
          if (!ok) { do { u = R.u + 5 * r(-3, 3); } while (u === R.u || u < 5 || u * R.p > 150); }
          const a = u * R.p, total = u * R.sum, k = R.kind, ans = ok ? TRI[k] : NONE;
          return {
            q: `三角形の 3つの内角の大きさの比を ${ord.join("：")} にして、いちばん小さい内角を ${a}° にしてかく。できる三角形は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, [...TRI, NONE].filter((x) => x !== ans)),
            hint: "いちばん小さい内角から、比の 1 にあたる大きさがわかるかな？ そのとき、3つの内角の和は何度になるかな？",
            steps: [
              R.p === 1 ? `いちばん小さい内角 ${a}° が、比の 1 にあたる。` : `いちばん小さい内角 ${a}° が、比の ${R.p} にあたるから、比の 1 にあたる大きさは　${a}°÷${R.p}＝${u}°`,
              `3つの内角の和は　${u}°×${R.sum}＝${total}°`,
              ok ? `180° になるので、三角形はできる。3つの内角は ${ord.map((v) => u * v).join("°、")}° で、${KIND_WHY[k]}。` : `180° にならない。三角形の内角の和は 180° だから、三角形はできない。`,
              ok ? `よって ${ans}。` : `よって、答えは「${NONE}」。`,
            ],
          };
        }),
        // 04d05b 演習（5）内角の比から、いちばん大きい内角
        t("04d05b", (r) => {
          const R = pick(r, RATIOS.filter((x) => x.kind !== 1)), big = R.a[2], ord = shuffle(r, [R.p, R.q, R.s]);   // 直角になる比は、答えがいつも 90° になるので使わない
          return {
            q: `三角形の 3つの内角の大きさの比が ${ord.join("：")} のとき、いちばん大きい内角は何度か。`,
            ans: big,
            unit: "度",
            hint: "3つの内角の和は何度だったかな？ 比の 1 にあたる大きさは、どう求められるかな？",
            steps: [...ratioSteps(R, ord), `いちばん大きい内角は ${big}°。`],
          };
        }),
        // 04d06a 演習（6）頂点の外角と、2つの内角の関係から、内角
        t("04d06a", (r) => {
          const f = frame(r), k = pick(r, [2, 3, 4]);
          let y;
          do { y = r(12, 55); } while ((k + 1) * y > 165 || 180 - (k + 1) * y === y || 180 - (k + 1) * y === k * y);
          const e = (k + 1) * y, X = k * y, [bigN, smN] = pick(r, [[f.U, f.W], [f.W, f.U]]), askBig = r(0, 1) === 1;
          const name = askBig ? bigN : smN, val = askBig ? X : y;
          return {
            q: `${f.text}${f.ext}＝${e}° で、∠${bigN} は ∠${smN} の ${k}倍である。∠${name} の大きさは？`,
            ans: val,
            unit: "度",
            hint: "外角の性質を使うと、外角と、となりあわない 2つの内角の間に、どんな関係が成り立つかな？",
            steps: [`${f.ext} は、${f.V} にとなりあわない 2つの内角の和に等しいから　∠${bigN}+∠${smN}＝${e}°`, `∠${bigN}＝${k}∠${smN} だから　${k}∠${smN}+∠${smN}＝${k + 1}∠${smN}＝${e}°`, `∠${smN}＝${y}°、∠${bigN}＝${k}×${y}°＝${X}° だから、∠${name} は ${val}°。`],
          };
        }),
        // 04d06b 演習（6）3つの内角のうち、いちばん大きいもの
        t("04d06b", (r) => {
          const f = frame(r), k = pick(r, [2, 3, 4]);
          let y;
          do { y = r(12, 55); } while ((k + 1) * y > 165 || 180 - (k + 1) * y === y || 180 - (k + 1) * y === k * y);
          const e = (k + 1) * y, X = k * y, V = 180 - e, [bigN, smN] = pick(r, [[f.U, f.W], [f.W, f.U]]), mx = Math.max(X, y, V);
          return {
            q: `${f.text}${f.ext}＝${e}° で、∠${bigN} は ∠${smN} の ${k}倍である。△ABC の 3つの内角のうち、いちばん大きいものは何度か。`,
            ans: mx,
            unit: "度",
            hint: "外角の性質と、内角の和 180° のどちらも、使えそうかな？ 3つの内角は、それぞれ何度になるかな？",
            steps: [`${f.ext}＝∠${bigN}+∠${smN}＝${e}° と、∠${bigN}＝${k}∠${smN} から　∠${smN}＝${y}°、∠${bigN}＝${X}°`, `∠${f.V}＝180°−${e}°＝${V}°（${f.ext} は ∠${f.V} の外角）`, `3つの内角は ${X}°、${y}°、${V}° だから、いちばん大きいのは ${mx}°。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 04d07 演習（7）∠B の二等分線と、∠C の外角の二等分線の交点 P → ∠BPC
        t("04d07", (r) => {
          const [X, Y, Z] = perm3(r), a = 2 * r(15, 65);
          return {
            q: `△ABC の辺 ${Y}${Z} を ${Z} の方へのばして、その先に点 D をとる。点 P は、∠${Y} の二等分線と、∠${X}${Z}D の二等分線の交点である。∠${X}＝${a}° のとき、∠${Y}P${Z} の大きさは？`,
            ans: a / 2,
            unit: "度",
            hint: "二等分線で等しくなる角に、同じしるし（●と○）をつけてみよう。外角の性質は、どの三角形で使えるかな？",
            steps: [
              `∠${X}${Y}P＝∠P${Y}${Z}＝●、∠${X}${Z}P＝∠P${Z}D＝○ とおく。`,
              `∠${X}${Z}D は △${X}${Y}${Z} の外角だから　2○＝${a}°+2●、よって　○＝${a / 2}°+●　…①`,
              `∠P${Z}D は △P${Y}${Z} の外角だから　○＝●+∠${Y}P${Z}　…②`,
              `①を②に入れて　${a / 2}°+●＝●+∠${Y}P${Z}　より　∠${Y}P${Z}＝${a / 2}°`,
            ],
          };
        }),
        // 04d08 演習（8）「60° 以上の内角がかならず1つある」などの理由（正しい説明を選ぶ4択）
        t("04d08", (r) => claimQ(r)),
        // 04q05a 小テスト（5）チャレンジ：∠B・∠C の二等分線の交点 I → ∠BIC
        t("04q05a", (r) => {
          const [X, Y, Z] = perm3(r), a = 2 * r(20, 60);
          const x = 90 + a / 2, half = (180 - a) / 2;
          return {
            q: `△ABC で、点 I は、∠${Y} の二等分線と ∠${Z} の二等分線の交点である。∠${X}＝${a}° のとき、∠${Y}I${Z} の大きさは？`,
            ans: x,
            unit: "度",
            hint: `二等分線で等しくなる角に、同じしるしをつけよう。△I${Y}${Z} の内角の和は、何度かな？`,
            steps: [`∠I${Y}${Z}＝●、∠I${Z}${Y}＝○ とすると、∠${Y}＝2●、∠${Z}＝2○`, `△ABC の内角の和から　2●+2○＝180°−${a}°＝${180 - a}°、よって　●+○＝${half}°`, `△I${Y}${Z} の内角の和から　∠${Y}I${Z}＝180°−(●+○)＝180°−${half}°＝${x}°`],
          };
        }),
        // 04q05b 小テスト（5）チャレンジ：∠BIC から ∠A
        t("04q05b", (r) => {
          const [X, Y, Z] = perm3(r), x = r(105, 150), a = 2 * (x - 90), half = 180 - x;
          return {
            q: `△ABC で、点 I は、∠${Y} の二等分線と ∠${Z} の二等分線の交点である。∠${Y}I${Z}＝${x}° のとき、∠${X} の大きさは？`,
            ans: a,
            unit: "度",
            hint: `二等分線で等しくなる角に、同じしるしをつけよう。△I${Y}${Z} の内角の和から、何がわかるかな？`,
            steps: [`∠I${Y}${Z}＝●、∠I${Z}${Y}＝○ とすると、△I${Y}${Z} の内角の和から　●+○＝180°−${x}°＝${half}°`, `∠${Y}+∠${Z}＝2●+2○＝2×${half}°＝${2 * half}°`, `∠${X}＝180°−(∠${Y}+∠${Z})＝180°−${2 * half}°＝${a}°`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題はない（図の問題は、点の名前と位置関係を文で言い切る形にした。dr.8 の説明は、正しい説明を選ぶ4択にした）
export const SKIPPED = [];
