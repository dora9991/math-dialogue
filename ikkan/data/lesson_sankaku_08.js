/* 図形と証明（三角形と四角形） 第8時：平行四辺形には、どんな性質があるだろう。
   元：授業ナビ標準版 sankaku-08（探）。「平行四辺形の辺や角には、どんな性質がありそうか」を「今日の問い」（印刷そのままの大きさの図を、定規と分度器ではかって、きまりを見つける）に、
   「AB＝CD、BC＝DA を、定義をもとに証明する（対角線 AC をひく）」を「例題」（証明の穴うめ）に、考える問い（性質②∠A＝∠C を、合同の結果から説明する）を考えよう（演習プリント（7）。答えなし）にした。
   ・ワークシートは A4 1枚：問いは1つ。個人3分 → ペア3分 → ことば → 例題（証明の空欄）。図1は、mm の座標どおりの大きさ（AB＝30mm、BC＝50mm、∠B＝70°）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
   ・証明は「△〜 と △〜 において」の形。答え（B）は「（仮定）…／（結論）…／（証明）…」。
   ・数値・図は新しく作り、座標から、辺・角・対角線・合同・結論が成り立つことを checks で確かめた。
   検算：node tools/verify.cjs sankaku-08　／　見た目：node tools/check.cjs <出力先> sankaku-08 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify, R = Math.PI / 180;

  /* ---------------- 図の道具 ---------------- */
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const unit = (p, q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
  const bisDir = (V, P, Q) => { const a = unit(V, P), b = unit(V, Q), s = [a[0] + b[0], a[1] + b[1]], L = Math.hypot(...s); return [s[0] / L, s[1] / L]; };
  const meet = (P1, d1, P2, d2) => { const det = d1[0] * (-d2[1]) - d1[1] * (-d2[0]); const s = ((P2[0] - P1[0]) * (-d2[1]) - (P2[1] - P1[1]) * (-d2[0])) / det; return [P1[0] + s * d1[0], P1[1] + s * d1[1]]; };
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const cen = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 辺 a-b の外がわ（図形の中心から遠ざかる向き）に、字 t を置く
  const side = (P, a, b, t, k) => { const m = mid(P[a], P[b]), c = cen({ A: P.A, B: P.B, C: P.C, D: P.D }); const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1; return { p: m, t, dx: (k || 5) * vx / L, dy: -(k || 5) * vy / L }; };

  /* ---------------- 図の数値（座標から作る。辺の長さは cm。図1だけ mm） ---------------- */
  // 平行四辺形 ABCD：B が左下、BC が底辺（長さ bc）、AB の長さ ab、∠B＝angB°。A は左上、D は右上
  const pg = (ab, bc, angB) => { const B_ = [0, 0], C = [bc, 0], A = [ab * Math.cos(angB * R), ab * Math.sin(angB * R)]; return { A, B: B_, C, D: [A[0] + bc, A[1]] }; };
  const withO = P => Object.assign({ O: mid(P.A, P.C) }, P);
  const PG1 = withO(pg(30, 50, 70));                 // 今日の問い 図1（mm、印刷そのまま）
  const PG2 = pg(3, 5, 70);                           // 例題 図2（長さは図に書かない）
  const PD1 = pg(6, 9, 65);                           // 演習プリント 図1：AB＝6、BC＝9、∠B＝65°
  // 演習プリント 図2：対角線 AC＝10、BD＝14（交点 O を原点に、対角線のあいだの角 60°）。BC が水平になるように回す
  const PD2 = (() => {
    const A = [-5, 0], C = [5, 0], Bq = [7 * Math.cos(240 * R), 7 * Math.sin(240 * R)], D = [-Bq[0], -Bq[1]];
    const a = -Math.atan2(C[1] - Bq[1], C[0] - Bq[0]), rot = p => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
    const P = { A: rot(A), B: rot(Bq), C: rot(C), D: rot(D) }; return withO(P);
  })();
  // 演習プリント 図3：∠BAC＝60°、∠ACB＝50°（∠B＝70°）。BC＝5
  const PD3 = (() => { const bc = 5, ab = bc * Math.sin(50 * R) / Math.sin(60 * R); return pg(ab, bc, 70); })();
  // （8）：AB＝4、BC＝7、∠B＝70°。∠B の二等分線と AD の交点 E、∠D の二等分線と BC の交点 F
  const PE = pg(4, 7, 70);
  PE.E = meet(PE.B, bisDir(PE.B, PE.A, PE.C), PE.A, [1, 0]);
  PE.F = meet(PE.D, bisDir(PE.D, PE.A, PE.C), PE.B, [1, 0]);

  const vlPG = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };
  const figMain = GEO({ pts: PG1, poly: 'ABCD', segs: ['AC', 'BD'], dots: ['O'], vl: Object.assign({ O: ['O', 90, 3.4] }, vlPG), scale: 1, pad: 6 });
  const figEx = GEO({ pts: PG2, poly: 'ABCD', segs: ['AC'], par: [['A', 'B', 1], ['D', 'C', 1], ['A', 'D', 2], ['B', 'C', 2]], vl: vlPG, pad: 8 });
  const dFig1 = cap(GEO({ pts: PD1, poly: 'ABCD', vl: vlPG, ang: [{ at: 'B', a: 'C', b: 'A', t: '65°', r: 4.5 }], txt: [side(PD1, 'A', 'B', '6cm'), side(PD1, 'B', 'C', '9cm')], pad: 8 }), '図1');
  const dFig2 = cap(GEO({ pts: PD2, poly: 'ABCD', segs: ['AC', 'BD'], dots: ['O'], vl: Object.assign({ O: ['O', 90, 3.2] }, vlPG), pad: 7 }), '図2');
  const dFig3 = cap(GEO({
    pts: PD3, poly: 'ABCD', segs: ['AC'], vl: vlPG,
    ang: [{ at: 'A', a: 'B', b: 'C', n: 1, r: 5 }, { at: 'C', a: 'A', b: 'B', n: 2, r: 5 }], pad: 8
  }), '図3');
  const exFig = GEO({ pts: PG2, poly: 'ABCD', segs: ['AC'], vl: vlPG, pad: 8 });
  const figE = GEO({
    pts: PE, poly: 'ABCD', segs: ['BE', 'DF'], vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], E: ['E', 90], F: ['F', 270] },
    ang: [{ at: 'B', a: 'A', b: 'E', n: 1, r: 6 }, { at: 'B', a: 'E', b: 'C', n: 1, r: 6 }, { at: 'D', a: 'C', b: 'F', n: 2, r: 6 }, { at: 'D', a: 'F', b: 'A', n: 2, r: 6 }], pad: 8
  });

  /* ---------------- 検算の道具 ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'srt=a=>a.slice().sort((x,y)=>x-y), same=(a,b)=>a.every((x,i)=>near(x,b[i])), tri=(S,s)=>[S[s[0]],S[s[1]],S[s[2]]], sides=t=>srt([dd(t[0],t[1]),dd(t[1],t[2]),dd(t[2],t[0])]), angs=t=>srt([an(t[0],t[1],t[2]),an(t[1],t[2],t[0]),an(t[2],t[0],t[1])]), '
    + 'cong=(S,a,b)=>same(sides(tri(S,a)),sides(tri(S,b)))&&same(angs(tri(S,a)),angs(tri(S,b))), len=(S,s)=>dd(S[s[0]],S[s[1]]), deg=(S,s)=>an(S[s[1]],S[s[0]],S[s[2]]), '
    + 'cr=(S,a,b,c,d)=>(S[b][0]-S[a][0])*(S[d][1]-S[c][1])-(S[b][1]-S[a][1])*(S[d][0]-S[c][0]), '
    + 'para=S=>Math.abs(cr(S,"A","B","D","C"))<1e-9&&Math.abs(cr(S,"A","D","B","C"))<1e-9;';
  const GL = 'const unit=' + unit + ', bisDir=' + bisDir + ', meet=' + meet + ', R=Math.PI/180, pg0=' + pg + ';';
  const chk = body => `(() => { ${LIB} ${body} })()`;

  IK.lesson('sankaku-08', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第8時', title: '平行四辺形には、どんな性質があるだろう',
    summary: '印刷そのままの大きさの平行四辺形を、定規と分度器ではかって、対辺・対角・対角線のきまりを見つける。AB＝CD、BC＝DA を、定義（2組の対辺が平行）をもとに、対角線をひいて証明する。',
    head: '図形と証明　第8時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い 図1（mm）：AB＝30、BC＝50、∠B＝70°。AB∥DC、AD∥BC。CD＝AB＝30、AD＝BC＝50。∠D＝∠B＝70°、∠A＝∠C＝110°。対角線の交点 O：AO＝CO＝24.4、BO＝DO＝33.3
      chk(`const S=${J(PG1)}; return near(len(S,'AB'),30) && near(len(S,'BC'),50) && near(deg(S,'ABC'),70) && para(S) && near(len(S,'CD'),30) && near(len(S,'AD'),50) && near(deg(S,'CDA'),70) && near(deg(S,'DAB'),110) && near(deg(S,'BCD'),110) && near(len(S,'AO'),len(S,'OC')) && near(len(S,'BO'),len(S,'OD')) && near(len(S,'AO')+len(S,'OC'),len(S,'AC')) && near(len(S,'BO')+len(S,'OD'),len(S,'BD')) && Math.round(len(S,'AO'))===24 && Math.round(len(S,'BO'))===33;`),
      // 例題 図2：平行四辺形 ABCD（AB∥DC、AD∥BC）。対角線 AC：錯角 ∠BAC＝∠DCA、∠BCA＝∠DAC。AC は共通 → △ABC≡△CDA（1組の辺とその両端の角）→ AB＝CD、BC＝DA
      chk(`const S=${J(PG2)}; return para(S) && near(deg(S,'BAC'),deg(S,'DCA')) && near(deg(S,'BCA'),deg(S,'DAC')) && near(len(S,'AC'),len(S,'CA')) && cong(S,'ABC','CDA') && near(len(S,'AB'),len(S,'CD')) && near(len(S,'BC'),len(S,'DA')) && near(deg(S,'ABC'),deg(S,'CDA'));`),
      // （1）図1：AB＝6、BC＝9、∠B＝65°。CD＝6、AD＝9、∠D＝65°、∠A＝180°−65°＝115°
      chk(`const S=${J(PD1)}; return para(S) && near(len(S,'AB'),6) && near(len(S,'BC'),9) && near(deg(S,'ABC'),65) && near(len(S,'CD'),6) && near(len(S,'AD'),9) && near(deg(S,'CDA'),65) && near(deg(S,'DAB'),115) && near(180-65,115);`),
      // （2）図2：AC＝10、BD＝14。OA＝OC＝5、OB＝OD＝7。（図の座標でも、対角線の交点は両方の中点）
      chk(`const S=${J(PD2)}; return para(S) && near(len(S,'AC'),10) && near(len(S,'BD'),14) && near(len(S,'AO'),5) && near(len(S,'OC'),5) && near(len(S,'BO'),7) && near(len(S,'OD'),7) && near(10/2,5) && near(14/2,7) && near(len(S,'AB')**2+len(S,'BC')**2, (100+196)/2);`),
      // （3）図3：∠BAC＝60°、∠ACB＝50°。AB∥DC の錯角 ∠ACD＝∠BAC＝60°。∠D＝∠B＝180°−60°−50°＝70°
      chk(`const S=${J(PD3)}; return para(S) && near(deg(S,'BAC'),60) && near(deg(S,'ACB'),50) && near(deg(S,'ACD'),60) && near(deg(S,'ABC'),70) && near(deg(S,'CDA'),70) && near(180-60-50,70);`),
      // （4）∠A：∠B＝3：2、∠A＋∠B＝180°（AD∥BC）。∠A＝108°、∠B＝72°、∠C＝∠A＝108°。座標：∠B＝72° の平行四辺形で確かめる
      chk(`const S=${J(pg(4, 6, 72))}; return para(S) && near(deg(S,'DAB'),108) && near(deg(S,'ABC'),72) && near(deg(S,'BCD'),108) && near(180*3/5,108) && near(180*2/5,72) && near(108*2,72*3);`),
      // （5）AC＝10、BD＝12、AB＝4（△OAB の周＝15）：OA＝5、OB＝6。O(0,0)、A(−5,0)、B(−4.5,√15.75)、C(5,0)、D(4.5,−√15.75)：平行四辺形、AB＝4、△OAB の周 15
      chk(`const y=Math.sqrt(36-4.5*4.5); const S={A:[-5,0],B:[-4.5,y],C:[5,0],D:[4.5,-y],O:[0,0]}; return para(S) && near(len(S,'AC'),10) && near(len(S,'BD'),12) && near(len(S,'AB'),4) && near(len(S,'AO'),5) && near(len(S,'BO'),6) && near(len(S,'AB')+len(S,'AO')+len(S,'BO'),15) && near(15-5-6,4);`),
      // （6）AB＝5、BC＝8。∠A の二等分線と BC の交点 E：BE＝AB＝5（△ABE は二等辺三角形）、EC＝8−5＝3
      chk(`${GL} const S=pg0(5,8,70); const E=meet(S.A,bisDir(S.A,S.B,S.D),S.B,[1,0]); const T={A:S.A,B:S.B,C:S.C,D:S.D,E}; return para(S) && near(len(T,'BE'),5) && near(len(T,'BE'),len(T,'AB')) && near(deg(T,'BAE'),deg(T,'EAD')) && near(deg(T,'AEB'),deg(T,'BAE')) && near(len(T,'EC'),3) && near(8-5,3);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：△ABC≡△CDA から ∠B＝∠D。∠A＝∠BAC＋∠CAD、∠C＝∠DCA＋∠ACB。錯角 ∠BAC＝∠DCA、∠CAD＝∠ACB。よって ∠A＝∠C
      chk(`const S=${J(PG2)}; return cong(S,'ABC','CDA') && near(deg(S,'ABC'),deg(S,'CDA')) && near(deg(S,'BAC')+deg(S,'CAD'),deg(S,'BAD')) && near(deg(S,'DCA')+deg(S,'ACB'),deg(S,'DCB')) && near(deg(S,'BAC'),deg(S,'DCA')) && near(deg(S,'CAD'),deg(S,'ACB')) && near(deg(S,'BAD'),deg(S,'DCB'));`),
      // （8）AB＝4、BC＝7、∠B＝70°：∠B の二等分線と AD の交点 E、∠D の二等分線と BC の交点 F。△ABE≡△CDF（AB＝CD、∠BAE＝∠DCF、∠ABE＝∠CDF）→ BE＝DF
      chk(`const S=${J(PE)}; return para(S) && near(deg(S,'ABE'),deg(S,'EBC')) && near(deg(S,'CDF'),deg(S,'FDA')) && near(len(S,'AB'),len(S,'CD')) && near(deg(S,'BAE'),deg(S,'DCF')) && near(deg(S,'ABE'),deg(S,'CDF')) && near(deg(S,'ABC'),deg(S,'CDA')) && near(deg(S,'ABE'),deg(S,'ABC')/2) && cong(S,'ABE','CDF') && near(len(S,'BE'),len(S,'DF')) && len(S,'AE')<len(S,'AD') && len(S,'BF')<len(S,'BC');`),
      // 小テスト（1）AB＝4、BC＝7、∠B＝70°：CD＝4、AD＝7、∠D＝70°
      chk(`const S=${J(pg(4, 7, 70))}; return para(S) && near(len(S,'CD'),4) && near(len(S,'AD'),7) && near(deg(S,'CDA'),70);`),
      // 小テスト（2）AC＝12：OA＝6。　（4）∠A＝∠B＋40°、∠A＋∠B＝180° → ∠B＝70°、∠A＝110°
      'near(12 / 2, 6) && near((180 - 40) / 2, 70) && near(70 + 40, 110) && near(70 + 110, 180)',
      // 小テスト（3）対角線の長さは、いつも等しいとは限らない（AC＝48.7、BD＝66.5 の例）。対辺・対角・対角線の中点は、いつも成り立つ
      chk(`const S=${J(PG1)}; return para(S) && Math.abs(len(S,'AC')-len(S,'BD'))>10 && near(len(S,'CD'),len(S,'AB')) && near(deg(S,'DAB'),deg(S,'BCD')) && near(len(S,'AO'),len(S,'OC'));`),
      // 小テスト（5）チャレンジ：周 40（AB＋BC＝20）。△OAB の周−△OBC の周＝AB−BC（OA＝OC）＝4。AB＝12、BC＝8（座標：∠B＝50°の平行四辺形で確かめる）
      chk(`const S=${J(withO(pg(12, 8, 50)))}; const pOAB=len(S,'OA')+len(S,'OB')+len(S,'AB'), pOBC=len(S,'OB')+len(S,'OC')+len(S,'BC'); return para(S) && near(2*(len(S,'AB')+len(S,'BC')),40) && near(pOAB-pOBC,4) && near(len(S,'AB')-len(S,'BC'),4) && near(12+8,20) && near(12-8,4);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('平行四辺形には、どんな性質があるだろう'),
      K('今日の問い', '図1の平行四辺形 ABCD で、辺・角・対角線を、定規と分度器ではかろう。気づいたきまりを書こう。', 2),
      F(6, cap(figMain, '図1（印刷そのままの大きさ）'), cap(figEx, '図2')),
      T('①', '自分の考え（3分）　はかって、気づいたきまりを書こう。', 1),
      B(4, '（例）向かい合う辺の長さが等しい（AB＝CD、BC＝DA）。\n　　向かい合う角の大きさが等しい（∠A＝∠C、∠B＝∠D）。\n　　対角線は、おたがいの真ん中で交わる（AO＝CO、BO＝DO）。'),
      T('②', 'ペアの考え（3分）　自分とちがうきまりを書こう。', 1),
      B(3, ''),
      G(1),
      WD('向かい合う辺を{{対辺}}、向かい合う角を{{対角}}という。\n2組の対辺が、それぞれ{{平行}}な四角形を、\n{{平行四辺形}}という。\n平行四辺形 ABCD を、▱ABCD と書く。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '図2の ▱ABCD で、AB＝CD、BC＝DA であることを、定義をもとに証明しよう。□ をうめよう。\n対角線 AC をひく。△ABC と △CDA において\nAB∥DC より、錯角は等しいから　∠BAC＝∠{{DCA}} …①\nAD∥BC より、錯角は等しいから　∠BCA＝∠{{DAC}} …②\nAC は{{共通}} …③\n①、②、③ より、{{1組の辺とその両端の角}}が、それぞれ等しいから　△ABC≡△CDA\nしたがって　AB＝{{CD}}、BC＝{{DA}}', 9)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 平行四辺形の2組の{{対辺}}は、それぞれ等しい。\n② 平行四辺形の2組の{{対角}}は、それぞれ等しい。\n③ 平行四辺形の対角線は、それぞれの{{中点}}で交わる。\n④ 平行四辺形の定義は、2組の対辺が、それぞれ{{平行}}。', 4, { label: 'ことば' }),
      F(4, dFig1, dFig2, dFig3),
      C2([
        T('（1）', '図1の ▱ABCD で、辺 CD、AD の長さと、∠D、∠A の大きさを求めよう。', 3),
        B(3, 'CD＝6cm、AD＝9cm\n∠D＝65°\n∠A＝180°−65°＝115°')
      ], [
        T('（2）', '図2の ▱ABCD で、AC＝10cm、BD＝14cm のとき、OA、OB は何 cm か。（O は対角線の交点）', 3),
        B(2, 'OA＝10÷2＝5（cm）\nOB＝14÷2＝7（cm）')
      ], '1:1'),
      MA('【説明】平行四辺形の性質を3つ、図を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '性質を使って、長さや角の大きさを求めよう。'),
      C2([
        T('（3）', '図3の ▱ABCD で、∠BAC＝60°、∠ACB＝50° のとき、∠ACD、∠D の大きさを求めよう。', 3),
        B(3, '∠ACD＝60°（錯角）\n∠D＝∠B＝70°\n（180°−60°−50°）')
      ], [
        T('（4）', '▱ABCD で、∠A と ∠B の大きさの比が 3：2 のとき、∠A、∠B、∠C を求めよう。', 3),
        B(3, '∠A＝108°、∠B＝72°\n（180°を 3：2 に分ける）\n∠C＝∠A＝108°')
      ], '1:1'),
      C2([
        T('（5）', '▱ABCD の対角線の交点を O とする。AC＝10cm、BD＝12cm、△OAB の周が 15cm のとき、AB は何 cm か。', 4),
        B(2, 'OA＝5cm、OB＝6cm\nAB＝15−5−6＝4（cm）')
      ], [
        T('（6）', '▱ABCD で、AB＝5cm、BC＝8cm である。∠A の二等分線と辺 BC との交点を E とする。EC は何 cm か。', 4),
        B(3, 'BE＝AB＝5cm\n（△ABE は二等辺三角形）\nEC＝8−5＝3（cm）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：向かい合う角が等しいわけを、考えよう。'),
      T('（7）', '例題の △ABC≡△CDA を使って、▱ABCD の向かい合う角 ∠A と ∠C が等しいわけを、説明できるだろうか。図にしるしをかき入れて考えよう。', 2),
      F(5, exFig),
      C2([
        T('', '∠A＝∠C の説明を書こう', 1),
        B(7, '')
      ], [
        T('', '∠B＝∠D も、同じようにいえるかな', 1),
        B(7, '')
      ], '1:1'),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図の ▱ABCD で、∠B の二等分線と辺 AD との交点を E、∠D の二等分線と辺 BC との交点を F とする。BE＝DF を証明しよう。', 5)
      ], [
        F(5, figE)
      ], '1:1'),
      B(9, '（仮定）▱ABCD、∠ABE＝∠EBC、∠CDF＝∠FDA\n（結論）BE＝DF\n（証明）△ABE と △CDF において\n平行四辺形の対辺は等しいから　AB＝CD …①\n平行四辺形の対角は等しいから　∠BAE＝∠DCF …②\n∠ABC＝∠CDA を、それぞれ二等分したから　∠ABE＝∠CDF …③\n①、②、③ より、1組の辺とその両端の角が、それぞれ\n等しいから　△ABE≡△CDF\nしたがって　BE＝DF'),
      MA('① BE、DF をふくむ三角形は、どれとどれかな。\n② ∠A と ∠C、∠B と ∠D の関係を使えないかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '▱ABCD で、AB＝4cm、BC＝7cm、∠B＝70° のとき、辺 CD、AD の長さと、∠D の大きさを求めよう。（3点）', 2),
      B(2, 'CD＝4cm、AD＝7cm、∠D＝70°'),
      T('（2）', '▱ABCD の対角線の交点を O とする。AC＝12cm のとき、OA の長さを求めよう。根拠も書こう。（2点）', 2),
      B(2, '6cm\n平行四辺形の対角線は、それぞれの中点で交わる。'),
      T('（3）', '平行四辺形の性質として、いつも成り立つとは限らないものを、ア〜エから選ぼう。（2点）\nア 対辺は等しい　　　　　　　イ 対角は等しい\nウ 対角線の長さは等しい　　　エ 対角線は、それぞれの中点で交わる', 4),
      B(1, 'ウ'),
      T('（4）', '▱ABCD で、∠A が ∠B より 40°大きいとき、∠A、∠B の大きさを求めよう。（3点）', 2),
      B(2, '∠A＋∠B＝180° だから　∠B＝(180°−40°)÷2＝70°\n∠A＝70°+40°＝110°'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '▱ABCD の周の長さは 40cm である。対角線の交点を O とすると、△OAB の周は、△OBC の周より 4cm 長い。AB、BC の長さを求めよう。', 3),
      B(4, 'OA＝OC だから、（△OAB の周）−（△OBC の周）＝AB−BC＝4\nAB+BC＝40÷2＝20\nよって　AB＝12cm、BC＝8cm')
    ]
  });
})();
