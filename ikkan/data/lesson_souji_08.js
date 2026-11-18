/* 相似な図形 第8時：三角形と比の性質を使って、線分の長さを求めよう。
   元：授業ナビ標準版 souji-08（例）。例題1（DE∥BC で x、y を求める）を「今日の問い」（図1。どの比を、どの線分に使うか）に、例題2（AB∥CD で AD と BC が点 O で交わる形で x を求める）を「例題」（図2。表の空欄）に、
   練習・応用（比の使い分け、平行な直線が2本、2本の柱とロープ）を演習プリントにした。授業ナビの考えよう（例題2の図でも比が成り立つわけ）は、相似の証明（第5時）の答えにあたるので使わず、
   「平行な直線が2本あるとき、辺の上の線分の比はどうなるか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（図1の x、y）。個人3分 → ペア3分 → ことば（比例式のことばと定理）→ 例題（図2。相似・比例式・x の表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（定理の使い分け、AD＝AB−DB のように足す・引く問題、交わる形）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（2本の柱とロープ。ヒントカードつき）。
   ・数値・図は新しく作り（授業ナビの 6・3・8／3・6・8 とはちがう数）、辺の長さ・比・平行は、座標から計算しなおして checks にした。
     「平行な直線が2本」は（7）の答えにかかわるので、ワークシート・演習プリント表・小テストには出さない。
   検算：node tools/verify.cjs souji-08　／　見た目：node tools/check.cjs <出力先> souji-08 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const cenABC = P => [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3];
  // 辺 a-b の、△ABC の重心から遠ざかる向きに、字 t を置く（ref を渡すと、その点から遠ざかる向き）
  const side = (P, a, b, t, k, ref) => {
    const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = ref || cenABC(P);
    const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1;
    return { p: m, t, dx: (k || 5) * vx / L, dy: -(k || 5) * vy / L };
  };
  // 辺 a-b の外むき（△ABC の重心から遠ざかる向き）の法線の角度（度）
  const outDir = (P, a, b) => { const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = cenABC(P), dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1]; let nx = -dy, ny = dx; if (nx * (m[0] - c[0]) + ny * (m[1] - c[1]) < 0) { nx = -nx; ny = -ny; } return Math.atan2(ny, nx) * 180 / Math.PI; };
  // 三角形：B が左下、C が右下（BC＝bc）。AB＝ab、AC＝ac
  const tri = (ab, ac, bc) => { const x = (ab * ab - ac * ac + bc * bc) / (2 * bc); return { A: [x, Math.sqrt(ab * ab - x * x)], B: [0, 0], C: [bc, 0] }; };
  // D は AB 上、E は AC 上（A から t の位置）：DE∥BC
  const para = (P, t) => Object.assign({}, P, { D: lerp(P.A, P.B, t), E: lerp(P.A, P.C, t) });
  const paraFig = (P, lab, pad) => {
    const ref = [(P.B[0] + P.C[0]) / 2, (P.B[1] + P.C[1]) / 2], txt = [];
    if (lab.AD) txt.push(side(P, 'A', 'D', lab.AD, 5.2));
    if (lab.DB) txt.push(side(P, 'D', 'B', lab.DB, 5.2));
    if (lab.AE) txt.push(side(P, 'A', 'E', lab.AE, 5.2));
    if (lab.EC) txt.push(side(P, 'E', 'C', lab.EC, 5.2));
    if (lab.DE) txt.push(side(P, 'D', 'E', lab.DE, 3.6, ref));
    if (lab.BC) txt.push({ p: [(P.B[0] + P.C[0]) / 2, 0], t: lab.BC, dy: 5 });
    return GEO({
      pts: P, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], par: [['D', 'E', 1], ['B', 'C', 1]], txt, pad: pad || 7,
      vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', outDir(P, 'A', 'B'), 3.4], E: ['E', outDir(P, 'A', 'C'), 3.4] }
    });
  };
  // AB∥CD で、AD と BC が点 O で交わる図（O が原点。A(−p, h)・B(q, h)、D＝−k×A、C＝−k×B）
  const xpts = (p, q, h, k) => ({ A: [-p, h], B: [q, h], C: [-k * q, -k * h], D: [k * p, -k * h], O: [0, 0] });
  // lab：{ AB, CD, OA, OB, OC, OD } の字。OA・OB・OC・OD の字は、線の外がわ（O のまわりの、ほかの線がない向き）に置く
  const xFig = (P, lab, pad) => {
    const txt = [], ln = (a, b) => [P[b][0] - P[a][0], P[b][1] - P[a][1]];
    const along = (a, b, t, k, sgn) => { const v = ln(a, b), L = Math.hypot(v[0], v[1]), nx = -v[1] / L * sgn, ny = v[0] / L * sgn; txt.push({ p: [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], t, dx: k * nx, dy: -k * ny }); };
    if (lab.AB) txt.push({ p: [(P.A[0] + P.B[0]) / 2, P.A[1]], t: lab.AB, dy: -3.8 });
    if (lab.CD) txt.push({ p: [(P.C[0] + P.D[0]) / 2, P.C[1]], t: lab.CD, dy: 5.2 });
    if (lab.OA) along('O', 'A', lab.OA, 5, 1);    // OA の左がわ
    if (lab.OD) along('O', 'D', lab.OD, 5, 1);    // OD の右がわ
    if (lab.OB) along('O', 'B', lab.OB, 5, -1);   // OB の右がわ
    if (lab.OC) along('O', 'C', lab.OC, 5, -1);   // OC の左がわ
    return GEO({ pts: P, poly: 'ABCD', dots: ['O'], par: [['A', 'B', 1], ['C', 'D', 1]], vl: { A: ['A', 135], B: ['B', 45], C: ['C', 225], D: ['D', 315], O: ['O', 90, 3.2] }, txt, pad: pad || 7 });
  };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い・図1：AB＝12、AC＝15、BC＝18。AD＝8、DB＝4、AE＝10、EC＝x（＝5）、DE＝y（＝12）、BC＝18（AD：AB＝2：3）
  const P1 = para(tri(12, 15, 18), 2 / 3);
  const fig1 = paraFig(P1, { AD: '8cm', DB: '4cm', AE: '10cm', EC: 'x', DE: 'y', BC: '18cm' });
  // 例題・図2：OA＝6、OD＝9、CD＝12、AB＝x（＝8）。A(−3.6, 4.8)（OA＝6）、AB＝8 なので B(4.4, 4.8)、k＝1.5
  const P2 = xpts(3.6, 4.4, 4.8, 1.5);
  const fig2 = xFig(P2, { AB: 'x', CD: '12cm', OA: '6cm', OD: '9cm' });
  // 演習プリント 図1：AB＝15、AC＝20、BC＝18。AD＝9、DB＝6、AE＝12、EC＝x（＝8）（AD：AB＝0.6）
  const D1 = para(tri(15, 20, 18), 0.6);
  const d1 = paraFig(D1, { AD: '9cm', DB: '6cm', AE: '12cm', EC: 'x' });
  // 図2：AB＝15、AC＝22、BC＝25。AD＝6、DB＝9、DE＝y（＝10）、BC＝25（AD：AB＝0.4）
  const D2 = para(tri(15, 22, 25), 0.4);
  const d2 = paraFig(D2, { AD: '6cm', DB: '9cm', DE: 'y', BC: '25cm' });
  // 図3：AB∥CD。OA＝5、OB＝4、AB＝6（OA²＝p²+h²、OB²＝q²+h²、p+q＝6 → p＝3.75、q＝2.25）、OD＝10（k＝2）、CD＝x（＝12）、OC＝y（＝8）
  const x3p = (25 - 16) / 6 / 2 + 3, x3q = 6 - x3p, x3h = Math.sqrt(25 - x3p * x3p);   // p＝3.75、q＝2.25
  const D3 = xpts(x3p, x3q, x3h, 2);
  const d3 = xFig(D3, { AB: '6cm', CD: 'x', OA: '5cm', OD: '10cm', OB: '4cm', OC: 'y' }, 8);
  // 図4（（7））：AB＝9、AC＝18、BC＝14。AD＝3、DF＝2、FB＝4（D、F は AB 上）、AE＝6（E、G は AC 上）。DE∥FG∥BC。EG＝4、GC＝8
  const P4 = Object.assign(tri(9, 18, 14), {}); P4.D = lerp(P4.A, P4.B, 3 / 9); P4.F = lerp(P4.A, P4.B, 5 / 9); P4.E = lerp(P4.A, P4.C, 6 / 18); P4.G = lerp(P4.A, P4.C, 10 / 18);
  const d4 = GEO({
    pts: P4, poly: 'ABC', segs: ['DE', 'FG'], dots: ['D', 'F', 'E', 'G'], par: [['D', 'E', 1], ['F', 'G', 1], ['B', 'C', 1]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', outDir(P4, 'A', 'B'), 3.4], F: ['F', outDir(P4, 'A', 'B'), 3.4], E: ['E', outDir(P4, 'A', 'C'), 3.4], G: ['G', outDir(P4, 'A', 'C'), 3.4] },
    txt: [side(P4, 'A', 'D', '3cm', 6), side(P4, 'D', 'F', '2cm', -5), side(P4, 'F', 'B', '4cm', 5), side(P4, 'A', 'E', '6cm', 6)], pad: 7
  });
  // （8）：地面に垂直な柱 AB（6m）、CD（4m）が、10m はなれて立つ。ロープ AD、BC の交点 E から地面にひいた垂線 EF（＝2.4m）
  const P8 = { B: [0, 0], A: [0, 6], D: [10, 0], C: [10, 4] }; P8.E = [6, 2.4]; P8.F = [6, 0];
  const fig8 = GEO({
    pts: P8, segs: ['AB', 'CD', 'AD', 'BC', 'EF', [[-1.5, 0], [11.5, 0], { w: 0.5 }]], dots: ['E'],
    ang: [{ at: 'F', a: 'D', b: 'E', right: true, r: 2.2 }],
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 45], D: ['D', 315], E: ['E', 90, 3.2], F: ['F', 270, 3.2] },
    txt: [{ p: [0, 3], t: '6\\m', dx: -4.8 }, { p: [10, 2], t: '4\\m', dx: 4.8 }, { p: [2.6, 0], t: '10\\m', dy: 5.6 }], pad: 7
  });

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), onSeg=(P,Q,X)=>near(dd(P,X)+dd(X,Q),dd(P,Q)), '
    + 'an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'sim=(P1,P2,P3,Q1,Q2,Q3)=>{const a=[dd(P1,P2),dd(P2,P3),dd(P3,P1)],b=[dd(Q1,Q2),dd(Q2,Q3),dd(Q3,Q1)];return near(a[0]/b[0],a[1]/b[1])&&near(a[1]/b[1],a[2]/b[2]);}, '
    + 'lp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], '
    + 'tri=(ab,ac,bc)=>{const x=(ab*ab-ac*ac+bc*bc)/(2*bc);return {A:[x,Math.sqrt(ab*ab-x*x)],B:[0,0],C:[bc,0]};}, '
    + 'xp=(p,q,h,k)=>({A:[-p,h],B:[q,h],C:[-k*q,-k*h],D:[k*p,-k*h],O:[0,0]});';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  IK.lesson('souji-08', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第8時', title: '三角形と比の性質を使って、線分の長さを求めよう',
    summary: 'DE∥BC の図で、AD：DB＝AE：EC と AD：AB＝DE：BC のどちらを使うかを見分けて x、y を求める。AB∥CD で AD と BC が交わる形でも、相似な三角形から比を見つけて長さを求める。',
    head: '相似な図形　第8時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・図1：AB＝12、AC＝15、BC＝18、AD＝8、DB＝4、AE＝10、EC＝5（x）、DE＝12（y）。DE∥BC。AD：DB＝AE：EC → 8：4＝10：x、x＝5。AD：AB＝DE：BC → 8：12＝y：18、y＝12（AB＝8+4）。8：4＝y：18 とするとまちがい（y＝36）
      chk(`const ${pj(P1)}; return near(cr(D,E,B,C),0) && near(dd(A,D),8) && near(dd(D,B),4) && near(dd(A,E),10) && near(dd(E,C),5) && near(dd(D,E),12) && near(dd(B,C),18) && near(dd(A,B),8+4) && near(10*4/8,5) && near(8*18/12,12) && !near(8*18/4,12);`),
      // 例題・図2：A(−3.6,4.8)・B(4.4,4.8)・C・D（k＝1.5）。AB∥CD、OA＝6、OD＝9、AB＝8、CD＝12。O は AD、BC の交点。△OAB∽△ODC（錯角）。OA：OD＝AB：DC → 6：9＝x：12、x＝8
      chk(`const ${pj(P2)}; return near(cr(A,B,C,D),0) && near(dd(O,A),6) && near(dd(O,D),9) && near(dd(A,B),8) && near(dd(C,D),12) && onSeg(A,D,O) && onSeg(B,C,O) && near(an(A,B,O),an(D,C,O)) && near(an(B,A,O),an(C,D,O)) && sim(O,A,B,O,D,C) && near(dd(O,A)/dd(O,D),dd(A,B)/dd(C,D)) && near(6*12/9,8);`),
      // （1）図1：AB＝15、AC＝20、BC＝18。AD＝9、DB＝6、AE＝12 → EC＝8（AD：DB＝AE：EC → 9：6＝12：x）
      chk(`const ${pj(D1)}; return near(cr(D,E,B,C),0) && near(dd(A,D),9) && near(dd(D,B),6) && near(dd(A,E),12) && near(dd(E,C),8) && near(12*6/9,8);`),
      // （2）図2：AB＝15、AC＝22、BC＝25。AD＝6、DB＝9（AB＝15）、DE＝y＝10（AD：AB＝6：15＝y：25）。AD：DB＝DE：BC とするとまちがい（y＝16.7）
      chk(`const ${pj(D2)}; return near(cr(D,E,B,C),0) && near(dd(A,D),6) && near(dd(D,B),9) && near(dd(A,B),15) && near(dd(B,C),25) && near(dd(D,E),10) && near(6*25/15,10) && !near(6*25/9,10);`),
      // （3）図3：OA＝5、OB＝4、AB＝6（k＝2）、OD＝10、OC＝8、CD＝12。AB∥CD。OA：OD＝AB：DC → 5：10＝6：x、x＝12。OA：OD＝OB：OC → 5：10＝4：y、y＝8
      chk(`const ${pj(D3)}; return near(cr(A,B,C,D),0) && near(dd(O,A),5) && near(dd(O,B),4) && near(dd(A,B),6) && near(dd(O,D),10) && near(dd(O,C),8) && near(dd(C,D),12) && sim(O,A,B,O,D,C) && near(6*10/5,12) && near(4*10/5,8);`),
      // （4）DE∥BC、AD＝x、DB＝10、AE＝6、EC＝15 → x＝4（AD：DB＝AE：EC → x：10＝6：15）。AB＝14、AC＝21 の三角形で確かめる
      chk(`const t=tri(14,21,16), A=t.A, B=t.B, C=t.C, D=lp(A,B,4/14), E=lp(A,C,6/21); return near(cr(D,E,B,C),0) && near(dd(A,D),4) && near(dd(D,B),10) && near(dd(A,E),6) && near(dd(E,C),15) && near(6*10/15,4);`),
      // （5）DE∥BC、AE＝9、AC＝15、DE＝x、BC＝20 → x＝12（AE：AC＝DE：BC → 9：15＝x：20）。AB＝12 の三角形で確かめる
      chk(`const t=tri(12,15,20), A=t.A, B=t.B, C=t.C, D=lp(A,B,9/15), E=lp(A,C,9/15); return near(cr(D,E,B,C),0) && near(dd(A,E),9) && near(dd(A,C),15) && near(dd(B,C),20) && near(dd(D,E),12) && near(9*20/15,12);`),
      // （6）AB∥CD、AD と BC は O で交わる。OA＝3、AD＝8（OD＝AD−OA＝5）、AB＝6 → CD＝10（OA：OD＝AB：DC → 3：5＝6：x）。A(−1.8, 2.4)・B(4.2, 2.4)、k＝5/3
      chk(`const P=xp(1.8,4.2,2.4,5/3), A=P.A, B=P.B, C=P.C, D=P.D, O=P.O; return near(cr(A,B,C,D),0) && near(dd(O,A),3) && near(dd(A,D),8) && near(dd(O,D),5) && near(dd(A,B),6) && near(dd(C,D),10) && onSeg(A,D,O) && near(3*10/5,6) && near(6*5/3,10);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：AB＝9、AC＝18、BC＝14。AD＝3、DF＝2、FB＝4、AE＝6 → EG＝4、GC＝8。AD：DF：FB＝3：2：4＝AE：EG：GC＝6：4：8（DE∥FG∥BC）
      chk(`const ${pj(P4)}; return near(cr(D,E,B,C),0) && near(cr(F,G,B,C),0) && near(dd(A,D),3) && near(dd(D,F),2) && near(dd(F,B),4) && near(dd(A,E),6) && near(dd(E,G),4) && near(dd(G,C),8) && near(dd(A,D)/dd(A,E),dd(D,F)/dd(E,G)) && near(dd(D,F)/dd(E,G),dd(F,B)/dd(G,C)) && near(6*2/3,4) && near(6*4/3,8);`),
      // （8）柱 AB＝6、CD＝4（10m はなれる）：B(0,0)・A(0,6)・D(10,0)・C(10,4)。ロープ AD と BC の交点 E(6, 2.4)。EF＝2.4（＝6×4÷(6+4)）。距離を 10 から 20 にかえても EF は同じ（2.4）
      chk(`const P=${J(P8)}; const A=P.A, B=P.B, C=P.C, D=P.D, E=P.E, F=P.F; const ef=(w)=>{ const a=[0,6], c=[w,4], d=[w,0], b=[0,0]; const s=((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))/((d[0]-a[0])*(c[1]-b[1])-(d[1]-a[1])*(c[0]-b[0])); return a[1]+(d[1]-a[1])*s; }; return near(cr(A,D,A,E),0) && near(cr(B,C,B,E),0) && near(E[1],2.4) && near(dd(E,F),2.4) && near(6*4/(6+4),2.4) && near(ef(10),2.4) && near(ef(20),2.4) && near(ef(7),2.4);`),
      // 小テスト（1）AD＝5、DB＝3、AE＝10 → EC＝6　（2）AD＝4、AB＝10、BC＝15 → DE＝6　（4）AB＝12、AD＝8、AE＝6 → AC＝9
      'near(3 * 10 / 5, 6) && near(4 * 15 / 10, 6) && near(12 * 6 / 8, 9) && near(5 / 3, 10 / 6) && near(4 / 10, 6 / 15) && near(8 / 12, 6 / 9)',
      // 小テスト（3）AB∥CD、OA＝3、OD＝7、AB＝6 → CD＝14（OA：OD＝AB：DC → 3：7＝6：x）。座標：A(−1.8, 2.4)（OA＝3）、B(4.2, 2.4)、k＝7/3
      chk(`const P=xp(1.8,4.2,2.4,7/3), A=P.A, B=P.B, C=P.C, D=P.D, O=P.O; return near(cr(A,B,C,D),0) && near(dd(O,A),3) && near(dd(O,D),7) && near(dd(A,B),6) && near(dd(C,D),14) && near(6*7/3,14);`),
      // 小テスト（5）チャレンジ：AD∥BC の台形 ABCD、AD＝6、BC＝10、AC＝24 → △OAD∽△OCB、AO：OC＝6：10＝3：5、AO＝24×3÷8＝9。座標：B(0,0)・C(10,0)・A(2,h)・D(8,h)（h は AC＝24 になる値）
      chk(`const h=Math.sqrt(24*24-8*8), A=[2,h], B=[0,0], C=[10,0], D=[8,h]; const s=((B[0]-A[0])*(D[1]-B[1])-(B[1]-A[1])*(D[0]-B[0]))/((C[0]-A[0])*(D[1]-B[1])-(C[1]-A[1])*(D[0]-B[0])); const O=[A[0]+(C[0]-A[0])*s, A[1]+(C[1]-A[1])*s]; return near(cr(A,D,B,C),0) && near(dd(A,D),6) && near(dd(B,C),10) && near(dd(A,C),24) && near(dd(A,O),9) && near(dd(O,C),15) && near(dd(A,O)/dd(O,C),6/10) && near(24*3/8,9) && sim(O,A,D,O,C,B);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形と比の性質を使って、線分の長さを求めよう'),
      K('今日の問い', '図1で、DE∥BC のとき、x、y の値を求めたい。三角形と比の定理のどちらを、どの線分に使えばよいだろう。わけも書こう。', 2),
      F(5, cap(fig1, '図1'), cap(fig2, '図2')),
      T('①', '自分の考え（3分）　x、y を求める式と、使った比のわけを書こう。', 1),
      B(4, '（例）x … AD：DB＝AE：EC　8：4＝10：x　x＝5\ny … DE：BC は、AD：AB と等しい。AB＝8+4＝12\n　　 8：12＝y：18　12y＝144　y＝12'),
      T('②', 'ペアの考え（3分）　自分とちがう比の選び方があれば書こう。', 1),
      B(3, ''),
      G(1),
      WD('DE∥BC ならば　AD：DB＝AE：{{EC}}\nDE∥BC ならば　AD：AB＝DE：{{BC}}\n比例式の a、d を{{外項}}、b、c を{{内項}}という。\n外項の積＝{{内項}}の積（ad＝bc）', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '図2で、AB∥CD で、線分 AD と BC は点 O で交わっている。OA＝6cm、OD＝9cm、CD＝12cm のとき、AB＝x の値を求めよう。表の □ をうめよう。', 2),
      TB('', null, [
        ['① 相似な三角形', ['△OAB∽△{{ODC}}']],
        ['② 比例式', ['OA：OD＝AB：{{DC}}　　6：9＝x：{{12}}']],
        ['③ x の値', ['x＝{{8}}']]
      ], { hw: 40 }),
      T('', '【見つけ方のくふう】図1の図と、図2の図は、どこがちがうか。', 1),
      B(3, '図1は、△ABC の辺 AB、AC の上に D、E がある。\n図2は、△OAB の辺 AO、BO を、O のほうへのばした先に D、C がある。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① DE∥BC のとき、AD：DB＝AE：{{EC}}（上と下の比）\n② DE∥BC のとき、AD：AB＝DE：{{BC}}（上と全体の比）\n③ AB∥CD で AD と BC が O で交わるとき、OA：OD＝AB：{{DC}}\n④ 比例式 a：b＝c：d では、{{外項}}の積＝内項の積。', 4, { label: 'ことば' }),
      F(5, cap(d1, '図1'), cap(d2, '図2'), cap(d3, '図3')),
      C2([
        T('（1）', '図1で、DE∥BC のとき、x の値を求めよう。', 2),
        B(3, 'AD：DB＝AE：EC\n9：6＝12：x\nx＝8')
      ], [
        T('（2）', '図2で、DE∥BC のとき、y の値を求めよう。', 2),
        B(3, 'AD：AB＝DE：BC\nAB＝6+9＝15\n6：15＝y：25　y＝10')
      ], '1:1'),
      MA('【説明】（2）で、AB＝6+9 と足してから比をつくるわけを説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '平行線のある図形で、線分の長さを求めよう。'),
      C2([
        T('（3）', '図3で、AB∥CD で、線分 AD と線分 BC は O で交わっている。x、y の値を求めよう。', 3),
        B(4, 'OA：OD＝AB：DC\n5：10＝6：x　x＝12\nOA：OD＝OB：OC\n5：10＝4：y　y＝8')
      ], [
        T('（4）', 'DE∥BC で、AD＝x、DB＝10cm、AE＝6cm、EC＝15cm のとき、x の値を求めよう。', 3),
        B(4, 'AD：DB＝AE：EC\nx：10＝6：15\n15x＝60　x＝4')
      ], '1:1'),
      C2([
        T('（5）', 'DE∥BC で、AE＝9cm、AC＝15cm、DE＝x、BC＝20cm のとき、x の値を求めよう。', 4),
        B(3, 'AE：AC＝DE：BC\n9：15＝x：20\nx＝12')
      ], [
        T('（6）', 'AB∥CD で、線分 AD と線分 BC は O で交わる。OA＝3cm、AD＝8cm、AB＝6cm のとき、CD の長さを求めよう。', 4),
        B(3, 'OD＝8−3＝5（cm）\nOA：OD＝AB：DC\n3：5＝6：CD　CD＝10cm')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：平行な直線が2本あるとき、線分の比を調べよう。'),
      T('（7）', '図4で、DE∥FG∥BC である。AD＝3cm、DF＝2cm、FB＝4cm、AE＝6cm のとき、EG、GC の長さを求めよう。AB 上と AC 上の線分の長さをくらべて、どんなことに気づくだろう。', 3),
      C2([
        F(6, cap(d4, '図4'))
      ], [
        TB('', ['A〜D', 'D〜F', 'F〜B'], [['辺 AB 上（cm）', ['3', '2', '4']], ['辺 AC 上（cm）', ['6', '', '']]], { hw: 38 }),
        T('', '気づいたこと', 1),
        B(3, '')
      ], '1:1'),
      T('', 'EG、GC を求めた式', 1),
      B(5, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '地面に垂直に立つ 2本の柱 AB（6\\m）、CD（4\\m）が、10\\m はなれている。A と D、B と C をロープで結び、交点を E とする。E から地面にひいた垂線 EF の長さを求めよう。', 4)
      ], [
        F(6, fig8)
      ], '3:2'),
      B(5, '△EAB∽△EDC（AB∥CD）より　BE：EC＝AB：DC＝6：4＝3：2\nBE：BC＝3：5\nEF∥CD より　EF：CD＝BE：BC　EF：4＝3：5\nEF＝4×[[3/5]]＝2.4（\\m）'),
      MA('① △EAB と △EDC は、相似かな。BE：EC は、どんな比かな。\n② 10\\m は、答えに関係するかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '△ABC の辺 AB、AC 上に点 D、E があり、DE∥BC である。AD＝5cm、DB＝3cm、AE＝10cm のとき、EC の長さを求めよう。（3点）', 3),
      B(2, 'AD：DB＝AE：EC　5：3＝10：EC\n5EC＝30　EC＝6cm'),
      T('（2）', 'DE∥BC で、AD＝4cm、AB＝10cm、BC＝15cm のとき、DE の長さを求めよう。（3点）', 2),
      B(2, 'AD：AB＝DE：BC　4：10＝DE：15\nDE＝6cm'),
      T('（3）', 'AB∥CD で、線分 AD と線分 BC は点 O で交わっている。OA＝3cm、OD＝7cm、AB＝6cm のとき、CD の長さを求めよう。（2点）', 3),
      B(2, 'OA：OD＝AB：DC　3：7＝6：CD\nCD＝14cm'),
      T('（4）', 'DE∥BC で、AB＝12cm、AD＝8cm、AE＝6cm のとき、AC の長さを求めよう。（2点）', 2),
      B(2, 'AD：AB＝AE：AC　8：12＝6：AC\nAC＝9cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', 'AD∥BC の台形 ABCD で、AD＝6cm、BC＝10cm である。対角線 AC、BD の交点を O とする。AC＝24cm のとき、AO の長さを求めよう。', 3),
      B(3, 'AD∥BC より　△OAD∽△OCB　AO：OC＝AD：CB＝6：10＝3：5\nAO＝24×[[3/8]]＝9（cm）')
    ]
  });
})();
