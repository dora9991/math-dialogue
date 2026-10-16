/* 数学Ⅲ 第3章 積分法 不定積分 ①：不定積分の基本公式
   例・数値はすべて自作。答え・誤答は python3（sympy）で「微分してもとにもどるか」を検算ずみ。
   ∫√x dx=(2/3)x√x+C、∫x⁻³dx=−1/(2x²)+C、∫3ˣdx=3ˣ/log3+C、∫(2cosx−5sinx)dx=2sinx+5cosx+C、
   ∫(x+1)²/x dx=x²/2+2x+log|x|+C、∫(x−1)/√x dx=(2/3)x√x−2√x+C、考えてみよう ∫tan²x dx=tanx−x+C */
(function () {
  const POINTS = [
    '$\\displaystyle\\int x^\\alpha\\,dx=\\frac{x^{\\alpha+1}}{\\alpha+1}+C$（$\\alpha\\neq-1$）。$\\sqrt x$ や $\\dfrac1{x^3}$ は、$x^\\alpha$ の形に直してから使う',
    '$\\alpha=-1$ のときは　$\\displaystyle\\int\\frac1x\\,dx=\\log|x|+C$。$\\displaystyle\\int e^x\\,dx=e^x+C$、$\\displaystyle\\int a^x\\,dx=\\frac{a^x}{\\log a}+C$',
    '$\\displaystyle\\int\\sin x\\,dx=-\\cos x+C$、$\\displaystyle\\int\\cos x\\,dx=\\sin x+C$、$\\displaystyle\\int\\frac{dx}{\\cos^2x}=\\tan x+C$。どれも微分の公式を **逆に読む**'
  ];

  HB.lesson({
    id: 'm3c-01', field: '数学Ⅲ　積分法', title: '不定積分の基本公式', level: '不定積分', time: '目安 7分',
    noDec: true,   // 指数の分数（x の 1/2 乗など）の横に小数が出ると読みにくいので使わない
    problem: { label: '例題', lead: 'この時間の例題（不定積分を求めよ）',
      parts: ['(1)　$\\displaystyle\\int\\frac{1}{x^3}\\,dx$', '(2)　$\\displaystyle\\int3^x\\,dx$', '(3)　$\\displaystyle\\int(2\\cos x-5\\sin x)\\,dx$',
        '(4)　$\\displaystyle\\int\\frac{x-1}{\\sqrt x}\\,dx$', '(5)　$\\displaystyle\\int\\tan^2x\\,dx$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の章では、$e^x$・$\\log x$・三角関数などの **微分** を学びました。この章は **積分法** です。まず、微分の公式を逆に読んで、不定積分の公式をそろえます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$x^\\alpha$・$\\dfrac1x$・$e^x$・三角関数の不定積分の公式を、微分の公式から導ける\n公式を組み合わせて、不定積分を計算できる' }] },

      // ---------- 不定積分の復習 ----------
      { clear: true, part: '不定積分', say: '数学Ⅱで学んだように、$F\'(x)=f(x)$ のとき $\\displaystyle\\int f(x)\\,dx=F(x)+C$ です。右の表は前の章の微分の公式。**右から左へ** 読むと積分になります。',
        add: [{ t: 'h', text: '不定積分（数学Ⅱの復習）' },
          { t: 'box', c: 'b', label: '定義', text: "$F'(x)=f(x)$ のとき\n$\\displaystyle\\int f(x)\\,dx=F(x)+C$　（$C$ は積分定数）" },
          { t: 'p', size: 'sm', text: 'この時間は、$C$ はすべて積分定数とします。' },
          { t: 'tbl', col: 1, cls: 'rowh', rows: [['$F(x)$', '微分 →', "$F'(x)$"], ['$x^{\\alpha+1}$', '→', '$(\\alpha+1)x^\\alpha$'], ['$\\log|x|$', '→', '$\\dfrac1x$'], ['$e^x$', '→', '$e^x$'],
            ['$\\sin x$', '→', '$\\cos x$'], ['$\\cos x$', '→', '$-\\sin x$'], ['$\\tan x$', '→', '$\\dfrac{1}{\\cos^2x}$']] },
          { t: 'p', col: 1, size: 'sm', text: '← の向きに読むのが **積分**' }] },

      // ---------- x^α ----------
      { clear: true, part: 'xᵅ の積分', say: '$(x^{\\alpha+1})\'=(\\alpha+1)x^\\alpha$ の両辺を $\\alpha+1$ で割ると、$x^\\alpha$ の不定積分が出ます。$\\alpha$ は整数でなく、$\\dfrac12$ などでも使えます。',
        add: [{ t: 'h', text: 'x の α 乗の不定積分' },
          { t: 'm', tex: "\\left(\\frac{x^{\\alpha+1}}{\\alpha+1}\\right)'=\\frac{(\\alpha+1)x^\\alpha}{\\alpha+1}=x^\\alpha" },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle\\int x^\\alpha\\,dx=\\frac{x^{\\alpha+1}}{\\alpha+1}+C$　（$\\alpha\\neq-1$）' }] },
      { say: '$\\sqrt x$ は $x^{\\frac12}$ と直してから使います。$\\alpha+1=\\dfrac32$ で割る、つまり $\\dfrac23$ をかけます。',
        add: [{ t: 'm', tex: '\\int\\sqrt x\\,dx=\\int x^{\\frac12}\\,dx=\\frac{x^{\\frac32}}{\\frac32}+C=\\frac23x\\sqrt x+C', note: '$x^{\\frac32}=x\\sqrt x$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\frac{1}{x^3}\\,dx$ は？',
        opts: ['$-\\dfrac{1}{4x^4}+C$', '$\\dfrac{1}{2x^2}+C$', '$-\\dfrac{1}{2x^2}+C$', '$\\log|x^3|+C$'], ok: 2,
        why: { 0: '指数を 1 へらすのは微分のとき。積分では $-3+1=-2$ と、1 ふやします。', 1: '$x^{-2}$ を $-2$ で割るので、マイナスがつきます。', 3: '$\\log$ になるのは $\\dfrac1x$（$\\alpha=-1$）のときだけ。$\\dfrac1{x^3}$ は $x^{-3}$ です。' },
        good: '$x^{-3}$ と見て　$\\dfrac{x^{-2}}{-2}+C=-\\dfrac{1}{2x^2}+C$。',
        add: [{ t: 'm', tex: '\\int x^{-3}\\,dx=\\frac{x^{-2}}{-2}+C=\\ans{-\\frac{1}{2x^2}+C}' }] } },

      // ---------- 1/x ----------
      { clear: true, part: '1/x の積分', say: '$\\alpha=-1$ のときは、公式の分母が 0 になって使えません。かわりに、前の章で学んだ $(\\log|x|)\'=\\dfrac1x$ を逆に読みます。',
        add: [{ t: 'h', text: 'α = −1 のとき' },
          { t: 'm', tex: "(\\log|x|)'=\\frac1x" },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle\\int\\frac1x\\,dx=\\log|x|+C$' },
          { t: 'fig', id: 'lg', col: 1, view: [-3.4, -2.6, 3.4, 1.9], w: 560, h: 371, items: [
            { k: 'axes', tx: [-2, -1, 1, 2], ty: [1, -1] },
            { k: 'fn', f: 'log(x)', a: 0.02, b: 3.3, label: 'y=log x', lat: [1.75, 1.3] },
            { k: 'fn', f: 'log(-x)', a: -3.3, b: -0.02, c: 'p', label: 'y=log(−x)', lat: [-1.6, 1.3], la: 'end' }] }] },
      { say: '$x<0$ のときは $\\{\\log(-x)\\}\'=\\dfrac{-1}{-x}=\\dfrac1x$。絶対値をつけておけば、$x>0$ でも $x<0$ でも使えます。',
        add: [{ t: 'm', tex: "x<0\\ \\text{のとき}\\quad\\{\\log(-x)\\}'=\\frac{-1}{-x}=\\frac1x", note: '合成関数の微分' },
          { t: 'p', size: 'sm', text: '→ 2つのグラフをまとめたものが $y=\\log|x|$' }] },

      // ---------- 指数関数 ----------
      { clear: true, cols: [1], part: '指数関数', say: '$(e^x)\'=e^x$ なので、$e^x$ は積分しても $e^x$。$a^x$ は $(a^x)\'=a^x\\log a$ なので、$\\log a$ で割ります。',
        add: [{ t: 'h', text: '指数関数の不定積分' },
          { t: 'm', tex: "(e^x)'=e^x,\\qquad (a^x)'=a^x\\log a", note: '前の章' },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle\\int e^x\\,dx=e^x+C$　　　$\\displaystyle\\int a^x\\,dx=\\frac{a^x}{\\log a}+C$　（$a>0,\\ a\\neq1$）' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int3^x\\,dx$ は？',
        opts: ['$3^x\\log3+C$', '$\\dfrac{3^{x+1}}{x+1}+C$', '$3^x+C$', '$\\dfrac{3^x}{\\log3}+C$'], ok: 3,
        why: { 0: 'それは $3^x$ を **微分** したもの。積分では $\\log3$ で割ります。', 1: '$x^\\alpha$ の公式は「底が $x$、指数が数」のとき。$3^x$ は指数が $x$ です。', 2: '積分しても形が変わらないのは $e^x$ だけ。$3^x$ は $\\log3$ で割ります。' },
        good: '微分すると $\\dfrac{3^x\\log3}{\\log3}=3^x$。もとにもどります。',
        add: [{ t: 'm', tex: '\\int3^x\\,dx=\\ans{\\frac{3^x}{\\log3}+C}', note: '微分して確かめる\n$\\left(\\dfrac{3^x}{\\log3}\\right)\'=3^x$' }] } },

      // ---------- 三角関数 ----------
      { clear: true, cols: [1], part: '三角関数', say: '三角関数も、微分の公式を逆に読みます。$(\\cos x)\'=-\\sin x$ なので、$\\sin x$ の不定積分には **マイナス** がつきます。',
        add: [{ t: 'h', text: '三角関数の不定積分' },
          { t: 'm', tex: "(\\sin x)'=\\cos x,\\qquad (\\cos x)'=-\\sin x,\\qquad (\\tan x)'=\\frac{1}{\\cos^2x}", note: '前の章' },
          { t: 'box', c: 'y', label: '公式', text: '$\\displaystyle\\int\\sin x\\,dx=-\\cos x+C$　　$\\displaystyle\\int\\cos x\\,dx=\\sin x+C$　　$\\displaystyle\\int\\frac{1}{\\cos^2x}\\,dx=\\tan x+C$' }] },
      { say: '数学Ⅱと同じように、定数倍は前に出し、和・差は項ごとに積分できます。',
        add: [{ t: 'box', c: 'b', label: '性質', text: '$\\displaystyle\\int kf(x)\\,dx=k\\int f(x)\\,dx$　（$k$ は定数）　　$\\displaystyle\\int\\{f(x)\\pm g(x)\\}\\,dx=\\int f(x)\\,dx\\pm\\int g(x)\\,dx$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int(2\\cos x-5\\sin x)\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$2\\sin x+5\\cos x$', '$2\\sin x-5\\cos x$', '$-2\\sin x+5\\cos x$', '$-2\\sin x-5\\cos x$'], ok: 0,
        why: { 1: '$\\int\\sin x\\,dx=-\\cos x$ なので、$-5\\sin x$ の積分は $+5\\cos x$ です。', 2: '$\\cos x$ の積分は $+\\sin x$。微分の $-\\sin x$ と取りちがえています。', 3: '両方の符号が逆です。$\\int\\cos x\\,dx=\\sin x$、$\\int\\sin x\\,dx=-\\cos x$。' },
        good: '$2\\sin x-5(-\\cos x)+C=2\\sin x+5\\cos x+C$。',
        add: [{ t: 'm', tex: '\\int(2\\cos x-5\\sin x)\\,dx=2\\sin x-5(-\\cos x)+C=\\ans{2\\sin x+5\\cos x+C}' }] } },

      // ---------- 変形してから ----------
      { clear: true, cols: [1], part: '変形してから積分', say: 'そのままでは公式が使えない式は、**形を変えてから** 積分します。$\\dfrac{(x+1)^2}{x}$ は、分子を展開して $x$ で割ると、項ごとに公式が使えます。',
        add: [{ t: 'h', text: '式を変形してから積分する' },
          { t: 'm', tex: '\\int\\frac{(x+1)^2}{x}\\,dx=\\int\\Big(x+2+\\frac1x\\Big)\\,dx=\\frac{x^2}{2}+2x+\\log|x|+C', note: '$\\dfrac{x^2+2x+1}{x}$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\frac{x-1}{\\sqrt x}\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$\\dfrac32x\\sqrt x-\\dfrac12\\sqrt x$', '$\\dfrac23x\\sqrt x-2\\sqrt x$', '$\\dfrac{\\frac12x^2-x}{\\frac23x\\sqrt x}$', '$\\dfrac23x\\sqrt x+2\\sqrt x$'], ok: 1,
        why: { 0: '$\\alpha+1$ で **割る** ところを、かけています。$x^{\\frac12}$ なら $\\dfrac32$ で割ります。', 2: '分子と分母を別々に積分してはいけません。先に $x^\\alpha$ の和に直します。', 3: '$-x^{-\\frac12}$ の積分は $-2\\sqrt x$。符号が逆です。' },
        good: '$x^{\\frac12}-x^{-\\frac12}$ に直して　$\\dfrac23x^{\\frac32}-2x^{\\frac12}+C$。',
        add: [{ t: 'm', tex: '\\int\\big(x^{\\frac12}-x^{-\\frac12}\\big)\\,dx=\\ans{\\frac23x\\sqrt x-2\\sqrt x+C}', note: '$\\dfrac{x}{\\sqrt x}=x^{\\frac12}$' }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\int\\tan^2x\\,dx$ を求めよう。',
        hint: '数学Ⅰで学んだ $1+\\tan^2x=\\dfrac{1}{\\cos^2x}$ から、$\\tan^2x=\\dfrac{1}{\\cos^2x}-1$ と直す。',
        ans: '$\\displaystyle\\int\\Big(\\frac{1}{\\cos^2x}-1\\Big)\\,dx=\\tan x-x+C$',
        after: '答えを微分すると $\\dfrac{1}{\\cos^2x}-1=\\tan^2x$。不定積分は、いつでも **微分して検算** できます。',
        add: [{ t: 'm', tex: '\\int\\tan^2x\\,dx=\\int\\Big(\\frac{1}{\\cos^2x}-1\\Big)\\,dx=\\ans{\\tan x-x+C}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、合成関数の微分を逆に読む **置換積分法** に進みます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
