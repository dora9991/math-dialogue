/* 早稲田型 数学（理工）：2024年度 早稲田大学 理工3学部 第5問の類題（自作問題・元の問題ではない）
   問題：C：x = cos2t + 2cos t、y = sin t（0≦t≦π）。
     (1) x の最大・最小　(2) dx/dt, dy/dt と増減・概形　(3) C と x 軸で囲まれた部分 D を x 軸のまわりに回した体積
   答え（python3・sympy で検算ずみ。数値の円板積分・円筒積分でも一致）：
     (1) x = 2c²+2c−1 = 2(c+1/2)²−3/2（c=cos t, −1≦c≦1）。最大 3（t=0）、最小 −3/2（t=2π/3）
     (2) dx/dt = −2sin t(2cos t+1)、dy/dt = cos t。(3,0) → (−1,1)[t=π/2] → (−3/2,√3/2)[t=2π/3] → (−1,0)[t=π]
         x(t)−x(π−t) = 4cos t ≧ 0 なので自分と交わらない
     (3) −3/2<x<−1 の断面は穴あき円。V = −π∫_0^π sin²t·(dx/dt)dt = 2π∫_0^π sin³t(2cos t+1)dt = 2π(0+4/3) = 8π/3
         別の見方：高さ y での D の幅は 4√(1−y²)、V = ∫_0^1 2πy·4√(1−y²)dy = 8π/3 */
(function () {
  const PI = Math.PI, X = t => Math.cos(2 * t) + 2 * Math.cos(t), Y = t => Math.sin(t);
  const curve = [], DX = t => -2 * Math.sin(2 * t) - 2 * Math.sin(t);
  for (let i = 0; i <= 120; i++) { const t = PI * i / 120; curve.push([X(t), Y(t)]); }
  const arrowAt = (t, s) => { const dx = DX(t), dy = Math.cos(t), L = Math.hypot(dx, dy); return { k: 'vec', a: [X(t), Y(t)], b: [X(t) + dx / L * s, Y(t) + dy / L * s], c: 'p', wd: 3 }; };
  const KEY = [[3, 0], [-1, 1], [-1.5, Math.sqrt(3) / 2], [-1, 0]];
  const sketch = (id, o, h) => {
    o = o || {}; const H = h || 270, items = [
      { k: 'axes', tx: [[-1.5, '−3/2'], [1, '1'], [3, '3']], ty: [[1, '1']], xl: 'x', yl: 'y' },
      { k: 'param', x: 'cos(2*t)+2*cos(t)', y: 'sin(t)', a: 0, b: PI, c: 'w', wd: 3.5 },
      arrowAt(0.9, 0.3), arrowAt(2.0, 0.22), arrowAt(2.6, 0.22),
      { k: 'pt', at: KEY[0], name: 't=0', dir: 'ne', c: 'y', r: 5, size: 20 }, { k: 'pt', at: KEY[1], name: 't=π/2 (−1, 1)', dir: 'n', c: 'y', r: 5, size: 20 },
      { k: 'pt', at: KEY[2], name: 't=2π/3', dir: 'w', c: 'y', r: 5, size: 20 }, { k: 'pt', at: KEY[3], name: 't=π (−1, 0)', dir: 'se', off: 24, c: 'y', r: 5, size: 20 }];
    if (o.tan) items.push({ k: 'seg', a: [3, -0.3], b: [3, 0.3], c: 'g', wd: 2, dash: true }, { k: 'seg', a: [-1.5, 0.55], b: [-1.5, 1.18], c: 'g', wd: 2, dash: true },
      { k: 'seg', a: [-1.45, 1], b: [-0.55, 1], c: 'g', wd: 2, dash: true }, { k: 'seg', a: [-1, -0.3], b: [-1, 0.3], c: 'g', wd: 2, dash: true });
    return { t: 'fig', id, col: o.col == null ? 1 : o.col, view: [-2.05, -0.45, 3.55, 1.5], w: Math.round(H * 5.6 / 1.95), h: H, items };
  };
  // 回転のようす：D（黄）と、x 軸に関して折り返した形（点線）。x=−5/4 の断面は穴あき円、x=3/2 の断面は円
  const yu = 0.98921, yl = 0.52099, xs = -1.25, yd = 0.68920;
  const rot = (id, h) => {
    const H = h || 330; return { t: 'fig', id, col: 1, view: [-2.05, -1.3, 3.55, 1.45], w: Math.round(H * 5.6 / 2.75), h: H, items: [
      { k: 'poly', pts: curve, close: true, fill: 'y', alpha: 0.3, noStroke: true },
      { k: 'axes', tx: [[-1.5, '−3/2'], [-1, '−1'], [3, '3']], ty: [], xl: 'x', yl: 'y' },
      { k: 'param', x: 'cos(2*t)+2*cos(t)', y: 'sin(t)', a: 0, b: PI, c: 'w', wd: 3 },
      { k: 'param', x: 'cos(2*t)+2*cos(t)', y: '-sin(t)', a: 0, b: PI, c: 'd', wd: 2, dash: true },
      { k: 'seg', a: [xs, yl], b: [xs, yu], c: 'g', wd: 6 }, { k: 'seg', a: [xs, -yl], b: [xs, -yu], c: 'g', wd: 3, dash: true },
      { k: 'seg', a: [xs, 0], b: [xs, yl], c: 'g', wd: 1.5, dash: true },
      { k: 'label', at: [xs, yu], text: 'y₂', c: 'g', dx: -26, dy: -6, size: 21 }, { k: 'label', at: [xs, yl], text: 'y₁', c: 'g', dx: -26, size: 21 },
      { k: 'seg', a: [1.5, 0], b: [1.5, yd], c: 'b', wd: 6 }, { k: 'seg', a: [1.5, 0], b: [1.5, -yd], c: 'b', wd: 3, dash: true },
      { k: 'label', at: [0.45, 0.35], text: 'D', c: 'y', size: 28 },
      { k: 'label', at: [xs, -1.12], text: '穴あき円', c: 'g', size: 19, plain: true }, { k: 'label', at: [1.5, -0.95], text: '円', c: 'b', size: 19, plain: true }] };
  };
  const POINTS = [
    '$\\cos2t=2\\cos^2t-1$ で $x$ は $\\cos t$ の 2 次関数。$c=\\cos t$ の **範囲 $-1\\le c\\le1$** に頂点が入るかを確かめる',
    '媒介変数の曲線は $\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}$ の符号を 1 つの表にまとめ、点の動く向き（↖↙↘）で概形をかく',
    '穴あき円の回転体は「外側 − 内側」。置換積分で $t$ に直すと $V=-\\pi\\displaystyle\\int_0^{\\pi}y^2\\frac{dx}{dt}dt$ の 1 本にまとまる'
  ];

  HB.lesson({
    id: 'waseda24-5', field: '早稲田型　数学（理工）', title: '2024 早稲田 理工 第5問の類題 ― 2倍角をふくむ曲線と、x 軸のまわりの回転体', level: '2024年度 早稲田大学 理工 第5問の類題（自作）', time: '目安 20〜25分', noDec: true,
    problem: {
      label: '類題',
      lead: '媒介変数 $t$ を用いて $x=\\cos2t+2\\cos t,\\ \\ y=\\sin t\\ \\ (0\\le t\\le\\pi)$ と表される曲線を $C$ とする。',
      parts: [
        '(1)　$x$ の最大値と最小値、およびそのときの $t$ の値を求めよ。',
        '(2)　$\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}$ を求め、$t$ の変化にともなう $x,\\ y$ の増減を調べて、$C$ の概形をかけ。',
        '(3)　$C$ と $x$ 軸で囲まれた部分を $D$ とする。$D$ を $x$ 軸のまわりに 1 回転してできる立体の体積 $V$ を求めよ。'
      ],
      src: '※ 2024年度 早稲田大学 一般選抜 理工3学部 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.55, 0.45],
    steps: [
      { part: '問題', say: '2 倍角をふくむ媒介変数の曲線について、最大・最小、概形、回転体の体積を順に求める問題です。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '$x$ には $\\cos2t$ と $\\cos t$ が入っています。2 倍角の公式で $\\cos2t$ を $\\cos t$ で表すと、$\\cos t$ だけの式になります。',
        add: [{ t: 'h', text: '(1)　x の最大・最小' },
          { t: 'm', tex: 'x=\\cos2t+2\\cos t' }] },
      { ask: { type: 'choice', q: '$c=\\cos t$ とおくと、$x$ は？',
        opts: ['$2c^2+2c+1$', '$c^2+2c-1$', '$2c^2+2c$', '$2c^2+2c-1$'], ok: 3,
        why: { 0: '$\\cos2t=2\\cos^2t-1$。定数は $-1$ です。', 1: '$\\cos2t$ の $\\cos^2t$ の係数は 2 です。', 2: '$\\cos2t=2\\cos^2t-1$ の $-1$ を忘れています。' },
        good: '$x=2c^2-1+2c$。平方完成すると $2\\left(c+\\frac12\\right)^2-\\frac32$。',
        add: [{ t: 'm', tex: 'x=2c^2+2c-1=2\\Big(c+\\frac12\\Big)^2-\\frac32', note: '$-1\\le c\\le1$' },
          { t: 'fig', id: 'pb', col: 1, view: [-1.6, -2.3, 1.6, 3.6], w: 420, h: 430, items: [
            { k: 'axes', tx: [[-1, '−1'], [-0.5, '−1/2'], [1, '1']], ty: [[3, '3'], [-1.5, '−3/2']], xl: 'c', yl: 'x' },
            { k: 'fn', f: '2*x**2+2*x-1', a: -1.45, b: 1.25, c: 'd', wd: 2, dash: true },
            { k: 'fn', f: '2*x**2+2*x-1', a: -1, b: 1, c: 'y', wd: 4 },
            { k: 'seg', a: [-0.5, 0], b: [-0.5, -1.5], c: 'd', wd: 1.5, dash: true }, { k: 'seg', a: [1, 0], b: [1, 3], c: 'd', wd: 1.5, dash: true },
            { k: 'pt', at: [1, 3], c: 'p', r: 5 }, { k: 'pt', at: [-0.5, -1.5], c: 'p', r: 5 }, { k: 'pt', at: [-1, -1], c: 'y', r: 5 }] }] } },
      { ask: { type: 'choice', q: '$x$ の最小値は？',
        opts: ['$-1$', '$-\\dfrac32$', '$-\\dfrac12$', '$3$'], ok: 1,
        why: { 0: 'それは端 $c=-1$ での値です。頂点 $c=-\\frac12$ は範囲 $-1\\le c\\le1$ の中にあります。', 2: '$-\\frac12$ は頂点の $c$ の値。$x$ の値は $-\\frac32$ です。', 3: 'それは最大値（$c=1$ のとき）です。' },
        good: '頂点 $c=-\\frac12$ が範囲の中なので最小値 $-\\frac32$。最大は、頂点から遠い端 $c=1$ で $3$。' } },
      { say: '$t$ にもどします。$0\\le t\\le\\pi$ で $\\cos t=1$ は $t=0$、$\\cos t=-\\frac12$ は $t=\\frac{2\\pi}{3}$ だけです。',
        add: [{ t: 'ans', label: '(1) 答', text: '最大値 $3$（$t=0$）\n最小値 $-\\dfrac32$（$t=\\dfrac{2\\pi}{3}$）' }] },

      // ---------- (2) 増減 ----------
      { clear: true, cols: [0.42, 0.58], part: '(2)', say: '媒介変数の曲線は、$x$ と $y$ をそれぞれ $t$ で微分して、2 つの増減を 1 つの表にまとめます。',
        add: [{ t: 'h', text: '(2)　増減を調べる' },
          { t: 'm', tex: '\\frac{dx}{dt}=-2\\sin2t-2\\sin t' },
          { t: 'm', tex: '=-2\\sin t\\,(2\\cos t+1)' },
          { t: 'm', tex: '\\frac{dy}{dt}=\\cos t' }] },
      { ask: { type: 'choice', q: '$0<t<\\pi$ で、$\\dfrac{dx}{dt}$ の符号が変わる $t$ は？',
        opts: ['$\\dfrac{\\pi}{2}$', '$\\dfrac{\\pi}{3}$', '$\\dfrac{2\\pi}{3}$', '$\\dfrac{5\\pi}{6}$'], ok: 2,
        why: { 0: 'それは $\\frac{dy}{dt}=\\cos t$ が 0 になる $t$ です。', 1: '$2\\cos t+1=0$ は $\\cos t=-\\frac12$。$t=\\frac{\\pi}{3}$ では $\\cos t=\\frac12$ です。', 3: '$\\cos\\frac{5\\pi}{6}=-\\frac{\\sqrt3}{2}$ で、$-\\frac12$ ではありません。' },
        good: '$\\sin t>0$ なので符号は $2\\cos t+1$ で決まります。$t<\\frac{2\\pi}{3}$ で負、$t>\\frac{2\\pi}{3}$ で正。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [
          ['$t$', '$0$', '$\\cdots$', '$\\frac{\\pi}{2}$', '$\\cdots$', '$\\frac{2\\pi}{3}$', '$\\cdots$', '$\\pi$'],
          ['$\\frac{dx}{dt}$', '$0$', '$-$', '$-$', '$-$', '$0$', '$+$', '$0$'],
          ['$x$', '$3$', '↘', '$-1$', '↘', '$-\\frac32$', '↗', '$-1$'],
          ['$\\frac{dy}{dt}$', '$+$', '$+$', '$0$', '$-$', '$-$', '$-$', '$-$'],
          ['$y$', '$0$', '↗', '$1$', '↘', '$\\frac{\\sqrt3}{2}$', '↘', '$0$'],
          ['向き', '', '↖', '', '↙', '', '↘', '']] }] } },

      // ---------- (2) 概形 ----------
      { clear: true, cols: [1], part: '(2) 概形', say: '表の点を順に結びます。$(3,\\ 0)$ から左上へ進んで $(-1,\\ 1)$ で一番高く、左下へ進んで $\\left(-\\frac32,\\ \\frac{\\sqrt3}{2}\\right)$ で一番左、右下へもどって $(-1,\\ 0)$ で終わります。',
        add: [{ t: 'h', text: '(2)　C の概形' }, sketch('s1', { col: 0 }, 330)] },
      { ask: { type: 'choice', q: '$t=0$ の点 $(3,\\ 0)$ での $C$ の接線の向きは？',
        opts: ['$y$ 軸に平行', '$x$ 軸に平行', '傾き $1$', '傾き $-1$'], ok: 0,
        why: { 1: '$t=0$ で $\\frac{dx}{dt}=0$、$\\frac{dy}{dt}=1$。$x$ は止まり $y$ だけ動くので、向きは縦です。', 2: '$\\frac{dx}{dt}=0$ なので、傾き $\\frac{dy/dt}{dx/dt}$ は計算できません（縦向き）。', 3: '$\\frac{dx}{dt}=0$ なので、傾き $\\frac{dy/dt}{dx/dt}$ は計算できません（縦向き）。' },
        good: 'その瞬間は真上へ動くので、接線は $x=3$。$t=\\pi$ の $(-1,\\ 0)$ でも縦、$t=\\frac{\\pi}{2}$ では横向きです（緑の点線）。',
        draw: [{ fig: 's1', items: [{ k: 'seg', a: [3, -0.3], b: [3, 0.3], c: 'g', wd: 2, dash: true }, { k: 'seg', a: [-1.5, 0.55], b: [-1.5, 1.18], c: 'g', wd: 2, dash: true },
          { k: 'seg', a: [-1.45, 1], b: [-0.55, 1], c: 'g', wd: 2, dash: true }, { k: 'seg', a: [-1, -0.3], b: [-1, 0.3], c: 'g', wd: 2, dash: true }] }] } },
      { ask: { type: 'think', q: '$C$ が自分自身と交わらないことを確かめよう。（同じ高さ $y$ になるのは $t$ と $\\pi-t$）',
        hint: '$x(t)-x(\\pi-t)$ を計算する。$\\cos(\\pi-t)=-\\cos t$、$\\cos2(\\pi-t)=\\cos2t$。',
        ans: '$x(t)-x(\\pi-t)=4\\cos t>0\\ \\ \\Big(0\\le t<\\dfrac{\\pi}{2}\\Big)$。同じ高さでは、いつも $t$ の点が右にあるので交わらない。',
        after: 'だから $C$ と $x$ 軸の線分（$-1\\le x\\le3$）で、1 つの部分 $D$ が囲まれます。',
        add: [{ t: 'ans', label: '(2) 答', text: '$\\dfrac{dx}{dt}=-2\\sin t(2\\cos t+1),\\ \\dfrac{dy}{dt}=\\cos t$。概形は上の図' }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.45, 0.55], part: '(3)', say: '$D$ を $x$ 軸のまわりに回します。$x$ 軸に垂直に切った断面を考えると、$-1<x\\le3$ では円、$-\\frac32\\le x<-1$ では様子がちがいます。',
        add: [{ t: 'h', text: '(3)　x 軸のまわりの回転体' },
          { t: 'p', size: 'sm', text: '$y_2$：上の弧（$0\\le t\\le\\frac{2\\pi}{3}$）\n$y_1$：下の弧（$\\frac{2\\pi}{3}\\le t\\le\\pi$）' },
          rot('r1')] },
      { ask: { type: 'choice', q: '$-\\dfrac32<x<-1$ での断面の形は？',
        opts: ['円', '長方形', '穴のあいた円（ドーナツ形）', '点だけ'], ok: 2,
        why: { 0: 'その範囲の $D$ は $x$ 軸から離れています（下の端 $y_1>0$）。真ん中に穴があきます。', 1: '回転体を軸に垂直に切ると、円か、円を組み合わせた形になります。', 3: '$D$ には $y_1$ から $y_2$ までの幅があります。' },
        good: '半径 $y_2$ の円から半径 $y_1$ の円を除いた形。面積は $\\pi y_2^2-\\pi y_1^2$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\pi\\int_{-\\frac32}^{3}y_2^2\\,dx-\\pi\\int_{-\\frac32}^{-1}y_1^2\\,dx', note: '外側 − 内側' }] } },
      { clear: true, cols: [0.6, 0.4], part: '(3) 積分', say: '置換積分で $t$ に直します。上の弧は $x:-\\frac32\\to3$ が $t:\\frac{2\\pi}{3}\\to0$、下の弧は $x:-\\frac32\\to-1$ が $t:\\frac{2\\pi}{3}\\to\\pi$ に対応します。',
        add: [{ t: 'h', text: '(3)　置換積分で 1 本にまとめる' },
          { t: 'm', size: 'sm', tex: 'V=\\pi\\int_{-\\frac32}^{3}y_2^2\\,dx-\\pi\\int_{-\\frac32}^{-1}y_1^2\\,dx' },
          rot('r2', 250),
          { t: 'm', size: 'sm', tex: '\\int_{-\\frac32}^{3}y_2^2\\,dx=\\int_{\\frac{2\\pi}{3}}^{0}\\sin^2t\\,\\frac{dx}{dt}\\,dt' },
          { t: 'm', size: 'sm', tex: '\\int_{-\\frac32}^{-1}y_1^2\\,dx=\\int_{\\frac{2\\pi}{3}}^{\\pi}\\sin^2t\\,\\frac{dx}{dt}\\,dt' }] },
      { ask: { type: 'choice', q: 'この 2 つをまとめると、$V$ は？',
        opts: ['$\\pi\\int_0^{\\pi}\\sin^2t\\,\\frac{dx}{dt}dt$', '$-\\pi\\int_0^{\\pi}\\sin^2t\\,\\frac{dx}{dt}dt$', '$\\pi\\int_0^{\\frac{2\\pi}{3}}\\sin^2t\\,\\frac{dx}{dt}dt$', '$2\\pi\\int_0^{\\pi}\\sin^2t\\,\\frac{dx}{dt}dt$'], ok: 1,
        why: { 0: '1 つ目は $\\int_{2\\pi/3}^{0}$ で、上と下が逆。入れかえるとマイナスがつきます。', 2: '内側（穴）の分を引くのを忘れています。', 3: '2 倍する理由はありません。' },
        good: '$\\int_{\\frac{2\\pi}{3}}^{0}=-\\int_0^{\\frac{2\\pi}{3}}$ と、引く方の $-\\int_{\\frac{2\\pi}{3}}^{\\pi}$ が 1 本につながります。',
        add: [{ t: 'm', size: 'sm', tex: 'V=-\\pi\\int_0^{\\pi}\\sin^2t\\cdot\\{-2\\sin t\\,(2\\cos t+1)\\}\\,dt' }] } },
      { ask: { type: 'think', q: '$V=2\\pi\\displaystyle\\int_0^{\\pi}\\sin^3t\\,(2\\cos t+1)\\,dt$ を計算しよう。',
        hint: '$\\int\\sin^3t\\cos t\\,dt=\\frac{\\sin^4t}{4}$。$\\sin^3t=(1-\\cos^2t)\\sin t$ として $\\int_0^{\\pi}\\sin^3t\\,dt$ を出す。',
        ans: '$2\\pi\\Big(2\\cdot0+\\dfrac43\\Big)=\\dfrac{8\\pi}{3}$',
        after: '$\\Big[\\frac{\\sin^4t}{4}\\Big]_0^{\\pi}=0$、$\\int_0^{\\pi}\\sin^3t\\,dt=\\Big[-\\cos t+\\frac{\\cos^3t}{3}\\Big]_0^{\\pi}=\\frac43$。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'V=\\frac{8\\pi}{3}' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.55, 0.45], part: '別の見方', say: '検算に「横に切る」見方。高さ $y$ の水平線と $D$ の共通部分は、$t$ と $\\pi-t$ の 2 点の間です。その長さは、(2) の考えてみようの $4\\cos t$ です。',
        add: [{ t: 'h', text: '別の見方：横に切って円筒で足す' },
          { t: 'm', tex: 'w(y)=x(t)-x(\\pi-t)=4\\cos t=4\\sqrt{1-y^2}', note: '高さ $y$ での\n$D$ の幅' },
          sketch('s2', {}, 230)],
        draw: [{ fig: 's2', items: [{ k: 'poly', pts: curve, close: true, fill: 'y', alpha: 0.25, noStroke: true }, { k: 'seg', a: [X(0.5), Y(0.5)], b: [X(PI - 0.5), Y(0.5)], c: 'g', wd: 5 }, { k: 'label', at: [0.4, Y(0.5)], text: 'w(y)', c: 'g', dy: -16, size: 20 }] }] },
      { say: 'この線分を $x$ 軸のまわりに回すと、半径 $y$、長さ $w(y)$ の円筒の側面。厚さ $dy$ で足し合わせると、同じ $\\frac{8\\pi}{3}$ になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^1 2\\pi y\\cdot4\\sqrt{1-y^2}\\,dy=8\\pi\\Big[-\\frac13(1-y^2)\\sqrt{1-y^2}\\Big]_0^1=\\frac{8\\pi}{3}' },
          { t: 'p', size: 'sm', text: '円筒を重ねる見方は検算に便利。答案で使うときは、考え方の説明をそえる。' }] },

      // ---------- 答案 ----------
      { clear: true, cols: [1], part: '答案', say: '記述では、増減表と概形、断面が穴あき円になる範囲、置換積分での積分区間の対応を、はっきり書きましょう。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', label: '採点のポイント', text: '・(1) $c=\\cos t$ の範囲 $-1\\le c\\le1$ を書き、頂点が範囲内かを確かめる\n・(2) $\\frac{dx}{dt},\\ \\frac{dy}{dt}$ の符号を 1 つの表に。端点・頂点の座標を図にかきこむ\n・(3) $-\\frac32\\le x\\le-1$ の断面が穴あき円であること、$x$ と $t$ の区間の対応（$\\frac{2\\pi}{3}\\to0$、$\\frac{2\\pi}{3}\\to\\pi$）を書く' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。2 倍角で 1 文字の 2 次関数にし、増減表で形をつかみ、回転体は置換積分で 1 本の積分にまとめました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
