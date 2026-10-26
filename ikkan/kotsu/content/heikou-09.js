// ============================================================
// heikou-09.js — 平行と合同 第9時「三角形は、何がわかれば1つに決まるだろう」
//   ikkan の演習プリント（heikou-09.dr.1〜8）・小テスト（heikou-09.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「09」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：09d07b ＝ heikou-09.dr.7 の「合同とはかぎらない条件」を選ぶ4択
//   図は出せないので、2つの三角形 △ABC と △DEF の「等しい辺・等しい角」を、「AB＝DE、BC＝EF、∠B＝∠E」のように文で言い切る。
//   どの条件が合同条件か（3組の辺／2組の辺とその間の角／1組の辺とその両端の角）は、条件のならべ方（角が、等しい辺の間にあるか、両はしにあるか）から、classify() が計算で決める。
//   「2組の辺と、その間にない角」「1組の辺と1組の角」「2辺だけ」は、かならず合同とはいえない（反例がある）。「1組の辺と、両端でない 2つの角」は、内角の和から残りの角が等しくなるので、合同といえる。
//   3組の角が等しい場合は、授業計画で「この時間では扱わない」ので、問題・選択肢・要点に出さない。
//   dr.4（作図して辺の長さを測る）は、作図・測定ができないので SKIPPED。dr.8（コンパスで通り数を調べる）は、「何通りかけるか」を数で答える問題にした（C から半直線までの距離を言って、円との交わり方で決まるものだけ）。
//   「3通り答えよう」「すべて選ぼう」「条件を書こう」は、組を選ぶ4択・いくつあるかの数・1つ選ぶ4択にした。
//   4択は、選択肢の形（長さ・ほかの選択肢との似かた・語の出かた）だけで正解が当たらないように、t() が作り直す。
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
  const T = choices.map((c) => new Set(toks(c))), B = choices.map(bigrams), cnt = {};
  T.forEach((s) => s.forEach((w) => { cnt[w] = (cnt[w] || 0) + 1; }));
  const sim = B.map((b, i) => B.reduce((a, o, j) => (i === j ? a : a + jac(b, o)), 0));
  const sc = [
    choices.map((c) => strip(c).length), sim,
    T.map((s) => [...s].filter((w) => cnt[w] === 1).length),
    T.map((s) => Object.keys(cnt).filter((w) => cnt[w] === n - 1 && !s.has(w)).length),
    T.map((s) => [...s].reduce((a, w) => a + cnt[w], 0)),
  ];
  for (const v of sc) for (const sgn of [1, -1]) {
    const w = v.map((x) => sgn * x), m = Math.max(...w);
    if (w[ai] === m && w.filter((x) => x === m).length === 1) return false;
  }
  return true;
}
const sameNum = (p) => p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans);
/** t(id, build) と同じ。ただし、(1) 数の答えが問題文の数とたまたま同じになる組は、作り直す（skip）、(2) 4択は、形だけで正解が当たる組を、作り直す */
const t = (id, build) => t0(id, (r) => {
  let p;
  for (let i = 0; i < 80; i++) {
    p = build(r);
    if (!p || p.skip || !p.choices || cueFree(p.choices, p.ans)) break;
  }
  return sameNum(p) ? { skip: true } : p;
});
/** 選択肢が、いつも同じ 4つの言葉（合同条件の名前）の 4択：言葉の長さで答えが決まらないよう、(2) の作り直しはしない */
const tn = (id, build) => t0(id, (r) => { const p = build(r); return sameNum(p) ? { skip: true } : p; });
/** 数の答えが、問題文の数と同じでもよい（「何通りか」「いくつか」の小さな数） */
const tc = t0;

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const SETS = [["ABC", "DEF"], ["ABC", "DEF"], ["ABC", "DEF"], ["PQR", "STU"], ["KLM", "XYZ"]];
/** 2つの三角形の頂点の名前（X＝1つめ、Y＝2つめ。X[i] と Y[i] が対応） */
const names = (r) => { const [a, b] = pick(r, SETS); return { X: [...a], Y: [...b], t1: a, t2: b }; };
const sideNm = (N, i, j) => `${N.X[Math.min(i, j)]}${N.X[Math.max(i, j)]}`;   // 辺の名前（アルファベット順）
const keyS = (i, j) => `S${Math.min(i, j)}${Math.max(i, j)}`, keyA = (i) => `A${i}`;
/** 等しい辺・等しい角の 1つ（問題文では「AB＝DE」「∠B＝∠E」のように書く） */
const sideI = (r, N, i, j) => { const [p, q] = r(0, 1) ? [i, j] : [j, i]; return { key: keyS(i, j), txt: `${N.X[p]}${N.X[q]}＝${N.Y[p]}${N.Y[q]}` }; };
const angI = (N, i) => ({ key: keyA(i), txt: `∠${N.X[i]}＝∠${N.Y[i]}` });
const LBL = {
  SSS: "3組の辺がそれぞれ等しい",
  SAS: "2組の辺とその間の角がそれぞれ等しい",
  ASA: "1組の辺とその両端の角がそれぞれ等しい",
  NONE: "どの合同条件にもあてはまらない",
};
/** 等しい辺・等しい角の組（items）が、合同といえるかを、辺・角の位置から決める。
 *  SSS／SAS（c＝2辺が出会う頂点）／ASA（u・w＝辺の両はし）／AAS（1辺と、片はしの角と、むかいの角：内角の和で ASA になる）／SSA（2辺と、その間にない角：a＝角の頂点、b＝2辺が出会う頂点）／TWO（2辺だけ）／SA（1辺と1角だけ） */
function classify(N, items) {
  const S = items.filter((x) => x.key[0] === "S").map((x) => [+x.key[1], +x.key[2]]), A = items.filter((x) => x.key[0] === "A").map((x) => +x.key[1]);
  const txt = items.map((x) => x.txt).join("、");
  if (S.length === 3) return { type: "SSS", ok: true, txt };
  if (S.length === 2) {
    const sh = S[0].find((v) => S[1].includes(v)), p = S[0].find((v) => v !== sh), q = S[1].find((v) => v !== sh);
    if (A.includes(sh)) return { type: "SAS", ok: true, txt, c: sh, u: p, w: q };
    if (A.length === 1) return { type: "SSA", ok: false, txt, a: A[0], b: sh, c: A[0] === p ? q : p };
    return { type: "TWO", ok: false, txt, a: p, b: sh, c: q };
  }
  if (S.length === 1) {
    const [i, j] = S[0], o = 3 - i - j;
    if (A.includes(i) && A.includes(j)) return { type: "ASA", ok: true, txt, u: i, w: j, o };
    if (A.length >= 2) { const u = A.includes(i) ? i : j; return { type: "AAS", ok: true, txt, u, w: u === i ? j : i, o }; }
    return { type: "SA", ok: false, txt };
  }
  return { type: "NONE0", ok: false, txt };
}
/** 条件のつくり方（type は classify の type と同じ）。items の順は、ばらばらにする */
function cond(r, N, type) {
  const v = shuffle(r, [0, 1, 2]);
  let items;
  if (type === "SSS") items = [sideI(r, N, 0, 1), sideI(r, N, 1, 2), sideI(r, N, 0, 2)];
  else if (type === "SAS") { const [c, u, w] = v; items = [sideI(r, N, c, u), sideI(r, N, c, w), angI(N, c)]; }
  else if (type === "ASA") { const [, u, w] = v; items = [sideI(r, N, u, w), angI(N, u), angI(N, w)]; }
  else if (type === "AAS") { const [o, u, w] = v; items = [sideI(r, N, u, w), angI(N, u), angI(N, o)]; }
  else if (type === "SSA") { const [a, b, c] = v; items = [sideI(r, N, a, b), sideI(r, N, b, c), angI(N, a)]; }
  else if (type === "TWO") { const [a, b, c] = v; items = [sideI(r, N, a, b), sideI(r, N, b, c)]; }
  else { const [a, b] = v; items = [sideI(r, N, a, b), angI(N, pick(r, [a, b]))]; }
  items = shuffle(r, items);
  const cls = classify(N, items);
  if (cls.type !== type) throw new Error(`classify が ${cls.type}（想定 ${type}）`);
  return { items, key: items.map((x) => x.key).sort().join(), ...cls };
}
/** 合同条件の名前（4択の正解）。NONE＝どれにもあてはまらない */
const labelOf = (c) => (c.type === "SSS" ? "SSS" : c.type === "SAS" ? "SAS" : c.type === "ASA" ? "ASA" : "NONE");
/** 条件が、どの合同条件にあてはまるか／あてはまらないわけ（解説。最後の 1文が結論） */
function explain(N, c) {
  const s = (i, j) => sideNm(N, i, j), a = (i) => `∠${N.X[i]}`;
  if (c.type === "SSS") return [`等しい辺が 3組（${c.txt}）ある。`, `3つの辺が、それぞれ等しいから、「${LBL.SSS}」。`];
  if (c.type === "SAS") return [`等しい辺は ${s(c.c, c.u)}、${s(c.c, c.w)} の 2組で、等しい角は ${a(c.c)}。`, `${a(c.c)} は、辺 ${s(c.c, c.u)} と辺 ${s(c.c, c.w)} の間の角だから、「${LBL.SAS}」。`];
  if (c.type === "ASA") return [`等しい辺は ${s(c.u, c.w)} の 1組で、等しい角は ${a(c.u)}、${a(c.w)}。`, `${a(c.u)} と ${a(c.w)} は、辺 ${s(c.u, c.w)} の両端の角だから、「${LBL.ASA}」。`];
  if (c.type === "AAS") return [`等しい辺は ${s(c.u, c.w)} の 1組で、等しい角は ${a(c.u)} と ${a(c.o)}。`, `内角の和は 180° だから、のこりの ${a(c.w)} も等しい。${a(c.u)}、${a(c.w)} は辺 ${s(c.u, c.w)} の両端の角だから、「${LBL.ASA}」。`];
  if (c.type === "SSA") return [`等しい辺は ${s(c.a, c.b)}、${s(c.b, c.c)} の 2組で、等しい角は ${a(c.a)}。`, `等しい 2辺の間の角は ${a(c.b)} だから、${a(c.a)} は「${LBL.SAS}」にあてはまらない。ほかの合同条件にもあてはまらないので、かならず合同とはいえない。`];
  if (c.type === "TWO") return [`等しい辺は ${s(c.a, c.b)}、${s(c.b, c.c)} の 2組だけで、角はわからない。`, "どの合同条件にもあてはまらないので、かならず合同とはいえない。"];
  return [`等しい辺と角が、1組ずつしかわからない。`, "どの合同条件にもあてはまらないので、かならず合同とはいえない。"];
}

const TRUE3 = [LBL.SSS, LBL.SAS, LBL.ASA];
/** 合同条件の文：言い方（「それぞれ」の有無）を、選択肢ごとにかえて、言い方で正解がわからないようにする */
const FALSE5 = ["2組の辺と、その間にない角が等しい", "2組の辺が等しい", "1組の辺と1組の角が等しい", "1組の辺が等しい", "1組の辺と、その両端にない1組の角が等しい", "1組の辺と、その片方の端の角が等しい", "三角形の周の長さが等しい", "三角形の面積が等しい"];
const plain = (x) => x.replace("がそれぞれ等しい", "が等しい");
const wording = (r, x) => (r(0, 1) ? plain(x) : x.replace(/が等しい$/, "がそれぞれ等しい").replace(/がそれぞれがそれぞれ/, "がそれぞれ"));
const HINT_3 = "三角形の合同条件は、全部でいくつあったかな？ それぞれ、どんな言い方だったかな？";
const HINT_COND = "合同条件は 3つあったね。わかっている条件は、そのどれにあてはまるかな？";

/** 条件から、あてはまる合同条件を選ぶ4択（選択肢は、いつも同じ 4つの合同条件の名前） */
function condChoice(r, types) {
  const N = names(r), type = pick(r, types), c = cond(r, N, type), ans = LBL[labelOf(c)];
  return {
    q: `△${N.t1} と △${N.t2} で、次のことがわかっている。${c.txt}。このとき、△${N.t1}≡△${N.t2} といえるための合同条件は、次のうちどれか。（あてはまるものがなければ、「${LBL.NONE}」を選ぶ。）`,
    ans,
    choices: choices4(r, ans, Object.values(LBL).filter((x) => x !== ans)),
    hint: HINT_COND,
    steps: explain(N, c),
  };
}

// ── 辺と角の呼び名（dr.1）──────────────────────────────────────
function vertexNames(r) { const n = pick(r, ["ABC", "ABC", "DEF", "PQR", "XYZ", "KLM"]); return [...n]; }
const angPair = (x, y) => { const [p, q] = [x, y].sort(); return `∠${p} と ∠${q}`; };
const sidePair = (x, y) => { const [p, q] = [x, y].sort(); return `辺 ${p} と辺 ${q}`; };
/** 辺 AB と辺 AC の間の角／辺 BC の両端の角／∠B をはさむ 2辺。
 *  誤答には、正解に出てくる文字・辺も混ぜる（文字や辺の出かただけで、正解がわからないように） */
function termQ(r, kind) {
  const V = vertexNames(r), tri = V.join(""), nm = (x, y) => [x, y].sort().join("");
  const [v, u, w] = shuffle(r, V);
  const sUV = nm(v, u), sVW = nm(v, w), sUW = nm(u, w);
  if (kind === "between") {
    const ans = `∠${v}`, [s1, s2] = shuffle(r, [sUV, sVW]);
    return {
      q: `△${tri} で、辺 ${s1} と辺 ${s2} の間の角は、次のうちどれか。`,
      ans,
      choices: choices4(r, ans, [`∠${u}`, `∠${w}`, angPair(v, pick(r, [u, w]))]),
      hint: "2つの辺の「間の角」とは、どんな角のことだったかな？",
      steps: [`辺 ${s1} と辺 ${s2} は、頂点 ${v} で交わる。`, `この 2辺の間の角は、頂点 ${v} の角　${ans}。`],
    };
  }
  if (kind === "ends") {
    const ans = angPair(u, w);
    return {
      q: `△${tri} で、辺 ${sUW} の両端の角は、次のうちどれか。`,
      ans,
      choices: choices4(r, ans, [angPair(u, v), angPair(v, w), `∠${V.join("、∠")} のすべて`]),
      hint: "辺の「両端の角」とは、どんな角のことだったかな？",
      steps: [`辺 ${sUW} の両はしの頂点は、頂点 ${[u, w].sort().join("、")}。`, `辺 ${sUW} の両端の角は　${ans}。`],
    };
  }
  const right = sidePair(sUV, sVW);
  return {
    q: `△${tri} で、∠${v} をはさむ 2辺は、次のうちどれか。`,
    ans: right,
    choices: choices4(r, right, [sidePair(sUV, sUW), sidePair(sVW, sUW), `辺 ${pick(r, [sUV, sVW])}`]),
    hint: "角を「はさむ」2辺とは、どんな辺のことだったかな？",
    steps: [`頂点 ${v} を通る辺は、辺 ${sUV} と辺 ${sVW}。`, `∠${v} をはさむ 2辺は　${right}。`],
  };
}

// ── あと 1つ加える条件（dr.3・dr.5・qz.4）──────────────────────────────
/** 2辺（AB＝DE、BC＝EF）がわかっているとき、あと 1つ加える候補（ア〜エ）のうち、どちらを加えても、かならず合同といえる組（4択。選択肢は「アとウ」のようなラベルの組） */
function pairQ(r) {
  const N = names(r), [b, a, c] = shuffle(r, [0, 1, 2]);   // b＝2辺が出会う頂点
  const base = [sideI(r, N, a, b), sideI(r, N, b, c)];
  const KANA = "アイウエ";
  const cand = shuffle(r, [sideI(r, N, a, c), angI(N, b), angI(N, a), angI(N, c)]).map((it, i) => { const cl = classify(N, [...base, it]); return { it, ok: cl.ok, k: KANA[i], why: explain(N, cl).slice(-1)[0] }; });
  const pairs = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.push([cand[i], cand[j]]);
  const good = pairs.filter((p) => p[0].ok && p[1].ok);
  if (good.length !== 1) throw new Error("どちらを加えても合同といえる組が 1つでない");
  const bads = shuffle(r, pairs.filter((p) => p !== good[0])).slice(0, 3);
  const txt = (p) => `${p[0].k}と${p[1].k}`;
  const ans = txt(good[0]);
  return {
    q: `△${N.t1} と △${N.t2} で、${base.map((x) => x.txt).join("、")} がわかっている。あと 1つ、次のア〜エのどれかを加えて考える。${cand.map((x) => `　${x.k} ${x.it.txt}`).join("")}　次の組のうち、どちらを加えても、かならず △${N.t1}≡△${N.t2} といえるものは、どれか。`,
    ans,
    choices: choices4(r, ans, bads.map(txt)),
    hint: "合同条件は 3つあったね。辺や角を 1つ加えたとき、そのどれかにあてはまるのは、どの組かな？",
    steps: [
      `等しい 2辺は ${sideNm(N, a, b)}、${sideNm(N, b, c)} で、出会う頂点は ${N.X[b]}。`,
      `合同といえる … ${cand.filter((x) => x.ok).map((x) => `${x.k} ${x.it.txt}：${x.why}`).join("　")}`,
      `かならずしも合同といえない … ${cand.filter((x) => !x.ok).map((x) => `${x.k} ${x.it.txt}：${x.why}`).join("　")}`,
      `どちらを加えても合同といえるのは「${ans}」。`,
    ],
  };
}
/** 2つの条件がわかっているとき、あと 1つ加えて（ア〜エの 4つのうち）合同といえるものは、いくつあるか／かならずしも合同といえないものは、いくつあるか（数） */
function countQ(r) {
  const N = names(r), [u, w, v] = shuffle(r, [0, 1, 2]), kind = pick(r, ["B1", "B2", "B3"]);
  let base, cands;
  if (kind === "B1") { base = [sideI(r, N, u, w), sideI(r, N, w, v)]; cands = [sideI(r, N, u, v), angI(N, w), angI(N, u), angI(N, v)]; }          // 2辺（出会う頂点 w）
  else if (kind === "B2") { base = [sideI(r, N, u, w), angI(N, u)]; cands = [sideI(r, N, u, v), angI(N, w), angI(N, v), sideI(r, N, w, v)]; }  // 1辺と、その片はしの角
  else { base = [sideI(r, N, u, w), angI(N, v)]; cands = [angI(N, u), angI(N, w), sideI(r, N, u, v), sideI(r, N, w, v)]; }                     // 1辺と、むかいの角
  const items = shuffle(r, cands).map((it) => { const cl = classify(N, [...base, it]); return { it, ok: cl.ok, why: explain(N, cl).slice(-1)[0] }; });
  const askValid = r(0, 1) === 0, ans = items.filter((x) => x.ok === askValid).length;
  const KANA = "アイウエ";
  return {
    q: `△${N.t1} と △${N.t2} で、${base.map((x) => x.txt).join("、")} がわかっている。あと 1つ、次のア〜エのうちの 1つを加えて考える。${items.map((x, i) => `　${KANA[i]} ${x.it.txt}`).join("")}　このうち、加えると、${askValid ? "かならず" : "かならずしも"} △${N.t1}≡△${N.t2} と${askValid ? "いえるもの" : "いえるとはかぎらないもの"}は、いくつあるか。`,
    ans, unit: "つ",
    hint: "合同条件は 3つあったね。それぞれを加えたとき、そのどれかにあてはまるかな？",
    steps: [
      ...items.slice(0, 4).map((x, i) => `${KANA[i]} ${x.it.txt} … ${x.why}（${x.ok ? "合同といえる" : "かならずしも合同とはいえない"}）`).reduce((acc, line, i) => { if (i % 2 === 0) acc.push(line); else acc[acc.length - 1] += `　${line}`; return acc; }, []),
      `${askValid ? "合同といえる" : "かならずしも合同といえない"}のは ${items.map((x, i) => (x.ok === askValid ? KANA[i] : "")).join("")} の ${ans}つ。`,
    ],
  };
}
/** 2辺＋その間にない角（SSA）になるとき、合同といえるとはかぎらないわけ（4択）。「間の角である／ない」×「あてはまる／あてはまらない」を、言い方をかえて 2×2 にそろえる */
function reasonQ(r) {
  const N = names(r), [u, w, v] = shuffle(r, [0, 1, 2]);   // 辺 uw と角 u、あとから辺 wv を加える → 2辺 uw・wv は w で出会い、角 u は間の角ではない
  const base = [sideI(r, N, u, w), angI(N, u)], add = sideI(r, N, w, v);
  const cl = classify(N, [...base, add]);
  if (cl.type !== "SSA" || cl.a !== u || cl.b !== w) throw new Error("SSA にならない");
  const s1 = sideNm(N, u, w), s2 = sideNm(N, w, v), A = `∠${N.X[u]}`;
  const NOTB = ["間の角ではない", "間の角になっていない"], BETW = ["間の角である", "間の角になっている"];
  const SASX = ["2組の辺とその間の角にあてはまる", "「2組の辺とその間の角」の合同条件になる"], NONEX = ["どの合同条件にもあてはまらない", "合同条件のどれにもあてはまらない"];
  const mk = (between, sas) => `等しい角 ${A} は、等しい 2辺 ${s1}、${s2} の${pick(r, between ? BETW : NOTB)}ので、${pick(r, sas ? SASX : NONEX)}から。`;
  const ans = mk(false, false);
  return {
    q: `△${N.t1} と △${N.t2} で、${base.map((x) => x.txt).join("、")} がわかっている。これに ${add.txt} を加えても、△${N.t1}≡△${N.t2} といえるとはかぎらない。そのわけとして、正しいものはどれか。`,
    ans,
    choices: choices4(r, ans, [mk(true, true), mk(true, false), mk(false, true)]),
    hint: "合同条件は 3つあったね。わかっている条件は、そのどれかにあてはまるかな？ 等しい角は、等しい辺のどこにあるのかな？",
    steps: [...explain(N, cl), `正しいわけは「${ans}」。ほかの選択肢は、${A} が 2辺の間の角だと言っていたり、2組の辺とその間の角にあてはまると言っていたりして、まちがっている。`],
  };
}

// ── 合同といえる／いえない条件を、ならべた 4択（dr.7）──────────────────────────
/** どの選択肢も「3つの辺・角」の条件。正の問い：合同といえるのは「2辺と、その間の角（SAS）」、誤りは「2辺と、その間にない角（SSA）」3つ。
 *  負の問い：合同といえる 3つ（SAS を 2つ＋ほか 1つ）と、SSA 1つ。形（件数）では、正解が当たらない */
function listQ(r, wantValid) {
  const N = names(r), seen = new Set();
  const take = (type) => {
    for (let i = 0; i < 80; i++) {
      const c = cond(r, N, type);
      if (!seen.has(c.key)) { seen.add(c.key); return c; }
    }
    return null;
  };
  let valids, invalids;
  if (wantValid) { valids = [take("SAS")]; invalids = [take("SSA"), take("SSA"), take("SSA")]; }
  else { valids = [take("SAS"), take("SAS"), take(pick(r, ["SSS", "ASA", "AAS"]))]; invalids = [take("SSA")]; }
  if ([...valids, ...invalids].some((x) => !x)) return { skip: true };
  const ans = wantValid ? valids[0] : invalids[0], wrongs = wantValid ? invalids : valids;
  return {
    q: `△${N.t1} と △${N.t2} について、次の 4つのうち、${wantValid ? "それがわかれば、かならず" : "それがわかっても、かならずしも"} △${N.t1}≡△${N.t2} と${wantValid ? "いえるもの" : "いえるとはかぎらないもの"}は、どれか。`,
    ans: ans.txt,
    choices: choices4(r, ans.txt, wrongs.map((x) => x.txt)),
    hint: "合同条件は 3つあったね。それぞれの条件が、そのどれかにあてはまるかな？ そのままでは、あてはまらないときは、ほかの条件が出せないかな？",
    steps: [ans, ...wrongs].map((c, i) => `${c.txt} … ${c.ok ? "合同といえる" : "かならずしも合同とはいえない"}。${explain(N, c).slice(-1)[0]}${i === 0 ? "　← 答え" : ""}`),
  };
}

// ── 円と半直線で、三角形が何通りかけるか（dr.8）──────────────────────────
/** 線分 BC（a cm）、B から出る半直線（∠B＝θ）、CA＝b cm の △ABC は、何通りかけるか。
 *  a：∠B が鋭角で b＞a → 1通り。b：∠B＝30° で、C から半直線までの距離 d＝a/2 を言う → b＜d は 0、b＝d は 1、d＜b＜a は 2 通り。c：∠B が 90° 以上 → b＞a は 1通り、b＜a は 0通り */
function circleQ(r) {
  const sc = pick(r, ["a", "b", "b", "b", "c", "c"]);
  let a, b, th, d = null, ans, why;
  if (sc === "a") {
    a = r(3, 8); b = a + r(1, 4); th = pick(r, [25, 35, 40, 45, 50, 55, 60, 65]); ans = 1;
    why = [`C を中心とする半径 ${b}cm の円をかく。C から B までは BC＝${a}cm で、半径 ${b}cm より短いから、B は円の内がわにある。`, "円の内がわの点から出る半直線は、円と 1か所でしか交わらない。", `だから、点 A は 1か所に決まり、△ABC は 1通りしかかけない。`];
  } else if (sc === "b") {
    a = pick(r, [6, 8, 10, 12]); d = a / 2; th = 30;
    const out = r(0, 2);   // 0通り・1通り・2通り
    b = out === 0 ? r(1, d - 1) : out === 1 ? d : r(d + 1, a - 1);
    ans = out;
    why = [`C を中心とする半径 ${b}cm の円と、半直線との交わり方を考える。C から半直線までの距離は ${d}cm、C から B までは BC＝${a}cm。`, out === 0 ? `半径 ${b}cm は、距離 ${d}cm より短いから、円は半直線にとどかず、交わらない。` : out === 1 ? `半径 ${b}cm は、距離 ${d}cm と等しいから、円は半直線に 1点でふれる（垂線の足）。` : `半径 ${b}cm は、距離 ${d}cm より長く、BC＝${a}cm より短いから、円は半直線と 2か所で交わる。`, `△ABC は ${ans}通りかける。`];
  } else {
    a = r(3, 8); th = pick(r, [90, 100, 110, 120, 135, 150]);
    const one = r(0, 1) === 0;
    b = one ? a + r(1, 4) : r(1, a - 1); ans = one ? 1 : 0;
    why = [`∠B が ${th}° で、90° 以上のとき、半直線の上の点は、B から遠ざかるほど C からも遠くなる。だから、C からの距離は BC＝${a}cm 以上。`, one ? `CA＝${b}cm は BC＝${a}cm より長いので、C から ${b}cm の点が半直線の上に 1か所ある。` : `CA＝${b}cm は BC＝${a}cm より短いので、C から ${b}cm の点は半直線の上にない。`, `△ABC は ${ans}通りかける。`];
  }
  return {
    q: `線分 BC（${a}cm）と、B から出る半直線があり、半直線と線分 BC がつくる角は ∠B＝${th}° である。${d !== null ? `C から、この半直線までの距離（C から垂直にひいた線の長さ）は ${d}cm である。` : ""}点 A は、この半直線の上にあり、CA＝${b}cm である。△ABC は、何通りかけるか。（かけないときは 0 と答える）`,
    ans, unit: "通り",
    hint: "C を中心とする半径 CA の円と、B から出る半直線とは、何か所で交わるかな？",
    steps: why,
  };
}

export const UNITS = [
  unit("09", {
    name: "三角形の合同条件",
    desc: "3組の辺・2組の辺とその間の角・1組の辺とその両端の角。条件から合同を判断する",
    prereqs: ["J2-hk08"],
    points: [
      "2つの三角形が合同であるといえるための条件を、三角形の合同条件という。① 3組の辺がそれぞれ等しい。② 2組の辺とその間の角がそれぞれ等しい。③ 1組の辺とその両端の角がそれぞれ等しい。",
      "辺 AB、AC の間の角は ∠A。辺 BC の両端の角は ∠B と ∠C。三角形は、この 3つのどれかが決まると、1つに決まる。",
      "2組の辺と、その間にない角が等しいだけでは、三角形は 1つに決まらず、合同とはかぎらない。2組の辺だけ、1組の辺と1組の角だけでも、合同とはいえない。",
      "2つの角が等しければ、内角の和が 180° だから、のこりの角も等しい。だから、1組の辺と 2つの角が等しいときは、どの 2つの角でも合同といえる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 09d01a 演習（1）① 辺 AB と辺 AC の間の角
        t("09d01a", (r) => termQ(r, "between")),
        // 09d01b 演習（1）② 辺 BC の両端の角
        t("09d01b", (r) => termQ(r, "ends")),
        // 09d01c 演習（1）③ ∠B をはさむ 2辺
        t("09d01c", (r) => termQ(r, "sandwich")),
        // 09d02 演習（2）条件から合同条件（①②③）。ときどき、どの合同条件にもあてはまらない条件も出す
        tn("09d02", (r) => condChoice(r, ["SSS", "SAS", "ASA", "SSS", "SAS", "ASA", "SSA"])),
        // 09q01a 小テスト（1）合同条件として正しいもの
        t("09q01a", (r) => {
          const ans = wording(r, pick(r, TRUE3)), ws = shuffle(r, FALSE5).slice(0, 3).map((x) => wording(r, x));
          return {
            q: "三角形の合同条件として、正しいものはどれか。",
            ans,
            choices: choices4(r, ans, ws),
            hint: HINT_3,
            steps: [`三角形の合同条件は、「${LBL.SSS}」「${LBL.SAS}」「${LBL.ASA}」の 3つ。`, `正しいのは「${ans}」。ほかの選択肢は、条件が足りなかったり、角の位置がちがったりして、かならず合同とはいえない。`],
          };
        }),
        // 09q01b 小テスト（1）合同条件でないもの
        t("09q01b", (r) => {
          const ans = wording(r, pick(r, FALSE5));
          return {
            q: "次のうち、三角形の合同条件ではないものはどれか。",
            ans,
            choices: choices4(r, ans, TRUE3.map((x) => wording(r, x))),
            hint: HINT_3,
            steps: [`三角形の合同条件は、「${LBL.SSS}」「${LBL.SAS}」「${LBL.ASA}」の 3つ。`, `合同条件ではないのは「${ans}」。この条件だけでは、かならず合同とはいえない。`],
          };
        }),
        // 09q02 小テスト（2）条件から合同条件（①②③）
        tn("09q02", (r) => condChoice(r, ["SSS", "SAS", "ASA", "SSS", "SAS", "ASA", "SSA"])),
        // 09q03a 小テスト（3）辺 AB と辺 AC の間の角
        t("09q03a", (r) => termQ(r, "between")),
        // 09q03b 小テスト（3）辺 BC の両端の角
        t("09q03b", (r) => termQ(r, "ends")),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 09d03 演習（3）あと 1つ、2通り（どちらを加えても合同といえる組を選ぶ）
        t("09d03", (r) => pairQ(r)),
        // 09q04 小テスト（4）あと 1つ加えるとき、合同といえるもの（といえるとはかぎらないもの）はいくつか
        tc("09q04", (r) => countQ(r)),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 09d05 演習（5）2辺と、その間にない角が等しいとき、合同といえるとはかぎらないわけ（正しい説明を選ぶ4択）
        t("09d05", (r) => reasonQ(r)),
        // 09d06a 演習（6）対応する角の大きさ
        t("09d06a", (r) => {
          const N = names(r), type = pick(r, ["SSS", "SAS", "ASA"]), c = cond(r, N, type);
          let v;
          do { v = [r(30, 90), r(30, 90)]; v.push(180 - v[0] - v[1]); } while (v[2] < 30 || v[2] > 90 || new Set(v).size < 3);
          const k = r(0, 2), others = [0, 1, 2].filter((i) => i !== k), showY = [r(0, 1) === 1, r(0, 1) === 1], askY = r(0, 1) === 1;
          if (showY[0] === showY[1]) showY[1] = !showY[0];
          const nm = (i, y) => (y ? N.Y[i] : N.X[i]);
          const given = others.map((i, j) => `∠${nm(i, showY[j])}＝${v[i]}°`).join("、");
          return {
            q: `△${N.t1} と △${N.t2} で、${c.txt} がわかっている。${given} のとき、∠${nm(k, askY)} の大きさは？`,
            ans: v[k], unit: "度",
            hint: "この 2つの三角形は、合同といえるかな？ 合同なら、対応する角の大きさは、どうなるかな？ 三角形の内角の和は何度だったかな？",
            steps: [
              `${c.txt} がわかっていて、「${LBL[labelOf(c)]}」にあてはまるから　△${N.t1}≡△${N.t2}`,
              `合同だから、対応する角は等しい。${others.map((i) => `∠${N.X[i]}＝∠${N.Y[i]}＝${v[i]}°`).join("、")}`,
              `△${N.t1} の内角の和から　∠${N.X[k]}＝180°−${v[others[0]]}°−${v[others[1]]}°＝${v[k]}°${askY ? `。∠${N.Y[k]} は ∠${N.X[k]} に対応するから　∠${N.Y[k]}＝${v[k]}°` : ""}`,
            ],
          };
        }),
        // 09d06b 演習（6）使った合同条件（SAS が多いが、SSS・ASA・どれにもあてはまらない、も出す）
        tn("09d06b", (r) => condChoice(r, ["SAS", "ASA", "SSS", "SSA"])),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 09d07a 演習（7）かならず合同といえるものを選ぶ
        t("09d07a", (r) => listQ(r, true)),
        // 09d07b 演習（7）かならずしも合同といえないものを選ぶ
        t("09d07b", (r) => listQ(r, false)),
        // 09d08 演習（8）CA の長さから、△ABC は何通りかけるか（円と半直線の交わり方）
        tc("09d08", (r) => circleQ(r)),
        // 09q05 小テスト（5）チャレンジ：等しい辺・角がこれだけのとき、合同といえるか（理由を選ぶ4択）
        t("09q05", (r) => {
          const N = names(r), [u, w, o] = shuffle(r, [0, 1, 2]), X = N.X, Y = N.Y;
          const same = pick(r, [true, false]);   // true：1辺と 2つの角（のこりの角は内角の和で等しい）→ いえる／false：2つの角だけ（等しい辺がない）→ いえない
          const items = same ? [sideI(r, N, u, w), angI(N, u), angI(N, o)] : [angI(N, u), angI(N, o)];
          const txt = shuffle(r, items).map((x) => x.txt).join("、");
          let ans, ws, steps;
          const dd = `∠${X[w]}＝∠${Y[w]}`, v2 = (long, short) => pick(r, [long, short]);   // 言い方を、選択肢ごとにかえる（長さで答えがわからないように）
          if (same) {
            ans = v2(`いえる。内角の和から ${dd} がいえるので、1組の辺とその両端の角が、それぞれ等しくなるから。`, `いえる。${dd} がいえるので、1組の辺とその両端の角が等しくなるから。`);
            ws = [
              v2(`いえる。内角の和から ${dd} がいえるので、3組の辺が、それぞれ等しくなるから。`, `いえる。${dd} がいえるので、3組の辺が等しくなるから。`),
              v2(`いえない。内角の和を使っても ${dd} とはいえず、合同条件にあてはまらないから。`, `いえない。${dd} とはいえず、合同条件にあてはまらないから。`),
              v2(`いえない。等しい辺は 1組だけで、${dd} もいえないので、どの合同条件にもあてはまらないから。`, `いえない。等しい辺は 1組だけで、${dd} もいえないから。`),
            ];
            steps = [
              `${X[u]}${X[w]}＝${Y[u]}${Y[w]}、∠${X[u]}＝∠${Y[u]}、∠${X[o]}＝∠${Y[o]} がわかっている。`,
              `内角の和は 180° だから　∠${X[w]}＝180°−∠${X[u]}−∠${X[o]}、∠${Y[w]}＝180°−∠${Y[u]}−∠${Y[o]}。よって　${dd}`,
              `辺 ${X[u]}${X[w]} の両端の角 ∠${X[u]}、∠${X[w]} が、それぞれ等しい。だから、1組の辺とその両端の角がそれぞれ等しいといえる。`,
            ];
          } else {
            ans = v2(`いえない。内角の和から ${dd} がいえても、等しい辺がないので、合同条件にあてはまらないから。`, `いえない。${dd} がいえても、等しい辺がないから。`);
            ws = [
              v2(`いえる。内角の和から ${dd} がいえるので、1組の辺とその両端の角が、それぞれ等しくなるから。`, `いえる。${dd} がいえるので、1組の辺とその両端の角が等しくなるから。`),
              v2(`いえる。内角の和から ${dd} がいえるので、辺の長さも、それぞれ等しくなるから。`, `いえる。${dd} がいえるので、辺の長さも等しくなるから。`),
              v2(`いえない。内角の和を使っても ${dd} とはいえず、合同条件にあてはまらないから。`, `いえない。${dd} とはいえず、合同条件にあてはまらないから。`),
            ];
            steps = [
              `∠${X[u]}＝∠${Y[u]}、∠${X[o]}＝∠${Y[o]} がわかっているだけで、等しい辺がわかっていない。`,
              `内角の和から ${dd} がいえても、合同条件の 3つは、どれも、等しい辺が 1組以上ある。辺がわからないと、どの合同条件にもあてはまらない。`,
              `だから、△${N.t1}≡△${N.t2} とは、いえない。`,
            ];
          }
          return {
            q: `△${N.t1} と △${N.t2} で、${txt} がわかっている。△${N.t1}≡△${N.t2} といえるか。その理由として、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, ws),
            hint: "等しい辺は何組、等しい角は何組あるかな？ のこりの角は、どうなるかな？",
            steps,
          };
        }),
      ],
    },
  }),
];

export const SKIPPED = [
  ["heikou-09.dr.4", "作図して辺の長さを測る問題（線分と角をかいて、辺 AC の長さをものさしで測る。作図・測定は、コツコツくんではできない）"],
];
