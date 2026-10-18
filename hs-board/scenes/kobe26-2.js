/* 神戸大型 数学（理系）：2026年度 神戸大学 前期 理系 第2問の類題（自作問題・元の問題ではない）
   問題：f(x)=sin(log x){sin(log x)−√3 cos(log x)}（1≦x≦e^π）のグラフの概形と、x 軸より上の部分の面積
   答え（python3・sympy で検算ずみ）：
     f(x)=1/2−sin(2log x+π/6)、f'(x)=−(2/x)cos(2log x+π/6)
     x=e^{π/6} で極小 −1/2、x=e^{2π/3} で極大 3/2、x 軸と x=1, e^{π/3}, e^π で交わる
     S=∫_{π/3}^{π}{1/2−sin(2u+π/6)}e^u du=((2+√3)e^π−(2−√3)e^{π/3})/5 ≒ 17.12 */
(function () {
  const PI = Math.PI, E6 = Math.exp(PI / 6), E3 = Math.exp(PI / 3), E23 = Math.exp(2 * PI / 3), EP = Math.exp(PI);
  const F = '0.5-sin(2*log(x)+PI/6)';
  // e の右上に小さく指数を書いた目もりの字（図の字は上つきが使えないので、2つの字を組み合わせる）。up:true で x 軸の上に書く
  const ep = (x, s, up, dx) => { const X = dx || 0, Y = up ? -44 : 0; return [{ k: 'label', at: [x, 0], text: 'e', size: 22, dx: X - 4, dy: Y + 24 }, { k: 'label', at: [x, 0], text: s, size: 14, dx: X + 3, dy: Y + 13, anchor: 'start' }]; };
  const graph = (id, items, w, h) => ({ t: 'fig', id, col: 1, view: [-3.4, -0.95, 25.2, 1.95], w: w || 860, h: h || 400, items: [
    { k: 'axes', tx: [[1, ''], [E3, ''], [E23, ''], [EP, '']], ty: [[1.5, '3/2'], [0.5, '1/2'], [-0.5, '−1/2']] },
    { k: 'label', at: [1, 0], text: '1', size: 21, dx: -5, dy: 22, anchor: 'end' }]
    .concat(ep(E3, 'π/3', true, -24), ep(E23, '2π/3'), ep(EP, 'π'))
    .concat(items || [], [{ k: 'fn', f: F, a: 1, b: EP, c: 'w', wd: 3.5 }]) });
  const GUIDE = [
    { k: 'seg', a: [E23, 0], b: [E23, 1.5], c: 'd', wd: 2, dash: true }, { k: 'seg', a: [0, 1.5], b: [E23, 1.5], c: 'd', wd: 2, dash: true },
    { k: 'pt', at: [E23, 1.5], name: '極大', dir: 'ne', c: 'y', size: 21 }, { k: 'pt', at: [E6, -0.5], name: '極小', dir: 'e', c: 'b', size: 21 },
    { k: 'dot', at: [1, 0], c: 'p' }, { k: 'dot', at: [E3, 0], c: 'p' }, { k: 'dot', at: [EP, 0], c: 'p' }];
  const POINTS = [
    '$\\log x$ が sin・cos の中にあるときは $u=\\log x$ とおき、**2倍角の公式と合成** で $\\dfrac12-\\sin\\Big(2u+\\dfrac{\\pi}{6}\\Big)$ のような1つの形にまとめる',
    "$f'(x)=-\\dfrac{2}{x}\\cos\\theta$。$x>0$ なので符号は $\\cos\\theta$ だけで決まる。$\\theta$ の範囲（$\\frac{\\pi}6$〜$\\frac{13\\pi}{6}$）で増減表を作る",
    '面積は $x=e^u$ と置換（$dx=e^u\\,du$・範囲も直す）。$\\int e^u\\sin\\theta\\,du$ は部分積分を2回して、同じ積分 $J$ についての方程式を解く'
  ];

  HB.lesson({
    id: 'kobe26-2', field: '神戸大型　数学（理系）', title: '2026 神戸大 理系 第2問の類題 ― sin(log x) をふくむ関数のグラフと面積', level: '2026年度 神戸大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$1\\le x\\le e^{\\pi}$ で定義された関数　$f(x)=\\sin(\\log x)\\big\\{\\sin(\\log x)-\\sqrt3\\cos(\\log x)\\big\\}$　を考える。',
      parts: [
        '(1)　$f(x)$ の増減を調べ、$y=f(x)$ のグラフの概形をかけ。ただし、グラフの凹凸は調べなくてよい。',
        '(2)　$y=f(x)$ のグラフと $x$ 軸で囲まれた部分のうち、$x$ 軸より上にある部分の面積 $S$ を求めよ。'
      ],
      src: '※ 2026年度 神戸大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', say: '三角関数の中に対数関数が入った関数の、グラフと面積の問題です。まず問題文を読みましょう（Q キーで、いつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.6, 0.4], part: '読みかえ', say: '$\\log x$ がくり返し出てくるので、$u=\\log x$ とおきます。$1\\le x\\le e^{\\pi}$ なので $0\\le u\\le\\pi$。まず 2 倍角の公式でまとめます。',
        add: [{ t: 'h', text: '読みかえ：u = log x とおく' },
          { t: 'm', tex: 'f(x)=\\sin^2u-\\sqrt3\\sin u\\cos u\\quad(0\\le u\\le\\pi)' },
          { t: 'box', c: 'b', size: 'sm', label: '2倍角の公式から', text: '$\\sin^2u=\\dfrac{1-\\cos2u}{2}$，　$\\sin u\\cos u=\\dfrac{\\sin2u}{2}$' }] },
      { say: '代入すると、$\\frac12$ と、$\\sin2u$・$\\cos2u$ の式に分かれます。かっこの中は、三角関数の合成で 1 つの sin にまとめられます。',
        add: [{ t: 'm', tex: 'f(x)=\\frac12-\\Big(\\frac{\\sqrt3}{2}\\sin2u+\\frac12\\cos2u\\Big)' }] },
      { ask: { type: 'choice', q: 'かっこの中を合成すると？',
        opts: ['$\\sin\\Big(2u-\\dfrac{\\pi}{6}\\Big)$', '$\\sin\\Big(2u+\\dfrac{\\pi}{3}\\Big)$', '$\\sin\\Big(2u+\\dfrac{\\pi}{6}\\Big)$', '$\\cos\\Big(2u+\\dfrac{\\pi}{6}\\Big)$'], ok: 2,
        why: { 0: '展開すると $\\cos2u$ の係数が $-\\frac12$ になります。符号が逆です。', 1: '展開すると $\\sin2u$ の係数が $\\cos\\frac{\\pi}{3}=\\frac12$ になってしまいます。', 3: '$\\cos(2u+\\frac{\\pi}6)$ を展開すると、$\\sin2u$ の係数は $-\\frac12$ です。' },
        good: '$\\sin\\Big(2u+\\dfrac{\\pi}{6}\\Big)=\\dfrac{\\sqrt3}{2}\\sin2u+\\dfrac12\\cos2u$。展開してもどるか確かめましょう。',
        add: [{ t: 'm', tex: 'f(x)=\\frac12-\\sin\\Big(2\\log x+\\frac{\\pi}{6}\\Big)' },
          { t: 'box', c: 'y', size: 'sm', col: 1, label: 'まとめた形', text: '$\\theta=2\\log x+\\dfrac{\\pi}{6}$ とおくと\n$f(x)=\\dfrac12-\\sin\\theta$' }] } },

      // ---------- (1) 微分 ----------
      { clear: true, cols: [0.6, 0.4], part: '(1)', say: '(1) です。$\\theta=2\\log x+\\frac{\\pi}6$ とおくと $f(x)=\\frac12-\\sin\\theta$。$x$ が 1 から $e^{\\pi}$ まで動くと、$\\theta$ は $\\frac{\\pi}6$ から $\\frac{13\\pi}{6}$ まで増えます。',
        add: [{ t: 'h', text: '(1)　増減を調べる' },
          { t: 'm', tex: 'f(x)=\\frac12-\\sin\\theta,\\quad\\theta=2\\log x+\\frac{\\pi}{6}' },
          { t: 'm', tex: '\\frac{\\pi}{6}\\le\\theta\\le\\frac{13\\pi}{6}' }] },
      { ask: { type: 'choice', q: "$f'(x)$ はどれ？",
        opts: ['$-\\dfrac{2}{x}\\cos\\theta$', '$-\\cos\\theta$', '$-\\dfrac{1}{x}\\cos\\theta$', '$\\dfrac{2}{x}\\cos\\theta$'], ok: 0,
        why: { 1: '合成関数の微分です。$\\theta$ を $x$ で微分した $\\frac2x$ をかけます。', 2: '$2\\log x$ を微分すると $\\frac2x$。2 を忘れています。', 3: '$-\\sin\\theta$ を $\\theta$ で微分すると $-\\cos\\theta$。符号に注意。' },
        good: '$\\dfrac{d\\theta}{dx}=\\dfrac2x$ なので、$-\\cos\\theta$ に $\\dfrac2x$ をかけます。$x>0$ だから、符号は $-\\cos\\theta$ で決まります。',
        add: [{ t: 'm', tex: "f'(x)=-\\frac{2}{x}\\cos\\theta", note: '符号は $-\\cos\\theta$ と同じ' }] } },
      { say: "$f'(x)=0$ は $\\cos\\theta=0$、つまり $\\theta=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2}$。$\\log x=\\frac{\\pi}6,\\ \\frac{2\\pi}{3}$ なので、$x=e^{\\frac{\\pi}{6}},\\ e^{\\frac{2\\pi}{3}}$ です。",
        add: [{ t: 'm', tex: '\\theta=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2}\\iff x=e^{\\frac{\\pi}{6}},\\ e^{\\frac{2\\pi}{3}}' }] },

      // ---------- (1) 増減表 ----------
      { clear: true, cols: [1], part: '(1) 増減表', say: '増減表です。$x=e^{\\frac{\\pi}6}$ で $\\theta=\\frac{\\pi}2$、$x=e^{\\frac{2\\pi}{3}}$ で $\\theta=\\frac{3\\pi}{2}$。$\\sin\\theta$ はそれぞれ $1,\\ -1$ です。',
        add: [{ t: 'h', text: '(1)　増減表' },
          { t: 'tbl', rows: [['$x$', '$1$', '$\\cdots$', '$e^{\\frac{\\pi}{6}}$', '$\\cdots$', '$e^{\\frac{2\\pi}{3}}$', '$\\cdots$', '$e^{\\pi}$'],
            ['$\\theta$', '$\\frac{\\pi}{6}$', '', '$\\frac{\\pi}{2}$', '', '$\\frac{3\\pi}{2}$', '', '$\\frac{13\\pi}{6}$'],
            ["$f'(x)$", '', '$-$', '$0$', '$+$', '$0$', '$-$', ''],
            ['$f(x)$', '$0$', '$\\searrow$', '$-\\frac12$', '$\\nearrow$', '{{？}}', '$\\searrow$', '$0$']] }] },
      { ask: { type: 'choice', q: '表の ？（$x=e^{\\frac{2\\pi}{3}}$ での極大値）は？',
        opts: ['$\\dfrac12$', '$1$', '$-\\dfrac12$', '$\\dfrac32$'], ok: 3,
        why: { 0: '$\\sin\\frac{3\\pi}{2}=-1$ です。$\\frac12-(-1)$ を計算します。', 1: '$\\frac12-\\sin\\theta$ の $\\frac12$ を忘れずに。$\\frac12+1=\\frac32$ です。', 2: '$-\\frac12$ は $x=e^{\\frac{\\pi}6}$ での極小値です。' },
        good: '$f=\\dfrac12-\\sin\\dfrac32\\pi=\\dfrac12+1=\\dfrac32$。',
        add: [{ t: 'm', tex: 'f\\big(e^{\\frac{2\\pi}{3}}\\big)=\\frac12-\\sin\\frac{3\\pi}{2}=\\ans{\\frac32}', note: '極大値' }] } },
      { say: 'グラフと $x$ 軸の交点も調べます。$f(x)=0\\iff\\sin\\theta=\\frac12$ で、$\\theta=\\frac{\\pi}6,\\ \\frac{5\\pi}{6},\\ \\frac{13\\pi}{6}$。だから $x=1,\\ e^{\\frac{\\pi}3},\\ e^{\\pi}$ です。',
        add: [{ t: 'm', tex: '\\sin\\theta=\\frac12\\iff\\theta=\\frac{\\pi}{6},\\ \\frac{5\\pi}{6},\\ \\frac{13\\pi}{6}\\iff x=1,\\ e^{\\frac{\\pi}{3}},\\ e^{\\pi}', note: '$x$ 軸との交点' }] },

      // ---------- (1) 概形 ----------
      { clear: true, cols: [0.4, 0.6], part: '(1) 概形', say: 'グラフの概形です。$u=\\log x$ が等間隔に進んでも、$x=e^u$ は右へ行くほど間が広がるので、右の山は横に大きくのびます（$e^{\\frac{\\pi}3}\\approx2.85$、$e^{\\pi}\\approx23.1$）。',
        add: [{ t: 'h', text: '(1)　グラフの概形' },
          { t: 'ans', label: '(1) 答', text: '右の図\n極小値 $-\\dfrac12$（$x=e^{\\frac{\\pi}{6}}$）\n極大値 $\\dfrac32$（$x=e^{\\frac{2\\pi}{3}}$）\n$x$ 軸とは $x=1,\\ e^{\\frac{\\pi}{3}},\\ e^{\\pi}$ で交わる' },
          graph('g1', GUIDE)] },
      { ask: { type: 'think', q: "グラフの両はしの傾き $f'(1)$ と $f'(e^{\\pi})$ を求めよう。概形をかくときの目安になります。",
        hint: "$f'(x)=-\\dfrac2x\\cos\\theta$ に、$x=1$（$\\theta=\\frac{\\pi}6$）と $x=e^{\\pi}$（$\\theta=\\frac{13\\pi}{6}$）を入れる。",
        ans: "$f'(1)=-2\\cdot\\dfrac{\\sqrt3}{2}=-\\sqrt3$，　$f'(e^{\\pi})=-\\dfrac{2}{e^{\\pi}}\\cdot\\dfrac{\\sqrt3}{2}=-\\dfrac{\\sqrt3}{e^{\\pi}}$",
        after: '左はしは急に下がり、右はしはほとんど水平に $x$ 軸へ近づきます。図もそうなっています。' } },

      // ---------- (2) 置換 ----------
      { clear: true, cols: [0.5, 0.5], part: '(2)', say: '(2) です。$x$ 軸より上にあるのは $e^{\\frac{\\pi}3}\\le x\\le e^{\\pi}$ の部分（黄）。面積 $S$ は $f(x)$ をこの範囲で積分します。$x=e^u$ と置換しましょう。',
        add: [{ t: 'h', text: '(2)　x 軸より上の部分の面積' },
          { t: 'm', tex: 'S=\\int_{e^{\\frac{\\pi}{3}}}^{e^{\\pi}}f(x)\\,dx' },
          graph('g2', GUIDE.slice(2, 4).concat([{ k: 'area', f: F, a: E3, b: EP, c: 'y', alpha: 0.35, label: 'S', lat: [14, 0.62] }]), 740, 380)] },
      { ask: { type: 'choice', q: '$x=e^u$ と置換すると $S$ は？（$g(u)=\\frac12-\\sin(2u+\\frac{\\pi}{6})$）',
        opts: ['$\\displaystyle\\int_{\\frac{\\pi}{3}}^{\\pi}g(u)\\,du$', '$\\displaystyle\\int_{e^{\\frac{\\pi}{3}}}^{e^{\\pi}}g(u)e^u\\,du$', '$\\displaystyle\\int_{\\frac{\\pi}{3}}^{\\pi}\\frac{g(u)}{u}\\,du$', '$\\displaystyle\\int_{\\frac{\\pi}{3}}^{\\pi}g(u)e^u\\,du$'], ok: 3,
        why: { 0: '$dx=e^u\\,du$ を忘れています。', 1: '積分の範囲も $u$ に直します。$x=e^{\\frac{\\pi}3}$ のとき $u=\\frac{\\pi}3$ です。', 2: '$x=e^u$ なので $dx=e^u\\,du$。$\\frac1u$ ではありません。' },
        good: '$dx=e^u\\,du$、範囲は $\\dfrac{\\pi}3\\to\\pi$ に変わります。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\int_{\\frac{\\pi}{3}}^{\\pi}\\Big\\{\\frac12-\\sin\\Big(2u+\\frac{\\pi}{6}\\Big)\\Big\\}e^u\\,du' }] } },

      // ---------- (2) 部分積分 ----------
      { clear: true, cols: [0.62, 0.38], part: '(2) 部分積分', say: 'むずかしいのは $J=\\int e^u\\sin\\theta\\,du$（ここでは $\\theta=2u+\\frac{\\pi}6$）。部分積分を 2 回すると、もとの $J$ がもう一度出てきます。',
        add: [{ t: 'h', text: '(2)　$J=\\int e^u\\sin\\theta\\,du$ を求める' },
          { t: 'm', tex: '\\theta=2u+\\frac{\\pi}{6},\\qquad \\frac{d\\theta}{du}=2' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned} J&=e^u\\sin\\theta-\\int e^u\\cdot2\\cos\\theta\\,du\\\\ &=e^u\\sin\\theta-2\\Big(e^u\\cos\\theta+2\\int e^u\\sin\\theta\\,du\\Big)\\\\ &=e^u(\\sin\\theta-2\\cos\\theta)-4J \\end{aligned}' }] },
      { ask: { type: 'choice', q: '$J$ はどれ？（積分定数は省略）',
        opts: ['$\\dfrac{e^u(\\sin\\theta-2\\cos\\theta)}{3}$', '$\\dfrac{e^u(\\sin\\theta-2\\cos\\theta)}{5}$', '$\\dfrac{e^u(\\sin\\theta+2\\cos\\theta)}{5}$', '$\\dfrac{e^u(\\sin\\theta-2\\cos\\theta)}{4}$'], ok: 1,
        why: { 0: '$-4J$ を左辺に移すと $J+4J=5J$ です。', 2: '1 回目の部分積分で $-2\\cos\\theta$ の符号が出ます。微分して確かめましょう。', 3: '左辺の $J$ を忘れています。$J+4J=5J$ です。' },
        good: '$5J=e^u(\\sin\\theta-2\\cos\\theta)$。微分してもとの $e^u\\sin\\theta$ にもどるか確かめると安心です。',
        add: [{ t: 'm', tex: 'J=\\frac{e^u(\\sin\\theta-2\\cos\\theta)}{5}+C' }] } },
      { ask: { type: 'think', q: '$\\Big[\\,e^u(\\sin\\theta-2\\cos\\theta)\\,\\Big]_{\\frac{\\pi}{3}}^{\\pi}$ を計算しよう。',
        hint: '$u=\\pi$ のとき $\\theta=\\frac{13\\pi}{6}$、$u=\\frac{\\pi}3$ のとき $\\theta=\\frac{5\\pi}{6}$。',
        ans: '$e^{\\pi}\\Big(\\dfrac12-\\sqrt3\\Big)-e^{\\frac{\\pi}{3}}\\Big(\\dfrac12+\\sqrt3\\Big)$',
        after: '$\\cos\\frac{5\\pi}{6}=-\\frac{\\sqrt3}{2}$ の符号に注意。ここで $-2\\cos\\theta=+\\sqrt3$ になります。',
        add: [{ t: 'm', size: 'sm', col: 1, tex: 'e^{\\pi}\\Big(\\frac12-\\sqrt3\\Big)\\\\-e^{\\frac{\\pi}{3}}\\Big(\\frac12+\\sqrt3\\Big)' }] } },

      // ---------- (2) 答え ----------
      { clear: true, cols: [0.62, 0.38], part: '(2) 答え', say: 'まとめます。$\\frac12e^u$ を積分した部分から、$J$ の部分（$\\frac15$ 倍）を引きます。$e^{\\pi}$ と $e^{\\frac{\\pi}3}$ の係数ごとに整理しましょう。',
        add: [{ t: 'h', text: '(2)　S を計算する' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned} S&=\\frac12\\big(e^{\\pi}-e^{\\frac{\\pi}{3}}\\big)-\\frac15\\Big\\{e^{\\pi}\\Big(\\frac12-\\sqrt3\\Big)-e^{\\frac{\\pi}{3}}\\Big(\\frac12+\\sqrt3\\Big)\\Big\\}\\\\ &=\\frac{2+\\sqrt3}{5}e^{\\pi}-\\frac{2-\\sqrt3}{5}e^{\\frac{\\pi}{3}} \\end{aligned}' }] },
      { say: '答えです。およそ 17.1。幅およそ 20、高さ $\\frac32$ の長方形（約 30）の半分強で、図の黄色の大きさとも合っています。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'S=\\frac{(2+\\sqrt3)e^{\\pi}-(2-\\sqrt3)e^{\\frac{\\pi}{3}}}{5}' },
          { t: 'p', col: 1, size: 'sm', text: '検算：$S\\approx17.1$\n幅 $e^{\\pi}-e^{\\frac{\\pi}3}\\approx20.3$\n× 高さ $\\frac32$ ＝ 約 30.4 より小さい' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: '置換しないで、$x$ のまま部分積分する方法もあります。$(x)\'=1$ と見ると、$x\\cdot\\frac2x$ で $x$ が消えて、同じくり返しになります。',
        add: [{ t: 'h', text: '別の見方：x のまま部分積分' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\int\\sin\\theta\\,dx&=x\\sin\\theta-2\\int\\cos\\theta\\,dx\\\\ \\int\\cos\\theta\\,dx&=x\\cos\\theta+2\\int\\sin\\theta\\,dx\\end{aligned}' },
          { t: 'm', tex: '\\int\\sin\\theta\\,dx=\\frac{x(\\sin\\theta-2\\cos\\theta)}{5}+C', note: '$x=e^u$ で\n本解と同じ' }] },
      { say: '答案で点がつくポイントです。式変形の根拠（2 倍角・合成）、増減の理由（$x>0$）、置換の範囲を、1 行ずつ書きましょう。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: "・2 倍角と合成で $\\frac12-\\sin\\theta$ にまとめる式を書く\n・$f'(x)$ の符号は「$x>0$ なので $-\\cos\\theta$ と同符号」と書く\n・置換は $dx=e^u\\,du$ と、範囲の変化を明記する" }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「1 つの sin にまとめる」「符号は cos だけで決まる」「部分積分 2 回で J の方程式」の 3 つが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
