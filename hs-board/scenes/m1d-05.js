/* 数学Ⅰ 第4章 図形と計量 三角比 ⑤：三角比の拡張 ― 0° から 180° まで
   半径 r の半円上の点 P(x, y) で定義する。120°・150° は半径 2、135° は半径 √2、0°・90°・180° は半径 1 で考える。
   値・符号・誤答は python3（sympy）で検算ずみ。図の点の座標も同じ値（√3≒1.732）で置いている。 */
(function () {
  const POINTS = [
    '原点 O が中心、半径 r の半円の上の点 P(x, y) で　$\\sin\\theta=\\dfrac yr$、$\\cos\\theta=\\dfrac xr$、$\\tan\\theta=\\dfrac yx$。鋭角では、直角三角形での定義と同じ値',
    '鈍角では P の x 座標が負なので、**cos と tan は負**、sin は正。$0^\\circ,\\ 90^\\circ,\\ 180^\\circ$ も座標で決まる（$\\tan90^\\circ$ は値がない）',
    '$120^\\circ,\\ 135^\\circ,\\ 150^\\circ$ は、x 軸の負の向きとの角（$60^\\circ,\\ 45^\\circ,\\ 30^\\circ$）で三角定規の形をつくり、P の座標を読む'
  ];
  const R3 = Math.sqrt(3), R2 = Math.sqrt(2);
  const semi = (r, tx, ty) => [{ k: 'axes', tx: tx || [], ty: ty || [] }, { k: 'arc', o: [0, 0], r, a1: 0, a2: 180, c: 'w', wd: 3 }];
  // 鈍角の点 P(px, py)：OP（黄）・P から x 軸への垂線（桃）・OH（青）、直角の印、角の弧
  const obtuse = (r, px, py, big, small, lab) => [
    { k: 'seg', a: [0, 0], b: [px, py], c: 'y', wd: 4 },
    { k: 'seg', a: [px, py], b: [px, 0], c: 'p', wd: 4 },
    { k: 'seg', a: [0, 0], b: [px, 0], c: 'b', wd: 5 },
    { k: 'right', o: [px, 0], a: [0, 0], b: [px, py], s: 16 },
    { k: 'angle', o: [0, 0], a: [r, 0], b: [px, py], rp: 34, label: big, lr: 22, size: 22, c: 'g' },
    { k: 'angle', o: [0, 0], a: [-r, 0], b: [px, py], rp: 58, label: small, lr: 22, size: 22, c: 'y' }].concat(lab || []);

  HB.lesson({
    id: 'm1d-05', field: '数学Ⅰ　図形と計量', title: '三角比の拡張 ― 0° から 180° まで', level: '三角比', time: '目安 8分',
    problem: { label: '例題', lead: '次の三角比の値を求めよ。',
      parts: ['(1)　$\\sin120^\\circ,\\ \\cos120^\\circ,\\ \\tan120^\\circ$', '(2)　$\\sin135^\\circ,\\ \\cos135^\\circ,\\ \\tan135^\\circ$', '(3)　$\\sin150^\\circ,\\ \\cos150^\\circ,\\ \\tan150^\\circ$', '(4)　$0^\\circ,\\ 90^\\circ,\\ 180^\\circ$ の三角比'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: 'これまでの三角比は、直角三角形の中の角、つまり **鋭角** だけでした。この時間は、**座標** を使って、$0^\\circ$ から $180^\\circ$ までの角に広げます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '半円の上の点の座標を使って、$0^\\circ\\le\\theta\\le180^\\circ$ の三角比を定義し、\n鈍角や $0^\\circ,\\ 90^\\circ,\\ 180^\\circ$ の三角比の値を求められる' }] },

      // ---------- 座標で定義する ----------
      { clear: true, part: '座標で表す', say: '原点 O を中心とする半径 r の半円をかきます。x 軸の正の向きから、角 $\\theta$ だけ回った半円上の点を P$(x,\\ y)$ とします。',
        add: [{ t: 'h', text: '半円の上の点 P$(x,\\ y)$' },
          { t: 'p', size: 'sm', text: 'x 軸の **正の向き** から、\n角 $\\theta$ だけ回った点を P とする' },
          { t: 'fig', id: 'f1', col: 1, view: [-3.3, -0.95, 3.5, 3.35], w: 650, h: 411, items: semi(2.5, [[2.5, 'r'], [-2.5, '−r']], []).concat([
            { k: 'seg', a: [0, 0], b: [1.915, 1.607], c: 'y', wd: 4 },
            { k: 'angle', o: [0, 0], a: [2.5, 0], b: [1.915, 1.607], rp: 40, label: 'θ', size: 24 },
            { k: 'label', at: [0.96, 0.8], text: 'r', c: 'y', size: 26, dx: -14, dy: -14 },
            { k: 'pt', at: [1.915, 1.607], name: 'P(x, y)', dir: 'ne', r: 6 }]) }] },
      { say: '$\\theta$ が鋭角のとき、P から x 軸に垂線 PH を引くと、直角三角形 OPH。斜辺 r、対辺 y、隣辺 x なので、三角比はこう書けます。',
        add: [{ t: 'm', tex: '\\sin\\theta=\\frac{\\ans{y}}{\\hy{r}},\\quad \\cos\\theta=\\frac{\\hb{x}}{\\hy{r}},\\quad \\tan\\theta=\\frac{\\ans{y}}{\\hb{x}}' }],
        draw: [{ fig: 'f1', items: [
          { k: 'seg', a: [1.915, 1.607], b: [1.915, 0], c: 'p', wd: 4 }, { k: 'seg', a: [0, 0], b: [1.915, 0], c: 'b', wd: 5 },
          { k: 'right', o: [1.915, 0], a: [0, 0], b: [1.915, 1.607], s: 16 },
          { k: 'label', at: [1.915, 0.8], text: 'y', c: 'p', size: 26, anchor: 'start', dx: 12 },
          { k: 'label', at: [0.96, 0], text: 'x', c: 'b', size: 26, dy: 24 }, { k: 'pt', at: [1.915, 0], name: 'H', dir: 's', off: 28, r: 4 }] }] },
      { say: 'この式を、$0^\\circ\\le\\theta\\le180^\\circ$ の三角比の **定義** にします。$\\theta$ が鈍角で P が左側にあっても、P の座標と r で値が決まります。',
        add: [{ t: 'box', c: 'y', label: '定義', text: '$0^\\circ\\le\\theta\\le180^\\circ$ の三角比を、\n上の3つの式で決める（P は半円の上の点）' },
          { t: 'p', size: 'xs', text: '値は r によらない（相似）ので、計算しやすい r を選んでよい' }],
        draw: [{ fig: 'f1', items: [
          { k: 'seg', a: [0, 0], b: [-1.607, 1.915], c: 'g', wd: 3, dash: true },
          { k: 'pt', at: [-1.607, 1.915], name: '鈍角なら x<0', dir: 'nw', c: 'g', r: 6 }] }] },

      // ---------- 120° ----------
      { clear: true, part: '120°', say: '$120^\\circ$ を求めます。x 軸の **負の向き** との角は $180^\\circ-120^\\circ=60^\\circ$。半径を 2 にすると、三角定規の形から P$(-1,\\ \\sqrt3)$ です。',
        add: [{ t: 'h', text: '$120^\\circ$ の三角比（$r=2$）' },
          { t: 'p', size: 'sm', text: '辺の比 $1:\\sqrt3:2$ の三角形\nP は左上にあるので　$x=-1$、$y=\\sqrt3$' },
          { t: 'fig', id: 'f2', col: 1, view: [-2.6, -0.75, 2.6, 2.45], w: 680, h: 418, items: semi(2, [[-2, '−2'], [2, '2']], []).concat(obtuse(2, -1, R3, '120°', '60°', [
            { k: 'label', at: [-0.5, 0.866], text: '2', c: 'y', size: 26, anchor: 'start', dx: 14, dy: -6 },
            { k: 'label', at: [-1, 0.866], text: '√3', c: 'p', size: 26, anchor: 'end', dx: -12 },
            { k: 'label', at: [-0.5, 0], text: '1', c: 'b', size: 26, dy: 26 },
            { k: 'pt', at: [-1, R3], name: 'P(−1, √3)', dir: 'nw', r: 6 }])) }] },
      { ask: { type: 'choice', q: '$\\cos120^\\circ$ の値は？',
        opts: ['$\\dfrac12$', '$-\\dfrac12$', '$-\\dfrac{\\sqrt3}{2}$', '$-\\sqrt3$'], ok: 1,
        why: { 0: 'P の x 座標は $-1$。$\\cos\\theta=\\dfrac xr$ なので、負になります。', 2: '$\\cos\\theta=\\dfrac xr$ の x は $-1$、r は 2 です。', 3: 'それは $\\tan120^\\circ=\\dfrac yx$。cos は x÷r です。' },
        good: '$\\cos120^\\circ=\\dfrac{-1}{2}=-\\dfrac12$。鈍角の cos は負です。',
        add: [{ t: 'm', tex: '\\cos120^\\circ=\\frac{-1}{2}=\\ans{-\\frac12}' }] } },
      { say: '残りも、$x=-1,\\ y=\\sqrt3,\\ r=2$ を定義に入れるだけ。$\\tan120^\\circ$ は $\\dfrac{\\sqrt3}{-1}$ で、負になります。',
        add: [{ t: 'm', tex: '\\sin120^\\circ=\\frac{\\sqrt3}{2},\\qquad \\tan120^\\circ=\\frac{\\sqrt3}{-1}=-\\sqrt3' }] },

      // ---------- 符号と 135° ----------
      { clear: true, part: '符号と135°', say: '鈍角では P が y 軸の左側にあるので、$x<0,\\ y>0$。だから **sin は正、cos と tan は負** になります。次は $135^\\circ$。半径を $\\sqrt2$ にします。',
        add: [{ t: 'h', text: '三角比の符号' },
          { t: 'tbl', rows: [['', '鋭角', '鈍角'], ['$\\sin\\theta$', '$+$', '$+$'], ['$\\cos\\theta$', '$+$', '$-$'], ['$\\tan\\theta$', '$+$', '$-$']] },
          { t: 'h', text: '$135^\\circ$ の三角比（$r=\\sqrt2$）' },
          { t: 'fig', id: 'f3', col: 1, view: [-2.1, -0.6, 2.1, 2.0], w: 680, h: 421, items: semi(R2, [[-R2, '−√2'], [R2, '√2']], []).concat(obtuse(R2, -1, 1, '135°', '45°', [
            { k: 'label', at: [-0.5, 0.5], text: '√2', c: 'y', size: 26, anchor: 'start', dx: 14, dy: -4 },
            { k: 'label', at: [-1, 0.5], text: '1', c: 'p', size: 26, anchor: 'end', dx: -12 },
            { k: 'label', at: [-0.5, 0], text: '1', c: 'b', size: 26, dy: 26 },
            { k: 'pt', at: [-1, 1], name: 'P(−1, 1)', dir: 'nw', r: 6 }])) }] },
      { ask: { type: 'choice', q: '$\\cos135^\\circ$ の値は？',
        opts: ['$-\\dfrac{1}{\\sqrt2}$', '$\\dfrac{1}{\\sqrt2}$', '$-1$', '$-\\sqrt2$'], ok: 0,
        why: { 1: '鈍角なので P の x 座標は負。cos も負です。', 2: 'それは $\\tan135^\\circ=\\dfrac{1}{-1}$。cos は x÷r。', 3: '分母と分子が逆です。r＝$\\sqrt2$ が分母。' },
        good: '$\\cos135^\\circ=\\dfrac{-1}{\\sqrt2}=-\\dfrac{1}{\\sqrt2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin135^\\circ=\\frac{1}{\\sqrt2},\\quad \\cos135^\\circ=\\ans{-\\frac{1}{\\sqrt2}},\\quad \\tan135^\\circ=-1' }] } },

      // ---------- 150° ----------
      { clear: true, part: '150°', add: [{ t: 'h', text: '$150^\\circ$ の三角比' },
          { t: 'fig', id: 'f4', col: 1, view: [-2.6, -0.75, 2.6, 2.45], w: 680, h: 418, items: semi(2, [[-2, '−2'], [2, '2']], []).concat([
            { k: 'seg', a: [0, 0], b: [-R3, 1], c: 'y', wd: 4 },
            { k: 'angle', o: [0, 0], a: [2, 0], b: [-R3, 1], rp: 34, label: '150°', lr: 22, size: 22, c: 'g' },
            { k: 'angle', o: [0, 0], a: [-2, 0], b: [-R3, 1], rp: 70, label: '30°', lr: 22, size: 22, c: 'y' },
            { k: 'pt', at: [-R3, 1], name: 'P', dir: 'nw', r: 6 }]) }],
        ask: { type: 'think', q: '$\\sin150^\\circ,\\ \\cos150^\\circ,\\ \\tan150^\\circ$ を求めよう。（半径 2 の半円で考える）',
          hint: 'x 軸の負の向きとの角は $30^\\circ$。辺の比 $1:\\sqrt3:2$ で、P$(-\\sqrt3,\\ 1)$。',
          ans: '$\\sin150^\\circ=\\dfrac12$、$\\cos150^\\circ=-\\dfrac{\\sqrt3}{2}$、$\\tan150^\\circ=-\\dfrac{1}{\\sqrt3}$',
          after: 'P$(-\\sqrt3,\\ 1)$、$r=2$ を定義に入れます。cos と tan が負になっているか、符号を確かめましょう。',
          add: [{ t: 'p', size: 'sm', text: 'P$(-\\sqrt3,\\ 1)$、$r=2$ より' },
            { t: 'm', tex: '\\sin150^\\circ=\\ans{\\frac12}' },
            { t: 'm', tex: '\\cos150^\\circ=\\ans{-\\frac{\\sqrt3}{2}}' },
            { t: 'm', tex: '\\tan150^\\circ=\\frac{1}{-\\sqrt3}=\\ans{-\\frac{1}{\\sqrt3}}' }],
          draw: [{ fig: 'f4', items: [
            { k: 'seg', a: [-R3, 1], b: [-R3, 0], c: 'p', wd: 4 }, { k: 'seg', a: [0, 0], b: [-R3, 0], c: 'b', wd: 5 },
            { k: 'right', o: [-R3, 0], a: [0, 0], b: [-R3, 1], s: 16 },
            { k: 'label', at: [-0.866, 0], text: '√3', c: 'b', size: 24, dy: 26 },
            { k: 'label', at: [-R3, 0.5], text: '1', c: 'p', size: 24, anchor: 'start', dx: 10 },
            { k: 'label', at: [-0.866, 0.5], text: '2', c: 'y', size: 24, dx: 8, dy: -24 }] }] } },

      // ---------- 0°・90°・180° ----------
      { clear: true, part: '0°・90°・180°', say: '$0^\\circ,\\ 90^\\circ,\\ 180^\\circ$ は、三角形ができませんが、座標なら決まります。半径 1 の半円で、P は $(1,\\ 0)$、$(0,\\ 1)$、$(-1,\\ 0)$ です。',
        add: [{ t: 'h', text: '$0^\\circ,\\ 90^\\circ,\\ 180^\\circ$（$r=1$）' },
          { t: 'tbl', rows: [['$\\theta$', '$0^\\circ$', '$90^\\circ$', '$180^\\circ$'], ['$\\sin\\theta$', '$0$', '$1$', '$0$'], ['$\\cos\\theta$', '$1$', '$0$', '$-1$'], ['$\\tan\\theta$', '$0$', '？', '$0$']] },
          { t: 'fig', id: 'f5', col: 1, view: [-1.65, -0.45, 1.65, 1.5], w: 680, h: 402, items: semi(1, [], []).concat([
            { k: 'pt', at: [1, 0], name: '0° (1, 0)', dir: 'ne', r: 7, c: 'b' },
            { k: 'pt', at: [0, 1], name: '90° (0, 1)', dir: 'ne', r: 7, c: 'p' },
            { k: 'pt', at: [-1, 0], name: '180° (−1, 0)', dir: 'nw', r: 7, c: 'g' }]) }] },
      { ask: { type: 'choice', q: '$\\tan90^\\circ$ は？',
        opts: ['$0$', '$1$', '値がない（定義しない）', '$-1$'], ok: 2,
        why: { 0: '$\\tan90^\\circ=\\dfrac yx=\\dfrac10$。0 でわることはできないので、0 ではありません。', 1: 'それは $\\sin90^\\circ$ の値です。', 3: 'それは $\\cos180^\\circ$ の値です。' },
        good: 'P$(0,\\ 1)$ で x＝0。$\\dfrac yx$ の分母が 0 なので、$\\tan90^\\circ$ の値は **ない** とします。',
        add: [{ t: 'p', size: 'sm', text: '$\\tan90^\\circ$ は $\\dfrac10$ になるので、**値がない**' }] } },
      { say: 'P は半円の上だけを動くので、y は 0 から r、x は $-r$ から r。だから sin と cos の値の範囲はこうなります。$\\tan\\theta$ はすべての実数の値をとります。',
        add: [{ t: 'box', c: 'b', label: '値の範囲', text: '$0\\le\\sin\\theta\\le1,\\quad -1\\le\\cos\\theta\\le1$\n$\\tan\\theta$ は すべての実数（$\\theta\\ne90^\\circ$）' }] },
      { ask: { type: 'choice', q: '$0^\\circ\\le\\theta\\le180^\\circ$ で、$\\sin\\theta=-\\dfrac12$ となる $\\theta$ は？',
        opts: ['$150^\\circ$', '$30^\\circ$ と $150^\\circ$', '$120^\\circ$', 'ない'], ok: 3,
        why: { 0: '$\\sin150^\\circ=\\dfrac12$。鈍角でも sin は正です。', 1: '$\\sin30^\\circ$ も $\\sin150^\\circ$ も $\\dfrac12$（正）です。', 2: '$\\sin120^\\circ=\\dfrac{\\sqrt3}{2}$（正）です。' },
        good: 'P の y 座標は 0 以上なので、$\\sin\\theta\\ge0$。負の値になる $\\theta$ はありません。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、$180^\\circ-\\theta$ の三角比を使って、鈍角の三角比を鋭角の三角比に直す方法を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
