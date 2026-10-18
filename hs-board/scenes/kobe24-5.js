/* 2024 神戸大 理系 第5問の類題（自作）：両はしが変数の定積分で決まる関数を正接で置換し、値の和の不等式が表す領域の面積
   問題：f(x)=∫_{−x}^{x} dt/(t²+4)。(1) f(2√3) と f(x)+f(4/x)（x>0）
         (2) 0≦f(x)≦π/3、0≦f(y)≦π/3、π/3≦f(x)+f(y)≦π/2 の領域 D の図示と面積
   答え（python3・sympy で検算ずみ）：
   t=2tanθ で f(x)=α（tanα=x/2、−π/2<α<π/2）。f(2√3)=π/3、f(x)+f(4/x)=π/2
   0≦f(x)≦π/3 ⇔ 0≦x≦2√3。f(x)+f(y)≦π/2 ⇔ f(y)≦f(4/x) ⇔ xy≦4（x=0 でもよい）
   f(x)+f(y)≧π/3 ⇔ β≧π/3−α（どちらも [0,π/3]）⇔ y≧2(2√3−x)/(2+√3x)（tan(π/3−α) を使う）
   面積 = (4+4log3) − ((32/3)log2 − 4) = 8 + 4log3 − (32/3)log2 ≒ 5.0009（2000×2000 の格子で数えて 5.0009 と一致） */
(function () {
  const R3 = Math.sqrt(3), A = 2 * R3, B = 2 / R3;
  const LOW = '2*(2*sqrt(3)-x)/(2+sqrt(3)*x)';
  const xyFig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.55, -0.55, 4.25, 4.25], w: 440, h: 440, items: [
    { k: 'axes', tx: [[B, '2/√3'], [A, '2√3']], ty: [[B, '2/√3'], [A, '2√3']], xl: 'x', yl: 'y' },
    { k: 'seg', a: [A, 0], b: [A, A], c: 'd', dash: true, wd: 2 }, { k: 'seg', a: [0, A], b: [A, A], c: 'd', dash: true, wd: 2 }].concat(extra || []) });
  const curves = [
    { k: 'area', f: 'min(2*sqrt(3), 4/x)', g: LOW, a: 0.0001, b: A, c: 'y', alpha: 0.3 },
    { k: 'fn', f: LOW, a: 0, b: A, c: 'b', wd: 3.5 }, { k: 'fn', f: '4/x', a: B, b: A, c: 'p', wd: 3.5 },
    { k: 'label', at: [3.0, 3.0], text: 'xy = 4', c: 'p', size: 20, dx: 24, dy: -4, anchor: 'start' },
    { k: 'label', at: [1.0, 0.55], text: 'α + β = π/3', c: 'b', size: 18 },
    { k: 'label', at: [1.9, 1.9], text: 'D', c: 'y', size: 26 }];
  const abFig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.25, -0.25, 1.35, 1.35], w: 380, h: 380, items: [
    { k: 'axes', tx: [[Math.PI / 6, 'π/6'], [Math.PI / 3, 'π/3']], ty: [[Math.PI / 6, 'π/6'], [Math.PI / 3, 'π/3']], xl: 'α', yl: 'β' },
    { k: 'poly', pts: [[0, Math.PI / 3], [Math.PI / 3, 0], [Math.PI / 3, Math.PI / 6], [Math.PI / 6, Math.PI / 3]], close: true, c: 'y', fill: 'y', alpha: 0.3, wd: 2.5 },
    { k: 'seg', a: [Math.PI / 3, 0], b: [Math.PI / 3, Math.PI / 3], c: 'd', dash: true, wd: 2 }, { k: 'seg', a: [0, Math.PI / 3], b: [Math.PI / 3, Math.PI / 3], c: 'd', dash: true, wd: 2 },
    { k: 'label', at: [0.33, 0.36], text: 'α+β=π/3', c: 'b', size: 18 }, { k: 'label', at: [1.12, 0.66], text: 'α+β=π/2', c: 'p', size: 18, anchor: 'start' }].concat(extra || []) });
  const POINTS = [
    '$\\dfrac{1}{t^2+a^2}$ の積分は **$t=a\\tan\\theta$** と置換。$f(x)=\\alpha$（$\\tan\\alpha=\\frac x2$）と「角」で表すと、関数の性質が見える',
    '$f(x)+f(y)$ の条件は、角 $\\alpha,\\ \\beta$ の条件。$\\beta\\ge\\frac\\pi3-\\alpha$ のように **両辺を同じ単調な区間に入れて** から $\\tan$ をとる（加法定理）',
    '面積は「上の曲線 − 下の曲線」。分数式は **割り算して** $\\dfrac{k}{ax+b}$ の形にすれば $\\log$ で積分できる'
  ];

  HB.lesson({
    id: 'kobe24-5', field: '神戸大型　数学（理系）', title: '2024 神戸大 理系 第5問の類題 ― 定積分で決まる関数と、値の和の不等式の領域', level: '2024年度 神戸大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '実数 $x$ に対して　$f(x)=\\displaystyle\\int_{-x}^{x}\\frac{dt}{t^2+4}$　とする。',
      parts: [
        '(1)　$f(2\\sqrt3)$ の値を求めよ。また、$x>0$ のとき $f(x)+f\\left(\\dfrac4x\\right)$ の値を求めよ。',
        '(2)　座標平面上で、連立不等式　$0\\le f(x)\\le\\dfrac\\pi3,\\ \\ 0\\le f(y)\\le\\dfrac\\pi3,\\ \\ \\dfrac\\pi3\\le f(x)+f(y)\\le\\dfrac\\pi2$　の表す領域 $D$ を図示し、$D$ の面積を求めよ。'
      ],
      src: '※ 2024年度 神戸大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '積分の両はしが変数の関数 $f(x)$ を、置換積分で簡単な形にし、その値の和の不等式が表す領域を考えます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$\\frac{1}{t^2+4}$ の原始関数は、これまでの公式では書けません。そこで $t=2\\tan\\theta$ とおく置換積分を使います。$t^2+4$ がきれいにまとまる置換です。',
        add: [{ t: 'h', text: '方針：t = 2 tan θ とおく' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　$t=2\\tan\\theta$ で置換 → $f(x)$ を「角」で表す\n(2)　$f(x)=\\alpha,\\ f(y)=\\beta$ とおき、角の条件を $x,\\ y$ の条件に直す（加法定理）\n　　→ 図示して、面積を積分で求める' },
          { t: 'm', tex: '1+\\tan^2\\theta=\\frac{1}{\\cos^2\\theta}', note: '使う公式' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$t=2\\tan\\theta$ とおくと $dt=\\dfrac{2}{\\cos^2\\theta}\\,d\\theta$、$t^2+4=4(\\tan^2\\theta+1)=\\dfrac{4}{\\cos^2\\theta}$ です。',
        add: [{ t: 'h', text: '(1)　置換積分で f(x) を求める' },
          { t: 'm', tex: 't=2\\tan\\theta,\\qquad dt=\\frac{2}{\\cos^2\\theta}\\,d\\theta' },
          { t: 'm', tex: 't^2+4=\\frac{4}{\\cos^2\\theta}' }] },
      { ask: { type: 'choice', q: '$\\dfrac{dt}{t^2+4}$ を $\\theta$ で表すと？',
        opts: ['$2\\,d\\theta$', '$\\dfrac{\\cos^2\\theta}{4}\\,d\\theta$', '$\\dfrac{d\\theta}{4\\tan^2\\theta+4}$', '$\\dfrac12\\,d\\theta$'], ok: 3,
        why: { 0: '$\\frac{2}{\\cos^2\\theta}\\div\\frac{4}{\\cos^2\\theta}=\\frac24$。割り算の向きが逆です。', 1: '$dt$ の $\\frac{2}{\\cos^2\\theta}$ をかけわすれています。', 2: '$dt$ を $d\\theta$ に直していません。' },
        good: '$\\dfrac{\\cos^2\\theta}{4}\\cdot\\dfrac{2}{\\cos^2\\theta}\\,d\\theta=\\dfrac12\\,d\\theta$。きれいに定数になります。',
        add: [{ t: 'm', tex: '\\frac{dt}{t^2+4}=\\frac12\\,d\\theta' }] } },
      { say: '積分区間です。$\\tan\\alpha=\\frac x2$（$-\\frac\\pi2<\\alpha<\\frac\\pi2$）となる $\\alpha$ をとると、$t=x$ のとき $\\theta=\\alpha$、$t=-x$ のとき $\\theta=-\\alpha$。',
        add: [{ t: 'm', tex: 'f(x)=\\int_{-\\alpha}^{\\alpha}\\frac12\\,d\\theta=\\alpha' },
          { t: 'box', c: 'y', size: 'sm', label: '結果', text: '$f(x)=\\alpha$　（$\\tan\\alpha=\\dfrac x2,\\ \\ -\\dfrac\\pi2<\\alpha<\\dfrac\\pi2$）\n$x$ が増えると $\\alpha$ も増える（**$f$ は増加関数**）。$f(0)=0$' }] },
      { ask: { type: 'choice', q: '$f(2\\sqrt3)$ は？',
        opts: ['$\\dfrac\\pi6$', '$\\dfrac\\pi3$', '$\\dfrac{2\\pi}3$', '$\\dfrac\\pi4$'], ok: 1,
        why: { 0: '$\\tan\\frac\\pi6=\\frac1{\\sqrt3}$。ここでは $\\tan\\alpha=\\frac{2\\sqrt3}2=\\sqrt3$。', 2: '$-\\frac\\pi2<\\alpha<\\frac\\pi2$ の範囲で選びます。区間の長さ $2\\alpha$ と混同しています。', 3: '$\\tan\\frac\\pi4=1$ は $x=2$ のときです。' },
        good: '$\\tan\\alpha=\\sqrt3$、$-\\frac\\pi2<\\alpha<\\frac\\pi2$ より $\\alpha=\\frac\\pi3$。',
        add: [{ t: 'm', col: 1, tex: 'f(2\\sqrt3)=\\frac\\pi3' }] } },
      { ask: { type: 'choice', q: '$x>0$ のとき、$f(x)+f\\left(\\frac4x\\right)$ は？（$\\tan\\alpha=\\frac x2,\\ \\tan\\beta=\\frac2x$）',
        opts: ['$\\dfrac\\pi4$', '$\\pi$', '$\\dfrac\\pi2$', '$x$ によって変わる'], ok: 2,
        why: { 0: '$x=2$ なら $\\frac\\pi4+\\frac\\pi4=\\frac\\pi2$。$\\frac\\pi4$ はそれぞれの値です。', 1: '$\\alpha,\\ \\beta$ はどちらも $0$ と $\\frac\\pi2$ の間。和は $\\pi$ より小さい。', 3: '$\\tan\\beta=\\frac{1}{\\tan\\alpha}$ なので、$\\beta$ は $\\alpha$ で決まります。' },
        good: '$\\tan\\beta=\\frac1{\\tan\\alpha}=\\tan\\left(\\frac\\pi2-\\alpha\\right)$。どちらも $\\left(0,\\ \\frac\\pi2\\right)$ にあるので $\\beta=\\frac\\pi2-\\alpha$。',
        add: [{ t: 'ans', col: 1, label: '(1) 答', text: '$f(2\\sqrt3)=\\dfrac\\pi3$\n$f(x)+f\\left(\\dfrac4x\\right)=\\dfrac\\pi2$' }] } },

      // ---------- (2) 読みかえ ----------
      { clear: true, part: '(2)', say: '(2) です。$\\alpha=f(x),\\ \\beta=f(y)$ とおくと、条件は角の条件になります。右の図の $\\alpha\\beta$ 平面では、2 本の直線にはさまれた四角形です。',
        add: [{ t: 'h', text: '(2)　角の条件にする' },
          { t: 'm', size: 'sm', tex: '0\\le\\alpha\\le\\frac\\pi3,\\quad 0\\le\\beta\\le\\frac\\pi3,\\quad \\frac\\pi3\\le\\alpha+\\beta\\le\\frac\\pi2' },
          { t: 'p', size: 'sm', text: 'これを $x,\\ y$ の条件に、1 つずつ直す' },
          { t: 'm', size: 'sm', tex: '0\\le f(x)\\le\\frac\\pi3\\iff 0\\le x\\le2\\sqrt3', note: '$f$ は増加、(1)' },
          abFig('ab')] },
      { ask: { type: 'choice', q: '$f(x)+f(y)\\le\\dfrac\\pi2$（$x>0$）を、$x,\\ y$ の式で表すと？',
        opts: ['$x+y\\le4$', '$xy\\le4$', '$xy\\ge4$', '$y\\le4x$'], ok: 1,
        why: { 0: '角の和が一定でも、$x,\\ y$ の和は一定ではありません。(1) を使います。', 2: '$f$ は増加関数なので、不等号の向きはそのまま。', 3: '$f\\left(\\frac4x\\right)$ の $\\frac4x$ と比べます。' },
        good: '(1) より $\\frac\\pi2-f(x)=f\\left(\\frac4x\\right)$。$f(y)\\le f\\left(\\frac4x\\right)$ で、$f$ は増加なので $y\\le\\frac4x$。',
        add: [{ t: 'm', size: 'sm', tex: 'f(y)\\le f\\left(\\tfrac4x\\right)\\iff y\\le\\frac4x', note: '$x=0$ のときは\n自動的に成り立つ' }] } },

      // ---------- (2) 加法定理 ----------
      { clear: true, say: '残りは $\\alpha+\\beta\\ge\\frac\\pi3$。$\\beta\\ge\\frac\\pi3-\\alpha$ と書くと、両辺とも $0$ 以上 $\\frac\\pi3$ 以下。$\\tan$ はこの範囲で増加なので、$\\tan$ をとっても向きは変わりません。',
        add: [{ t: 'h', text: '(2)　α + β ≧ π/3 を x, y の式に' },
          { t: 'm', size: 'sm', tex: '\\beta\\ge\\frac\\pi3-\\alpha\\iff\\tan\\beta\\ge\\tan\\left(\\frac\\pi3-\\alpha\\right)', note: '両辺は $\\left[0,\\ \\frac\\pi3\\right]$ の角' }] },
      { ask: { type: 'choice', q: '加法定理で $\\tan\\left(\\dfrac\\pi3-\\alpha\\right)$ は？',
        opts: ['$\\dfrac{\\sqrt3-\\tan\\alpha}{1+\\sqrt3\\tan\\alpha}$', '$\\dfrac{\\sqrt3-\\tan\\alpha}{1-\\sqrt3\\tan\\alpha}$', '$\\sqrt3-\\tan\\alpha$', '$\\dfrac{\\sqrt3+\\tan\\alpha}{1-\\sqrt3\\tan\\alpha}$'], ok: 0,
        why: { 1: '差の公式では、分母は $1+\\tan\\cdot\\tan$。符号が分子と逆になります。', 2: '$\\tan$ は引き算をそのまま分けられません。', 3: 'それは $\\tan\\left(\\frac\\pi3+\\alpha\\right)$ です。' },
        good: '$\\tan(A-B)=\\dfrac{\\tan A-\\tan B}{1+\\tan A\\tan B}$ に $\\tan\\frac\\pi3=\\sqrt3$ を入れます。' } },
      { say: '$\\tan\\alpha=\\frac x2,\\ \\tan\\beta=\\frac y2$ を入れて整理すると、下の境界の曲線の式が出ます。分母は正なので、かけても向きは変わりません。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac y2\\ge\\frac{\\sqrt3-\\frac x2}{1+\\frac{\\sqrt3}{2}x}\\iff y\\ge\\frac{2(2\\sqrt3-x)}{2+\\sqrt3x}' },
          { t: 'box', c: 'g', size: 'sm', label: '確かめ', text: '$x=0$ で $y=2\\sqrt3$、$x=2\\sqrt3$ で $y=0$。\n$x=2$ では $\\alpha=\\frac\\pi4$、$\\beta=\\frac\\pi{12}$ で $y=4-2\\sqrt3$。' }] },
      { ask: { type: 'think', q: '$\\alpha+\\beta\\ge\\dfrac\\pi3$ を、いきなり「$\\tan(\\alpha+\\beta)\\ge\\sqrt3$」と言いかえると、どこで困る？',
        hint: '$\\alpha+\\beta$ は $\\frac\\pi2$ にもなりうる。また $\\tan(\\alpha+\\beta)=\\dfrac{\\tan\\alpha+\\tan\\beta}{1-\\tan\\alpha\\tan\\beta}$ の分母は？',
        ans: '$\\alpha+\\beta=\\frac\\pi2$（$xy=4$）では $\\tan$ が定義されず、分母 $1-\\frac{xy}4$ も 0。$\\frac\\pi2$ をこえると $\\tan$ は負になり、同値でなくなる',
        after: '「両辺を、$\\tan$ が増加する同じ区間に入れてから $\\tan$ をとる」のが安全な言いかえ方です。' } },

      // ---------- (2) 図示 ----------
      { clear: true, cols: [0.5, 0.5], say: '3 つの条件をまとめて図示します。正方形 $0\\le x,\\ y\\le2\\sqrt3$ の中で、下の曲線（青）より上、双曲線 $xy=4$（赤）より下の部分です。境界をふくみます。',
        add: [{ t: 'h', text: '(2)　領域 D の図示' },
          { t: 'tbl', size: 'sm', rows: [['条件', '$x,\\ y$ の式'], ['$0\\le\\alpha,\\ \\beta\\le\\frac\\pi3$', '$0\\le x,\\ y\\le2\\sqrt3$'], ['$\\alpha+\\beta\\le\\frac\\pi2$', '$xy\\le4$'], ['$\\alpha+\\beta\\ge\\frac\\pi3$', '$y\\ge\\frac{2(2\\sqrt3-x)}{2+\\sqrt3x}$']] },
          { t: 'p', size: 'sm', text: '境界線をふくむ\n$xy=4$ と正方形の交点：$\\left(\\frac2{\\sqrt3},\\ 2\\sqrt3\\right)$，$\\left(2\\sqrt3,\\ \\frac2{\\sqrt3}\\right)$' },
          xyFig('xy', curves)] },

      // ---------- (2) 面積 ----------
      { clear: true, cols: [0.6, 0.4], say: '面積は「上の境界の下の面積」から「下の曲線の下の面積」を引きます。上の境界は、$x\\le\\frac2{\\sqrt3}$ では $y=2\\sqrt3$、その先は $y=\\frac4x$ です。',
        add: [{ t: 'h', text: '(2)　面積' },
          { t: 'm', size: 'sm', tex: 'S_1=\\frac2{\\sqrt3}\\cdot2\\sqrt3+\\int_{\\frac2{\\sqrt3}}^{2\\sqrt3}\\frac4x\\,dx=4+4\\log3', note: '上の境界の下' },
          xyFig('xy2', curves.concat([{ k: 'area', f: LOW, a: 0, b: A, c: 'b', alpha: 0.25 }]))] },
      { say: '下の曲線は分数式なので、割り算して「定数 ＋ $\\frac{k}{ax+b}$」の形にします。$2\\sqrt3-x=-\\frac1{\\sqrt3}(\\sqrt3x+2)+\\frac8{\\sqrt3}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{2(2\\sqrt3-x)}{2+\\sqrt3x}=-\\frac2{\\sqrt3}+\\frac{16}{\\sqrt3}\\cdot\\frac{1}{2+\\sqrt3x}' }] },
      { ask: { type: 'choice', q: '$S_2=\\displaystyle\\int_0^{2\\sqrt3}\\frac{2(2\\sqrt3-x)}{2+\\sqrt3x}\\,dx$ は？',
        opts: ['$\\dfrac{16}{3}\\log2-4$', '$16\\log2-4$', '$\\dfrac{32}{3}\\log2$', '$\\dfrac{32}{3}\\log2-4$'], ok: 3,
        why: { 0: '$\\log\\frac{2+6}{2}=\\log4=2\\log2$。$\\log4$ を $\\log2$ にしています。', 1: '$\\int\\frac{dx}{2+\\sqrt3x}=\\frac{1}{\\sqrt3}\\log(2+\\sqrt3x)$。$\\frac1{\\sqrt3}$ をわすれています。', 2: '定数の部分 $-\\frac2{\\sqrt3}\\cdot2\\sqrt3=-4$ をわすれています。' },
        good: '$-4+\\dfrac{16}{\\sqrt3}\\cdot\\dfrac1{\\sqrt3}\\Big[\\log(2+\\sqrt3x)\\Big]_0^{2\\sqrt3}=-4+\\dfrac{16}3\\log4$。',
        add: [{ t: 'm', size: 'sm', tex: 'S_2=-4+\\frac{16}{3}\\log\\frac82=\\frac{32}{3}\\log2-4', note: '下の曲線の下' }] } },
      { say: '$D$ の面積は $S_1-S_2$。$8+4\\log3-\\frac{32}3\\log2\\approx5.00$ で、正方形（面積 12）の半分より少し小さい。図とも合っています。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'S_1-S_2=8+4\\log3-\\frac{32}{3}\\log2' }] },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案のポイント', say: 'この問題の答案は「同値な言いかえ」の連続です。どこで「$f$ が増加」「$\\tan$ が増加」を使ったかを、1 行ずつ書きます。',
        add: [{ t: 'h', text: '答案のポイント：同値の根拠を書く' },
          { t: 'tbl', cls: 'rowh', size: 'sm', rows: [['言いかえ', '根拠'], ['$0\\le f(x)\\le\\frac\\pi3\\iff0\\le x\\le2\\sqrt3$', '$f$ は増加、$f(0)=0$、$f(2\\sqrt3)=\\frac\\pi3$'], ['$f(x)+f(y)\\le\\frac\\pi2\\iff xy\\le4$', '(1) の $f(x)+f\\left(\\frac4x\\right)=\\frac\\pi2$ と $f$ の増加（$x=0$ は別に確認）'], ['$\\alpha+\\beta\\ge\\frac\\pi3\\iff y\\ge\\cdots$', '両辺が $\\left[0,\\ \\frac\\pi3\\right]$ の角、$\\tan$ はそこで増加、加法定理']] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「置換で角にする → 角の条件を加法定理で戻す → 面積」の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
