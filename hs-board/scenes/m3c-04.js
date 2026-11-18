/* 数学Ⅲ 第3章 積分法 不定積分 ④：いろいろな関数の不定積分
   例・数値はすべて自作。答え・誤答は python3（sympy）で「微分してもとにもどるか」を検算ずみ。
   ∫sin3x cosx dx=−(1/8)cos4x−(1/4)cos2x+C、∫cos3x cosx dx=(1/8)sin4x+(1/4)sin2x+C、
   ∫sin²x dx=x/2−sin2x/4+C、∫cos²x dx=x/2+sin2x/4+C、1/((x−1)(x+2))=(1/3){1/(x−1)−1/(x+2)}（a=1/3, b=−1/3）、
   ∫dx/((x−1)(x+2))=(1/3)log|(x−1)/(x+2)|+C、∫(2x+1)/(x²+x−2)dx=log|x²+x−2|+C、
   考えてみよう ∫(x²+1)/(x−1)dx=x²/2+x+2log|x−1|+C（商 x+1・余り 2） */
(function () {
  const POINTS = [
    '三角関数の積は、加法定理から作った **積を和に直す公式** で和の形にしてから積分する',
    '$\\sin^2x=\\dfrac{1-\\cos2x}{2}$、$\\cos^2x=\\dfrac{1+\\cos2x}{2}$（半角の公式）で、2乗のない形に直してから積分する',
    '分数関数は、分子の次数が高ければ **割り算**、分母が因数分解できれば **部分分数分解**。分子が分母の微分なら $\\log|f(x)|$'
  ];
  const PI = Math.PI;

  HB.lesson({
    id: 'm3c-04', field: '数学Ⅲ　積分法', title: 'いろいろな関数の不定積分', level: '不定積分', time: '目安 8分',
    noDec: true,   // 係数の分数（1/8・1/3 など）の横に小数が出ると、式や選択肢が読みにくいので使わない
    problem: { label: '例題', lead: 'この時間の例題（不定積分を求めよ）',
      parts: ['(1)　$\\displaystyle\\int\\sin3x\\cos x\\,dx$', '(2)　$\\displaystyle\\int\\cos3x\\cos x\\,dx$', '(3)　$\\displaystyle\\int\\cos^2x\\,dx$',
        '(4)　$\\displaystyle\\int\\frac{1}{(x-1)(x+2)}\\,dx$', '(5)　$\\displaystyle\\int\\frac{x^2+1}{x-1}\\,dx$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までに、置換積分法と部分積分法を学びました。この時間は、**式を変形してから** 積分する関数を学びます。三角関数の積、三角関数の2乗、分数関数です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '三角関数の積・2乗を、和や2乗のない形に直して積分できる\n分数関数を、割り算や部分分数分解をしてから積分できる' }] },

      // ---------- 積を和に ----------
      { clear: true, cols: [1], part: '積を和に直す', say: '数学Ⅱで学んだ加法定理を2つたすと、$\\sin\\alpha\\cos\\beta$ が sin の **和** で表せます。積のままでは積分しにくいので、和に直すのです。',
        add: [{ t: 'h', text: '三角関数の積を和に直す' },
          { t: 'm', tex: '\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta' },
          { t: 'm', tex: '\\sin(\\alpha-\\beta)=\\sin\\alpha\\cos\\beta-\\cos\\alpha\\sin\\beta' },
          { t: 'm', tex: '\\sin(\\alpha+\\beta)+\\sin(\\alpha-\\beta)=2\\sin\\alpha\\cos\\beta', note: '2つの式をたす' }] },
      { say: 'cos の加法定理からも同じようにして、3つの公式ができます。覚えるよりも、加法定理から **その場で作れる** ことが大切です。',
        add: [{ t: 'box', c: 'y', label: '積を和に直す公式', text: '$\\sin\\alpha\\cos\\beta=\\dfrac12\\{\\sin(\\alpha+\\beta)+\\sin(\\alpha-\\beta)\\}$\n$\\cos\\alpha\\cos\\beta=\\dfrac12\\{\\cos(\\alpha+\\beta)+\\cos(\\alpha-\\beta)\\}$\n$\\sin\\alpha\\sin\\beta=-\\dfrac12\\{\\cos(\\alpha+\\beta)-\\cos(\\alpha-\\beta)\\}$' }] },
      { clear: true, cols: [1], part: '積の積分', say: '例：$\\displaystyle\\int\\sin3x\\cos x\\,dx$。$\\alpha=3x,\\ \\beta=x$ として和に直し、1次式の公式（$\\int\\sin ax\\,dx=-\\dfrac1a\\cos ax$）で積分します。',
        add: [{ t: 'h', text: '例　∫sin 3x cos x dx' },
          { t: 'm', tex: '\\begin{aligned}\\int\\sin3x\\cos x\\,dx&=\\frac12\\int(\\sin4x+\\sin2x)\\,dx\\\\ &=\\frac12\\Big(-\\frac14\\cos4x-\\frac12\\cos2x\\Big)+C\\\\ &=\\ans{-\\frac18\\cos4x-\\frac14\\cos2x+C}\\end{aligned}', note: '$C$ は積分定数\n（以下も同じ）' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\cos3x\\cos x\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$\\dfrac14\\sin4x+\\dfrac12\\sin2x$', '$\\dfrac13\\sin3x\\sin x$', '$\\dfrac18\\sin4x+\\dfrac14\\sin2x$', '$\\dfrac18\\sin4x-\\dfrac14\\sin2x$'], ok: 2,
        why: { 0: '公式の $\\dfrac12$ をかけ忘れています。', 1: '積の積分は、それぞれを積分してかけたものではありません。まず和に直します。', 3: '$\\cos\\alpha\\cos\\beta$ は「たす」形です。ひくのは $\\sin\\alpha\\sin\\beta$ のとき。' },
        good: '$\\dfrac12\\displaystyle\\int(\\cos4x+\\cos2x)\\,dx=\\frac18\\sin4x+\\frac14\\sin2x+C$。',
        add: [{ t: 'm', tex: '\\int\\cos3x\\cos x\\,dx=\\frac12\\int(\\cos4x+\\cos2x)\\,dx=\\ans{\\frac18\\sin4x+\\frac14\\sin2x+C}' }] } },

      // ---------- 2乗 ----------
      { clear: true, part: '2乗の積分', say: '$\\sin^2x$ は、数学Ⅱの **半角の公式** で2乗のない形に直します。右のグラフのように、$\\sin^2x$ は $\\dfrac12$ を中心に、周期 $\\pi$ でゆれる波です。',
        add: [{ t: 'h', text: 'sin²x・cos²x の積分' },
          { t: 'box', c: 'b', label: '半角の公式', text: '$\\sin^2x=\\dfrac{1-\\cos2x}{2}$　　$\\cos^2x=\\dfrac{1+\\cos2x}{2}$' },
          { t: 'm', tex: '\\begin{aligned}\\int\\sin^2x\\,dx&=\\int\\frac{1-\\cos2x}{2}\\,dx\\\\ &=\\ans{\\frac x2-\\frac{\\sin2x}{4}+C}\\end{aligned}' },
          { t: 'fig', id: 's2', col: 1, view: [-0.6, -0.45, 7.1, 1.45], w: 560, h: 300, items: [
            { k: 'axes', tx: [[PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']], ty: [[0.5, '1/2'], [1, '1']] },
            { k: 'line', m: 0, n: 0.5, a: 0, b: 6.9, c: 'd', dash: true },
            { k: 'fn', f: 'sin(x)**2', a: -0.3, b: 6.9, c: 'y', label: 'y=sin²x', lat: [4.0, 1.25] }] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\cos^2x\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$\\dfrac13\\cos^3x$', '$\\dfrac x2+\\dfrac{\\sin2x}{4}$', '$\\dfrac x2+\\dfrac{\\sin2x}{2}$', '$\\dfrac x2-\\dfrac{\\sin2x}{4}$'], ok: 1,
        why: { 0: '$x^n$ の公式は使えません。微分すると $-\\cos^2x\\sin x$ になってしまいます。', 2: '$\\cos2x$ の積分は $\\dfrac12\\sin2x$。それをさらに $\\dfrac12$ 倍して $\\dfrac14$ です。', 3: 'それは $\\sin^2x$ の答え。$\\cos^2x=\\dfrac{1+\\cos2x}{2}$ はプラスです。' },
        good: '$\\displaystyle\\int\\frac{1+\\cos2x}{2}\\,dx=\\frac x2+\\frac{\\sin2x}{4}+C$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int\\cos^2x\\,dx=\\int\\frac{1+\\cos2x}{2}\\,dx=\\ans{\\frac x2+\\frac{\\sin2x}{4}+C}' }] } },

      // ---------- 部分分数 ----------
      { clear: true, cols: [0.6, 0.4], part: '部分分数分解', say: '$\\dfrac{1}{(x-1)(x+2)}$ は、そのままでは積分できません。2つの分数に分けると、どちらも $\\log$ になる形になります。これを **部分分数分解** といいます。',
        add: [{ t: 'h', text: '分数関数　∫ 1/((x−1)(x+2)) dx' },
          { t: 'm', tex: '\\frac{1}{(x-1)(x+2)}=\\frac{a}{x-1}+\\frac{b}{x+2}', note: 'とおく' },
          { t: 'm', tex: '1=a(x+2)+b(x-1)', note: '両辺に $(x-1)(x+2)$\nをかける' },
          { t: 'box', c: 'g', col: 1, size: 'sm', label: '手順', text: '① 分母を因数分解する\n② $\\dfrac{a}{x-1}+\\dfrac{b}{x+2}$ とおく\n③ 係数を比べて $a,\\ b$ を決める\n④ 項ごとに積分（$\\log$）' }] },
      { ask: { type: 'choice', q: '$1=a(x+2)+b(x-1)$ が、すべての $x$ で成り立つとき、$a,\\ b$ は？',
        opts: ['$a=1,\\ b=-1$', '$a=-\\dfrac13,\\ b=\\dfrac13$', '$a=\\dfrac12,\\ b=-\\dfrac12$', '$a=\\dfrac13,\\ b=-\\dfrac13$'], ok: 3,
        why: { 0: '$\\dfrac{1}{x-1}-\\dfrac{1}{x+2}=\\dfrac{3}{(x-1)(x+2)}$。3 が余分です。', 1: '$x=1$ を代入すると $1=3a$。$a$ は正です。', 2: '$x=1$ を代入すると $1=3a$。2 ではなく 3 で割ります。' },
        good: '係数を比べて $a+b=0$、$2a-b=1$ より $a=\\dfrac13,\\ b=-\\dfrac13$（$x=1,\\ -2$ を代入しても求まる）。',
        add: [{ t: 'm', tex: '\\frac{1}{(x-1)(x+2)}=\\frac13\\Big(\\frac{1}{x-1}-\\frac{1}{x+2}\\Big)' }] } },
      { say: 'あとは項ごとに積分して、$\\log$ の差を1つにまとめます。',
        add: [{ t: 'm', tex: '\\begin{aligned}\\int\\frac{dx}{(x-1)(x+2)}&=\\frac13\\big(\\log|x-1|-\\log|x+2|\\big)+C\\\\ &=\\ans{\\frac13\\log\\left|\\frac{x-1}{x+2}\\right|+C}\\end{aligned}' }] },

      // ---------- f'/f と割り算 ----------
      { clear: true, cols: [1], part: '分子をよく見る', say: '分数関数では、部分分数分解の前に **分子を見る** と、早く終わることがあります。',
        add: [{ t: 'h', text: '分子をよく見る' }],
        ask: { type: 'choice', q: '$\\displaystyle\\int\\frac{2x+1}{x^2+x-2}\\,dx$ は？（$+C$ は省いてあります）',
        opts: ['$\\log|x^2+x-2|$', '$\\log|2x+1|$', '$\\log\\left|\\dfrac{x-1}{x+2}\\right|$', '$\\dfrac{x^2+x}{\\frac13x^3+\\frac12x^2-2x}$'], ok: 0,
        why: { 1: '$\\log$ の中に入るのは **分母** です。分子が分母の微分になっているかを見ます。', 2: '部分分数に分けると $\\dfrac{1}{x-1}+\\dfrac{1}{x+2}$。差ではなく和なので、$\\log$ の中は商でなく積です。', 3: '分子と分母を別々に積分してはいけません。' },
        good: '$(x^2+x-2)\'=2x+1$。分子が分母の微分なので、$\\log|x^2+x-2|+C$。',
        add: [{ t: 'm', tex: "\\int\\frac{2x+1}{x^2+x-2}\\,dx=\\int\\frac{(x^2+x-2)'}{x^2+x-2}\\,dx=\\ans{\\log|x^2+x-2|+C}" }] } },
      { say: '分子の次数が分母の次数以上のときは、まず **割り算** をして、分子の次数を下げます。$x^2+1$ を $x-1$ で割ると、商 $x+1$、余り $2$ です。',
        add: [{ t: 'm', tex: '\\frac{x^2+1}{x-1}=x+1+\\frac{2}{x-1}', note: '商 $x+1$、余り $2$' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\int\\frac{x^2+1}{x-1}\\,dx$ を求めよう。',
        hint: '割り算した形 $x+1+\\dfrac{2}{x-1}$ を、項ごとに積分する。',
        ans: '$\\dfrac{x^2}{2}+x+2\\log|x-1|+C$',
        after: '分数関数は「分子は分母の微分？ → 割り算 → 部分分数 → $\\log$」の順に考えます。',
        add: [{ t: 'm', tex: '\\int\\frac{x^2+1}{x-1}\\,dx=\\int\\Big(x+1+\\frac{2}{x-1}\\Big)\\,dx=\\ans{\\frac{x^2}{2}+x+2\\log|x-1|+C}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。ここまでで不定積分は終わりです。次の時間は、置換積分法と部分積分法を **定積分** で使います。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
