/* 東大型 数学（理系）：2024年度 東京大学 前期 理系 第2問の類題（自作問題・元の問題ではない）
   問題：tan α = 4/3（0<α<π/2）、0 ≤ a ≤ 4/3 で f(a) = ∫₀^α |tan x − a| / cos x dx
   答え（python3・sympy と数値積分で検算ずみ）：
     (1) d/dθ log((1+sinθ)/cosθ) = 1/cosθ、θ=0 で 0 → 成り立つ。とくに ∫₀^α dx/cos x = log 3
     (2) f(a) = 2a log(a+√(a²+1)) − a log 3 − 2√(a²+1) + 8/3
     (3) f'(a) = 2 log(a+√(a²+1)) − log 3 → a = 1/√3（= tan(π/6)）で最小値 (8−4√3)/3 ≒ 0.357
         f(0) = 2/3、f(4/3) = (4 log 3 − 2)/3 ≒ 0.798。差 = 4(log 3 − 1)/3 > 0 → 最大値 (4 log 3 − 2)/3（a = 4/3） */
(function () {
  const AL = Math.atan(4 / 3);
  const F = '2*x*log(x+sqrt(x*x+1))-x*log(3)-2*sqrt(x*x+1)+8/3';
  const r3 = 1 / Math.sqrt(3), fmin = (8 - 4 * Math.sqrt(3)) / 3, fmax = (4 * Math.log(3) - 2) / 3;
  // y = tan x のグラフ（0 ≤ x ≤ α）と y = a
  const aS = 0.7, bS = Math.atan(aS);
  const tanFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.12, -0.25, 1.2, 1.62], w: 470, h: 430, items: [
    { k: 'axes', tx: [[AL, 'α']], ty: [[4 / 3, '4/3']], xl: 'x', yl: 'y' },
    { k: 'fn', f: 'tan(x)', a: 0, b: AL, c: 'w', label: 'y = tan x', lat: [0.42, 1.2] },
    { k: 'seg', a: [AL, 0], b: [AL, 4 / 3], c: 'd', dash: true }, { k: 'seg', a: [0, 4 / 3], b: [AL, 4 / 3], c: 'd', dash: true }].concat(items || []) });
  // y = f(a) のグラフ
  const fFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.15, -0.16, 1.55, 1.0], w: 520, h: 400, items: [
    { k: 'axes', tx: [[r3, '1/√3'], [4 / 3, '4/3']], ty: [[2 / 3, '2/3']], xl: 'a', yl: 'y' },
    { k: 'fn', f: F, a: 0, b: 4 / 3, c: 'w', label: 'y = f(a)', lat: [0.15, 0.9] }].concat(items || []) });

  const POINTS = [
    '$|\\tan x-a|$ は $\\tan x=a$ の所で分ける。その角 $\\beta$ は有名角でなくてよい。**$\\tan\\beta=a$ から $\\cos\\beta,\\ \\sin\\beta$ を $a$ で表して** 消す',
    '$\\displaystyle\\int\\frac{dx}{\\cos x}=\\log\\frac{1+\\sin x}{\\cos x}$、$\\displaystyle\\int\\frac{\\tan x}{\\cos x}dx=\\frac1{\\cos x}$。「示せ」は右辺を微分するのが早い',
    '端の値の大小は、差をとって $\\log3>1$（$e<3$）のような数の評価に持ちこむ。近似値はそこで使う'
  ];

  HB.lesson({
    id: 'ut24-2', field: '東大型　数学（理系）', title: '2024 東大 理系 第2問の類題 ― 絶対値つきの定積分で決まる関数の最大・最小', level: '2024年度 東京大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$\\alpha$ を $0<\\alpha<\\dfrac{\\pi}{2}$，$\\tan\\alpha=\\dfrac43$ をみたす実数とする。$0\\le a\\le\\dfrac43$ をみたす実数 $a$ に対して\n$\\displaystyle f(a)=\\int_0^{\\alpha}\\frac{|\\tan x-a|}{\\cos x}\\,dx$\nとおく。',
      parts: [
        '(1)　$0\\le\\theta<\\dfrac{\\pi}{2}$ のとき、$\\displaystyle\\int_0^{\\theta}\\frac{dx}{\\cos x}=\\log\\frac{1+\\sin\\theta}{\\cos\\theta}$ であることを示せ。',
        '(2)　$f(a)$ を $a$ の式で表せ。',
        '(3)　$f(a)$ の最大値と最小値を求めよ。ただし、必要ならば $\\log3=1.0986\\cdots$ を用いてよい。'
      ],
      src: '※ 2024年度 東京大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '絶対値をふくむ定積分で決まる関数の、最大・最小の問題です。(1)(2)(3) と誘導があります。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず $\\alpha$ について。$\\tan\\alpha=\\frac43$ から、$\\cos\\alpha=\\frac35$、$\\sin\\alpha=\\frac45$。α は有名な角ではないので、**tan の値のまま** 扱います。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'm', tex: '\\tan\\alpha=\\frac43\\ \\Longrightarrow\\ \\cos\\alpha=\\frac35,\\ \\ \\sin\\alpha=\\frac45' },
          { t: 'p', size: 'xs', text: '（$1+\\tan^2\\alpha=\\dfrac{1}{\\cos^2\\alpha}$ と $\\cos\\alpha>0$ から）' },
          tanFig('t1')] },
      { ask: { type: 'choice', q: '被積分関数の $|\\tan x-a|$ の中身の符号が変わる $x$ は？（$0\\le x\\le\\alpha$）',
        opts: ['$x=a$', '$x=\\dfrac{\\alpha}{2}$', '$\\tan x=a$ となる $x$', '符号は変わらない'], ok: 2,
        why: { 0: '$a$ は tan の「値」です。角 $x$ と比べるのではありません。', 1: '真ん中で分けるのは、$a$ と関係がありません。', 3: '$0\\le a\\le\\frac43$ なので、$\\tan x-a$ は区間の中で負から正に変わります。' },
        good: '$\\tan x$ は増加なので、$\\tan\\beta=a$ となる $\\beta$ がただ1つあり、そこで符号が変わります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '分ける所', text: '$\\tan\\beta=a$，$0\\le\\beta\\le\\alpha$ となる $\\beta$\n$0\\le x\\le\\beta$ で $\\tan x\\le a$、$\\beta\\le x\\le\\alpha$ で $\\tan x\\ge a$' }],
        draw: [{ fig: 't1', items: [{ k: 'line', m: 0, n: aS, a: -0.05, b: 1.12, c: 'p', label: 'y = a', lat: [1.0, aS + 0.09] },
          { k: 'seg', a: [bS, 0], b: [bS, aS], c: 'p', dash: true }, { k: 'pt', at: [bS, 0], name: 'β', dir: 's', c: 'p' }] }] } },
      { say: '方針です。$\\beta$ も有名な角ではありません。(2) では、$\\tan\\beta=a$ を使って $\\sin\\beta,\\ \\cos\\beta$ を $a$ で表し、$\\beta$ を消します。これが「tan の値を経由する」ということです。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) は (2) の部品（$\\frac1{\\cos x}$ の積分）\n(2) $\\beta$ で分けて積分 → $\\tan\\beta=a$ で $\\beta$ を消す\n(3) $f\'(a)$ の符号 → 増減表 → 端の値と比べる' }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.62, 0.38], part: '(1)', say: '(1) は「示せ」なので、答えの式がもうわかっています。右辺を $\\theta$ で微分して $\\frac1{\\cos\\theta}$ になり、$\\theta=0$ で両辺が 0 になることを示せば十分です。',
        add: [{ t: 'h', text: '(1)　∫ dx / cos x' },
          { t: 'm', tex: 'L(\\theta)=\\log\\frac{1+\\sin\\theta}{\\cos\\theta}=\\log(1+\\sin\\theta)-\\log\\cos\\theta' }] },
      { say: '微分して通分します。分子は $\\cos^2\\theta+\\sin\\theta(1+\\sin\\theta)=1+\\sin\\theta$ となり、約分できます。',
        add: [{ t: 'm', size: 'sm', tex: "\\begin{aligned}L'(\\theta)&=\\frac{\\cos\\theta}{1+\\sin\\theta}+\\frac{\\sin\\theta}{\\cos\\theta}=\\frac{\\cos^2\\theta+\\sin\\theta+\\sin^2\\theta}{(1+\\sin\\theta)\\cos\\theta}\\\\&=\\frac{1+\\sin\\theta}{(1+\\sin\\theta)\\cos\\theta}=\\frac1{\\cos\\theta}\\end{aligned}" },
          { t: 'm', size: 'sm', tex: 'L(0)=\\log1=0\\quad\\therefore\\ \\int_0^{\\theta}\\frac{dx}{\\cos x}=L(\\theta)-L(0)=L(\\theta)' }] },
      { say: '(1) が示せました。とくに $\\theta=\\alpha$ では $\\dfrac{1+\\frac45}{\\frac35}=3$ なので、$L(\\alpha)=\\log3$。問題文の $\\log3$ はここから出てきます。',
        add: [{ t: 'ans', label: '(1)', tex: '\\int_0^{\\theta}\\frac{dx}{\\cos x}=\\log\\frac{1+\\sin\\theta}{\\cos\\theta}\\quad(\\text{証明終})' },
          { t: 'box', col: 1, c: 'g', size: 'sm', label: 'メモ', text: '$L(\\alpha)=\\log3$。見つけ方は $\\dfrac{\\cos x}{1-\\sin^2x}$ と変形して $s=\\sin x$ と置換' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.66, 0.34], part: '(2)', say: '(2) です。$\\beta$ で区間を分けて、絶対値をはずします。前半は $a-\\tan x$、後半は $\\tan x-a$ です。',
        add: [{ t: 'h', text: '(2)　f(a) を a の式で' },
          { t: 'm', size: 'sm', tex: 'f(a)=\\int_0^{\\beta}\\frac{a-\\tan x}{\\cos x}dx+\\int_{\\beta}^{\\alpha}\\frac{\\tan x-a}{\\cos x}dx' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\frac{\\tan x}{\\cos x}\\,dx$ は？（$C$ は積分定数）',
        opts: ['$-\\dfrac{1}{\\cos x}+C$', '$\\dfrac{1}{\\cos x}+C$', '$-\\log\\cos x+C$', '$\\dfrac{\\tan^2x}{2}+C$'], ok: 1,
        why: { 0: '$\\left(\\frac1{\\cos x}\\right)\'=\\frac{\\sin x}{\\cos^2x}$ で、マイナスはつきません。', 2: 'それは $\\int\\tan x\\,dx$。$\\frac1{\\cos x}$ がもう1つかかっています。', 3: '$\\left(\\frac{\\tan^2x}{2}\\right)\'=\\frac{\\tan x}{\\cos^2x}$ で、ちがいます。' },
        good: '$\\dfrac{\\tan x}{\\cos x}=\\dfrac{\\sin x}{\\cos^2x}=\\left(\\dfrac{1}{\\cos x}\\right)\'$ です。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '原始関数（$C$ は省略）' }, { t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}\\int\\frac{dx}{\\cos x}&=L(x)\\\\[4pt] \\int\\frac{\\tan x}{\\cos x}dx&=\\frac1{\\cos x}\\end{aligned}' }, { t: 'gap', col: 1, h: 16 }] } },
      { say: '計算すると、$L(\\beta)$ が2回、$\\frac1{\\cos\\beta}$ も2回出てきます。$L(\\alpha)=\\log3$、$\\frac1{\\cos\\alpha}=\\frac53$ も入れます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}f(a)&=aL(\\beta)-\\Big(\\frac1{\\cos\\beta}-1\\Big)+\\Big(\\frac53-\\frac1{\\cos\\beta}\\Big)-a\\big(\\log3-L(\\beta)\\big)\\\\&=2a\\,\\hy{L(\\beta)}-a\\log3-\\frac{2}{\\hy{\\cos\\beta}}+\\frac83\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\tan\\beta=a\\ \\left(0\\le\\beta<\\frac{\\pi}{2}\\right)$ のとき、$\\dfrac{1+\\sin\\beta}{\\cos\\beta}$ を $a$ で表すと？',
        opts: ['$1+a$', '$\\dfrac{1+a}{\\sqrt{a^2+1}}$', '$\\sqrt{a^2+1}-a$', '$a+\\sqrt{a^2+1}$'], ok: 3,
        why: { 0: '$\\frac{1}{\\cos\\beta}$ は 1 ではありません。$\\frac1{\\cos\\beta}=\\sqrt{1+\\tan^2\\beta}$。', 1: '分母の $\\cos\\beta$ で割り忘れています。', 2: '$\\frac{\\sin\\beta}{\\cos\\beta}=\\tan\\beta=a$ は足し算です。' },
        good: '$\\dfrac{1+\\sin\\beta}{\\cos\\beta}=\\dfrac{1}{\\cos\\beta}+\\tan\\beta$。$\\cos\\beta>0$ なので $\\dfrac1{\\cos\\beta}=\\sqrt{1+a^2}$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}\\frac1{\\cos\\beta}&=\\sqrt{a^2+1}\\\\ L(\\beta)&=\\log\\big(a+\\sqrt{a^2+1}\\big)\\end{aligned}' }] } },
      { say: '代入すると、$\\beta$ が消えて $a$ だけの式になります。(2) の答えです。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'f(a)=2a\\log\\big(a+\\sqrt{a^2+1}\\big)-a\\log3-2\\sqrt{a^2+1}+\\frac83' }] },
      { ask: { type: 'think', q: '検算：$a=0$ のとき、(2) の答えの値と、定義の積分 $\\displaystyle\\int_0^{\\alpha}\\frac{\\tan x}{\\cos x}dx$ を、それぞれ計算して比べよう。',
        hint: '積分は $\\left[\\dfrac1{\\cos x}\\right]_0^{\\alpha}$。$\\cos\\alpha=\\dfrac35$。',
        ans: '答えの式：$0-0-2+\\dfrac83=\\dfrac23$。積分：$\\dfrac53-1=\\dfrac23$。一致します。',
        after: '長い式を出したら、計算しやすい値で1つ確かめる。記述の試験ではとても大事な習慣です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$f(a)$ を $a$ で微分します。まず、よく出る $\\log\\big(a+\\sqrt{a^2+1}\\big)$ の微分を確認します。',
        add: [{ t: 'h', text: '(3)　最大値と最小値' }] },
      { ask: { type: 'choice', q: '$\\dfrac{d}{da}\\log\\big(a+\\sqrt{a^2+1}\\big)$ は？',
        opts: ['$\\dfrac{1}{\\sqrt{a^2+1}}$', '$\\dfrac{1}{a+\\sqrt{a^2+1}}$', '$\\dfrac{a}{\\sqrt{a^2+1}}$', '$\\sqrt{a^2+1}$'], ok: 0,
        why: { 1: '中身の微分 $1+\\frac{a}{\\sqrt{a^2+1}}$ をかけ忘れています。', 2: 'それは $\\sqrt{a^2+1}$ の微分です。', 3: '逆数になっています。' },
        good: '$\\dfrac{1+\\frac{a}{\\sqrt{a^2+1}}}{a+\\sqrt{a^2+1}}=\\dfrac{\\frac{\\sqrt{a^2+1}+a}{\\sqrt{a^2+1}}}{a+\\sqrt{a^2+1}}=\\dfrac1{\\sqrt{a^2+1}}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\big(\\log(a+\\sqrt{a^2+1})\\big)\'=\\frac1{\\sqrt{a^2+1}}' }] } },
      { say: '積の微分で出る $\\dfrac{2a}{\\sqrt{a^2+1}}$ と、$-2\\sqrt{a^2+1}$ の微分 $-\\dfrac{2a}{\\sqrt{a^2+1}}$ が打ち消し合い、とても簡単な形になります。',
        add: [{ t: 'm', size: 'sm', tex: "f'(a)=2\\log\\big(a+\\sqrt{a^2+1}\\big)+\\frac{2a}{\\sqrt{a^2+1}}-\\log3-\\frac{2a}{\\sqrt{a^2+1}}" },
          { t: 'm', tex: "f'(a)=2\\log\\big(a+\\sqrt{a^2+1}\\big)-\\log3", note: '← $a$ について増加' }] },
      { ask: { type: 'choice', q: "$f'(a)=0$ となる $a$ は？",
        opts: ['$\\dfrac43$', '$\\sqrt3-1$', '$\\dfrac{1}{\\sqrt3}$', '$\\dfrac{\\sqrt3}{2}$'], ok: 2,
        why: { 0: '$a+\\sqrt{a^2+1}=3$ を解いています。$2\\log(\\ )=\\log3$ なので、正しくは $=\\sqrt3$。', 1: '$\\sqrt{a^2+1}$ を 1 にしてしまっています。', 3: '$\\sin\\frac{\\pi}{3}$ の値です。$\\sqrt{a^2+1}=\\sqrt3-a$ を2乗して解きます。' },
        good: '$a+\\sqrt{a^2+1}=\\sqrt3$ より $a^2+1=3-2\\sqrt3a+a^2$、$a=\\dfrac1{\\sqrt3}$。つまり $\\beta=\\dfrac{\\pi}{6}$ です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$a$', '$0$', '$\\cdots$', '$\\frac{1}{\\sqrt3}$', '$\\cdots$', '$\\frac43$'], ["$f'(a)$", '', '$-$', '$0$', '$+$', ''], ['$f(a)$', '$\\frac23$', '$\\searrow$', '最小', '$\\nearrow$', '']] }] } },
      { ask: { type: 'think', q: '最小値 $f\\left(\\dfrac{1}{\\sqrt3}\\right)$ を計算しよう。',
        hint: '$a=\\frac1{\\sqrt3}$ では $\\log\\big(a+\\sqrt{a^2+1}\\big)=\\log\\sqrt3=\\frac12\\log3$、$\\sqrt{a^2+1}=\\frac{2}{\\sqrt3}$。',
        ans: '$\\dfrac{2}{\\sqrt3}\\cdot\\dfrac12\\log3-\\dfrac1{\\sqrt3}\\log3-\\dfrac{4}{\\sqrt3}+\\dfrac83=\\dfrac{8-4\\sqrt3}{3}$',
        after: 'log の項がちょうど消えます。値は約 0.357 です。',
        add: [{ t: 'm', size: 'sm', tex: 'f\\Big(\\frac1{\\sqrt3}\\Big)=\\frac{8-4\\sqrt3}{3}', note: '最小値' }] } },

      // ---------- (3) 最大 ----------
      { clear: true, cols: [0.5, 0.5], say: '最大値は、両はし $a=0$、$a=\\frac43$ のどちらか。$f(0)=\\frac23$、$f\\left(\\frac43\\right)=\\frac{4\\log3-2}{3}$ です。差をとって比べます。',
        add: [{ t: 'h', text: '(3)　つづき：最大値' },
          { t: 'm', size: 'sm', tex: 'f(0)=\\frac23,\\qquad f\\Big(\\frac43\\Big)=\\frac{4\\log3-2}{3}' },
          { t: 'm', size: 'sm', tex: 'f\\Big(\\frac43\\Big)-f(0)=\\frac{4(\\log3-1)}{3}' },
          fFig('g1', [{ k: 'pt', at: [r3, fmin], name: '最小', dir: 's', c: 'b', size: 21 }])] },
      { ask: { type: 'choice', q: '$f(0)$ と $f\\left(\\dfrac43\\right)$ の大小は？',
        opts: ['$f(0)$ のほうが大きい', '$f\\left(\\frac43\\right)$ のほうが大きい', '等しい', '近似値がないと決められない'], ok: 1,
        why: { 0: '$\\log3-1=0.0986\\cdots>0$ なので、差は正です。', 2: '$\\log3=1$ ではありません（$\\log e=1$）。', 3: '$\\log3>1$ は $3>e$ からもわかります。' },
        good: '$\\log3=1.0986\\cdots>1$（$3>e$ でもよい）なので、$f\\left(\\frac43\\right)>f(0)$。',
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [0, 2 / 3], c: 'w' }, { k: 'pt', at: [4 / 3, fmax], name: '最大', dir: 'n', c: 'y', size: 21 }] }] } },
      { say: '(3) の答えです。最小は $a=\\frac1{\\sqrt3}$、最大は右はしの $a=\\frac43$ です。',
        add: [{ t: 'ans', label: '(3) 答', text: '最大値 $\\dfrac{4\\log3-2}{3}$（$a=\\dfrac43$）\n最小値 $\\dfrac{8-4\\sqrt3}{3}$（$a=\\dfrac{1}{\\sqrt3}$）' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '最小になる $a$ には意味があります。$f(a)$ の式を使わずに直接微分すると、$f\'(a)$ は「$\\beta$ の左と右の、$\\frac1{\\cos x}$ の積分の差」になります。',
        add: [{ t: 'h', text: '別の見方：f\'(a) の意味' },
          { t: 'm', tex: "f'(a)=\\int_0^{\\beta}\\frac{dx}{\\cos x}-\\int_{\\beta}^{\\alpha}\\frac{dx}{\\cos x}=2L(\\beta)-L(\\alpha)" }] },
      { say: '$f\'(a)=0$ は、$\\frac1{\\cos x}$ の重みで区間を「ちょうど半分ずつ」に分ける所。$L(\\beta)=\\frac12\\log3$ から $\\beta=\\frac{\\pi}{6}$ が出ます。重みが 1 なら、区間のまん中が答えになります。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: 'まとめると', text: '$\\displaystyle\\int|g(x)-a|\\,w(x)\\,dx$ の最小 ⇔ 重み $w$ で $g(x)<a$ の側と $g(x)>a$ の側が半分ずつ（重みつきの中央値）' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(1) は微分と $\\theta=0$ の値の両方を書く\n・$\\cos\\beta>0$ を言ってから $\\frac1{\\cos\\beta}=\\sqrt{a^2+1}$\n・最大値は端の値を比べた根拠（$\\log3>1$）を書く' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。有名でない角は tan の値のまま持ち歩き、最後に sin・cos を tan で表して消す。これがこの問題の背骨でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
