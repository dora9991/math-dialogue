/* 数学Ⅱ 第3章 三角関数 ④：三角関数の性質と相互関係
   相互関係（数学Ⅰとつなげる）、θ+2nπ・−θ・θ+π・π−θ・π/2−θ・π/2+θ の公式を単位円の対称で。
   例はすべて自作。値・公式・式の簡単化は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '相互関係　$\\sin^2\\theta+\\cos^2\\theta=1$、$\\tan\\theta=\\dfrac{\\sin\\theta}{\\cos\\theta}$、$1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$ は一般角でも成り立つ。1つの値から残りを出すときは、$\\theta$ の **象限で符号** を決める',
    '$\\theta+2n\\pi$ は同じ動径なので値は同じ。$-\\theta$ は **x 軸** について対称（sin・tan は符号が変わり、cos はそのまま）。$\\theta+\\pi$ は **原点** について対称（sin・cos は符号が変わり、tan はそのまま）',
    '$\\pi-\\theta$ は **y 軸** について対称、$\\dfrac{\\pi}{2}-\\theta$ は **直線 y=x** について対称（sin と cos が入れかわる）。公式は覚えるより、単位円の図から読む'
  ];
  const D = Math.PI / 180;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const UC = (id, items, o) => {
    o = o || {}; const v = [-1.45, -1.22, 1.45, 1.22], w = o.w || 530;
    return { t: 'fig', id, col: 1, view: v, w, h: Math.round(w * (v[3] - v[1]) / (v[2] - v[0])), items: [{ k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
      { k: 'label', at: [1, 0], text: '1', c: 'd', size: 21, dx: 12, dy: 18 }, { k: 'label', at: [0, 1], text: '1', c: 'd', size: 21, dx: -14, dy: -14 }].concat(items) };
  };
  // 角 deg の点（動径つき）。c＝色、name＝点の名前
  const P = (deg, c, name, dir) => [{ k: 'seg', a: [0, 0], b: at(deg, 1), c, wd: 3.5 }, { k: 'pt', at: at(deg, 1), c, r: 7, name, dir: dir || 'ne', size: 26 }];
  const ang = (a1, a2, rp, c, text, lr) => [{ k: 'arc', o: [0, 0], rp, a1, a2, c, wd: 3 }, { k: 'label', at: at((a1 + a2) / 2, (rp + (lr || 20)) / 182.8), text, c, size: 22 }];

  HB.lesson({
    id: 'm2c-04', field: '数学Ⅱ　三角関数', title: '三角関数の性質と相互関係', level: '三角関数', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\dfrac32\\pi<\\theta<2\\pi$、$\\cos\\theta=\\dfrac13$ のとき、$\\sin\\theta$ と $\\tan\\theta$ の値', '(2)　$\\pi<\\theta<\\dfrac32\\pi$、$\\tan\\theta=3$ のとき、$\\cos\\theta$ と $\\sin\\theta$ の値', '(3)　$\\cos\\left(-\\dfrac{\\pi}{6}\\right)$、$\\sin\\dfrac76\\pi$ の値', '(4)　$\\sin(\\theta+\\pi)+\\cos\\left(\\dfrac{\\pi}{2}-\\theta\\right)+\\cos\\left(\\theta+\\dfrac{\\pi}{2}\\right)$ を簡単にせよ'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間に、単位円の上の点 P$(\\cos\\theta,\\ \\sin\\theta)$ で三角関数を定義しました。この時間は、数学Ⅰの **相互関係** を一般角に広げ、$-\\theta$ や $\\theta+\\pi$ などの公式を、単位円の **対称** から読みとります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '相互関係を使って、1つの値から残りの値を求められる\n$\\theta+2n\\pi,\\ -\\theta,\\ \\theta+\\pi,\\ \\pi-\\theta,\\ \\dfrac{\\pi}{2}\\pm\\theta$ の公式を、単位円で説明できる' }] },

      // ---------- 相互関係 ----------
      { clear: true, part: '相互関係', say: '単位円の上の点 P$(\\cos\\theta,\\ \\sin\\theta)$ は $x^2+y^2=1$ を満たし、$\\tan\\theta=\\dfrac yx$ です。ここから、数学Ⅰと同じ3つの式が、一般角でも成り立ちます。',
        add: [{ t: 'h', text: '相互関係' },
          { t: 'p', size: 'sm', text: 'P$(\\cos\\theta,\\ \\sin\\theta)$ は単位円 $x^2+y^2=1$ の上の点' },
          { t: 'box', c: 'y', label: '相互関係', text: '$\\sin^2\\theta+\\cos^2\\theta=1$\n$\\tan\\theta=\\dfrac{\\sin\\theta}{\\cos\\theta}$\n$1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$' },
          { t: 'p', size: 'xs', text: '3つめは、1つめの両辺を $\\cos^2\\theta$ で割った式' },
          UC('f1', P(125, 'y', 'P', 'nw').concat([{ k: 'seg', a: at(125, 1), b: [at(125, 1)[0], 0], c: 'p', wd: 3, dash: true }, { k: 'seg', a: at(125, 1), b: [0, at(125, 1)[1]], c: 'b', wd: 3, dash: true },
            { k: 'label', at: [at(125, 1)[0], 0], text: 'cosθ', c: 'b', size: 21, dy: 22, plain: true }, { k: 'label', at: [0, at(125, 1)[1]], text: 'sinθ', c: 'p', size: 21, dx: 34, plain: true }], ang(0, 125, 34, 'g', 'θ')))] },

      // ---------- 値を求める ----------
      { clear: true, part: '値を求める', say: '$\\dfrac32\\pi<\\theta<2\\pi$、$\\cos\\theta=\\dfrac13$ のとき、$\\sin\\theta$ と $\\tan\\theta$ を求めます。まず、$\\sin^2\\theta=1-\\cos^2\\theta=\\dfrac89$ です。',
        add: [{ t: 'h', text: '$\\dfrac32\\pi<\\theta<2\\pi$、$\\cos\\theta=\\dfrac13$ のとき' },
          { t: 'm', tex: '\\sin^2\\theta=1-\\left(\\frac13\\right)^2=\\frac89' },
          UC('f2', [{ k: 'line', x: 1 / 3, c: 'p', dash: true }, { k: 'label', at: [1 / 3, -1.1], text: 'x=1/3', c: 'p', size: 21, anchor: 'start', dx: 8 },
            { k: 'seg', a: [0, 0], b: [1 / 3, -0.9428], c: 'y', wd: 3.5 }, { k: 'pt', at: [1 / 3, -0.9428], c: 'y', r: 7, name: 'P', dir: 'se' },
            { k: 'pt', at: [1 / 3, 0.9428], c: 'd', r: 6, open: true }, { k: 'label', at: [0.82, -0.45], text: '第4象限', c: 'y', size: 22 }])] },
      { ask: { type: 'choice', q: '$\\sin\\theta$ の値は？',
        opts: ['$\\dfrac{2\\sqrt2}{3}$', '$\\pm\\dfrac{2\\sqrt2}{3}$', '$-\\dfrac89$', '$-\\dfrac{2\\sqrt2}{3}$'], ok: 3,
        why: { 0: '$\\theta$ は第4象限の角なので、$\\sin\\theta<0$ です。', 1: '$\\theta$ の範囲が決まっているので、符号は1つに決まります。', 2: '$\\sin^2\\theta=\\dfrac89$ の平方根をとっていません。' },
        good: '第4象限なので sin は負。$\\sin\\theta=-\\sqrt{\\dfrac89}=-\\dfrac{2\\sqrt2}{3}$。',
        add: [{ t: 'm', tex: '\\sin\\theta=\\ans{-\\frac{2\\sqrt2}{3}}', note: '第4象限で $\\sin\\theta<0$' },
          { t: 'm', tex: '\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}=-\\frac{2\\sqrt2}{3}\\div\\frac13=\\ans{-2\\sqrt2}' }] } },
      { clear: true, part: '値を求める', add: [{ t: 'h', text: '練習　$\\pi<\\theta<\\dfrac32\\pi$、$\\tan\\theta=3$' },
          { t: 'p', size: 'sm', text: 'tan から cos を出すには　$1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$' },
          UC('f3', [{ k: 'line', m: 3, n: 0, c: 'p', dash: true }, { k: 'label', at: [0.38, 1.1], text: 'y=3x', c: 'p', size: 21, anchor: 'start', dx: 6 },
            { k: 'label', at: [-0.62, -0.4], text: '第3象限', c: 'y', size: 22 }])],
        ask: { type: 'think', q: '$\\pi<\\theta<\\dfrac32\\pi$、$\\tan\\theta=3$ のとき、$\\cos\\theta$ と $\\sin\\theta$ を求めよう。',
          hint: '$1+3^2=\\dfrac{1}{\\cos^2\\theta}$。第3象限なので、cos も sin も負。$\\sin\\theta=\\tan\\theta\\cos\\theta$。',
          ans: '$\\cos\\theta=-\\dfrac{1}{\\sqrt{10}}$、$\\sin\\theta=-\\dfrac{3}{\\sqrt{10}}$',
          after: '確かめ：$\\left(-\\dfrac{3}{\\sqrt{10}}\\right)^2+\\left(-\\dfrac{1}{\\sqrt{10}}\\right)^2=\\dfrac{9}{10}+\\dfrac{1}{10}=1$。',
          add: [{ t: 'm', tex: '\\cos^2\\theta=\\frac{1}{1+3^2}=\\frac{1}{10}' },
            { t: 'm', tex: '\\cos\\theta=\\ans{-\\frac{1}{\\sqrt{10}}},\\quad \\sin\\theta=3\\cos\\theta=\\ans{-\\frac{3}{\\sqrt{10}}}' }],
          draw: [{ fig: 'f3', items: [{ k: 'seg', a: [0, 0], b: [-0.3162, -0.9487], c: 'y', wd: 3.5 }, { k: 'pt', at: [-0.3162, -0.9487], c: 'y', r: 7, name: 'P', dir: 'sw' }] }] } },

      // ---------- θ+2nπ と −θ ----------
      { clear: true, part: 'θ+2nπ と −θ', say: '$\\theta+2n\\pi$ の動径は $\\theta$ と同じ位置なので、三角関数の値も同じです。$-\\theta$ の点 Q は、P と **x 軸について対称** な位置にあります。',
        add: [{ t: 'h', text: '$\\theta+2n\\pi$ と $-\\theta$' },
          { t: 'box', c: 'b', label: 'θ+2nπ', text: '$\\sin(\\theta+2n\\pi)=\\sin\\theta,\\quad \\cos(\\theta+2n\\pi)=\\cos\\theta$\n$\\tan(\\theta+2n\\pi)=\\tan\\theta$　（$n$ は整数）' },
          UC('f4', P(35, 'y', 'P').concat(P(-35, 'p', 'Q', 'se'), [{ k: 'seg', a: at(35, 1), b: at(-35, 1), c: 'w', wd: 2, dash: true }],
            ang(0, 35, 46, 'y', 'θ'), ang(-35, 0, 46, 'p', '−θ', 26)))] },
      { say: 'P$(\\cos\\theta,\\ \\sin\\theta)$ と x 軸について対称な点 Q は $(\\cos\\theta,\\ -\\sin\\theta)$。y 座標の符号だけが変わるので、sin と tan は符号が変わり、cos はそのままです。',
        add: [{ t: 'box', c: 'y', label: '−θ', text: '$\\sin(-\\theta)=-\\sin\\theta,\\quad \\cos(-\\theta)=\\cos\\theta$\n$\\tan(-\\theta)=-\\tan\\theta$' }] },
      { ask: { type: 'choice', q: '$\\cos\\left(-\\dfrac{\\pi}{6}\\right)$ の値は？',
        opts: ['$-\\dfrac{\\sqrt3}{2}$', '$\\dfrac{\\sqrt3}{2}$', '$-\\dfrac12$', '$\\dfrac12$'], ok: 1,
        why: { 0: 'cos は x 座標。x 軸について対称に移しても、x 座標は変わりません。', 2: 'それは $\\sin\\left(-\\dfrac{\\pi}{6}\\right)$ の値です。', 3: 'それは $\\sin\\dfrac{\\pi}{6}$ の値です。cos を考えます。' },
        good: '$\\cos(-\\theta)=\\cos\\theta$ より、$\\cos\\left(-\\dfrac{\\pi}{6}\\right)=\\cos\\dfrac{\\pi}{6}=\\dfrac{\\sqrt3}{2}$。' } },

      // ---------- θ+π と π−θ ----------
      { clear: true, part: 'θ+π と π−θ', say: '$\\theta+\\pi$ の点 R は、P と **原点について対称** です。x 座標も y 座標も符号が変わるので、sin と cos は符号が逆になり、tan はそのままです。',
        add: [{ t: 'h', text: '$\\theta+\\pi$ と $\\pi-\\theta$' },
          { t: 'box', c: 'b', label: 'θ+π', text: '$\\sin(\\theta+\\pi)=-\\sin\\theta,\\quad \\cos(\\theta+\\pi)=-\\cos\\theta$\n$\\tan(\\theta+\\pi)=\\tan\\theta$' },
          UC('f5', P(35, 'y', 'P').concat(P(215, 'b', 'R', 'sw'), ang(0, 35, 40, 'y', 'θ'), [{ k: 'label', at: at(215, 0.55), text: 'θ+π', c: 'b', size: 22, dx: 30, dy: 12 }]))] },
      { say: '$\\pi-\\theta$ の点 S は、P と **y 軸について対称**。数学Ⅰの $180^\\circ-\\theta$ の公式と同じで、sin はそのまま、cos と tan は符号が変わります。',
        add: [{ t: 'box', c: 'g', label: 'π−θ', text: '$\\sin(\\pi-\\theta)=\\sin\\theta,\\quad \\cos(\\pi-\\theta)=-\\cos\\theta$\n$\\tan(\\pi-\\theta)=-\\tan\\theta$' }],
        draw: [{ fig: 'f5', items: P(145, 'g', 'S', 'nw').concat([{ k: 'seg', a: at(35, 1), b: at(145, 1), c: 'w', wd: 2, dash: true }, { k: 'label', at: at(145, 0.55), text: 'π−θ', c: 'g', size: 22, dy: -22 }]) }] },
      { ask: { type: 'choice', q: '$\\sin\\dfrac76\\pi$ の値を、$\\theta+\\pi$ の公式で求めると？',
        opts: ['$\\dfrac12$', '$-\\dfrac{\\sqrt3}{2}$', '$-\\dfrac12$', '$\\dfrac{\\sqrt3}{2}$'], ok: 2,
        why: { 0: '$\\sin(\\theta+\\pi)=-\\sin\\theta$。符号が変わります。', 1: '$\\dfrac76\\pi=\\dfrac{\\pi}{6}+\\pi$。もとの角は $\\dfrac{\\pi}{6}$ で、$\\sin\\dfrac{\\pi}{6}=\\dfrac12$ です。', 3: '符号も値もちがいます。もとの角は $\\dfrac{\\pi}{6}$。' },
        good: '$\\sin\\dfrac76\\pi=\\sin\\left(\\dfrac{\\pi}{6}+\\pi\\right)=-\\sin\\dfrac{\\pi}{6}=-\\dfrac12$。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin\\frac76\\pi=\\sin\\left(\\frac{\\pi}{6}+\\pi\\right)=-\\sin\\frac{\\pi}{6}=\\ans{-\\frac12}' }] } },

      // ---------- π/2 ± θ ----------
      { clear: true, part: 'π/2 ± θ', say: '$\\dfrac{\\pi}{2}-\\theta$ の点 Q は、P と **直線 $y=x$ について対称**。x 座標と y 座標が入れかわるので、sin と cos が入れかわります。',
        add: [{ t: 'h', text: '$\\dfrac{\\pi}{2}-\\theta$ と $\\dfrac{\\pi}{2}+\\theta$' },
          { t: 'box', c: 'b', label: 'π/2−θ', text: '$\\sin\\left(\\dfrac{\\pi}{2}-\\theta\\right)=\\cos\\theta,\\quad \\cos\\left(\\dfrac{\\pi}{2}-\\theta\\right)=\\sin\\theta$\n$\\tan\\left(\\dfrac{\\pi}{2}-\\theta\\right)=\\dfrac{1}{\\tan\\theta}$' },
          UC('f6', [{ k: 'line', m: 1, n: 0, c: 'w', dash: true }, { k: 'label', at: [1.12, 1.12], text: 'y=x', size: 21, anchor: 'end', dx: -10 }].concat(P(25, 'y', 'P', 'e'), P(65, 'b', 'Q', 'ne'),
            ang(0, 25, 52, 'y', 'θ', 18), [{ k: 'seg', a: at(25, 1), b: at(65, 1), c: 'w', wd: 2, dash: true }]))] },
      { say: '$\\dfrac{\\pi}{2}+\\theta$ の点 T は、P を原点のまわりに $\\dfrac{\\pi}{2}$ 回転した点です。$(\\cos\\theta,\\ \\sin\\theta)$ は、$(-\\sin\\theta,\\ \\cos\\theta)$ に移ります。',
        add: [{ t: 'm', tex: '\\mathrm{T}\\left(\\hb{-\\sin\\theta},\\ \\hy{\\cos\\theta}\\right)', note: 'P を $\\dfrac{\\pi}{2}$ 回転した点' }],
        draw: [{ fig: 'f6', items: P(115, 'p', 'T', 'nw').concat([{ k: 'right', o: [0, 0], a: at(25, 1), b: at(115, 1), s: 18 }]) }] },
      { ask: { type: 'choice', q: '$\\cos\\left(\\dfrac{\\pi}{2}+\\theta\\right)$ と等しいものは？',
        opts: ['$\\sin\\theta$', '$-\\cos\\theta$', '$\\cos\\theta$', '$-\\sin\\theta$'], ok: 3,
        why: { 0: 'T の x 座標は $-\\sin\\theta$。符号に注意します。', 1: '$\\dfrac{\\pi}{2}$ ずれると、sin と cos が入れかわります。', 2: 'T の x 座標は $\\cos\\theta$ ではありません。図で T の位置を見ます。' },
        good: 'cos は x 座標なので、$\\cos\\left(\\dfrac{\\pi}{2}+\\theta\\right)=-\\sin\\theta$。sin は y 座標で $\\cos\\theta$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin\\left(\\frac{\\pi}{2}+\\theta\\right)=\\cos\\theta,\\ \\ \\cos\\left(\\frac{\\pi}{2}+\\theta\\right)=\\ans{-\\sin\\theta}' }] } },
      { ask: { type: 'think', q: '$\\sin(\\theta+\\pi)+\\cos\\left(\\dfrac{\\pi}{2}-\\theta\\right)+\\cos\\left(\\theta+\\dfrac{\\pi}{2}\\right)$ を簡単にしよう。',
        hint: '1つずつ公式で直す。$\\sin(\\theta+\\pi)=-\\sin\\theta$、$\\cos\\left(\\dfrac{\\pi}{2}-\\theta\\right)=\\sin\\theta$、$\\cos\\left(\\theta+\\dfrac{\\pi}{2}\\right)=-\\sin\\theta$。',
        ans: '$-\\sin\\theta+\\sin\\theta-\\sin\\theta=-\\sin\\theta$',
        after: '迷ったら、$\\theta=\\dfrac{\\pi}{6}$ などを入れて、左と右が同じ値になるか確かめられます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、単位円の点の動きをグラフにして、**三角関数のグラフ** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
