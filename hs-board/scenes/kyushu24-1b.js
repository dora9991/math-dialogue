/* 2024 九大 理系 第1問の類題②（自作）：文字 t で動く空間の3点と、三角形の面積の最大値（類題①とは別の3点・別の式）
   問題：−1≦t≦1、A(t²−1, −t, t²−1)、B(1, −2t, 0)、C(1, 0, −1)。(1) 3点は一直線上にない (2) △ABC の面積 S の最大値
   答え（python3・sympy で検算ずみ）：
   AB=(2−t², −t, 1−t²)、AC=(2−t², t, −t²)。一直線 ⇔ AC=kAB ⇔ x 成分より k=1、y 成分より t=0、z 成分は 0=1 で矛盾
   s=t² とおくと |AB|²=2s²−5s+5、|AC|²=2s²−3s+4、AB・AC=R=2s²−6s+4
   |AB|²=R+(s+1)、|AC|²=R+3s → D=(4s+1)R+3s(s+1)=8s³−19s²+13s+4、D'=(2s−1)(12s−13)
   最大は s=1/2（t=±√2/2）で D=27/4、S=3√3/4≒1.299（端は S(0)=1、S(±1)=√6/2≒1.225）
   検算：t=0 のとき 3 点は y=0 の平面上の直角三角形（AC=2、BC=1）で S=1
   考えてみよう：−2≦t≦2 なら s=4 で D=264、S=√66（s=13/12 は極小 2573/432） */
(function () {
  const D = s => 8 * s * s * s - 19 * s * s + 13 * s + 4;
  const graph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.2, -1.2, 1.4, 8.4], w: 540, h: 400, items: [
    { k: 'axes', tx: [[0.5, '1/2'], [1, '1']], ty: [[4, '4'], [6, '6'], [6.75, '27/4']], xl: 's', yl: 'y' },
    { k: 'fn', f: '8*x**3-19*x**2+13*x+4', a: -0.15, b: 1.35, c: 'd', wd: 2 },
    { k: 'fn', f: '8*x**3-19*x**2+13*x+4', a: 0, b: 1, c: 'y', wd: 5 },
    { k: 'seg', a: [0, 0], b: [1, 0], c: 'y', wd: 6 }
  ].concat(extra || []) });
  const POINTS = [
    '一直線上 ⇔ $\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$。0 で割る心配のない成分（ここでは $x$ 成分）から $k$ を決めて、ほかの成分で矛盾を出す',
    '面積は $S=\\dfrac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$。$t$ が2乗でしか出てこないので、$s=t^2$ とおいて次数を下げる',
    '4次式どうしの引き算は、内積 $R$ にそろえて $|\\vec a|^2=R+\\cdots$ と書くと2次の項が消える。増減を調べたら、範囲の端の値も必ず比べる'
  ];

  HB.lesson({
    id: 'kyushu24-1b', field: '九大型　数学（理系）', title: '2024 九大 理系 第1問の類題② ― 動く3点がつくる空間の三角形の面積の最大', level: '2024年度 九州大学 理系 第1問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '実数 $t$ は $-1\\le t\\le1$ をみたすとする。座標空間に 3 点 $\\mathrm{A}(t^2-1,\\ -t,\\ t^2-1)$、$\\mathrm{B}(1,\\ -2t,\\ 0)$、$\\mathrm{C}(1,\\ 0,\\ -1)$ をとる。',
      parts: [
        '(1)　3 点 A，B，C は一直線上にないことを示せ。',
        '(2)　$\\triangle\\mathrm{ABC}$ の面積を $S$ とする。$t$ が $-1\\le t\\le1$ の範囲を動くときの $S$ の最大値と、そのときの $t$ の値を求めよ。'
      ],
      src: '※ 2024年度 九州大学 前期 理系 第1問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '文字 $t$ で動く空間の3点について、(1) 一直線上にないこと、(2) 三角形の面積の最大値を求めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '空間の三角形は、A を始点にした2つのベクトルで調べます。まず $\\overrightarrow{\\mathrm{AB}}$ を「終点 B − 始点 A」で出します。',
        add: [{ t: 'h', text: '方針：A を始点にした2つのベクトル' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{AB}}&=(1-(t^2-1),\\ -2t-(-t),\\ 0-(t^2-1))\\\\ &=(2-t^2,\\ -t,\\ 1-t^2)\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AC}}$ の成分は？',
        opts: ['$(t^2-2,\\ t,\\ -t^2)$', '$(2-t^2,\\ -t,\\ -t^2)$', '$(2-t^2,\\ t,\\ -1-t^2)$', '$(2-t^2,\\ t,\\ -t^2)$'], ok: 3,
        why: { 0: '「A − C」になっています。$\\overrightarrow{\\mathrm{AC}}$ は「終点 C − 始点 A」です。', 1: '$y$ 成分は $0-(-t)=t$。マイナスを引くので $+t$ です。', 2: '$z$ 成分は $-1-(t^2-1)$。かっこの中の $-1$ も引くので $-t^2$ です。' },
        good: '「終点 − 始点」で $(1-(t^2-1),\\ 0-(-t),\\ -1-(t^2-1))=(2-t^2,\\ t,\\ -t^2)$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AC}}=(2-t^2,\\ t,\\ -t^2)' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　一直線上 ⇔ $\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$。背理法で矛盾を出す\n(2)　面積の公式（内積の形）を $t$ の式に。$t^2=s$ とおいて微分' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) は背理法です。「一直線上にある」と仮定して矛盾を導きます。$-1\\le t\\le1$ なら $x$ 成分 $2-t^2\\ge1$ なので、$\\overrightarrow{\\mathrm{AB}}\\ne\\vec0$ です。',
        add: [{ t: 'h', text: '(1)　一直線上にないことの証明' },
          { t: 'p', size: 'sm', text: '3 点が一直線上にあると仮定する。\n$\\overrightarrow{\\mathrm{AB}}\\ne\\vec 0$（$x$ 成分 $2-t^2\\ge1$）なので、実数 $k$ を用いて' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}', note: '…①' },
          { t: 'm', size: 'sm', tex: '(2-t^2,\\ t,\\ -t^2)=k(2-t^2,\\ -t,\\ 1-t^2)' }] },
      { ask: { type: 'choice', q: '成分を比べるとき、まずどの成分から $k$ を決めるのがよい？',
        opts: ['$z$ 成分：$-t^2=k(1-t^2)$ より $k=\\dfrac{-t^2}{1-t^2}$', '$y$ 成分：$t=-kt$ より $k=-1$', '$x$ 成分：$2-t^2=k(2-t^2)$ より $k=1$', 'どれからでも同じ手間'], ok: 2,
        why: { 0: '$t=\\pm1$ のとき $1-t^2=0$ で割れません。場合分けが増えます。', 1: '$t=0$ のとき両辺 0 で、$k$ は決まりません。', 3: '$x$ 成分なら $2-t^2\\ge1$ で、場合分けなしで $k$ が決まります。' },
        good: '$2-t^2\\ne0$ なので両辺を割れて、$k=1$ がすぐ決まります。',
        add: [{ t: 'm', tex: 'x\\ \\text{成分}：2-t^2=k(2-t^2)\\quad\\therefore\\ k=1' }] } },
      { say: '$k=1$ を $y$ 成分に入れると $t=-t$、つまり $t=0$。このとき $z$ 成分は $-t^2=1-t^2$、すなわち $0=1$ となり、矛盾です。',
        add: [{ t: 'm', size: 'sm', tex: 'y\\ \\text{成分}：t=-t\\quad\\therefore\\ t=0' },
          { t: 'm', size: 'sm', tex: 'z\\ \\text{成分}：-t^2=1-t^2\\ \\xrightarrow{t=0}\\ 0=1' },
          { t: 'ans', col: 1, label: '(1)', text: '$k=1$ だと $z$ 成分が $-t^2=1-t^2$ となり、$t$ の値によらず成り立たない。\nよって 3 点 A，B，C は一直線上にない。' }] },
      { ask: { type: 'choice', q: '$k=1$ は、図形としては何を意味する？',
        opts: ['C と B が同じ点', 'A と B が同じ点', 'A と C が同じ点', 'C が線分 AB の中点'], ok: 0,
        why: { 1: 'A と B が重なるなら $\\overrightarrow{\\mathrm{AB}}=\\vec0$。ここでは $\\ne\\vec0$ です。', 2: 'A と C が重なるなら $\\overrightarrow{\\mathrm{AC}}=\\vec0$ です。', 3: '中点なら $k=\\frac12$。$k=1$ は端の B そのものです。' },
        good: '$\\overrightarrow{\\mathrm{AC}}=\\overrightarrow{\\mathrm{AB}}$ なら C＝B。ところが $z$ 座標は C が $-1$、B が $0$ で、重なりません。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: 'メモ', text: '$k=1$ ⇔ C＝B。\nC の $z$ 座標 $-1$ と B の $z$ 座標 $0$ が\nちがうので、矛盾とすぐ分かる。' }] } },

      // ---------- (2) 面積の式 ----------
      { clear: true, part: '(2)', say: '(2) です。$\\vec a=\\overrightarrow{\\mathrm{AB}},\\ \\vec b=\\overrightarrow{\\mathrm{AC}}$ のなす角を $\\theta$ とすると $S=\\frac12|\\vec a||\\vec b|\\sin\\theta$。$\\sin\\theta=\\sqrt{1-\\cos^2\\theta}$ を使うと、内積の形になります。',
        add: [{ t: 'h', text: '(2)　面積を t の式で表す' },
          { t: 'm', tex: 'S=\\frac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}' }] },
      { say: '成分の $t$ は、大きさや内積では必ず2乗（$t^2$ か $t\\cdot t$）で出てきます。そこで $s=t^2$（$0\\le s\\le1$）とおきます。$|\\vec a|^2$ と $|\\vec b|^2$ はすぐ出ます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'おきかえ', text: '$s=t^2$　とおく。$-1\\le t\\le1$ より　$0\\le s\\le1$' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2=(2-s)^2+s+(1-s)^2=2s^2-5s+5' },
          { t: 'm', size: 'sm', tex: '|\\vec b|^2=(2-s)^2+s+s^2=2s^2-3s+4' }] },
      { ask: { type: 'choice', q: '内積 $\\vec a\\cdot\\vec b=(2-t^2)^2+(-t)\\cdot t+(1-t^2)(-t^2)$ を $s$ で表すと？',
        opts: ['$2s^2-4s+4$', '$s^2-5s+4$', '$2s^2-6s+4$', '$-4s+4$'], ok: 2,
        why: { 0: '$y$ 成分の積は $(-t)\\cdot t=-s$。符号を $+$ にしています。', 1: '$z$ 成分の積 $(1-s)(-s)=s^2-s$ を足し忘れています。', 3: '$(1-s)(-s)$ を $s(1-s)$ と、符号をまちがえています。$(1-s)(-s)=s^2-s$ です。' },
        good: '$(s^2-4s+4)-s+(s^2-s)=2s^2-6s+4$。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec a\\cdot\\vec b=(2-s)^2-s-s(1-s)=2s^2-6s+4' }] } },

      // ---------- (2) 根号の中を計算 ----------
      { clear: true, cols: [0.6, 0.4], say: '根号の中 $D=|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2$ を計算します。そのまま展開すると4次式どうしの引き算。**内積 $R=2s^2-6s+4$ にそろえる** と楽になります。',
        add: [{ t: 'h', text: '(2)　根号の中を工夫して計算' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2=2s^2-5s+5,\\quad |\\vec b|^2=2s^2-3s+4,\\quad R=2s^2-6s+4' }] },
      { ask: { type: 'think', q: '$|\\vec a|^2-R$ と $|\\vec b|^2-R$ を $s$ の式で表そう。',
        hint: '$2s^2$ は3つに共通。引くと消えて、1次式だけが残る。',
        ans: '$|\\vec a|^2-R=s+1$、$|\\vec b|^2-R=3s$',
        after: '2次の項が消えて、1次式だけになりました。これが「内積にそろえる」ねらいです。',
        add: [{ t: 'm', size: 'sm', tex: '|\\vec a|^2=R+(s+1),\\quad |\\vec b|^2=R+3s' }] } },
      { say: 'すると $D=(R+s+1)(R+3s)-R^2$。$R^2$ が打ち消し合って、$D=(4s+1)R+3s(s+1)$。$R$ を入れて整理します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}D&=(R+s+1)(R+3s)-R^2\\\\ &=(4s+1)R+3s(s+1)\\\\ &=(4s+1)(2s^2-6s+4)+3s^2+3s\\end{aligned}' },
          { t: 'm', size: 'sm', tex: '=\\ans{8s^3-19s^2+13s+4}', note: '$D(s)$' }] },

      // ---------- (2) 増減 ----------
      { clear: true, cols: [0.56, 0.44], say: '$S=\\frac12\\sqrt{D(s)}$ なので、$S$ が最大になるのは $D(s)$ が最大のとき。$D(s)$ を微分して因数分解します。',
        add: [{ t: 'h', text: '(2)　D(s) の増減（0 ≦ s ≦ 1）' },
          { t: 'm', size: 'sm', tex: "D'(s)=24s^2-38s+13=(2s-1)(12s-13)" },
          graph('g1')] },
      { ask: { type: 'choice', q: '$0\\le s\\le1$ で $D(s)$ が最大になるのは？',
        opts: ['$s=1$', '$s=\\dfrac{13}{12}$', '$s=0$', '$s=\\dfrac12$'], ok: 3,
        why: { 0: '$D(1)=6$ ですが、$s=\\frac12$ で $\\frac{27}{4}$ まで上がったあと、減っています。', 1: '$\\frac{13}{12}>1$ で範囲の外です（しかも極小になる点）。', 2: '$D(0)=4$。$s=\\frac12$ まで増え続けます。' },
        good: '$0\\le s<\\frac12$ で $D\'>0$（増加）、$\\frac12<s\\le1$ で $D\'<0$（減少）。最大は $s=\\frac12$。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$s$', '$0$', '$\\cdots$', '$\\frac12$', '$\\cdots$', '$1$'], ["$D'(s)$", '', '$+$', '$0$', '$-$', ''], ['$D(s)$', '$4$', '$\\nearrow$', '{{$\\frac{27}{4}$}}', '$\\searrow$', '$6$']] }],
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [0.5, D(0.5)], c: 'p', name: 's=1/2 で最大', dir: 'ne', size: 20 }, { k: 'line', x: 0.5, dash: true, c: 'p' }] }] } },
      { say: '$D\\left(\\frac12\\right)=1-\\frac{19}{4}+\\frac{13}{2}+4=\\frac{27}{4}$。$S=\\frac12\\sqrt{\\frac{27}{4}}=\\frac12\\cdot\\frac{3\\sqrt3}{2}$ で、$s=\\frac12$ は $t=\\pm\\frac{\\sqrt2}{2}$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\frac12\\cdot\\frac{3\\sqrt3}{2}=\\frac{3\\sqrt3}{4}' },
          { t: 'ans', label: '(2) 答', text: '$t=\\pm\\dfrac{\\sqrt2}{2}$ のとき、最大値 $S=\\dfrac{3\\sqrt3}{4}$' }] },
      { say: '検算：端では $S(0)=\\frac12\\sqrt4=1$、$S(\\pm1)=\\frac12\\sqrt6\\approx1.22$。最大値 $\\frac{3\\sqrt3}{4}\\approx1.30$ はそれより大きく、つじつまが合います。',
        add: [{ t: 'p', size: 'sm', text: '$t=0$：$S=1$　　$t=\\pm1$：$S\\approx1.22$\n$t=\\pm\\frac{\\sqrt2}{2}$：$S\\approx1.30$（最大）' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '$t=0$ の検算を、図でもやってみます。A(−1, 0, −1)、B(1, 0, 0)、C(1, 0, −1) はどれも $y=0$ の平面上にあり、直角三角形です。',
        add: [{ t: 'h', text: '検算：t＝0 のときの図形' },
          { t: 'p', size: 'sm', text: '3 点とも $y=0$ なので、$xz$ 平面の図形として見る' },
          { t: 'm', size: 'sm', tex: '\\mathrm{AC}=2,\\quad \\mathrm{BC}=1,\\quad \\angle\\mathrm{C}=90^\\circ' },
          { t: 'm', size: 'sm', tex: 'S=\\frac12\\cdot2\\cdot1=1', note: '$S(0)=1$ と一致' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.9, -1.7, 1.9, 0.7], w: 470, h: 316, items: [
            { k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [[-1, '−1']], xl: 'x', yl: 'z' },
            { k: 'poly', pts: [[-1, -1], [1, 0], [1, -1]], close: true, fill: 'y', alpha: 0.25 },
            { k: 'seg', a: [-1, -1], b: [1, -1], c: 'b', wd: 3 }, { k: 'seg', a: [1, -1], b: [1, 0], c: 'g', wd: 3 }, { k: 'seg', a: [-1, -1], b: [1, 0], c: 'd', wd: 3 },
            { k: 'right', o: [1, -1], a: [-1, -1], b: [1, 0], s: 0.18 },
            { k: 'pt', at: [-1, -1], name: 'A', dir: 'sw' }, { k: 'pt', at: [1, 0], name: 'B', dir: 'ne' }, { k: 'pt', at: [1, -1], name: 'C', dir: 'se' },
            { k: 'label', at: [0, -1.3], text: '2', c: 'b', size: 22 }, { k: 'label', at: [1.3, -0.5], text: '1', c: 'g', size: 22 }
          ] }] },
      { ask: { type: 'think', q: '$t$ の範囲を $-2\\le t\\le2$ に広げると、$S$ の最大値はどうなる？',
        hint: 'こんどは $0\\le s\\le4$。$s=\\frac{13}{12}$ は極小。端の $s=4$ での $D$ の値は？',
        ans: '$D(4)=264$ より $S=\\frac12\\sqrt{264}=\\sqrt{66}\\approx8.1$（$t=\\pm2$）',
        after: '$s=\\frac12$ の極大値 $\\frac{27}{4}$ より、端の値のほうがずっと大きい。範囲が変わると最大の場所も変わるので、端の値は必ず比べます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。文字で動く図形の面積は「ベクトルで式にする → おきかえ → 工夫して計算 → 増減と端」の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
