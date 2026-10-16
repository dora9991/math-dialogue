/* 数学Ⅰ 第1章 数と式 2節 実数 ④：分母の有理化
   例はすべて自作。答え・途中式・誤答は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '分母に根号があるときは、分母と分子に同じ数をかけて、分母に根号をふくまない形にする（**有理化**）。$\\dfrac{a}{\\sqrt b}=\\dfrac{a\\sqrt b}{b}$。最後に約分を確かめる',
    '分母が $\\sqrt a+\\sqrt b$ なら $\\sqrt a-\\sqrt b$ を（$\\sqrt a-\\sqrt b$ なら $\\sqrt a+\\sqrt b$ を）かける。$(\\sqrt a+\\sqrt b)(\\sqrt a-\\sqrt b)=a-b$ で根号が消える',
    '式の値は、$x+y$ と $xy$ を先に求めて、$x^2+y^2=(x+y)^2-2xy$ のように組み立てると楽'
  ];
  HB.lesson({
    id: 'm1a-12', field: '数学Ⅰ　数と式', title: '分母の有理化', level: '2節 実数', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\dfrac{3}{2\\sqrt6}$ の分母を有理化する', '(2)　$\\dfrac{6}{3+\\sqrt3}$ の分母を有理化する', '(3)　$\\dfrac{\\sqrt7+\\sqrt3}{\\sqrt7-\\sqrt3}$ の分母を有理化する', '(4)　$x=\\dfrac{2}{\\sqrt6-2}$、$y=\\dfrac{2}{\\sqrt6+2}$ のとき、$xy$、$x^2+y^2$、$\\dfrac yx+\\dfrac xy$ の値'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '分母に根号があると、値の見当がつけにくい式になります。この時間は、分母に根号のない形に直す方法を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '分母の根号をなくす **有理化** ができる\n有理化を使って、**式の値** をくふうして求められる' }] },

      // ---------- 有理化 ----------
      { clear: true, part: '有理化', say: '$\\dfrac{1}{\\sqrt2}$ は $1\\div1.41421\\cdots$ で、計算しにくい。分母・分子に $\\sqrt2$ をかけると $\\dfrac{\\sqrt2}{2}$ になり、$1.41421\\cdots\\div2$ ですみます。',
        add: [{ t: 'h', text: '分母の有理化' },
          { t: 'm', tex: '\\frac{1}{\\sqrt2}=\\frac{1\\times\\hy{\\sqrt2}}{\\sqrt2\\times\\hy{\\sqrt2}}=\\frac{\\sqrt2}{2}', note: '分母・分子に\n同じ数をかける' },
          { t: 'p', col: 1, size: 'xs', text: '値を求めるとき' }, { t: 'm', col: 1, size: 'sm', tex: '\\frac{1}{\\sqrt2}=1\\div1.41421\\cdots', note: '計算しにくい' },
          { t: 'm', col: 1, size: 'sm', tex: '\\frac{\\sqrt2}{2}=1.41421\\cdots\\div2', note: '計算しやすい' }] },
      { say: '分母に根号をふくまない形に直すことを、分母の **有理化** といいます。答えは、ふつう有理化した形で書きます。',
        add: [{ t: 'box', c: 'y', label: '有理化', text: '$\\dfrac{a}{\\sqrt b}=\\dfrac{a\\times\\sqrt b}{\\sqrt b\\times\\sqrt b}=\\dfrac{a\\sqrt b}{b}$' }] },
      { say: '有理化したあとは、**約分** できないか確かめます。',
        add: [{ t: 'm', tex: '\\frac{6}{\\sqrt3}=\\frac{6\\sqrt3}{3}=2\\sqrt3', note: '6 と 3 で約分' }] },
      { ask: { type: 'choice', q: '$\\dfrac{3}{2\\sqrt6}$ の分母を有理化すると？',
        opts: ['$\\dfrac{\\sqrt6}{2}$', '$\\dfrac{\\sqrt6}{12}$', '$\\dfrac{3\\sqrt6}{4}$', '$\\dfrac{\\sqrt6}{4}$'], ok: 3,
        why: { 0: '分母は $2\\sqrt6\\times\\sqrt6=2\\times6=12$。係数の 2 をわすれています。', 1: '$\\dfrac{3\\sqrt6}{12}$ の約分は、分子の 3 と分母の 12 を **両方** 3 でわります。', 2: '約分は、分子と分母を同じ数でわります。分母だけをわっています。' },
        good: '$\\dfrac{3\\times\\sqrt6}{2\\sqrt6\\times\\sqrt6}=\\dfrac{3\\sqrt6}{12}=\\dfrac{\\sqrt6}{4}$。',
        add: [{ t: 'm', tex: '\\frac{3}{2\\sqrt6}=\\frac{3\\sqrt6}{12}=\\frac{\\sqrt6}{4}' }] } },

      // ---------- 分母が2項 ----------
      { clear: true, part: '分母が2項', say: '分母が $\\sqrt5+\\sqrt3$ のときは、$\\sqrt5$ をかけても根号が残ります。そこで **和と差の積** $(a+b)(a-b)=a^2-b^2$ を使います。',
        add: [{ t: 'h', text: '分母が $\\sqrt a+\\sqrt b$ の形' },
          { t: 'box', c: 'y', label: '根号が消える', text: '$(\\sqrt a+\\sqrt b)(\\sqrt a-\\sqrt b)=a-b$' }] },
      { say: '分母が $\\sqrt5+\\sqrt3$ なら、分母・分子に $\\sqrt5-\\sqrt3$ をかけます。分母は $5-3=2$ になります。',
        add: [{ t: 'm', tex: '\\begin{aligned}\\frac{4}{\\sqrt5+\\sqrt3}&=\\frac{4(\\hy{\\sqrt5-\\sqrt3})}{(\\sqrt5+\\sqrt3)(\\hy{\\sqrt5-\\sqrt3})}\\\\ &=\\frac{4(\\sqrt5-\\sqrt3)}{2}=2\\sqrt5-2\\sqrt3\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\dfrac{6}{3+\\sqrt3}$ の分母を有理化すると？',
        opts: ['$3+\\sqrt3$', '$\\dfrac{3-\\sqrt3}{2}$', '$3-\\sqrt3$', '$18-6\\sqrt3$'], ok: 2,
        why: { 0: 'かけるのは $3-\\sqrt3$。分子は $6(3-\\sqrt3)$ で、符号はマイナスです。', 1: '分母は $3^2-(\\sqrt3)^2=9-3=6$。たし算ではなく **ひき算**。', 3: '分子の $6(3-\\sqrt3)$ を、分母の 6 でわるのをわすれています。' },
        good: '$\\dfrac{6(3-\\sqrt3)}{(3+\\sqrt3)(3-\\sqrt3)}=\\dfrac{6(3-\\sqrt3)}{6}=3-\\sqrt3$。',
        add: [{ t: 'm', tex: '\\frac{6}{3+\\sqrt3}=\\frac{6(3-\\sqrt3)}{9-3}=3-\\sqrt3' }] } },
      { ask: { type: 'think', q: '$\\dfrac{\\sqrt7+\\sqrt3}{\\sqrt7-\\sqrt3}$ の分母を有理化しよう。',
        hint: '分母・分子に $\\sqrt7+\\sqrt3$ をかける。分子は $(\\sqrt7+\\sqrt3)^2$ になる。',
        ans: '$\\dfrac{(\\sqrt7+\\sqrt3)^2}{7-3}=\\dfrac{10+2\\sqrt{21}}{4}=\\dfrac{5+\\sqrt{21}}{2}$',
        after: '最後に、分子・分母を 2 でわって約分します。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}\\frac{\\sqrt7+\\sqrt3}{\\sqrt7-\\sqrt3}&=\\frac{(\\sqrt7+\\sqrt3)^2}{7-3}\\\\ &=\\frac{10+2\\sqrt{21}}{4}\\\\ &=\\frac{5+\\sqrt{21}}{2}\\end{aligned}' }] } },

      // ---------- 式の値 ----------
      { clear: true, part: '式の値', say: '$x=\\dfrac{2}{\\sqrt6-2}$、$y=\\dfrac{2}{\\sqrt6+2}$ のとき、いろいろな式の値を求めます。まず $x$、$y$ をそれぞれ有理化します。',
        add: [{ t: 'h', text: '式の値' },
          { t: 'p', size: 'sm', text: '$x=\\dfrac{2}{\\sqrt6-2}$、$y=\\dfrac{2}{\\sqrt6+2}$ のとき\n$xy$、$x^2+y^2$ の値を求める' }] },
      { say: '分母は $(\\sqrt6-2)(\\sqrt6+2)=6-4=2$。$x=\\sqrt6+2$、$y=\\sqrt6-2$ と、すっきりした形になります。',
        add: [{ t: 'm', tex: 'x=\\frac{2(\\sqrt6+2)}{6-4}=\\sqrt6+2' }, { t: 'm', tex: 'y=\\frac{2(\\sqrt6-2)}{6-4}=\\sqrt6-2' }] },
      { ask: { type: 'choice', q: '$xy$ の値は？',
        opts: ['$2$', '$2\\sqrt6$', '$10$', '$-2$'], ok: 0,
        why: { 1: 'それは $x+y$ の値です。', 2: '$(\\sqrt6+2)(\\sqrt6-2)=(\\sqrt6)^2-2^2$。たし算ではなく ひき算です。', 3: '$6-4=2$。ひく順番が逆になっています。' },
        good: '和と差の積で $(\\sqrt6)^2-2^2=6-4=2$。',
        add: [{ t: 'm', tex: 'x+y=2\\sqrt6,\\qquad xy=2' }] } },
      { say: '$x^2+y^2$ は、$(x+y)^2=x^2+2xy+y^2$ から $2xy$ をひけば出ます。$x$、$y$ をそのまま2乗するより、ずっと楽です。',
        add: [{ t: 'box', c: 'y', col: 1, label: 'くふう', text: '$x^2+y^2=(x+y)^2-2xy$' }] },
      { ask: { type: 'choice', q: '$x^2+y^2$ の値は？',
        opts: ['$24$', '$20$', '$28$', '$22$'], ok: 1,
        why: { 0: '$(x+y)^2=24$ から、$2xy$ をひくのをわすれています。', 2: '$2xy$ は **ひきます**：$x^2+y^2=(x+y)^2-2xy$。', 3: 'ひくのは $xy$ ではなく $2xy=4$ です。' },
        good: '$(2\\sqrt6)^2-2\\times2=24-4=20$。',
        add: [{ t: 'm', col: 1, tex: 'x^2+y^2=24-4=20' }] } },
      { ask: { type: 'think', q: '同じ $x$、$y$ で、$\\dfrac yx+\\dfrac xy$ の値を求めよう。',
        hint: '通分すると $\\dfrac{y^2+x^2}{xy}$。分子も分母も、もう求めてある。',
        ans: '$\\dfrac{x^2+y^2}{xy}=\\dfrac{20}{2}=10$',
        add: [{ t: 'm', col: 1, tex: '\\frac yx+\\frac xy=\\frac{x^2+y^2}{xy}=10' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間からは、新しい節「1次不等式」に入ります。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
