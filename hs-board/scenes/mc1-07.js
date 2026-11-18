/* 数学C 第1章 ベクトル 空間のベクトル ⑦：空間の座標とベクトル
   例はすべて自作（P(2,4,4)・|OP|=6／(3,−1,2) の y 軸対称 (−3,−1,−2)／A(1,−2,3),B(3,1,−3) → AB=(2,3,−6)・7／
   a=(1,2,−1),b=(2,−1,3)：a+b=(3,1,2)、2a−b=(0,5,−5)／(2,−1,3)∥(x,2,y) → x=−4,y=−6／A(1,0,2),B(3,1,−1),C(x,y,5) 一直線上 → x=y=−1／
   直方体 OABC-DEFG で AG=−a+b+c）。python3（sympy）で検算ずみ。
   見取図は2通り：座標の図は x 軸を左下（奥行き 0.45・0.38 倍）・y 軸を右・z 軸を上（数学A ma3-07 と同じ）、直方体の図は奥へ 0.5・0.42 倍。 */
(function () {
  const POINTS = [
    '空間の点は $(a,\\ b,\\ c)$。空間のベクトルは成分 $(a_1,\\ a_2,\\ a_3)$ で表し、大きさは $\\sqrt{a_1^2+a_2^2+a_3^2}$',
    '和・差・実数倍は **成分ごと**、$\\overrightarrow{\\mathrm{AB}}$ は（終点）−（始点）。平面と同じで、成分が1つふえるだけ',
    '平行 ⇔ $\\vec{b}=k\\vec{a}$（3つの成分が同じ $k$ 倍）。同じ平面上にない $\\vec{a},\\ \\vec{b},\\ \\vec{c}$ で、どんなベクトルも $s\\vec{a}+t\\vec{b}+u\\vec{c}$ にただ1通りに表せる'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  // 座標の見取図：x 軸は左下へ
  const pj = (x, y, z) => [y - 0.45 * x, z - 0.38 * x];
  const O3 = pj(0, 0, 0), A3 = pj(2, 0, 0), B3 = pj(0, 4, 0), C3 = pj(0, 0, 4), H3 = pj(2, 4, 0), E3 = pj(0, 4, 4), F3 = pj(2, 0, 4), P3 = pj(2, 4, 4);
  const box3 = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.2, -1.8, 6.0, 5.4], w: 569, h: 500, items: [
    ar(O3, pj(3.4, 0, 0), 'd', 2.5), ar(O3, pj(0, 5.4, 0), 'd', 2.5), ar(O3, pj(0, 0, 5.0), 'd', 2.5),
    lb(pj(3.4, 0, 0), 'x', 'd', -16, 8), lb(pj(0, 5.4, 0), 'y', 'd', 0, 20), lb(pj(0, 0, 5.0), 'z', 'd', 16, 0),
    lb(O3, 'O', 'w', -18, -6, 22),
    { k: 'poly', pts: [A3, H3, P3, F3], close: true, c: 'w', wd: 2 }, { k: 'seg', a: B3, b: H3, wd: 2 }, { k: 'seg', a: B3, b: E3, wd: 2 }, { k: 'seg', a: E3, b: P3, wd: 2 },
    { k: 'seg', a: C3, b: F3, wd: 2 }, { k: 'seg', a: C3, b: E3, wd: 2 },
    lb(A3, '2', 'b', -16, -10), lb(B3, '4', 'b', 4, 20), lb(C3, '4', 'b', -16, 0),
    { k: 'pt', at: P3, name: 'P', dir: 'n', off: 20, dx: -14, c: 'y', r: 6 }].concat(extra || []) });
  // 直方体 OABC-DEFG：右へ a、奥へ b、上へ c（右へ 4、奥へ 2.4、上へ 2.2）
  const pq = (r, b, u) => [r + 0.5 * b, u + 0.42 * b];
  const Q = { O: pq(0, 0, 0), A: pq(4, 0, 0), B: pq(4, 2.4, 0), C: pq(0, 2.4, 0), D: pq(0, 0, 2.2), E: pq(4, 0, 2.2), F: pq(4, 2.4, 2.2), G: pq(0, 2.4, 2.2) };
  const cuboid = () => ({ t: 'fig', id: 'cb', col: 1, view: [-0.7, -0.7, 5.9, 3.7], w: 640, h: 427, items: [
    { k: 'seg', a: Q.C, b: Q.O, c: 'd', dash: true, wd: 2 }, { k: 'seg', a: Q.C, b: Q.B, c: 'd', dash: true, wd: 2 }, { k: 'seg', a: Q.C, b: Q.G, c: 'd', dash: true, wd: 2 },
    { k: 'poly', pts: [Q.O, Q.A, Q.E, Q.D], close: true, c: 'w', wd: 2 }, { k: 'seg', a: Q.A, b: Q.B, wd: 2 }, { k: 'seg', a: Q.B, b: Q.F, wd: 2 },
    { k: 'seg', a: Q.E, b: Q.F, wd: 2 }, { k: 'seg', a: Q.D, b: Q.G, wd: 2 }, { k: 'seg', a: Q.G, b: Q.F, wd: 2 },
    ar(Q.O, Q.A, 'y', 4), vl([2, 0], 'a', 'y', 0, 24), ar(Q.O, Q.C, 'b', 3.5, true), vl([0.6, 0.504], 'b', 'b', 18, -8), ar(Q.O, Q.D, 'g', 4), vl([0, 1.1], 'c', 'g', -22, 0),
    { k: 'pt', at: Q.O, name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: Q.A, name: 'A', dir: 'se', r: 4 }, { k: 'pt', at: Q.B, name: 'B', dir: 'e', r: 4 }, { k: 'pt', at: Q.C, name: 'C', dir: 'n', r: 4, off: 18, dx: 10 },
    { k: 'pt', at: Q.D, name: 'D', dir: 'w', r: 4 }, { k: 'pt', at: Q.E, name: 'E', dir: 'se', r: 4 }, { k: 'pt', at: Q.F, name: 'F', dir: 'ne', r: 4 }, { k: 'pt', at: Q.G, name: 'G', dir: 'nw', r: 4 }] });

  HB.lesson({
    id: 'mc1-07', field: '数学C　ベクトル', title: '空間の座標とベクトル', level: '空間のベクトル', time: '目安 8分',
    noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　点 $(3,\\ -1,\\ 2)$ と $y$ 軸に関して対称な点の座標を求めよ。', '(2)　A$(1,\\ -2,\\ 3)$、B$(3,\\ 1,\\ -3)$ のとき、$\\overrightarrow{\\mathrm{AB}}$ の成分と大きさを求めよ。',
        '(3)　$\\vec{a}=(2,\\ -1,\\ 3)$ と $\\vec{b}=(x,\\ 2,\\ y)$ が平行になる $x,\\ y$ を求めよ。', '(4)　3点 A$(1,\\ 0,\\ 2)$、B$(3,\\ 1,\\ -1)$、C$(x,\\ y,\\ 5)$ が一直線上にあるときの $x,\\ y$ を求めよ。',
        '(5)　直方体 OABC-DEFG で $\\overrightarrow{\\mathrm{OA}}=\\vec{a},\\ \\overrightarrow{\\mathrm{OC}}=\\vec{b},\\ \\overrightarrow{\\mathrm{OD}}=\\vec{c}$ とするとき、$\\overrightarrow{\\mathrm{AG}}$ を $\\vec{a},\\ \\vec{b},\\ \\vec{c}$ で表せ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: 'めあて', say: 'ここから **空間のベクトル** です。数学Aで空間の座標を学びました。平面のベクトルで学んだことの多くが、成分を1つふやすだけで、空間でもそのまま使えます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '空間の点を座標で表し、空間のベクトルを **成分** で表せる\n大きさ・和・差・実数倍・**平行** を、平面と同じように計算できる' }] },

      // ---------- 空間の座標 ----------
      { clear: true, part: '空間の座標', say: '原点 O で互いに垂直に交わる $x$ 軸・$y$ 軸・$z$ 軸をとると、空間の点は **3つの数の組** で表せます。図の点 P は $(2,\\ 4,\\ 4)$ です。',
        add: [{ t: 'h', text: '空間の座標' },
          { t: 'p', size: 'sm', text: '$x$ 座標 2、$y$ 座標 4、$z$ 座標 4\n→ P$(2,\\ 4,\\ 4)$' },
          box3('bx')] },
      { say: '対称な点は、**基準に垂直な向きの座標の符号** が変わります。$xy$ 平面なら $z$ だけ、$x$ 軸なら $y$ と $z$、原点なら3つとも変わります。',
        add: [{ t: 'tbl', cls: 'rowh', size: 'sm', rows: [['基準', '$(a,\\ b,\\ c)$ と対称な点'], ['$xy$ 平面', '$(a,\\ b,\\ -c)$'], ['$x$ 軸', '$(a,\\ -b,\\ -c)$'], ['原点', '$(-a,\\ -b,\\ -c)$']] }] },
      { ask: { type: 'choice', q: '点 $(3,\\ -1,\\ 2)$ と **$y$ 軸** に関して対称な点は？',
        opts: ['$(-3,\\ -1,\\ -2)$', '$(3,\\ 1,\\ 2)$', '$(-3,\\ 1,\\ -2)$', '$(-3,\\ -1,\\ 2)$'], ok: 0,
        why: { 1: 'それは $zx$ 平面に関して対称な点です。', 2: 'それは原点に関して対称な点です。', 3: 'それは $yz$ 平面に関して対称な点です。' },
        good: '$y$ 軸のまわりに半回転させるので、$y$ 座標はそのまま、$x$ と $z$ の符号が変わります。',
        add: [{ t: 'm', size: 'sm', tex: '(3,\\ -1,\\ 2)\\ \\to\\ (-3,\\ -1,\\ -2)', note: '$y$ 軸に関して対称' }] } },

      // ---------- 空間のベクトル ----------
      { clear: true, part: '空間のベクトル', say: '空間のベクトルも、向きと大きさをもつ量です。各軸の向きの基本ベクトル $\\vec{e_1},\\ \\vec{e_2},\\ \\vec{e_3}$ を使うと、$\\overrightarrow{\\mathrm{OP}}=2\\vec{e_1}+4\\vec{e_2}+4\\vec{e_3}$。これを $(2,\\ 4,\\ 4)$ と書きます。',
        add: [{ t: 'h', text: '空間のベクトルの成分' },
          { t: 'box', c: 'y', label: '成分', tex: '\\vec{a}=a_1\\vec{e_1}+a_2\\vec{e_2}+a_3\\vec{e_3}=(a_1,\\ a_2,\\ a_3)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=2\\vec{e_1}+4\\vec{e_2}+4\\vec{e_3}=(2,\\ 4,\\ 4)' },
          box3('bv', [ar(O3, pj(1, 0, 0), 'g', 5), ar(O3, pj(0, 1, 0), 'g', 5), ar(O3, pj(0, 0, 1), 'g', 5),
            vl(pj(1, 0, 0), 'e₁', 'g', -24, -6, 24), vl(pj(0, 1, 0), 'e₂', 'g', 0, -22, 24), vl(pj(0, 0, 1), 'e₃', 'g', -26, 0, 24),
            ar(O3, P3, 'y', 4)])] },
      { say: '大きさは、三平方の定理を2回使って $|\\vec{a}|=\\sqrt{a_1^2+a_2^2+a_3^2}$。$\\overrightarrow{\\mathrm{OP}}=(2,\\ 4,\\ 4)$ なら $\\sqrt{4+16+16}=6$ です。',
        add: [{ t: 'box', c: 'b', label: '大きさ', tex: '|\\vec{a}|=\\sqrt{a_1^2+a_2^2+a_3^2}' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OP}}|=\\sqrt{2^2+4^2+4^2}=\\sqrt{36}=6' }],
        draw: [{ fig: 'bv', items: [{ k: 'seg', a: O3, b: H3, c: 'p', dash: true, wd: 2.5 }, { k: 'seg', a: H3, b: P3, c: 'p', wd: 2.5 }, { k: 'right', o: H3, a: O3, b: P3, s: 13, c: 'p' }, { k: 'pt', at: H3, name: 'H', dir: 'se', r: 4, c: 'p' }] }] },

      // ---------- 成分による計算 ----------
      { clear: true, cols: [1], part: '成分による計算', say: '和・差・実数倍は成分ごと、$\\overrightarrow{\\mathrm{AB}}$ は（終点）−（始点）。平面のときと同じで、成分が1つふえるだけです。',
        add: [{ t: 'h', text: '成分による計算' },
          { t: 'p', size: 'sm', text: '例　$\\vec{a}=(1,\\ 2,\\ -1),\\ \\vec{b}=(2,\\ -1,\\ 3)$ のとき' },
          { t: 'm', size: 'sm', tex: '\\vec{a}+\\vec{b}=(3,\\ 1,\\ 2),\\qquad 2\\vec{a}-\\vec{b}=(0,\\ 5,\\ -5),\\qquad |2\\vec{a}-\\vec{b}|=\\sqrt{0+25+25}=5\\sqrt2' },
          { t: 'p', size: 'sm', text: '例　A$(1,\\ -2,\\ 3)$、B$(3,\\ 1,\\ -3)$ のとき' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(3-1,\\ 1-(-2),\\ -3-3)=(2,\\ 3,\\ -6)' }] },
      { ask: { type: 'choice', q: 'A$(1,\\ -2,\\ 3)$、B$(3,\\ 1,\\ -3)$ のとき、$|\\overrightarrow{\\mathrm{AB}}|$ は？',
        opts: ['$\\sqrt{13}$', '$7$', '$11$', '$1$'], ok: 1,
        why: { 0: '$z$ 成分の $-6$ を入れ忘れています。', 2: '$2+3+6$ と足しています。2乗して足し、ルートをとります。', 3: '成分をそのまま足しています（$2+3-6$）。' },
        good: '$\\sqrt{2^2+3^2+(-6)^2}=\\sqrt{49}=7$。',
        add: [{ t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|=\\sqrt{2^2+3^2+(-6)^2}=\\sqrt{49}=7' }] } },

      // ---------- 平行 ----------
      { clear: true, cols: [1], part: '平行条件', say: '平行の条件も平面と同じです。$\\vec{a}\\parallel\\vec{b}\\iff\\vec{b}=k\\vec{a}$。成分で、**3つの成分がすべて同じ $k$ 倍** になっているかを見ます。',
        add: [{ t: 'h', text: '平行条件' },
          { t: 'box', c: 'p', label: '平行条件', tex: '\\vec{a}\\parallel\\vec{b}\\iff \\vec{b}=k\\vec{a}\\iff (b_1,\\ b_2,\\ b_3)=(ka_1,\\ ka_2,\\ ka_3)' },
          { t: 'p', size: 'sm', text: '（$\\vec{a}\\neq\\vec{0},\\ \\vec{b}\\neq\\vec{0}$ のとき）　わかっている成分から $k$ を先に決める' }] },
      { ask: { type: 'choice', q: '$\\vec{a}=(2,\\ -1,\\ 3)$ と $\\vec{b}=(x,\\ 2,\\ y)$ が平行になる $x,\\ y$ は？',
        opts: ['$x=4,\\ y=6$', '$x=-4,\\ y=-6$', '$x=-1,\\ y=-\\frac32$', '$x=-4,\\ y=6$'], ok: 1,
        why: { 0: '$y$ 成分を見ると $2=-1\\times k$ で $k=-2$。符号に注意。', 2: '$k=-\\frac12$ と逆にしています。$\\vec{b}=k\\vec{a}$ の $y$ 成分は $2=-k$。', 3: '$y=3k=-6$ です。$k=-2$ を両方にかけます。' },
        good: '$y$ 成分から $2=-k$、$k=-2$。$x=2k=-4$、$y=3k=-6$。',
        add: [{ t: 'm', size: 'sm', tex: '(x,\\ 2,\\ y)=k(2,\\ -1,\\ 3)\\ \\text{より}\\ k=-2,\\ \\ x=-4,\\ y=-6' }] } },
      { ask: { type: 'think', q: '3点 A$(1,\\ 0,\\ 2)$、B$(3,\\ 1,\\ -1)$、C$(x,\\ y,\\ 5)$ が一直線上にあるとき、$x,\\ y$ を求めよう。',
        hint: '$\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$ とおく。$z$ 成分から $k$ が決まる。',
        ans: '$\\overrightarrow{\\mathrm{AB}}=(2,\\ 1,\\ -3)$、$\\overrightarrow{\\mathrm{AC}}=(x-1,\\ y,\\ 3)$。$3=-3k$ より $k=-1$　　$x=-1,\\ y=-1$',
        after: '平面の「一直線上」と同じ考え方。空間でも $\\overrightarrow{\\mathrm{AC}}=k\\overrightarrow{\\mathrm{AB}}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '(x-1,\\ y,\\ 3)=k(2,\\ 1,\\ -3)\\ \\text{より}\\ k=-1,\\ \\ x=-1,\\ y=-1' }] } },

      // ---------- 直方体と分解 ----------
      { clear: true, part: '直方体とベクトル', say: '直方体 OABC-DEFG で $\\overrightarrow{\\mathrm{OA}}=\\vec{a},\\ \\overrightarrow{\\mathrm{OC}}=\\vec{b},\\ \\overrightarrow{\\mathrm{OD}}=\\vec{c}$ とします。たとえば対角線 $\\overrightarrow{\\mathrm{OF}}$ は $\\vec{a}+\\vec{b}+\\vec{c}$ です。',
        add: [{ t: 'h', text: '直方体とベクトル' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OB}}=\\vec{a}+\\vec{b}', note: '底面の対角線' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OF}}=\\vec{a}+\\vec{b}+\\vec{c}', note: '立体の対角線' },
          { t: 'p', size: 'sm', text: 'O → A → B → F と、辺にそって\n進むと考える' },
          cuboid()] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AG}}$ を $\\vec{a},\\ \\vec{b},\\ \\vec{c}$ で表すと？',
        opts: ['$\\vec{a}+\\vec{b}+\\vec{c}$', '$\\vec{a}-\\vec{b}+\\vec{c}$', '$-\\vec{a}+\\vec{b}+\\vec{c}$', '$-\\vec{a}+\\vec{b}-\\vec{c}$'], ok: 2,
        why: { 0: 'それは $\\overrightarrow{\\mathrm{OF}}$。始点は A です。', 1: 'A から G へは $\\vec{b}$ の向き（奥）に進むので＋、$\\vec{a}$ の向きには戻るので−です。', 3: 'G は上の面にあるので、$\\vec{c}$ は＋です。' },
        good: '$\\overrightarrow{\\mathrm{AG}}=\\overrightarrow{\\mathrm{OG}}-\\overrightarrow{\\mathrm{OA}}=(\\vec{b}+\\vec{c})-\\vec{a}$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AG}}=\\overrightarrow{\\mathrm{OG}}-\\overrightarrow{\\mathrm{OA}}=-\\vec{a}+\\vec{b}+\\vec{c}' }],
        draw: [{ fig: 'cb', items: [ar(Q.A, Q.G, 'p', 4)] }] } },
      { say: '空間では、同じ平面上にない3つのベクトル $\\vec{a},\\ \\vec{b},\\ \\vec{c}$ を使うと、どんなベクトルも $s\\vec{a}+t\\vec{b}+u\\vec{c}$ の形に **ただ1通り** に表せます。空間の図形の問題で使います。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '空間の分解', tex: '\\vec{p}=s\\vec{a}+t\\vec{b}+u\\vec{c}\\ \\ (\\text{ただ1通り})' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、空間のベクトルの **内積** です。なす角・垂直・面積を、成分で計算します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
