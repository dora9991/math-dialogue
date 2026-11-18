/* 数学A 第2章 図形の性質 円の性質 ③：方べきの定理
   例はすべて自作（内部 PA=6, PB=2, PC=3 → PD=4／外部 PA=3, AB=5, PC=4 → PD=6, CD=2／
   接線 PT=6, PA=3 → PB=12, AB=9／考えてみよう x(x+5)=3·12 → x=4）。値・誤答は python3（sympy）で検算ずみ。
   図は、P を原点にして、各直線の上に P からその長さの位置に点をとり、円の中心を「弦の中点を通る垂線の交点」として計算している
   （接線の図は、中心 O から接点 T への半径が接線に垂直になる条件 O・v＝PT で中心を決めた）。どの点も円の上にあることを python3 で確かめた。 */
(function () {
  const POINTS = [
    '**方べきの定理**：点 P を通る2直線が円と A, B と C, D で交わるとき　$\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PC}\\cdot\\mathrm{PD}$（P が円の内部でも外部でも）',
    '1本が接線（接点 T）のときは　$\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PT}^2$。長さは **どれも P から** 測る（外部のときは PB $=$ PA $+$ AB）',
    'わけは **相似**。円周角・内接四角形の外角・接弦定理で、等しい角を2組見つける'
  ];
  const rad = d => d * Math.PI / 180, U = d => [Math.cos(rad(d)), Math.sin(rad(d))], sc = (v, t) => [v[0] * t, v[1] * t];
  const ctr = (a1, m1, a2, m2) => {   // O・u1＝m1、O・u2＝m2 をみたす中心 O（P は原点）
    const [p, q] = U(a1), [r, s] = U(a2), det = p * s - q * r;
    return [(m1 * s - q * m2) / det, (p * m2 - m1 * r) / det];
  };
  const P = [0, 0];
  const sl = (A, B, G, text, c, px, size) => {   // 線分 AB の、G と反対側に字
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; let nx = -(B[1] - A[1]), ny = B[0] - A[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 24, dx: nx * (px || 20), dy: -ny * (px || 20) };
  };
  // 図1：内部。弦 AB は横（A(−6,0) B(2,0)）、弦 CD は 65° の向き（C=3u, D=−4u）
  const c1 = ctr(0, -2, 65, -0.5), R1 = Math.sqrt(c1[0] ** 2 + c1[1] ** 2 + 12);
  const A1 = [-6, 0], B1 = [2, 0], C1 = sc(U(65), 3), D1 = sc(U(65), -4);
  // 図2：外部。P から 165° の向きに A(3)・B(8)、200° の向きに C(4)・D(6)
  const c2 = ctr(165, 5.5, 200, 5), R2 = Math.sqrt(c2[0] ** 2 + c2[1] ** 2 - 24);
  const A2 = sc(U(165), 3), B2 = sc(U(165), 8), C2 = sc(U(200), 4), D2 = sc(U(200), 6);
  // 図3：接線。接点 T＝6·(150° の向き)、195° の向きに A(3)・B(12)
  const c3 = ctr(195, 7.5, 150, 6), T3 = sc(U(150), 6), R3 = Math.hypot(c3[0] - T3[0], c3[1] - T3[1]);
  const A3 = sc(U(195), 3), B3 = sc(U(195), 12);
  // 図4：考えてみよう。A(−4,0) B(9,0)、110° の向きに C(3)・D(−12)
  const c4 = ctr(0, 2.5, 110, -4.5), R4 = Math.sqrt(c4[0] ** 2 + c4[1] ** 2 + 36);
  const A4 = [-4, 0], B4 = [9, 0], C4 = sc(U(110), 3), D4 = sc(U(110), -12);

  const pt = (at, name, dir, c) => ({ k: 'pt', at, name, dir, r: 4, c: c || 'w' });
  const inner = (id, w, labels) => ({ t: 'fig', id, col: 1, view: [-6.8, -4.3, 2.8, 5.1], w, h: Math.round(w * 9.4 / 9.6), items: [
    { k: 'circle', o: c1, r: R1, c: 'd' }, { k: 'seg', a: A1, b: B1, wd: 3.5 }, { k: 'seg', a: C1, b: D1, wd: 3.5 },
    pt(A1, 'A', 'w'), pt(B1, 'B', 'e'), pt(C1, 'C', 'ne'), pt(D1, 'D', 's'), pt(P, 'P', 'ne', 'y')].concat(labels ? [
    sl(P, A1, C1, '6', 'y'), sl(P, B1, C1, '2', 'y'), sl(P, C1, B1, '3', 'b'), sl(P, D1, A1, '4', 'b')] : []) });
  const outer = (id, w, labels) => ({ t: 'fig', id, col: 1, view: [-8.9, -2.8, 0.9, 3.9], w, h: Math.round(w * 6.7 / 9.8), items: [
    { k: 'circle', o: c2, r: R2, c: 'd' }, { k: 'seg', a: P, b: B2, wd: 3.5 }, { k: 'seg', a: P, b: D2, wd: 3.5 },
    pt(A2, 'A', 'n'), pt(B2, 'B', 'nw'), pt(C2, 'C', 's'), pt(D2, 'D', 'sw'), pt(P, 'P', 'e', 'y')].concat(labels ? [
    sl(P, A2, C2, '3', 'y'), sl(A2, B2, C2, '5', 'y'), sl(P, C2, A2, '4', 'b'), sl(C2, D2, A2, labels === 2 ? '2' : '?', 'b')] : []) });
  const tang = (id, w, labels) => ({ t: 'fig', id, col: 1, view: [-12.8, -6.2, 0.9, 4.3], w, h: Math.round(w * 10.5 / 13.7), items: [
    { k: 'circle', o: c3, r: R3, c: 'd' }, { k: 'seg', a: P, b: B3, wd: 3.5 }, { k: 'seg', a: P, b: sc(U(150), 8.2), c: 'g', wd: 3.5 },
    pt(A3, 'A', 's'), pt(B3, 'B', 'sw'), pt(T3, 'T', 'n', 'g'), pt(P, 'P', 'e', 'y')].concat(labels ? [
    sl(P, T3, A3, '6', 'g'), sl(P, A3, T3, '3', 'y'), sl(A3, B3, T3, labels === 2 ? '9' : '?', 'y')] : []) });

  HB.lesson({
    id: 'ma2-09', field: '数学A　図形の性質', title: '方べきの定理', level: '円の性質', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　2つの弦 AB, CD が円の内部の点 P で交わる。PA $=6$、PB $=2$、PC $=3$ のとき、PD を求めよ。',
        '(2)　2つの弦 AB, CD の延長が円の外部の点 P で交わる。PA $=3$、AB $=5$、PC $=4$ のとき、CD を求めよ。',
        '(3)　円の外部の点 P から引いた接線の接点を T、P を通る直線が円と交わる点を A, B とする。PT $=6$、PA $=3$ のとき、AB を求めよ。',
        '(4)　2つの弦 AB, CD が点 P で交わり、PA $=x$、PB $=x+5$、PC $=3$、PD $=12$ のとき、$x$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間は、接線と接弦定理でした。この時間は、点 P を通る2本の直線が円と交わるとき、**長さの積** が等しくなる **方べきの定理** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**方べきの定理** を、2本の弦が **円の内部・外部** で交わるときと **接線** のときに使い、長さを求められる' }] },

      // ---------- 内部 ----------
      { clear: true, part: '円の内部で交わる', say: '2つの弦 AB, CD が円の内部の点 P で交わるとき、$\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PC}\\cdot\\mathrm{PD}$ が成り立ちます。これを **方べきの定理** といいます。',
        add: [{ t: 'h', text: '方べきの定理（P が円の内部）' },
          { t: 'box', c: 'y', label: '方べきの定理', tex: '\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PC}\\cdot\\mathrm{PD}' },
          inner('h1', 540, false)] },
      { say: 'わけ：AC と DB を結んで、2つの三角形をつくります。$\\angle\\mathrm{PAC}$ と $\\angle\\mathrm{PDB}$ は、どちらも弧 BC に対する円周角。P の角は対頂角です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{PAC}=\\angle\\mathrm{PDB}', note: '弧 BC に対する円周角' },
          { t: 'm', tex: '\\angle\\mathrm{APC}=\\angle\\mathrm{DPB}', note: '対頂角' }],
        draw: [{ fig: 'h1', items: [
          { k: 'poly', pts: [P, A1, C1], close: true, fill: 'p', alpha: 0.2, c: 'p', wd: 2.5 }, { k: 'poly', pts: [P, D1, B1], close: true, fill: 'b', alpha: 0.22, c: 'b', wd: 2.5 },
          { k: 'angle', o: A1, a: P, b: C1, rp: 60, c: 'y' }, { k: 'angle', o: D1, a: P, b: B1, rp: 60, c: 'y' },
          { k: 'angle', o: P, a: A1, b: C1, rp: 24, c: 'g', n: 2 }, { k: 'angle', o: P, a: D1, b: B1, rp: 24, c: 'g', n: 2 }] }] },
      { ask: { type: 'choice', q: '2組の角が等しいので相似です。$\\triangle\\mathrm{PAC}$ と相似な三角形を、頂点の対応の順に書くと？',
        opts: ['$\\triangle\\mathrm{PBD}$', '$\\triangle\\mathrm{PDB}$', '$\\triangle\\mathrm{PCA}$', '$\\triangle\\mathrm{PDA}$'], ok: 1,
        why: { 0: 'A の角と等しいのは D の角。A に対応するのは D です。', 2: '$\\triangle\\mathrm{PCA}$ は $\\triangle\\mathrm{PAC}$ そのもの（並べかえ）です。', 3: 'DA は結んでいません。相似なのは AC と DB でできる三角形です。' },
        good: 'P→P、A→D、C→B と対応して $\\triangle\\mathrm{PAC}\\backsim\\triangle\\mathrm{PDB}$。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{PAC}\\backsim\\triangle\\mathrm{PDB}', note: '2組の角が等しい' }] } },
      { say: '対応する辺の比は等しいので $\\mathrm{PA}:\\mathrm{PD}=\\mathrm{PC}:\\mathrm{PB}$。外側の項の積と内側の項の積が等しいことから、方べきの定理が出ます。',
        add: [{ t: 'm', tex: '\\mathrm{PA}:\\mathrm{PD}=\\mathrm{PC}:\\mathrm{PB}\\ \\ \\Rightarrow\\ \\ \\hy{\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PC}\\cdot\\mathrm{PD}}' }] },
      { ask: { type: 'choice', q: '図で PA $=6$、PB $=2$、PC $=3$ のとき、PD は？',
        opts: ['$9$', '$1$', '$4$', '$5$'], ok: 2,
        why: { 0: 'PA・PC $=$ PB・PD としています。かけるのは、同じ弦の2つの部分どうしです。', 1: 'PA : PB $=$ PC : PD としています。比の組み方がちがいます。', 3: '弦 AB と弦 CD の長さが等しいとしています。そうとはかぎりません。' },
        good: '$6\\cdot2=3\\cdot\\mathrm{PD}$ より PD $=4$。',
        add: [{ t: 'ans', label: '答', tex: '6\\cdot2=3\\cdot\\mathrm{PD}\\qquad \\mathrm{PD}=4' }],
        draw: [{ fig: 'h1', items: [sl(P, A1, C1, '6', 'y'), sl(P, B1, C1, '2', 'y'), sl(P, C1, B1, '3', 'b'), sl(P, D1, A1, '4', 'b')] }] } },

      // ---------- 外部 ----------
      { clear: true, part: '円の外部で交わる', say: '2つの弦 AB, CD の **延長** が、円の外部の点 P で交わるときも、同じ $\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PC}\\cdot\\mathrm{PD}$ が成り立ちます。長さはどれも P から測ります。',
        add: [{ t: 'h', text: '方べきの定理（P が円の外部）' },
          { t: 'box', c: 'y', label: '方べきの定理', tex: '\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PC}\\cdot\\mathrm{PD}' },
          { t: 'p', size: 'sm', text: 'PB は P から B まで（PA $+$ AB）。AB ではない' },
          outer('h2', 620, false)] },
      { say: 'わけ：P の角は共通。四角形 ABDC は円に内接するので、外角 $\\angle\\mathrm{PAC}$ は内対角 $\\angle\\mathrm{BDC}$ に等しい。だから $\\triangle\\mathrm{PAC}\\backsim\\triangle\\mathrm{PDB}$ です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{APC}=\\angle\\mathrm{DPB}', note: '共通' },
          { t: 'm', tex: '\\angle\\mathrm{PAC}=\\angle\\mathrm{PDB}', note: '内接四角形の外角' },
          { t: 'p', size: 'sm', text: '→ $\\triangle\\mathrm{PAC}\\backsim\\triangle\\mathrm{PDB}$　より　PA : PD $=$ PC : PB' }],
        draw: [{ fig: 'h2', items: [
          { k: 'poly', pts: [P, A2, C2], close: true, fill: 'p', alpha: 0.2, c: 'p', wd: 2.5 }, { k: 'poly', pts: [P, D2, B2], close: true, fill: 'b', alpha: 0.16, c: 'b', wd: 2.5 },
          { k: 'angle', o: A2, a: P, b: C2, rp: 26, c: 'y' }, { k: 'angle', o: D2, a: P, b: B2, rp: 26, c: 'y' }, { k: 'angle', o: P, a: A2, b: C2, rp: 44, c: 'g', n: 2 }] }] },
      { ask: { type: 'choice', q: 'PA $=3$、AB $=5$、PC $=4$ のとき、CD は？',
        opts: ['$\\dfrac{15}{4}$', '$6$', '$\\dfrac{20}{3}$', '$2$'], ok: 3,
        why: { 0: 'PA・AB $=$ PC・CD としています。PB と PD は、P からの長さです。', 1: '$6$ は PD の長さ。CD $=$ PD $-$ PC です。', 2: 'PA : AB $=$ PC : CD としています。積の形で考えます。' },
        good: 'PB $=3+5=8$。$3\\cdot8=4\\cdot\\mathrm{PD}$ より PD $=6$、CD $=6-4=2$。',
        add: [{ t: 'ans', label: '答', tex: '3\\cdot8=4\\cdot\\mathrm{PD},\\ \\ \\mathrm{PD}=6\\qquad \\mathrm{CD}=2' }],
        draw: [{ fig: 'h2', items: [sl(P, A2, C2, '3', 'y'), sl(A2, B2, C2, '5', 'y'), sl(P, C2, A2, '4', 'b'), sl(C2, D2, A2, '2', 'b')] }] } },

      // ---------- 接線 ----------
      { clear: true, part: '接線のとき', say: 'P を通る直線の1本が、点 T で円に **接する** ときは $\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PT}^2$。C と D が重なって T になった形です。',
        add: [{ t: 'h', text: '方べきの定理（接線のとき）' },
          { t: 'box', c: 'y', label: '接線のとき', tex: '\\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PT}^2' },
          tang('h3', 600, false)] },
      { say: 'わけ：P の角は共通。**接弦定理** より $\\angle\\mathrm{PTA}=\\angle\\mathrm{PBT}$。だから $\\triangle\\mathrm{PTA}\\backsim\\triangle\\mathrm{PBT}$ で、PT : PB $=$ PA : PT です。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{PTA}=\\angle\\mathrm{PBT}', note: '接弦定理' },
          { t: 'm', tex: '\\mathrm{PT}:\\mathrm{PB}=\\mathrm{PA}:\\mathrm{PT}\\ \\ \\Rightarrow\\ \\ \\mathrm{PA}\\cdot\\mathrm{PB}=\\mathrm{PT}^2' }],
        draw: [{ fig: 'h3', items: [{ k: 'seg', a: T3, b: A3 }, { k: 'seg', a: T3, b: B3 },
          { k: 'poly', pts: [P, T3, A3], close: true, fill: 'p', alpha: 0.2, noStroke: true }, { k: 'poly', pts: [P, B3, T3], close: true, fill: 'b', alpha: 0.12, noStroke: true },
          { k: 'angle', o: T3, a: P, b: A3, rp: 40, c: 'y' }, { k: 'angle', o: B3, a: P, b: T3, rp: 64, c: 'y' }] }] },
      { ask: { type: 'choice', q: 'PT $=6$、PA $=3$ のとき、AB は？',
        opts: ['$9$', '$12$', '$3\\sqrt3$', '$3$'], ok: 0,
        why: { 1: '$12$ は PB の長さ。AB $=$ PB $-$ PA です。', 2: '三平方の定理ではありません。PA・PB $=$ PT² を使います。', 3: 'PT $-$ PA としています。長さの積で考えます。' },
        good: '$3\\cdot\\mathrm{PB}=6^2$ より PB $=12$、AB $=12-3=9$。',
        add: [{ t: 'ans', label: '答', tex: '3\\cdot\\mathrm{PB}=6^2,\\ \\ \\mathrm{PB}=12\\qquad \\mathrm{AB}=9' }],
        draw: [{ fig: 'h3', items: [sl(P, T3, A3, '6', 'g'), sl(P, A3, T3, '3', 'y'), sl(A3, B3, T3, '9', 'y')] }] } },

      // ---------- 3つの形 ----------
      { clear: true, cols: [0.333, 0.333, 0.334], part: '3つの形', say: '3つの形を並べます。どれも「P から円までの2つの長さの積」が等しい、という同じ形です。長さは、いつも **P から** 測ります。',
        add: [{ t: 'h', text: '内部で交わる' }, Object.assign(inner('s1', 470, true), { col: 0 }), { t: 'm', tex: '6\\cdot2=3\\cdot4' },
          { t: 'h', col: 1, text: '外部で交わる' }, Object.assign(outer('s2', 470, 2), { col: 1 }), { t: 'm', col: 1, tex: '3\\cdot8=4\\cdot6' },
          { t: 'h', col: 2, text: '接線' }, Object.assign(tang('s3', 470, 2), { col: 2 }), { t: 'm', col: 2, tex: '3\\cdot12=6^2' }] },

      // ---------- 考えてみよう ----------
      { clear: true, part: '2次方程式になる', say: '最後に、2次方程式になる問題です。弦 AB, CD が P で交わり、PA $=x$、PB $=x+5$、PC $=3$、PD $=12$ です。',
        add: [{ t: 'h', text: '長さが文字のとき' },
          { t: 'p', text: '2つの弦 AB, CD が点 P で交わる\nPA $=x$、PB $=x+5$、PC $=3$、PD $=12$' },
          { t: 'fig', id: 'h4', col: 1, view: [-6.0, -12.4, 11.0, 4.6], w: 500, h: 500, items: [
            { k: 'circle', o: c4, r: R4, c: 'd' }, { k: 'seg', a: A4, b: B4, wd: 3.5 }, { k: 'seg', a: C4, b: D4, wd: 3.5 },
            pt(A4, 'A', 'w'), pt(B4, 'B', 'e'), pt(C4, 'C', 'n'), pt(D4, 'D', 's'), pt(P, 'P', 'ne', 'y'),
            sl(P, A4, C4, 'x', 'y'), sl(P, B4, C4, 'x+5', 'y'), sl(P, C4, B4, '3', 'b'), sl(P, D4, B4, '12', 'b')] }] },
      { ask: { type: 'think', q: 'PA $=x$、PB $=x+5$、PC $=3$、PD $=12$ のとき、$x$ を求めよう。',
        hint: '方べきの定理で $x(x+5)=3\\cdot12$。2次方程式を解いて、$x>0$ を使う。',
        ans: '$x(x+5)=36$ より $x^2+5x-36=0$、$(x+9)(x-4)=0$。$x>0$ より $x=4$',
        after: 'このとき PB $=9$、弦 AB の長さは $13$。長さなので、負の解 $x=-9$ は使いません。',
        add: [{ t: 'm', tex: 'x(x+5)=3\\cdot12', note: '方べきの定理' }, { t: 'm', tex: 'x^2+5x-36=0\\qquad (x+9)(x-4)=0' },
          { t: 'ans', label: '答', tex: 'x=4\\quad(x>0)' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、**2つの円** の位置関係と、2つの円に共通な接線を調べます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
