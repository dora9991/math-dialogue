/* 長崎大型 数学（理系）：2026年度 長崎大学 前期 医学部医学科 第10問の類題（自作問題・元の問題ではない）
   問題：f(x)=9x³−9x²+1（有理数の解はない）
   答え（python3・sympy で検算ずみ）：
     (1) f'(x)=9x(3x−2)、極大値 f(0)=1、極小値 f(2/3)=−1/3。f(−1)=−17<0、f(1)=1>0 より、解は (−1,0)・(0,2/3)・(2/3,1) に1つずつ
         （数値：α≈−0.2931、β≈0.4491、γ≈0.8440）
     (2) α+β+γ=1、αβ+βγ+γα=0、αβγ=−1/9、α²+β²+γ²=1、α³+β³+γ³=2/3
     (3) Σp_n=Σα/(1−α)=Σ1/(1−α)−3。(1−α)(1−β)(1−γ)=f(1)/9=1/9、Σ(1−β)(1−γ)=3−2+0=1 → Σ1/(1−α)=9 → 和は 6
         （f'(1)/f(1)=9 でも一致。部分和 n≦400 の数値も 6）
     (4) L=|f(t)|/9。−1/3≦t≦1 で f(−1/3)=−1/3、f(0)=1、f(2/3)=−1/3、f(1)=1 → 0≦L≦1/9 */
(function () {
  const F = '9*x**3-9*x**2+1', al = -0.29313, be = 0.44910, ga = 0.84403;
  const big = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.2, -1.25, 1.3, 1.65], w: 560, h: 420, items: [
    { k: 'axes', tx: [[-1, '−1'], [2 / 3, '2/3'], [1, '1']], ty: [[1, '1']] },
    { k: 'fn', f: F, a: -0.62, b: 1.17, label: 'y=f(x)', lat: [0.55, 1.35] },
    { k: 'line', x: -1, dash: true, c: 'd' }, { k: 'line', x: 1, dash: true, c: 'd' }
  ].concat(extra || []) });
  const roots = [{ k: 'pt', at: [al, 0], name: 'α', dir: 'sw', c: 'p', size: 24 }, { k: 'pt', at: [be, 0], name: 'β', dir: 'ne', c: 'p', size: 24 }, { k: 'pt', at: [ga, 0], name: 'γ', dir: 'nw', c: 'p', size: 24 }];
  const zoom = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.6, -0.72, 1.3, 1.42], w: 560, h: 410, items: [
    { k: 'axes', tx: [[-1 / 3, '−1/3'], [2 / 3, '2/3'], [1, '1']], ty: [[1, '1']] },
    { k: 'fn', f: F, a: -0.47, b: 1.06, label: 'y=f(x)', lat: [0.72, 1.3], la: 'end' }
  ].concat(extra || []) });
  const POINTS = [
    '解が具体的に求まらない3次方程式は、**増減表＋区間の端の値の符号**で、解の個数と範囲を示す',
    '対称式は解と係数の関係で。$f(x)=9(x-\\alpha)(x-\\beta)(x-\\gamma)$ に $x=1$ を入れると $(1-\\alpha)(1-\\beta)(1-\\gamma)$ が出る',
    '$|r|<1$ を確かめてから無限等比級数。距離の積は $|f(t)|$ の定数倍とみて、関数の値の範囲に読みかえる'
  ];

  HB.lesson({
    id: 'nagasaki26-10', field: '長崎大型　数学（理系）', title: '2026 長崎大 理系 第10問の類題 ― 3次方程式の解の対称式と無限級数・距離の積', level: '2026年度 長崎大学 理系 第10問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$f(x)=9x^3-9x^2+1$ とする。',
      parts: [
        '(1)　関数 $f(x)$ の極値を求めよ。また，方程式 $f(x)=0$ は異なる3つの実数解をもち，それらはすべて $-1<x<1$ の範囲にあることを示せ。',
        '(2)　(1) の3つの解を $\\alpha,\\ \\beta,\\ \\gamma\\ (\\alpha<\\beta<\\gamma)$ とする。$\\alpha+\\beta+\\gamma$，$\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha$，$\\alpha\\beta\\gamma$ の値と，$\\alpha^2+\\beta^2+\\gamma^2$，$\\alpha^3+\\beta^3+\\gamma^3$ の値を求めよ。',
        '(3)　$p_n=\\alpha^n+\\beta^n+\\gamma^n\\ (n=1,\\,2,\\,3,\\,\\cdots)$ とする。無限級数 $\\displaystyle\\sum_{n=1}^{\\infty}p_n$ は収束することを示し，その和を求めよ。',
        '(4)　座標平面上に3点 $\\mathrm{A}(\\alpha,\\,0)$，$\\mathrm{B}(\\beta,\\,0)$，$\\mathrm{C}(\\gamma,\\,0)$ をとる。点 $\\mathrm{P}(t,\\,0)$ が $-\\dfrac13\\le t\\le1$ の範囲を動くとき，積 $L=\\mathrm{PA}\\cdot\\mathrm{PB}\\cdot\\mathrm{PC}$ のとりうる値の範囲を求めよ。'
      ],
      src: '※ 2026年度 長崎大学 前期 医学部医学科 第10問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '3次方程式の解を、微分・解と係数の関係・無限級数の3つの道具で調べる問題です。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.5' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: 'この方程式は、有理数の解をもちません（$\\pm1,\\ \\pm\\frac13,\\ \\pm\\frac19$ を入れても 0 にならない）。解を求めずに、解の性質を調べるのがこの問題のテーマです。',
        add: [{ t: 'h', text: '解を求めずに、解の性質を調べる' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', '知りたいこと', '道具'],
            ['(1)', '解の個数と、およその位置', '増減表と、区間の端の値の符号'],
            ['(2)', '解の対称式の値', '解と係数の関係'],
            ['(3)', '$\\sum p_n$ の和', '$|\\alpha|<1$ などから無限等比級数 → (2) の値'],
            ['(4)', '距離の積の範囲', '$\\mathrm{PA}\\cdot\\mathrm{PB}\\cdot\\mathrm{PC}$ を $|f(t)|$ で表す']] },
          { t: 'p', size: 'sm', text: '(1) の「$-1<x<1$」が (3) の収束の根拠になります。前の小問の結果を、どこで使うかを意識しましょう。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: "(1) です。$f'(x)=27x^2-18x=9x(3x-2)$。$x=0$ で極大、$x=\\frac23$ で極小です。",
        add: [{ t: 'h', text: '(1)　極値と解の位置' },
          { t: 'm', tex: "f'(x)=27x^2-18x=9x(3x-2)" },
          { t: 'm', tex: '\\text{極大値}\\ f(0)=1' }, big('f1')] },
      { ask: { type: 'choice', q: '極小値 $f\\big(\\frac23\\big)$ は？',
        opts: ['$\\dfrac13$', '$-\\dfrac43$', '$-\\dfrac13$', '$1$'], ok: 2,
        why: { 0: '$\\frac83-4=-\\frac43$、これに 1 を足して $-\\frac13$。符号がちがいます。', 1: '最後の $+1$ を足し忘れています。', 3: 'それは極大値 $f(0)$ です。' },
        good: '$9\\cdot\\frac{8}{27}-9\\cdot\\frac49+1=\\frac83-4+1=-\\frac13$。極大値は正、極小値は負です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$\\cdots$', '$0$', '$\\cdots$', '$\\frac23$', '$\\cdots$'], ["$f'(x)$", '$+$', '$0$', '$-$', '$0$', '$+$'], ['$f(x)$', '↗', '$1$', '↘', '$-\\frac13$', '↗']] }],
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: [0, 1], c: 'y' }, { k: 'pt', at: [2 / 3, -1 / 3], c: 'y' }] }] } },
      { ask: { type: 'choice', q: '3つの解が $-1<x<1$ にあることを示すには、極値に加えて何を調べる？',
        opts: ['$f(-1)<0$ と $f(1)>0$', '$f(0)>0$ だけ', '$f(-1)>0$ と $f(1)<0$', "$f'(-1)$ と $f'(1)$ の符号"], ok: 0,
        why: { 1: '$f(0)$ は極大値で、もう調べました。$-1$ より左に解がないことは言えません。', 2: '実際は $f(-1)=-17$、$f(1)=1$。$x^3$ の係数が正なので、左の端は負、右の端は正です。', 3: '微分係数の符号では、解がどこにあるかはわかりません。' },
        good: '$f(-1)=-17<0<f(0)$、$f(0)>0>f\\big(\\frac23\\big)$、$f\\big(\\frac23\\big)<0<f(1)=1$。3つの区間に1つずつ解があります。',
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: [1, 1], c: 'g' }].concat(roots) }] } },
      { clear: true, cols: [1], say: '答案の書き方です。「単調な区間で、両はしの符号がちがう → ちょうど1つ」を3回くり返し、最後に「合わせて3つ」とまとめます。',
        add: [{ t: 'h', text: '(1)　答案' },
          { t: 'box', c: 'y', size: 'sm', label: '答案の形', text: '$f(x)$ は $-1\\le x\\le0$ で増加し、$f(-1)=-17<0,\\ f(0)=1>0$ だから、$-1<x<0$ にただ1つの解をもつ。\n$0\\le x\\le\\frac23$ で減少し、$f(0)>0,\\ f\\big(\\frac23\\big)=-\\frac13<0$ だから、$0<x<\\frac23$ にただ1つの解をもつ。\n$\\frac23\\le x\\le1$ で増加し、$f\\big(\\frac23\\big)<0,\\ f(1)=1>0$ だから、$\\frac23<x<1$ にただ1つの解をもつ。\n3次方程式の解は3つまでなので、これで全部。よって、異なる3つの実数解はすべて $-1<x<1$ にある。' },
          { t: 'ans', label: '(1) 答', text: '極大値 $1$（$x=0$）、極小値 $-\\dfrac13$（$x=\\dfrac23$）' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$9x^3-9x^2+0\\cdot x+1=0$ の解と係数の関係。$x$ の項がないので、2つずつの積の和は 0 です。',
        add: [{ t: 'h', text: '(2)　対称式の値' },
          { t: 'm', tex: '\\alpha+\\beta+\\gamma=-\\frac{-9}{9}=1' }, { t: 'm', tex: '\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha=\\frac09=0' }] },
      { ask: { type: 'choice', q: '$\\alpha\\beta\\gamma$ は？',
        opts: ['$\\dfrac19$', '$-1$', '$1$', '$-\\dfrac19$'], ok: 3,
        why: { 0: '$ax^3+bx^2+cx+d=0$ の3つの解の積は $-\\dfrac da$。マイナスがつきます。', 1: '$x^3$ の係数 9 で割ります。', 2: '定数項の符号を変え、さらに 9 で割ります。' },
        good: '$\\alpha\\beta\\gamma=-\\dfrac19$。(1) で解は負が1つ、正が2つなので、積が負なのは合っています。',
        add: [{ t: 'm', tex: '\\alpha\\beta\\gamma=-\\frac19' }] } },
      { say: '2乗の和は「和の2乗 − 2×（2つずつの積の和）」で $1^2-2\\cdot0=1$。3乗の和は、方程式そのものを使うと速く求まります。',
        add: [{ t: 'm', tex: '\\alpha^2+\\beta^2+\\gamma^2=1^2-2\\cdot0=1' },
          { t: 'box', c: 'g', col: 1, size: 'sm', label: '方程式を使う', text: '$f(\\alpha)=0$ より $9\\alpha^3=9\\alpha^2-1$、つまり $\\alpha^3=\\alpha^2-\\dfrac19$（$\\beta,\\ \\gamma$ も同じ）' }] },
      { ask: { type: 'think', q: '$\\alpha^3+\\beta^3+\\gamma^3$ を求めよう。',
        hint: '$\\alpha^3=\\alpha^2-\\frac19$ を3つ足す。',
        ans: '$\\alpha^3+\\beta^3+\\gamma^3=(\\alpha^2+\\beta^2+\\gamma^2)-\\dfrac39=1-\\dfrac13=\\dfrac23$',
        after: '公式 $(\\alpha+\\beta+\\gamma)^3-3(\\alpha+\\beta+\\gamma)(\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha)+3\\alpha\\beta\\gamma=1-0-\\frac13$ でも同じです。',
        add: [{ t: 'ans', col: 1, label: '(2) 答', text: '$\\alpha+\\beta+\\gamma=1$、$\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha=0$、$\\alpha\\beta\\gamma=-\\dfrac19$\n$\\alpha^2+\\beta^2+\\gamma^2=1$、$\\alpha^3+\\beta^3+\\gamma^3=\\dfrac23$' }] } },

      // ---------- (3) ----------
      { clear: true, cols: [1], part: '(3)', say: '(3) です。(1) から $|\\alpha|,\\ |\\beta|,\\ |\\gamma|<1$。だから3つの無限等比級数はどれも収束し、その和として $\\sum p_n$ も収束します。',
        add: [{ t: 'h', text: '(3)　無限級数の和' },
          { t: 'm', tex: '\\sum_{n=1}^{\\infty}\\alpha^n=\\frac{\\alpha}{1-\\alpha}=\\frac{1}{1-\\alpha}-1\\qquad(|\\alpha|<1\\ \\text{より収束})', note: '初項 $\\alpha$、公比 $\\alpha$' },
          { t: 'm', tex: '\\sum_{n=1}^{\\infty}p_n=\\frac{1}{1-\\alpha}+\\frac{1}{1-\\beta}+\\frac{1}{1-\\gamma}-3' }] },
      { ask: { type: 'choice', q: '$f(x)=9(x-\\alpha)(x-\\beta)(x-\\gamma)$ を使うと、$(1-\\alpha)(1-\\beta)(1-\\gamma)$ は？',
        opts: ['$1$', '$\\dfrac19$', '$9$', '$-\\dfrac19$'], ok: 1,
        why: { 0: '$f(1)=1$ ですが、$f(1)=9(1-\\alpha)(1-\\beta)(1-\\gamma)$ なので 9 で割ります。', 2: '9 をかけるのではなく、9 で割ります。', 3: '$x=1$ を入れると $(1-\\alpha)$ の形がそのまま出ます。符号は変わりません。' },
        good: '$x=1$ を代入：$f(1)=9(1-\\alpha)(1-\\beta)(1-\\gamma)=1$。この「$x$ に数を入れる」技は、$(k-\\alpha)(k-\\beta)(k-\\gamma)$ 型でいつも使えます。',
        add: [{ t: 'm', tex: '(1-\\alpha)(1-\\beta)(1-\\gamma)=\\frac{f(1)}{9}=\\frac19' }] } },
      { ask: { type: 'think', q: '$\\dfrac{1}{1-\\alpha}+\\dfrac{1}{1-\\beta}+\\dfrac{1}{1-\\gamma}$ を求め、$\\sum p_n$ の和を出そう。',
        hint: '通分すると、分子は $(1-\\beta)(1-\\gamma)+(1-\\gamma)(1-\\alpha)+(1-\\alpha)(1-\\beta)$。展開して (2) の値を入れる。',
        ans: '分子 $=3-2(\\alpha+\\beta+\\gamma)+(\\alpha\\beta+\\beta\\gamma+\\gamma\\alpha)=3-2+0=1$。和は $\\dfrac{1}{1/9}=9$ なので、$\\displaystyle\\sum_{n=1}^{\\infty}p_n=9-3=6$',
        after: '数値でも確かめられます：$p_1=1,\\ p_2=1,\\ p_3=\\frac23,\\ \\cdots$ と足していくと 6 に近づきます。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\sum_{n=1}^{\\infty}p_n=6' }] } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。P と A の距離は $|t-\\alpha|$。3つの距離の積は、$(t-\\alpha)(t-\\beta)(t-\\gamma)$ の絶対値です。これを $f(t)$ で表します。',
        add: [{ t: 'h', text: '(4)　距離の積' },
          { t: 'm', tex: 'L=|t-\\alpha|\\,|t-\\beta|\\,|t-\\gamma|=|(t-\\alpha)(t-\\beta)(t-\\gamma)|' },
          zoom('z1', [{ k: 'seg', a: [-1 / 3, 0], b: [1, 0], c: 'y', wd: 6 }].concat(roots, [{ k: 'pt', at: [0.15, 0], name: 'P', dir: 's', c: 'g' }]))] },
      { ask: { type: 'choice', q: '$L$ を $f(t)$ で表すと？',
        opts: ['$\\dfrac{f(t)}{9}$', '$9\\,|f(t)|$', '$\\dfrac{|f(t)|}{9}$', '$|f(t)|$'], ok: 2,
        why: { 0: '$t$ が $\\alpha$ と $\\beta$ の間などでは $f(t)<0$。距離の積は負になりません。絶対値が必要です。', 1: '$f(t)=9(t-\\alpha)(t-\\beta)(t-\\gamma)$ なので、9 で割ります。', 3: '$x^3$ の係数 9 を忘れています。' },
        good: '$L=\\dfrac{|f(t)|}{9}$。距離の積の範囲は、$-\\frac13\\le t\\le1$ での $|f(t)|$ の範囲に読みかえられます。',
        add: [{ t: 'm', tex: 'L=\\frac{|f(t)|}{9}' }] } },
      { clear: true, say: '$-\\frac13\\le t\\le1$ での $f(t)$ の範囲を、端と極値の値で調べます。端の値と極値が、ちょうど同じ高さにそろっています。',
        add: [{ t: 'h', text: '(4)　f(t) の範囲' },
          { t: 'tbl', size: 'sm', rows: [['$t$', '$-\\frac13$', '$0$', '$\\frac23$', '$1$'], ['$f(t)$', '$-\\frac13$', '$1$（極大）', '$-\\frac13$（極小）', '$1$']] },
          { t: 'm', tex: '-\\frac13\\le f(t)\\le1', note: '$-\\frac13\\le t\\le1$ で' },
          zoom('z2', [{ k: 'line', m: 0, n: 1, c: 'b', dash: true }, { k: 'line', m: 0, n: -1 / 3, c: 'b', dash: true },
            { k: 'seg', a: [-1 / 3, 0], b: [1, 0], c: 'y', wd: 6 },
            { k: 'pt', at: [-1 / 3, -1 / 3], c: 'y' }, { k: 'pt', at: [0, 1], c: 'y' }, { k: 'pt', at: [2 / 3, -1 / 3], c: 'y' }, { k: 'pt', at: [1, 1], c: 'y' }])] },
      { ask: { type: 'choice', q: '$L=\\dfrac{|f(t)|}{9}$ の最大値は？',
        opts: ['$\\dfrac{1}{27}$', '$\\dfrac19$', '$\\dfrac{17}{9}$', '$1$'], ok: 1,
        why: { 0: '$|f(t)|$ の最大は $\\frac13$ ではなく 1。絶対値をとると $-\\frac13$ は $\\frac13$ で、1 より小さいです。', 2: '$t=-1$ の値 $|f(-1)|=17$ を使っています。$t$ の範囲は $-\\frac13$ からです。', 3: '9 で割るのを忘れています。' },
        good: '$|f(t)|$ は $t=0,\\ 1$ で最大 1。また区間の中に解 $\\alpha,\\ \\beta,\\ \\gamma$ があるので、最小は 0 です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '0\\le L\\le\\frac19' }],
        draw: [{ fig: 'z2', items: [{ k: 'fn', f: 'abs(' + F + ')', a: -1 / 3, b: 1, c: 'p', dash: true, label: 'y=|f(x)|', lat: [0.67, 0.55], la: 'middle' }] }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '別の見方です。数学Ⅲの「対数微分」を使うと、(3) の $\\sum\\frac{1}{1-\\alpha}$ が一気に出ます。検算に便利です。',
        add: [{ t: 'h', text: '別の見方：対数微分で検算' },
          { t: 'm', tex: "\\log|f(x)|=\\log9+\\log|x-\\alpha|+\\log|x-\\beta|+\\log|x-\\gamma|" },
          { t: 'm', tex: "\\frac{f'(x)}{f(x)}=\\frac{1}{x-\\alpha}+\\frac{1}{x-\\beta}+\\frac{1}{x-\\gamma}", note: '両辺を微分' },
          { t: 'm', tex: "x=1:\\quad \\frac{f'(1)}{f(1)}=\\frac{27-18}{1}=9", note: '(3) の 9 と一致' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(1) は「単調な区間」と「端の符号」の両方を書く（ただ1つの根拠）\n・(3) は $|\\alpha|<1$ などを (1) から引用して、収束を先に述べる\n・(4) は絶対値を忘れない。最小値 0 は「区間の中に解がある」ことから' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。解が求まらなくても、グラフ・解と係数の関係・「$x$ に数を入れる」技で、解についての多くのことがわかります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
