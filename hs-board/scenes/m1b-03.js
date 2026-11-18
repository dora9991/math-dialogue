/* 数学Ⅰ 第2章 集合と命題 ③：ド・モルガンの法則
   例はすべて自作（U＝10 以下の自然数、A＝10 の約数、B＝10 以下の奇数／実数の範囲 A：−3<x≦1、B：0≦x<4）。
   集合の計算・区間の補集合は python3 で検算ずみ。 */
(function () {
  const POINTS = [
    '**ド・モルガンの法則**　$\\overline{A\\cup B}=\\overline{A}\\cap\\overline{B}$、$\\overline{A\\cap B}=\\overline{A}\\cup\\overline{B}$',
    '上の線を2つに切ると、$\\cup$ と $\\cap$ が入れかわる。ベン図でぬって、同じ所になることで確かめられる',
    '実数の範囲では数直線で。補集合をとると、端の点の ●（ふくむ）と ○（ふくまない）も入れかわる'
  ];
  // ベン図：A（左の円）＝{1,2,5,10}、B（右の円）＝{1,3,5,7,9}
  // A∩B＝{1,5}　A だけ＝{2,10}　B だけ＝{3,7,9}　どちらでもない＝{4,6,8}
  const A = { o: [3.7, 3], r: 2.2 }, B = { o: [6.3, 3], r: 2.2 };
  const EL = sz => [[5, 3.6, '1'], [5, 2.4, '5'], [2.7, 3.6, '2'], [2.7, 2.4, '10'], [7.3, 3.8, '3'], [7.6, 3, '7'], [7.3, 2.2, '9'], [0.85, 4.55, '4'], [9.3, 0.8, '6'], [5, 0.5, '8']]
    .map(([x, y, t]) => ({ k: 'label', at: [x, y], text: t, size: sz, plain: true }));
  // 大きいベン図（めあて）と、小さいベン図（2つならべる）
  const venn = (id, col, shades, w) => {
    w = w || 600;
    return { t: 'fig', id, col, view: [0, 0, 10, 6], w, h: w * 0.6, items: (shades || []).concat([{ k: 'venn', A, B }], EL(w < 500 ? 25 : 28)) };
  };
  const sh = (shade, fc, alpha) => ({ k: 'venn', A, B, U: false, shade, fc, alpha: alpha || 0.38 });
  const cap = (col, tex) => ({ t: 'm', col, tex, style: 'align-self:center' });
  // 数直線（上：A と B、下：答え）
  const NL = id => ({ t: 'fig', id, view: [-5.5, -2.5, 6.5, 1.5], w: 1020, h: 340, items: [
    { k: 'numline', ticks: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] },
    { k: 'numline', y: -1.9, ticks: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], c: 'd', lc: 'w' }] });

  HB.lesson({
    id: 'm1b-03', field: '数学Ⅰ　集合と命題', title: 'ド・モルガンの法則', level: '集合', time: '目安 7分', noDec: true,
    problem: { label: '例題', lead: '全体集合 $U$ を 10 以下の自然数、$A$ を 10 の約数、$B$ を 10 以下の奇数 とする。',
      parts: ['(1)　$\\overline{A\\cup B}$ と $\\overline{A}\\cap\\overline{B}$ を求めて、くらべる',
        '(2)　$\\overline{A\\cap B}$ と $\\overline{A}\\cup\\overline{B}$ を求めて、くらべる',
        '(3)　$U$ を実数全体、$A=\\{x\\mid -3<x\\le1\\}$、$B=\\{x\\mid 0\\le x<4\\}$ とするとき、$\\overline{A}\\cap\\overline{B}$ と $\\overline{A}\\cup\\overline{B}$'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: '前の時間は、共通部分・和集合・補集合でした。この時間は、それらを組み合わせたときのきまり、**ド・モルガンの法則** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '補集合と「かつ・または」の関係（ド・モルガンの法則）を、ベン図と要素で確かめる' },
          { t: 'p', size: 'sm', text: '全体集合 $U$：10 以下の自然数\n$A$：10 の約数　$=\\{1,\\ 2,\\ 5,\\ 10\\}$\n$B$：10 以下の奇数　$=\\{1,\\ 3,\\ 5,\\ 7,\\ 9\\}$' }] },
      { say: 'ベン図に要素を入れました。重なりは 1, 5。A だけは 2, 10、B だけは 3, 7, 9。どちらにも入らないのが 4, 6, 8 です。',
        add: [venn('v0', 1)] },

      // ---------- 法則① ----------
      { clear: true, cols: [0.36, 0.32, 0.32], part: '法則①', say: '1つめは $\\overline{A\\cup B}$、つまり「$A\\cup B$ の補集合」です。ベン図でぬると、どこになるでしょう。',
        add: [{ t: 'h', text: '$\\overline{A\\cup B}$ と $\\overline{A}\\cap\\overline{B}$' },
          { t: 'm', tex: 'A\\cup B=\\{1,\\ 2,\\ 3,\\ 5,\\ 7,\\ 9,\\ 10\\}' },
          cap(1, '\\overline{A\\cup B}'), venn('L1', 1, [], 450)] },
      { ask: { type: 'choice', q: '$\\overline{A\\cup B}$ をベン図でぬると、どこ？',
        opts: ['重なりの部分だけ', '円 A の外側', '2つの円の外側', '重なり以外のぜんぶ'], ok: 2,
        why: { 0: 'それは $A\\cap B$。$\\overline{A\\cup B}$ は「2つの円をあわせた部分」の外側です。', 1: 'それは $\\overline{A}$。円 B の中の 3, 7, 9 は $A\\cup B$ に入るので除きます。', 3: 'それは $\\overline{A\\cap B}$（重なりの外側）。このあと出てきます。' },
        good: '$A\\cup B$（2つの円をあわせた部分）の外側。要素は 4, 6, 8 です。',
        add: [{ t: 'm', tex: '\\overline{A\\cup B}=\\{4,\\ 6,\\ 8\\}' }, { t: 'p', col: 1, size: 'sm', text: '2つの円をあわせた部分の **外側**', style: 'align-self:center' }],
        draw: [{ fig: 'L1', items: [sh(['ab'], 'y', 0.5)] }] } },
      { say: 'もう一方は $\\overline{A}\\cap\\overline{B}$。まず $\\overline{A}$（円 A の外側）を **青** でぬります。',
        add: [{ t: 'm', tex: '\\hb{\\overline{A}}=\\{3,\\ 4,\\ 6,\\ 7,\\ 8,\\ 9\\}' },
          cap(2, '\\overline{A}\\cap\\overline{B}'), venn('R1', 2, [sh(['aB', 'ab'], 'b', 0.32)], 450)] },
      { say: '次に $\\overline{B}$（円 B の外側）を **桃色** でぬります。**2色が重なった所** が、$\\overline{A}\\cap\\overline{B}$ です。',
        add: [{ t: 'm', tex: '\\ans{\\overline{B}}=\\{2,\\ 4,\\ 6,\\ 8,\\ 10\\}' }],
        draw: [{ fig: 'R1', items: [sh(['Ab', 'ab'], 'p', 0.32)] }] },
      { ask: { type: 'choice', q: '2色が重なった所、$\\overline{A}\\cap\\overline{B}$ の要素は？',
        opts: ['$\\{4,\\ 6,\\ 8\\}$', '$\\{1,\\ 5\\}$', '$\\{2,\\ 10\\}$', '$\\{3,\\ 7,\\ 9\\}$'], ok: 0,
        why: { 1: 'それは $A\\cap B$。どちらの色もぬられていない所です。', 2: '2, 10 は $\\overline{B}$（桃）には入りますが、$\\overline{A}$（青）には入りません。', 3: '3, 7, 9 は青だけ。$\\overline{B}$ には入りません。' },
        good: '$\\overline{A}$ と $\\overline{B}$ の両方に入るのは 4, 6, 8。$\\overline{A\\cup B}$ と同じです。',
        add: [{ t: 'm', tex: '\\overline{A}\\cap\\overline{B}=\\{4,\\ 6,\\ 8\\}' }, { t: 'p', col: 2, size: 'sm', text: '青と桃の **両方** でぬられた所', style: 'align-self:center' }],
        draw: [{ fig: 'R1', items: [sh(['ab'], 'y', 0.45)] }] } },
      { say: 'ぬった所も、要素も同じになりました。これが1つめの **ド・モルガンの法則** です。',
        add: [{ t: 'box', c: 'y', label: '法則①', tex: '\\overline{A\\cup B}=\\overline{A}\\cap\\overline{B}' }] },

      // ---------- 法則② ----------
      { clear: true, cols: [0.36, 0.32, 0.32], part: '法則②', say: '2つめは $\\overline{A\\cap B}$。重なりの部分 $A\\cap B=\\{1,\\ 5\\}$ の **外側ぜんぶ** です。',
        add: [{ t: 'h', text: '$\\overline{A\\cap B}$ と $\\overline{A}\\cup\\overline{B}$' },
          { t: 'm', tex: 'A\\cap B=\\{1,\\ 5\\}' },
          cap(1, '\\overline{A\\cap B}'), venn('L2', 1, [sh(['Ab', 'aB', 'ab'], 'y', 0.5)], 450),
          { t: 'p', col: 1, size: 'sm', text: '重なりの部分の **外側ぜんぶ**', style: 'align-self:center' }] },
      { ask: { type: 'choice', q: '$\\overline{A\\cap B}$ は、$U$ から どの要素を除いたもの？',
        opts: ['$4,\\ 6,\\ 8$', '$2,\\ 10$', '$3,\\ 7,\\ 9$', '$1,\\ 5$'], ok: 3,
        why: { 0: '4, 6, 8 を除くと $A\\cup B$ になります。', 1: '2, 10 は A だけの要素。$A\\cap B$ には入りません。', 2: '3, 7, 9 は B だけの要素。$A\\cap B$ には入りません。' },
        good: '$A\\cap B=\\{1,\\ 5\\}$ を除いた残りぜんぶが $\\overline{A\\cap B}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overline{A\\cap B}=\\{2,\\ 3,\\ 4,\\ 6,\\ 7,\\ 8,\\ 9,\\ 10\\}' }] } },
      { say: '$\\overline{A}\\cup\\overline{B}$ は、青（$\\overline{A}$）と桃（$\\overline{B}$）の **少なくとも一方** でぬられた所。重なりの部分だけが残ります。',
        add: [cap(2, '\\overline{A}\\cup\\overline{B}'), venn('R2', 2, [sh(['aB', 'ab'], 'b', 0.32), sh(['Ab', 'ab'], 'p', 0.32)], 450),
          { t: 'p', col: 2, size: 'sm', text: '青と桃の **少なくとも一方** で\nぬられた所', style: 'align-self:center' }] },
      { ask: { type: 'think', q: '$\\overline{A}=\\{3,4,6,7,8,9\\}$、$\\overline{B}=\\{2,4,6,8,10\\}$ から、$\\overline{A}\\cup\\overline{B}$ の要素を書き出そう。$\\overline{A\\cap B}$ と同じになる？',
        hint: '2つの集合の要素を、同じものは1回だけにして、ぜんぶ集める。',
        ans: '$\\overline{A}\\cup\\overline{B}=\\{2,\\ 3,\\ 4,\\ 6,\\ 7,\\ 8,\\ 9,\\ 10\\}$　→　$\\overline{A\\cap B}$ と同じ',
        add: [{ t: 'm', size: 'sm', tex: '\\overline{A}\\cup\\overline{B}=\\{2,\\ 3,\\ 4,\\ 6,\\ 7,\\ 8,\\ 9,\\ 10\\}' }] } },
      { say: 'こちらも同じになりました。2つめの **ド・モルガンの法則** です。',
        add: [{ t: 'box', c: 'y', label: '法則②', tex: '\\overline{A\\cap B}=\\overline{A}\\cup\\overline{B}' }] },

      // ---------- 覚え方 ----------
      { clear: true, cols: [0.56, 0.44], part: '覚え方', say: '2つの法則をならべます。上の長い線を2つに **切る** と、$\\cup$ と $\\cap$ が **入れかわる**。こう覚えると、まちがえません。',
        add: [{ t: 'h', text: 'ド・モルガンの法則' },
          { t: 'box', c: 'y', label: '①', tex: '\\overline{A\\cup B}=\\overline{A}\\ \\hy{\\cap}\\ \\overline{B}' },
          { t: 'box', c: 'y', label: '②', tex: '\\overline{A\\cap B}=\\overline{A}\\ \\hy{\\cup}\\ \\overline{B}' },
          { t: 'p', size: 'sm', text: '線を切る → $\\cup$ と $\\cap$ が入れかわる\n（$\\overline{A\\cap B}=\\overline{A}\\cap\\overline{B}$ は **まちがい**）' }] },
      { ask: { type: 'choice', q: '$\\overline{\\overline{A}\\cup B}$ を、ド・モルガンの法則で書きかえると？',
        opts: ['$\\overline{A}\\cap\\overline{B}$', '$A\\cap\\overline{B}$', '$A\\cup\\overline{B}$', '$\\overline{A}\\cap B$'], ok: 1,
        why: { 0: '$\\overline{A}$ の補集合は $A$ にもどります（$\\overline{\\overline{A}}=A$）。', 2: '線を切ったら、$\\cup$ は $\\cap$ に変わります。', 3: '補集合をとるのは両方。$\\overline{\\overline{A}}=A$、$B$ は $\\overline{B}$ になります。' },
        good: '$\\overline{\\overline{A}}\\cap\\overline{B}=A\\cap\\overline{B}$。要素は $\\{2,\\ 10\\}$（A だけの部分）。',
        add: [{ t: 'm', tex: '\\overline{\\overline{A}\\cup B}=\\overline{\\overline{A}}\\cap\\overline{B}=A\\cap\\overline{B}', note: '$\\overline{\\overline{A}}=A$' },
          venn('v3', 1, [sh(['Ab'], 'g', 0.45)], 560)] } },
      { say: '要素でも確かめます。$\\overline{A}\\cup B=\\{1,3,4,5,6,7,8,9\\}$ の補集合は $\\{2,\\ 10\\}$。ベン図の「A だけ」の部分です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overline{\\overline{A}\\cup B}=\\{2,\\ 10\\}=A\\cap\\overline{B}' }] },

      // ---------- 実数の範囲 ----------
      { clear: true, cols: [1], part: '実数の範囲', say: '実数の範囲の集合でも、ド・モルガンの法則が使えます。$U$ は実数全体、$A$ と $B$ は数直線のこの範囲です。',
        add: [{ t: 'h', text: '実数の範囲で使う（$U$ は実数全体）' },
          { t: 'm', size: 'sm', tex: 'A=\\{x\\mid -3<x\\le1\\},\\qquad B=\\{x\\mid 0\\le x<4\\}' },
          NL('n1')],
        draw: [{ fig: 'n1', items: [
          { k: 'range', from: -3, to: 1, fromIn: false, toIn: true, c: 'b', h: 38, label: 'A' },
          { k: 'range', from: 0, to: 4, fromIn: true, toIn: false, c: 'p', h: 72, label: 'B' }] }] },
      { say: '$\\overline{A}\\cap\\overline{B}$ を求めます。法則①で $\\overline{A\\cup B}$ にかえると、$A\\cup B$ の **外側** を見るだけです。',
        add: [{ t: 'm', size: 'sm', tex: '\\overline{A}\\cap\\overline{B}=\\overline{A\\cup B},\\qquad A\\cup B=\\{x\\mid -3<x<4\\}' }] },
      { ask: { type: 'choice', q: '$\\overline{A}\\cap\\overline{B}$ は？（端の点に注意）',
        opts: ['$x<-3,\\ 4<x$', '$x\\le-3,\\ 4\\le x$', '$-3<x<4$', '$x\\le-3,\\ 4<x$'], ok: 1,
        why: { 0: '$-3$ は $A$ に入らない（○）ので、補集合には入ります（●）。4 も同じ。', 2: 'それは $A\\cup B$ そのもの。補集合はその外側です。', 3: '4 は $B$ に入らない（○）ので、補集合には入ります。$4\\le x$ です。' },
        good: '$A\\cup B=\\{x\\mid -3<x<4\\}$ の外側。端の ○ は、補集合では ● になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\overline{A}\\cap\\overline{B}=\\{x\\mid x\\le-3\\ \\text{または}\\ 4\\le x\\}' }],
        draw: [{ fig: 'n1', items: [
          { k: 'range', y: -1.9, from: null, to: -3, toIn: true, c: 'y', h: 34 },
          { k: 'range', y: -1.9, from: 4, to: null, fromIn: true, c: 'y', h: 34 }] }] } },
      { ask: { type: 'think', q: '同じように、$\\overline{A}\\cup\\overline{B}$ を求めよう。',
        hint: '法則②で $\\overline{A\\cap B}$ にかえる。$A\\cap B$ は数直線で2つの線が重なった所。',
        ans: '$A\\cap B=\\{x\\mid 0\\le x\\le1\\}$ なので　$\\overline{A}\\cup\\overline{B}=\\overline{A\\cap B}=\\{x\\mid x<0\\ \\text{または}\\ 1<x\\}$',
        after: '0 も 1 も $A\\cap B$ に入る（●）ので、補集合では ○ になります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間からは「命題」。ド・モルガンの法則は、「かつ・または」の否定でもう一度活躍します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
