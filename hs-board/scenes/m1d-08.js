/* 数学Ⅰ 第4章 図形と計量 三角形への応用 ①：正弦定理
   例はすべて自作（例題1 a=9, B=105°, C=45° → c=9√2, R=9／辺の比 A:B:C=1:1:4 → 1:1:√3／R=4, a=4√3 → A=60°, 120°）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。図の三角形は、どれもその数値どおりの形（角・辺の比）でかいている。 */
(function () {
  const POINTS = [
    '**正弦定理**：$\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}=2R$（$R$ は外接円の半径）。辺と **向かいの角** を組にする',
    '使いどころは「向かい合う辺と角の組」が1つわかるとき。**1辺と2角** なら、まず残りの角を $180^\\circ$ から出す',
    '$a:b:c=\\sin A:\\sin B:\\sin C$。$\\sin A=\\dfrac{a}{2R}$ から角を出すときは、$0^\\circ<A<180^\\circ$ で **2つ** ありうる'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  // 辺 PQ の外側（G と反対側）に字を置く。px＝辺からのはなれ（画面の点）
  const sl = (P, Q, G, text, c, px, size) => {
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];

  // 図1：ふつうの三角形 B(0,0) C(6,0) A(2,4)。外接円の中心 O(3,1)、R=√10
  const tA = [2, 4], tB = [0, 0], tC = [6, 0], tO = [3, 1], tR = Math.sqrt(10), tG = G3(tA, tB, tC);
  const triBase = (pair) => [
    { k: 'poly', pts: [tA, tB, tC], close: true, fill: 'w', alpha: 0.05 },
    { k: 'pt', at: tA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: tB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: tC, name: 'C', dir: 'se', r: 4 },
    sl(tB, tC, tG, 'a', pair ? 'y' : 'w'), sl(tC, tA, tG, 'b', pair ? 'b' : 'w'), sl(tA, tB, tG, 'c', pair ? 'g' : 'w')
  ].concat(pair ? [
    { k: 'angle', o: tA, a: tB, b: tC, rp: 34, c: 'y', label: 'A', lr: 16 },
    { k: 'angle', o: tB, a: tC, b: tA, rp: 34, c: 'b', label: 'B', lr: 16 },
    { k: 'angle', o: tC, a: tA, b: tB, rp: 34, c: 'g', label: 'C', lr: 16 }] : []);

  // 図2：証明。中心 O(0,0)、半径 3。A は 100°、B は 215°、C は 325°、A′ は B の反対 35°（A と同じ側の弧）
  const pO = [0, 0], pR = 3, pA = on(pO, pR, 100), pB = on(pO, pR, 215), pC = on(pO, pR, 325), pA2 = on(pO, pR, 35);

  // 図3：例題1。B(0,0) C(9,0)、B=105°、C=45°、c=9√2。外接円の中心 (4.5, √(81−4.5²))、R=9
  const eB = [0, 0], eC = [9, 0], eA = on(eB, 9 * Math.SQRT2, 105), eO = [4.5, Math.sqrt(81 - 4.5 * 4.5)], eG = G3(eA, eB, eC), eAB = [(eA[0] + eB[0]) / 2, (eA[1] + eB[1]) / 2];

  // 図4：辺の比。A:B:C=1:1:4 → A=B=30°, C=120°。A(0,0) B(2√3,0) C(√3,1)
  const r3 = Math.sqrt(3), qA = [0, 0], qB = [2 * r3, 0], qC = [r3, 1], qG = G3(qA, qB, qC);

  // 図5：考えてみよう。中心 O(0,0)、R=4、弦 BC=4√3（B 210°、C 330°）。A₁ は大きい弧（115°）、A₂ は小さい弧（255°）
  const kO = [0, 0], kB = on(kO, 4, 210), kC = on(kO, 4, 330), kA1 = on(kO, 4, 115), kA2 = on(kO, 4, 255);

  HB.lesson({
    id: 'm1d-08', field: '数学Ⅰ　図形と計量', title: '正弦定理', level: '三角形への応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC で $a=9,\\ B=105^\\circ,\\ C=45^\\circ$ のとき、$c$ と外接円の半径 $R$ を求めよ。',
        '(2)　$A:B:C=1:1:4$ のとき、$a:b:c$ を求めよ。',
        '(3)　外接円の半径が $4$、$a=4\\sqrt3$ のとき、$A$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までに、$0^\\circ$ から $180^\\circ$ までの三角比を学びました。この時間から、三角比を **三角形** に使います。最初は **正弦定理** です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**正弦定理** のしくみを知り、**1辺と2角** から辺の長さや **外接円の半径** を求められる' }] },

      // ---------- 記号と外接円 ----------
      { clear: true, part: '辺と角の記号', say: '△ABC では、頂点 A の **向かい** の辺 BC を $a$、B の向かいを $b$、C の向かいを $c$ と書きます。角の大きさは、そのまま A, B, C と書きます。',
        add: [{ t: 'h', text: '三角形の辺と角の記号' },
          { t: 'm', tex: 'a=\\mathrm{BC},\\qquad b=\\mathrm{CA},\\qquad c=\\mathrm{AB}', note: '頂点 A の **向かい** の辺が $a$' },
          { t: 'p', size: 'sm', text: '角の大きさ：$A=\\angle\\mathrm{BAC}$、$B=\\angle\\mathrm{ABC}$、$C=\\angle\\mathrm{BCA}$' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.2, -2.9, 7.2, 5.0], w: 590, h: 555, items: triBase(false) }] },
      { say: '3つの頂点を通る円を **外接円** といい、その半径を $R$ で表します。この時間は、辺 $a$ と $\\sin A$ と $R$ の関係を調べます。',
        add: [{ t: 'box', c: 'b', label: '外接円', text: '三角形の3つの頂点を通る円。中心 O、半径 $R$' }],
        draw: [{ fig: 'f1', items: [
          { k: 'circle', o: tO, r: tR, c: 'b' }, { k: 'pt', at: tO, name: 'O', dir: 'e', r: 4, c: 'b' },
          { k: 'seg', a: tO, b: tB, c: 'b', dash: true }, { k: 'label', at: [(tO[0] + tB[0]) / 2, (tO[1] + tB[1]) / 2], text: 'R', c: 'b', size: 26, dx: -6, dy: -20 }] }] },

      // ---------- しくみ ----------
      { clear: true, cols: [0.54, 0.46], part: '正弦定理のしくみ', say: 'A が鋭角のときで考えます。B から中心 O を通る **直径 BA′** を引きます。直径なので、BA′ の長さは $2R$ です。',
        add: [{ t: 'h', text: '$\\dfrac{a}{\\sin A}=2R$ のしくみ（A が鋭角）' },
          { t: 'm', tex: "\\mathrm{BA'}=2R", note: '直径' },
          { t: 'fig', id: 'f2', col: 1, view: [-4.2, -4.0, 4.2, 4.0], w: 504, h: 480, items: [
            { k: 'circle', o: pO, r: pR, c: 'd' },
            { k: 'poly', pts: [pA, pB, pC], close: true },
            { k: 'seg', a: pB, b: pA2, c: 'y', dash: true }, { k: 'seg', a: pA2, b: pC, c: 'y' },
            { k: 'pt', at: pO, name: 'O', dir: 'n', r: 4, c: 'd' },
            { k: 'pt', at: pA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: pB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: pC, name: 'C', dir: 'se', r: 4 },
            { k: 'pt', at: pA2, name: 'A′', dir: 'ne', r: 4, c: 'y' },
            sl(pB, pC, pO, 'a', 'p', 26)] }] },
      { say: '同じ弧 BC に対する **円周角** なので、$\\angle\\mathrm{BA\'C}=A$。また、直径に対する円周角なので $\\angle\\mathrm{BCA\'}=90^\\circ$ です。',
        add: [{ t: 'm', tex: "\\angle\\mathrm{BA'C}=\\angle\\mathrm{BAC}=A", note: '弧 BC に対する円周角' },
          { t: 'm', tex: "\\angle\\mathrm{BCA'}=90^\\circ", note: '直径に対する円周角' }],
        draw: [{ fig: 'f2', items: [
          { k: 'angle', o: pA, a: pB, b: pC, rp: 36, c: 'p' }, { k: 'angle', o: pA2, a: pB, b: pC, rp: 36, c: 'p' },
          { k: 'right', o: pC, a: pB, b: pA2, s: 18, c: 'y' }] }] },
      { ask: { type: 'choice', q: "直角三角形 $\\mathrm{A'BC}$ で、$\\sin A\\ (=\\sin\\angle\\mathrm{BA'C})$ を辺で表すと？",
        opts: ['$\\dfrac{2R}{a}$', '$\\dfrac{a}{R}$', '$\\dfrac{a}{2R}$', "$\\dfrac{\\mathrm{A'C}}{2R}$"], ok: 2,
        why: { 0: 'sin は「対辺 ÷ 斜辺」。分母と分子が逆です。', 1: '斜辺は直径 BA′ なので $2R$。半径ではありません。', 3: 'A′C は角 A′ のとなりの辺。それは cos のときに使います。' },
        good: '角 A′ の対辺は BC $=a$、斜辺は直径 $2R$。だから $\\sin A=\\dfrac{a}{2R}$。',
        add: [{ t: 'm', tex: '\\sin A=\\frac{a}{2R}\\qquad\\text{よって}\\qquad \\hy{\\frac{a}{\\sin A}=2R}' }] } },
      { say: 'A が直角なら BC が直径で $a=2R$、$\\sin90^\\circ=1$。A が鈍角でも、$\\sin(180^\\circ-A)=\\sin A$ を使うと、同じ式が成り立ちます。',
        add: [{ t: 'p', size: 'sm', text: 'A が直角：$a=2R,\\ \\sin90^\\circ=1$\nA が鈍角：$\\sin(180^\\circ-A)=\\sin A$ を使う\n→ **どんな三角形でも** 成り立つ' }] },

      // ---------- 正弦定理 ----------
      { clear: true, part: '正弦定理', say: 'B や C でも同じことがいえます。これが **正弦定理** です。辺と、その **向かいの角** の sin の比は、どれも $2R$ に等しくなります。',
        add: [{ t: 'h', text: '正弦定理' },
          { t: 'box', c: 'y', label: '正弦定理', tex: '\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}=2R' },
          { t: 'p', size: 'sm', text: '同じ色どうしが「向かい合う辺と角」の組' },
          { t: 'fig', id: 'f1b', col: 1, view: [-1.2, -1.4, 7.2, 5.2], w: 560, h: 440, items: triBase(true) }] },
      { say: '使いどころは、**向かい合う辺と角の組** が1つわかっているとき。$a=2R\\sin A$ のように、かけ算の形に直して使うこともあります。',
        add: [{ t: 'm', tex: 'a=2R\\sin A,\\quad b=2R\\sin B,\\quad c=2R\\sin C', note: '変形した形' }] },

      // ---------- 例題1 ----------
      { clear: true, cols: [0.55, 0.45], part: '例題1', say: '例題です。$a=9,\\ B=105^\\circ,\\ C=45^\\circ$ のとき、$c$ と $R$ を求めます。$a$ と組になる角 A がまだないので、先に A を出します。',
        add: [{ t: 'h', text: '例題1' },
          { t: 'p', text: '△ABC で $a=9,\\ B=105^\\circ,\\ C=45^\\circ$ のとき、$c$ と外接円の半径 $R$ を求めよ。' },
          { t: 'm', tex: 'A=180^\\circ-(105^\\circ+45^\\circ)=30^\\circ', note: '内角の和は $180^\\circ$' },
          { t: 'fig', id: 'f3', col: 1, view: [-5.6, -2.6, 14.6, 17.6], w: 470, h: 470, items: [
            { k: 'poly', pts: [eA, eB, eC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'pt', at: eA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: eB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: eC, name: 'C', dir: 'se', r: 4 },
            { k: 'angle', o: eB, a: eC, b: eA, rp: 26, c: 'w', label: '105°', lr: 22 }, { k: 'angle', o: eC, a: eA, b: eB, rp: 30, c: 'g', label: '45°', lr: 24 },
            { k: 'angle', o: eA, a: eB, b: eC, rp: 48, c: 'y', label: '30°', lr: 30 },
            sl(eB, eC, eG, '9', 'y', 22), { k: 'label', at: eAB, text: 'c', c: 'g', size: 26, anchor: 'start', dx: 12, dy: 6 }] }] },
      { ask: { type: 'choice', q: '$c$ を求めるには、どの式を使う？',
        opts: ['$\\dfrac{a}{\\sin B}=\\dfrac{c}{\\sin C}$', '$\\dfrac{a}{\\sin A}=\\dfrac{c}{\\sin C}$', '$\\dfrac{a}{\\sin C}=\\dfrac{c}{\\sin A}$', '$a\\sin A=c\\sin C$'], ok: 1,
        why: { 0: '$a$ と組になるのは、向かいの角 A。B ではありません。', 2: '組が入れかわっています。$a$ は $A$ と、$c$ は $C$ と組にします。', 3: '正弦定理は「辺 ÷ sin」が等しい式。かけ算ではありません。' },
        good: '$a$ と $A$、$c$ と $C$ が向かい合う組。$A=30^\\circ$ がわかったので使えます。',
        add: [{ t: 'm', tex: '\\frac{9}{\\sin30^\\circ}=\\frac{c}{\\sin45^\\circ}' }] } },
      { say: '両辺に $\\sin45^\\circ$ をかけます。$\\sin30^\\circ=\\frac12$ で割るのは、2 をかけるのと同じ。$c=9\\sqrt2$ です。',
        add: [{ t: 'm', tex: 'c=\\frac{9\\sin45^\\circ}{\\sin30^\\circ}=9\\cdot\\frac{\\sqrt2}{2}\\cdot2=\\ans{9\\sqrt2}' }],
        draw: [{ fig: 'f3', items: [{ k: 'label', at: eAB, text: '=9√2', c: 'g', size: 24, anchor: 'start', dx: 30, dy: 6 }] }] },
      { ask: { type: 'choice', q: '外接円の半径 $R$ は？',
        opts: ['$18$', '$9\\sqrt2$', '$\\dfrac92$', '$9$'], ok: 3,
        why: { 0: '$\\dfrac{a}{\\sin A}=18$ は $2R$ の値。半分にします。', 1: 'それは $c$ の長さです。$R$ は $\\dfrac{a}{\\sin A}=2R$ から出します。', 2: '$9\\div\\dfrac12=18$。$9\\times\\dfrac12$ ではありません。' },
        good: '$2R=\\dfrac{9}{\\sin30^\\circ}=18$ なので $R=9$。図の円の半径です。',
        add: [{ t: 'ans', label: '答', tex: 'c=9\\sqrt2,\\qquad R=9' }],
        draw: [{ fig: 'f3', items: [{ k: 'circle', o: eO, r: 9, c: 'b' }, { k: 'pt', at: eO, name: 'O', dir: 'e', r: 4, c: 'b' },
          { k: 'seg', a: eO, b: eC, c: 'b', dash: true }, { k: 'label', at: [(eO[0] + eC[0]) / 2, (eO[1] + eC[1]) / 2], text: 'R=9', c: 'b', size: 24, dx: 34, dy: -4 }] }] } },

      // ---------- 辺の比 ----------
      { clear: true, part: '辺の比と sin の比', say: '$a=2R\\sin A$ などを並べると、$a:b:c=\\sin A:\\sin B:\\sin C$。辺の比は、角の比ではなく **sin の比** になります。',
        add: [{ t: 'h', text: '辺の比は sin の比' },
          { t: 'm', tex: 'a:b:c=2R\\sin A:2R\\sin B:2R\\sin C' },
          { t: 'm', tex: '\\hphantom{a:b:c}=\\hy{\\sin A:\\sin B:\\sin C}' },
          { t: 'fig', id: 'f4', col: 1, view: [-0.6, -0.75, 4.1, 1.75], w: 600, h: 319, items: [
            { k: 'poly', pts: [qA, qB, qC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'pt', at: qA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: qB, name: 'B', dir: 'se', r: 4 }, { k: 'pt', at: qC, name: 'C', dir: 'n', r: 4 },
            { k: 'angle', o: qA, a: qB, b: qC, rp: 60, c: 'y', label: '30°', lr: 30 }, { k: 'angle', o: qB, a: qC, b: qA, rp: 60, c: 'y', label: '30°', lr: 30 },
            { k: 'angle', o: qC, a: qA, b: qB, rp: 30, c: 'p', label: '120°', lr: 22 }] }] },
      { ask: { type: 'choice', q: '△ABC で $A:B:C=1:1:4$ のとき、$a:b:c$ は？',
        opts: ['$1:1:4$', '$1:1:2$', '$1:1:\\sqrt3$', '$1:\\sqrt3:2$'], ok: 2,
        why: { 0: '辺の比は、角の比と同じにはなりません。sin の比です。', 1: '$\\sin120^\\circ=\\dfrac{\\sqrt3}{2}$。$\\sin90^\\circ=1$ と同じではありません。', 3: 'それは $30^\\circ,\\ 60^\\circ,\\ 90^\\circ$ の三角形の比です。' },
        good: '$A=B=30^\\circ,\\ C=120^\\circ$。sin の比は $\\dfrac12:\\dfrac12:\\dfrac{\\sqrt3}{2}=1:1:\\sqrt3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin30^\\circ:\\sin30^\\circ:\\sin120^\\circ=\\frac12:\\frac12:\\frac{\\sqrt3}2=\\ans{1:1:\\sqrt3}' }] } },

      // ---------- 角を求める ----------
      { clear: true, cols: [0.54, 0.46], part: '角を求める', say: '正弦定理は、角を求めるのにも使えます。$\\sin A=\\dfrac{a}{2R}$ です。ただし、sin の値が同じになる角は $0^\\circ<A<180^\\circ$ に2つあることに注意します。',
        add: [{ t: 'h', text: '角を求める' },
          { t: 'p', text: '外接円の半径が $4$、$a=4\\sqrt3$ の △ABC で、角 A を求めよ。' },
          { t: 'm', tex: '\\sin A=\\frac{a}{2R}' },
          { t: 'fig', id: 'f5', col: 1, view: [-5.2, -5.4, 5.2, 5.0], w: 480, h: 480, items: [
            { k: 'circle', o: kO, r: 4, c: 'd' }, { k: 'seg', a: kB, b: kC, c: 'y', wd: 4 },
            { k: 'pt', at: kB, name: 'B', dir: 'w', r: 4 }, { k: 'pt', at: kC, name: 'C', dir: 'e', r: 4 },
            { k: 'label', at: [0, kB[1]], text: '4√3', c: 'y', size: 24, dy: -20 }, { k: 'pt', at: kO, r: 3, c: 'd' },
            { k: 'seg', a: kO, b: on(kO, 4, 30), c: 'd', dash: true }, { k: 'label', at: on(kO, 2, 30), text: '4', c: 'd', size: 22, dx: -4, dy: -18 }] }] },
      { ask: { type: 'think', q: '外接円の半径が $4$、$a=4\\sqrt3$ のとき、角 A は何度？（答えは2つ）',
        hint: '$\\sin A=\\dfrac{4\\sqrt3}{2\\cdot4}$。$0^\\circ<A<180^\\circ$ で、sin がこの値になる角を2つさがす。',
        ans: '$\\sin A=\\dfrac{\\sqrt3}{2}$ より　$A=60^\\circ,\\ 120^\\circ$',
        after: '図のように、A が弧 BC の大きい側なら $60^\\circ$、小さい側なら $120^\\circ$。どちらの三角形もかけます。',
        add: [{ t: 'm', tex: '\\sin A=\\frac{4\\sqrt3}{8}=\\frac{\\sqrt3}{2}' }, { t: 'ans', label: '答', tex: 'A=60^\\circ,\\ 120^\\circ' }],
        draw: [{ fig: 'f5', items: [
          { k: 'poly', pts: [kA1, kB, kC], close: true, c: 'g' }, { k: 'pt', at: kA1, name: 'A₁', dir: 'nw', r: 4, c: 'g' },
          { k: 'angle', o: kA1, a: kB, b: kC, rp: 40, c: 'g', label: '60°', lr: 22 },
          { k: 'poly', pts: [kA2, kB, kC], close: true, c: 'p' }, { k: 'pt', at: kA2, name: 'A₂', dir: 's', r: 4, c: 'p' },
          { k: 'angle', o: kA2, a: kB, b: kC, rp: 26, c: 'p', label: '120°', lr: 20 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、**2辺とその間の角** から残りの辺を求める **余弦定理** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
