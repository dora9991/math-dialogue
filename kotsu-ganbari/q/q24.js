// 問24：立方体の展開図（辺ABと平行な面・面アと垂直な面）
// 展開図を 3 次元の座標で実際に折りたたんで、面の位置と向きを計算してから、動画にしている。
import { P, seg, poly, txt, oblique } from "../dsl.js";

// ── 3 次元の計算 ───────────────────────────────────
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => mul(a, 1 / len3(a));
const rnd = (a) => a.map((v) => Math.round(v * 1e6) / 1e6 + 0);
function rotAbout(p, a, u, th) {
  const v = sub(p, a), c = Math.cos(th), s = Math.sin(th);
  return add(a, add(add(mul(v, c), mul(cross3(u, v), s)), mul(u, dot3(u, v) * (1 - c))));
}

// 展開図（1 辺 1 の正方形 6 まい）。列 c（0〜3）・行 r（0〜2）。イ＝(1,1) を、ゆかの [0,1]×[0,1] に置く
const P3 = (u, v) => [u - 1, 2 - v, 0];                // 展開図の (u,v) → ゆかの上の点（x：右、y：おく）
const CELL = { ア: [0, 1], イ: [1, 1], ウ: [2, 1], エ: [3, 1], オ: [1, 0], カ: [3, 2] };
const FACES = {
  イ: {},
  ア: { parent: "イ", hinge: [P3(1, 1), P3(1, 2)], sgn: -1 },
  ウ: { parent: "イ", hinge: [P3(2, 1), P3(2, 2)], sgn: 1 },
  オ: { parent: "イ", hinge: [P3(1, 1), P3(2, 1)], sgn: 1 },
  エ: { parent: "ウ", hinge: [P3(3, 1), P3(3, 2)], sgn: 1 },    // エはウにつながる
  カ: { parent: "エ", hinge: [P3(3, 2), P3(4, 2)], sgn: -1 },   // カはエにつながる
};
// 折る向き sgn は、「6 つの面がぜんぶ 1×1×1 の箱の中におさまる」ように選んだ（下の検算で確かめる）
const corners = (f) => { const [c, r] = CELL[f]; return [P3(c, r), P3(c + 1, r), P3(c + 1, r + 1), P3(c, r + 1)]; }; // 左上・右上・右下・左下
function pose(t) {
  const out = {};
  for (const f of Object.keys(FACES)) {
    const chain = [];
    for (let c = f; FACES[c].parent; c = FACES[c].parent) chain.push(c);
    out[f] = corners(f).map((p) => {
      for (const g of chain) { const h = FACES[g].hinge; p = rotAbout(p, h[0], unit3(sub(h[1], h[0])), FACES[g].sgn * (Math.PI / 2) * (t[g] ?? 0)); }
      return rnd(p);
    });
  }
  return out;
}
const DONE = { ア: 1, ウ: 1, オ: 1, エ: 1, カ: 1 };
const FIN = pose(DONE);
const cenOf = (ps) => ps.reduce((s, p) => add(s, p), [0, 0, 0]).map((v) => v / ps.length);
const OUT = {};   // 各面の外向きの法線
for (const f of Object.keys(FIN)) {
  let nr = unit3(cross3(sub(FIN[f][1], FIN[f][0]), sub(FIN[f][3], FIN[f][0])));
  if (dot3(nr, sub(cenOf(FIN[f]), [0.5, 0.5, 0.5])) < 0) nr = mul(nr, -1);
  OUT[f] = rnd(nr);
}
const A3 = FIN.オ[0], B3 = FIN.オ[1];     // A＝オの左上、B＝オの右上
const dAB = unit3(sub(B3, A3));
// ── 検算（読みこむたびに実行。合わなければエラーにする）──
{
  for (const f of Object.keys(FIN)) for (const p of FIN[f]) if (p.some((v) => v < -1e-6 || v > 1 + 1e-6)) throw new Error("立方体にとじません：" + f);
  const cs = Object.keys(FIN).map((f) => cenOf(FIN[f]).map((v) => Math.round(v * 2) / 2).join(","));
  if (new Set(cs).size !== 6) throw new Error("面が6つに分かれません");
  const ok = (f) => { const ons = (p) => Math.abs(dot3(OUT[f], sub(p, cenOf(FIN[f])))) < 1e-9; return ons(A3) && ons(B3); };
  const parallel = Object.keys(FIN).filter((f) => Math.abs(dot3(OUT[f], dAB)) < 1e-9 && !ok(f));
  const perp = Object.keys(FIN).filter((f) => f !== "ア" && Math.abs(dot3(OUT[f], OUT["ア"])) < 1e-9);
  if (parallel.sort().join("") !== ["イ", "カ"].sort().join("")) throw new Error("(1) の検算が合いません：" + parallel);
  if (perp.sort().join("") !== ["イ", "エ", "オ", "カ"].sort().join("")) throw new Error("(2) の検算が合いません：" + perp);
}

// ── 色 ────────────────────────────────────────────
const BLUE = "#1f6fe0", PINK = "#d9488f";
const FC = { ア: "a", イ: BLUE, ウ: "y", エ: "b", オ: "p", カ: PINK };

// ── 展開図（左上・印刷物と同じ形）──────────────────────
const h = 44, X0 = 26, Y0 = 48;
const n2 = (u, v) => [X0 + u * h, Y0 + v * h];
const netPoly = (f, o) => { const [c, r] = CELL[f]; return poly([n2(c, r), n2(c + 1, r), n2(c + 1, r + 1), n2(c, r + 1)], o); };
const netBase = [
  poly([[1, 0], [2, 0], [2, 1], [4, 1], [4, 3], [3, 3], [3, 2], [0, 2], [0, 1], [1, 1]].map((q) => n2(...q)), { w: 2.4, id: "netO" }),
  seg(n2(1, 1), n2(1, 2), { dash: true }), seg(n2(2, 1), n2(2, 2), { dash: true }), seg(n2(3, 1), n2(3, 2), { dash: true }),
  seg(n2(1, 1), n2(2, 1), { dash: true }), seg(n2(3, 2), n2(4, 2), { dash: true }),
  P("nA", ...n2(1, 0), "A", "nw", { dot: false }), P("nB", ...n2(2, 0), "B", "ne", { dot: false }),
  ...Object.keys(CELL).map((f) => txt(n2(CELL[f][0] + 0.5, CELL[f][1] + 0.5)[0], n2(CELL[f][0] + 0.5, CELL[f][1] + 0.5)[1] + 5, f, { size: 16, id: "nt" + f })),
];
const netColors = Object.keys(CELL).map((f) => netPoly(f, { fill: FC[f], fo: 0.3, w: 0, id: "nc" + f }));
const netHi = (f, c, id) => netPoly(f, { fill: c, fo: 0.42, w: 0, id });
const netAB = () => seg(n2(1, 0), n2(2, 0), { c: "a", w: 5, base: true, id: "netAB" });

// ── 立体（斜投影）──────────────────────────────────
const S = 84, pr = oblique(118, 335, 0.5, 40);
const p3 = (p) => pr([p[0] * S, p[1] * S, p[2] * S]);
const polyOf = (f, FP) => FP[f].map(p3);
const cenS = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
// 折りぐあい t のとき（まだ組み立て中）
function poseEls(pre, t) {
  const PO = pose(t), els = [], ids = [];
  const push = (e) => { els.push(e); ids.push(e.id); return e; };
  for (const f of ["イ", "ア", "ウ", "オ", "エ", "カ"]) push(poly(polyOf(f, PO), { id: pre + "f" + f, fill: FC[f], fo: 0.3, c: "g", w: 1.8, base: true }));
  for (const f of ["イ", "ア", "ウ", "オ", "エ", "カ"]) { const c = cenS(polyOf(f, PO)); push(txt(c[0], c[1] + 5, f, { id: pre + "t" + f, size: 15, c: "g", base: true })); }
  return { els, ids };
}
// 組み立てた立方体（見えない辺は点線）
const viewDir = [-0.5 * Math.cos((40 * Math.PI) / 180), 1, -0.5 * Math.sin((40 * Math.PI) / 180)];
const VIS = {}; for (const f of Object.keys(FIN)) VIS[f] = dot3(OUT[f], viewDir) < -1e-9;
const EDGES = (() => {
  const m = new Map();
  for (const f of Object.keys(FIN)) FIN[f].forEach((a, i) => { const b = FIN[f][(i + 1) % 4], k = [a.join(), b.join()].sort().join("|"); const e = m.get(k) || { a, b, vis: false }; e.vis = e.vis || VIS[f]; m.set(k, e); });
  return [...m.values()];
})();
if (EDGES.length !== 12) throw new Error("辺が12本になりません");
function cubeEls(pre) {
  const els = [], ids = [];
  const push = (e) => { els.push(e); ids.push(e.id); return e; };
  for (const f of ["イ", "ア", "ウ", "オ", "エ", "カ"]) if (VIS[f]) push(poly(polyOf(f, FIN), { id: pre + "f" + f, fill: FC[f], fo: 0.3, w: 0, base: true }));   // 見える面だけぬる
  EDGES.forEach((e, i) => push(seg(p3(e.a), p3(e.b), { id: pre + "e" + i, c: "g", w: 2.2, dash: !e.vis, base: true })));
  for (const f of ["イ", "ア", "ウ", "オ", "エ", "カ"]) { const c = cenS(polyOf(f, FIN)); push(txt(c[0], c[1] + 5, f, { id: pre + "t" + f, size: VIS[f] ? 16 : 14, c: VIS[f] ? "g" : "k", base: true })); }
  return { els, ids };
}
const cubeFill = (f, c, id, fo = 0.42) => poly(polyOf(f, FIN), { fill: c, fo, w: 0, id });
const cubeLetter = (f, c, id) => { const ct = cenS(polyOf(f, FIN)); return txt(ct[0], ct[1] + 6, f, { id, size: 18, c, base: true }); };

const clr = (...a) => a.flatMap((x) => x.ids);
const T0 = { ア: 0, ウ: 0, オ: 0, エ: 0, カ: 0 };
const pose0 = poseEls("a", T0);
const pose1 = poseEls("b", { ...T0, ア: 0.7, ウ: 0.7, オ: 0.7 });
const pose2 = poseEls("c", { ...T0, ア: 1, ウ: 1, オ: 1 });
const pose3 = poseEls("d", { ...T0, ア: 1, ウ: 1, オ: 1, エ: 0.5 });
const pose4 = poseEls("e", { ...T0, ア: 1, ウ: 1, オ: 1, エ: 1 });
const pose5 = poseEls("f", { ...T0, ア: 1, ウ: 1, オ: 1, エ: 1, カ: 0.5 });
const cube = cubeEls("g");

// 位置の一覧（右上）
const place = [
  txt(268, 56, "組み立てた立方体の位置", { size: 15, anchor: "start", c: "k", base: true, id: "pl0" }),
  txt(268, 86, "下：イ　　上：エ", { size: 17, anchor: "start", base: true, id: "pl1" }),
  txt(268, 114, "左：ア　　右：ウ", { size: 17, anchor: "start", base: true, id: "pl2" }),
  txt(268, 142, "奥：オ　　手前：カ", { size: 17, anchor: "start", base: true, id: "pl3" }),
];
const plIds = place.map((e) => e.id);
const colorIds = Object.keys(CELL).map((f) => "nc" + f);
const cubeFillIds = ["ウ", "エ", "カ"].map((f) => "gf" + f);
const abOn3 = [
  seg(p3(A3), p3(B3), { c: "a", w: 5, base: true, id: "cAB" }),
  P("cA", ...p3(A3), "A", "nw", { c: "a", r: 5.5, base: true }), P("cB", ...p3(B3), "B", "ne", { c: "a", r: 5.5, base: true }),
];

const scene = {
  n: 24,
  title: "立方体の展開図と面の位置",
  problem: "右の図は、立方体の展開図です。この展開図を組み立てて立方体をつくるとき、次のようになる面をすべて答えなさい。\n(1) 辺ABと平行になる面\n(2) 面アと垂直になる面",
  answer: "(1) 面イ、面カ　(2) 面イ、面エ、面オ、面カ",
  view: [0, 0, 520, 380],
  steps: [
    {
      cap: "立方体の展開図だよ。組み立てたとき、**辺ABと平行な面**と、**面アと垂直な面**を答えよう。",
      add: netBase,
    },
    {
      cap: "立方体の1つの面には、**向かい合う面が1つ**（平行）と、**となり合う面が4つ**（垂直）があるよ。",
      eq: ["## 立方体の面", "面は 6こ", "向かい合う面 … 1こ（平行）", "となり合う面 … 4こ（垂直）"],
    },
    {
      cap: "どの面がどこにいくか、追いかけやすいように、面に色をつけるよ。",
      add: netColors,
      together: true,
    },
    {
      cap: "① **イを底**（ゆか）に置くよ。ほかの面は、イのまわりに平らにのっているね。",
      add: pose0.els,
      together: true,
      eq: ["## 折り方の順", "① イ を底に置く"],
    },
    {
      cap: "② イのとなりの **ア・ウ・オ** を、折り目で起こしていくよ。",
      hide: clr(pose0),
      add: pose1.els,
      together: true,
      eq: ["② ア・ウ・オ を起こす"],
    },
    {
      cap: "ア・ウ・オが立って、イのまわりを3つの面がかこんだよ。**ア＝左、ウ＝右、オ＝奥**だね。",
      hide: clr(pose1),
      add: pose2.els,
      together: true,
      eq: ["　ア ＝ 左　ウ ＝ 右　オ ＝ 奥"],
    },
    {
      cap: "③ ウにくっついている**エ**を、上にかぶせるよ。",
      hide: clr(pose2),
      add: pose3.els,
      together: true,
      eq: ["③ エ を上にかぶせる"],
    },
    {
      cap: "エが**ふた**（上の面）になったね。イの真上、向かい合う面だよ。",
      hide: clr(pose3),
      add: pose4.els,
      together: true,
      eq: ["　エ ＝ 上（イと向かい合う）"],
    },
    {
      cap: "④ エの手前の辺にくっついている**カ**を、手前に折りおろすよ。",
      hide: clr(pose4),
      add: pose5.els,
      together: true,
      eq: ["④ カ を手前に折る"],
    },
    {
      cap: "カが**手前の面**になって、立方体のできあがり！ 6つの面の位置が、全部わかったね。",
      hide: clr(pose5),
      add: [...cube.els, ...place],
      together: true,
      eq: ["　カ ＝ 手前（オと向かい合う）", "=> 下イ 上エ 左ア 右ウ 奥オ 手前カ"],
    },
    {
      cap: "展開図の辺ABは、オの上の辺。組み立てると、**上の奥の辺**（オとエの境目）になるよ。",
      add: [netAB(), ...abOn3],
      together: true,
      eq: ["// 辺AB ＝ オとエの境目"],
    },
    {
      cap: "(1) 辺ABと**平行**な面は、辺ABをふくまず、ぶつからない面。**イ（下）と カ（手前）**だね。",
      hide: [...colorIds, ...cubeFillIds],
      add: [netHi("イ", "a", "hiI"), netHi("カ", "a", "hiK"), cubeFill("イ", "a", "chiI"), cubeFill("カ", "a", "chiK")],
      together: true,
      eqClear: true,
      eq: ["## (1) 辺ABと平行な面", "辺ABは「上の奥」にある", "下の面 … イ", "手前の面 … カ", "=> (1) 面イ、面カ"],
    },
    {
      cap: "確かめ：ABをふくむ面は**オ・エ**、ABの両はしでぶつかる面は**ア・ウ**。のこりの**イ・カ**が平行だね。",
      hide: ["gtオ", "gtア"],
      add: [netHi("オ", "y", "hy1"), netHi("エ", "y", "hy2"), netHi("ア", BLUE, "hb1"), netHi("ウ", BLUE, "hb2"),
        cubeFill("エ", "y", "cy2", 0.38), cubeFill("ウ", BLUE, "cb2", 0.3), cubeLetter("オ", "y", "lO1"), cubeLetter("ア", BLUE, "lA1")],
      together: true,
      eq: ["// ABをふくむ：オ、エ（黄）", "// ABとぶつかる：ア、ウ（青）", "// のこり：イ、カ（赤）→ 平行"],
    },
    {
      cap: "(2) **面ア**は、左の面。向かい合う**ウ**（右の面）が平行で、ほかの4つが垂直だよ。",
      hide: ["hy1", "hy2", "hb1", "hb2", "hiI", "hiK", "chiI", "chiK", "cy2", "cb2", "lO1", "lA1", "netAB", "cAB", "cA", "cB", "gtイ", "gtウ", "gtエ", "gtカ"],
      add: [netHi("ア", "a", "gA"), netHi("ウ", "k", "gU"), netHi("イ", "b", "gI"), netHi("エ", "b", "gE"), netHi("オ", "b", "gO"), netHi("カ", "b", "gK"),
        cubeFill("ア", "a", "dA", 0.45), cubeFill("ウ", "k", "dU", 0.3),
        cubeLetter("ア", "a", "lA2"), cubeLetter("ウ", "k", "lU2"), cubeLetter("イ", "b", "lI2"), cubeLetter("エ", "b", "lE2"), cubeLetter("オ", "b", "lO2"), cubeLetter("カ", "b", "lK2")],
      together: true,
      eqClear: true,
      eq: ["## (2) 面アと垂直な面", "ア ＝ 左の面", "向かい合う … ウ（平行）", "となり合う … イ、エ、オ、カ", "=> (2) 面イ、面エ、面オ、面カ"],
    },
    {
      cap: "確かめ：イ・エ・オ・カは、どれも面アと**辺でつながり**、折り目が直角（90°）。ウだけは、イをはさんで向かい合う平行な面だね。",
      eq: ["// 箱の座標で確かめ（1×1×1）", "// ア：左の面（x＝0）、ウ：右の面（x＝1）→ 平行", "// イ：z＝0　エ：z＝1　オ：y＝1　カ：y＝0", "// → どれも x＝0 の面と垂直"],
    },
    {
      cap: "答え：**(1) 面イ・面カ　(2) 面イ・面エ・面オ・面カ**。折って、どの位置の面か追いかけるのがコツだよ。",
      fin: true,
    },
  ],
};
// 図が一度に出るコマ（together）は、字幕を読む長さにそろえる（自動のままだと長すぎる）
for (const st of scene.steps) if (st.together && !st.dur) st.dur = 1800 + st.cap.length * 100 + (st.eq || []).length * 350;
export default scene;
