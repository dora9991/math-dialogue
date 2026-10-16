/* 数学A 第2章 図形の性質 円の性質 ②：円と接線・接弦定理
   例はすべて自作（半径 3・OP=5 → 接線の長さ 4／AB=6, BC=9, CA=7 の内接円 → x=2, y=4, z=5／
   接弦定理 ∠BAT=62°, ∠CAS=46° → ∠ACB=62°, ∠ABC=46°, ∠BAC=72°／∠APB=50° の2本の接線 → ∠ACB=65°）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。接点は、半径と接線が垂直になる位置で計算している
   （OP=5 なら接点 (9/5, ±12/5)、∠APB=50° なら接点は 65°・−65°、P=(3/cos65°, 0)）。 */
(function () {
  const POINTS = [
    '円の接線は、接点を通る **半径に垂直**。円の外の点 P から引いた2本の接線の長さは **等しい**（PA $=$ PB）',
    '三角形の内接円では、頂点から接点までの長さが2本ずつ等しい。$x+y,\\ y+z,\\ z+x$ が3辺になるように式を立てる',
    '**接弦定理**：接線と弦のつくる角は、その角の内部にある弧に対する **円周角に等しい**'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const add = (P, v, t) => [P[0] + v[0] * t, P[1] + v[1] * t];
  const DIR8 = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'];
  const out8 = d => DIR8[((Math.round(d / 45) % 8) + 8) % 8];
  const O = [0, 0], R = 3;
  const cp = (name, d, c) => ({ k: 'pt', at: on(O, R, d), name, dir: out8(d), r: 4, c: c || 'w' });
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };

  // 図1：接線と半径。接点 T は 50°、接線の向き (−sin50°, cos50°)
  const T1 = on(O, R, 50), d1 = [-Math.sin(rad(50)), Math.cos(rad(50))], L1a = add(T1, d1, 3.0), L1b = add(T1, d1, -3.0);
  // 図2：2本の接線。半径 3、P(5,0)、接点 A(9/5, 12/5)・B(9/5, −12/5)
  const P2 = [5, 0], A2 = [9 / 5, 12 / 5], B2 = [9 / 5, -12 / 5];
  // 図3：内接円。B(0,0) C(9,0) A(34/9, √1760/9)（AB=6, CA=7）。内心 I(4, 2√110/11)。接点 P(4,0)、Q（CQ=5）、R（BR=4）
  const B3 = [0, 0], C3 = [9, 0], A3 = [34 / 9, Math.sqrt(1760) / 9], I3 = [4, 2 * Math.sqrt(110) / 11], r3 = 2 * Math.sqrt(110) / 11;
  const P3 = [4, 0], Q3 = add(C3, [(A3[0] - C3[0]) / 7, (A3[1] - C3[1]) / 7], 5), R3 = add(B3, [A3[0] / 6, A3[1] / 6], 4);
  // 図4：接弦定理。A は 270°（接線は y=−3）、B 30°（∠BAT=60°）、C 140°、D 90°（直径 AD）
  const A4 = on(O, R, 270), B4 = on(O, R, 30), C4 = on(O, R, 140), D4 = on(O, R, 90), T4 = [4.2, -3], S4 = [-4.2, -3];
  // 図5：例題。A 270°、B 34°（∠BAT=62°）、C 178°（∠CAS=46°）
  const A5 = on(O, R, 270), B5 = on(O, R, 34), C5 = on(O, R, 178), T5 = [4.2, -3], S5 = [-4.2, -3];
  // 図6：考えてみよう。接点 A 65°・B −65°、P(3/cos65°, 0)（∠APB=50°）、C 180°
  const A6 = on(O, R, 65), B6 = on(O, R, -65), P6 = [3 / Math.cos(rad(65)), 0], C6 = on(O, R, 180);
  const tanLine = (A, S, T, c) => [{ k: 'seg', a: S, b: T, c: c || 'g' }, { k: 'pt', at: T, name: 'T', dir: 'se', r: 3, c: c || 'g' }, { k: 'pt', at: S, name: 'S', dir: 'sw', r: 3, c: c || 'g' }];

  HB.lesson({
    id: 'ma2-08', field: '数学A　図形の性質', title: '円と接線・接弦定理', level: '円の性質', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　半径 3 の円 O の外の点 P から接線 PA を引く。OP $=5$ のとき、PA を求めよ。',
        '(2)　AB $=6$、BC $=9$、CA $=7$ の △ABC の内接円が、辺 BC に接する点を P とする。BP を求めよ。',
        '(3)　△ABC の外接円の A における接線を ST とする。$\\angle\\mathrm{BAT}=62^\\circ$、$\\angle\\mathrm{CAS}=46^\\circ$ のとき、△ABC の3つの角を求めよ。',
        '(4)　円の外の点 P から接線 PA, PB を引く。$\\angle\\mathrm{APB}=50^\\circ$ のとき、点 A, B をふくまない側の弧の上の点 C について $\\angle\\mathrm{ACB}$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、円周角の定理と円に内接する四角形でした。この時間は、円に **接する直線**（接線）の性質と、接線と弦がつくる角を調べます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**接線の長さ** の性質と **接弦定理** を使って、長さや角の大きさを求められる' }] },

      // ---------- 接線と半径 ----------
      { clear: true, part: '接線と半径', say: '円と直線がただ1点 T を共有するとき、直線は円に **接する** といい、その直線を **接線**、T を **接点** といいます。接線は、接点を通る半径に垂直です。',
        add: [{ t: 'h', text: '円の接線' },
          { t: 'box', c: 'b', label: '接線と半径', text: '円の接線は、接点を通る半径に **垂直**\n$\\mathrm{OT}\\perp\\ell$' },
          { t: 'p', size: 'sm', text: '中学でも使った性質。接点で直角ができる\n→ **三平方の定理** が使える' },
          { t: 'fig', id: 'g1', col: 1, view: [-4.0, -3.6, 5.0, 4.9], w: 520, h: 491, items: [
            { k: 'circle', o: O, r: R, c: 'd' },
            { k: 'seg', a: L1a, b: L1b, c: 'g', wd: 4 }, { k: 'label', at: L1b, text: 'ℓ', c: 'g', size: 28, dx: 14, dy: 18 },
            { k: 'seg', a: O, b: T1, c: 'b' }, { k: 'right', o: T1, a: O, b: L1a, s: 18, c: 'y' },
            { k: 'pt', at: O, name: 'O', dir: 'sw', r: 4, c: 'b' }, { k: 'pt', at: T1, name: 'T', dir: 'ne', r: 5 }] }] },

      // ---------- 接線の長さ ----------
      { clear: true, part: '接線の長さ', say: '円の外の点 P から、円に2本の接線が引けます。P から接点までの長さを **接線の長さ** といいます。2本の接線の長さは等しくなります。',
        add: [{ t: 'h', text: '接線の長さ' },
          { t: 'box', c: 'y', label: '接線の長さ', text: '円の外の点 P から引いた2本の接線の\n接点を A, B とすると　$\\mathrm{PA}=\\mathrm{PB}$' },
          { t: 'fig', id: 'g2', col: 1, view: [-3.7, -3.6, 6.1, 3.6], w: 600, h: 441, items: [
            { k: 'circle', o: O, r: R, c: 'd' },
            { k: 'seg', a: P2, b: A2, c: 'g', wd: 4 }, { k: 'seg', a: P2, b: B2, c: 'g', wd: 4 },
            { k: 'pt', at: O, name: 'O', dir: 'w', r: 4 }, { k: 'pt', at: P2, name: 'P', dir: 'e', r: 5 },
            { k: 'pt', at: A2, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B2, name: 'B', dir: 's', r: 4 }] }] },
      { say: 'わけ：△OAP と △OBP は、どちらも直角三角形（接線と半径は垂直）。OA $=$ OB（半径）、OP は共通なので、**斜辺と他の1辺** がそれぞれ等しく、合同です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{OAP}=\\angle\\mathrm{OBP}=90^\\circ', note: '接線 ⊥ 半径' },
          { t: 'm', tex: '\\mathrm{OA}=\\mathrm{OB},\\quad \\mathrm{OP}\\ \\text{共通}' },
          { t: 'p', size: 'sm', text: '→ △OAP ≡ △OBP（斜辺と他の1辺）　よって PA $=$ PB' }],
        draw: [{ fig: 'g2', items: [{ k: 'seg', a: O, b: A2, c: 'b' }, { k: 'seg', a: O, b: B2, c: 'b' }, { k: 'seg', a: O, b: P2, c: 'd', dash: true },
          { k: 'right', o: A2, a: O, b: P2, s: 16, c: 'y' }, { k: 'right', o: B2, a: O, b: P2, s: 16, c: 'y' }] }] },
      { ask: { type: 'choice', q: '円の半径が $3$、OP $=5$ のとき、接線の長さ PA は？',
        opts: ['$\\sqrt{34}$', '$2$', '$4$', '$8$'], ok: 2,
        why: { 0: '斜辺は OP です。$3^2+5^2$ ではなく $5^2-3^2$ を計算します。', 1: '長さをひくのではなく、直角三角形 OAP で三平方の定理を使います。', 3: '$8$ は PA と PB の和です。' },
        good: '$\\angle\\mathrm{OAP}=90^\\circ$ なので $\\mathrm{PA}^2=5^2-3^2=16$、PA $=4$。PB も $4$ です。',
        add: [{ t: 'ans', label: '答', tex: '\\mathrm{PA}=\\sqrt{5^2-3^2}=4' }],
        draw: [{ fig: 'g2', items: [{ k: 'label', at: [(O[0] + A2[0]) / 2, (O[1] + A2[1]) / 2], text: '3', c: 'b', size: 24, dx: -14, dy: -14 },
          { k: 'label', at: [2.5, 0], text: '5', size: 24, dy: 18 }, { k: 'label', at: [(A2[0] + P2[0]) / 2, (A2[1] + P2[1]) / 2], text: '4', c: 'g', size: 26, dx: 16, dy: -14 }] }] } },

      // ---------- 内接円 ----------
      { clear: true, part: '内接円と接線の長さ', say: '三角形の **内接円** は、3辺に接する円です。各頂点からは、接線が2本ずつ出ているので、頂点から接点までの長さが2本ずつ等しくなります。',
        add: [{ t: 'h', text: '内接円と接線の長さ' },
          { t: 'p', text: 'AB $=6$、BC $=9$、CA $=7$ の △ABC\n内接円が BC, CA, AB に接する点を P, Q, R とする' },
          { t: 'm', tex: '\\mathrm{AR}=\\mathrm{AQ}=\\hy{x},\\ \\ \\mathrm{BR}=\\mathrm{BP}=\\hb{y},\\ \\ \\mathrm{CP}=\\mathrm{CQ}=\\hg{z}' },
          { t: 'fig', id: 'g3', col: 1, view: [-0.9, -0.9, 9.9, 5.7], w: 630, h: 385, items: [
            { k: 'poly', pts: [A3, B3, C3], close: true, fill: 'w', alpha: 0.05 },
            { k: 'circle', o: I3, r: r3, c: 'd' }, { k: 'pt', at: I3, name: 'I', dir: 'e', r: 3, c: 'd', size: 22 },
            sl(A3, R3, I3, 'x', 'y', 22), sl(A3, Q3, I3, 'x', 'y', 22), sl(R3, B3, I3, 'y', 'b', 22), sl(B3, P3, I3, 'y', 'b', 22), sl(P3, C3, I3, 'z', 'g', 22), sl(C3, Q3, I3, 'z', 'g', 22),
            { k: 'pt', at: P3, name: 'P', dir: 'n', r: 4, c: 'p', size: 22 }, { k: 'pt', at: Q3, name: 'Q', dir: 'ne', r: 4, c: 'p', size: 22 }, { k: 'pt', at: R3, name: 'R', dir: 'nw', r: 4, c: 'p', size: 22 },
            { k: 'pt', at: A3, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B3, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C3, name: 'C', dir: 'se', r: 4 }] }] },
      { say: '3辺は、それぞれ2つの長さの和です。3つの式を全部たすと $2(x+y+z)=22$、つまり $x+y+z=11$ がわかります。',
        add: [{ t: 'm', tex: 'x+y=6,\\quad y+z=9,\\quad z+x=7' },
          { t: 'm', tex: '2(x+y+z)=22\\qquad x+y+z=11', note: '3つの式をたす' }] },
      { ask: { type: 'choice', q: '内接円が辺 BC に接する点 P について、BP の長さ $y$ は？',
        opts: ['$4$', '$\\dfrac92$', '$5$', '$2$'], ok: 0,
        why: { 1: '内接円は、BC の中点で接するとはかぎりません。', 2: '$5$ は CP の長さ $z$ です。', 3: '$2$ は A からの接線の長さ $x$ です。' },
        good: '$y=(x+y+z)-(z+x)=11-7=4$。同じように $x=2$、$z=5$ です。',
        add: [{ t: 'm', tex: 'y=11-(z+x)=11-7=\\ans{4}', note: '$x=2,\\ z=5$' }] } },

      // ---------- 接弦定理 ----------
      { clear: true, part: '接弦定理', say: '円の弦 AB と、点 A における接線 AT がつくる角 $\\angle\\mathrm{BAT}$ を考えます。この角は、その角の内部にある弧 AB に対する **円周角** に等しくなります。',
        add: [{ t: 'h', text: '接弦定理' },
          { t: 'box', c: 'y', label: '接弦定理', text: '円の接線 AT と弦 AB のつくる角 $\\angle\\mathrm{BAT}$ は\nその角の内部にある弧 AB に対する円周角に等しい\n$\\angle\\mathrm{BAT}=\\angle\\mathrm{ACB}$' },
          { t: 'fig', id: 'g4', col: 1, view: [-4.8, -4.0, 4.8, 4.0], w: 560, h: 467, items: [
            { k: 'circle', o: O, r: R, c: 'd' },
            { k: 'arc', o: O, r: R, a1: 270, a2: 390, c: 'p', wd: 6 },
            { k: 'seg', a: A4, b: B4 }, { k: 'seg', a: C4, b: A4 }, { k: 'seg', a: C4, b: B4 },
            { k: 'angle', o: A4, a: B4, b: T4, rp: 50, c: 'y' }, { k: 'angle', o: C4, a: A4, b: B4, rp: 46, c: 'y' },
            { k: 'pt', at: O, name: 'O', dir: 'w', r: 3, c: 'd', size: 22 }, cp('A', 270), cp('B', 30), cp('C', 140)].concat(tanLine(A4, S4, T4)) }] },
      { say: 'わけ（$\\angle\\mathrm{BAT}$ が鋭角のとき）：直径 AD を引きます。接線と半径は垂直で $\\angle\\mathrm{DAT}=90^\\circ$、直径に対する円周角で $\\angle\\mathrm{ABD}=90^\\circ$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{BAT}=90^\\circ-\\angle\\mathrm{DAB}', note: '$\\angle\\mathrm{DAT}=90^\\circ$' },
          { t: 'm', size: 'sm', tex: '\\angle\\mathrm{ADB}=90^\\circ-\\angle\\mathrm{DAB}', note: '$\\angle\\mathrm{ABD}=90^\\circ$' },
          { t: 'm', size: 'sm', tex: '\\angle\\mathrm{BAT}=\\angle\\mathrm{ADB}=\\angle\\mathrm{ACB}', note: '弧 AB に対する円周角' }],
        draw: [{ fig: 'g4', items: [{ k: 'seg', a: A4, b: D4, c: 'b', dash: true }, { k: 'seg', a: D4, b: B4, c: 'b' },
          { k: 'right', o: B4, a: A4, b: D4, s: 16, c: 'b' }, { k: 'right', o: A4, a: D4, b: T4, s: 16, c: 'b' }, { k: 'angle', o: D4, a: A4, b: B4, rp: 46, c: 'y' }, cp('D', 90, 'b')] }] },
      { ask: { type: 'choice', q: '図で、接線上の点 S（A の左側）について、$\\angle\\mathrm{CAS}$ と等しい角は？',
        opts: ['$\\angle\\mathrm{ACB}$', '$\\angle\\mathrm{BAT}$', '$\\angle\\mathrm{CAB}$', '$\\angle\\mathrm{ABC}$'], ok: 3,
        why: { 0: '$\\angle\\mathrm{ACB}$ と等しいのは、右側の $\\angle\\mathrm{BAT}$ です。', 1: '$\\angle\\mathrm{BAT}$ は弧 AB の側の角。$\\angle\\mathrm{CAS}$ は弧 AC の側です。', 2: '$\\angle\\mathrm{CAB}$ は2本の弦の角。接線と弦の角ではありません。' },
        good: '$\\angle\\mathrm{CAS}$ の内部にある弧は AC。弧 AC に対する円周角 $\\angle\\mathrm{ABC}$ と等しくなります。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{CAS}=\\angle\\mathrm{ABC}', note: '弧 AC に対する円周角' }],
        draw: [{ fig: 'g4', items: [{ k: 'angle', o: A4, a: C4, b: S4, rp: 50, c: 'g' }, { k: 'angle', o: B4, a: C4, b: A4, rp: 40, c: 'g' }] }] } },

      // ---------- 例題 ----------
      { clear: true, part: '例題　接弦定理', say: '例題です。△ABC の外接円の、A における接線を ST とします。$\\angle\\mathrm{BAT}=62^\\circ$、$\\angle\\mathrm{CAS}=46^\\circ$ のとき、△ABC の3つの角を求めます。',
        add: [{ t: 'h', text: '例題　△ABC の角' },
          { t: 'p', text: '直線 ST は、△ABC の外接円の A における接線\n$\\angle\\mathrm{BAT}=62^\\circ,\\quad \\angle\\mathrm{CAS}=46^\\circ$' },
          { t: 'fig', id: 'g5', col: 1, view: [-4.8, -4.0, 4.8, 4.0], w: 560, h: 467, items: [
            { k: 'circle', o: O, r: R, c: 'd' },
            { k: 'poly', pts: [A5, B5, C5], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: A5, a: B5, b: T5, rp: 54, c: 'y', label: '62°', lr: 26 }, { k: 'angle', o: A5, a: C5, b: S5, rp: 54, c: 'g', label: '46°', lr: 26 },
            cp('A', 270), cp('B', 34), cp('C', 178)].concat(tanLine(A5, S5, T5)) }] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{ABC}$ は？',
        opts: ['$62^\\circ$', '$46^\\circ$', '$72^\\circ$', '$134^\\circ$'], ok: 1,
        why: { 0: '$62^\\circ$ は $\\angle\\mathrm{BAT}$ と等しい $\\angle\\mathrm{ACB}$ の方です。', 2: '$72^\\circ$ は、残りの $\\angle\\mathrm{BAC}$ です。', 3: '$180^\\circ-46^\\circ$ にしています。接弦定理では、そのまま等しくなります。' },
        good: '$\\angle\\mathrm{CAS}$ の内部の弧 AC に対する円周角が $\\angle\\mathrm{ABC}$。接弦定理で $46^\\circ$ です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{ABC}=\\angle\\mathrm{CAS}=46^\\circ', note: '接弦定理' }],
        draw: [{ fig: 'g5', items: [{ k: 'angle', o: B5, a: C5, b: A5, rp: 40, c: 'g', label: '46°', lr: 26 }] }] } },
      { say: '同じように $\\angle\\mathrm{ACB}=\\angle\\mathrm{BAT}=62^\\circ$。$\\angle\\mathrm{BAC}$ は、A のまわりの角 $180^\\circ$ から2つの角をひいて求めます。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{ACB}=\\angle\\mathrm{BAT}=62^\\circ', note: '接弦定理' },
          { t: 'm', tex: '\\angle\\mathrm{BAC}=180^\\circ-(62^\\circ+46^\\circ)=72^\\circ', note: '直線 ST 上の角' },
          { t: 'ans', label: '答', tex: 'A=72^\\circ,\\ \\ B=46^\\circ,\\ \\ C=62^\\circ' }],
        draw: [{ fig: 'g5', items: [{ k: 'angle', o: C5, a: A5, b: B5, rp: 40, c: 'y', label: '62°', lr: 26 }, { k: 'angle', o: A5, a: B5, b: C5, rp: 34, c: 'p', label: '72°', lr: 20 }] }] },

      // ---------- 考えてみよう ----------
      { clear: true, cols: [0.47, 0.53], part: '接線の長さと接弦定理', say: '最後に、2つの性質を組み合わせます。円の外の点 P から接線 PA, PB を引き、$\\angle\\mathrm{APB}=50^\\circ$ とします。',
        add: [{ t: 'h', text: '2本の接線と円周角' },
          { t: 'p', text: '円の外の点 P から接線 PA, PB\n$\\angle\\mathrm{APB}=50^\\circ$\n大きい方の弧の上の点 C で\n$\\angle\\mathrm{ACB}$ は？' },
          { t: 'fig', id: 'g6', col: 1, view: [-3.9, -3.6, 8.1, 3.6], w: 700, h: 420, items: [
            { k: 'circle', o: O, r: R, c: 'd' },
            { k: 'seg', a: P6, b: A6, c: 'g', wd: 4 }, { k: 'seg', a: P6, b: B6, c: 'g', wd: 4 }, { k: 'seg', a: A6, b: B6 },
            { k: 'seg', a: C6, b: A6 }, { k: 'seg', a: C6, b: B6 },
            { k: 'angle', o: P6, a: A6, b: B6, rp: 52, c: 'g', label: '50°', lr: 26 },
            { k: 'pt', at: P6, name: 'P', dir: 'e', r: 5 }, cp('A', 65), cp('B', -65), cp('C', 180)] }] },
      { ask: { type: 'think', q: '$\\angle\\mathrm{APB}=50^\\circ$ のとき、$\\angle\\mathrm{ACB}$ を求めよう。',
        hint: 'PA $=$ PB なので △PAB は二等辺三角形。$\\angle\\mathrm{PAB}$ を出してから接弦定理。',
        ans: '$\\angle\\mathrm{PAB}=\\dfrac{180^\\circ-50^\\circ}{2}=65^\\circ$。接弦定理より $\\angle\\mathrm{ACB}=\\angle\\mathrm{PAB}=65^\\circ$',
        after: '中心 O を使っても、$\\angle\\mathrm{AOB}=360^\\circ-90^\\circ\\cdot2-50^\\circ=130^\\circ$ の半分で $65^\\circ$ になります。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{PAB}=\\frac{180^\\circ-50^\\circ}{2}=65^\\circ', note: 'PA $=$ PB' },
          { t: 'ans', label: '答', tex: '\\angle\\mathrm{ACB}=\\angle\\mathrm{PAB}=65^\\circ' }],
        draw: [{ fig: 'g6', items: [{ k: 'angle', o: A6, a: P6, b: B6, rp: 40, c: 'y', label: '65°', lr: 26 }, { k: 'angle', o: C6, a: A6, b: B6, rp: 56, c: 'y', label: '65°', lr: 26 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、円と2本の直線が交わるときの長さの関係、**方べきの定理** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
