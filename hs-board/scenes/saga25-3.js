/* 2025 佐賀大 理系 第3問の類題（自作）：数学Ⅲ 微分法・積分法・極限 ― (log x)ⁿ/√x の最大値 → 極限 → 部分積分の漸化式
   元の問題はうつしていない（「対数のべきを変数で割った関数の極値」「それを使って極限が 0 を示す」「上端を無限大にした積分の数列の
   漸化式を部分積分で作り一般項を求める」というねらいと形式だけを合わせた自作問題。関数は (log x)ⁿ/√x、積分の下端は e）。
   答え（python3・sympy で検算ずみ）：
   (1) f'(x)=(log x)^{n−1}(2n−log x)/(2x√x)、x=e^{2n} で最大値 (2n/e)ⁿ
   (2) x>1 で 0<(log x)ⁿ/x = f(x)/√x ≦ (2n/e)ⁿ/√x → 0（はさみうち）
   (3) L₀=1/e、L_n = 1/e + n L_{n−1}、L_n/n! = L_{n−1}/(n−1)! + 1/(e·n!) より L_n = (n!/e)Σ_{k=0}^{n} 1/k!
       （sympy の積分で n=0〜5：1/e, 2/e, 5/e, 16/e, 65/e, 326/e と一致） */
(function () {
  const POINTS = [
    '$\\dfrac{(\\log x)^n}{\\sqrt x}$ は $x=e^{2n}$ で最大値 $\\left(\\dfrac{2n}{e}\\right)^n$。微分は $(\\log x)^{n-1}$ をくくり出して符号を見る',
    '「→0 を示せ」は **はさみうち**。$\\dfrac{(\\log x)^n}{x}=f(x)\\cdot\\dfrac1{\\sqrt x}\\leqq\\dfrac{M}{\\sqrt x}$ のように、(1) の最大値で上からおさえる',
    '$\\int(\\log x)^n\\cdot\\frac1{x^2}\\,dx$ は $(\\log x)^n$ を微分する側にして部分積分。$L_n=nL_{n-1}+\\frac1e$ は **両辺を $n!$ で割る**'
  ];
  const E2 = Math.E ** 2;
  const g1 = (id, items) => ({ t: 'fig', id, col: 1, view: [-3, -0.22, 44, 0.98], w: 560, h: 300, items: [
    { k: 'axes', tx: [[1, '1'], [E2, 'e²'], 20, 40], ty: [[2 / Math.E, '2/e']] },
    { k: 'fn', f: 'log(x)/sqrt(x)', a: 1, b: 43.5, c: 'w', label: 'n = 1', lat: [30, 0.78] }].concat(items || []) });
  const g2 = (id, items) => ({ t: 'fig', id, col: 1, view: [-3, -0.15, 44, 0.9], w: 560, h: 290, items: [
    { k: 'axes', tx: [[1, '1'], 20, 40], ty: [] },
    { k: 'fn', f: '(2/E)/sqrt(x)', a: 1, b: 43.5, c: 'p', label: 'M/√x', lat: [31, 0.25] },
    { k: 'fn', f: 'log(x)/x', a: 1, b: 43.5, c: 'w', label: '(log x)/x', lat: [24, 0.035], la: 'start' }].concat(items || []) });

  HB.lesson({
    id: 'saga25-3', field: '佐賀大型　数学（理系）', title: '2025 佐賀大 理系 第3問の類題 ― 対数の最大値・極限と積分の漸化式', level: '2025年度 佐賀大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$n$ を 0 以上の整数とする。$\\log x$ は $x$ の自然対数、$e$ は自然対数の底である。',
      parts: [
        '(1)　$n\\geqq1$ のとき、関数 $f(x)=\\dfrac{(\\log x)^n}{\\sqrt x}\\ \\ (x\\geqq1)$ の最大値を求めよ。',
        '(2)　$n\\geqq1$ のとき、$\\displaystyle\\lim_{x\\to\\infty}\\frac{(\\log x)^n}{x}=0$ を示せ。',
        '(3)　$\\displaystyle L_n=\\lim_{t\\to\\infty}\\int_e^t\\frac{(\\log x)^n}{x^2}\\,dx$ とする。$L_0$ を求めよ。また、$n\\geqq1$ のとき $L_n$ を $L_{n-1}$ を用いて表し、$L_n$ を $n$ の式で表せ。'
      ],
      src: '※ 2025年度 佐賀大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '対数関数の微分・極限・積分を、1本の流れでつなぐ問題です。(1) の結果が (2) に、(2) の結果が (3) に使われます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: '(3) で部分積分をすると $\\dfrac{(\\log t)^n}{t}$ という項が出ます。その極限が (2)。そして (2) を示す道具が (1) の最大値です。',
        add: [{ t: 'h', text: '小問のつながり' },
          { t: 'tbl', cls: 'rowh', rows: [['小問', 'すること', '次への役目'], ['(1)', '$\\dfrac{(\\log x)^n}{\\sqrt x}$ の最大値 $M$', '(2) で「上からおさえる」'], ['(2)', '$\\dfrac{(\\log x)^n}{x}\\to0$', '(3) の部分積分で出る項が消える'], ['(3)', '漸化式 → 一般項', '']] },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '前の小問の結果を「どこで使うか」を考えながら進める。誘導に乗るのが、記述式の入試でいちばん確実な道です。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$f(x)$ を $(\\log x)^n$ と $\\dfrac1{\\sqrt x}$ の積と見て、積の微分をします。$\\{(\\log x)^n\\}\'=n(\\log x)^{n-1}\\cdot\\dfrac1x$ です。',
        add: [{ t: 'h', text: '(1)　f(x) の最大値' },
          { t: 'm', tex: 'f(x)=(\\log x)^n\\cdot\\frac1{\\sqrt x}\\quad(x\\geqq1)' },
          g1('f1')] },
      { ask: { type: 'choice', q: "$f'(x)$ は？",
        opts: ['$\\dfrac{(\\log x)^{n-1}(n-\\log x)}{2x\\sqrt x}$', '$\\dfrac{n(\\log x)^{n-1}}{x\\sqrt x}$', '$\\dfrac{(\\log x)^{n-1}(2n+\\log x)}{2x\\sqrt x}$', '$\\dfrac{(\\log x)^{n-1}(2n-\\log x)}{2x\\sqrt x}$'], ok: 3,
        why: { 0: '通分で 2 をそろえ忘れています。$\\frac{n}{x\\sqrt x}=\\frac{2n}{2x\\sqrt x}$ です。', 1: '$(\\log x)^n$ だけを微分しています。$\\frac1{\\sqrt x}$ の微分も入ります。', 2: '$\\left(\\frac1{\\sqrt x}\\right)\'=-\\frac1{2x\\sqrt x}$。マイナスがつきます。' },
        good: "$f'(x)=\\dfrac{n(\\log x)^{n-1}}{x\\sqrt x}-\\dfrac{(\\log x)^n}{2x\\sqrt x}$ を通分して、$(\\log x)^{n-1}$ でくくります。",
        add: [{ t: 'm', tex: "f'(x)=\\frac{(\\log x)^{n-1}(2n-\\log x)}{2x\\sqrt x}" }] } },
      { say: '$x>1$ では $(\\log x)^{n-1}>0$ なので、符号は $2n-\\log x$ で決まります。$x=e^{2n}$ を境に、増加から減少に変わります。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['$x$', '$1$', '$\\cdots$', '$e^{2n}$', '$\\cdots$'], ["$f'(x)$", '', '$+$', '$0$', '$-$'], ['$f(x)$', '$0$', '↗', '最大', '↘']] }],
        draw: [{ fig: 'f1', items: [{ k: 'seg', a: [E2, 0], b: [E2, 2 / Math.E], dash: true, c: 'y', wd: 2 }, { k: 'pt', at: [E2, 2 / Math.E], c: 'y' }] }] },
      { ask: { type: 'choice', q: '最大値 $f(e^{2n})$ は？',
        opts: ['$\\left(\\dfrac{2n}{e}\\right)^n$', '$\\dfrac{(2n)^n}{e^{2n}}$', '$\\left(\\dfrac{n}{e}\\right)^n$', '$\\dfrac{2n}{e}$'], ok: 0,
        why: { 1: '$\\sqrt{e^{2n}}=e^n$ です。ルートをとり忘れています。', 2: '$\\log e^{2n}=2n$。2 が落ちています。', 3: '分子は $(\\log e^{2n})^n=(2n)^n$。$n$ 乗が落ちています。' },
        good: '$f(e^{2n})=\\dfrac{(2n)^n}{e^n}=\\left(\\dfrac{2n}{e}\\right)^n$。$n=1$ なら $\\dfrac2e$（図の山の高さ）。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\left(\\frac{2n}{e}\\right)^n\\quad(x=e^{2n}\\text{ のとき})' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。(1) の最大値を $M=\\left(\\frac{2n}{e}\\right)^n$ とおきます。ねらう式を $f(x)$ と $\\dfrac1{\\sqrt x}$ の積に分けるのがポイントです。',
        add: [{ t: 'h', text: '(2)　(log x)ⁿ / x → 0 を示す' },
          { t: 'm', tex: '\\frac{(\\log x)^n}{x}=\\frac{(\\log x)^n}{\\sqrt x}\\cdot\\frac1{\\sqrt x}=f(x)\\cdot\\frac1{\\sqrt x}' },
          { t: 'p', size: 'sm', text: '(1) より　$0\\leqq f(x)\\leqq M$　（$x\\geqq1$）' },
          g2('f2')] },
      { ask: { type: 'choice', q: '$x>1$ で $0<\\dfrac{(\\log x)^n}{x}\\leqq\\square$。はさみうちに使える $\\square$ は？',
        opts: ['$M$', '$\\dfrac{M}{x}$', '$\\dfrac{M}{\\sqrt x}$', '$M\\sqrt x$'], ok: 2,
        why: { 0: '正しい式ですが、右辺 $M$ は 0 に近づかないので、はさみうちになりません。', 1: '$(\\log x)^n\\leqq M$ は成り立ちません。(1) で分かるのは $(\\log x)^n\\leqq M\\sqrt x$。', 3: '$\\frac1{\\sqrt x}$ をかけるところを $\\sqrt x$ をかけています。' },
        good: '$f(x)\\leqq M$ の両辺に $\\dfrac1{\\sqrt x}$ をかけます。右辺 $\\dfrac{M}{\\sqrt x}$ は $x\\to\\infty$ で 0 に近づきます。',
        add: [{ t: 'm', tex: '0<\\frac{(\\log x)^n}{x}\\leqq\\frac{M}{\\sqrt x}\\quad(x>1)' }] } },
      { say: '$M$ は $x$ によらない定数なので、$\\dfrac{M}{\\sqrt x}\\to0$。**はさみうちの原理** で、示せました。図の白い曲線が、桃色の曲線と $x$ 軸にはさまれています。',
        add: [{ t: 'ans', label: '(2)', tex: '\\lim_{x\\to\\infty}\\frac{M}{\\sqrt x}=0\\ \\text{より}\\ \\lim_{x\\to\\infty}\\frac{(\\log x)^n}{x}=0' }] },
      { ask: { type: 'think', q: '(1) を使わずに $\\dfrac{(\\log x)^n}{x}\\leqq\\dfrac{M}{x}$ のように $\\dfrac1x$ のままおさえようとすると、なぜうまくいかない？',
        hint: '$\\dfrac{M}{x}$ でおさえるには、$(\\log x)^n\\leqq M$ がいる。$\\log x$ は上限なく大きくなる。',
        ans: '$(\\log x)^n$ はいくらでも大きくなるので、定数 $M$ ではおさえられない。だから $\\sqrt x$ を1つ分け、$\\frac{(\\log x)^n}{\\sqrt x}$ が有界であることを使う。',
        after: '「分母の $x$ を $\\sqrt x\\cdot\\sqrt x$ に分ける」のが、この型の定石です。' } },

      // ---------- (3) L0 と漸化式 ----------
      { clear: true, cols: [0.62, 0.38], part: '(3)', say: '(3) です。まず $L_0$。$n=0$ なら $(\\log x)^0=1$ なので、ただの $\\dfrac1{x^2}$ の積分です。',
        add: [{ t: 'h', text: '(3)　L₀ と漸化式' },
          { t: 'm', size: 'sm', tex: '\\int_e^t\\frac{dx}{x^2}=\\Big[-\\frac1x\\Big]_e^t=\\frac1e-\\frac1t' }] },
      { ask: { type: 'choice', q: '$L_0=\\displaystyle\\lim_{t\\to\\infty}\\left(\\frac1e-\\frac1t\\right)$ は？',
        opts: ['$1$', '$\\dfrac1e$', '$-\\dfrac1e$', '$e$'], ok: 1,
        why: { 0: '下端を 1 にしたときの値です。この問題の下端は $e$。', 2: '$\\Big[-\\frac1x\\Big]_e^t=-\\frac1t+\\frac1e$。符号に注意。', 3: '$\\frac1e$ の逆数になっています。' },
        good: '$\\dfrac1t\\to0$ なので $L_0=\\dfrac1e$。',
        add: [{ t: 'm', size: 'sm', tex: 'L_0=\\frac1e' }] } },
      { say: '$n\\geqq1$ では部分積分。$(\\log x)^n$ を **微分する側**、$\\dfrac1{x^2}$ を **積分する側**（$-\\dfrac1x$）にします。微分すると $\\log$ の次数が1つ下がり、$L_{n-1}$ の形が出ます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_e^t\\frac{(\\log x)^n}{x^2}dx=\\Big[-\\frac{(\\log x)^n}{x}\\Big]_e^t+n\\int_e^t\\frac{(\\log x)^{n-1}}{x^2}dx' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '部分積分', text: '$\\{(\\log x)^n\\}\'=\\dfrac{n(\\log x)^{n-1}}{x}$\n$\\left(-\\dfrac1x\\right)\'=\\dfrac1{x^2}$' }] },
      { ask: { type: 'choice', q: '$\\Big[-\\dfrac{(\\log x)^n}{x}\\Big]_e^t$ は？',
        opts: ['$-\\dfrac{(\\log t)^n}{t}$', '$\\dfrac{(\\log t)^n}{t}-\\dfrac1e$', '$-\\dfrac{(\\log t)^n}{t}-\\dfrac1e$', '$-\\dfrac{(\\log t)^n}{t}+\\dfrac1e$'], ok: 3,
        why: { 0: '下端 $x=e$ の値を忘れています。$\\log e=1$ なので 0 になりません。', 1: '全体の符号が逆です。', 2: '下端の値を引くので、$-\\left(-\\frac1e\\right)=+\\frac1e$。' },
        good: '$-\\dfrac{(\\log t)^n}{t}-\\left(-\\dfrac{(\\log e)^n}{e}\\right)=-\\dfrac{(\\log t)^n}{t}+\\dfrac1e$。',
        add: [{ t: 'm', size: 'sm', tex: '=-\\frac{(\\log t)^n}{t}+\\frac1e+n\\int_e^t\\frac{(\\log x)^{n-1}}{x^2}dx' }] } },
      { say: '$t\\to\\infty$ とします。(2) で第1項は 0。最後の積分は $L_{n-1}$ に近づきます（$L_{n-1}$ が存在すれば $L_n$ も存在する、と順に言えます）。',
        add: [{ t: 'p', size: 'sm', text: '(2) より　$\\dfrac{(\\log t)^n}{t}\\to0$' },
          { t: 'ans', label: '漸化式', tex: 'L_n=nL_{n-1}+\\frac1e\\quad(n\\geqq1)' }] },

      // ---------- (3) 一般項 ----------
      { clear: true, part: '(3) 一般項', say: '最後に一般項です。$L_n=nL_{n-1}+\\frac1e$ は、係数 $n$ が番号とともに変わる漸化式。等比型の解き方はそのままでは使えません。',
        add: [{ t: 'h', text: '(3)　Lₙ を n の式で' },
          { t: 'm', tex: 'L_n=nL_{n-1}+\\frac1e,\\qquad L_0=\\frac1e' }] },
      { ask: { type: 'choice', q: '係数 $n$ を消すには、両辺を何で割る？',
        opts: ['$n$', '$e$', '$n!$', '$L_{n-1}$'], ok: 2,
        why: { 0: '$\\frac{L_n}{n}=L_{n-1}+\\cdots$ となり、左右で形がそろいません。', 1: '定数で割っても、係数 $n$ は残ります。', 3: '$L_{n-1}$ で割ると、式がかえって複雑になります。' },
        good: '$n!=n\\cdot(n-1)!$ なので、$\\dfrac{L_n}{n!}=\\dfrac{L_{n-1}}{(n-1)!}+\\dfrac1{e\\cdot n!}$ と、**左右が同じ形** になります。',
        add: [{ t: 'm', tex: '\\frac{L_n}{n!}=\\frac{L_{n-1}}{(n-1)!}+\\frac{1}{e\\cdot n!}' }] } },
      { say: '$a_n=\\dfrac{L_n}{n!}$ とおけば、階差が $\\dfrac1{e\\cdot n!}$ の数列。$a_0=\\frac1e$ から順にたしていきます（$0!=1$）。',
        add: [{ t: 'm', tex: 'a_n=a_0+\\sum_{k=1}^{n}\\frac{1}{e\\cdot k!}=\\frac1e\\sum_{k=0}^{n}\\frac1{k!}' },
          { t: 'ans', label: '(3) 答', text: '$L_0=\\dfrac1e$，　$L_n=nL_{n-1}+\\dfrac1e$\n$L_n=\\dfrac{n!}{e}\\displaystyle\\sum_{k=0}^{n}\\frac1{k!}$' }] },
      { ask: { type: 'think', q: '一般項の式で $L_1,\\ L_2,\\ L_3$ を計算し、漸化式でも確かめよう。',
        hint: '$L_2=\\frac{2!}{e}\\left(1+1+\\frac12\\right)$。漸化式なら $L_1=1\\cdot L_0+\\frac1e$。',
        ans: '$L_1=\\dfrac2e,\\quad L_2=\\dfrac5e,\\quad L_3=\\dfrac{16}e$',
        after: '$eL_n$ は 1, 2, 5, 16, 65, … とすべて整数になります。$L_1=\\frac2e$ は、直接部分積分しても同じ値です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。最大値 → はさみうち → 部分積分の漸化式。数学Ⅲの微積分の、典型の3段がそろった問題でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
