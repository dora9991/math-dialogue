/* 数学Ⅱ 第3章 三角関数 加法定理 ②：2倍角の公式・半角の公式
   加法定理で β=α とおく。cos2α の3つの形、tan2α、半角の公式（sin²(α/2) など）、cos2θ=3cosθ+1・sin2θ=sinθ（0≦θ<2π）。
   例はすべて自作。値・解は python3（sympy：radsimp・solveset）で検算ずみ。 */
(function () {
  const POINTS = [
    '2倍角の公式　$\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$、$\\cos2\\alpha=\\cos^2\\alpha-\\sin^2\\alpha=1-2\\sin^2\\alpha=2\\cos^2\\alpha-1$、$\\tan2\\alpha=\\dfrac{2\\tan\\alpha}{1-\\tan^2\\alpha}$（加法定理で $\\beta=\\alpha$）',
    '半角の公式　$\\sin^2\\dfrac{\\alpha}{2}=\\dfrac{1-\\cos\\alpha}{2}$、$\\cos^2\\dfrac{\\alpha}{2}=\\dfrac{1+\\cos\\alpha}{2}$、$\\tan^2\\dfrac{\\alpha}{2}=\\dfrac{1-\\cos\\alpha}{1+\\cos\\alpha}$。値の **符号** は $\\dfrac{\\alpha}{2}$ のある象限で決める',
    '$\\cos2\\theta$ と $\\cos\\theta$ がまざった方程式は $\\cos2\\theta=2\\cos^2\\theta-1$ で **1種類の式** にそろえて因数分解。$-1\\le\\cos\\theta\\le1$ に入らない値は捨てる。両辺を $\\sin\\theta$ で割らない'
  ];
  const D = Math.PI / 180;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const UC = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.45, -1.22, 1.45, 1.22], w: 530, h: 446, items: [{ k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
    { k: 'label', at: [1, 0], text: '1', c: 'd', size: 21, dx: 12, dy: 18 }, { k: 'label', at: [0, 1], text: '1', c: 'd', size: 21, dx: -14, dy: -14 }].concat(items) });
  const ray = (deg, c) => [{ k: 'seg', a: [0, 0], b: at(deg, 1), c: c || 'y', wd: 3.5 }, { k: 'pt', at: at(deg, 1), c: c || 'y', r: 7 }];
  const tag = (deg, text, c, dx, dy) => ({ k: 'label', at: at(deg, 1), text, c: c || 'y', size: 22, dx: dx || 0, dy: dy || 0 });

  HB.lesson({
    id: 'm2c-08', field: '数学Ⅱ　三角関数', title: '2倍角の公式・半角の公式', level: '加法定理', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\dfrac{\\pi}{2}<\\alpha<\\pi$、$\\sin\\alpha=\\dfrac23$ のとき、$\\sin2\\alpha,\\ \\cos2\\alpha,\\ \\tan2\\alpha$ の値', '(2)　$\\sin\\dfrac{\\pi}{8}$、$\\cos\\dfrac{\\pi}{8}$ の値', '(3)　$0\\le\\theta<2\\pi$ のとき、$\\cos2\\theta=3\\cos\\theta+1$ を解け', '(4)　$0\\le\\theta<2\\pi$ のとき、$\\sin2\\theta=\\sin\\theta$ を解け'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は加法定理を学びました。この時間は、加法定理で $\\beta=\\alpha$ とおいた **2倍角の公式** と、それを変形した **半角の公式** を学び、方程式にも使います。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '2倍角の公式・半角の公式を導き、三角関数の値を求められる\n$\\cos2\\theta$ を含む方程式を、1種類の三角関数にそろえて解ける' }] },

      // ---------- 2倍角 ----------
      { clear: true, cols: [0.66, 0.34], part: '2倍角の公式', say: '加法定理で $\\beta=\\alpha$ とおくと、$2\\alpha$ の三角関数が $\\alpha$ の三角関数で表せます。sin は $2\\sin\\alpha\\cos\\alpha$、cos は $\\cos^2\\alpha-\\sin^2\\alpha$ です。',
        add: [{ t: 'h', text: '2倍角の公式' },
          { t: 'm', size: 'sm', tex: '\\sin2\\alpha=\\sin(\\alpha+\\alpha)=\\sin\\alpha\\cos\\alpha+\\cos\\alpha\\sin\\alpha=2\\sin\\alpha\\cos\\alpha' },
          { t: 'm', size: 'sm', tex: '\\cos2\\alpha=\\cos(\\alpha+\\alpha)=\\cos\\alpha\\cos\\alpha-\\sin\\alpha\\sin\\alpha=\\cos^2\\alpha-\\sin^2\\alpha' },
          { t: 'p', size: 'sm', col: 1, text: '$\\sin^2\\alpha+\\cos^2\\alpha=1$ を使うと、\n$\\cos2\\alpha$ は sin だけ・cos だけの形にもなる' }] },
      { ask: { type: 'choice', q: '$\\cos2\\alpha$ を $\\sin\\alpha$ だけで表すと？',
        opts: ['$2\\sin^2\\alpha-1$', '$1-\\sin^2\\alpha$', '$1-2\\sin^2\\alpha$'], ok: 2,
        why: { 0: '符号が逆です。$\\cos^2\\alpha=1-\\sin^2\\alpha$ を入れると $1-2\\sin^2\\alpha$。', 1: '$\\cos^2\\alpha-\\sin^2\\alpha$ の $-\\sin^2\\alpha$ をわすれています。' },
        good: '$\\cos^2\\alpha=1-\\sin^2\\alpha$ を入れて、$1-\\sin^2\\alpha-\\sin^2\\alpha=1-2\\sin^2\\alpha$。',
        add: [{ t: 'box', c: 'y', label: '2倍角の公式', text: '$\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$\n$\\cos2\\alpha=\\cos^2\\alpha-\\sin^2\\alpha=\\hy{1-2\\sin^2\\alpha}=\\hb{2\\cos^2\\alpha-1}$\n$\\tan2\\alpha=\\dfrac{2\\tan\\alpha}{1-\\tan^2\\alpha}$' }] } },

      // ---------- 例 ----------
      { clear: true, part: '値を求める', say: '$\\dfrac{\\pi}{2}<\\alpha<\\pi$、$\\sin\\alpha=\\dfrac23$ のとき。2倍角の公式には $\\cos\\alpha$ も要ります。$\\alpha$ は第2象限の角なので $\\cos\\alpha<0$ です。',
        add: [{ t: 'h', text: '$\\dfrac{\\pi}{2}<\\alpha<\\pi$、$\\sin\\alpha=\\dfrac23$ のとき' },
          { t: 'm', tex: '\\cos\\alpha=-\\sqrt{1-\\left(\\frac23\\right)^2}=-\\frac{\\sqrt5}{3}', note: '第2象限で\n$\\cos\\alpha<0$' },
          UC('f1', [{ k: 'seg', a: [0, 0], b: [-0.7454, 0.6667], c: 'y', wd: 3.5 }, { k: 'pt', at: [-0.7454, 0.6667], c: 'y', r: 7, name: 'P', dir: 'nw' },
            { k: 'seg', a: [-0.7454, 0.6667], b: [-0.7454, 0], c: 'p', wd: 3, dash: true }, { k: 'label', at: [-0.7454, 0.33], text: '2/3', c: 'p', size: 21, dx: -22 },
            { k: 'label', at: [-0.37, 0], text: '−√5/3', c: 'b', size: 21, dy: 22 }, { k: 'arc', o: [0, 0], rp: 34, a1: 0, a2: 138.19, c: 'g', wd: 3 }, { k: 'label', at: at(70, 0.3), text: 'α', c: 'g', size: 24 }])] },
      { ask: { type: 'choice', q: '$\\sin2\\alpha$ の値は？',
        opts: ['$-\\dfrac{4\\sqrt5}{9}$', '$\\dfrac{4\\sqrt5}{9}$', '$-\\dfrac{2\\sqrt5}{9}$', '$\\dfrac43$'], ok: 0,
        why: { 1: '$\\cos\\alpha$ は負なので、$2\\sin\\alpha\\cos\\alpha$ も負です。', 2: '2倍の 2 をかけわすれています。', 3: '$\\sin2\\alpha=2\\sin\\alpha$ ではありません。' },
        good: '$\\sin2\\alpha=2\\cdot\\dfrac23\\cdot\\left(-\\dfrac{\\sqrt5}{3}\\right)=-\\dfrac{4\\sqrt5}{9}$。',
        add: [{ t: 'm', tex: '\\sin2\\alpha=2\\cdot\\frac23\\cdot\\left(-\\frac{\\sqrt5}{3}\\right)=\\ans{-\\frac{4\\sqrt5}{9}}' }] } },
      { say: '$\\cos2\\alpha$ は、$\\sin\\alpha$ がわかっているので $1-2\\sin^2\\alpha$ の形が速いです。$\\tan2\\alpha$ は、$\\dfrac{\\sin2\\alpha}{\\cos2\\alpha}$ で求められます。',
        add: [{ t: 'm', tex: '\\cos2\\alpha=1-2\\sin^2\\alpha=1-2\\cdot\\frac49=\\ans{\\frac19}' },
          { t: 'm', tex: '\\tan2\\alpha=\\frac{\\sin2\\alpha}{\\cos2\\alpha}=-\\frac{4\\sqrt5}{9}\\div\\frac19=\\ans{-4\\sqrt5}' }] },

      // ---------- 半角 ----------
      { clear: true, part: '半角の公式', say: '$\\cos2\\alpha=1-2\\sin^2\\alpha$、$\\cos2\\alpha=2\\cos^2\\alpha-1$ の $\\alpha$ を $\\dfrac{\\alpha}{2}$ におきかえて、$\\sin^2\\dfrac{\\alpha}{2}$、$\\cos^2\\dfrac{\\alpha}{2}$ について解くと、**半角の公式** になります。',
        add: [{ t: 'h', text: '半角の公式' },
          { t: 'm', size: 'sm', tex: '\\cos\\alpha=1-2\\sin^2\\frac{\\alpha}{2}\\ \\ \\text{より}\\ \\ \\sin^2\\frac{\\alpha}{2}=\\frac{1-\\cos\\alpha}{2}' },
          { t: 'm', size: 'sm', tex: '\\cos\\alpha=2\\cos^2\\frac{\\alpha}{2}-1\\ \\ \\text{より}\\ \\ \\cos^2\\frac{\\alpha}{2}=\\frac{1+\\cos\\alpha}{2}' },
          { t: 'box', c: 'y', label: '半角の公式', text: '$\\sin^2\\dfrac{\\alpha}{2}=\\dfrac{1-\\cos\\alpha}{2}$\n$\\cos^2\\dfrac{\\alpha}{2}=\\dfrac{1+\\cos\\alpha}{2}$\n$\\tan^2\\dfrac{\\alpha}{2}=\\dfrac{1-\\cos\\alpha}{1+\\cos\\alpha}$' }] },
      { say: '$\\sin\\dfrac{\\pi}{8}$ を求めます。$\\dfrac{\\pi}{8}$ は $\\dfrac{\\pi}{4}$ の半分なので、$\\alpha=\\dfrac{\\pi}{4}$ とします。$\\dfrac{\\pi}{8}$ は第1象限の角なので、$\\sin\\dfrac{\\pi}{8}>0$ です。',
        add: [{ t: 'h', col: 1, text: '例　$\\sin\\dfrac{\\pi}{8}$、$\\cos\\dfrac{\\pi}{8}$' }, { t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}\\sin^2\\frac{\\pi}{8}&=\\frac{1-\\cos\\frac{\\pi}{4}}{2}=\\frac{1-\\frac{\\sqrt2}{2}}{2}=\\frac{2-\\sqrt2}{4}\\end{aligned}' },
          { t: 'm', col: 1, tex: '\\sin\\frac{\\pi}{8}>0\\ \\text{より}\\ \\sin\\frac{\\pi}{8}=\\ans{\\frac{\\sqrt{2-\\sqrt2}}{2}}' }] },
      { ask: { type: 'choice', q: '$\\cos\\dfrac{\\pi}{8}$ の値は？',
        opts: ['$\\dfrac{2+\\sqrt2}{4}$', '$-\\dfrac{\\sqrt{2+\\sqrt2}}{2}$', '$\\dfrac{\\sqrt{2-\\sqrt2}}{2}$', '$\\dfrac{\\sqrt{2+\\sqrt2}}{2}$'], ok: 3,
        why: { 0: 'それは $\\cos^2\\dfrac{\\pi}{8}$ です。平方根をとります。', 1: '$\\dfrac{\\pi}{8}$ は第1象限の角なので、cos は正です。', 2: 'それは $\\sin\\dfrac{\\pi}{8}$。cos の半角の公式は $1+\\cos\\alpha$ です。' },
        good: '$\\cos^2\\dfrac{\\pi}{8}=\\dfrac{1+\\frac{\\sqrt2}{2}}{2}=\\dfrac{2+\\sqrt2}{4}$。正の平方根をとって $\\dfrac{\\sqrt{2+\\sqrt2}}{2}$。',
        add: [{ t: 'm', col: 1, tex: '\\cos\\frac{\\pi}{8}=\\sqrt{\\frac{2+\\sqrt2}{4}}=\\ans{\\frac{\\sqrt{2+\\sqrt2}}{2}}' }] } },

      // ---------- 方程式 ----------
      { clear: true, part: '方程式', say: '$0\\le\\theta<2\\pi$ で $\\cos2\\theta=3\\cos\\theta+1$ を解きます。$\\cos2\\theta$ と $\\cos\\theta$ がまざっているので、まず **cosθ だけの式** にそろえます。',
        add: [{ t: 'h', text: '$\\cos2\\theta=3\\cos\\theta+1$（$0\\le\\theta<2\\pi$）' }] },
      { ask: { type: 'choice', q: '$\\cos\\theta$ だけの式にするには、$\\cos2\\theta$ をどの形にすればよい？',
        opts: ['$1-2\\sin^2\\theta$', '$2\\cos^2\\theta-1$', '$\\cos^2\\theta-\\sin^2\\theta$', '$2\\sin\\theta\\cos\\theta$'], ok: 1,
        why: { 0: 'sin が出てきて、cos だけの式になりません。', 2: '$\\sin^2\\theta$ が残ります。', 3: 'それは $\\sin2\\theta$ です。' },
        good: '$2\\cos^2\\theta-1$ にすると、$\\cos\\theta$ の2次方程式になります。',
        add: [{ t: 'm', tex: '\\begin{aligned}2\\cos^2\\theta-1&=3\\cos\\theta+1\\\\ 2\\cos^2\\theta-3\\cos\\theta-2&=0\\\\ (2\\cos\\theta+1)(\\cos\\theta-2)&=0\\end{aligned}' }] } },
      { say: '$-1\\le\\cos\\theta\\le1$ なので、$\\cos\\theta=2$ にはなりません。$\\cos\\theta=-\\dfrac12$ だけを、単位円で解きます。',
        add: [{ t: 'm', tex: '\\cos\\theta=-\\frac12', note: '$\\cos\\theta=2$ は\n$-1\\le\\cos\\theta\\le1$ に入らない' },
          UC('f2', [{ k: 'line', x: -0.5, c: 'p', dash: true }, { k: 'label', at: [-0.5, -1.13], text: 'x=−1/2', c: 'p', size: 21, anchor: 'start', dx: 8 }])] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、$\\cos\\theta=-\\dfrac12$ の解は？',
        opts: ['$\\theta=\\dfrac23\\pi$', '$\\theta=\\dfrac{\\pi}{3},\\ \\dfrac53\\pi$', '$\\theta=\\dfrac23\\pi,\\ \\dfrac43\\pi$', '$\\theta=\\dfrac{\\pi}{3},\\ \\dfrac23\\pi$'], ok: 2,
        why: { 0: '$0\\le\\theta<2\\pi$ では、直線 $x=-\\dfrac12$ と単位円の交点は2つです。', 1: 'それは $\\cos\\theta=\\dfrac12$ の解です。', 3: 'それは $\\sin\\theta=\\dfrac{\\sqrt3}{2}$ の解です。' },
        good: '直線 $x=-\\dfrac12$ と単位円の交点は、$\\dfrac23\\pi$ と $\\dfrac43\\pi$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=\\frac23\\pi,\\ \\frac43\\pi' }],
        draw: [{ fig: 'f2', items: ray(120).concat(ray(240), [tag(120, '2π/3', 'y', -36, -14), tag(240, '4π/3', 'y', -36, 14)]) }] } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　$\\sin2\\theta=\\sin\\theta$（$0\\le\\theta<2\\pi$）' },
          { t: 'p', size: 'sm', text: '$\\sin2\\theta=2\\sin\\theta\\cos\\theta$ にして、移項して因数分解' }, UC('f3', [])],
        ask: { type: 'think', q: '$0\\le\\theta<2\\pi$ で、$\\sin2\\theta=\\sin\\theta$ を解こう。',
          hint: '$2\\sin\\theta\\cos\\theta-\\sin\\theta=0$ から $\\sin\\theta(2\\cos\\theta-1)=0$。$\\sin\\theta=0$ と $\\cos\\theta=\\dfrac12$ に分ける。',
          ans: '$\\theta=0,\\ \\dfrac{\\pi}{3},\\ \\pi,\\ \\dfrac53\\pi$',
          after: '両辺を $\\sin\\theta$ で割ると、$\\sin\\theta=0$ の解（$0,\\ \\pi$）が消えてしまいます。移項して因数分解します。',
          add: [{ t: 'm', tex: '\\sin\\theta(2\\cos\\theta-1)=0' },
            { t: 'm', size: 'sm', tex: '\\sin\\theta=0\\ \\text{より}\\ \\theta=0,\\ \\pi\\qquad \\cos\\theta=\\frac12\\ \\text{より}\\ \\theta=\\frac{\\pi}{3},\\ \\frac53\\pi' },
            { t: 'ans', label: '答', tex: '\\theta=0,\\ \\frac{\\pi}{3},\\ \\pi,\\ \\frac53\\pi' }],
          draw: [{ fig: 'f3', items: [{ k: 'line', x: 0.5, c: 'p', dash: true }, { k: 'pt', at: [1, 0], c: 'g', r: 7 }, { k: 'pt', at: [-1, 0], c: 'g', r: 7 }, tag(0, '0', 'g', 14, -16), tag(180, 'π', 'g', -14, -16)]
            .concat(ray(60), ray(300), [tag(60, 'π/3', 'y', 26, -12), tag(300, '5π/3', 'y', 34, 12)]) }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、$a\\sin\\theta+b\\cos\\theta$ を1つの sin にまとめる **三角関数の合成** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
