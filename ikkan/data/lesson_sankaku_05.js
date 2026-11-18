/* 図形と証明（三角形と四角形） 第5時：直角三角形が合同になる条件を見つけよう。
   元：授業ナビ標準版 sankaku-05（探）。「斜辺と1つの鋭角／斜辺と他の1辺」を考える課題を「今日の問い」（斜辺が等しい2つの直角三角形で、あと何がわかれば合同といえるか）に、
   合同な直角三角形を見つける練習（ア〜オ）を「例題」に、「斜辺でない1辺と1つの鋭角が等しいとき、いつも合同といえるか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ。個人3分 → ペア3分 → ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・数値・図は新しく作り、直角三角形の辺・角は座標から出しなおして checks にした（図の字・印も、座標と合うことを確かめた）。
     授業ナビの「考えよう」（合同条件を使う前に確かめること）は、ワークシートの「くふう」に入れた。（7）は、それとは別の、答えの出ていない問いにした。
   検算：node tools/verify.cjs sankaku-05　／　見た目：node tools/check.cjs <出力先> sankaku-05 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify, R = Math.PI / 180;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  // 直角三角形：nm[2] が直角、nm[0]nm[1] が斜辺（長さ c）、nm[1] の角が th°。flip＝裏返す、rot＝回す（度）
  const rt = (nm, c, th, rot, flip) => {
    const raw = { [nm[0]]: [0, c * Math.sin(th * R)], [nm[1]]: [c * Math.cos(th * R), 0], [nm[2]]: [0, 0] }, a = (rot || 0) * R, out = {};
    Object.keys(raw).forEach(k => { let [x, y] = raw[k]; if (flip) x = -x; out[k] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; });
    return out;
  };
  const cen = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 辺 a-b の外がわ（図形の中心から遠ざかる向き）に、字 t を置く
  const side = (P, a, b, t, k) => { const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = cen(P); const vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1; return { p: m, t, dx: (k || 4.8) * vx / L, dy: -(k || 4.8) * vy / L }; };
  // 直角三角形の図。o：hyp＝斜辺の長さの字、leg＝[点, 点, 字]、ang＝nm[1] の角の字、ang0＝nm[0] の角の字、vl＝頂点の字を出すか、tick＝斜辺のしるし
  const rtFig = (P, nm, o) => {
    const [a, b, c] = nm, txt = [], ang = [{ at: c, a, b, right: true, r: 3.2 }];
    if (o.hyp) txt.push(side(P, a, b, o.hyp));
    if (o.leg) txt.push(side(P, o.leg[0], o.leg[1], o.leg[2]));
    if (o.ang) ang.push({ at: b, a: c, b: a, t: o.ang, r: 5 });
    if (o.ang0) ang.push({ at: a, a: c, b, t: o.ang0, r: 5 });
    return GEO({ pts: P, poly: nm, ang, txt, vl: o.vl ? nm : undefined, tick: o.tick, scale: o.scale, pad: o.pad || 5 });
  };

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：斜辺が等しい 2つの直角三角形（斜辺 5、ちがう形）
  const P_ABC = rt('ABC', 5, 36.8699, 0, false), P_DEF = rt('DEF', 5, 55, 0, true);
  // 例題 ア〜オ（長さ・角の字は、図の座標のとおり）
  const S3 = 4.1;   // 1cm あたりの mm（ア〜オの大きさをそろえる）
  const E_A = rt('ABC', 5, 40, 0, false);             // ア：斜辺 5、∠A＝50°（∠B＝40°）
  const E_I = rt('ABC', 5, Math.acos(0.8) / R, 90, false);   // イ：斜辺 5、BC＝4（3・4・5）
  const E_U = rt('ABC', 5, 40, 200, true);            // ウ：ア と合同（裏返して回した）
  const E_E = rt('ABC', 5, Math.acos(0.8) / R, 300, true);   // エ：イ と合同
  const E_O = rt('ABC', 5 / Math.cos(40 * R), 40, 150, false); // オ：BC＝5（斜辺ではない）、∠A＝50°
  // 演習プリント 図1：直角三角形 PQR（∠R＝90°）、図2・図3：斜辺 7cm
  const P_PQR = rt('PQR', 5, 36.8699, 25, false);
  const P_2 = rt('ABC', 7, 40, 0, false);            // ∠B＝40°
  const P_3 = rt('DEF', 7, 40, 180, true);            // ∠E＝40°（∠D＝50°）。D が斜辺の左はし
  // （8）正方形 ABCD と、A を通る直線 ℓ（BE＝5、DF＝3。E、F は ℓ 上の垂線の足）
  const SQ = { A: [0, 0], B: [-3, 5], C: [2, 8], D: [5, 3], E: [-3, 0], F: [5, 0] };

  const f_main1 = rtFig(P_ABC, 'ABC', { vl: true, tick: [['A', 'B', 1]], scale: 5.6, pad: 6 });
  const f_main2 = rtFig(P_DEF, 'DEF', { vl: true, tick: [['D', 'E', 1]], scale: 5.6, pad: 6 });
  const f_ex = [
    cap(rtFig(E_A, 'ABC', { hyp: '5cm', ang0: '50°', scale: S3 }), 'ア'),
    cap(rtFig(E_I, 'ABC', { hyp: '5cm', leg: ['B', 'C', '4cm'], scale: S3 }), 'イ'),
    cap(rtFig(E_U, 'ABC', { hyp: '5cm', ang0: '50°', scale: S3 }), 'ウ'),
    cap(rtFig(E_E, 'ABC', { hyp: '5cm', leg: ['B', 'C', '4cm'], scale: S3 }), 'エ'),
    cap(rtFig(E_O, 'ABC', { leg: ['B', 'C', '5cm'], ang0: '50°', scale: S3 }), 'オ')
  ];
  const g1 = cap(rtFig(P_PQR, 'PQR', { vl: true, scale: 4.4, pad: 6 }), '図1');
  const g2 = cap(rtFig(P_2, 'ABC', { vl: true, hyp: '7cm', ang: '40°', scale: 3.2, pad: 6 }), '図2');
  const g3 = cap(rtFig(P_3, 'DEF', { vl: true, hyp: '7cm', ang0: '50°', scale: 3.2, pad: 6 }), '図3');
  const f_sq = GEO({
    pts: SQ, poly: 'ABCD', segs: [[[-5.5, 0], [7.5, 0], { lab: 'ℓ' }], 'BE', 'DF'],
    vl: { A: ['A', 270, 3.4], B: ['B', 150], C: ['C', 90], D: ['D', 30], E: ['E', 270], F: ['F', 270] },
    ang: [{ at: 'E', a: 'B', b: 'A', right: true, r: 3.2 }, { at: 'F', a: 'D', b: 'A', right: true, r: 3.2 }],
    txt: [{ p: [-3, 2.5], t: '5cm', dx: -5.2 }, { p: [5, 1.5], t: '3cm', dx: 5.2 }], pad: 7
  });

  /* ---------------- 検算の道具（checks の式の先頭にそえる） ---------------- */
  const LIB = 'const dd=(P,Q)=>Math.hypot(P[0]-Q[0],P[1]-Q[1]), an=(V,P,Q)=>{const u=[P[0]-V[0],P[1]-V[1]],w=[Q[0]-V[0],Q[1]-V[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}, '
    + 'srt=a=>a.slice().sort((x,y)=>x-y), same=(a,b)=>a.every((x,i)=>near(x,b[i])), sides=P=>srt([dd(P.A,P.B),dd(P.B,P.C),dd(P.C,P.A)]), angs=P=>srt([an(P.A,P.B,P.C),an(P.B,P.C,P.A),an(P.C,P.A,P.B)]), '
    + 'cong=(S,T)=>same(sides(S),sides(T))&&same(angs(S),angs(T)), len=(P,s)=>dd(P[s[0]],P[s[1]]), deg=(P,s)=>an(P[s[1]],P[s[0]],P[s[2]]);';
  const chk = body => `(() => { ${LIB} ${body} })()`;

  IK.lesson('sankaku-05', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第5時', title: '直角三角形が合同といえる条件を見つけよう',
    summary: '斜辺が等しい2つの直角三角形で、あと何がわかれば合同といえるかを考え、直角三角形の合同条件（斜辺と1つの鋭角／斜辺と他の1辺）をとらえる。合同な直角三角形の組を見つける。',
    head: '図形と証明　第5時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：∠C＝∠F＝90°、斜辺 AB＝DE＝5（5cm）。2つは合同ではない（∠B が 36.87°と 55°）。∠B＝∠E にすれば合同（斜辺と1つの鋭角）、BC＝EF にすれば合同（斜辺と他の1辺）
      chk(`const A=${J(P_ABC)}, D=${J(P_DEF)}; const ok = near(deg(A,'ACB'),90) && near(deg(D,'DFE'),90) && near(len(A,'AB'),len(D,'DE')) && !cong(A,{A:D.D,B:D.E,C:D.F}); `
        + `const mk = th => { const c=5, t=th*Math.PI/180; return { A:[0,c*Math.sin(t)], B:[c*Math.cos(t),0], C:[0,0] }; }; `
        + `return ok && cong(mk(55), mk(55)) && !cong(mk(36.8699), mk(55)) && [30,55,70].every(th => near(len(mk(th),'BC'), 5*Math.cos(th*Math.PI/180)) && near(len(mk(th),'AC'), 5*Math.sin(th*Math.PI/180)));`),
      // 例題 ア〜オ：ア（斜辺 5・∠A 50°）、イ（斜辺 5・BC 4）、ウ＝アと合同、エ＝イと合同、オ（BC 5＝斜辺ではない・∠A 50°）。図の字も座標のとおり
      chk(`const a=${J(E_A)}, i=${J(E_I)}, u=${J(E_U)}, e=${J(E_E)}, o=${J(E_O)}; `
        + `const lab = near(len(a,'AB'),5) && near(deg(a,'BAC'),50) && near(len(i,'AB'),5) && near(len(i,'BC'),4) && near(len(u,'AB'),5) && near(deg(u,'BAC'),50) && near(len(e,'AB'),5) && near(len(e,'BC'),4) && near(len(o,'BC'),5) && near(deg(o,'BAC'),50) && [a,i,u,e,o].every(P => near(deg(P,'ACB'),90)); `
        + `const all = [a,i,u,e,o], pairs = []; for (let x=0;x<5;x++) for (let y=x+1;y<5;y++) if (cong(all[x],all[y])) pairs.push(x+'-'+y); `
        + `return lab && pairs.join()==='0-2,1-3' && len(o,'AB')>len(o,'BC') && !near(len(o,'AB'),5);`),
      // 例題の合同条件：ア と ウ は 斜辺 5 と ∠A 50° が等しい。イ と エ は 斜辺 5 と BC 4 が等しい。（3・4・5：3²＋4²＝5²）
      chk(`const a=${J(E_A)}, u=${J(E_U)}, i=${J(E_I)}, e=${J(E_E)}; return near(len(a,'AB'),len(u,'AB')) && near(deg(a,'BAC'),deg(u,'BAC')) && near(len(i,'AB'),len(e,'AB')) && near(len(i,'BC'),len(e,'BC')) && near(3*3+4*4,5*5) && near(len(i,'AC'),3);`),
      // （1）図1：∠R＝90° の △PQR。斜辺は PQ（直角の向かい側）、鋭角は ∠P、∠Q（和 90°）
      chk(`const P=${J(P_PQR)}; return near(deg(P,'PRQ'),90) && len(P,'PQ')>len(P,'PR') && len(P,'PQ')>len(P,'QR') && near(deg(P,'RPQ')+deg(P,'PQR'),90) && deg(P,'RPQ')<90 && deg(P,'PQR')<90;`),
      // （2）図2：△ABC（AB＝7、∠B＝40°）と、図3：△DEF（DE＝7、∠D＝50°）。∠E＝40°。2つは合同（斜辺と1つの鋭角）。対応：A↔D、B↔E、C↔F
      chk(`const X=${J(P_2)}, Y=${J(P_3)}; return near(deg(X,'ACB'),90) && near(deg(Y,'DFE'),90) && near(len(X,'AB'),7) && near(len(Y,'DE'),7) && near(deg(X,'ABC'),40) && near(deg(Y,'EDF'),50) && near(deg(Y,'DEF'),40) && near(90-50,40) && cong(X,{A:Y.D,B:Y.E,C:Y.F});`),
      // （3）AB＝DE＝8、BC＝EF＝5（∠C＝∠F＝90°）：AC＝√(64−25)＝DF。3辺が等しくなるので合同（斜辺と他の1辺）
      chk(`const mk=(h,b)=>({A:[0,Math.sqrt(h*h-b*b)],B:[b,0],C:[0,0]}); const X=mk(8,5), Y=mk(8,5); return near(len(X,'AB'),8) && near(len(X,'BC'),5) && cong(X,Y) && near(len(X,'AC'),Math.sqrt(39));`),
      // （4）∠A＝∠D＝40°、∠B＝∠E＝50°（∠C＝∠F＝90°）：斜辺 5 と 10 のように、大きさのちがう三角形でも成り立つ。合同とはいえない
      chk(`const mk=(h,t)=>({A:[0,h*Math.sin(t*Math.PI/180)],B:[h*Math.cos(t*Math.PI/180),0],C:[0,0]}); const X=mk(5,50), Y=mk(10,50); return near(deg(X,'BAC'),40) && near(deg(Y,'BAC'),40) && near(deg(X,'ABC'),50) && near(deg(Y,'ABC'),50) && !cong(X,Y) && near(len(Y,'AB'),2*len(X,'AB'));`),
      // （5）∠C＝∠F＝90°、AC＝DF＝4、BC＝EF＝3：直角をはさむ2辺。斜辺 AB は 3²＋4²＝5²（長さは問題に書いていない）。2組の辺とその間の角（90°）が等しい → 合同
      chk(`const mk=()=>({A:[0,4],B:[3,0],C:[0,0]}); const X=mk(), Y=mk(); return cong(X,Y) && near(deg(X,'ACB'),90) && near(len(X,'AC'),4) && near(len(X,'BC'),3) && near(len(X,'AB'),5);`),
      // （6）AB＝DE＝10、∠A＝∠D＝30°：BC＝10×sin30°＝5。合同だから EF＝BC＝5
      chk(`const mk=()=>({A:[0,10*Math.cos(30*Math.PI/180)],B:[10*Math.sin(30*Math.PI/180),0],C:[0,0]}); const X=mk(), Y=mk(); return near(deg(X,'BAC'),30) && near(len(X,'AB'),10) && near(len(X,'BC'),5) && cong(X,Y) && near(len(Y,'BC'),5) && near(10/2,5);`),
      // （7）考えよう：斜辺でない1辺 3cm と 1つの鋭角 40°。辺が鋭角のとなり（BC＝3、∠B＝40°）なら、もう1辺は 3×tan40°≒2.52、斜辺≒3.92。辺が鋭角の向かい側（AC＝3、∠B＝40°）なら、もう1辺 3÷tan40°≒3.58、斜辺≒4.67。2つは合同でない
      chk(`const t=40*Math.PI/180; const X={A:[0,3*Math.tan(t)],B:[3,0],C:[0,0]}, Y={A:[0,3],B:[3/Math.tan(t),0],C:[0,0]}; return near(deg(X,'ABC'),40) && near(deg(Y,'ABC'),40) && near(len(X,'BC'),3) && near(len(Y,'AC'),3) && near(deg(X,'ACB'),90) && near(deg(Y,'ACB'),90) && !cong(X,Y) && len(X,'AB')<len(Y,'AB') && Math.abs(len(X,'AC')-2.5172)<1e-3 && Math.abs(len(Y,'BC')-3.5753)<1e-3;`),
      // （8）正方形 ABCD（A(0,0)・B(−3,5)・C(2,8)・D(5,3)）と ℓ（x軸）。BE＝5、DF＝3、E(−3,0)、F(5,0)。△ABE≡△DAF（斜辺 AB＝DA・∠BAE＝∠ADF）で、AE＝DF＝3、AF＝BE＝5。EF＝3＋5＝8
      chk(`const S=${J(SQ)}; const d=(p,q)=>dd(S[p],S[q]); return near(d('A','B'),d('A','D')) && near(d('A','B'),d('B','C')) && near(d('B','C'),d('C','D')) && near(deg(S,'BAD'),90) && near(deg(S,'ABC'),90) && near(d('B','E'),5) && near(d('D','F'),3) && near(deg(S,'AEB'),90) && near(deg(S,'AFD'),90) && near(d('A','E'),d('D','F')) && near(d('A','F'),d('B','E')) && near(deg(S,'BAE'),deg(S,'ADF')) && near(d('E','F'),8) && near(3+5,8) && near(d('E','A')+d('A','F'),d('E','F'));`),
      // 小テスト（2）ア：斜辺＋∠B → 合同　ウ：斜辺＋他の1辺 → 合同　イ・エ は合同とはいえない（イ：鋭角2つだけ＝大きさがちがう三角形がある）
      chk(`const mk=(h,t)=>({A:[0,h*Math.sin(t*Math.PI/180)],B:[h*Math.cos(t*Math.PI/180),0],C:[0,0]}); const X=mk(6,35), Y=mk(6,35), Z=mk(9,35); return cong(X,Y) && !cong(X,Z) && near(deg(X,'ABC'),deg(Z,'ABC')) && near(deg(X,'BAC'),deg(Z,'BAC'));`),
      // 小テスト（3）AB＝DE＝13、AC＝DF＝12：BC＝√(13²−12²)＝5＝EF（13²＝12²＋5²）
      'near(13*13, 12*12 + 5*5) && near(Math.sqrt(13*13 - 12*12), 5)',
      // 小テスト（4）まちがい直し：AC＝DF、BC＝EF（直角をはさむ2辺）の組は、斜辺ではない。3辺が等しくなる（3・4・5）ので合同
      chk(`const mk=()=>({A:[0,4],B:[3,0],C:[0,0]}); return cong(mk(),mk()) && len(mk(),'AB')>len(mk(),'AC') && len(mk(),'AB')>len(mk(),'BC');`),
      // 小テスト（5）チャレンジ：AB＝AC の二等辺三角形（頂角 50°）。垂線 BD、CE は等しい（BD＝6 のとき CE＝6）。座標：A(0,h)、B(−b,0)、C(b,0)
      chk(`const b=3, h=7, A=[0,h], B=[-b,0], C=[b,0]; const foot=(P,Q,R)=>{ const u=[R[0]-Q[0],R[1]-Q[1]], t=((P[0]-Q[0])*u[0]+(P[1]-Q[1])*u[1])/(u[0]*u[0]+u[1]*u[1]); return [Q[0]+t*u[0],Q[1]+t*u[1]]; }; const D=foot(B,A,C), E=foot(C,A,B); return near(dd(A,B),dd(A,C)) && near(dd(B,D),dd(C,E)) && near(deg({A,B,C,D,E},'BDC'),90) && near(deg({A,B,C,D,E},'CEB'),90) && near(deg({A,B,C},'ABC'),deg({A,B,C},'ACB'));`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直角三角形は、何がわかれば合同といえるだろう'),
      K('今日の問い', '∠C＝∠F＝90°の △ABC、△DEF で、直角に向かい合う辺 AB、DE が等しい。あと何がわかれば合同といえるだろう。いくつか書こう。', 2),
      F(5, f_main1, f_main2),
      T('①', '自分の考え（3分）　あと何がわかればよいか、わけもつけて書こう。', 1),
      B(4, '（例）∠B＝∠E がわかれば、残りの鋭角 ∠A＝∠D も等しい（内角の和）。\n　　　1組の辺とその両端の角が等しいから、合同。\n　　BC＝EF がわかれば、BC を重ねて、裏返してつなぐと二等辺三角形。\n　　　底角が等しくなり、上と同じになるから、合同。'),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(2, ''),
      G(1),
      WD('直角三角形で、直角に対する辺を{{斜辺}}という。\n直角三角形の合同条件\n① {{斜辺}}と{{1つの鋭角}}が、それぞれ等しい。\n② 斜辺と{{他の1辺}}が、それぞれ等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次の直角三角形ア〜オの中から、合同な組を2組見つけ、表を完成させよう。', 1),
      F(4, ...f_ex),
      TB('', null, [
        ['合同な組', ['ア と {{ウ}}', 'イ と {{エ}}']],
        ['合同条件', ['斜辺と{{1つの鋭角}}', '斜辺と{{他の1辺}}']]
      ], { hw: 28 }),
      T('', '【確かめるくふう】合同条件を使う前に、確かめることは何だろう。オ を見て考えよう。', 1),
      B(3, '直角三角形であること。\n等しい辺が、どちらも斜辺（直角に対する辺）であること。\n（オ は、5cm の辺が斜辺ではないので、ア と合同とはいえない）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 直角三角形で、直角に対する辺を{{斜辺}}という。\n② 直角三角形の、直角以外の2つの角は、どちらも{{鋭角}}である。\n③ 2つの直角三角形は、斜辺と{{1つの鋭角}}が、それぞれ等しければ合同。\n④ 2つの直角三角形は、斜辺と{{他の1辺}}が、それぞれ等しければ合同。', 4, { label: 'ことば' }),
      F(4, g1, g2, g3),
      C2([
        T('（1）', '図1の直角三角形 PQR で、斜辺と、2つの鋭角を答えよう。', 2),
        B(2, '斜辺 PQ\n鋭角 ∠P、∠Q')
      ], [
        T('（2）', '図2と図3は合同か。合同なら、その条件を答えよう。', 2),
        B(3, '合同（∠E＝90°−50°＝40°）\n斜辺と1つの鋭角が、\nそれぞれ等しい')
      ], '1:1'),
      MA('【説明】斜辺と鋭角が等しいと合同になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '合同条件を使って、考えよう。'),
      T('', '（3）〜（6）は、∠C＝∠F＝90°の直角三角形 ABC、DEF について考えよう。', 1),
      C2([
        T('（3）', 'AB＝DE＝8cm、BC＝EF＝5cm である。合同か。合同なら、その条件も答えよう。', 3),
        B(2, '合同\n斜辺と他の1辺が、それぞれ等しい')
      ], [
        T('（4）', '∠A＝∠D＝40°、∠B＝∠E＝50°。合同といえるか。わけも答えよう。', 3),
        B(3, 'いえない\n（角が同じでも、大きさのちがう三角形がある）')
      ], '1:1'),
      C2([
        T('（5）', 'AC＝DF＝4cm、BC＝EF＝3cm である。使える合同条件を答えよう。', 3),
        B(2, '2組の辺とその間の角（直角）が、それぞれ等しい')
      ], [
        T('（6）', 'AB＝DE＝10cm、∠A＝∠D＝30°、BC＝5cm のとき、EF は何 cm か。わけも答えよう。', 3),
        B(3, '5cm\n斜辺と1つの鋭角が\n等しいから合同')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：条件を変えて、合同になるか調べよう。'),
      T('（7）', '2つの直角三角形で、斜辺でない1辺が 3cm、1つの鋭角が 40° である。この2つは、いつも合同といえるだろうか。図をかいて調べよう。', 3),
      C2([
        T('', '図をかいて調べよう', 1),
        B(13, '')
      ], [
        T('', '気づいたこと', 1),
        B(13, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、四角形 ABCD は正方形である。頂点 A を通る直線 ℓ に、B、D から垂線 BE、DF をひく。BE＝5cm、DF＝3cm のとき、EF は何 cm か。', 5),
        B(5, '△ABE≡△DAF\n（斜辺と1つの鋭角）\nAE＝DF＝3cm\nAF＝BE＝5cm\nEF＝3+5＝8（cm）')
      ], [
        F(6, f_sq),
        MA('① AB と DA は同じ長さ。直角三角形で見ると、どこにあたるかな。\n② ∠BAE と ∠DAF をたすと、何度になるかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '直角三角形の、直角に対する辺を何というか。また、直角三角形の合同条件を2つ書こう。（3点）', 2),
      B(3, '斜辺\n① 斜辺と1つの鋭角が、それぞれ等しい。\n② 斜辺と他の1辺が、それぞれ等しい。'),
      T('（2）', '∠C＝∠F＝90°の △ABC、△DEF で、次のア〜エのとき、合同といえるものをすべて選ぼう。（3点）\nア AB＝DE、∠B＝∠E　　　イ ∠A＝∠D、∠B＝∠E\nウ AB＝DE、AC＝DF　　　エ BC＝EF', 4),
      B(1, 'ア、ウ'),
      T('（3）', '∠C＝∠F＝90°の △ABC、△DEF で、AB＝DE＝13cm、AC＝DF＝12cm である。BC＝5cm のとき、EF は何 cm か。（2点）', 2),
      B(2, '5cm\n（斜辺と他の1辺が等しいから合同。BC＝EF）'),
      T('（4）', '「∠C＝∠F＝90°の △ABC、△DEF で、AC＝DF、BC＝EF だから、斜辺と他の1辺が等しいので合同」と書いた。まちがいを直そう。（2点）', 3),
      B(2, 'AC と BC は斜辺ではない（直角をはさむ2辺）。\n正しくは「2組の辺とその間の角が、それぞれ等しい」。'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', 'AB＝AC の二等辺三角形 ABC で、頂点 B から辺 AC に垂線 BD、頂点 C から辺 AB に垂線 CE をひく。BD＝6cm のとき、CE は何 cm か。わけも書こう。', 3),
      B(4, '6cm\n△BCD と △CBE で、∠BDC＝∠CEB＝90°、BC は共通、底角で ∠BCD＝∠CBE。\n斜辺と1つの鋭角が等しいから △BCD≡△CBE　　CE＝BD＝6cm')
    ]
  });
})();
