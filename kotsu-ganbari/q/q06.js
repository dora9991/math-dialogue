// 問6：正方形を8等分した直角二等辺三角形と回転移動
import { P, seg, poly, arc, rt, txt, arrow, geo, polar } from "../dsl.js";

// ── 図の座標 ───────────────────────────────────
// 数学の座標（x 右、y 上）で正方形 [-1,1]×[-1,1]。画面には 1 = 120px、中心 (200,150) でうつす。
const S = ([x, y]) => [200 + 120 * x, 150 - 120 * y];
const V = { TL: [-1, 1], TM: [0, 1], TR: [1, 1], ML: [-1, 0], O: [0, 0], MR: [1, 0], BL: [-1, -1], BM: [0, -1], BR: [1, -1] };
// 8つの三角形（印刷物の図と同じ位置）。ra ＝直角の頂点
const T = {
  ア: { v: ["TL", "TM", "O"], ra: "TM" }, ク: { v: ["TM", "TR", "O"], ra: "TM" },
  キ: { v: ["TR", "MR", "O"], ra: "MR" }, カ: { v: ["MR", "BR", "O"], ra: "MR" },
  オ: { v: ["BR", "BM", "O"], ra: "BM" }, エ: { v: ["BM", "BL", "O"], ra: "BM" },
  ウ: { v: ["BL", "ML", "O"], ra: "ML" }, イ: { v: ["ML", "TL", "O"], ra: "ML" },
};
const names = Object.keys(T);
const pts = (n) => T[n].v.map((k) => S(V[k]));                         // 三角形の頂点（画面座標）
const cen = (n) => { const p = pts(n); return [(p[0][0] + p[1][0] + p[2][0]) / 3, (p[0][1] + p[1][1] + p[2][1]) / 3]; };

// ── 検算（JS）──────────────────────────────────
// 方法1：中心を 0.5 きざみの格子（-3〜3）で、角を指定して回し、頂点の集まりが一致する三角形を数える。
// 方法2：「直角の頂点から斜辺の真ん中へ向かう向き」のちがいで、回転の角を出す。
const ok = (c, m) => { if (!c) throw new Error("検算NG：" + m); };
const same = (a, b) => a.length === b.length && a.every((p) => b.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6));
const lattice = []; for (let x = -3; x <= 3; x += 0.5) for (let y = -3; y <= 3; y += 0.5) lattice.push(S([x, y]));
const reach = (src, degs, centers) => {
  const out = new Set();
  for (const c of centers) for (const d of degs) {
    const img = pts(src).map((p) => geo.rot(p, c, d));
    for (const n of names) if (n !== src && same(img, pts(n))) out.add(n);
  }
  return [...out].sort().join("");
};
const sorted = (s) => [...s].sort().join("");
const Oc = S(V.O);
const allAng = []; for (let a = 15; a < 360; a += 15) allAng.push(a);
// 中心はどこでもよい
ok(reach("ア", [180], lattice) === sorted("イオ"), "(1) 中心自由");
ok(reach("ア", [90, 270], lattice) === sorted("ウエキク"), "(2) 中心自由");
ok(reach("イ", allAng, lattice) === sorted("アウエカキク"), "(3) 中心自由（オは入らない）");
// 中心＝点O
ok(reach("ア", [180], [Oc]) === sorted("オ"), "(1) 中心O");
ok(reach("ア", [90, 270], [Oc]) === sorted("ウキ"), "(2) 中心O");
ok(reach("イ", allAng, [Oc]) === sorted("エカク"), "(3) 中心O");
// 向き（方法2）：直角の頂点→斜辺の中点
const orient = {};
for (const n of names) {
  const ra = S(V[T[n].ra]), o = T[n].v.filter((k) => k !== T[n].ra).map((k) => S(V[k]));
  const m = geo.mid(o[0], o[1]);
  orient[n] = Math.round(((Math.atan2(-(m[1] - ra[1]), m[0] - ra[0]) * 180) / Math.PI + 360) % 360);
}
const diff = (s, d) => (orient[d] - orient[s] + 360) % 360;
ok(["イ", "オ"].every((n) => diff("ア", n) === 180) && names.filter((n) => diff("ア", n) === 180).length === 2, "向き：180°");
ok(names.filter((n) => diff("ア", n) === 90 || diff("ア", n) === 270).sort().join("") === sorted("ウエキク"), "向き：90°");
ok(names.filter((n) => n !== "イ" && diff("イ", n) !== 0).sort().join("") === sorted("アウエカキク") && diff("イ", "オ") === 0, "向き：(3)");
// 図で使う「中心と角」が、ほんとうに重なるか
const R_ = S([-0.5, 0.5]), P_ = S(V.TM), Q_ = S(V.ML);
const chk = (src, c, deg, dst) => ok(same(pts(src).map((p) => geo.rot(p, c, deg)), pts(dst)), `${src}→${dst}`);
chk("ア", Oc, 180, "オ"); chk("ア", R_, 180, "イ");
chk("ア", Oc, 90, "ウ"); chk("ア", Oc, -90, "キ"); chk("ア", P_, 90, "ク"); chk("ア", Q_, -90, "エ");
chk("イ", Oc, 90, "エ"); chk("イ", Oc, 180, "カ"); chk("イ", Oc, -90, "ク");
chk("イ", R_, 180, "ア"); chk("イ", P_, 90, "キ"); chk("イ", Q_, -90, "ウ");

// ── 図の部品 ───────────────────────────────────
const GC = { LL: "b", LR: "#c0409a", UR: "#2a7fd4", UL: "y" };                      // □の向きの組ごとの色
const grp = (n) => ({ 225: "LL", 315: "LR", 45: "UR", 135: "UL" })[orient[n]];
const fillT = (n, col, id, w = 2.5) => poly(pts(n), { id, fill: col, c: col, w });
const mark = (n) => rt(S(V[T[n].ra]), ...T[n].v.filter((k) => k !== T[n].ra).map((k) => S(V[k])), { id: "m_" + n, s: 20, w: 2.6, c: GC[grp(n)] });

// 回転の矢印：中心 ctr のまわりに、半径 r、角 a0 から delta 度（正＝反時計まわり）。id+"_a/_h/_t" の3つ。
function rarrow(id, ctr, r, a0, delta, label, lab, t0 = 0, col = "a") {
  const e = a0 + delta, tip = polar(ctr, r, e);
  const dir = delta > 0 ? [-Math.sin((e * Math.PI) / 180), -Math.cos((e * Math.PI) / 180)] : [Math.sin((e * Math.PI) / 180), Math.cos((e * Math.PI) / 180)];
  const bs = [tip[0] - 11 * dir[0], tip[1] - 11 * dir[1]], nx = -dir[1], ny = dir[0];
  const head = [tip, [bs[0] + 5.5 * nx, bs[1] + 5.5 * ny], [bs[0] - 5.5 * nx, bs[1] - 5.5 * ny]];
  const out = [
    delta > 0 ? arc(ctr, r, a0, e, { id: id + "_a", c: col, w: 3, d: t0 }) : arc(ctr, r, e, a0, { id: id + "_a", c: col, w: 3, d: t0 }),
    poly(head, { id: id + "_h", c: col, fill: col, fo: 1, w: 1, d: t0 + 850 }),
  ];
  out.push(txt(lab ? lab[0] : 0, lab ? lab[1] : 0, label || "", { id: id + "_t", size: 16, c: col, d: t0 + 1000 }));
  return out;
}
const aid = (...xs) => xs.flatMap((x) => [x + "_a", x + "_h", x + "_t"]);
const ang0 = (ctr, n) => { const c = cen(n); return (Math.atan2(-(c[1] - ctr[1]), c[0] - ctr[0]) * 180) / Math.PI; };   // 中心から三角形の重心を見た向き
const LSH = { ア: [6, -4], イ: [-6, 4] };   // 名前の位置を、ほんの少しずらす（点Rの文字とぶつからないように）
const cenP = (id, x, y, l, pos, o = {}) => P(id, x, y, l, pos, { c: "a", r: 4.2, ...o });

export default {
  n: 6,
  title: "正方形の8等分と回転移動",
  problem: "右の図は、正方形を8等分して、合同な直角二等辺三角形(ア)〜(ク)に分けたものです。\n(1) (ア)の三角形を180°回転移動させて重ねることができる三角形をすべて答えなさい。\n(2) (ア)の三角形を90°回転移動させて重ねることができる三角形をすべて答えなさい。\n(3) (イ)の三角形を1回だけ回転移動させて重ねることができる三角形((イ)をのぞく)をすべて答えなさい。",
  answer: "【回転の中心はどこでもよい場合】\n(1) (イ)、(オ)　(2) (ウ)、(エ)、(キ)、(ク)　(3) (ア)、(ウ)、(エ)、(カ)、(キ)、(ク)\n【図の真ん中の点Oを中心に回す場合】\n(1) (オ)　(2) (ウ)、(キ)　(3) (エ)、(カ)、(ク)",
  view: [0, 0, 400, 300],
  steps: [
    {
      cap: "正方形を、合同な直角二等辺三角形 8 つに分けた図だよ。(ア) を**回転移動**させて、ぴったり重なる三角形を探す問題だね。",
      dur: 8500,
      add: [
        poly([S(V.TL), S(V.TR), S(V.BR), S(V.BL)], { id: "sq" }),
        seg(S(V.TL), S(V.BR), { id: "d1" }), seg(S(V.TR), S(V.BL), { id: "d2" }),
        seg(S(V.TM), S(V.BM), { id: "vl" }), seg(S(V.ML), S(V.MR), { id: "hl" }),
        ...names.map((n) => txt(cen(n)[0] + (LSH[n] || [0, 0])[0], cen(n)[1] + 5 + (LSH[n] || [0, 0])[1], `(${n})`, { id: "lab_" + n, size: 16 })),
      ],
    },
    {
      cap: "注意！ 問題には、回転の**中心**も**向き**も書いてないよ。だから、まず「**中心はどこでもよい**」と考えるよ。点O（図の真ん中）が中心の場合は、あとで別に答えるね。",
      dur: 12500,
      add: [P("O", Oc[0], Oc[1], "O", "ne", { dx: 20, dy: -4, c: "g" })],
      eq: ["## 問題の読みとり", "中心：書いていない → どこでもよい", "向き：書いていない → どちらもOK", "回転移動は 1 回だけ", "// 点O（図の真ん中）が中心の場合は、あとで別に答える"],
    },
    {
      cap: "回転移動は、**形はそのままで、向きだけ**が回した角度ぶん変わるよ。向きは、直角の印 **□** がどちらを向くかで見分けよう。",
      dur: 11500,
      add: names.map(mark),
      eq: ["## □の向き（同じ色＝同じ向き）", "左下向き：(ア)(カ)", "右下向き：(ウ)(ク)", "右上向き：(イ)(オ)", "左上向き：(エ)(キ)"],
    },
    {
      cap: "(1) **180°** 回すと、向きは**まうしろ**になるよ。(ア) の□は左下向きだから、まうしろの**右上向き**、(イ) と (オ) が候補だね。",
      dur: 11500,
      eqClear: true,
      add: [fillT("ア", "p", "srcA"), fillT("イ", "y", "c_イ"), fillT("オ", "y", "c_オ")],
      eq: ["## (1) 180°", "(ア) の□：左下向き", "180° 回す → 右上向き", "候補：(イ)(オ)"],
    },
    {
      cap: "**点O を中心**に 180° 回すと、(ア) は **(オ)** にぴったり重なるね。",
      dur: 7500,
      hide: ["c_オ"],
      add: [fillT("オ", "a", "r_オ"), ...rarrow("a1", Oc, 40, ang0(Oc, "ア"), 180, null, null, 300)],
      eq: ["中心 O、180° → (オ) ○"],
    },
    {
      cap: "中心をずらしてもいいなら、(イ) にも重なるよ。(ア)と(イ)の共通の斜辺の**真ん中の点R** を中心に 180° 回すんだ。だから (1) の答えは **(イ) と (オ)**。",
      dur: 13000,
      hide: [...aid("a1"), "c_イ"],
      add: [cenP("R", R_[0], R_[1], "R", "e", { dx: 11, dy: 7 }), fillT("イ", "a", "r_イ"), ...rarrow("a2", R_, 19, ang0(R_, "ア"), 180, null, null, 400)],
      eq: ["中心 R、180° → (イ) ○", "=> (1) (イ)、(オ)", "// 点Oを中心に決めると (オ) だけ", "// 中心は、対応する点を結ぶ線分の垂直二等分線の交点"],
    },
    {
      cap: "(2) **90°** 回すと、向きが90°かわるよ。(ア) の□は左下向き。反時計まわりなら**右下向き**、時計まわりなら**左上向き**になるね。",
      dur: 11500,
      eqClear: true,
      hide: [...aid("a2"), "R", "r_イ", "r_オ"],
      add: [fillT("ウ", "y", "c_ウ"), fillT("ク", "y", "c_ク"), fillT("エ", "y", "c_エ"), fillT("キ", "y", "c_キ")],
      eq: ["## (2) 90°", "反時計まわり90° → 右下向き：(ウ)(ク)", "時計まわり90° → 左上向き：(エ)(キ)", "// 向きは書いてないので、両方OK"],
    },
    {
      cap: "**点O を中心**にすると、反時計まわり 90° で **(ウ)**、時計まわり 90° で **(キ)** に重なるよ。",
      dur: 9500,
      hide: ["c_ウ", "c_キ"],
      add: [fillT("ウ", "a", "r_ウ"), fillT("キ", "a", "r_キ"),
        ...rarrow("b1", Oc, 46, ang0(Oc, "ア"), 90, null, null, 300),
        ...rarrow("b2", Oc, 46, ang0(Oc, "ア"), -90, null, null, 1500)],
      eq: ["中心 O、反時計 90° → (ウ) ○", "中心 O、時計 90° → (キ) ○"],
    },
    {
      cap: "中心をずらすと、(ク) と (エ) にも重なるよ。**P**（上の辺の真ん中）で反時計 90° → (ク)、**Q**（左の辺の真ん中）で時計 90° → (エ)。",
      dur: 12500,
      hide: [...aid("b1", "b2"), "c_ク", "c_エ"],
      add: [cenP("P", P_[0], P_[1], "P", "n"), cenP("Q", Q_[0], Q_[1], "Q", "w"), fillT("ク", "a", "r_ク"), fillT("エ", "a", "r_エ"),
        ...rarrow("b3", P_, 36, ang0(P_, "ア"), 90, null, null, 300), ...rarrow("b4", Q_, 36, ang0(Q_, "ア"), -90, null, null, 1500)],
      eq: ["中心 P、反時計 90° → (ク) ○", "中心 Q、時計 90° → (エ) ○", "=> (2) (ウ)、(エ)、(キ)、(ク)", "// 点Oを中心に決めると (ウ)(キ) だけ"],
    },
    {
      cap: "(3) (イ) を**1回だけ**回転移動。(イ) の□は右上向き。□の向きが**ちがう**三角形は、中心をうまく選べば回転で重ねられるよ。",
      dur: 11500,
      eqClear: true,
      hide: [...aid("b3", "b4"), "P", "Q", "srcA", "r_ウ", "r_エ", "r_キ", "r_ク"],
      add: [fillT("イ", "p", "srcI"), ...["ア", "ウ", "エ", "カ", "キ", "ク"].map((n) => fillT(n, "y", "d_" + n))],
      eq: ["## (3) (イ) を1回だけ回転", "(イ) の□：右上向き", "向きがちがう6つが候補：", "(ア)(ウ)(エ)(カ)(キ)(ク)"],
    },
    {
      cap: "**点O を中心**にすると、反時計 90° で **(エ)**、180° で **(カ)**、時計 90° で **(ク)** に重なるよ。",
      dur: 10500,
      hide: ["d_エ", "d_カ", "d_ク"],
      add: [fillT("エ", "a", "r3_エ"), fillT("カ", "a", "r3_カ"), fillT("ク", "a", "r3_ク"),
        ...rarrow("c1", Oc, 34, ang0(Oc, "イ"), 90, null, null, 300),
        ...rarrow("c2", Oc, 52, ang0(Oc, "イ"), 180, null, null, 1300),
        ...rarrow("c3", Oc, 34, ang0(Oc, "イ"), -90, null, null, 2600)],
      eq: ["中心 O：反時計 90° → (エ) ○", "中心 O：180° → (カ) ○", "中心 O：時計 90° → (ク) ○"],
    },
    {
      cap: "中心をずらすと、(ア)(キ)(ウ) にも重なるよ。**R** で 180° → (ア)、**P** で反時計 90° → (キ)、**Q** で時計 90° → (ウ)。",
      dur: 12500,
      hide: [...aid("c1", "c2", "c3"), "d_ア", "d_キ", "d_ウ"],
      add: [cenP("R3", R_[0], R_[1], "R", "e", { dx: 11, dy: 7 }), cenP("P3", P_[0], P_[1], "P", "n"), cenP("Q3", Q_[0], Q_[1], "Q", "w"),
        fillT("ア", "a", "r3_ア"), fillT("キ", "a", "r3_キ"), fillT("ウ", "a", "r3_ウ"),
        ...rarrow("c4", R_, 19, ang0(R_, "イ"), -180, null, null, 300),
        ...rarrow("c5", P_, 36, ang0(P_, "イ"), 90, null, null, 1300),
        ...rarrow("c6", Q_, 36, ang0(Q_, "イ"), -90, null, null, 2300)],
      eq: ["中心 R：180° → (ア) ○", "中心 P：反時計 90° → (キ) ○", "中心 Q：時計 90° → (ウ) ○"],
    },
    {
      cap: "(オ) は (イ) と**同じ向き**。向きがちがわないと、回転では重ならないよ。そのまま**平行移動**するだけだから、(オ) は答えに入れないんだ。",
      dur: 11500,
      hide: [...aid("c4", "c5", "c6"), "R3", "P3", "Q3"],
      add: [fillT("オ", "k", "x_オ"), arrow(R_, S([0.5, -0.5]), { id: "tr", c: "k", dash: true, w: 3 }), txt(250, 170, "平行移動", { id: "trt", size: 16, c: "k" }),
        txt(268, 252, "×", { id: "trx", size: 28, c: "a" })],
      eq: ["(オ) は (イ) と同じ向き → 平行移動 ✕", "=> (3) (ア)、(ウ)、(エ)、(カ)、(キ)、(ク)", "// 点Oを中心に決めると (エ)(カ)(ク) だけ"],
    },
    {
      cap: "答えをまとめるよ。**中心はどこでもよい**ときと、**点Oが中心**のときの 2 通りを、しっかり区別しておこう。",
      dur: 11000,
      clear: true,
      eqClear: true,
      add: [P("O", Oc[0], Oc[1], "O", "ne", { dx: 20, dy: -4, c: "g" })],
      eq: ["## 中心はどこでもよい", "(1) (イ)、(オ)", "(2) (ウ)、(エ)、(キ)、(ク)", "(3) (ア)、(ウ)、(エ)、(カ)、(キ)、(ク)", "## 点O を中心に回す", "(1) (オ)　(2) (ウ)、(キ)　(3) (エ)、(カ)、(ク)"],
      fin: true,
    },
  ],
};
