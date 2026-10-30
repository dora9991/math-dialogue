/* 相似な図形 第11時：中点連結定理を使って、図形の性質を証明しよう。
   元：授業ナビ標準版 souji-11（例）。例題1（四角形 ABCD の 4辺の中点 P、Q、R、S を結ぶと平行四辺形。対角線をひいて証明）を「今日の問い」に、
   練習（AD∥BC の台形で MP、PN、MN）を「例題」（表）に、「もとの四角形が長方形・ひし形のとき PQRS は？」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（四角形 ABCD の 4辺の中点を結んだ PQRS が平行四辺形になるわけ。補助線は図に印刷せず、解答のとき赤の点線で出す）。
     個人3分 → ペア3分 → ことば → 例題（台形の中点連結：図と表）。先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形で、対角線 AC をひく証明を全部書いた。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（対角線の長さから PQ・PS・周、台形の MP・PN・MN、周から BD、AD＝BC の四角形の PQ・QR、台形から BC）／
     裏＝ひろげる（考えよう・答えなし：長方形・ひし形の中点を結ぶ）・チャレンジ★★（BE と AC の交点 F から AF。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、座標（頂点を座標で決め、中点・長さ・平行・面積を計算）から出しなおした。
     「長方形の中点を結ぶとひし形、ひし形の中点を結ぶと長方形」は（7）の答えにかかわるので、ワークシート・演習プリント・答えには書かない（小テストのチャレンジは別枠）。
   検算：node tools/verify.cjs souji-11　／　見た目：node tools/check.cjs <出力先> souji-11 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const mid = (P, Q) => lerp(P, Q, 0.5);
  // 四角形 ABCD に、各辺の中点 P（AB）・Q（BC）・R（CD）・S（DA）をそえる
  const withMid = Q => Object.assign({}, Q, { P: mid(Q.A, Q.B), Q: mid(Q.B, Q.C), R: mid(Q.C, Q.D), S: mid(Q.D, Q.A) });
  // 台形 ABCD（AD∥BC）：B(0, 0)・C(bc, 0)・A(off, h)・D(off+ad, h)。M＝AB の中点、N＝DC の中点、P＝AC の中点
  const trap = (ad, bc, h, off) => { const T0 = { A: [off, h], B: [0, 0], C: [bc, 0], D: [off + ad, h] }; T0.M = mid(T0.A, T0.B); T0.N = mid(T0.D, T0.C); T0.P = mid(T0.A, T0.C); return T0; };
  // 対角線で決める四角形：交点 O を原点に、AO・OC は x 軸の上、BO・OD は向き θ（度）の直線の上
  const diag = (ao, oc, bo, od, th) => { const r = th * Math.PI / 180, u = [Math.cos(r), Math.sin(r)]; return { A: [-ao, 0], B: [-bo * u[0], -bo * u[1]], C: [oc, 0], D: [od * u[0], od * u[1]], O: [0, 0] }; };
  const tk4 = [['A', 'P', 1], ['P', 'B', 1], ['B', 'Q', 2], ['Q', 'C', 2], ['C', 'R', 3], ['R', 'D', 3], ['D', 'S', 4], ['S', 'A', 4]];
  const VQ = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], P: ['P', 180, 3], Q: ['Q', 270, 3], R: ['R', 0, 3], S: ['S', 90, 3] };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：四角形 ABCD（どの辺も平行でない）と、各辺の中点 P、Q、R、S。解答では、対角線 AC（赤の点線）
  const PW = withMid({ A: [0.4, 3.6], B: [0, 0], C: [4.8, 0.7], D: [3.9, 3.1] });
  const figW = GEO({ pts: PW, poly: ['ABCD', 'PQRS'], dots: ['P', 'Q', 'R', 'S'], tick: tk4, vl: VQ, pad: 7, a: { segs: [['A', 'C', { dash: 1 }]] } });
  // 例題：AD∥BC の台形（AD＝6、BC＝14）。M は AB の中点、MN∥BC。P は AC 上、N は CD 上。MP＝7、PN＝3、MN＝10
  const PT = trap(6, 14, 5, 3);
  const figT = GEO({
    pts: PT, poly: 'ABCD', segs: ['AC', 'MN'], dots: ['M', 'N', 'P'], tick: [['A', 'M', 1], ['M', 'B', 1]], par: [['M', 'P', 1, 0.45], ['B', 'C', 1, 0.5]], pad: 7,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], M: ['M', 180], N: ['N', 0], P: ['P', 270, 3.4] },
    txt: [{ p: mid(PT.A, PT.D), t: '6cm', dy: -3.8 }, { p: mid(PT.B, PT.C), t: '14cm', dy: 5.4 }]
  });
  // 演習プリント 図1（1）（2）：対角線 AC＝12、BD＝8（AO＝5、OC＝7、BO＝3、OD＝5）。PQ＝6、PS＝4、周 20
  const P1 = withMid(diag(5, 7, 3, 5, 65));
  const fig1 = GEO({
    pts: P1, poly: ['ABCD', 'PQRS'], segs: [['A', 'C', { dash: 1 }], ['B', 'D', { dash: 1 }]], dots: ['P', 'Q', 'R', 'S'], pad: 8, size: 2.8,
    vl: { A: ['A', 180], B: ['B', 225], C: ['C', 0], D: ['D', 90], P: ['P', 180, 3], Q: ['Q', 315, 3], R: ['R', 45, 3], S: ['S', 135, 3] }
  });
  // 図2（3）：AD∥BC の台形（AD＝8、BC＝18）。M は AB の中点、MN∥BC。MP＝9、PN＝4、MN＝13
  const P2 = trap(8, 18, 6, 4);
  const fig2 = GEO({
    pts: P2, poly: 'ABCD', segs: ['AC', 'MN'], dots: ['M', 'N', 'P'], tick: [['A', 'M', 1], ['M', 'B', 1]], par: [['M', 'P', 1, 0.45], ['B', 'C', 1, 0.5]], pad: 8,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], M: ['M', 180], N: ['N', 0], P: ['P', 270, 3.4] },
    txt: [{ p: mid(P2.A, P2.D), t: '8cm', dy: -3.8 }, { p: mid(P2.B, P2.C), t: '18cm', dy: 5.4 }]
  });
  // 図3（5）：四角形 ABCD で AD＝BC＝10。B(0, 0)・C(10cos20°, 10sin20°)、A(1, 6)・D(A+(10, 0))。P、Q、R は AB、AC、CD の中点。PQ＝QR＝5
  const P3 = { A: [1, 6.2], B: [0, 0], C: [10 * Math.cos(20 * Math.PI / 180), 10 * Math.sin(20 * Math.PI / 180)], D: [11, 6.2] };
  P3.P = mid(P3.A, P3.B); P3.Q = mid(P3.A, P3.C); P3.R = mid(P3.C, P3.D);
  const fig3 = GEO({
    pts: P3, poly: 'ABCD', segs: [['A', 'C', { dash: 1 }], 'PQ', 'QR'], dots: ['P', 'Q', 'R'], pad: 8, size: 2.8,
    tick: [['A', 'D', 1, 0.5], ['B', 'C', 1, 0.5]],
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], P: ['P', 180, 3], Q: ['Q', 270, 3.2], R: ['R', 0, 3] }
  });
  // （7）考えよう：長方形（ア）とひし形（イ）に、各辺の中点 P、Q、R、S（結ぶ線はかかない）
  const QA = withMid({ A: [0, 3], B: [0, 0], C: [5, 0], D: [5, 3] });
  const QI = withMid({ A: [0, 2], B: [3, 0], C: [6, 2], D: [3, 4] });
  const quadFig = Q => GEO({ pts: Q, poly: 'ABCD', dots: ['P', 'Q', 'R', 'S'], pad: 6, size: 2.8, vl: VQ });
  const figA = quadFig(QA), figI = quadFig(QI);
  // （8）：A(6, 9)・B(0, 0)・C(18, 0)。AC＝15。D は BC の中点、E は AD の中点、F は BE と AC の交点（AF＝5）
  const P8 = { A: [6, 9], B: [0, 0], C: [18, 0], D: [9, 0] }; P8.E = mid(P8.A, P8.D); P8.F = lerp(P8.A, P8.C, 1 / 3);
  const fig8 = GEO({
    pts: P8, poly: 'ABC', segs: ['AD', 'BE'], dots: ['D', 'E', 'F'], tick: [['B', 'D', 1], ['D', 'C', 1], ['A', 'E', 2], ['E', 'D', 2]], pad: 7,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270], E: ['E', 180, 3.2], F: ['F', 0, 3.2] }
  });

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), lp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], mid=(P,Q)=>lp(P,Q,0.5), '
    + 'cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), pa=(P,Q,S,U)=>Math.abs(cr(P,Q,S,U))<1e-9*(1+dd(P,Q)*dd(S,U)), '
    + 'an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'wm=Q=>Object.assign({},Q,{P:mid(Q.A,Q.B),Q:mid(Q.B,Q.C),R:mid(Q.C,Q.D),S:mid(Q.D,Q.A)}), '   // 四角形に、各辺の中点 P、Q、R、S をそえる
    + 'para=Q=>pa(Q.P,Q.Q,Q.S,Q.R) && near(dd(Q.P,Q.Q),dd(Q.S,Q.R)) && pa(Q.Q,Q.R,Q.P,Q.S) && near(dd(Q.Q,Q.R),dd(Q.P,Q.S)), '   // PQRS が平行四辺形か
    + 'cvx=Q=>{const s=[[Q.A,Q.B,Q.C],[Q.B,Q.C,Q.D],[Q.C,Q.D,Q.A],[Q.D,Q.A,Q.B]].map(([a,b,c])=>cr(a,b,b,c)); return s.every(v=>v>1e-9)||s.every(v=>v<-1e-9);}, '   // 凸四角形か
    + 'tp=(ad,bc,h,off)=>{const Q={A:[off,h],B:[0,0],C:[bc,0],D:[off+ad,h]}; Q.M=mid(Q.A,Q.B); Q.N=mid(Q.D,Q.C); Q.P=mid(Q.A,Q.C); return Q;}, '   // 台形 ABCD（AD∥BC）
    + 'dg=(ao,oc,bo,od,th)=>{const r=th*Math.PI/180,u=[Math.cos(r),Math.sin(r)];return {A:[-ao,0],B:[-bo*u[0],-bo*u[1]],C:[oc,0],D:[od*u[0],od*u[1]],O:[0,0]};}, '   // 対角線で決める四角形
    + 'area=pts=>Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  /* ---------------- 答えの文 ---------------- */
  // 今日の問い（ワークシート ①）：先生の板書の例
  const A_W = '（例）（仮定）P、Q、R、S は、AB、BC、CD、DA の中点\n（結論）四角形 PQRS は平行四辺形\n（証明）対角線 AC をひく。\n△ABC で、中点連結定理より　PQ∥AC、PQ＝[[1/2]]AC …①\n△ACD で、中点連結定理より　SR∥AC、SR＝[[1/2]]AC …②\n①、②より　PQ∥SR、PQ＝SR\n1組の対辺が平行で、その長さが等しいから、\n四角形 PQRS は平行四辺形である。';

  IK.lesson('souji-11', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第11時', title: '中点連結定理を使って、図形の性質を証明しよう',
    summary: '四角形 ABCD の 4辺の中点 P、Q、R、S を結んだ四角形が平行四辺形になることを、対角線をひいて三角形をつくり、中点連結定理を使って証明する。台形の中点連結や、補助線をひいて中点を見つける問題に使う。',
    head: '相似な図形　第11時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：四角形 ABCD の各辺の中点 P、Q、R、S（座標から）。△ABC で PQ∥AC・PQ＝AC÷2、△ACD で SR∥AC・SR＝AC÷2 → PQ∥SR、PQ＝SR → 平行四辺形。ほかの辺は平行でない
      chk(`const ${pj(PW)}; const QQ={A,B,C,D,P,Q,R,S}; return cvx(QQ) && !pa(A,B,C,D) && !pa(B,C,D,A) && pa(P,Q,A,C) && near(dd(P,Q),dd(A,C)/2) && pa(S,R,A,C) && near(dd(S,R),dd(A,C)/2) && pa(P,Q,S,R) && near(dd(P,Q),dd(S,R)) && para(QQ) && near(dd(A,P),dd(P,B)) && near(dd(B,Q),dd(Q,C)) && near(dd(C,R),dd(R,D)) && near(dd(D,S),dd(S,A));`),
      // 例題：AD∥BC の台形（AD＝6、BC＝14）。P は AC の中点：△ABC で MP∥BC・MP＝14÷2＝7、△CDA で PN∥AD・PN＝6÷2＝3。MN∥BC で M、P、N は一直線、MN＝10＝(6+14)÷2
      chk(`const ${pj(PT)}; return pa(A,D,B,C) && near(dd(A,D),6) && near(dd(B,C),14) && pa(M,P,B,C) && pa(P,N,B,C) && near(dd(M,P),7) && near(dd(P,N),3) && near(dd(M,N),10) && near(dd(M,P)+dd(P,N),dd(M,N)) && near((6+14)/2,10) && near(dd(M,P),dd(B,C)/2) && near(dd(P,N),dd(A,D)/2);`),
      // （1）（2）図1：AC＝12、BD＝8（AO＝5、OC＝7、BO＝3、OD＝5）。PQ＝AC÷2＝6、PS＝BD÷2＝4。四角形 PQRS の周＝2×(6+4)＝20。PQRS は平行四辺形
      chk(`const ${pj(P1)}; const QQ={A,B,C,D,P,Q,R,S}; return cvx(QQ) && near(dd(A,C),12) && near(dd(B,D),8) && near(dd(P,Q),6) && near(dd(P,S),4) && near(dd(S,R),6) && near(dd(Q,R),4) && near(dd(P,Q)+dd(Q,R)+dd(R,S)+dd(S,P),20) && para(QQ) && near(2*(12/2+8/2),20);`),
      // （3）図2：AD∥BC の台形（AD＝8、BC＝18）。MP＝18÷2＝9、PN＝8÷2＝4、MN＝13＝(8+18)÷2
      chk(`const ${pj(P2)}; return pa(A,D,B,C) && near(dd(A,D),8) && near(dd(B,C),18) && pa(M,N,B,C) && near(dd(M,P),9) && near(dd(P,N),4) && near(dd(M,N),13) && near(dd(M,P)+dd(P,N),dd(M,N)) && near((8+18)/2,13);`),
      // （4）PQRS の周＝AC＋BD＝28、AC＝10 → BD＝18：座標（AC＝10、BD＝18 の四角形）で周を計算する。BD が 17・19 だと周は 28 にならない
      chk(`const f=bd=>{const Q=wm(dg(4,6,bd*0.4,bd*0.6,70)); return dd(Q.P,Q.Q)+dd(Q.Q,Q.R)+dd(Q.R,Q.S)+dd(Q.S,Q.P);}; const Q0=dg(4,6,18*0.4,18*0.6,70); return near(dd(Q0.A,Q0.C),10) && near(dd(Q0.B,Q0.D),18) && near(f(18),28) && !near(f(17),28) && !near(f(19),28) && near(2*(10/2+18/2),28) && near(28/2*2-10,18);`),
      // （5）図3：AD＝BC＝10。P、Q、R は AB、AC、CD の中点。PQ＝BC÷2＝5、QR＝AD÷2＝5（座標から）
      chk(`const ${pj(P3)}; return near(dd(A,D),10) && near(dd(B,C),10) && pa(P,Q,B,C) && pa(Q,R,A,D) && near(dd(P,Q),5) && near(dd(Q,R),5) && near(dd(P,Q),dd(Q,R)) && !pa(A,D,B,C);`),
      // （6）AD∥BC の台形：AD＝12、MN＝15 → BC＝2×15−12＝18（座標でも MN＝15）。BC が 17・19 だと MN は 15 にならない
      chk(`const f=bc=>dd(tp(12,bc,5,2).M,tp(12,bc,5,2).N); return near(f(18),15) && !near(f(17),15) && !near(f(19),15) && near(2*15-12,18);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：長方形（ア）の中点を結ぶと 4辺が等しい（ひし形）、ひし形（イ）の中点を結ぶと 4つの角が直角（長方形）
      chk(`const A1=${J(QA)}, I1=${J(QI)}; const eq=Q=>[dd(Q.P,Q.Q),dd(Q.Q,Q.R),dd(Q.R,Q.S),dd(Q.S,Q.P)].every(v=>near(v,dd(Q.P,Q.Q))), rt=Q=>[[Q.S,Q.P,Q.Q],[Q.P,Q.Q,Q.R],[Q.Q,Q.R,Q.S],[Q.R,Q.S,Q.P]].every(([a,b,c])=>near(an(b,a,c),90)); return para(A1) && eq(A1) && !rt(A1) && para(I1) && rt(I1) && !eq(I1) && near(dd(A1.A,A1.C),dd(A1.B,A1.D)) && near(an(I1.O||[3,2],I1.A,I1.B),90);`),
      // （8）図：A(6, 9)・B(0, 0)・C(18, 0)、AC＝15。D は BC の中点、E は AD の中点、F＝BE と AC の交点。AF＝5＝15÷3（AF＝FG＝GC。G は D を通り BF に平行な直線と AC の交点）
      chk(`const ${pj(P8)}; const G0=lp(A,C,2/3); return near(dd(A,C),15) && near(dd(B,D),dd(D,C)) && near(dd(A,E),dd(E,D)) && near(cr(B,E,B,F),0) && near(dd(A,F)+dd(F,C),dd(A,C)) && near(dd(A,F),5) && near(dd(A,F),15/3) && pa(D,G0,B,F) && near(dd(F,G0),5) && near(dd(G0,C),5);`),
      // 小テスト（1）対角線 BD をひく証明：PS∥BD・PS＝BD÷2、QR∥BD・QR＝BD÷2 → PS∥QR・PS＝QR（ふつうの四角形で確かめる）
      chk(`const Q=wm({A:[0.2,3.8],B:[0,0],C:[5,0.4],D:[4.4,3.3]}); return pa(Q.P,Q.S,Q.B,Q.D) && near(dd(Q.P,Q.S),dd(Q.B,Q.D)/2) && pa(Q.Q,Q.R,Q.B,Q.D) && near(dd(Q.Q,Q.R),dd(Q.B,Q.D)/2) && pa(Q.P,Q.S,Q.Q,Q.R) && near(dd(Q.P,Q.S),dd(Q.Q,Q.R)) && para(Q);`),
      // 小テスト（2）AC＝16、BD＝10 → 周＝16+10＝26　（3）AD＝6、BC＝12 の台形 → MN＝(6+12)÷2＝9
      chk(`const Q=wm(dg(8,8,2.5,7.5,60)), T0=tp(6,12,4,1); return near(dd(Q.A,Q.C),16) && near(dd(Q.B,Q.D),10) && near(dd(Q.P,Q.Q)+dd(Q.Q,Q.R)+dd(Q.R,Q.S)+dd(Q.S,Q.P),26) && near(dd(T0.M,T0.N),9) && pa(T0.M,T0.N,T0.B,T0.C) && near((6+12)/2,9);`),
      // 小テスト チャレンジ（4）長方形 AB＝10、BC＝24：PQRS はひし形、AC＝26、PQ＝13、周＝52。面積＝240−(1/2×5×12)×4＝120（座標の面積でも 120）
      chk(`const Q=wm({A:[0,10],B:[0,0],C:[24,0],D:[24,10]}); const s=[dd(Q.P,Q.Q),dd(Q.Q,Q.R),dd(Q.R,Q.S),dd(Q.S,Q.P)]; return near(dd(Q.A,Q.C),26) && s.every(v=>near(v,13)) && near(s[0]+s[1]+s[2]+s[3],52) && near(area([Q.P,Q.Q,Q.R,Q.S]),120) && near(240-0.5*5*12*4,120) && near(area([Q.A,Q.B,Q.C,Q.D]),240);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('中点連結定理を使って、図形の性質を証明しよう'),
      C2([
        K('今日の問い', '四角形 ABCD の4辺の中点を P、Q、R、S とする。四角形 PQRS は平行四辺形になる。そのわけを、中点連結定理を使って考えよう。', 5)
      ], [
        F(5, figW)
      ], '3:2'),
      T('①', '自分の考え（3分）　図に線を1本かき入れて、証明を書こう。', 1),
      B(8, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう線のひき方を書こう。', 1),
      B(2, ''),
      WD('四角形は、{{対角線}}をひくと、三角形に分けられる。\n三角形の2辺の{{中点}}を結ぶ線分は、残りの辺に\n{{平行}}で、長さは{{半分}}である。\n1組の対辺が{{平行}}で等しい四角形は{{平行四辺形}}', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', 'AD∥BC の台形 ABCD で、M は AB の中点である。M を通り BC に平行な直線が、AC、CD と交わる点を P、N とする。MP、PN、MN の長さを求めよう。', 5)
      ], [
        F(5, figT)
      ], '3:2'),
      TB('', ['MP', 'PN', 'MN'], [
        ['長さ（cm）', ['{{7}}', '{{3}}', '{{10}}']]
      ], { hw: 40 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。P、Q、R、S は各辺の中点。'),
      WD('① 四角形では、{{対角線}}をひいて三角形をつくると、定理が使える。\n② 三角形の2辺の中点を結ぶ線分は、残りの辺に{{平行}}で、長さは{{半分}}。\n③ 1組の対辺が{{平行}}で、長さが{{等しい}}四角形は、平行四辺形である。\n④ △ABC で M が AB の中点、MN∥BC ならば、N は AC の{{中点}}である。', 4, { label: 'ことば' }),
      F(5, cap(fig1, '図1'), cap(fig2, '図2'), cap(fig3, '図3')),
      C2([
        T('（1）', '図1で、AC＝12cm、BD＝8cm のとき、PQ と PS の長さを求めよう。', 2),
        B(2, 'PQ＝12÷2＝6（cm）\nPS＝8÷2＝4（cm）')
      ], [
        T('（2）', '図1で、四角形 PQRS の周の長さを求めよう。', 2),
        B(2, 'PQ＝SR＝6、PS＝QR＝4\n周は 2×(6+4)＝20（cm）')
      ], '1:1'),
      MA('【説明】対角線をひくと、中点連結定理が使えるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '中点連結定理を使って、長さを求めよう。'),
      C2([
        T('（3）', '図2で、AD∥BC、M は AB の中点、MN∥BC である。MP、PN、MN の長さを求めよう。', 3),
        B(3, 'MP＝18÷2＝9　PN＝8÷2＝4\nMN＝9+4＝13（cm）')
      ], [
        T('（4）', '四角形 ABCD の4辺の中点を結んだ四角形の周が 28cm で、AC＝10cm のとき、BD の長さを求めよう。', 3),
        B(3, '周＝AC+BD だから\n28＝10+BD\nBD＝18（cm）')
      ], '1:1'),
      C2([
        T('（5）', '図3で、AD＝BC＝10cm、P、Q、R は AB、AC、CD の中点である。PQ、QR の長さを求めよう。', 3),
        B(3, 'PQ＝[[1/2]]BC＝5（cm）\nQR＝[[1/2]]AD＝5（cm）')
      ], [
        T('（6）', 'AD∥BC の台形 ABCD（図2とは別）で、AB、DC の中点を M、N とする。AD＝12cm、MN＝15cm のとき、BC の長さを求めよう。', 4),
        B(3, 'MN＝(AD+BC)÷2 だから\n15＝(12+BC)÷2\nBC＝18（cm）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：もとの四角形の形を変えると、どうなるだろう。'),
      T('（7）', '四角形 ABCD の辺の中点 P、Q、R、S を順に結ぶ。ABCD が、ア 長方形、イ ひし形 のとき、四角形 PQRS は、それぞれどんな四角形になるだろう。対角線に目をつけて、説明しよう。', 3),
      C2([
        F(6, cap(figA, 'ア 長方形'), cap(figI, 'イ ひし形'))
      ], [
        T('', '予想と、そのわけ', 1),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC の辺 BC の中点を D、線分 AD の中点を E とする。直線 BE と辺 AC の交点を F とする。AC＝15cm のとき、AF の長さを求めよう。', 6)
      ], [
        F(6, fig8)
      ], '3:2'),
      B(7, '（仮定）BD＝DC、AE＝ED、AC＝15cm\n（方針）D を通り、BF に平行な直線と、AC の交点を G とする。\n△ADG で、E は AD の中点、EF∥DG だから　AF＝FG …①\n△CBF で、D は BC の中点、DG∥BF だから　FG＝GC …②\n①、②より　AF＝FG＝GC\nよって　AF＝15÷3＝5（cm）'),
      MA('① D を通って、BF に平行な直線をひくと、どうなるかな。\n② E、D は、それぞれ何の中点かな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '四角形 ABCD の辺 AB、BC、CD、DA の中点を P、Q、R、S とする。対角線 BD をひいて、四角形 PQRS が平行四辺形であることを証明する。□ をうめよう。（4点）\n△ABD で、P、S は AB、DA の中点だから　PS∥{{BD}}、PS＝{{[[1/2]]BD}} …①\n△CBD で、Q、R は BC、CD の中点だから　QR∥{{BD}}、QR＝{{[[1/2]]BD}} …②\n①、②より　PS∥QR、PS＝QR\n{{1組の対辺}}が平行で、長さが等しいから、四角形 PQRS は平行四辺形である。', 6),
      B(1, 'BD　[[1/2]]BD　BD　[[1/2]]BD　1組の対辺'),
      T('（2）', '四角形 ABCD の 4辺の中点を順に結ぶ。AC＝16cm、BD＝10cm のとき、できる四角形の周の長さを求めよう。（3点）', 2),
      B(2, '辺は 16÷2＝8cm と 10÷2＝5cm\n周は 2×(8+5)＝26（cm）'),
      T('（3）', 'AD∥BC の台形 ABCD で、AD＝6cm、BC＝12cm である。辺 AB、DC の中点を M、N とするとき、MN の長さを求めよう。（3点）', 2),
      B(2, 'MN＝(6+12)÷2＝9（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '長方形 ABCD で、AB＝10cm、BC＝24cm である。4辺の中点を順に結んでできる四角形の、周の長さと面積を求めよう。', 3),
      B(5, 'AC＝26cm（BD も 26cm）。辺は [[1/2]]×26＝13（cm）\n周は 13×4＝52（cm）\n面積は、長方形から 4すみの直角三角形をひく。\n240−[[1/2]]×5×12×4＝120（cm^2）')
    ]
  });
})();
