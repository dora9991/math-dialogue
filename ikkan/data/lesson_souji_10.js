/* 相似な図形 第10時：2辺の中点を結ぶと、どんなことがいえるだろうか（中点連結定理）。
   元：授業ナビ標準版 souji-10（探）。課題（△ABC の 2辺 AB・AC の中点 M・N。MN と BC の位置と長さの関係を予想して証明）を「今日の問い」に、
   例題1（BC・∠ABC から MN・∠AMN）を「例題」（表）に、「四角形の 4辺の中点を順に結ぶと、どんな四角形か」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（図は実寸。BC＝8cm。MN と BC の位置・長さの関係を予想し、わけを考える）。個人3分 → ペア3分 → ことば（中点連結定理）→ 例題（表）。
     先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形で、三角形と比の定理の逆（第9時）と、三角形と比の定理（第7時）を使う証明を書いた。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（MN・∠AMN、3辺の中点を結ぶ三角形の周、方程式、角、MN∥BC から N は AC の中点）／
     裏＝ひろげる（考えよう・答えなし：四角形の中点を結ぶ）・チャレンジ★★（BN と CM の交点 G から △GMN∽△GCB。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、座標（頂点を座標で決め、中点・長さ・平行・角を計算）から出しなおした。
     「四角形の中点を結んでできる四角形」は（7）の答えにかかわるので、ワークシート・演習プリント（1）〜（6）・答えには書かない（第11時の今日の問いになる）。
   検算：node tools/verify.cjs souji-10　／　見た目：node tools/check.cjs <出力先> souji-10 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const cen = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 辺 a-b の、a から pos（0〜1）の位置の外がわ（図形の中心から遠ざかる向き）に、字 t を置く
  const sideAt = (P, a, b, t, pos, k) => { const m = lerp(P[a], P[b], pos), c = cen(P); const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1; return { p: m, t, dx: (k || 5) * vx / L, dy: -(k || 5) * vy / L }; };
  // 三角形：B が左下、C が右下（BC＝bc）。AB＝ab、AC＝ac
  const tri = (ab, ac, bc) => { const x = (ab * ab - ac * ac + bc * bc) / (2 * bc); return { A: [x, Math.sqrt(ab * ab - x * x)], B: [0, 0], C: [bc, 0] }; };
  const mid = (P, Q) => lerp(P, Q, 0.5);
  const midTick = [['A', 'M', 1], ['M', 'B', 1], ['A', 'N', 2], ['N', 'C', 2]];
  const VM = { A: ['A', 90], B: ['B', 225], C: ['C', 315], M: ['M', 180], N: ['N', 0] };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：BC＝8cm、A(3, 2.6)。M、N は AB、AC の中点。図は実寸（1cm＝10mm）。MN＝4cm、MN∥BC
  const PW = { A: [3, 2.6], B: [0, 0], C: [8, 0] }; PW.M = mid(PW.A, PW.B); PW.N = mid(PW.A, PW.C);
  const figW = GEO({ pts: PW, poly: 'ABC', segs: ['MN'], dots: ['M', 'N'], tick: midTick, vl: VM, scale: 10, pad: 6, txt: [{ p: [4, 0], t: 'BC＝8cm', dy: 5.6 }] });
  // 演習プリント 図1：△ABC（A(3, 6)・B(0, 0)・C(9, 0)）。M、N は AB、AC の中点（形は、長さの数値を書かない）
  const P1 = { A: [3, 6], B: [0, 0], C: [9, 0] }; P1.M = mid(P1.A, P1.B); P1.N = mid(P1.A, P1.C);
  const fig1 = GEO({ pts: P1, poly: 'ABC', segs: ['MN'], dots: ['M', 'N'], tick: midTick, vl: VM, pad: 8 });
  // 図2（3）：AB＝14、BC＝16、CA＝12。D、E、F は AB、BC、CA の中点。DE＝6、EF＝7、FD＝8
  const P3 = tri(14, 12, 16); P3.D = mid(P3.A, P3.B); P3.E = mid(P3.B, P3.C); P3.F = mid(P3.C, P3.A);
  const fig3 = GEO({
    pts: P3, poly: 'ABC', segs: ['DE', 'EF', 'FD'], dots: ['D', 'E', 'F'], pad: 8,
    tick: [['A', 'D', 1], ['D', 'B', 1], ['B', 'E', 2], ['E', 'C', 2], ['C', 'F', 3], ['F', 'A', 3]],
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180], E: ['E', 270], F: ['F', 0] },
    txt: [sideAt(P3, 'A', 'B', '14cm', 0.22, 6), sideAt(P3, 'B', 'C', '16cm', 0.2, 4.4), sideAt(P3, 'C', 'A', '12cm', 0.22, 6)]
  });
  // 図3（6）：AB＝16、AC＝18、BC＝15。M は AB の中点。M を通り BC に平行な直線が AC と交わる点が N（AC の中点になる）
  const P6 = tri(16, 18, 15); P6.M = mid(P6.A, P6.B); P6.N = lerp(P6.A, P6.C, (P6.M[1] - P6.A[1]) / (P6.C[1] - P6.A[1]));
  const fig6 = GEO({
    pts: P6, poly: 'ABC', segs: ['MN'], dots: ['M', 'N'], tick: [['A', 'M', 1], ['M', 'B', 1]], par: [['M', 'N', 1, 0.5], ['B', 'C', 1]], vl: VM, pad: 8
  });
  // （7）考えよう：四角形 ABCD（ア：ふつうの四角形、イ：へこんだ四角形）と、各辺の中点 P、Q、R、S（結ぶ線はかかない）
  const QA = { A: [0.4, 3.3], B: [0, 0], C: [4.6, 0.9], D: [3.2, 2.7] };
  const QI = { A: [0, 3.4], B: [1.2, 0], C: [4.4, 2.2], D: [1.8, 1.6] };
  const withMid = Q => Object.assign({}, Q, { P: mid(Q.A, Q.B), Q: mid(Q.B, Q.C), R: mid(Q.C, Q.D), S: mid(Q.D, Q.A) });
  const PQA = withMid(QA), PQI = withMid(QI);
  const quadFig = (Q, vl) => GEO({ pts: Q, poly: 'ABCD', dots: ['P', 'Q', 'R', 'S'], pad: 6, size: 2.8, vl: Object.assign({ A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], P: ['P', 180, 3], Q: ['Q', 270, 3], R: ['R', 0, 3], S: ['S', 90, 3] }, vl) });
  const figA = quadFig(PQA), figI = quadFig(PQI, { R: ['R', 90, 3], D: ['D', 270, 3] });
  // （8）：BC＝18、A(6, 18)。M、N は AB、AC の中点。BN＝15、G は BN と CM の交点（重心：A+B+C の 3分の1）
  const P8 = { A: [6, 18], B: [0, 0], C: [18, 0] }; P8.M = mid(P8.A, P8.B); P8.N = mid(P8.A, P8.C); P8.G = [(P8.A[0] + P8.B[0] + P8.C[0]) / 3, (P8.A[1] + P8.B[1] + P8.C[1]) / 3];
  const fig8 = GEO({
    pts: P8, poly: 'ABC', segs: ['MN', 'BN', 'CM'], dots: ['M', 'N', 'G'], tick: midTick, pad: 7,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], M: ['M', 180], N: ['N', 0], G: ['G', 270, 3.6] }
  });
  // 小テスト（1）の図：△ABC（A(2.6, 5)・B(0, 0)・C(7, 0)）、M、N は AB、AC の中点
  const PQ = { A: [2.6, 5], B: [0, 0], C: [7, 0] }; PQ.M = mid(PQ.A, PQ.B); PQ.N = mid(PQ.A, PQ.C);
  const figQ = GEO({ pts: PQ, poly: 'ABC', segs: ['MN'], dots: ['M', 'N'], tick: midTick, vl: VM, pad: 7 });

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), lp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], mid=(P,Q)=>lp(P,Q,0.5), '
    + 'cr=(P,Q,S,U)=>(Q[0]-P[0])*(U[1]-S[1])-(Q[1]-P[1])*(U[0]-S[0]), pa=(P,Q,S,U)=>Math.abs(cr(P,Q,S,U))<1e-9*(1+dd(P,Q)*dd(S,U)), '
    + 'an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'tr=(ab,ac,bc)=>{const x=(ab*ab-ac*ac+bc*bc)/(2*bc);return {A:[x,Math.sqrt(ab*ab-x*x)],B:[0,0],C:[bc,0]};}, '
    + 'ba=(bc,bd,ab)=>{const r=bd*Math.PI/180;return {A:[ab*Math.cos(r),ab*Math.sin(r)],B:[0,0],C:[bc,0]};};';   // ba(BC, ∠B（度）, AB)：BC と ∠B と AB から三角形をつくる
  const chk = body => `(() => { ${LIB} ${body} })()`;
  const pj = P => Object.keys(P).map(k => `${k}=${J(P[k])}`).join(',');

  /* ---------------- 答えの文 ---------------- */
  // 今日の問い（ワークシート ①）：先生の板書の例
  const A_W = '（例）（予想）MN∥BC　かつ　MN＝[[1/2]]BC\n（仮定）AM＝MB、AN＝NC\n（証明）AM：AB＝AN：AC＝1：2 だから、\n三角形と比の定理の逆より　MN∥BC\nMN∥BC だから、三角形と比の定理より\nMN：BC＝AM：AB＝1：2\nよって　MN＝[[1/2]]BC';

  IK.lesson('souji-10', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第10時', title: '2辺の中点を結ぶと、どんなことがいえるだろうか',
    summary: '△ABC の 2辺 AB、AC の中点 M、N を結ぶ線分 MN と、残りの辺 BC の関係（平行で、長さは半分）を予想し、三角形と比の定理とその逆を使って証明して、中点連結定理をとらえる。長さ・角・周の長さを求める。',
    head: '相似な図形　第10時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：BC＝8、A(3, 2.6)。M、N は AB、AC の中点（AM＝MB、AN＝NC）。AM：AB＝AN：AC＝1：2、MN∥BC（外積 0）、MN＝BC÷2＝4、∠AMN＝∠ABC
      chk(`const ${pj(PW)}; return near(dd(B,C),8) && near(dd(A,M),dd(M,B)) && near(dd(A,N),dd(N,C)) && near(dd(A,M)/dd(A,B),1/2) && near(dd(A,N)/dd(A,C),1/2) && pa(M,N,B,C) && near(dd(M,N),4) && near(dd(M,N),dd(B,C)/2) && near(an(M,A,N),an(B,A,C));`),
      // 例題の表：ア BC＝12・∠ABC＝50°、イ BC＝14・∠ABC＝65°、ウ BC＝9・∠ABC＝72°（AB は 6 にして三角形をつくる）。MN＝6・7・4.5、∠AMN＝50°・65°・72°
      chk(`const R=[[12,50],[14,65],[9,72]].map(([bc,bd])=>{const P=ba(bc,bd,6), Mp=mid(P.A,P.B), Np=mid(P.A,P.C); return [dd(Mp,Np), an(Mp,P.A,Np), an(P.B,P.A,P.C), pa(Mp,Np,P.B,P.C)];}); return near(R[0][0],6) && near(R[1][0],7) && near(R[2][0],4.5) && R.every(r=>near(r[1],r[2]) && r[3]) && near(R[0][2],50) && near(R[1][2],65) && near(R[2][2],72);`),
      // （1）BC＝14 → MN＝7　（2）∠ABC＝70° → ∠AMN＝70°（同位角）
      chk(`const P=ba(14,70,8), Mp=mid(P.A,P.B), Np=mid(P.A,P.C); return near(dd(Mp,Np),7) && near(an(Mp,P.A,Np),70) && near(an(P.B,P.A,P.C),70) && pa(Mp,Np,P.B,P.C);`),
      // （3）図2：AB＝14、BC＝16、CA＝12。D、E、F は各辺の中点。DE＝CA÷2＝6、EF＝AB÷2＝7、FD＝BC÷2＝8 → 周 21
      chk(`const ${pj(P3)}; return near(dd(A,B),14) && near(dd(B,C),16) && near(dd(C,A),12) && near(dd(D,E),6) && near(dd(E,F),7) && near(dd(F,D),8) && near(dd(D,E)+dd(E,F)+dd(F,D),21) && near((14+16+12)/2,21) && pa(D,E,A,C) && pa(E,F,A,B) && pa(F,D,B,C);`),
      // （4）MN＝2x+1、BC＝5x−4、BC＝2MN：x を 0.5 きざみで探す → 6 だけ（MN＝13、BC＝26。座標でも MN＝BC÷2）
      `Array.from({ length: 200 }, (_, i) => (i + 1) / 2).filter(x => Math.abs((5 * x - 4) - 2 * (2 * x + 1)) < 1e-9).join() === "6" && near(2 * 6 + 1, 13) && near(5 * 6 - 4, 26)`,
      // （5）∠A＝72°、∠AMN＝58°：∠B＝58°（同位角）、∠C＝180−72−58＝50°。座標で ∠B＝58°、∠A＝72° の三角形をつくって、∠ANM＝∠C＝50° を確かめる
      chk(`const rd=Math.PI/180, bc=10, ab=bc*Math.sin(50*rd)/Math.sin(72*rd), P=ba(bc,58,ab), Mp=mid(P.A,P.B), Np=mid(P.A,P.C); return near(an(P.A,P.B,P.C),72) && near(an(Mp,P.A,Np),58) && near(an(P.C,P.A,P.B),50) && near(an(Np,P.A,Mp),50) && near(180-72-58,50);`),
      // （6）図3：AB＝16、AC＝18、BC＝15。M は AB の中点。M を通り BC に平行な直線が AC と交わる点 N は AC の中点（AN＝9）、MN＝BC÷2＝7.5
      chk(`const ${pj(P6)}; return near(dd(A,B),16) && near(dd(A,C),18) && near(dd(B,C),15) && near(dd(A,M),dd(M,B)) && pa(M,N,B,C) && near(dd(A,N),9) && near(dd(N,C),9) && near(dd(M,N),7.5) && near(M[1],N[1]);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：四角形 ABCD の 4辺の中点 P、Q、R、S を結ぶと平行四辺形（PQ∥SR・PQ＝SR・QR∥PS・QR＝PS）。ア（ふつう）・イ（へこんだ）、ほかの四角形でも
      chk(`const ok=Q=>{const P=mid(Q.A,Q.B), Qp=mid(Q.B,Q.C), R=mid(Q.C,Q.D), S=mid(Q.D,Q.A); return pa(P,Qp,S,R) && near(dd(P,Qp),dd(S,R)) && pa(Qp,R,P,S) && near(dd(Qp,R),dd(P,S)) && near(dd(P,Qp),dd(Q.A,Q.C)/2) && near(dd(P,S),dd(Q.B,Q.D)/2);}; const QA=${J(QA)}, QI=${J(QI)}; return ok(QA) && ok(QI) && ok({A:[0,0],B:[5,1],C:[6,5],D:[1,3]}) && ok({A:[0,0],B:[4,0],C:[4,3],D:[0,3]});`),
      // （8）図：BC＝18、A(6, 18)、BN＝15（N＝AC の中点）。G＝BN∩CM。MN＝BC÷2＝9、MN∥BC。錯角 ∠GMN＝∠GCB、∠GNM＝∠GBC、△GMN∽△GCB（相似比 1：2）。GN＝BN÷3＝5
      chk(`const ${pj(P8)}; return near(dd(B,C),18) && near(dd(B,N),15) && near(dd(M,N),9) && pa(M,N,B,C) && near(an(M,G,N),an(C,G,B)) && near(an(N,G,M),an(B,G,C)) && near(an(G,M,N),an(G,C,B)) && near(an(G,N,M),an(G,B,C)) && near(dd(G,N)/dd(G,B),1/2) && near(dd(G,M)/dd(G,C),1/2) && near(dd(G,N),5) && near(15/3,5) && near(dd(B,G)+dd(G,N),dd(B,N));`),
      // 小テスト（1）ア BC＝18 → MN＝9、イ MN＝6.5 → BC＝13、ウ ∠B＝64° → ∠AMN＝64°
      chk(`const P=ba(18,64,7), Mp=mid(P.A,P.B), Np=mid(P.A,P.C), Q=ba(13,50,7); return near(dd(Mp,Np),9) && near(dd(mid(Q.A,Q.B),mid(Q.A,Q.C)),6.5) && near(an(Mp,P.A,Np),64) && near(an(P.B,P.A,P.C),64);`),
      // 小テスト（2）3辺 6、10、14 の三角形：中点を結ぶ三角形の辺は 3、5、7 → 周 15。（3）M は AB の中点、MN∥BC：AC＝14 → AN＝7
      chk(`const P=tr(6,10,14), D=mid(P.A,P.B), E=mid(P.B,P.C), F=mid(P.C,P.A), Q=tr(9,14,12), Mq=mid(Q.A,Q.B), t=(Mq[1]-Q.A[1])/(Q.C[1]-Q.A[1]); return near(dd(D,E)+dd(E,F)+dd(F,D),15) && near(3+5+7,15) && near(t*dd(Q.A,Q.C),7);`),
      // 小テスト チャレンジ（4）：AB＝8、AC＝10、M・D・N は AB・BC・CA の中点。AM＝4、MD＝AC÷2＝5、DN＝AB÷2＝4、NA＝5 → 周 18（BC＝9、12、15 のどれでも 18）
      chk(`return [9,12,15].every(bc=>{const P=tr(8,10,bc), Mp=mid(P.A,P.B), D=mid(P.B,P.C), N=mid(P.A,P.C); return near(dd(P.A,Mp)+dd(Mp,D)+dd(D,N)+dd(N,P.A),18) && pa(Mp,D,P.A,N) && pa(D,N,P.A,Mp);}) && near(8/2+10/2+8/2+10/2,18)`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2辺の中点を結ぶ線分には、どんな性質があるか調べよう'),
      K('今日の問い', '△ABC の辺 AB、AC の中点を M、N とする。線分 MN と辺 BC には、位置と長さについて、どんな関係があるだろう。予想して、わけも考えよう。', 2),
      F(5, figW),
      T('①', '自分の考え（3分）　予想と、そのわけを書こう。', 1),
      B(7, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう考え方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('三角形の2辺の{{中点}}を結ぶ線分は、残りの辺に\n{{平行}}で、長さは、その{{半分}}である。\nこれを{{中点連結定理}}という。\n（M、N が中点 → MN∥BC、MN＝BC÷{{2}}）', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '△ABC で、M、N は辺 AB、AC の中点である。表の空欄をうめよう。（アは見本）', 1),
      TB('', ['ア', 'イ', 'ウ'], [
        ['BC の長さ（cm）', ['12', '{{14}}', '9']],
        ['MN の長さ（cm）', ['6', '7', '{{4.5}}']],
        ['∠ABC の大きさ', ['50°', '{{65°}}', '72°']],
        ['∠AMN の大きさ', ['50°', '65°', '{{72°}}']]
      ], { hw: 46 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。M、N は辺 AB、AC の中点。'),
      WD('① 三角形の2辺の{{中点}}を結ぶ線分は、残りの辺に{{平行}}である。\n② その線分の長さは、残りの辺の長さの{{半分}}である。\n③ これを{{中点連結定理}}という。\n④ MN∥BC は、三角形と比の定理の{{逆}}を使ってわかる。', 4, { label: 'ことば' }),
      F(6, cap(fig1, '図1'), cap(fig3, '図2'), cap(fig6, '図3')),
      C2([
        T('（1）', '図1で、BC＝14cm のとき、MN の長さを求めよう。', 2),
        B(2, 'MN＝[[1/2]]×14\n＝7（cm）')
      ], [
        T('（2）', '図1で、∠ABC＝70° のとき、∠AMN の大きさを求めよう。', 2),
        B(2, 'MN∥BC だから、\n同位角は等しく 70°')
      ], '1:1'),
      MA('【説明】MN∥BC になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '中点連結定理を使って、長さや角を求めよう。'),
      C2([
        T('（3）', '図2で、D、E、F は、△ABC の辺 AB、BC、CA の中点。△DEF の周の長さを求めよう。', 3),
        B(3, 'DE＝12÷2＝6、EF＝14÷2＝7\nFD＝16÷2＝8\n周は 6+7+8＝21（cm）')
      ], [
        T('（4）', '図1で、MN＝(2x+1)cm、BC＝(5x−4)cm のとき、x の値を求めよう。', 3),
        B(3, 'BC＝2MN だから\n5x−4＝2(2x+1)\nx＝6')
      ], '1:1'),
      C2([
        T('（5）', '図1で、∠A＝72°、∠AMN＝58° のとき、∠ACB の大きさを求めよう。', 3),
        B(3, '∠ABC＝∠AMN＝58°\n∠ACB＝180°−72°−58°\n＝50°')
      ], [
        T('（6）', '図3で、M は AB の中点、MN∥BC である。AC＝18cm、BC＝15cm のとき、AN、MN の長さを求めよう。', 3),
        B(3, 'N は AC の中点だから\nAN＝18÷2＝9（cm）\nMN＝15÷2＝7.5（cm）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：四角形の辺の中点を結ぶと、どうなるだろう。'),
      T('（7）', '四角形 ABCD の辺 AB、BC、CD、DA の中点を P、Q、R、S とする。P、Q、R、S を順に結んでできる四角形は、どんな四角形だろう。図ア・イにかいて、調べよう。', 3),
      C2([
        F(6, cap(figA, 'ア'), cap(figI, 'イ'))
      ], [
        T('', '調べてわかったこと', 1),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC の辺 AB、AC の中点を M、N とし、BN と CM の交点を G とする。\n① △GMN∽△GCB を証明しよう。\n② BC＝18cm、BN＝15cm のとき、MN と GN の長さを求めよう。', 7)
      ], [
        F(7, fig8)
      ], '3:2'),
      B(8, '（仮定）AM＝MB、AN＝NC　（結論）△GMN∽△GCB\n（証明）中点連結定理より　MN∥BC\n△GMN と △GCB において\nMN∥BC より、錯角は等しいから\n∠GMN＝∠GCB …①　　∠GNM＝∠GBC …②\n①、②より、2組の角が、それぞれ等しいから　△GMN∽△GCB\n② MN＝[[1/2]]BC＝9（cm）　　GN：GB＝MN：CB＝1：2\n　 GN＝15×[[1/3]]＝5（cm）'),
      MA('① MN と BC の関係から、等しい角（錯角）が見つかるよ。\n② 相似比がわかれば、BN を、その比に分けられるね。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図で、M、N は △ABC の辺 AB、AC の中点である。（4点）\nア BC＝18cm のとき、MN の長さ\nイ MN＝6.5cm のとき、BC の長さ　　ウ ∠B＝64° のとき、∠AMN の大きさ', 3),
      F(4, figQ),
      B(2, 'ア 9cm　　イ 13cm　　ウ 64°（同位角）'),
      T('（2）', '3辺の長さが 6cm、10cm、14cm の三角形がある。3辺の中点を結んでできる三角形の、周の長さを求めよう。（3点）', 2),
      B(2, '辺は 3cm、5cm、7cm\n周は 3+5+7＝15（cm）'),
      T('（3）', '△ABC の辺 AB の中点 M を通り、BC に平行な直線が、辺 AC と交わる点を N とする。AC＝14cm のとき、AN の長さを求めよう。（3点）', 2),
      B(2, 'N は AC の中点だから　AN＝14÷2＝7（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '△ABC の辺 AB、BC、CA の中点を、それぞれ M、D、N とする。AB＝8cm、AC＝10cm のとき、四角形 AMDN の周の長さを求めよう。', 3),
      B(4, 'MD＝[[1/2]]AC＝5、DN＝[[1/2]]AB＝4\nAM＝4、NA＝5\n周は 4+5+4+5＝18（cm）')
    ]
  });
})();
