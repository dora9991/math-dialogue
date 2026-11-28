/* 2024 九工大 第3問の類題②（自作）：円周の9等分 ― 複素数・3倍角・解と係数の関係・無理数であることの証明
   元の問題はうつしていない（「円周を等分する角の極形式と累乗・共役」「倍角の公式でできる整式に余弦を代入」「3つの余弦が同じ3次方程式の解 → 解と係数」
   「3次方程式が有理数解をもたない → 無理数（背理法）」「有理数係数の2次方程式の解にならない（割り算の余り）」というねらいと形式だけを合わせた自作問題）。
   類題①は7等分（cos4θ=cos3θ から4次式をつくり x=1 でくくる）、②は9等分（z³ が1の虚数立方根 → 3倍角だけで3次方程式が直接出る）。
   問題：θ=2π/9、z=cosθ+i sinθ
   答え（python3・sympy で検算ずみ）：
   (1) z⁹=1。z̄=z⁸、z̄³=z²⁴=z⁶。z³≠1 より 1+z³+z⁶=0 → z³+z̄³=z³+z⁶=−1（つまり cos3θ=−1/2）
   (2) cos3α=4x³−3x。cos3θ=−1/2 → 8c³−6c+1=0（c=cosθ）
   (3) cos3kθ=cos(2kπ/3)=−1/2（k=1,2,4）→ cosθ, cos2θ, cos4θ は 8x³−6x+1=0 の解。0<θ<2θ<4θ=160°<π で cos は減少 → 異なる3解
       和 0、積 −1/8（数値：0.7660+0.1736−0.9397=0、積 −0.1250）
   (4) β=2c：β³−3β+1=0。有理数解 p/q（既約, q≧1）→ p³=q(3pq−q²) → q=1 → p(p²−3)=−1 → p=±1 だが F(1)=−1, F(−1)=3
   (5) F(x)=(x−s)(x²+sx+t)+(s²−t−3)x+(st+1)。rβ+u=0、r≠0 なら β 有理数で矛盾、r=0 なら u=0 で F(s)=0 に矛盾 */
(function () {
  const TH = 2 * Math.PI / 9;
  const NAMES = ['1', 'z', 'z²', 'z³', 'z⁴', 'z⁵', 'z⁶', 'z⁷', 'z⁸'];
  const DIRS = ['e', 'ne', 'n', 'nw', 'w', 'w', 'sw', 's', 'se'];
  const K = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const plane = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-1.5, -1.38, 1.62, 1.38], w: w || 470, h: (w || 470) * 2.76 / 3.12, items: [
    { k: 'axes', tx: [], ty: [], xl: '実軸', yl: '虚軸', o: false },
    { k: 'circle', o: [0, 0], r: 1, c: 'd' },
    { k: 'poly', pts: K.map(k => [Math.cos(k * TH), Math.sin(k * TH)]), close: true, c: 'b', fill: 'b', alpha: 0.1 }
  ].concat(K.map(k => ({ k: 'pt', at: [Math.cos(k * TH), Math.sin(k * TH)], c: k ? 'y' : 'w', name: NAMES[k], dir: DIRS[k], size: 28 })))
    .concat(extra || []) });
  const POINTS = [
    '$z=\\cos\\frac{2\\pi}{9}+i\\sin\\frac{2\\pi}{9}$ なら $z^9=1$、$\\overline{z}=\\frac1z=z^8$。$z^k+\\overline{z}^{\\,k}=2\\cos k\\theta$ で、複素数の式を $\\cos$ の式に直す',
    '$9\\theta=2\\pi$ から $z^3$ は $1$ でない $1$ の3乗根。$z^3+\\overline{z}^{\\,3}=-1$ すなわち $\\cos3\\theta=-\\frac12$。**3倍角の公式** で $\\cos\\theta$ の3次方程式に',
    '無理数の証明は背理法：既約分数 $\\frac pq$ を解と仮定して約数を調べる。2次方程式の解でないことは **3次式を2次式で割った余り** で、$r\\ne0$・$r=0$ の両方を書く'
  ];

  HB.lesson({
    id: 'kyutech24-3b', field: '九工大型　数学', title: '2024 九工大 第3問の類題② ― 円周の9等分と cos(2π/9) が無理数であること', level: '2024年度 九州工業大学 前期 第3問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$i$ を虚数単位とし、$\\theta=\\dfrac{2\\pi}{9}$、$z=\\cos\\theta+i\\sin\\theta$ とする。また、$\\overline{z}$ は $z$ と共役な複素数を表す。',
      parts: [
        '(1)　$z^9$ の値を求めよ。また、$z^3+\\overline{z}^{\\,3}$ の値を求めよ。',
        '(2)　実数 $\\alpha$ に対して、$\\cos3\\alpha$ を $x=\\cos\\alpha$ の整式で表せ。さらに、$\\cos\\theta$ は3次方程式 $8x^3-6x+1=0$ の解であることを示せ。',
        '(3)　$\\cos\\theta,\\ \\cos2\\theta,\\ \\cos4\\theta$ は (2) の3次方程式の異なる3つの解であることを示し、$\\cos\\theta+\\cos2\\theta+\\cos4\\theta$ と $\\cos\\theta\\cos2\\theta\\cos4\\theta$ の値を求めよ。',
        '(4)　$\\beta=2\\cos\\theta$ とする。3次方程式 $x^3-3x+1=0$ は $\\beta$ を解にもち、有理数の解をもたないことを示せ。また、$\\cos\\theta$ は無理数であることを示せ。',
        '(5)　$\\beta$ は、有理数を係数とするどのような2次方程式の解にもならないことを示せ。'
      ],
      src: '※ 2024年度 九州工業大学 前期 第3問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { cols: [1], part: '問題', say: '円周を9等分する複素数から、$\\cos\\frac{2\\pi}{9}$ の性質を調べます。前半は計算、後半の (4)(5) は背理法の証明です。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '$z,\\ z^2,\\ \\cdots,\\ z^8,\\ 1$ は、単位円を9等分する点です。正九角形の頂点の座標 $\\cos\\frac{2\\pi}{9}$ が、どんな数かを調べる問題です。',
        add: [{ t: 'h', text: '方針：小問どうしのつながり' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', '使うもの'],
            ['(1)', 'ド・モアブルの定理、$|z|=1$'],
            ['(2)', '3倍角、(1) の $\\cos3\\theta=-\\frac12$'],
            ['(3)', '解と係数の関係'],
            ['(4)', '背理法（既約分数の約数）'],
            ['(5)', '背理法（割り算の余り）＋(4)']] },
          plane('c0', [], 440)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。ド・モアブルの定理で $z^9=\\cos2\\pi+i\\sin2\\pi=1$。次に、共役 $\\overline{z}$ を $z$ の累乗で表すことを考えます。',
        add: [{ t: 'h', text: '(1)　z⁹ と共役' },
          { t: 'm', tex: 'z^9=\\cos9\\theta+i\\sin9\\theta=\\cos2\\pi+i\\sin2\\pi=1' },
          plane('c1')] },
      { ask: { type: 'choice', q: '$\\overline{z}$ を $z$ の累乗で表すと？',
        opts: ['$-z$', '$z^{-8}$', '$z^{10}$', '$z^8$'], ok: 3,
        why: { 0: '$-z$ は原点について対称な点です。共役は実軸について対称な点です。', 1: '$z^{-8}=z^{9-8}=z$ です。$z$ 自身にもどってしまいます。', 2: '$z^{10}=z^9\\cdot z=z$ です。$z$ 自身にもどってしまいます。' },
        good: '$|z|=1$ なので $z\\overline{z}=1$、$\\overline{z}=\\frac1z=\\frac{z^9}{z}=z^8$。図でも $z^8$ は $z$ と実軸について対称です。',
        add: [{ t: 'm', tex: '\\overline{z}=\\frac{1}{z}=z^8' }],
        draw: [{ fig: 'c1', items: [{ k: 'seg', a: [Math.cos(TH), Math.sin(TH)], b: [Math.cos(TH), -Math.sin(TH)], c: 'p', dash: true }] }] } },
      { say: 'すると $\\overline{z}^{\\,3}=z^{24}=z^6$（$z^9=1$ で指数を9で割った余りにできる）。$z^3$ は $1$ でない $1$ の3乗根なので、$1+z^3+z^6=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: '(z^3-1)(z^6+z^3+1)=z^9-1=0,\\quad z^3\\ne1\\ \\Rightarrow\\ 1+z^3+z^6=0' },
          { t: 'ans', label: '(1) 答', tex: 'z^9=1,\\qquad z^3+\\overline{z}^{\\,3}=z^3+z^6=-1' },
          { t: 'box', c: 'g', size: 'sm', label: '意味', text: '$z^k+\\overline{z}^{\\,k}=2\\cos k\\theta$ なので\n$2\\cos3\\theta=-1$、つまり $\\cos3\\theta=-\\dfrac12$（$3\\theta=120^\\circ$）' }] },

      // ---------- (2) ----------
      { clear: true, cols: [1], part: '(2)', say: '(2) です。$x=\\cos\\alpha$ とします。$\\cos3\\alpha=\\cos(2\\alpha+\\alpha)$ を加法定理で開き、2倍角の公式を使います。',
        add: [{ t: 'h', text: '(2)　cos 3α を x = cos α で表す' },
          { t: 'm', tex: '\\cos3\\alpha=\\cos2\\alpha\\cos\\alpha-\\sin2\\alpha\\sin\\alpha' },
          { t: 'm', tex: '\\cos2\\alpha\\cos\\alpha=(2x^2-1)\\,x', note: '2倍角' }] },
      { ask: { type: 'choice', q: '$\\sin2\\alpha\\sin\\alpha$ を $x=\\cos\\alpha$ で表すと？',
        opts: ['$2(1-x^2)\\,x$', '$(1-x^2)\\,x$', '$2(1+x^2)\\,x$', '$2(1-x^2)$'], ok: 0,
        why: { 1: '$\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$ の係数 $2$ を落としています。', 2: '$\\sin^2\\alpha=1-\\cos^2\\alpha=1-x^2$ です。符号がちがいます。', 3: '$\\sin2\\alpha\\sin\\alpha=2\\sin^2\\alpha\\cos\\alpha$ で、$\\cos\\alpha=x$ が残ります。' },
        good: '$\\sin2\\alpha\\sin\\alpha=2\\sin^2\\alpha\\cos\\alpha=2(1-x^2)x$。',
        add: [{ t: 'm', tex: '\\cos3\\alpha=(2x^2-1)x-2(1-x^2)x=4x^3-3x' },
          { t: 'p', size: 'sm', text: '検算：$\\alpha=0$ で $4-3=1=\\cos0$。' }] } },
      { say: '$\\alpha=\\theta$ として、(1) の $\\cos3\\theta=-\\frac12$ を使います。$4c^3-3c=-\\frac12$ の両辺を2倍して移項すれば、求める3次方程式です。',
        add: [{ t: 'ans', label: '(2) 答', text: '$\\cos3\\alpha=4x^3-3x$\n$c=\\cos\\theta$ とすると、(1) より $4c^3-3c=\\cos3\\theta=-\\dfrac12$。よって $8c^3-6c+1=0$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$k=1,\\ 2,\\ 4$ で、$3\\cdot k\\theta=\\frac{2k\\pi}{3}$ は $120^\\circ,\\ 240^\\circ,\\ 480^\\circ$。どれも $\\cos$ が $-\\frac12$ なので、$\\cos k\\theta$ も同じ方程式を満たします。',
        add: [{ t: 'h', text: '(3)　3つの cos が同じ3次方程式の解' },
          { t: 'm', size: 'sm', tex: '4\\cos^3k\\theta-3\\cos k\\theta=\\cos3(k\\theta)=\\cos\\frac{2k\\pi}{3}=-\\frac12' },
          { t: 'p', size: 'sm', text: '→ $\\cos k\\theta$ は $8x^3-6x+1=0$ の解（$k=1,\\ 2,\\ 4$）' },
          plane('c3', [1, 2, 4].map(k => ({ k: 'seg', a: [Math.cos(k * TH), Math.sin(k * TH)], b: [Math.cos(k * TH), 0], c: 'p', dash: true }))
            .concat([1, 2, 4].map(k => ({ k: 'pt', at: [Math.cos(k * TH), 0], c: 'p', r: 6 }))), 400)] },
      { ask: { type: 'choice', q: '3つの解が「異なる」ことの理由として正しいのは？',
        opts: ['角 $\\theta,\\ 2\\theta,\\ 4\\theta$ がちがうから', '$0<\\theta<2\\theta<4\\theta<\\pi$ で、$\\cos$ がこの範囲で減少するから', '3次方程式はいつも3つの実数解をもつから', '3つの値がどれも正だから'], ok: 1,
        why: { 0: '$\\cos\\frac{\\pi}{3}=\\cos\\frac{5\\pi}{3}$ のように、角がちがっても cos が等しいことがあります。', 2: '重解や虚数解をもつ3次方程式もあります。', 3: '$4\\theta=160^\\circ$ なので $\\cos4\\theta<0$ です。' },
        good: '$\\cos\\theta>\\cos2\\theta>\\cos4\\theta$（図の3点）。$4\\theta=160^\\circ<180^\\circ$ なのがポイントです。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\theta>\\cos2\\theta>\\cos4\\theta', note: '異なる3つの解' }] } },
      { clear: true, cols: [1], say: '3次方程式 $ax^3+bx^2+cx+d=0$ の3つの解の和は $-\\frac ba$、積は $-\\frac da$。$a=8,\\ b=0,\\ d=1$ を入れます。',
        add: [{ t: 'h', text: '(3)　解と係数の関係' },
          { t: 'm', tex: '\\cos\\theta+\\cos2\\theta+\\cos4\\theta=-\\frac08=0' },
          { t: 'm', tex: '\\cos\\theta\\cos2\\theta\\cos4\\theta=-\\frac{1}{8}', note: '積は $-\\frac da$（符号に注意）' },
          { t: 'ans', label: '(3) 答', text: '和 $0$、　積 $-\\dfrac18$' },
          { t: 'p', size: 'sm', text: '数値の検算：$0.7660+0.1736+(-0.9397)=0.0000$' }] },
      { ask: { type: 'think', q: '(1) の $z$ を使って、和が $0$ になることを別の方法で確かめよう。',
        hint: '$1+z+z^2+\\cdots+z^8=\\dfrac{z^9-1}{z-1}=0$。$z^{9-k}=\\overline{z}^{\\,k}$ で組にする。$\\cos3\\theta=-\\frac12$ も使う。',
        ans: '$1+2(\\cos\\theta+\\cos2\\theta+\\cos3\\theta+\\cos4\\theta)=0$ で、$\\cos3\\theta=-\\frac12$ を入れると $\\cos\\theta+\\cos2\\theta+\\cos4\\theta=0$',
        after: '$z^k$ と $z^{9-k}$ を組にすると、組の和はどれも $2\\cos k\\theta$。答えが2通りで合うと安心です。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$\\cos\\theta=\\frac\\beta2$ を (2) の方程式に代入すると、係数がすべて整数で、$x^3$ の係数が $1$ の方程式になります。',
        add: [{ t: 'h', text: '(4)　有理数の解をもたないこと' },
          { t: 'm', size: 'sm', tex: '8\\left(\\frac\\beta2\\right)^3-6\\cdot\\frac\\beta2+1=\\beta^3-3\\beta+1=0' },
          { t: 'p', size: 'sm', text: '$F(x)=x^3-3x+1$ とおく。$F(\\beta)=0$。' },
          { t: 'p', size: 'sm', text: '【背理法】$F(x)=0$ が有理数の解 $\\dfrac pq$（$p$ は整数、$q$ は自然数、互いに素）をもつと仮定する。' },
          { t: 'm', size: 'sm', tex: 'p^3-3pq^2+q^3=0', note: '$q^3$ をかけた' }] },
      { ask: { type: 'choice', q: 'この式から言えることは？',
        opts: ['$p$ は偶数', '$p=q$', '$q$ は $p^3$ の約数なので $q=1$', '$p^3$ は $q^3$ の倍数なので $p=0$'], ok: 2,
        why: { 0: '偶数・奇数は、この式からはすぐには決まりません。', 1: '$p=q$ なら解は $1$ ですが、$F(1)=-1\\ne0$ です。理由にもなっていません。', 3: '$q$ が $p^3$ を割り切るのであって、逆ではありません。' },
        good: '$p^3=q(3pq-q^2)$。$p,\\ q$ は互いに素なので $q=1$、解は整数です。',
        add: [{ t: 'm', size: 'sm', tex: 'q=1\\ \\Rightarrow\\ p(p^2-3)=-1', note: '$p$ は整数' }] } },
      { say: '$p(p^2-3)=-1$ で $p$ は整数なので、$p$ は $-1$ の約数、つまり $p=\\pm1$。ところが $F(1)=-1,\\ F(-1)=3$ で、どちらも $0$ になりません。矛盾です。',
        add: [{ t: 'ans', label: '(4) 答', text: '$p=\\pm1$ だが $F(1)=-1\\ne0$、$F(-1)=3\\ne0$ で矛盾。よって $F(x)=0$ は有理数の解をもたない。\n$\\cos\\theta$ が有理数なら $\\beta=2\\cos\\theta$ も有理数で $F(\\beta)=0$ に矛盾。よって $\\cos\\theta$ は無理数。' }] },

      // ---------- (5) ----------
      { clear: true, cols: [1], part: '(5)', say: '(5) です。2次方程式の $x^2$ の係数で割れば、$x^2+sx+t=0$（$s,\\ t$ は有理数）の形にできます。$\\beta$ がこの解だと仮定して、$F(x)$ を $x^2+sx+t$ で割ります。',
        add: [{ t: 'h', text: '(5)　2次方程式の解にならないこと（背理法）' },
          { t: 'p', size: 'sm', text: '有理数 $s,\\ t$ で $\\beta^2+s\\beta+t=0$ となると仮定する。$F(x)$ を $g(x)=x^2+sx+t$ で割ると' },
          { t: 'm', size: 'sm', tex: 'F(x)=(x-s)\\,g(x)+rx+u', note: '$r=s^2-t-3$\n$u=st+1$' },
          { t: 'p', size: 'sm', text: '$r,\\ u$ は有理数（$s,\\ t$ の和・差・積）。' }] },
      { ask: { type: 'choice', q: '$x=\\beta$ を代入すると、$F(\\beta)=0,\\ g(\\beta)=0$ から分かることは？',
        opts: ['$r\\beta+u=0$', '$\\beta=s$', '$r\\beta+u=1$', '$r=0,\\ u=0$ がすぐ分かる'], ok: 0,
        why: { 1: '$g(\\beta)=0$ なので、商 $\\beta-s$ の値は何でもかまいません。', 2: '$F(\\beta)=0$ なので、右辺の合計は $0$ です。', 3: 'この時点では $r\\beta+u=0$ だけ。$r=0$ を言うには (4) を使います。' },
        good: '$0=(\\beta-s)\\cdot0+r\\beta+u$。ここから $r\\ne0$ と $r=0$ に分けます。',
        add: [{ t: 'm', tex: 'r\\beta+u=0' }] } },
      { say: '$r\\ne0$ なら $\\beta=-\\frac ur$ は有理数。でも $\\beta$ は有理数の解をもたない $F(x)=0$ の解なので矛盾。$r=0$ なら $u=0$ で、$F(x)=(x-s)g(x)$。',
        add: [{ t: 'ans', label: '(5) 答', text: '(i) $r\\ne0$：$\\beta=-\\frac ur$ が有理数となり、(4) に矛盾。\n(ii) $r=0$：$u=0$ より $F(x)=(x-s)\\,g(x)$。$F(s)=0$ で、有理数 $s$ が $F(x)=0$ の解となり (4) に矛盾。\nよって $\\beta$ は有理数係数の2次方程式の解にならない。' }] },
      { ask: { type: 'think', q: '他の2つの解 $2\\cos2\\theta,\\ 2\\cos4\\theta$ についても、(5) と同じことが言えるだろうか？',
        hint: '(5) の答案で使ったのは、$\\beta$ のどんな性質？',
        ans: '言える。使ったのは「$F(\\beta)=0$」と「$F(x)=0$ は有理数の解をもたない」の2つだけ',
        after: '答案では (ii) の $r=0$ の場合を書きもらしやすいので注意。「割った余り」で考えると、場合分けが自然に出てきます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数 → 三角関数 → 整式 → 整数、と分野をまたいで1つの値を調べる問題でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
