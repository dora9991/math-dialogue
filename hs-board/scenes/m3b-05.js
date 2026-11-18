/* 数学Ⅲ 第2章 微分法 ⑤：高次導関数・媒介変数と陰関数の微分
   例はすべて自作。導関数・誤答・図の座標は python3（sympy）で検算ずみ。
   図：x=2cos t, y=sin 2t（8の字）。t=π/3 の点 (1, √3/2) の接線の傾き 1/√3（y=0.57735x+0.28868）。
       円 x²+y²=10 の点 (1, 3) の接線 y=−x/3+10/3 */
(function () {
  const S3 = Math.sqrt(3), R10 = Math.sqrt(10);
  const POINTS = [
    "導関数をもう一度微分すると **第2次導関数** $y''=f''(x)=\\dfrac{d^2y}{dx^2}$。さらに第3次 $y'''$、第 $n$ 次 $y^{(n)}$",
    '**媒介変数表示** $x=f(t),\\ y=g(t)$ のとき　$\\dfrac{dy}{dx}=\\dfrac{\\ \\dfrac{dy}{dt}\\ }{\\dfrac{dx}{dt}}$（$t$ の式のままでよい）',
    "方程式で表された関数は、$y$ を $x$ の関数と見て **両辺を $x$ で微分**。$(y^2)'=2y\\cdot y'$（$y'$ を忘れない）"
  ];
  const eight = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.5, -1.4, 2.5, 1.4], w: 580, h: 325, items: [
    { k: 'axes', tx: [-2, -1, 1, 2], ty: [1, -1] },
    { k: 'param', x: '2*cos(t)', y: 'sin(2*t)', a: 0, b: 2 * Math.PI, c: 'y', label: 'C', lat: [-1.75, 1.05] }].concat(items || []) });
  const circ = (id, items) => ({ t: 'fig', id, col: 1, view: [-4.4, -4.4, 4.4, 4.4], w: 470, h: 470, items: [
    { k: 'axes', tx: [-3, -2, -1, 1, 2, 3], ty: [-3, -2, -1, 1, 2, 3] },
    { k: 'circle', o: [0, 0], r: R10, c: 'y', label: 'x²+y²=10', lat: [1.9, -3.75] }].concat(items || []) });

  HB.lesson({
    id: 'm3b-05', field: '数学Ⅲ　微分法', title: '高次導関数・媒介変数と陰関数の微分', level: '導関数', time: '目安 8分',
    problem: { label: '例題', lead: '次の問いに答えよ。',
      parts: ['(1)　$y=x^4-2x^3+5x$ の第3次導関数', '(2)　$y=\\log x$ の第3次導関数', '(3)　$y=xe^x$ の第 $n$ 次導関数', '(4)　$x=2\\cos t,\\ y=\\sin2t$ のとき $\\dfrac{dy}{dx}$ と、$t=\\dfrac{\\pi}{3}$ での値', '(5)　$x^2+y^2=10$ のとき $\\dfrac{dy}{dx}$ と、点 $(1,\\,3)$ での値', '(6)　$4x^2+y^2=8$ のとき、点 $(1,\\,2)$ での $\\dfrac{dy}{dx}$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'ここまでで、いろいろな関数を微分できるようになりました。この時間は、**2回・3回と微分する** ことと、$y=f(x)$ の形になっていない関数の微分です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**高次導関数** を求められる\n**媒介変数** や **方程式** で表された関数を微分できる' }] },

      // ---------- 高次導関数 ----------
      { clear: true, part: '高次導関数', say: '導関数 $f\'(x)$ をもう一度微分したものを **第2次導関数** といいます。さらに微分すると第3次導関数。まとめて **高次導関数** といいます。',
        add: [{ t: 'h', text: '高次導関数' },
          { t: 'tbl', size: 'sm', rows: [['第1次', "$y'$", "$f'(x)$", '$\\dfrac{dy}{dx}$'], ['第2次', "$y''$", "$f''(x)$", '$\\dfrac{d^2y}{dx^2}$'], ['第3次', "$y'''$", "$f'''(x)$", '$\\dfrac{d^3y}{dx^3}$'], ['第 $n$ 次', '$y^{(n)}$', '$f^{(n)}(x)$', '$\\dfrac{d^ny}{dx^n}$']] }] },
      { say: '整式は、微分するたびに次数が1つずつ下がります。$x^4-2x^3+5x$ を3回微分すると、1次式 $24x-12$ になります。',
        add: [{ t: 'm', size: 'sm', tex: "\\begin{aligned}y'&=4x^3-6x^2+5\\\\ y''&=12x^2-12x\\\\ y'''&=24x-12\\end{aligned}", note: '$y=x^4-2x^3+5x$\nを3回微分' },
          { t: 'm', col: 1, size: 'sm', tex: "\\begin{aligned}y&=\\sin2x\\\\ y'&=2\\cos2x\\\\ y''&=-4\\sin2x\\\\ y'''&=-8\\cos2x\\end{aligned}" },
          { t: 'p', col: 1, size: 'sm', text: '$\\sin2x$ は、2回微分すると\nもとの $-4$ 倍になる' }] },
      { ask: { type: 'choice', q: '$y=\\log x$ の第3次導関数 $y\'\'\'$ は？',
        opts: ['$\\dfrac{2}{x^3}$', '$-\\dfrac{2}{x^3}$', '$\\dfrac{1}{x^3}$', '$-\\dfrac{1}{x^2}$'], ok: 0,
        why: { 1: "$y''=-x^{-2}$ を微分すると $(-1)\\cdot(-2)x^{-3}$。負×負で正です。", 2: '指数 $-2$ を前に出してかけるのを忘れています。', 3: "それは第2次導関数 $y''$ です。もう1回微分します。" },
        good: "$y'=x^{-1}$、$y''=-x^{-2}$、$y'''=2x^{-3}=\\dfrac{2}{x^3}$。",
        add: [{ t: 'm', col: 1, size: 'sm', tex: "(\\log x)'''=(-x^{-2})'=\\frac{2}{x^3}" }] } },
      { ask: { type: 'think', q: '$y=xe^x$ の第 $n$ 次導関数 $y^{(n)}$ を予想しよう。',
        hint: "積の微分で $y'$、$y''$、$y'''$ を順に計算して、きまりを見つけます。",
        ans: "$y'=(x+1)e^x$、$y''=(x+2)e^x$、$y'''=(x+3)e^x$ より　$y^{(n)}=(x+n)e^x$",
        after: '微分するたびに $e^x$ が1つずつ増えます。きちんと示すには、数学Bの数学的帰納法を使います。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '(xe^x)^{(n)}=(x+n)e^x' }] } },

      // ---------- 媒介変数 ----------
      { clear: true, part: '媒介変数', say: '$x$ と $y$ が、別の変数 $t$ の式で表されることがあります。$t$ を動かすと、点 $(x,\\,y)$ が曲線をえがきます。これを曲線の **媒介変数表示** といいます。',
        add: [{ t: 'h', text: '媒介変数で表された関数' },
          { t: 'm', tex: 'C:\\ x=2\\cos t,\\quad y=\\sin2t', note: '$0\\le t<2\\pi$' },
          eight('f8')] },
      { say: '合成関数と逆関数の微分から、$\\dfrac{dy}{dx}=\\dfrac{dy}{dt}\\cdot\\dfrac{dt}{dx}$。つまり、$\\dfrac{dy}{dt}$ を $\\dfrac{dx}{dt}$ で割ります。答えは $t$ の式のままでかまいません。',
        add: [{ t: 'box', c: 'y', label: '公式', text: '$\\dfrac{dy}{dx}=\\dfrac{\\ \\dfrac{dy}{dt}\\ }{\\dfrac{dx}{dt}}$　（$\\dfrac{dx}{dt}\\neq0$）' },
          { t: 'm', size: 'sm', tex: '\\frac{dx}{dt}=-2\\sin t,\\quad \\frac{dy}{dt}=2\\cos2t' },
          { t: 'm', tex: '\\frac{dy}{dx}=\\frac{2\\cos2t}{-2\\sin t}=-\\frac{\\cos2t}{\\sin t}' }] },
      { ask: { type: 'choice', q: '$t=\\dfrac{\\pi}{3}$ の点 $\\left(1,\\ \\dfrac{\\sqrt3}{2}\\right)$ での $\\dfrac{dy}{dx}$ は？',
        opts: ['$\\sqrt3$', '$-\\dfrac{1}{\\sqrt3}$', '$\\dfrac{1}{\\sqrt3}$', '$\\dfrac{1}{2\\sqrt3}$'], ok: 2,
        why: { 0: '$\\dfrac{dx}{dt}\\div\\dfrac{dy}{dt}$ と、逆に割っています。', 1: '$\\cos\\dfrac{2\\pi}{3}=-\\dfrac12$ は負。前のマイナスと合わせて正になります。', 3: '$\\sin2t$ を $t$ で微分すると $2\\cos2t$。中身の微分 $2$ を忘れています。' },
        good: '$-\\dfrac{\\cos\\frac{2\\pi}{3}}{\\sin\\frac{\\pi}{3}}=\\dfrac{\\ \\frac12\\ }{\\frac{\\sqrt3}{2}}=\\dfrac{1}{\\sqrt3}$。図の緑の線が、この傾きの接線です。',
        draw: [{ fig: 'f8', items: [{ k: 'line', m: 1 / S3, n: S3 / 2 - 1 / S3, a: -0.4, b: 2.3, c: 'g' }, { k: 'pt', at: [1, S3 / 2], name: 't=π/3', dir: 'nw', c: 'g', size: 21 }] }] } },
      { say: '$t=\\dfrac{\\pi}{4}$ では $\\cos2t=0$ なので $\\dfrac{dy}{dx}=0$。点 $(\\sqrt2,\\,1)$ で接線は水平で、ここが曲線のいちばん上です。',
        add: [{ t: 'p', size: 'sm', text: '$t=\\dfrac{\\pi}{4}$ → $\\dfrac{dy}{dx}=0$　点 $(\\sqrt2,\\,1)$ で接線が水平' }],
        draw: [{ fig: 'f8', items: [{ k: 'line', m: 0, n: 1, a: 0.7, b: 2.15, c: 'p' }, { k: 'pt', at: [Math.SQRT2, 1], c: 'p' }] }] },

      // ---------- 方程式で表された関数 ----------
      { clear: true, part: '方程式で表された関数', say: '円 $x^2+y^2=10$ のように、$y=$ の形に解かれていない関数もあります。$y$ を $x$ の関数と見て、**両辺を $x$ で微分** します。',
        add: [{ t: 'h', text: '方程式で表された関数' },
          { t: 'm', tex: 'x^2+y^2=10', note: '両辺を $x$ で微分' },
          circ('fc', [{ k: 'pt', at: [1, 3], name: '(1, 3)', dir: 'ne', c: 'p', size: 21 }])] },
      { ask: { type: 'choice', q: '$y$ を $x$ の関数と見るとき、$y^2$ を $x$ で微分すると？',
        opts: ['$2y$', "$2y\\cdot y'$", '$2x$', "$(y')^2$"], ok: 1,
        why: { 0: "$y$ は $x$ の関数。合成関数の微分で、中身 $y$ の微分 $y'$ をかけます。", 2: '$y$ を $x$ にかえて微分してはいけません。', 3: '2乗の微分は「$2\\times$ 中身 $\\times$ 中身の微分」です。' },
        good: "$\\dfrac{d}{dx}y^2=\\dfrac{d}{dy}y^2\\cdot\\dfrac{dy}{dx}=2y\\cdot y'$。",
        add: [{ t: 'm', tex: "2x+2y\\cdot y'=0\\qquad\\therefore\\ y'=-\\frac{x}{y}", note: '$y\\neq0$' }] } },
      { say: "点 $(1,\\,3)$ では $y'=-\\dfrac13$。半径の傾き $3$ と、かけると $-1$。接線は半径に垂直、という円の性質と合っています。",
        add: [{ t: 'm', size: 'sm', tex: "(1,\\,3)\\text{ で }\\ y'=-\\frac13", note: '半径の傾きは 3' }],
        draw: [{ fig: 'fc', items: [{ k: 'seg', a: [0, 0], b: [1, 3], c: 'b' }, { k: 'line', m: -1 / 3, n: 10 / 3, a: -1.8, b: 4.3, c: 'g' }, { k: 'right', o: [1, 3], a: [0, 0], b: [4, 2], s: 14 }] }] },
      { ask: { type: 'choice', q: '$4x^2+y^2=8$ の点 $(1,\\,2)$ における $\\dfrac{dy}{dx}$ は？',
        opts: ['$-\\dfrac12$', '$-8$', '$2$', '$-2$'], ok: 3,
        why: { 0: "$y'=-\\dfrac{4x}{y}$ の分子と分母が逆になっています。", 1: "$8x+2y\\cdot y'=0$ から $y'$ を出すとき、$2y$ で割るのを忘れています。", 2: '移項すると $2yy\'=-8x$。マイナスがつきます。' },
        good: "$8x+2yy'=0$ より $y'=-\\dfrac{4x}{y}$。$(1,\\,2)$ では $-\\dfrac{4}{2}=-2$。",
        add: [{ t: 'm', size: 'sm', tex: "8x+2yy'=0\\ \\Rightarrow\\ y'=-\\frac{4x}{y}=-2" }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、ここまでの微分を使って、いろいろな曲線の **接線と法線** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
