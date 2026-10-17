/* 熊大型 数学（理系）：2024年度 熊本大学 前期 理系（数学②）第2問の類題（自作問題・元の問題ではない）
   問題：単位円 K の接線どうしの交点を、内積で表す。3OA+4OB+5OC=0 のとき、交点までの距離と三角形の面積。
   答え（python3・sympy で検算ずみ）：
     (1) OP=(a+b)/(1+a·b)（P·a=P·b=1、a,b は1次独立、a·b≠±1）。|OP|²=2/(1+a·b)
     (2) a·b=0、b·c=−4/5、c·a=−3/5。OP=√2、OQ=√10、OR=√5
     (3) a=(1,0), b=(0,1) とおくと c=(−3/5,−4/5)、P(1,1)、Q(−3,1)、R(1,−2)。PQ=4、PR=3、QR=5、面積 6
     （別解：接線の長さ 1, 3, 2、内接円の半径 1、面積＝1×12/2＝6） */
(function () {
  const rad = d => d * Math.PI / 180, U = d => [Math.cos(rad(d)), Math.sin(rad(d))];
  // (1) の図：A は偏角 −25°、B は 75°（一般の位置）
  const A1 = U(-25), B1 = U(75), k1 = A1[0] * B1[0] + A1[1] * B1[1];
  const P1 = [(A1[0] + B1[0]) / (1 + k1), (A1[1] + B1[1]) / (1 + k1)];
  const tanLine = (d, s1, s2, c) => { const p = U(d), v = [-Math.sin(rad(d)), Math.cos(rad(d))]; return { k: 'seg', a: [p[0] + v[0] * s1, p[1] + v[1] * s1], b: [p[0] + v[0] * s2, p[1] + v[1] * s2], c: c || 'b', wd: 2.5 }; };
  const fig1 = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.5, -1.45, 2.2, 1.6], w: 450, h: 371, items: [
    { k: 'circle', o: [0, 0], r: 1, c: 'd', wd: 2.5 },
    { k: 'vec', a: [0, 0], b: A1, c: 'y' }, { k: 'vec', a: [0, 0], b: B1, c: 'y' },
    { k: 'label', at: [0.5, -0.12], text: 'a', vec: true, c: 'y', size: 24, dy: 20 }, { k: 'label', at: [0.05, 0.5], text: 'b', vec: true, c: 'y', size: 24, dx: -18 },
    tanLine(-25, -0.75, 1.75), tanLine(75, -1.75, 0.75),
    { k: 'right', o: A1, a: [0, 0], b: P1, s: 13 }, { k: 'right', o: B1, a: [0, 0], b: P1, s: 13 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', c: 'w', r: 4 },
    { k: 'pt', at: A1, name: 'A', dir: 'se', c: 'y' }, { k: 'pt', at: B1, name: 'B', dir: 'nw', c: 'y' },
    { k: 'pt', at: P1, name: 'P', dir: 'e', c: 'p' },
    { k: 'label', at: [1.3, -0.3], text: 'ℓ', c: 'b', size: 24 }, { k: 'label', at: [1.3, -0.3], text: 'A', c: 'b', size: 16, dx: 12, dy: 8, plain: true },
    { k: 'label', at: [-0.66, 1.3], text: 'ℓ', c: 'b', size: 24 }, { k: 'label', at: [-0.66, 1.3], text: 'B', c: 'b', size: 16, dx: 12, dy: 8, plain: true }
  ].concat(extra || []) });
  // (2)(3) の図：a=(1,0)、b=(0,1)、c=(−3/5,−4/5)、P(1,1)、Q(−3,1)、R(1,−2)
  const A = [1, 0], B = [0, 1], C = [-0.6, -0.8], P = [1, 1], Q = [-3, 1], R = [1, -2];
  const fig2 = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-3.6, -2.55, 1.9, 1.75], w: w || 540, h: Math.round((w || 540) * 4.3 / 5.5), items: [
    { k: 'poly', pts: [P, Q, R], close: true, fill: 'p', alpha: 0.12, c: 'p', wd: 2.5 },
    { k: 'circle', o: [0, 0], r: 1, c: 'd', wd: 2.5 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', c: 'w', r: 4, size: 22 },
    { k: 'pt', at: A, name: 'A', dir: 'w', c: 'y', size: 24 }, { k: 'pt', at: B, name: 'B', dir: 's', c: 'y', size: 24 }, { k: 'pt', at: C, name: 'C', dir: 'ne', c: 'y', size: 24 },
    { k: 'pt', at: P, name: 'P', dir: 'ne', c: 'p' }, { k: 'pt', at: Q, name: 'Q', dir: 'nw', c: 'p' }, { k: 'pt', at: R, name: 'R', dir: 'se', c: 'p' }
  ].concat(extra || []) });

  const POINTS = [
    '円の接線は「半径に垂直」。ベクトルでは、接点 A の接線上の点 X は $\\overrightarrow{\\mathrm{OX}}\\cdot\\vec a=|\\vec a|^2$（単位円なら $=1$）',
    '交点は $s\\vec a+t\\vec b$ とおいて条件を内積で書き、係数を決める。割る前に $1+\\vec a\\cdot\\vec b\\neq0$ などを確かめる',
    '$3\\vec a+4\\vec b+5\\vec c=\\vec0$ からは「1つを移項して2乗」で内積が出る。距離は $|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{2}{1+\\vec a\\cdot\\vec b}$'
  ];

  HB.lesson({
    id: 'kuma24-2', field: '熊大型　数学（理系）', title: '2024 熊大 理系 第2問の類題 ― 単位円の接線の交点を内積で表す', level: '2024年度 熊本大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上に、原点 O を中心とする半径 1 の円 $K$ がある。$K$ 上の点 X における $K$ の接線を $\\ell_{\\mathrm X}$ と書く。',
      parts: [
        '(1)　$K$ 上の 2 点 A, B は、一致せず、直径の両端でもないとする。$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b$ とし、$\\ell_{\\mathrm A}$ と $\\ell_{\\mathrm B}$ の交点を P とする。このとき $\\overrightarrow{\\mathrm{OP}}=\\dfrac{\\vec a+\\vec b}{1+\\vec a\\cdot\\vec b}$ であることを示せ。',
        '(2)　$K$ 上の 3 点 A, B, C が $3\\overrightarrow{\\mathrm{OA}}+4\\overrightarrow{\\mathrm{OB}}+5\\overrightarrow{\\mathrm{OC}}=\\vec 0$ をみたしている。$\\overrightarrow{\\mathrm{OC}}=\\vec c$ とする。内積 $\\vec a\\cdot\\vec b,\\ \\vec b\\cdot\\vec c,\\ \\vec c\\cdot\\vec a$ を求めよ。また、$\\ell_{\\mathrm A}$ と $\\ell_{\\mathrm B}$、$\\ell_{\\mathrm B}$ と $\\ell_{\\mathrm C}$、$\\ell_{\\mathrm C}$ と $\\ell_{\\mathrm A}$ の交点をそれぞれ P, Q, R とするとき、OP, OQ, OR を求めよ。',
        '(3)　(2) のとき、三角形 PQR の面積を求めよ。'
      ],
      src: '※ 2024年度 熊本大学 前期 理系（数学②）第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '円の接線の交点を、ベクトルと内積で表す問題です。(1) は証明、(2)(3) は計算。(1) ができなくても (2) からは進めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '円の接線は、接点を通る半径に垂直。ベクトルで書くと、$\\ell_{\\mathrm A}$ 上の点 X は $(\\overrightarrow{\\mathrm{OX}}-\\vec a)\\cdot\\vec a=0$ をみたします。',
        add: [{ t: 'h', text: '読みかえ：接線を内積で書く' },
          { t: 'box', c: 'b', size: 'sm', label: '接線の条件', text: 'X が $\\ell_{\\mathrm A}$ 上 $\\iff$ $\\overrightarrow{\\mathrm{AX}}\\perp\\vec a$ または X＝A\n$\\iff(\\overrightarrow{\\mathrm{OX}}-\\vec a)\\cdot\\vec a=0$' },
          fig1('k1')] },
      { ask: { type: 'choice', q: 'P は $\\ell_{\\mathrm A}$ 上の点。$\\vec p=\\overrightarrow{\\mathrm{OP}}$ として、これを内積で書くと？',
        opts: ['$\\vec p\\cdot\\vec a=0$', '$\\vec p\\cdot\\vec a=1$', '$\\vec p\\cdot\\vec b=1$', '$|\\vec p|=1$'], ok: 1,
        why: { 0: '垂直なのは $\\vec p-\\vec a$ と $\\vec a$。展開すると $\\vec p\\cdot\\vec a=|\\vec a|^2=1$ です。', 2: 'それは P が $\\ell_{\\mathrm B}$ 上にある条件です（これも使います）。', 3: 'P は円の外の点なので、$|\\vec p|>1$ です。' },
        good: '$(\\vec p-\\vec a)\\cdot\\vec a=0$ より $\\vec p\\cdot\\vec a=|\\vec a|^2=1$。同じく $\\ell_{\\mathrm B}$ 上なので $\\vec p\\cdot\\vec b=1$。',
        add: [{ t: 'm', tex: '\\vec p\\cdot\\vec a=1,\\qquad \\vec p\\cdot\\vec b=1', note: '$\\vec p=\\overrightarrow{\\mathrm{OP}}$' }] } },

      // ---------- (1) 答案 ----------
      { clear: true, part: '(1)', say: 'A, B は一致せず直径の両端でもないので、$\\vec a,\\ \\vec b$ は平行でない（1次独立）。だから $\\vec p=s\\vec a+t\\vec b$ と表せます。$k=\\vec a\\cdot\\vec b$ とおいて代入。',
        add: [{ t: 'h', text: '(1)　答案' },
          { t: 'm', size: 'sm', tex: '\\vec p=s\\vec a+t\\vec b\\quad(s,\\ t\\ \\text{は実数})', note: '$k=\\vec a\\cdot\\vec b$' },
          { t: 'm', size: 'sm', tex: '\\begin{cases} \\vec p\\cdot\\vec a=s+tk=1\\\\ \\vec p\\cdot\\vec b=sk+t=1\\end{cases}', note: '$|\\vec a|=|\\vec b|=1$' },
          fig1('k2')] },
      { ask: { type: 'choice', q: 'この連立方程式を解くと？',
        opts: ['$s=t=\\dfrac1{1+k}$', '$s=t=\\dfrac1{1-k}$', '$s=1,\\ t=0$', '$s+t=1$ だけが言える'], ok: 0,
        why: { 1: '2式を引くと $(s-t)(1-k)=0$、足すと $(s+t)(1+k)=2$。分母は $1+k$ です。', 2: 'それは $\\vec p=\\vec a$（P＝A）のとき。P は円の外の点です。', 3: '$s+t=1$ は「P が直線 AB 上」の条件。P は AB 上にはありません。' },
        good: '引くと $(s-t)(1-k)=0$。$\\vec a\\neq\\vec b$ より $k\\neq1$ なので $s=t$。代入して $s(1+k)=1$。',
        add: [{ t: 'm', size: 'sm', tex: '(s-t)(1-k)=0\\ \\Rightarrow\\ s=t,\\quad s(1+k)=1', note: '$k\\neq1$ を使う' }] } },
      { say: '割る前に $1+k\\neq0$ を確認。単位ベクトルでは $k=-1\\iff\\vec b=-\\vec a$（直径の両端）なので、仮定から $k\\neq-1$。これで (1) が示せました。',
        add: [{ t: 'p', size: 'xs', text: '$|\\vec a|=|\\vec b|=1$ のとき　$\\vec a\\cdot\\vec b=1\\iff\\vec a=\\vec b$，　$\\vec a\\cdot\\vec b=-1\\iff\\vec a=-\\vec b$' },
          { t: 'ans', label: '(1) 示せた', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{\\vec a+\\vec b}{1+\\vec a\\cdot\\vec b}' }] },
      { ask: { type: 'think', q: '(1) の式から、$|\\overrightarrow{\\mathrm{OP}}|^2$ を $k=\\vec a\\cdot\\vec b$ だけで表そう。',
        hint: '$|\\vec a+\\vec b|^2=|\\vec a|^2+2\\,\\vec a\\cdot\\vec b+|\\vec b|^2$ を使う。',
        ans: '$|\\vec a+\\vec b|^2=2+2k$ なので　$|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{2+2k}{(1+k)^2}=\\dfrac{2}{1+k}$',
        after: '交点までの距離は、内積だけで決まります。A, B が向かい合う（$k$ が $-1$ に近い）ほど P は遠くへ。(2) でこの式を使います。',
        add: [{ t: 'box', c: 'y', col: 1, size: 'sm', label: '距離の式', text: '$|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{2}{1+\\vec a\\cdot\\vec b}$' }] } },

      // ---------- (2) 内積 ----------
      { clear: true, part: '(2)', say: '$3\\vec a+4\\vec b+5\\vec c=\\vec0$ から内積を出すコツは、**1つを移項して両辺の大きさを2乗**。$\\vec c$ を移項すると $3\\vec a+4\\vec b=-5\\vec c$。',
        add: [{ t: 'h', text: '(2)　内積を求める' },
          { t: 'm', tex: '3\\vec a+4\\vec b=-5\\vec c', note: '両辺の大きさを2乗' },
          { t: 'm', size: 'sm', tex: '9|\\vec a|^2+24\\,\\vec a\\cdot\\vec b+16|\\vec b|^2=25|\\vec c|^2' }] },
      { ask: { type: 'choice', q: '$|\\vec a|=|\\vec b|=|\\vec c|=1$ を入れると、$\\vec a\\cdot\\vec b$ は？',
        opts: ['$\\dfrac12$', '$-\\dfrac45$', '$1$', '$0$'], ok: 3,
        why: { 0: '$9+24\\,\\vec a\\cdot\\vec b+16=25$ を解くと 0。$\\frac12$ にはなりません。', 1: 'それは $\\vec b\\cdot\\vec c$ の値です。', 2: '$\\vec a\\cdot\\vec b=1$ なら A＝B になってしまいます。' },
        good: '$9+24\\,\\vec a\\cdot\\vec b+16=25$ より $\\vec a\\cdot\\vec b=0$。$\\angle\\mathrm{AOB}=90^\\circ$ です。',
        add: [{ t: 'm', tex: '9+24\\,\\vec a\\cdot\\vec b+16=25\\ \\Rightarrow\\ \\vec a\\cdot\\vec b=0' }] } },
      { say: '同じように、$4\\vec b+5\\vec c=-3\\vec a$、$5\\vec c+3\\vec a=-4\\vec b$ の両辺の大きさを2乗します。',
        add: [{ t: 'm', size: 'sm', tex: '16+40\\,\\vec b\\cdot\\vec c+25=9\\ \\Rightarrow\\ \\vec b\\cdot\\vec c=-\\frac45' },
          { t: 'm', size: 'sm', tex: '25+30\\,\\vec c\\cdot\\vec a+9=16\\ \\Rightarrow\\ \\vec c\\cdot\\vec a=-\\frac35' }] },

      // ---------- (2) 距離 ----------
      { clear: true, say: 'どの内積も $\\pm1$ ではないので、どの2点も一致せず直径の両端でもない。(1) が使えます。距離の式 $|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{2}{1+\\vec a\\cdot\\vec b}$ に入れます。',
        add: [{ t: 'h', text: '(2)　つづき：交点までの距離' },
          { t: 'm', tex: '\\mathrm{OP}^2=\\frac{2}{1+\\vec a\\cdot\\vec b}=\\frac{2}{1+0}=2' }] },
      { ask: { type: 'choice', q: 'OQ（$\\ell_{\\mathrm B}$ と $\\ell_{\\mathrm C}$ の交点まで）は？',
        opts: ['$\\sqrt5$', '$\\sqrt{10}$', '$\\dfrac{\\sqrt{10}}{3}$', '$10$'], ok: 1,
        why: { 0: 'それは OR（$\\vec c\\cdot\\vec a=-\\frac35$ のほう）です。', 2: '$1+\\vec b\\cdot\\vec c=1-\\frac45=\\frac15$。$1+\\frac45$ にしています。', 3: 'それは $\\mathrm{OQ}^2$。最後に $\\sqrt{\\ }$ をとります。' },
        good: '$\\mathrm{OQ}^2=\\dfrac{2}{1-\\frac45}=10$ より $\\mathrm{OQ}=\\sqrt{10}$。同じく $\\mathrm{OR}^2=\\dfrac{2}{1-\\frac35}=5$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{OQ}^2=\\frac{2}{1-\\frac45}=10,\\qquad \\mathrm{OR}^2=\\frac{2}{1-\\frac35}=5' }] } },
      { say: '(2) の答えです。右の図は、この3点 A, B, C と接線の交点 P, Q, R。OQ がいちばん長く、図とも合っています。',
        add: [{ t: 'ans', label: '(2) 答', text: '$\\vec a\\cdot\\vec b=0$，　$\\vec b\\cdot\\vec c=-\\dfrac45$，　$\\vec c\\cdot\\vec a=-\\dfrac35$\n$\\mathrm{OP}=\\sqrt2$，　$\\mathrm{OQ}=\\sqrt{10}$，　$\\mathrm{OR}=\\sqrt5$' },
          fig2('t1', [{ k: 'seg', a: [0, 0], b: Q, c: 'b', dash: true, wd: 2 }, { k: 'label', at: [-1.7, 0.85], text: '√10', c: 'b', size: 21 }])] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '面積は、座標を入れると見通しがよくなります。$\\vec a\\perp\\vec b$ で大きさ 1 なので、回転や裏返しをして $\\vec a=(1,\\ 0),\\ \\vec b=(0,\\ 1)$ とおけます。',
        add: [{ t: 'h', text: '(3)　三角形 PQR の面積' },
          { t: 'm', size: 'sm', tex: '\\vec a=(1,\\ 0),\\quad \\vec b=(0,\\ 1)', note: '面積は回転・裏返しで\n変わらない' },
          { t: 'm', size: 'sm', tex: '\\vec c=-\\frac{3\\vec a+4\\vec b}{5}=\\Big(-\\frac35,\\ -\\frac45\\Big)' },
          fig2('t2')] },
      { ask: { type: 'choice', q: 'Q の座標は？（$\\overrightarrow{\\mathrm{OQ}}=\\dfrac{\\vec b+\\vec c}{1+\\vec b\\cdot\\vec c}$）',
        opts: ['$\\left(-\\dfrac35,\\ \\dfrac15\\right)$', '$(1,\\ -2)$', '$(-3,\\ 1)$', '$(3,\\ -1)$'], ok: 2,
        why: { 0: 'それは $\\vec b+\\vec c$ だけ。$1+\\vec b\\cdot\\vec c=\\frac15$ で割ります。', 1: 'それは R の座標です。', 3: '符号が逆です。$\\left(-\\frac35,\\ \\frac15\\right)$ を $\\frac15$ で割ります。' },
        good: '$\\vec b+\\vec c=\\left(-\\dfrac35,\\ \\dfrac15\\right)$ を $\\dfrac15$ で割って $(-3,\\ 1)$。$\\mathrm{OQ}=\\sqrt{10}$ とも合います。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm P(1,\\ 1),\\quad \\mathrm Q(-3,\\ 1),\\quad \\mathrm R(1,\\ -2)' }] } },
      { say: 'PQ は $x$ 軸に平行で長さ 4、PR は $y$ 軸に平行で長さ 3。三角形 PQR は、P が直角の直角三角形です。（$\\vec a\\perp\\vec b$ だから $\\ell_{\\mathrm A}\\perp\\ell_{\\mathrm B}$）',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{PQ}=1-(-3)=4,\\qquad \\mathrm{PR}=1-(-2)=3' }],
        draw: [{ fig: 't2', items: [{ k: 'right', o: P, a: Q, b: R, s: 14, c: 'p' }, { k: 'label', at: [-1, 1], text: '4', dy: -20, c: 'p', size: 24 }, { k: 'label', at: [1, -0.5], text: '3', dx: 20, c: 'p', size: 24 }] }] },
      { ask: { type: 'choice', q: '三角形 PQR の面積は？',
        opts: ['$12$', '$5$', '$\\dfrac65$', '$6$'], ok: 3,
        why: { 0: '$\\frac12$ をかけ忘れています。', 1: '斜辺 QR $=5$ を使っています。直角をはさむ2辺は 4 と 3。', 2: 'それは三角形 ABC の面積。P, Q, R は接線の交点です。' },
        good: '$\\dfrac12\\cdot\\mathrm{PQ}\\cdot\\mathrm{PR}=\\dfrac12\\cdot4\\cdot3=6$ です。',
        add: [{ t: 'ans', label: '(3) 答', text: '三角形 PQR の面積は　$6$' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '座標を使わない見方。接線の長さは三平方の定理で出ます。たとえば $\\mathrm{PA}=\\mathrm{PB}=\\sqrt{\\mathrm{OP}^2-1}=1$。',
        add: [{ t: 'h', text: '別の見方：接線の長さと内接円' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PA}=\\mathrm{PB}=\\sqrt{2-1}=1' },
          { t: 'm', size: 'sm', tex: '\\mathrm{QB}=\\mathrm{QC}=\\sqrt{10-1}=3' },
          { t: 'm', size: 'sm', tex: '\\mathrm{RC}=\\mathrm{RA}=\\sqrt{5-1}=2' },
          fig2('t3', [
            { k: 'label', at: [0.5, 1], text: '1', dy: -20, c: 'y', size: 24 }, { k: 'label', at: [1, 0.5], text: '1', dx: 20, c: 'y', size: 24 },
            { k: 'label', at: [-1.5, 1], text: '3', dy: -20, c: 'y', size: 24 }, { k: 'label', at: [-1.98, -0.14], text: '3', c: 'y', size: 24 },
            { k: 'label', at: [0.02, -1.64], text: '2', c: 'y', size: 24 }, { k: 'label', at: [1, -1], text: '2', dx: 20, c: 'y', size: 24 }])] },
      { ask: { type: 'think', q: '三角形 PQR の3辺の長さを求め、面積を「内接円の半径 × 周の長さの半分」で求めよう。',
        hint: 'PQ＝PB＋BQ のように、接線の長さを足す。円 $K$ は三角形 PQR の内接円（半径 1）。',
        ans: 'PQ＝1＋3＝4、QR＝3＋2＝5、RP＝2＋1＝3。面積＝$1\\times\\dfrac{4+5+3}{2}=6$',
        after: '3辺が 3, 4, 5 の直角三角形で、内接円の半径は $\\frac{3+4-5}{2}=1$。座標で出した答えと一致します。' } },
      { say: 'ただしこの見方は、円が三角形の内側にあること（B が辺 PQ 上にあることなど）が前提。$\\angle\\mathrm{AOB},\\ \\angle\\mathrm{BOC},\\ \\angle\\mathrm{COA}$ がどれも $180^\\circ$ 未満なので成り立ちます。',
        add: [{ t: 'p', size: 'xs', text: '$90^\\circ+(\\text{約}143^\\circ)+(\\text{約}127^\\circ)=360^\\circ$（内積が負の角は鈍角）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。接線は内積で、交点は係数を決めて、距離は2乗して内積で。ベクトルの基本の組み合わせで解ける問題です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
