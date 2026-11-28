/* 2024 長崎大 理系 第7問の類題②（自作）：放物線と直線で囲まれた図形を、x 軸と「斜めの直線」のまわりに回した体積
   元の問題はうつしていない（類題①とも別の問題。「放物線と原点を通る直線で囲まれた図形の x 軸まわりの体積」「垂線の足を媒介変数で表し、
   垂線の長さの2乗・原点から足までの長さとその導関数を求め、斜めの軸まわりの体積を置換積分で出して比をとる」
   というねらい・小問の流れだけを合わせ、放物線 y=3x−x²・直線 y=x（傾き 1）に変えた自作問題。①と違い du/dt が端点で 0 になる）。
   答え（python3・sympy で検算ずみ）：C: y=3x−x²、ℓ: y=x、交点 O と (2, 2)
   (1) V1=π∫_0^2{(3x−x²)²−x²}dx=π∫_0^2(x⁴−6x³+8x²)dx=56π/15
   (2) PH: y=−x+4t−t²、H((4t−t²)/2, (4t−t²)/2)
   (3) PH²=t²(2−t)²/2（点と直線の距離 t(2−t)/√2 とも一致）
   (4) u=OH=(4t−t²)/√2、du/dt=√2(2−t)≧0（0≦t≦2、等号は t=2 だけ）、u: 0→2√2
   (5) V2=π∫_0^2 t²(2−t)²/2·√2(2−t)dt=(π/√2)∫_0^2 t²(2−t)³dt=(π/√2)(16/15)=8√2π/15、V1/V2=7√2/2
       （t=1+w で ∫_{−1}^{1}(1−w²)²(1−w)dw=16/15。D の面積 4/3・重心 G(1, 7/5) のパップス・ギュルダンでも V1・V2 が一致） */
(function () {
  const PAR = '3*x-x**2', VIEW = [-0.4, -0.3, 3.2, 2.7];
  const T0 = 0.8, P0 = [T0, 3 * T0 - T0 * T0], xh0 = (4 * T0 - T0 * T0) / 2, H0 = [xh0, xh0];
  const base = (fill) => [
    { k: 'axes', tx: [[1, '1'], [2, '2'], [3, '3']], ty: [[1, '1'], [2, '2']], xl: 'x', yl: 'y' },
    { k: 'area', f: PAR, g: 'x', a: 0, b: 2, c: 'y', alpha: fill == null ? 0.25 : fill },
    { k: 'fn', f: PAR, a: -0.05, b: 3.1, c: 'w', wd: 3, label: 'C', lat: [2.85, 0.65] },
    { k: 'line', m: 1, n: 0, a: -0.15, b: 2.5, c: 'b', wd: 3, label: 'ℓ', lat: [2.55, 2.45] },
    { k: 'pt', at: [2, 2], name: '(2, 2)', dir: 'se', c: 'w', size: 20 }
  ];
  const fig = (id, items, fill) => ({ t: 'fig', id, col: 1, view: VIEW, w: 430, h: 359, items: base(fill).concat(items || []) });
  const PH = [
    { k: 'seg', a: P0, b: H0, c: 'p', wd: 4 },
    { k: 'right', o: H0, a: P0, b: [2, 2], s: 12 },
    { k: 'pt', at: P0, name: 'P', dir: 'nw', c: 'p' }, { k: 'pt', at: H0, name: 'H', dir: 'se', c: 'p' }
  ];
  // (5) 回転体のようす：ℓ について折り返した放物線（うら側の輪郭）と、H での断面（円をななめから見た形）
  const r0 = T0 * (2 - T0) / Math.SQRT2, s2 = Math.SQRT2;
  const SOLID = [
    { k: 'param', x: '3*t-t*t', y: 't', a: 0, b: 2, c: 'd', wd: 2, dash: true },
    { k: 'param', x: `${H0[0]}+${-r0 / s2}*cos(t)+${0.28 * r0 / s2}*sin(t)`, y: `${H0[1]}+${r0 / s2}*cos(t)+${0.28 * r0 / s2}*sin(t)`, a: 0, b: 2 * Math.PI, c: 'g', wd: 3 }
  ];
  const POINTS = [
    '$x$ 軸のまわりは「2乗の差」：$\\pi\\displaystyle\\int\\{(\\text{外の半径})^2-(\\text{内の半径})^2\\}\\,dx$。「差の2乗」にしない',
    '斜めの軸 ℓ のまわりは、垂線の足 H までの長さ $u=\\mathrm{OH}$ を座標にして $V=\\pi\\displaystyle\\int\\mathrm{PH}^2\\,du$。$\\dfrac{du}{dt}\\ge0$（P と H が1対1）を確かめてから $t$ に置換',
    '積分は対称な形にずらすと楽（$t=1+w$ で奇関数の部分は 0）。体積は、重心から軸までの距離でも検算できる'
  ];

  HB.lesson({
    id: 'nagasaki24-7b', field: '長崎大型　数学（理系）', title: '2024 長崎大 理系 第7問の類題② ― 斜めの直線のまわりの回転体と体積の比', level: '2024年度 長崎大学 理系 第7問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '放物線 $C:\\ y=3x-x^2$ と直線 $\\ell:\\ y=x$ で囲まれた図形を $D$ とする。O は原点とする。',
      parts: [
        '(1)　$D$ を $x$ 軸のまわりに 1 回転してできる立体の体積 $V_1$ を求めよ。',
        '(2)　$0\\le t\\le2$ とし，$C$ 上の点 $\\mathrm{P}(t,\\ 3t-t^2)$ から $\\ell$ に垂線 PH を下ろす。直線 PH の方程式と，点 H の座標を $t$ で表せ。',
        '(3)　$\\mathrm{PH}^2$ を $t$ で表せ。',
        '(4)　$u=\\mathrm{OH}$ とする。$u$ を $t$ で表し，$\\dfrac{du}{dt}$ を求めよ。',
        '(5)　$D$ を $\\ell$ のまわりに 1 回転してできる立体の体積 $V_2$ を求めよ。また，$\\dfrac{V_1}{V_2}$ を求めよ。'
      ],
      src: '※ 2024年度 長崎大学 前期 理系（医学部医学科）第7問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', cols: [1], say: '回転体の体積の問題です。軸が $x$ 軸のときと、**斜めの直線** のときの2つを求めて比べます。(2)〜(4) の誘導の意味を考えながら読みましょう。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.55' }] },

      // ---------- 図と方針 ----------
      { clear: true, part: '図と方針', say: 'まず図。$3x-x^2=x$ を解くと $x=0,\\ 2$。交点は O と $(2,\\ 2)$。$0\\le x\\le2$ では放物線が上、ℓ が下です。',
        add: [{ t: 'h', text: '図をかく' },
          { t: 'm', tex: '3x-x^2=x\\iff x(x-2)=0' },
          { t: 'm', tex: '(3x-x^2)-x=x(2-x)\\ge0', note: '$0\\le x\\le2$ で\n放物線が上' },
          fig('f0', [{ k: 'label', at: [1.15, 1.7], text: 'D', c: 'y', size: 26 }])] },
      { say: '軸が2つ出てきます。$x$ 軸のまわりはいつもの方法。**斜めの直線 ℓ のまわり** は、ℓ にそった長さ $u$ を「新しい座標」とみて、ℓ に垂直な断面で考えます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '体積 ＝ 軸に垂直な断面の面積を、軸にそって積分\n$x$ 軸のまわり：断面は輪（ドーナツ形）\nℓ のまわり：断面は半径 PH の円 → $u=\\mathrm{OH}$ で積分' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$x$ 軸に垂直な平面で切ると、断面は外側の半径 $3x-x^2$、内側の半径 $x$ の **輪** です。',
        add: [{ t: 'h', text: '(1)　x 軸のまわりの体積 V₁' },
          fig('f1', [
            { k: 'seg', a: [1.4, 0], b: [1.4, 3 * 1.4 - 1.4 * 1.4], c: 'y', wd: 4 },
            { k: 'seg', a: [1.25, 0], b: [1.25, 1.25], c: 'b', wd: 4 },
            { k: 'label', at: [1.5, 0.8], text: '外 3x−x²', c: 'y', size: 20, anchor: 'start' },
            { k: 'label', at: [1.17, 0.45], text: '内 x', c: 'b', size: 20, anchor: 'end' }])] },
      { ask: { type: 'choice', q: '$V_1=\\pi\\displaystyle\\int_0^2\\big(\\quad\\big)\\,dx$ のかっこに入るのは？',
        opts: ['$(2x-x^2)^2$', '$(3x-x^2)^2$', '$3x-x^2-x$', '$(3x-x^2)^2-x^2$'], ok: 3,
        why: { 0: '「差の2乗」になっています。正しくは「2乗の差」。輪の面積は $\\pi(\\text{外})^2-\\pi(\\text{内})^2$ です。', 1: '内側（$y=x$ より下）はくりぬかれています。その分を引きます。', 2: '断面積は $\\pi\\times(\\text{半径})^2$。2乗を忘れています。' },
        good: '輪の面積 $=\\pi(\\text{外の半径})^2-\\pi(\\text{内の半径})^2$。',
        add: [{ t: 'm', size: 'sm', tex: 'V_1=\\pi\\int_0^2\\{(3x-x^2)^2-x^2\\}\\,dx=\\pi\\int_0^2(x^4-6x^3+8x^2)\\,dx' }] } },
      { say: '計算します。$\\Big[\\frac{x^5}{5}-\\frac{3x^4}{2}+\\frac{8x^3}{3}\\Big]_0^2=\\frac{32}{5}-24+\\frac{64}{3}=\\frac{56}{15}$。',
        add: [{ t: 'm', size: 'sm', tex: '=\\pi\\Big[\\,\\frac{x^5}{5}-\\frac{3x^4}{2}+\\frac{8x^3}{3}\\,\\Big]_0^2=\\pi\\Big(\\frac{32}{5}-24+\\frac{64}{3}\\Big)' },
          { t: 'ans', label: '(1) 答', tex: 'V_1=\\frac{56}{15}\\pi' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。放物線上の点 P から ℓ に垂線 PH を下ろします。ℓ の傾きは 1。それに垂直な直線の傾きを考えます。',
        add: [{ t: 'h', text: '(2)　垂線 PH と点 H' },
          { t: 'm', tex: '\\mathrm{P}(t,\\ 3t-t^2)\\quad(0\\le t\\le2)' },
          fig('f2', PH, 0.15)] },
      { ask: { type: 'choice', q: '直線 PH の傾きは？',
        opts: ['$1$', '$-1$', '$-\\dfrac12$', '$\\dfrac12$'], ok: 1,
        why: { 0: 'それは ℓ の傾き。垂直な直線の傾きは、かけて $-1$ になる値です。', 2: '$-\\frac12$ は、傾き 2 の直線に垂直な直線の傾きです。ℓ の傾きは 1。', 3: '傾き 1 の逆数は 1。符号を変えないと、かけて $+1$ のままです。' },
        good: '$1\\times m=-1$ より $m=-1$。',
        add: [{ t: 'm', tex: 'y=-(x-t)+3t-t^2=-x+4t-t^2', note: '直線 PH' }] } },
      { say: 'ℓ：$y=x$ と連立します。$x=-x+4t-t^2$ から $2x=4t-t^2$、つまり $x=\\frac{4t-t^2}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: 'x=\\frac{4t-t^2}{2},\\qquad y=x=\\frac{4t-t^2}{2}' }] },
      { say: '(2) の答えです。H は ℓ：$y=x$ 上の点なので、$x$ 座標と $y$ 座標が等しくなります。これは検算にも使えます。',
        add: [{ t: 'ans', label: '(2) 答', text: 'PH：$y=-x+4t-t^2$\n$\\mathrm{H}\\left(\\dfrac{4t-t^2}{2},\\ \\dfrac{4t-t^2}{2}\\right)$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。P と H の座標の差をとると、どちらも $t(2-t)$ でくくれます。',
        add: [{ t: 'h', text: '(3)　PH²' },
          { t: 'm', size: 'sm', tex: 'x\\text{ の差}:\\ t-\\frac{4t-t^2}{2}=\\frac{-t(2-t)}{2}' },
          { t: 'm', size: 'sm', tex: 'y\\text{ の差}:\\ 3t-t^2-\\frac{4t-t^2}{2}=\\frac{t(2-t)}{2}' },
          fig('f3', PH, 0.15)] },
      { ask: { type: 'choice', q: '$\\mathrm{PH}^2$ は？',
        opts: ['$t^2(2-t)^2$', '$\\dfrac{t^2(2-t)^2}{4}$', '$\\dfrac{t^2(2-t)^2}{2}$', '$\\dfrac{t(2-t)}{\\sqrt2}$'], ok: 2,
        why: { 0: '分母の $2^2=4$ を忘れ、2つの2乗の和も出していません。', 1: '$x$ の差の2乗だけです。$y$ の差の2乗も足して $\\frac{t^2(2-t)^2}{4}\\times2$。', 3: 'それは PH（2乗する前）です。' },
        good: '$\\dfrac{t^2(2-t)^2}{4}+\\dfrac{t^2(2-t)^2}{4}=\\dfrac{t^2(2-t)^2}{2}$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\mathrm{PH}^2=\\frac{t^2(2-t)^2}{2}' }] } },
      { ask: { type: 'think', q: '点と直線の距離の公式で、PH を確かめよう。（ℓ：$x-y=0$）',
        hint: '点 $(x_0,\\ y_0)$ と直線 $ax+by+c=0$ の距離は $\\dfrac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$。',
        ans: '$\\mathrm{PH}=\\dfrac{|t-(3t-t^2)|}{\\sqrt2}=\\dfrac{t(2-t)}{\\sqrt2}$（$0\\le t\\le2$）',
        after: '2乗すると (3) と一致。PH だけなら公式が速いですが、(4) で H の座標が要るので、誘導どおり H を出しておく意味があります。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。H は ℓ 上の点 $(x,\\ x)$ なので、O からの長さは $\\sqrt{x^2+x^2}=\\sqrt2\\,x$。ここに H の $x$ 座標を入れます。',
        add: [{ t: 'h', text: '(4)　u = OH と du/dt' },
          { t: 'm', tex: 'u=\\mathrm{OH}=\\sqrt{x^2+x^2}=\\sqrt2\\,x', note: '$x$ は H の $x$ 座標' },
          fig('f4', PH.concat([
            { k: 'seg', a: [0, 0], b: H0, c: 'g', wd: 6 },
            { k: 'label', at: [H0[0] / 2, H0[1] / 2], text: 'u', c: 'g', size: 24, dx: 14, dy: 12 }]), 0.15)] },
      { ask: { type: 'choice', q: '$u=\\mathrm{OH}$ を $t$ で表すと？',
        opts: ['$\\dfrac{4t-t^2}{\\sqrt2}$', '$\\dfrac{4t-t^2}{2}$', '$\\sqrt2\\,(4t-t^2)$', '$\\dfrac{3t-t^2}{\\sqrt2}$'], ok: 0,
        why: { 1: 'それは H の $x$ 座標。OH は ℓ にそった斜めの長さです。', 2: '$\\sqrt2\\cdot\\frac{4t-t^2}{2}$ の分母 2 を落としています。', 3: '$3t-t^2$ は P の $y$ 座標。H の座標は $\\frac{4t-t^2}{2}$ です。' },
        good: '$\\sqrt2\\cdot\\dfrac{4t-t^2}{2}=\\dfrac{4t-t^2}{\\sqrt2}$。',
        add: [{ t: 'm', tex: 'u=\\frac{4t-t^2}{\\sqrt2},\\qquad \\frac{du}{dt}=\\frac{4-2t}{\\sqrt2}=\\sqrt2\\,(2-t)' }] } },
      { say: '$0\\le t\\le2$ で $2-t\\ge0$（等号は $t=2$ だけ）。$u$ は増加し、$t:0\\to2$ で $u:0\\to2\\sqrt2$。**P と H が1対1に対応する** ので、$u$ の積分を $t$ に置換できます。',
        add: [{ t: 'ans', label: '(4) 答', text: '$u=\\dfrac{4t-t^2}{\\sqrt2}$，　$\\dfrac{du}{dt}=\\sqrt2\\,(2-t)$' },
          { t: 'p', size: 'sm', text: '$t=2$ で $u=\\dfrac{4}{\\sqrt2}=2\\sqrt2$（O から $(2,\\ 2)$ までの長さ）' }] },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。ℓ に垂直な平面で切ると、断面は半径 PH の円（緑）。点線は、ℓ について折り返した反対側の輪郭です。$u$ にそって積分します。',
        add: [{ t: 'h', text: '(5)　ℓ のまわりの体積 V₂' },
          { t: 'm', tex: 'V_2=\\pi\\int_0^{2\\sqrt2}\\mathrm{PH}^2\\,du' },
          fig('f5', SOLID.concat(PH), 0.15)] },
      { ask: { type: 'choice', q: '$u$ から $t$ に置換する。$du$ と、$t$ の区間の組は？',
        opts: ['$\\sqrt2(2-t)\\,dt$，$0\\to2\\sqrt2$', '$\\sqrt2(2-t)\\,dt$，$0\\to2$', '$dt$，$0\\to2$', '$\\dfrac{dt}{\\sqrt2(2-t)}$，$0\\to2$'], ok: 1,
        why: { 0: '$2\\sqrt2$ は $u$ の値。$t$ の区間は $0\\to2$ です。', 2: '$u$ と $t$ は同じ速さで動きません。$\\frac{du}{dt}$ をかけます。', 3: '逆数です。$du=\\frac{du}{dt}\\,dt$。' },
        good: '$du=\\dfrac{du}{dt}\\,dt$。区間は $u:0\\to2\\sqrt2$ が $t:0\\to2$ になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}V_2&=\\pi\\int_0^2\\frac{t^2(2-t)^2}{2}\\cdot\\sqrt2(2-t)\\,dt\\\\ &=\\frac{\\pi}{\\sqrt2}\\int_0^2t^2(2-t)^3\\,dt\\end{aligned}' }] } },
      { clear: true, cols: [0.6, 0.4], say: '展開してもできますが、$t=1+w$ とずらすと楽です。$t(2-t)=1-w^2$、$2-t=1-w$。$-w(1-w^2)^2$ は奇関数なので、$-1$ から $1$ までの積分は 0。',
        add: [{ t: 'h', text: '(5)　つづき：積分の計算' },
          { t: 'm', size: 'sm', tex: '\\int_0^2t^2(2-t)^3\\,dt', note: '$t=1+w$' },
          { t: 'm', size: 'sm', tex: '=\\int_{-1}^{1}(1-w^2)^2(1-w)\\,dw' },
          { t: 'm', size: 'sm', tex: '=2\\int_0^1(1-2w^2+w^4)\\,dw=2\\cdot\\frac{8}{15}=\\frac{16}{15}' },
          { t: 'box', col: 1, c: 'g', size: 'sm', label: '対称にずらす', text: '$t=1+w$ で区間は $-1\\to1$\n偶関数 → $0\\to1$ の 2 倍\n奇関数 → 0' }] },
      { ask: { type: 'choice', q: '$V_2=\\dfrac{\\pi}{\\sqrt2}\\cdot\\dfrac{16}{15}$ を整理すると？',
        opts: ['$\\dfrac{16}{15}\\pi$', '$\\dfrac{16\\sqrt2}{15}\\pi$', '$\\dfrac{8}{15}\\pi$', '$\\dfrac{8\\sqrt2}{15}\\pi$'], ok: 3,
        why: { 0: '$\\frac{1}{\\sqrt2}$ をかけ忘れています。', 1: '有理化 $\\frac{1}{\\sqrt2}=\\frac{\\sqrt2}{2}$ の分母 2 を落としています。', 2: '$\\frac{16}{2}$ にしただけで、$\\sqrt2$ が残っていません。' },
        good: '$\\dfrac{16\\pi}{15\\sqrt2}=\\dfrac{16\\sqrt2}{30}\\pi=\\dfrac{8\\sqrt2}{15}\\pi$。',
        add: [{ t: 'm', tex: 'V_2=\\frac{16\\pi}{15\\sqrt2}=\\frac{8\\sqrt2}{15}\\pi' }] } },
      { say: '比は $\\dfrac{V_1}{V_2}=\\dfrac{56}{15}\\cdot\\dfrac{15}{8\\sqrt2}=\\dfrac{7}{\\sqrt2}=\\dfrac{7\\sqrt2}{2}$。',
        add: [{ t: 'ans', label: '(5) 答', text: '$V_2=\\dfrac{8\\sqrt2}{15}\\pi$，　$\\dfrac{V_1}{V_2}=\\dfrac{7\\sqrt2}{2}$' }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '検算の道具を1つ。回転体の体積は「図形の面積 × 重心が1周する長さ」（パップス・ギュルダンの定理。教科書の範囲外なので、答案ではなく検算に）。',
        add: [{ t: 'h', text: '別の見方：重心で検算' },
          { t: 'm', size: 'sm', tex: 'S=\\int_0^2(2x-x^2)\\,dx=\\frac43', note: '$D$ の面積' },
          { t: 'm', size: 'sm', tex: '\\mathrm{G}\\Big(1,\\ \\frac{7}{5}\\Big)', note: '$D$ の重心' },
          fig('f6', [
            { k: 'seg', a: [1, 0], b: [1, 1.4], c: 'y', wd: 3, dash: true },
            { k: 'seg', a: [1, 1.4], b: [1.2, 1.2], c: 'b', wd: 4 },
            { k: 'pt', at: [1, 1.4], name: 'G', dir: 'nw', c: 'g' }])] },
      { ask: { type: 'think', q: 'G から ℓ までの距離を求め、$V_2=2\\pi\\times(\\text{その距離})\\times S$ を計算して (5) と一致するか確かめよう。',
        hint: '点と直線の距離の公式。ℓ：$x-y=0$、G$(1,\\ \\frac75)$。',
        ans: '距離 $=\\dfrac{|1-\\frac75|}{\\sqrt2}=\\dfrac{2}{5\\sqrt2}=\\dfrac{\\sqrt2}{5}$。$V_2=2\\pi\\cdot\\dfrac{\\sqrt2}{5}\\cdot\\dfrac43=\\dfrac{8\\sqrt2}{15}\\pi$',
        after: '$x$ 軸のほうも $V_1=2\\pi\\cdot\\frac75\\cdot\\frac43=\\frac{56}{15}\\pi$ で一致します。比は距離の比 $\\frac75\\div\\frac{\\sqrt2}{5}=\\frac{7\\sqrt2}{2}$。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。斜めの軸の回転体は、誘導の (2)〜(4) が「軸にそった座標 $u$ と半径 PH を $t$ で表す」準備になっています。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
