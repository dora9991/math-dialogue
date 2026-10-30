/* 相似な図形 第5時：2つの三角形が相似であることを、証明しよう。
   元：授業ナビ標準版 souji-05（例）。例題1（辺 AB 上の点 D で ∠ACD＝∠ABC のとき △ABC∽△ACD）の証明を「今日の問い」（相似といえるか。どんな順で説明するか）に、
   練習（AB∥CD で AD と BC が点 O で交わるとき △OAB∽△ODC）の証明を「例題」（証明の空欄）に、「例題とは別の角の組で、同じことを証明できるか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（図1）。個人3分 → ペア3分 → ことば → 例題（図2。証明の空欄）。授業ナビの「合同の証明とくらべる」考えようは使わず、別の（7）にした。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
   ・証明の答え（B）は「（仮定）…／（結論）…／（証明）…」。対応する頂点の順に書き、使う相似条件を書く。
   ・数値・図は新しく作り、座標から、等しい角・辺の比・相似・長さを出しなおして checks にした（図の字・印も座標と合うことを確かめた）。
     「対頂角」は（7）の答えにかかわるので、ワークシート・演習プリント表・小テストには出さない。
   検算：node tools/verify.cjs souji-05　／　見た目：node tools/check.cjs <出力先> souji-05 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify, R = Math.PI / 180;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const cen = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 辺 a-b の外がわ（図形の中心から遠ざかる向き）に、字 t を置く
  const side = (P, a, b, t, k) => { const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = cen(P); const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1; return { p: m, t, dx: (k || 5) * vx / L, dy: -(k || 5) * vy / L }; };
  // 三角形：B が左下、C が右下（BC＝bc）。AB＝ab、AC＝ac
  const tri = (ab, ac, bc) => { const x = (ab * ab - ac * ac + bc * bc) / (2 * bc); return { A: [x, Math.sqrt(ab * ab - x * x)], B: [0, 0], C: [bc, 0] }; };
  // 辺 AB 上の点 D、辺 AC 上の点 E（A から t の位置）で、DE∥BC の図
  const para = (P, t) => Object.assign({}, P, { D: lerp(P.A, P.B, t), E: lerp(P.A, P.C, t) });
  const paraFig = P => GEO({ pts: P, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], par: [['D', 'E', 1], ['B', 'C', 1]], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180], E: ['E', 0] }, pad: 6 });
  // AB∥CD で、AD と BC が点 O で交わる図（O が原点。A(−p, h)・B(q, h)、D＝−k×A、C＝−k×B）
  const xpts = (p, q, h, k) => ({ A: [-p, h], B: [q, h], C: [-k * q, -k * h], D: [k * p, -k * h], O: [0, 0] });
  const XV = { A: ['A', 135], B: ['B', 45], C: ['C', 225], D: ['D', 315], O: ['O', 0, 3.2] };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い・図1：AB＝9、AC＝6、BC＝8 の △ABC。D は AB 上で AD＝4（AC²＝AB×AD なので ∠ACD＝∠ABC になる）
  const P1 = tri(9, 6, 8); P1.D = lerp(P1.A, P1.B, 4 / 9);
  const fig1 = GEO({
    pts: P1, poly: 'ABC', segs: ['CD'], dots: ['D'],
    vl: { A: ['A', 70], B: ['B', 225], C: ['C', 315], D: ['D', 180] },
    ang: [{ at: 'B', a: 'A', b: 'C', n: 1, r: 5 }, { at: 'C', a: 'A', b: 'D', n: 1, r: 5 }], pad: 6
  });
  // 例題・図2、演習プリント（7）の図4：AB∥CD（AB＝4、CD＝6、OA：OD＝2：3）
  const P2 = xpts(1.5, 2.5, 2, 1.5);
  const fig2 = GEO({ pts: P2, poly: 'ABCD', dots: ['O'], par: [['A', 'B', 1], ['C', 'D', 1]], vl: XV, pad: 6 });
  // 演習プリント 図1：DE∥BC（AD＝0.4AB）
  const D1 = para({ B: [0, 0], C: [7, 0], A: [2.2, 4.4] }, 0.4);
  const d1 = paraFig(D1);
  // 図2：AB＝6、CD＝15、OA＝4（OA：OD＝2：5）。OA＝4 になるように A(−2.4, 3.2)
  const D2 = xpts(2.4, 3.6, 3.2, 2.5);
  const d2 = GEO({
    pts: D2, poly: 'ABCD', dots: ['O'], par: [['A', 'B', 1], ['C', 'D', 1]], vl: XV, pad: 6,
    txt: [{ p: [0.6, 3.2], t: '6cm', dy: -3.8 }, { p: [-1.5, -8], t: '15cm', dy: 5.2 }, { p: [-1.2, 1.6], t: '4cm', dx: -5.6, dy: 2.2 }]
  });
  // 図3：∠A＝90° の △ABC（AB＝9、AC＝12、BC＝15）と、A から BC への垂線 AD
  const D3 = { B: [0, 0], C: [15, 0], A: [5.4, 7.2], D: [5.4, 0] };
  const d3 = GEO({
    pts: D3, poly: 'ABC', segs: ['AD'], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270] },
    ang: [{ at: 'A', a: 'B', b: 'C', right: true, r: 3 }, { at: 'D', a: 'A', b: 'C', right: true, r: 2.6 }],
    txt: [side(D3, 'A', 'B', '9cm', 5.4), { p: [7.5, 0], t: '15cm', dy: 5.4 }], pad: 6
  });
  // （8）：▱ABCD の辺 BC 上に BE：EC＝1：3 の点 E。AE と BD の交点 F（BF：FD＝1：4）
  const P8 = { A: [1, 3], B: [0, 0], C: [8, 0], D: [9, 3] }; P8.E = lerp(P8.B, P8.C, 1 / 4);
  { // AE と BD の交点（連立方程式）
    const a = P8.A, e = P8.E, b = P8.B, d = P8.D, dx = e[0] - a[0], dy = e[1] - a[1], ex = d[0] - b[0], ey = d[1] - b[1];
    const s = ((b[0] - a[0]) * ey - (b[1] - a[1]) * ex) / (dx * ey - dy * ex); P8.F = [a[0] + dx * s, a[1] + dy * s];
  }
  const fig8 = GEO({
    pts: P8, poly: 'ABCD', segs: ['AE', 'BD'], dots: ['E', 'F'],
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], E: ['E', 270], F: ['F', 20, 3.6] }, pad: 6
  });
  // 小テストの図：DE∥BC（AD＝0.6AB）
  const Q1 = para({ B: [0, 0], C: [6.4, 0], A: [3.4, 4.2] }, 0.6);
  const figQ = paraFig(Q1);

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), '
    + 'onSeg=(P,Q,X)=>near(dd(P,X)+dd(X,Q),dd(P,Q)), '
    + 'sim=(P1,P2,P3,Q1,Q2,Q3)=>{const a=[dd(P1,P2),dd(P2,P3),dd(P3,P1)],b=[dd(Q1,Q2),dd(Q2,Q3),dd(Q3,Q1)];return near(a[0]/b[0],a[1]/b[1])&&near(a[1]/b[1],a[2]/b[2]);};';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  IK.lesson('souji-05', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第5時', title: '2つの三角形が相似であることを、証明しよう',
    summary: '∠ACD＝∠ABC の図で △ABC と △ACD が相似といえるわけを考え、相似の証明の書き方（△〜 と △〜 において／等しいものを根拠つきで／相似条件／結論）をとらえる。平行線の錯角を使って証明する。',
    head: '相似な図形　第5時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・図1：AB＝9、AC＝6、AD＝4（D は AB 上）。∠A は共通、∠ACD＝∠ABC（座標から）。AB：AC＝AC：AD＝3：2、3組の辺の比が等しく △ABC∽△ACD。D が C のところの角 ∠ACB を二つに分けるので ∠ACD＜∠ACB
      chk(`const ${pj(P1)}; return near(dd(A,B),9) && near(dd(A,C),6) && near(dd(A,D),4) && onSeg(A,B,D) && near(an(C,A,D),an(B,A,C)) && near(an(A,B,C),an(A,C,D)) && near(dd(A,B)/dd(A,C),dd(A,C)/dd(A,D)) && sim(A,B,C,A,C,D) && an(C,A,D)<an(C,A,B) && near(an(C,A,B),an(C,A,D)+an(C,D,B));`),
      // 例題・図2：AB∥CD（外積 0）。AB＝4、CD＝6。O は AD と BC の交点（AD、BC がともに O を通る）。錯角 ∠OAB＝∠ODC、∠OBA＝∠OCD。△OAB∽△ODC（A↔D、B↔C、O↔O）
      chk(`const ${pj(P2)}; return near(cr(A,B,C,D),0) && near(dd(A,B),4) && near(dd(C,D),6) && near(cr(A,D,A,O),0) && near(cr(B,C,B,O),0) && onSeg(A,D,O) && onSeg(B,C,O) && near(an(A,O,B),an(D,O,C)) && near(an(A,B,O),an(D,C,O)) && near(an(B,A,O),an(C,D,O)) && sim(O,A,B,O,D,C) && near(dd(O,A)/dd(O,D),dd(A,B)/dd(C,D));`),
      // （1）図1：DE∥BC（AD＝0.4AB）。∠DAE＝∠BAC（共通）、∠ADE＝∠ABC（同位角）、∠AED＝∠ACB。△ADE∽△ABC
      chk(`const ${pj(D1)}; return near(cr(D,E,B,C),0) && onSeg(A,B,D) && onSeg(A,C,E) && near(an(A,D,E),an(A,B,C)) && near(an(A,E,D),an(A,C,B)) && sim(A,D,E,A,B,C);`),
      // （2）図2：AB∥CD、AB＝6、CD＝15、OA＝4（図のとおり）。錯角 ∠OAB＝∠ODC、∠OBA＝∠OCD
      chk(`const ${pj(D2)}; return near(cr(A,B,C,D),0) && near(dd(A,B),6) && near(dd(C,D),15) && near(dd(O,A),4) && near(an(A,B,O),an(D,C,O)) && near(an(B,A,O),an(C,D,O)) && sim(O,A,B,O,D,C);`),
      // （4）OA：OD＝AB：DC → 4：OD＝6：15 → OD＝4×15÷6＝10（座標でも OD＝10）
      chk(`const ${pj(D2)}; return near(dd(O,D),10) && near(4*15/6,10) && near(dd(O,A)/dd(O,D),dd(A,B)/dd(C,D)) && near(dd(O,B)/dd(O,C),dd(A,B)/dd(C,D));`),
      // （3）（6）図3：∠A＝90°、AD⊥BC。AB＝9、AC＝12、BC＝15。△ABC∽△DBA（∠B 共通、∠A＝∠D＝90°）、△ABC∽△DAC（∠C 共通）。（6）BD＝AB²÷BC＝81÷15＝5.4
      chk(`const ${pj(D3)}; return near(an(A,B,C),90) && near(an(D,A,B),90) && near(dd(A,B),9) && near(dd(A,C),12) && near(dd(B,C),15) && sim(A,B,C,D,B,A) && sim(A,B,C,D,A,C) && near(dd(B,D),5.4) && near(81/15,5.4) && near(dd(A,B)/dd(D,B),dd(B,C)/dd(B,A));`),
      // （5）D は AB 上、AC＝12、AD＝9：AB＝12²÷9＝16。座標 A(0,0)、B(16,0)、D(9,0)、C（AC＝12 で適当な向き）：∠ACD＝∠ABC、AB：AC＝AC：AD
      chk(`const t=57*Math.PI/180, A=[0,0], B=[144/9,0], D=[9,0], C=[12*Math.cos(t),12*Math.sin(t)]; return near(dd(A,B),16) && near(an(C,A,D),an(B,A,C)) && sim(A,B,C,A,C,D) && onSeg(A,B,D) && near(12*12/9,16);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：図4（P2）で、等しい角は 3組（∠OAB＝∠ODC、∠OBA＝∠OCD、∠AOB＝∠DOC）。どの 2組でも 2組の角が等しくなり、相似になる
      chk(`const ${pj(P2)}; const e=[near(an(B,A,O),an(C,D,O)), near(an(A,B,O),an(D,C,O)), near(an(A,O,B),an(D,O,C))]; return e.every(Boolean) && sim(O,A,B,O,D,C) && near(an(A,O,B)+an(B,A,O)+an(A,B,O),180);`),
      // （8）▱ABCD、BE：EC＝1：3、F＝AE∩BD。AD∥BC（錯角 ∠FAD＝∠FEB、∠FDA＝∠FBE）、△AFD∽△EFB。BF：FD＝BE：AD＝1：4 → BD＝20 のとき BF＝20÷5＝4
      chk(`const ${pj(P8)}; return near(cr(A,D,B,C),0) && near(cr(A,B,D,C),0) && near(dd(B,E)/dd(E,C),1/3) && onSeg(A,E,F) && onSeg(B,D,F) && near(an(F,A,D),an(F,E,B)) && near(an(F,D,A),an(F,B,E)) && sim(F,A,D,F,E,B) && near(dd(B,F)/dd(F,D),1/4) && near(dd(B,E)/dd(A,D),1/4) && near(20/(1+4),4);`),
      // 小テスト（1）図：DE∥BC（AD＝0.6AB）。∠DAE＝∠BAC（共通）、∠ADE＝∠ABC（同位角）、△ADE∽△ABC
      chk(`const ${pj(Q1)}; return near(cr(D,E,B,C),0) && onSeg(A,B,D) && onSeg(A,C,E) && near(an(A,D,E),an(A,B,C)) && sim(A,D,E,A,B,C);`),
      // 小テスト（2）AC＝10、AD＝5：AB＝10²÷5＝20（座標：A(0,0)、B(20,0)、D(5,0)、C は AC＝10）。（3）AB∥CD、AB＝4、CD＝10、OA＝2：OD＝2×10÷4＝5
      chk(`const t=63*Math.PI/180, A=[0,0], B=[20,0], D=[5,0], C=[10*Math.cos(t),10*Math.sin(t)]; return near(an(C,A,D),an(B,A,C)) && sim(A,B,C,A,C,D) && near(10*10/5,20) && near(2*10/4,5) && near(dd(A,B)/dd(A,C),dd(A,C)/dd(A,D));`),
      chk(`const O=[0,0], A=[-1.2,1.6], k=5/2, B=[2.8,1.6], D=[-k*A[0],-k*A[1]], C=[-k*B[0],-k*B[1]]; return near(dd(O,A),2) && near(dd(A,B),4) && near(cr(A,B,C,D),0) && near(dd(O,D),5) && near(dd(C,D),5) && near(2*10/4,5) && sim(O,A,B,O,D,C);`),
      // 小テスト（4）チャレンジ：∠A＝90°、AD⊥BC、BD＝4、DC＝9：A(0,6)・B(−4,0)・C(9,0)・D(0,0)。AD＝6（AD×AD＝BD×DC＝36）。△DBA∽△DAC
      chk(`const A=[0,6], B=[-4,0], C=[9,0], D=[0,0]; return near(an(A,B,C),90) && near(dd(D,A),6) && near(dd(D,A)*dd(D,A),dd(B,D)*dd(D,C)) && sim(D,B,A,D,A,C) && near(4*9,36) && near(Math.sqrt(36),6);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2つの三角形が相似であることを、証明しよう'),
      K('今日の問い', '図1で、点 D は辺 AB 上にあり、∠ACD＝∠ABC である。△ABC と △ACD は相似といえるだろうか。いえるなら、どんな順で説明すればよいだろう。', 2),
      F(5, cap(fig1, '図1'), cap(fig2, '図2')),
      T('①', '自分の考え（3分）　相似といえるわけを、順に書こう。', 1),
      B(5, '（仮定）∠ACD＝∠ABC　（結論）△ABC∽△ACD\n（証明）△ABC と △ACD において\n共通な角だから　∠BAC＝∠CAD …①\n仮定より　∠ABC＝∠ACD …②\n①、② より、2組の角が、それぞれ等しいから　△ABC∽△ACD'),
      T('②', 'ペアの考え（3分）　自分とちがう書き方・順番を書こう。', 1),
      B(2, ''),
      G(1),
      WD('証明では、はじめに、比べる2つの{{三角形}}を示す。\n等しい角や辺の比を、{{根拠}}をつけて、順に書く。\n最後に、使った{{相似条件}}と、結論を書く。\n等しい角の根拠：{{共通}}な角・平行線の{{錯角}}', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '図2で、AB∥CD で、線分 AD と BC は点 O で交わっている。△OAB∽△ODC であることを証明しよう。□ をうめよう。\n△OAB と △ODC において\nAB∥CD より、{{錯角}}は等しいから\n∠OAB＝∠{{ODC}} …①　　∠OBA＝∠{{OCD}} …②\n①、② より、{{2組の角}}が、それぞれ等しいから\n△OAB∽△{{ODC}}', 7),
      T('', '【見つけ方のくふう】等しい角は、どこに目をつけて見つけたか。', 1),
      B(2, '平行線があるから、錯角（同位角）が等しい。\n共通な角や、どちらも直角の角も、見のがさない。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 相似を証明するときは、{{相似条件}}を根拠にする。\n② 相似条件の1つは「{{2組の角}}が、それぞれ等しい」。\n③ 平行線では、{{同位角}}や{{錯角}}が等しいことを使う。\n④ 相似な三角形は、{{対応}}する頂点を同じ順に書く。', 4, { label: 'ことば' }),
      F(5, cap(d1, '図1'), cap(d2, '図2'), cap(d3, '図3')),
      C2([
        T('（1）', '図1で、DE∥BC のとき、△ADE と △ABC の等しい角を、2組答えよう。', 3),
        B(2, '∠DAE＝∠BAC（共通）\n∠ADE＝∠ABC（同位角）')
      ], [
        T('（2）', '図2で、AB∥CD のとき、△OAB と △ODC の等しい角を、2組答えよう。', 3),
        B(2, '∠OAB＝∠ODC\n∠OBA＝∠OCD（錯角）')
      ], '1:1'),
      MA('【説明】相似の証明は、どんな順に書くか。図1で △ADE∽△ABC を示す場合を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '証明で見つけた相似を使って、長さを求めよう。'),
      C2([
        T('（3）', '図3で、△ABC と相似な三角形を、記号 ∽ を使って2つ答えよう。', 3),
        B(3, '△ABC∽△DBA\n△ABC∽△DAC\n（直角と、共通な角）')
      ], [
        T('（4）', '図2で、AB＝6cm、CD＝15cm、OA＝4cm のとき、OD は何 cm か。', 3),
        B(3, 'OA：OD＝AB：DC\n4：OD＝6：15\nOD＝10cm')
      ], '1:1'),
      C2([
        T('（5）', '△ABC の辺 AB 上に点 D があり、∠ACD＝∠ABC である。AC＝12cm、AD＝9cm のとき、AB は何 cm か。', 5),
        B(3, '△ABC∽△ACD\nAB：AC＝AC：AD\nAB：12＝12：9　AB＝16cm')
      ], [
        T('（6）', '図3で、AB＝9cm、BC＝15cm のとき、BD は何 cm か。', 5),
        B(3, '△ABC∽△DBA\nAB：DB＝BC：BA\n9：BD＝15：9　BD＝5.4cm')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：別の証明を、考えよう。'),
      T('（7）', '図4で、AB∥CD で、AD と BC は点 O で交わっている。例題では、錯角を 2組使って △OAB∽△ODC を証明した。使う角を変えても、証明できるだろうか。', 3),
      C2([
        F(6, cap(fig2, '図4'))
      ], [
        T('', '等しい角に、しるしをつけて、使う角を書こう', 2),
        B(4, '')
      ], '1:1'),
      T('', 'ほかの証明（書いてみよう）', 1),
      B(5, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '▱ABCD の辺 BC 上に、BE：EC＝1：3 となる点 E をとり、AE と対角線 BD の交点を F とする。\n① △AFD∽△EFB であることを証明しよう。\n② BD＝20cm のとき、BF の長さを求めよう。', 6)
      ], [
        F(6, fig8)
      ], '3:2'),
      B(6, '（仮定）▱ABCD、BE：EC＝1：3　（結論）△AFD∽△EFB\n（証明）△AFD と △EFB において\nAD∥BC より、錯角は等しいから\n∠FAD＝∠FEB …①　　∠FDA＝∠FBE …②\n①、② より、2組の角が、それぞれ等しいから　△AFD∽△EFB\n② BF：FD＝BE：AD＝1：4 だから　BF＝20×[[1/5]]＝4（cm）'),
      MA('① 平行四辺形では、AD と BC は、どんな関係かな。\n② ①の相似から、BF：FD を、BE と AD の比で表せないかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      F(4, figQ),
      T('（1）', '図で、DE∥BC である。△ADE∽△ABC の証明の □ をうめよう。（4点）\n△ADE と △ABC において\n共通な角だから　∠DAE＝∠{{BAC}} …①\nDE∥BC より、{{同位角}}は等しいから　∠ADE＝∠{{ABC}} …②\n①、② より、{{2組の角}}が、それぞれ等しいから\n△ADE∽△ABC', 7),
      B(1, '順に　BAC　／　同位角、ABC　／　2組の角'),
      T('（2）', '△ABC の辺 AB 上に点 D があり、∠ACD＝∠ABC である。AC＝10cm、AD＝5cm のとき、AB は何 cm か。（3点）', 2),
      B(3, '△ABC∽△ACD\nAB：AC＝AC：AD　AB：10＝10：5\nAB＝20cm'),
      T('（3）', 'AB∥CD で、線分 AD と BC は点 O で交わっている。AB＝4cm、CD＝10cm、OA＝2cm のとき、OD は何 cm か。（3点）', 2),
      B(3, '△OAB∽△ODC\nOA：OD＝AB：DC　2：OD＝4：10\nOD＝5cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '∠A＝90° の直角三角形 ABC で、頂点 A から辺 BC に垂線 AD をひく。BD＝4cm、DC＝9cm のとき、AD の長さを求めよう。', 3),
      B(4, '△DBA∽△DAC（2組の角が等しい）\nBD：AD＝AD：DC　4：AD＝AD：9\nAD×AD＝4×9＝36　AD＝6cm')
    ]
  });
})();
