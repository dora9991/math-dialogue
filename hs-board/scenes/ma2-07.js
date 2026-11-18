/* 数学A 第2章 図形の性質 円の性質 ①：円周角の定理と円に内接する四角形
   例はすべて自作（中心角 110° → 円周角 55°／AB が直径、∠CAB=32° → ∠ABC=∠ADC=58°／
   内接四角形 ∠BAD=78° → ∠BCD=102°、外角 ∠DCE=78°／∠BOD=140° → ∠BAD=70°、∠BCD=110°）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。図の点は、どれも半径 3 の円の上に、その角になる位置（中心角）でとっている。 */
(function () {
  const POINTS = [
    '**円周角の定理**：1つの弧に対する円周角は、その弧に対する中心角の **半分**。同じ弧に対する円周角は等しい。直径に対する円周角は $90^\\circ$',
    '**円周角の定理の逆**：2点 P, Q が直線 AB について **同じ側** にあり、$\\angle\\mathrm{APB}=\\angle\\mathrm{AQB}$ ならば、4点 A, B, P, Q は1つの円周上にある',
    '円に内接する四角形は **対角の和が $180^\\circ$**、**外角はその内対角に等しい**。逆に、どちらかが成り立つ四角形は円に内接する'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const DIR8 = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'];
  const out8 = d => DIR8[((Math.round(d / 45) % 8) + 8) % 8];   // 円の上の点の名前は、中心と反対の向きに
  const O = [0, 0], R = 3;
  const cp = (name, d, c) => ({ k: 'pt', at: on(O, R, d), name, dir: out8(d), r: 4, c: c || 'w' });
  const circ = () => [{ k: 'circle', o: O, r: R, c: 'd' }];

  // 図1：円周角の定理。A 215°・B 325°（下の弧 AB の中心角 110°）、P 105°・Q 55°（上の弧）
  const A1 = on(O, R, 215), B1 = on(O, R, 325), P1 = on(O, R, 105), Q1 = on(O, R, 55);
  // 図2：直径。A 180°・B 0°、C 64°（∠CAB=32°）、D 240°（C と反対側の弧）
  const A2 = on(O, R, 180), B2 = on(O, R, 0), C2 = on(O, R, 64), D2 = on(O, R, 240);
  // 図3：定理の逆。A 205°・B 335°、P 115°・Q 60°（同じ側）。円はあとから点線で
  const A3 = on(O, R, 205), B3 = on(O, R, 335), P3 = on(O, R, 115), Q3 = on(O, R, 60);
  // 図4：内接四角形。A 210°・B 310°・C 20°・D 106°（弧 AB 100°・BC 70°・CD 86°・DA 104°）→ ∠BAD=78°、∠ABC=95°、∠BCD=102°、∠CDA=85°
  const A4 = on(O, R, 210), B4 = on(O, R, 310), C4 = on(O, R, 20), D4 = on(O, R, 106);
  const uBC = [(C4[0] - B4[0]) / Math.hypot(C4[0] - B4[0], C4[1] - B4[1]), (C4[1] - B4[1]) / Math.hypot(C4[0] - B4[0], C4[1] - B4[1])];
  const E4 = [C4[0] + 2.0 * uBC[0], C4[1] + 2.0 * uBC[1]];
  // 図5：考えてみよう。B 300°・D 80°（C 側の弧の中心角 140°）、C 15°、A 200°
  const A5 = on(O, R, 200), B5 = on(O, R, 300), C5 = on(O, R, 15), D5 = on(O, R, 80);

  HB.lesson({
    id: 'ma2-07', field: '数学A　図形の性質', title: '円周角の定理と円に内接する四角形', level: '円の性質', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　円 O で、弧 AB に対する中心角が $110^\\circ$ のとき、弧 AB に対する円周角を求めよ。',
        '(2)　AB が直径の円で、$\\angle\\mathrm{CAB}=32^\\circ$ のとき、$\\angle\\mathrm{ADC}$ を求めよ（D は C と反対側の弧の上）。',
        '(3)　円に内接する四角形 ABCD で $\\angle\\mathrm{BAD}=78^\\circ$ のとき、$\\angle\\mathrm{BCD}$ と、外角 $\\angle\\mathrm{DCE}$ を求めよ。',
        '(4)　円 O に内接する四角形 ABCD で $\\angle\\mathrm{BOD}=140^\\circ$ のとき、$\\angle\\mathrm{BAD}$ と $\\angle\\mathrm{BCD}$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'ここから「円の性質」です。中学で学んだ **円周角の定理** をふり返り、その **逆** と、**円に内接する四角形** の性質へ進みます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '円周角の定理とその逆を使って、**角の大きさ** を求めたり、**4点が1つの円周上にあるか** を判定したりできる' }] },

      // ---------- 円周角の定理 ----------
      { clear: true, part: '円周角の定理', say: '円 O の弧 AB の上にない点 P を円周上にとるとき、$\\angle\\mathrm{APB}$ を弧 AB に対する **円周角**、$\\angle\\mathrm{AOB}$ を **中心角** といいます。',
        add: [{ t: 'h', text: '円周角と中心角' },
          { t: 'p', text: '弧 AB に対する\n　円周角 $\\angle\\mathrm{APB}$（[[y:黄]]）\n　中心角 $\\angle\\mathrm{AOB}$（[[b:青]]）' },
          { t: 'fig', id: 'f1', col: 1, view: [-4.3, -4.2, 4.3, 4.2], w: 530, h: 518, items: circ().concat([
            { k: 'arc', o: O, r: R, a1: 215, a2: 325, c: 'b', wd: 6 },
            { k: 'seg', a: O, b: A1, c: 'b' }, { k: 'seg', a: O, b: B1, c: 'b' },
            { k: 'seg', a: P1, b: A1 }, { k: 'seg', a: P1, b: B1 },
            { k: 'angle', o: O, a: A1, b: B1, rp: 30, c: 'b' }, { k: 'angle', o: P1, a: A1, b: B1, rp: 44, c: 'y' },
            { k: 'pt', at: O, name: 'O', dir: 'n', r: 4, c: 'b' }, cp('A', 215), cp('B', 325), cp('P', 105, 'y')]) }] },
      { say: '**円周角の定理**：1つの弧に対する円周角は、中心角の **半分**。だから、同じ弧に対する円周角は、点をどこにとっても等しくなります。',
        add: [{ t: 'box', c: 'y', label: '円周角の定理', text: '$\\angle\\mathrm{APB}=\\dfrac12\\angle\\mathrm{AOB}$\n同じ弧に対する円周角は等しい\n$\\angle\\mathrm{APB}=\\angle\\mathrm{AQB}$' }],
        draw: [{ fig: 'f1', items: [{ k: 'seg', a: Q1, b: A1 }, { k: 'seg', a: Q1, b: B1 }, { k: 'angle', o: Q1, a: A1, b: B1, rp: 44, c: 'y' }, cp('Q', 55, 'y')] }] },
      { ask: { type: 'choice', q: '図で $\\angle\\mathrm{AOB}=110^\\circ$ のとき、$\\angle\\mathrm{AQB}$ は？',
        opts: ['$110^\\circ$', '$55^\\circ$', '$70^\\circ$', '$125^\\circ$'], ok: 1,
        why: { 0: '円周角は中心角と同じではなく、中心角の半分です。', 2: '$180^\\circ-110^\\circ$ を計算しています。円周角は中心角の半分です。', 3: '$125^\\circ$ は、下の小さい弧の上に点をとったときの角。Q は上の弧の上です。' },
        good: 'Q も弧 AB に対する円周角なので、中心角の半分の $55^\\circ$。P から見ても同じ $55^\\circ$ です。',
        draw: [{ fig: 'f1', items: [
          { k: 'angle', o: O, a: A1, b: B1, rp: 30, c: 'b', label: '110°', lr: 24 },
          { k: 'angle', o: P1, a: A1, b: B1, rp: 44, c: 'y', label: '55°', lr: 24 }, { k: 'angle', o: Q1, a: A1, b: B1, rp: 44, c: 'y', label: '55°', lr: 24 }] }] } },

      // ---------- 直径と円周角 ----------
      { clear: true, part: '直径と円周角', say: '弧が半円のとき、中心角は $180^\\circ$。だから **直径に対する円周角は $90^\\circ$** です。これを使う例題をやってみます。',
        add: [{ t: 'h', text: '直径に対する円周角' },
          { t: 'box', c: 'b', label: '直径', text: '直径に対する円周角は $90^\\circ$' },
          { t: 'p', size: 'sm', text: '**例題1**　AB は円の直径。$\\angle\\mathrm{CAB}=32^\\circ$ のとき、$\\angle\\mathrm{ADC}$ を求めよ。' },
          { t: 'fig', id: 'f2', col: 1, view: [-4.3, -4.2, 4.3, 4.2], w: 530, h: 518, items: circ().concat([
            { k: 'seg', a: A2, b: B2, c: 'd' }, { k: 'seg', a: A2, b: C2 }, { k: 'seg', a: C2, b: B2 },
            { k: 'seg', a: A2, b: D2 }, { k: 'seg', a: D2, b: C2 },
            { k: 'right', o: C2, a: A2, b: B2, s: 18, c: 'y' },
            { k: 'angle', o: A2, a: B2, b: C2, rp: 56, c: 'p', label: '32°', lr: 26 },
            { k: 'pt', at: O, name: 'O', dir: 's', r: 4, c: 'd' }, cp('A', 180), cp('B', 0), cp('C', 64), cp('D', 240)]) }] },
      { say: 'AB は直径なので $\\angle\\mathrm{ACB}=90^\\circ$。△ABC の内角の和から、$\\angle\\mathrm{ABC}=58^\\circ$ です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{ACB}=90^\\circ', note: '直径に対する円周角' },
          { t: 'm', tex: '\\angle\\mathrm{ABC}=180^\\circ-(90^\\circ+32^\\circ)=58^\\circ' }],
        draw: [{ fig: 'f2', items: [{ k: 'angle', o: B2, a: C2, b: A2, rp: 44, c: 'b', label: '58°', lr: 24 }] }] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{ADC}$ と大きさが等しい角は？',
        opts: ['$\\angle\\mathrm{CAB}$', '$\\angle\\mathrm{ACB}$', '$\\angle\\mathrm{BCD}$', '$\\angle\\mathrm{ABC}$'], ok: 3,
        why: { 0: '$\\angle\\mathrm{CAB}$ は弧 BC に対する円周角。$\\angle\\mathrm{ADC}$ は弧 AC に対する円周角です。', 1: '$\\angle\\mathrm{ACB}$ は直径 AB に対する円周角で $90^\\circ$。弧がちがいます。', 2: '$\\angle\\mathrm{BCD}$ は弧 BD に対する円周角。弧 AC ではありません。' },
        good: 'どちらも **弧 AC に対する円周角** なので等しい。$\\angle\\mathrm{ADC}=58^\\circ$ です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{ADC}=\\angle\\mathrm{ABC}=\\ans{58^\\circ}', note: '弧 AC に対する円周角' }],
        draw: [{ fig: 'f2', items: [{ k: 'arc', o: O, r: R, a1: 64, a2: 180, c: 'p', wd: 6 }, { k: 'angle', o: D2, a: A2, b: C2, rp: 44, c: 'b', label: '58°', lr: 24 }] }] } },

      // ---------- 定理の逆 ----------
      { clear: true, part: '円周角の定理の逆', say: '円周角の定理は、**逆** も成り立ちます。直線 AB の同じ側から、同じ角で AB を見る2点は、A, B と1つの円の上にあります。',
        add: [{ t: 'h', text: '円周角の定理の逆' },
          { t: 'box', c: 'y', label: '定理の逆', text: '2点 P, Q が直線 AB について **同じ側** にあり\n$\\angle\\mathrm{APB}=\\angle\\mathrm{AQB}$ ならば\n4点 A, B, P, Q は1つの円周上にある' },
          { t: 'p', size: 'sm', text: '4点が1つの円周上にあるとわかれば、\nその円で **円周角の定理** が使える' },
          { t: 'fig', id: 'f3', col: 1, view: [-4.3, -3.6, 4.3, 4.2], w: 500, h: 453, items: [
            { k: 'seg', a: A3, b: B3, c: 'w', wd: 4 },
            { k: 'seg', a: P3, b: A3 }, { k: 'seg', a: P3, b: B3 }, { k: 'seg', a: Q3, b: A3 }, { k: 'seg', a: Q3, b: B3 },
            { k: 'angle', o: P3, a: A3, b: B3, rp: 40, c: 'y' }, { k: 'angle', o: Q3, a: A3, b: B3, rp: 40, c: 'y' },
            { k: 'pt', at: A3, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: B3, name: 'B', dir: 'se', r: 4 },
            { k: 'pt', at: P3, name: 'P', dir: 'nw', r: 4, c: 'y' }, { k: 'pt', at: Q3, name: 'Q', dir: 'ne', r: 4, c: 'y' }] }],
        draw: [{ fig: 'f3', items: [{ k: 'circle', o: O, r: R, c: 'b', dash: true }] }] },
      { ask: { type: 'choice', q: 'へこみのない四角形 ABCD で、4点 A, B, C, D が1つの円周上にあると **いえる** のは？',
        opts: ['$\\angle\\mathrm{BAC}=\\angle\\mathrm{BDC}$', '$\\angle\\mathrm{BAC}=\\angle\\mathrm{ACD}$', '$\\angle\\mathrm{ABC}=\\angle\\mathrm{ADC}$', '$\\angle\\mathrm{A}+\\angle\\mathrm{B}=180^\\circ$'], ok: 0,
        why: { 1: '錯角が等しいので、AB ∥ DC がいえるだけです。', 2: '平行四辺形も向かい合う角が等しい。必要なのは対角の **和** が $180^\\circ$。', 3: 'となり合う角の和が $180^\\circ$ なので、AD ∥ BC がいえるだけです。' },
        good: 'A と D は直線 BC の同じ側から、BC を同じ角で見ています（円周角の定理の逆）。' } },

      // ---------- 内接する四角形 ----------
      { clear: true, part: '円に内接する四角形', say: '四角形の4つの頂点が1つの円周上にあるとき、四角形は円に **内接する** といいます。円に内接する四角形には、角について2つの性質があります。',
        add: [{ t: 'h', text: '円に内接する四角形の性質' },
          { t: 'box', c: 'y', label: '性質', text: '(1)　対角の和は $180^\\circ$\n(2)　外角は、その **内対角** に等しい' },
          { t: 'fig', id: 'f4', col: 1, view: [-4.3, -4.0, 5.1, 4.2], w: 560, h: 489, items: circ().concat([
            { k: 'poly', pts: [A4, B4, C4, D4], close: true, fill: 'w', alpha: 0.05 },
            cp('A', 210), cp('B', 310), cp('C', 20), cp('D', 106)]) }] },
      { say: 'わけ：$\\angle\\mathrm{A}$ と $\\angle\\mathrm{C}$ は、弦 BD の両側の弧に対する円周角です。2つの弧の中心角の和は $360^\\circ$ なので、円周角の和は $180^\\circ$。',
        add: [{ t: 'p', size: 'sm', text: '$\\angle\\mathrm{A}$ と $\\angle\\mathrm{C}$ は、弦 BD の **両側の弧** に対する円周角\n→ 中心角の和 $360^\\circ$ の半分で $\\angle\\mathrm{A}+\\angle\\mathrm{C}=180^\\circ$' }],
        draw: [{ fig: 'f4', items: [{ k: 'seg', a: B4, b: D4, c: 'y', dash: true },
          { k: 'angle', o: A4, a: B4, b: D4, rp: 46, c: 'p' }, { k: 'angle', o: C4, a: D4, b: B4, rp: 34, c: 'b' }] }] },
      { ask: { type: 'choice', q: '図で $\\angle\\mathrm{BAD}=78^\\circ$ のとき、$\\angle\\mathrm{BCD}$ は？',
        opts: ['$78^\\circ$', '$156^\\circ$', '$102^\\circ$', '$12^\\circ$'], ok: 2,
        why: { 0: '$78^\\circ$ になるのは外角 $\\angle\\mathrm{DCE}$。内角 $\\angle\\mathrm{BCD}$ は、対角との和が $180^\\circ$ です。', 1: '$156^\\circ$ は弧 BCD に対する中心角。$\\angle\\mathrm{BCD}$ は対角との和で考えます。', 3: '対角の和は $90^\\circ$ ではなく $180^\\circ$ です。' },
        good: '対角の和が $180^\\circ$ なので、$\\angle\\mathrm{BCD}=180^\\circ-78^\\circ=102^\\circ$。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{BCD}=180^\\circ-78^\\circ=102^\\circ', note: '対角の和' }],
        draw: [{ fig: 'f4', items: [{ k: 'label', at: A4, text: '78°', c: 'p', size: 22, dx: 64, dy: -22 }, { k: 'label', at: C4, text: '102°', c: 'b', size: 22, dx: -62, dy: 14 }] }] } },
      { say: '辺 BC を C の先へのばした点を E とします。外角 $\\angle\\mathrm{DCE}=180^\\circ-102^\\circ=78^\\circ$ で、**内対角** $\\angle\\mathrm{BAD}$ と等しくなります。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{DCE}=180^\\circ-\\angle\\mathrm{BCD}=\\angle\\mathrm{BAD}', note: '外角＝内対角' }],
        draw: [{ fig: 'f4', items: [{ k: 'seg', a: C4, b: E4 }, { k: 'pt', at: E4, name: 'E', dir: 'e', r: 4 },
          { k: 'angle', o: C4, a: D4, b: E4, rp: 30, c: 'p', label: '78°', lr: 22 }] }] },
      { say: 'この性質も、**逆** が成り立ちます。対角の和が $180^\\circ$、または外角が内対角に等しい四角形は、円に内接します。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '逆', text: '対角の和が $180^\\circ$（または 外角＝内対角）の四角形は、円に内接する' }] },

      // ---------- 考えてみよう ----------
      { clear: true, part: '中心角と組み合わせる', say: '最後に、中心角と組み合わせた問題です。円 O に内接する四角形 ABCD で、$\\angle\\mathrm{BOD}=140^\\circ$（C の側の中心角）です。',
        add: [{ t: 'h', text: '中心角と内接四角形' },
          { t: 'p', text: '円 O に内接する四角形 ABCD\n$\\angle\\mathrm{BOD}=140^\\circ$\n$\\angle\\mathrm{BAD}$ と $\\angle\\mathrm{BCD}$ は？' },
          { t: 'fig', id: 'f5', col: 1, view: [-4.3, -4.2, 4.3, 4.2], w: 530, h: 518, items: circ().concat([
            { k: 'poly', pts: [A5, B5, C5, D5], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: O, b: B5, c: 'b' }, { k: 'seg', a: O, b: D5, c: 'b' },
            { k: 'angle', o: O, a: B5, b: D5, rp: 30, c: 'b', label: '140°', lr: 30 },
            { k: 'pt', at: O, name: 'O', dir: 'w', r: 4, c: 'b' }, cp('A', 200), cp('B', 300), cp('C', 15), cp('D', 80)]) }] },
      { ask: { type: 'think', q: '$\\angle\\mathrm{BOD}=140^\\circ$ のとき、$\\angle\\mathrm{BAD}$ と $\\angle\\mathrm{BCD}$ を求めよう。',
        hint: '$\\angle\\mathrm{BAD}$ は、C をふくむ弧 BD に対する円周角。そのあと対角の和を使う。',
        ans: '$\\angle\\mathrm{BAD}=\\dfrac12\\cdot140^\\circ=70^\\circ$、$\\angle\\mathrm{BCD}=180^\\circ-70^\\circ=110^\\circ$',
        after: '$\\angle\\mathrm{BCD}$ は、A をふくむ弧に対する中心角 $360^\\circ-140^\\circ=220^\\circ$ の半分としても求められます。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{BAD}=\\frac12\\angle\\mathrm{BOD}=70^\\circ', note: '円周角の定理' },
          { t: 'm', tex: '\\angle\\mathrm{BCD}=180^\\circ-70^\\circ=110^\\circ', note: '対角の和' },
          { t: 'ans', label: '答', tex: '\\angle\\mathrm{BAD}=70^\\circ,\\quad \\angle\\mathrm{BCD}=110^\\circ' }],
        draw: [{ fig: 'f5', items: [{ k: 'angle', o: A5, a: B5, b: D5, rp: 50, c: 'y', label: '70°', lr: 26 }, { k: 'angle', o: C5, a: D5, b: B5, rp: 30, c: 'p', label: '110°', lr: 30 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、円と **接線** の性質と、接線と弦がつくる角の **接弦定理** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
