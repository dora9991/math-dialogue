/* 阪大型 数学（理系）：2026年度 大阪大学 前期 理系 第4問の類題（自作問題・元の問題ではない）
   問題：f(x)=eˣcos x。(1) 0≦x≦1 で 1≦f(x)≦1+x。(2) I(t)=∫₀¹ t f(x)/(x²+t²) dx の t→+0 の極限
   答え（python3 で検算ずみ）：
     f'(x)=eˣ(cos x−sin x)、f''(x)=−2eˣ sin x。g=1+x−f：g'=1−eˣ(cos x−sin x)、g''=2eˣ sin x≧0、g'(0)=0、g(0)=0
     f は [0,π/4] で増加、[π/4,1] で減少。f(1)=e cos 1>2·(1/2)=1（1<π/3）
     J(t)=∫₀¹ t/(x²+t²)dx=θₜ（tanθₜ=1/t、0<θₜ<π/2）→ π/2
     K(t)=∫₀¹ tx/(x²+t²)dx=(t/2)log(1+t²)−t log t → 0
     θₜ ≦ I(t) ≦ θₜ+K(t) → lim I(t)=π/2（数値：t=0.001 で I≈1.5765）
     考えてみよう：∫₀¹ t(x+3)/(x²+t²)dx=3θₜ+K(t) → 3π/2 */
(function () {
  const F = 'exp(x)*cos(x)';
  const gfig = (id, o) => {
    o = o || {};
    return { t: 'fig', id, col: 1, view: [-0.16, -0.3, 1.36, 2.5], w: o.w || 520, h: o.h || 430, items: [
      { k: 'axes', tx: [[Math.PI / 4, 'π/4'], [1, '1']], ty: [[1, '1'], [2, '2']] },
      { k: 'line', x: 1, dash: true, c: 'd', wd: 2 },
      { k: 'line', m: 0, n: 1, a: -0.1, b: 1.32, c: 'b', wd: 2.5, label: 'y = 1', lat: [1.05, 0.88], la: 'start' },
      { k: 'line', m: 1, n: 1, a: -0.1, b: 1.32, c: 'g', wd: 2.5, label: 'y = 1 + x', lat: [0.72, 1.98], la: 'end' },
      { k: 'fn', f: F, a: -0.12, b: 1.3, c: 'y', wd: 3.5, label: 'y = f(x)', lat: [1.04, 1.55], la: 'start' },
      { k: 'pt', at: [0, 1], c: 'w', r: 5 }
    ].concat(o.items || []) };
  };
  const POINTS = [
    '1次式との不等式は、差の関数 $g$ を **2回微分**：$g\'\'\\ge0$ → $g\'$ は増加、$g\'(0)=0$ → $g$ は増加、$g(0)=0$ → $g\\ge0$',
    '正の重み $\\dfrac{t}{x^2+t^2}$ をかけて積分すれば、不等式の向きはそのまま。両側の積分を計算して **はさみうち**',
    '$\\displaystyle\\int\\frac{dx}{x^2+t^2}$ は $x=t\\tan\\theta$、$\\displaystyle\\int\\frac{x\\,dx}{x^2+t^2}$ は $\\frac12\\log(x^2+t^2)$。重みは $x=0$ の近くに集まり、極限は $\\frac{\\pi}{2}f(0)$'
  ];

  HB.lesson({
    id: 'osaka26-4', field: '阪大型　数学（理系）', title: '2026 阪大 理系 第4問の類題 ― 不等式ではさむ、重みつき積分の極限', level: '2026年度 大阪大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$f(x)=e^x\\cos x$ とする。',
      parts: [
        '(1)　$0\\le x\\le1$ のとき、$1\\le f(x)\\le1+x$ が成り立つことを示せ。ただし、$e>2$，$\\pi>3$ であることを用いてよい。',
        '(2)　$t>0$ に対して $I(t)=\\displaystyle\\int_0^1\\frac{t\\,f(x)}{x^2+t^2}\\,dx$ とおく。極限 $\\displaystyle\\lim_{t\\to+0}I(t)$ を求めよ。ただし、$\\displaystyle\\lim_{t\\to+0}t\\log t=0$ であることを用いてよい。'
      ],
      src: '※ 2026年度 大阪大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '微分で不等式を示し、それを使って積分の極限を「はさみうち」で求める問題です。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.5, 0.5], part: '読みかえ', say: '(1) は、$0\\le x\\le1$ でグラフ $y=f(x)$（黄）が、2本の直線 $y=1$ と $y=1+x$ の **間にある** ということ。$y=1+x$ は $x=0$ での接線です。',
        add: [{ t: 'h', text: '図で問題をつかむ' },
          { t: 'p', size: 'sm', text: '(1)　$0\\le x\\le1$ で、グラフが\n　　2本の直線の間にある\n(2)　(1) を使って $I(t)$ を上と下からはさむ' },
          gfig('g1', { items: [{ k: 'area', f: '1+x', g: '1', a: 0, b: 1, c: 'y', alpha: 0.12 }] })] },
      { say: '方針です。上側は「差をとって2回微分」、下側は $f$ の増減。(2) は (1) の不等式に正の重みをかけて積分し、両側の極限を調べます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) 上側：$g(x)=1+x-f(x)$ を2回微分\n　　下側：$f$ の増減を調べ、両端の値と比べる\n(2) $\\dfrac{t}{x^2+t^2}>0$ をかけて積分 → はさみうち' }] },

      // ---------- (1) 上側 ----------
      { clear: true, cols: [0.6, 0.4], part: '(1)', say: '(1) です。まず $f\'(x)$ を積の微分で求めます。上側・下側のどちらでも使います。',
        add: [{ t: 'h', text: '(1)　1 ≦ f(x) ≦ 1 + x の証明' }, gfig('g2', { w: 420, h: 400 })] },
      { ask: { type: 'choice', q: '$f(x)=e^x\\cos x$ のとき、$f\'(x)$ は？',
        opts: ['$e^x(\\sin x-\\cos x)$', '$e^x(\\cos x+\\sin x)$', '$e^x(\\cos x-\\sin x)$', '$-e^x\\sin x$'], ok: 2,
        why: { 0: '符号が全部逆です。$(\\cos x)\'=-\\sin x$ の符号に注意。', 1: '$\\cos x$ の微分は $-\\sin x$。$+\\sin x$ ではありません。', 3: '積の微分では $(e^x)\'\\cos x$ の項も残ります。' },
        good: '$f\'(x)=e^x\\cos x+e^x(-\\sin x)=e^x(\\cos x-\\sin x)$。',
        add: [{ t: 'm', tex: "f'(x)=e^x(\\cos x-\\sin x)" }] } },
      { ask: { type: 'choice', q: '上側：$g(x)=1+x-f(x)$ とおく。$g\'(x)=1-e^x(\\cos x-\\sin x)$ をもう一度微分すると？',
        opts: ['$2e^x\\sin x$', '$-2e^x\\sin x$', '$2e^x\\cos x$', '$-e^x(\\cos x-\\sin x)$'], ok: 0,
        why: { 1: 'それは $f\'\'(x)$。$g\'\'=-f\'\'$ なので符号が逆になります。', 2: '$e^x(\\cos x-\\sin x)$ を微分すると $\\cos x$ の項は打ち消し合います。', 3: '$e^x$ だけ微分して、かっこの中の微分を忘れています。' },
        good: '$f\'\'(x)=e^x(\\cos x-\\sin x)+e^x(-\\sin x-\\cos x)=-2e^x\\sin x$ なので、$g\'\'(x)=2e^x\\sin x$。',
        add: [{ t: 'm', size: 'sm', tex: "g'(x)=1-e^x(\\cos x-\\sin x),\\qquad g''(x)=2e^x\\sin x" }] } },
      { say: '$0\\le x\\le1$ では $\\sin x\\ge0$ なので $g\'\'(x)\\ge0$。ここから「増加 → 0 以上」を2回くり返します。',
        add: [{ t: 'm', size: 'sm', tex: "\\begin{aligned}&g''(x)\\ge0\\ \\Rightarrow\\ g'(x)\\text{ は増加},\\ \\ g'(0)=1-1=0\\ \\Rightarrow\\ g'(x)\\ge0\\\\ &\\Rightarrow\\ g(x)\\text{ は増加},\\ \\ g(0)=1-1=0\\ \\Rightarrow\\ \\hy{g(x)\\ge0}\\end{aligned}" },
          { t: 'p', size: 'sm', text: 'よって $f(x)\\le1+x$（上側）' }] },

      // ---------- (1) 下側 ----------
      { clear: true, cols: [0.6, 0.4], part: '(1) 下側', say: '下側です。$f\'(x)=e^x(\\cos x-\\sin x)$ の符号は、$\\cos x$ と $\\sin x$ の大小で決まり、$x=\\frac{\\pi}{4}$ で入れかわります。',
        add: [{ t: 'h', text: '(1)　下側：f(x) ≧ 1' },
          { t: 'tbl', size: 'sm', rows: [['$x$', '$0$', '$\\cdots$', '$\\frac{\\pi}{4}$', '$\\cdots$', '$1$'], ["$f'(x)$", '', '$+$', '$0$', '$-$', ''], ['$f(x)$', '$1$', '$\\nearrow$', '', '$\\searrow$', '$e\\cos1$']] },
          { t: 'p', size: 'sm', text: '最小値は両端の小さいほう → $f(1)=e\\cos1>1$ を示せばよい' },
          gfig('g3', { w: 420, h: 400, items: [{ k: 'pt', at: [1, Math.E * Math.cos(1)], c: 'p', r: 7 }, { k: 'label', at: [0.8, 1.22], text: 'e cos 1', c: 'p', size: 20 }] })] },
      { ask: { type: 'choice', q: '$e\\cos1>1$ を示すのに使える正しい評価は？',
        opts: ['$\\cos1>\\cos\\frac{\\pi}{4},\\ e>\\sqrt2$', '$\\cos1>\\cos\\frac{\\pi}{3},\\ e>2$', '$\\cos1<1,\\ e>2$', '$\\cos1\\approx0.54$ を使う'], ok: 1,
        why: { 0: '$1>\\frac{\\pi}{4}$ なので $\\cos1<\\cos\\frac{\\pi}{4}$。不等号が逆です。', 2: '$\\cos1$ を上からおさえても、$e\\cos1$ を下からおさえられません。', 3: '近似値だけでは答案の根拠になりません。与えられた $e>2$，$\\pi>3$ を使います。' },
        good: '$\\pi>3$ より $0<1<\\frac{\\pi}{3}$ で、$\\cos$ は減少するから $\\cos1>\\frac12$。$e\\cos1>2\\cdot\\frac12=1$。',
        add: [{ t: 'm', size: 'sm', tex: 'f(1)=e\\cos1>2\\cdot\\cos\\frac{\\pi}{3}=1' }] } },
      { say: '$f(0)=1$、$f(1)>1$ なので、$0\\le x\\le1$ で $f(x)\\ge1$。別解として、$f\'\'(x)=-2e^x\\sin x\\le0$（上に凸）から「両端を結ぶ線分より上」と言ってもかまいません。',
        add: [{ t: 'ans', label: '(1)', text: '$0\\le x\\le1$ で　$1\\le f(x)\\le1+x$（証明終）' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '(2) です。(1) の不等式の各辺に $\\frac{t}{x^2+t^2}$ をかけて、0 から 1 まで積分します。',
        add: [{ t: 'h', text: '(2)　はさみうちの準備' },
          { t: 'm', size: 'sm', tex: '\\frac{t}{x^2+t^2}\\le\\frac{t\\,f(x)}{x^2+t^2}\\le\\frac{t}{x^2+t^2}+\\frac{t\\,x}{x^2+t^2}' }] },
      { ask: { type: 'choice', q: '不等式の向きを変えずに $\\dfrac{t}{x^2+t^2}$ をかけてよい理由は？',
        opts: ['$t$ が 0 に近いから', '$f(x)>0$ だから', '積分すると等号になるから', '$\\dfrac{t}{x^2+t^2}>0$ だから'], ok: 3,
        why: { 0: '$t$ の大きさは関係ありません。かける数の符号が大事です。', 1: '$f(x)$ の符号ではなく、かける数 $\\frac{t}{x^2+t^2}$ の符号が問題です。', 2: '積分しても等号にはなりません。' },
        good: '$t>0$ なので $\\frac{t}{x^2+t^2}>0$。正の数をかけても、積分しても、不等式の向きは変わりません。',
        add: [{ t: 'm', size: 'sm', tex: 'J(t)\\le I(t)\\le J(t)+K(t)' },
          { t: 'm', size: 'sm', tex: 'J(t)=\\int_0^1\\frac{t}{x^2+t^2}\\,dx,\\quad K(t)=\\int_0^1\\frac{t\\,x}{x^2+t^2}\\,dx' }] } },
      { ask: { type: 'choice', q: '$J(t)$ で $x=t\\tan\\theta$ とおく。$\\dfrac{t}{x^2+t^2}\\,dx$ はどうなる？',
        opts: ['$t\\,d\\theta$', '$d\\theta$', '$\\dfrac1t\\,d\\theta$', '$\\cos^2\\theta\\,d\\theta$'], ok: 1,
        why: { 0: '$dx=\\frac{t}{\\cos^2\\theta}d\\theta$ の $t$ と、分母の $t^2$ が約分されます。', 2: '分子にも $t$ があることを忘れています。', 3: '$dx$ の $\\frac{1}{\\cos^2\\theta}$ をかけ忘れています。' },
        good: '$x^2+t^2=\\frac{t^2}{\\cos^2\\theta}$，$dx=\\frac{t}{\\cos^2\\theta}d\\theta$ より、$\\frac{t\\cos^2\\theta}{t^2}\\cdot\\frac{t}{\\cos^2\\theta}\\,d\\theta=d\\theta$。' } },
      { clear: true, cols: [0.62, 0.38], part: '(2) J(t)', say: '$x$ が 0 から 1 まで動くとき、$\\theta$ は 0 から $\\theta_t$ まで（$\\tan\\theta_t=\\frac1t$）。$t\\to+0$ で $\\frac1t\\to\\infty$ なので、$\\theta_t\\to\\frac{\\pi}{2}$ です。',
        add: [{ t: 'h', text: '(2)　J(t) を計算する' },
          { t: 'm', size: 'sm', tex: 'J(t)=\\int_0^{\\theta_t}d\\theta=\\theta_t\\qquad\\left(\\tan\\theta_t=\\frac1t,\\ 0<\\theta_t<\\frac{\\pi}{2}\\right)' },
          { t: 'm', size: 'sm', tex: 't\\to+0\\ \\text{のとき}\\ \\ J(t)=\\theta_t\\to\\frac{\\pi}{2}' },
          { t: 'fig', id: 'tri', col: 1, view: [-0.25, -0.3, 0.75, 1.25], w: 300, h: 465, items: [
            { k: 'poly', pts: [[0, 0], [0.4, 0], [0.4, 1]], close: true, c: 'w', wd: 2.5, fill: 'b', alpha: 0.12 },
            { k: 'right', o: [0.4, 0], a: [0, 0], b: [0.4, 1], s: 14 },
            { k: 'angle', o: [0, 0], a: [0.4, 0], b: [0.4, 1], rp: 40, label: 'θₜ', c: 'y' },
            { k: 'label', at: [0.2, 0], text: 't', dy: 24, c: 'p', size: 24 }, { k: 'label', at: [0.4, 0.5], text: '1', dx: 18, c: 'p', size: 24 },
            { k: 'label', at: [0.2, 1.12], text: 't → +0 で\n90° に近づく', c: 'y', size: 18, plain: true }] }] },
      { ask: { type: 'choice', q: '$K(t)=\\dfrac{t}{2}\\Big[\\log(x^2+t^2)\\Big]_0^1=\\dfrac t2\\log(1+t^2)-t\\log t$。$t\\to+0$ の極限は？',
        opts: ['$\\infty$', '$\\dfrac{\\pi}{2}$', '$1$', '$0$'], ok: 3,
        why: { 0: '$-\\log t\\to\\infty$ ですが、前に $t$ がかかっています。$t\\log t\\to0$ でした。', 1: '$\\frac{\\pi}{2}$ になるのは $J(t)$ のほうです。', 2: '$\\log(1+t^2)\\to0$ なので、第1項は 0 に近づきます。' },
        good: '$\\frac t2\\log(1+t^2)\\to0\\cdot0=0$、$t\\log t\\to0$（問題で与えられた事実）。よって $K(t)\\to0$。',
        add: [{ t: 'm', size: 'sm', tex: '\\log t^2=2\\log t\\ \\ \\text{に注意}\\qquad K(t)\\to0' }] } },
      { say: 'はさみうちの完成です。左の $J(t)$ も、右の $J(t)+K(t)$ も $\\frac{\\pi}{2}$ に近づくので、間にある $I(t)$ も $\\frac{\\pi}{2}$ に近づきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\underbrace{\\theta_t}_{\\to\\frac{\\pi}{2}}\\ \\le\\ I(t)\\ \\le\\ \\underbrace{\\theta_t+K(t)}_{\\to\\frac{\\pi}{2}}' },
          { t: 'ans', label: '(2) 答', tex: '\\lim_{t\\to+0}I(t)=\\frac{\\pi}{2}' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '重み $y=\\frac{t}{x^2+t^2}$ のグラフです。$t$ が小さいほど $x=0$ の近くだけが高くなり、下の面積はいつも $\\theta_t$（$\\frac{\\pi}{2}$ に近い）。だから $I(t)$ は $f(0)$ だけで決まります。',
        add: [{ t: 'h', text: '別の見方：重みが x = 0 に集まる' },
          { t: 'm', size: 'sm', tex: 'I(t)\\to\\frac{\\pi}{2}\\,f(0)=\\frac{\\pi}{2}\\cdot1' },
          { t: 'fig', id: 'wt', col: 1, view: [-0.08, -0.6, 1.08, 10.8], w: 520, h: 430, items: [
            { k: 'axes', tx: [[0.5, '0.5'], [1, '1']], ty: [[4, '4'], [10, '10']] },
            { k: 'area', f: '0.1/(x*x+0.01)', a: 0, b: 1, c: 'p', alpha: 0.18 },
            { k: 'fn', f: '0.1/(x*x+0.01)', a: 0, b: 1.05, c: 'p', wd: 3, label: 't = 0.1', lat: [0.13, 9.6], la: 'start' },
            { k: 'fn', f: '0.25/(x*x+0.0625)', a: 0, b: 1.05, c: 'b', wd: 3, label: 't = 0.25', lat: [0.3, 3.4], la: 'start' }] }] },
      { ask: { type: 'think', q: '同じ考え方で、$\\displaystyle\\lim_{t\\to+0}\\int_0^1\\frac{t\\,(x+3)}{x^2+t^2}\\,dx$ を求めよう。',
        hint: '$x+3$ で分けると $3J(t)+K(t)$。',
        ans: '$3J(t)+K(t)\\to3\\cdot\\dfrac{\\pi}{2}+0=\\dfrac{3\\pi}{2}$',
        after: '$x=0$ での値 $3$ に $\\frac{\\pi}{2}$ をかけた値。重みが $x=0$ に集まるようすと合っています。' } },
      { say: '答案で点がつくところです。$\\theta_t$ は高校では「$\\tan\\theta_t=\\frac1t$ をみたす角」として書きます（記号 arctan は使わない）。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(1) $g\'\'\\ge0\\to g\'\\ge0\\to g\\ge0$ の流れを、$g\'(0)=g(0)=0$ とともに\n・$e\\cos1>1$ を $e>2$，$\\pi>3$ から示す\n・重みが正なので不等式の向きは変わらない、と書く\n・置換の範囲（$\\theta_t$ の定義）と、$t\\log t\\to0$ の使いどころ' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「微分で不等式」→「正の重みをかけて積分」→「はさみうち」は、極限の問題の大事な型です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
