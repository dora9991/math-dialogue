/* 数学Ⅰ 第2章 集合と命題 ⑤：必要条件と十分条件
   例はすべて自作。真理集合の包含・反例・定数 a の範囲は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '$p\\Rightarrow q$ が真のとき　$p$ は $q$ であるための **十分条件**、$q$ は $p$ であるための **必要条件**（出発点が十分、行き先が必要）',
    '$p\\Rightarrow q$ と $q\\Rightarrow p$ がともに真なら **必要十分条件**（$p\\iff q$、$p$ と $q$ は **同値**）',
    '真理集合で：ふくまれる **小さい方が十分**、ふくむ **大きい方が必要**。両方の向きを調べ、偽なら反例'
  ];
  const OPT = ['必要だが十分でない', '十分だが必要でない', '必要十分条件', 'どちらでもない'];
  const NL = (id, items, low) => ({ t: 'fig', id, view: low ? [-6.5, -1.6, 6.5, 1.4] : [-6.5, -0.6, 6.5, 1.4], w: 1100, h: low ? 255 : 170, style: 'margin-top:4px', items: [{ k: 'numline' }].concat(items || []) });

  HB.lesson({
    id: 'm1b-05', field: '数学Ⅰ　集合と命題', title: '必要条件と十分条件', level: '命題と論証', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: '□ に「必要条件だが十分条件でない」「十分条件だが必要条件でない」「必要十分条件」「必要条件でも十分条件でもない」から適するものを入れよ（$x$ は実数）。',
      parts: ['(1)　$x^2=4x$ は $x=4$ であるための □', '(2)　$x>4$ は $x>1$ であるための □', '(3)　$|x|=2$ は $x^2=4$ であるための □',
        '(4)　$x>0$ は $x^2>1$ であるための □', '(5)　実数 $x,\\ y$ について、$xy=0$ は $x=0$ であるための □', '(6)　$-1<x<3$ が $x<a$ であるための十分条件となる、定数 $a$ の値の範囲'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、命題 $p\\Rightarrow q$ の真偽を、真理集合や反例で調べました。この時間は、$p\\Rightarrow q$ が真のときの **言い方** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**必要条件・十分条件・必要十分条件** の意味がわかり、\n真理集合や反例を使って判定できる' },
          { t: 'p', size: 'sm', text: '前の時間：$p\\Rightarrow q$ の真偽（真理集合・反例）\nこの時間：真のときの「条件」の **言い方**' }] },

      // ---------- 定義 ----------
      { clear: true, part: '定義', say: '$p\\Rightarrow q$ が真のとき、$p$ は $q$ であるための **十分条件**、$q$ は $p$ であるための **必要条件** といいます。',
        add: [{ t: 'h', text: '必要条件と十分条件' },
          { t: 'box', c: 'b', label: '定義', text: '$p\\Rightarrow q$ が真のとき\n$p$ は $q$ であるための **十分条件**\n$q$ は $p$ であるための **必要条件**' },
          { t: 'gap', col: 1, h: 40 },
          { t: 'm', col: 1, size: 'lg', tex: '\\underset{\\text{十分条件}}{\\hy{p}}\\ \\Longrightarrow\\ \\underset{\\text{必要条件}}{\\hb{q}}', style: 'align-self:center' }] },
      { say: '矢印の **出発点が十分**、**行き先が必要** です。「$p$ であれば、それで十分 $q$」「$p$ であるには、$q$ であることが必要」と読むと、意味がつかめます。',
        add: [{ t: 'p', size: 'sm', text: '「$p$ であれば、それで **十分** $q$ になる」\n「$p$ であるには、$q$ であることが **必要**」' },
          { t: 'p', col: 1, size: 'sm', text: '出発点 → 十分条件\n行き先 → 必要条件', style: 'align-self:center' },
          { t: 'fig', id: 'pq0', col: 1, view: [0, 0, 10, 5.4], w: 500, h: 270, items: [
            { k: 'circle', o: [5, 2.7], r: 2.55, c: 'b', fill: 'b', alpha: 0.12, label: 'Q（必要）', lat: [8.6, 4.9] },
            { k: 'circle', o: [5.3, 2.5], r: 1.25, c: 'y', fill: 'y', alpha: 0.25, label: 'P（十分）', lat: [5.3, 2.5] }] },
          { t: 'p', col: 1, size: 'xs', text: '前の時間：$p\\Rightarrow q$ が真 $\\iff$ $P\\subset Q$', style: 'align-self:center' }] },

      // ---------- 例 ----------
      { clear: true, part: '例で確かめる', say: '「$x=4$」と「$x^2=4x$」の関係です。$x=4$ なら $x^2=4x$ は成り立ちます。逆向きは、$x=0$ が反例なので偽です。',
        add: [{ t: 'h', text: '例：$x=4$ と $x^2=4x$' },
          { t: 'm', tex: 'x=4\\ \\Rightarrow\\ x^2=4x', note: '真（$16=16$）' },
          { t: 'm', tex: 'x^2=4x\\ \\Rightarrow\\ x=4', note: '偽（反例 $x=0$）' },
          { t: 'p', col: 1, size: 'sm', text: '真理集合' }, { t: 'm', col: 1, tex: '\\{4\\}\\ \\subset\\ \\{0,\\ 4\\}' }] },
      { say: 'したがって、$x=4$ は $x^2=4x$ であるための **十分条件**。でも $x^2=4x$ を満たすのは $x=4$ だけではないので、**必要条件ではありません**。',
        add: [{ t: 'box', c: 'y', label: '結論', text: '$x=4$ は $x^2=4x$ であるための\n十分条件だが、必要条件ではない' }] },
      { ask: { type: 'choice', q: '向きを変えて、$x^2=4x$ は $x=4$ であるための何？',
        opts: OPT, ok: 0,
        why: { 1: '$x^2=4x\\Rightarrow x=4$ は偽（反例 $x=0$）。十分条件ではありません。', 2: '片方の向き（$x^2=4x\\Rightarrow x=4$）が偽なので、必要十分ではありません。', 3: '$x=4\\Rightarrow x^2=4x$ は真。$x^2=4x$ は行き先なので必要条件です。' },
        good: '真の向き $x=4\\Rightarrow x^2=4x$ の **行き先** なので必要条件。逆向きは偽なので十分ではありません。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '$x^2=4x$ は $x=4$ であるための\n**必要条件**だが十分条件でない', style: 'margin-top:20px' }] } },

      // ---------- 集合で見る ----------
      { clear: true, cols: [1], part: '集合で見る', say: '真理集合で見ると、はっきりします。$p:0<x<2$、$q:-1<x<3$ とすると $P\\subset Q$。だから $p\\Rightarrow q$ は真です。',
        add: [{ t: 'h', text: '真理集合で判定する' },
          { t: 'm', tex: 'p:\\ 0<x<2,\\qquad q:\\ -1<x<3' },
          NL('n1', [{ k: 'range', from: -1, to: 3, fromIn: false, toIn: false, c: 'b', h: 72, label: 'Q' },
            { k: 'range', from: 0, to: 2, fromIn: false, toIn: false, c: 'y', h: 38, label: 'P' }])] },
      { say: 'ふくまれる **小さい方が十分条件**、ふくむ **大きい方が必要条件**。$p$ は $q$ であるための十分条件、$q$ は $p$ であるための必要条件です。',
        add: [{ t: 'box', c: 'y', label: '集合で', text: '$P\\subset Q$ のとき　小さい $P$ の $p$ が **十分条件**、大きい $Q$ の $q$ が **必要条件**' }] },
      { ask: { type: 'choice', q: '$x>4$ は $x>1$ であるための何？',
        opts: OPT, ok: 1,
        why: { 0: '$x>4$ の範囲は、$x>1$ の範囲にふくまれる小さい方。小さい方は十分条件です。', 2: '$x>1\\Rightarrow x>4$ は偽（反例 $x=2$）。必要十分ではありません。', 3: '$x>4\\Rightarrow x>1$ は真。十分条件になっています。' },
        good: '$\\{x\\mid x>4\\}\\subset\\{x\\mid x>1\\}$。ふくまれる方の $x>4$ が **十分条件**。',
        add: [{ t: 'm', size: 'sm', tex: '\\{x\\mid x>4\\}\\subset\\{x\\mid x>1\\}\\ \\text{より}\\ \\ x>4\\ \\text{は十分条件（必要条件でない）}' }] } },

      // ---------- 必要十分条件 ----------
      { clear: true, part: '必要十分条件', say: '$p\\Rightarrow q$ と $q\\Rightarrow p$ が **ともに真** のとき、$p$ は $q$ であるための **必要十分条件** です。$p$ と $q$ は **同値** といいます。',
        add: [{ t: 'h', text: '必要十分条件' },
          { t: 'box', c: 'b', label: '定義', text: '$p\\Rightarrow q$ と $q\\Rightarrow p$ がともに真のとき\n$p$ は $q$ であるための **必要十分条件**\n$p\\iff q$ と書き、$p$ と $q$ は **同値** という' }] },
      { say: '真理集合では $P\\subset Q$ かつ $Q\\subset P$、つまり $P=Q$。たとえば「$2x-1=5$」と「$x=3$」は同値です。',
        add: [{ t: 'm', tex: '2x-1=5\\iff x=3', note: '$P=Q=\\{3\\}$' },
          { t: 'gap', col: 1, h: 30 },
          { t: 'm', col: 1, size: 'lg', tex: 'p\\iff q', style: 'align-self:center' },
          { t: 'p', col: 1, size: 'sm', text: '真理集合が等しい（$P=Q$）', style: 'align-self:center' }] },
      { ask: { type: 'choice', q: '$|x|=2$ は $x^2=4$ であるための何？',
        opts: OPT, ok: 2,
        why: { 0: '$|x|=2\\Rightarrow x^2=4$ も真です。十分条件にもなっています。', 1: '$x^2=4\\Rightarrow |x|=2$ も真（$x=\\pm2$ なら $|x|=2$）。', 3: '両方の向きが真です。' },
        good: 'どちらも真理集合は $\\{-2,\\ 2\\}$。$P=Q$ なので **必要十分条件**。',
        add: [{ t: 'm', tex: '|x|=2\\iff x=\\pm2\\iff x^2=4' }] } },

      // ---------- どちらでもない ----------
      { clear: true, cols: [1], part: 'どちらでもない', say: '「$x>0$」と「$x^2>1$」。$x^2>1$ の真理集合は $x<-1$ または $x>1$。2つの集合は、どちらもどちらにふくまれません。',
        add: [{ t: 'h', text: '両方の向きが偽のとき' },
          { t: 'm', tex: 'p:\\ x>0,\\qquad q:\\ x^2>1\\ \\ (x<-1\\ \\text{または}\\ x>1)' },
          NL('n2', [{ k: 'range', from: null, to: -1, toIn: false, c: 'b', h: 72, label: 'Q' },
            { k: 'range', from: 1, to: null, fromIn: false, c: 'b', h: 72, label: 'Q' },
            { k: 'range', from: 0, to: null, fromIn: false, c: 'y', h: 38, label: 'P', dx: -150 }], true)] },
      { ask: { type: 'choice', q: '$x>0$ は $x^2>1$ であるための何？',
        opts: OPT, ok: 3,
        why: { 0: '$x^2>1\\Rightarrow x>0$ は偽（反例 $x=-2$）。必要条件ではありません。', 1: '$x>0\\Rightarrow x^2>1$ は偽（反例 $x=\\frac12$）。十分条件ではありません。', 2: 'どちらの向きも偽です。' },
        good: '$x=\\frac12$ と $x=-2$ が反例。どちらの向きも偽なので、**必要条件でも十分条件でもない**。',
        add: [{ t: 'm', size: 'sm', tex: 'x>0\\Rightarrow x^2>1\\ \\text{は偽（反例 }x=\\tfrac12\\text{）},\\qquad x^2>1\\Rightarrow x>0\\ \\text{は偽（反例 }x=-2\\text{）}' }],
        draw: [{ fig: 'n2', items: [{ k: 'pt', at: [0.5, 0], c: 'p', r: 8, name: 'x=½', dir: 's', off: 62 }, { k: 'pt', at: [-2, 0], c: 'p', r: 8, name: 'x=−2', dir: 's', off: 62 }] }] } },

      // ---------- 判定のしかた ----------
      { clear: true, cols: [0.5, 0.5], part: '判定のしかた', say: '判定のしかたをまとめます。必ず **両方の向き** を調べ、真の向きの「出発点が十分、行き先が必要」で答えます。',
        add: [{ t: 'h', text: '判定のしかた' },
          { t: 'box', c: 'y', label: '手順', text: '① $p\\Rightarrow q$ と $q\\Rightarrow p$ の\n　**両方** の真偽を調べる\n② 偽なら反例、真なら集合の包含で\n③ 真の向きの「出発点が十分、\n　行き先が必要」' },
          { t: 'tbl', col: 1, cls: 'rowh', rows: [['$p\\Rightarrow q$', '$q\\Rightarrow p$', '$p$ は $q$ の'], ['真', '偽', '十分条件'], ['偽', '真', '必要条件'], ['真', '真', '必要十分条件'], ['偽', '偽', 'どちらでもない']] }] },
      { ask: { type: 'choice', q: '実数 $x,\\ y$ について、$xy=0$ は $x=0$ であるための何？',
        opts: OPT, ok: 0,
        why: { 1: '$xy=0\\Rightarrow x=0$ は偽（$x=1,\\ y=0$ が反例）。十分条件ではありません。', 2: '片方の向き（$xy=0\\Rightarrow x=0$）が偽です。', 3: '$x=0\\Rightarrow xy=0$ は真。$xy=0$ は行き先なので必要条件です。' },
        good: '$x=0\\Rightarrow xy=0$ は真、$xy=0\\Rightarrow x=0$ は偽。表の2行目で **必要条件**。',
        add: [{ t: 'm', size: 'sm', tex: 'x=0\\Rightarrow xy=0\\ \\text{真}' }, { t: 'm', size: 'sm', tex: 'xy=0\\Rightarrow x=0\\ \\text{偽（反例 }x=1,\\ y=0\\text{）}' },
          { t: 'ans', label: '答', text: '$xy=0$ は $x=0$ であるための **必要条件**（十分でない）' }] } },

      // ---------- ひとひねり ----------
      { clear: true, cols: [1], part: 'ひとひねり', say: '$a$ は定数です。$p$ が $q$ であるための十分条件になるのは、$P\\subset Q$ となるとき。$Q$ の右はし $a$ を動かして考えます。',
        add: [{ t: 'h', text: '定数をふくむ条件' },
          { t: 'm', tex: 'p:\\ -1<x<3,\\qquad q:\\ x<a\\qquad (a\\ \\text{は定数})' },
          NL('n3', [{ k: 'range', from: -1, to: 3, fromIn: false, toIn: false, c: 'y', h: 38, label: 'P' }])] },
      { ask: { type: 'think', q: '$p:-1<x<3$ が $q:x<a$ であるための **十分条件** となる、$a$ の値の範囲を求めよう。',
        hint: '$P\\subset Q$ となる条件。$a=3$ のとき、$x<3$ は $-1<x<3$ をすべてふくむ？',
        ans: '$P\\subset Q$ となればよいので　$a\\ge3$\n（$a=3$ のとき、$Q:x<3$ も $P$ をすべてふくむ）',
        after: '端の点は、$a=3$ を代入して、等号が入るかを必ず確かめます。',
        add: [{ t: 'ans', label: '答', tex: 'a\\ge3' }],
        draw: [{ fig: 'n3', items: [{ k: 'range', from: null, to: 3, toIn: false, c: 'b', h: 72, label: 'Q（a=3 のとき）', dx: 150 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、条件の **否定**（「〜でない」）を、ド・モルガンの法則を使って考えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
