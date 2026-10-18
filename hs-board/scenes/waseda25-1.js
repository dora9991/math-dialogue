/* 2025 早稲田 理工 第1問の類題（自作）：|z|=2 を動く z から作る w=2z−2/z の楕円と、焦点を中心とする円の共通部分の面積
   問題：|z|=2、w=2z−2/z の描く図形 E、C：|w−4i|=3（中心 4i・半径 3 の円）。
   答え（python3・sympy で検算ずみ）：
   (1) z=2(cosθ+i sinθ)、2/z=cosθ−i sinθ → w=3cosθ+5i sinθ。E：x²/9+y²/25=1（θ が一周するので楕円の全体）
   (2) x²=9−9y²/25 を C に代入 → 2y²−25y+50=0 → y=5/2（y=10 は x²=−27 で不適）。w=±3√3/2+(5/2)i
   (3) 弦 y=5/2 の下は C の弓形：扇形(120°)−三角形＝3π−9√3/4
       上は E の弓形：∫(5/3·√(9−x²)−5/2)dx（−3√3/2〜3√3/2）、∫√(9−x²)dx＝3π+9√3/4 → 5π−15√3/4
       合計 8π−6√3（≈14.740。モンテカルロ法でも 14.74）
   別の見方：4i は E の焦点（√(25−9)=4）。共有点ともう1つの焦点 −4i の距離は 10−3=7（座標でも √49=7）
             E は円 X²+y²=25 を横に 3/5 倍した形 → 半径 5 の弓形 25π/3−25√3/4 の 3/5 倍＝5π−15√3/4 */
(function () {
  const r3 = Math.sqrt(3), cx = 3 * r3 / 2, D2R = Math.PI / 180;
  const VIEW = [-4.6, -6, 4.6, 7.8];
  const fig = (id, items, h) => { h = h || 520; return { t: 'fig', id, col: 1, view: VIEW, w: Math.round(h * 9.2 / 13.8), h, items: items.concat(ticks) }; };   // 縦横比は VIEW にそろえる
    const ax = { k: 'axes', tx: [], ty: [], xl: '実軸', yl: '虚軸' };
  const ticks = [{ k: 'label', at: [3, 0], text: '3', dx: 14, dy: 18, size: 21, c: 'd' }, { k: 'label', at: [-3, 0], text: '-3', dx: -20, dy: 18, size: 21, c: 'd' },
    { k: 'label', at: [0, 5], text: '5i', dx: -22, dy: -16, size: 21, c: 'd' }, { k: 'label', at: [0, -5], text: '-5i', dx: -26, dy: 16, size: 21, c: 'd' }];
  const Eq = { k: 'param', x: '3*cos(t)', y: '5*sin(t)', a: 0, b: 2 * Math.PI, c: 'y', wd: 3.5, label: 'E', lat: [2.9, 3.4] };
  const Cc = { k: 'circle', o: [0, 4], r: 3, c: 'b', wd: 3, label: 'C', lat: [2.75, 6.75] };
  const F = { k: 'pt', at: [0, 4], name: '4i', dir: 'w', c: 'b', r: 5, size: 22 };
  const P1 = { k: 'pt', at: [cx, 2.5], name: 'P', dir: 'e', c: 'p' }, P2 = { k: 'pt', at: [-cx, 2.5], name: 'Q', dir: 'w', c: 'p' };
  const arcPts = (o, rx, ry, a1, a2, n) => Array.from({ length: n + 1 }, (_, i) => { const t = (a1 + (a2 - a1) * i / n) * D2R; return [o[0] + rx * Math.cos(t), o[1] + ry * Math.sin(t)]; });
  const capPts = arcPts([0, 0], 3, 5, 30, 150, 40), segPts = arcPts([0, 4], 3, 3, 210, 330, 40);
  const S2fill = { k: 'poly', pts: capPts, close: true, fill: 'y', alpha: 0.35, noStroke: true };
  const S1fill = { k: 'poly', pts: segPts, close: true, fill: 'b', alpha: 0.35, noStroke: true };
  const chord = { k: 'seg', a: [-cx, 2.5], b: [cx, 2.5], c: 'p', wd: 2.5, dash: true };
  // 半径 3 の円で ∫√(9−x²)dx を見る図
  const semi = (id, items) => ({ t: 'fig', id, col: 1, view: [-3.8, -0.9, 3.8, 3.8], w: 520, h: 322, items: [
    { k: 'axes', tx: [[-3, '-3'], [3, '3'], [-cx, '-3√3/2'], [cx, '3√3/2']], ty: [], o: true },
    { k: 'fn', f: 'sqrt(9-x*x)', a: -3, b: 3, c: 'w', wd: 2.5, label: 'y=√(9−x²)', lat: [1.9, 3.35] }].concat(items || []) });
  const POINTS = [
    '$|z|=r$ なら $z=r(\\cos\\theta+i\\sin\\theta)$。$\\dfrac1z$ は **絶対値が逆数・偏角が $-\\theta$**。実部・虚部を出して $\\theta$ を消去する',
    '曲線どうしの共有点は、文字を消去したあと **範囲の確認**（$x^2\\ge0$、$|y|\\le5$）で、うその解をすてる',
    '共通部分の面積は、共有点を結ぶ **弦で分ける**。円の側は「扇形 ± 三角形」、楕円の側は $\\int\\sqrt{a^2-x^2}\\,dx$ を **円の面積** に直す'
  ];

  HB.lesson({
    id: 'waseda25-1', field: '早稲田型　数学（理工）', title: '2025 早稲田 理工 第1問の類題 ― 複素数がえがく楕円と円の共通部分の面積', level: '2025年度 早稲田大学 理工 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '複素数平面上で、複素数 $z$ が $|z|=2$ を満たしながら動くとき、$w=2z-\\dfrac{2}{z}$ で表される点 $w$ が描く図形を $E$ とする。また、$4i$ を表す点を中心とする半径 3 の円を $C$ とする。',
      parts: [
        '(1)　$w=x+yi$（$x,\\ y$ は実数）とするとき、$E$ は楕円であることを示し、その方程式を $x,\\ y$ で表せ。また、$E$ を図示せよ。',
        '(2)　$E$ と $C$ の共有点を表す複素数をすべて求めよ。',
        '(3)　$E$ の内部と $C$ の内部の共通部分の面積を求めよ。'
      ],
      src: '※ 2025年度 早稲田大学 一般選抜 理工 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数の式で決まる点が楕円をえがき、その楕円と円の共通部分の面積を求めます。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },
      { clear: true, part: '読みかえ', say: '$|z|=2$ を動く $z$ は、極形式で $z=2(\\cos\\theta+i\\sin\\theta)$ と書けます。$w$ を $\\theta$ で表せば、$x,\\ y$ の関係が見えてきます。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '$z$ を極形式で表し、$w=x+yi$ の $x,\\ y$ を $\\theta$ で表す\n→ $\\theta$ を消去すれば $E$ の方程式' },
          { t: 'm', tex: 'z=2(\\cos\\theta+i\\sin\\theta)\\quad(0\\le\\theta<2\\pi)' }] },
      { ask: { type: 'choice', q: '$z=2(\\cos\\theta+i\\sin\\theta)$ のとき、$\\dfrac{1}{z}$ はどれ？',
        opts: ['$2(\\cos\\theta-i\\sin\\theta)$', '$\\dfrac12(\\cos\\theta+i\\sin\\theta)$', '$\\dfrac12(\\cos\\theta-i\\sin\\theta)$', '$-\\dfrac12(\\cos\\theta+i\\sin\\theta)$'], ok: 2,
        why: { 0: '絶対値は逆数になります。$\\left|\\frac1z\\right|=\\frac12$ です。', 1: '偏角は $-\\theta$ になります（ド・モアブルの定理）。', 3: '$-1$ 倍ではなく、偏角の符号が変わります。' },
        good: '絶対値は $\\frac12$、偏角は $-\\theta$。$\\frac1z=\\frac{\\bar z}{|z|^2}=\\frac{\\bar z}{4}$ と見ても同じです。',
        add: [{ t: 'm', tex: '\\frac{2}{z}=\\cos\\theta-i\\sin\\theta' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: 'よって $w=2z-\\dfrac2z$ を実部と虚部に分けます。$\\cos\\theta$ の項は $4-1=3$、$\\sin\\theta$ の項は $4+1=5$ になります。',
        add: [{ t: 'h', text: '(1)　E の方程式と図示' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}w&=(4\\cos\\theta+4i\\sin\\theta)-(\\cos\\theta-i\\sin\\theta)\\\\ &=3\\cos\\theta+5i\\sin\\theta\\end{aligned}' },
          { t: 'm', tex: 'x=3\\cos\\theta,\\qquad y=5\\sin\\theta' },
          fig('f1', [ax])] },
      { ask: { type: 'choice', q: '$x=3\\cos\\theta,\\ y=5\\sin\\theta$ から $\\theta$ を消去すると？',
        opts: ['$\\dfrac{x^2}{25}+\\dfrac{y^2}{9}=1$', '$x^2+y^2=34$', '$\\dfrac{x^2}{3}+\\dfrac{y^2}{5}=1$', '$\\dfrac{x^2}{9}+\\dfrac{y^2}{25}=1$'], ok: 3,
        why: { 0: '分母が逆です。$x=3\\cos\\theta$ なので、$x^2$ の分母が 9 になります。', 1: '$9\\cos^2\\theta+25\\sin^2\\theta$ は一定になりません。', 2: '$\\left(\\frac x3\\right)^2$ なので、分母は2乗した 9 と 25 です。' },
        good: '$\\left(\\frac x3\\right)^2+\\left(\\frac y5\\right)^2=\\cos^2\\theta+\\sin^2\\theta=1$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\Big(\\frac x3\\Big)^2+\\Big(\\frac y5\\Big)^2=\\cos^2\\theta+\\sin^2\\theta=1' }],
        draw: [{ fig: 'f1', items: [Eq] }] } },
      { say: '答案では「$\\theta$ が $0\\le\\theta<2\\pi$ を動くと、点 $(\\cos\\theta,\\ \\sin\\theta)$ は単位円を一周する」ので、$E$ は **楕円の全体** だと書きます。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'E:\\ \\frac{x^2}{9}+\\frac{y^2}{25}=1' },
          { t: 'p', size: 'sm', text: '長軸は虚軸の上（長さ 10）、短軸は実軸の上（長さ 6）' }],
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: [3, 0], c: 'y', r: 5 }, { k: 'pt', at: [-3, 0], c: 'y', r: 5 }, { k: 'pt', at: [0, 5], c: 'y', r: 5 }, { k: 'pt', at: [0, -5], c: 'y', r: 5 }] }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '$C$ は $|w-4i|=3$。$w=x+yi$ を入れると $x^2+(y-4)^2=9$ です。$E$ の式から $x^2$ を出して代入し、$y$ だけの方程式にします。',
        add: [{ t: 'h', text: '(2)　E と C の共有点' },
          { t: 'm', tex: 'C:\\ x^2+(y-4)^2=9' },
          { t: 'm', tex: 'x^2=9-\\frac{9}{25}y^2', note: '← $E$ の式から' },
          fig('f2', [ax, Eq, Cc, F], 500)] },
      { say: '代入して整理すると $\\frac{16}{25}y^2-8y+16=0$。両辺に $\\frac{25}{8}$ をかけると $2y^2-25y+50=0$ で、因数分解できます。',
        add: [{ t: 'm', size: 'sm', tex: '9-\\frac{9}{25}y^2+y^2-8y+16=9' },
          { t: 'm', tex: '2y^2-25y+50=0\\quad\\therefore\\ (2y-5)(y-10)=0' }] },
      { ask: { type: 'choice', q: '$y=\\dfrac52,\\ 10$ のうち、共有点の $y$ 座標として正しいのは？',
        opts: ['$y=\\dfrac52$ だけ', '$y=10$ だけ', '両方', 'どちらも不適'], ok: 0,
        why: { 1: '$E$ 上の点は $-5\\le y\\le5$。$y=10$ の点は $E$ 上にありません。', 2: '$y=10$ のとき $x^2=9-36=-27<0$ で、実数 $x$ がありません。', 3: '$y=\\frac52$ なら $x^2=\\frac{27}{4}>0$ で、ちゃんと点があります。' },
        good: '$x^2$ を消去したときは、$x^2\\ge0$（ここでは $|y|\\le5$）を必ず確かめます。',
        add: [{ t: 'm', tex: 'y=\\frac52\\ \\text{のとき}\\ \\ x^2=9-\\frac94=\\frac{27}{4}' }],
        draw: [{ fig: 'f2', items: [P1, P2] }] } },
      { say: 'よって共有点は2つ。問題は「複素数で答えよ」なので、$x+yi$ の形で書きます。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'w=\\pm\\frac{3\\sqrt3}{2}+\\frac52 i' }] },
      { ask: { type: 'think', q: '$\\sqrt{25-9}=4$ なので、$4i$ と $-4i$ は $E$ の焦点です。共有点 P と、もう1つの焦点 $-4i$ との距離は？',
        hint: '楕円上の点から2つの焦点までの距離の和は、長軸の長さ 10。P は $C$ 上なので、$4i$ までの距離は 3。',
        ans: '$10-3=7$',
        after: '座標でも $\\sqrt{\\frac{27}{4}+\\frac{169}{4}}=\\sqrt{49}=7$。$C$ は「焦点を中心とする円」でした。' } },

      // ---------- (3) ----------
      { clear: true, cols: [0.54, 0.46], part: '(3)', say: '共通部分は、2つの共有点を結ぶ弦 $y=\\frac52$ で上下に分けられます。上と下で、境界になる曲線がちがいます。',
        add: [{ t: 'h', text: '(3)　共通部分の面積' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '共有点 P, Q を結ぶ弦で分けて、\n上の部分と下の部分を別々に求める' },
          fig('f3', [ax, Eq, Cc, F, chord, P1, P2], 520)] },
      { ask: { type: 'choice', q: '弦 $y=\\dfrac52$ より **上** の部分の境界になっているのは？',
        opts: ['円 $C$ の弧', '楕円 $E$ の弧', '左は $E$、右は $C$', '虚軸'], ok: 1,
        why: { 0: '$C$ の上のはしは $7i$ で、$E$ の外です。上では $E$ のほうが内側です。', 2: '図は虚軸について対称です。左右で入れかわることはありません。', 3: '虚軸は対称の軸で、境界ではありません。' },
        good: '上は $E$ の弧、下は $C$ の弧。$E$ の頂点 $5i$ は、$4i$ から距離 1 なので $C$ の内部です。',
        add: [{ t: 'p', size: 'sm', text: '上：[[y:$E$ の弓形 $S_2$]]　　下：[[b:$C$ の弓形 $S_1$]]' }],
        draw: [{ fig: 'f3', items: [S2fill, S1fill, { k: 'label', at: [0.75, 4.35], text: 'S₂', c: 'y', size: 24 }, { k: 'label', at: [0, 1.8], text: 'S₁', c: 'b', size: 24 }] }] } },
      { ask: { type: 'choice', q: '$C$ の弓形 $S_1$ の中心角（中心 $4i$ と P, Q がつくる角）は？',
        opts: ['$60^\\circ$', '$90^\\circ$', '$240^\\circ$', '$120^\\circ$'], ok: 3,
        why: { 0: '半分の角が $60^\\circ$（$\\cos=\\frac{3/2}{3}=\\frac12$）。中心角はその2倍です。', 1: '弦までの距離 $\\frac32$ は半径 3 のちょうど半分。$90^\\circ$ にはなりません。', 2: '$240^\\circ$ は弦の上側（大きいほう）の扇形の角です。' },
        good: '中心 $4i$ から弦までの距離は $4-\\frac52=\\frac32$。半分の角が $60^\\circ$ なので、中心角は $120^\\circ$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S_1&=\\frac12\\cdot3^2\\cdot\\frac{2\\pi}{3}-\\frac12\\cdot3\\sqrt3\\cdot\\frac32\\\\ &=3\\pi-\\frac{9\\sqrt3}{4}\\end{aligned}', note: '扇形 − 三角形' }],
        draw: [{ fig: 'f3', items: [{ k: 'seg', a: [0, 4], b: [cx, 2.5], c: 'b', wd: 2 }, { k: 'seg', a: [0, 4], b: [-cx, 2.5], c: 'b', wd: 2 }] }] } },

      // ---------- (3) つづき：E の弓形 ----------
      { clear: true, cols: [0.54, 0.46], say: '$E$ の弓形 $S_2$ は定積分で求めます。$E$ の上半分は $y=5\\sqrt{1-\\frac{x^2}{9}}=\\frac53\\sqrt{9-x^2}$ と書けます。',
        add: [{ t: 'h', text: '(3)　つづき：E の弓形 S₂' },
          { t: 'm', size: 'sm', tex: 'S_2=\\int_{-\\frac{3\\sqrt3}{2}}^{\\frac{3\\sqrt3}{2}}\\Big(\\frac53\\sqrt{9-x^2}-\\frac52\\Big)dx' },
          { t: 'm', size: 'sm', tex: '=\\frac53\\int_{-\\frac{3\\sqrt3}{2}}^{\\frac{3\\sqrt3}{2}}\\sqrt{9-x^2}\\,dx-\\frac52\\cdot3\\sqrt3' },
          semi('f4', [{ k: 'line', x: cx, dash: true, c: 'd' }, { k: 'line', x: -cx, dash: true, c: 'd' }])] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{-\\frac{3\\sqrt3}{2}}^{\\frac{3\\sqrt3}{2}}\\sqrt{9-x^2}\\,dx$ の値は？（右の図の、半円の一部の面積）',
        opts: ['$3\\pi+\\dfrac{9\\sqrt3}{4}$', '$3\\pi$', '$3\\pi-\\dfrac{9\\sqrt3}{4}$', '$\\dfrac{9\\pi}{2}$'], ok: 0,
        why: { 1: 'それは扇形だけ。左右の直角三角形2つ分を足し忘れています。', 2: '三角形は「引く」のではなく「足す」形です（図を見よう）。', 3: 'それは半円全体（$-3\\le x\\le3$）の面積です。' },
        good: '扇形（中心角 $120^\\circ$）$3\\pi$ ＋ 直角三角形2つ $2\\cdot\\frac12\\cdot\\frac{3\\sqrt3}{2}\\cdot\\frac32=\\frac{9\\sqrt3}{4}$。',
        draw: [{ fig: 'f4', items: [
          { k: 'poly', pts: [[0, 0]].concat(arcPts([0, 0], 3, 3, 30, 150, 30)), close: true, fill: 'y', alpha: 0.35, noStroke: true },
          { k: 'poly', pts: [[0, 0], [cx, 0], [cx, 1.5]], close: true, fill: 'g', alpha: 0.4, c: 'g', wd: 2 },
          { k: 'poly', pts: [[0, 0], [-cx, 0], [-cx, 1.5]], close: true, fill: 'g', alpha: 0.4, c: 'g', wd: 2 },
          { k: 'label', at: [0, 1.9], text: '扇形 3π', c: 'y', size: 22 }] }] } },
      { say: 'よって $S_2=\\frac53\\left(3\\pi+\\frac{9\\sqrt3}{4}\\right)-\\frac{15\\sqrt3}{2}=5\\pi-\\frac{15\\sqrt3}{4}$。(3) の答えは $S_1+S_2$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'S_2=5\\pi+\\frac{15\\sqrt3}{4}-\\frac{15\\sqrt3}{2}=5\\pi-\\frac{15\\sqrt3}{4}' },
          { t: 'ans', label: '(3) 答', tex: 'S_1+S_2=8\\pi-6\\sqrt3' }] },
      { ask: { type: 'think', q: '別の見方：$E$ は円 $X^2+y^2=25$ を横に $\\frac35$ 倍した形です。半径 5 の円の、弦 $y=\\frac52$ より上の弓形から $S_2$ を求めよう。',
        hint: '半径 5、中心から弦までの距離 $\\frac52$ → 中心角 $120^\\circ$。弓形 $=\\frac12\\cdot25\\left(\\frac{2\\pi}{3}-\\sin120^\\circ\\right)$。',
        ans: '$\\left(\\dfrac{25\\pi}{3}-\\dfrac{25\\sqrt3}{4}\\right)\\times\\dfrac35=5\\pi-\\dfrac{15\\sqrt3}{4}$',
        after: '横に $\\frac35$ 倍すると、面積も $\\frac35$ 倍。「楕円の面積を円の面積に帰着する」考え方を、図形の変換で見た形です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数の式 → 媒介変数 → 曲線の方程式、そして面積は「円に帰着」が、この問題の流れでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
