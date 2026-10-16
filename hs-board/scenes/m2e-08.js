/* 数学Ⅱ 第5章 微分法と積分法 積分 ②：定積分
   例・数値はすべて自作。答え・誤答は python3（sympy）で検算ずみ。
   ∫₁³x²dx=26/3、∫₋₁²(3x²−2x)dx=6（F(2)=4, F(−1)=−2）、∫₃¹x²dx=−26/3、∫₁⁴=5・∫₁²=2 → ∫₂⁴=3
   ∫₋₁²(x²−2x)dx+∫₂³(x²−2x)dx=∫₋₁³(x²−2x)dx=4/3、∫₁³(2x²+x)dx−∫₁³(2x²−3x)dx=∫₁³4xdx=16、考えてみよう ∫₋₁¹(6x²+5x−1)dx=2 */
(function () {
  const POINTS = [
    "$F'(x)=f(x)$ のとき　$\\displaystyle\\int_a^b f(x)\\,dx=\\Big[\\,F(x)\\,\\Big]_a^b=F(b)-F(a)$。積分定数 $C$ は消えるので書かない",
    '上端の値 $F(b)$ から **下端の値 $F(a)$ をひく**。負の数を代入するときは、かっこをつけて符号に注意',
    '性質：$\\displaystyle\\int_a^a=0$、上端と下端を入れかえると **符号が変わる**、$\\displaystyle\\int_a^c+\\int_c^b=\\int_a^b$。区間や被積分関数をまとめて計算を楽にする'
  ];

  HB.lesson({
    id: 'm2e-08', field: '数学Ⅱ　微分法と積分法', title: '定積分', level: '積分', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\displaystyle\\int_1^3x^2\\,dx$　　$\\displaystyle\\int_{-1}^2(3x^2-2x)\\,dx$', '(2)　$\\displaystyle\\int_3^1x^2\\,dx$',
        '(3)　$\\displaystyle\\int_{-1}^2(x^2-2x)\\,dx+\\int_2^3(x^2-2x)\\,dx$', '(4)　$\\displaystyle\\int_1^3(2x^2+x)\\,dx-\\int_1^3(2x^2-3x)\\,dx$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、不定積分 $\\displaystyle\\int f(x)\\,dx=F(x)+C$ を学びました。この時間は、それを使って、区間を決めた **定積分** を計算します。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**定積分** の意味と書き方がわかり、計算できる\n定積分の性質を使って、計算をくふうできる' }] },

      // ---------- 定義 ----------
      { clear: true, part: '定積分', say: '$f(x)$ の原始関数を $F(x)$ とします。$F(b)-F(a)$ を、$f(x)$ の $a$ から $b$ までの **定積分** といい、下のように書きます。',
        add: [{ t: 'h', text: '定積分' },
          { t: 'box', c: 'y', label: '定義', text: "$F'(x)=f(x)$ のとき\n$\\displaystyle\\int_a^b f(x)\\,dx=\\Big[\\,F(x)\\,\\Big]_a^b=F(b)-F(a)$" },
          { t: 'p', size: 'sm', text: '$a$ を **下端**、$b$ を **上端** という' }] },
      { say: '原始関数に $C$ をつけて計算しても、ひき算で $C$ は消えます。だから、定積分では $C$ を書きません。',
        add: [{ t: 'm', size: 'sm', tex: '\\Big[\\,F(x)\\hy{+C}\\,\\Big]_a^b=\\{F(b)\\hy{+C}\\}-\\{F(a)\\hy{+C}\\}=F(b)-F(a)', note: '$C$ は消える' }] },
      { say: 'やってみます。$x^2$ の原始関数 $\\frac13x^3$ に、上端の 3 と下端の 1 を入れて、**上端の値 − 下端の値** です。',
        add: [{ t: 'm', col: 1, tex: '\\begin{aligned}\\int_1^3x^2\\,dx&=\\Big[\\,\\frac13x^3\\,\\Big]_1^3\\\\ &=\\frac{27}{3}-\\frac13=\\ans{\\frac{26}{3}}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-1}^2(3x^2-2x)\\,dx$ の値は？',
        opts: ['$4$', '$-6$', '$6$', '$2$'], ok: 2,
        why: { 0: 'それは上端の値 $F(2)$ だけ。下端の値 $F(-1)$ をひきます。', 1: '「下端 − 上端」と逆にひいています。', 3: '$F(-1)=-1-1=-2$ をひくので $4-(-2)$。符号のミスです。' },
        good: '$F(x)=x^3-x^2$ として、$F(2)-F(-1)=4-(-2)=6$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}&\\int_{-1}^2(3x^2-2x)\\,dx=\\Big[\\,x^3-x^2\\,\\Big]_{-1}^2\\\\ &=(8-4)-\\{(-1)^3-(-1)^2\\}\\\\ &=4-(-2)=\\ans{6}\\end{aligned}' }] } },
      { say: '定積分の値は、積分に使う文字には関係しません。$x$ のかわりに $t$ を使っても同じ値です。（この見方は、あとの時間で使います）',
        add: [{ t: 'm', tex: '\\int_1^3t^2\\,dt=\\int_1^3x^2\\,dx=\\frac{26}{3}', note: '文字をかえても\n値は同じ' }] },

      // ---------- 性質 ----------
      { clear: true, part: '定積分の性質', say: '不定積分と同じく、係数は前に出せて、たし算・ひき算は分けて計算できます。さらに、定積分ならではの性質が3つあります。',
        add: [{ t: 'h', text: '定積分の性質' },
          { t: 'm', size: 'sm', tex: '\\int_a^bkf(x)\\,dx=k\\int_a^bf(x)\\,dx', note: '$k$ は定数' },
          { t: 'm', size: 'sm', tex: '\\int_a^b\\{f(x)\\pm g(x)\\}\\,dx=\\int_a^bf(x)\\,dx\\pm\\int_a^bg(x)\\,dx' }] },
      { say: '上端と下端が同じなら $F(a)-F(a)=0$。上端と下端を入れかえると $F(a)-F(b)$ なので、**符号だけが変わります**。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '性質 A', text: '$\\displaystyle\\int_a^af(x)\\,dx=0$' },
          { t: 'box', c: 'b', size: 'sm', label: '性質 B', text: '$\\displaystyle\\int_b^af(x)\\,dx=-\\int_a^bf(x)\\,dx$' },
          { t: 'p', col: 1, size: 'sm', text: 'A：$F(a)-F(a)=0$\nB：$F(a)-F(b)=-\\{F(b)-F(a)\\}$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_3^1x^2\\,dx$ の値は？（$\\displaystyle\\int_1^3x^2\\,dx=\\frac{26}{3}$）',
        opts: ['$\\dfrac{26}{3}$', '$-\\dfrac{26}{3}$', '$\\dfrac{28}{3}$', '$0$'], ok: 1,
        why: { 0: '上端と下端を入れかえると、符号が変わります。', 2: '$F(1)-F(3)=\\frac13-9$。ひき算です。', 3: '0 になるのは、上端と下端が同じときです。' },
        good: '上端と下端を入れかえたので、符号だけ変わって $-\\dfrac{26}{3}$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\int_3^1x^2\\,dx=-\\int_1^3x^2\\,dx=\\ans{-\\frac{26}{3}}' }] } },
      { clear: true, part: '区間をつなぐ', say: '$a$ から $c$ まで、$c$ から $b$ までの定積分をたすと、$a$ から $b$ までの定積分になります。$F(c)$ が打ち消し合うからです。',
        add: [{ t: 'h', text: '区間をつなぐ・分ける' },
          { t: 'box', c: 'b', label: '性質 C', text: '$\\displaystyle\\int_a^cf(x)\\,dx+\\int_c^bf(x)\\,dx=\\int_a^bf(x)\\,dx$' },
          { t: 'm', size: 'sm', tex: '\\{F(c)-F(a)\\}+\\{F(b)-F(c)\\}=F(b)-F(a)' },
          { t: 'fig', id: 'nl', col: 1, view: [-0.6, -1.6, 6.6, 1.6], w: 560, h: 250, items: [
            { k: 'numline', ticks: [[1, 'a'], [3, 'c'], [5, 'b']] },
            { k: 'dim', a: [1, 0], b: [3, 0], dy: -30, label: 'a → c', c: 'y' },
            { k: 'dim', a: [3, 0], b: [5, 0], dy: -30, label: 'c → b', c: 'g' },
            { k: 'dim', a: [1, 0], b: [5, 0], dy: 70, label: 'a → b', c: 'p' }] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_1^4f(x)\\,dx=5,\\ \\int_1^2f(x)\\,dx=2$ のとき、$\\displaystyle\\int_2^4f(x)\\,dx$ は？',
        opts: ['$7$', '$-3$', '$10$', '$3$'], ok: 3,
        why: { 0: '$\\int_1^2+\\int_2^4=\\int_1^4$ なので、5 から 2 をひきます。', 1: '$\\int_2^4=\\int_1^4-\\int_1^2=5-2$。ひく順が逆です。', 2: '区間をつなぐときは、たし算です。かけ算ではありません。' },
        good: '$\\int_1^2+\\int_2^4=\\int_1^4$ より　$2+\\int_2^4=5$、$\\int_2^4=3$。',
        add: [{ t: 'm', size: 'sm', tex: '2+\\int_2^4f(x)\\,dx=5\\quad\\therefore\\ \\int_2^4f(x)\\,dx=\\ans{3}' }] } },

      // ---------- 性質を使う ----------
      { clear: true, part: '計算のくふう', say: '性質を使うと、計算が楽になります。被積分関数が同じで、区間がつながっているので、**1つの定積分にまとめます**。',
        add: [{ t: 'h', text: '性質を使って計算する' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}&\\int_{-1}^2(x^2-2x)\\,dx+\\int_2^3(x^2-2x)\\,dx\\\\ &=\\int_{-1}^{\\hy{3}}(x^2-2x)\\,dx=\\Big[\\,\\frac13x^3-x^2\\,\\Big]_{-1}^3\\\\ &=(9-9)-\\left(-\\frac13-1\\right)=\\ans{\\frac43}\\end{aligned}' }] },
      { say: '今度は、区間が同じで、被積分関数がちがう2つの定積分の差です。**被積分関数をまとめる** と、$2x^2$ が消えます。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}&\\int_1^3(2x^2+x)\\,dx-\\int_1^3(2x^2-3x)\\,dx\\\\ &=\\int_1^3\\{(2x^2+x)-(2x^2-3x)\\}\\,dx\\\\ &=\\int_1^3\\hy{4x}\\,dx\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_1^3 4x\\,dx$ の値は？',
        opts: ['$16$', '$32$', '$-8$', '$18$'], ok: 0,
        why: { 1: '$4x$ の原始関数は $2x^2$。2 で割るのを忘れています。', 2: '$x-(-3x)=4x$。ひくときの符号に注意。', 3: '下端の値 $2\\cdot1^2=2$ をひき忘れています。' },
        good: '$\\Big[\\,2x^2\\,\\Big]_1^3=18-2=16$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '=\\Big[\\,2x^2\\,\\Big]_1^3=18-2=\\ans{16}' }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\int_{-1}^1(6x^2+5x-1)\\,dx$ を計算しよう。',
        hint: '原始関数は $F(x)=2x^3+\\dfrac52x^2-x$。$F(1)-F(-1)$ を、かっこをつけて計算。',
        ans: '$F(1)-F(-1)=\\left(2+\\dfrac52-1\\right)-\\left(-2+\\dfrac52+1\\right)=\\dfrac72-\\dfrac32=2$',
        after: '$\\frac52x^2$ の部分は、$F(1)$ と $F(-1)$ で同じ値なので打ち消し合いました。$-a$ から $a$ までの定積分では、$x,\\ x^3$ の項は 0 になります。',
        add: [{ t: 'gap', col: 1, h: 20 }, { t: 'm', col: 1, size: 'sm', tex: '\\int_{-1}^1(6x^2+5x-1)\\,dx=2', note: '考えてみよう' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、定積分が **面積** を表すことを学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
