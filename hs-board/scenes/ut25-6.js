/* 2025 東大 理系 第6問の類題（自作）：円周上の複素数の逆数 → 2点の逆数の積の範囲を図示 → その逆数の実部の最大・最小
   問題：K：|z−i|=1。(1) z∈K, z≠0 ⇒ Im(1/z)=−1/2、逆に Im w=−1/2 ⇒ 1/w∈K, ≠0
         (2) α, β∈K\{0}（α=β も可）で w=1/(αβ) の範囲を図示　(3) w がその範囲を動くとき Re(1/w) の最大・最小
   答え（python3・sympy と乱数・格子での全探索で検算ずみ）：
   (1) (z−i)(z̄+i)=1 → zz̄+i(z−z̄)=0 → ÷zz̄：w−w̄=−i（w=1/z）→ Im w=−1/2。逆：|1/w−i|=|1−iw|/|w|=|1/2−is|/|s−i/2|=1
   (2) 1/α=s−i/2, 1/β=t−i/2（s,t 実数）→ w=st−1/4−(s+t)i/2。X=st−1/4, Y=−(s+t)/2
       s,t は λ²+2Yλ+X+1/4=0 の実数解 → Y²−X−1/4≧0 ⇔ X≦Y²−1/4（放物線 X=Y²−1/4 の左側・境界ふくむ）
   (3) Re(1/w)=X/(X²+Y²)。X>0：Y²≧X+1/4 → ≦X/(X+1/2)²≦1/2（相加相乗、X=1/2）→ 最大 1/2（w=1/2±(√3/2)i、αβ=1/2∓(√3/2)i）
       X<0：X≦−1/4 なら Y=0 で 1/X≧−4、−1/4<X<0 なら X/(X+1/2)²+4=(4X+1)(X+1)/(X+1/2)²>0 → 最小 −4（w=−1/4、α=β=2i）
       全探索：Re(αβ) の最大 0.5000、最小 −4.0000 */
(function () {
  const IM = (v, s) => [v, s];
  const plane = (tx, ty) => ({ k: 'axes', tx, ty, xl: '実軸', yl: '虚軸' });
  const parab = Array.from({ length: 81 }, (_, i) => { const t = -1.75 + 3.5 * i / 80; return [t * t - 0.25, t]; });
  const region = (id, extra, o) => ({ t: 'fig', id, col: 1, view: [-2.1, -1.75, 2.5, 1.75], w: (o && o.w) || 560, h: Math.round(((o && o.w) || 560) * 3.5 / 4.6), items: [
    { k: 'poly', pts: parab.concat([[-2.2, 1.75], [-2.2, -1.75]]), close: true, fill: 'y', alpha: 0.22, noStroke: true },
    plane([[1, '1'], [2, '2']], [IM(1, 'i'), IM(-1, '−i')]),
    { k: 'param', x: 't**2-0.25', y: 't', a: -1.75, b: 1.75, c: 'y', label: 'X=Y²−1/4', lat: [1.0, 1.45] },
    { k: 'pt', at: [-0.25, 0], name: '−1/4', dir: 'nw', c: 'y', size: 21 },
    { k: 'pt', at: [0, 0.5], c: 'y', r: 5 }, { k: 'pt', at: [0, -0.5], c: 'y', r: 5 }].concat(extra || []) });
  const circK = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.9, -1.0, 2.1, 2.7], w: 480, h: 444, items: [
    plane([[1, '1'], [-1, '−1']], [IM(1, 'i')]),
    { k: 'circle', o: [0, 1], r: 1, c: 'b', label: 'K', lat: [-1.05, 1.75] },
    { k: 'line', m: 0, n: -0.5, c: 'p', dash: true, label: '虚部 −1/2', lat: [-1.85, -0.8] }].concat(extra || []) });
  const POINTS = [
    '原点を通る円 $|z-i|=1$ の点の逆数は、**直線**（虚部 $=-\\frac12$）の上へ。$|z-i|^2=(z-i)(\\bar z+i)$ と展開し、$z\\bar z$ で割る',
    '$\\frac1\\alpha=s-\\frac i2,\\ \\frac1\\beta=t-\\frac i2$ と実数 $s,\\ t$ でおく。範囲は「**実数 $s,\\ t$ が存在する条件**」＝2次方程式の判別式 $\\ge0$',
    '$\\mathrm{Re}\\dfrac1w=\\dfrac{X}{X^2+Y^2}$ の最大・最小は、$X$ を固定して $Y$ を動かす（1文字ずつ）。$X$ の符号で場合分け'
  ];

  HB.lesson({
    id: 'ut25-6', field: '東大型　数学（理系）', title: '2025 東大 理系 第6問の類題 ― 円周上の点の逆数と、積の逆数がえがく範囲', level: '2025年度 東京大学 理系 第6問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$i$ を虚数単位とし、複素数平面上の円 $K:\\ |z-i|=1$ を考える。',
      parts: [
        '(1)　$z$ が $K$ 上の 0 でない点ならば、$\\dfrac1z$ の虚部は $-\\dfrac12$ であることを示せ。また、虚部が $-\\dfrac12$ であるどんな複素数 $w$ に対しても、$\\dfrac1w$ は $K$ 上の 0 でない点であることを示せ。',
        '(2)　$\\alpha,\\ \\beta$ が $K$ 上の 0 でない点を動くとき（$\\alpha=\\beta$ でもよい）、$w=\\dfrac{1}{\\alpha\\beta}$ がとりうる値の範囲を複素数平面上に図示せよ。',
        '(3)　$w$ が (2) の範囲を動くとき、$\\dfrac1w$ の実部の最大値と最小値を求めよ。'
      ],
      src: '※ 2025年度 東京大学 理系 第6問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '円の上を動く複素数の「逆数」がテーマです。(1) の性質を (2)(3) でどう使うかを意識して読みましょう。',
        add: [{ t: 'prob' }] },
      { clear: true, part: '読みかえ', say: '円 $K$ は中心 $i$、半径 1 で、原点を通ります。この円上の点の逆数を、いくつか計算してみます。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: '$K$：中心 $i$、半径 1 の円（原点 O を通る）\n$z=2i$ なら $\\dfrac1z=-\\dfrac i2$' },
          circK('k1', [{ k: 'pt', at: [0, 2], name: '2i', dir: 'ne', dx: 8, dy: -10, c: 'b', size: 22 }, { k: 'pt', at: [0, -0.5], name: '−i/2', dir: 'sw', c: 'p', size: 22 }])] },
      { ask: { type: 'choice', q: '$z=1+i$（$K$ 上の点）のとき、$\\dfrac1z$ は？',
        opts: ['$1-i$', '$\\dfrac{1+i}{2}$', '$-\\dfrac{1+i}{2}$', '$\\dfrac{1-i}{2}$'], ok: 3,
        why: { 0: 'それは共役複素数 $\\bar z$。$|z|^2=2$ で割ります。', 1: '分子は $\\bar z=1-i$。虚部の符号が逆です。', 2: '実部の符号が逆です。$\\frac{1}{1+i}=\\frac{1-i}{(1+i)(1-i)}$。' },
        good: '$\\dfrac{1}{1+i}=\\dfrac{1-i}{2}$。虚部はやはり $-\\dfrac12$。逆数はみな直線（桃）の上に乗りそうです。',
        draw: [{ fig: 'k1', items: [{ k: 'pt', at: [1, 1], name: '1+i', dir: 'e', c: 'b', size: 22 }, { k: 'pt', at: [0.5, -0.5], name: '(1−i)/2', dir: 'se', dx: 6, c: 'p', size: 22 }] }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$|z-i|^2=1$ を、共役複素数を使って展開します。$\\overline{z-i}=\\bar z+i$ に注意。',
        add: [{ t: 'h', text: '(1)　逆数の虚部は一定' },
          { t: 'm', size: 'sm', tex: '|z-i|^2=(z-i)(\\bar z+i)=z\\bar z+iz-i\\bar z+1=1' },
          { t: 'm', size: 'sm', tex: 'z\\bar z+i(z-\\bar z)=0', note: '…①' }] },
      { ask: { type: 'choice', q: '$\\dfrac1z$ を出すために、①の両辺を何で割る？',
        opts: ['$z$', '$z\\bar z$（$=|z|^2\\neq0$）', '$i$', '$z-\\bar z$'], ok: 1,
        why: { 0: '$z$ で割ると $\\bar z+i\\left(1-\\frac{\\bar z}{z}\\right)=0$。$\\frac1z$ がきれいに出ません。', 2: '$i$ で割っても $z,\\ \\bar z$ のままです。', 3: '$z-\\bar z=0$（$z$ が実数）のときに割れません。' },
        good: '$\\frac{z}{z\\bar z}=\\frac1{\\bar z}$、$\\frac{\\bar z}{z\\bar z}=\\frac1z$ となり、逆数の式になります。',
        add: [{ t: 'm', size: 'sm', tex: '1+i\\left(\\frac1{\\bar z}-\\frac1z\\right)=0\\ \\Longrightarrow\\ w-\\bar w=-i', note: '$w=\\frac1z$\n（$\\frac1{\\bar z}=\\bar w$）' },
          { t: 'm', size: 'sm', tex: 'w-\\bar w=2i\\,\\mathrm{Im}\\,w\\ \\text{より}\\ \\ \\mathrm{Im}\\,w=-\\frac12' }] } },
      { say: '逆向き。$w=s-\\frac i2$（$s$ は実数）なら、$\\left|\\frac1w-i\\right|=\\frac{|1-iw|}{|w|}$ で、$1-iw=\\frac12-is$。分母分子の絶対値が等しく、1 になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\left|\\frac1w-i\\right|=\\frac{|1-iw|}{|w|}=\\frac{\\left|\\frac12-is\\right|}{\\left|s-\\frac i2\\right|}=1' },
          { t: 'ans', label: '(1)', text: '$z\\in K,\\ z\\ne0$ ⇔ $\\dfrac1z$ は直線「虚部 $=-\\dfrac12$」の上の点\n（直線上のすべての点が、ちょうど現れる）' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。(1) より、$\\frac1\\alpha,\\ \\frac1\\beta$ は実数 $s,\\ t$ を使って表せて、$s,\\ t$ はすべての実数を動きます。',
        add: [{ t: 'h', text: '(2)　w ＝ 1／(αβ) の範囲' },
          { t: 'm', size: 'sm', tex: '\\frac1\\alpha=s-\\frac i2,\\qquad \\frac1\\beta=t-\\frac i2\\quad(s,\\ t\\ \\text{は実数})' },
          { t: 'm', size: 'sm', tex: 'w=\\Big(s-\\frac i2\\Big)\\Big(t-\\frac i2\\Big)' }] },
      { ask: { type: 'choice', q: '$w=X+Yi$（$X,\\ Y$ は実数）とおくと？',
        opts: ['$X=st+\\dfrac14,\\ Y=-\\dfrac{s+t}{2}$', '$X=st-\\dfrac14,\\ Y=\\dfrac{s+t}{2}$', '$X=st-\\dfrac14,\\ Y=-\\dfrac{s+t}{2}$', '$X=st,\\ Y=-(s+t)$'], ok: 2,
        why: { 0: '$\\left(-\\frac i2\\right)^2=-\\frac14$。$i^2=-1$ を使います。', 1: '虚部は $-\\frac{s}{2}-\\frac{t}{2}$。符号はマイナスです。', 3: '$\\frac12$ と $-\\frac14$ を落としています。' },
        good: '$st-\\frac{s+t}{2}i+\\frac{i^2}{4}=\\left(st-\\frac14\\right)-\\frac{s+t}{2}i$。',
        add: [{ t: 'm', size: 'sm', tex: 'X=st-\\frac14,\\qquad Y=-\\frac{s+t}{2}' }] } },
      { say: '点 $(X,\\ Y)$ が範囲に入る ⇔ これをみたす **実数** $s,\\ t$ がある。和と積が分かるので、$s,\\ t$ は2次方程式の2つの解です。',
        add: [{ t: 'm', size: 'sm', tex: 's+t=-2Y,\\qquad st=X+\\frac14' },
          { t: 'm', size: 'sm', tex: '\\lambda^2+2Y\\lambda+X+\\frac14=0', note: '$s,\\ t$ はこの解' }] },
      { ask: { type: 'choice', q: '実数 $s,\\ t$（等しくてもよい）が存在する条件は？',
        opts: ['$X\\ge Y^2-\\dfrac14$', '$X\\le Y^2-\\dfrac14$', '$X\\le Y^2+\\dfrac14$', '$Y\\le X^2-\\dfrac14$'], ok: 1,
        why: { 0: '判別式 $\\ge0$ は $Y^2-X-\\frac14\\ge0$。不等号の向きが逆です。', 2: '定数項は $X+\\frac14$。$\\frac14$ の符号に注意。', 3: '$X$ と $Y$ が入れかわっています。' },
        good: '$\\frac D4=Y^2-\\left(X+\\frac14\\right)\\ge0$。$\\alpha=\\beta$ も許すので、等号（重解）もふくみます。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac D4=Y^2-X-\\frac14\\ge0\\iff X\\le Y^2-\\frac14' }] } },
      { say: '境界は、頂点 $-\\frac14$、虚軸と $\\pm\\frac i2$ で交わる、右に開いた放物線。その左側（境界をふくむ）が答えです。',
        add: [{ t: 'ans', label: '(2) 答', text: '放物線 $X=Y^2-\\dfrac14$ とその左側（図の黄色・境界をふくむ）' },
          region('r1')] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$\\mathrm{Re}\\frac1w=\\frac{X}{X^2+Y^2}$。条件 $X\\le Y^2-\\frac14$ のもとでの2変数の最大・最小です。まず $X$ を固定して、$Y$ だけを動かします。',
        add: [{ t: 'h', text: '(3)　1/w の実部の最大・最小' },
          { t: 'm', size: 'sm', tex: '\\mathrm{Re}\\frac1w=\\mathrm{Re}\\frac{\\bar w}{|w|^2}=\\frac{X}{X^2+Y^2}' },
          { t: 'm', size: 'sm', tex: '\\text{条件：}\\ Y^2\\ge X+\\frac14' }] },
      { ask: { type: 'choice', q: '$X>0$ を固定したとき、$\\dfrac{X}{X^2+Y^2}$ をいちばん大きくするには？',
        opts: ['$Y^2=X+\\frac14$ にする', '$Y^2$ を大きくする', '$Y=0$ にする', '$Y$ によらない'], ok: 0,
        why: { 1: '$X>0$ なので、分母が大きいほど値は小さくなります。', 2: '$X>0$ では $Y=0$ は条件をみたしません。', 3: '分母に $Y^2$ があるので、$Y$ で変わります。' },
        good: '分母をいちばん小さく。$Y^2=X+\\frac14$（放物線の上）です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{X}{X^2+Y^2}\\le\\frac{X}{X^2+X+\\frac14}=\\frac{X}{\\left(X+\\frac12\\right)^2}' }] } },
      { say: '相加・相乗平均で $\\left(X+\\frac12\\right)^2\\ge4\\cdot X\\cdot\\frac12=2X$。よって $\\frac{X}{(X+\\frac12)^2}\\le\\frac12$、等号は $X=\\frac12$。$X\\le0$ なら値は 0 以下なので、最大値は $\\frac12$。',
        add: [{ t: 'm', size: 'sm', tex: '\\left(X+\\frac12\\right)^2\\ge2X\\ \\Longrightarrow\\ \\frac{X}{\\left(X+\\frac12\\right)^2}\\le\\frac12', note: '等号 $X=\\frac12$\n$Y=\\pm\\frac{\\sqrt3}{2}$' }] },
      { clear: true, cols: [0.6, 0.4], say: '最小は $X<0$ のとき。値は負なので、$X^2+Y^2$ を小さくしたい。$X\\le-\\frac14$ なら $Y=0$ にできて $\\frac1X\\ge-4$ です。',
        add: [{ t: 'h', text: '(3)　つづき：最小値' },
          { t: 'p', size: 'sm', text: '$X\\le-\\frac14$：$Y=0$ が選べる → $\\dfrac{X}{X^2}=\\dfrac1X\\ge-4$' },
          { t: 'p', size: 'sm', text: '$-\\frac14<X<0$：$Y^2\\ge X+\\frac14$ → 値 $\\ge\\dfrac{X}{\\left(X+\\frac12\\right)^2}$' }] },
      { ask: { type: 'choice', q: '$\\dfrac{X}{\\left(X+\\frac12\\right)^2}+4=\\dfrac{(4X+1)(X+1)}{\\left(X+\\frac12\\right)^2}$ を使うと、$\\mathrm{Re}\\dfrac1w$ の最小値は？',
        opts: ['$-\\dfrac14$', '$-2$', '$-4$', '$-\\dfrac12$'], ok: 2,
        why: { 0: 'それは $w$ の実部 $X$ の値。聞いているのは $\\frac1w$ の実部です。', 1: '$X=-\\frac12$ で $\\frac1X=-2$ ですが、$X=-\\frac14$ のほうが小さくなります。', 3: '値 $-\\frac12$ をとる点もありますが、$X=-\\frac14$ でもっと小さくなります。' },
        good: '$-\\frac14<X<0$ では $(4X+1)(X+1)>0$ なので値 $>-4$。最小値は $X=-\\frac14,\\ Y=0$ のときの $-4$。',
        add: [{ t: 'ans', label: '(3) 答', text: '最大値 $\\dfrac12$　（$w=\\dfrac12\\pm\\dfrac{\\sqrt3}{2}i$）\n最小値 $-4$　（$w=-\\dfrac14$）' }] } },
      { ask: { type: 'think', q: '最小値 $-4$ を与える $\\alpha,\\ \\beta$ を求めよう。',
        hint: '$w=-\\frac14$ は $X=-\\frac14,\\ Y=0$。このとき $s+t=0,\\ st=0$。',
        ans: '$s=t=0$ より $\\dfrac1\\alpha=\\dfrac1\\beta=-\\dfrac i2$、$\\alpha=\\beta=2i$（$K$ のいちばん上の点）。$\\alpha\\beta=-4$',
        after: '$\\frac1w=\\alpha\\beta$ なので、(3) は「$K$ 上の2点の積の実部」の最大・最小でもあります。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '図で見ると、$\\mathrm{Re}\\frac1w=c$ の点は、原点を通る円 $X^2+Y^2=\\frac{X}{c}$。最大・最小は、この円が放物線に **接する** ときです。',
        add: [{ t: 'h', text: '別の見方：等高線は円' },
          { t: 'm', size: 'sm', tex: '\\frac{X}{X^2+Y^2}=c\\iff \\Big(X-\\frac1{2c}\\Big)^2+Y^2=\\frac1{4c^2}' },
          { t: 'p', size: 'sm', text: '$c=\\frac12$：中心 1、半径 1 の円が\n$\\left(\\frac12,\\ \\pm\\frac{\\sqrt3}{2}\\right)$ で放物線に接する\n$c=-4$：中心 $-\\frac18$、半径 $\\frac18$ の円が頂点で接する' },
          region('r2', [{ k: 'circle', o: [1, 0], r: 1, c: 'p', dash: true }, { k: 'circle', o: [-0.125, 0], r: 0.125, c: 'g' },
            { k: 'pt', at: [0.5, Math.sqrt(3) / 2], c: 'p', r: 6 }, { k: 'pt', at: [0.5, -Math.sqrt(3) / 2], c: 'p', r: 6 }], { w: 520 })] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。逆数で「円 ↔ 直線」が入れかわること、存在条件を判別式で書くこと、2変数は1文字ずつ。どれも複素数平面の基本の道具です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
