/* 数学C 第2章 平面上の曲線と複素数平面 媒介変数と極座標 ①：媒介変数表示
   例はすべて自作（x=2t+1, y=t²−1 → y=(x−1)²/4−1／x=3cosθ, y=2sinθ（θ=π/3 で P(3/2, √3)、OP の傾き 2√3/3）／
   x=5cosθ, y=3sinθ → x²/25+y²/9=1／x=2cosθ+1, y=3sinθ−2 → (x−1)²/4+(y+2)²/9=1／
   サイクロイド a=2 のいちばん高い点 (2π, 4)）。値・誤答・図の座標は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '曲線上の点を $x=f(t),\\ y=g(t)$ のように **媒介変数** $t$ で表すのが **媒介変数表示**。$t$ を消去すると $x,\\ y$ の方程式になる',
    '円 $x^2+y^2=r^2$：$x=r\\cos\\theta,\\ y=r\\sin\\theta$。楕円 $\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$：$x=a\\cos\\theta,\\ y=b\\sin\\theta$（$\\cos^2\\theta+\\sin^2\\theta=1$ で消去）',
    '**サイクロイド**：半径 $a$ の円が直線上をすべらずに転がるときの、円周上の点の軌跡。$x=a(\\theta-\\sin\\theta),\\ y=a(1-\\cos\\theta)$'
  ];
  const S3 = Math.sqrt(3), Q = [1.5, 3 * S3 / 2], P = [1.5, S3];
  const T = 2 * Math.PI / 3, C = [T, 1], PC = [T - Math.sin(T), 1 - Math.cos(T)];

  HB.lesson({
    id: 'mc2-09', field: '数学C　平面上の曲線と複素数平面', title: '媒介変数表示', level: '媒介変数と極座標', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$x=2t+1,\\ y=t^2-1$ で表される曲線を、$t$ を消去した方程式で表せ。',
        '(2)　$x=5\\cos\\theta,\\ y=3\\sin\\theta$ で表される曲線の方程式を求めよ。',
        '(3)　$x=2\\cos\\theta+1,\\ y=3\\sin\\theta-2$ で表される曲線の方程式を求めよ。',
        '(4)　半径 $2$ の円が $x$ 軸上をすべらずに転がるときのサイクロイド $x=2(\\theta-\\sin\\theta),\\ y=2(1-\\cos\\theta)$ で、いちばん高い点の座標を求めよ（$0\\le\\theta\\le2\\pi$）。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: '前の時間までは、曲線を $x,\\ y$ の方程式で表してきました。この時間は、点の動きを「第3の変数」で追いかける **媒介変数表示** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '曲線を **媒介変数** で表し、媒介変数を消去して\n$x,\\ y$ の方程式に直せる\n円・楕円・サイクロイドを媒介変数で表せる' }] },

      // ---------- 媒介変数とは ----------
      { clear: true, part: '媒介変数とは', say: '$x=2t+1,\\ y=t^2-1$ のように、$x$ も $y$ も別の変数 $t$ の式で表すことを **媒介変数表示**、$t$ を **媒介変数** といいます。$t$ を時刻と思うと、点が動くようすがわかります。',
        add: [{ t: 'h', text: '媒介変数表示' },
          { t: 'm', tex: 'x=2t+1,\\qquad y=t^2-1' },
          { t: 'tbl', size: 'sm', rows: [['$t$', '$-2$', '$-1$', '$0$', '$1$', '$2$'], ['$x$', '$-3$', '$-1$', '$1$', '$3$', '$5$'], ['$y$', '$3$', '$0$', '$-1$', '$0$', '$3$']] },
          { t: 'fig', id: 'p1', col: 1, view: [-4.2, -2.0, 6.4, 4.4], w: 640, h: 386, items: [
            { k: 'axes', tx: [[-3, '−3'], [1, '1'], [3, '3'], [5, '5']], ty: [[3, '3']] }] }] },
      { say: '$t$ の値ごとに点 $(x,\\ y)$ をとって、$t$ が増える順に結ぶと、曲線が現れます。放物線のような形です。',
        draw: [{ fig: 'p1', items: [
          { k: 'pts', list: [[-3, 3], [-1, 0], [1, -1], [3, 0], [5, 3]], r: 7, c: 'b' },
          { k: 'param', x: '2*t+1', y: 't*t-1', a: -2.4, b: 2.4, c: 'y' },
          { k: 'label', at: [1, -1], text: 't=0', c: 'b', size: 21, dy: 24 }, { k: 'label', at: [5, 3], text: 't=2', c: 'b', size: 21, dx: 34 }, { k: 'label', at: [-3, 3], text: 't=−2', c: 'b', size: 21, dx: -42 }] }] },
      { ask: { type: 'choice', q: '$x=2t+1,\\ y=t^2-1$ から $t$ を消去すると？',
        opts: ['$y=\\dfrac{(x+1)^2}{4}-1$', '$y=\\dfrac{(x-1)^2}{2}-1$', '$y=\\dfrac{(x-1)^2}{4}-1$', '$y=4(x-1)^2-1$'], ok: 2,
        why: { 0: '$x=2t+1$ を $t$ について解くと $t=\\dfrac{x-1}{2}$。符号に注意。', 1: '$\\left(\\dfrac{x-1}{2}\\right)^2$ は、分母も2乗して $4$ です。', 3: '$t=\\dfrac{x-1}{2}$ です。$t=2(x-1)$ ではありません。' },
        good: '$t=\\dfrac{x-1}{2}$ を $y=t^2-1$ に代入して $y=\\dfrac{(x-1)^2}{4}-1$。頂点 $(1,\\ -1)$ の放物線です。',
        add: [{ t: 'm', tex: 't=\\frac{x-1}{2}\\ \\text{より}\\ \\ y=\\ans{\\frac{(x-1)^2}{4}-1}' }] } },

      // ---------- 円と楕円 ----------
      { clear: true, part: '円と楕円', say: '数学Ⅱの三角関数の定義から、円 $x^2+y^2=r^2$ 上の点は $(r\\cos\\theta,\\ r\\sin\\theta)$ と表せます。楕円は円を縦に縮めた形なので、$y$ だけ $b\\sin\\theta$ にかえます。',
        add: [{ t: 'box', c: 'b', label: '円', text: '$x^2+y^2=r^2$　→　$x=r\\cos\\theta,\\ y=r\\sin\\theta$' },
          { t: 'box', c: 'y', label: '楕円', text: '$\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$　→　$x=a\\cos\\theta,\\ y=b\\sin\\theta$' },
          { t: 'fig', id: 'c1', col: 1, view: [-3.8, -3.3, 3.8, 3.3], w: 540, h: 469, items: [
            { k: 'axes', tx: [], ty: [] },
            { k: 'circle', o: [0, 0], r: 3, c: 'd', dash: true },
            { k: 'param', x: '3*cos(t)', y: '2*sin(t)', c: 'y', label: 'x=3cosθ, y=2sinθ', lat: [-3.7, -2.95], la: 'start' }] }] },
      { say: '図は $x=3\\cos\\theta,\\ y=2\\sin\\theta$。半径 $3$ の円の点 Q$(3\\cos\\theta,\\ 3\\sin\\theta)$ を、$y$ 座標だけ $\\frac23$ 倍にした点 P が楕円上を動きます。',
        add: [{ t: 'm', tex: '\\cos^2\\theta+\\sin^2\\theta=1\\ \\text{より}\\ \\left(\\frac x3\\right)^2+\\left(\\frac y2\\right)^2=1', note: '$\\theta$ を消去' }],
        draw: [{ fig: 'c1', items: [
          { k: 'seg', a: [0, 0], b: Q, c: 'd' }, { k: 'seg', a: Q, b: [1.5, 0], c: 'd', dash: true },
          { k: 'angle', o: [0, 0], a: [1, 0], b: Q, rp: 34, c: 'g', label: 'θ', lr: 14 },
          { k: 'pt', at: Q, name: 'Q', dir: 'ne', c: 'd', r: 5 }, { k: 'pt', at: P, name: 'P', dir: 'e', c: 'y' }] }] },
      { ask: { type: 'choice', q: '$x=5\\cos\\theta,\\ y=3\\sin\\theta$ で表される曲線は？',
        opts: ['$\\dfrac{x^2}{5}+\\dfrac{y^2}{3}=1$', '$\\dfrac{x^2}{25}+\\dfrac{y^2}{9}=1$', '$\\dfrac{x^2}{9}+\\dfrac{y^2}{25}=1$', '$x^2+y^2=34$'], ok: 1,
        why: { 0: '$\\cos\\theta=\\dfrac x5$ を2乗するので、分母は $5^2=25$ です。', 2: '$x$ と $y$ の分母が入れかわっています。$x$ の方が $5$ です。', 3: '$x^2+y^2=25\\cos^2\\theta+9\\sin^2\\theta$ は一定になりません。' },
        good: '$\\cos\\theta=\\dfrac x5,\\ \\sin\\theta=\\dfrac y3$ を $\\cos^2\\theta+\\sin^2\\theta=1$ に入れて $\\dfrac{x^2}{25}+\\dfrac{y^2}{9}=1$。',
        add: [{ t: 'm', tex: '\\left(\\frac x5\\right)^2+\\left(\\frac y3\\right)^2=1', note: '楕円' }] } },
      { ask: { type: 'choice', q: '楕円 $x=3\\cos\\theta,\\ y=2\\sin\\theta$ で $\\theta=\\dfrac{\\pi}{3}$ の点は P$\\left(\\dfrac32,\\ \\sqrt3\\right)$。OP と $x$ 軸の正の向きのなす角は $\\dfrac{\\pi}{3}$？',
        opts: ['$\\dfrac{\\pi}{3}$ である', '$\\dfrac{\\pi}{3}$ ではない'], ok: 1,
        why: { 0: 'OP の傾きは $\\sqrt3\\div\\dfrac32=\\dfrac{2\\sqrt3}{3}$。$\\tan\\dfrac{\\pi}{3}=\\sqrt3$ とちがいます。' },
        good: '$\\theta$ は円の点 Q の角で、P の角ではありません。OP の傾きは $\\dfrac{2\\sqrt3}{3}$ で、$\\dfrac{\\pi}{3}$ より小さい角です。',
        add: [{ t: 'p', size: 'sm', text: '$\\theta$ は **円の点 Q の角**。楕円上の P と O を結んだ角とは別' }],
        draw: [{ fig: 'c1', items: [{ k: 'seg', a: [0, 0], b: P, c: 'p' }] }] } },

      // ---------- 双曲線・やってみよう ----------
      { clear: true, part: '双曲線と平行移動', say: '双曲線も三角関数で表せます。$\\dfrac{1}{\\cos^2\\theta}-\\tan^2\\theta=1$ を使うのがポイントです。また、媒介変数表示に定数を加えると、平行移動になります。',
        add: [{ t: 'box', c: 'g', label: '双曲線', text: '$\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1$ は\n$x=\\dfrac{a}{\\cos\\theta},\\ y=b\\tan\\theta$' },
          { t: 'm', tex: '\\left(\\frac xa\\right)^2-\\left(\\frac yb\\right)^2=\\frac{1}{\\cos^2\\theta}-\\tan^2\\theta=1' },
          { t: 'h', text: 'やってみよう' },
          { t: 'm', tex: 'x=2\\cos\\theta+1,\\qquad y=3\\sin\\theta-2' },
          { t: 'fig', id: 'c2', col: 1, view: [-1.8, -5.4, 3.8, 1.4], w: 400, h: 486, items: [{ k: 'axes', tx: [[1, '1'], [3, '3']], ty: [[-2, '−2']] }] }] },
      { ask: { type: 'think', q: '$x=2\\cos\\theta+1,\\ y=3\\sin\\theta-2$ で表される曲線の方程式を求めよう。',
        hint: '$\\cos\\theta=\\dfrac{x-1}{2},\\ \\sin\\theta=\\dfrac{y+2}{3}$ として、$\\cos^2\\theta+\\sin^2\\theta=1$ へ。',
        ans: '$\\dfrac{(x-1)^2}{4}+\\dfrac{(y+2)^2}{9}=1$（中心 $(1,\\ -2)$ の楕円）',
        after: '楕円 $\\dfrac{x^2}{4}+\\dfrac{y^2}{9}=1$ を、$x$ 軸方向に $1$、$y$ 軸方向に $-2$ 平行移動した形です（前の時間の平行移動）。',
        add: [{ t: 'ans', label: '答', tex: '\\frac{(x-1)^2}{4}+\\frac{(y+2)^2}{9}=1' }],
        draw: [{ fig: 'c2', items: [{ k: 'param', x: '2*cos(t)+1', y: '3*sin(t)-2', c: 'y' }, { k: 'pt', at: [1, -2], name: '(1, −2)', dir: 'e', c: 'w', r: 5, size: 22 }] }] } },

      // ---------- サイクロイド ----------
      { clear: true, cols: [0.44, 0.56], part: 'サイクロイド', say: '半径 $a$ の円が、直線（$x$ 軸）の上を **すべらずに転がる** とき、円周上の定点 P が描く曲線を **サイクロイド** といいます。はじめ P は原点にあるとします。',
        add: [{ t: 'h', text: 'サイクロイド' },
          { t: 'box', c: 'y', size: 'sm', label: '定義', text: '円が直線上をすべらずに転がるとき\n円周上の定点 P が描く曲線' },
          { t: 'fig', id: 'cy', col: 1, view: [-0.6, -0.7, 7.2, 2.6], w: 820, h: 347, items: [
            { k: 'axes', tx: [[Math.PI, 'πa'], [2 * Math.PI, '2πa']], ty: [[2, '2a']] },
            { k: 'param', x: 't-sin(t)', y: '1-cos(t)', a: 0, b: T, c: 'y' },
            { k: 'circle', o: C, r: 1, c: 'b' },
            { k: 'seg', a: C, b: PC, c: 'w' }, { k: 'seg', a: C, b: [T, 0], c: 'w' },
            { k: 'pt', at: C, name: 'C', dir: 'ne', c: 'b', r: 4, size: 22 }, { k: 'pt', at: PC, name: 'P', dir: 'nw', c: 'y' }, { k: 'pt', at: [T, 0], name: 'T', dir: 's', c: 'g', r: 5, off: 26 }] }] },
      { say: '円が角 $\\theta$ だけ回ったとします。すべらないので、地面を進んだ長さ OT と、円周の弧 PT の長さは等しく $a\\theta$。中心 C は $(a\\theta,\\ a)$ です。',
        add: [{ t: 'm', tex: '\\mathrm{OT}=\\overset{\\frown}{\\mathrm{PT}}=a\\theta', note: 'すべらない' },
          { t: 'm', tex: '\\mathrm{C}(a\\theta,\\ a)' }],
        draw: [{ fig: 'cy', items: [
          { k: 'seg', a: [0, 0], b: [T, 0], c: 'g', wd: 6 },
          { k: 'arc', o: C, r: 1, a1: 150, a2: 270, c: 'g', wd: 6 },
          { k: 'angle', o: C, a: [T, 0], b: PC, rp: 30, c: 'p', label: 'θ', lr: 12 },
          { k: 'label', at: [T / 2, 0], text: 'aθ', c: 'g', size: 24, dy: 24 }] }] },
      { say: 'はじめ真下にあった P が、C のまわりに $\\theta$ 回った位置なので、C から P へのずれは $(-a\\sin\\theta,\\ -a\\cos\\theta)$。これを C の座標にたします。',
        add: [{ t: 'm', tex: 'x=a\\theta-a\\sin\\theta,\\quad y=a-a\\cos\\theta' },
          { t: 'box', c: 'p', label: 'サイクロイド', text: '$x=a(\\theta-\\sin\\theta)$\n$y=a(1-\\cos\\theta)$' }] },
      { ask: { type: 'choice', q: 'サイクロイド $x=2(\\theta-\\sin\\theta),\\ y=2(1-\\cos\\theta)$（$0\\le\\theta\\le2\\pi$）で、**いちばん高い点** は？',
        opts: ['$(\\pi,\\ 2)$', '$(2\\pi,\\ 2)$', '$(4\\pi,\\ 4)$', '$(2\\pi,\\ 4)$'], ok: 3,
        why: { 0: '$a=2$ をかけ忘れています。$\\theta=\\pi$ で $x=2\\pi,\\ y=4$。', 1: '高さは円の直径 $2a=4$ です。半径ではありません。', 2: '$4\\pi$ は、1回転して P がまた地面にふれる点の $x$ 座標です。' },
        good: '$y=2(1-\\cos\\theta)$ は $\\theta=\\pi$ で最大 $4$。そのとき $x=2(\\pi-0)=2\\pi$。P が円のてっぺんに来たときです。',
        add: [{ t: 'm', tex: '\\theta=\\pi\\ \\text{のとき}\\ (2\\pi,\\ 4)', note: '高さは直径 $2a$' }] } },
      { say: '円が1回転すると、P は円周の長さ $2\\pi a$ だけ進んで、また地面にもどります。サイクロイドは、幅 $2\\pi a$・高さ $2a$ の山をくり返す曲線です。',
        draw: [{ fig: 'cy', items: [{ k: 'param', x: 't-sin(t)', y: '1-cos(t)', a: T, b: 2 * Math.PI + 0.85, c: 'y', dash: true }, { k: 'pt', at: [Math.PI, 2], name: '(πa, 2a)', dir: 'n', c: 'p', r: 5, size: 22 }] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、点の位置を「距離と角」で表す **極座標** と、極方程式です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
