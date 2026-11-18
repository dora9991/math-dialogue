/* 数学Ⅱ 第3章 三角関数 ③：三角関数の定義
   半径 r の円の上の点 P(x, y) で sinθ=y/r、cosθ=x/r、tanθ=y/x。単位円、負の角・2π をこえる角、符号、値の範囲。
   例はすべて自作。値（4π/3・−π/4・17π/6・3π/2・−5π/6）は python3（sympy）で検算ずみ。図の点の座標も同じ値。 */
(function () {
  const POINTS = [
    '原点が中心・半径 $r$ の円と、角 $\\theta$ の動径の交点を P$(x,\\ y)$ とすると　$\\sin\\theta=\\dfrac yr$、$\\cos\\theta=\\dfrac xr$、$\\tan\\theta=\\dfrac yx$。単位円（$r=1$）なら P$(\\cos\\theta,\\ \\sin\\theta)$',
    '負の角や $2\\pi$ をこえる角も、動径の位置で値が決まる。符号は P のある象限で決まり、sin は y、cos は x の符号。tan は第1・第3象限で正',
    '値の範囲は　$-1\\le\\sin\\theta\\le1$、$-1\\le\\cos\\theta\\le1$、$\\tan\\theta$ はすべての実数。$\\theta=\\dfrac{\\pi}{2}+n\\pi$（$n$ は整数）では $\\tan\\theta$ は定義されない'
  ];
  const D = Math.PI / 180, R3 = Math.sqrt(3), R2 = Math.SQRT2;
  const at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  const turn = (a1, a2, r0, c, o) => {   // 回転の矢印（うずまき）
    o = o || {}; const span = Math.abs(a2 - a1), n = Math.max(16, Math.ceil(span / 4)), dr = (o.dr != null ? o.dr : 0.1) * span / 360, pts = [];
    for (let i = 0; i <= n; i++) pts.push(at(a1 + (a2 - a1) * i / n, r0 + dr * i / n));
    const sg = a2 > a1 ? 1 : -1, bk = Math.min(16, span / 3), pre = at(a2 - sg * bk, r0 + dr * (1 - bk / span));
    return [{ k: 'poly', pts, c, wd: 3 }, { k: 'seg', a: pre, b: pts[n], c, wd: 3, arrow: true }];
  };
  // 円（半径 r）と座標軸。軸の目もりは円の外側に小さく
  const UC = (id, items, o) => {
    o = o || {}; const r = o.r || 1, v = o.view || [-1.45 * r, -1.22 * r, 1.45 * r, 1.22 * r], w = o.w || 530, t = o.tl || '1';
    const tk = o.ticks === false ? [] : [{ k: 'label', at: [r, 0], text: t, c: 'd', size: 21, dx: 14, dy: 18 }, { k: 'label', at: [-r, 0], text: '−' + t, c: 'd', size: 21, dx: -18, dy: 18 },
      { k: 'label', at: [0, r], text: t, c: 'd', size: 21, dx: -14, dy: -14 }, { k: 'label', at: [0, -r], text: '−' + t, c: 'd', size: 21, dx: -20, dy: 16 }];
    return { t: 'fig', id, col: 1, view: v, w, h: Math.round(w * (v[3] - v[1]) / (v[2] - v[0])), items: [{ k: 'axes', tx: [], ty: [] }, { k: 'circle', o: [0, 0], r, c: 'w', wd: 2.5 }].concat(tk, items) };
  };
  // 点 P(px, py) への動径（黄）・x 軸への垂線（桃）・x 軸上の辺（青）
  const tri = (px, py) => [{ k: 'seg', a: [0, 0], b: [px, py], c: 'y', wd: 4 }, { k: 'seg', a: [px, py], b: [px, 0], c: 'p', wd: 3.5 }, { k: 'seg', a: [0, 0], b: [px, 0], c: 'b', wd: 4.5 },
    { k: 'right', o: [px, 0], a: [0, 0], b: [px, py], s: 14 }];

  HB.lesson({
    id: 'm2c-03', field: '数学Ⅱ　三角関数', title: '三角関数の定義', level: '三角関数', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: '次の値を求めよ。',
      parts: ['(1)　$\\sin\\dfrac43\\pi,\\ \\cos\\dfrac43\\pi,\\ \\tan\\dfrac43\\pi$', '(2)　$\\sin\\left(-\\dfrac{\\pi}{4}\\right),\\ \\cos\\left(-\\dfrac{\\pi}{4}\\right),\\ \\tan\\left(-\\dfrac{\\pi}{4}\\right)$', '(3)　$\\cos\\dfrac{17}{6}\\pi$', '(4)　$\\sin\\dfrac32\\pi,\\ \\cos\\dfrac32\\pi$', '(5)　$\\sin\\left(-\\dfrac56\\pi\\right),\\ \\cos\\left(-\\dfrac56\\pi\\right),\\ \\tan\\left(-\\dfrac56\\pi\\right)$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Ⅰでは、半円の上の点の座標で $0^\\circ$〜$180^\\circ$ の三角比を決めました。この時間は同じ考えで、一般角 $\\theta$ の **三角関数** を定義します。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '一般角 $\\theta$ の $\\sin\\theta,\\ \\cos\\theta,\\ \\tan\\theta$ を、円の上の点の座標で定義する\n値と符号を、単位円で求められる' }] },

      // ---------- 定義 ----------
      { clear: true, part: '定義', say: '原点 O を中心とする半径 r の円をかき、x 軸の正の部分を始線とします。角 $\\theta$ の動径と円の交点を P$(x,\\ y)$ とします。',
        add: [{ t: 'h', text: '一般角の三角関数' },
          { t: 'p', size: 'sm', text: '半径 $r$ の円と、角 $\\theta$ の動径の交点を P$(x,\\ y)$ とする\n（$\\theta$ は一般角。負の角や $2\\pi$ をこえる角でもよい）' },
          UC('f1', tri(-0.766, -0.643).concat(turn(0, 220, 0.2, 'g', { dr: 0.05 }), [
            { k: 'label', at: at(110, 0.42), text: 'θ', c: 'g', size: 26 }, { k: 'label', at: at(220, 0.5), text: 'r', c: 'y', size: 26, dx: 14, dy: -14 },
            { k: 'label', at: [-0.766, -0.32], text: 'y', c: 'p', size: 26, dx: -16 }, { k: 'label', at: [-0.5, 0], text: 'x', c: 'b', size: 26, dy: 20 },
            { k: 'pt', at: [-0.766, -0.643], name: 'P(x, y)', dir: 'sw', r: 6 }]), { tl: 'r' })] },
      { say: 'このとき、次の3つを $\\theta$ の **三角関数** と定義します。数学Ⅰの三角比と同じ形です。値は r によらないので、$r=1$ の **単位円** で考えると、P の座標がそのまま $(\\cos\\theta,\\ \\sin\\theta)$ になります。',
        add: [{ t: 'box', c: 'y', label: '定義', text: '$\\sin\\theta=\\dfrac yr,\\quad \\cos\\theta=\\dfrac xr,\\quad \\tan\\theta=\\dfrac yx$' },
          { t: 'p', size: 'sm', text: '単位円（$r=1$）なら　P$(\\cos\\theta,\\ \\sin\\theta)$\n$\\tan\\theta=\\dfrac yx$ は、直線 OP の **傾き**' }] },

      // ---------- 4π/3 ----------
      { clear: true, part: '値を求める', say: '$\\theta=\\dfrac43\\pi$ を考えます。$\\dfrac43\\pi=\\pi+\\dfrac{\\pi}{3}$ なので、単位円の上の点 P は第3象限。辺の比 $1:\\sqrt3:2$ の三角形から、P$\\left(-\\dfrac12,\\ -\\dfrac{\\sqrt3}{2}\\right)$ です。',
        add: [{ t: 'h', text: '$\\theta=\\dfrac43\\pi$（単位円）' },
          { t: 'p', size: 'sm', text: 'x 軸の負の向きから、さらに $\\dfrac{\\pi}{3}$ 回った点' },
          { t: 'm', tex: '\\mathrm{P}\\left(-\\frac12,\\ -\\frac{\\sqrt3}{2}\\right)' },
          UC('f2', tri(-0.5, -R3 / 2).concat(turn(0, 240, 0.22, 'g'), [
            { k: 'label', at: at(95, 0.42), text: '4π/3', c: 'g', size: 22 },
            { k: 'arc', o: [0, 0], rp: 40, a1: 180, a2: 240, c: 'o', wd: 3 }, { k: 'label', at: at(213, 0.39), text: 'π/3', c: 'o', size: 20 },
            { k: 'pt', at: [-0.5, -R3 / 2], name: 'P', dir: 'sw', r: 6 }]))] },
      { ask: { type: 'choice', q: '$\\sin\\dfrac43\\pi$ の値は？',
        opts: ['$\\dfrac{\\sqrt3}{2}$', '$-\\dfrac12$', '$-\\dfrac{\\sqrt3}{2}$', '$-\\sqrt3$'], ok: 2,
        why: { 0: 'P は第3象限にあり、y 座標は負です。', 1: 'それは x 座標で、$\\cos\\dfrac43\\pi$ の値です。sin は y 座標。', 3: '単位円の点の y 座標なので、$-1$ 以上 $1$ 以下です。' },
        good: '単位円では $\\sin\\theta$ ＝ P の y 座標。$\\sin\\dfrac43\\pi=-\\dfrac{\\sqrt3}{2}$、$\\cos\\dfrac43\\pi=-\\dfrac12$ です。',
        add: [{ t: 'm', tex: '\\sin\\frac43\\pi=\\ans{-\\frac{\\sqrt3}{2}},\\quad \\cos\\frac43\\pi=-\\frac12' }] } },
      { ask: { type: 'choice', q: '$\\tan\\dfrac43\\pi$ の値は？',
        opts: ['$\\sqrt3$', '$-\\sqrt3$', '$\\dfrac{1}{\\sqrt3}$', '$-\\dfrac{1}{\\sqrt3}$'], ok: 0,
        why: { 1: '$\\dfrac yx$ の x も y も負。負÷負は正です。', 2: '$\\dfrac xy$ と、分母と分子を逆にしています。$\\tan\\theta=\\dfrac yx$。', 3: '分母と分子が逆で、符号もちがいます。' },
        good: '$\\tan\\dfrac43\\pi=\\dfrac{-\\sqrt3/2}{-1/2}=\\sqrt3$。直線 OP は右上がりで、傾きも正です。',
        add: [{ t: 'm', tex: '\\tan\\frac43\\pi=\\frac{-\\frac{\\sqrt3}{2}}{-\\frac12}=\\ans{\\sqrt3}' }] } },

      // ---------- 負の角 ----------
      { clear: true, part: '負の角', say: '負の角も同じです。$\\theta=-\\dfrac{\\pi}{4}$ は、時計まわりに $\\dfrac{\\pi}{4}$。半径 $\\sqrt2$ の円で考えると、P$(1,\\ -1)$ と整数の座標になります。',
        add: [{ t: 'h', text: '$\\theta=-\\dfrac{\\pi}{4}$（半径 $\\sqrt2$ の円で）' },
          { t: 'p', size: 'sm', text: 'P$(1,\\ -1)$、$r=\\sqrt2$ を定義に入れる' },
          { t: 'm', tex: '\\sin\\left(-\\frac{\\pi}{4}\\right)=\\frac{-1}{\\sqrt2}=-\\frac{1}{\\sqrt2}' },
          { t: 'm', tex: '\\cos\\left(-\\frac{\\pi}{4}\\right)=\\frac{1}{\\sqrt2}' },
          { t: 'm', tex: '\\tan\\left(-\\frac{\\pi}{4}\\right)=\\frac{-1}{1}=-1' },
          UC('f3', tri(1, -1).concat(turn(0, -45, 0.4, 'p'), [
            { k: 'label', at: at(-22, 0.62), text: '−π/4', c: 'p', size: 22, dx: 16 },
            { k: 'label', at: [0.5, -0.5], text: '√2', c: 'y', size: 24, dx: -20, dy: 6 }, { k: 'label', at: [1, -0.5], text: '1', c: 'p', size: 24, dx: 14 },
            { k: 'label', at: [0.5, 0], text: '1', c: 'b', size: 24, dy: -18 },
            { k: 'pt', at: [1, -1], name: 'P(1, −1)', dir: 'se', r: 6 }]), { r: R2, tl: '√2' })] },

      // ---------- 2π をこえる角 ----------
      { clear: true, part: '2π をこえる角', add: [{ t: 'h', text: '$\\theta=\\dfrac{17}{6}\\pi$' },
          { t: 'm', tex: '\\frac{17}{6}\\pi=\\frac56\\pi+2\\pi', note: '1回転して\nさらに $\\dfrac56\\pi$' },
          { t: 'p', size: 'sm', text: '動径は $\\dfrac56\\pi$ と同じ位置' },
          UC('f4', turn(0, 510, 0.2, 'g', { dr: 0.12 }).concat([{ k: 'seg', a: [0, 0], b: [-R3 / 2, 0.5], c: 'y', wd: 4 },
            { k: 'label', at: at(60, 0.5), text: '17π/6', c: 'g', size: 22, dx: 8 }, { k: 'pt', at: [-R3 / 2, 0.5], name: 'P', dir: 'nw', r: 6 }]))],
        ask: { type: 'choice', q: '$\\cos\\dfrac{17}{6}\\pi$ の値は？',
          opts: ['$\\dfrac12$', '$\\dfrac{\\sqrt3}{2}$', '$-\\dfrac12$', '$-\\dfrac{\\sqrt3}{2}$'], ok: 3,
          why: { 0: 'それは $\\sin\\dfrac{17}{6}\\pi$（y 座標）です。', 1: '動径は第2象限にあるので、x 座標は負です。', 2: '$\\dfrac56\\pi$ の点は $\\left(-\\dfrac{\\sqrt3}{2},\\ \\dfrac12\\right)$。x 座標は $-\\dfrac{\\sqrt3}{2}$ です。' },
          good: '単位円の点は $\\left(-\\dfrac{\\sqrt3}{2},\\ \\dfrac12\\right)$ なので、$\\cos\\dfrac{17}{6}\\pi=-\\dfrac{\\sqrt3}{2}$。',
          add: [{ t: 'm', tex: '\\mathrm{P}\\left(-\\frac{\\sqrt3}{2},\\ \\frac12\\right)\\ \\ \\text{より}\\ \\ \\cos\\frac{17}{6}\\pi=\\ans{-\\frac{\\sqrt3}{2}}' }],
          draw: [{ fig: 'f4', items: [{ k: 'seg', a: [-R3 / 2, 0.5], b: [-R3 / 2, 0], c: 'p', wd: 3.5 }, { k: 'seg', a: [0, 0], b: [-R3 / 2, 0], c: 'b', wd: 4.5 },
            { k: 'label', at: [-0.43, 0], text: '−√3/2', c: 'b', size: 21, dy: 22 }] }] } },

      // ---------- 符号 ----------
      { clear: true, part: '符号', say: 'P$(x,\\ y)$ がどの象限にあるかで、三角関数の符号が決まります。sin は y の符号、cos は x の符号。tan は x と y が同じ符号なら正です。',
        add: [{ t: 'h', text: '三角関数の符号' },
          { t: 'tbl', rows: [['', '第1象限', '第2象限', '第3象限', '第4象限'], ['$\\sin\\theta$', '$+$', '$+$', '$-$', '$-$'], ['$\\cos\\theta$', '$+$', '$-$', '$-$', '$+$'], ['$\\tan\\theta$', '$+$', '$-$', '$+$', '$-$']] },
          UC('f5', [{ k: 'label', at: [0.5, 0.42], text: 'すべて ＋', c: 'y', size: 22, plain: true }, { k: 'label', at: [-0.5, 0.42], text: 'sin だけ ＋', c: 'p', size: 22, plain: true },
            { k: 'label', at: [-0.5, -0.42], text: 'tan だけ ＋', c: 'g', size: 22, plain: true }, { k: 'label', at: [0.5, -0.42], text: 'cos だけ ＋', c: 'b', size: 22, plain: true }])] },
      { ask: { type: 'choice', q: '$\\sin\\theta<0$ かつ $\\tan\\theta>0$ となるのは、$\\theta$ が第何象限の角のとき？',
        opts: ['第1象限', '第2象限', '第4象限', '第3象限'], ok: 3,
        why: { 0: '第1象限では sin も正です。', 1: '第2象限では sin は正、tan は負です。', 2: '第4象限では x>0, y<0 なので、tan は負です。' },
        good: 'sin<0 は第3・第4象限、tan>0 は第1・第3象限。両方を満たすのは **第3象限** です。' } },

      // ---------- 値の範囲 ----------
      { clear: true, part: '値の範囲', say: '単位円の点の座標は $-1$ から $1$ までなので、sin と cos の値の範囲はこうなります。tan は直線 OP の傾きなので、すべての実数の値をとります。',
        add: [{ t: 'h', text: '値の範囲' },
          { t: 'box', c: 'b', label: '値の範囲', text: '$-1\\le\\sin\\theta\\le1,\\quad -1\\le\\cos\\theta\\le1$\n$\\tan\\theta$ は すべての実数' },
          { t: 'p', size: 'sm', text: '$\\theta=\\dfrac{\\pi}{2}+n\\pi$（$n$ は整数）のとき、P は y 軸の上で $x=0$\n→ $\\tan\\theta=\\dfrac yx$ は **定義されない**' },
          UC('f6', [{ k: 'line', x: 0, c: 'p', dash: true }, { k: 'pt', at: [0, 1], name: 'π/2', dir: 'e', dy: 16, c: 'p', r: 7, size: 22 }, { k: 'pt', at: [0, -1], name: '3π/2', dir: 'e', dy: -16, c: 'p', r: 7, size: 22 }], { ticks: false })] },
      { ask: { type: 'choice', q: '$\\theta=\\dfrac32\\pi$ のとき、正しいのは？',
        opts: ['$\\sin\\theta=1$', '$\\cos\\theta=-1$', '$\\sin\\theta=-1$', '$\\tan\\theta=0$'], ok: 2,
        why: { 0: '$\\dfrac32\\pi$ の点は $(0,\\ -1)$。y 座標は $-1$ です。', 1: 'x 座標は 0 なので、$\\cos\\dfrac32\\pi=0$ です。', 3: 'x 座標が 0 なので $\\dfrac yx$ が計算できず、$\\tan\\dfrac32\\pi$ は定義されません。' },
        good: '点 $(0,\\ -1)$ なので $\\sin\\dfrac32\\pi=-1$、$\\cos\\dfrac32\\pi=0$。tan は定義されません。' } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　$\\theta=-\\dfrac56\\pi$' },
          { t: 'p', size: 'sm', text: '時計まわりに $\\dfrac56\\pi$ 回った点を、単位円にかいてみる' },
          UC('f7', [])],
        ask: { type: 'think', q: '$\\sin\\left(-\\dfrac56\\pi\\right)$、$\\cos\\left(-\\dfrac56\\pi\\right)$、$\\tan\\left(-\\dfrac56\\pi\\right)$ を求めよう。',
          hint: '時計まわりに $\\dfrac56\\pi$ 回ると、第3象限。x 軸の負の向きとの角は $\\dfrac{\\pi}{6}$。',
          ans: '$\\sin=-\\dfrac12$、$\\cos=-\\dfrac{\\sqrt3}{2}$、$\\tan=\\dfrac{1}{\\sqrt3}$',
          after: '点は $\\left(-\\dfrac{\\sqrt3}{2},\\ -\\dfrac12\\right)$。第3象限なので sin・cos は負、tan は正になっているか確かめましょう。',
          add: [{ t: 'm', tex: '\\mathrm{P}\\left(-\\frac{\\sqrt3}{2},\\ -\\frac12\\right)' },
            { t: 'm', size: 'sm', tex: '\\sin=\\ans{-\\frac12},\\ \\ \\cos=\\ans{-\\frac{\\sqrt3}{2}},\\ \\ \\tan=\\ans{\\frac{1}{\\sqrt3}}' }],
          draw: [{ fig: 'f7', items: tri(-R3 / 2, -0.5).concat(turn(0, -150, 0.3, 'p'), [{ k: 'label', at: at(-75, 0.5), text: '−5π/6', c: 'p', size: 22 },
            { k: 'pt', at: [-R3 / 2, -0.5], name: 'P', dir: 'sw', r: 6 }]) }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、単位円の対称を使って、三角関数の **性質** と **相互関係** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
