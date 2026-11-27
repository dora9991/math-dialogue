/* 熊大型 数学（理系）：2024年度 熊本大学 前期 理系（数学②）第2問の類題②（自作問題・元の問題ではない）
   元の問題はうつしていない（「円の接線の交点を内積で表す → 3点の1次関係から内積 → 距離・面積」というねらいと形式だけを合わせた自作問題）。
   類題①（単位円、3a+4b+5c=0）とは、円の半径（①は 1、②は 2 で一般の r の式になる）・1次関係（5a+12b+13c=0）・数値がちがう。
   問題：原点中心・半径 2 の円 K。K 上の 2 点 A, B の接線の交点 P：OP=4(a+b)/(4+a·b) を示す。5OA+12OB+13OC=0 のとき内積・OP,OQ,OR・面積。
   答え（python3・sympy で検算ずみ）：
     (1) P·a=P·b=4（|a|=|b|=2）、P=sa+tb、s=t=4/(4+k)（k=a·b≠±4）。|OP|²=32/(4+k)
     (2) a·b=0、b·c=−48/13、c·a=−20/13。OP=2√2、OQ=2√26、OR=√13
     (3) a=(2,0), b=(0,2) とおくと c=(−10/13,−24/13)、P(2,2)、Q(−10,2)、R(2,−3)。PQ=12、PR=5、QR=13、面積 30
     （別解：接線の長さ 2, 10, 3、内接円の半径 2、面積＝2×30/2＝30） */
(function () {
  const rad = d => d * Math.PI / 180, U = d => [2 * Math.cos(rad(d)), 2 * Math.sin(rad(d))];
  // (1) の図：A は偏角 −25°、B は 75°（一般の位置）。半径 2
  const A1 = U(-25), B1 = U(75), k1 = A1[0] * B1[0] + A1[1] * B1[1];
  const P1 = [4 * (A1[0] + B1[0]) / (4 + k1), 4 * (A1[1] + B1[1]) / (4 + k1)];
  const tanLine = (d, s1, s2, c) => { const p = U(d), v = [-Math.sin(rad(d)), Math.cos(rad(d))]; return { k: 'seg', a: [p[0] + v[0] * s1, p[1] + v[1] * s1], b: [p[0] + v[0] * s2, p[1] + v[1] * s2], c: c || 'b', wd: 2.5 }; };
  const endPt = (d, s) => { const p = U(d), v = [-Math.sin(rad(d)), Math.cos(rad(d))]; return [p[0] + v[0] * s, p[1] + v[1] * s]; };
  const eA = endPt(-25, -1.7), eB = endPt(75, 1.7);
  const fig1 = (id, extra) => ({ t: 'fig', id, col: 1, view: [-3.2, -3.2, 4.6, 3.3], w: 450, h: 375, items: [
    { k: 'circle', o: [0, 0], r: 2, c: 'd', wd: 2.5 },
    { k: 'vec', a: [0, 0], b: A1, c: 'y' }, { k: 'vec', a: [0, 0], b: B1, c: 'y' },
    { k: 'label', at: [A1[0] / 2, A1[1] / 2], text: 'a', vec: true, c: 'y', size: 24, dy: 22 }, { k: 'label', at: [B1[0] / 2, B1[1] / 2], text: 'b', vec: true, c: 'y', size: 24, dx: -20 },
    tanLine(-25, -1.7, 3.0), tanLine(75, -3.0, 1.7),
    { k: 'right', o: A1, a: [0, 0], b: P1, s: 13 }, { k: 'right', o: B1, a: [0, 0], b: P1, s: 13 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', c: 'w', r: 4 },
    { k: 'pt', at: A1, name: 'A', dir: 'se', c: 'y' }, { k: 'pt', at: B1, name: 'B', dir: 'nw', c: 'y' },
    { k: 'pt', at: P1, name: 'P', dir: 'e', c: 'p' },
    { k: 'label', at: eA, text: 'ℓ', c: 'b', size: 24, dx: 22, dy: 10 }, { k: 'label', at: eA, text: 'A', c: 'b', size: 16, dx: 34, dy: 18, plain: true },
    { k: 'label', at: eB, text: 'ℓ', c: 'b', size: 24, dx: -22, dy: -10 }, { k: 'label', at: eB, text: 'B', c: 'b', size: 16, dx: -10, dy: -2, plain: true }
  ].concat(extra || []) });
  // (2)(3) の図：a=(2,0)、b=(0,2)、c=(−10/13,−24/13)、P(2,2)、Q(−10,2)、R(2,−3)
  const A = [2, 0], B = [0, 2], C = [-10 / 13, -24 / 13], P = [2, 2], Q = [-10, 2], R = [2, -3];
  const fig2 = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-11.6, -4.4, 3.8, 3.4], w: w || 540, h: Math.round((w || 540) * 7.8 / 15.4), items: [
    { k: 'poly', pts: [P, Q, R], close: true, fill: 'p', alpha: 0.12, c: 'p', wd: 2.5 },
    { k: 'circle', o: [0, 0], r: 2, c: 'd', wd: 2.5 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', c: 'w', r: 4, size: 22 },
    { k: 'pt', at: A, name: 'A', dir: 'sw', c: 'y', size: 24 }, { k: 'pt', at: B, name: 'B', dir: 's', c: 'y', size: 24 }, { k: 'pt', at: C, name: 'C', dir: 'sw', c: 'y', size: 24 },
    { k: 'pt', at: P, name: 'P', dir: 'ne', c: 'p' }, { k: 'pt', at: Q, name: 'Q', dir: 'nw', c: 'p' }, { k: 'pt', at: R, name: 'R', dir: 'se', c: 'p' }
  ].concat(extra || []) });

  const POINTS = [
    '円の接線は「半径に垂直」。ベクトルでは、接点 A の接線上の点 X は $\\overrightarrow{\\mathrm{OX}}\\cdot\\vec a=|\\vec a|^2$（半径 $r$ の円なら $=r^2$）',
    '交点は $s\\vec a+t\\vec b$ とおいて条件を内積で書き、係数を決める。割る前に $4+\\vec a\\cdot\\vec b\\neq0$ などを確かめる',
    '$5\\vec a+12\\vec b+13\\vec c=\\vec0$ からは「1つを移項して2乗」で内積が出る。距離は $|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{2r^4}{r^2+\\vec a\\cdot\\vec b}$'
  ];

  HB.lesson({
    id: 'kuma24-2b', field: '熊大型　数学（理系）', title: '2024 熊大 理系 第2問の類題② ― 半径2の円の接線の交点を内積で表す', level: '2024年度 熊本大学 理系 第2問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '座標平面上に、原点 O を中心とする半径 2 の円 $K$ がある。$K$ 上の点 X における $K$ の接線を $\\ell_{\\mathrm X}$ と書く。',
      parts: [
        '(1)　$K$ 上の 2 点 A, B は、一致せず、直径の両端でもないとする。$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b$ とし、$\\ell_{\\mathrm A}$ と $\\ell_{\\mathrm B}$ の交点を P とする。このとき $\\overrightarrow{\\mathrm{OP}}=\\dfrac{4(\\vec a+\\vec b)}{4+\\vec a\\cdot\\vec b}$ であることを示せ。',
        '(2)　$K$ 上の 3 点 A, B, C が $5\\overrightarrow{\\mathrm{OA}}+12\\overrightarrow{\\mathrm{OB}}+13\\overrightarrow{\\mathrm{OC}}=\\vec 0$ をみたしている。$\\overrightarrow{\\mathrm{OC}}=\\vec c$ とする。内積 $\\vec a\\cdot\\vec b,\\ \\vec b\\cdot\\vec c,\\ \\vec c\\cdot\\vec a$ を求めよ。また、$\\ell_{\\mathrm A}$ と $\\ell_{\\mathrm B}$、$\\ell_{\\mathrm B}$ と $\\ell_{\\mathrm C}$、$\\ell_{\\mathrm C}$ と $\\ell_{\\mathrm A}$ の交点をそれぞれ P, Q, R とするとき、OP, OQ, OR を求めよ。',
        '(3)　(2) のとき、三角形 PQR の面積を求めよ。'
      ],
      src: '※ 2024年度 熊本大学 前期 理系（数学②）第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '円の接線の交点を、ベクトルと内積で表す問題です。今回は半径が 2。(1) は証明、(2)(3) は計算で、(1) ができなくても (2) からは進めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '円の接線は、接点を通る半径に垂直。ベクトルで書くと、$\\ell_{\\mathrm A}$ 上の点 X は $(\\overrightarrow{\\mathrm{OX}}-\\vec a)\\cdot\\vec a=0$ をみたします。',
        add: [{ t: 'h', text: '読みかえ：接線を内積で書く' },
          { t: 'box', c: 'b', size: 'sm', label: '接線の条件', text: 'X が $\\ell_{\\mathrm A}$ 上 $\\iff$ $\\overrightarrow{\\mathrm{AX}}\\perp\\vec a$ または X＝A\n$\\iff(\\overrightarrow{\\mathrm{OX}}-\\vec a)\\cdot\\vec a=0$' },
          fig1('k1')] },
      { ask: { type: 'choice', q: 'P は $\\ell_{\\mathrm A}$ 上の点。$\\vec p=\\overrightarrow{\\mathrm{OP}}$ として、これを内積で書くと？（$|\\vec a|=2$）',
        opts: ['$\\vec p\\cdot\\vec a=0$', '$\\vec p\\cdot\\vec a=2$', '$\\vec p\\cdot\\vec b=4$', '$\\vec p\\cdot\\vec a=4$'], ok: 3,
        why: { 0: '垂直なのは $\\vec p-\\vec a$ と $\\vec a$。展開すると $\\vec p\\cdot\\vec a=|\\vec a|^2$ です。', 1: '$|\\vec a|^2=2^2=4$。半径の 2 ではなく、その2乗です。', 2: 'それは P が $\\ell_{\\mathrm B}$ 上にある条件です（これも使います）。' },
        good: '$(\\vec p-\\vec a)\\cdot\\vec a=0$ より $\\vec p\\cdot\\vec a=|\\vec a|^2=4$。同じく $\\ell_{\\mathrm B}$ 上なので $\\vec p\\cdot\\vec b=4$。',
        add: [{ t: 'm', tex: '\\vec p\\cdot\\vec a=4,\\qquad \\vec p\\cdot\\vec b=4', note: '$\\vec p=\\overrightarrow{\\mathrm{OP}}$' }] } },

      // ---------- (1) 答案 ----------
      { clear: true, part: '(1)', say: 'A, B は一致せず直径の両端でもないので、$\\vec a,\\ \\vec b$ は平行でない（1次独立）。だから $\\vec p=s\\vec a+t\\vec b$ と表せます。$k=\\vec a\\cdot\\vec b$ とおいて代入。',
        add: [{ t: 'h', text: '(1)　答案' },
          { t: 'm', size: 'sm', tex: '\\vec p=s\\vec a+t\\vec b\\quad(s,\\ t\\ \\text{は実数})', note: '$k=\\vec a\\cdot\\vec b$' },
          { t: 'm', size: 'sm', tex: '\\begin{cases} \\vec p\\cdot\\vec a=4s+tk=4\\\\ \\vec p\\cdot\\vec b=sk+4t=4\\end{cases}', note: '$|\\vec a|^2=|\\vec b|^2=4$' },
          fig1('k2')] },
      { ask: { type: 'choice', q: 'この連立方程式を解くと？',
        opts: ['$s=t=\\dfrac1{4+k}$', '$s=t=\\dfrac4{4-k}$', '$s=t=\\dfrac4{4+k}$', '$s+t=1$ だけが言える'], ok: 2,
        why: { 0: '代入すると $s(4+k)=4$。右辺の 4 を忘れています。', 1: '2式を引くと $(s-t)(4-k)=0$、足すと $(s+t)(4+k)=8$。分母は $4+k$ です。', 3: '$s+t=1$ は「P が直線 AB 上」の条件。P は AB 上にはありません。' },
        good: '引くと $(s-t)(4-k)=0$。$\\vec a\\neq\\vec b$ より $k\\neq4$ なので $s=t$。代入して $s(4+k)=4$。',
        add: [{ t: 'm', size: 'sm', tex: '(s-t)(4-k)=0\\ \\Rightarrow\\ s=t,\\quad s(4+k)=4', note: '$k\\neq4$ を使う' }] } },
      { say: '割る前に $4+k\\neq0$ を確認。大きさ 2 のベクトルでは $k=-4\\iff\\vec b=-\\vec a$（直径の両端）なので、仮定から $k\\neq-4$。これで (1) が示せました。',
        add: [{ t: 'p', size: 'xs', text: '$|\\vec a|=|\\vec b|=2$ のとき　$\\vec a\\cdot\\vec b=4\\iff\\vec a=\\vec b$，　$\\vec a\\cdot\\vec b=-4\\iff\\vec a=-\\vec b$' },
          { t: 'ans', label: '(1) 示せた', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{4(\\vec a+\\vec b)}{4+\\vec a\\cdot\\vec b}' }] },
      { ask: { type: 'think', q: '(1) の式から、$|\\overrightarrow{\\mathrm{OP}}|^2$ を $k=\\vec a\\cdot\\vec b$ だけで表そう。',
        hint: '$|\\vec a+\\vec b|^2=|\\vec a|^2+2\\,\\vec a\\cdot\\vec b+|\\vec b|^2$ を使う。',
        ans: '$|\\vec a+\\vec b|^2=8+2k$ なので　$|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{16(8+2k)}{(4+k)^2}=\\dfrac{32}{4+k}$',
        after: '交点までの距離は、内積だけで決まります。半径が $r$ なら $\\dfrac{2r^4}{r^2+k}$。(2) でこの式を使います。',
        add: [{ t: 'box', c: 'y', col: 1, size: 'sm', label: '距離の式', text: '$|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{32}{4+\\vec a\\cdot\\vec b}$' }] } },

      // ---------- (2) 内積 ----------
      { clear: true, part: '(2)', say: '$5\\vec a+12\\vec b+13\\vec c=\\vec0$ から内積を出すコツは、**1つを移項して両辺の大きさを2乗**。$\\vec c$ を移項すると $5\\vec a+12\\vec b=-13\\vec c$。',
        add: [{ t: 'h', text: '(2)　内積を求める' },
          { t: 'm', tex: '5\\vec a+12\\vec b=-13\\vec c', note: '両辺の大きさを2乗' },
          { t: 'm', size: 'sm', tex: '25|\\vec a|^2+120\\,\\vec a\\cdot\\vec b+144|\\vec b|^2=169|\\vec c|^2' }] },
      { ask: { type: 'choice', q: '$|\\vec a|^2=|\\vec b|^2=|\\vec c|^2=4$ を入れると、$\\vec a\\cdot\\vec b$ は？',
        opts: ['$-\\dfrac{20}{13}$', '$0$', '$4$', '$-\\dfrac{48}{13}$'], ok: 1,
        why: { 0: 'それは $\\vec c\\cdot\\vec a$ の値です。', 2: '$\\vec a\\cdot\\vec b=4=|\\vec a|^2$ なら A＝B になってしまいます。', 3: 'それは $\\vec b\\cdot\\vec c$ の値です。' },
        good: '$100+120\\,\\vec a\\cdot\\vec b+576=676$ より $\\vec a\\cdot\\vec b=0$。$\\angle\\mathrm{AOB}=90^\\circ$ です。',
        add: [{ t: 'm', tex: '100+120\\,\\vec a\\cdot\\vec b+576=676\\ \\Rightarrow\\ \\vec a\\cdot\\vec b=0' }] } },
      { say: '同じように、$12\\vec b+13\\vec c=-5\\vec a$、$13\\vec c+5\\vec a=-12\\vec b$ の両辺の大きさを2乗します。',
        add: [{ t: 'm', size: 'sm', tex: '576+312\\,\\vec b\\cdot\\vec c+676=100\\ \\Rightarrow\\ \\vec b\\cdot\\vec c=-\\frac{48}{13}' },
          { t: 'm', size: 'sm', tex: '676+130\\,\\vec c\\cdot\\vec a+100=576\\ \\Rightarrow\\ \\vec c\\cdot\\vec a=-\\frac{20}{13}' }] },

      // ---------- (2) 距離 ----------
      { clear: true, say: 'どの内積も $\\pm4$ ではないので、どの2点も一致せず直径の両端でもない。(1) が使えます。距離の式 $|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{32}{4+\\vec a\\cdot\\vec b}$ に入れます。',
        add: [{ t: 'h', text: '(2)　つづき：交点までの距離' },
          { t: 'm', tex: '\\mathrm{OP}^2=\\frac{32}{4+\\vec a\\cdot\\vec b}=\\frac{32}{4+0}=8' }] },
      { ask: { type: 'choice', q: 'OQ（$\\ell_{\\mathrm B}$ と $\\ell_{\\mathrm C}$ の交点まで）は？',
        opts: ['$2\\sqrt{26}$', '$\\sqrt{13}$', '$104$', '$\\dfrac{2\\sqrt{26}}{5}$'], ok: 0,
        why: { 1: 'それは OR（$\\vec c\\cdot\\vec a=-\\frac{20}{13}$ のほう）です。', 2: 'それは $\\mathrm{OQ}^2$。最後に $\\sqrt{\\ }$ をとります。', 3: '$4+\\vec b\\cdot\\vec c=4-\\frac{48}{13}=\\frac{4}{13}$。$4+\\frac{48}{13}$ にしています。' },
        good: '$\\mathrm{OQ}^2=\\dfrac{32}{4-\\frac{48}{13}}=\\dfrac{32}{\\frac4{13}}=104$ より $\\mathrm{OQ}=2\\sqrt{26}$。同じく $\\mathrm{OR}^2=\\dfrac{32}{4-\\frac{20}{13}}=13$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{OQ}^2=\\frac{32}{\\frac4{13}}=104,\\qquad \\mathrm{OR}^2=\\frac{32}{\\frac{32}{13}}=13' }] } },
      { say: '(2) の答えです。右の図は、この3点 A, B, C と接線の交点 P, Q, R。OQ がいちばん長く、図とも合っています。',
        add: [{ t: 'ans', label: '(2) 答', text: '$\\vec a\\cdot\\vec b=0$，　$\\vec b\\cdot\\vec c=-\\dfrac{48}{13}$，　$\\vec c\\cdot\\vec a=-\\dfrac{20}{13}$\n$\\mathrm{OP}=2\\sqrt2$，　$\\mathrm{OQ}=2\\sqrt{26}$，　$\\mathrm{OR}=\\sqrt{13}$' },
          fig2('t1', [{ k: 'seg', a: [0, 0], b: Q, c: 'b', dash: true, wd: 2 }])] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '面積は、座標を入れると見通しがよくなります。$\\vec a\\perp\\vec b$ で大きさ 2 なので、回転や裏返しをして $\\vec a=(2,\\ 0),\\ \\vec b=(0,\\ 2)$ とおけます。',
        add: [{ t: 'h', text: '(3)　三角形 PQR の面積' },
          { t: 'm', size: 'sm', tex: '\\vec a=(2,\\ 0),\\quad \\vec b=(0,\\ 2)', note: '面積は回転・裏返しで\n変わらない' },
          { t: 'm', size: 'sm', tex: '\\vec c=-\\frac{5\\vec a+12\\vec b}{13}=\\Big(-\\frac{10}{13},\\ -\\frac{24}{13}\\Big)' },
          fig2('t2')] },
      { ask: { type: 'choice', q: 'Q の座標は？（$\\overrightarrow{\\mathrm{OQ}}=\\dfrac{4(\\vec b+\\vec c)}{4+\\vec b\\cdot\\vec c}$）',
        opts: ['$\\left(-\\dfrac{10}{13},\\ \\dfrac{2}{13}\\right)$', '$(2,\\ -3)$', '$(-10,\\ 2)$', '$(10,\\ -2)$'], ok: 2,
        why: { 0: 'それは $\\vec b+\\vec c$ だけ。$4$ をかけて、$4+\\vec b\\cdot\\vec c=\\frac4{13}$ で割ります。', 1: 'それは R の座標です。', 3: '符号が逆です。$\\left(-\\frac{10}{13},\\ \\frac{2}{13}\\right)$ に $13$ をかけます。' },
        good: '$\\vec b+\\vec c=\\left(-\\dfrac{10}{13},\\ \\dfrac{2}{13}\\right)$ に $\\dfrac{4}{4/13}=13$ をかけて $(-10,\\ 2)$。$\\mathrm{OQ}=2\\sqrt{26}$ とも合います。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm P(2,\\ 2),\\quad \\mathrm Q(-10,\\ 2),\\quad \\mathrm R(2,\\ -3)' }] } },
      { say: 'PQ は $x$ 軸に平行で長さ 12、PR は $y$ 軸に平行で長さ 5。三角形 PQR は、P が直角の直角三角形です。（$\\vec a\\perp\\vec b$ だから $\\ell_{\\mathrm A}\\perp\\ell_{\\mathrm B}$）',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{PQ}=2-(-10)=12,\\qquad \\mathrm{PR}=2-(-3)=5' }],
        draw: [{ fig: 't2', items: [{ k: 'right', o: P, a: Q, b: R, s: 14, c: 'p' }, { k: 'label', at: [-4, 2], text: '12', dy: -20, c: 'p', size: 24 }, { k: 'label', at: [2, -0.5], text: '5', dx: 20, c: 'p', size: 24 }] }] },
      { ask: { type: 'choice', q: '三角形 PQR の面積は？',
        opts: ['$60$', '$13$', '$78$', '$30$'], ok: 3,
        why: { 0: '$\\frac12$ をかけ忘れています。', 1: '斜辺 QR $=13$ を使っています。直角をはさむ2辺は 12 と 5。', 2: '$\\frac12\\cdot13\\cdot12$ です。QR はななめの辺なので、底辺と高さにはなりません。' },
        good: '$\\dfrac12\\cdot\\mathrm{PQ}\\cdot\\mathrm{PR}=\\dfrac12\\cdot12\\cdot5=30$ です。',
        add: [{ t: 'ans', label: '(3) 答', text: '三角形 PQR の面積は　$30$' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '座標を使わない見方。接線の長さは三平方の定理で出ます。たとえば $\\mathrm{PA}=\\mathrm{PB}=\\sqrt{\\mathrm{OP}^2-4}=2$。',
        add: [{ t: 'h', text: '別の見方：接線の長さと内接円' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PA}=\\mathrm{PB}=\\sqrt{8-4}=2' },
          { t: 'm', size: 'sm', tex: '\\mathrm{QB}=\\mathrm{QC}=\\sqrt{104-4}=10' },
          { t: 'm', size: 'sm', tex: '\\mathrm{RC}=\\mathrm{RA}=\\sqrt{13-4}=3' },
          fig2('t3', [
            { k: 'label', at: [1, 2], text: '2', dy: -20, c: 'y', size: 22 }, { k: 'label', at: [2, 1], text: '2', dx: 20, c: 'y', size: 22 },
            { k: 'label', at: [-5, 2], text: '10', dy: -20, c: 'y', size: 22 }, { k: 'label', at: [-5.8, -0.75], text: '10', c: 'y', size: 22 },
            { k: 'label', at: [0.6, -2.7], text: '3', c: 'y', size: 22 }, { k: 'label', at: [2, -1.5], text: '3', dx: 20, c: 'y', size: 22 }])] },
      { ask: { type: 'think', q: '三角形 PQR の3辺の長さを求め、面積を「内接円の半径 × 周の長さの半分」で求めよう。',
        hint: 'PQ＝PB＋BQ のように、接線の長さを足す。円 $K$ は三角形 PQR の内接円（半径 2）。',
        ans: 'PQ＝2＋10＝12、QR＝10＋3＝13、RP＝3＋2＝5。面積＝$2\\times\\dfrac{12+13+5}{2}=30$',
        after: '3辺が 5, 12, 13 の直角三角形で、内接円の半径は $\\frac{5+12-13}{2}=2$。座標で出した答えと一致します。' } },
      { say: 'ただしこの見方は、円が三角形の内側にあること（B が辺 PQ 上にあることなど）が前提。$\\angle\\mathrm{AOB},\\ \\angle\\mathrm{BOC},\\ \\angle\\mathrm{COA}$ がどれも $180^\\circ$ 未満なので成り立ちます。',
        add: [{ t: 'p', size: 'xs', text: '$90^\\circ+(\\text{約}157^\\circ)+(\\text{約}113^\\circ)=360^\\circ$（内積が負の角は鈍角）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。接線は内積で、交点は係数を決めて、距離は2乗して内積で。半径が 2 でも、$|\\vec a|^2=4$ を使えば同じ流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
