/* 数学Ⅲ 第2章 微分法 ④：指数関数・対数関数の導関数
   例はすべて自作。導関数・誤答・(1+h)^(1/h) の値・図の座標は python3（sympy）で検算ずみ。
   図：y=eˣ の点 (0, 1) の接線 y=x+1、y=log x の点 (1, 0) の接線 y=x−1（y=x に関して対称） */
(function () {
  const POINTS = [
    "$e=\\displaystyle\\lim_{h\\to0}(1+h)^{\\frac1h}=2.718\\cdots$、$\\log x$ は底 $e$ の **自然対数**。$(\\log x)'=\\dfrac1x$、$(\\log|x|)'=\\dfrac1x$、$(\\log_ax)'=\\dfrac{1}{x\\log a}$",
    "$(e^x)'=e^x$、$(a^x)'=a^x\\log a$。中身があれば中身の微分をかける（$\\{\\log|f(x)|\\}'=\\dfrac{f'(x)}{f(x)}$）",
    "**対数微分法**：両辺の自然対数をとってから微分する（左辺は $\\dfrac{y'}{y}$）。$x^x$ や、積・商の多い式に使う"
  ];
  const expFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.3, -2.3, 3.5, 3.5], w: 470, h: 470, items: [
    { k: 'axes', tx: [-2, -1, 1, 2, 3], ty: [-2, -1, 1, 2, 3] },
    { k: 'line', m: 1, n: 0, a: -2.2, b: 3.4, c: 'w', dash: true, label: 'y=x', lat: [-1.6, -2.1], la: 'start' },
    { k: 'fn', f: 'exp(x)', a: -2.3, b: 1.3, c: 'y', label: 'y=eˣ', lat: [-0.35, 2.5], la: 'end' },
    { k: 'fn', f: 'log(x)', a: 0.02, b: 3.5, c: 'b', label: 'y=log x', lat: [3.45, 0.75], la: 'end' }].concat(items || []) });

  HB.lesson({
    id: 'm3b-04', field: '数学Ⅲ　微分法', title: '指数関数・対数関数の導関数', level: '導関数', time: '目安 8分',
    problem: { label: '例題', lead: '次の関数を微分せよ。',
      parts: ['(1)　$y=\\log_2x$', '(2)　$y=\\log|\\cos x|$', '(3)　$y=3^x$', '(4)　$y=e^{-x^2}$', '(5)　$y=e^{x^2-3x}$', '(6)　$y=x^x\\ (x>0)$', '(7)　$y=\\dfrac{(x+1)^2}{(x-1)^3}$（対数微分法で）'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は三角関数の導関数でした。この時間は、数学Ⅱで学んだ **指数関数・対数関数** を微分します。とくべつな数 $e$ が主役です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '自然対数の底 $e$ と $(\\log x)\'=\\dfrac1x$ がわかる\n指数関数・対数関数を微分できる（**対数微分法** も）' }] },

      // ---------- e ----------
      { clear: true, part: '数 e', say: '底を $a$ として、$\\log_ax$ を定義から微分します。$k=\\dfrac hx$ とおくと、$h\\to0$ のとき $k\\to0$。$(1+k)^{\\frac1k}$ の極限が必要になります。',
        add: [{ t: 'h', text: '$\\log_ax$ を定義から' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\frac{\\log_a(x+h)-\\log_ax}{h}&=\\frac1h\\log_a\\left(1+\\frac hx\\right)\\\\ &=\\frac1x\\cdot\\frac xh\\log_a\\left(1+\\frac hx\\right)\\\\ &=\\frac1x\\log_a\\hy{(1+k)^{\\frac1k}}\\end{aligned}', note: '$k=\\dfrac hx$' }] },
      { say: '$(1+h)^{\\frac1h}$ は、$h\\to0$ のとき $2.71828\\cdots$ という無理数に近づきます。この数を $e$ と書き、$e$ を底とする対数を **自然対数** といいます。',
        add: [{ t: 'box', c: 'y', label: '定義', text: '$e=\\displaystyle\\lim_{h\\to0}(1+h)^{\\frac1h}=2.71828\\cdots$' },
          { t: 'p', size: 'sm', text: '**自然対数**　$\\log_ex$ を、底を省いて $\\log x$ と書く' },
          { t: 'tbl', col: 1, rows: [['$h$', '$(1+h)^{\\frac1h}$'], ['$0.1$', '$2.5937$'], ['$0.01$', '$2.7048$'], ['$0.001$', '$2.7169$'], ['$-0.001$', '$2.7196$'], ['$-0.01$', '$2.7320$']] },
          { t: 'p', col: 1, size: 'sm', text: '（小数第5位を四捨五入）' }] },

      // ---------- log x ----------
      { clear: true, part: '対数関数', say: "$h\\to0$ のとき、さっきの式は $\\dfrac1x\\log_ae=\\dfrac{1}{x\\log a}$ に近づきます。底が $e$ なら $\\log e=1$ なので、$(\\log x)'=\\dfrac1x$ ととても簡単です。",
        add: [{ t: 'h', text: '対数関数の導関数' },
          { t: 'box', c: 'y', label: '公式', text: "$(\\log x)'=\\dfrac1x$　　$(\\log_ax)'=\\dfrac{1}{x\\log a}$" }] },
      { ask: { type: 'choice', q: '$y=\\log_2x$ を微分すると？',
        opts: ['$\\dfrac1x$', '$\\dfrac{1}{x\\log2}$', '$\\dfrac{\\log2}{x}$', '$\\dfrac{1}{2x}$'], ok: 1,
        why: { 0: '$\\dfrac1x$ になるのは、底が $e$ のときだけです。', 2: '$\\log_2x=\\dfrac{\\log x}{\\log2}$ なので、$\\log2$ は分母に入ります。', 3: '底の $2$ をそのまま分母にかけるのではありません。' },
        good: '$\\log_2x=\\dfrac{\\log x}{\\log2}$ と底をかえて考えても同じです。',
        add: [{ t: 'm', tex: "(\\log_2x)'=\\frac{1}{x\\log2}" }] } },
      { say: "$x<0$ のときは $\\log|x|=\\log(-x)$。合成関数の微分で $\\dfrac{-1}{-x}=\\dfrac1x$。だから $(\\log|x|)'=\\dfrac1x$。中身が式なら $\\dfrac{f'(x)}{f(x)}$ です。",
        add: [{ t: 'box', c: 'p', label: '公式', text: "$(\\log|x|)'=\\dfrac1x$　　$\\{\\log|f(x)|\\}'=\\dfrac{f'(x)}{f(x)}$" },
          { t: 'm', size: 'sm', tex: "(\\log|\\cos x|)'=\\frac{-\\sin x}{\\cos x}=-\\tan x" }] },

      // ---------- e^x ----------
      { clear: true, part: '指数関数', say: '$y=e^x$ は $x=\\log y$。前々回の逆関数の微分で、$\\dfrac{dx}{dy}=\\dfrac1y$ だから $\\dfrac{dy}{dx}=y=e^x$。**微分しても変わらない** 関数です。',
        add: [{ t: 'h', text: '指数関数の導関数' },
          { t: 'm', tex: '\\frac{dy}{dx}=\\frac{1}{\\ \\frac{dx}{dy}\\ }=\\frac{1}{\\ \\frac1y\\ }=y=e^x' },
          { t: 'box', c: 'y', label: '公式', text: "$(e^x)'=e^x$" },
          expFig('fe', [{ k: 'pt', at: [0, 1], c: 'y' }, { k: 'pt', at: [1, 0], c: 'b' }])] },
      { say: '$x=0$ では傾き $e^0=1$。$e$ は「$x=0$ での接線の傾きがちょうど $1$」になる底です。$a^x$ は $e^{x\\log a}$ と書きかえて微分します。',
        add: [{ t: 'm', tex: "(a^x)'=(e^{x\\log a})'=e^{x\\log a}\\cdot\\log a=a^x\\log a" },
          { t: 'box', c: 'p', label: '公式', text: "$(a^x)'=a^x\\log a$" }],
        draw: [{ fig: 'fe', items: [
          { k: 'line', m: 1, n: 1, a: -2.2, b: 1.6, c: 'g' }, { k: 'line', m: 1, n: -1, a: -0.6, b: 3.4, c: 'g' },
          { k: 'label', at: [-0.2, 1.55], text: '傾き 1', c: 'g', size: 22, anchor: 'end' }, { k: 'label', at: [1.3, -0.8], text: '傾き 1', c: 'g', size: 22, anchor: 'start' }] }] },
      { ask: { type: 'choice', q: '$y=3^x$ を微分すると？',
        opts: ['$x\\cdot3^{x-1}$', '$3^x$', '$3^x\\log3$', '$\\dfrac{3^x}{\\log3}$'], ok: 2,
        why: { 0: '$(x^n)\'=nx^{n-1}$ は、指数が定数のときの公式。$3^x$ は指数が変数です。', 1: '微分しても変わらないのは、底が $e$ のときだけです。', 3: '$\\log3$ は、割るのではなく **かけます**。' },
        good: '$3^x=e^{x\\log3}$ と見て、$(3^x)\'=3^x\\log3$。',
        add: [{ t: 'm', tex: "(3^x)'=3^x\\log3" }] } },

      // ---------- 合成関数 ----------
      { clear: true, part: '中身があるとき', say: '指数や対数の中身が式のときも、合成関数の微分で **中身の微分をかけ** ます。$e^{-x^2}$ なら、中身 $-x^2$ の微分 $-2x$ をかけます。',
        add: [{ t: 'h', text: '中身の微分をかける' },
          { t: 'm', tex: "(e^{-x^2})'=e^{-x^2}\\cdot\\hb{(-2x)}=-2xe^{-x^2}" },
          { t: 'm', tex: "\\{\\log(x^2+1)\\}'=\\frac{\\hb{2x}}{x^2+1}" }] },
      { ask: { type: 'choice', q: '$y=e^{x^2-3x}$ を微分すると？',
        opts: ['$(2x-3)e^{x^2-3x}$', '$e^{x^2-3x}$', '$(x^2-3x)e^{x^2-3x-1}$', '$(2x-3)e^{2x-3}$'], ok: 0,
        why: { 1: '中身 $x^2-3x$ の微分 $2x-3$ をかけ忘れています。', 2: '$(x^n)\'=nx^{n-1}$ の形を、指数関数に使ってしまっています。', 3: '$e$ の肩の中身は、微分しても変わりません。外に $2x-3$ をかけるだけ。' },
        good: '$e^{x^2-3x}\\cdot(x^2-3x)\'=(2x-3)e^{x^2-3x}$。',
        add: [{ t: 'm', tex: "(e^{x^2-3x})'=(2x-3)e^{x^2-3x}" }] } },

      // ---------- 対数微分法 ----------
      { clear: true, part: '対数微分法', say: '$y=x^x$（$x>0$）は、底も指数も $x$ です。両辺の **自然対数** をとると、$\\log y=x\\log x$ と、積の形になります。',
        add: [{ t: 'h', text: '対数微分法' },
          { t: 'm', tex: '\\log y=x\\log x', note: '両辺の自然対数をとる' },
          { t: 'm', tex: "\\frac{y'}{y}=1\\cdot\\log x+x\\cdot\\frac1x=\\log x+1", note: '両辺を $x$ で微分\n（左辺は合成関数）' }] },
      { ask: { type: 'choice', q: '$y=x^x$（$x>0$）の導関数は？',
        opts: ['$x\\cdot x^{x-1}$', '$x^x\\log x$', '$x^x$', '$x^x(\\log x+1)$'], ok: 3,
        why: { 0: '$(x^n)\'=nx^{n-1}$ は、指数が定数のときの公式です。', 1: '$(a^x)\'=a^x\\log a$ は、底が定数のときの公式です。', 2: '微分しても変わらないのは $e^x$ だけです。' },
        good: "$\\dfrac{y'}{y}=\\log x+1$ の両辺に $y=x^x$ をかけて、$y'=x^x(\\log x+1)$。",
        add: [{ t: 'm', tex: "y'=y(\\log x+1)=\\ans{x^x(\\log x+1)}" }] } },
      { ask: { type: 'think', q: '$y=\\dfrac{(x+1)^2}{(x-1)^3}$ を、対数微分法で微分しよう。',
        hint: '両辺の絶対値の自然対数をとると $\\log|y|=2\\log|x+1|-3\\log|x-1|$。積・商が和・差になります。',
        ans: "$\\dfrac{y'}{y}=\\dfrac{2}{x+1}-\\dfrac{3}{x-1}=\\dfrac{-(x+5)}{(x+1)(x-1)}$ より　$y'=-\\dfrac{(x+1)(x+5)}{(x-1)^4}$",
        after: '正や負の値をとる式は、**絶対値をつけて** から対数をとります。商の公式で微分しても同じ答えです。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\log|y|=2\\log|x+1|-3\\log|x-1|' }, { t: 'm', col: 1, size: 'sm', tex: "y'=-\\frac{(x+1)(x+5)}{(x-1)^4}" }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、2回・3回と微分する **高次導関数** と、媒介変数や方程式で表された関数の微分です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
