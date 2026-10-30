/* 図形と証明（三角形と四角形） 第12時：長方形・ひし形・正方形は、平行四辺形とどんな関係だろう。
   元：授業ナビ標準版 sankaku-12（探）。課題「長方形、ひし形は、平行四辺形といえるだろうか」を「今日の問い」（印だけをかいた ア〜ウ の図から考える）に、
   例題1「長方形の対角線は等しい」の証明を「例題」に、「平行四辺形に条件を 1つ加えると、長方形（ひし形）になるのは、どんな条件か」を考えよう（演習プリント（7））に、
   入試に挑戦「正方形で BE＝CF のとき AE⊥BF」を チャレンジ（8）にした。
   ・ワークシートは A4 1枚：問いは1つ（ア 長方形・イ ひし形・ウ 正方形 は、平行四辺形といえるか）。個人3分 → ペア3分 → ことば（定義）→ 例題（空欄＋証明の板書。左に問題、右に図）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（角度 2・合同条件・長さ・面積・正しいことがらの選択）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
   ・考えよう（演習プリント（7））の答え（長方形＝∠A＝90° または AC＝BD、ひし形＝AB＝BC または AC⊥BD）は、ワークシート・演習プリント表のどこにも出さない（ことばには、対角線の性質（長方形は等しい・ひし形は垂直）だけを書き、逆（条件）は書かない）。
     小テストの答えとは重ならない。
   ・数値・図は新しく作り、座標から計算しなおして checks にした（図に書いた角の大きさは、座標から測り直した）。
   検算：node tools/verify.cjs sankaku-12　／　見た目：node tools/check.cjs <出力先> sankaku-12 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const D2R = Math.PI / 180;

  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);

  /* ---- 座標（図と checks で同じものを使う） ---- */
  const L4 = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };
  const rect = (w, h) => ({ A: [0, h], B: [0, 0], C: [w, 0], D: [w, h] });
  const rhom = (s, deg) => { const A = [s * Math.cos(deg * D2R), s * Math.sin(deg * D2R)]; return { A, B: [0, 0], C: [s, 0], D: [A[0] + s, A[1]] }; };   // 辺 s、∠B＝deg
  const midp = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
  const RT = P => ['A', 'B', 'C', 'D'].map((v, i, a) => ({ at: v, a: a[(i + 3) % 4], b: a[(i + 1) % 4], right: true, r: 3.2 }));   // 4つの直角のしるし
  const TK4 = [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'A', 1]];

  // 今日の問い：ア 長方形（4つの角が直角）、イ ひし形（4つの辺が等しい）、ウ 正方形（どちらも）
  const R1 = rect(3.6, 2.2), H1 = rhom(3.4, 65), S1 = rect(2.6, 2.6);
  const figA = GEO({ pts: R1, poly: 'ABCD', ang: RT(R1), pad: 5, vl: L4 });
  const figI = GEO({ pts: H1, poly: 'ABCD', tick: TK4, pad: 5, vl: L4 });
  const figU = GEO({ pts: S1, poly: 'ABCD', ang: RT(S1), tick: TK4, pad: 5, vl: L4 });

  // 例題：長方形 ABCD と対角線 AC、DB
  const RX = rect(4, 2.4);
  const figX = GEO({ pts: RX, poly: 'ABCD', segs: ['AC', 'DB'], ang: [{ at: 'B', a: 'A', b: 'C', right: true, r: 3.2 }, { at: 'C', a: 'B', b: 'D', right: true, r: 3.2 }], pad: 6, vl: L4 });

  // 図1：長方形 ABCD（∠ACB＝34°：AB＝BC×tan34°）、対角線の交点 O。∠AOB を x とする
  const BC1 = 4.4, R34 = rect(BC1, BC1 * Math.tan(34 * D2R)), O1 = midp(R34.A, R34.C);
  const fig1 = GEO({
    pts: Object.assign({}, R34, { O: O1 }), poly: 'ABCD', segs: ['AC', 'BD'], dots: ['O'], pad: 6,
    vl: Object.assign({}, L4, { O: ['O', 270] }),
    ang: [{ at: 'C', a: 'A', b: 'B', t: '34°', r: 8, lr: 11 }, { at: 'O', a: 'A', b: 'B', t: 'x', r: 4 }]
  });
  // 図2：ひし形 ABCD（辺 3.4、∠ABC＝64°）、対角線 AC。∠BAC を x とする
  const H64 = rhom(3.4, 64);
  const fig2 = GEO({
    pts: H64, poly: 'ABCD', segs: ['AC'], pad: 6, vl: L4,
    ang: [{ at: 'B', a: 'A', b: 'C', t: '64°', r: 5 }, { at: 'A', a: 'B', b: 'C', t: 'x', r: 5 }]
  });
  // 図3：ひし形 ABCD（辺 3.4、∠ABC＝68°）、対角線の交点 O
  const H68 = rhom(3.4, 68), O3 = midp(H68.A, H68.C);
  const fig3 = GEO({
    pts: Object.assign({}, H68, { O: O3 }), poly: 'ABCD', segs: ['AC', 'BD'], dots: ['O'], tick: [['A', 'B', 1], ['A', 'D', 1]], pad: 6,
    vl: Object.assign({}, L4, { O: ['O', 270] })
  });

  // （7）：平行四辺形 ABCD（辺や角の印なし）
  const P7 = { A: [1.1, 2.4], B: [0, 0], C: [4.2, 0], D: [5.3, 2.4] };
  const fig7 = GEO({ pts: P7, poly: 'ABCD', pad: 6, vl: L4 });

  // （8）：正方形 ABCD（1辺 4）。E は BC 上、F は CD 上で BE＝CF＝1.6。AE と BF の交点 P
  const SQ = rect(4, 4), E8 = [1.6, 0], F8 = [4, 1.6];
  const meet = (P, Q, R, S) => { const d1 = [Q[0] - P[0], Q[1] - P[1]], d2 = [S[0] - R[0], S[1] - R[1]], t = ((R[0] - P[0]) * d2[1] - (R[1] - P[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]); return [P[0] + d1[0] * t, P[1] + d1[1] * t]; };
  const P8 = meet(SQ.A, E8, SQ.B, F8);
  const fig8 = GEO({
    pts: Object.assign({}, SQ, { E: E8, F: F8, P: P8 }), poly: 'ABCD', segs: ['AE', 'BF'], tick: [['B', 'E', 1], ['C', 'F', 1]], dots: ['E', 'F', 'P'], pad: 6,
    vl: Object.assign({}, L4, { E: ['E', 270], F: ['F', 0], P: ['P', 157] })
  });

  // 小テスト（2）：ひし形 ABCD（辺 3.4、∠ABC＝80°）、対角線 AC
  const H80 = rhom(3.4, 80);
  const figQ = GEO({ pts: H80, poly: 'ABCD', segs: ['AC'], pad: 6, vl: L4, ang: [{ at: 'B', a: 'A', b: 'C', t: '80°', r: 5 }, { at: 'A', a: 'B', b: 'C', t: 'x', r: 5 }] });

  /* ---- 検算の道具（checks の式の先頭にそえる） ---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1], cr=(a,b)=>a[0]*b[1]-a[1]*b[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), mid=(P,Q)=>[(P[0]+Q[0])/2,(P[1]+Q[1])/2], ang=(V,P,Q)=>Math.acos(dot(v(V,P),v(V,Q))/len(V,P)/len(V,Q))*180/Math.PI, par=(P,Q,R,S)=>Math.abs(cr(v(P,Q),v(R,S)))<1e-9, same=(P,Q)=>near(P[0],Q[0])&&near(P[1],Q[1]), isPara=(A,B,C,D)=>par(A,B,D,C)&&par(A,D,B,C)&&near(len(A,B),len(D,C))&&near(len(A,D),len(B,C)), area=P=>Math.abs(P.reduce((s,p,i)=>s+p[0]*P[(i+1)%P.length][1]-P[(i+1)%P.length][0]*p[1],0))/2, isRect=(A,B,C,D)=>isPara(A,B,C,D)&&near(dot(v(B,A),v(B,C)),0), isRhom=(A,B,C,D)=>isPara(A,B,C,D)&&near(len(A,B),len(B,C));';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  IK.lesson('sankaku-12', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第12時', title: '長方形・ひし形・正方形は、平行四辺形とどんな関係だろう',
    summary: '長方形・ひし形・正方形が平行四辺形といえるわけを、定義と平行四辺形になる条件から考え、「特別な平行四辺形」としてとらえる。長方形の対角線が等しいことを証明する。',
    head: '図形と証明　第12時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ア 長方形（4つの角が 90°）・イ ひし形（4つの辺が等しい）・ウ 正方形。どれも平行四辺形（2組の対角が等しい／2組の対辺が等しい）
      chk(`const ${pj(R1)}; return isRect(A,B,C,D) && near(ang(A,B,D),90) && near(ang(C,B,D),90) && isPara(A,B,C,D);`),
      chk(`const ${pj(H1)}; return [[A,B],[B,C],[C,D],[D,A]].every(s=>near(len(s[0],s[1]),3.4)) && isPara(A,B,C,D) && isRhom(A,B,C,D) && !near(ang(B,A,C),90);`),
      chk(`const ${pj(S1)}; return isRect(A,B,C,D) && isRhom(A,B,C,D) && isPara(A,B,C,D);`),
      // 例題：長方形 ABCD（4×2.4）。AB＝DC、∠ABC＝∠DCB＝90°、BC は共通 → △ABC≡△DCB → AC＝DB
      chk(`const ${pj(RX)}; return isRect(A,B,C,D) && near(len(A,B),len(D,C)) && near(ang(B,A,C),90) && near(ang(C,B,D),90) && near(len(A,C),len(D,B)) && near(len(A,C),Math.hypot(4,2.4));`),
      // 図1・（1）：長方形で ∠ACB＝34°、OB＝OC（対角線が等しく、中点で交わる）、∠OBC＝34°、∠AOB＝∠OBC+∠OCB＝68°（座標から測る）
      chk(`const ${pj(R34)}, O=${J(O1)}; return isRect(A,B,C,D) && near(ang(C,A,B),34) && same(O,mid(B,D)) && near(len(O,B),len(O,C)) && near(ang(B,O,C),34) && near(ang(O,A,B),68) && near(34+34,68);`),
      // 図2・（2）：ひし形（辺 3.4）、∠ABC＝64°。BA＝BC の二等辺三角形で ∠BAC＝(180−64)÷2＝58°（座標から測る）
      chk(`const ${pj(H64)}; return isRhom(A,B,C,D) && near(ang(B,A,C),64) && near(len(B,A),len(B,C)) && near(ang(A,B,C),58) && near((180-64)/2,58);`),
      // 図3・（3）：ひし形、O は対角線の交点。AB＝AD、BO＝DO、AO は共通 → △ABO≡△ADO（3組の辺）。AC⊥BD
      chk(`const ${pj(H68)}, O=${J(O3)}; return isRhom(A,B,C,D) && same(O,mid(A,C)) && same(O,mid(B,D)) && near(len(A,B),len(A,D)) && near(len(B,O),len(D,O)) && near(len(A,B),len(A,D)) && near(ang(O,A,B),ang(O,A,D)) && near(ang(O,A,B),90) && near(dot(v(A,C),v(B,D)),0);`),
      // （4）長方形で AC＝12：OA＝OB＝OC＝OD＝6（辺 7 と √95 の長方形で、座標から確かめる）
      chk(`const A=[0,Math.sqrt(95)],B=[0,0],C=[7,0],D=[7,Math.sqrt(95)],O=mid(A,C); return isRect(A,B,C,D) && near(len(A,C),12) && near(len(O,A),6) && near(len(O,B),6) && near(len(O,C),6) && near(len(O,D),6);`),
      // （5）正方形で対角線 10：1辺 10/√2、面積 50＝10×10÷2（ひし形の面積の公式でも同じ）
      chk(`const s=10/Math.SQRT2, A=[0,s],B=[0,0],C=[s,0],D=[s,s]; return isRect(A,B,C,D) && isRhom(A,B,C,D) && near(len(A,C),10) && near(area([A,B,C,D]),50) && near(10*10/2,50);`),
      // （6）ア 長方形は平行四辺形（正しい）　イ 平行四辺形は長方形（誤り：ひし形で ∠B＝64° の例）　ウ ひし形は正方形（誤り：同じ例）　エ 正方形はひし形（正しい）
      chk(`const R=[[0,2],[0,0],[3,0],[3,2]], H=[[3.4*Math.cos(64*Math.PI/180),3.4*Math.sin(64*Math.PI/180)],[0,0],[3.4,0]]; H.push([H[0][0]+3.4,H[0][1]]); const S=[[0,2],[0,0],[2,0],[2,2]]; return isPara(...R) && isPara(...H) && !isRect(...H) && isRhom(...H) && !isRect(...H) && isRhom(...S) && isRect(...S);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：平行四辺形（u、v）で、対角線 u+v と u−v が等しい ⇔ u⊥v（長方形）。垂直 ⇔ |u|＝|v|（ひし形）
      `(() => { const L=a=>Math.hypot(a[0],a[1]); const ok=[[[3,0],[1,2]],[[4,1],[-1,2]],[[2,2],[3,-1]],[[5,0],[0,2]],[[3,1],[1,3]]].every(([u,v])=>{ const s=[u[0]+v[0],u[1]+v[1]], d=[u[0]-v[0],u[1]-v[1]], dotuv=u[0]*v[0]+u[1]*v[1], dd=s[0]*d[0]+s[1]*d[1]; return near(L(s)>=L(d)?1:0,L(s)>=L(d)?1:0) && (Math.abs(L(s)-L(d))<1e-9)===(Math.abs(dotuv)<1e-9) && (Math.abs(dd)<1e-9)===(Math.abs(L(u)-L(v))<1e-9); }); return ok; })()`,
      // （8）：正方形（辺 4）、BE＝CF＝1.6。AB＝BC、∠ABE＝∠BCF＝90°、BE＝CF → △ABE≡△BCF、∠BAE＝∠CBF。P で ∠BPE＝90°（AE⊥BF）
      chk(`const ${pj(SQ)}, E=${J(E8)}, F=${J(F8)}, P=${J(P8)}; return isRect(A,B,C,D) && isRhom(A,B,C,D) && near(len(B,E),len(C,F)) && near(len(A,B),len(B,C)) && near(ang(B,A,E),90) && near(ang(C,B,F),90) && near(len(A,E),len(B,F)) && near(ang(A,B,E),ang(B,C,F)) && near(ang(A,B,E)+ang(E,A,B),90) && near(ang(B,C,F)+ang(E,A,B),90) && near(ang(B,P,E),ang(B,C,F)) && near(ang(E,B,P)+ang(B,E,P),90) && near(ang(P,B,E),90) && near(dot(v(A,E),v(B,F)),0);`),
      // 小テスト（2）：ひし形で ∠ABC＝80°。BA＝BC だから ∠BAC＝(180−80)÷2＝50°
      chk(`const ${pj(H80)}; return isRhom(A,B,C,D) && near(ang(A,B,C),50) && near(ang(B,A,C),80) && near((180-80)/2,50);`),
      // 小テスト（3）：対角線が 6cm、8cm のひし形（頂点 (±4,0)、(0,±3)）。辺 5、面積＝6×8÷2＝24
      chk(`const A=[-4,0],B=[0,-3],C=[4,0],D=[0,3]; return isRhom(A,B,C,D) && near(dot(v(A,C),v(B,D)),0) && near(len(A,C),8) && near(len(B,D),6) && near(area([A,B,C,D]),24) && near(6*8/2,24);`),
      // 小テスト（4）チャレンジ：ひし形で BD＝AB。AB＝AD＝BD で正三角形 → ∠A＝60°、∠ABC＝180°−60°＝120°（A(0,0)・B(1,0)・D(0.5,√3/2) の座標で確かめる）
      chk(`const A=[0,0],B=[1,0],D=[0.5,Math.sqrt(3)/2],C=[B[0]+D[0]-A[0],B[1]+D[1]-A[1]]; return isRhom(A,B,C,D) && near(len(B,D),len(A,B)) && near(len(A,D),len(A,B)) && near(ang(A,B,D),60) && near(ang(B,A,C),120) && near(180-60,120);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('長方形・ひし形・正方形は、平行四辺形とどんな関係だろう'),
      K('今日の問い', '長方形・ひし形・正方形は、平行四辺形といえるだろうか。ア〜ウの図の印と、平行四辺形になる条件をもとに、わけを考えよう。', 2),
      F(4, cap(figA, 'ア　長方形'), cap(figI, 'イ　ひし形'), cap(figU, 'ウ　正方形')),
      T('①', '自分の考え（3分）　ア〜ウのそれぞれについて、わけを書こう。', 1),
      B(3, '（例）長方形 … 4つの角が等しい → 2組の対角が等しい → 平行四辺形\nひし形 … 4つの辺が等しい → 2組の対辺が等しい → 平行四辺形\n正方形 … 長方形でも、ひし形でもあるから、平行四辺形'),
      T('②', 'ペアの考え（3分）　自分とちがう説明を書こう。', 1),
      B(2, ''),
      G(1),
      WD('① 4つの{{角}}が等しい四角形を、長方形という。\n② 4つの{{辺}}が等しい四角形を、ひし形という。\n③ 4つの角も辺も等しい四角形を、{{正方形}}という。\n④ 3つとも、{{平行四辺形}}の性質をもつ。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '長方形 ABCD の対角線 AC、DB の長さは等しい。このことを証明しよう。仮定 … 長方形 ABCD（4つの{{角}}が等しい）　結論 … {{AC＝DB}}', 4)
      ], [
        F(4, figX)
      ], '3:2'),
      T('', '【書き方のくふう】長方形は、平行四辺形でもあることを使おう。', 1),
      B(8, '（仮定）長方形 ABCD　（結論）AC＝DB\n（証明）△ABC と △DCB において\n長方形は平行四辺形だから、対辺は等しく　AB＝DC …①\n長方形の4つの角は等しいから　∠ABC＝∠DCB …②\nBC は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△ABC≡△DCB\n合同な図形の、対応する辺は等しいから　AC＝DB')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 4つの角が等しい四角形を、{{長方形}}という。\n② 4つの辺が等しい四角形を、{{ひし形}}という。\n③ 長方形の対角線は{{等しく}}、ひし形の対角線は{{垂直}}に交わる。\n④ 長方形・ひし形・正方形は、どれも{{平行四辺形}}の仲間である。', 4, { label: 'ことば' }),
      F(5, cap(fig1, '図1　長方形'), cap(fig2, '図2　ひし形'), cap(fig3, '図3　ひし形')),
      C2([
        T('（1）', '図1の長方形 ABCD で、対角線の交点を O とする。∠x の大きさを求めよう。', 3),
        B(2, 'OB＝OC だから ∠OBC＝34°\n∠x＝34°+34°＝68°')
      ], [
        T('（2）', '図2のひし形 ABCD で、∠x の大きさを求めよう。', 3),
        B(2, 'BA＝BC だから\n∠x＝(180°−64°)÷2＝58°')
      ], '1:1'),
      MA('【説明】長方形が平行四辺形といえるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '図形の性質を使って、考えよう。'),
      C2([
        T('（3）', '図3のひし形で、AC⊥BD を示すために、△ABO≡△ADO を示す。使う合同条件を答えよう。', 4),
        B(2, '3組の辺が、それぞれ\n等しい')
      ], [
        T('（4）', '長方形 ABCD の対角線 AC＝12cm、交点を O とする。線分 OB の長さを求めよう。', 4),
        B(2, 'OA＝OB＝OC＝OD だから\nOB＝12÷2＝6（cm）')
      ], '1:1'),
      C2([
        T('（5）', '対角線の長さが 10cm の正方形の面積を求めよう。', 3),
        B(2, 'ひし形でもあるから\n10×10÷2＝50（cm^2）')
      ], [
        T('（6）', '次のうち、いつも正しいものをすべて選ぼう。\nア 長方形は平行四辺形である。\nイ 平行四辺形は長方形である。\nウ ひし形は正方形である。\nエ 正方形はひし形である。', 6),
        B(1, 'ア、エ')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：平行四辺形に条件を加えて、長方形やひし形をつくろう。'),
      C2([
        T('（7）', '平行四辺形 ABCD に、どんな条件を1つ加えると、長方形になるだろう。また、ひし形になるだろう。辺や角についての条件と、対角線についての条件を、それぞれ考えよう。', 5)
      ], [
        F(5, fig7)
      ], '3:2'),
      C2([
        T('', '長方形になる条件', 1),
        B(7, '')
      ], [
        T('', 'ひし形になる条件', 1),
        B(7, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '正方形 ABCD の辺 BC、CD 上に、BE＝CF となる点 E、F をとる。AE と BF の交点を P とする。AE⊥BF であることを証明しよう。', 5)
      ], [
        F(5, fig8)
      ], '3:2'),
      B(10, '（仮定）正方形 ABCD、BE＝CF　（結論）AE⊥BF\n（証明）△ABE と △BCF において\n正方形の辺だから　AB＝BC …①\n正方形の角だから　∠ABE＝∠BCF＝90° …②\n仮定より　BE＝CF …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△ABE≡△BCF　したがって　∠BAE＝∠CBF …④\n△ABE で　∠BAE+∠AEB＝90° だから　∠CBF+∠AEB＝90°\n△PBE で　∠BPE＝180°−(∠PBE+∠PEB)＝180°−90°＝90°\nしたがって　AE⊥BF'),
      MA('① △ABE と △BCF は、合同になるかな。\n② 合同から、等しい角はどれかな。∠BPE をふくむ三角形に目をつけよう。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', 'ひし形の定義を答えよう。また、ひし形の対角線は、どのように交わるか。（3点）', 2),
      B(2, '定義 … 4つの辺が等しい四角形\n対角線は、垂直に交わる。'),
      C2([
        T('（2）', '右のひし形 ABCD で、∠x の大きさを求めよう。（3点）', 3),
        B(3, 'BA＝BC だから\n∠x＝(180°−80°)÷2\n　　＝50°')
      ], [
        F(4, figQ)
      ], '1:1'),
      T('（3）', '対角線の長さが 6cm と 8cm のひし形の面積を求めよう。（4点）', 2),
      B(2, '対角線は垂直に交わるから\n6×8÷2＝24（cm^2）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', 'ひし形 ABCD で、対角線 BD の長さが辺 AB の長さと等しい。∠ABC の大きさを求めよう。', 3),
      B(4, 'AB＝AD（ひし形）、AB＝BD だから、△ABD は正三角形\n∠A＝60°\nAD∥BC だから　∠ABC＝180°−60°＝120°')
    ]
  });
})();
