/* 図形と証明（三角形と四角形） 第6時：直角三角形の合同を使って、証明しよう。
   元：授業ナビ標準版 sankaku-06（例）。例題1（角の二等分線上の点から2辺への垂線の長さは等しい）を「今日の問い」（関係とわけを考える）に、練習1（その逆）を「例題」（証明の穴うめ）に、
   練習2（二等辺三角形の頂点B・Cからの垂線 BD＝CE）を演習プリント（6）の穴うめに、応用の「三角形の2つの角の二等分線の交点から3辺へのきょり」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（図1の PA と PB の関係とわけ）。個人3分 → ペア3分 → ことば → 例題（逆の証明の空欄）。図2は例題の図。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
   ・証明は「△〜 と △〜 において」の形（前の形 heikou の書き方）。答え（B）は「（仮定）…／（結論）…／（証明）…」。
   ・数値・図は新しく作り、座標から、等しい辺・角・合同・結論が成り立つことを checks で確かめた。（7）の図は、印刷そのままの大きさ（mm）で、定規ではかれる。
   検算：node tools/verify.cjs sankaku-06　／　見た目：node tools/check.cjs <出力先> sankaku-06 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify, R = Math.PI / 180;

  /* ---------------- 図の道具 ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const foot = (P, Q, S) => { const u = [S[0] - Q[0], S[1] - Q[1]], t = ((P[0] - Q[0]) * u[0] + (P[1] - Q[1]) * u[1]) / (u[0] * u[0] + u[1] * u[1]); return [Q[0] + t * u[0], Q[1] + t * u[1]]; };
  const unit = (p, q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm。（7）だけ mm） ---------------- */
  // 角の二等分線：O が頂点、OP が二等分線（長さ p、∠POA＝th°）。A、B は P から OX、OY への垂線の足
  const bis = (th, p) => {
    const u = [Math.cos(th * R), Math.sin(th * R)], oa = p * Math.cos(th * R), A = [oa * u[0], oa * u[1]];
    return { O: [0, 0], P: [p, 0], A, B: [A[0], -A[1]], X: [(oa + 1.6) * u[0], (oa + 1.6) * u[1]], Y: [(oa + 1.6) * u[0], -(oa + 1.6) * u[1]] };
  };
  const TH1 = Math.acos(0.8) / R;                     // OA＝4、PA＝3、OP＝5（3・4・5）：∠POA＝36.87°
  const BIS1 = bis(TH1, 5);                           // ワークシート 図1・2、演習プリント 図1
  const BIS2 = bis(32, 5);                            // 演習プリント 図2（∠XOY＝64°、∠POA＝32°）
  const bisFig = (P, o) => GEO({
    pts: P, segs: ['OX', 'OY', 'OP', 'PA', 'PB'], dots: [],
    vl: { O: ['O', 180], X: ['X', 38], Y: ['Y', 322], P: ['P', 0], A: ['A', 105], B: ['B', 255] },
    ang: [{ at: 'A', a: 'P', b: 'O', right: true, r: 3 }, { at: 'B', a: 'P', b: 'O', right: true, r: 3 }].concat(o.arcs ? [{ at: 'O', a: 'P', b: 'X', n: 1, r: 7 }, { at: 'O', a: 'P', b: 'Y', n: 1, r: 7 }] : []),
    tick: o.ticks ? [['P', 'A', 1], ['P', 'B', 1]] : undefined, pad: 6
  });
  // 二等辺三角形 ABC（AB＝AC）と、B から AC への垂線 BD、C から AB への垂線 CE
  const ISO = { A: [0, 5], B: [-4, 0], C: [4, 0] };
  ISO.D = foot(ISO.B, ISO.A, ISO.C); ISO.E = foot(ISO.C, ISO.A, ISO.B);
  const isoFig = GEO({
    pts: ISO, poly: 'ABC', segs: ['BD', 'CE'], tick: [['A', 'B', 1], ['A', 'C', 1]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 20], E: ['E', 160] },
    ang: [{ at: 'D', a: 'B', b: 'C', right: true, r: 2.6 }, { at: 'E', a: 'C', b: 'B', right: true, r: 2.6 }], pad: 6
  });
  // （8）：△ABC（AB＝AC）。M は BC の中点。M から AB、AC への垂線 MD、ME（MD＝ME）
  const MID = { A: [0, 5], B: [-3, 0], C: [3, 0], M: [0, 0] };
  MID.D = foot(MID.M, MID.A, MID.B); MID.E = foot(MID.M, MID.A, MID.C);
  const midFig = GEO({
    pts: MID, poly: 'ABC', segs: ['MD', 'ME'], dots: ['M'], tick: [['B', 'M', 1], ['M', 'C', 1], ['M', 'D', 2], ['M', 'E', 2]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], M: ['M', 270], D: ['D', 150], E: ['E', 30] },
    ang: [{ at: 'D', a: 'M', b: 'A', right: true, r: 2.6 }, { at: 'E', a: 'M', b: 'A', right: true, r: 2.6 }], pad: 7
  });
  // （7）：△ABC（mm）。B、C の二等分線の交点 I。I から 3辺への垂線 ID、IE、IF
  const INC = { A: [15, 32], B: [0, 0], C: [62, 0] };
  const meet = (P1, d1, P2, d2) => { const det = d1[0] * (-d2[1]) - d1[1] * (-d2[0]); const s = ((P2[0] - P1[0]) * (-d2[1]) - (P2[1] - P1[1]) * (-d2[0])) / det; return [P1[0] + s * d1[0], P1[1] + s * d1[1]]; };
  const bisDir = (V, P, Q) => { const a = unit(V, P), b = unit(V, Q), s = [a[0] + b[0], a[1] + b[1]], L = Math.hypot(...s); return [s[0] / L, s[1] / L]; };
  INC.I = meet(INC.B, bisDir(INC.B, INC.A, INC.C), INC.C, bisDir(INC.C, INC.A, INC.B));
  INC.D = foot(INC.I, INC.B, INC.C); INC.E = foot(INC.I, INC.C, INC.A); INC.F = foot(INC.I, INC.A, INC.B);
  const incFig = GEO({
    pts: INC, poly: 'ABC', segs: ['BI', 'CI', 'ID', 'IE', 'IF'], dots: ['I'], scale: 1, pad: 6,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], I: ['I', 330, 3.6], D: ['D', 270], E: ['E', 40], F: ['F', 140] },
    ang: [{ at: 'D', a: 'I', b: 'C', right: true, r: 2.6 }, { at: 'E', a: 'I', b: 'A', right: true, r: 2.6 }, { at: 'F', a: 'I', b: 'A', right: true, r: 2.6 }]
  });

  const wsFig1 = cap(bisFig(BIS1, { arcs: true }), '図1'), wsFig2 = cap(bisFig(BIS1, { ticks: true }), '図2');
  const dFig1 = cap(bisFig(BIS1, { arcs: true }), '図1'), dFig2 = cap(bisFig(BIS2, { ticks: true }), '図2'), dFig3 = cap(isoFig, '図3');

  /* ---------------- 検算の道具 ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'srt=a=>a.slice().sort((x,y)=>x-y), same=(a,b)=>a.every((x,i)=>near(x,b[i])), tri=(S,s)=>[S[s[0]],S[s[1]],S[s[2]]], sides=t=>srt([dd(t[0],t[1]),dd(t[1],t[2]),dd(t[2],t[0])]), angs=t=>srt([an(t[0],t[1],t[2]),an(t[1],t[2],t[0]),an(t[2],t[0],t[1])]), '
    + 'cong=(S,a,b)=>same(sides(tri(S,a)),sides(tri(S,b)))&&same(angs(tri(S,a)),angs(tri(S,b))), len=(S,s)=>dd(S[s[0]],S[s[1]]), deg=(S,s)=>an(S[s[1]],S[s[0]],S[s[2]]);';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const FIGOK_BIS = 'const okb=S=>near(deg(S,"OAP"),90)&&near(deg(S,"OBP"),90)&&near(deg(S,"POA"),deg(S,"POB"))&&near(len(S,"PA"),len(S,"PB"))&&near(len(S,"OA"),len(S,"OB"))&&len(S,"OA")<len(S,"OX");';

  IK.lesson('sankaku-06', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第6時', title: '直角三角形の合同を使って、証明しよう',
    summary: '角の二等分線上の点から2辺にひいた垂線の長さが等しいこと（と、その逆）を、直角三角形の合同条件を使って証明する。「直角・斜辺・もう1つ」の3つを示す。',
    head: '図形と証明　第6時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い（図1）：OP は ∠XOY の二等分線（∠POA＝∠POB）、PA⊥OX、PB⊥OY。PA＝PB。△POA≡△POB（直角・斜辺 OP 共通・∠POA＝∠POB）。結論 PA＝PB は座標でも成り立つ
      chk(`${FIGOK_BIS} const S=${J(BIS1)}; return okb(S) && cong(S,'POA','POB') && near(len(S,'PA'),3) && near(len(S,'OA'),4) && near(len(S,'OP'),5) && near(deg(S,'XOY'),2*deg(S,'POA'));`),
      // 例題（図2）：PA⊥OX、PB⊥OY、PA＝PB ならば、OP は ∠XOY の二等分線。△POA≡△POB（直角・斜辺 OP 共通・PA＝PB＝他の1辺）→ ∠POA＝∠POB（座標でも等しい）
      chk(`${FIGOK_BIS} const S=${J(BIS1)}; return okb(S) && near(len(S,'PA'),len(S,'PB')) && near(len(S,'OP'),len(S,'OP')) && cong(S,'POA','POB') && near(deg(S,'POA'),deg(S,'POB')) && near(deg(S,'POA')+deg(S,'POB'),deg(S,'XOY'));`),
      // （1）図1：△POA と △POB で、∠PAO＝∠PBO＝90°、∠POA＝∠POB、OP は共通（OP＝OP）　（2）OA＝4、PA＝3 → OP＝5（3²＋4²＝5²）、PB＝3、OB＝4
      chk(`${FIGOK_BIS} const S=${J(BIS1)}; return okb(S) && near(deg(S,'PAO'),deg(S,'PBO')) && near(deg(S,'PAO'),90) && near(3*3+4*4,5*5) && near(len(S,'PB'),3) && near(len(S,'OB'),4);`),
      // （3）図2：∠XOY＝64°、PA＝PB → ∠POA＝∠POB＝32°（図の座標でも 64°÷2）
      chk(`${FIGOK_BIS} const S=${J(BIS2)}; return okb(S) && near(deg(S,'XOY'),64) && near(deg(S,'POB'),32) && near(64/2,32) && cong(S,'POA','POB');`),
      // （4）（6）図3：AB＝AC の二等辺三角形（A(0,5)・B(−4,0)・C(4,0)）。BD⊥AC、CE⊥AB。△BCD≡△CBE（∠BDC＝∠CEB＝90°、∠BCD＝∠CBE＝底角、BC 共通）→ BD＝CE
      chk(`const S=${J(ISO)}; return near(len(S,'AB'),len(S,'AC')) && near(deg(S,'BDC'),90) && near(deg(S,'CEB'),90) && near(deg(S,'BCD'),deg(S,'CBE')) && near(deg(S,'BCD'),deg(S,'ACB')) && near(deg(S,'CBE'),deg(S,'ABC')) && cong(S,'BCD','CBE') && near(len(S,'BD'),len(S,'CE')) && len(S,'BC')>len(S,'BD') && len(S,'BC')>len(S,'CE');`),
      // （5）まちがい直し：AC＝DF、BC＝EF（直角をはさむ2辺）の直角三角形（3・4・5）は合同。AC、BC は斜辺 AB より短い（斜辺ではない）
      chk(`const mk=()=>({A:[0,4],B:[3,0],C:[0,0]}); const X=mk(), Y=mk(); return cong(X,'ABC','ABC') && len(X,'AB')>len(X,'AC') && len(X,'AB')>len(X,'BC') && near(deg(X,'ACB'),90) && near(len(X,'AC'),len(Y,'AC')) && near(len(X,'BC'),len(Y,'BC'));`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：△ABC（A(15,32)・B(0,0)・C(62,0) mm）。B、C の二等分線の交点 I から 3辺へのきょり ID、IE、IF は等しい（約 12.9mm）。I は ∠A の二等分線上にもある。足 D、E、F は辺の上
      chk(`const S=${J(INC)}; const onSeg=(P,Q,R)=>{ const t=((P[0]-Q[0])*(R[0]-Q[0])+(P[1]-Q[1])*(R[1]-Q[1]))/((R[0]-Q[0])**2+(R[1]-Q[1])**2); return t>0&&t<1; }; return near(len(S,'ID'),len(S,'IE')) && near(len(S,'IE'),len(S,'IF')) && near(deg(S,'ABI'),deg(S,'IBC')) && near(deg(S,'ACI'),deg(S,'ICB')) && near(deg(S,'BAI'),deg(S,'IAC')) && near(deg(S,'IDB'),90) && near(deg(S,'IEC'),90) && near(deg(S,'IFA'),90) && onSeg(S.D,S.B,S.C) && onSeg(S.E,S.C,S.A) && onSeg(S.F,S.A,S.B) && Math.abs(len(S,'ID')-12.87)<0.05 && Math.round(len(S,'ID'))===13;`),
      // （8）△ABC（A(0,5)・B(−3,0)・C(3,0)）。M は BC の中点（BM＝CM）。MD⊥AB、ME⊥AC、MD＝ME。△BMD≡△CME（∠BDM＝∠CEM＝90°、斜辺 BM＝CM、他の1辺 MD＝ME）→ ∠B＝∠C → AB＝AC
      chk(`const S=${J(MID)}; return near(len(S,'BM'),len(S,'CM')) && near(deg(S,'MDB'),90) && near(deg(S,'MEC'),90) && near(len(S,'MD'),len(S,'ME')) && len(S,'BM')>len(S,'MD') && len(S,'CM')>len(S,'ME') && cong(S,'BMD','CME') && near(deg(S,'MBD'),deg(S,'ABC')) && near(deg(S,'MCE'),deg(S,'ACB')) && near(deg(S,'ABC'),deg(S,'ACB')) && near(len(S,'AB'),len(S,'AC'));`),
      // 小テスト（1）AB＝AC、AD⊥BC（D は BC 上）：△ABD≡△ACD（直角・斜辺 AB＝AC・AD 共通）→ BD＝CD
      chk(`const S={A:[0,6],B:[-3,0],C:[3,0],D:[0,0]}; return near(len(S,'AB'),len(S,'AC')) && near(deg(S,'ADB'),90) && near(deg(S,'ADC'),90) && near(len(S,'AD'),len(S,'AD')) && cong(S,'ABD','ACD') && near(len(S,'BD'),len(S,'CD')) && len(S,'AB')>len(S,'AD');`),
      // 小テスト（2）PA＝PB＝5：PB＝5。∠XOY＝50° → ∠POA＝25°（図：O から 25°ずつ）
      chk(`const S=${J(bis(25, 6))}; return near(deg(S,'XOY'),50) && near(deg(S,'POA'),25) && near(len(S,'PA'),len(S,'PB')) && near(50/2,25);`),
      // 小テスト（3）チャレンジ：△ABC（A(2,7)・B(0,0)・C(9,0)）。B、C の二等分線の交点 I。ID（BC へ）＝IE（CA へ）＝IF（AB へ）。ID＝4 なら、AB、AC へのきょりも 4
      chk(`const unit=(p,q)=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);return [(q[0]-p[0])/d,(q[1]-p[1])/d];}; const bd=(V,P,Q)=>{const a=unit(V,P),b=unit(V,Q),s=[a[0]+b[0],a[1]+b[1]],L=Math.hypot(...s);return [s[0]/L,s[1]/L];}; `
        + `const meet=(P1,d1,P2,d2)=>{const det=d1[0]*(-d2[1])-d1[1]*(-d2[0]); const s=((P2[0]-P1[0])*(-d2[1])-(P2[1]-P1[1])*(-d2[0]))/det; return [P1[0]+s*d1[0],P1[1]+s*d1[1]];}; `
        + `const A=[2,7],B=[0,0],C=[9,0]; const I=meet(B,bd(B,A,C),C,bd(C,A,B)); const dist=(P,Q,R)=>Math.abs((R[0]-Q[0])*(Q[1]-P[1])-(Q[0]-P[0])*(R[1]-Q[1]))/Math.hypot(R[0]-Q[0],R[1]-Q[1]); `
        + `return near(dist(I,B,C),dist(I,C,A)) && near(dist(I,C,A),dist(I,A,B)) && near(dist(I,B,C),I[1]) && near(4,4);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直角三角形の合同を使って、証明しよう'),
      K('今日の問い', '図1で、OP は ∠XOY の二等分線、PA⊥OX、PB⊥OY である。PA と PB の長さには、どんな関係があるだろう。そのわけも考えよう。', 2),
      F(5, wsFig1, wsFig2),
      T('①', '自分の考え（3分）　関係とわけを、書こう。', 1),
      B(5, '（仮定）∠POA＝∠POB、PA⊥OX、PB⊥OY\n（結論）PA＝PB\n（証明）△POA と △POB において\n∠PAO＝∠PBO＝90°、∠POA＝∠POB、OP は共通\n斜辺と1つの鋭角が等しいから　△POA≡△POB　よって　PA＝PB'),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(3, ''),
      G(1),
      WD('直角三角形の合同を使う証明では、3つを示す。\n① どちらも{{直角}}三角形であること\n② 等しい辺が、どちらも{{斜辺}}であること\n③ もう1つ、{{鋭角}}か{{他の1辺}}が等しいこと', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '図2で、PA⊥OX、PB⊥OY、PA＝PB である。OP は ∠XOY の二等分線であることを証明しよう。□ をうめよう。\n△POA と △POB において\n仮定より　∠PAO＝∠PBO＝{{90°}} …①　　PA＝{{PB}} …②\nOP は{{共通}} …③\n①、②、③ より、直角三角形の{{斜辺と他の1辺}}が、それぞれ等しいから　△POA≡△POB\nしたがって　∠POA＝∠{{POB}}\nよって、OP は ∠XOY の二等分線である。', 9)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① どちらも{{直角}}三角形であることを、はじめに示す。\n② 等しい辺が、どちらも{{斜辺}}であることを確かめる。\n③ もう1つは、{{鋭角}}か{{他の1辺}}が等しいことを示す。', 3, { label: 'ことば' }),
      F(4, dFig1, dFig2, dFig3),
      C2([
        T('（1）', '図1の △POA と △POB で、等しいものを3つ答えよう。', 2),
        B(3, '∠PAO＝∠PBO＝90°\n∠POA＝∠POB\nOP は共通')
      ], [
        T('（2）', '図1で、PA＝3cm、OA＝4cm のとき、PB、OB は何 cm か。', 2),
        B(2, 'PB＝3cm\nOB＝4cm')
      ], '1:1'),
      MA('【説明】（1）の3つは、直角・斜辺・もう1つのどれか、説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '合同を使って、角の大きさや証明を考えよう。'),
      C2([
        T('（3）', '図2で、PA＝PB である。∠XOY＝64° のとき、∠POB は何度か。', 2),
        B(3, '△POA≡△POB\n（斜辺と他の1辺）\n∠POB＝64°÷2＝32°')
      ], [
        T('（4）', '図3で、△BCD と △CBE の、等しいものを3つ答えよう。', 2),
        B(3, '∠BDC＝∠CEB＝90°\n∠BCD＝∠CBE（底角）\nBC は共通')
      ], '1:1'),
      T('（5）', '「∠C＝∠F＝90° の △ABC、△DEF で、AC＝DF、BC＝EF だから、斜辺と他の1辺が等しく、合同」と書いた。まちがいを直そう。', 2),
      B(1, 'AC、BC は斜辺ではない。2組の辺とその間の角（90°）が等しい。'),
      T('（6）', '図3で、BD＝CE を証明する。□ をうめよう。\n△BCD と △CBE において　∠BDC＝∠CEB＝{{90°}} …①\n二等辺三角形の{{底角}}は等しいから　∠BCD＝∠CBE …②\nBC は{{共通}} …③\n①、②、③ より、{{斜辺と1つの鋭角}}が等しいから　△BCD≡△CBE\nよって　BD＝{{CE}}', 6),
      B(1, '90°　底角　共通　斜辺と1つの鋭角　CE'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：三角形の中の点から、3辺までのきょりを調べよう。'),
      T('（7）', '△ABC の ∠B、∠C の二等分線が I で交わる。I から 3辺 BC、CA、AB に垂線 ID、IE、IF をひき、長さをはかって、表にまとめよう。', 2),
      C2([
        F(6, incFig)
      ], [
        TB('', ['ID', 'IE', 'IF'], [['長さ（mm）', ['', '', '']]], { hw: 30 }),
        T('', '気づいたこと', 1),
        B(3, '')
      ], '1:1'),
      T('', 'なぜそうなるのか、わけも考えよう。', 1),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、M は辺 BC の中点である。M から辺 AB、AC に垂線 MD、ME をひくと、MD＝ME になった。このとき、△ABC は二等辺三角形であることを証明しよう。', 6)
      ], [
        F(6, midFig)
      ], '1:1'),
      B(9, '（仮定）BM＝CM、MD⊥AB、ME⊥AC、MD＝ME\n（結論）△ABC は二等辺三角形\n（証明）△BMD と △CME において\n仮定より　∠BDM＝∠CEM＝90° …①\n　　　　　BM＝CM …②　　MD＝ME …③\n①、②、③ より、直角三角形の斜辺と他の1辺が、それぞれ\n等しいから　△BMD≡△CME\n合同な図形の、対応する角は等しいから　∠B＝∠C\n2つの角が等しい三角形は、二等辺三角形である。'),
      MA('① 二等辺三角形といえるには、何がいえればよかったかな。\n② MD、ME をふくむ直角三角形で、斜辺はどの辺かな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', 'OP は ∠XOY の二等分線で、PA⊥OX、PB⊥OY である。△POA≡△POB を示すとき、使う直角三角形の合同条件を答えよう。（2点）', 3),
      B(1, '斜辺と1つの鋭角が、それぞれ等しい。'),
      T('（2）', 'AB＝AC の △ABC で、頂点 A から辺 BC に垂線 AD をひく。BD＝CD であることを証明する。□ をうめよう。（5点）\n△ABD と △ACD において\n仮定より　∠ADB＝∠ADC＝{{90°}} …①\nAB＝{{AC}} …②\nAD は{{共通}} …③\n①、②、③ より、直角三角形の{{斜辺と他の1辺}}が、それぞれ等しいから　△ABD≡△ACD\nしたがって　BD＝{{CD}}', 9),
      B(1, '90°　AC　共通　斜辺と他の1辺　CD'),
      T('（3）', '∠XOY の二等分線上の点 P から、辺 OX、OY に垂線 PA、PB をひく。PA＝5cm、∠XOY＝50° のとき、PB の長さと ∠POA の大きさを求めよう。（3点）', 3),
      B(2, 'PB＝5cm\n∠POA＝50°÷2＝25°'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '△ABC で、∠B の二等分線と ∠C の二等分線が点 I で交わる。I から辺 BC に垂線 ID をひくと、ID＝4cm であった。I から辺 AB、AC までのきょりは、それぞれ何 cm か。わけも書こう。', 3),
      B(4, 'どちらも 4cm\nI は ∠B の二等分線上にあるから、AB までのきょりは ID と等しい。\n∠C の二等分線上にもあるから、AC までのきょりも ID と等しい。')
    ]
  });
})();
