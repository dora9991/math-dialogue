/* 図形と証明（三角形と四角形） 第2時：二等辺三角形の性質を使って、角や辺について考えよう。
   元：授業ナビ標準版 sankaku-02（例）。例題1（△ABD≡△ACD から、BD＝CD・∠ADB＝90° → 定理「頂角の二等分線は底辺を垂直に2等分する」）を今日の問いに、
   例題2（二等辺三角形の入った図で角を求める）を例題（表の空欄）に、練習（DB＝EC → DC＝EB）を小テストの証明に、「正三角形の角が 60° になるわけ」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（前の時間の合同から、BC と AD についていえること）。個人3分 → ペア3分 → ことば（定理・対応・中点）→ 例題（∠B の二等分線 BD と ∠x。表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（角・長さ）／裏＝ひろげる（考えよう・答えなし：正三角形の3つの角）・チャレンジ★★（BD＝CE の証明。全幅の（仮定）（結論）（証明）。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で別の方法（座標から長さ・角を測り直す）から出しなおした。
     チャレンジの証明の論理：BC は共通・∠DCB＝∠EBC（二等辺三角形の底角）・∠DBC＝∠ECB（等しい角の二等分線）→ 1組の辺とその両端の角 → △DBC≡△ECB → BD＝CE。
   ・範囲：正三角形の3つの角が等しいこと（第4時）・二等辺三角形になる条件（第3時）は、ここでは使わない。演習プリントでは、正三角形を、考えよう（7）以外では使わない。
   検算：node tools/verify.cjs sankaku-02　／　見た目：node tools/check.cjs <出力先> sankaku-02 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = x => x * Math.PI / 180;

  /* ---------------- 図の座標（図と checks の両方で使う） ---------------- */
  const isoP = (b, ba) => ({ A: [b / 2, b / 2 * Math.tan(rad(ba))], B: [0, 0], C: [b, 0] });   // AB＝AC、底辺 BC＝b、底角＝ba 度
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const unit = (p, q) => { const L = dist(p, q); return [(q[0] - p[0]) / L, (q[1] - p[1]) / L]; };
  // 点 p から向き w に進む半直線と、直線 q1q2 との交点
  const meet = (p, w, q1, q2) => { const dx = q2[0] - q1[0], dy = q2[1] - q1[1], t = ((q1[0] - p[0]) * dy - (q1[1] - p[1]) * dx) / (w[0] * dy - w[1] * dx); return [p[0] + t * w[0], p[1] + t * w[1]]; };
  // 頂点 v の角（a と b のあいだ）の二等分線が、直線 q1q2 と交わる点（二等分線の向き＝2辺の向きの和）
  const bis = (P, v, a, b, q1, q2) => { const u1 = unit(P[v], P[a]), u2 = unit(P[v], P[b]); return meet(P[v], [u1[0] + u2[0], u1[1] + u2[1]], P[q1], P[q2]); };
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

  // 今日の問い：底角 56°。D は ∠A の二等分線と BC との交点
  const P_W = () => { const P = isoP(4.4, 56); return Object.assign(P, { D: bis(P, 'A', 'B', 'C', 'B', 'C') }); };
  // 例題：頂角 44°（底角 68°）。BD は ∠B の二等分線（D は AC 上）
  const P_E = () => { const P = isoP(4, 68); return Object.assign(P, { D: bis(P, 'B', 'A', 'C', 'A', 'C') }); };
  // （1）BC＝10cm、頂角 56°（底角 62°）：AD は ∠A の二等分線。∠BAD＝28°
  const P_1 = () => { const P = isoP(10, 62); return Object.assign(P, { D: bis(P, 'A', 'B', 'C', 'B', 'C') }); };
  // （2）底角 55°。E は BA を A のほうへのばした直線上の点。∠CAE＝110°
  const P_2 = () => { const P = isoP(4, 55), u = unit(P.B, P.A); return Object.assign(P, { E: [P.A[0] + 1.6 * u[0], P.A[1] + 1.6 * u[1]] }); };
  // （3）頂角 76°（底角 52°）。BD は ∠B の二等分線
  const P_3 = () => { const P = isoP(4, 52); return Object.assign(P, { D: bis(P, 'B', 'A', 'C', 'A', 'C') }); };
  // （4）D は BC 上で DA＝DB＝DC。∠B＝38°（B から A までの長さ＝2×DB×cos38°）
  const P_4 = () => { const c = 4, ba = 2 * (c / 2) * Math.cos(rad(38)); return { A: [ba * Math.cos(rad(38)), ba * Math.sin(rad(38))], B: [0, 0], C: [c, 0], D: [c / 2, 0] }; };
  // （5）AB＝AC、∠B＝40°。D は BC 上で DA＝DC（AC の垂直二等分線が BC と交わる点）
  const P_5 = () => { const P = isoP(4, 40), m = mid(P.A, P.C), w = [-(P.C[1] - P.A[1]), P.C[0] - P.A[0]]; return Object.assign(P, { D: meet(m, w, P.B, P.C) }); };
  // （6）AB＝AC＝10、BC＝12。AD は頂角の二等分線（AD＝8）
  const P_6 = () => ({ A: [0, 8], B: [-6, 0], C: [6, 0], D: [0, 0] });
  // （7）正三角形
  const P_7 = () => ({ A: [2, 2 * Math.sqrt(3)], B: [0, 0], C: [4, 0] });
  // （8）AB＝AC、底角 64°。BD は ∠B の二等分線（D は AC 上）、CE は ∠C の二等分線（E は AB 上）
  const P_8 = () => { const P = isoP(4.4, 64); return Object.assign(P, { D: bis(P, 'B', 'A', 'C', 'A', 'C'), E: bis(P, 'C', 'A', 'B', 'A', 'B') }); };
  // 小テスト（1）BC＝12、頂角 68°（底角 56°）、AD は ∠A の二等分線　（2）頂角 52°（底角 64°）、BD は ∠B の二等分線
  const P_Q1 = () => { const P = isoP(12, 56); return Object.assign(P, { D: bis(P, 'A', 'B', 'C', 'B', 'C') }); };
  const P_Q2 = () => { const P = isoP(4, 64); return Object.assign(P, { D: bis(P, 'B', 'A', 'C', 'A', 'C') }); };
  // 小テスト（3）AB＝AC。D は AB 上、E は AC 上で DB＝EC（AB の 0.4 の所）
  const P_Q3 = () => { const P = isoP(4.4, 66), lp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; return Object.assign(P, { D: lp(P.B, P.A, 0.4), E: lp(P.C, P.A, 0.4) }); };
  // 小テスト チャレンジ：AB＝AC、∠B＝65°。D は BC 上で ∠BAD＝30°、E は AC 上で AE＝AD
  const P_QC = () => {
    const P = isoP(4, 65), ab = unit(P.A, P.B), t = rad(30), w = [ab[0] * Math.cos(t) - ab[1] * Math.sin(t), ab[0] * Math.sin(t) + ab[1] * Math.cos(t)];   // AB の向きを、C のほう（反時計まわり）へ 30° まわした向き
    const D = meet(P.A, w, P.B, P.C), ac = unit(P.A, P.C), r = dist(P.A, D);
    return Object.assign(P, { D, E: [P.A[0] + ac[0] * r, P.A[1] + ac[1] * r] });
  };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  const cong = (P, s, t) => [0, 1, 2].every(i => near(d(P, s[i] + s[(i + 1) % 3]), d(P, t[i] + t[(i + 1) % 3])) && near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(P, t[i], t[(i + 1) % 3], t[(i + 2) % 3])));
  const on = (P, p, a, b) => near(d(P, a + p) + d(P, p + b), d(P, a + b));   // 点 p が線分 ab の上にある
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const cong = ' + cong + '; const on = ' + on + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  /* ---------------- 図（GEO・SVG） ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const VL = { A: ['A', 90], B: ['B', 225], C: ['C', 315] };
  const TK = [['A', 'B', 1], ['A', 'C', 1]];
  const tri = (P, o) => GEO(Object.assign({ pts: P, poly: 'ABC', vl: VL, tick: TK, pad: 4 }, o));
  const vlD = (D, extra) => Object.assign({ D: D }, VL, extra || {});
  // 今日の問い：AD と、∠BAD＝∠DAC のしるし。解答では、BD＝DC のしるしと、直角（赤）が出る
  const figW = tri(P_W(), { pad: 5, segs: ['AD'], vl: vlD(['D', 270]), ang: [{ at: 'A', a: 'B', b: 'D', n: 2, r: 5 }, { at: 'A', a: 'D', b: 'C', n: 2, r: 5 }],
    a: { tick: [['B', 'D', 2], ['D', 'C', 2]], ang: [{ at: 'D', a: 'A', b: 'B', right: true }, { at: 'D', a: 'A', b: 'C', right: true }] } });
  // 例題：BD は ∠B の二等分線。∠x＝∠BDC
  const figE = tri(P_E(), { pad: 5, segs: ['BD'], vl: vlD(['D', 20]), ang: [{ at: 'B', a: 'A', b: 'D', r: 6 }, { at: 'B', a: 'D', b: 'C', r: 6 }, { at: 'D', a: 'B', b: 'C', t: 'x', r: 4 }] });
  const fig1 = tri(P_1(), { segs: ['AD'], vl: vlD(['D', 270]), ang: [{ at: 'A', a: 'B', b: 'D', r: 6 }, { at: 'A', a: 'D', b: 'C', r: 6 }], txt: [{ p: [7.5, 0], t: '10cm', dy: 5.5 }] });
  const fig2 = tri(P_2(), { segs: [['A', 'E']], vl: vlD(['E', 135]), ang: [{ at: 'A', a: 'C', b: 'E', t: '110°', r: 5 }, { at: 'B', a: 'C', b: 'A', t: 'x', r: 5 }] });
  const fig3 = tri(P_3(), { segs: ['BD'], vl: vlD(['D', 20]), ang: [{ at: 'A', a: 'B', b: 'C', t: '76°', r: 6 }, { at: 'B', a: 'A', b: 'D', r: 6 }, { at: 'B', a: 'D', b: 'C', r: 6 }, { at: 'D', a: 'B', b: 'C', t: 'x', r: 4 }] });
  const fig4 = GEO({ pts: P_4(), poly: 'ABC', segs: ['AD'], vl: vlD(['D', 270]), tick: [['D', 'A', 1], ['D', 'B', 1], ['D', 'C', 1]], ang: [{ at: 'B', a: 'A', b: 'C', t: '38°', r: 5 }, { at: 'C', a: 'A', b: 'B', t: 'x', r: 5 }], pad: 4 });
  const fig5 = tri(P_5(), { segs: ['AD'], tick: [['A', 'B', 1], ['A', 'C', 1], ['D', 'A', 2], ['D', 'C', 2]], vl: vlD(['D', 270]), ang: [{ at: 'B', a: 'A', b: 'C', t: '40°', r: 5 }, { at: 'D', a: 'A', b: 'B', t: 'x', r: 4 }] });
  const fig7 = GEO({ pts: P_7(), poly: 'ABC', vl: VL, tick: [['A', 'B', 1], ['B', 'C', 1], ['C', 'A', 1]], pad: 5 });
  const fig8 = tri(P_8(), { pad: 5, segs: ['BD', 'CE'], vl: vlD(['D', 0], { E: ['E', 180] }), ang: [{ at: 'B', a: 'A', b: 'D', n: 1, r: 5 }, { at: 'B', a: 'D', b: 'C', n: 1, r: 5 }, { at: 'C', a: 'A', b: 'E', n: 2, r: 5 }, { at: 'C', a: 'E', b: 'B', n: 2, r: 5 }] });
  const figQ1 = tri(P_Q1(), { segs: ['AD'], vl: vlD(['D', 270]), ang: [{ at: 'A', a: 'B', b: 'D', r: 6 }, { at: 'A', a: 'D', b: 'C', r: 6 }], txt: [{ p: [9, 0], t: '12cm', dy: 5.5 }] });
  const figQ2 = tri(P_Q2(), { segs: ['BD'], vl: vlD(['D', 20]), ang: [{ at: 'B', a: 'A', b: 'D', r: 6 }, { at: 'B', a: 'D', b: 'C', r: 6 }, { at: 'D', a: 'B', b: 'C', t: 'x', r: 4 }] });
  const figQ3 = tri(P_Q3(), { pad: 5, segs: ['DC', 'EB'], tick: TK.concat([['D', 'B', 2], ['E', 'C', 2]]), vl: vlD(['D', 180], { E: ['E', 0] }) });
  const figQC = tri(P_QC(), { pad: 5, segs: ['AD', 'DE'], vl: vlD(['D', 270], { E: ['E', 45] }), ang: [{ at: 'B', a: 'A', b: 'C', t: '65°', r: 6 }, { at: 'A', a: 'B', b: 'D', t: '30°', r: 7 }] });

  /* ---------------- 答えの文 ---------------- */
  // 今日の問い（①）：先生の板書の例
  const A_W = '（例）△ABD≡△ACD で、対応する辺は等しいから　BD＝CD\n対応する角は等しいから　∠ADB＝∠ADC\n∠ADB+∠ADC＝180° だから　∠ADB＝90°　　AD⊥BC';
  // チャレンジ（8）：BD＝CE の証明
  const A_8 = '（仮定）AB＝AC、∠ABD＝∠DBC、∠ACE＝∠ECB\n（結論）BD＝CE\n（証明）△DBC と △ECB において\nBC は共通 …①\n二等辺三角形の底角は等しいから　∠DCB＝∠EBC …②\n∠B＝∠C で、BD、CE はそれぞれの二等分線だから\n∠DBC＝∠ECB …③\n①、②、③より、1組の辺とその両端の角が、それぞれ等しいから\n△DBC≡△ECB\n合同な図形の、対応する辺は等しいから　BD＝CE';
  // 小テスト（3）の証明（空欄あり）
  const PF_Q3 = '△DBC と △ECB において\n仮定より　DB＝{{EC}} …①\n二等辺三角形の{{底角}}は等しいから　∠DBC＝∠ECB …②\nBC は{{共通}} …③\n①、②、③より、{{2組の辺とその間の角}}が、それぞれ等しいから\n△DBC≡△ECB\n合同な図形の、対応する辺は等しいから　DC＝EB';
  const blanksOf = pf => (pf.match(/\{\{([^}]*)\}\}/g) || []).map(s => s.slice(2, -2));
  const A_Q3 = blanksOf(PF_Q3).join('　');

  IK.lesson('sankaku-02', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第2時', title: '二等辺三角形の性質を使って、角や辺について考えよう',
    summary: '△ABD≡△ACD から、頂角の二等分線 AD は底辺 BC を垂直に2等分することをみちびく。二等辺三角形の性質を使って、角や長さを求めたり、BD＝CE を証明したりする。',
    head: '図形と証明　第2時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：底角 56°。AD は ∠A の二等分線。△ABD≡△ACD から、BD＝CD、∠ADB＝∠ADC＝90°（180° の半分）
      chk('第2時 今日の問い', `const P = ${J(P_W())}; return near(d(P, 'AB'), d(P, 'AC')) && near(ang(P, 'A', 'B', 'D'), ang(P, 'A', 'D', 'C')) && on(P, 'D', 'B', 'C') && cong(P, 'ABD', 'ACD') && near(d(P, 'BD'), d(P, 'DC')) && near(ang(P, 'D', 'A', 'B'), ang(P, 'D', 'A', 'C')) && near(ang(P, 'D', 'A', 'B') + ang(P, 'D', 'A', 'C'), 180) && near(ang(P, 'D', 'A', 'B'), 90) && ${J(A_W)}.split('\\n').length === 3;`),
      // 例題：頂角 44° → 底角 68°、∠DBC＝34°、∠x＝∠BDC＝78°
      chk('第2時 例題', `const P = ${J(P_E())}; return near(d(P, 'AB'), d(P, 'AC')) && near(ang(P, 'A', 'B', 'C'), 44) && near(ang(P, 'B', 'A', 'C'), 68) && on(P, 'D', 'A', 'C') && near(ang(P, 'B', 'A', 'D'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'B', 'D', 'C'), 34) && near(ang(P, 'D', 'B', 'C'), 78);`),
      // （1）BC＝10、∠BAD＝28°：BD＝5、∠ADB＝90°、∠B＝62°
      chk('第2時 （1）', `const P = ${J(P_1())}; return near(d(P, 'BC'), 10) && near(ang(P, 'A', 'B', 'D'), 28) && near(d(P, 'BD'), 5) && near(ang(P, 'D', 'A', 'B'), 90) && near(ang(P, 'B', 'A', 'C'), 62);`),
      // （2）∠CAE＝110°、∠B＝55°
      chk('第2時 （2）', `const P = ${J(P_2())}; return near(d(P, 'AB'), d(P, 'AC')) && on(P, 'A', 'B', 'E') && near(ang(P, 'A', 'C', 'E'), 110) && near(ang(P, 'B', 'A', 'C'), 55);`),
      // （3）頂角 76°：∠C＝52°、∠DBC＝26°、∠x＝∠BDC＝102°
      chk('第2時 （3）', `const P = ${J(P_3())}; return near(d(P, 'AB'), d(P, 'AC')) && near(ang(P, 'A', 'B', 'C'), 76) && on(P, 'D', 'A', 'C') && near(ang(P, 'B', 'A', 'D'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'D', 'B', 'C'), 102);`),
      // （4）DA＝DB＝DC、∠B＝38°：∠x＝∠C＝52°（∠BAC＝90°）
      chk('第2時 （4）', `const P = ${J(P_4())}; return near(d(P, 'DA'), d(P, 'DB')) && near(d(P, 'DB'), d(P, 'DC')) && near(ang(P, 'B', 'A', 'C'), 38) && near(ang(P, 'C', 'A', 'B'), 52) && near(ang(P, 'A', 'B', 'C'), 90) && near(ang(P, 'A', 'D', 'C'), 52);`),
      // （5）AB＝AC、∠B＝40°、DA＝DC：∠ADB＝80°
      chk('第2時 （5）', `const P = ${J(P_5())}; return near(d(P, 'AB'), d(P, 'AC')) && near(d(P, 'DA'), d(P, 'DC')) && on(P, 'D', 'B', 'C') && near(ang(P, 'B', 'A', 'C'), 40) && near(ang(P, 'D', 'A', 'B'), 80);`),
      // （6）AB＝AC＝10、BC＝12、AD＝8：周の長さ 32、△ABD の周 24。AD の長さを全部しらべる：AB＝AC＝a、BD＝m とすると a+m＝16、a²＝m²+AD²、AB+BD+AD＝24（AD＝8 だけ）
      chk('第2時 （6）', `const P = ${J(P_6())}; const ok = h => { const m = (256 - h * h) / 32, a = 16 - m; return m > 0 && a > 0 && near(a * a, m * m + h * h) && near(a + m + h, 24); }; const hs = Array.from({ length: 1500 }, (_, i) => (i + 1) / 100).filter(h => Math.abs(16 + h - 24) < 1e-9); return near(d(P, 'AB') + d(P, 'AC') + d(P, 'BC'), 32) && near(d(P, 'AB') + d(P, 'BD') + d(P, 'AD'), 24) && near(d(P, 'AD'), 8) && near(d(P, 'AB'), d(P, 'AC')) && hs.length === 1 && near(hs[0], 8) && ok(8);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：3辺が等しい三角形の3つの角は、どれも 60°。AB＝AC から ∠B＝∠C、BA＝BC から ∠A＝∠C
      chk('第2時 （7）', `const P = ${J(P_7())}; return near(d(P, 'AB'), d(P, 'BC')) && near(d(P, 'BC'), d(P, 'CA')) && near(ang(P, 'A', 'B', 'C'), 60) && near(ang(P, 'B', 'A', 'C'), 60) && near(ang(P, 'C', 'A', 'B'), 60);`),
      // （8）BD、CE は ∠B、∠C の二等分線。△DBC≡△ECB（BC は共通、∠DCB＝∠EBC、∠DBC＝∠ECB）。BD＝CE。証明の行数
      chk('第2時 （8）', `const P = ${J(P_8())}; return near(d(P, 'AB'), d(P, 'AC')) && on(P, 'D', 'A', 'C') && on(P, 'E', 'A', 'B') && near(ang(P, 'B', 'A', 'D'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'C', 'A', 'E'), ang(P, 'C', 'E', 'B')) && near(ang(P, 'C', 'D', 'B'), ang(P, 'B', 'E', 'C')) && near(ang(P, 'B', 'D', 'C'), ang(P, 'C', 'E', 'B')) && cong(P, 'DBC', 'ECB') && near(d(P, 'BD'), d(P, 'CE')) && ${J(A_8)}.split('\\n').length === 10;`),
      // 小テスト（1）BC＝12、∠BAD＝34°：BD＝6、∠B＝56°
      chk('第2時 小テスト（1）', `const P = ${J(P_Q1())}; return near(d(P, 'BC'), 12) && near(ang(P, 'A', 'B', 'D'), 34) && near(d(P, 'BD'), 6) && near(ang(P, 'B', 'A', 'C'), 56);`),
      // 小テスト（2）頂角 52°、BD は ∠B の二等分線：∠x＝84°
      chk('第2時 小テスト（2）', `const P = ${J(P_Q2())}; return near(ang(P, 'A', 'B', 'C'), 52) && near(d(P, 'AB'), d(P, 'AC')) && near(ang(P, 'B', 'A', 'D'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'D', 'B', 'C'), 84);`),
      // 小テスト（3）証明：DB＝EC → △DBC≡△ECB（SAS）→ DC＝EB。空欄の答え 4つ
      chk('第2時 小テスト（3）', `const P = ${J(P_Q3())}; return near(d(P, 'AB'), d(P, 'AC')) && near(d(P, 'DB'), d(P, 'EC')) && on(P, 'D', 'A', 'B') && on(P, 'E', 'A', 'C') && near(ang(P, 'B', 'A', 'C'), ang(P, 'C', 'A', 'B')) && cong(P, 'DBC', 'ECB') && near(d(P, 'DC'), d(P, 'EB')) && ${J(A_Q3)} === 'EC　底角　共通　2組の辺とその間の角';`),
      // 小テスト チャレンジ：AB＝AC、∠B＝65°、∠BAD＝30°、AD＝AE：∠EDC＝15°（∠ADC＝95°、∠DAE＝20°、∠ADE＝80°）
      chk('第2時 小テスト チャレンジ', `const P = ${J(P_QC())}; return near(d(P, 'AB'), d(P, 'AC')) && near(ang(P, 'B', 'A', 'C'), 65) && near(ang(P, 'A', 'B', 'D'), 30) && near(d(P, 'AD'), d(P, 'AE')) && on(P, 'D', 'B', 'C') && on(P, 'E', 'A', 'C') && near(ang(P, 'A', 'B', 'C'), 50) && near(ang(P, 'D', 'A', 'C'), 95) && near(ang(P, 'A', 'D', 'E'), 20) && near(ang(P, 'D', 'A', 'E'), 80) && near(ang(P, 'D', 'E', 'C'), 15);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('二等辺三角形の性質を使って、角や辺について考えよう'),
      K('今日の問い', 'AB＝AC の△ABC に、∠A の二等分線 AD をひいた。△ABD≡△ACD から、BC と AD について、どんなことがいえるだろう。', 2),
      F(5, figW),
      T('①', '自分の考え（3分）　合同から、いえることを書こう。', 1),
      B(4, A_W),
      T('②', 'ペアの考え（3分）　自分が気づかなかったことを書こう。', 1),
      B(2, ''),
      G(1),
      WD('二等辺三角形の{{頂角}}の二等分線は、\n底辺を{{垂直}}に{{2等分}}する。（定理）\n合同な図形では、{{対応}}する辺や角は等しい。\n線分を2等分する点を、{{中点}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '二等辺三角形 ABC で、∠A＝44° である。BD は ∠B の二等分線。表の空欄をうめて、∠x を求めよう。', 4)
      ], [
        F(4, figE)
      ], '3:2'),
      TB('', null, [
        ['∠ABC（＝∠C）', ['{{68°}}']],
        ['∠DBC', ['{{34°}}']],
        ['∠x（＝∠BDC）', ['{{78°}}']]
      ], { hw: 52 }),
      T('', '【見つけるくふう】図の中から二等辺三角形を見つけるには、何に目をつけるとよいだろう。', 2),
      B(2, '等しい辺の印に目をつける。\n等しい2辺をもつ三角形は、底角が等しい。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 二等辺三角形の{{頂角}}の二等分線は、底辺を{{垂直}}に{{2等分}}する。\n② 合同な図形では、{{対応}}する辺の長さや角の大きさは等しい。\n③ 三角形の外角は、となり合わない{{2つの内角}}の和に等しい。', 3, { label: 'ことば' }),
      F(4, cap(fig1, '図1'), cap(fig2, '図2')),
      C2([
        T('（1）', '図1で、AD は ∠A の二等分線で、∠BAD＝28° である。BD の長さと、∠B の大きさを求めよう。', 3),
        B(2, '① 10÷2＝5（cm）\n② 180°−90°−28°＝62°')
      ], [
        T('（2）', '図2で、AB＝AC である。∠x の大きさを求めよう。', 3),
        B(2, '∠B＝∠C だから\n∠x＝110°÷2＝55°')
      ], '1:1'),
      MA('【説明】頂角の二等分線が、底辺を垂直に2等分するわけを説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '二等辺三角形の性質を使って、角や長さを求めよう。'),
      F(4, cap(fig3, '図3'), cap(fig4, '図4'), cap(fig5, '図5')),
      C2([
        T('（3）', '図3で、AB＝AC で、BD は ∠B の二等分線。∠x を求めよう。', 2),
        B(3, '底角は (180°−76°)÷2＝52°\n∠DBC＝26°\n∠x＝180°−26°−52°＝102°')
      ], [
        T('（4）', '図4で、DA＝DB＝DC である。∠x を求めよう。', 2),
        B(3, '∠DAB＝∠B＝38°\n∠ADC＝38°+38°＝76°\n∠x＝(180°−76°)÷2＝52°')
      ], '1:1'),
      C2([
        T('（5）', '図5で、AB＝AC、DA＝DC である。∠x を求めよう。', 2),
        B(3, '∠C＝∠B＝40° で\n∠DAC＝∠C＝40°\n∠x＝40°+40°＝80°')
      ], [
        T('（6）', '二等辺三角形 ABC（AB＝AC）の周は 32cm。頂角の二等分線 AD で分けた △ABD の周は 24cm。AD を求めよう。', 4),
        B(3, 'BD＝CD だから\nAB+BD＝32÷2＝16\nAD＝24−16＝8（cm）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：正三角形の角を調べよう。'),
      T('（7）', '3つの辺が等しい三角形（正三角形）がある。今日学んだことを使って、3つの角の大きさについて、いえることを考えよう。', 2),
      F(4, fig7),
      C2([
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        T('', 'そのわけ（説明）', 1),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '二等辺三角形 ABC（AB＝AC）で、∠B、∠C の二等分線が、辺 AC、AB と交わる点を、それぞれ D、E とする。このとき、BD＝CE であることを証明しよう。', 5)
      ], [
        F(5, fig8)
      ], '3:2'),
      B(10, A_8),
      MA('① 三角形 DBC と、どの三角形が合同になりそうかな。\n② ∠DBC と ∠ECB は、もとの角の半分どうしだよ。', 3, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '図1で、AD は ∠A の二等分線、∠BAD＝34°。BD の長さと ∠B を求めよう。（3点）', 3),
        F(3, figQ1),
        B(2, 'BD＝12÷2＝6（cm）\n∠B＝180°−90°−34°＝56°')
      ], [
        T('（2）', '図2で、AB＝AC、∠A＝52°、BD は ∠B の二等分線。∠x を求めよう。（3点）', 3),
        F(3, figQ2),
        B(2, '底角 (180°−52°)÷2＝64°　∠DBC＝32°\n∠x＝180°−32°−64°＝84°')
      ], '1:1'),
      C2([
        T('（3）', '図で、AB＝AC、DB＝EC である。DC＝EB の証明の、空欄をうめよう。（4点）\n' + PF_Q3, 11),
        B(1, A_Q3)
      ], [
        F(8, figQ3)
      ], '3:1'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（4）', '図の △ABC は AB＝AC、∠B＝65°。BC 上に D、AC 上に E を、∠BAD＝30°、AD＝AE となるようにとる。∠EDC を求めよう。', 4),
        B(5, '∠ADC＝30°+65°＝95°\n∠BAC＝180°−65°×2＝50°\n∠DAE＝50°−30°＝20°\n∠ADE＝(180°−20°)÷2＝80°\n∠EDC＝95°−80°＝15°')
      ], [
        F(8, figQC)
      ], '3:2')
    ]
  });
})();
