/* 数学C 第2章 平面上の曲線と複素数平面 媒介変数と極座標 ②：極座標と極方程式
   例はすべて自作（極座標 (4, 5π/6) → (−2√3, 2)／(−1, −√3) → (2, 4π/3)／r cos(θ−π/3)=2 → x+√3y=4／
   r=4cosθ → (x−2)²+y²=4／カージオイド r=2(1+cosθ)（θ=2π/3 で r=1）／r(1−cosθ)=2 → y²=4(x+1)）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。r=f(θ) の曲線は x=f(t)cos t, y=f(t)sin t の param でかく。 */
(function () {
  const POINTS = [
    '**極座標** $(r,\\ \\theta)$：極 O からの距離 $r$ と、始線 OX から測った角 $\\theta$。直交座標とは $x=r\\cos\\theta,\\ y=r\\sin\\theta,\\ r^2=x^2+y^2$',
    '**極方程式**：$r=a$ は O が中心の円、$\\theta=\\alpha$ は O を通る直線。直交座標に直すときは、$r$ をかけるなどして $r\\cos\\theta=x,\\ r\\sin\\theta=y,\\ r^2=x^2+y^2$ を使う',
    '$r=f(\\theta)$ の曲線は、$\\theta$ を動かして点をとってかく。$r=a(1+\\cos\\theta)$ は **カージオイド**（心臓形）'
  ];
  const rad = d => d * Math.PI / 180, pol = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const S3 = Math.sqrt(3), P1 = pol(3, 60), A1 = [-2 * S3, 2], B1 = [-1, -S3];

  HB.lesson({
    id: 'mc2-10', field: '数学C　平面上の曲線と複素数平面', title: '極座標と極方程式', level: '媒介変数と極座標', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　極座標が $\\left(4,\\ \\dfrac56\\pi\\right)$ である点の直交座標を求めよ。',
        '(2)　直交座標が $(-1,\\ -\\sqrt3)$ である点の極座標 $(r,\\ \\theta)$ を求めよ（$0\\le\\theta<2\\pi$）。',
        '(3)　極方程式 $r\\cos\\left(\\theta-\\dfrac{\\pi}{3}\\right)=2$、$r=4\\cos\\theta$ を、直交座標の方程式で表せ。',
        '(4)　極方程式 $r=2(1+\\cos\\theta)$ の表す曲線をかけ。',
        '(5)　極方程式 $r(1-\\cos\\theta)=2$ を、直交座標の方程式で表せ。'] },
    points: POINTS,
    cols: [0.52, 0.48],
    steps: [
      { part: 'めあて', say: '前の時間は、曲線を媒介変数で表しました。この時間は、点の位置を「原点からの **距離**」と「**向き**（角）」で表す、**極座標** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**極座標** と直交座標を行き来できる\n**極方程式** の表す曲線がわかる' }] },

      // ---------- 極座標 ----------
      { clear: true, part: '極座標', say: '平面上に点 O と半直線 OX を決めます。点 P の位置は、距離 OP $=r$ と、OX から OP まで測った角 $\\theta$ で決まります。この $(r,\\ \\theta)$ を P の **極座標** といいます。',
        add: [{ t: 'h', text: '極座標' },
          { t: 'box', c: 'b', label: '極座標', text: '点 O を **極**、半直線 OX を **始線** とする\nOP $=r$、OX から OP への角 $\\theta$（**偏角**）\n$(r,\\ \\theta)$ を P の **極座標** という' },
          { t: 'p', size: 'sm', text: '$\\theta$ は弧度法で、反時計まわりが正の向き' },
          { t: 'fig', id: 'k1', col: 1, view: [-4.6, -2.4, 4.8, 4.6], w: 620, h: 462, items: [
            { k: 'vec', a: [0, 0], b: [4.7, 0], c: 'w', wd: 2.5 }, { k: 'label', at: [4.5, 0], text: 'X（始線）', size: 22, dy: -20, anchor: 'end', plain: true },
            { k: 'seg', a: [0, 0], b: P1, c: 'y', label: 'r', dx: -16, dy: -6 },
            { k: 'angle', o: [0, 0], a: [1, 0], b: P1, rp: 40, c: 'g', label: 'θ', lr: 14 },
            { k: 'pt', at: [0, 0], name: 'O（極）', dir: 's', c: 'w', r: 5, size: 22 }, { k: 'pt', at: P1, name: 'P(r, θ)', dir: 'ne', c: 'y', size: 24 }] }] },
      { say: '極を原点、始線を $x$ 軸の正の部分に重ねると、直交座標 $(x,\\ y)$ との関係がわかります。三角関数の定義そのものです。',
        add: [{ t: 'm', tex: 'x=r\\cos\\theta,\\qquad y=r\\sin\\theta' }, { t: 'm', tex: 'r=\\sqrt{x^2+y^2}', note: '$\\theta$ は $\\cos\\theta=\\dfrac xr,\\ \\sin\\theta=\\dfrac yr$ から' }],
        draw: [{ fig: 'k1', items: [
          { k: 'axes', tx: [], ty: [], o: false },
          { k: 'seg', a: P1, b: [P1[0], 0], c: 'b', dash: true }, { k: 'seg', a: P1, b: [0, P1[1]], c: 'b', dash: true },
          { k: 'label', at: [P1[0], 0], text: 'rcosθ', c: 'b', size: 21, dy: 22, dx: 12 }, { k: 'label', at: [0, P1[1]], text: 'rsinθ', c: 'b', size: 21, dx: -12, anchor: 'end' }] }] },
      { ask: { type: 'choice', q: '極座標が $\\left(4,\\ \\dfrac56\\pi\\right)$ である点の **直交座標** は？',
        opts: ['$(-2\\sqrt3,\\ 2)$', '$(2\\sqrt3,\\ 2)$', '$(-2,\\ 2\\sqrt3)$', '$(-2\\sqrt3,\\ -2)$'], ok: 0,
        why: { 1: '$\\cos\\dfrac56\\pi=-\\dfrac{\\sqrt3}{2}$ は負。$\\dfrac56\\pi$ は第2象限の角です。', 2: '$x=r\\cos\\theta,\\ y=r\\sin\\theta$。$\\cos$ と $\\sin$ の値が入れかわっています。', 3: '$\\sin\\dfrac56\\pi=\\dfrac12$ は正です。' },
        good: '$x=4\\cos\\dfrac56\\pi=-2\\sqrt3$、$y=4\\sin\\dfrac56\\pi=2$。',
        add: [{ t: 'm', size: 'sm', tex: '\\left(4,\\ \\tfrac56\\pi\\right)\\ \\to\\ (-2\\sqrt3,\\ 2)' }],
        draw: [{ fig: 'k1', items: [{ k: 'seg', a: [0, 0], b: A1, c: 'p', dash: true }, { k: 'arc', o: [0, 0], rp: 24, a1: 0, a2: 150, c: 'p' }, { k: 'pt', at: A1, name: '(−2√3, 2)', dir: 'n', c: 'p', size: 22 }] }] } },
      { ask: { type: 'choice', q: '直交座標が $(-1,\\ -\\sqrt3)$ である点の **極座標** は？（$0\\le\\theta<2\\pi$）',
        opts: ['$\\left(2,\\ \\dfrac{\\pi}{3}\\right)$', '$\\left(4,\\ \\dfrac43\\pi\\right)$', '$\\left(2,\\ \\dfrac43\\pi\\right)$', '$\\left(2,\\ \\dfrac53\\pi\\right)$'], ok: 2,
        why: { 0: '$\\tan\\theta=\\sqrt3$ だけで決めると第1象限の角。点は第3象限にあります。', 1: '$r^2=1+3=4$ なので $r=2$。2乗のままです。', 3: '$\\dfrac53\\pi$ は第4象限（$x>0$）の角です。' },
        good: '$r=\\sqrt{1+3}=2$。$\\cos\\theta=-\\dfrac12,\\ \\sin\\theta=-\\dfrac{\\sqrt3}{2}$ より $\\theta=\\dfrac43\\pi$。',
        add: [{ t: 'm', size: 'sm', tex: '(-1,\\ -\\sqrt3)\\ \\to\\ \\left(2,\\ \\tfrac43\\pi\\right)' }],
        draw: [{ fig: 'k1', items: [{ k: 'seg', a: [0, 0], b: B1, c: 'g', dash: true }, { k: 'arc', o: [0, 0], rp: 16, a1: 0, a2: 240, c: 'g' }, { k: 'pt', at: B1, name: '(−1, −√3)', dir: 'w', c: 'g', size: 22 }] }] } },

      // ---------- 極方程式 ----------
      { clear: true, part: '極方程式', say: '極座標 $(r,\\ \\theta)$ の方程式で表された曲線の式を **極方程式** といいます。$r=3$ は「どの向きでも距離が $3$」なので、O が中心の円です。',
        add: [{ t: 'h', text: '極方程式' },
          { t: 'm', tex: 'r=3', note: '極 O が中心、半径 3 の円' },
          { t: 'm', tex: '\\theta=\\frac{\\pi}{4}', note: 'O を通り、始線と $\\frac{\\pi}{4}$ の直線\n（$r<0$ の点もふくめる）' },
          { t: 'fig', id: 'k2', col: 1, view: [-3.6, -3.6, 4.6, 3.6], w: 560, h: 492, items: [
            { k: 'axes', tx: [], ty: [] },
            { k: 'circle', o: [0, 0], r: 3, c: 'y' }, { k: 'label', at: [-2.2, 2.2], text: 'r=3', c: 'y', size: 24, dx: -10, dy: -10, anchor: 'end' },
            { k: 'line', m: 1, n: 0, c: 'b', label: 'θ=π/4', lat: [3.4, 2.5], la: 'start' }] }] },
      { say: '$r\\cos\\left(\\theta-\\frac{\\pi}{3}\\right)=2$ は、数学Ⅱの加法定理で展開してから $r\\cos\\theta=x,\\ r\\sin\\theta=y$ に直します。O から直線への垂線の足 H が、極座標 $\\left(2,\\ \\frac{\\pi}{3}\\right)$ の点です。',
        add: [{ t: 'm', tex: '\\begin{aligned} r\\cos\\theta\\cdot\\frac12+r\\sin\\theta\\cdot\\frac{\\sqrt3}{2}&=2\\\\ \\frac12x+\\frac{\\sqrt3}{2}y&=2\\\\ x+\\sqrt3\\,y&=\\ans{4}\\end{aligned}' }],
        draw: [{ fig: 'k2', items: [
          { k: 'line', m: -1 / S3, n: 4 / S3, c: 'g', label: 'x+√3y=4', lat: [-3.5, 3.1], la: 'start' },
          { k: 'seg', a: [0, 0], b: [1, S3], c: 'p' }, { k: 'right', o: [1, S3], a: [0, 0], b: [2.5, S3 - 1.5 / S3], s: 14, c: 'p' },
          { k: 'pt', at: [1, S3], name: 'H', dir: 'n', c: 'p', r: 5 }, { k: 'label', at: [0.5, S3 / 2], text: '2', c: 'p', size: 24, dx: -14, dy: -4 }] }] },

      // ---------- r=4cosθ ----------
      { clear: true, part: '極方程式を直交座標へ', say: '$r=4\\cos\\theta$ はどんな曲線でしょう。コツは、両辺に $r$ をかけて、$r^2$ と $r\\cos\\theta$ をつくることです。',
        add: [{ t: 'h', text: '$r=4\\cos\\theta$ の表す曲線' },
          { t: 'm', tex: 'r^2=4r\\cos\\theta', note: '両辺に $r$ をかける' },
          { t: 'fig', id: 'k3', col: 1, view: [-1.4, -2.8, 5.2, 2.8], w: 560, h: 475, items: [{ k: 'axes', tx: [[2, '2']], ty: [] }] }] },
      { ask: { type: 'choice', q: '$r=4\\cos\\theta$ を直交座標の方程式に直すと？',
        opts: ['$x^2+y^2=16$', '$(x+2)^2+y^2=4$', '$(x-4)^2+y^2=16$', '$(x-2)^2+y^2=4$'], ok: 3,
        why: { 0: '$r=4$ ではありません。$r^2=4r\\cos\\theta$ から $x^2+y^2=4x$。', 1: '$x^2-4x=(x-2)^2-4$。平方完成の符号に注意。', 2: '$x^2+y^2=4x$ を平方完成すると、中心は $(2,\\ 0)$、半径は $2$。' },
        good: '$x^2+y^2=4x$ を平方完成して $(x-2)^2+y^2=4$。極 O を通る円です。',
        add: [{ t: 'm', tex: 'x^2+y^2=4x\\iff \\ans{(x-2)^2+y^2=4}' }],
        draw: [{ fig: 'k3', items: [{ k: 'circle', o: [2, 0], r: 2, c: 'y' }, { k: 'pt', at: [2, 0], c: 'y', r: 4 },
          { k: 'seg', a: [0, 0], b: pol(4 * Math.cos(rad(40)), 40), c: 'b' }, { k: 'angle', o: [0, 0], a: [1, 0], b: pol(1, 40), rp: 36, c: 'b', label: 'θ', lr: 12 },
          { k: 'pt', at: pol(4 * Math.cos(rad(40)), 40), name: 'r=4cosθ', dir: 'ne', c: 'b', size: 21 }] }] } },

      // ---------- カージオイド ----------
      { clear: true, part: 'r=f(θ) の曲線', say: '$r=2(1+\\cos\\theta)$ のように $r$ が $\\theta$ の関数になっている曲線は、$\\theta$ をいろいろ変えて点 $(r,\\ \\theta)$ をとり、なめらかに結んでかきます。',
        add: [{ t: 'h', text: '$r=2(1+\\cos\\theta)$ の曲線' },
          { t: 'p', size: 'sm', text: '$\\theta$ を $0$ から少しずつ増やして、点 $(r,\\ \\theta)$ をとる' },
          { t: 'fig', id: 'k4', col: 1, view: [-1.2, -2.8, 4.8, 2.8], w: 500, h: 467, items: [{ k: 'axes', tx: [[2, '2'], [4, '4']], ty: [] }] }] },
      { ask: { type: 'choice', q: '$r=2(1+\\cos\\theta)$ で、$\\theta=\\dfrac23\\pi$ のときの $r$ は？',
        opts: ['$3$', '$1$', '$\\dfrac12$', '$0$'], ok: 1,
        why: { 0: '$\\cos\\dfrac23\\pi=-\\dfrac12$ は負です。$1+\\left(-\\dfrac12\\right)=\\dfrac12$。', 2: '$1+\\cos\\dfrac23\\pi=\\dfrac12$ に、前の $2$ をかけ忘れています。', 3: '$r=0$ になるのは $\\theta=\\pi$ のとき（極 O）です。' },
        good: '$2\\left(1-\\dfrac12\\right)=1$。$\\theta$ が $\\pi$ に近づくと、$r$ は $0$ に近づいていきます。' } },
      { say: '表のように点をとって結ぶと、ハートを横にした形になります。$\\cos(-\\theta)=\\cos\\theta$ なので、始線について対称です。この曲線を **カージオイド**（心臓形）といいます。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$\\theta$', '$0$', '$\\frac{\\pi}{3}$', '$\\frac{\\pi}{2}$', '$\\frac23\\pi$', '$\\pi$'], ['$r$', '$4$', '$3$', '$2$', '$1$', '$0$']] },
          { t: 'box', c: 'p', size: 'sm', label: 'カージオイド', text: '$r=a(1+\\cos\\theta)$　始線について対称' }],
        draw: [{ fig: 'k4', items: [
          { k: 'pts', list: [[4, 0], pol(3, 60), pol(2, 90), pol(1, 120), [0, 0], pol(3, -60), pol(2, -90), pol(1, -120)], r: 7, c: 'b' },
          { k: 'param', x: '2*(1+cos(t))*cos(t)', y: '2*(1+cos(t))*sin(t)', c: 'y', label: 'r=2(1+cosθ)', lat: [2.95, -2.45], la: 'start' }] }] },

      // ---------- 考えてみよう ----------
      { clear: true, part: '考えてみよう', say: '最後に、極方程式から2次曲線を見つけます。$r(1-\\cos\\theta)=2$ を、直交座標の方程式に直してみましょう。',
        add: [{ t: 'h', text: '考えてみよう' }, { t: 'm', tex: 'r(1-\\cos\\theta)=2' },
          { t: 'fig', id: 'k5', col: 1, view: [-3.0, -4.0, 4.4, 4.0], w: 440, h: 476, items: [{ k: 'axes', tx: [[2, '2']], ty: [], o: false }] }] },
      { ask: { type: 'think', q: '極方程式 $r(1-\\cos\\theta)=2$ を、直交座標の方程式で表そう。',
        hint: '$r-r\\cos\\theta=2$ より $r=x+2$。両辺を2乗して $r^2=x^2+y^2$ を使う。',
        ans: '$x^2+y^2=(x+2)^2$ より $y^2=4x+4$、つまり $y^2=4(x+1)$（放物線）',
        after: '$r=\\mathrm{OP}$、$x+2$ は直線 $x=-2$ までの距離。「焦点 O と準線 $x=-2$ から等しい距離」― 放物線の定義そのものです。',
        add: [{ t: 'm', tex: 'r=x+2\\ \\text{より}\\ x^2+y^2=(x+2)^2' }, { t: 'ans', label: '答', tex: 'y^2=4(x+1)' }],
        draw: [{ fig: 'k5', items: [{ k: 'param', x: '2/(1-cos(t))*cos(t)', y: '2/(1-cos(t))*sin(t)', a: 0.5, b: 2 * Math.PI - 0.5, n: 600, c: 'y' },
          { k: 'line', x: -2, dash: true, c: 'b' }, { k: 'label', at: [-2, -3.6], text: 'x=−2', c: 'b', size: 22, dx: 8, anchor: 'start' },
          { k: 'pt', at: [0, 0], name: '焦点 O', dir: 'se', c: 'p', size: 22 }, { k: 'pt', at: [-1, 0], c: 'y', r: 5 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。これで平面上の曲線はおしまい。次は、数学的な表現の工夫です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
