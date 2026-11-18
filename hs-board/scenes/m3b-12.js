/* 数学Ⅲ 第2章 微分法 導関数の応用 ⑦：速度・加速度と近似式
   例・数値はすべて自作。速度・加速度・速さ・近似値・誤答・図の座標は python3（sympy）で検算ずみ。
   x=2sin πt：v=2πcos πt、α=−2π²sin πt=−π²x。t=1/3 で x=√3、v=π、α=−√3π²
   楕円 (2cos t, sin t)：v=(−2sin t, cos t)、|v|=√(1+3sin²t)。t=π/3 で P(1, √3/2)、v=(−√3, 1/2)、|v|=√13/2。α=−(x, y)（いつも中心 O の向き）
   √9.06≒3+0.06/6=3.01（真の値 3.009983…）、∛8.12≒2+0.12/12=2.01（2.009950…）、sin31°≒1/2+(√3/2)(π/180)≒0.5151（0.515038…）
   近似式の図：y=x²/4+1/2、a=1、h=1.6、接線 y=x/2+1/4 → 接線上 1.55、本当の値 f(2.6)=2.19 */
(function () {
  const POINTS = [
    '直線上の運動 $x=f(t)$：速度 $v=\\dfrac{dx}{dt}$、加速度 $\\alpha=\\dfrac{dv}{dt}=\\dfrac{d^2x}{dt^2}$。速さは $|v|$',
    '平面上の運動：速度 $\\vec v=\\left(\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}\\right)$、速さ $|\\vec v|=\\sqrt{\\left(\\dfrac{dx}{dt}\\right)^2+\\left(\\dfrac{dy}{dt}\\right)^2}$',
    "1次の近似式：$h$ が $0$ に近いとき　$f(a+h)\\fallingdotseq f(a)+f'(a)h$（接線で近似する）。角は弧度法になおす"
  ];
  const S3 = Math.sqrt(3);
  const nl = (id) => ({ t: 'fig', id, col: 1, view: [-2.8, -0.9, 2.8, 1.3], w: 580, h: 228, items: [
    { k: 'numline', ticks: [[-2, '−2'], [0, '0'], [2, '2']] },
    { k: 'pt', at: [S3, 0], name: 'P', dir: 'nw', off: 22, c: 'y' }] });

  HB.lesson({
    id: 'm3b-12', field: '数学Ⅲ　微分法', title: '速度・加速度と近似式', level: '導関数の応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　数直線上を動く点 P の時刻 $t$ における座標が $x=2\\sin\\pi t$ のとき、$t=\\dfrac13$ における速度と加速度を求めよ。',
        '(2)　座標平面上を動く点 P の時刻 $t$ における座標が $(2\\cos t,\\ \\sin t)$ のとき、$t=\\dfrac{\\pi}{3}$ における速さを求めよ。',
        '(3)　1次の近似式を用いて、$\\sqrt{9.06}$、$\\sqrt[3]{8.12}$、$\\sin31^\\circ$ の近似値を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '微分の最後の時間です。導関数は「変化の速さ」なので、動く点の **速度・加速度** を表せます。また、接線を使って **近似値** を求めることもできます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '直線上・平面上を動く点の **速度・加速度・速さ** を求められる\n**1次の近似式** を使って、近似値を求められる' }] },

      // ---------- 直線上の運動 ----------
      { clear: true, part: '直線上の運動', say: '数直線上を動く点 P の座標が、時刻 $t$ の関数 $x=f(t)$ で表されるとき、$x$ を $t$ で微分したものが **速度**、速度をさらに微分したものが **加速度** です。',
        add: [{ t: 'h', text: '直線上の運動' },
          { t: 'box', c: 'b', size: 'sm', label: '速度・加速度', text: "速度　$v=\\dfrac{dx}{dt}=f'(t)$　　速さ　$|v|$\n加速度　$\\alpha=\\dfrac{dv}{dt}=\\dfrac{d^2x}{dt^2}=f''(t)$" },
          { t: 'm', tex: 'x=2\\sin\\pi t', note: '例1　点 P は $-2$ と $2$ の間を\n行ったり来たりする' },
          nl('nl')] },
      { ask: { type: 'choice', q: '$x=2\\sin\\pi t$ のとき、$t=\\dfrac13$ における **速度** $v$ は？',
        opts: ['$1$', '$\\pi$', '$\\sqrt3\\,\\pi$', '$-\\pi$'], ok: 1,
        why: { 0: '$(\\sin\\pi t)\'=\\pi\\cos\\pi t$。合成関数の微分で $\\pi$ がかかります。', 2: '$\\cos\\dfrac{\\pi}{3}=\\dfrac12$ です。$\\sin$ と $\\cos$ を取りちがえています。', 3: '$\\cos\\dfrac{\\pi}{3}>0$ なので、速度は正です。' },
        good: '$v=2\\pi\\cos\\pi t$。$t=\\dfrac13$ で $v=2\\pi\\cdot\\dfrac12=\\pi$。P は正の向きに動いています。',
        add: [{ t: 'm', size: 'sm', tex: 'v=2\\pi\\cos\\pi t\\qquad t=\\tfrac13\\ \\text{で}\\ v=\\ans{\\pi}' }],
        draw: [{ fig: 'nl', items: [{ k: 'vec', a: [S3, 0.5], b: [S3 + 0.85, 0.5], c: 'b', wd: 4, label: 'v', lat: [S3 + 0.45, 0.85] }] }] } },
      { ask: { type: 'choice', q: '$t=\\dfrac13$ における **加速度** $\\alpha$ は？',
        opts: ['$\\sqrt3\\,\\pi^2$', '$-\\pi^2$', '$-2\\pi^2$', '$-\\sqrt3\\,\\pi^2$'], ok: 3,
        why: { 0: '$(\\cos\\pi t)\'=-\\pi\\sin\\pi t$。マイナスがつきます。', 1: '$\\sin\\dfrac{\\pi}{3}=\\dfrac{\\sqrt3}{2}$ です。', 2: '$\\sin\\dfrac{\\pi}{3}$ をかけ忘れています。' },
        good: '$\\alpha=-2\\pi^2\\sin\\pi t$。$t=\\dfrac13$ で $\\alpha=-2\\pi^2\\cdot\\dfrac{\\sqrt3}{2}=-\\sqrt3\\,\\pi^2$。',
        add: [{ t: 'm', size: 'sm', tex: '\\alpha=-2\\pi^2\\sin\\pi t\\qquad t=\\tfrac13\\ \\text{で}\\ \\alpha=\\ans{-\\sqrt3\\,\\pi^2}' }],
        draw: [{ fig: 'nl', items: [{ k: 'vec', a: [S3, 1.0], b: [S3 - 0.95, 1.0], c: 'p', wd: 4, label: 'α', lat: [S3 - 1.2, 1.0] }] }] } },
      { say: '$\\alpha=-2\\pi^2\\sin\\pi t=-\\pi^2x$ なので、加速度はいつも原点の向き。P は右へ動いていますが、原点の向きに引きもどされて、だんだん遅くなります。',
        add: [{ t: 'p', size: 'xs', text: '$\\alpha=-\\pi^2x$：加速度は いつも原点 O の向き（**単振動**）' }] },

      // ---------- 平面上の運動 ----------
      { clear: true, part: '平面上の運動', say: '平面上を動く点 P$(x,\\ y)$ では、$x$ と $y$ をそれぞれ $t$ で微分した **ベクトル** が速度です。その大きさが **速さ** です。',
        add: [{ t: 'h', text: '平面上の運動' },
          { t: 'box', c: 'b', size: 'sm', label: '速度・速さ', text: "速度　$\\vec v=\\left(\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}\\right)$\n速さ　$|\\vec v|=\\sqrt{\\left(\\dfrac{dx}{dt}\\right)^2+\\left(\\dfrac{dy}{dt}\\right)^2}$\n加速度　$\\vec\\alpha=\\left(\\dfrac{d^2x}{dt^2},\\ \\dfrac{d^2y}{dt^2}\\right)$" },
          { t: 'fig', id: 'el', col: 1, view: [-2.7, -1.5, 2.7, 1.9], w: 600, h: 378, items: [
            { k: 'axes', tx: [-2, 2], ty: [-1, 1] },
            { k: 'param', x: '2*cos(t)', y: 'sin(t)', a: 0, b: 2 * Math.PI }] }] },
      { say: '例2は、P$(2\\cos t,\\ \\sin t)$。P は楕円の上を回ります。微分すると $\\vec v=(-2\\sin t,\\ \\cos t)$。$t=\\dfrac{\\pi}{3}$ では P$\\left(1,\\ \\dfrac{\\sqrt3}{2}\\right)$、$\\vec v=\\left(-\\sqrt3,\\ \\dfrac12\\right)$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec v=(-2\\sin t,\\ \\cos t)\\quad t=\\tfrac{\\pi}{3}\\ \\text{で}\\ \\vec v=\\left(-\\sqrt3,\\ \\tfrac12\\right)', note: '例2' }],
        draw: [{ fig: 'el', items: [{ k: 'pt', at: [1, S3 / 2], name: 'P', dir: 'se', c: 'y' },
          { k: 'vec', a: [1, S3 / 2], b: [1 - S3, S3 / 2 + 0.5], c: 'b', wd: 4 }, { k: 'label', at: [1 - S3, S3 / 2 + 0.5], text: 'v', vec: true, dx: -18, dy: -6, c: 'b' }] }] },
      { ask: { type: 'choice', q: '$t=\\dfrac{\\pi}{3}$ における P の **速さ** $|\\vec v|$ は？',
        opts: ['$\\dfrac{\\sqrt7}{2}$', '$\\sqrt3+\\dfrac12$', '$\\dfrac{\\sqrt{13}}{2}$', '$2$'], ok: 2,
        why: { 0: '$\\sin$ と $\\cos$ を取りちがえています。$(-2\\sin\\frac{\\pi}{3})^2=3$ です。', 1: '成分をそのまま足すのではなく、2乗して足してルートをとります。', 3: '速さ 2 になるのは $t=\\dfrac{\\pi}{2}$ のときです。' },
        good: '$|\\vec v|=\\sqrt{(-\\sqrt3)^2+\\left(\\frac12\\right)^2}=\\sqrt{\\frac{13}{4}}=\\dfrac{\\sqrt{13}}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '|\\vec v|=\\sqrt{3+\\tfrac14}=\\ans{\\tfrac{\\sqrt{13}}{2}}' }] } },
      { say: '一般に $|\\vec v|=\\sqrt{1+3\\sin^2t}$ で、速さは一定ではありません。加速度は $\\vec\\alpha=(-2\\cos t,\\ -\\sin t)$ で、いつも楕円の中心 O の向きです。',
        add: [{ t: 'p', size: 'xs', text: '$\\vec\\alpha=(-2\\cos t,\\ -\\sin t)=-(x,\\ y)$ → いつも中心 O の向き' }],
        draw: [{ fig: 'el', items: [{ k: 'vec', a: [1, S3 / 2], b: [0.06, 0.06 * S3 / 2], c: 'p', wd: 4 }, { k: 'label', at: [0.5, S3 / 4], text: 'α', vec: true, dx: 14, dy: 20, c: 'p' }] }] },

      // ---------- 1次の近似式 ----------
      { clear: true, part: '1次の近似式', say: '微分係数の定義から、$h$ が $0$ に近いとき $\\dfrac{f(a+h)-f(a)}{h}\\fallingdotseq f\'(a)$。分母をはらうと、**1次の近似式** が得られます。',
        add: [{ t: 'h', text: '1次の近似式' },
          { t: 'm', tex: "\\frac{f(a+h)-f(a)}{h}\\fallingdotseq f'(a)", note: '$h$ が $0$ に近いとき' },
          { t: 'box', c: 'y', label: '1次の近似式', tex: "f(a+h)\\fallingdotseq f(a)+f'(a)h" },
          { t: 'fig', id: 'ap', col: 1, view: [-0.4, -0.45, 3.5, 2.75], w: 580, h: 476, items: [
            { k: 'axes', tx: [[1, 'a'], [2.6, 'a+h']], ty: [] },
            { k: 'fn', f: 'x**2/4+0.5', a: -0.3, b: 3.15, label: 'y=f(x)', lat: [0.1, 1.25] },
            { k: 'line', m: 0.5, n: 0.25, a: -0.3, b: 3.5, c: 'b', label: '接線', lat: [3.45, 2.0], la: 'end' },
            { k: 'seg', a: [1, 0], b: [1, 0.75], dash: true, c: 'd' }, { k: 'seg', a: [2.6, 0], b: [2.6, 2.19], dash: true, c: 'd' },
            { k: 'seg', a: [1, 0.75], b: [2.6, 0.75], dash: true, c: 'd' },
            { k: 'pt', at: [1, 0.75], name: 'f(a)', dir: 'nw', c: 'w', size: 21 },
            { k: 'dim', a: [2.6, 0.75], b: [2.6, 1.55], off: -14, label: "f′(a)h", c: 'b' },
            { k: 'pt', at: [2.6, 1.55], c: 'b', r: 5 }, { k: 'pt', at: [2.6, 2.19], name: 'f(a+h)', dir: 'nw', c: 'y', size: 21 }] }] },
      { say: '図で見ると、曲線の高さ $f(a+h)$ を、**接線の高さ** でかわりに使っています。$h$ が小さいほど、ずれ（誤差）は小さくなります。$a=0$ とすると、よく使う形になります。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: 'x が 0 に近いとき', text: '$(1+x)^p\\fallingdotseq1+px$　　$e^x\\fallingdotseq1+x$\n$\\sin x\\fallingdotseq x$　　$\\log(1+x)\\fallingdotseq x$' }] },

      // ---------- 近似値 ----------
      { clear: true, cols: [1], part: '近似値', say: '$\\sqrt{9.06}$ の近似値を求めます。$f(x)=\\sqrt x$、$a=9$、$h=0.06$ と見ます。$\\sqrt9=3$ がきれいに出るので、$a=9$ を選びました。',
        add: [{ t: 'h', text: '例3　$\\sqrt{9.06}$ の近似値' },
          { t: 'm', tex: "f(x)=\\sqrt x,\\qquad f'(x)=\\frac{1}{2\\sqrt x},\\qquad a=9,\\quad h=0.06" }] },
      { ask: { type: 'choice', q: '$\\sqrt{9.06}\\fallingdotseq f(9)+f\'(9)\\times0.06$ の値は？',
        opts: ['$3.01$', '$3.03$', '$3.06$', '$3.02$'], ok: 0,
        why: { 1: "$f'(9)=\\dfrac{1}{2\\sqrt9}=\\dfrac16$。$\\sqrt9=3$ でわり忘れています。", 2: "$f'(9)$ を 1 としています。", 3: '$\\dfrac{0.06}{3}$ で、2 でわり忘れています。' },
        good: '$3+\\dfrac16\\times0.06=3.01$。本当の値は $3.00998\\cdots$ で、とても近い値です。',
        add: [{ t: 'm', tex: '\\sqrt{9.06}\\fallingdotseq3+\\frac{1}{6}\\times0.06=\\ans{3.01}', note: '本当は $3.00998\\cdots$' }] } },
      { ask: { type: 'think', q: '1次の近似式を使って、$\\sqrt[3]{8.12}$ の近似値を求めよう。',
        hint: "$f(x)=\\sqrt[3]{x}=x^{\\frac13}$、$a=8$、$h=0.12$。$f'(x)=\\dfrac13x^{-\\frac23}$ で、$f'(8)=\\dfrac{1}{12}$。",
        ans: '$\\sqrt[3]{8.12}\\fallingdotseq2+\\dfrac{1}{12}\\times0.12=2.01$',
        after: '本当の値は $2.00995\\cdots$。$\\sqrt[3]8=2$ のように、きれいに求まる $a$ を選ぶのがコツです。',
        add: [{ t: 'm', tex: '\\sqrt[3]{8.12}\\fallingdotseq2+\\frac{1}{12}\\times0.12=\\ans{2.01}', note: '本当は $2.00995\\cdots$' }] } },
      { clear: true, cols: [1], part: '角の近似値', say: '三角関数の近似では、**角を弧度法になおす** のを忘れないようにします。$\\sin31^\\circ$ は、$a=\\dfrac{\\pi}{6}\\ (30^\\circ)$、$h=\\dfrac{\\pi}{180}\\ (1^\\circ)$ と見ます。',
        add: [{ t: 'h', text: '例4　$\\sin31^\\circ$ の近似値' },
          { t: 'm', tex: "f(x)=\\sin x,\\quad f'(x)=\\cos x,\\quad a=\\frac{\\pi}{6},\\quad h=\\frac{\\pi}{180}", note: '$1^\\circ=\\dfrac{\\pi}{180}$' },
          { t: 'p', size: 'sm', text: '$\\sqrt3=1.732$、$\\pi=3.1416$ として計算する' }] },
      { ask: { type: 'choice', q: '$\\sin31^\\circ$ の近似値は？（小数第4位まで）',
        opts: ['$1.3660$', '$0.5151$', '$0.4849$', '$0.5087$'], ok: 1,
        why: { 0: '$h=1$ としています。弧度法では $1^\\circ=\\dfrac{\\pi}{180}$ です。', 2: '$(\\sin x)\'=\\cos x$ は正。符号が逆です。', 3: "$f'(a)=\\cos\\dfrac{\\pi}{6}=\\dfrac{\\sqrt3}{2}$ を使います。" },
        good: '$\\dfrac12+\\dfrac{\\sqrt3}{2}\\cdot\\dfrac{\\pi}{180}\\fallingdotseq0.5+0.0151=0.5151$。本当は $0.51504\\cdots$ です。',
        add: [{ t: 'm', tex: '\\sin31^\\circ\\fallingdotseq\\sin\\frac{\\pi}{6}+\\cos\\frac{\\pi}{6}\\cdot\\frac{\\pi}{180}=\\frac12+\\frac{\\sqrt3\\,\\pi}{360}\\fallingdotseq\\ans{0.5151}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。これで微分法は終わりです。次の章では、微分の逆の計算である **積分法** を、数学Ⅲの関数に広げます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
