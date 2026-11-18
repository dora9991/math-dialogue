/* 図形と証明（三角形と四角形） 第16時：条件を変えて、新しい性質を見つけよう。
   元：授業ナビ標準版 sankaku-16（活：条件を変えて、図形の性質を調べる）。課題（二等辺三角形 ABC の底辺 BC 上の点 P から AC、AB に平行な線 PQ、PR をひく。PQ＋PR は？）を「今日の問い」と①②（P の位置・条件をかえる）に、
   「PQ＝QB、PR＝AQ だから PQ＋PR＝AB」の組み立てを「例題」に、「正方形 ABCD の辺上の AE＝BF＝CG＝DH の点を結ぶ」図で、条件（正方形 → 長方形 → 平行四辺形）を変える活動を、演習プリントにした。
   ・ワークシートは A4 1枚：問いは1つ（印刷そのままの大きさの図：AB＝AC＝5cm、P の位置を2つ。はかって調べる）。個人3分 → ペア3分（条件を1つ変える）→ ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問（合同の根拠）・使ってみる 4問（角・条件を変える・面積2問）／裏＝ひろげる（考えよう：平行四辺形にかえて調べる。答えなし）・チャレンジ★★（二等辺三角形で PD＋PE＝BH の証明。面積を使う。ヒントカードつき）。
   ・図は、座標から描いた（今日の問い・（7）は、印刷そのままの大きさ）。長さ・角・面積・個数は、checks で、座標から出しなおした。∠AEH＝35° の図は、図1の E の位置を tan 35° から決めた。
   ・（7）の答え（平行四辺形にかえても、EFGH は平行四辺形になる）は、紙面に載せていない（checks で確かめただけ）。ワークシート・演習プリントに、「条件をかえるときに、証明のどこに目をつけるか」は書いていない。
   検算：node tools/verify.cjs sankaku-16　／　見た目：node tools/check.cjs <出力先> sankaku-16 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const RAD = Math.PI / 180;

  // ---- 今日の問い：印刷そのままの大きさ（1cm＝10mm）。二等辺三角形 B(0,0)・C(6,0)・A(3,4)（AB＝AC＝5cm）。P＝(6t, 0)、Q＝(3t, 4t)、R＝(3+3t, 4−4t) ----
  const TA = { B: [0, 0], C: [6, 0], A: [3, 4] };
  const tpt = t => ({ P: [6 * t, 0], Q: [3 * t, 4 * t], R: [3 + 3 * t, 4 - 4 * t] });
  const todayFig = SVG((W, H, h) => {
    const by = H - 6.5;
    const pl = (x, y, t) => h.rich(x, y, t, 3.1, 'middle');
    const one = (bx, t, name) => {
      const X = c => bx + c * 10, Y = c => by - c * 10, p = tpt(t);
      const ln = (a, b, w, d) => h.ln(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), '#222', w, ' stroke-linecap="round"' + (d ? ' stroke-dasharray="1.6 1.1"' : ''));
      let s = ln(TA.B, TA.A, 0.4) + ln(TA.A, TA.C, 0.4) + ln(TA.B, TA.C, 0.4) + ln(p.P, p.Q, 0.4) + ln(p.P, p.R, 0.4);
      // AB＝AC の印
      [[TA.B, TA.A], [TA.C, TA.A]].forEach(([u, w]) => { const m = [(u[0] + w[0]) / 2, (u[1] + w[1]) / 2], d = [w[0] - u[0], w[1] - u[1]], L = Math.hypot(...d), n = [-d[1] / L, d[0] / L]; s += h.ln(X(m[0] - n[0] * 0.13), Y(m[1] - n[1] * 0.13), X(m[0] + n[0] * 0.13), Y(m[1] + n[1] * 0.13), '#222', 0.35); });
      [['A', TA.A, 0, -2.4], ['B', TA.B, -3.4, 3.4], ['C', TA.C, 3.4, 3.4], ['P', p.P, 0, 5.2], ['Q', p.Q, -3.2, 0.8], ['R', p.R, 3.2, 0.8]].forEach(([n, c, dx, dy]) => { s += `<circle cx="${h.f2(X(c[0]))}" cy="${h.f2(Y(c[1]))}" r="0.6" fill="#222"/>` + pl(X(c[0]) + dx, Y(c[1]) + dy, n); });
      s += h.rich(bx - 14, 7, name, 3.4, 'middle');
      return s;
    };
    return one(40, 0.3, 'ア') + one(120, 0.6, 'イ');
  });

  // ---- 正方形・長方形に、辺上の点 E、F、G、H（AE＝BF＝CG＝DH＝x）をとった図 ----
  const sqPts = (a, x) => ({ A: [0, a], B: [0, 0], C: [a, 0], D: [a, a], E: [0, a - x], F: [x, 0], G: [a, x], H: [a - x, a] });
  const rcPts = (w, ht, x) => ({ A: [0, ht], B: [0, 0], C: [w, 0], D: [w, ht], E: [0, ht - x], F: [x, 0], G: [w, x], H: [w - x, ht] });   // 長方形（AB＝ht、BC＝w）
  const efgh = (P, extra) => GEO(Object.assign({
    pts: P, poly: 'ABCD', segs: ['EF', 'FG', 'GH', 'HE'], dots: ['E', 'F', 'G', 'H'], pad: 7,
    tick: [['A', 'E', 1, 0.5], ['B', 'F', 1, 0.5], ['C', 'G', 1, 0.5], ['D', 'H', 1, 0.5]],
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], E: ['E', 180, 3.2], F: ['F', 270, 3.2], G: ['G', 0, 3.2], H: ['H', 90, 3.2] }
  }, extra || {}));
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const T35 = Math.tan(35 * RAD), SQ1 = sqPts(10, 10 / (1 + T35));   // ∠AEH＝35° になる E の位置（AE＝10÷(1+tan35°)）
  const fig1 = cap(efgh(SQ1), '図1');
  const RC2 = rcPts(8, 6, 2);   // 長方形 AB＝6、BC＝8、AE＝BF＝CG＝DH＝2
  const fig2 = cap(efgh(RC2), '図2');
  const SQQ = sqPts(10, 3);
  const figQ = efgh(SQQ, { pad: 8 });

  // ---- （7）：印刷そのままの大きさの平行四辺形 ABCD（BC＝5.5cm）。点 E、F、G、H は、かかない ----
  const PG = { B: [0, 0], C: [5.5, 0], A: [1.5, 3], D: [7, 3] };
  const fig7 = SVG((W, H, h) => {
    const bx = (W - 70) / 2, by = H - 5, X = c => bx + c * 10, Y = c => by - c * 10;
    let s = '';
    [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']].forEach(([a, b]) => { s += h.ln(X(PG[a][0]), Y(PG[a][1]), X(PG[b][0]), Y(PG[b][1]), '#222', 0.4, ' stroke-linecap="round"'); });
    [['A', -3.2, 1.1], ['B', -3.2, 3.4], ['C', 3.2, 3.4], ['D', 3.2, 1.1]].forEach(([n, dx, dy]) => { s += h.rich(X(PG[n][0]) + dx, Y(PG[n][1]) + dy, n, 3.1, 'middle'); });
    return s;
  });

  // ---- チャレンジ（8）：△ABC（AB＝AC）。P は BC 上。PD⊥AB、PE⊥AC、BH⊥AC ----
  const foot = (P, A, B2) => { const u = [B2[0] - A[0], B2[1] - A[1]], t = ((P[0] - A[0]) * u[0] + (P[1] - A[1]) * u[1]) / (u[0] * u[0] + u[1] * u[1]); return [A[0] + t * u[0], A[1] + t * u[1]]; };
  const T8 = { A: [3, 4], B: [0, 0], C: [6, 0], P: [1.8, 0] };
  T8.D = foot(T8.P, T8.A, T8.B); T8.E = foot(T8.P, T8.A, T8.C); T8.H = foot(T8.B, T8.A, T8.C);
  const fig8 = GEO({
    pts: T8, poly: 'ABC', segs: ['PD', 'PE', ['B', 'H', { dash: 1 }]], dots: ['P'], pad: 7,
    tick: [['A', 'B', 1, 0.55], ['A', 'C', 1, 0.82]],
    ang: [{ at: 'D', a: 'P', b: 'A', right: true, r: 3 }, { at: 'E', a: 'P', b: 'A', right: true, r: 3 }, { at: 'H', a: 'B', b: 'A', right: true, r: 3 }],
    vl: { A: ['A', 90, 3.2], B: ['B', 225], C: ['C', 315], P: ['P', 270, 3.2], D: ['D', 150, 3.2], E: ['E', 20, 3.2], H: ['H', 30, 3.2] }
  });

  /* ---- 検算の道具 ---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), z=x=>Math.abs(x)<1e-9, ar=(P,Q,R)=>Math.abs(cr(v(P,Q),v(P,R)))/2, '
    + 'pa=(...p)=>Math.abs(p.reduce((s,a,i)=>{ const b=p[(i+1)%p.length]; return s+a[0]*b[1]-b[0]*a[1]; },0))/2, deg=(P,Q,R)=>Math.acos(dot(v(Q,P),v(Q,R))/(len(Q,P)*len(Q,R)))*180/PI, '
    + 'foot=(P,A,B)=>{ const u=v(A,B), t=dot(v(A,P),u)/dot(u,u); return [A[0]+t*u[0],A[1]+t*u[1]]; }, '
    + 'ix=(P,Q,R,S)=>{ const d=v(P,Q),e=v(R,S),t=cr(v(P,R),e)/cr(d,e); return [P[0]+t*d[0],P[1]+t*d[1]]; }, '
    // 四角形 P1P2P3P4 が平行四辺形か（2組の対辺が平行）
    + 'isPara=(a,b,c,d)=>z(cr(v(a,b),v(d,c)))&&z(cr(v(a,d),v(b,c))), '
    // 四角形 EFGH（辺上に AE＝BF＝CG＝DH）：四角形 ABCD の頂点を、4つの点の順に並べて、E、F、G、H を出す
    + 'efgh=(A,B,C,D,x)=>{ const at=(P,Q,d)=>{ const L=len(P,Q); return [P[0]+(Q[0]-P[0])*d/L,P[1]+(Q[1]-P[1])*d/L]; }; return { E:at(A,B,x), F:at(B,C,x), G:at(C,D,x), H:at(D,A,x) }; };';

  IK.lesson('sankaku-16', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第16時', title: '条件を変えて、新しい性質を見つけよう',
    summary: '二等辺三角形の底辺上の点から2辺に平行な線をひいたときの長さの和を調べ、証明の組み立てをふり返る。条件（点の位置・もとの図形）を変えて、新しい性質を見つけようとする。',
    head: '図形と証明　第16時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：B(0,0)・C(6,0)・A(3,4)（AB＝AC＝5）。ア（BP＝1.8）は PQ＝1.5、PR＝3.5、イ（BP＝3.6）は PQ＝3、PR＝2。どちらも PQ＋PR＝5＝AB。PQ∥AC、PR∥AB
      `(() => { ${LIB} const A=[3,4],B=[0,0],C=[6,0]; const f=t=>{ const P=[6*t,0], Q=[3*t,4*t], R=[3+3*t,4-4*t]; return { pq:len(P,Q), pr:len(P,R), par: z(cr(v(P,Q),v(A,C))) && z(cr(v(P,R),v(A,B))), onAB: z(cr(v(B,Q),v(B,A))), onAC: z(cr(v(C,R),v(C,A))) }; }; const a=f(0.3), b=f(0.6); return near(len(A,B),5) && near(len(A,C),5) && near(a.pq,1.5) && near(a.pr,3.5) && near(b.pq,3) && near(b.pr,2) && a.par && b.par && a.onAB && a.onAC && near(a.pq+a.pr,5) && near(b.pq+b.pr,5); })()`,
      // 今日の問い：P を BC 上のどこにとっても（t＝0.05〜0.95）、PQ＋PR＝AB（P から AC、AB への平行線と AB、AC の交点を、直線の交点として出しなおす）
      `(() => { ${LIB} const A=[3,4],B=[0,0],C=[6,0]; return Array.from({length:19},(_,i)=>(i+1)/20).every(t=>{ const P=[6*t,0], Q=ix(P,[P[0]+(C[0]-A[0]),P[1]+(C[1]-A[1])],A,B), R=ix(P,[P[0]+(B[0]-A[0]),P[1]+(B[1]-A[1])],A,C); return near(len(P,Q)+len(P,R),len(A,B)); }); })()`,
      // 例題：PQ＝QB（△QBP は二等辺三角形：∠QPB＝∠C＝∠B＝∠QBP）、PR＝AQ（四角形 AQPR は平行四辺形）、QB＋AQ＝AB（Q は AB 上）
      `(() => { ${LIB} const A=[3,4],B=[0,0],C=[6,0], t=0.3, P=[6*t,0], Q=[3*t,4*t], R=[3+3*t,4-4*t]; return near(len(P,Q),len(Q,B)) && near(len(P,R),len(A,Q)) && near(len(Q,B)+len(A,Q),len(A,B)) && isPara(A,Q,P,R) && near(deg(Q,P,B),deg(A,C,B)) && near(deg(A,B,C),deg(A,C,B)) && near(deg(Q,B,P),deg(Q,P,B)); })()`,
      // （1）図1：正方形 ABCD（1辺 10）の E、F、G、H（AE＝BF＝CG＝DH）。△AEH と △BFE：AE＝BF、AH＝BE、∠A＝∠B＝90°、合同（EH＝FE）
      `(() => { ${LIB} const P=${J(SQ1)}; return near(len(P.A,P.E),len(P.B,P.F)) && near(len(P.C,P.G),len(P.D,P.H)) && near(len(P.A,P.E),len(P.D,P.H)) && near(len(P.A,P.H),len(P.B,P.E)) && near(deg(P.B,P.A,P.D),90) && near(deg(P.A,P.B,P.C),90) && near(len(P.E,P.H),len(P.F,P.E)) && near(len(P.F,P.E),len(P.G,P.F)) && near(len(P.G,P.F),len(P.H,P.G)); })()`,
      // （3）図1：∠AEH＝35° → ∠AHE＝55°、∠BEF＝∠AHE＝55°、∠HEF＝180−35−55＝90°
      `(() => { ${LIB} const P=${J(SQ1)}; return near(deg(P.A,P.E,P.H),35) && near(deg(P.A,P.H,P.E),55) && near(deg(P.B,P.E,P.F),55) && near(deg(P.H,P.E,P.F),90) && near(180-35-55,90) && near(90-35,55); })()`,
      // （4）図2：長方形（AB＝6、BC＝8、x＝2）。EFGH は平行四辺形で、長方形でもひし形でもない。EH＝GF、FE＝HG
      `(() => { ${LIB} const P=${J(RC2)}; return isPara(P.E,P.F,P.G,P.H) && near(len(P.E,P.H),len(P.G,P.F)) && near(len(P.F,P.E),len(P.H,P.G)) && !z(dot(v(P.E,P.F),v(P.E,P.H))) && !near(len(P.E,P.F),len(P.F,P.G)) && near(len(P.A,P.H),len(P.C,P.F)) && near(len(P.B,P.E),len(P.D,P.G)); })()`,
      // （5）1辺 10cm の正方形、x＝3：4つの直角三角形は 3×7÷2＝10.5、EFGH＝100−10.5×4＝58（座標の面積でも 58）
      `(() => { ${LIB} const P=${J(SQQ)}; return near(3*7/2,10.5) && near(100-10.5*4,58) && near(pa(P.E,P.F,P.G,P.H),58) && near(len(P.A,P.H),7) && near(len(P.B,P.E),7); })()`,
      // （6）長方形 AB＝6、BC＝8、x＝2：△AEH＝2×6÷2＝6、△BFE＝2×4÷2＝4、△CGF＝6、△DHG＝4 → EFGH＝48−20＝28（座標の面積でも 28）
      `(() => { ${LIB} const P=${J(RC2)}; return near(2*6/2,6) && near(2*4/2,4) && near(48-(6+4+6+4),28) && near(pa(P.E,P.F,P.G,P.H),28) && near(ar(P.A,P.E,P.H),6) && near(ar(P.B,P.F,P.E),4) && near(ar(P.C,P.G,P.F),6) && near(ar(P.D,P.H,P.G),4); })()`,
      // （7）考えよう（答えは紙面に載せない）：平行四辺形 ABCD（BC＝5.5、AB＝√11.25）で AE＝BF＝CG＝DH＝1.5 とすると、EFGH は平行四辺形。いろいろな平行四辺形・x でも
      `(() => { ${LIB} const P=${J(PG)}; const q=efgh(P.A,P.B,P.C,P.D,1.5); const ok=[[2,1,70],[3,2,50],[4,2.5,120],[5,1,35]].every(([a,b,th])=>{ const B=[0,0],C=[a,0],A=[b*Math.cos(th*PI/180),b*Math.sin(th*PI/180)],D=[A[0]+a,A[1]], r=efgh(A,B,C,D,0.4); return isPara(r.E,r.F,r.G,r.H); }); return isPara(q.E,q.F,q.G,q.H) && ok && isPara(P.A,P.B,P.C,P.D) && near(len(P.B,P.C),5.5) && len(P.A,P.B)>3; })()`,
      // （8）△ABC（AB＝AC）：△ABC＝△ABP＋△ACP から、PD＋PE＝BH（P をいろいろな位置にとっても成り立つ）
      `(() => { ${LIB} const A=[3,4],B=[0,0],C=[6,0]; return Array.from({length:9},(_,i)=>(i+1)/10).every(t=>{ const P=[6*t,0], D=foot(P,A,B), E=foot(P,A,C), H=foot(B,A,C); return near(len(P,D)+len(P,E),len(B,H)) && near(ar(A,B,C),ar(A,B,P)+ar(A,C,P)) && near(0.5*len(A,B)*len(P,D)+0.5*len(A,C)*len(P,E),0.5*len(A,C)*len(B,H)) && z(dot(v(P,D),v(A,B))) && z(dot(v(P,E),v(A,C))) && z(dot(v(B,H),v(A,C))); }); })()`,
      // （8）図：P(1.8, 0) のとき PD＋PE＝1.44＋3.36＝4.8＝BH。D、E、H は、辺 AB、AC の上にある
      `(() => { ${LIB} const P=${J(T8)}; const on=(X,U,W)=>z(cr(v(U,X),v(U,W)))&&dot(v(U,X),v(X,W))>=0; return near(len(P.P,P.D),1.44) && near(len(P.P,P.E),3.36) && near(len(P.B,P.H),4.8) && on(P.D,P.A,P.B) && on(P.E,P.A,P.C) && on(P.H,P.A,P.C); })()`,
      // 小テスト（4）AB＝AC＝8 → PQ＋PR＝8（P から AC、AB に平行な線）。8cm の二等辺三角形 B(0,0)・C(9,0)・A(4.5, √(64−20.25)) で確かめる
      `(() => { ${LIB} const h=Math.sqrt(64-20.25), A=[4.5,h],B=[0,0],C=[9,0]; return near(len(A,B),8) && near(len(A,C),8) && [0.2,0.5,0.7].every(t=>{ const P=[9*t,0], Q=ix(P,[P[0]+(C[0]-A[0]),P[1]+(C[1]-A[1])],A,B), R=ix(P,[P[0]+(B[0]-A[0]),P[1]+(B[1]-A[1])],A,C); return near(len(P,Q)+len(P,R),8); }); })()`,
      // 小テスト（5）チャレンジ：長方形にかえても EFGH は平行四辺形（図2と同じ）。（1）〜（3）は図1・正方形（1辺 10、x＝3）：AH＝BE＝7
      `(() => { ${LIB} const P=${J(SQQ)}, R=${J(rcPts(9,5,1.5))}; return near(len(P.A,P.H),len(P.B,P.E)) && isPara(R.E,R.F,R.G,R.H); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('条件を変えて、図形の新しい性質を、見つけよう'),
      K('今日の問い', 'AB＝AC＝5cm の二等辺三角形 ABC で、BC 上の点 P から、AC、AB に平行な線をひき、AB、AC との交点を Q、R とする。P の位置をかえると、PQ＋PR は、どうなるだろう。はかって調べよう。', 3),
      F(7, todayFig),
      T('①', '自分の考え（3分）　ア、イ の PQ、PR をはかって、わかったことを書こう。', 1),
      B(3, '（例）ア … PQ＝1.5cm、PR＝3.5cm　PQ＋PR＝5cm\nイ … PQ＝3cm、PR＝2cm　PQ＋PR＝5cm\nどちらも、和は AB＝5cm と同じ。'),
      T('②', 'ペアの考え（3分）　条件を1つ変えて、どうなるかを調べよう。', 1),
      B(2, ''),
      G(1),
      WD('二等辺三角形の{{底角}}は等しい。\n2つの角が等しい三角形は{{二等辺三角形}}。\n2組の対辺が平行な四角形は{{平行四辺形}}。\n平行四辺形の{{対辺}}は等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'PQ＋PR＝AB となるわけを考える。PQ と PR を、AB の一部と等しい線分に置きかえて、表を完成させよう。', 2),
      TB('', null, [
        ['PQ と等しい線分（△QBP は二等辺三角形）', ['PQ＝{{QB}}']],
        ['PR と等しい線分（AQPR は平行四辺形）', ['PR＝{{AQ}}']],
        ['PQ＋PR を、AB で表す', ['PQ＋PR＝QB＋AQ＝{{AB}}']]
      ], { hw: 112 }),
      T('', '【理由のくふう】△QBP が二等辺三角形といえるわけを考えよう。', 1),
      B(3, 'PQ∥AC より、同位角は等しいから　∠QPB＝∠C\nAB＝AC より、底角は等しいから　∠B＝∠C\nだから　∠QBP＝∠QPB　2つの角が等しいので　PQ＝QB')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 二等辺三角形の{{底角}}は等しい。\n② 2つの角が等しい三角形は、{{二等辺三角形}}である。\n③ 平行四辺形の{{対辺}}は等しく、{{対角}}も等しい。\n④ 平行線の{{同位角}}は等しい。', 4, { label: 'ことば' }),
      F(5, fig1, fig2),
      C2([
        T('（1）', '図1で、AE＝BF＝CG＝DH である。△AEH と △BFE で、等しい辺・角を3組答えよう。', 3),
        B(2, 'AE＝BF、AH＝BE\n∠A＝∠B＝90°')
      ], [
        T('（2）', '△AEH≡△BFE の合同条件と、EH と等しい線分を答えよう。', 3),
        B(2, '2組の辺とその間の角\nEH＝FE')
      ], '1:1'),
      MA('【説明】AH＝BE となるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '条件を変えたり、面積を求めたりしてみよう。'),
      C2([
        T('（3）', '図1で、∠AEH＝35° のとき、∠AHE、∠BEF、∠HEF の大きさを求めよう。', 3),
        B(3, '∠AHE＝90°−35°＝55°\n∠BEF＝∠AHE＝55°\n∠HEF＝180°−35°−55°＝90°')
      ], [
        T('（4）', '図2は、図1の正方形を、長方形にかえたもの。四角形 EFGH は、どんな四角形か。', 3),
        B(3, '平行四辺形\n（2組の対辺が、それぞれ等しい）')
      ], '1:1'),
      C2([
        T('（5）', '1辺 10cm の正方形で、AE＝BF＝CG＝DH＝3cm のとき、四角形 EFGH の面積を求めよう。', 3),
        B(3, '直角三角形は 3×7÷2＝10.5\n100−10.5×4＝58（cm^2）')
      ], [
        T('（6）', '図2で、AB＝6cm、BC＝8cm、AE＝2cm のとき、四角形 EFGH の面積を求めよう。', 3),
        B(3, '4つの三角形は 6、4、6、4\n6×8−(6+4+6+4)＝28（cm^2）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：もとの四角形を、かえてみよう。'),
      T('（7）', '図の平行四辺形 ABCD の辺上に、AE＝BF＝CG＝DH＝1.5cm となる点 E、F、G、H をとって、四角形 EFGH をつくろう。EFGH は、どんな四角形になるだろう。予想して、図にかいて確かめよう。', 4),
      F(5, fig7),
      C2([
        T('', '予想と、確かめたこと', 1),
        B(5, '')
      ], [
        T('', '気づいたこと', 1),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の △ABC は AB＝AC の二等辺三角形である。BC 上の点 P から AB、AC に垂線 PD、PE をひき、B から AC に垂線 BH をひく。PD＋PE＝BH を証明しよう。', 5)
      ], [
        F(5, fig8)
      ], '3:2'),
      B(7, '（仮定）△ABC は AB＝AC の二等辺三角形、PD⊥AB、PE⊥AC、BH⊥AC\n（結論）PD＋PE＝BH\n（証明）△ABC＝△ABP＋△ACP だから\n[[1/2]]×AC×BH＝[[1/2]]×AB×PD＋[[1/2]]×AC×PE\nAB＝AC だから、両辺を [[1/2]]×AB でわって\nBH＝PD＋PE'),
      MA('① △ABC を、P を使って、2つの三角形に分けると、どうなるかな。\n② 三角形の面積を、底辺を AB、AC にして、それぞれ式で表してみよう。', 3, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の正方形 ABCD で、AE＝BF＝CG＝DH である。△AEH≡△BFE がいえるときの、合同条件を答えよう。（3点）', 4),
        B(1, '2組の辺とその間の角'),
        T('（2）', 'AH と長さが等しい線分を答えよう。（2点）', 2),
        B(1, 'BE'),
        T('（3）', 'EH＝FE がいえるのは、なぜか。（2点）', 2),
        B(2, '合同な図形の、対応する辺は等しいから')
      ], [
        F(10, figQ)
      ], '3:2'),
      T('（4）', 'AB＝AC＝8cm の二等辺三角形 ABC で、BC 上の点 P から、AC、AB に平行な線をひき、AB、AC との交点を Q、R とする。PQ＋PR の長さを求めよう。（3点）', 3),
      B(2, '8cm\n（P の位置に関係なく、AB の長さと等しい）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '上の問題の「正方形 ABCD」を「長方形 ABCD」に変えても、AE＝BF＝CG＝DH のとき、四角形 EFGH は、どんな四角形になるか。', 2),
      B(2, '平行四辺形')
    ]
  });
})();
