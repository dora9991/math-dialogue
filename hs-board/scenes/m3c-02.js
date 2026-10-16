/* 数学Ⅲ 第3章 積分法 不定積分 ②：置換積分法
   例・数値はすべて自作。答え・誤答は python3（sympy）で「微分してもとにもどるか」を検算ずみ。
   ∫(3x−2)⁴dx=(3x−2)⁵/15+C、∫dx/(2x+3)=(1/2)log|2x+3|+C、∫x(x²+1)³dx=(x²+1)⁴/8+C、∫sin³x cosx dx=sin⁴x/4+C、
   ∫2x/(x²+1)dx=log(x²+1)+C、∫tanx dx=−log|cosx|+C、考えてみよう ∫eˣ/(eˣ+1)dx=log(eˣ+1)+C、
   ∫x√(x+1)dx（t=√(x+1)）=(2/5)t⁵−(2/3)t³+C=(2/15)(3x−2)(x+1)√(x+1)+C */
(function () {
  const POINTS = [
    "$t=g(x)$ とおくと $dt=g'(x)\\,dx$。$\\displaystyle\\int f(g(x))\\,g'(x)\\,dx=\\int f(t)\\,dt$（合成関数の微分を逆に読む）。最後は $x$ の式にもどす",
    "1次式なら　$\\displaystyle\\int f(ax+b)\\,dx=\\frac1aF(ax+b)+C$。分子が分母の微分なら　$\\displaystyle\\int\\frac{f'(x)}{f(x)}\\,dx=\\log|f(x)|+C$",
    '$\\sqrt{\\ }$ をふくむ式は、$t=\\sqrt{\\cdots}$ とおいて、$x$ と $dx$ を **両方とも** $t$ で表す'
  ];

  HB.lesson({
    id: 'm3c-02', field: '数学Ⅲ　積分法', title: '置換積分法', level: '不定積分', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題（不定積分を求めよ）',
      parts: ['(1)　$\\displaystyle\\int\\frac{1}{2x+3}\\,dx$', '(2)　$\\displaystyle\\int x(x^2+1)^3\\,dx$', '(3)　$\\displaystyle\\int\\sin^3x\\cos x\\,dx$',
        '(4)　$\\displaystyle\\int\\tan x\\,dx$', '(5)　$\\displaystyle\\int\\frac{e^x}{e^x+1}\\,dx$', '(6)　$\\displaystyle\\int x\\sqrt{x+1}\\,dx$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、微分の公式を逆に読んで、不定積分の公式をそろえました。この時間は **合成関数の微分** を逆に読む **置換積分法** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '式の一部を $t$ におきかえて、不定積分を求められる（置換積分法）\n$\\dfrac{f\'(x)}{f(x)}$ の形や、$\\sqrt{\\ }$ をふくむ式の不定積分ができる' }] },

      // ---------- 1次式 ----------
      { clear: true, cols: [1], part: '1次式のおきかえ', say: 'まず $\\displaystyle\\int(3x-2)^4\\,dx$。展開すると大変です。$(3x-2)^5$ を微分すると、合成関数の微分で、中身の微分 3 が出てきます。',
        add: [{ t: 'h', text: '1次式 ax + b をふくむ式' },
          { t: 'm', tex: "\\{(3x-2)^5\\}'=5(3x-2)^4\\cdot\\hy{3}=15(3x-2)^4", note: '合成関数の微分\n（中身の微分 3）' }] },
      { say: 'だから $15$ で割ればよい。一般に、$F\'(x)=f(x)$ のとき、$f(ax+b)$ の不定積分は $\\dfrac1aF(ax+b)$ です。',
        add: [{ t: 'm', tex: '\\int(3x-2)^4\\,dx=\\frac{(3x-2)^5}{15}+C', note: '$C$ は積分定数\n（以下も同じ）' },
          { t: 'box', c: 'y', label: '公式', text: "$F'(x)=f(x)$ のとき　$\\displaystyle\\int f(ax+b)\\,dx=\\frac1aF(ax+b)+C$　（$a\\neq0$）" }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\frac{1}{2x+3}\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$\\log|2x+3|$', '$2\\log|2x+3|$', '$-\\dfrac{2}{(2x+3)^2}$', '$\\dfrac12\\log|2x+3|$'], ok: 3,
        why: { 0: '微分すると $\\dfrac{2}{2x+3}$ になり、2 が余分です。$\\dfrac12$ をかけます。', 1: '$a=2$ で **割る** ところを、かけています。', 2: 'それは $\\dfrac{1}{2x+3}$ を **微分** したもの。積分は $\\log$ になります。' },
        good: '$\\dfrac1x$ の積分 $\\log|x|$ に、$\\dfrac1a=\\dfrac12$ をかけます。',
        add: [{ t: 'm', tex: '\\int\\frac{dx}{2x+3}=\\ans{\\frac12\\log|2x+3|+C}' }] } },

      // ---------- 置換積分法 ----------
      { clear: true, cols: [0.6, 0.4], part: '置換積分法', say: '一般には、式の一部を $t=g(x)$ とおきます。$\\dfrac{dt}{dx}=g\'(x)$ を $dt=g\'(x)\\,dx$ と書くと、$x$ の積分が $t$ の積分に変わります。',
        add: [{ t: 'h', text: '置換積分法' },
          { t: 'box', c: 'y', label: '公式', text: "$t=g(x)$ とおくと　$dt=g'(x)\\,dx$\n$\\displaystyle\\int f(g(x))\\,g'(x)\\,dx=\\int f(t)\\,dt$" },
          { t: 'box', c: 'b', col: 1, size: 'sm', label: 'わけ', text: "$F'(t)=f(t)$ のとき、$F(g(x))$ を $x$ で微分すると\n$F'(g(x))\\,g'(x)=f(g(x))\\,g'(x)$\n（合成関数の微分）" }] },
      { say: '例：$\\displaystyle\\int x(x^2+1)^3\\,dx$。$t=x^2+1$ とおくと $dt=2x\\,dx$、つまり $x\\,dx=\\dfrac12dt$。$x$ と $dx$ が、まとめて $t$ の式になります。',
        add: [{ t: 'm', tex: '\\begin{aligned}\\int x(x^2+1)^3\\,dx&=\\int t^3\\cdot\\frac12\\,dt=\\frac{t^4}{8}+C\\\\ &=\\ans{\\frac{(x^2+1)^4}{8}+C}\\end{aligned}', note: '$t=x^2+1$\n$x\\,dx=\\dfrac12\\,dt$' }] },
      { say: '最後は $t$ を $x$ の式にもどします。答えを微分すると $\\dfrac{4(x^2+1)^3\\cdot2x}{8}=x(x^2+1)^3$。もとにもどりました。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '検算：\n$\\left\\{\\dfrac{(x^2+1)^4}{8}\\right\\}\'=\\dfrac{4(x^2+1)^3\\cdot2x}{8}=x(x^2+1)^3$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\sin^3x\\cos x\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$-\\dfrac14\\sin^4x$', '$\\dfrac14\\sin^4x\\cos x$', '$\\dfrac14\\sin^4x$', '$\\sin^4x$'], ok: 2,
        why: { 0: '$t=\\sin x$ なら $dt=\\cos x\\,dx$。マイナスはつきません（つくのは $\\cos x$ を微分したとき）。', 1: '$\\cos x\\,dx$ は $dt$ にかわって消えます。$\\cos x$ を残してはいけません。', 3: '$\\int t^3\\,dt=\\dfrac{t^4}{4}$。4 で割るのを忘れています。' },
        good: '$t=\\sin x$ とおくと $\\cos x\\,dx=dt$。$\\displaystyle\\int t^3\\,dt=\\frac{t^4}{4}+C$。',
        add: [{ t: 'm', tex: '\\int\\sin^3x\\cos x\\,dx=\\int t^3\\,dt=\\ans{\\frac14\\sin^4x+C}', note: '$t=\\sin x$' }] } },

      // ---------- f'/f ----------
      { clear: true, cols: [1], part: "f′/f の形", say: '分子が分母の微分になっている形は、よく出ます。$t=f(x)$ とおくと $dt=f\'(x)\\,dx$ で、$\\displaystyle\\int\\frac{dt}{t}=\\log|t|+C$ です。',
        add: [{ t: 'h', text: '分子が分母の微分になっている形' },
          { t: 'box', c: 'y', label: '公式', text: "$\\displaystyle\\int\\frac{f'(x)}{f(x)}\\,dx=\\log|f(x)|+C$" },
          { t: 'm', tex: "\\int\\frac{2x}{x^2+1}\\,dx=\\int\\frac{(x^2+1)'}{x^2+1}\\,dx=\\log(x^2+1)+C", note: '$x^2+1>0$ なので\n絶対値はいらない' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\tan x\\,dx$ は？',
        opts: ['$\\log|\\cos x|+C$', '$-\\log|\\cos x|+C$', '$\\log|\\sin x|+C$', '$\\dfrac{1}{\\cos^2x}+C$'], ok: 1,
        why: { 0: '$(\\cos x)\'=-\\sin x$ なので、分子の $\\sin x$ は $-(\\cos x)\'$。マイナスがつきます。', 2: '$\\tan x=\\dfrac{\\sin x}{\\cos x}$ で、分母は $\\cos x$ です。', 3: 'それは $\\tan x$ を **微分** したものです。' },
        good: '$\\tan x=-\\dfrac{(\\cos x)\'}{\\cos x}$ と見て、$-\\log|\\cos x|+C$。',
        add: [{ t: 'm', tex: "\\int\\tan x\\,dx=-\\int\\frac{(\\cos x)'}{\\cos x}\\,dx=\\ans{-\\log|\\cos x|+C}" }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\int\\frac{e^x}{e^x+1}\\,dx$ を求めよう。',
        hint: '分母を微分すると $(e^x+1)\'=e^x$。分子と同じです。',
        ans: '$\\log(e^x+1)+C$　（$e^x+1>0$ なので絶対値はいらない）',
        after: '$t=e^x+1$ とおいても同じです。まず「分母を微分すると分子になるか」を見ます。',
        add: [{ t: 'm', tex: "\\int\\frac{e^x}{e^x+1}\\,dx=\\int\\frac{(e^x+1)'}{e^x+1}\\,dx=\\ans{\\log(e^x+1)+C}" }] } },

      // ---------- √ ----------
      { clear: true, cols: [0.6, 0.4], part: '√ をふくむ式', say: '$\\displaystyle\\int x\\sqrt{x+1}\\,dx$ は、$\\sqrt{x+1}$ ごと $t$ とおきます。$t=\\sqrt{x+1}$ から $x=t^2-1$。このように $x=g(t)$ の形で使うこともできます。',
        add: [{ t: 'h', text: '√ をふくむ式　∫x√(x+1) dx' },
          { t: 'm', tex: 't=\\sqrt{x+1}\\ \\text{とおくと}\\quad x=t^2-1' },
          { t: 'box', c: 'b', col: 1, size: 'sm', label: '公式', text: "$x=g(t)$ とおくと　$dx=g'(t)\\,dt$\n$\\displaystyle\\int f(x)\\,dx=\\int f(g(t))\\,g'(t)\\,dt$" },
          { t: 'box', c: 'g', col: 1, size: 'sm', label: '手順', text: '① $t=\\sqrt{x+1}$ とおく\n② $x$ と $dx$ を $t$ で表す\n③ $t$ で積分する\n④ $x$ の式にもどす' }] },
      { ask: { type: 'choice', q: '$x=t^2-1$ のとき、$dx$ は？',
        opts: ['$dx=2t\\,dt$', '$dx=dt$', '$dx=\\dfrac{dt}{2t}$', '$dx=t\\,dt$'], ok: 0,
        why: { 1: '$x$ と $t$ はちがう文字なので、$dx$ と $dt$ も同じではありません。$\\dfrac{dx}{dt}$ を計算します。', 2: '$\\dfrac{dx}{dt}=2t$ です。逆数にしています。', 3: '$t^2$ を微分すると $2t$。2 を忘れています。' },
        good: '$\\dfrac{dx}{dt}=2t$ なので、$dx=2t\\,dt$。',
        add: [{ t: 'm', tex: 'dx=2t\\,dt', note: '$\\dfrac{dx}{dt}=2t$' }] } },
      { say: 'あとは $t$ の整式の積分です。最後に $t=\\sqrt{x+1}$ にもどし、$(x+1)\\sqrt{x+1}$ でくくって整理します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int x\\sqrt{x+1}\\,dx&=\\int(t^2-1)\\cdot t\\cdot2t\\,dt=\\int(2t^4-2t^2)\\,dt\\\\ &=\\frac25t^5-\\frac23t^3+C=\\frac{2}{15}t^3(3t^2-5)+C\\\\ &=\\ans{\\frac{2}{15}(3x-2)(x+1)\\sqrt{x+1}+C}\\end{aligned}' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、積の微分を逆に読む **部分積分法** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
