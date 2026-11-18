/* 数学Ⅲ 第2章 微分法 ②：合成関数・逆関数の導関数
   例はすべて自作。導関数・誤答・図の座標は python3（sympy）で検算ずみ。
   図：y=x²（x≧0）の点 (2, 4) の接線 y=4x−4、y=√x の点 (4, 2) の接線 y=x/4+1（y=x に関して対称） */
(function () {
  const POINTS = [
    '**合成関数の微分**　$y=f(u),\\ u=g(x)$ のとき $\\dfrac{dy}{dx}=\\dfrac{dy}{du}\\cdot\\dfrac{du}{dx}$。外側を微分して、**中身の微分をかける**',
    '**逆関数の微分**　$x=f(y)$ のとき $\\dfrac{dy}{dx}=\\dfrac{1}{\\ \\dfrac{dx}{dy}\\ }$。最後は $x$ の式になおす',
    "$r$ が有理数のとき $(x^r)'=rx^{r-1}$。$\\sqrt{x}=x^{\\frac12}$、$\\dfrac{1}{\\sqrt[3]{x}}=x^{-\\frac13}$ と指数になおして使う"
  ];
  // y=x² と y=√x（縦横の目もりを同じに）
  const invFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.7, -0.7, 5.6, 5.6], w: 400, h: 400, items: [
    { k: 'axes', tx: [1, 2, 3, 4, 5], ty: [1, 2, 3, 4, 5] },
    { k: 'line', m: 1, n: 0, a: -0.6, b: 5.4, c: 'w', dash: true, label: 'y=x', lat: [4.6, 5.2], la: 'end' },
    { k: 'fn', f: 'x**2', a: 0, b: 2.35, c: 'y', label: 'y=x²', lat: [1.55, 5.0], la: 'end' },
    { k: 'fn', f: 'sqrt(x)', a: 0, b: 5.5, c: 'b', label: 'y=√x', lat: [5.45, 1.85], la: 'end' }].concat(items || []) });

  HB.lesson({
    id: 'm3b-02', field: '数学Ⅲ　微分法', title: '合成関数・逆関数の導関数', level: '導関数', time: '目安 7分',
    noDec: true,   // 指数の分数（x^{1/2} など）の横に小数が出ると読みにくいので
    problem: { label: '例題', lead: '次の関数を微分せよ。',
      parts: ['(1)　$y=(3x-1)^4$', '(2)　$y=(1-2x)^5$', '(3)　$y=\\sqrt[3]{x}$（$x=y^3$ と見て）', '(4)　$y=\\dfrac{1}{\\sqrt[3]{x}}$', '(5)　$y=\\sqrt{x^2+1}$', '(6)　$y=\\sqrt{5-2x}$', '(7)　$y=x\\sqrt{1-x}$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、積と商の微分を学びました。この時間は、第1章で学んだ **合成関数** と **逆関数** の微分です。これで $\\sqrt{x}$ のような関数も微分できます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**合成関数** の導関数を求められる\n**逆関数** の導関数を使って、$(x^r)\'=rx^{r-1}$ がわかる' }] },

      // ---------- 合成関数 ----------
      { clear: true, part: '合成関数', say: '$y=(3x-1)^4$ は、$u=3x-1$ とおくと $y=u^4$。$x$ が少し変わると $u$ が $\\dfrac{du}{dx}$ 倍、$u$ が変わると $y$ が $\\dfrac{dy}{du}$ 倍変わります。',
        add: [{ t: 'h', text: '合成関数の微分' },
          { t: 'box', c: 'y', label: '公式', text: '$y=f(u),\\ u=g(x)$ のとき\n$\\dfrac{dy}{dx}=\\hy{\\dfrac{dy}{du}}\\cdot\\hb{\\dfrac{du}{dx}}$' },
          { t: 'p', col: 1, size: 'sm', text: '$x\\ \\xrightarrow{\\ \\ g\\ \\ }\\ u\\ \\xrightarrow{\\ \\ f\\ \\ }\\ y$\n変わる割合を **かけ合わせる**' },
          { t: 'p', col: 1, size: 'sm', text: "$f(g(x))$ の形で書くと\n$\\{f(g(x))\\}'=f'(g(x))\\,g'(x)$" }] },
      { say: '$y=u^4$ を $u$ で微分して $4u^3$、$u=3x-1$ を $x$ で微分して $3$。かけ合わせて、$u$ をもとにもどします。',
        add: [{ t: 'm', tex: '\\frac{dy}{dx}=\\hy{4u^3}\\cdot\\hb{3}=12(3x-1)^3' },
          { t: 'box', c: 'p', label: 'まとめると', text: "$\\{(ax+b)^n\\}'=n(ax+b)^{n-1}\\cdot\\hb{a}$" }] },
      { ask: { type: 'choice', q: '$y=(1-2x)^5$ を微分すると？',
        opts: ['$5(1-2x)^4$', '$-10(1-2x)^4$', '$10(1-2x)^4$', '$-10(1-2x)^5$'], ok: 1,
        why: { 0: '中身 $1-2x$ の微分 $-2$ をかけ忘れています。', 2: '中身 $1-2x$ を微分すると $-2$。符号が残ります。', 3: '指数は 1 へらして 4 にします。' },
        good: '$5(1-2x)^4\\cdot(-2)=-10(1-2x)^4$。',
        add: [{ t: 'm', tex: "\\{(1-2x)^5\\}'=5(1-2x)^4\\cdot(-2)=-10(1-2x)^4" }] } },

      // ---------- 逆関数 ----------
      { clear: true, part: '逆関数', say: '$y=f^{-1}(x)$ は $x=f(y)$ と同じです。両辺を $x$ で微分すると、右辺は合成関数の微分で $\\dfrac{dx}{dy}\\cdot\\dfrac{dy}{dx}$ になります。',
        add: [{ t: 'h', text: '逆関数の微分' },
          { t: 'm', tex: '1=\\frac{dx}{dy}\\cdot\\frac{dy}{dx}' },
          { t: 'box', c: 'y', label: '公式', text: '$x=f(y)$ のとき　$\\dfrac{dy}{dx}=\\dfrac{1}{\\ \\dfrac{dx}{dy}\\ }$' }] },
      { say: '$y=\\sqrt{x}$ は $x=y^2$（$y\\ge0$）。$\\dfrac{dx}{dy}=2y$ なので、$\\dfrac{dy}{dx}=\\dfrac{1}{2y}=\\dfrac{1}{2\\sqrt{x}}$。最後は $x$ の式になおします。',
        add: [{ t: 'm', tex: '\\frac{dy}{dx}=\\frac{1}{2y}=\\frac{1}{2\\sqrt{x}}', note: '$y=\\sqrt{x}$ を代入' },
          invFig('fi', [{ k: 'pt', at: [2, 4], c: 'y' }, { k: 'pt', at: [4, 2], c: 'b' }])] },
      { say: '図で見ると、$y=x^2$ と $y=\\sqrt{x}$ は直線 $y=x$ に関して対称。点 $(2,\\,4)$ の接線の傾きは $4$、対称な点 $(4,\\,2)$ の接線の傾きは $\\dfrac14$ で、**逆数** になっています。',
        draw: [{ fig: 'fi', items: [
          { k: 'line', m: 4, n: -4, a: 1.3, b: 2.4, c: 'y' },
          { k: 'line', m: 0.25, n: 1, a: 1.6, b: 5.5, c: 'b' },
          { k: 'label', at: [1.6, 3.4], text: '傾き 4', c: 'y', size: 22, anchor: 'end' },
          { k: 'label', at: [4.0, 2.65], text: '傾き 1/4', c: 'b', size: 22 }] }] },
      { ask: { type: 'choice', q: '$y=\\sqrt[3]{x}$ は $x=y^3$。$\\dfrac{dy}{dx}$ を $x$ で表すと？（$x\\neq0$）',
        opts: ['$3x^2$', '$\\dfrac{1}{3x^2}$', '$\\dfrac{1}{3\\sqrt[3]{x^2}}$', '$\\dfrac{1}{3\\sqrt[3]{x}}$'], ok: 2,
        why: { 0: '$\\dfrac{dx}{dy}=3y^2$ のほうです。$\\dfrac{dy}{dx}$ はその逆数。', 1: '$\\dfrac{1}{3y^2}$ の $y$ は $\\sqrt[3]{x}$。$y$ を $x$ にかえるだけではいけません。', 3: '$y^2=(\\sqrt[3]{x})^2=\\sqrt[3]{x^2}$。2乗が消えています。' },
        good: '$\\dfrac{dy}{dx}=\\dfrac{1}{3y^2}=\\dfrac{1}{3\\sqrt[3]{x^2}}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{dy}{dx}=\\frac{1}{3y^2}=\\frac{1}{3\\sqrt[3]{x^2}}=\\frac13x^{-\\frac23}' }] } },

      // ---------- x^r ----------
      { clear: true, part: '有理数の指数', say: '今の結果は $\\dfrac13x^{\\frac13-1}$ と書けます。同じように考えると、$(x^n)\'=nx^{n-1}$ は、指数が **有理数** でも成り立ちます。',
        add: [{ t: 'h', text: '$x^r$ の導関数' },
          { t: 'box', c: 'y', label: '公式', text: "$r$ が有理数のとき　$(x^r)'=rx^{r-1}$" },
          { t: 'p', size: 'sm', text: '$x^{\\frac1n}$ は逆関数の微分、$x^{\\frac mn}=(x^{\\frac1n})^m$ は合成関数の微分で示せる' }] },
      { say: '根号や分数は、**指数になおしてから** 公式を使います。$\\dfrac{1}{\\sqrt{x}}=x^{-\\frac12}$ なので、指数 $-\\dfrac12$ を前に出し、指数を $1$ へらして $-\\dfrac32$。',
        add: [{ t: 'm', tex: "(x\\sqrt{x})'=(x^{\\frac32})'=\\frac32x^{\\frac12}=\\frac32\\sqrt{x}" },
          { t: 'm', tex: "\\left(\\frac{1}{\\sqrt{x}}\\right)'=(x^{-\\frac12})'=-\\frac12x^{-\\frac32}=-\\frac{1}{2x\\sqrt{x}}" }] },
      { ask: { type: 'choice', q: '$y=\\dfrac{1}{\\sqrt[3]{x}}$ を微分すると？',
        opts: ['$-\\dfrac13x^{-\\frac23}$', '$\\dfrac13x^{-\\frac43}$', '$-3x^{-4}$', '$-\\dfrac13x^{-\\frac43}$'], ok: 3,
        why: { 0: '指数は $1$ へらします。$-\\dfrac13-1=-\\dfrac43$ です。', 1: '前に出す指数は $-\\dfrac13$。負の符号が残ります。', 2: '$\\sqrt[3]{x}$ は $x^{\\frac13}$。$x^3$ ではありません。' },
        good: '$y=x^{-\\frac13}$ なので $y\'=-\\dfrac13x^{-\\frac43}$。',
        add: [{ t: 'm', tex: "\\left(\\frac{1}{\\sqrt[3]{x}}\\right)'=(x^{-\\frac13})'=-\\frac13x^{-\\frac43}" }] } },

      // ---------- 組み合わせ ----------
      { clear: true, part: '組み合わせ', say: '$y=\\sqrt{x^2+1}$ は、$u=x^2+1$ とおくと $y=u^{\\frac12}$。$x^r$ の公式と合成関数の微分を組み合わせます。',
        add: [{ t: 'h', text: '$\\sqrt{\\ \\ }$ の中が式のとき' },
          { t: 'm', tex: "\\begin{aligned}(\\sqrt{x^2+1})'&=\\hy{\\frac12(x^2+1)^{-\\frac12}}\\cdot\\hb{2x}\\\\ &=\\frac{x}{\\sqrt{x^2+1}}\\end{aligned}" },
          { t: 'box', col: 1, c: 'p', label: 'よく使う形', text: "$\\{\\sqrt{g(x)}\\}'=\\dfrac{g'(x)}{2\\sqrt{g(x)}}$" }] },
      { ask: { type: 'choice', q: '$y=\\sqrt{5-2x}$ を微分すると？',
        opts: ['$-\\dfrac{1}{\\sqrt{5-2x}}$', '$\\dfrac{1}{2\\sqrt{5-2x}}$', '$-\\dfrac{2}{\\sqrt{5-2x}}$', '$\\dfrac{1}{\\sqrt{5-2x}}$'], ok: 0,
        why: { 1: '中身 $5-2x$ の微分 $-2$ をかけ忘れています。', 2: '$\\dfrac{1}{2\\sqrt{\\ \\ }}$ の $\\dfrac12$ を忘れています。$\\dfrac{-2}{2\\sqrt{5-2x}}$ と約分します。', 3: '中身の微分は $-2$。負の符号が消えています。' },
        good: '$\\dfrac{-2}{2\\sqrt{5-2x}}=-\\dfrac{1}{\\sqrt{5-2x}}$。',
        add: [{ t: 'm', tex: "(\\sqrt{5-2x})'=\\frac{-2}{2\\sqrt{5-2x}}=-\\frac{1}{\\sqrt{5-2x}}" }] } },
      { ask: { type: 'think', q: '$y=x\\sqrt{1-x}$ を微分して、1つの分数にまとめよう。（$x<1$）',
        hint: '前の時間の積の公式。$\\sqrt{1-x}$ の微分は、上の「よく使う形」で $\\dfrac{-1}{2\\sqrt{1-x}}$。',
        ans: "$y'=\\sqrt{1-x}+x\\cdot\\dfrac{-1}{2\\sqrt{1-x}}=\\dfrac{2(1-x)-x}{2\\sqrt{1-x}}=\\dfrac{2-3x}{2\\sqrt{1-x}}$",
        after: '通分するときは、$\\sqrt{1-x}=\\dfrac{2(1-x)}{2\\sqrt{1-x}}$ と分母をそろえます。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: "(x\\sqrt{1-x})'=\\frac{2-3x}{2\\sqrt{1-x}}" }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、これまでの公式と第1章の極限を使って、**三角関数の導関数** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
