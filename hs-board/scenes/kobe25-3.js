/* 神戸大型（理系）2025 第3問の類題（自作）：数学C 媒介変数表示・数学Ⅲ 積分法 ― 絶対値をふくむ媒介変数表示の閉じた曲線の概形と面積
   元の問題はうつしていない（「正弦・余弦と絶対値をふくむ媒介変数表示の閉じた曲線」「絶対値をはずして区間ごとに増減を調べて概形」
   「囲まれた部分の面積を媒介変数での置換積分で求める（対称性も使う）」というねらいと形式だけを合わせた自作問題）。
   C：x=(1+|sin t|)cos t、y=(1+|cos t|)sin t（0≦t≦2π）。t→−t で (x,−y)、t→π−t で (−x,y)、t→π/2−t で (y,x)。
   0≦t≦π/2：dx/dt=cos2t−sin t=−(2sin t−1)(sin t+1)、dy/dt=cos t+cos2t=(2cos t−1)(cos t+1)。
   t=0 (1,0)、π/6 (3√3/4, 1/2+√3/4)、π/4 (1/2+√2/2, 同)、π/3 (1/2+√3/4, 3√3/4)、π/2 (0,1)。(1,0) では向き (1,2) → 下からは (−1,2) で入る → とがった点。
   第1象限の部分の面積 S₁=∫(上側)−∫(下側)=−∫₀^{π/2} y (dx/dt) dt=∫₀^{π/2}(1+cos t)sin t (sin t−cos2t) dt
     =∫sin²t − ∫sin t cos2t + ∫sin²t cos t − ∫sin t cos t cos2t = π/4 + 1/3 + 1/3 − 0 = π/4+2/3。
   S=4S₁=π+8/3≒5.808（多角形近似（shoelace）でも一致）。上側だけの積分 ≒1.5585、下側 ≒0.1065。python3（sympy・numpy）で検算ずみ。 */
(function () {
  const PI = Math.PI;
  const X = t => (1 + Math.abs(Math.sin(t))) * Math.cos(t), Y = t => (1 + Math.abs(Math.cos(t))) * Math.sin(t);
  const arc = (a, b, n) => { const r = []; for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; r.push([X(t), Y(t)]); } return r; };
  const CX = '(1+abs(sin(t)))*cos(t)', CY = '(1+abs(cos(t)))*sin(t)';
  const r3 = Math.sqrt(3), P6 = [3 * r3 / 4, 0.5 + r3 / 4], P3 = [0.5 + r3 / 4, 3 * r3 / 4];
  const POINTS = [
    '絶対値は $\\sin t,\\ \\cos t$ の符号で外す。$t\\to-t$、$t\\to\\pi-t$ の **対称性** で、$0\\le t\\le\\dfrac{\\pi}{2}$ だけ調べればよい',
    '増減は $\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}$ を因数分解して表に。向き（↗↖↙↘）と、$t=0$ のような **とがった点** にも注意',
    '$x$ が行って戻っても、$S=-\\displaystyle\\int y\\,\\frac{dx}{dt}\\,dt$ で「上側 − 下側」が自動で計算される。積分区間は $t$ で'
  ];
  // 全体の図
  const full = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-1.75, -1.75, 1.75, 1.75], w: h || 400, h: h || 400, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1, '1']] },
    { k: 'circle', o: [0, 0], r: 1, c: 'd', wd: 1.5, dash: true }].concat(extra || []) });
  // 第1象限の図
  const quad = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-0.3, -0.3, 1.6, 1.6], w: h || 400, h: h || 400, items: [
    { k: 'axes', tx: [], ty: [] }].concat(extra || []) });
  const Cq = { k: 'param', x: CX, y: CY, a: 0, b: PI / 2, c: 'w', wd: 3.5 };
  const Cfull = { k: 'param', x: CX, y: CY, a: 0, b: 2 * PI, n: 720, c: 'w', wd: 3.5, label: 'C', lat: [1.25, 1.55] };
  const marks = [
    { k: 'pt', at: [1, 0], name: 't = 0', dir: 's', c: 'g', size: 20 },
    { k: 'pt', at: P6, name: 't = π/6', dir: 'e', c: 'y', size: 20 },
    { k: 'pt', at: P3, name: 't = π/3', dir: 'n', c: 'y', size: 20 },
    { k: 'pt', at: [0, 1], name: 't = π/2', dir: 'w', c: 'g', size: 20 }];
  // 面積の分け方：上側（π/6≦t≦π/2）の下の部分と、下側（0≦t≦π/6）の下の部分
  const upperPoly = arc(PI / 6, PI / 2, 60).concat([[0, 0], [P6[0], 0]]);
  const lowerPoly = arc(0, PI / 6, 30).concat([[P6[0], 0]]);
  const regionPoly = arc(0, PI / 2, 90).concat([[0, 0]]);

  HB.lesson({
    id: 'kobe25-3', noDec: true, field: '神戸大型　数学（理系）', title: '2025 神戸大 理系 第3問の類題 ― 絶対値をふくむ媒介変数表示の曲線と面積', level: '2025年度 神戸大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '媒介変数 $t$ を用いて\n$x=(1+|\\sin t|)\\cos t,\\quad y=(1+|\\cos t|)\\sin t\\quad(0\\le t\\le2\\pi)$\nと表される曲線を $C$ とする。',
      parts: [
        '(1)　曲線 $C$ の概形をかけ。',
        '(2)　曲線 $C$ で囲まれた部分の面積 $S$ を求めよ。'
      ],
      src: '※ 2025年度 神戸大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '絶対値をふくむ媒介変数表示の曲線です。(1) で形をつかみ、(2) で面積を置換積分で求めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針：絶対値と対称性 ----------
      { clear: true, part: '方針', say: '絶対値は $\\sin t,\\ \\cos t$ の符号で外します。でも4つの区間を全部調べるのは大変。先に **対称性** を調べて、調べる範囲をへらします。',
        add: [{ t: 'h', text: '方針：対称性で調べる範囲をへらす' },
          { t: 'm', tex: 'x=(1+|\\sin t|)\\cos t,\\quad y=(1+|\\cos t|)\\sin t' }] },
      { ask: { type: 'choice', q: '$t$ を $-t$ にかえると、点 $(x,\\ y)$ はどの点にうつる？',
        opts: ['$(-x,\\ y)$', '$(x,\\ -y)$', '$(-x,\\ -y)$', '$(y,\\ x)$'], ok: 1,
        why: { 0: '$\\cos(-t)=\\cos t$ なので、$x$ は変わりません。', 2: '$x$ は変わりません。$|\\sin(-t)|=|\\sin t|$、$\\cos(-t)=\\cos t$ です。', 3: 'それは $t\\to\\frac{\\pi}{2}-t$ のとき。$t\\to-t$ では $y$ の符号だけ変わります。' },
        good: '$|\\sin(-t)|=|\\sin t|$、$\\cos(-t)=\\cos t$、$\\sin(-t)=-\\sin t$ なので $(x,\\ -y)$。C は $x$ 軸について対称です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['おきかえ', 'うつる点', '対称の軸'], ['$t\\to-t$', '$(x,\\ -y)$', '$x$ 軸'], ['$t\\to\\pi-t$', '$(-x,\\ y)$', '$y$ 軸'], ['$t\\to\\frac{\\pi}{2}-t$', '$(y,\\ x)$', '直線 $y=x$']] },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '$0\\le t\\le\\dfrac{\\pi}{2}$（第1象限）だけ調べて、\n$x$ 軸・$y$ 軸で折り返す' }] } },

      // ---------- (1) 増減 ----------
      { clear: true, part: '(1)', say: '$0\\le t\\le\\frac{\\pi}{2}$ では $\\sin t\\ge0,\\ \\cos t\\ge0$ なので、絶対値はそのまま外れます。$x$ を $t$ で微分します。',
        add: [{ t: 'h', text: '(1)　0 ≦ t ≦ π/2 での増減' },
          { t: 'm', tex: 'x=(1+\\sin t)\\cos t,\\quad y=(1+\\cos t)\\sin t' },
          { t: 'm', size: 'sm', tex: '\\frac{dx}{dt}=\\cos^2t-(1+\\sin t)\\sin t=1-\\sin t-2\\sin^2t', note: '$\\cos^2t=1-\\sin^2t$' }] },
      { ask: { type: 'choice', q: '$\\dfrac{dx}{dt}=1-\\sin t-2\\sin^2t$ を因数分解すると？',
        opts: ['$(2\\sin t-1)(\\sin t+1)$', '$-(2\\sin t-1)(\\sin t+1)$', '$-(2\\sin t+1)(\\sin t-1)$', '$(1-\\sin t)(1+2\\sin t)$'], ok: 1,
        why: { 0: '符号が逆です。展開すると $2\\sin^2t+\\sin t-1$ になります。', 2: '展開すると $-2\\sin^2t+\\sin t+1$。$\\sin t$ の項の符号がちがいます。', 3: '展開すると $1+\\sin t-2\\sin^2t$。$\\sin t$ の項の符号がちがいます。' },
        good: '$s=\\sin t$ とおくと $1-s-2s^2=-(2s^2+s-1)=-(2s-1)(s+1)$。$\\sin t=\\frac12$（$t=\\frac{\\pi}{6}$）で 0 です。',
        add: [{ t: 'm', tex: '\\frac{dx}{dt}=-(2\\sin t-1)(\\sin t+1)' },
          { t: 'm', tex: '\\frac{dy}{dt}=(2\\cos t-1)(\\cos t+1)', note: '同じ計算で\n（$t=\\frac{\\pi}{3}$ で 0）' }] } },
      { clear: true, cols: [0.58, 0.42], say: '増減表にまとめます。$x$ は $t=\\frac{\\pi}{6}$ で最大、$y$ は $t=\\frac{\\pi}{3}$ で最大。点の動く向きも矢印で書きます。',
        add: [{ t: 'h', text: '(1)　増減表（0 ≦ t ≦ π/2）' },
          { t: 'tbl', size: 'sm', rows: [['$t$', '$0$', '$\\cdots$', '$\\frac{\\pi}{6}$', '$\\cdots$', '$\\frac{\\pi}{3}$', '$\\cdots$', '$\\frac{\\pi}{2}$'],
            ['$\\frac{dx}{dt}$', '', '$+$', '$0$', '$-$', '', '$-$', ''],
            ['$x$', '$1$', '$\\nearrow$', '$\\frac{3\\sqrt3}{4}$', '$\\searrow$', '$\\frac{2+\\sqrt3}{4}$', '$\\searrow$', '$0$'],
            ['$\\frac{dy}{dt}$', '', '$+$', '', '$+$', '$0$', '$-$', ''],
            ['$y$', '$0$', '$\\nearrow$', '$\\frac{2+\\sqrt3}{4}$', '$\\nearrow$', '$\\frac{3\\sqrt3}{4}$', '$\\searrow$', '$1$']] },
          { t: 'p', size: 'sm', text: '$\\frac{3\\sqrt3}{4}\\approx1.30$。$t=\\frac{\\pi}{6}$ の点と $t=\\frac{\\pi}{3}$ の点は、直線 $y=x$ について対称。' },
          quad('q1', [Cq].concat(marks))] },
      { say: '点の動く向きは、$x,\\ y$ の増減を組み合わせて決まります。$\\frac{\\pi}{3}<t<\\frac{\\pi}{2}$ では $x$ も $y$ も減るので左下へ進み、$(0,\\ 1)$ に着きます。',
        add: [{ t: 'p', size: 'sm', text: '動く向き：$0<t<\\frac{\\pi}{6}$ ↗　$\\frac{\\pi}{6}<t<\\frac{\\pi}{3}$ ↖　$\\frac{\\pi}{3}<t<\\frac{\\pi}{2}$ ↙' }] },

      // ---------- (1) 全体 ----------
      { clear: true, cols: [0.56, 0.44], part: '(1) 全体', say: '第1象限の部分を、$x$ 軸・$y$ 軸で折り返すと全体になります。まず点 $(1,\\ 0)$ のようすを調べます。$t=0$ では $\\frac{dx}{dt}=1,\\ \\frac{dy}{dt}=2$。',
        add: [{ t: 'h', text: '(1)　全体の形' },
          { t: 'p', size: 'sm', text: '$t=0$ で $\\left(\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}\\right)=(1,\\ 2)$\n→ $(1,\\ 0)$ から、傾き 2 の向きに右上へ出ていく' },
          full('c1', [{ k: 'param', x: CX, y: CY, a: 0, b: PI / 2, c: 'y', wd: 4 }, { k: 'pt', at: [1, 0], c: 'g' }])] },
      { ask: { type: 'choice', q: '$x$ 軸について対称なことも合わせると、点 $(1,\\ 0)$ での C のようすは？',
        opts: ['なめらか（接線は $y$ 軸に平行）', '$x$ 軸に接している', 'とがっている（内側にへこんだ角）', 'C は $(1,\\ 0)$ を通らない'], ok: 2,
        why: { 0: '上の部分は傾き 2 で、下の部分は傾き $-2$ で $(1,\\ 0)$ に入ります。接線の向きがそろいません。', 1: '$t=0$ で $\\frac{dy}{dt}=2\\neq0$ なので、$x$ 軸に接してはいません。', 3: '$t=0$ のとき $x=1,\\ y=0$ なので、通ります。' },
        good: '上は傾き 2、下は傾き $-2$ で出入りするので、$(1,\\ 0)$ は内側にへこんだ角。$(0,\\ \\pm1)$、$(-1,\\ 0)$ も同じです。',
        draw: [{ fig: 'c1', items: [Cfull, { k: 'pt', at: [-1, 0], c: 'g' }, { k: 'pt', at: [0, 1], c: 'g' }, { k: 'pt', at: [0, -1], c: 'g' }]}] } },
      { say: '(1) の答えです。4つの角が内側にへこみ、ななめ方向にふくらんだ「四つ葉」のような形。点線は単位円で、C はその外側にあります。',
        add: [{ t: 'ans', label: '(1) 答', text: '右の図の太線。\n$x$ 軸・$y$ 軸・直線 $y=x$ について対称で、\n$(\\pm1,\\ 0)$、$(0,\\ \\pm1)$ でとがる。\n$x$ の最大値は $\\dfrac{3\\sqrt3}{4}$（$t=\\dfrac{\\pi}{6}$）' }] },

      // ---------- (2) 面積の式 ----------
      { clear: true, cols: [0.56, 0.44], part: '(2)', say: '(2) です。対称性から $S=4S_1$（$S_1$ は第1象限の部分）。ただし、$x$ は $t=\\frac{\\pi}{6}$ まで増えて、そのあと減ります。ここが注意点。',
        add: [{ t: 'h', text: '(2)　第1象限の部分 S₁ を式にする' },
          { t: 'm', tex: 'S=4S_1' },
          { t: 'p', size: 'sm', text: '$x$ が $1\\to\\frac{3\\sqrt3}{4}$（行き）、$\\frac{3\\sqrt3}{4}\\to0$（帰り）と動く。\n帰りの部分（上側）の下の面積：[[y:黄]]\n行きの部分（下側）の下の面積：{{桃}}' },
          quad('q2', [{ k: 'poly', pts: upperPoly, close: true, fill: 'y', alpha: 0.3, noStroke: true },
            { k: 'poly', pts: lowerPoly, close: true, fill: 'p', alpha: 0.55, noStroke: true },
            { k: 'param', x: CX, y: CY, a: PI / 6, b: PI / 2, c: 'y', wd: 3.5 }, { k: 'param', x: CX, y: CY, a: 0, b: PI / 6, c: 'p', wd: 4 },
            { k: 'seg', a: [P6[0], 0], b: P6, c: 'd', dash: true, wd: 2 }, { k: 'pt', at: P6, c: 'w', r: 5 }], 380)] },
      { ask: { type: 'choice', q: '$S_1$ を求めるとき、桃色の部分（行きの曲線と $x$ 軸の間）はどうする？',
        opts: ['黄色に足す', '黄色から引く', '無視してよい', '2倍して足す'], ok: 1,
        why: { 0: '桃色の部分は C の外側です。足すと、外にはみ出した面積まで数えます。', 2: '黄色の部分には桃色の部分がふくまれているので、無視すると大きすぎます。', 3: '桃色の部分は C の外側。足すのではなく引きます。' },
        good: '$S_1=$（黄色）$-$（桃色）。$S_1$ は「C と両軸で囲まれた部分」です。',
        add: [{ t: 'm', size: 'sm', tex: 'S_1=\\int_{\\frac{\\pi}{2}}^{\\frac{\\pi}{6}}y\\frac{dx}{dt}\\,dt-\\int_0^{\\frac{\\pi}{6}}y\\frac{dx}{dt}\\,dt', note: '$x$ の積分を\n$t$ に置換' }] } },
      { say: '1つ目の積分の上端・下端を入れかえると符号が変わり、2つの積分がつながります。行って戻る部分は、この式で自動的に引かれるのです。',
        add: [{ t: 'm', tex: 'S_1=-\\int_0^{\\frac{\\pi}{2}}y\\,\\frac{dx}{dt}\\,dt=\\int_0^{\\frac{\\pi}{2}}y\\left(-\\frac{dx}{dt}\\right)dt' },
          { t: 'box', c: 'y', size: 'sm', label: 'ポイント', text: '$x$ が行って戻っても、$t$ の区間を通して\n1本の積分にまとめてよい' }] },

      // ---------- (2) 計算 ----------
      { clear: true, cols: [0.6, 0.4], part: '(2) 計算', say: '中身を展開します。$-\\frac{dx}{dt}=\\sin t-\\cos2t$ を使うと見通しがよくなります。',
        add: [{ t: 'h', text: '(2)　積分の計算' },
          { t: 'm', size: 'sm', tex: '-\\frac{dx}{dt}=\\sin t+\\sin^2t-\\cos^2t=\\sin t-\\cos2t' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}y\\left(-\\frac{dx}{dt}\\right)&=(\\sin t+\\sin t\\cos t)(\\sin t-\\cos2t)\\\\ &=\\hy{\\sin^2t}-\\hb{\\sin t\\cos2t}+\\hg{\\sin^2t\\cos t}-\\ans{\\sin t\\cos t\\cos2t}\\end{aligned}' },
          quad('q3', [{ k: 'poly', pts: regionPoly, close: true, fill: 'y', alpha: 0.3, noStroke: true }, Cq, { k: 'label', at: [0.55, 0.5], text: 'S₁', c: 'y', size: 26 }], 300)] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\frac{\\pi}{2}}\\sin t\\cos2t\\,dt$ の値は？',
        opts: ['$\\dfrac13$', '$0$', '$-\\dfrac23$', '$-\\dfrac13$'], ok: 3,
        why: { 0: '符号に注意。$u=\\cos t$ とおくと $\\int_0^1(2u^2-1)\\,du=\\frac23-1=-\\frac13$。', 1: '$\\sin t$ と $\\cos2t$ の積は、この区間で打ち消し合いません。', 2: '$\\int_0^1 1\\,du=1$ の引き方をまちがえています。$\\frac23-1=-\\frac13$。' },
        good: '$\\cos2t=2\\cos^2t-1$、$u=\\cos t$（$du=-\\sin t\\,dt$）で $\\int_0^1(2u^2-1)\\,du=-\\frac13$。',
        add: [{ t: 'tbl', size: 'sm', rows: [['積分（0 → π/2）', '値'], ['$\\int\\sin^2t\\,dt$', '$\\frac{\\pi}{4}$'], ['$\\int\\sin t\\cos2t\\,dt$', '$-\\frac13$'], ['$\\int\\sin^2t\\cos t\\,dt$', '$\\frac13$']] }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\int_0^{\\frac{\\pi}{2}}\\sin t\\cos t\\cos2t\\,dt=0$ を確かめよう。',
        hint: '$\\sin t\\cos t=\\dfrac12\\sin2t$。さらに $\\sin2t\\cos2t=\\dfrac12\\sin4t$。',
        ans: '$\\displaystyle\\int_0^{\\frac{\\pi}{2}}\\frac14\\sin4t\\,dt=\\frac14\\Big[-\\frac{\\cos4t}{4}\\Big]_0^{\\frac{\\pi}{2}}=\\frac14\\left(-\\frac14+\\frac14\\right)=0$',
        after: '2倍角の公式を2回使うと、1つの三角関数になります。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\int_0^{\\frac{\\pi}{2}}\\sin t\\cos t\\cos2t\\,dt=0' }] } },
      { clear: true, cols: [0.56, 0.44], part: '(2) 答え', say: '全部合わせます。$S_1=\\frac{\\pi}{4}-\\left(-\\frac13\\right)+\\frac13-0=\\frac{\\pi}{4}+\\frac23$。4倍して答えです。',
        add: [{ t: 'h', text: '(2)　答え' },
          { t: 'm', size: 'sm', tex: 'S_1=\\hy{\\frac{\\pi}{4}}-\\hb{\\left(-\\frac13\\right)}+\\hg{\\frac13}-\\ans{0}', note: '4つの積分の値' },
          full('c2', [{ k: 'poly', pts: arc(0, 2 * PI, 360), close: true, fill: 'y', alpha: 0.25, noStroke: true }, Cfull, { k: 'label', at: [0.75, 0.75], text: 'S', c: 'y', size: 28 }], 380),{ t: 'm', size: 'sm', tex: 'S_1=\\frac{\\pi}{4}+\\frac13+\\frac13-0=\\frac{\\pi}{4}+\\frac23' },
          { t: 'ans', label: '(2) 答', tex: 'S=4S_1=\\pi+\\frac83' }] },
      { say: '検算：$S\\approx5.81$。C は単位円（面積 $\\pi\\approx3.14$）の外側にあり、原点からいちばん遠い点でも $1+\\frac{\\sqrt2}{2}\\approx1.71$。半径 1.71 の円の面積 $\\approx9.2$ より小さく、つじつまが合います。',
        add: [{ t: 'p', size: 'sm', text: '$\\pi\\approx3.14<S\\approx5.81<\\pi\\cdot1.71^2\\approx9.2$' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '別の見方です。C は直線 $y=x$ について対称なので、$x$ と $y$ の役割を入れかえた積分でも、同じ $S_1$ が出ます。',
        add: [{ t: 'h', text: '別の見方：x と y の役割を入れかえる' },
          { t: 'm', tex: 'S_1=\\int_0^{\\frac{\\pi}{2}}x\\,\\frac{dy}{dt}\\,dt', note: '$y$ 軸方向に\n積み上げる' },
          { t: 'p', size: 'sm', text: '$y$ も $t=\\frac{\\pi}{3}$ で行って戻るが、同じように「右側 − 左側」が自動で計算される。' },
          quad('q4', [{ k: 'poly', pts: regionPoly, close: true, fill: 'b', alpha: 0.25, noStroke: true }, Cq, { k: 'pt', at: P3, c: 'w', r: 5 }], 340)] },
      { ask: { type: 'choice', q: '面積の答案で、いちばん減点されやすいのは？',
        opts: ['対称性の理由なしに $S=4S_1$', '$\\cos2t=2\\cos^2t-1$ と書く', '$u=\\cos t$ と置換する', '小数で検算する'], ok: 0,
        why: { 1: '正しい式変形で、減点されません。', 2: '置換積分の正しい使い方です。積分区間も $u$ に直せば問題ありません。', 3: '検算は答案の外でやれば問題ありません。むしろおすすめです。' },
        good: '「$t\\to-t$ で $(x,\\ -y)$、$t\\to\\pi-t$ で $(-x,\\ y)$ になるから」と、対称性の根拠を1行書きます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。媒介変数の曲線は「対称性で範囲をしぼる → 増減表 → $t$ のまま積分」の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
