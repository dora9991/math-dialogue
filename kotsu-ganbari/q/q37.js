// 問37：影をつけた部分の面積（円と正方形、弓形の移動）
import { P, seg, poly, arc, circ, path, txt, dot, arrow } from "../dsl.js";

const PI = Math.PI;
// 弓形（弦と弧でかこまれた形）の path：a から b へ、半径 r の弧（時計まわり）→ 弦でとじる
const chordSeg = (a, b, r) => `M${a[0]} ${a[1]}A${r} ${r} 0 0 1 ${b[0]} ${b[1]}Z`;

// ── (1) 一辺10cm（1cm＝28）。円は4辺に接し、中の正方形の頂点は接点
const u1 = 28, x1 = 40, y1 = 20;
const O1 = [x1 + 5 * u1, y1 + 5 * u1];
const T1 = [O1[0], y1], R1 = [x1 + 10 * u1, O1[1]], B1 = [O1[0], y1 + 10 * u1], L1 = [x1, O1[1]];
const r1 = 5 * u1;
// ── (2) 一辺8cm（1cm＝35）。大きい弧：左下が中心・半径8。小さい弧：左辺の中点／下辺の中点が中心・半径4
const u2 = 35, x2 = 40, y2 = 20;
const BL = [x2, y2 + 8 * u2], BR = [x2 + 8 * u2, y2 + 8 * u2], TL = [x2, y2], TR = [x2 + 8 * u2, y2];
const PL = [x2, y2 + 4 * u2], MB = [x2 + 4 * u2, y2 + 8 * u2], X = [x2 + 4 * u2, y2 + 4 * u2];  // 左辺の中点・下辺の中点・正方形の中心
const rb = 8 * u2, rs = 4 * u2;

// ── 確かめ（式とは別に、断面ごとの長さを積分して面積を数値で出す）
{
  const n = 200000;
  // (1) 円−正方形：x ごとに、たての長さ 2(円の半分 − 正方形の半分)
  let a1 = 0, h = 10 / n;
  for (let i = 0; i < n; i++) { const x = (i + 0.5) * h, c = Math.sqrt(Math.max(0, 25 - (x - 5) ** 2)), q = Math.max(0, 5 - Math.abs(x - 5)); a1 += 2 * (c - q) * h; }
  if (Math.abs(a1 - (25 * PI - 50)) > 1e-3) throw new Error("問37(1)：数値が合いません " + a1);
  // (2) 影 ＝ [四分円(中心(0,0),半径8) − (半円H1 ∪ 半円H2)] ＋ (H1 ∩ H2)。x ごとの長さを足す
  let a2 = 0; h = 8 / n;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * h, q = Math.sqrt(64 - x * x);
    const aH = x <= 4 ? Math.sqrt(16 - x * x) : -1;                       // H1：中心(0,4) → y は 4−aH〜4+aH
    const bH = Math.sqrt(Math.max(0, 16 - (x - 4) ** 2));                  // H2：中心(4,0) → y は 0〜bH
    const l1 = aH >= 0 ? 2 * aH : 0, l2 = bH;
    const lo = Math.max(aH >= 0 ? 4 - aH : 1e9, 0), hi = Math.min(aH >= 0 ? 4 + aH : -1e9, bH), lens = hi > lo ? hi - lo : 0;
    a2 += (q - l1 - l2 + 2 * lens) * h;
  }
  if (Math.abs(a2 - (16 * PI - 32)) > 1e-3) throw new Error("問37(2)：数値が合いません " + a2);
}

const g = { c: "g", base: true };                                           // 与えられた図（黒。clear しても消えない）
const base1 = [
  poly([[x1, y1], [x1 + 10 * u1, y1], [x1 + 10 * u1, y1 + 10 * u1], [x1, y1 + 10 * u1]], { id: "s1sq" }),
  path([chordSeg(T1, R1, r1), chordSeg(R1, B1, r1), chordSeg(B1, L1, r1), chordSeg(L1, T1, r1)].join(""), { fill: "hatch", w: 0, id: "s1sh" }),
  circ(O1, r1, { id: "s1c" }),
  poly([T1, R1, B1, L1], { id: "s1in" }),
  txt(O1[0], y1 + 10 * u1 + 28, "10cm", { id: "s1t1", size: 16 }),
  txt(x1 + 10 * u1 + 8, O1[1] + 5, "10cm", { id: "s1t2", size: 16, anchor: "start" }),
];
const ids1 = ["s1sq", "s1sh", "s1c", "s1in", "s1t1", "s1t2"];

const shade2 = [
  `M${TL[0]} ${TL[1]}A${rb} ${rb} 0 0 1 ${BR[0]} ${BR[1]}A${rs} ${rs} 0 0 0 ${X[0]} ${X[1]}A${rs} ${rs} 0 0 0 ${TL[0]} ${TL[1]}Z`,   // 三日月形
  `M${BL[0]} ${BL[1]}A${rs} ${rs} 0 0 1 ${X[0]} ${X[1]}A${rs} ${rs} 0 0 1 ${BL[0]} ${BL[1]}Z`,                                      // レンズ形
].join("");

export default {
  n: 37,
  title: "影をつけた部分の面積",
  problem: "次の図で、影をつけた部分の面積を求めなさい。ただし、図において、四角形は正方形であり、曲線は円またはおうぎ形の弧である。\n(1)　(2)（図は動画の最初と(2)のコマにあります）",
  answer: "(1) 25π − 50 cm²　(2) 16π − 32 cm²",
  view: [0, 0, 400, 340],
  steps: [
    {
      cap: "影をつけた部分の面積を求める問題だよ。(1)と(2)があるね。まず(1)から考えよう。",
      add: base1,
    },
    {
      cap: "影の部分は、円のうち、中の正方形の**外がわ**の4つの部分だね。つまり、**円 − 正方形**で求められるよ。",
      hl: ["s1c", "s1in"],
      eq: ["## (1)", "影 ＝ 円 − 中の正方形"],
    },
    {
      cap: "円は、正方形の4辺にくっついているね。だから**直径は10cm**、半径は5cm。円の面積は π×5² だよ。",
      add: [seg(O1, R1, { id: "s1r", c: "b", w: 3 }), txt(O1[0] + 70, O1[1] - 10, "5cm", { size: 16, c: "b", id: "s1rt" })],
      eq: ["円の面積", "π × 5^{2} ＝ 25π"],
    },
    {
      cap: "中の正方形の4つの頂点は、円の上にあるよ。だから、**対角線は円の直径と同じ10cm**だね。",
      add: [seg(T1, B1, { id: "s1d1", c: "b", w: 2.5 }), seg(L1, R1, { id: "s1d2", c: "b", w: 2.5 })],
      eq: ["正方形の対角線 ＝ 10cm"],
    },
    {
      cap: "対角線で、4つの直角二等辺三角形に分かれるね。1つは底辺5cm、高さ5cm。だから正方形は、5×5÷2 の4つ分で**50cm²**。",
      add: [poly([T1, R1, B1, L1], { fill: "y", fo: 0.3, w: 0, id: "s1f" })],
      eq: ["中の正方形の面積", "5 × 5 ÷ 2 × 4 ＝ 50", "// 10 × 10 ÷ 2 ＝ 50 でも同じ（ひし形の公式）"],
    },
    {
      cap: "影 ＝ 円 − 正方形 ＝ 25π − 50。πのつく数と、つかない数は、これ以上まとめられないから、これが答えだよ。",
      eq: ["影 ＝ 25π − 50", "=> (1) 25π − 50 cm²", "// 約 28.5 cm²（正方形100cm²の3割弱）"],
    },
    // ── (2)
    {
      cap: "(2) 一辺8cmの正方形。曲線は、大きい弧が1本、小さい弧が2本あるよ。",
      clear: true, eqClear: true,
      hide: ids1,
      add: [
        poly([TL, TR, BR, BL], { id: "s2sq", ...g }),
        path(shade2, { fill: "hatch", w: 0, id: "s2sh", base: true }),
        arc(BL, rb, 0, 90, { id: "s2a0", ...g }), arc(PL, rs, 270, 90, { id: "s2a1", ...g }), arc(MB, rs, 0, 180, { id: "s2a2", ...g }),
        txt((BL[0] + BR[0]) / 2, BL[1] + 28, "8cm", { size: 16, id: "s2t1", ...g }),
        txt(BR[0] + 8, (TR[1] + BR[1]) / 2 + 5, "8cm", { size: 16, anchor: "start", id: "s2t2", ...g }),
      ],
      eq: ["## (2)"],
    },
    {
      cap: "大きい弧は、**左下の頂点が中心**で半径8cm。小さい弧は、**辺の真ん中が中心**で、半径4cmの円の一部だよ。",
      add: [
        dot(BL[0], BL[1], { c: "a", r: 5, id: "s2d0" }), dot(PL[0], PL[1], { c: "a", r: 5, id: "s2d1" }), dot(MB[0], MB[1], { c: "a", r: 5, id: "s2d2" }),
        seg(PL, X, { c: "b", w: 2.5, id: "s2r1" }), txt(PL[0] + 70, PL[1] - 8, "4cm", { size: 16, c: "b", id: "s2r1t" }),
        seg(MB, X, { c: "b", w: 2.5, id: "s2r2" }), txt(MB[0] + 8, MB[1] - 62, "4cm", { size: 16, c: "b", anchor: "start", id: "s2r2t" }),
      ],
      eq: ["大きい弧：中心は左下の頂点、半径 8cm（四分円の弧）", "小さい弧：中心は辺の中点、半径 4cm（半円の弧）"],
    },
    {
      cap: "影は、右上の**三日月形**と、左下の**レンズ形**。レンズ形は、対角線で**2つの弓形**に分けられるよ。",
      hide: ["s2r1", "s2r1t", "s2r2", "s2r2t", "s2d0", "s2d1", "s2d2"],
      add: [
        seg(BL, X, { c: "p", w: 2.4, dash: true, id: "s2ch" }),
        path(chordSeg(BL, X, rs), { fill: "p", fo: 0.4, w: 0, id: "s2u" }),       // 中心が下辺の中点の弧（紫）
        path(`M${X[0]} ${X[1]}A${rs} ${rs} 0 0 1 ${BL[0]} ${BL[1]}Z`, { fill: "y", fo: 0.5, w: 0, id: "s2l" }),   // 中心が左辺の中点の弧（黄）
      ],
      eq: ["レンズ形 ＝ 弓形 ＋ 弓形", "（2つは合同な弓形）"],
    },
    {
      cap: "左上と右下の頂点を結ぶ線をひくと、三日月形のくぼみに、同じ形の弓形が見えるよ。黄色の弓形を、上へ移そう。",
      add: [
        seg(TL, BR, { c: "p", w: 2.4, dash: true, id: "s2ch2" }),
        path(chordSeg(TL, X, rs), { fill: "y", fo: 0.5, w: 0, id: "s2m1" }),
        arrow([X[0] - 60, X[1] + 95], [X[0] - 60, X[1] - 85], { c: "y", w: 3, id: "s2ar1" }),
      ],
      together: true,
    },
    {
      cap: "紫の弓形は、右に移すよ。これもぴったり入るね。",
      add: [
        path(`M${X[0]} ${X[1]}A${rs} ${rs} 0 0 1 ${BR[0]} ${BR[1]}Z`, { fill: "p", fo: 0.4, w: 0, id: "s2m2" }),
        arrow([X[0] - 85, X[1] + 60], [X[0] + 85, X[1] + 60], { c: "p", w: 3, id: "s2ar2" }),
      ],
      together: true,
    },
    {
      cap: "動かすと、影は、**大きな弧と、左上〜右下の線でできた弓形**になったよ。（面積は変わらない！）",
      clear: true, eqClear: true,
      hide: ["s2sh", "s2a1", "s2a2"],
      add: [
        path(chordSeg(TL, BR, rb), { fill: "hatch", w: 0, id: "s2big" }),
        seg(TL, BR, { c: "b", w: 2.5, id: "s2cd" }),
      ],
      eq: ["## (2)", "影 ＝ 大きな弓形", "＝ おうぎ形 − 三角形"],
    },
    {
      cap: "おうぎ形は、半径8cm・中心角90°（円の4分の1）。三角形は、底辺8cm・高さ8cmだよ。",
      add: [
        arc(BL, rb, 0, 90, { fill: "b", fo: 0.22, id: "s2sec" }),
        poly([BL, TL, BR], { fill: "y", fo: 0.4, w: 2, id: "s2tri" }),
      ],
      hl: ["s2sec", "s2tri"],
      eq: ["おうぎ形：π × 8^{2} × [[1|4]] ＝ 16π", "三角形：8 × 8 ÷ 2 ＝ 32"],
    },
    {
      cap: "影の面積 ＝ おうぎ形 − 三角形 ＝ 16π − 32。これが答えだよ。",
      eq: ["影 ＝ 16π − 32", "=> (2) 16π − 32 cm²", "// 約 18.3 cm²（正方形64cm²の3割弱）"],
      fin: true,
    },
  ],
};
