// ============================================================
// heikou-09.js — 平行と合同 第9時「三角形は、何がわかれば1つに決まるだろう」
//   ikkan の演習プリント（heikou-09.dr.1〜8）・小テスト（heikou-09.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「09」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：09d07b ＝ heikou-09.dr.7 の「合同とはかぎらない条件」を選ぶ4択
//   図は出せないので、2つの三角形 △ABC と △DEF の「等しい辺・等しい角」を、「AB＝DE、BC＝EF、∠B＝∠E」のように文で言い切る。
//   どの条件が合同条件か（3組の辺／2組の辺とその間の角／1組の辺とその両端の角）は、条件のならべ方（角が、等しい辺の間にあるか、両はしにあるか）から計算で決める。
//   「2組の辺と、その間にない角」「1組の辺と1組の角」などは、かならず合同とはいえない（反例がある）。「1組の辺と、両端でない 2つの角」は、内角の和から残りの角が等しくなるので、合同といえる。
//   作図・コンパス（dr.4・dr.8）は、条件を選ぶ4択と、正しい説明を選ぶ4択に直した。「3通り答えよう」「すべて選ぼう」「条件を書こう」は、1つ選ぶ4択か、組を選ぶ4択にした。
// ============================================================
import { t as t0, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

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
/** 条件のつくり方。type＝SSS／SAS／ASA／AAS（1辺とその片はしの角と、むかいの角：内角の和で合同といえる）／SSA（2辺と、その間にない角）／TWO（2辺だけ）／SA（1辺と1角だけ）
 *  合同といえる＝SSS・SAS・ASA・AAS。ほかは、かならず合同とはいえない。 */
function cond(r, N, type) {
  const v = shuffle(r, [0, 1, 2]);
  let items, note;
  if (type === "SSS") { items = [sideI(r, N, 0, 1), sideI(r, N, 1, 2), sideI(r, N, 0, 2)]; note = { type }; }
  else if (type === "SAS") { const [c, u, w] = v; items = [sideI(r, N, c, u), sideI(r, N, c, w), angI(N, c)]; note = { type, c, u, w }; }
  else if (type === "ASA") { const [o, u, w] = v; items = [sideI(r, N, u, w), angI(N, u), angI(N, w)]; note = { type, o, u, w }; }
  else if (type === "AAS") { const [o, u, w] = v; items = [sideI(r, N, u, w), angI(N, u), angI(N, o)]; note = { type, o, u, w }; }
  else if (type === "SSA") { const [a, b, c] = v; items = [sideI(r, N, a, b), sideI(r, N, b, c), angI(N, a)]; note = { type, a, b, c }; }
  else if (type === "AAA") { items = [angI(N, 0), angI(N, 1), angI(N, 2)]; note = { type }; }
  else if (type === "TWO") { const [a, b, c] = v; items = [sideI(r, N, a, b), sideI(r, N, b, c)]; note = { type, a, b, c }; }
  else { const [a, b, c] = v; items = [sideI(r, N, a, b), angI(N, pick(r, [a, b, c]))]; note = { type, a, b, c }; }
  items = shuffle(r, items);
  return { items, txt: items.map((x) => x.txt).join("、"), key: items.map((x) => x.key).sort().join(), ok: ["SSS", "SAS", "ASA", "AAS"].includes(type), ...note };
}
/** 合同条件の名前（4択の正解）。NONE＝どれにもあてはまらない */
const labelOf = (c) => (c.type === "SSS" ? "SSS" : c.type === "SAS" ? "SAS" : c.type === "ASA" ? "ASA" : "NONE");
/** 条件が、どの合同条件にあてはまるか／あてはまらないわけ（解説） */
function explain(N, c) {
  const s = (i, j) => sideNm(N, i, j), a = (i) => `∠${N.X[i]}`;
  if (c.type === "SSS") return [`等しい辺が 3組（${c.txt}）ある。`, `3つの辺が、それぞれ等しいから、「${LBL.SSS}」。`];
  if (c.type === "SAS") return [`等しい辺は ${s(c.c, c.u)}、${s(c.c, c.w)} の 2組で、等しい角は ${a(c.c)}。`, `${a(c.c)} は、辺 ${s(c.c, c.u)} と辺 ${s(c.c, c.w)} の間の角だから、「${LBL.SAS}」。`];
  if (c.type === "ASA") return [`等しい辺は ${s(c.u, c.w)} の 1組で、等しい角は ${a(c.u)}、${a(c.w)}。`, `${a(c.u)} と ${a(c.w)} は、辺 ${s(c.u, c.w)} の両端の角だから、「${LBL.ASA}」。`];
  if (c.type === "AAS") return [`等しい辺は ${s(c.u, c.w)} の 1組で、等しい角は ${a(c.u)} と ${a(c.o)}。`, `内角の和は 180° だから、のこりの ${a(c.w)} も等しい。${a(c.u)}、${a(c.w)} は辺 ${s(c.u, c.w)} の両端の角だから、「${LBL.ASA}」。`];
  if (c.type === "SSA") return [`等しい辺は ${s(c.a, c.b)}、${s(c.b, c.c)} の 2組で、等しい角は ${a(c.a)}。`, `等しい 2辺の間の角は ${a(c.b)} だから、${a(c.a)} は「${LBL.SAS}」にあてはまらない。ほかの合同条件にもあてはまらないので、かならず合同とはいえない。`];
  if (c.type === "AAA") return [`等しい角が 3組（${c.txt}）ある。`, "3つの角が等しくても、辺の長さがちがう（大きさがちがう）三角形があるので、かならず合同とはいえない。"];
  if (c.type === "TWO") return [`等しい辺は ${s(c.a, c.b)}、${s(c.b, c.c)} の 2組だけで、角はわからない。`, "どの合同条件にもあてはまらないので、かならず合同とはいえない。"];
  return [`等しい辺と角が、1組ずつしかわからない。`, "どの合同条件にもあてはまらないので、かならず合同とはいえない。"];
}

const TRUE3 = [LBL.SSS, LBL.SAS, LBL.ASA];
const FALSE6 = ["3組の角がそれぞれ等しい", "2組の辺と、その間にない角がそれぞれ等しい", "2組の辺がそれぞれ等しい", "1組の辺と1組の角がそれぞれ等しい", "2組の角がそれぞれ等しい", "1組の辺がそれぞれ等しい"];
const HINT_3 = "三角形の合同条件は、全部でいくつあったかな？ それぞれ、どんな言い方だったかな？";
const HINT_COND = "合同条件は 3つあったね。わかっている条件は、そのどれにあてはまるかな？";

/** 条件から、あてはまる合同条件を選ぶ4択 */
function condChoice(r, types) {
  const N = names(r), type = pick(r, types), c = cond(r, N, type), lab = labelOf(c), ans = LBL[lab];
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
/** 辺 AB と辺 AC の間の角／辺 BC の両端の角／∠B をはさむ 2辺 */
function termQ(r, kind) {
  const V = vertexNames(r), tri = V.join(""), nm = (x, y) => [x, y].sort().join("");
  const [v, u, w] = shuffle(r, V);
  const sUV = nm(v, u), sVW = nm(v, w), sUW = nm(u, w);
  if (kind === "between") {
    const ans = `∠${v}`, [s1, s2] = shuffle(r, [sUV, sVW]);
    return {
      q: `△${tri} で、辺 ${s1} と辺 ${s2} の間の角は、次のうちどれか。`,
      ans,
      choices: choices4(r, ans, [`∠${u}`, `∠${w}`, angPair(u, w)]),
      hint: "2つの辺の「間の角」とは、どんな角のことだったかな？",
      steps: [`辺 ${s1} と辺 ${s2} は、頂点 ${v} で交わる。`, `この 2辺の間の角は、頂点 ${v} の角　${ans}。`],
    };
  }
  if (kind === "ends") {
    const ans = angPair(u, w);
    return {
      q: `△${tri} で、辺 ${sUW} の両端の角は、次のうちどれか。`,
      ans,
      choices: choices4(r, ans, [angPair(u, v), angPair(v, w), `∠${v}`]),
      hint: "辺の「両端の角」とは、どんな角のことだったかな？",
      steps: [`辺 ${sUW} の両はしの頂点は、頂点 ${[u, w].sort().join("、")}。`, `辺 ${sUW} の両端の角は　${ans}。`],
    };
  }
  const right = sidePair(sUV, sVW);
  return {
    q: `△${tri} で、∠${v} をはさむ 2辺は、次のうちどれか。`,
    ans: right,
    choices: choices4(r, right, [sidePair(sUV, sUW), sidePair(sVW, sUW), `辺 ${sUW}`]),
    hint: "角を「はさむ」2辺とは、どんな辺のことだったかな？",
    steps: [`頂点 ${v} を通る辺は、辺 ${sUV} と辺 ${sVW}。`, `∠${v} をはさむ 2辺は　${right}。`],
  };
}

// ── あと 1つ加える条件（dr.3・dr.5・qz.4）──────────────────────────────
/** 2辺（AB＝DE、BC＝EF）がわかっているとき、あと 1つ加えて、どちらを選んでも合同といえる組（4択） */
function pairQ(r) {
  const N = names(r), [b, a, c] = shuffle(r, [0, 1, 2]);   // b＝2辺が出会う頂点
  const base = [sideI(r, N, a, b), sideI(r, N, b, c)];
  const cand = [
    { it: sideI(r, N, a, c), ok: true, why: "3組の辺がそれぞれ等しくなる" },
    { it: angI(N, b), ok: true, why: `∠${N.X[b]} が、等しい 2辺 ${sideNm(N, a, b)}・${sideNm(N, b, c)} の間の角になるので、2組の辺とその間の角がそれぞれ等しくなる` },
    { it: angI(N, a), ok: false, why: `∠${N.X[a]} は、等しい 2辺の間の角ではなく、間の角は ∠${N.X[b]} なので、かならず合同とはいえない` },
    { it: angI(N, c), ok: false, why: `∠${N.X[c]} は、等しい 2辺の間の角ではなく、間の角は ∠${N.X[b]} なので、かならず合同とはいえない` },
  ];
  const pairs = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.push([cand[i], cand[j]]);
  const good = pairs.find((p) => p[0].ok && p[1].ok), bads = shuffle(r, pairs.filter((p) => p !== good)).slice(0, 3);
  const txt = (p) => shuffle(r, p).map((x) => x.it.txt).join("、または ");
  const ans = txt(good);
  return {
    q: `△${N.t1} と △${N.t2} で、${base.map((x) => x.txt).join("、")} がわかっている。あと 1つ、等しいことがわかれば、△${N.t1}≡△${N.t2} といえる。次の組のうち、どちらを加えても、かならず合同といえるものは、どれか。`,
    ans,
    choices: choices4(r, ans, bads.map(txt)),
    hint: "合同条件は 3つあったね。辺や角を 1つ加えたとき、そのどれかにあてはまるのは、どの組かな？",
    steps: [
      `等しい 2辺は ${sideNm(N, a, b)}、${sideNm(N, b, c)} で、出会う頂点は ${N.X[b]}。`,
      `合同といえる … ${cand.filter((x) => x.ok).map((x) => `${x.it.txt}：${x.why}`).join("；")}。`,
      `かならずしも合同といえない … ${cand.filter((x) => !x.ok).map((x) => `${x.it.txt}：${x.why}`).join("；")}。`,
      `どちらを加えても合同といえるのは「${ans}」。`,
    ],
  };
}
/** 1辺と、その辺の端の角（BC＝EF、∠B＝∠E）がわかっているとき、あと 1つ加えても、合同といえるとはかぎらないもの（4択） */
function notEnoughQ(r) {
  const N = names(r), [u, w, v] = shuffle(r, [0, 1, 2]);   // 辺 uw、角 u
  const base = [sideI(r, N, u, w), angI(N, u)];
  const cand = [
    { it: sideI(r, N, u, v), ok: true, why: `${sideNm(N, u, w)}・${sideNm(N, u, v)} の間の角 ∠${N.X[u]} が等しいので、2組の辺とその間の角がそれぞれ等しい` },
    { it: angI(N, w), ok: true, why: `辺 ${sideNm(N, u, w)} の両端の角 ∠${N.X[u]}、∠${N.X[w]} が等しいので、1組の辺とその両端の角がそれぞれ等しい` },
    { it: angI(N, v), ok: true, why: `内角の和は 180° だから ∠${N.X[w]} も等しくなり、1組の辺とその両端の角がそれぞれ等しい` },
    { it: sideI(r, N, w, v), ok: false, why: `等しい 2辺 ${sideNm(N, u, w)}、${sideNm(N, w, v)} の間の角は ∠${N.X[w]} で、等しい角 ∠${N.X[u]} は、その間の角ではないので、かならず合同とはいえない` },
  ];
  const bad = cand[3], goods = cand.slice(0, 3);
  return {
    q: `△${N.t1} と △${N.t2} で、${base.map((x) => x.txt).join("、")} がわかっている。あと 1つ加えるとき、△${N.t1}≡△${N.t2} といえるとはかぎらないものは、次のうちどれか。`,
    ans: bad.it.txt,
    choices: choices4(r, bad.it.txt, goods.map((x) => x.it.txt)),
    hint: "合同条件は 3つあったね。それぞれを加えたとき、そのどれかにあてはまるかな？",
    steps: [
      ...cand.slice(0, 3).map((x) => `${x.it.txt} を加える … ${x.why}（合同といえる）。`),
      `${bad.it.txt} を加える … ${bad.why}。答えは「${bad.it.txt}」。`,
    ],
  };
}

// ── 合同といえる／いえない条件を、ならべた 4択（dr.7）──────────────────────────
const VALID = ["SSS", "SAS", "ASA", "AAS"];
function listQ(r, wantValid) {
  const N = names(r), seen = new Set();
  const take = (types) => {
    for (let i = 0; i < 80; i++) {
      const c = cond(r, N, pick(r, types));
      if (!seen.has(c.key)) { seen.add(c.key); return c; }
    }
    return null;
  };
  // どの選択肢も「3つの辺・角」でできている（個数で答えが当たらないように）。かならず合同といえない条件は、2辺と間にない角（SSA）か、3つの角
  let valids, invalids;
  if (wantValid) {
    valids = [take([pick(r, ["SAS", "SAS", "SSS", "ASA", "AAS"])])];
    invalids = [take(["SSA"]), take(["SSA"]), take(r(0, 1) ? ["SSA", "AAA"] : ["SSA"])];
  } else {
    valids = [take(["SAS"]), ...shuffle(r, ["SSS", "ASA", "AAS"]).slice(0, 2).map((ty) => take([ty]))];
    invalids = [take(["SSA"])];
  }
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

export const UNITS = [
  unit("09", {
    name: "三角形の合同条件",
    desc: "3組の辺・2組の辺とその間の角・1組の辺とその両端の角。条件から合同を判断する",
    prereqs: ["J2-hk08"],
    points: [
      "2つの三角形が合同であるといえるための条件を、三角形の合同条件という。① 3組の辺がそれぞれ等しい。② 2組の辺とその間の角がそれぞれ等しい。③ 1組の辺とその両端の角がそれぞれ等しい。",
      "辺 AB、AC の間の角は ∠A。辺 BC の両端の角は ∠B と ∠C。三角形は、この 3つのどれかが決まると、1つに決まる。",
      "2組の辺と、その間にない角が等しいだけでは、三角形は 1つに決まらず、合同とはかぎらない。3組の角が等しいだけでも、合同とはいえない。",
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
        // 09d02 演習（2）条件から合同条件（①②③）
        t("09d02", (r) => condChoice(r, ["SSS", "SAS", "ASA"])),
        // 09q01a 小テスト（1）合同条件として正しいもの
        t("09q01a", (r) => {
          const ans = pick(r, TRUE3), ws = shuffle(r, FALSE6).slice(0, 3);
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
          const ans = pick(r, FALSE6);
          return {
            q: "次のうち、三角形の合同条件ではないものはどれか。",
            ans,
            choices: choices4(r, ans, TRUE3),
            hint: HINT_3,
            steps: [`三角形の合同条件は、「${LBL.SSS}」「${LBL.SAS}」「${LBL.ASA}」の 3つ。`, `合同条件ではないのは「${ans}」。この条件だけでは、かならず合同とはいえない。`],
          };
        }),
        // 09q02 小テスト（2）条件から合同条件（①②③）
        t("09q02", (r) => condChoice(r, ["SSS", "SAS", "ASA"])),
        // 09q03a 小テスト（3）辺 AB と辺 AC の間の角
        t("09q03a", (r) => termQ(r, "between")),
        // 09q03b 小テスト（3）辺 BC の両端の角
        t("09q03b", (r) => termQ(r, "ends")),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 09d03 演習（3）あと 1つ、2通り（どちらを加えても合同といえる組を選ぶ）
        t("09d03", (r) => pairQ(r)),
        // 09d04 演習（4）作図で決まる三角形（合同条件を選ぶ）
        t("09d04", (r) => {
          const N = names(r), type = pick(r, ["SSS", "SAS", "ASA"]);
          let spec;
          if (type === "SSS") {
            let s;
            do { s = [r(3, 9), r(3, 9), r(3, 9)]; } while (new Set(s).size < 3 || Math.max(...s) >= s.reduce((a, b) => a + b, 0) - Math.max(...s));
            spec = `${N.X[0]}${N.X[1]}＝${s[0]}cm、${N.X[1]}${N.X[2]}＝${s[1]}cm、${N.X[0]}${N.X[2]}＝${s[2]}cm`;
          } else if (type === "SAS") {
            spec = `${N.X[0]}${N.X[1]}＝${r(3, 9)}cm、${N.X[1]}${N.X[2]}＝${r(3, 9)}cm、∠${N.X[1]}＝${r(30, 120)}°`;
          } else {
            spec = `${N.X[1]}${N.X[2]}＝${r(3, 9)}cm、∠${N.X[1]}＝${r(30, 80)}°、∠${N.X[2]}＝${r(30, 80)}°`;
          }
          const ans = LBL[type];
          return {
            q: `△${N.t1} を、${spec} の条件でかく。この条件でかいた三角形は、だれがかいても、ぴったり重なる（合同になる）。そのわけにあてはまる合同条件は、次のうちどれか。（あてはまるものがなければ、「${LBL.NONE}」を選ぶ。）`,
            ans,
            choices: choices4(r, ans, Object.values(LBL).filter((x) => x !== ans)),
            hint: "合同条件は 3つあったね。三角形をかくのに使った条件は、そのどれにあてはまるかな？",
            steps: [`かくときに使った条件は　${spec}。`, type === "SSS" ? `3つの辺の長さが決まっているので、「${ans}」。` : type === "SAS" ? `∠${N.X[1]} は、辺 ${N.X[0]}${N.X[1]} と辺 ${N.X[1]}${N.X[2]} の間の角だから、「${ans}」。` : `∠${N.X[1]} と ∠${N.X[2]} は、辺 ${N.X[1]}${N.X[2]} の両端の角だから、「${ans}」。`, "この条件がそろうと、三角形は 1つに決まるので、だれがかいても合同になる。"],
          };
        }),
        // 09q04 小テスト（4）あと 1つ加えても、合同といえるとはかぎらないもの
        t("09q04", (r) => notEnoughQ(r)),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 09d05 演習（5）あと 1つ、3通り → 合同といえるとはかぎらないものを選ぶ
        t("09d05", (r) => notEnoughQ(r)),
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
        // 09d06b 演習（6）使った合同条件
        t("09d06b", (r) => condChoice(r, ["SAS", "SAS", "ASA", "SSS", "SSA"])),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 09d07a 演習（7）かならず合同といえるものを選ぶ
        t("09d07a", (r) => listQ(r, true)),
        // 09d07b 演習（7）かならずしも合同といえないものを選ぶ
        t("09d07b", (r) => listQ(r, false)),
        // 09d08 演習（8）CA の長さから、三角形が 1通りにしかかけないわけ（正しい説明を選ぶ4択）
        t("09d08", (r) => {
          let bc, ca;
          do { bc = r(3, 8); ca = bc + r(1, 4); } while (ca > 12);
          const th = pick(r, [25, 30, 35, 40, 45, 50, 55, 60, 65]);
          const ans = "B は円の内がわにあるので、B から出る半直線は、円と 1か所でしか交わらないから。";
          const ws = [
            "B は円の内がわにあるので、B から出る半直線は、円と 2か所で交わるから。",
            "B は円の外がわにあるので、B から出る半直線は、円と 1か所でしか交わらないから。",
            "B は円の外がわにあるので、B から出る半直線は、円と 2か所で交わるから。",
          ];
          return {
            q: `線分 BC（${bc}cm）と、B から出る ∠B＝${th}° の半直線がある。CA＝${ca}cm の △ABC の頂点 A は、この半直線の上にあり、C を中心とする半径 ${ca}cm の円の上にもある。△ABC は、1通りしかかけない。そのわけとして、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, ws),
            hint: "円の内がわの点から出る半直線と、外がわの点から出る半直線とで、円との交わり方は、どうちがうかな？",
            steps: [
              `C を中心とする半径 ${ca}cm の円で、C から B までの長さは BC＝${bc}cm。${bc}cm は半径 ${ca}cm より短いから、B は円の内がわにある。`,
              "円の内がわの点から出る半直線は、円と 1か所でしか交わらない。",
              `だから、点 A は 1つに決まり、△ABC は 1通りしかかけない。正しいわけは「${ans}」`,
            ],
          };
        }),
        // 09q05 小テスト（5）チャレンジ：AB＝DE、∠A＝∠D、∠C＝∠F のとき、合同といえるか
        t("09q05", (r) => {
          const N = names(r), [u, w, o] = shuffle(r, [0, 1, 2]);   // 辺 uw、角 u と 角 o（のこりの角は w）
          const X = N.X, Y = N.Y, txt = shuffle(r, [sideI(r, N, u, w), angI(N, u), angI(N, o)]).map((x) => x.txt).join("、");
          const ans = `いえる。内角の和から ∠${X[w]}＝∠${Y[w]} がいえるので、1組の辺とその両端の角が、それぞれ等しくなるから。`;
          const ws = [
            "いえない。等しい辺は 1組だけで、3組の辺にも、2組の辺とその間の角にも、あてはまらないから。",
            "いえない。等しい角は 2組だけで、のこりの角が等しいとはかぎらず、合同条件にあてはまらないから。",
            "いえる。3組の角が、それぞれ等しくなるので、2つの三角形はぴったり重なると考えられるから。",
          ];
          return {
            q: `△${N.t1} と △${N.t2} で、${txt} がわかっている。△${N.t1}≡△${N.t2} といえるか。その理由として、正しいものはどれか。`,
            ans,
            choices: choices4(r, ans, ws),
            hint: "合同条件の 3つに、あてはめてみよう。そのままでは、あてはまらないとき、ほかの条件から出せる辺や角は、ないかな？",
            steps: [
              `${X[u]}${X[w]}＝${Y[u]}${Y[w]}、∠${X[u]}＝∠${Y[u]}、∠${X[o]}＝∠${Y[o]} がわかっている。`,
              `内角の和は 180° だから　∠${X[w]}＝180°−∠${X[u]}−∠${X[o]}、∠${Y[w]}＝180°−∠${Y[u]}−∠${Y[o]}。よって　∠${X[w]}＝∠${Y[w]}`,
              `辺 ${X[u]}${X[w]} の両端の角 ∠${X[u]}、∠${X[w]} が、それぞれ等しい。だから、1組の辺とその両端の角がそれぞれ等しいといえる。`,
              "3組の角が等しいだけでは合同とはいえないが、ここでは、等しい辺が 1組あることも使っている。",
            ],
          };
        }),
      ],
    },
  }),
];

export const SKIPPED = [];
