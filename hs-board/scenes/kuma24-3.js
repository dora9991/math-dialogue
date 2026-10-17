/* 熊大型 数学（理系）：2024年度 熊本大学 前期 理系（数学②）第3問の類題（自作問題・元の問題ではない）
   問題：△ABC で AC=1、D は辺 BC を 3:1 に内分、∠BAD=θ、∠DAC=2θ。
   答え（python3・sympy と座標の数値計算で検算ずみ）：
     θ の範囲 0<θ<π/3（1/2<cosθ<1）
     (1) △ABD:△ADC=3:1 より AB·sinθ=3·1·sin2θ、AB=6cosθ
     (2) BC²=36cos²θ+1−12cosθcos3θ=−48cos⁴θ+72cos²θ+1、BC=√(−48cos⁴θ+72cos²θ+1)
     (3) x=cos²θ（1/4<x<1）で −48(x−3/4)²+28。最大値 BC=2√7（θ=π/6、このとき ∠A=π/2、AB=3√3） */
(function () {
  const rad = d => d * Math.PI / 180;
  // 三角形の図：A(0,0)、B(6cosθ, 0)、C(cos3θ, sin3θ)、D=(B+3C)/4
  const tri = (id, deg, o) => {
    o = o || {};
    const t = rad(deg), A = [0, 0], B = [6 * Math.cos(t), 0], C = [Math.cos(3 * t), Math.sin(3 * t)], D = [(B[0] + 3 * C[0]) / 4, (B[1] + 3 * C[1]) / 4];
    const mid = (P, Q, k) => [P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k];
    const nx = -(C[1] - B[1]), ny = C[0] - B[0], L = Math.hypot(nx, ny), off = [nx / L * 0.17, ny / L * 0.17];   // 辺 BC の外側（A と反対側）へ
    const items = [
      { k: 'poly', pts: [A, B, C], close: true, c: 'w', wd: 2.5 },
      { k: 'seg', a: A, b: D, c: 'b', wd: 2.5 },
      { k: 'angle', o: A, a: B, b: D, rp: 72, label: 'θ', c: 'y', lr: 16, size: 22 },
      { k: 'angle', o: A, a: D, b: C, rp: 42, label: '2θ', c: 'p', lr: 24, size: 22, n: 2 },
      { k: 'pt', at: A, name: 'A', dir: 'sw', c: 'w', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'se', c: 'w', r: 4 },
      { k: 'pt', at: C, name: 'C', dir: 'n', c: 'w', r: 4 }, { k: 'pt', at: D, name: 'D', dir: 'n', c: 'b', r: 5 },
      { k: 'label', at: mid(A, C, 0.5), text: '1', dx: -16, c: 'y', size: 22 },
      { k: 'label', at: [mid(B, D, 0.5)[0] + off[0], mid(B, D, 0.5)[1] + off[1]], text: '3', c: 'g', size: 22 },
      { k: 'label', at: [mid(D, C, 0.5)[0] + off[0], mid(D, C, 0.5)[1] + off[1]], text: '1', c: 'g', size: 22 }
    ].concat(o.extra || []);
    const v = o.view || [-0.45, -0.35, 5.75, 1.3], w = o.w || 760;
    return { t: 'fig', id, col: o.col == null ? 1 : o.col, view: v, w, h: Math.round(w * (v[3] - v[1]) / (v[2] - v[0])), items };
  };
  // (3) の 2次関数のグラフ
  const para = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.08, -3, 1.18, 33], w: 470, h: 360, items: [
    { k: 'axes', tx: [[0.25, '1/4'], [0.75, '3/4'], [1, '1']], ty: [[16, '16'], [28, '28']], xl: 'x', yl: 'BC²' },
    { k: 'fn', f: '-48*x**2+72*x+1', a: 0.25, b: 1, c: 'y' },
    { k: 'fn', f: '-48*x**2+72*x+1', a: 0, b: 0.25, c: 'd', dash: true },
    { k: 'pt', at: [0.25, 16], open: true, c: 'y' }, { k: 'pt', at: [1, 25], open: true, c: 'y', name: '25', dir: 'e', size: 21 }
  ].concat(extra || []) });

  const POINTS = [
    '角の比の条件は、**面積比** か **正弦定理** で辺の比に直す。BD : DC $=3:1$ なら △ABD : △ADC $=3:1$（高さが共通）',
    '$\\cos3\\theta=4\\cos^3\\theta-3\\cos\\theta$ で、余弦定理の式を $\\cos\\theta$ だけの式にする',
    '最大・最小は $x=\\cos^2\\theta$ の2次関数で。$\\theta$ の範囲（$0<3\\theta<\\pi$）から $x$ の範囲を先に出しておく'
  ];

  HB.lesson({
    id: 'kuma24-3', field: '熊大型　数学（理系）', title: '2024 熊大 理系 第3問の類題 ― 角を1：2に分ける線分と、辺の長さの最大値', level: '2024年度 熊本大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$\\triangle\\mathrm{ABC}$ において $\\mathrm{AC}=1$ とする。辺 BC を $3:1$ に内分する点を D とし、$\\angle\\mathrm{BAD}=\\theta$、$\\angle\\mathrm{DAC}=2\\theta$ とする。',
      parts: [
        '(1)　$\\mathrm{AB}=6\\cos\\theta$ であることを示せ。',
        '(2)　BC を $\\cos\\theta$ を用いて表せ。',
        '(3)　BC の最大値と、そのときの $\\theta$ の値を求めよ。'
      ],
      src: '※ 2024年度 熊本大学 前期 理系（数学②）第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '三角形の角の条件から辺の長さを $\\cos\\theta$ で表し、その最大値を求める問題です。(1) は証明。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: 'まず図。AC $=1$、D は BC を $3:1$ に内分、AD が角 A を $\\theta$ と $2\\theta$ に分けます。$\\angle\\mathrm{BAC}=3\\theta$ です。',
        add: [{ t: 'h', text: '図をかいて、θ の範囲を確かめる' },
          tri('g0', 25, { col: 0, w: 900 })] },
      { ask: { type: 'choice', q: '$\\theta$ のとりうる値の範囲は？',
        opts: ['$0<\\theta<\\dfrac{\\pi}{2}$', '$0<\\theta<\\dfrac{\\pi}{3}$', '$0<\\theta<\\dfrac{\\pi}{6}$', '$0<\\theta<\\pi$'], ok: 1,
        why: { 0: '条件は $\\angle\\mathrm{BAC}=3\\theta<\\pi$。$\\theta$ が $\\frac{\\pi}{2}$ 近くだと $3\\theta$ が $\\pi$ をこえます。', 2: '$3\\theta<\\pi$ から $\\theta<\\frac{\\pi}{3}$。$\\frac{\\pi}{6}$ では小さすぎます。', 3: '三角形の1つの角 $3\\theta$ が $\\pi$ より小さい、が条件です。' },
        good: '$0<3\\theta<\\pi$ より $0<\\theta<\\dfrac{\\pi}{3}$。このとき $\\dfrac12<\\cos\\theta<1$ です。',
        add: [{ t: 'm', tex: '0<\\theta<\\frac{\\pi}{3},\\qquad \\frac12<\\cos\\theta<1', note: '(3) で使う' }] } },

      // ---------- (1) ----------
      { clear: true, cols: [0.46, 0.54], part: '(1)', say: '(1) です。わかっているのは「角の比」と「BC の分け方の比」。これを辺 AB に結びつける方法を考えます。',
        add: [{ t: 'h', text: '(1)　AB = 6cosθ を示す' },
          tri('g1', 25)] },
      { ask: { type: 'choice', q: '(1) の方針として、計算がいちばん楽なのは？',
        opts: ['余弦定理で BC², AD² を表す', '座標を入れて、A を原点にする', 'BC の中線定理を使う', '面積比（または正弦定理）で角と辺を結ぶ'], ok: 3,
        why: { 0: '余弦定理では AD・BC などの未知の長さが増え、計算がこみ入ります。', 1: 'できなくはないですが、角 $\\theta$ と $2\\theta$ の条件を式にするのが大変です。', 2: 'D は中点ではないので、中線定理は使えません。' },
        good: '面積 $\\frac12\\cdot\\mathrm{AB}\\cdot\\mathrm{AD}\\sin\\theta$ のように、角と辺を1つの式で直接結べます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '角の比 → 辺の比 は、面積比か正弦定理で' }] } },
      { say: '△ABD と △ADC は、頂点 A からの高さが共通。だから面積の比は底辺の比 BD : DC $=3:1$。面積を AD をはさむ形で書きます。',
        add: [{ t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABD}:\\triangle\\mathrm{ADC}=\\mathrm{BD}:\\mathrm{DC}=3:1' },
          { t: 'm', size: 'sm', tex: '\\frac12\\,\\mathrm{AB}\\cdot\\mathrm{AD}\\sin\\theta=3\\cdot\\frac12\\cdot1\\cdot\\mathrm{AD}\\sin2\\theta' }] },
      { ask: { type: 'choice', q: '$\\mathrm{AB}\\sin\\theta=3\\sin2\\theta$ から、AB は？',
        opts: ['$6\\cos\\theta$', '$\\dfrac32\\cos\\theta$', '$3\\cos\\theta$', '$\\dfrac{6}{\\cos\\theta}$'], ok: 0,
        why: { 1: '比が逆です。△ABD のほうが 3 倍大きいので、3 は右辺にかかります。', 2: '$\\sin2\\theta=2\\sin\\theta\\cos\\theta$ の 2 を忘れています。', 3: '$\\sin2\\theta$ を $\\sin\\theta$ で割ると $2\\cos\\theta$。分母には来ません。' },
        good: '$\\sin2\\theta=2\\sin\\theta\\cos\\theta$ として、$\\sin\\theta\\neq0$ で割ると $\\mathrm{AB}=6\\cos\\theta$。',
        add: [{ t: 'ans', label: '(1) 示せた', tex: '\\mathrm{AB}\\sin\\theta=6\\sin\\theta\\cos\\theta\\ \\Rightarrow\\ \\mathrm{AB}=6\\cos\\theta' }] } },
      { ask: { type: 'think', q: '正弦定理でも示してみよう。△ABD と △ADC で正弦定理を使うと？',
        hint: '$\\angle\\mathrm{ADB}+\\angle\\mathrm{ADC}=\\pi$ なので、$\\sin\\angle\\mathrm{ADB}=\\sin\\angle\\mathrm{ADC}$。',
        ans: '$\\mathrm{AB}=\\dfrac{\\mathrm{BD}\\sin\\angle\\mathrm{ADB}}{\\sin\\theta}$、$\\mathrm{AC}=\\dfrac{\\mathrm{DC}\\sin\\angle\\mathrm{ADC}}{\\sin2\\theta}$ を割って　$\\dfrac{\\mathrm{AB}}{\\mathrm{AC}}=\\dfrac{\\mathrm{BD}}{\\mathrm{DC}}\\cdot\\dfrac{\\sin2\\theta}{\\sin\\theta}=3\\cdot2\\cos\\theta$',
        after: '面積比と同じ式になります。どちらも「D での角の正弦が等しい」ことと「BD : DC」を使っています。' } },

      // ---------- (2) ----------
      { clear: true, cols: [0.46, 0.54], part: '(2)', say: 'BC は △ABC で余弦定理。2辺 AB $=6\\cos\\theta$、AC $=1$ と、そのはさむ角 $3\\theta$ がわかっています。',
        add: [{ t: 'h', text: '(2)　BC を cosθ で表す' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\mathrm{BC}^2&=\\mathrm{AB}^2+\\mathrm{AC}^2-2\\,\\mathrm{AB}\\cdot\\mathrm{AC}\\cos3\\theta\\\\ &=36\\cos^2\\theta+1-12\\cos\\theta\\cos3\\theta\\end{aligned}' },
          tri('g2', 25)] },
      { ask: { type: 'choice', q: '3倍角の公式　$\\cos3\\theta=$ ？',
        opts: ['$3\\cos\\theta-4\\cos^3\\theta$', '$3\\cos\\theta$', '$4\\cos^3\\theta-3\\cos\\theta$', '$\\cos^3\\theta-3\\cos\\theta$'], ok: 2,
        why: { 0: '$\\sin3\\theta=3\\sin\\theta-4\\sin^3\\theta$ の形とまざっています。$\\theta=0$ で $-1$ になってしまいます。', 1: '$\\theta=\\frac{\\pi}{3}$ で比べると、$\\cos\\pi=-1$ と $\\frac32$。ちがいます。', 3: '係数は 4。$\\theta=0$ で $1-3=-2\\neq1$ です。' },
        good: '$\\cos(2\\theta+\\theta)$ を加法定理で展開すると $4\\cos^3\\theta-3\\cos\\theta$。$\\theta=0$ で 1 になるか、で検算できます。' } },
      { say: '代入して整理します。$c=\\cos\\theta$ と書くと、$-12c(4c^3-3c)=-48c^4+36c^2$。$c^2$ の項をまとめて $72c^2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\mathrm{BC}^2&=36c^2+1-12c(4c^3-3c)\\\\ &=-48c^4+72c^2+1\\end{aligned}', note: '$c=\\cos\\theta$' },
          { t: 'ans', label: '(2) 答', tex: '\\mathrm{BC}=\\sqrt{-48\\cos^4\\theta+72\\cos^2\\theta+1}' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: 'BC が最大 ⇔ BC² が最大。$x=\\cos^2\\theta$ とおくと、BC² は $x$ の2次関数です。まず $x$ の範囲から。',
        add: [{ t: 'h', text: '(3)　BC の最大値' },
          { t: 'm', tex: 'x=\\cos^2\\theta,\\qquad \\mathrm{BC}^2=-48x^2+72x+1' }] },
      { ask: { type: 'choice', q: '$x=\\cos^2\\theta$ の範囲は？（$0<\\theta<\\frac{\\pi}{3}$）',
        opts: ['$0<x<1$', '$\\dfrac12<x<1$', '$\\dfrac14<x<\\dfrac34$', '$\\dfrac14<x<1$'], ok: 3,
        why: { 0: '$\\theta$ の範囲を使っていません。$\\frac12<\\cos\\theta<1$ です。', 1: 'それは $\\cos\\theta$ の範囲。2乗すると $\\frac14<x<1$。', 2: '上の端は、$\\theta\\to0$ で $\\cos^2\\theta\\to1$ です。' },
        good: '$\\dfrac12<\\cos\\theta<1$ の各辺は正なので、2乗して $\\dfrac14<x<1$。',
        add: [{ t: 'm', tex: '\\frac14<x<1' }] } },
      { say: '平方完成すると $-48\\left(x-\\frac34\\right)^2+28$。軸 $x=\\frac34$ は範囲 $\\frac14<x<1$ の中にあるので、頂点で最大になります。',
        add: [{ t: 'm', size: 'sm', tex: '-48x^2+72x+1=-48\\Big(x-\\frac34\\Big)^2+28' },
          para('p1', [{ k: 'seg', a: [0.75, 0], b: [0.75, 28], c: 'p', dash: true, wd: 2 }, { k: 'seg', a: [0, 28], b: [0.75, 28], c: 'p', dash: true, wd: 2 }, { k: 'pt', at: [0.75, 28], c: 'p', name: '頂点', dir: 'n', size: 20, plain: true }])] },
      { ask: { type: 'choice', q: 'BC の最大値は？',
        opts: ['$28$', '$2\\sqrt7$', '$5$', '$\\sqrt{29}$'], ok: 1,
        why: { 0: 'それは BC² の最大値。最後に $\\sqrt{\\ }$ をとります。', 2: '$x\\to1$（$\\theta\\to0$）に近づくときの値 $\\sqrt{25}$。最大は頂点です。', 3: '平方完成の定数項の計算ミス。$-48\\cdot\\frac{9}{16}+72\\cdot\\frac34+1=-27+54+1=28$。' },
        good: '$x=\\dfrac34$ で $\\mathrm{BC}^2=28$。$\\mathrm{BC}=\\sqrt{28}=2\\sqrt7$ です。' } },
      { say: '$\\cos^2\\theta=\\frac34$ で $\\cos\\theta>0$ なので $\\cos\\theta=\\frac{\\sqrt3}{2}$。$0<\\theta<\\frac{\\pi}{3}$ より $\\theta=\\frac{\\pi}{6}$ です。',
        add: [{ t: 'ans', label: '(3) 答', text: 'BC の最大値は $2\\sqrt7$　（$\\theta=\\dfrac{\\pi}{6}$ のとき）' }] },

      // ---------- 確かめ ----------
      { clear: true, cols: [0.46, 0.54], part: '確かめ', say: '$\\theta=\\frac{\\pi}{6}$ のとき、$\\angle\\mathrm{BAC}=\\frac{\\pi}{2}$、AB $=6\\cos\\frac{\\pi}{6}=3\\sqrt3$。直角三角形なので BC² $=27+1=28$。答えと一致します。',
        add: [{ t: 'h', text: '確かめ：θ＝π/6 の三角形' },
          { t: 'm', tex: '\\mathrm{AB}=3\\sqrt3,\\ \\ \\mathrm{AC}=1,\\ \\ \\angle\\mathrm A=\\frac{\\pi}{2}' },
          { t: 'm', tex: '\\mathrm{BC}^2=27+1=28' },
          tri('g3', 30, { view: [-0.45, -0.35, 5.75, 1.45], extra: [{ k: 'right', o: [0, 0], a: [1, 0], b: [0, 1], s: 14, c: 'y' }] })] },
      { ask: { type: 'think', q: '座標で確かめよう。A(0, 0)、B$(3\\sqrt3,\\ 0)$、C(0, 1) のとき、BC を $3:1$ に内分する点 D で、本当に $\\angle\\mathrm{BAD}=\\dfrac{\\pi}{6}$？',
        hint: 'BD : DC $=3:1$ の内分点は　$\\mathrm D=\\dfrac{1\\cdot\\mathrm B+3\\cdot\\mathrm C}{3+1}$。',
        ans: '$\\mathrm D\\left(\\dfrac{3\\sqrt3}{4},\\ \\dfrac34\\right)$。直線 AD の傾きは $\\dfrac{1}{\\sqrt3}$ なので $\\angle\\mathrm{BAD}=\\dfrac{\\pi}{6}$（$\\angle\\mathrm{DAC}=\\dfrac{\\pi}{3}$）',
        after: 'この三角形は実際に条件をみたすので、最大値 $2\\sqrt7$ は本当にとれる値です。答案では「このとき条件をみたす」と一言そえると安心です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。角の比 → 辺の比（面積・正弦定理）→ 3倍角で cos の式 → 2次関数の最大。図形と三角関数をつなぐ典型の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
