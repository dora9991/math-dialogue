/* 数学Ⅰ 第4章 図形と計量 三角比 ④：三角比の相互関係
   例はすべて自作（cosθ=2/5、tanθ=3、sinθ=1/4。θ はどれも鋭角）。値・誤答は python3（sympy）で検算ずみ。
   図は斜辺 1 の直角三角形（θ=35° の形）と、答えをたしかめる直角三角形（5・2・√21、1・3・√10）。 */
(function () {
  const POINTS = [
    '$\\tan\\theta=\\dfrac{\\sin\\theta}{\\cos\\theta}$、$\\sin^2\\theta+\\cos^2\\theta=1$（三平方の定理）、$1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$（2つめの式を $\\cos^2\\theta$ でわる）',
    '1つの値から残りを出す：sin・cos の一方から → $\\sin^2\\theta+\\cos^2\\theta=1$、tan から → $1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$',
    '$\\theta$ が鋭角なら、sin・cos・tan はどれも **正**。2乗から戻すときは正の方をとる。直角三角形の図でも確かめられる'
  ];
  const C35 = Math.cos(35 * Math.PI / 180), S35 = Math.sin(35 * Math.PI / 180);
  // 直角三角形 A(0,0)・C(w,0)・B(w,h)。ラベル s＝斜辺、t＝対辺、r＝隣辺
  const tri = (w, h, s, t, r, o) => {
    o = o || {}; const k = Math.hypot(w, h), d = o.d || 0.3, z = o.size || 28;
    return [
      { k: 'poly', pts: [[0, 0], [w, 0], [w, h]], close: true, fill: 'w', alpha: 0.05, noStroke: true },
      { k: 'seg', a: [0, 0], b: [w, h], c: 'y', wd: 4 }, { k: 'seg', a: [w, h], b: [w, 0], c: 'p', wd: 4 }, { k: 'seg', a: [w, 0], b: [0, 0], c: 'b', wd: 4 },
      { k: 'right', o: [w, 0], a: [0, 0], b: [w, h], s: 18 },
      { k: 'angle', o: [0, 0], a: [w, 0], b: [w, h], rp: o.rp || 44, label: 'θ', size: 26, lr: o.lr },
      { k: 'label', at: [w / 2 - h / k * d, h / 2 + w / k * d], text: s, c: 'y', size: z, plain: true, anchor: o.sa || 'middle' },
      { k: 'label', at: [w, h / 2], text: t, c: 'p', size: z, anchor: 'start', dx: 14, plain: true },
      { k: 'label', at: [w / 2, 0], text: r, c: 'b', size: z, dy: 30, plain: true }];
  };

  HB.lesson({
    id: 'm1d-04', field: '数学Ⅰ　図形と計量', title: '三角比の相互関係', level: '三角比', time: '目安 7分',
    problem: { label: '例題', lead: '$\\theta$ は鋭角とする。',
      parts: ['(1)　$\\cos\\theta=\\dfrac25$ のとき、$\\sin\\theta,\\ \\tan\\theta$ の値', '(2)　$\\tan\\theta=3$ のとき、$\\cos\\theta,\\ \\sin\\theta$ の値', '(3)　$\\sin\\theta=\\dfrac14$ のとき、$\\cos\\theta,\\ \\tan\\theta$ の値'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '$\\sin\\theta,\\ \\cos\\theta,\\ \\tan\\theta$ の間には、決まった関係があります。この時間は、1つの値から、残りの2つを **計算で** 求められるようにします。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '三角比の相互関係（3つの式）を導き、\n1つの三角比の値から、残りの値を求められる' }] },

      // ---------- 3つの関係 ----------
      { clear: true, part: '斜辺を 1 に', say: '斜辺が 1 の直角三角形で考えます。$\\sin\\theta=\\dfrac{\\text{対辺}}{1}$ なので、対辺の長さが $\\sin\\theta$。同じように、隣辺の長さが $\\cos\\theta$ です。',
        add: [{ t: 'h', text: '斜辺を 1 にすると' },
          { t: 'm', tex: '\\text{対辺}=\\ans{\\sin\\theta},\\qquad \\text{隣辺}=\\hb{\\cos\\theta}' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.2, -0.26, 1.3, 0.8], w: 560, h: 396, items: tri(C35, S35, '1', 'sinθ', 'cosθ', { d: 0.07, rp: 54, size: 30 }) }] },
      { say: '$\\tan\\theta$ は対辺÷隣辺なので、$\\sin\\theta$ を $\\cos\\theta$ でわったものになります。これが1つめの関係です。',
        add: [{ t: 'box', c: 'p', label: '関係 1', tex: '\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}' }] },
      { say: '三平方の定理から、$(\\sin\\theta)^2+(\\cos\\theta)^2=1^2$。$(\\sin\\theta)^2$ は、かっこを省いて $\\sin^2\\theta$ と書きます。これが2つめの関係です。',
        add: [{ t: 'box', c: 'b', label: '関係 2', tex: '\\sin^2\\theta+\\cos^2\\theta=1' }] },
      { ask: { type: 'choice', q: '$\\sin^2\\theta$ が表しているものは？',
        opts: ['$\\sin(\\theta^2)$', '$(\\sin\\theta)^2$', '$\\sin2\\theta$', '$2\\sin\\theta$'], ok: 1,
        why: { 0: '$\\theta$ を2乗するのではありません。$\\sin\\theta$ の **値** を2乗します。', 2: '$\\sin2\\theta$ は角 $2\\theta$ の正弦で、別のものです。', 3: '2乗は、2倍ではありません。' },
        good: '$\\sin^2\\theta=(\\sin\\theta)^2$。$\\sin\\theta\\times\\sin\\theta$ のことです。' } },
      { say: '関係 2 の両辺を $\\cos^2\\theta$ でわると、$\\dfrac{\\sin^2\\theta}{\\cos^2\\theta}+1=\\dfrac{1}{\\cos^2\\theta}$。関係 1 から左の分数は $\\tan^2\\theta$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\sin^2\\theta}{\\cos^2\\theta}+\\frac{\\cos^2\\theta}{\\cos^2\\theta}=\\frac{1}{\\cos^2\\theta}', note: '両辺を $\\cos^2\\theta$ で\nわる' },
          { t: 'box', c: 'g', label: '関係 3', tex: '1+\\tan^2\\theta=\\frac{1}{\\cos^2\\theta}' }] },
      { ask: { type: 'choice', q: '確かめ：$\\theta=60^\\circ$ のとき、$1+\\tan^2\\theta$ の値は？',
        opts: ['$4$', '$1+\\sqrt3$', '$\\dfrac43$', '$2$'], ok: 0,
        why: { 1: '$\\tan60^\\circ=\\sqrt3$ を2乗していません。$(\\sqrt3)^2=3$。', 2: 'それは $\\tan30^\\circ=\\dfrac{1}{\\sqrt3}$ を使った値です。', 3: '$\\tan45^\\circ=1$ と取りちがえています。' },
        good: '$1+(\\sqrt3)^2=4$。$\\cos60^\\circ=\\dfrac12$ から $\\dfrac{1}{\\cos^2 60^\\circ}=4$ で、たしかに一致します。' } },

      // ---------- 例題1 ----------
      { clear: true, part: '例題1　cos から', say: '例題1。$\\theta$ は鋭角で、$\\cos\\theta=\\dfrac25$ のとき、$\\sin\\theta$ と $\\tan\\theta$ を求めます。cos から sin へは、関係 2 を使います。',
        add: [{ t: 'h', text: '例題1　$\\cos\\theta=\\dfrac25$（$\\theta$ は鋭角）' },
          { t: 'm', tex: '\\sin^2\\theta=1-\\cos^2\\theta=1-\\left(\\frac25\\right)^2=\\frac{21}{25}', note: '関係 2' }] },
      { ask: { type: 'choice', q: '$\\sin\\theta$ の値は？',
        opts: ['$\\pm\\dfrac{\\sqrt{21}}{5}$', '$\\dfrac{21}{25}$', '$\\dfrac{\\sqrt{21}}{5}$', '$\\dfrac35$'], ok: 2,
        why: { 0: '$\\theta$ は鋭角なので $\\sin\\theta>0$。負の方はとりません。', 1: 'それは $\\sin^2\\theta$。平方根をとって戻します。', 3: '$1-\\dfrac25$ と、cos を2乗しわすれています。' },
        good: '$\\sin\\theta>0$ なので $\\sin\\theta=\\sqrt{\\dfrac{21}{25}}=\\dfrac{\\sqrt{21}}{5}$。',
        add: [{ t: 'm', tex: '\\sin\\theta>0\\ \\text{より}\\ \\sin\\theta=\\ans{\\frac{\\sqrt{21}}{5}}' }] } },
      { say: '$\\tan\\theta$ は関係 1 で求めます。右のような直角三角形（斜辺 5、隣辺 2、対辺 $\\sqrt{21}$）をかいて、確かめることもできます。',
        add: [{ t: 'm', tex: '\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}=\\frac{\\sqrt{21}}{5}\\div\\frac25=\\ans{\\frac{\\sqrt{21}}{2}}', note: '関係 1' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.6, -1.1, 4.4, 5.5], w: 360, h: 396, items: tri(2, Math.sqrt(21), '5', '√21', '2', { d: 0.55, rp: 50, size: 30 }) }] },

      // ---------- 例題2 ----------
      { clear: true, part: '例題2　tan から', say: '例題2。$\\theta$ は鋭角で、$\\tan\\theta=3$ のとき、$\\cos\\theta$ と $\\sin\\theta$ を求めます。tan から cos へは、関係 3 を使います。',
        add: [{ t: 'h', text: '例題2　$\\tan\\theta=3$（$\\theta$ は鋭角）' },
          { t: 'm', tex: '1+3^2=\\frac{1}{\\cos^2\\theta}', note: '関係 3' },
          { t: 'm', style: 'margin-top:6px', tex: '\\cos^2\\theta=\\frac{1}{10}' }] },
      { ask: { type: 'choice', q: '$\\cos\\theta$ の値は？',
        opts: ['$\\dfrac{1}{10}$', '$\\sqrt{10}$', '$\\dfrac14$', '$\\dfrac{1}{\\sqrt{10}}$'], ok: 3,
        why: { 0: 'それは $\\cos^2\\theta$。平方根をとります。', 1: '分母と分子が逆です。鋭角の cos は 1 より小さい数です。', 2: '$1+3=4$ と、tan を2乗しわすれています。' },
        good: '$\\cos\\theta>0$ なので $\\cos\\theta=\\dfrac{1}{\\sqrt{10}}$（$=\\dfrac{\\sqrt{10}}{10}$）。',
        add: [{ t: 'm', tex: '\\cos\\theta>0\\ \\text{より}\\ \\cos\\theta=\\ans{\\frac{1}{\\sqrt{10}}}' }] } },
      { say: '$\\sin\\theta$ は、関係 1 を $\\sin\\theta=\\tan\\theta\\times\\cos\\theta$ と変形して求めます。図では、隣辺 1、対辺 3、斜辺 $\\sqrt{10}$ の三角形です。',
        add: [{ t: 'm', tex: '\\sin\\theta=\\tan\\theta\\cos\\theta=3\\times\\frac{1}{\\sqrt{10}}=\\ans{\\frac{3}{\\sqrt{10}}}', note: '$=\\dfrac{3\\sqrt{10}}{10}$' },
          { t: 'fig', id: 'f3', col: 1, view: [-1.1, -0.75, 2.5, 3.5], w: 340, h: 401, items: tri(1, 3, '√10', '3', '1', { d: 0.38, rp: 50, size: 30 }) }] },
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　$\\sin\\theta=\\frac14$（$\\theta$ は鋭角）' }],
        ask: { type: 'think', q: '$\\theta$ は鋭角で、$\\sin\\theta=\\dfrac14$ のとき、$\\cos\\theta$ と $\\tan\\theta$ を求めよう。',
        hint: '$\\cos^2\\theta=1-\\left(\\dfrac14\\right)^2$。鋭角なので $\\cos\\theta>0$。',
        ans: '$\\cos\\theta=\\dfrac{\\sqrt{15}}{4}$、$\\tan\\theta=\\dfrac{1}{\\sqrt{15}}$（$=\\dfrac{\\sqrt{15}}{15}$）',
        after: '$\\cos^2\\theta=\\dfrac{15}{16}$ から $\\cos\\theta=\\dfrac{\\sqrt{15}}{4}$。$\\tan\\theta=\\dfrac14\\div\\dfrac{\\sqrt{15}}{4}$。',
        add: [{ t: 'm', tex: '\\cos^2\\theta=1-\\left(\\frac14\\right)^2=\\frac{15}{16}', note: '関係 2' },
          { t: 'm', style: 'margin-top:6px', tex: '\\cos\\theta>0\\ \\text{より}\\ \\cos\\theta=\\ans{\\frac{\\sqrt{15}}{4}}' },
          { t: 'm', style: 'margin-top:6px', tex: '\\tan\\theta=\\frac14\\div\\frac{\\sqrt{15}}{4}=\\ans{\\frac{1}{\\sqrt{15}}}', note: '$=\\dfrac{\\sqrt{15}}{15}$' },
          { t: 'fig', id: 'f4', col: 1, view: [-1.2, -0.9, 5.4, 2.2], w: 560, h: 263, items: tri(Math.sqrt(15), 1, '4', '1', '√15', { d: 0.3, rp: 110, size: 30 }) }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角比を $0^\\circ$ から $180^\\circ$ までの角に広げます。鈍角では、cos や tan が負になることもあります。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
