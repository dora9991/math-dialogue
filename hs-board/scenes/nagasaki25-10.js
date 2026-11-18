/* 長崎大型 数学（理系）：2025年度 長崎大学 前期 医学部医学科（型Ⅳ）第10問の類題（自作問題・元の問題ではない）
   問題：C1: x²+y²=4, z=0、C2: x²+y²=1, z=3。P(2cosθ, 2sinθ, 0)、Q(cos(θ+α), sin(θ+α), 3)（0≦α≦π）。線分 PQ を回してできる立体
   答え（python3・sympy で検算ずみ）：
     (1) R = (1−s)P + sQ = (2(1−s)cosθ + s cos(θ+α), 2(1−s)sinθ + s sin(θ+α), 3s)
     (2) d² = 4(1−s)² + s² + 4s(1−s)cosα = (5−4c)s² − (8−4c)s + 4（c=cosα、θ によらない）
         軸 s* = (4−2c)/(5−4c)。s*≦1 ⇔ c≦1/2
         0≦α≦π/3：s=1 で最小値 1　／　π/3<α≦π：最小値 4sin²α/(5−4cosα)（数値でも確認）
     (3) V = ∫₀³ πd² dz = 3π∫₀¹ d² ds = 3π(5+2c)/3 = π(5+2cosα)
     (4) 最大 7π（α=0：円すい台。8π−π=7π）、最小 3π（α=π：d=|2−3s|、頂点 (0,0,2) を共有する2つの円すい 8π/3+π/3）
         V=5π ⇔ α=π/2 */
(function () {
  const PI = Math.PI, AZ = 25 * PI / 180, EL = 18 * PI / 180;
  const pj = (x, y, z, ox) => [-x * Math.sin(AZ) + y * Math.cos(AZ) + (ox || 0), z * Math.cos(EL) - (x * Math.cos(AZ) + y * Math.sin(AZ)) * Math.sin(EL)];
  const arcPts = (r, h, a0, a1, ox) => { const out = []; for (let i = 0; i <= 72; i++) { const u = a0 + (a1 - a0) * i / 72; out.push(pj(r * Math.cos(u), r * Math.sin(u), h, ox)); } return out; };
  const ring = (r, h, c, wd, back, ox) => back
    ? [{ k: 'poly', pts: arcPts(r, h, AZ - PI / 2, AZ + PI / 2, ox), c, wd }, { k: 'poly', pts: arcPts(r, h, AZ + PI / 2, AZ + 1.5 * PI, ox), c, wd: wd * 0.7, dash: true }]
    : [{ k: 'poly', pts: arcPts(r, h, 0, 2 * PI, ox), c, wd }];
  const Pp = (th, ox) => pj(2 * Math.cos(th), 2 * Math.sin(th), 0, ox), Qp = (th, al, ox) => pj(Math.cos(th + al), Math.sin(th + al), 3, ox);
  const gens = (al, ox, c) => { const a = []; for (let k = 0; k < 12; k++) { const th = k * PI / 6 + 0.12; a.push({ k: 'seg', a: Pp(th, ox), b: Qp(th, al, ox), c: c || 'b', wd: 1.5 }); }
    [AZ + PI / 2, AZ - PI / 2].forEach(th => a.push({ k: 'seg', a: Pp(th, ox), b: Qp(th, al, ox), c: c || 'b', wd: 2.5 })); return a; };
  const zaxis = ox => [{ k: 'vec', a: pj(0, 0, 0, ox), b: pj(0, 0, 4.0, ox), c: 'd', wd: 2 }, { k: 'label', at: pj(0, 0, 4.0, ox), text: 'z', c: 'd', size: 22, dx: 14 }];
  const AL = 2 * PI / 3, TH = -0.75, S0 = 0.4;
  const R0 = (th, al, s) => pj(2 * (1 - s) * Math.cos(th) + s * Math.cos(th + al), 2 * (1 - s) * Math.sin(th) + s * Math.sin(th + al), 3 * s);
  const solid = (id, extra, o) => { o = o || {}; return { t: 'fig', id, col: 1, view: [-2.4, -0.9, 2.4, 4.0], w: o.w || 520, h: Math.round((o.w || 520) * 4.9 / 4.8), items: [].concat(
    zaxis(), ring(2, 0, 'y', 3, true), gens(AL), ring(1, 3, 'b', 3, false),
    [{ k: 'label', at: pj(2 * Math.cos(1.6), 2 * Math.sin(1.6), 0), text: 'C₁', c: 'y', size: 22, dx: 18, dy: 4 }, { k: 'label', at: pj(Math.cos(AZ - PI / 2), Math.sin(AZ - PI / 2), 3), text: 'C₂', c: 'b', size: 22, dx: -26 }],
    extra || []) }; };
  const hiPQ = [{ k: 'seg', a: Pp(TH), b: Qp(TH, AL), c: 'p', wd: 4 }, { k: 'pt', at: Pp(TH), name: 'P', dir: 's', c: 'y', size: 22 }, { k: 'pt', at: Qp(TH, AL), name: 'Q', dir: 'ne', c: 'b', size: 22 },
    { k: 'pt', at: R0(TH, AL, S0), name: 'R', dir: 'e', c: 'p', size: 22 }];
  // 真上から見た図（xy 平面）
  const T2 = -0.3, Pt = [2 * Math.cos(T2), 2 * Math.sin(T2)], Qt = [Math.cos(T2 + AL), Math.sin(T2 + AL)], Rt = [(1 - S0) * Pt[0] + S0 * Qt[0], (1 - S0) * Pt[1] + S0 * Qt[1]];
  const top = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.5, -2.4, 2.6, 2.5], w: 440, h: 423, items: [
    { k: 'axes', tx: [[2, '2']], ty: [[2, '2']], xl: 'x', yl: 'y' },
    { k: 'circle', o: [0, 0], r: 2, c: 'y', wd: 2.5 }, { k: 'circle', o: [0, 0], r: 1, c: 'b', wd: 2.5 },
    { k: 'seg', a: [0, 0], b: Pt, c: 'y', wd: 2 }, { k: 'seg', a: [0, 0], b: Qt, c: 'b', wd: 2 },
    { k: 'angle', o: [0, 0], a: Pt, b: Qt, rp: 34, label: 'α', c: 'w', lr: 16 },
    { k: 'seg', a: Pt, b: Qt, c: 'w', wd: 2.5 },
    { k: 'pt', at: Pt, name: 'P′', dir: 'e', c: 'y', size: 22 }, { k: 'pt', at: Qt, name: 'Q′', dir: 'nw', c: 'b', size: 22 }].concat(extra || []) });
  // d² のグラフ（s の 2 次関数）
  const dfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.18, -0.45, 1.3, 4.6], w: 470, h: 330, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1, '1'], [4, '4']], xl: 's', yl: 'd²' },
    { k: 'line', x: 1, dash: true, c: 'd' },
    { k: 'fn', f: '(5-4*cos(PI/6))*x**2-(8-4*cos(PI/6))*x+4', a: 0, b: 1, c: 'y', wd: 3 },
    { k: 'fn', f: '7*x**2-10*x+4', a: 0, b: 1, c: 'b', wd: 3 },
    { k: 'label', at: [0.36, 2.9], text: 'α = π/6', c: 'y', size: 20, anchor: 'start' }, { k: 'label', at: [0.12, 1.9], text: 'α = 2π/3', c: 'b', size: 20, anchor: 'end' }].concat(extra || []) });
  // (4) α=0（円すい台）と α=π（2つの円すい）
  const two = (id, extra) => ({ t: 'fig', id, col: 1, view: [-5.0, -1.25, 5.0, 4.15], w: 640, h: 346, items: [].concat(
    zaxis(-2.5), ring(2, 0, 'y', 2.5, true, -2.5), gens(0, -2.5, 'g'), ring(1, 3, 'b', 2.5, false, -2.5),
    zaxis(2.5), ring(2, 0, 'y', 2.5, true, 2.5), gens(PI, 2.5, 'p'), ring(1, 3, 'b', 2.5, false, 2.5),
    [{ k: 'label', at: [-2.5, -1.05], text: 'α = 0', c: 'g', size: 22 }, { k: 'label', at: [2.5, -1.05], text: 'α = π', c: 'p', size: 22 }],
    extra || []) });
  const POINTS = [
    '空間の線分を回す問題は、まず **軸からの距離の2乗** $d^2$ を高さの文字（$s$）で表す。$\\theta$ が消えれば、各高さで点は円をえがく',
    '体積は「軸に垂直な断面＝半径 $d$ の円」の面積 $\\pi d^2$ を積分。$z=3s$ と置きかえるときは $dz=3\\,ds$ を忘れない',
    '2次関数の最小は **軸が範囲の中か外か** で場合分け。ずらす角 $\\alpha$ で立体は 円すい台（$\\alpha=0$）から 2つの円すい（$\\alpha=\\pi$）まで変わる'
  ];

  HB.lesson({
    id: 'nagasaki25-10', field: '長崎大型　数学（理系）', title: '2025 長崎大 理系 第10問の類題 ― 半径のちがう2円を結ぶ線分を回した立体の体積', level: '2025年度 長崎大学 理系 第10問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 つの円 $C_1:\\ x^2+y^2=4,\\ z=0$ と $C_2:\\ x^2+y^2=1,\\ z=3$ がある。$\\alpha$ を $0\\le\\alpha\\le\\pi$ を満たす定数とし、実数 $\\theta$ に対して 2 点 P$(2\\cos\\theta,\\ 2\\sin\\theta,\\ 0)$，Q$(\\cos(\\theta+\\alpha),\\ \\sin(\\theta+\\alpha),\\ 3)$ をとる。',
      parts: [
        '(1)　$0\\le s\\le1$ とする。線分 PQ を $s:(1-s)$ に内分する点 R の座標を、$\\theta,\\ \\alpha,\\ s$ を用いて表せ。',
        '(2)　R と $z$ 軸との距離を $d$ とする。$d^2$ を $s,\\ \\alpha$ で表せ。また、$\\alpha$ を固定して $s$ を $0\\le s\\le1$ の範囲で動かすとき、$d^2$ の最小値を求めよ。',
        '(3)　$\\theta$ を $0$ から $2\\pi$ まで動かすとき、線分 PQ が通過してできる曲面と 2 平面 $z=0,\\ z=3$ で囲まれた立体の体積 $V(\\alpha)$ を求めよ。',
        '(4)　$\\alpha$ が $0\\le\\alpha\\le\\pi$ の範囲を動くとき、$V(\\alpha)$ の最大値と最小値を求めよ。また、それぞれのときの立体はどのような形か。'
      ],
      src: '※ 2025年度 長崎大学 前期 理系（医学部医学科）第10問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '空間の線分をぐるっと回してできる立体の体積です。「軸からの距離」と「断面の円」がキーワード。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.5, 0.5], part: '(1)', say: '図は $\\alpha=\\frac{2\\pi}{3}$ の例です。$\\theta$ を動かすと P（下の円）と Q（上の円）が同時に回り、線分 PQ（ピンク）が青い線のように曲面をえがきます。',
        add: [{ t: 'h', text: '(1)　内分点 R の座標' },
          { t: 'p', size: 'sm', text: 'P は $C_1$（半径 2，$z=0$）の上、Q は $C_2$（半径 1，$z=3$）の上\nQ は、真上から見ていつも P より **角 $\\alpha$ だけ先** にある' },
          solid('s1', hiPQ, { w: 470 })] },
      { ask: { type: 'choice', q: '線分 PQ を $s:(1-s)$ に内分する点 R は？',
        opts: ['$\\overrightarrow{\\mathrm{OR}}=s\\overrightarrow{\\mathrm{OP}}+(1-s)\\overrightarrow{\\mathrm{OQ}}$', '$\\overrightarrow{\\mathrm{OR}}=\\overrightarrow{\\mathrm{OP}}+s\\overrightarrow{\\mathrm{OQ}}$', '$\\overrightarrow{\\mathrm{OR}}=(1-s)\\overrightarrow{\\mathrm{OP}}+s\\overrightarrow{\\mathrm{OQ}}$', '$\\overrightarrow{\\mathrm{OR}}=\\dfrac{\\overrightarrow{\\mathrm{OP}}+\\overrightarrow{\\mathrm{OQ}}}{2}$'], ok: 2,
        why: { 0: '係数が逆です。$s=0$ のとき R は P になるはず。', 1: 'これは $\\overrightarrow{\\mathrm{PQ}}$ ではなく $\\overrightarrow{\\mathrm{OQ}}$ を足しています。$\\overrightarrow{\\mathrm{OP}}+s\\overrightarrow{\\mathrm{PQ}}$ なら正しい。', 3: 'それは中点（$s=\\frac12$）だけです。' },
        good: '$s:(1-s)$ に内分する点は $(1-s)\\overrightarrow{\\mathrm{OP}}+s\\overrightarrow{\\mathrm{OQ}}$。$z$ 座標は $3s$ です。',
        add: [{ t: 'ans', label: '(1) 答', text: '$x=2(1-s)\\cos\\theta+s\\cos(\\theta+\\alpha)$\n$y=2(1-s)\\sin\\theta+s\\sin(\\theta+\\alpha)$\n$z=3s$' }] } },

      // ---------- (2) d² ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: 'R と $z$ 軸の距離は、真上から見た図で O と R′ の距離。だから $d^2=x^2+y^2$ です。展開すると、$\\cos^2+\\sin^2=1$ でまとまる項と、かけ合わせの項が出ます。',
        add: [{ t: 'h', text: '(2)　z 軸との距離 d' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}d^2&=x^2+y^2\\\\ &=4(1-s)^2+s^2\\\\ &\\quad+4s(1-s)\\{\\cos\\theta\\cos(\\theta+\\alpha)+\\sin\\theta\\sin(\\theta+\\alpha)\\}\\end{aligned}' },
          top('t1', [{ k: 'seg', a: [0, 0], b: Rt, c: 'p', wd: 3 }, { k: 'pt', at: Rt, name: 'R′', dir: 'ne', c: 'p', size: 22 }, { k: 'label', at: [Rt[0] / 2, Rt[1] / 2], text: 'd', c: 'p', size: 24, dx: 6, dy: 16 }])] },
      { ask: { type: 'choice', q: '$\\cos\\theta\\cos(\\theta+\\alpha)+\\sin\\theta\\sin(\\theta+\\alpha)$ は？',
        opts: ['$\\cos(2\\theta+\\alpha)$', '$\\cos\\alpha$', '$\\sin\\alpha$', '$\\cos\\theta\\cos\\alpha$'], ok: 1,
        why: { 0: '加法定理 $\\cos A\\cos B+\\sin A\\sin B$ は $\\cos(A-B)$。和ではなく差です。', 2: '$\\cos$ どうし・$\\sin$ どうしの積の和は $\\cos(A-B)$ です。', 3: '加法定理でまとめると、$\\theta$ はすべて消えます。' },
        good: '$\\cos\\{(\\theta+\\alpha)-\\theta\\}=\\cos\\alpha$。$\\theta$ が消えます。',
        add: [{ t: 'm', tex: 'd^2=4(1-s)^2+s^2+4s(1-s)\\cos\\alpha', note: '$\\theta$ をふくまない' }] } },
      { say: '$d^2$ に $\\theta$ がない！　高さ $z=3s$ の点 R は、$\\theta$ を動かしても $z$ 軸からの距離が変わりません。つまり R は **$z$ 軸を中心とする円** をえがきます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '大事', text: '高さ $z=3s$ ごとに、R は半径 $d$ の円をえがく\n→ この曲面は $z$ 軸のまわりの **回転面**\n（真上から見ると、△OP′Q′ の余弦定理と同じ形）' }] },

      // ---------- (2) 最小値 ----------
      { clear: true, cols: [0.56, 0.44], part: '(2) 最小', say: '$c=\\cos\\alpha$ とおいて、$s$ について整理します。$s^2$ の係数 $5-4c$ は正なので、下に凸の放物線。最小は「軸」の位置しだいです。',
        add: [{ t: 'h', text: '(2)　d² の最小値' },
          { t: 'm', size: 'sm', tex: 'd^2=(5-4c)s^2-(8-4c)s+4', note: '$c=\\cos\\alpha$' },
          { t: 'm', size: 'sm', tex: '\\text{軸：}\\ s=\\frac{4-2c}{5-4c}\\ (>0)' },
          dfig('d1', [{ k: 'pt', at: [1, 1], c: 'y' }, { k: 'pt', at: [5 / 7, 3 / 7], c: 'b' }])] },
      { ask: { type: 'choice', q: '軸 $s=\\dfrac{4-2c}{5-4c}$ が $0\\le s\\le1$ の中にあるのは？',
        opts: ['$\\cos\\alpha\\ge\\dfrac12$ のとき', 'どんな $\\alpha$ でもない', 'どんな $\\alpha$ でも', '$\\cos\\alpha\\le\\dfrac12$ のとき'], ok: 3,
        why: { 0: '不等号が逆です。$4-2c\\le5-4c\\iff c\\le\\frac12$。', 1: '$\\alpha=\\frac{2\\pi}{3}$（青）では、軸は $s=\\frac57$ で範囲の中です。', 2: '$\\alpha=\\frac{\\pi}{6}$（黄）では、軸が 1 より右にあり、$s=1$ で最小です。' },
        good: '$5-4c>0$ なので、$\\frac{4-2c}{5-4c}\\le1\\iff4-2c\\le5-4c\\iff c\\le\\frac12$。つまり $\\frac{\\pi}{3}\\le\\alpha\\le\\pi$。' } },
      { ask: { type: 'think', q: '場合を分けて、$d^2$ の最小値を求めよう。',
        hint: '$0\\le\\alpha<\\frac{\\pi}{3}$ なら $s=1$ で最小。$\\frac{\\pi}{3}\\le\\alpha\\le\\pi$ なら軸で最小（平方完成）。',
        ans: '$0\\le\\alpha\\le\\frac{\\pi}{3}$ のとき 1（$s=1$）\n$\\frac{\\pi}{3}<\\alpha\\le\\pi$ のとき $4-\\dfrac{(4-2c)^2}{5-4c}=\\dfrac{4(1-c^2)}{5-4c}=\\dfrac{4\\sin^2\\alpha}{5-4\\cos\\alpha}$',
        after: '$\\alpha=\\frac{\\pi}{3}$ では、どちらの式も 1 になってつながります。$\\alpha$ が小さいと、いちばん細いのは上の円そのものです。',
        add: [{ t: 'ans', label: '(2) 答', text: '$0\\le\\alpha\\le\\frac{\\pi}{3}$：最小値 $1$\n$\\frac{\\pi}{3}<\\alpha\\le\\pi$：最小値 $\\dfrac{4\\sin^2\\alpha}{5-4\\cos\\alpha}$' }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.54, 0.46], part: '(3)', say: '(2) から、高さ $z=3s$ で立体を $z$ 軸に垂直に切ると、断面は **半径 $d$ の円**（ピンク）。その面積 $\\pi d^2$ を $z$ で積分します。',
        add: [{ t: 'h', text: '(3)　体積 V(α)' },
          { t: 'm', tex: 'V=\\int_0^3\\pi d^2\\,dz' },
          solid('s2', [{ k: 'poly', pts: arcPts(Math.sqrt(1.12), 1.2, 0, 2 * PI), c: 'p', wd: 2.5, fill: 'p', alpha: 0.3 }, { k: 'pt', at: R0(TH, AL, S0), name: 'R', dir: 'w', c: 'p', size: 22 },
            { k: 'seg', a: pj(0, 0, 1.2), b: R0(TH, AL, S0), c: 'p', wd: 2 }, { k: 'label', at: pj(0, 0, 1.2), text: 'd', c: 'p', size: 22, dx: -30, dy: -22 }], { w: 450 })] },
      { ask: { type: 'choice', q: '$z=3s$ と置きかえると、$V$ は？',
        opts: ['$3\\pi\\displaystyle\\int_0^1d^2\\,ds$', '$\\pi\\displaystyle\\int_0^1d^2\\,ds$', '$\\pi\\displaystyle\\int_0^3d^2\\,ds$', '$\\dfrac{\\pi}{3}\\displaystyle\\int_0^1d^2\\,ds$'], ok: 0,
        why: { 1: '$dz=3\\,ds$ の 3 を忘れています。', 2: '$z$ が 0→3 のとき、$s$ は 0→1 です。積分の範囲も変わります。', 3: '$dz=3\\,ds$。3 で割るのではなく、かけます。' },
        good: '$z=3s$ より $dz=3\\,ds$、$z:0\\to3$ のとき $s:0\\to1$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^1(1-s)^2ds=\\int_0^1s^2ds=\\frac13,\\quad \\int_0^1s(1-s)\\,ds=\\frac16' }] } },
      { say: '$d^2=4(1-s)^2+s^2+4s(1-s)\\cos\\alpha$ を項ごとに積分します。$\\frac43+\\frac13+\\frac23\\cos\\alpha$ に $3\\pi$ をかけて完成です。',
        add: [{ t: 'm', size: 'sm', tex: 'V=3\\pi\\Big(\\frac43+\\frac13+\\frac23\\cos\\alpha\\Big)' },
          { t: 'ans', label: '(3) 答', tex: 'V(\\alpha)=\\pi(5+2\\cos\\alpha)' }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.42, 0.58], part: '(4)', say: '$\\cos\\alpha$ は $0\\le\\alpha\\le\\pi$ で減少するので、$V$ は $\\alpha=0$ で最大 $7\\pi$、$\\alpha=\\pi$ で最小 $3\\pi$。図の左が $\\alpha=0$、右が $\\alpha=\\pi$ です。',
        add: [{ t: 'h', text: '(4)　最大・最小と立体の形' },
          { t: 'm', tex: 'V(0)=7\\pi,\\quad V(\\pi)=3\\pi' },
          two('w1')] },
      { ask: { type: 'choice', q: '$\\alpha=\\pi$ のとき、立体はどんな形？',
        opts: ['円柱', '円すい台', '頂点でつながった 2 つの円すい', '1 つの円すい'], ok: 2,
        why: { 0: '円柱になるのは、上下の円の半径が等しく、$\\alpha=0$ のときです。', 1: '円すい台は $\\alpha=0$ のとき（線分がすべて母線）。', 3: '$d=|2-3s|$ は $s=\\frac23$ で 0 になり、そこでくびれます。' },
        good: '$\\alpha=\\pi$ では $d^2=(2-3s)^2$。線分 PQ はすべて点 $(0,\\ 0,\\ 2)$ を通ります。',
        add: [{ t: 'm', size: 'sm', tex: '\\alpha=\\pi:\\ d=|2-3s|', note: '$z=2$ で $d=0$' }] } },
      { say: '$\\alpha=0$ では $d=2-s$ で、半径が 2 から 1 へ一定の割合で変わる **円すい台**。$\\alpha=\\pi$ は、底面の半径 2・高さ 2 と、半径 1・高さ 1 の円すいが頂点 $(0,\\ 0,\\ 2)$ でつながった形です。',
        add: [{ t: 'ans', label: '(4) 答', text: '最大 $7\\pi$（$\\alpha=0$，円すい台）\n最小 $3\\pi$（$\\alpha=\\pi$，頂点を共有する2つの円すい）' }] },
      { ask: { type: 'think', q: '検算：円すいの体積の公式で、$7\\pi$ と $3\\pi$ を確かめよう。',
        hint: '円すい台は、半径 2・高さ 6 の円すいから、半径 1・高さ 3 の円すいを切り取った形。',
        ans: '円すい台：$\\frac13\\pi\\cdot4\\cdot6-\\frac13\\pi\\cdot1\\cdot3=8\\pi-\\pi=7\\pi$\n2つの円すい：$\\frac13\\pi\\cdot4\\cdot2+\\frac13\\pi\\cdot1\\cdot1=3\\pi$',
        after: '積分の答えを、知っている立体の公式で確かめられると安心です。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '$V(\\alpha)=\\pi(5+2\\cos\\alpha)$ は、ずらす角 $\\alpha$ が大きいほど小さくなります。ねじるほど、まん中がくびれていくイメージです。',
        add: [{ t: 'h', text: '別の見方：ねじるとくびれる' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・$d^2$ が $\\theta$ によらないこと（断面が円になる理由）を書く\n・$dz=3\\,ds$ と積分範囲の置きかえ\n・(2) は軸の位置で場合分け（$\\alpha=\\frac{\\pi}{3}$ が境目）' },
          solid('s3', [{ k: 'poly', pts: arcPts(Math.sqrt(3 / 7), 15 / 7, 0, 2 * PI), c: 'p', wd: 2.5, dash: true }], { w: 430 })] },
      { ask: { type: 'choice', q: '$V(\\alpha)=5\\pi$ となる $\\alpha$ は？',
        opts: ['$\\dfrac{\\pi}{3}$', '$\\dfrac{2\\pi}{3}$', '$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{2}$'], ok: 3,
        why: { 0: '$\\cos\\frac{\\pi}{3}=\\frac12$ なので $V=6\\pi$ です。', 1: '$\\cos\\frac{2\\pi}{3}=-\\frac12$ なので $V=4\\pi$ です。', 2: '$V=\\pi(5+\\sqrt2)$ になります。' },
        good: '$5+2\\cos\\alpha=5$ より $\\cos\\alpha=0$、$\\alpha=\\frac{\\pi}{2}$。ちょうど最大と最小のまん中です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の回転体は「軸からの距離の2乗」と「断面の円」の2つで、ほぼ必ず解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
