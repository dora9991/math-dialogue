/* 相似な図形 第9時：線分の比が等しければ、平行といえるだろうか。
   元：授業ナビ標準版 souji-09（探）。課題（AD：AB＝AE：AC のとき DE∥BC といえるか。予想して証明）を「今日の問い」（比が等しい図で、平行といえるか）に、
   例題1（AD・DB・AE・EC から ○×）を「例題」（表）に、「AD：AB＝DE：BC ならば DE∥BC か」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（AD＝4・DB＝6・AE＝6・EC＝9 の図で DE∥BC といえるか）。個人3分 → ペア3分 → ことば（逆・定理の逆）→ 例題（○×の表）。
     先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形で、相似（2組の辺の比とその間の角）から同位角を出す証明を全部書いた。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（比の比べ方、x を決める、3点 D・E・F のうち辺に平行な線分、平行を確かめて BC を求める）／
     裏＝ひろげる（考えよう・答えなし：実寸の図でコンパスを使う）・チャレンジ★★（AD：DB＝AE：EC から DE∥BC を出し、△PDE∽△PCB を証明。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、座標（頂点を座標で決め、長さ・比・平行を計算）から出しなおした。
     「AD：AB＝DE：BC では平行とはかぎらない」は（7）の答えにかかわるので、ワークシート・演習プリントの表と答えには書かない。
   検算：node tools/verify.cjs souji-09　／　見た目：node tools/check.cjs <出力先> souji-09 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const cen = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 辺 a-b の外がわ（図形の中心から遠ざかる向き）に、字 t を置く
  const side = (P, a, b, t, k) => { const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = cen(P); const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1; return { p: m, t, dx: (k || 5) * vx / L, dy: -(k || 5) * vy / L }; };
  // 三角形：B が左下、C が右下（BC＝bc）。AB＝ab、AC＝ac
  const tri = (ab, ac, bc) => { const x = (ab * ab - ac * ac + bc * bc) / (2 * bc); return { A: [x, Math.sqrt(ab * ab - x * x)], B: [0, 0], C: [bc, 0] }; };
  const VL = { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180], E: ['E', 0] };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm。（7）だけ mm） ---------------- */
  // 今日の問い：AB＝10、AC＝15、BC＝18。D は AB 上で AD＝4（DB＝6）、E は AC 上で AE＝6（EC＝9）。AD：DB＝AE：EC＝2：3
  const PW = tri(10, 15, 18); PW.D = lerp(PW.A, PW.B, 0.4); PW.E = lerp(PW.A, PW.C, 0.4);
  const figW = GEO({
    pts: PW, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], vl: VL, pad: 7,
    txt: [side(PW, 'A', 'D', '4cm', 6.4), side(PW, 'D', 'B', '6cm', 6.4), side(PW, 'A', 'E', '6cm', 6.4), side(PW, 'E', 'C', '9cm', 6.4)]
  });
  // 演習プリント 図1（5）：AB＝12、BC＝15、CA＝14。D は AB 上（AD＝4、DB＝8）、E は BC 上（BE＝10、EC＝5）、F は CA 上（CF＝6、FA＝8）。平行なのは DE∥AC だけ
  const P5 = tri(12, 14, 15); P5.D = lerp(P5.A, P5.B, 4 / 12); P5.E = lerp(P5.B, P5.C, 10 / 15); P5.F = lerp(P5.C, P5.A, 6 / 14);
  const fig5 = GEO({
    pts: P5, poly: 'ABC', segs: ['DE', 'EF', 'FD'], dots: ['D', 'E', 'F'], pad: 8,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180], E: ['E', 270], F: ['F', 0] },
    txt: [side(P5, 'A', 'D', '4', 4), side(P5, 'D', 'B', '8', 4), side(P5, 'B', 'E', '10', 4.4), side(P5, 'E', 'C', '5', 4.4), side(P5, 'C', 'F', '6', 4), side(P5, 'F', 'A', '8', 4)]
  });
  // 図2（6）：AB＝15、AC＝10、BC＝15。D は AB 上（AD＝6、DB＝9）、E は AC 上（AE＝4、EC＝6）。DE＝6（DE∥BC）。BC＝x（＝15）
  const P6 = tri(15, 10, 15); P6.D = lerp(P6.A, P6.B, 6 / 15); P6.E = lerp(P6.A, P6.C, 4 / 10);
  const fig6 = GEO({
    pts: P6, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], vl: VL, pad: 8,
    txt: [side(P6, 'A', 'D', '6', 4.2), side(P6, 'D', 'B', '9', 4.2), side(P6, 'A', 'E', '4', 4.2), side(P6, 'E', 'C', '6', 4.2), { p: lerp(P6.D, P6.E, 0.5), t: '6', dy: -3.4 }, { p: lerp(P6.B, P6.C, 0.5), t: 'x', dy: 5.6 }]
  });
  // （7）考えよう：実寸（mm）。AB＝50、AC＝40、BC＝40。D は AB 上で AD＝30。DE＝24（＝BC×30÷50）の点 E は、AC 上に 2 つある（AE＝24 と 13.5）
  const P7 = tri(50, 40, 40); P7.D = lerp(P7.A, P7.B, 30 / 50);
  const fig7 = GEO({ pts: P7, poly: 'ABC', dots: ['D'], vl: { A: ['A', 60], B: ['B', 225], C: ['C', 315], D: ['D', 180] }, scale: 1, pad: 8 });
  // （8）：AB＝9、AC＝12、BC＝15。D は AB 上で AD：DB＝1：2、E は AC 上で AE：EC＝1：2。P は BE と CD の交点
  const P8 = tri(9, 12, 15); P8.D = lerp(P8.A, P8.B, 1 / 3); P8.E = lerp(P8.A, P8.C, 1 / 3);
  { // 直線 BE と直線 CD の交点
    const b = P8.B, e = P8.E, c = P8.C, d = P8.D, r = [e[0] - b[0], e[1] - b[1]], s = [d[0] - c[0], d[1] - c[1]];
    const t = ((c[0] - b[0]) * s[1] - (c[1] - b[1]) * s[0]) / (r[0] * s[1] - r[1] * s[0]);
    P8.P = [b[0] + t * r[0], b[1] + t * r[1]];
  }
  const fig8 = GEO({
    pts: P8, poly: 'ABC', segs: ['DE', 'BE', 'CD'], dots: ['D', 'E', 'P'], pad: 7,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180], E: ['E', 0], P: ['P', 270, 3.6] }
  });

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), lp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], '
    + 'cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), pa=(P,Q,S,U)=>Math.abs(cr(P,Q,S,U))<1e-9*(1+dd(P,Q)*dd(S,U)), '
    + 'an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'tr=(ab,ac,bc)=>{const x=(ab*ab-ac*ac+bc*bc)/(2*bc);return {A:[x,Math.sqrt(ab*ab-x*x)],B:[0,0],C:[bc,0]};}, '
    + 'DE=(ab,ac,bc,p,q)=>{const P=tr(ab,ac,bc);return {A:P.A,B:P.B,C:P.C,D:lp(P.A,P.B,p),E:lp(P.A,P.C,q)};};';   // DE(AB, AC, BC, AD÷AB, AE÷AC)：辺 AB 上の D、辺 AC 上の E をとった図
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  /* ---------------- 答えの文 ---------------- */
  // 今日の問い（ワークシート ①）：先生の板書の例
  const A_W = '（例）（仮定）AD＝4、DB＝6、AE＝6、EC＝9　（結論）DE∥BC\n（証明）△ADE と △ABC において\nAD：AB＝4：10＝2：5、AE：AC＝6：15＝2：5\nだから　AD：AB＝AE：AC …①\n共通な角だから　∠DAE＝∠BAC …②\n①、②より、2組の辺の比とその間の角が、それぞれ等しいから\n△ADE∽△ABC　　よって　∠ADE＝∠ABC\n同位角が等しいから　DE∥BC';

  IK.lesson('souji-09', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第9時', title: '線分の比が等しければ、平行といえるだろうか',
    summary: '三角形と比の定理の逆。AD：DB＝AE：EC（または AD：AB＝AE：AC）のとき DE∥BC といえるかを、相似（2組の辺の比とその間の角）と同位角を使って証明し、比を比べて平行かどうかを判断する。',
    head: '相似な図形　第9時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：AB＝10、AC＝15、BC＝18。AD＝4、DB＝6、AE＝6、EC＝9（座標から）。AD：DB＝AE：EC＝2：3、AD：AB＝AE：AC＝2：5、∠DAE＝∠BAC（共通）、DE∥BC（外積 0）、同位角 ∠ADE＝∠ABC
      chk(`const ${pj(PW)}; return near(dd(A,B),10) && near(dd(A,C),15) && near(dd(B,C),18) && near(dd(A,D),4) && near(dd(D,B),6) && near(dd(A,E),6) && near(dd(E,C),9) && near(dd(A,D)/dd(D,B),dd(A,E)/dd(E,C)) && near(dd(A,D)/dd(A,B),dd(A,E)/dd(A,C)) && near(dd(A,D)/dd(A,B),2/5) && near(an(A,D,E),an(A,B,C)) && pa(D,E,B,C) && near(an(D,A,E),an(B,A,C)) && near(an(E,A,D),an(C,A,B)) && near(dd(D,E),dd(B,C)*2/5);`),
      // 例題の表（DE∥BC といえるか）：ア 3：6＝4：8（○）、イ 4：3 と 6：4＝3：2（×）、ウ 6：9＝4：6（○）。AB＝AD+DB、AC＝AE+EC で図をつくり、外積で確かめる（辺 AB＝9・7・15、AC＝12・10・10）
      chk(`const T1=[[3,6,4,8],[4,3,6,4],[6,9,4,6]], R=T1.map(([ad,db,ae,ec])=>{const Q=DE(ad+db,ae+ec,Math.max(ad+db,ae+ec)+1,ad/(ad+db),ae/(ae+ec));return pa(Q.D,Q.E,Q.B,Q.C);}); return R.join()==='true,false,true' && near(3/6,4/8) && near(6/9,4/6) && !near(4/3,6/4);`),
      // （1）AD＝6、DB＝8、AE＝9、EC＝12 → 6：8＝9：12（＝3：4）で平行　（2）AD＝3、AB＝9、AE＝4、AC＝10 → 3：9＝1：3、4：10＝2：5 で平行でない
      chk(`const Q1=DE(14,21,17,6/14,9/21), Q2=DE(9,10,8,3/9,4/10); return pa(Q1.D,Q1.E,Q1.B,Q1.C) && !pa(Q2.D,Q2.E,Q2.B,Q2.C) && near(6/8,9/12) && !near(3/9,4/10);`),
      // （3）AD＝3、DB＝5、AE＝6、EC＝x で DE∥BC：x＝10（AC＝16 の図で平行。x＝9、11 では平行でない）　（4）AB＝12、AD＝x、AE＝10、AC＝15：x＝8（AD÷AB＝AE÷AC＝2÷3）
      chk(`const ok=x=>{const Q=DE(8,6+x,12,3/8,6/(6+x));return pa(Q.D,Q.E,Q.B,Q.C);}; const ok4=x=>{const Q=DE(12,15,10,x/12,10/15);return pa(Q.D,Q.E,Q.B,Q.C);}; return ok(10) && !ok(9) && !ok(11) && ok4(8) && !ok4(7) && !ok4(9) && near(dd([0,0],[8,0])*6/(3+5),6) && near(12*10/15,8);`),
      // （5）図1：AB＝12（AD＝4、DB＝8）、BC＝15（BE＝10、EC＝5）、CA＝14（CF＝6、FA＝8）。DE∥AC だけが平行（EF∥AB・FD∥BC は平行でない）。座標から長さも確かめる
      chk(`const ${pj(P5)}; return near(dd(A,D),4) && near(dd(D,B),8) && near(dd(B,E),10) && near(dd(E,C),5) && near(dd(C,F),6) && near(dd(F,A),8) && pa(D,E,A,C) && !pa(E,F,A,B) && !pa(F,D,B,C) && near(dd(B,D)/dd(B,A),dd(B,E)/dd(B,C)) && near(8/12,10/15) && !near(5/15,6/14) && !near(8/14,4/12);`),
      // （6）図2：AB＝15、AC＝10、BC＝15。AD＝6、DB＝9、AE＝4、EC＝6 → 6：9＝4：6＝2：3 で DE∥BC。DE＝6（座標でも 6）、DE：BC＝AD：AB＝6：15 → BC＝x＝15
      chk(`const ${pj(P6)}; return near(dd(A,D),6) && near(dd(D,B),9) && near(dd(A,E),4) && near(dd(E,C),6) && pa(D,E,B,C) && near(dd(D,E),6) && near(dd(B,C),15) && near(6/9,4/6) && near(6*15/6,15) && near(dd(D,E)/dd(B,C),dd(A,D)/dd(A,B));`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：実寸 AB＝50、BC＝40、AD＝30 → DE＝24。D を中心に半径 24 の円は、辺 AC と 2点で交わる（AE＝24 と 13.5）。1つは DE∥BC、もう1つは平行でない
      chk(`const ${pj(P7)}; const u=[(C[0]-A[0])/dd(A,C),(C[1]-A[1])/dd(A,C)], w=[D[0]-A[0],D[1]-A[1]], pr=w[0]*u[0]+w[1]*u[1], h2=24*24-(dd(A,D)*dd(A,D)-pr*pr), s=Math.sqrt(h2), ts=[pr-s,pr+s].sort((a,b)=>a-b), Es=ts.map(t=>[A[0]+u[0]*t,A[1]+u[1]*t]); return near(dd(A,B),50) && near(dd(B,C),40) && near(dd(A,D),30) && near(dd(B,C)*30/50,24) && near(ts[0],13.5) && near(ts[1],24) && Es.every(E=>near(dd(D,E),24) && ts[0]>0 && ts[1]<dd(A,C)) && pa(D,Es[1],B,C) && !pa(D,Es[0],B,C);`),
      // （8）図：AB＝9、AC＝12、BC＝15（AD：DB＝AE：EC＝1：2）。DE∥BC（外積 0）、DE＝BC÷3＝5。P＝BE∩CD：錯角 ∠PDE＝∠PCB、∠PED＝∠PBC で △PDE∽△PCB。PE：PB＝DE：BC＝1：3
      chk(`const ${pj(P8)}; return near(dd(A,D)/dd(D,B),1/2) && near(dd(A,E)/dd(E,C),1/2) && pa(D,E,B,C) && near(dd(D,E),5) && near(15/3,5) && near(an(D,P,E),an(C,P,B)) && near(an(E,P,D),an(B,P,C)) && near(an(P,D,E),an(P,C,B)) && near(dd(P,E)/dd(P,B),1/3) && near(dd(P,D)/dd(P,C),1/3) && near(dd(D,E)/dd(B,C),1/3);`),
      // 小テスト（1）ア 2：3＝4：6（○）、イ AD：AB＝6：8＝9：12（○）、ウ 5：4 と 6：5（×）　（2）AD＝6、DB＝x、AE＝8、EC＝12：6：x＝8：12 → x＝9
      chk(`const a=DE(5,10,6,2/5,4/10), b=DE(8,12,7,6/8,9/12), c=DE(9,11,8,5/9,6/11), e=DE(15,20,9,6/15,8/20); return pa(a.D,a.E,a.B,a.C) && pa(b.D,b.E,b.B,b.C) && !pa(c.D,c.E,c.B,c.C) && pa(e.D,e.E,e.B,e.C) && near(dd(e.D,e.B),9);`),
      // 小テスト チャレンジ（4）：AD＝3、DB＝2、AE＝6、EC＝4 → DE∥BC。∠ADE＝65°、∠C＝48° なら ∠B＝65°（同位角）、∠A＝180−65−48＝67°。座標で三角形（∠B＝65°、∠C＝48°）をつくって確かめる
      chk(`const rd=Math.PI/180, bc=10, ab=bc*Math.sin(48*rd)/Math.sin(67*rd), A=[ab*Math.cos(65*rd),ab*Math.sin(65*rd)], B=[0,0], C=[bc,0], D=lp(A,B,3/5), E=lp(A,C,6/10); return pa(D,E,B,C) && near(an(D,A,E),an(B,A,C)) && near(an(D,A,E),65) && near(an(A,B,C),67) && near(an(C,A,B),48) && near(180-65-48,67) && near(dd(A,D)/dd(D,B),dd(A,E)/dd(E,C));`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('線分の比が等しいとき、平行といえるか調べよう'),
      K('今日の問い', '△ABC の辺 AB、AC 上に点 D、E をとったら、AD：DB＝AE：EC になった。DE∥BC といえるだろうか。わけも考えよう。', 2),
      F(5, figW),
      T('①', '自分の考え（3分）　いえるかどうかと、わけを書こう。', 1),
      B(8, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう考え方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('仮定と結論を入れかえたものを{{逆}}という。\nAD：AB＝AE：AC ならば　DE{{∥}}BC\nAD：{{DB}}＝AE：EC ならば　DE∥BC\n平行は、{{同位角}}が等しいことからいえる。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'D、E は △ABC の辺 AB、AC 上の点である。長さが表のとき、DE∥BC といえるものに ○、いえないものに × を書こう。（アは見本）', 2),
      TB('', ['ア', 'イ', 'ウ'], [
        ['AD、DB（cm）', ['3、6', '4、3', '6、9']],
        ['AE、EC（cm）', ['4、8', '6、4', '4、6']],
        ['DE∥BC といえるか', ['○', '{{×}}', '{{○}}']]
      ], { hw: 42 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。D、E は △ABC の辺 AB、AC 上の点。'),
      WD('① 仮定と結論を入れかえたものを、もとのことがらの{{逆}}という。\n② AD：AB＝AE：AC ならば、DE{{∥}}BC である。\n③ AD：{{DB}}＝AE：EC のときも、DE∥BC である。\n④ 2組の辺の比と{{その間の角}}が等しい三角形は、相似である。', 4, { label: 'ことば' }),
      F(6, cap(fig5, '図1'), cap(fig6, '図2')),
      C2([
        T('（1）', 'AD＝6、DB＝8、AE＝9、EC＝12（cm）のとき、DE∥BC といえるか。', 2),
        B(2, '6：8＝3：4、9：12＝3：4\n等しいから、いえる')
      ], [
        T('（2）', 'AD＝3、AB＝9、AE＝4、AC＝10（cm）のとき、DE∥BC といえるか。', 2),
        B(2, '3：9＝1：3、4：10＝2：5\n等しくないから、いえない')
      ], '1:1'),
      MA('【説明】平行といえるわけを、「相似」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '比を使って、平行かどうかを調べよう。（長さの単位は cm）'),
      C2([
        T('（3）', 'AD＝3、DB＝5、AE＝6、EC＝x で、DE∥BC になるとき、x の値を求めよう。', 3),
        B(2, '3：5＝6：x\n3x＝30　x＝10')
      ], [
        T('（4）', 'AB＝12、AD＝x、AE＝10、AC＝15 で、DE∥BC になるとき、x の値を求めよう。', 3),
        B(2, 'x：12＝10：15\n15x＝120　x＝8')
      ], '1:1'),
      C2([
        T('（5）', '図1で、DE、EF、FD のうち、△ABC の辺に平行なものを答えよう。', 2),
        B(4, 'DE … 8：12＝10：15\n　→ DE∥AC\nEF、FD … 比が等しく\nない（平行でない）')
      ], [
        T('（6）', '図2で、DE∥BC であることを確かめて、x の値を求めよう。', 2),
        B(4, '6：9＝4：6 だから DE∥BC\nDE：BC＝AD：AB\n6：x＝6：15　x＝15')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：辺の比が等しければ、平行といえるだろうか。'),
      T('（7）', '△ABC で、AB＝50mm、BC＝40mm（図は実寸）である。辺 AB 上に AD＝30mm となる点 D をとり、辺 AC 上に AD：AB＝DE：BC となる点 E をとる。コンパスで E をさがし、DE∥BC になるか調べよう。', 3),
      C2([
        F(7, fig7)
      ], [
        T('', '調べてわかったこと', 1),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC の辺 AB、AC 上に点 D、E があり、AD：DB＝AE：EC＝1：2 である。BE と CD の交点を P とする。\n① △PDE∽△PCB を証明しよう。\n② BC＝15cm のとき、DE の長さと、PE：PB を求めよう。', 7)
      ], [
        F(7, fig8)
      ], '3:2'),
      B(8, '（仮定）AD：DB＝AE：EC＝1：2　（結論）△PDE∽△PCB\n（証明）AD：AB＝AE：AC＝1：3 だから、定理の逆より　DE∥BC\n△PDE と △PCB において\nDE∥BC より、錯角は等しいから\n∠PDE＝∠PCB …①　　∠PED＝∠PBC …②\n①、②より、2組の角が、それぞれ等しいから　△PDE∽△PCB\n② DE：BC＝AD：AB＝1：3 だから　DE＝15×[[1/3]]＝5（cm）\n　 PE：PB＝DE：CB＝1：3'),
      MA('① AD：DB と AE：EC を比べると、DE と BC の関係がわかるよ。\n② 平行線があると、等しい角が見つかる（錯角）。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '△ABC の辺 AB、AC 上に点 D、E がある。次のうち、DE∥BC といえるものを、すべて選ぼう。（4点）\nア AD＝2、DB＝3、AE＝4、EC＝6　　イ AD＝6、AB＝8、AE＝9、AC＝12\nウ AD＝5、DB＝4、AE＝6、EC＝5', 4),
      B(3, 'ア、イ\nア 2：3＝4：6　イ 6：8＝9：12\nウ 5：4 と 6：5 は等しくない'),
      T('（2）', 'AD＝6cm、DB＝x cm、AE＝8cm、EC＝12cm で、DE∥BC のとき、x の値を求めよう。（3点）', 2),
      B(2, '6：x＝8：12　8x＝72\nx＝9'),
      T('（3）', 'AD：AB＝AE：AC ならば DE∥BC であることを証明するとき、△ADE∽△ABC を示す。使う相似条件を答えよう。（3点）', 2),
      B(2, '2組の辺の比とその間の角が、それぞれ等しい\n（間の角は ∠A で、共通）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '△ABC の辺 AB、AC 上に点 D、E があり、AD＝3cm、DB＝2cm、AE＝6cm、EC＝4cm である。∠ADE＝65°、∠C＝48° のとき、∠A の大きさを求めよう。', 3),
      B(4, '3：2＝6：4 だから　DE∥BC\n同位角が等しいから　∠B＝∠ADE＝65°\n∠A＝180°−65°−48°＝67°')
    ]
  });
})();
