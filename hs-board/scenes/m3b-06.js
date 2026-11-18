/* 数学Ⅲ 第2章 微分法 ⑥：接線と法線
   例はすべて自作。接線・法線・誤答・図の座標は python3（sympy）で検算ずみ。
   y=e^{2x}：(0, 1) の接線 y=2x+1、法線 y=−x/2+1。y=log x：(e, 1) の接線 y=x/e。y=sin x：(π, 0) の接線 y=−x+π、法線 y=x−π。
   点 A(1, 0) から y=eˣ に引いた接線：接点 (2, e²)、y=e²x−e²。x=t², y=t³ の t=2 の点 (4, 8)：接線 y=3x−4、もう1つの共有点 (1, −1) */
(function () {
  const PI = Math.PI, E = Math.E, E2 = E * E;
  const POINTS = [
    "接線　$y-f(a)=f'(a)(x-a)$、**法線**　$y-f(a)=-\\dfrac{1}{f'(a)}(x-a)$（$f'(a)\\neq0$）。$e^x$・$\\log x$・$\\sin x$ でも同じ",
    '曲線の外の点から引く接線は、**接点を $(t,\\,f(t))$ とおき**、その点を通る条件から $t$ を求める',
    '媒介変数表示の曲線は、$\\dfrac{dy}{dx}=\\dfrac{\\ \\dfrac{dy}{dt}\\ }{\\dfrac{dx}{dt}}$ に $t$ の値を入れて傾きを出し、その $t$ の点を通る直線をつくる'
  ];
  const figA = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.5, -1.2, 2.5, 3.8], w: 440, h: 440, items: [
    { k: 'axes', tx: [-2, -1, 1, 2], ty: [1, 2, 3] },
    { k: 'fn', f: 'exp(2*x)', a: -2.5, b: 0.68, c: 'y', label: 'y=e²ˣ', lat: [-0.2, 3.4], la: 'end' }].concat(items || []) });
  const figB = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.7, -2.6, 6.0, 2.6], w: 520, h: 404, items: [
    { k: 'axes', tx: [1, 2, [E, 'e'], 4, 5], ty: [-2, -1, 1, 2] },
    { k: 'fn', f: 'log(x)', a: 0.05, b: 6.0, c: 'b', label: 'y=log x', lat: [4.4, 1.0] }].concat(items || []) });
  const figC = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.6, -2.3, 6.7, 2.3], w: 560, h: 353, items: [
    { k: 'axes', tx: [[PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']], ty: [1, -1] },
    { k: 'fn', f: 'sin(x)', a: -0.6, b: 6.7, c: 'y', label: 'y=sin x', lat: [0.35, 1.55] }].concat(items || []) });
  const figD = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.6, -1.4, 3.0, 8.8], w: 420, h: 480, items: [
    { k: 'axes', tx: [-1, 1, 2], ty: [2, 4, 6, 8] },
    { k: 'fn', f: 'exp(x)', a: -1.6, b: 2.2, c: 'y', label: 'y=eˣ', lat: [-1.3, 1.3] },
    { k: 'pt', at: [1, 0], name: 'A(1, 0)', dir: 'se', c: 'p', size: 21 }].concat(items || []) });
  const figE = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.2, -9.6, 5.6, 9.6], w: 400, h: 500, items: [
    { k: 'axes', tx: [1, 2, 3, 4, 5], ty: [-8, -4, 4, 8] },
    { k: 'param', x: 't**2', y: 't**3', a: -2.15, b: 2.15, c: 'y', label: 'C', lat: [1.6, 5.2] }].concat(items || []) });

  HB.lesson({
    id: 'm3b-06', field: '数学Ⅲ　微分法', title: '接線と法線', level: '導関数の応用', time: '目安 8分',
    problem: { label: '例題', lead: '次の直線の方程式を求めよ。',
      parts: ['(1)　曲線 $y=e^{2x}$ 上の点 $(0,\\,1)$ における接線と法線', '(2)　曲線 $y=\\log x$ 上の点 $(e,\\,1)$ における接線', '(3)　曲線 $y=\\sin x$ 上の点 $(\\pi,\\,0)$ における接線と法線', '(4)　点 $\\mathrm{A}(1,\\,0)$ から曲線 $y=e^x$ に引いた接線', '(5)　曲線 $x=t^2,\\ y=t^3$ 上の $t=2$ に対応する点における接線'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Ⅱでは、整式の関数のグラフの接線・法線を求めました。前の時間までに、いろいろな関数を微分できるようになったので、それを **接線と法線** に使います。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**接線と法線** を、いろいろな関数で求められる\n外の点からの接線・媒介変数の曲線の接線' }] },

      // ---------- 公式と e^{2x} ----------
      { clear: true, part: '接線と法線', say: '式は数学Ⅱと同じです。**法線** は、接点を通り接線に **垂直** な直線。傾きの積が $-1$ なので、傾きは $-\\dfrac{1}{f\'(a)}$ です。',
        add: [{ t: 'h', text: '接線と法線の方程式' },
          { t: 'box', c: 'y', label: '接線', text: "$y-f(a)=f'(a)(x-a)$" },
          { t: 'box', c: 'p', label: '法線', text: "$y-f(a)=-\\dfrac{1}{f'(a)}(x-a)$　（$f'(a)\\neq0$）" },
          figA('fa', [{ k: 'pt', at: [0, 1], c: 'w' }])] },
      { say: "例1　$y=e^{2x}$ 上の点 $(0,\\,1)$。$y'=2e^{2x}$ より傾きは $2$。接線は $y=2x+1$ です。",
        add: [{ t: 'm', size: 'sm', tex: "y'=2e^{2x},\\quad f'(0)=2" },
          { t: 'm', size: 'sm', tex: '\\text{接線}\\ \\ y-1=2x\\quad \\therefore\\ y=2x+1' }],
        draw: [{ fig: 'fa', items: [{ k: 'line', m: 2, n: 1, a: -1.1, b: 1.4, c: 'g', label: '接線', lat: [1.2, 2.85], la: 'start' }] }] },
      { say: '法線の傾きは $-\\dfrac12$。法線は $y=-\\dfrac12x+1$。縦と横の目もりが同じ図で見ると、接線と直角に交わっています。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{法線}\\ \\ y-1=-\\frac12x\\quad \\therefore\\ y=-\\frac12x+1' }],
        draw: [{ fig: 'fa', items: [{ k: 'line', m: -0.5, n: 1, a: -2.4, b: 2.4, c: 'p', label: '法線', lat: [2.35, 0.25], la: 'end' }, { k: 'right', o: [0, 1], a: [1, 3], b: [2, 0], s: 14 }] }] },

      // ---------- log x ----------
      { clear: true, part: 'log x の接線', say: "例2　$y=\\log x$ 上の点 $(e,\\,1)$。$(\\log x)'=\\dfrac1x$ なので、傾きは $\\dfrac1e$ です。",
        add: [{ t: 'h', text: '例2　$y=\\log x$ 上の点 $(e,\\,1)$' },
          { t: 'm', tex: "y'=\\frac1x,\\quad f'(e)=\\frac1e" },
          figB('fb', [{ k: 'pt', at: [E, 1], name: '(e, 1)', dir: 'nw', c: 'w', size: 21 }])] },
      { ask: { type: 'choice', q: '点 $(e,\\,1)$ における接線の方程式は？',
        opts: ['$y=\\dfrac{x}{e}$', '$y=x-e+1$', '$y=ex-e^2+1$', '$y=\\dfrac{x}{e}+1$'], ok: 0,
        why: { 1: "傾きは $f'(e)=\\dfrac1e$。$1$ ではありません。", 2: '傾きを $e$ にしています。$\\dfrac1x$ に $x=e$ を入れると $\\dfrac1e$。', 3: '$y-1=\\dfrac1e(x-e)$ を整理すると、$-1+1=0$ で定数項は消えます。' },
        good: '$y-1=\\dfrac1e(x-e)$ より $y=\\dfrac{x}{e}$。この接線は **原点を通り** ます。',
        add: [{ t: 'm', tex: 'y-1=\\frac1e(x-e)\\quad \\therefore\\ y=\\frac{x}{e}' }],
        draw: [{ fig: 'fb', items: [{ k: 'line', m: 1 / E, n: 0, a: -0.6, b: 5.9, c: 'g', label: 'y=x/e', lat: [4.1, 2.25], la: 'start' }, { k: 'pt', at: [0, 0], c: 'g' }] }] } },

      // ---------- sin x ----------
      { clear: true, part: 'sin x の接線・法線', say: "例3　$y=\\sin x$ 上の点 $(\\pi,\\,0)$。$(\\sin x)'=\\cos x$ なので傾きは $\\cos\\pi=-1$。接線は $y=-x+\\pi$ です。",
        add: [{ t: 'h', text: '例3　$y=\\sin x$ 上の点 $(\\pi,\\,0)$' },
          { t: 'm', tex: "y'=\\cos x,\\quad f'(\\pi)=\\cos\\pi=-1" },
          { t: 'm', tex: '\\text{接線}\\ \\ y=-(x-\\pi)=-x+\\pi' },
          figC('fc', [{ k: 'line', m: -1, n: PI, a: 1.2, b: 5.1, c: 'g' }, { k: 'pt', at: [PI, 0], c: 'w' }])] },
      { ask: { type: 'choice', q: '点 $(\\pi,\\,0)$ における **法線** の方程式は？',
        opts: ['$y=-x+\\pi$', '$y=x+\\pi$', '$y=-x-\\pi$', '$y=x-\\pi$'], ok: 3,
        why: { 0: 'それは接線です。法線の傾きは $-\\dfrac{1}{-1}=1$。', 1: '法線は点 $(\\pi,\\,0)$ を通ります。$x=\\pi$ を入れると $y=2\\pi$ になってしまいます。', 2: '法線の傾きは $1$。符号が逆です。' },
        good: '傾き $1$ で点 $(\\pi,\\,0)$ を通るので、$y=x-\\pi$。',
        add: [{ t: 'm', tex: '\\text{法線}\\ \\ y=1\\cdot(x-\\pi)=x-\\pi' }],
        draw: [{ fig: 'fc', items: [{ k: 'line', m: 1, n: -PI, a: 1.2, b: 5.1, c: 'p' }, { k: 'right', o: [PI, 0], a: [PI - 1, 1], b: [PI + 1, 1], s: 14 }] }] } },

      // ---------- 曲線外の点から ----------
      { clear: true, part: '外の点からの接線', say: '点 $\\mathrm{A}(1,\\,0)$ から $y=e^x$ に接線を引きます。A は曲線上にないので、数学Ⅱと同じく **接点を $(t,\\,e^t)$ とおいて** 接線の式を作ります。',
        add: [{ t: 'h', text: '点 A(1, 0) から $y=e^x$ に引いた接線' },
          { t: 'm', tex: 'y-e^t=e^t(x-t)', note: '接点 $(t,\\,e^t)$ の接線' },
          figD('fd')] },
      { ask: { type: 'choice', q: 'この接線が $\\mathrm{A}(1,\\,0)$ を通るとき、$t$ の値は？',
        opts: ['$t=1$', '$t=0$', '$t=2$', '$t=-2$'], ok: 2,
        why: { 0: '$x=1$ は A の $x$ 座標。A は曲線上にないので、接点とはちがいます。', 1: '代入すると $-e^t=e^t(1-t)$。$e^t$ で割ると $-1=1-t$ です。', 3: '$-1=1-t$ を移項すると $t=2$。符号に注意。' },
        good: '$x=1,\\ y=0$ を代入して $e^t(2-t)=0$。$e^t>0$ なので $t=2$。',
        add: [{ t: 'm', size: 'sm', tex: '0-e^t=e^t(1-t)\\ \\Rightarrow\\ e^t(2-t)=0', note: '$e^t>0$ より $t=2$' }] } },
      { say: '$t=2$ を代入すると、接点は $(2,\\,e^2)$、接線は $y-e^2=e^2(x-2)$、つまり $y=e^2x-e^2$。',
        add: [{ t: 'ans', label: '答', tex: 'y=e^2x-e^2\\quad(\\text{接点 }(2,\\,e^2))' }],
        draw: [{ fig: 'fd', items: [{ k: 'line', m: E2, n: -E2, a: 0.8, b: 2.25, c: 'g' }, { k: 'pt', at: [2, E2], name: '(2, e²)', dir: 'w', c: 'g', size: 21 }] }] },

      // ---------- 媒介変数 ----------
      { clear: true, part: '媒介変数の曲線', say: '曲線 $x=t^2,\\ y=t^3$ の、$t=2$ に対応する点の接線です。前の時間の公式で、$\\dfrac{dy}{dx}$ を $t$ の式で表します。',
        add: [{ t: 'h', text: '媒介変数表示の曲線の接線' },
          { t: 'm', tex: 'C:\\ x=t^2,\\quad y=t^3' },
          { t: 'm', size: 'sm', tex: '\\frac{dx}{dt}=2t,\\quad \\frac{dy}{dt}=3t^2\\quad \\therefore\\ \\frac{dy}{dx}=\\frac{3t^2}{2t}=\\frac{3t}{2}', note: '$t\\neq0$' },
          { t: 'p', size: 'sm', text: '$t=2$ のとき　$x=4,\\ y=8$　→　点 $(4,\\,8)$' },
          figE('fe', [{ k: 'pt', at: [4, 8], name: '(4, 8)', dir: 'w', c: 'w', size: 21 }])] },
      { ask: { type: 'choice', q: '$t=2$ の点 $(4,\\,8)$ における接線の傾きは？',
        opts: ['$12$', '$3$', '$\\dfrac13$', '$6$'], ok: 1,
        why: { 0: '$12$ は $\\dfrac{dy}{dt}$ だけ。$\\dfrac{dx}{dt}=4$ で割ります。', 2: '$\\dfrac{dx}{dt}\\div\\dfrac{dy}{dt}$ と、逆に割っています。', 3: '$t$ に入れるのは $2$。点の $x$ 座標 $4$ を入れてはいけません。' },
        good: '$\\dfrac{3t}{2}$ に $t=2$ を入れて $3$。',
        add: [{ t: 'm', size: 'sm', tex: 't=2\\ \\text{のとき}\\ \\ \\frac{dy}{dx}=\\frac{3\\cdot2}{2}=3' }] } },
      { say: '傾き $3$ で点 $(4,\\,8)$ を通るので、接線は $y-8=3(x-4)$、つまり $y=3x-4$ です。',
        add: [{ t: 'ans', label: '答', tex: 'y=3x-4' }],
        draw: [{ fig: 'fe', items: [{ k: 'line', m: 3, n: -4, a: -0.6, b: 5.3, c: 'g', label: 'y=3x−4', lat: [4.3, 4.3], la: 'start' }] }] },
      { ask: { type: 'think', q: '図を見ると、この接線は曲線 C ともう1点で交わっています。その点の座標は？',
        hint: '接線の式 $y=3x-4$ に $x=t^2,\\ y=t^3$ を代入して、$t$ の3次方程式にします。接点の $t=2$ は重解です。',
        ans: '$t^3=3t^2-4$ より $(t-2)^2(t+1)=0$。$t=-1$ のときの点で　$(1,\\,-1)$',
        after: '接点では、$t$ の方程式が **重解** をもちます。数学Ⅱの3次関数の接線と同じ考え方です。',
        draw: [{ fig: 'fe', items: [{ k: 'pt', at: [1, -1], c: 'p' }, { k: 'label', at: [2.0, -1.9], text: '(1, −1)', c: 'p', size: 21, anchor: 'start' }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、微分法の大切な定理の1つ、**平均値の定理** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
