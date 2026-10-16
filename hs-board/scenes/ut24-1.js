/* 東大型 数学（理系）：2024年度 東京大学 前期 理系 第1問の類題（自作問題・元の問題ではない）
   問題：A(0,0,1)、B(1,0,0)。xy 平面上の点 P（P≠B）が ∠PAB ≤ π/3 かつ ∠ABP ≤ π/3 をみたす範囲を図示
   答え（python3 で検算ずみ：格子点 21 万個で角を直接計算した結果と一致）：
     ①∠PAB ≤ π/3 ⇔ x+1 ≥ 0 かつ (x+2)²−y² ≥ 3（直角双曲線の右の枝の内側）
     ②∠ABP ≤ π/3 ⇔ |y| ≤ 1−x（B を頂点とする角の部分。直線は漸近線 y=±(x+2) と平行）
     共通部分＝双曲線の弧（(0,−1)→頂点(√3−2,0)→(0,1)）と線分 (0,±1)–B で囲まれた部分。境界をふくみ、B を除く。
     （x+1 ≥ 0 を忘れると、左の枝の内側の 4.6 万点がまちがって入る） */
(function () {
  const S3 = Math.sqrt(3), V = S3 - 2;   // 右の枝の頂点の x 座標 √3−2
  const hx = y => -2 + Math.sqrt(y * y + 3);
  const arc = (y0, y1, n) => { const a = []; for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; a.push([hx(y), y]); } return a; };
  const RB = { k: 'param', x: '-2+sqrt(3)/cos(t)', y: 'sqrt(3)*tan(t)', a: -1.25, b: 1.25, c: 'w' };
  const LB = { k: 'param', x: '-2-sqrt(3)/cos(t)', y: 'sqrt(3)*tan(t)', a: -1.25, b: 1.25, c: 'w' };
  const ASY = [{ k: 'line', m: 1, n: 2, c: 'd', dash: true }, { k: 'line', m: -1, n: -2, c: 'd', dash: true }];
  // xy 平面の大きな図（双曲線・角の部分）
  const VIEW = [-6.2, -3.2, 2.2, 3.2];
  const bigFig = (id, items) => ({ t: 'fig', id, col: 1, view: VIEW, w: 540, h: 411, items: [{ k: 'axes', tx: [[-2, '−2']], ty: [] }].concat(items || []) });
  const rightIn = { k: 'poly', pts: arc(-3.2, 3.2, 60).concat([[2.2, 3.2], [2.2, -3.2]]), close: true, fill: 'y', alpha: 0.3, noStroke: true };
  const leftIn = { k: 'poly', pts: arc(-3.2, 3.2, 60).map(([x, y]) => [-4 - x, y]).concat([[-6.2, 3.2], [-6.2, -3.2]]), close: true, fill: 'p', alpha: 0.22, noStroke: true };
  const wedge = { k: 'poly', pts: [[1, 0], [-2.2, 3.2], [-6.2, 3.2], [-6.2, -3.2], [-2.2, -3.2]], close: true, fill: 'b', alpha: 0.22, noStroke: true };
  const wedgeLines = [{ k: 'seg', a: [1, 0], b: [-2.2, 3.2], c: 'b' }, { k: 'seg', a: [1, 0], b: [-2.2, -3.2], c: 'b' }];
  const Bopen = { k: 'pt', at: [1, 0], name: 'B', dir: 'se', c: 'w', open: true };
  // 答えの図（拡大）
  const region = { k: 'poly', pts: arc(-1, 1, 40).concat([[1, 0]]), close: true, fill: 'y', alpha: 0.35, noStroke: true };
  const ansFig = (id) => ({ t: 'fig', id, col: 1, view: [-1.3, -1.7, 1.7, 1.7], w: 420, h: 476, items: [
    { k: 'axes', tx: [], ty: [] }, region,
    { k: 'param', x: '-2+sqrt(3)/cos(t)', y: 'sqrt(3)*tan(t)', a: Math.PI / 6, b: 1.0, c: 'd', dash: true },
    { k: 'param', x: '-2+sqrt(3)/cos(t)', y: 'sqrt(3)*tan(t)', a: -1.0, b: -Math.PI / 6, c: 'd', dash: true },
    { k: 'param', x: '-2+sqrt(3)/cos(t)', y: 'sqrt(3)*tan(t)', a: -Math.PI / 6, b: Math.PI / 6, c: 'y', wd: 4 },
    { k: 'seg', a: [0, 1], b: [1, 0], c: 'y', wd: 4 }, { k: 'seg', a: [0, -1], b: [1, 0], c: 'y', wd: 4 },
    { k: 'pt', at: [0, 1], name: '(0, 1)', dir: 'ne', c: 'y', size: 22 }, { k: 'pt', at: [0, -1], name: '(0, −1)', dir: 'se', c: 'y', size: 22 },
    { k: 'pt', at: [V, 0], name: '√3−2', dir: 'nw', c: 'y', size: 21, dy: -4 },
    { k: 'pt', at: [1, 0], name: 'B(1, 0)', dir: 'ne', c: 'w', open: true, size: 22 },
    { k: 'label', at: [-0.3, 0.62], text: '双曲線の弧', c: 'y', size: 19, anchor: 'end' }] });
  // 立体の見取図（x 軸を左下へ）
  const pj = (x, y, z) => [y - 0.5 * x, z - 0.4 * x];
  const sA = pj(0, 0, 1), sB = pj(1, 0, 0), sP = pj(0.2, 0.55, 0), sO = pj(0, 0, 0);
  const space = { t: 'fig', id: 'sp', col: 1, view: [-1.15, -0.95, 1.55, 1.45], w: 430, h: 382, items: [
    { k: 'poly', pts: [pj(-0.3, -0.5, 0), pj(1.7, -0.5, 0), pj(1.7, 1.3, 0), pj(-0.3, 1.3, 0)], close: true, fill: 'b', alpha: 0.12, c: 'd', wd: 1.5 },
    { k: 'vec', a: sO, b: pj(1.7, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: sO, b: pj(0, 1.35, 0), c: 'd', wd: 2 }, { k: 'vec', a: sO, b: pj(0, 0, 1.35), c: 'd', wd: 2 },
    { k: 'label', at: pj(1.7, 0, 0), text: 'x', dx: -14, dy: 6, c: 'd', size: 22 }, { k: 'label', at: pj(0, 1.35, 0), text: 'y', dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 1.35), text: 'z', dx: 16, c: 'd', size: 22 },
    { k: 'seg', a: sA, b: sB, c: 'y' }, { k: 'seg', a: sA, b: sP, c: 'w' }, { k: 'seg', a: sB, b: sP, c: 'w' },
    { k: 'angle', o: sA, a: sB, b: sP, rp: 34, c: 'p' }, { k: 'angle', o: sB, a: sA, b: sP, rp: 30, c: 'g' },
    { k: 'pt', at: sA, name: 'A(0, 0, 1)', dir: 'e', size: 21 }, { k: 'pt', at: sB, name: 'B(1, 0, 0)', dir: 'w', size: 21 },
    { k: 'pt', at: sP, name: 'P', dir: 'se', c: 'y' },
    { k: 'label', at: pj(1.2, 1.15, 0), text: 'xy 平面', c: 'b', size: 20 }] };
  // y=0 での切り口（xz 平面）
  const m1 = 2 - S3, m2 = 2 + S3;
  const cut = { t: 'fig', id: 'cut', col: 1, view: [-4.4, -0.9, 2.2, 2.3], w: 620, h: 300, items: [
    { k: 'poly', pts: [[0, 1], [-1.9 / m2, -0.9], [2.2, -0.9], [2.2, 1 + 2.2 * m1]], close: true, fill: 'y', alpha: 0.25, noStroke: true },
    { k: 'poly', pts: [[0, 1], [-4.4, 1 - 4.4 * m1], [-4.4, 2.3], [1.3 / m2, 2.3]], close: true, fill: 'p', alpha: 0.18, noStroke: true },
    { k: 'axes', tx: [], ty: [], xl: 'x', yl: 'z', o: false },
    { k: 'line', m: m1, n: 1, c: 'g' }, { k: 'line', m: m2, n: 1, c: 'g' }, { k: 'line', m: -1, n: 1, c: 'y', dash: true },
    { k: 'angle', o: [0, 1], a: [1, 0], b: [V, 0], rp: 44, c: 'y', label: 'π/3', lr: 22, size: 20 },
    { k: 'pt', at: [0, 1], name: 'A', dir: 'ne', size: 24 }, { k: 'pt', at: [1, 0], name: 'B', dir: 'se', size: 24 },
    { k: 'pt', at: [V, 0], name: '√3−2', dir: 'sw', c: 'y', size: 20, off: 24 }, { k: 'pt', at: [-2 - S3, 0], name: '−2−√3', dir: 's', c: 'p', size: 20, off: 26 },
    { k: 'label', at: [1.62, 0.72], text: '∠PAB ≦ π/3\nの側', c: 'y', size: 19 }, { k: 'label', at: [-2.6, 1.75], text: '反対側の円錐\n（∠PAB ≧ 2π/3）', c: 'p', size: 19 }] };

  const POINTS = [
    '角の条件は cos の不等式へ：$\\theta\\le\\dfrac{\\pi}{3}\\iff\\cos\\theta\\ge\\dfrac12$（$0\\le\\theta\\le\\pi$ で cos は減少）。内積と大きさで、成分の式にする',
    '$A\\ge\\sqrt{B}$ を 2 乗するときは「$A\\ge0$」を必ずつける。忘れると、2 乗でまざる点（ここでは双曲線の左の枝の側）まで答えに入る',
    '頂点が平面の外にある円錐の切り口は 2 次曲線、頂点が平面上なら 2 直線。**漸近線と平行な直線** は双曲線と 1 回だけ交わる'
  ];

  HB.lesson({
    id: 'ut24-1', field: '東大型　数学（理系）', title: '2024 東大 理系 第1問の類題 ― 空間の2つの角の条件と、平面上の点の範囲', level: '2024年度 東京大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 点 $\\mathrm{A}(0,\\,0,\\,1)$，$\\mathrm{B}(1,\\,0,\\,0)$ がある。$xy$ 平面上の点 P が、B と異なり\n$\\angle\\mathrm{PAB}\\le\\dfrac{\\pi}{3}$　かつ　$\\angle\\mathrm{ABP}\\le\\dfrac{\\pi}{3}$\nをみたすとき、P のとりうる範囲を $xy$ 平面上に図示せよ。',
      src: '※ 2024年度 東京大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '東大の第1問によくある「空間の条件を、平面上の範囲として図示する」問題です。小問の誘導はありません。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'P は $xy$ 平面上なので $\\mathrm{P}(x,\\,y,\\,0)$ とおけます。A は平面の上、B は平面の中。2つの角は、頂点がちがう角です。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'm', tex: '\\mathrm{P}(x,\\ y,\\ 0)', note: '← xy 平面上の点' },
          { t: 'p', size: 'sm', text: '{{∠PAB}}：頂点 A（平面の外）\n[[g:∠ABP]]：頂点 B（平面の中）' },
          space] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{PAB}\\le\\dfrac{\\pi}{3}$ と同じ意味の式は？（$0\\le\\angle\\mathrm{PAB}\\le\\pi$）',
        opts: ['$\\cos\\angle\\mathrm{PAB}\\le\\dfrac12$', '$\\cos\\angle\\mathrm{PAB}\\ge\\dfrac12$', '$\\sin\\angle\\mathrm{PAB}\\le\\dfrac{\\sqrt3}{2}$', '$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}\\ge\\dfrac12$'], ok: 1,
        why: { 0: '$0\\le\\theta\\le\\pi$ で cos は減少。角が小さいほど cos は大きいので、向きが逆です。', 2: 'sin は $\\frac{\\pi}{2}$ をこえると減るので、$\\theta\\ge\\frac{2\\pi}{3}$ の角もまざります。', 3: '内積は $|\\overrightarrow{\\mathrm{AP}}||\\overrightarrow{\\mathrm{AB}}|\\cos$。大きさをかけ忘れています。' },
        good: '$0\\le\\theta\\le\\pi$ で cos は減少なので、$\\theta\\le\\frac{\\pi}{3}\\iff\\cos\\theta\\ge\\frac12$。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}\\ge\\dfrac12\\,|\\overrightarrow{\\mathrm{AP}}|\\,|\\overrightarrow{\\mathrm{AB}}|$ を成分で書き、$x,\\ y$ の不等式にする（もう1つの角も同じ）' }] } },

      // ---------- 条件① ----------
      { clear: true, part: '条件①', say: '成分で計算します。$\\overrightarrow{\\mathrm{AP}}=(x,\\,y,\\,-1)$、$\\overrightarrow{\\mathrm{AB}}=(1,\\,0,\\,-1)$ なので、内積は $x+1$、$|\\overrightarrow{\\mathrm{AB}}|=\\sqrt2$ です。',
        add: [{ t: 'h', text: '条件①　∠PAB ≦ π/3' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AP}}=(x,\\ y,\\ -1),\\quad \\overrightarrow{\\mathrm{AB}}=(1,\\ 0,\\ -1)' },
          { t: 'm', size: 'sm', tex: 'x+1\\ge\\frac12\\cdot\\sqrt2\\cdot\\sqrt{x^2+y^2+1}' },
          { t: 'm', tex: '\\sqrt2\\,(x+1)\\ge\\sqrt{x^2+y^2+1}', note: '…(＊)' }] },
      { ask: { type: 'choice', q: '(＊) の両辺を 2 乗する前に、つけておく条件は？',
        opts: ['いらない（2乗するだけ）', '$x\\ge0$', '$x+1\\ge0$', '$x^2+y^2+1\\ge0$'], ok: 2,
        why: { 0: '左辺が負のとき (＊) は成り立たないのに、2乗した式は成り立つことがあります。', 1: '強すぎます。$-1\\le x<0$ でも (＊) をみたす点があります（例：$x=-0.2,\\ y=0$）。', 3: 'これはいつも成り立つので、条件になりません。' },
        good: '右辺は 0 以上。だから「左辺 ≥ 0」をつけて 2 乗すれば、同値な変形になります。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: '同値な変形', text: '$A\\ge\\sqrt{B}\\iff A\\ge0$ かつ $A^2\\ge B$' }] } },
      { say: '$x+1\\ge0$ のもとで 2 乗して整理すると $(x+2)^2-y^2\\ge3$。境界は、中心 $(-2,\\,0)$ の直角双曲線です。漸近線は $y=\\pm(x+2)$。',
        add: [{ t: 'm', size: 'sm', tex: '2(x+1)^2\\ge x^2+y^2+1\\iff\\hy{(x+2)^2-y^2\\ge3}' },
          bigFig('h1', [RB, LB].concat(ASY, [
            { k: 'pt', at: [V, 0], name: '√3−2', dir: 'nw', c: 'w', size: 20 }, { k: 'pt', at: [-2 - S3, 0], name: '−2−√3', dir: 'sw', c: 'w', size: 20 },
            { k: 'label', at: [-2, -2.85], text: '漸近線 y = ±(x + 2)', c: 'd', size: 19 }]))] },
      { ask: { type: 'choice', q: '$(x+2)^2-y^2\\ge3$ に $x+1\\ge0$ を合わせた範囲は？',
        opts: ['右の枝の内側（右側）だけ', '2本の枝の内側の両方', '左の枝の内側だけ', '2本の枝にはさまれた部分'], ok: 0,
        why: { 1: '左の枝の内側は $x\\le-2-\\sqrt3$ で、$x+1\\ge0$ をみたしません。', 2: '左右が逆です。$x+1\\ge0$ は右側です。', 3: 'はさまれた部分は $(x+2)^2-y^2<3$ の側です。' },
        good: '右の枝の頂点は $x=\\sqrt3-2\\ (>-1)$。右の枝の内側は、すべて $x+1\\ge0$ をみたします。',
        add: [{ t: 'm', size: 'sm', tex: '(x+2)^2-y^2\\ge3\\ \\text{かつ}\\ x\\ge\\sqrt3-2', note: '…①の範囲' }],
        draw: [{ fig: 'h1', items: [rightIn, { k: 'label', at: [1.25, -1.6], text: '①', c: 'y', size: 26 }] }] } },
      { say: '左の枝の内側は、2乗でまぎれこむ点です。じつは $\\cos\\angle\\mathrm{PAB}\\le-\\dfrac12$、つまり $\\angle\\mathrm{PAB}\\ge\\dfrac{2\\pi}{3}$ の点。「左辺 ≥ 0」を書かないと、ここまで答えに入ってしまいます。',
        draw: [{ fig: 'h1', items: [leftIn, { k: 'label', at: [-5.45, -1.6], text: '2乗で\nまざる', c: 'p', size: 19 }] }] },

      // ---------- 条件② ----------
      { clear: true, part: '条件②', say: '次は $\\angle\\mathrm{ABP}\\le\\dfrac{\\pi}{3}$。頂点は B です。$\\overrightarrow{\\mathrm{BA}}=(-1,\\,0,\\,1)$、$\\overrightarrow{\\mathrm{BP}}=(x-1,\\,y,\\,0)$ で、内積は $1-x$。',
        add: [{ t: 'h', text: '条件②　∠ABP ≦ π/3' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{BA}}=(-1,\\ 0,\\ 1),\\quad \\overrightarrow{\\mathrm{BP}}=(x-1,\\ y,\\ 0)' },
          { t: 'm', tex: '\\sqrt2\\,(1-x)\\ge\\sqrt{(x-1)^2+y^2}', note: '…(＊＊)　P≠B' },
          bigFig('w1', [Bopen])] },
      { ask: { type: 'choice', q: '(＊＊) を整理すると？',
        opts: ['$y^2\\le(1-x)^2$', '$|y|\\ge1-x$', '$|y|\\le x-1$', '$|y|\\le1-x$'], ok: 3,
        why: { 0: '2乗する前の条件 $1-x\\ge0$ が抜けています。$x>1$ の側の点まで入ってしまいます。', 1: '不等号の向きが逆です。$2(1-x)^2\\ge(1-x)^2+y^2$ から $y^2\\le(1-x)^2$。', 2: '$1-x\\ge0$ なので、$|1-x|=1-x$ です。' },
        good: '$1-x\\ge0$ のもとで 2 乗して $(1-x)^2\\ge y^2$、つまり $|y|\\le1-x$。B を頂点とする角の部分です。',
        add: [{ t: 'm', tex: '|y|\\le1-x', note: '…②の範囲（B は除く）' }],
        draw: [{ fig: 'w1', items: [wedge].concat(wedgeLines, [Bopen, { k: 'label', at: [-3.6, -0.9], text: '②', c: 'b', size: 26 }]) }] } },
      { say: 'ここで大事な発見。2本の直線 $y=\\pm(1-x)$ は、双曲線の漸近線 $y=\\pm(x+2)$ と **平行** です。だから、それぞれ双曲線と 1 回しか交わりません。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '発見', text: '傾きが $\\pm1$ どうしで平行。\n漸近線と平行な直線 → 双曲線と 1 点で交わる' }],
        draw: [{ fig: 'w1', items: [RB].concat(ASY) }] },

      // ---------- 共通部分 ----------
      { clear: true, part: '共通部分', say: '直線 $y=1-x$ と双曲線 $(x+2)^2-y^2=3$ の交点を求めます。代入すると、2 次の項が消えます。',
        add: [{ t: 'h', text: '①と②の共通部分' },
          { t: 'm', tex: '(x+2)^2-(1-x)^2=3' }] },
      { ask: { type: 'choice', q: '交点の $x$ 座標は？',
        opts: ['$x=1$', '$x=0$', '$x=-1,\\ 0$', '$x=\\sqrt3-2$'], ok: 1,
        why: { 0: '$x=1$ は B。$(1+2)^2-0^2=9\\ne3$ で、双曲線上にありません。', 2: '2 次の項が消えるので、解は 1 つだけです。', 3: 'それは双曲線の頂点（$y=0$）の $x$ 座標です。' },
        good: '$(x^2+4x+4)-(x^2-2x+1)=6x+3=3$ より $x=0$。交点は $(0,\\,1)$、対称に $(0,\\,-1)$ も。',
        add: [{ t: 'm', tex: '6x+3=3\\qquad\\therefore\\ x=0\\ \\to\\ (0,\\ \\pm1)' }] } },
      { say: '$0\\le x\\le1$ では、$|y|\\le1-x\\le1$ なので $(x+2)^2-y^2\\ge4-1=3$。つまり②の三角形の部分は、まるごと①に入っています。',
        add: [{ t: 'p', size: 'sm', text: '$x<0$ の側：双曲線の弧が境界\n$0\\le x\\le1$ の側：②の 2 本の線分が境界' },
          ansFig('r1')] },
      { say: '答えです。双曲線の弧（$(0,\\,-1)$ から頂点を通って $(0,\\,1)$ まで）と、2本の線分で囲まれた部分。境界はふくみ、点 B だけを除きます。',
        add: [{ t: 'ans', label: '答', text: '右の図の黄色の部分\n境界：$(x+2)^2-y^2=3$ の弧と\n2本の線分（$x+y=1$、$x-y=1$）\n境界をふくむ。ただし点 B は除く' }] },
      { ask: { type: 'think', q: '確かめ：原点 O は範囲に入っているはず。∠OAB と ∠ABO を直接求めて、確かめよう。',
        hint: '$\\triangle\\mathrm{OAB}$ は、$\\mathrm{OA}=\\mathrm{OB}=1$、$\\angle\\mathrm{AOB}=\\dfrac{\\pi}{2}$ の三角形。',
        ans: '直角二等辺三角形なので　$\\angle\\mathrm{OAB}=\\angle\\mathrm{ABO}=\\dfrac{\\pi}{4}\\le\\dfrac{\\pi}{3}$。条件をみたします。',
        after: '図でも O は黄色の中です。角の点 $(0,\\,\\pm1)$ では、2つの角がちょうど $\\frac{\\pi}{3}$ になります。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.4, 0.6], part: '別の見方', say: '図形で見ると、①は「A が頂点、AB が軸、軸との角が $\\frac{\\pi}{3}$ 以内の円錐」の内部です。$y=0$ の平面で切って、ようすを見ます。',
        add: [{ t: 'h', text: '別の見方：円錐の切り口' },
          { t: 'p', size: 'sm', text: '①：A が頂点の円錐の内部\n②：B が頂点の円錐の内部' },
          cut] },
      { say: '軸 AB は $xy$ 平面と $\\frac{\\pi}{4}$ の角をなし、円錐の開きは $\\frac{\\pi}{3}$。開きのほうが大きいので、平面は反対側の円錐にも届きます。切り口が双曲線の2本の枝になるのは、このためです。',
        add: [{ t: 'p', size: 'sm', text: '黄の側 → 右の枝（頂点 $\\sqrt3-2$）\n桃の側 → 左の枝（頂点 $-2-\\sqrt3$）' }] },
      { ask: { type: 'choice', q: '①の角を $\\dfrac{\\pi}{3}$ から $\\dfrac{\\pi}{6}$ に変える（円錐の開きを $\\frac{\\pi}{6}$ にする）と、①の境界は？',
        opts: ['双曲線', '放物線', '2本の直線', '楕円'], ok: 3,
        why: { 0: '双曲線になるのは、開きが $\\frac{\\pi}{4}$（軸と平面の角）より大きいときです。', 1: '放物線は、開きがちょうど $\\frac{\\pi}{4}$ のときです。', 2: '2直線になるのは、②のように頂点が平面の上にあるときです。' },
        good: '開き $<\\frac{\\pi}{4}$ なら、平面は片側の円錐だけを横切り、切り口は閉じた曲線＝楕円になります。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['円錐の開き', '切り口'], ['$<\\frac{\\pi}{4}$', '楕円'], ['$=\\frac{\\pi}{4}$', '放物線'], ['$>\\frac{\\pi}{4}$', '双曲線']] }] } },
      { say: '記述の答案では、ここに書いた3つが採点で見られます。特に「2乗する前の符号の条件」は、書かないと答えの図そのものがまちがいになります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・cos の不等式に直すとき、不等号の向き\n・2乗する前に「左辺 ≥ 0」を書く\n・境界をふくむか、B を除くかを図にそえる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の角の条件は「内積の不等式 → 2乗（符号の条件つき） → 2次曲線」の流れで平面の範囲になります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案と図を自分でノートにかいてみましょう。' }
    ]
  });
})();
