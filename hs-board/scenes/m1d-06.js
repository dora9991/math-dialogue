/* 数学Ⅰ 第4章 図形と計量 三角比 ⑥：90°−θ・180°−θ の三角比
   例はすべて自作（cos70°、sin140°、157°＝180°−23°、cos116°、sin160°＋cos110°）。表の値（23°・26°）は小数第5位を四捨五入。
   値・誤答は python3（math・sympy）で検算ずみ。単位円の図は θ＝35°（P(0.819, 0.574)）で、Q は y 軸について対称な点。 */
(function () {
  const POINTS = [
    '$\\sin(90^\\circ-\\theta)=\\cos\\theta$、$\\cos(90^\\circ-\\theta)=\\sin\\theta$、$\\tan(90^\\circ-\\theta)=\\dfrac{1}{\\tan\\theta}$。もう1つの鋭角から見ると、対辺と隣辺が入れかわる',
    '$\\sin(180^\\circ-\\theta)=\\sin\\theta$、$\\cos(180^\\circ-\\theta)=-\\cos\\theta$、$\\tan(180^\\circ-\\theta)=-\\tan\\theta$。単位円で、2つの点は y 軸について対称（y 座標は同じ、x 座標は符号が逆）',
    '鈍角の三角比は、$180^\\circ-\\theta$ の式で鋭角に直して、三角比の表で求める。マイナスがつくのは cos と tan だけ'
  ];
  const PX = Math.cos(35 * Math.PI / 180), PY = Math.sin(35 * Math.PI / 180);
  const semi = (tx) => [{ k: 'axes', tx: tx || [[1, '1'], [-1, '−1']], ty: [] }, { k: 'arc', o: [0, 0], r: 1, a1: 0, a2: 180, c: 'w', wd: 3 }];

  HB.lesson({
    id: 'm1d-06', field: '数学Ⅰ　図形と計量', title: '90°−θ・180°−θ の三角比', level: '三角比', time: '目安 8分',
    problem: { label: '例題', lead: '三角比の表の値は　$\\sin23^\\circ=0.3907,\\ \\cos23^\\circ=0.9205,\\ \\tan23^\\circ=0.4245,\\ \\sin26^\\circ=0.4384$',
      parts: ['(1)　$\\cos70^\\circ$ を $45^\\circ$ 以下の角の三角比で表せ。', '(2)　$\\sin157^\\circ,\\ \\cos157^\\circ,\\ \\tan157^\\circ$ の値', '(3)　$\\cos116^\\circ$ を $45^\\circ$ 以下の角の三角比で表し、値を求めよ。', '(4)　$\\sin160^\\circ+\\cos110^\\circ$ の値'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、$0^\\circ$〜$180^\\circ$ の三角比を、半円の上の点の座標で決めました。この時間は、角を $90^\\circ-\\theta$、$180^\\circ-\\theta$ にしたときの関係を調べます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$90^\\circ-\\theta$、$180^\\circ-\\theta$ の三角比を、$\\theta$ の三角比で表せる\n鈍角の三角比を鋭角に直して、三角比の表で求められる' }] },

      // ---------- 90°−θ ----------
      { clear: true, part: '90°−θ', say: '直角三角形 ABC（$\\angle C=90^\\circ$）で $\\angle A=\\theta$ とすると、残りの角は $\\angle B=90^\\circ-\\theta$。まず A から見た三角比です。',
        add: [{ t: 'h', text: '$90^\\circ-\\theta$ の三角比' },
          { t: 'm', size: 'sm', tex: '\\sin\\theta=\\frac ac,\\quad \\cos\\theta=\\frac bc,\\quad \\tan\\theta=\\frac ab', note: 'A から見る' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.1, -1.1, 7.1, 4.1], w: 600, h: 380, items: [
            { k: 'poly', pts: [[0, 0], [5, 0], [5, 3]], close: true, fill: 'w', alpha: 0.05, noStroke: true },
            { k: 'seg', a: [0, 0], b: [5, 3], c: 'y', wd: 4 }, { k: 'seg', a: [5, 3], b: [5, 0], c: 'p', wd: 4 }, { k: 'seg', a: [5, 0], b: [0, 0], c: 'b', wd: 4 },
            { k: 'right', o: [5, 0], a: [0, 0], b: [5, 3], s: 20 },
            { k: 'angle', o: [0, 0], a: [5, 0], b: [5, 3], rp: 48, label: 'θ', size: 26 },
            { k: 'angle', o: [5, 3], a: [0, 0], b: [5, 0], rp: 40, label: '90°−θ', lr: 44, size: 22, c: 'g' },
            { k: 'label', at: [2.22, 1.97], text: 'c', c: 'y', size: 30 },
            { k: 'label', at: [5, 1.5], text: 'a', c: 'p', size: 30, anchor: 'start', dx: 16 },
            { k: 'label', at: [2.5, 0], text: 'b', c: 'b', size: 30, dy: 30 },
            { k: 'pt', at: [0, 0], name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: [5, 3], name: 'B', dir: 'ne', r: 4 }, { k: 'pt', at: [5, 0], name: 'C', dir: 'se', r: 4 }] }] },
      { say: 'B から見ると、対辺は b、隣辺は a に **入れかわります**。だから $\\sin(90^\\circ-\\theta)=\\dfrac bc=\\cos\\theta$。$\\sin60^\\circ=\\cos30^\\circ$ もこの例です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin(90^\\circ-\\theta)=\\frac bc,\\quad \\cos(90^\\circ-\\theta)=\\frac ac', note: 'B から見る' },
          { t: 'box', c: 'y', label: '90°−θ', tex: '\\sin(90^\\circ-\\theta)=\\cos\\theta,\\quad \\cos(90^\\circ-\\theta)=\\sin\\theta' }] },
      { ask: { type: 'choice', q: '$\\tan(90^\\circ-\\theta)$ は？',
        opts: ['$\\tan\\theta$', '$\\dfrac{1}{\\tan\\theta}$', '$-\\tan\\theta$', '$\\dfrac{1}{\\sin\\theta}$'], ok: 1,
        why: { 0: 'B から見ると対辺 b、隣辺 a。$\\dfrac ba$ は $\\dfrac ab$ の逆数です。', 2: '辺の長さの比なので、負にはなりません。', 3: '$\\tan(90^\\circ-\\theta)=\\dfrac ba$ に、斜辺 c は出てきません。' },
        good: 'B から見て対辺÷隣辺＝$\\dfrac ba$。$\\tan\\theta=\\dfrac ab$ の **逆数** です。',
        add: [{ t: 'box', c: 'y', label: '90°−θ', tex: '\\tan(90^\\circ-\\theta)=\\frac{1}{\\tan\\theta}' }] } },
      { ask: { type: 'choice', q: '$\\cos70^\\circ$ を、$45^\\circ$ 以下の角の三角比で表すと？',
        opts: ['$\\cos20^\\circ$', '$\\tan20^\\circ$', '$-\\sin20^\\circ$', '$\\sin20^\\circ$'], ok: 3,
        why: { 0: '$90^\\circ-\\theta$ にすると、cos は **sin に変わります**。', 1: 'cos は sin に変わります。tan にはなりません。', 2: '鋭角どうしなので、マイナスはつきません。' },
        good: '$\\cos70^\\circ=\\cos(90^\\circ-20^\\circ)=\\sin20^\\circ$。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos70^\\circ=\\cos(90^\\circ-20^\\circ)=\\ans{\\sin20^\\circ}' }] } },

      // ---------- 180°−θ ----------
      { clear: true, part: '180°−θ', say: '半径 1 の半円（**単位円**）で考えます。角 $\\theta$ の点を P$(x,\\ y)$ とすると、角 $180^\\circ-\\theta$ の点 Q は、P と **y 軸について対称** です。',
        add: [{ t: 'h', text: '$180^\\circ-\\theta$ の三角比（単位円）' },
          { t: 'p', size: 'sm', text: 'P の角が $\\theta$、Q の角が $180^\\circ-\\theta$\nQ は P と y 軸について対称　→　Q$(-x,\\ y)$' },
          { t: 'p', size: 'xs', text: '半径 1 なので　$\\sin\\theta=y,\\ \\cos\\theta=x$' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.5, -0.42, 1.5, 1.4], w: 660, h: 400, items: semi([]).concat([
            { k: 'seg', a: [-PX, PY], b: [PX, PY], dash: true, c: 'd' },
            { k: 'seg', a: [PX, PY], b: [PX, 0], dash: true, c: 'd' }, { k: 'seg', a: [-PX, PY], b: [-PX, 0], dash: true, c: 'd' },
            { k: 'seg', a: [0, 0], b: [PX, PY], c: 'y', wd: 4 }, { k: 'seg', a: [0, 0], b: [-PX, PY], c: 'g', wd: 4 },
            { k: 'angle', o: [0, 0], a: [1, 0], b: [PX, PY], rp: 44, label: 'θ', size: 24, c: 'y' },
            { k: 'angle', o: [0, 0], a: [-1, 0], b: [-PX, PY], rp: 44, label: 'θ', size: 24, c: 'y' },
            { k: 'angle', o: [0, 0], a: [1, 0], b: [-PX, PY], rp: 76, label: '180°−θ', lr: 30, size: 22, c: 'g' },
            { k: 'label', at: [PX, 0], text: 'x', c: 'b', size: 24, dy: 24 }, { k: 'label', at: [-PX, 0], text: '−x', c: 'b', size: 24, dy: 24 },
            { k: 'pt', at: [PX, PY], name: 'P(x, y)', dir: 'ne', r: 6, c: 'y' }, { k: 'pt', at: [-PX, PY], name: 'Q(−x, y)', dir: 'nw', r: 6, c: 'g' }]) }] },
      { say: 'Q の座標 $(-x,\\ y)$ を定義に入れます。y 座標は P と同じ、x 座標は符号だけが逆。だから **sin は同じ、cos と tan はマイナス** がつきます。',
        add: [{ t: 'box', c: 'g', label: '180°−θ', tex: '\\begin{aligned}\\sin(180^\\circ-\\theta)&=y=\\sin\\theta\\\\ \\cos(180^\\circ-\\theta)&=-x=-\\cos\\theta\\\\ \\tan(180^\\circ-\\theta)&=\\frac{y}{-x}=-\\tan\\theta\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\sin140^\\circ$ と等しいのは？',
        opts: ['$\\cos40^\\circ$', '$-\\sin40^\\circ$', '$\\sin40^\\circ$', '$-\\cos40^\\circ$'], ok: 2,
        why: { 0: '$\\cos40^\\circ$ は $\\sin50^\\circ$ と等しい値です（$90^\\circ-\\theta$）。', 1: 'sin は y 座標。P と Q で y 座標は同じなので、マイナスはつきません。', 3: 'マイナスがつくのは、cos と tan です。' },
        good: '$\\sin140^\\circ=\\sin(180^\\circ-40^\\circ)=\\sin40^\\circ$。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin140^\\circ=\\sin(180^\\circ-40^\\circ)=\\ans{\\sin40^\\circ}' }] } },

      // ---------- 表を使う ----------
      { clear: true, part: '表で求める', say: 'この式を使うと、鈍角の三角比も、**鋭角の三角比の表** で求められます。たとえば $157^\\circ=180^\\circ-23^\\circ$ なので、$23^\\circ$ の行を使います。',
        add: [{ t: 'h', text: '$157^\\circ$ の三角比を表で求める' },
          { t: 'm', tex: '\\sin157^\\circ=\\sin(180^\\circ-23^\\circ)=\\sin23^\\circ=\\ans{0.3907}' },
          { t: 'tbl', col: 1, cls: 'rowh', rows: [['$\\theta$', '$\\sin\\theta$', '$\\cos\\theta$', '$\\tan\\theta$'], ['$23^\\circ$', '0.3907', '0.9205', '0.4245']] },
          { t: 'fig', id: 'f3', col: 1, view: [-1.45, -0.4, 1.45, 1.3], w: 580, h: 340, items: semi().concat([
            { k: 'seg', a: [0, 0], b: [Math.cos(0.4014), Math.sin(0.4014)], c: 'y', wd: 3 },
            { k: 'seg', a: [0, 0], b: [-Math.cos(0.4014), Math.sin(0.4014)], c: 'g', wd: 4 },
            { k: 'angle', o: [0, 0], a: [1, 0], b: [Math.cos(0.4014), Math.sin(0.4014)], rp: 62, label: '23°', lr: 26, size: 22, c: 'y' },
            { k: 'angle', o: [0, 0], a: [1, 0], b: [-Math.cos(0.4014), Math.sin(0.4014)], rp: 36, label: '157°', lr: 22, size: 22, c: 'g' },
            { k: 'angle', o: [0, 0], a: [-1, 0], b: [-Math.cos(0.4014), Math.sin(0.4014)], rp: 62, label: '23°', lr: 26, size: 22, c: 'y' }]) }] },
      { ask: { type: 'choice', q: '$\\cos157^\\circ$ の値は？',
        opts: ['$-0.9205$', '$0.9205$', '$-0.3907$', '$0.3907$'], ok: 0,
        why: { 1: '$\\cos(180^\\circ-\\theta)=-\\cos\\theta$。鈍角の cos は負です。', 2: 'それは $-\\sin23^\\circ$。cos の列を使います。', 3: 'それは $\\sin157^\\circ$ の値です。' },
        good: '$\\cos157^\\circ=-\\cos23^\\circ=-0.9205$。鈍角なので負になります。',
        add: [{ t: 'm', tex: '\\cos157^\\circ=-\\cos23^\\circ=\\ans{-0.9205}' }] } },
      { say: '$\\tan157^\\circ$ も、マイナスをつけて $-\\tan23^\\circ$。表の値をそのまま使い、符号だけを図で確かめます。',
        add: [{ t: 'm', tex: '\\tan157^\\circ=-\\tan23^\\circ=\\ans{-0.4245}' }] },

      // ---------- 組み合わせる ----------
      { clear: true, part: '組み合わせる', add: [{ t: 'h', text: '2つの式を組み合わせる' },
          { t: 'p', size: 'sm', text: '$180^\\circ-\\theta$ で鋭角に → $90^\\circ-\\theta$ で $45^\\circ$ 以下に' }],
        ask: { type: 'think', q: '$\\cos116^\\circ$ を $45^\\circ$ 以下の角の三角比で表し、値を求めよう。（$\\sin26^\\circ=0.4384$）',
          hint: '$116^\\circ=180^\\circ-64^\\circ$、$64^\\circ=90^\\circ-26^\\circ$。',
          ans: '$\\cos116^\\circ=-\\cos64^\\circ=-\\sin26^\\circ=-0.4384$',
          after: 'まず鈍角を鋭角に（マイナスがつく）、次に $90^\\circ-\\theta$ で sin と cos を入れかえます。',
          add: [{ t: 'm', tex: '\\begin{aligned}\\cos116^\\circ&=\\cos(180^\\circ-64^\\circ)=-\\cos64^\\circ\\\\ &=-\\cos(90^\\circ-26^\\circ)=-\\sin26^\\circ\\\\ &=\\ans{-0.4384}\\end{aligned}' }] } },
      { ask: { type: 'choice', q: '$\\sin160^\\circ+\\cos110^\\circ$ の値は？',
        opts: ['$2\\sin20^\\circ$', '$\\sin20^\\circ-\\cos20^\\circ$', '$-2\\sin20^\\circ$', '$0$'], ok: 3,
        why: { 0: '$\\cos110^\\circ=-\\cos70^\\circ$。鈍角の cos にはマイナスがつきます。', 1: '$\\cos70^\\circ$ は $\\cos20^\\circ$ ではなく、$\\sin20^\\circ$ です。', 2: '$\\sin160^\\circ=\\sin20^\\circ$（sin にはマイナスはつかない）。' },
        good: '$\\sin160^\\circ=\\sin20^\\circ$、$\\cos110^\\circ=-\\cos70^\\circ=-\\sin20^\\circ$ なので、和は 0。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin160^\\circ+\\cos110^\\circ=\\sin20^\\circ-\\sin20^\\circ=\\ans{0}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、単位円を使って、$\\sin\\theta=\\dfrac12$ のような三角比を含む方程式・不等式を解きます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
