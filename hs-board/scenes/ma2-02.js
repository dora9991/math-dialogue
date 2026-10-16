/* 数学A 第2章 図形の性質 三角形の性質 ②：角の二等分線と比
   例はすべて自作（AB=8, AC=6, BC=7 → BD=4／AB=9, AC=6, BD=3 → BC=5／
   外角 AB=8, AC=4, BC=6 → CE=6, BE=12, DE=8, ∠DAE=90°）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。三角形の図は、その数値どおりの形でかいている。 */
(function () {
  const POINTS = [
    '**内角の二等分線**：∠A の二等分線と辺 BC の交点 D → BD : DC $=$ AB : AC（D は BC を AB : AC に **内分**）',
    '証明は、C を通り AD に平行な直線を引く → 同位角・錯角で **二等辺三角形**（AE $=$ AC）→ 平行線と線分の比',
    '**外角の二等分線**：辺 BC の延長との交点 E → BE : EC $=$ AB : AC（E は BC を AB : AC に **外分**。AB≠AC のとき）'
  ];
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];

  // 図1：AB=8, AC=6, BC=7。B(0,0) C(7,0) A(11/2, √(135/4))。D(4,0)（BD:DC=4:3）。E は BA の延長上で AE=AC=6
  const A = [5.5, Math.sqrt(135 / 4)], B = [0, 0], C = [7, 0], D = [4, 0], E = [5.5 * 1.75, Math.sqrt(135 / 4) * 1.75], G = G3(A, B, C);
  const tri = (extra) => [
    { k: 'poly', pts: [A, B, C], close: true, fill: 'w', alpha: 0.05 },
    { k: 'seg', a: A, b: D, c: 'y', wd: 3.5 },
    { k: 'angle', o: A, a: B, b: D, rp: 40, c: 'y' }, { k: 'angle', o: A, a: D, b: C, rp: 46, c: 'y' }
  ].concat(extra || [], [
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'se', r: 4 },
    { k: 'pt', at: D, name: 'D', dir: 's', r: 4, c: 'y' }]);

  // 図3：外角。AB=8, AC=4, BC=6。B(0,0) C(6,0) A(7,√15)。内分点 D(4,0)、外分点 E(12,0)。F は BA の延長上
  const r15 = Math.sqrt(15), xA = [7, r15], xB = [0, 0], xC = [6, 0], xD = [4, 0], xE = [12, 0], xF = [7 * 1.36, r15 * 1.36], xGp = [3.5, r15 / 2], xG = G3(xA, xB, xC);

  HB.lesson({
    id: 'ma2-02', field: '数学A　図形の性質', title: '角の二等分線と比', level: '三角形の性質', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　AB $=8$、AC $=6$、BC $=7$ の △ABC で、∠A の二等分線と辺 BC の交点を D とする。BD を求めよ。',
        '(2)　AB $=9$、AC $=6$ の △ABC で、∠A の二等分線と辺 BC の交点を D とする。BD $=3$ のとき、BC を求めよ。',
        '(3)　AB $=8$、AC $=4$、BC $=6$ の △ABC で、∠A の外角の二等分線と辺 BC の延長の交点を E とする。CE を求めよ。',
        '(4)　(3) で、∠A の二等分線と辺 BC の交点を D とする。DE と ∠DAE を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間の **平行線と線分の比** を使って、三角形の角の二等分線が向かいの辺をどんな比に分けるかを調べます。平行線を1本引くのがポイントです。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**角の二等分線と比** の定理を、平行線を引いて証明できる\n内角・外角の二等分線で、長さを求められる' }] },

      // ---------- 定理 ----------
      { clear: true, part: '内角の二等分線', say: '△ABC で、∠A の二等分線と辺 BC の交点を D とします。D は BC の中点とはかぎりません。BD : DC は、**AB : AC** に等しくなります。',
        add: [{ t: 'h', text: '内角の二等分線と比' },
          { t: 'box', c: 'y', label: '定理', text: '∠A の二等分線と辺 BC の交点を D とすると\nBD : DC $=$ AB : AC' },
          { t: 'p', size: 'sm', text: 'D は辺 BC を AB : AC に **内分** する' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.0, -1.3, 8.2, 6.9], w: 520, h: 464, items: tri([
            sl(A, B, G, 'AB', 'b', 30, 24), sl(A, C, G, 'AC', 'g', 30, 24)]) }] },

      // ---------- 証明 ----------
      { clear: true, cols: [0.6, 0.4], part: '証明', say: '証明します。C を通り AD に平行な直線を引き、BA の延長との交点を E とします。AD∥EC なので、同位角・錯角が使えます。',
        add: [{ t: 'h', text: '証明　平行線を1本引く' },
          { t: 'p', text: 'C を通り AD に **平行な直線** を引き、BA の延長との交点を E とする。' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.0, -1.3, 11.0, 11.3], w: 440, h: 462, items: tri([
            { k: 'seg', a: A, b: E, c: 'd', dash: true }, { k: 'seg', a: C, b: E, c: 'g', wd: 3.5 },
            { k: 'pt', at: E, name: 'E', dir: 'n', r: 4, c: 'g' }]) }] },
      { ask: { type: 'choice', q: 'AD∥EC。∠AEC と等しい角は？',
        opts: ['∠ABD', '∠ADB', '∠BAD', '∠ACB'], ok: 2,
        why: { 0: '∠ABD は B の角。AD∥EC から等しくなる角ではありません。', 1: '∠ADB と同位角で等しいのは ∠ECB（直線 BC で見た角）です。', 3: '∠ACB は C の内角。等しくなる理由がありません。' },
        good: '直線 BE で見ると、AD∥EC の **同位角** なので ∠AEC $=$ ∠BAD。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{AEC}=\\angle\\mathrm{BAD}', note: '同位角（AD∥EC）' }],
        draw: [{ fig: 'f2', items: [{ k: 'angle', o: E, a: A, b: C, rp: 40, c: 'p' }] }] } },
      { say: '直線 AC で見ると **錯角** で ∠ACE $=$ ∠CAD。∠BAD $=$ ∠CAD なので ∠AEC $=$ ∠ACE。△ACE は二等辺三角形で、AE $=$ AC です。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{ACE}=\\angle\\mathrm{CAD}', note: '錯角（AD∥EC）' },
          { t: 'm', size: 'sm', tex: '\\angle\\mathrm{AEC}=\\angle\\mathrm{ACE}\\ \\text{より}\\ \\hy{\\mathrm{AE}=\\mathrm{AC}}', note: '2つの角が等しい\n→ 二等辺三角形' }],
        draw: [{ fig: 'f2', items: [{ k: 'angle', o: C, a: A, b: E, rp: 40, c: 'p' },
          { k: 'poly', pts: [A, C, E], close: true, fill: 'p', alpha: 0.16, noStroke: true }] }] },
      { ask: { type: 'choice', q: '△BCE で AD∥EC。平行線と線分の比より、BD : DC と等しいのは？',
        opts: ['BA : BE', 'AD : EC', 'BE : AE', 'BA : AE'], ok: 3,
        why: { 0: 'BA : BE は BD : **BC**（全体との比）と等しくなります。', 1: 'AD : EC は平行な辺どうしの比。BA : BE と等しく、BD : DC ではありません。', 2: 'BE : AE は BC : DC にあたります。順番に注意します。' },
        good: 'D は BC を、A は BE を同じ比に分けます。BD : DC $=$ BA : AE。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{BD}:\\mathrm{DC}=\\mathrm{BA}:\\mathrm{AE}=\\hy{\\mathrm{AB}:\\mathrm{AC}}', note: 'AE $=$ AC' }] } },
      { say: 'AE $=$ AC を入れると、BD : DC $=$ AB : AC。証明できました。二等辺三角形を作るために、平行線を引いたのです。',
        add: [{ t: 'box', c: 'b', label: '証明の流れ', text: '平行線 → 同位角・錯角\n→ 二等辺三角形（AE $=$ AC）→ 平行線と線分の比' }] },

      // ---------- 例題 ----------
      { clear: true, part: '例題', say: '例題です。AB $=8$、AC $=6$、BC $=7$ の三角形で、∠A の二等分線と BC の交点 D。BD を求めます。',
        add: [{ t: 'h', text: '例題　長さを求める' },
          { t: 'p', text: 'AB $=8$、AC $=6$、BC $=7$ の △ABC で、∠A の二等分線と BC の交点を D とする。BD を求めよ。' },
          { t: 'fig', id: 'f4', col: 1, view: [-1.0, -1.9, 8.2, 6.9], w: 520, h: 497, items: tri([
            sl(A, B, G, '8', 'b', 22), sl(A, C, G, '6', 'g', 22), { k: 'dim', a: B, b: C, dy: 58, label: '7' }]) }] },
      { ask: { type: 'choice', q: 'BD の長さは？',
        opts: ['$\\dfrac72$', '$4$', '$3$', '$\\dfrac{28}{3}$'], ok: 1,
        why: { 0: '角の二等分線は、BC の中点を通るとはかぎりません。', 2: '$3$ は DC。BD は AB の側で、長いほうです。', 3: '$7\\times\\frac86$ としています。BC 全体を $8+6$ に分けて考えます。' },
        good: 'BD : DC $=8:6=4:3$。BC $=7$ を $4:3$ に分けて BD $=4$。',
        add: [{ t: 'm', tex: '\\mathrm{BD}:\\mathrm{DC}=8:6=4:3', note: 'AB : AC' }, { t: 'm', tex: '\\mathrm{BD}=7\\times\\frac{4}{4+3}=\\ans{4}' }],
        draw: [{ fig: 'f4', items: [{ k: 'label', at: [2, 0], text: '4', c: 'p', size: 26, dy: 24 }, { k: 'label', at: [5.5, 0], text: '3', c: 'p', size: 26, dy: 24 }] }] } },
      { ask: { type: 'choice', q: 'AB $=9$、AC $=6$ の △ABC で、∠A の二等分線と BC の交点を D とする。BD $=3$ のとき、BC は？',
        opts: ['$\\dfrac{15}{2}$', '$2$', '$5$', '$\\dfrac92$'], ok: 2,
        why: { 0: '$3:\\mathrm{DC}=6:9$ と比を逆にしています。BD : DC $=$ AB : AC $=9:6$ です。', 1: '$2$ は DC の長さ。BC $=$ BD $+$ DC です。', 3: '比を逆にして求めた DC です。BD : DC $=9:6$。' },
        good: 'BD : DC $=9:6=3:2$ なので DC $=2$、BC $=3+2=5$。',
        add: [{ t: 'm', tex: '3:\\mathrm{DC}=3:2\\qquad \\mathrm{BC}=3+2=\\ans{5}', note: 'BD : DC $=9:6$' }] } },

      // ---------- 外角 ----------
      { clear: true, cols: [0.5, 0.5], part: '外角の二等分線', say: '∠A の **外角** の二等分線と、辺 BC の延長の交点を E とすると、BE : EC $=$ AB : AC。E は BC を AB : AC に **外分** します。',
        add: [{ t: 'h', text: '外角の二等分線と比' },
          { t: 'box', c: 'y', label: '定理', text: '∠A の外角の二等分線と辺 BC の延長の交点を E とすると　BE : EC $=$ AB : AC' },
          { t: 'p', size: 'sm', text: 'E は辺 BC を AB : AC に **外分** する（AB≠AC）' },
          { t: 'fig', id: 'f3', col: 1, view: [-0.8, -1.4, 13.2, 6.0], w: 680, h: 359, items: [
            { k: 'poly', pts: [xA, xB, xC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: xC, b: xE, c: 'd', dash: true }, { k: 'seg', a: xA, b: xF, c: 'd', dash: true },
            { k: 'seg', a: xA, b: xE, c: 'p', wd: 3.5 },
            { k: 'angle', o: xA, a: xF, b: xE, rp: 34, c: 'p' }, { k: 'angle', o: xA, a: xE, b: xC, rp: 40, c: 'p' },
            sl(xA, xB, xG, '8', 'b', 22), sl(xA, xC, xG, '4', 'g', 20), { k: 'label', at: [3, 0], text: '6', size: 24, dy: 24 },
            { k: 'pt', at: xA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: xB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: xC, name: 'C', dir: 's', r: 4 },
            { k: 'pt', at: xE, name: 'E', dir: 's', r: 4, c: 'p' }] }] },
      { say: '証明は内角のときと同じです。C を通り AE に平行な直線と AB の交点を G とすると、△ACG が二等辺三角形（AG $=$ AC）になり、BE : EC $=$ BA : AG です。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{BE}:\\mathrm{EC}=\\mathrm{BA}:\\mathrm{AG}=\\mathrm{AB}:\\mathrm{AC}', note: 'GC∥AE\nAG $=$ AC' }],
        draw: [{ fig: 'f3', items: [{ k: 'seg', a: xC, b: xGp, c: 'g', dash: true }, { k: 'pt', at: xGp, name: 'G', dir: 's', r: 4, c: 'g' }] }] },
      { ask: { type: 'choice', q: 'AB $=8$、AC $=4$、BC $=6$ のとき、CE の長さは？',
        opts: ['$12$', '$2$', '$6$', '$4$'], ok: 2,
        why: { 0: '$12$ は BE の長さです。', 1: '$2$ は内角の二等分線のときの DC。外分では「差」を使います。', 3: 'CE $=$ AC ではありません。BE : EC $=8:4$ から出します。' },
        good: 'BE : EC $=8:4=2:1$。差の1つ分が BC $=6$ なので CE $=6$（BE $=12$）。',
        add: [{ t: 'm', tex: '\\mathrm{BE}:\\mathrm{EC}=2:1\\qquad \\mathrm{CE}=\\ans{6}', note: '$(2-1)$ つ分 $=6$' }],
        draw: [{ fig: 'f3', items: [{ k: 'label', at: [9, 0], text: '6', c: 'p', size: 24, dy: 24 }] }] } },
      { ask: { type: 'think', q: '∠A の **内角** の二等分線と BC の交点を D とする。DE の長さと ∠DAE を求めよう。',
        hint: 'BD : DC $=8:4$ から DC。∠DAE は「内角の半分」と「外角の半分」の和。',
        ans: 'DC $=2$ より DE $=2+6=8$。∠DAE $=90^\\circ$',
        after: '内角と外角の和は $180^\\circ$ なので、それぞれの半分の和は $90^\\circ$。D, E は BC を $2:1$ に内分・外分する点です。',
        add: [{ t: 'm', tex: '\\mathrm{DE}=2+6=\\ans{8},\\qquad \\angle\\mathrm{DAE}=\\ans{90^\\circ}' }],
        draw: [{ fig: 'f3', items: [{ k: 'seg', a: xA, b: xD, c: 'y', wd: 3.5 }, { k: 'pt', at: xD, name: 'D', dir: 's', r: 4, c: 'y' },
          { k: 'right', o: xA, a: xD, b: xE, s: 16, c: 'y' }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、三角形の **外心** と **内心** です。内心は、角の二等分線が集まる点です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
