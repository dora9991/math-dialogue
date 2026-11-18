/* 熊大型（理系）2025 第1問の類題（自作）：複素数 ― 共役をふくむ漸化式を、和と「係数をつけた差」で等比数列にする
   元の問題はうつしていない（「前の項とその共役の1次式」「和・係数つきの差を新しい数列に」「一般項を組み立てる」というねらいと形式だけを合わせた自作問題）。
   問題：z₁=1，z(n+1)=(3+i)zₙ+(1+i)z̄ₙ
   答え（python3・sympy で n≦7 を検算ずみ）：(1) s(n+1)=4sₙ，sₙ=2·4ⁿ⁻¹　(2) k=i，tₙ=(1−i)·2ⁿ⁻¹
   (3) zₙ=4ⁿ⁻¹+(4ⁿ⁻¹−2ⁿ⁻¹)i（z₂=4+2i，z₃=16+12i）
   別の見方：zₙ=xₙ+yₙi → x(n+1)=4xₙ，y(n+1)=2xₙ+2yₙ，tₙ=(1−i)(xₙ−yₙ) */
(function () {
  const POINTS = [
    '共役をふくむ漸化式は、**両辺の共役** をとった式と組にする：$\\overline{z_{n+1}}=(3-i)\\overline{z_n}+(1-i)z_n$',
    '和 $z_n+\\overline{z_n}$ や差 $z_n-k\\,\\overline{z_n}$ を作り、$z_n$ と $\\overline{z_n}$ の **係数をくらべて** 等比数列に。出した $k$ は、もう一方の係数でも確かめる',
    '$s_n,\\ t_n$ がわかったら、連立方程式のように $\\overline{z_n}$ を消去して $z_n$ を出す。最後に $n=1,\\ 2,\\ 3$ で検算'
  ];
  const T1 = [['$n$', '1', '2', '3'], ['$z_n$', '$1$', '$4+2i$', '$16+12i$']];

  HB.lesson({
    id: 'kuma25-1', field: '熊大型　数学（理系）', title: '2025 熊大 理系 第1問の類題 ― 共役をふくむ複素数の漸化式', level: '2025年度 熊本大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '数列 $\\{z_n\\}$ を　$z_1=1,\\quad z_{n+1}=(3+i)z_n+(1+i)\\overline{z_n}\\quad(n=1,\\,2,\\,3,\\,\\dots)$　で定める。ただし、$i$ は虚数単位、$\\overline{z}$ は複素数 $z$ と共役な複素数を表す。',
      parts: [
        '(1)　$s_n=z_n+\\overline{z_n}$ とおく。$s_{n+1}$ を $s_n$ を用いて表し、$s_n$ を $n$ の式で表せ。',
        '(2)　複素数の定数 $k$ に対して $t_n=z_n-k\\,\\overline{z_n}$ とおく。すべての自然数 $n$ について $t_{n+1}=2t_n$ が成り立つような $k$ を1つ求めよ。また、そのときの $t_n$ を $n$ の式で表せ。',
        '(3)　一般項 $z_n$ を求めよ。'
      ],
      src: '※ 2025年度 熊本大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', say: '複素数の数列の問題です。漸化式に $z_n$ と、その共役 $\\overline{z_n}$ が両方入っているのが特徴。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 書き出す ----------
      { clear: true, part: '書き出す', say: '解き始める前に、$z_2$ を計算してみます。$z_1=1$ は実数なので、$\\overline{z_1}=1$ です。',
        add: [{ t: 'h', text: 'まず書き出してみる' },
          { t: 'm', tex: 'z_{n+1}=(3+i)z_n+(1+i)\\overline{z_n}' },
          { t: 'm', tex: 'z_1=1,\\qquad \\overline{z_1}=1' }] },
      { ask: { type: 'choice', q: '$z_2=(3+i)z_1+(1+i)\\overline{z_1}$ はいくつ？',
        opts: ['$4$', '$4+2i$', '$2$', '$3+i$'], ok: 1,
        why: { 0: '係数の $1+i$ まで共役にしています。共役をとるのは $z_1$ だけです。', 2: '$(1+i)\\overline{z_1}$ を引いています。符号に注意。', 3: '第2項の $(1+i)\\overline{z_1}$ を足し忘れています。' },
        good: '$(3+i)\\cdot1+(1+i)\\cdot1=4+2i$。同じように計算すると $z_3=16+12i$ です。',
        add: [{ t: 'tbl', col: 1, rows: T1 },
          { t: 'p', col: 1, size: 'sm', text: '$z_3=(3+i)(4+2i)+(1+i)(4-2i)$\n$\\phantom{z_3}=(10+10i)+(6+2i)=16+12i$\n→ 最後の検算に使う' }] } },
      { say: 'この数値から $z_n$ を予想するのは大変です。$\\overline{z_n}$ が入っているので、**漸化式そのものの共役** をとった式も用意して、2本を組み合わせます。',
        add: [{ t: 'box', c: 'b', label: '方針', text: '漸化式と、その共役をとった式の\n2本を組にして使う' }] },
      { ask: { type: 'choice', q: '漸化式の両辺の共役をとると　$\\overline{z_{n+1}}=\\square\\,\\overline{z_n}+\\triangle\\,z_n$。$(\\square,\\ \\triangle)$ は？',
        opts: ['$(3+i,\\ 1+i)$', '$(1-i,\\ 3-i)$', '$(3-i,\\ 1+i)$', '$(3-i,\\ 1-i)$'], ok: 3,
        why: { 0: '係数の $3+i,\\ 1+i$ も共役にします。', 1: '$\\overline{(3+i)z_n}=(3-i)\\overline{z_n}$。$\\overline{z_n}$ の係数は $3-i$ です。', 2: '$1+i$ の共役は $1-i$。片方だけ共役にしています。' },
        good: '$\\overline{\\alpha\\beta}=\\overline{\\alpha}\\,\\overline{\\beta}$、$\\overline{\\alpha+\\beta}=\\overline{\\alpha}+\\overline{\\beta}$、$\\overline{\\overline{z}}=z$ を使います。',
        add: [{ t: 'm', tex: '\\overline{z_{n+1}}=(3-i)\\overline{z_n}+(1-i)z_n', note: '…(*)' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$s_{n+1}=z_{n+1}+\\overline{z_{n+1}}$ に、もとの漸化式と (*) を代入して、$z_n$ と $\\overline{z_n}$ ごとにまとめます。',
        add: [{ t: 'h', text: '(1)　和 $s_n=z_n+\\overline{z_n}$' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned} s_{n+1}&=z_{n+1}+\\overline{z_{n+1}}\\\\ &=\\{(3+i)+(1-i)\\}z_n+\\{(1+i)+(3-i)\\}\\overline{z_n} \\end{aligned}' },
          { t: 'tbl', col: 1, rows: T1 }] },
      { ask: { type: 'choice', q: '係数を計算すると、$s_{n+1}$ は？',
        opts: ['$4s_n$', '$2s_n$', '$(4+2i)s_n$', '$4s_n+2i$'], ok: 0,
        why: { 1: '$(3+i)+(1-i)=4$。実部は 3 と 1 の和です。', 2: '$i$ と $-i$ が打ち消し合うので、係数は実数の 4 です。', 3: '定数項は出てきません。$z_n$ と $\\overline{z_n}$ の係数がどちらも 4 になります。' },
        good: 'どちらの係数も 4 なので、$s_{n+1}=4z_n+4\\overline{z_n}=4s_n$。',
        add: [{ t: 'm', tex: 's_{n+1}=4z_n+4\\overline{z_n}=\\hy{4s_n}' }] } },
      { say: '$\\{s_n\\}$ は公比 4 の等比数列。初項は $s_1=z_1+\\overline{z_1}=2$ です。表で確かめると $s_2=(4+2i)+(4-2i)=8$。合っています。',
        add: [{ t: 'm', tex: 's_1=1+1=2' },
          { t: 'ans', label: '(1) 答', tex: 's_{n+1}=4s_n,\\qquad s_n=2\\cdot4^{n-1}' },
          { t: 'p', col: 1, size: 'sm', text: '検算：$s_2=(4+2i)+(4-2i)=8=2\\cdot4$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$t_{n+1}=z_{n+1}-k\\,\\overline{z_{n+1}}$ に、漸化式と (*) を代入して、$z_n$ と $\\overline{z_n}$ ごとにまとめます。',
        add: [{ t: 'h', text: '(2)　係数をつけた差 $t_n=z_n-k\\,\\overline{z_n}$' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned} t_{n+1}&=(3+i)z_n+(1+i)\\overline{z_n}-k\\{(3-i)\\overline{z_n}+(1-i)z_n\\}\\\\ &=\\{3+i-k(1-i)\\}z_n+\\{1+i-k(3-i)\\}\\overline{z_n} \\end{aligned}' }] },
      { say: '目標は $2t_n=2z_n-2k\\,\\overline{z_n}$。$z_n$ と $\\overline{z_n}$ の係数がそれぞれ等しくなる $k$ なら、どの $n$ でも $t_{n+1}=2t_n$ が成り立ちます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '係数をくらべる', text: '$z_n$ の係数：　$3+i-k(1-i)=2$　…①\n$\\overline{z_n}$ の係数：　$1+i-k(3-i)=-2k$　…②' }] },
      { ask: { type: 'choice', q: '① の式 $3+i-k(1-i)=2$ から、$k$ は？',
        opts: ['$-i$', '$1$', '$i$', '$-1$'], ok: 2,
        why: { 0: '$k=\\dfrac{1+i}{1-i}$ です。分母と分子を逆にしています。', 1: '$k(1-i)=1+i$。$1-i$ で割っても 1 にはなりません。', 3: '$k=-1$ は (1) の和 $s_n$ で、公比は 4 でした。' },
        good: '$k=\\dfrac{1+i}{1-i}=\\dfrac{(1+i)^2}{(1-i)(1+i)}=\\dfrac{2i}{2}=i$ です。',
        add: [{ t: 'm', tex: 'k(1-i)=1+i\\ \\Longrightarrow\\ k=\\frac{1+i}{1-i}=i' }] } },
      { say: 'ここが答案の大事な所。$k=i$ を **② の式** にも入れて確かめます。$1+i-i(3-i)=-2i=-2k$。② も成り立ちました。',
        add: [{ t: 'm', size: 'sm', tex: '1+i-i(3-i)=1+i-3i+i^2=-2i=-2k', note: '← ② も OK' }] },
      { ask: { type: 'choice', q: '② の式でも確かめたのは、なぜ？',
        opts: ['$k$ が実数か調べるため', '$t_1$ を求めるため', '念のため（なくても答案は十分）', '① だけでは、② が成り立つとは限らないから'], ok: 3,
        why: { 0: '$k=i$ は実数ではありませんが、それで問題ありません。', 1: '$t_1$ は $z_1$ から直接求まります。', 2: '① だけでは $t_{n+1}=2t_n$ の保証がありません。答案に必要な1行です。' },
        good: '① と ② を **両方** 満たして、はじめて $t_{n+1}=2t_n$ が言えます。2つの条件に未知数1つなので、確かめが必要です。' } },
      { say: '$k=i$ のとき $t_{n+1}=2t_n$。初項は $t_1=z_1-i\\,\\overline{z_1}=1-i$ なので、$t_n$ が求まります。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'k=i,\\qquad t_n=(1-i)\\cdot2^{n-1}' }] },
      { ask: { type: 'think', q: '検算：$z_2=4+2i$ から $t_2=z_2-i\\,\\overline{z_2}$ を直接計算して、$2(1-i)$ になることを確かめよう。',
        hint: '$\\overline{z_2}=4-2i$。$i(4-2i)=4i-2i^2=2+4i$。',
        ans: '$t_2=(4+2i)-(2+4i)=2-2i=2(1-i)$',
        after: '書き出した値での検算は、答案を書く前の安心材料になります。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '検算：$t_2=2-2i=(1-i)\\cdot2$' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$s_n$ と $t_n$ がわかったので、2つの式から $\\overline{z_n}$ を消去すれば $z_n$ が出ます。連立方程式と同じ考え方です。',
        add: [{ t: 'h', text: '(3)　一般項 $z_n$' },
          { t: 'm', tex: '\\begin{cases} z_n+\\overline{z_n}=s_n=2\\cdot4^{n-1}\\\\ z_n-i\\,\\overline{z_n}=t_n=(1-i)\\cdot2^{n-1} \\end{cases}' }] },
      { ask: { type: 'choice', q: '$\\overline{z_n}$ を消すには、どう組み合わせる？',
        opts: ['$s_n+t_n$', '$is_n+t_n$', '$s_n+it_n$', '$is_n-t_n$'], ok: 1,
        why: { 0: '$s_n+t_n=2z_n+(1-i)\\overline{z_n}$。$\\overline{z_n}$ が残ります。', 2: '$s_n+it_n=(1+i)z_n+2\\overline{z_n}$。消えません。', 3: '$is_n-t_n=(i-1)z_n+2i\\,\\overline{z_n}$。符号が逆です。' },
        good: '上の式を $i$ 倍すると $i\\,\\overline{z_n}$ ができ、下の $-i\\,\\overline{z_n}$ と打ち消し合います。',
        add: [{ t: 'm', tex: 'is_n+t_n=(1+i)z_n' }] } },
      { say: 'よって $z_n=\\dfrac{t_n+is_n}{1+i}$。$\\dfrac{1-i}{1+i}=-i$、$\\dfrac{2i}{1+i}=1+i$ を使って整理します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned} z_n&=\\frac{(1-i)\\cdot2^{n-1}+2i\\cdot4^{n-1}}{1+i}\\\\ &=-i\\cdot2^{n-1}+(1+i)\\cdot4^{n-1} \\end{aligned}' }] },
      { say: '実部と虚部に分けて答えます。$n=1,\\ 2,\\ 3$ を入れると $1,\\ 4+2i,\\ 16+12i$。はじめに書き出した表と一致します。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'z_n=4^{n-1}+(4^{n-1}-2^{n-1})\\,i' },
          { t: 'tbl', col: 1, rows: T1 },
          { t: 'p', col: 1, size: 'sm', text: '$n=3$：$16+(16-4)i=16+12i$\n→ 表と一致' }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '別の見方です。$z_n=x_n+y_ni$（$x_n,\\ y_n$ は実数）とおくと、漸化式は実部と虚部の2本の漸化式になります。',
        add: [{ t: 'h', text: '別の見方：実部と虚部に分ける' },
          { t: 'm', tex: 'z_n=x_n+y_ni\\quad(x_n,\\ y_n\\ \\text{は実数})' }] },
      { ask: { type: 'think', q: '漸化式を実部・虚部に分けて、$x_{n+1},\\ y_{n+1}$ を $x_n,\\ y_n$ で表そう。',
        hint: '$(3+i)(x+yi)+(1+i)(x-yi)$ を展開して、実部と虚部を集める。',
        ans: '$x_{n+1}=4x_n,\\quad y_{n+1}=2x_n+2y_n$',
        after: '$x_{n+1}-y_{n+1}=2(x_n-y_n)$ なので、$x_n-y_n$ は公比 2 の等比数列です。',
        add: [{ t: 'm', tex: '\\begin{cases} x_{n+1}=4x_n\\\\ y_{n+1}=2x_n+2y_n \\end{cases}' }] } },
      { say: '実は $s_n=2x_n$、$t_n=(1-i)(x_n-y_n)$。(1) は実部を、(2) は $x_n-y_n$ を見ていたのです。共役を使うと、分けずに一気に計算できます。',
        add: [{ t: 'm', size: 'sm', tex: 's_n=2x_n,\\qquad t_n=(1-i)(x_n-y_n)' },
          { t: 'box', c: 'g', size: 'sm', label: '見くらべ', text: '(1) の $s_n$ ⇔ 実部 $x_n$\n(2) の $t_n$ ⇔ $x_n-y_n$\nどちらも等比数列になる組み合わせ' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。共役をふくむ漸化式は「共役をとった式と組にする → 等比数列になる組み合わせを作る」が基本の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
