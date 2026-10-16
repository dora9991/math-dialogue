/* 数学C 第1章 ベクトル 平面上のベクトル ⑥：ベクトル方程式
   例はすべて自作（A(1,2)、u=(3,−1) → x=1+3t, y=2−t、x+3y=7／A(2,−1)、n=(3,4) → 3x+4y−2=0／(−1,3)、n=(2,−5) → 2x−5y+17=0／
   A(−1,2),B(3,0) が直径の両端 → (x−1)²+(y−1)²=5／s+t=3 → OC=3a, OD=3b の線分 CD／2s+3t=6 → OE=3a, OF=2b の線分 EF）。
   python3（sympy）で検算ずみ。座標の図は目もりどおり、存在範囲の図は a=(2,0)、b=(0.8,1.6) としてかいた。 */
(function () {
  const POINTS = [
    '直線：$\\vec{p}=\\vec{a}+t\\vec{u}$（$\\vec{u}$＝方向ベクトル）、$\\vec{n}\\cdot(\\vec{p}-\\vec{a})=0$（$\\vec{n}$＝法線ベクトル）。$ax+by+c=0$ の法線ベクトルは $(a,\\ b)$',
    '円：$|\\vec{p}-\\vec{c}|=r$。A, B が直径の両端なら $(\\vec{p}-\\vec{a})\\cdot(\\vec{p}-\\vec{b})=0$',
    '$\\overrightarrow{\\mathrm{OP}}=s\\vec{a}+t\\vec{b}$：$s+t=1$ → 直線 AB、さらに $s,\\ t\\ge0$ → 線分 AB、$s+t\\le1,\\ s,\\ t\\ge0$ → △OAB の周と内部。和が 1 でなければ割ってそろえる'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  // 円の図：中心 C(2.8,1.8)、半径 1.5、P は 140° の位置、直径の両端 A（200°）・B（20°）
  const CC = [2.8, 1.8], CR = 1.5, CP = on(CC, CR, 140), CA = on(CC, CR, 200), CB = on(CC, CR, 20);
  // 存在範囲の図：a=(2,0)、b=(0.8,1.6)
  const O = [0, 0], RA = [2, 0], RB = [0.8, 1.6], RC = [6, 0], RD = [2.4, 4.8], RF = [1.6, 3.2];
  const rangeFig = () => ({ t: 'fig', id: 'rg', col: 1, view: [-0.8, -0.8, 6.8, 5.4], w: 637, h: 520, items: [
    { k: 'line', p1: RA, p2: RB, c: 'd', dash: true, wd: 2 },
    ar(O, RA, 'y', 3.5), vl([1, 0], 'a', 'y', 0, 24), ar(O, RB, 'b', 3.5), vl([0.4, 0.8], 'b', 'b', -22, -4),
    { k: 'seg', a: RA, b: RB, c: 'p', wd: 5 },
    { k: 'pt', at: O, name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: RA, name: 'A', dir: 'se', r: 4 }, { k: 'pt', at: RB, name: 'B', dir: 'w', r: 4 }] });

  HB.lesson({
    id: 'mc1-06', field: '数学C　ベクトル', title: 'ベクトル方程式', level: '平面上のベクトル', time: '目安 8分',
    noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　点 A$(1,\\ 2)$ を通り $\\vec{u}=(3,\\ -1)$ に平行な直線を、媒介変数表示と $x,\\ y$ の方程式で表せ。', '(2)　点 $(-1,\\ 3)$ を通り $\\vec{n}=(2,\\ -5)$ に垂直な直線の方程式を求めよ。',
        '(3)　A$(-1,\\ 2)$、B$(3,\\ 0)$ を直径の両端とする円の中心と半径を求めよ。',
        '(4)　$\\overrightarrow{\\mathrm{OP}}=s\\overrightarrow{\\mathrm{OA}}+t\\overrightarrow{\\mathrm{OB}}$ とする。$s+t=3,\\ s\\ge0,\\ t\\ge0$ のとき、また $2s+3t=6,\\ s\\ge0,\\ t\\ge0$ のとき、点 P の存在範囲を求めよ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: 'めあて', say: '数学Ⅱでは、直線や円を $x,\\ y$ の方程式で表しました。この時間は、同じ図形を **ベクトルの式** で表します。点の動く範囲を読み取る問題にもつながります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '直線・円を **ベクトル方程式** で表し、成分の式に直せる\n$\\overrightarrow{\\mathrm{OP}}=s\\overrightarrow{\\mathrm{OA}}+t\\overrightarrow{\\mathrm{OB}}$ の点 P の **存在範囲** がわかる' }] },

      // ---------- 直線（方向ベクトル） ----------
      { clear: true, part: '直線のベクトル方程式', say: '点 A$(\\vec{a})$ を通り $\\vec{u}$ に平行な直線上の点 P$(\\vec{p})$ は、$\\overrightarrow{\\mathrm{AP}}=t\\vec{u}$ と表せます。だから $\\vec{p}=\\vec{a}+t\\vec{u}$。$\\vec{u}$ を **方向ベクトル** といいます。',
        add: [{ t: 'h', text: '直線のベクトル方程式' },
          { t: 'box', c: 'y', label: '方向ベクトル', tex: '\\vec{p}=\\vec{a}+t\\vec{u}\\quad(t\\text{ は実数})' },
          { t: 'fig', id: 'ln', col: 1, view: [-1.6, -1.2, 7.6, 4.0], w: 680, h: 384, items: [
            { k: 'axes', grid: true, tx: [1, 2, 3, 4, 5, 6, 7].map(v => [v, String(v)]), ty: [1, 2, 3].map(v => [v, String(v)]) },
            { k: 'line', p1: [1, 2], p2: [4, 1], c: 'w', wd: 2.5 },
            ar(O, [1, 2], 'y', 3), vl([0.5, 1], 'a', 'y', -22, -4), ar(O, [5.8, 0.4], 'p', 3), vl([3.6, 0.25], 'p', 'p', 4, 20),
            ar([1, 2], [4, 1], 'g', 5), vl([2.5, 1.5], 'u', 'g', 6, -26),
            { k: 'pt', at: [1, 2], name: 'A(1, 2)', dir: 'ne', r: 5 }, { k: 'pt', at: [5.8, 0.4], name: 'P', dir: 'n', r: 5, c: 'p' }] }] },
      { say: '成分で書くと、A$(1,\\ 2)$、$\\vec{u}=(3,\\ -1)$ なら $(x,\\ y)=(1,\\ 2)+t(3,\\ -1)$。$x=1+3t,\\ y=2-t$ を、直線の **媒介変数表示** といいます。',
        add: [{ t: 'm', size: 'sm', tex: '(x,\\ y)=(1,\\ 2)+t(3,\\ -1)' }, { t: 'm', size: 'sm', tex: '\\begin{cases}x=1+3t\\\\ y=2-t\\end{cases}', note: '媒介変数表示\n（$t$ は媒介変数）' }] },
      { ask: { type: 'choice', q: '$x=1+3t,\\ y=2-t$ から $t$ を消去すると？',
        opts: ['$x+3y=7$', '$x-3y=-5$', '$3x-y=1$', '$3x+y=5$'], ok: 0,
        why: { 1: '$y=2-t$ から $t=2-y$。$t=y-2$ と符号をまちがえています。', 2: '$\\vec{u}=(3,\\ -1)$ を、このあと学ぶ法線ベクトルと取りちがえた式です。', 3: '傾きを $\\frac{3}{-1}$ と、分母と分子を逆にしています。傾きは $-\\frac13$。' },
        good: '$t=2-y$ を $x=1+3t$ に入れて $x=7-3y$、つまり $x+3y=7$。',
        add: [{ t: 'm', size: 'sm', tex: 't=2-y\\ \\text{より}\\ x=1+3(2-y)\\quad\\therefore\\ x+3y=7' }] } },
      { say: '2点 A$(\\vec{a})$、B$(\\vec{b})$ を通る直線は、方向ベクトルを $\\vec{b}-\\vec{a}$ にして $\\vec{p}=\\vec{a}+t(\\vec{b}-\\vec{a})=(1-t)\\vec{a}+t\\vec{b}$。**係数の和が 1** の形です。',
        add: [{ t: 'box', c: 'b', label: '2点 A, B を通る', tex: '\\vec{p}=(1-t)\\vec{a}+t\\vec{b}' }] },

      // ---------- 法線ベクトル ----------
      { clear: true, part: '法線ベクトル', say: '点 A$(\\vec{a})$ を通り $\\vec{n}$ に **垂直** な直線。直線上の点 P では $\\overrightarrow{\\mathrm{AP}}\\perp\\vec{n}$ なので $\\vec{n}\\cdot(\\vec{p}-\\vec{a})=0$。$\\vec{n}$ を **法線ベクトル** といいます。',
        add: [{ t: 'h', text: '法線ベクトルと直線' },
          { t: 'box', c: 'y', label: '法線ベクトル', tex: '\\vec{n}\\cdot(\\vec{p}-\\vec{a})=0' },
          { t: 'fig', id: 'nm', col: 1, view: [-0.5, -0.5, 5.0, 3.6], w: 560, h: 417, items: [
            { k: 'line', p1: [1, 1], p2: [3.5, 2], c: 'w', wd: 2.5 },
            ar([1, 1], [3.5, 2], 'p', 3.5), ar([1, 1], [0.4, 2.5], 'g', 4.5), vl([0.7, 1.75], 'n', 'g', -24, 0),
            { k: 'right', o: [1, 1], a: [3.5, 2], b: [0.4, 2.5], s: 16, c: 'g' },
            { k: 'pt', at: [1, 1], name: 'A', dir: 's', r: 5 }, { k: 'pt', at: [3.5, 2], name: 'P', dir: 'n', r: 5, c: 'p' }] }] },
      { say: '$\\vec{n}=(a,\\ b)$、A$(x_1,\\ y_1)$ なら $a(x-x_1)+b(y-y_1)=0$。逆に、直線 $ax+by+c=0$ の法線ベクトルは $(a,\\ b)$ です。',
        add: [{ t: 'm', tex: 'a(x-x_1)+b(y-y_1)=0' },
          { t: 'p', size: 'sm', text: '例　A$(2,\\ -1)$、$\\vec{n}=(3,\\ 4)$\n$3(x-2)+4(y+1)=0$ より　$3x+4y-2=0$' },
          { t: 'p', size: 'sm', text: '$ax+by+c=0$ の法線ベクトル → $(a,\\ b)$' }] },
      { ask: { type: 'choice', q: '点 $(-1,\\ 3)$ を通り、$\\vec{n}=(2,\\ -5)$ に垂直な直線は？',
        opts: ['$2x-5y-17=0$', '$5x+2y-1=0$', '$2x-5y-13=0$', '$2x-5y+17=0$'], ok: 3,
        why: { 0: '$2(x+1)-5(y-3)$ の定数は $2+15=17$。符号をまちがえています。', 1: '$\\vec{n}$ を方向ベクトルとして使っています。$\\vec{n}$ は直線に垂直です。', 2: '$-5(y-3)=-5y+15$ です。$-15$ にしています。' },
        good: '$2(x+1)-5(y-3)=0$ を展開して $2x-5y+17=0$。',
        add: [{ t: 'm', size: 'sm', tex: '2(x+1)-5(y-3)=0\\quad\\therefore\\ 2x-5y+17=0' }] } },

      // ---------- 円 ----------
      { clear: true, part: '円のベクトル方程式', say: '点 C$(\\vec{c})$ を中心とする半径 $r$ の円。円周上の点 P では $|\\overrightarrow{\\mathrm{CP}}|=r$ なので、$|\\vec{p}-\\vec{c}|=r$。成分で書くと、数学Ⅱの円の方程式になります。',
        add: [{ t: 'h', text: '円のベクトル方程式' },
          { t: 'box', c: 'y', label: '円', tex: '|\\vec{p}-\\vec{c}|=r' },
          { t: 'p', size: 'sm', text: '成分では　$(x-c_1)^2+(y-c_2)^2=r^2$' },
          { t: 'fig', id: 'ci', col: 1, view: [-0.6, -0.6, 5.0, 3.8], w: 560, h: 440, items: [
            { k: 'circle', o: CC, r: CR, c: 'w', wd: 2.5 },
            ar(O, CC, 'y', 3), vl([1.4, 0.9], 'c', 'y', 8, 22), ar(O, CP, 'p', 3), vl([0.83, 1.38], 'p', 'p', -22, -6),
            { k: 'seg', a: CC, b: CP, c: 'b', wd: 3 }, lb([(CC[0] + CP[0]) / 2, (CC[1] + CP[1]) / 2], 'r', 'b', 14, 12, 26),
            { k: 'pt', at: O, name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: CC, name: 'C', dir: 'e', r: 5, c: 'y' }, { k: 'pt', at: CP, name: 'P', dir: 'n', r: 5, c: 'p' }] }] },
      { say: '2点 A$(\\vec{a})$、B$(\\vec{b})$ を **直径の両端** とする円は、円周角が $90^\\circ$ なので $\\overrightarrow{\\mathrm{AP}}\\perp\\overrightarrow{\\mathrm{BP}}$。$(\\vec{p}-\\vec{a})\\cdot(\\vec{p}-\\vec{b})=0$ と表せます。',
        add: [{ t: 'box', c: 'b', label: '直径の両端 A, B', tex: '(\\vec{p}-\\vec{a})\\cdot(\\vec{p}-\\vec{b})=0' },
          { t: 'p', size: 'sm', text: '（P が A, B と重なるときもふくめて成り立つ）' }],
        draw: [{ fig: 'ci', items: [{ k: 'seg', a: CA, b: CB, c: 'd', dash: true, wd: 2 }, { k: 'seg', a: CP, b: CA, c: 'g', wd: 2.5 }, { k: 'seg', a: CP, b: CB, c: 'g', wd: 2.5 },
          { k: 'right', o: CP, a: CA, b: CB, s: 14, c: 'g' }, { k: 'pt', at: CA, name: 'A', dir: 'w', r: 4, c: 'g' }, { k: 'pt', at: CB, name: 'B', dir: 'e', r: 4, c: 'g' }] }] },
      { ask: { type: 'choice', q: 'A$(-1,\\ 2)$、B$(3,\\ 0)$ を直径の両端とする円の、中心と半径は？',
        opts: ['中心 $(2,\\ -1)$、半径 $\\sqrt5$', '中心 $(1,\\ 1)$、半径 $2\\sqrt5$', '中心 $(1,\\ 1)$、半径 $5$', '中心 $(1,\\ 1)$、半径 $\\sqrt5$'], ok: 3,
        why: { 0: '中心は AB の中点。座標の差ではなく、和を 2 で割ります。', 1: '$2\\sqrt5$ は直径 AB の長さ。半径はその半分です。', 2: '$(x-1)^2+(y-1)^2=5$ の 5 は半径の2乗です。' },
        good: '$(x+1)(x-3)+(y-2)(y-0)=0$ を整理すると $(x-1)^2+(y-1)^2=5$。',
        add: [{ t: 'm', size: 'sm', tex: '(x+1)(x-3)+(y-2)y=0\\ \\to\\ (x-1)^2+(y-1)^2=5' }] } },

      // ---------- 点の存在範囲 ----------
      { clear: true, cols: [0.52, 0.48], part: '点の存在範囲', say: '$\\overrightarrow{\\mathrm{OP}}=s\\vec{a}+t\\vec{b}$ で $s+t=1$ なら、$\\overrightarrow{\\mathrm{OP}}=(1-t)\\vec{a}+t\\vec{b}$ なので P は **直線 AB** 上。さらに $s\\ge0,\\ t\\ge0$ なら **線分 AB** です。',
        add: [{ t: 'h', text: '点 P の存在範囲' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=s\\overrightarrow{\\mathrm{OA}}+t\\overrightarrow{\\mathrm{OB}}' },
          { t: 'tbl', cls: 'rowh', size: 'sm', rows: [['条件', 'P の存在範囲'], ['$s+t=1$', '直線 AB'], ['$s+t=1,\\ s\\ge0,\\ t\\ge0$', '線分 AB']] },
          rangeFig()] },
      { say: '$s+t\\le1,\\ s\\ge0,\\ t\\ge0$ なら、P は **△OAB の周と内部**。$s+t=k$（$0\\le k\\le1$）のとき P は AB に平行な線分を動き、それを集めた範囲です。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: '三角形', text: '$s+t\\le1,\\ s\\ge0,\\ t\\ge0$ → △OAB の周と内部' }],
        draw: [{ fig: 'rg', items: [{ k: 'poly', pts: [O, RA, RB], close: true, fill: 'p', alpha: 0.25, noStroke: true }, { k: 'seg', a: [1, 0], b: [0.4, 0.8], c: 'p', dash: true, wd: 2 }, lb([0.7, 0.4], 'k=1/2', 'p', 34, 4, 18)] }] },
      { ask: { type: 'choice', q: '$s+t=3,\\ s\\ge0,\\ t\\ge0$ のとき、P の存在範囲は？（$\\overrightarrow{\\mathrm{OC}}=3\\vec{a}$、$\\overrightarrow{\\mathrm{OD}}=3\\vec{b}$ とする）',
        opts: ['線分 AB', '線分 CD', '直線 CD', '△OCD の周と内部'], ok: 1,
        why: { 0: '$s+t=3$ です。両辺を 3 で割って、係数の和を 1 にそろえます。', 2: '$s\\ge0,\\ t\\ge0$ があるので、直線全体ではなく線分です。', 3: '$s+t\\le3$ ではなく $s+t=3$。三角形の内部は動けません。' },
        good: '$\\overrightarrow{\\mathrm{OP}}=\\frac{s}{3}(3\\vec{a})+\\frac{t}{3}(3\\vec{b})$ で $\\frac{s}{3}+\\frac{t}{3}=1$。だから線分 CD。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{s}{3}(3\\vec{a})+\\frac{t}{3}(3\\vec{b}),\\ \\ \\frac{s}{3}+\\frac{t}{3}=1' }],
        draw: [{ fig: 'rg', items: [{ k: 'seg', a: RA, b: RC, c: 'd', dash: true, wd: 2 }, { k: 'seg', a: RB, b: RD, c: 'd', dash: true, wd: 2 }, { k: 'seg', a: RC, b: RD, c: 'y', wd: 5 },
          { k: 'pt', at: RC, name: 'C', dir: 's', r: 5, c: 'y' }, { k: 'pt', at: RD, name: 'D', dir: 'e', r: 5, c: 'y' }] }] } },
      { ask: { type: 'think', q: '$2s+3t=6,\\ s\\ge0,\\ t\\ge0$ のとき、P の存在範囲を求めよう。',
        hint: '両辺を 6 で割ると $\\frac{s}{3}+\\frac{t}{2}=1$。$\\overrightarrow{\\mathrm{OP}}=\\frac{s}{3}(3\\vec{a})+\\frac{t}{2}(2\\vec{b})$ と変形する。',
        ans: '$\\overrightarrow{\\mathrm{OE}}=3\\vec{a}$、$\\overrightarrow{\\mathrm{OF}}=2\\vec{b}$ となる点 E, F をとると、**線分 EF**',
        after: 'E は C と同じ点です。「係数の和を 1 にそろえる」のがコツ。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{s}{3}(3\\vec{a})+\\frac{t}{2}(2\\vec{b}),\\ \\ \\frac{s}{3}+\\frac{t}{2}=1' }],
        draw: [{ fig: 'rg', items: [{ k: 'seg', a: RC, b: RF, c: 'g', wd: 5 }, { k: 'pt', at: RF, name: 'F', dir: 'w', r: 5, c: 'g' }, lb(RC, '(E)', 'g', 30, 24, 22)] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。平面上のベクトルはここまで。次の時間からは **空間のベクトル** に進みます。座標を3つにした空間でも、同じ考え方が使えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
