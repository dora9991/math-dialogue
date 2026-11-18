/* 数学Ⅰ 第4章 図形と計量 三角比 ②：30°・45°・60° の三角比と三角比の表
   例はすべて自作（三角比の表は 22°〜27° の自作の抜粋、例題 AB=10・∠A=24°、考えてみよう CA=8・∠A=26°、tanA=0.45）。
   表の値（小数第5位を四捨五入）・答え・誤答は python3（math・sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '直角二等辺三角形（$1:1:\\sqrt2$）から $45^\\circ$、正三角形の半分（$1:\\sqrt3:2$）から $30^\\circ$・$60^\\circ$ の三角比が出る。迷ったら図をかく',
    '$\\sin30^\\circ=\\cos60^\\circ=\\dfrac12$、$\\cos30^\\circ=\\sin60^\\circ=\\dfrac{\\sqrt3}{2}$。30° と 60° では、sin と cos の値が入れかわる',
    'ほかの角は **三角比の表**（小数第4位までの近似値）を使う。辺＝斜辺×sin のように **かけ算** で求め、比の値から角も読みとれる'
  ];
  // 直角二等辺三角形（45°）：A(0,0)・C(s,0)・B(s,s)
  const tri45 = (s, dx, o) => {
    o = o || {}; const A = [dx, 0], C = [dx + s, 0], B = [dx + s, s], z = o.size || 26;
    return [
      { k: 'poly', pts: [A, C, B], close: true, fill: 'w', alpha: 0.05 },
      { k: 'right', o: C, a: A, b: B, s: 18 },
      { k: 'angle', o: A, a: C, b: B, rp: o.rp || 40, label: '45°', lr: 30, size: 22, c: 'y' },
      { k: 'label', at: [dx + s / 2, s / 2], text: '√2', c: 'y', size: z, dx: -26, dy: -22 },
      { k: 'label', at: [dx + s, s / 2], text: '1', c: 'p', size: z, anchor: 'start', dx: 14 },
      { k: 'label', at: [dx + s / 2, 0], text: '1', c: 'b', size: z, dy: 28 }];
  };
  // 正三角形の半分（30°・60°）：A(0,0)・C(s,0)・B(s,√3 s)。A が 60°、B が 30°
  const tri3060 = (s, dx, o) => {
    o = o || {}; const h = Math.sqrt(3) * s, A = [dx, 0], C = [dx + s, 0], B = [dx + s, h], z = o.size || 26;
    return [
      { k: 'poly', pts: [A, C, B], close: true, fill: 'w', alpha: 0.05 },
      { k: 'right', o: C, a: A, b: B, s: 18 },
      { k: 'angle', o: A, a: C, b: B, rp: o.rp || 34, label: '60°', lr: 28, size: 22, c: 'y' },
      { k: 'angle', o: B, a: A, b: C, rp: (o.rp || 34) + 16, label: '30°', lr: 24, size: 22, c: 'g' },
      { k: 'label', at: [dx + s / 2, h / 2], text: '2', c: 'w', size: z, dx: -22, dy: -12 },
      { k: 'label', at: [dx + s, h / 2], text: '√3', c: 'w', size: z, anchor: 'start', dx: 14 },
      { k: 'label', at: [dx + s / 2, 0], text: '1', c: 'w', size: z, dy: 28 }];
  };
  const TBL = [['$\\theta$', '$\\sin\\theta$', '$\\cos\\theta$', '$\\tan\\theta$'],
    ['$22^\\circ$', '0.3746', '0.9272', '0.4040'], ['$23^\\circ$', '0.3907', '0.9205', '0.4245'], ['$24^\\circ$', '0.4067', '0.9135', '0.4452'],
    ['$25^\\circ$', '0.4226', '0.9063', '0.4663'], ['$26^\\circ$', '0.4384', '0.8988', '0.4877'], ['$27^\\circ$', '0.4540', '0.8910', '0.5095']];

  HB.lesson({
    id: 'm1d-02', field: '数学Ⅰ　図形と計量', title: '30°・45°・60° の三角比と三角比の表', level: '三角比', time: '目安 8分',
    problem: { label: '例題', lead: '(3)〜(5) は、三角比の表を使う。',
      parts: ['(1)　$\\sin45^\\circ,\\ \\cos45^\\circ,\\ \\tan45^\\circ$ の値', '(2)　$30^\\circ,\\ 60^\\circ$ の $\\sin,\\ \\cos,\\ \\tan$ の値', '(3)　$\\tan A=0.45$ となる鋭角 A は、およそ何度か（三角比の表から）', '(4)　$\\angle C=90^\\circ,\\ AB=10,\\ \\angle A=24^\\circ$ の直角三角形で、BC の長さ（小数第1位まで）', '(5)　$\\angle C=90^\\circ,\\ CA=8,\\ \\angle A=26^\\circ$ の直角三角形で、BC の長さ（小数第1位まで）'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、三角比の定義を学びました。この時間は、よく使う $30^\\circ,\\ 45^\\circ,\\ 60^\\circ$ の値を図から出し、ほかの角は **三角比の表** で求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$30^\\circ,\\ 45^\\circ,\\ 60^\\circ$ の三角比を、図から求められる\n三角比の表を使って、辺の長さや角の大きさを求められる' }] },

      // ---------- 45° ----------
      { clear: true, part: '45°', say: '中学で学んだ **直角二等辺三角形** は、辺の比が $1:1:\\sqrt2$ でした。$45^\\circ$ の角から見ると、斜辺 $\\sqrt2$、対辺 1、隣辺 1 です。',
        add: [{ t: 'h', text: '$45^\\circ$ の三角比' },
          { t: 'p', size: 'sm', text: '直角二等辺三角形　辺の比 $1:1:\\sqrt2$' },
          { t: 'fig', id: 'f45', col: 1, view: [-0.75, -0.75, 2.75, 2.45], w: 440, h: 402, items: tri45(2, 0, { rp: 48, size: 30 }) }] },
      { say: '定義どおりに、対辺÷斜辺、隣辺÷斜辺、対辺÷隣辺。$\\dfrac{1}{\\sqrt2}$ は、分母を有理化して $\\dfrac{\\sqrt2}{2}$ と書いてもかまいません。',
        add: [{ t: 'm', tex: '\\sin45^\\circ=\\frac{1}{\\sqrt2}', note: '$=\\dfrac{\\sqrt2}{2}$' },
          { t: 'm', style: 'margin-top:6px', tex: '\\cos45^\\circ=\\frac{1}{\\sqrt2}', note: '$=\\dfrac{\\sqrt2}{2}$' },
          { t: 'm', style: 'margin-top:6px', tex: '\\tan45^\\circ=\\frac11=1' }] },

      // ---------- 30°・60° ----------
      { clear: true, part: '30°・60°', say: '1辺 2 の **正三角形を半分** に切ると、角が $30^\\circ,\\ 60^\\circ,\\ 90^\\circ$ の直角三角形。高さは三平方の定理で $\\sqrt{2^2-1^2}=\\sqrt3$ です。',
        add: [{ t: 'h', text: '$30^\\circ$・$60^\\circ$ の三角比' },
          { t: 'p', size: 'sm', text: '正三角形の半分　辺の比 $1:\\sqrt3:2$\n$A=60^\\circ$、$B=30^\\circ$' },
          { t: 'fig', id: 'f36', col: 1, view: [-0.55, -0.55, 2.55, 2.1], w: 460, h: 393, items: [
            { k: 'poly', pts: [[1, 0], [2, 0], [1, Math.sqrt(3)]], close: false, dash: true, c: 'd' }].concat(tri3060(1, 0, { rp: 40, size: 30 }),
            [{ k: 'pt', at: [0, 0], name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: [1, Math.sqrt(3)], name: 'B', dir: 'n', r: 4 }, { k: 'pt', at: [1, 0], name: 'C', dir: 's', off: 34, r: 4 }]) }] },
      { ask: { type: 'choice', q: '$60^\\circ$ の角 A から見て、$\\sin60^\\circ$ の値は？',
        opts: ['$\\dfrac12$', '$\\sqrt3$', '$\\dfrac{\\sqrt3}{2}$', '$\\dfrac{2}{\\sqrt3}$'], ok: 2,
        why: { 0: 'それは隣辺÷斜辺で $\\cos60^\\circ$。sin は対辺 $\\sqrt3$ を使います。', 1: 'それは対辺÷隣辺で $\\tan60^\\circ$。sin の分母は斜辺 2。', 3: '分母と分子が逆。斜辺 2 が分母です。' },
        good: 'A から見て対辺 $\\sqrt3$、斜辺 2 なので $\\sin60^\\circ=\\dfrac{\\sqrt3}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin60^\\circ=\\frac{\\sqrt3}{2},\\quad \\cos60^\\circ=\\frac12,\\quad \\tan60^\\circ=\\sqrt3' }] } },
      { ask: { type: 'choice', q: '今度は $30^\\circ$ の角 B から見ます。$\\tan30^\\circ$ の値は？',
        opts: ['$\\sqrt3$', '$\\dfrac{\\sqrt3}{2}$', '$\\dfrac12$', '$\\dfrac{1}{\\sqrt3}$'], ok: 3,
        why: { 0: 'それは $\\tan60^\\circ$。B から見ると、対辺は $AC=1$、隣辺は $BC=\\sqrt3$ です。', 1: 'それは隣辺÷斜辺で $\\cos30^\\circ$。', 2: 'それは対辺÷斜辺で $\\sin30^\\circ$。tan は対辺÷隣辺。' },
        good: 'B から見て対辺 1、隣辺 $\\sqrt3$ なので $\\tan30^\\circ=\\dfrac{1}{\\sqrt3}$（$=\\dfrac{\\sqrt3}{3}$）。',
        add: [{ t: 'm', size: 'sm', style: 'margin-top:6px', tex: '\\sin30^\\circ=\\frac12,\\quad \\cos30^\\circ=\\frac{\\sqrt3}{2},\\quad \\tan30^\\circ=\\frac{1}{\\sqrt3}' },
          { t: 'p', size: 'xs', text: 'B から見ると、対辺と隣辺が入れかわる' }] } },

      // ---------- 表にまとめる ----------
      { clear: true, part: '表にまとめる', say: '表にまとめます。角が大きくなると、$\\sin$ は増え、$\\cos$ は減ります。$30^\\circ$ と $60^\\circ$ では、sin と cos の値が入れかわっています。',
        add: [{ t: 'h', text: '$30^\\circ,\\ 45^\\circ,\\ 60^\\circ$ の三角比' },
          { t: 'tbl', rows: [['$\\theta$', '$30^\\circ$', '$45^\\circ$', '$60^\\circ$'],
            ['$\\sin\\theta$', '$\\dfrac12$', '$\\dfrac{1}{\\sqrt2}$', '$\\dfrac{\\sqrt3}{2}$'],
            ['$\\cos\\theta$', '$\\dfrac{\\sqrt3}{2}$', '$\\dfrac{1}{\\sqrt2}$', '$\\dfrac12$'],
            ['$\\tan\\theta$', '$\\dfrac{1}{\\sqrt3}$', '$1$', '$\\sqrt3$']] },
          { t: 'fig', id: 'fj', col: 1, view: [-0.45, -0.75, 4.55, 2.6], w: 600, h: 402, items: tri45(1.6, 0, { rp: 40 }).concat(tri3060(1.2, 2.55, { rp: 32 })) },
          { t: 'p', col: 1, size: 'xs', text: '2つの三角定規の形を、図でかけるようにしておく' }] },
      { ask: { type: 'choice', q: '$\\cos30^\\circ$ と **同じ値** になるのは？',
        opts: ['$\\sin60^\\circ$', '$\\cos60^\\circ$', '$\\sin30^\\circ$', '$\\tan60^\\circ$'], ok: 0,
        why: { 1: '$\\cos60^\\circ=\\dfrac12$。cos は角が大きくなると減るので、30° と 60° でちがう値です。', 2: '$\\sin30^\\circ=\\dfrac12$、$\\cos30^\\circ=\\dfrac{\\sqrt3}{2}$ で、ちがいます。', 3: '$\\tan60^\\circ=\\sqrt3$ は 1 より大きい数です。' },
        good: 'どちらも $\\dfrac{\\sqrt3}{2}$。30° の隣辺は、60° から見ると対辺です（同じ三角形の2つの角）。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos30^\\circ=\\sin60^\\circ=\\frac{\\sqrt3}{2}', note: 'くわしくは\n「90°−θ」の時間に' }] } },

      // ---------- 三角比の表 ----------
      { clear: true, part: '三角比の表', say: 'それ以外の角は、**三角比の表** を使います。表の値は、ほとんどが小数第5位を四捨五入した **近似値** です。右は、その一部（$22^\\circ$〜$27^\\circ$）です。',
        add: [{ t: 'h', text: '三角比の表の読み方' },
          { t: 'p', size: 'sm', text: '角 $\\theta$ の行と、$\\sin$・$\\cos$・$\\tan$ の列が交わる所を読む\n例：$\\sin24^\\circ=0.4067$、$\\cos24^\\circ=0.9135$' },
          { t: 'p', size: 'xs', text: '$=$ と書くが、正しくは近似値（小数第4位まで）' },
          { t: 'tbl', col: 1, cls: 'rowh', rows: TBL }] },
      { say: '逆に、比の値から角を読むこともできます。$\\tan A=0.45$ なら、表の **$\\tan$ の列** で、0.45 にいちばん近い値をさがします。',
        add: [{ t: 'm', tex: '\\tan A=0.45\\ \\ \\text{となる鋭角 }A\\text{ は？}' }] },
      { ask: { type: 'choice', q: '$\\tan A=0.45$ のとき、A はおよそ何度？',
        opts: ['$27^\\circ$', '$24^\\circ$', '$25^\\circ$', '表にないので求められない'], ok: 1,
        why: { 0: 'それは sin の列（$\\sin27^\\circ=0.4540$）を見ています。tan の列です。', 2: '$\\tan25^\\circ=0.4663$ は、$\\tan24^\\circ=0.4452$ より 0.45 から遠い値です。', 3: 'ぴったりの値がなくても、いちばん近い値の角を「およそ」の答えにします。' },
        good: '$\\tan24^\\circ=0.4452$ が 0.45 にいちばん近いので、$A\\fallingdotseq24^\\circ$。',
        add: [{ t: 'm', tex: '\\tan24^\\circ=0.4452\\ \\ \\text{が最も近い}\\ \\ \\Rightarrow\\ \\ A\\fallingdotseq\\ans{24^\\circ}' }] } },

      // ---------- 表を使って辺を求める ----------
      { clear: true, part: '例題', say: '例題です。$\\angle C=90^\\circ$、$AB=10$、$\\angle A=24^\\circ$ の直角三角形で、BC を求めます。BC は A の **対辺**、AB は **斜辺** なので、$\\sin$ を使います。',
        add: [{ t: 'h', text: '例題　BC を小数第1位まで求める' },
          { t: 'm', tex: '\\sin24^\\circ=\\frac{BC}{AB}=\\frac{BC}{10}', note: '対辺 ÷ 斜辺' },
          { t: 'm', tex: 'BC=10\\sin24^\\circ', note: '両辺に 10 をかける' },
          { t: 'fig', id: 'fe', col: 1, view: [-1.3, -1.7, 11.2, 5.6], w: 600, h: 350, items: [
            { k: 'poly', pts: [[0, 0], [9.135, 0], [9.135, 4.067]], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: [9.135, 0], b: [9.135, 4.067], c: 'p', wd: 5 },
            { k: 'right', o: [9.135, 0], a: [0, 0], b: [9.135, 4.067], s: 20 },
            { k: 'angle', o: [0, 0], a: [9.135, 0], b: [9.135, 4.067], rp: 70, label: '24°', lr: 34, size: 24, c: 'y' },
            { k: 'label', at: [4.57, 2.03], text: '10', c: 'y', size: 28, dx: -18, dy: -26 },
            { k: 'label', at: [9.135, 2.03], text: '?', c: 'p', size: 30, anchor: 'start', dx: 16 },
            { k: 'pt', at: [0, 0], name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: [9.135, 4.067], name: 'B', dir: 'ne', r: 4 }, { k: 'pt', at: [9.135, 0], name: 'C', dir: 'se', r: 4 }] },
          { t: 'tbl', col: 1, cls: 'rowh', size: 'sm', rows: [TBL[0], TBL[3]] }] },
      { ask: { type: 'choice', q: 'BC を小数第1位まで求めると？（表の値を使う）',
        opts: ['$9.1$', '$4.5$', '$4.1$', '$24.6$'], ok: 2,
        why: { 0: '$10\\cos24^\\circ=9.135$。cos は隣辺 CA を求めるときに使います。', 1: '$10\\tan24^\\circ=4.452$。tan は対辺÷隣辺なので、ここでは使えません。', 3: '$10\\div\\sin24^\\circ$ と、わってしまっています。BC は 10 に sin を **かける**。' },
        good: '$BC=10\\times0.4067=4.067$ なので、小数第1位まで（第2位を四捨五入）で 4.1。',
        add: [{ t: 'm', tex: '=10\\times0.4067=4.067\\ \\ \\Rightarrow\\ \\ BC\\fallingdotseq\\ans{4.1}' }] } },
      { ask: { type: 'think', q: '$\\angle C=90^\\circ$、$CA=8$、$\\angle A=26^\\circ$ の直角三角形で、BC を小数第1位まで求めよう。',
        hint: 'A から見て、BC は対辺、CA は隣辺。対辺と隣辺の比は tan。$\\tan26^\\circ=0.4877$',
        ans: '$BC=8\\tan26^\\circ=8\\times0.4877=3.9016$ より、$BC\\fallingdotseq3.9$',
        after: 'わかっている辺と求めたい辺が、A から見て何かを決めれば、使う三角比が決まります。',
        add: [{ t: 'm', size: 'sm', tex: 'BC=8\\tan26^\\circ=8\\times0.4877\\fallingdotseq\\ans{3.9}', note: '対辺＝隣辺×tan' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角比を使って、木の高さや川はばなど、直接はかれない長さを求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
