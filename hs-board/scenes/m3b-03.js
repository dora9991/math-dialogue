/* 数学Ⅲ 第2章 微分法 ③：三角関数の導関数
   例はすべて自作。導関数・極限・誤答・図の座標は python3（sympy）で検算ずみ。
   図：y=sin x と y=cos x（0≦x≦2π）。x=0 の接線 y=x、x=π/2 の接線 y=1、x=π の接線 y=−x+π */
(function () {
  const PI = Math.PI;
  const POINTS = [
    "$(\\sin x)'=\\cos x$ は、加法定理と $\\displaystyle\\lim_{h\\to0}\\frac{\\sin h}{h}=1$ から導く（角は **弧度法**）",
    "$(\\cos x)'=-\\sin x$（**マイナス** に注意）、$(\\tan x)'=\\dfrac{1}{\\cos^2x}$（商の微分から）",
    '$\\sin4x$、$\\cos^2x=(\\cos x)^2$ のような形は、合成関数の微分で **中身の微分をかける**'
  ];
  const sinFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.8, -1.6, 7.0, 1.7], w: 600, h: 254, items: [
    { k: 'axes', tx: [[PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']], ty: [1, -1] },
    { k: 'fn', f: 'cos(x)', a: -0.6, b: 6.9, c: 'b', dash: true, label: 'y=cos x', lat: [6.85, 1.35], la: 'end' },
    { k: 'fn', f: 'sin(x)', a: -0.6, b: 6.9, c: 'y', label: 'y=sin x', lat: [2.6, 1.1] }].concat(items || []) });

  HB.lesson({
    id: 'm3b-03', field: '数学Ⅲ　微分法', title: '三角関数の導関数', level: '導関数', time: '目安 7分',
    problem: { label: '例題', lead: '次の関数を微分せよ。',
      parts: ['(1)　$y=\\sin4x$', '(2)　$y=\\cos^2x$', '(3)　$y=\\sin^3x$', '(4)　$y=\\tan2x$', '(5)　$y=x\\sin x$', '(6)　$y=\\dfrac{\\cos x}{x}$', '(7)　$y=\\dfrac{\\sin x}{1+\\cos x}$', '(8)　$y=\\tan x$ の $x=\\dfrac{\\pi}{4}$ における微分係数を求めよ'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '第1章で、極限 $\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1$ を学びました。これと数学Ⅱの **加法定理** を使って、三角関数の導関数を求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$(\\sin x)\'=\\cos x$ を導くことができる\n三角関数をふくむ関数を微分できる' }] },

      // ---------- sin x ----------
      { clear: true, part: 'sin x の導関数', say: '定義にしたがって計算します。加法定理で $\\sin(x+h)$ を展開し、$\\sin x$ と $\\cos x$ でまとめます。',
        add: [{ t: 'h', text: '$(\\sin x)\'$ を定義から' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}&\\frac{\\sin(x+h)-\\sin x}{h}\\\\ &=\\frac{\\sin x\\cos h+\\cos x\\sin h-\\sin x}{h}\\\\ &=\\sin x\\cdot\\hb{\\frac{\\cos h-1}{h}}+\\cos x\\cdot\\hy{\\frac{\\sin h}{h}}\\end{aligned}' },
          { t: 'box', col: 1, c: 'b', label: '第1章', text: '$\\displaystyle\\lim_{h\\to0}\\frac{\\sin h}{h}=1$\n（角は **弧度法** で測る）' }] },
      { say: '青い部分は、分子・分母に $\\cos h+1$ をかけます。分子は $\\cos^2h-1=-\\sin^2h$ になり、$h\\to0$ で $0$ に近づきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\frac{\\cos h-1}{h}&=\\frac{-\\sin^2h}{h(\\cos h+1)}\\\\ &=-\\hy{\\frac{\\sin h}{h}}\\cdot\\frac{\\sin h}{\\cos h+1}\\ \\to\\ -1\\cdot\\frac{0}{2}=0\\end{aligned}' }] },
      { say: "だから $(\\sin x)'=\\sin x\\cdot0+\\cos x\\cdot1=\\cos x$。グラフでも、$x=0$ で接線の傾きが $1=\\cos0$、$x=\\dfrac{\\pi}{2}$ で $0=\\cos\\dfrac{\\pi}{2}$ です。",
        add: [{ t: 'box', c: 'y', label: '公式', text: "$(\\sin x)'=\\cos x$" },
          sinFig('fs', [
            { k: 'line', m: 1, n: 0, a: -0.7, b: 1.0, c: 'g' }, { k: 'pt', at: [0, 0], c: 'g' },
            { k: 'line', m: 0, n: 1, a: 0.75, b: 2.4, c: 'g' }, { k: 'pt', at: [PI / 2, 1], c: 'g' }])] },
      { ask: { type: 'choice', q: '$y=\\sin x$ のグラフで、接線の傾きが $-1$ になる $x$ は？（$0\\le x<2\\pi$）',
        opts: ['$x=\\dfrac{\\pi}{2}$', '$x=\\pi$', '$x=\\dfrac{3\\pi}{2}$', '$x=0$'], ok: 1,
        why: { 0: '$x=\\dfrac{\\pi}{2}$ は $\\sin x$ が最大の所。接線は水平で、傾きは $0$ です。', 2: '$x=\\dfrac{3\\pi}{2}$ は最小の所。ここも傾きは $0$ です。', 3: '$x=0$ での傾きは $\\cos0=1$ です。' },
        good: '傾きは $\\cos x$。$\\cos x=-1$ となるのは $x=\\pi$ で、グラフがいちばん急に下る所です。',
        draw: [{ fig: 'fs', items: [{ k: 'line', m: -1, n: PI, a: 2.25, b: 4.0, c: 'p' }, { k: 'pt', at: [PI, 0], c: 'p' }] }] } },

      // ---------- cos x, tan x ----------
      { clear: true, part: 'cos x・tan x', say: '$\\cos x=\\sin\\left(x+\\dfrac{\\pi}{2}\\right)$ と見ると、合成関数の微分で $\\cos\\left(x+\\dfrac{\\pi}{2}\\right)\\cdot1=-\\sin x$ です。',
        add: [{ t: 'h', text: '$\\cos x$ と $\\tan x$ の導関数' },
          { t: 'm', size: 'sm', tex: "(\\cos x)'=\\left\\{\\sin\\left(x+\\frac{\\pi}{2}\\right)\\right\\}'=\\cos\\left(x+\\frac{\\pi}{2}\\right)=-\\sin x" },
          { t: 'box', c: 'y', label: '公式', text: "$(\\cos x)'=\\hy{-}\\sin x$　（マイナスがつく）" }] },
      { say: '$\\tan x=\\dfrac{\\sin x}{\\cos x}$ と見て、前々回の商の微分を使います。分子は $\\cos^2x+\\sin^2x=1$ になります。',
        add: [{ t: 'm', size: 'sm', tex: "(\\tan x)'=\\frac{\\cos x\\cdot\\cos x-\\sin x\\cdot(-\\sin x)}{\\cos^2x}=\\frac{1}{\\cos^2x}" },
          { t: 'box', c: 'p', label: '公式', text: "$(\\tan x)'=\\dfrac{1}{\\cos^2x}$" }] },
      { ask: { type: 'choice', q: '$y=\\tan x$ の、$x=\\dfrac{\\pi}{4}$ における微分係数は？',
        opts: ['$1$', '$\\dfrac12$', '$2$', '$\\sqrt2$'], ok: 2,
        why: { 0: '$\\tan\\dfrac{\\pi}{4}=1$ は関数の値。微分係数は $\\dfrac{1}{\\cos^2x}$ に代入します。', 1: '$\\cos^2\\dfrac{\\pi}{4}=\\dfrac12$ そのもの。その逆数です。', 3: '$\\dfrac{1}{\\cos\\frac{\\pi}{4}}=\\sqrt2$ で止まっています。2乗します。' },
        good: '$\\dfrac{1}{\\cos^2\\frac{\\pi}{4}}=\\dfrac{1}{\\left(\\frac{1}{\\sqrt2}\\right)^2}=2$。',
        add: [{ t: 'm', size: 'sm', tex: "x=\\frac{\\pi}{4}\\text{ のとき}\\quad \\frac{1}{\\cos^2\\frac{\\pi}{4}}=\\frac{1}{\\ \\frac12\\ }=2" }] } },

      // ---------- 合成関数 ----------
      { clear: true, part: '合成関数と組み合わせ', say: '中身が $x$ でないときは、合成関数の微分で **中身の微分** をかけます。$\\sin4x$ なら、中身 $4x$ の微分 $4$ をかけます。',
        add: [{ t: 'h', text: '中身の微分をかける' },
          { t: 'm', tex: "(\\sin4x)'=\\cos4x\\cdot\\hb{4}=4\\cos4x" },
          { t: 'tbl', col: 1, rows: [['$f(x)$', "$f'(x)$"], ['$\\sin x$', '$\\cos x$'], ['$\\cos x$', '$-\\sin x$'], ['$\\tan x$', '$\\dfrac{1}{\\cos^2x}$']] }] },
      { say: '$\\cos^2x$ は $(\\cos x)^2$ のこと。外側の2乗を微分して $2\\cos x$、それに中身 $\\cos x$ の微分 $-\\sin x$ をかけます。',
        add: [{ t: 'm', tex: "(\\cos^2x)'=2\\cos x\\cdot\\hb{(-\\sin x)}=-2\\sin x\\cos x" }] },
      { ask: { type: 'choice', q: '$y=\\sin^3x$ を微分すると？',
        opts: ['$3\\sin^2x\\cos x$', '$3\\sin^2x$', '$3\\cos^2x$', '$-3\\sin^2x\\cos x$'], ok: 0,
        why: { 1: '中身 $\\sin x$ の微分 $\\cos x$ をかけ忘れています。', 2: '$\\sin^3x=(\\sin x)^3$。外側の3乗を先に微分します。', 3: "$(\\sin x)'=\\cos x$ なので、マイナスはつきません。" },
        good: '$3\\sin^2x\\cdot(\\sin x)\'=3\\sin^2x\\cos x$。',
        add: [{ t: 'm', tex: "(\\sin^3x)'=3\\sin^2x\\cdot\\cos x" }] } },
      { ask: { type: 'choice', q: '$y=\\tan2x$ を微分すると？',
        opts: ['$\\dfrac{1}{\\cos^22x}$', '$\\dfrac{2}{\\cos^2x}$', '$-\\dfrac{2}{\\sin^22x}$', '$\\dfrac{2}{\\cos^22x}$'], ok: 3,
        why: { 0: '中身 $2x$ の微分 $2$ をかけ忘れています。', 1: '分母の中身は $2x$ のまま。$\\cos^22x$ です。', 2: "$\\tan$ の微分は $\\dfrac{1}{\\cos^2}$。$\\sin$ にはなりません。" },
        good: '$\\dfrac{1}{\\cos^22x}\\cdot2=\\dfrac{2}{\\cos^22x}$。',
        add: [{ t: 'm', tex: "(\\tan2x)'=\\frac{1}{\\cos^22x}\\cdot2=\\frac{2}{\\cos^22x}" }] } },

      // ---------- 積・商と ----------
      { clear: true, part: '積・商と組み合わせ', say: '積や商の微分とも組み合わせられます。$x\\sin x$ は積の微分、$\\dfrac{\\cos x}{x}$ は商の微分です。',
        add: [{ t: 'h', text: '積・商の微分と組み合わせる' },
          { t: 'm', tex: "(x\\sin x)'=1\\cdot\\sin x+x\\cos x=\\sin x+x\\cos x" },
          { t: 'm', tex: "\\left(\\frac{\\cos x}{x}\\right)'=\\frac{-\\sin x\\cdot x-\\cos x\\cdot1}{x^2}=-\\frac{x\\sin x+\\cos x}{x^2}" }] },
      { ask: { type: 'think', q: '$y=\\dfrac{\\sin x}{1+\\cos x}$ を微分して、できるだけ簡単にしよう。',
        hint: '商の微分。分子に出てくる $\\cos^2x+\\sin^2x$ は $1$ です。',
        ans: "$y'=\\dfrac{\\cos x(1+\\cos x)-\\sin x(-\\sin x)}{(1+\\cos x)^2}=\\dfrac{1+\\cos x}{(1+\\cos x)^2}=\\dfrac{1}{1+\\cos x}$",
        after: '$\\sin^2x+\\cos^2x=1$ を使うと分子が $1+\\cos x$ になり、約分できます。',
        add: [{ t: 'm', size: 'sm', tex: "\\begin{aligned}y'&=\\frac{\\cos x(1+\\cos x)+\\sin^2x}{(1+\\cos x)^2}\\\\ &=\\frac{1+\\cos x}{(1+\\cos x)^2}=\\frac{1}{1+\\cos x}\\end{aligned}" }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、**指数関数・対数関数** の導関数です。自然対数の底 $e$ が登場します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
