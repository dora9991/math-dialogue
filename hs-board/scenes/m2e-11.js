/* 数学Ⅱ 第5章 微分法と積分法 積分 ⑤：定積分で表された関数
   例・数値はすべて自作。答え・誤答は python3（sympy）で検算ずみ。
   ∫₁ˣ(3t²−2t)dt=x³−x²、d/dx∫₂ˣ(t²−5t+1)dt=x²−5x+1、g(x)=∫₀ˣ(t²−4t+3)dt：極大 g(1)=4/3、極小 g(3)=0
   ∫ₐˣf(t)dt=x²−3x−4 → f(x)=2x−3、a=−1, 4
   f(x)=3x²+4x−2∫₀¹f(t)dt → k=3−2k、k=1、f(x)=3x²+4x−2、考えてみよう f(x)=2x+∫₀²f(t)dt → k=−4、f(x)=2x−4 */
(function () {
  const POINTS = [
    '$\\displaystyle\\int_a^xf(t)\\,dt$ は $x$ の関数。$\\dfrac{d}{dx}\\displaystyle\\int_a^xf(t)\\,dt=f(x)$（$a$ は定数）',
    '$\\displaystyle\\int_a^xf(t)\\,dt=(x\\text{ の式})$ は、**両辺を微分** して $f(x)$、**$x=a$ を代入**（左辺は 0）して $a$ を求める',
    '$\\displaystyle\\int_0^1f(t)\\,dt$ のように上端・下端が数の定積分は **定数**。$k$ とおいて $f(x)$ を表し、$k$ の方程式をつくる'
  ];

  HB.lesson({
    id: 'm2e-11', field: '数学Ⅱ　微分法と積分法', title: '定積分で表された関数', level: '積分', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\dfrac{d}{dx}\\displaystyle\\int_2^x(t^2-5t+1)\\,dt$', '(2)　$g(x)=\\displaystyle\\int_0^x(t^2-4t+3)\\,dt$ の極値',
        '(3)　$\\displaystyle\\int_a^xf(t)\\,dt=x^2-3x-4$ をみたす $f(x)$ と定数 $a$', '(4)　$f(x)=3x^2+4x-2\\displaystyle\\int_0^1f(t)\\,dt$ をみたす $f(x)$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'これまでの定積分は、上端も下端も数で、答えは1つの数でした。この時間は、**上端が $x$** の定積分を考えます。積分の最後の時間です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$\\displaystyle\\int_a^xf(t)\\,dt$ が $x$ の関数であることがわかり、微分できる\n定積分をふくむ等式から、関数や定数を決められる' }] },

      // ---------- 上端が x ----------
      { clear: true, part: '上端が x', say: '上端を $x$ にすると、値は $x$ によって決まるので、$x$ の関数です。上端の $x$ と区別するため、積分の文字は $t$ にします。',
        add: [{ t: 'h', text: '上端が x の定積分' },
          { t: 'm', tex: '\\begin{aligned}\\int_1^{\\hy{x}}(3t^2-2t)\\,dt&=\\Big[\\,t^3-t^2\\,\\Big]_1^{x}\\\\ &=(x^3-x^2)-(1-1)=x^3-x^2\\end{aligned}' },
          { t: 'p', size: 'sm', text: '$t$ に上端 $x$ と下端 $1$ を入れる → $x$ の式になる' }] },
      { say: 'この結果を $x$ で微分すると $3x^2-2x$。もとの被積分関数 $3t^2-2t$ の $t$ を、$x$ にかえたものになりました。',
        add: [{ t: 'm', tex: '\\frac{d}{dx}(x^3-x^2)=\\hy{3x^2-2x}', note: '← $3t^2-2t$ の $t$ を $x$ に' }] },
      { say: 'いつもそうなります。$f(t)$ の原始関数を $F(t)$ とすると、$F(x)-F(a)$ の $F(a)$ は定数なので、微分すると $0$ です。',
        add: [{ t: 'box', c: 'p', label: '大切', text: '$\\displaystyle\\frac{d}{dx}\\int_a^xf(t)\\,dt=f(x)$　（$a$ は定数）' },
          { t: 'm', col: 1, size: 'sm', tex: "\\begin{aligned}&\\frac{d}{dx}\\{F(x)-F(a)\\}\\\\ &=F'(x)-0=f(x)\\end{aligned}", note: '$F(a)$ は定数' }] },
      { ask: { type: 'choice', q: '$\\dfrac{d}{dx}\\displaystyle\\int_2^x(t^2-5t+1)\\,dt$ は？',
        opts: ['$2x-5$', '$x^2-5x+1$', '$\\frac13x^3-\\frac52x^2+x$', '$x^2-5x+6$'], ok: 1,
        why: { 0: '被積分関数をさらに微分しています。積分して微分するので、もとにもどるだけです。', 2: 'それは積分しただけ（の一部）。そのあと $x$ で微分します。', 3: '下端の 2 を入れた値 $F(2)$ は定数なので、微分すると消えます。' },
        good: '公式どおり、$t$ を $x$ にかえるだけ。下端の 2 は関係しません。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\frac{d}{dx}\\int_2^x(t^2-5t+1)\\,dt=\\ans{x^2-5x+1}' }] } },

      // ---------- 極値 ----------
      { clear: true, part: '極値を調べる', say: '$g(x)=\\displaystyle\\int_0^x(t^2-4t+3)\\,dt$ の極値を調べます。積分を計算しなくても、$g\'(x)$ はすぐにわかります。',
        add: [{ t: 'h', text: 'g(x) の極値' },
          { t: 'm', tex: "g'(x)=x^2-4x+3=(x-1)(x-3)", note: '公式で、$t$ を $x$ に' }] },
      { ask: { type: 'choice', q: '$g(x)$ が **極大** となる $x$ は？',
        opts: ['$x=1$', '$x=3$', '$x=2$', '$x=0$'], ok: 0,
        why: { 1: "$x=3$ の前後で $g'(x)$ は − から + に変わります。極小です。", 2: "$x=2$ は $g'(x)$ のグラフの頂点。$g'(2)\\neq0$ なので極値ではありません。", 3: '$x=0$ は下端です。$g\'(0)=3\\neq0$ なので極値ではありません。' },
        good: "$g'(x)$ は $x=1$ の前後で + から − に変わるので、$x=1$ で極大です。",
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$\\cdots$', '$1$', '$\\cdots$', '$3$', '$\\cdots$'], ["$g'(x)$", '$+$', '$0$', '$-$', '$0$', '$+$'], ['$g(x)$', '↗', '極大', '↘', '極小', '↗']] }] } },
      { say: '極値は、$g(x)$ に代入して求めます。ここで積分を計算します。$g(1)=\\frac13-2+3=\\frac43$、$g(3)=9-18+9=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'g(x)=\\Big[\\,\\frac13t^3-2t^2+3t\\,\\Big]_0^x=\\frac13x^3-2x^2+3x' },
          { t: 'ans', label: '答', text: '$x=1$ で極大値 $\\dfrac43$、$x=3$ で極小値 $0$' },
          { t: 'fig', id: 'gx', col: 1, view: [-0.8, -1.3, 4.6, 2.5], w: 560, h: 400, items: [
            { k: 'axes', tx: [1, 2, 4], ty: [] },
            { k: 'fn', f: 'x**3/3-2*x**2+3*x', a: -0.45, b: 4.35, c: 'y', label: 'y=g(x)', lat: [4.3, 2.15], la: 'end' },
            { k: 'seg', a: [1, 0], b: [1, 4 / 3], dash: true, c: 'd' },
            { k: 'pt', at: [1, 4 / 3], name: '極大 4/3', dir: 'n', c: 'p', size: 21 }, { k: 'pt', at: [3, 0], name: '極小 0（x=3）', dir: 's', off: 28, c: 'b', size: 21 }] }] },

      // ---------- 関数と定数を決める ----------
      { clear: true, part: '関数と a を決める', say: '$\\displaystyle\\int_a^xf(t)\\,dt=x^2-3x-4$ をみたす関数 $f(x)$ と定数 $a$ を求めます。まず、**両辺を $x$ で微分** します。',
        add: [{ t: 'h', text: '等式から f(x) と a を求める' },
          { t: 'box', c: 'p', size: 'sm', label: '問', text: '$\\displaystyle\\int_a^xf(t)\\,dt=x^2-3x-4$ をみたす $f(x)$ と定数 $a$ を求めよ。' },
          { t: 'm', tex: 'f(x)=2x-3', note: '両辺を $x$ で微分' }] },
      { ask: { type: 'choice', q: '等式の両辺に $x=a$ を代入すると、左辺 $\\displaystyle\\int_a^af(t)\\,dt$ はいくつ？',
        opts: ['$f(a)$', '$a$', '$F(a)$', '$0$'], ok: 3,
        why: { 0: '上端と下端が同じ定積分です。$f(a)$ ではありません。', 1: '上端と下端が同じ定積分は、区間の幅が 0 です。', 2: '$F(a)-F(a)$ なので、ひき算で消えます。' },
        good: '上端と下端が同じなので $0$。右辺は $a^2-3a-4$ なので、$a^2-3a-4=0$ が成り立ちます。',
        add: [{ t: 'm', tex: '0=a^2-3a-4', note: '$x=a$ を代入' }] } },
      { ask: { type: 'choice', q: '$a^2-3a-4=0$ より、$a$ の値は？',
        opts: ['$a=1,\\ -4$', '$a=4$ だけ', '$a=-1,\\ 4$', '$a=\\dfrac32$'], ok: 2,
        why: { 0: '$(a+1)(a-4)=0$ です。符号が逆になっています。', 1: '$a=-1$ でも $1+3-4=0$ になります。どちらも答えです。', 3: 'それは $f(a)=2a-3=0$ を解いたもの。$x=a$ は等式に代入します。' },
        good: '$(a+1)(a-4)=0$ より　$a=-1,\\ 4$。',
        add: [{ t: 'ans', label: '答', text: '$f(x)=2x-3$、$a=-1,\\ 4$' }] } },

      // ---------- 定数とおく ----------
      { clear: true, part: '定数 k とおく', say: '$f(x)=3x^2+4x-2\\displaystyle\\int_0^1f(t)\\,dt$ をみたす $f(x)$ を求めます。$\\displaystyle\\int_0^1f(t)\\,dt$ は上端も下端も数なので、**ただの定数** です。',
        add: [{ t: 'h', text: '定積分を定数 k とおく' },
          { t: 'box', c: 'p', size: 'sm', label: '問', text: '$f(x)=3x^2+4x-2\\displaystyle\\int_0^1f(t)\\,dt$ をみたす $f(x)$ を求めよ。' },
          { t: 'm', tex: '\\int_0^1f(t)\\,dt=\\hy{k}\\ \\text{とおくと}\\ \\ f(x)=3x^2+4x-2\\hy{k}' }] },
      { say: '$k=\\displaystyle\\int_0^1f(t)\\,dt$ に、$f(t)=3t^2+4t-2k$ を入れて計算します。$k$ も定数として、いっしょに積分します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}k&=\\int_0^1(3t^2+4t-2k)\\,dt\\\\ &=\\Big[\\,t^3+2t^2-2kt\\,\\Big]_0^1=3-2k\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$k=3-2k$ より、$k$ の値は？',
        opts: ['$k=3$', '$k=-3$', '$k=\\dfrac53$', '$k=1$'], ok: 3,
        why: { 0: '右辺の $-2k$ を落としています。$f(t)$ の中にも $k$ があります。', 1: '$k=3-2k$ の $-2k$ を移項すると $3k=3$ です。', 2: '$4t$ の原始関数は $2t^2$。$4t^2$ にすると $1+4-2k$ になってしまいます。' },
        good: '$3k=3$ より $k=1$。よって $f(x)=3x^2+4x-2$。',
        add: [{ t: 'm', col: 1, tex: '3k=3\\quad\\therefore\\ k=1' }, { t: 'ans', col: 1, label: '答', tex: 'f(x)=3x^2+4x-2' },
          { t: 'p', col: 1, size: 'sm', text: '検算：$\\displaystyle\\int_0^1(3t^2+4t-2)\\,dt=1+2-2=1$　OK' }] } },
      { ask: { type: 'think', q: '$f(x)=2x+\\displaystyle\\int_0^2f(t)\\,dt$ をみたす $f(x)$ を求めよう。',
        hint: '$\\displaystyle\\int_0^2f(t)\\,dt=k$ とおくと $f(x)=2x+k$。これを $\\displaystyle\\int_0^2$ に入れる。',
        ans: '$k=\\displaystyle\\int_0^2(2t+k)\\,dt=4+2k$ より $k=-4$。　$f(x)=2x-4$',
        after: '検算：$\\displaystyle\\int_0^2(2t-4)\\,dt=4-8=-4=k$。区間の幅が 2 なので、$k$ の積分は $2k$ になる点に注意。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: 'k=4+2k\\ \\Rightarrow\\ f(x)=2x-4', note: '考えてみよう' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。これで数学Ⅱの微分・積分はおしまいです。微分と積分が「逆の計算」であることを、いつも意識しておきましょう。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
