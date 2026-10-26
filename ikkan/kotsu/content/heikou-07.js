// ============================================================
// heikou-07.js — 平行と合同 第7時「補助線をひいて、角度のなぞを解こう」
//   ikkan の演習プリント（heikou-07.dr.1〜7）・小テスト（heikou-07.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「07」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：07d01c ＝ heikou-07.dr.1 の ③（ブーメラン形）
//   図は出せないので、点の名前と位置関係（ℓ が上・m が下の横向き、A は ℓ 上、C は m 上、E は ℓ と m のあいだ、P は A より右、Q は C より右 など）と、
//   どの角を言っているか（∠PAE のように、3点の名前）を、問題文で言い切る。折れ線は「F は E より下にある」「いつも下に向かって進む」など、2通りに読めない言い方にした。
//   角度は整数の度。答えは、問題文の数字から計算して出す（錯角・内角の和・外角の性質・対頂角）。
//   「説明しよう」（dr.5 ②）は、正しい理由を選ぶ4択に直した（ときどき、折れ線の理由も聞く）。「補助線・同位角・錯角」（qz.4）は、用語を選ぶ4択と、「正しいもの／まちがっているもの」を選ぶ4択にした。
// ============================================================
import { t as t0, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** 4択の「当てやすさ」を下げる検査：選択肢の形だけ（長さ・ほかの選択肢との似かた・語の出かた）で、正解が「単独のいちばん」になる問題は作り直す */
const strip = (s) => String(s).replace(/\$/g, "");
const toks = (s) => strip(s).match(/[A-Za-z]|\d+|[぀-ヿ一-鿿]+|[∠△≡∥⊥＝]/g) || [];
const bigrams = (s) => { const x = strip(s).replace(/\s/g, ""), o = new Set(); for (let i = 0; i < x.length - 1; i++) o.add(x.slice(i, i + 2)); return o; };
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
function cueFree(choices, ans) {
  const n = choices.length, ai = choices.findIndex((c) => String(c) === String(ans));
  const B = choices.map(bigrams), sim = B.map((b, i) => B.reduce((a, o, j) => (i === j ? a : a + jac(b, o)), 0));
  const sc = [choices.map((c) => strip(c).length), sim];
  for (const tk of [toks, (s) => [...strip(s).replace(/[\s、。]/g, "")]]) {   // 語ごと・1字ごと
    const T = choices.map((c) => new Set(tk(c))), cnt = {};
    T.forEach((s) => s.forEach((w) => { cnt[w] = (cnt[w] || 0) + 1; }));
    sc.push(T.map((s) => [...s].filter((w) => cnt[w] === 1).length), T.map((s) => Object.keys(cnt).filter((w) => cnt[w] === n - 1 && !s.has(w)).length), T.map((s) => [...s].reduce((a, w) => a + cnt[w], 0)));
  }
  for (const v of sc) for (const sgn of [1, -1]) {
    const w = v.map((x) => sgn * x), m = Math.max(...w);
    if (w[ai] === m && w.filter((x) => x === m).length === 1) return false;
  }
  return true;
}
/** t(id, build) と同じ。ただし、(1) 数の答えが問題文の数とたまたま同じになる組は、作り直す（skip）、(2) 4択は、形だけで正解が当たる組を、作り直す */
const t = (id, build) => t0(id, (r) => {
  let p;
  for (let i = 0; i < 80; i++) {
    p = build(r);
    if (!p || p.skip || !p.choices || cueFree(p.choices, p.ans)) break;
  }
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});
/** 「正しい／まちがい」の言い方は、選択肢ごとにばらばらにえらぶ（言い方で正解がわからないように） */
const YES = ["等しい", "同じ", "一致する"], NO = ["等しくない", "異なる", "一致しない"];

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const LM = "ℓ∥m の 2直線を、ℓ が上、m が下の横向きにおく。";
const side2 = (r) => pick(r, ["右", "左"]);
const opp = (s) => (s === "右" ? "左" : "右");

/** 用語の4択（07q04a）：言葉の意味を読んで、言葉を選ぶ。聞く言葉は 5つのうちからえらび、ほかの選択肢は、ほかの用語から */
const TERMS = {
  "補助線": { mean: "角の大きさを求めやすくするために、あとからかき入れる線", ask: ["角の大きさを求めるために、あとからかき入れる線", "図形の角の大きさを求めやすくするために、あとからかき足す線"] },
  "同位角": { mean: "2直線に 1つの直線が交わるとき、2直線に対して同じ位置にある 2つの角", ask: ["2直線に 1つの直線が交わるとき、2直線に対して同じ位置にある 2つの角", "2直線に 1つの直線が交わってできる角のうち、位置が（上下も左右も）同じ向きに対応している 2つの角"] },
  "錯角": { mean: "2直線に 1つの直線が交わるとき、2直線のあいだで、たがいちがいの位置にある 2つの角", ask: ["2直線に 1つの直線が交わるとき、2直線のあいだにあって、交わる直線をはさんで反対がわにある 2つの角", "2直線に 1つの直線が交わってできる角のうち、内がわで、たがいちがいの位置にある 2つの角"] },
  "対頂角": { mean: "2直線が交わってできる 4つの角のうち、向かい合っている 2つの角", ask: ["2直線が交わってできる 4つの角のうち、向かい合っている 2つの角", "2直線が 1点で交わるとき、頂点を共有して、向かい合っている 2つの角"] },
  "外角": { mean: "三角形の 1つの辺をのばしたとき、のばした辺と、となりの辺とがつくる角", ask: ["三角形の 1つの辺をのばしたとき、のばした辺と、となりの辺とがつくる角", "三角形の 1つの頂点で、となりの辺をのばしてできる、三角形の外がわの角"] },
  "内角": { mean: "多角形の内がわにある角" },
  "対角線": { mean: "多角形の、となりあわない 2つの頂点を結ぶ線分" },
  "垂線": { mean: "直線に垂直に交わる直線" },
};
function termQ(r) {
  const ans = pick(r, ["補助線", "補助線", "同位角", "錯角", "対頂角", "外角"]);
  const ws = shuffle(r, Object.keys(TERMS).filter((k) => k !== ans)).slice(0, 3);
  return {
    q: `${pick(r, TERMS[ans].ask)}を、何というか。`,
    ans,
    choices: choices4(r, ans, ws),
    hint: "その言葉が出てきたときの図を、思い浮かべてみよう。それぞれの言葉は、どんな図形で使ったかな？",
    steps: [`「${TERMS[ans].mean}」を、${ans}という。`, `ほかの選択肢は、${ws.map((w) => `${w}（${TERMS[w].mean}）`).join("、")}のこと。`],
  };
}

/** 平行な 2直線と角についての文（07q04b）。g は話題のグループ（1つの問題では、同じグループの文は 1つだけ）、ok は文が正しいか */
const PAR = [
  { g: "d", ok: true, t: "ℓ∥m のとき、同位角は等しい。", why: "平行線の同位角は等しいから、正しい" },
  { g: "d", ok: false, t: "ℓ∥m のとき、同位角は等しくない。", why: "平行線の同位角は等しいから、まちがい" },
  { g: "d", ok: false, t: "ℓ∥m のとき、同位角を足すと、180° になる。", why: "同位角は、足して 180° になるのではなく、大きさが等しいから、まちがい" },
  { g: "d", ok: false, t: "ℓ∥m のとき、同位角は、いつも 90° になる。", why: "同位角は等しいが、90° とはかぎらない（どんな大きさのこともある）から、まちがい" },
  { g: "s", ok: true, t: "ℓ∥m のとき、錯角は等しい。", why: "平行線の錯角は等しいから、正しい" },
  { g: "s", ok: false, t: "ℓ∥m のとき、錯角は等しくない。", why: "平行線の錯角は等しいから、まちがい" },
  { g: "s", ok: false, t: "ℓ∥m のとき、錯角を足すと、180° になる。", why: "錯角は、足して 180° になるのではなく、大きさが等しいから、まちがい" },
  { g: "b", ok: true, t: "ℓ∥m のとき、同位角も錯角も等しい。", why: "平行線では、同位角も錯角も等しいから、正しい" },
  { g: "b", ok: false, t: "ℓ∥m のとき、同位角も錯角も等しくない。", why: "平行線では、同位角も錯角も等しいから、まちがい" },
  { g: "b", ok: false, t: "ℓ∥m のとき、同位角は等しいが、錯角は等しくない。", why: "錯角も等しいから、まちがい" },
  { g: "b", ok: false, t: "ℓ∥m のとき、錯角は等しいが、同位角は等しくない。", why: "同位角も等しいから、まちがい" },
  { g: "v", ok: true, t: "対頂角は、ℓ と m が平行でなくても、等しい。", why: "対頂角は、2直線が交わればいつも等しいから、正しい" },
  { g: "v", ok: true, t: "ℓ と m が平行でないときも、対頂角は等しい。", why: "対頂角は、2直線が交わればいつも等しいから、正しい" },
  { g: "v", ok: false, t: "対頂角は、ℓ∥m のときだけ等しい。", why: "対頂角は、平行でなくても、いつも等しいから、まちがい" },
  { g: "n", ok: false, t: "ℓ と m が平行でなくても、同位角は等しい。", why: "同位角が等しいのは、平行なときだけだから、まちがい" },
  { g: "n", ok: false, t: "ℓ と m が平行でなくても、錯角は等しい。", why: "錯角が等しいのは、平行なときだけだから、まちがい" },
  { g: "n", ok: true, t: "ℓ と m が平行でないとき、同位角は等しくならない。", why: "同位角が等しいのは、平行なときだけだから、正しい" },
  { g: "n", ok: true, t: "ℓ と m が平行でないとき、錯角は等しくならない。", why: "錯角が等しいのは、平行なときだけだから、正しい" },
  { g: "u", ok: true, t: "一直線上でとなりあう 2つの角を足すと、180° になる。", why: "一直線の角は 180° だから、正しい" },
  { g: "u", ok: true, t: "一直線をつくる、となりあう 2つの角の和は、いつも 180° である。", why: "一直線の角は 180° だから、正しい" },
  { g: "u", ok: false, t: "一直線上でとなりあう 2つの角は、いつも等しい。", why: "となりあう 2つの角は、足して 180° になるが、等しいとはかぎらないから、まちがい" },
  { g: "u", ok: false, t: "一直線上でとなりあう 2つの角を足すと、360° になる。", why: "一直線の角は 180° だから、まちがい" },
];
function parQ(r) {
  const askOk = r(0, 1) === 0;
  const A = pick(r, PAR.filter((x) => x.ok === askOk));
  const used = new Set([A.g]), others = [];
  // 長さが A とあまりちがわない文を、えらびやすくする（長さで正解がわかってしまわないように）
  const near = (x) => Math.abs(x.t.length - A.t.length) + r(0, 5);
  for (const x of PAR.filter((y) => y.ok !== askOk).map((y) => [near(y), y]).sort((p, q) => p[0] - q[0]).map((y) => y[1])) if (!used.has(x.g)) { used.add(x.g); others.push(x); if (others.length === 3) break; }
  return {
    q: `${pick(r, ["2直線 ℓ、m に、直線 n が交わっている。", "2直線 ℓ、m に、1つの直線 n が交わっている。"])}角について、${askOk ? pick(r, ["正しいものはどれか。", "正しい文はどれか。"]) : pick(r, ["まちがっているものはどれか。", "正しくないものはどれか。"])}`,
    ans: A.t,
    choices: choices4(r, A.t, others.map((x) => x.t)),
    hint: "平行な 2直線に 1つの直線が交わるとき、同位角や錯角の大きさについて、どんなことがいえたかな？ 平行でないときは、どうだったかな？",
    steps: [
      "ℓ∥m のときは、同位角も錯角も等しい。平行でないときは、同位角も錯角も等しくならない。対頂角は、平行でなくても、いつも等しい。一直線をつくる、となりあう 2つの角の和は 180° である。",
      `${askOk ? "正しい" : "まちがっている"}のは「${A.t}」（${A.why}）。`,
      `ほかの選択肢は、${others.map((x) => `「${x.t}」（${x.why}）`).join("、")}。`,
    ],
  };
}

/** 折れ線 A−E−C（折れ目 E は ℓ と m のあいだ。A、C は E の同じがわ）。∠PAE＝a、∠QCE＝c、∠AEC＝a＋c（錯角） */
function zigOne(r, mode, lo = 20, hi = 65) {
  const sd = side2(r);
  let a, c;
  do { a = r(lo, hi); c = r(lo, hi); } while (a === c || 2 * a + c > 170 || a + 2 * c > 170);
  const e = a + c;
  const head = `${LM}ℓ 上に点 A と、A より${sd}の点 P、m 上に点 C と、C より${sd}の点 Q をとり、ℓ と m のあいだに点 E をとる。`;
  const par = "E を通り、ℓ に平行な直線をひく。";
  const hint = "平行線の性質は、どんなときに使えるのだったかな？ 等しい角が見つかるように、どんな線をひいたらいいかな？";
  if (mode === "sum") {
    return {
      q: `${head}∠PAE＝${a}°、∠QCE＝${c}° のとき、∠AEC の大きさは？`,
      ans: e, unit: "度", hint,
      steps: [par, `平行線の錯角は等しいから、∠AEC は、∠PAE の錯角（${a}°）と、∠QCE の錯角（${c}°）に分けられる。`, `∠AEC＝${a}°+${c}°＝${e}°`],
    };
  }
  if (mode === "findC") {
    return {
      q: `${head}∠PAE＝${a}°、∠AEC＝${e}° のとき、∠QCE の大きさは？`,
      ans: c, unit: "度", hint,
      steps: [par, `∠AEC は、∠PAE の錯角（${a}°）と、∠QCE の錯角に分けられるから　${e}°＝${a}°+∠QCE`, `∠QCE＝${e}°−${a}°＝${c}°`],
    };
  }
  return {
    q: `${head}∠QCE＝${c}°、∠AEC＝${e}° のとき、∠PAE の大きさは？`,
    ans: a, unit: "度", hint,
    steps: [par, `∠AEC は、∠PAE の錯角と、∠QCE の錯角（${c}°）に分けられるから　${e}°＝∠PAE+${c}°`, `∠PAE＝${e}°−${c}°＝${a}°`],
  };
}

/** ブーメラン形：△ABC の内部に点 D。∠BDC＝∠BAC＋∠ABD＋∠ACD（BD をのばして AC と交わらせ、外角の性質を 2回） */
function dart(r, mode, lo = 25, hi = 70) {
  let A, b, c;
  do { A = r(lo, hi); b = r(lo - 5, hi - 10); c = r(lo - 5, hi - 10); } while (A === b || A === c || b === c || A + b + c > 170);
  const d = A + b + c;
  const head = "△ABC の内部に点 D がある。";
  const hint = "三角形の外角は、どの角の和に等しいのだったかな？ その性質が使えるように、どんな線をひいたらいいかな？";
  const ext = "BD をのばして、AC と交わる点を E とする。";
  if (mode === "BDC") {
    return {
      q: `${head}∠BAC＝${A}°、∠ABD＝${b}°、∠ACD＝${c}° のとき、∠BDC の大きさは？`,
      ans: d, unit: "度", hint,
      steps: [ext, `∠DEC は △ABE の外角だから　∠DEC＝∠BAC+∠ABD＝${A}°+${b}°＝${A + b}°`, `∠BDC は △DEC の外角だから　∠BDC＝∠DEC+∠ACD＝${A + b}°+${c}°＝${d}°`],
    };
  }
  if (mode === "ACD") {
    return {
      q: `${head}∠BAC＝${A}°、∠ABD＝${b}°、∠BDC＝${d}° のとき、∠ACD の大きさは？`,
      ans: c, unit: "度", hint,
      steps: [ext, `∠DEC は △ABE の外角だから　∠DEC＝∠BAC+∠ABD＝${A}°+${b}°＝${A + b}°`, `∠BDC は △DEC の外角だから　${d}°＝${A + b}°+∠ACD`, `∠ACD＝${d}°−${A + b}°＝${c}°`],
    };
  }
  return {
    q: `${head}∠BAC＝${A}°、∠ACD＝${c}°、∠BDC＝${d}° のとき、∠ABD の大きさは？`,
    ans: b, unit: "度", hint,
    steps: [ext, `∠BDC は △DEC の外角だから　${d}°＝∠DEC+∠ACD＝∠DEC+${c}°、よって　∠DEC＝${d}°−${c}°＝${d - c}°`, `∠DEC は △ABE の外角だから　${d - c}°＝∠BAC+∠ABD＝${A}°+∠ABD`, `∠ABD＝${d - c}°−${A}°＝${b}°`],
  };
}

/** コの字の折れ線 A−E−F−C（E、F は ℓ と m のあいだ。F は E より下）。∠PAE＝a、∠AEF＝e、∠QCF＝c のとき、∠EFC＝a＋c＋180°−e */
function kou(r) {
  const sd = side2(r);
  let a, c, e;
  for (;;) {
    a = r(20, 55); c = r(20, 55);
    const lo = a + c + 30, hi = Math.min(a + c + 150, 172 - a);
    if (lo > hi) continue;
    e = r(lo, hi);
    break;
  }
  const d1 = e - a, f = c + 180 - d1;
  return {
    q: `${LM}ℓ 上に点 A と、A より${sd}の点 P、m 上に点 C と、C より${sd}の点 Q をとる。ℓ と m のあいだに点 E、F をとり、A、E、F、C の順に線分で結んで、折れ線をつくる。F は E より下にある。∠PAE＝${a}°、∠AEF＝${e}°、∠QCF＝${c}° のとき、∠EFC の大きさは？`,
    ans: f, unit: "度",
    hint: "平行線の性質は、どんなときに使えるのだったかな？ 等しい角が見つかるように、どんな線をひいたらいいかな？ 折れ目ごとに、角をわけて考えてみよう。",
    steps: [
      "E、F を通り、ℓ に平行な直線をひく。",
      `E では　∠AEF のうち ${a}° は ∠PAE の錯角だから、E を通る平行線と EF のつくる角は　${e}°−${a}°＝${d1}°`,
      `F では　E を通る平行線と F を通る平行線は平行で、EF が交わっているから、F を通る平行線と FE のつくる角は　180°−${d1}°＝${180 - d1}°（同じがわの 2つの角の和は 180°）`,
      `∠QCF の錯角が ${c}° だから　∠EFC＝${180 - d1}°+${c}°＝${f}°`,
    ],
  };
}

/** N字の折れ線 A−E−F−C（F は E より下）。∠PAE＝a、∠AEF＝e、∠RCF＝c（R は C と反対がわ）のとき、∠EFC＝e−a＋c */
function zigTwo(r) {
  const sd = side2(r);
  let a, c, e;
  for (;;) {
    a = r(20, 55); c = r(15, 55);
    const lo = a + 15, hi = Math.min(172 - a, a + 100);
    if (lo > hi) continue;
    e = r(lo, hi);
    if (e - a + c <= 160 && e - a + c >= 40) break;
  }
  const d1 = e - a, x = d1 + c;
  return {
    q: `${LM}ℓ 上に点 A と、A より${sd}の点 P、m 上に点 C と、C より${opp(sd)}の点 R をとる。ℓ と m のあいだに点 E、F をとり、A、E、F、C の順に線分で結んで、折れ線をつくる。F は E より下にある。∠PAE＝${a}°、∠AEF＝${e}°、∠RCF＝${c}° のとき、∠EFC の大きさは？`,
    ans: x, unit: "度",
    hint: "平行線の性質は、どんなときに使えるのだったかな？ 等しい角が見つかるように、どんな線をひいたらいいかな？ 折れ目ごとに、角をわけて考えてみよう。",
    steps: [
      "E、F を通り、ℓ に平行な直線をひく。",
      `E では　∠AEF のうち ${a}° は ∠PAE の錯角だから、E を通る平行線と EF のつくる角は　${e}°−${a}°＝${d1}°`,
      `F では　∠EFC が、F を通る平行線で 2つに分けられる。1つは、E でできた ${d1}° の角の錯角で ${d1}°、もう 1つは、∠RCF の錯角で ${c}°`,
      `∠EFC＝${d1}°+${c}°＝${x}°`,
    ],
  };
}

/** 正三角形 ABC の頂点 B が ℓ 上、C が m 上、A は ℓ と m のあいだ。∠PBA＝a のとき、∠QCA＝60°−a */
function eqTri(r) {
  const sd = side2(r), a = r(10, 50), y = 60 - a;
  const askQ = r(0, 1) === 0;
  const head = `${LM}正三角形 ABC の頂点 B は ℓ 上、頂点 C は m 上にあり、頂点 A は ℓ と m のあいだにある。ℓ 上に B より${sd}の点 P、m 上に C より${sd}の点 Q をとる。`;
  const hint = "正三角形の 1つの内角は何度だったかな？ 等しい角が見つかるように、どんな線をひいたらいいかな？";
  const [g, k, gn, kn] = askQ ? [a, y, "PBA", "QCA"] : [y, a, "QCA", "PBA"];
  return {
    q: `${head}∠${gn}＝${g}° のとき、∠${kn} の大きさは？`,
    ans: k, unit: "度", hint,
    steps: [
      "A を通り、ℓ に平行な直線をひく。",
      "平行線の錯角は等しいから、∠BAC は、∠PBA の錯角と、∠QCA の錯角に分けられる。",
      `正三角形の 1つの内角は 60° だから　∠BAC＝60°。${g}°+∠${kn}＝60°`,
      `∠${kn}＝60°−${g}°＝${k}°`,
    ],
  };
}

/** 3回折れる折れ線 A−E−F−G−C（いつも下向きに進む）。a＋f＋c＝e＋g、f＝(e−a)＋(g−c) */
function zigThree(r) {
  let a, c, e, g;
  for (;;) {
    a = r(20, 55); c = r(20, 55);
    const dE = r(15, 60), dG = r(15, 60);
    e = a + dE; g = c + dG;
    if (e + a <= 172 && g + c <= 172 && dE + dG >= 40 && dE + dG <= 150 && e !== g && a !== c) break;
  }
  const f = e + g - a - c;
  return {
    q: `${LM}ℓ 上に点 A と、A より右の点 P、m 上に点 C と、C より右の点 Q をとる。ℓ と m のあいだに点 E、F、G をとり、A、E、F、G、C の順に線分で結んで、折れ線をつくる。この折れ線は、A から C まで、いつも下に向かって進む（途中で上にもどらない）。∠PAE＝${a}°、∠AEF＝${e}°、∠FGC＝${g}°、∠QCG＝${c}° のとき、∠EFG の大きさは？`,
    ans: f, unit: "度",
    hint: "平行線の性質は、どんなときに使えるのだったかな？ 等しい角が見つかるように、どんな線をひいたらいいかな？ 折れ目ごとに、角をわけて考えてみよう。",
    steps: [
      "E、F、G を通り、ℓ に平行な直線をひく。",
      "錯角は等しいから、右にひらいている角 ∠PAE、∠EFG、∠QCG の和と、左にひらいている角 ∠AEF、∠FGC の和は等しい。",
      `${a}°+∠EFG+${c}°＝${e}°+${g}°`,
      `∠EFG＝${e}°+${g}°−${a}°−${c}°＝${f}°`,
    ],
  };
}

/** リボン形：線分 AD と BC が点 O で交わる。∠BAD＋∠ABC＝∠BCD＋∠ADC */
function ribbonNums(r) {
  for (;;) {
    const A = r(30, 85), B = r(25, 80), C = r(20, 70), D = A + B - C;
    if (A + B <= 160 && A + B !== 90 && D >= 20 && D <= 110 && new Set([A, B, C, D]).size === 4) return { A, B, C, D };
  }
}
const RIB_HEAD = "線分 AD と線分 BC が点 O で交わっている（O は AD の間にも、BC の間にもある）。A と B、C と D を、それぞれ線分で結ぶ。";
const RIB_NAME = { A: "∠BAD", B: "∠ABC", C: "∠BCD", D: "∠ADC" };
function ribbon(r) {
  const v = ribbonNums(r), ask = pick(r, ["D", "D", "A", "B", "C"]);
  const given = ["A", "B", "C", "D"].filter((k) => k !== ask);
  const top = ask === "A" || ask === "B";   // 求める角が △AOB にあるとき、△COD の 2つの角から ∠COD をつくる
  const [p, q2] = top ? ["C", "D"] : ["A", "B"], other = ["A", "B"].includes(ask) ? ["A", "B"].find((k) => k !== ask) : ["C", "D"].find((k) => k !== ask);
  const o = 180 - v[p] - v[q2];
  const triP = top ? "△COD" : "△AOB", triQ = top ? "△AOB" : "△COD", angP = top ? "∠COD" : "∠AOB", angQ = top ? "∠AOB" : "∠COD";
  return {
    q: `${RIB_HEAD}${given.map((k) => `${RIB_NAME[k]}＝${v[k]}°`).join("、")} のとき、${RIB_NAME[ask]} の大きさは？`,
    ans: v[ask], unit: "度",
    hint: "2本の線分が交わるところに、どんな 2つの三角形ができるかな？ 向かい合う角どうしは、どんな関係だったかな？",
    steps: [
      `${triP} の内角の和から　${angP}＝180°−${v[p]}°−${v[q2]}°＝${o}°`,
      `${angQ} は ${angP} の対頂角だから　${angQ}＝${o}°`,
      `${triQ} の内角の和から　${RIB_NAME[ask]}＝180°−${o}°−${v[other]}°＝${v[ask]}°`,
    ],
  };
}

/** 「わけ」を選ぶ4択の共通部分：文の 2か所に、正しい言葉かまちがった言葉が入る（4つの選択肢は、同じ文の形）。A、B は候補の言葉で、先頭が正しい言葉 */
function wrongCells(r, A, B) {
  const w = [];
  for (const a of A) for (const b of B) if (a !== A[0] || b !== B[0]) w.push([a, b]);
  return shuffle(r, w).slice(0, 3);
}

/** リボン形で ∠BAD＋∠ABC＝∠BCD＋∠ADC になる理由を選ぶ4択。どの選択肢も「内角の和は ○° で、∠AOB と ∠COD は ○ で等しいから」の形（○ に、正しい言葉か、まちがった言葉が入る）。文の形は 3通り */
function ribbonWhy(r) {
  const v = ribbonNums(r), o = 180 - v.A - v.B;
  const cell = pick(r, [
    (s, k) => `△AOB と △COD の内角の和は、どちらも ${s}° で、∠AOB と ∠COD は${k}で等しいから。`,
    (s, k) => `三角形の内角の和は ${s}° で、∠AOB と ∠COD は${k}だから等しく、残りの 2つの角の和も等しくなるから。`,
    (s, k) => `${k}の ∠AOB と ∠COD は等しく、△AOB と △COD の内角の和は ${s}° だから、残りの 2つの角の和も等しくなるから。`,
  ]);
  const ans = cell(180, "対頂角");
  const shown = wrongCells(r, [180, 360], ["対頂角", "同位角", "錯角"]);
  const notes = [...new Set(shown.flatMap((c) => [c[0] === 360 ? "三角形の内角の和は 180° で、360° ではない" : "", c[1] !== "対頂角" ? `${c[1]}は平行線があるときの言葉で、ここでは ∠AOB と ∠COD は対頂角` : ""]).filter(Boolean))];
  return {
    q: `${RIB_HEAD}∠BAD＝${v.A}°、∠ABC＝${v.B}°、∠BCD＝${v.C}°、∠ADC＝${v.D}° のとき、∠BAD+∠ABC＝∠BCD+∠ADC が成り立つ。そのわけとして、正しいものはどれか。`,
    ans,
    choices: choices4(r, ans, shown.map((c) => cell(c[0], c[1]))),
    hint: "2本の線分が交わるところに、どんな 2つの三角形ができるかな？ その 2つの三角形で、等しいといえる角はどこかな？",
    steps: [
      `△AOB の内角の和から　∠AOB＝180°−(∠BAD+∠ABC)＝180°−(${v.A}°+${v.B}°)＝${o}°`,
      `△COD の内角の和から　∠COD＝180°−(∠BCD+∠ADC)＝180°−(${v.C}°+${v.D}°)＝${180 - v.C - v.D}°`,
      "∠AOB と ∠COD は対頂角で等しいから、180° からひく 2つの角の和も等しい。正しいわけは「" + ans + "」",
      `ほかの選択肢が誤りなのは、${notes.join("；")}から。`,
    ],
  };
}

/** 折れ線 A−E−C で ∠AEC＝∠PAE＋∠QCE になる理由を選ぶ4択（文の中の 2か所に、錯角か、ほかの言葉が入る。文の形は 2通り） */
function zigWhy(r) {
  const sd = side2(r);
  let a, c;
  do { a = r(20, 65); c = r(20, 65); } while (a === c || 2 * a + c > 170 || a + 2 * c > 170);
  const e = a + c;
  const cell = pick(r, [
    (x, y) => `E を通り ${x}をひくと、∠PAE と ∠QCE の${y}が、∠AEC を 2つに分けるから。`,
    (x, y) => `${x}を E を通るようにひくと、∠PAE の${y}と ∠QCE の${y}が、あわせて ∠AEC になるから。`,
  ]);
  const ans = cell("ℓ に平行な直線", "錯角");
  const shown = wrongCells(r, ["ℓ に平行な直線", "ℓ に垂直な直線"], ["錯角", "同位角", "対頂角"]);
  return {
    q: `${LM}ℓ 上に点 A と、A より${sd}の点 P、m 上に点 C と、C より${sd}の点 Q をとり、ℓ と m のあいだに点 E をとる。A と E、E と C を線分で結ぶ。∠PAE＝${a}°、∠QCE＝${c}° のとき、∠AEC＝${e}° となる。そのわけとして、正しいものはどれか。`,
    ans,
    choices: choices4(r, ans, shown.map((c) => cell(c[0], c[1]))),
    hint: "∠PAE と ∠QCE を、∠AEC の中にうつして考えるには、どんな線が役に立ったかな？ そのとき等しくなる角は、何という角かな？",
    steps: [
      "E を通り、ℓ に平行な直線をひく。",
      `平行線の錯角は等しいから、∠AEC は、∠PAE の錯角（${a}°）と、∠QCE の錯角（${c}°）に分けられる。`,
      `∠AEC＝${a}°+${c}°＝${e}°。正しいわけは「${ans}」`,
      "同位角や対頂角は、E を通る平行線では、∠AEC の中にできない。だから、ほかの選択肢は誤り。",
    ],
  };
}

/** 正n角形（時計まわりに A、B、C…）。A が ℓ 上、C が m 上。∠QCB＝c のとき、∠PAX（X は A の前の頂点）＝c＋2×外角−180° */
function regPoly(r) {
  const n = pick(r, [5, 5, 6]), I = 180 - 360 / n, E = 360 / n;
  const [lo, hi] = n === 5 ? [40, 70] : [66, 105];
  const c = r(lo, hi), a = I - c, x = c - (2 * I - 180);
  const nm = n === 5 ? "ABCDE" : "ABCDEF", last = nm[n - 1], kj = n === 5 ? "五" : "六";
  return {
    q: `${LM}正${kj}角形 ${nm} は、頂点が ${[...nm].join("、")} の順に時計まわりにならんでいて、頂点 A は ℓ 上、頂点 C は m 上にある。ℓ 上に A より左の点 P、m 上に C より右の点 Q をとる。∠QCB＝${c}° のとき、∠PA${last} の大きさは？`,
    ans: x, unit: "度",
    hint: "正多角形の 1つの内角は何度だったかな？ 等しい角が見つかるように、どんな線をひいたらいいかな？",
    steps: [
      `正${kj}角形の 1つの内角は　180°×(${n}−2)÷${n}＝${I}°`,
      `B を通り、ℓ に平行な直線をひく。ℓ と AB がつくる角（A の右がわ）を ∠a とすると、錯角が等しいから　∠ABC＝∠a+${c}°。${I}°＝∠a+${c}° より　∠a＝${I}°−${c}°＝${a}°`,
      `点 A で、ℓ 上の 180° を ∠PA${last}、∠${last}AB（＝${I}°）、∠a に分けると　∠PA${last}＝180°−${I}°−${a}°＝${x}°`,
    ],
  };
}

/** 星形：凸五角形 ABCDE の 5本の対角線。5つの先の角の和は 180° */
const TIP = { A: "∠CAD", B: "∠DBE", C: "∠ECA", D: "∠ADB", E: "∠BEC" };
function star(r) {
  let tips;
  for (;;) {
    const four = [r(22, 52), r(22, 52), r(22, 52), r(22, 52)], fifth = 180 - four.reduce((s, x) => s + x, 0);
    if (fifth >= 22 && fifth <= 55) { tips = shuffle(r, [...four, fifth]); break; }
  }
  const names = ["A", "B", "C", "D", "E"], ask = pick(r, names), x = tips[names.indexOf(ask)];
  const given = names.filter((k) => k !== ask), sum = 180 - x;
  return {
    q: `凸五角形 ABCDE の 5本の対角線をひくと、星形ができる。星形の 5つの先の角は、∠CAD、∠DBE、∠ECA、∠ADB、∠BEC である。${given.map((k) => `${TIP[k]}＝${tips[names.indexOf(k)]}°`).join("、")} のとき、${TIP[ask]} の大きさは？`,
    ans: x, unit: "度",
    hint: "星形の 5つの先の角は、外角の性質を使うと、1つの三角形の内角に集められないかな？ 5つの先の角の和は、何度になるのかな？",
    steps: [
      "星形の 5つの先の角の和は、外角の性質を使うと 1つの三角形の内角の和に集められるので、いつも 180° になる。",
      `${given.map((k) => `${tips[names.indexOf(k)]}°`).join("+")}＝${sum}°`,
      `${TIP[ask]}＝180°−${sum}°＝${x}°`,
    ],
  };
}

export const UNITS = [
  unit("07", {
    name: "補助線をひいて、角の大きさを求める",
    desc: "平行線の間の折れ線・ブーメラン形・リボン形・正多角形・星形の角を、補助線と角の性質で求める",
    prereqs: ["J2-hk06"],
    points: [
      "角の大きさを求めるために、あとからかき入れる線を補助線という。平行線の性質（同位角・錯角は等しい）、三角形の内角の和（180°）、外角の性質（外角は、となりあわない 2つの内角の和に等しい）が使える形になるように、補助線をひく。",
      "平行な 2直線の間にある折れ線は、折れ目を通って、その平行線に平行な直線をひくと、錯角が等しいことが使える。折れ線が何回折れていても、右にひらいている角の和と、左にひらいている角の和は等しい。",
      "ブーメラン形（へこんだ四角形）は、へこんだ頂点から辺をのばして三角形をつくり、外角の性質を 2回使う。へこんだ頂点の角は、ほかの 3つの角の和に等しい。",
      "2本の線分が交わるリボン形は、対頂角が等しいことと、三角形の内角の和を使う。星形の 5つの先の角の和は 180° になる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 07d01a 演習（1）① 折れ線（A−E−C）の ∠AEC
        t("07d01a", (r) => zigOne(r, "sum")),
        // 07d01b 演習（1）② 折れ目の角と片方の角から、もう片方の角
        t("07d01b", (r) => zigOne(r, pick(r, ["findC", "findA"]), 25, 60)),
        // 07d01c 演習（1）③ ブーメラン形
        t("07d01c", (r) => dart(r, pick(r, ["BDC", "BDC", "ACD", "ABD"]))),
        // 07q01 小テスト（1）折れ線の ∠AEC
        t("07q01", (r) => zigOne(r, "sum", 20, 60)),
        // 07q03 小テスト（3）折れ目の角と片方の角から、もう片方の角
        t("07q03", (r) => zigOne(r, pick(r, ["findA", "findC"]), 20, 60)),
        // 07q04a 小テスト（4）用語（補助線・同位角・錯角・対頂角・外角）の意味を読んで、言葉を選ぶ4択
        t("07q04a", (r) => termQ(r)),
        // 07q04b 小テスト（4）平行な 2直線に 1つの直線が交わるとき、角について「正しいもの」「まちがっているもの」を選ぶ4択
        t0("07q04b", (r) => parQ(r)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 07d02 演習（2）コの字の折れ線
        t("07d02", (r) => kou(r)),
        // 07d03 演習（3）正三角形をはさんだ平行線
        t("07d03", (r) => eqTri(r)),
        // 07q02 小テスト（2）ブーメラン形
        t("07q02", (r) => dart(r, pick(r, ["BDC", "BDC", "ACD", "ABD"]), 30, 75)),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 07d04 演習（4）3回折れる折れ線
        t("07d04", (r) => zigThree(r)),
        // 07d05a 演習（5）① リボン形の角
        t("07d05a", (r) => ribbon(r)),
        // 07d05b 演習（5）② ∠A+∠B＝∠C+∠D になるわけ（正しいわけを選ぶ4択）。ときどき、折れ線 A−E−C で ∠AEC＝∠PAE+∠QCE になるわけも聞く
        t("07d05b", (r) => (r(0, 2) === 0 ? zigWhy(r) : ribbonWhy(r))),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 07d06 演習（6）平行線ではさまれた正五角形（正六角形）
        t("07d06", (r) => regPoly(r)),
        // 07d07 演習（7）星形の先の角
        t("07d07", (r) => star(r)),
        // 07q05 小テスト（5）チャレンジ：N字の折れ線
        t("07q05", (r) => zigTwo(r)),
      ],
    },
  }),
];

export const SKIPPED = [];   // 第7時は、演習プリント 7問・小テスト 5問のすべてを移した（図は点の名前と位置関係を文で言い切った。dr.5 ② の説明は、正しいわけを選ぶ4択にした）
export const _dbg = { zigWhy, ribbonWhy, cueFree, parQ, termQ };
