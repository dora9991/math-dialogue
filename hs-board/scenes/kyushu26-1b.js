/* 九大型 数学（理系）：2026年度 九州大学 前期 理系 第1問の類題②（自作問題・元の問題ではない）
   問題：A(−1,−2,2), B(1,−2,2), C(1,−3,1) を通る円 K。V(0,−4,3) と K 上の点を結ぶ直線全体（円すい面 S）と、xy 平面の交わり
   答え（python3・sympy で検算ずみ）：
     平面 ABC：法線 (0,1,−1)、z−y=4。|AB|²=4, AB·AC=4, |AC|²=6
     (1) AP = s AB + t AC で 4s+4t=2, 4s+6t=3 → s=0, t=1/2。中心 P(0, −5/2, 3/2)（AC の中点、∠B=90°）、半径 √6/2（PA²=PB²=PC²=3/2）
     (2) VP=(0,3/2,−3/2)∥(0,1,−1)（V は軸上）。h=|VP|=3√2/2, r=√6/2, tanφ=r/h=1/√3 → 半頂角 φ=30°
         Q(x,y,0): VQ=(x,y+4,−3), VQ·n=y+7。(VQ·n)²=|VQ|²|n|²cos²30° → 2(y+7)²=3{x²+(y+4)²+9}
         → 3x²+(y−2)²=27 → x²/9 + (y−2)²/27 = 1（中心 (0,2)、x 方向 3、y 方向 3√3）
         A,B,C を通る母線は (−3,2,0), (3,2,0), (3/2,−5/2,0) で xy 平面と交わる（すべて楕円上）
         横から（x=0 の面）：母線は水平から 15°・75° 下向き → y=2±3√3。軸は (0,−1,0) で xy 平面と交わる（楕円の中心ではない） */
(function () {
  const S3 = Math.sqrt(3), R = Math.sqrt(6) / 2, P = [0, -2.5, 1.5], V = [0, -4, 3], N3 = [0, 1, -1];
  // 見取図：z 軸のまわりに −20°、上から 32° 見下ろす（x 軸は右、y 軸は奥＝右上へ）
  const PS = -12 * Math.PI / 180, EL = 13 * Math.PI / 180;
  const pj = (x, y, z) => [x * Math.cos(PS) - y * Math.sin(PS), z * Math.cos(EL) + (x * Math.sin(PS) + y * Math.cos(PS)) * Math.sin(EL)];
  const pjv = v => pj(v[0], v[1], v[2]);
  const Kpt = ph => [R * Math.cos(ph), P[1] + (R / Math.SQRT2) * Math.sin(ph), P[2] + (R / Math.SQRT2) * Math.sin(ph)];   // K 上の点（平面 z−y=4）
  const Eq = th => [3 * Math.cos(th), 2 + 3 * S3 * Math.sin(th), 0];                                                      // 楕円上の点
  const loop = fn => { const a = []; for (let i = 0; i <= 144; i++) a.push(fn(2 * Math.PI * i / 144)); return a; };
  const Xof = q => { const s = 3 / (q[1] + 7); return [V[0] + s * (q[0] - V[0]), V[1] + s * (q[1] - V[1]), V[2] + s * (q[2] - V[2])]; };   // V→Q の母線が K と交わる点
  const lab3 = (v, text, o) => Object.assign({ k: 'label', at: pjv(v), text, size: 22 }, o || {});
  const fig3 = (id, o) => {
    o = o || {};
    const it = [
      { k: 'poly', pts: [[-4.5, -5.2, 0], [4.5, -5.2, 0], [4.5, 8.4, 0], [-4.5, 8.4, 0]].map(pjv), close: true, fill: 'g', alpha: 0.1, noStroke: true },
      { k: 'vec', a: pj(0, 0, 0), b: pj(4.9, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, 0, 0), b: pj(0, 8.9, 0), c: 'd', wd: 2 },
      lab3([5.2, 0, 0], 'x', { c: 'd' }), lab3([0, 9.3, 0], 'y', { c: 'd' })
    ];
    if (o.gen) {
      const ths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => i * Math.PI / 6 + 0.26);
      ths.forEach(th => { const q = Eq(th), x = Xof(q); it.push({ k: 'seg', a: pjv(V), b: pjv(x), c: 'b', wd: 1.5 }, { k: 'seg', a: pjv(x), b: pjv(q), c: 'b', wd: 1.2, dash: true }); });
    }
    if (o.E) it.push({ k: 'poly', pts: loop(th => pjv(Eq(th))), c: 'y', wd: 3.5, id: id + 'E' });
    if (o.ax) it.push({ k: 'seg', a: pjv(V), b: pjv([0, -1, 0]), c: 'w', wd: 2, dash: true }, lab3([0, -0.4, 0.1], 'ℓ', { c: 'w', size: 24, dx: 14 }));
    it.push({ k: 'poly', pts: loop(ph => pjv(Kpt(ph))), c: 'b', wd: 3.5 });
    if (o.tri) it.push({ k: 'poly', pts: [[-1, -2, 2], [1, -2, 2], [1, -3, 1]].map(pjv), close: true, c: 'g', wd: 2 });
    it.push({ k: 'pt', at: pj(-1, -2, 2), name: 'A', dir: 'nw', size: 22 }, { k: 'pt', at: pj(1, -2, 2), name: 'B', dir: 'e', size: 22 }, { k: 'pt', at: pj(1, -3, 1), name: 'C', dir: 'se', size: 22 },
      { k: 'pt', at: pjv(P), name: 'P', dir: 'w', c: 'p', size: 22 }, { k: 'pt', at: pjv(V), name: 'V', dir: 'n', c: 'y', size: 24 });
    if (o.Q) { const q = [1.5, -0.1, 0]; it.push({ k: 'seg', a: pjv(V), b: pjv(q), c: 'p', wd: 3 }, { k: 'pt', at: pjv(q), name: 'Q', dir: 'se', c: 'y', size: 22 }); }
    it.push(lab3(Kpt(-1.9), 'K', { c: 'b', size: 24, dx: -18 }));
    const all = [].concat(...it.map(p => p.pts || [p.at, p.a, p.b].filter(Boolean)));
    const xs = all.map(q => q[0]), ys = all.map(q => q[1]), m = 0.3;
    const v = [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m];
    let w = 690, h = Math.round(w * (v[3] - v[1]) / (v[2] - v[0])); if (h > 500) { h = 500; w = Math.round(h * (v[2] - v[0]) / (v[3] - v[1])); }
    return { t: 'fig', id, col: 1, view: v, w, h, items: it };
  };
  // 横から見た図（x 軸の方向から見る＝yz 平面に写す）。横軸 y・縦軸 z
  const Y1 = 2 + 3 * S3, Y2 = 2 - 3 * S3;
  const side = id => ({ t: 'fig', id, col: 1, view: [-6.4, -1.3, 9.4, 4.7], w: 640, h: 248, items: [
    { k: 'axes', tx: [[2, '2']], ty: [[3, '3']], xl: 'y', yl: 'z' },
    { k: 'line', m: 1, n: 4, c: 'b', wd: 1.5, dash: true },
    { k: 'seg', a: [P[1] - S3 / 2, P[2] - S3 / 2], b: [P[1] + S3 / 2, P[2] + S3 / 2], c: 'b', wd: 5 },
    { k: 'seg', a: [-4, 3], b: [-1, 0], c: 'w', wd: 2, dash: true },
    { k: 'seg', a: [-4, 3], b: [Y1, 0], c: 'b', wd: 2.5 }, { k: 'seg', a: [-4, 3], b: [Y2, 0], c: 'b', wd: 2.5 },
    { k: 'seg', a: [Y2, 0], b: [Y1, 0], c: 'y', wd: 6 },
    { k: 'pt', at: [-4, 3], name: 'V', dir: 'n', c: 'y', size: 22 }, { k: 'pt', at: [P[1], P[2]], c: 'p' },
    { k: 'pt', at: [Y2, 0], c: 'y' }, { k: 'pt', at: [Y1, 0], c: 'y' }, { k: 'pt', at: [-1, 0], c: 'w', name: '(−1)', dir: 's', size: 18 },
    { k: 'label', at: [-1.9, 0.75], text: 'K（横から）', c: 'b', size: 18, anchor: 'start', plain: true },
    { k: 'label', at: [5.1, 1.8], text: '母線', c: 'b', size: 18, anchor: 'start', plain: true },
    { k: 'label', at: [Y2 - 0.3, -0.6], text: '2−3√3', c: 'y', size: 18, anchor: 'end', plain: true },
    { k: 'label', at: [Y1 + 0.2, -0.6], text: '2+3√3', c: 'y', size: 18, anchor: 'middle', plain: true }] });
  // 答えの楕円（xy 平面）
  const ell = (id, items) => ({ t: 'fig', id, col: 1, view: [-5.2, -4.4, 5.2, 7.6], w: 410, h: 473, items: [
    { k: 'axes', tx: [[-3, '−3'], [3, '3']], ty: [[2, '2']], xl: 'x', yl: 'y' },
    { k: 'param', x: '3*cos(t)', y: '2+' + (3 * S3) + '*sin(t)', a: 0, b: 2 * Math.PI, c: 'y', wd: 3.5 },
    { k: 'seg', a: [-3, 2], b: [3, 2], c: 'd', dash: true, wd: 2 }, { k: 'seg', a: [0, 2 - 3 * S3], b: [0, 2 + 3 * S3], c: 'd', dash: true, wd: 2 },
    { k: 'pt', at: [0, 2], c: 'w', r: 5 }, { k: 'pt', at: [-3, 2], c: 'y' }, { k: 'pt', at: [3, 2], c: 'y' },
    { k: 'pt', at: [0, 2 + 3 * S3], name: '2+3√3', dir: 'ne', c: 'y', size: 20 }, { k: 'pt', at: [0, 2 - 3 * S3], name: '2−3√3', dir: 'se', c: 'y', size: 20 }].concat(items || []) });
  const POINTS = [
    '3点を通る円の中心は「その平面の上」かつ「3点から等距離」。$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=\\frac12|\\overrightarrow{\\mathrm{AB}}|^2$ の形にすると1次式になる。$s=0$ なら P は辺の中点（直角三角形）',
    '円すい面は **軸とのなす角が一定の点の集まり**。頂点 V から Q へのベクトル $\\overrightarrow{\\mathrm{VQ}}$ と軸の向き $\\vec n$ の内積で、$\\cos$ の条件を式にする（両辺を2乗すれば符号も気にならない）',
    '半頂角が $30^\\circ$、軸と平面のなす角が $45^\\circ$ なら、切り口は楕円。横から見た図で、母線が $15^\\circ$・$75^\\circ$ になることから長い軸の両端を確かめる'
  ];

  HB.lesson({
    id: 'kyushu26-1b', field: '九大型　数学（理系）', title: '2026 九大 理系 第1問の類題② ― 斜めの円すいを平面で切った切り口', level: '2026年度 九州大学 理系 第1問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '座標空間に 4 点 $\\mathrm{A}(-1,\\,-2,\\,2)$，$\\mathrm{B}(1,\\,-2,\\,2)$，$\\mathrm{C}(1,\\,-3,\\,1)$，$\\mathrm{V}(0,\\,-4,\\,3)$ がある。3 点 A，B，C を通る平面を $\\alpha$、3 点 A，B，C を通る円を $K$ とする。V は、$K$ の中心を通り $\\alpha$ に垂直な直線の上にある。V と $K$ 上の点を結ぶ直線全体（円すいの側面を限りなくのばしたもの）を $S$ とする。',
      parts: [
        '(1)　円 $K$ の中心 P の座標と、$K$ の半径を求めよ。',
        '(2)　$S$ と $xy$ 平面が交わってできる曲線の方程式を求め、その曲線を $xy$ 平面上に図示せよ。'
      ],
      src: '※ 2026年度 九州大学 前期 理系 第1問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルと2次曲線の問題です。円と頂点 V を結んでできる「斜めの円すい」を、$xy$ 平面で切ります。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.5, 0.5], part: '読みかえ', say: '見取図です。3 点 A，B，C を通る円 K（青）と、その上にある頂点 V。V と K の点を結ぶ直線をずらして集めると、斜めにかたむいた円すい面 S になります。',
        add: [{ t: 'h', text: '図と問題の読みかえ' },
          { t: 'p', size: 'sm', text: 'V と K 上の点を結ぶ直線\n→ 円すい面 $S$\n（緑の面が $xy$ 平面）' },
          fig3('g1', { tri: true })] },
      { ask: { type: 'choice', q: '平面 $\\alpha$ に垂直なベクトル（法線ベクトル）$\\vec n$ は？',
        opts: ['$(0,\\ 1,\\ 1)$', '$(1,\\ 0,\\ 0)$', '$(0,\\ 1,\\ -1)$', '$(1,\\ -1,\\ 1)$'], ok: 2,
        why: { 0: '$\\overrightarrow{\\mathrm{AB}}=(2,0,0)$ とは垂直ですが、$\\overrightarrow{\\mathrm{AC}}=(2,-1,-1)$ との内積が $-2$ です。', 1: '$\\overrightarrow{\\mathrm{AB}}$ と同じ向きです。垂直ではありません。', 3: '$\\overrightarrow{\\mathrm{AB}}$ との内積が $2$。2 本の両方と垂直でないといけません。' },
        good: '$\\vec n\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\ \\vec n\\cdot\\overrightarrow{\\mathrm{AC}}=0$ から $\\vec n=(0,1,-1)$。$\\alpha$ は $z-y=4$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(2,\\,0,\\,0),\\quad \\overrightarrow{\\mathrm{AC}}=(2,\\,-1,\\,-1)' },
          { t: 'm', tex: '\\vec n=(0,\\,1,\\,-1),\\qquad \\alpha:\\ z-y=4' }] } },
      { say: '方針です。(1) は「α の上にあって A，B，C から等距離の点」をさがします。(2) は S を「軸とのなす角が一定の点の集まり」と見直すのが鍵です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) $\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ とおき、$\\mathrm{PA}=\\mathrm{PB}=\\mathrm{PC}$\n(2) 軸と母線のなす角 $\\varphi$ を出し、$\\overrightarrow{\\mathrm{VQ}}$ と軸の角が $\\varphi$ となる条件を式にする' }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.6, 0.4], part: '(1)', say: '中心 P は平面 α の上にあるので、$\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ とおけます。$\\mathrm{PA}=\\mathrm{PB}$ と $\\mathrm{PA}=\\mathrm{PC}$ は、内積の式にすると 1 次式です。',
        add: [{ t: 'h', text: '(1)　円 K の中心 P と半径' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=\\frac12|\\overrightarrow{\\mathrm{AB}}|^2,\\quad \\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AC}}=\\frac12|\\overrightarrow{\\mathrm{AC}}|^2' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['内積', '値'], ['$|\\overrightarrow{\\mathrm{AB}}|^2$', '$4$'], ['$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$', '$4$'], ['$|\\overrightarrow{\\mathrm{AC}}|^2$', '$6$']] }] },
      { say: '$\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ を入れ、表の値を使うと、$s,\\ t$ の連立1次方程式になります。',
        add: [{ t: 'm', tex: '\\begin{cases} 4s+4t=2\\\\ 4s+6t=3\\end{cases}' }] },
      { ask: { type: 'think', q: 'この連立方程式を解いて、中心 P の座標を求めよう。',
        hint: '2 つの式を引くと $s$ が消える。',
        ans: '$t=\\dfrac12,\\ s=0$。$\\overrightarrow{\\mathrm{OP}}=(-1,-2,2)+\\dfrac12(2,-1,-1)=\\left(0,\\ -\\dfrac52,\\ \\dfrac32\\right)$',
        after: '$s=0$ なので P は線分 AC の中点です。つまり AC が円の直径で、∠ABC は $90^\\circ$（半円の上の角）になっています。',
        add: [{ t: 'm', tex: 's=0,\\quad t=\\frac12\\qquad \\mathrm{P}\\left(0,\\ -\\frac52,\\ \\frac32\\right)' }] } },
      { say: '半径は PA です。PB，PC も同じ値になることを確かめておくと、答案に安心して書けます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{PA}^2=1+\\frac14+\\frac14=\\frac32\\quad(=\\mathrm{PB}^2=\\mathrm{PC}^2)' },
          { t: 'ans', label: '(1) 答', text: '中心 $\\mathrm{P}\\left(0,\\ -\\dfrac52,\\ \\dfrac32\\right)$，半径 $\\dfrac{\\sqrt6}{2}$' }] },

      // ---------- (2) 読みかえ ----------
      { clear: true, cols: [0.5, 0.5], part: '(2) 読みかえ', say: 'V は軸 ℓ の上にあります（$\\overrightarrow{\\mathrm{VP}}=(0,\\tfrac32,-\\tfrac32)$ は $\\vec n$ の向き）。軸の長さ VP を $h$、円の半径を $r$ とすると、母線と軸のなす角 $\\varphi$ は $\\tan\\varphi=\\dfrac rh$ です。',
        add: [{ t: 'h', text: '(2)　S を式で表すために' },
          { t: 'm', size: 'sm', tex: 'h=\\mathrm{VP}=\\frac{3\\sqrt2}{2},\\quad r=\\frac{\\sqrt6}{2}', note: '$\\overrightarrow{\\mathrm{VP}}=\\tfrac32(0,1,-1)$' },
          fig3('g2', { ax: true, gen: true })] },
      { ask: { type: 'choice', q: '$\\tan\\varphi=\\dfrac rh$ を計算して、母線と軸のなす角 $\\varphi$（鋭角）は？',
        opts: ['$60^\\circ$', '$45^\\circ$', '$15^\\circ$', '$30^\\circ$'], ok: 3,
        why: { 0: '$\\tan60^\\circ=\\sqrt3$ です。$\\frac rh$ ではなく $\\frac hr$ を計算しています。', 1: '$\\tan45^\\circ=1$ になるのは $r=h$ のとき。ここでは $r<h$ です。', 2: '$\\tan15^\\circ=2-\\sqrt3\\approx0.27$。$\\frac rh=\\frac{\\sqrt3}{3}\\approx0.58$ とは合いません。' },
        good: '$\\dfrac rh=\\dfrac{\\sqrt6/2}{3\\sqrt2/2}=\\dfrac{\\sqrt3}{3}$ なので $\\varphi=30^\\circ$。円すい面は、軸との角が $30^\\circ$ の直線の集まりです。',
        add: [{ t: 'm', size: 'sm', tex: '\\tan\\varphi=\\frac{r}{h}=\\frac{\\sqrt3}{3}\\ \\Longrightarrow\\ \\varphi=30^\\circ' }] } },
      { ask: { type: 'choice', q: 'Q が S 上にある（$z=0$ の点 Q）ための条件は？',
        opts: ['$\\mathrm{VQ}=h$', '$\\mathrm{PQ}=r$', 'Q と軸 ℓ の距離が $r$', '直線 VQ が ℓ と $30^\\circ$ の角をなす'], ok: 3,
        why: { 0: 'それは V を中心とする球面です。', 1: 'それは P を中心とする球面です。', 2: 'それは円柱面。円すいでは、V から遠いほど軸からの距離が大きくなります。' },
        good: '円すい面は「V を通り、軸と $30^\\circ$ の角をなす直線」の集まり。$\\overrightarrow{\\mathrm{VQ}}$ と $\\vec n$ のなす角が $30^\\circ$ か $150^\\circ$ です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '読みかえ', text: 'Q が S 上 ⇔ $\\overrightarrow{\\mathrm{VQ}}$ と $\\vec n$ のなす角が\n$30^\\circ$ または $150^\\circ$\n⇔ $(\\overrightarrow{\\mathrm{VQ}}\\cdot\\vec n)^2=|\\overrightarrow{\\mathrm{VQ}}|^2|\\vec n|^2\\cos^2 30^\\circ$' }] } },

      // ---------- (2) 答案 ----------
      { clear: true, cols: [0.55, 0.45], part: '(2) 答案', say: '$xy$ 平面上の点を $\\mathrm{Q}(x,\\,y,\\,0)$ とします。$\\overrightarrow{\\mathrm{VQ}}=(x,\\ y+4,\\ -3)$、軸の向きは $\\vec n=(0,1,-1)$ でした。',
        add: [{ t: 'h', text: '(2)　Q(x, y, 0) が S 上にある条件' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{VQ}}=(x,\\ y+4,\\ -3),\\quad |\\vec n|^2=2' },
          { t: 'm', size: 'sm', tex: '(\\overrightarrow{\\mathrm{VQ}}\\cdot\\vec n)^2=|\\overrightarrow{\\mathrm{VQ}}|^2|\\vec n|^2\\cdot\\frac34' },
          fig3('g3', { ax: true, gen: true, Q: true })] },
      { ask: { type: 'choice', q: '内積 $\\overrightarrow{\\mathrm{VQ}}\\cdot\\vec n$ は？',
        opts: ['$y+1$', '$y+7$', '$y-1$', '$x+y+7$'], ok: 1,
        why: { 0: '$z$ 成分は $(-3)\\times(-1)=+3$。$y+4$ に足すのは $+3$ です。', 2: '$-3\\times(-1)$ の符号を逆にしています。', 3: '$\\vec n$ の $x$ 成分は 0。$x$ は入りません。' },
        good: '$x\\cdot0+(y+4)\\cdot1+(-3)(-1)=y+7$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{VQ}}\\cdot\\vec n=y+7' }] } },
      { say: '条件に入れて整理します。両辺を 2 倍して、$y$ の 2 次式をそろえると、$x^2$ と $(y-2)^2$ の式になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}2(y+7)^2&=3x^2+3(y+4)^2+27\\\\ 3x^2+y^2-4y&=23\\\\ 3x^2+(y-2)^2&=27\\end{aligned}' }] },
      { say: '両辺を 27 で割ると楕円の形。逆にこの式をみたす Q は、角が $30^\\circ$ か $150^\\circ$ になるので S 上にあります。図の黄色の曲線です。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\frac{x^2}{9}+\\frac{(y-2)^2}{27}=1' }],
        draw: [{ fig: 'g3', items: [{ k: 'poly', pts: loop(th => pjv(Eq(th))), c: 'y', wd: 3.5 }] }] },
      { ask: { type: 'choice', q: 'この楕円の「$x$ 方向の半径」と「$y$ 方向の半径」は？',
        opts: ['$9$ と $27$', '$3$ と $3\\sqrt3$', '$3\\sqrt3$ と $3$', '$3$ と $\\dfrac{27}{2}$'], ok: 1,
        why: { 0: '分母は半径の 2 乗です。$\\sqrt9=3$、$\\sqrt{27}=3\\sqrt3$。', 2: '$x$ と $y$ が逆です。$x^2$ の分母は 9、$(y-2)^2$ の分母は 27。', 3: '$\\sqrt{27}=3\\sqrt3$。2 で割る必要はありません。' },
        good: '中心 $(0,\\,2)$、$x$ 方向に 3、$y$ 方向に $3\\sqrt3\\approx5.20$ の、たて長の楕円です。' } },

      // ---------- (2) 図示 ----------
      { clear: true, cols: [0.5, 0.5], part: '(2) 図示', say: '図示します。中心は $(0,\\,2)$。$y=2$ との交点が $(\\pm3,\\,2)$、$x=0$ との交点が $(0,\\,2\\pm3\\sqrt3)$ です。',
        add: [{ t: 'h', text: '(2)　図示' },
          { t: 'p', size: 'sm', text: '中心 $(0,\\,2)$\n$x$ 方向の半径 $3$\n$y$ 方向の半径 $3\\sqrt3$' },
          { t: 'p', size: 'sm', text: '$y$ の範囲は\n$2-3\\sqrt3\\approx-3.2$ から\n$2+3\\sqrt3\\approx7.2$ まで' },
          ell('e1')] },
      { ask: { type: 'think', q: '検算：K 上の点 A，B，C を通る母線（V から出る直線）が $xy$ 平面と交わる点を求めて、楕円の上にあることを確かめよう。',
        hint: 'V から B への向きは $(1,\\,2,\\,-1)$。$z$ 座標が 0 になるまで 3 倍する。',
        ans: 'B → $(3,\\,2,\\,0)$、A → $(-3,\\,2,\\,0)$、C → $\\left(\\dfrac32,\\,-\\dfrac52,\\,0\\right)$。たとえば C は $\\dfrac{9/4}{9}+\\dfrac{(-9/2)^2}{27}=\\dfrac14+\\dfrac34=1$',
        after: 'K は S の一部なので、K 上の点を通る母線の交点は必ず切り口の上にあります。',
        draw: [{ fig: 'e1', items: [{ k: 'pt', at: [3, 2], name: 'B′', dir: 'ne', c: 'b', size: 21 }, { k: 'pt', at: [-3, 2], name: 'A′', dir: 'nw', c: 'b', size: 21 }, { k: 'pt', at: [1.5, -2.5], name: 'C′', dir: 'se', c: 'b', size: 21 }] }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.4, 0.6], part: '別の見方', say: '$x=0$ の面を横から見ます。母線は水平から $15^\\circ$ と $75^\\circ$ 下を向き（軸が $45^\\circ$、半頂角が $30^\\circ$）、$z=0$ と $y=2\\pm3\\sqrt3$ で交わります。',
        add: [{ t: 'h', text: '別の見方：横から見る' },
          { t: 'm', size: 'sm', tex: '45^\\circ\\pm30^\\circ=\\begin{cases}75^\\circ\\\\ 15^\\circ\\end{cases}', note: '水平からの角' },
          { t: 'm', size: 'sm', tex: 'y=-4+\\frac{3}{\\tan15^\\circ},\\ -4+\\frac{3}{\\tan75^\\circ}' },
          side('sv')] },
      { ask: { type: 'choice', q: '軸 ℓ（V を通り $\\vec n$ の向き）が $xy$ 平面と交わる点は？',
        opts: ['$(0,\\ 2,\\ 0)$', '$(0,\\ -4,\\ 0)$', '$(0,\\ -\\dfrac52,\\ 0)$', '$(0,\\ -1,\\ 0)$'], ok: 3,
        why: { 0: 'それは楕円の中心です。軸が $xy$ 平面と交わる点とは別の点になります。', 1: 'V の真下の点です。軸はななめなので、V の真下ではありません。', 2: 'それは円の中心 P の $y$ 座標。$z=0$ まで軸をのばします。' },
        good: '$\\mathrm{V}+u(0,1,-1)$ で $z=0$ とすると $u=3$、$(0,\\,-1,\\,0)$。楕円の中心 $(0,\\,2)$ とはずれています（斜めに切ったため）。' } },
      { say: '答案では、円すい面を「軸との角が一定」と言いかえる理由と、内積の式を書きます。ここが採点で見られます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・半頂角（$\\tan\\varphi=r/h$）を出し、S の条件を式にする\n・2乗して符号の場合分けをなくす（$30^\\circ$ と $150^\\circ$ を両方ふくめる）\n・図に中心・$x$ 方向の半径・$y$ 方向の半径' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「円すい＝軸とのなす角が一定」と読みかえられるかどうかが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
