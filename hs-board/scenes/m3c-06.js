/* 数学Ⅲ 第3章 積分法 定積分 ②：定積分と和の極限・定積分と不等式
   例・数値はすべて自作。答え・誤答・図の座標は python3（sympy）で検算ずみ。
   (1/n³)Σk²=(n+1)(2n+1)/(6n²)→1/3=∫₀¹x²dx、(1/n⁴)Σk³→1/4、Σ_{k=1}^{n}1/(n+k)→∫₀¹dx/(1+x)=log2、
   1<∫₀¹e^{x²}dx<e−1（実際は 1.4627）、Sₙ=Σ_{k=1}^{n}1/√k：2√(n+1)−2<Sₙ<2√n−1、
   考えてみよう n=100：18.0998<S₁₀₀<19（実際は 18.5896） */
(function () {
  const POINTS = [
    '**区分求積法**：$\\displaystyle\\lim_{n\\to\\infty}\\frac1n\\sum_{k=1}^{n}f\\Big(\\frac kn\\Big)=\\int_0^1f(x)\\,dx$。$\\dfrac1n$ をくくり出し、残りを $\\dfrac kn$ の式にする',
    '$a\\le x\\le b$ で $f(x)\\ge g(x)$ なら　$\\displaystyle\\int_a^bf(x)\\,dx\\ge\\int_a^bg(x)\\,dx$。原始関数が求められない定積分も、はさんで見積もれる',
    '和と定積分は、**幅 1 の長方形とグラフの下の面積を比べて** 不等式にする。長方形の置き方で、上からと下からの見積もりができる'
  ];
  const bins = (n, f) => Array.from({ length: n }, (_, i) => [i / n, (i + 1) / n, f((i + 1) / n)]);
  const sq = x => x * x, r = k => 1 / Math.sqrt(k);
  const UP = [1, 2, 3, 4, 5].map(k => [k, k + 1, r(k)]), DN = [1, 2, 3, 4, 5].map(k => [k, k + 1, r(k + 1)]);

  HB.lesson({
    id: 'm3c-06', field: '数学Ⅲ　積分法', title: '定積分と和の極限・定積分と不等式', level: '定積分', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\displaystyle\\lim_{n\\to\\infty}\\frac{1}{n^4}\\sum_{k=1}^nk^3$ を求めよ。', '(2)　$\\displaystyle\\lim_{n\\to\\infty}\\Big(\\frac{1}{n+1}+\\frac{1}{n+2}+\\cdots+\\frac{1}{2n}\\Big)$ を求めよ。',
        '(3)　$1<\\displaystyle\\int_0^1e^{x^2}\\,dx<e-1$ を示せ。', '(4)　$S_n=\\displaystyle\\sum_{k=1}^n\\frac{1}{\\sqrt k}$ について、$2\\sqrt{n+1}-2<S_n<2\\sqrt n-1$（$n\\ge2$）を示せ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までは、定積分を原始関数で計算しました。この時間は、定積分を **細い長方形の面積の和の極限** として見なおします。数学Bの数列の和とつながります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '和の極限を、定積分を使って求められる（区分求積法）\n面積を比べて、定積分や和についての不等式を示せる' }] },

      // ---------- 区分求積法 ----------
      { clear: true, part: '長方形の和', say: '$y=x^2$ の $0\\le x\\le1$ の部分の面積を考えます。区間を $n$ 等分して、右はしの高さの長方形をならべます。右の図は $n=5$ のとき。幅はどれも $\\dfrac1n$ です。',
        add: [{ t: 'h', text: '長方形の面積の和' },
          { t: 'p', text: '$k$ 番目の長方形：幅 $\\dfrac1n$、高さ $\\Big(\\dfrac kn\\Big)^2$' },
          { t: 'm', tex: 'S_n=\\frac1n\\sum_{k=1}^n\\Big(\\frac kn\\Big)^2', note: '長方形の面積の和' },
          { t: 'fig', id: 'q', col: 1, view: [-0.16, -0.16, 1.16, 1.14], w: 460, h: 453, items: [
            { k: 'bars', id: 'b5', bins: bins(5, sq), fill: 'b', c: 'b', alpha: 0.3 },
            { k: 'axes', tx: [[0.2, '1/5'], [0.4, '2/5'], [0.6, '3/5'], [0.8, '4/5'], [1, '1']], ty: [[1, '1']] },
            { k: 'fn', f: 'x**2', a: 0, b: 1.07, c: 'y', label: 'y=x²', lat: [0.42, 0.62], la: 'end' }] }] },
      { say: '$n$ を大きくすると、はみ出した部分（長方形とグラフのすき間）が小さくなり、和は本当の面積に近づきます。緑の長方形は $n=10$ のときです。',
        dim: ['b5'],
        draw: [{ fig: 'q', items: [{ k: 'bars', bins: bins(10, sq), fill: 'g', c: 'g', alpha: 0.4, wd: 2 }, { k: 'fn', f: 'x**2', a: 0, b: 1.07, c: 'y' }] }] },
      { say: 'この極限が定積分です。数学Bの公式 $\\displaystyle\\sum_{k=1}^nk^2=\\frac16n(n+1)(2n+1)$ で計算しても、ちゃんと $\\dfrac13$ になります。',
        dim: ['b5'],
        add: [{ t: 'm', tex: '\\begin{aligned}S_n&=\\frac{1}{n^3}\\sum_{k=1}^nk^2=\\frac{(n+1)(2n+1)}{6n^2}\\\\ &\\to\\frac26=\\frac13=\\int_0^1x^2\\,dx\\end{aligned}', note: '$n\\to\\infty$' }] },
      { clear: true, cols: [1], part: '区分求積法', say: '一般に、$f(x)$ が連続なら、次の式が成り立ちます。和の極限を **定積分で** 求めるこの方法を、**区分求積法** といいます。',
        add: [{ t: 'h', text: '区分求積法' },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle\\lim_{n\\to\\infty}\\frac1n\\sum_{k=1}^{n}f\\Big(\\frac kn\\Big)=\\int_0^1f(x)\\,dx$　　（$\\displaystyle\\sum_{k=0}^{n-1}$ でも同じ）' },
          { t: 'p', size: 'sm', text: '見つけ方：$\\dfrac1n$ をくくり出し、残りを $\\dfrac kn$ の式にする。$\\dfrac kn$ を $x$ に、$\\dfrac1n\\displaystyle\\sum$ を $\\displaystyle\\int_0^1\\cdots dx$ にかえる' }] },
      { say: '例：$\\dfrac{1}{n^4}\\displaystyle\\sum k^3$。$\\dfrac1n$ をくくり出すと、残りは $\\Big(\\dfrac kn\\Big)^3$。だから $f(x)=x^3$ の定積分になります。',
        add: [{ t: 'm', tex: '\\lim_{n\\to\\infty}\\frac{1}{n^4}\\sum_{k=1}^nk^3=\\lim_{n\\to\\infty}\\frac1n\\sum_{k=1}^n\\Big(\\frac kn\\Big)^3=\\int_0^1x^3\\,dx=\\ans{\\frac14}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}\\Big(\\frac{1}{n+1}+\\frac{1}{n+2}+\\cdots+\\frac{1}{2n}\\Big)$ は？',
        opts: ['$0$', '$\\dfrac12$', '$\\infty$', '$\\log2$'], ok: 3,
        why: { 0: '1つ1つの項は 0 に近づきますが、項の数 $n$ もふえるので、0 とは限りません。', 1: 'どの項も $\\dfrac{1}{2n}$ 以上なので、和は $\\dfrac12$ より大きくなります。', 2: '項の数はふえますが、1つ1つは $\\dfrac1n$ くらいに小さくなります。' },
        good: '$\\dfrac{1}{n+k}=\\dfrac1n\\cdot\\dfrac{1}{1+\\frac kn}$ なので、$\\displaystyle\\int_0^1\\frac{dx}{1+x}=\\log2$。',
        add: [{ t: 'm', size: 'sm', tex: '\\sum_{k=1}^n\\frac{1}{n+k}=\\frac1n\\sum_{k=1}^n\\frac{1}{1+\\frac kn}\\ \\to\\ \\int_0^1\\frac{dx}{1+x}=\\Big[\\log(1+x)\\Big]_0^1=\\ans{\\log2}' }] } },

      // ---------- 定積分と不等式 ----------
      { clear: true, part: '定積分と不等式', say: '$a\\le x\\le b$ で $f(x)\\ge g(x)$ なら、面積を比べて $\\displaystyle\\int_a^bf(x)\\,dx\\ge\\int_a^bg(x)\\,dx$。等号は、つねに $f(x)=g(x)$ のときだけです。',
        add: [{ t: 'h', text: '定積分と不等式' },
          { t: 'box', c: 'y', label: '性質', text: '$a\\le x\\le b$ で $f(x)\\ge g(x)$ のとき\n$\\displaystyle\\int_a^bf(x)\\,dx\\ge\\int_a^bg(x)\\,dx$\n（等号は、つねに $f(x)=g(x)$ のとき）' }] },
      { say: '$e^{x^2}$ の原始関数は、これまでの方法では求められません。それでも $0\\le x\\le1$ では $x^2\\le x$ なので $1\\le e^{x^2}\\le e^x$。グラフで比べると右のようになります。',
        add: [{ t: 'm', tex: '0\\le x\\le1\\ \\text{で}\\quad 1\\le e^{x^2}\\le e^x', note: '$x^2\\le x$ だから' },
          { t: 'fig', id: 'ex', col: 1, view: [-0.3, -0.35, 1.45, 3.05], w: 460, h: 440, items: [
            { k: 'area', f: 'exp(x**2)', a: 0, b: 1, c: 'y', alpha: 0.25 },
            { k: 'axes', tx: [[1, '1']], ty: [[1, '1'], [Math.E, 'e']] },
            { k: 'line', x: 1, c: 'd', dash: true },
            { k: 'line', m: 0, n: 1, a: -0.2, b: 1.35, c: 'g', label: 'y=1', lat: [1.1, 0.8] },
            { k: 'fn', f: 'exp(x)', a: -0.25, b: 1.12, c: 'b', label: 'y=eˣ', lat: [0.4, 2.3], la: 'end' },
            { k: 'fn', f: 'exp(x**2)', a: -0.25, b: 1.12, c: 'y', label: 'y=e^(x²)', lat: [1.08, 2.0] }] }] },
      { ask: { type: 'choice', q: '$I=\\displaystyle\\int_0^1e^{x^2}\\,dx$ について、正しいのは？',
        opts: ['$1<I<e-1$', '$I=e-1$', '$0<I<1$', '$e-1<I<e$'], ok: 0,
        why: { 1: '$e^{x^2}$ と $e^x$ が等しいのは $x=0,\\ 1$ だけなので、等号は成り立ちません。', 2: '$e^{x^2}\\ge1$ なので、$I$ は $\\displaystyle\\int_0^11\\,dx=1$ より大きいです。', 3: '$e^{x^2}\\le e^x$ なので、$I$ は $\\displaystyle\\int_0^1e^x\\,dx=e-1$ より小さいです。' },
        good: '$\\displaystyle\\int_0^11\\,dx<I<\\int_0^1e^x\\,dx=e-1$。（実際は $I\\fallingdotseq1.46$）',
        add: [{ t: 'm', size: 'sm', tex: '1=\\int_0^11\\,dx<\\int_0^1e^{x^2}\\,dx<\\int_0^1e^x\\,dx=e-1', note: '$e-1\\fallingdotseq1.72$' }] } },

      // ---------- 和の見積もり ----------
      { clear: true, cols: [0.5, 0.5], part: '和を見積もる', say: '次は、和を定積分で見積もります。$k\\le x\\le k+1$ に高さ $\\dfrac{1}{\\sqrt k}$ の長方形を置くと、$y=\\dfrac{1}{\\sqrt x}$ のグラフより **上に出ます**。',
        add: [{ t: 'h', text: '和を定積分で見積もる' },
          { t: 'm', tex: 'S_n=1+\\frac{1}{\\sqrt2}+\\frac{1}{\\sqrt3}+\\cdots+\\frac{1}{\\sqrt n}' },
          { t: 'fig', id: 'sq', col: 1, view: [-0.45, -0.3, 6.6, 1.3], w: 690, h: 320, items: [
            { k: 'bars', id: 'bu', bins: UP, fill: 'b', c: 'b', alpha: 0.3 },
            { k: 'axes', tx: [1, 2, 3, 4, 5, 6], ty: [[1, '1']] },
            { k: 'fn', f: '1/sqrt(x)', a: 0.62, b: 6.4, c: 'y', label: 'y=1/√x', lat: [2.15, 0.98] }] }] },
      { say: '長方形の面積の和は $S_n$ で、グラフの下の面積 $\\displaystyle\\int_1^{n+1}\\frac{dx}{\\sqrt x}$ より大きくなります。',
        add: [{ t: 'm', tex: 'S_n>\\int_1^{n+1}\\frac{dx}{\\sqrt x}=\\Big[\\,2\\sqrt x\\,\\Big]_1^{n+1}=\\hy{2\\sqrt{n+1}-2}' }] },
      { say: 'こんどは長方形を1つ左へずらし、$k-1\\le x\\le k$ に高さ $\\dfrac{1}{\\sqrt k}$ の長方形を置きます（$k=2,\\ 3,\\ \\cdots,\\ n$）。緑の長方形は、グラフより **下** にあります。',
        dim: ['bu'],
        draw: [{ fig: 'sq', items: [{ k: 'bars', bins: DN, fill: 'g', c: 'g', alpha: 0.4 }, { k: 'fn', f: '1/sqrt(x)', a: 0.62, b: 6.4, c: 'y' }] }] },
      { dim: ['bu'],
        ask: { type: 'choice', q: '緑の長方形とグラフの下の面積を比べると、正しい不等式は？（$n\\ge2$）',
        opts: ['$S_n<2\\sqrt n-2$', '$S_n>2\\sqrt n-1$', '$S_n<2\\sqrt n-1$', '$S_n<2\\sqrt{n+1}-2$'], ok: 2,
        why: { 0: '緑の長方形は $k=2$ から。最初の項 $1$ を足し忘れています。', 1: '緑の長方形はグラフより下なので、和は面積より **小さい** です。', 3: 'さきほど $S_n>2\\sqrt{n+1}-2$ を示しました。逆向きになっています。' },
        good: '$\\dfrac{1}{\\sqrt2}+\\cdots+\\dfrac{1}{\\sqrt n}<\\displaystyle\\int_1^n\\frac{dx}{\\sqrt x}=2\\sqrt n-2$。最初の 1 を足して $S_n<2\\sqrt n-1$。',
        add: [{ t: 'm', tex: 'S_n<1+\\int_1^n\\frac{dx}{\\sqrt x}=\\hg{2\\sqrt n-1}' }] } },
      { dim: ['bu'],
        ask: { type: 'think', q: '$n=100$ のとき、$S_{100}=1+\\dfrac{1}{\\sqrt2}+\\cdots+\\dfrac{1}{\\sqrt{100}}$ はどのくらい？ 2つの不等式から範囲を出そう。（$\\sqrt{101}\\fallingdotseq10.0499$）',
        hint: '$2\\sqrt{n+1}-2<S_n<2\\sqrt n-1$ に $n=100$ を入れる。',
        ans: '$2\\sqrt{101}-2<S_{100}<2\\sqrt{100}-1$ より　$18.09<S_{100}<19$',
        after: '100 個たさなくても、18 と 19 の間とわかります（実際は約 18.59）。',
        add: [{ t: 'm', tex: '18.09<S_{100}<19', note: '$2\\sqrt{101}-2\\fallingdotseq18.0998$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間からは「積分の応用」。まず、曲線で囲まれた部分の **面積** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
