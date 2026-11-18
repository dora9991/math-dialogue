/* 2025 佐賀大 理系 第2問の類題（自作）：数学C 空間ベクトル ― PA·PB=0 の球面と、2次の項を消して1次式の最大値
   元の問題はうつしていない（「球面の方程式」「点のとり方によらず一定になるベクトルを決める」「球面の条件で2次の項を消して
   内積・距離の2乗の和の最大値」というねらいと形式だけを合わせた自作問題。球面は直径の両はし A, B から作る形にした）。
   A(4,0,2)、B(0,2,−2)。答え（python3・sympy と数値で検算ずみ）：
   (1) PA·PB = x²+y²+z²−4x−2y−4 = 0 ⇔ (x−2)²+(y−1)²+z²=9：中心 C(2,1,0)（AB の中点）、半径 3（AB=6）
   (2) 6点 (5,1,0)(−1,1,0)(2,4,0)(2,−2,0)(2,1,±3) を代入 → n=(4,2,0)、k=4（必要）。(1) の式そのものなので十分
   (3) p·q = c·q + CP·q ≦ 4+3·3 = 13（P(3,3,−2)）
       PE²+PF² = 2|p|²−2(e+f)·p+60 = 2(n·p+4)−2(0,−6,8)·p+60 = 8 p·q + 68 ≦ 172（P(3,3,−2)、数値でも最大 171.998…）
       最小は 8(4−9)+68 = 28。別の見方：M(0,−3,4)、CM=6、PE²+PF²=2PM²+EF²/2=2PM²+10 ≦ 2·81+10 = 172 */
(function () {
  const POINTS = [
    '$\\overrightarrow{\\mathrm{PA}}\\cdot\\overrightarrow{\\mathrm{PB}}=0$ は「AB を直径とする球面」。成分で展開して平方完成すれば、中心は AB の中点、半径は $\\frac12$AB',
    '「すべての P で成り立つ」ものを決めるときは、**特別な点を代入して必要条件 → 十分性の確認** までが答案',
    '球面上では $|\\vec p|^2$ を **1次式に置きかえられる**。2次の項が消えれば、内積 $\\vec p\\cdot\\vec q$ の最大（$\\vec q$ の向きに半径ぶん）に帰着'
  ];
  // ---- 見取図（正射影：x 軸は左下、y 軸は右、z 軸は上） ----
  const nrm = v => { const L = Math.hypot(...v); return v.map(c => c / L); };
  const V = nrm([1, 0.45, 0.4]), E1 = nrm([-V[1], V[0], 0]), E2 = [V[1] * E1[2] - V[2] * E1[1], V[2] * E1[0] - V[0] * E1[2], V[0] * E1[1] - V[1] * E1[0]];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const f4 = v => v.toFixed(4), A3 = [4, 0, 2], B3 = [0, 2, -2], C3 = [2, 1, 0], P0 = [0, 3, 1], PM = [3, 3, -2], Cp = pj(C3);
  const t0 = Math.atan2(V[1], V[0]);   // 赤道（z=0）のうち手前に見える半分は t0−π/2 〜 t0+π/2
  const eq = (a, b, dash) => ({ k: 'param', x: `${f4(Cp[0])}+3*cos(t)*${f4(E1[0])}+3*sin(t)*${f4(E1[1])}`, y: `${f4(Cp[1])}+3*cos(t)*${f4(E2[0])}+3*sin(t)*${f4(E2[1])}`, a, b, c: 'b', dash, wd: 2 });
  const sph = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-3.7, -4.2, 5.6, 4.7], w: Math.round((h || 440) * 9.3 / 8.9), h: h || 440, items: [
    { k: 'vec', a: pj([0, 0, 0]), b: pj([7, 0, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 6, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 0, 4.6]), c: 'd', wd: 2 },
    { k: 'label', at: pj([7, 0, 0]), text: 'x', dx: -14, dy: 10, c: 'd' }, { k: 'label', at: pj([0, 6, 0]), text: 'y', dy: 20, c: 'd' }, { k: 'label', at: pj([0, 0, 4.6]), text: 'z', dx: 16, c: 'd' },
    { k: 'label', at: [0, 0], text: 'O', dx: -4, dy: 22, c: 'd', size: 22 },
    { k: 'circle', o: Cp, r: 3, c: 'b', wd: 3 }, eq(t0 - Math.PI / 2, t0 + Math.PI / 2, false), eq(t0 + Math.PI / 2, t0 + 3 * Math.PI / 2, true),
    { k: 'seg', a: pj(A3), b: pj(B3), c: 'w', wd: 2, dash: true },
    { k: 'pt', at: pj(A3), name: 'A', dir: 'nw', c: 'w' }, { k: 'pt', at: pj(B3), name: 'B', dir: 'e', c: 'w' }, { k: 'pt', at: Cp, name: 'C', dir: 'e', c: 'g', r: 5 }].concat(extra || []) });
  const PA0 = [{ k: 'seg', a: pj(P0), b: pj(A3), c: 'y', wd: 3 }, { k: 'seg', a: pj(P0), b: pj(B3), c: 'y', wd: 3 }, { k: 'right', o: pj(P0), a: pj(A3), b: pj(B3), c: 'y' },
    { k: 'pt', at: pj(P0), name: 'P', dir: 'ne', c: 'y' }];
  // ---- (3) の断面のイメージ（C を通り q に平行な平面で切った図） ----
  const cut = (id, extra) => ({ t: 'fig', id, col: 1, view: [-4.4, -4.1, 5.4, 4.3], w: 560, h: Math.round(560 * 8.4 / 9.8), items: [
    { k: 'circle', o: [0, 0], r: 3, c: 'b', wd: 3 }, { k: 'pt', at: [0, 0], name: 'C', dir: 'sw', c: 'g', r: 5 },
    { k: 'seg', a: [-1.3, -3.4], b: [-1.3, 3.3], dash: true, c: 'd', wd: 2 }, { k: 'seg', a: [1.3, -3.4], b: [1.3, 3.3], dash: true, c: 'd', wd: 2 }, { k: 'seg', a: [3, -3.4], b: [3, 3.3], c: 'p', wd: 3 },
    { k: 'vec', a: [0, 0], b: [3, 0], c: 'g', wd: 3 }, { k: 'label', at: [2.15, 0], text: '3', dy: 22, c: 'g', size: 24 },
    { k: 'vec', a: [-4.1, -3.7], b: [-2.4, -3.7], c: 'y', wd: 3 }, { k: 'label', at: [-4.1, -3.7], text: 'q の向き', anchor: 'start', dy: -22, c: 'y', size: 22 },
    { k: 'pt', at: [3, 0], name: 'P', dir: 'e', c: 'p' },
    { k: 'label', at: [3.2, 3.8], text: 'p·q 最大', c: 'p', size: 22 },
    { k: 'label', at: [0, 3.8], text: 'p·q = 一定 の面', c: 'd', size: 21 }].concat(extra || []) });

  HB.lesson({
    id: 'saga25-2', field: '佐賀大型　数学（理系）', title: '2025 佐賀大 理系 第2問の類題 ― 直径の両はしから作る球面と内積の最大', level: '2025年度 佐賀大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 点 A$(4,\\ 0,\\ 2)$、B$(0,\\ 2,\\ -2)$ がある。$\\overrightarrow{\\mathrm{PA}}\\cdot\\overrightarrow{\\mathrm{PB}}=0$ をみたす点 P 全体の集合を $S$ とする。O は原点とする。',
      parts: [
        '(1)　$S$ は球面であることを示し、その方程式を求めよ。また、$S$ の中心の座標と半径を求めよ。',
        '(2)　$S$ 上のすべての点 P に対して $|\\overrightarrow{\\mathrm{OP}}|^2=\\overrightarrow{\\mathrm{OP}}\\cdot\\vec n+k$ が成り立つような、ベクトル $\\vec n$ と実数 $k$ を求めよ。',
        '(3)　3 点 Q$(1,\\ 2,\\ -2)$、E$(1,\\ -1,\\ 4)$、F$(-1,\\ -5,\\ 4)$ をとる。点 P が $S$ 上を動くとき、内積 $\\overrightarrow{\\mathrm{OP}}\\cdot\\overrightarrow{\\mathrm{OQ}}$ の最大値と、$\\mathrm{PE}^2+\\mathrm{PF}^2$ の最大値を求めよ。'
      ],
      src: '※ 2025年度 佐賀大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルと球面の問題です。(1) で球面を求め、(2) でその性質を式にし、(3) で最大値に使います。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$\\overrightarrow{\\mathrm{PA}}\\cdot\\overrightarrow{\\mathrm{PB}}=0$ は、P が A, B と異なれば $\\angle\\mathrm{APB}=90^\\circ$ ということ。平面なら「AB を直径とする円」、空間では **球面** です。',
        add: [{ t: 'h', text: '読みかえ' },
          { t: 'p', size: 'sm', text: '$\\overrightarrow{\\mathrm{PA}}\\cdot\\overrightarrow{\\mathrm{PB}}=0$\n⇔ $\\angle\\mathrm{APB}=90^\\circ$ または P＝A, B\n→ AB を直径とする球面（の予想）' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) 成分で展開 → 平方完成\n(2) 特別な点で必要条件 → 十分性\n(3) $|\\vec p|^2$ を (2) で1次式に' },
          sph('s0', PA0)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。P$(x,\\ y,\\ z)$ とおいて成分で計算します。ベクトルの成分は「終点 − 始点」です。',
        add: [{ t: 'h', text: '(1)　S の方程式' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PA}}=(4-x,\\ -y,\\ 2-z)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PB}}=(-x,\\ 2-y,\\ -2-z)' },
          sph('s1', PA0)] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{PA}}\\cdot\\overrightarrow{\\mathrm{PB}}$ を展開すると？',
        opts: ['$x^2+y^2+z^2-4x-2y+4$', '$x^2+y^2+z^2-4x-2y-4$', '$x^2+y^2+z^2+4x+2y-4$', '$x^2+y^2+z^2-4x-2y-4z$'], ok: 1,
        why: { 0: '$(2-z)(-2-z)=z^2-4$。定数項は $-4$ です。', 2: '$(4-x)(-x)=x^2-4x$。1次の項の符号が逆です。', 3: '$(2-z)(-2-z)$ では $z$ の1次の項は打ち消し合って消えます。' },
        good: '$(4-x)(-x)+(-y)(2-y)+(2-z)(-2-z)=x^2-4x+y^2-2y+z^2-4$。',
        add: [{ t: 'm', size: 'sm', tex: 'x^2+y^2+z^2-4x-2y-4=0' }] } },
      { say: '平方完成すると $(x-2)^2+(y-1)^2+z^2=9$。中心 $(2,\\ 1,\\ 0)$、半径 3 の球面です。中心は AB の中点、AB $=6$ なので半径は $\\frac12$AB。予想どおりです。',
        add: [{ t: 'm', size: 'sm', tex: '(x-2)^2+(y-1)^2+z^2=9' },
          { t: 'ans', label: '(1) 答', text: '$x^2+y^2+z^2-4x-2y-4=0$\n中心 C$(2,\\ 1,\\ 0)$、半径 $3$' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '以下、位置ベクトルを $\\vec p=\\overrightarrow{\\mathrm{OP}}$ と書きます。(2) は「$S$ 上の **すべての** P で成り立つ」$\\vec n$ と $k$ を決める問題です。',
        add: [{ t: 'h', text: '(2)　すべての P で成り立つ n, k' },
          { t: 'm', tex: '|\\vec p|^2=\\vec p\\cdot\\vec n+k\\qquad(\\vec n=(\\alpha,\\ \\beta,\\ \\gamma))' },
          { t: 'box', c: 'y', size: 'sm', label: '必要 → 十分', text: '① 特別な点を代入 → 候補をしぼる（必要条件）\n② すべての P で成り立つか確かめる（十分性）' }] },
      { say: '代入しやすいのは、中心 C から各軸の向きに ±3 進んだ6点です。それぞれの $|\\vec p|^2$ も計算しておきます。',
        add: [{ t: 'tbl', col: 1, size: 'sm', cls: 'rowh', rows: [['S 上の点', '$|\\vec p|^2$'], ['$(5,\\ 1,\\ 0)$', '26'], ['$(-1,\\ 1,\\ 0)$', '2'], ['$(2,\\ 4,\\ 0)$', '20'], ['$(2,\\ -2,\\ 0)$', '8'], ['$(2,\\ 1,\\ 3)$', '14'], ['$(2,\\ 1,\\ -3)$', '14']] }] },
      { ask: { type: 'choice', q: '$(5,\\ 1,\\ 0)$ と $(-1,\\ 1,\\ 0)$ を代入した2式を引き算すると、$\\alpha$ は？',
        opts: ['$\\alpha=2$', '$\\alpha=-4$', '$\\alpha=4$', '$\\alpha=24$'], ok: 2,
        why: { 0: '中心の $x$ 座標 2 と混同しています。$26-2=6\\alpha$ を解きます。', 1: '引く順番がずれて符号が逆に。$(5\\alpha+\\beta+k)-(-\\alpha+\\beta+k)=6\\alpha$。', 3: '$6\\alpha=24$ の 6 で割り忘れです。' },
        good: '$26=5\\alpha+\\beta+k,\\ 2=-\\alpha+\\beta+k$ を引くと $24=6\\alpha$、$\\alpha=4$。',
        add: [{ t: 'm', size: 'sm', tex: '26-2=6\\alpha\\qquad\\therefore\\ \\alpha=4' }] } },
      { say: '同じように、$y$ 方向の2点から $20-8=6\\beta$ で $\\beta=2$、$z$ 方向の2点から $14-14=6\\gamma$ で $\\gamma=0$。最後に1点を入れて $k=4$。',
        add: [{ t: 'm', size: 'sm', tex: '20-8=6\\beta\\ \\Rightarrow\\ \\beta=2,\\qquad 14-14=6\\gamma\\ \\Rightarrow\\ \\gamma=0' },
          { t: 'm', size: 'sm', tex: '26=5\\cdot4+2+k\\ \\Rightarrow\\ k=4', note: '必要条件' }] },
      { ask: { type: 'choice', q: '答案として、このあと **必ず書くこと** は？',
        opts: ['すべての P で成り立つことの確認', '6点以外では成り立たないことの確認', '$|\\vec n|=1$ であることの確認', '$k>0$ であることの確認'], ok: 0,
        why: { 1: 'ほかの点でも成り立ってほしいのです。確かめるのは「すべての点で成り立つ」こと。', 2: '$\\vec n$ の大きさに条件はありません。', 3: '$k$ の符号に条件はありません。' },
        good: '6点だけでは必要条件。$|\\vec p|^2=4x+2y+4$ は (1) の式そのものなので十分です。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec p\\cdot(4,\\ 2,\\ 0)+4=4x+2y+4=x^2+y^2+z^2', note: '(1) より\n十分' }] } },
      { say: '必要条件と十分性がそろったので、(2) の答えです。こうして「球面上では $|\\vec p|^2$ が1次式で書ける」ことがわかりました。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\vec n=(4,\\ 2,\\ 0),\\quad k=4' }] },

      // ---------- (3) 前半 ----------
      { clear: true, part: '(3) 前半', say: '(3) の前半。$\\vec q=\\overrightarrow{\\mathrm{OQ}}=(1,\\ 2,\\ -2)$、$|\\vec q|=3$ です。$\\vec p=\\vec c+\\overrightarrow{\\mathrm{CP}}$ と、中心 C を経由して分けます。',
        add: [{ t: 'h', text: '(3)　内積 p·q の最大値' },
          { t: 'm', size: 'sm', tex: '\\vec p\\cdot\\vec q=\\vec c\\cdot\\vec q+\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q' },
          { t: 'm', size: 'sm', tex: '\\vec c\\cdot\\vec q=2\\cdot1+1\\cdot2+0\\cdot(-2)=4', note: '一定' },
          cut('c1')] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{CP}}|=3$ のとき、$\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q$ の最大値は？',
        opts: ['$3$', '$27$', '$13$', '$9$'], ok: 3,
        why: { 0: '$|\\vec q|=3$ をかけ忘れています。', 1: '$|\\vec q|^2=9$ をかけています。かけるのは $|\\vec q|=3$。', 2: 'それは $\\vec p\\cdot\\vec q$ 全体の最大値。この部分だけなら 9 です。' },
        good: '$\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q=3\\cdot3\\cos\\theta\\leqq9$。等号は $\\overrightarrow{\\mathrm{CP}}$ が $\\vec q$ と同じ向き（$\\theta=0$）のとき。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{CP}}\\cdot\\vec q=|\\overrightarrow{\\mathrm{CP}}||\\vec q|\\cos\\theta\\leqq3\\cdot3=9' }] } },
      { say: '等号は $\\overrightarrow{\\mathrm{CP}}=\\vec q=(1,\\ 2,\\ -2)$ のとき、つまり P$(3,\\ 3,\\ -2)$。図のように、$\\vec q$ に垂直な面が球に接する所で最大です。',
        add: [{ t: 'ans', label: '(3) 前半', text: '最大値 $4+9=13$　（P$(3,\\ 3,\\ -2)$ のとき）' }] },

      // ---------- (3) 後半 ----------
      { clear: true, cols: [0.6, 0.4], part: '(3) 後半', say: '後半です。$\\mathrm{PE}^2+\\mathrm{PF}^2=|\\vec p-\\vec e|^2+|\\vec p-\\vec f|^2$ を展開すると、$|\\vec p|^2$ が2つ出てきます。',
        add: [{ t: 'h', text: '(3)　PE² + PF² の最大値' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PE}^2+\\mathrm{PF}^2=2|\\vec p|^2-2(\\vec e+\\vec f)\\cdot\\vec p+|\\vec e|^2+|\\vec f|^2' },
          { t: 'p', size: 'sm', text: '$\\vec e+\\vec f=(0,\\ -6,\\ 8)$、$|\\vec e|^2+|\\vec f|^2=18+42=60$' },
          { t: 'box', c: 'y', size: 'sm', label: '(2) を使う', text: '$|\\vec p|^2=\\vec p\\cdot(4,\\ 2,\\ 0)+4$ で **2次の項を消す**' }] },
      { ask: { type: 'choice', q: '(2) を使って整理すると、$\\mathrm{PE}^2+\\mathrm{PF}^2$ は？',
        opts: ['$8\\,\\vec p\\cdot\\vec q+68$', '$8\\,\\vec p\\cdot\\vec q+64$', '$8\\,\\vec p\\cdot\\vec q+60$', '$16\\,\\vec p\\cdot\\vec q+68$'], ok: 0,
        why: { 1: '$2|\\vec p|^2$ なので、$k=4$ も 2 倍して 8 になります。', 2: '$k=4$ の 2 倍（8）を入れ忘れています。', 3: '$(8,\\ 16,\\ -16)=8(1,\\ 2,\\ -2)$。くくり出す数は 8 です。' },
        good: '$2\\{\\vec p\\cdot(4,2,0)+4\\}-2\\vec p\\cdot(0,-6,8)+60=\\vec p\\cdot(8,16,-16)+68$。',
        add: [{ t: 'm', size: 'sm', tex: '=\\vec p\\cdot(8,\\ 16,\\ -16)+68=8\\,\\vec p\\cdot\\vec q+68' }] } },
      { say: '2次の項が消えて、前半の内積 $\\vec p\\cdot\\vec q$ の1次式になりました。前半の結果から、最大は $8\\cdot13+68=172$。',
        add: [{ t: 'ans', label: '(3) 後半', text: '最大値 $8\\cdot13+68=172$\n（P$(3,\\ 3,\\ -2)$ のとき）' },
          { t: 'p', col: 1, size: 'sm', text: '確かめ：P$(3,\\ 3,\\ -2)$ で\n$\\mathrm{PE}^2=4+16+36=56$\n$\\mathrm{PF}^2=16+64+36=116$\n和 $=172$ ✓' }] },
      { ask: { type: 'think', q: '別の見方：EF の中点を M とすると $\\mathrm{PE}^2+\\mathrm{PF}^2=2\\mathrm{PM}^2+\\dfrac{\\mathrm{EF}^2}{2}$（中線定理）。これで 172 を確かめよう。',
        hint: 'M$(0,\\ -3,\\ 4)$、CM $=|(-2,\\ -4,\\ 4)|$。PM が最大になるのは、P が C をはさんで M と反対側の球面上のとき。',
        ans: 'CM $=6$、PM の最大は $6+3=9$、EF$^2=20$ より　$2\\cdot81+10=172$',
        after: 'どちらの方法でも、最大になる P は $(3,\\ 3,\\ -2)$。図形の見方は検算に便利です。' } },
      { ask: { type: 'think', q: '$\\mathrm{PE}^2+\\mathrm{PF}^2$ の **最小値** は？',
        hint: '$\\vec p\\cdot\\vec q$ の最小は $\\overrightarrow{\\mathrm{CP}}$ が $\\vec q$ と反対向きのとき：$4-9=-5$。',
        ans: '$8\\cdot(-5)+68=28$　（P$(1,\\ -1,\\ 2)$ のとき）',
        after: '1次式にできれば、最大も最小も同じ考え方で出せます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。球面の上では、2乗の量を1次式に置きかえられる。これがこの問題の中心のアイデアです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
