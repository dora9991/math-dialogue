/* 数学Ⅲ 第3章 積分法 不定積分 ③：部分積分法
   例・数値はすべて自作。答え・誤答は python3（sympy）で「微分してもとにもどるか」を検算ずみ。
   ∫xeˣdx=(x−1)eˣ+C、∫xe²ˣdx=(2x−1)e²ˣ/4+C、∫xcosx dx=xsinx+cosx+C、∫xsinx dx=−xcosx+sinx+C、
   ∫logx dx=xlogx−x+C、∫xlogx dx=(x²/2)logx−x²/4+C、考えてみよう ∫x²eˣdx=(x²−2x+2)eˣ+C */
(function () {
  const POINTS = [
    "積の微分から　$\\displaystyle\\int f(x)g'(x)\\,dx=f(x)g(x)-\\int f'(x)g(x)\\,dx$（**部分積分法**）",
    "$f$ は **微分すると簡単になるもの**（$x$ の整式・$\\log x$）、$g'$ は **積分しやすいもの**（$e^x$・$\\sin x$・$\\cos x$）を選ぶ",
    "$\\log x$ は $(x)'\\log x$ と見る。$x^2e^x$ のように、部分積分を2回くり返すこともある。答えは微分して検算"
  ];
  const roles = (f, df, g1, g) => ({ t: 'tbl', col: 1, rows: [["$f(x)=" + f + "$", '微分 →', "$f'(x)=" + df + "$"], ["$g'(x)=" + g1 + "$", '積分 →', '$g(x)=' + g + '$']] });

  HB.lesson({
    id: 'm3c-03', field: '数学Ⅲ　積分法', title: '部分積分法', level: '不定積分', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題（不定積分を求めよ）',
      parts: ['(1)　$\\displaystyle\\int xe^x\\,dx$', '(2)　$\\displaystyle\\int x\\sin x\\,dx$', '(3)　$\\displaystyle\\int\\log x\\,dx$',
        '(4)　$\\displaystyle\\int x\\log x\\,dx$', '(5)　$\\displaystyle\\int x^2e^x\\,dx$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、合成関数の微分を逆に読む置換積分法を学びました。この時間は **積の微分** を逆に読む **部分積分法** です。$xe^x$ や $\\log x$ が積分できるようになります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '積の微分の公式から、部分積分法の公式を導ける\n$f$ と $g\'$ をうまく選んで、$xe^x$・$x\\sin x$・$\\log x$ などの不定積分を求められる' }] },

      // ---------- 公式 ----------
      { clear: true, cols: [0.62, 0.38], part: '部分積分法', say: '積の微分は $\\{f(x)g(x)\\}\'=f\'(x)g(x)+f(x)g\'(x)$。両辺を積分して、右の1つを左へ移すと、部分積分法の公式ができます。',
        add: [{ t: 'h', text: '部分積分法' },
          { t: 'm', tex: "\\{f(x)g(x)\\}'=f'(x)g(x)+f(x)g'(x)", note: '積の微分' },
          { t: 'm', tex: "f(x)g(x)=\\int f'(x)g(x)\\,dx+\\int f(x)g'(x)\\,dx", note: '両辺を積分' },
          { t: 'box', c: 'y', label: '公式', text: "$\\displaystyle\\int f(x)g'(x)\\,dx=f(x)g(x)-\\int f'(x)g(x)\\,dx$" },
          { t: 'box', c: 'b', col: 1, size: 'sm', label: '使い方', text: "左の積分の中の\n・$f$ は **微分** して\n・$g'$ は **積分** して使う\n右の $\\int$ が、左より簡単になればよい" }] },

      // ---------- xe^x ----------
      { clear: true, part: '例　xeˣ', say: '例：$\\displaystyle\\int xe^x\\,dx$。$f(x)=x$、$g\'(x)=e^x$ と見ます。$f\'(x)=1$、$g(x)=e^x$ です。',
        add: [{ t: 'h', text: '例　∫xeˣ dx' }, roles('x', '1', 'e^x', 'e^x'),
          { t: 'm', tex: '\\int x\\,e^x\\,dx=x\\cdot e^x-\\int 1\\cdot e^x\\,dx', note: '$fg-\\int f\'g\\,dx$' }] },
      { say: '右の積分は $\\displaystyle\\int e^x\\,dx=e^x$。$x$ が消えて、簡単な積分になりました。',
        add: [{ t: 'm', tex: '\\hphantom{\\int x\\,e^x\\,dx}=xe^x-e^x+C=\\ans{(x-1)e^x+C}', note: '$C$ は積分定数' }] },
      { say: '検算です。積の微分で $\\{(x-1)e^x\\}\'=e^x+(x-1)e^x=xe^x$。もとにもどりました。',
        add: [{ t: 'p', size: 'sm', text: "検算：$\\{(x-1)e^x\\}'=1\\cdot e^x+(x-1)e^x=xe^x$" }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int xe^{2x}\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$(x-1)e^{2x}$', '$\\dfrac{x-1}{2}e^{2x}$', '$\\dfrac{2x-1}{4}e^{2x}$', '$\\dfrac{2x-1}{2}e^{2x}$'], ok: 2,
        why: { 0: '$e^{2x}$ の積分は $\\dfrac12e^{2x}$（前の時間の1次式の公式）。$xe^x$ の答えをまねしています。', 1: '右の $\\int\\dfrac12e^{2x}\\,dx$ も、もう一度 $\\dfrac12$ がかかって $\\dfrac14e^{2x}$ です。', 3: '$g\'=e^{2x}$ なら $g=\\dfrac12e^{2x}$。最初の $\\dfrac12$ を忘れています。' },
        good: '$g=\\dfrac12e^{2x}$ として　$\\dfrac x2e^{2x}-\\displaystyle\\int\\frac12e^{2x}\\,dx=\\frac x2e^{2x}-\\frac14e^{2x}+C$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int xe^{2x}\\,dx=\\frac x2e^{2x}-\\int\\frac12e^{2x}\\,dx=\\ans{\\frac{2x-1}{4}e^{2x}+C}', note: '$g=\\dfrac12e^{2x}$' }] } },

      // ---------- 三角関数との積 ----------
      { clear: true, cols: [1], part: '三角関数との積', say: '$\\displaystyle\\int x\\cos x\\,dx$ を考えます。$f$ と $g\'$ の選び方は2通りありますが、うまくいくのは片方だけです。',
        add: [{ t: 'h', text: '三角関数との積　∫x cos x dx' }],
        ask: { type: 'choice', q: '$\\displaystyle\\int x\\cos x\\,dx$ で、うまくいく選び方は？',
        opts: ["$f=\\cos x,\\ \\ g'=x$", "$f=x,\\ \\ g'=\\cos x$"], ok: 1,
        why: { 0: '$g=\\dfrac{x^2}{2}$ となり、右の積分 $\\displaystyle\\int\\frac{x^2}{2}(-\\sin x)\\,dx$ が、もとより複雑になります。' },
        good: '$f=x$ なら $f\'=1$ で、右の積分から $x$ が消えます。',
        add: [{ t: 'm', tex: '\\int x\\cos x\\,dx=x\\sin x-\\int1\\cdot\\sin x\\,dx=x\\sin x+\\cos x+C', note: "$f=x,\\ g'=\\cos x$" }] } },
      { ask: { type: 'choice', q: '$\\displaystyle\\int x\\sin x\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$x\\cos x-\\sin x$', '$-x\\cos x-\\sin x$', '$-\\dfrac{x^2}{2}\\cos x$', '$-x\\cos x+\\sin x$'], ok: 3,
        why: { 0: '$\\sin x$ を積分すると $-\\cos x$。$g=\\cos x$ としています。', 1: '$-\\int(-\\cos x)\\,dx=+\\int\\cos x\\,dx=+\\sin x$。マイナスが2つ重なります。', 2: '積の積分は、それぞれを積分してかけたものではありません。' },
        good: '$g=-\\cos x$ として　$-x\\cos x+\\displaystyle\\int\\cos x\\,dx=-x\\cos x+\\sin x+C$。',
        add: [{ t: 'm', tex: '\\int x\\sin x\\,dx=x(-\\cos x)-\\int1\\cdot(-\\cos x)\\,dx=\\ans{-x\\cos x+\\sin x+C}' }] } },

      // ---------- log x ----------
      { clear: true, part: 'log x の積分', say: '$\\displaystyle\\int\\log x\\,dx$ は、かけ算に見えません。そこで $\\log x=(x)\'\\log x$ と見て、$f=\\log x$、$g\'=1$ とします。',
        add: [{ t: 'h', text: '∫log x dx' }, roles('\\log x', '\\dfrac1x', '1', 'x'),
          { t: 'm', tex: "\\begin{aligned}\\int\\log x\\,dx&=\\int(x)'\\log x\\,dx\\\\ &=x\\log x-\\int x\\cdot\\frac1x\\,dx\\\\ &=\\ans{x\\log x-x+C}\\end{aligned}" }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int x\\log x\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$\\dfrac{x^2}{2}\\log x-\\dfrac{x^2}{4}$', '$\\dfrac{x^2}{2}\\log x-\\dfrac{x^2}{2}$', '$\\dfrac{x^2}{2}\\log x+\\dfrac{x^2}{4}$', '$\\dfrac{(\\log x)^2}{2}$'], ok: 0,
        why: { 1: '$\\displaystyle\\int\\frac{x^2}{2}\\cdot\\frac1x\\,dx=\\int\\frac x2\\,dx=\\frac{x^2}{4}$。積分し忘れています。', 2: '公式は $fg-\\int f\'g\\,dx$。ひき算です。', 3: 'それは $\\displaystyle\\int\\frac{\\log x}{x}\\,dx$（置換積分）の答えです。' },
        good: '$f=\\log x,\\ g\'=x$ として　$\\dfrac{x^2}{2}\\log x-\\displaystyle\\int\\frac x2\\,dx$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int x\\log x\\,dx=\\frac{x^2}{2}\\log x-\\int\\frac{x^2}{2}\\cdot\\frac1x\\,dx=\\ans{\\frac{x^2}{2}\\log x-\\frac{x^2}{4}+C}' }] } },

      // ---------- 選び方 ----------
      { clear: true, cols: [1], part: '選び方のコツ', say: 'どちらを $f$（微分する側）にするかのコツです。$x$ の整式は微分すると次数が下がり、$\\log x$ は微分すると $\\dfrac1x$ になって簡単になります。',
        add: [{ t: 'h', text: 'f と g′ の選び方' },
          { t: 'tbl', cls: 'rowh', rows: [['$f$（微分する側）', "$g'$（積分する側）"], ['$x$ の整式、$\\log x$', '$e^x$、$\\sin x$、$\\cos x$']] },
          { t: 'p', size: 'sm', text: '右の $\\int$ が、左の $\\int$ より簡単になるように選ぶ' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\int x^2e^x\\,dx$ を求めよう。',
        hint: '$f=x^2,\\ g\'=e^x$ で1回。残った $\\int2xe^x\\,dx$ には、さっきの $\\int xe^x\\,dx=(x-1)e^x$ が使えます。',
        ans: '$x^2e^x-2(x-1)e^x+C=(x^2-2x+2)e^x+C$',
        after: '$x^2$ は2回微分すると定数になるので、部分積分を **2回** くり返します。',
        add: [{ t: 'm', tex: '\\begin{aligned}\\int x^2e^x\\,dx&=x^2e^x-\\int2xe^x\\,dx\\\\ &=x^2e^x-2(x-1)e^x+C=\\ans{(x^2-2x+2)e^x+C}\\end{aligned}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角関数の積や分数関数など、**式を変形してから** 積分する関数を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
