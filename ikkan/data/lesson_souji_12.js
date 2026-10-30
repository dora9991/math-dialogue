/* 相似な図形 第12時：平行な直線にはさまれた線分の比を調べよう（平行線と線分の比）。
   元：授業ナビ標準版 souji-12（探）。課題（ℓ∥m∥n に 2直線が交わるとき、AB：BC と DE：EF の関係を予想して証明）を「今日の問い」（長さを印刷した図）に、
   例題1（x の値）を「例題」（EF と AC：DF の表）に、「2直線が平行線の間（m 上）で交わるときも成り立つか」を考えよう（演習プリント（7）。BF を予想する）にした。
   ・ワークシートは A4 1枚：問いは1つ（AB＝4・BC＝6・DE＝5・EF＝7.5 の図で、AB：BC と DE：EF の関係とわけ）。個人3分 → ペア3分 → ことば → 例題（図と表）。
     先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形で、A を通り DF に平行な直線をひき、三角形と比の定理を使う証明を書いた。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（x、AB、4本の平行線、比から DE・EF、x の式）／
     裏＝ひろげる（考えよう・答えなし：m 上で交わる図で BF）・チャレンジ★★（AB を 3等分する点から EG・CG。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、座標（平行線を y＝一定の直線で決め、2直線上の点と長さを計算）から出しなおした。
     「m 上で交わるときも成り立つ（BF＝9）」は（7）の答えにかかわるので、ワークシート・演習プリントの表と答えには書かない。
   検算：node tools/verify.cjs souji-12　／　見た目：node tools/check.cjs <出力先> souji-12 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）。w＝図の幅の割合
  const cap = (fig, text, w) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, w ? { w } : undefined);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const mid = (P, Q) => lerp(P, Q, 0.5);
  // 三角形：B が左下、C が右下（BC＝bc）。AB＝ab、AC＝ac
  const tri = (ab, ac, bc) => { const x = (ab * ab - ac * ac + bc * bc) / (2 * bc); return { A: [x, Math.sqrt(ab * ab - x * x)], B: [0, 0], C: [bc, 0] }; };
  // 平行線 ℓ、m、n（、p）に、2直線が交わる図。1つ目の直線の線分の長さ L1（AB、BC、…）と、2つ目の線分の長さ L2（DE、EF、…）。
  // s1＝1つ目の直線の傾き（sin）。どちらも左下がりで、2つ目の上の点は 1つ目の上の点の dx 右。点の名前は n1（A、B、C…）・n2（D、E、F…）
  const parN = (L1, L2, s1, dx, n1, n2) => {
    const c1 = Math.sqrt(1 - s1 * s1), h = L1.map(l => l * s1), s2 = h[0] / L2[0], c2 = Math.sqrt(1 - s2 * s2), P = {};
    let y = h.reduce((a, b) => a + b, 0), a = 0, d = dx;
    P[n1[0]] = [a, y]; P[n2[0]] = [d, y];
    L1.forEach((l, i) => { y -= h[i]; a -= l * c1; d -= L2[i] * c2; P[n1[i + 1]] = [a, y]; P[n2[i + 1]] = [d, y]; });
    return P;
  };
  // 平行線（名前 lab）の線分と、平行のしるし。点の名前の配列 n1 の点が、それぞれの線の上にある
  const lines = (P, n1, labs, pos) => {
    const xs = Object.keys(P).map(k => P[k][0]), xl = Math.min(...xs) - 1.6, xr = Math.max(...xs) + 2.2;
    return {
      segs: n1.map((n, i) => [[xl, P[n][1]], [xr, P[n][1]], { lab: labs[i] }]),
      par: n1.map(n => [[xl, P[n][1]], [xr, P[n][1]], 1, pos || 0.86])
    };
  };
  // 辺 a-b の左（dx＜0）か右（dx＞0）に、長さの字 t を置く
  const lenL = (P, a, b, t, dx, dy) => ({ p: mid(P[a], P[b]), t, dx, dy: dy || 0 });

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：AB＝4、BC＝6、DE＝5、EF＝7.5。AB：BC＝DE：EF＝2：3（ℓ：y＝8、m：y＝4.8、n：y＝0）
  const PW = parN([4, 6], [5, 7.5], 0.8, 8, ['A', 'B', 'C'], ['D', 'E', 'F']);
  const LW = lines(PW, ['A', 'B', 'C'], ['ℓ', 'm', 'n']);
  const figW = GEO({
    pts: PW, segs: [['A', 'C', { ext: [0.1, 0.1] }], ['D', 'F', { ext: [0.1, 0.1] }]].concat(LW.segs), par: LW.par, dots: ['A', 'B', 'C', 'D', 'E', 'F'], pad: 6,
    vl: { A: ['A', 100], B: ['B', 315, 4], C: ['C', 290], D: ['D', 80], E: ['E', 320], F: ['F', 290] },
    txt: [lenL(PW, 'A', 'B', '4cm', -7), lenL(PW, 'B', 'C', '6cm', -7), lenL(PW, 'D', 'E', '5cm', 7), lenL(PW, 'E', 'F', '7.5cm', 9)]
  });
  // 例題：AB＝6、BC＝9、DE＝8、EF＝x（＝12）。AC＝15、DF＝20（AC：DF＝3：4）
  const PT = parN([6, 9], [8, 12], 0.7, 11, ['A', 'B', 'C'], ['D', 'E', 'F']);
  const LT = lines(PT, ['A', 'B', 'C'], ['ℓ', 'm', 'n']);
  const figT = GEO({
    pts: PT, segs: [['A', 'C', { ext: [0.08, 0.08] }], ['D', 'F', { ext: [0.08, 0.08] }]].concat(LT.segs), par: LT.par, dots: ['A', 'B', 'C', 'D', 'E', 'F'], pad: 6,
    vl: { A: ['A', 100], B: ['B', 315, 4], C: ['C', 290], D: ['D', 80], E: ['E', 320], F: ['F', 290] },
    txt: [lenL(PT, 'A', 'B', '6cm', -7), lenL(PT, 'B', 'C', '9cm', -7), lenL(PT, 'D', 'E', '8cm', 7), lenL(PT, 'E', 'F', 'x', 5)]
  });
  // 演習プリント 図1（1）：AB＝4、BC＝10、DE＝6、EF＝x（＝15）
  const P1 = parN([4, 10], [6, 15], 0.8, 13, ['A', 'B', 'C'], ['D', 'E', 'F']);
  const L1 = lines(P1, ['A', 'B', 'C'], ['ℓ', 'm', 'n']);
  const fig1 = GEO({
    pts: P1, segs: [['A', 'C', { ext: [0.08, 0.08] }], ['D', 'F', { ext: [0.08, 0.08] }]].concat(L1.segs), par: L1.par, dots: ['A', 'B', 'C', 'D', 'E', 'F'], pad: 6, size: 2.8,
    vl: { A: ['A', 100], B: ['B', 315, 4], C: ['C', 290], D: ['D', 80], E: ['E', 320], F: ['F', 290] },
    txt: [lenL(P1, 'A', 'B', '4', -4), lenL(P1, 'B', 'C', '10', -5), lenL(P1, 'D', 'E', '6', 4), lenL(P1, 'E', 'F', 'x', 4)]
  });
  // 図2（4）：4本の平行線。AB＝3、BC＝4、CD＝5、EF＝6、FG＝x（＝8）、GH＝y（＝10）
  const P2 = parN([3, 4, 5], [6, 8, 10], 0.8, 19, ['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H']);
  const L2 = lines(P2, ['A', 'B', 'C', 'D'], ['ℓ', 'm', 'n', 'p'], 0.9);
  const fig2 = GEO({
    pts: P2, segs: [['A', 'D', { ext: [0.06, 0.06] }], ['E', 'H', { ext: [0.06, 0.06] }]].concat(L2.segs), par: L2.par, dots: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], pad: 6, size: 2.8,
    vl: { A: ['A', 100], B: ['B', 315, 4], C: ['C', 315, 4], D: ['D', 290], E: ['E', 80], F: ['F', 320], G: ['G', 320], H: ['H', 290] },
    txt: [lenL(P2, 'A', 'B', '3', -4), lenL(P2, 'B', 'C', '4', -4), lenL(P2, 'C', 'D', '5', -4), lenL(P2, 'E', 'F', '6', 4), lenL(P2, 'F', 'G', 'x', 4), lenL(P2, 'G', 'H', 'y', 4)]
  });
  // （7）考えよう：ℓ∥m∥n、2直線は m 上の点 B で交わる。AB＝4、BC＝6、DB＝6（BF は 9。図には書かない）。ℓ：y＝3.2、m：y＝0、n：y＝−4.8
  const sinD = 3.2 / 6, cosD = Math.sqrt(1 - sinD * sinD);
  const P7 = { A: [-2.4, 3.2], B: [0, 0], C: [3.6, -4.8], D: [6 * cosD, 3.2], F: [-9 * cosD, -4.8] };
  const L7 = { segs: [3.2, 0, -4.8].map((y, i) => [[-10, y], [8.5, y], { lab: ['ℓ', 'm', 'n'][i] }]), par: [3.2, 0, -4.8].map(y => [[-10, y], [8.5, y], 1, 0.9]) };
  const fig7 = GEO({
    pts: P7, segs: [['A', 'C', { ext: [0.1, 0.1] }], ['D', 'F', { ext: [0.1, 0.1] }]].concat(L7.segs), par: L7.par, dots: ['A', 'B', 'C', 'D', 'F'], pad: 6,
    vl: { A: ['A', 60], B: ['B', 90, 3.2], C: ['C', 270, 3.6], D: ['D', 70], F: ['F', 270, 3.6] },
    txt: [lenL(P7, 'A', 'B', '4cm', -7), lenL(P7, 'B', 'C', '6cm', 7), lenL(P7, 'B', 'D', '6cm', 6, 3.4)]
  });
  // （8）：AB＝15、AC＝21、BC＝18。D、E は AB を 3等分する点（A に近い順）、F、G は D、E を通り BC に平行な直線と AC の交点
  const P8 = tri(15, 21, 18); P8.D = lerp(P8.A, P8.B, 1 / 3); P8.E = lerp(P8.A, P8.B, 2 / 3); P8.F = lerp(P8.A, P8.C, 1 / 3); P8.G = lerp(P8.A, P8.C, 2 / 3);
  const fig8 = GEO({
    pts: P8, poly: 'ABC', segs: ['DF', 'EG'], dots: ['D', 'E', 'F', 'G'], tick: [['A', 'D', 1], ['D', 'E', 1], ['E', 'B', 1]], pad: 7,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180], E: ['E', 180], F: ['F', 0], G: ['G', 0] }
  });
  // 小テスト（1）の図：AB＝5、BC＝3、DE＝10、EF＝x（＝6）
  const PQ = parN([5, 3], [10, 6], 0.8, 13.5, ['A', 'B', 'C'], ['D', 'E', 'F']);
  const LQ = lines(PQ, ['A', 'B', 'C'], ['ℓ', 'm', 'n']);
  const figQ = GEO({
    pts: PQ, segs: [['A', 'C', { ext: [0.08, 0.08] }], ['D', 'F', { ext: [0.08, 0.08] }]].concat(LQ.segs), par: LQ.par, dots: ['A', 'B', 'C', 'D', 'E', 'F'], pad: 6,
    vl: { A: ['A', 100], B: ['B', 315, 4], C: ['C', 290], D: ['D', 80], E: ['E', 320], F: ['F', 290] },
    txt: [lenL(PQ, 'A', 'B', '5cm', -6), lenL(PQ, 'B', 'C', '3cm', -6), lenL(PQ, 'D', 'E', '10cm', 8), lenL(PQ, 'E', 'F', 'x', 5)]
  });

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), lp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], mid=(P,Q)=>lp(P,Q,0.5), '
    + 'cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), pa=(P,Q,S,U)=>Math.abs(cr(P,Q,S,U))<1e-9*(1+dd(P,Q)*dd(S,U)), '
    + 'col=(P,Q,R)=>Math.abs(cr(P,Q,P,R))<1e-9*(1+dd(P,Q)*dd(P,R)), '
    + 'tr=(ab,ac,bc)=>{const x=(ab*ab-ac*ac+bc*bc)/(2*bc);return {A:[x,Math.sqrt(ab*ab-x*x)],B:[0,0],C:[bc,0]};}, '
    + 'pn=(L1,L2,s1,dx,n1,n2)=>{const c1=Math.sqrt(1-s1*s1),h=L1.map(l=>l*s1),s2=h[0]/L2[0],c2=Math.sqrt(1-s2*s2),P={};let y=h.reduce((a,b)=>a+b,0),a=0,d=dx;P[n1[0]]=[a,y];P[n2[0]]=[d,y];L1.forEach((l,i)=>{y-=h[i];a-=l*c1;d-=L2[i]*c2;P[n1[i+1]]=[a,y];P[n2[i+1]]=[d,y];});return P;};';   // pn：図 parN と同じ（平行線に 2直線が交わる図）
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  /* ---------------- 答えの文 ---------------- */
  // 今日の問い（ワークシート ①）：先生の板書の例
  const A_W = '（例）AB：BC＝4：6＝2：3、DE：EF＝5：7.5＝2：3　→　等しい\n（仮定）ℓ∥m∥n　（結論）AB：BC＝DE：EF\n（証明）A を通り、DF に平行な直線をひき、m、n との\n交点を G、H とする。\n△ACH で、BG∥CH だから　AB：BC＝AG：GH …①\n四角形 AGED、GHFE は平行四辺形だから\nAG＝DE、GH＝EF …②　　①、②より　AB：BC＝DE：EF';

  IK.lesson('souji-12', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第12時', title: '平行な直線にはさまれた線分の比を調べよう',
    summary: '平行な 3本の直線 ℓ、m、n に 2つの直線が交わるとき、AB：BC と DE：EF の関係（比が等しい）を見つけ、A を通り DF に平行な直線をひいて、三角形と比の定理で証明する。比例式で線分の長さを求める。',
    head: '相似な図形　第12時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：AB＝4、BC＝6、DE＝5、EF＝7.5（座標から）。ℓ∥m∥n は y＝一定。A、B、C と D、E、F は一直線上。AB：BC＝DE：EF＝2：3。証明の補助線：G＝A+(E−D)、H＝G+(F−E)。AG＝DE、GH＝EF、BG∥CH、AB：BC＝AG：GH
      chk(`const ${pj(PW)}; const G0=[A[0]+E[0]-D[0],A[1]+E[1]-D[1]], H0=[G0[0]+F[0]-E[0],G0[1]+F[1]-E[1]]; return near(dd(A,B),4) && near(dd(B,C),6) && near(dd(D,E),5) && near(dd(E,F),7.5) && col(A,B,C) && col(D,E,F) && near(A[1],D[1]) && near(B[1],E[1]) && near(C[1],F[1]) && near(dd(A,B)/dd(B,C),dd(D,E)/dd(E,F)) && near(dd(A,B)/dd(B,C),2/3) && pa(A,G0,D,F) && near(G0[1],B[1]) && near(H0[1],C[1]) && col(A,G0,H0) && near(dd(A,G0),dd(D,E)) && near(dd(G0,H0),dd(E,F)) && pa(B,G0,C,H0) && near(dd(A,B)/dd(B,C),dd(A,G0)/dd(G0,H0));`),
      // 例題：AB＝6、BC＝9、DE＝8、EF＝x。6：9＝8：x → x＝12（座標で EF＝12）。AC＝15、DF＝20 → AC：DF＝3：4、AB：AC＝DE：DF＝2：5
      chk(`const ${pj(PT)}; return near(dd(A,B),6) && near(dd(B,C),9) && near(dd(D,E),8) && near(dd(E,F),12) && near(dd(A,C),15) && near(dd(D,F),20) && near(dd(A,C)/dd(D,F),3/4) && near(dd(A,B)/dd(A,C),dd(D,E)/dd(D,F)) && near(8*9/6,12);`),
      // （1）図1：AB＝4、BC＝10、DE＝6、EF＝x → 4：10＝6：x → x＝15（座標で EF＝15）
      chk(`const ${pj(P1)}; return near(dd(A,B),4) && near(dd(B,C),10) && near(dd(D,E),6) && near(dd(E,F),15) && near(dd(A,B)/dd(B,C),dd(D,E)/dd(E,F)) && near(6*10/4,15);`),
      // （2）AB＝x、BC＝9、DE＝10、EF＝15：x を 0.5 きざみで探す（x：9＝10：15）→ 6 だけ。座標で AB＝6、BC＝9、DE＝10、EF＝15 の図をつくっても比が等しい
      chk(`const xs=Array.from({length:60},(_,i)=>(i+1)/2).filter(x=>near(x/9,10/15)); const P=pn([6,9],[10,15],0.8,14,['A','B','C'],['D','E','F']); return xs.join()==='6' && near(dd(P.A,P.B),6) && near(dd(P.B,P.C),9) && near(dd(P.D,P.E),10) && near(dd(P.E,P.F),15);`),
      // （3）AC＝15、DE＝12、DF＝20：AB：AC＝DE：DF → AB＝15×12÷20＝9。座標で AB＝9、BC＝6、DE＝12、EF＝8（AC＝15、DF＝20）
      chk(`const P=pn([9,6],[12,8],0.8,11,['A','B','C'],['D','E','F']); return near(dd(P.A,P.C),15) && near(dd(P.D,P.F),20) && near(dd(P.A,P.B),9) && near(dd(P.A,P.B)/dd(P.A,P.C),dd(P.D,P.E)/dd(P.D,P.F)) && near(15*12/20,9);`),
      // （4）図2：AB＝3、BC＝4、CD＝5、EF＝6 → FG＝x＝8、GH＝y＝10（座標から）。3：4：5＝6：8：10
      chk(`const ${pj(P2)}; return near(dd(A,B),3) && near(dd(B,C),4) && near(dd(C,D),5) && near(dd(E,F),6) && near(dd(F,G),8) && near(dd(G,H),10) && col(A,B,D) && col(E,F,H) && near(dd(A,B)/dd(E,F),dd(B,C)/dd(F,G)) && near(dd(B,C)/dd(F,G),dd(C,D)/dd(G,H)) && near(6*4/3,8) && near(6*5/3,10);`),
      // （5）AB：BC＝2：3、DF＝35 → DE：EF＝2：3：DE＝35×2÷5＝14、EF＝21（座標で DE＝14、EF＝21、AB：BC＝DE：EF）
      chk(`const P=pn([4,6],[14,21],0.8,20,['A','B','C'],['D','E','F']); return near(dd(P.D,P.F),35) && near(dd(P.D,P.E),14) && near(dd(P.E,P.F),21) && near(dd(P.A,P.B)/dd(P.B,P.C),2/3) && near(dd(P.D,P.E)/dd(P.E,P.F),2/3) && near(35*2/5,14) && near(35*3/5,21);`),
      // （6）AB＝x、BC＝x+3、DE＝4、EF＝10：x を 0.5 きざみで探す（x：(x+3)＝4：10）→ 2 だけ（AB＝2、BC＝5）。座標でも AB：BC＝DE：EF
      chk(`const xs=Array.from({length:60},(_,i)=>(i+1)/2).filter(x=>near(x/(x+3),4/10)); const P=pn([2,5],[4,10],0.8,10,['A','B','C'],['D','E','F']); return xs.join()==='2' && near(dd(P.A,P.B),2) && near(dd(P.B,P.C),5) && near(dd(P.D,P.E),4) && near(dd(P.E,P.F),10) && near(dd(P.A,P.B)/dd(P.B,P.C),dd(P.D,P.E)/dd(P.E,P.F));`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：m 上の点 B で交わる。ℓ：y＝3.2、m：y＝0、n：y＝−4.8。AB＝4、BC＝6、DB＝6（座標）→ BF＝6×4.8÷3.2＝9。AB：BC＝DB：BF
      chk(`const ${pj(P7)}; return near(dd(A,B),4) && near(dd(B,C),6) && near(dd(D,B),6) && col(A,B,C) && col(D,B,F) && near(A[1],D[1]) && near(C[1],F[1]) && near(dd(B,F),9) && near(6*4.8/3.2,9) && near(dd(A,B)/dd(B,C),dd(D,B)/dd(B,F)) && !near(dd(B,F),8) && !near(dd(B,F),10);`),
      // （8）図：AB＝15、AC＝21、BC＝18。D、E は AB の 3等分点、DF∥EG∥BC。AF：FG：GC＝1：1：1 → CG＝21÷3＝7。EG＝BC×2÷3＝12（座標でも EG＝12）
      chk(`const ${pj(P8)}; return near(dd(A,D),dd(D,E)) && near(dd(D,E),dd(E,B)) && pa(D,F,B,C) && pa(E,G,B,C) && near(dd(A,F),dd(F,G)) && near(dd(F,G),dd(G,C)) && near(dd(A,C),21) && near(dd(G,C),7) && near(dd(E,G),12) && near(dd(D,F),6) && near(18*2/3,12) && near(21/3,7);`),
      // 小テスト（1）AB＝5、BC＝3、DE＝10、EF＝x → 5：3＝10：x → x＝6（座標で EF＝6）
      chk(`const ${pj(PQ)}; return near(dd(A,B),5) && near(dd(B,C),3) && near(dd(D,E),10) && near(dd(E,F),6) && near(dd(A,B)/dd(B,C),dd(D,E)/dd(E,F)) && near(10*3/5,6);`),
      // 小テスト（2）ア AB＝8、BC＝6、DE＝12、EF＝x → x＝9　イ AB＝x、AC＝16、DE＝5、DF＝20：x：16＝5：20 → x＝4（座標で確かめる）
      chk(`const a=pn([8,6],[12,9],0.8,14,['A','B','C'],['D','E','F']), b=pn([4,12],[5,15],0.8,13,['A','B','C'],['D','E','F']); return near(dd(a.E,a.F),9) && near(dd(a.A,a.B)/dd(a.B,a.C),dd(a.D,a.E)/dd(a.E,a.F)) && near(dd(b.A,b.C),16) && near(dd(b.D,b.F),20) && near(dd(b.A,b.B)/dd(b.A,b.C),dd(b.D,b.E)/dd(b.D,b.F)) && near(dd(b.A,b.B),4) && near(8*12/6,16) && near(8*3/6,4);`),
      // 小テスト（3）AB：BC＝3：5、AC＝24 → AB＝24×3÷8＝9、BC＝15
      `near(24 * 3 / 8, 9) && near(24 * 5 / 8, 15) && near(9 + 15, 24) && near(9 / 15, 3 / 5)`,
      // 小テスト チャレンジ（4）：AD∥BC の台形 AD＝9、BC＝12、AE：EB＝2：1。EF＝AD+(BC−AD)×AE÷AB＝11（座標で、E を通り BC に平行な直線と CD の交点 F）
      chk(`const A=[2,5], B=[0,0], C=[12,0], D=[11,5], E=lp(A,B,2/3), t=(E[1]-C[1])/(D[1]-C[1]), F=lp(C,D,t), G0=lp(A,C,2/3); return near(dd(A,D),9) && near(dd(B,C),12) && near(dd(A,E)/dd(E,B),2) && near(E[1],F[1]) && near(dd(E,F),11) && near(dd(E,G0),8) && near(dd(G0,F),3) && near(9+(12-9)*2/3,11) && near(12*2/3,8) && near(9/3,3);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('平行線にはさまれた線分の比を調べよう'),
      K('今日の問い', 'ℓ∥m∥n である。2つの直線が、図のように、ℓ、m、n と交わっている。AB：BC と DE：EF には、どんな関係があるだろう。わけも考えよう。', 2),
      F(6, figW),
      T('①', '自分の考え（3分）　見つけた関係と、そのわけを書こう。', 1),
      B(7, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう考え方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('3本の平行な直線に、2直線が交わるとき\nAB：BC＝{{DE：EF}}\n平行線で区切られた線分の比は{{等しい}}。\nA を通り DF に{{平行}}な線で、{{三角形}}をつくる。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', 'ℓ∥m∥n のとき、EF の長さと、AC：DF を求めよう。', 5)
      ], [
        F(5, figT)
      ], '3:2'),
      TB('', ['EF の長さ', 'AC：DF'], [
        ['答え', ['{{12}}cm', '{{3：4}}']]
      ], { hw: 30 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。（A、B、C と D、E、F は、ℓ、m、n 上の点）'),
      WD('① 平行な3つの直線に、2つの直線が交わるとき　AB：BC＝{{DE：EF}}\n② 平行線で区切られた線分の比は、どの2直線でも{{等しい}}。\n③ AB：AC＝DE：{{DF}} のように、全体との比も等しい。\n④ 平行線と線分の比は、{{三角形と比}}の定理をもとに証明できる。', 4, { label: 'ことば' }),
      F(7, cap(fig1, '図1', 1), cap(fig2, '図2', 1.9)),
      C2([
        T('（1）', '図1で、ℓ∥m∥n のとき、x の値を求めよう。', 2),
        B(2, '4：10＝6：x\n4x＝60　x＝15')
      ], [
        T('（2）', 'ℓ∥m∥n で、AB＝x、BC＝9、DE＝10、EF＝15（cm）のとき、x の値を求めよう。', 3),
        B(2, 'x：9＝10：15\n15x＝90　x＝6')
      ], '1:1'),
      MA('【説明】平行線で区切られた線分の比が等しいわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '比を使って、長さを求めよう。（長さの単位は cm）'),
      C2([
        T('（3）', 'ℓ∥m∥n で、AC＝15、DE＝12、DF＝20 のとき、AB の長さを求めよう。', 2),
        B(2, 'AB：AC＝DE：DF\nAB：15＝12：20　AB＝9（cm）')
      ], [
        T('（4）', '図2で、4本の平行線に 2直線が交わっている。x、y の値を求めよう。', 2),
        B(2, '3：4＝6：x　x＝8\n3：5＝6：y　y＝10')
      ], '1:1'),
      C2([
        T('（5）', 'ℓ∥m∥n で、AB：BC＝2：3、DF＝35 のとき、DE、EF の長さを求めよう。', 2),
        B(2, 'DE：EF＝2：3 だから\nDE＝14、EF＝21（cm）')
      ], [
        T('（6）', 'ℓ∥m∥n で、AB＝x、BC＝x+3、DE＝4、EF＝10 のとき、x の値を求めよう。', 3),
        B(2, 'x：(x+3)＝4：10\n10x＝4x+12　x＝2')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：平行線の間で、2直線が交わるとき。'),
      T('（7）', '図で、ℓ∥m∥n である。2つの直線が、m 上の点 B で交わっている。AB＝4cm、BC＝6cm、DB＝6cm のとき、BF の長さを予想して、そのわけを考えよう。', 2),
      C2([
        F(7, fig7)
      ], [
        T('', '予想と、そのわけ', 1),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC の辺 AB を 3等分する点を、A に近いほうから D、E とする。D、E を通り BC に平行な直線が、辺 AC と交わる点を、それぞれ F、G とする。BC＝18cm、AC＝21cm のとき、EG、CG の長さを求めよう。', 7)
      ], [
        F(7, fig8)
      ], '3:2'),
      B(6, 'DF∥EG∥BC に、直線 AB、AC が交わっている。\nAD：DE：EB＝1：1：1 だから　AF：FG：GC＝1：1：1\nCG＝21÷3＝7（cm）\n△AEG で、AE：AB＝2：3、EG∥BC だから　EG：BC＝2：3\nEG＝18×[[2/3]]＝12（cm）'),
      MA('① 平行な 3直線に、AB、AC が交わるね。AD：DE：EB は？\n② EG は、どの三角形の辺として考えられるかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図で、ℓ∥m∥n のとき、x の値を求めよう。（3点）', 1),
      F(4, figQ),
      B(2, '5：3＝10：x\n5x＝30　x＝6'),
      T('（2）', 'ℓ∥m∥n で、2つの直線が、順に A、B、C と D、E、F で交わっている。x の値を求めよう。（4点）\nア AB＝8、BC＝6、DE＝12、EF＝x\nイ AB＝x、AC＝16、DE＝5、DF＝20', 4),
      B(2, 'ア 8：6＝12：x　x＝9\nイ x：16＝5：20　x＝4'),
      T('（3）', '（2）と同じ図で、AB：BC＝3：5、AC＝24cm のとき、AB、BC の長さを求めよう。（3点）', 2),
      B(2, 'AB＝24×[[3/8]]＝9（cm）\nBC＝24×[[5/8]]＝15（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', 'AD∥BC の台形 ABCD で、AD＝9cm、BC＝12cm である。辺 AB 上に AE：EB＝2：1 となる点 E をとり、E を通り BC に平行な直線が、辺 CD と交わる点を F とする。EF の長さを求めよう。', 4),
      B(5, 'AC と EF の交点を G とする。\n△ABC で EG∥BC だから　EG：BC＝AE：AB＝2：3　EG＝8\n△CDA で GF∥AD だから　GF：AD＝CG：CA＝1：3　GF＝3\nEF＝8+3＝11（cm）')
    ]
  });
})();
