/* 数学Ⅰ 第4章 図形と計量 三角形への応用 ④：三角形の面積と内接円の半径
   例はすべて自作（例題1 b=4√2, c=7, A=135° → S=14／例題2 a=7, b=4, c=5 → cosA=−1/5, sinA=2√6/5, S=4√6, r=√6/2／
   考えてみよう b=15, c=7, A=60° → a=13, S=105√3/4, r=3√3/2）。値・誤答・図の座標（内心・接点）は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '**2辺とその間の角** で面積：$S=\\dfrac12bc\\sin A$（$=\\dfrac12ca\\sin B=\\dfrac12ab\\sin C$）。高さが $b\\sin A$ だから',
    '3辺だけのときは **余弦定理で $\\cos A$ → $\\sin^2A+\\cos^2A=1$ で $\\sin A$（正の方）→ 面積** の順',
    '内接円の半径 $r$：3つの三角形に分けて $S=\\dfrac12r(a+b+c)$。だから $r=\\dfrac{2S}{a+b+c}$'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];
  const foot = (P, Q, X) => { const ux = Q[0] - P[0], uy = Q[1] - P[1], t = ((X[0] - P[0]) * ux + (X[1] - P[1]) * uy) / (ux * ux + uy * uy); return [P[0] + t * ux, P[1] + t * uy]; };
  const names = (A, B, C, dA, dB, dC) => [{ k: 'pt', at: A, name: 'A', dir: dA || 'sw', r: 4 }, { k: 'pt', at: B, name: 'B', dir: dB || 'se', r: 4 }, { k: 'pt', at: C, name: 'C', dir: dC || 'n', r: 4 }];

  // 公式の図：A(0,0) B(6,0) C=4.4(cos50°, sin50°)、H は C から AB への垂線の足
  const hA = [0, 0], hB = [6, 0], hC = on(hA, 4.4, 50), hH = [hC[0], 0], hG = G3(hA, hB, hC);
  // 例題1：A(0,0) B(7,0) C=4√2(cos135°, sin135°)=(−4,4)。H(−4,0) は BA の延長上
  const eA = [0, 0], eB = [7, 0], eC = [-4, 4], eH = [-4, 0], eG = G3(eA, eB, eC);
  // 例題2：A(0,0) B(5,0) C=4(cosA, sinA)、cosA=−1/5。内心 I=(7A+4B+5C)/16=(1, √6/2)、r=√6/2
  const fA = [0, 0], fB = [5, 0], fC = [-0.8, Math.sqrt(16 - 0.64)], fG = G3(fA, fB, fC);
  const fI = [(7 * fA[0] + 4 * fB[0] + 5 * fC[0]) / 16, (7 * fA[1] + 4 * fB[1] + 5 * fC[1]) / 16], fr = Math.sqrt(6) / 2;
  const tAB = foot(fA, fB, fI), tBC = foot(fB, fC, fI), tCA = foot(fC, fA, fI);
  const ex2 = (extra) => [{ k: 'poly', pts: [fA, fB, fC], close: true, fill: 'w', alpha: 0.05 },
    sl(fA, fB, fG, '5'), sl(fA, fC, fG, '4'), sl(fB, fC, fG, '7')].concat(extra || [], names(fA, fB, fC, 's', 'se', 'n'));

  HB.lesson({
    id: 'm1d-11', field: '数学Ⅰ　図形と計量', title: '三角形の面積と内接円の半径', level: '三角形への応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC で $b=4\\sqrt2,\\ c=7,\\ A=135^\\circ$ のとき、面積 $S$ を求めよ。',
        '(2)　△ABC で $a=7,\\ b=4,\\ c=5$ のとき、$\\sin A$ と面積 $S$ を求めよ。',
        '(3)　(2) の三角形の内接円の半径 $r$ を求めよ。',
        '(4)　△ABC で $b=15,\\ c=7,\\ A=60^\\circ$ のとき、面積 $S$ と内接円の半径 $r$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '正弦定理・余弦定理で、三角形の辺と角が求められるようになりました。この時間は、三角比を使って **面積** と **内接円の半径** を求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**2辺とその間の角** から三角形の面積を求められる\n3辺から面積と **内接円の半径** を求められる' }] },

      // ---------- 面積の公式 ----------
      { clear: true, part: '三角形の面積', say: '中学では、面積を「底辺 × 高さ ÷ 2」で求めました。AB を底辺にすると、高さは C から AB への垂線 CH です。CH を三角比で表します。',
        add: [{ t: 'h', text: '三角形の面積' },
          { t: 'm', tex: 'S=\\frac12\\times\\mathrm{AB}\\times\\mathrm{CH}', note: '底辺 × 高さ ÷ 2' },
          { t: 'fig', id: 'fh', col: 1, view: [-0.9, -1.0, 6.9, 4.3], w: 600, h: 408, items: [
            { k: 'poly', pts: [hA, hB, hC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: hC, b: hH, c: 'p', dash: true }, { k: 'right', o: hH, a: hB, b: hC, s: 16, c: 'p' },
            { k: 'angle', o: hA, a: hB, b: hC, rp: 40, c: 'y', label: 'A', lr: 16 },
            { k: 'label', at: [4.6, 0], text: 'c', size: 26, dy: 24 }, sl(hA, hC, hG, 'b', 'y'), sl(hB, hC, hG, 'a'),
            { k: 'pt', at: hH, name: 'H', dir: 's', r: 4, c: 'p' }].concat(names(hA, hB, hC)) }] },
      { ask: { type: 'choice', q: '高さ CH を、$b$ と角 A で表すと？',
        opts: ['$b\\cos A$', '$c\\sin A$', '$a\\sin A$', '$b\\sin A$'], ok: 3,
        why: { 0: 'cos は「となりの辺 ÷ 斜辺」。$b\\cos A$ は AH の長さです。', 1: '直角三角形 ACH の斜辺は AC $=b$。$c$ ではありません。', 2: 'BC $=a$ は、直角三角形 ACH の辺ではありません。' },
        good: '直角三角形 ACH で $\\sin A=\\dfrac{\\mathrm{CH}}{b}$。だから CH $=b\\sin A$。',
        add: [{ t: 'm', tex: 'S=\\frac12\\cdot c\\cdot b\\sin A=\\hy{\\frac12bc\\sin A}' }] } },
      { say: 'A が鈍角でも、H が BA の延長上にくるだけで、CH $=b\\sin(180^\\circ-A)=b\\sin A$。どの2辺でもよく、**2辺とその間の角** で面積が出ます。',
        add: [{ t: 'box', c: 'y', label: '面積', tex: '\\begin{aligned}S&=\\frac12bc\\sin A\\\\ &=\\frac12ca\\sin B=\\frac12ab\\sin C\\end{aligned}' },
          { t: 'p', size: 'sm', text: 'A が鈍角でも同じ式（$\\sin(180^\\circ-A)=\\sin A$）' }] },

      // ---------- 例題1 ----------
      { clear: true, part: '例題1', say: '例題1。$b=4\\sqrt2,\\ c=7,\\ A=135^\\circ$ の面積です。A が鈍角なので、高さ CH は三角形の外にとります。$\\sin135^\\circ$ は正の値です。',
        add: [{ t: 'h', text: '例題1　2辺とその間の角' },
          { t: 'p', text: '△ABC で $b=4\\sqrt2,\\ c=7,\\ A=135^\\circ$ のとき、面積 $S$ を求めよ。' },
          { t: 'm', tex: 'S=\\frac12\\cdot4\\sqrt2\\cdot7\\cdot\\sin135^\\circ' },
          { t: 'fig', id: 'f1', col: 1, view: [-5.4, -1.2, 8.0, 5.2], w: 620, h: 296, items: [
            { k: 'poly', pts: [eA, eB, eC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: eH, b: eA, c: 'd', dash: true }, { k: 'seg', a: eC, b: eH, c: 'p', dash: true }, { k: 'right', o: eH, a: eA, b: eC, s: 14, c: 'p' },
            { k: 'angle', o: eA, a: eB, b: eC, rp: 30, c: 'y', label: '135°', lr: 30 },
            sl(eA, eB, eG, '7', 'y'), sl(eA, eC, eG, '4√2', 'y', 30),
            { k: 'pt', at: eH, name: 'H', dir: 's', r: 4, c: 'p' }].concat(names(eA, eB, eC, 's', 'se', 'n')) }] },
      { ask: { type: 'choice', q: '面積 $S$ は？',
        opts: ['$28$', '$14$', '$-14$', '$14\\sqrt2$'], ok: 1,
        why: { 0: '$\\dfrac12$ をかけ忘れています。', 2: '$\\cos135^\\circ$ を使っています。面積の公式は sin。面積が負になることはありません。', 3: '$\\sin135^\\circ=\\dfrac{\\sqrt2}{2}$ をかけ忘れています。' },
        good: '$\\sin135^\\circ=\\dfrac{\\sqrt2}{2}$ なので $S=\\dfrac12\\cdot4\\sqrt2\\cdot7\\cdot\\dfrac{\\sqrt2}{2}=14$。',
        add: [{ t: 'm', tex: '\\hphantom{S}=\\frac12\\cdot4\\sqrt2\\cdot7\\cdot\\frac{\\sqrt2}{2}=14' }, { t: 'ans', label: '答', tex: 'S=14' }] } },

      // ---------- 例題2 ----------
      { clear: true, part: '例題2　3辺から面積', say: '例題2。3辺 $a=7,\\ b=4,\\ c=5$ の三角形です。角が1つもわかっていないので、**余弦定理 → cos → sin → 面積** の順に進みます。',
        add: [{ t: 'h', text: '例題2　3辺から面積' },
          { t: 'p', text: '△ABC で $a=7,\\ b=4,\\ c=5$ のとき、面積 $S$ を求めよ。' },
          { t: 'm', tex: '\\cos A=\\frac{4^2+5^2-7^2}{2\\cdot4\\cdot5}=\\frac{-8}{40}=-\\frac15' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.8, -1.0, 6.0, 4.8], w: 560, h: 416, items: ex2([{ k: 'angle', o: fA, a: fB, b: fC, rp: 30, c: 'y', label: 'A', lr: 16 }]) }] },
      { ask: { type: 'choice', q: '$\\cos A=-\\dfrac15$ のとき、$\\sin A$ は？',
        opts: ['$-\\dfrac{2\\sqrt6}{5}$', '$\\dfrac{24}{25}$', '$\\dfrac{2\\sqrt6}{5}$', '$\\dfrac45$'], ok: 2,
        why: { 0: '$0^\\circ<A<180^\\circ$ では $\\sin A>0$。cos が負でも sin は正です。', 1: 'それは $\\sin^2A$ の値。最後に $\\sqrt{\\ }$ をとります。', 3: '$\\sin^2A=1-\\cos^2A=1-\\dfrac1{25}$。2乗を忘れて $1-\\dfrac15$ にしています。' },
        good: '$\\sin^2A=1-\\left(-\\dfrac15\\right)^2=\\dfrac{24}{25}$、$\\sin A>0$ なので $\\sin A=\\dfrac{2\\sqrt6}{5}$。',
        add: [{ t: 'm', tex: '\\sin A=\\sqrt{1-\\frac1{25}}=\\frac{2\\sqrt6}{5}', note: '$\\sin A>0$' }] } },
      { say: 'あとは公式に入れるだけ。$S=\\frac12\\cdot4\\cdot5\\cdot\\frac{2\\sqrt6}{5}=4\\sqrt6$ です。',
        add: [{ t: 'm', tex: 'S=\\frac12\\cdot4\\cdot5\\cdot\\frac{2\\sqrt6}{5}=4\\sqrt6' }, { t: 'ans', label: '答', tex: 'S=4\\sqrt6' }] },

      // ---------- 内接円 ----------
      { clear: true, cols: [0.56, 0.44], part: '内接円の半径', say: '3つの辺すべてに接する円を **内接円** といい、半径を $r$ で表します。中心 I と3つの頂点を結ぶと、三角形は3つに分かれます。',
        add: [{ t: 'h', text: '内接円の半径 r' },
          { t: 'box', c: 'b', label: '内接円', text: '3つの辺すべてに接する円\n中心 I から各辺への距離は、どれも $r$' },
          { t: 'fig', id: 'f3', col: 1, view: [-1.6, -0.9, 5.9, 4.7], w: 600, h: 448, items: ex2([
            { k: 'circle', o: fI, r: fr, c: 'b' },
            { k: 'seg', a: fI, b: fA, c: 'd', dash: true }, { k: 'seg', a: fI, b: fB, c: 'd', dash: true }, { k: 'seg', a: fI, b: fC, c: 'd', dash: true },
            { k: 'seg', a: fI, b: tAB, c: 'p' }, { k: 'seg', a: fI, b: tBC, c: 'p' }, { k: 'seg', a: fI, b: tCA, c: 'p' },
            { k: 'right', o: tAB, a: fB, b: fI, s: 12, c: 'p' }, { k: 'right', o: tBC, a: fC, b: fI, s: 12, c: 'p' }, { k: 'right', o: tCA, a: fA, b: fI, s: 12, c: 'p' },
            { k: 'label', at: [(fI[0] + tAB[0]) / 2, (fI[1] + tAB[1]) / 2], text: 'r', c: 'p', size: 24, dx: 12 },
            { k: 'pt', at: fI, name: 'I', dir: 'ne', r: 4, c: 'b' }]) }] },
      { say: '3つの三角形 IBC・ICA・IAB は、底辺がそれぞれ $a,\\ b,\\ c$、高さがどれも $r$。面積をたすと、$S=\\frac12r(a+b+c)$ になります。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\frac12ar+\\frac12br+\\frac12cr=\\hy{\\frac12r(a+b+c)}' },
          { t: 'm', tex: 'r=\\frac{2S}{a+b+c}', note: '$r$ について解く' }],
        draw: [{ fig: 'f3', items: [
          { k: 'poly', pts: [fI, fB, fC], close: true, fill: 'y', alpha: 0.16, noStroke: true },
          { k: 'poly', pts: [fI, fC, fA], close: true, fill: 'b', alpha: 0.18, noStroke: true },
          { k: 'poly', pts: [fI, fA, fB], close: true, fill: 'g', alpha: 0.16, noStroke: true }] }] },
      { ask: { type: 'choice', q: '例題2（$a=7,\\ b=4,\\ c=5,\\ S=4\\sqrt6$）の内接円の半径 $r$ は？',
        opts: ['$\\dfrac{\\sqrt6}{2}$', '$\\dfrac{\\sqrt6}{4}$', '$\\sqrt6$', '$\\dfrac{3\\sqrt6}{4}$'], ok: 0,
        why: { 1: '$\\dfrac12$ を忘れて $S=r(a+b+c)$ としています。', 2: '$2S=8\\sqrt6$ を、$a+b+c$ の半分の 8 で割っています。', 3: '$3S$ にするのは、立体の体積 $V=\\dfrac13Sh$ と混ざっています。' },
        good: '$4\\sqrt6=\\dfrac12r\\cdot16$ より $r=\\dfrac{4\\sqrt6}{8}=\\dfrac{\\sqrt6}{2}$。',
        add: [{ t: 'm', tex: '4\\sqrt6=\\frac12r(7+4+5)=8r\\qquad r=\\ans{\\frac{\\sqrt6}{2}}' }] } },
      { ask: { type: 'think', q: '△ABC で $b=15,\\ c=7,\\ A=60^\\circ$ のとき、面積 $S$ と内接円の半径 $r$ を求めよう。',
        hint: 'まず $S=\\dfrac12bc\\sin A$。$r$ には $a$ が必要なので、余弦定理で $a$ を出す。',
        ans: '$S=\\dfrac{105\\sqrt3}{4}$、$a=13$、$r=\\dfrac{3\\sqrt3}{2}$',
        after: '$a^2=225+49-105=169$ で $a=13$。$r=\\dfrac{2S}{a+b+c}=\\dfrac{105\\sqrt3}{2}\\div35=\\dfrac{3\\sqrt3}{2}$。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、**円に内接する四角形** の辺や面積を、この章の道具を組み合わせて求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
