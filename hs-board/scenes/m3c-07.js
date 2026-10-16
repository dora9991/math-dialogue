/* 数学Ⅲ 第3章 積分法 積分の応用 ①：面積
   例・数値はすべて自作。答え・誤答・図の座標は python3（sympy）で検算ずみ。
   y=2−eˣ と x 軸・y 軸：∫₀^{log2}(2−eˣ)dx=2log2−1、y=sin2x と y=sinx（0≦x≦π/3）：1/4、
   y=logx と y 軸・y=0・y=1：∫₀¹eʸdy=e−1（=e·1−∫₁ᵉlogx dx）、x=sint, y=sin2t（0≦t≦π/2）と x 軸：∫₀^{π/2}sin2t cost dt=2/3、
   考えてみよう 楕円 x=3cost, y=2sint：6π */
(function () {
  const POINTS = [
    '面積は「上 − 下」：$a\\le x\\le b$ で $f(x)\\ge g(x)$ なら　$\\displaystyle S=\\int_a^b\\{f(x)-g(x)\\}\\,dx$。まず **グラフと交点** を調べる',
    '$x=g(y)$ と見たほうが簡単なときは、**$y$ で積分** する：$\\displaystyle S=\\int_c^dg(y)\\,dy$',
    '媒介変数で表された曲線は、$\\displaystyle S=\\int y\\,dx$ を $t$ の積分にかきかえる（$dx=\\dfrac{dx}{dt}\\,dt$、積分区間も $t$ の区間に）'
  ];
  const PI = Math.PI, L2 = Math.LN2, E = Math.E;
  const range = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
  const LOGREG = [[0, 0]].concat(range(0, 1, 40).map(y => [Math.exp(y), y]), [[0, 1]]);
  const HUMP = range(0, PI / 2, 60).map(t => [Math.sin(t), Math.sin(2 * t)]);

  HB.lesson({
    id: 'm3c-07', field: '数学Ⅲ　積分法', title: '面積', level: '積分の応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題（次の部分の面積を求めよ）',
      parts: ['(1)　曲線 $y=2-e^x$ と $x$ 軸、$y$ 軸で囲まれた部分', '(2)　2曲線 $y=\\sin2x,\\ y=\\sin x$ の $0\\le x\\le\\dfrac\\pi3$ で囲まれた部分',
        '(3)　曲線 $y=\\log x$ と $y$ 軸、2直線 $y=0,\\ y=1$ で囲まれた部分', '(4)　曲線 $x=\\sin t,\\ y=\\sin2t\\ \\Big(0\\le t\\le\\dfrac\\pi2\\Big)$ と $x$ 軸で囲まれた部分',
        '(5)　楕円 $x=3\\cos t,\\ y=2\\sin t$ で囲まれた部分'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までで、定積分を計算する道具がそろいました。ここからは「積分の応用」。まず、数学Ⅱで学んだ **面積** を、$e^x$ や三角関数、媒介変数で表された曲線にも広げます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '曲線と $x$ 軸、2曲線の間の面積を求められる\n$y$ で積分する面積、媒介変数で表された曲線で囲まれた面積を求められる' }] },

      // ---------- 公式 ----------
      { clear: true, part: '面積と定積分', say: '数学Ⅱで学んだように、$a\\le x\\le b$ で $f(x)\\ge g(x)$ のとき、2つのグラフではさまれた部分の面積は「上 − 下」の定積分です。関数の種類が変わっても同じです。',
        add: [{ t: 'h', text: '面積（数学Ⅱの復習）' },
          { t: 'box', c: 'y', label: '公式', text: '$a\\le x\\le b$ で $f(x)\\ge g(x)$ のとき\n$\\displaystyle S=\\int_a^b\\{f(x)-g(x)\\}\\,dx$' },
          { t: 'p', size: 'sm', text: '$g(x)=0$ なら、曲線と $x$ 軸の間の面積' },
          { t: 'fig', id: 'gen', col: 1, view: [-0.4, -0.45, 4.4, 2.75], w: 480, h: 320, items: [
            { k: 'axes', tx: [[0.8, 'a'], [3.6, 'b']], ty: [] },
            { k: 'area', f: '2+0.4*sin(1.5*x)', g: '0.4+0.08*x**2', a: 0.8, b: 3.6, c: 'y', label: 'S', lat: [2.2, 1.25] },
            { k: 'fn', f: '2+0.4*sin(1.5*x)', a: 0.3, b: 4.1, c: 'w', label: 'y=f(x)', lat: [3.15, 2.2] },
            { k: 'fn', f: '0.4+0.08*x**2', a: 0.3, b: 4.1, c: 'b', label: 'y=g(x)', lat: [3.0, 0.35] },
            { k: 'seg', a: [0.8, 0], b: [0.8, 2.37], c: 'd', dash: true }, { k: 'seg', a: [3.6, 0], b: [3.6, 2.31], c: 'd', dash: true }] }] },

      // ---------- 曲線と x 軸 ----------
      { clear: true, part: '曲線と x 軸', say: '例：曲線 $y=2-e^x$ と $x$ 軸、$y$ 軸で囲まれた部分。まず $x$ 軸との交点。$2-e^x=0$ より $x=\\log2$。$0\\le x\\le\\log2$ で $y\\ge0$ です。',
        add: [{ t: 'h', text: '曲線と x 軸　y = 2 − eˣ' },
          { t: 'm', tex: '2-e^x=0\\ \\ \\text{より}\\ \\ x=\\log2', note: '$x$ 軸との交点' },
          { t: 'm', tex: 'S=\\int_0^{\\log2}(2-e^x)\\,dx' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.9, -1.45, 1.4, 1.75], w: 460, h: 440, items: [
            { k: 'area', f: '2-exp(x)', a: 0, b: L2, c: 'y', label: 'S', lat: [0.22, 0.3] },
            { k: 'axes', tx: [[1, '1']], ty: [[1, '1']] },
            { k: 'seg', a: [L2, -0.08], b: [L2, 0.08], c: 'd', wd: 2 }, { k: 'label', at: [L2, 0], text: 'log 2', plain: true, size: 20, dy: 24, dx: -4, c: 'd' },
            { k: 'fn', f: '2-exp(x)', a: -0.85, b: 1.3, label: 'y=2−eˣ', lat: [0.55, 0.85] }] }] },
      { ask: { type: 'choice', q: '面積 $S=\\displaystyle\\int_0^{\\log2}(2-e^x)\\,dx$ は？',
        opts: ['$2\\log2-2$', '$2\\log2+1$', '$1-2\\log2$', '$2\\log2-1$'], ok: 3,
        why: { 0: '$e^0=1$ なので、下端の値は $0-e^0=-1$。ここを 0 とすると、面積が負になります。', 1: '$-e^x$ の原始関数は $-e^x$ のまま。符号を変えてはいけません。', 2: '「上端 − 下端」が逆です。$\\log2\\fallingdotseq0.69$ なので、これは負の数です。' },
        good: '$e^{\\log2}=2$ を使って　$(2\\log2-2)-(0-1)=2\\log2-1$（約 0.39）。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S&=\\Big[\\,2x-e^x\\,\\Big]_0^{\\log2}=(2\\log2-e^{\\log2})-(0-e^0)\\\\ &=\\ans{2\\log2-1}\\end{aligned}', note: '$e^{\\log2}=2$' }] } },

      // ---------- 2曲線の間 ----------
      { clear: true, part: '2曲線の間', say: '例：2曲線 $y=\\sin2x$ と $y=\\sin x$。交点は、$\\sin2x=\\sin x$ を2倍角の公式で変形して、$\\sin x(2\\cos x-1)=0$。$0\\le x\\le\\dfrac\\pi3$ で囲まれた部分を考えます。',
        add: [{ t: 'h', text: '2曲線の間　y = sin 2x と y = sin x' },
          { t: 'm', tex: '\\sin2x-\\sin x=\\sin x\\,(2\\cos x-1)', note: '$\\sin2x=2\\sin x\\cos x$' },
          { t: 'p', size: 'sm', text: '交点の $x$ 座標：$x=0,\\ \\dfrac\\pi3$（$0\\le x\\le\\dfrac\\pi3$ で $\\sin2x\\ge\\sin x$）' },
          { t: 'fig', id: 'f2', col: 1, view: [-0.35, -0.4, 3.45, 1.3], w: 560, h: 330, items: [
            { k: 'axes', tx: [[PI / 3, 'π/3'], [PI / 2, 'π/2'], [PI, 'π']], ty: [[1, '1']] },
            { k: 'area', f: 'sin(2*x)', g: 'sin(x)', a: 0, b: PI / 3, c: 'y', label: 'S', lat: [0.62, 0.7] },
            { k: 'fn', f: 'sin(2*x)', a: -0.2, b: 1.75, c: 'y', label: 'y=sin2x', lat: [1.72, 0.32] },
            { k: 'fn', f: 'sin(x)', a: -0.2, b: 3.35, c: 'b', label: 'y=sinx', lat: [2.35, 0.95] },
            { k: 'line', x: PI / 3, c: 'd', dash: true }] }] },
      { ask: { type: 'choice', q: 'この部分の面積 $S=\\displaystyle\\int_0^{\\frac\\pi3}(\\sin2x-\\sin x)\\,dx$ は？',
        opts: ['$\\dfrac14$', '$-\\dfrac14$', '$1$', '$\\dfrac34$'], ok: 0,
        why: { 1: '上にあるのは $y=\\sin2x$。「上 − 下」の順が逆です。', 2: '$\\sin2x$ の原始関数は $-\\dfrac12\\cos2x$。$\\dfrac12$ を忘れています。', 3: '下端 $x=0$ での値 $-\\dfrac12+1=\\dfrac12$ をひき忘れています。' },
        good: '$\\Big(\\dfrac14+\\dfrac12\\Big)-\\Big(-\\dfrac12+1\\Big)=\\dfrac14$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S&=\\Big[-\\frac12\\cos2x+\\cos x\\Big]_0^{\\frac\\pi3}\\\\ &=\\Big(\\frac14+\\frac12\\Big)-\\Big(-\\frac12+1\\Big)=\\ans{\\frac14}\\end{aligned}' }] } },

      // ---------- y で積分 ----------
      { clear: true, part: 'y で積分', say: '曲線 $y=\\log x$ と $y$ 軸、2直線 $y=0,\\ y=1$ で囲まれた部分。$x$ で積分すると $x=1$ で区間を分けることになります。$x=e^y$ と見て **$y$ で積分** すると、1回ですみます。',
        add: [{ t: 'h', text: 'y で積分する' },
          { t: 'box', c: 'b', label: '公式', text: '$c\\le y\\le d$ で $g(y)\\ge0$ のとき、曲線 $x=g(y)$ と $y$ 軸、2直線 $y=c,\\ y=d$ で囲まれた部分の面積は\n$\\displaystyle S=\\int_c^dg(y)\\,dy$' },
          { t: 'm', tex: 'y=\\log x\\iff x=e^y' },
          { t: 'fig', id: 'f3', col: 1, view: [-0.45, -0.75, 3.35, 1.55], w: 560, h: 339, items: [
            { k: 'poly', pts: LOGREG, close: true, fill: 'y', alpha: 0.3, noStroke: true },
            { k: 'axes', tx: [[1, '1'], [E, 'e']], ty: [[1, '1']] },
            { k: 'line', m: 0, n: 1, a: -0.3, b: 3.2, c: 'd', dash: true },
            { k: 'fn', f: 'log(x)', a: 0.3, b: 3.25, label: 'y=log x', lat: [2.0, 0.35] },
            { k: 'seg', a: [0, 0.55], b: [Math.exp(0.55), 0.55], c: 'p', wd: 4 }, { k: 'label', at: [0.85, 0.55], text: 'x=eʸ', c: 'p', size: 22, dy: -18 }] }] },
      { ask: { type: 'choice', q: '色のついた部分の面積 $S$ を表す式は？',
        opts: ['$\\int_1^e\\log x\\,dx$', '$\\int_0^1e^y\\,dy$', '$\\int_0^1\\log y\\,dy$', '$\\int_0^e\\log x\\,dx$'], ok: 1,
        why: { 0: 'それは曲線の **下側**（曲線と $x$ 軸、直線 $x=e$ の間）の面積です。', 2: '$y=\\log x$ を $x$ について解くと $x=e^y$。$\\log$ のままではありません。', 3: '$0<x<1$ では $\\log x<0$ で、しかも $x=0$ では $\\log x$ の値がありません。' },
        good: '$y$ の区間 $0\\le y\\le1$ で、横の長さ $x=e^y$ を積分します。',
        add: [{ t: 'm', tex: 'S=\\int_0^1e^y\\,dy=\\Big[\\,e^y\\,\\Big]_0^1=\\ans{e-1}' }] } },
      { say: '$x$ で積分しても確かめられます。たて 1・横 $e$ の長方形から、前の時間に求めた $\\displaystyle\\int_1^e\\log x\\,dx=1$ をひくと $e-1$。同じになりました。',
        add: [{ t: 'm', size: 'sm', tex: 'S=e\\cdot1-\\int_1^e\\log x\\,dx=e-1', note: '長方形 − 下側の部分' }] },

      // ---------- 媒介変数 ----------
      { clear: true, part: '媒介変数の曲線', say: '曲線 $x=\\sin t,\\ y=\\sin2t$（$0\\le t\\le\\dfrac\\pi2$）と $x$ 軸で囲まれた部分。$t$ が $0$ から $\\dfrac\\pi2$ まで動くと、点は原点から $(1,\\,0)$ まで山をえがきます。',
        add: [{ t: 'h', text: '媒介変数で表された曲線　$x=\\sin t,\\ y=\\sin2t$' },
          { t: 'tbl', size: 'sm', rows: [['$t$', '$0$', '$\\cdots$', '$\\dfrac\\pi4$', '$\\cdots$', '$\\dfrac\\pi2$'], ['$x$', '$0$', '↗', '$\\dfrac{\\sqrt2}{2}$', '↗', '$1$'], ['$y$', '$0$', '↗', '$1$', '↘', '$0$']] },
          { t: 'fig', id: 'f4', col: 1, view: [-0.25, -0.3, 1.3, 1.3], w: 440, h: 454, items: [
            { k: 'poly', pts: HUMP, close: true, fill: 'y', alpha: 0.3, noStroke: true },
            { k: 'axes', tx: [[1, '1']], ty: [[1, '1']] },
            { k: 'param', x: 'sin(t)', y: 'sin(2*t)', a: 0, b: PI / 2, c: 'w' },
            { k: 'pt', at: [Math.SQRT1_2, 1], name: 't=π/4', dir: 'n', c: 'y', size: 21 },
            { k: 'label', at: [0.55, 0.38], text: 'S', c: 'y', size: 26 }] }] },
      { say: '面積は $\\displaystyle S=\\int_0^1y\\,dx$。これを $t$ の積分にかきかえます。$x=\\sin t$ から $dx=\\cos t\\,dt$、$x:0\\to1$ のとき $t:0\\to\\dfrac\\pi2$。',
        add: [{ t: 'm', tex: 'S=\\int_0^1y\\,dx=\\int_0^{\\frac\\pi2}\\sin2t\\cdot\\cos t\\,dt', note: '$dx=\\cos t\\,dt$\n$t:0\\to\\frac\\pi2$' }] },
      { ask: { type: 'choice', q: '$S=\\displaystyle\\int_0^{\\frac\\pi2}\\sin2t\\cos t\\,dt$ の値は？',
        opts: ['$-\\dfrac23$', '$\\dfrac13$', '$\\dfrac23$', '$1$'], ok: 2,
        why: { 0: '$\\Big[-\\dfrac23\\cos^3t\\Big]_0^{\\frac\\pi2}=0-\\Big(-\\dfrac23\\Big)$。下端の符号に注意します。', 1: '$\\sin2t=2\\sin t\\cos t$ の 2 を忘れています。', 3: '$\\displaystyle\\int\\sin2t\\,dt$ だけを計算しています。$dx=\\cos t\\,dt$ の $\\cos t$ を忘れずに。' },
        good: '$\\sin2t\\cos t=2\\sin t\\cos^2t$ と直し、$\\Big[-\\dfrac23\\cos^3t\\Big]_0^{\\frac\\pi2}=\\dfrac23$。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\int_0^{\\frac\\pi2}2\\sin t\\cos^2t\\,dt=\\Big[-\\frac23\\cos^3t\\Big]_0^{\\frac\\pi2}=\\ans{\\frac23}' }] } },

      // ---------- 考えてみよう ----------
      { clear: true, part: '考えてみよう', add: [{ t: 'h', text: '楕円で囲まれた部分の面積' },
          { t: 'm', tex: 'x=3\\cos t,\\quad y=2\\sin t\\quad(0\\le t\\le2\\pi)' },
          { t: 'fig', id: 'f5', col: 1, view: [-3.6, -2.6, 3.6, 2.6], w: 540, h: 390, items: [
            { k: 'area', f: '2*sqrt(1-x**2/9)', a: 0, b: 3, c: 'y', alpha: 0.3 },
            { k: 'axes', tx: [[-3, '−3'], [3, '3']], ty: [[2, '2'], [-2, '−2']] },
            { k: 'param', x: '3*cos(t)', y: '2*sin(t)', a: 0, b: 2 * PI, c: 'w' }] }],
        ask: { type: 'think', q: '楕円 $x=3\\cos t,\\ y=2\\sin t$ で囲まれた部分の面積を求めよう。',
        hint: '対称性から、色の部分（第1象限）の4倍。$x:0\\to3$ のとき $t:\\dfrac\\pi2\\to0$、$dx=-3\\sin t\\,dt$。',
        ans: '$S=4\\displaystyle\\int_0^3y\\,dx=4\\int_{\\frac\\pi2}^{0}2\\sin t\\,(-3\\sin t)\\,dt=24\\int_0^{\\frac\\pi2}\\sin^2t\\,dt=6\\pi$',
        after: '半径 $r$ の円は $\\pi r^2$、この楕円は $\\pi\\cdot3\\cdot2$。$t$ の区間の向き（$\\dfrac\\pi2\\to0$）に注意しましょう。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S&=4\\int_{\\frac\\pi2}^{0}2\\sin t\\,(-3\\sin t)\\,dt\\\\ &=24\\int_0^{\\frac\\pi2}\\sin^2t\\,dt=24\\cdot\\frac\\pi4=\\ans{6\\pi}\\end{aligned}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、断面積を積分して **立体の体積** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
