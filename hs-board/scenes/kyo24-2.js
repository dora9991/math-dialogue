/* 2024 京大 理系 第2問の類題（自作）：|z|≦2、z+z̄≧2 のとき、w=z² の動く範囲と面積
   答え（python3 で検算ずみ。モンテカルロでも約 26.55）：
   範囲 = { |w|≦4 かつ u≧1−v²/4 }（w=u+vi）。円 |w|=4 と放物線 u=1−v²/4 の交点は −2±2√3 i
   面積 = 16π −（放物線の内側の部分 16π/3+4√3）= 32π/3 − 4√3 ≒ 26.58 */
(function () {
  const r3 = Math.sqrt(3), h3 = 2 * r3;
  const arcPts = (R, a1, a2, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = (a1 + (a2 - a1) * i / n) * Math.PI / 180; o.push([R * Math.cos(t), R * Math.sin(t)]); } return o; };
  const parPts = (v1, v2, n) => { const o = []; for (let i = 0; i <= n; i++) { const v = v1 + (v2 - v1) * i / n; o.push([1 - v * v / 4, v]); } return o; };
  // z 平面：|z|≦2 かつ x≧1（弓形）
  const zSeg = arcPts(2, -60, 60, 40);
  const zfig = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-2.6, -2.6, 2.9, 2.6], w: w || 420, h: Math.round((w || 420) * 5.2 / 5.5), items: [
    { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [], xl: '実軸', yl: '虚軸' },
    { k: 'circle', o: [0, 0], r: 2, c: 'd', wd: 2 },
    { k: 'poly', pts: zSeg, close: true, fill: 'y', alpha: 0.3, noStroke: true },
    { k: 'poly', pts: zSeg, close: true, c: 'y', wd: 3 },
    { k: 'pt', at: [1, r3], name: '1+√3 i', dir: 'ne', size: 21, c: 'y' }, { k: 'pt', at: [1, -r3], name: '1−√3 i', dir: 'se', size: 21, c: 'y' },
    { k: 'label', at: [1.5, 0.35], text: 'D', c: 'y', size: 26 }
  ].concat(extra || []) });
  // w 平面
  const REG = arcPts(4, 120, -120, 80).concat(parPts(-h3, h3, 40));     // 求める範囲（円の大きい弧＋放物線）
  const KK = arcPts(4, 120, 240, 40).concat(parPts(-h3, h3, 40).reverse());   // 放物線の内側（取りのぞく部分）
  const wfig = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-5, -5, 5.4, 5], w: w || 470, h: Math.round((w || 470) * 10 / 10.4), items: [
    { k: 'axes', tx: [[-2, '−2'], [1, '1'], [4, '4']], ty: [], xl: '実軸', yl: '虚軸' },
    { k: 'circle', o: [0, 0], r: 4, c: 'd', wd: 2 }
  ].concat(extra || []) });
  const PARA = { k: 'param', x: '1-t*t/4', y: 't', a: -4.6, b: 4.6, c: 'b', wd: 2.5 };
  const REGfill = { k: 'poly', pts: REG, close: true, fill: 'y', alpha: 0.3, noStroke: true };
  const REGline = { k: 'poly', pts: REG, close: true, c: 'y', wd: 3 };
  const Ppts = [{ k: 'pt', at: [-2, h3], name: '−2+2√3 i', dir: 'nw', size: 20, c: 'y' }, { k: 'pt', at: [-2, -h3], name: '−2−2√3 i', dir: 'sw', size: 20, c: 'y' }];

  const POINTS = [
    '「$w$ が範囲に入る ⇔ $z^2=w$ をみたす $z$ が条件の中にある」と読みかえ、$w$ の式だけの条件にする',
    '$z=x+yi$ のとき $|z^2|+\\mathrm{Re}(z^2)=2x^2$。不等式を2乗するときは、両辺が 0 以上かどうかで場合を分ける',
    '面積は「円 − 放物線の内側」。$\\int\\sqrt{16-v^2}\\,dv$ は扇形と三角形に分けて図形で求める'
  ];

  HB.lesson({
    id: 'kyo24-2', field: '京大型　数学（理系）', title: '2024 京大 理系 第2問の類題 ― w＝z² が動く範囲と面積', level: '2024年度 京都大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '複素数 $z$ が 2 つの条件 $|z|\\le2$、$z+\\overline{z}\\ge2$ をみたしながら動くとき、$w=z^2$ が複素数平面上で動く範囲を図示し、その面積を求めよ。',
      parts: [],
      src: '※ 2024年度 京都大学 前期 理系 数学 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面で、点が動く範囲とその面積を求める問題です。小問の誘導はありません。まず問題文を読みましょう。（問題文は Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず $z$ の範囲をつかみます。$z=x+yi$（$x,\\ y$ は実数）とおくと、$z+\\overline{z}=2x$ です。',
        add: [{ t: 'h', text: 'z の範囲 D' },
          { t: 'm', tex: 'z=x+yi\\ \\text{とおくと}\\quad z+\\overline{z}=2x' },
          zfig('z1')] },
      { ask: { type: 'choice', q: '条件 $z+\\overline{z}\\ge2$ が表すのは？',
        opts: ['$y\\ge1$', '$x\\ge1$', '$|z|\\ge1$', '$x\\ge2$'], ok: 1,
        why: { 0: '$z+\\overline{z}$ では虚部が打ち消し合います。残るのは実部です。', 2: '$|z|$ は原点からの距離。$z+\\overline{z}$ とは別のものです。', 3: '$2x\\ge2$ の両辺を 2 で割るのを忘れています。' },
        good: '$2x\\ge2$ より $x\\ge1$。$z$ は「円 $|z|\\le2$ のうち、直線 $x=1$ の右側」の弓形 D を動きます。',
        add: [{ t: 'p', size: 'sm', text: 'D：$|z|\\le2$ かつ $x\\ge1$（右の図の弓形）\n角の点は $1\\pm\\sqrt3\\,i$' }] } },
      { ask: { type: 'choice', q: '$w$ の範囲を求める方針として、いちばん確実なのは？',
        opts: ['D の境界の像だけで囲む', '値を入れて点を打つ', '$|w|\\le4$ だけを使う', '$w$ を固定し $z^2=w$ の解を調べる'], ok: 3,
        why: { 0: '境界の像だけでは「内部をすき間なくうめる」ことの説明が足りません。', 1: '形の予想には役立ちますが、答案の根拠になりません。', 2: '$|w|\\le4$ は必要条件にすぎず、$x\\ge1$ が使われていません。' },
        good: '「$w$ が範囲に入る ⇔ $z^2=w$ をみたす $z$ が D にある」と読みかえれば、必要十分条件で求まります。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '$w$ が範囲に入る\n⇔ $z^2=w$ かつ $|z|\\le2$、$x\\ge1$ をみたす $z$ がある' }] } },

      // ---------- 答案：w の条件 ----------
      { clear: true, part: '答案', say: '$w=z^2$ のとき、$|w|$ と $w$ の実部を $x,\\ y$ で表してみます。',
        add: [{ t: 'h', text: '答案：w の条件を求める' },
          { t: 'm', size: 'sm', tex: 'w=z^2=(x^2-y^2)+2xyi,\\qquad |w|=|z|^2=x^2+y^2' }] },
      { ask: { type: 'choice', q: '$|w|+(w\\text{ の実部})$ を $x,\\ y$ で表すと？',
        opts: ['$2y^2$', '$x^2$', '$2x^2$', '$2(x^2+y^2)$'], ok: 2,
        why: { 0: 'それは $|w|-(w$ の実部$)$ です。', 1: '$(x^2+y^2)+(x^2-y^2)$ で、$x^2$ が2つ残ります。', 3: '$w$ の実部は $x^2-y^2$。$y^2$ は打ち消し合います。' },
        good: '$(x^2+y^2)+(x^2-y^2)=2x^2$。$|w|$ と実部から、$x^2$ だけが取り出せます。',
        add: [{ t: 'm', tex: '|w|+\\mathrm{Re}\\,w=2x^2', note: '$z^2=w$ をみたすどの $z$ でも' }] } },
      { say: '$z^2=w$ の解は $\\pm z_0$ の2つで、実部が 0 以上の方をとれば $x=\\sqrt{\\dfrac{|w|+\\mathrm{Re}\\,w}{2}}$。だから「$x\\ge1$ の解がある ⇔ $|w|+\\mathrm{Re}\\,w\\ge2$」です。',
        add: [{ t: 'p', size: 'sm', text: '$|z|\\le2\\iff|w|\\le4$\n$x\\ge1$ をみたす解がある $\\iff |w|+\\mathrm{Re}\\,w\\ge2$' },
          { t: 'box', c: 'y', size: 'sm', label: 'w の条件', text: '$|w|\\le4$　かつ　$|w|+\\mathrm{Re}\\,w\\ge2$' }] },
      { clear: true, cols: [0.56, 0.44], say: '$w=u+vi$ とおきます。$|w|+u\\ge2$ は $\\sqrt{u^2+v^2}\\ge2-u$。右辺の符号で場合を分けてから2乗します。',
        add: [{ t: 'h', text: '答案：u, v の式にする' },
          { t: 'm', tex: '\\sqrt{u^2+v^2}\\ge2-u', note: '$w=u+vi$' },
          wfig('w1', [PARA, { k: 'label', at: [-3.4, 1.3], text: 'u=1−v²/4', c: 'b', size: 20, anchor: 'start' }])] },
      { ask: { type: 'choice', q: '$\\sqrt{u^2+v^2}\\ge2-u$ と同じ条件は？',
        opts: ['$u\\ge1-\\dfrac{v^2}{4}$', '$u\\le1-\\dfrac{v^2}{4}$', '$u\\ge1+\\dfrac{v^2}{4}$', '$u^2+v^2\\ge4$'], ok: 0,
        why: { 1: '不等号の向きが逆です。原点 $w=0$ は条件をみたさないので、放物線の頂点 1 より右側です。', 2: '2乗すると $v^2\\ge4-4u$。$4u\\ge4-v^2$ なので $v^2$ の符号は −。', 3: '$|w|\\ge2$ とは別です。右辺が $2-u$ であることを使っていません。' },
        good: '$u\\ge2$ なら常に成り立つ。$u<2$ なら両辺 0 以上で2乗して $v^2\\ge4-4u$。どちらの場合も $u\\ge1-\\dfrac{v^2}{4}$ と同じです。',
        add: [{ t: 'p', size: 'sm', text: '$u\\ge2$：左辺 $\\ge0\\ge2-u$ で成立（$u\\ge1-\\frac{v^2}{4}$ も成立）\n$u<2$：2乗して $u^2+v^2\\ge(2-u)^2\\iff u\\ge1-\\frac{v^2}{4}$' }] } },
      { say: 'よって範囲は「円 $|w|\\le4$ の内部のうち、放物線 $u=1-\\dfrac{v^2}{4}$ の右側」。この放物線は、頂点 $1$、左に開いた形です。',
        add: [{ t: 'm', tex: 'u^2+v^2\\le16,\\qquad u\\ge1-\\frac{v^2}{4}' }] },
      { ask: { type: 'choice', q: '円 $|w|=4$ と放物線 $u=1-\\dfrac{v^2}{4}$ の交点は？',
        opts: ['$-2\\pm4i$', '$6\\pm2\\sqrt5\\,i$', '$-2\\pm2\\sqrt3\\,i$', '$1\\pm\\sqrt{15}\\,i$'], ok: 2,
        why: { 0: '$u=-2$ のとき $v^2=16-4=12$。$v=\\pm2\\sqrt3$ です。', 1: '$u^2-4u-12=0$ の解 $u=6$ は、$v^2=4-24<0$ となり不適です。', 3: '$u=1$ は放物線の頂点。円との交点ではありません。' },
        good: '$v^2=4-4u$ を円の式に入れて $u^2-4u-12=0$、$u=-2,\\ 6$。$u=6$ は $v^2<0$ で不適。D の角 $1\\pm\\sqrt3\\,i$ の2乗です。',
        add: [{ t: 'ans', label: '答（範囲）', text: '右の図の黄色の部分（境界をふくむ）' }],
        draw: [{ fig: 'w1', items: [REGfill, REGline].concat(Ppts, [{ k: 'label', at: [2.5, 1.6], text: 'w の範囲', c: 'y', size: 22, plain: true }]) }] } },

      // ---------- 面積 ----------
      { clear: true, cols: [0.56, 0.44], part: '面積', say: '面積は「円 16π − 放物線の内側の部分 K」。K は $|v|\\le2\\sqrt3$ の範囲で、左は円、右は放物線にはさまれています。',
        add: [{ t: 'h', text: '面積：円から K を引く' },
          { t: 'm', size: 'sm', tex: 'K=\\int_{-2\\sqrt3}^{2\\sqrt3}\\left\\{\\left(1-\\frac{v^2}{4}\\right)+\\sqrt{16-v^2}\\right\\}dv' },
          wfig('w2', [{ k: 'poly', pts: REG, close: true, fill: 'y', alpha: 0.18, noStroke: true }, { k: 'poly', pts: KK, close: true, fill: 'p', alpha: 0.38, c: 'p', wd: 3 }, PARA,
            { k: 'label', at: [-2.4, 0.5], text: 'K', c: 'p', size: 28 }].concat(Ppts))] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-2\\sqrt3}^{2\\sqrt3}\\left(1-\\frac{v^2}{4}\\right)dv$ の値は？',
        opts: ['$4\\sqrt3$', '$0$', '$8\\sqrt3$', '$-4\\sqrt3$'], ok: 1,
        why: { 0: 'それは $\\int1\\,dv$ だけ。$\\int\\frac{v^2}{4}dv=\\frac{(2\\sqrt3)^3}{6}=4\\sqrt3$ も引きます。', 2: '$\\frac{v^2}{4}$ の積分を足しています。引き算です。', 3: '$\\int1\\,dv=4\\sqrt3$ を忘れています。' },
        good: '$4\\sqrt3-\\left[\\dfrac{v^3}{12}\\right]_{-2\\sqrt3}^{2\\sqrt3}=4\\sqrt3-4\\sqrt3=0$。放物線の右側（$u>0$）と左側（$u<0$）がちょうど打ち消し合います。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_{-2\\sqrt3}^{2\\sqrt3}\\left(1-\\frac{v^2}{4}\\right)dv=4\\sqrt3-4\\sqrt3=0' }] } },
      { clear: true, cols: [0.56, 0.44], say: '残りの $\\displaystyle\\int_{-2\\sqrt3}^{2\\sqrt3}\\sqrt{16-v^2}\\,dv$ は、右の図の面積。中心角 $\\dfrac{2\\pi}{3}$ の扇形と、2つの直角三角形に分けられます。',
        add: [{ t: 'h', text: '面積：円の一部を図形で' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\int_{-2\\sqrt3}^{2\\sqrt3}\\sqrt{16-v^2}\\,dv&=(\\text{扇形})+(\\text{三角形}\\times2)\\\\ &=8\\cdot\\frac{2\\pi}{3}+2\\times2\\sqrt3=\\frac{16}{3}\\pi+4\\sqrt3\\end{aligned}' },
          wfig('w3', [{ k: 'poly', pts: [[0, 0]].concat(arcPts(4, -60, 60, 30)), close: true, fill: 'y', alpha: 0.32, c: 'y', wd: 2.5 },
            { k: 'poly', pts: [[0, 0], [0, h3], [2, h3]], close: true, fill: 'b', alpha: 0.35, c: 'b', wd: 2.5 }, { k: 'poly', pts: [[0, 0], [0, -h3], [2, -h3]], close: true, fill: 'b', alpha: 0.35, c: 'b', wd: 2.5 },
            { k: 'arc', o: [0, 0], rp: 34, a1: -60, a2: 60, c: 'y', label: '2π/3', lr: 30 },
            { k: 'label', at: [2.15, h3 + 0.5], text: '(2, 2√3)', size: 19 }, { k: 'label', at: [-0.55, h3], text: '2√3', size: 19 }])] },
      { say: 'K の面積は $\\dfrac{16}{3}\\pi+4\\sqrt3$。円の面積 $16\\pi$ から引いて、答えです。',
        add: [{ t: 'm', tex: 'K=0+\\frac{16}{3}\\pi+4\\sqrt3' },
          { t: 'm', tex: '16\\pi-K=16\\pi-\\frac{16}{3}\\pi-4\\sqrt3' },
          { t: 'ans', label: '答（面積）', tex: '\\frac{32}{3}\\pi-4\\sqrt3' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '条件 $|w|\\ge2-u$ は「原点からの距離 ≧ 直線 $u=2$ までの距離」。つまり境界は、焦点が原点、準線が $u=2$ の放物線です。',
        add: [{ t: 'h', text: '別の見方：焦点と準線' },
          { t: 'p', size: 'sm', text: '$|w|$ ＝ 原点 O までの距離\n$2-u$ ＝ 直線 $u=2$ までの距離（$u\\le2$ のとき）\n→ 境界は 焦点 O・準線 $u=2$ の放物線' },
          wfig('w4', [REGfill, PARA, { k: 'line', x: 2, dash: true, c: 'g' }, { k: 'label', at: [2.15, -4.4], text: 'u=2（準線）', c: 'g', size: 19, anchor: 'start' },
            { k: 'pt', at: [0, 0], c: 'p', r: 5 }, { k: 'label', at: [0.3, -0.45], text: '焦点', c: 'p', size: 19, plain: true, anchor: 'start' }])] },
      { ask: { type: 'think', q: '直線 $x=1$ 上の点 $z=1+yi$ の像 $w=z^2$ が、放物線 $u=1-\\dfrac{v^2}{4}$ 上にあることを確かめよう。',
        hint: '$(1+yi)^2$ を展開して、$u,\\ v$ を $y$ で表す。',
        ans: '$w=(1-y^2)+2yi$ より $u=1-y^2,\\ v=2y$。$y=\\dfrac v2$ を入れて $u=1-\\dfrac{v^2}{4}$',
        after: 'D の境界のうち、線分は放物線の一部へ、弧（$|z|=2$、偏角 $-\\frac{\\pi}{3}$〜$\\frac{\\pi}{3}$）は弧（$|w|=4$、偏角 $-\\frac{2\\pi}{3}$〜$\\frac{2\\pi}{3}$）へうつります。' } },
      { ask: { type: 'think', q: '条件 $z+\\overline{z}\\ge2$ を $z+\\overline{z}\\ge0$ に変えると、$w=z^2$ の動く範囲の面積はいくつ？',
        hint: '$z$ は右半分の半円板。2乗すると、偏角は2倍、絶対値は2乗になる。',
        ans: '範囲は円板 $|w|\\le4$ 全体で、面積は $16\\pi$',
        after: '偏角 $-\\frac{\\pi}{2}$〜$\\frac{\\pi}{2}$ が $-\\pi$〜$\\pi$ に広がり、円全体をうめます。本問の範囲は、そこから $0\\le x<1$ の部分の像 K を除いたものです。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「動く点の範囲」は、存在の条件に読みかえるのが京大の定番の考え方です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
