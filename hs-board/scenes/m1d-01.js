/* 数学Ⅰ 第4章 図形と計量 三角比 ①：三角比の定義 ― sin・cos・tan
   例はすべて自作（相似の例 5・12・13 と 10・24・26、例題 8・15・17、2辺から 4・3・√7）。値は python3（sympy）で検算ずみ。
   図の三角形は、どれも C を直角の頂点、A に角 θ を置く（向きを変えた三角形だけ、Q に θ）。 */
(function () {
  const POINTS = [
    '直角三角形で角 $\\theta$ から見て、**斜辺**（直角の向かい）・**対辺**（$\\theta$ の向かい）・**隣辺**（$\\theta$ のとなり）を先に決める',
    '$\\sin\\theta=\\dfrac{\\text{対辺}}{\\text{斜辺}}$、$\\cos\\theta=\\dfrac{\\text{隣辺}}{\\text{斜辺}}$、$\\tan\\theta=\\dfrac{\\text{対辺}}{\\text{隣辺}}$。三角形は相似なので、大きさによらず $\\theta$ だけで決まる',
    '辺が足りないときは **三平方の定理** で出してから比をつくる。見る角が変わると、対辺と隣辺が入れかわる'
  ];
  // 直角三角形 A(0,0)・C(w,0)・B(w,h)。辺の色：斜辺 AB＝黄、対辺 BC＝桃、隣辺 CA＝青
  const tri = (w, h, o) => {
    o = o || {};
    const A = [0, 0], C = [w, 0], B = [w, h], items = [
      { k: 'poly', pts: [A, C, B], close: true, fill: 'w', alpha: 0.05, noStroke: true },
      { k: 'seg', a: A, b: B, c: o.mono ? 'w' : 'y', wd: 4 }, { k: 'seg', a: B, b: C, c: o.mono ? 'w' : 'p', wd: 4 }, { k: 'seg', a: C, b: A, c: o.mono ? 'w' : 'b', wd: 4 },
      { k: 'right', o: C, a: A, b: B, s: 20 },
      { k: 'angle', o: A, a: C, b: B, rp: o.rp || 46, label: o.th || 'θ', size: 26 }];
    if (o.names !== false) items.push({ k: 'pt', at: A, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'ne', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'se', r: 4 });
    return items;
  };
  const sideLab = (w, h, s, t, r, o) => {   // 斜辺・対辺・隣辺の名前（または長さ）。s＝斜辺、t＝対辺、r＝隣辺
    o = o || {};
    const k = Math.hypot(w, h), nx = -h / k, ny = w / k, d = o.d || 0.55;
    return [
      { k: 'label', at: [w / 2 + nx * d, h / 2 + ny * d], text: s, c: 'y', size: o.size || 26 },
      { k: 'label', at: [w, h / 2], text: t, c: 'p', size: o.size || 26, anchor: 'start', dx: 18 },
      { k: 'label', at: [w / 2, 0], text: r, c: 'b', size: o.size || 26, dy: 30 }];
  };

  HB.lesson({
    id: 'm1d-01', field: '数学Ⅰ　図形と計量', title: '三角比の定義 ― sin・cos・tan', level: '三角比', time: '目安 7分',
    problem: { label: '例題', lead: '$\\angle C=90^\\circ$ の直角三角形 ABC について',
      parts: ['(1)　$AB=17,\\ BC=8,\\ CA=15$ のとき、$\\sin A,\\ \\cos A,\\ \\tan A$', '(2)　$AB=4,\\ CA=3$ のとき、$\\sin A,\\ \\cos A,\\ \\tan A$', '(3)　(2) の三角形で、$\\sin B$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: 'ここから「図形と計量」です。中学で学んだ **相似** と **三平方の定理** を使って、角の大きさと辺の比を結びつける **三角比** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '直角三角形で、角 $\\theta$ に対する $\\sin\\theta,\\ \\cos\\theta,\\ \\tan\\theta$ を言える\n3辺の長さから、三角比の値を求められる' }] },

      // ---------- 辺の名前 ----------
      { clear: true, part: '辺の名前', say: '直角三角形で、直角でない角の1つを $\\theta$（シータ）とします。直角に向かい合う、いちばん長い辺が **斜辺** です。',
        add: [{ t: 'h', text: '直角三角形の辺の名前' },
          { t: 'p', size: 'sm', text: '[[y:**斜辺**]]：直角に向かい合う辺（いちばん長い）' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.1, -1.1, 7.1, 4.1], w: 560, h: 355, items: tri(5, 3) }] },
      { say: '角 $\\theta$ に向かい合う辺が **対辺**、$\\theta$ をはさむ辺のうち斜辺でないほうが **隣辺** です。辺の名前は「どの角から見るか」で決まります。',
        add: [{ t: 'p', size: 'sm', text: '{{**対辺**}}：角 $\\theta$ に向かい合う辺\n[[b:**隣辺**]]：$\\theta$ をはさむ辺のうち、斜辺でない辺' }],
        draw: [{ fig: 'f1', items: sideLab(5, 3, '斜辺', '対辺', '隣辺') }] },
      { clear: true, part: '向きが変わっても', say: '三角形の向きが変わっても、辺の名前の決め方は同じです。直角三角形 PQR（$\\angle R=90^\\circ$）で、Q の角を $\\theta$ とします。',
        add: [{ t: 'h', text: '向きを変えた直角三角形' },
          { t: 'p', size: 'sm', text: '$\\angle R=90^\\circ$、角 $\\theta$ は Q の角\n斜辺は、直角 R に向かい合う $PQ$' },
          { t: 'fig', id: 'f2', col: 1, view: [-0.9, -0.8, 6.9, 3.4], w: 600, h: 323, items: [
            { k: 'poly', pts: [[0, 0], [6, 0], [1.5, 2.598]], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: [0, 0], b: [6, 0], c: 'y', wd: 4 },
            { k: 'right', o: [1.5, 2.598], a: [0, 0], b: [6, 0], s: 20 },
            { k: 'angle', o: [6, 0], a: [0, 0], b: [1.5, 2.598], rp: 52, label: 'θ', size: 26 },
            { k: 'pt', at: [0, 0], name: 'P', dir: 'sw', r: 4 }, { k: 'pt', at: [6, 0], name: 'Q', dir: 'se', r: 4 }, { k: 'pt', at: [1.5, 2.598], name: 'R', dir: 'n', r: 4 }] }] },
      { ask: { type: 'choice', q: '直角三角形 PQR で、**Q の角 $\\theta$ の対辺** はどれ？',
        opts: ['$QR$', '$PQ$', '$PR$', '対辺はない'], ok: 2,
        why: { 0: '$QR$ は $\\theta$ をはさむ辺（隣辺）です。', 1: '$PQ$ は直角に向かい合う辺で、斜辺です。', 3: '直角でない角には、いつも向かい合う辺（対辺）があります。' },
        good: 'Q に向かい合うのは $PR$。向きが変わっても「角の向かい」で決めます。',
        add: [{ t: 'p', size: 'sm', text: 'Q の角から見て\n[[y:斜辺]] $PQ$、{{対辺}} $PR$、[[b:隣辺]] $QR$' }],
        draw: [{ fig: 'f2', items: [{ k: 'seg', a: [0, 0], b: [1.5, 2.598], c: 'p', wd: 5 }, { k: 'seg', a: [6, 0], b: [1.5, 2.598], c: 'b', wd: 5 }] }] } },

      // ---------- 辺の比 ----------
      { clear: true, cols: [0.6, 0.4], part: '辺の比', say: '$\\theta$ が同じ直角三角形は、大きさがちがっても **相似** です（2つの角が等しい）。だから、対応する辺の **比** は等しくなります。',
        add: [{ t: 'h', text: '大きさによらない比' },
          { t: 'fig', id: 'f3', view: [-0.8, -1.2, 18.2, 5.6], w: 860, h: 308, items:
            tri(4.8, 2, { names: false, rp: 44 }).concat(sideLab(4.8, 2, '13', '5', '12', { d: 0.5, size: 28 }),
              tri(9.6, 4, { names: false, rp: 44 }).map(p => Object.assign({}, p, shift(p, 7.6))),
              sideLab(9.6, 4, '26', '10', '24', { d: 0.5, size: 28 }).map(p => Object.assign({}, p, { at: [p.at[0] + 7.6, p.at[1]] }))) },
          { t: 'm', col: 1, tex: '\\frac{\\ans{5}}{\\hy{13}}=\\frac{\\ans{10}}{\\hy{26}}', note: '対辺 ÷ 斜辺' }] },
      { say: 'ほかの組み合わせ、隣辺÷斜辺や対辺÷隣辺も同じです。この3つの比は **角 $\\theta$ の大きさだけ** で決まります。これを **三角比** といいます。',
        add: [{ t: 'm', col: 1, style: 'margin-top:14px', tex: '\\frac{\\hb{12}}{\\hy{13}}=\\frac{\\hb{24}}{\\hy{26}}', note: '隣辺 ÷ 斜辺' },
          { t: 'm', col: 1, style: 'margin-top:14px', tex: '\\frac{\\ans{5}}{\\hb{12}}=\\frac{\\ans{10}}{\\hb{24}}', note: '対辺 ÷ 隣辺' },
          { t: 'box', c: 'b', label: 'わかったこと', text: '直角三角形の辺の比は、三角形の **大きさによらず**、角 $\\theta$ だけで決まる' }] },

      // ---------- 定義 ----------
      { clear: true, part: '三角比の定義', say: '3つの比に名前をつけます。対辺÷斜辺が **正弦** $\\sin\\theta$、隣辺÷斜辺が **余弦** $\\cos\\theta$、対辺÷隣辺が **正接** $\\tan\\theta$ です。',
        add: [{ t: 'h', text: '三角比（$\\theta$ は鋭角）' },
          { t: 'm', tex: '\\sin\\theta=\\frac{\\ans{\\text{対辺}}}{\\hy{\\text{斜辺}}}=\\frac{a}{c}', note: '正弦（サイン）' },
          { t: 'm', style: 'margin-top:10px', tex: '\\cos\\theta=\\frac{\\hb{\\text{隣辺}}}{\\hy{\\text{斜辺}}}=\\frac{b}{c}', note: '余弦（コサイン）' },
          { t: 'm', style: 'margin-top:10px', tex: '\\tan\\theta=\\frac{\\ans{\\text{対辺}}}{\\hb{\\text{隣辺}}}=\\frac{a}{b}', note: '正接（タンジェント）' },
          { t: 'fig', id: 'f4', col: 1, view: [-1.1, -1.1, 7.1, 4.1], w: 560, h: 355, items: tri(5, 3).concat(sideLab(5, 3, 'c', 'a', 'b', { size: 30 })) },
          { t: 'p', col: 1, size: 'xs', text: '$\\sin$・$\\cos$ は **斜辺** が分母、$\\tan$ は **隣辺** が分母' }] },
      { ask: { type: 'choice', q: '$\\theta$ が鋭角のとき、$\\sin\\theta$ の値について正しいのは？',
        opts: ['1 より大きくなることがある', '負の数になることがある', '0 より大きく 1 より小さい', 'ちょうど 1 になることがある'], ok: 2,
        why: { 0: '分母の斜辺は、いちばん長い辺。分子の対辺より長いので、1 より小さくなります。', 1: '辺の長さはどれも正。正÷正は正です。', 3: '対辺と斜辺が同じ長さの直角三角形はありません。' },
        good: '$0<\\sin\\theta<1$。$\\cos\\theta$ も同じです。$\\tan\\theta$ は隣辺が分母なので、1 より大きくもなります。',
        add: [{ t: 'p', size: 'sm', text: '$0<\\sin\\theta<1,\\quad 0<\\cos\\theta<1,\\quad \\tan\\theta>0$' }] } },

      // ---------- 例題1 ----------
      { clear: true, part: '例題1', say: '例題です。$\\angle C=90^\\circ$、$AB=17,\\ BC=8,\\ CA=15$ の直角三角形で、$\\sin A,\\ \\cos A,\\ \\tan A$ を求めます。まず A から見た辺の名前を決めます。',
        add: [{ t: 'h', text: '例題1　$\\sin A,\\ \\cos A,\\ \\tan A$ を求める' },
          { t: 'p', size: 'sm', text: 'A から見て\n[[y:斜辺]] $AB=17$、{{対辺}} $BC=8$、[[b:隣辺]] $CA=15$' },
          { t: 'fig', id: 'f5', col: 1, view: [-2.2, -2.6, 19.4, 10.6], w: 560, h: 342, items: tri(15, 8, { rp: 58 }).concat(sideLab(15, 8, '17', '8', '15', { d: 1.3, size: 28 })) }] },
      { ask: { type: 'choice', q: '$\\sin A$ の値は？',
        opts: ['$\\dfrac{15}{17}$', '$\\dfrac{8}{15}$', '$\\dfrac{17}{8}$', '$\\dfrac{8}{17}$'], ok: 3,
        why: { 0: 'それは隣辺÷斜辺で $\\cos A$。sin の分子は **対辺** です。', 1: 'それは対辺÷隣辺で $\\tan A$。sin の分母は **斜辺** です。', 2: '分母と分子が逆です。斜辺が分母なので、sin は 1 より小さくなります。' },
        good: '$\\sin A=\\dfrac{\\text{対辺}}{\\text{斜辺}}=\\dfrac{8}{17}$。',
        add: [{ t: 'm', tex: '\\sin A=\\frac{BC}{AB}=\\ans{\\frac{8}{17}}' }] } },
      { say: '残りも同じように。$\\cos A$ は隣辺÷斜辺、$\\tan A$ は対辺÷隣辺です。分母に何を置くかを、毎回 図で確かめましょう。',
        add: [{ t: 'm', style: 'margin-top:8px', tex: '\\cos A=\\frac{CA}{AB}=\\ans{\\frac{15}{17}}' }, { t: 'm', style: 'margin-top:8px', tex: '\\tan A=\\frac{BC}{CA}=\\ans{\\frac{8}{15}}' }] },

      // ---------- 例題2 ----------
      { clear: true, part: '例題2', say: '次は、2辺しかわからないとき。$\\angle C=90^\\circ$、$AB=4$、$CA=3$ です。残りの辺 $BC$ を **三平方の定理** で求めてから、比をつくります。',
        add: [{ t: 'h', text: '例題2　2辺から三角比を求める' },
          { t: 'm', tex: 'BC^2+3^2=4^2', note: '三平方の定理' },
          { t: 'm', tex: 'BC^2=7,\\quad BC>0\\ \\text{より}\\ BC=\\sqrt7' },
          { t: 'fig', id: 'f6', col: 1, view: [-1.1, -1.0, 4.9, 3.5], w: 520, h: 390, items: tri(3, Math.sqrt(7), { rp: 62 }).concat(sideLab(3, Math.sqrt(7), '4', '√7', '3', { d: 0.45, size: 30 })) }] },
      { ask: { type: 'think', q: 'この三角形で、$\\sin A,\\ \\cos A,\\ \\tan A$ を求めよう。',
        hint: 'A から見て、斜辺 4、対辺 $\\sqrt7$、隣辺 3。',
        ans: '$\\sin A=\\dfrac{\\sqrt7}{4},\\ \\ \\cos A=\\dfrac34,\\ \\ \\tan A=\\dfrac{\\sqrt7}{3}$',
        after: '辺の長さに根号が出ても、比のつくり方は同じです。',
        add: [{ t: 'm', tex: '\\sin A=\\ans{\\frac{\\sqrt7}{4}},\\quad \\cos A=\\ans{\\frac34},\\quad \\tan A=\\ans{\\frac{\\sqrt7}{3}}' }] } },
      { ask: { type: 'choice', q: '同じ三角形で、**角 B** の三角比 $\\sin B$ は？',
        opts: ['$\\dfrac34$', '$\\dfrac{\\sqrt7}{4}$', '$\\dfrac{3}{\\sqrt7}$', '$\\dfrac{\\sqrt7}{3}$'], ok: 0,
        why: { 1: 'それは $\\sin A$。角 B から見ると、対辺は $CA=3$ に変わります。', 2: 'それは $\\tan B$（対辺÷隣辺）。sin の分母は斜辺です。', 3: 'それは $\\tan A$。角 B の対辺は $CA$ です。' },
        good: '角 B の対辺は $CA=3$、斜辺は $AB=4$ なので $\\sin B=\\dfrac34$（$\\cos A$ と同じ値）。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin B=\\frac{CA}{AB}=\\ans{\\frac34}', note: 'B から見ると\n対辺と隣辺が入れかわる' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、$30^\\circ,\\ 45^\\circ,\\ 60^\\circ$ の三角比の値と、三角比の表の使い方を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
  function shift(p, dx) {   // 図の部品を右へ dx ずらす（2つめの三角形用）
    const m = a => [a[0] + dx, a[1]], q = {};
    if (p.pts) q.pts = p.pts.map(m);
    ['a', 'b', 'o', 'at'].forEach(k => { if (p[k]) q[k] = m(p[k]); });
    return q;
  }
})();
