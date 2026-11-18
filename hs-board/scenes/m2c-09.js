/* 数学Ⅱ 第3章 三角関数 加法定理 ③：三角関数の合成
   a sinθ + b cosθ = r sin(θ+α)。点 (a, b) と角 α の図。sinθ+√3cosθ、√3sinθ−cosθ、−sinθ+cosθ、2sinθ+cosθ。
   例はすべて自作。合成の式は python3（sympy の expand_trig で差が 0）で、方程式 √3sinθ−cosθ=1 の解（π/3, π）は sympy と数値の走査で検算ずみ。 */
(function () {
  const POINTS = [
    '$a\\sin\\theta+b\\cos\\theta=r\\sin(\\theta+\\alpha)$。点 P$(a,\\ b)$ をとると、$r=\\mathrm{OP}=\\sqrt{a^2+b^2}$、$\\alpha$ は動径 OP の表す角（$\\cos\\alpha=\\dfrac ar,\\ \\sin\\alpha=\\dfrac br$）',
    '**sin の係数を x 座標、cos の係数を y 座標** にとる（逆にしない）。P の象限を図で確かめて $\\alpha$ を決める。有名な角でないときは「$\\cos\\alpha=\\dfrac ar,\\ \\sin\\alpha=\\dfrac br$ を満たす角」と書く',
    '合成すると1つの sin になるので、値の範囲（最大値 $r$・最小値 $-r$）、方程式の解、グラフ（周期 $2\\pi$ の波）がわかる'
  ];
  const D = Math.PI / 180, R3 = Math.sqrt(3), PI = Math.PI;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  // 点 P(a, b) の合成の図：OP（黄）、x・y への点線、角 α（緑）
  const comp = (a, b, o) => {
    o = o || {}; const deg = Math.atan2(b, a) / D, c = o.c || 'y';
    return [{ k: 'seg', a: [a, b], b: [a, 0], c: 'd', wd: 2, dash: true }, { k: 'seg', a: [a, b], b: [0, b], c: 'd', wd: 2, dash: true },
      { k: 'seg', a: [0, 0], b: [a, b], c, wd: 4 }, { k: 'arc', o: [0, 0], rp: o.rp || 40, a1: 0, a2: deg, c: 'g', wd: 3 },
      { k: 'pt', at: [a, b], c, r: 7, name: o.name, dir: o.dir || 'ne', size: 24 }];
  };

  HB.lesson({
    id: 'm2c-09', field: '数学Ⅱ　三角関数', title: '三角関数の合成', level: '加法定理', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\sin\\theta+\\sqrt3\\cos\\theta$ を $r\\sin(\\theta+\\alpha)$ の形に表せ（$r>0,\\ -\\pi<\\alpha\\le\\pi$）', '(2)　$\\sqrt3\\sin\\theta-\\cos\\theta$、$-\\sin\\theta+\\cos\\theta$ を合成せよ', '(3)　$2\\sin\\theta+\\cos\\theta$ を合成せよ', '(4)　$y=\\sin\\theta+\\sqrt3\\cos\\theta$ の最大値', '(5)　$0\\le\\theta<2\\pi$ のとき、$\\sqrt3\\sin\\theta-\\cos\\theta=1$ を解け'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までは、加法定理で $\\sin(\\theta+\\alpha)$ を **展開** しました。この時間は逆に、$a\\sin\\theta+b\\cos\\theta$ を1つの sin に **まとめる**、三角関数の合成を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$a\\sin\\theta+b\\cos\\theta$ を $r\\sin(\\theta+\\alpha)$ の形に変形できる\n合成を使って、最大値や方程式を考えられる' }] },

      // ---------- しくみ ----------
      { clear: true, part: '合成のしくみ', say: '加法定理で $r\\sin(\\theta+\\alpha)$ を展開すると、$r\\cos\\alpha\\cdot\\sin\\theta+r\\sin\\alpha\\cdot\\cos\\theta$。$a\\sin\\theta+b\\cos\\theta$ と比べると、$a=r\\cos\\alpha$、$b=r\\sin\\alpha$ となればよいとわかります。',
        add: [{ t: 'h', text: '合成のしくみ' },
          { t: 'm', size: 'sm', tex: 'r\\sin(\\theta+\\alpha)=\\hy{r\\cos\\alpha}\\,\\sin\\theta+\\hb{r\\sin\\alpha}\\,\\cos\\theta' },
          { t: 'm', size: 'sm', tex: 'a\\sin\\theta+b\\cos\\theta\\ \\text{と比べて}\\ \\ \\hy{a=r\\cos\\alpha},\\ \\ \\hb{b=r\\sin\\alpha}' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.45, -0.45, 2.15, 1.55], w: 520, h: 400, items: [{ k: 'axes', tx: [[1.6, 'a']], ty: [[1.0, 'b']] }].concat(comp(1.6, 1.0, { name: 'P(a, b)' }),
            [{ k: 'label', at: [0.8, 0.5], text: 'r', c: 'y', size: 26, dx: -10, dy: -16 }, { k: 'label', at: at(16, 0.38), text: 'α', c: 'g', size: 24 }]) }] },
      { say: 'これは、**点 P$(a,\\ b)$** をとると、$r$ が OP の長さ、$\\alpha$ が動径 OP の表す角、ということです。三平方の定理から $r=\\sqrt{a^2+b^2}$ です。',
        add: [{ t: 'box', c: 'y', label: '三角関数の合成', text: '$a\\sin\\theta+b\\cos\\theta=r\\sin(\\theta+\\alpha)$\n$r=\\sqrt{a^2+b^2}$、$\\cos\\alpha=\\dfrac ar,\\ \\ \\sin\\alpha=\\dfrac br$' },
          { t: 'p', size: 'sm', text: '[[y:sin の係数 → x 座標]]、[[b:cos の係数 → y 座標]]' }] },

      // ---------- 例 ----------
      { clear: true, part: '合成の例', say: '$\\sin\\theta+\\sqrt3\\cos\\theta$ を合成します。sin の係数 1 を x 座標、cos の係数 $\\sqrt3$ を y 座標にとって、点 P$(1,\\ \\sqrt3)$。OP$=2$、角は $\\dfrac{\\pi}{3}$ です。',
        add: [{ t: 'h', text: '$\\sin\\theta+\\sqrt3\\cos\\theta$' },
          { t: 'm', tex: 'r=\\sqrt{1^2+(\\sqrt3)^2}=2,\\qquad \\alpha=\\frac{\\pi}{3}', note: 'P$(1,\\ \\sqrt3)$' },
          { t: 'ans', label: '答', tex: '\\sin\\theta+\\sqrt3\\cos\\theta=2\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)' },
          { t: 'fig', id: 'f2', col: 1, view: [-0.6, -0.45, 1.9, 2.1], w: 420, h: 428, items: [{ k: 'axes', tx: [[1, '1']], ty: [[R3, '√3']] }].concat(comp(1, R3, { name: 'P(1, √3)', rp: 36 }),
            [{ k: 'label', at: [0.5, R3 / 2], text: '2', c: 'y', size: 26, dx: -16, dy: -10 }, { k: 'label', at: at(30, 0.3), text: 'π/3', c: 'g', size: 22, dx: 12 }]) }] },
      { say: '確かめに、右辺を加法定理で展開すると、$2\\left(\\sin\\theta\\cdot\\dfrac12+\\cos\\theta\\cdot\\dfrac{\\sqrt3}{2}\\right)$ で、もとの式にもどります。',
        add: [{ t: 'm', size: 'sm', tex: '2\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)=2\\left(\\sin\\theta\\cdot\\frac12+\\cos\\theta\\cdot\\frac{\\sqrt3}{2}\\right)=\\sin\\theta+\\sqrt3\\cos\\theta' }] },
      { clear: true, cols: [1], part: 'グラフ', say: 'グラフでも確かめます。$y=\\sin\\theta+\\sqrt3\\cos\\theta$ のグラフは、$y=2\\sin\\theta$ を θ 軸方向に $-\\dfrac{\\pi}{3}$ 平行移動した、振れ幅 2 の波になっています。',
        add: [{ t: 'h', text: '$y=\\sin\\theta+\\sqrt3\\cos\\theta=2\\sin\\left(\\theta+\\dfrac{\\pi}{3}\\right)$ のグラフ' },
          { t: 'fig', id: 'g1', view: [-1.4, -2.5, 7.25, 2.5], w: 1100, h: 330, items: [
            { k: 'axes', tx: [[PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']], ty: [[2, '2'], [1, '1'], [-1, '−1'], [-2, '−2']], xl: 'θ' },
            { k: 'fn', f: '2*sin(x)', a: -1.4, b: 7.2, c: 'd', dash: true, label: 'y=2sinθ', lat: [2.6, 2.05] },
            { k: 'fn', f: 'sin(x)+sqrt(3)*cos(x)', a: -1.4, b: 7.2, c: 'y', label: 'y=sinθ+√3cosθ', lat: [3.9, 1.55] },
            { k: 'vec', a: [PI / 2 - 0.06, 2.0], b: [PI / 6 + 0.08, 2.0], c: 'p', wd: 3 }, { k: 'pt', at: [PI / 6, 2], c: 'y', r: 6 }, { k: 'label', at: [PI / 3, 2], text: '−π/3', c: 'p', size: 21, dy: -20 }] },
          { t: 'p', size: 'sm', text: '最大値 2、最小値 $-2$、周期 $2\\pi$ の波' }] },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '合成の練習' },
          { t: 'fig', id: 'f3', col: 1, view: [-1.55, -1.3, 2.15, 1.55], w: 520, h: 401, items: [{ k: 'axes', tx: [[R3, '√3'], [-1, '−1']], ty: [[1, '1'], [-1, '−1']] }] }],
        ask: { type: 'choice', q: '$\\sqrt3\\sin\\theta-\\cos\\theta$ を合成すると？',
          opts: ['$2\\sin\\left(\\theta+\\dfrac{\\pi}{6}\\right)$', '$2\\sin\\left(\\theta-\\dfrac{\\pi}{6}\\right)$', '$4\\sin\\left(\\theta-\\dfrac{\\pi}{6}\\right)$', '$2\\sin\\left(\\theta+\\dfrac23\\pi\\right)$'], ok: 1,
          why: { 0: 'P$(\\sqrt3,\\ -1)$ は第4象限。角は負の向きに $\\dfrac{\\pi}{6}$ です。', 2: '$r=\\sqrt{3+1}=2$。平方根をとりわすれています。', 3: 'x 座標と y 座標を逆にとっています。x 座標は sin の係数 $\\sqrt3$ です。' },
          good: 'P$(\\sqrt3,\\ -1)$ で、$r=2$、$\\alpha=-\\dfrac{\\pi}{6}$ です。',
          add: [{ t: 'm', tex: '\\sqrt3\\sin\\theta-\\cos\\theta=\\ans{2\\sin\\left(\\theta-\\frac{\\pi}{6}\\right)}', note: 'P$(\\sqrt3,\\ -1)$' }],
          draw: [{ fig: 'f3', items: comp(R3, -1, { name: 'P', dir: 'se', rp: 46 }).concat([{ k: 'label', at: at(-15, 0.5), text: '−π/6', c: 'g', size: 21, dx: 14 }]) }] } },
      { ask: { type: 'choice', q: '$-\\sin\\theta+\\cos\\theta$ を合成すると？',
        opts: ['$\\sqrt2\\sin\\left(\\theta-\\dfrac{\\pi}{4}\\right)$', '$\\sqrt2\\sin\\left(\\theta+\\dfrac{\\pi}{4}\\right)$', '$2\\sin\\left(\\theta+\\dfrac34\\pi\\right)$', '$\\sqrt2\\sin\\left(\\theta+\\dfrac34\\pi\\right)$'], ok: 3,
        why: { 0: '「$\\tan\\alpha=-1$」だけで決めると、第4象限の角と取りちがえます。Q$(-1,\\ 1)$ は第2象限です。', 1: '点を $(1,\\ 1)$ にしています。sin の係数は $-1$ です。', 2: '$r=\\sqrt{(-1)^2+1^2}=\\sqrt2$ です。' },
        good: 'Q$(-1,\\ 1)$ は第2象限で、$r=\\sqrt2$、$\\alpha=\\dfrac34\\pi$。図をかいて角を読みます。',
        add: [{ t: 'm', tex: '-\\sin\\theta+\\cos\\theta=\\ans{\\sqrt2\\sin\\left(\\theta+\\frac34\\pi\\right)}', note: 'Q$(-1,\\ 1)$' }],
        draw: [{ fig: 'f3', items: comp(-1, 1, { name: 'Q', dir: 'nw', c: 'b', rp: 30 }).concat([{ k: 'label', at: at(70, 0.36), text: '3π/4', c: 'g', size: 21, dx: 16 }]) }] } },

      // ---------- 有名でない角 ----------
      { clear: true, part: '有名でない角', say: '$2\\sin\\theta+\\cos\\theta$ は P$(2,\\ 1)$、$r=\\sqrt5$。角は有名な角ではないので、$\\alpha$ を「$\\cos\\alpha=\\dfrac{2}{\\sqrt5},\\ \\sin\\alpha=\\dfrac{1}{\\sqrt5}$ を満たす角」として書きます。',
        add: [{ t: 'h', text: '$2\\sin\\theta+\\cos\\theta$' },
          { t: 'm', tex: '2\\sin\\theta+\\cos\\theta=\\sqrt5\\sin(\\theta+\\alpha)' },
          { t: 'p', size: 'sm', text: 'ただし、$\\alpha$ は $\\cos\\alpha=\\dfrac{2}{\\sqrt5},\\ \\sin\\alpha=\\dfrac{1}{\\sqrt5}$ を満たす角' },
          { t: 'fig', id: 'f4', col: 1, view: [-0.45, -0.45, 2.5, 1.45], w: 520, h: 335, items: [{ k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[1, '1']] }].concat(comp(2, 1, { name: 'P(2, 1)', rp: 60 }),
            [{ k: 'line', m: 1, n: 0, a: -0.3, b: 1.4, c: 'w', dash: true }, { k: 'label', at: [1.35, 1.35], text: 'y=x', size: 21, anchor: 'end', dx: -8 },
              { k: 'label', at: [1, 0.5], text: '√5', c: 'y', size: 24, dx: -14, dy: -18 }, { k: 'label', at: at(13, 0.42), text: 'α', c: 'g', size: 24, dx: 6 }]) }] },
      { ask: { type: 'choice', q: 'この $\\alpha$ は、どの範囲の角？',
        opts: ['$0<\\alpha<\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{4}<\\alpha<\\dfrac{\\pi}{2}$', '$\\dfrac{\\pi}{2}<\\alpha<\\pi$', '$-\\dfrac{\\pi}{2}<\\alpha<0$'], ok: 0,
        why: { 1: 'P$(2,\\ 1)$ は直線 $y=x$ より下にあります。$\\dfrac{\\pi}{4}$ より小さい角です。', 2: 'P は第1象限にあります。', 3: 'P の y 座標は正なので、$\\alpha$ は正の角です。' },
        good: 'P$(2,\\ 1)$ は第1象限で、直線 $y=x$ より下なので $0<\\alpha<\\dfrac{\\pi}{4}$（約 $26.6^\\circ$）です。' } },

      // ---------- 最大値と方程式 ----------
      { clear: true, part: '合成の使い道', add: [{ t: 'h', text: '合成すると…' },
          { t: 'm', tex: 'y=\\sin\\theta+\\sqrt3\\cos\\theta=2\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)' },
          { t: 'fig', id: 'f5', col: 1, view: [-1.45, -1.22, 1.45, 1.22], w: 530, h: 446, items: [{ k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
            { k: 'label', at: [1, 0], text: '1', c: 'd', size: 21, dx: 12, dy: 18 }, { k: 'label', at: [0, 1], text: '1', c: 'd', size: 21, dx: -14, dy: -14 }] }],
        ask: { type: 'choice', q: '$y=\\sin\\theta+\\sqrt3\\cos\\theta$ の最大値は？',
          opts: ['$1+\\sqrt3$', '$2$', '$4$', '$\\sqrt3$'], ok: 1,
          why: { 0: '$\\sin\\theta$ と $\\cos\\theta$ は、同じ $\\theta$ で同時に最大にはなりません。', 2: '$r=2$ です。$r^2$ ではありません。', 3: '$\\theta=\\dfrac{\\pi}{6}$ のとき $y=\\dfrac12+\\dfrac32=2$ となり、$\\sqrt3$ より大きくなります。' },
          good: 'sin の値は 1 以下なので、最大値は 2（$\\theta+\\dfrac{\\pi}{3}=\\dfrac{\\pi}{2}$、つまり $\\theta=\\dfrac{\\pi}{6}$ のとき）。くわしくは次の時間に。',
          add: [{ t: 'm', tex: '-1\\le\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)\\le1\\ \\ \\text{より}\\ \\ -2\\le y\\le2', note: '最大値 2\n（$\\theta=\\dfrac{\\pi}{6}$）' }] } },
      { ask: { type: 'think', q: '$0\\le\\theta<2\\pi$ のとき、$\\sqrt3\\sin\\theta-\\cos\\theta=1$ を解こう。',
        hint: '練習で合成した $2\\sin\\left(\\theta-\\dfrac{\\pi}{6}\\right)$ を使い、$\\theta-\\dfrac{\\pi}{6}=t$ とおく。t の範囲は $-\\dfrac{\\pi}{6}\\le t<\\dfrac{11}{6}\\pi$。',
        ans: '$\\sin t=\\dfrac12$ より $t=\\dfrac{\\pi}{6},\\ \\dfrac56\\pi$。$\\theta=t+\\dfrac{\\pi}{6}$ で　$\\theta=\\dfrac{\\pi}{3},\\ \\pi$',
        after: '確かめ：$\\theta=\\pi$ なら $\\sqrt3\\cdot0-(-1)=1$。合成すると、sin だけの方程式になります。',
        add: [{ t: 'm', tex: '2\\sin\\left(\\theta-\\frac{\\pi}{6}\\right)=1\\ \\ \\text{より}\\ \\ \\sin t=\\frac12\\ \\ \\left(-\\frac{\\pi}{6}\\le t<\\frac{11}{6}\\pi\\right)' },
          { t: 'ans', label: '答', tex: '\\theta=\\frac{\\pi}{3},\\ \\pi' }],
        draw: [{ fig: 'f5', items: [{ k: 'seg', a: [-1.4, 0.5], b: [1.4, 0.5], c: 'p', dash: true }, { k: 'label', at: [1.42, 0.5], text: 'y=1/2', c: 'p', size: 21, anchor: 'end', dy: 20 },
          { k: 'seg', a: [0, 0], b: at(30, 1), c: 'y', wd: 3.5 }, { k: 'pt', at: at(30, 1), c: 'y', r: 7 }, { k: 'seg', a: [0, 0], b: at(150, 1), c: 'y', wd: 3.5 }, { k: 'pt', at: at(150, 1), c: 'y', r: 7 },
          { k: 'label', at: at(30, 1), text: 't=π/6', c: 'y', size: 21, dx: 12, dy: -26, anchor: 'start' }, { k: 'label', at: at(150, 1), text: 't=5π/6', c: 'y', size: 21, dx: -12, dy: -26, anchor: 'end' }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、合成やおきかえを使って、三角関数の **最大・最小** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
