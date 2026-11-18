// 問22：投影図から立体の名前を答える（三角錐・円柱）
import { seg, poly, circ, ell, txt, dot, oblique } from "../dsl.js";

// ── 印刷物の投影図の寸法（写真を拡大して読みとり。横はば 256 を基準にした長さ）──
const S = 0.48;                                   // 画面での縮尺
// (1) 立面図：三角形＋まん中の線 / 平面図：三角形
const T1 = { W: 256, H: 273, bx: 78, D: 158 };    // 底辺の長さ・立面図の高さ・頂点（とB）の左はしからの距離・平面図のたての長さ
// (2) 立面図：長方形（横 262×たて 328）/ 平面図：円（直径 265）
const T2 = { W: 262, H: 328 };

// ── 3 次元の頂点・面から、見える辺／見えない辺を決める（斜投影）──
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const viewDir = (k, deg) => [-k * Math.cos((deg * Math.PI) / 180), 1, -k * Math.sin((deg * Math.PI) / 180)];   // 見る向き
function mk3(pr, verts, faces, pre, k = 0.5, deg = 40) {
  const VD = viewDir(k, deg);
  const names = Object.keys(verts), cen = [0, 1, 2].map((i) => names.reduce((s, k) => s + verts[k][i], 0) / names.length);
  const vis = faces.map((f) => {
    const p = f.map((n) => verts[n]);
    let nr = cross3(sub3(p[1], p[0]), sub3(p[2], p[0]));
    const fc = [0, 1, 2].map((i) => p.reduce((s, q) => s + q[i], 0) / p.length);
    if (dot3(nr, sub3(fc, cen)) < 0) nr = nr.map((v) => -v);
    return dot3(nr, VD) < -1e-9;
  });
  const em = new Map();
  faces.forEach((f, i) => f.forEach((a, j) => { const b = f[(j + 1) % f.length], k = [a, b].sort().join(""); const e = em.get(k) || { a, b, vis: false }; e.vis = e.vis || vis[i]; em.set(k, e); }));
  const pt = Object.fromEntries(Object.entries(verts).map(([k, v]) => [k, pr(v)]));
  const edge = (k, o = {}) => { const e = em.get(k); if (!e) throw new Error("辺がありません " + k); return seg(pt[e.a], pt[e.b], { id: pre + "e" + k, dash: !e.vis, ...o }); };
  return { pt, edge };
}

// ── (1) の投影図 ──
function proj1(pre, x0, y0, o = {}) {
  const W = T1.W * S, H = T1.H * S, bx = T1.bx * S, D = T1.D * S;
  const yb = y0 + H, yg = yb + 18, yp = yg + 19, yB = yp + D;
  return [
    seg([x0, yb], [x0 + W, yb], { id: pre + "eb", ...o }),                     // 立面図の底辺
    seg([x0, yb], [x0 + bx, y0], { id: pre + "el", ...o }),                    // 立面図の左の辺
    seg([x0 + W, yb], [x0 + bx, y0], { id: pre + "er", ...o }),                // 立面図の右の辺
    seg([x0 + bx, y0], [x0 + bx, yb], { id: pre + "em", ...o }),               // 立面図のまん中の線
    seg([x0 - 25, yg], [x0 + W + 25, yg], { id: pre + "g", w: 1.6, ...o }),     // 基準線
    seg([x0, yb], [x0, yp], { dash: true, id: pre + "d1", ...o }),
    seg([x0 + bx, yb], [x0 + bx, yB], { dash: true, id: pre + "d2", ...o }),
    seg([x0 + W, yb], [x0 + W, yp], { dash: true, id: pre + "d3", ...o }),
    seg([x0, yp], [x0 + W, yp], { id: pre + "pt", ...o }),                     // 平面図
    seg([x0, yp], [x0 + bx, yB], { id: pre + "pl", ...o }),
    seg([x0 + W, yp], [x0 + bx, yB], { id: pre + "pr", ...o }),
  ];
}
const P1 = ["eb", "el", "er", "em", "g", "d1", "d2", "d3", "pt", "pl", "pr"];
// ── (2) の投影図 ──
function proj2(pre, x0, y0, o = {}) {
  const W = T2.W * S, H = T2.H * S, R = W / 2, yb = y0 + H, yg = yb + 12, cy = yg + 14 + R;
  return [
    poly([[x0, y0], [x0 + W, y0], [x0 + W, yb], [x0, yb]], { id: pre + "rect", ...o }),
    seg([x0 - 25, yg], [x0 + W + 25, yg], { id: pre + "g", w: 1.6, ...o }),
    seg([x0, yb], [x0, cy], { dash: true, id: pre + "d1", ...o }),
    seg([x0 + W, yb], [x0 + W, cy], { dash: true, id: pre + "d2", ...o }),
    circ([x0 + R, cy], R, { id: pre + "circ", ...o }),
  ];
}
const P2 = ["rect", "g", "d1", "d2", "circ"];

const X1 = 40, Y0 = 22, X2 = 290;
const base1 = [...proj1("p", X1, Y0), txt(8, 34, "(1)", { id: "n1", size: 16, anchor: "start" })], base2 = [...proj2("q", X2, Y0), txt(X2 - 40, 34, "(2)", { id: "n2", size: 16, anchor: "start" })];
const copy2 = [...proj2("r", X1, Y0, { c: "g" }), txt(8, 34, "(2)", { id: "rn", size: 16, anchor: "start", c: "g" })];

// 見出しの文字（(1) の図のそば）
const yb1 = Y0 + T1.H * S, yg1 = yb1 + 18, yp1 = yg1 + 19;
const labels = [
  txt(176, Y0 + 52, "立面図", { size: 16, anchor: "start", c: "k", id: "lbE" }),
  txt(176, yp1 + 62, "平面図", { size: 16, anchor: "start", c: "k", id: "lbP" }),
  txt(X1 + T1.W * S + 30, yg1 + 5, "基準線", { size: 15, anchor: "start", c: "k", id: "lbG" }),
];

// ── (1) の立体：三角錐（印刷物の寸法の 0.45 倍）──
const K = 0.55, KK = 0.8, KD = 145, pr1 = oblique(345, 270, KK, KD);   // 奥は左上へ（辺が重ならないように）
const q = (x, y, z) => [x * K, y * K, z * K];
const V1 = { L: q(0, T1.D, 0), R: q(T1.W, T1.D, 0), B: q(T1.bx, 0, 0), T: q(T1.bx, T1.D, T1.H) };
const pyr = mk3(pr1, V1, [["L", "R", "B"], ["T", "L", "R"], ["T", "R", "B"], ["T", "B", "L"]], "y", KK, KD);
const footT = pr1(q(T1.bx, T1.D, 0));
const guideT = seg(footT, pyr.pt.T, { dash: true, c: "k", id: "yguide" });
const dotT = dot(pyr.pt.T[0], pyr.pt.T[1], { r: 4, id: "ydot" });

// ── (2) の立体：円柱 ──
const CX = 355, CB = 262, RX = 56, RY = 16, CH = 140;
const cylEls = {
  backB: ell([CX, CB], RX, RY, 0, 180, { dash: true, id: "cbb" }),
  frontB: ell([CX, CB], RX, RY, 180, 360, { id: "cfb" }),
  sideL: seg([CX - RX, CB], [CX - RX, CB - CH], { id: "csl" }),
  sideR: seg([CX + RX, CB], [CX + RX, CB - CH], { id: "csr" }),
  top: ell([CX, CB - CH], RX, RY, 0, 360, { id: "ctp" }),
};

export default {
  n: 22,
  title: "投影図から立体の名前",
  problem: "次のそれぞれの投影図で表された立体の名前を答えなさい。",
  answer: "(1) 三角錐　(2) 円柱",
  view: [0, 0, 480, 345],
  steps: [
    {
      cap: "投影図から、立体の名前を答える問題だよ。(1)と(2)を、1つずつ考えよう。",
      add: [...base1, ...base2],
    },
    {
      cap: "投影図は、**立面図**（正面から見た図・上）と**平面図**（真上から見た図・下）をならべた図。間の線が基準線だよ。",
      add: labels,
      eq: ["## 投影図の見方", "立面図 … 正面から見た図", "平面図 … 真上から見た図", "// 点線は、同じ点をむすぶ線"],
    },
    {
      cap: "立面図と平面図の形で、立体が決まるよ。**柱**・**錐**・**球**の見分け方を、覚えておこう。",
      eq: ["## 立体の見分け方", "立面図 ／ 平面図 → 立体", "長方形 ／ 多角形 → 角柱", "長方形 ／ 円 → 円柱", "三角形 ／ 多角形 → 角錐", "三角形 ／ 円 → 円錐", "円 ／ 円 → 球"],
    },
    {
      cap: "(1) 立面図は**三角形**。上がとがっているから、**錐**（すい）の形だね。",
      hide: [...P2.map((k) => "q" + k), "n2"],
      hl: ["pel", "per", "peb"],
      eqClear: true,
      eq: ["## (1)", "立面図：三角形 → 錐の形"],
    },
    {
      cap: "平面図も**三角形**。平面図は、立体を真上から見た形。つまり**底面は三角形**だよ。",
      hl: ["ppt", "ppl", "ppr"],
      eq: ["平面図：三角形 → 底面は三角形"],
    },
    {
      cap: "底面が三角形の錐だから、**三角錐**だね。絵にかいて確かめよう。① 平面図の三角形を、ななめから見た形にかくよ。",
      add: [pyr.edge("LR"), pyr.edge("BL"), pyr.edge("BR")],
      eq: ["底面が三角形の錐 → 三角錐", "① 底面の三角形をかく"],
    },
    {
      cap: "② 頂点は、立面図の高さだけ上にとるよ。平面図の点線とうしろの辺がまじわる点の、真上だね。",
      add: [guideT, dotT],
      eq: ["② 高さの分だけ上に頂点"],
    },
    {
      cap: "③ 頂点と、底面の3つの角を線でむすぶよ。頂点から出る線は**3本**になるね。",
      add: [pyr.edge("LT"), pyr.edge("RT"), pyr.edge("BT")],
      hl: ["yeLT", "yeRT", "yeBT"],
      eq: ["③ 頂点から3本の線をひく"],
    },
    {
      cap: "確かめ：立面図でも、頂点から出る線は**3本**（左・まん中・右）。三角錐と、ぴったり合うね。",
      hl: ["pel", "per", "pem", "yeLT", "yeRT", "yeBT"],
      eq: ["頂点から出る線 … 3本", "// 四角錐なら、平面図は四角形で4本", "=> (1) 三角錐"],
    },
    {
      cap: "(2) 立面図は**長方形**、平面図は**円**だね。",
      hide: [...P1.map((k) => "p" + k), "n1"],
      clear: true,
      add: [...copy2, ...labels.map((l) => ({ ...l, id: l.id + "2", c: "k" }))],
      hl: ["rrect", "rcirc"],
      eqClear: true,
      eq: ["## (2)", "立面図：長方形", "平面図：円"],
    },
    {
      cap: "平面図が円だから、底面は**円**。立面図が長方形だから、まっすぐな**柱**。あわせて**円柱**だね。",
      eq: ["底面は円 ＋ まっすぐな柱 → 円柱"],
    },
    {
      cap: "絵にかくよ。① 底の円を、ななめから見て**だ円**にかく。うしろ半分は見えないから点線だよ。",
      add: [cylEls.frontB, cylEls.backB],
      eq: ["① 底の円をかく"],
    },
    {
      cap: "② 立面図の高さだけ、まっすぐ上に線をのばして、上の円をかくよ。",
      add: [cylEls.sideL, cylEls.sideR, cylEls.top],
      eq: ["② 上に線をのばして、上の円"],
    },
    {
      cap: "確かめ：長方形の横はばは、円の直径と同じ（点線が円にぴったりふれる）。円柱だよ。",
      hl: ["rd1", "rd2"],
      eq: ["長方形の横はば ＝ 円の直径", "// 円錐なら立面図は三角形、球なら円", "=> (2) 円柱"],
    },
    {
      cap: "答え：**(1) 三角錐　(2) 円柱**。立面図と平面図の形から、柱か錐か球かを決めるのがコツだよ。",
      fin: true,
    },
  ],
};
