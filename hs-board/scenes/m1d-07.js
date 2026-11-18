/* 数学Ⅰ 第4章 図形と計量 三角比 ⑦：三角比を含む方程式・不等式（0°≦θ≦180°）
   例はすべて自作。解は python3（sympy と、0°〜180° を 1° ずつ調べる数値計算）で検算ずみ。
   図は単位円（半径 1 の半円）。sin は直線 y=k、cos は直線 x=k、tan は原点を通る直線との交点を見る。 */
(function () {
  const POINTS = [
    '$\\sin\\theta=k$ は単位円と **直線 $y=k$** の交点（$0<k<1$ なら解は2つ：$\\theta$ と $180^\\circ-\\theta$）。$\\cos\\theta=k$ は **直線 $x=k$** の交点（解は1つ）',
    '$\\tan\\theta=k$ は、原点と点 $(1,\\ k)$ や $(-1,\\ -k)$ を通る直線と単位円の交点。式は先に「三角比＝数」の形に整理する',
    '不等式は、単位円で条件を満たす **弧** をさがし、両はしの角で答える。等号が入るか（≦ か <）に注意'
  ];
  const H3 = Math.sqrt(3) / 2, H2 = Math.SQRT1_2;
  // 単位円の図（view は横 3、縦はふつう 1.77）
  const uc = (id, items, o) => {
    o = o || {}; const v = o.view || [-1.5, -0.42, 1.5, 1.35];
    return { t: 'fig', id, col: 1, view: v, w: o.w || 660, h: o.h || Math.round((o.w || 660) * (v[3] - v[1]) / (v[2] - v[0])), items: [
      { k: 'axes', tx: [[1, '1'], [-1, '−1']], ty: [] }, { k: 'arc', o: [0, 0], r: 1, a1: 0, a2: 180, c: 'w', wd: 3 }].concat(items) };
  };
  const ray = (x, y, c) => ({ k: 'seg', a: [0, 0], b: [x, y], c: c || 'y', wd: 3.5 });

  HB.lesson({
    id: 'm1d-07', field: '数学Ⅰ　図形と計量', title: '三角比を含む方程式・不等式', level: '三角比', time: '目安 8分',
    problem: { label: '例題', lead: '$0^\\circ\\le\\theta\\le180^\\circ$ のとき、次の方程式・不等式を解け。',
      parts: ['(1)　$\\sin\\theta=\\dfrac12$', '(2)　$\\cos\\theta=-\\dfrac{\\sqrt2}{2}$', '(3)　$\\tan\\theta=-\\sqrt3$', '(4)　$2\\sin\\theta-\\sqrt2=0$', '(5)　$\\sin\\theta>\\dfrac12$', '(6)　$\\cos\\theta\\le\\dfrac12$', '(7)　$\\sin\\theta\\le\\dfrac{\\sqrt3}{2}$'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: '前の時間までは、角から三角比の値を求めました。この時間は逆に、三角比の値から **角 $\\theta$ を求めます**。単位円を使うと、解のもれがなくなります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$0^\\circ\\le\\theta\\le180^\\circ$ で、三角比を含む方程式・不等式を、\n単位円を使って解ける' }] },

      // ---------- sinθ = 1/2 ----------
      { clear: true, part: 'sin の方程式', say: '$\\sin\\theta=\\dfrac12$ を解きます。単位円では、$\\sin\\theta$ は点の **y 座標**。だから、直線 $y=\\dfrac12$ と半円の交点をさがします。',
        add: [{ t: 'h', text: '$\\sin\\theta=\\dfrac12$' },
          { t: 'p', size: 'sm', text: '単位円で　$\\sin\\theta$ ＝ 点の **y 座標**\n→ 直線 $y=\\dfrac12$ と半円の交点を見る' },
          uc('f1', [{ k: 'seg', a: [-1.4, 0.5], b: [1.4, 0.5], c: 'p', dash: true }, { k: 'label', at: [1.42, 0.5], text: 'y=1/2', c: 'p', size: 22, anchor: 'end', dy: -20 }])] },
      { ask: { type: 'choice', q: '$0^\\circ\\le\\theta\\le180^\\circ$ で、$\\sin\\theta=\\dfrac12$ の解は？',
        opts: ['$\\theta=30^\\circ$ だけ', '$\\theta=60^\\circ,\\ 120^\\circ$', '$\\theta=30^\\circ,\\ 150^\\circ$', '$\\theta=150^\\circ$ だけ'], ok: 2,
        why: { 0: '直線と半円の交点は2つ。左側の交点（鈍角）をわすれています。', 1: 'それは $\\sin\\theta=\\dfrac{\\sqrt3}{2}$ の解です。', 3: '右側の交点 $30^\\circ$ もあります。' },
        good: '交点は2つ。$30^\\circ$ と、$180^\\circ-30^\\circ=150^\\circ$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=30^\\circ,\\ 150^\\circ' }],
        draw: [{ fig: 'f1', items: [ray(H3, 0.5), ray(-H3, 0.5),
          { k: 'angle', o: [0, 0], a: [1, 0], b: [H3, 0.5], rp: 64, label: '30°', lr: 24, size: 22, c: 'y' },
          { k: 'angle', o: [0, 0], a: [1, 0], b: [-H3, 0.5], rp: 36, label: '150°', lr: 22, size: 22, c: 'g' },
          { k: 'pt', at: [H3, 0.5], c: 'y', r: 7 }, { k: 'pt', at: [-H3, 0.5], c: 'y', r: 7 }] }] } },

      // ---------- cosθ = −√2/2 ----------
      { clear: true, part: 'cos の方程式', say: '$\\cos\\theta$ は点の **x 座標**。$\\cos\\theta=-\\dfrac{\\sqrt2}{2}$ なら、縦の直線 $x=-\\dfrac{\\sqrt2}{2}$ と半円の交点を見ます。縦の直線なので、交点は1つです。',
        add: [{ t: 'h', text: '$\\cos\\theta=-\\dfrac{\\sqrt2}{2}$' },
          { t: 'p', size: 'sm', text: '単位円で　$\\cos\\theta$ ＝ 点の **x 座標**\n→ 直線 $x=-\\dfrac{\\sqrt2}{2}$ と半円の交点を見る' },
          { t: 'p', size: 'xs', text: '$-\\dfrac{\\sqrt2}{2}=-\\dfrac{1}{\\sqrt2}\\fallingdotseq-0.71$' },
          uc('f2', [{ k: 'seg', a: [-H2, -0.3], b: [-H2, 1.25], c: 'p', dash: true }, { k: 'label', at: [-H2, 1.25], text: 'x=−√2/2', c: 'p', size: 22, anchor: 'start', dx: 10, dy: 4 }])] },
      { ask: { type: 'choice', q: '$\\cos\\theta=-\\dfrac{\\sqrt2}{2}$ の解は？',
        opts: ['$\\theta=45^\\circ$', '$\\theta=135^\\circ$', '$\\theta=45^\\circ,\\ 135^\\circ$', '$\\theta=120^\\circ$'], ok: 1,
        why: { 0: '$\\cos45^\\circ=+\\dfrac{\\sqrt2}{2}$。cos が負なので鈍角です。', 2: 'sin のときとちがい、縦の直線と半円の交点は1つだけ。', 3: '$\\cos120^\\circ=-\\dfrac12$ です。' },
        good: '交点は $\\left(-\\dfrac{\\sqrt2}{2},\\ \\dfrac{\\sqrt2}{2}\\right)$。x 軸の負の向きと $45^\\circ$ なので $\\theta=135^\\circ$。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=135^\\circ' }],
        draw: [{ fig: 'f2', items: [ray(-H2, H2),
          { k: 'angle', o: [0, 0], a: [1, 0], b: [-H2, H2], rp: 36, label: '135°', lr: 24, size: 22, c: 'g' },
          { k: 'angle', o: [0, 0], a: [-1, 0], b: [-H2, H2], rp: 64, label: '45°', lr: 24, size: 22, c: 'y' },
          { k: 'pt', at: [-H2, H2], c: 'y', r: 7 }] }] } },

      // ---------- tanθ = −√3 ----------
      { clear: true, part: 'tan の方程式', say: '$\\tan\\theta=\\dfrac yx$ は、原点と点 P を結ぶ直線の **傾き** です。$\\tan\\theta=-\\sqrt3$ なら、傾き $-\\sqrt3$ の直線、つまり原点と点 $(-1,\\ \\sqrt3)$ を通る直線を引きます。',
        add: [{ t: 'h', text: '$\\tan\\theta=-\\sqrt3$' },
          { t: 'p', size: 'sm', text: '$\\tan\\theta=\\dfrac yx$ ＝ 直線 OP の **傾き**\n→ 原点と点 $(-1,\\ \\sqrt3)$ を通る直線' },
          uc('f3', [{ k: 'seg', a: [0, 0], b: [-1.08, 1.08 * 2 * H3], c: 'p', dash: true },
            { k: 'pt', at: [-1, 2 * H3], name: '(−1, √3)', dir: 'e', c: 'p', r: 6 }], { view: [-1.5, -0.42, 1.5, 1.95], w: 560 })] },
      { ask: { type: 'choice', q: '$\\tan\\theta=-\\sqrt3$ の解は？',
        opts: ['$\\theta=60^\\circ$', '$\\theta=150^\\circ$', '$\\theta=60^\\circ,\\ 120^\\circ$', '$\\theta=120^\\circ$'], ok: 3,
        why: { 0: '$\\tan60^\\circ=+\\sqrt3$。tan が負なので鈍角です。', 1: '$\\tan150^\\circ=-\\dfrac{1}{\\sqrt3}$ です。', 2: '原点を通る直線と半円の交点は1つ。$60^\\circ$ は tan が正です。' },
        good: '直線と半円の交点は $\\left(-\\dfrac12,\\ \\dfrac{\\sqrt3}{2}\\right)$。x 軸の負の向きと $60^\\circ$ なので $\\theta=120^\\circ$。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=120^\\circ' }],
        draw: [{ fig: 'f3', items: [ray(-0.5, H3),
          { k: 'angle', o: [0, 0], a: [1, 0], b: [-0.5, H3], rp: 36, label: '120°', lr: 24, size: 22, c: 'g' },
          { k: 'angle', o: [0, 0], a: [-1, 0], b: [-0.5, H3], rp: 62, label: '60°', lr: 22, size: 22, c: 'y' },
          { k: 'pt', at: [-0.5, H3], c: 'y', r: 7 }] }] } },

      // ---------- 整理してから ----------
      { clear: true, part: '整理してから', add: [{ t: 'h', text: '式を整理してから解く' },
          { t: 'p', size: 'sm', text: 'まず「$\\sin\\theta$ ＝ 数」の形にする' },
          uc('f4', [{ k: 'seg', a: [-1.4, H2], b: [1.4, H2], c: 'p', dash: true }])],
        ask: { type: 'think', q: '$0^\\circ\\le\\theta\\le180^\\circ$ で、$2\\sin\\theta-\\sqrt2=0$ を解こう。',
          hint: '$\\sin\\theta=\\dfrac{\\sqrt2}{2}$ に直してから、直線 $y=\\dfrac{\\sqrt2}{2}$ と半円の交点を見る。',
          ans: '$\\sin\\theta=\\dfrac{\\sqrt2}{2}$ より、$\\theta=45^\\circ,\\ 135^\\circ$',
          after: 'sin の方程式は、$0<\\sin\\theta<1$ なら解が2つ（$\\theta$ と $180^\\circ-\\theta$）。',
          add: [{ t: 'm', tex: '2\\sin\\theta=\\sqrt2\\ \\ \\text{より}\\ \\ \\sin\\theta=\\frac{\\sqrt2}{2}' },
            { t: 'ans', label: '答', tex: '\\theta=45^\\circ,\\ 135^\\circ' }],
          draw: [{ fig: 'f4', items: [ray(H2, H2), ray(-H2, H2),
            { k: 'angle', o: [0, 0], a: [1, 0], b: [H2, H2], rp: 60, label: '45°', lr: 24, size: 22, c: 'y' },
            { k: 'angle', o: [0, 0], a: [1, 0], b: [-H2, H2], rp: 34, label: '135°', lr: 22, size: 22, c: 'g' },
            { k: 'pt', at: [H2, H2], c: 'y', r: 7 }, { k: 'pt', at: [-H2, H2], c: 'y', r: 7 }] }] } },

      // ---------- 不等式 sinθ > 1/2 ----------
      { clear: true, part: 'sin の不等式', say: '不等式 $\\sin\\theta>\\dfrac12$。y 座標が $\\dfrac12$ より **大きい** 点、つまり直線 $y=\\dfrac12$ より **上** にある弧（黄）をさがします。',
        add: [{ t: 'h', text: '$\\sin\\theta>\\dfrac12$' },
          { t: 'p', size: 'sm', text: 'y 座標が $\\dfrac12$ より大きい\n→ 直線 $y=\\dfrac12$ より **上** の弧' },
          uc('f5', [{ k: 'seg', a: [-1.4, 0.5], b: [1.4, 0.5], c: 'p', dash: true },
            { k: 'arc', o: [0, 0], r: 1, a1: 30, a2: 150, c: 'y', wd: 8 },
            { k: 'pt', at: [H3, 0.5], open: true, c: 'y', r: 7 }, { k: 'pt', at: [-H3, 0.5], open: true, c: 'y', r: 7 }])] },
      { ask: { type: 'choice', q: '$0^\\circ\\le\\theta\\le180^\\circ$ で、$\\sin\\theta>\\dfrac12$ の解は？',
        opts: ['$30^\\circ<\\theta<150^\\circ$', '$\\theta>30^\\circ$', '$\\theta<30^\\circ,\\ 150^\\circ<\\theta$', '$30^\\circ\\le\\theta\\le150^\\circ$'], ok: 0,
        why: { 1: '$150^\\circ$ をこえると、y 座標はまた $\\dfrac12$ より小さくなります。', 2: 'それは $\\sin\\theta<\\dfrac12$（直線より下）の解です。', 3: '$\\theta=30^\\circ,\\ 150^\\circ$ では $\\sin\\theta=\\dfrac12$ ちょうど。「>」なので入りません。' },
        good: '直線より上の弧は、$30^\\circ$ と $150^\\circ$ の間。端は入りません（○）。',
        add: [{ t: 'ans', label: '答', tex: '30^\\circ<\\theta<150^\\circ' },
          { t: 'fig', id: 'n5', view: [-14, -0.9, 200, 1.3], w: 700, h: 165, items: [
            { k: 'numline', ticks: [[0, '0°'], [30, '30°'], [150, '150°'], [180, '180°']], size: 22 },
            { k: 'range', from: 30, to: 150, fromIn: false, toIn: false, c: 'y', label: 'θ の範囲', h: 40 }] }],
        draw: [{ fig: 'f5', items: [
          { k: 'angle', o: [0, 0], a: [1, 0], b: [H3, 0.5], rp: 64, label: '30°', lr: 24, size: 22, c: 'y' },
          { k: 'angle', o: [0, 0], a: [1, 0], b: [-H3, 0.5], rp: 36, label: '150°', lr: 22, size: 22, c: 'g' }] }] } },

      // ---------- 不等式 cosθ ≦ 1/2 ----------
      { clear: true, part: 'cos の不等式', say: '$\\cos\\theta\\le\\dfrac12$。x 座標が $\\dfrac12$ 以下の点、つまり直線 $x=\\dfrac12$ の上と、その **左側** にある弧（黄）です。等号があるので、端もふくみます。',
        add: [{ t: 'h', text: '$\\cos\\theta\\le\\dfrac12$' },
          { t: 'p', size: 'sm', text: 'x 座標が $\\dfrac12$ 以下\n→ 直線 $x=\\dfrac12$ の上と **左側** の弧（端もふくむ）' },
          uc('f6', [{ k: 'seg', a: [0.5, -0.3], b: [0.5, 1.25], c: 'p', dash: true }, { k: 'label', at: [0.5, 1.25], text: 'x=1/2', c: 'p', size: 22, anchor: 'start', dx: 10, dy: 4 },
            { k: 'arc', o: [0, 0], r: 1, a1: 60, a2: 180, c: 'y', wd: 8 },
            { k: 'pt', at: [0.5, H3], c: 'y', r: 7 }, { k: 'pt', at: [-1, 0], c: 'y', r: 7 }])] },
      { ask: { type: 'choice', q: '$0^\\circ\\le\\theta\\le180^\\circ$ で、$\\cos\\theta\\le\\dfrac12$ の解は？',
        opts: ['$0^\\circ\\le\\theta\\le60^\\circ$', '$60^\\circ\\le\\theta\\le180^\\circ$', '$60^\\circ<\\theta\\le180^\\circ$', '$60^\\circ\\le\\theta\\le120^\\circ$'], ok: 1,
        why: { 0: 'それは $\\cos\\theta\\ge\\dfrac12$（直線の右側）の解。cos は角が大きいほど小さくなります。', 2: '「≦」なので、$\\cos\\theta=\\dfrac12$ となる $60^\\circ$ もふくみます。', 3: '$120^\\circ$ より大きい角も、x 座標は $\\dfrac12$ 以下（負）です。' },
        good: '直線 $x=\\dfrac12$ の上と左側の弧は、$60^\\circ$ から $180^\\circ$ まで（両はしをふくむ）。',
        add: [{ t: 'ans', label: '答', tex: '60^\\circ\\le\\theta\\le180^\\circ' }],
        draw: [{ fig: 'f6', items: [{ k: 'angle', o: [0, 0], a: [1, 0], b: [0.5, H3], rp: 48, label: '60°', lr: 24, size: 22, c: 'y' }] }] } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　答えが2つの範囲になる' },
          uc('f7', [{ k: 'seg', a: [-1.4, H3], b: [1.4, H3], c: 'p', dash: true }, { k: 'label', at: [1.42, H3], text: 'y=√3/2', c: 'p', size: 22, anchor: 'end', dy: -20 }])],
        ask: { type: 'think', q: '$0^\\circ\\le\\theta\\le180^\\circ$ で、$\\sin\\theta\\le\\dfrac{\\sqrt3}{2}$ を解こう。',
          hint: '$\\sin\\theta=\\dfrac{\\sqrt3}{2}$ となるのは $60^\\circ,\\ 120^\\circ$。直線 $y=\\dfrac{\\sqrt3}{2}$ より **下** の弧（と直線上）は、右と左の2か所。',
          ans: '$0^\\circ\\le\\theta\\le60^\\circ,\\ \\ 120^\\circ\\le\\theta\\le180^\\circ$',
          after: '弧が2つに分かれるので、答えも2つの範囲。$60^\\circ$ と $120^\\circ$ の間（直線より上）は入りません。',
          add: [{ t: 'p', size: 'sm', text: '直線 $y=\\dfrac{\\sqrt3}{2}$ の上と **下** の弧（両はしをふくむ）' },
            { t: 'ans', label: '答', tex: '0^\\circ\\le\\theta\\le60^\\circ,\\ \\ 120^\\circ\\le\\theta\\le180^\\circ' }],
          draw: [{ fig: 'f7', items: [
            { k: 'arc', o: [0, 0], r: 1, a1: 0, a2: 60, c: 'y', wd: 8 }, { k: 'arc', o: [0, 0], r: 1, a1: 120, a2: 180, c: 'y', wd: 8 },
            { k: 'pt', at: [0.5, H3], c: 'y', r: 7, name: '60°', dir: 'sw', off: 30 }, { k: 'pt', at: [-0.5, H3], c: 'y', r: 7, name: '120°', dir: 'se', off: 30 },
            { k: 'pt', at: [1, 0], c: 'y', r: 7, name: '0°', dir: 'ne' }, { k: 'pt', at: [-1, 0], c: 'y', r: 7, name: '180°', dir: 'nw' }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角比の値と角を行き来できるようになりました。次の時間からは、三角比を三角形に使い、**正弦定理** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
