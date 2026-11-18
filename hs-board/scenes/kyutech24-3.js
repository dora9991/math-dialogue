/* 2024 九工大 第3問の類題（自作）：円周の7等分 ― 複素数・2倍角と3倍角・解と係数の関係・無理数であることの証明
   元の問題はうつしていない（「円周を等分する角の極形式と累乗・共役」「倍角の公式でできる整式に余弦を代入」「3つの余弦が同じ3次方程式の解 → 解と係数」
   「3次方程式が有理数解をもたない → 無理数（背理法）」「有理数係数の2次方程式の解にならない（割り算の余り）」というねらいと形式だけを合わせた自作問題）。
   問題：θ=2π/7、z=cosθ+i sinθ
   答え（python3・sympy で検算ずみ）：
   (1) z⁷=1。z̄=z⁶ より z̄⁴=z³、z̄³=z⁴ → z⁴+z̄⁴−z³−z̄³=0（つまり cos4θ=cos3θ）
   (2) cos4α−cos3α=8x⁴−4x³−8x²+3x+1=(x−1)(8x³+4x²−4x−1)。c=cosθ≠1 → 8c³+4c²−4c−1=0
   (3) 4(kθ)=2kπ−3(kθ) で cos4kθ=cos3kθ（k=1,2,3）、cos は [0,π] で減少 → 異なる3解。和 −1/2、積 1/8（数値でも確認）
   (4) β=2c：β³+β²−2β−1=0。有理数解 p/q（既約, q≧1）→ p³=q(−p²+2pq+q²) → q=1 → 整数解は ±1 だが F(1)=−1, F(−1)=1
   (5) F(x)=(x+1−s)(x²+sx+t)+(s²−s−t−2)x+(st−t−1)。rβ+u=0、r≠0 なら β 有理数で矛盾、r=0 なら u=0 で F(s−1)=0 に矛盾 */
(function () {
  const TH = 2 * Math.PI / 7;
  const NAMES = ['1', 'z', 'z²', 'z³', 'z⁴', 'z⁵', 'z⁶'];
  const DIRS = ['e', 'ne', 'n', 'w', 'w', 's', 'se'];
  const plane = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-1.5, -1.38, 1.62, 1.38], w: w || 470, h: (w || 470) * 2.76 / 3.12, items: [
    { k: 'axes', tx: [], ty: [], xl: '実軸', yl: '虚軸', o: false },
    { k: 'circle', o: [0, 0], r: 1, c: 'd' },
    { k: 'poly', pts: [0, 1, 2, 3, 4, 5, 6].map(k => [Math.cos(k * TH), Math.sin(k * TH)]), close: true, c: 'b', fill: 'b', alpha: 0.1 }
  ].concat([0, 1, 2, 3, 4, 5, 6].map(k => ({ k: 'pt', at: [Math.cos(k * TH), Math.sin(k * TH)], c: k ? 'y' : 'w', name: NAMES[k], dir: DIRS[k], size: 28 })))
    .concat(extra || []) });
  const POINTS = [
    '$z=\\cos\\frac{2\\pi}{7}+i\\sin\\frac{2\\pi}{7}$ なら $z^7=1$、$\\overline{z}=\\frac1z=z^6$。$z^k+\\overline{z}^{\\,k}=2\\cos k\\theta$ で、複素数の式を $\\cos$ の式に直す',
    '$7\\theta=2\\pi$ から $\\cos4\\theta=\\cos3\\theta$。2倍角・3倍角で $\\cos\\theta$ の4次方程式にし、**意味から分かる解 $x=1$** でくくって3次方程式に',
    '無理数の証明は背理法：既約分数 $\\frac pq$ を解と仮定して約数を調べる。2次方程式の解でないことは **3次式を2次式で割った余り** で、$r\\ne0$・$r=0$ の両方を書く'
  ];

  HB.lesson({
    id: 'kyutech24-3', field: '九工大型　数学', title: '2024 九工大 第3問の類題 ― 円周の7等分と cos(2π/7) が無理数であること', level: '2024年度 九州工業大学 前期 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$i$ を虚数単位とし、$\\theta=\\dfrac{2\\pi}{7}$、$z=\\cos\\theta+i\\sin\\theta$ とする。また、$\\overline{z}$ は $z$ と共役な複素数を表す。',
      parts: [
        '(1)　$z^7$ の値を求めよ。また、$z^4+\\overline{z}^{\\,4}-z^3-\\overline{z}^{\\,3}$ の値を求めよ。',
        '(2)　実数 $\\alpha$ に対して、$\\cos4\\alpha-\\cos3\\alpha$ を $x=\\cos\\alpha$ の整式で表せ。さらに、$\\cos\\theta$ は3次方程式 $8x^3+4x^2-4x-1=0$ の解であることを示せ。',
        '(3)　$\\cos\\theta,\\ \\cos2\\theta,\\ \\cos3\\theta$ は (2) の3次方程式の異なる3つの解であることを示し、$\\cos\\theta+\\cos2\\theta+\\cos3\\theta$ と $\\cos\\theta\\cos2\\theta\\cos3\\theta$ の値を求めよ。',
        '(4)　$\\beta=2\\cos\\theta$ とする。3次方程式 $x^3+x^2-2x-1=0$ は $\\beta$ を解にもち、有理数の解をもたないことを示せ。また、$\\cos\\theta$ は無理数であることを示せ。',
        '(5)　$\\beta$ は、有理数を係数とするどのような2次方程式の解にもならないことを示せ。'
      ],
      src: '※ 2024年度 九州工業大学 前期 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { cols: [1], part: '問題', say: '円周を7等分する複素数から、$\\cos\\frac{2\\pi}{7}$ の性質を調べます。前半は計算、後半の (4)(5) は背理法の証明です。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '$z,\\ z^2,\\ \\cdots,\\ z^6,\\ 1$ は、単位円を7等分する点です。正七角形の頂点の座標 $\\cos\\frac{2\\pi}{7}$ は、まだ見たことのない値。それがどんな数かを調べる問題です。',
        add: [{ t: 'h', text: '方針：小問どうしのつながり' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', '使うもの'],
            ['(1)', 'ド・モアブルの定理、$|z|=1$'],
            ['(2)', '2倍角・3倍角、(1) の $\\cos4\\theta=\\cos3\\theta$'],
            ['(3)', '解と係数の関係'],
            ['(4)', '背理法（既約分数の約数）'],
            ['(5)', '背理法（割り算の余り）＋(4)']] },
          plane('c0', [], 440)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。ド・モアブルの定理で $z^7=\\cos2\\pi+i\\sin2\\pi=1$。次に、共役 $\\overline{z}$ を $z$ の累乗で表すことを考えます。',
        add: [{ t: 'h', text: '(1)　z⁷ と共役' },
          { t: 'm', tex: 'z^7=\\cos7\\theta+i\\sin7\\theta=\\cos2\\pi+i\\sin2\\pi=1' },
          plane('c1')] },
      { ask: { type: 'choice', q: '$\\overline{z}$ を $z$ の累乗で表すと？',
        opts: ['$-z$', '$z^8$', '$z^6$', '$z^{-6}$'], ok: 2,
        why: { 0: '$-z$ は原点について対称な点です。共役は実軸について対称な点です。', 1: '$z^8=z^7\\cdot z=z$。$z$ 自身にもどってしまいます。', 3: '$z^{-6}=z^{7-6}=z$ です。' },
        good: '$|z|=1$ なので $z\\overline{z}=1$、$\\overline{z}=\\frac1z=\\frac{z^7}{z}=z^6$。図でも $z^6$ は $z$ と実軸について対称です。',
        add: [{ t: 'm', tex: '\\overline{z}=\\frac{1}{z}=z^6' }],
        draw: [{ fig: 'c1', items: [{ k: 'seg', a: [Math.cos(TH), Math.sin(TH)], b: [Math.cos(TH), -Math.sin(TH)], c: 'p', dash: true }] }] } },
      { say: 'すると $\\overline{z}^{\\,4}=z^{24}=z^3$、$\\overline{z}^{\\,3}=z^{18}=z^4$（$z^7=1$ で指数を7で割った余りにできる）。求める値は $0$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'z^4+\\overline{z}^{\\,4}-z^3-\\overline{z}^{\\,3}=z^4+z^3-z^3-z^4=0' },
          { t: 'ans', label: '(1) 答', tex: 'z^7=1,\\qquad z^4+\\overline{z}^{\\,4}-z^3-\\overline{z}^{\\,3}=0' },
          { t: 'box', c: 'g', size: 'sm', label: '意味', text: '$z^k+\\overline{z}^{\\,k}=2\\cos k\\theta$ なので\n$2\\cos4\\theta-2\\cos3\\theta=0$、つまり $\\cos4\\theta=\\cos3\\theta$' }] },

      // ---------- (2) ----------
      { clear: true, cols: [1], part: '(2)', say: '(2) です。$x=\\cos\\alpha$ とします。$\\cos4\\alpha$ は2倍角を2回使います。$\\cos2\\alpha=2x^2-1$ をもう一度2倍角の式に入れます。',
        add: [{ t: 'h', text: '(2)　cos 4α − cos 3α を x = cos α で表す' },
          { t: 'm', tex: '\\cos4\\alpha=2\\cos^22\\alpha-1=2(2x^2-1)^2-1=8x^4-8x^2+1' }] },
      { ask: { type: 'choice', q: '3倍角の公式で、$\\cos3\\alpha$ を $x=\\cos\\alpha$ で表すと？',
        opts: ['$3x-4x^3$', '$4x^3-3x$', '$4x^3+3x$', '$x^3-3x$'], ok: 1,
        why: { 0: 'それは $\\sin3\\alpha=3\\sin\\alpha-4\\sin^3\\alpha$ の形です。', 2: '$\\alpha=0$ を入れると $7\\ne\\cos0=1$。符号がちがいます。', 3: '$\\alpha=0$ で $-2\\ne1$。係数は 4 と 3 です。' },
        good: '$\\cos3\\alpha=4\\cos^3\\alpha-3\\cos\\alpha$。$\\alpha=0$ を入れて $4-3=1$ と検算できます。',
        add: [{ t: 'm', tex: '\\cos3\\alpha=4x^3-3x' },
          { t: 'm', tex: '\\cos4\\alpha-\\cos3\\alpha=8x^4-4x^3-8x^2+3x+1', note: '$=P(x)$ とおく' }] } },
      { ask: { type: 'choice', q: '$P(x)=8x^4-4x^3-8x^2+3x+1$ の因数として、すぐ見つかるのは？',
        opts: ['$x+1$', '$2x-1$', '$x$', '$x-1$'], ok: 3,
        why: { 0: '$P(-1)=8+4-8-3+1=2\\ne0$ です。', 1: '$P\\!\\left(\\frac12\\right)=\\frac12\\ne0$ です。', 2: '定数項が $1$ なので、$x$ ではくくれません。' },
        good: '$\\alpha=0$ なら $\\cos4\\alpha-\\cos3\\alpha=1-1=0$。つまり $x=1$ は必ず解です（$P(1)=0$）。',
        add: [{ t: 'm', tex: 'P(x)=(x-1)(8x^3+4x^2-4x-1)' }] } },
      { say: '$\\alpha=\\theta$ とすると、(1) より $\\cos4\\theta-\\cos3\\theta=0$、つまり $P(c)=0$（$c=\\cos\\theta$）。$c\\ne1$ なので、$x-1$ で割った3次式が $0$ になります。',
        add: [{ t: 'ans', label: '(2) 答', text: '$\\cos4\\alpha-\\cos3\\alpha=8x^4-4x^3-8x^2+3x+1$\n$c=\\cos\\theta$ とすると、(1) より $P(c)=(c-1)(8c^3+4c^2-4c-1)=0$。$0<\\theta<\\frac\\pi2$ より $c\\ne1$ なので $8c^3+4c^2-4c-1=0$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$k=1,\\ 2,\\ 3$ で、$7k\\theta=2k\\pi$ なので $4k\\theta=2k\\pi-3k\\theta$。よって $\\cos4k\\theta=\\cos3k\\theta$ で、$\\cos k\\theta$ も同じ方程式を満たします。',
        add: [{ t: 'h', text: '(3)　3つの cos が同じ3次方程式の解' },
          { t: 'm', size: 'sm', tex: '\\cos4(k\\theta)=\\cos(2k\\pi-3k\\theta)=\\cos3(k\\theta)' },
          { t: 'p', size: 'sm', text: '→ $P(\\cos k\\theta)=0$。$\\cos k\\theta\\ne1$ なので\n$8x^3+4x^2-4x-1=0$ の解（$k=1,\\ 2,\\ 3$）' },
          plane('c3', [1, 2, 3].map(k => ({ k: 'seg', a: [Math.cos(k * TH), Math.sin(k * TH)], b: [Math.cos(k * TH), 0], c: 'p', dash: true }))
            .concat([1, 2, 3].map(k => ({ k: 'pt', at: [Math.cos(k * TH), 0], c: 'p', r: 6 }))), 400)] },
      { ask: { type: 'choice', q: '3つの解が「異なる」ことの理由として正しいのは？',
        opts: ['角 $\\theta,\\ 2\\theta,\\ 3\\theta$ がちがうから', '3次方程式はいつも3つの実数解をもつから', '$\\cos$ が $0\\le x\\le\\pi$ で減少するから', '3つの値がどれも正だから'], ok: 2,
        why: { 0: '$\\cos\\frac{\\pi}{3}=\\cos\\frac{5\\pi}{3}$ のように、角がちがっても cos が等しいことがあります。', 1: '重解や虚数解をもつ3次方程式もあります。', 3: '$2\\theta>\\frac\\pi2$ なので $\\cos2\\theta<0$ です。' },
        good: '$0<\\theta<2\\theta<3\\theta<\\pi$ なので $\\cos\\theta>\\cos2\\theta>\\cos3\\theta$（図の3点）。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\theta>\\cos2\\theta>\\cos3\\theta', note: '異なる3つの解' }] } },
      { clear: true, cols: [1], say: '3次方程式 $ax^3+bx^2+cx+d=0$ の3つの解の和は $-\\frac ba$、積は $-\\frac da$。$a=8,\\ b=4,\\ d=-1$ を入れます。',
        add: [{ t: 'h', text: '(3)　解と係数の関係' },
          { t: 'm', tex: '\\cos\\theta+\\cos2\\theta+\\cos3\\theta=-\\frac48=-\\frac12' },
          { t: 'm', tex: '\\cos\\theta\\cos2\\theta\\cos3\\theta=-\\frac{-1}{8}=\\frac18', note: '積は $-\\frac da$（符号に注意）' },
          { t: 'ans', label: '(3) 答', text: '和 $-\\dfrac12$、　積 $\\dfrac18$' },
          { t: 'p', size: 'sm', text: '数値の検算：$0.6235+(-0.2225)+(-0.9010)=-0.5000$' }] },
      { ask: { type: 'think', q: '(1) の $z$ を使って、和が $-\\dfrac12$ になることを別の方法で確かめよう。',
        hint: '$z^7=1,\\ z\\ne1$ より $1+z+z^2+\\cdots+z^6=\\dfrac{z^7-1}{z-1}=0$。$z^6=\\overline{z}$ のように組にする。',
        ans: '$1+(z+z^6)+(z^2+z^5)+(z^3+z^4)=1+2(\\cos\\theta+\\cos2\\theta+\\cos3\\theta)=0$',
        after: '$z^{7-k}=\\overline{z}^{\\,k}$ なので、組の和はどれも $2\\cos k\\theta$。答えが2通りで合うと安心です。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$\\cos\\theta=\\frac\\beta2$ を (2) の方程式に代入すると、係数がすべて整数で、$x^3$ の係数が $1$ の方程式になります。',
        add: [{ t: 'h', text: '(4)　有理数の解をもたないこと' },
          { t: 'm', size: 'sm', tex: '8\\left(\\frac\\beta2\\right)^3+4\\left(\\frac\\beta2\\right)^2-4\\cdot\\frac\\beta2-1=\\beta^3+\\beta^2-2\\beta-1=0' },
          { t: 'p', size: 'sm', text: '$F(x)=x^3+x^2-2x-1$ とおく。$F(\\beta)=0$。' },
          { t: 'p', size: 'sm', text: '【背理法】$F(x)=0$ が有理数の解 $\\dfrac pq$（$p$ は整数、$q$ は自然数、互いに素）をもつと仮定する。' },
          { t: 'm', size: 'sm', tex: 'p^3+p^2q-2pq^2-q^3=0', note: '$q^3$ をかけた' }] },
      { ask: { type: 'choice', q: 'この式から言えることは？',
        opts: ['$q$ は $p^3$ の約数なので $q=1$', '$p$ は偶数', '$p=q$', '$p^3$ は $q^3$ の倍数なので $p=0$'], ok: 0,
        why: { 1: '偶数・奇数は、この式からはすぐには決まりません。', 2: '$p=q$ なら解は $1$ ですが、$F(1)=-1\\ne0$ です。理由にもなっていません。', 3: '$q$ が $p^3$ を割り切るのであって、逆ではありません。' },
        good: '$p^3=q(-p^2+2pq+q^2)$。$p,\\ q$ は互いに素なので $q=1$、解は整数です。',
        add: [{ t: 'm', size: 'sm', tex: 'q=1\\ \\Rightarrow\\ p(p^2+p-2)=1', note: '$p$ は整数' }] } },
      { say: '$p(p^2+p-2)=1$ で $p$ は整数なので $p=\\pm1$。ところが $F(1)=-1,\\ F(-1)=1$ で、どちらも $0$ になりません。矛盾です。',
        add: [{ t: 'ans', label: '(4) 答', text: '$p=\\pm1$ だが $F(1)=-1\\ne0$、$F(-1)=1\\ne0$ で矛盾。よって $F(x)=0$ は有理数の解をもたない。\n$\\cos\\theta$ が有理数なら $\\beta=2\\cos\\theta$ も有理数で $F(\\beta)=0$ に矛盾。よって $\\cos\\theta$ は無理数。' }] },

      // ---------- (5) ----------
      { clear: true, cols: [1], part: '(5)', say: '(5) です。2次方程式の $x^2$ の係数で割れば、$x^2+sx+t=0$（$s,\\ t$ は有理数）の形にできます。$\\beta$ がこの解だと仮定して、$F(x)$ を $x^2+sx+t$ で割ります。',
        add: [{ t: 'h', text: '(5)　2次方程式の解にならないこと（背理法）' },
          { t: 'p', size: 'sm', text: '有理数 $s,\\ t$ で $\\beta^2+s\\beta+t=0$ となると仮定する。$F(x)$ を $g(x)=x^2+sx+t$ で割ると' },
          { t: 'm', size: 'sm', tex: 'F(x)=(x+1-s)\\,g(x)+rx+u', note: '$r=s^2-s-t-2$\n$u=st-t-1$' },
          { t: 'p', size: 'sm', text: '$r,\\ u$ は有理数（$s,\\ t$ の和・差・積）。' }] },
      { ask: { type: 'choice', q: '$x=\\beta$ を代入すると、$F(\\beta)=0,\\ g(\\beta)=0$ から分かることは？',
        opts: ['$r=0,\\ u=0$ がすぐ分かる', '$\\beta=s-1$', '$r\\beta+u=1$', '$r\\beta+u=0$'], ok: 3,
        why: { 0: 'この時点では $r\\beta+u=0$ だけ。$r=0$ を言うには (4) を使います。', 1: '$g(\\beta)=0$ なので、商 $\\beta+1-s$ の値は何でもかまいません。', 2: '$F(\\beta)=0$ なので、右辺の合計は $0$ です。' },
        good: '$0=(\\beta+1-s)\\cdot0+r\\beta+u$。ここから $r\\ne0$ と $r=0$ に分けます。',
        add: [{ t: 'm', tex: 'r\\beta+u=0' }] } },
      { say: '$r\\ne0$ なら $\\beta=-\\frac ur$ は有理数。でも $\\beta$ は有理数の解をもたない $F(x)=0$ の解なので矛盾。$r=0$ なら $u=0$ で、$F(x)=(x+1-s)g(x)$。',
        add: [{ t: 'ans', label: '(5) 答', text: '(i) $r\\ne0$：$\\beta=-\\frac ur$ が有理数となり、(4) に矛盾。\n(ii) $r=0$：$u=0$ より $F(x)=(x+1-s)\\,g(x)$。$F(s-1)=0$ で、有理数 $s-1$ が $F(x)=0$ の解となり (4) に矛盾。\nよって $\\beta$ は有理数係数の2次方程式の解にならない。' }] },
      { ask: { type: 'think', q: '他の2つの解 $2\\cos2\\theta,\\ 2\\cos3\\theta$ についても、(5) と同じことが言えるだろうか？',
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
