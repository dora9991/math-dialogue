/* 数学Ⅲ 第3章 積分法 積分の応用 ②：体積
   例・数値はすべて自作。答え・誤答は python3（sympy）で検算ずみ。
   錐：S(x)=S(x/h)²、∫₀ʰ(S/h²)x²dx=Sh/3、y=√x（0≦x≦4）の回転体 8π、y=eˣ（0≦x≦1）の回転体 π(e²−1)/2
   （誤答 π(e−1)・π(e−1)²・π(e²−1)）、球 π∫₋₃³(9−x²)dx=36π（半分 18π・円柱 54π）、
   y=x と y=x² の間の回転体 π∫₀¹(x²−x⁴)dx=2π/15（誤答 π/30・π/6・π/3）、考えてみよう y=x² と y=4 を y 軸のまわり：π∫₀⁴y dy=8π
   見取図は、x 軸に垂直な切り口（円）を横に縮めただ円（横の半径＝たての半径×0.28）でかいている。 */
(function () {
  const POINTS = [
    '立体を $x$ 軸に垂直な平面で切った **断面積** を $S(x)$ とすると、体積は　$\\displaystyle V=\\int_a^bS(x)\\,dx$（うすい板の和の極限）',
    '$x$ 軸のまわりの回転体の切り口は、半径 $|y|$ の円。$\\displaystyle V=\\pi\\int_a^by^2\\,dx$。2曲線の間なら $\\pi\\displaystyle\\int(f^2-g^2)\\,dx$（$(f-g)^2$ ではない）',
    '$y$ 軸のまわりの回転体は、切り口の半径 $x$ を $y$ で表して　$\\displaystyle V=\\pi\\int_c^dx^2\\,dy$'
  ];
  const K = 0.28, PI = Math.PI;
  const ell = (cx, cy, rx, ry, n) => Array.from({ length: (n || 60) + 1 }, (_, i) => { const t = 2 * PI * i / (n || 60); return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });
  const sec = (x0, R, c, extra) => Object.assign({ k: 'poly', pts: ell(x0, 0, K * R, R), close: true, fill: c || 'p', alpha: 0.4, c: c || 'p', wd: 2.5 }, extra || {});   // x 軸に垂直な切り口
  const cap = (x0, R, c) => ({ k: 'poly', pts: ell(x0, 0, K * R, R), close: true, c: c || 'w', wd: 2.5 });
  const xaxis = (a, b) => ({ k: 'vec', a: [a, 0], b: [b, 0], c: 'd', wd: 2 });
  const ring = (x0, R, r) => { const o = ell(x0, 0, K * R, R), i = ell(x0, 0, K * r, r).reverse(); return { k: 'poly', pts: o.concat(i), close: true, fill: 'p', alpha: 0.45, noStroke: true }; };
  const RR = '1.1+0.45*sin(1.2*x-0.3)', rr = x => 1.1 + 0.45 * Math.sin(1.2 * x - 0.3);

  HB.lesson({
    id: 'm3c-08', field: '数学Ⅲ　積分法', title: '体積', level: '積分の応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題（体積を求めよ）',
      parts: ['(1)　底面積 $S$、高さ $h$ の錐', '(2)　曲線 $y=e^x$ と $x$ 軸、2直線 $x=0,\\ x=1$ で囲まれた部分を、$x$ 軸のまわりに1回転させた立体',
        '(3)　半径 3 の球（円 $x^2+y^2=9$ の上半分を $x$ 軸のまわりに回転）', '(4)　直線 $y=x$ と放物線 $y=x^2$ で囲まれた部分を、$x$ 軸のまわりに1回転させた立体',
        '(5)　放物線 $y=x^2$ と直線 $y=4$ で囲まれた部分を、$y$ 軸のまわりに1回転させた立体'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: '前の時間は面積を求めました。この時間は **体積** です。面積が「細い長方形」の和の極限だったように、体積は「うすい板」の和の極限と考えます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '断面積 $S(x)$ を積分して、立体の体積を求められる\n回転体の体積　$\\pi\\displaystyle\\int y^2\\,dx$　を使える' }] },

      // ---------- 断面積 ----------
      { clear: true, part: '断面積と体積', say: '立体を $x$ 軸に垂直な平面で切った切り口の面積を $S(x)$ とします。厚さ $\\Delta x$ のうすい板の体積は、ほぼ $S(x)\\,\\Delta x$。これを $a$ から $b$ まで集めます。',
        add: [{ t: 'h', text: '断面積と体積' },
          { t: 'm', tex: 'V\\fallingdotseq\\sum S(x)\\,\\Delta x\\ \\to\\ \\int_a^bS(x)\\,dx', note: 'うすい板の和の極限' },
          { t: 'box', c: 'y', label: '公式', text: '$a\\le x\\le b$ の部分の体積は\n$\\displaystyle V=\\int_a^bS(x)\\,dx$' },
          { t: 'fig', id: 'sol', col: 1, view: [-0.4, -2.0, 5.6, 2.0], w: 630, h: 420, items: [
            xaxis(-0.3, 5.5), { k: 'label', at: [5.5, 0], text: 'x', c: 'd', dy: 22, dx: -6 },
            { k: 'fn', f: RR, a: 0.6, b: 4.6 }, { k: 'fn', f: '-(' + RR + ')', a: 0.6, b: 4.6 },
            cap(0.6, rr(0.6)), cap(4.6, rr(4.6)),
            sec(2.6, rr(2.6)), { k: 'poly', pts: ell(2.85, 0, K * rr(2.85), rr(2.85)), close: true, c: 'p', dash: true, wd: 2 },
            { k: 'label', at: [2.7, rr(2.6)], text: 'S(x)', c: 'p', dy: -24, size: 24 },
            { k: 'label', at: [2.72, -rr(2.72)], text: 'Δx', c: 'p', dy: 22, size: 22 },
            { k: 'label', at: [0.6, -rr(0.6)], text: 'a', c: 'd', dy: 22, size: 22 }, { k: 'label', at: [4.6, -rr(4.6)], text: 'b', c: 'd', dy: 22, size: 22 }] }] },

      // ---------- 錐 ----------
      { clear: true, part: '錐の体積', say: '中学で学んだ錐の体積 $\\dfrac13Sh$ を、積分で確かめます。底面積 $S$、高さ $h$ の錐で、頂点を原点にし、底面に垂直に $x$ 軸をとります。',
        add: [{ t: 'h', text: '錐の体積を積分で' },
          { t: 'p', size: 'sm', text: '底面積 $S$、高さ $h$。頂点から $x$ の位置の切り口は、底面と相似な図形' },
          { t: 'fig', id: 'cone', col: 1, view: [-0.5, -2.3, 5.3, 2.1], w: 600, h: 455, items: [
            xaxis(-0.4, 5.2), { k: 'label', at: [5.2, 0], text: 'x', c: 'd', dy: 22, dx: -6 },
            { k: 'poly', pts: ell(4, 0, K * 1.6, 1.6), close: true, fill: 'b', alpha: 0.15, c: 'w', wd: 2.5 },
            { k: 'seg', a: [0, 0], b: [4, 1.6] }, { k: 'seg', a: [0, 0], b: [4, -1.6] },
            sec(2.4, 0.96), { k: 'label', at: [2.4, 0.96], text: 'S(x)', c: 'p', dy: -22, size: 22 },
            { k: 'label', at: [4.25, 0.6], text: 'S', c: 'b', size: 26 },
            { k: 'pt', at: [0, 0], r: 4, name: 'O', dir: 'w', c: 'w', size: 22 },
            { k: 'dim', a: [0, -1.55], b: [2.4, -1.55], dy: 0, label: 'x', c: 'p' },
            { k: 'dim', a: [0, -2.05], b: [4, -2.05], dy: 0, label: 'h', c: 'y' },
            { k: 'seg', a: [2.4, -0.96], b: [2.4, -1.75], c: 'd', dash: true, wd: 2 }, { k: 'seg', a: [4, -1.6], b: [4, -2.2], c: 'd', dash: true, wd: 2 }] }] },
      { ask: { type: 'choice', q: '頂点から $x$ の位置の断面積 $S(x)$ は？',
        opts: ['$S\\cdot\\dfrac xh$', '$S\\Big(\\dfrac xh\\Big)^2$', '$S\\Big(\\dfrac xh\\Big)^3$', '$\\dfrac{Sx}{3h}$'], ok: 1,
        why: { 0: '切り口は底面と相似で、相似比は $x:h$。面積の比は相似比の **2乗** です。', 2: '3乗になるのは体積の比。面積の比は2乗です。', 3: '$\\dfrac13$ は体積の公式の係数。断面積には出てきません。' },
        good: '相似比 $x:h$ なので、面積比は $x^2:h^2$。$S(x)=\\dfrac{S}{h^2}x^2$。',
        add: [{ t: 'm', tex: 'S(x)=S\\Big(\\frac xh\\Big)^2=\\frac{S}{h^2}x^2', note: '相似比 $x:h$' }] } },
      { say: '積分すると、ちゃんと $\\dfrac13Sh$ になります。中学で覚えた $\\dfrac13$ は、$x^2$ を積分したときの $\\dfrac{x^3}{3}$ から出てきたのです。',
        add: [{ t: 'm', tex: 'V=\\int_0^h\\frac{S}{h^2}x^2\\,dx=\\frac{S}{h^2}\\Big[\\,\\frac{x^3}{3}\\,\\Big]_0^h=\\ans{\\frac13Sh}' }] },

      // ---------- 回転体 ----------
      { clear: true, part: '回転体', say: '曲線 $y=f(x)$ と $x$ 軸の間の部分を、$x$ 軸のまわりに1回転させた立体を **回転体** といいます。$x$ での切り口は、半径 $|f(x)|$ の円です。',
        add: [{ t: 'h', text: '回転体の体積' },
          { t: 'm', tex: 'S(x)=\\pi\\{f(x)\\}^2', note: '半径 $|f(x)|$ の円' },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle V=\\pi\\int_a^b\\{f(x)\\}^2\\,dx=\\pi\\int_a^by^2\\,dx$' },
          { t: 'fig', id: 'rot', col: 1, view: [-0.5, -2.6, 5.5, 2.6], w: 560, h: 485, items: [
            xaxis(-0.4, 5.4), { k: 'label', at: [5.4, 0], text: 'x', c: 'd', dy: 22, dx: -6 },
            { k: 'area', f: 'sqrt(x)', a: 0, b: 4, c: 'y', alpha: 0.22 },
            { k: 'fn', f: 'sqrt(x)', a: 0, b: 4, c: 'y', label: 'y=√x', lat: [1.0, 1.55], la: 'end' },
            { k: 'fn', f: '-sqrt(x)', a: 0, b: 4, c: 'd', dash: true },
            cap(4, 2), sec(2.25, 1.5), { k: 'label', at: [2.25, 1.5], text: '半径 √x', c: 'p', dy: -24, size: 21, plain: true },
            { k: 'param', x: '4.95+0.13*cos(t)', y: '0.45*sin(t)', a: 0.5, b: 5.6, c: 'g', wd: 2 },
            { k: 'vec', a: [4.95 + 0.13 * Math.cos(5.55), 0.45 * Math.sin(5.55)], b: [4.95 + 0.13 * Math.cos(5.75), 0.45 * Math.sin(5.75)], c: 'g', wd: 2 },
            { k: 'label', at: [4, -2], text: '4', c: 'd', dy: 20, size: 21 }] }] },
      { say: '例：$y=\\sqrt x$（$0\\le x\\le4$）と $x$ 軸の間を回転。$y^2=x$ なので、計算は簡単です。',
        add: [{ t: 'm', tex: 'V=\\pi\\int_0^4(\\sqrt x)^2\\,dx=\\pi\\Big[\\,\\frac{x^2}{2}\\,\\Big]_0^4=\\ans{8\\pi}' }] },
      { ask: { type: 'choice', q: '曲線 $y=e^x$ と $x$ 軸、2直線 $x=0,\\ x=1$ で囲まれた部分を、$x$ 軸のまわりに回転させた立体の体積は？',
        opts: ['$\\pi(e-1)$', '$\\pi(e-1)^2$', '$\\pi(e^2-1)$', '$\\dfrac{\\pi(e^2-1)}{2}$'], ok: 3,
        why: { 0: '$\\pi\\displaystyle\\int y\\,dx$ になっています。$y$ を **2乗** します。', 1: '先に積分してから2乗しています。$\\displaystyle\\int y^2\\,dx$ と $\\Big(\\int y\\,dx\\Big)^2$ はちがいます。', 2: '$e^{2x}$ の原始関数は $\\dfrac12e^{2x}$。$\\dfrac12$ を忘れています。' },
        good: '$\\pi\\displaystyle\\int_0^1e^{2x}\\,dx=\\pi\\Big[\\,\\frac12e^{2x}\\,\\Big]_0^1=\\frac{\\pi(e^2-1)}{2}$。',
        add: [{ t: 'm', tex: 'V=\\pi\\int_0^1e^{2x}\\,dx=\\pi\\Big[\\,\\frac12e^{2x}\\,\\Big]_0^1=\\ans{\\frac{\\pi(e^2-1)}{2}}' }] } },

      // ---------- 球 ----------
      { clear: true, part: '球の体積', say: '半径 3 の球は、円 $x^2+y^2=9$ の上半分 $y=\\sqrt{9-x^2}$ を、$x$ 軸のまわりに回転させた立体です。中学の公式 $\\dfrac43\\pi r^3$ を確かめましょう。',
        add: [{ t: 'h', text: '球の体積' }, { t: 'm', tex: 'y^2=9-x^2\\qquad(-3\\le x\\le3)' },
          { t: 'fig', id: 'sph', col: 1, view: [-4.2, -3.6, 4.6, 3.6], w: 520, h: 425, items: [
            xaxis(-4.1, 4.5), { k: 'label', at: [4.5, 0], text: 'x', c: 'd', dy: 22, dx: -6 },
            { k: 'circle', o: [0, 0], r: 3, c: 'w' },
            { k: 'fn', f: 'sqrt(9-x**2)', a: -3, b: 3, c: 'y', wd: 4, label: 'y=√(9−x²)', lat: [1.9, 3.15] },
            sec(1.2, Math.sqrt(9 - 1.44)),
            { k: 'label', at: [-3, 0], text: '−3', c: 'd', dy: 22, dx: -14, size: 21 }, { k: 'label', at: [3, 0], text: '3', c: 'd', dy: 22, dx: 12, size: 21 }] }],
        ask: { type: 'choice', q: '半径 3 の球の体積を $\\pi\\displaystyle\\int y^2\\,dx$ で求めると？',
        opts: ['$18\\pi$', '$54\\pi$', '$36\\pi$'], ok: 2,
        why: { 0: '$-3$ から $3$ まで積分します。$0$ から $3$ までだと、球の半分です。', 1: '$\\pi\\displaystyle\\int_{-3}^39\\,dx$ だけになっています。$-x^2$ を忘れると円柱の体積です。' },
        good: '$\\pi\\displaystyle\\int_{-3}^{3}(9-x^2)\\,dx=36\\pi$。$\\dfrac43\\pi\\cdot3^3=36\\pi$ と一致します。',
        add: [{ t: 'm', tex: 'V=\\pi\\int_{-3}^{3}(9-x^2)\\,dx=2\\pi\\Big[\\,9x-\\frac{x^3}{3}\\,\\Big]_0^3=\\ans{36\\pi}', note: '偶関数' }] } },

      // ---------- 2曲線の間 ----------
      { clear: true, part: '2曲線の間を回転', say: '直線 $y=x$ と放物線 $y=x^2$ で囲まれた部分を、$x$ 軸のまわりに回転させます。切り口は、外側の半径 $x$・内側の半径 $x^2$ の **ドーナツ形** です。',
        add: [{ t: 'h', text: '2曲線の間を回転させる' },
          { t: 'm', tex: 'S(x)=\\pi x^2-\\pi(x^2)^2', note: '大きい円 − 小さい円' },
          { t: 'fig', id: 'rg', col: 1, view: [-0.25, -1.25, 1.85, 1.25], w: 395, h: 470, items: [
            xaxis(-0.2, 1.8), { k: 'label', at: [1.8, 0], text: 'x', c: 'd', dy: 22, dx: -6 },
            { k: 'area', f: 'x', g: 'x**2', a: 0, b: 1, c: 'y', alpha: 0.3 },
            { k: 'fn', f: '-x', a: 0, b: 1, c: 'd', dash: true }, { k: 'fn', f: '-(x**2)', a: 0, b: 1, c: 'd', dash: true },
            { k: 'fn', f: 'x', a: 0, b: 1.1, c: 'w', label: 'y=x', lat: [1.0, 1.15], la: 'end' },
            { k: 'fn', f: 'x**2', a: 0, b: 1.08, c: 'b', label: 'y=x²', lat: [1.33, 0.72] },
            cap(1, 1), ring(0.6, 0.6, 0.36), { k: 'poly', pts: ell(0.6, 0, K * 0.6, 0.6), close: true, c: 'p', wd: 2 }, { k: 'poly', pts: ell(0.6, 0, K * 0.36, 0.36), close: true, c: 'p', wd: 2 },
            { k: 'label', at: [1, -1], text: '1', c: 'd', dy: 22, size: 21 }] }] },
      { ask: { type: 'choice', q: 'この立体の体積は？',
        opts: ['$\\dfrac{2\\pi}{15}$', '$\\dfrac{\\pi}{30}$', '$\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{3}$'], ok: 0,
        why: { 1: '$\\pi\\displaystyle\\int(x-x^2)^2\\,dx$ を計算しています。ドーナツ形の面積は $\\pi x^2-\\pi x^4$ です。', 2: '面積 $\\displaystyle\\int(x-x^2)\\,dx$ を $\\pi$ 倍しただけです。半径を2乗します。', 3: 'それは外側の円錐だけの体積。くりぬいた分をひきます。' },
        good: '$\\pi\\displaystyle\\int_0^1(x^2-x^4)\\,dx=\\pi\\Big(\\frac13-\\frac15\\Big)=\\frac{2\\pi}{15}$。',
        add: [{ t: 'm', tex: '\\begin{aligned}V&=\\pi\\int_0^1\\{x^2-(x^2)^2\\}\\,dx\\\\ &=\\pi\\Big(\\frac13-\\frac15\\Big)=\\ans{\\frac{2\\pi}{15}}\\end{aligned}' }] } },

      // ---------- y 軸のまわり ----------
      { clear: true, part: 'y 軸のまわり', say: '$y$ 軸のまわりに回転させるときは、切り口が $y$ 軸に垂直な円になります。半径 $x$ を $y$ で表して、**$y$ で積分** します。',
        add: [{ t: 'h', text: 'y 軸のまわりの回転体' },
          { t: 'box', c: 'b', label: '公式', text: '曲線 $x=g(y)$ と $y$ 軸の間（$c\\le y\\le d$）を $y$ 軸のまわりに回転させた立体の体積\n$\\displaystyle V=\\pi\\int_c^d\\{g(y)\\}^2\\,dy=\\pi\\int_c^dx^2\\,dy$' },
          { t: 'fig', id: 'bowl', col: 1, view: [-2.8, -0.6, 2.8, 4.9], w: 450, h: 442, items: [
            { k: 'area', f: '4', g: 'x**2', a: 0, b: 2, c: 'y', alpha: 0.25 },
            { k: 'axes', tx: [[2, '2']], ty: [[4, '4']] },
            { k: 'fn', f: 'x**2', a: -2.05, b: 2.05, c: 'w', label: 'y=x²', lat: [1.35, 1.2] },
            { k: 'poly', pts: ell(0, 4, 2, 0.45), close: true, c: 'w', wd: 2.5 },
            { k: 'poly', pts: ell(0, 2.25, 1.5, 0.34), close: true, fill: 'p', alpha: 0.4, c: 'p', wd: 2.5 },
            { k: 'label', at: [-1.5, 2.25], text: '半径 x', c: 'p', dx: -10, anchor: 'end', size: 21, plain: true },
            { k: 'label', at: [2.0, 4.0], text: 'y=4', c: 'y', dx: 34, dy: -16, size: 21 }] }] },
      { ask: { type: 'think', q: '放物線 $y=x^2$ と直線 $y=4$ で囲まれた部分を、$y$ 軸のまわりに1回転させた立体（お椀の形）の体積を求めよう。',
        hint: '高さ $y$ の切り口は、半径 $x$ の円で、$x^2=y$。$0\\le y\\le4$ で積分する。',
        ans: '$V=\\pi\\displaystyle\\int_0^4x^2\\,dy=\\pi\\int_0^4y\\,dy=8\\pi$',
        after: '$x$ で積分しようとせず、「切り口の半径を $y$ で表す」のがコツです。',
        add: [{ t: 'm', tex: 'V=\\pi\\int_0^4x^2\\,dy=\\pi\\int_0^4y\\,dy=\\pi\\Big[\\,\\frac{y^2}{2}\\,\\Big]_0^4=\\ans{8\\pi}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、積分で **曲線の長さ** と、動く点の **道のり** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
