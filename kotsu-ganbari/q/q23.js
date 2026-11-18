// 問23：投影図から立体を答える（球・六角柱・三角柱）
import { seg, poly, circ, ell, dot, oblique } from "../dsl.js";

// ── 3 次元の頂点・面から、見える辺／見えない辺を決める（斜投影）──
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const viewDir = (k, deg) => [-k * Math.cos((deg * Math.PI) / 180), 1, -k * Math.sin((deg * Math.PI) / 180)];   // 見る向き
function mk3(pr, verts, faces, pre, k = 0.5, deg = 40) {
  const VD = viewDir(k, deg);
  const names = Object.keys(verts), cen = [0, 1, 2].map((i) => names.reduce((s, n) => s + verts[n][i], 0) / names.length);
  const vis = faces.map((f) => {
    const p = f.map((n) => verts[n]);
    let nr = cross3(sub3(p[1], p[0]), sub3(p[2], p[0]));
    const fc = [0, 1, 2].map((i) => p.reduce((s, q) => s + q[i], 0) / p.length);
    if (dot3(nr, sub3(fc, cen)) < 0) nr = nr.map((v) => -v);
    return dot3(nr, VD) < -1e-9;
  });
  const em = new Map();
  faces.forEach((f, i) => f.forEach((a, j) => { const b = f[(j + 1) % f.length], key = [a, b].sort().join(""); const e = em.get(key) || { a, b, vis: false }; e.vis = e.vis || vis[i]; em.set(key, e); }));
  const pt = Object.fromEntries(Object.entries(verts).map(([n, v]) => [n, pr(v)]));
  const edge = (a, b, o = {}) => { const key = [a, b].sort().join(""), e = em.get(key); if (!e) throw new Error("辺がありません " + key); return seg(pt[e.a], pt[e.b], { id: pre + "e" + key, dash: !e.vis, ...o }); };
  return { pt, edge };
}

// ── 印刷物の投影図（写真を拡大して読みとった寸法。単位はそろえてある）──
// 地面（基準線）の y を G、図の左はしを x0、縮尺を s とする
const EXT = 24;
// (1) 立面図：円 / 平面図：円（直径 204、どちらも同じ）
function fig1(pre, x0, G, s, o = {}) {
  const r = 102 * s, cE = G - 155 * s, cP = G + 162 * s;
  return [
    circ([x0 + r, cE], r, { id: pre + "ce", ...o }),
    circ([x0 + r, cP], r, { id: pre + "cp", ...o }),
    seg([x0 - EXT - 8, G], [x0 + 2 * r + EXT + 8, G], { id: pre + "g", w: 1.6, ...o }),
    seg([x0, cE], [x0, cP], { dash: true, id: pre + "d1", ...o }),
    seg([x0 + 2 * r, cE], [x0 + 2 * r, cP], { dash: true, id: pre + "d2", ...o }),
  ];
}
const IDS1 = ["ce", "cp", "g", "d1", "d2"];
// (2) 立面図：長方形（横 250・たて 185）＋ たて線 2本 / 平面図：六角形
const HEX = [[0, 185], [52, 119], [198, 119], [250, 185], [198, 262], [52, 262]];   // 平面図の六角形（地面からの y）
function fig2(pre, x0, G, s, o = {}) {
  const X = (x) => x0 + x * s, Y = (y) => G + y * s, top = Y(-250), bot = Y(-65);
  return [
    poly([[X(0), top], [X(250), top], [X(250), bot], [X(0), bot]], { id: pre + "rect", ...o }),
    seg([X(52), top], [X(52), bot], { id: pre + "i1", ...o }),
    seg([X(198), top], [X(198), bot], { id: pre + "i2", ...o }),
    seg([X(-EXT / s), G], [X(250 + EXT / s), G], { id: pre + "g", w: 1.6, ...o }),
    seg([X(0), bot], [X(0), Y(185)], { dash: true, id: pre + "d1", ...o }),
    seg([X(52), bot], [X(52), Y(262)], { dash: true, id: pre + "d2", ...o }),
    seg([X(198), bot], [X(198), Y(262)], { dash: true, id: pre + "d3", ...o }),
    seg([X(250), bot], [X(250), Y(185)], { dash: true, id: pre + "d4", ...o }),
    poly(HEX.map(([x, y]) => [X(x), Y(y)]), { id: pre + "hex", ...o }),
  ];
}
const IDS2 = ["rect", "i1", "i2", "g", "d1", "d2", "d3", "d4", "hex"];
// (3) 立面図：長方形（横 262・たて 233）＋ たて線 1本 / 平面図：三角形
const TRI = [[0, 42], [98, 180], [262, 124]];                                       // 平面図の三角形 A, B, C（地面からの y）
function fig3(pre, x0, G, s, o = {}) {
  const X = (x) => x0 + x * s, Y = (y) => G + y * s, top = Y(-268), bot = Y(-35);
  return [
    poly([[X(0), top], [X(262), top], [X(262), bot], [X(0), bot]], { id: pre + "rect", ...o }),
    seg([X(98), top], [X(98), bot], { id: pre + "i1", ...o }),
    seg([X(-EXT / s), G], [X(262 + EXT / s), G], { id: pre + "g", w: 1.6, ...o }),
    seg([X(0), bot], [X(0), Y(42)], { dash: true, id: pre + "d1", ...o }),
    seg([X(98), bot], [X(98), Y(180)], { dash: true, id: pre + "d2", ...o }),
    seg([X(262), bot], [X(262), Y(124)], { dash: true, id: pre + "d3", ...o }),
    poly(TRI.map(([x, y]) => [X(x), Y(y)]), { id: pre + "tri", ...o }),
  ];
}
const IDS3 = ["rect", "i1", "g", "d1", "d2", "d3", "tri"];
const ids = (pre, L) => L.map((k) => pre + k);

// 問題の図（3つならべる）と、1つずつ見るときの図（左に大きめ）
const GB = 132, SB = 0.42, GC = 156, SC = 0.5, XC = 40;
const base1 = fig1("p", 40, GB, SB), base2 = fig2("q", 175, GB, SB), base3 = fig3("r", 335, GB, SB);
const cp1 = fig1("a", XC, GC, SC, { c: "g" }), cp2 = fig2("b", XC, GC, SC, { c: "g" }), cp3 = fig3("c", XC, GC, SC, { c: "g" });
const baseAll = [...ids("p", IDS1), ...ids("q", IDS2), ...ids("r", IDS3)];

// ── (1) 球 ──
const SX = 350, SY = 160, SR = 58;
const sph = {
  c: circ([SX, SY], SR, { id: "sc" }),
  front: ell([SX, SY], SR, 17, 180, 360, { id: "sef" }),
  back: ell([SX, SY], SR, 17, 0, 180, { dash: true, id: "seb" }),
  ctr: dot(SX, SY, { r: 3.5, id: "sdot" }),
};

// ── (2) 六角柱（平面図の六角形を、そのまま底面にする）──
const K2 = 0.6, pr2 = oblique(255, 262, 0.5, 40);
const hv = {}, hn = ["a", "b", "c", "d", "e", "f"], HU = ["A", "B", "C", "D", "E", "F"];
HEX.forEach(([x, y], i) => { hv[hn[i]] = [x * K2, (262 - y) * K2, 0]; hv[HU[i]] = [x * K2, (262 - y) * K2, 185 * K2]; });
// 六角形の並び：a(左) b(左上) c(右上) d(右) e(右下) f(左下)
const hf = [hn, HU, ...hn.map((n, i) => [n, hn[(i + 1) % 6], HU[(i + 1) % 6], HU[i]])];
const hexP = mk3(pr2, hv, hf, "h");

// ── (3) 三角柱 ──
const K3 = 0.55, KD3 = 145, pr3 = oblique(330, 262, 0.7, KD3);
const tv = {};
const TN = ["a", "b", "c"], TU = ["A", "B", "C"];
TRI.forEach(([x, y], i) => { tv[TN[i]] = [x * K3, (180 - y) * K3, 0]; tv[TU[i]] = [x * K3, (180 - y) * K3, 233 * K3]; });
const tf = [TN, TU, ...TN.map((n, i) => [n, TN[(i + 1) % 3], TU[(i + 1) % 3], TU[i]])];
const triP = mk3(pr3, tv, tf, "t", 0.7, KD3);

export default {
  n: 23,
  title: "投影図から立体を当てる",
  problem: "次の投影図はどんな立体を表しているか答えなさい。",
  answer: "(1) 球　(2) 六角柱　(3) 三角柱",
  view: [0, 0, 480, 310],
  steps: [
    {
      cap: "投影図から、どんな立体かを答える問題だよ。(1)〜(3) を、順番に見ていこう。",
      add: [...base1, ...base2, ...base3],
    },
    {
      cap: "上が**立面図**、下が**平面図**。この2つの形の組み合わせで、立体が決まるよ。見分け方を覚えよう。",
      eq: ["## 立体の見分け方", "立面図 ／ 平面図 → 立体", "長方形 ／ 多角形 → 角柱", "長方形 ／ 円 → 円柱", "三角形 ／ 多角形 → 角錐", "三角形 ／ 円 → 円錐", "円 ／ 円 → 球"],
    },
    {
      cap: "(1) 立面図も平面図も、どちらも**円**だね。",
      hide: baseAll,
      add: cp1,
      hl: ["ace", "acp"],
      eqClear: true,
      eq: ["## (1)", "立面図：円", "平面図：円"],
    },
    {
      cap: "どの向きから見ても円に見える立体は、**球**だけ。円柱や円錐は、横から見ると円にならないよ。",
      add: [sph.c, sph.front, sph.back, sph.ctr],
      eq: ["円 ／ 円 → 球"],
    },
    {
      cap: "確かめ：2つの円は、大きさ（直径）が同じ。点線が、円の左右にぴったりふれているね。球は、どこから見ても同じ大きさの円だよ。",
      hl: ["ad1", "ad2"],
      eq: ["円の直径が同じ → 球", "=> (1) 球"],
    },
    {
      cap: "(2) 立面図は**長方形**でたて線が2本、平面図は**六角形**だね。",
      hide: ids("a", IDS1),
      clear: true,
      add: cp2,
      hl: ["brect", "bhex"],
      eqClear: true,
      eq: ["## (2)", "立面図：長方形", "平面図：六角形"],
    },
    {
      cap: "平面図が六角形だから、底面は**六角形**。立面図が長方形だから、まっすぐな**柱**。あわせて**六角柱**だね。",
      eq: ["底面は六角形 ＋ 柱 → 六角柱"],
    },
    {
      cap: "絵にかくよ。① 平面図の六角形を、ななめから見た形にかく。うしろの辺は見えないから点線だよ。",
      add: [hexP.edge("a", "b"), hexP.edge("b", "c"), hexP.edge("c", "d"), hexP.edge("d", "e"), hexP.edge("e", "f"), hexP.edge("f", "a")],
      eq: ["① 底面の六角形をかく"],
    },
    {
      cap: "② 立面図の高さだけ、まっすぐ上に線をのばして、上の六角形をかくよ。",
      add: [hexP.edge("a", "A"), hexP.edge("b", "B"), hexP.edge("c", "C"), hexP.edge("d", "D"), hexP.edge("e", "E"), hexP.edge("f", "F"),
        hexP.edge("A", "B"), hexP.edge("B", "C"), hexP.edge("C", "D"), hexP.edge("D", "E"), hexP.edge("E", "F"), hexP.edge("F", "A")],
      eq: ["② 高さの分だけ上に、同じ六角形"],
    },
    {
      cap: "確かめ：立面図のたて線は**4本**。点線でつながる六角形の角の位置（4か所）と、ぴったり合うね。",
      hl: ["bi1", "bi2", "bd1", "bd2", "bd3", "bd4"],
      eq: ["たて線 4本 ＝ 角の位置 4か所", "=> (2) 六角柱", "// 辺の長さがそろっていないので「正」はつけない"],
    },
    {
      cap: "(3) 立面図は**長方形**でたて線が1本、平面図は**三角形**だね。",
      hide: ids("b", IDS2),
      clear: true,
      add: cp3,
      hl: ["crect", "ctri"],
      eqClear: true,
      eq: ["## (3)", "立面図：長方形", "平面図：三角形"],
    },
    {
      cap: "平面図が三角形だから、底面は**三角形**。立面図が長方形だから、まっすぐな**柱**。**三角柱**だね。",
      eq: ["底面は三角形 ＋ 柱 → 三角柱"],
    },
    {
      cap: "絵にかくよ。① 平面図の三角形を、ななめから見た形にかく。うしろの辺は点線だよ。",
      add: [triP.edge("a", "b"), triP.edge("b", "c"), triP.edge("c", "a")],
      eq: ["① 底面の三角形をかく"],
    },
    {
      cap: "② 立面図の高さだけ、まっすぐ上に線をのばして、上の三角形をかくよ。",
      add: [triP.edge("a", "A"), triP.edge("b", "B"), triP.edge("c", "C"), triP.edge("A", "B"), triP.edge("B", "C"), triP.edge("C", "A")],
      eq: ["② 高さの分だけ上に、同じ三角形"],
    },
    {
      cap: "確かめ：立面図のたて線は**3本**（左・まん中・右）。三角形の角の数と同じで、ぴったり合うね。",
      hl: ["ci1", "cd1", "cd2", "cd3"],
      eq: ["たて線 3本 ＝ 角 3こ", "=> (3) 三角柱"],
    },
    {
      cap: "答え：**(1) 球　(2) 六角柱　(3) 三角柱**。立面図と平面図の形から、柱か錐か球かを決めるのがコツだよ。",
      fin: true,
    },
  ],
};
