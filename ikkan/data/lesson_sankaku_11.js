/* 図形と証明（三角形と四角形） 第11時：平行四辺形になる条件を使って、証明しよう。
   元：授業ナビ標準版 sankaku-11（例）。例題「AD、BC の中点 M、N で、四角形 MBND は平行四辺形」を「今日の問い」（どんな四角形といえそうか、予想する）と「例題」（証明）に、
   「条件 ⑤（1組の対辺が平行で等しい）を使う証明を考えて、④ を使う証明とくらべる」を考えよう（演習プリント（7））に、入試レベルの「垂線 AE、CF で四角形 AECF は平行四辺形」を チャレンジ（8）にした。
   ・ワークシートは A4 1枚：問いは1つ。個人3分 → ペア3分 → ことば（中点・条件）→ 例題（仮定・結論の空欄＋証明の板書）。「今日の問い」の枠と図は、左右にならべて、行をへらした。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（証明の部品：等しいわけ・使う条件・面積・平行四辺形にならない例）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
   ・使う条件は、第10時までの「平行四辺形になる条件」。直角三角形の合同条件（第5・6時）も、チャレンジ（8）で使う。中点連結定理（中3）は使わない。
   ・数値・図は新しく作り、座標から計算しなおして checks にした（図の点は、条件のとおりに、正確な位置にある）。
   検算：node tools/verify.cjs sankaku-11　／　見た目：node tools/check.cjs <出力先> sankaku-11 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);

  /* ---- 座標（図と checks で同じものを使う）：平行四辺形 ABCD ---- */
  const PA = { A: [1.2, 3], B: [0, 0], C: [5, 0], D: [6.2, 3] };
  const L4 = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };
  const mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], at = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const O_ = mid(PA.A, PA.C);

  // 今日の問い・例題：M、N は AD、BC の中点
  const Mm = mid(PA.A, PA.D), Nn = mid(PA.B, PA.C);
  const fig0 = GEO({
    pts: Object.assign({}, PA, { M: Mm, N: Nn }), poly: 'ABCD', segs: ['MB', 'ND'], tick: [['A', 'M', 1], ['M', 'D', 1], ['B', 'N', 2], ['N', 'C', 2]], dots: ['M', 'N'], pad: 6,
    vl: Object.assign({}, L4, { M: ['M', 90], N: ['N', 270] })
  });

  // 図1：対角線 AC 上に AE＝CF となる点 E、F（AC の 0.25 の位置）。O は対角線の交点
  const E1 = at(PA.A, PA.C, 0.25), F1 = at(PA.A, PA.C, 0.75);
  const fig1 = GEO({
    pts: Object.assign({}, PA, { E: E1, F: F1, O: O_ }), poly: 'ABCD', segs: ['AC', 'BD', 'EB', 'BF', 'FD', 'DE'], tick: [['A', 'E', 1], ['F', 'C', 1]], dots: ['E', 'F', 'O'], pad: 6,
    vl: Object.assign({}, L4, { E: ['E', 120], F: ['F', 300], O: ['O', 264] })
  });
  // 図2：E、F は辺 AB、DC の中点
  const E2 = mid(PA.A, PA.B), F2 = mid(PA.D, PA.C);
  const fig2 = GEO({
    pts: Object.assign({}, PA, { E: E2, F: F2 }), poly: 'ABCD', segs: ['EC', 'AF'], tick: [['A', 'E', 1], ['E', 'B', 1], ['D', 'F', 2], ['F', 'C', 2]], dots: ['E', 'F'], pad: 6,
    vl: Object.assign({}, L4, { E: ['E', 180], F: ['F', 0] })
  });
  // 図3：辺 AD、BC 上に AE＝CF となる点 E、F（AE＝CF＝1.5）
  const E3 = [PA.A[0] + 1.5, PA.A[1]], F3 = [PA.C[0] - 1.5, PA.C[1]];
  const fig3 = GEO({
    pts: Object.assign({}, PA, { E: E3, F: F3 }), poly: 'ABCD', segs: ['EB', 'FD'], tick: [['A', 'E', 1], ['F', 'C', 1]], dots: ['E', 'F'], pad: 6,
    vl: Object.assign({}, L4, { E: ['E', 90], F: ['F', 270] })
  });
  // （8）：頂点 A、C から対角線 BD にひいた垂線の足 E、F
  const foot = (P, Q, R) => { const dx = R[0] - Q[0], dy = R[1] - Q[1], t = ((P[0] - Q[0]) * dx + (P[1] - Q[1]) * dy) / (dx * dx + dy * dy); return [Q[0] + dx * t, Q[1] + dy * t]; };
  const E8 = foot(PA.A, PA.B, PA.D), F8 = foot(PA.C, PA.B, PA.D);
  const fig8 = GEO({
    pts: Object.assign({}, PA, { E: E8, F: F8 }), poly: 'ABCD', segs: ['BD', 'AE', 'CF', 'EC', 'AF'], dots: ['E', 'F'], pad: 6,
    vl: Object.assign({}, L4, { E: ['E', 290], F: ['F', 110] }),
    ang: [{ at: 'E', a: 'A', b: 'B', right: true, r: 3.6 }, { at: 'F', a: 'C', b: 'D', right: true, r: 3.6 }]
  });
  // 小テスト（3）：対角線 BD 上に BE＝DF（BD の 0.25 の位置）。AC は点線、O は交点
  const EQ = at(PA.B, PA.D, 0.25), FQ = at(PA.B, PA.D, 0.75);
  const figQ = GEO({
    pts: Object.assign({}, PA, { E: EQ, F: FQ, O: O_ }), poly: 'ABCD', segs: ['BD', ['A', 'C', { dash: 1 }], 'AE', 'EC', 'CF', 'FA'], tick: [['B', 'E', 1], ['F', 'D', 1]], dots: ['E', 'F', 'O'], pad: 6,
    vl: Object.assign({}, L4, { E: ['E', 250], F: ['F', 70], O: ['O', 300] })
  });

  /* ---- 検算の道具（checks の式の先頭にそえる） ---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1], cr=(a,b)=>a[0]*b[1]-a[1]*b[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), mid=(P,Q)=>[(P[0]+Q[0])/2,(P[1]+Q[1])/2], at=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], ang=(V,P,Q)=>Math.acos(dot(v(V,P),v(V,Q))/len(V,P)/len(V,Q))*180/Math.PI, par=(P,Q,R,S)=>Math.abs(cr(v(P,Q),v(R,S)))<1e-9, same=(P,Q)=>near(P[0],Q[0])&&near(P[1],Q[1]), isPara=(A,B,C,D)=>par(A,B,D,C)&&par(A,D,B,C)&&near(len(A,B),len(D,C))&&near(len(A,D),len(B,C)), area=P=>Math.abs(P.reduce((s,p,i)=>s+p[0]*P[(i+1)%P.length][1]-P[(i+1)%P.length][0]*p[1],0))/2, foot=(P,Q,R)=>{const d=v(Q,R),t=dot(v(Q,P),d)/dot(d,d);return [Q[0]+d[0]*t,Q[1]+d[1]*t];};';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  IK.lesson('sankaku-11', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第11時', title: '平行四辺形になる条件を使って、証明しよう',
    summary: '辺 AD、BC の中点 M、N を結んでできる四角形 MBND がどんな四角形かを予想し、「1組の対辺が平行で等しい」を使って、平行四辺形であることを証明する。',
    head: '図形と証明　第11時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・例題：▱ABCD、M・N は AD・BC の中点。MD∥BN、MD＝BN＝AD/2、MB∥ND、四角形 MBND は平行四辺形
      chk(`const ${pj(PA)}, Mm=${J(Mm)}, Nn=${J(Nn)}; return isPara(A,B,C,D) && same(Mm,mid(A,D)) && same(Nn,mid(B,C)) && par(Mm,D,B,Nn) && near(len(Mm,D),len(B,Nn)) && near(len(Mm,D),len(A,D)/2) && near(len(B,Nn),len(B,C)/2) && isPara(Mm,B,Nn,D);`),
      // 図1・（1）（2）：AE＝CF（AC の 0.25・0.75 の位置）。O は AC・BD の中点。EO＝FO、BO＝DO（対角線 EF、BD が中点で交わる）→ 四角形 EBFD は平行四辺形
      chk(`const ${pj(PA)}, E=${J(E1)}, F=${J(F1)}, O=${J(O_)}; return same(mid(A,C),O) && same(mid(B,D),O) && near(len(A,E),len(C,F)) && near(len(O,E),len(O,F)) && near(len(O,E),len(O,A)-len(A,E)) && near(len(O,F),len(O,C)-len(C,F)) && same(mid(E,F),O) && isPara(E,B,F,D);`),
      // （6）AC＝10 の平行四辺形（A(0,0)・B(4,3)・C(10,0)・D(6,−3)）で、AE＝2、CF＝3 → EO＝3、FO＝2 でちがう。四角形 EBFD は平行四辺形にならない
      chk(`const A=[0,0],B=[4,3],C=[10,0],D=[6,-3],O=[5,0],E=[2,0],F=[7,0]; return isPara(A,B,C,D) && near(len(A,C),10) && near(len(A,E),2) && near(len(C,F),3) && near(len(O,E),3) && near(len(O,F),2) && !same(mid(E,F),mid(B,D)) && !isPara(E,B,F,D);`),
      // 図2・（3）（5）：E、F は AB、DC の中点。AE∥FC、AE＝FC（AB の半分）→ 四角形 AECF は平行四辺形。面積は ▱ABCD の半分（面積 36 → 18）
      chk(`const ${pj(PA)}, E=${J(E2)}, F=${J(F2)}; return isPara(A,B,C,D) && par(A,E,F,C) && near(len(A,E),len(F,C)) && near(len(A,E),len(A,B)/2) && isPara(A,E,C,F) && near(area([A,E,C,F])*2,area([A,B,C,D])) && near(36/2,18);`),
      // 図3・（4）：AE＝CF（＝1.5）。ED＝AD−AE、BF＝BC−CF で等しい（3.5）。ED∥BF → 四角形 EBFD は平行四辺形
      chk(`const ${pj(PA)}, E=${J(E3)}, F=${J(F3)}; return near(len(A,E),len(C,F)) && near(len(E,D),len(A,D)-len(A,E)) && near(len(B,F),len(B,C)-len(C,F)) && near(len(E,D),len(B,F)) && par(E,D,B,F) && isPara(E,B,F,D);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：図1 で △ABE と △CDF は、AB＝CD・∠BAE＝∠DCF・AE＝CF（2組の辺とその間の角）→ BE＝DF、∠AEB＝∠CFD → BE∥DF（錯角ではなく、EB と DF の向きで確かめる）
      chk(`const ${pj(PA)}, E=${J(E1)}, F=${J(F1)}; return near(len(A,B),len(C,D)) && near(ang(A,B,E),ang(C,D,F)) && near(len(A,E),len(C,F)) && near(len(B,E),len(D,F)) && near(ang(E,A,B),ang(F,C,D)) && par(B,E,F,D);`),
      // （8）：E、F は A、C から BD への垂線の足。AE⊥BD、CF⊥BD（AE∥CF）。△ABE と △CDF は ∠AEB＝∠CFD＝90°、AB＝CD、∠ABE＝∠CDF → AE＝CF。四角形 AECF は平行四辺形。E、F は BD 上（0〜1の内側）
      chk(`const ${pj(PA)}, E=${J(E8)}, F=${J(F8)}; const tE=dot(v(B,E),v(B,D))/dot(v(B,D),v(B,D)), tF=dot(v(B,F),v(B,D))/dot(v(B,D),v(B,D)); return same(E,foot(A,B,D)) && same(F,foot(C,B,D)) && near(dot(v(A,E),v(B,D)),0) && near(dot(v(C,F),v(B,D)),0) && par(A,E,C,F) && near(ang(E,A,B),90) && near(ang(F,C,D),90) && near(len(A,B),len(C,D)) && near(ang(B,A,E),ang(D,C,F)) && near(len(A,E),len(C,F)) && tE>0 && tE<1 && tF>0 && tF<1 && tE<tF && isPara(A,E,C,F);`),
      // 小テスト（2）：面積 40 → 四角形 MBND は ▱ABCD の半分で 20（座標から、面積の比が 1/2）
      chk(`const ${pj(PA)}, Mm=${J(Mm)}, Nn=${J(Nn)}; return near(area([Mm,B,Nn,D])/area([A,B,C,D]),0.5) && near(40/2,20);`),
      // 小テスト（3）：対角線 BD 上に BE＝DF。OA＝OC、OB＝OD、OE＝OF（OB−BE＝OD−DF）→ 四角形 AECF は平行四辺形
      chk(`const ${pj(PA)}, E=${J(EQ)}, F=${J(FQ)}, O=${J(O_)}; return same(mid(B,D),O) && same(mid(A,C),O) && near(len(B,E),len(D,F)) && near(len(O,E),len(O,B)-len(B,E)) && near(len(O,F),len(O,D)-len(D,F)) && near(len(O,E),len(O,F)) && isPara(A,E,C,F);`),
      // 小テスト（4）チャレンジ：A(1,2)・B(5,1)・C(7,5)。四角形 ABCD が平行四辺形のとき、DC＝AB（同じ向き）だから D＝C−(B−A)＝(3,6)。対角線 AC・BD の中点でも同じ
      chk(`const A=[1,2],B=[5,1],C=[7,5],D=[C[0]-(B[0]-A[0]),C[1]-(B[1]-A[1])], D2=[A[0]+C[0]-B[0],A[1]+C[1]-B[1]]; return same(D,[3,6]) && same(D2,D) && isPara(A,B,C,D) && same(mid(A,C),mid(B,D));`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('平行四辺形になる条件を使って、証明しよう'),
      C2([
        K('今日の問い', '▱ABCD の辺 AD、BC の中点を、それぞれ M、N とし、M と B、N と D を結ぶ。四角形 MBND は、どんな四角形といえるだろう。わけも考えよう。', 5)
      ], [
        F(5, fig0)
      ], '3:2'),
      T('①', '自分の考え（3分）　四角形 MBND について、予想とわけを書こう。', 1),
      B(3, '（例）平行四辺形になりそう。\nわけ … MD と BN は、どちらも辺 AD、BC の半分で、平行で長さも等しく見える。\n　MB と ND も、平行に見える。'),
      T('②', 'ペアの考え（3分）　自分とちがう見方や、わけを書こう。', 1),
      B(3, ''),
      G(1),
      WD('中点 … 線分を{{2等分}}する点\n1組の対辺が{{平行}}で等しい四角形は、平行四辺形\n対角線が、それぞれの{{中点}}で交わる四角形は、\n　平行四辺形', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '四角形 MBND が平行四辺形であることを証明しよう。仮定 … ▱ABCD で、M、N は AD、BC の{{中点}}　結論 … 四角形 {{MBND}} は平行四辺形', 2),
      T('', '【書き方のくふう】どの条件を使うかは、図の中でわかっていることから選ぶ。', 1),
      B(9, '（仮定）▱ABCD、M は AD の中点、N は BC の中点\n（結論）四角形 MBND は平行四辺形\n（証明）AD∥BC だから　MD∥BN …①\n平行四辺形の対辺は等しいから　AD＝BC\nM、N は中点だから　MD＝[[1/2]]AD、BN＝[[1/2]]BC\nしたがって　MD＝BN …②\n①、②より、1組の対辺が平行で等しいから、\n四角形 MBND は平行四辺形である。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 線分を2等分する点を、その線分の{{中点}}という。\n② 1組の対辺が{{平行}}で等しい四角形は、平行四辺形である。\n③ 対角線が、それぞれの{{中点}}で交わる四角形は、平行四辺形である。\n④ 2組の{{対辺}}が、それぞれ等しい四角形は、平行四辺形である。', 4, { label: 'ことば' }),
      F(5, cap(fig1, '図1'), cap(fig2, '図2'), cap(fig3, '図3')),
      C2([
        T('（1）', '図1の ▱ABCD で、O は対角線の交点、AE＝CF である。EO＝FO となるわけを答えよう。', 3),
        B(2, 'AO＝CO で、AE＝CF だから\nEO＝AO−AE＝CO−CF＝FO')
      ], [
        T('（2）', '図1の四角形 EBFD が平行四辺形であることを示すとき、使う条件を答えよう。', 3),
        B(2, '対角線が、それぞれの\n中点で交わる')
      ], '1:1'),
      MA('【説明】どんなとき、どの条件を使うか。例をあげて、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '条件を使うために、わかることを見つけよう。'),
      C2([
        T('（3）', '図2で、E、F は辺 AB、DC の中点である。AE∥FC となるわけを答えよう。', 3),
        B(2, 'AB∥DC だから\nAE∥FC')
      ], [
        T('（4）', '図3で、AD＝BC、AE＝CF である。ED＝BF となるわけを答えよう。', 3),
        B(2, 'ED＝AD−AE、BF＝BC−CF\nAD＝BC、AE＝CF だから')
      ], '1:1'),
      C2([
        T('（5）', '図2で、▱ABCD の面積が 36cm^2 のとき、平行四辺形 AECF の面積を求めよう。', 4),
        B(2, '底辺 AE は AB の半分、\n高さは同じ　36÷2＝18（cm^2）')
      ], [
        T('（6）', '▱ABCD の対角線 AC 上に、AE＝2cm、CF＝3cm となる点 E、F をとる。AC＝10cm のとき、四角形 EBFD は平行四辺形になるか。', 4),
        B(2, 'ならない\nEO＝3cm、FO＝2cm で等しくない')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：ちがう条件で、同じことを証明してみよう。'),
      C2([
        T('（7）', '図1の四角形 EBFD が平行四辺形であることを、対角線ではなく「1組の対辺が平行で等しい」を使って証明するとしたら、どの三角形の合同を示せばよいだろう。', 5)
      ], [
        F(5, cap(fig1, '図1'))
      ], '3:2'),
      C2([
        T('', '示す三角形と、合同条件', 1),
        B(4, '')
      ], [
        T('', '対角線を使う証明と、くらべて気づいたこと', 2),
        B(3, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '▱ABCD の頂点 A、C から、対角線 BD に垂線 AE、CF をひく。四角形 AECF は平行四辺形であることを証明しよう。', 5)
      ], [
        F(5, fig8)
      ], '3:2'),
      B(11, '（仮定）▱ABCD、AE⊥BD、CF⊥BD　（結論）四角形 AECF は平行四辺形\n（証明）AE⊥BD、CF⊥BD だから　AE∥CF …①\n△ABE と △CDF において\n仮定より　∠AEB＝∠CFD＝90° …②\n平行四辺形の対辺は等しいから　AB＝CD …③\nAB∥DC より、錯角は等しいから　∠ABE＝∠CDF …④\n②、③、④より、直角三角形の斜辺と1つの鋭角が、\nそれぞれ等しいから　△ABE≡△CDF\nしたがって　AE＝CF …⑤\n①、⑤より、1組の対辺が平行で等しいから、\n四角形 AECF は平行四辺形である。'),
      MA('① AE と CF は、どちらも BD に垂直。AE と CF は、どんな関係かな。\n② △ABE と合同になりそうな三角形は、どれかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '四角形 EBFD が平行四辺形であることを示す。使う条件を、ア〜ウから選ぼう。（3点）\n① AD∥BC で、ED＝BF のとき\n② OB＝OD、OE＝OF のとき（O は対角線の交点）\nア 1組の対辺が平行で等しい　　イ 対角線が中点で交わる　　ウ 2組の対辺が等しい', 5),
      B(1, '① ア　　② イ'),
      T('（2）', '▱ABCD の辺 AD、BC の中点を M、N とする。▱ABCD の面積が 40cm^2 のとき、平行四辺形 MBND の面積を求めよう。（3点）', 2),
      B(1, '20cm^2（MD が AD の半分で、高さは同じ）'),
      F(4, figQ),
      T('（3）', '▱ABCD の対角線 BD 上に、BE＝DF となる点 E、F をとる。四角形 AECF が平行四辺形であることの証明の □ をうめよう。（4点）\n対角線 AC をひき、BD との交点を O とする。\n平行四辺形の対角線は、それぞれの{{中点}}で交わるから　OA＝{{OC}} …①　OB＝OD …②\n仮定より　BE＝DF …③　②、③より　OE＝{{OF}} …④\n①、④より、{{対角線}}が、それぞれの中点で交わるから、四角形 AECF は平行四辺形である。', 9),
      B(1, '順に　中点　／　OC　／　OF　／　対角線'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '座標平面上に、A(1, 2)、B(5, 1)、C(7, 5) がある。四角形 ABCD が平行四辺形になるように、点 D をとる。D の座標を求めよう。', 3),
      B(3, 'DC が AB と平行で等しいから、B から A へ（左に4、上に1）の\n動きを、C にもしたものが D\nD(7−4, 5+1)＝D(3, 6)')
    ]
  });
})();
