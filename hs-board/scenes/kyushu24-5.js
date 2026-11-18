/* 2024 九大 理系 第5問の類題（自作）：2つの添字をもつ定積分の漸化式と、はさみうちの極限
   問題：I(m, n)=∫_1^e x^m (log x)^n dx（m, n は 0 以上の整数）
         (1) (m+1)I(m,n)+nI(m,n−1)=e^{m+1}（n≧1）　(2) e^{m+1}/(m+n+2)≦I(m,n)≦e^{m+1}/(m+n+1)（n≧1）
         (3) lim_{n→∞} n·I(n,n)/e^n
   答え（python3・sympy で m≦3, n≦4 の漸化式と不等式を検算、mpmath で n=200 まで数値確認ずみ）：
   (1) 部分積分（(log x)^n を微分）　(2) I(m,n)≦I(m,n−1)（0≦log x≦1）を (1) の n と n+1 の式に使う
   (3) ne/(2n+2)≦n·I(n,n)/e^n≦ne/(2n+1) → e/2（n=200 で 1.354、e/2≒1.359）
   例：I(1,1)=(e²+1)/4 */
(function () {
  const E = Math.E;
  const lg = (id, w, extra) => ({ t: 'fig', id, col: 1, view: [-0.2, -0.16, 3.05, 1.2], w: w || 470, h: Math.round((w || 470) * 0.68), items: [
    { k: 'axes', tx: [[1, '1'], [2, '2'], [E, 'e']], ty: [[1, '1']], xl: 'x', yl: 'y' },
    { k: 'line', x: E, dash: true, c: 'd' },
    { k: 'fn', f: 'log(x)', a: 1, b: E, c: 'y', wd: 3 },
    { k: 'fn', f: 'log(x)**2', a: 1, b: E, c: 'g', wd: 3 },
    { k: 'fn', f: 'log(x)**4', a: 1, b: E, c: 'b', wd: 3 },
    { k: 'fn', f: 'log(x)**8', a: 1, b: E, c: 'p', wd: 3 },
    { k: 'label', at: [0.12, 1.02], text: 'y=(log x)ⁿ', size: 19, anchor: 'start' },
    { k: 'label', at: [0.22, 0.84], text: 'n=1', c: 'y', size: 20, anchor: 'start' },
    { k: 'label', at: [0.22, 0.68], text: 'n=2', c: 'g', size: 20, anchor: 'start' },
    { k: 'label', at: [0.22, 0.52], text: 'n=4', c: 'b', size: 20, anchor: 'start' },
    { k: 'label', at: [0.22, 0.36], text: 'n=8', c: 'p', size: 20, anchor: 'start' }
  ].concat(extra || []) });
  const POINTS = [
    '$(\\log x)^n$ をふくむ積分は、$(\\log x)^n$ を **微分する側** にして部分積分。$\\log1=0$ で端の項がかんたんになり、$n$ が1つ下がる',
    '$1\\le x\\le e$ では $0\\le\\log x\\le1$ なので $I(m,\\ n)\\le I(m,\\ n-1)$。漸化式の $n$ と $n+1$ の2本で、上と下からはさむ',
    '2つの添字を同時に動かすときも、(2) の不等式に $m=n$ を代入すればよい。$\\dfrac{n}{2n+1}\\to\\dfrac12$ で、極限は $\\dfrac e2$'
  ];

  HB.lesson({
    id: 'kyushu24-5', field: '九大型　数学（理系）', title: '2024 九大 理系 第5問の類題 ― 2つの添字の定積分と極限', level: '2024年度 九州大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '0 以上の整数 $m,\\ n$ に対して $\\displaystyle I(m,\\ n)=\\int_1^e x^m(\\log x)^n\\,dx$ とする。ただし $\\log x$ は自然対数、$e$ はその底である。',
      parts: [
        '(1)　$n\\ge1$ のとき、$(m+1)I(m,\\ n)+n\\,I(m,\\ n-1)=e^{m+1}$ が成り立つことを示せ。',
        '(2)　$n\\ge1$ のとき、$\\dfrac{e^{m+1}}{m+n+2}\\le I(m,\\ n)\\le\\dfrac{e^{m+1}}{m+n+1}$ が成り立つことを示せ。',
        '(3)　極限 $\\displaystyle\\lim_{n\\to\\infty}\\frac{n\\,I(n,\\ n)}{e^{n}}$ を求めよ。'
      ],
      src: '※ 2024年度 九州大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '2つの添字 $m,\\ n$ をもつ定積分を、漸化式と不等式で調べ、極限を求める問題です。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '積分の範囲は $1\\le x\\le e$。ここでは $0\\le\\log x\\le1$ です。右の図は $y=(\\log x)^n$。$n$ が大きいほど、$x=e$ の近く以外では小さくなります。',
        add: [{ t: 'h', text: '読みかえ：1 ≦ x ≦ e での log x' },
          { t: 'm', tex: '1\\le x\\le e\\ \\Longrightarrow\\ 0\\le\\log x\\le1' },
          lg('f1')] },
      { ask: { type: 'choice', q: '$1\\le x\\le e$ で、$(\\log x)^n$ と $(\\log x)^{n-1}$ の大小は？（$n\\ge1$）',
        opts: ['$(\\log x)^n\\ge(\\log x)^{n-1}$', '$(\\log x)^n\\le(\\log x)^{n-1}$', '$x$ によって入れかわる', 'いつも等しい'], ok: 1,
        why: { 0: '1 以下の数は、かけるほど小さくなります（$0.5^2<0.5$）。', 2: '$0\\le\\log x\\le1$ の範囲では、いつも同じ向きです。', 3: '等しいのは $\\log x=0$ か $1$（$x=1,\\ e$）のときだけです。' },
        good: '$(\\log x)^{n-1}\\ge0$ に $\\log x\\le1$ をかけて $(\\log x)^n\\le(\\log x)^{n-1}$。図でも、$n$ が大きいほど下にあります。',
        add: [{ t: 'm', tex: '(\\log x)^n\\le(\\log x)^{n-1}', note: '(2) で使う' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) は部分積分です。$x^m$ と $(\\log x)^n$ の積なので、どちらを微分する側にするかを決めます。',
        add: [{ t: 'h', text: '(1)　部分積分で漸化式を作る' },
          { t: 'm', tex: '\\int f\\,g\'\\,dx=f\\,g-\\int f\'\\,g\\,dx', note: '部分積分' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_1^e x^m(\\log x)^n\\,dx$ の部分積分で、微分する側にするのは？',
        opts: ['$x^m$ を微分する', 'どちらでも同じ手間', '部分積分は使えない', '$(\\log x)^n$ を微分する'], ok: 3,
        why: { 0: 'すると $(\\log x)^n$ を積分しなければならず、かえって難しくなります。', 1: '$(\\log x)^n$ の積分はすぐには求まりません。微分すれば次数が1つ下がります。', 2: '積の積分なので、部分積分がいちばんの道具です。' },
        good: '$(\\log x)^n$ を微分すると $n(\\log x)^{n-1}\\cdot\\frac1x$。$\\frac1x$ が $x^{m+1}$ と打ち消し合い、$I(m,\\ n-1)$ が出てきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}I(m,\\ n)&=\\Big[\\,\\frac{x^{m+1}}{m+1}(\\log x)^n\\,\\Big]_1^e-\\int_1^e\\frac{x^{m+1}}{m+1}\\cdot\\frac{n(\\log x)^{n-1}}{x}\\,dx\\\\ &=\\Big[\\,\\frac{x^{m+1}}{m+1}(\\log x)^n\\,\\Big]_1^e-\\frac{n}{m+1}I(m,\\ n-1)\\end{aligned}' }] } },
      { ask: { type: 'choice', q: '端の項 $\\Big[\\,\\dfrac{x^{m+1}}{m+1}(\\log x)^n\\,\\Big]_1^e$ の値は？（$n\\ge1$）',
        opts: ['$\\dfrac{e^{m+1}}{m+1}$', '$\\dfrac{e^{m+1}-1}{m+1}$', '$e^{m+1}$', '$\\dfrac{e^{m}}{m+1}$'], ok: 0,
        why: { 1: '$x=1$ では $\\log1=0$ なので、引く項は 0 です（$n\\ge1$）。', 2: '$\\frac{1}{m+1}$ を忘れています。', 3: '$x^{m+1}$ に $x=e$ を入れるので $e^{m+1}$。' },
        good: '$x=e$ で $\\frac{e^{m+1}}{m+1}\\cdot1^n$、$x=1$ で $\\frac{1}{m+1}\\cdot0^n=0$。',
        add: [{ t: 'm', size: 'sm', tex: 'I(m,\\ n)=\\frac{e^{m+1}}{m+1}-\\frac{n}{m+1}I(m,\\ n-1)' }] } },
      { say: '両辺に $m+1$ をかけて移項すれば、(1) の式です。$n\\ge1$ は、端の項で $0^n=0$ とするために必要でした。',
        add: [{ t: 'ans', label: '(1)', tex: '(m+1)I(m,\\ n)+n\\,I(m,\\ n-1)=e^{m+1}' }] },
      { ask: { type: 'think', q: '(1) を使って $I(1,\\ 1)$ を求めよう。',
        hint: 'まず $I(1,\\ 0)=\\displaystyle\\int_1^e x\\,dx$。(1) で $m=1,\\ n=1$。',
        ans: '$I(1,0)=\\dfrac{e^2-1}{2}$、$2I(1,1)+I(1,0)=e^2$ より $I(1,1)=\\dfrac{e^2+1}{4}$',
        after: '直接 $\\int_1^e x\\log x\\,dx$ を部分積分しても同じ値になります。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: 'I(1,\\ 1)=\\frac{e^2+1}{4}', note: '例' }] } },

      // ---------- (2) ----------
      { clear: true, cols: [1], part: '(2)', say: '(2) です。最初に見た $(\\log x)^n\\le(\\log x)^{n-1}$ に $x^m>0$ をかけて積分すると $I(m,\\ n)\\le I(m,\\ n-1)$。これを (1) に入れると、上からの評価が出ます。',
        add: [{ t: 'h', text: '(2)　上からの評価' },
          { t: 'm', size: 'sm', tex: 'x^m(\\log x)^n\\le x^m(\\log x)^{n-1}\\ \\ (1\\le x\\le e)\\ \\ \\text{より}\\ \\ I(m,\\ n)\\le I(m,\\ n-1)\\quad(n\\ge1)', note: '…②' },
          { t: 'm', size: 'sm', tex: 'e^{m+1}=(m+1)I(m,\\ n)+n\\,\\hy{I(m,\\ n-1)}\\ge(m+1)I(m,\\ n)+n\\,\\hy{I(m,\\ n)}=(m+n+1)I(m,\\ n)' },
          { t: 'm', tex: '\\therefore\\ I(m,\\ n)\\le\\frac{e^{m+1}}{m+n+1}' }] },
      { ask: { type: 'choice', q: '下からの評価 $I(m,\\ n)\\ge\\dfrac{e^{m+1}}{m+n+2}$ には、どの式を使う？',
        opts: ['(1) の式をそのまま', '$I(m,\\ n)\\ge0$ だけ', '(1) で $n$ を $n+1$ にした式と ②', '$I(m,\\ 0)$ の値'], ok: 2,
        why: { 0: '(1) の式のままでは $I(m,\\ n-1)$ を下から押さえられず、上からの評価しか出ません。', 1: '$0$ 以上だけでは、はさみうちに使えるほど強くありません。', 3: '$n=0$ の値だけでは、一般の $n$ の評価は出ません。' },
        good: '$(m+1)I(m,\\ n+1)+(n+1)I(m,\\ n)=e^{m+1}$ で、$I(m,\\ n+1)\\le I(m,\\ n)$ を使います。',
        add: [{ t: 'gap', h: 6 }, { t: 'h', text: '(2)　下からの評価' },
          { t: 'm', size: 'sm', tex: 'e^{m+1}=(m+1)\\hy{I(m,\\ n+1)}+(n+1)I(m,\\ n)\\le(m+1)\\hy{I(m,\\ n)}+(n+1)I(m,\\ n)=(m+n+2)I(m,\\ n)' }] } },
      { say: '2つを合わせて (2) が示せました。$n$ の式と $n+1$ の式、2本の漸化式でそれぞれ反対向きにはさむのがポイントです。',
        add: [{ t: 'ans', label: '(2)', tex: '\\frac{e^{m+1}}{m+n+2}\\le I(m,\\ n)\\le\\frac{e^{m+1}}{m+n+1}' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) は2つの添字がどちらも $n$。(2) はすべての $m\\ (\\ge0)$ で成り立つので、$m=n$ を代入できます。',
        add: [{ t: 'h', text: '(3)　m＝n を代入する' },
          { t: 'm', tex: '\\frac{e^{n+1}}{2n+2}\\le I(n,\\ n)\\le\\frac{e^{n+1}}{2n+1}' }] },
      { ask: { type: 'choice', q: '各辺に $\\dfrac{n}{e^n}$ をかける。$\\dfrac{n\\,I(n,\\ n)}{e^n}$ をはさむ式の（左はし，右はし）は？',
        opts: ['$\\left(\\frac{n}{2n+2},\\ \\frac{n}{2n+1}\\right)$', '$\\left(\\frac{e}{2n+2},\\ \\frac{e}{2n+1}\\right)$', '$\\left(\\frac{ne}{2n+1},\\ \\frac{ne}{2n+2}\\right)$', '$\\left(\\frac{ne}{2n+2},\\ \\frac{ne}{2n+1}\\right)$'], ok: 3,
        why: { 0: '$\\frac{e^{n+1}}{e^n}=e$ が残ります。', 1: '$n$ をかけ忘れています。', 2: '分母が大きいほうが小さい。左右が逆です。' },
        good: '$\\dfrac{n}{e^n}\\cdot\\dfrac{e^{n+1}}{2n+2}=\\dfrac{ne}{2n+2}$。右も同じように $\\dfrac{ne}{2n+1}$。',
        add: [{ t: 'm', tex: '\\frac{ne}{2n+2}\\le\\frac{n\\,I(n,\\ n)}{e^n}\\le\\frac{ne}{2n+1}' }] } },
      { ask: { type: 'choice', q: '$n\\to\\infty$ のとき、求める極限は？',
        opts: ['$e$', '$\\dfrac e2$', '$\\dfrac12$', '$\\infty$'], ok: 1,
        why: { 0: '$\\frac{n}{2n+1}\\to\\frac12$ です。1 ではありません。', 2: '定数 $e$ をかけ忘れています。', 3: '$I(n,\\ n)$ 自体は大きくなりますが、$e^n$ で割っているので有限の値に近づきます。' },
        good: '$\\dfrac{ne}{2n+2}=\\dfrac{e}{2+\\frac2n}\\to\\dfrac e2$、$\\dfrac{ne}{2n+1}\\to\\dfrac e2$。はさみうちの原理です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{ne}{2n+2}=\\frac{e}{2+\\frac2n}\\to\\frac e2,\\qquad \\frac{ne}{2n+1}=\\frac{e}{2+\\frac1n}\\to\\frac e2' },
          { t: 'ans', label: '(3) 答', tex: '\\lim_{n\\to\\infty}\\frac{n\\,I(n,\\ n)}{e^n}=\\frac e2' }] } },
      { say: '数値で確かめると、$n=20$ で約 1.310、$n=200$ で約 1.354。$\\frac e2\\approx1.359$ に、ゆっくり近づいています。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['$n$', '$\\frac{n\\,I(n,\\ n)}{e^n}$'], ['5', '1.182'], ['20', '1.310'], ['80', '1.347'], ['200', '1.354'], ['極限', '$\\frac e2\\approx1.359$']] }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.54, 0.46], part: '別の見方', say: '$x=e^t$ とおきかえると $I(m,\\ n)=\\displaystyle\\int_0^1 t^n e^{(m+1)t}\\,dt$。$n$ が大きいと $t^n$ は $t=1$ の近くだけが大きく、そこで $e^{(m+1)t}\\approx e^{m+1}$ です。',
        add: [{ t: 'h', text: '別の見方：x＝eᵗ とおきかえる' },
          { t: 'm', size: 'sm', tex: 'x=e^t,\\ dx=e^t\\,dt\\ \\Longrightarrow\\ I(m,\\ n)=\\int_0^1 t^n e^{(m+1)t}\\,dt' },
          { t: 'p', size: 'sm', text: '$t^n$ の重みは $t=1$ の近くに集まる\n→ $I(m,\\ n)$ は $e^{m+1}\\displaystyle\\int_0^1 t^n\\,dt=\\dfrac{e^{m+1}}{n+1}$ に近い…？' },
          { t: 'p', size: 'sm', text: '$m$ を固定すれば、この見積もりは正しい（下の考えてみよう）。\n(3) は $m=n$ も大きくなるので、$e^{(n+1)t}$ が $t=1$ の手前で急に小さくなり、値はその約半分になる' },
          lg('f2', 440)] },
      { ask: { type: 'think', q: '$m$ を固定して、$\\displaystyle\\lim_{n\\to\\infty}n\\,I(m,\\ n)$ を求めよう。',
        hint: '(2) の各辺に $n$ をかけて、$n\\to\\infty$。',
        ans: '$\\dfrac{n\\,e^{m+1}}{m+n+2}\\le n\\,I(m,\\ n)\\le\\dfrac{n\\,e^{m+1}}{m+n+1}$ より　$e^{m+1}$',
        after: '$m$ を固定すると分母は $n$ くらい。$m=n$ のときは分母が $2n$ くらいになるので、(3) では $\\frac12$ が出ました。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。積分の極限は「部分積分で漸化式 → 単調性で不等式 → はさみうち」。入試の定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
