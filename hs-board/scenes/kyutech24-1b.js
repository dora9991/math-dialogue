/* 2024 九工大 第1問の類題②（自作）：指数の分数関数 f(x)=(e^x−1)/x と、定積分で表された関数 G(x)=∫₀² |t−x| e^t dt
   元の問題はうつしていない（「補助の関数で方程式を解く」「分数関数の概形」「数の大小を f の値で」
   「積分の中の絶対値を場合分けして最小となる x」「最小値を部分積分で」というねらいと形式だけを合わせた自作問題。類題①は対数、②は指数）。
   答え（python3・sympy／mpmath で検算ずみ）：
   (1) h(x)=(x−1)e^x+1、h'=xe^x。x<0 で減少、x>0 で増加、最小 h(0)=0。h(x)=0 ⇔ x=0
   (2) f'(x)=h(x)/x²>0（x≠0）。lim(x→−∞)=0、lim(x→0)=1、lim(x→∞)=∞。x<0・x>0 のそれぞれで増加
   (3) f(−1/4)=4(1−e^{−1/4})≒0.8848、f(1/3)=3(e^{1/3}−1)≒1.1868、f(1/2)=2(e^{1/2}−1)≒1.2974、極限 1
       4(1−e^{−1/4}) < 1 < 3(e^{1/3}−1) < 2(e^{1/2}−1)
   (4) x≦0：G=(e²+1)−(e²−1)x（減少）、x≧2：G=(e²−1)x−(e²+1)（増加）、0≦x≦2：G=2e^x−(e²+1)x+e²−1、G'=2e^x−(e²+1)
       → x=log((e²+1)/2)≒1.4338
   (5) 最小値 2e²−(e²+1)log((e²+1)/2)≒2.7500（数値積分とも一致） */
(function () {
  const E2 = Math.E * Math.E, X0 = Math.log((1 + E2) / 2), GMIN = 2 * E2 - (1 + E2) * X0;
  const F = '(exp(x)-1)/x';
  const fGraph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-4.8, -0.5, 2.6, 3.7], w: 560, h: 318, items: [
    { k: 'axes', tx: [-4, -2, 2], ty: [1, 2, 3] },
    { k: 'fn', f: F, a: -4.7, b: -0.03, c: 'y' }, { k: 'fn', f: F, a: 0.03, b: 2.55, c: 'y', label: 'y=f(x)', lat: [1.0, 3.2] },
    { k: 'line', m: 0, n: 0, dash: true, c: 'd', a: -4.7, b: 2.5 },
    { k: 'pt', at: [0, 1], open: true, c: 'y' }
  ].concat(extra || []) });
  const ABSG = (id, cx, extra) => ({ t: 'fig', id, col: 1, view: [-0.35, -0.9, 2.5, 5.3], w: 500, h: 372, items: [
    { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[2, '2'], [4, '4']], xl: 't' },
    { k: 'area', f: 'abs(x-' + cx + ')*exp(x)', g: '0', a: 0, b: cx, c: 'b', alpha: 0.3 },
    { k: 'area', f: 'abs(x-' + cx + ')*exp(x)', g: '0', a: cx, b: 2, c: 'p', alpha: 0.3 },
    { k: 'fn', f: 'abs(x-' + cx + ')*exp(x)', a: 0, b: 2, c: 'y', label: 'y=|t−x|eᵗ', lat: [0.15, 3.4] },
    { k: 'line', x: cx, dash: true, c: 'g' },
    { k: 'pt', at: [cx, 0], c: 'g', name: 'x', dir: 's' }
  ].concat(extra || []) });
  const POINTS = [
    "$f'(x)$ の分子のように符号の分からない式は、**補助の関数 $h(x)$** にとり出して調べる。$h$ の最小値が $0$ なので $h(x)>0\\ (x\\ne0)$",
    '$f(x)=\\dfrac{e^x-1}{x}$ は $x\\to0$ で $e^x$ の微分係数 $1$ に近づく。**$x<0$ では $f<1$、$x>0$ では $f>1$** を使って数の大小を決める',
    '絶対値は $t=x$ で場合分けして積分する。$\\displaystyle\\int te^t\\,dt$ は部分積分。最小値は $G\'(x)=0$ を解き、増減（両端の場合も）を確かめる'
  ];

  HB.lesson({
    id: 'kyutech24-1b', field: '九工大型　数学', title: '2024 九工大 第1問の類題② ― 指数の分数関数と、定積分で表された関数の最小', level: '2024年度 九州工業大学 前期 第1問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$e$ は自然対数の底。$x\\ne0$ で定義された $f(x)=\\dfrac{e^x-1}{x}$ と、実数全体で定義された $G(x)=\\displaystyle\\int_0^{2}|t-x|\\,e^t\\,dt$ を考える。',
      parts: [
        '(1)　$h(x)=(x-1)e^x+1$ の増減を調べ、$h(x)=0$ を解け。',
        "(2)　$f(x)$ の増減を調べ、$y=f(x)$ のグラフの概形をかけ。$\\displaystyle\\lim_{x\\to\\infty}\\frac{e^x}{x}=\\infty$ を用いてよい。凹凸は調べなくてよい。",
        '(3)　4つの数 $1,\\ \\ 2\\,(e^{\\frac12}-1),\\ \\ 3\\,(e^{\\frac13}-1),\\ \\ 4\\,(1-e^{-\\frac14})$ を小さい順に並べよ。',
        '(4)　$G(x)$ を最小にする $x$ の値を求めよ。',
        '(5)　$G(x)$ の最小値を求めよ。'
      ],
      src: '※ 2024年度 九州工業大学 前期 第1問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '指数をふくむ関数の微分と、定積分で表された関数の最小です。小問が5つあり、前の結果を次で使う流れです。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, cols: [1], part: '方針', say: '前半の (1)〜(3) は $f(x)$、後半の (4)(5) は $G(x)$ の話です。それぞれ何を使うかを、先に見ておきます。',
        add: [{ t: 'h', text: '方針：小問どうしのつながり' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', 'すること', '使うもの'],
            ['(1)', '$h(x)$ の増減', "$h'(x)$ の符号 → 最小値"],
            ['(2)', '$f(x)$ の増減と極限', "$f'(x)$ の分子が $h(x)$ になる"],
            ['(3)', '4つの数の大小', '$f$ の値として表す'],
            ['(4)(5)', '$G(x)$ の最小', '絶対値をはずす・部分積分']] }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$h(x)$ を積の微分で微分します。$(x-1)e^x$ の微分で $e^x$ の項が消えて、きれいな形になります。',
        add: [{ t: 'h', text: '(1)　h(x) の増減' },
          { t: 'm', tex: "h'(x)=1\\cdot e^x+(x-1)e^x=\\hy{x}\\,e^x" },
          { t: 'p', size: 'sm', text: '$e^x>0$ なので、$h\'(x)$ の符号は $x$ の符号と同じ。' },
          { t: 'fig', id: 'h1', col: 1, view: [-3.4, -0.7, 2.2, 3.7], w: 520, h: 349, items: [
            { k: 'axes', tx: [-3, -2, -1, 1, 2], ty: [1, 2, 3] },
            { k: 'fn', f: '(x-1)*exp(x)+1', a: -3.3, b: 1.65, c: 'y', label: 'y=h(x)', lat: [-3.1, 1.4] }] }] },
      { ask: { type: 'choice', q: '$h(x)$ の増減として正しいのは？',
        opts: ['$x<0$ で増加、$x>0$ で減少', '$x<0$ で減少、$x>0$ で増加', '$x>0$ でつねに増加、$x<0$ でつねに増加', '$x<0$ でつねに減少、$x>0$ でつねに減少'], ok: 1,
        why: { 0: '符号が逆です。$x<0$ では $h\'(x)=xe^x<0$ なので減少です。', 2: '$x<0$ では $h\'(x)=xe^x$ は負です。増加ではありません。', 3: '$x>0$ では $h\'(x)=xe^x>0$ なので増加です。' },
        good: '$x=0$ の前後で $h\'$ が負から正に変わるので、$x=0$ で最小になります。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$\\cdots$', '$0$', '$\\cdots$'], ["$h'(x)$", '$-$', '$0$', '$+$'], ['$h(x)$', '$\\searrow$', '{{$0$}}', '$\\nearrow$']] }] } },
      { say: '最小値は $h(0)=(0-1)\\cdot1+1=0$。よって $x\\ne0$ では $h(x)>0$。方程式 $h(x)=0$ の解は $x=0$ だけです。',
        add: [{ t: 'ans', label: '(1) 答', text: '$x<0$ で減少、$x>0$ で増加（最小値 $h(0)=0$）\n$h(x)=0$ の解は　$x=0$' }],
        draw: [{ fig: 'h1', items: [{ k: 'pt', at: [0, 0], c: 'p', name: '(0, 0)', dir: 'se', size: 21 }] }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: "(2) です。商の微分で $f'(x)$ を求めます。分子を整理すると、(1) の $h(x)$ がそのまま出てきます。",
        add: [{ t: 'h', text: '(2)　f(x) の増減' },
          { t: 'm', size: 'sm', tex: "f'(x)=\\frac{e^x\\cdot x-(e^x-1)\\cdot1}{x^2}=\\frac{xe^x-e^x+1}{x^2}" },
          { t: 'm', tex: "f'(x)=\\frac{\\hy{h(x)}}{x^2}>0", note: '(1) より $h(x)>0\\ (x\\ne0)$' },
          { t: 'p', size: 'sm', text: 'よって $f(x)$ は $x<0$、$x>0$ のそれぞれで増加。' }] },
      { say: '定義域のはしでの極限です。$x\\to-\\infty$ では分子が $-1$ に近づき、分母が $-\\infty$。$x\\to\\infty$ では、与えられた極限を使える形に変えます。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{x\\to-\\infty}\\frac{e^x-1}{x}=\\frac{-1}{-\\infty}=0', note: '$e^x\\to0$' },
          { t: 'm', size: 'sm', tex: '\\lim_{x\\to\\infty}\\frac{e^x}{x}\\left(1-e^{-x}\\right)=\\infty\\cdot1=\\infty' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to0}\\frac{e^x-1}{x}$ の値は？',
        opts: ['$0$', '$e$', '$\\infty$', '$1$'], ok: 3,
        why: { 0: '分子も分母も $0$ に近づく「$\\frac00$ の形」です。$0$ とは決まりません。', 1: '$e$ は $e^x$ に $x=1$ を入れた値です。ここは $x\\to0$ です。', 2: '分母だけが $0$ に近づくのではなく、分子も $0$ に近づきます。' },
        good: '$\\dfrac{e^x-e^0}{x-0}$ は、$e^x$ の $x=0$ での微分係数 $e^0=1$ に近づきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{x\\to0}\\frac{e^x-e^0}{x-0}=(e^x)\'\\Big|_{x=0}=1', note: '微分係数の定義' }] } },
      { say: 'まとめると、グラフは $x$ 軸を左側の漸近線にもつ右上がりの曲線。点 $(0,\\,1)$ は定義域にないので白丸にします。',
        add: [fGraph('g2'),
          { t: 'ans', col: 1, label: '(2) 答', text: '$x<0$、$x>0$ で増加。$x\\to-\\infty$ で $0$、\n$x\\to0$ で $1$（白丸）、$x\\to\\infty$ で $\\infty$（右の図）' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。4つの数をそのまま比べるのは大変。$f$ の値の形に書きかえます。たとえば $f\\!\\left(\\frac13\\right)$ は、分母の $\\frac13$ でわる形です。',
        add: [{ t: 'h', text: '(3)　数を f の値で表す' },
          { t: 'm', tex: 'f\\!\\left(\\tfrac13\\right)=\\frac{e^{\\frac13}-1}{\\frac13}=3\\,(e^{\\frac13}-1)' },
          { t: 'm', tex: 'f\\!\\left(\\tfrac12\\right)=2\\,(e^{\\frac12}-1)', note: '同じように' },
          { t: 'p', size: 'sm', text: 'また $x\\to0$ の極限が $1$。この $1$ もいっしょに並べる。' }] },
      { ask: { type: 'choice', q: '$4\\,(1-e^{-\\frac14})$ は、$f$ に $x$ としていくつを入れた値？',
        opts: ['$x=\\dfrac14$', '$x=-\\dfrac14$', '$x=4$', '$x=-4$'], ok: 1,
        why: { 0: '$f(\\frac14)=4(e^{\\frac14}-1)$ です。符号つきの指数になりません。', 2: '$f(4)=\\frac{e^4-1}{4}$ で、ずっと大きい値です。', 3: '$f(-4)=\\frac{e^{-4}-1}{-4}$ で、$\\frac14$ 倍の形です。' },
        good: '$f\\!\\left(-\\tfrac14\\right)=\\dfrac{e^{-\\frac14}-1}{-\\frac14}=4\\,(1-e^{-\\frac14})$。分子・分母の符号が両方変わります。',
        add: [{ t: 'm', size: 'sm', tex: 'f\\!\\left(-\\tfrac14\\right)=4\\,(1-e^{-\\frac14})' }] } },
      { clear: true, say: '$x$ の大小は $-\\frac14<0<\\frac13<\\frac12$。$f$ は $x<0$ でも $x>0$ でも増加で、$x\\to0$ で $1$ に近づくので、$x<0$ なら $f<1$、$x>0$ なら $f>1$ です。',
        add: [{ t: 'h', text: '(3)　f の増加を使って比べる' },
          { t: 'm', tex: '-\\frac14<0<\\frac13<\\frac12' },
          { t: 'm', size: 'sm', tex: 'f\\!\\left(-\\tfrac14\\right)<1<f\\!\\left(\\tfrac13\\right)<f\\!\\left(\\tfrac12\\right)', note: '$x<0$ で $f<1$\n$x>0$ で $f>1$' },
          { t: 'p', size: 'sm', text: '$p=4(1-e^{-\\frac14}),\\ q=3(e^{\\frac13}-1),\\ r=2(e^{\\frac12}-1)$ とおく。' },
          { t: 'fig', id: 'g3', col: 1, view: [-0.34, 0.8, 0.62, 1.4], w: 540, h: 338, items: [
            { k: 'axes', at: [-0.34, 0.8], tx: [[-0.25, '−1/4'], [1 / 3, '1/3'], [0.5, '1/2']], ty: [[1, '1']], xl: '', yl: '' },
            { k: 'fn', f: F, a: -0.33, b: -0.005, c: 'y' }, { k: 'fn', f: F, a: 0.005, b: 0.6, c: 'y', label: 'y=f(x)', lat: [0.35, 1.3] },
            { k: 'line', m: 0, n: 1, dash: true, c: 'd' },
            { k: 'pt', at: [0, 1], open: true, c: 'y' },
            { k: 'pt', at: [-0.25, 4 * (1 - Math.exp(-0.25))], c: 'p', name: '4(1−e^(−1/4))', dir: 'ne', size: 19 },
            { k: 'pt', at: [1 / 3, 3 * (Math.exp(1 / 3) - 1)], c: 'b', name: '3(e^(1/3)−1)', dir: 'nw', size: 19 },
            { k: 'pt', at: [0.5, 2 * (Math.exp(0.5) - 1)], c: 'g', name: '2(e^(1/2)−1)', dir: 'sw', size: 19 },
            { k: 'seg', a: [-0.25, 0.8], b: [-0.25, 4 * (1 - Math.exp(-0.25))], dash: true, c: 'p' }, { k: 'seg', a: [1 / 3, 0.8], b: [1 / 3, 3 * (Math.exp(1 / 3) - 1)], dash: true, c: 'b' },
            { k: 'seg', a: [0.5, 0.8], b: [0.5, 2 * (Math.exp(0.5) - 1)], dash: true, c: 'g' }] }] },
      { ask: { type: 'choice', q: '$p,\\ q,\\ r$ と $1$ を小さい順に並べると？',
        opts: ['$1<p<q<r$', '$r<q<1<p$', '$p<1<q<r$', '$p<1<r<q$'], ok: 2,
        why: { 0: '$x=-\\frac14<0$ の側では $f<1$。$p$ は $1$ より小さいです。', 1: '$f$ は増加なので、$x$ が大きいほど値が大きくなります。逆向きにしてはいけません。', 3: '$\\frac13<\\frac12$ で $f$ は増加。$r$ のほうが大きいです。' },
        good: '$x$ の小さい順に $f$ の値も大きくなります。数値では $0.885<1<1.187<1.297$ です。',
        add: [{ t: 'ans', label: '(3) 答', tex: '4(1-e^{-\\frac14})<1<3(e^{\\frac13}-1)<2(e^{\\frac12}-1)' }] } },
      { ask: { type: 'think', q: 'すべての自然数 $n$ で $n\\,(1-e^{-\\frac1n})<1<n\\,(e^{\\frac1n}-1)$ が成り立つことを、$f$ を使って示そう。',
        hint: '$x=-\\frac1n$ と $x=\\frac1n$ を $f$ に入れる。',
        ans: '$f\\!\\left(-\\frac1n\\right)=n(1-e^{-\\frac1n})<1<f\\!\\left(\\frac1n\\right)=n(e^{\\frac1n}-1)$',
        after: '(3) の3つの数は、$n=4,\\ 3,\\ 2$ の場合です。$n$ が大きいほど、どちらの数も $1$ に近づきます。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$G(x)$ は、$y=|t-x|e^t$ のグラフと $t$ 軸にはさまれた $0\\le t\\le2$ の面積です。$t=x$ で符号が変わる点に注意します。',
        add: [{ t: 'h', text: '(4)　絶対値をはずす' },
          { t: 'p', size: 'sm', text: '$0\\le x\\le2$：$t<x$ では $|t-x|=x-t$、$t>x$ では $|t-x|=t-x$' },
          { t: 'p', size: 'sm', text: '$x\\le0$：つねに $t-x\\ge0$　／　$x\\ge2$：つねに $t-x\\le0$' },
          ABSG('L1', 1.2)] },
      { clear: true, say: '$0\\le x\\le2$ のとき、$t=x$ で積分を2つに分けます。$x$ は積分の外に出せます。残る $\\displaystyle\\int te^t\\,dt$ は部分積分で求めます。',
        add: [{ t: 'h', text: '(4)　0 ≦ x ≦ 2 のとき' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}G(x)&=\\int_0^x(x-t)e^t\\,dt+\\int_x^2(t-x)e^t\\,dt\\\\ &=x\\int_0^xe^t\\,dt-\\int_0^xte^t\\,dt+\\int_x^2te^t\\,dt-x\\int_x^2e^t\\,dt\\end{aligned}' },
          { t: 'p', size: 'sm', text: '$I(x)=\\displaystyle\\int_0^xte^t\\,dt$ とおくと、$\\displaystyle\\int_x^2te^t\\,dt=I(2)-I(x)$。' },
          ABSG('L1b', 1.2)] },
      { ask: { type: 'choice', q: '部分積分で $I(x)=\\displaystyle\\int_0^xte^t\\,dt$ を求めると？',
        opts: ['$(x-1)e^x+1$', '$(x-1)e^x$', '$xe^x-e^x-1$', '$xe^x$'], ok: 0,
        why: { 1: '下端 $t=0$ を代入した分 $-(0-1)e^0=+1$ を忘れています。', 2: '$[te^t]_0^x-\\int_0^xe^t\\,dt=xe^x-(e^x-1)$。$-1$ ではなく $+1$ です。', 3: '$\\int e^t\\,dt$ を引く項（$-\\,(e^x-1)$）を落としています。' },
        good: '$I(x)=\\big[te^t\\big]_0^x-\\displaystyle\\int_0^xe^t\\,dt=xe^x-(e^x-1)=(x-1)e^x+1$。',
        add: [{ t: 'm', size: 'sm', tex: 'I(x)=(x-1)e^x+1,\\quad I(2)=e^2+1' }] } },
      { clear: true, say: '代入して整理します。$x\\int_0^xe^t\\,dt=x(e^x-1)$、$x\\int_x^2e^t\\,dt=x(e^2-e^x)$。$xe^x$ の項は $2xe^x-2xe^x$ で消えます。',
        add: [{ t: 'h', text: '(4)　G(x) を整理する' }, { t: 'm', size: 'sm', tex: 'I(x)=(x-1)e^x+1,\\quad I(2)=e^2+1' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}G(x)&=x(e^x-1)-2I(x)+I(2)-x(e^2-e^x)\\\\ &=2xe^x-(1+e^2)x-2(x-1)e^x-2+e^2+1\\\\ &=\\hy{2e^x-(1+e^2)x+e^2-1}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$0<x<2$ のとき、$G\'(x)$ は？',
        opts: ['$2xe^x-(1+e^2)$', '$e^x-(1+e^2)$', '$2e^x-(1+e^2)x$', '$2e^x-(1+e^2)$'], ok: 3,
        why: { 0: '$2e^x$ の微分は $2e^x$ です。$x$ はかかりません。', 1: '$2e^x$ の係数 $2$ を落としています。', 2: '$-(1+e^2)x$ を微分すると $x$ が消えて $-(1+e^2)$ です。' },
        good: '$G\'(x)=2e^x-(1+e^2)$ は増加関数なので、符号が負から正に変わる点で最小です。',
        add: [{ t: 'm', size: 'sm', tex: "G'(x)=2e^x-(1+e^2)=0\\iff e^x=\\frac{1+e^2}{2}" }] } },
      { clear: true, say: '$x\\le0$ では $G(x)=(e^2+1)-(e^2-1)x$ で減少、$x\\ge2$ では $G(x)=(e^2-1)x-(e^2+1)$ で増加です（$\\int_0^2e^t\\,dt=e^2-1$、$\\int_0^2te^t\\,dt=e^2+1$）。',
        add: [{ t: 'h', text: '(4)　x の範囲で場合分け' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['$x$ の範囲', '$G(x)$', '増減'],
            ['$x\\le0$', '$(e^2+1)-(e^2-1)x$', '減少'],
            ['$0\\le x\\le2$', "$G'=2e^x-(1+e^2)$", '$x=\\log\\frac{1+e^2}{2}$ で最小'],
            ['$x\\ge2$', '$(e^2-1)x-(e^2+1)$', '増加']] },
          { t: 'p', size: 'sm', text: '$1<\\frac{1+e^2}{2}<e^2$ なので、$0<\\log\\frac{1+e^2}{2}<2$ （範囲の中）。' },
          { t: 'ans', label: '(4) 答', tex: 'x=\\log\\frac{1+e^2}{2}\\ \\ (\\fallingdotseq1.43)' },
          { t: 'fig', id: 'gG', col: 1, view: [-1.6, -1.6, 3.5, 12.5], w: 540, h: 384, items: [
            { k: 'axes', tx: [[-1, '−1'], [1, '1'], [2, '2'], [3, '3']], ty: [[5, '5'], [10, '10']] },
            { k: 'fn', f: '(E*E+1)-(E*E-1)*x', a: -1.5, b: 0, c: 'b' },
            { k: 'fn', f: '2*exp(x)-(1+E*E)*x+E*E-1', a: 0, b: 2, c: 'y', label: 'y=G(x)', lat: [0.5, 6.4] },
            { k: 'fn', f: '(E*E-1)*x-(E*E+1)', a: 2, b: 3.4, c: 'b' },
            { k: 'line', x: X0, dash: true, c: 'p' },
            { k: 'pt', at: [X0, GMIN], c: 'p', name: '最小', dir: 's', size: 21 }] }] },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。$x=\\log\\frac{1+e^2}{2}$ のとき $2e^x=1+e^2$ なので、$G(x)$ の式の $2e^x$ をそのまま置きかえられます。',
        add: [{ t: 'h', text: '(5)　最小値を求める' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}G\\!\\left(\\log\\tfrac{1+e^2}{2}\\right)&=(1+e^2)-(1+e^2)\\log\\frac{1+e^2}{2}+e^2-1\\\\ &=2e^2-(1+e^2)\\log\\frac{1+e^2}{2}\\end{aligned}' },
          { t: 'ans', label: '(5) 答', tex: '\\text{最小値}\\ \\ 2e^2-(1+e^2)\\log\\frac{1+e^2}{2}\\ \\ (\\fallingdotseq2.75)' },
          ABSG('L2', X0, [{ k: 'label', at: [0.15, 4.6], text: '面積 ≒ 2.75（最小）', c: 'g', size: 20, plain: true }])] },
      { ask: { type: 'think', q: "$G'(x)=\\displaystyle\\int_0^xe^t\\,dt-\\int_x^2e^t\\,dt$ と書けます。最小になる $x$ には、どんな意味がある？",
        hint: '$G\'(x)=(e^x-1)-(e^2-e^x)$。$G\'(x)=0$ のとき、2つの積分はどうなっている？',
        ans: '$\\displaystyle\\int_0^xe^t\\,dt=\\int_x^2e^t\\,dt$、つまり $x$ は、重み $e^t$ をつけた区間 $[0,\\,2]$ を **半分ずつに分ける** 点',
        after: '重みのない $\\int_0^2|t-x|\\,dt$ なら、最小になるのは中点 $x=1$。重み $e^t$ が右ほど大きいので、$x\\fallingdotseq1.43$ と右に寄ります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。前の小問の結果を次で使う、というつながりを意識すると、長い大問も見通しよく解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
