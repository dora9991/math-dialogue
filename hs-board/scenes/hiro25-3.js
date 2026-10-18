/* 2025 広島大 理系 第3問の類題（自作）：数学Ⅱ 三角関数・数学Ⅲ 関数の極限 ― 単位円上の等間隔な3点と、直径の端の点でできる三角形の面積
   元の問題はうつしていない（「単位円上で角が等間隔にならぶ点と決まった点で三角形を作り、面積を角の式で表す」「面積と角のべきの比の極限」
   「面積を正弦で割って余弦の整式に」「2つの面積の比の極限と値域」というねらいと形式だけを合わせた自作問題。
   決まった点は直径の反対側の B(−1, 0)、等間隔の点は θ, 2θ, 3θ の3つ）。
   答え（python3・sympy で検算ずみ。0<θ<π/3 で面積の符号も数値で確認）：
   B(−1,0)、P(α)、Q(β)（0<α<β<π）の三角形の面積 = (1/2){sin(β−α)+sinβ−sinα}
   (1) S₃=(1−cosθ)sinθ（P₁P₂=P₂P₃=2sin(θ/2)、∠P₁P₂P₃=π−θ）、lim S₃/θ³=1/2
   (2) S₁=sinθcosθ、S₂=sinθcosθ(2cosθ−1)（3倍角）、S₁−S₂=2sinθcosθ(1−cosθ)、lim (S₁−S₂)/θ³=1
   (3) S₄/sinθ=2cos²θ+cosθ−1（=(2cosθ−1)(cosθ+1)）
   (4) S₂/S₄=cosθ/(cosθ+1) → 1/2、値域 1/3 < S₂/S₄ < 1/2（cosθ が 1/2〜1 を動き、増加関数）
   検算：S₁+S₂=S₃+S₄=2sinθcos²θ（四角形 BP₁P₂P₃ の2通りの分け方）、S₁−S₂=2cosθ·S₃ */
(function () {
  const TH = 0.6, cs = Math.cos, sn = Math.sin;
  const B = [-1, 0], P1 = [cs(TH), sn(TH)], P2 = [cs(2 * TH), sn(2 * TH)], P3 = [cs(3 * TH), sn(3 * TH)];
  const POINTS = [
    'B$(-1,\\ 0)$ を頂点とする三角形は、ベクトルの面積公式で $\\frac12\\{\\sin(\\beta-\\alpha)+\\sin\\beta-\\sin\\alpha\\}$。3倍角で $\\sin\\theta$ をくくり出す',
    '極限は $\\dfrac{\\sin\\theta}{\\theta}\\to1$ と $\\dfrac{1-\\cos\\theta}{\\theta^2}\\to\\dfrac12$ の組み合わせ。**差をとると次数が上がる**（$S_1-S_2$ は $\\theta^3$ の速さ）',
    '比の範囲は $\\cos\\theta=t$ とおいて $t$ の関数に。$t$ の動く範囲（$\\frac12<t<1$）と、端をふくむかどうかに注意'
  ];
  const circ = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-1.4, -0.42, 1.4, 1.3], w: Math.round((h || 390) * 2.8 / 1.72), h: h || 390, items: [
    { k: 'axes', tx: [], ty: [], o: false },
    { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5, clip: true },
    { k: 'label', at: [0, 0], text: 'O', dx: -14, dy: 20, size: 21 }].concat(items || []).concat([
    { k: 'pt', at: B, name: 'B', dir: 'sw', c: 'w', size: 22 },
    { k: 'pt', at: P1, name: 'P₁', dir: 'e', c: 'p', size: 22 }, { k: 'pt', at: P2, name: 'P₂', dir: 'ne', c: 'p', size: 22 }, { k: 'pt', at: P3, name: 'P₃', dir: 'n', c: 'p', size: 22 }]) });
  const rays = [{ k: 'seg', a: [0, 0], b: P1, c: 'd', dash: true, wd: 1.5 }, { k: 'seg', a: [0, 0], b: P2, c: 'd', dash: true, wd: 1.5 }, { k: 'seg', a: [0, 0], b: P3, c: 'd', dash: true, wd: 1.5 },
    { k: 'label', at: [0.33, 0.1], text: 'θ', c: 'y', size: 20 }, { k: 'label', at: [0.26, 0.31], text: 'θ', c: 'y', size: 20 }, { k: 'label', at: [0.07, 0.38], text: 'θ', c: 'y', size: 20 }];
  const T1 = { k: 'poly', pts: [B, P1, P2], close: true, c: 'y', fill: 'y', alpha: 0.22, wd: 2 };
  const T2 = { k: 'poly', pts: [B, P2, P3], close: true, c: 'b', fill: 'b', alpha: 0.25, wd: 2 };
  const T3 = { k: 'poly', pts: [P1, P2, P3], close: true, c: 'p', fill: 'p', alpha: 0.35, wd: 2.5 };
  const T4 = { k: 'poly', pts: [B, P1, P3], close: true, c: 'g', fill: 'g', alpha: 0.2, wd: 2 };

  HB.lesson({
    id: 'hiro25-3', field: '広島大型　数学（理系）', title: '2025 広島大 理系 第3問の類題 ― 単位円上の等間隔な点と三角形の面積の極限', level: '2025年度 広島大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '座標平面の単位円 $x^2+y^2=1$ 上に、点 $\\mathrm{B}(-1,\\ 0)$ と3点 $\\mathrm{P}_k(\\cos k\\theta,\\ \\sin k\\theta)\\ (k=1,\\ 2,\\ 3)$ をとる。ただし $0<\\theta<\\dfrac{\\pi}{3}$ とする。$\\triangle\\mathrm{BP_1P_2}$，$\\triangle\\mathrm{BP_2P_3}$，$\\triangle\\mathrm{P_1P_2P_3}$ の面積を、それぞれ $S_1,\\ S_2,\\ S_3$ とする。',
      parts: [
        '(1)　$S_3$ を $\\theta$ を用いて表し、$\\displaystyle\\lim_{\\theta\\to+0}\\frac{S_3}{\\theta^3}$ を求めよ。',
        '(2)　$S_1,\\ S_2$ を $\\theta$ を用いて表し、$\\displaystyle\\lim_{\\theta\\to+0}\\frac{S_1-S_2}{\\theta^3}$ を求めよ。',
        '(3)　$\\triangle\\mathrm{BP_1P_3}$ の面積を $S_4$ とする。$\\dfrac{S_4}{\\sin\\theta}$ を $\\cos\\theta$ の整式で表せ。',
        '(4)　$\\displaystyle\\lim_{\\theta\\to+0}\\frac{S_2}{S_4}$ を求めよ。また、$\\theta$ が $0<\\theta<\\dfrac{\\pi}{3}$ の範囲を動くとき、$\\dfrac{S_2}{S_4}$ のとりうる値の範囲を求めよ。'
      ],
      src: '※ 2025年度 広島大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '三角関数の公式と極限を組み合わせる問題です。面積を $\\theta$ の式にできれば、あとは極限と関数の値域の問題になります。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '右の図は $\\theta=0.6$ の場合。$\\mathrm{P}_1,\\ \\mathrm{P}_2,\\ \\mathrm{P}_3$ は円周上に角 $\\theta$ ずつならび、B は円の左はしにあります。$\\theta<\\frac{\\pi}3$ なので $\\mathrm{P}_3$ は上半分です。',
        add: [{ t: 'h', text: '図で見ると' },
          { t: 'p', size: 'sm', text: '黄：$S_1=\\triangle\\mathrm{BP_1P_2}$\n青：$S_2=\\triangle\\mathrm{BP_2P_3}$\n桃：$S_3=\\triangle\\mathrm{P_1P_2P_3}$（細長い三角形）' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　弦の長さと円周角で $S_3$\n(2)(3)　B を始点とするベクトルの面積公式\n極限は $\\dfrac{\\sin\\theta}{\\theta}\\to1,\\ \\dfrac{1-\\cos\\theta}{\\theta^2}\\to\\dfrac12$' },
          circ('c0', rays.concat([T1, T2, T3]))] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。弦 $\\mathrm{P_1P_2}$ の中心角は $\\theta$ なので、長さは $2\\sin\\frac\\theta2$。$\\mathrm{P_2P_3}$ も同じ長さです。2辺とその間の角で面積を出します。',
        add: [{ t: 'h', text: '(1)　S₃ と、その極限' },
          { t: 'm', tex: '\\mathrm{P_1P_2}=\\mathrm{P_2P_3}=2\\sin\\frac\\theta2', note: '中心角 $\\theta$ の弦' },
          circ('c1', [T3, { k: 'seg', a: [0, 0], b: P1, c: 'd', dash: true, wd: 1.5 }, { k: 'seg', a: [0, 0], b: P3, c: 'd', dash: true, wd: 1.5 }, { k: 'arc', o: [0, 0], rp: 26, a1: TH * 180 / Math.PI, a2: 3 * TH * 180 / Math.PI, c: 'y', label: '2θ', lr: 16 }])] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{P_1P_2P_3}$ の大きさは？',
        opts: ['$\\theta$', '$\\pi-2\\theta$', '$2\\theta$', '$\\pi-\\theta$'], ok: 3,
        why: { 0: 'それは $\\mathrm{P}_2$ を **ふくむ** 側の弧（中心角 $2\\theta$）に対する円周角。$\\mathrm{P}_2$ から見るのは反対側の弧です。', 1: '円周角は中心角の半分。$\\frac{2\\pi-2\\theta}{2}$ を計算し直しましょう。', 2: '$2\\theta$ は弧 $\\mathrm{P_1P_3}$ の中心角です。' },
        good: '$\\mathrm{P}_2$ から見る弧 $\\mathrm{P_1P_3}$ は、$\\mathrm{P}_2$ をふくまない側で中心角 $2\\pi-2\\theta$。円周角はその半分の $\\pi-\\theta$。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{P_1P_2P_3}=\\pi-\\theta', note: '円周角の定理' }] } },
      { say: '面積は $\\frac12\\cdot\\left(2\\sin\\frac\\theta2\\right)^2\\sin(\\pi-\\theta)$。半角の公式 $2\\sin^2\\frac\\theta2=1-\\cos\\theta$ でまとめます。',
        add: [{ t: 'm', tex: 'S_3=\\frac12\\Big(2\\sin\\frac\\theta2\\Big)^2\\sin(\\pi-\\theta)=(1-\\cos\\theta)\\sin\\theta' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{\\theta\\to+0}\\frac{S_3}{\\theta^3}$ は？',
        opts: ['$1$', '$0$', '$\\dfrac12$', '$2$'], ok: 2,
        why: { 0: '$\\frac{1-\\cos\\theta}{\\theta^2}$ の極限は 1 ではなく $\\frac12$ です。', 1: '分子も $\\theta^3$ と同じ速さで 0 に近づくので、比は 0 になりません。', 3: '$\\frac{1-\\cos\\theta}{\\theta^2}\\to\\frac12$ を、逆数の 2 にしています。' },
        good: '$\\dfrac{S_3}{\\theta^3}=\\dfrac{1-\\cos\\theta}{\\theta^2}\\cdot\\dfrac{\\sin\\theta}{\\theta}\\to\\dfrac12\\cdot1$。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'S_3=(1-\\cos\\theta)\\sin\\theta,\\quad \\lim_{\\theta\\to+0}\\frac{S_3}{\\theta^3}=\\frac12' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: 'B を頂点とする三角形は、ベクトルの面積公式が便利です。$\\overrightarrow{\\mathrm{BP}}=(\\cos\\alpha+1,\\ \\sin\\alpha)$、$\\overrightarrow{\\mathrm{BQ}}=(\\cos\\beta+1,\\ \\sin\\beta)$ で計算すると、次の形になります。',
        add: [{ t: 'h', text: '(2)　S₁, S₂ と、差の極限' },
          { t: 'box', c: 'b', size: 'sm', label: '面積公式', text: '$\\triangle\\mathrm{BPQ}=\\frac12|x_1y_2-x_2y_1|$ より\nP$(\\alpha)$，Q$(\\beta)$（$0<\\alpha<\\beta<\\pi$）のとき\n$\\triangle\\mathrm{BPQ}=\\frac12\\{\\sin(\\beta-\\alpha)+\\sin\\beta-\\sin\\alpha\\}$' },
          { t: 'm', size: 'sm', tex: 'S_1=\\frac12(\\sin\\theta+\\sin2\\theta-\\sin\\theta)=\\sin\\theta\\cos\\theta', note: '$\\alpha=\\theta,\\ \\beta=2\\theta$' },
          circ('c2', [T1, T2], 300)] },
      { say: '$S_2$ は $\\alpha=2\\theta,\\ \\beta=3\\theta$。**3倍角の公式** $\\sin3\\theta=3\\sin\\theta-4\\sin^3\\theta$ を使って、$\\sin\\theta$ と $\\cos\\theta$ だけの式にします。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S_2&=\\frac12(\\sin\\theta+\\sin3\\theta-\\sin2\\theta)\\\\&=\\frac12(4\\sin\\theta-4\\sin^3\\theta-2\\sin\\theta\\cos\\theta)\\\\&=\\sin\\theta\\cos\\theta\\,(2\\cos\\theta-1)\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$S_1-S_2$ は？',
        opts: ['$2\\sin\\theta\\cos\\theta\\,(1-\\cos\\theta)$', '$-2\\sin\\theta\\cos^2\\theta$', '$\\sin\\theta\\cos\\theta\\,(1-\\cos\\theta)$', '$2\\sin\\theta\\,(1-\\cos\\theta)$'], ok: 0,
        why: { 1: '$1-(2\\cos\\theta-1)=2-2\\cos\\theta$。かっこの中の $-1$ の符号です。', 2: '$2-2\\cos\\theta$ の 2 をくくり出し忘れています。', 3: '共通因数の $\\cos\\theta$ が落ちています。' },
        good: '$\\sin\\theta\\cos\\theta\\{1-(2\\cos\\theta-1)\\}=2\\sin\\theta\\cos\\theta(1-\\cos\\theta)$。',
        add: [{ t: 'm', tex: 'S_1-S_2=2\\sin\\theta\\cos\\theta\\,(1-\\cos\\theta)' }] } },
      { clear: true, cols: [1], part: '(2) 極限', say: '$S_1$ と $S_2$ はどちらも $\\theta$ と同じ速さで 0 に近づきますが、差は $\\theta^3$ の速さ。(1) と同じ2つの極限で計算できます。',
        add: [{ t: 'h', text: '(2)　(S₁ − S₂)/θ³ の極限' },
          { t: 'm', tex: '\\frac{S_1-S_2}{\\theta^3}=2\\cos\\theta\\cdot\\frac{\\sin\\theta}{\\theta}\\cdot\\frac{1-\\cos\\theta}{\\theta^2}\\ \\longrightarrow\\ 2\\cdot1\\cdot1\\cdot\\frac12=1' },
          { t: 'ans', label: '(2) 答', text: '$S_1=\\sin\\theta\\cos\\theta$，　$S_2=\\sin\\theta\\cos\\theta\\,(2\\cos\\theta-1)$\n$\\displaystyle\\lim_{\\theta\\to+0}\\frac{S_1-S_2}{\\theta^3}=1$' },
          { t: 'box', c: 'g', size: 'sm', label: '気づき', text: '$S_1-S_2=2\\cos\\theta\\cdot S_3$。差の極限が (1) の極限の $2$ 倍になっているのは、このためです。' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$S_4=\\triangle\\mathrm{BP_1P_3}$ は、公式で $\\alpha=\\theta,\\ \\beta=3\\theta$。$\\sin\\theta$ で割ると、$\\sin2\\theta$ と $\\sin3\\theta$ から $\\sin\\theta$ が1つずつ消えます。',
        add: [{ t: 'h', text: '(3)　S₄ / sin θ を cos θ の整式に' },
          { t: 'm', size: 'sm', tex: 'S_4=\\frac12(\\sin2\\theta+\\sin3\\theta-\\sin\\theta)' },
          { t: 'm', size: 'sm', tex: '\\frac{S_4}{\\sin\\theta}=\\frac12\\{2\\cos\\theta+(3-4\\sin^2\\theta)-1\\}' },
          circ('c3', [T4], 300)] },
      { ask: { type: 'choice', q: '$\\sin^2\\theta=1-\\cos^2\\theta$ を入れて整理すると、$\\dfrac{S_4}{\\sin\\theta}$ は？',
        opts: ['$2\\cos^2\\theta+\\cos\\theta+1$', '$4\\cos^2\\theta+2\\cos\\theta-2$', '$2\\cos^2\\theta-\\cos\\theta$', '$2\\cos^2\\theta+\\cos\\theta-1$'], ok: 3,
        why: { 0: '$-4\\sin^2\\theta=-4+4\\cos^2\\theta$。定数の $-4$ を落としています。', 1: '前の $\\frac12$ をかけ忘れています。', 2: 'それは $\\frac{S_2}{\\sin\\theta}$ です。' },
        good: '$\\frac12(2\\cos\\theta+2-4+4\\cos^2\\theta)=2\\cos^2\\theta+\\cos\\theta-1$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\frac{S_4}{\\sin\\theta}=2\\cos^2\\theta+\\cos\\theta-1' },
          { t: 'p', size: 'sm', text: '因数分解すると　$(2\\cos\\theta-1)(\\cos\\theta+1)$' }] } },
      { ask: { type: 'think', q: '四角形 $\\mathrm{BP_1P_2P_3}$ を、対角線 $\\mathrm{BP_2}$ と $\\mathrm{P_1P_3}$ の2通りで分けると、$S_1+S_2=S_3+S_4$ のはず。式で確かめよう。',
        hint: 'どちらも $\\sin\\theta$ でくくって、かっこの中を比べる。',
        ans: '$S_1+S_2=\\sin\\theta\\cos\\theta\\cdot2\\cos\\theta=2\\sin\\theta\\cos^2\\theta$\n$S_3+S_4=\\sin\\theta\\{(1-\\cos\\theta)+(2\\cos^2\\theta+\\cos\\theta-1)\\}=2\\sin\\theta\\cos^2\\theta$',
        after: '図形の関係で検算すると、(1)〜(3) の式の計算ミスに気づけます。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$S_2$ と $S_4$ の比をとると、$\\sin\\theta$ が消えます。さらに $2\\cos\\theta-1$ が共通です。',
        add: [{ t: 'h', text: '(4)　S₂ / S₄ の極限と、値の範囲' },
          { t: 'm', tex: '\\frac{S_2}{S_4}=\\frac{\\cos\\theta\\,(2\\cos\\theta-1)}{(2\\cos\\theta-1)(\\cos\\theta+1)}' }] },
      { ask: { type: 'choice', q: '$2\\cos\\theta-1$ で約分してよい理由は？',
        opts: ['$0<\\theta<\\frac\\pi3$ より $2\\cos\\theta-1>0$', '$\\theta\\to+0$ を考えているから', '$\\cos\\theta\\neq0$ だから', '約分はいつでもしてよい'], ok: 0,
        why: { 1: '後半は $\\theta$ が $0<\\theta<\\frac\\pi3$ 全体を動くときの話。極限だけの話ではありません。', 2: '必要なのは、割る式 $2\\cos\\theta-1$ が 0 でないことです。', 3: '0 で割ることはできません。0 でない理由が必要です。' },
        good: '$0<\\theta<\\frac\\pi3$ では $\\frac12<\\cos\\theta<1$。だから $2\\cos\\theta-1\\neq0$ です（$S_2>0$ の理由でもあります）。',
        add: [{ t: 'm', tex: '\\frac{S_2}{S_4}=\\frac{\\cos\\theta}{\\cos\\theta+1}=1-\\frac1{\\cos\\theta+1}' },
          { t: 'm', tex: '\\lim_{\\theta\\to+0}\\frac{S_2}{S_4}=\\frac{1}{1+1}=\\frac12' }] } },
      { say: '$t=\\cos\\theta$ とおくと、$\\theta$ が $0<\\theta<\\frac\\pi3$ を動くとき、$t$ は $\\frac12<t<1$ を動きます。$g(t)=1-\\dfrac1{t+1}$ は増加関数です。',
        add: [{ t: 'fig', id: 'g4', col: 1, view: [-0.28, -0.1, 1.3, 0.66], w: 520, h: 290, items: [
          { k: 'axes', tx: [[0.5, '1/2'], [1, '1']], ty: [[1 / 3, '1/3'], [0.5, '1/2']], xl: 't', yl: '' },
          { k: 'fn', f: 'x/(x+1)', a: 0, b: 1.2, c: 'd', dash: true },
          { k: 'fn', f: 'x/(x+1)', a: 0.5, b: 1, c: 'y', wd: 5 },
          { k: 'seg', a: [0.5, 0], b: [0.5, 1 / 3], c: 'd', dash: true, wd: 1.5 }, { k: 'seg', a: [1, 0], b: [1, 0.5], c: 'd', dash: true, wd: 1.5 },
          { k: 'pt', at: [0.5, 1 / 3], c: 'y', open: true }, { k: 'pt', at: [1, 0.5], c: 'y', open: true },
          { k: 'label', at: [0.05, 0.61], text: 'y = t/(t+1)', c: 'y', size: 20, anchor: 'start' }] }] },
      { ask: { type: 'choice', q: '$\\dfrac{S_2}{S_4}$ のとりうる値の範囲は？',
        opts: ['$0<\\frac{S_2}{S_4}<\\frac12$', '$\\frac13<\\frac{S_2}{S_4}<\\frac12$', '$\\frac13\\leqq\\frac{S_2}{S_4}\\leqq\\frac12$', '$\\frac12<\\frac{S_2}{S_4}<\\frac23$'], ok: 1,
        why: { 0: '$t=\\frac12$ で $g=\\frac13$。0 までは下がりません。', 2: '$t$ は $\\frac12$ にも $1$ にもならないので、等号は入りません。', 3: '$g(t)$ は増加。$t\\to1$ で $\\frac12$ に近づきます。' },
        good: '$g(t)$ は増加で、$g\\left(\\frac12\\right)=\\frac13,\\ g(1)=\\frac12$。端はとらないので等号なし。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\lim_{\\theta\\to+0}\\frac{S_2}{S_4}=\\frac12,\\qquad \\frac13<\\frac{S_2}{S_4}<\\frac12' }] } },
      { ask: { type: 'think', q: '$\\theta\\to\\dfrac\\pi3-0$ のとき、$S_2$ はどうなる？ 図で言うと、何が起きている？',
        hint: '$\\theta=\\frac\\pi3$ では $3\\theta=\\pi$。',
        ans: '$S_2=\\sin\\theta\\cos\\theta\\,(2\\cos\\theta-1)\\to0$。$\\mathrm{P}_3$ が B に近づき、$\\triangle\\mathrm{BP_2P_3}$ がつぶれる',
        after: '$S_4$ も同じ因数 $2\\cos\\theta-1$ をもつので、比 $\\frac{S_2}{S_4}$ は 0 にならず $\\frac13$ に近づきます。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '記述式では、面積公式の出どころ、極限で使う基本の極限、値域の端をふくまない理由を、きちんと書きます。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '面積', text: '「$\\overrightarrow{\\mathrm{BP}}=(\\cos\\alpha+1,\\ \\sin\\alpha)$ … より $\\frac12|x_1y_2-x_2y_1|$」と公式の出どころを1行。$0<\\theta<\\frac\\pi3$ で中身が正であることにもふれる。' },
          { t: 'box', c: 'y', size: 'sm', label: '極限', text: '「$\\displaystyle\\lim_{\\theta\\to0}\\frac{\\sin\\theta}{\\theta}=1$」から $\\dfrac{1-\\cos\\theta}{\\theta^2}=\\dfrac{\\sin^2\\theta}{\\theta^2(1+\\cos\\theta)}\\to\\dfrac12$ を導いて使う。' },
          { t: 'box', c: 'p', size: 'sm', label: '値域', text: '「$t=\\cos\\theta$ は $\\frac12<t<1$ のすべての値をとり、$g(t)$ は単調増加で連続」→ 端をふくまない範囲。' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角関数の公式で面積を整理し、極限と関数の値域につなげる問題でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
