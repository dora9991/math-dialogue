/* 数学C 第2章 平面上の曲線と複素数平面 複素数平面 ③：ド・モアブルの定理
   例はすべて自作。答え・誤答の値は python3（sympy）で検算ずみ。
   (cosπ/12＋i sinπ/12)⁶＝i／(−1+i)⁶＝(√2)⁶(cos 9π/2＋i sin 9π/2)＝8i（(−2i)³ でも 8i）
   (√3+i)⁵＝32(cos5π/6＋i sin5π/6)＝−16√3＋16i（偏角を π/3 とすると 16−16√3 i、2×5＝10 とすると −5√3＋5i）
   z⁶=1 → ±1, (±1±√3 i)/2／z⁸=1 は 8 個／z³=8i → √3+i, −√3+i, −2i（θ=π/6＋2kπ/3）／z⁴=−4 → ±1±i */
(function () {
  const POINTS = [
    '**ド・モアブルの定理**：$(\\cos\\theta+i\\sin\\theta)^n=\\cos n\\theta+i\\sin n\\theta$（$n$ は整数）。$z^n$ は、絶対値が $|z|^n$、偏角が $n$ 倍',
    '$(a+bi)^n$ は、**極形式に直してから** 定理を使う。最後に偏角を $0\\le\\theta<2\\pi$ の角になおして値を出す',
    '$z^n=\\alpha$ は $z=r(\\cos\\theta+i\\sin\\theta)$ とおき、**絶対値と偏角をくらべる**（偏角は $+2k\\pi$ を忘れない）。$z^n=1$ の解は単位円に内接する **正 $n$ 角形の頂点**'
  ];
  const R3 = Math.sqrt(3), D = Math.PI / 180, U = a => [Math.cos(a * D), Math.sin(a * D)];
  const IM = n => Array.isArray(n) ? n : [n, (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'i'];
  const plane = (tx, ty, o) => Object.assign({ k: 'axes', tx, ty: ty.map(IM), xl: '実軸', yl: '虚軸' }, o || {});
  const HEX = [0, 60, 120, 180, 240, 300].map(U);

  HB.lesson({
    id: 'mc2-03', field: '数学C　平面上の曲線と複素数平面', title: 'ド・モアブルの定理', level: '複素数平面', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\left(\\cos\\dfrac{\\pi}{12}+i\\sin\\dfrac{\\pi}{12}\\right)^6$ を計算', '(2)　$(-1+i)^6$、$(\\sqrt3+i)^5$ を計算',
        '(3)　方程式 $z^6=1$ を解き、解を複素数平面に表す', '(4)　方程式 $z^3=8i$ を解く', '(5)　方程式 $z^4=-4$ を解く'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: '前の時間は、積は「絶対値をかけ、偏角をたす」ことを学びました。同じ数を $n$ 回かける $z^n$ では、どうなるでしょうか。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**ド・モアブルの定理** を使って $z^n$ を計算できる\n$z^n=1$、$z^n=\\alpha$ の形の方程式を、極形式で解ける' }] },

      // ---------- 定理 ----------
      { clear: true, part: 'ド・モアブルの定理', say: '絶対値 1 の $z=\\cos\\theta+i\\sin\\theta$ を考えます。$z$ をかけるたびに偏角が $\\theta$ ずつふえるので、$z^2,\\ z^3,\\ \\cdots$ は単位円の上を回っていきます。',
        add: [{ t: 'h', text: '$z=\\cos\\theta+i\\sin\\theta$ の $n$ 乗' },
          { t: 'm', tex: 'z^2=\\cos2\\theta+i\\sin2\\theta', note: '偏角を\nたす' },
          { t: 'm', tex: 'z^3=z^2\\cdot z=\\cos3\\theta+i\\sin3\\theta' },
          { t: 'fig', id: 'r1', col: 1, view: [-1.45, -0.35, 1.45, 1.35], w: 680, h: 399, items: [plane([[-1, '−1'], [1, '1']], []),
            { k: 'arc', o: [0, 0], r: 1, a1: -10, a2: 190, c: 'd', dash: true },
            { k: 'seg', a: [0, 0], b: U(40), c: 'y', wd: 2 }, { k: 'seg', a: [0, 0], b: U(80), c: 'b', wd: 2 }, { k: 'seg', a: [0, 0], b: U(120), c: 'g', wd: 2 }, { k: 'seg', a: [0, 0], b: U(160), c: 'p', wd: 2 },
            { k: 'arc', o: [0, 0], rp: 66, a1: 0, a2: 40, c: 'y', label: 'θ', lr: 14, size: 20 },
            { k: 'arc', o: [0, 0], rp: 66, a1: 40, a2: 80, c: 'b', label: 'θ', lr: 14, size: 20 },
            { k: 'arc', o: [0, 0], rp: 66, a1: 80, a2: 120, c: 'g', label: 'θ', lr: 14, size: 20 },
            { k: 'arc', o: [0, 0], rp: 66, a1: 120, a2: 160, c: 'p', label: 'θ', lr: 14, size: 20 },
            { k: 'pt', at: U(40), name: 'z', dir: 'ne', c: 'y' }, { k: 'pt', at: U(80), name: 'z²', dir: 'n', c: 'b' },
            { k: 'pt', at: U(120), name: 'z³', dir: 'nw', c: 'g' }, { k: 'pt', at: U(160), name: 'z⁴', dir: 'nw', c: 'p' }] }] },
      { say: 'これを一般にしたものが **ド・モアブルの定理** です。$n$ が負の整数でも成り立ちます。たとえば $z^{-1}=\\cos(-\\theta)+i\\sin(-\\theta)$ です。',
        add: [{ t: 'box', c: 'y', label: 'ド・モアブルの定理', text: '$(\\cos\\theta+i\\sin\\theta)^n$\n$\\qquad=\\cos n\\theta+i\\sin n\\theta$　（$n$ は整数）' }] },
      { ask: { type: 'choice', q: '$\\left(\\cos\\dfrac{\\pi}{12}+i\\sin\\dfrac{\\pi}{12}\\right)^6$ を $a+bi$ の形にすると？',
        opts: ['$6i$', '$-1$', '$\\dfrac{\\sqrt3}{2}+\\dfrac12i$', '$i$'], ok: 3,
        why: { 0: '絶対値は $1^6=1$。6 倍にはなりません。', 1: '$6\\times\\dfrac{\\pi}{12}=\\dfrac{\\pi}{2}$ です。$\\pi$ ではありません。', 2: 'それは2乗まで（偏角 $\\dfrac{\\pi}{6}$）の値です。' },
        good: '偏角が6倍になって $\\dfrac{\\pi}{2}$。$\\cos\\dfrac{\\pi}{2}+i\\sin\\dfrac{\\pi}{2}=i$。',
        add: [{ t: 'm', size: 'sm', tex: '\\left(\\cos\\frac{\\pi}{12}+i\\sin\\frac{\\pi}{12}\\right)^6=\\cos\\frac{\\pi}{2}+i\\sin\\frac{\\pi}{2}=\\ans{i}' }] } },

      // ---------- (a+bi)^n ----------
      { clear: true, cols: [0.62, 0.38], part: '(a+bi)ⁿ の計算', say: '$(-1+i)^6$ を計算します。展開は大変なので、まず **極形式** に直します。$|-1+i|=\\sqrt2$、偏角は $\\dfrac34\\pi$ です。',
        add: [{ t: 'h', text: '$(-1+i)^6$ を計算する' },
          { t: 'm', tex: '-1+i=\\sqrt2\\left(\\cos\\frac34\\pi+i\\sin\\frac34\\pi\\right)' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '絶対値と偏角', text: '$|z^n|=|z|^n$\n$\\arg z^n=n\\arg z$' }] },
      { say: '6乗すると、絶対値は $(\\sqrt2)^6=8$、偏角は $\\dfrac{9}{2}\\pi$。$\\dfrac92\\pi=\\dfrac{\\pi}{2}+4\\pi$ なので、向きは $\\dfrac{\\pi}{2}$ と同じです。',
        add: [{ t: 'm', tex: '\\begin{aligned}(-1+i)^6&=(\\sqrt2)^6\\left(\\cos\\frac92\\pi+i\\sin\\frac92\\pi\\right)\\\\ &=8\\left(\\cos\\frac{\\pi}{2}+i\\sin\\frac{\\pi}{2}\\right)=\\ans{8i}\\end{aligned}' },
          { t: 'p', col: 1, size: 'xs', text: '確かめ：$(-1+i)^2=-2i$ より\n$(-1+i)^6=(-2i)^3=-8i^3=8i$' }] },
      { ask: { type: 'choice', q: '$(\\sqrt3+i)^5$ を $a+bi$ の形にすると？',
        opts: ['$-16\\sqrt3+16i$', '$16\\sqrt3+16i$', '$-5\\sqrt3+5i$', '$16-16\\sqrt3\\,i$'], ok: 0,
        why: { 1: '$\\cos\\dfrac56\\pi=-\\dfrac{\\sqrt3}{2}$（負）です。', 2: '絶対値は $2\\times5$ ではなく $2^5=32$ です。', 3: '$\\sqrt3+i$ の偏角は $\\dfrac{\\pi}{6}$。$\\dfrac{\\pi}{3}$ とすると cos と sin が入れかわります。' },
        good: '$\\sqrt3+i=2\\left(\\cos\\dfrac{\\pi}{6}+i\\sin\\dfrac{\\pi}{6}\\right)$。5乗で $32\\left(\\cos\\dfrac56\\pi+i\\sin\\dfrac56\\pi\\right)$。',
        add: [{ t: 'm', size: 'sm', tex: '(\\sqrt3+i)^5=32\\left(-\\frac{\\sqrt3}{2}+\\frac12i\\right)=\\ans{-16\\sqrt3+16i}' }] } },

      // ---------- 1 の n 乗根 ----------
      { clear: true, cols: [1], part: '1 の n 乗根', say: '数学Ⅱでは、$x^3=1$ の解 $1,\\ \\omega,\\ \\omega^2$ を求めました。こんどは $z^n=1$ を極形式で解きます。$z=r(\\cos\\theta+i\\sin\\theta)$ とおきます。',
        add: [{ t: 'h', text: '方程式 $z^n=1$' },
          { t: 'm', tex: 'r^n(\\cos n\\theta+i\\sin n\\theta)=1(\\cos0+i\\sin0)' },
          { t: 'p', size: 'sm', text: '絶対値と偏角をくらべる（偏角は $2\\pi$ の整数倍のちがいも考える）' },
          { t: 'm', tex: 'r^n=1,\\qquad n\\theta=2k\\pi\\quad(k\\text{ は整数})' }] },
      { say: '$r>0$ なので $r=1$。$\\theta=\\dfrac{2k\\pi}{n}$ で、$k=0,\\ 1,\\ \\cdots,\\ n-1$ の $n$ 個が、ちがう点になります。これを **1 の $n$ 乗根** といいます。',
        add: [{ t: 'box', c: 'y', label: '1 の n 乗根', text: '$z=\\cos\\dfrac{2k\\pi}{n}+i\\sin\\dfrac{2k\\pi}{n}$　（$k=0,\\ 1,\\ \\cdots,\\ n-1$）\n単位円に内接する **正 $n$ 角形の頂点**（1 が頂点の1つ）' }] },
      { clear: true, part: 'z⁶＝1', say: '$z^6=1$ なら、偏角は $0$ から $\\dfrac{\\pi}{3}$ ずつ。6つの解は、単位円に内接する **正六角形** の頂点です。',
        add: [{ t: 'h', text: '$z^6=1$ の解' },
          { t: 'm', tex: '\\theta=\\frac{2k\\pi}{6}=0,\\ \\frac{\\pi}{3},\\ \\frac23\\pi,\\ \\pi,\\ \\frac43\\pi,\\ \\frac53\\pi' },
          { t: 'm', tex: 'z=\\pm1,\\qquad \\frac{\\pm1\\pm\\sqrt3\\,i}{2}', note: '複号は\n任意の組' },
          { t: 'fig', id: 'r2', col: 1, view: [-1.6, -1.4, 1.6, 1.4], w: 560, h: 490, items: [plane([], []),
            { k: 'circle', o: [0, 0], r: 1, c: 'd', dash: true },
            { k: 'poly', pts: HEX, close: true, c: 'y', fill: 'y', alpha: 0.12 },
            { k: 'pts', list: HEX, r: 8, c: 'y' },
            { k: 'arc', o: [0, 0], rp: 56, a1: 0, a2: 60, c: 'g', label: 'π/3', lr: 18, size: 22 },
            { k: 'label', at: [1, 0], text: '1', c: 'y', dx: 18, dy: -18 }, { k: 'label', at: [-1, 0], text: '−1', c: 'y', dx: -24, dy: -18 },
            { k: 'label', at: U(60), text: '(1+√3i)/2', c: 'y', size: 21, anchor: 'start', dx: 12, dy: -16 }] }] },
      { ask: { type: 'choice', q: '方程式 $z^8=1$ の解は、全部で何個？',
        opts: ['$2$ 個', '$4$ 個', '$8$ 個', '$16$ 個'], ok: 2,
        why: { 0: '実数の解 $\\pm1$ だけを数えています。虚数の解もあります。', 1: '$\\pm1,\\ \\pm i$ だけ。偏角 $\\dfrac{\\pi}{4}$ の点なども解です。', 3: '$k=8$ から先は、$k=0,\\ 1,\\ \\cdots$ と同じ点のくり返しです。' },
        good: '$\\theta=\\dfrac{k\\pi}{4}$（$k=0,\\ \\cdots,\\ 7$）の 8 個。単位円に内接する正八角形の頂点です。' } },

      // ---------- z^n = α ----------
      { clear: true, part: 'zⁿ＝α', say: '$z^3=8i$ を解きます。右辺も極形式にして、$8i=8\\left(\\cos\\dfrac{\\pi}{2}+i\\sin\\dfrac{\\pi}{2}\\right)$。絶対値と偏角をくらべます。',
        add: [{ t: 'h', text: '方程式 $z^3=8i$' },
          { t: 'm', size: 'sm', tex: 'r^3(\\cos3\\theta+i\\sin3\\theta)=8\\left(\\cos\\frac{\\pi}{2}+i\\sin\\frac{\\pi}{2}\\right)' },
          { t: 'm', tex: 'r^3=8,\\qquad 3\\theta=\\frac{\\pi}{2}+2k\\pi', note: '$k$ は整数' },
          { t: 'm', tex: 'r=2', note: '$r>0$ より' },
          { t: 'fig', id: 'r3', col: 1, view: [-2.9, -2.7, 2.9, 2.7], w: 540, h: 503, items: [plane([[-2, '−2'], [2, '2']], [2]),
            { k: 'circle', o: [0, 0], r: 2, c: 'd', dash: true }] }] },
      { ask: { type: 'choice', q: '$3\\theta=\\dfrac{\\pi}{2}+2k\\pi$ のとき、$0\\le\\theta<2\\pi$ の $\\theta$ は？',
        opts: ['$\\dfrac{\\pi}{6}$ だけ', '$\\dfrac{\\pi}{6},\\ \\dfrac56\\pi,\\ \\dfrac32\\pi$', '$\\dfrac{\\pi}{2},\\ \\dfrac76\\pi,\\ \\dfrac{11}{6}\\pi$', '$\\dfrac{\\pi}{6},\\ \\dfrac76\\pi$'], ok: 1,
        why: { 0: '$+2k\\pi$ を忘れています。$\\theta$ は $\\dfrac23\\pi$ ずつちがう値もとります。', 2: '$\\dfrac{\\pi}{2}$ も 3 でわります。$\\theta=\\dfrac{\\pi}{6}+\\dfrac{2k\\pi}{3}$ です。', 3: '平方根（$\\pi$ ずつ）と同じにしています。3乗なので $\\dfrac23\\pi$ ずつです。' },
        good: '$\\theta=\\dfrac{\\pi}{6}+\\dfrac{2k\\pi}{3}$（$k=0,\\ 1,\\ 2$）で、3つの角が出ます。',
        add: [{ t: 'm', tex: '\\theta=\\frac{\\pi}{6},\\ \\frac56\\pi,\\ \\frac32\\pi' }] } },
      { say: '$z=2(\\cos\\theta+i\\sin\\theta)$ に入れて、解は3つ。半径 2 の円に内接する **正三角形** の頂点になっています。',
        add: [{ t: 'ans', label: '答', tex: 'z=\\sqrt3+i,\\ \\ -\\sqrt3+i,\\ \\ -2i' }],
        draw: [{ fig: 'r3', items: [
          { k: 'poly', pts: [[R3, 1], [-R3, 1], [0, -2]], close: true, c: 'y', fill: 'y', alpha: 0.12 },
          { k: 'arc', o: [0, 0], rp: 44, a1: 0, a2: 30, c: 'g', label: 'π/6', lr: 22, size: 21 },
          { k: 'seg', a: [0, 0], b: [R3, 1], c: 'g', wd: 2 },
          { k: 'pt', at: [R3, 1], name: '√3+i', dir: 'ne', c: 'y' }, { k: 'pt', at: [-R3, 1], name: '−√3+i', dir: 'nw', c: 'y' },
          { k: 'pt', at: [0, -2], name: '−2i', dir: 'se', c: 'y' }] }] },
      { ask: { type: 'think', q: '方程式 $z^4=-4$ を解こう。',
        hint: '$-4=4(\\cos\\pi+i\\sin\\pi)$。$r^4=4$、$4\\theta=\\pi+2k\\pi$ から。',
        ans: '$r=\\sqrt2$、$\\theta=\\dfrac{\\pi}{4},\\ \\dfrac34\\pi,\\ \\dfrac54\\pi,\\ \\dfrac74\\pi$ より　$z=\\pm1\\pm i$（4つ）',
        after: '4つの解は正方形の頂点。$(1+i)^2=2i$ なので $(1+i)^4=(2i)^2=-4$ と確かめられます。',
        add: [{ t: 'm', size: 'sm', tex: 'z^4=-4\\ \\Longrightarrow\\ z=\\ans{1+i,\\ -1+i,\\ -1-i,\\ 1-i}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、積が回転になることを使って、複素数で **図形** を調べます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
