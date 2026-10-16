/* 数学Ⅱ 第3章 三角関数 ②：弧度法
   1ラジアンの意味、度とラジアンの換算、扇形の弧の長さ rθ と面積 ½r²θ。例はすべて自作。
   換算（135°・210°・5π/12・1ラジアン≒57.3°）と扇形（r=6・θ=5π/6／r=4・θ=3π/4／r=3・60°／r=5・l=4）は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '半径 $r$ の円で、長さ $r$ の弧に対する中心角を **1ラジアン**（1弧度）という。半円の弧は $\\pi r$ なので　$180^\\circ=\\pi$ ラジアン（単位はふつう省略）',
    '換算は　$1^\\circ=\\dfrac{\\pi}{180}$、1ラジアン $=\\left(\\dfrac{180}{\\pi}\\right)^\\circ\\fallingdotseq57.3^\\circ$。$30^\\circ=\\dfrac{\\pi}{6}$、$45^\\circ=\\dfrac{\\pi}{4}$、$60^\\circ=\\dfrac{\\pi}{3}$、$90^\\circ=\\dfrac{\\pi}{2}$ はすぐ言えるように',
    '半径 $r$、中心角 $\\theta$（ラジアン）の扇形は　弧の長さ $l=r\\theta$、面積 $S=\\dfrac12r^2\\theta=\\dfrac12lr$。度のままの角を $\\theta$ に入れない'
  ];
  const D = Math.PI / 180, at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const ONE = 180 / Math.PI;   // 1ラジアン（度）
  // 扇形のぬり（中心 O、半径 r、角 a1→a2 度）
  const sector = (a1, a2, r, c) => { const pts = [[0, 0]]; for (let i = 0; i <= 40; i++) pts.push(at(a1 + (a2 - a1) * i / 40, r)); return { k: 'poly', pts, close: true, fill: c, alpha: 0.22, noStroke: true }; };

  HB.lesson({
    id: 'm2c-02', field: '数学Ⅱ　三角関数', title: '弧度法', level: '三角関数', time: '目安 7分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$135^\\circ$、$210^\\circ$ を弧度法で表せ', '(2)　$\\dfrac{5}{12}\\pi$ を度で表せ', '(3)　半径 6、中心角 $\\dfrac56\\pi$ の扇形の弧の長さと面積', '(4)　半径 4、中心角 $\\dfrac34\\pi$ の扇形の面積', '(5)　半径 5、弧の長さ 4 の扇形の中心角と面積'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、角を回転の量として一般角に広げました。この時間は、円の **半径と弧の長さ** を使った新しい角の表し方、**弧度法** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '1ラジアンの意味がわかり、度とラジアンを換算できる\n扇形の弧の長さと面積を、弧度法で求められる' }] },

      // ---------- 1ラジアン ----------
      { clear: true, part: '1ラジアン', say: '半径 r の円で、**半径と同じ長さの弧** に対する中心角を考えます。この角の大きさを **1ラジアン**（1弧度）といいます。円の大きさによらず、同じ角になります。',
        add: [{ t: 'h', text: '1ラジアン（1弧度）' },
          { t: 'p', size: 'sm', text: '半径 $r$ の円で、**長さ $r$ の弧** に対する\n中心角を **1ラジアン** という' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.45, -1.3, 1.45, 1.35], w: 560, h: 512, items: [
            { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 }, sector(0, ONE, 1, 'y'),
            { k: 'seg', a: [0, 0], b: [1, 0], c: 'b', wd: 4 }, { k: 'seg', a: [0, 0], b: at(ONE, 1), c: 'b', wd: 4 },
            { k: 'label', at: [0.5, 0], text: 'r', c: 'b', size: 26, dy: 22 }, { k: 'label', at: at(ONE, 0.5), text: 'r', c: 'b', size: 26, dx: -18, dy: -6 },
            { k: 'arc', o: [0, 0], r: 1, a1: 0, a2: ONE, c: 'y', wd: 7 }, { k: 'label', at: at(ONE / 2, 1.14), text: 'r', c: 'y', size: 28 },
            { k: 'arc', o: [0, 0], r: 0.2, a1: 0, a2: ONE, c: 'g', wd: 3 }, { k: 'label', at: at(ONE / 2, 0.58), text: '1ラジアン', c: 'g', size: 21 },
            { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', r: 5 }] }] },
      { say: '弧の長さは中心角に比例します。半円の弧の長さは $\\pi r$、つまり半径の $\\pi$ 倍。だから、半円の中心角 $180^\\circ$ は $\\pi$ ラジアンです。',
        add: [{ t: 'm', tex: '180^\\circ=\\pi\\ \\text{ラジアン}', note: '半円の弧 ＝ $\\pi r$\n（半径の $\\pi$ 倍）' }],
        draw: [{ fig: 'f1', items: [{ k: 'arc', o: [0, 0], r: 1.08, a1: 0, a2: 180, c: 'p', wd: 3, dash: true }, { k: 'label', at: at(122, 1.2), text: 'πr', c: 'p', size: 28 },
          { k: 'seg', a: [0, 0], b: [-1, 0], c: 'p', wd: 3 }] }] },
      { say: 'ここから、$1^\\circ=\\dfrac{\\pi}{180}$ ラジアン、1ラジアン $=\\left(\\dfrac{180}{\\pi}\\right)^\\circ$ で、約 $57.3^\\circ$ です。弧度法では、単位の「ラジアン」はふつう省略します。',
        add: [{ t: 'box', c: 'y', label: '換算', text: '$1^\\circ=\\dfrac{\\pi}{180}$　　1ラジアン $=\\left(\\dfrac{180}{\\pi}\\right)^\\circ\\fallingdotseq57.3^\\circ$\n単位のラジアンは、ふつう省略する' }] },

      // ---------- 度とラジアン ----------
      { clear: true, cols: [1], part: '度とラジアン', say: 'よく使う角を弧度法で表しておきます。たとえば $135^\\circ$ は、$135\\times\\dfrac{\\pi}{180}=\\dfrac34\\pi$。$\\dfrac{\\pi}{4}$ の3つ分と見ることもできます。',
        add: [{ t: 'h', text: '度 → ラジアン　（$\\dfrac{\\pi}{180}$ をかける）' },
          { t: 'm', tex: '135^\\circ=135\\times\\frac{\\pi}{180}=\\frac34\\pi' },
          { t: 'tbl', rows: [['度', '$0^\\circ$', '$30^\\circ$', '$45^\\circ$', '$60^\\circ$', '$90^\\circ$', '$120^\\circ$', '$135^\\circ$', '$180^\\circ$', '$270^\\circ$', '$360^\\circ$'],
            ['ラジアン', '$0$', '$\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{2}$', '$\\dfrac23\\pi$', '$\\dfrac34\\pi$', '$\\pi$', '$\\dfrac32\\pi$', '$2\\pi$']] }] },
      { ask: { type: 'choice', q: '$210^\\circ$ を弧度法で表すと？',
        opts: ['$\\dfrac67\\pi$', '$\\dfrac76\\pi$', '$\\dfrac73\\pi$', '$210\\pi$'], ok: 1,
        why: { 0: '$\\dfrac{180}{210}$ と、分母と分子を逆にしています。$210\\times\\dfrac{\\pi}{180}$ です。', 2: '$180$ ではなく $90$ で割っています。$\\pi$ は $180^\\circ$ です。', 3: '$\\pi$ をかけただけで、$180$ で割っていません。' },
        good: '$210\\times\\dfrac{\\pi}{180}=\\dfrac76\\pi$。$180^\\circ+30^\\circ$ と見て $\\pi+\\dfrac{\\pi}{6}$ としても同じです。',
        add: [{ t: 'm', tex: '210^\\circ=210\\times\\frac{\\pi}{180}=\\ans{\\frac76\\pi}' }] } },
      { ask: { type: 'choice', q: '$\\dfrac{5}{12}\\pi$ を度で表すと？',
        opts: ['$150^\\circ$', '$15^\\circ$', '$75^\\circ$', '約 $1.3^\\circ$'], ok: 2,
        why: { 0: '$\\pi$ を $360^\\circ$ にしています。$\\pi$ は $180^\\circ$ です。', 1: '$\\dfrac{\\pi}{12}=15^\\circ$。その5倍です。', 3: '$\\dfrac{5}{12}\\pi\\fallingdotseq1.31$ はラジアンの値。度に直すには、$\\pi$ に $180^\\circ$ を入れます。' },
        good: '$\\pi$ を $180^\\circ$ におきかえて、$\\dfrac{5}{12}\\times180^\\circ=75^\\circ$。',
        add: [{ t: 'm', tex: '\\frac{5}{12}\\pi=\\frac{5}{12}\\times180^\\circ=\\ans{75^\\circ}', note: 'ラジアン → 度は\n$\\pi$ に $180^\\circ$ を入れる' }] } },

      // ---------- 扇形 ----------
      { clear: true, part: '扇形', say: '半径 r、中心角 $\\theta$ の扇形を考えます。弧の長さも面積も中心角に比例し、中心角が $2\\pi$ のときが円全体です。',
        add: [{ t: 'h', text: '扇形の弧の長さと面積' },
          { t: 'm', tex: 'l=2\\pi r\\times\\frac{\\theta}{2\\pi}=r\\theta', note: '円周 $2\\pi r$ の\n$\\dfrac{\\theta}{2\\pi}$ 倍' },
          { t: 'm', tex: 'S=\\pi r^2\\times\\frac{\\theta}{2\\pi}=\\frac12r^2\\theta', note: '円の面積 $\\pi r^2$ の\n$\\dfrac{\\theta}{2\\pi}$ 倍' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.35, -0.55, 1.35, 1.45], w: 560, h: 415, items: [
            sector(20, 130, 1.1, 'y'),
            { k: 'seg', a: [0, 0], b: at(20, 1.1), c: 'w', wd: 3.5 }, { k: 'seg', a: [0, 0], b: at(130, 1.1), c: 'w', wd: 3.5 },
            { k: 'arc', o: [0, 0], r: 1.1, a1: 20, a2: 130, c: 'p', wd: 6 },
            { k: 'arc', o: [0, 0], r: 0.24, a1: 20, a2: 130, c: 'g', wd: 3 }, { k: 'label', at: at(75, 0.37), text: 'θ', c: 'g', size: 26 },
            { k: 'label', at: at(20, 0.6), text: 'r', size: 26, dx: 6, dy: 18 }, { k: 'label', at: at(130, 0.6), text: 'r', size: 26, dx: -16, dy: -6 },
            { k: 'label', at: at(75, 1.24), text: 'l', c: 'p', size: 30 }, { k: 'label', at: at(75, 0.75), text: 'S', c: 'y', size: 30 },
            { k: 'pt', at: [0, 0], name: 'O', dir: 's', r: 5 }] }] },
      { say: '度のときの $\\dfrac{a}{360}$ のような分数がいらなくなり、式がとても簡単です。面積は $l=r\\theta$ を使って、$\\dfrac12lr$ とも書けます。',
        add: [{ t: 'box', c: 'y', label: '扇形（θ はラジアン）', text: '弧の長さ　$l=r\\theta$\n面積　$S=\\dfrac12r^2\\theta=\\dfrac12lr$' }] },
      { clear: true, part: '扇形の計算', say: '半径 6、中心角 $\\dfrac56\\pi$ の扇形です。公式に入れるだけで、弧の長さは $5\\pi$、面積は $15\\pi$。$\\dfrac12lr$ で確かめても $15\\pi$ です。',
        add: [{ t: 'h', text: '例　半径 6、中心角 $\\dfrac56\\pi$' },
          { t: 'm', tex: 'l=6\\times\\frac56\\pi=5\\pi' },
          { t: 'm', tex: 'S=\\frac12\\times6^2\\times\\frac56\\pi=15\\pi', note: '確かめ\n$\\frac12lr=\\frac12\\times5\\pi\\times6$' },
          { t: 'fig', id: 'f3', col: 1, view: [-1.35, -0.5, 1.35, 1.4], w: 540, h: 380, items: [
            sector(0, 150, 1.1, 'y'), { k: 'seg', a: [0, 0], b: [1.1, 0], c: 'w', wd: 3.5 }, { k: 'seg', a: [0, 0], b: at(150, 1.1), c: 'w', wd: 3.5 },
            { k: 'arc', o: [0, 0], r: 1.1, a1: 0, a2: 150, c: 'p', wd: 6 }, { k: 'arc', o: [0, 0], r: 0.22, a1: 0, a2: 150, c: 'g', wd: 3 },
            { k: 'label', at: at(75, 0.38), text: '5π/6', c: 'g', size: 24 }, { k: 'label', at: [0.55, 0], text: '6', size: 26, dy: 22 },
            { k: 'label', at: at(60, 1.25), text: 'l=5π', c: 'p', size: 26 }, { k: 'pt', at: [0, 0], name: 'O', dir: 's', r: 5 }] }] },
      { ask: { type: 'choice', q: '半径 4、中心角 $\\dfrac34\\pi$ の扇形の面積は？',
        opts: ['$3\\pi$', '$12\\pi$', '$\\dfrac32\\pi$', '$6\\pi$'], ok: 3,
        why: { 0: 'それは弧の長さ $l=r\\theta$ です。面積は $\\dfrac12r^2\\theta$。', 1: '$\\dfrac12$ をかけわすれています。', 2: '$r$ を2乗していません。$\\dfrac12\\times4^2\\times\\dfrac34\\pi$ です。' },
        good: '$S=\\dfrac12\\times4^2\\times\\dfrac34\\pi=6\\pi$。',
        add: [{ t: 'm', tex: 'S=\\frac12\\times4^2\\times\\frac34\\pi=\\ans{6\\pi}' }] } },
      { ask: { type: 'choice', q: '半径 3、中心角 $60^\\circ$ の扇形の弧の長さを、$l=r\\theta$ で求めると？',
        opts: ['$180$', '$\\pi$', '$3\\pi$', '$\\dfrac{\\pi}{3}$'], ok: 1,
        why: { 0: '$\\theta$ に 60（度のまま）を入れています。$l=r\\theta$ の $\\theta$ はラジアンです。', 2: '$60^\\circ=\\dfrac{\\pi}{3}$ です。$3\\times\\dfrac{\\pi}{3}$ を計算します。', 3: 'それは中心角そのもの。半径 3 をかけます。' },
        good: '$60^\\circ=\\dfrac{\\pi}{3}$ に直して、$l=3\\times\\dfrac{\\pi}{3}=\\pi$。',
        add: [{ t: 'm', tex: '60^\\circ=\\frac{\\pi}{3}\\ \\text{より}\\ \\ l=3\\times\\frac{\\pi}{3}=\\ans{\\pi}', note: '先にラジアンに直す' }] } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　弧の長さから中心角を求める' },
          { t: 'fig', id: 'f4', col: 1, view: [-0.5, -0.45, 1.5, 1.35], w: 480, h: 432, items: [
            sector(0, 45.84, 1.25, 'y'), { k: 'seg', a: [0, 0], b: [1.25, 0], c: 'w', wd: 3.5 }, { k: 'seg', a: [0, 0], b: at(45.84, 1.25), c: 'w', wd: 3.5 },
            { k: 'arc', o: [0, 0], r: 1.25, a1: 0, a2: 45.84, c: 'p', wd: 6 }, { k: 'arc', o: [0, 0], r: 0.26, a1: 0, a2: 45.84, c: 'g', wd: 3 },
            { k: 'label', at: at(22, 0.4), text: 'θ', c: 'g', size: 26 }, { k: 'label', at: [0.62, 0], text: '5', size: 26, dy: 22 },
            { k: 'label', at: at(23, 1.38), text: '4', c: 'p', size: 28 }, { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', r: 5 }] }],
        ask: { type: 'think', q: '半径 5、弧の長さ 4 の扇形の、中心角 $\\theta$ と面積 $S$ を求めよう。',
          hint: '$l=r\\theta$ に $l=4,\\ r=5$ を入れる。面積は $S=\\dfrac12lr$ が速い。',
          ans: '$\\theta=\\dfrac45$、$S=\\dfrac12\\times4\\times5=10$',
          after: '弧度法では、中心角が $\\pi$ をふくまない数になることもあります。$\\dfrac45$ ラジアンは約 $45.8^\\circ$。',
          add: [{ t: 'm', tex: '4=5\\theta\\ \\ \\text{より}\\ \\ \\theta=\\ans{\\frac45}' }, { t: 'm', tex: 'S=\\frac12\\times4\\times5=\\ans{10}', note: '$S=\\dfrac12lr$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、弧度法と一般角を使って、**三角関数** を定義します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
