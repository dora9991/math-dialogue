/* 相似な図形 第4時：相似条件を使って、相似な三角形を見つけよう。
   元：授業ナビ標準版 souji-04（例）。例題2（辺 AB 上の点 D、∠ACD＝∠ABC。共通な角と仮定の角で 2組の角）を「今日の問い」に、例題1（線分 AD と BC が点 O で交わる。辺の比と対頂角で 条件②）を「例題」に、
   「相似な三角形を見つけるとき、どこに目をつけるか」の考えようは、答えが ことば欄に出るため、新しい発見の問い（直角三角形に垂線をひくと、AB×AB＝BD×BC：演習プリント（7））に作りかえた。
   ・ワークシートは A4 1枚：問いは1つ（∠ACD＝∠ABC のとき、相似な三角形を見つけて ∽ で表し、わけを説明する）。個人3分 → ペア3分 → ことば（等しい角のさがし方）→ 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問（図1 交わる線分・図2 ∠ABE＝∠ACB）・使ってみる 4問（DE∥BC・直角三角形に垂線・辺の比と共通な角・AB∥CD で交わる線分）／
     裏＝ひろげる（考えよう・答えなし。3cm・4cm・5cm の直角三角形に垂線をひき、AB×AB と BD×BC をくらべる）・チャレンジ★★（平行四辺形で AF の長さ。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、図の頂点の座標から相似（辺の比・角）を計算し直して確かめた。相似の記号 ∽ は、第1時で読み方をことわってある。対応する頂点の順は、答え（B）で示した。
   ・証明の形（「…で」「仮定より」「2組の角が、それぞれ等しいから」）は、今日の問い・例題・（8）の答えに使った。（仮定）（結論）の形にした証明は、第5時で扱う。
   検算：node tools/verify.cjs souji-04　／　見た目：node tools/check.cjs <出力先> souji-04 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const R = Math.PI / 180, J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）。o＝{ w: 横の幅の割合 }
  const cap = (fig, text, o) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, o);
  // 辺 a-b の中点から、dir（度。0＝右、90＝上）のむきに k mm はなして、字 t を置く
  const lab = (P, a, b, t, dir, k) => ({ p: [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], t, dx: k * Math.cos(dir * R), dy: -k * Math.sin(dir * R) });
  // 2つの線分 AD、BC が O で交わる図（OA＝a、OB＝b、OC＝c、OD＝d。A は th1 度、B は th2 度のむき。C は B の反対、D は A の反対）
  const crossPts = (a, b, c, d, th1, th2) => ({ O: [0, 0], A: [a * Math.cos(th1 * R), a * Math.sin(th1 * R)], B: [b * Math.cos(th2 * R), b * Math.sin(th2 * R)], C: [c * Math.cos((th2 + 180) * R), c * Math.sin((th2 + 180) * R)], D: [d * Math.cos((th1 + 180) * R), d * Math.sin((th1 + 180) * R)] });
  const crossFig = (P, th1, th2, len, pad) => GEO({
    pts: P, segs: ['AD', 'BC', 'AB', 'CD'], dots: ['O'], pad: pad || 6,
    vl: { A: ['A', th1, 3.4], B: ['B', th2, 3.4], C: ['C', th2 + 180, 3.4], D: ['D', th1 + 180, 3.4], O: ['O', (th1 + th2) / 2, 3.4] },
    txt: [lab(P, 'O', 'A', len.OA, th1 + 90, 4.6), lab(P, 'O', 'C', len.OC, th2 + 90, 4.6), lab(P, 'O', 'B', len.OB, th2 - 90, 4.6), lab(P, 'O', 'D', len.OD, th1 + 270, 4.6)]
  });

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：△ABC（AB＝9、AC＝6、∠A＝62°）。D は AB 上で AD＝4。AC²＝AD×AB（36＝4×9）なので、∠ACD＝∠ABC
  const P_W = { A: [0, 0], B: [9, 0], C: [6 * Math.cos(62 * R), 6 * Math.sin(62 * R)], D: [4, 0] };
  // 例題：線分 AD、BC が O で交わる（OA＝4、OB＝6、OC＝9、OD＝6）。△OAB∽△ODC（相似比 2：3）
  const P_E = crossPts(4, 6, 9, 6, 160, 25);
  // 演習プリント 図1：OA＝3、OB＝6、OC＝10、OD＝5。△OAB∽△ODC（相似比 3：5）
  const P_1 = crossPts(3, 6, 10, 5, 155, 20);
  // 図2：△ABC（AB＝4、AC＝8、∠A＝50°）。E は AC 上で AE＝2。AB²＝AE×AC（16＝2×8）なので、∠ABE＝∠ACB。△ABC∽△AEB
  const P_2 = { A: [0, 0], C: [8, 0], B: [4 * Math.cos(50 * R), 4 * Math.sin(50 * R)], E: [2, 0] };
  // （7）：AB＝3、AC＝4、BC＝5 の直角三角形（∠A＝90°）。垂線 AD の足 D は、BD＝1.8、DC＝3.2、AD＝2.4。印刷そのままの大きさ（1cm＝10mm）の座標（mm）
  const P_7 = { B: [0, 0], C: [50, 0], A: [18, 24], D: [18, 0] };
  // （8）：平行四辺形 ABCD。BC＝AD＝9、BE＝3（E は BC 上）、AE＝16。F は AE と BD の交点（AF：FE＝AD：EB＝3：1）
  const P_8 = (() => { const t = 55 * R, E = [3, 0], A = [E[0] + 16 * Math.cos(t), 16 * Math.sin(t)], D = [A[0] + 9, A[1]], F = [A[0] + 0.75 * (E[0] - A[0]), A[1] + 0.75 * (E[1] - A[1])]; return { A, B: [0, 0], C: [9, 0], D, E, F }; })();
  // 小テスト（1）：OA＝2、OB＝4、OC＝6、OD＝3。△OAB∽△ODC（相似比 2：3）
  const P_Q = crossPts(2, 4, 6, 3, 155, 25);

  /* ---------------- 図 ---------------- */
  const figW = GEO({
    pts: P_W, poly: 'ABC', segs: ['CD'], dots: ['D'], pad: 7,
    vl: { A: ['A', 225], B: ['B', 315], C: ['C', 90], D: ['D', 270] },
    ang: [{ at: 'B', a: 'A', b: 'C', n: 2, r: 5 }, { at: 'C', a: 'A', b: 'D', n: 2, r: 5 }]
  });
  const figE = crossFig(P_E, 160, 25, { OA: '4cm', OB: '6cm', OC: '9cm', OD: '6cm' }, 6);
  const fig1 = cap(crossFig(P_1, 155, 20, { OA: '3cm', OB: '6cm', OC: '10cm', OD: '5cm' }, 5), '図1', { w: 1.25 });
  const fig2 = cap(GEO({
    pts: P_2, poly: 'ABC', segs: ['BE'], dots: ['E'], pad: 6,
    vl: { A: ['A', 225], B: ['B', 100], C: ['C', 315], E: ['E', 270] },
    ang: [{ at: 'B', a: 'A', b: 'E', n: 2, r: 4.5 }, { at: 'C', a: 'A', b: 'B', n: 2, r: 5 }]
  }), '図2', { w: 1 });
  // （7）：印刷そのままの大きさ。直角のしるしは A と D
  const fig7 = SVG((W, H, h) => {
    const ox = (W - 50) / 2, oy = H - 8, X = p => ox + p[0], Y = p => oy - p[1], g = P_7;
    let s = h.ln(X(g.B), Y(g.B), X(g.C), Y(g.C), '#222', 0.45, ' stroke-linecap="round"') + h.ln(X(g.B), Y(g.B), X(g.A), Y(g.A), '#222', 0.45, ' stroke-linecap="round"') + h.ln(X(g.A), Y(g.A), X(g.C), Y(g.C), '#222', 0.45, ' stroke-linecap="round"') + h.ln(X(g.A), Y(g.A), X(g.D), Y(g.D), '#222', 0.32, ' stroke-linecap="round"');
    // 直角のしるし（A：AB と AC のあいだ、D：DA と DC のあいだ）
    const sq = (V, u, w) => { const k = 3, p1 = [V[0] + u[0] * k, V[1] + u[1] * k], p2 = [p1[0] + w[0] * k, p1[1] + w[1] * k], p3 = [V[0] + w[0] * k, V[1] + w[1] * k]; return `<polyline points="${[p1, p2, p3].map(q => h.f2(X(q)) + ',' + h.f2(Y(q))).join(' ')}" fill="none" stroke="#222" stroke-width="0.28"/>`; };
    s += sq(g.A, [-0.6, -0.8], [0.8, -0.6]) + sq(g.D, [0, 1], [1, 0]);
    [['A', 0, -3.2], ['B', -3.2, 4.2], ['C', 3.4, 4.2], ['D', -3.4, 4.2]].forEach(([n, dx, dy]) => { s += h.tx(X(g[n]) + dx, Y(g[n]) + dy, n, 3.1, 'middle'); });
    s += h.tx(X([6.5, 14]) - 1.2, Y([6.5, 14]), '3cm', 3, 'end') + h.tx(X([34.5, 14]) + 1.2, Y([34.5, 14]), '4cm', 3, 'start') + h.tx(X([36.5, 0]), Y([36.5, 0]) + 4.4, '5cm', 3, 'middle');
    return s;
  });
  // （8）：平行四辺形 ABCD と、AE、BD。長さの字は AD・BE・AE
  const fig8 = GEO({
    pts: P_8, poly: 'ABCD', segs: ['AE', 'BD'], dots: ['E', 'F'], pad: 7,
    vl: { A: ['A', 160, 3.4], B: ['B', 225], C: ['C', 315], D: ['D', 20, 3.4], E: ['E', 270], F: ['F', 0, 3.2] },
    txt: [{ p: [(P_8.A[0] + P_8.D[0]) / 2, P_8.A[1]], t: '9cm', dy: -3.6 }, { p: [1.5, 0], t: '3cm', dy: 4.6 }, lab(P_8, 'A', 'E', '16cm', 150, 5.6)]
  });
  const figQ = cap(crossFig(P_Q, 155, 25, { OA: '2cm', OB: '4cm', OC: '6cm', OD: '3cm' }, 5), '図', { w: 1 });

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  // 対応する順の三角形 s、t が相似か（3つの辺の比がすべて等しく、対応する角がすべて等しい）。比（t の辺 ÷ s の辺）も返す
  const simR = (P, Q, s, t) => { const r = [0, 1, 2].map(i => d(Q, t[i] + t[(i + 1) % 3]) / d(P, s[i] + s[(i + 1) % 3])); const okA = [0, 1, 2].every(i => near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(Q, t[i], t[(i + 1) % 3], t[(i + 2) % 3]))); return (near(r[0], r[1]) && near(r[1], r[2]) && okA) ? r[0] : null; };
  // 3点 A、B、C が一直線上か（外積）
  const col = (P, a, b, c) => Math.abs((P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0])) < 1e-9;
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const simR = ' + simR + '; const col = ' + col + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  IK.lesson('souji-04', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第4時', title: '相似条件を使って、相似な三角形を見つけよう',
    summary: '∠ACD＝∠ABC の図（共通な角と仮定の角）や、2つの線分が交わる図（辺の比と対頂角）から、相似な三角形を見つけて ∽ で表し、使った相似条件を説明する。共通な角・対頂角・平行線の同位角と錯角・直角に目をつける。',
    head: '相似な図形　第4時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：△ABC（AB＝9、AC＝6、∠A＝62°）、AB 上の D（AD＝4）。座標から、∠ACD＝∠ABC（約40.6°）。△ABC∽△ACD（相似比 AC：AB＝6：9＝2：3）。∠A は共通
      chk('第4時 今日の問い', `const P = ${J(P_W)}; return near(d(P, 'AB'), 9) && near(d(P, 'AC'), 6) && near(d(P, 'AD'), 4) && col(P, 'A', 'D', 'B') && near(ang(P, 'A', 'B', 'C'), 62) && near(ang(P, 'C', 'A', 'D'), ang(P, 'B', 'A', 'C')) && near(simR(P, P, 'ABC', 'ACD'), 2 / 3) && near(4 * 9, 6 * 6);`),
      // 例題：線分 AD、BC が O で交わる（O は AD 上にも BC 上にもある）。OA：OD＝4：6、OB：OC＝6：9（ともに 2：3）、∠AOB＝∠DOC（対頂角）。△OAB∽△ODC（相似比 2：3）
      chk('第4時 例題', `const P = ${J(P_E)}; return col(P, 'A', 'O', 'D') && col(P, 'B', 'O', 'C') && near(d(P, 'OA'), 4) && near(d(P, 'OB'), 6) && near(d(P, 'OC'), 9) && near(d(P, 'OD'), 6) && near(d(P, 'OA') / d(P, 'OD'), 2 / 3) && near(d(P, 'OB') / d(P, 'OC'), 2 / 3) && near(ang(P, 'O', 'A', 'B'), ang(P, 'O', 'D', 'C')) && near(simR(P, P, 'OAB', 'ODC'), 1.5);`),
      // 図1：OA＝3、OB＝6、OC＝10、OD＝5。OA：OD＝3：5、OB：OC＝6：10＝3：5、∠AOB＝∠DOC。△OAB∽△ODC（相似比 3：5）。△OAB∽△OCD の順では相似でない
      chk('第4時 図1', `const P = ${J(P_1)}; return col(P, 'A', 'O', 'D') && col(P, 'B', 'O', 'C') && near(d(P, 'OA'), 3) && near(d(P, 'OB'), 6) && near(d(P, 'OC'), 10) && near(d(P, 'OD'), 5) && near(3 / 5, 6 / 10) && near(ang(P, 'O', 'A', 'B'), ang(P, 'O', 'D', 'C')) && near(simR(P, P, 'OAB', 'ODC'), 5 / 3) && simR(P, P, 'OAB', 'OCD') === null;`),
      // 図2：△ABC（AB＝4、AC＝8、∠A＝50°）、AC 上の E（AE＝2）。座標から、∠ABE＝∠ACB。△ABC∽△AEB（A↔A、B↔E、C↔B。相似比 1：2）。△ABC∽△ABE の順では相似でない
      chk('第4時 図2', `const P = ${J(P_2)}; return near(d(P, 'AB'), 4) && near(d(P, 'AC'), 8) && near(d(P, 'AE'), 2) && col(P, 'A', 'E', 'C') && near(ang(P, 'A', 'B', 'E'), ang(P, 'A', 'B', 'C')) && near(ang(P, 'B', 'A', 'E'), ang(P, 'C', 'A', 'B')) && near(simR(P, P, 'ABC', 'AEB'), 0.5) && simR(P, P, 'ABC', 'ABE') === null && near(2 * 8, 4 * 4);`),
      // （3）DE∥BC（D は AB 上、E は AC 上）：座標の例で、△ADE∽△ABC。∠A は共通、DE∥BC より同位角 ∠ADE＝∠ABC
      chk('第4時 （3）', `const A = [0, 0], B = [9, 0], C = [3, 6], k = 0.4, P = { A, B, C, D: [A[0] + k * (B[0] - A[0]), A[1] + k * (B[1] - A[1])], E: [A[0] + k * (C[0] - A[0]), A[1] + k * (C[1] - A[1])] }; const cr = (u, w) => u[0] * w[1] - u[1] * w[0]; const parDEBC = Math.abs(cr([P.E[0] - P.D[0], P.E[1] - P.D[1]], [C[0] - B[0], C[1] - B[1]])) < 1e-9; return parDEBC && near(simR(P, P, 'ABC', 'ADE'), k) && near(ang(P, 'A', 'D', 'E'), ang(P, 'A', 'B', 'C')) && near(ang(P, 'D', 'A', 'E'), ang(P, 'B', 'A', 'C'));`),
      // （4）∠A＝90° の直角三角形 ABC に垂線 AD：座標の例（AB＝6、AC＝8、BC＝10）で、△ABC∽△DBA（∠B 共通）、△ABC∽△DAC（∠C 共通）。△ABC∽△DBA の相似比は AB：BC＝3：5
      chk('第4時 （4）', `const B = [0, 0], C = [10, 0], A = [3.6, 4.8], D = [3.6, 0], P = { A, B, C, D }; return near(ang(P, 'A', 'B', 'C'), 90) && near(ang(P, 'D', 'A', 'B'), 90) && col(P, 'B', 'D', 'C') && near(simR(P, P, 'ABC', 'DBA'), 0.6) && near(simR(P, P, 'ABC', 'DAC'), 0.8) && near(d(P, 'AB') / d(P, 'BC'), 3 / 5);`),
      // （5）AB＝15、AC＝10、AD＝6（AB 上）、AE＝9（AC 上）：座標から、△ADE∽△ACB（AD：AC＝AE：AB＝3：5、∠A は共通）。△ADE∽△ABC の順では相似でない
      chk('第4時 （5）', `const t = 50 * Math.PI / 180, P = { A: [0, 0], B: [15, 0], C: [10 * Math.cos(t), 10 * Math.sin(t)], D: [6, 0], E: [9 * Math.cos(t), 9 * Math.sin(t)] }; return near(d(P, 'AD') / d(P, 'AC'), d(P, 'AE') / d(P, 'AB')) && near(d(P, 'AD') / d(P, 'AC'), 3 / 5) && near(simR(P, P, 'ACB', 'ADE'), 0.6) && simR(P, P, 'ABC', 'ADE') === null;`),
      // （6）線分 AD、BC が O で交わり、AB∥CD（D＝−k×A、C＝−k×B とおく）：座標の例で △OAB∽△ODC（∠AOB＝∠DOC は対頂角、∠OAB＝∠ODC は錯角）
      chk('第4時 （6）', `const k = 1.8, A = [-2, 1.5], B = [3, 2]; const P = { O: [0, 0], A, B, C: [-k * B[0], -k * B[1]], D: [-k * A[0], -k * A[1]] }; const para = Math.abs((B[0] - A[0]) * (P.D[1] - P.C[1]) - (B[1] - A[1]) * (P.D[0] - P.C[0])) < 1e-9; return para && col(P, 'A', 'O', 'D') && col(P, 'B', 'O', 'C') && near(simR(P, P, 'OAB', 'ODC'), k) && near(ang(P, 'O', 'A', 'B'), ang(P, 'O', 'D', 'C')) && near(ang(P, 'A', 'O', 'B'), ang(P, 'D', 'O', 'C'));`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：図の座標（mm）から、AB＝3cm、AC＝4cm、BC＝5cm、∠A＝90°、AD⊥BC、BD＝1.8cm、DC＝3.2cm、AD＝2.4cm。AB×AB＝BD×BC（9）、AC×AC＝DC×BC（16）、AD×AD＝BD×DC（5.76）
      chk('第4時 （7）', `const P = ${J(P_7)}; const cm = s => d(P, s) / 10; return near(cm('AB'), 3) && near(cm('AC'), 4) && near(cm('BC'), 5) && near(ang(P, 'A', 'B', 'C'), 90) && near(ang(P, 'D', 'A', 'B'), 90) && col(P, 'B', 'D', 'C') && near(cm('BD'), 1.8) && near(cm('DC'), 3.2) && near(cm('AD'), 2.4) && near(cm('AB') * cm('AB'), cm('BD') * cm('BC')) && near(cm('AB') * cm('AB'), 9) && near(cm('AC') * cm('AC'), cm('DC') * cm('BC')) && near(cm('AD') * cm('AD'), cm('BD') * cm('DC'));`),
      // （8）平行四辺形 ABCD：座標から AD＝BC＝9、BE＝3、AE＝16、AB∥DC。F は AE と BD の交点（連立方程式で求める）→ AF＝12、FE＝4（AF：FE＝AD：EB＝3：1）。△AFD∽△EFB（相似比 3：1）
      chk('第4時 （8）', `const P = ${J(P_8)}; const sub = (p, q) => [p[0] - q[0], p[1] - q[1]]; const cr = (u, w) => u[0] * w[1] - u[1] * w[0]; const a = P.A, e = P.E, b = P.B, dd = P.D, r = sub(e, a), s = sub(dd, b), t = cr(sub(b, a), s) / cr(r, s), F = [a[0] + t * r[0], a[1] + t * r[1]]; const Q = Object.assign({}, P, { F }); return near(d(P, 'AD'), 9) && near(d(P, 'BC'), 9) && near(d(P, 'BE'), 3) && near(d(P, 'AE'), 16) && Math.abs(cr(sub(P.B, P.A), sub(P.C, P.D))) < 1e-9 && Math.abs(cr(sub(P.D, P.A), sub(P.C, P.B))) < 1e-9 && near(d(Q, 'AF'), 12) && near(d(Q, 'FE'), 4) && near(simR(Q, Q, 'AFD', 'EFB'), 1 / 3) && Math.abs(F[0] - P.F[0]) < 1e-9 && Math.abs(F[1] - P.F[1]) < 1e-9;`),
      // 小テスト（1）：OA＝2、OB＝4、OC＝6、OD＝3。△OAB∽△ODC（相似比 2：3）。OA：OD＝OB：OC＝2：3、∠AOB＝∠DOC
      chk('第4時 小テスト（1）', `const P = ${J(P_Q)}; return col(P, 'A', 'O', 'D') && col(P, 'B', 'O', 'C') && near(d(P, 'OA'), 2) && near(d(P, 'OB'), 4) && near(d(P, 'OC'), 6) && near(d(P, 'OD'), 3) && near(2 / 3, 4 / 6) && near(ang(P, 'O', 'A', 'B'), ang(P, 'O', 'D', 'C')) && near(simR(P, P, 'OAB', 'ODC'), 1.5);`),
      // 小テスト（2）DE∥BC（△ADE∽△ABC）と（3）直角三角形の垂線（△ABC∽△DBA）：（3）（4）の座標の例と同じ形で確かめ済み。（4）チャレンジ：AB＝12、AC＝9、AD＝6 のとき、△ADE∽△ACB なら AE＝8（AD：AC＝AE：AB）
      chk('第4時 小テスト（4）', `const t = 55 * Math.PI / 180, P = { A: [0, 0], B: [12, 0], C: [9 * Math.cos(t), 9 * Math.sin(t)], D: [6, 0], E: [8 * Math.cos(t), 8 * Math.sin(t)] }; return near(simR(P, P, 'ACB', 'ADE'), 2 / 3) && near(d(P, 'AE'), 8) && near(d(P, 'AD') / d(P, 'AC'), d(P, 'AE') / d(P, 'AB')) && d(P, 'AE') < d(P, 'AC');`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('相似条件を使って、相似な三角形を見つけよう'),
      K('今日の問い', '△ABC の辺 AB 上に点 D があり、∠ACD＝∠ABC である。相似な三角形を ∽ で表し、そのわけを説明しよう。', 2),
      F(5, figW),
      T('①', '自分の考え（3分）　相似な三角形と、わけを書こう。', 1),
      B(5, '（例）△ABC と △ACD で\n∠A は共通 …①\n仮定より　∠ABC＝∠ACD …②\n①、②より、2組の角が、それぞれ等しいから\n△ABC∽△ACD'),
      T('②', 'ペアの考え（3分）　自分とちがう見つけ方を書こう。', 1),
      B(2, ''),
      WD('相似な三角形は、等しい角をさがして見つける。\n① 2つの三角形に{{共通}}な角　② {{対頂角}}\n③ 平行線の{{同位角}}や{{錯角}}　④ どちらも{{直角}}\n角が1組だけなら、その角をはさむ辺の{{比}}を調べる。', 4, { label: 'ことば（教科書で調べよう）' }),
      K('例題', '図で、線分 AD と BC は、点 O で交わっている。相似な三角形を ∽ で表し、条件も答えよう。', 2),
      F(5, figE),
      TB('', null, [
        ['辺の比 OA：OD', ['4：6＝{{2：3}}']],
        ['辺の比 OB：OC', ['6：9＝{{2：3}}']],
        ['等しい角', ['∠AOB＝∠{{DOC}}（{{対頂角}}）']],
        ['相似な三角形と条件', ['△OAB∽△{{ODC}}　（条件 {{②}}）']]
      ], { hw: 58 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2つの三角形で、重なって同じになる角を{{共通}}な角という。\n② 交わる 2直線の、向かい合った角を{{対頂角}}といい、等しい。\n③ 平行な 2直線に交わる直線がつくる{{同位角}}・{{錯角}}は、等しい。\n④ 相似条件の 1つ：{{2組の角}}が、それぞれ等しい。', 4, { label: 'ことば' }),
      F(4, fig1, fig2),
      C2([
        T('（1）', '図1で、相似な三角形を ∽ で表し、使った条件も答えよう。', 2),
        B(4, '△OAB∽△ODC\nOA：OD＝3：5\nOB：OC＝6：10＝3：5\n∠AOB＝∠DOC　条件 ②')
      ], [
        T('（2）', '図2で、相似な三角形を ∽ で表し、使った条件も答えよう。', 2),
        B(4, '△ABC∽△AEB\n∠A は共通\n∠ABE＝∠ACB\n2組の角が等しい（③）')
      ], '1:1'),
      MA('【説明】相似な三角形の見つけ方を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '図形の中から、相似な三角形を見つけよう。'),
      C2([
        T('（3）', '△ABC の辺 AB、AC 上の点 D、E が DE∥BC のとき、相似な三角形と条件を答えよう。', 3),
        B(3, '△ADE∽△ABC\n∠A 共通、∠ADE＝∠ABC\n（同位角）　2組の角')
      ], [
        T('（4）', '∠A＝90° の直角三角形 ABC で、A から辺 BC に垂線 AD をひく。△ABC と相似な三角形を答えよう。', 3),
        B(3, '△DBA（∠B 共通・直角）\n△DAC（∠C 共通・直角）\n どちらも 2組の角')
      ], '1:1'),
      C2([
        T('（5）', '△ABC で、AB＝15cm、AC＝10cm。辺 AB 上に AD＝6cm、辺 AC 上に AE＝9cm の点 D、E をとる。相似な三角形を ∽ で表そう。', 4),
        B(3, 'AD：AC＝AE：AB＝3：5\n∠A は共通（条件 ②）\n△ADE∽△ACB')
      ], [
        T('（6）', '線分 AD と BC が点 O で交わり、AB∥CD である。相似な三角形と条件を答えよう。', 4),
        B(3, '△OAB∽△ODC\n対頂角と錯角が等しい\n2組の角（条件 ③）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：直角三角形に垂線をひいて、調べよう。'),
      T('（7）', '直角三角形 ABC（∠A＝90°）で、A から辺 BC に垂線 AD をひいた。BD、DC、AD の長さをはかって表に書き、AB×AB と BD×BC を計算してくらべよう。どんなことに気づくだろう。', 3),
      F(5, fig7),
      TB('', ['BD（cm）', 'DC（cm）', 'AD（cm）', 'AB×AB', 'BD×BC'], [['はかった長さ・計算', ['', '', '', '', '']]], { hw: 46 }),
      C2([
        T('', '気づいたこと', 1),
        B(4, '')
      ], [
        T('', 'なぜそうなるのか、相似な三角形を使って説明しよう', 2),
        B(3, '')
      ], '1:1'),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '平行四辺形 ABCD の辺 BC 上に点 E があり、AD＝9cm、BE＝3cm、AE＝16cm である。線分 AE と対角線 BD の交点を F とするとき、線分 AF の長さを求めよう。', 6),
        B(7, '△AFD と △EFB で\nAD∥BC より、錯角は等しいから\n∠FAD＝∠FEB　∠FDA＝∠FBE\n2組の角が等しいから\n△AFD∽△EFB\nAF：EF＝AD：EB＝9：3＝3：1\nAF＝16×[[3/4]]＝12（cm）')
      ], [
        F(12, fig8)
      ], '3:2'),
      MA('① △AFD と相似な三角形は、どれだろう。平行な辺に目をつけてみよう。\n② AF：FE は、どの辺の比と等しいかな。', 3, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図で、線分 AD と BC は、点 O で交わっている。相似な三角形を ∽ で表し、使った条件も答えよう。（4点）', 2),
      F(4, figQ),
      B(3, '△OAB∽△ODC\nOA：OD＝OB：OC＝2：3、∠AOB＝∠DOC\n2組の辺の比と、その間の角が、それぞれ等しい。'),
      T('（2）', '△ABC の辺 AB、AC 上に、それぞれ点 D、E があり、DE∥BC である。相似な三角形を ∽ で表し、使った条件も答えよう。（3点）', 3),
      B(3, '△ADE∽△ABC\n∠A は共通、DE∥BC より ∠ADE＝∠ABC（同位角）\n2組の角が、それぞれ等しい。'),
      T('（3）', '∠A＝90° の直角三角形 ABC で、A から辺 BC に垂線 AD をひく。△ABC と相似な三角形を、1つ答えよう。（3点）', 2),
      B(2, '△DBA（または △DAC）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '△ABC で、AB＝12cm、AC＝9cm である。辺 AB 上に AD＝6cm の点 D、辺 AC 上に点 E をとる。△ADE∽△ACB のとき、線分 AE の長さを求めよう。', 3),
      B(3, 'AD：AC＝AE：AB　　6：9＝AE：12\n9AE＝72　　AE＝8（cm）')
    ]
  });
})();
