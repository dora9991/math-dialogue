/* 慶應型 数学（理工）：2026年度 慶應義塾大学 理工学部 第3問の類題（自作問題・元の問題ではない）
   問題：硬貨を 2n 回（X）、続けて n 回（Y）。(2) 硬貨 n 回（X）→ さいころ X 個。全部空欄。
   答え（python3 で検算ずみ。n=1〜7 は全部の出方を数えて確認）：
     (1)(i) P(XY=0)=1−(1−1/4ⁿ)(1−1/2ⁿ)=(4ⁿ+2ⁿ−1)/8ⁿ（n=1 で 5/8）
        (ii) Σ_{k=0}^{n} ₂ₙC_k·ₙC_{n−k}=₃ₙCₙ
        (iii) Nₙ·n!/nⁿ=(3n)!/((2n)!nⁿ)=Π_{k=1}^{n}(2+k/n) → (1/n)log → ∫₀¹log(2+x)dx=3log3−2log2−1（≈0.90954。n=10000 で 0.90956）
     (2) P(E)=Σ ₙC_k(1/2)ⁿ(2/3)^k=(5/6)ⁿ、P_E(X=n)=(1/3)ⁿ/(5/6)ⁿ=(2/5)ⁿ
         考えてみよう：P_E(X が偶数)=(1+(1/5)ⁿ)/2 */
(function () {
  const RECT = []; for (let k = 1; k <= 5; k++) { const x0 = (k - 1) / 5, x1 = k / 5, h = Math.log(2 + x1); RECT.push({ k: 'poly', pts: [[x0, 0], [x1, 0], [x1, h], [x0, h]], close: true, c: 'b', wd: 1.5, fill: 'b', alpha: 0.22 }); }
  const POINTS = [
    '「少なくとも一方が 0」は **余事象**（両方とも 1 以上）で。独立な2つの試行なら確率の積',
    '和 $\\sum{}_{2n}\\mathrm{C}_k\\,{}_n\\mathrm{C}_{n-k}$ は計算せず、**数え方を変えて** ${}_{3n}\\mathrm{C}_n$。積の対数の極限は $\\frac1n\\sum\\log\\big(2+\\frac kn\\big)$ の形にして **区分求積**',
    '回数が確率的に決まるときは、回数 $k$ で場合分けして ${}_n\\mathrm{C}_k a^k b^{n-k}$ の和 → **二項定理** で $(a+b)^n$ にまとめる'
  ];

  HB.lesson({
    id: 'keio26-3', field: '慶應型　数学（理工）', title: '2026 慶應 理工 第3問の類題 ― 硬貨の表の回数・二項係数の和と区分求積', level: '2026年度 慶應義塾大学 理工学部 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '1 枚の硬貨を投げる試行について、次の空欄にあてはまる数または式を答えよ。ただし、硬貨の表と裏が出る確率はそれぞれ $\\frac12$ とし、$n$ は正の整数、$\\log$ は自然対数とする。',
      parts: [
        '(1)　硬貨を $2n$ 回投げて表の出た回数を $X$ とし、続けて $n$ 回投げて表の出た回数を $Y$ とする。\n　(i)　$XY=0$ となる確率は $\\boxed{\\text{ア}}$ である。\n　(ii)　合わせて $3n$ 回の表裏の出方 $2^{3n}$ 通りのうち、$X+Y=n$ となるものは $\\boxed{\\text{イ}}$ 通りある。\n　(iii)　(ii) の数を $N_n$ とするとき、$\\displaystyle\\lim_{n\\to\\infty}\\frac1n\\log\\Big(N_n\\cdot\\frac{n!}{n^n}\\Big)=\\boxed{\\text{ウ}}$ である。',
        '(2)　硬貨を $n$ 回投げて表の出た回数を $X$ とする。続いて、さいころを $X$ 個投げる（$X=0$ のときは投げない）。投げたさいころに 3 の倍数の目が 1 つも出ないという事象を $E$ とする（$X=0$ のときも $E$ は起こったとする）。$E$ が起こる確率は $\\boxed{\\text{エ}}$ であり、$E$ が起こったときに $X=n$ である条件付き確率は $\\boxed{\\text{オ}}$ である。'
      ],
      src: '※ 2026年度 慶應義塾大学 理工学部 一般選抜 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: '問題', say: '確率・二項定理・極限が1つの大問にまとまった問題です。全部が空欄なので、式の形のまま答えを出し、$n=1$ などで検算するのがコツ。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:21px;line-height:1.55' }] },

      // ---------- (1)(i) ----------
      { clear: true, part: '(1)(i)', say: '$XY=0$ は「$X=0$ または $Y=0$」。そのまま足すと重なりの処理が要ります。**余事象**「$X\\ge1$ かつ $Y\\ge1$」なら、独立なので確率の積で一発です。',
        add: [{ t: 'h', text: '(1)(i)　XY = 0 となる確率' },
          { t: 'm', tex: 'P(XY=0)=1-P(X\\ge1)\\,P(Y\\ge1)', note: '前の $2n$ 回と後の $n$ 回は独立' }] },
      { ask: { type: 'choice', q: '$P(X\\ge1)$（$2n$ 回で表が少なくとも1回）は？',
        opts: ['$1-\\dfrac1{2^n}$', '$\\dfrac1{4^n}$', '$1-\\dfrac1{4^n}$', '$1-\\dfrac{2n}{4^n}$'], ok: 2,
        why: { 0: 'それは $n$ 回投げる $Y$ のほう。$X$ は $2n$ 回なので、全部裏は $\\left(\\frac12\\right)^{2n}$。', 1: 'それは $X=0$（全部裏）の確率。余事象を引きます。', 3: '$2n$ は「表が1回だけ」の数え方。全部裏は1通りです。' },
        good: '全部裏の確率は $\\left(\\frac12\\right)^{2n}=\\frac1{4^n}$。同じように $P(Y\\ge1)=1-\\frac1{2^n}$。',
        add: [{ t: 'm', tex: 'P(X\\ge1)=1-\\frac1{4^n},\\qquad P(Y\\ge1)=1-\\frac1{2^n}' }] } },
      { say: '展開して分母を $8^n$ にそろえます。空欄は形がいくつもあるので、$n=1$ で検算：2回と1回なら $\\frac14+\\frac12-\\frac18=\\frac58$。式に $n=1$ を入れても $\\frac{4+2-1}{8}=\\frac58$ です。',
        add: [{ t: 'ans', label: 'ア', tex: '1-\\Big(1-\\frac1{4^n}\\Big)\\Big(1-\\frac1{2^n}\\Big)=\\frac{4^n+2^n-1}{8^n}' },
          { t: 'box', c: 'g', size: 'sm', label: '検算', text: '$n=1$：$P(X=0)+P(Y=0)-P(\\text{両方})=\\frac14+\\frac12-\\frac18=\\frac58$' }] },

      // ---------- (1)(ii) ----------
      { clear: true, part: '(1)(ii)', say: '$X=k$ なら $Y=n-k$。前の $2n$ 回から表の $k$ 回、後の $n$ 回から表の $n-k$ 回を選ぶので、ふつうに書くと和になります。',
        add: [{ t: 'h', text: '(1)(ii)　X + Y = n となる出方' },
          { t: 'm', tex: 'N_n=\\sum_{k=0}^{n}{}_{2n}\\mathrm{C}_k\\cdot{}_n\\mathrm{C}_{n-k}', note: '$k$ は $X$ の値' },
          { t: 'p', size: 'sm', text: 'この和を直接計算するのは大変。**数え方を変える**' }] },
      { ask: { type: 'choice', q: '$3n$ 回をまとめて見ると、$X+Y=n$ は「$3n$ 回のうち表がちょうど $n$ 回」。$N_n$（空欄イ）は？',
        opts: ['${}_{2n}\\mathrm{C}_n$', '${}_{2n}\\mathrm{C}_n\\cdot2^n$', '$\\dfrac{(3n)!}{(n!)^3}$', '${}_{3n}\\mathrm{C}_n$'], ok: 3,
        why: { 0: '${}_{2n}\\mathrm{C}_n$ は $\\sum({}_n\\mathrm{C}_k)^2$（$n$ 回と $n$ 回）のとき。ここは $2n$ 回と $n$ 回です。', 1: '後ろの $n$ 回を自由にしています。後ろの表の数も $n-X$ に決まります。', 2: '3つに分ける数え方です。ここは「表の $n$ 回」を選ぶだけ。' },
        good: '$3n$ 回のどこが表になるかを $n$ か所選ぶので ${}_{3n}\\mathrm{C}_n$。和の式と同じものを、別の数え方で数えました。',
        add: [{ t: 'ans', label: 'イ', tex: 'N_n=\\sum_{k=0}^{n}{}_{2n}\\mathrm{C}_k\\cdot{}_n\\mathrm{C}_{n-k}={}_{3n}\\mathrm{C}_n' }] } },
      { ask: { type: 'think', q: '$(1+x)^{2n}(1+x)^n=(1+x)^{3n}$ の両辺で、$x^n$ の係数をくらべて、上の等式を確かめよう。',
        hint: '左辺の $x^n$ の項は、$(1+x)^{2n}$ から $x^k$、$(1+x)^n$ から $x^{n-k}$ を選んだものの和。',
        ans: '左辺の $x^n$ の係数は $\\displaystyle\\sum_{k=0}^{n}{}_{2n}\\mathrm{C}_k\\,{}_n\\mathrm{C}_{n-k}$、右辺は ${}_{3n}\\mathrm{C}_n$。だから等しい',
        after: '有名な $\\sum({}_n\\mathrm{C}_k)^2={}_{2n}\\mathrm{C}_n$ も同じしくみ（$(1+x)^n(1+x)^n$）です。' } },

      // ---------- (1)(iii) ----------
      { clear: true, part: '(1)(iii)', say: 'まず $N_n\\cdot\\frac{n!}{n^n}$ を約分します。$\\frac{(3n)!}{(2n)!}$ は $2n+1$ から $3n$ までの $n$ 個の積。それを $n^n$ で割るので、1つずつ $n$ で割れます。',
        add: [{ t: 'h', text: '(1)(iii)　積の対数の極限' },
          { t: 'm', tex: 'N_n\\cdot\\frac{n!}{n^n}=\\frac{(3n)!}{(2n)!\\,n!}\\cdot\\frac{n!}{n^n}=\\frac{(2n+1)(2n+2)\\cdots(3n)}{n^n}' }] },
      { ask: { type: 'choice', q: 'これを $\\frac kn$ を使って書きかえると？',
        opts: ['$\\left(2+\\frac kn\\right)$ の積（$k=1$〜$n$）', '$\\left(1+\\frac kn\\right)$ の積（$k=1$〜$n$）', '$\\left(2+\\frac kn\\right)$ の積（$k=1$〜$2n$）', '$\\left(3+\\frac kn\\right)$ の積（$k=1$〜$n$）'], ok: 0,
        why: { 1: '分子は $2n+1$ からです。$\\frac{2n+k}{n}=2+\\frac kn$。', 2: '分子の因数は $2n+1$ から $3n$ までの $n$ 個です。', 3: '$\\frac{2n+k}{n}$ を $3+\\frac kn$ としています。' },
        good: '$\\dfrac{2n+k}{n}=2+\\dfrac kn$ が $k=1,\\ 2,\\ \\ldots,\\ n$ の $n$ 個。だから対数をとると和になります。',
        add: [{ t: 'm', tex: '\\frac1n\\log\\Big(N_n\\cdot\\frac{n!}{n^n}\\Big)=\\frac1n\\sum_{k=1}^{n}\\log\\Big(2+\\frac kn\\Big)' }] } },
      { say: '$\\frac1n\\sum f\\big(\\frac kn\\big)$ の形なので **区分求積法**。右の長方形の面積の和が、$y=\\log(2+x)$ の下の面積に近づきます。',
        add: [{ t: 'm', tex: '\\longrightarrow\\ \\int_0^1\\log(2+x)\\,dx\\quad(n\\to\\infty)' },
          { t: 'fig', id: 'r1', col: 1, view: [-0.3, -0.18, 1.3, 1.35], w: 420, h: 400, items: [
            { k: 'axes', tx: [[0.2, ''], [0.4, ''], [0.6, ''], [0.8, ''], [1, '1']], ty: [[Math.log(2), ''], [Math.log(3), '']] }].concat(RECT, [
            { k: 'label', at: [0, Math.log(2)], text: 'log 2', dx: -8, size: 19, anchor: 'end', plain: true }, { k: 'label', at: [0, Math.log(3)], text: 'log 3', dx: -8, size: 19, anchor: 'end', plain: true },
            { k: 'fn', f: 'log(2+x)', a: -0.1, b: 1.25, c: 'y', wd: 3 }, { k: 'label', at: [0.5, 1.22], text: 'y = log(2+x)', c: 'y', size: 20 },
            { k: 'label', at: [0.5, 0.35], text: 'n = 5', c: 'b', size: 20 }]) }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^1\\log(2+x)\\,dx$（空欄ウ）は？',
        opts: ['$3\\log3-2\\log2$', '$3\\log3-2\\log2-1$', '$\\log3-\\log2$', '$3\\log3-2\\log2+1$'], ok: 1,
        why: { 0: '部分積分の $-\\int1\\,dx$ を忘れています。', 2: '$\\int\\log(2+x)dx$ は $\\log$ をそのまま積分した形ではありません。部分積分が必要です。', 3: '$\\int(2+x)\\cdot\\frac1{2+x}dx=x$ を引くので、符号はマイナスです。' },
        good: '$\\big[(2+x)\\log(2+x)-x\\big]_0^1=(3\\log3-1)-2\\log2$。',
        add: [{ t: 'ans', label: 'ウ', tex: '\\Big[(2+x)\\log(2+x)-x\\Big]_0^1=3\\log3-2\\log2-1' }] } },
      { say: '値は $\\log\\frac{27}{4}-1\\approx0.9095$。$n=1000$ で計算すると 0.9097 で、たしかに近づいています。0 と $\\log3$ の間にあるかも、すぐできる確かめです。' },

      // ---------- (2) ----------
      { clear: true, cols: [0.56, 0.44], part: '(2)', say: '(2) は、投げるさいころの個数が $X$ で決まります。$X=k$ で場合分けして足します。$X=k$ のとき、$k$ 個とも3の倍数でない確率は $\\left(\\frac23\\right)^k$。',
        add: [{ t: 'h', text: '(2)　E の確率と条件付き確率' },
          { t: 'm', tex: 'P(E)=\\sum_{k=0}^{n}{}_n\\mathrm{C}_k\\Big(\\frac12\\Big)^n\\Big(\\frac23\\Big)^k' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['$X$', '$P(X=k)$', '$P_{X=k}(E)$'], ['$0$', '$\\left(\\frac12\\right)^n$', '$1$'], ['$k$', '${}_n\\mathrm{C}_k\\left(\\frac12\\right)^n$', '$\\left(\\frac23\\right)^k$'], ['$n$', '$\\left(\\frac12\\right)^n$', '$\\left(\\frac23\\right)^n$']] }] },
      { ask: { type: 'choice', q: '二項定理でまとめると、$P(E)$（空欄エ）は？',
        opts: ['$\\left(\\frac56\\right)^n$', '$\\left(\\frac23\\right)^n$', '$\\left(\\frac13\\right)^n$', '$\\frac12\\left(\\frac56\\right)^n$'], ok: 0,
        why: { 1: 'いつも $n$ 個投げるとしています。投げるのは $X$ 個です。', 2: 'それは $X=n$ かつ $E$ の確率だけです。', 3: '余分な $\\frac12$ がついています。' },
        good: '$\\sum{}_n\\mathrm{C}_k\\,a^k=(1+a)^n$ より $\\left(\\frac12\\right)^n\\left(1+\\frac23\\right)^n=\\left(\\frac56\\right)^n$。',
        add: [{ t: 'ans', label: 'エ', tex: 'P(E)=\\Big(\\frac12\\cdot\\frac53\\Big)^n=\\Big(\\frac56\\Big)^n' }] } },
      { ask: { type: 'choice', q: '$E$ が起こったとき $X=n$ である条件付き確率 $P_E(X=n)$（空欄オ）は？',
        opts: ['$\\left(\\frac35\\right)^n$', '$\\left(\\frac13\\right)^n$', '$\\left(\\frac25\\right)^n$', '$\\left(\\frac23\\right)^n$'], ok: 2,
        why: { 0: 'それは $P_E(X=0)=\\left(\\frac12\\right)^n\\div\\left(\\frac56\\right)^n$。', 1: 'それは $P(X=n$ かつ $E)$。$P(E)$ で割ります。', 3: 'それは $X=n$ のときの $E$ の確率 $P_{X=n}(E)$。向きが逆です。' },
        good: '$P_E(X=n)=\\dfrac{P(X=n\\text{ かつ }E)}{P(E)}=\\dfrac{\\left(\\frac12\\cdot\\frac23\\right)^n}{\\left(\\frac56\\right)^n}=\\left(\\dfrac25\\right)^n$。',
        add: [{ t: 'ans', label: 'オ', tex: 'P_E(X=n)=\\frac{(1/3)^n}{(5/6)^n}=\\Big(\\frac25\\Big)^n' }] } },
      { ask: { type: 'think', q: 'ひねり：$E$ が起こったとき、$X$ が偶数である条件付き確率を求めよう。',
        hint: '$(1+a)^n$ と $(1-a)^n$ を足すと、$k$ が奇数の項が消える（$a=\\frac23$）。',
        ans: '$\\left(\\frac12\\right)^n\\cdot\\frac{\\left(\\frac53\\right)^n+\\left(\\frac13\\right)^n}{2}\\div\\left(\\frac56\\right)^n=\\dfrac{1+\\left(\\frac15\\right)^n}{2}$',
        after: '$n$ が大きいと $\\frac12$ に近づきます。偶奇の和は「$+a$ と $-a$ を入れて足す」が定番です。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '(2) は、硬貨1枚ごとに「表ならさいころ1個」と組にすると、組どうしは独立。1組が $E$ をこわさない確率は $\\frac12+\\frac12\\cdot\\frac23=\\frac56$ です。',
        add: [{ t: 'h', text: '別の見方：硬貨とさいころを1組ずつ' },
          { t: 'tbl', cls: 'rowh', rows: [['1組（硬貨1回＋さいころ）', '確率', 'E に対して'], ['裏（さいころは投げない）', '$\\frac12$', 'こわさない'], ['表で、3の倍数でない', '$\\frac12\\cdot\\frac23=\\frac13$', 'こわさない'], ['表で、3の倍数', '$\\frac12\\cdot\\frac13=\\frac16$', 'こわす']] },
          { t: 'box', c: 'y', size: 'sm', label: 'だから', text: '$P(E)=\\left(\\frac12+\\frac13\\right)^n=\\left(\\frac56\\right)^n$　，　$P_E(X=n)=\\left(\\dfrac{1/3}{5/6}\\right)^n=\\left(\\frac25\\right)^n$\n二項定理でまとめた式 $\\left(\\frac12\\right)^n\\left(1+\\frac23\\right)^n$ は、この見方を式で書いたものです' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。余事象・数え方を変える・区分求積・二項定理。空欄の答えは $n=1$ や数値で必ず検算しましょう。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、空欄を自分でうめてみましょう。' }
    ]
  });
})();
