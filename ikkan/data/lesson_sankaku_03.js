/* 図形と証明（三角形と四角形） 第3時：2つの角が等しい三角形は、二等辺三角形といえるだろうか（二等辺三角形になる条件・逆）。
   元：授業ナビ標準版 sankaku-03（探）。課題（∠B＝∠C ならば AB＝AC の証明）を今日の問いに、例題1（二等分線の交点 P と △PBC）を小テスト（3）と演習プリント（8）に、
   「もとのことがらと逆は、同じことをいっているのか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（∠B＝∠C のとき AB＝AC といえるか。図は補助線なしで印刷）。個人3分 → ペア3分 → ことば（定理・逆）→ 例題（2つの角から二等辺三角形かどうかを調べる表。空欄あり）。
     先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形。前の時間とは、仮定が「∠B＝∠C」だけで、AB＝AC は結論（使えない）。∠ADB＝∠ADC は内角の和から。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし：もとのことがらと逆のちがい）・チャレンジ★★（△PBC が二等辺三角形であることの証明。全幅の（仮定）（結論）（証明）。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で別の方法（2つの角から、2本の半直線の交点で三角形をつくって、辺の長さを測る／座標から長さ・角を測る）から出しなおした。
   ・範囲：二等辺三角形になる条件は、この時間で証明するので、ワークシート①以外の証明では「2つの角が等しいから、二等辺三角形」と、定理として使う。逆が正しいとはかぎらない例・反例は第4時なので、ここでは出さない。
   検算：node tools/verify.cjs sankaku-03　／　見た目：node tools/check.cjs <出力先> sankaku-03 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = x => x * Math.PI / 180;

  /* ---------------- 図の座標（図と checks の両方で使う） ---------------- */
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const unit = (p, q) => { const L = dist(p, q); return [(q[0] - p[0]) / L, (q[1] - p[1]) / L]; };
  const meet = (p, w, q1, q2) => { const dx = q2[0] - q1[0], dy = q2[1] - q1[1], t = ((q1[0] - p[0]) * dy - (q1[1] - p[1]) * dx) / (w[0] * dy - w[1] * dx); return [p[0] + t * w[0], p[1] + t * w[1]]; };
  const lp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const isoP = (b, ba) => ({ A: [b / 2, b / 2 * Math.tan(rad(ba))], B: [0, 0], C: [b, 0] });   // AB＝AC、底辺 BC＝b、底角＝ba 度
  // 底辺 BC＝c、∠B＝bb、∠C＝cc（度）の三角形：A は、B と C から出る 2本の半直線の交点（辺の長さは使わない）
  const triA = (c, bb, cc) => { const Bp = [0, 0], Cp = [c, 0]; return { A: meet(Bp, [Math.cos(rad(bb)), Math.sin(rad(bb))], Cp, [c - Math.cos(rad(cc)), Math.sin(rad(cc))]), B: Bp, C: Cp }; };
  const bis = (P, v, a, b, q1, q2) => { const u1 = unit(P[v], P[a]), u2 = unit(P[v], P[b]); return meet(P[v], [u1[0] + u2[0], u1[1] + u2[1]], P[q1], P[q2]); };

  // 今日の問い：∠B＝∠C＝62°（2本の半直線で作る）。D は ∠A の二等分線と BC との交点
  const P_W = () => { const P = triA(4.4, 62, 62); return Object.assign(P, { D: bis(P, 'A', 'B', 'C', 'B', 'C') }); };
  // （3）AB＝AC（底角 64°）。D は AB 上、E は AC 上で DE∥BC（A から 0.45 の所）
  const P_3 = () => { const P = isoP(4, 64); return Object.assign(P, { D: lp(P.A, P.B, 0.45), E: lp(P.A, P.C, 0.45) }); };
  // （4）∠XOY＝56°、OP は二等分線（OP＝4）、PQ∥OY（Q は OX 上）
  const P_4 = () => { const O = [0, 0], X = [6, 0], Y = [5 * Math.cos(rad(56)), 5 * Math.sin(rad(56))], P = [4 * Math.cos(rad(28)), 4 * Math.sin(rad(28))], Q = meet(P, [-Math.cos(rad(56)), -Math.sin(rad(56))], O, X); return { O, X, Y, P, Q }; };
  // （5）∠B＝68°、∠C＝34°、BD は ∠B の二等分線（D は AC 上）
  const P_5 = () => { const P = triA(4, 68, 34); return Object.assign(P, { D: bis(P, 'B', 'A', 'C', 'A', 'C') }); };
  // （6）AB＝9、∠A＝50°、∠B＝65°（A を原点、B＝(9,0) とする。C は 2本の半直線の交点）
  const P_6 = () => { const Ap = [0, 0], Bp = [9, 0]; return { A: Ap, B: Bp, C: meet(Ap, [Math.cos(rad(50)), Math.sin(rad(50))], Bp, [9 - Math.cos(rad(65)), Math.sin(rad(65))]) }; };
  // （8）AB＝AC（底角 66°）。D は AB 上、E は AC 上で DB＝EC（B・C から 0.4 の所）。P は BE と CD の交点
  const P_8 = () => { const P = isoP(4.4, 66), D = lp(P.B, P.A, 0.4), E = lp(P.C, P.A, 0.4); return Object.assign(P, { D, E, P: meet(P.B, [E[0] - P.B[0], E[1] - P.B[1]], P.C, D) }); };
  // 小テスト（3）AB＝AC（底角 62°）。BP、CP は ∠B、∠C の二等分線
  const P_Q3 = () => { const P = isoP(4.4, 62), w1 = unit(P.B, P.A), w2 = unit(P.B, P.C), v1 = unit(P.C, P.A), v2 = unit(P.C, P.B); return Object.assign(P, { P: meet(P.B, [w1[0] + w2[0], w1[1] + w2[1]], P.C, [P.C[0] + v1[0] + v2[0], P.C[1] + v1[1] + v2[1]]) }); };
  // 小テスト チャレンジ：AB＝8、BC＝40/3、AC＝11。D は ∠B の二等分線と AC との交点、E は D を通る BC の平行線と AB との交点
  const P_QC = () => { const c = 40 / 3, x = (64 + c * c - 121) / (2 * c), P = { A: [x, Math.sqrt(64 - x * x)], B: [0, 0], C: [c, 0] }; const D = bis(P, 'B', 'A', 'C', 'A', 'C'); return Object.assign(P, { D, E: meet(D, [1, 0], P.B, P.A) }); };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  const cong = (P, s, t) => [0, 1, 2].every(i => near(d(P, s[i] + s[(i + 1) % 3]), d(P, t[i] + t[(i + 1) % 3])) && near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(P, t[i], t[(i + 1) % 3], t[(i + 2) % 3])));
  const on = (P, p, a, b) => near(d(P, a + p) + d(P, p + b), d(P, a + b));
  // 2つの角（度）から三角形をつくって、二等辺三角形か（2つの辺が等しいか）を、辺の長さを測って調べる
  const isoYN = (a, b) => { const rad = x => x * Math.PI / 180, B = [0, 0], C = [4, 0], dx = 4 - Math.cos(rad(b)), A = (() => { const w = [Math.cos(rad(a)), Math.sin(rad(a))], q = [dx, Math.sin(rad(b))], t = (4 * q[1] - 0 * (q[0] - 4)) / (w[0] * q[1] - w[1] * (q[0] - 4)); return [t * w[0], t * w[1]]; })(), P = { A, B, C }, D = (s, t) => Math.hypot(P[s][0] - P[t][0], P[s][1] - P[t][1]); return near(D('A', 'B'), D('A', 'C')) || near(D('A', 'B'), D('B', 'C')) || near(D('A', 'C'), D('B', 'C')); };
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const cong = ' + cong + '; const on = ' + on + '; const isoYN = ' + isoYN + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  /* ---------------- 図（GEO・SVG） ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const VL = { A: ['A', 90], B: ['B', 225], C: ['C', 315] };
  const TK = [['A', 'B', 1], ['A', 'C', 1]];
  const tri = (P, o) => GEO(Object.assign({ pts: P, poly: 'ABC', vl: VL, pad: 4 }, o));
  const vlx = o => Object.assign({}, VL, o);
  // 今日の問い：∠B＝∠C のしるしだけ。解答では、二等分線 AD と、等しい角（赤）が出る
  const figW = tri(P_W(), { pad: 5, ang: [{ at: 'B', a: 'A', b: 'C', r: 5 }, { at: 'C', a: 'A', b: 'B', r: 5 }],
    a: { segs: ['AD'], dots: ['D'], vl: { D: ['D', 270] }, ang: [{ at: 'A', a: 'B', b: 'D', n: 2, r: 5 }, { at: 'A', a: 'D', b: 'C', n: 2, r: 5 }] } });
  const fig1 = tri(P_3(), { segs: ['DE'], tick: TK, par: [['D', 'E', 1], ['B', 'C', 1]], vl: vlx({ D: ['D', 180], E: ['E', 0] }) });
  const fig2 = GEO({ pts: P_4(), segs: ['OX', 'OY', 'OP', 'PQ'], vl: { O: ['O', 200], X: ['X', 0], Y: ['Y', 56], P: ['P', 10], Q: ['Q', 270] }, par: [['P', 'Q', 1], ['O', 'Y', 1, 0.7]], ang: [{ at: 'O', a: 'X', b: 'P', r: 7 }, { at: 'O', a: 'P', b: 'Y', r: 7 }], pad: 5 });
  const fig3 = tri(P_5(), { segs: ['BD'], vl: vlx({ D: ['D', 30] }), ang: [{ at: 'B', a: 'A', b: 'D', r: 6 }, { at: 'B', a: 'D', b: 'C', r: 6 }, { at: 'C', a: 'A', b: 'B', t: '34°', r: 5, lr: 12 }] });
  const fig8 = tri(P_8(), { pad: 5, segs: ['DC', 'EB'], tick: TK.concat([['D', 'B', 2], ['E', 'C', 2]]), vl: vlx({ D: ['D', 180], E: ['E', 0], P: ['P', 90, 3.6] }), dots: ['P'] });
  const figQ3 = tri(P_Q3(), { pad: 5, segs: ['BP', 'CP'], tick: TK, vl: vlx({ P: ['P', 90, 3.6] }), dots: ['P'], ang: [{ at: 'B', a: 'A', b: 'P', n: 1, r: 5 }, { at: 'B', a: 'P', b: 'C', n: 1, r: 5 }, { at: 'C', a: 'A', b: 'P', n: 2, r: 5 }, { at: 'C', a: 'P', b: 'B', n: 2, r: 5 }] });
  const figQC = tri(P_QC(), { pad: 5, segs: ['BD', 'DE'], par: [['D', 'E', 1], ['B', 'C', 1]], vl: vlx({ D: ['D', 20], E: ['E', 180] }), ang: [{ at: 'B', a: 'A', b: 'D', n: 1, r: 6 }, { at: 'B', a: 'D', b: 'C', n: 1, r: 6 }] });

  /* ---------------- 答えの文 ---------------- */
  // 今日の問い（①）：先生の板書の例（∠A の二等分線 AD。∠ADB＝∠ADC は内角の和から）
  const A_W = '（例）（仮定）∠B＝∠C　　（結論）AB＝AC\n（証明）∠A の二等分線をひき、BC との交点を D とする。\n△ABD と △ACD において\n仮定より　∠ABD＝∠ACD …①\nAD は ∠A の二等分線だから　∠BAD＝∠CAD …②\n内角の和は 180° だから　∠ADB＝∠ADC …③\nAD は共通 …④\n②、③、④より、1組の辺とその両端の角が、それぞれ等しいから\n△ABD≡△ACD\n合同な図形の、対応する辺は等しいから　AB＝AC';
  // チャレンジ（8）：△PBC は二等辺三角形
  const A_8 = '（仮定）AB＝AC、DB＝EC\n（結論）△PBC は二等辺三角形\n（証明）△DBC と △ECB において\n仮定より　DB＝EC …①\n二等辺三角形の底角は等しいから　∠DBC＝∠ECB …②\nBC は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△DBC≡△ECB\n合同な図形の、対応する角は等しいから　∠DCB＝∠EBC\nすなわち　∠PCB＝∠PBC\n2つの角が等しいから、△PBC は二等辺三角形である。';
  // 小テスト（3）の証明（空欄あり）
  const PF_Q3 = '二等辺三角形の{{底角}}は等しいから　∠ABC＝∠ACB\nBP、CP は{{二等分線}}だから\n∠PBC＝[[1/2]]∠ABC、∠PCB＝[[1/2]]∠ACB\nしたがって　∠PBC＝∠{{PCB}}\n{{2つの角}}が等しいから、△PBC は{{二等辺三角形}}である。';
  const blanksOf = pf => (pf.match(/\{\{([^}]*)\}\}/g) || []).map(s => s.slice(2, -2));
  const A_Q3 = blanksOf(PF_Q3).join('　');

  IK.lesson('sankaku-03', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第3時', title: '2つの角が等しい三角形は、二等辺三角形といえるだろうか',
    summary: '「AB＝AC ならば ∠B＝∠C」の仮定と結論を入れかえた「∠B＝∠C ならば AB＝AC」を、補助線を1本ひいて、合同を使って証明する。二等辺三角形になる条件と、ことがらの逆のことばをとらえる。',
    head: '図形と証明　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：∠B＝∠C＝62° になるように、2本の半直線で三角形をつくる → AB＝AC になる。∠A の二等分線 AD で、△ABD≡△ACD（ASA：∠BAD＝∠CAD、AD、∠ADB＝∠ADC）。答えの行数
      chk('第3時 今日の問い', `const P = ${J(P_W())}; return near(ang(P, 'B', 'A', 'C'), 62) && near(ang(P, 'C', 'A', 'B'), 62) && near(d(P, 'AB'), d(P, 'AC')) && on(P, 'D', 'B', 'C') && near(ang(P, 'A', 'B', 'D'), ang(P, 'A', 'D', 'C')) && near(ang(P, 'D', 'A', 'B'), ang(P, 'D', 'A', 'C')) && near(180 - ang(P, 'B', 'A', 'D') - ang(P, 'A', 'B', 'D'), ang(P, 'D', 'A', 'B')) && cong(P, 'ABD', 'ACD') && ${J(A_W)}.split('\\n').length === 10;`),
      // 例題：2つの角が (50°、80°)・(45°、65°)・(30°、120°)・(40°、60°)。残りの角 50°・70°・30°・80°。二等辺三角形か（辺の長さを測る）：○・×・○・×
      '[[50, 80], [45, 65], [30, 120], [40, 60]].map(([a, b]) => 180 - a - b).join() === "50,70,30,80" && ' + chk('第3時 例題', `return [[50, 80], [45, 65], [30, 120], [40, 60]].map(([a, b]) => isoYN(a, b) ? '○' : '×').join('') === '○×○×';`),
      // （1）2つの角が (55°、70°)・(35°、75°)・(36°、72°)・(100°、40°)・(20°、130°) のうち、二等辺三角形はア・ウ・エ
      chk('第3時 （1）', `return [[55, 70], [35, 75], [36, 72], [100, 40], [20, 130]].map(([a, b], i) => isoYN(a, b) ? 'アイウエオ'[i] : '').join('') === 'アウエ';`),
      // （3）AB＝AC、DE∥BC → ∠ADE＝∠B、∠AED＝∠C（同位角）→ AD＝AE（座標でも等しい）
      chk('第3時 （3）', `const P = ${J(P_3())}; return near(d(P, 'AB'), d(P, 'AC')) && on(P, 'D', 'A', 'B') && on(P, 'E', 'A', 'C') && near(ang(P, 'D', 'A', 'E'), ang(P, 'B', 'A', 'C')) && near(ang(P, 'E', 'A', 'D'), ang(P, 'C', 'A', 'B')) && near(d(P, 'AD'), d(P, 'AE'));`),
      // （4）∠XOY＝56°、OP は二等分線、PQ∥OY → ∠QOP＝∠QPO＝28°、OQ＝PQ
      chk('第3時 （4）', `const P = ${J(P_4())}; return near(ang(P, 'O', 'X', 'Y'), 56) && near(ang(P, 'O', 'X', 'P'), ang(P, 'O', 'P', 'Y')) && near(ang(P, 'P', 'O', 'Q'), ang(P, 'O', 'X', 'P')) && near(ang(P, 'P', 'O', 'Q'), 28) && near(d(P, 'OQ'), d(P, 'PQ'));`),
      // （5）∠B＝68°、∠C＝34°、BD は ∠B の二等分線：∠DBC＝34°＝∠C → DB＝DC
      chk('第3時 （5）', `const P = ${J(P_5())}; return near(ang(P, 'B', 'A', 'C'), 68) && near(ang(P, 'C', 'A', 'B'), 34) && on(P, 'D', 'A', 'C') && near(ang(P, 'B', 'A', 'D'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'B', 'D', 'C'), 34) && near(d(P, 'DB'), d(P, 'DC'));`),
      // （6）∠A＝50°、∠B＝65°、AB＝9：∠C＝65°（2本の半直線で作った三角形を測る）→ AC＝AB＝9
      chk('第3時 （6）', `const P = ${J(P_6())}; return near(d(P, 'AB'), 9) && near(ang(P, 'A', 'B', 'C'), 50) && near(ang(P, 'B', 'A', 'C'), 65) && near(ang(P, 'C', 'A', 'B'), 65) && near(d(P, 'AC'), 9);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：底角が等しい二等辺三角形（もとのこと）も、2つの角が等しい三角形が二等辺三角形（逆）も、座標で成り立つ
      chk('第3時 （7）', `return [20, 35, 50, 65, 80].every(t => { const A = { A: [2, 2 * Math.tan(t * Math.PI / 180)], B: [0, 0], C: [4, 0] }; return near(d(A, 'AB'), d(A, 'AC')) && near(ang(A, 'B', 'A', 'C'), ang(A, 'C', 'A', 'B')); }) && [20, 35, 50, 65, 80].every(t => isoYN(t, t));`),
      // （8）AB＝AC、DB＝EC。△DBC≡△ECB（SAS）→ ∠DCB＝∠EBC → P（BE と CD の交点）で ∠PCB＝∠PBC、PB＝PC。答えの行数
      chk('第3時 （8）', `const P = ${J(P_8())}; return near(d(P, 'AB'), d(P, 'AC')) && near(d(P, 'DB'), d(P, 'EC')) && on(P, 'D', 'A', 'B') && on(P, 'E', 'A', 'C') && on(P, 'P', 'B', 'E') && on(P, 'P', 'C', 'D') && cong(P, 'DBC', 'ECB') && near(ang(P, 'C', 'D', 'B'), ang(P, 'B', 'E', 'C')) && near(ang(P, 'C', 'P', 'B'), ang(P, 'B', 'P', 'C')) && near(d(P, 'PB'), d(P, 'PC')) && ${J(A_8)}.split('\\n').length === 11;`),
      // 小テスト（1）2つの角が 38°、104°：残り 38° → 二等辺三角形
      chk('第3時 小テスト（1）', `return 180 - 38 - 104 === 38 && isoYN(38, 104);`),
      // 小テスト（3）AB＝AC、BP、CP は二等分線：∠PBC＝∠PCB（底角の半分）→ PB＝PC。空欄の答え 5つ
      chk('第3時 小テスト（3）', `const P = ${J(P_Q3())}; return near(d(P, 'AB'), d(P, 'AC')) && near(ang(P, 'B', 'A', 'P'), ang(P, 'B', 'P', 'C')) && near(ang(P, 'C', 'A', 'P'), ang(P, 'C', 'P', 'B')) && near(ang(P, 'B', 'P', 'C'), ang(P, 'C', 'P', 'B')) && near(d(P, 'PB'), d(P, 'PC')) && ${J(A_Q3)} === '底角　二等分線　PCB　2つの角　二等辺三角形';`),
      // 小テスト チャレンジ：AB＝8、BC＝40/3、AC＝11 の三角形で、AE＝3、DE＝5、DE∥BC、EB＝DE＝5 → AB＝3+5＝8
      chk('第3時 小テスト チャレンジ', `const P = ${J(P_QC())}; return near(d(P, 'AB'), 8) && on(P, 'D', 'A', 'C') && on(P, 'E', 'A', 'B') && near(ang(P, 'B', 'A', 'D'), ang(P, 'B', 'D', 'C')) && near(P.D[1], P.E[1]) && near(d(P, 'AE'), 3) && near(d(P, 'DE'), 5) && near(ang(P, 'B', 'E', 'D'), ang(P, 'D', 'E', 'B')) && near(d(P, 'EB'), 5) && near(d(P, 'AE') + d(P, 'EB'), 8);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2つの角が等しい三角形は、二等辺三角形といえるだろうか'),
      K('今日の問い', '「AB＝AC ならば ∠B＝∠C」は証明した。では、「∠B＝∠C ならば AB＝AC」といえるだろうか。わけを考えよう。', 2),
      F(4, figW),
      T('①', '自分の考え（3分）　かき加える線と、証明を書こう。', 1),
      B(10, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(2, ''),
      WD('2つの{{角}}が等しい三角形は、\n{{二等辺三角形}}である。（定理）\n仮定と結論を入れかえたものを、\nもとのことがらの{{逆}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      K('例題', '2つの角から、二等辺三角形かどうかを調べよう。（アは見本）', 1),
      TB('', ['ア', 'イ', 'ウ', 'エ'], [
        ['2つの角', ['50°、80°', '45°、65°', '30°、120°', '40°、60°']],
        ['残りの角', ['50°', '{{70°}}', '{{30°}}', '{{80°}}']],
        ['二等辺三角形か', ['○', '{{×}}', '{{○}}', '{{×}}']]
      ], { hw: 38 }),
      T('', '【調べ方のくふう】二等辺三角形かどうかを、どう調べたか書こう。', 1),
      B(2, '残りの角を、180° から引いて求める。\n等しい角が 2つあれば、二等辺三角形。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2つの{{角}}が等しい三角形は、{{二等辺三角形}}である。\n② ことがらの仮定と結論を入れかえたものを、{{逆}}という。\n③ 「AB＝AC ならば ∠B＝∠C」の逆は、「{{∠B＝∠C}} ならば {{AB＝AC}}」。\n④ 結論が「二等辺三角形」のとき、{{2つの角}}が等しいことを示せばよい。', 4, { label: 'ことば' }),
      T('（1）', '2つの内角が次の大きさである三角形のうち、二等辺三角形であるものを、すべて選ぼう。\nア 55°、70°　イ 35°、75°　ウ 36°、72°　エ 100°、40°　オ 20°、130°', 3),
      B(1, 'ア、ウ、エ'),
      T('（2）', '「2直線が平行ならば、錯角は等しい」の逆を書こう。', 2),
      B(2, '錯角が等しいならば、2直線は平行である。'),
      MA('【説明】2つの角が等しい三角形が二等辺三角形になるわけを説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '二等辺三角形になる条件を使って、長さを求めよう。'),
      F(4, cap(fig1, '図1'), cap(fig2, '図2'), cap(fig3, '図3')),
      C2([
        T('（3）', '図1で、AB＝AC、DE∥BC、AD＝4cm である。AE の長さを求めよう。', 3),
        B(3, '∠ADE＝∠B、∠AED＝∠C\n∠B＝∠C より ∠ADE＝∠AED\nAE＝AD＝4cm')
      ], [
        T('（4）', '図2で、OP は ∠XOY の二等分線、PQ∥OY、OQ＝7cm である。PQ の長さを求めよう。', 3),
        B(3, '∠QOP＝∠POY＝∠QPO\n2つの角が等しいから\nPQ＝OQ＝7cm')
      ], '1:1'),
      C2([
        T('（5）', '図3で、∠B＝68° で、BD は ∠B の二等分線。BD＝5cm のとき、DC の長さを求めよう。', 3),
        B(3, '∠DBC＝68°÷2＝34°＝∠C\n2つの角が等しいから\nDC＝DB＝5cm')
      ], [
        T('（6）', '△ABC で、∠A＝50°、∠B＝65°、AB＝9cm である。AC の長さを求めよう。', 3),
        B(3, '∠C＝180°−50°−65°＝65°\n∠B＝∠C だから\nAC＝AB＝9cm')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：もとのことがらと逆を、くらべよう。'),
      T('（7）', '次のア、イの、仮定と結論を表に書こう。アとイは、同じことをいっているだろうか。\nア 二等辺三角形ならば、2つの底角は等しい。\nイ 2つの角が等しい三角形ならば、二等辺三角形である。', 4),
      TB('', ['仮定', '結論'], [['ア', ['', '']], ['イ', ['', '']]], { hw: 20 }),
      C2([
        T('', '同じことか、ちがうことか。わけも書こう', 1),
        B(4, '')
      ], [
        T('', 'アとイの証明は、同じでよいだろうか', 1),
        B(4, '')
      ], '1:1'),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '二等辺三角形 ABC（AB＝AC）の辺 AB、AC 上に、DB＝EC となる点 D、E をとり、BE と CD の交点を P とする。△PBC が二等辺三角形であることを証明しよう。', 5)
      ], [
        F(5, fig8)
      ], '3:2'),
      B(11, A_8),
      MA('① まず、△DBC と合同な三角形を見つけよう。\n② ∠PBC と ∠PCB は、合同から出てくる角の一部だよ。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '2つの内角が 38°、104° の三角形は、二等辺三角形といえるだろうか。わけも書こう。（3点）', 2),
      B(3, '二等辺三角形といえる。\n残りの角は 180°−38°−104°＝38° で、\n2つの角が等しいから。'),
      T('（2）', '「2直線が平行ならば、同位角は等しい」の逆を書こう。（2点）', 1),
      B(2, '同位角が等しいならば、2直線は平行である。'),
      C2([
        T('（3）', '図で、AB＝AC で、BP、CP は ∠B、∠C の二等分線である。△PBC が二等辺三角形であることの証明の、空欄をうめよう。（5点）\n' + PF_Q3, 10),
        B(1, A_Q3)
      ], [
        F(8, figQ3)
      ], '3:1'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（4）', '△ABC で、∠B の二等分線と辺 AC との交点を D、D を通り BC に平行な直線と辺 AB との交点を E とする。AE＝3cm、DE＝5cm のとき、AB の長さを求めよう。', 5),
        B(4, '∠EBD＝∠DBC　　∠EDB＝∠DBC（ED∥BC）\n∠EBD＝∠EDB だから　EB＝ED＝5cm\nAB＝3+5＝8（cm）')
      ], [
        F(7, figQC)
      ], '3:2')
    ]
  });
})();
