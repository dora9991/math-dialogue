/* 九大型 数学（理系）：2026年度 九州大学 前期 理系 第1問の類題（自作問題・元の問題ではない）
   問題：A(2,2,0), B(0,0,2), C(1,2,1) を通る円 K を、平面 ABC に垂直な方向に平行移動してできる曲面 S（円柱面）と、xy 平面の交わり
   答え（python3 で検算ずみ）：
     平面 ABC：法線 (1,0,1)、x+z=2。|AB|²=12, AB·AC=4, |AC|²=2
     (1) AP = s AB + t AC で 12s+4t=6, 4s+2t=1 → s=1, t=−3/2。中心 P(3/2, 0, 1/2)、半径 √(9/2)=3√2/2（PA²=PB²=PC²=9/2）
     (2) Q(x,y,0)、H=(3/2+u, 0, 1/2+u)、QH⊥(1,0,1) → u=(x−2)/2、QH=((1−x)/2, −y, (x−1)/2)
         QH²=(x−1)²/2+y²=9/2 → (x−1)²/9 + y²/(9/2) = 1。S 全体は (x−z−1)²+2y²=9
         (2,±2) を通る（K と xy 平面の交点）。横から見ると帯 z=x+2, z=x−4 を z=0 で切って −2≦x≦4 */
(function () {
  const S2 = Math.SQRT2, R = 3 / S2, P = [1.5, 0, 0.5], N3 = [1, 0, 1];
  // 見取図：z 軸のまわりに −140°、上から 30° 見下ろす（x 軸は左下、y 軸は右下。円柱のかたむきが見えるように）
  const PS = -140 * Math.PI / 180, EL = 30 * Math.PI / 180;
  const pj = (x, y, z) => [x * Math.cos(PS) - y * Math.sin(PS), z * Math.cos(EL) + (x * Math.sin(PS) + y * Math.cos(PS)) * Math.sin(EL)];
  const pjv = v => pj(v[0], v[1], v[2]);
  const mv = (p, u) => [p[0] + u * N3[0], p[1] + u * N3[1], p[2] + u * N3[2]];
  const Kpt = ph => [P[0] + R * Math.sin(ph) / S2, R * Math.cos(ph), P[2] - R * Math.sin(ph) / S2];   // K 上の点（平面 x+z=2）
  const loop = fn => { const a = []; for (let i = 0; i <= 144; i++) a.push(fn(2 * Math.PI * i / 144)); return a; };
  // 円柱の輪郭：見取図で、軸の向きに垂直な成分がいちばん大きい・小さい K 上の点を通る母線
  const D = pjv(N3), Nn = [-D[1], D[0]];
  let phA = 0, phB = 0, vA = -1e9, vB = 1e9;
  for (let i = 0; i < 720; i++) { const ph = 2 * Math.PI * i / 720, q = pjv(Kpt(ph)), v = q[0] * Nn[0] + q[1] * Nn[1]; if (v > vA) { vA = v; phA = ph; } if (v < vB) { vB = v; phB = ph; } }
  const gen = (ph, u0, u1) => ({ k: 'seg', a: pjv(mv(Kpt(ph), u0)), b: pjv(mv(Kpt(ph), u1)), c: 'b', wd: 1.5 });
  const lab3 = (v, text, o) => Object.assign({ k: 'label', at: pjv(v), text, size: 22 }, o || {});
  // Q（切り口の上の点の例）と H（ℓ 上の垂線の足）
  const Qx = 1 + 3 * Math.cos(-1.8), Qy = R * Math.sin(-1.8), Q3 = [Qx, Qy, 0], H3 = mv(P, (Qx - 2) / 2);
  const fig3 = (id, o) => {
    o = o || {};
    const it = [
      { k: 'poly', pts: [[-2.4, -2.5, 0], [4.4, -2.5, 0], [4.4, 2.5, 0], [-2.4, 2.5, 0]].map(pjv), close: true, fill: 'g', alpha: 0.1, noStroke: true },
      { k: 'vec', a: pj(0, 0, 0), b: pj(4.9, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, 0, 0), b: pj(0, 3.0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, 0, 0), b: pj(0, 0, 2.7), c: 'd', wd: 2 },
      lab3([5.2, 0, 0], 'x', { c: 'd' }), lab3([0, 3.3, 0], 'y', { c: 'd' }), lab3([0, 0, 2.95], 'z', { c: 'd' })
    ];
    // S のうち、K から xy 平面までの部分を母線（K の点を ℓ の向きに動かした線）で見せる
    if (o.sil) [phA, phB].concat([0, 1, 2, 3, 4, 5, 6, 7].map(i => i * Math.PI / 4 + 0.3)).forEach(ph => it.push(gen(ph, 0, -Kpt(ph)[2])));
    if (o.E) it.push({ k: 'poly', pts: loop(ph => pj(1 + 3 * Math.cos(ph), R * Math.sin(ph), 0)), c: 'y', wd: 3.5, id: id + 'E' });
    if (o.ax) it.push({ k: 'seg', a: pjv(mv(P, -2.6)), b: pjv(mv(P, 1.8)), c: 'w', wd: 2, dash: true }, lab3(mv(P, 1.95), 'ℓ', { c: 'w', size: 24 }));
    if (o.K2) it.push({ k: 'poly', pts: loop(ph => pjv(mv(Kpt(ph), 1.1))), c: 'b', wd: 2, dash: true });
    it.push({ k: 'poly', pts: loop(ph => pjv(Kpt(ph))), c: 'b', wd: 3.5 });
    if (o.tri) it.push({ k: 'poly', pts: [[2, 2, 0], [0, 0, 2], [1, 2, 1]].map(pjv), close: true, c: 'g', wd: 2 });
    it.push({ k: 'pt', at: pj(2, 2, 0), name: 'A', dir: 'se', size: 22 }, { k: 'pt', at: pj(0, 0, 2), name: 'B', dir: 'nw', size: 22 }, { k: 'pt', at: pj(1, 2, 1), name: 'C', dir: 'e', size: 22 },
      { k: 'pt', at: pjv(P), name: 'P', dir: 'w', c: 'p', size: 22 });
    if (o.Q) it.push({ k: 'seg', a: pjv(Q3), b: pjv(H3), c: 'p', wd: 3 }, { k: 'pt', at: pjv(Q3), name: 'Q', dir: 'nw', c: 'y', size: 22 }, { k: 'pt', at: pjv(H3), name: 'H', dir: 's', c: 'w', size: 22 });
    it.push(lab3(Kpt(-1.2), 'K', { c: 'b', size: 24, dx: 14 }));
    // 図の枠：使う点がすべて入るように（縦横比も合わせる）
    const all = [].concat(...it.map(p => p.pts || [p.at, p.a, p.b].filter(Boolean)));
    const xs = all.map(q => q[0]), ys = all.map(q => q[1]), m = 0.3;
    const v = [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m];
    let w = 690, h = Math.round(w * (v[3] - v[1]) / (v[2] - v[0])); if (h > 500) { h = 500; w = Math.round(h * (v[2] - v[0]) / (v[3] - v[1])); }
    return { t: 'fig', id, col: 1, view: v, w, h, items: it };
  };
  // 横から見た図（y 軸の方向から見る＝xz 平面に写す）
  const side = id => ({ t: 'fig', id, col: 1, view: [-3.3, -2.4, 5.5, 3.7], w: 560, h: 388, items: [
    { k: 'axes', tx: [[-2, '−2'], [4, '4']], ty: [[2, '2']], xl: 'x', yl: 'z' },
    { k: 'area', f: 'x+2', g: 'x-4', a: -3.3, b: 5.5, c: 'b', alpha: 0.12 },
    { k: 'line', m: 1, n: 2, c: 'b', wd: 2.5 }, { k: 'line', m: 1, n: -4, c: 'b', wd: 2.5 },
    { k: 'line', m: 1, n: -1, c: 'w', wd: 2, dash: true, label: 'ℓ : z = x − 1', lat: [2.1, 2.55], la: 'start' },
    { k: 'seg', a: [-2, 0], b: [4, 0], c: 'y', wd: 6 },
    { k: 'seg', a: [0, 2], b: [3, -1], c: 'b', wd: 4 }, { k: 'right', o: [1.5, 0.5], a: [2.5, 1.5], b: [2.25, -0.25], s: 14 },
    { k: 'pt', at: [1.5, 0.5], name: 'P', dir: 'w', c: 'p', size: 22 }, { k: 'pt', at: [-2, 0], c: 'y' }, { k: 'pt', at: [4, 0], c: 'y' },
    { k: 'label', at: [3.05, -1.25], text: 'K（横から）', c: 'b', size: 19, anchor: 'start', plain: true },
    { k: 'dim', a: [-2, 0], b: [4, 0], dy: 34, label: '6', c: 'y' }] });
  // 答えの楕円（xy 平面）
  const ell = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.9, -3.0, 5.1, 3.0], w: 560, h: 420, items: [
    { k: 'axes', tx: [[-2, '−2'], [1, '1'], [4, '4']], ty: [], xl: 'x', yl: 'y' },
    { k: 'param', x: '1+3*cos(t)', y: (R) + '*sin(t)', a: 0, b: 2 * Math.PI, c: 'y', wd: 3.5 },
    { k: 'seg', a: [1, -R], b: [1, R], c: 'd', dash: true, wd: 2 },
    { k: 'pt', at: [1, 0], c: 'w', r: 5 }, { k: 'pt', at: [-2, 0], c: 'y' }, { k: 'pt', at: [4, 0], c: 'y' },
    { k: 'pt', at: [1, R], name: '3√2/2', dir: 'n', c: 'y', size: 20 }, { k: 'pt', at: [1, -R], name: '−3√2/2', dir: 's', c: 'y', size: 20 }].concat(items || []) });
  const POINTS = [
    '3点を通る円の中心は「その平面の上」かつ「3点から等距離」。$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=\\frac12|\\overrightarrow{\\mathrm{AB}}|^2$ の形にすると1次式になる',
    '円柱面は **軸からの距離が一定の点の集まり**。軸上の点 H を文字 $u$ でおき、$\\overrightarrow{\\mathrm{QH}}\\perp$（軸）で $u$ を消す',
    '軸と平面のなす角が $\\theta$ のとき、切り口は短い半径 $r$、長い半径 $\\dfrac{r}{\\sin\\theta}$ の楕円（横から見た図で確かめる）'
  ];

  HB.lesson({
    id: 'kyushu26-1', field: '九大型　数学（理系）', title: '2026 九大 理系 第1問の類題 ― 斜めの円柱を平面で切った切り口', level: '2026年度 九州大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 3 点 $\\mathrm{A}(2,\\,2,\\,0)$，$\\mathrm{B}(0,\\,0,\\,2)$，$\\mathrm{C}(1,\\,2,\\,1)$ がある。3 点 A，B，C を通る平面を $\\alpha$、3 点 A，B，C を通る円を $K$ とする。$K$ を、$\\alpha$ に垂直な方向に平行移動させるとき、$K$ が通過してできる曲面（円柱の側面を限りなくのばしたもの）を $S$ とする。',
      parts: [
        '(1)　円 $K$ の中心 P の座標と、$K$ の半径を求めよ。',
        '(2)　$S$ と $xy$ 平面が交わってできる曲線の方程式を求め、その曲線を $xy$ 平面上に図示せよ。'
      ],
      src: '※ 2026年度 九州大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルと2次曲線の問題です。円を動かしてできる「斜めの円柱」を、$xy$ 平面で切ります。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.52, 0.48], part: '読みかえ', say: '見取図です。3 点 A，B，C を通る円 K（青）を、平面 α に垂直な向きにずらしていくと、斜めにかたむいた円柱の側面 S ができます。',
        add: [{ t: 'h', text: '図と問題の読みかえ' },
          { t: 'p', size: 'sm', text: '$K$ を $\\alpha$ に垂直に動かす\n→ 軸が $\\alpha$ に垂直な円柱面 $S$\n（緑の面が $xy$ 平面）' },
          fig3('g1', { tri: true })] },
      { ask: { type: 'choice', q: '平面 $\\alpha$ に垂直なベクトル（法線ベクトル）$\\vec n$ は？',
        opts: ['$(1,\\ 0,\\ 1)$', '$(1,\\ -1,\\ 0)$', '$(-1,\\ 0,\\ 1)$', '$(0,\\ 1,\\ 1)$'], ok: 0,
        why: { 1: '$\\overrightarrow{\\mathrm{AB}}$ とは垂直ですが、$\\overrightarrow{\\mathrm{AC}}=(-1,0,1)$ との内積が $-1$ です。', 2: '$\\overrightarrow{\\mathrm{AB}}=(-2,-2,2)$ との内積が $4$。垂直ではありません。', 3: '$\\overrightarrow{\\mathrm{AC}}$ との内積が $1$。2 本の両方と垂直でないといけません。' },
        good: '$\\vec n\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\ \\vec n\\cdot\\overrightarrow{\\mathrm{AC}}=0$ から $\\vec n=(1,0,1)$。$\\alpha$ は $x+z=2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(-2,\\,-2,\\,2),\\quad \\overrightarrow{\\mathrm{AC}}=(-1,\\,0,\\,1)' },
          { t: 'm', tex: '\\vec n=(1,\\,0,\\,1),\\qquad \\alpha:\\ x+z=2' }] } },
      { say: '方針です。(1) は「α の上にあって A，B，C から等距離の点」をさがします。(2) は S を「軸からの距離が一定の点の集まり」と見直すのが鍵です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) $\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ とおき、$\\mathrm{PA}=\\mathrm{PB}=\\mathrm{PC}$\n(2) 軸 ℓ 上の点 H をおき、$\\mathrm{QH}\\perp$ ℓ と $\\mathrm{QH}=$（半径）' }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.6, 0.4], part: '(1)', say: '中心 P は平面 α の上にあるので、$\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ とおけます。内積の値を先に表にしておきます。',
        add: [{ t: 'h', text: '(1)　円 K の中心 P と半径' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}', note: '← P は α 上' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['内積', '値'], ['$|\\overrightarrow{\\mathrm{AB}}|^2$', '$12$'], ['$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$', '$4$'], ['$|\\overrightarrow{\\mathrm{AC}}|^2$', '$2$']] }] },
      { ask: { type: 'choice', q: '$\\mathrm{PA}=\\mathrm{PB}$ を、$\\overrightarrow{\\mathrm{AP}}$ と $\\overrightarrow{\\mathrm{AB}}$ の内積で書くと？',
        opts: ['$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$', '$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=|\\overrightarrow{\\mathrm{AB}}|^2$', '$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=\\dfrac12|\\overrightarrow{\\mathrm{AB}}|^2$', '$|\\overrightarrow{\\mathrm{AP}}|=\\dfrac12|\\overrightarrow{\\mathrm{AB}}|$'], ok: 2,
        why: { 0: 'それは $\\mathrm{AP}\\perp\\mathrm{AB}$。A，B から等距離という条件ではありません。', 1: '$|\\overrightarrow{\\mathrm{AP}}-\\overrightarrow{\\mathrm{AB}}|^2$ を展開すると、内積に 2 がつきます。', 3: 'それは「A からの距離が AB の半分」という条件。B からも同じ距離とはかぎりません。' },
        good: '$\\mathrm{PB}^2=|\\overrightarrow{\\mathrm{AP}}-\\overrightarrow{\\mathrm{AB}}|^2=\\mathrm{PA}^2$ を展開して整理すると、この形。$\\mathrm{PA}=\\mathrm{PC}$ も同じです。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=\\frac12|\\overrightarrow{\\mathrm{AB}}|^2,\\quad \\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AC}}=\\frac12|\\overrightarrow{\\mathrm{AC}}|^2' }] } },
      { say: '左辺に $\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ を入れ、表の値を使うと、$s,\\ t$ の連立1次方程式になります。',
        add: [{ t: 'm', tex: '\\begin{cases} 12s+4t=6\\\\ 4s+2t=1\\end{cases}' }] },
      { ask: { type: 'think', q: 'この連立方程式を解いて、中心 P の座標を求めよう。',
        hint: '2 つ目の式を 2 倍して 1 つ目から引くと $t$ が消える。',
        ans: '$s=1,\\ t=-\\dfrac32$。$\\overrightarrow{\\mathrm{OP}}=(2,2,0)+(-2,-2,2)-\\dfrac32(-1,0,1)=\\left(\\dfrac32,\\ 0,\\ \\dfrac12\\right)$',
        after: 'P は α の上（$\\frac32+\\frac12=2$）。∠ACB が鈍角なので、P は三角形 ABC の外にあります。',
        add: [{ t: 'm', tex: 's=1,\\quad t=-\\frac32\\qquad \\mathrm{P}\\left(\\frac32,\\ 0,\\ \\frac12\\right)' }] } },
      { say: '半径は PA です。PB，PC も同じ値になることを確かめておくと、答案に安心して書けます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{PA}^2=\\frac14+4+\\frac14=\\frac92\\quad(=\\mathrm{PB}^2=\\mathrm{PC}^2)' },
          { t: 'ans', label: '(1) 答', text: '中心 $\\mathrm{P}\\left(\\dfrac32,\\ 0,\\ \\dfrac12\\right)$，半径 $\\dfrac{3\\sqrt2}{2}$' }] },

      // ---------- (2) 読みかえ ----------
      { clear: true, cols: [0.52, 0.48], part: '(2) 読みかえ', say: 'K を $u\\vec n$ だけずらした円（点線）は、中心が $\\mathrm{P}+u\\vec n$、半径は同じで、軸 ℓ に垂直な面の上にあります。S はこの円を全部集めたものです。',
        add: [{ t: 'h', text: '(2)　S を式で表すために' },
          { t: 'm', size: 'sm', tex: '\\ell:\\ \\left(\\tfrac32+u,\\ 0,\\ \\tfrac12+u\\right)', note: 'P を通り $\\vec n$ に平行\n（$u$ は実数）' },
          fig3('g2', { ax: true, K2: true, sil: true })] },
      { ask: { type: 'choice', q: '$r=\\dfrac{3\\sqrt2}2$（K の半径）とする。点 Q が S 上にある条件は？',
        opts: ['$\\mathrm{PQ}=r$', 'Q と ℓ の距離が $r$', 'Q と α の距離が $r$', 'Q が α 上で $\\mathrm{PQ}=r$'], ok: 1,
        why: { 0: 'それは P を中心とする球面です。', 2: 'それは α に平行な 2 枚の平面になります。', 3: 'それは円 K そのもの。S のほんの一部です。' },
        good: 'Q を通り ℓ に垂直な平面で S を切ると、ℓ 上の点 H を中心とする半径 $r$ の円。だから $\\mathrm{QH}=r$（H は垂線の足）。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '読みかえ', text: 'Q が S 上 ⇔ ℓ 上の点 H で\n$\\overrightarrow{\\mathrm{QH}}\\perp\\vec n$ かつ $\\mathrm{QH}=\\dfrac{3\\sqrt2}{2}$' }] } },

      // ---------- (2) 答案 ----------
      { clear: true, cols: [0.55, 0.45], part: '(2) 答案', say: '$xy$ 平面上の点を $\\mathrm{Q}(x,\\,y,\\,0)$、ℓ 上の点を $\\mathrm{H}\\left(\\frac32+u,\\ 0,\\ \\frac12+u\\right)$ とおきます。まず「垂直」の条件で $u$ を決めます。',
        add: [{ t: 'h', text: '(2)　Q(x, y, 0) が S 上にある条件' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{QH}}=\\left(\\tfrac32+u-x,\\ -y,\\ \\tfrac12+u\\right)' },
          fig3('g3', { ax: true, sil: true, Q: true })] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{QH}}\\cdot\\vec n=0$ から、$u$ は？',
        opts: ['$u=x-\\dfrac32$', '$u=\\dfrac{x-1}{2}$', '$u=\\dfrac{2-x}{2}$', '$u=\\dfrac{x-2}{2}$'], ok: 3,
        why: { 0: '$z$ 成分の $\\frac12+u$ を忘れて、$x$ 成分だけを 0 にしています。', 1: '定数の和 $\\frac32+\\frac12=2$ を正しく入れましょう。', 2: '符号が逆です。$2u+2-x=0$ を解き直しましょう。' },
        good: '$\\left(\\frac32+u-x\\right)+\\left(\\frac12+u\\right)=0$ より $2u=x-2$。',
        add: [{ t: 'm', size: 'sm', tex: 'u=\\frac{x-2}{2}\\ \\Longrightarrow\\ \\overrightarrow{\\mathrm{QH}}=\\left(\\frac{1-x}{2},\\ -y,\\ \\frac{x-1}{2}\\right)' }] } },
      { say: '長さの条件 $\\mathrm{QH}^2=\\frac92$ に入れます。$x$ 成分と $z$ 成分は同じ大きさなので、まとめて $\\frac{(x-1)^2}{2}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\mathrm{QH}^2&=\\frac{(x-1)^2}{4}+y^2+\\frac{(x-1)^2}{4}\\\\ &=\\frac{(x-1)^2}{2}+y^2=\\frac92\\end{aligned}' }] },
      { say: '両辺を $\\frac92$ で割ると楕円の形。逆にこの式をみたす Q は、$u=\\frac{x-2}2$ の H で条件をみたすので S 上。図の黄色の曲線です。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\frac{(x-1)^2}{9}+\\frac{y^2}{\\frac92}=1' }],
        draw: [{ fig: 'g3', items: [{ k: 'poly', pts: loop(ph => pj(1 + 3 * Math.cos(ph), R * Math.sin(ph), 0)), c: 'y', wd: 3.5 }] }] },
      { ask: { type: 'choice', q: 'この楕円の「$x$ 方向の半径」と「$y$ 方向の半径」は？',
        opts: ['$9$ と $\\dfrac92$', '$\\dfrac{3\\sqrt2}2$ と $3$', '$3$ と $\\dfrac32$', '$3$ と $\\dfrac{3\\sqrt2}2$'], ok: 3,
        why: { 0: '分母は半径の 2 乗です。$\\sqrt9=3$、$\\sqrt{\\frac92}=\\frac{3\\sqrt2}2$。', 1: '$x$ と $y$ が逆です。分母の大きい $x$ のほうが長い。', 2: '$\\sqrt{\\frac92}=\\frac{3}{\\sqrt2}=\\frac{3\\sqrt2}2$。2 で割るのは根号の中だけです。' },
        good: '中心 $(1,\\,0)$、$x$ 方向に 3、$y$ 方向に $\\frac{3\\sqrt2}2$（円柱の半径と同じ）。' } },

      // ---------- (2) 図示 ----------
      { clear: true, cols: [0.44, 0.56], part: '(2) 図示', say: '図示します。中心 $(1,\\,0)$、$x$ 軸との交点は $(4,\\,0)$ と $(-2,\\,0)$、$y$ 方向の半径は $\\frac{3\\sqrt2}2\\approx2.12$ です。',
        add: [{ t: 'h', text: '(2)　図示' },
          { t: 'p', size: 'sm', text: '中心 $(1,\\,0)$\n$x$ 方向の半径 $3$\n$y$ 方向の半径 $\\dfrac{3\\sqrt2}2$' },
          ell('e1')] },
      { ask: { type: 'think', q: '検算：点 $(2,\\,2)$ と $(2,\\,-2)$ が曲線上にあることを確かめ、なぜこの 2 点を通るのかを考えよう。',
        hint: '方程式に代入する。また、円 K と $xy$ 平面がどこで交わるかを考える。',
        ans: '$\\dfrac{1}{9}+\\dfrac{4}{9/2}=\\dfrac19+\\dfrac89=1$。どちらも曲線上にある',
        after: 'K は S の一部。K は α : $x+z=2$ 上なので、$z=0$ では $x=2$。K と $xy$ 平面は A(2, 2, 0) と (2, −2, 0) で交わります。',
        draw: [{ fig: 'e1', items: [{ k: 'pt', at: [2, 2], name: 'A', dir: 'ne', c: 'b', size: 22 }, { k: 'pt', at: [2, -2], name: '(2, −2)', dir: 'se', c: 'b', size: 20 }] }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '$y$ 軸の方向から横に見ると、ℓ は $z=x-1$、円柱は幅 $3\\sqrt2$ の帯、K は ℓ に垂直な線分に見えます。帯を $z=0$ で切ると、長さは 6 です。',
        add: [{ t: 'h', text: '別の見方：横から見る' },
          { t: 'm', size: 'sm', tex: '\\frac{3\\sqrt2}{2}\\times\\sqrt2=3', note: '$x$ 方向の半径\n（ℓ と $xy$ 平面は 45°）' },
          side('sv')] },
      { ask: { type: 'choice', q: '半径 $r$ の円柱の軸と平面のなす角が $\\theta$ のとき、切り口の楕円の長いほうの半径は？',
        opts: ['$r\\sin\\theta$', '$r\\cos\\theta$', '$\\dfrac{r}{\\sin\\theta}$', '$\\dfrac{r}{\\cos\\theta}$'], ok: 2,
        why: { 0: '$\\theta=45^\\circ$ で $\\frac{3\\sqrt2}2\\cdot\\frac{\\sqrt2}2=\\frac32$。円柱の半径より短くなってしまいます。', 1: '$\\theta=90^\\circ$（軸が真上）で 0 になります。そのとき切り口は半径 $r$ の円のはず。', 3: '$\\theta=90^\\circ$ で分母が 0 です。軸が真上なら切り口は円です。' },
        good: '帯の幅 $2r$ を斜めに切ると長さ $\\frac{2r}{\\sin\\theta}$。ここでは $\\frac{3\\sqrt2/2}{\\sin45^\\circ}=3$ で、答えと一致します。' } },
      { say: 'S 全体の式も出せます。$(x,\\,y,\\,z)$ のまま同じ計算をすると、S は $(x-z-1)^2+2y^2=9$。$z=0$ とおけば (2) の答えです。',
        add: [{ t: 'm', tex: 'S:\\ (x-z-1)^2+2y^2=9' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・S を「軸からの距離が一定」と見る理由を書く\n・H の文字 $u$ を、垂直の条件で消す\n・図に中心・$x$ 軸との交点・$y$ 方向の半径' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「円柱＝軸からの距離が一定」と読みかえられるかどうかが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
