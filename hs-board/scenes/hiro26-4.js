/* 2026 広島大 理系 第4問の類題（自作）：数学Ⅲ 微分・積分・極限 ― 山がせまくなる関数 x(1−x²)ⁿ の面積と e の極限
   元の問題はうつしていない（「指数に文字をふくむ関数の最大を与える点 → 置換の指定つきの不定積分 → 0 から最大点までの定積分に
   文字の1乗・2乗を掛けた極限を、e の定義の極限に帰着」というねらいと形式だけを合わせ、関数を x(1−x²)ⁿ（正のべき）と、
   x²をかけた積分 Tₙ にした自作問題）。
   答え（python3・sympy で検算ずみ。n=1,2,3,7 で定積分を直接計算して一致）：
   (1) f'(x)=(1−x²)ⁿ⁻¹{1−(2n+1)x²} → aₙ=1/√(2n+1)
   (2) ∫x(1−x²)ⁿdx=−(1−x²)ⁿ⁺¹/{2(n+1)}+C、∫x³(1−x²)ⁿdx=−(1−x²)ⁿ⁺¹/{2(n+1)}+(1−x²)ⁿ⁺²/{2(n+2)}+C
   (3) q=1−aₙ²=2n/(2n+1)、Sₙ=(1−qⁿ⁺¹)/{2(n+1)}、qⁿ⁺¹=1/(1+1/(2n))ⁿ⁺¹→e^(−1/2) → lim nSₙ=(1−1/√e)/2≒0.1967
   (4) Tₙ={1−qⁿ⁺¹(3n+2)/(2n+1)}/{2(n+1)(n+2)} → lim n²Tₙ=1/2−3/(4√e)≒0.0451
   数値：n=1000 で nSₙ≒0.19665、n²Tₙ≒0.04506
   別の見方：x=y/√n で (1−x²)ⁿ≒e^(−y²) → ∫₀^{1/√2} y e^(−y²)dy、∫₀^{1/√2} y³e^(−y²)dy と同じ値 */
(function () {
  const fn = n => 'x*(1-x**2)**' + n;
  const an = n => 1 / Math.sqrt(2 * n + 1);
  const VIEW = [-0.07, -0.07, 1.1, 0.46];
  const curves = [
    { k: 'fn', f: fn(1), a: 0, b: 1, c: 'y', label: 'n=1', lat: [0.74, 0.37] },
    { k: 'fn', f: fn(2), a: 0, b: 1, c: 'g', label: 'n=2', lat: [0.62, 0.29] },
    { k: 'fn', f: fn(5), a: 0, b: 1, c: 'b', label: 'n=5', lat: [0.47, 0.2] },
    { k: 'fn', f: fn(20), a: 0, b: 1, c: 'p', label: 'n=20', lat: [0.3, 0.115] }
  ];
  const axes = { k: 'axes', tx: [[1, '1']], ty: [] };
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: 600, h: h || 400, items: [axes].concat(items) });
  const POINTS = [
    "$f_n'(x)=(1-x^2)^{n-1}\\{1-(2n+1)x^2\\}$。かっこの中の符号で増減が決まり、$a_n=\\dfrac{1}{\\sqrt{2n+1}}$",
    '$x\\,dx$ があれば $t=1-x^2$ で $x\\,dx=-\\dfrac{dt}{2}$。$x^3\\,dx$ は $x^2\\cdot x\\,dx=(1-t)\\left(-\\dfrac{dt}{2}\\right)$ と分ける',
    '$\\left(\\dfrac{2n}{2n+1}\\right)^{n+1}=\\dfrac{1}{\\left(1+\\frac{1}{2n}\\right)^{n+1}}$ と **e の定義の形** を作る → $e^{-\\frac12}$'
  ];

  HB.lesson({
    id: 'hiro26-4', field: '広島大型　数学（理系）', title: '2026 広島大 理系 第4問の類題 ― 山がせまくなる関数の面積と e の極限', level: '2026年度 広島大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$n$ を自然数とし、$0\\le x\\le1$ で定義された関数 $f_n(x)=x(1-x^2)^n$ を考える。$e$ は自然対数の底とし、必要ならば $\\displaystyle\\lim_{m\\to\\infty}\\left(1+\\frac1m\\right)^m=e$ を用いてよい。',
      parts: [
        '(1)　$f_n(x)$ が最大となる $x$ の値 $a_n$ を $n$ を用いて表せ。',
        '(2)　$t=1-x^2$ とおくことにより、不定積分 $\\displaystyle\\int x(1-x^2)^n\\,dx$ と $\\displaystyle\\int x^3(1-x^2)^n\\,dx$ を求めよ。',
        '(3)　$S_n=\\displaystyle\\int_0^{a_n}f_n(x)\\,dx$ とする。$\\displaystyle\\lim_{n\\to\\infty}nS_n$ を求めよ。',
        '(4)　$T_n=\\displaystyle\\int_0^{a_n}x^2f_n(x)\\,dx$ とする。$\\displaystyle\\lim_{n\\to\\infty}n^2T_n$ を求めよ。'
      ],
      src: '※ 2026年度 広島大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '$n$ をふくむ関数の最大・置換積分・極限の総合問題です。最後は e の定義の極限にもちこみます。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 見通し ----------
      { clear: true, part: '見通し', say: '$f_n(x)$ のグラフをかくと、$n$ が大きくなるほど山は低く、左によって、せまくなります。だから $S_n\\to0$。',
        add: [{ t: 'h', text: '見通し：n を大きくすると' },
          fig('g0', curves)] },
      { say: '0 に近づく量に $n$ や $n^2$ をかけて、「どのくらいの速さで 0 に近づくか」を調べるのが (3)(4) です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　微分して増減\n(2)　指定どおり $t=1-x^2$ で置換\n(3)(4)　$a_n$ を代入した式から\n　　$\\left(1+\\dfrac{1}{2n}\\right)^{2n}\\to e$ の形を作る' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。積の微分。うしろの $(1-x^2)^n$ は合成関数なので、中の $1-x^2$ の微分 $-2x$ もかけます。',
        add: [{ t: 'h', text: '(1)　最大となる x' },
          { t: 'm', tex: "f_n'(x)=(1-x^2)^n+x\\cdot\\{(1-x^2)^n\\}'" },
          fig('g1', [curves[2], { k: 'line', x: an(5), dash: true, c: 'b' }])] },
      { ask: { type: 'choice', q: '$\\{(1-x^2)^n\\}\'$ は？',
        opts: ['$n(1-x^2)^{n-1}$', '$-2nx(1-x^2)^{n-1}$', '$-2x(1-x^2)^{n}$', '$(n+1)(1-x^2)^{n}$'], ok: 1,
        why: { 0: '中身 $1-x^2$ の微分 $-2x$ をかけ忘れています。', 2: '指数 $n$ を前に出し、指数を 1 下げます。', 3: '微分では指数が 1 下がります。積分とまちがえています。' },
        good: '$n(1-x^2)^{n-1}\\cdot(-2x)$ です。',
        add: [{ t: 'm', size: 'sm', tex: "\\begin{aligned}f_n'(x)&=(1-x^2)^n-2nx^2(1-x^2)^{n-1}\\\\ &=(1-x^2)^{n-1}\\{1-(2n+1)x^2\\}\\end{aligned}" }] } },
      { say: '$0<x<1$ で $(1-x^2)^{n-1}>0$。符号は $1-(2n+1)x^2$ で決まり、$x=\\frac{1}{\\sqrt{2n+1}}$ で正から負に変わります。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$0$', '$\\cdots$', '$a_n$', '$\\cdots$', '$1$'], ["$f_n'(x)$", '', '$+$', '$0$', '$-$', ''], ['$f_n(x)$', '$0$', '$\\nearrow$', '最大', '$\\searrow$', '$0$']] },
          { t: 'ans', label: '(1) 答', tex: 'a_n=\\frac{1}{\\sqrt{2n+1}}' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$t=1-x^2$ とおくと $dt=-2x\\,dx$。つまり $x\\,dx=-\\dfrac{dt}{2}$。$x$ が1つあるので、そのまま置きかえられます。',
        add: [{ t: 'h', text: '(2)　t = 1 − x² で置換' },
          { t: 'm', tex: 'dt=-2x\\,dx\\qquad x\\,dx=-\\frac{dt}{2}' },
          { t: 'm', tex: '\\int x(1-x^2)^n\\,dx=-\\frac12\\int t^n\\,dt' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int x(1-x^2)^n\\,dx$ は？（$C$ は積分定数）',
        opts: ['$\\dfrac{(1-x^2)^{n+1}}{2(n+1)}+C$', '$-\\dfrac{(1-x^2)^{n+1}}{n+1}+C$', '$-\\dfrac{(1-x^2)^{n}}{2n}+C$', '$-\\dfrac{(1-x^2)^{n+1}}{2(n+1)}+C$'], ok: 3,
        why: { 0: '$dt=-2x\\,dx$ のマイナスが落ちています。', 1: '$-\\frac12$ の $\\frac12$ が落ちています。', 2: '積分すると指数は 1 上がって $n+1$ です。' },
        good: '$-\\dfrac12\\cdot\\dfrac{t^{n+1}}{n+1}$ に $t=1-x^2$ をもどします。',
        add: [{ t: 'm', tex: '=-\\frac{(1-x^2)^{n+1}}{2(n+1)}+C' }] } },
      { say: '$x^3\\,dx$ は、$x^2\\cdot x\\,dx$ と分けます。$x^2=1-t$ なので $x^3\\,dx=(1-t)\\left(-\\dfrac{dt}{2}\\right)$。あとは $t$ の多項式の積分です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int x^3(1-x^2)^n\\,dx&=-\\frac12\\int(1-t)t^n\\,dt\\\\ &=-\\frac12\\left(\\frac{t^{n+1}}{n+1}-\\frac{t^{n+2}}{n+2}\\right)+C\\end{aligned}' }] },
      { clear: true, cols: [1], say: '$t$ を $1-x^2$ にもどして、(2) の答えです。答案では「$C$ は積分定数」を忘れずに。',
        add: [{ t: 'h', text: '(2)　答え' },
          { t: 'ans', label: '(2) 答', text: '$\\displaystyle\\int x(1-x^2)^n\\,dx=-\\frac{(1-x^2)^{n+1}}{2(n+1)}+C$\n$\\displaystyle\\int x^3(1-x^2)^n\\,dx=-\\frac{(1-x^2)^{n+1}}{2(n+1)}+\\frac{(1-x^2)^{n+2}}{2(n+2)}+C$' }] },
      { ask: { type: 'think', q: '検算：2つ目の答えを $x$ で微分すると、$x^3(1-x^2)^n$ にもどることを確かめよう。',
        hint: '$\\left\\{-\\dfrac{(1-x^2)^{n+1}}{2(n+1)}\\right\\}\'=x(1-x^2)^n$。2つ目の項も同じように。',
        ans: '$x(1-x^2)^n-x(1-x^2)^{n+1}=x(1-x^2)^n\\{1-(1-x^2)\\}=x^3(1-x^2)^n$',
        after: '置換積分の答えは、微分でもどすのがいちばん確実な検算です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。(2) の1つ目で定積分。$x=0$ で $t=1$、$x=a_n$ で $t=1-a_n^2$ です。',
        add: [{ t: 'h', text: '(3)　S_n と極限' },
          { t: 'm', size: 'sm', tex: 'S_n=\\Big[-\\frac{(1-x^2)^{n+1}}{2(n+1)}\\Big]_0^{a_n}=\\frac{1-(1-a_n^2)^{n+1}}{2(n+1)}' },
          fig('g3', [curves[2], { k: 'area', f: fn(5), a: 0, b: an(5), c: 'b', alpha: 0.35, label: 'S₅', lat: [0.2, 0.06] }, { k: 'line', x: an(5), dash: true, c: 'b' }])] },
      { ask: { type: 'choice', q: '$1-a_n^2$ は？',
        opts: ['$\\dfrac{2n-1}{2n}$', '$1-\\dfrac{1}{\\sqrt{2n+1}}$', '$\\dfrac{2n}{2n+1}$', '$\\dfrac{n}{n+1}$'], ok: 2,
        why: { 0: '$a_n^2=\\frac{1}{2n+1}$。分母は $2n+1$ です。', 1: '$a_n$ のまま引いています。2乗すると根号が消えます。', 3: '$\\frac{2n}{2n+1}$ を約分しすぎています。$2n+1$ は 2 でくくれません。' },
        good: '$1-\\dfrac{1}{2n+1}=\\dfrac{2n}{2n+1}$。これを $q_n$ とおきます。',
        add: [{ t: 'm', tex: 'q_n=1-a_n^2=\\frac{2n}{2n+1}' }, { t: 'm', tex: 'nS_n=\\frac{n}{2(n+1)}\\left(1-q_n^{\\,n+1}\\right)' }] } },
      { say: 'カギは $q_n^{\\,n+1}$ の極限。逆数にすると $\\left(1+\\frac{1}{2n}\\right)^{n+1}$。指数を $2n$ にそろえるため、$\\frac12$ 乗と残りに分けます。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{1}{q_n^{\\,n+1}}=\\Big(1+\\frac{1}{2n}\\Big)^{n+1}=\\Big\\{\\Big(1+\\frac{1}{2n}\\Big)^{2n}\\Big\\}^{\\frac12}\\Big(1+\\frac{1}{2n}\\Big)' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}q_n^{\\,n+1}=\\lim_{n\\to\\infty}\\left(\\frac{2n}{2n+1}\\right)^{n+1}$ は？',
        opts: ['$1$', '$e^{-\\frac12}$', '$e^{-1}$', '$e^{-2}$'], ok: 1,
        why: { 0: '$q_n\\to1$ でも、指数も大きくなるので 1 とは限りません（$1^\\infty$ の形）。', 2: '$\\left(1+\\frac{1}{2n}\\right)^{2n}\\to e$ ですが、指数は約 $n$ でその半分。', 3: '指数の比を逆にしています。$\\frac{n+1}{2n}\\to\\frac12$ です。' },
        good: '$\\{\\ \\}^{\\frac12}\\to e^{\\frac12}$、$1+\\frac{1}{2n}\\to1$ なので、逆数は $e^{-\\frac12}=\\dfrac{1}{\\sqrt e}$。',
        add: [{ t: 'm', tex: '\\lim_{n\\to\\infty}q_n^{\\,n+1}=e^{-\\frac12}=\\frac{1}{\\sqrt e}' }] } },
      { say: '$\\frac{n}{2(n+1)}\\to\\frac12$ と合わせて、(3) の答えです。$\\frac12\\left(1-\\frac{1}{\\sqrt e}\\right)\\approx0.197$。$n=1000$ で計算した $nS_n\\approx0.1967$ とも合います。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\lim_{n\\to\\infty}nS_n=\\frac12\\left(1-\\frac{1}{\\sqrt e}\\right)' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$T_n$ は (2) の2つ目で計算します。$t=1$（$x=0$）と $t=q_n$（$x=a_n$）を入れて、引きます。',
        add: [{ t: 'h', text: '(4)　T_n と極限' },
          { t: 'm', size: 'sm', tex: 'T_n=\\frac12\\Big\\{\\Big(\\frac{1}{n+1}-\\frac{1}{n+2}\\Big)-\\Big(\\frac{q_n^{\\,n+1}}{n+1}-\\frac{q_n^{\\,n+2}}{n+2}\\Big)\\Big\\}' }] },
      { say: '2つのかっこを通分します。うしろは $q_n^{\\,n+1}$ でくくると、$\\frac{1}{n+1}-\\frac{q_n}{n+2}=\\frac{3n+2}{(2n+1)(n+1)(n+2)}$ となります。',
        add: [{ t: 'm', size: 'sm', tex: 'T_n=\\frac{1}{2(n+1)(n+2)}\\Big\\{1-q_n^{\\,n+1}\\cdot\\frac{3n+2}{2n+1}\\Big\\}' },
          { t: 'm', size: 'sm', tex: 'n^2T_n=\\frac{n^2}{2(n+1)(n+2)}\\Big\\{1-q_n^{\\,n+1}\\cdot\\frac{3n+2}{2n+1}\\Big\\}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}n^2T_n$ は？',
        opts: ['$\\dfrac12-\\dfrac{1}{2\\sqrt e}$', '$1-\\dfrac{3}{2\\sqrt e}$', '$\\dfrac12-\\dfrac{3}{4\\sqrt e}$', '$0$'], ok: 2,
        why: { 0: 'それは (3) の答え。$\\frac{3n+2}{2n+1}\\to\\frac32$ がかかります。', 1: '前の $\\frac{n^2}{2(n+1)(n+2)}\\to\\frac12$ をかけ忘れています。', 3: 'かっこの中は $1-\\frac{3}{2\\sqrt e}\\approx0.09$ に近づき、0 ではありません。' },
        good: '$\\dfrac12\\left(1-\\dfrac{1}{\\sqrt e}\\cdot\\dfrac32\\right)=\\dfrac12-\\dfrac{3}{4\\sqrt e}\\approx0.045$ です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\lim_{n\\to\\infty}n^2T_n=\\frac12-\\frac{3}{4\\sqrt e}' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: 'なぜ $n$ と $n^2$ なのか。$x=\\frac{y}{\\sqrt n}$ と目もりをかえると、$(1-x^2)^n=\\left(1-\\frac{y^2}{n}\\right)^n$ は $e^{-y^2}$ に近づきます。',
        add: [{ t: 'h', text: '別の見方：目もりをかえて見る' },
          { t: 'm', size: 'sm', tex: 'x=\\frac{y}{\\sqrt n}:\\quad x\\,dx=\\frac{y\\,dy}{n},\\qquad x^3\\,dx=\\frac{y^3\\,dy}{n^2}' },
          { t: 'p', size: 'sm', text: '$a_n=\\dfrac{1}{\\sqrt{2n+1}}$ は $y$ の目もりで約 $\\dfrac{1}{\\sqrt2}$' }] },
      { ask: { type: 'think', q: '$nS_n\\approx\\displaystyle\\int_0^{\\frac{1}{\\sqrt2}}ye^{-y^2}\\,dy$、$n^2T_n\\approx\\displaystyle\\int_0^{\\frac{1}{\\sqrt2}}y^3e^{-y^2}\\,dy$ と見なせる。右の積分を計算して、(3)(4) と比べよう。',
        hint: '$\\left(-\\dfrac12e^{-y^2}\\right)\'=ye^{-y^2}$、$\\left\\{-\\dfrac12(y^2+1)e^{-y^2}\\right\\}\'=y^3e^{-y^2}$。',
        ans: '$\\dfrac12-\\dfrac12e^{-\\frac12}$ と $\\dfrac12-\\dfrac34e^{-\\frac12}$。(3)(4) の答えと一致する',
        after: '答案にはこの見方は書きません（極限と積分の入れかえは証明が必要）。でも、答えの見当や検算に役立ちます。' } },
      { say: '答案のポイントです。極限の計算では「どの部分が何に近づくか」を1つずつ分けて書くと、採点者に伝わります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案で書くこと', text: '・(1)　$0<x<1$ で $(1-x^2)^{n-1}>0$ → 符号は $1-(2n+1)x^2$ で決まる\n・(3)(4)　$\\left(1+\\frac{1}{2n}\\right)^{2n}\\to e$（$2n\\to\\infty$）を明記\n・$\\frac{n}{2(n+1)}\\to\\frac12$、$\\frac{3n+2}{2n+1}\\to\\frac32$ など、くっついた分数も1つずつ' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「最大の点 → 置換積分 → e の定義の形」は、数学Ⅲの極限の定番の組み立てです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
