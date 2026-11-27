/* 熊大型 数学（理系）：2024年度 熊本大学 前期 理系（数学②）第3問の類題②（自作問題・元の問題ではない）
   元の問題はうつしていない（「角の比の条件を面積比・正弦定理で辺の比に直す → 3倍角と余弦定理 → cos²θ の2次関数で最大」というねらいと形式だけを合わせた自作問題）。
   類題①（AC=1、D は BC を 3:1 に内分、∠BAD=θ・∠DAC=2θ）とは、与える辺（AB=2）・D（中点）・角の割り振り（∠BAD=2θ・∠DAC=θ）がちがい、
   最大になる θ も別（①は π/6、②は π/4 で ∠A が鈍角）。
   問題：△ABC で AB=2、D は辺 BC の中点、∠BAD=2θ、∠DAC=θ。
   答え（python3・sympy と数値計算で検算ずみ）：
     θ の範囲 0<θ<π/3（1/2<cosθ<1）
     (1) △ABD=△ADC より AB·sin2θ=AC·sinθ、AC=4cosθ
     (2) BC²=4+16cos²θ−16cosθcos3θ=−64cos⁴θ+64cos²θ+4、BC=√(−64cos⁴θ+64cos²θ+4)
     (3) x=cos²θ（1/4<x<1）で −64(x−1/2)²+20。最大値 BC=2√5（θ=π/4、このとき ∠A=3π/4、AC=2√2） */
(function () {
  const rad = d => d * Math.PI / 180;
  // 三角形の図：A(0,0)、B(2,0)、C=4cosθ(cos3θ, sin3θ)、D=(B+C)/2
  const tri = (id, deg, o) => {
    o = o || {};
    const t = rad(deg), A = [0, 0], B = [2, 0], r = 4 * Math.cos(t), C = [r * Math.cos(3 * t), r * Math.sin(3 * t)], D = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
    const mid = (P, Q, k) => [P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k];
    const nx = -(C[1] - B[1]), ny = C[0] - B[0], L = Math.hypot(nx, ny), off = [nx / L * 0.2, ny / L * 0.2];   // 辺 BC の外側（A と反対側）へ
    const items = [
      { k: 'poly', pts: [A, B, C], close: true, c: 'w', wd: 2.5 },
      { k: 'seg', a: A, b: D, c: 'b', wd: 2.5 },
      { k: 'angle', o: A, a: B, b: D, rp: 64, label: '2θ', c: 'p', lr: 28, size: 21, n: 2 },
      { k: 'angle', o: A, a: D, b: C, rp: 40, label: 'θ', c: 'y', lr: 14, size: 21 },
      { k: 'pt', at: A, name: 'A', dir: 'sw', c: 'w', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'se', c: 'w', r: 4 },
      { k: 'pt', at: C, name: 'C', dir: 'n', c: 'w', r: 4 }, { k: 'pt', at: D, name: 'D', dir: 'ne', c: 'b', r: 5 },
      { k: 'label', at: [1, -0.22], text: '2', c: 'y', size: 22 },
      { k: 'label', at: [mid(B, D, 0.5)[0] + off[0], mid(B, D, 0.5)[1] + off[1]], text: 'm', c: 'g', size: 22 },
      { k: 'label', at: [mid(D, C, 0.5)[0] + off[0], mid(D, C, 0.5)[1] + off[1]], text: 'm', c: 'g', size: 22 }
    ].concat(o.extra ? o.extra(A, B, C, D) : []);
    const v = o.view || [-2.1, -0.5, 2.7, 3.3], w = o.w || 520;
    return { t: 'fig', id, col: o.col == null ? 1 : o.col, view: v, w, h: Math.round(w * (v[3] - v[1]) / (v[2] - v[0])), items };
  };
  // (3) の 2次関数のグラフ
  const para = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.08, -3, 1.18, 24], w: 470, h: 330, items: [
    { k: 'axes', tx: [[0.25, '1/4'], [0.5, '1/2'], [1, '1']], ty: [[4, '4'], [16, '16'], [20, '20']], xl: 'x', yl: 'BC²' },
    { k: 'fn', f: '-64*x**2+64*x+4', a: 0.25, b: 1, c: 'y' },
    { k: 'fn', f: '-64*x**2+64*x+4', a: 0, b: 0.25, c: 'd', dash: true },
    { k: 'pt', at: [0.25, 16], open: true, c: 'y' }, { k: 'pt', at: [1, 4], open: true, c: 'y', name: '4', dir: 'e', size: 21 }
  ].concat(extra || []) });

  const POINTS = [
    '角の比の条件は、**面積比** か **正弦定理** で辺の比に直す。D が BC の中点なら △ABD $=$ △ADC（底辺が等しく、高さが共通）',
    '$\\cos3\\theta=4\\cos^3\\theta-3\\cos\\theta$ で、余弦定理の式を $\\cos\\theta$ だけの式にする',
    '最大・最小は $x=\\cos^2\\theta$ の2次関数で。$\\theta$ の範囲（$0<3\\theta<\\pi$）から $x$ の範囲を先に出し、軸がその中に入るか確かめる'
  ];

  HB.lesson({
    id: 'kuma24-3b', field: '熊大型　数学（理系）', title: '2024 熊大 理系 第3問の類題② ― 角を2：1に分ける中線と、辺の長さの最大値', level: '2024年度 熊本大学 理系 第3問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$\\triangle\\mathrm{ABC}$ において $\\mathrm{AB}=2$ とする。辺 BC の中点を D とし、$\\angle\\mathrm{BAD}=2\\theta$、$\\angle\\mathrm{DAC}=\\theta$ とする。',
      parts: [
        '(1)　$\\mathrm{AC}=4\\cos\\theta$ であることを示せ。',
        '(2)　BC を $\\cos\\theta$ を用いて表せ。',
        '(3)　BC の最大値と、そのときの $\\theta$ の値を求めよ。'
      ],
      src: '※ 2024年度 熊本大学 前期 理系（数学②）第3問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '三角形の角の条件から辺の長さを $\\cos\\theta$ で表し、その最大値を求める問題です。(1) は証明。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: 'まず図。AB $=2$、D は BC の中点、AD が角 A を $2\\theta$ と $\\theta$ に分けます。$\\angle\\mathrm{BAC}=3\\theta$ です。',
        add: [{ t: 'h', text: '図をかいて、θ の範囲を確かめる' },
          tri('g0', 40, { col: 0, w: 450, view: [-2.1, -0.5, 2.7, 3.3] })] },
      { ask: { type: 'choice', q: '$\\theta$ のとりうる値の範囲は？',
        opts: ['$0<\\theta<\\dfrac{\\pi}{2}$', '$0<\\theta<\\dfrac{\\pi}{6}$', '$0<\\theta<\\dfrac{\\pi}{3}$', '$0<\\theta<\\pi$'], ok: 2,
        why: { 0: '条件は $\\angle\\mathrm{BAC}=3\\theta<\\pi$。$\\theta$ が $\\frac{\\pi}{2}$ 近くだと $3\\theta$ が $\\pi$ をこえます。', 1: '$3\\theta<\\pi$ から $\\theta<\\frac{\\pi}{3}$。$\\frac{\\pi}{6}$ では小さすぎます。', 3: '三角形の1つの角 $3\\theta$ が $\\pi$ より小さい、が条件です。' },
        good: '$0<3\\theta<\\pi$ より $0<\\theta<\\dfrac{\\pi}{3}$。このとき $\\dfrac12<\\cos\\theta<1$ です。',
        add: [{ t: 'm', tex: '0<\\theta<\\frac{\\pi}{3},\\qquad \\frac12<\\cos\\theta<1', note: '(3) で使う' }] } },

      // ---------- (1) ----------
      { clear: true, cols: [0.5, 0.5], part: '(1)', say: '(1) です。わかっているのは「角の比」と「D が中点」ということ。これを辺 AC に結びつける方法を考えます。',
        add: [{ t: 'h', text: '(1)　AC = 4cosθ を示す' },
          tri('g1', 40, { w: 500 })] },
      { ask: { type: 'choice', q: '(1) の方針として、計算がいちばん楽なのは？',
        opts: ['余弦定理で BC², AD² を表す', '面積比（または正弦定理）で角と辺を結ぶ', '座標を入れて、A を原点にする', '中線定理で AD の長さを出す'], ok: 1,
        why: { 0: '余弦定理では AD・BC などの未知の長さが増え、計算がこみ入ります。', 2: 'できなくはないですが、角 $2\\theta$ と $\\theta$ の条件を式にするのが大変です。', 3: '中線定理で出るのは AD の長さだけ。角 $2\\theta,\\ \\theta$ の条件は使えません。' },
        good: '面積 $\\frac12\\cdot\\mathrm{AB}\\cdot\\mathrm{AD}\\sin2\\theta$ のように、角と辺を1つの式で直接結べます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '角の比 → 辺の比 は、面積比か正弦定理で' }] } },
      { say: '△ABD と △ADC は、底辺 BD, DC が等しく、頂点 A からの高さも共通。だから面積は等しい。面積を AD をはさむ形で書きます。',
        add: [{ t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABD}=\\triangle\\mathrm{ADC}\\quad(\\mathrm{BD}=\\mathrm{DC})' },
          { t: 'm', size: 'sm', tex: '\\frac12\\,\\mathrm{AB}\\cdot\\mathrm{AD}\\sin2\\theta=\\frac12\\,\\mathrm{AC}\\cdot\\mathrm{AD}\\sin\\theta' }] },
      { ask: { type: 'choice', q: '$2\\sin2\\theta=\\mathrm{AC}\\sin\\theta$ から、AC は？',
        opts: ['$2\\cos\\theta$', '$\\dfrac{1}{\\cos\\theta}$', '$4\\sin\\theta$', '$4\\cos\\theta$'], ok: 3,
        why: { 0: '$\\sin2\\theta=2\\sin\\theta\\cos\\theta$ の 2 のあと、AB $=2$ もかかります。', 1: '比が逆です。$\\mathrm{AC}\\sin\\theta=2\\sin2\\theta$ なので、AC は $\\sin2\\theta$ の側です。', 2: '$\\sin2\\theta=2\\sin\\theta\\cos\\theta$ で $\\sin\\theta$ は約分されて、$\\cos\\theta$ が残ります。' },
        good: '$\\sin2\\theta=2\\sin\\theta\\cos\\theta$ として、$\\sin\\theta\\neq0$ で割ると $\\mathrm{AC}=2\\cdot2\\cos\\theta=4\\cos\\theta$。',
        add: [{ t: 'ans', label: '(1) 示せた', tex: '\\mathrm{AC}\\sin\\theta=4\\sin\\theta\\cos\\theta\\ \\Rightarrow\\ \\mathrm{AC}=4\\cos\\theta' }] } },
      { ask: { type: 'think', q: '正弦定理でも示してみよう。△ABD と △ADC で正弦定理を使うと？',
        hint: '$\\angle\\mathrm{ADB}+\\angle\\mathrm{ADC}=\\pi$ なので、$\\sin\\angle\\mathrm{ADB}=\\sin\\angle\\mathrm{ADC}$。',
        ans: '$\\dfrac{\\mathrm{BD}}{\\sin2\\theta}=\\dfrac{\\mathrm{AB}}{\\sin\\angle\\mathrm{ADB}}$、$\\dfrac{\\mathrm{DC}}{\\sin\\theta}=\\dfrac{\\mathrm{AC}}{\\sin\\angle\\mathrm{ADC}}$ で BD $=$ DC。割って　$\\dfrac{\\mathrm{AB}}{\\mathrm{AC}}=\\dfrac{\\sin\\theta}{\\sin2\\theta}=\\dfrac{1}{2\\cos\\theta}$',
        after: '面積比と同じ式になります。どちらも「D での角の正弦が等しい」ことと「BD $=$ DC」を使っています。' } },

      // ---------- (2) ----------
      { clear: true, cols: [0.5, 0.5], part: '(2)', say: 'BC は △ABC で余弦定理。2辺 AB $=2$、AC $=4\\cos\\theta$ と、そのはさむ角 $3\\theta$ がわかっています。',
        add: [{ t: 'h', text: '(2)　BC を cosθ で表す' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\mathrm{BC}^2&=\\mathrm{AB}^2+\\mathrm{AC}^2-2\\,\\mathrm{AB}\\cdot\\mathrm{AC}\\cos3\\theta\\\\ &=4+16\\cos^2\\theta-16\\cos\\theta\\cos3\\theta\\end{aligned}' },
          tri('g2', 40, { w: 500, extra: (A, B, C) => [{ k: 'label', at: [C[0] / 2 - 0.3, C[1] / 2], text: '4cosθ', c: 'y', size: 20 }] })] },
      { ask: { type: 'choice', q: '3倍角の公式　$\\cos3\\theta=$ ？',
        opts: ['$3\\cos\\theta-4\\cos^3\\theta$', '$4\\cos^3\\theta-3\\cos\\theta$', '$4\\cos^3\\theta+3\\cos\\theta$', '$2\\cos^3\\theta-\\cos\\theta$'], ok: 1,
        why: { 0: '$\\sin3\\theta=3\\sin\\theta-4\\sin^3\\theta$ の形とまざっています。$\\theta=0$ で $-1$ になってしまいます。', 2: '$\\theta=0$ で $7$ になります。$\\cos0=1$ にならないので誤りです。', 3: '$\\theta=\\frac{\\pi}{3}$ で $-\\frac14$。$\\cos\\pi=-1$ になりません。' },
        good: '$\\cos(2\\theta+\\theta)$ を加法定理で展開すると $4\\cos^3\\theta-3\\cos\\theta$。$\\theta=0$ で 1 になるか、で検算できます。' } },
      { say: '代入して整理します。$c=\\cos\\theta$ と書くと、$-16c(4c^3-3c)=-64c^4+48c^2$。$c^2$ の項をまとめて $64c^2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\mathrm{BC}^2&=4+16c^2-16c(4c^3-3c)\\\\ &=-64c^4+64c^2+4\\end{aligned}', note: '$c=\\cos\\theta$' },
          { t: 'ans', label: '(2) 答', tex: '\\mathrm{BC}=\\sqrt{-64\\cos^4\\theta+64\\cos^2\\theta+4}' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: 'BC が最大 ⇔ BC² が最大。$x=\\cos^2\\theta$ とおくと、BC² は $x$ の2次関数です。まず $x$ の範囲から。',
        add: [{ t: 'h', text: '(3)　BC の最大値' },
          { t: 'm', tex: 'x=\\cos^2\\theta,\\qquad \\mathrm{BC}^2=-64x^2+64x+4' }] },
      { ask: { type: 'choice', q: '$x=\\cos^2\\theta$ の範囲は？（$0<\\theta<\\frac{\\pi}{3}$）',
        opts: ['$0<x<1$', '$\\dfrac12<x<1$', '$\\dfrac14<x<1$', '$\\dfrac14<x<\\dfrac34$'], ok: 2,
        why: { 0: '$\\theta$ の範囲を使っていません。$\\frac12<\\cos\\theta<1$ です。', 1: 'それは $\\cos\\theta$ の範囲。2乗すると $\\frac14<x<1$。', 3: '上の端は、$\\theta\\to0$ で $\\cos^2\\theta\\to1$ です。' },
        good: '$\\dfrac12<\\cos\\theta<1$ の各辺は正なので、2乗して $\\dfrac14<x<1$。',
        add: [{ t: 'm', tex: '\\frac14<x<1' }] } },
      { say: '平方完成すると $-64\\left(x-\\frac12\\right)^2+20$。軸 $x=\\frac12$ は範囲 $\\frac14<x<1$ の中にあるので、頂点で最大になります。',
        add: [{ t: 'm', size: 'sm', tex: '-64x^2+64x+4=-64\\Big(x-\\frac12\\Big)^2+20' },
          para('p1', [{ k: 'seg', a: [0.5, 0], b: [0.5, 20], c: 'p', dash: true, wd: 2 }, { k: 'seg', a: [0, 20], b: [0.5, 20], c: 'p', dash: true, wd: 2 }, { k: 'pt', at: [0.5, 20], c: 'p', name: '頂点', dir: 'ne', size: 20, plain: true }])] },
      { ask: { type: 'choice', q: 'BC の最大値は？',
        opts: ['$20$', '$4$', '$2$', '$2\\sqrt5$'], ok: 3,
        why: { 0: 'それは BC² の最大値。最後に $\\sqrt{\\ }$ をとります。', 1: '$x\\to1$（$\\theta\\to0$）に近づくときの $\\mathrm{BC}^2$ の値。最大は頂点です。', 2: '$\\theta\\to0$ のとき BC $\\to2$。頂点のほうが大きい値です。' },
        good: '$x=\\dfrac12$ で $\\mathrm{BC}^2=20$。$\\mathrm{BC}=\\sqrt{20}=2\\sqrt5$ です。' } },
      { say: '$\\cos^2\\theta=\\frac12$ で $\\cos\\theta>0$ なので $\\cos\\theta=\\frac{\\sqrt2}{2}$。$0<\\theta<\\frac{\\pi}{3}$ より $\\theta=\\frac{\\pi}{4}$ です。',
        add: [{ t: 'ans', label: '(3) 答', text: 'BC の最大値は $2\\sqrt5$　（$\\theta=\\dfrac{\\pi}{4}$ のとき）' }] },

      // ---------- 確かめ ----------
      { clear: true, cols: [0.5, 0.5], part: '確かめ', say: '$\\theta=\\frac{\\pi}{4}$ のとき、$\\angle\\mathrm{BAC}=\\frac{3\\pi}{4}$、AC $=4\\cos\\frac{\\pi}{4}=2\\sqrt2$。余弦定理で BC² $=4+8+8=20$。答えと一致します。',
        add: [{ t: 'h', text: '確かめ：θ＝π/4 の三角形' },
          { t: 'm', tex: '\\mathrm{AB}=2,\\ \\ \\mathrm{AC}=2\\sqrt2,\\ \\ \\angle\\mathrm A=\\frac{3\\pi}{4}' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BC}^2=4+8-2\\cdot2\\cdot2\\sqrt2\\cdot\\Big(-\\frac{\\sqrt2}{2}\\Big)=20' },
          tri('g3', 45, { w: 500, view: [-2.6, -0.5, 2.6, 2.6] })] },
      { ask: { type: 'think', q: '座標で確かめよう。A(0, 0)、B(2, 0)、C$(-2,\\ 2)$ のとき、BC の中点 D で、本当に $\\angle\\mathrm{BAD}=\\dfrac{\\pi}{2}$、$\\angle\\mathrm{DAC}=\\dfrac{\\pi}{4}$？',
        hint: 'D は B と C の中点。AD は $y$ 軸の上にのる。AC の向きは $x$ 軸から何度か。',
        ans: '$\\mathrm D(0,\\ 1)$。AD は $y$ 軸上なので $\\angle\\mathrm{BAD}=\\dfrac{\\pi}{2}$。AC は傾き $-1$ で $x$ 軸から $\\dfrac{3\\pi}{4}$ の向きだから $\\angle\\mathrm{DAC}=\\dfrac{\\pi}{4}$',
        after: 'この三角形は実際に条件をみたすので、最大値 $2\\sqrt5$ は本当にとれる値です。答案では「このとき条件をみたす」と一言そえると安心です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。角の比 → 辺の比（面積・正弦定理）→ 3倍角で cos の式 → 2次関数の最大。図形と三角関数をつなぐ典型の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
