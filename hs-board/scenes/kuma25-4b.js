/* 熊大型（理系）2025 第4問の類題②（自作）：数学Ⅲ 微分・積分・極限 ― 指数関数の不等式・log n! の積分による評価・(2n)!/n! の n 乗根の極限
   元の問題はうつしていない（「微分を使って不等式を示す」「和を面積（積分）で評価する」「積で定義された数列の n 乗根の極限をはさみうち」というねらいと形式だけを合わせた自作問題）。
   類題①（対数の不等式・調和数列の和・(1+2/k)^k の積）とは、(1) が e^x の不等式（帰納法＋微分）、(2) が log の積分、(3) が階乗の比の n 乗根、というちがいがある。
   問題：(1) x>0，自然数 n：e^x > x^n/n!　(2) 自然数 n：log n! < (n+1)log(n+1) − n　(3) aₙ={(2n)!/n!}^{1/n}/n の極限
   答え（python3・sympy・mpmath で検算ずみ）：
   (1) h(x)=e^x−x^{n+1}/(n+1)!，h'(x)=e^x−x^n/n!>0（帰納法の仮定），h(0)=1>0。x=n を入れて n!>n^n e^{−n}　…(A)
   (2) k≧1 で log k<∫[k,k+1] log x dx → Σ[k=1..n] log k<∫[1,n+1] log x dx=(n+1)log(n+1)−n。すなわち n!<(n+1)^{n+1}e^{−n}　…(B)
   (3) (A)(B) より　4n/{e(n+1)(n+1)^{1/n}} < aₙ < (2+1/n)²(2n+1)^{1/n}/e。(n+1)^{1/n}→1，(2n+1)^{1/n}→1（log n/n→0）→ lim aₙ=4/e
   数値：a₁=2，a₂=√3≒1.732，a₁₀≒1.523，a₁₀₀≒1.4766，a₁₀₀₀≒1.4720，4/e≒1.4715
   別の見方：log aₙ=(1/n)Σ[j=1..n] log(1+j/n) → ∫₀¹ log(1+x)dx=2log2−1 → aₙ→e^{2log2−1}=4/e（区分求積）
   考えてみよう：n=3 で log 3!=log 6≒1.792 < 4log4−3≒2.545 を確かめる */
(function () {
  const POINTS = [
    '不等式は、差の関数を作り、**帰納法の仮定と $h(0)>0$** から「増加して正」を言う：$e^x>\\dfrac{x^n}{n!}$ → $n!>\\left(\\dfrac ne\\right)^n$',
    '$\\log n!=\\sum\\log k$ は **長方形の面積** と見て、増加関数 $y=\\log x$ の下の面積と比べる：$\\log k<\\int_k^{k+1}\\log x\\,dx$ → $n!<\\dfrac{(n+1)^{n+1}}{e^n}$',
    '階乗の比の $n$ 乗根は、**分子は上から・分母は下から** 評価してはさみうち。$(n+1)^{\\frac1n}\\to1$ は $\\frac{\\log n}{n}\\to0$ から'
  ];
  const T0 = [['$n$', '1', '2', '10', '100', '1000'], ['$a_n$', '2', '1.732', '1.523', '1.477', '1.472']];
  const BAR = (k) => ({ k: 'poly', pts: [[k, 0], [k, Math.log(k)], [k + 1, Math.log(k)], [k + 1, 0]], close: true, fill: 'b', alpha: 0.3, c: 'b', wd: 2 });

  HB.lesson({
    id: 'kuma25-4b', field: '熊大型　数学（理系）', title: '2025 熊大 理系 第4問の類題② ― 指数関数の不等式と、階乗の比の n 乗根の極限', level: '2025年度 熊本大学 理系 第4問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '対数は自然対数とする。$n!$ は $n$ の階乗を表す。',
      parts: [
        '(1)　$x>0$ のとき、すべての自然数 $n$ に対して、不等式　$e^x>\\dfrac{x^n}{n!}$　が成り立つことを示せ。',
        '(2)　自然数 $n$ に対して、不等式　$\\log(n!)<(n+1)\\log(n+1)-n$　が成り立つことを示せ。',
        '(3)　自然数 $n$ に対して　$a_n=\\dfrac1n\\left\\{\\dfrac{(2n)!}{n!}\\right\\}^{\\frac1n}$　とする。極限 $\\displaystyle\\lim_{n\\to\\infty}a_n$ を求めよ。必要ならば、$\\displaystyle\\lim_{n\\to\\infty}\\frac{\\log n}{n}=0$ を用いてよい。'
      ],
      src: '※ 2025年度 熊本大学 前期 理系 第4問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '数学Ⅲの微分・積分・極限の総合問題です。(1)(2) は階乗 $n!$ を上下からおさえる不等式で、(3) の極限の道具になる誘導の形。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },
      { clear: true, part: '見通し', say: 'まず (3) の $a_n$ を計算機で調べると、$n$ を大きくするとゆっくり減って、1.47 くらいに近づいていきます。',
        add: [{ t: 'h', text: '見通し：(3) の数列を調べる' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: T0 },
          { t: 'p', size: 'sm', text: '$\\dfrac4e=1.4715\\cdots$ に近づいているように見える\n（$\\dfrac{(2n)!}{n!}=(n+1)(n+2)\\cdots(2n)$ の $n$ 個の積）' }] },
      { say: '$n!$ や $(2n)!$ を直接は扱えないので、まず $n!$ を **下から** 評価する (1) と、**上から** 評価する (2) を作ります。(3) は両方を使ってはさみうち。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　$n!$ の下からの評価　…(A)\n(2)　$n!$ の上からの評価　…(B)\n(3)　分子は上から・分母は下から → はさみうち' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。自然数 $n$ についての命題なので、数学的帰納法で示します。$n=1$：$h(x)=e^x-x$ とおくと、$h\'(x)=e^x-1>0\\ (x>0)$、$h(0)=1$ です。',
        add: [{ t: 'h', text: '(1)　帰納法：$n=1$ のとき $e^x>x$' },
          { t: 'm', size: 'sm', tex: "h(x)=e^x-x,\\quad h'(x)=e^x-1>0\\ (x>0),\\quad h(0)=1" },
          { t: 'p', size: 'sm', text: '$x\\ge0$ で増加、$h(0)=1>0$ → $x>0$ で $h(x)>0$\nよって　$e^x>x$' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.3, -0.8, 2.6, 8], w: 440, h: 400, items: [
            { k: 'axes', tx: [1, 2], ty: [2, 4, 6] },
            { k: 'fn', f: 'exp(x)', a: -0.2, b: 2.1, c: 'y', label: 'e^x', lat: [1.85, 7.0] },
            { k: 'line', m: 1, n: 0, a: -0.2, b: 2.5, c: 'b', label: 'y=x', lat: [2.4, 2.0] }] }] },
      { say: '$n$ のときの成立 $e^x>\\dfrac{x^n}{n!}$ を仮定して、$n+1$ のとき $e^x>\\dfrac{x^{n+1}}{(n+1)!}$ を示します。差の関数 $h(x)=e^x-\\dfrac{x^{n+1}}{(n+1)!}$ を作ります。',
        add: [{ t: 'm', tex: 'h(x)=e^x-\\frac{x^{n+1}}{(n+1)!}\\quad(x\\ge0)', note: '$h(0)=1$' }] },
      { ask: { type: 'choice', q: "$h(x)=e^x-\\dfrac{x^{n+1}}{(n+1)!}$ の導関数 $h'(x)$ は？",
        opts: ['$e^x-\\dfrac{x^{n+1}}{n!}$', '$e^x-\\dfrac{x^{n}}{(n+1)!}$', '$e^x-\\dfrac{x^{n}}{n!}$', '$e^x+\\dfrac{x^{n}}{n!}$'], ok: 2,
        why: { 0: '$x^{n+1}$ を微分すると $(n+1)x^n$。指数が 1 下がります。', 1: '$(n+1)x^n$ の $(n+1)$ が分母の $(n+1)!$ と約分されて $n!$ になります。', 3: '$-\\frac{x^{n+1}}{(n+1)!}$ の符号が逆です。' },
        good: "$h'(x)=e^x-\\dfrac{(n+1)x^n}{(n+1)!}=e^x-\\dfrac{x^n}{n!}$。仮定より $x>0$ で正です。",
        add: [{ t: 'm', tex: "h'(x)=e^x-\\frac{x^n}{n!}>0\\quad(x>0)", note: '帰納法の仮定' }] } },
      { say: '$h$ は $x\\ge0$ で増加し、$h(0)=1>0$。よって $x>0$ で $h(x)>0$、つまり $n+1$ のときも成り立ちます。これで (1) の完成です。',
        add: [{ t: 'ans', label: '(1)', text: '$x>0$ で　$e^x>\\dfrac{x^n}{n!}$　（すべての自然数 $n$）' }] },
      { clear: true, say: '(1) の使い道です。(1) は $x>0$ なら何を入れてもよいので、$x=n$ を入れてみます。',
        add: [{ t: 'h', text: '(1) を使う：x＝n を入れる' },
          { t: 'm', size: 'sm', tex: 'e^x>\\frac{x^n}{n!}\\quad\\xrightarrow{\\ x=n\\ }\\quad e^n>\\frac{n^n}{n!}' }] },
      { ask: { type: 'choice', q: '(1) に $x=n$ を入れると、$n!$ について何が言える？',
        opts: ['$n!>\\dfrac{n^n}{e^n}$', '$n!<\\dfrac{n^n}{e^n}$', '$n!>n^n\\,e^n$', '$n!>\\dfrac{n^n}{e}$'], ok: 0,
        why: { 1: '$e^n>\\frac{n^n}{n!}$ の両辺に $\\frac{n!}{e^n}$ をかけても、不等号の向きは変わりません。', 2: '$e^n>\\frac{n^n}{n!}$ から $n!>\\frac{n^n}{e^n}$。$e^n$ は分子ではなく分母に来ます。', 3: '$e^n$ を $e$ と見まちがえています。$n$ 乗が残ります。' },
        good: '$e^n>\\dfrac{n^n}{n!}$ より $n!>n^n e^{-n}$。これが $n!$ の **下からの評価** (A) です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '(A)', text: '$n!>\\left(\\dfrac ne\\right)^n=n^ne^{-n}$' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\log(n!)=\\log1+\\log2+\\cdots+\\log n$。$\\log k$ を「幅 1・高さ $\\log k$ の長方形の面積」と見て、曲線 $y=\\log x$ の下の面積と比べます。',
        add: [{ t: 'h', text: '(2)　和を面積で比べる' },
          { t: 'm', size: 'sm', tex: '\\log(n!)=\\sum_{k=1}^{n}\\log k' },
          { t: 'fig', id: 'f2', col: 1, view: [-0.3, -0.5, 6.7, 2.4], w: 540, h: 330, items: [
            { k: 'axes', tx: [1, 2, 3, 4, 5, 6], ty: [1, 2] },
            { k: 'fn', f: 'log(x)', a: 0.35, b: 6.6, c: 'y', label: 'y=log x', lat: [5.3, 2.2] }] }] },
      { ask: { type: 'choice', q: '$k\\ge1$ のとき、$\\log k$ より **大きい** と言える積分で、$k=1,\\ 2,\\ \\dots,\\ n$ で足すとつながるものは？',
        opts: ['$\\displaystyle\\int_{k-1}^{k}\\log x\\,dx$', '$\\displaystyle\\int_{k-1}^{k+1}\\log x\\,dx$', '$\\displaystyle\\int_{k}^{k+1}\\log x\\,dx$', '$\\displaystyle\\int_{k+1}^{k+2}\\log x\\,dx$'], ok: 2,
        why: { 0: '$k-1\\le x\\le k$ では $\\log x\\le\\log k$。この積分は $\\log k$ より小さくなります。', 1: '幅が 2 で、となりの $k$ の分と重なってしまい、足してもつながりません。', 3: '$\\log k$ より大きくはなりますが、1つずれていて、足しても (2) の形になりません。' },
        good: '$\\log x$ は増加するので、$k\\le x\\le k+1$ では $\\log x\\ge\\log k$（等号は $x=k$ だけ）。長方形は曲線の下におさまります。',
        add: [{ t: 'm', tex: '\\log k<\\int_{k}^{k+1}\\log x\\,dx\\quad(k\\ge1)' }],
        draw: [{ fig: 'f2', items: [2, 3, 4, 5, 6].map(BAR).concat([{ k: 'label', at: [2.5, 0.35], text: 'log2', c: 'b', size: 18 }, { k: 'label', at: [3.5, 0.55], text: 'log3', c: 'b', size: 18 }]) }] } },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_1^{n+1}\\log x\\,dx$ はいくつ？（$\\big(x\\log x-x\\big)'+"'"+'=\\log x$ を使う）',
        opts: ['$(n+1)\\log(n+1)-(n+1)$', '$\\dfrac{1}{n+1}-1$', '$(n+1)\\log(n+1)-n$', '$(n+1)\\log(n+1)-n-2$'], ok: 2,
        why: { 0: '下端 $x=1$ の値 $1\\cdot\\log1-1=-1$ を引くので、$-(n+1)-(-1)=-n$ です。', 1: '$\\log x$ の原始関数は $\\frac1x$ ではありません。', 3: '下端の値は $-1$。引くと $+1$ になります。' },
        good: '$\\Big[x\\log x-x\\Big]_1^{n+1}=(n+1)\\log(n+1)-(n+1)-(0-1)=(n+1)\\log(n+1)-n$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_1^{n+1}\\log x\\,dx=\\Big[x\\log x-x\\Big]_1^{n+1}=(n+1)\\log(n+1)-n' }] } },
      { say: '$k=1,\\ 2,\\ \\dots,\\ n$ で足すと、右辺の積分はつながって $\\int_1^{n+1}\\log x\\,dx$。これで (2) が示せました。指数にもどすと $n!$ の **上からの評価** (B) です。',
        add: [{ t: 'ans', label: '(2)', text: '$\\log(n!)<(n+1)\\log(n+1)-n$' },
          { t: 'box', c: 'y', size: 'sm', label: '(B)', text: '$n!<\\dfrac{(n+1)^{n+1}}{e^{n}}$' }] },
      { ask: { type: 'think', q: '検算：$n=3$ で、(2) の不等式の両辺をそれぞれ計算して、成り立っていることを確かめよう。',
        hint: '$\\log3!=\\log6$。右辺は $4\\log4-3$。$\\log4=1.3863$。',
        ans: '左辺 $\\log6=1.792$、右辺 $4\\times1.3863-3=2.545$。$1.792<2.545$ で成り立つ。',
        after: '不等式の答案を書く前に、小さい $n$ で確かめておくと安心です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$\\dfrac{(2n)!}{n!}$ を、(A)(B) で上下からおさえます。(A)(B) は $n$ を $2n$ にしても使えます。',
        add: [{ t: 'h', text: '(3)　(A)(B) ではさむ' },
          { t: 'box', c: 'y', size: 'sm', label: '(A)(B)', text: '$\\left(\\dfrac ne\\right)^n<n!<\\dfrac{(n+1)^{n+1}}{e^n}$' },
          { t: 'p', size: 'sm', text: '$n$ を $2n$ にすると\n$\\left(\\dfrac{2n}{e}\\right)^{2n}<(2n)!<\\dfrac{(2n+1)^{2n+1}}{e^{2n}}$' }] },
      { ask: { type: 'choice', q: '$\\dfrac{(2n)!}{n!}$ を **上から** おさえるには、分子と分母にどの評価を使う？',
        opts: ['分子に (A)、分母に (A)', '分子に (B)、分母に (B)', '分子に (A)、分母に (B)', '分子に (B)、分母に (A)'], ok: 3,
        why: { 0: '分子に下からの評価 (A) を使うと、全体は下からの評価になります。', 1: '分母に上からの評価を使うと、分母が大きくなりすぎて、全体は小さい方の評価になります。', 2: '分子は下から、分母は上から評価すると、全体の下からの評価になります。' },
        good: '分数は、**分子を大きく・分母を小さく** すると大きくなります。分子に上からの (B)、分母に下からの (A) です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{(2n)!}{n!}<\\frac{(2n+1)^{2n+1}e^{-2n}}{n^ne^{-n}}=\\frac{(2n+1)^{2n+1}}{n^n\\,e^{n}}' }] } },
      { clear: true, say: '$\\frac1n$ 乗して $n$ で割ります。$\\{(2n+1)^{2n+1}\\}^{\\frac1n}=(2n+1)^2(2n+1)^{\\frac1n}$、$(n^n)^{\\frac1n}=n$、$(e^n)^{\\frac1n}=e$ です。',
        add: [{ t: 'h', text: '(3)　上からの評価' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned} a_n&<\\frac1n\\cdot\\frac{(2n+1)^2(2n+1)^{\\frac1n}}{n\\,e}\\\\ &=\\frac1e\\left(2+\\frac1n\\right)^2(2n+1)^{\\frac1n} \\end{aligned}' }] },
      { clear: true, say: '下からの評価も同じ要領です。分子に (A)、分母に (B) を使います。',
        add: [{ t: 'h', text: '(3)　下からの評価' },
          { t: 'm', size: 'sm', tex: '\\frac{(2n)!}{n!}>\\frac{(2n)^{2n}e^{-2n}}{(n+1)^{n+1}e^{-n}}=\\frac{(2n)^{2n}}{(n+1)^{n+1}\\,e^{n}}' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned} a_n&>\\frac1n\\cdot\\frac{4n^2}{(n+1)^{1+\\frac1n}\\,e}\\\\ &=\\frac4e\\cdot\\frac{n}{n+1}\\cdot(n+1)^{-\\frac1n} \\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}(2n+1)^{\\frac1n}$ は？',
        opts: ['$2$', '$\\infty$（底が大きくなるから）', '$1$', '$e$'], ok: 2,
        why: { 0: '$(2n+1)^{\\frac1n}$ の指数は 0 に近づくので、底の 2 倍には関係しません。', 1: '底は大きくなりますが、指数 $\\frac1n$ は 0 に近づきます。対数をとって調べます。', 3: '$\\left(1+\\frac1n\\right)^n$ と混同しています。' },
        good: '$\\log(2n+1)^{\\frac1n}=\\dfrac{\\log(2n+1)}{n}\\le\\dfrac{\\log3+\\log n}{n}\\to0$ なので、$(2n+1)^{\\frac1n}\\to e^0=1$。$(n+1)^{\\frac1n}$ も同様に 1 です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\log(2n+1)}{n}\\le\\frac{\\log3}{n}+\\frac{\\log n}{n}\\to0', note: '$2n+1\\le3n$' }] } },
      { clear: true, say: '上からの評価の右辺は $\\frac1e\\cdot2^2\\cdot1=\\frac4e$、下からの評価の右辺は $\\frac4e\\cdot1\\cdot1=\\frac4e$ に近づきます。はさみうちの原理で、$a_n\\to\\frac4e$。表の値とも合います。',
        add: [{ t: 'h', text: '(3)　はさみうち' },
          { t: 'm', size: 'sm', tex: '\\frac4e\\cdot\\frac{n}{n+1}(n+1)^{-\\frac1n}<a_n<\\frac1e\\left(2+\\frac1n\\right)^2(2n+1)^{\\frac1n}' },
          { t: 'p', size: 'sm', text: '左辺 → $\\dfrac4e\\cdot1\\cdot1$、右辺 → $\\dfrac1e\\cdot4\\cdot1$' },
          { t: 'ans', label: '(3) 答', tex: '\\lim_{n\\to\\infty}a_n=\\frac4e' },
          { t: 'tbl', col: 1, size: 'sm', cls: 'rowh', rows: [['$n$', '$a_n$'], ['10', '1.523'], ['100', '1.477'], ['1000', '1.472'], ['$\\infty$', '$\\frac4e=1.4715$']] }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '別の見方です。$\\frac{(2n)!}{n!}=(n+1)(n+2)\\cdots(2n)$ なので、$\\log a_n=\\dfrac1n\\sum_{j=1}^{n}\\log\\dfrac{n+j}{n}$。これは **区分求積** の形です。',
        add: [{ t: 'h', text: '別の見方：区分求積' },
          { t: 'm', size: 'sm', tex: '\\log a_n=\\frac1n\\sum_{j=1}^{n}\\log\\Big(1+\\frac jn\\Big)' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\lim_{n\\to\\infty}\\frac1n\\sum_{j=1}^{n}\\log\\Big(1+\\frac jn\\Big)=\\int_0^1\\log(1+x)\\,dx$ を計算して、$a_n$ の極限を求めよう。',
        hint: '$\\big\\{(1+x)\\log(1+x)-(1+x)\\big\\}\\,\'=\\log(1+x)$ を使う。',
        ans: '$\\Big[(1+x)\\log(1+x)-(1+x)\\Big]_0^1=2\\log2-1$ なので、$\\lim a_n=e^{2\\log2-1}=\\dfrac4e$',
        after: '答えは (3) と同じ。ただし区分求積の答案では、和と積分が等しくなる理由をていねいに書く必要があります。はさみうちは、そのまま答案になります。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '$\\displaystyle\\int_0^1\\log(1+x)\\,dx=2\\log2-1$\n$a_n\\to e^{2\\log2-1}=\\dfrac4e$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。不等式の証明 → 面積での評価 → はさみうち。階乗を上下からおさえる、数学Ⅲの極限の王道の組み立てです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
