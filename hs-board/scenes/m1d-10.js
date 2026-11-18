/* 数学Ⅰ 第4章 図形と計量 三角形への応用 ③：正弦定理と余弦定理の使い分け ― 三角形を解く
   例はすべて自作（例題 b=6√3, c=6, A=30° → a=6, B=120°, C=30°／判定 5, 6, 8 → 鈍角／4, 5, x → √41<x<9／
   2通り a=6, b=6√3, A=30° → B=60°（C=90°, c=12）または B=120°（C=30°, c=6））。値・誤答・図の座標は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '**三角形を解く**：1辺と2角 → 内角の和と **正弦定理**。2辺とその間の角 → **余弦定理** で辺。3辺 → 余弦定理の cos の形で角',
    '角を求めるときは cos を使うと、$0^\\circ\\sim180^\\circ$ で1つに決まる。sin だと $\\theta$ と $180^\\circ-\\theta$ の2つが候補になる',
    '最大の辺 $a$ で判定：$a^2<b^2+c^2$ なら鋭角三角形、$=$ なら直角三角形、$a^2>b^2+c^2$ なら鈍角三角形'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];
  const r3 = Math.sqrt(3);

  // 例題：A(0,0) B(6,0) C=6√3(cos30°, sin30°)=(9, 3√3)
  const eA = [0, 0], eB = [6, 0], eC = on(eA, 6 * r3, 30), eG = G3(eA, eB, eC);
  const exFig = (id, aLab) => ({ t: 'fig', id, col: 1, view: [-1.0, -1.2, 10.2, 6.4], w: 590, h: 400, items: [
    { k: 'poly', pts: [eA, eB, eC], close: true, fill: 'w', alpha: 0.05 },
    { k: 'angle', o: eA, a: eB, b: eC, rp: 52, c: 'y', label: '30°', lr: 26 },
    sl(eA, eB, eG, '6', 'y'), sl(eA, eC, eG, '6√3', 'y', 30), Object.assign(sl(eB, eC, eG, aLab, 'p', 28), { anchor: 'start', dx: 14, dy: 8 }),
    { k: 'pt', at: eA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: eB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: eC, name: 'C', dir: 'ne', r: 4 }] });

  // 判定の図：BC を直径とする円。A が円の外→鋭角、円の上→直角、円の中→鈍角
  const jB = [-3, 0], jC = [3, 0], j1 = [-1.2, 4.0], j2 = [0.6, Math.sqrt(9 - 0.36)], j3 = [1.6, 1.3];
  // 2通りの三角形：A(0,0)、C(6√3,0)、A から 30° の半直線。C 中心・半径 6 の円との交点 B₁(c=6)、B₂(c=12)
  const sA = [0, 0], sC = [6 * r3, 0], sB1 = on(sA, 6, 30), sB2 = on(sA, 12, 30);

  HB.lesson({
    id: 'm1d-10', field: '数学Ⅰ　図形と計量', title: '正弦定理と余弦定理の使い分け ― 三角形を解く', level: '三角形への応用', time: '目安 9分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC で $b=6\\sqrt3,\\ c=6,\\ A=30^\\circ$ のとき、$a,\\ B,\\ C$ を求めよ。',
        '(2)　3辺の長さが $5,\\ 6,\\ 8$ の三角形は、鋭角・直角・鈍角三角形のどれか。',
        '(3)　3辺が $4,\\ 5,\\ x$（$x$ が最大）の三角形が鈍角三角形になる $x$ の範囲を求めよ。',
        '(4)　△ABC で $a=6,\\ b=6\\sqrt3,\\ A=30^\\circ$ のとき、$B$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'ここまでに、正弦定理と余弦定理を学びました。この時間は、わかっているものに合わせて **どちらを使うか** を選び、三角形の辺と角をすべて求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: 'わかっているものから **使う定理を選んで** 三角形を解ける\n三角形が **鋭角・直角・鈍角** のどれかを判定できる' }] },

      // ---------- 使い分け ----------
      { clear: true, cols: [1], part: '三角形を解く', say: '3辺と3つの角のうち、いくつかから残りを求めることを **三角形を解く** といいます。何がわかっているかで、最初に使う定理が決まります。',
        add: [{ t: 'h', text: '三角形を解く ― わかっているもので選ぶ' },
          { t: 'tbl', cls: 'rowh', size: 'lg', rows: [['わかっているもの', 'まず使う', '次に'],
            ['**1辺と2角**　例：$a,\\ B,\\ C$', '内角の和で残りの角 → **正弦定理**', '正弦定理で残りの辺'],
            ['**2辺とその間の角**　例：$b,\\ c,\\ A$', '**余弦定理** で残りの辺', '余弦定理（cos の形）で角'],
            ['**3辺**　例：$a,\\ b,\\ c$', '**余弦定理**（cos の形）で角', '内角の和で残りの角']] },
          { t: 'p', size: 'sm', text: '[[y:正弦定理]]＝向かい合う「辺と角の組」が必要　　[[b:余弦定理]]＝2辺とその間の角、または3辺' }] },
      { ask: { type: 'choice', q: '**正弦定理** がそのまま使えるのはどれ？',
        opts: ['$a,\\ b,\\ c$ から $A$', '$b,\\ c,\\ A$ から $a$', '$a,\\ A,\\ B$ から $b$', '$A,\\ B,\\ C$ から $a$'], ok: 2,
        why: { 0: '3辺から角は、余弦定理の cos の形で求めます。', 1: '2辺とその間の角なので余弦定理。$a$ と $A$ の組がまだありません。', 3: '角だけでは大きさが決まりません。相似な三角形がいくらでもあります。' },
        good: '$a$ と $A$ が向かい合う組。$\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}$ から $b$ が出ます。' } },

      // ---------- 例題 ----------
      { clear: true, part: '例題　三角形を解く', say: '例題。$b=6\\sqrt3,\\ c=6,\\ A=30^\\circ$ の三角形を解きます。2辺とその間の角なので、まず **余弦定理** で $a$ を出します。',
        add: [{ t: 'h', text: '例題　三角形を解く' },
          { t: 'p', text: '△ABC で $b=6\\sqrt3,\\ c=6,\\ A=30^\\circ$ のとき、$a,\\ B,\\ C$ を求めよ。' },
          { t: 'm', tex: 'a^2=(6\\sqrt3)^2+6^2-2\\cdot6\\sqrt3\\cdot6\\cdot\\cos30^\\circ' },
          exFig('f1', 'a')] },
      { ask: { type: 'choice', q: '$a$ の値は？',
        opts: ['$12$', '$6\\sqrt7$', '$3\\sqrt{10}$', '$6$'], ok: 3,
        why: { 0: '$-2bc\\cos A$ を忘れています。$108+36$ だけでは、$A=90^\\circ$ のときです。', 1: '$-2bc\\cos A$ の符号がプラスになっています。', 2: '2 のかけ忘れ。$2\\cdot6\\sqrt3\\cdot6\\cdot\\dfrac{\\sqrt3}{2}=108$ です。' },
        good: '$108+36-108=36$ なので $a=6$。',
        add: [{ t: 'm', tex: '\\hphantom{a^2}=108+36-108=36\\qquad a=6' }],
        draw: [{ fig: 'f1', items: [Object.assign(sl(eB, eC, eG, '= 6', 'p', 28), { anchor: 'start', dx: 34, dy: 8 })] }] } },
      { clear: true, part: '例題　角を求める', say: '次は角 B。正弦定理を使うと $\\sin B=\\dfrac{\\sqrt3}{2}$ ですが、$60^\\circ$ か $120^\\circ$ か、これだけでは決まりません。',
        add: [{ t: 'h', text: '角 B は sin と cos のどちらで？' },
          { t: 'm', tex: '\\sin B=\\frac{b\\sin A}{a}=\\frac{6\\sqrt3\\cdot\\frac12}{6}=\\frac{\\sqrt3}{2}', note: '$60^\\circ$？　$120^\\circ$？\n→ 決まらない' },
          { t: 'p', text: '[[b:cos]] なら、$0^\\circ\\sim180^\\circ$ で角が **1つに決まる**\n→ 角は **余弦定理** で求めるのが安全' },
          exFig('f2', 'a = 6')] },
      { ask: { type: 'choice', q: '余弦定理で $\\cos B=\\dfrac{c^2+a^2-b^2}{2ca}$ を計算すると、B は？',
        opts: ['$60^\\circ$', '$120^\\circ$', '$150^\\circ$', '$30^\\circ$'], ok: 1,
        why: { 0: '$\\cos B=-\\dfrac12$ で負なので鈍角。sin だけで決めると、このまちがいが起きます。', 2: '$\\cos150^\\circ=-\\dfrac{\\sqrt3}{2}$。$-\\dfrac12$ になるのは $120^\\circ$。', 3: '$6\\sqrt3$ はいちばん長い辺。その向かいの B はいちばん大きい角です。' },
        good: '$\\cos B=\\dfrac{36+36-108}{72}=-\\dfrac12$ なので $B=120^\\circ$。',
        add: [{ t: 'm', tex: '\\cos B=\\frac{6^2+6^2-(6\\sqrt3)^2}{2\\cdot6\\cdot6}=-\\frac12\\qquad B=120^\\circ' }],
        draw: [{ fig: 'f2', items: [{ k: 'angle', o: eB, a: eC, b: eA, rp: 30, c: 'p', label: '120°', lr: 26 }] }] } },
      { say: '残りの C は、内角の和から $180^\\circ-(30^\\circ+120^\\circ)=30^\\circ$。$a=c=6$ の二等辺三角形なので、$A=C$ にもなっていて確かめになります。',
        add: [{ t: 'ans', label: '答', tex: 'a=6,\\quad B=120^\\circ,\\quad C=30^\\circ' }],
        draw: [{ fig: 'f2', items: [{ k: 'angle', o: eC, a: eA, b: eB, rp: 40, c: 'g', label: '30°', lr: 24 }] }] },

      // ---------- 判定 ----------
      { clear: true, cols: [0.58, 0.42], part: '鋭角・鈍角の判定', say: '$\\cos A=\\dfrac{b^2+c^2-a^2}{2bc}$ の分母は正。だから cos A の符号は、分子 $b^2+c^2-a^2$ の符号で決まります。',
        add: [{ t: 'h', text: '角 A は鋭角？直角？鈍角？' },
          { t: 'm', tex: '\\cos A=\\frac{b^2+c^2-a^2}{2bc}', note: '分母 $2bc>0$\n→ 符号は分子で決まる' },
          { t: 'tbl', cls: 'rowh', rows: [['$a^2$ と $b^2+c^2$', '$\\cos A$', '角 A'], ['$a^2<b^2+c^2$', '$\\cos A>0$', '鋭角'], ['$a^2=b^2+c^2$', '$\\cos A=0$', '直角'], ['$a^2>b^2+c^2$', '$\\cos A<0$', '鈍角']] },
          { t: 'fig', id: 'fj', col: 1, view: [-3.9, -1.0, 3.9, 4.9], w: 560, h: 424, items: [
            { k: 'arc', o: [0, 0], r: 3, a1: 0, a2: 180, c: 'd', dash: true },
            { k: 'seg', a: jB, b: j1, c: 'g' }, { k: 'seg', a: jC, b: j1, c: 'g' },
            { k: 'seg', a: jB, b: j2, c: 'y' }, { k: 'seg', a: jC, b: j2, c: 'y' },
            { k: 'seg', a: jB, b: j3, c: 'p' }, { k: 'seg', a: jC, b: j3, c: 'p' },
            { k: 'seg', a: jB, b: jC, wd: 4 },
            { k: 'pt', at: jB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: jC, name: 'C', dir: 'se', r: 4 },
            { k: 'pt', at: j1, name: 'A', dir: 'n', r: 5, c: 'g' }, { k: 'pt', at: j2, r: 5, c: 'y' }, { k: 'pt', at: j3, r: 5, c: 'p' },
            { k: 'label', at: [0, 0], text: 'a', size: 26, dy: 24 }] }] },
      { say: '三角形の形を決めるのは **いちばん大きい角**。それは **いちばん長い辺の向かい** にあるので、最大の辺についてだけ調べれば十分です。',
        add: [{ t: 'box', c: 'p', label: '判定', text: '**最大の辺** $a$ で $a^2$ と $b^2+c^2$ をくらべる' },
          { t: 'p', size: 'sm', col: 1, text: '図：A が BC を直径とする円の\n[[g:外]] → 鋭角、[[y:上]] → 直角、{{中}} → 鈍角' }] },
      { ask: { type: 'choice', q: '3辺の長さが $5,\\ 6,\\ 8$ の三角形は？',
        opts: ['鋭角三角形', '直角三角形', '鈍角三角形', '決まらない'], ok: 2,
        why: { 0: '5 や 6 の向かいの角は鋭角でも、最大の辺 8 の向かいの角が鈍角です。', 1: '$8^2=64,\\ 5^2+6^2=61$。等しくないので直角ではありません。', 3: '3辺が決まれば三角形は1つ。最大の辺で判定できます。' },
        good: '$8^2=64>5^2+6^2=61$。最大の辺 8 の向かいの角が鈍角です。',
        add: [{ t: 'm', tex: '8^2=64\\ >\\ 5^2+6^2=61', note: '→ **鈍角三角形**' }] } },
      { ask: { type: 'think', q: '3辺が $4,\\ 5,\\ x$（$x$ が最大の辺）の三角形が **鈍角三角形** になる $x$ の範囲は？',
        hint: '鈍角の条件 $x^2>4^2+5^2$ と、三角形ができる条件 $x<4+5$ の両方が必要。',
        ans: '$x^2>41$ と $x<9$ より　$\\sqrt{41}<x<9$',
        after: '三角形ができる条件（2辺の和 ＞ 残りの1辺）を忘れやすいので注意。$\\sqrt{41}\\approx6.4$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'x^2>4^2+5^2,\\ \\ x<4+5\\ \\Rightarrow\\ \\ans{\\sqrt{41}<x<9}' }] } },

      // ---------- 2通り ----------
      { clear: true, cols: [0.5, 0.5], part: '2通りの三角形', say: '最後に、**2辺と、その間でない角** がわかっている場合です。$a=6,\\ b=6\\sqrt3,\\ A=30^\\circ$ の三角形を、図でかいてみましょう。',
        add: [{ t: 'h', text: '2辺と、その間でない角' },
          { t: 'p', text: '△ABC で $a=6,\\ b=6\\sqrt3,\\ A=30^\\circ$ のとき、B を求めよ。' },
          { t: 'p', size: 'sm', text: 'AC $=6\\sqrt3$ をかき、A から $30^\\circ$ の半直線をひく。B は、C から距離 $6$ の点（C を中心とする半径 $6$ の円の上）' },
          { t: 'fig', id: 'fs', col: 1, view: [-1.0, -1.3, 12.0, 7.4], w: 620, h: 415, items: [
            { k: 'seg', a: sA, b: sC, wd: 4 }, { k: 'seg', a: sA, b: on(sA, 13.6, 30), c: 'd' },
            { k: 'arc', o: sC, r: 6, a1: 70, a2: 200, c: 'b', dash: true },
            { k: 'angle', o: sA, a: sC, b: sB2, rp: 60, c: 'y', label: '30°', lr: 28 },
            { k: 'label', at: [sC[0] / 2, 0], text: '6√3', c: 'y', size: 24, dy: 24 },
            { k: 'pt', at: sA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: sC, name: 'C', dir: 'se', r: 4 }] }] },
      { ask: { type: 'think', q: '$a=6,\\ b=6\\sqrt3,\\ A=30^\\circ$ のとき、B は何度？',
        hint: '正弦定理で $\\sin B=\\dfrac{b\\sin A}{a}$。図で、円と半直線の交わる点はいくつ？',
        ans: '$\\sin B=\\dfrac{\\sqrt3}{2}$ より　$B=60^\\circ$ または $120^\\circ$（どちらも三角形ができる）',
        after: '$B=60^\\circ$ なら $C=90^\\circ,\\ c=12$。$B=120^\\circ$ なら $C=30^\\circ,\\ c=6$ で、例題と同じ形の三角形です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin B=\\frac{6\\sqrt3\\cdot\\frac12}{6}=\\frac{\\sqrt3}{2}' }, { t: 'ans', label: '答', tex: 'B=60^\\circ,\\ 120^\\circ' }],
        draw: [{ fig: 'fs', items: [
          { k: 'seg', a: sB1, b: sC, c: 'p' }, { k: 'seg', a: sB2, b: sC, c: 'g' },
          { k: 'pt', at: sB1, name: 'B₁', dir: 'n', r: 5, c: 'p' }, { k: 'pt', at: sB2, name: 'B₂', dir: 'n', r: 5, c: 'g' },
          { k: 'label', at: [(sB1[0] + sC[0]) / 2, (sB1[1] + sC[1]) / 2], text: '6', c: 'p', size: 24, dx: 8, dy: 20 },
          { k: 'label', at: [sC[0], sB2[1] / 2], text: '6', c: 'g', size: 24, dx: 18 }] }] } },
      { say: 'このように、2辺とその間でない角からは、三角形が **2通り** できることがあります。正弦定理で角を出したら、$180^\\circ-\\theta$ の方も三角形になるか、必ず確かめましょう。',
        add: [{ t: 'p', size: 'sm', text: '{{B₁}}：$B=120^\\circ,\\ C=30^\\circ,\\ c=6$\n[[g:B₂]]：$B=60^\\circ,\\ C=90^\\circ,\\ c=12$' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角比を使って **三角形の面積** と **内接円の半径** を求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
