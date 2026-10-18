/* 2024 阪大 理系 第4問の類題（自作）：楕円を軸のまわりに回した立体と、その「穴」をうめる立体の体積
   問題：a>2、楕円 E:(x−a)²/4+y²=1。(1) E の内部を y 軸のまわりに回転 → V₁ (2) E の x≦a の部分・y 軸・y=±1 で囲まれた D を回転 → V₂、V₂=V₁/2 となる a
   答え（python3・sympy で検算ずみ）：
   x=a±2√(1−y²)、∫_{−1}^{1}√(1−y²)dy=π/2（半円の面積）、∫_{−1}^{1}(4−4y²)dy=16/3
   (1) V₁=π∫{(a+2√)²−(a−2√)²}dy=8πa・π/2=4π²a（パップス：面積 2π × 2πa でも同じ）
   (2) V₂=π∫(a−2√(1−y²))²dy=π(2a²−2πa+16/3)、V₂=V₁/2 ⇔ a²−2πa+8/3=0 ⇔ a=π±√(π²−8/3)
       π−√(π²−8/3)≒0.458<2（(π−2)²<π²−8/3 ⇔ π>5/3）なので a=π+√(π²−8/3)≒5.825
   別の見方：円柱 2πa² −（内側半分の回転体 2π²a−16π/3）= V₂ */
(function () {
  const A = 3, sq = y => Math.sqrt(Math.max(0, 1 - y * y));
  const ELL = { k: 'param', x: `${A}+2*cos(t)`, y: 'sin(t)', a: 0, b: 2 * Math.PI, c: 'y', wd: 3 };
  const leftArc = []; for (let i = 0; i <= 40; i++) { const y = -1 + 2 * i / 40; leftArc.push([A - 2 * sq(y), y]); }
  const Dpoly = [[0, -1]].concat(leftArc).concat([[0, 1]]);
  const xy = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.8, -1.55, 5.6, 1.75], w: 540, h: 278, items: [
    { k: 'axes', tx: [[A, 'a'], [A - 2, 'a−2'], [A + 2, 'a+2']], ty: [[1, '1'], [-1, '−1']], xl: 'x', yl: 'y' }
  ].concat(extra || []) });
  // 高さ y で切った切り口（上から見た図）
  const ring = (R, r) => { const o = [], n = 72; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; o.push([R * Math.cos(t), R * Math.sin(t)]); }
    for (let i = n; i >= 0; i--) { const t = 2 * Math.PI * i / n; o.push([r * Math.cos(t), r * Math.sin(t)]); } return o; };   // 穴のある円（向きを逆にして穴にする）
  const top = (id, R, r, extra, L) => ({ t: 'fig', id, col: 1, view: [-(L || 5.2), -(L || 5.2), L || 5.2, L || 5.2], w: 200, h: 200, items: [
    { k: 'poly', pts: ring(R, r), close: true, fill: 'b', alpha: 0.28, noStroke: true },
    { k: 'circle', o: [0, 0], r: R, c: 'b' }].concat(r > 0 ? [{ k: 'circle', o: [0, 0], r, c: 'b' }] : [])
    .concat([{ k: 'dot', at: [0, 0] }]).concat(extra || []) });
  const y0 = 0.6, R0 = A + 2 * sq(y0), r0 = A - 2 * sq(y0);
  const POINTS = [
    '回転体の体積は「軸に垂直に切った切り口の面積」を積分。穴のある切り口は $\\pi(R^2-r^2)$、穴のない切り口は $\\pi r^2$',
    '$\\displaystyle\\int_{-1}^{1}\\sqrt{1-y^2}\\,dy=\\frac{\\pi}{2}$ は **半円の面積**。置換積分をしなくても図で値が分かる',
    '2次方程式の2つの解は、問題の条件（$a>2$）で選ぶ。$\\pi-\\sqrt{\\ }$ が条件に合わないことも、不等式で示す'
  ];

  HB.lesson({
    id: 'osaka24-4', field: '阪大型　数学（理系）', title: '2024 阪大 理系 第4問の類題 ― 楕円を回した立体と、その穴をうめる立体', level: '2024年度 大阪大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$a$ を $a>2$ をみたす定数とし、座標平面上の楕円 $E:\\ \\dfrac{(x-a)^2}{4}+y^2=1$ を考える。',
      parts: [
        '(1)　$E$ で囲まれた部分を $y$ 軸のまわりに1回転してできる立体の体積 $V_1$ を、$a$ を用いて表せ。',
        '(2)　$E$ のうち $x\\le a$ の部分と、$y$ 軸、および2直線 $y=1$、$y=-1$ で囲まれた部分を $D$ とする。$D$ を $y$ 軸のまわりに1回転してできる立体の体積 $V_2$ を $a$ を用いて表せ。また、$V_2=\\dfrac12V_1$ となる $a$ の値を求めよ。'
      ],
      src: '※ 2024年度 大阪大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '楕円を $y$ 軸のまわりに回すと、ドーナツのような立体ができます。その体積と、ドーナツの「穴」をうめる立体の体積を比べます。',
        add: [{ t: 'prob' }] },

      // ---------- 図と読みかえ ----------
      { clear: true, part: '図', say: '$E$ は中心 $(a,\\,0)$、横の半径 2、たての半径 1 の楕円です。$a>2$ なので、$E$ は $y$ 軸の右側にあり、$y$ 軸とは交わりません。（図は $a=3$）',
        add: [{ t: 'h', text: '図をかく' },
          { t: 'p', size: 'sm', text: '中心 $(a,\\,0)$、$x$ 方向に $\\pm2$、$y$ 方向に $\\pm1$\n左はし $x=a-2>0$　→　$y$ 軸と交わらない' },
          xy('g1', [ELL, { k: 'pt', at: [A, 0], c: 'y', r: 5 }, { k: 'label', at: [A + 1.4, 1.25], text: 'E', c: 'y', size: 24 }])] },
      { ask: { type: 'choice', q: '$E$ の式を $x$ について解くと？（$-1\\le y\\le1$）',
        opts: ['$x=a\\pm\\sqrt{1-y^2}$', '$x=-a\\pm2\\sqrt{1-y^2}$', '$x=a\\pm2\\sqrt{1-y^2}$', '$x=a\\pm4\\sqrt{1-y^2}$'], ok: 2,
        why: { 0: '$(x-a)^2=4(1-y^2)$ なので、ルートの前に $\\sqrt4=2$ が出ます。', 1: '$x-a=\\pm2\\sqrt{1-y^2}$ なので、$a$ は $+a$ です。', 3: '$\\sqrt{4(1-y^2)}=2\\sqrt{1-y^2}$。4 のままでは出ません。' },
        good: '$(x-a)^2=4(1-y^2)$ より $x=a\\pm2\\sqrt{1-y^2}$。＋が右半分、－が左半分です。',
        add: [{ t: 'm', tex: 'x=a\\pm2\\sqrt{1-y^2}', note: '＋：右半分\n－：左半分（$y$ 軸に近い側）' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。高さ $y$ の所で、$y$ 軸に垂直な平面で切ります。切り口は、外の半径 $R$、内の半径 $r$ の **ドーナツ形（円環）** です。',
        add: [{ t: 'h', text: '(1)　高さ y で切った切り口' },
          { t: 'm', size: 'sm', tex: 'R=a+2\\sqrt{1-y^2},\\qquad r=a-2\\sqrt{1-y^2}' },
          xy('g2', [ELL, { k: 'seg', a: [0, y0], b: [R0, y0], c: 'b', wd: 2, dash: true }, { k: 'seg', a: [r0, y0], b: [R0, y0], c: 'b', wd: 5 },
            { k: 'label', at: [r0, y0], text: 'r', c: 'b', size: 22, dy: -14 }, { k: 'label', at: [R0, y0], text: 'R', c: 'b', size: 22, dy: -14, dx: 8 }]),
          top('t1', R0, r0, [{ k: 'label', at: [0, -4.85], text: '上から見た切り口', c: 'b', size: 18 }])] },
      { ask: { type: 'choice', q: '高さ $y$ での切り口の面積は？',
        opts: ['$\\pi(R-r)^2$', '$\\pi(R^2-r^2)$', '$\\pi R^2$', '$2\\pi(R-r)$'], ok: 1,
        why: { 0: '$\\pi(R-r)^2$ は半径 $R-r$ の円。ドーナツ形の面積ではありません。', 2: '穴（半径 $r$）の分を引いていません。', 3: 'それは長さ（周の長さのような量）で、面積ではありません。' },
        good: '大きい円から穴を引いて $\\pi R^2-\\pi r^2$。因数分解 $(R+r)(R-r)$ すると計算が楽です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\pi(R^2-r^2)&=\\pi(R+r)(R-r)\\\\ &=\\pi\\cdot2a\\cdot4\\sqrt{1-y^2}=8\\pi a\\sqrt{1-y^2}\\end{aligned}' }] } },
      { say: '切り口の面積を $y=-1$ から $1$ まで積分します。$8\\pi a$ は定数なので外に出せます。',
        add: [{ t: 'm', tex: 'V_1=\\int_{-1}^{1}8\\pi a\\sqrt{1-y^2}\\,dy=8\\pi a\\int_{-1}^{1}\\sqrt{1-y^2}\\,dy' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-1}^{1}\\sqrt{1-y^2}\\,dy$ の値は？',
        opts: ['$\\pi$', '$\\dfrac{4}{3}$', '$2$', '$\\dfrac{\\pi}{2}$'], ok: 3,
        why: { 0: 'それは半径1の円全体の面積。$\\sqrt{1-y^2}\\ge0$ の部分は半円です。', 1: 'それは $\\int_{-1}^{1}(1-y^2)\\,dy$。ルートがついています。', 2: '$\\sqrt{1-y^2}\\le1$ なので、幅 2 の長方形 $(=2)$ より小さくなります。' },
        good: '$z=\\sqrt{1-y^2}$ は半径1の半円。積分の値はその **面積** $\\dfrac{\\pi}{2}$ です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '半円の面積', text: '$\\displaystyle\\int_{-1}^{1}\\sqrt{1-y^2}\\,dy=\\frac{\\pi}{2}$（半径1の半円）' }] } },
      { say: 'よって $V_1=8\\pi a\\cdot\\frac{\\pi}{2}=4\\pi^2a$。(1) の答えです。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'V_1=4\\pi^2a' }] },
      { ask: { type: 'think', q: '検算：$E$ の面積と、中心 $(a,\\,0)$ が1回転で動く道のりをかけると、$V_1$ と一致するか確かめよう。',
        hint: '楕円の面積は $\\pi\\times(\\text{横の半径})\\times(\\text{たての半径})$。中心は半径 $a$ の円をえがく。',
        ans: '面積 $\\pi\\cdot2\\cdot1=2\\pi$、道のり $2\\pi a$。積は $4\\pi^2a$ で一致する。',
        after: '「図形の面積 × 重心が動く道のり」（パップス・ギュルダンの定理）。記述の答案では積分で示し、これは検算に使います。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$D$ は、$y$ 軸と $E$ の左半分の間の部分。$y$ 軸のまわりに回すと、ドーナツの穴をちょうどうめる立体になります。',
        add: [{ t: 'h', text: '(2)　穴をうめる立体 D' },
          xy('g3', [ELL, { k: 'poly', pts: Dpoly, close: true, c: 'p', wd: 3, fill: 'p', alpha: 0.3 }, { k: 'label', at: [0.6, -0.45], text: 'D', c: 'p', size: 26 },
            { k: 'seg', a: [0, y0], b: [r0, y0], c: 'b', wd: 5 }, { k: 'label', at: [r0, y0], text: 'a−2√(1−y²)', c: 'b', size: 18, dx: 10, anchor: 'start' }])] },
      { ask: { type: 'choice', q: '高さ $y$ で切ると、切り口はどんな形？',
        opts: ['半径 $a-2\\sqrt{1-y^2}$ の円（穴なし）', '(1) と同じドーナツ形', '半径 $a$ の円', '半径 $2\\sqrt{1-y^2}$ の円'], ok: 0,
        why: { 1: '$D$ は $y$ 軸（回転の軸）にくっついているので、穴はできません。', 2: '$x=a$ まで届くのは $y=\\pm1$ のときだけです。', 3: 'それは楕円の左半分の「はば」。軸からの距離は $a-2\\sqrt{1-y^2}$ です。' },
        good: '軸から $x=a-2\\sqrt{1-y^2}$ までの線分を回すので、穴のない円になります。',
        add: [{ t: 'm', size: 'sm', tex: 'V_2=\\pi\\int_{-1}^{1}\\left(a-2\\sqrt{1-y^2}\\right)^2dy', col: 0 },
          top('t2', r0, 0, [{ k: 'label', at: [0, -2.05], text: '上から見た切り口', c: 'b', size: 18 }], 2.2)] } },
      { say: '2乗を展開すると、3つの部分に分かれます。真ん中の項は、また半円の面積が使えます。',
        add: [{ t: 'm', size: 'sm', tex: '\\left(a-2\\sqrt{1-y^2}\\right)^2=a^2-4a\\sqrt{1-y^2}+4-4y^2' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-1}^{1}(4-4y^2)\\,dy$ の値は？',
        opts: ['$\\dfrac{8}{3}$', '$8$', '$\\dfrac{16}{3}$', '$\\dfrac{4}{3}$'], ok: 2,
        why: { 0: 'それは $0$ から $1$ までの値。偶関数なので、$-1$ から $1$ はその2倍です。', 1: '$-4y^2$ の積分 $-\\frac83$ を引き忘れています。', 3: 'それは $\\int_{-1}^{1}(1-y^2)\\,dy$。4倍します。' },
        good: '$\\Big[\\,4y-\\frac43y^3\\,\\Big]_{-1}^{1}=2\\left(4-\\frac43\\right)=\\frac{16}{3}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}V_2&=\\pi\\left(2a^2-4a\\cdot\\frac{\\pi}{2}+\\frac{16}{3}\\right)\\\\ &=\\pi\\left(2a^2-2\\pi a+\\frac{16}{3}\\right)\\end{aligned}' }] } },

      // ---------- (2) a を求める ----------
      { clear: true, cols: [1], say: '$V_2=\\dfrac12V_1$ とおきます。両辺を $2\\pi$ で割ると、$a$ の2次方程式になります。',
        add: [{ t: 'h', text: '(2)　つづき：V₂ = V₁/2 となる a' },
          { t: 'm', tex: '\\pi\\left(2a^2-2\\pi a+\\frac{16}{3}\\right)=2\\pi^2a\\iff a^2-2\\pi a+\\frac83=0' },
          { t: 'm', tex: 'a=\\pi\\pm\\sqrt{\\pi^2-\\frac83}' }] },
      { ask: { type: 'choice', q: '条件 $a>2$ に合うのは？',
        opts: ['＋のほう だけ', '－のほう だけ', '両方', 'どちらも合わない'], ok: 0,
        why: { 1: '－のほうは約 $0.46$ で、2 より小さい。$E$ が $y$ 軸をこえます。', 2: '－のほうは約 $0.46$。$a>2$ に合いません。', 3: '＋のほうは $\\pi$ より大きいので、2 より大きい。' },
        good: '＋のほうは $\\pi\\,(>2)$ より大きく、－のほうは約 $0.46$。答案では、－のほうが 2 未満であることを示します。' } },
      { say: '答案では「$\\pi-\\sqrt{\\ \\ }<2$」を示します。$\\pi-2<\\sqrt{\\ \\ }$ を2乗して比べると、$\\pi>\\frac53$ と同じこと。これは正しいです。',
        add: [{ t: 'm', size: 'sm', tex: '\\pi-2<\\sqrt{\\pi^2-\\tfrac83}\\iff(\\pi-2)^2<\\pi^2-\\tfrac83\\iff 4\\pi>\\tfrac{20}{3}\\iff\\pi>\\tfrac53', note: '両辺正なので\n2乗して比べてよい' },
          { t: 'ans', label: '(2) 答', tex: 'V_2=\\pi\\left(2a^2-2\\pi a+\\frac{16}{3}\\right),\\qquad a=\\pi+\\sqrt{\\pi^2-\\frac83}' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '$V_2$ は別の方法でも出せます。半径 $a$・高さ 2 の円柱から、$E$ の **左半分** を回した立体（ドーナツの内側半分）を引けばよいのです。',
        add: [{ t: 'h', text: '別の見方：円柱から引く' },
          { t: 'm', size: 'sm', tex: '(\\text{円柱})=\\pi a^2\\cdot2=2\\pi a^2' },
          { t: 'm', size: 'sm', tex: '(\\text{内側半分})=\\pi\\int_{-1}^{1}\\left\\{a^2-\\left(a-2\\sqrt{1-y^2}\\right)^2\\right\\}dy' },
          xy('g4', [ELL, { k: 'poly', pts: [[0, -1], [A, -1], [A, 1], [0, 1]], close: true, c: 'g', wd: 2, dash: true },
            { k: 'poly', pts: Dpoly, close: true, c: 'p', wd: 2, fill: 'p', alpha: 0.3 },
            { k: 'poly', pts: leftArc.concat([[A, 1], [A, -1]]), close: true, c: 'y', wd: 2, fill: 'y', alpha: 0.3 },
            { k: 'label', at: [0.45, 0], text: 'D', c: 'p', size: 24 }, { k: 'label', at: [A - 0.7, 0.05], text: '内側半分', c: 'y', size: 19 },
            { k: 'label', at: [A / 2, 1], text: '円柱の断面（点線）', c: 'g', size: 18, dy: -14 }])] },
      { ask: { type: 'think', q: '(内側半分) を計算して、$2\\pi a^2-(\\text{内側半分})$ が $V_2$ と一致することを確かめよう。',
        hint: '$a^2-(a-2\\sqrt{1-y^2})^2=4a\\sqrt{1-y^2}-4+4y^2$。',
        ans: '(内側半分) $=\\pi\\left(4a\\cdot\\dfrac{\\pi}{2}-\\dfrac{16}{3}\\right)=2\\pi^2a-\\dfrac{16}{3}\\pi$。$2\\pi a^2-2\\pi^2a+\\dfrac{16}{3}\\pi=V_2$ で一致。',
        after: 'ちなみに外側半分は $2\\pi^2a+\\frac{16}{3}\\pi$。内側と外側を足すと $V_1=4\\pi^2a$ にもどります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。回転体は「切り口の形を見きわめる → 面積を積分 → 半円の面積で計算」。最後は条件で解を選びます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
