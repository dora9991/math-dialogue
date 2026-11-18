/* 数学A 第2章 図形の性質 三角形の性質 ③：三角形の外心と内心
   例はすべて自作（外心 ∠OAB=25°, ∠OCA=35° → ∠OBC=30°（A=60°, B=55°, C=65°）／
   内心 A=70°（B=60°, C=50°）→ ∠BIC=125°／∠BIC=118° → A=56°）。
   値・誤答・図の座標（外心・内心・接点）は python3（sympy）で検算ずみ。図の三角形は、その角どおりの形でかいている。 */
(function () {
  const POINTS = [
    '**外心** O：3辺の **垂直二等分線** の交点。OA $=$ OB $=$ OC で、**外接円** の中心（鋭角三角形は内部・直角は斜辺の中点・鈍角は外部）',
    '**内心** I：3つの内角の **二等分線** の交点。3辺までの距離が等しく、**内接円** の中心（いつも内部）',
    '外心の角は **二等辺三角形 OAB, OBC, OCA** で考える。内心では $\\angle\\mathrm{BIC}=90^\\circ+\\dfrac{A}{2}$'
  ];
  const rad = t => t * Math.PI / 180, on = (o, r, t) => [o[0] + r * Math.cos(rad(t)), o[1] + r * Math.sin(rad(t))];
  const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
  const foot = (P, Q, X) => { const ux = Q[0] - P[0], uy = Q[1] - P[1], t = ((X[0] - P[0]) * ux + (X[1] - P[1]) * uy) / (ux * ux + uy * uy); return [P[0] + t * ux, P[1] + t * uy]; };

  // 外心の図：外接円 中心 O(0,0)・半径 3。A 80°, B 210°, C 330° → A=60°, B=55°, C=65°（∠OAB=25°, ∠OCA=35°, ∠OBC=30°）
  const O = [0, 0], A = on(O, 3, 80), B = on(O, 3, 210), C = on(O, 3, 330);
  const pbis = (P, Q, c) => {   // 辺 PQ の垂直二等分線（辺の外側から O の先まで）＋直角の印
    const M = mid(P, Q), L = Math.hypot(M[0], M[1]), u = [-M[0] / L, -M[1] / L];
    return [{ k: 'seg', a: [M[0] - 0.9 * u[0], M[1] - 0.9 * u[1]], b: [0.3 * u[0], 0.3 * u[1]], c: c || 'b', wd: 2.5 }, { k: 'right', o: M, a: P, b: O, s: 13, c: c || 'b' }];
  };
  const triO = [{ k: 'poly', pts: [A, B, C], close: true, fill: 'w', alpha: 0.05 },
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'se', r: 4 }];

  // 内心の図：B(0,0) C(6,0)、B=60°, C=50°, A=70°。内心 I＝(aA+bB+cC)/(a+b+c)、r＝I の y 座標
  const s70 = Math.sin(rad(70)), ia = 6, ib = 6 * Math.sin(rad(60)) / s70, ic = 6 * Math.sin(rad(50)) / s70;
  const iB = [0, 0], iC = [6, 0], iA = on(iB, ic, 60), sum = ia + ib + ic;
  const I = [(ia * iA[0] + ib * iB[0] + ic * iC[0]) / sum, (ia * iA[1] + ib * iB[1] + ic * iC[1]) / sum], ir = I[1];
  const triI = (extra) => [{ k: 'poly', pts: [iA, iB, iC], close: true, fill: 'w', alpha: 0.05 }].concat(extra || [], [
    { k: 'pt', at: iA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: iB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: iC, name: 'C', dir: 'se', r: 4 }]);

  HB.lesson({
    id: 'ma2-03', field: '数学A　図形の性質', title: '三角形の外心と内心', level: '三角形の性質', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC の外心を O とする。∠OAB $=25^\\circ$、∠OCA $=35^\\circ$ のとき、∠OBC を求めよ。',
        '(2)　△ABC の内心を I とする。∠BIC を ∠A を使って表せ。',
        '(3)　(2) で ∠A $=70^\\circ$ のとき、∠BIC を求めよ。',
        '(4)　∠BIC $=118^\\circ$ のとき、∠A を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '三角形には、いくつかの「中心」があります。この時間は **外心** と **内心**。中学で作図した **垂直二等分線** と **角の二等分線** が主役です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**外心**・**内心** がどんな点か、なぜ3本の線が1点で交わるかを説明できる\n外心・内心を使って角の大きさを求められる' }] },

      // ---------- 外心 ----------
      { clear: true, part: '外心', say: '線分の垂直二等分線上の点は、両はしから **等しい距離** にあります。AB と BC の垂直二等分線の交点を O とすると、OA $=$ OB、OB $=$ OC です。',
        add: [{ t: 'h', text: '外心　垂直二等分線の交点' },
          { t: 'box', c: 'b', label: '垂直二等分線', text: 'PQ の垂直二等分線上の点 X → XP $=$ XQ' },
          { t: 'm', tex: '\\mathrm{OA}=\\mathrm{OB},\\qquad \\mathrm{OB}=\\mathrm{OC}', note: 'AB, BC の\n垂直二等分線上' },
          { t: 'fig', id: 'f1', col: 1, view: [-4.2, -4.0, 4.2, 4.3], w: 520, h: 514, items: triO.concat(pbis(A, B), pbis(B, C),
            [{ k: 'pt', at: O, name: 'O', dir: 'w', off: 20, r: 5, c: 'p' }]) }] },
      { say: 'すると OA $=$ OC なので、O は CA の垂直二等分線上にもあります。3本は1点 O で交わり、O を中心に A, B, C を通る円がかけます。O を **外心** といいます。',
        add: [{ t: 'm', tex: '\\mathrm{OA}=\\mathrm{OC}', note: 'CA の垂直二等分線も O を通る' },
          { t: 'box', c: 'y', label: '外心', text: '3辺の垂直二等分線の交点 O\nOA $=$ OB $=$ OC → **外接円** の中心' }],
        draw: [{ fig: 'f1', items: pbis(C, A).concat([{ k: 'circle', o: O, r: 3, c: 'p', wd: 2.5 },
          { k: 'seg', a: O, b: A, c: 'p', dash: true }, { k: 'seg', a: O, b: B, c: 'p', dash: true }, { k: 'seg', a: O, b: C, c: 'p', dash: true }]) }] },
      { ask: { type: 'choice', q: '△ABC の外心 O について、いつでも正しいのは？',
        opts: ['O から3つの辺までの距離が等しい', 'O から3つの頂点までの距離が等しい', 'O は3本の中線の交点', 'O はいつも三角形の内部にある'], ok: 1,
        why: { 0: 'それは内心の性質です。外心は「頂点まで」の距離が等しい点です。', 2: '中線の交点は重心（次の時間）。外心は垂直二等分線の交点です。', 3: '鈍角三角形では、外心は三角形の外にあります。' },
        good: 'OA $=$ OB $=$ OC。だから O を中心に、3つの頂点を通る外接円がかけます。' } },
      { say: '外心の位置は、三角形の形で変わります。鋭角三角形なら内部、直角三角形なら **斜辺の中点**、鈍角三角形なら外部です。',
        add: [{ t: 'p', size: 'sm', text: '外心の位置　鋭角三角形 → **内部**\n　直角三角形 → **斜辺の中点**　鈍角三角形 → **外部**' }] },

      // ---------- 外心と角 ----------
      { clear: true, cols: [0.54, 0.46], part: '外心と角', say: '例題です。外心 O で ∠OAB $=25^\\circ$、∠OCA $=35^\\circ$ のとき、∠OBC $=x$ を求めます。OA $=$ OB $=$ OC がカギです。',
        add: [{ t: 'h', text: '例題　外心と角' },
          { t: 'p', text: '△ABC の外心を O とする。∠OAB $=25^\\circ$、\n∠OCA $=35^\\circ$ のとき、∠OBC $=x$ を求めよ。' },
          { t: 'fig', id: 'f2', col: 1, view: [-3.5, -2.4, 3.5, 3.8], w: 560, h: 496, items: triO.concat([
            { k: 'seg', a: O, b: A, c: 'd' }, { k: 'seg', a: O, b: B, c: 'd' }, { k: 'seg', a: O, b: C, c: 'd' },
            { k: 'pt', at: O, name: 'O', dir: 's', off: 22, r: 5, c: 'p' },
            { k: 'angle', o: A, a: B, b: O, rp: 64, c: 'y', label: '25°', lr: 24 },
            { k: 'angle', o: C, a: A, b: O, rp: 64, c: 'g', label: '35°', lr: 24 },
            { k: 'angle', o: B, a: C, b: O, rp: 64, c: 'b', label: 'x', lr: 18 }]) }] },
      { say: 'OA $=$ OB $=$ OC なので、△OAB・△OBC・△OCA は **二等辺三角形**。底角が等しいので、同じ大きさの角が2つずつできます。',
        add: [{ t: 'p', text: '△OAB, △OBC, △OCA は二等辺三角形\n→ ∠OBA $=25^\\circ$、∠OAC $=35^\\circ$、∠OCB $=x$' },
          { t: 'm', tex: '2(25^\\circ+35^\\circ+x)=180^\\circ', note: '△ABC の内角の和' }],
        draw: [{ fig: 'f2', items: [
          { k: 'angle', o: B, a: O, b: A, rp: 64, c: 'y', label: '25°', lr: 24 },
          { k: 'angle', o: A, a: O, b: C, rp: 64, c: 'g', label: '35°', lr: 24 },
          { k: 'angle', o: C, a: O, b: B, rp: 64, c: 'b', label: 'x', lr: 18 }] }] },
      { ask: { type: 'choice', q: '$x$ は何度？',
        opts: ['$60^\\circ$', '$90^\\circ$', '$120^\\circ$', '$30^\\circ$'], ok: 3,
        why: { 0: '$25^\\circ+35^\\circ=60^\\circ$ は ∠A の大きさです。', 1: '$90^\\circ$ は $25^\\circ+35^\\circ+x$ の値。$x$ はそこから $60^\\circ$ をひきます。', 2: '$120^\\circ$ は中心角 ∠BOC です。' },
        good: '$25^\\circ+35^\\circ+x=90^\\circ$ より $x=30^\\circ$。',
        add: [{ t: 'm', tex: '25^\\circ+35^\\circ+x=90^\\circ\\qquad x=\\ans{30^\\circ}' }] } },

      // ---------- 内心 ----------
      { clear: true, part: '内心', say: '角の二等分線上の点は、角の **2辺から等しい距離** にあります。∠B と ∠C の二等分線の交点 I は、3辺から等しい距離。だから ∠A の二等分線上にもあります。',
        add: [{ t: 'h', text: '内心　角の二等分線の交点' },
          { t: 'box', c: 'b', label: '角の二等分線', text: '角の二等分線上の点 → 2辺までの距離が等しい' },
          { t: 'box', c: 'y', label: '内心', text: '3つの内角の二等分線の交点 I\n3辺までの距離が等しい → **内接円** の中心' },
          { t: 'fig', id: 'f3', col: 1, view: [-0.9, -0.9, 6.9, 5.1], w: 560, h: 431, items: triI([
            { k: 'seg', a: iA, b: I, c: 'g', wd: 2.5 }, { k: 'seg', a: iB, b: I, c: 'g', wd: 2.5 }, { k: 'seg', a: iC, b: I, c: 'g', wd: 2.5 },
            { k: 'circle', o: I, r: ir, c: 'b', wd: 2.5 },
            { k: 'seg', a: I, b: foot(iB, iC, I), c: 'p' }, { k: 'right', o: foot(iB, iC, I), a: iC, b: I, s: 12, c: 'p' },
            { k: 'seg', a: I, b: foot(iC, iA, I), c: 'p' }, { k: 'right', o: foot(iC, iA, I), a: iA, b: I, s: 12, c: 'p' },
            { k: 'seg', a: I, b: foot(iA, iB, I), c: 'p' }, { k: 'right', o: foot(iA, iB, I), a: iB, b: I, s: 12, c: 'p' },
            { k: 'angle', o: iB, a: iC, b: I, rp: 50, c: 'g' }, { k: 'angle', o: iB, a: I, b: iA, rp: 56, c: 'g' },
            { k: 'angle', o: iC, a: I, b: iB, rp: 50, c: 'g', n: 2 }, { k: 'angle', o: iC, a: iA, b: I, rp: 50, c: 'g', n: 2 },
            { k: 'pt', at: I, name: 'I', dir: 'ne', off: 18, r: 5, c: 'b' }]) }] },
      { ask: { type: 'choice', q: '内心 I は、どんな三角形でも三角形の内部にある？',
        opts: ['いつも内部にある', '鈍角三角形では外部にある'], ok: 0,
        why: { 1: 'それは外心の性質です。内心は3辺すべてに接する円（内接円）の中心なので、いつも内部です。' },
        good: '内接円は三角形の中にかける円。その中心 I は、いつも三角形の内部にあります。' } },

      // ---------- ∠BIC ----------
      { clear: true, cols: [0.56, 0.44], part: '内心と角', say: '内心 I で、∠BIC を ∠A で表します。BI, CI は ∠B, ∠C の二等分線なので、∠IBC $=\\dfrac{B}{2}$、∠ICB $=\\dfrac{C}{2}$ です。',
        add: [{ t: 'h', text: '∠BIC を A で表す' },
          { t: 'm', tex: '\\angle\\mathrm{IBC}=\\frac{B}{2},\\qquad \\angle\\mathrm{ICB}=\\frac{C}{2}', note: '角の二等分線' },
          { t: 'fig', id: 'f4', col: 1, view: [-0.9, -0.9, 6.9, 5.1], w: 560, h: 431, items: triI([
            { k: 'seg', a: iB, b: I, c: 'g' }, { k: 'seg', a: iC, b: I, c: 'g' }, { k: 'seg', a: iA, b: I, c: 'd', dash: true },
            { k: 'angle', o: iB, a: iC, b: I, rp: 50, c: 'g' }, { k: 'angle', o: iB, a: I, b: iA, rp: 56, c: 'g' },
            { k: 'angle', o: iC, a: I, b: iB, rp: 50, c: 'g', n: 2 }, { k: 'angle', o: iC, a: iA, b: I, rp: 50, c: 'g', n: 2 },
            { k: 'angle', o: iA, a: iB, b: iC, rp: 40, c: 'y' }, { k: 'label', at: iA, text: 'A', c: 'y', size: 22, dx: -14, dy: 58 },
            { k: 'angle', o: I, a: iB, b: iC, rp: 30, c: 'p' },
            { k: 'pt', at: I, name: 'I', dir: 'n', off: 20, r: 5, c: 'b' }]) }] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{IBC}+\\angle\\mathrm{ICB}$ を A で表すと？',
        opts: ['$90^\\circ+\\dfrac{A}{2}$', '$180^\\circ-A$', '$90^\\circ-\\dfrac{A}{2}$', '$\\dfrac{A}{2}$'], ok: 2,
        why: { 0: 'それは、このあと求める ∠BIC の形です。', 1: '$180^\\circ-A$ は $B+C$。二等分線なので、その半分です。', 3: '$\\dfrac{A}{2}$ は ∠BAI の大きさです。' },
        good: '$\\dfrac{B+C}{2}=\\dfrac{180^\\circ-A}{2}=90^\\circ-\\dfrac{A}{2}$。',
        add: [{ t: 'm', tex: '\\frac{B}{2}+\\frac{C}{2}=\\frac{180^\\circ-A}{2}=90^\\circ-\\frac{A}{2}' }] } },
      { say: '△IBC の内角の和から、∠BIC は $180^\\circ$ からこれをひいた角。$\\angle\\mathrm{BIC}=90^\\circ+\\dfrac{A}{2}$ です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{BIC}=180^\\circ-\\left(90^\\circ-\\frac{A}{2}\\right)', note: '△IBC の内角の和' },
          { t: 'box', c: 'y', label: '内心', tex: '\\angle\\mathrm{BIC}=90^\\circ+\\frac{A}{2}' }] },
      { ask: { type: 'choice', q: 'この図の三角形は ∠A $=70^\\circ$。∠BIC は？',
        opts: ['$140^\\circ$', '$125^\\circ$', '$110^\\circ$', '$160^\\circ$'], ok: 1,
        why: { 0: '$2A$ は外心のときの ∠BOC。内心は $90^\\circ+\\dfrac{A}{2}$ です。', 2: '$180^\\circ-70^\\circ$ は $B+C$。∠BIC ではありません。', 3: '$90^\\circ+A$ としています。A は半分にします。' },
        good: '$90^\\circ+\\dfrac{70^\\circ}{2}=90^\\circ+35^\\circ=125^\\circ$。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{BIC}=90^\\circ+35^\\circ=\\ans{125^\\circ}' }],
        draw: [{ fig: 'f4', items: [{ k: 'label', at: iA, text: '70°', c: 'y', size: 22, anchor: 'start', dx: 12, dy: 58 }, { k: 'label', at: I, text: '125°', c: 'p', size: 22, dy: 52 }] }] } },
      { ask: { type: 'think', q: '△ABC の内心を I とする。∠BIC $=118^\\circ$ のとき、∠A は何度？',
        hint: '$90^\\circ+\\dfrac{A}{2}=118^\\circ$ を解く。',
        ans: '$\\dfrac{A}{2}=28^\\circ$ より　∠A $=56^\\circ$',
        after: '外心 O なら、円周角の定理（中学）で ∠BOC $=2A$（A が鋭角のとき）。内心と外心で式がちがうので注意。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '90^\\circ+\\frac{A}{2}=118^\\circ\\qquad A=\\ans{56^\\circ}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角形の残りの中心、**重心** と **垂心** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
