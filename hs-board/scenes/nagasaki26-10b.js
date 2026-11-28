/* 長崎大型 数学（理系）：2026年度 長崎大学 前期 医学部医学科 第10問の類題② （自作問題・元の問題ではない）
   問題：f(x)=8x³−3x²−3x+1（有理数の解はない）
   答え（python3・sympy で検算ずみ）：
     (1) f'(x)=24x²−6x−3=3(4x+1)(2x−1)、極大値 f(−1/4)=23/16、極小値 f(1/2)=−1/4。f(−1)=−7<0、f(1)=3>0 より、解は (−1,−1/4)・(−1/4,1/2)・(1/2,1) に1つずつ
         （数値：α≈−0.5991、β≈0.3180、γ≈0.6562）
     (2) α+β+γ=3/8、αβ+βγ+γα=−3/8、αβγ=−1/8、α²+β²+γ²=57/64、α³+β³+γ³=51/512
     (3) Σ(−1)^{n−1}p_n=Σα/(1+α)=3−Σ1/(1+α)。(1+α)(1+β)(1+γ)=−f(−1)/8=7/8、Σ(1+β)(1+γ)=3+2·(3/8)−3/8=27/8 → Σ1/(1+α)=27/7 → 和は −6/7
         （n≦400 の部分和を数値で確認：−0.857143）
     (4) L=|f(t)|/8。−1/4≦t≦1 で f(−1/4)=23/16、f(1/2)=−1/4、f(1)=3、区間に解あり → 0≦L≦3/8（t=1 で最大、極大値の 23/128 ではない） */
(function () {
  const F = '8*x**3-3*x**2-3*x+1', al = -0.59913, be = 0.31795, ga = 0.65618;
  const big = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.25, -2.3, 1.3, 3.6], w: 560, h: 430, items: [
    { k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [[1, '1'], [3, '3']] },
    { k: 'fn', f: F, a: -0.8, b: 1.02, label: 'y=f(x)', lat: [-0.55, 2.6], la: 'end' },
    { k: 'line', x: -1, dash: true, c: 'd' }, { k: 'line', x: 1, dash: true, c: 'd' }
  ].concat(extra || []) });
  const roots = [{ k: 'pt', at: [al, 0], name: 'α', dir: 'sw', c: 'p', size: 24 }, { k: 'pt', at: [be, 0], name: 'β', dir: 'nw', c: 'p', size: 24 }, { k: 'pt', at: [ga, 0], name: 'γ', dir: 'se', c: 'p', size: 24 }];
  const zoom = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.65, -0.6, 1.25, 3.5], w: 560, h: 440, items: [
    { k: 'axes', tx: [[-0.25, '−1/4'], [0.5, '1/2'], [1, '1']], ty: [[1, '1'], [3, '3']] },
    { k: 'fn', f: F, a: -0.645, b: 1.03, label: 'y=f(x)', lat: [-0.6, 1.8], la: 'start' }
  ].concat(extra || []) });
  const POINTS = [
    '解が具体的に求まらない3次方程式は、**増減表＋区間の端の値の符号**で、解の個数と範囲を示す',
    '対称式は解と係数の関係で。$f(x)=8(x-\\alpha)(x-\\beta)(x-\\gamma)$ に $x=\\pm1$ を入れると $(1\\mp\\alpha)(1\\mp\\beta)(1\\mp\\gamma)$ が出る（符号に注意）',
    '$|r|<1$ を確かめてから無限等比級数。距離の積は $|f(t)|$ の定数倍とみて、端の値と極値を比べる（最大は端のこともある）'
  ];

  HB.lesson({
    id: 'nagasaki26-10b', field: '長崎大型　数学（理系）', title: '2026 長崎大 理系 第10問の類題② ― 3次方程式の解の対称式と無限級数・距離の積', level: '2026年度 長崎大学 理系 第10問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$f(x)=8x^3-3x^2-3x+1$ とする。',
      parts: [
        '(1)　関数 $f(x)$ の極値を求めよ。また，方程式 $f(x)=0$ は異なる3つの実数解をもち，それらはすべて $-1<x<1$ の範囲にあることを示せ。',
        '(2)　(1) の3つの解を $\\alpha,\\ \\beta,\\ \\gamma\\ (\\alpha<\\beta<\\gamma)$ とする。$\\alpha+\\beta+\\gamma$，$\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha$，$\\alpha\\beta\\gamma$ の値と，$\\alpha^2+\\beta^2+\\gamma^2$，$\\alpha^3+\\beta^3+\\gamma^3$ の値を求めよ。',
        '(3)　$p_n=\\alpha^n+\\beta^n+\\gamma^n\\ (n=1,\\,2,\\,3,\\,\\cdots)$ とする。無限級数 $\\displaystyle\\sum_{n=1}^{\\infty}(-1)^{n-1}p_n$ は収束することを示し，その和を求めよ。',
        '(4)　座標平面上に3点 $\\mathrm{A}(\\alpha,\\,0)$，$\\mathrm{B}(\\beta,\\,0)$，$\\mathrm{C}(\\gamma,\\,0)$ をとる。点 $\\mathrm{P}(t,\\,0)$ が $-\\dfrac14\\le t\\le1$ の範囲を動くとき，積 $L=\\mathrm{PA}\\cdot\\mathrm{PB}\\cdot\\mathrm{PC}$ のとりうる値の範囲を求めよ。'
      ],
      src: '※ 2026年度 長崎大学 前期 医学部医学科 第10問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '3次方程式の解を、微分・解と係数の関係・無限級数の3つの道具で調べる問題の類題②です。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.5' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: 'この方程式は、有理数の解をもちません（$\\pm1,\\ \\pm\\frac12,\\ \\pm\\frac14,\\ \\pm\\frac18$ を入れても 0 にならない）。解を求めずに、解の性質を調べるのがテーマです。',
        add: [{ t: 'h', text: '解を求めずに、解の性質を調べる' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', '知りたいこと', '道具'],
            ['(1)', '解の個数と、およその位置', '増減表と、区間の端の値の符号'],
            ['(2)', '解の対称式の値', '解と係数の関係'],
            ['(3)', '交代する級数の和', '$|\\alpha|<1$ などから無限等比級数 → $x=-1$ を代入'],
            ['(4)', '距離の積の範囲', '$\\mathrm{PA}\\cdot\\mathrm{PB}\\cdot\\mathrm{PC}$ を $|f(t)|$ で表す']] },
          { t: 'p', size: 'sm', text: '(1) の「$-1<x<1$」が (3) の収束の根拠になります。前の小問の結果を、どこで使うかを意識しましょう。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: "(1) です。$f'(x)=24x^2-6x-3=3(4x+1)(2x-1)$。$x=-\\frac14$ で極大、$x=\\frac12$ で極小です。",
        add: [{ t: 'h', text: '(1)　極値と解の位置' },
          { t: 'm', tex: "f'(x)=24x^2-6x-3=3(4x+1)(2x-1)" },
          { t: 'm', tex: '\\text{極大値}\\ f\\Big(-\\frac14\\Big)=\\frac{23}{16}' }, big('f1')] },
      { ask: { type: 'choice', q: '極小値 $f\\big(\\frac12\\big)$ は？',
        opts: ['$\\dfrac14$', '$-\\dfrac54$', '$-\\dfrac14$', '$-\\dfrac12$'], ok: 2,
        why: { 0: '$1-\\frac34-\\frac32+1=-\\frac14$。符号がちがいます。', 1: '最後の $+1$ を足し忘れています。', 3: '$8\\cdot\\frac18=1$、$3\\cdot\\frac14=\\frac34$、$3\\cdot\\frac12=\\frac32$ を、もう一度。' },
        good: '$8\\cdot\\frac18-3\\cdot\\frac14-3\\cdot\\frac12+1=1-\\frac34-\\frac32+1=-\\frac14$。極大値は正、極小値は負です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$\\cdots$', '$-\\frac14$', '$\\cdots$', '$\\frac12$', '$\\cdots$'], ["$f'(x)$", '$+$', '$0$', '$-$', '$0$', '$+$'], ['$f(x)$', '↗', '$\\frac{23}{16}$', '↘', '$-\\frac14$', '↗']] }],
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: [-0.25, 23 / 16], c: 'y' }, { k: 'pt', at: [0.5, -0.25], c: 'y' }] }] } },
      { say: '3つの解が $-1<x<1$ にあることを示すには、両はし $f(-1)$ と $f(1)$ も調べます。$f(-1)=-7<0$、$f(1)=3>0$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'f(-1)=-8-3+3+1=-7,\\qquad f(1)=8-3-3+1=3' },
          { t: 'p', size: 'sm', text: '$-7<0<\\frac{23}{16}$、$\\frac{23}{16}>0>-\\frac14$、$-\\frac14<0<3$。3つの区間に1つずつ解があります。' }],
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: [1, 3], c: 'g' }].concat(roots) }] },
      { clear: true, cols: [1], say: '答案の書き方です。「単調な区間で、両はしの符号がちがう → ちょうど1つ」を3回くり返し、最後に「合わせて3つ」とまとめます。',
        add: [{ t: 'h', text: '(1)　答案' },
          { t: 'box', c: 'y', size: 'sm', label: '答案の形', text: '$f(x)$ は $-1\\le x\\le-\\frac14$ で増加し、$f(-1)=-7<0,\\ f\\big(-\\frac14\\big)=\\frac{23}{16}>0$ だから、$-1<x<-\\frac14$ にただ1つの解をもつ。\n$-\\frac14\\le x\\le\\frac12$ で減少し、$f\\big(-\\frac14\\big)>0,\\ f\\big(\\frac12\\big)=-\\frac14<0$ だから、$-\\frac14<x<\\frac12$ にただ1つの解をもつ。\n$\\frac12\\le x\\le1$ で増加し、$f\\big(\\frac12\\big)<0,\\ f(1)=3>0$ だから、$\\frac12<x<1$ にただ1つの解をもつ。\n3次方程式の解は3つまでなので、これで全部。よって、異なる3つの実数解はすべて $-1<x<1$ にある。' },
          { t: 'ans', label: '(1) 答', text: '極大値 $\\dfrac{23}{16}$（$x=-\\dfrac14$）、極小値 $-\\dfrac14$（$x=\\dfrac12$）' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$8x^3-3x^2-3x+1=0$ の解と係数の関係。$x^3$ の係数が 8 なので、8 で割ることに注意します。',
        add: [{ t: 'h', text: '(2)　対称式の値' },
          { t: 'm', tex: '\\alpha+\\beta+\\gamma=-\\frac{-3}{8}=\\frac38' }, { t: 'm', tex: '\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha=\\frac{-3}{8}=-\\frac38' }] },
      { ask: { type: 'choice', q: '$\\alpha\\beta\\gamma$ は？',
        opts: ['$\\dfrac18$', '$-1$', '$-\\dfrac18$', '$1$'], ok: 2,
        why: { 0: '$ax^3+bx^2+cx+d=0$ の3つの解の積は $-\\dfrac da$。マイナスがつきます。', 1: '$x^3$ の係数 8 で割ります。', 3: '定数項の符号を変え、さらに 8 で割ります。' },
        good: '$\\alpha\\beta\\gamma=-\\dfrac18$。(1) で解は負が1つ、正が2つなので、積が負なのは合っています。',
        add: [{ t: 'm', tex: '\\alpha\\beta\\gamma=-\\frac18' }] } },
      { say: '2乗の和は「和の2乗 − 2×（2つずつの積の和）」で $\\frac{9}{64}+\\frac34=\\frac{57}{64}$。3乗の和は、方程式そのものを使うと速く求まります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\alpha^2+\\beta^2+\\gamma^2&=\\Big(\\frac38\\Big)^2-2\\Big(-\\frac38\\Big)\\\\ &=\\frac{57}{64}\\end{aligned}' },
          { t: 'box', c: 'g', col: 1, size: 'sm', label: '方程式を使う', text: '$f(\\alpha)=0$ より $8\\alpha^3=3\\alpha^2+3\\alpha-1$、つまり $\\alpha^3=\\dfrac{3\\alpha^2+3\\alpha-1}{8}$（$\\beta,\\ \\gamma$ も同じ）' }] },
      { ask: { type: 'think', q: '$\\alpha^3+\\beta^3+\\gamma^3$ を求めよう。',
        hint: '$\\alpha^3=\\frac{3\\alpha^2+3\\alpha-1}{8}$ を3つ足す。',
        ans: '$\\alpha^3+\\beta^3+\\gamma^3=\\dfrac{3\\cdot\\frac{57}{64}+3\\cdot\\frac38-3}{8}=\\dfrac{\\frac{171+72-192}{64}}{8}=\\dfrac{51}{512}$',
        after: '公式 $(\\alpha+\\beta+\\gamma)^3-3(\\alpha+\\beta+\\gamma)(\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha)+3\\alpha\\beta\\gamma$ に入れても、同じ $\\frac{51}{512}$ になります。',
        add: [{ t: 'ans', col: 1, label: '(2) 答', text: '$\\alpha+\\beta+\\gamma=\\dfrac38$、$\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha=-\\dfrac38$、$\\alpha\\beta\\gamma=-\\dfrac18$\n$\\alpha^2+\\beta^2+\\gamma^2=\\dfrac{57}{64}$、$\\alpha^3+\\beta^3+\\gamma^3=\\dfrac{51}{512}$' }] } },

      // ---------- (3) ----------
      { clear: true, cols: [1], part: '(3)', say: '(3) です。$(-1)^{n-1}\\alpha^n$ は、初項 $\\alpha$・公比 $-\\alpha$ の等比数列。(1) から $|\\alpha|,\\ |\\beta|,\\ |\\gamma|<1$ なので、3つとも収束します。',
        add: [{ t: 'h', text: '(3)　無限級数の和' },
          { t: 'm', tex: '\\sum_{n=1}^{\\infty}(-1)^{n-1}\\alpha^n=\\frac{\\alpha}{1+\\alpha}=1-\\frac{1}{1+\\alpha}\\qquad(|\\alpha|<1\\ \\text{より収束})', note: '初項 $\\alpha$、公比 $-\\alpha$' },
          { t: 'm', tex: '\\sum_{n=1}^{\\infty}(-1)^{n-1}p_n=3-\\Big(\\frac{1}{1+\\alpha}+\\frac{1}{1+\\beta}+\\frac{1}{1+\\gamma}\\Big)' }] },
      { ask: { type: 'choice', q: '$f(x)=8(x-\\alpha)(x-\\beta)(x-\\gamma)$ に $x=-1$ を入れて、$(1+\\alpha)(1+\\beta)(1+\\gamma)$ は？',
        opts: ['$-\\dfrac78$', '$\\dfrac87$', '$-7$', '$\\dfrac78$'], ok: 3,
        why: { 0: '$f(-1)=8(-1-\\alpha)(-1-\\beta)(-1-\\gamma)=-8(1+\\alpha)(1+\\beta)(1+\\gamma)$。右辺のマイナスで符号が戻ります。', 1: '$f(-1)=-7$ を 8 で割る形です。逆数にはなりません。', 2: '$f(-1)=-7$ の符号を変えただけです。8 で割ります。' },
        good: '$-7=-8(1+\\alpha)(1+\\beta)(1+\\gamma)$ より $(1+\\alpha)(1+\\beta)(1+\\gamma)=\\dfrac78$。$x=-1$ を入れるときは、3つの因数すべてに $-$ がつくのを忘れずに。',
        add: [{ t: 'm', tex: '(1+\\alpha)(1+\\beta)(1+\\gamma)=-\\frac{f(-1)}{8}=\\frac78' }] } },
      { ask: { type: 'think', q: '$\\dfrac{1}{1+\\alpha}+\\dfrac{1}{1+\\beta}+\\dfrac{1}{1+\\gamma}$ を求め、$\\displaystyle\\sum(-1)^{n-1}p_n$ の和を出そう。',
        hint: '通分すると、分子は $(1+\\beta)(1+\\gamma)+(1+\\gamma)(1+\\alpha)+(1+\\alpha)(1+\\beta)$。展開して (2) の値を入れる。',
        ans: '分子 $=3+2\\cdot\\frac38-\\frac38=\\frac{27}{8}$。和は $\\dfrac{27/8}{7/8}=\\dfrac{27}{7}$。よって $3-\\dfrac{27}{7}=-\\dfrac67$',
        after: '$p_1,\\ p_2,\\ p_3,\\ \\cdots$ を $+,-,+,\\cdots$ の順に足すと、$-0.857\\cdots$ に近づきます。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\sum_{n=1}^{\\infty}(-1)^{n-1}p_n=-\\frac67' }] } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。P と A の距離は $|t-\\alpha|$。3つの距離の積は、$(t-\\alpha)(t-\\beta)(t-\\gamma)$ の絶対値です。これを $f(t)$ で表します。',
        add: [{ t: 'h', text: '(4)　距離の積' },
          { t: 'm', tex: 'L=|t-\\alpha|\\,|t-\\beta|\\,|t-\\gamma|=|(t-\\alpha)(t-\\beta)(t-\\gamma)|' },
          zoom('z1', [{ k: 'seg', a: [-0.25, 0], b: [1, 0], c: 'y', wd: 6 }].concat(roots, [{ k: 'pt', at: [0.1, 0], name: 'P', dir: 'se', c: 'g', size: 20 }]))] },
      { ask: { type: 'choice', q: '$L$ を $f(t)$ で表すと？',
        opts: ['$\\dfrac{f(t)}{8}$', '$8\\,|f(t)|$', '$|f(t)|$', '$\\dfrac{|f(t)|}{8}$'], ok: 3,
        why: { 0: '$t$ が $\\alpha$ と $\\beta$ の間などでは $f(t)>0$、$\\beta$ と $\\gamma$ の間では $f(t)<0$。距離の積は負になりません。絶対値が必要です。', 1: '$f(t)=8(t-\\alpha)(t-\\beta)(t-\\gamma)$ なので、8 で割ります。', 2: '$x^3$ の係数 8 を忘れています。' },
        good: '$L=\\dfrac{|f(t)|}{8}$。距離の積の範囲は、$-\\frac14\\le t\\le1$ での $|f(t)|$ の範囲に読みかえられます。',
        add: [{ t: 'm', tex: 'L=\\frac{|f(t)|}{8}' }] } },
      { clear: true, say: '$-\\frac14\\le t\\le1$ での $f(t)$ の範囲を、端と極値の値で調べます。端の値 3 が、極大値 $\\frac{23}{16}$ よりも大きいことに注意します。',
        add: [{ t: 'h', text: '(4)　f(t) の範囲' },
          { t: 'tbl', size: 'sm', rows: [['$t$', '$-\\frac14$', '$\\frac12$', '$1$'], ['$f(t)$', '$\\frac{23}{16}$（極大）', '$-\\frac14$（極小）', '$3$']] },
          { t: 'm', tex: '-\\frac14\\le f(t)\\le3', note: '$-\\frac14\\le t\\le1$ で' },
          zoom('z2', [{ k: 'line', m: 0, n: 3, c: 'b', dash: true }, { k: 'line', m: 0, n: -0.25, c: 'b', dash: true },
            { k: 'seg', a: [-0.25, 0], b: [1, 0], c: 'y', wd: 6 },
            { k: 'pt', at: [-0.25, 23 / 16], c: 'y' }, { k: 'pt', at: [0.5, -0.25], c: 'y' }, { k: 'pt', at: [1, 3], c: 'y' }])] },
      { ask: { type: 'choice', q: '$L=\\dfrac{|f(t)|}{8}$ の最大値は？',
        opts: ['$\\dfrac{23}{128}$', '$\\dfrac{3}{8}$', '$3$', '$\\dfrac{1}{32}$'], ok: 1,
        why: { 0: '極大値 $\\frac{23}{16}$ を 8 で割った値です。端の $t=1$ で $|f|=3$ の方が大きくなります。', 2: '8 で割るのを忘れています。', 3: 'それは $t=\\frac12$ での値 $\\frac{1/4}{8}$。最大ではなく、最小でもありません。' },
        good: '$|f(t)|$ は $t=1$ で最大 3。つまり $L$ の最大は $\\frac38$（これは $\\frac{f(1)}{8}=(1-\\alpha)(1-\\beta)(1-\\gamma)$ でもあります）。区間の中に解があるので、最小は 0 です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '0\\le L\\le\\frac38' }],
        draw: [{ fig: 'z2', items: [{ k: 'fn', f: 'abs(' + F + ')', a: -0.25, b: 1, c: 'p', dash: true, label: 'y=|f(x)|', lat: [-0.55, 0.6], la: 'start' }] }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '別の見方です。数学Ⅲの「対数微分」を使うと、$\\sum\\frac{1}{x-\\alpha}$ が一気に出ます。$x=-1$ を入れれば、(3) の検算になります。',
        add: [{ t: 'h', text: '別の見方：対数微分で検算' },
          { t: 'm', tex: "\\log|f(x)|=\\log8+\\log|x-\\alpha|+\\log|x-\\beta|+\\log|x-\\gamma|" },
          { t: 'm', tex: "\\frac{f'(x)}{f(x)}=\\frac{1}{x-\\alpha}+\\frac{1}{x-\\beta}+\\frac{1}{x-\\gamma}", note: '両辺を微分' },
          { t: 'm', tex: "x=-1:\\quad \\frac{f'(-1)}{f(-1)}=\\frac{24+6-3}{-7}=-\\frac{27}{7}", note: '$\\sum\\frac{1}{-1-\\alpha}$、符号を変えて $\\frac{27}{7}$' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(1) は「単調な区間」と「端の符号」の両方を書く（ただ1つの根拠）\n・(3) は $|\\alpha|<1$ などを (1) から引用して、収束を先に述べる。$x=-1$ の代入は符号に注意\n・(4) は絶対値を忘れない。最大は極大値ではなく端 $t=1$ で' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。解が求まらなくても、グラフ・解と係数の関係・「$x$ に数を入れる」技で、解についての多くのことがわかります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
