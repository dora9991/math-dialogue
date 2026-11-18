/* 2024 九大 理系 第1問の類題（自作）：文字 t で動く空間の3点と、三角形の面積の最大値
   問題：−1≦t≦1、A(t², −t, 0)、B(1, t, 2)、C(2, 0, 1)。(1) 3点は一直線上にない (2) △ABC の面積 S の最大値
   答え（python3・sympy で検算ずみ）：
   AB=(1−t², 2t, 2)、AC=(2−t², t, 1)。一直線 ⇔ AC=kAB ⇔ k=1/2, t²=3（|t|≦1 に反する）
   s=t² とおくと |AB|²=s²+2s+5、|AC|²=s²−3s+5、AB・AC=s²−s+4
   |AB|²|AC|²−(AB・AC)²=s³−5s²+3s+9=(s+1)(s−3)²、微分 (s−3)(3s−1)
   最大は s=1/3（t=±√3/3）で 256/27、S=8√3/9≒1.540（端は S(0)=3/2、S(1)=√2）
   別の見方：AB−2AC=(t²−3, 0, 0) */
(function () {
  const f = s => (s + 1) * (s - 3) * (s - 3);
  const graph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.2, -1.4, 4.4, 11.2], w: 540, h: 400, items: [
    { k: 'axes', tx: [[1, '1'], [3, '3']], ty: [[8, '8'], [9, '9']], xl: 's', yl: 'y' },
    { k: 'fn', f: '(x+1)*(x-3)**2', a: -1.05, b: 4.25, c: 'd', wd: 2 },
    { k: 'fn', f: '(x+1)*(x-3)**2', a: 0, b: 1, c: 'y', wd: 5 },
    { k: 'seg', a: [0, 0], b: [1, 0], c: 'y', wd: 6 }
  ].concat(extra || []) });
  const POINTS = [
    '一直線上 ⇔ $\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$。背理法で $k$ を決めると、条件に反する $t$ の値が出てくる',
    '面積は $S=\\dfrac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$。$t$ が2乗でしか出てこないので、$s=t^2$ とおいて次数を下げる',
    '根号の中は「一直線になる $s=3$」で 0 になる → $(s-3)^2$ で割れる。因数分解してから微分すると増減がすぐ分かる'
  ];

  HB.lesson({
    id: 'kyushu24-1', field: '九大型　数学（理系）', title: '2024 九大 理系 第1問の類題 ― 文字で動く空間の三角形の面積の最大', level: '2024年度 九州大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '実数 $t$ は $-1\\le t\\le1$ をみたすとする。座標空間に 3 点 $\\mathrm{A}(t^2,\\ -t,\\ 0)$、$\\mathrm{B}(1,\\ t,\\ 2)$、$\\mathrm{C}(2,\\ 0,\\ 1)$ をとる。',
      parts: [
        '(1)　3 点 A，B，C は一直線上にないことを示せ。',
        '(2)　$\\triangle\\mathrm{ABC}$ の面積を $S$ とする。$t$ が $-1\\le t\\le1$ の範囲を動くときの $S$ の最大値と、そのときの $t$ の値を求めよ。'
      ],
      src: '※ 2024年度 九州大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '文字 $t$ で位置が決まる空間の3点について、(1) 一直線上にないこと、(2) 三角形の面積の最大値を求めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '空間の三角形は、A を始点にした2つのベクトルで調べるのが基本です。まず $\\overrightarrow{\\mathrm{AB}}$ と $\\overrightarrow{\\mathrm{AC}}$ を成分で出します。',
        add: [{ t: 'h', text: '方針：A を始点にした2つのベクトル' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}=(1-t^2,\\ 2t,\\ 2)' }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AC}}$ の成分は？',
        opts: ['$(t^2-2,\\ -t,\\ -1)$', '$(2-t^2,\\ -t,\\ 1)$', '$(2-t^2,\\ t,\\ 1)$', '$(2+t^2,\\ t,\\ 1)$'], ok: 2,
        why: { 0: '「A − C」になっています。$\\overrightarrow{\\mathrm{AC}}$ は「終点 C − 始点 A」です。', 1: '$y$ 成分は $0-(-t)=t$。マイナスを引くので $+t$ です。', 3: '$x$ 成分は $2-t^2$。A の $x$ 座標 $t^2$ を引きます。' },
        good: '「終点 − 始点」で $(2-t^2,\\ 0-(-t),\\ 1-0)=(2-t^2,\\ t,\\ 1)$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AC}}=(2-t^2,\\ t,\\ 1)' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　一直線上 ⇔ $\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$。背理法で矛盾を出す\n(2)　面積の公式（内積の形）を $t$ の式に。$t^2=s$ とおいて微分' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) は背理法です。「一直線上にある」と仮定して、矛盾を導きます。$\\overrightarrow{\\mathrm{AB}}$ は $z$ 成分が 2 なので $\\vec 0$ ではありません。',
        add: [{ t: 'h', text: '(1)　一直線上にないことの証明' },
          { t: 'p', size: 'sm', text: '3 点が一直線上にあると仮定する。\n$\\overrightarrow{\\mathrm{AB}}\\ne\\vec 0$（$z$ 成分が 2）なので、実数 $k$ を用いて' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}', note: '…①' },
          { t: 'm', size: 'sm', tex: '(2-t^2,\\ t,\\ 1)=k(1-t^2,\\ 2t,\\ 2)' }] },
      { ask: { type: 'choice', q: '成分を比べるとき、まずどの成分から $k$ を決めるのがよい？',
        opts: ['$z$ 成分：$1=2k$ より $k=\\dfrac12$', '$x$ 成分：$k=\\dfrac{2-t^2}{1-t^2}$', '$y$ 成分：$t=2kt$ より $k=\\dfrac12$', 'どれからでも同じ手間'], ok: 0,
        why: { 1: '$1-t^2=0$（$t=\\pm1$）のとき割れません。場合分けが増えます。', 2: '$t=0$ のとき両辺 0 で、$k$ が決まりません。', 3: '$t$ をふくまない $z$ 成分なら、場合分けなしで $k$ が決まります。' },
        good: '$z$ 成分は $t$ をふくまないので、$k=\\frac12$ がすぐ決まります。',
        add: [{ t: 'm', tex: 'z\\ \\text{成分}：1=2k\\quad\\therefore\\ k=\\frac12' }] } },
      { say: '$k=\\frac12$ を $x$ 成分に入れると $2-t^2=\\frac12(1-t^2)$、つまり $t^2=3$。ところが $-1\\le t\\le1$ なので $t^2\\le1$。矛盾です。',
        add: [{ t: 'm', tex: 'x\\ \\text{成分}：2-t^2=\\frac12(1-t^2)\\quad\\therefore\\ t^2=3' },
          { t: 'ans', col: 1, label: '(1)', text: '$-1\\le t\\le1$ より $t^2\\le1$ なので、$t^2=3$ は矛盾。\nよって 3 点 A，B，C は一直線上にない。' }] },
      { ask: { type: 'choice', q: 'もし $t$ の範囲の条件がなく、$t=\\sqrt3$ だったら、3 点はどうなる？',
        opts: ['A と B が同じ点になる', 'A が線分 BC の中点になる', '一直線上にない', 'C が線分 AB の中点になる'], ok: 3,
        why: { 0: '$\\overrightarrow{\\mathrm{AB}}$ の $z$ 成分は 2 なので、A と B は重なりません。', 1: '① は $\\overrightarrow{\\mathrm{AC}}=\\frac12\\overrightarrow{\\mathrm{AB}}$。A から B へ半分進んだ点が C です。', 2: '$t^2=3$ なら ① が $k=\\frac12$ で成り立つので、一直線上にあります。' },
        good: '$t^2=3$ なら $\\overrightarrow{\\mathrm{AC}}=\\frac12\\overrightarrow{\\mathrm{AB}}$。C は線分 AB の中点です。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: 'メモ', text: '$t^2=3$ のときだけ一直線（C が AB の中点）。\n(2) で、このことが役に立ちます。' }] } },

      // ---------- (2) 面積の式 ----------
      { clear: true, part: '(2)', say: '(2) です。2つのベクトルが作る三角形の面積は、内積を使った公式で表せます。',
        add: [{ t: 'h', text: '(2)　面積を t の式で表す' }] },
      { ask: { type: 'choice', q: '$\\vec a=\\overrightarrow{\\mathrm{AB}},\\ \\vec b=\\overrightarrow{\\mathrm{AC}}$ とするとき、$\\triangle\\mathrm{ABC}$ の面積 $S$ は？',
        opts: ['$\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$', '$\\dfrac12\\left(|\\vec a||\\vec b|-\\vec a\\cdot\\vec b\\right)$', '$\\dfrac12\\sqrt{|\\vec a|^2|\\vec b|^2+(\\vec a\\cdot\\vec b)^2}$', '$\\dfrac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$'], ok: 3,
        why: { 0: 'それは平行四辺形の面積。三角形はその $\\frac12$ です。', 1: '$\\frac12|\\vec a||\\vec b|\\sin\\theta$ の $\\sin\\theta$ を、$1-\\cos\\theta$ とまちがえた形です。', 2: '$\\sin^2\\theta=1-\\cos^2\\theta$ なので、内積の2乗は引きます。' },
        good: '$S=\\frac12|\\vec a||\\vec b|\\sin\\theta$ に $\\sin\\theta=\\sqrt{1-\\cos^2\\theta}$ を入れた形です。',
        add: [{ t: 'm', tex: 'S=\\frac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}' }] } },
      { say: '成分を見ると、$t$ は $t^2$ と、$y$ 成分の $2t,\\ t$ にだけ出てきます。大きさや内積では $t$ が2乗になるので、$s=t^2$（$0\\le s\\le1$）とおきます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'おきかえ', text: '$s=t^2$　とおく。$-1\\le t\\le1$ より　$0\\le s\\le1$' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2=(1-s)^2+4s+4=s^2+2s+5' },
          { t: 'm', size: 'sm', tex: '|\\vec b|^2=(2-s)^2+s+1=s^2-3s+5' }] },
      { ask: { type: 'choice', q: '内積 $\\vec a\\cdot\\vec b=(1-t^2)(2-t^2)+2t\\cdot t+2\\cdot1$ を $s$ で表すと？',
        opts: ['$s^2-s+4$', '$s^2-3s+2$', '$s^2+s+4$', '$s^2-s+2$'], ok: 0,
        why: { 1: '$x$ 成分の積だけです。$y$ 成分の $2s$ と $z$ 成分の $2$ も足します。', 2: '$(1-s)(2-s)=s^2-3s+2$。これに $2s$ を足すので、$s$ の係数は $-1$。', 3: '$z$ 成分の積 $2\\cdot1=2$ を足し忘れています。' },
        good: '$(s^2-3s+2)+2s+2=s^2-s+4$。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec a\\cdot\\vec b=(1-s)(2-s)+2s+2=s^2-s+4' }] } },

      // ---------- (2) 根号の中を計算 ----------
      { clear: true, cols: [0.6, 0.4], say: '根号の中 $D=|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2$ を計算します。そのまま展開すると4次式どうしの引き算。**$X=s^2+5$ とまとめる** と楽になります。',
        add: [{ t: 'h', text: '(2)　根号の中を工夫して計算' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2=X+2s,\\quad |\\vec b|^2=X-3s,\\quad \\vec a\\cdot\\vec b=X-(s+1)', note: '$X=s^2+5$' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}D&=(X+2s)(X-3s)-\\{X-(s+1)\\}^2\\\\ &=(s+2)X-6s^2-(s+1)^2\\end{aligned}' },
          { t: 'm', size: 'sm', tex: '=(s+2)(s^2+5)-7s^2-2s-1=s^3-5s^2+3s+9' }] },
      { ask: { type: 'think', q: '$D=s^3-5s^2+3s+9$ を因数分解しよう。（ヒントは (1) の結果）',
        hint: '一直線になるのは $t^2=3$、つまり $s=3$ のとき。そのとき面積は 0 なので、$D(3)=0$ のはず。',
        ans: '$D=(s-3)(s^2-2s-3)=(s+1)(s-3)^2$',
        after: '$D\\ge0$ で、$s=3$ で 0 になるので、$s=3$ は重解になります（グラフが $s$ 軸にふれる）。',
        add: [{ t: 'm', tex: 'D=(s+1)(s-3)^2', note: '$s=3$ は重解' }] } },
      { say: 'よって $S=\\dfrac12\\sqrt{(s+1)(s-3)^2}$。$S$ が最大になるのは、根号の中 $f(s)=(s+1)(s-3)^2$ が最大になるときです。',
        add: [{ t: 'm', tex: 'S=\\frac12\\sqrt{f(s)},\\qquad f(s)=(s+1)(s-3)^2' },
          graph('g1', [{ k: 'pt', at: [3, 0], c: 'g', name: 's=3（一直線）', dir: 'ne', size: 19 }])] },

      // ---------- (2) 増減 ----------
      { clear: true, cols: [0.56, 0.44], say: '積の微分で $f\'(s)$ を求めます。共通因数 $(s-3)$ をくくり出すと、すぐ因数分解できます。',
        add: [{ t: 'h', text: '(2)　f(s) の増減（0 ≦ s ≦ 1）' },
          { t: 'm', size: 'sm', tex: "\\begin{aligned}f'(s)&=(s-3)^2+2(s+1)(s-3)\\\\ &=(s-3)(3s-1)\\end{aligned}" },
          graph('g2')] },
      { ask: { type: 'choice', q: '$0\\le s\\le1$ で $f(s)$ が最大になるのは？',
        opts: ['$s=3$', '$s=\\dfrac13$', '$s=0$', '$s=1$'], ok: 1,
        why: { 0: '$s=3$ は範囲の外で、しかも $f(3)=0$（最小）です。', 2: '$f(0)=9$ ですが、$s=\\frac13$ まで増え続けます。', 3: '$f(1)=8$。$s=\\frac13$ から先は減っています。' },
        good: '$0\\le s<\\frac13$ で $f\'>0$（増加）、$\\frac13<s\\le1$ で $f\'<0$（減少）。最大は $s=\\frac13$。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$s$', '$0$', '$\\cdots$', '$\\frac13$', '$\\cdots$', '$1$'], ["$f'(s)$", '', '$+$', '$0$', '$-$', ''], ['$f(s)$', '$9$', '$\\nearrow$', '{{$\\frac{256}{27}$}}', '$\\searrow$', '$8$']] }],
        draw: [{ fig: 'g2', items: [{ k: 'pt', at: [1 / 3, f(1 / 3)], c: 'p', name: 's=1/3 で最大', dir: 'ne', size: 20 }, { k: 'line', x: 1 / 3, dash: true, c: 'p' }] }] } },
      { say: '$f\\left(\\frac13\\right)=\\frac43\\cdot\\frac{64}{9}=\\frac{256}{27}$。$S=\\frac12\\sqrt{\\frac{256}{27}}=\\frac12\\cdot\\frac{16}{3\\sqrt3}$ で、$s=\\frac13$ は $t=\\pm\\frac{\\sqrt3}{3}$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\frac12\\cdot\\frac{16}{3\\sqrt3}=\\frac{8}{3\\sqrt3}=\\frac{8\\sqrt3}{9}' },
          { t: 'ans', label: '(2) 答', text: '$t=\\pm\\dfrac{\\sqrt3}{3}$ のとき、最大値 $S=\\dfrac{8\\sqrt3}{9}$' }] },
      { say: '検算：端では $S(0)=\\frac12\\sqrt9=\\frac32=1.5$、$S(1)=\\frac12\\sqrt8=\\sqrt2\\approx1.41$。最大値 $\\frac{8\\sqrt3}{9}\\approx1.54$ は、$t=0$ のときより少しだけ大きい。微分しないと見落とす差です。',
        add: [{ t: 'p', size: 'sm', text: '$t=0$：$S=1.5$　　$t=\\pm1$：$S\\approx1.41$\n$t=\\pm\\frac{\\sqrt3}{3}$：$S\\approx1.54$（最大）' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: 'なぜ $(s-3)^2$ が出てきたのか。$\\overrightarrow{\\mathrm{AB}}-2\\overrightarrow{\\mathrm{AC}}$ を計算すると、$y,\\ z$ 成分が消えます。',
        add: [{ t: 'h', text: '別の見方：AB − 2AC がかんたんになる' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}-2\\overrightarrow{\\mathrm{AC}}=(1-t^2-4+2t^2,\\ 2t-2t,\\ 2-2)=(t^2-3,\\ 0,\\ 0)' },
          { t: 'p', size: 'sm', text: '$\\vec b=\\overrightarrow{\\mathrm{AC}}$、$\\vec c=\\overrightarrow{\\mathrm{AB}}-2\\overrightarrow{\\mathrm{AC}}$ とおくと、$\\vec a=2\\vec b+\\vec c$。\n$\\vec b$ と $\\vec a$ が作る三角形は、$\\vec b$ と $\\vec c$ が作る三角形と面積が同じ（底辺 $\\vec b$ が共通で、$\\vec a-\\vec c=2\\vec b$ は底辺に平行なので高さも同じ）。' },
          { t: 'm', size: 'sm', tex: '|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2=(3-s)^2\\{(2-s)^2+s+1\\}-(2-s)^2(3-s)^2=(3-s)^2(s+1)' }] },
      { ask: { type: 'think', q: '微分を使わずに、$f(s)=(s+1)(3-s)^2$（$0\\le s\\le1$）の最大値を求めよう。',
        hint: '$\\dfrac{3-s}{2},\\ \\dfrac{3-s}{2},\\ s+1$ の3つは正で、和が一定（4）。相加平均と相乗平均の関係を使う。',
        ans: '$\\frac{3-s}{2}\\cdot\\frac{3-s}{2}\\cdot(s+1)\\le\\left(\\frac43\\right)^3$ より $f(s)\\le\\frac{256}{27}$（等号は $s=\\frac13$）',
        after: '和が一定の3つの正の数の積は、3つが等しいとき最大。答案は微分のほうが確実です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。文字で動く図形の面積は「ベクトルで式にする → おきかえ → 因数分解して増減」の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
