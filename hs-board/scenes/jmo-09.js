/* 数学オリンピック（JMO予選レベル・自作問題）⑨：見えない円を見つける ― 垂線の足と中点がつくる角
   問題（自作）：鋭角三角形 ABC で ∠BAC=50°。B から CA への垂線の足 E、C から AB への垂線の足 F、BC の中点 M。∠EMF は？
   答え：80°（∠B, ∠C によらない）。∠BEC=∠BFC=90° → E, F は BC を直径とする円（中心 M）の上 →
         ∠EMF（弧 EF の中心角）＝2∠EBF＝2(90°−50°)＝80°。一般に ∠EMF＝180°−2∠A。
   ウォームアップ：AB=AC=AD、∠BAC=40° → B, C, D は A が中心の円の上 → ∠BDC=20°（D の位置によらない）。
   確かめ：AB=AC（∠B=∠C=65°）なら ∠BMF=∠CME=180°−130°=50° → ∠EMF=80°。
   考えてみよう：△MEF は ME=MF の二等辺三角形、∠MEF=∠MFE=50°（=∠A）。∠A=60° なら正三角形。
   値・誤答（50°, 100°, 40°／40°, 70°, 80°／65°, 25°, 130°）・図の座標は python3（w5/verify09.py）で検算ずみ。
   図の座標：BC=6、B(0,0)、C(6,0)、M(3,0)。∠B=60°・∠C=70° で A(3.6800, 6.3740)、E(5.2981, 1.9284)、F(1.5000, 2.5981)
   （ME=MF=3、M から見た向き E 40°・F 120°）。∠B=∠C=65° で A(3, 6.4335)、E(4.9284, 2.2981)、F(1.0716, 2.2981)。
   ウォームアップは A(0,0) が中心・半径 3、B 205°・C 245°・D 300° の位置。 */
(function () {
  const POINTS = [
    '図にない円の見つけ方は2つ。**同じ長さ**（OP＝OQ＝OR）→ O が中心の円。**直角**（$\\angle\\mathrm{PXQ}=90^\\circ$）→ PQ を直径とする円（中心は PQ の中点）',
    '円が見つかったら、**中心角＝2×円周角**、**同じ弧に対する円周角は等しい** で角を移す。本題は $\\angle\\mathrm{EMF}=2\\angle\\mathrm{EBF}=2\\times40^\\circ=80^\\circ$',
    '答えだけの問題は **特別な形** でも確かめる。$\\angle\\mathrm{EMF}=180^\\circ-2\\angle\\mathrm{A}$ は $\\angle\\mathrm{B},\\ \\angle\\mathrm{C}$ によらない。ME＝MF なので、$\\angle\\mathrm{A}=60^\\circ$ なら △MEF は正三角形'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const foot = (P, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / (dx * dx + dy * dy); return [A[0] + t * dx, A[1] + t * dy]; };
  // 三角形：BC=6 を x 軸に、∠B=Bd°、∠C=Cd°。E＝B から CA への垂線の足、F＝C から AB への垂線の足、M＝BC の中点
  const tri = (Bd, Cd) => {
    const tB = Math.tan(rad(Bd)), tC = Math.tan(rad(Cd)), ax = 6 * tC / (tB + tC), A = [ax, ax * tB], B = [0, 0], C = [6, 0];
    return { A, B, C, E: foot(B, C, A), F: foot(C, A, B), M: [3, 0] };
  };
  // 同じ長さの印（線分の真ん中に短い線）
  const tick = (P, Q, c, s) => {
    const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], L = Math.hypot(Q[0] - P[0], Q[1] - P[1]), h = s || 0.17, n = [-(Q[1] - P[1]) / L * h, (Q[0] - P[0]) / L * h];
    return { k: 'seg', a: [m[0] - n[0], m[1] - n[1]], b: [m[0] + n[0], m[1] + n[1]], c: c || 'w', wd: 2.5 };
  };

  // ---------- 図：(ア) 同じ長さ・(イ) 直角 ----------
  const O1 = [0, 0], P1 = on(O1, 2, 140), Q1 = on(O1, 2, 250), R1 = on(O1, 2, 15);
  const M2 = [6.6, 0], P2 = [4.6, 0], Q2 = [8.6, 0], X2 = on(M2, 2, 62);
  const figK = { t: 'fig', id: 'k', col: 1, view: [-2.7, -2.6, 9.3, 2.75], w: 680, h: 303, items: [
    { k: 'label', at: [-2.6, 2.45], text: '(ア)', anchor: 'start', size: 24, c: 'b', plain: true },
    { k: 'seg', a: O1, b: P1 }, { k: 'seg', a: O1, b: Q1 }, { k: 'seg', a: O1, b: R1 },
    tick(O1, P1), tick(O1, Q1), tick(O1, R1),
    { k: 'circle', o: O1, r: 2, c: 'y', dash: true },
    { k: 'pt', at: O1, name: 'O', dir: 'se', r: 4 }, { k: 'pt', at: P1, name: 'P', dir: 'nw', r: 4 },
    { k: 'pt', at: Q1, name: 'Q', dir: 's', r: 4 }, { k: 'pt', at: R1, name: 'R', dir: 'e', r: 4 }] };
  const figK2 = [
    { k: 'label', at: [4.2, 2.45], text: '(イ)', anchor: 'start', size: 24, c: 'g', plain: true },
    { k: 'seg', a: P2, b: Q2 }, { k: 'seg', a: X2, b: P2 }, { k: 'seg', a: X2, b: Q2 },
    { k: 'right', o: X2, a: P2, b: Q2, s: 15, c: 'g' },
    { k: 'seg', a: M2, b: X2, c: 'd', dash: true }, tick(M2, P2, 'd'), tick(M2, Q2, 'd'), tick(M2, X2, 'd'),
    { k: 'circle', o: M2, r: 2, c: 'y', dash: true },
    { k: 'pt', at: P2, name: 'P', dir: 'w', r: 4 }, { k: 'pt', at: Q2, name: 'Q', dir: 'e', r: 4 },
    { k: 'pt', at: X2, name: 'X', dir: 'ne', r: 4, c: 'g' }, { k: 'pt', at: M2, name: 'M', dir: 's', r: 4, c: 'd' }];

  // ---------- 図：ウォームアップ ----------
  const Aw = [0, 0], Bw = on(Aw, 3, 205), Cw = on(Aw, 3, 245), Dw = on(Aw, 3, 300);
  const figW = { t: 'fig', id: 'w', col: 1, view: [-3.7, -3.7, 3.7, 3.7], w: 480, h: 480, items: [
    { k: 'poly', pts: [Aw, Bw, Cw, Dw], close: true, fill: 'w', alpha: 0.05 },
    { k: 'seg', a: Aw, b: Cw }, { k: 'seg', a: Bw, b: Dw, wd: 2.5 },
    tick(Aw, Bw), tick(Aw, Cw), tick(Aw, Dw),
    { k: 'angle', o: Aw, a: Bw, b: Cw, rp: 46, c: 'b', label: '40°', lr: 22 },
    { k: 'pt', at: Aw, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: Bw, name: 'B', dir: 'w', r: 4 },
    { k: 'pt', at: Cw, name: 'C', dir: 'sw', r: 4 }, { k: 'pt', at: Dw, name: 'D', dir: 'se', r: 4 }] };

  // ---------- 図：本題（三角形・垂線・中点） ----------
  const T = tri(60, 70), S = tri(65, 65);
  const VIEW = [-0.8, -3.35, 6.8, 7.0];
  const tFig = (id, G, o) => {
    o = o || {};
    const alt = o.altDash ? { c: 'd', dash: true, wd: 2.5 } : { wd: 2.5 };
    return { t: 'fig', id, col: 1, view: VIEW, w: 408, h: 556, items: [
      { k: 'poly', pts: [G.A, G.B, G.C], close: true, fill: 'w', alpha: 0.04 }]
      .concat(o.circle ? [{ k: 'circle', o: G.M, r: 3, c: 'y' }] : [])
      .concat([
        Object.assign({ k: 'seg', a: G.B, b: G.E }, alt), Object.assign({ k: 'seg', a: G.C, b: G.F }, alt),
        { k: 'right', o: G.E, a: G.B, b: G.C, s: 14, c: 'g' }, { k: 'right', o: G.F, a: G.C, b: G.B, s: 14, c: 'g' },
        { k: 'angle', o: G.A, a: G.B, b: G.C, rp: 40, c: 'b', label: o.aLabel || '50°', lr: 22 },
        { k: 'seg', a: G.M, b: G.E, c: 'p' }, { k: 'seg', a: G.M, b: G.F, c: 'p' },
        tick(G.B, G.M), tick(G.M, G.C)])
      .concat(o.radTicks ? [tick(G.M, G.E), tick(G.M, G.F)] : [])
      .concat(o.extra || [])
      .concat([
        { k: 'pt', at: G.A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: G.B, name: 'B', dir: 'sw', r: 4 },
        { k: 'pt', at: G.C, name: 'C', dir: 'se', r: 4 }, { k: 'pt', at: G.E, name: 'E', dir: 'e', r: 4, c: 'p' },
        { k: 'pt', at: G.F, name: 'F', dir: 'w', r: 4, c: 'p' }, { k: 'pt', at: G.M, name: 'M', dir: 's', r: 4, c: 'p', off: 24 }]) };
  };

  HB.lesson({
    id: 'jmo-09', field: 'オリンピック型　幾何', title: 'オリンピックの考え方⑨　見えない円を見つける ― 垂線の足と中点がつくる角', level: 'JMO予選レベル（自作問題）', time: '目安 12〜18分',
    noDec: true,
    problem: { label: '問題',
      lead: '鋭角三角形 ABC において、$\\angle\\mathrm{BAC}=50^\\circ$ である。頂点 B から辺 CA に下ろした垂線の足を E、頂点 C から辺 AB に下ろした垂線の足を F とし、辺 BC の中点を M とする。$\\angle\\mathrm{EMF}$ は何度か。',
      parts: [],
      src: '※ 日本数学オリンピック（JMO）予選と同じ「答えだけを書く」形式の自作問題です' },
    points: POINTS,
    cols: [0.52, 0.48],
    steps: [
      { part: '問題', say: '今回は幾何です。三角形に垂線を2本と中点をかき入れて、角の大きさを求めます。まず問題文を読みましょう。（問題文は Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- めあて ----------
      { clear: true, part: 'めあて', say: '幾何の問題では、図にかかれていない **円** を自分で見つけると、角が一気に移せることがあります。円の見つけ方は、大きく2つです。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '見えない **円** を見つけて、角を移す\n見つけ方は **同じ長さ** と **直角** の2つ' }] },
      { say: '(ア) 1つの点から同じ長さのところに点がいくつかあれば、それらはその点を中心とする円の上にあります。円の定義そのものです。',
        add: [{ t: 'box', c: 'b', label: '(ア) 同じ長さ', text: '$\\mathrm{OP}=\\mathrm{OQ}=\\mathrm{OR}$ なら\nP, Q, R は **O が中心** の円の上' }, figK] },
      { say: '(イ) $\\angle\\mathrm{PXQ}=90^\\circ$ なら、X は PQ を直径とする円の上にあります。直角三角形では、斜辺の中点 M から3つの頂点までの長さが等しいからです。',
        add: [{ t: 'box', c: 'g', label: '(イ) 直角', text: '$\\angle\\mathrm{PXQ}=90^\\circ$ なら\nX は **PQ を直径** とする円の上\n（斜辺の中点 M で　MP＝MQ＝MX）' }],
        draw: [{ fig: 'k', items: figK2 }] },
      { say: '円が見つかれば、円周角の定理が使えます。中心角は円周角の2倍、同じ弧に対する円周角は等しい。これで角を移していきます。',
        add: [{ t: 'box', c: 'p', col: 1, label: '円が見つかったら', text: '**中心角＝2×円周角**\n同じ弧に対する円周角は等しい' }] },

      // ---------- ウォームアップ ----------
      { clear: true, part: 'ウォームアップ', say: 'ウォームアップです。四角形 ABCD で AB＝AC＝AD、$\\angle\\mathrm{BAC}=40^\\circ$ のとき、$\\angle\\mathrm{BDC}$ を求めます。二等辺三角形で角を追うと大変そうですが…',
        add: [{ t: 'h', text: 'ウォームアップ' },
          { t: 'p', text: '四角形 ABCD で　$\\mathrm{AB}=\\mathrm{AC}=\\mathrm{AD}$\n$\\angle\\mathrm{BAC}=40^\\circ$ のとき、$\\angle\\mathrm{BDC}$ は？' }, figW] },
      { say: 'A から B, C, D までの長さが等しいので、(ア) より B, C, D は **A が中心** の円の上にあります。図になかった円が見えてきました。',
        add: [{ t: 'm', tex: '\\mathrm{AB}=\\mathrm{AC}=\\mathrm{AD}', note: '(ア) 同じ長さ\n→ A が中心の円' }],
        draw: [{ fig: 'w', items: [{ k: 'circle', o: Aw, r: 3, c: 'y' }] }] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{BDC}$ は何度？',
        opts: ['$40^\\circ$', '$20^\\circ$', '$70^\\circ$', '$80^\\circ$'], ok: 1,
        why: { 0: '$\\angle\\mathrm{BAC}$ は弧 BC に対する中心角。D から見た円周角は、その半分です。', 2: '$70^\\circ$ は、二等辺三角形 ABC の底角 $\\angle\\mathrm{ABC}$ です。', 3: '中心角を2倍しています。円周角は中心角の **半分** です。' },
        good: '$\\angle\\mathrm{BDC}$ は弧 BC に対する円周角なので、中心角 $40^\\circ$ の半分で $20^\\circ$。D の位置によらない答えです。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{BDC}=\\frac12\\angle\\mathrm{BAC}=\\ans{20^\\circ}', note: '弧 BC の\n中心角と円周角' }],
        draw: [{ fig: 'w', items: [{ k: 'arc', o: Aw, r: 3, a1: 205, a2: 245, c: 'p', wd: 6 },
          { k: 'angle', o: Dw, a: Bw, b: Cw, rp: 72, c: 'p', label: '20°', lr: 46 }] }] } },

      // ---------- 本題：円を見つける ----------
      { clear: true, part: '本題', cols: [0.6, 0.4], say: '本題です。直角が2つ（E と F）と、中点 M。$\\angle\\mathrm{EMF}$ を三角形の角だけで追うのは大変です。かくれた円をさがしましょう。',
        add: [{ t: 'h', text: '本題　$\\angle\\mathrm{EMF}$ を求める' },
          { t: 'p', size: 'sm', text: '$\\angle\\mathrm{A}=50^\\circ$、$\\mathrm{BE}\\perp\\mathrm{CA}$、$\\mathrm{CF}\\perp\\mathrm{AB}$、M は辺 BC の中点' },
          tFig('m', T)] },
      { ask: { type: 'choice', q: 'E と F の **両方** が乗っている、図にかかれていない円は？',
        opts: ['BC を直径とする円', 'AB を直径とする円', 'A を中心とする円', '△ABC の外接円'], ok: 0,
        why: { 1: '$\\angle\\mathrm{AEB}=90^\\circ$ なので E は乗りますが、F は直線 AB 上の点なので乗りません。', 2: 'AE＝AF とはかぎりません（AB＝AC のときだけです）。', 3: 'E は辺 CA の途中の点。直線 CA と外接円が交わるのは A と C だけです。' },
        good: '$\\angle\\mathrm{BEC}=\\angle\\mathrm{BFC}=90^\\circ$。(イ) より、E も F も **BC を直径とする円** の上にあります。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{BEC}=\\angle\\mathrm{BFC}=90^\\circ', note: '(イ) 直角\n→ BC が直径の円' }],
        draw: [{ fig: 'm', items: [{ k: 'circle', o: T.M, r: 3, c: 'y' }] }] } },
      { say: 'この円の中心は、直径 BC の中点、つまり **M** です。MB＝MC＝ME＝MF（半径）。だから $\\angle\\mathrm{EMF}$ は、弧 EF に対する **中心角** です。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{MB}=\\mathrm{MC}=\\mathrm{ME}=\\mathrm{MF}', note: '円の中心は M' },
          { t: 'p', size: 'sm', text: '→ $\\angle\\mathrm{EMF}$ は、弧 EF に対する **中心角**' }],
        draw: [{ fig: 'm', items: [{ k: 'arc', o: T.M, r: 3, a1: 40, a2: 120, c: 'p', wd: 6 }, tick(T.M, T.E), tick(T.M, T.F),
          { k: 'angle', o: T.M, a: T.E, b: T.F, rp: 26, c: 'p' }] }] },
      { ask: { type: 'choice', q: '弧 EF に対する **円周角** になっているのは？',
        opts: ['$\\angle\\mathrm{EAF}$', '$\\angle\\mathrm{BEC}$', '$\\angle\\mathrm{EBF}$', '$\\angle\\mathrm{BFE}$'], ok: 2,
        why: { 0: 'A は円の上にありません（円の外）。円周角の頂点は、円の上の点です。', 1: '$\\angle\\mathrm{BEC}$ は、直径 BC に対する円周角（$90^\\circ$）です。', 3: '$\\angle\\mathrm{BFE}$ は、弧 BE に対する円周角です。' },
        good: 'B は円の上の点で、BE と BF が E, F を通ります。C から見た $\\angle\\mathrm{ECF}$ も、同じ弧 EF の円周角です。',
        draw: [{ fig: 'm', items: [{ k: 'angle', o: T.B, a: T.E, b: T.F, rp: 56, c: 'b' }, { k: 'angle', o: T.C, a: T.E, b: T.F, rp: 50, c: 'b' }] }] } },
      { say: '$\\angle\\mathrm{EBF}$ は △ABE で求めます。$\\angle\\mathrm{AEB}=90^\\circ$、$\\angle\\mathrm{A}=50^\\circ$ より $40^\\circ$。F は辺 AB 上なので $\\angle\\mathrm{EBF}=\\angle\\mathrm{ABE}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{EBF}=\\angle\\mathrm{ABE}=90^\\circ-50^\\circ=40^\\circ', note: '△ABE で\n$\\angle\\mathrm{AEB}=90^\\circ$' }],
        draw: [{ fig: 'm', items: [{ k: 'angle', o: T.B, a: T.E, b: T.F, rp: 56, c: 'b', label: '40°', lr: 20 }, { k: 'angle', o: T.C, a: T.E, b: T.F, rp: 50, c: 'b', label: '40°', lr: 20 }] }] },
      { ask: { type: 'choice', q: 'よって $\\angle\\mathrm{EMF}$ は何度？',
        opts: ['$50^\\circ$', '$100^\\circ$', '$40^\\circ$', '$80^\\circ$'], ok: 3,
        why: { 0: '$50^\\circ$ は $\\angle\\mathrm{EAF}$。A は円の上にないので、A では円周角の定理が使えません。', 1: '$\\angle\\mathrm{A}$ を2倍しています。2倍するのは、弧 EF に対する円周角 $\\angle\\mathrm{EBF}$ です。', 2: '$40^\\circ$ は円周角 $\\angle\\mathrm{EBF}$。$\\angle\\mathrm{EMF}$ は中心角なので、その2倍です。' },
        good: '中心角は円周角の2倍。$\\angle\\mathrm{EMF}=2\\times40^\\circ=80^\\circ$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\angle\\mathrm{EMF}=2\\angle\\mathrm{EBF}=80^\\circ' }],
        draw: [{ fig: 'm', items: [{ k: 'angle', o: T.M, a: T.E, b: T.F, rp: 26, c: 'p', label: '80°', lr: 18, size: 21 }] }] } },

      // ---------- 確かめ ----------
      { clear: true, part: '確かめ', cols: [0.6, 0.4], say: '答えだけを書く問題では、特別な形で確かめると安心です。答えは $\\angle\\mathrm{B}$, $\\angle\\mathrm{C}$ によらないはずなので、AB＝AC の形で計算してみます。',
        add: [{ t: 'h', text: '確かめ：特別な形（AB＝AC）で' },
          { t: 'p', size: 'sm', text: 'AB＝AC なら　$\\angle\\mathrm{B}=\\angle\\mathrm{C}=65^\\circ$\nMB＝MF（半径）なので、△MBF は二等辺三角形' },
          tFig('s', S, { circle: true, radTicks: true, altDash: true, extra: [{ k: 'angle', o: S.B, a: S.C, b: S.A, rp: 32, c: 'y', label: '65°', lr: 30, size: 20 }] })] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{BMF}$ は何度？（△MBF は MB＝MF の二等辺三角形）',
        opts: ['$65^\\circ$', '$50^\\circ$', '$25^\\circ$', '$130^\\circ$'], ok: 1,
        why: { 0: '$65^\\circ$ は底角 $\\angle\\mathrm{MBF}=\\angle\\mathrm{MFB}$。$\\angle\\mathrm{BMF}$ は頂角です。', 2: '$25^\\circ$ は円周角 $\\angle\\mathrm{BCF}$。中心角 $\\angle\\mathrm{BMF}$ はその2倍です。', 3: '$130^\\circ$ は底角2つの和。頂角は $180^\\circ$ からひきます。' },
        good: '$180^\\circ-2\\times65^\\circ=50^\\circ$。同じく $\\angle\\mathrm{CME}=50^\\circ$ なので、$\\angle\\mathrm{EMF}=180^\\circ-50^\\circ\\times2=80^\\circ$。合っています。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{BMF}=\\angle\\mathrm{CME}=180^\\circ-2\\times65^\\circ=50^\\circ' },
          { t: 'm', size: 'sm', tex: '\\angle\\mathrm{EMF}=180^\\circ-50^\\circ\\times2=80^\\circ', note: '本題の答えと一致' }],
        draw: [{ fig: 's', items: [{ k: 'angle', o: S.M, a: S.B, b: S.F, rp: 30, c: 'g', label: '50°', lr: 24, size: 19 },
          { k: 'angle', o: S.M, a: S.E, b: S.C, rp: 30, c: 'g', label: '50°', lr: 24, size: 19 },
          { k: 'angle', o: S.M, a: S.E, b: S.F, rp: 26, c: 'p', label: '80°', lr: 16, size: 19 }] }] } },
      { say: '一般の形でも同じ計算ができます。$\\angle\\mathrm{BMF}=180^\\circ-2\\angle\\mathrm{B}$、$\\angle\\mathrm{CME}=180^\\circ-2\\angle\\mathrm{C}$ から、$\\angle\\mathrm{B}$, $\\angle\\mathrm{C}$ が消えて $\\angle\\mathrm{A}$ だけが残ります。',
        add: [{ t: 'p', size: 'sm', text: '一般の形：$\\triangle\\mathrm{MBF}$, $\\triangle\\mathrm{MCE}$ も二等辺三角形なので' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\angle\\mathrm{EMF}&=180^\\circ-(180^\\circ-2\\angle\\mathrm{B})-(180^\\circ-2\\angle\\mathrm{C})\\\\ &=2(\\angle\\mathrm{B}+\\angle\\mathrm{C})-180^\\circ\\\\ &=180^\\circ-2\\angle\\mathrm{A}\\end{aligned}' },
          { t: 'p', size: 'sm', text: '$\\angle\\mathrm{B}+\\angle\\mathrm{C}=180^\\circ-\\angle\\mathrm{A}$ を使った。$\\angle\\mathrm{A}=50^\\circ$ なら $80^\\circ$' }] },

      // ---------- 考えてみよう ----------
      { clear: true, part: '考えてみよう', cols: [0.6, 0.4], say: '最後に、△MEF の形を調べます。ME と MF は、どちらも見つけた円の半径でした。',
        add: [{ t: 'h', text: '考えてみよう　△MEF の形' },
          { t: 'p', size: 'sm', text: '本題の図で、△MEF はどんな三角形か。\n3つの角の大きさも求めよう。' },
          tFig('t', T, { circle: true, radTicks: true, altDash: true, extra: [
            { k: 'poly', pts: [T.M, T.E, T.F], close: true, fill: 'p', alpha: 0.2, c: 'p' },
            { k: 'angle', o: T.M, a: T.E, b: T.F, rp: 26, c: 'p', label: '80°', lr: 18, size: 21 }] })] },
      { ask: { type: 'think', q: '△MEF はどんな三角形？ 3つの角の大きさも求めよう。',
        hint: 'ME＝MF（円の半径）。頂角 $\\angle\\mathrm{EMF}=80^\\circ$ はもうわかっている。',
        ans: 'ME＝MF の **二等辺三角形**。$\\angle\\mathrm{EMF}=80^\\circ$、$\\angle\\mathrm{MEF}=\\angle\\mathrm{MFE}=50^\\circ$（底角は $\\angle\\mathrm{A}$ と同じ）',
        after: '一般に頂角は $180^\\circ-2\\angle\\mathrm{A}$、底角は $\\angle\\mathrm{A}$。だから $\\angle\\mathrm{A}=60^\\circ$ なら △MEF は **正三角形** です。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{MEF}=\\angle\\mathrm{MFE}=\\frac{180^\\circ-80^\\circ}{2}=50^\\circ', note: 'ME＝MF' },
          { t: 'box', c: 'g', size: 'sm', label: '気づき', text: '底角はいつも $\\angle\\mathrm{A}$ と同じ\n$\\angle\\mathrm{A}=60^\\circ$ なら △MEF は **正三角形**' }],
        draw: [{ fig: 't', items: [{ k: 'angle', o: T.E, a: T.M, b: T.F, rp: 30, c: 'y', label: '50°', lr: 18, size: 19 },
          { k: 'angle', o: T.F, a: T.M, b: T.E, rp: 30, c: 'y', label: '50°', lr: 18, size: 19 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。見えない円は「同じ長さ」と「直角」から見つけます。次の回は、面積比とメネラウスの定理です。',
        add: [{ t: 'h', text: 'この回のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
