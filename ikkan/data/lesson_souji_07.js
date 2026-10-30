/* 相似な図形 第7時：三角形の辺に平行な直線をひくと、どんな比ができるだろう。
   元：授業ナビ標準版 souji-07（探）。課題（方眼の △ABC で DE∥BC のとき、AD：AB、AE：AC、DE：BC を調べる）を「今日の問い」（図1）に、例題1（x、y を求める）を「例題」（図2）に、
   「② AD：DB＝AE：EC は ① からどうして導けるか」の考えようは使わず、「D を AB 上で動かすと、DE の長さはどうなるか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（方眼の三角形で、3つの比を調べて、いえそうなこととわけを書く）。個人3分 → ペア3分 → ことば（三角形と比の定理）→ 例題（x は ②、y は ① を使う。表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（DE∥BC と EF∥AB。ヒントカードつき）。
   ・数値・図は新しく作り（今日の問い：方眼の 2：5。授業ナビの 1：3 とはちがう）、辺の長さ・比・平行は、座標から計算しなおして checks にした。
     「D が AB の中点のとき DE＝[[1/2]]BC」は、（7）の答えにかかわるので、ワークシート・演習プリント表・小テストには出さない（比は 2：5・1：3・3：5・3：4 だけ）。
   検算：node tools/verify.cjs souji-07　／　見た目：node tools/check.cjs <出力先> souji-07 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const INK = '#222';

  /* ---------------- 図の道具 ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  // 辺 a-b の、点 ref とは反対がわに、字 t を置く（ref を省くと、△ABC の重心から遠ざかる向き）
  const side = (P, a, b, t, k, ref) => {
    const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = ref ? (Array.isArray(ref) ? ref : P[ref]) : [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3];
    const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1;
    return { p: m, t, dx: (k || 5) * vx / L, dy: -(k || 5) * vy / L };
  };
  // 三角形：B が左下、C が右下（BC＝bc）。AB＝ab、AC＝ac
  const tri = (ab, ac, bc) => { const x = (ab * ab - ac * ac + bc * bc) / (2 * bc); return { A: [x, Math.sqrt(ab * ab - x * x)], B: [0, 0], C: [bc, 0] }; };
  // D は AB 上、E は AC 上（A から t の位置）：DE∥BC
  const para = (P, t) => Object.assign({}, P, { D: lerp(P.A, P.B, t), E: lerp(P.A, P.C, t) });
  // 辺 a-b の外むき（△ABC の重心から遠ざかる向き）の法線の角度（度）
  const outDir = (P, a, b) => { const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3], dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1]; let nx = -dy, ny = dx; if (nx * (m[0] - c[0]) + ny * (m[1] - c[1]) < 0) { nx = -nx; ny = -ny; } return Math.atan2(ny, nx) * 180 / Math.PI; };
  const baseVl = P => ({ A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', outDir(P, 'A', 'B'), 3.4], E: ['E', outDir(P, 'A', 'C'), 3.4] });
  // DE∥BC の図。lab：{ AD, DB, AE, EC, DE, BC } の字
  const paraFig = (P, lab, pad) => {
    const ref = [(P.B[0] + P.C[0]) / 2, (P.B[1] + P.C[1]) / 2], txt = [];
    if (lab.AD) txt.push(side(P, 'A', 'D', lab.AD, 5.2));
    if (lab.DB) txt.push(side(P, 'D', 'B', lab.DB, 5.2));
    if (lab.AE) txt.push(side(P, 'A', 'E', lab.AE, 5.2));
    if (lab.EC) txt.push(side(P, 'E', 'C', lab.EC, 5.2));
    if (lab.DE) txt.push(side(P, 'D', 'E', lab.DE, 3.6, ref));
    if (lab.BC) txt.push({ p: [(P.B[0] + P.C[0]) / 2, 0], t: lab.BC, dy: 5 });
    return GEO({ pts: P, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], par: [['D', 'E', 1], ['B', 'C', 1]], vl: baseVl(P), txt, pad: pad || 7 });
  };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い・図1：方眼の △ABC。A(5,5)・B(0,0)・C(15,0)、D(3,3)・E(9,3)（AD：AB＝AE：AC＝DE：BC＝2：5）
  const G1 = { A: [5, 5], B: [0, 0], C: [15, 0], D: [3, 3], E: [9, 3] };
  const grid = SVG((W, H, h) => {
    const s = Math.min((W - 14) / 15, (H - 8) / 5), ox = (W - 15 * s) / 2, gy = H - 4.6, X = x => ox + x * s, Y = y => gy - y * s, f = h.f2;
    let o = '';
    for (let i = 0; i <= 15; i++) o += h.ln(X(i), Y(0), X(i), Y(5), '#c9d3df', 0.16);
    for (let j = 0; j <= 5; j++) o += h.ln(X(0), Y(j), X(15), Y(j), '#c9d3df', 0.16);
    const L = (a, b, w) => h.ln(X(G1[a][0]), Y(G1[a][1]), X(G1[b][0]), Y(G1[b][1]), INK, w || 0.4, ' stroke-linecap="round"');
    o += L('A', 'B') + L('B', 'C') + L('C', 'A') + L('D', 'E');
    ['D', 'E'].forEach(n => { o += `<circle cx="${f(X(G1[n][0]))}" cy="${f(Y(G1[n][1]))}" r="0.7" fill="${INK}"/>`; });
    // 平行のしるし（＞）：DE と BC のまん中
    [[G1.D, G1.E], [G1.B, G1.C]].forEach(([p, q]) => { const cx = X((p[0] + q[0]) / 2), cy = Y((p[1] + q[1]) / 2); o += `<polyline points="${f(cx - 0.9)},${f(cy - 1.3)} ${f(cx + 0.9)},${f(cy)} ${f(cx - 0.9)},${f(cy + 1.3)}" fill="none" stroke="${INK}" stroke-width="0.34" stroke-linejoin="round" stroke-linecap="round"/>`; });
    const lab = (n, dx, dy) => h.tx(X(G1[n][0]) + dx, Y(G1[n][1]) + dy, n, 3.1, 'middle');
    const halo = (n, dx, dy) => `<rect x="${f(X(G1[n][0]) + dx - 2)}" y="${f(Y(G1[n][1]) + dy - 3)}" width="4" height="3.8" fill="#fff"/>`;   // 方眼の線の上に字がのらないように、白い地をしく
    o += halo('D', -4.2, 0.8) + halo('E', 3.6, -2) + lab('A', 0, -2.1) + lab('B', -2.6, 3.4) + lab('C', 2.6, 3.4) + lab('D', -4.2, 0.8) + lab('E', 3.6, -2);
    return o;
  });
  // 例題・図2：AB＝10、AC＝15、BC＝15。D は AB 上で AD＝6、E は AC 上で AE＝9（AD：AB＝0.6）
  const P2 = para(tri(10, 15, 15), 0.6);
  const fig2 = paraFig(P2, { AD: '6cm', DB: '4cm', AE: '9cm', EC: 'x', DE: 'y', BC: '15cm' });
  // 演習プリント 図1：AB＝5、AC＝10、BC＝11。AD＝2、DB＝3、AE＝4、EC＝x（AD：AB＝0.4）
  const D1 = para(tri(5, 10, 11), 0.4);
  const d1 = paraFig(D1, { AD: '2cm', DB: '3cm', AE: '4cm', EC: 'x' });
  // 図2：AB＝9、AC＝10、BC＝12。AD＝3、DB＝6、DE＝y、BC＝12（AD：AB＝1：3）
  const D2 = para(tri(9, 10, 12), 1 / 3);
  const d2 = paraFig(D2, { AD: '3cm', DB: '6cm', DE: 'y', BC: '12cm' });
  // 図3：AB＝10、AC＝8、BC＝12。AE＝6、EC＝2、DE＝9、BC＝y（AE：AC＝3：4）
  const D3 = para(tri(10, 8, 12), 0.75);
  const d3 = paraFig(D3, { AE: '6cm', EC: '2cm', DE: '9cm', BC: 'y' });
  // 図4（（7））：AB＝6、AC＝10、BC＝12。D は AB 上のどこか（図は、AD＝2 の例）
  const D4 = para(tri(6, 10, 12), 1 / 3);
  const side2 = (P, t, text, k) => { const m = lerp(P.B, P.A, t), c = [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3], vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy); return { p: m, t: text, dx: k * vx / L, dy: -k * vy / L }; };
  const d4b = GEO({
    pts: D4, poly: 'ABC', segs: [['D', 'E', { dash: 1 }]], dots: ['D', 'E'], par: [['D', 'E', 1], ['B', 'C', 1]], vl: baseVl(D4),
    txt: [side2(D4, 0.3, '6cm', 5.2), { p: [6, 0], t: '12cm', dy: 5 }], pad: 7
  });
  // （8）：AB＝15、AC＝18、BC＝20。AD＝9、DB＝6（AD：AB＝0.6）。DE∥BC、E を通り AB に平行な直線と BC の交点 F（BF＝DE＝12、FC＝8）
  const P8 = para(tri(15, 18, 20), 0.6);
  P8.F = lerp(P8.B, P8.C, 0.6);   // EF∥AB になる位置（CF：CB＝CE：CA＝0.4 → BF：BC＝0.6）
  const fig8 = GEO({
    pts: P8, poly: 'ABC', segs: ['DE', 'EF'], dots: ['D', 'E', 'F'], par: [['D', 'E', 1], ['B', 'C', 1], ['A', 'B', 2, 0.3], ['E', 'F', 2]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', outDir(P8, 'A', 'B'), 3.4], E: ['E', outDir(P8, 'A', 'C'), 3.4], F: ['F', 270, 3.4] },
    txt: [side(P8, 'A', 'D', '9cm', 5.2), side(P8, 'D', 'B', '6cm', 5.2), { p: [4.5, 0], t: '20cm', dy: 5.4 }], pad: 7
  });
  // 小テストの図：AB＝9、AC＝12、BC＝12。AD＝3、DB＝6、AE＝4、EC＝x、DE＝y、BC＝12（AD：AB＝1：3）
  const Q1 = para(tri(9, 12, 12), 1 / 3);
  const figQ = paraFig(Q1, { AD: '3cm', DB: '6cm', AE: '4cm', EC: 'x', DE: 'y', BC: '12cm' }, 6);

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), onSeg=(P,Q,X)=>near(dd(P,X)+dd(X,Q),dd(P,Q)), '
    + 'sim=(P1,P2,P3,Q1,Q2,Q3)=>{const a=[dd(P1,P2),dd(P2,P3),dd(P3,P1)],b=[dd(Q1,Q2),dd(Q2,Q3),dd(Q3,Q1)];return near(a[0]/b[0],a[1]/b[1])&&near(a[1]/b[1],a[2]/b[2]);}, '
    + 'lp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], '
    + 'tri=(ab,ac,bc)=>{const x=(ab*ab-ac*ac+bc*bc)/(2*bc);return {A:[x,Math.sqrt(ab*ab-x*x)],B:[0,0],C:[bc,0]};};';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  IK.lesson('souji-07', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第7時', title: '三角形の辺に平行な直線をひくと、どんな比ができるだろう',
    summary: '方眼の △ABC で DE∥BC のとき、AD：AB、AE：AC、DE：BC を調べ、3つの比が等しいことを見つける（△ADE∽△ABC から）。三角形と比の定理を使って、x、y を求める。',
    head: '相似な図形　第7時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・図1（方眼）：A(5,5)・B(0,0)・C(15,0)・D(3,3)・E(9,3)。DE∥BC（外積 0）。AD：AB＝AE：AC＝DE：BC＝2：5（0.4）。DE＝6、BC＝15。D、E は方眼の点。△ADE∽△ABC（∠A 共通、∠ADE＝∠ABC）
      chk(`const ${pj(G1)}; return near(cr(D,E,B,C),0) && onSeg(A,B,D) && onSeg(A,C,E) && near(dd(A,D)/dd(A,B),0.4) && near(dd(A,E)/dd(A,C),0.4) && near(dd(D,E)/dd(B,C),0.4) && near(dd(D,E),6) && near(dd(B,C),15) && near(2/5,6/15) && an(D,A,E)>0 && near(an(D,A,E),an(B,A,C)) && sim(A,D,E,A,B,C) && near(D[0],A[0]+0.4*(B[0]-A[0])) && Number.isInteger(D[0]) && Number.isInteger(E[1]);`),
      // 例題・図2：AB＝10、AC＝15、BC＝15、D：AD＝6（DB＝4）、E：AE＝9（EC＝6）。DE∥BC、DE＝9（①：AD：AB＝DE：BC → 6：10＝y：15、y＝9。②：AD：DB＝AE：EC → 6：4＝9：x、x＝6）。DE：BC＝6：4 ではない
      chk(`const ${pj(P2)}; return near(cr(D,E,B,C),0) && near(dd(A,D),6) && near(dd(D,B),4) && near(dd(A,E),9) && near(dd(E,C),6) && near(dd(D,E),9) && near(dd(B,C),15) && near(6/4,9/6) && near(6/10,9/15) && !near(dd(D,E)/dd(B,C),dd(A,D)/dd(D,B)) && near(9*4/6,6) && near(6*15/10,9);`),
      // （1）図1：AB＝5、AC＝10、BC＝8。AD＝2、DB＝3、AE＝4 → EC＝6（AD：DB＝AE：EC → 2：3＝4：x、x＝6）。DE∥BC
      chk(`const ${pj(D1)}; return near(cr(D,E,B,C),0) && near(dd(A,D),2) && near(dd(D,B),3) && near(dd(A,E),4) && near(dd(E,C),6) && near(dd(A,D)/dd(D,B),dd(A,E)/dd(E,C)) && near(4*3/2,6);`),
      // （2）図2：AB＝9、AC＝10、BC＝12。AD＝3、DB＝6 → AB＝9、DE＝4（AD：AB＝DE：BC → 3：9＝y：12、y＝4）。AD：DB＝3：6 ではなく AD：AB を使う
      chk(`const ${pj(D2)}; return near(cr(D,E,B,C),0) && near(dd(A,D),3) && near(dd(D,B),6) && near(dd(B,C),12) && near(dd(D,E),4) && near(dd(A,D)/dd(A,B),dd(D,E)/dd(B,C)) && near(3*12/9,4) && !near(dd(A,D)/dd(D,B),dd(D,E)/dd(B,C));`),
      // （3）図3：AB＝10、AC＝8、BC＝12。AE＝6、EC＝2（AC＝8）、DE＝9 → BC＝12（AE：AC＝DE：BC → 6：8＝9：y、y＝12）
      chk(`const ${pj(D3)}; return near(cr(D,E,B,C),0) && near(dd(A,E),6) && near(dd(E,C),2) && near(dd(A,C),8) && near(dd(D,E),9) && near(dd(B,C),12) && near(dd(A,E)/dd(A,C),dd(D,E)/dd(B,C)) && near(8*9/6,12);`),
      // （4）AD＝4、DB＝2、EC＝3 → AE＝x＝6（AB＝6、AC＝9 の三角形。D＝AB の 2/3、E＝AC の 2/3）
      chk(`const t=tri(6,9,7), A=t.A, B=t.B, C=t.C, D=lp(A,B,4/6), E=lp(A,C,4/6); return near(cr(D,E,B,C),0) && near(dd(A,D),4) && near(dd(D,B),2) && near(dd(E,C),3) && near(dd(A,E),6) && near(4*3/2,6);`),
      // （5）AD＝x、AB＝12、DE＝6、BC＝8 → AD＝x＝9（AD：AB＝DE：BC → x：12＝6：8）
      chk(`const t=tri(12,10,8), A=t.A, B=t.B, C=t.C, D=lp(A,B,9/12), E=lp(A,C,9/12); return near(cr(D,E,B,C),0) && near(dd(A,B),12) && near(dd(B,C),8) && near(dd(D,E),6) && near(dd(A,D),9) && near(12*6/8,9);`),
      // （6）AE＝x、EC＝6、DE＝8、BC＝12 → AE＝x＝12（AC＝x+6＝18。AE：AC＝DE：BC → x：(x+6)＝8：12、12x＝8x+48、x＝12）
      chk(`const t=tri(15,18,12), A=t.A, B=t.B, C=t.C, D=lp(A,B,12/18), E=lp(A,C,12/18); return near(cr(D,E,B,C),0) && near(dd(E,C),6) && near(dd(D,E),8) && near(dd(B,C),12) && near(dd(A,E),12) && near(dd(A,C),18) && near(dd(A,E)/dd(A,C),dd(D,E)/dd(B,C)) && near(12/(12+6),8/12);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：AB＝6、AC＝10、BC＝12。D を AB 上で AD＝0〜6 にすると DE＝0、2、4、6、8、10、12（DE＝2×AD の比例）。AD＝3（AB の中点）のとき DE＝6＝BC の半分
      chk(`const t=tri(6,10,12), A=t.A, B=t.B, C=t.C; const r=[0,1,2,3,4,5,6].map(a=>{ const D=lp(A,B,a/6), E=lp(A,C,a/6); return [near(cr(D,E,B,C),0)||a===0, dd(D,E)]; }); return r.every(x=>x[0]) && [0,2,4,6,8,10,12].every((v,i)=>near(r[i][1],v)) && near(r[3][1],dd(B,C)/2) && near(dd(A,lp(A,B,0.5)),3);`),
      // （8）AB＝15、AC＝18、BC＝20。AD＝9、DB＝6（AD：AB＝0.6）。DE∥BC → DE＝12。EF∥AB（F は BC 上）→ 四角形 DBFE は平行四辺形、BF＝DE＝12、FC＝20−12＝8（CF：CB＝CE：CA＝6：15＝0.4 → 8）
      chk(`const ${pj(P8)}; return near(cr(D,E,B,C),0) && near(cr(E,F,A,B),0) && onSeg(B,C,F) && near(dd(A,D),9) && near(dd(D,B),6) && near(dd(D,E),12) && near(dd(B,F),dd(D,E)) && near(dd(F,C),8) && near(dd(D,E),20*9/15) && near(dd(C,F)/dd(C,B),dd(C,E)/dd(C,A)) && near(20-12,8) && near(cr(D,B,E,F),0) && near(cr(D,E,B,F),0);`),
      // 小テスト 図：AB＝9、AC＝12、BC＝12。AD＝3、DB＝6、AE＝4、EC＝x＝8、DE＝y＝4（AD：DB＝AE：EC → 3：6＝4：x、x＝8。AD：AB＝DE：BC → 3：9＝y：12、y＝4）
      chk(`const ${pj(Q1)}; return near(cr(D,E,B,C),0) && near(dd(A,D),3) && near(dd(D,B),6) && near(dd(A,E),4) && near(dd(E,C),8) && near(dd(D,E),4) && near(dd(B,C),12) && near(4*6/3,8) && near(3*12/9,4) && near(dd(A,D)/dd(D,B),dd(A,E)/dd(E,C));`),
      // 小テスト（4）AD：DB＝2：3、AE＝8 → EC＝12、AC＝20（AB＝10 の三角形。D＝AB の 2/5）。AD：AB＝AE：AC＝2：5
      chk(`const t=tri(10,20,15), A=t.A, B=t.B, C=t.C, D=lp(A,B,2/5), E=lp(A,C,2/5); return near(cr(D,E,B,C),0) && near(dd(A,D)/dd(D,B),2/3) && near(dd(A,E),8) && near(dd(E,C),12) && near(dd(A,C),20) && near(8*3/2,12);`),
      // 小テスト（5）チャレンジ：AD：DB＝3：4、DE＝9 → AD：AB＝3：7、DE：BC＝3：7、BC＝21（AD：DB＝DE：BC とまちがえると 12）。AB＝14 の三角形で D＝AB の 3/7
      chk(`const t=tri(14,12,21), A=t.A, B=t.B, C=t.C, D=lp(A,B,3/7), E=lp(A,C,3/7); return near(cr(D,E,B,C),0) && near(dd(A,D)/dd(D,B),3/4) && near(dd(D,E),9) && near(dd(B,C),21) && near(9*7/3,21) && !near(9*4/3,21);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形の辺に平行な直線をひくと、どんな比ができるだろう'),
      K('今日の問い', '図1の △ABC で、DE∥BC である。AD：AB、AE：AC、DE：BC を、方眼を使って調べよう。どんなことがいえそうだろう。', 2),
      F(6, cap(grid, '図1'), cap(fig2, '図2')),
      T('①', '自分の考え（3分）　調べた比と、いえそうなこと・わけを書こう。', 1),
      B(4, '（例）D は A から B へ [[2/5]] の位置：AD：AB＝2：5、AE：AC＝2：5\nDE＝6、BC＝15 だから　DE：BC＝6：15＝2：5\n3つの比は、すべて等しい。\nわけ … △ADE∽△ABC（∠A 共通、DE∥BC で同位角が等しい）'),
      T('②', 'ペアの考え（3分）　自分とちがう調べ方や、気づきを書こう。', 1),
      B(4, ''),
      G(1),
      WD('DE∥BC のとき（D、E は辺 AB、AC 上）\n① AD：AB＝AE：AC＝{{DE：BC}}\n② AD：DB＝{{AE：EC}}\nこれを{{三角形と比}}の定理という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '図2で、DE∥BC のとき、x、y の値を求めよう。表の □ をうめよう。', 1),
      TB('', null, [
        ['x の値（② を使う）', ['AD：DB＝AE：EC　　6：4＝9：x　　x＝{{6}}']],
        ['y の値（① を使う）', ['AD：AB＝DE：BC　　6：{{10}}＝y：15　　y＝{{9}}']]
      ], { hw: 44 }),
      T('', '【使い分けのくふう】y を求めるのに、6：4 を使ってよいだろうか。', 1),
      B(4, 'よくない。DE：BC は、AD：AB（上の三角形と全体）と等しい。AB＝6+4＝10。\nAD：DB（上と下）は、AE：EC と等しい。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① DE∥BC のとき、AD：AB＝AE：AC＝{{DE：BC}}\n② DE∥BC のとき、AD：DB＝{{AE：EC}}\n③ 比例式 a：b＝c：d では、外項の積と内項の積が{{等しい}}。\n④ DE∥BC のとき、△ADE と{{△ABC}}は相似である。', 4, { label: 'ことば' }),
      F(5, cap(d1, '図1'), cap(d2, '図2'), cap(d3, '図3')),
      C2([
        T('（1）', '図1で、DE∥BC のとき、x の値を求めよう。', 2),
        B(3, 'AD：DB＝AE：EC\n2：3＝4：x\nx＝6')
      ], [
        T('（2）', '図2で、DE∥BC のとき、y の値を求めよう。', 2),
        B(3, 'AD：AB＝DE：BC\n3：9＝y：12\ny＝4')
      ], '1:1'),
      MA('【説明】（2）で AD：DB でなく AD：AB を使うわけを説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '△ABC の辺 AB、AC 上に D、E があり DE∥BC。長さを求めよう。'),
      C2([
        T('（3）', '図3で、DE∥BC のとき、y の値を求めよう。', 2),
        B(4, 'AE：AC＝DE：BC\n6：8＝9：y\ny＝12')
      ], [
        T('（4）', 'AD＝4cm、DB＝2cm、AE＝x、EC＝3cm のとき、x の値を求めよう。', 2),
        B(4, 'AD：DB＝AE：EC\n4：2＝x：3\nx＝6')
      ], '1:1'),
      C2([
        T('（5）', 'AD＝x、AB＝12cm、DE＝6cm、BC＝8cm のとき、x の値を求めよう。', 2),
        B(6, 'AD：AB＝DE：BC\nx：12＝6：8\nx＝9')
      ], [
        T('（6）', 'AE＝x、EC＝6cm、DE＝8cm、BC＝12cm のとき、x の値を求めよう。', 2),
        B(6, 'AC＝x+6\nAE：AC＝DE：BC\nx：(x+6)＝8：12\nx＝12')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：点 D を動かして、DE の長さを調べよう。'),
      T('（7）', '図4の △ABC で、AB＝6cm、BC＝12cm である。辺 AB 上に点 D をとり、D を通って BC に平行な直線が AC と交わる点を E とする。D を動かすと、DE の長さは、どう変わるだろう。', 3),
      C2([
        F(6, cap(d4b, '図4'))
      ], [
        TB('AD（cm）', ['0', '1', '2', '3', '4', '5', '6'], [['DE（cm）', ['', '', '', '', '', '', '']]], { hw: 22 }),
        T('', '気づいたこと', 1),
        B(3, '')
      ], '1:1'),
      T('', 'DE が BC のちょうど半分になるのは、D が AB のどこにあるときだろう。', 1),
      B(6, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '図の △ABC で、DE∥BC である。E を通り AB に平行な直線と、BC との交点を F とする。AD＝9cm、DB＝6cm、BC＝20cm のとき、DE、FC の長さを求めよう。', 5)
      ], [
        F(5, fig8)
      ], '3:2'),
      B(4, '① DE∥BC より　AD：AB＝DE：BC　9：15＝DE：20　DE＝12cm\n② 四角形 DBFE は平行四辺形だから　BF＝DE＝12cm\nFC＝BC−BF＝20−12＝8（cm）'),
      MA('① 四角形 DBFE は、どんな四角形かな。BF と等しい線分は、どれかな。\n② △ABC と △EFC を考えて、CF：CB を求めてもよいね。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '△ABC の辺 AB、AC 上の点を D、E とする。DE∥BC のとき、次の □ に入る比を書こう。（2点）\nAD：AB＝AE：AC＝{{DE：BC}}　　AD：DB＝{{AE：EC}}', 3),
      B(1, 'DE：BC　／　AE：EC'),
      F(4, figQ),
      T('（2）', '図で、DE∥BC のとき、x の値を求めよう。（3点）', 1),
      B(2, 'AD：DB＝AE：EC　　3：6＝4：x　　x＝8'),
      T('（3）', '図で、DE∥BC のとき、y の値を求めよう。（3点）', 1),
      B(2, 'AD：AB＝DE：BC　　3：9＝y：12　　y＝4'),
      T('（4）', '△ABC で DE∥BC、AD：DB＝2：3 である。AE＝8cm のとき、AC の長さを求めよう。（2点）', 2),
      B(2, 'AE：EC＝2：3　8：EC＝2：3　EC＝12cm\nAC＝8+12＝20（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC で、DE∥BC、AD：DB＝3：4、DE＝9cm のとき、BC の長さを求めよう。', 2),
      B(3, 'AD：AB＝3：7 だから　DE：BC＝3：7\n9：BC＝3：7　BC＝21cm')
    ]
  });
})();
