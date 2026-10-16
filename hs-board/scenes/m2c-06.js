/* 数学Ⅱ 第3章 三角関数 ⑥：三角関数を含む方程式・不等式（0≦θ<2π）
   単位円で解く（sin は直線 y=k、cos は直線 x=k、tan は原点と (1, k) を通る直線）。不等式は弧をさがす。sin(θ+π/6) のおきかえ（t の範囲に注意）。
   例はすべて自作。解は python3（sympy の solveset、0≦θ<2π）で検算ずみ。 */
(function () {
  const POINTS = [
    '$0\\le\\theta<2\\pi$ では、$\\sin\\theta=k$ は単位円と **直線 $y=k$**、$\\cos\\theta=k$ は **直線 $x=k$**、$\\tan\\theta=k$ は原点と点 $(1,\\ k)$ を通る直線との交点を見る（$-1<k<1$ なら解は2つ。tan の2つの解は $\\pi$ ちがい）',
    '不等式は、条件を満たす **弧** を単位円でさがし、両はしの角で答える。弧が $\\theta=0$ をまたぐときは、範囲を2つに分けて書く。等号が入るか（≦ か <）に注意',
    '$\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)$ のような式は $\\theta+\\dfrac{\\pi}{6}=t$ とおき、**先に t の範囲** を求めて、その範囲の解だけを使う。最後に $\\theta$ にもどす'
  ];
  const D = Math.PI / 180, H3 = Math.sqrt(3) / 2, H2 = Math.SQRT1_2;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const UC = (id, items, o) => {
    o = o || {}; const v = [-1.45, -1.22, 1.45, 1.22], w = 530;
    return { t: 'fig', id, col: 1, view: v, w, h: Math.round(w * (v[3] - v[1]) / (v[2] - v[0])), items: [{ k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
      { k: 'label', at: [1, 0], text: '1', c: 'd', size: 21, dx: 12, dy: 18 }, { k: 'label', at: [0, 1], text: '1', c: 'd', size: 21, dx: -14, dy: -14 }].concat(items) };
  };
  const ray = (deg, c) => [{ k: 'seg', a: [0, 0], b: at(deg, 1), c: c || 'y', wd: 3.5 }, { k: 'pt', at: at(deg, 1), c: c || 'y', r: 7 }];
  const tag = (deg, text, c, dx, dy) => ({ k: 'label', at: at(deg, 1), text, c: c || 'y', size: 22, dx: dx || 0, dy: dy || 0 });
  const turn = (a1, a2, r0, c, dr) => {   // 回転の矢印（うずまき）
    const span = Math.abs(a2 - a1), n = Math.ceil(span / 4), pts = []; dr = (dr || 0.08) * span / 360;
    for (let i = 0; i <= n; i++) pts.push(at(a1 + (a2 - a1) * i / n, r0 + dr * i / n));
    const pre = at(a2 - 14 * Math.sign(a2 - a1), r0 + dr * (1 - 14 / span));
    return [{ k: 'poly', pts, c, wd: 3 }, { k: 'seg', a: pre, b: pts[n], c, wd: 3, arrow: true }];
  };

  HB.lesson({
    id: 'm2c-06', field: '数学Ⅱ　三角関数', title: '三角関数を含む方程式・不等式', level: '三角関数', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: '$0\\le\\theta<2\\pi$ のとき、次の方程式・不等式を解け。',
      parts: ['(1)　$\\sin\\theta=-\\dfrac12$', '(2)　$\\cos\\theta=-\\dfrac{1}{\\sqrt2}$', '(3)　$\\tan\\theta=-\\dfrac{1}{\\sqrt3}$', '(4)　$\\cos\\theta>\\dfrac12$', '(5)　$\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)=\\dfrac12$', '(6)　$\\sin\\left(\\theta+\\dfrac{\\pi}{3}\\right)=\\dfrac12$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Ⅰでは、$0^\\circ\\le\\theta\\le180^\\circ$ の範囲で三角比の方程式を解きました。この時間は、$0\\le\\theta<2\\pi$ に広げて、単位円の **1周ぜんぶ** を使って解きます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$0\\le\\theta<2\\pi$ で、三角関数を含む方程式・不等式を単位円で解ける\n$\\theta+\\dfrac{\\pi}{6}$ のような角は、おきかえて範囲に注意して解ける' }] },

      // ---------- sin ----------
      { clear: true, part: 'sin の方程式', say: '$\\sin\\theta=-\\dfrac12$ を解きます。$\\sin\\theta$ は単位円の点の **y 座標** なので、直線 $y=-\\dfrac12$ と単位円の交点をさがします。',
        add: [{ t: 'h', text: '$\\sin\\theta=-\\dfrac12$' },
          { t: 'p', size: 'sm', text: '$\\sin\\theta$ ＝ 単位円の点の **y 座標**\n→ 直線 $y=-\\dfrac12$ と単位円の交点' },
          UC('f1', [{ k: 'seg', a: [-1.4, -0.5], b: [1.4, -0.5], c: 'p', dash: true }, { k: 'label', at: [1.42, -0.5], text: 'y=−1/2', c: 'p', size: 21, anchor: 'end', dy: 20 }])] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、$\\sin\\theta=-\\dfrac12$ の解は？',
        opts: ['$\\theta=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$', '$\\theta=\\dfrac76\\pi,\\ \\dfrac{11}{6}\\pi$', '$\\theta=\\dfrac43\\pi,\\ \\dfrac53\\pi$', '$\\theta=\\dfrac76\\pi$'], ok: 1,
        why: { 0: 'それは $\\sin\\theta=\\dfrac12$ の解。y 座標が負の点は、円の下半分にあります。', 2: 'それは $\\sin\\theta=-\\dfrac{\\sqrt3}{2}$ の解です。', 3: '直線 $y=-\\dfrac12$ と単位円の交点は2つ。右下の点をわすれています。' },
        good: '交点は第3・第4象限に2つ。$\\pi+\\dfrac{\\pi}{6}=\\dfrac76\\pi$ と、$2\\pi-\\dfrac{\\pi}{6}=\\dfrac{11}{6}\\pi$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=\\frac76\\pi,\\ \\frac{11}{6}\\pi' }],
        draw: [{ fig: 'f1', items: ray(210).concat(ray(330), [tag(210, '7π/6', 'y', -34, -18), tag(330, '11π/6', 'y', 38, -18)]) }] } },

      // ---------- cos ----------
      { clear: true, part: 'cos の方程式', say: '$\\cos\\theta$ は点の **x 座標**。$\\cos\\theta=-\\dfrac{1}{\\sqrt2}$ なら、縦の直線 $x=-\\dfrac{1}{\\sqrt2}$ と単位円の交点を見ます。',
        add: [{ t: 'h', text: '$\\cos\\theta=-\\dfrac{1}{\\sqrt2}$' },
          { t: 'p', size: 'sm', text: '$\\cos\\theta$ ＝ 単位円の点の **x 座標**\n→ 直線 $x=-\\dfrac{1}{\\sqrt2}$ と単位円の交点' },
          UC('f2', [{ k: 'line', x: -H2, c: 'p', dash: true }, { k: 'label', at: [-H2, 1.1], text: 'x=−1/√2', c: 'p', size: 21, anchor: 'end', dx: -8 }])] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、$\\cos\\theta=-\\dfrac{1}{\\sqrt2}$ の解は？',
        opts: ['$\\theta=\\dfrac34\\pi$', '$\\theta=\\dfrac{\\pi}{4},\\ \\dfrac74\\pi$', '$\\theta=\\dfrac34\\pi,\\ \\dfrac54\\pi$', '$\\theta=\\dfrac34\\pi,\\ \\dfrac74\\pi$'], ok: 2,
        why: { 0: '数学Ⅰ（$0^\\circ$〜$180^\\circ$）では1つでしたが、1周では、縦の直線と単位円の交点は2つです。', 1: 'それは $\\cos\\theta=\\dfrac{1}{\\sqrt2}$ の解です。', 3: '$\\dfrac74\\pi$ の点は第4象限で、x 座標は正です。' },
        good: '縦の直線 $x=-\\dfrac{1}{\\sqrt2}$ と単位円の交点は、第2・第3象限に2つ。$\\dfrac34\\pi$ と $\\dfrac54\\pi$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=\\frac34\\pi,\\ \\frac54\\pi' }],
        draw: [{ fig: 'f2', items: ray(135).concat(ray(225), [tag(135, '3π/4', 'y', -40, -8), tag(225, '5π/4', 'y', -40, 8)]) }] } },

      // ---------- tan ----------
      { clear: true, part: 'tan の方程式', say: '$\\tan\\theta$ は直線 OP の **傾き** でした。$\\tan\\theta=-\\dfrac{1}{\\sqrt3}$ なら、原点と点 $\\left(1,\\ -\\dfrac{1}{\\sqrt3}\\right)$ を通る直線と、単位円の交点を見ます。',
        add: [{ t: 'h', text: '$\\tan\\theta=-\\dfrac{1}{\\sqrt3}$' },
          { t: 'p', size: 'sm', text: '$\\tan\\theta$ ＝ 直線 OP の **傾き**\n→ 原点と点 $\\left(1,\\ -\\dfrac{1}{\\sqrt3}\\right)$ を通る直線' },
          UC('f3', [{ k: 'line', x: 1, c: 'd', dash: true }, { k: 'line', m: -1 / Math.sqrt(3), n: 0, c: 'p', dash: true },
            { k: 'pt', at: [1, -1 / Math.sqrt(3)], c: 'p', r: 6, name: '(1, −1/√3)', dir: 'se', size: 20 }])] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、$\\tan\\theta=-\\dfrac{1}{\\sqrt3}$ の解は？',
        opts: ['$\\theta=\\dfrac56\\pi,\\ \\dfrac{11}{6}\\pi$', '$\\theta=\\dfrac56\\pi$', '$\\theta=\\dfrac23\\pi,\\ \\dfrac53\\pi$', '$\\theta=\\dfrac{\\pi}{6},\\ \\dfrac76\\pi$'], ok: 0,
        why: { 1: '原点を通る直線は、単位円と2点で交わります。$\\pi$ だけ先の点も解です。', 2: 'それは $\\tan\\theta=-\\sqrt3$ の解です。', 3: 'それは $\\tan\\theta=\\dfrac{1}{\\sqrt3}$（正）の解です。' },
        good: '交点は原点について対称な2点。$\\dfrac56\\pi$ と、$\\pi$ だけ先の $\\dfrac{11}{6}\\pi$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=\\frac56\\pi,\\ \\frac{11}{6}\\pi' }, { t: 'p', size: 'xs', text: 'tan の2つの解は、$\\pi$ ずつちがう' }],
        draw: [{ fig: 'f3', items: ray(150).concat(ray(330), [tag(150, '5π/6', 'y', -30, -16), tag(330, '11π/6', 'y', -10, 30)]) }] } },

      // ---------- 不等式 ----------
      { clear: true, part: '不等式', say: '不等式 $\\cos\\theta>\\dfrac12$。x 座標が $\\dfrac12$ より大きい点、つまり直線 $x=\\dfrac12$ より **右** にある弧（黄）をさがします。この弧は $\\theta=0$ をまたいでいます。',
        add: [{ t: 'h', text: '$\\cos\\theta>\\dfrac12$' },
          { t: 'p', size: 'sm', text: 'x 座標が $\\dfrac12$ より大きい\n→ 直線 $x=\\dfrac12$ より **右** の弧' },
          UC('f4', [{ k: 'line', x: 0.5, c: 'p', dash: true }, { k: 'label', at: [0.5, 1.12], text: 'x=1/2', c: 'p', size: 21, anchor: 'end', dx: -8 },
            { k: 'arc', o: [0, 0], r: 1, a1: -60, a2: 60, c: 'y', wd: 8 },
            { k: 'pt', at: [0.5, H3], open: true, c: 'y', r: 7 }, { k: 'pt', at: [0.5, -H3], open: true, c: 'y', r: 7 },
            tag(60, 'π/3', 'y', 28, -16), tag(-60, '5π/3', 'y', 34, 16), { k: 'pt', at: [1, 0], c: 'g', r: 6 }, { k: 'label', at: [1, 0], text: '0', c: 'g', size: 21, dx: 16, dy: -16 }])] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、$\\cos\\theta>\\dfrac12$ の解は？',
        opts: ['$\\frac{\\pi}{3}<\\theta<\\frac53\\pi$', '$0<\\theta<\\frac{\\pi}{3}$', '$-\\frac{\\pi}{3}<\\theta<\\frac{\\pi}{3}$', '${0\\le\\theta<\\frac{\\pi}{3}}$、${\\frac53\\pi<\\theta<2\\pi}$'], ok: 3,
        why: { 0: 'それは $\\cos\\theta<\\dfrac12$（直線の左側）の解です。', 1: '$\\theta=0$ も解です。右下の弧 $\\frac53\\pi<\\theta<2\\pi$ もあります。', 2: '弧は合っていますが、$\\theta$ の範囲は $0\\le\\theta<2\\pi$。負の角は使えません。' },
        good: '弧が $\\theta=0$ をまたぐので、2つに分けて書きます（$\\theta=0$ はふくむ）。',
        add: [{ t: 'ans', label: '答', tex: '0\\le\\theta<\\frac{\\pi}{3},\\ \\ \\frac53\\pi<\\theta<2\\pi' },
          { t: 'fig', id: 'n4', view: [-0.45, -0.85, 6.95, 1.0], w: 720, h: 140, items: [
            { k: 'numline', ticks: [[0, '0'], [Math.PI / 3, 'π/3'], [5 * Math.PI / 3, '5π/3'], [2 * Math.PI, '2π']], size: 22 },
            { k: 'range', from: 0, to: Math.PI / 3, fromIn: true, toIn: false, c: 'y', h: 30 },
            { k: 'range', from: 5 * Math.PI / 3, to: 2 * Math.PI, fromIn: false, toIn: false, c: 'y', h: 30 }] }] } },

      // ---------- おきかえ ----------
      { clear: true, part: 'おきかえ', say: '$\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)=\\dfrac12$ は、$\\theta+\\dfrac{\\pi}{6}=t$ とおくと $\\sin t=\\dfrac12$。ただし t の範囲は、$0\\le\\theta<2\\pi$ の各辺に $\\dfrac{\\pi}{6}$ をたして求めます。',
        add: [{ t: 'h', text: '$\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)=\\dfrac12$' },
          { t: 'm', tex: '\\theta+\\frac{\\pi}{6}=t\\ \\ \\text{とおくと}\\ \\ \\sin t=\\frac12' },
          { t: 'm', tex: '0\\le\\theta<2\\pi\\ \\ \\text{より}\\ \\ \\hy{\\frac{\\pi}{6}\\le t<\\frac{13}{6}\\pi}', note: '各辺に $\\dfrac{\\pi}{6}$ をたす' },
          UC('f5', turn(30, 390, 0.4, 'g', 0.16).concat([{ k: 'pt', at: at(30, 0.4), c: 'g', r: 6 }, { k: 'pt', at: at(30, 0.56), c: 'g', r: 6, open: true },
            { k: 'label', at: [0.05, -0.27], text: 't の範囲', c: 'g', size: 20, anchor: 'start', plain: true }]))] },
      { say: 'この t の範囲で、$\\sin t=\\dfrac12$ となるのは $t=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$。$t=\\dfrac{\\pi}{6}$ は範囲のはしで、等号つきなので入ります。$\\dfrac{13}{6}\\pi$ は入りません。',
        add: [{ t: 'm', tex: '\\sin t=\\frac12\\ \\ \\text{より}\\ \\ t=\\frac{\\pi}{6},\\ \\frac56\\pi', note: '$t=\\dfrac{13}{6}\\pi$ は\n範囲に入らない' }],
        draw: [{ fig: 'f5', items: [{ k: 'seg', a: [-1.4, 0.5], b: [1.4, 0.5], c: 'p', dash: true }].concat(ray(30), ray(150), [tag(30, 'π/6', 'y', 10, 36), tag(150, '5π/6', 'y', -34, -18)]) }] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、$\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)=\\dfrac12$ の解は？',
        opts: ['$\\theta=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$', '$\\theta=\\dfrac23\\pi$', '$\\theta=0,\\ \\dfrac23\\pi$', '$\\theta=0,\\ \\dfrac23\\pi,\\ 2\\pi$'], ok: 2,
        why: { 0: 'それは t の値です。$\\theta=t-\\dfrac{\\pi}{6}$ にもどします。', 1: '$t=\\dfrac{\\pi}{6}$ は t の範囲に入る（等号つき）ので、$\\theta=0$ も解です。', 3: '$\\theta<2\\pi$ なので $2\\pi$ は入りません（$t=\\dfrac{13}{6}\\pi$ は範囲の外）。' },
        good: '$t=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$ から $\\dfrac{\\pi}{6}$ を引いて、$\\theta=0,\\ \\dfrac23\\pi$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\theta=0,\\ \\frac23\\pi' }] } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　$\\sin\\left(\\theta+\\dfrac{\\pi}{3}\\right)=\\dfrac12$' },
          { t: 'p', size: 'sm', text: '同じ $\\sin t=\\dfrac12$ でも、t の範囲が変わると…' },
          UC('f6', [{ k: 'seg', a: [-1.4, 0.5], b: [1.4, 0.5], c: 'p', dash: true }])],
        ask: { type: 'think', q: '$0\\le\\theta<2\\pi$ で、$\\sin\\left(\\theta+\\dfrac{\\pi}{3}\\right)=\\dfrac12$ を解こう。',
          hint: '$t=\\theta+\\dfrac{\\pi}{3}$ の範囲は $\\dfrac{\\pi}{3}\\le t<\\dfrac73\\pi$。この中で $\\sin t=\\dfrac12$ となる t は？（$\\dfrac{\\pi}{6}$ は入らない）',
          ans: '$t=\\dfrac56\\pi,\\ \\dfrac{13}{6}\\pi$ より　$\\theta=\\dfrac{\\pi}{2},\\ \\dfrac{11}{6}\\pi$',
          after: '$t=\\dfrac{\\pi}{6}$ は範囲の外で、1周先の $\\dfrac{13}{6}\\pi$ が入ります。t の範囲を先に書くのが大切です。',
          add: [{ t: 'm', tex: '\\frac{\\pi}{3}\\le t<\\frac73\\pi\\ \\ \\text{より}\\ \\ t=\\frac56\\pi,\\ \\frac{13}{6}\\pi' },
            { t: 'ans', label: '答', tex: '\\theta=\\frac{\\pi}{2},\\ \\frac{11}{6}\\pi' }],
          draw: [{ fig: 'f6', items: turn(60, 420, 0.4, 'g', 0.16).concat([{ k: 'pt', at: at(60, 0.4), c: 'g', r: 6 }, { k: 'pt', at: at(60, 0.56), c: 'g', r: 6, open: true }],
            ray(150), ray(30), [tag(150, '5π/6', 'y', -34, -18), tag(30, '13π/6', 'y', 0, 40)]) }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間からは、2つの角の和や差の三角関数を表す **加法定理** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
