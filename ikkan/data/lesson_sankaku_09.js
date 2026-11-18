/* 図形と証明（三角形と四角形） 第9時：平行四辺形の性質を使って、線分が等しいことを証明しよう。
   元：授業ナビ標準版 sankaku-09（例）。「O を通る直線 PQ で、OP＝OQ」（例題1）を「今日の問い」（向きを変えても成り立ちそうか、予想する）と「例題」（証明）に、
   「性質③ のわけ（△AOB≡△COD）」を考えよう（演習プリント（7））にした。練習の「BE＝DF ならば AE＝CF」は、演習プリント表の（1）〜（3）に分けた。
   ・ワークシートは A4 1枚：問いは1つ（直線 PQ の向きを変えた 2つの図 ア・イ から、OP と OQ の関係を予想する）。個人3分 → ペア3分 → ことば → 例題（仮定・結論の空欄＋証明の板書）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（証明の部品：等しい辺・角と理由、合同条件、理由の選択、長さ）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
     表は 33行におさまるよう、証明まるごとは書かせず、部品（（1）（2）（3）で 図1 の証明を組み立てる）にした。証明を全部書く問題は、裏の（7）（8）と小テスト（穴埋め）。
   ・使った性質は、第8時までの範囲（定義・対辺・対角・対角線、錯角、対頂角、三角形の合同条件）。平行四辺形になる条件（第10時〜）は使わない。
   ・数値・図は新しく作り、座標から計算しなおして checks にした（図の点は、書いてある条件のとおりに、正確な位置にある）。
   検算：node tools/verify.cjs sankaku-09　／　見た目：node tools/check.cjs <出力先> sankaku-09 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  // 図に、見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);

  /* ---- 座標（図と checks で同じものを使う）：平行四辺形 ABCD ---- */
  const PA = { A: [1.2, 3], B: [0, 0], C: [5, 0], D: [6.2, 3] };          // AD＝BC＝5（AD∥BC）
  const O_ = [3.1, 1.5];                                                  // 対角線の交点
  const PQ_A = { P: [2.2, 3], Q: [4, 0] }, PQ_I = { P: [5, 3], Q: [1.2, 0] };   // O を通る直線が AD、BC と交わる点（ア・イ）
  const LAB4 = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };

  // 今日の問い・例題：O を通る直線 PQ（ア・イ）
  const figPQ = (q, oDir) => GEO({
    pts: Object.assign({}, PA, { O: O_ }, q), poly: 'ABCD', segs: ['AC', 'BD', 'PQ'], dots: ['O'], pad: 6,
    vl: Object.assign({}, LAB4, { P: ['P', 90], Q: ['Q', 270], O: ['O', oDir] })
  });
  const figA = figPQ(PQ_A, 73), figI = figPQ(PQ_I, 90);

  // 図1：対角線 BD 上に BE＝DF となる点 E、F
  const E1 = [PA.B[0] + (PA.D[0] - PA.B[0]) * 0.28, PA.B[1] + (PA.D[1] - PA.B[1]) * 0.28], F1 = [PA.D[0] - (PA.D[0] - PA.B[0]) * 0.28, PA.D[1] - (PA.D[1] - PA.B[1]) * 0.28];
  const fig1 = GEO({
    pts: Object.assign({}, PA, { E: E1, F: F1 }), poly: 'ABCD', segs: ['BD', 'AE', 'CF'], tick: [['B', 'E', 1], ['F', 'D', 1]], dots: ['E', 'F'], pad: 6,
    vl: Object.assign({}, LAB4, { E: ['E', 290], F: ['F', 110] })
  });

  // 図2：M は BC の中点。直線 AM を延ばして、DC の延長との交点を E とする（M は AE の中点）
  const P2 = { A: [1, 2.2], B: [0, 0], C: [4.4, 0], D: [5.4, 2.2] }, M2 = [2.2, 0], E2 = [3.4, -2.2];
  const fig2 = GEO({
    pts: Object.assign({}, P2, { M: M2, E: E2 }), poly: 'ABCD', segs: ['AE', 'CE'], tick: [['B', 'M', 1], ['M', 'C', 1]], dots: ['M'], pad: 6,
    vl: Object.assign({}, LAB4, { M: ['M', 60], E: ['E', 270] })
  });

  // 図3：AB＝7cm、AC＝10cm、BD＝8cm の ▱ABCD（本当の長さの比で描く）。BC＝√33
  const BC3 = Math.sqrt(33), Ax3 = (49 + 33 - 100) / (2 * BC3), Ay3 = Math.sqrt(49 - Ax3 * Ax3);
  const P3 = { A: [Ax3, Ay3], B: [0, 0], C: [BC3, 0], D: [Ax3 + BC3, Ay3] }, O3 = [(Ax3 + BC3) / 2, Ay3 / 2];
  const fig3 = GEO({
    pts: Object.assign({}, P3, { O: O3 }), poly: 'ABCD', segs: ['AC', 'BD'], dots: ['O'], pad: 6,
    vl: Object.assign({}, LAB4, { O: ['O', 8] })
  });

  // （8）：辺 BC 上に AB＝AE となる点 E（AB²＝1.44+9、E は B のほかの交点 x＝2.4）
  const E8 = [2.4, 0];
  const fig8 = GEO({
    pts: Object.assign({}, PA, { E: E8 }), poly: 'ABCD', segs: ['AE'], tick: [['A', 'B', 1], ['A', 'E', 1]], dots: ['E'], pad: 6,
    vl: Object.assign({}, LAB4, { E: ['E', 270] })
  });

  // 小テスト（3）：対角線 AC 上に AE＝CF となる点 E、F
  const EQ = [PA.A[0] + (PA.C[0] - PA.A[0]) * 0.25, PA.A[1] + (PA.C[1] - PA.A[1]) * 0.25], FQ = [PA.C[0] - (PA.C[0] - PA.A[0]) * 0.25, PA.C[1] - (PA.C[1] - PA.A[1]) * 0.25];
  const figQ = GEO({
    pts: Object.assign({}, PA, { E: EQ, F: FQ }), poly: 'ABCD', segs: ['AC', 'BE', 'DF'], tick: [['A', 'E', 1], ['F', 'C', 1]], dots: ['E', 'F'], pad: 6,
    vl: Object.assign({}, LAB4, { E: ['E', 70], F: ['F', 250] })
  });

  /* ---- 検算の道具（checks の式の先頭にそえる）：v＝ベクトル、len＝長さ、ang＝角（度）、on＝線分上の点 ---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1], cr=(a,b)=>a[0]*b[1]-a[1]*b[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), mid=(P,Q)=>[(P[0]+Q[0])/2,(P[1]+Q[1])/2], at=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], ang=(V,P,Q)=>Math.acos(dot(v(V,P),v(V,Q))/len(V,P)/len(V,Q))*180/Math.PI, onSeg=(P,Q,R)=>Math.abs(cr(v(P,Q),v(P,R)))<1e-9&&dot(v(P,R),v(Q,R))<=1e-9, par=(P,Q,R,S)=>Math.abs(cr(v(P,Q),v(R,S)))<1e-9;';
  const chk = (note, body) => `(() => { ${LIB} ${body} })()`;
  const PAJ = `const A=${J(PA.A)},B=${J(PA.B)},C=${J(PA.C)},D=${J(PA.D)};`;

  IK.lesson('sankaku-09', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第9時', title: '平行四辺形の性質を使って、線分が等しいことを証明しよう',
    summary: '対角線の交点 O を通る直線 PQ で OP＝OQ になるわけを考え、平行四辺形の性質（対辺・対角・対角線）を根拠にして、三角形の合同を使った証明を書く。',
    head: '図形と証明　第9時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・例題（ア）：A(1.2,3)・B(0,0)・C(5,0)・D(6.2,3) は平行四辺形（AB と DC、AD と BC が平行で等しい）。O＝AC の中点＝BD の中点。P は AD 上、Q は BC 上で、P・O・Q は一直線。OP＝OQ、△AOP と △COQ は AO＝CO・∠AOP＝∠COQ・∠OAP＝∠OCQ
      chk('', `${PAJ} const O=${J(O_)},P=${J(PQ_A.P)},Q=${J(PQ_A.Q)}; return par(A,B,D,C) && par(A,D,B,C) && near(len(A,B),len(D,C)) && near(len(A,D),len(B,C)) && near(len(O,A),len(O,C)) && near(len(O,B),len(O,D)) && near(O[0],(A[0]+C[0])/2) && near(O[1],(B[1]+D[1])/2) && onSeg(A,D,P) && onSeg(B,C,Q) && par(P,O,O,Q) && onSeg(P,Q,O) && near(len(O,P),len(O,Q)) && near(len(O,A),len(O,C)) && near(ang(O,A,P),ang(O,C,Q)) && near(ang(A,O,P),ang(C,O,Q)) && near(len(A,P),len(C,Q));`),
      // イ：P＝(5,3)、Q＝(1.2,0)。向きを変えても OP＝OQ
      chk('', `${PAJ} const O=${J(O_)},P=${J(PQ_I.P)},Q=${J(PQ_I.Q)}; return onSeg(A,D,P) && onSeg(B,C,Q) && onSeg(P,Q,O) && near(len(O,P),len(O,Q)) && near(ang(A,O,P),ang(C,O,Q)) && near(len(A,P),len(C,Q));`),
      // 図1・（1）〜（3）：対角線 BD 上に BE＝DF（BD の 0.28 の位置）。AB＝CD、∠ABE＝∠CDF、2組の辺とその間の角が等しい → AE＝CF（長さでも確かめる）
      chk('', `${PAJ} const E=${J(E1)},F=${J(F1)}; return onSeg(B,D,E) && onSeg(B,D,F) && near(len(B,E),len(D,F)) && near(len(A,B),len(C,D)) && near(ang(B,A,E),ang(D,C,F)) && near(len(A,E),len(C,F));`),
      // 図2・（4）（6）：M＝BC の中点、E は直線 AM と直線 DC の交点。M は AE の中点（A と E が M について対称）。BM＝CM、∠AMB＝∠EMC、∠ABM＝∠ECM、AB＝EC。E は DC の延長上（C の外側）で、DE＝DC+CE＝2AB
      chk('', `const A=${J(P2.A)},B=${J(P2.B)},C=${J(P2.C)},D=${J(P2.D)},Mm=${J(M2)},E=${J(E2)}; return near(len(B,Mm),len(Mm,C)) && near(Mm[0],(A[0]+E[0])/2) && near(Mm[1],(A[1]+E[1])/2) && par(D,C,C,E) && dot(v(D,C),v(C,E))>0 && near(ang(Mm,A,B),ang(Mm,E,C)) && near(ang(B,A,Mm),ang(C,E,Mm)) && near(len(A,B),len(E,C)) && near(len(D,E),len(D,C)+len(C,E)) && near(len(D,E),2*len(A,B)) && par(A,B,D,E);`),
      // （6）AB＝4cm のとき DC＝4、EC＝AB＝4、DE＝4+4＝8
      'near(4 + 4, 8) && near(2 * 4, 8)',
      // 図3・（5）：AB＝7、AC＝10、BD＝8 の平行四辺形（BC＝√33）。座標から OA＝5、OB＝4、△OAB の周＝7+5+4＝16
      chk('', `const A=${J(P3.A)},B=${J(P3.B)},C=${J(P3.C)},D=${J(P3.D)},O=${J(O3)}; return near(len(A,B),7) && near(len(A,C),10) && near(len(B,D),8) && par(A,B,D,C) && par(A,D,B,C) && near(len(O,A),5) && near(len(O,B),4) && near(len(A,B)+len(O,A)+len(O,B),16);`),
      // （8）：E＝(2.4,0) は BC 上で AB＝AE。△ABC と △EAD で AB＝EA・BC＝AD・∠ABC＝∠EAD（∠ABE＝∠AEB、AD∥BC の錯角 ∠AEB＝∠EAD）→ 合同（対応する辺 AC＝ED）
      chk('', `${PAJ} const E=${J(E8)}; return onSeg(B,C,E) && near(len(A,B),len(A,E)) && near(len(B,C),len(A,D)) && near(ang(B,A,C),ang(A,E,D)) && near(ang(B,A,E),ang(E,A,B)) && near(ang(E,A,B),ang(A,E,D)) && near(ang(B,A,C),ang(A,E,D)) && near(len(A,C),len(E,D)) && near(len(B,C),len(A,D));`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：対角線の交点 O で、AO＝CO、BO＝DO、△AOB と △COD は 2組の辺とその間の角が等しい
      chk('', `${PAJ} const O=mid(A,C); return near(O[0],mid(B,D)[0]) && near(O[1],mid(B,D)[1]) && near(len(A,B),len(C,D)) && near(ang(A,B,O),ang(C,D,O)) && near(ang(B,A,O),ang(D,C,O));`),
      // 小テスト（2）：AB＝6、AC＝14、BD＝10 の平行四辺形（BC＝√112）。OC＝7、OD＝5、CD＝AB＝6、△OCD の周＝18
      `(() => { const AB=6, AC=14, BD=10, BC=Math.sqrt((AC*AC+BD*BD)/2-AB*AB), x=(AB*AB+BC*BC-AC*AC)/(2*BC), y=Math.sqrt(AB*AB-x*x), A=[x,y], B=[0,0], C=[BC,0], D=[x+BC,y], O=[(A[0]+C[0])/2,(A[1]+C[1])/2], L=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]); return near(L(A,B),6) && near(L(A,C),14) && near(L(B,D),10) && near(L(O,C),7) && near(L(O,D),5) && near(L(C,D),6) && near(L(O,C)+L(O,D)+L(C,D),18); })()`,
      // 小テスト（3）：対角線 AC 上に AE＝CF（AC の 0.25 の位置）。AB＝CD、∠BAE＝∠DCF、BE＝DF
      chk('', `${PAJ} const E=${J(EQ)},F=${J(FQ)}; return onSeg(A,C,E) && onSeg(A,C,F) && near(len(A,E),len(C,F)) && near(len(A,B),len(C,D)) && near(ang(A,B,E),ang(C,D,F)) && near(len(B,E),len(D,F));`),
      // 小テスト（4）チャレンジ：AP＝3、BQ＝5 → CQ＝AP＝3（O について対称）、AD＝BC＝BQ+CQ＝8。座標：B(0,0)・C(8,0)・A(1,3)・D(9,3)、P(4,3)、Q(5,0)
      `(() => { const A=[1,3], B=[0,0], C=[8,0], D=[9,3], O=[(A[0]+C[0])/2,(A[1]+C[1])/2], P=[4,3], Q=[5,0], L=(X,Y)=>Math.hypot(X[0]-Y[0],X[1]-Y[1]); return near(L(A,P),3) && near(L(B,Q),5) && near((P[0]+Q[0])/2,O[0]) && near((P[1]+Q[1])/2,O[1]) && near(L(C,Q),3) && near(L(A,D),8) && near(L(B,Q)+L(A,P),8); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('平行四辺形の性質を使って、線分が等しいことを証明しよう'),
      K('今日の問い', '▱ABCD の対角線の交点 O を通る直線が、辺 AD、BC と交わる点を P、Q とする。向きを変えても、OP と OQ には、どんな関係がありそうだろう。', 2),
      F(5, cap(figA, 'ア'), cap(figI, 'イ')),
      T('①', '自分の考え（3分）　OP と OQ について、気づいたことと、そのわけを書こう。', 1),
      B(3, '（例）ア・イのどちらも OP＝OQ になりそう（O が PQ の中点）。\nわけ … △AOP と △COQ が合同になりそうだから。\n　AO＝CO（対角線）、対頂角、AD∥BC の錯角'),
      T('②', 'ペアの考え（3分）　自分とちがう見方や、ほかの三角形を書こう。', 1),
      B(2, ''),
      G(1),
      WD('定義 … 2組の対辺が、それぞれ{{平行}}な四角形\n性質① 2組の{{対辺}}は、それぞれ等しい。\n性質② 2組の{{対角}}は、それぞれ等しい。\n性質③ {{対角線}}は、それぞれの中点で交わる。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'アの図で、OP＝OQ を証明しよう。仮定 … ▱ABCD で、直線 PQ は{{対角線の交点 O}}を通る　結論 … {{OP＝OQ}}', 2),
      T('', '【書き方のくふう】結論から考えて、合同を示す三角形を決めよう。', 1),
      B(9, '（仮定）▱ABCD、直線 PQ は 対角線の交点 O を通る\n（結論）OP＝OQ\n（証明）△AOP と △COQ において\n平行四辺形の対角線は、それぞれの中点で交わるから　AO＝CO …①\n対頂角は等しいから　∠AOP＝∠COQ …②\nAD∥BC より、錯角は等しいから　∠OAP＝∠OCQ …③\n①、②、③より、1組の辺とその両端の角が、それぞれ等しいから\n△AOP≡△COQ\n合同な図形の、対応する辺は等しいから　OP＝OQ')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2組の対辺が、それぞれ{{平行}}な四角形を、平行四辺形という。\n② 平行四辺形の2組の{{対辺}}は、それぞれ等しい。\n③ 平行四辺形の2組の{{対角}}は、それぞれ等しい。\n④ 平行四辺形の{{対角線}}は、それぞれの中点で交わる。', 4, { label: 'ことば' }),
      F(5, cap(fig1, '図1'), cap(fig2, '図2'), cap(fig3, '図3')),
      C2([
        T('（1）', '図1で、BE＝DF のとき、△ABE と △CDF の等しい辺を、BE と DF のほかに1組答えよう。理由も書こう。', 3),
        B(2, 'AB＝CD\n平行四辺形の対辺は等しい。')
      ], [
        T('（2）', '図1で、∠ABE と等しい角を、△CDF の中から答えよう。理由も書こう。', 3),
        B(2, '∠CDF\nAB∥DC の錯角は等しい。')
      ], '1:1'),
      MA('【説明】平行四辺形の3つの性質を、図をかいて、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '性質を使って、証明の部品を見つけよう。'),
      T('（3）', '図1で、△ABE≡△CDF である。使う合同条件と、AE＝CF となる理由を答えよう。', 1),
      B(2, '2組の辺とその間の角\n合同な図形の、対応する辺は等しいから　AE＝CF'),
      T('（4）', '図2で、△ABM≡△ECM を示す。次の理由を、ア〜ウから選ぼう。\n① BM＝CM　　② ∠AMB＝∠EMC　　③ ∠ABM＝∠ECM\nア 仮定　　イ 対頂角　　ウ 錯角', 3),
      B(1, '① ア　　② イ　　③ ウ'),
      C2([
        T('（5）', '図3の ▱ABCD で、AB＝7cm、AC＝10cm、BD＝8cm。△OAB の周の長さを求めよう。', 3),
        B(2, 'OA＝5cm、OB＝4cm\n7+5+4＝16（cm）')
      ], [
        T('（6）', '図2で、AB＝4cm のとき、DE の長さを求めよう。（AB＝EC となる。）', 3),
        B(2, 'DC＝4cm、CE＝4cm\nDE＝4+4＝8（cm）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：性質③ が、いつも成り立つわけを考えよう。'),
      T('（7）', '▱ABCD の対角線 AC、BD の交点を O とする。AO＝CO、BO＝DO であることを、三角形の合同を使って証明しよう。', 3),
      C2([
        T('', '図と、目をつける三角形', 1),
        B(3, '')
      ], [
        T('', '等しいものと、その理由', 1),
        B(3, '')
      ], '1:1'),
      T('', '証明（仮定・結論・証明の順に書こう）', 1),
      B(7, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '▱ABCD の辺 BC 上に、AB＝AE となる点 E をとる。このとき、△ABC≡△EAD であることを証明しよう。', 4)
      ], [
        F(4, fig8)
      ], '3:2'),
      B(9, '（仮定）▱ABCD、AB＝AE　（結論）△ABC≡△EAD\n（証明）△ABC と △EAD において\n仮定より　AB＝EA …①\n平行四辺形の対辺は等しいから　BC＝AD …②\n△ABE は AB＝AE の二等辺三角形だから　∠ABC＝∠AEB\nAD∥BC より、錯角は等しいから　∠AEB＝∠EAD\nしたがって　∠ABC＝∠EAD …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△ABC≡△EAD'),
      MA('① 仮定 AB＝AE から、△ABE は、どんな三角形といえるかな。\n② △ABC と △EAD で、等しい角は、どの角と、どの角かな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '平行四辺形の性質として、正しくないものを、1つ選ぼう。（3点）\nア 2組の対辺は、それぞれ等しい　　イ 4つの辺は、すべて等しい\nウ 2組の対角は、それぞれ等しい　　エ 対角線は、それぞれの中点で交わる', 3),
      B(1, 'イ'),
      T('（2）', '▱ABCD で、AB＝6cm、AC＝14cm、BD＝10cm である。対角線の交点を O とするとき、△OCD の周の長さを求めよう。（3点）', 2),
      B(2, 'OC＝7cm、OD＝5cm、CD＝AB＝6cm\n6+7+5＝18（cm）'),
      F(4, figQ),
      T('（3）', '▱ABCD の対角線 AC 上に、AE＝CF となる点 E、F をとる。BE＝DF の証明の □ をうめよう。（4点）\n△ABE と △CDF において\n仮定より　AE＝{{CF}} …①\n平行四辺形の{{対辺}}は等しいから　AB＝{{CD}} …②\nAB∥DC より、{{錯角}}は等しいから　∠BAE＝∠DCF …③\n①、②、③より、{{2組の辺とその間の角}}が、\nそれぞれ等しいから　△ABE≡△CDF\nしたがって　BE＝DF', 9),
      B(1, '順に　CF　／　対辺、CD　／　錯角　／　2組の辺とその間の角'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '▱ABCD の対角線の交点 O を通る直線が、辺 AD、BC と交わる点を P、Q とする。AP＝3cm、BQ＝5cm のとき、辺 AD の長さを求めよう。', 3),
      B(4, 'AP＝CQ（△AOP≡△COQ）だから　CQ＝3cm\nBC＝BQ+CQ＝5+3＝8（cm）\nAD＝BC だから　AD＝8cm')
    ]
  });
})();
