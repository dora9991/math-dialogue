/* 数学C 第1章 ベクトル 平面上のベクトル ④：位置ベクトル
   例はすべて自作（2:3 に内分 (3a+2b)/5／3:1 に外分 (−a+3b)/2、1:3 に外分 (3a−b)/2／A(−2,5),B(8,0) の 2:3 内分点 (2,3)、C(3,−2) で重心 (3,1)／
   A(1,−1),B(3,2),C(x,8) が一直線上 → x=7／△OAB で P＝OA の中点、Q＝OB を 2:1 に内分、R＝AB を 2:1 に外分 → PR=3PQ）。
   python3（sympy）で検算ずみ。図は数値どおりの形（三角形の形は自由に決めた）。 */
(function () {
  const POINTS = [
    '位置ベクトル P$(\\vec{p})$ は $\\vec{p}=\\overrightarrow{\\mathrm{OP}}$。$\\overrightarrow{\\mathrm{AB}}=\\vec{b}-\\vec{a}$（終点 − 始点）',
    '$m:n$ に内分する点 $\\dfrac{n\\vec{a}+m\\vec{b}}{m+n}$、外分は $n$ を $-n$ に：$\\dfrac{-n\\vec{a}+m\\vec{b}}{m-n}$。重心は $\\dfrac{\\vec{a}+\\vec{b}+\\vec{c}}{3}$',
    '3点 A, B, C が一直線上 ⇔ $\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$ となる実数 $k$ がある'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const vx = (at, spec, c, dx, dy, size) => spec.map(([t, v, x]) => ({ k: 'label', at, text: t, c, vec: v, size: size || 26, dx: (dx || 0) + x, dy: dy || 0 }));   // 「b − a」の矢印は文字ごとに
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  const O = [0, 0], A = [1, 2.4], B = [4, 1.2];
  const base = () => [ar(O, A, 'y', 3.5), vl([0.5, 1.2], 'a', 'y', -22, -4), ar(O, B, 'b', 3.5), vl([2, 0.6], 'b', 'b', 8, 22),
    { k: 'pt', at: O, name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'e', r: 4 }];
  const P32 = [2.8, 1.68], PX = [5.5, 0.6], QX = [-0.5, 3.0];   // 3:2 に内分、3:1 に外分、1:3 に外分
  // 重心
  const GA = [1.4, 3.2], GB = [0, 0], GC = [4, 0.4], GM = [2, 0.2], GG = [1.8, 1.2];
  // 考えてみよう：O(0,0) A(3,0) B(1.5,2.2)、P＝a/2、Q＝2b/3、R＝−a+2b
  const TA = [3, 0], TB = [1.5, 2.2], TP = [1.5, 0], TQ = [1, 2.2 * 2 / 3], TR = [0, 4.4];

  HB.lesson({
    id: 'mc1-04', field: '数学C　ベクトル', title: '位置ベクトル', level: '平面上のベクトル', time: '目安 8分',
    noDec: true,   // 分数はベクトルの係数ばかりなので、小数をそえない
    problem: { label: '例題', lead: 'A$(\\vec{a})$、B$(\\vec{b})$ とする。',
      parts: ['(1)　線分 AB を $2:3$ に内分する点、$1:3$ に外分する点の位置ベクトルを求めよ。', '(2)　A$(-2,\\ 5)$、B$(8,\\ 0)$ のとき、線分 AB を $2:3$ に内分する点の座標を求めよ。',
        '(3)　3点 A$(1,\\ -1)$、B$(3,\\ 2)$、C$(x,\\ 8)$ が一直線上にあるときの $x$ を求めよ。',
        '(4)　△OAB で、OA の中点を P、OB を $2:1$ に内分する点を Q、AB を $2:1$ に外分する点を R とする。P, Q, R は一直線上にあることを示せ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: 'めあて', say: '前の時間までで、ベクトルの計算と内積を学びました。この時間は、基準の点 O を決めて、**点の位置をベクトルで表す** 方法を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '点の位置を **位置ベクトル** で表し、$\\overrightarrow{\\mathrm{AB}}=\\vec{b}-\\vec{a}$ を使える\n内分点・外分点・重心を表し、**一直線上** にある条件を使える' }] },

      // ---------- 位置ベクトル ----------
      { clear: true, part: '位置ベクトル', say: '平面上に点 O を決めておくと、点 P の位置は $\\vec{p}=\\overrightarrow{\\mathrm{OP}}$ で決まります。これを P の **位置ベクトル** といい、P$(\\vec{p})$ と書きます。',
        add: [{ t: 'h', text: '位置ベクトル' },
          { t: 'box', c: 'y', label: '位置ベクトル', tex: '\\vec{p}=\\overrightarrow{\\mathrm{OP}}\\quad\\longrightarrow\\quad \\mathrm{P}(\\vec{p})' },
          { t: 'p', size: 'sm', text: 'O は基準の点（どこにとってもよい）\n右の図は A$(\\vec{a})$、B$(\\vec{b})$' },
          { t: 'fig', id: 'ps', col: 1, view: [-0.6, -0.6, 4.8, 3.2], w: 620, h: 436, items: base() }] },
      { say: '2点 A$(\\vec{a})$、B$(\\vec{b})$ について、$\\overrightarrow{\\mathrm{AB}}=\\overrightarrow{\\mathrm{OB}}-\\overrightarrow{\\mathrm{OA}}=\\vec{b}-\\vec{a}$。**（終点）−（始点）** です。この式が、この章でいちばんよく使う式です。',
        add: [{ t: 'box', c: 'p', label: 'いちばん大切', tex: '\\overrightarrow{\\mathrm{AB}}=\\vec{b}-\\vec{a}' }],
        draw: [{ fig: 'ps', items: [ar(A, B, 'p', 4)].concat(vx([2.5, 1.8], [['b', true, -26], ['−', false, 0], ['a', true, 25]], 'p', 36, -24)) }] },

      // ---------- 内分点 ----------
      { clear: true, part: '内分点', say: '線分 AB を $m:n$ に内分する点 P。AP は AB の $\\frac{m}{m+n}$ 倍なので、$\\vec{p}=\\vec{a}+\\frac{m}{m+n}(\\vec{b}-\\vec{a})$ です。',
        add: [{ t: 'h', text: '内分点の位置ベクトル' },
          { t: 'm', tex: '\\vec{p}=\\vec{a}+\\frac{m}{m+n}(\\vec{b}-\\vec{a})' },
          { t: 'fig', id: 'dv', col: 1, view: [-0.6, -0.6, 4.8, 3.2], w: 620, h: 436, items: base().concat([
            { k: 'seg', a: A, b: B, c: 'w', wd: 2.5 }, ar(O, P32, 'p', 4), vl([1.4, 0.84], 'p', 'p', 14, 20),
            { k: 'pt', at: P32, name: 'P', dir: 'n', r: 5, c: 'p' }, lb([1.9, 2.04], 'm', 'w', 8, -22), lb([3.4, 1.44], 'n', 'w', 8, -22)]) }] },
      { say: '整理すると $\\vec{p}=\\dfrac{n\\vec{a}+m\\vec{b}}{m+n}$。**$\\vec{a}$ には遠いほうの $n$、$\\vec{b}$ には $m$** と、たすきにかけます。中点は $\\dfrac{\\vec{a}+\\vec{b}}{2}$ です。',
        add: [{ t: 'm', tex: '=\\frac{(m+n)\\vec{a}-m\\vec{a}+m\\vec{b}}{m+n}=\\frac{n\\vec{a}+m\\vec{b}}{m+n}' },
          { t: 'box', c: 'y', label: '内分点', text: '$m:n$ に内分する点　$\\dfrac{n\\vec{a}+m\\vec{b}}{m+n}$\n中点　$\\dfrac{\\vec{a}+\\vec{b}}{2}$' }] },
      { ask: { type: 'choice', q: '線分 AB を $2:3$ に内分する点 P の位置ベクトル $\\vec{p}$ は？',
        opts: ['$\\dfrac{2\\vec{a}+3\\vec{b}}{5}$', '$\\dfrac{3\\vec{a}+2\\vec{b}}{5}$', '$3\\vec{a}+2\\vec{b}$', '$\\vec{a}+\\dfrac25\\vec{b}$'], ok: 1,
        why: { 0: '係数が逆です。$\\vec{a}$ にかかるのは、遠いほうの比 3 です。', 2: '$m+n=5$ で割るのを忘れています。', 3: '$\\vec{a}+\\frac25(\\vec{b}-\\vec{a})$ の $-\\frac25\\vec{a}$ を落としています。' },
        good: '$n=3$ を $\\vec{a}$ に、$m=2$ を $\\vec{b}$ にかけて、$5$ で割ります。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec{p}=\\frac{3\\vec{a}+2\\vec{b}}{2+3}=\\frac{3\\vec{a}+2\\vec{b}}{5}' }] } },

      // ---------- 外分点 ----------
      { clear: true, part: '外分点', say: '$m:n$ に **外分** する点は、内分の公式の $n$ を $-n$ にかえるだけです。$m>n$ なら B の外側、$m<n$ なら A の外側にあります。',
        add: [{ t: 'h', text: '外分点の位置ベクトル' },
          { t: 'box', c: 'y', label: '外分点', text: '$m:n$ に外分　$\\dfrac{-n\\vec{a}+m\\vec{b}}{m-n}$　（$m\\neq n$）' },
          { t: 'p', size: 'sm', text: '例　$3:1$ に外分する点 P（B の外側）' },
          { t: 'm', size: 'sm', tex: '\\vec{p}=\\frac{-1\\cdot\\vec{a}+3\\vec{b}}{3-1}=\\frac{-\\vec{a}+3\\vec{b}}{2}' },
          { t: 'fig', id: 'ex', col: 1, view: [-1.2, -0.6, 6.2, 3.6], w: 640, h: 363, items: base().concat([
            { k: 'seg', a: A, b: PX, c: 'w', wd: 2, dash: true }, ar(O, PX, 'p', 3.5),
            { k: 'pt', at: PX, name: 'P', dir: 'ne', r: 5, c: 'p' }, lb([3.25, 1.5], '3', 'p', 6, -24), lb([4.75, 0.9], '1', 'p', 6, -22)]) }] },
      { ask: { type: 'choice', q: '線分 AB を $1:3$ に外分する点 Q の位置ベクトル $\\vec{q}$ は？',
        opts: ['$\\dfrac{3\\vec{a}-\\vec{b}}{2}$', '$\\dfrac{-3\\vec{a}+\\vec{b}}{2}$', '$\\dfrac{3\\vec{a}+\\vec{b}}{4}$', '$\\dfrac{-\\vec{a}+3\\vec{b}}{2}$'], ok: 0,
        why: { 1: '分母は $m-n=1-3=-2$。符号を整えると $\\frac{3\\vec{a}-\\vec{b}}{2}$ です。', 2: 'それは $1:3$ に内分する点です。', 3: 'それは $3:1$ に外分する点。ここでは $m=1,\\ n=3$ です。' },
        good: '$\\frac{-3\\vec{a}+1\\cdot\\vec{b}}{1-3}=\\frac{3\\vec{a}-\\vec{b}}{2}$。$m<n$ なので Q は A の外側。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec{q}=\\frac{-3\\vec{a}+\\vec{b}}{1-3}=\\frac{3\\vec{a}-\\vec{b}}{2}' }],
        draw: [{ fig: 'ex', items: [{ k: 'seg', a: A, b: QX, c: 'g', wd: 2, dash: true }, ar(O, QX, 'g', 3.5), { k: 'pt', at: QX, name: 'Q', dir: 'e', r: 5, c: 'g' }] }] } },

      // ---------- 重心 ----------
      { clear: true, part: '三角形の重心', say: '△ABC の重心 G は、中線 AM を $2:1$ に内分する点です。M は BC の中点 $\\frac{\\vec{b}+\\vec{c}}{2}$ なので、計算すると $\\vec{g}=\\frac{\\vec{a}+\\vec{b}+\\vec{c}}{3}$。',
        add: [{ t: 'h', text: '三角形の重心' },
          { t: 'm', tex: '\\vec{g}=\\frac{1\\cdot\\vec{a}+2\\cdot\\frac{\\vec{b}+\\vec{c}}{2}}{2+1}' },
          { t: 'box', c: 'y', label: '重心', tex: '\\vec{g}=\\frac{\\vec{a}+\\vec{b}+\\vec{c}}{3}' },
          { t: 'p', size: 'sm', text: 'A$(\\vec{a})$、B$(\\vec{b})$、C$(\\vec{c})$、G$(\\vec{g})$' },
          { t: 'fig', id: 'gc', col: 1, view: [-0.6, -0.6, 4.6, 3.8], w: 560, h: 474, items: [
            { k: 'poly', pts: [GA, GB, GC], close: true, c: 'w', wd: 2.5 }, { k: 'seg', a: GA, b: GM, c: 'b', wd: 2.5 },
            { k: 'pt', at: GA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: GB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: GC, name: 'C', dir: 'se', r: 4 },
            { k: 'pt', at: GM, name: 'M', dir: 's', r: 4, c: 'b' }, { k: 'pt', at: GG, name: 'G', dir: 'e', r: 6, c: 'p' },
            lb([1.6, 2.2], '2', 'b', 18, 0), lb([1.9, 0.7], '1', 'b', 18, 0)] }] },

      // ---------- 座標で ----------
      { clear: true, cols: [1], part: '座標で計算', say: '原点を O にとると、位置ベクトルの成分は **点の座標そのもの**。内分点の公式は、座標の公式として使えます。$x$ 座標・$y$ 座標ごとに計算します。',
        add: [{ t: 'h', text: '座標で計算する' },
          { t: 'p', size: 'sm', text: 'A$(x_1,\\ y_1)$、B$(x_2,\\ y_2)$ を $m:n$ に内分する点' },
          { t: 'm', tex: '\\left(\\frac{nx_1+mx_2}{m+n},\\ \\ \\frac{ny_1+my_2}{m+n}\\right)' },
          { t: 'p', size: 'sm', text: '重心の座標は、3点の座標の平均。例　A$(-2,\\ 5)$、B$(8,\\ 0)$、C$(3,\\ -2)$ の重心は' },
          { t: 'm', size: 'sm', tex: '\\left(\\frac{-2+8+3}{3},\\ \\frac{5+0-2}{3}\\right)=(3,\\ 1)' }] },
      { ask: { type: 'choice', q: 'A$(-2,\\ 5)$、B$(8,\\ 0)$ を結ぶ線分を $2:3$ に内分する点の座標は？',
        opts: ['$(4,\\ 2)$', '$\\left(3,\\ \\frac52\\right)$', '$(2,\\ 3)$', '$(10,\\ 15)$'], ok: 2,
        why: { 0: '係数が逆です。A の座標にかけるのは 3、B の座標にかけるのは 2。', 1: 'それは中点です。', 3: '$m+n=5$ で割るのを忘れています。' },
        good: '$\\left(\\frac{3\\cdot(-2)+2\\cdot8}{5},\\ \\frac{3\\cdot5+2\\cdot0}{5}\\right)=(2,\\ 3)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\left(\\frac{3\\cdot(-2)+2\\cdot8}{5},\\ \\frac{3\\cdot5+2\\cdot0}{5}\\right)=(2,\\ 3)' }] } },

      // ---------- 一直線上 ----------
      { clear: true, part: '一直線上にある条件', say: '3点 A, B, C が一直線上にあるのは、$\\overrightarrow{\\mathrm{AC}}$ が $\\overrightarrow{\\mathrm{AB}}$ の実数倍のとき。**$\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$ となる実数 $k$ がある** ことです。',
        add: [{ t: 'h', text: '3点が一直線上にある条件' },
          { t: 'box', c: 'p', label: '一直線上', tex: '\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}\\ \\ (k\\text{ は実数})' },
          { t: 'p', size: 'sm', text: '平行の条件 $\\vec{b}=k\\vec{a}$ と同じ形。\n共通の点 A があるので、平行なら一直線上' },
          { t: 'fig', id: 'cl', col: 1, view: [-0.8, -2, 8.2, 9], w: 425, h: 520, items: [
            { k: 'axes', grid: true, tx: [1, 2, 3, 4, 5, 6, 7].map(v => [v, v % 2 ? String(v) : '']), ty: [-1, 1, 2, 3, 4, 5, 6, 7, 8].map(v => [v, v % 2 ? '' : String(v)]) },
            { k: 'line', p1: [1, -1], p2: [3, 2], c: 'd', dash: true, wd: 2 },
            ar([1, -1], [3, 2], 'y', 4), { k: 'pt', at: [1, -1], name: 'A', dir: 'e', r: 5 }, { k: 'pt', at: [3, 2], name: 'B', dir: 'e', r: 5 }] }] },
      { ask: { type: 'choice', q: '3点 A$(1,\\ -1)$、B$(3,\\ 2)$、C$(x,\\ 8)$ が一直線上にあるとき、$x$ は？',
        opts: ['$6$', '$\\dfrac{19}{3}$', '$7$', '$12$'], ok: 2,
        why: { 0: '$x-1=2k=6$ から $x=7$。A の $x$ 座標の 1 を足し忘れています。', 1: '$\\overrightarrow{\\mathrm{AC}}$ の $y$ 成分は $8-(-1)=9$。8 のままにしています。', 3: '$\\overrightarrow{\\mathrm{OC}}$ と $\\overrightarrow{\\mathrm{OB}}$ を平行にしています。A から出るベクトルで考えます。' },
        good: '$\\overrightarrow{\\mathrm{AB}}=(2,\\ 3)$、$\\overrightarrow{\\mathrm{AC}}=(x-1,\\ 9)=k(2,\\ 3)$ より $k=3$、$x=7$。',
        add: [{ t: 'm', size: 'sm', tex: '(x-1,\\ 9)=k(2,\\ 3)\\ \\text{より}\\ k=3,\\ x=7' }],
        draw: [{ fig: 'cl', items: [ar([1, -1], [7, 8], 'p', 3), { k: 'pt', at: [7, 8], name: 'C(7, 8)', dir: 'w', r: 5, c: 'p', size: 24 }] }] } },

      // ---------- 考えてみよう ----------
      { clear: true, cols: [0.6, 0.4], part: '一直線上の証明', say: '△OAB で $\\overrightarrow{\\mathrm{OA}}=\\vec{a},\\ \\overrightarrow{\\mathrm{OB}}=\\vec{b}$。OA の中点を P、OB を $2:1$ に内分する点を Q、AB を $2:1$ に外分する点を R とします。',
        add: [{ t: 'h', text: '3点 P, Q, R は一直線上？' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac12\\vec{a},\\qquad \\overrightarrow{\\mathrm{OQ}}=\\frac23\\vec{b}' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OR}}=\\frac{-1\\cdot\\vec{a}+2\\vec{b}}{2-1}=-\\vec{a}+2\\vec{b}' },
          { t: 'fig', id: 'pr', col: 1, view: [-0.7, -0.6, 3.7, 4.9], w: 400, h: 500, items: [
            { k: 'poly', pts: [O, TA, TB], close: true, c: 'w', wd: 2.5 }, { k: 'seg', a: TB, b: TR, c: 'd', dash: true, wd: 2 },
            { k: 'pt', at: O, name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: TA, name: 'A', dir: 'se', r: 4 }, { k: 'pt', at: TB, name: 'B', dir: 'e', r: 4 },
            { k: 'pt', at: TP, name: 'P', dir: 's', r: 5, c: 'g' }, { k: 'pt', at: TQ, name: 'Q', dir: 'w', r: 5, c: 'g' }, { k: 'pt', at: TR, name: 'R', dir: 'e', r: 5, c: 'g' }] }] },
      { ask: { type: 'think', q: 'P, Q, R が一直線上にあることを示そう。',
        hint: '$\\overrightarrow{\\mathrm{PQ}}$ と $\\overrightarrow{\\mathrm{PR}}$ を $\\vec{a},\\ \\vec{b}$ で表し、$\\overrightarrow{\\mathrm{PR}}=k\\overrightarrow{\\mathrm{PQ}}$ の形をさがす。',
        ans: '$\\overrightarrow{\\mathrm{PQ}}=\\dfrac23\\vec{b}-\\dfrac12\\vec{a}$、$\\overrightarrow{\\mathrm{PR}}=(-\\vec{a}+2\\vec{b})-\\dfrac12\\vec{a}=-\\dfrac32\\vec{a}+2\\vec{b}=3\\overrightarrow{\\mathrm{PQ}}$　よって一直線上',
        after: 'PQ : QR $=1:2$ もわかります。「一直線上」は、$k$ 倍の関係を見つけることです。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PQ}}=-\\frac12\\vec{a}+\\frac23\\vec{b}' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PR}}=-\\frac32\\vec{a}+2\\vec{b}=3\\overrightarrow{\\mathrm{PQ}}' }],
        draw: [{ fig: 'pr', items: [{ k: 'seg', a: TP, b: TR, c: 'g', wd: 3 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、位置ベクトルを使って、2直線の交点・三角形の面積・図形の証明に取り組みます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
