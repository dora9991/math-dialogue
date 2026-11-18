/* 数学Ⅱ 第1章 いろいろな式 複素数と方程式 ③：解と係数の関係
   例はすべて自作。値・誤答は python3（sympy）で検算ずみ。
   2x²−6x+5=0（解 (3±i)/2）→ α+β=3, αβ=5/2, α²+β²=4, α³+β³=9/2, β/α+α/β=8/5（誤答 14, 9, −1／27, 99/2, 39/2）
   1±√5 → x²−2x−4=0／−1±2i → x²+2x+5=0／x²−4x+6=(x−2−√2 i)(x−2+√2 i)／x²+9=(x+3i)(x−3i) */
(function () {
  const POINTS = [
    '$ax^2+bx+c=0$ の2つの解 $\\alpha,\\ \\beta$ について　$\\alpha+\\beta=-\\dfrac ba$、$\\alpha\\beta=\\dfrac ca$（虚数解でも成り立つ）',
    '対称式は和と積で表す：$\\alpha^2+\\beta^2=(\\alpha+\\beta)^2-2\\alpha\\beta$、$\\alpha^3+\\beta^3=(\\alpha+\\beta)^3-3\\alpha\\beta(\\alpha+\\beta)$',
    '2数 $\\alpha,\\ \\beta$ を解とする2次方程式は $x^2-(\\alpha+\\beta)x+\\alpha\\beta=0$。$ax^2+bx+c=a(x-\\alpha)(x-\\beta)$（複素数の範囲で必ずできる）'
  ];
  HB.lesson({
    id: 'm2a-10', field: '数学Ⅱ　いろいろな式', title: '解と係数の関係', level: '複素数と方程式', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$2x^2-6x+5=0$ の2つの解を $\\alpha,\\ \\beta$ とするとき、$\\alpha+\\beta$、$\\alpha\\beta$、$\\alpha^2+\\beta^2$、$\\alpha^3+\\beta^3$、$\\dfrac\\beta\\alpha+\\dfrac\\alpha\\beta$ の値',
        '(2)　$1+\\sqrt5,\\ 1-\\sqrt5$／$-1+2i,\\ -1-2i$ を解とする2次方程式', '(3)　$x^2-4x+6$、$x^2+9$ を複素数の範囲で因数分解'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、2次方程式を複素数の範囲で解きました。この時間は、解を求めなくても、2つの解の **和と積** が係数からすぐわかる関係を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '解と係数の関係を使って、解の和・積や **対称式の値** を求められる\n2数を解とする2次方程式をつくり、複素数の範囲で因数分解できる' }] },

      // ---------- 解と係数の関係 ----------
      { clear: true, part: '解と係数の関係', say: '$ax^2+bx+c=0$ の2つの解を $\\alpha,\\ \\beta$ とします。$D=b^2-4ac$ とおいて、解の公式の2つの解を、たしたり、かけたりしてみましょう。',
        add: [{ t: 'h', text: '解と係数の関係' },
          { t: 'm', tex: '\\alpha=\\frac{-b+\\sqrt D}{2a},\\qquad \\beta=\\frac{-b-\\sqrt D}{2a}', note: '$D=b^2-4ac$' }] },
      { say: '和は $\\sqrt D$ の部分が消えて $-\\dfrac ba$。積は分子が $(-b)^2-(\\sqrt D)^2=b^2-D=4ac$ になって $\\dfrac ca$。虚数解のときも成り立ちます。',
        add: [{ t: 'm', tex: '\\alpha+\\beta=\\frac{-2b}{2a}=-\\frac ba' }, { t: 'm', tex: '\\alpha\\beta=\\frac{b^2-D}{4a^2}=\\frac{4ac}{4a^2}=\\frac ca' },
          { t: 'box', col: 1, c: 'y', label: '解と係数の関係', text: '$ax^2+bx+c=0$ の\n2つの解を $\\alpha,\\ \\beta$ とすると\n$\\alpha+\\beta=-\\dfrac ba,\\qquad \\alpha\\beta=\\dfrac ca$' }] },
      { ask: { type: 'choice', q: '$2x^2-6x+5=0$ の2つの解を $\\alpha,\\ \\beta$ とする。$\\alpha+\\beta$ と $\\alpha\\beta$ の値は？（和 と 積 の順）',
        opts: ['$-3$ と $\\dfrac52$', '$3$ と $\\dfrac52$', '$6$ と $5$', '$3$ と $-\\dfrac52$'], ok: 1,
        why: { 0: '和は $-\\dfrac ba=-\\dfrac{-6}{2}=3$。符号に注意。', 2: '$x^2$ の係数 $a=2$ で割るのを忘れています。', 3: '積は $\\dfrac ca$。$-$ はつきません。' },
        good: '$\\alpha+\\beta=-\\dfrac{-6}{2}=3$、$\\alpha\\beta=\\dfrac52$。',
        add: [{ t: 'gap', h: 4 }, { t: 'm', tex: '2x^2-6x+5=0:\\quad \\alpha+\\beta=3,\\ \\ \\alpha\\beta=\\frac52' }] } },

      // ---------- 対称式 ----------
      { clear: true, part: '対称式', say: '$\\alpha$ と $\\beta$ を入れかえても変わらない式を **対称式** といいます。対称式は和 $\\alpha+\\beta$ と積 $\\alpha\\beta$ で表せるので、解を求めなくても値が出ます。',
        add: [{ t: 'h', text: '対称式の値　（$\\alpha+\\beta=3,\\ \\alpha\\beta=\\frac52$）' },
          { t: 'm', tex: '\\alpha^2+\\beta^2=(\\alpha+\\beta)^2-2\\alpha\\beta' },
          { t: 'box', col: 1, c: 'b', label: '和と積で表す', text: '$\\alpha^2+\\beta^2=(\\alpha+\\beta)^2-2\\alpha\\beta$\n$\\alpha^3+\\beta^3$\n$\\quad=(\\alpha+\\beta)^3-3\\alpha\\beta(\\alpha+\\beta)$' }] },
      { ask: { type: 'choice', q: '$\\alpha^2+\\beta^2$ の値は？',
        opts: ['$14$', '$9$', '$-1$', '$4$'], ok: 3,
        why: { 0: '$(\\alpha+\\beta)^2=\\alpha^2+2\\alpha\\beta+\\beta^2$ なので、$2\\alpha\\beta$ は引きます。', 1: '$(\\alpha+\\beta)^2=9$ には $2\\alpha\\beta$ がふくまれています。引くのを忘れています。', 2: 'それは $(\\alpha-\\beta)^2=(\\alpha+\\beta)^2-4\\alpha\\beta$ の値です。' },
        good: '$3^2-2\\cdot\\dfrac52=9-5=4$。',
        add: [{ t: 'm', tex: '=3^2-2\\cdot\\frac52=\\ans{4}' }] } },
      { say: '3乗の和は、この章の最初に学んだ $(\\alpha+\\beta)^3=\\alpha^3+\\beta^3+3\\alpha\\beta(\\alpha+\\beta)$ を使い、$3\\alpha\\beta(\\alpha+\\beta)$ を引きます。',
        add: [{ t: 'gap', h: 6 }, { t: 'm', tex: '\\alpha^3+\\beta^3=(\\alpha+\\beta)^3-3\\alpha\\beta(\\alpha+\\beta)' }] },
      { ask: { type: 'choice', q: '$\\alpha^3+\\beta^3$ の値は？',
        opts: ['$\\dfrac92$', '$27$', '$\\dfrac{99}{2}$', '$\\dfrac{39}{2}$'], ok: 0,
        why: { 1: '$(\\alpha+\\beta)^3=27$ から、$3\\alpha\\beta(\\alpha+\\beta)$ を引きます。', 2: '$3\\alpha\\beta(\\alpha+\\beta)$ は、たすのではなく引きます。', 3: '引くのは $3\\alpha\\beta(\\alpha+\\beta)=\\dfrac{45}{2}$。3 をかけ忘れています。' },
        good: '$27-3\\cdot\\dfrac52\\cdot3=27-\\dfrac{45}{2}=\\dfrac92$。',
        add: [{ t: 'm', tex: '=3^3-3\\cdot\\frac52\\cdot3=\\ans{\\frac92}' }] } },
      { ask: { type: 'think', q: '$\\dfrac\\beta\\alpha+\\dfrac\\alpha\\beta$ の値を求めよう。',
        hint: '通分すると $\\dfrac{\\alpha^2+\\beta^2}{\\alpha\\beta}$。$\\alpha^2+\\beta^2=4$ はもう求めた。',
        ans: '$\\dfrac{\\alpha^2+\\beta^2}{\\alpha\\beta}=4\\div\\dfrac52=\\dfrac85$',
        after: '実際の解は $\\dfrac{3\\pm i}{2}$ ですが、解を1つも使わずに値が出ました。',
        add: [{ t: 'm', col: 1, tex: '\\frac\\beta\\alpha+\\frac\\alpha\\beta=\\frac{\\alpha^2+\\beta^2}{\\alpha\\beta}=\\frac85' }] } },

      // ---------- 2数を解とする方程式 ----------
      { clear: true, part: '方程式をつくる', say: '逆に、2数 $\\alpha,\\ \\beta$ を解とする2次方程式は $(x-\\alpha)(x-\\beta)=0$。展開すると、**和と積** だけでつくれます。',
        add: [{ t: 'h', text: '2数を解とする2次方程式' },
          { t: 'm', tex: '(x-\\alpha)(x-\\beta)=0' }, { t: 'm', tex: 'x^2-(\\alpha+\\beta)x+\\alpha\\beta=0', note: '$x^2-$(和)$x+$(積)$=0$' }] },
      { say: '例えば $1+\\sqrt5$ と $1-\\sqrt5$ なら、和は $2$、積は $1-5=-4$。求める方程式は $x^2-2x-4=0$ です。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '1+\\sqrt5,\\ 1-\\sqrt5' }, { t: 'm', col: 1, size: 'sm', tex: '\\text{和 }2,\\quad \\text{積 }1-5=-4' },
          { t: 'm', col: 1, size: 'sm', tex: '\\to\\ x^2-2x-4=0' }] },
      { ask: { type: 'choice', q: '$-1+2i,\\ -1-2i$ を解とする2次方程式は？',
        opts: ['$x^2-2x+5=0$', '$x^2+2x-3=0$', '$x^2+2x+5=0$', '$x^2-2x-3=0$'], ok: 2,
        why: { 0: '$x$ の係数は $-(\\text{和})=-(-2)=+2$ です。', 1: '積は $(-1)^2-(2i)^2=1-4i^2=1+4=5$。$i^2=-1$ を忘れています。', 3: '和の符号と、$i^2=-1$ の2か所がちがいます。' },
        good: '和は $-2$、積は $1-4i^2=5$ なので、$x^2+2x+5=0$。',
        add: [{ t: 'gap', h: 4 }, { t: 'm', size: 'sm', tex: '\\text{和 }-2,\\quad \\text{積 }(-1)^2-(2i)^2=5' }, { t: 'm', tex: '\\ans{x^2+2x+5=0}' }] } },

      // ---------- 因数分解 ----------
      { clear: true, part: '因数分解', say: '$ax^2+bx+c=0$ の解が $\\alpha,\\ \\beta$ なら、$ax^2+bx+c=a(x-\\alpha)(x-\\beta)$ と因数分解できます。複素数の範囲なら、どんな2次式もこの形にできます。',
        add: [{ t: 'h', text: '2次式の因数分解（複素数の範囲）' },
          { t: 'box', c: 'y', label: '因数分解', text: '$ax^2+bx+c=0$ の解が $\\alpha,\\ \\beta$ のとき\n$ax^2+bx+c=a(x-\\alpha)(x-\\beta)$' },
          { t: 'm', col: 1, size: 'sm', tex: 'ax^2+bx+c=a\\left(x^2+\\frac bax+\\frac ca\\right)' },
          { t: 'm', col: 1, size: 'sm', tex: '=a\\{x^2-(\\alpha+\\beta)x+\\alpha\\beta\\}' }, { t: 'm', col: 1, size: 'sm', tex: '=a(x-\\alpha)(x-\\beta)' }] },
      { say: '$x^2-4x+6$ なら、$x^2-4x+6=0$ の解は $x=2\\pm\\sqrt2\\,i$。だから、次のように因数分解できます。',
        add: [{ t: 'm', tex: 'x^2-4x+6=0\\ \\text{の解は}\\ x=2\\pm\\sqrt2\\,i' },
          { t: 'm', size: 'sm', tex: 'x^2-4x+6=\\{x-(2+\\sqrt2\\,i)\\}\\{x-(2-\\sqrt2\\,i)\\}' }] },
      { ask: { type: 'choice', q: '$x^2+9$ を複素数の範囲で因数分解すると？',
        opts: ['$(x+3)(x-3)$', '因数分解できない', '$(x+3i)^2$', '$(x+3i)(x-3i)$'], ok: 3,
        why: { 0: 'それは $x^2-9$ の因数分解です。', 1: '実数の範囲ではできませんが、複素数の範囲ではできます。', 2: '$(x+3i)^2=x^2+6ix-9$ です。' },
        good: '$x^2+9=0$ の解は $x=\\pm3i$ なので、$(x+3i)(x-3i)$。',
        add: [{ t: 'm', tex: 'x^2+9=\\ans{(x+3i)(x-3i)}', note: '$-(3i)^2=9$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、整式を1次式で割った余りを、割り算をしないで求める「剰余の定理」を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
