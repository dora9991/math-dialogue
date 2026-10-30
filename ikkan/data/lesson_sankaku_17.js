/* 図形と証明（三角形と四角形） 第17時：「三角形と四角形」で学んだことを、整理して確かめよう。
   元：授業ナビ標準版 sankaku-17（確：単元のまとめ）。確かめ1（角の大きさ）・確かめ2（逆と反例）・確かめ3（平行四辺形の中の垂線 AE、CF の証明）・考えよう（逆を考えるよさ）をもとに、新しく書いた。
   ・今日の問い（単元で学んだことを使って考える問い）：「▱ABCD で、頂点 A、C から対角線 BD に垂線 AE、CF をひく。AE と CF の長さについて、どんなことがいえるか」。
     直角三角形の合同（二等辺・平行四辺形の性質・錯角）と、面積（平行線と面積・対角線で2等分）の、2通りの理由を①②で出し合う。
   ・ワークシートは A4 1枚：個人3分 → ペア3分（ちがう理由）→ ことば（単元の中心：底角・直角三角形の合同・対角線・平行線のきょり）→ 例題（二等辺三角形・平行四辺形・ひし形の ∠x。図の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問（∠x・逆と反例）・使ってみる 4問（直角三角形の合同条件・平行四辺形になる条件・面積・説明）／裏＝ひろげる（考えよう：逆を考えるよさ。答えなし）・チャレンジ★★（平行四辺形の中の中点の証明。ヒントカードつき）。
   ・図は、角度から座標を出して描いた。∠x・長さ・面積・合同は、checks で座標から出しなおした。証明の論理（仮定・根拠・合同条件）は、書いたあとに読み直した。
   ・（7）の答え（性質の逆が正しければ、その図形になる条件として使える）は、ワークシート・演習プリント（（1）〜（6））・解答のどこにも書いていない（小テストにも書いていない）。
   検算：node tools/verify.cjs sankaku-17　／　見た目：node tools/check.cjs <出力先> sankaku-17 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const RAD = Math.PI / 180;

  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const pol = (r, a) => [r * Math.cos(a * RAD), r * Math.sin(a * RAD)];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const VL4 = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };

  // ---- 今日の問い：▱ABCD。A、C から対角線 BD に垂線 AE、CF ----
  const foot = (P, A, B2) => { const u = [B2[0] - A[0], B2[1] - A[1]], t = ((P[0] - A[0]) * u[0] + (P[1] - A[1]) * u[1]) / (u[0] * u[0] + u[1] * u[1]); return [A[0] + t * u[0], A[1] + t * u[1]]; };
  const T0 = { B: [0, 0], C: [4.6, 0], A: [1.2, 2.6], D: [5.8, 2.6] };
  T0.E = foot(T0.A, T0.B, T0.D); T0.F = foot(T0.C, T0.B, T0.D);
  const todayFig = GEO({
    pts: T0, poly: 'ABCD', segs: ['BD', 'AE', 'CF'], dots: ['E', 'F'], pad: 7,
    ang: [{ at: 'E', a: 'A', b: 'B', right: true, r: 3.4 }, { at: 'F', a: 'C', b: 'D', right: true, r: 3.4 }],
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], E: ['E', 300, 3.2], F: ['F', 110, 3.2] }
  });

  // ---- 例題の図（∠x は空欄）----
  // ① 二等辺三角形 ABC（AB＝AC）：∠A＝40° → ∠B＝70°
  const iso = (apex, leg) => { const A = [0, 0], B = pol(leg, -90 - apex / 2), C = pol(leg, -90 + apex / 2); return { A, B, C }; };
  const W1 = iso(40, 4);
  const w1 = cap(GEO({ pts: W1, poly: 'ABC', tick: [['A', 'B', 1], ['A', 'C', 1]], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315] }, pad: 6,
    ang: [{ at: 'A', a: 'B', b: 'C', t: '40°', r: 6 }, { at: 'B', a: 'A', b: 'C', t: '{{70°}}', r: 6 }] }), '①');
  // ② 平行四辺形 ABCD：∠A＝115° → ∠B＝65°
  const pg = (base, side, angB) => { const B2 = [0, 0], C = [base, 0], A = pol(side, angB); return { A, B: B2, C, D: add(A, [base, 0]) }; };
  const W2 = pg(4.2, 2.4, 65);
  const w2 = cap(GEO({ pts: W2, poly: 'ABCD', vl: VL4, pad: 6,
    ang: [{ at: 'A', a: 'B', b: 'D', t: '115°', r: 5 }, { at: 'B', a: 'A', b: 'C', t: '{{65°}}', r: 5 }] }), '②');
  // ③ ひし形 ABCD：∠ABC＝56° → ∠BAC＝62°
  const W3 = pg(3, 3, 56);
  const w3 = cap(GEO({ pts: W3, poly: 'ABCD', segs: ['AC'], tick: [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'A', 1]], vl: VL4, pad: 6,
    ang: [{ at: 'B', a: 'A', b: 'C', t: '56°', r: 5 }, { at: 'A', a: 'B', b: 'C', t: '{{62°}}', r: 5 }] }), '③');

  // ---- 演習プリントの図 ----
  // 図1：二等辺三角形 ABC（AB＝AC）、∠A＝52° → ∠B＝64°
  const D1 = iso(52, 4);
  const fig1 = cap(GEO({ pts: D1, poly: 'ABC', tick: [['A', 'B', 1], ['A', 'C', 1]], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315] }, pad: 6,
    ang: [{ at: 'A', a: 'B', b: 'C', t: '52°', r: 6 }, { at: 'B', a: 'A', b: 'C', t: 'x', r: 6 }] }), '図1');
  // 図2：▱ABCD、∠B＝72° → ∠C＝108°
  const D2 = pg(4.2, 2.4, 72);
  const fig2 = cap(GEO({ pts: D2, poly: 'ABCD', vl: VL4, pad: 6,
    ang: [{ at: 'B', a: 'A', b: 'C', t: '72°', r: 5 }, { at: 'C', a: 'B', b: 'D', t: 'x', r: 5 }] }), '図2');
  // 図3：台形 ABCD（AD∥BC、AD＝2、BC＝3）。O は対角線の交点
  const isect = (P, Q, R, S) => { const d = [Q[0] - P[0], Q[1] - P[1]], e = [S[0] - R[0], S[1] - R[1]], t = ((R[0] - P[0]) * e[1] - (R[1] - P[1]) * e[0]) / (d[0] * e[1] - d[1] * e[0]); return [P[0] + t * d[0], P[1] + t * d[1]]; };
  const D3 = { A: [0.8, 2.4], B: [0, 0], C: [3, 0], D: [2.8, 2.4] }; D3.O = isect(D3.A, D3.C, D3.B, D3.D);
  const fig3 = cap(GEO({ pts: D3, poly: 'ABCD', segs: ['AC', 'BD'], par: [['A', 'D', 1, 0.5], ['B', 'C', 1, 0.5]], vl: Object.assign({ O: ['O', 90, 3] }, VL4), pad: 6 }), '図3');

  // ---- チャレンジ（8）：▱ABCD。M は AD の中点。直線 BM と CD の延長の交点 E ----
  const C8 = pg(4, 2.4, 70); C8.M = [(C8.A[0] + C8.D[0]) / 2, (C8.A[1] + C8.D[1]) / 2]; C8.E = [2 * C8.M[0] - C8.B[0], 2 * C8.M[1] - C8.B[1]];
  const fig8 = GEO({
    pts: C8, poly: 'ABCD', segs: [['B', 'E'], ['D', 'E', { w: 0.32 }], ['A', 'E', { dash: 1 }], ['B', 'D', { dash: 1 }]], dots: ['M'], pad: 7,
    tick: [['A', 'M', 1, 0.5], ['M', 'D', 1, 0.5]],
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 0, 3.2], M: ['M', 250, 3.4], E: ['E', 45] }
  });

  // ---- 小テストの図 ----
  const iq = (b, ang) => { const Bp = [0, 0], C = [b, 0], A = [b / 2, b / 2 * Math.tan(ang * RAD)]; return { A, B: Bp, C }; };
  const Q1 = iq(3, 66);
  const q1 = cap(GEO({ pts: Q1, poly: 'ABC', tick: [['A', 'B', 1], ['A', 'C', 1]], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315] }, pad: 6,
    ang: [{ at: 'B', a: 'A', b: 'C', t: '66°', r: 6 }, { at: 'A', a: 'B', b: 'C', t: 'x', r: 6 }] }), '①');
  const Q2 = pg(4, 2.2, 75);
  const q2 = cap(GEO({ pts: Q2, poly: 'ABCD', vl: VL4, pad: 6,
    ang: [{ at: 'A', a: 'B', b: 'D', t: '105°', r: 5 }, { at: 'B', a: 'A', b: 'C', t: 'x', r: 5 }] }), '②');

  /* ---- 検算の道具 ---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), z=x=>Math.abs(x)<1e-9, ar=(P,Q,R)=>Math.abs(cr(v(P,Q),v(P,R)))/2, '
    + 'deg=(P,Q,R)=>Math.acos(dot(v(Q,P),v(Q,R))/(len(Q,P)*len(Q,R)))*180/PI, mid=(P,Q)=>[(P[0]+Q[0])/2,(P[1]+Q[1])/2], '
    + 'foot=(P,A,B)=>{ const u=v(A,B), t=dot(v(A,P),u)/dot(u,u); return [A[0]+t*u[0],A[1]+t*u[1]]; }, '
    + 'ix=(P,Q,R,S)=>{ const d=v(P,Q),e=v(R,S),t=cr(v(P,R),e)/cr(d,e); return [P[0]+t*d[0],P[1]+t*d[1]]; }, '
    + 'isPara=(a,b,c,d)=>z(cr(v(a,b),v(d,c)))&&z(cr(v(a,d),v(b,c))), tick=(P,s)=>[...s].map((c,i)=>len(P[c],P[s[(i+1)%s.length]])), '
    + 'tri=(Pt,target)=>{ const n=Object.keys(Pt), out=[]; for(let i=0;i<n.length;i++)for(let j=i+1;j<n.length;j++)for(let k=j+1;k<n.length;k++){ const a=ar(Pt[n[i]],Pt[n[j]],Pt[n[k]]); if(a>1e-9&&Math.abs(a-target)<1e-9) out.push([n[i],n[j],n[k]].sort().join("")); } return out.sort().join(); };';

  IK.lesson('sankaku-17', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第17時', title: '「三角形と四角形」で学んだことを、整理して確かめよう',
    summary: '単元で学んだことを使って、平行四辺形の対角線への垂線の長さを2通りの理由で説明する。二等辺三角形・直角三角形・平行四辺形・平行線と面積の性質と条件を、逆・反例もふくめて確かめる。',
    head: '図形と証明　第17時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：▱ABCD（B(0,0)・C(4.6,0)・A(1.2,2.6)・D(5.8,2.6)）。垂線の足 E、F は BD 上。AE＝CF。△ABE≡△CDF（AB＝CD、∠AEB＝∠CFD＝90°、∠ABE＝∠CDF）。面積：△ABD＝△CBD で、BD×AE÷2＝BD×CF÷2
      `(() => { ${LIB} const P=${J(T0)}; const bt=(X,Y,W)=>z(cr(v(X,Y),v(Y,W)))&&dot(v(X,Y),v(Y,W))>0; return isPara(P.A,P.B,P.C,P.D) && near(len(P.A,P.E),len(P.C,P.F)) && bt(P.B,P.E,P.D) && bt(P.B,P.F,P.D) && z(dot(v(P.A,P.E),v(P.B,P.D))) && z(dot(v(P.C,P.F),v(P.B,P.D))) && near(len(P.A,P.B),len(P.C,P.D)) && near(deg(P.A,P.E,P.B),90) && near(deg(P.C,P.F,P.D),90) && near(deg(P.A,P.B,P.D),deg(P.C,P.D,P.B)) && near(len(P.B,P.E),len(P.D,P.F)) && near(ar(P.A,P.B,P.D),ar(P.C,P.B,P.D)) && near(len(P.B,P.D)*len(P.A,P.E)/2,ar(P.A,P.B,P.D)) && near(len(P.B,P.D)*len(P.C,P.F)/2,ar(P.C,P.B,P.D)); })()`,
      // 例題：① 二等辺三角形 ∠A＝40° → ∠B＝(180−40)÷2＝70°　② ▱ ∠A＝115° → ∠B＝180−115＝65°　③ ひし形 ∠ABC＝56° → ∠BAC＝(180−56)÷2＝62°（座標から）
      `(() => { ${LIB} const a=${J(W1)}, b=${J(W2)}, c=${J(W3)}; return near(len(a.A,a.B),len(a.A,a.C)) && near(deg(a.B,a.A,a.C),40) && near(deg(a.A,a.B,a.C),70) && near((180-40)/2,70) && isPara(b.A,b.B,b.C,b.D) && near(deg(b.D,b.A,b.B),115) && near(deg(b.A,b.B,b.C),65) && near(180-115,65) && isPara(c.A,c.B,c.C,c.D) && near(len(c.A,c.B),len(c.B,c.C)) && near(deg(c.A,c.B,c.C),56) && near(deg(c.B,c.A,c.C),62) && near((180-56)/2,62); })()`,
      // （1）図1：二等辺三角形 ∠A＝52° → ∠B＝64°　図2：▱ ∠B＝72° → ∠C＝108°
      `(() => { ${LIB} const a=${J(D1)}, b=${J(D2)}; return near(len(a.A,a.B),len(a.A,a.C)) && near(deg(a.B,a.A,a.C),52) && near(deg(a.A,a.B,a.C),64) && near((180-52)/2,64) && isPara(b.A,b.B,b.C,b.D) && near(deg(b.A,b.B,b.C),72) && near(deg(b.B,b.C,b.D),108) && near(180-72,108); })()`,
      // （2）「x が 10 の倍数ならば x は 5 の倍数」は正しい。逆「x が 5 の倍数ならば x は 10 の倍数」は、x＝15 が反例（5 の倍数で、10 の倍数でない）
      `(() => { const imp=x=>x%10!==0||x%5===0, conv=x=>x%5!==0||x%10===0, xs=Array.from({length:60},(_,i)=>i+1); return xs.every(imp) && !conv(15) && 15%5===0 && 15%10!==0 && xs.filter(x=>!conv(x)).every(x=>x%10===5); })()`,
      // （3）直角三角形（∠C＝90°）で斜辺 AB＝5：もう1つの辺（BC＝3）を加えても、鋭角（∠B＝acos(3/5)）を加えても、残りの辺・角が決まり、たがいに合同（辺は 3、4、5）
      `(() => { const hyp=5, viaLeg=[3,Math.sqrt(hyp*hyp-9)], a=Math.acos(3/5), viaAngle=[hyp*Math.cos(a),hyp*Math.sin(a)]; return near(viaLeg[0],viaAngle[0]) && near(viaLeg[1],viaAngle[1]) && near(viaLeg[1],4) && near(9+16,hyp*hyp); })()`,
      // （4）AD∥BC の四角形 ABCD：AB∥DC を加えるか、AD＝BC（同じ向き）を加えると、平行四辺形（座標：A、D の高さが同じ）
      `(() => { ${LIB} const B=[0,0], C=[5,0]; return [[1,2],[2,3],[-1,1.5]].every(([ax,h])=>{ const A=[ax,h]; const D=[ax+5,h]; return isPara(A,B,C,D) && near(len(A,D),len(B,C)); }); })()`,
      // （5）図3：台形（AD＝2、BC＝3）。△ABO＝8、△OBC＝12 のとき △ABC＝20＝△DBC、△DCO＝20−12＝8（座標の面積の比で）
      `(() => { ${LIB} const P=${J(D3)}, k=8/ar(P.A,P.B,P.O); return z(cr(v(P.A,P.D),v(P.B,P.C))) && near(ar(P.O,P.B,P.C)*k,12) && near(ar(P.A,P.B,P.C)*k,20) && near(ar(P.D,P.B,P.C)*k,20) && near(ar(P.D,P.C,P.O)*k,8) && near(8+12,20) && near(20-12,8); })()`,
      // （6）▱ABCD（AD、BC の中点 M、N）：四角形 ANCM は平行四辺形（AM∥NC、AM＝NC）
      `(() => { ${LIB} const P=${J(pg(5,2.8,66))}, M=mid(P.A,P.D), N=mid(P.B,P.C); return isPara(P.A,P.N||N,P.C,M) && z(cr(v(P.A,M),v(N,P.C))) && near(len(P.A,M),len(N,P.C)) && near(len(P.A,M),len(P.A,P.D)/2); })()`,
      // （8）▱ABCD（M は AD の中点）：直線 BM と CD の延長の交点 E。△ABM≡△DEM（AM＝DM、∠AMB＝∠DME 対頂角、∠BAM＝∠EDM 錯角）、AB＝DE、AB∥DE → 四角形 ABDE は平行四辺形
      `(() => { ${LIB} const P=${J(C8)}; const E2=ix(P.B,P.M,P.C,P.D); return near(E2[0],P.E[0]) && near(E2[1],P.E[1]) && near(len(P.A,P.M),len(P.D,P.M)) && near(deg(P.A,P.M,P.B),deg(P.D,P.M,P.E)) && near(deg(P.B,P.A,P.M),deg(P.E,P.D,P.M)) && near(len(P.A,P.B),len(P.D,P.E)) && z(cr(v(P.A,P.B),v(P.D,P.E))) && isPara(P.A,P.B,P.D,P.E) && near(len(P.B,P.M),len(P.M,P.E)) && z(cr(v(P.C,P.D),v(P.D,P.E))) && dot(v(P.C,P.D),v(P.D,P.E))>0; })()`,
      // 小テスト（1）① 二等辺三角形 ∠B＝66° → ∠A＝180−66×2＝48°　② ▱ ∠A＝105° → ∠B＝75°
      `(() => { ${LIB} const a=${J(Q1)}, b=${J(Q2)}; return near(len(a.A,a.B),len(a.A,a.C)) && near(deg(a.A,a.B,a.C),66) && near(deg(a.B,a.A,a.C),48) && near(180-66*2,48) && isPara(b.A,b.B,b.C,b.D) && near(deg(b.D,b.A,b.B),105) && near(deg(b.A,b.B,b.C),75) && near(180-105,75); })()`,
      // 小テスト（2）「x が 6 の倍数ならば x は 3 の倍数」の逆「x が 3 の倍数ならば x は 6 の倍数」は、x＝9 が反例
      `(() => { const imp=x=>x%6!==0||x%3===0, conv=x=>x%3!==0||x%6===0, xs=Array.from({length:60},(_,i)=>i+1); return xs.every(imp) && !conv(9) && 9%3===0 && 9%6!==0; })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('「三角形と四角形」で学んだことを、使って考えよう'),
      K('今日の問い', '平行四辺形 ABCD で、頂点 A、C から、対角線 BD に垂線 AE、CF をひく。AE と CF の長さについて、どんなことがいえるだろう。予想して、理由も考えよう。', 3),
      F(6, todayFig),
      T('①', '自分の考え（3分）　予想と、そう考えた理由を書こう。', 1),
      B(3, '（例）AE＝CF\n① △ABE≡△CDF（斜辺と1つの鋭角が、それぞれ等しい）\n② △ABD＝△CBD だから　[[1/2]]×BD×AE＝[[1/2]]×BD×CF'),
      T('②', 'ペアの考え（3分）　自分とちがう理由（方法）を書こう。', 1),
      B(2, ''),
      G(1),
      WD('二等辺三角形の{{底角}}は等しい。\n直角三角形は、斜辺と{{他の1辺}}が等しいと合同。\n平行四辺形の対角線は、それぞれの{{中点}}で交わる。\n平行線の間のきょりは、どこでも{{等しい}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '図の ∠x の大きさを求めよう。また、使った性質を、表に書こう。（同じ印の辺は等しい）', 2),
      F(5, w1, w2, w3),
      TB('', null, [
        ['① 二等辺三角形', ['{{底角}}は等しい']],
        ['② 平行四辺形', ['{{となり合う角}}の和は 180°']],
        ['③ ひし形', ['4辺が等しいから、{{二等辺三角形}}']]
      ], { hw: 56 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 二等辺三角形の{{底角}}は等しい。\n② 直角三角形は、{{斜辺}}と1つの鋭角が等しければ合同である。\n③ 平行四辺形の対角線は、それぞれの{{中点}}で交わる。\n④ 平行線の間のきょりは、どこでも{{等しい}}。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3),
      C2([
        T('（1）', '図1、図2の ∠x の大きさを求めよう。同じ印の辺は等しい。（図2は ▱ABCD）', 3),
        B(2, '図1 … (180°−52°)÷2＝64°\n図2 … 180°−72°＝108°')
      ], [
        T('（2）', '「x が 10 の倍数ならば、x は 5 の倍数」の逆を書き、正しいか答えよう。正しくなければ、反例も。', 4),
        B(3, '逆 … x が 5 の倍数ならば、\nx は 10 の倍数。　正しくない。\n反例（例）x＝15')
      ], '1:1'),
      MA('【説明】二等辺三角形の底角が等しいわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '学んだことを、いろいろな場面で使ってみよう。'),
      C2([
        T('（3）', '△ABC と △DEF は、∠C＝∠F＝90°、AB＝DE である。あと1つ、どんな条件があれば合同か。2通り答えよう。', 4),
        B(1, '（例）BC＝EF、∠A＝∠D')
      ], [
        T('（4）', '四角形 ABCD で、AD∥BC のとき、あと1つ、どんな条件があれば、平行四辺形か。2通り答えよう。', 4),
        B(1, '（例）AB∥DC、AD＝BC')
      ], '1:1'),
      C2([
        T('（5）', '図3の台形 ABCD（AD∥BC）で、△ABO＝8cm^2、△OBC＝12cm^2 のとき、△DBC と △DCO の面積を求めよう。', 4),
        B(2, '△DBC＝8+12＝20（cm^2）\n△DCO＝20−12＝8（cm^2）')
      ], [
        T('（6）', '▱ABCD の辺 AD、BC の中点 M、N。四角形 ANCM が平行四辺形になるわけを説明しよう。', 3),
        B(3, 'AM∥NC で\nAM＝[[1/2]]AD＝[[1/2]]BC＝NC\n1組の対辺が平行で等しい')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：この単元をふり返ろう。'),
      T('（7）', 'この単元では、性質を証明したあとに、「逆は正しいか」を何度も考えた。逆を考えると、どんなよいことがあるだろう。単元の中から例を1つ選んで、書こう。', 3),
      C2([
        T('', '選んだ性質と、その逆', 1),
        B(5, '')
      ], [
        T('', '逆を考えると、どんなよいことがあるか', 1),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の ▱ABCD で、辺 AD の中点を M とする。直線 BM と、辺 CD の延長との交点を E とする。四角形 ABDE が平行四辺形になることを証明しよう。', 4)
      ], [
        F(6, fig8)
      ], '3:2'),
      B(9, '（仮定）▱ABCD、AM＝DM、E は BM と CD の延長との交点\n（結論）四角形 ABDE は平行四辺形\n（証明）△ABM と △DEM において\n仮定より　AM＝DM …①\n対頂角は等しいから　∠AMB＝∠DME …②\nAB∥EC より、錯角は等しいから　∠BAM＝∠EDM …③\n①、②、③より、1組の辺とその両端の角が、\nそれぞれ等しいから　△ABM≡△DEM　よって　AB＝DE\nAB∥DE で AB＝DE だから、四角形 ABDE は平行四辺形'),
      MA('① △ABM と合同になりそうな三角形は、どれかな。M は AD の何だったかな。\n② 四角形 ABDE が平行四辺形になるには、AB と DE について、何がいえればよいかな。', 4, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図の ∠x の大きさを求めよう。同じ印の辺は等しい。（①は二等辺三角形、②は ▱ABCD）（4点）', 2),
      F(5, q1, q2),
      B(2, '① 180°−66°×2＝48°　　② 180°−105°＝75°'),
      T('（2）', '「x が 6 の倍数ならば、x は 3 の倍数である」の逆を書こう。また、逆が正しいかどうかを答え、正しくないときは、反例をあげよう。（3点）', 3),
      B(3, '逆 … x が 3 の倍数ならば、x は 6 の倍数である。\n正しくない。反例（例）x＝9'),
      T('（3）', '四角形が平行四辺形になる条件を、1つ書こう。（3点）', 1),
      B(2, '（例）2組の対辺が、それぞれ等しい。'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '直角三角形の合同条件を、2つ書こう。', 1),
      B(2, '斜辺と1つの鋭角が、それぞれ等しい。\n斜辺と他の1辺が、それぞれ等しい。')
    ]
  });
})();
