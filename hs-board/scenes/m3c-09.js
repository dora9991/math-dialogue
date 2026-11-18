/* 数学Ⅲ 第3章 積分法 積分の応用 ③：曲線の長さと道のり
   例・数値はすべて自作。答え・誤答・図の座標は python3（sympy）で検算ずみ。
   円 x=2cost, y=2sint（0≦t≦2π）：4π、x=3t², y=2t³（0≦t≦1）：∫₀¹6t√(1+t²)dt=4√2−2（誤答 8√2−4・4√2・2√2−1）、
   y=(2/3)x√x（0≦x≦3）：y′=√x、∫₀³√(1+x)dx=14/3、考えてみよう y=(eˣ+e⁻ˣ)/2（0≦x≦log2）：3/4、
   v(t)=sint（0≦t≦3π/2）：位置の変化量 1、道のり 3 */
(function () {
  const POINTS = [
    '曲線 $x=f(t),\\ y=g(t)$ の長さは　$\\displaystyle L=\\int_a^b\\sqrt{\\Big(\\frac{dx}{dt}\\Big)^2+\\Big(\\frac{dy}{dt}\\Big)^2}\\,dt$（小さい直角三角形の斜辺を集める）',
    '$y=f(x)$ の曲線の長さは　$\\displaystyle L=\\int_a^b\\sqrt{1+\\Big(\\frac{dy}{dx}\\Big)^2}\\,dx$。ルートの中を、2乗の形やまとまりの形にして積分する',
    '直線上を動く点：位置の変化量は $\\displaystyle\\int_a^bv(t)\\,dt$、道のりは $\\displaystyle\\int_a^b|v(t)|\\,dt$（もどった分もたす）'
  ];
  const PI = Math.PI, f0 = s => 0.15 * s * s + 0.3, P = [1.5, f0(1.5)], Q = [2.6, f0(2.6)], R = [2.6, f0(1.5)];

  HB.lesson({
    id: 'm3c-09', field: '数学Ⅲ　積分法', title: '曲線の長さと道のり', level: '積分の応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　曲線 $x=3t^2,\\ y=2t^3\\ (0\\le t\\le1)$ の長さを求めよ。', '(2)　曲線 $y=\\dfrac23x\\sqrt x\\ (0\\le x\\le3)$ の長さを求めよ。',
        '(3)　曲線 $y=\\dfrac{e^x+e^{-x}}{2}\\ (0\\le x\\le\\log2)$ の長さを求めよ。', '(4)　数直線上を動く点 P の時刻 $t$ における速度が $v(t)=\\sin t$ のとき、$t=0$ から $t=\\dfrac{3\\pi}{2}$ までの P の位置の変化量と道のりを求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までに、面積と体積を積分で求めました。この章の最後は **曲線の長さ** です。また、直線上を動く点の **道のり** も積分で求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '媒介変数で表された曲線や $y=f(x)$ の曲線の長さを、定積分で求められる\n直線上を動く点の、位置の変化量と道のりを区別して求められる' }] },

      // ---------- 考え方 ----------
      { clear: true, part: '曲線の長さ', say: '曲線を細かく分けると、1つ1つの小さい部分はほぼまっすぐです。横 $\\Delta x$・たて $\\Delta y$ の直角三角形の斜辺なので、長さはほぼ $\\sqrt{(\\Delta x)^2+(\\Delta y)^2}$ です。',
        add: [{ t: 'h', text: '曲線の長さの考え方' },
          { t: 'm', tex: '\\Delta s\\fallingdotseq\\sqrt{(\\Delta x)^2+(\\Delta y)^2}', note: '三平方の定理' },
          { t: 'fig', id: 'ds', col: 1, view: [-0.3, -0.3, 4.0, 2.65], w: 560, h: 384, items: [
            { k: 'axes', tx: [], ty: [] },
            { k: 'fn', f: '0.15*x**2+0.3', a: 0.2, b: 3.55, c: 'w' },
            { k: 'seg', a: P, b: R, c: 'b', dash: true, wd: 2.5 }, { k: 'seg', a: R, b: Q, c: 'b', dash: true, wd: 2.5 },
            { k: 'right', o: R, a: P, b: Q, s: 14, c: 'b' },
            { k: 'seg', a: P, b: Q, c: 'p', wd: 5 },
            { k: 'label', at: [(P[0] + R[0]) / 2, P[1]], text: 'Δx', c: 'b', dy: 22, size: 22 },
            { k: 'label', at: [Q[0], (R[1] + Q[1]) / 2], text: 'Δy', c: 'b', dx: 26, size: 22 },
            { k: 'label', at: [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], text: 'Δs', c: 'p', dx: -22, dy: -20, size: 24 },
            { k: 'pt', at: P, r: 5, c: 'p' }, { k: 'pt', at: Q, r: 5, c: 'p' }] }] },
      { say: '$t$ で表された曲線なら、$\\Delta t$ で割って $\\dfrac{\\Delta s}{\\Delta t}\\fallingdotseq\\sqrt{\\Big(\\dfrac{\\Delta x}{\\Delta t}\\Big)^2+\\Big(\\dfrac{\\Delta y}{\\Delta t}\\Big)^2}$。これを集めた極限が、曲線の長さです。',
        add: [{ t: 'box', c: 'y', label: '公式', text: '曲線 $x=f(t),\\ y=g(t)\\ \\ (a\\le t\\le b)$ の長さ\n$\\displaystyle L=\\int_a^b\\sqrt{\\Big(\\frac{dx}{dt}\\Big)^2+\\Big(\\frac{dy}{dt}\\Big)^2}\\,dt$' }] },
      { ask: { type: 'choice', q: '円 $x=2\\cos t,\\ y=2\\sin t\\ (0\\le t\\le2\\pi)$ に公式を使うと、長さは？',
        opts: ['$2\\pi$', '$8\\pi$', '$4\\pi$'], ok: 2,
        why: { 0: '$\\sqrt{4\\sin^2t+4\\cos^2t}=\\sqrt4=2$。係数の 2 を落としています。', 1: 'ルートを忘れて $\\displaystyle\\int_0^{2\\pi}4\\,dt$ にしています。' },
        good: '$\\sqrt{(-2\\sin t)^2+(2\\cos t)^2}=2$ なので $\\displaystyle\\int_0^{2\\pi}2\\,dt=4\\pi$。円周 $2\\pi r$ と一致します。',
        add: [{ t: 'm', size: 'sm', tex: 'L=\\int_0^{2\\pi}\\sqrt{(-2\\sin t)^2+(2\\cos t)^2}\\,dt=\\int_0^{2\\pi}2\\,dt=\\ans{4\\pi}' }] } },

      // ---------- 例 ----------
      { clear: true, part: '媒介変数の曲線', say: '例：曲線 $x=3t^2,\\ y=2t^3\\ (0\\le t\\le1)$ の長さ。$\\dfrac{dx}{dt}=6t$、$\\dfrac{dy}{dt}=6t^2$。$t\\ge0$ なので、ルートの中から $6t$ を外に出せます。',
        add: [{ t: 'h', text: '例　x = 3t²，y = 2t³（0 ≦ t ≦ 1）' },
          { t: 'm', tex: '\\Big(\\frac{dx}{dt}\\Big)^2+\\Big(\\frac{dy}{dt}\\Big)^2=36t^2+36t^4=36t^2(1+t^2)' },
          { t: 'm', tex: 'L=\\int_0^1\\sqrt{36t^2(1+t^2)}\\,dt=\\int_0^16t\\sqrt{1+t^2}\\,dt', note: '$t\\ge0$' },
          { t: 'fig', id: 'sc', col: 1, view: [-0.45, -0.45, 3.7, 2.55], w: 520, h: 376, items: [
            { k: 'axes', tx: [3], ty: [2] },
            { k: 'param', x: '3*t**2', y: '2*t**3', a: 0, b: 1, c: 'y', wd: 4 },
            { k: 'param', x: '3*t**2', y: '2*t**3', a: 1, b: 1.1, c: 'd', dash: true },
            { k: 'pt', at: [3, 2], r: 5, c: 'y', name: '(3, 2)', dir: 'nw', size: 22 }, { k: 'label', at: [2.25, 0.35], text: 't=0 から t=1', c: 'y', size: 20 }] }] },
      { ask: { type: 'choice', q: '$L=\\displaystyle\\int_0^16t\\sqrt{1+t^2}\\,dt$ の値は？',
        opts: ['$4\\sqrt2-2$', '$8\\sqrt2-4$', '$4\\sqrt2$', '$2\\sqrt2-1$'], ok: 0,
        why: { 1: '$u=1+t^2$ なら $du=2t\\,dt$ で、$6t\\,dt=3\\,du$。2 で割り忘れています。', 2: '下端 $t=0$ での値 $2$ をひき忘れています。', 3: '$3\\displaystyle\\int\\sqrt u\\,du=3\\cdot\\frac23u\\sqrt u=2u\\sqrt u$。係数の 2 が落ちています。' },
        good: '$u=1+t^2$ とおくと　$\\displaystyle\\int_1^23\\sqrt u\\,du=\\Big[\\,2u\\sqrt u\\,\\Big]_1^2=4\\sqrt2-2$（約 3.66）。',
        add: [{ t: 'm', size: 'sm', tex: 'L=\\Big[\\,2(1+t^2)\\sqrt{1+t^2}\\,\\Big]_0^1=\\ans{4\\sqrt2-2}', note: '$u=1+t^2$ の置換' }] } },

      // ---------- y = f(x) ----------
      { clear: true, part: 'y = f(x) の曲線', say: '$y=f(x)$ の曲線は、$x=t,\\ y=f(t)$ と見れば $\\dfrac{dx}{dt}=1$。だから、公式は次の形になります。',
        add: [{ t: 'h', text: 'y = f(x) の曲線の長さ' },
          { t: 'box', c: 'y', label: '公式', text: '曲線 $y=f(x)\\ \\ (a\\le x\\le b)$ の長さ\n$\\displaystyle L=\\int_a^b\\sqrt{1+\\Big(\\frac{dy}{dx}\\Big)^2}\\,dx$' },
          { t: 'fig', id: 'fx', col: 1, view: [-0.45, -0.45, 3.8, 4.0], w: 420, h: 440, items: [
            { k: 'axes', tx: [3], ty: [] },
            { k: 'fn', f: '2/3*x**1.5', a: 0, b: 3, c: 'y', wd: 4, label: 'y=(2/3)x√x', lat: [0.25, 2.2] },
            { k: 'fn', f: '2/3*x**1.5', a: 3, b: 3.4, c: 'd', dash: true },
            { k: 'pt', at: [3, 2 * Math.sqrt(3)], r: 5, c: 'y', name: '(3, 2√3)', dir: 'w', size: 22 }] }] },
      { ask: { type: 'choice', q: '曲線 $y=\\dfrac23x\\sqrt x\\ (0\\le x\\le3)$ で、$\\sqrt{1+\\Big(\\dfrac{dy}{dx}\\Big)^2}$ は？',
        opts: ['$1+\\sqrt x$', '$\\sqrt{1+x}$', '$\\sqrt{1+x^2}$', '$\\sqrt{1+\\frac49x^3}$'], ok: 1,
        why: { 0: '$\\sqrt{1+x}$ を $1+\\sqrt x$ と分けることはできません。', 2: '$\\dfrac{dy}{dx}=\\sqrt x$ なので、2乗すると $x$ です。', 3: '$y$ そのものを2乗しています。2乗するのは、微分した $\\dfrac{dy}{dx}$ です。' },
        good: '$y=\\dfrac23x\\sqrt x$ を微分すると $\\dfrac{dy}{dx}=\\sqrt x$。2乗して 1 をたすと $1+x$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}L&=\\int_0^3\\sqrt{1+x}\\,dx=\\Big[\\,\\frac23(1+x)\\sqrt{1+x}\\,\\Big]_0^3\\\\ &=\\frac23(8-1)=\\ans{\\frac{14}{3}}\\end{aligned}' }] } },

      // ---------- 考えてみよう ----------
      { clear: true, part: '考えてみよう', add: [{ t: 'h', text: 'ルートがはずれる曲線' },
          { t: 'm', tex: 'y=\\frac{e^x+e^{-x}}{2}\\qquad(0\\le x\\le\\log2)' },
          { t: 'fig', id: 'ct', col: 1, view: [-1.3, -0.35, 1.5, 2.0], w: 520, h: 436, items: [
            { k: 'axes', tx: [[1, '1']], ty: [[1, '1']] },
            { k: 'fn', f: '(exp(x)+exp(-x))/2', a: -1.25, b: 1.3, c: 'd' },
            { k: 'fn', f: '(exp(x)+exp(-x))/2', a: 0, b: Math.LN2, c: 'y', wd: 5 },
            { k: 'seg', a: [Math.LN2, 0], b: [Math.LN2, 1.25], c: 'd', dash: true, wd: 2 },
            { k: 'label', at: [Math.LN2, 0], text: 'log 2', plain: true, c: 'd', size: 20, dy: 24 }] }],
        ask: { type: 'think', q: '曲線 $y=\\dfrac{e^x+e^{-x}}{2}\\ (0\\le x\\le\\log2)$ の長さを求めよう。',
        hint: '$\\dfrac{dy}{dx}=\\dfrac{e^x-e^{-x}}{2}$。$1+\\Big(\\dfrac{dy}{dx}\\Big)^2=\\Big(\\dfrac{e^x+e^{-x}}{2}\\Big)^2$ になります（展開して確かめよう）。',
        ans: '$L=\\displaystyle\\int_0^{\\log2}\\frac{e^x+e^{-x}}{2}\\,dx=\\Big[\\,\\frac{e^x-e^{-x}}{2}\\,\\Big]_0^{\\log2}=\\frac{2-\\frac12}{2}=\\frac34$',
        after: 'ロープの両はしを持ってたらしたときの形（懸垂線）です。ルートがきれいにはずれる、めずらしい例です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}L&=\\int_0^{\\log2}\\frac{e^x+e^{-x}}{2}\\,dx=\\Big[\\,\\frac{e^x-e^{-x}}{2}\\,\\Big]_0^{\\log2}\\\\ &=\\frac12\\Big(2-\\frac12\\Big)=\\ans{\\frac34}\\end{aligned}', note: '$e^{\\log2}=2$\n$e^{-\\log2}=\\frac12$' }] } },

      // ---------- 道のり ----------
      { clear: true, part: '位置と道のり', say: '数直線上を動く点 P の、時刻 $t$ での速度を $v(t)$ とします。前の章で学んだように、位置を微分すると速度。逆に、速度を積分すると位置の変化がわかります。',
        add: [{ t: 'h', text: '直線上を動く点の位置と道のり' },
          { t: 'box', c: 'y', label: '公式', text: '$t=a$ から $t=b$ までの\n位置の変化量 $\\displaystyle\\int_a^bv(t)\\,dt$　　道のり $\\displaystyle\\int_a^b|v(t)|\\,dt$' },
          { t: 'fig', id: 'vt', col: 1, view: [-0.5, -1.45, 5.4, 1.45], w: 560, h: 330, items: [
            { k: 'area', f: 'sin(x)', a: 0, b: PI, c: 'y', label: '2', lat: [PI / 2, 0.42] },
            { k: 'area', f: '0', g: 'sin(x)', a: PI, b: 1.5 * PI, c: 'b', label: '1', lat: [3.95, -0.38] },
            { k: 'axes', xl: 't', yl: 'v', tx: [[PI, 'π'], [1.5 * PI, '3π/2']], ty: [[1, '1'], [-1, '−1']] },
            { k: 'fn', f: 'sin(x)', a: 0, b: 1.5 * PI + 0.15, c: 'w', label: 'v=sin t', lat: [2.1, 1.2] },
            { k: 'label', at: [PI / 2, 0], text: '進む', c: 'y', dy: 24, size: 20 }, { k: 'label', at: [3.95, 0], text: 'もどる', c: 'b', dy: -22, size: 20 }] }] },
      { say: '例：$v(t)=\\sin t$ で、$t=0$ から $t=\\dfrac{3\\pi}{2}$ まで。$\\pi<t<\\dfrac{3\\pi}{2}$ では $v<0$ で、P は **もどって** います。位置の変化量は、進んだ $2$ ともどった $1$ の差です。',
        add: [{ t: 'm', tex: '\\int_0^{\\frac{3\\pi}{2}}\\sin t\\,dt=\\Big[-\\cos t\\Big]_0^{\\frac{3\\pi}{2}}=0-(-1)=1', note: '位置の変化量' }] },
      { ask: { type: 'choice', q: '$t=0$ から $t=\\dfrac{3\\pi}{2}$ までに P が動いた **道のり** は？',
        opts: ['$1$', '$2$', '$-1$', '$3$'], ok: 3,
        why: { 0: 'それは位置の変化量。もどった分も、道のりにはたします。', 1: '$0\\le t\\le\\pi$ の部分だけです。もどった $1$ もたします。', 2: '道のりは負になりません。$|v(t)|$ を積分します。' },
        good: '$\\displaystyle\\int_0^\\pi\\sin t\\,dt+\\int_\\pi^{\\frac{3\\pi}{2}}(-\\sin t)\\,dt=2+1=3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int_0^{\\frac{3\\pi}{2}}|\\sin t|\\,dt&=\\int_0^{\\pi}\\sin t\\,dt+\\int_\\pi^{\\frac{3\\pi}{2}}(-\\sin t)\\,dt\\\\ &=2+1=\\ans{3}\\end{aligned}', note: '道のり' }] } },
      { say: '平面上を動く点 $(x(t),\\,y(t))$ の道のりは、曲線の長さと同じ式で求められます。ルートの中は、前の章で学んだ **速さ** の2乗です。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '平面上の点の道のり：\n$\\displaystyle\\int_a^b\\sqrt{\\Big(\\frac{dx}{dt}\\Big)^2+\\Big(\\frac{dy}{dt}\\Big)^2}\\,dt$（速さを積分）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。これで積分法の章は終わりです。面積・体積・長さ・道のりと、積分は「小さい部分を集める」道具として広く使えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
