/* 数学Ⅰ 第4章 図形と計量 三角形への応用 ⑤：円に内接する四角形
   例はすべて自作（AB=8, BC=3, CD=5, DA=5 → cosA=1/2, A=60°, C=120°, BD=7, S=55√3/4, R=7√3/3）。
   値・誤答は python3（sympy）で検算ずみ。例題の図は、半径 7/√3 の円の上に、弦の長さ 8・3・5・5 に合う中心角（163.57°・43.57°・76.43°・76.43°）で頂点をとっている。 */
(function () {
  const POINTS = [
    '円に内接する四角形は **対角の和が $180^\\circ$**。$C=180^\\circ-A$ なので $\\cos C=-\\cos A$、$\\sin C=\\sin A$',
    '4辺がわかるとき：対角線 BD を **2つの三角形の余弦定理で2通りに表し**、等しいとおいて $\\cos A$ を求める',
    '面積は、対角線で分けた2つの三角形の和。$\\sin C=\\sin A$ なので $S=\\dfrac12(\\mathrm{AB\\cdot AD}+\\mathrm{CB\\cdot CD})\\sin A$'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
  const outLab = (P, Q, O, text, c, px) => {   // 弦 PQ の中点から、円の中心 O と反対側に字
    const M = mid(P, Q); let nx = M[0] - O[0], ny = M[1] - O[1]; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    return { k: 'label', at: M, text, c: c || 'w', size: 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const inLab = (P, Q, G, text, c, px) => {   // 弦 PQ の中点から、G の側（内側）に字
    const M = mid(P, Q); let nx = G[0] - M[0], ny = G[1] - M[1]; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    return { k: 'label', at: M, text, c: c || 'w', size: 24, dx: nx * (px || 22), dy: -ny * (px || 22) };
  };

  // 性質の図：半径 3、A 200°・B 300°・C 20°・D 110°（A=85°、C=95°）
  const gO = [0, 0], gA = on(gO, 3, 200), gB = on(gO, 3, 300), gC = on(gO, 3, 20), gD = on(gO, 3, 110);
  // 例題の図：R=7/√3。弧 AB（C,D をふくまない）163.57°、BC 43.57°、CD 76.43°、DA 76.43°。AB が下で水平になるように
  const R = 7 / Math.sqrt(3), t8 = 2 * Math.asin(8 / (2 * R)) * 180 / Math.PI, t3 = 2 * Math.asin(3 / (2 * R)) * 180 / Math.PI, t5 = 2 * Math.asin(5 / (2 * R)) * 180 / Math.PI;
  const O = [0, 0], aA = 270 - t8 / 2, A = on(O, R, aA), B = on(O, R, aA + t8), C = on(O, R, aA + t8 + t3), D = on(O, R, aA + t8 + t3 + t5);
  const Gq = [(A[0] + B[0] + C[0] + D[0]) / 4, (A[1] + B[1] + C[1] + D[1]) / 4];
  const angs = (la, lc) => [{ k: 'angle', o: A, a: B, b: D, rp: 44, c: 'p', label: la, lr: 24 }, { k: 'angle', o: C, a: D, b: B, rp: 30, c: 'b', label: lc, lr: 30 }];
  const quad = (extra, ang) => [
    { k: 'circle', o: O, r: R, c: 'd' },
    { k: 'poly', pts: [A, B, C, D], close: true, fill: 'w', alpha: 0.05 },
    { k: 'pt', at: A, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'se', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'ne', r: 4 }, { k: 'pt', at: D, name: 'D', dir: 'n', r: 4 },
    inLab(A, B, Gq, '8', 'w', 22), outLab(B, C, O, '3'), outLab(C, D, O, '5'), outLab(D, A, O, '5'),
    { k: 'seg', a: B, b: D, c: 'y', dash: true }
  ].concat(ang ? angs(ang[0], ang[1]) : [], extra || []);
  const qfig = (id, extra, ang, w) => ({ t: 'fig', id, col: 1, view: [-4.9, -4.6, 4.9, 4.9], w: w || 480, h: Math.round((w || 480) * 9.5 / 9.8), items: quad(extra, ang) });

  HB.lesson({
    id: 'm1d-12', field: '数学Ⅰ　図形と計量', title: '円に内接する四角形', level: '三角形への応用', time: '目安 8分',
    problem: { label: '例題', lead: '円に内接する四角形 ABCD で、AB $=8$、BC $=3$、CD $=5$、DA $=5$ とする。',
      parts: ['(1)　$\\cos A$ と、対角線 BD の長さを求めよ。', '(2)　四角形 ABCD の面積 $S$ を求めよ。', '(3)　円の半径 $R$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'この時間は、これまでの道具（$180^\\circ-\\theta$ の三角比・余弦定理・面積の公式）を組み合わせて、**円に内接する四角形** の対角線や面積を求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '円に内接する四角形の **対角の和が $180^\\circ$** を使って、対角線の長さと面積を求められる' }] },

      // ---------- 性質 ----------
      { clear: true, part: '内接する四角形', say: '四角形の4つの頂点が1つの円の上にあるとき、四角形は円に **内接する** といいます。中学で学んだように、向かい合う角（**対角**）の和は $180^\\circ$ です。',
        add: [{ t: 'h', text: '円に内接する四角形' },
          { t: 'm', tex: 'A+C=180^\\circ,\\qquad B+D=180^\\circ', note: '対角の和は $180^\\circ$' },
          { t: 'fig', id: 'g1', col: 1, view: [-3.9, -3.7, 3.9, 3.7], w: 520, h: 493, items: [
            { k: 'circle', o: gO, r: 3, c: 'd' }, { k: 'poly', pts: [gA, gB, gC, gD], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: gA, a: gB, b: gD, rp: 36, c: 'p', label: 'θ', lr: 18 }, { k: 'angle', o: gC, a: gD, b: gB, rp: 36, c: 'b', label: '180°−θ', lr: 40 },
            { k: 'pt', at: gA, name: 'A', dir: 'w', r: 4 }, { k: 'pt', at: gB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: gC, name: 'C', dir: 'e', r: 4 }, { k: 'pt', at: gD, name: 'D', dir: 'n', r: 4 }] }] },
      { say: 'わけ：A と C は、弦 BD の両側の弧に対する円周角です。2つの弧の中心角を合わせると $360^\\circ$ なので、円周角の和はその半分の $180^\\circ$ です。',
        add: [{ t: 'p', size: 'sm', text: 'A と C は、弦 BD の **両側の弧** に対する円周角\n→ 中心角の和 $360^\\circ$ の半分で $A+C=180^\\circ$' }],
        draw: [{ fig: 'g1', items: [{ k: 'seg', a: gB, b: gD, c: 'y', dash: true }] }] },
      { ask: { type: 'choice', q: '$C=180^\\circ-A$ のとき、$\\cos C$ は？',
        opts: ['$\\cos A$', '$-\\sin A$', '$\\sin A$', '$-\\cos A$'], ok: 3,
        why: { 0: '$180^\\circ-\\theta$ では、cos の符号が変わります。', 1: '$180^\\circ-\\theta$ で sin と cos は入れかわりません（入れかわるのは $90^\\circ-\\theta$）。', 2: '$180^\\circ-\\theta$ で sin と cos は入れかわりません（入れかわるのは $90^\\circ-\\theta$）。' },
        good: '$\\cos(180^\\circ-A)=-\\cos A$、$\\sin(180^\\circ-A)=\\sin A$。この2つが、この時間の鍵です。',
        add: [{ t: 'box', c: 'b', label: '鍵', tex: '\\cos C=-\\cos A,\\qquad \\sin C=\\sin A' }] } },

      // ---------- 例題 (1) ----------
      { clear: true, part: '例題(1)　対角線', say: '例題。AB $=8$、BC $=3$、CD $=5$、DA $=5$ の内接四角形です。対角線 BD で、△ABD と △CBD に分けて考えます。',
        add: [{ t: 'h', text: '例題 (1)　$\\cos A$ と BD' },
          { t: 'p', text: '円に内接する四角形 ABCD\nAB $=8$、BC $=3$、CD $=5$、DA $=5$' },
          qfig('q1', [], [null, null])] },
      { say: '△ABD で余弦定理。△CBD でも、角 C で余弦定理。そこへ $\\cos C=-\\cos A$ を入れると、どちらも $\\cos A$ の式になります。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{ABD}:\\ \\mathrm{BD}^2=8^2+5^2-2\\cdot8\\cdot5\\cos A=89-80\\cos A' },
          { t: 'm', tex: '\\triangle\\mathrm{CBD}:\\ \\mathrm{BD}^2=3^2+5^2-2\\cdot3\\cdot5\\cos C=34+30\\cos A' }] },
      { ask: { type: 'choice', q: '2つの $\\mathrm{BD}^2$ を等しいとおくと、$\\cos A$ は？',
        opts: ['$-\\dfrac12$', '$\\dfrac{11}{10}$', '$\\dfrac12$', '$1$'], ok: 2,
        why: { 0: '$89-80\\cos A=34+30\\cos A$ より $110\\cos A=55$。符号に注意。', 1: '$\\cos C=-\\cos A$ を使わずに $\\cos C=\\cos A$ としています。cos が 1 をこえるのはおかしい。', 3: '$2\\cdot8\\cdot5$ と $2\\cdot3\\cdot5$ の 2 をかけ忘れています。' },
        good: '$89-80\\cos A=34+30\\cos A$ より $110\\cos A=55$、$\\cos A=\\dfrac12$。$A=60^\\circ$、$C=120^\\circ$。',
        add: [{ t: 'm', tex: '89-80\\cos A=34+30\\cos A' }, { t: 'm', tex: '110\\cos A=55\\qquad \\cos A=\\hy{\\frac12}', note: '$A=60^\\circ,\\ C=120^\\circ$' }],
        draw: [{ fig: 'q1', items: angs('60°', '120°') }] } },
      { ask: { type: 'choice', q: '対角線 BD の長さは？',
        opts: ['$7$', '$\\sqrt{129}$', '$\\sqrt{69}$', '$\\sqrt{89}$'], ok: 0,
        why: { 1: '$-80\\cos A=-40$。プラスにしています。', 2: '$80\\cos A=40$ です。$20$ ではありません。', 3: '$-80\\cos A$ の項が消えています。' },
        good: '$\\mathrm{BD}^2=89-40=49$ なので BD $=7$。$34+15=49$ でも確かめられます。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\cos A=\\frac12,\\qquad \\mathrm{BD}=7' }],
        draw: [{ fig: 'q1', items: [inLab(B, D, A, '7', 'y', 22)] }] } },

      // ---------- 例題 (2) ----------
      { clear: true, part: '例題(2)　面積', say: '面積は、対角線 BD で分けた △ABD と △CBD の和です。$\\sin C=\\sin A=\\dfrac{\\sqrt3}{2}$ を使います。',
        add: [{ t: 'h', text: '例題 (2)　四角形の面積' },
          { t: 'm', tex: 'S=\\triangle\\mathrm{ABD}+\\triangle\\mathrm{CBD}' },
          { t: 'm', tex: '\\hphantom{S}=\\frac12\\cdot8\\cdot5\\sin60^\\circ+\\frac12\\cdot3\\cdot5\\sin120^\\circ' },
          qfig('q2', [{ k: 'poly', pts: [A, B, D], close: true, fill: 'p', alpha: 0.16, noStroke: true }, { k: 'poly', pts: [C, D, B], close: true, fill: 'b', alpha: 0.2, noStroke: true }], ['60°', '120°'])] },
      { ask: { type: 'choice', q: '四角形 ABCD の面積 $S$ は？',
        opts: ['$\\dfrac{25\\sqrt3}{4}$', '$\\dfrac{55\\sqrt3}{4}$', '$\\dfrac{55\\sqrt3}{2}$', '$10\\sqrt3$'], ok: 1,
        why: { 0: '$\\sin120^\\circ$ を負にしてひいています。sin は $180^\\circ-\\theta$ でも同じ正の値です。', 2: '三角形の面積の $\\dfrac12$ をかけ忘れています。', 3: 'それは △ABD だけ。△CBD の分 $\\dfrac{15\\sqrt3}{4}$ もたします。' },
        good: '$10\\sqrt3+\\dfrac{15\\sqrt3}{4}=\\dfrac{55\\sqrt3}{4}$。$\\dfrac12(8\\cdot5+3\\cdot5)\\sin A$ とまとめても同じです。',
        add: [{ t: 'm', tex: '\\hphantom{S}=10\\sqrt3+\\frac{15\\sqrt3}{4}' }, { t: 'ans', label: '(2) 答', tex: 'S=\\frac{55\\sqrt3}{4}' }] } },
      { ask: { type: 'think', q: '(3)　この四角形の外接円の半径 $R$ を求めよう。',
        hint: '円は △ABD の外接円でもある。△ABD に正弦定理 $\\dfrac{\\mathrm{BD}}{\\sin A}=2R$。',
        ans: '$2R=\\dfrac{7}{\\sin60^\\circ}=\\dfrac{14}{\\sqrt3}$ より　$R=\\dfrac{7\\sqrt3}{3}$',
        after: '△CBD で $\\dfrac{7}{\\sin120^\\circ}$ としても同じ値。四角形の外接円は、対角線でできるどちらの三角形の外接円でもあります。',
        add: [{ t: 'm', size: 'sm', tex: '2R=\\frac{\\mathrm{BD}}{\\sin A}=\\frac{7}{\\sin60^\\circ}\\qquad R=\\ans{\\frac{7\\sqrt3}{3}}' }] } },
      { say: '流れをふり返ります。**対角線を2通りに表す → $\\cos A$ → 対角線 → 面積・半径**。$\\cos C=-\\cos A$ がすべての出発点でした。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '流れ', text: '対角線を2通りに → $\\cos A$ → 対角線 → 面積・半径' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角比を **空間図形**（測量や立体の切り口）に使います。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
