/* 平行と合同（新しい形） 第7時：補助線をひいて、角度のなぞを解こう。 元：data/lesson_heikou_07.js（前の形・45KB）。題・めあて・数値・図の関数・checks を引きつぎ、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（ℓ∥m の間の折れ線、35° と 50° から ∠x。補助線をひく前の図だけを印刷。補助線は、答え（解答を表示したとき）に赤い点線で出る）。
     個人3分 → ペア3分 → ことば（補助線・平行線の性質・内角の和・外角）→ 例題（ブーメラン形。BD をのばす補助線。空欄あり）。
   ・演習プリントは表裏：表＝確かめる 2問（図1〜図4）・使ってみる 4問（図5〜図8）／裏＝ひろげる 1問（元の考えよう：ア〜ウの ∠x と、補助線の共通点。答えは載せない）・チャレンジ★★ 1問（元の入試（6）正五角形。ヒントカードつき）。
     元の基礎（1）①②→（1）図1・図2、③→（2）図3、（2）図4はブーメラン形を新しく作った（60°・40°・45° → 145°）。元の標準（2）（3）→（3）（4）、応用（4）（5）→（5）（6）。
     元の応用（5）の「② ∠A+∠B＝∠C+∠D になるわけ」・入試（7）星形・発展・授業計画は使わない。
   ・考えよう（演習プリント（7））の答え（70°・40°・20°、補助線の共通点）は、どこにも書かない。図にも、補助線を出さない。ことば欄にも、「補助線のねらい」は書かない。
   ・図は、角度から座標を出して描いた（GEO）。checks では、すべての図（18）で、座標から角を測り直して、図の字・答えと合うか、平行線・等しい辺のしるしが本当に平行・等しいか、点が線の上にあるかを確かめた。
   検算：node tools/verify.cjs heikou_new-07　／　見た目：node tools/check.cjs <出力先> heikou_new-07 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 角度から座標をつくる道具 ----------------
     mv：点 p から、向き d（度。右が 0、上が 90）に r 進んだ点　toY：p から向き d に進んで、高さ y に着く点　meet：2本の直線（p・向き dp／q・向き dq）の交点
     dirTo：p から q へ向かう向き（度）　cap：図の左上に見出し（図1・ア…）をつける */
  const rad = d => d * Math.PI / 180;
  const mv = (p, d, r) => [p[0] + r * Math.cos(rad(d)), p[1] + r * Math.sin(rad(d))];
  const toY = (p, d, y) => mv(p, d, (y - p[1]) / Math.sin(rad(d)));
  const meet = (p, dp, q, dq) => {
    const u = [Math.cos(rad(dp)), Math.sin(rad(dp))], v = [Math.cos(rad(dq)), Math.sin(rad(dq))], w = [q[0] - p[0], q[1] - p[1]];
    return mv(p, dp, (w[0] * v[1] - w[1] * v[0]) / (u[0] * v[1] - u[1] * v[0]));
  };
  const dirTo = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
  // 平行線（点線）が頂点を通るとき、その角の字は、点線にかさならないように、点線で分かれた 2つの角のうち、ひろいほうの中にかく
  const sideTxt = (p, d1, d2, H, text, rr) => {
    const nrm = d => ((d % 360) + 540) % 360 - 180, a1 = nrm(d1 - H), a2 = nrm(d2 - H), beta = H + (Math.abs(a1) >= Math.abs(a2) ? a1 : a2) / 2;
    return { p, t: text, dx: (rr || 8.5) * Math.cos(rad(beta)), dy: -(rr || 8.5) * Math.sin(rad(beta)) };
  };
  // 図の見出し（図1・ア…）：pos＝'tl'（図の左上。頂点の字や線から離す）／'bl'（左下）
  const cap = (spec, text, pos) => {
    const ps = Object.values(spec.pts), x = Math.min(...ps.map(p => p[0])), y = Math.max(...ps.map(p => p[1])), y0 = Math.min(...ps.map(p => p[1]));
    spec.pts.CAP = pos === 'bl' ? [x - 0.1, y0 - 0.4] : [x - 0.1, y + 0.45];
    spec.txt = (spec.txt || []).concat([{ p: 'CAP', t: text, anchor: 'start', size: 3.4, dy: pos === 'bl' ? 2.5 : -4.5 }]);
    return spec;
  };

  /* ---------------- 図の部品 ----------------
     平行線 ℓ（上。y＝HL）と m（下。y＝0）、x は x0〜x1。平行のしるし（＞）は、右はしに 1つずつ */
  const lines2 = (HL, x0, x1) => ({ L1: [x0, HL], L2: [x1, HL], M1: [x0, 0], M2: [x1, 0] });
  const parMarks = (HL, x1) => [[[x1 - 1.7, HL], [x1 - 0.6, HL], 1], [[x1 - 1.7, 0], [x1 - 0.6, 0], 1]];
  const LM = [['L1', 'L2', { lab: 'ℓ' }], ['M1', 'M2', { lab: 'm' }]];
  const FIGS = [];   // 検算（checks）に渡す、すべての図
  const reg = (name, spec) => { spec.name = name; FIGS.push(spec); return spec; };
  const ON = [['A', 'L1', 'L2'], ['C', 'M1', 'M2']];   // 点 A が ℓ 上、点 C が m 上にあること（検算用）

  // 折れ線（1回）：ℓ上の A、m上の C、間の E。∠A＝a、∠C＝c、∠AEC＝a+c（A も C も E より左）。lab＝{ A, E, C } の字。解答では、E を通る平行線（赤い点線）
  const zig1 = (name, a, c, lab, xv) => {
    const HL = 4.2, E = [5.4, 1.8], A = toY(E, 180 - a, HL), C = toY(E, 180 + c, 0), x0 = Math.min(A[0], C[0]) - 1.5, x1 = E[0] + 2.6;
    const pts = Object.assign({ A, E, C, D1: [E[0] - 3.1, E[1]], D2: [E[0] + 2.4, E[1]] }, lines2(HL, x0, x1));
    return reg(name, {
      pts, segs: [['A', 'E'], ['E', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 35, 3.8], C: ['C', 225] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'C', a: 'M2', b: 'E', t: lab.C }, { at: 'E', a: 'A', b: 'C', v: lab.E }],
      txt: [sideTxt('E', 180 - a, 180 + c, 180, lab.E)],
      a: { segs: [['D1', 'D2', { dash: 1 }]], ang: [{ at: 'E', a: 'D1', b: 'A', t: a + '°', r: 12, lr: 19 }, { at: 'E', a: 'D1', b: 'C', t: c + '°', r: 12, lr: 19 }] },
      xv: xv == null ? a + c : xv
    });
  };
  // ブーメラン形 A-B-D-C（D がへこんだ頂点）：∠BAC＝A0、∠ABD＝b、∠ACD＝c、∠BDC＝A0+b+c。解答では、BD をのばして AC との交点 E（赤い点線）
  const dart = (name, A0, b, c, lab, xv, lrC) => {
    const A = [0, 6], B = mv(A, -90 - A0 / 2, 6.2), C = mv(A, -90 + A0 / 2, 5.8);
    const dBD = dirTo(B, A) - b, dCD = dirTo(C, A) + c, D = meet(B, dBD, C, dCD), E = meet(B, dBD, A, dirTo(A, C));
    return reg(name, {
      pts: { A, B, C, D, E }, segs: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'C']],
      vl: { A: ['A', 90], B: ['B', 200], C: ['C', 340], D: ['D', 115, 3.8] },
      ang: [{ at: 'A', a: 'B', b: 'C', t: lab.A, lr: Math.round(560 / A0) }, { at: 'B', a: 'A', b: 'D', t: lab.B, r: 6, lr: 11 }, { at: 'C', a: 'A', b: 'D', t: lab.C, r: 6, lr: lrC || 11 }, { at: 'D', a: 'B', b: 'C', t: lab.D, lr: 9 }],
      a: { segs: [['D', 'E', { dash: 1 }]], vl: { E: ['E', 40] }, ang: [{ at: 'E', a: 'D', b: 'C', r: 6, v: (A0 + b) + '°' }], txt: [{ p: 'E', t: (A0 + b) + '°', dx: 8, dy: 3.5 }] },
      xv
    });
  };
  // 折れ線（2回）：A（ℓ上）→E→F→C（m上）。∠A＝a、∠AEF＝e、∠C＝c、∠EFC＝e+c−a（N の字）
  const zig2 = (name, a, e, c, lab) => {
    const HL = 5, A = [2, HL], E = toY(A, -a, 3.7), F = toY(E, 180 - a + e, 1.7), C = toY(F, -c, 0), x0 = 0.3, x1 = Math.max(E[0], C[0]) + 2.2;
    return reg(name, {
      pts: Object.assign({ A, E, F, C }, lines2(HL, x0, x1)), segs: [['A', 'E'], ['E', 'F'], ['F', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 0], F: ['F', 180], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'E', a: 'A', b: 'F', t: lab.E }, { at: 'F', a: 'E', b: 'C', t: lab.F }, { at: 'C', a: 'M1', b: 'F', t: lab.C, r: 5 }],
      xv: e + c - a
    });
  };
  // 折れ線（2回・コの字）：A→E→F→C。∠A＝a、∠AEF＝e、∠EFC＝f、∠C＝c。e+f＝a+c+180。F は、E の真下（e＝a+90 のとき）。解答では、E・F を通る平行線
  const kou = (name, a, e, f, lab) => {
    const HL = 6.2, A = [2, HL], E = toY(A, -a, 4.6), F = toY(E, 180 - a + e, 2.0), C = toY(F, e - a + f, 0), x0 = 0.3, x1 = Math.max(E[0], F[0]) + 3.4;
    const pts = Object.assign({ A, E, F, C, E1: [E[0] - 3, E[1]], E2: [E[0] + 2.2, E[1]], F1: [F[0] - 3, F[1]], F2: [F[0] + 2.2, F[1]] }, lines2(HL, x0, x1));
    return reg(name, {
      pts, segs: [['A', 'E'], ['E', 'F'], ['F', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 35, 3.8], F: ['F', 325, 3.8], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'E', a: 'A', b: 'F', t: lab.E }, { at: 'F', a: 'E', b: 'C', t: lab.F }, { at: 'C', a: 'M2', b: 'F', t: lab.C }],
      a: { segs: [['E1', 'E2', { dash: 1 }], ['F1', 'F2', { dash: 1 }]], ang: [{ at: 'E', a: 'E1', b: 'A', t: a + '°', r: 8, lr: 15 }, { at: 'E', a: 'E1', b: 'F', v: (e - a) + '°', r: 8 }, { at: 'F', a: 'F1', b: 'E', v: (180 - e + a) + '°', r: 8 }, { at: 'F', a: 'F1', b: 'C', t: (f - 180 + e - a) + '°', r: 8, lr: 15 }] },
      xv: f
    });
  };
  // 折れ線（3回）：A→E→F→G→C。∠A＝a、∠AEF＝e、∠EFG＝f、∠FGC＝g、∠C＝c。a+f+c＝e+g
  const zig3 = (name, a, e, f, g, lab) => {
    const HL = 5.4, A = [1.6, HL], E = toY(A, -a, 4.2), F = toY(E, 180 - a + e, 2.8), G = toY(F, e - a - f, 1.2), C = toY(G, e - a - f + 180 + g, 0), x0 = 0.2, x1 = Math.max(E[0], G[0]) + 3.2;
    const pts = Object.assign({ A, E, F, G, C, E1: [E[0] - 3, E[1]], E2: [E[0] + 2.2, E[1]], F1: [F[0] - 3, F[1]], F2: [F[0] + 2.2, F[1]], G1: [G[0] - 3, G[1]], G2: [G[0] + 2.2, G[1]] }, lines2(HL, x0, x1));
    return reg(name, {
      pts, segs: [['A', 'E'], ['E', 'F'], ['F', 'G'], ['G', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 35, 3.8], F: ['F', 145, 3.8], G: ['G', 325, 3.8], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'E', a: 'A', b: 'F', v: lab.E }, { at: 'F', a: 'E', b: 'G', v: lab.F }, { at: 'G', a: 'F', b: 'C', v: lab.G }, { at: 'C', a: 'M2', b: 'G', t: lab.C }],
      txt: [sideTxt('E', 180 - a, 180 - a + e, 180, lab.E), sideTxt('F', e - a, e - a - f, 0, lab.F), sideTxt('G', e - a - f + 180, e - a - f + 180 + g, 180, lab.G)],
      a: { segs: [['E1', 'E2', { dash: 1 }], ['F1', 'F2', { dash: 1 }], ['G1', 'G2', { dash: 1 }]] },
      xv: f
    });
  };
  // 45°の三角定規 ABC（∠C＝90°、∠A＝∠B＝45°）：A が ℓ上、C が m上。ℓ と AB のなす角が p のとき、m と CB のなす角は 45−p。解答では、B を通る平行線
  const ruler = (name, p, lab) => {
    const HL = 4.2, A = [1.2, HL], len = HL / Math.sin(rad(p + 45)), C = mv(A, -(p + 45), len), Bp = mv(A, -p, len * Math.SQRT2), x1 = Bp[0] + 2.6;
    const pts = Object.assign({ A, B: Bp, C, N1: [Bp[0] - 3.2, Bp[1]], N2: [Bp[0] + 2.2, Bp[1]] }, lines2(HL, 0.2, x1));
    return reg(name, {
      pts, segs: [['A', 'B'], ['A', 'C'], ['C', 'B']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], B: ['B', 35, 3.8], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'B', t: p + '°', r: 9 }, { at: 'A', a: 'B', b: 'C', t: '45°', r: 5, lr: 10 }, { at: 'B', a: 'A', b: 'C', t: '45°', r: 5 }, { at: 'C', a: 'A', b: 'B', right: true }, { at: 'C', a: 'M2', b: 'B', t: lab.C, r: 6, lr: 11 }],
      a: { segs: [['N1', 'N2', { dash: 1 }]], ang: [{ at: 'B', a: 'N1', b: 'A', t: p + '°', r: 7, lr: 14 }, { at: 'B', a: 'N1', b: 'C', t: (45 - p) + '°', r: 7, lr: 14 }] },
      xv: 45 - p
    });
  };
  // 正三角形 ABC：B が ℓ上、C が m上。ℓ と BA のなす角が a のとき、m と CA のなす角は 60−a。解答では、A を通る平行線
  const eqtri = (name, a, lab) => {
    const HL = 4.4, Bp = [1.4, HL], s = HL / Math.sin(rad(a + 60)), C = mv(Bp, -(a + 60), s), A = mv(Bp, -a, s), x1 = A[0] + 2.6;
    const pts = Object.assign({ A, B: Bp, C, N1: [A[0] - 3.2, A[1]], N2: [A[0] + 2.2, A[1]] }, lines2(HL, 0.2, x1));
    return reg(name, {
      pts, poly: 'ABC', segs: LM, par: parMarks(HL, x1), tick: [['A', 'B', 1], ['B', 'C', 1], ['C', 'A', 1]], on: [['B', 'L1', 'L2'], ['C', 'M1', 'M2']],
      vl: { A: ['A', 35, 3.8], B: ['B', 135], C: ['C', 270] },
      ang: [{ at: 'B', a: 'L2', b: 'A', t: a + '°', r: 8 }, { at: 'C', a: 'M2', b: 'A', t: lab.C, r: 6, lr: 10 }],
      a: { segs: [['N1', 'N2', { dash: 1 }]], ang: [{ at: 'A', a: 'N1', b: 'B', t: a + '°', r: 7, lr: 14 }, { at: 'A', a: 'N1', b: 'C', t: (60 - a) + '°', r: 7, lr: 14 }] },
      xv: 60 - a
    });
  };
  // リボン形：AD と BC が O で交わる。∠A＝α、∠B＝β、∠C＝γ、∠D＝α+β−γ
  const ribbon = (name, al, be, ga, lab) => {
    const de = al + be - ga, ao = 180 - al - be, O = [0, 0], OB = 3.2, OA = OB * Math.sin(rad(be)) / Math.sin(rad(al)), OD = 2.3, OC = OD * Math.sin(rad(de)) / Math.sin(rad(ga));
    const A = mv(O, 145, OA), Bp = mv(O, 145 + ao, OB), C = mv(O, 145 + ao - 180, OC), D = mv(O, 325, OD);
    return reg(name, {
      pts: { A, B: Bp, C, D, O }, segs: [['A', 'D'], ['B', 'C'], ['A', 'B'], ['C', 'D']],
      vl: { A: ['A', 135], B: ['B', 225], C: ['C', 45], D: ['D', 315], O: ['O', 90, 3] },
      ang: [{ at: 'A', a: 'O', b: 'B', t: lab.A, r: 6, lr: 11 }, { at: 'B', a: 'O', b: 'A', t: lab.B, r: 6, lr: 11 }, { at: 'C', a: 'O', b: 'D', t: lab.C, r: 6, lr: 11 }, { at: 'D', a: 'O', b: 'C', t: lab.D, r: 6, lr: 11 }],
      xv: de
    });
  };
  // 正五角形 ABCDE：A が ℓ上、C が m上。m と CB のなす角が c のとき、ℓ と AE のなす角は c−36。解答では、B を通る平行線
  const pent = (name, c, lab) => {
    const a = 108 - c, s = 3, V = [[0, 0]];
    for (let k = 0; k < 4; k++) V.push(mv(V[k], -a - 72 * k, s));
    const [A, Bp, Cp, D, E] = V, x0 = Math.min(A[0], E[0], D[0]) - 2.2, x1 = Math.max(A[0], Bp[0], Cp[0]) + 3.2;
    const pts = { A, B: Bp, C: Cp, D, E, N1: [Bp[0] - 3.4, Bp[1]], N2: [Bp[0] + 2.2, Bp[1]], L1: [x0, A[1]], L2: [x1, A[1]], M1: [x0, Cp[1]], M2: [x1, Cp[1]] };
    return reg(name, {
      pts, poly: 'ABCDE', segs: LM, par: [[[x1 - 1.7, A[1]], [x1 - 0.6, A[1]], 1], [[x1 - 1.7, Cp[1]], [x1 - 0.6, Cp[1]], 1]], tick: [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'E', 1], ['E', 'A', 1, 0.25]], on: ON,
      vl: { A: ['A', 60], B: ['B', 35, 3.8], C: ['C', 315], D: ['D', 195], E: ['E', 180] },
      ang: [{ at: 'C', a: 'M2', b: 'B', t: c + '°', r: 7 }, { at: 'A', a: 'L1', b: 'E', t: lab.A, r: 7, lr: 11 }],
      a: { segs: [['N1', 'N2', { dash: 1 }]], ang: [{ at: 'B', a: 'N1', b: 'A', t: a + '°', r: 7, lr: 14 }, { at: 'B', a: 'N1', b: 'C', t: c + '°', r: 7, lr: 14 }] },
      xv: c - 36
    });
  };

  /* ---------------- 問題の図 ---------------- */
  const Z_T = zig1('今日の問い', 35, 50, { A: '35°', E: 'x', C: '50°' });                        // ∠x＝85°
  const Z_E = dart('例題', 40, 35, 30, { A: '{{40°}}', B: '{{35°}}', C: '{{30°}}', D: 'x' }, 105);   // ∠BDC＝105°
  const Z_TA = cap(zig2('ひろげる ア', 35, 80, 25, { A: '35°', E: '80°', F: 'x', C: '25°' }), 'ア');          // ∠x＝70°
  const Z_TI = cap(dart('ひろげる イ', 50, 40, 35, { A: '50°', B: 'x', C: '35°', D: '125°' }, 40), 'イ');       // ∠ABD＝40°
  const Z_TU = cap(ruler('ひろげる ウ', 25, { C: 'x' }), 'ウ', 'bl');                                             // ∠x＝20°
  for (const z of [Z_TI, Z_TU, Z_TA]) delete z.a;   // ひろげるの図には、答え（補助線）を出さない
  const Z_D1 = cap(zig1('確かめる（1）図1', 40, 30, { A: '40°', E: 'x', C: '30°' }), '図1');                    // 70°
  const Z_D2 = cap(zig1('確かめる（1）図2', 55, 40, { A: '55°', E: '95°', C: 'x' }, 40), '図2');                // 40°
  const Z_D3 = cap(dart('確かめる（2）図3', 50, 35, 40, { A: '50°', B: '35°', C: '40°', D: 'x' }, 125, 16), '図3');  // 125°
  const Z_D4 = cap(dart('確かめる（2）図4', 60, 40, 45, { A: '60°', B: '40°', C: '45°', D: 'x' }, 145, 15), '図4');    // 145°（新しく作った）
  const Z_D5 = cap(kou('使ってみる（3）図5', 35, 125, 120, { A: '35°', E: '125°', F: 'x', C: '30°' }), '図5');      // 120°
  const Z_D6 = cap(eqtri('使ってみる（4）図6', 24, { C: 'x' }), '図6');                                             // 36°
  const Z_D7 = cap(zig3('使ってみる（5）図7', 35, 80, 100, 95, { A: '35°', E: '80°', F: 'x', G: '95°', C: '40°' }), '図7');   // 100°
  const Z_D8 = cap(ribbon('使ってみる（6）図8', 65, 45, 30, { A: '65°', B: '45°', C: '30°', D: 'x' }), '図8');       // 80°
  const Z_D9 = pent('チャレンジ（8）', 58, { A: 'x' });                                              // 22°
  const Z_Q1 = cap(zig1('小テスト（1）', 28, 47, { A: '28°', E: 'x', C: '47°' }), '図1');                 // 75°
  const Z_Q2 = cap(dart('小テスト（2）', 60, 25, 30, { A: '60°', B: '25°', C: '30°', D: 'x' }, 115), '図2');   // 115°
  const Z_Q3 = cap(zig1('小テスト（3）', 45, 65, { A: 'x', E: '110°', C: '65°' }, 45), '図3');             // 45°
  const Z_QC = zig2('小テスト チャレンジ', 28, 95, 21, { A: '28°', E: '95°', F: 'x', C: '21°' });   // 88°
  for (const z of [Z_Q1, Z_Q2, Z_Q3, Z_QC]) delete z.a;

  /* ---------------- 答えの文（画面にも検算にも、同じ文字列を使う） ---------------- */
  const T_W = '（例）E を通り ℓ に平行な\n直線をひく。\n錯角が等しいから\n∠x＝35°+50°＝85°';
  const T_E = 'BD をのばし、AC との\n交点を E とする。\n△ABE の外角だから\n　∠DEC＝40°+35°＝75°\n△DEC の外角だから\n　∠x＝75°+30°＝105°';
  const T_D1 = '図1　40°+30°＝70°\n図2　95°−55°＝40°';
  const T_D2 = '図3　50°+35°+40°＝125°\n図4　60°+40°+45°＝145°';
  const T_D3 = 'E・F を通る ℓ の平行線\n125°−35°＝90°、180°−90°＝90°\n∠x＝90°+30°＝120°';
  const T_D4 = 'A を通る ℓ の平行線\n24°+∠x＝60°\n∠x＝60°−24°＝36°';
  const T_D5 = 'E・F・G を通る平行線\n35°+∠x+40°＝80°+95°\n∠x＝175°−75°＝100°';
  const T_D6 = '∠AOB＝180°−65°−45°＝70°\n∠COD＝70°（対頂角）\n∠x＝180°−70°−30°＝80°';
  const T_D8 = 'B を通る ℓ の平行線\n108°＝∠a+58° より\n∠a＝108°−58°＝50°\n（∠a は ℓ と AB の角）\n∠x＝180°−108°−50°＝22°';
  const T_Q1 = 'E を通り ℓ に平行な直線をひく。\n∠x＝28°+47°＝75°';
  const T_Q2 = 'BD を延長して AC と交わらせる（または AD を延長する）。\n∠x＝60°+25°+30°＝115°';
  const T_Q3 = 'E を通り ℓ に平行な直線をひく。\n∠x+65°＝110°　　∠x＝110°−65°＝45°';
  const T_QC = 'E、F を通り ℓ に平行な直線をひくと\n28°+∠x＝95°+21°\n∠x＝116°−28°＝88°';

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     figCheck：すべての図で、角を座標から測り直して、図の字（35° など）・x の答え・平行・等しい辺・点が線の上にあることを確かめる
     arith：答えの文の中の、数だけの式（35°+50°＝85° など）が計算として合うか */
  const figCheck = F => {
    const ang = (P, Q, R) => { const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]), b = Math.atan2(R[1] - Q[1], R[0] - Q[0]); const d = Math.abs(a - b) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
    const cr = (p, q, r, s) => (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
    return F.length === 18 && F.every(f => {
      const P = f.pts, pt = k => (typeof k === 'string' ? P[k] : k), len = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
      const angOK = L => (L || []).every(an => {
        const m = ang(pt(an.a), P[an.at], pt(an.b));
        if (an.right) return Math.abs(m - 90) < 0.05;
        const t = String(an.t != null ? an.t : an.v != null ? an.v : '').replace(/[{}]/g, '');
        if (t === 'x') return Math.abs(m - f.xv) < 0.05;
        const v = parseFloat(t);
        return isNaN(v) || Math.abs(m - v) < 0.05;
      });
      const par = (f.par || []).every(p => Math.abs(cr(pt(p[0]), pt(p[1]), pt(f.par[0][0]), pt(f.par[0][1]))) < 1e-9);
      const on = (f.on || []).every(o => Math.abs(cr(P[o[1]], P[o[2]], P[o[1]], P[o[0]])) < 1e-9);
      const tk = f.tick || [], tickOK = tk.every(t => Math.abs(len(t[0], t[1]) - len(tk[0][0], tk[0][1])) < 1e-9);
      const xs = (f.ang || []).filter(an => an.t === 'x').length;
      return angOK(f.ang) && angOK(f.a && f.a.ang) && xs <= 1 && par && on && tickOK && Number.isFinite(f.xv);
    });
  };
  const arith = t => String(t).split('\n').every(line => {
    const s = line.replace(/°/g, '').replace(/−/g, '-'), re = /[0-9+\-＝().]+/g;
    let m, ok = true;
    while ((m = re.exec(s))) {
      let r = m[0];
      if (/^[+\-]/.test(r) || /[+\-]$/.test(r)) continue;   // 文字（x や ∠A）のとなりの、とちゅうの式は、とばす
      if (r[0] === '＝') r = r.slice(1);
      const parts = r.split('＝').filter(z => z !== '');
      if (parts.length < 2 || r.split('(').length !== r.split(')').length || /^[).]|[(.]$/.test(r)) continue;
      const v = parts.map(z => { try { return new Function('return ' + z)(); } catch (e) { return NaN; } });
      if (!v.every(w => Math.abs(w - v[0]) < 1e-9)) ok = false;
    }
    return ok;
  });
  const FIGCHK = '/* 平行と合同 第7時：すべての図（18）で、角を座標から測り直して、図の字・答え・平行・等しい辺・点の位置が合うか */ (' + figCheck + ')(' + J(FIGS) + ')';
  const ARITH = '/* 答えの文の中の、数だけの式（35°+50°＝85° など）が合うか */ (() => { const arith = ' + arith + '; return ' + J([T_W, T_E, T_D1, T_D2, T_D3, T_D4, T_D5, T_D6, T_D8, T_Q1, T_Q2, T_Q3, T_QC]) + '.every(arith); })()';
  // 小さい図（演習プリントの、4つならべた図）：字・弧・字をおく距離を 0.8 倍、字の大きさ 2.6、まわりの余白 4 にして、図を大きくする
  const compact = spec => {
    const f = 0.8, fix = src => {
      if (!src) return;
      (src.ang || []).forEach(an => { an.r = (an.r || (an.right ? 3.6 : 5)) * f; if (an.lr != null) an.lr *= f; });
      Object.keys(src.vl || {}).forEach(n => { const v = src.vl[n]; if (Array.isArray(v)) src.vl[n] = [v[0], v[1], (v[2] == null ? 3.4 : v[2]) * f]; });
      (src.txt || []).forEach(t => { if (t.p !== 'CAP') { if (t.dx != null) t.dx *= f; if (t.dy != null) t.dy *= f; } });
    };
    fix(spec); fix(spec.a); spec.size = 2.6; spec.pad = 4;
    return spec;
  };
  const fig = (z, o) => GEO(z, o), sm = z => GEO(compact(z));

  IK.lesson('heikou_new-07', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第7時', title: '補助線をひいて、角度のなぞを解こう',
    summary: '平行線の間の折れ線・ブーメラン形・三角定規・正五角形などの角度のなぞを、補助線をひいて解く。ひろげるは、補助線のひき方をいくつも見つけ、うまくいく補助線の共通点をことばにする。',
    head: '平行と合同　第7時',
    pitch: 8, dots: true,
    checks: [
      FIGCHK,
      // 今日の問い 35°+50°＝85°、例題 40°+35°＝75°（外角）、75°+30°＝105°、40°+35°+30°＝105°
      'near(35 + 50, 85) && near(40 + 35, 75) && near(75 + 30, 105) && near(40 + 35 + 30, 105)',
      // ひろげる（7）（答えは載せない。ここで確かめるだけ）：ア e+c−a＝80+25−35＝70、イ 125−50−35＝40、ウ 45−25＝20
      'near(80 + 25 - 35, 70) && near(125 - 50 - 35, 40) && near(45 - 25, 20) && near(25 + 20, 45)',
      // ブーメラン形（例題・確かめる（2）図3・図4・ひろげる イ・小テスト（2））：座標から測った ∠BDC が、∠BAC+∠ABD+∠ACD に等しい。BD をのばした交点 E での外角の性質（∠DEC＝∠BAC+∠ABD）も、座標から確かめる
      '(() => { const F = ' + J(FIGS.filter(f => /^(例題|ひろげる イ|確かめる（2）|小テスト（2）)/.test(f.name))) + ', ang = (P, Q, R) => { const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]), b = Math.atan2(R[1] - Q[1], R[0] - Q[0]); const d = Math.abs(a - b) * 180 / Math.PI; return d > 180 ? 360 - d : d; }; return F.length === 5 && F.every(f => { const P = f.pts, s3 = ang(P.B, P.A, P.C) + ang(P.A, P.B, P.D) + ang(P.A, P.C, P.D); return Math.abs(ang(P.B, P.D, P.C) - s3) < 1e-6 && Math.abs(ang(P.D, P.E, P.C) - (ang(P.B, P.A, P.C) + ang(P.A, P.B, P.D))) < 1e-6; }) && near(60 + 40 + 45, 145); })()',
      // 確かめる（1）①70 ②40　（2）図3 125　図4 100　使ってみる（3）e+f＝a+c+180：125+120＝35+30+180　（4）60−24＝36
      'near(40 + 30, 70) && near(95 - 55, 40) && near(50 + 35 + 40, 125) && near(60 + 40 + 45, 145) && near(125 + 120, 35 + 30 + 180) && near(125 - 35, 90) && near(180 - 90, 90) && near(90 + 30, 120) && near(60 - 24, 36)',
      // 使ってみる（5）a+f+c＝e+g：35+100+40＝80+95　（6）リボン形 65+45＝30+80、∠AOB＝70
      'near(35 + 100 + 40, 80 + 95) && near(175 - 75, 100) && near(180 - 65 - 45, 70) && near(180 - 70 - 30, 80) && near(65 + 45, 30 + 80)',
      // チャレンジ（8）正五角形の内角 180×3÷5＝108、a＝108−58＝50、x＝180−108−50＝22
      'near(180 * 3 / 5, 108) && near(108 - 58, 50) && near(180 - 108 - 50, 22) && near(58 - 36, 22)',
      // 小テスト 28+47＝75、60+25+30＝115、110−65＝45、チャレンジ 95+21−28＝88
      'near(28 + 47, 75) && near(60 + 25 + 30, 115) && near(110 - 65, 45) && near(95 + 21 - 28, 88)',
      ARITH
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('補助線をひいて、角度のなぞを解こう'),
      K('今日の問い', '右の図で、ℓ∥m のとき、∠x の大きさを求めたい。図に補助線を1本かき加えるとしたら、どこにどんな線をひけばよいだろう。', 2),
      C2([
        T('①', '自分の考え（3分）　補助線を図にかき入れて、求め方を書こう。', 2),
        B(4, T_W),
        T('②', 'ペアの考え（3分）　自分とちがうひき方があれば書こう。', 2),
        B(3, '')
      ], [
        F(11, fig(Z_T))
      ], '3:2'),
      G(1),
      WD('図にかき入れる線を{{補助線}}という。\n平行線では、{{同位角}}も{{錯角}}も等しい。\n三角形の内角の和は{{180}}°。外角は、となり合わない 2つの{{内角}}の和に等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '右の図で、∠BAC＝{{40}}°、∠ABD＝{{35}}°、∠ACD＝{{30}}° である。補助線をひいて、∠x（∠BDC）の大きさを求めよう。', 2),
      C2([
        T('', '【補助線と求め方】', 1),
        B(6, T_E)
      ], [
        F(10, fig(Z_E))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 角を求めるために、図にかき入れる線を{{補助線}}という。\n② 平行な 2直線に 1つの直線が交わるとき、{{同位角}}も{{錯角}}も等しい。\n③ 三角形の内角の和は{{180}}°である。\n④ 三角形の外角は、となり合わない 2つの{{内角}}の{{和}}に等しい。', 4, { label: 'ことば' }),
      F(4, sm(Z_D1), sm(Z_D2), sm(Z_D3), sm(Z_D4)),
      C2([
        T('（1）', 'ℓ∥m のとき、図1・図2の ∠x の大きさを求めよう。', 2),
        B(2, T_D1)
      ], [
        T('（2）', '図3・図4の ∠x（∠BDC）の大きさを求めよう。', 2),
        B(2, T_D2)
      ], '1:1'),
      MA('【説明】図1の補助線と、使った性質を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '補助線をひいて、∠x を求めよう。'),
      F(5, sm(Z_D5), sm(Z_D6), sm(Z_D7), sm(Z_D8)),
      C2([
        T('（3）', '図5で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(3, T_D3)
      ], [
        T('（4）', '図6で、ℓ∥m、△ABC は正三角形である。∠x を求めよう。', 2),
        B(3, T_D4)
      ], '1:1'),
      C2([
        T('（5）', '図7で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(3, T_D5)
      ], [
        T('（6）', '図8で、線分 AD と BC は点 O で交わっている。∠x を求めよう。', 2),
        B(3, T_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：補助線のひき方を、いろいろ見つけよう。'),
      T('（7）', '次のア〜ウの ∠x の大きさを求めよう。（ア・ウは ℓ∥m）補助線を、できるだけいろいろなひき方で見つけて、図にかき入れよう。', 2),
      F(7, fig(Z_TA), fig(Z_TI), fig(Z_TU)),
      T('', '求めた ∠x の大きさ　　ア（　　　）　　イ（　　　）　　ウ（　　　）', 1),
      T('', 'ちがうひき方を見つけて、同じ答えになるか確かめよう。', 1),
      B(4, ''),
      T('', 'うまくいく補助線には、どんな共通点があるだろう。', 1),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、ℓ∥m で、ABCDE は正五角形である。∠x の大きさを求めよう。', 3),
        B(6, T_D8)
      ], [
        F(6, fig(Z_D9)),
        MA('① B を通って、ℓ に平行な直線をひいてみよう。\n② 正五角形の 1つの内角は、何度かな。', 4, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      F(5, fig(Z_Q1), fig(Z_Q2), fig(Z_Q3)),
      T('（1）', '図1で、ℓ∥m のとき、∠x を求めよう。（3点）', 1),
      B(2, T_Q1),
      T('（2）', '図2で、∠x の大きさを求めよう。（3点）', 1),
      B(2, T_Q2),
      T('（3）', '図3で、ℓ∥m のとき、∠x を求めよう。（2点）', 1),
      B(2, T_Q3),
      T('（4）', '角を求めるために、図にかき入れる線を何というか。また、平行な 2直線に 1つの直線が交わるとき、等しくなる角を、2つ答えよう。（2点）', 2),
      B(2, '補助線　　同位角、錯角'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(4, T_QC)
      ], [
        F(8, fig(Z_QC))
      ], '3:2')
    ]
  });
})();
