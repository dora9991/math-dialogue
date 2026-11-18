// 問17：平面がただ1つに決まる条件（ア）〜（エ）
import { P, seg, line, poly, txt, geo } from "../dsl.js";

// ── 検算（JS）──────────────────────────────────
// 方法1：平面 ax+by+cz+d=0 の係数 (a,b,c,d) が、すべての点を通る条件の連立方程式の「自由度」を数える。
//   自由度 1 → 平面がただ1つ、2以上 → 平面が無数、0 → 平面がない。
// 方法2：点全体が作る「広がり」の次元（差ベクトルの階数）。次元が 2 ならただ1つ、1（直線）なら無数、3（空間）ならない。
const rank = (rows) => {
  const m = rows.map((r) => r.slice());
  let rk = 0;
  for (let c = 0; c < (m[0] || []).length && rk < m.length; c++) {
    let piv = -1, best = 1e-9;
    for (let r = rk; r < m.length; r++) if (Math.abs(m[r][c]) > best) { best = Math.abs(m[r][c]); piv = r; }
    if (piv < 0) continue;
    [m[rk], m[piv]] = [m[piv], m[rk]];
    for (let r = 0; r < m.length; r++) if (r !== rk) { const f = m[r][c] / m[rk][c]; for (let k = c; k < m[r].length; k++) m[r][k] -= f * m[rk][k]; }
    rk++;
  }
  return rk;
};
const freedom = (pts) => 4 - rank(pts.map(([x, y, z]) => [x, y, z, 1]));                   // 方法1
const spanDim = (pts) => rank(pts.slice(1).map((p) => p.map((v, i) => v - pts[0][i])));     // 方法2
const verdict = (pts) => { const f = freedom(pts), d = spanDim(pts); const one = f === 1, many = f >= 2, none = f === 0; return { f, d, one, many, none, agree: (d === 2) === one && (d === 1) === many && (d === 3) === none }; };
const ok = (c, m) => { if (!c) throw new Error("検算NG：" + m); };
const add3 = (a, b, k = 1) => a.map((v, i) => v + k * b[i]);
{
  const A = [0, 0, 0], B = [1, 2, 3];
  const r1 = verdict([A, B]);                                                                      // (ア) 2点
  ok(r1.many && r1.agree, "(ア) は無数");
  const C = [4, -1, 2];
  const r2 = verdict([A, B, C]);                                                                   // (イ) 同じ直線上にない3点
  ok(r2.one && r2.agree, "(イ) は1つ");
  ok(verdict([A, B, add3(A, add3(B, A, -1), 3)]).many, "一直線上の3点は無数");
  const d = [2, 1, 0], Q = [0, 0, 5];                                                              // (ウ) 平行な2直線：A+td と Q+td
  const r3 = verdict([A, add3(A, d), Q, add3(Q, d)]);
  ok(r3.one && r3.agree, "(ウ) は1つ");
  const d1 = [1, 0, 0], d2 = [1, 1, 2];                                                            // (エ) 交わる2直線：A+t d1 と A+s d2
  const r4 = verdict([A, add3(A, d1), add3(A, d2)]);
  ok(r4.one && r4.agree, "(エ) は1つ");
  const sk = verdict([A, add3(A, [1, 0, 0]), [0, 1, 1], add3([0, 1, 1], [0, 1, 0])]);                // 参考：ねじれの位置の2直線は平面がない
  ok(sk.none && sk.agree, "ねじれは平面なし");
}

// ── 図の部品 ───────────────────────────────────
const plane = (corners, col, id, extra = {}) => poly(corners, { id, fill: col, c: col, w: 2.5, ...extra });
// 机の上の板のような平面（斜めから見た平行四辺形）
const TB = [[60, 235], [310, 235], [355, 120], [105, 120]];
// 水平な向きの線は、y が決まると、平面の左右のはしの x が決まる
const edgeX = (y) => [TB[0][0] + ((TB[0][1] - y) / (TB[0][1] - TB[3][1])) * (TB[3][0] - TB[0][0]), TB[1][0] + ((TB[1][1] - y) / (TB[1][1] - TB[3][1])) * (TB[2][0] - TB[1][0])];
const title = (s) => txt(14, 30, s, { id: "ttl", size: 18, anchor: "start", c: "g" });

// 軸（たて線）のまわりに回した平面：軸の x 座標 ax、上 y0、下 y1。向き phi（度）。
const hinge = (ax, y0, y1, phi, w, col, id) => {
  const r = (phi * Math.PI) / 180, hx = w * (Math.cos(r) + 0.383 * Math.sin(r)), hy = -w * 0.321 * Math.sin(r);
  return plane([[ax - hx, y0 - hy], [ax + hx, y0 + hy], [ax + hx, y1 + hy], [ax - hx, y1 - hy]], col, id, { fo: 0.2, w: 2 });
};

// (ウ) 平行な2直線
const lY = 205, mY = 145;                                   // ℓ, m の高さ
const [lL, lR] = edgeX(lY), [mL, mR] = edgeX(mY);
const lA = [130, lY], lB = [250, lY], mC = [190, mY];       // ℓ 上に A, B、m 上に C
// (エ) 交わる2直線
const Pt = [210, 175];
const dl = [1, -0.25], dm = [0.45, 1];
const l2a = geo.add(Pt, geo.mul(dl, -150)), l2b = geo.add(Pt, geo.mul(dl, 150));
const m2a = geo.add(Pt, geo.mul(dm, -62)), m2b = geo.add(Pt, geo.mul(dm, 62));
const eA = geo.add(Pt, geo.mul(dl, -80)), eB = geo.add(Pt, geo.mul(dm, 45));
// 図が平面（平行四辺形）の中に入っているか
const inTB = (p) => { const [l, r] = edgeX(p[1]); return p[1] > TB[3][1] && p[1] < TB[0][1] && p[0] > l && p[0] < r; };
ok([lA, lB, mC, eA, eB, Pt].every(inTB), "図の点・線が平面の中にある");
ok(Math.abs(geo.interLL(l2a, l2b, m2a, m2b)[0] - Pt[0]) < 1e-9, "ℓ と m の交点は P");

// 軸（たて線 x=200、上 y=45〜下 y=265）のまわりに回した3まいの平面（色ちがい）
let hingeN = 0;
function hingeFix(i) {
  const cfg = [[10, "b"], [65, "y"], [125, "p"]][i];
  return hinge(200, 70, 262, cfg[0], 72, cfg[1], "hinge" + ++hingeN);
}

export default {
  n: 17,
  title: "平面が1つに決まる条件",
  problem: "次の(ア)〜(エ)のうち、平面がただ1つに決定するものをすべて選びなさい。\n(ア) 2点をふくむ平面。\n(イ) 同じ直線上にない3点をふくむ平面。\n(ウ) 平行な2直線をふくむ平面。\n(エ) 交わる2直線をふくむ平面。",
  answer: "(イ)、(ウ)、(エ)\n（(ア) 2点では、平面は1つに決まらない）",
  view: [0, 0, 400, 300],
  steps: [
    {
      cap: "平面が**ただ1つに決まる**のはどれか、(ア)〜(エ)から選ぶ問題だよ。平面は、**動かせる下じき（板）**のイメージで考えよう。",
      add: [plane(TB, "#cfe8e0", "bp", { fo: 1, c: "g" }), txt(210, 200, "平面", { id: "bpt", size: 20, c: "g" })],
    },
    {
      cap: "条件に合う下じきが**ぐらぐら動く**なら、平面は1つに決まらない（×）。**ぴたっと止まる**なら、1つに決まる（○）よ。",
      hl: ["bp"],
      eq: ["## 考え方", "ぐらぐら動く → 決まらない ✕", "ぴたっと止まる → 1つに決まる ○"],
    },
    {
      cap: "(ア) **2点 A, B** をふくむ平面。A と B を通るように、下じきを1まい置いてみるよ。",
      hide: ["bp", "bpt"],
      add: [title("(ア) 2点をふくむ平面"), hingeFix(0), seg([200, 56], [200, 280], { id: "poleA", c: "g", w: 2 }), P("A", 200, 120, "A", "e", { c: "g" }), P("B", 200, 215, "B", "e", { c: "g" })],
      eq: ["## (ア) 2点", "2点 A, B をふくむ平面を置く"],
    },
    {
      cap: "AB を軸にして、下じきをくるっと回してみよう。A, B はふくまれたまま、平面が**いくつでも**できるね。",
      add: [hingeFix(1), hingeFix(2), seg([200, 56], [200, 280], { id: "poleA2", c: "g", w: 2 })],
      eq: ["回すと、平面がいくつもできる", "=> (ア) ✕（1つに決まらない）"],
    },
    {
      cap: "(イ) **同じ直線上にない3点 A, B, C**。3点を結ぶと、三角形ができるよ。",
      clear: true,
      eqClear: true,
      add: [title("(イ) 同じ直線上にない3点"), P("A", 115, 205, "A", "w", { c: "g" }), P("B", 255, 212, "B", "se", { c: "g" }), P("C", 225, 145, "C", "n", { c: "g" }),
        seg("A", "B", { c: "k", dash: true }), seg("B", "C", { c: "k", dash: true }), seg("C", "A", { c: "k", dash: true })],
      eq: ["## (イ) 同じ直線上にない3点", "3点を結ぶと三角形"],
    },
    {
      cap: "この三角形をのせる下じきは、**1まいだけ**。ぴたっと止まって、ぐらぐらしないね。だから (イ) は○だよ。",
      add: [plane(TB, "b", "pl2", { c: "b" })],
      eq: ["三角形をのせる平面は1つだけ", "=> (イ) ○"],
    },
    {
      cap: "ひっかけ！ もし3点が**一直線上**にあると、(ア)と同じで、軸のまわりに回せて決まらないよ。「同じ直線上にない」が大事！",
      clear: true,
      add: [title("3点が一直線上にあると…"), hingeFix(0), hingeFix(2), seg([200, 56], [200, 280], { c: "g", w: 2 }), P("A", 200, 105, "A", "e", { c: "g" }), P("B", 200, 165, "B", "e", { c: "g" }), P("C", 200, 225, "C", "e", { c: "g" })],
      eq: ["// 一直線上の3点 → 平面は決まらない ✕"],
    },
    {
      cap: "(ウ) **平行な2直線 ℓ, m**。この2本を、まとめてのせられる下じきはどうかな？",
      clear: true,
      eqClear: true,
      add: [title("(ウ) 平行な2直線"), seg([lL - 8, lY], [lR + 8, lY], { id: "lw", c: "g", w: 2.4 }), seg([mL - 8, mY], [mR + 8, mY], { id: "mw", c: "g", w: 2.4 }),
        txt(lR + 26, lY + 7, "ℓ", { size: 20, c: "g" }), txt(mR + 26, mY + 7, "m", { size: 20, c: "g" })],
      eq: ["## (ウ) 平行な2直線", "ℓ ∥ m"],
    },
    {
      cap: "ℓ 上に2点 A, B、m 上に1点 C をとると、**同じ直線上にない3点**になるね。だから (イ) と同じで、平面は**1つだけ**。(ウ) は○！",
      add: [P("A", lA[0], lA[1], "A", "s", { c: "g" }), P("B", lB[0], lB[1], "B", "s", { c: "g" }), P("C", mC[0], mC[1], "C", "n", { c: "g" }),
        seg("A", "C", { c: "k", dash: true }), seg("B", "C", { c: "k", dash: true }), plane(TB, "b", "pl3", { c: "b" })],
      eq: ["ℓ上の2点＋m上の1点 ＝ 同じ直線上にない3点", "=> (ウ) ○"],
    },
    {
      cap: "(エ) **交わる2直線 ℓ, m**（交点 P）。これも、まとめてのせられる下じきを考えるよ。",
      clear: true,
      eqClear: true,
      add: [title("(エ) 交わる2直線"), seg(l2a, l2b, { id: "l2", c: "g", w: 2.4 }), seg(m2a, m2b, { id: "m2", c: "g", w: 2.4 }),
        txt(l2b[0] + 14, l2b[1] + 2, "ℓ", { size: 20, c: "g" }), txt(m2a[0] - 4, m2a[1] - 10, "m", { size: 20, c: "g" }), P("P", Pt[0], Pt[1], "P", "ne", { c: "g" })],
      eq: ["## (エ) 交わる2直線"],
    },
    {
      cap: "ℓ 上に点 A、m 上に点 B をとると、A, B, P は**同じ直線上にない3点**。だから平面は**1つだけ**。(エ) は○！",
      add: [P("A", eA[0], eA[1], "A", "n", { c: "g" }), P("B", eB[0], eB[1], "B", "e", { c: "g" }), seg("A", "B", { c: "k", dash: true }), seg("A", "P", { c: "k", dash: true }), seg("B", "P", { c: "k", dash: true }), plane(TB, "b", "pl4", { c: "b" })],
      eq: ["A, B, P ＝ 同じ直線上にない3点", "=> (エ) ○"],
    },
    {
      cap: "答えは **(イ)(ウ)(エ)**。(ア) の「2点」だけは、平面がいくつもできるから決まらないよ。",
      clear: true,
      eqClear: true,
      add: [txt(200, 130, "(ア) ✕　(イ) ○　(ウ) ○　(エ) ○", { size: 22, c: "a" })],
      eq: ["## 平面が1つに決まる条件", "① 同じ直線上にない3点　→ (イ)", "② 平行な2直線　→ (ウ)", "③ 交わる2直線　→ (エ)", "=> (イ)、(ウ)、(エ)", "// ねじれの位置の2直線は、同じ平面にふくまれない"],
      fin: true,
    },
  ],
};
