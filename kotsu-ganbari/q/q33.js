// 問33：正四面体の展開図（重なる点・辺・集まる面）
// 展開図を 3 次元の座標で実際に折りたたんで、重なる点を計算してから、動画にしている。
import { P, seg, poly, txt, dot, circ, oblique } from "../dsl.js";

// ── 3 次元の計算 ───────────────────────────────────
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => mul(a, 1 / len3(a));
// 点 p を、a を通る向き u の軸のまわりに th ラジアン回す（ロドリゲスの公式）
function rotAbout(p, a, u, th) {
  const v = sub(p, a), c = Math.cos(th), s = Math.sin(th);
  return add(a, add(add(mul(v, c), mul(cross3(u, v), s)), mul(u, dot3(u, v) * (1 - c))));
}

// 展開図（1 辺 2 の正三角形 4 まい）。x は右、y は上（ゆかの上での「おく」）
const s3 = Math.sqrt(3);
const N = { A: [1, s3, 0], B: [0, 0, 0], C: [2, 0, 0], D: [4, 0, 0], E: [5, s3, 0], F: [3, s3, 0] };
// 面。イを底に置き、ア・ウはイに、エはウにつながる（hinge＝折り目）
const FACES = {
  イ: { v: ["A", "C", "F"] },
  ア: { v: ["A", "B", "C"], parent: "イ", hinge: ["A", "C"] },
  ウ: { v: ["C", "D", "F"], parent: "イ", hinge: ["C", "F"] },
  エ: { v: ["D", "E", "F"], parent: "ウ", hinge: ["D", "F"] },
};
const SGN = { ア: -1, ウ: -1, エ: -1 };          // 折る向き（ぜんぶ「上」へ。立体がとじる向きを、計算で選んだ）
const FOLD = Math.PI - Math.acos(1 / 3);          // 折る角＝180°−二面角(70.53°)＝109.47°
// t: {ア, ウ, エ} それぞれ 0（平ら）〜1（折りおわり）
function pose(t) {
  const out = {};
  for (const [fn, f] of Object.entries(FACES)) {
    const chain = [];
    for (let c = fn; FACES[c].parent; c = FACES[c].parent) chain.push(c);
    out[fn] = {};
    for (const k of f.v) {
      let p = N[k];
      for (const g of chain) {
        const h = FACES[g].hinge;
        p = rotAbout(p, N[h[0]], unit3(sub(N[h[1]], N[h[0]])), SGN[g] * FOLD * (t[g] ?? 0));
      }
      out[fn][k] = p;
    }
  }
  return out;
}
const ptsOf = (PO) => { const r = {}; for (const fn of Object.keys(PO)) for (const [k, p] of Object.entries(PO[fn])) if (!r[k]) r[k] = p; return r; };
const groupPts = (r) => {
  const g = [];
  for (const k of Object.keys(r)) { const x = g.find((q) => len3(sub(q.p, r[k])) < 1e-6); if (x) x.names.push(k); else g.push({ names: [k], p: r[k] }); }
  return g;
};

// ── 検算（読みこむたびに実行。合わなければエラーにする）──
const DONE = { ア: 1, ウ: 1, エ: 1 };
const FIN = pose(DONE), finPts = ptsOf(FIN), GROUPS = groupPts(finPts);
const gid = (n) => GROUPS.findIndex((g) => g.names.includes(n));
{
  const names = GROUPS.map((g) => g.names.join("")).sort().join(",");
  if (names !== "AE,BD,C,F") throw new Error("折りたたみの計算が合いません：" + names);
  const vs = GROUPS.map((g) => g.p);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (Math.abs(len3(sub(vs[i], vs[j])) - 2) > 1e-6) throw new Error("正四面体になっていません");
  const key = (e) => [gid(e[0]), gid(e[1])].sort().join("-");
  const same = ["AB", "BC", "CA", "AF", "CF", "CD", "DF", "DE", "EF"].filter((e) => key(e) === key("AB"));
  const face3 = Object.entries({ ア: "ABC", イ: "ACF", ウ: "CDF", エ: "DEF" }).filter(([, s]) => [...s].some((c) => gid(c) === gid("E"))).map(([f]) => f).join("");
  if (GROUPS[gid("B")].names.join("") !== "BD" || same.join(",") !== "AB,DE" || face3 !== "アイエ") throw new Error("答えの検算が合いません");
}

// ── 色 ────────────────────────────────────────────
const BLUE = "#1f6fe0";
const COL = { A: "y", E: "y", B: BLUE, D: BLUE, C: "b", F: "p" };

// ── 展開図（左上・印刷物と同じ形）──────────────────────
const h = 46, X0 = 24, Y0 = 114;
const n2 = (k) => [X0 + N[k][0] * h, Y0 - N[k][1] * h];
const LP2 = { A: "nw", B: "sw", C: "s", D: "se", E: "ne", F: "n" };
const cen2 = (f) => { const vs = FACES[f].v; return [vs.reduce((s, k) => s + n2(k)[0], 0) / 3, vs.reduce((s, k) => s + n2(k)[1], 0) / 3]; };
const netBase = [
  poly(["B", "D", "E", "A"].map(n2), { w: 2.4, id: "netO" }),
  seg(n2("A"), n2("C"), { dash: true, id: "fAC" }), seg(n2("C"), n2("F"), { dash: true, id: "fCF" }), seg(n2("F"), n2("D"), { dash: true, id: "fFD" }),
  ...Object.keys(N).map((k) => P("n" + k, n2(k)[0], n2(k)[1], k, LP2[k], { dot: false })),
  ...["ア", "イ", "ウ", "エ"].map((f) => txt(cen2(f)[0], cen2(f)[1] + 5, f, { size: 16, id: "nf" + f })),
];
// 展開図の点に色をつける（色が変わらないよう base）
const netDot = (k) => dot(n2(k)[0], n2(k)[1], { r: 6.5, c: COL[k], base: true, id: "nd" + k });
const netRing = (k) => circ(n2(k), 12, { c: "a", w: 3.5, base: true, id: "nr" + k });
const netFill = (f, c = "a", id = "nfill" + f) => poly(FACES[f].v.map(n2), { fill: c, fo: 0.38, w: 0, id });
const netEdge = (a, b, c = "a", id) => seg(n2(a), n2(b), { c, w: 4.5, base: true, id });

// ── 立体（斜投影）──────────────────────────────────
const U = 80, pr = oblique(40, 352, 0.5, 40);
const p3 = (p) => pr([p[0] * U, p[1] * U, p[2] * U]);
const labelPos = (pt, ctr) => {
  const dx = pt[0] - ctr[0], dy = pt[1] - ctr[1];
  if (Math.abs(dx) < Math.abs(dy) * 0.45) return dy < 0 ? "n" : "s";
  if (Math.abs(dy) < Math.abs(dx) * 0.45) return dx < 0 ? "w" : "e";
  return (dy < 0 ? "n" : "s") + (dx < 0 ? "w" : "e");
};
// 折りぐあい t のとき、面（ぬり）と点の名前を出す。reveal＝色をつけた点
function poseEls(pre, t, reveal) {
  const PO = pose(t), els = [], ids = [];
  const push = (e) => { els.push(e); ids.push(e.id); return e; };
  for (const fn of ["イ", "ア", "ウ", "エ"]) {
    push(poly(FACES[fn].v.map((k) => p3(PO[fn][k])), { id: pre + "f" + fn, fill: "k", fo: 0.2, c: "g", w: 1.8, base: true }));
  }
  const groups = groupPts(ptsOf(PO)).map((g) => ({ ...g, s: p3(g.p) }));
  const ctr = [groups.reduce((s, g) => s + g.s[0], 0) / groups.length, groups.reduce((s, g) => s + g.s[1], 0) / groups.length];
  for (const g of groups) {
    const seen = g.names.some((k) => reveal.includes(k));
    push(P(pre + "v" + g.names.join(""), g.s[0], g.s[1], g.names.join("・"), labelPos(g.s, ctr), seen ? { c: COL[g.names[0]], r: 6, base: true } : { dot: false, c: "k", base: true }));
  }
  for (const fn of ["イ", "ア", "ウ", "エ"]) {
    const ps = FACES[fn].v.map((k) => p3(PO[fn][k]));
    push(txt((ps[0][0] + ps[1][0] + ps[2][0]) / 3, (ps[0][1] + ps[1][1] + ps[2][1]) / 3 + 5, fn, { id: pre + "t" + fn, size: 15, c: "k", base: true }));
  }
  return { els, ids };
}
// 組み立てた正四面体（見えない辺は点線）
const VG = { AE: FIN.イ.A, BD: FIN.ア.B, C: FIN.イ.C, F: FIN.イ.F };       // 4 つの頂点の 3 次元の位置
const FG = { ア: ["AE", "BD", "C"], イ: ["AE", "C", "F"], ウ: ["C", "BD", "F"], エ: ["BD", "AE", "F"] };
const viewDir = [-0.5 * Math.cos((40 * Math.PI) / 180), 1, -0.5 * Math.sin((40 * Math.PI) / 180)];
const cenV = mul(Object.values(VG).reduce((s, p) => add(s, p), [0, 0, 0]), 1 / 4);
const faceVis = {};
for (const [f, vs] of Object.entries(FG)) {
  let nr = cross3(sub(VG[vs[1]], VG[vs[0]]), sub(VG[vs[2]], VG[vs[0]]));
  const fc = mul(add(add(VG[vs[0]], VG[vs[1]]), VG[vs[2]]), 1 / 3);
  if (dot3(nr, sub(fc, cenV)) < 0) nr = mul(nr, -1);
  faceVis[f] = dot3(nr, viewDir) < -1e-9;
}
const edgeVis = {};
for (const [f, vs] of Object.entries(FG)) vs.forEach((a, i) => { const b = vs[(i + 1) % 3], k = [a, b].sort().join("|"); edgeVis[k] = edgeVis[k] || faceVis[f]; });
const S4 = Object.fromEntries(Object.entries(VG).map(([k, p]) => [k, p3(p)]));
const cen4 = [Object.values(S4).reduce((s, p) => s + p[0], 0) / 4, Object.values(S4).reduce((s, p) => s + p[1], 0) / 4];
const LBL4 = { AE: "A・E", BD: "B・D", C: "C", F: "F" };
const TCOL = { AE: "y", BD: BLUE, C: "b", F: "p" };
function finalEls(pre) {
  const els = [], ids = [];
  const push = (e) => { els.push(e); ids.push(e.id); return e; };
  for (const f of ["イ", "ア", "ウ", "エ"]) push(poly(FG[f].map((k) => S4[k]), { id: pre + "f" + f, fill: "k", fo: 0.12, c: "g", w: 0, base: true }));
  for (const [k, vis] of Object.entries(edgeVis)) {
    const [a, b] = k.split("|");
    push(seg(S4[a], S4[b], { id: pre + "e" + a + b, c: "g", w: 2.2, dash: vis ? false : true, base: true }));
  }
  for (const k of Object.keys(S4)) push(P(pre + "v" + k, S4[k][0], S4[k][1], LBL4[k], labelPos(S4[k], cen4), { c: TCOL[k], r: 6, base: true }));
  return { els, ids };
}

// 各コマの立体
const Z = { ア: 0, ウ: 0, エ: 0 };
const pose0 = poseEls("a", Z, ["A", "C", "F"]);
const pose1 = poseEls("b", { ア: 0.3, ウ: 0, エ: 0 }, ["A", "C", "F"]);
const pose2 = poseEls("c", { ア: 1, ウ: 0, エ: 0 }, ["A", "C", "F", "B"]);
const pose3 = poseEls("d", { ア: 1, ウ: 0.5, エ: 0 }, ["A", "C", "F", "B"]);
const pose4 = poseEls("e", { ア: 1, ウ: 1, エ: 0 }, ["A", "C", "F", "B", "D"]);
const pose5 = poseEls("f", { ア: 1, ウ: 1, エ: 0.5 }, ["A", "C", "F", "B", "D"]);
const fin = finalEls("g");
const clr = (...a) => a.flatMap((x) => x.ids);

// 凡例（右上）
const legend = [
  txt(300, 44, "同じ色の点は、組み立てると", { size: 15, anchor: "start", c: "k", base: true, id: "lg0" }),
  txt(300, 63, "1つの頂点に重なるよ", { size: 15, anchor: "start", c: "k", base: true, id: "lg0b" }),
  txt(300, 92, "A ＝ E", { size: 17, anchor: "start", c: "y", base: true, id: "lg1" }),
  txt(380, 92, "B ＝ D", { size: 17, anchor: "start", c: BLUE, base: true, id: "lg2" }),
  txt(300, 118, "C", { size: 17, anchor: "start", c: "b", base: true, id: "lg3" }),
  txt(380, 118, "F", { size: 17, anchor: "start", c: "p", base: true, id: "lg4" }),
];
const lgIds = legend.map((e) => e.id);

// 3 次元の面ぬり（答えの面）
const finFill = (f, c = "a") => poly(FG[f].map((k) => S4[k]), { fill: c, fo: 0.4, w: 0, id: "gx" + f });

export default {
  n: 33,
  title: "正四面体の展開図と重なり",
  problem: "右の図は、正四面体の展開図である。この展開図を組み立ててできる正四面体について、次の問いに答えなさい。\n(1) 点Bに重なる点はどれか答えなさい。\n(2) 辺ABに重なる辺はどれか答えなさい。\n(3) 点Eに集まる面をア〜エからすべて選びなさい。",
  answer: "(1) 点D　(2) 辺DE（辺ED）　(3) ア、イ、エ",
  view: [0, 0, 520, 380],
  steps: [
    {
      cap: "正四面体の展開図だよ。組み立てたとき、どの点・どの辺が重なるかを考える問題だね。",
      add: netBase,
    },
    {
      cap: "展開図は**正三角形が4まい**（ア〜エ）。点は6つあるのに、正四面体の頂点は**4つ**だから、重なる点があるはず！",
      hl: ["fAC", "fCF", "fFD"],
      eq: ["## 考え方", "展開図の点 … A〜F の 6こ", "正四面体の頂点 … 4こ", "=> 2こぶん、重なる点がある", "// 点線は折り目"],
    },
    {
      cap: "では折ってみよう。まず**イを底**（ゆか）に置くよ。イの頂点 A・C・F に、色をつけておくね。",
      add: [...pose0.els, netDot("A"), netDot("C"), netDot("F")],
      together: true,
      eq: ["## 折り方の順", "① イ を底に置く（A・C・F に色）"],
    },
    {
      cap: "② **ア**を、辺ACを折り目にして、起こしていくよ。",
      hide: clr(pose0),
      add: pose1.els,
      together: true,
      eq: ["② ア を AC で折る"],
    },
    {
      cap: "アがななめに立って、B が**いちばん上**の頂点にきたよ。B は青にしよう。",
      hide: clr(pose1),
      add: [...pose2.els, netDot("B")],
      together: true,
      eq: ["　→ B が上の頂点になる（青）"],
    },
    {
      cap: "③ 次に**ウ**を、辺CFで折り起こすよ。ウにくっついている**エ**も、いっしょに動くね。",
      hide: clr(pose2),
      add: pose3.els,
      together: true,
      eq: ["③ ウ を CF で折る（エもついてくる）"],
    },
    {
      cap: "ウの D も、**B と同じ頂点**にきた！ B と D はぴったり重なるから、D も青にするよ。",
      hide: clr(pose3),
      add: [...pose4.els, netDot("D")],
      together: true,
      eq: ["　→ D も上の頂点に重なる", "=> B と D が重なる"],
    },
    {
      cap: "④ 最後に**エ**を、辺DFで折って、ふたをするよ。",
      hide: clr(pose4),
      add: pose5.els,
      together: true,
      eq: ["④ エ を DF で折る"],
    },
    {
      cap: "E は、**A の上**にぴったり重なった！ A と E は同じ頂点だから、E は黄色。正四面体のできあがり。",
      hide: [...clr(pose5)],
      add: [...fin.els, netDot("E")],
      together: true,
      eq: ["　→ E が A に重なる", "=> A と E が重なる"],
    },
    {
      cap: "まとめると、重なる点は **A＝E** と **B＝D**。C と F は、重なる相手がいない。頂点は 2+1+1 ＝ 4つで、ぴったりだね。",
      add: legend,
      together: true,
      eq: ["## 重なる点", "A ＝ E", "B ＝ D", "C だけ、F だけ"],
    },
    {
      cap: "(1) 点Bに重なる点は、同じ青色の点 **D** だね。",
      hide: lgIds,
      add: [netRing("B"), netRing("D"), circ(S4.BD, 12, { c: "a", w: 3.5, base: true, id: "ringBD" })],
      together: true,
      eqClear: true,
      eq: ["## (1) 点Bに重なる点", "B ＝ D", "=> (1) 点D"],
    },
    {
      cap: "(2) 辺ABの両はしは、A（黄）と B（青）。**黄と青をむすぶ辺**を、展開図でさがそう。AB と、もう1本 **DE** があるね。",
      hide: ["nrB", "nrD", "ringBD"],
      add: [netEdge("A", "B", "a", "eAB"), netEdge("D", "E", "a", "eDE"), seg(S4.AE, S4.BD, { c: "a", w: 4.5, base: true, id: "e3d" })],
      together: true,
      eqClear: true,
      eq: ["## (2) 辺ABに重なる辺", "A ＝ E、B ＝ D だから", "辺AB ＝ 辺ED", "=> (2) 辺DE（辺ED）"],
    },
    {
      cap: "確かめ：まわりの6本の辺は、2本ずつくっつくよ。**AB と DE**、BC と DC、AF と EF の3組だね。",
      add: [netEdge("B", "C", BLUE, "pBC"), netEdge("C", "D", BLUE, "pCD"), netEdge("A", "F", "b", "pAF"), netEdge("F", "E", "b", "pFE")],
      together: true,
      eq: ["// 外まわり6本は、2本ずつ重なる", "// AB と ED　　BC と DC　　AF と EF"],
    },
    {
      cap: "(3) 点Eは、Aと重なっているよ。**Aをふくむ面**は ア と イ、**Eをふくむ面**は エ。この3つが集まるね。",
      hide: ["eAB", "eDE", "e3d", "pBC", "pCD", "pAF", "pFE"],
      add: [netFill("ア"), netFill("イ"), netFill("エ"), finFill("ア"), finFill("イ"), finFill("エ")],
      together: true,
      eqClear: true,
      eq: ["## (3) 点Eに集まる面", "E ＝ A", "A をふくむ面：ア、イ", "E をふくむ面：エ", "=> (3) ア、イ、エ"],
    },
    {
      cap: "確かめ：正四面体の頂点には、面が**3つ**ずつ集まる。青い**ウ**（C, D, F）は、E＝A をふくまないから、ちがうね。",
      add: [netFill("ウ", BLUE, "nfillウ"), finFill("ウ", BLUE)],
      together: true,
      eq: ["// ウ は頂点 C, B(=D), F の面", "// E(=A) はふくまない → ウは×"],
    },
    {
      cap: "答え：**(1) 点D　(2) 辺DE　(3) ア・イ・エ**。重なる点は、色でそろえて追いかけると、まちがえないよ。",
      fin: true,
    },
  ],
};
