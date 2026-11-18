/* 数学Ⅱ 第3章 三角関数 加法定理 ④：三角関数の最大・最小
   ① 合成して（√3sinθ+cosθ、0≦θ≦π） ② sinθ=t とおいて2次関数（cos²θ−sinθ+1、0≦θ<2π） ③ 2倍角の公式で直して合成（sin²θ+2sinθcosθ+3cos²θ、0≦θ≦π/2）。
   例はすべて自作。式変形は python3（sympy の expand_trig で差が 0）、最大・最小とそのときの θ は数値の走査（40万点）で検算ずみ。 */
(function () {
  const POINTS = [
    '$a\\sin\\theta+b\\cos\\theta$ は **合成** して $r\\sin(\\theta+\\alpha)$。$\\theta+\\alpha=t$ の **範囲を先に** 求め、単位円でその弧の y 座標の最大・最小を読む',
    '$\\sin^2\\theta$ や $\\cos^2\\theta$ がまざった式は、$\\sin\\theta=t$ とおいて **t の2次関数** に。t の範囲（$-1\\le t\\le1$ など）で、数学Ⅰの2次関数の最大・最小と同じように考える',
    '$\\sin\\theta\\cos\\theta$、$\\sin^2\\theta$、$\\cos^2\\theta$ だけの式は、**2倍角の公式** で $\\sin2\\theta,\\ \\cos2\\theta$ の式に直してから合成する。最後に、最大・最小となる $\\theta$ も答える'
  ];
  const D = Math.PI / 180;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const UC = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.45, -1.22, 1.45, 1.22], w: 530, h: 446, items: [{ k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
    { k: 'label', at: [1, 0], text: '1', c: 'd', size: 21, dx: 12, dy: 18 }, { k: 'label', at: [0, 1], text: '1', c: 'd', size: 21, dx: -14, dy: -14 }].concat(items) });
  const tag = (deg, text, c, dx, dy) => ({ k: 'label', at: at(deg, 1), text, c: c || 'y', size: 21, dx: dx || 0, dy: dy || 0 });

  HB.lesson({
    id: 'm2c-10', field: '数学Ⅱ　三角関数', title: '三角関数の最大・最小', level: '加法定理', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: '次の関数の最大値・最小値と、そのときの $\\theta$ の値を求めよ。',
      parts: ['(1)　$y=\\sqrt3\\sin\\theta+\\cos\\theta$　（$0\\le\\theta\\le\\pi$）', '(2)　$y=\\cos^2\\theta-\\sin\\theta+1$　（$0\\le\\theta<2\\pi$）', '(3)　$y=\\cos2\\theta+2\\sin\\theta$　（$0\\le\\theta<2\\pi$）', '(4)　$y=\\sin^2\\theta+2\\sin\\theta\\cos\\theta+3\\cos^2\\theta$　（$0\\le\\theta\\le\\dfrac{\\pi}{2}$）'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'この章の仕上げです。これまでに学んだ **合成**、**おきかえ**、**2倍角の公式** を使って、三角関数を含む関数の最大値・最小値を求めます。どれも「新しい変数の範囲」がかぎです。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '合成・おきかえ・2倍角の公式を使って、三角関数の最大値・最小値と、\nそのときの $\\theta$ を求められる' }] },

      // ---------- 合成して ----------
      { clear: true, part: '合成して', say: '$y=\\sqrt3\\sin\\theta+\\cos\\theta$（$0\\le\\theta\\le\\pi$）。前の時間の合成で、$y=2\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)$ と、1つの sin にまとめます。',
        add: [{ t: 'h', text: '$y=\\sqrt3\\sin\\theta+\\cos\\theta$（$0\\le\\theta\\le\\pi$）' },
          { t: 'm', tex: 'y=2\\sin\\left(\\theta+\\frac{\\pi}{6}\\right)', note: 'P$(\\sqrt3,\\ 1)$ で\n$r=2,\\ \\alpha=\\frac{\\pi}{6}$' }] },
      { say: '$\\theta+\\dfrac{\\pi}{6}=t$ とおくと、$0\\le\\theta\\le\\pi$ より $\\dfrac{\\pi}{6}\\le t\\le\\dfrac76\\pi$。単位円で、この範囲の弧（黄）の **y 座標** がどこまで動くかを見ます。',
        add: [{ t: 'm', tex: '\\theta+\\frac{\\pi}{6}=t\\ \\ \\text{とおくと}\\ \\ \\hy{\\frac{\\pi}{6}\\le t\\le\\frac76\\pi}' },
          UC('f1', [{ k: 'arc', o: [0, 0], r: 1, a1: 30, a2: 210, c: 'y', wd: 8 }, { k: 'pt', at: at(30, 1), c: 'y', r: 7 }, { k: 'pt', at: at(210, 1), c: 'y', r: 7 },
            tag(30, 'π/6', 'y', 26, 14), tag(210, '7π/6', 'y', -34, 16)])] },
      { ask: { type: 'choice', q: 'この範囲で、$\\sin t$ の最小値は？',
        opts: ['$-1$', '$\\dfrac12$', '$0$', '$-\\dfrac12$'], ok: 3,
        why: { 0: '$t=\\dfrac32\\pi$ は範囲に入っていません。弧の下のはしは $t=\\dfrac76\\pi$ です。', 1: 'それは $t=\\dfrac{\\pi}{6}$ のとき。$t=\\dfrac76\\pi$ のほうが小さくなります。', 2: '$t=\\pi$ で 0 ですが、その先の $\\dfrac76\\pi$ まで弧があります。' },
        good: '弧のいちばん下は $t=\\dfrac76\\pi$ の点で、$\\sin\\dfrac76\\pi=-\\dfrac12$。いちばん上は $t=\\dfrac{\\pi}{2}$ で 1 です。',
        add: [{ t: 'm', tex: '-\\frac12\\le\\sin t\\le1\\ \\ \\text{より}\\ \\ -1\\le y\\le2' }],
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: [0, 1], c: 'p', r: 8 }, { k: 'label', at: [0, 1], text: 't=π/2', c: 'p', size: 21, dy: 30 },
          { k: 'seg', a: at(210, 1), b: [1.3, -0.5], c: 'p', wd: 2, dash: true }, { k: 'label', at: [1.3, -0.5], text: '−1/2', c: 'p', size: 21, dy: 20, anchor: 'end' }] }] } },
      { say: '最大は $t=\\dfrac{\\pi}{2}$、つまり $\\theta=\\dfrac{\\pi}{3}$ のとき $y=2$。最小は $t=\\dfrac76\\pi$、つまり $\\theta=\\pi$ のとき $y=-1$ です。θ にもどして答えます。',
        add: [{ t: 'ans', label: '答', text: '最大値 $2$（$\\theta=\\dfrac{\\pi}{3}$）、最小値 $-1$（$\\theta=\\pi$）' }] },

      // ---------- おきかえ ----------
      { clear: true, part: 'おきかえ', say: '$y=\\cos^2\\theta-\\sin\\theta+1$（$0\\le\\theta<2\\pi$）。$\\cos^2\\theta=1-\\sin^2\\theta$ で sin だけの式にして、$\\sin\\theta=t$ とおきます。',
        add: [{ t: 'h', text: '$y=\\cos^2\\theta-\\sin\\theta+1$（$0\\le\\theta<2\\pi$）' },
          { t: 'm', tex: 'y=(1-\\sin^2\\theta)-\\sin\\theta+1=-t^2-t+2', note: '$\\sin\\theta=t$' }] },
      { ask: { type: 'choice', q: '$t=\\sin\\theta$ のとる値の範囲は？',
        opts: ['$0\\le t<2\\pi$', '$-1\\le t\\le1$', 't はすべての実数', '$0\\le t\\le1$'], ok: 1,
        why: { 0: 'それは $\\theta$ の範囲です。$t=\\sin\\theta$ の値の範囲を考えます。', 2: '$\\sin\\theta$ は $-1$ から $1$ までの値しかとりません。', 3: '$\\pi<\\theta<2\\pi$ では、$\\sin\\theta$ は負になります。' },
        good: '$0\\le\\theta<2\\pi$ では、$\\sin\\theta$ は $-1$ から $1$ までのすべての値をとります。',
        add: [{ t: 'm', tex: '-1\\le t\\le1' }] } },
      { say: '数学Ⅰの2次関数と同じく、平方完成します。$y=-\\left(t+\\dfrac12\\right)^2+\\dfrac94$。$-1\\le t\\le1$ の部分のグラフ（実線）で、最大・最小を読みます。',
        add: [{ t: 'm', tex: 'y=-\\left(t+\\frac12\\right)^2+\\frac94\\quad(-1\\le t\\le1)' },
          { t: 'fig', id: 'g1', col: 1, view: [-1.6, -0.5, 1.6, 2.75], w: 480, h: 440, items: [
            { k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [[2, '2'], [2.25, '']], xl: 't' },
            { k: 'fn', f: '-x**2-x+2', a: -1.6, b: 1.5, c: 'd', dash: true }, { k: 'fn', f: '-x**2-x+2', a: -1, b: 1, c: 'y', wd: 4 },
            { k: 'line', x: -0.5, c: 'w', dash: true }, { k: 'pt', at: [-0.5, 2.25], c: 'y', r: 7, name: '(−1/2, 9/4)', dir: 'n', size: 21 },
            { k: 'pt', at: [-1, 2], c: 'y', r: 6, name: '2', dir: 'w', size: 21 }, { k: 'pt', at: [1, 0], c: 'y', r: 6 }] }] },
      { ask: { type: 'choice', q: '$y$ の最小値は？',
        opts: ['$0$', '$2$', '最小値はない', '$\\dfrac94$'], ok: 0,
        why: { 1: 'それは $t=-1$ のとき。軸 $t=-\\dfrac12$ から遠いはし $t=1$ のほうが小さくなります。', 2: 't の範囲が $-1\\le t\\le1$ と決まっているので、最小値はあります。', 3: 'それは最大値（頂点）です。' },
        good: '軸 $t=-\\dfrac12$ から遠いはし $t=1$ で最小。$y=-1-1+2=0$ です。',
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [1, 0], c: 'p', r: 8, name: '(1, 0)', dir: 'ne', size: 21 }] }] } },
      { say: 'θ にもどします。最大は $t=-\\dfrac12$、つまり $\\sin\\theta=-\\dfrac12$ で $\\theta=\\dfrac76\\pi,\\ \\dfrac{11}{6}\\pi$。最小は $t=1$、つまり $\\theta=\\dfrac{\\pi}{2}$ のときです。',
        add: [{ t: 'ans', label: '答', text: '最大値 $\\dfrac94$（$\\theta=\\dfrac76\\pi,\\ \\dfrac{11}{6}\\pi$）\n最小値 $0$（$\\theta=\\dfrac{\\pi}{2}$）' }] },
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　$y=\\cos2\\theta+2\\sin\\theta$（$0\\le\\theta<2\\pi$）' },
          { t: 'p', size: 'sm', text: 'cos2θ と sinθ がまざっている → 2倍角の公式でそろえる' },
          { t: 'fig', id: 'g2', col: 1, view: [-1.6, -3.4, 1.6, 2.1], w: 440, h: 440, items: [{ k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [[1, '1']], xl: 't' }] }],
        ask: { type: 'think', q: '$y=\\cos2\\theta+2\\sin\\theta$（$0\\le\\theta<2\\pi$）の最大値・最小値と、そのときの $\\theta$ を求めよう。',
        hint: '$\\cos2\\theta=1-2\\sin^2\\theta$ で sin だけの式に。$\\sin\\theta=t$（$-1\\le t\\le1$）とおいて平方完成。',
        ans: '$y=-2t^2+2t+1=-2\\left(t-\\dfrac12\\right)^2+\\dfrac32$。最大値 $\\dfrac32$（$\\theta=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$）、最小値 $-3$（$\\theta=\\dfrac32\\pi$）',
        after: '2倍角の公式で1種類の三角関数にそろえれば、あとは同じおきかえの方法です。',
        add: [{ t: 'm', tex: 'y=(1-2t^2)+2t=-2\\left(t-\\frac12\\right)^2+\\frac32', note: '$\\sin\\theta=t$\n$-1\\le t\\le1$' },
          { t: 'ans', label: '答', text: '最大値 $\\dfrac32$（$\\theta=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$）\n最小値 $-3$（$\\theta=\\dfrac32\\pi$）' }],
        draw: [{ fig: 'g2', items: [{ k: 'fn', f: '-2*x**2+2*x+1', a: -1.5, b: 1.6, c: 'd', dash: true }, { k: 'fn', f: '-2*x**2+2*x+1', a: -1, b: 1, c: 'y', wd: 4 },
          { k: 'pt', at: [0.5, 1.5], c: 'y', r: 7, name: '(1/2, 3/2)', dir: 'ne', size: 21 }, { k: 'pt', at: [-1, -3], c: 'p', r: 7, name: '(−1, −3)', dir: 'e', size: 21 }, { k: 'pt', at: [1, 1], c: 'y', r: 6 }] }] } },

      // ---------- 2倍角を使う ----------
      { clear: true, part: '2倍角を使う', say: '$y=\\sin^2\\theta+2\\sin\\theta\\cos\\theta+3\\cos^2\\theta$（$0\\le\\theta\\le\\dfrac{\\pi}{2}$）。2次の式ですが、2倍角の公式で、$\\sin2\\theta,\\ \\cos2\\theta$ の1次の式に直せます。',
        add: [{ t: 'h', text: '$y=\\sin^2\\theta+2\\sin\\theta\\cos\\theta+3\\cos^2\\theta$（$0\\le\\theta\\le\\dfrac{\\pi}{2}$）' },
          { t: 'p', size: 'sm', text: '$\\sin^2\\theta=\\dfrac{1-\\cos2\\theta}{2}$、$\\cos^2\\theta=\\dfrac{1+\\cos2\\theta}{2}$、$2\\sin\\theta\\cos\\theta=\\sin2\\theta$' }] },
      { say: '入れて整理すると $y=\\sin2\\theta+\\cos2\\theta+2$。さらに $\\sin2\\theta+\\cos2\\theta$ を合成して、$y=\\sqrt2\\sin\\left(2\\theta+\\dfrac{\\pi}{4}\\right)+2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}y&=\\frac{1-\\cos2\\theta}{2}+\\sin2\\theta+\\frac{3(1+\\cos2\\theta)}{2}\\\\ &=\\sin2\\theta+\\cos2\\theta+2\\\\ &=\\sqrt2\\sin\\left(2\\theta+\\frac{\\pi}{4}\\right)+2\\end{aligned}' }] },
      { say: '$2\\theta+\\dfrac{\\pi}{4}=t$ とおきます。$0\\le\\theta\\le\\dfrac{\\pi}{2}$ を **2倍してから** $\\dfrac{\\pi}{4}$ をたして、$\\dfrac{\\pi}{4}\\le t\\le\\dfrac54\\pi$。この弧で sin の値を見ます。',
        add: [{ t: 'm', tex: '\\frac{\\pi}{4}\\le t\\le\\frac54\\pi\\ \\ \\text{より}\\ \\ -\\frac{1}{\\sqrt2}\\le\\sin t\\le1' },
          UC('f2', [{ k: 'arc', o: [0, 0], r: 1, a1: 45, a2: 225, c: 'y', wd: 8 }, { k: 'pt', at: at(45, 1), c: 'y', r: 7 }, { k: 'pt', at: at(225, 1), c: 'y', r: 7 },
            tag(45, 'π/4', 'y', 26, -8), tag(225, '5π/4', 'y', -34, 14), { k: 'pt', at: [0, 1], c: 'p', r: 8 }, { k: 'label', at: [0, 1], text: 't=π/2', c: 'p', size: 21, dy: 30 }])] },
      { ask: { type: 'choice', q: '$y$ の最大値は？',
        opts: ['$4$', '$\\sqrt2$', '$2+\\sqrt2$', '$3$'], ok: 2,
        why: { 0: '$\\sin2\\theta$ と $\\cos2\\theta$ は同時に 1 にはなりません。合成すると最大は $\\sqrt2$。', 1: '定数の $+2$ をわすれています。', 3: 'それは $\\theta=0$ のときの値。もっと大きくなる所があります。' },
        good: '$t=\\dfrac{\\pi}{2}$、つまり $2\\theta+\\dfrac{\\pi}{4}=\\dfrac{\\pi}{2}$ から $\\theta=\\dfrac{\\pi}{8}$ のとき、最大値 $2+\\sqrt2$。' } },
      { say: '最小は $t=\\dfrac54\\pi$、つまり $\\theta=\\dfrac{\\pi}{2}$ のときで、$y=\\sqrt2\\cdot\\left(-\\dfrac{1}{\\sqrt2}\\right)+2=1$。もとの式に $\\theta=\\dfrac{\\pi}{2}$ を入れても $y=1$ で、合っています。',
        add: [{ t: 'ans', label: '答', text: '最大値 $2+\\sqrt2$（$\\theta=\\dfrac{\\pi}{8}$）、最小値 $1$（$\\theta=\\dfrac{\\pi}{2}$）' },
          { t: 'p', col: 1, size: 'sm', text: '確かめ：$\\theta=\\dfrac{\\pi}{2}$ なら $\\sin\\theta=1,\\ \\cos\\theta=0$ で $y=1$' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角関数の章はここまで。次の章では、**指数関数と対数関数** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
