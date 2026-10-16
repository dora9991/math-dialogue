/* 数学Ⅱ 第3章 三角関数 ⑤：三角関数のグラフ
   y=sinθ・cosθ・tanθ のグラフ、周期、漸近線、y=2sinθ・sin2θ・sin(θ−π/3) の拡大・平行移動と周期。
   例はすべて自作。周期・平行移動（cosθ=sin(θ+π/2)、sin(2θ−π/2)=sin2(θ−π/4)）は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '$y=\\sin\\theta$、$y=\\cos\\theta$ のグラフは同じ形の波（**正弦曲線**）。**周期** は $2\\pi$、値の範囲は $-1\\le y\\le1$。$y=\\cos\\theta$ は $y=\\sin\\theta$ を θ 軸方向に $-\\dfrac{\\pi}{2}$ 平行移動したもの',
    '$y=\\tan\\theta$ の **周期** は $\\pi$。直線 $\\theta=\\dfrac{\\pi}{2}+n\\pi$（$n$ は整数）が **漸近線**',
    '$y=a\\sin\\theta$ は y 軸方向に $a$ 倍（周期はそのまま）、$y=\\sin k\\theta$ は θ 軸方向に $\\dfrac1k$ 倍（周期 $\\dfrac{2\\pi}{k}$）、$y=\\sin(\\theta-p)$ は θ 軸方向に $p$ 平行移動。$\\sin(2\\theta-q)$ は2でくくってから読む'
  ];
  const PI = Math.PI;
  const TX = [[PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']], TY1 = [[1, '1'], [-1, '−1']];
  // 横長のグラフ（1列のページ用）
  const G = (id, items, o) => { o = o || {}; return { t: 'fig', id, view: o.view || [-0.9, -1.55, 7.25, 1.55], w: o.w || 1100, h: o.h || 300,
    items: [{ k: 'axes', tx: o.tx || TX, ty: o.ty || TY1, xl: 'θ' }].concat(items) }; };

  HB.lesson({
    id: 'm2c-05', field: '数学Ⅱ　三角関数', title: '三角関数のグラフ', level: '三角関数', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: '次の関数のグラフをかき、周期を答えよ。',
      parts: ['(1)　$y=\\sin\\theta$、$y=\\cos\\theta$、$y=\\tan\\theta$', '(2)　$y=2\\sin\\theta$', '(3)　$y=\\sin2\\theta$、$y=\\sin3\\theta$', '(4)　$y=\\sin\\left(\\theta-\\dfrac{\\pi}{3}\\right)$', '(5)　$y=\\sin\\left(2\\theta-\\dfrac{\\pi}{2}\\right)$'] },
    points: POINTS,
    cols: [1],
    steps: [
      { part: 'めあて', say: '前の時間までに、単位円を使って三角関数の値や性質を調べました。この時間は、$\\theta$ を横軸にとって、三角関数の **グラフ** をかきます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$y=\\sin\\theta,\\ y=\\cos\\theta,\\ y=\\tan\\theta$ のグラフの形と **周期** がわかる\n$y=2\\sin\\theta$、$y=\\sin2\\theta$、$y=\\sin\\left(\\theta-\\dfrac{\\pi}{3}\\right)$ などのグラフをかける' }] },

      // ---------- y = sinθ ----------
      { clear: true, part: 'y=sinθ', say: '単位円の上で、角 $\\theta$ の点 P の y 座標が $\\sin\\theta$ でした。$\\theta$ を横軸、$\\sin\\theta$ を縦軸にとって点を打っていくと、なめらかな波の形になります。',
        add: [{ t: 'h', text: '$y=\\sin\\theta$ のグラフ　（P の y 座標を横に写す）' },
          G('f1', [{ k: 'circle', o: [-1.75, 0], r: 1, c: 'w', wd: 2.5 },
            { k: 'seg', a: [-1.75, 0], b: [-1.25, 0.866], c: 'y', wd: 3 }, { k: 'pt', at: [-1.25, 0.866], c: 'y', r: 6, name: 'P', dir: 'nw', size: 22 },
            { k: 'arc', o: [-1.75, 0], rp: 26, a1: 0, a2: 60, c: 'g', wd: 2.5 }, { k: 'label', at: [-1.75, 0], text: 'θ', c: 'g', size: 22, dx: 42, dy: -20 },
            { k: 'seg', a: [-1.25, 0.866], b: [PI / 3, 0.866], c: 'y', wd: 2, dash: true }, { k: 'seg', a: [PI / 3, 0], b: [PI / 3, 0.866], c: 'g', wd: 2, dash: true },
            { k: 'fn', f: 'sin(x)', a: 0, b: 7.2, c: 'y', label: 'y=sinθ', lat: [4.5, -1.32] },
            { k: 'pt', at: [PI / 3, 0.866], c: 'y', r: 6 }], { view: [-2.9, -1.45, 7.25, 1.45], h: 314 })] },
      { say: '$\\theta$ が $2\\pi$ 進むと、P は円を1周して同じ位置にもどるので、同じ形がくり返されます。このような関数を **周期関数**、くり返しの最小の幅を **周期** といいます。',
        add: [{ t: 'box', c: 'y', label: '周期', text: '$\\sin(\\theta+2\\pi)=\\sin\\theta$　→　$y=\\sin\\theta$ の **周期は $2\\pi$**　　値の範囲は $-1\\le y\\le1$\nこのグラフの形の曲線を **正弦曲線** という' }] },

      // ---------- y = cosθ ----------
      { clear: true, part: 'y=cosθ', say: '$\\cos\\theta$ は点 P の x 座標です。$y=\\cos\\theta$ のグラフも、同じ形の波になります。$\\theta=0$ で最大値 1 から始まるのが、sin とのちがいです。',
        add: [{ t: 'h', text: '$y=\\cos\\theta$ のグラフ' },
          G('f2', [{ k: 'fn', f: 'sin(x)', a: -0.9, b: 7.2, c: 'd', dash: true, label: 'y=sinθ', lat: [2.05, 1.18] },
            { k: 'fn', f: 'cos(x)', a: -0.9, b: 7.2, c: 'b', label: 'y=cosθ', lat: [3.5, -1.3] },
            { k: 'pt', at: [0, 1], c: 'b', r: 6 }, { k: 'pt', at: [2 * PI, 1], c: 'b', r: 6 }]),
          { t: 'p', size: 'sm', text: 'cos も **周期 $2\\pi$**、値の範囲は $-1\\le y\\le1$' }] },
      { ask: { type: 'choice', q: '$y=\\cos\\theta$ のグラフは、$y=\\sin\\theta$ のグラフをどのように平行移動したもの？',
        opts: ['θ 軸方向に $\\dfrac{\\pi}{2}$', 'θ 軸方向に $-\\dfrac{\\pi}{2}$', 'y 軸方向に $1$', 'θ 軸方向に $\\pi$'], ok: 1,
        why: { 0: '右へ $\\dfrac{\\pi}{2}$ 動かすと、sin の山は $\\theta=\\pi$ に行きます。', 2: '上に 1 動かすと、値の範囲が 0〜2 になってしまいます。', 3: '$\\pi$ ずらすと、山と谷が入れかわった $y=-\\sin\\theta$ のグラフです。' },
        good: 'sin の山（$\\theta=\\dfrac{\\pi}{2}$）が $\\theta=0$ に来ているので、左へ $\\dfrac{\\pi}{2}$ です。',
        add: [{ t: 'm', tex: '\\cos\\theta=\\sin\\left(\\theta+\\frac{\\pi}{2}\\right)', note: 'θ 軸方向に $-\\dfrac{\\pi}{2}$ 平行移動' }],
        draw: [{ fig: 'f2', items: [{ k: 'vec', a: [PI / 2 - 0.08, 1.12], b: [0.1, 1.12], c: 'p', wd: 3 }, { k: 'label', at: [PI / 4, 1.12], text: '−π/2', c: 'p', size: 21, dy: -18 }] }] } },

      // ---------- y = tanθ ----------
      { clear: true, part: 'y=tanθ', say: '$\\tan\\theta$ は直線 OP の傾き。$\\theta$ が $\\dfrac{\\pi}{2}$ に近づくと、限りなく大きくなります。$\\theta=\\dfrac{\\pi}{2}+n\\pi$ では値がなく、グラフはその縦の直線に限りなく近づきます。',
        add: [{ t: 'h', text: '$y=\\tan\\theta$ のグラフ' },
          G('f3', [{ k: 'line', x: -PI / 2, c: 'p', dash: true }, { k: 'line', x: PI / 2, c: 'p', dash: true }, { k: 'line', x: 3 * PI / 2, c: 'p', dash: true },
            { k: 'fn', f: 'tan(x)', a: -2.35, b: 5.3, c: 'g', label: 'y=tanθ', lat: [2.55, -2.55] },
            { k: 'label', at: [PI / 2, 2.75], text: '漸近線', c: 'p', size: 21, anchor: 'start', dx: 10 }],
            { view: [-2.35, -3.2, 5.3, 3.2], h: 330, tx: [[-PI / 2, '−π/2'], [PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2']], ty: [[1, '1'], [-1, '−1']] })] },
      { say: 'グラフが限りなく近づく直線を **漸近線** といいます。$y=\\tan\\theta$ の漸近線は、直線 $\\theta=\\dfrac{\\pi}{2}+n\\pi$（n は整数）です。',
        add: [{ t: 'box', c: 'p', label: '漸近線', text: '直線 $\\theta=\\dfrac{\\pi}{2}+n\\pi$（$n$ は整数）　グラフは原点について対称' }] },
      { ask: { type: 'choice', q: '$y=\\tan\\theta$ の周期は？',
        opts: ['$2\\pi$', '$\\dfrac{\\pi}{2}$', '$\\pi$', '周期はない'], ok: 2,
        why: { 0: 'sin・cos は $2\\pi$ ですが、tan は $\\pi$ ごとに同じ形がくり返されます。', 1: '$\\dfrac{\\pi}{2}$ ずらすと、漸近線の位置がずれて重なりません。', 3: '$\\tan(\\theta+\\pi)=\\tan\\theta$ なので、周期関数です。' },
        good: '前の時間の $\\tan(\\theta+\\pi)=\\tan\\theta$ から、周期は $\\pi$ です。',
        draw: [{ fig: 'f3', items: [{ k: 'dim', a: [-PI / 2, -2.85], b: [PI / 2, -2.85], c: 'y', dy: 0, label: '周期 π' }] }] } },

      // ---------- 拡大・縮小 ----------
      { clear: true, part: '拡大・縮小', say: '$y=2\\sin\\theta$ のグラフは、$y=\\sin\\theta$ のグラフを **y 軸方向に 2 倍** に拡大したもの。値の範囲は $-2\\le y\\le2$ に広がりますが、周期は $2\\pi$ のままです。',
        add: [{ t: 'h', text: '$y=2\\sin\\theta$　（y 軸方向に 2 倍）' },
          G('f4', [{ k: 'fn', f: 'sin(x)', a: -0.9, b: 7.2, c: 'd', dash: true, label: 'y=sinθ', lat: [3.55, 0.55] },
            { k: 'fn', f: '2*sin(x)', a: -0.9, b: 7.2, c: 'y', label: 'y=2sinθ', lat: [2.15, 1.95] }],
            { view: [-0.9, -2.5, 7.25, 2.5], h: 330, ty: [[2, '2'], [1, '1'], [-1, '−1'], [-2, '−2']] })] },
      { clear: true, part: '拡大・縮小', say: '$y=\\sin2\\theta$ は、$\\theta$ が $\\pi$ 進むだけで $2\\theta$ が $2\\pi$ 進みます。グラフは **θ 軸方向に $\\dfrac12$ 倍** に縮めたもので、周期は $\\pi$ です。',
        add: [{ t: 'h', text: '$y=\\sin2\\theta$　（θ 軸方向に $\\dfrac12$ 倍）' },
          G('f5', [{ k: 'fn', f: 'sin(x)', a: -0.9, b: 7.2, c: 'd', dash: true, label: 'y=sinθ', lat: [5.3, 0.6] },
            { k: 'fn', f: 'sin(2*x)', a: -0.9, b: 7.2, c: 'p', label: 'y=sin2θ', lat: [0.55, 1.2] },
            { k: 'dim', a: [0, -1.3], b: [PI, -1.3], c: 'p', dy: 0, label: '周期 π' }])] },
      { ask: { type: 'choice', q: '$y=\\sin3\\theta$ の周期は？',
        opts: ['$6\\pi$', '$3\\pi$', '$\\dfrac{\\pi}{3}$', '$\\dfrac23\\pi$'], ok: 3,
        why: { 0: '3 をかけるのではなく、3 で割ります。$\\theta$ が $\\dfrac23\\pi$ 進むと $3\\theta$ が $2\\pi$ 進みます。', 1: '周期は $2\\pi\\div3$ です。', 2: '$\\pi\\div3$ ではなく、$2\\pi\\div3$ です。' },
        good: '$2\\pi\\div3=\\dfrac23\\pi$。$y=\\sin k\\theta$（$k>0$）の周期は $\\dfrac{2\\pi}{k}$ です。',
        add: [{ t: 'm', tex: 'y=\\sin k\\theta\\ \\ (k>0)\\ \\ \\text{の周期は}\\ \\ \\frac{2\\pi}{k}' }] } },

      // ---------- 平行移動 ----------
      { clear: true, part: '平行移動', add: [{ t: 'h', text: '$y=\\sin\\left(\\theta-\\dfrac{\\pi}{3}\\right)$' },
          G('f6', [{ k: 'fn', f: 'sin(x)', a: -0.9, b: 7.2, c: 'd', dash: true, label: 'y=sinθ', lat: [-0.85, 0.55] }])],
        ask: { type: 'choice', q: '$y=\\sin\\left(\\theta-\\dfrac{\\pi}{3}\\right)$ のグラフは、$y=\\sin\\theta$ のグラフをどう平行移動したもの？',
          opts: ['右へ $\\dfrac{\\pi}{3}$', '左へ $\\dfrac{\\pi}{3}$', '下へ $\\dfrac{\\pi}{3}$', '平行移動ではない'], ok: 0,
          why: { 1: '2次関数の $y=(x-p)^2$ と同じで、$\\theta-p$ なら $+p$ の向き（右）に動きます。', 2: 'かっこの中の $-\\dfrac{\\pi}{3}$ は横のずれ。上下には動きません。', 3: '$\\sin(\\theta-p)$ の形は、形を変えずに横にずらしたグラフです。' },
          good: '$\\theta-\\dfrac{\\pi}{3}$ なので右へ $\\dfrac{\\pi}{3}$。2次関数の平行移動と同じ考え方で、周期は $2\\pi$ のまま。',
          add: [{ t: 'p', size: 'sm', text: 'θ に $\\dfrac{\\pi}{3}$ 大きい値を入れると、$y=\\sin\\theta$ と同じ値 → **右へ $\\dfrac{\\pi}{3}$**' }],
          draw: [{ fig: 'f6', items: [{ k: 'fn', f: 'sin(x-PI/3)', a: -0.9, b: 7.2, c: 'g', label: 'y=sin(θ−π/3)', lat: [3.75, 1.2] },
            { k: 'vec', a: [PI / 2 + 0.06, 1.0], b: [5 * PI / 6 - 0.06, 1.0], c: 'p', wd: 3 }, { k: 'pt', at: [5 * PI / 6, 1], c: 'g', r: 6 }, { k: 'label', at: [PI / 3, 0], text: 'π/3', c: 'g', size: 21, dy: 24 }, { k: 'pt', at: [PI / 3, 0], c: 'g', r: 6 }] }] } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　$y=\\sin\\left(2\\theta-\\dfrac{\\pi}{2}\\right)$' },
          G('f7', [{ k: 'fn', f: 'sin(2*x)', a: -0.9, b: 7.2, c: 'd', dash: true, label: 'y=sin2θ', lat: [-0.85, 1.2] }],
            { tx: [[PI / 4, 'π/4'], [PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']] })],
        ask: { type: 'think', q: '$y=\\sin\\left(2\\theta-\\dfrac{\\pi}{2}\\right)$ の周期と、$y=\\sin2\\theta$ のグラフを θ 軸方向にどれだけ平行移動したものかを答えよう。',
          hint: '$2\\theta-\\dfrac{\\pi}{2}=2\\left(\\theta-\\dfrac{\\pi}{4}\\right)$ と、θ の係数 2 でくくる。',
          ans: '周期 $\\pi$。$y=\\sin2\\theta$ のグラフを θ 軸方向に $\\dfrac{\\pi}{4}$ 平行移動したもの',
          after: '$\\dfrac{\\pi}{2}$ ずらすのではありません。θ の係数でくくってから、かっこの中を読みます。',
          add: [{ t: 'm', tex: 'y=\\sin2\\left(\\theta-\\frac{\\pi}{4}\\right)', note: '周期 $\\pi$、右へ $\\dfrac{\\pi}{4}$' }],
          draw: [{ fig: 'f7', items: [{ k: 'fn', f: 'sin(2*x-PI/2)', a: -0.9, b: 7.2, c: 'g', label: 'y=sin(2θ−π/2)', lat: [3.25, -1.32] }, { k: 'pt', at: [PI / 4, 0], c: 'g', r: 6 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、単位円やグラフを使って、三角関数を含む **方程式・不等式** を解きます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
