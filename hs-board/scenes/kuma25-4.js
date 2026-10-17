/* 熊大型（理系）2025 第4問の類題（自作）：数学Ⅲ 微分・積分・極限 ― 対数の不等式・調和数列の和の評価・積の n 乗根の極限
   元の問題はうつしていない（「対数をふくむ不等式を微分で示す」「調和数列の部分和を面積で対数と比べる」「積で定義された数列の n 乗根の極限を
   対数をとってはさみうち」というねらいと形式だけを合わせた自作問題）。
   答え（python3・sympy で検算ずみ）：
   (1) h=x−log(1+x)：h'=x/(1+x)>0。g=log(1+x)−x+x²/2：g'=x²/(1+x)>0。どちらも 0 から増加
   (2) k≧2 で 1/k<∫[k−1,k] dx/x → Σ[k=2..n] 1/k < log n
   (3) log aₙ=(1/n)Σ k·log(1+2/k)。x=2/k で 2−2/k < k·log(1+2/k) < 2 → 2−(2/n)Hₙ < log aₙ < 2，(2/n)Hₙ<2(1+log n)/n→0 → lim aₙ=e²
   数値：a₁=3，a₂=√12≒3.46，a₁₀≒5.06，a₁₀₀≒6.82，a₁₀₀₀≒7.30，e²≒7.389
   考えてみよう：log(1+x)>x/(1+x) でも k·log(1+2/k)>2k/(k+2)=2−4/(k+2)>2−4/k で同じ結論 */
(function () {
  const POINTS = [
    '不等式 $A<B$ は、差の関数 $h(x)=B-A$ を作り、**$h(0)=0$ と $h\'(x)>0$** から「$x>0$ で $h(x)>0$」を言う',
    '$\\sum\\frac1k$ は **長方形の面積** と見て、曲線 $y=\\frac1x$ の下の面積（積分）と比べる：$\\frac1k<\\int_{k-1}^{k}\\frac{dx}{x}$',
    '積の $n$ 乗根は **対数をとって和にする**。(1) で各項をはさみ、(2) と $\\frac{\\log n}{n}\\to0$ ではさみうち'
  ];
  const T0 = [['$n$', '1', '2', '10', '100', '1000'], ['$a_n$', '3', '3.46…', '5.06…', '6.81…', '7.29…']];

  HB.lesson({
    id: 'kuma25-4', field: '熊大型　数学（理系）', title: '2025 熊大 理系 第4問の類題 ― 対数の不等式と、積の n 乗根の極限', level: '2025年度 熊本大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '対数は自然対数とする。',
      parts: [
        '(1)　$x>0$ のとき、不等式　$x-\\dfrac{x^2}{2}<\\log(1+x)<x$　が成り立つことを示せ。',
        '(2)　2 以上の自然数 $n$ に対して、不等式　$\\displaystyle\\sum_{k=1}^{n}\\frac1k<1+\\log n$　が成り立つことを示せ。',
        '(3)　自然数 $n$ に対して　$a_n=\\left\\{\\left(1+\\dfrac21\\right)^1\\left(1+\\dfrac22\\right)^2\\left(1+\\dfrac23\\right)^3\\cdots\\left(1+\\dfrac2n\\right)^n\\right\\}^{\\frac1n}$　とする。極限 $\\displaystyle\\lim_{n\\to\\infty}a_n$ を求めよ。必要ならば、$\\displaystyle\\lim_{n\\to\\infty}\\frac{\\log n}{n}=0$ を用いてよい。'
      ],
      src: '※ 2025年度 熊本大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '数学Ⅲの微分・積分・極限の総合問題です。(1)(2) の不等式が、(3) の極限の道具になる誘導の形。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },
      { clear: true, part: '見通し', say: 'まず (3) の $a_n$ を計算機で調べると、$n$ を大きくするとゆっくり増えて、7.3 くらいに近づいていきます。',
        add: [{ t: 'h', text: '見通し：(3) の数列を調べる' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: T0 },
          { t: 'p', size: 'sm', text: '各かっこ $\\left(1+\\dfrac2k\\right)^k$ は、$k\\to\\infty$ で $e^2\\fallingdotseq7.389$ に近づく' }] },
      { say: '積のままでは扱いにくいので、(3) では対数をとって「和」にします。そのとき、$\\log(1+x)$ をはさむ (1) と、$\\sum\\frac1k$ をおさえる (2) を使います。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(3)　$\\log a_n$ ＝ 和 → (1) で各項をはさむ\n→ 残った $\\sum\\frac1k$ を (2) でおさえる → はさみうち' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。右側 $\\log(1+x)<x$ から。差の関数 $h(x)=x-\\log(1+x)$ を作り、$x>0$ で正になることを示します。',
        add: [{ t: 'h', text: '(1)　右側：$\\log(1+x)<x$' },
          { t: 'm', tex: 'h(x)=x-\\log(1+x)\\quad(x\\ge0)' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.3, -0.9, 2.8, 2.7], w: 480, h: 500, items: [
            { k: 'axes', tx: [1, 2], ty: [1, 2] },
            { k: 'line', m: 1, n: 0, a: -0.3, b: 2.6, c: 'b', label: 'y=x', lat: [1.85, 2.45] },
            { k: 'fn', f: 'log(1+x)', a: -0.2, b: 2.8, c: 'y', label: 'y=log(1+x)', lat: [1.45, 1.42] }] }] },
      { ask: { type: 'choice', q: "$h(x)=x-\\log(1+x)$ の導関数 $h'(x)$ は？",
        opts: ['$1-\\log(1+x)$', '$\\dfrac{1}{1+x}$', '$\\dfrac{x}{1+x}$', '$1+\\dfrac{1}{1+x}$'], ok: 2,
        why: { 0: '$\\log(1+x)$ を微分すると $\\frac{1}{1+x}$。微分し忘れています。', 1: '$x$ を微分した 1 が抜けています。$1-\\frac{1}{1+x}$ です。', 3: '$-\\log(1+x)$ の符号が逆です。' },
        good: "$h'(x)=1-\\dfrac{1}{1+x}=\\dfrac{x}{1+x}$。$x>0$ で正です。",
        add: [{ t: 'm', tex: "h'(x)=1-\\frac{1}{1+x}=\\frac{x}{1+x}>0\\quad(x>0)" }] } },
      { say: '答案では「$h(x)$ は $x\\ge0$ で増加し、$h(0)=0$。よって $x>0$ で $h(x)>h(0)=0$」と書きます。$h(0)=0$ が出発点です。',
        add: [{ t: 'm', tex: 'h(0)=0-\\log1=0', note: '出発点' },
          { t: 'p', size: 'sm', text: '$x\\ge0$ で増加、$h(0)=0$ → $x>0$ で $h(x)>0$\nよって　$\\log(1+x)<x$' }] },
      { clear: true, say: '左側も同じ手順。$g(x)=\\log(1+x)-\\left(x-\\dfrac{x^2}{2}\\right)$ とおきます。$g(0)=0$ です。',
        add: [{ t: 'h', text: '(1)　左側：$x-\\frac{x^2}{2}<\\log(1+x)$' },
          { t: 'm', tex: 'g(x)=\\log(1+x)-x+\\frac{x^2}{2}\\quad(x\\ge0)' },
          { t: 'fig', id: 'f2', col: 1, view: [-0.3, -0.9, 2.8, 2.7], w: 480, h: 500, items: [
            { k: 'axes', tx: [1, 2], ty: [1, 2] },
            { k: 'line', m: 1, n: 0, a: -0.3, b: 2.6, c: 'b', label: 'y=x', lat: [1.85, 2.45] },
            { k: 'fn', f: 'log(1+x)', a: -0.2, b: 2.8, c: 'y', label: 'y=log(1+x)', lat: [1.45, 1.42] },
            { k: 'fn', f: 'x-x**2/2', a: -0.25, b: 2.8, c: 'g', label: 'y=x−x²/2', lat: [1.05, 0.25] }] }] },
      { ask: { type: 'choice', q: "$g'(x)=\\dfrac{1}{1+x}-1+x$ を通分すると？",
        opts: ['$\\dfrac{x}{1+x}$', '$\\dfrac{x^2}{1+x}$', '$-\\dfrac{x^2}{1+x}$', '$\\dfrac{x^2+2x}{1+x}$'], ok: 1,
        why: { 0: 'それは $h\'(x)$。分子は $1-(1+x)+x(1+x)=x^2$ です。', 2: '分子は $1+(x-1)(1+x)=1+x^2-1=x^2$。符号は正です。', 3: '$x(1+x)=x+x^2$ から、$-(1+x)$ の $-x$ を引き忘れています。' },
        good: '分子は $1-(1+x)+x(1+x)=x^2$。$x>0$ で $g\'(x)>0$ です。',
        add: [{ t: 'm', tex: "g'(x)=\\frac{1-(1+x)+x(1+x)}{1+x}=\\frac{x^2}{1+x}>0" }] } },
      { say: '$g(0)=0$ で増加なので、$x>0$ で $g(x)>0$。右の図のように、$\\log(1+x)$ のグラフは2つのグラフの間にあります。',
        add: [{ t: 'ans', label: '(1)', text: '$x>0$ で $h(x)>0,\\ g(x)>0$ より\n$x-\\dfrac{x^2}{2}<\\log(1+x)<x$' }],
        draw: [{ fig: 'f2', items: [{ k: 'area', f: 'x', g: 'x-x**2/2', a: 0, b: 2.6, c: 'y', alpha: 0.13 }] }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\frac1k$ を「幅 1・高さ $\\frac1k$ の長方形の面積」と見て、曲線 $y=\\frac1x$ の下の面積と比べます。',
        add: [{ t: 'h', text: '(2)　和を面積で比べる' },
          { t: 'fig', id: 'f3', col: 1, view: [-0.3, -0.3, 6.6, 1.45], w: 540, h: 330, items: [
            { k: 'axes', tx: [1, 2, 3, 4, 5, 6], ty: [[1, '1'], [0.5, '1/2']] },
            { k: 'fn', f: '1/x', a: 0.7, b: 6.4, c: 'y', label: 'y=1/x', lat: [0.95, 1.3] }] }] },
      { ask: { type: 'choice', q: '$k\\ge2$ のとき、$\\dfrac1k$ より **大きい** と言える積分は？',
        opts: ['$\\displaystyle\\int_{k}^{k+1}\\frac{dx}{x}$', '$\\displaystyle\\int_{k-1}^{k}\\frac{dx}{x}$', '$\\displaystyle\\int_{0}^{k}\\frac{dx}{x}$', '$\\displaystyle\\int_{k}^{2k}\\frac{dx}{x}$'], ok: 1,
        why: { 0: '$k\\le x\\le k+1$ では $\\frac1x\\le\\frac1k$。こちらは $\\frac1k$ より小さくなります。', 2: '$x=0$ の近くで $\\frac1x$ は限りなく大きく、この積分は定まりません。', 3: '$\\int_k^{2k}\\frac{dx}{x}=\\log2$ で、$k$ によりません。和をとると比べにくくなります。' },
        good: '$k-1\\le x\\le k$ では $\\frac1x\\ge\\frac1k$（等号は $x=k$ だけ）。長方形は曲線の下におさまります。',
        add: [{ t: 'm', tex: '\\frac1k<\\int_{k-1}^{k}\\frac{dx}{x}\\quad(k\\ge2)' }],
        draw: [{ fig: 'f3', items: [2, 3, 4, 5, 6].map(k => ({ k: 'poly', pts: [[k - 1, 0], [k - 1, 1 / k], [k, 1 / k], [k, 0]], close: true, fill: 'b', alpha: 0.3, c: 'b', wd: 2 }))
          .concat([{ k: 'label', at: [1.5, 0.25], text: '1/2', c: 'b', size: 18 }, { k: 'label', at: [2.5, 0.17], text: '1/3', c: 'b', size: 18 }]) }] } },
      { say: '$k=2,\\ 3,\\ \\dots,\\ n$ で足すと、右辺の積分はつながって $\\int_1^n\\frac{dx}{x}=\\log n$。両辺に $\\frac11=1$ を足せば完成です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sum_{k=2}^{n}\\frac1k<\\int_1^n\\frac{dx}{x}=\\Big[\\log x\\Big]_1^n=\\log n' },
          { t: 'ans', label: '(2)', tex: '\\sum_{k=1}^{n}\\frac1k<1+\\log n\\quad(n\\ge2)' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$a_n>0$ なので対数がとれます。$n$ 乗根の対数は $\\frac1n$ 倍、積の対数は和、べき $k$ は前に出ます。',
        add: [{ t: 'h', text: '(3)　対数をとって和にする' }] },
      { ask: { type: 'choice', q: '$\\log a_n$ を和で表すと？（$\\sum$ は $k=1$ から $n$ まで）',
        opts: ['$\\sum k\\log\\left(1+\\frac2k\\right)$', '$\\frac1n\\sum\\log\\left(1+\\frac2k\\right)$', '$n\\sum k\\log\\left(1+\\frac2k\\right)$', '$\\frac1n\\sum k\\log\\left(1+\\frac2k\\right)$'], ok: 3,
        why: { 0: '全体の $\\frac1n$ 乗が抜けています。', 1: '各かっこの $k$ 乗の $k$ を前に出し忘れています。', 2: '$\\{\\ \\}^{\\frac1n}$ の対数は $\\frac1n$ 倍。$n$ 倍ではありません。' },
        good: '全体は $\\frac1n$ 倍で、各項は $k\\log\\left(1+\\frac2k\\right)$。この各項を (1) ではさみます。',
        add: [{ t: 'm', tex: '\\log a_n=\\frac1n\\sum_{k=1}^{n}k\\log\\Big(1+\\frac2k\\Big)' }] } },
      { say: '(1) で $x=\\frac2k\\ (>0)$ とします。$\\frac{x^2}{2}=\\frac{2}{k^2}$ なので、$\\frac2k-\\frac{2}{k^2}<\\log\\Big(1+\\frac2k\\Big)<\\frac2k$。これを $k$ 倍します。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac2k-\\frac{2}{k^2}<\\log\\Big(1+\\frac2k\\Big)<\\frac2k', note: '(1) で $x=\\frac2k$' }] },
      { ask: { type: 'choice', q: '$k$ 倍すると、$k\\log\\Big(1+\\dfrac2k\\Big)$ の左側（下からの評価）は？',
        opts: ['$2-\\dfrac2k$', '$2-\\dfrac1k$', '$2-\\dfrac{2}{k^2}$', '$\\dfrac2k-\\dfrac{2}{k^2}$'], ok: 0,
        why: { 1: '$\\frac{x^2}{2}=\\frac{1}{2}\\cdot\\frac{4}{k^2}=\\frac{2}{k^2}$。$k$ 倍すると $\\frac2k$ です。', 2: '$-\\frac{2}{k^2}$ にも $k$ をかけます。', 3: 'それは $k$ 倍する前の式です。' },
        good: '$2-\\dfrac2k<k\\log\\Big(1+\\dfrac2k\\Big)<2$。$k=1,\\ 2,\\ \\dots,\\ n$ で足して $n$ で割ります。',
        add: [{ t: 'm', tex: '2-\\frac2k<k\\log\\Big(1+\\frac2k\\Big)<2' },
          { t: 'm', size: 'sm', tex: '2-\\frac2n\\sum_{k=1}^{n}\\frac1k<\\log a_n<2', note: '足して $n$ で割る' }] } },
      { clear: true, say: '左はしの $\\frac2n\\sum\\frac1k$ が 0 に近づけば、はさみうちで $\\log a_n\\to2$。ここで (2) を使います。',
        add: [{ t: 'h', text: '(3)　つづき：はさみうち' },
          { t: 'm', size: 'sm', tex: '2-\\frac2n\\sum_{k=1}^{n}\\frac1k<\\log a_n<2' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}\\frac2n\\sum_{k=1}^{n}\\frac1k$ は？',
        opts: ['$\\infty$（調和級数は発散するから）', '$2$', '$0$', '$\\log2$'], ok: 2,
        why: { 0: '和は発散しますが、$1+\\log n$ より小さいので、$n$ で割ると 0 に近づきます。', 1: '各項 $\\frac1k$ は 0 に近づくので、その平均も 0 に近づきます。', 3: '$\\log2$ になる理由はありません。(2) の評価で 0 です。' },
        good: '(2) より $0<\\frac2n\\sum\\frac1k<\\frac{2(1+\\log n)}{n}=\\frac2n+2\\cdot\\frac{\\log n}{n}\\to0$。',
        add: [{ t: 'm', size: 'sm', tex: '0<\\frac2n\\sum_{k=1}^{n}\\frac1k<\\frac2n+2\\cdot\\frac{\\log n}{n}\\ \\longrightarrow\\ 0', note: '(2) と $\\frac{\\log n}{n}\\to0$' }] } },
      { say: 'はさみうちの原理より $\\log a_n\\to2$。$e^x$ は連続なので $a_n=e^{\\log a_n}\\to e^2$。表の値 7.29… が 7.389… に近づいていく様子と合います。',
        add: [{ t: 'm', tex: '\\lim_{n\\to\\infty}\\log a_n=2' },
          { t: 'ans', label: '(3) 答', tex: '\\lim_{n\\to\\infty}a_n=e^2' },
          { t: 'tbl', col: 1, size: 'sm', cls: 'rowh', rows: [['$n$', '$a_n$'], ['10', '5.06…'], ['100', '6.81…'], ['1000', '7.29…'], ['$\\infty$', '$e^2=7.389…$']] }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '別の見方です。$\\log a_n$ は、$k\\log(1+\\frac2k)$ の **平均**。各項が 2 に近づくので平均も 2 に近づく、というのが極限の正体です。',
        add: [{ t: 'h', text: '別の見方：平均が近づく値' },
          { t: 'm', size: 'sm', tex: '\\log a_n=\\frac{1}{n}\\Big\\{1\\cdot\\log3+2\\log2+\\cdots+n\\log\\Big(1+\\frac2n\\Big)\\Big\\}' },
          { t: 'p', size: 'sm', text: '各項 $k\\log\\left(1+\\frac2k\\right)\\to2$ → 平均も 2 へ\n答案では「平均」ではなく、はさみうちで示す' }] },
      { ask: { type: 'think', q: '(1) の左側のかわりに、$\\log(1+x)>\\dfrac{x}{1+x}\\ (x>0)$ を使っても (3) は解ける？',
        hint: '$x=\\frac2k$ を入れて $k$ 倍すると $\\frac{2k}{k+2}=2-\\frac{4}{k+2}$。',
        ans: '解ける。$k\\log(1+\\frac2k)>2-\\frac{4}{k+2}>2-\\frac4k$ なので、$2-\\frac4n\\sum\\frac1k<\\log a_n<2$ となり、同じはさみうちで $e^2$。',
        after: '下からの評価は「誤差が $\\frac{c}{k}$ くらい」なら十分。あとは (2) が誤差の和を $\\log n$ でおさえてくれます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。不等式の証明 → 面積での評価 → 対数とはさみうち。数学Ⅲの極限の、王道の組み立てです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
