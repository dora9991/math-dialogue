/* 阪大型 数学（理系）：2026年度 大阪大学 前期 理系 第3問の類題（自作問題・元の問題ではない）
   問題：a は実数。w=(a+i)z+(a−i)z̄。(1) w は実数。(2) |z|=1 かつ w²−2(2a+1)w+8a=0 をみたす z の個数
   答え（python3 で検算ずみ）：
     z=x+yi → w=2(ax−y)。(w−2)(w−4a)=0 → ℓ₁: ax−y=1、ℓ₂: ax−y=2a（平行）
     O からの距離 d₁=1/√(a²+1)（≦1、=1 は a=0）、d₂=2|a|/√(a²+1)（<1 ⇔ |a|<√3/3）。一致は a=1/2（d=2/√5<1）
     個数：|a|>√3/3 → 2、|a|=√3/3 → 3、a=0 → 3、a=1/2 → 2、それ以外（0<|a|<√3/3, a≠1/2）→ 4
     a=√3/3 の接点 z=1/2−(√3/2)i。ℓ₁ は a によらず −i を、ℓ₂ は 2 を通る */
(function () {
  const r3 = Math.sqrt(3);
  // 直線 ax−y=c（y=ax−c）と単位円の交点
  const inter = (a, c) => {
    const A = 1 + a * a, B = -2 * a * c, Cc = c * c - 1, D = B * B - 4 * A * Cc;
    if (D < -1e-9) return [];
    if (Math.abs(D) < 1e-9) { const x = -B / (2 * A); return [[x, a * x - c]]; }
    return [1, -1].map(s => { const x = (-B + s * Math.sqrt(D)) / (2 * A); return [x, a * x - c]; });
  };
  const AX = { k: 'axes', tx: [[-1, '−1'], [1, '1'], [2, '2']], ty: [[1, 'i'], [-1, '−i']], xl: '実軸', yl: '虚軸' };
  const cf = (id, a, o) => {
    o = o || {};
    const it = [AX, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 }];
    if (o.l1 !== false) it.push({ k: 'line', m: a, n: -1, c: 'b', wd: 3, label: 'ℓ₁', lat: o.lat1 || [1.75, a * 1.75 - 1 + 0.25], la: 'end' });
    if (o.l2 !== false) it.push({ k: 'line', m: a, n: -2 * a, c: 'p', wd: o.same ? 6 : 3, dash: !!o.same, label: o.same ? '' : 'ℓ₂', lat: o.lat2 || [-1.7, -a * 1.7 - 2 * a + 0.25], la: 'start' });
    const pts = [];
    if (o.l1 !== false) inter(a, 1).forEach(p => pts.push({ k: 'pt', at: p, c: 'y', r: 7 }));
    if (o.l2 !== false && !o.same) inter(a, 2 * a).forEach(p => pts.push({ k: 'pt', at: p, c: 'y', r: 7 }));
    return { t: 'fig', id, col: 1, view: o.view || [-1.9, -1.75, 2.5, 1.75], w: o.w || 528, h: o.h || 420, items: it.concat(pts, o.items || []) };
  };
  const POINTS = [
    '$\\overline{w}=w$ を示せば $w$ は実数。$(a+i)z$ と $(a-i)\\overline z$ は **共役どうし** なので、$w=2\\times$（$(a+i)z$ の実部）',
    '$w$ の2次方程式は **因数分解** して $w=2,\\ 4a$。$z=x+yi$ とおくと、それぞれ平行な2直線になる',
    '単位円との共有点は **中心と直線の距離** $d$ で：$d<1$ で2個、$d=1$ で1個。2直線が **一致する** $a$ は別に数える'
  ];

  HB.lesson({
    id: 'osaka26-3', field: '阪大型　数学（理系）', title: '2026 阪大 理系 第3問の類題 ― 平行な2直線と単位円の共有点で、解の個数を数える', level: '2026年度 大阪大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$a$ を実数の定数とする。複素数 $z$ に対して $w=(a+i)z+(a-i)\\overline{z}$ とおく。ただし、$i$ は虚数単位、$\\overline{z}$ は $z$ と共役な複素数である。',
      parts: [
        '(1)　$w$ は実数であることを示せ。',
        '(2)　$|z|=1$ であり、かつ $w^2-2(2a+1)w+8a=0$ をみたす複素数 $z$ の個数を、$a$ の値によって分類して求めよ。'
      ],
      src: '※ 2026年度 大阪大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面の問題です。複素数の式を、座標平面の直線と円に言いかえて、解の個数を数えます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: '$a$ は実数なので、$a-i$ は $a+i$ と共役。つまり $(a-i)\\overline z$ は $(a+i)z$ と共役です。$z=x+yi$ とおいて中身を見てみます。',
        add: [{ t: 'h', text: 'w の正体を見る' },
          { t: 'm', tex: '\\overline{(a+i)z}=\\overline{(a+i)}\\cdot\\overline{z}=(a-i)\\overline{z}', note: '← $a$ が実数だから' },
          { t: 'm', tex: '(a+i)(x+yi)=\\hy{(ax-y)}+(x+ay)\\,i', note: '$z=x+yi$（$x,\\ y$ は実数）' }] },
      { ask: { type: 'choice', q: '共役な2数の和は「実部の2倍」。$z=x+yi$ のとき、$w$ は？',
        opts: ['$2(x+ay)$', '$2(ax-y)$', '$2(ax+y)$', '$2(ax-y)\\,i$'], ok: 1,
        why: { 0: 'それは虚部の2倍。共役どうしの和では、虚部は打ち消し合います。', 2: '$i\\cdot yi=-y$。$i^2=-1$ の符号に注意。', 3: '共役どうしの和に $i$ は残りません。' },
        good: '$w=(a+i)z+\\overline{(a+i)z}=2\\times(\\text{実部})=2(ax-y)$。',
        add: [{ t: 'm', tex: 'w=2(ax-y)', note: '$x,\\ y,\\ a$ は実数' }] } },
      { say: '(1) の答案は、$\\overline w=w$ を示す形がすっきりします。共役の性質 $\\overline{\\alpha\\beta}=\\overline\\alpha\\,\\overline\\beta$、$\\overline{\\overline z}=z$ を使います。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '(1) 答案', text: '$a$ は実数なので $\\overline{a+i}=a-i$，$\\overline{a-i}=a+i$。よって\n$\\overline{w}=(a-i)\\overline{z}+(a+i)z=w$\nしたがって、$w$ は実数である。' }] },

      // ---------- (2) 方針 ----------
      { clear: true, cols: [0.56, 0.44], part: '(2) 方針', say: '(2) です。$w$ は実数なので、まず $w$ の2次方程式として解いてしまいます。',
        add: [{ t: 'h', text: '(2)　w の方程式を解く' },
          { t: 'm', tex: 'w^2-2(2a+1)w+8a=0' },
          cf('c1', 0.25, { l1: false, l2: false })] },
      { ask: { type: 'choice', q: '$w^2-2(2a+1)w+8a=0$ を因数分解すると？',
        opts: ['$(w-4)(w-2a)$', '$(w+2)(w+4a)$', '$(w-2)(w-4a)$', '$(w-1)(w-8a)$'], ok: 2,
        why: { 0: '展開すると $w$ の係数は $-(2a+4)$。$-(4a+2)$ になりません。', 1: '和が $-(4a+2)$ になるには、両方ひく形です。', 3: '積は $8a$ ですが、和が $8a+1$ になってしまいます。' },
        good: '「積が $8a$、和が $4a+2$」の2数は $2$ と $4a$。',
        add: [{ t: 'm', tex: '(w-2)(w-4a)=0\\quad\\therefore\\ w=2,\\ 4a' }] } },
      { say: '$w=2(ax-y)$ なので、$w=2$ は直線 $\\ell_1:ax-y=1$、$w=4a$ は直線 $\\ell_2:ax-y=2a$。左辺が同じ形なので、2直線は **平行** です（図は $a=\\frac14$ の例）。',
        add: [{ t: 'm', size: 'sm', tex: '\\ell_1:\\ ax-y=1,\\qquad \\ell_2:\\ ax-y=2a' },
          { t: 'box', c: 'b', size: 'sm', label: '読みかえ', text: '$|z|=1$ → 単位円 $x^2+y^2=1$\n求める個数 ＝ 単位円と $\\ell_1$，$\\ell_2$ の共有点の個数の和\n（$\\ell_1$ と $\\ell_2$ が一致するときは重ねて数えない）' }],
        draw: [{ fig: 'c1', items: [{ k: 'line', m: 0.25, n: -1, c: 'b', wd: 3, label: 'ℓ₁', lat: [1.6, -0.35], la: 'end' }, { k: 'line', m: 0.25, n: -0.5, c: 'p', wd: 3, label: 'ℓ₂', lat: [-1.7, -0.6], la: 'start' }]
          .concat(inter(0.25, 1).concat(inter(0.25, 0.5)).map(p => ({ k: 'pt', at: p, c: 'y', r: 7 }))) }] },
      { ask: { type: 'choice', q: '原点 O と直線 $\\ell_2:ax-y-2a=0$ の距離 $d_2$ は？',
        opts: ['$\\dfrac{2|a|}{\\sqrt{a^2+1}}$', '$\\dfrac{2a}{a^2+1}$', '$\\dfrac{|a|}{\\sqrt{a^2+1}}$', '$2|a|$'], ok: 0,
        why: { 1: '分母は $\\sqrt{a^2+(-1)^2}$。2乗のまま割っています（分子の絶対値も必要）。', 2: '定数項は $-2a$。2 を落としています。', 3: '点と直線の距離では、$\\sqrt{a^2+1}$ で割ります。' },
        good: '点と直線の距離の公式 $\\dfrac{|ax_0-y_0-2a|}{\\sqrt{a^2+1}}$ に $(0,\\,0)$ を入れます。',
        add: [{ t: 'm', size: 'sm', tex: 'd_1=\\frac{1}{\\sqrt{a^2+1}},\\qquad d_2=\\frac{2|a|}{\\sqrt{a^2+1}}' }] } },

      // ---------- (2) 距離で場合分け ----------
      { clear: true, cols: [0.56, 0.44], part: '(2) 距離', say: 'まず $\\ell_1$。$d_1=\\frac1{\\sqrt{a^2+1}}\\le1$ で、等号は $a=0$ のときだけ。$a\\neq0$ なら2点で交わり、$a=0$ なら接します（共有点1個）。',
        add: [{ t: 'h', text: '(2)　それぞれの直線の共有点' },
          { t: 'tbl', size: 'sm', rows: [['', '$d<1$', '$d=1$', '$d>1$'], ['共有点', '2 個', '1 個', '0 個']] },
          { t: 'm', size: 'sm', tex: '\\ell_1:\\ d_1\\le1\\ \\Rightarrow\\ \\begin{cases}a\\neq0:\\ 2\\text{ 個}\\\\ a=0:\\ 1\\text{ 個（接する）}\\end{cases}' },
          cf('c2', 0, { l2: false, lat1: [1.75, -0.8] })] },
      { ask: { type: 'choice', q: '$\\ell_2$ が単位円と **2点で交わる** $a$ の範囲は？',
        opts: ['$|a|<\\dfrac12$', '$|a|<\\sqrt3$', '$|a|>\\dfrac{\\sqrt3}{3}$', '$|a|<\\dfrac{\\sqrt3}{3}$'], ok: 3,
        why: { 0: '$\\frac12$ は2直線が一致する値。$d_2<1$ を解き直しましょう。', 1: '$4a^2<a^2+1$ より $a^2<\\frac13$。$a^2<3$ ではありません。', 2: 'それは $d_2>1$（共有点なし）の範囲です。' },
        good: '$d_2<1\\iff 4a^2<a^2+1\\iff a^2<\\frac13$。$|a|=\\frac{\\sqrt3}{3}$ で接し、$|a|>\\frac{\\sqrt3}{3}$ で共有点なし。',
        add: [{ t: 'm', size: 'sm', tex: '\\ell_2:\\ \\begin{cases}|a|<\\frac{\\sqrt3}{3}:\\ 2\\text{ 個}\\\\[2pt] |a|=\\frac{\\sqrt3}{3}:\\ 1\\text{ 個}\\\\[2pt] |a|>\\frac{\\sqrt3}{3}:\\ 0\\text{ 個}\\end{cases}' }] } },
      { ask: { type: 'choice', q: 'もう1つの注意。$\\ell_1$ と $\\ell_2$ が **一致する** のは？',
        opts: ['$a=0$', '$a=\\dfrac12$', '$a=1$', '$a=2$'], ok: 1,
        why: { 0: '$a=0$ では $\\ell_1:y=-1$，$\\ell_2:y=0$。別の直線です。', 2: '$a=1$ では右辺が $1$ と $2$。一致しません。', 3: '右辺 $1$ と $2a$ が等しくなる $a$ を考えます。' },
        good: '左辺が同じなので、右辺 $1=2a$ のとき一致。$a=\\frac12$ では直線は1本だけで、共有点は $\\ell_1$ の分の2個です。' } },

      // ---------- (2) まとめて数える ----------
      { clear: true, cols: [0.6, 0.4], part: '(2) 数える', say: '表にまとめます。2直線は平行なので、一致しないかぎり共有点が重なることはありません。とくに $a=0$ と $a=\\frac12$ に注意します。',
        add: [{ t: 'h', text: '(2)　a で分類して数える' },
          { t: 'tbl', size: 'sm', rows: [['$a$ の値', '$\\ell_1$', '$\\ell_2$', '個数'], ['$|a|>\\frac{\\sqrt3}{3}$', '2', '0', '2'], ['$|a|=\\frac{\\sqrt3}{3}$', '2', '1', '3'], ['$a=0$', '1', '2', '3'], ['$a=\\frac12$', '2（一致）', '−', '2'], ['上の値以外', '2', '2', '4']] },
          cf('c3', 0, { w: 360, h: 286, lat1: [1.75, -0.8], lat2: [-1.75, 0.22], items: [{ k: 'label', at: [1.35, 1.45], text: 'a = 0', c: 'y', size: 22, plain: true }] }),
          cf('c4', 0.5, { same: true, w: 360, h: 286, lat1: [1.75, 0.15], items: [{ k: 'label', at: [1.35, 1.45], text: 'a = 1/2', c: 'y', size: 22, plain: true }] })] },
      { say: '$a=0$ では $\\ell_1:y=-1$ が $-i$ で接し、$\\ell_2$ は実軸で $\\pm1$ を通るので3個。$a=\\frac12$ では1本の直線 $y=\\frac x2-1$ で、$-i$ と $\\frac45-\\frac35i$ の2個です。' },
      { clear: true, cols: [1], part: '(2) 答', say: '(2) の答えです。$a$ の値の範囲を、もれなく・重なりなく書きます。区切りの値 $-\\frac{\\sqrt3}{3},\\ 0,\\ \\frac12,\\ \\frac{\\sqrt3}{3}$ を数直線に並べて確かめましょう（間隔は目安）。',
        add: [{ t: 'h', text: '(2)　答え' },
          { t: 'fig', id: 'nl', view: [-1.3, -0.7, 1.3, 1.25], w: 980, h: 175, items: [
            { k: 'numline', ticks: [[-0.8, '−√3/3'], [-0.15, '0'], [0.4, '1/2'], [0.85, '√3/3']] },
            { k: 'label', at: [-1.1, 0.45], text: '2 個', c: 'b', size: 24 }, { k: 'label', at: [-0.475, 0.45], text: '4 個', c: 'y', size: 24 },
            { k: 'label', at: [0.125, 0.45], text: '4 個', c: 'y', size: 24 }, { k: 'label', at: [0.625, 0.45], text: '4 個', c: 'y', size: 24 }, { k: 'label', at: [1.1, 0.45], text: '2 個', c: 'b', size: 24 }]
            .concat([[-0.8, '3'], [-0.15, '3'], [0.4, '2'], [0.85, '3']].map(q => ({ k: 'pt', at: [q[0], 0], name: q[1] + ' 個', dir: 'n', off: 40, c: 'p', size: 22, r: 6 }))) },
          { t: 'ans', label: '(2) 答', text: '$|a|>\\dfrac{\\sqrt3}{3}$，$a=\\dfrac12$ のとき 2 個\n$a=\\pm\\dfrac{\\sqrt3}{3}$，$a=0$ のとき 3 個\n$-\\dfrac{\\sqrt3}{3}<a<0$，$0<a<\\dfrac12$，$\\dfrac12<a<\\dfrac{\\sqrt3}{3}$ のとき 4 個' }] },
      { ask: { type: 'think', q: '$a=\\dfrac{\\sqrt3}{3}$ のとき、$\\ell_2$ が単位円に接する点 $z$ を求めよう。',
        hint: '接点は、O から $\\ell_2$ に下ろした垂線の足。$\\ell_2:ax-y=2a$ に垂直な向きは $(a,\\,-1)$。',
        ans: '$z=\\dfrac12-\\dfrac{\\sqrt3}{2}i$',
        after: '垂線の足は $\\frac{2a}{a^2+1}(a,\\,-1)$。$a^2=\\frac13$ を入れると $\\frac{\\sqrt3}{2}\\left(\\frac{\\sqrt3}{3},\\,-1\\right)=\\left(\\frac12,\\,-\\frac{\\sqrt3}{2}\\right)$。$|z|=1$ も確かめられます。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '別の見方です。$\\ell_2:y=a(x-2)$ と書きかえると、$a$ が変わっても必ず通る点があります。$\\ell_1:y=ax-1$ も同じです。',
        add: [{ t: 'h', text: '別の見方：定点を通る直線' },
          { t: 'm', size: 'sm', tex: '\\ell_1:\\ y=ax-1,\\qquad \\ell_2:\\ y=a(x-2)' },
          { t: 'fig', id: 'c5', col: 1, view: [-1.9, -1.75, 2.6, 1.75], w: 540, h: 420, items: [AX, { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
            { k: 'line', m: 1 / r3, n: -2 / r3, c: 'p', wd: 2, dash: true }, { k: 'line', m: -1 / r3, n: 2 / r3, c: 'p', wd: 2, dash: true },
            { k: 'pt', at: [0.5, -r3 / 2], c: 'y', r: 7 }, { k: 'pt', at: [0.5, r3 / 2], c: 'y', r: 7 }] }] },
      { ask: { type: 'choice', q: '$\\ell_2:y=a(x-2)$ が、$a$ によらず通る点は？',
        opts: ['$z=-2$', '$z=-i$', '$z=2$', '$z=2i$'], ok: 2,
        why: { 0: '$x=-2$ を入れると $y=-4a$。$a$ によって変わります。', 1: 'それは $\\ell_1$ が通る点（$x=0$ で $y=-1$）です。', 3: '$x=0$ を入れると $y=-2a$。$a$ によって変わります。' },
        good: '$x=2$ なら $a$ に関係なく $y=0$。$\\ell_2$ は点 $2$ を通る傾き $a$ の直線、$\\ell_1$ は点 $-i$ を通る傾き $a$ の直線です。',
        draw: [{ fig: 'c5', items: [{ k: 'pt', at: [2, 0], name: '2', dir: 'n', c: 'p', size: 22 }, { k: 'pt', at: [0, -1], name: '−i', dir: 'sw', c: 'b', size: 22 }] }] } },
      { say: '点 2 から単位円に引いた接線（点線）の傾きは $\\pm\\frac{1}{\\sqrt3}$。$\\ell_2$ はその間なら2点で交わります。$\\ell_1$ は円周上の $-i$ を通るので必ず交わり、水平（$a=0$）のときだけ接します。',
        add: [{ t: 'p', size: 'sm', text: '・$\\ell_2$：傾き $|a|<\\frac{\\sqrt3}{3}$ で 2 個（距離の計算と一致）\n・$\\ell_1$：$-i$ を通る → いつも共有点あり\n・一致：2 点 $-i$，$2$ を通る直線の傾き $\\frac12$' }] },
      { say: '答案で点がつくところです。個数の問題は、**重なり（一致）** と **接する場合** の書きもらしが一番多い失点です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(1) は $\\overline{w}=w$ を、$a$ が実数であることを断って示す\n・$w=2,\\ 4a$ を直線に言いかえる（平行であることも）\n・距離で 2 個・1 個・0 個を判定\n・$a=\\frac12$（一致）と $a=0$（接する）を別に数える' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数の条件を、座標の直線と円に言いかえるのが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
