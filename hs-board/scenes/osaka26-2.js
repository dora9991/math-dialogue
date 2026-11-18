/* 阪大型 数学（理系）：2026年度 大阪大学 前期 理系 第2問の類題（自作問題・元の問題ではない）
   問題：OA=OB=OC=2、∠AOB=∠AOC=90°、∠BOC=60°。OP=t c（0≦t≦1）。Q は平面 ABC 上で PQ·AB=PQ·AC=0
   答え（python3 で検算ずみ）：
     a·a=b·b=c·c=4、a·b=a·c=0、b·c=2
     PQ=x a+y b+(z−t)c：PQ·a=4x、PQ·b=4y+2(z−t)、PQ·c=2y+4(z−t)
     x+y+z=1、−2x+2y+(z−t)=0、−2x+y+2(z−t)=0 → x=3(1−t)/7、y=2(1−t)/7、z=(2+5t)/7
     (1) OQ={3(1−t)a+2(1−t)b+(2+5t)c}/7
     (2) |BQ|²=(16t²−4t+16)/7=(16/7)(t−1/8)²+9/4 → t=1/8 で最小値 3/2
     座標 O(0,0,0) B(2,0,0) C(1,√3,0) A(0,0,2)：Q((6+t)/7, √3(2+5t)/7, 6(1−t)/7)、t=1/8 で Q(7/8, 3√3/8, 3/4)
     BQ=(3a−6b+3c)/8 は Q の動く向き −3a−2b+5c と垂直（内積 −36+48+60−72=0） */
(function () {
  const r3 = Math.sqrt(3);
  const O = [0, 0, 0], A = [0, 0, 2], B = [2, 0, 0], C = [1, r3, 0];
  // 見取図：z 軸のまわりに −165°、上から 34° 見下ろして、左右を入れかえる（O が左、B が右。OB は面 ABC のうしろ）
  const PS = -165 * Math.PI / 180, EL = 34 * Math.PI / 180;
  const pj = v => [-(v[0] * Math.cos(PS) - v[1] * Math.sin(PS)), v[2] * Math.cos(EL) + (v[0] * Math.sin(PS) + v[1] * Math.cos(PS)) * Math.sin(EL)];
  const Pp = t => [t, r3 * t, 0];
  const Qp = t => [(6 + t) / 7, r3 * (2 + 5 * t) / 7, 6 * (1 - t) / 7];
  const lab = (v, text, o) => Object.assign({ k: 'label', at: pj(v), text, size: 24 }, o || {});
  const fig3 = (id, o) => {
    o = o || {};
    const t = o.t == null ? 0.5 : o.t, P = Pp(t), Q = Qp(t);
    const it = [
      { k: 'poly', pts: [A, B, C].map(pj), close: true, fill: 'y', alpha: 0.12, noStroke: true },
      { k: 'seg', a: pj(O), b: pj(B), c: 'd', wd: 2, dash: true },
      { k: 'seg', a: pj(O), b: pj(A), c: 'w', wd: 2.5 }, { k: 'seg', a: pj(O), b: pj(C), c: 'w', wd: 2.5 },
      { k: 'seg', a: pj(A), b: pj(B), c: 'w', wd: 2.5 }, { k: 'seg', a: pj(B), b: pj(C), c: 'w', wd: 2.5 }, { k: 'seg', a: pj(C), b: pj(A), c: 'w', wd: 2.5 },
      { k: 'pt', at: pj(O), name: 'O', dir: 'w', size: 24 }, { k: 'pt', at: pj(A), name: 'A', dir: 'n', size: 24 },
      { k: 'pt', at: pj(B), name: 'B', dir: 'e', size: 24 }, { k: 'pt', at: pj(C), name: 'C', dir: 's', size: 24 }
    ];
    if (o.path) it.push({ k: 'seg', a: pj(Qp(0)), b: pj(C), c: 'g', wd: 3, dash: true }, { k: 'pt', at: pj(Qp(0)), name: 'Q₀', dir: 'n', c: 'g', size: 22, off: 20 });
    if (o.pq !== false) it.push({ k: 'seg', a: pj(P), b: pj(Q), c: 'p', wd: 3.5 }, { k: 'pt', at: pj(P), name: 'P', dir: 'sw', c: 'p', size: 24 }, { k: 'pt', at: pj(Q), name: 'Q', dir: o.qd || 'ne', c: 'y', size: 24 });
    if (o.bq) it.push({ k: 'seg', a: pj(B), b: pj(Q), c: 'b', wd: 4 });
    const all = it.map(p => p.pts || [p.at, p.a, p.b].filter(Boolean)).reduce((s, x) => s.concat(x), []);
    const xs = all.map(q => q[0]), ys = all.map(q => q[1]), m = 0.32;
    const v = [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m];
    const H = o.h || 380, W = Math.round(H * (v[2] - v[0]) / (v[3] - v[1]));
    return { t: 'fig', id, col: 1, view: v, w: W, h: H, items: it.concat(o.items || []) };
  };
  const POINTS = [
    '「4 点 A，B，C，Q が同じ平面上」は、$\\overrightarrow{\\mathrm{OQ}}=x\\vec a+y\\vec b+z\\vec c$ とおいて **係数の和 $x+y+z=1$**',
    '内積の条件は、先に **内積の表**（$|\\vec a|^2$ や $\\vec b\\cdot\\vec c$）を作ってから、$x,\\ y,\\ z$ の連立1次方程式にする',
    '長さの最小は $|\\overrightarrow{\\mathrm{BQ}}|^2$ を $t$ の2次式にして **平方完成**。最小をとる $t$ が範囲に入るかも確かめる'
  ];

  HB.lesson({
    id: 'osaka26-2', field: '阪大型　数学（理系）', title: '2026 阪大 理系 第2問の類題 ― 平面におろした垂線の足と、長さの最小', level: '2026年度 大阪大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '四面体 OABC において、$\\mathrm{OA}=\\mathrm{OB}=\\mathrm{OC}=2$，$\\angle\\mathrm{AOB}=\\angle\\mathrm{AOC}=90^\\circ$，$\\angle\\mathrm{BOC}=60^\\circ$ とし、$\\vec a=\\overrightarrow{\\mathrm{OA}}$，$\\vec b=\\overrightarrow{\\mathrm{OB}}$，$\\vec c=\\overrightarrow{\\mathrm{OC}}$ とする。$0\\le t\\le1$ をみたす実数 $t$ に対し、辺 OC 上の点 P を $\\overrightarrow{\\mathrm{OP}}=t\\vec c$ で定める。さらに点 Q を、4 点 A，B，C，Q が同じ平面上にあり、かつ $\\overrightarrow{\\mathrm{PQ}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$，$\\overrightarrow{\\mathrm{PQ}}\\cdot\\overrightarrow{\\mathrm{AC}}=0$ をみたすように定める。',
      parts: [
        '(1)　$\\overrightarrow{\\mathrm{OQ}}$ を $t,\\ \\vec a,\\ \\vec b,\\ \\vec c$ を用いて表せ。',
        '(2)　$t$ が $0\\le t\\le1$ の範囲を動くとき、線分 BQ の長さの最小値と、そのときの $t$ の値を求めよ。'
      ],
      src: '※ 2026年度 大阪大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの問題です。条件を1つずつ式にしていけば、必ず解ける型。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.52, 0.48], part: '読みかえ', say: 'Q の条件を図で読みます。Q は平面 ABC 上にあって、$\\overrightarrow{\\mathrm{PQ}}$ が AB にも AC にも垂直。つまり **P から平面 ABC に下ろした垂線の足** です。',
        add: [{ t: 'h', text: '図で問題をつかむ（t = 0.5 の例）' },
          { t: 'p', size: 'sm', text: '4 点 A，B，C，Q が同じ平面上\n→ Q は平面 ABC（黄色の面）の上\n$\\overrightarrow{\\mathrm{PQ}}$ が AB，AC の両方と垂直\n→ PQ は平面 ABC に垂直' },
          fig3('g1', { h: 310 })] },
      { ask: { type: 'choice', q: '内積の表を作ります。$\\vec b\\cdot\\vec c$ の値は？',
        opts: ['$2$', '$4$', '$1$', '$2\\sqrt3$'], ok: 0,
        why: { 1: '$\\cos60^\\circ$ をかけ忘れています。', 2: '$|\\vec b||\\vec c|=2\\cdot2=4$ です。$4\\cdot\\frac12=2$。', 3: '内積は $\\cos$ を使います。$\\sin60^\\circ$ になっています。' },
        good: '$\\vec b\\cdot\\vec c=2\\cdot2\\cdot\\cos60^\\circ=2$。$\\angle\\mathrm{AOB}=\\angle\\mathrm{AOC}=90^\\circ$ なので、$\\vec a$ との内積は 0 です。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['内積', '$\\vec a$', '$\\vec b$', '$\\vec c$'], ['$\\vec a$', '$4$', '$0$', '$0$'], ['$\\vec b$', '$0$', '$4$', '$2$'], ['$\\vec c$', '$0$', '$2$', '$4$']] }] } },
      { say: '方針です。Q の位置ベクトルを3つの文字でおき、条件を3つの式にします。文字が3つ、式が3つなので、ちょうど決まります。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '$\\overrightarrow{\\mathrm{OQ}}=x\\vec a+y\\vec b+z\\vec c$ とおく\n(i) 4 点が同じ平面上 → $x,\\ y,\\ z$ の式\n(ii)(iii) 2 つの内積 $=0$ → $x,\\ y,\\ z$ の式' }] },
      { ask: { type: 'choice', q: '4 点 A，B，C，Q が同じ平面上 ⇔ ？（$\\overrightarrow{\\mathrm{OQ}}=x\\vec a+y\\vec b+z\\vec c$）',
        opts: ['$x+y+z=0$', '$x=y=z$', '$x+y+z=1$', '$x\\ge0,\\ y\\ge0,\\ z\\ge0$'], ok: 2,
        why: { 0: 'それは O を通り平面 ABC に平行な平面です。', 1: 'それは O と三角形 ABC の重心を通る直線です。', 3: 'これは平面ではなく、空間の広い範囲を表します。' },
        good: '$\\overrightarrow{\\mathrm{AQ}}=s\\overrightarrow{\\mathrm{AB}}+u\\overrightarrow{\\mathrm{AC}}$ を書きかえると、係数の和は $(1-s-u)+s+u=1$。',
        add: [{ t: 'm', tex: 'x+y+z=1', note: '…(i)　Q は平面 ABC 上' }] } },

      // ---------- (1) ----------
      { clear: true, cols: [0.58, 0.42], part: '(1)', say: '(1) です。$\\overrightarrow{\\mathrm{PQ}}=\\overrightarrow{\\mathrm{OQ}}-t\\vec c$。まず $\\overrightarrow{\\mathrm{PQ}}$ と $\\vec a,\\ \\vec b,\\ \\vec c$ の内積を、表を見ながら出しておきます。',
        add: [{ t: 'h', text: '(1)　OQ を t, a, b, c で表す' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PQ}}=x\\vec a+y\\vec b+(z-t)\\vec c' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec a&=4x\\\\ \\overrightarrow{\\mathrm{PQ}}\\cdot\\vec b&=4y+2(z-t)\\\\ \\overrightarrow{\\mathrm{PQ}}\\cdot\\vec c&=2y+4(z-t)\\end{aligned}' },
          fig3('g2', { h: 330 })] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{PQ}}\\cdot\\overrightarrow{\\mathrm{AB}}=\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec b-\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec a=0$ を整理して 2 で割ると？',
        opts: ['$-2x+2y+z=0$', '$2x+2y+(z-t)=0$', '$-x+y+(z-t)=0$', '$-2x+2y+(z-t)=0$'], ok: 3,
        why: { 0: 'P の分の $-t$ が落ちています。$\\overrightarrow{\\mathrm{PQ}}$ の $\\vec c$ の係数は $z-t$。', 1: '$\\overrightarrow{\\mathrm{AB}}=\\vec b-\\vec a$ なので、$4x$ は引きます。', 2: '$-4x+4y+2(z-t)=0$ を 2 で割ると、$x,\\ y$ の係数は 2 のまま残ります。' },
        good: '$4y+2(z-t)-4x=0$ を 2 で割りました。',
        add: [{ t: 'm', size: 'sm', tex: '-2x+2y+(z-t)=0', note: '…(ii)' }] } },
      { say: '同じように $\\overrightarrow{\\mathrm{PQ}}\\cdot\\overrightarrow{\\mathrm{AC}}=\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec c-\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec a=0$ から、$2y+4(z-t)-4x=0$。2 で割って (iii) です。',
        add: [{ t: 'm', size: 'sm', tex: '-2x+y+2(z-t)=0', note: '…(iii)' }] },
      { ask: { type: 'think', q: '(i)(ii)(iii) を解いて、$x,\\ y,\\ z$ を $t$ で表そう。',
        hint: '(ii) から (iii) を引くと $y-(z-t)=0$、つまり $z=y+t$。これを (ii) に入れると $x=\\frac32y$。最後に (i) へ。',
        ans: '$x=\\dfrac{3(1-t)}{7},\\quad y=\\dfrac{2(1-t)}{7},\\quad z=\\dfrac{2+5t}{7}$',
        after: '(i) に入れると $\\frac32y+y+(y+t)=1$ より $\\frac72y=1-t$。和が $\\frac{3+2+2+(-3-2+5)t}{7}=1$ になることで検算できます。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\overrightarrow{\\mathrm{OQ}}=\\frac{3(1-t)\\vec a+2(1-t)\\vec b+(2+5t)\\vec c}{7}' }] } },
      { say: '**検算**：$t=1$ のとき P は C そのもので、Q も C（$\\vec c$ だけが残る）。$t=0$ のとき Q は、O から平面 ABC に下ろした垂線の足 $\\mathrm{Q_0}$ です。',
        add: [{ t: 'm', size: 'sm', tex: 't=1:\\ \\overrightarrow{\\mathrm{OQ}}=\\vec c,\\qquad t=0:\\ \\overrightarrow{\\mathrm{OQ_0}}=\\frac{3\\vec a+2\\vec b+2\\vec c}{7}' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.58, 0.42], part: '(2)', say: '(2) です。$\\overrightarrow{\\mathrm{BQ}}=\\overrightarrow{\\mathrm{OQ}}-\\vec b$。$\\vec b$ の係数から 1 を引くだけです。長さは **2乗して内積で** 計算します。',
        add: [{ t: 'h', text: '(2)　線分 BQ の長さの最小' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{BQ}}=x\\vec a+(y-1)\\vec b+z\\vec c' },
          fig3('g3', { bq: true, h: 330 })] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{BQ}}|^2$ を展開したとき、$(y-1)z$ の項の係数は？',
        opts: ['$2$', '$4$', '$8$', '$0$'], ok: 1,
        why: { 0: '2乗の展開の「2倍」を忘れています。$2(y-1)z\\,\\vec b\\cdot\\vec c$ です。', 2: '$\\vec b\\cdot\\vec c=2$ です。$|\\vec b|^2=4$ と取りちがえています。', 3: '$\\vec b$ と $\\vec c$ は垂直ではありません（$\\angle\\mathrm{BOC}=60^\\circ$）。' },
        good: '$2(y-1)z\\,\\vec b\\cdot\\vec c=4(y-1)z$。$\\vec a$ をふくむかけ算の項は、$\\vec a\\cdot\\vec b=\\vec a\\cdot\\vec c=0$ で消えます。',
        add: [{ t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{BQ}}|^2=4x^2+4(y-1)^2+4z^2+4(y-1)z' }] } },
      { say: '(1) の $x,\\ z$ と $y-1=-\\frac{5+2t}{7}$ を入れて、両辺を 49 倍して整理すると、$t$ の2次式になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}49|\\overrightarrow{\\mathrm{BQ}}|^2&=36(1-t)^2+4(5+2t)^2+4(2+5t)^2\\\\ &\\quad-4(5+2t)(2+5t)\\\\ &=112t^2-28t+112\\end{aligned}' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{BQ}}|^2=\\frac{16t^2-4t+16}{7}' }] },

      { clear: true, cols: [0.58, 0.42], part: '(2) 平方完成', say: 'あとは2次関数の最小です。$|\\overrightarrow{\\mathrm{BQ}}|^2$ が最小のとき、$|\\overrightarrow{\\mathrm{BQ}}|$ も最小。平方完成します。',
        add: [{ t: 'h', text: '(2)　平方完成して最小値' },
          { t: 'm', tex: '|\\overrightarrow{\\mathrm{BQ}}|^2=\\frac{16t^2-4t+16}{7}' },
          { t: 'fig', id: 'gq', col: 1, view: [-0.15, 1.9, 1.15, 4.6], w: 380, h: 300, items: [
            { k: 'axes', at: [0, 2], tx: [[0.125, '1/8'], [1, '1']], ty: [[2.25, '9/4'], [4, '4']], xl: 't', yl: '', o: false },
            { k: 'fn', f: '(16*x*x-4*x+16)/7', a: 0, b: 1, c: 'b', wd: 3.5 },
            { k: 'pt', at: [0, 16 / 7], c: 'b', r: 5 }, { k: 'pt', at: [1, 4], c: 'b', r: 5 },
            { k: 'label', at: [0.62, 4.15], text: '|BQ|²', c: 'b', size: 22, plain: true }] }] },
      { ask: { type: 'choice', q: '平方完成したとき、グラフの頂点 $(t,\\ |\\overrightarrow{\\mathrm{BQ}}|^2)$ は？',
        opts: ['$\\left(\\frac14,\\ \\frac{15}{7}\\right)$', '$\\left(-\\frac18,\\ \\frac94\\right)$', '$\\left(\\frac18,\\ \\frac94\\right)$', '$\\left(\\frac18,\\ \\frac{16}{7}\\right)$'], ok: 2,
        why: { 0: '$16\\left(t^2-\\frac14t\\right)$ の $-\\frac14$ の **半分** は $-\\frac18$ です。', 1: '$-4t$ なので、かっこの中は $t-\\frac18$。符号が逆です。', 3: '定数の計算で $\\frac{16}{7}\\cdot\\frac{1}{64}=\\frac1{28}$ を引き忘れています。' },
        good: '$\\frac{16}{7}\\left(t-\\frac18\\right)^2=\\frac{16t^2-4t}{7}+\\frac1{28}$。定数は $\\frac{16}{7}-\\frac1{28}=\\frac94$。',
        add: [{ t: 'm', tex: '|\\overrightarrow{\\mathrm{BQ}}|^2=\\frac{16}{7}\\left(t-\\frac18\\right)^2+\\frac94' }] } },
      { ask: { type: 'choice', q: '$0\\le t\\le1$ における BQ の最小値は？',
        opts: ['$\\dfrac94$', '$2$', '$\\dfrac{4\\sqrt7}{7}$', '$\\dfrac32$'], ok: 3,
        why: { 0: 'それは $|\\overrightarrow{\\mathrm{BQ}}|^2$ の最小値。最後に $\\sqrt{\\phantom{a}}$ をとります。', 1: 'それは $t=1$（Q＝C）のときの BC の長さ。最小ではありません。', 2: 'それは $t=0$ のとき（$\\sqrt{\\frac{16}{7}}$）。端の値です。' },
        good: '$t=\\frac18$ は $0\\le t\\le1$ に入っているので、そこで最小。$\\sqrt{\\frac94}=\\frac32$ です。',
        add: [{ t: 'ans', label: '(2) 答', text: '$t=\\dfrac18$ のとき、最小値 $\\dfrac32$' }],
        draw: [{ fig: 'gq', items: [{ k: 'pt', at: [0.125, 2.25], c: 'p', r: 7 }] }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: '座標でも確かめます。O を原点、B を $x$ 軸上、A を $z$ 軸上におくと、Q の座標は $t$ の1次式。Q は $\\mathrm{Q_0}$ と C を結ぶ線分（緑の点線）の上を動きます。',
        add: [{ t: 'h', text: '別の見方：座標で確かめる' },
          { t: 'p', size: 'sm', text: '$\\mathrm{O}(0,0,0)$，$\\mathrm{B}(2,0,0)$，$\\mathrm{C}(1,\\sqrt3,0)$，$\\mathrm{A}(0,0,2)$' },
          { t: 'm', size: 'sm', tex: '\\mathrm{Q}\\left(\\frac{6+t}{7},\\ \\frac{\\sqrt3(2+5t)}{7},\\ \\frac{6(1-t)}{7}\\right)' },
          { t: 'm', size: 'sm', tex: 't=\\frac18:\\ \\mathrm{Q}\\left(\\frac78,\\ \\frac{3\\sqrt3}{8},\\ \\frac34\\right)' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BQ}^2=\\frac{9^2+(3\\sqrt3)^2+6^2}{8^2}=\\frac{144}{64}=\\frac94' },
          fig3('g4', { t: 0.125, path: true, bq: true, pq: true, qd: 'e', h: 380 })] },
      { ask: { type: 'think', q: '最小のとき、BQ は Q の動く向き $-3\\vec a-2\\vec b+5\\vec c$（$\\overrightarrow{\\mathrm{OQ}}$ の $t$ の係数の 7 倍）と垂直のはず。確かめよう。',
        hint: '$t=\\frac18$ のとき $\\overrightarrow{\\mathrm{OQ}}=\\frac{3\\vec a+2\\vec b+3\\vec c}{8}$ なので、$\\overrightarrow{\\mathrm{BQ}}=\\frac{3\\vec a-6\\vec b+3\\vec c}{8}$。',
        ans: '$(3\\vec a-6\\vec b+3\\vec c)\\cdot(-3\\vec a-2\\vec b+5\\vec c)=-36+48+60-72=0$　で垂直',
        after: '「直線上を動く点と定点の距離の最小 ⇔ 垂直」。平方完成の答えと、図形の見方が一致しました。' } },
      { say: '答案で点がつくところです。とくに「$t=\\frac18$ は $0\\le t\\le1$ をみたす」の一言を忘れずに。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・同じ平面上 → 係数の和 $=1$ を式で書く\n・内積の表（$\\vec b\\cdot\\vec c=2$ など）を示す\n・$|\\overrightarrow{\\mathrm{BQ}}|^2$ を $t$ の2次式にして平方完成\n・最小をとる $t$ が範囲に入ることを確かめる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。条件を1つずつ式にして、文字の数と式の数をそろえるのが空間ベクトルの基本でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
