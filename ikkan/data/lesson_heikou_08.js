/* 平行と合同 第8時「ぴったり重なる図形の、辺や角の関係を調べよう」：授業計画・ワークシート・演習プリント・小テスト（新しい形）。
   授業ナビ 標準版（hyojun-navi）の第8時（合同な図形・対応・記号 ≡）をもとに、50分の流れ（ペア学習3＋小テスト7＋解説・発問12＋演習23＋振り返り・回収5）に合わせて、新しく書き直した。
   型は「例（例題と練習）」。合同の意味（ぴったり重なる。裏返してもよい）・対応する頂点・辺・角・記号 ≡ と、「合同な図形では、対応する線分の長さ・角の大きさは等しい」。
   ・学習課題＝ア〜オの図形（三角形 5つ。辺の長さを書いてある）から、ぴったり重なる組（ウは裏返す）を見つける。エは「形は同じで大きさがちがう」、オは「辺の長さが 1つちがう」（全部印刷）。
     ことば＝合同・対応・長さと大きさが等しい・記号 ≡。「≡ は対応する頂点を同じ順に書く」ことは、考えようで見つけさせるので、ことば欄には書かない。
     例題＝四角形 ABCD≡四角形 EFGH（EFGH は、裏返して回した形）。対応する頂点を表に書き、FG の長さ・∠G の大きさを読みとり、≡ で表す。空欄あり。
   ・考えよう＝「△ABC≡△DEF と書ける 2つの三角形（辺の長さは 4cm・6cm・5cm の三角形）で、△ABC≡△EDF と書いたらどうなるか」。
     対応の表をつくり、辺の長さをくらべて、「≡ の書き方の意味」を自分のことばで言う。答えは、ワークシートにも教卓の解答にも載せない。
     発展＝1辺 4cm の正三角形どうしの合同では、対応のさせ方が全部で何通りあるか。
   ・図は、すべて座標（cm）から描いた。2つの合同な図形は、1つの図形を、裏返し・回転して動かした座標なので、対応する辺の長さ・角の大きさが本当に等しい。
     checks では、すべての図で、辺の長さの字・角の字を、座標から測り直し、合同な組は、対応する辺・角が等しいか、合同でない組は、ちがうかを確かめた。
   ・範囲：三角形・四角形の合同の意味と対応まで。合同条件・四角形の合同条件・相似（形は同じで大きさがちがう、と言うだけで、相似とは言わない）は使わない。
   検算：node tools/verify.cjs　／　見た目：node tools/check.cjs */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, TB, SVG } = IK.b;
  const GEO = IK.b.GEO || (() => SVG(() => ''));   // 検算（verify.cjs）は geo.js を読まないので、そのときだけ空の図にする
  const J = JSON.stringify;

  /* ---------------- 座標（cm）をつくる道具 ----------------
     triSSS：3辺（AB・BC・CA）から △ABC の座標　rigid：図形を、裏返し（flip）→回転（rot 度）→平行移動（to）で動かす
     pair：図形 P1（頂点の名前 na）と、それを動かしてできる合同な図形（名前 nb。対応する順に同じ番号）を、1つの図にならべる */
  const rad = d => d * Math.PI / 180;
  const triSSS = (ab, bc, ca) => { const x = (ab * ab + bc * bc - ca * ca) / (2 * bc); return [[x, Math.sqrt(ab * ab - x * x)], [0, 0], [bc, 0]]; };   // A・B・C
  const rigid = (P, o) => P.map(p => { let x = o.flip ? -p[0] : p[0], y = p[1]; const t = rad(o.rot || 0), c = Math.cos(t), s = Math.sin(t); [x, y] = [x * c - y * s, x * s + y * c]; return [x + (o.to ? o.to[0] : 0), y + (o.to ? o.to[1] : 0)]; });
  const cen = P => [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length];
  // 辺 i→j の字（text）：多角形の外がわ（中心から遠ざかる向き）に k mm
  const lenTxt = (P, names, i, j, text, k) => {
    const a = P[i], b = P[j], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c = cen(P), d = Math.hypot(m[0] - c[0], m[1] - c[1]) || 1;
    return { p: m, t: text, dx: (k || 4) * (m[0] - c[0]) / d, dy: -(k || 4) * (m[1] - c[1]) / d, i: names[i] + names[j] };
  };
  const FIGS = [];   // 検算（checks）に渡す、すべての図
  const reg = (name, spec) => { spec.name = name; FIGS.push(spec); return spec; };
  const cap = (spec, text) => {
    const ps = Object.values(spec.pts), x = Math.min(...ps.map(p => p[0])), y = Math.max(...ps.map(p => p[1]));
    spec.pts.CAP = [x, y + 0.5];
    spec.txt = (spec.txt || []).concat([{ p: 'CAP', t: text, anchor: 'start', size: 3.4, dy: -4.5 }]);
    return spec;
  };

  /* 1つの三角形の図（学習課題）。辺の長さの字は、そのまま座標から測った長さ（lens）。スケールは 1cm＝4mm（大きさのちがいが、見てわかる） */
  const one = (name, P, text, o) => {
    o = o || {};
    const pts = { A: P[0], B: P[1], C: P[2] }, lens = [['A', 'B', text[0]], ['B', 'C', text[1]], ['C', 'A', text[2]]];
    return reg(name, { pts, poly: 'ABC', scale: 4, txt: lens.map(l => lenTxt(P, 'ABC', 'ABC'.indexOf(l[0]), 'ABC'.indexOf(l[1]), l[2], 4.2)), lens: lens.map(l => l.slice(0, 3)), tri: [['A', 'B', 'C']] });
  };

  /* 合同な 2つの図形の図。P1（名前 na）と、P1 を動かした P2（名前 nb）。
     o.tf：動かし方　o.lens1＝[[i, j, 字]]（P1 の辺の長さ）　o.angs1＝[[i, 字]]（P1 の角。'R'＝直角）　o.lens2・o.angs2：P2 の字（解答では赤）　o.hide2：P2 に出す字
     o.map：対応（P1 の頂点 → P2 の頂点。検算用）　o.ask：答えの確かめ［[頂点, 頂点, 長さ]…］（辺の長さ）、o.askA：［[頂点, 頂点, 頂点, 大きさ]…］（角） */
  const pair = (name, P1, na, nb, o) => {
    const P2a = rigid(P1, o.tf), n = P1.length, minB = Math.min(...P2a.map(p => p[0])), maxA = Math.max(...P1.map(p => p[0]));
    const ya = (Math.min(...P1.map(p => p[1])) + Math.max(...P1.map(p => p[1]))) / 2, yb = (Math.min(...P2a.map(p => p[1])) + Math.max(...P2a.map(p => p[1]))) / 2;
    const P2 = P2a.map(p => [p[0] + maxA + (o.gap || 1.4) - minB, p[1] + ya - yb]);
    const pts = {}; [...na].forEach((k, i) => { pts[k] = P1[i]; }); [...nb].forEach((k, i) => { pts[k] = P2[i]; });
    const nm = (names, i) => names[(i + n) % n];
    const txt = [], ang = [], lens = [], at = (P, names, L, red) => (L || []).forEach(l => { const t = lenTxt(P, names, l[0], l[1], l[2], 4); txt.push(t); lens.push([names[l[0]], names[l[1]], l[2]]); });
    at(P1, na, o.lens1);
    (o.angs1 || []).forEach(a => ang.push(a[1] === 'R' ? { at: nm(na, a[0]), a: nm(na, a[0] - 1), b: nm(na, a[0] + 1), right: true } : { at: nm(na, a[0]), a: nm(na, a[0] - 1), b: nm(na, a[0] + 1), t: a[1], r: 4.5, lr: a[2] || 9 }));
    (o.lens2 || []).forEach(l => { const t = lenTxt(P2, nb, l[0], l[1], l[2], 4); txt.push(t); lens.push([nb[l[0]], nb[l[1]], l[2]]); });
    (o.angs2 || []).forEach(a => ang.push(a[1] === 'R' ? { at: nm(nb, a[0]), a: nm(nb, a[0] - 1), b: nm(nb, a[0] + 1), right: true } : { at: nm(nb, a[0]), a: nm(nb, a[0] - 1), b: nm(nb, a[0] + 1), t: a[1], r: 4.5, lr: a[2] || 9 }));
    const red = { txt: [], ang: [] };
    (o.rlens2 || []).forEach(l => { const t = lenTxt(P2, nb, l[0], l[1], l[2], 4); red.txt.push(t); lens.push([nb[l[0]], nb[l[1]], l[2]]); });
    (o.rangs2 || []).forEach(a => red.ang.push({ at: nm(nb, a[0]), a: nm(nb, a[0] - 1), b: nm(nb, a[0] + 1), t: a[1], r: 4.5, lr: a[2] || 9 }));
    const spec = { pts, poly: [na, nb], txt, ang, vl: na + nb, lens, cong: [[[...na], [...nb]]], map: o.map || null, ask: o.ask || [], askA: o.askA || [], tf: o.tf };
    if (red.txt.length || red.ang.length) spec.a = red;
    if (o.pad != null) spec.pad = o.pad;
    return reg(name, spec);
  };

  /* ---------------- 問題の図 ---------------- */
  const T0 = triSSS(4, 6, 5);                                                       // 辺 4cm・6cm・5cm の三角形（A・B・C）
  const Z_ア = one('学習課題 ア', T0, ['4cm', '6cm', '5cm']);
  const Z_イ = one('学習課題 イ', rigid(T0, { rot: 125 }), ['4cm', '6cm', '5cm']);
  const Z_ウ = one('学習課題 ウ', rigid(T0, { flip: true, rot: 20 }), ['4cm', '6cm', '5cm']);
  const Z_エ = one('学習課題 エ', triSSS(2, 3, 2.5), ['2cm', '3cm', '2.5cm']);
  const Z_オ = one('学習課題 オ', triSSS(4, 7, 5), ['4cm', '7cm', '5cm']);
  [Z_ア, Z_イ, Z_ウ, Z_エ, Z_オ].forEach((z, i) => cap(z, 'アイウエオ'[i]));
  // 例題：四角形 ABCD（AB＝3、BC＝4、CD＝2.5、∠B＝90°、∠C＝70°）と、それを裏返して回した 四角形 EFGH
  const Q1 = [[0, 3], [0, 0], [4, 0], [4 + 2.5 * Math.cos(rad(110)), 2.5 * Math.sin(rad(110))]];
  const Z_E = pair('例題', Q1, 'ABCD', 'EFGH', {
    tf: { flip: true, rot: -70 }, lens1: [[0, 1, '3cm'], [1, 2, '4cm'], [2, 3, '2.5cm']], angs1: [[1, 'R'], [2, '70°']],
    rlens2: [[1, 2, '4cm']], rangs2: [[2, '70°']], map: { A: 'E', B: 'F', C: 'G', D: 'H' }, ask: [['F', 'G', 4], ['G', 'H', 2.5], ['E', 'F', 3]], askA: [['F', 'G', 'H', 70]]
  });
  // 考えよう：△ABC（AB＝4、BC＝6、CA＝5）と、△DEF（△ABC を裏返して回した形。DE＝4、EF＝6、FD＝5）
  const Z_K = pair('考えよう', T0, 'ABC', 'DEF', {
    tf: { flip: true, rot: 205 }, lens1: [[0, 1, '4cm'], [1, 2, '6cm'], [2, 0, '5cm']], lens2: [[0, 1, '4cm'], [1, 2, '6cm'], [2, 0, '5cm']],
    map: { A: 'D', B: 'E', C: 'F' }, ask: [['D', 'E', 4], ['E', 'F', 6], ['F', 'D', 5]]
  });
  // 演習 基礎（1）：△ABC（AB＝5、BC＝3、CA＝4、∠C＝90°）と △DEF
  const R1 = [[0, 4], [3, 0], [0, 0]];                                                // A・B・C（C が直角）
  const Z_D1 = pair('基礎（1）', R1, 'ABC', 'DEF', {
    tf: { flip: true, rot: 100 }, lens1: [[0, 1, '5cm'], [1, 2, '3cm'], [2, 0, '4cm']], angs1: [[2, 'R']], map: { A: 'D', B: 'E', C: 'F' },
    rlens2: [], ask: [['D', 'E', 5], ['E', 'F', 3], ['D', 'F', 4]], askA: [['E', 'F', 'D', 90]]
  });
  // 基礎（2）：四角形 ABCD（AB＝4、BC＝5、CD＝5、DA＝2、∠A＝∠B＝90°）と 四角形 EFGH
  const Q2 = [[0, 4], [0, 0], [5, 0], [2, 4]];
  const Z_D2 = pair('基礎（2）', Q2, 'ABCD', 'EFGH', {
    tf: { rot: 200 }, lens1: [[0, 1, '4cm'], [1, 2, '5cm'], [2, 3, '5cm'], [3, 0, '2cm']], angs1: [[0, 'R'], [1, 'R']], map: { A: 'E', B: 'F', C: 'G', D: 'H' },
    ask: [['E', 'F', 4], ['G', 'H', 5], ['E', 'H', 2]], askA: [['E', 'F', 'G', 90]]
  });
  // 標準（3）：△ABC（AB＝3、∠B＝65°、BC＝5）と、△FED（FE＝3、∠E＝65°、ED＝5）。△ABC≡△FED
  const S1 = [[3 * Math.cos(rad(65)), 3 * Math.sin(rad(65))], [0, 0], [5, 0]];       // A・B・C（AB＝3、∠B＝65°、BC＝5）
  const Z_D3 = pair('標準（3）', S1, 'ABC', 'FED', {
    tf: { flip: true, rot: 160 }, lens1: [[0, 1, '3cm'], [1, 2, '5cm']], angs1: [[1, '65°']], lens2: [[0, 1, '3cm'], [1, 2, '5cm']], angs2: [[1, '65°']],
    map: { A: 'F', B: 'E', C: 'D' }, ask: [['F', 'E', 3], ['E', 'D', 5]], askA: [['F', 'E', 'D', 65]]
  });
  // 入試（8）：△ABC≡△DEF。AB＝(3x−2)cm、DE＝(x+6)cm、BC＝(2x+1)cm、EF＝(y+3)cm（x＝4、y＝6：AB＝DE＝10、BC＝EF＝9）
  const X1 = triSSS(10, 9, 8);                                                       // CA＝8
  const Z_D8 = pair('入試（8）', X1, 'ABC', 'DEF', {
    tf: { flip: true, rot: 250 }, lens1: [[0, 1, '(3x−2)cm'], [1, 2, '(2x+1)cm']], lens2: [[0, 1, '(x+6)cm'], [1, 2, '(y+3)cm']],
    map: { A: 'D', B: 'E', C: 'F' }, ask: [['A', 'B', 10], ['D', 'E', 10], ['B', 'C', 9], ['E', 'F', 9]]
  });
  // 小テスト（2）：△ABC（AB＝3、∠B＝70°、BC＝4）と △DEF
  const S2 = [[3 * Math.cos(rad(70)), 3 * Math.sin(rad(70))], [0, 0], [4, 0]];
  const Z_Q2 = pair('小テスト（2）', S2, 'ABC', 'DEF', {
    tf: { flip: true, rot: 140 }, lens1: [[0, 1, '3cm'], [1, 2, '4cm']], angs1: [[1, '70°']], map: { A: 'D', B: 'E', C: 'F' },
    ask: [['E', 'F', 4], ['D', 'E', 3]], askA: [['D', 'E', 'F', 70]]
  });
  // 入試（9）折り返し：△ABC（∠B＝70°、∠C＝50°、∠A＝60°）を、A が BC 上の A′ に重なるように、DE で折る。∠BDA′＝80°
  const fold = (() => {
    const Bp = [0, 0], Cp = [6, 0];
    const A = (() => { const s = 6 * Math.sin(rad(50)) / Math.sin(rad(60)); return [s * Math.cos(rad(70)), s * Math.sin(rad(70))]; })();   // 正弦定理で AB を出す（∠A＝60°）
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
    // A′ ＝ (t, 0)。折り目は AA′ の垂直二等分線。D は AB 上、E は AC 上。∠BDA′ が 80° になる t を、はさみうちで探す
    const calc = t => {
      const Ap = [t, 0], m = [(A[0] + Ap[0]) / 2, (A[1] + Ap[1]) / 2], n = sub(Ap, A);
      const hit = (P, Q) => { const d = sub(Q, P), u = dot(sub(m, P), n) / dot(d, n); return [P[0] + d[0] * u, P[1] + d[1] * u]; };
      const D = hit(Bp, A), E = hit(Cp, A), ang = (P, Q, R) => { const a = sub(P, Q), b = sub(R, Q); return Math.acos(dot(a, b) / Math.hypot(...a) / Math.hypot(...b)) * 180 / Math.PI; };
      return { Ap, D, E, bda: ang(Bp, D, Ap) };
    };
    let lo = 0.3, hi = 5.7;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (calc(mid).bda > 80) hi = mid; else lo = mid; }   // t が大きいほど ∠BDA′ は大きい
    const r = calc((lo + hi) / 2);
    return Object.assign({ A, B: Bp, C: Cp }, r);
  })();
  const Z_D9 = reg('入試（9）', {
    pts: { A: fold.A, B: fold.B, C: fold.C, D: fold.D, E: fold.E, "A'": fold.Ap }, poly: ['ABC'], segs: [['D', 'E', { dash: 1 }], ['D', "A'"], ["A'", 'E']],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 150], E: ['E', 30], "A'": ["A′", 270, 3.6] },
    ang: [{ at: 'B', a: 'C', b: 'A', t: '70°', r: 5, lr: 10 }, { at: 'C', a: 'B', b: 'A', t: '50°', r: 5, lr: 10 }, { at: 'D', a: 'B', b: "A'", t: '80°', r: 5, lr: 9 }, { at: 'E', a: "A'", b: 'C', t: 'x', r: 5, lr: 9 }],
    xv: 40, fold: true,
    a: { ang: [{ at: 'D', a: 'A', b: 'E', t: '50°', r: 6, lr: 10 }, { at: 'D', a: 'E', b: "A'", t: '50°', r: 6, lr: 10 }, { at: 'E', a: 'D', b: 'A', t: '70°', r: 6, lr: 10 }, { at: 'E', a: "A'", b: 'D', t: '70°', r: 6, lr: 10 }] }
  });

  /* ---------------- 答えの文（画面にも検算にも、同じ文字列を使う） ---------------- */
  const T_W1 = 'ぴったり重なる組 … ア・イ・ウ（ウは、裏返すと重なる）';
  const T_W2 = 'エ … 形は同じだが、大きさ（辺の長さ）がちがう。\nオ … 辺の長さが 4cm・5cm・7cm で、ア〜ウとちがう。';
  const T_E = '（2）辺 FG は、辺 BC に対応するから　FG＝4cm\n（3）∠G は、∠C に対応するから　∠G＝70°\n（4）四角形 ABCD≡四角形 EFGH';
  const T_D1 = '① 頂点 E　　② DE＝AB＝5cm　　③ EF＝BC＝3cm\n④ ∠F＝∠C＝90°　　⑤ 辺 DF';
  const T_D2 = '① EF＝AB＝4cm　　② GH＝CD＝5cm\n③ ∠F＝∠B＝90°　　④ 辺 EH';
  const T_D3 = '△ABC≡△FED　（A と F、B と E、C と D が対応する）\n辺 AC に対応する辺は　辺 FD';
  const T_D4 = '∠D＝360°−(95°+70°+100°)＝95°\n∠H は ∠D に対応するから　∠H＝95°';
  const T_D5 = 'ア、ウ、オ\nイ … 縦 2cm・横 6cm と、縦 3cm・横 4cm の長方形は、面積が同じ（12 cm^2）でも、重ならない。\nエ … 3cm・4cm・5cm と、2cm・5cm・5cm の三角形は、周の長さが同じ（12cm）でも、重ならない。';
  const T_D6 = 'CA＝21−6−8＝7（cm）\nDF は CA に対応するから　DF＝7cm';
  const T_D7 = '∠A＝∠D＝80° だから　∠C＝180°−80°−55°＝45°\n∠F は ∠C に対応するから　∠F＝45°';
  const T_D8 = '① AB＝DE だから　3x−2＝x+6　　2x＝8　　x＝4\n② BC＝EF だから　2x+1＝y+3　　x＝4 を入れて　9＝y+3　　y＝6\n　 （確かめ　AB＝10、DE＝10、BC＝9、EF＝9）';
  const T_D9 = '折り返したから　△ADE≡△A′DE\n∠ADE＝∠A′DE＝(180°−80°)÷2＝50°\n∠A＝180°−70°−50°＝60°　　△ADE の内角の和から　∠AED＝180°−60°−50°＝70°\n∠A′ED＝∠AED＝70° だから　∠x＝180°−70°−70°＝40°';
  const T_Q1 = '対応する頂点・辺・角　　記号 ≡';
  const T_Q2 = '① 頂点 D　　② EF＝BC＝4cm\n③ ∠E＝∠B＝70°　　④ 辺 AC';
  const T_Q3 = '∠B＝∠E＝70° だから　∠C＝180°−50°−70°＝60°\n∠F＝∠C＝60°';
  const T_Q4 = 'ア、イ、エ';
  const T_QC = 'AB＝DE だから　2x+3＝x+8　　x＝5\nAB＝13cm、BC＝3×5−1＝14cm\nCA＝40−13−14＝13cm　　DF＝CA＝13cm';

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     figCheck：すべての図で、辺の長さの字・角の字を座標から測り直し、合同な組は対応する辺・角が等しいか、対応（map）が長さを変えないか、答え（ask・askA）が合うか
     arith：答えの文の中の、数だけの式（180°−80°−55°＝45° など）が計算として合うか */
  const figCheck = F => {
    const ang = (P, Q, R) => { const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]), b = Math.atan2(R[1] - Q[1], R[0] - Q[0]); const d = Math.abs(a - b) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]), bad = [];
    if (F.length < 12) bad.push('図の数');
    F.forEach(f => {
      const P = f.pts, pt = k => (typeof k === 'string' ? P[k] : k), no = s => bad.push(f.name + '：' + s);
      (f.lens || []).forEach(l => { if (/^[0-9.]+cm$/.test(l[2]) && Math.abs(dist(P[l[0]], P[l[1]]) - parseFloat(l[2])) > 0.01) no('辺 ' + l[0] + l[1] + ' の字 ' + l[2] + '（測った長さ ' + dist(P[l[0]], P[l[1]]).toFixed(3) + '）'); });
      const angOK = L => (L || []).forEach(an => {
        const m = ang(pt(an.a), P[an.at], pt(an.b));
        if (an.right) { if (Math.abs(m - 90) > 0.05) no('直角のしるし ' + an.at); return; }
        const t = String(an.t == null ? '' : an.t).replace(/[{}]/g, '');
        if (t === 'x') { if (Math.abs(m - f.xv) > 0.05) no('x（' + an.at + '）が ' + m.toFixed(2) + '°'); return; }
        const v = parseFloat(t);
        if (!isNaN(v) && Math.abs(m - v) > 0.05) no('角 ' + an.at + ' の字 ' + t + '（測った大きさ ' + m.toFixed(2) + '°）');
      });
      angOK(f.ang); angOK(f.a && f.a.ang);
      (f.cong || []).forEach(c => { const a = c[0], b = c[1], n = a.length; a.forEach((_, i) => { if (Math.abs(dist(P[a[i]], P[a[(i + 1) % n]]) - dist(P[b[i]], P[b[(i + 1) % n]])) > 1e-9) no('合同でない（辺 ' + a[i] + a[(i + 1) % n] + '）'); if (Math.abs(ang(P[a[(i + n - 1) % n]], P[a[i]], P[a[(i + 1) % n]]) - ang(P[b[(i + n - 1) % n]], P[b[i]], P[b[(i + 1) % n]])) > 1e-9) no('合同でない（角 ' + a[i] + '）'); }); });
      const ks = f.map ? Object.keys(f.map) : [];
      ks.forEach(a => ks.forEach(b => { if (Math.abs(dist(P[a], P[b]) - dist(P[f.map[a]], P[f.map[b]])) > 1e-9) no('対応がずれている ' + a + b); }));
      (f.ask || []).forEach(s => { if (Math.abs(dist(P[s[0]], P[s[1]]) - s[2]) > 0.01) no('答えの長さ ' + s[0] + s[1] + '＝' + s[2] + '（測った長さ ' + dist(P[s[0]], P[s[1]]).toFixed(3) + '）'); });
      (f.askA || []).forEach(s => { if (Math.abs(ang(P[s[0]], P[s[1]], P[s[2]]) - s[3]) > 0.05) no('答えの角 ' + s[1] + '＝' + s[3] + '°（測った大きさ ' + ang(P[s[0]], P[s[1]], P[s[2]]).toFixed(2) + '°）'); });
    });
    return bad;
  };
  const arith = t => String(t).split('\n').every(line => {
    const s = line.replace(/°/g, '').replace(/−/g, '-').replace(/÷/g, '/').replace(/×/g, '*'), re = /[0-9+\-*/＝().]+/g;
    let m, ok = true;
    while ((m = re.exec(s))) {
      let r = m[0];
      if (/^[+\-*/]/.test(r) || /[+\-*/]$/.test(r)) continue;
      if (r[0] === '＝') r = r.slice(1);
      const parts = r.split('＝').filter(z => z !== '');
      if (parts.length < 2 || r.split('(').length !== r.split(')').length || /^[).]|[(.]$/.test(r)) continue;
      const v = parts.map(z => { try { return new Function('return ' + z)(); } catch (e) { return NaN; } });
      if (!v.every(w => Math.abs(w - v[0]) < 1e-9)) ok = false;
    }
    return ok;
  });
  const FIGCHK = '/* 平行と合同 第8時：すべての図で、辺の長さ・角の字、合同な組の対応、答えが、座標から測り直して合うか */ (' + figCheck + ')(' + J(FIGS) + ').length === 0';
  const ARITH = '/* 答えの文の中の、数だけの式が合うか */ (() => { const arith = ' + arith + '; return ' + J([T_W1, T_W2, T_E, T_D1, T_D2, T_D3, T_D4, T_D5, T_D6, T_D7, T_D8, T_D9, T_Q2, T_Q3, T_QC]) + '.every(arith); })()';
  // 学習課題の 5つの三角形：ア・イ・ウは合同（3辺が同じ。ウは向きが逆＝裏返し）、エは大きさがちがう（辺が半分）、オは辺の長さがちがう
  const triCheck = Ts => {
    const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]), sides = P => [d(P.A, P.B), d(P.B, P.C), d(P.C, P.A)], srt = a => a.slice().sort((x, y) => x - y);
    const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9), turn = P => (P.B[0] - P.A[0]) * (P.C[1] - P.A[1]) - (P.B[1] - P.A[1]) * (P.C[0] - P.A[0]);
    const s0 = sides(Ts[0]);
    return same(s0, sides(Ts[1])) && same(s0, sides(Ts[2])) && turn(Ts[0]) * turn(Ts[1]) > 0 && turn(Ts[0]) * turn(Ts[2]) < 0 &&
      same(srt(s0), [4, 5, 6]) && same(srt(sides(Ts[3])).map(v => v * 2), srt(s0)) && !same(srt(sides(Ts[4])), srt(s0)) && same(srt(sides(Ts[4])), [4, 5, 7]);
  };
  const TRIS = '/* 学習課題：ア・イ・ウは合同（ウは裏返し）、エ・オは合同でない */ (' + triCheck + ')(' + J([Z_ア, Z_イ, Z_ウ, Z_エ, Z_オ].map(z => z.pts)) + ')';

  IK.lesson('heikou-08', {
    unit: 'heikou', unitName: '平行と合同', no: '第8時', title: 'ぴったり重なる図形の、辺や角の関係を調べよう',
    summary: 'ぴったり重なる図形（合同な図形）の、対応する頂点・辺・角を読みとり、記号 ≡ で表す。考えようは、△ABC≡△DEF と △ABC≡△EDF の書き方のちがい。',
    head: '平行と合同　第8時',
    checks: [
      FIGCHK,
      TRIS,
      ARITH,
      // 演習 標準（4）四角形の内角の和 360°：360−(95+70+100)＝95　応用（6）周 21、CA＝21−6−8＝7　（7）∠C＝180−80−55＝45
      'near(360 - (95 + 70 + 100), 95) && near(21 - 6 - 8, 7) && near(180 - 80 - 55, 45) && near(180 * (4 - 2), 360)',
      // 応用（5）イ：2×6＝3×4（面積 12）で形がちがう。エ：3+4+5＝2+5+5（周 12）で辺の長さがちがう。ア・ウ・オは、どれも合同（面積・半径・1辺が決まれば、形も決まる）
      'near(2 * 6, 3 * 4) && near(3 + 4 + 5, 2 + 5 + 5) && near(3 * 4, 12)',
      // 入試（8）3x−2＝x+6 → x＝4、2x+1＝y+3 → y＝6。しらみつぶし（x は 1〜20、y は 1〜20）
      '(() => { const a = []; for (let x = 1; x <= 20; x++) for (let y = 1; y <= 20; y++) if (3 * x - 2 === x + 6 && 2 * x + 1 === y + 3) a.push([x, y]); return a.length === 1 && a[0][0] === 4 && a[0][1] === 6 && near(3 * 4 - 2, 10) && near(4 + 6, 10) && near(2 * 4 + 1, 9) && near(6 + 3, 9); })()',
      // 入試（9）折り返し：∠ADE＝(180−80)÷2＝50、∠A＝60、∠AED＝70、x＝180−140＝40（図の座標から測った x と同じ）
      'near((180 - 80) / 2, 50) && near(180 - 70 - 50, 60) && near(180 - 60 - 50, 70) && near(180 - 70 - 70, 40) && near(180 - 70 - 50, 180 - 70 - 50)',
      // 小テスト（3）∠B＝∠E＝70、∠C＝180−50−70＝60　チャレンジ x＝5、AB＝13、BC＝14、CA＝40−27＝13
      'near(180 - 50 - 70, 60) && (() => { const a = []; for (let x = 1; x <= 30; x++) if (2 * x + 3 === x + 8) a.push(x); return a.length === 1 && a[0] === 5 && near(2 * 5 + 3, 13) && near(3 * 5 - 1, 14) && near(40 - 13 - 14, 13) && near(5 + 8, 13); })()',
      // 発展：正三角形どうしの合同で、対応のさせ方は 3！＝6 通り（A に対応する頂点 3通り × B に対応する頂点 2通り）
      '(() => { const p = []; for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) for (const c of [0, 1, 2]) if (new Set([a, b, c]).size === 3) p.push([a, b, c]); return p.length === 6 && near(3 * 2 * 1, 6); })()'
    ],

    /* ================= 授業計画 ================= */
    plan: {
      type: '例（例題と練習）',
      aim: '合同な図形の意味と、対応する頂点・辺・角を理解し、記号 ≡ を使って表し、等しい辺の長さ・角の大きさを読みとれる。',
      flow: [
        { g: '導入', m: 3, scene: 'ペア学習', do: '前時の重要語句（補助線・平行線の性質・内角の和・外角の性質）を、ペアで1人1問ずつ出題し合う。', st: '言葉の意味を、自分の言葉で言う。', note: '静かに、時間を切って。緊張感をつくる。' },
        { g: '小テスト', m: 7, scene: '小テスト', do: '前時分の小テスト。自己採点と回収まで。', st: '静かに取り組む。', note: '5分＋答え合わせ・回収 2分。10点満点。チャレンジは別枠（正解で満点）。' },
        { g: '解説', m: 4, scene: '学習課題', do: 'めあてを書く。ア〜オの図形（辺の長さつき）から、ぴったり重なる組を見つける。個人→ペア。', q: ['ぴったり重なるのは、どれとどれ？　重ならないのは、どこがちがう？'], st: 'ア・イ・ウは重なる（ウは裏返す）。エは大きさ、オは辺の長さがちがう。', note: '切りぬいた図形を黒板で重ねて見せる。裏返してもよいことを確認。' },
        { g: '解説', m: 3, scene: 'ことば', do: '合同・対応・≡ を押さえる。空欄は、先生が言ってから書かせる。', q: ['重なった図形で、辺の長さや角の大きさは、どうなっている？'], st: '空欄に書き込む。', note: '重要語句は、先生が言い切る。≡ の書き方の決まりは、ここでは言わない。' },
        { g: '解説', m: 5, scene: '例題', do: '四角形 ABCD≡四角形 EFGH。対応する頂点を表に書き、FG の長さ・∠G の大きさを読みとり、≡ で表す。', q: ['頂点 A と重なるのは、どの頂点？　どうやって見つけた？'], st: '図を回したり、裏返したりして考える。辺 FG＝BC＝4cm、∠G＝∠C＝70°。', note: '数字は、先生が言ってから書かせる。' },
        { g: '演習', m: 2, scene: '演習① 考えようの提示', do: '進め方を伝える。ゴールは、「考えよう」（ワークシート裏）を全員が説明できること。立ち歩きOK、解答は教卓（考えようの答えはない）。', st: '', note: '「できた人が教える」ではなく「説明できるようになる」と伝える。' },
        { g: '演習', m: 5, scene: '演習② 基礎', do: '基礎（個人）。解いたら、教卓の解答で答え合わせ。早く終わったら、考えようへ。', st: '基礎 →（終わった人から）考えようへ。', note: '解答は教卓。セルフチェック。' },
        { g: '演習', m: 14, scene: '演習③ 考えよう＋標準（学び合い）', do: '立ち歩きで、対応の表と辺の長さをくらべ、説明し合う。先生は回って、気づきの言葉を拾い、必要なら短く全体に戻す。', st: '対応を書き出す → 辺の長さをくらべる → ≡ の書き方の意味を言う。', note: '判断：表がつくれない→共有／気づかない→ヒント1／止まる→ヒント2・3／残り5分→指名。答えは言わない。' },
        { g: '演習', m: 2, scene: '演習④ 方向性', do: '答えは示さず、方向性だけを一言で伝える（下の枠）。', st: '', note: '' },
        { g: '振り返り', m: 5, scene: '振り返り・回収', do: '今日わかったことを、ペアで1つずつ言い合う。ワークシートと演習プリントを回収（未完成でも出す）。', st: '今日わかったことを、口で言う。', note: '' }
      ],
      words: ['合同', '対応', '記号 ≡'],
      think: {
        q: '右の図の △ABC と △DEF は合同で、△ABC≡△DEF と書ける。△ABC≡△EDF と書いたら、どうなるだろう。辺の長さをもとに、調べよう。',
        views: [
          '△ABC≡△EDF と書くと、A と E、B と D、C と F が対応することになる。そのとき BC に対応する辺は DF になる。',
          'BC＝6cm、DF＝5cm で、長さがちがう。この図の三角形では、△ABC≡△EDF とは書けない。',
          '記号 ≡ は、対応する頂点を、同じ順に書く。順番を変えると、対応が変わって、ちがうことを表す。'
        ],
        hints: [
          '△ABC≡△EDF が正しいとすると、どの頂点とどの頂点が重なることになるか、書き出す。',
          '重なることになる辺の長さを、図から読みとって、くらべる。',
          '△ABC≡△DEF の対応と、くらべる。どこが変わったか。'
        ],
        direction: '「記号の並べ方に、どんな意味があるのか、自分のことばで言えるようにしておこう。これから、合同を使って説明するときにも、大切になるよ。」'
      },
      manabi: [
        { kind: '説明', text: '基礎のあと：「対応する」とは、どういうことか、図を使って、隣の人に30秒で説明する。' },
        { kind: '比べる', text: '標準のあと：（3）で、対応する頂点を、どうやって見つけたか、友達と比べる。' },
        { kind: '教える', text: '最後：解けなかった問題を、できた人に聞く。問題と人の名前を書く。' }
      ],
      see: [
        ['思考・判断・表現', '対応する辺の長さをくらべて、記号の書き方の意味を説明しているか（考えよう）。'],
        ['知識・技能', '対応する頂点・辺・角を、図や記号から読みとれるか。'],
        ['学び合い', 'わからないことを聞き、説明するために動いているか。']
      ],
      tips: [
        ['図の見た目の位置（左上どうしなど）で、対応を決める', '裏返したり回したりして重なる。辺の長さや角の大きさの印から決めさせる。'],
        ['≡ の頂点の順番を、気にせずに書く', '「1番目どうし、2番目どうしが対応」と、指でたどらせる。'],
        ['裏返して重なるものを、合同でないと考える', '切りぬいた図形を裏返して重ねて見せる。']
      ],
      prep: ['切りぬいた三角形（ア〜ウ）を黒板用に（ウは裏返して重ねる）', '小テスト（前時分）／今日の小テストは、次時のはじめ用', '教卓：3点セットの解答（考えようの答えは載せない）']
    },

    /* ================= ワークシート（両面） ================= */
    ws: [
      // ---- 表 ----
      M('ぴったり重なる図形の、辺や角の関係を調べよう'),
      K('学習課題', '下のア〜オの図形のうち、ぴったり重ねることができる（裏返してもよい）図形の組を見つけよう。\n重ならない図形は、どこがちがうだろう。', 2),
      F(6, GEO(Z_ア), GEO(Z_イ), GEO(Z_ウ), GEO(Z_エ), GEO(Z_オ)),
      T('', '【ぴったり重なる組】', 1),
      B(2, T_W1),
      T('', '【重ならない図形は、どこがちがうか】', 1),
      B(3, T_W2),
      G(1),
      WD('平面上の 2つの図形で、一方を移動して、他方にぴったり重ねることができるとき、この 2つの図形は{{合同}}であるという。\n合同な図形で、重なり合う頂点・辺・角を、それぞれ{{対応}}する頂点・辺・角という。\n合同な図形では、対応する線分の{{長さ}}は等しく、対応する角の{{大きさ}}も等しい。\n合同であることは、記号 {{≡}} を使って、△ABC≡△DEF のように書く。', 6),
      G(1),
      K('例題', '右の図で、四角形 ABCD と四角形 EFGH は合同である。\n（1）対応する頂点を、表に書こう。（2）辺 FG の長さ　（3）∠G の大きさ\n（4）合同であることを、記号 ≡ で表そう。', 3),
      TB('頂点', ['A', 'B', 'C', 'D'], [['対応する頂点', ['{{E}}', '{{F}}', '{{G}}', '{{H}}']]], { hw: 36, width: 60 }),
      C2([
        T('', '【（2）〜（4）】', 1),
        B(6, T_E)
      ], [
        F(8, GEO(Z_E))
      ], '3:2'),
      BR(),

      // ---- 裏：考えよう ----
      K('考えよう', '右の図の △ABC と △DEF は合同で、△ABC≡△DEF と書ける。\n△ABC≡△EDF と書いたら、どうなるだろう。辺の長さをもとに、調べよう。', 3),
      F(9, GEO(Z_K)),
      T('①', '頂点 A、B、C に対応する頂点を、表に書こう。', 1),
      TB('頂点', ['A', 'B', 'C'], [['△ABC≡△DEF', ['', '', '']], ['△ABC≡△EDF', ['', '', '']]], { hw: 44 }),
      T('②', '△ABC≡△EDF と書いたとき、辺 BC に対応する辺は、どの辺か。その長さを図から読みとり、BC の長さとくらべよう。', 2),
      B(5, ''),
      T('③', '△ABC≡△DEF と △ABC≡△EDF は、同じ意味だろうか。わけも書こう。', 2),
      B(5, ''),
      T('発展', '演習まで解き終わった人は、考えてみよう！\n1辺 4cm の正三角形 ABC と、1辺 4cm の正三角形 DEF は合同である。△ABC≡△DEF のほかに、対応のさせ方は、全部で何通りあるだろう。', 4),
      B(3, '')
    ],

    /* ================= 演習プリント（両面） ================= */
    dr: [
      HD('演習', 'ことばを使って、合同な図形の辺や角を読みとろう。'),
      WD('① 一方を移動して、他方にぴったり重ねることができる 2つの図形を、{{合同}}な図形という。\n② 重なり合う頂点・辺・角を、{{対応}}する頂点・辺・角という。\n③ 合同な図形では、対応する線分の{{長さ}}、対応する角の{{大きさ}}は、それぞれ等しい。\n④ 合同を表す記号は {{≡}} である。', 4, { label: 'ことば確認' }),
      HD('基礎', '次の問いに答えよう。'),
      C2([
        T('（1）', '右の図で、△ABC≡△DEF である。\n① 頂点 B に対応する頂点　　② 辺 DE の長さ\n③ 辺 EF の長さ　　　　　　④ ∠F の大きさ\n⑤ 辺 AC に対応する辺', 5),
        B(3, T_D1)
      ], [
        F(8, GEO(Z_D1))
      ], '3:2'),
      C2([
        T('（2）', '右の図で、四角形 ABCD≡四角形 EFGH である。\n① 辺 EF の長さ　　② 辺 GH の長さ\n③ ∠F の大きさ　　④ 辺 AD に対応する辺', 4),
        B(3, T_D2)
      ], [
        F(7, GEO(Z_D2))
      ], '3:2'),
      MA('【説明】「対応する」とは、どういうことか、図を使って、隣の人に30秒で説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 3),
      HD('標準', '次の問いに答えよう。'),
      C2([
        T('（3）', '右の図の 2つの三角形は合同である。このことを、記号 ≡ を使って表そう。また、辺 AC に対応する辺を答えよう。', 4),
        B(3, T_D3)
      ], [
        F(7, GEO(Z_D3))
      ], '3:2'),
      T('（4）', '四角形 ABCD≡四角形 EFGH で、∠A＝95°、∠B＝70°、∠C＝100° である。∠H の大きさを求めよう。', 2),
      B(2, T_D4),
      MA('【比べる】（3）で、対応する頂点を、どうやって見つけたか、友達と比べよう。', 2),
      BR(),

      HD('応用', '合同の意味にもどって、考えよう。'),
      T('（5）', '次のア〜オのうち、いつでも合同といえるものを、すべて選ぼう。合同といえないものは、そのわけも書こう。\nア 合同な 2つの図形の面積は、等しい。　イ 面積が等しい 2つの長方形は、合同である。\nウ 半径が等しい 2つの円は、合同である。　エ 周の長さが等しい 2つの三角形は、合同である。\nオ 1辺の長さが等しい 2つの正方形は、合同である。', 5),
      B(4, T_D5),
      T('（6）', '△ABC≡△DEF で、AB＝6cm、BC＝8cm で、△ABC の周の長さは 21cm である。辺 DF の長さを求めよう。', 2),
      B(2, T_D6),
      T('（7）', '△ABC≡△DEF で、∠D＝80°、∠B＝55° である。∠F の大きさを求めよう。', 2),
      B(2, T_D7),
      HD('入試レベル', '合同な図形の性質を使って、考えよう。'),
      C2([
        T('（8）', '右の図で、△ABC≡△DEF である。x、y の値を求めよう。', 2),
        B(5, T_D8)
      ], [
        F(7, GEO(Z_D8))
      ], '3:2'),
      C2([
        T('（9）', '△ABC を、頂点 A が辺 BC 上の点 A′ に重なるように、線分 DE を折り目として折った（図）。∠x の大きさを求めよう。', 4),
        B(5, T_D9)
      ], [
        F(9, GEO(Z_D9))
      ], '3:2')
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '合同な図形で、重なり合う頂点・辺・角を、それぞれ何というか。また、合同を表す記号を書こう。（3点）', 2),
      B(2, T_Q1),
      C2([
        T('（2）', '右の図で、△ABC≡△DEF である。（3点）\n① 頂点 A に対応する頂点\n② 辺 EF の長さ\n③ ∠E の大きさ\n④ 辺 DF に対応する辺', 5),
        B(2, T_Q2)
      ], [
        F(8, GEO(Z_Q2))
      ], '3:2'),
      T('（3）', '△ABC≡△DEF で、∠A＝50°、∠E＝70° である。∠F の大きさを求めよう。（2点）', 2),
      B(3, T_Q3),
      T('（4）', '次のア〜エのうち、いつでも合同といえるものを、すべて選ぼう。（2点）\nア 半径が等しい 2つの円　　イ 面積が等しい 2つの正方形\nウ 周の長さが等しい 2つの長方形　　エ 1辺の長さが等しい 2つの正三角形', 3),
      B(2, T_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC≡△DEF で、AB＝(2x+3)cm、DE＝(x+8)cm、BC＝(3x−1)cm である。△ABC の周の長さが 40cm のとき、辺 DF の長さを求めよう。', 3),
      B(6, T_QC)
    ]
  });
})();
