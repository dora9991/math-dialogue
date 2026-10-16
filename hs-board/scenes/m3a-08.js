/* 数学Ⅲ 第1章 関数と極限 ⑧：三角関数の極限
   例はすべて自作。極限値は python3（sympy の limit）で、表の値・図の座標（x=0.7 のときの P・T）は数値計算で検算ずみ。 */
(function () {
  const POINTS = [
    '$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1$（$x$ は弧度法）。単位円で **△OAP ＜ 扇形 OAP ＜ △OAT** を比べ、はさみうちの原理で示す',
    '応用は **$\\dfrac{\\sin\\bigcirc}{\\bigcirc}$ の形にそろえる**：$\\dfrac{\\sin5x}{2x}=\\dfrac52\\cdot\\dfrac{\\sin5x}{5x}\\to\\dfrac52$',
    '$1-\\cos x$ は $1+\\cos x$ をかけて $\\sin^2x$ に。$x\\to\\infty$ の $\\dfrac{\\sin x}{x}$ は $0$（$1$ ではない）'
  ];
  const T0 = 0.7, C = Math.cos(T0), S = Math.sin(T0), TN = Math.tan(T0);
  const arcPts = (n) => Array.from({ length: n + 1 }, (_, i) => [Math.cos(T0 * i / n), Math.sin(T0 * i / n)]);
  const base = [
    { k: 'seg', a: [-0.15, 0], b: [1.3, 0], c: 'd', wd: 2 },
    { k: 'arc', o: [0, 0], r: 1, a1: -5, a2: 95, c: 'w', wd: 2.5 },
    { k: 'seg', a: [1, -0.12], b: [1, 1.1], c: 'd', wd: 2, dash: true },
    { k: 'seg', a: [0, 0], b: [1, TN], c: 'w', wd: 2.5 },
    { k: 'angle', o: [0, 0], a: [1, 0], b: [C, S], rp: 36, label: 'x', lr: 16 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', size: 24 }, { k: 'pt', at: [1, 0], name: 'A', dir: 'se', size: 24 },
    { k: 'pt', at: [C, S], name: 'P', dir: 'nw', size: 24 }, { k: 'pt', at: [1, TN], name: 'T', dir: 'ne', size: 24 },
    { k: 'label', at: [0.5, 0], text: '1', size: 22, dy: 20 }];
  const triOAP = { k: 'poly', pts: [[0, 0], [1, 0], [C, S]], close: true, c: 'y', fill: 'y', alpha: 0.35, wd: 2.5 };
  const sector = { k: 'poly', pts: [[0, 0]].concat(arcPts(30)), close: true, c: 'b', fill: 'b', alpha: 0.25, wd: 2, noStroke: true };
  const triOAT = { k: 'poly', pts: [[0, 0], [1, 0], [1, TN]], close: true, c: 'p', fill: 'p', alpha: 0.18, wd: 2.5 };

  HB.lesson({
    id: 'm3a-08', field: '数学Ⅲ　関数と極限', title: '三角関数の極限', level: '関数の極限', time: '目安 8分',
    noDec: true,   // 面積の式の ½ などに小数がつくと読みにくい
    problem: { label: '例題', lead: '次の極限を求めよ。',
      parts: ['(1)　$\\displaystyle\\lim_{x\\to0}\\frac{\\sin5x}{2x}$　　(2)　$\\displaystyle\\lim_{x\\to\\infty}\\frac{\\sin x}{x}$',
        '(3)　$\\displaystyle\\lim_{x\\to0}\\frac{\\tan2x}{x}$　　(4)　$\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos x}{x^2}$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は関数の極限でした。この時間は三角関数の極限です。角 $x$ は弧度法（ラジアン）で考えます。次の章で $\\sin x$ を微分するときの土台になります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1$ を、図とはさみうちの原理で説明できる\nこの極限を使って、いろいろな極限を求められる' }] },

      // ---------- 数値で調べる ----------
      { clear: true, cols: [1], part: 'sin x / x', say: '$\\dfrac{\\sin x}{x}$ は、$x\\to0$ で分子も分母も $0$ に近づく $\\dfrac00$ の形。約分はできません。まず、値を計算して調べてみます。',
        add: [{ t: 'h', text: '$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}$ はいくつ？' },
          { t: 'tbl', rows: [['$x$', '$0.5$', '$0.1$', '$0.01$', '$\\cdots\\to0$'], ['$\\dfrac{\\sin x}{x}$', '$0.9589\\cdots$', '$0.9983\\cdots$', '$0.99998\\cdots$', '$\\to\\ ?$']] },
          { t: 'p', text: 'どうやら $1$ に近づきそう。これを、図を使って示します。' }] },

      // ---------- 面積で比べる ----------
      { clear: true, part: '面積で比べる', say: '$0<x<\\dfrac{\\pi}{2}$ とします。半径 1 の円で $\\angle\\mathrm{AOP}=x$ となる点 P をとり、A での接線と直線 OP の交点を T とします。',
        add: [{ t: 'h', text: '単位円で面積を比べる（$0<x<\\frac{\\pi}{2}$）' },
          { t: 'p', size: 'sm', text: 'OA $=$ OP $=1$、P$(\\cos x,\\ \\sin x)$、T$(1,\\ \\tan x)$\n3つの図形の面積を比べる' },
          { t: 'fig', id: 'u1', col: 1, view: [-0.25, -0.22, 1.35, 1.18], w: 480, h: 420, items: base }] },
      { say: '3つの図形を重ねると、△OAP（黄）は扇形 OAP（青）にふくまれ、扇形は △OAT（桃）にふくまれます。三角形の面積は $\\dfrac12\\times$ 底辺 $\\times$ 高さ です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['図形', '面積'], ['△OAP', '$\\dfrac12\\cdot1\\cdot\\sin x$'], ['扇形 OAP', '？'], ['△OAT', '$\\dfrac12\\cdot1\\cdot\\tan x$']] }],
        draw: [{ fig: 'u1', items: [triOAT, sector, triOAP] }] },
      { ask: { type: 'choice', q: '扇形 OAP の面積は？（半径 1、中心角 $x$）',
        opts: ['$x$', '$\\dfrac12x^2$', '$\\dfrac{\\pi x}{360}$', '$\\dfrac12x$'], ok: 3,
        why: { 0: 'それは弧 AP の長さです。面積は $\\dfrac12r^2\\theta$。', 1: '公式 $\\dfrac12r^2\\theta$ の $r$ と $\\theta$ を取りちがえています。', 2: '度数法の式とまぜています。弧度法では $\\dfrac12r^2\\theta$ です。' },
        good: '数学Ⅱで学んだ $\\dfrac12r^2\\theta$ に $r=1,\\ \\theta=x$ を入れて $\\dfrac12x$。' } },
      { clear: true, part: '不等式を作る', say: '面積の大小から、$\\dfrac12\\sin x<\\dfrac12x<\\dfrac12\\tan x$。$2$ をかけ、さらに $\\sin x\\ (>0)$ で割って逆数をとると、$\\cos x<\\dfrac{\\sin x}{x}<1$ が出てきます。',
        add: [{ t: 'h', text: '面積の大小から' },
          { t: 'm', tex: '\\triangle\\mathrm{OAP}<\\text{扇形 OAP}<\\triangle\\mathrm{OAT}' },
          { t: 'm', tex: '\\frac12\\sin x<\\frac12x<\\frac12\\tan x' },
          { t: 'fig', id: 'u2', col: 1, view: [-0.25, -0.22, 1.35, 1.18], w: 480, h: 420, items: base.concat([triOAT, sector, triOAP]) },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\sin x&<x<\\frac{\\sin x}{\\cos x}\\\\ 1&<\\frac{x}{\\sin x}<\\frac{1}{\\cos x}\\\\ \\cos x&<\\frac{\\sin x}{x}<1\\end{aligned}', note: '$\\sin x$ で割る\n\n逆数をとる\n（不等号が逆に）' }] },
      { ask: { type: 'choice', q: '$\\cos x<\\dfrac{\\sin x}{x}<1$ から、$\\displaystyle\\lim_{x\\to+0}\\frac{\\sin x}{x}=1$ といえる理由は？',
        opts: ['$x\\to+0$ のとき $\\cos x\\to1$ だから', '$x\\to+0$ のとき $\\cos x\\to0$ だから', '$\\sin x=x$ だから', '$\\dfrac{\\sin x}{x}<1$ だから'], ok: 0,
        why: { 1: '$\\cos0=1$ です。$\\cos x\\to1$ になります。', 2: '$\\sin x<x$ なので、等しくはありません。近づくだけです。', 3: '$1$ より小さいだけでは、$1$ に近づくとはいえません。下からもはさむ必要があります。' },
        good: '両はしの $\\cos x$ と $1$ が、どちらも $1$ に近づくので、はさみうちの原理で $1$。' } },

      // ---------- たいせつな極限 ----------
      { clear: true, cols: [0.5, 0.5], part: 'たいせつな極限', say: '$x<0$ のときは $x=-t$ とおくと $\\dfrac{\\sin(-t)}{-t}=\\dfrac{\\sin t}{t}$ なので同じ。これで、次のたいせつな極限が示せました。',
        add: [{ t: 'h', text: 'たいせつな極限' },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1$\n（$x$ は弧度法）' },
          { t: 'p', size: 'sm', text: 'グラフ $y=\\dfrac{\\sin x}{x}$ は、$x=0$ で値はないが\n$x\\to0$ で $1$ に近づく' },
          { t: 'fig', id: 'g1', col: 1, view: [-13, -0.55, 13, 1.35], w: 640, h: 330, items: [
            { k: 'axes', tx: [[-4 * Math.PI, '−4π'], [-2 * Math.PI, '−2π'], [2 * Math.PI, '2π'], [4 * Math.PI, '4π']], ty: [1] },
            { k: 'fn', f: 'sin(x)/x', a: -13, b: 13, c: 'y', label: 'y=sin x / x', lat: [2.2, 1.0] },
            { k: 'pt', at: [0, 1], open: true, c: 'y', r: 7 }] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to\\infty}\\frac{\\sin x}{x}$ は？（グラフも見て考えよう）',
        opts: ['$1$', '振動する', '$0$', '$\\infty$'], ok: 2,
        why: { 0: '$\\dfrac{\\sin x}{x}\\to1$ は $x\\to0$ のときの話。$x\\to\\infty$ ではちがいます。', 1: '$\\sin x$ は振動しますが、$x$ で割ると、ゆれ幅が $0$ に近づいていきます。', 3: '$|\\sin x|\\le1$ なので、限りなく大きくはなりません。' },
        good: '$x>0$ で $-\\dfrac1x\\le\\dfrac{\\sin x}{x}\\le\\dfrac1x$。はさみうちの原理で $0$。',
        add: [{ t: 'm', size: 'sm', tex: '-\\frac1x\\le\\frac{\\sin x}{x}\\le\\frac1x\\ \\ \\text{より}\\ \\ \\lim_{x\\to\\infty}\\frac{\\sin x}{x}=\\ans{0}' }],
        draw: [{ fig: 'g1', items: [{ k: 'fn', f: '1/x', a: 1.3, b: 13, c: 'p', dash: true, label: '±1/x', lat: [9, 0.38] }, { k: 'fn', f: '-1/x', a: 1.3, b: 13, c: 'p', dash: true }] }] } },

      // ---------- 応用 ----------
      { clear: true, cols: [1], part: '応用', say: '$\\dfrac{\\sin3x}{x}$ は、$3x$ をひとまとまりと見て $\\dfrac{\\sin3x}{3x}$ の形を作ります。$x\\to0$ のとき $3x\\to0$ なので、公式が使えます。',
        add: [{ t: 'h', text: '$\\dfrac{\\sin\\bigcirc}{\\bigcirc}$ の形にそろえる' },
          { t: 'm', tex: '\\lim_{x\\to0}\\frac{\\sin3x}{x}=\\lim_{x\\to0}\\hy{3}\\cdot\\frac{\\sin\\hb{3x}}{\\hb{3x}}=3\\cdot1=3', note: '$x\\to0$ のとき $3x\\to0$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to0}\\frac{\\sin5x}{2x}$ の値は？',
        opts: ['$1$', '$\\dfrac52$', '$5$', '$\\dfrac25$'], ok: 1,
        why: { 0: '$\\dfrac{\\sin5x}{5x}$ の形にそろえないと、公式の $1$ は使えません。', 2: '分母の $2$ を忘れています。', 3: '係数が逆です。分子の $5$ が上、分母の $2$ が下。' },
        good: '$\\dfrac{\\sin5x}{2x}=\\dfrac52\\cdot\\dfrac{\\sin5x}{5x}\\to\\dfrac52\\cdot1=\\dfrac52$。',
        add: [{ t: 'm', tex: '\\frac{\\sin5x}{2x}=\\frac52\\cdot\\frac{\\sin5x}{5x}\\ \\to\\ \\frac52\\cdot1=\\ans{\\frac52}' }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\lim_{x\\to0}\\frac{\\tan2x}{x}$ を求めよう。',
        hint: '$\\tan2x=\\dfrac{\\sin2x}{\\cos2x}$。$\\dfrac{\\sin2x}{2x}$ の形を作る。',
        ans: '$\\dfrac{\\tan2x}{x}=2\\cdot\\dfrac{\\sin2x}{2x}\\cdot\\dfrac{1}{\\cos2x}\\to2\\cdot1\\cdot1=2$',
        after: '$\\tan$ は $\\dfrac{\\sin}{\\cos}$ に直すと、公式が使えます。$x\\to0$ で $\\cos2x\\to1$。',
        add: [{ t: 'm', tex: '\\frac{\\tan2x}{x}=2\\cdot\\frac{\\sin2x}{2x}\\cdot\\frac{1}{\\cos2x}\\ \\to\\ 2\\cdot1\\cdot1=\\ans{2}' }] } },

      // ---------- 1−cos x ----------
      { clear: true, cols: [1], part: '1−cos x の形', say: '$\\dfrac{1-\\cos x}{x^2}$ も $\\dfrac00$ の形。分母・分子に $1+\\cos x$ をかけると、$1-\\cos^2x=\\sin^2x$ となって、公式が使える形になります。',
        add: [{ t: 'h', text: '$\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos x}{x^2}$' },
          { t: 'm', tex: '\\frac{1-\\cos x}{x^2}=\\frac{(1-\\cos x)(1+\\cos x)}{x^2(1+\\cos x)}=\\frac{\\hy{\\sin^2x}}{x^2(1+\\cos x)}=\\left(\\frac{\\sin x}{x}\\right)^2\\cdot\\frac{1}{1+\\cos x}' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos x}{x^2}$ を求めよう。',
        hint: '$x\\to0$ のとき $\\dfrac{\\sin x}{x}\\to1$、$\\cos x\\to1$。',
        ans: '$1^2\\cdot\\dfrac{1}{1+1}=\\dfrac12$',
        after: '$1-\\cos x$ は $1+\\cos x$ とペアにして $\\sin^2x$ に。三角関数の極限でよく使う変形です。',
        add: [{ t: 'm', tex: '\\lim_{x\\to0}\\left(\\frac{\\sin x}{x}\\right)^2\\cdot\\frac{1}{1+\\cos x}=1^2\\cdot\\frac{1}{1+1}=\\ans{\\frac12}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、グラフが「つながっている」ことを極限で表す **関数の連続性** と、**中間値の定理** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
