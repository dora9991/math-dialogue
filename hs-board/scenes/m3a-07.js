/* 数学Ⅲ 第1章 関数と極限 ⑦：関数の極限
   例はすべて自作。極限値・片側極限・係数の値は python3（sympy の limit）で検算ずみ。 */
(function () {
  const POINTS = [
    '$\\dfrac00$ の形は、**約分** または **有理化** してから $x\\to a$ とする（$x\\neq a$ だから約分できる）',
    '**右側極限 $x\\to a+0$ と左側極限 $x\\to a-0$** が一致するときだけ $\\displaystyle\\lim_{x\\to a}f(x)$ がある。$x\\to-\\infty$ は $x=-t$ とおきかえると安全',
    '分母 $\\to0$ で極限値があるなら、**分子 $\\to0$ が必要**。この条件から係数を決め、最後に極限値の条件を使う'
  ];

  HB.lesson({
    id: 'm3a-07', field: '数学Ⅲ　関数と極限', title: '関数の極限', level: '関数の極限', time: '目安 8分',
    problem: { label: '例題', lead: '次の問いに答えよ。',
      parts: ['(1)　$\\displaystyle\\lim_{x\\to-1}\\frac{x^2+3x+2}{x^2-1}$　　(2)　$\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{x+9}-3}{x}$',
        '(3)　$\\displaystyle\\lim_{x\\to2-0}\\frac{1}{x-2}$　　(4)　$\\displaystyle\\lim_{x\\to-\\infty}(\\sqrt{x^2+2x}+x)$',
        '(5)　$\\displaystyle\\lim_{x\\to-1}\\frac{x^2+ax+b}{x+1}=3$ となるような定数 $a,\\ b$ の値'] },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: 'めあて', say: '前の時間までは数列の極限でした。この時間は、関数 $f(x)$ で $x$ をある値に近づけたときの極限です。数学Ⅱの微分係数で使った $\\lim$ と同じものです。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$\\dfrac00$ の形の極限を、約分・有理化で求められる\n**片側極限** と、$x\\to\\pm\\infty$ の極限を求められる\n極限値の条件から、係数を決められる' }] },

      // ---------- x→a ----------
      { clear: true, cols: [1], part: 'x→a の極限', say: '$x$ が $a$ と異なる値をとりながら $a$ に限りなく近づくとき、$f(x)$ が $\\alpha$ に近づくなら、$\\alpha$ を極限値といいます。多項式なら、そのまま代入して求められます。',
        add: [{ t: 'h', text: '関数の極限' },
          { t: 'box', c: 'b', label: '定義', text: '$x\\neq a$ のまま $x\\to a$ のとき $f(x)\\to\\alpha$　なら　$\\displaystyle\\lim_{x\\to a}f(x)=\\alpha$' },
          { t: 'm', tex: '\\lim_{x\\to2}(x^2+3x)=4+6=10', note: '多項式は代入してよい' }] },

      // ---------- 0/0 ----------
      { clear: true, part: '0/0 の形', say: '$\\dfrac{x^2-x-6}{x-3}$ は、$x=3$ を代入すると $\\dfrac00$ になります。$x\\neq3$ なので $x-3$ で **約分** してから近づけます。',
        add: [{ t: 'h', text: '$\\dfrac00$ の形（約分）' },
          { t: 'm', tex: '\\begin{aligned}\\lim_{x\\to3}\\frac{x^2-x-6}{x-3}&=\\lim_{x\\to3}\\frac{(x-3)(x+2)}{x-3}\\\\ &=\\lim_{x\\to3}(x+2)=\\ans{5}\\end{aligned}' },
          { t: 'fig', id: 'h1', col: 1, view: [-2.6, -1.2, 5.4, 7.6], w: 400, h: 440, items: [
            { k: 'axes', tx: [-2, 3], ty: [2, 5] },
            { k: 'line', m: 1, n: 2, a: -2.6, b: 5.4, c: 'y', label: 'y=x+2（x≠3）', lat: [0.3, 6.6], la: 'start' }] }] },
      { say: 'グラフは、直線 $y=x+2$ から点 $(3,\\ 5)$ をぬいたもの。$x=3$ では値がありませんが、$x\\to3$ のときに近づく先（極限値）は $5$ です。',
        add: [{ t: 'p', size: 'sm', text: '$f(3)$ は定義されていないが、極限値は $5$\n→ 極限は「近づく先」で、$x=a$ での値とは別のもの' }],
        draw: [{ fig: 'h1', items: [{ k: 'seg', a: [3, 0], b: [3, 4.85], dash: true, c: 'b', wd: 2 }, { k: 'seg', a: [0, 5], b: [2.85, 5], dash: true, c: 'b', wd: 2 }, { k: 'pt', at: [3, 5], open: true, c: 'y', r: 7 }] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to-1}\\frac{x^2+3x+2}{x^2-1}$ の値は？',
        opts: ['$-\\dfrac12$', '$\\dfrac12$', '$0$', '求められない'], ok: 0,
        why: { 1: '$\\dfrac{x+2}{x-1}$ に $x=-1$ を入れると $\\dfrac{1}{-2}$。分母の符号に注意。', 2: '分子だけを見ていますが、分母も $0$ に近づきます。約分してから。', 3: '$\\dfrac00$ の形でも、$x\\neq-1$ なので $x+1$ で約分すれば求められます。' },
        good: '$\\dfrac{(x+1)(x+2)}{(x+1)(x-1)}=\\dfrac{x+2}{x-1}\\to\\dfrac{1}{-2}=-\\dfrac12$。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{x\\to-1}\\frac{(x+1)(x+2)}{(x+1)(x-1)}=\\lim_{x\\to-1}\\frac{x+2}{x-1}=\\ans{-\\frac12}' }] } },

      // ---------- 有理化 ----------
      { clear: true, cols: [1], part: '有理化', say: '$\\dfrac{\\sqrt{x+9}-3}{x}$ も、$x\\to0$ で $\\dfrac00$ の形。$\\sqrt{\\ \\ }$ があるときは、分子を **有理化** すると $x$ で約分できるようになります。',
        add: [{ t: 'h', text: '$\\dfrac00$ の形（有理化）' },
          { t: 'm', tex: '\\frac{\\sqrt{x+9}-3}{x}=\\frac{(\\sqrt{x+9}-3)(\\sqrt{x+9}+3)}{x(\\sqrt{x+9}+3)}=\\frac{\\hy{x}}{\\hy{x}(\\sqrt{x+9}+3)}=\\frac{1}{\\sqrt{x+9}+3}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{x+9}-3}{x}$ の値は？',
        opts: ['$0$', '$\\dfrac16$', '$\\dfrac13$', '$6$'], ok: 1,
        why: { 0: '分子が $0$ に近づいても、分母も $0$ に近づくので、$0$ とは決まりません。', 2: '分母は $\\sqrt{9}+3=6$。$\\sqrt9$ だけで割っています。', 3: '分母と分子が逆です。' },
        good: '$\\dfrac{1}{\\sqrt{x+9}+3}\\to\\dfrac{1}{3+3}=\\dfrac16$。',
        add: [{ t: 'm', tex: '\\lim_{x\\to0}\\frac{1}{\\sqrt{x+9}+3}=\\frac{1}{3+3}=\\ans{\\frac16}' }] } },

      // ---------- 片側極限 ----------
      { clear: true, part: '片側極限', say: '$y=\\dfrac1x$ で $x\\to0$ とします。正の側から近づける（$x\\to+0$）と $\\infty$、負の側から（$x\\to-0$）だと $-\\infty$。近づける向きで結果が変わります。',
        add: [{ t: 'h', text: '右側極限・左側極限' },
          { t: 'm', tex: '\\lim_{x\\to+0}\\frac1x=\\infty,\\qquad \\lim_{x\\to-0}\\frac1x=-\\infty', note: '$x\\to+0$：右から\n$x\\to-0$：左から' },
          { t: 'fig', id: 'k1', col: 1, view: [-3.2, -3.6, 3.2, 3.6], w: 440, h: 495, items: [
            { k: 'axes', tx: [-2, 2], ty: [-2, 2] },
            { k: 'fn', f: '1/x', a: 0.2, b: 3.2, c: 'y', label: 'y=1/x', lat: [1.3, 1.4] }, { k: 'fn', f: '1/x', a: -3.2, b: -0.2, c: 'y' },
            { k: 'vec', a: [1.2, 3.0], b: [0.45, 3.0], c: 'p' }, { k: 'label', at: [1.25, 3.0], text: 'x→+0', c: 'p', size: 22, anchor: 'start' },
            { k: 'vec', a: [-1.2, -3.0], b: [-0.45, -3.0], c: 'b' }, { k: 'label', at: [-1.25, -3.0], text: 'x→−0', c: 'b', size: 22, anchor: 'end' }] }] },
      { say: '右側極限と左側極限が同じ値 $\\alpha$ のときだけ、$\\displaystyle\\lim_{x\\to a}f(x)=\\alpha$ です。$\\dfrac1x$ は一致しないので、$x\\to0$ の極限はありません。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '極限があるとき', text: '$\\displaystyle\\lim_{x\\to a+0}f(x)=\\lim_{x\\to a-0}f(x)=\\alpha$ なら $\\displaystyle\\lim_{x\\to a}f(x)=\\alpha$\n例：$\\dfrac1{x^2}$ は左右どちらも $\\infty$ なので $\\displaystyle\\lim_{x\\to0}\\frac1{x^2}=\\infty$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to2-0}\\frac{1}{x-2}$ は？',
        opts: ['$\\infty$', '$-\\infty$', '$0$', '存在しない'], ok: 1,
        why: { 0: '$x<2$ の側から近づくので $x-2<0$。分母は負のまま $0$ に近づきます。', 2: '分母が $0$ に近づくと、絶対値は限りなく大きくなります。', 3: '左側だけを見れば $-\\infty$ に発散します。「ない」のは両側の極限の方です。' },
        good: '$x-2$ は負の値をとりながら $0$ に近づくので、$\\dfrac{1}{x-2}\\to-\\infty$。' } },

      // ---------- x→±∞ ----------
      { clear: true, cols: [1], part: 'x→±∞', say: '$x\\to\\infty$ のときも、数列と同じ考え方です。$\\dfrac{\\infty}{\\infty}$ の形は、分母の最高次の項で割ります。',
        add: [{ t: 'h', text: '$x\\to\\infty,\\ x\\to-\\infty$ の極限' },
          { t: 'm', tex: '\\lim_{x\\to\\infty}\\frac{2x^2+1}{x^2-3x}=\\lim_{x\\to\\infty}\\frac{2+\\frac{1}{x^2}}{1-\\frac3x}=2', note: '$x^2$ で割る' }] },
      { say: '$x\\to-\\infty$ で $\\sqrt{\\ \\ }$ をふくむときは、**$x=-t$ とおきかえて $t\\to\\infty$** にすると、符号のまちがいを防げます。',
        add: [{ t: 'm', tex: '\\lim_{x\\to-\\infty}(\\sqrt{x^2+2x}+x)=\\lim_{t\\to\\infty}(\\sqrt{t^2-2t}-t)', note: '$x=-t$ とおく\n（$x\\to-\\infty$ のとき $t\\to\\infty$）' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\lim_{t\\to\\infty}(\\sqrt{t^2-2t}-t)$ を計算して、$\\displaystyle\\lim_{x\\to-\\infty}(\\sqrt{x^2+2x}+x)$ を求めよう。',
        hint: '前の時間と同じく有理化。分子は $(t^2-2t)-t^2=-2t$。',
        ans: '$\\dfrac{-2t}{\\sqrt{t^2-2t}+t}=\\dfrac{-2}{\\sqrt{1-\\frac2t}+1}\\to\\dfrac{-2}{2}=-1$',
        after: 'おきかえずに $x$ で割るなら、$x<0$ では $\\sqrt{x^2}=|x|=-x$ になることに注意します。',
        add: [{ t: 'm', tex: '=\\lim_{t\\to\\infty}\\frac{-2t}{\\sqrt{t^2-2t}+t}=\\lim_{t\\to\\infty}\\frac{-2}{\\sqrt{1-\\frac2t}+1}=\\ans{-1}' }] } },

      // ---------- 係数を決める ----------
      { clear: true, cols: [1], part: '係数を決める', say: '$\\displaystyle\\lim_{x\\to-1}\\frac{x^2+ax+b}{x+1}=3$ となる $a,\\ b$ を求めます。分母は $0$ に近づくのに、極限値 $3$ がある。ここがポイントです。',
        add: [{ t: 'h', text: '極限値から係数を決める' },
          { t: 'm', tex: '\\lim_{x\\to-1}\\frac{x^2+ax+b}{x+1}=3' },
          { t: 'box', c: 'p', size: 'sm', label: '必要条件', text: '分母 $\\to0$ で極限値をもつなら、**分子 $\\to0$**（そうでなければ $\\pm\\infty$ に発散してしまう）' }] },
      { ask: { type: 'choice', q: 'このとき、$a,\\ b$ について必ず成り立つ式は？',
        opts: ['$1-a+b=3$', '$1+a+b=0$', '$b=3$', '$1-a+b=0$'], ok: 3,
        why: { 0: '分子は $0$ に近づく必要があります。$3$ は約分したあとの極限値です。', 1: '$x=-1$ を代入すると $(-1)^2+a\\cdot(-1)+b=1-a+b$。', 2: '分子に $x=-1$ を代入した式が $0$ になる、が条件です。' },
        good: '分子 $\\to1-a+b$ が $0$ でないと、全体は発散します。だから $1-a+b=0$、つまり $b=a-1$。',
        add: [{ t: 'm', tex: '1-a+b=0\\qquad \\therefore\\ b=a-1' }] } },
      { say: '$b=a-1$ を代入すると、分子は $(x+1)(x+a-1)$ と因数分解でき、約分できます。極限値は $a-2$ なので、$a-2=3$ から $a=5,\\ b=4$。',
        add: [{ t: 'm', tex: '\\frac{x^2+ax+a-1}{x+1}=\\frac{(x+1)(x+a-1)}{x+1}=x+a-1\\ \\to\\ a-2', note: '$x\\to-1$' },
          { t: 'ans', label: '答', tex: 'a-2=3\\ \\text{より}\\quad a=5,\\ \\ b=4' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角関数の極限です。$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1$ という、とても大事な極限を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
