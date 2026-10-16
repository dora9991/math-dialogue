/* 数学Ⅲ 第3章 積分法 定積分 ①：定積分の置換積分法・部分積分法
   例・数値はすべて自作。答え・誤答・図の座標は python3（sympy）で検算ずみ。
   ∫₁³x√(x−1)dx（t=x−1, t:0→2）=44√2/15、∫₀^{π/2}sin²x cosx dx=1/3（区間をかえ忘れると π³/24）、
   ∫₀²√(4−x²)dx（x=2sinθ, θ:0→π/2）=π（四分円）、∫₋₃³√(9−x²)dx=9π/2、∫₁ᵉlogx dx=1、∫₀^{π/2}x cosx dx=π/2−1、
   ∫₋₂²(x³+3x²−5x+1)dx=20（定数項を落とすと 16）、考えてみよう ∫_{−π/2}^{π/2}(x²sinx+cosx)dx=2 */
(function () {
  const POINTS = [
    '定積分の置換積分法は、**積分区間も $t$ の区間にかきかえる**（$x$ と $t$ の対応の表を書く）。最後に $x$ の式にもどさなくてよい',
    '$\\sqrt{a^2-x^2}$ は $x=a\\sin\\theta$ とおく（$\\cos\\theta\\ge0$ となる範囲で）。$\\displaystyle\\int_0^a\\sqrt{a^2-x^2}\\,dx$ は四分円の面積 $\\dfrac{\\pi a^2}{4}$',
    "部分積分は $\\Big[\\,fg\\,\\Big]_a^b-\\displaystyle\\int_a^bf'g\\,dx$。$-a$ から $a$ までの定積分は、偶関数なら $2\\displaystyle\\int_0^a$、奇関数なら $0$"
  ];
  const PI = Math.PI, th0 = 0.6, P0 = [2 * Math.sin(th0), 2 * Math.cos(th0)];
  const corr = rows => ({ t: 'tbl', col: 1, rows });

  HB.lesson({
    id: 'm3c-05', field: '数学Ⅲ　積分法', title: '定積分の置換積分法・部分積分法', level: '定積分', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題（定積分を求めよ）',
      parts: ['(1)　$\\displaystyle\\int_1^3x\\sqrt{x-1}\\,dx$', '(2)　$\\displaystyle\\int_0^{\\frac\\pi2}\\sin^2x\\cos x\\,dx$', '(3)　$\\displaystyle\\int_0^2\\sqrt{4-x^2}\\,dx$',
        '(4)　$\\displaystyle\\int_0^{\\frac\\pi2}x\\cos x\\,dx$', '(5)　$\\displaystyle\\int_{-\\frac\\pi2}^{\\frac\\pi2}(x^2\\sin x+\\cos x)\\,dx$'] },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: 'めあて', say: '前の時間までに、不定積分の置換積分法・部分積分法を学びました。この時間は、それを **定積分** で使います。定積分ならではの便利な点があります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '定積分の置換積分法で、**積分区間をかきかえて** 計算できる\n$x=a\\sin\\theta$ のおきかえ、定積分の部分積分法、偶関数・奇関数の性質を使える' }] },

      // ---------- 置換積分法 ----------
      { clear: true, part: '置換積分法', say: '$x=g(t)$ とおき、$x$ が $a$ から $b$ まで動くとき $t$ が $\\alpha$ から $\\beta$ まで動くとします。定積分では、積分区間も $t$ の区間に **かきかえます**。',
        add: [{ t: 'h', text: '定積分の置換積分法' },
          { t: 'box', c: 'y', label: '公式', text: "$x=g(t)$、$a=g(\\alpha)$、$b=g(\\beta)$ のとき　$\\displaystyle\\int_a^bf(x)\\,dx=\\int_\\alpha^\\beta f(g(t))\\,g'(t)\\,dt$" },
          corr([['$x$', '$a\\ \\to\\ b$'], ['$t$', '$\\alpha\\ \\to\\ \\beta$']]), { t: 'p', col: 1, size: 'sm', text: '↑ 区間の対応の表' }] },
      { say: '例：$\\displaystyle\\int_1^3x\\sqrt{x-1}\\,dx$。$t=x-1$ とおくと $x=t+1$、$dx=dt$。$x$ が $1\\to3$ のとき、$t$ は $0\\to2$ です。',
        add: [{ t: 'm', tex: 't=x-1\\ \\text{とおくと}\\quad x=t+1,\\quad dx=dt' }, corr([['$x$', '$1\\ \\to\\ 3$'], ['$t$', '$0\\ \\to\\ 2$']])] },
      { say: '$t$ の式のまま積分して、$t$ の区間の値を代入します。不定積分のときとちがい、$x$ の式に **もどす必要はありません**。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int_1^3x\\sqrt{x-1}\\,dx&=\\int_0^2(t+1)\\sqrt t\\,dt=\\int_0^2(t\\sqrt t+\\sqrt t)\\,dt\\\\ &=\\Big[\\,\\frac25t^2\\sqrt t+\\frac23t\\sqrt t\\,\\Big]_0^2\\\\ &=\\frac85\\sqrt2+\\frac43\\sqrt2=\\ans{\\frac{44\\sqrt2}{15}}\\end{aligned}' }] },
      { clear: true, cols: [1], part: '区間をかきかえる', say: 'もう1問。おきかえたのに、区間をかきかえ忘れるミスがとても多いので、注意して選びましょう。',
        add: [{ t: 'h', text: '区間のかきかえを忘れない' }],
        ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\frac\\pi2}\\sin^2x\\cos x\\,dx$ は？',
        opts: ['$-\\dfrac13$', '$\\dfrac{\\pi^3}{24}$', '$\\dfrac13$'], ok: 2,
        why: { 0: '$t=\\sin x$ のとき $dt=\\cos x\\,dx$。マイナスはつきません。', 1: '$t$ でおきかえたら、区間も $t$ の区間 $0\\to1$ にかえます。$x$ の区間のまま代入しています。' },
        good: '$t=\\sin x$ とおくと、$x:0\\to\\dfrac\\pi2$ のとき $t:0\\to1$。$\\displaystyle\\int_0^1t^2\\,dt=\\frac13$。',
        add: [{ t: 'm', tex: '\\int_0^{\\frac\\pi2}\\sin^2x\\cos x\\,dx=\\int_0^1t^2\\,dt=\\Big[\\,\\frac{t^3}{3}\\,\\Big]_0^1=\\ans{\\frac13}', note: '$t=\\sin x$\n$x:0\\to\\frac\\pi2$ のとき $t:0\\to1$' }] } },

      // ---------- x = a sinθ ----------
      { clear: true, cols: [0.6, 0.4], part: 'x = a sinθ', say: '$\\displaystyle\\int_0^2\\sqrt{4-x^2}\\,dx$ を考えます。$y=\\sqrt{4-x^2}$ のグラフは半径 2 の円の上半分なので、この値は右の **四分円の面積** のはずです。式で確かめます。',
        add: [{ t: 'h', text: '√(a² − x²) の定積分　$\\int_0^2\\sqrt{4-x^2}\\,dx$' },
          { t: 'fig', id: 'qc', col: 1, view: [-0.7, -0.6, 2.7, 2.7], w: 440, h: 427, items: [
            { k: 'axes', tx: [1, 2], ty: [1, 2] },
            { k: 'area', f: 'sqrt(4-x**2)', a: 0, b: 2, c: 'y', alpha: 0.22 },
            { k: 'fn', f: 'sqrt(4-x**2)', a: 0, b: 2, label: 'y=√(4−x²)', lat: [1.35, 2.35] },
            { k: 'seg', a: [0, 0], b: P0, c: 'b' }, { k: 'seg', a: P0, b: [P0[0], 0], c: 'b', dash: true },
            { k: 'angle', o: [0, 0], a: [0, 1], b: P0, rp: 46, c: 'b', label: 'θ', lr: 16 },
            { k: 'pt', at: P0, c: 'b', r: 5 }, { k: 'label', at: [P0[0], 0], text: 'x=2sinθ', c: 'b', size: 21, dy: -40, dx: 50 }] }] },
      { say: '$x=2\\sin\\theta$ とおきます。$x:0\\to2$ のとき $\\theta:0\\to\\dfrac\\pi2$。この範囲では $\\cos\\theta\\ge0$ なので、$\\sqrt{4-4\\sin^2\\theta}=2\\cos\\theta$ です。',
        add: [{ t: 'm', tex: 'x=2\\sin\\theta,\\quad dx=2\\cos\\theta\\,d\\theta', note: '$x:0\\to2$\n$\\theta:0\\to\\frac\\pi2$' },
          { t: 'm', tex: '\\sqrt{4-x^2}=\\sqrt{4\\cos^2\\theta}=2\\cos\\theta', note: '$\\cos\\theta\\ge0$' }] },
      { say: '$\\cos^2\\theta$ は、前の時間の半角の公式で積分します。結果は $\\pi$。半径 2 の円の面積 $4\\pi$ の $\\dfrac14$ と、ぴったり合います。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int_0^2\\sqrt{4-x^2}\\,dx&=\\int_0^{\\frac\\pi2}2\\cos\\theta\\cdot2\\cos\\theta\\,d\\theta=2\\int_0^{\\frac\\pi2}(1+\\cos2\\theta)\\,d\\theta\\\\ &=2\\Big[\\,\\theta+\\frac{\\sin2\\theta}{2}\\,\\Big]_0^{\\frac\\pi2}=\\ans{\\pi}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-3}^3\\sqrt{9-x^2}\\,dx$ は？（円の面積を使ってよい）',
        opts: ['$\\dfrac94\\pi$', '$\\dfrac92\\pi$', '$9\\pi$', '$\\dfrac32\\pi$'], ok: 1,
        why: { 0: '区間は $-3$ から $3$。四分円ではなく **半円** です。', 2: '$y=\\sqrt{9-x^2}\\ge0$ なので、$x$ 軸より上の半円だけです。', 3: '円の面積は $\\pi r^2$。半径 3 なら $9\\pi$、その半分です。' },
        good: '半径 3 の円の上半分の面積で　$\\dfrac12\\cdot\\pi\\cdot3^2=\\dfrac92\\pi$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_{-3}^3\\sqrt{9-x^2}\\,dx=\\frac12\\cdot\\pi\\cdot3^2=\\ans{\\frac92\\pi}', note: '半円の面積' }] } },

      // ---------- 部分積分法 ----------
      { clear: true, cols: [1], part: '部分積分法', say: '部分積分法も、定積分でそのまま使えます。$fg$ の部分にも区間をつけて、$\\Big[\\,f(x)g(x)\\,\\Big]_a^b$ とします。',
        add: [{ t: 'h', text: '定積分の部分積分法' },
          { t: 'box', c: 'y', label: '公式', text: "$\\displaystyle\\int_a^bf(x)g'(x)\\,dx=\\Big[\\,f(x)g(x)\\,\\Big]_a^b-\\int_a^bf'(x)g(x)\\,dx$" }] },
      { say: '例：$\\displaystyle\\int_1^e\\log x\\,dx$。前の時間と同じく $\\log x=(x)\'\\log x$ と見ます。$\\log e=1$、$\\log1=0$ に注意して代入します。',
        add: [{ t: 'm', tex: "\\begin{aligned}\\int_1^e\\log x\\,dx&=\\Big[\\,x\\log x\\,\\Big]_1^e-\\int_1^ex\\cdot\\frac1x\\,dx\\\\ &=(e\\cdot1-1\\cdot0)-(e-1)=\\ans{1}\\end{aligned}", note: '$\\log e=1$\n$\\log1=0$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\frac\\pi2}x\\cos x\\,dx$ は？',
        opts: ['$\\dfrac\\pi2+1$', '$\\dfrac\\pi2$', '$1-\\dfrac\\pi2$', '$\\dfrac\\pi2-1$'], ok: 3,
        why: { 0: '$\\displaystyle\\int_0^{\\frac\\pi2}\\sin x\\,dx=1$。これを **ひく** ので $-1$ です。', 1: '$\\Big[\\,x\\sin x\\,\\Big]$ のあとの $-\\displaystyle\\int\\sin x\\,dx$ を忘れています。', 2: '$\\Big[\\,x\\sin x\\,\\Big]_0^{\\frac\\pi2}=\\dfrac\\pi2$ です。符号が逆です。' },
        good: '$\\Big[\\,x\\sin x\\,\\Big]_0^{\\frac\\pi2}-\\displaystyle\\int_0^{\\frac\\pi2}\\sin x\\,dx=\\frac\\pi2-1$。',
        add: [{ t: 'm', tex: '\\int_0^{\\frac\\pi2}x\\cos x\\,dx=\\Big[\\,x\\sin x\\,\\Big]_0^{\\frac\\pi2}-\\int_0^{\\frac\\pi2}\\sin x\\,dx=\\frac\\pi2-\\Big[-\\cos x\\Big]_0^{\\frac\\pi2}=\\ans{\\frac\\pi2-1}' }] } },

      // ---------- 偶関数・奇関数 ----------
      { clear: true, cols: [0.6, 0.4], part: '偶関数・奇関数', say: '$f(-x)=f(x)$ の関数を **偶関数**、$f(-x)=-f(x)$ の関数を **奇関数** といいます。グラフは $y$ 軸対称と原点対称。だから、$-a$ から $a$ までの定積分は簡単になります。',
        add: [{ t: 'h', text: '偶関数・奇関数の定積分' },
          { t: 'box', c: 'y', label: '性質', text: '偶関数のとき　$\\displaystyle\\int_{-a}^af(x)\\,dx=2\\int_0^af(x)\\,dx$\n奇関数のとき　$\\displaystyle\\int_{-a}^af(x)\\,dx=0$' },
          { t: 'p', size: 'sm', text: '偶関数の例：$x^2,\\ x^4,\\ \\cos x$、定数\n奇関数の例：$x,\\ x^3,\\ \\sin x$' },
          { t: 'fig', id: 'ev', col: 1, view: [-1.7, -0.35, 1.7, 1.75], w: 440, h: 210, items: [
            { k: 'axes', tx: [], ty: [], yl: '' },
            { k: 'area', f: '0.6*x**2+0.4', a: -1.2, b: 1.2, c: 'y' },
            { k: 'fn', f: '0.6*x**2+0.4', a: -1.55, b: 1.55, label: '偶関数', lat: [0.15, 1.55] },
            { k: 'label', at: [-0.6, 0.3], text: 'S', c: 'y' }, { k: 'label', at: [0.6, 0.3], text: 'S', c: 'y' }] },
          { t: 'fig', id: 'od', col: 1, view: [-1.7, -1.9, 1.7, 1.9], w: 440, h: 250, items: [
            { k: 'axes', tx: [], ty: [] },
            { k: 'area', f: 'x**3', a: 0, b: 1.2, c: 'y' }, { k: 'area', f: '0', g: 'x**3', a: -1.2, b: 0, c: 'b' },
            { k: 'fn', f: 'x**3', a: -1.25, b: 1.25, label: '奇関数', lat: [-0.3, 1.5], la: 'end' },
            { k: 'label', at: [0.95, 0.35], text: '+S', c: 'y', size: 22 }, { k: 'label', at: [-0.95, -0.35], text: '−S', c: 'b', size: 22 }] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-2}^2(x^3+3x^2-5x+1)\\,dx$ は？',
        opts: ['$20$', '$10$', '$0$', '$16$'], ok: 0,
        why: { 1: '偶関数の部分は $2\\displaystyle\\int_0^2$。2 倍を忘れています。', 2: '消えるのは奇関数の $x^3$ と $-5x$ だけ。$3x^2$ と $1$ は残ります。', 3: '定数 $1$ も偶関数です。$2\\displaystyle\\int_0^21\\,dx=4$ を落としています。' },
        good: '奇関数 $x^3,\\ -5x$ は 0。残りは　$2\\displaystyle\\int_0^2(3x^2+1)\\,dx=2\\Big[\\,x^3+x\\,\\Big]_0^2=20$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_{-2}^2(x^3+3x^2-5x+1)\\,dx=2\\int_0^2(3x^2+1)\\,dx=\\ans{20}' }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\int_{-\\frac\\pi2}^{\\frac\\pi2}(x^2\\sin x+\\cos x)\\,dx$ を求めよう。',
        hint: '$f(x)=x^2\\sin x$ とすると $f(-x)=(-x)^2\\sin(-x)=-x^2\\sin x$。偶関数か奇関数かを調べる。',
        ans: '$x^2\\sin x$ は奇関数で 0、$\\cos x$ は偶関数。$2\\displaystyle\\int_0^{\\frac\\pi2}\\cos x\\,dx=2$',
        after: '$x^2\\sin x$ の不定積分は部分積分を2回使う計算ですが、奇関数と見ぬけば計算しなくてすみます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_{-\\frac\\pi2}^{\\frac\\pi2}(x^2\\sin x+\\cos x)\\,dx=0+2\\int_0^{\\frac\\pi2}\\cos x\\,dx=\\ans{2}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、定積分を **長方形の面積の和の極限** として見なおし、定積分を使った不等式を考えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
