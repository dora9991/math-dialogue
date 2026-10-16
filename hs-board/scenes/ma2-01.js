/* 数学A 第2章 図形の性質 三角形の性質 ①：線分の内分・外分と平行線と線分の比
   例はすべて自作（AB=10 を 3:2 に内分 → AP=6／A(0), B(6) で 3:1 に外分 → 9、2:5 に外分 → −4／
   DE∥BC, AD=4, DB=6, AE=6, BC=15 → EC=9, DE=6／延長上 AB=6, BD=3, BC=8 → 3:1 に外分, DE=12）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。三角形の図は、その数値どおりの形でかいている。 */
(function () {
  const POINTS = [
    '線分 AB 上の点 P が AP : PB $=m:n$ → P は AB を $m:n$ に **内分**。延長上の点 Q が AQ : QB $=m:n$ → **外分**（$m>n$ なら B の先、$m<n$ なら A の手前）',
    '内分は「AP と PB の **和**」が AB、外分は「AQ と QB の **差**」が AB。そこから1目もり分を出す',
    '**平行線と線分の比**：DE∥BC なら AD : AB $=$ AE : AC $=$ DE : BC、AD : DB $=$ AE : EC。DE : BC は AD : DB ではない'
  ];
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];

  // 図2：外分の2つの場合。上の段（y=1.7）は m>n（A(0) B(4) Q(6)）、下の段（y=0）は m<n（Q(−2) A(0) B(4)）
  const Y1 = 1.7;
  const rowUp = [
    { k: 'seg', a: [-2.9, Y1], b: [7.4, Y1], c: 'd', wd: 2, dash: true }, { k: 'seg', a: [0, Y1], b: [4, Y1], wd: 4 },
    { k: 'label', at: [-3.1, Y1 + 0.55], text: 'm>n', size: 24, anchor: 'start', c: 'y' },
    { k: 'pt', at: [0, Y1], name: 'A', dir: 's', r: 5 }, { k: 'pt', at: [4, Y1], name: 'B', dir: 's', r: 5 }, { k: 'pt', at: [6, Y1], name: 'Q', dir: 's', r: 5, c: 'p' },
    { k: 'dim', a: [0, Y1], b: [6, Y1], dy: -24, label: 'm', c: 'y' }, { k: 'dim', a: [4, Y1], b: [6, Y1], dy: 54, label: 'n', c: 'b' }];
  const rowDown = [
    { k: 'seg', a: [-2.9, 0], b: [7.4, 0], c: 'd', wd: 2, dash: true }, { k: 'seg', a: [0, 0], b: [4, 0], wd: 4 },
    { k: 'label', at: [-3.1, 0.55], text: 'm<n', size: 24, anchor: 'start', c: 'y' },
    { k: 'pt', at: [-2, 0], name: 'Q', dir: 's', r: 5, c: 'p' }, { k: 'pt', at: [0, 0], name: 'A', dir: 's', r: 5 }, { k: 'pt', at: [4, 0], name: 'B', dir: 's', r: 5 },
    { k: 'dim', a: [-2, 0], b: [0, 0], dy: -24, label: 'm', c: 'y' }, { k: 'dim', a: [-2, 0], b: [4, 0], dy: 54, label: 'n', c: 'b' }];

  // 図4・5：平行線と線分の比。B(0,0) C(15,0) A(10/3, 20√2/3)、AB=10, AC=15。D, E は AB, AC を 4:6 に内分（DE∥BC, DE=6）
  const r2 = Math.SQRT2, tA = [10 / 3, 20 * r2 / 3], tB = [0, 0], tC = [15, 0], tD = [2, 4 * r2], tE = [8, 4 * r2], tG = G3(tA, tB, tC);
  const tri = (num) => [
    { k: 'poly', pts: [tA, tB, tC], close: true, fill: 'w', alpha: 0.05 },
    { k: 'seg', a: tD, b: tE, c: 'y', wd: 3.5 },
    { k: 'pt', at: tA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: tB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: tC, name: 'C', dir: 'se', r: 4 },
    { k: 'pt', at: tD, name: 'D', dir: 'w', r: 4 }, { k: 'pt', at: tE, name: 'E', dir: 'ne', r: 4 }
  ].concat(num ? [
    sl(tA, tD, tG, '4', 'b', 22), sl(tD, tB, tG, '6', 'b', 22), sl(tA, tE, tG, '6', 'g', 22), sl(tE, tC, tG, 'x', 'p', 22),
    { k: 'label', at: [7.5, 0], text: '15', size: 26, dy: 26 }, { k: 'label', at: [5, 4 * r2], text: 'y', c: 'p', size: 26, dy: 24 }
  ] : [
    { k: 'label', at: [(tD[0] + tE[0]) / 2, tD[1]], text: 'DE∥BC', c: 'y', size: 22, dy: 26, plain: true }
  ]);

  // 図6：延長上。B(0,0) C(8,0) A(51/16, √(36−(51/16)²))、AB=6, AC=7。D, E は A から 1.5 倍の所（BD=3, DE=12）
  const eA = [51 / 16, Math.sqrt(36 - (51 / 16) ** 2)], eB = [0, 0], eC = [8, 0];
  const eD = [eA[0] - 1.5 * eA[0], eA[1] - 1.5 * eA[1]], eE = [eA[0] + 1.5 * (eC[0] - eA[0]), eA[1] - 1.5 * eA[1]], eG = G3(eA, eD, eE);

  HB.lesson({
    id: 'ma2-01', field: '数学A　図形の性質', title: '線分の内分・外分と平行線と線分の比', level: '三角形の性質', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　長さ $10$ の線分 AB を $3:2$ に内分する点を P とする。AP の長さを求めよ。',
        '(2)　数直線上に A(0)、B(6) がある。線分 AB を $2:5$ に外分する点の座標を求めよ。',
        '(3)　△ABC の辺 AB, AC 上の点 D, E が DE∥BC をみたし、AD $=4$、DB $=6$、AE $=6$、BC $=15$ のとき、EC と DE を求めよ。',
        '(4)　△ABC の辺 AB, AC の B, C の先の延長上に D, E があり、DE∥BC、AB $=6$、BD $=3$、BC $=8$。D は AB を何対何に外分するか。また DE を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Aの「図形の性質」に入ります。最初は、線分を **内分・外分** する点と、中学で学んだ **平行線と線分の比** です。このあとの定理の多くは、この2つを土台にします。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '線分を $m:n$ に **内分**・**外分** する点がわかる\n**平行線と線分の比** を使って長さを求められる' }] },

      // ---------- 内分 ----------
      { clear: true, part: '内分', say: '線分 AB 上の点 P が AP : PB $=m:n$ となるとき、P は線分 AB を $m:n$ に **内分** するといいます。P は A と B の **間** にあります。',
        add: [{ t: 'h', text: '線分の内分' },
          { t: 'box', c: 'b', label: '内分', text: '点 P が線分 AB 上にあって　AP : PB $=m:n$\n→ P は AB を $m:n$ に **内分** する' },
          { t: 'p', size: 'sm', text: 'AP と PB の **和** が AB（全体を $m+n$ 個に分ける）' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.8, -1.25, 5.8, 1.4], w: 620, h: 232, items: [
            { k: 'seg', a: [0, 0], b: [5, 0], wd: 4 },
            { k: 'pt', at: [0, 0], name: 'A', dir: 's', r: 5 }, { k: 'pt', at: [5, 0], name: 'B', dir: 's', r: 5 }, { k: 'pt', at: [3, 0], name: 'P', dir: 's', r: 5, c: 'p' },
            { k: 'dim', a: [0, 0], b: [3, 0], dy: -26, label: 'm', c: 'y' }, { k: 'dim', a: [3, 0], b: [5, 0], dy: -26, label: 'n', c: 'b' }] }] },
      { ask: { type: 'choice', q: '長さ $10$ の線分 AB を $3:2$ に内分する点 P。AP の長さは？',
        opts: ['$4$', '$15$', '$6$', '$2$'], ok: 2,
        why: { 0: '$4$ は PB の長さ。AP は「3」のほうです。', 1: '$3:2$ の 3 と 2 は、全体を 5 つに分けた個数。$10\\times\\frac32$ ではありません。', 3: '$10\\div5=2$ は1つ分。AP はその 3 つ分です。' },
        good: 'AB を $3+2=5$ つに分けると1つ分は $2$。AP はその 3 つ分で $6$。',
        add: [{ t: 'm', tex: '\\mathrm{AP}=10\\times\\frac{3}{3+2}=6' }],
        draw: [{ fig: 'f1', items: [1, 2, 4].map(x => ({ k: 'seg', a: [x, -0.1], b: [x, 0.1], wd: 2.5 })).concat([
          { k: 'dim', a: [0, 0], b: [5, 0], dy: 62, label: 'AB=10　1つ分は 2', c: 'g', plain: true }]) }] } },

      // ---------- 外分 ----------
      { clear: true, part: '外分', say: '線分 AB の **延長上** の点 Q が AQ : QB $=m:n$ となるとき、Q は AB を $m:n$ に **外分** するといいます。$m>n$ なら、Q は B の先にあります。',
        add: [{ t: 'h', text: '線分の外分' },
          { t: 'box', c: 'b', label: '外分', text: '点 Q が線分 AB の **延長上** にあって\nAQ : QB $=m:n$\n→ Q は AB を $m:n$ に **外分** する' },
          { t: 'p', size: 'sm', text: 'AQ と QB の **差** が AB' },
          { t: 'fig', id: 'f2', col: 1, view: [-3.3, -1.1, 7.7, 2.5], w: 600, h: 360, items: rowUp }] },
      { say: '$m<n$ なら、Q は A の手前にきます。$m=n$ のときは、AQ $=$ QB となる点が延長上にないので、外分する点は **ありません**。',
        add: [{ t: 'tbl', rows: [['', '点のある場所'], ['内分', '線分 AB 上（A と B の間）'], ['外分 $m>n$', 'B の先'], ['外分 $m<n$', 'A の手前']] },
          { t: 'p', size: 'sm', text: '$m=n$ の外分点は **ない**' }],
        draw: [{ fig: 'f2', items: rowDown }] },

      // ---------- 数直線で ----------
      { clear: true, cols: [0.5, 0.5], part: '数直線で', say: '数直線で考えます。A(0)、B(6) で、AB を $3:1$ に外分する点 Q。AQ と QB の差の「$3-1=2$ つ分」が AB $=6$ なので、1つ分は $3$ です。',
        add: [{ t: 'h', text: '数直線で外分点を求める' },
          { t: 'p', text: '例　A(0)、B(6) のとき、AB を $3:1$ に外分する点 Q' },
          { t: 'm', tex: '(3-1)\\text{ つ分}=\\mathrm{AB}=6', note: '1つ分は $3$' },
          { t: 'm', tex: '\\mathrm{AQ}=3\\times3=9\\qquad \\mathrm{Q}(9)', note: '$3>1$ → B の先' },
          { t: 'fig', id: 'f3', col: 1, view: [-5.6, -1.6, 10.6, 1.9], w: 680, h: 300, items: [
            { k: 'numline', step: 1, size: 20 },
            { k: 'pt', at: [0, 0], name: 'A', dir: 'n', r: 5 }, { k: 'pt', at: [6, 0], name: 'B', dir: 'n', r: 5 }, { k: 'pt', at: [9, 0], name: 'Q', dir: 'n', r: 5, c: 'b' },
            { k: 'dim', a: [0, 0], b: [9, 0], dy: 62, label: 'AQ=9', c: 'b' }, { k: 'dim', a: [6, 0], b: [9, 0], dy: 100, label: 'QB=3', c: 'b' }] }] },
      { ask: { type: 'choice', q: 'A(0)、B(6) のとき、線分 AB を $2:5$ に外分する点の座標は？',
        opts: ['$10$', '$-\\dfrac{12}{7}$', '$\\dfrac{12}{7}$', '$-4$'], ok: 3,
        why: { 0: 'それは $5:2$ に外分する点。$2<5$ なので A の手前です。', 1: '外分では、AQ と QB の **差**（$5-2=3$ つ分）が AB。7 で割るのは内分のときです。', 2: 'それは $2:5$ に **内分** する点です。' },
        good: '$2<5$ なので A の手前。差の $3$ つ分が $6$ なので1つ分は $2$。A から左へ $4$ で、座標は $-4$。',
        add: [{ t: 'm', tex: '(5-2)\\text{ つ分}=6\\ \\Rightarrow\\ \\mathrm{AR}=2\\times2=4' }, { t: 'ans', label: '答', tex: '-4' }],
        draw: [{ fig: 'f3', items: [{ k: 'pt', at: [-4, 0], name: 'R', dir: 'n', r: 5, c: 'p' },
          { k: 'dim', a: [-4, 0], b: [0, 0], dy: -52, label: '4', c: 'p' }, { k: 'dim', a: [-4, 0], b: [6, 0], dy: -96, label: '10', c: 'p' }] }] } },

      // ---------- 平行線と線分の比 ----------
      { clear: true, part: '平行線と線分の比', say: '中学の復習です。△ABC の辺 AB, AC 上に点 D, E があって **DE∥BC** のとき、次の比が成り立ちます。2つの形を区別しましょう。',
        add: [{ t: 'h', text: '平行線と線分の比（中学の復習）' },
          { t: 'box', c: 'y', label: 'DE∥BC ならば', text: '① AD : AB $=$ AE : AC $=$ DE : BC\n② AD : DB $=$ AE : EC' },
          { t: 'fig', id: 'f4', col: 1, view: [-1.6, -1.4, 16.4, 11.0], w: 560, h: 386, items: tri(false) }] },
      { say: 'DE∥BC なので同位角が等しく、**△ADE ∽ △ABC**（2組の角）。① は相似な三角形の辺の比です。② は ① から AD : (AB−AD) $=$ AE : (AC−AE) として出ます。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{ADE}\\backsim\\triangle\\mathrm{ABC}', note: '同位角が等しい\n（2組の角）' },
          { t: 'p', size: 'sm', text: '逆に、AD : DB $=$ AE : EC ならば DE∥BC' }],
        draw: [{ fig: 'f4', items: [{ k: 'poly', pts: [tA, tD, tE], close: true, fill: 'y', alpha: 0.18, noStroke: true }] }] },

      // ---------- 例題 ----------
      { clear: true, part: '例題　平行線と線分の比', say: '例題です。DE∥BC で AD $=4$、DB $=6$、AE $=6$、BC $=15$。EC を $x$、DE を $y$ とします。まず EC から。',
        add: [{ t: 'h', text: '例題　DE∥BC' },
          { t: 'p', text: 'AD $=4$、DB $=6$、AE $=6$、BC $=15$ のとき\nEC $=x$、DE $=y$ を求めよ。' },
          { t: 'fig', id: 'f5', col: 1, view: [-1.6, -1.4, 16.4, 11.0], w: 560, h: 386, items: tri(true) }] },
      { ask: { type: 'choice', q: 'EC $=x$ は？',
        opts: ['$4$', '$9$', '$15$', '$8$'], ok: 1,
        why: { 0: '$4:6=x:6$ としています。比の順番は AD : DB $=$ AE : EC です。', 2: '$4:10=6:x$ としています。AB と EC は組になりません。', 3: '比は「差」ではありません。$6-4=x-6$ としています。' },
        good: 'AD : DB $=$ AE : EC より $4:6=6:x$、$4x=36$ で $x=9$。',
        add: [{ t: 'm', tex: '4:6=6:x\\qquad x=\\ans{9}', note: 'AD : DB $=$ AE : EC' }] } },
      { ask: { type: 'choice', q: 'DE $=y$ は？',
        opts: ['$6$', '$10$', '$9$', '$\\dfrac{15}{2}$'], ok: 0,
        why: { 1: '$4:6=y:15$ としています。DE : BC は AD : **AB** と等しくなります。', 2: '$6:10=y:15$ としています。DE と組になるのは AD です。', 3: 'D, E は中点ではありません。中点連結定理は使えません。' },
        good: 'AD : AB $=$ DE : BC より $4:10=y:15$、$10y=60$ で $y=6$。',
        add: [{ t: 'm', tex: '4:10=y:15\\qquad y=\\ans{6}', note: 'AD : AB $=$ DE : BC' }] } },
      { say: 'まちがえやすいのは DE : BC。DE は △ADE の辺なので、組になるのは AD : **AB** です。AD : DB と組にしないよう注意します。',
        add: [{ t: 'box', c: 'p', label: '注意', text: 'DE : BC $=$ AD : **AB**　（AD : DB ではない）' }] },

      // ---------- 延長上 ----------
      { clear: true, cols: [0.55, 0.45], part: '延長上にあるとき', say: 'D, E が辺の **延長上** にあっても、DE∥BC なら同じ比が成り立ちます。AB $=6$、BD $=3$、BC $=8$ の図で、外分とつなげて見ます。',
        add: [{ t: 'h', text: 'D, E が延長上にあるとき' },
          { t: 'p', text: 'D, E は辺 AB, AC の B, C の先の延長上\nDE∥BC、AB $=6$、BD $=3$、BC $=8$' },
          { t: 'fig', id: 'f6', col: 1, view: [-3.0, -3.6, 11.8, 6.2], w: 560, h: 371, items: [
            { k: 'poly', pts: [eA, eD, eE], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: eB, b: eC, c: 'y', wd: 3.5 },
            { k: 'pt', at: eA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: eB, name: 'B', dir: 'w', r: 4 }, { k: 'pt', at: eC, name: 'C', dir: 'e', r: 4 },
            { k: 'pt', at: eD, name: 'D', dir: 'sw', r: 4 }, { k: 'pt', at: eE, name: 'E', dir: 'se', r: 4 },
            sl(eA, eB, eG, '6', 'b', 22), sl(eB, eD, eG, '3', 'b', 22),
            { k: 'label', at: [4, 0], text: '8', c: 'y', size: 26, dy: 24 }, { k: 'label', at: [(eD[0] + eE[0]) / 2, eD[1]], text: '?', c: 'p', size: 26, dy: 24 }] }] },
      { ask: { type: 'choice', q: 'このとき、点 D は線分 AB を何対何に外分する？',
        opts: ['$1:3$', '$3:1$', '$2:1$', '$3:2$'], ok: 1,
        why: { 0: '外分の比は AD : DB の順。A から D までのほうが長い（9）です。', 2: 'AB : BD $=6:3$ は外分の比ではありません。外分は AD : DB です。', 3: 'AD : AB $=9:6$ は、△ABC から △ADE への拡大の比です。' },
        good: 'AD $=6+3=9$、DB $=3$ なので AD : DB $=9:3=3:1$。B の先にあるので $3>1$ です。',
        add: [{ t: 'm', tex: '\\mathrm{AD}:\\mathrm{DB}=9:3=3:1', note: 'D は AB を\n$3:1$ に外分' }] } },
      { ask: { type: 'think', q: 'DE の長さを求めよう。',
        hint: '△ABC と △ADE は相似。相似比は AB : AD $=6:9$。',
        ans: 'DE $=8\\times\\dfrac96=12$',
        after: 'AB : AD $=$ BC : DE より $6:9=8:\\mathrm{DE}$。延長上でも、平行線と線分の比は同じように使えます。',
        add: [{ t: 'm', tex: '6:9=8:\\mathrm{DE}\\qquad \\mathrm{DE}=\\ans{12}', note: 'AB : AD $=$ BC : DE' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、平行線を1本引いて、**角の二等分線と比** の定理を証明します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
