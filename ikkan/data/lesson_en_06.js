/* 円（新しい形） 第6時：円の外の点から、接線を作図しよう（円の性質の利用）。
   元：授業ナビ標準版 en-06（活）。「円の外の点 A から接線をひくとき、接点 P はどこか」を「今日の問い」に、接線の作図（AO を直径とする円）を「例題」に、
   「2本の接線の長さが等しいわけ」を考えよう（演習プリント（7））にした（授業ナビの考えよう「使った性質をあげる」は、ことば・例題に答えが出るので使わない）。
   ・ワークシートは A4 1枚：問いは1つ（接点がどんな点かを見つける）。個人3分 → ペア3分 → ことば → 例題（作図の手順の空欄。作図の跡は、解答のとき赤）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（作図 1）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（4辺が円に接する四角形。ヒントカードつき）。
   ・作図の問題は、「2本の接線」を作図する（答えが図に 1通りに決まる）。問題として出す図は黒、作図の跡（弧・補助線・円）は、解答のときだけ赤。
   ・円・接線・弧は SVG の path と circle。接点・交点の座標は、中心・半径・向き（度）から計算し、接線と半径が垂直なこと・接線の長さ・角は座標から出しなおした。
   検算：node tools/verify.cjs en-06　／　見た目：node tools/check.cjs <出力先> en-06 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;

  /* ==== 図の道具（円・弧・弦・角のしるし。この単元の4時間で、同じものを使う）====
     座標は数学の向き（y が上）、角度は度。CF(範囲 [x0, y0, x1, y1], 図の番号, (k, r) => { … })
     k＝黒（問題として出す図）、r＝赤（作図の跡・答え。解答のときだけ出る）。どちらにも、次の道具がある。
       ln(p, q, 太さ, 点線)　arc(中心, 半径, 角0, 角1)＝弧（角0 → 角1 は反時計まわり）　circ(中心, 半径)　dot(p)
       lbf(p, 字, 向き)＝点の名前（線や字をよけて、自動でおく。線をかいたあとに呼ぶ）　lb(p, 字, 向き, きょり mm)＝場所を決めて置く　tx(p, 字, dx, dy)　cap(p, 字)＝ア・イの見出し
       am(頂点, 点, 点, 半径 mm)＝角のしるし　alf(頂点, 点, 点, 字, 最小のきょり mm)＝角の大きさの字（自動）　rt(頂点, 点, 点, 大きさ mm)＝直角のしるし */
  const INK = '#222', RED = '#d62828', D2R = Math.PI / 180;
  const pol = (c, r, a) => [c[0] + r * Math.cos(a * D2R), c[1] + r * Math.sin(a * D2R)];   // 中心 c から、向き a（度）、きょり r の点
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const dir = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) / D2R;                       // c から見た p の向き（度）
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const CF = (box, cap, build) => SVG((W, H, h) => {
    const [x0, y0, x1, y1] = box, pad = 2.5, f2 = h.f2, top = cap ? 4 : 0;
    const s = Math.min((W - 2 * pad) / (x1 - x0), (H - top - 2 * pad) / (y1 - y0));
    const X = x => (W - (x1 - x0) * s) / 2 + (x - x0) * s, Y = y => top + (H - top - (y1 - y0) * s) / 2 + (y1 - y) * s;
    const obs = [], rects = [];   // 線・弧・点の上の点（mm）と、置いた字の枠。字をおく場所をさがすとき、よけるもの
    const emOf = IK.render.emOf, strip = t => String(t).replace(/\{\{|\}\}|\\/g, '');
    const sample = (ax, ay, bx, by) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5)); for (let i = 0; i <= n; i++) obs.push([ax + (bx - ax) * i / n, ay + (by - ay) * i / n]); };
    const sampleArc = (cx, cy, r, a0, a1) => { const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * D2R * r / 0.5)); for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; obs.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); } };
    const box0 = (t, sz) => [emOf(strip(t).replace(/°/g, '.')) * sz * 0.85 / 2 + 0.6, sz * 0.55 + 0.4];                // 字の枠の半分の大きさ（mm）
    const free = (cx, cy, hw, hh, mg) => cx - hw >= 0.3 && cx + hw <= W - 0.3 && cy - hh >= top && cy + hh <= H - 0.3 && !obs.some(q => Math.abs(q[0] - cx) < hw + mg && Math.abs(q[1] - cy) < hh + mg) && !rects.some(q => Math.abs(q[0] - cx) < hw + q[2] && Math.abs(q[1] - cy) < hh + q[3]);
    const mk = col => {
      const o = { s: '' }, dsh = ' stroke-dasharray="1.4 1"';
      const turn = (V, P, Q) => { const a1 = dir(V, P), a2 = dir(V, Q); return [a1, ((a2 - a1 + 540) % 360) - 180]; };   // 角の始まりの向きと、まわる角（−180〜180）
      o.ln = (p, q, w, dash) => { sample(X(p[0]), Y(p[1]), X(q[0]), Y(q[1])); o.s += h.ln(X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), col, w || 0.32, ' stroke-linecap="round"' + (dash ? dsh : '')); return o; };
      o.arc = (c, r, a0, a1, w, dash) => {
        const p0 = pol(c, r, a0), p1 = pol(c, r, a1), rs = r * s;
        sampleArc(X(c[0]), Y(c[1]), rs, a0, a1);
        o.s += `<path d="M${f2(X(p0[0]))},${f2(Y(p0[1]))} A${f2(rs)},${f2(rs)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${f2(X(p1[0]))},${f2(Y(p1[1]))}" fill="none" stroke="${col}" stroke-width="${w || 0.32}" stroke-linecap="round"${dash ? dsh : ''}/>`; return o;
      };
      o.circ = (c, r, w, dash) => { sampleArc(X(c[0]), Y(c[1]), r * s, 0, 360); o.s += `<circle cx="${f2(X(c[0]))}" cy="${f2(Y(c[1]))}" r="${f2(r * s)}" fill="none" stroke="${col}" stroke-width="${w || 0.32}"${dash ? dsh : ''}/>`; return o; };
      o.dot = (p, r) => { obs.push([X(p[0]), Y(p[1])]); o.s += `<circle cx="${f2(X(p[0]))}" cy="${f2(Y(p[1]))}" r="${r || 0.7}" fill="${col}"/>`; return o; };
      o.tx = (p, t, dx, dy, an, size) => {   // (dx, dy)＝字の中心のずれ（mm。下が +）
        const sz = size || 3, cx = X(p[0]) + (dx || 0), cy = Y(p[1]) + (dy || 0);
        if (!an || an === 'middle') { const [hw, hh] = box0(t, sz); rects.push([cx, cy, hw, hh]); }
        o.s += h.rich(cx, cy + sz * 0.34, t, sz, an || 'middle'); return o;
      };
      o.lb = (p, t, a, d, size) => o.tx(p, t, d * Math.cos(a * D2R), -d * Math.sin(a * D2R), 'middle', size);   // 向き a、きょり d の決まった場所
      // 点の名前：向き pref（度）のほうに、線や字をよけて、自動でおく
      o.lbf = (p, t, pref, d0, size) => {
        const sz = size || 3, [hw, hh] = box0(t, sz), px = X(p[0]), py = Y(p[1]);
        for (const [mg, ddm] of [[0.5, 2.4], [0.1, 2.4], [0.5, 6], [0.1, 6]]) for (const off of [0, 22, -22, 45, -45, 67, -67, 90, -90, 112, -112, 135, -135, 157, -157, 180]) for (let dd = 0; dd <= ddm; dd += 0.8) {
          const a = (pref + off) * D2R, d = (d0 || 1.4) + dd + Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh, cx = px + d * Math.cos(a), cy = py - d * Math.sin(a);
          if (free(cx, cy, hw, hh, mg)) return o.tx(p, t, cx - px, cy - py, 'middle', sz);
        }
        return o.lb(p, t, pref, 3.4, sz);
      };
      o.cap = (p, t) => { o.s += h.tx(X(p[0]), Y(p[1]) + 1, h.svgMath(t), 3, 'middle', ' class="cap"'); return o; };
      o.am = (V, P, Q, rm, w) => {
        const [a1, d] = turn(V, P, Q), vx = X(V[0]), vy = Y(V[1]), e = a1 + d;
        sampleArc(vx, vy, rm, a1, e);
        o.s += `<path d="M${f2(vx + rm * Math.cos(a1 * D2R))},${f2(vy - rm * Math.sin(a1 * D2R))} A${rm} ${rm} 0 0 ${d > 0 ? 0 : 1} ${f2(vx + rm * Math.cos(e * D2R))},${f2(vy - rm * Math.sin(e * D2R))}" fill="none" stroke="${col}" stroke-width="${w || 0.28}"/>`; return o;
      };
      // 角の大きさの字：頂点から、角の二等分線の上を、rmin（mm）から遠ざけながら、線や字にふれない場所をさがす
      o.alf = (V, P, Q, t, rmin, size) => {
        const [a1, d] = turn(V, P, Q), m = (a1 + d / 2) * D2R, sz = size || 3, [hw, hh] = box0(t, sz), vx = X(V[0]), vy = Y(V[1]);
        const rmax = Math.min(dist(V, P), dist(V, Q)) * s - 2.5;   // 角の2辺の長さの内がわだけ
        for (const mg of [0.5, 0.1]) for (let rm = rmin || 8; rm < rmax; rm += 0.5) { const cx = vx + rm * Math.cos(m), cy = vy - rm * Math.sin(m); if (free(cx, cy, hw, hh, mg)) return o.tx(V, t, cx - vx, cy - vy, 'middle', sz); }
        return o.tx(V, t, (rmin || 8) * Math.cos(m), -(rmin || 8) * Math.sin(m), 'middle', sz);
      };
      o.rt = (V, P, Q, m) => {
        const a1 = dir(V, P) * D2R, a2 = dir(V, Q) * D2R, u = [Math.cos(a1), -Math.sin(a1)], w = [Math.cos(a2), -Math.sin(a2)], vx = X(V[0]), vy = Y(V[1]), mm = m || 2.6;
        sample(vx + u[0] * mm, vy + u[1] * mm, vx + (u[0] + w[0]) * mm, vy + (u[1] + w[1]) * mm); sample(vx + (u[0] + w[0]) * mm, vy + (u[1] + w[1]) * mm, vx + w[0] * mm, vy + w[1] * mm);
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

  const O0 = [0, 0];
  const boxOf = (pts, m) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m]; };
  const circPts = (c, r) => [0, 90, 180, 270].map(a => pol(c, r, a));
  // 円 O（半径 R）の外の点 A からひく、2本の接線の接点 [P, Q]（O から A を見る向きの、左まわりがわが P）
  const tPts = (O, R, A) => { const th = Math.acos(R / dist(O, A)) / D2R, a = dir(O, A); return [pol(O, R, a + th), pol(O, R, a - th)]; };
  // 接線の作図の跡（赤）：AO の垂直二等分線（A、O を中心とする半径 rho の弧の交点 U、V を通る）で中点 M を求め、M を中心に A を通る円をかく。その円と円 O の交点が接点 P、Q
  const traceAt = (d, o) => { const rho = ((o && o.rho) || 0.63) * d; return { rho, hh: Math.sqrt(rho * rho - d * d / 4) }; };
  const tanTrace = (r, O, R, A, o) => {
    const d = dist(O, A), M = mid(O, A), u = dir(O, A), { rho, hh } = traceAt(d, o), U = pol(M, hh, u + 90), V = pol(M, hh, u - 90), [P, Q] = tPts(O, R, A);
    r.ln(O, A, 0.3);
    [U, V].forEach(Z => { r.arc(A, rho, dir(A, Z) - 15, dir(A, Z) + 15).arc(O, rho, dir(O, Z) - 15, dir(O, Z) + 15); });
    r.ln(pol(M, hh + 0.4, u + 90), pol(M, hh + 0.4, u - 90), 0.4).dot(M);
    r.circ(M, d / 2, 0.32);
    [P, Q].forEach(Z => { r.dot(Z); r.ln(A, pol(A, dist(A, Z) + 0.8, dir(A, Z)), 0.55); });
    return { M, U, V, P, Q };
  };
  const tanBox = (O, R, A, o) => {
    const d = dist(O, A), M = mid(O, A), u = dir(O, A), { hh } = traceAt(d, o), [P, Q] = tPts(O, R, A);
    return boxOf([...circPts(O, R), A, ...circPts(M, d / 2), pol(M, hh + 0.4, u + 90), pol(M, hh + 0.4, u - 90), pol(A, dist(A, P) + 0.8, dir(A, P)), pol(A, dist(A, Q) + 0.8, dir(A, Q))], 0.5);
  };
  // 円 O と外の点 A（黒）。作図の跡と、接点 P、Q・接線（赤）は、解答のときだけ出る
  const tanFig = (cap, O, R, A, o) => CF(tanBox(O, R, A, o), cap, (k, r) => {
    k.circ(O, R).dot(O).dot(A);
    const t = tanTrace(r, O, R, A, o);
    r.lbf(t.M, 'M', dir(t.M, O) + 90).lbf(t.P, 'P', dir(O, t.P)).lbf(t.Q, 'Q', dir(O, t.Q));
    k.lbf(O, 'O', dir(A, O) + 30).lbf(A, 'A', dir(O, A));
  });

  // 今日の問い：円 O（半径 3）の外の点 A（OA＝5）。解答＝接点 P、Q・接線 AP、AQ・半径 OP、OQ（∠APO＝∠AQO＝90°）・AO を直径とする円
  const A0 = [5, 0], [P0, Q0] = tPts(O0, 3, A0), M0 = mid(O0, A0);
  const figMain = CF([-3.6, -3.5, 6.3, 3.5], '', (k, r) => {
    k.circ(O0, 3).dot(O0).dot(A0);
    r.circ(M0, 2.5, 0.32, true);
    [P0, Q0].forEach(Z => { r.ln(A0, pol(A0, dist(A0, Z) + 0.8, dir(A0, Z)), 0.55).ln(O0, Z, 0.3).dot(Z); });
    r.rt(P0, A0, O0, 2.2).rt(Q0, A0, O0, 2.2);
    r.lbf(P0, 'P', dir(O0, P0)).lbf(Q0, 'Q', dir(O0, Q0));
    k.lbf(O0, 'O', 225).lbf(A0, 'A', 0);
  });

  // 例題：円 O（半径 2.5）の外の点 A（OA＝6）。AO の垂直二等分線は、半径 3.8 の弧の交点を通る
  const RE = 2.5, AE = [6, 0], oE = { rho: 3.8 / 6 };
  const figEx = tanFig('', O0, RE, AE, oE);

  // 演習プリント 図1：∠PAQ＝64° になる接線（R＝2、OA＝2÷sin32°）
  const d1 = 2 / Math.sin(32 * D2R), A1 = [d1, 0], [P1, Q1] = tPts(O0, 2, A1);
  const fig1 = CF(boxOf([...circPts(O0, 2), A1], 0.8), '図1', (k) => {
    k.circ(O0, 2).ln(A1, P1).ln(A1, Q1).ln(O0, P1).ln(O0, Q1).ln(P1, Q1);
    [O0, A1, P1, Q1].forEach(Z => k.dot(Z));
    k.am(A1, P1, Q1, 2.8).alf(A1, P1, Q1, '64°', 5.5);
    k.lbf(O0, 'O', 180).lbf(A1, 'A', 0).lbf(P1, 'P', 100).lbf(Q1, 'Q', 260);
  });
  // 図2：△ABC（AB＝8、BC＝7、CA＝9）の 3辺にふれる円（内接円）。AP＝5、BQ＝3、CR＝4
  const B2 = [0, 0], C2p = [7, 0], A2 = [32 / 14, Math.sqrt(64 - (32 / 14) ** 2)];
  const I2 = [(7 * A2[0] + 9 * B2[0] + 8 * C2p[0]) / 24, (7 * A2[1] + 9 * B2[1] + 8 * C2p[1]) / 24], r2 = I2[1];
  const at = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const P2 = at(A2, B2, 5 / 8), Q2 = at(B2, C2p, 3 / 7), R2 = at(C2p, A2, 4 / 9);
  const fig2 = CF(boxOf([A2, B2, C2p], 1.0), '図2', (k) => {
    k.ln(A2, B2).ln(B2, C2p).ln(C2p, A2).circ(I2, r2);
    [A2, B2, C2p, P2, Q2, R2].forEach(Z => k.dot(Z));
    k.lbf(A2, 'A', 90).lbf(B2, 'B', 225).lbf(C2p, 'C', 315).lbf(P2, 'P', 160).lbf(Q2, 'Q', 270).lbf(R2, 'R', 20);
  });
  // 図3：作図の問題。円 O（半径 2.2）と外の点 A（OA＝5.4、向き 150°）
  const A3 = pol(O0, 5.4, 150), fig3 = tanFig('図3', O0, 2.2, A3, { rho: 0.6 });

  // （7）図4：円 O（半径 2.2）、外の点 A（OA＝5.5）。接線 AP、AQ・半径 OP、OQ・AO（点線）
  const A4 = [5.5, 0], [P4, Q4] = tPts(O0, 2.2, A4);
  const fig4 = CF(boxOf([...circPts(O0, 2.2), A4], 0.9), '図4', (k) => {
    k.circ(O0, 2.2).ln(A4, P4).ln(A4, Q4).ln(O0, P4).ln(O0, Q4).ln(O0, A4, 0.3, true);
    [O0, A4, P4, Q4].forEach(Z => k.dot(Z));
    k.lbf(O0, 'O', 200).lbf(A4, 'A', 0).lbf(P4, 'P', 100).lbf(Q4, 'Q', 260);
  });

  // （8）図5：4辺が 1つの円に接する四角形 ABCD。頂点 A、B、C、D から接点までの長さが 2、5、7、3（AB＝7、BC＝12、CD＝10、DA＝5）。円の半径 rQ は、atan(t/r) の和が π になるように決める
  const tn = [2, 5, 7, 3];
  const rQ = (() => { let lo = 0.1, hi = 50; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (tn.reduce((s, t) => s + Math.atan(t / m), 0) - Math.PI > 0) lo = m; else hi = m; } return (lo + hi) / 2; })();
  const dl = tn.map(t => 2 * Math.atan(t / rQ) / D2R);   // 頂点 A、B、C、D のところの、2つの接点のあいだの中心角
  const th0 = 250;                                        // 辺 AB の接点の向き
  const tA = [th0, th0 + dl[1], th0 + dl[1] + dl[2], th0 + dl[1] + dl[2] + dl[3]];   // 辺 AB、BC、CD、DA の接点の向き
  const vQ = [tA[3] + dl[0] / 2, th0 + dl[1] / 2, tA[1] + dl[2] / 2, tA[2] + dl[3] / 2].map((a, i) => pol(O0, Math.hypot(rQ, tn[i]), a));   // A、B、C、D
  const [A5, B5, C5, D5] = vQ;
  const fig5 = CF(boxOf([...circPts(O0, rQ), ...vQ], 0.9), '', (k) => {
    k.circ(O0, rQ).ln(A5, B5).ln(B5, C5).ln(C5, D5).ln(D5, A5);
    vQ.forEach(Z => k.dot(Z));
    k.lbf(A5, 'A', dir(O0, A5)).lbf(B5, 'B', dir(O0, B5)).lbf(C5, 'C', dir(O0, C5)).lbf(D5, 'D', dir(O0, D5));
  });

  // 小テスト（1）：∠PAQ＝44°（R＝2、OA＝2÷sin22°）
  const dq = 2 / Math.sin(22 * D2R), Aq = [dq, 0], [Pq, Qq] = tPts(O0, 2, Aq);
  const figQ1 = CF(boxOf([...circPts(O0, 2), Aq], 0.8), '', (k) => {
    k.circ(O0, 2).ln(Aq, Pq).ln(Aq, Qq).ln(O0, Pq).ln(O0, Qq).ln(Pq, Qq);
    [O0, Aq, Pq, Qq].forEach(Z => k.dot(Z));
    k.am(Aq, Pq, Qq, 2.8).alf(Aq, Pq, Qq, '44°', 5.5);
    k.lbf(O0, 'O', 180).lbf(Aq, 'A', 0).lbf(Pq, 'P', 100).lbf(Qq, 'Q', 260);
  });
  // 小テスト（5）：円 O（半径 3）の外の点 P（PA＝8）。接点 A、B。点 C（向き 0°）での接線が PA、PB と交わる点 D、E
  const dP = Math.hypot(8, 3), P5 = [dP, 0], [Aa5, Ba5] = tPts(O0, 3, P5), C5q = [3, 0];
  const ixTan = (P, Aq2) => { const t = (P[0] - 3) / (P[0] - Aq2[0]); return [3, t * Aq2[1]]; };   // 直線 x＝3 と、P から Aq2 への線分の交点
  const D5q = ixTan(P5, Aa5), E5q = ixTan(P5, Ba5);
  const figQ5 = CF(boxOf([...circPts(O0, 3), P5], 0.8), '', (k) => {
    k.circ(O0, 3).ln(P5, Aa5).ln(P5, Ba5).ln(D5q, E5q);
    [P5, Aa5, Ba5, C5q, D5q, E5q].forEach(Z => k.dot(Z));
    k.lbf(P5, 'P', 0).lbf(Aa5, 'A', 110).lbf(Ba5, 'B', 250).lbf(C5q, 'C', 180).lbf(D5q, 'D', 60).lbf(E5q, 'E', 300);
  });

  const IN = 'inc=(A,B,C)=>{const a=len(B,C),b=len(C,A),c=len(A,B),s=a+b+c; return [(a*A[0]+b*B[0]+c*C[0])/s,(a*A[1]+b*B[1]+c*C[1])/s];}, tp=(P,Q,R)=>{const t=dot(v(P,R),v(P,Q))/dot(v(P,Q),v(P,Q)); return [P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])];},';
  const chk2 = body => `(() => { ${LIB} const ${IN.slice(0, -1)}; ${body} })()`;

  IK.lesson('en-06', {
    unit: 'en', unitName: '円', form: 'new', no: '第6時', title: '円の外の点から、接線を作図しよう',
    summary: '円の外の点から接線をひくとき、接点が「接線⊥半径」と「半円の弧に対する円周角 90°」から決まることに気づき、AO を直径とする円を使って 2本の接線を作図する。接線の長さが等しいことを使う。',
    head: '円　第6時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：O(0,0)、半径 3、A(5,0)。接点 P(1.8,2.4)、Q(1.8,−2.4)。OP⊥AP（内積 0）、∠APO＝90°、AP＝4。P、Q は AO を直径とする円（中心 M(2.5,0)、半径 2.5）の周上
      chk2(`const O=[0,0],A=${J(A0)},M=[2.5,0]; return [${J(P0)},${J(Q0)}].every(P => near(len(O,P),3) && near(dot(v(P,O),v(P,A)),0) && near(ang(P,A,O),90) && near(len(A,P),4) && near(len(M,P),2.5)) && near(len(M,A),2.5) && near(len(M,O),2.5);`),
      // 例題：O(0,0)、半径 2.5、A(6,0)。弧の交点 U、V（AU＝OU＝3.8）は AO の垂直二等分線 x＝3 の上。M(3,0)、半径 MA＝3 の円と円 O の交点 P、Q は、OP⊥AP（接線）
      chk2(`const O=[0,0],A=${J(AE)},rho=3.8,hh=Math.sqrt(rho*rho-9),U=[3,hh],V=[3,-hh],M=[3,0]; const [P,Q]=[${J(tPts(O0, RE, AE))}][0]; return near(len(A,U),rho) && near(len(O,U),rho) && near(len(A,V),rho) && near(len(O,V),rho) && [P,Q].every(Z => near(len(O,Z),2.5) && near(len(M,Z),3) && near(dot(v(Z,O),v(Z,A)),0));`),
      // 図1：R＝2、∠PAQ＝64°（OA＝2÷sin32°）。AP＝AQ、∠APQ＝(180−64)÷2＝58°、∠POQ＝360−90−90−64＝116°
      chk2(`const O=[0,0],A=${J(A1)},P=${J(P1)},Q=${J(Q1)}; return near(ang(A,P,Q),64) && near(len(A,P),len(A,Q)) && near(ang(P,A,Q),58) && near(ang(O,P,Q),116) && near(ang(P,A,O),90) && near((180-64)/2,58) && near(360-90-90-64,116);`),
      // 図2：AB＝8、BC＝7、CA＝9 の内接円。接点 P、Q、R。AP＝5、BQ＝3、CR＝4（AP＋BP＝AB、BQ＋CQ＝BC、CR＋AR＝CA）
      chk2(`const A=${J(A2)},B=${J(B2)},C=${J(C2p)},I=inc(A,B,C),P=tp(A,B,I),Q=tp(B,C,I),R=tp(C,A,I); return near(len(A,B),8) && near(len(B,C),7) && near(len(C,A),9) && near(len(A,P),5) && near(len(B,Q),3) && near(len(C,R),4) && near(len(A,R),len(A,P)) && near(len(B,P),len(B,Q)) && near(len(C,Q),len(C,R)) && near(len(I,P),len(I,Q)) && near(len(I,P),len(I,R)) && near(5+3,8) && near(3+4,7) && near(4+5,9);`),
      // （3）図3：作図の跡の点 P、Q は円 O 上で、AP⊥OP（接線）
      chk2(`const O=[0,0],A=${J(A3)}; return [${J(tPts(O0, 2.2, A3))}][0].every(P => near(len(O,P),2.2)) && ${J(tPts(O0, 2.2, A3))}.every(P => near(len(O,P),2.2) && near(dot(v(P,O),v(P,A)),0));`),
      // （4）AB＝10、BC＝9、CA＝11 の内接円：AP＝(10＋11−9)÷2＝6（座標からも）
      chk2(`const B=[0,0],C=[9,0],x=(100+81-121)/18,A=[x,Math.sqrt(100-x*x)],I=inc(A,B,C),P=tp(A,B,I); return near(len(A,B),10) && near(len(C,A),11) && near(len(A,P),6) && near((10+11-9)/2,6) && near((10-6)+(11-6),9);`),
      // （5）∠PAQ＝60°：R＝2、OA＝2÷sin30°＝4。AP＝AQ＝PQ（正三角形）、∠POQ＝120°
      chk2(`const O=[0,0],A=[4,0],R=2,P=[R*Math.cos(60*RD),R*Math.sin(60*RD)],Q=[P[0],-P[1]]; return near(ang(A,P,Q),60) && near(len(A,P),len(A,Q)) && near(len(A,P),len(P,Q)) && near(ang(O,P,Q),120) && near(360-90-90-60,120);`),
      // （6）AO＝10、半径 4：P(1.6,√(16−2.56))。M(5,0)。MP＝MA＝5、∠APO＝90°
      chk2(`const O=[0,0],A=[10,0],M=[5,0],P=[16/10,Math.sqrt(16-2.56)]; return near(len(O,P),4) && near(dot(v(P,O),v(P,A)),0) && near(ang(P,A,O),90) && near(len(M,P),5) && near(len(M,A),5);`),
      // （7）図4：AP＝AQ、OP＝OQ、OP⊥AP、OQ⊥AQ（△APO≡△AQO を使う。答えは紙面に載せない）
      chk2(`const O=[0,0],A=${J(A4)},P=${J(P4)},Q=${J(Q4)}; return near(len(A,P),len(A,Q)) && near(len(O,P),len(O,Q)) && near(dot(v(P,O),v(P,A)),0) && near(dot(v(Q,O),v(Q,A)),0) && near(ang(A,O,P),ang(A,O,Q));`),
      // （8）図5：AB＝7、BC＝12、CD＝10、DA＝5。円 O（半径 rQ）に 4辺が接する（O から各辺の直線までのきょりが rQ）。AB＋CD＝BC＋DA＝17
      chk2(`const O=[0,0],r=${J(rQ)},V=[${J(A5)},${J(B5)},${J(C5)},${J(D5)}]; const dl=(P,Q)=>Math.abs((Q[0]-P[0])*(0-P[1])-(Q[1]-P[1])*(0-P[0]))/len(P,Q); return near(len(V[0],V[1]),7) && near(len(V[1],V[2]),12) && near(len(V[2],V[3]),10) && near(len(V[3],V[0]),5) && [0,1,2,3].every(i => near(dl(V[i],V[(i+1)%4]),r)) && near(7+10,12+5) && near(7+10-12,5);`),
      // 小テスト（1）：∠PAQ＝44°、R＝2：∠APQ＝(180−44)÷2＝68°、∠POQ＝360−180−44＝136°
      chk2(`const O=[0,0],A=${J(Aq)},P=${J(Pq)},Q=${J(Qq)}; return near(ang(A,P,Q),44) && near(ang(P,A,Q),68) && near(ang(O,P,Q),136) && near((180-44)/2,68) && near(360-90-90-44,136);`),
      // 小テスト（2）AO を直径とする円の周上の点 P：∠APO＝90°　（3）AB＝9、BC＝8、CA＝11：AP＝(9＋11−8)÷2＝6
      chk2(`const A=[0,0],O=[7,0],P=[7/2+3.5*Math.cos(70*RD),3.5*Math.sin(70*RD)]; const B=[0,0],C=[8,0],x=(81+64-121)/16,Ta=[x,Math.sqrt(81-x*x)],I=inc(Ta,B,C),Pt=tp(Ta,B,I); return near(ang(P,A,O),90) && near(len(Ta,B),9) && near(len(C,Ta),11) && near(len(Ta,Pt),6) && near((9+11-8)/2,6);`),
      // 小テスト（4）∠OAP＝34°：R＝2、A から O への向きと AP の角が 34° → OA＝2÷sin34°、∠PAQ＝68°
      chk2(`const O=[0,0],d=2/Math.sin(34*RD),A=[d,0],t=Math.acos(2/d)/RD,P=pl(O,2,t),Q=pl(O,2,-t); return near(ang(A,O,P),34) && near(ang(A,P,Q),68) && near(34*2,68);`),
      // 小テスト（5）チャレンジ：PA＝8、O(0,0)、半径 3。点 C(3,0) での接線 x＝3 が PA、PB と交わる点 D、E。△PDE の周＝2×PA＝16（座標からも）
      chk2(`const P=${J(P5)},A=${J(Aa5)},Bb=${J(Ba5)},D=${J(D5q)},E=${J(E5q)},C=${J(C5q)},O=[0,0]; return near(len(P,A),8) && near(len(P,Bb),8) && near(len(O,C),3) && near(D[0],3) && near(len(D,A),len(D,C)) && near(len(E,Bb),len(E,C)) && near(len(P,D)+len(D,E)+len(E,P),16) && near(2*8,16);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円の外の点から、接線を作図しよう'),
      K('今日の問い', '円 O の外の点 A から、円に接する直線をひきたい。接点 P は、どこにあるだろう。どうすれば見つけられるだろう。', 2),
      F(5, figMain),
      T('①', '自分の考え（3分）　接点が、どんな点か、目をつけたことを書こう。', 1),
      B(3, '（例）接点 P では、半径 OP と接線 AP が垂直だから、∠APO＝90°。\n∠APO＝90° になる点 P を、さがせばよい。'),
      T('②', 'ペアの考え（3分）　自分とちがう見つけ方（使う道具・性質）を書こう。', 1),
      B(2, ''),
      G(1),
      WD('円の接線は、接点を通る半径に{{垂直}}である。\n半円の弧に対する円周角は{{90°}}である。\n円の外の点からの 2つの接線の長さは{{等しい}}。\nAO の{{垂直二等分線}}で、AO の中点を求める。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '円 O の外の点 A から、2本の接線を作図しよう。（作図に使った線は、消さない）\n① AO の垂直二等分線をひき、{{中点}} M を求める。　② M を中心に、半径 {{MA}} の円をかく。\n③ 円 O との{{交点}}を P、Q として、直線 AP、AQ をひく。', 4),
      F(5, figEx),
      T('', '【作図のわけ】∠APO が 90° になるのは、なぜだろう。', 1),
      B(2, 'AO が直径の円の周上の点だから、半円の弧に対する円周角で 90°。\n半径 OP に垂直だから、AP は接線。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 円の接線は、接点を通る半径に{{垂直}}である。\n② 半円の弧に対する円周角は{{90°}}である。\n③ 円の外の点からの 2つの接線の{{長さ}}は等しい。\n④ 接線の作図では、AO の中点 M を中心に、半径 {{MA}} の円をかく。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3),
      C2([
        T('（1）', '図1で、P、Q は接点。∠PAQ＝64° のとき、∠APQ と ∠POQ を求めよう。', 3),
        B(3, '∠APQ＝58°（AP＝AQ）\n∠POQ＝116°\n（四角形の内角の和）')
      ], [
        T('（2）', '図2で、P、Q、R は接点。AP＝5cm、BQ＝3cm、CR＝4cm。3辺の長さを求めよう。', 3),
        B(3, 'AB＝5+3＝8cm\nBC＝3+4＝7cm\nCA＝4+5＝9cm')
      ], '1:1'),
      MA('【説明】接線の作図のしかたと、そのわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '接線の性質を使って、作図したり、長さや角を求めたりしよう。'),
      C2([
        T('（3）', '図3の円 O で、点 A から、円に 2本の接線を作図しよう。', 3)
      ], [
        T('（4）', '△ABC の 3辺に円がふれる。AB＝10cm、BC＝9cm、CA＝11cm。A から接点までの長さを求めよう。', 3),
        B(4, 'AP＝AR＝x、BP＝BQ\n＝10−x、CQ＝CR＝11−x\nBC＝BQ+CQ より\n21−2x＝9　x＝6　6cm')
      ], '1:1'),
      C2([
        T('（5）', '円 O の接線 AP、AQ（P、Q は接点）で、∠PAQ＝60°。△APQ の名前と、∠POQ を答えよう。', 3),
        B(3, '正三角形\n∠POQ＝360°−90°×2\n　　−60°＝120°')
      ], [
        T('（6）', 'M は AO の中点、P は円 M と円 O の交点。AO＝10cm のとき、MP と ∠APO を求めよう。', 3),
        B(3, 'MP＝MA＝5cm\n∠APO＝90°')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：2本の接線の長さが等しいわけを、考えよう。'),
      T('（7）', '図4で、AP、AQ は円 O の接線で、P、Q は接点である。AP＝AQ となるわけを、2つの三角形に目をつけて、説明しよう。', 2),
      C2([
        F(6, fig4)
      ], [
        T('', '目をつける三角形と、等しいところ', 1),
        B(5, '')
      ], '1:1'),
      T('', '説明（仮定・結論・証明の順に書こう）', 1),
      B(5, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '図5の四角形 ABCD の 4つの辺は、すべて 1つの円に接している。AB＝7cm、BC＝12cm、CD＝10cm のとき、DA の長さを求めよう。', 4),
        B(6, 'A、B、C、D から接点\nまでの長さを a、b、c、d\nとすると\nAB＋CD＝a+b+c+d\nBC＋DA＝a+b+c+d\n7+10＝12+DA　DA＝5cm')
      ], [
        F(5, fig5),
        MA('① 各頂点から接点までの長さに、同じ文字をつけてみよう。\n② AB＋CD と BC＋DA を、その文字で表すと？', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図で、P、Q は接点。∠PAQ＝44° のとき、∠APQ と ∠POQ を求めよう。（3点）', 3),
        B(4, '∠APQ＝68°（AP＝AQ より）\n∠POQ＝136°\n（四角形の内角の和）')
      ], [F(6, figQ1)], '3:2'),
      T('（2）', '線分 AO を直径とする円の周上に、点 P をとる。∠APO は何度か。（2点）', 2),
      B(1, '90°（半円の弧に対する円周角）'),
      T('（3）', '△ABC の 3辺に円がふれている。AB＝9cm、BC＝8cm、CA＝11cm のとき、A から接点までの長さを求めよう。（3点）', 3),
      B(2, 'AP＝AR＝x cm とすると　BQ＝9−x、CQ＝11−x\n(9−x)+(11−x)＝8　　x＝6　　6cm'),
      T('（4）', '円 O の外の点 A から、接線 AP、AQ をひく。∠OAP＝34° のとき、∠PAQ を求めよう。（2点）', 2),
      B(2, 'OA は ∠PAQ を 2等分するから\n∠PAQ＝34°×2＝68°'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '図で、PA、PB は円 O の接線（A、B は接点）。点 C での接線が、PA、PB と交わる点を D、E とする。PA＝8cm のとき、△PDE の周の長さを求めよう。', 4),
        B(5, 'DA＝DC、EB＝EC\n周＝PD+DC+CE+EP\n　＝PD+DA+EB+EP\n　＝PA+PB\n　＝16cm')
      ], [F(8, figQ5)], '3:2')
    ]
  });
})();
