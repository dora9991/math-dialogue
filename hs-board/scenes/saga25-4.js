/* 2025 佐賀大 理系 第4問の類題（自作）：数学C 複素数平面 ― 共役をふくむ方程式の円、内接する正三角形、鋭角三角形になる実部の範囲
   元の問題はうつしていない（「共役複素数をふくむ方程式 → 原点を通る円」「原点と円周上の点で正多角形」「3点が特別な三角形になる
   点の実部の範囲」というねらいと形式だけを合わせた自作問題。正方形ではなく正三角形、鈍角ではなく鋭角、3点は O・α・z）。
   答え（python3・sympy と数値で検算ずみ）：
   (1) zz̄−(√3+i)z̄−(√3−i)z=0 ⇔ |z−(√3+i)|²=4：中心 √3+i、半径 2 の円（O を通る）
   (2) 外接円の中心が c=√3+i。O を c のまわりに ±120° 回転：c(1−w)=2√3、c(1−w̄)=√3+3i（w=cos120°+i sin120°）
       Im α < Im β より α=2√3、β=√3+3i（|α|=|β|=|α−β|=2√3）
   (3) z=x+yi。∠OzA：弦 OA の中心角 120° → 上側(y>0)で 60°、下側で 120°。∠zOA<90° ⇔ x>0、∠OAz<90° ⇔ x<2√3
       → 0<x<2√3（数値：円周 20 万点で鋭角になる点の実部は (0, 2√3)、弧 2i〜2√3+2i の 120° ぶん） */
(function () {
  const r3 = Math.sqrt(3), c = [r3, 1], A = [2 * r3, 0], B = [r3, 3];
  const POINTS = [
    '$z\\bar z-\\bar c z-c\\bar z=0$ は $(z-c)(\\bar z-\\bar c)=|c|^2$、つまり $|z-c|=|c|$：**中心 $c$ で原点を通る円**',
    '円に内接する正三角形は、中心のまわりに $120^\\circ$ ずつ。点 $p$ のまわりの回転は $p+(z-p)(\\cos\\theta+i\\sin\\theta)$',
    '鋭角三角形 ⇔ **3つの角がすべて $90^\\circ$ 未満**。円周上の角は円周角の定理、端の角は「どちら側か」で実部の条件に'
  ];
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-1.3, -1.6, 4.9, 3.9], w: Math.round((h || 440) * 6.2 / 5.5), h: h || 440, items: [
    { k: 'axes', tx: id === 'c1' ? [[2 * r3, '2√3']] : [], ty: [[2, '2']], xl: '実軸', yl: '虚軸' },   // α のある図では、目もりの 2√3 と α の名前が重ならないように目もりを省く
    { k: 'circle', o: c, r: 2, c: 'b', wd: 3 }, { k: 'pt', at: c, c: 'b', r: 5 }].concat(items || []) });
  const cName = { k: 'label', at: c, text: '√3+i', dx: 34, dy: 14, c: 'b', size: 20 };

  HB.lesson({
    id: 'saga25-4', field: '佐賀大型　数学（理系）', title: '2025 佐賀大 理系 第4問の類題 ― 原点を通る円と正三角形・鋭角三角形', level: '2025年度 佐賀大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '複素数平面上で、方程式 $z\\bar z=(\\sqrt3+i)\\bar z+(\\sqrt3-i)z$ をみたす点 $z$ 全体が表す図形を $C$ とする。O は原点とする。',
      parts: [
        '(1)　$C$ はどのような図形か。',
        '(2)　3点 O, $\\alpha$, $\\beta$ が正三角形の頂点となるような $C$ 上の2点 $\\alpha,\\ \\beta$ を求めよ。ただし、$\\alpha$ の虚部は $\\beta$ の虚部より小さいとする。',
        '(3)　$C$ 上の点 $z$ が、3点 O, $\\alpha$, $z$ が鋭角三角形の頂点となるように動くとき、$z$ の実部のとりうる値の範囲を求めよ。'
      ],
      src: '※ 2025年度 佐賀大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面の問題です。(1) で図形を見きわめ、(2)(3) はその図の上で考えます。図をかきながら進めるのがコツです。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$z\\bar z$ と、$z$・$\\bar z$ の1次の項がある形は、$(z-c)(\\bar z-\\bar c)$ を展開した形と見くらべます。',
        add: [{ t: 'h', text: '(1)　C はどんな図形か' },
          { t: 'm', size: 'sm', tex: 'z\\bar z-(\\sqrt3+i)\\bar z-(\\sqrt3-i)z=0' },
          { t: 'box', c: 'b', size: 'sm', label: '展開の形', text: '$(z-c)(\\bar z-\\bar c)=z\\bar z-\\bar c\\,z-c\\,\\bar z+|c|^2$\n$\\bar z$ にかかるのが $c$、$z$ にかかるのが $\\bar c$' }] },
      { ask: { type: 'choice', q: '方程式を $|z-c|=r$ の形にすると？',
        opts: ['$|z-(\\sqrt3-i)|=2$', '$|z-(\\sqrt3+i)|=4$', '$|z+(\\sqrt3+i)|=2$', '$|z-(\\sqrt3+i)|=2$'], ok: 3,
        why: { 0: '$\\bar z$ にかかる係数が $c$ です。ここでは $c=\\sqrt3+i$。', 1: '両辺に $|c|^2=4$ を足して $|z-c|^2=4$。半径は 2 です。', 2: '$(z-c)$ の形なので、中心は $+(\\sqrt3+i)$ の点です。' },
        good: '両辺に $(\\sqrt3+i)(\\sqrt3-i)=4$ を足すと $(z-(\\sqrt3+i))(\\bar z-(\\sqrt3-i))=4$、つまり $|z-(\\sqrt3+i)|^2=4$。',
        add: [{ t: 'm', size: 'sm', tex: '(z-(\\sqrt3+i))\\overline{(z-(\\sqrt3+i))}=4' },
          { t: 'm', size: 'sm', tex: '|z-(\\sqrt3+i)|=2' }] } },
      { say: '中心 $\\sqrt3+i$ と原点の距離は $|\\sqrt3+i|=2$ で、半径と同じ。だから $C$ は **原点を通る円** です。実軸と $2\\sqrt3$、虚軸と $2i$ でも交わります。',
        add: [{ t: 'ans', label: '(1) 答', text: '点 $\\sqrt3+i$ を中心とする半径 2 の円' },
          { t: 'p', size: 'sm', text: '確かめ：$z=x+yi$ とおくと\n$x^2+y^2=2\\sqrt3\\,x+2y$　→　$(x-\\sqrt3)^2+(y-1)^2=4$' },
          fig('c1', [cName, { k: 'pt', at: [0, 2], c: 'w', r: 5 }, { k: 'pt', at: A, c: 'w', r: 5 }])] },

      { ask: { type: 'think', q: '$C$ 上の点 $z$ で、$|z|$ が最大になるのはどんな点？ 最大値は？',
        hint: '$|z|$ は原点からの距離。原点は $C$ 上にある。',
        ans: '原点の反対側の点（直径の両はし）$z=2(\\sqrt3+i)=2\\sqrt3+2i$ で、最大値 4（直径）',
        after: 'この点 $2\\sqrt3+2i$ は (3) でもう一度出てきます。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。O, $\\alpha$, $\\beta$ はどれも $C$ 上なので、$C$ は正三角形の **外接円**。中心 $c=\\sqrt3+i$ が正三角形の外心（＝重心）です。',
        add: [{ t: 'h', text: '(2)　内接する正三角形' },
          { t: 'p', size: 'sm', text: '$C$ は正三角形 O$\\alpha\\beta$ の外接円\n→ 中心 $c=\\sqrt3+i$ は外心' },
          fig('c2', [cName, { k: 'poly', pts: [[0, 0], A, B], close: true, c: 'y', wd: 3, fill: 'y', alpha: 0.12 },
            { k: 'seg', a: c, b: [0, 0], c: 'g', wd: 2, dash: true }, { k: 'seg', a: c, b: A, c: 'g', wd: 2, dash: true }, { k: 'seg', a: c, b: B, c: 'g', wd: 2, dash: true }])] },
      { ask: { type: 'choice', q: '中心 $c$ から見て、3つの頂点 O, $\\alpha$, $\\beta$ は何度ずつ離れている？',
        opts: ['$60^\\circ$', '$90^\\circ$', '$120^\\circ$', '$180^\\circ$'], ok: 2,
        why: { 0: '$60^\\circ$ は正三角形の頂点の角（円周角）。中心角はその2倍です。', 1: '$90^\\circ$ ずつなら、4つの頂点（正方形）になります。', 3: '$180^\\circ$ だと2点しかとれません。' },
        good: '中心角は円周角の2倍で $120^\\circ$。$360^\\circ$ を3等分しています。',
        add: [{ t: 'p', size: 'sm', text: '$\\alpha,\\ \\beta$ は、O を点 $c$ のまわりに $\\pm120^\\circ$ 回転した点' }],
        draw: [{ fig: 'c2', items: [{ k: 'label', at: [r3, 0.3], text: '120°', c: 'g', size: 20 }] }] } },
      { say: '$w=\\cos120^\\circ+i\\sin120^\\circ=-\\frac12+\\frac{\\sqrt3}2i$ とおくと、回転した点は $c+(0-c)w=c(1-w)$。計算すると実数 $2\\sqrt3$ になります。',
        add: [{ t: 'm', size: 'sm', tex: 'c(1-w)=(\\sqrt3+i)\\Big(\\frac32-\\frac{\\sqrt3}{2}i\\Big)=2\\sqrt3' },
          { t: 'p', size: 'sm', text: '逆回り（$\\bar w$）は　$c(1-\\bar w)=(\\sqrt3+i)\\Big(\\dfrac32+\\dfrac{\\sqrt3}{2}i\\Big)$' }] },
      { ask: { type: 'choice', q: '$c(1-\\bar w)=(\\sqrt3+i)\\Big(\\dfrac32+\\dfrac{\\sqrt3}{2}i\\Big)$ は？',
        opts: ['$2\\sqrt3+3i$', '$\\sqrt3-3i$', '$2i$', '$\\sqrt3+3i$'], ok: 3,
        why: { 0: '$i\\cdot\\frac{\\sqrt3}2i=-\\frac{\\sqrt3}2$。$i^2=-1$ を忘れています。', 1: 'それは $\\alpha$ を O のまわりに $-60^\\circ$ 回した点で、$C$ 上にはありません。', 2: '$2i$ は $\\alpha$ と直径の反対側の点。O, $\\alpha$, $2i$ は直角三角形です。' },
        good: '$\\frac{3\\sqrt3}2-\\frac{\\sqrt3}2+\\left(\\frac32+\\frac32\\right)i=\\sqrt3+3i$。$\\alpha=2\\sqrt3$ を O のまわりに $60^\\circ$ 回しても同じ点です。',
        add: [{ t: 'm', size: 'sm', tex: '=\\sqrt3+3i' }],
        draw: [{ fig: 'c2', items: [{ k: 'pt', at: A, name: 'α (2√3)', dir: 'se', c: 'y', size: 22 }, { k: 'pt', at: B, name: 'β', dir: 'n', c: 'y' }] }] } },
      { say: '虚部が小さいほうが $\\alpha$ です。3辺の長さがすべて $2\\sqrt3$ になることも確かめておきます。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\alpha=2\\sqrt3,\\qquad \\beta=\\sqrt3+3i' },
          { t: 'p', size: 'sm', text: '$|\\alpha|=|\\beta|=|\\alpha-\\beta|=2\\sqrt3$ ✓' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$z=x+yi$ とおきます。鋭角三角形とは、**3つの角がすべて $90^\\circ$ 未満**。1つずつ条件にします。',
        add: [{ t: 'h', text: '(3)　鋭角三角形になる z' },
          { t: 'box', c: 'b', size: 'sm', label: '鋭角三角形', text: '$\\angle\\mathrm{O}z\\alpha,\\ \\angle z\\mathrm{O}\\alpha,\\ \\angle\\mathrm{O}\\alpha z$\nが **すべて** $90^\\circ$ 未満' },
          fig('c3', [cName, { k: 'pt', at: A, name: 'α (2√3)', dir: 'se', c: 'y', size: 22 },
            { k: 'poly', pts: [[0, 0], A, [1.3848, 2.9696]], close: true, c: 'y', wd: 2.5 }, { k: 'pt', at: [1.3848, 2.9696], name: 'z', dir: 'n', c: 'p' }])] },
      { ask: { type: 'choice', q: '弦 O$\\alpha$ の中心角は $120^\\circ$。$z$ が実軸より **上** の弧にあるとき、$\\angle\\mathrm{O}z\\alpha$ は？',
        opts: ['$120^\\circ$', '$60^\\circ$', '$90^\\circ$', '$z$ によって変わる'], ok: 1,
        why: { 0: '$120^\\circ$ は中心角。円周角はその半分です（下の弧なら $180^\\circ-60^\\circ=120^\\circ$）。', 2: '$90^\\circ$ になるのは、O$\\alpha$ が直径のときです。', 3: '同じ弧の上なら、円周角はどこでも同じです（円周角の定理）。' },
        good: '円周角は中心角の半分で $60^\\circ$。下の弧では $180^\\circ-60^\\circ=120^\\circ$ で鈍角になります。',
        add: [{ t: 'p', size: 'sm', text: '$\\angle\\mathrm{O}z\\alpha<90^\\circ$ ⇔ $z$ が上の弧 ⇔ $y>0$' }] } },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{O}\\alpha z<90^\\circ$ となる条件は？（$\\alpha=2\\sqrt3$ から見て、O は左にある）',
        opts: ['$x<2\\sqrt3$', '$x>2\\sqrt3$', '$x<\\sqrt3$', '$y<2$'], ok: 0,
        why: { 1: '$x>2\\sqrt3$ だと、$z$ は $\\alpha$ より右で、$\\angle\\mathrm{O}\\alpha z$ は鈍角になります。', 2: '$\\sqrt3$ は中心の実部。角の条件とは関係ありません。', 3: '$\\alpha$ での角は、$z$ が $\\alpha$ の左か右かで決まります。' },
        good: '$\\alpha$ から O へのベクトル $(-2\\sqrt3,\\ 0)$ と $(x-2\\sqrt3,\\ y)$ の内積 $-2\\sqrt3(x-2\\sqrt3)>0$ より $x<2\\sqrt3$。',
        add: [{ t: 'p', size: 'sm', text: '$\\angle z\\mathrm{O}\\alpha<90^\\circ$ ⇔ $x>0$　（O で同じように）\n$\\angle\\mathrm{O}\\alpha z<90^\\circ$ ⇔ $x<2\\sqrt3$' }] } },
      { clear: true, part: '(3) 答え', say: '3つをまとめると「$y>0$ かつ $0<x<2\\sqrt3$」。円の上半分は $x$ が $\\sqrt3-2$ から $\\sqrt3+2$ まで動くので、$0<x<2\\sqrt3$ の $x$ はすべて実現します。',
        add: [{ t: 'h', text: '(3)　まとめると' },
          { t: 'm', tex: 'y>0\\ \\ \\text{かつ}\\ \\ 0<x<2\\sqrt3' },
          { t: 'p', size: 'sm', text: '→ 緑の弧（端の $2i$, $2\\sqrt3+2i$ はふくまない）' },
          { t: 'ans', label: '(3) 答', text: '$z$ の実部の範囲は　$0<(\\text{実部})<2\\sqrt3$' },
          fig('c4', [cName, { k: 'pt', at: A, name: 'α (2√3)', dir: 'se', c: 'y', size: 22 }, { k: 'line', x: 2 * r3, dash: true, c: 'd' },
            { k: 'arc', o: c, r: 2, a1: 30, a2: 150, c: 'g', wd: 7 },
            { k: 'pt', at: [0, 2], c: 'g', open: true }, { k: 'pt', at: [2 * r3, 2], c: 'g', open: true },
            { k: 'label', at: [0, 2], text: '2i', dx: -22, dy: -14, c: 'g', size: 20 }, { k: 'label', at: [2 * r3, 2], text: '2√3+2i', dx: 12, dy: -20, anchor: 'start', c: 'g', size: 20 }])] },
      { ask: { type: 'think', q: '緑の弧の端 $z=2i$ と $z=2\\sqrt3+2i$ のとき、三角形 O$\\alpha z$ はどんな三角形？ なぜ端をふくまない？',
        hint: '$2i$ は $\\alpha$ の、$2\\sqrt3+2i$ は O の、円 $C$ での反対側の点（直径の両はし）。',
        ans: 'どちらも **直角三角形**（$z=2i$ では $\\angle z\\mathrm{O}\\alpha=90^\\circ$、$z=2\\sqrt3+2i$ では $\\angle\\mathrm{O}\\alpha z=90^\\circ$）。鋭角ではないので、端はふくまない。',
        after: '直径の両はしを見ると、鋭角になる弧は「O と $\\alpha$ の反対側の点のあいだ」の $120^\\circ$ ぶんとわかります。' } },
      { clear: true, cols: [1], part: '答案の書き方', say: '記述式の答案では、3つの角それぞれの条件と根拠（円周角の定理・内積の符号）を書き、最後に「$C$ 上でその $x$ がすべてとれる」ことまで書きます。',
        add: [{ t: 'h', text: '答案の形　(3)' },
          { t: 'p', size: 'sm', text: '$z=x+yi$ とする。弦 O$\\alpha$ に対する $C$ の中心角は $120^\\circ$ だから、円周角の定理より\n$\\angle\\mathrm{O}z\\alpha$ は $y>0$ のとき $60^\\circ$、$y<0$ のとき $120^\\circ$。よって　$\\angle\\mathrm{O}z\\alpha<90^\\circ\\iff y>0$\n$\\angle z\\mathrm{O}\\alpha<90^\\circ\\iff 2\\sqrt3\\,x>0\\iff x>0$　（O を始点とする2つのベクトルの内積が正）\n$\\angle\\mathrm{O}\\alpha z<90^\\circ\\iff -2\\sqrt3\\,(x-2\\sqrt3)>0\\iff x<2\\sqrt3$\n$C$ の $y>0$ の部分では $x$ は $\\sqrt3-2\\leqq x\\leqq\\sqrt3+2$ のすべての値をとるので　$0<x<2\\sqrt3$' },
          { t: 'box', c: 'y', size: 'sm', label: '点がつく所', text: '3つの角を **もれなく** 調べる・円周角の定理の使いどころ・最後の「その $x$ が本当にとれる」の一言。' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数平面の問題は、式を図形に読みかえてしまえば、あとは図形の性質で進められます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
