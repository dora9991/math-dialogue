/* 九大型 数学（理系）：2026年度 九州大学 前期 理系 第2問の類題②（自作問題・元の問題ではない）
   問題：z が原点中心・半径 2 の円周の偏角 π/6≦θ≦π/2 の弧を動くとき、w = z + 2/z の描く図形 C。C と、原点と C の両端を結ぶ線分で囲まれた部分 D を実軸のまわりに回転
   答え（python3・sympy で検算ずみ）：
     z=2(cosθ+i sinθ)、2/z=cosθ−i sinθ、w=3cosθ+i sinθ → x²/9+y²=1、θ が π/6→π/2 で x は 3√3/2→0、y は 1/2→1
     (1) 楕円 x²/9+y²=1 の x≧0, y≧0 の部分のうち 0≦x≦3√3/2（端点 i と 3√3/2+i/2）
     (2) 線分 OQ：y=x/(3√3)（Q=(3√3/2, 1/2)）。D を実軸のまわりに回した断面は輪（外 √(1−x²/9)、内 x/(3√3)）
         V=π∫_0^{3√3/2}{(1−x²/9)−x²/27}dx=π[x−4x³/81]=π(3√3/2−√3/2)=√3 π
         検算：楕円体の一部 π(3√3/2−3√3/8)=9√3π/8、円すい (1/3)π(1/2)²(3√3/2)=√3π/8、差 √3π
         筒で検算：2π{∫_0^{1/2} y·3√3y dy + ∫_{1/2}^1 3y√(1−y²)dy}=2π(√3/8+3√3/8)=√3π */
(function () {
  const S3 = Math.sqrt(3), AX = 3 * S3 / 2;
  const TH0 = Math.PI / 6, TH1 = Math.PI / 2;
  const cplane = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.0, -0.6, 4.4, 2.5], w: 560, h: 258, items: [
    { k: 'axes', tx: [[1, '1'], [2, '2'], [3, '3']], ty: [], xl: '実軸', yl: '虚軸' },
    { k: 'param', x: '2*cos(t)', y: '2*sin(t)', a: 0, b: Math.PI / 2, c: 'd', wd: 1.5, dash: true },
    { k: 'param', x: '3*cos(t)', y: 'sin(t)', a: 0, b: Math.PI / 2, c: 'd', wd: 1.5, dash: true }].concat(items || []) });
  const ZARC = [{ k: 'param', x: '2*cos(t)', y: '2*sin(t)', a: TH0, b: TH1, c: 'b', wd: 5 },
    { k: 'pt', at: [S3, 1], name: '√3 + i', dir: 'ne', c: 'b', size: 20 }, { k: 'pt', at: [0, 2], name: '2i', dir: 'w', c: 'b', size: 20 }];
  const WARC = [{ k: 'param', x: '3*cos(t)', y: 'sin(t)', a: TH0, b: TH1, c: 'y', wd: 6 },
    { k: 'pt', at: [AX, 0.5], name: '3√3/2 + i/2', dir: 'e', c: 'y', size: 20 }, { k: 'pt', at: [0, 1], name: 'i', dir: 'w', c: 'y', size: 20 }];
  // D と、実軸について折り返した形
  const arc = []; for (let i = 0; i <= 60; i++) { const th = TH1 - (TH1 - TH0) * i / 60; arc.push([3 * Math.cos(th), Math.sin(th)]); }
  const D = [[0, 0], [0, 1]].concat(arc);
  const Dm = D.map(p => [p[0], -p[1]]);
  const rot = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.6, -1.4, 3.6, 1.4], w: 560, h: 373, items: [
    { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[1, 'i']], xl: '実軸', yl: '' },
    { k: 'poly', pts: Dm, close: true, c: 'd', wd: 1.5, dash: true },
    { k: 'poly', pts: D, close: true, fill: 'y', alpha: 0.3, c: 'y', wd: 3 },
    { k: 'param', x: String(AX) + '+0.17*sin(t)', y: '0.5*cos(t)', a: 0, b: 2 * Math.PI, c: 'b', wd: 2 },
    { k: 'pt', at: [AX, 0.5], name: 'Q', dir: 'ne', c: 'y', size: 22 }, { k: 'pt', at: [0, 1], name: 'i', dir: 'nw', c: 'y', size: 20 },
    { k: 'label', at: [1.0, 0.72], text: 'D', c: 'y', size: 26 }].concat(items || []) });
  const POINTS = [
    '円周上の $z$ は $z=r(\\cos\\theta+i\\sin\\theta)$ と表す。$\\dfrac{2}{z}$ は $\\dfrac2r(\\cos\\theta-i\\sin\\theta)$ なので、$w$ の実部・虚部がそれぞれ $\\cos\\theta,\\ \\sin\\theta$ の定数倍になり、楕円になる',
    '図示は「楕円のどの部分か」まで答える。$\\theta$ の範囲から $x=3\\cos\\theta$ と $y=\\sin\\theta$ の動く範囲を求め、端点を書く',
    '回転体は、軸に垂直に切った断面が **円か輪か** を確かめる。ここでは $x$ で切ると、外側が楕円・内側が直線 OQ の輪（検算は「楕円体の一部 − 円すい」）'
  ];

  HB.lesson({
    id: 'kyushu26-2b', field: '九大型　数学（理系）', title: '2026 九大 理系 第2問の類題② ― 楕円の弧を実軸のまわりに回した立体', level: '2026年度 九州大学 理系 第2問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '複素数平面上で、点 $z$ が原点を中心とする半径 2 の円周のうち、偏角 $\\theta$ が $\\dfrac{\\pi}{6}\\le\\theta\\le\\dfrac{\\pi}{2}$ の部分を動くとき、$w=z+\\dfrac{2}{z}$ で表される点 $w$ が描く図形を $C$ とする。',
      parts: [
        '(1)　$C$ は楕円の一部であることを示し、$C$ を図示せよ。',
        '(2)　$C$ と、原点 O と $C$ の両端を結ぶ 2 つの線分とで囲まれた部分を $D$ とする。$D$ を実軸のまわりに 1 回転させてできる立体の体積 $V$ を求めよ。'
      ],
      src: '※ 2026年度 九州大学 前期 理系 第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面と回転体の体積の問題です。円周上を動く $z$ と $\\frac2z$ を組み合わせた点がどんな曲線を描くかを調べます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- (1) w を θ で ----------
      { clear: true, cols: [0.52, 0.48], part: '(1)', say: '$z$ は、原点中心・半径 2 の円周の一部（青い弧）を動きます。だから $z=2(\\cos\\theta+i\\sin\\theta)\\ \\left(\\frac\\pi6\\le\\theta\\le\\frac\\pi2\\right)$ と表せます。',
        add: [{ t: 'h', text: '(1)　w を θ で表す' },
          { t: 'm', tex: 'z=2(\\cos\\theta+i\\sin\\theta)', note: '$\\dfrac\\pi6\\le\\theta\\le\\dfrac\\pi2$' },
          cplane('c1', ZARC)] },
      { ask: { type: 'choice', q: '$\\dfrac{2}{z}$ を $\\theta$ で表すと？',
        opts: ['$\\cos\\theta+i\\sin\\theta$', '$2(\\cos\\theta-i\\sin\\theta)$', '$\\dfrac12(\\cos\\theta-i\\sin\\theta)$', '$\\cos\\theta-i\\sin\\theta$'], ok: 3,
        why: { 0: 'それは $\\frac z2$ です。逆数では虚部の符号が変わります。', 1: '$\\frac{2}{2(\\cos\\theta+i\\sin\\theta)}$ の分母の 2 と分子の 2 が消えます。', 2: '分子の 2 を忘れています。$\\frac{2}{2}=1$ です。' },
        good: '$\\dfrac{2}{2(\\cos\\theta+i\\sin\\theta)}=\\cos\\theta-i\\sin\\theta$（$\\dfrac{1}{\\cos\\theta+i\\sin\\theta}$ は共役）。',
        add: [{ t: 'm', size: 'sm', tex: 'w=2(\\cos\\theta+i\\sin\\theta)+(\\cos\\theta-i\\sin\\theta)=3\\cos\\theta+i\\sin\\theta' }] } },
      { say: '$w$ の実部を $x$、虚部を $y$ とおくと、$x=3\\cos\\theta,\\ y=\\sin\\theta$。媒介変数表示なので、$\\theta$ を消去して $x,\\ y$ の関係を出します。',
        add: [{ t: 'm', tex: 'x=3\\cos\\theta,\\qquad y=\\sin\\theta' }] },
      { ask: { type: 'choice', q: '$\\theta$ を消去すると、$x,\\ y$ の関係は？',
        opts: ['$x^2+y^2=1$', '$\\dfrac{x^2}{3}+y^2=1$', '$x^2+\\dfrac{y^2}{9}=1$', '$\\dfrac{x^2}{9}+y^2=1$'], ok: 3,
        why: { 0: '$x=3\\cos\\theta$ の 3 が残っています。$\\cos\\theta=\\frac x3$ です。', 1: '$\\cos^2\\theta=\\frac{x^2}{9}$。3 を 2 乗します。', 2: '3 がかかっているのは $x$ のほうです。$y$ ではありません。' },
        good: '$\\cos^2\\theta+\\sin^2\\theta=1$ に $\\cos\\theta=\\frac x3,\\ \\sin\\theta=y$ を入れます。',
        add: [{ t: 'm', tex: '\\frac{x^2}{9}+y^2=1', note: '楕円（$x$ 方向 3、$y$ 方向 1）' }],
        draw: [{ fig: 'c1', items: [{ k: 'param', x: '3*cos(t)', y: 'sin(t)', a: 0, b: Math.PI / 2, c: 'y', wd: 2.5 }] }] } },

      // ---------- (1) 動く範囲 ----------
      { clear: true, cols: [0.56, 0.44], part: '(1) 範囲', say: '$\\theta$ の範囲から $w$ の動く範囲を調べます。$\\theta$ が $\\frac\\pi6$ から $\\frac\\pi2$ まで増えると、$\\cos\\theta$ は減り、$\\sin\\theta$ は増えます。',
        add: [{ t: 'h', text: '(1)　w が動く範囲' },
          { t: 'tbl', size: 'sm', rows: [['$\\theta$', '$\\dfrac\\pi6$', '$\\cdots$', '$\\dfrac\\pi2$'], ['$x=3\\cos\\theta$', '$\\dfrac{3\\sqrt3}{2}$', '$\\searrow$', '$0$'], ['$y=\\sin\\theta$', '$\\dfrac12$', '$\\nearrow$', '$1$']] }] },
      { ask: { type: 'choice', q: '$C$ は、楕円 $\\dfrac{x^2}{9}+y^2=1$ のどの部分？',
        opts: ['楕円全体', '$x\\ge0,\\ y\\ge0$ の部分全体', '$0\\le x\\le\\dfrac{3\\sqrt3}{2}$，$y>0$ の部分', '$\\dfrac12\\le y\\le1$ の部分全体'], ok: 2,
        why: { 0: '$\\theta$ は $\\frac\\pi6$ から $\\frac\\pi2$ の範囲だけです。', 1: '$\\theta\\ge\\frac\\pi6$ なので、$x$ は $3$ までは動きません。', 3: '左半分（$x<0$）もふくんでしまいます。' },
        good: '$x$ は $\\frac{3\\sqrt3}{2}$ から 0 まで、$y=\\sqrt{1-\\frac{x^2}{9}}$ が $\\frac12$ から 1 まで。両端は $\\frac{3\\sqrt3}{2}+\\frac12i$ と $i$ です。' } },
      { ask: { type: 'think', q: '逆の確かめ：弧の上の点 $(x,\\ \\sqrt{1-\\frac{x^2}{9}})$（$0\\le x\\le\\frac{3\\sqrt3}{2}$）は、$\\frac\\pi6\\le\\theta\\le\\frac\\pi2$ のある $\\theta$ から作れるだろうか。',
        hint: '$\\cos\\theta=\\frac x3$ は $\\theta$ が $0$ から $\\frac\\pi2$ のとき $\\theta$ をただ 1 つ決める。その $\\theta$ の範囲は？',
        ans: '$\\cos\\theta=\\dfrac x3$ で $0\\le\\dfrac x3\\le\\dfrac{\\sqrt3}{2}$ だから、$\\dfrac\\pi6\\le\\theta\\le\\dfrac\\pi2$ のただ 1 つの $\\theta$ が決まり、$y=\\sin\\theta$ も合う',
        after: '「$w$ は弧の上にある」だけでなく「弧の点をすべて通る」まで言えました。図示の答案として完全です。' } },
      { clear: true, cols: [0.5, 0.5], part: '(1) 図示', say: '$C$ は楕円 $\\frac{x^2}{9}+y^2=1$ の $0\\le x\\le\\frac{3\\sqrt3}{2}$ の部分（黄）。青い弧の $z$ が、黄色の弧の $w$ にうつります。',
        add: [{ t: 'h', text: '(1)　C の図示' },
          { t: 'ans', label: '(1) 答', text: '楕円 $\\dfrac{x^2}{9}+y^2=1$ の\n$0\\le x\\le\\dfrac{3\\sqrt3}{2}$，$y>0$ の部分\n（両端は $i$，$\\dfrac{3\\sqrt3}{2}+\\dfrac12i$）' },
          cplane('c2', ZARC.concat(WARC))] },

      // ---------- (2) ----------
      { clear: true, cols: [0.5, 0.5], part: '(2)', say: 'Q $=\\frac{3\\sqrt3}{2}+\\frac12i$ とします。D は、O と $i$ を結ぶ線分（虚軸の上）、弧 C、線分 QO で囲まれた部分（黄）。点線は D を実軸で折り返した形です。',
        add: [{ t: 'h', text: '(2)　D を実軸のまわりに回す' },
          { t: 'm', size: 'sm', tex: '\\text{線分 OQ}:\\ y=\\frac{x}{3\\sqrt3}\\quad\\Big(0\\le x\\le\\tfrac{3\\sqrt3}{2}\\Big)' },
          { t: 'm', size: 'sm', tex: '\\text{弧 C}:\\ y=\\sqrt{1-\\tfrac{x^2}{9}}\\quad\\Big(0\\le x\\le\\tfrac{3\\sqrt3}{2}\\Big)' },
          rot('r1')] },
      { ask: { type: 'choice', q: '$0<x<\\dfrac{3\\sqrt3}{2}$ の位置で、立体を実軸に垂直に切った断面は？（外・内は半径）',
        opts: ['半径 $\\sqrt{1-\\frac{x^2}{9}}$ の円', '半径 $\\frac{x}{3\\sqrt3}$ の円', '外 $\\frac{x}{3\\sqrt3}$・内 $\\sqrt{1-\\frac{x^2}{9}}$ の輪', '外 $\\sqrt{1-\\frac{x^2}{9}}$・内 $\\frac{x}{3\\sqrt3}$ の輪'], ok: 3,
        why: { 0: 'D は弧と線分 OQ の「間」。線分 OQ より下は D にふくまれないので、真ん中に穴があきます。', 1: 'D は線分 OQ より上、弧より下の部分です。弧の側まで広がっています。', 2: '外と内が逆です。$0<x<\\frac{3\\sqrt3}{2}$ では $\\frac{x}{3\\sqrt3}<\\sqrt{1-\\frac{x^2}{9}}$。' },
        good: '弧と線分 OQ の間を回すので、穴のあいた輪（ドーナツ形）。外が弧、内が線分 OQ です。',
        draw: [{ fig: 'r1', items: [{ k: 'seg', a: [1.2, 1.2 / 5.196152], b: [1.2, Math.sqrt(1 - 1.44 / 9)], c: 'p', wd: 6 }, { k: 'label', at: [1.2, 0], text: 'x', c: 'p', size: 22, dy: 22 }, { k: 'seg', a: [1.2, 0], b: [1.2, 1.2 / 5.196152], c: 'p', wd: 1.5, dash: true }] }] } },
      { say: 'だから、断面積は「外の円 − 内の円」。体積は、$x$ について 0 から $\\frac{3\\sqrt3}{2}$ まで積分します。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\pi\\int_0^{\\frac{3\\sqrt3}{2}}\\Big\\{\\Big(1-\\frac{x^2}{9}\\Big)-\\Big(\\frac{x}{3\\sqrt3}\\Big)^2\\Big\\}dx' }] },
      { ask: { type: 'choice', q: '$\\{\\ \\}$ の中を整理すると？',
        opts: ['$1-\\dfrac{x^2}{9}-\\dfrac{x^2}{3}$', '$1-\\dfrac{4x^2}{27}$', '$1-\\dfrac{2x^2}{27}$', '$1-\\dfrac{x^2}{9}+\\dfrac{x^2}{27}$'], ok: 1,
        why: { 0: '$\\left(\\frac{x}{3\\sqrt3}\\right)^2=\\frac{x^2}{27}$。$\\frac{x^2}{3}$ ではありません。', 2: '$\\frac{1}{9}=\\frac{3}{27}$ なので $\\frac{3}{27}+\\frac{1}{27}=\\frac{4}{27}$ です。', 3: '内側の円の面積は引きます。符号に注意しましょう。' },
        good: '$\\dfrac{x^2}{9}+\\dfrac{x^2}{27}=\\dfrac{3x^2+x^2}{27}=\\dfrac{4x^2}{27}$。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\pi\\int_0^{\\frac{3\\sqrt3}{2}}\\Big(1-\\frac{4x^2}{27}\\Big)dx' }] } },
      { ask: { type: 'think', q: 'この定積分を計算して、体積 $V$ を求めよう。',
        hint: '$\\left[x-\\dfrac{4x^3}{81}\\right]_0^{\\frac{3\\sqrt3}{2}}$。$\\left(\\dfrac{3\\sqrt3}{2}\\right)^3=\\dfrac{81\\sqrt3}{8}$。',
        ans: '$\\dfrac{3\\sqrt3}{2}-\\dfrac{4}{81}\\cdot\\dfrac{81\\sqrt3}{8}=\\dfrac{3\\sqrt3}{2}-\\dfrac{\\sqrt3}{2}=\\sqrt3$　なので　$V=\\sqrt3\\,\\pi$',
        add: [{ t: 'ans', label: '(2) 答', tex: 'V=\\pi\\Big[\\,x-\\frac{4x^3}{81}\\Big]_0^{\\frac{3\\sqrt3}{2}}=\\sqrt3\\,\\pi' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.54, 0.46], part: '別の見方', say: '検算に、「楕円を回した立体の一部」から「線分 OQ を回した円すい」を引く見方をします。外側は $x$ が 0 から $\\frac{3\\sqrt3}{2}$ までの楕円体の一部です。',
        add: [{ t: 'h', text: '別の見方：体積の引き算' },
          { t: 'm', size: 'sm', tex: 'V_1=\\pi\\int_0^{\\frac{3\\sqrt3}{2}}\\Big(1-\\frac{x^2}{9}\\Big)dx=\\frac{9\\sqrt3}{8}\\pi' },
          rot('r2', [{ k: 'poly', pts: [[0, 0], [AX, 0.5], [AX, 0]], close: true, c: 'p', wd: 2.5, fill: 'p', alpha: 0.2 }])] },
      { ask: { type: 'choice', q: '線分 OQ を実軸のまわりに回した円すいの体積 $V_2$ は？（底面の半径 $\\frac12$、高さ $\\frac{3\\sqrt3}{2}$）',
        opts: ['$\\dfrac{3\\sqrt3}{8}\\pi$', '$\\dfrac{\\sqrt3}{8}\\pi$', '$\\dfrac{\\sqrt3}{4}\\pi$', '$\\dfrac{9\\sqrt3}{8}\\pi$'], ok: 1,
        why: { 0: '円すいの体積の $\\frac13$ を忘れています。', 2: '半径 $\\frac12$ の 2 乗は $\\frac14$。$\\frac13\\cdot\\frac14\\cdot\\frac{3\\sqrt3}{2}=\\frac{\\sqrt3}{8}$ です。', 3: 'それは楕円体の一部（$V_1$）の体積です。' },
        good: '$\\dfrac13\\pi\\Big(\\dfrac12\\Big)^2\\cdot\\dfrac{3\\sqrt3}{2}=\\dfrac{\\sqrt3}{8}\\pi$。$V=V_1-V_2=\\dfrac{9\\sqrt3-\\sqrt3}{8}\\pi=\\sqrt3\\,\\pi$ で、本解と一致します。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\frac{9\\sqrt3}{8}\\pi-\\frac{\\sqrt3}{8}\\pi=\\sqrt3\\,\\pi' }] } },
      { say: '答案では、断面が輪になる理由（外が弧・内が線分）と、積分の範囲をはっきり書きましょう。ここが採点で見られます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・$\\frac2z$ を $\\cos\\theta-i\\sin\\theta$ と計算し、楕円の式を出す\n・C が楕円の「どの部分か」（$x$ の範囲）と両端\n・断面が輪になる理由と、積分で $\\pi$ と 2 乗を忘れない' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「角で表して $\\frac2z$ を計算」「どの部分か」「断面は円か輪か」の3つが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
