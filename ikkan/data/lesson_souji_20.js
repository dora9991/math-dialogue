/* 相似な図形（新しい形） 第20時：「相似な図形」で学んだことを、整理して確かめよう（単元のまとめ。型：確）。
   元：授業ナビ標準版 souji-20（確）。確かめ1（相似比・辺）、確かめ2（DE∥BC と面積の比）、確かめ3（相似の証明）、確かめ4（体積の比）を、「例題」と演習プリントにした。
   ・今日の問い（単元で学んだことを使って考える問い）：「△ABC の辺 AB、AC の中点を D、E とする。四角形 DBCE の面積は、△ADE の面積の何倍か」。
     中点連結定理（DE∥BC、DE＝BC の半分）→ 相似（相似比 1：2）→ 面積の比（1：4）→ 3倍、と単元の中心を一本の問いでたどる。①②で、ちがう理由（相似・面積の比／高さと底辺）を出し合う。
   ・ワークシートは A4 1枚：個人3分 → ペア3分 → ことば（相似条件・三角形と比・面積の比）→ 例題（DE∥BC：x・y・面積の比の表）。
   ・演習プリントは表裏：表＝確かめる 2問（相似比と辺・平行線と線分の比）・使ってみる 4問（三角形と比・面積の比・体積の比・相似条件）／
     裏＝ひろげる（考えよう：三角形を n 等分したときの面積の比のきまり。答えなし）・チャレンジ★★（直角三角形の相似の証明と長さ。ヒントカードつき）。
   ・元の「長さ・面積・体積の比を相似比 m：n でまとめる」は、ことば（ワークシート・演習プリント）に入れた。
   ・数値・図は新しく作り、答えは checks で、座標（長さ・角・面積・平行）と、体積の公式から、別の式で出しなおした。
     証明は機械で検算できないので、証明の主張（角・比・平行）を座標で確かめたうえで、論理（根拠の順・使う相似条件）を書いたあとに読み直した。
   ・（7）の答え（3等分で 1：3：5、4等分で 1：3：5：7 …、奇数の列）は、ワークシート・演習プリント（（1）〜（6））・解答・小テストのどこにも書いていない。
   検算：node tools/verify.cjs souji-20　／　見た目：node tools/check.cjs <出力先> souji-20 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  // 図に、見出し（図1・図2）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const at = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const mid = (P, Q) => at(P, Q, 0.5);
  // 3辺の長さから、三角形の頂点 B(0,0)・C(a,0)・A を出す
  const tri3 = (a, b, c) => { const ax = (c * c - b * b + a * a) / (2 * a); return { B: [0, 0], C: [a, 0], A: [ax, Math.sqrt(c * c - ax * ax)] }; };
  const VL3 = { A: ['A', 90], B: ['B', 225], C: ['C', 315] };

  // ---- 今日の問い：△ABC、AB・AC の中点 D、E ----
  const T0 = { A: [1.8, 4], B: [0, 0], C: [6, 0] }; T0.D = mid(T0.A, T0.B); T0.E = mid(T0.A, T0.C);
  const todayFig = GEO({
    pts: T0, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], tick: [['A', 'D', 1], ['D', 'B', 1], ['A', 'E', 2], ['E', 'C', 2]], pad: 8,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180, 3], E: ['E', 0, 3] }
  });

  // ---- 例題：△ABC（AB＝12、AC＝15、BC＝18）。AD＝4、DB＝8、AE＝5、EC＝x、DE＝y ----
  const X0 = tri3(18, 15, 12); X0.D = at(X0.A, X0.B, 1 / 3); X0.E = at(X0.A, X0.C, 1 / 3);
  const exFig = GEO({
    pts: X0, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], par: [['D', 'E', 1, 0.5], ['B', 'C', 1, 0.5]], pad: 9,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180, 3], E: ['E', 0, 3] },
    txt: [
      { p: mid(X0.A, X0.D), t: '4cm', dx: -2.5, anchor: 'end' }, { p: mid(X0.D, X0.B), t: '8cm', dx: -2.5, anchor: 'end' },
      { p: mid(X0.A, X0.E), t: '5cm', dx: 2.5, anchor: 'start' }, { p: mid(X0.E, X0.C), t: 'x', dx: 2.5, anchor: 'start' },
      { p: mid(X0.D, X0.E), t: 'y', dy: -3.4 }, { p: mid(X0.B, X0.C), t: '18cm', dy: 5.5 }
    ]
  });

  // ---- 演習プリント 図1：ℓ∥m∥n と、2本の直線（AB＝6、BC＝8、EF＝12）。高さは 7：4：0（AB：BC＝3：4） ----
  const P1 = { A: [1, 7], C: [3, 0], D: [6, 7], F: [8, 0] }; P1.B = at(P1.A, P1.C, 3 / 7); P1.E = at(P1.D, P1.F, 3 / 7);
  const para = cap(SVG((W, H, h) => {
    const u = (H - 8) / 7, Yv = y => 4 + (7 - y) * u, Xv = x => 7 + x * 7.2, ln = (a, b, c, d, w) => h.ln(Xv(a), Yv(b), Xv(c), Yv(d), '#222', w || 0.32, ' stroke-linecap="round"');
    let s = '';
    [[7, 'ℓ'], [4, 'm'], [0, 'n']].forEach(([y, nm]) => { s += ln(-0.4, y, 9.4, y) + h.tx(Xv(9.4) + 3, Yv(y) + 1.1, nm, 3.2, 'start', ' class="pl"'); });
    [['A', 'C'], ['D', 'F']].forEach(([p, q]) => { const a = at(P1[p], P1[q], -0.09), b = at(P1[p], P1[q], 1.09); s += ln(a[0], a[1], b[0], b[1]); });
    Object.keys(P1).forEach(n => { s += `<circle cx="${h.f2(Xv(P1[n][0]))}" cy="${h.f2(Yv(P1[n][1]))}" r="0.7" fill="#222"/>`; });
    const lab = (n, dx, dy) => h.tx(Xv(P1[n][0]) + dx, Yv(P1[n][1]) + dy, n, 3.1, 'middle', ' class="pl"');
    s += lab('A', -3.2, -1.5) + lab('B', -3.4, 1.2) + lab('C', -3.2, 3.6) + lab('D', -3.2, -1.5) + lab('E', -3.4, 1.2) + lab('F', -3.2, 3.6);
    const side = (p, q, t) => { const m = mid(P1[p], P1[q]); return h.tx(Xv(m[0]) + 2.6, Yv(m[1]) + 1.1, t, 3, 'start'); };
    s += side('A', 'B', '6cm') + side('B', 'C', '8cm') + side('D', 'E', 'x') + side('E', 'F', '12cm');
    return s;
  }), '図1');

  // ---- 演習プリント 図2：△ABC（AB＝10、AC＝14、BC＝15）。DE∥BC、AD＝6、DB＝4、DE＝9 ----
  const Z0 = tri3(15, 14, 10); Z0.D = at(Z0.A, Z0.B, 0.6); Z0.E = at(Z0.A, Z0.C, 0.6);
  const fig2 = cap(GEO({
    pts: Z0, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], par: [['D', 'E', 1, 0.5], ['B', 'C', 1, 0.5]], pad: 8,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180, 3], E: ['E', 0, 3] },
    txt: [{ p: mid(Z0.A, Z0.D), t: '6cm', dx: -2.5, anchor: 'end' }, { p: mid(Z0.D, Z0.B), t: '4cm', dx: -2.5, anchor: 'end' }, { p: mid(Z0.D, Z0.E), t: '9cm', dy: -3.4 }]
  }), '図2');

  // ---- 演習プリント（7）：AB、AC を 3等分して、BC に平行な 2本の線をひく ----
  const S7 = { A: [2, 6], B: [0, 0], C: [6, 0] }; S7.D = at(S7.A, S7.B, 1 / 3); S7.E = at(S7.A, S7.C, 1 / 3); S7.F = at(S7.A, S7.B, 2 / 3); S7.G = at(S7.A, S7.C, 2 / 3);
  const fig7 = GEO({ pts: S7, poly: 'ABC', segs: ['DE', 'FG'], dots: ['D', 'E', 'F', 'G'], par: [['D', 'E', 1, 0.5], ['F', 'G', 1, 0.5], ['B', 'C', 1, 0.5]], pad: 8, vl: VL3 });

  // ---- チャレンジ（8）：∠C＝90°、AB＝15、AC＝12、BC＝9。AC 上に AD＝10、D から AB への垂線 DE（AE＝8、DE＝6） ----
  const R8 = { C: [0, 0], B: [9, 0], A: [0, 12], D: [0, 2], E: [4.8, 5.6] };
  const fig8 = GEO({
    pts: R8, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], pad: 8,
    ang: [{ at: 'C', a: 'A', b: 'B', right: true, r: 3.4 }, { at: 'E', a: 'D', b: 'A', right: true, r: 3 }],
    vl: { A: ['A', 90], B: ['B', 315], C: ['C', 225], D: ['D', 180, 3], E: ['E', 150, 3.2] },
    txt: [{ p: mid(R8.A, R8.D), t: '10cm', dx: -2.5, anchor: 'end' }, { p: mid(R8.C, R8.B), t: '9cm', dy: 5.5 }, { p: at(R8.A, R8.B, 0.75), t: '15cm', dx: 2.5, anchor: 'start' }]
  });

  // ---- 小テスト（1）（2）：△ABC（AB＝6、AC＝12、BC＝9）。DE∥BC、AD＝2、DB＝4、AE＝4、EC＝x、DE＝y ----
  const Q1 = tri3(9, 12, 6); Q1.D = at(Q1.A, Q1.B, 1 / 3); Q1.E = at(Q1.A, Q1.C, 1 / 3);
  const q1 = GEO({
    pts: Q1, poly: 'ABC', segs: ['DE'], dots: ['D', 'E'], par: [['D', 'E', 1, 0.5], ['B', 'C', 1, 0.5]], pad: 8,
    vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 180, 3], E: ['E', 0, 3] },
    txt: [
      { p: mid(Q1.A, Q1.D), t: '2cm', dx: -2.5, anchor: 'end' }, { p: mid(Q1.D, Q1.B), t: '4cm', dx: -2.5, anchor: 'end' },
      { p: mid(Q1.A, Q1.E), t: '4cm', dx: 2.5, anchor: 'start' }, { p: mid(Q1.E, Q1.C), t: 'x', dx: 2.5, anchor: 'start' },
      { p: mid(Q1.D, Q1.E), t: 'y', dy: -3.4 }, { p: mid(Q1.B, Q1.C), t: '9cm', dy: 5.5 }
    ]
  });

  /* 検算の道具（座標から、長さ・角・面積・平行を出す） */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), z=x=>Math.abs(x)<1e-9, '
    + 'ar=(P,Q,R)=>Math.abs(cr(v(P,Q),v(P,R)))/2, deg=(P,Q,R)=>Math.acos(dot(v(Q,P),v(Q,R))/(len(Q,P)*len(Q,R)))*180/PI, '
    + 'at=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t], mid=(P,Q)=>at(P,Q,0.5), '
    + 'tri=(a,b,c)=>{ const x=(c*c-b*b+a*a)/(2*a); return {B:[0,0],C:[a,0],A:[x,Math.sqrt(c*c-x*x)]}; }, '
    + 'cone=(r,h)=>r*r*h/3;';

  IK.lesson('souji-20', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第20時', title: '「相似な図形」で学んだことを、整理して確かめよう',
    summary: '中点を結んでできる三角形と四角形の面積の関係を、相似・中点連結定理・面積の比を使って説明する。相似条件・三角形と比・平行線と線分の比・面積の比と体積の比・相似の証明を、問題を解いて確かめる。',
    head: '相似な図形　第20時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：△ABC（A(1.8,4)・B(0,0)・C(6,0)）。D、E は AB、AC の中点：DE∥BC、DE＝BC÷2、△ADE∽△ABC（相似比 1：2）、面積 △ABC＝4×△ADE、四角形 DBCE＝△ABC−△ADE＝3×△ADE
      `(() => { ${LIB} const P=${J(T0)}; const Sq=P.B[0]*P.C[1]; const quad=(()=>{ const q=[P.D,P.B,P.C,P.E]; let s=0; for(let i=0;i<4;i++){ const a=q[i], b=q[(i+1)%4]; s+=a[0]*b[1]-a[1]*b[0]; } return Math.abs(s)/2; })(); return z(cr(v(P.D,P.E),v(P.B,P.C))) && near(len(P.D,P.E),len(P.B,P.C)/2) && near(ar(P.A,P.B,P.C),4*ar(P.A,P.D,P.E)) && near(quad,3*ar(P.A,P.D,P.E)) && near(quad,ar(P.A,P.B,P.C)-ar(P.A,P.D,P.E)) && near(deg(P.B,P.A,P.C),deg(P.D,P.A,P.E)); })()`,
      // 例題：△ABC（AB＝12、AC＝15、BC＝18）。D は AD＝4、E は AE＝5：DE∥BC、EC＝10、DE＝6、面積の比 △ADE：△ABC＝1：9
      `(() => { ${LIB} const P=tri(18,15,12), D=at(P.A,P.B,1/3), E=at(P.A,P.C,1/3); return near(len(P.A,P.B),12) && near(len(P.A,P.C),15) && near(len(P.A,D),4) && near(len(D,P.B),8) && near(len(P.A,E),5) && near(len(E,P.C),10) && z(cr(v(D,E),v(P.B,P.C))) && near(len(D,E),6) && near(ar(P.A,P.B,P.C)/ar(P.A,D,E),9); })()`,
      // （1）△ABC∽△DEF：AB＝6、BC＝10、CA＝7（任意）、DE＝9 → 相似比 2：3（1.5倍）、EF＝15
      `(() => { ${LIB} const A=[0,0], B=[6,0], k=9/6, S=p=>[p[0]*k,p[1]*k]; const C=tri(10,7,6); return near(k,1.5) && near(10*k,15) && near(6/9,2/3); })()`,
      // （2）図1：ℓ∥m∥n（高さ 7、4、0）。2本の直線で、A、B、C と D、E、F。AB＝6、BC＝8（AB：BC＝3：4）→ DE：EF＝3：4。EF＝12 → DE＝9
      `(() => { const P=${J(P1)}; const r=(p,q,s)=>(P[p][1]-P[q][1])/(P[q][1]-P[s][1]); return near(P.A[1]-P.B[1],3) && near(P.B[1]-P.C[1],4) && near(r('A','B','C'),3/4) && near(r('D','E','F'),3/4) && near(6/8,3/4) && near(12*3/4,9); })()`,
      // （3）図2：△ABC（AB＝10、AC＝14、BC＝15）。D は AD＝6、E は DE∥BC：DE＝0.6×BC＝9、AD：AB＝6：10＝9：15
      `(() => { ${LIB} const P=tri(15,14,10), D=at(P.A,P.B,0.6), E=at(P.A,P.C,0.6); return near(len(P.A,D),6) && near(len(D,P.B),4) && z(cr(v(D,E),v(P.B,P.C))) && near(len(D,E),9) && near(len(P.B,P.C),15) && near(6/10,9/15); })()`,
      // （4）AD：DB＝1：3、△ADE＝5：AB＝4×AD → 面積の比 1：16。△ABC＝80、四角形 DBCE＝75
      `(() => { ${LIB} const P=tri(12,9,8), D=at(P.A,P.B,1/4), E=at(P.A,P.C,1/4), k=5/ar(P.A,D,E); return z(cr(v(D,E),v(P.B,P.C))) && near(ar(P.A,P.B,P.C)*k,80) && near((ar(P.A,P.B,P.C)-ar(P.A,D,E))*k,75); })()`,
      // （5）相似な円錐 P（高さ 6）と Q（高さ 10）：P＝54π → 底面の半径 r＝√27（r²＝3×54/6）。Q は半径 √27×10/6、体積＝250π
      `(() => { ${LIB} const r=Math.sqrt(3*54/6), P=cone(r,6), Qv=cone(r*10/6,10); return near(P,54) && near(Qv,250) && near(Qv/P,(10/6)**3); })()`,
      // （6）△ABC（AB＝4、BC＝6、∠B＝50°）と △DEF（DE＝6、EF＝9、∠E＝50°）：余弦定理で CA、FD を出す → CA：FD＝2：3 で、3辺の比がすべて 2：3、3つの角も等しい（相似）
      `(() => { const t=50*PI/180, CA=Math.sqrt(16+36-2*4*6*Math.cos(t)), FD=Math.sqrt(36+81-2*6*9*Math.cos(t)); const ang=(a,b,c)=>Math.acos((b*b+c*c-a*a)/(2*b*c)); return near(4/6,6/9) && near(CA/FD,2/3) && near(ang(CA,4,6),ang(FD,6,9)) && near(ang(4,CA,6),ang(6,FD,9)); })()`,
      // （7）考えよう：AB、AC を n 等分して BC に平行な線をひく。頂点 A から k 番目までの三角形の面積は (k/n)^2 倍 → 部分の面積の比は 1：3：5：…：(2n−1)（座標から）。答えは紙面に載せない
      `(() => { ${LIB} const P={A:[2,6],B:[0,0],C:[6,0]}; return [3,4,5].every(n => { const S=k=>ar(P.A,at(P.A,P.B,k/n),at(P.A,P.C,k/n)), parts=Array.from({length:n},(_,i)=>S(i+1)-S(i)); return parts.every((p,i)=>near(p/parts[0],2*(i+1)-1)); }); })()`,
      // （8）直角三角形 C(0,0)・B(9,0)・A(0,12)。D(0,2)（AD＝10）、E(4.8,5.6)＝D から AB への垂線の足。DE⊥AB、AE＝8、DE＝6。△ABC∽△ADE（∠A 共通、∠C＝∠E＝90°）、AB：AD＝AC：AE＝15：10＝12：8
      `(() => { ${LIB} const P=${J(R8)}, foot=(Q,A,B)=>{ const u=v(A,B), t=dot(v(A,Q),u)/dot(u,u); return [A[0]+t*u[0],A[1]+t*u[1]]; }, E=foot(P.D,P.A,P.B); return near(len(P.A,P.B),15) && near(len(P.A,P.C),12) && near(len(P.B,P.C),9) && near(len(P.A,P.D),10) && near(E[0],P.E[0]) && near(E[1],P.E[1]) && z(dot(v(P.D,P.E),v(P.A,P.B))) && near(len(P.A,P.E),8) && near(len(P.D,P.E),6) && near(deg(P.B,P.A,P.C),deg(P.D,P.A,P.E)) && near(deg(P.A,P.C,P.B),90) && near(deg(P.A,P.E,P.D),90) && near(15/10,12/8) && near(deg(P.A,P.B,P.C),deg(P.A,P.D,P.E)); })()`,
      // 小テスト（1）△ABC（AB＝6、AC＝12、BC＝9）。D は AD＝2、E は AE＝4（DE∥BC）：EC＝8、DE＝3　（2）面積の比 △ADE：△ABC＝1：9
      `(() => { ${LIB} const P=tri(9,12,6), D=at(P.A,P.B,1/3), E=at(P.A,P.C,1/3); return near(len(P.A,D),2) && near(len(D,P.B),4) && near(len(P.A,E),4) && near(len(E,P.C),8) && z(cr(v(D,E),v(P.B,P.C))) && near(len(D,E),3) && near(ar(P.A,P.B,P.C)/ar(P.A,D,E),9); })()`,
      // 小テスト（3）相似比 2：5、小さいほう 16 → 大きいほう 250（立方体の辺 2 と 5：体積 8 と 125）
      'near(16 * 5 ** 3 / 2 ** 3, 250) && near(2 ** 3, 8) && near(5 ** 3, 125)',
      // 小テスト（4）∠A＝∠D＝70°、∠B＝∠E＝50° → ∠C＝∠F＝60°（2組の角が等しいと、3つとも等しい）
      'near(180 - 70 - 50, 60) && near(70 + 50 + 60, 180)',
      // 小テスト（5）チャレンジ：▱ABCD（A(1,3)・B(0,0)・C(4,0)・D(5,3)）。E は BC の中点、F は AE と BD の交点：△AFD∽△EFB（相似比 AD：EB＝2：1）、△EFB＝4 → △AFD＝16
      `(() => { ${LIB} const A=[1,3], B=[0,0], C=[4,0], D=[5,3], E=mid(B,C); const d1=v(A,E), d2=v(B,D), t=cr(v(A,B),d2)/cr(d1,d2), F=[A[0]+t*d1[0],A[1]+t*d1[1]], k=4/ar(E,F,B); return z(cr(v(A,D),v(B,C))) && near(len(A,D),2*len(E,B)) && near(ar(A,F,D)*k,16) && near(ar(A,F,D)/ar(E,F,B),4); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('「相似な図形」で学んだことを、使って考えよう'),
      C2([
        K('今日の問い', '△ABC の辺 AB、AC の中点を D、E とする。四角形 DBCE の面積は、△ADE の面積の何倍だろう。予想して、理由も考えよう。', 5)
      ], [F(5, todayFig)], '3:2'),
      T('①', '自分の考え（3分）　予想と、そう考えた理由を書こう。', 1),
      B(3, '（例）3倍　D、E は中点だから、DE∥BC、DE＝[[1/2]]BC\n△ADE∽△ABC で、相似比 1：2、面積の比 1：4\n四角形 DBCE＝4−1＝3　だから、△ADE の 3倍'),
      T('②', 'ペアの考え（3分）　自分とちがう理由を書こう。', 1),
      B(2, ''),
      G(1),
      WD('相似条件は 3つ。　3組の{{辺の比}}が等しい\n2組の辺の比と{{その間の角}}が等しい\n{{2組の角}}が等しい\nDE∥BC ならば　AD：AB＝DE：{{BC}}\n相似比 m：n ならば　面積の比 {{m^2：n^2}}', 5, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '図で、DE∥BC である。x、y の値と、△ADE と △ABC の面積の比を求めて、表を完成させよう。', 5)
      ], [F(5, exFig)], '3:2'),
      TB('', null, [
        ['x（EC の長さ）', ['AD：DB＝AE：EC　　4：8＝5：x　　x＝{{10}}']],
        ['y（DE の長さ）', ['AD：AB＝DE：BC　　4：12＝y：18　　y＝{{6}}']],
        ['△ADE：△ABC', ['相似比 {{1：3}}　　面積の比 {{1：9}}']]
      ], { hw: 50 }),
      T('', '【使う比のくふう】x と y で、使う比は、どうちがうだろう。', 1),
      B(3, 'x は、AD：DB のように、辺 AB を分けた比を使う。\ny は、AD：AB のように、三角形どうしの比を使う。\n（DE：BC は、AD：DB とは等しくない）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 相似な図形で、対応する辺の比を{{相似比}}という。\n② 相似条件：3組の辺の比／2組の辺の比と{{その間の角}}／{{2組の角}}\n③ DE∥BC のとき　AD：AB＝AE：AC＝{{DE}}：BC\n④ 相似比 m：n のとき、面積の比 {{m^2：n^2}}、体積の比 {{m^3：n^3}}', 4, { label: 'ことば' }),
      F(4, para, fig2),
      C2([
        T('（1）', '△ABC∽△DEF で、AB＝6cm、BC＝10cm、DE＝9cm のとき、相似比と、辺 EF の長さを求めよう。', 3),
        B(2, '相似比 6：9＝2：3\n10：EF＝2：3　　EF＝15cm')
      ], [
        T('（2）', '図1で、ℓ∥m∥n である。DE の長さを求めよう。', 3),
        B(2, '6：8＝DE：12\nDE＝9cm')
      ], '1:1'),
      MA('【説明】2つの三角形が相似かを調べるとき、何に目をつけるか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '学んだことを使って、求めよう。'),
      C2([
        T('（3）', '図2で、DE∥BC である。BC の長さを求めよう。', 3),
        B(2, '6：10＝9：BC\nBC＝15cm')
      ], [
        T('（4）', '△ABC の辺 AB、AC 上の点 D、E で、DE∥BC、AD：DB＝1：3。△ADE の面積が 5cm^2 のとき、四角形 DBCE の面積を求めよう。', 4),
        B(2, '相似比 1：4、面積の比 1：16\n△ABC＝80　　80−5＝75（cm^2）')
      ], '1:1'),
      C2([
        T('（5）', '相似な 2つの円錐 P、Q があり、高さは 6cm と 10cm である。P の体積が 54π cm^3 のとき、Q の体積を求めよう。', 4),
        B(2, '相似比 3：5、体積の比 27：125\n54π：x＝27：125　　x＝250π')
      ], [
        T('（6）', '△ABC と △DEF で、AB＝4cm、BC＝6cm、DE＝6cm、EF＝9cm、∠B＝∠E＝50°。相似なら、その相似条件を答えよう。', 4),
        B(2, '4：6＝6：9＝2：3、∠B＝∠E\n2組の辺の比とその間の角')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：面積の比に、きまりはあるだろうか。'),
      C2([
        T('（7）', '△ABC の辺 AB、AC を、それぞれ 3等分する点をとり、BC に平行な 2本の線をひいて、△ABC を 3つの部分に分ける。上から順に、3つの部分の面積の比を調べよう。4等分、5等分のときも調べて、きまりを探そう。', 6)
      ], [
        F(6, fig7)
      ], '3:2'),
      TB('等分の数', ['3等分', '4等分', '5等分'], [
        ['上から順の面積の比', ['', '', '']]
      ], { hw: 52 }),
      C2([
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        T('', '6等分のときの比を予想して、理由も書こう', 2),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '∠C＝90° の直角三角形 ABC で、AB＝15cm、AC＝12cm、BC＝9cm である。辺 AC 上に AD＝10cm となる点 D をとり、D から辺 AB に垂線 DE をひく。\n① △ABC∽△ADE を証明しよう。\n② 線分 AE の長さを求めよう。', 7)
      ], [
        F(7, fig8)
      ], '3:2'),
      B(6, '（仮定）∠ACB＝90°、DE⊥AB　（結論）△ABC∽△ADE\n（証明）△ABC と △ADE で\n共通な角だから　∠BAC＝∠DAE …①\n仮定より　∠ACB＝∠AED＝90° …②\n①、② より、2組の角が、それぞれ等しいから　△ABC∽△ADE\n② 相似だから　AB：AD＝AC：AE　　15：10＝12：AE　　AE＝8cm'),
      MA('① 2つの三角形に、共通な角はあるかな。ほかに、等しい角はあるかな。\n② △ABC と △ADE で、AE に対応する辺は、どれかな。', 4, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図で、DE∥BC である。x、y の値を求めよう。（3点）', 1),
      F(4, q1),
      B(2, 'x … 2：4＝4：x　　x＝8\ny … 2：6＝y：9　　y＝3'),
      T('（2）', '上の図で、△ADE と △ABC の面積の比を求めよう。（2点）', 1),
      B(2, '相似比 2：6＝1：3　　面積の比 1：9'),
      T('（3）', '相似比が 2：5 の 2つの立体がある。小さいほうの体積が 16cm^3 のとき、大きいほうの体積を求めよう。（2点）', 2),
      B(2, '体積の比は 8：125　　16×[[125/8]]＝250（cm^3）'),
      T('（4）', '△ABC と △DEF で、∠A＝∠D＝70°、∠B＝∠E＝50° である。△ABC∽△DEF といえる。使う相似条件を答えよう。（3点）', 2),
      B(2, '2組の角が、それぞれ等しい。'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '平行四辺形 ABCD で、辺 BC の中点を E とし、線分 AE と対角線 BD の交点を F とする。△EFB の面積が 4cm^2 のとき、△AFD の面積を求めよう。', 3),
      B(3, '△AFD∽△EFB（AD∥BE で、錯角が等しい）\n相似比は AD：EB＝2：1、面積の比は 4：1\n△AFD＝4×4＝16（cm^2）')
    ]
  });
})();
