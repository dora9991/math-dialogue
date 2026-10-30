/* 円（新しい形） 第5時：同じ角度に見える場所は、どこにあるだろう（円周角の定理の逆）。
   元：授業ナビ標準版 en-05（探）。「ゴールを同じ 30° で見こむ位置」を「今日の問い」に、「4点が 1つの円周上にあるか」を「例題」に、
   「円の内側・外側から見ると、角はどうなるか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（30° に見える位置の並び方を予想する）。個人3分 → ペア3分 → ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（垂線の足と円。ヒントカードつき）。
   ・円周角の定理の逆は、「同じ側」の条件を、問題文に書いた。反対側にある場合は、（5）で扱う。
   ・円と角の図は SVG（弧は path）。円周上の点は、中心・半径・向き（度）から決め、角の大きさは、座標から内積で出しなおした。
   検算：node tools/verify.cjs en-05　／　見た目：node tools/check.cjs <出力先> en-05 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;

  /* ==== 図の道具（円・弧・弦・角のしるし。この単元の4時間で、同じものを使う）====
     座標は数学の向き（y が上）、角度は度。CF(範囲 [x0, y0, x1, y1], 図の番号, (k, r) => { … })
     k＝黒（問題として出す図）、r＝赤（作図の跡・答え。解答のときだけ出る）。どちらにも、次の道具がある。
       ln(p, q, 太さ, 点線)　arc(中心, 半径, 角0, 角1)＝弧（角0 → 角1 は反時計まわり）　circ(中心, 半径)　dot(p)
       lb(p, 字, 向き, きょり mm)＝点の名前　tx(p, 字, dx, dy)　cap(p, 字)＝ア・イの見出し
       am(頂点, 点, 点, 半径 mm)＝角のしるし　al(頂点, 点, 点, きょり mm, 字)＝角の大きさの字　rt(頂点, 点, 点, 大きさ mm)＝直角のしるし */
  const INK = '#222', RED = '#d62828', D2R = Math.PI / 180;
  const pol = (c, r, a) => [c[0] + r * Math.cos(a * D2R), c[1] + r * Math.sin(a * D2R)];   // 中心 c から、向き a（度）、きょり r の点
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const dir = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) / D2R;                       // c から見た p の向き（度）
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const CF = (box, cap, build) => SVG((W, H, h) => {
    const [x0, y0, x1, y1] = box, pad = 2.5, f2 = h.f2, top = cap ? 4 : 0;
    const s = Math.min((W - 2 * pad) / (x1 - x0), (H - top - 2 * pad) / (y1 - y0));
    const X = x => (W - (x1 - x0) * s) / 2 + (x - x0) * s, Y = y => top + (H - top - (y1 - y0) * s) / 2 + (y1 - y) * s;
    const mk = col => {
      const o = { s: '' }, dsh = ' stroke-dasharray="1.4 1"';
      const turn = (V, P, Q) => { const a1 = dir(V, P), a2 = dir(V, Q); return [a1, ((a2 - a1 + 540) % 360) - 180]; };   // 角の始まりの向きと、まわる角（−180〜180）
      o.ln = (p, q, w, dash) => { o.s += h.ln(X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), col, w || 0.32, ' stroke-linecap="round"' + (dash ? dsh : '')); return o; };
      o.arc = (c, r, a0, a1, w, dash) => {
        const p0 = pol(c, r, a0), p1 = pol(c, r, a1), rs = r * s;
        o.s += `<path d="M${f2(X(p0[0]))},${f2(Y(p0[1]))} A${f2(rs)},${f2(rs)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${f2(X(p1[0]))},${f2(Y(p1[1]))}" fill="none" stroke="${col}" stroke-width="${w || 0.32}" stroke-linecap="round"${dash ? dsh : ''}/>`; return o;
      };
      o.circ = (c, r, w, dash) => { o.s += `<circle cx="${f2(X(c[0]))}" cy="${f2(Y(c[1]))}" r="${f2(r * s)}" fill="none" stroke="${col}" stroke-width="${w || 0.32}"${dash ? dsh : ''}/>`; return o; };
      o.dot = (p, r) => { o.s += `<circle cx="${f2(X(p[0]))}" cy="${f2(Y(p[1]))}" r="${r || 0.7}" fill="${col}"/>`; return o; };
      o.tx = (p, t, dx, dy, an, size) => { const sz = size || 3; o.s += h.rich(X(p[0]) + (dx || 0), Y(p[1]) + (dy || 0) + sz * 0.34, t, sz, an || 'middle'); return o; };   // (dx, dy)＝字の中心のずれ（mm。下が +）
      o.lb = (p, t, a, d, size) => o.tx(p, t, d * Math.cos(a * D2R), -d * Math.sin(a * D2R), 'middle', size);
      o.cap = (p, t) => { o.s += h.tx(X(p[0]), Y(p[1]) + 1, h.svgMath(t), 3, 'middle', ' class="cap"'); return o; };
      o.am = (V, P, Q, rm, w) => {
        const [a1, d] = turn(V, P, Q), vx = X(V[0]), vy = Y(V[1]), e = a1 + d;
        o.s += `<path d="M${f2(vx + rm * Math.cos(a1 * D2R))},${f2(vy - rm * Math.sin(a1 * D2R))} A${rm} ${rm} 0 0 ${d > 0 ? 0 : 1} ${f2(vx + rm * Math.cos(e * D2R))},${f2(vy - rm * Math.sin(e * D2R))}" fill="none" stroke="${col}" stroke-width="${w || 0.28}"/>`; return o;
      };
      o.al = (V, P, Q, rm, t, size) => {
        const [a1, d] = turn(V, P, Q), m = (a1 + d / 2) * D2R, sz = size || 3;
        o.s += h.rich(X(V[0]) + rm * Math.cos(m), Y(V[1]) - rm * Math.sin(m) + sz * 0.34, t, sz, 'middle'); return o;
      };
      o.rt = (V, P, Q, m) => {
        const a1 = dir(V, P) * D2R, a2 = dir(V, Q) * D2R, u = [Math.cos(a1), -Math.sin(a1)], w = [Math.cos(a2), -Math.sin(a2)], vx = X(V[0]), vy = Y(V[1]), mm = m || 2.6;
        o.s += `<polyline points="${f2(vx + u[0] * mm)},${f2(vy + u[1] * mm)} ${f2(vx + (u[0] + w[0]) * mm)},${f2(vy + (u[1] + w[1]) * mm)} ${f2(vx + w[0] * mm)},${f2(vy + w[1] * mm)}" fill="none" stroke="${col}" stroke-width="0.28"/>`; return o;
      };
      return o;
    };
    const k = mk(INK), r = mk(RED);
    build(k, r);
    if (cap) k.s += h.tx(0.6, 3.5, h.svgMath(cap), 3, 'start', ' class="cap"');
    return k.s + (r.s ? h.ans(r.s) : '');
  });
  // 線分 BC を、BC の左がわ（B から C を見て左）から角 th（度）で見こむ点は、ある円の弧の上にある。その円の {c: 中心, r: 半径}
  const viewCirc = (Bp, Cp, th) => {
    const m = mid(Bp, Cp), L = dist(Bp, Cp), n = [-(Cp[1] - Bp[1]) / L, (Cp[0] - Bp[0]) / L], hh = L / 2 / Math.tan(th * D2R);
    return { c: [m[0] + n[0] * hh, m[1] + n[1] * hh], r: L / 2 / Math.sin(th * D2R) };
  };
  const J = JSON.stringify;
  /* ---- 検算の道具（checks の式の先頭にそえる）：v＝ベクトル、len＝長さ、ang＝角（度）、side＝直線 PQ のどちら側か、cyc＝4点が 1つの円周上か、view＝線分を角 th で見こむ点、ft＝垂線の足、pl＝円周上の点 ---- */
  const LIB = 'const RD=Math.PI/180, v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), ang=(V,P,Q)=>Math.acos(dot(v(V,P),v(V,Q))/len(V,P)/len(V,Q))/RD, side=(P,Q,R)=>Math.sign((Q[0]-P[0])*(R[1]-P[1])-(Q[1]-P[1])*(R[0]-P[0])), cc=(P,Q,R)=>{const d=2*(P[0]*(Q[1]-R[1])+Q[0]*(R[1]-P[1])+R[0]*(P[1]-Q[1])), s=p=>p[0]*p[0]+p[1]*p[1], x=(s(P)*(Q[1]-R[1])+s(Q)*(R[1]-P[1])+s(R)*(P[1]-Q[1]))/d, y=(s(P)*(R[0]-Q[0])+s(Q)*(P[0]-R[0])+s(R)*(Q[0]-P[0]))/d; return [x,y];}, cyc=(P,Q,R,S)=>{const c=cc(P,Q,R); return Math.abs(len(c,P)-len(c,S))<1e-9;}, view=(P,Q,th,phi)=>{const m=[(P[0]+Q[0])/2,(P[1]+Q[1])/2], L=len(P,Q), n=[-(Q[1]-P[1])/L,(Q[0]-P[0])/L], hh=L/2/Math.tan(th*RD), R=L/2/Math.sin(th*RD), c=[m[0]+n[0]*hh,m[1]+n[1]*hh]; return [c[0]+R*Math.cos(phi*RD),c[1]+R*Math.sin(phi*RD)];}, ft=(P,Q,R)=>{const t=dot(v(Q,P),v(Q,R))/dot(v(Q,R),v(Q,R)); return [Q[0]+t*(R[0]-Q[0]),Q[1]+t*(R[1]-Q[1])];}, pl=(c,r,a)=>[c[0]+r*Math.cos(a*RD),c[1]+r*Math.sin(a*RD)];';
  const chk = body => `(() => { ${LIB} ${body} })()`;
  /* ==== /図の道具 ==== */

  const Oc = [0, 0];
  // 四角形 ABCD と、2本の対角線
  const quad = (k, A, B1, C, D) => { k.ln(A, B1).ln(B1, C).ln(C, D).ln(D, A).ln(A, C).ln(B1, D); [A, B1, C, D].forEach(p => k.dot(p)); };

  // 今日の問い：ゴールの両はし A、B（円 O の周上、中心角 60°）。P、Q、R は、同じ円の長いほうの弧の上（∠APB＝∠AQB＝∠ARB＝30°）。解答＝その弧
  const A1 = pol(Oc, 3, 240), B1 = pol(Oc, 3, 300), P1 = pol(Oc, 3, 95), Q1 = pol(Oc, 3, 160), R1 = pol(Oc, 3, 28);
  const figMain = CF([-3.8, -3.6, 3.8, 3.9], '', (k, r) => {
    [P1, Q1, R1].forEach(p => { k.ln(p, A1).ln(p, B1); k.dot(p); k.am(p, A1, B1, 6); });
    k.ln(A1, B1, 0.9).dot(A1).dot(B1);
    k.al(P1, A1, B1, 12, '30°');
    k.lb(A1, 'A', 205, 3.4).lb(B1, 'B', 335, 3.4).lb(P1, 'P', 95, 3.2).lb(Q1, 'Q', 160, 3.2).lb(R1, 'R', 25, 3.2);
    r.arc(Oc, 3, -60, 240, 0.5);
  });

  // 例題：線分 BC（B(0,0)、C(4,0)）を、上がわから見る。ア＝A、D から 70° で見こむ（4点は円周上）／イ＝A から 70°、D から 55°（D は円の外）
  const Bx = [0, 0], Cx = [4, 0], ci70 = viewCirc(Bx, Cx, 70), ci55 = viewCirc(Bx, Cx, 55);
  const Aa = pol(ci70.c, ci70.r, 135), Da = pol(ci70.c, ci70.r, 50), Di = pol(ci55.c, ci55.r, 72);
  const sh = (p, d) => [p[0] + d, p[1]];
  const panel = (k, r, dx, Dp, tag) => {
    const B2 = sh(Bx, dx), C2p = sh(Cx, dx), A2 = sh(Aa, dx), D2 = sh(Dp, dx);
    quad(k, A2, B2, C2p, D2);
    k.am(A2, B2, C2p, 5).am(D2, B2, C2p, 5);
    k.lb(A2, 'A', 150, 3.4).lb(D2, 'D', 40, 3.4).lb(B2, 'B', 225, 3.4).lb(C2p, 'C', 315, 3.4).cap([dx + 2, 4.6], tag);
    r.circ(sh(ci70.c, dx), ci70.r, 0.5);
  };
  const figEx = CF([-1.3, -1.9, 11.3, 5.1], '', (k, r) => { panel(k, r, 0, Da, 'ア'); panel(k, r, 6, Di, 'イ'); });

  // 演習プリント 図1：B 214°、C 326°、D 35°、A 150°（∠BAC＝∠BDC＝56°。4点は円周上）
  const B1a = pol(Oc, 3, 214), C1a = pol(Oc, 3, 326), D1a = pol(Oc, 3, 35), A1a = pol(Oc, 3, 150);
  const fig1 = CF([-3.7, -3.7, 3.7, 3.7], '図1', (k, r) => {
    quad(k, A1a, B1a, C1a, D1a);
    k.am(A1a, B1a, C1a, 5).al(A1a, B1a, C1a, 9.5, '56°').am(D1a, B1a, C1a, 5).al(D1a, B1a, C1a, 9.5, '56°');
    k.lb(A1a, 'A', 150, 3.4).lb(B1a, 'B', 214, 3.4).lb(C1a, 'C', 326, 3.4).lb(D1a, 'D', 35, 3.4);
    r.circ(Oc, 3, 0.5);
  });
  // 図2：A(−2.2,2.2)、D(2.2,2.2)。B は AD を下から 62° で、C は 70° で見こむ（4点は円周上にない）
  const A2f = [-2.2, 2.2], D2f = [2.2, 2.2], cB = viewCirc(D2f, A2f, 62), cC = viewCirc(D2f, A2f, 70);
  const B2f = pol(cB.c, cB.r, 235), C2f = pol(cC.c, cC.r, 300);
  const fig2 = CF([-3.3, -1.9, 3.3, 3.9], '図2', (k) => {
    quad(k, A2f, B2f, C2f, D2f);
    k.am(B2f, A2f, D2f, 5).al(B2f, A2f, D2f, 9.5, '62°').am(C2f, A2f, D2f, 5).al(C2f, A2f, D2f, 9.5, '70°');
    k.lb(A2f, 'A', 135, 3.4).lb(D2f, 'D', 45, 3.4).lb(B2f, 'B', 225, 3.4).lb(C2f, 'C', 315, 3.4);
  });
  // 図3：A 100°、B 234°、C 326°、D 24°（弧 AD＝76°、弧 BC＝92°、弧 CD＝58°）。∠ABD＝∠ACD＝38°、∠BAC＝46°、∠CAD＝29°
  const A3 = pol(Oc, 3, 100), B3 = pol(Oc, 3, 234), C3 = pol(Oc, 3, 326), D3 = pol(Oc, 3, 24);
  const fig3 = CF([-3.7, -3.7, 3.7, 3.8], '図3', (k, r) => {
    quad(k, A3, B3, C3, D3);
    k.am(A3, B3, C3, 5).al(A3, B3, C3, 9, '46°').am(A3, C3, D3, 7.5).al(A3, C3, D3, 12.5, '29°');
    k.am(B3, A3, D3, 5).al(B3, A3, D3, 9, '38°').am(C3, A3, D3, 5).al(C3, A3, D3, 9, '38°');
    k.lb(A3, 'A', 100, 3.4).lb(B3, 'B', 234, 3.4).lb(C3, 'C', 326, 3.4).lb(D3, 'D', 24, 3.4);
    r.circ(Oc, 3, 0.5);
  });

  // （7）図4：円 O（半径 3）。A 230°、B 310°（中心角 80°）、P は長いほうの弧の上（∠APB＝40°）。X は円の内側、Y は円の外側
  const A4 = pol(Oc, 3, 230), B4 = pol(Oc, 3, 310), P4 = pol(Oc, 3, 125), X4 = [0.55, 0.9], Y4 = [0.7, 4.35];
  const fig4 = CF([-3.6, -3.5, 3.6, 5.1], '図4', (k) => {
    k.circ(Oc, 3);
    [P4, X4, Y4].forEach(p => k.ln(p, A4).ln(p, B4));
    [A4, B4, P4, X4, Y4].forEach(p => k.dot(p));
    k.lb(A4, 'A', 215, 3.4).lb(B4, 'B', 325, 3.4).lb(P4, 'P', 125, 3.2).lb(X4, 'X', 0, 3.0).lb(Y4, 'Y', 90, 3.2);
  });

  // （8）図5：鋭角三角形 ABC（B(0,0)、C(6,0)、A(2,4.8)）。B から AC への垂線の足 D、C から AB への垂線の足 E。解答＝BC を直径とする円
  const Bt = [0, 0], Ct = [6, 0], At = [2, 4.8];
  const foot = (P, Q, R) => { const t = ((P[0] - Q[0]) * (R[0] - Q[0]) + (P[1] - Q[1]) * (R[1] - Q[1])) / ((R[0] - Q[0]) ** 2 + (R[1] - Q[1]) ** 2); return [Q[0] + t * (R[0] - Q[0]), Q[1] + t * (R[1] - Q[1])]; };
  const Dt = foot(Bt, At, Ct), Et = foot(Ct, At, Bt), Mt = [3, 0];
  const fig5 = CF([-1.2, -3.5, 7.2, 5.9], '', (k, r) => {
    k.ln(At, Bt).ln(Bt, Ct).ln(Ct, At).ln(Bt, Dt).ln(Ct, Et);
    [At, Bt, Ct, Dt, Et].forEach(p => k.dot(p));
    k.rt(Dt, Bt, Ct, 2.2).rt(Et, Ct, Bt, 2.2);
    k.lb(At, 'A', 90, 3.2).lb(Bt, 'B', 225, 3.4).lb(Ct, 'C', 315, 3.4).lb(Dt, 'D', 20, 3.4).lb(Et, 'E', 160, 3.4);
    r.circ(Mt, 3, 0.5).dot(Mt).lb(Mt, 'M', 270, 3.2);
  });

  // 検算に使う座標（図と同じ）
  const quizS = (th1, th2) => `const B=[0,0],C=[4,0],A=view(B,C,${th1},125),E=view(B,C,${th2},55);`;

  IK.lesson('en-05', {
    unit: 'en', unitName: '円', form: 'new', no: '第5時', title: '同じ角度に見える場所は、どこにあるだろう',
    summary: 'ゴールを同じ大きさの角で見こむ位置が、どんな線の上に並ぶかを予想し、円周角の定理の逆（同じ側・等しい角 → 4点が1つの円周上）をとらえる。4点が円周上にあるかを判断する。',
    head: '円　第5時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：A(−1.5…)、B は円 O（半径 3）の周上で中心角 60°（AB＝3＝半径）。P、Q、R は、AB の同じ側で、∠APB＝∠AQB＝∠ARB＝30°
      chk(`const A=${J(A1)},B=${J(B1)},O=[0,0],S=[${J(P1)},${J(Q1)},${J(R1)}]; return S.every(P => near(ang(P,A,B),30) && side(A,B,P)===side(A,B,S[0]) && near(len(O,P),3)) && near(ang(O,A,B),60) && near(len(A,B),len(O,A));`),
      // 例題 ア：∠BAC＝∠BDC＝70°（A、D は BC の同じ側）→ 4点は円周上。イ：∠BAC＝70°、∠BDC＝55° → 円周上にない
      chk(`const B=[0,0],C=[4,0],A=${J(Aa)},Da=${J(Da)},Di=${J(Di)}; return near(ang(A,B,C),70) && near(ang(Da,B,C),70) && side(B,C,A)===side(B,C,Da) && cyc(B,C,A,Da) && near(ang(Di,B,C),55) && side(B,C,A)===side(B,C,Di) && !cyc(B,C,A,Di);`),
      // 図1・（1）：∠BAC＝∠BDC＝56°（同じ側）→ 円周上
      chk(`const A=${J(A1a)},B=${J(B1a)},C=${J(C1a)},D=${J(D1a)}; return near(ang(A,B,C),56) && near(ang(D,B,C),56) && side(B,C,A)===side(B,C,D) && cyc(B,C,A,D);`),
      // 図2・（2）：∠ABD＝62°、∠ACD＝70°（B、C は AD の同じ側）→ 円周上にない
      chk(`const A=${J(A2f)},D=${J(D2f)},B=${J(B2f)},C=${J(C2f)}; return near(ang(B,A,D),62) && near(ang(C,A,D),70) && side(A,D,B)===side(A,D,C) && !cyc(A,D,B,C);`),
      // 図3・（3）：∠ABD＝∠ACD＝38° → 円周上。∠BAC＝46° → ∠BDC＝46°、∠CAD＝29° → ∠CBD＝29°
      chk(`const A=${J(A3)},B=${J(B3)},C=${J(C3)},D=${J(D3)}; return near(ang(B,A,D),38) && near(ang(C,A,D),38) && side(A,D,B)===side(A,D,C) && cyc(A,D,B,C) && near(ang(A,B,C),46) && near(ang(A,C,D),29) && near(ang(D,B,C),46) && near(ang(B,C,D),29);`),
      // （4）AB＝5m、∠APB＝30°：中心 O、半径 5（△OAB は正三角形）、中心角 ∠AOB＝60°
      chk('const O=[0,0],A=pl(O,5,240),B=pl(O,5,300),P=pl(O,5,100); return near(len(A,B),5) && near(ang(P,A,B),30) && near(ang(O,A,B),60) && near(len(O,A),len(A,B)) && near(5/(2*Math.sin(30*RD)),5);'),
      // （5）A(−2,0)、B(2,0)。P は上から、Q は下から 50° で見こむ（反対側）→ 4点は円周上にない（50+50≠180）
      chk('const A=[-2,0],B=[2,0],P=view(A,B,50,100),Q=view(B,A,50,260); return near(ang(P,A,B),50) && near(ang(Q,A,B),50) && side(A,B,P)!==side(A,B,Q) && !cyc(A,B,P,Q);'),
      // （6）弧 AB＝128°、弧 BC＝76°、弧 CD＝80°、弧 DA＝76°（A 90°）：∠BAC＝∠BDC＝38°、∠ACB＝64° → ∠ADB＝64°、∠ABC＝78°
      chk('const O=[0,0],A=pl(O,3,90),B=pl(O,3,218),C=pl(O,3,294),Dd=pl(O,3,14); return near(ang(A,B,C),38) && near(ang(Dd,B,C),38) && near(ang(C,A,B),64) && near(ang(Dd,A,B),64) && near(ang(B,A,C),78) && near(180-38-64,78);'),
      // （7）図4：∠APB＝40°。内側の X は 40° より大きく、外側の Y は 40° より小さい（答えは紙面に載せない。図が正しいことだけ確かめる）
      chk(`const A=${J(A4)},B=${J(B4)},P=${J(P4)},X=${J(X4)},Y=${J(Y4)},O=[0,0]; return near(ang(P,A,B),40) && ang(X,A,B)>40 && ang(Y,A,B)<40 && len(O,X)<3 && len(O,Y)>3 && side(A,B,P)===side(A,B,X) && side(A,B,P)===side(A,B,Y);`),
      // （8）図5：BD⊥AC、CE⊥AB。∠BDC＝∠BEC＝90°（D、E は BC の同じ側）→ 4点は円周上。BC が直径で、中心は BC の中点 M。BC＝12cm なら半径 6cm
      chk(`const B=${J(Bt)},C=${J(Ct)},A=${J(At)},D=ft(B,A,C),E=ft(C,A,B),M=mid2(B,C); function mid2(P,Q){return [(P[0]+Q[0])/2,(P[1]+Q[1])/2];} return near(ang(D,B,C),90) && near(ang(E,B,C),90) && side(B,C,D)===side(B,C,E) && cyc(B,C,D,E) && near(len(M,D),len(B,C)/2) && near(len(M,E),len(B,C)/2) && near(12/2,6);`),
      // 小テスト（1）ア：47° と 47°（同じ側）→ 円周上。イ：60° と 65° → ない。ウ：∠ABD＝∠ACD＝35°（B、C は AD の同じ側）→ 円周上
      chk(`${quizS(47, 47)} const Bq=[0,0],Cq=[4,0],A2=view(Bq,Cq,60,125),E2=view(Bq,Cq,65,55),Ad=[0,0],Dd=[4,0],Bb=view(Dd,Ad,35,235),Cc=view(Dd,Ad,35,300); return near(ang(A,B,C),47) && near(ang(E,B,C),47) && cyc(B,C,A,E) && near(ang(A2,Bq,Cq),60) && near(ang(E2,Bq,Cq),65) && !cyc(Bq,Cq,A2,E2) && near(ang(Bb,Ad,Dd),35) && near(ang(Cc,Ad,Dd),35) && side(Ad,Dd,Bb)===side(Ad,Dd,Cc) && cyc(Ad,Dd,Bb,Cc);`),
      // 小テスト（3）弧 AB＝134°、弧 BC＝82°、弧 CD＝70°、弧 DA＝74°（A 90°）：∠BAC＝∠BDC＝41°、∠ACB＝67° → ∠ADB＝67°、∠ABC＝72°
      chk('const O=[0,0],A=pl(O,3,90),B=pl(O,3,224),C=pl(O,3,306),Dd=pl(O,3,16); return near(ang(A,B,C),41) && near(ang(Dd,B,C),41) && near(ang(C,A,B),67) && near(ang(Dd,A,B),67) && near(ang(B,A,C),72) && near(180-41-67,72);'),
      // 小テスト（4）P は上から、Q は下から 55° で見こむ（反対側）→ 円周上にない
      chk('const A=[-2,0],B=[2,0],P=view(A,B,55,100),Q=view(B,A,55,260); return near(ang(P,A,B),55) && near(ang(Q,A,B),55) && side(A,B,P)!==side(A,B,Q) && !cyc(A,B,P,Q);'),
      // 小テスト（5）チャレンジ：∠ACB＝∠ADB＝90°（C、D は AB の同じ側）→ AB が直径。中心は AB の中点
      chk('const O=[0,0],A=pl(O,3,180),B=pl(O,3,0),C=pl(O,3,50),Dd=pl(O,3,110); return near(ang(C,A,B),90) && near(ang(Dd,A,B),90) && side(A,B,C)===side(A,B,Dd) && cyc(A,B,C,Dd) && near(len(O,C),len(O,A)) && near(len(O,Dd),len(O,B)) && near(O[0],(A[0]+B[0])/2);')
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('同じ角度に見える場所は、どこにあるだろう'),
      K('今日の問い', 'ゴールの両はしのポスト A、B を、30° の角で見こむ位置が P、Q、R である。ほかに、30° に見える位置は、どこにあるだろう。', 2),
      F(5, figMain),
      T('①', '自分の考え（3分）　見える位置を図に足して、並び方を書こう。', 1),
      B(3, '（例）P、Q、R は、A、B を通る 1つの円の弧の上に並んでいる。\nほかの位置も、その弧の上にありそうだ。'),
      T('②', 'ペアの考え（3分）　自分とちがう気づきや、確かめ方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('線分 AB を、直線 AB の{{同じ側}}から、同じ大きさの角で見こむ 2点 P、Q があるとき、4点 A、B、P、Q は{{1つの円周上}}にある。\nこれを、円周角の定理の{{逆}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'A、D は、直線 BC の{{同じ側}}にある。ア・イで、4点 A、B、C、D が 1つの円周上にあるといえるか、調べて表を完成させよう。', 2),
      C2([
        TB('', ['ア', 'イ'], [
          ['∠BAC', ['70°', '70°']],
          ['∠BDC', ['70°', '55°']],
          ['4点は同じ円周上に', ['{{ある}}', '{{ない}}']]
        ], { hw: 40 })
      ], [F(5, figEx)], '1:1'),
      T('', '【判断のくふう】円周上にあるかは、何と何をくらべればよいだろう。', 1),
      B(3, '同じ側から線分 BC を見こむ角（∠BAC と ∠BDC）が、等しいかどうか。\n等しければ、4点は 1つの円周上にある。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 同じ弧に対する円周角は{{等しい}}。直径に対する円周角は{{90°}}である。\n② 2点 P、Q が直線 AB の{{同じ側}}にあり、∠APB＝∠AQB ならば、\n　 4点 A、B、P、Q は{{1つの円周上}}にある。\n③ ②を、円周角の定理の{{逆}}という。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3),
      C2([
        T('（1）', '図1の 4点 A、B、C、D は、1つの円周上にあるといえるか。（A、D は直線 BC の同じ側）', 3),
        B(3, 'いえる\n∠BAC＝∠BDC\nだから。')
      ], [
        T('（2）', '図2の 4点 A、B、C、D は、1つの円周上にあるといえるか。（B、C は直線 AD の同じ側）', 3),
        B(3, 'いえない\n∠ABD と ∠ACD が\n等しくないから。')
      ], '1:1'),
      MA('【説明】4点が 1つの円周上にあるかどうかの調べ方を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '円周角の定理の逆を使って、角や長さを求めよう。'),
      C2([
        T('（3）', '図3の四角形 ABCD で、∠ABD＝∠ACD＝38°。∠BDC と ∠CBD の大きさを求めよう。', 4),
        B(3, '4点は同じ円周上\n∠BDC＝∠BAC＝46°\n∠CBD＝∠CAD＝29°')
      ], [
        T('（4）', 'ゴールのはば AB＝5\\m。∠APB＝30° となる P は、A、B を通る円 O の周上にある。∠AOB と半径を求めよう。', 4),
        B(3, '∠AOB＝30°×2＝60°\n△OAB は正三角形\n半径は 5\\m')
      ], '1:1'),
      C2([
        T('（5）', 'P、Q は直線 AB の反対側にある。∠APB＝∠AQB＝50° のとき、4点 A、B、P、Q は 1つの円周上にあるといえるか。', 4),
        B(2, 'いえない\n反対側だから。')
      ], [
        T('（6）', '四角形 ABCD で、∠BAC＝∠BDC＝38°、∠ACB＝64°。∠ADB と ∠ABC を求めよう。', 4),
        B(3, '∠ADB＝∠ACB＝64°\n∠ABC＝180°−38°\n　　−64°＝78°')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：円の内側・外側から見ると、角はどうなるか調べよう。'),
      T('（7）', '図4は、∠APB＝40° の円である。円の内側の点 X と、外側の点 Y から、A、B を見こむ角を、分度器ではかって、表にまとめよう。', 3),
      C2([
        F(6, fig4)
      ], [
        TB('点', ['P', 'X', 'Y'], [['∠の大きさ', ['40°', '', '']]], { hw: 26 }),
        T('', '気づいたこと', 1),
        B(3, '')
      ], '1:1'),
      T('', '円の内側・外側に、ほかの点をとって、同じように確かめよう。', 1),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '図5の鋭角三角形 ABC で、B から AC に垂線 BD、C から AB に垂線 CE をひく。4点 B、C、D、E は 1つの円周上にあるといえるか。理由も書こう。また、BC＝12cm のとき、この円の半径を求めよう。', 8),
        B(6, '∠BDC＝∠BEC＝90°で、\nD、E は直線 BC の\n同じ側だから、4点は\n1つの円周上にある。\nBC が直径だから、\n半径は 6cm')
      ], [
        F(5, fig5),
        MA('① ∠BDC と ∠BEC は、それぞれ何度かな。\n② 90° の円周角は、どんな弧に対する角だったかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', 'A、D は直線 BC の同じ側にある。次のとき、4点 A、B、C、D が 1つの円周上にあるといえるものには ○、いえないものには × を書こう。（3点）\nア ∠BAC＝47°、∠BDC＝47°\nイ ∠BAC＝60°、∠BDC＝65°\nウ ∠ABD＝∠ACD＝35°（B、C は直線 AD の同じ側）', 5),
      B(1, 'ア ○　　イ ×　　ウ ○'),
      T('（2）', '線分 AB を、同じ側から同じ大きさの角で見こむ 2点 P、Q がある。4点 A、B、P、Q は、どうなっているか。（2点）', 2),
      B(1, '1つの円周上にある'),
      T('（3）', '四角形 ABCD で、∠BAC＝∠BDC＝41°、∠ACB＝67°。∠ADB と ∠ABC を求めよう。（3点）', 2),
      B(3, '4点は 1つの円周上\n∠ADB＝∠ACB＝67°　　∠ABC＝180°−41°−67°＝72°'),
      T('（4）', 'P、Q は直線 AB の反対側にある。∠APB＝∠AQB＝55° のとき、4点 A、B、P、Q は 1つの円周上にあるといえるか。（2点）', 2),
      B(2, 'いえない（P、Q が、直線 AB の反対側にあるから）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '四角形 ABCD で、∠ACB＝∠ADB＝90° である。4点 A、B、C、D を通る円の中心は、どこにあるか。', 2),
      B(3, '90° の円周角は、半円の弧に対する角だから、AB が直径。\n中心は、辺 AB の中点。')
    ]
  });
})();
