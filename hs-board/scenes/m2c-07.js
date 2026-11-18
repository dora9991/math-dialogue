/* 数学Ⅱ 第3章 三角関数 加法定理 ①：加法定理
   cos(α−β) を2点間の距離と余弦定理（数学Ⅰ）で導き、sin・cos・tan の加法定理へ。75°・15°・7π/12 の値、2直線 y=2x、y=−3x のなす角。
   例はすべて自作。値は python3（sympy の radsimp）で検算ずみ。なす角は atan で 45° を確認。 */
(function () {
  const POINTS = [
    '$\\sin(\\alpha\\pm\\beta)=\\sin\\alpha\\cos\\beta\\pm\\cos\\alpha\\sin\\beta$、$\\cos(\\alpha\\pm\\beta)=\\cos\\alpha\\cos\\beta\\mp\\sin\\alpha\\sin\\beta$（**cos は右辺の符号が逆**）。$\\sin(\\alpha+\\beta)=\\sin\\alpha+\\sin\\beta$ ではない',
    '$\\tan(\\alpha\\pm\\beta)=\\dfrac{\\tan\\alpha\\pm\\tan\\beta}{1\\mp\\tan\\alpha\\tan\\beta}$。$75^\\circ=45^\\circ+30^\\circ$、$15^\\circ=45^\\circ-30^\\circ$ のように、値を知っている角の和・差に分けて求める',
    '2直線のなす角は、それぞれが x 軸の正の向きとなす角 $\\alpha,\\ \\beta$ の差。傾きが $\\tan\\alpha,\\ \\tan\\beta$ なので、$\\tan(\\beta-\\alpha)$ を加法定理で計算する'
  ];
  const D = Math.PI / 180;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const A = 115, B = 35;   // 図の α・β（度）
  const AL = Math.atan(2) / D, BE = 180 - Math.atan(3) / D;   // y=2x・y=−3x が x 軸の正の向きとなす角

  HB.lesson({
    id: 'm2c-07', field: '数学Ⅱ　三角関数', title: '加法定理', level: '加法定理', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\sin75^\\circ$、$\\cos75^\\circ$ の値', '(2)　$\\sin15^\\circ$、$\\cos15^\\circ$ の値', '(3)　$\\tan\\left(\\dfrac{\\pi}{3}+\\dfrac{\\pi}{4}\\right)$ の値', '(4)　2直線 $y=2x$、$y=-3x$ のなす角 $\\theta$（$0<\\theta<\\dfrac{\\pi}{2}$）'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'これまでは、1つの角の三角関数を考えてきました。この時間は、2つの角の **和や差** の三角関数を、それぞれの角の三角関数で表す **加法定理** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '加法定理を使って、$\\sin(\\alpha\\pm\\beta),\\ \\cos(\\alpha\\pm\\beta),\\ \\tan(\\alpha\\pm\\beta)$ を表せる\n$75^\\circ$ などの三角関数の値や、2直線のなす角を求められる' }] },

      // ---------- 予想 ----------
      { clear: true, part: '予想', add: [{ t: 'h', text: '和の三角関数は、三角関数の和？' },
          { t: 'm', tex: '\\sin(30^\\circ+60^\\circ)\\ \\overset{?}{=}\\ \\sin30^\\circ+\\sin60^\\circ' }],
        ask: { type: 'choice', q: '$\\sin(30^\\circ+60^\\circ)$ と $\\sin30^\\circ+\\sin60^\\circ$ は等しい？',
          opts: ['等しい', '等しくない'], ok: 1,
          why: { 0: '$\\sin90^\\circ=1$ ですが、$\\sin30^\\circ+\\sin60^\\circ=\\dfrac{1+\\sqrt3}{2}\\fallingdotseq1.37$ です。' },
          good: '左辺は $\\sin90^\\circ=1$、右辺は約 $1.37$。$\\sin(\\alpha+\\beta)=\\sin\\alpha+\\sin\\beta$ とはできません。',
          add: [{ t: 'm', tex: '\\sin90^\\circ=1,\\qquad \\sin30^\\circ+\\sin60^\\circ=\\frac{1+\\sqrt3}{2}\\fallingdotseq1.37' },
            { t: 'p', size: 'sm', text: '→ 等しくない。正しい式が **加法定理**' }] } },

      // ---------- cos(α−β) ----------
      { clear: true, part: 'cos(α−β)', say: '単位円の上に、P$(\\cos\\alpha,\\ \\sin\\alpha)$、Q$(\\cos\\beta,\\ \\sin\\beta)$ をとります。∠QOP は $\\alpha-\\beta$ です。PQ$^2$ を2通りに表します。まず、2点間の距離の公式で。',
        add: [{ t: 'h', text: '$\\cos(\\alpha-\\beta)$ を求める' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\mathrm{PQ}^2&=(\\cos\\alpha-\\cos\\beta)^2+(\\sin\\alpha-\\sin\\beta)^2\\\\ &=2-2(\\cos\\alpha\\cos\\beta+\\sin\\alpha\\sin\\beta)\\end{aligned}', note: '$\\sin^2+\\cos^2=1$\nを2回使う' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.45, -1.22, 1.45, 1.22], w: 530, h: 446, items: [
            { k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
            { k: 'seg', a: [0, 0], b: at(A, 1), c: 'y', wd: 3.5 }, { k: 'seg', a: [0, 0], b: at(B, 1), c: 'b', wd: 3.5 }, { k: 'seg', a: at(A, 1), b: at(B, 1), c: 'p', wd: 4 },
            { k: 'arc', o: [0, 0], rp: 30, a1: 0, a2: B, c: 'b', wd: 2.5 }, { k: 'label', at: at(B / 2, 0.29), text: 'β', c: 'b', size: 22 },
            { k: 'arc', o: [0, 0], rp: 60, a1: B, a2: A, c: 'g', wd: 3 }, { k: 'label', at: at((A + B) / 2, 0.47), text: 'α−β', c: 'g', size: 22 },
            { k: 'label', at: [0.55, 0.06], text: '1', size: 22, dy: 20 },
            { k: 'pt', at: at(A, 1), c: 'y', r: 7, name: 'P', dir: 'nw' }, { k: 'pt', at: at(B, 1), c: 'b', r: 7, name: 'Q', dir: 'ne' }] }] },
      { say: '一方、三角形 OPQ で **余弦定理**（数学Ⅰ）を使うと、OP＝OQ＝1 なので PQ$^2=2-2\\cos(\\alpha-\\beta)$。2つの式を比べると、$\\cos(\\alpha-\\beta)$ の式が出ます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{PQ}^2=1^2+1^2-2\\cdot1\\cdot1\\cdot\\cos(\\alpha-\\beta)', note: '余弦定理' },
          { t: 'box', c: 'y', label: '比べると', text: '$\\cos(\\alpha-\\beta)=\\cos\\alpha\\cos\\beta+\\sin\\alpha\\sin\\beta$' },
          { t: 'p', size: 'xs', text: '三角形ができない位置でも、この式は成り立つことが知られている' }] },

      // ---------- 加法定理 ----------
      { clear: true, cols: [0.6, 0.4], part: '加法定理', say: '$\\beta$ を $-\\beta$ におきかえると $\\cos(\\alpha+\\beta)$、$\\sin\\theta=\\cos\\left(\\dfrac{\\pi}{2}-\\theta\\right)$ を使うと sin の式も出ます。まとめて **加法定理** といいます。',
        add: [{ t: 'h', text: '加法定理' },
          { t: 'box', c: 'y', label: '加法定理', text: '$\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta$\n$\\sin(\\alpha-\\beta)=\\sin\\alpha\\cos\\beta-\\cos\\alpha\\sin\\beta$\n$\\cos(\\alpha+\\beta)=\\cos\\alpha\\cos\\beta\\hy{-}\\sin\\alpha\\sin\\beta$\n$\\cos(\\alpha-\\beta)=\\cos\\alpha\\cos\\beta\\hy{+}\\sin\\alpha\\sin\\beta$' },
          { t: 'p', size: 'sm', text: '[[y:cos は、左辺の ± と右辺の符号が逆]]' },
          { t: 'p', col: 1, size: 'xs', text: '$\\cos(\\alpha+\\beta)$ は、$\\beta$ を $-\\beta$ にして' },
          { t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}&\\cos(\\alpha-(-\\beta))\\\\ &=\\cos\\alpha\\cos(-\\beta)+\\sin\\alpha\\sin(-\\beta)\\\\ &=\\cos\\alpha\\cos\\beta-\\sin\\alpha\\sin\\beta\\end{aligned}' },
          { t: 'p', col: 1, size: 'xs', text: '$\\cos(-\\beta)=\\cos\\beta$、$\\sin(-\\beta)=-\\sin\\beta$\n（前の時間の公式）' }] },

      // ---------- 75°・15° ----------
      { clear: true, part: '75° の値', say: '$\\sin75^\\circ$ を求めます。$75^\\circ=45^\\circ+30^\\circ$ と、値を知っている角の和に分けて、加法定理を使います。',
        add: [{ t: 'h', text: '$\\sin75^\\circ$、$\\cos75^\\circ$' },
          { t: 'm', tex: '\\begin{aligned}\\sin75^\\circ&=\\sin(45^\\circ+30^\\circ)\\\\ &=\\sin45^\\circ\\cos30^\\circ+\\cos45^\\circ\\sin30^\\circ\\\\ &=\\frac{\\sqrt2}{2}\\cdot\\frac{\\sqrt3}{2}+\\frac{\\sqrt2}{2}\\cdot\\frac12=\\ans{\\frac{\\sqrt6+\\sqrt2}{4}}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\cos75^\\circ$ の値は？',
        opts: ['$\\dfrac{\\sqrt6-\\sqrt2}{4}$', '$\\dfrac{\\sqrt6+\\sqrt2}{4}$', '$\\dfrac{\\sqrt2-\\sqrt6}{4}$', '$\\dfrac{\\sqrt6-\\sqrt2}{2}$'], ok: 0,
        why: { 1: 'cos の加法定理は、和のとき右辺がひき算です。', 2: '$\\cos45^\\circ\\cos30^\\circ$ から $\\sin45^\\circ\\sin30^\\circ$ を引くので、答えは正。順番が逆です。', 3: '$\\dfrac{\\sqrt2}{2}\\cdot\\dfrac{\\sqrt3}{2}=\\dfrac{\\sqrt6}{4}$。分母は 4 です。' },
        good: '$\\cos45^\\circ\\cos30^\\circ-\\sin45^\\circ\\sin30^\\circ=\\dfrac{\\sqrt6}{4}-\\dfrac{\\sqrt2}{4}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos75^\\circ=\\cos45^\\circ\\cos30^\\circ-\\sin45^\\circ\\sin30^\\circ=\\ans{\\frac{\\sqrt6-\\sqrt2}{4}}' }] } },
      { ask: { type: 'think', q: '$15^\\circ=45^\\circ-30^\\circ$ を使って、$\\sin15^\\circ$ と $\\cos15^\\circ$ を求めよう。',
        hint: '差の加法定理。$\\sin(\\alpha-\\beta)=\\sin\\alpha\\cos\\beta-\\cos\\alpha\\sin\\beta$、$\\cos(\\alpha-\\beta)=\\cos\\alpha\\cos\\beta+\\sin\\alpha\\sin\\beta$。',
        ans: '$\\sin15^\\circ=\\dfrac{\\sqrt6-\\sqrt2}{4}$、$\\cos15^\\circ=\\dfrac{\\sqrt6+\\sqrt2}{4}$',
        after: '$\\sin15^\\circ=\\cos75^\\circ$ になっています。前の時間の $\\sin\\left(\\dfrac{\\pi}{2}-\\theta\\right)=\\cos\\theta$ と同じ関係です。',
        add: [{ t: 'h', col: 1, text: '$\\sin15^\\circ$、$\\cos15^\\circ$' },
          { t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}\\sin15^\\circ&=\\sin(45^\\circ-30^\\circ)\\\\ &=\\frac{\\sqrt2}{2}\\cdot\\frac{\\sqrt3}{2}-\\frac{\\sqrt2}{2}\\cdot\\frac12\\\\ &=\\ans{\\frac{\\sqrt6-\\sqrt2}{4}}\\end{aligned}' },
          { t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}\\cos15^\\circ&=\\cos(45^\\circ-30^\\circ)\\\\ &=\\frac{\\sqrt2}{2}\\cdot\\frac{\\sqrt3}{2}+\\frac{\\sqrt2}{2}\\cdot\\frac12\\\\ &=\\ans{\\frac{\\sqrt6+\\sqrt2}{4}}\\end{aligned}' }] } },

      // ---------- tan ----------
      { clear: true, part: 'tan の加法定理', say: '$\\tan(\\alpha+\\beta)=\\dfrac{\\sin(\\alpha+\\beta)}{\\cos(\\alpha+\\beta)}$ に加法定理を入れ、分母・分子を $\\cos\\alpha\\cos\\beta$ で割ると、tan だけの式になります。',
        add: [{ t: 'h', text: 'tan の加法定理' },
          { t: 'm', size: 'sm', tex: '\\tan(\\alpha+\\beta)=\\frac{\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta}{\\cos\\alpha\\cos\\beta-\\sin\\alpha\\sin\\beta}', note: '分母・分子を\n$\\cos\\alpha\\cos\\beta$ で割る' },
          { t: 'box', c: 'y', label: 'tan の加法定理', text: '$\\tan(\\alpha+\\beta)=\\dfrac{\\tan\\alpha+\\tan\\beta}{1-\\tan\\alpha\\tan\\beta}$　　$\\tan(\\alpha-\\beta)=\\dfrac{\\tan\\alpha-\\tan\\beta}{1+\\tan\\alpha\\tan\\beta}$' }] },
      { ask: { type: 'choice', q: '$\\tan\\left(\\dfrac{\\pi}{3}+\\dfrac{\\pi}{4}\\right)$ の値は？',
        opts: ['$1$', '$2+\\sqrt3$', '$-2-\\sqrt3$', '$\\sqrt3+1$'], ok: 2,
        why: { 0: '分母を $1+\\tan\\alpha\\tan\\beta$ にしています。和のときの分母は $1-\\tan\\alpha\\tan\\beta$。', 1: '分母 $1-\\sqrt3$ は負なので、答えは負です。', 3: '分母の $1-\\tan\\alpha\\tan\\beta$ をわすれています。' },
        good: '$\\dfrac{\\sqrt3+1}{1-\\sqrt3}$ の分母を有理化して $-2-\\sqrt3$。$\\dfrac{7}{12}\\pi$ は第2象限の角なので、tan は負です。',
        add: [{ t: 'm', tex: '\\frac{\\sqrt3+1}{1-\\sqrt3\\cdot1}=\\frac{(\\sqrt3+1)^2}{(1-\\sqrt3)(1+\\sqrt3)}=\\frac{4+2\\sqrt3}{-2}=\\ans{-2-\\sqrt3}' }] } },

      // ---------- 2直線のなす角 ----------
      { clear: true, part: '2直線のなす角', say: '2直線 $y=2x$、$y=-3x$ が x 軸の正の向きとなす角を $\\alpha,\\ \\beta$ とすると、傾きが tan なので $\\tan\\alpha=2$、$\\tan\\beta=-3$。2直線のなす角は $\\beta-\\alpha$ です。',
        add: [{ t: 'h', text: '2直線 $y=2x$、$y=-3x$ のなす角' },
          { t: 'm', tex: '\\tan\\alpha=2,\\qquad \\tan\\beta=-3', note: '傾き ＝ tan' },
          { t: 'm', tex: '\\tan(\\beta-\\alpha)=\\frac{\\tan\\beta-\\tan\\alpha}{1+\\tan\\beta\\tan\\alpha}' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.45, -0.62, 1.45, 1.75], w: 530, h: 433, items: [
            { k: 'axes', tx: [], ty: [] },
            { k: 'line', m: 2, n: 0, c: 'b', wd: 3.5, label: 'y=2x', lat: [0.42, 1.52] }, { k: 'line', m: -3, n: 0, c: 'y', wd: 3.5, label: 'y=−3x', lat: [-0.55, 1.62], la: 'end' },
            { k: 'arc', o: [0, 0], rp: 40, a1: 0, a2: AL, c: 'b', wd: 3 }, { k: 'label', at: at(AL / 2, 0.36), text: 'α', c: 'b', size: 24 },
            { k: 'arc', o: [0, 0], rp: 86, a1: 0, a2: BE, c: 'y', wd: 2.5, dash: true }, { k: 'label', at: at(150, 0.55), text: 'β', c: 'y', size: 24 },
            { k: 'arc', o: [0, 0], rp: 130, a1: AL, a2: BE, c: 'p', wd: 4 }, { k: 'label', at: at((AL + BE) / 2, 0.92), text: 'β−α', c: 'p', size: 24 }] }] },
      { ask: { type: 'choice', q: '$\\tan(\\beta-\\alpha)$ の値は？',
        opts: ['$-\\dfrac57$', '$-5$', '$-1$', '$1$'], ok: 3,
        why: { 0: '分母は $1+\\tan\\beta\\tan\\alpha=1+(-3)\\cdot2=-5$。$1-(-6)$ ではありません。', 1: '分母の $1+\\tan\\beta\\tan\\alpha$ をわすれています。', 2: '分子 $-3-2=-5$、分母 $1-6=-5$。負÷負で正です。' },
        good: '$\\dfrac{-3-2}{1+(-3)\\cdot2}=\\dfrac{-5}{-5}=1$ です。',
        add: [{ t: 'm', tex: '\\tan(\\beta-\\alpha)=\\frac{-3-2}{1+(-3)\\cdot2}=\\frac{-5}{-5}=1' }] } },
      { say: '$\\alpha$ は鋭角、$\\beta$ は鈍角なので $0<\\beta-\\alpha<\\pi$。この範囲で tan が 1 になるのは $\\dfrac{\\pi}{4}$ だけ。2直線のなす角は $\\dfrac{\\pi}{4}$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\beta-\\alpha=\\frac{\\pi}{4}\\quad\\text{なす角は}\\ \\frac{\\pi}{4}' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、加法定理で $\\beta=\\alpha$ とおいた **2倍角の公式** と、そこから出る **半角の公式** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
