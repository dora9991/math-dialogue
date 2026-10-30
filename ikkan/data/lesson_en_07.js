/* 円（新しい形） 第7時：円の中に、相似な三角形を見つけよう（円と相似）。
   元：授業ナビ標準版 en-07（活）。「弦 AB、CD が交わる図で、△PAC と △PDB の関係を見つける」を「今日の問い」に、「△PAC∽△PDB の証明」を「例題」に、
   「PA×PB と PC×PD をくらべる」を考えよう（演習プリント（7））にした（授業ナビの考えようは、PA×PB＝PC×PD のわけの説明。答えが、ワークシート・（1）〜（6）に出ないように作った）。
   ・ワークシートは A4 1枚：問いは1つ（2つの三角形の関係の予想）。個人3分 → ペア3分 → ことば → 例題（相似の証明。仮定・結論に空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（半円と垂線 CH。ヒントカードつき）。
   ・弦の交わる図は、PA・PB・PC・PD の長さから、点（P が原点）と円を計算してかいた（図の長さと問題の数がくいちがわない）。等しい角のしるしは、解答のときだけ赤。
   ・証明は、仮定・結論・証明の形で、全幅の B に書いた。証明は機械で検算できないので、checks には、図の座標で「円周上・相似・長さの比」を確かめる式を書いた。
   検算：node tools/verify.cjs en-07　／　見た目：node tools/check.cjs <出力先> en-07 */
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
        for (const mg of [0.5, 0.1]) for (const dd of [0, 0.8, 1.6, 2.4, 3.2, 4.4]) for (const off of [0, 22, -22, 45, -45, 67, -67, 90, -90, 112, -112, 135, -135, 157, -157, 180]) {
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
  const circum = (P, Q, R) => { const d = 2 * (P[0] * (Q[1] - R[1]) + Q[0] * (R[1] - P[1]) + R[0] * (P[1] - Q[1])), s = p => p[0] * p[0] + p[1] * p[1]; return [(s(P) * (Q[1] - R[1]) + s(Q) * (R[1] - P[1]) + s(R) * (P[1] - Q[1])) / d, (s(P) * (R[0] - Q[0]) + s(Q) * (P[0] - R[0]) + s(R) * (Q[0] - P[0])) / d]; };
  // 2つの弦 AB、CD が点 P（原点）で交わる円。PA、PB、PC、PD の長さと、弦 CD の向き phi（度）から、4点と円（中心 c、半径 r）を決める（PA×PB＝PC×PD のとき、4点は 1つの円周上にある）
  const chordGeo = (pa, pb, pc, pd, phi) => {
    const A = [-pa, 0], Bp = [pb, 0], C = pol(O0, pc, phi), D = pol(O0, pd, phi + 180), c = circum(A, Bp, C);
    return { A, B: Bp, C, D, c, r: dist(c, A) };
  };
  // 弦の交わる図。marks＝true のとき、等しい角のしるし（∠PAC＝∠PDB は 1本、∠APC＝∠DPB は 2本）を赤でつける
  const chordFig = (cap, g, marks) => CF(boxOf([...circPts(g.c, g.r)], 0.9), cap, (k, r) => {
    const P = O0, { A, B: Bp, C, D } = g;
    k.circ(g.c, g.r).ln(A, Bp).ln(C, D).ln(A, C).ln(D, Bp);
    [A, Bp, C, D, P].forEach(Z => k.dot(Z));
    if (marks) r.am(A, P, C, 4.5).am(D, P, Bp, 4.5).am(P, A, C, 4.5).am(P, A, C, 6).am(P, D, Bp, 4.5).am(P, D, Bp, 6);
    k.lbf(A, 'A', dir(g.c, A)).lbf(Bp, 'B', dir(g.c, Bp)).lbf(C, 'C', dir(g.c, C)).lbf(D, 'D', dir(g.c, D)).lbf(P, 'P', 90);
  });
  function circPts(c, r) { return [0, 90, 180, 270].map(a => pol(c, r, a)); }
  // 半円と垂線：AB を直径、AH＝ah、HB＝hb。C は弧の上で、CH⊥AB（CH＝√(ah×hb)）。ans＝true のとき、∠ACB＝90° のしるしを赤で出す
  const semiGeo = (ah, hb) => { const r = (ah + hb) / 2; return { r, A: [-r, 0], B: [r, 0], H: [-r + ah, 0], C: [-r + ah, Math.sqrt(ah * hb)] }; };
  const semiFig = (g, ans) => CF([-g.r - 1.6, -2.6, g.r + 1.6, g.r + 1.4], '', (k, r) => {
    const { A, B: Bp, H, C } = g;
    k.arc(O0, g.r, 0, 180).ln(A, Bp).ln(A, C).ln(C, Bp).ln(C, H);
    [A, Bp, C, H].forEach(Z => k.dot(Z));
    k.rt(H, Bp, C, 2.2);
    if (ans) r.rt(C, A, Bp, 2.4);
    k.lbf(A, 'A', 200).lbf(Bp, 'B', 340).lbf(C, 'C', 120).lbf(H, 'H', 270);
  });

  const gM = chordGeo(5, 3, 2.5, 6, -50);    // 今日の問い（PA×PB＝15＝PC×PD）
  const g1 = chordGeo(6, 4, 3, 8, -60);      // 図1（PA×PB＝24）
  const g2 = chordGeo(8, 3, 6, 4, -50);      // 図2（PA×PB＝24）
  const gQ = chordGeo(5, 8, 4, 10, -55);     // 小テスト（PA×PB＝40）
  const figMain = chordFig('', gM, true), fig1 = chordFig('図1', g1, true), fig2 = chordFig('図2', g2, false), figQ = chordFig('', gQ, false);
  const s8 = semiGeo(2, 18), fig8 = semiFig(s8, true), sQ = semiGeo(4, 16), figQ5 = semiFig(sQ, true);

  const CG = 'const P=[0,0], mk=(pa,pb,pc,pd,phi)=>({A:[-pa,0],B:[pb,0],C:pl(P,pc,phi),D:pl(P,pd,phi+180)}), sim=g=>near(ang(g.A,P,g.C),ang(g.D,P,g.B)) && near(ang(P,g.A,g.C),ang(P,g.D,g.B)) && near(len(P,g.A)/len(P,g.D),len(P,g.C)/len(P,g.B)) && near(len(P,g.A)/len(P,g.D),len(g.A,g.C)/len(g.D,g.B)) && cyc(g.A,g.B,g.C,g.D);';
  const chk3 = body => `(() => { ${LIB} ${CG} ${body} })()`;

  IK.lesson('en-07', {
    unit: 'en', unitName: '円', form: 'new', no: '第7時', title: '円の中に、相似な三角形を見つけよう',
    summary: '円の 2つの弦が交わる図で、2つの三角形が相似になることを予想し、円周角の定理と対頂角から、2組の角が等しいことを使って証明する。相似を使って、線分の長さを求める。',
    head: '円　第7時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・例題の図：PA＝5、PB＝3、PC＝2.5、PD＝6（5×3＝2.5×6）。4点は円周上。∠PAC＝∠PDB、∠APC＝∠DPB（対頂角）、PA：PD＝PC：PB＝AC：DB → △PAC∽△PDB
      chk3('const g=mk(5,3,2.5,6,-50); return sim(g) && near(ang(P,g.A,g.C),ang(P,g.D,g.B)) && near(5/6,2.5/3) && near(5*3,2.5*6);'),
      // 図1・（1）（2）：PA＝6、PB＝4、PC＝3、PD＝8（△PAC∽△PDB）。PA：PD＝PC：PB → 6：PD＝3：4 → PD＝8
      chk3('const g=mk(6,4,3,8,-60); return sim(g) && near(len(P,g.D),6*4/3) && near(6/8,3/4);'),
      // 図2・（3）：PA＝8、PC＝6、PD＝4 のとき PB＝3（8：4＝6：PB）。4点が円周上の図で確かめる
      chk3('const g=mk(8,3,6,4,-50); return sim(g) && near(len(P,g.B),6*4/8) && near(8/4,6/3);'),
      // （4）相似比 3：2：PA：PD＝PC：PB＝AC：DB＝3：2 の図（PA＝6、PB＝6、PC＝9、PD＝4）。AC＝12 なら DB＝8、PC＝9 なら PB＝6
      chk3('const g=mk(6,6,9,4,-45); return sim(g) && near(len(g.A,g.C)/len(g.D,g.B),1.5) && near(len(P,g.C)/len(P,g.B),1.5) && near(12/1.5,8) && near(9/1.5,6);'),
      // （5）PA＝PC のとき PB＝PD：PA＝PC＝4、PB＝6 の図では、PD＝6 が円周上。PD＝7 だと円周上にない
      chk3('const g=mk(4,6,4,6,-70), h=mk(4,6,4,7,-70); return cyc(g.A,g.B,g.C,g.D) && near(len(P,g.B),len(P,g.D)) && !cyc(h.A,h.B,h.C,h.D) && sim(g);'),
      // （6）AB＝12、PA＝2、PC＝4：PB＝10、PD＝5（2：5＝4：10）。AB＝PA＋PB
      chk3('const g=mk(2,10,4,5,-50); return sim(g) && near(len(g.A,g.B),12) && near(len(P,g.D),2*10/4) && near(2/5,4/10);'),
      // （7）考えよう（答えは紙面に載せない）：表の 3組は、どれも PA×PB＝PC×PD（30＝30、36＝36、18＝18）で、4点は円周上
      chk3('return [[5,6,3,10],[4,9,6,6],[9,2,3,6]].every(([a,b,c,d]) => near(a*b,c*d) && sim(mk(a,b,c,d,-50)));'),
      // （8）図：A(−10,0)、B(10,0)、H(−8,0)、C(−8,6)。AH＝2、HB＝18、CH＝6（CH²＝2×18）。C は円 O（半径 10）の上、∠ACB＝90°、CH⊥AB
      chk3(`const A=${J(s8.A)},B=${J(s8.B)},H=${J(s8.H)},C=${J(s8.C)},O=[0,0]; return near(len(A,H),2) && near(len(H,B),18) && near(len(C,H),6) && near(len(O,C),10) && near(ang(C,A,B),90) && near(dot(v(H,C),v(H,B)),0) && near(len(C,H)**2,len(A,H)*len(H,B)) && near(len(A,H)/len(C,H),len(C,H)/len(H,B));`),
      // 小テスト（1）（2）：PA＝5、PB＝8、PC＝4、PD＝10（5×8＝4×10）→ PD＝5×8÷4＝10。△PAC∽△PDB
      chk3('const g=mk(5,8,4,10,-55); return sim(g) && near(len(P,g.D),5*8/4);'),
      // 小テスト（4）相似比 2：3、AC＝8 → DB＝8×3÷2＝12
      chk3('const g=mk(4,9,6,6,-50); return near(len(P,g.A)/len(P,g.D),2/3) && near(len(g.A,g.C)/len(g.D,g.B),2/3) && near(8/(2/3),12);'),
      // 小テスト（5）チャレンジ：AH＝4、HB＝16、CH＝8（CH²＝4×16）。C は円 O（半径 10）の上、∠ACB＝90°
      chk3(`const A=${J(sQ.A)},B=${J(sQ.B)},H=${J(sQ.H)},C=${J(sQ.C)},O=[0,0]; return near(len(A,H),4) && near(len(H,B),16) && near(len(C,H),8) && near(len(O,C),10) && near(ang(C,A,B),90) && near(len(C,H)**2,len(A,H)*len(H,B));`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円の中に、相似な三角形を見つけよう'),
      K('今日の問い', '円の 2つの弦 AB、CD が、点 P で交わっている。A と C、B と D を結んでできる △PAC と △PDB は、どんな関係にありそうだろう。', 2),
      F(6, figMain),
      T('①', '自分の考え（3分）　どんな関係か、わけもそえて書こう。', 1),
      B(3, '（例）形が同じで大きさがちがう（相似）ように見える。\n等しい角が 2組ありそうだ。（円周角、対頂角）'),
      T('②', 'ペアの考え（3分）　自分とちがう見方や、確かめ方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('同じ弧に対する{{円周角}}は等しい。\n対頂角は{{等しい}}。\n2組の{{角}}が等しい 2つの三角形は{{相似}}である。\n相似な三角形の対応する辺の{{比}}は等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '上の図で、△PAC∽△PDB を証明しよう。\n仮定 … 弦 AB、CD が点{{ P }}で交わる　　結論 … {{△PAC∽△PDB}}', 2),
      T('', '【書き方のくふう】等しい角を見つけ、「どの弧に対する円周角か」を書こう。', 1),
      B(7, '（仮定）弦 AB、CD は、点 P で交わっている\n（結論）△PAC∽△PDB\n（証明）△PAC と △PDB において\n弧 BC に対する円周角は等しいから　∠PAC＝∠PDB …①\n対頂角は等しいから　∠APC＝∠DPB …②\n①、② より、2組の角が、それぞれ等しいから\n△PAC∽△PDB')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 同じ弧に対する{{円周角}}は等しい。対頂角は{{等しい}}。\n② 2組の{{角}}がそれぞれ等しい 2つの三角形は、{{相似}}である。\n③ 円の弦 AB、CD が点 P で交わるとき、△PAC∽△{{PDB}}である。\n④ 相似な三角形の、対応する辺の{{比}}は等しい。', 4, { label: 'ことば' }),
      F(5, fig1, fig2),
      C2([
        T('（1）', '図1で、△PAC と相似な三角形と、その相似条件を答えよう。', 3),
        B(3, '△PDB\n2組の角が、それぞれ\n等しい')
      ], [
        T('（2）', '図1で、PA＝6cm、PB＝4cm、PC＝3cm のとき、PD は何 cm か。', 3),
        B(3, 'PA:PD＝PC:PB\n6:PD＝3:4\nPD＝8cm')
      ], '1:1'),
      MA('【説明】△PAC∽△PDB になるわけを、図に印をつけて、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '相似を使って、線分の長さを求めよう。'),
      C2([
        T('（3）', '図2で、PA＝8cm、PC＝6cm、PD＝4cm のとき、PB は何 cm か。', 3),
        B(3, 'PA:PD＝PC:PB\n8:4＝6:PB\nPB＝3cm')
      ], [
        T('（4）', '△PAC∽△PDB で、相似比は 3:2。AC＝12cm、PC＝9cm のとき、DB と PB は何 cm か。', 3),
        B(3, 'AC:DB＝3:2 より\nDB＝8cm\nPB＝6cm')
      ], '1:1'),
      C2([
        T('（5）', 'AB、CD は円の弦で、点 P で交わる。PA＝PC のとき、PB と PD の関係を答えよう。', 3),
        B(4, 'PB＝PD\nPA:PD＝PC:PB で\nPA＝PC だから\nPD＝PB')
      ], [
        T('（6）', 'AB、CD は円の弦で、点 P で交わる。AB＝12cm、PA＝2cm、PC＝4cm のとき、PD は何 cm か。', 3),
        B(4, 'PB＝12−2＝10cm\nPA:PD＝PC:PB\n2:PD＝4:10\nPD＝5cm')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：弦が交わるとき、線分の長さに、きまりがあるか調べよう。'),
      T('（7）', '円の 2つの弦 AB、CD が点 P で交わる 3つの場合について、PA、PB、PC、PD の長さを調べた。PA×PB と PC×PD を計算して、気づいたことを書こう。', 3),
      TB('', ['PA', 'PB', 'PC', 'PD', 'PA×PB', 'PC×PD'], [
        ['ア', ['5', '6', '3', '10', '', '']],
        ['イ', ['4', '9', '6', '6', '', '']],
        ['ウ', ['9', '2', '3', '6', '', '']]
      ], { hw: 18 }),
      C2([
        T('', '気づいたこと', 1),
        B(4, '')
      ], [
        T('', 'わけ（相似な三角形から）', 1),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', 'AB を直径とする半円の弧の上に点 C をとり、C から AB に垂線 CH をひく。AH＝2cm、HB＝18cm のとき、CH の長さを求めよう。', 5),
        B(6, '∠ACB＝90°（半円の弧）\n△ACH∽△CBH より\nAH:CH＝CH:HB\n2:CH＝CH:18\nCH×CH＝36\nCH＝6cm')
      ], [
        F(5, fig8),
        MA('① ∠ACB は、何度かな。\n② △ACH と相似な三角形は、どれかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図で、弦 AB、CD は点 P で交わる。△PAC と相似な三角形と、その相似条件を答えよう。（3点）', 4),
        B(3, '△PDB\n2組の角が、それぞれ等しい')
      ], [F(6, figQ)], '3:2'),
      T('（2）', '上の図で、PA＝5cm、PB＝8cm、PC＝4cm のとき、PD の長さを求めよう。（3点）', 2),
      B(2, 'PA:PD＝PC:PB\n5:PD＝4:8　　PD＝10cm'),
      T('（3）', '△PAC∽△PDB の証明で、∠PAC＝∠PDB となる理由を答えよう。（2点）', 2),
      B(1, '弧 BC に対する円周角だから。'),
      T('（4）', '△PAC∽△PDB で、相似比は 2:3 である。AC＝8cm のとき、DB の長さを求めよう。（2点）', 2),
      B(2, 'AC:DB＝2:3　　8:DB＝2:3\nDB＝12cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', 'AB は半円の直径で、C は弧 AB 上の点である。C から AB に垂線 CH をひく。AH＝4cm、HB＝16cm のとき、CH の長さを求めよう。', 5),
        B(5, '∠ACB＝90°（半円の弧）\n△ACH∽△CBH より\nAH:CH＝CH:HB\nCH×CH＝4×16＝64\nCH＝8cm')
      ], [F(5, figQ5)], '3:2')
    ]
  });
})();
