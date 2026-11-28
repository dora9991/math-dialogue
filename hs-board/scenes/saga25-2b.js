/* 2025 佐賀大 理系 第2問の類題②（自作）：数学C 空間ベクトル ― PA²=2PB² の球面と、2次の項を消して1次式の最大・最小
   元の問題はうつしていない（「球面の方程式」「点のとり方によらず一定になるベクトルを決める」「球面の条件で2次の項を消して
   内積・距離の2乗の和の最大・最小」というねらいと形式だけを合わせた自作問題。類題①の直径の両はしではなく、距離の2乗の比で球面を決める形）。
   A(2,1,−2)、B(0,1,0)。答え（python3・sympy と数値で検算ずみ）：
   (1) PA²=2PB² ⇔ x²+y²+z²+4x−2y−4z−7=0 ⇔ (x+2)²+(y−1)²+(z−2)²=16：中心 C(−2,1,2)（C=2B−A、A,B,C は一直線）、半径 4
   (2) 6点 C±4e を代入 → n=(−4,2,4)、k=7（必要）。(1) の式そのものなので十分
   (3) q=(−2,2,1)（|q|=3）：p·q = c·q + CP·q ≦ 8+4·3 = 20（P(−14/3,11/3,10/3)）、最小は 8−12=−4
       E(−1,0,1)、F(−1,0,2)：PE²+PF² = 2|p|²−2(e+f)·p+7 = 2(n·p+7)−2(−2,0,3)·p+7 = 2 p·q+21。最小 2(−4)+21=13（P(2/3,−5/3,2/3)）、最大 2·20+21=61
       別の見方：M(−1,0,3/2)、CM=3/2（M は球の内部）、PE²+PF²=2PM²+EF²/2=2PM²+1/2 ≧ 2(4−3/2)²+1/2=13。数値（球面上40万点）でも最小 13.00002、最大 60.99999 */
(function () {
  const POINTS = [
    '$\\mathrm{PA}^2=2\\,\\mathrm{PB}^2$ は成分で展開して平方完成。**2点からの距離の比が一定** の点は、平面では円、空間では球面（中心は直線 AB 上）',
    '「すべての P で成り立つ」ものを決めるときは、**特別な点を代入して必要条件 → 十分性の確認** までが答案',
    '球面上では $|\\vec p|^2$ を **1次式に置きかえられる**。2次の項が消えれば、内積 $\\vec p\\cdot\\vec q$ の最大・最小（$\\vec q$ の向きに半径ぶん）に帰着'
  ];
  // ---- 見取図（正射影：x 軸は左下、y 軸は右、z 軸は上） ----
  const nrm = v => { const L = Math.hypot(...v); return v.map(c => c / L); };
  const V = nrm([1, 0.45, 0.4]), E1 = nrm([-V[1], V[0], 0]), E2 = [V[1] * E1[2] - V[2] * E1[1], V[2] * E1[0] - V[0] * E1[2], V[0] * E1[1] - V[1] * E1[0]];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const f4 = v => v.toFixed(4), A3 = [2, 1, -2], B3 = [0, 1, 0], C3 = [-2, 1, 2], P0 = [-2, 5, 2], Cp = pj(C3), R = 4;
  const t0 = Math.atan2(V[1], V[0]);
  const eq = (a, b, dash) => ({ k: 'param', x: `${f4(Cp[0])}+${R}*cos(t)*${f4(E1[0])}+${R}*sin(t)*${f4(E1[1])}`, y: `${f4(Cp[1])}+${R}*cos(t)*${f4(E2[0])}+${R}*sin(t)*${f4(E2[1])}`, a, b, c: 'b', dash, wd: 2 });
  const sph = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-3.4, -3.4, 6.6, 6.8], w: Math.round((h || 440) * 10 / 10.2), h: h || 440, items: [
    { k: 'vec', a: pj([0, 0, 0]), b: pj([3.5, 0, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 4.5, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 0, 4]), c: 'd', wd: 2 },
    { k: 'label', at: pj([3.5, 0, 0]), text: 'x', dx: -14, dy: 10, c: 'd' }, { k: 'label', at: pj([0, 4.5, 0]), text: 'y', dy: 20, c: 'd' }, { k: 'label', at: pj([0, 0, 4]), text: 'z', dx: 16, c: 'd' },
    { k: 'label', at: [0, 0], text: 'O', dx: -16, dy: 8, c: 'd', size: 22 },
    { k: 'circle', o: Cp, r: R, c: 'b', wd: 3 }, eq(t0 - Math.PI / 2, t0 + Math.PI / 2, false), eq(t0 + Math.PI / 2, t0 + 3 * Math.PI / 2, true),
    { k: 'seg', a: pj(A3), b: pj(C3), c: 'w', wd: 2, dash: true },
    { k: 'pt', at: pj(A3), name: 'A', dir: 'se', c: 'w' }, { k: 'pt', at: pj(B3), name: 'B', dir: 'se', c: 'w' }, { k: 'pt', at: Cp, name: 'C', dir: 'ne', c: 'g', r: 5 }].concat(extra || []) });
  const PA0 = [{ k: 'seg', a: pj(P0), b: pj(A3), c: 'y', wd: 3 }, { k: 'seg', a: pj(P0), b: pj(B3), c: 'p', wd: 3 },
    { k: 'pt', at: pj(P0), name: 'P', dir: 'ne', c: 'y' }];
  // ---- (3) の断面のイメージ（C を通り q に平行な平面で切った図） ----
  const cut = (id, extra) => ({ t: 'fig', id, col: 1, view: [-5.3, -5, 6.3, 5.2], w: 480, h: Math.round(480 * 10.2 / 11.6), items: [
    { k: 'circle', o: [0, 0], r: 4, c: 'b', wd: 3 }, { k: 'pt', at: [0, 0], name: 'C', dir: 'sw', c: 'g', r: 5 },
    { k: 'seg', a: [-1.7, -4.5], b: [-1.7, 4.4], dash: true, c: 'd', wd: 2 }, { k: 'seg', a: [1.7, -4.5], b: [1.7, 4.4], dash: true, c: 'd', wd: 2 }, { k: 'seg', a: [4, -4.5], b: [4, 4.4], c: 'p', wd: 3 },
    { k: 'vec', a: [0, 0], b: [4, 0], c: 'g', wd: 3 }, { k: 'label', at: [2.1, 0], text: '4', dy: 22, c: 'g', size: 24 },
    { k: 'vec', a: [-5.1, -4.5], b: [-3.4, -4.5], c: 'y', wd: 3 }, { k: 'label', at: [-5.1, -4.5], text: 'q の向き', anchor: 'start', dy: -22, c: 'y', size: 22 },
    { k: 'pt', at: [4, 0], name: 'P', dir: 'ne', c: 'p' },
    { k: 'label', at: [4.2, 4.7], text: 'p·q 最大', c: 'p', size: 22 },
    { k: 'label', at: [0, 4.7], text: 'p·q = 一定 の面', c: 'd', size: 21 }].concat(extra || []) });

  HB.lesson({
    id: 'saga25-2b', field: '佐賀大型　数学（理系）', title: '2025 佐賀大 理系 第2問の類題② ― 距離の2乗の比で決まる球面と内積の最大・最小', level: '2025年度 佐賀大学 理系 第2問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '座標空間に 2 点 A$(2,\\ 1,\\ -2)$、B$(0,\\ 1,\\ 0)$ がある。$\\mathrm{PA}^2=2\\,\\mathrm{PB}^2$ をみたす点 P 全体の集合を $S$ とする。O は原点とする。',
      parts: [
        '(1)　$S$ は球面であることを示し、その方程式を求めよ。また、$S$ の中心の座標と半径を求めよ。',
        '(2)　$S$ 上のすべての点 P に対して $|\\overrightarrow{\\mathrm{OP}}|^2=\\overrightarrow{\\mathrm{OP}}\\cdot\\vec n+k$ が成り立つような、ベクトル $\\vec n$ と実数 $k$ を求めよ。',
        '(3)　3 点 Q$(-2,\\ 2,\\ 1)$、E$(-1,\\ 0,\\ 1)$、F$(-1,\\ 0,\\ 2)$ をとる。点 P が $S$ 上を動くとき、内積 $\\overrightarrow{\\mathrm{OP}}\\cdot\\overrightarrow{\\mathrm{OQ}}$ の最大値と、$\\mathrm{PE}^2+\\mathrm{PF}^2$ の最小値を求めよ。'
      ],
      src: '※ 2025年度 佐賀大学 前期 理系 第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルと球面の問題です。(1) で球面を求め、(2) でその性質を式にし、(3) で最大値・最小値に使います。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$\\mathrm{PA}^2=2\\,\\mathrm{PB}^2$ は、A からの距離が B からの距離の $\\sqrt2$ 倍になる点 P。平面なら「距離の比が一定の円」、空間では **球面** になります。',
        add: [{ t: 'h', text: '読みかえ' },
          { t: 'p', size: 'sm', text: '$\\mathrm{PA}^2=2\\,\\mathrm{PB}^2$ ⇔ $\\mathrm{PA}:\\mathrm{PB}=\\sqrt2:1$\n→ 距離の比が一定の点の集まり（球面の予想）' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) 成分で展開 → 平方完成\n(2) 特別な点で必要条件 → 十分性\n(3) $|\\vec p|^2$ を (2) で1次式に' },
          sph('s0', PA0)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。P$(x,\\ y,\\ z)$ とおいて、$\\mathrm{PA}^2$ と $2\\,\\mathrm{PB}^2$ を座標で書きます。両方展開して、移項します。',
        add: [{ t: 'h', text: '(1)　S の方程式' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PA}^2=(x-2)^2+(y-1)^2+(z+2)^2' },
          { t: 'm', size: 'sm', tex: '2\\,\\mathrm{PB}^2=2\\{x^2+(y-1)^2+z^2\\}' },
          sph('s1', PA0)] },
      { ask: { type: 'choice', q: '$\\mathrm{PA}^2=2\\,\\mathrm{PB}^2$ を整理すると？（$x^2$ の係数を 1 にそろえる）',
        opts: ['$x^2+y^2+z^2-4x+2y+4z-7=0$', '$x^2+y^2+z^2+4x-2y-4z-7=0$', '$x^2+y^2+z^2+4x-2y-4z+9=0$', '$x^2+y^2+z^2+4x+2y-4z-7=0$'], ok: 1,
        why: { 0: '右辺−左辺で整理すると、1次の項の符号が逆になります。$2\\mathrm{PB}^2-\\mathrm{PA}^2$ を計算します。', 2: '右辺の 2 倍を定数項にもかけます。$2\\cdot1-(1+4+4)=-7$。', 3: '$y$ の項は $-4y-(-2y)$ の符号に注意。$-2y$ です。' },
        good: '$2\\mathrm{PB}^2-\\mathrm{PA}^2=x^2+y^2+z^2+4x-2y-4z-7=0$。',
        add: [{ t: 'm', size: 'sm', tex: 'x^2+y^2+z^2+4x-2y-4z-7=0' }] } },
      { say: '平方完成すると $(x+2)^2+(y-1)^2+(z-2)^2=16$。中心 $(-2,\\ 1,\\ 2)$、半径 4 の球面です。中心 C は $\\overrightarrow{\\mathrm{OC}}=2\\overrightarrow{\\mathrm{OB}}-\\overrightarrow{\\mathrm{OA}}$、つまり A, B, C は一直線です。',
        add: [{ t: 'm', size: 'sm', tex: '(x+2)^2+(y-1)^2+(z-2)^2=16' },
          { t: 'ans', label: '(1) 答', text: '$x^2+y^2+z^2+4x-2y-4z-7=0$\n中心 C$(-2,\\ 1,\\ 2)$、半径 $4$' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '以下、位置ベクトルを $\\vec p=\\overrightarrow{\\mathrm{OP}}$ と書きます。(2) は「$S$ 上の **すべての** P で成り立つ」$\\vec n$ と $k$ を決める問題です。',
        add: [{ t: 'h', text: '(2)　すべての P で成り立つ n, k' },
          { t: 'm', tex: '|\\vec p|^2=\\vec p\\cdot\\vec n+k\\qquad(\\vec n=(\\alpha,\\ \\beta,\\ \\gamma))' },
          { t: 'box', c: 'y', size: 'sm', label: '必要 → 十分', text: '① 特別な点を代入 → 候補をしぼる（必要条件）\n② すべての P で成り立つか確かめる（十分性）' }] },
      { say: '代入しやすいのは、中心 C から各軸の向きに ±4 進んだ6点です。それぞれの $|\\vec p|^2$ も計算しておきます。',
        add: [{ t: 'tbl', col: 1, size: 'sm', cls: 'rowh', rows: [['S 上の点', '$|\\vec p|^2$'], ['$(2,\\ 1,\\ 2)$', '9'], ['$(-6,\\ 1,\\ 2)$', '41'], ['$(-2,\\ 5,\\ 2)$', '33'], ['$(-2,\\ -3,\\ 2)$', '17'], ['$(-2,\\ 1,\\ 6)$', '41'], ['$(-2,\\ 1,\\ -2)$', '9']] }] },
      { ask: { type: 'choice', q: '$(2,\\ 1,\\ 2)$ と $(-6,\\ 1,\\ 2)$ を代入した2式を引き算すると、$\\alpha$ は？',
        opts: ['$\\alpha=4$', '$\\alpha=-4$', '$\\alpha=-2$', '$\\alpha=-32$'], ok: 1,
        why: { 0: '引く順番が逆で符号が反対に。$9-41=8\\alpha$ なので負になります。', 2: '中心の $x$ 座標 $-2$ と混同しています。$-32=8\\alpha$ を解きます。', 3: '$8\\alpha=-32$ の 8 で割り忘れです。' },
        good: '$9=2\\alpha+\\beta+2\\gamma+k,\\ 41=-6\\alpha+\\beta+2\\gamma+k$ を引くと $-32=8\\alpha$、$\\alpha=-4$。',
        add: [{ t: 'm', size: 'sm', tex: '9-41=8\\alpha\\qquad\\therefore\\ \\alpha=-4' }] } },
      { say: '同じように、$y$ 方向の2点から $33-17=8\\beta$ で $\\beta=2$、$z$ 方向の2点から $41-9=8\\gamma$ で $\\gamma=4$。最後に1点を入れて $k=7$。',
        add: [{ t: 'm', size: 'sm', tex: '33-17=8\\beta\\ \\Rightarrow\\ \\beta=2,\\qquad 41-9=8\\gamma\\ \\Rightarrow\\ \\gamma=4' },
          { t: 'm', size: 'sm', tex: '9=-8+2+8+k\\ \\Rightarrow\\ k=7', note: '必要条件' }] },
      { ask: { type: 'choice', q: '答案として、このあと **必ず書くこと** は？',
        opts: ['6点以外では成り立たないことの確認', '$|\\vec n|=1$ であることの確認', '$k>0$ であることの確認', 'すべての P で成り立つことの確認'], ok: 3,
        why: { 0: 'ほかの点でも成り立ってほしいのです。確かめるのは「すべての点で成り立つ」こと。', 1: '$\\vec n$ の大きさに条件はありません。', 2: '$k$ の符号に条件はありません。' },
        good: '6点だけでは必要条件。$|\\vec p|^2=-4x+2y+4z+7$ は (1) の式そのものなので十分です。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec p\\cdot(-4,\\ 2,\\ 4)+7=-4x+2y+4z+7=x^2+y^2+z^2', note: '(1) より\n十分' }] } },
      { say: '必要条件と十分性がそろったので、(2) の答えです。こうして「球面上では $|\\vec p|^2$ が1次式で書ける」ことがわかりました。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\vec n=(-4,\\ 2,\\ 4),\\quad k=7' }] },

      // ---------- (3) 前半 ----------
      { clear: true, part: '(3) 前半', say: '(3) の前半。$\\vec q=\\overrightarrow{\\mathrm{OQ}}=(-2,\\ 2,\\ 1)$、$|\\vec q|=3$ です。$\\vec p=\\vec c+\\overrightarrow{\\mathrm{CP}}$ と、中心 C を経由して分けます。',
        add: [{ t: 'h', text: '(3)　内積 p·q の最大値' },
          { t: 'm', size: 'sm', tex: '\\vec p\\cdot\\vec q=\\vec c\\cdot\\vec q+\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q' },
          { t: 'm', size: 'sm', tex: '\\vec c\\cdot\\vec q=(-2)(-2)+1\\cdot2+2\\cdot1=8', note: '一定' },
          cut('c1')] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{CP}}|=4$ のとき、$\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q$ の最大値は？',
        opts: ['$3$', '$12$', '$4$', '$20$'], ok: 1,
        why: { 0: '$|\\overrightarrow{\\mathrm{CP}}|=4$ をかけ忘れています。', 2: '$|\\vec q|=3$ をかけ忘れています。', 3: 'それは $\\vec p\\cdot\\vec q$ 全体の最大値。この部分だけなら 12 です。' },
        good: '$\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q=4\\cdot3\\cos\\theta\\leqq12$。等号は $\\overrightarrow{\\mathrm{CP}}$ が $\\vec q$ と同じ向き（$\\theta=0$）のとき。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q=|\\overrightarrow{\\mathrm{CP}}||\\vec q|\\cos\\theta\\leqq4\\cdot3=12' }] } },
      { say: '等号は $\\overrightarrow{\\mathrm{CP}}=\\dfrac43\\vec q$ のとき、つまり P$\\left(-\\dfrac{14}3,\\ \\dfrac{11}3,\\ \\dfrac{10}3\\right)$。図のように、$\\vec q$ に垂直な面が球に接する所で最大です。反対向きなら最小で $8-12=-4$。',
        add: [{ t: 'ans', label: '(3) 前半', text: '最大値 $8+12=20$\n（$\\overrightarrow{\\mathrm{CP}}$ が $\\vec q$ と同じ向きのとき）' }] },

      // ---------- (3) 後半 ----------
      { clear: true, cols: [0.6, 0.4], part: '(3) 後半', say: '後半です。$\\mathrm{PE}^2+\\mathrm{PF}^2=|\\vec p-\\vec e|^2+|\\vec p-\\vec f|^2$ を展開すると、$|\\vec p|^2$ が2つ出てきます。',
        add: [{ t: 'h', text: '(3)　PE² + PF² の最小値' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PE}^2+\\mathrm{PF}^2=2|\\vec p|^2-2(\\vec e+\\vec f)\\cdot\\vec p+|\\vec e|^2+|\\vec f|^2' },
          { t: 'p', size: 'sm', text: '$\\vec e+\\vec f=(-2,\\ 0,\\ 3)$、$|\\vec e|^2+|\\vec f|^2=2+5=7$' },
          { t: 'box', c: 'y', size: 'sm', label: '(2) を使う', text: '$|\\vec p|^2=\\vec p\\cdot(-4,\\ 2,\\ 4)+7$ で **2次の項を消す**' }] },
      { ask: { type: 'choice', q: '(2) を使って整理すると、$\\mathrm{PE}^2+\\mathrm{PF}^2$ は？',
        opts: ['$2\\,\\vec p\\cdot\\vec q+14$', '$2\\,\\vec p\\cdot\\vec q+7$', '$2\\,\\vec p\\cdot\\vec q+21$', '$4\\,\\vec p\\cdot\\vec q+21$'], ok: 2,
        why: { 0: '$|\\vec e|^2+|\\vec f|^2=7$ を足し忘れています。', 1: '$2|\\vec p|^2$ から出る $2k=14$ を入れ忘れています。', 3: '$(-4,\\ 4,\\ 2)=2(-2,\\ 2,\\ 1)$。くくり出す数は 2 です。' },
        good: '$2\\{\\vec p\\cdot(-4,2,4)+7\\}-2\\vec p\\cdot(-2,0,3)+7=\\vec p\\cdot(-4,4,2)+21$。',
        add: [{ t: 'm', size: 'sm', tex: '=\\vec p\\cdot(-4,\\ 4,\\ 2)+21=2\\,\\vec p\\cdot\\vec q+21' }] } },
      { say: '2次の項が消えて、前半の内積 $\\vec p\\cdot\\vec q$ の1次式になりました。今度は **最小値** なので、$\\vec p\\cdot\\vec q$ が最小の $-4$ のときを考えます。',
        add: [{ t: 'p', size: 'sm', text: '$\\vec p\\cdot\\vec q$ の範囲：$-4\\leqq\\vec p\\cdot\\vec q\\leqq20$' }] },
      { ask: { type: 'choice', q: '$\\mathrm{PE}^2+\\mathrm{PF}^2$ の最小値は？',
        opts: ['$2\\cdot20+21=61$', '$2\\cdot8+21=37$', '$2\\cdot(-12)+21=-3$', '$2\\cdot(-4)+21=13$'], ok: 3,
        why: { 0: 'それは最大値です。', 1: '$8$ は $\\vec c\\cdot\\vec q$ だけの値。最小は $8-12=-4$ のとき。', 2: '$-12$ に $\\vec c\\cdot\\vec q=8$ を足し忘れています。' },
        good: '$\\vec p\\cdot\\vec q=-4$（$\\overrightarrow{\\mathrm{CP}}=-\\frac43\\vec q$、P$\\left(\\frac23,\\ -\\frac53,\\ \\frac23\\right)$）のとき $2(-4)+21=13$。',
        add: [{ t: 'ans', label: '(3) 後半', text: '最小値 $2\\cdot(-4)+21=13$' },
          { t: 'p', col: 1, size: 'sm', text: '確かめ：P$\\left(\\frac23,\\ -\\frac53,\\ \\frac23\\right)$ で\n$\\mathrm{PE}^2=\\frac{25+25+1}{9}=\\frac{51}9$\n$\\mathrm{PF}^2=\\frac{25+25+16}{9}=\\frac{66}9$\n和 $=\\frac{117}9=13$ ✓' }] } },
      { ask: { type: 'think', q: '別の見方：EF の中点を M とすると $\\mathrm{PE}^2+\\mathrm{PF}^2=2\\mathrm{PM}^2+\\dfrac{\\mathrm{EF}^2}{2}$（中線定理）。これで 13 を確かめよう。',
        hint: 'M$\\left(-1,\\ 0,\\ \\frac32\\right)$、CM $=\\left|\\left(1,\\ -1,\\ -\\frac12\\right)\\right|$。M は球の内部にある。PM が最小になるのは、P が C から M の向きにある球面上のとき。',
        ans: 'CM $=\\dfrac32$、PM の最小は $4-\\dfrac32=\\dfrac52$、EF$^2=1$ より　$2\\cdot\\dfrac{25}4+\\dfrac12=13$',
        after: 'どちらの方法でも最小値は 13。図形の見方は検算に便利です。' } },
      { ask: { type: 'think', q: '$\\mathrm{PE}^2+\\mathrm{PF}^2$ の **最大値** は？',
        hint: '$2\\,\\vec p\\cdot\\vec q+21$ で、$\\vec p\\cdot\\vec q$ の最大は 20。',
        ans: '$2\\cdot20+21=61$　（P$\\left(-\\dfrac{14}3,\\ \\dfrac{11}3,\\ \\dfrac{10}3\\right)$ のとき）',
        after: '1次式にできれば、最大も最小も同じ考え方で出せます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。球面の上では、2乗の量を1次式に置きかえられる。これがこの問題の中心のアイデアです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
