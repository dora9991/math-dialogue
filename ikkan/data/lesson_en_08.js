/* 円（新しい形） 第8時：「円」で学んだことを、整理して確かめよう（単元のまとめ）。
   元：授業ナビ標準版 en-08（確）。授業ナビの考える問い（円周角の定理の使い方をふり返る）は、演習プリント（7）の「ふり返り」にまわし、
   「今日の問い」は、単元で学んだことを使って考える問い（直径と ∠BAC＝40° だけがわかっている図で、大きさがわかる角を、できるだけ多く見つける）にした。
   ・ワークシートは A4 1枚：問いは1つ。個人3分 → ペア3分 → ことば（円周角の定理など）→ 例題（円周角の定理の 3つの使い方。図の ∠x と、使ったきまりを、表の空欄に）。
   ・演習プリントは表裏：表＝確かめる 2問（円周角・円周の等分）・使ってみる 4問（定理の逆・接線・接線の長さ・弦と相似）／裏＝ひろげる（ふり返り・答えなし）・チャレンジ★★（直径と円周角と角の和。ヒントカードつき）。
   ・円と角の図は SVG（弧は path）。円周上の点は、中心・半径・向き（度）から決め、角の大きさ・長さの比は、座標から出しなおした。
   検算：node tools/verify.cjs en-08　／　見た目：node tools/check.cjs <出力先> en-08 */
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

  const Oc = [0, 0], Rn = 3;
  const boxOf = (pts, m) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m]; };
  // 四角形 ABCD と、2本の対角線
  const quad = (k, A, B1, C, D) => { k.ln(A, B1).ln(B1, C).ln(C, D).ln(D, A).ln(A, C).ln(B1, D); [A, B1, C, D].forEach(p => k.dot(p)); };

  // 円（中心 c、半径 3）：中心角 ∠AOB を出して、円周角 ∠APB（x）を求める
  const dCen = (k, c, aA, aB, aP, cl, xl) => {
    const A = pol(c, Rn, aA), Bp = pol(c, Rn, aB), P = pol(c, Rn, aP);
    k.circ(c, Rn).ln(c, A).ln(c, Bp).ln(P, A).ln(P, Bp);
    [c, A, Bp, P].forEach(Z => k.dot(Z));
    k.am(c, A, Bp, 3.5).am(P, A, Bp, 4);
    k.alf(c, A, Bp, cl, 6).alf(P, A, Bp, xl, 7);
    k.lbf(A, 'A', aA).lbf(Bp, 'B', aB).lbf(P, 'P', aP).lbf(c, 'O', 270);
  };
  // 同じ弧 AB に対する円周角：Q での ∠AQB を出して、P での ∠APB（x）を求める
  const dSame = (k, c, aA, aB, aP, aQ, ql, xl) => {
    const A = pol(c, Rn, aA), Bp = pol(c, Rn, aB), P = pol(c, Rn, aP), Q = pol(c, Rn, aQ);
    k.circ(c, Rn).ln(P, A).ln(P, Bp).ln(Q, A).ln(Q, Bp);
    [A, Bp, P, Q].forEach(Z => k.dot(Z));
    k.am(P, A, Bp, 4).am(Q, A, Bp, 4);
    k.alf(P, A, Bp, xl, 7).alf(Q, A, Bp, ql, 7);
    k.lbf(A, 'A', aA).lbf(Bp, 'B', aB).lbf(P, 'P', aP).lbf(Q, 'Q', aQ);
  };
  // AB が直径：B での ∠ABP を出して、A での ∠PAB（x）を求める
  const dDia = (k, c, aP, bl, xl) => {
    const A = pol(c, Rn, 180), Bp = pol(c, Rn, 0), P = pol(c, Rn, aP);
    k.circ(c, Rn).ln(A, Bp).ln(P, A).ln(P, Bp);
    [c, A, Bp, P].forEach(Z => k.dot(Z));
    k.am(Bp, A, P, 5).am(A, Bp, P, 5);
    k.alf(Bp, A, P, bl, 7).alf(A, Bp, P, xl, 8);
    k.lbf(A, 'A', 180).lbf(Bp, 'B', 0).lbf(P, 'P', aP).lbf(c, 'O', 270);
  };
  const one = (cap, f) => CF([-3.7, -3.7, 3.7, 3.9], cap, k => f(k, Oc));

  // 今日の問い：AC は直径（A 180°、C 0°）。B 80°、D 228°（∠BAC＝40°）。解答＝わかる角（∠ABC＝90°、∠ACB＝50°、∠BDC＝40°、∠BOC＝80°）
  const A1 = pol(Oc, Rn, 180), C1 = pol(Oc, Rn, 0), B1 = pol(Oc, Rn, 80), D1 = pol(Oc, Rn, 228);
  const figMain = CF([-3.7, -3.7, 3.7, 3.9], '', (k, r) => {
    k.circ(Oc, Rn).ln(A1, C1).ln(A1, B1).ln(B1, C1).ln(C1, D1).ln(D1, A1).ln(B1, D1);
    [A1, B1, C1, D1, Oc].forEach(Z => k.dot(Z));
    k.am(A1, C1, B1, 5);
    r.rt(B1, A1, C1, 2.4).rt(D1, A1, C1, 2.4).am(C1, A1, B1, 5).am(D1, B1, C1, 5).am(Oc, B1, C1, 4);
    k.alf(A1, C1, B1, '40°', 9);
    r.alf(C1, A1, B1, '50°', 8).alf(Oc, B1, C1, '80°', 7).alf(D1, B1, C1, '40°', 9);
    k.lbf(A1, 'A', 180).lbf(B1, 'B', 80).lbf(C1, 'C', 0).lbf(D1, 'D', 228).lbf(Oc, 'O', 270);
  });

  // 例題：ア＝中心角 124°（A 208°、B 332°、P 90°）、イ＝同じ弧（A 223°、B 317°、P 70°、Q 125°。∠AQB＝47°）、ウ＝直径（P 76°。∠ABP＝52°）
  const cA = [0, 0], cB = [8, 0], cC = [16, 0];
  const figEx = CF([-3.7, -3.7, 19.7, 4.6], '', k => {
    dCen(k, cA, 208, 332, 90, '124°', 'x');
    dSame(k, cB, 223, 317, 70, 125, '47°', 'x');
    dDia(k, cC, 76, '52°', 'x');
    k.cap([-3.1, 4.0], 'ア').cap([4.9, 4.0], 'イ').cap([12.9, 4.0], 'ウ');
  });

  // 演習プリント 図1〜3（∠x）
  const fig1 = one('図1', (k, c) => dCen(k, c, 202, 338, 90, '136°', 'x'));        // 136° → 68°
  const fig2 = one('図2', (k, c) => dSame(k, c, 237, 303, 60, 125, '33°', 'x'));   // 33°
  const fig3 = one('図3', (k, c) => dDia(k, c, 130, '25°', 'x'));                   // ∠ABP＝25° → ∠PAB＝65°

  // （8）図4：BD は直径。B 190°、C 260°、D 10°、A 110°（弧 AB＝80°、BC＝70°、CD＝110°、DA＝100°）。∠ABD＝50°、∠BDC＝35°
  const A4 = pol(Oc, Rn, 110), B4 = pol(Oc, Rn, 190), C4 = pol(Oc, Rn, 260), D4 = pol(Oc, Rn, 10);
  const ix = (P, Q, R, S) => { const d = (Q[0] - P[0]) * (S[1] - R[1]) - (Q[1] - P[1]) * (S[0] - R[0]), t = ((R[0] - P[0]) * (S[1] - R[1]) - (R[1] - P[1]) * (S[0] - R[0])) / d; return [P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]; };
  const P4 = ix(A4, C4, B4, D4);
  const fig4 = CF([-3.7, -3.7, 3.7, 3.8], '', (k) => {
    quad(k, A4, B4, C4, D4);
    k.dot(P4);
    k.am(B4, A4, D4, 5).am(D4, B4, C4, 5);
    k.alf(B4, A4, D4, '50°', 8).alf(D4, B4, C4, '35°', 8);
    k.lbf(A4, 'A', 110).lbf(B4, 'B', 190).lbf(C4, 'C', 260).lbf(D4, 'D', 10).lbf(P4, 'P', 30);
  });

  // 小テスト（1）ア：中心角 152°（A 194°、B 346°、P 90°）、イ：直径（P 106°。∠ABP＝37°）
  const figQ1 = CF([-3.7, -3.7, 11.7, 4.6], '', k => {
    dCen(k, [0, 0], 194, 346, 90, '152°', 'x');
    dDia(k, [8, 0], 106, '37°', 'x');
    k.cap([-3.1, 4.0], 'ア').cap([4.9, 4.0], 'イ');
  });
  // 小テスト（5）：円 O（半径 3）の直径 AB を B のほうへのばした直線上に点 T。T から接線 TC（∠ATC＝32°）。OT＝3÷sin32°、C は向き acos(3÷OT)
  const dT = 3 / Math.sin(32 * D2R), Tq = [dT, 0], Cq = pol(Oc, 3, Math.acos(3 / dT) / D2R), Aq = [-3, 0], Bq = [3, 0];
  const figQ5 = CF(boxOf([...[0, 90, 180, 270].map(a => pol(Oc, 3, a)), Tq], 0.9), '', (k) => {
    k.circ(Oc, 3).ln(Aq, Tq).ln(Tq, Cq).ln(Oc, Cq).ln(Aq, Cq);
    [Aq, Bq, Cq, Tq, Oc].forEach(Z => k.dot(Z));
    k.am(Tq, Aq, Cq, 5).alf(Tq, Aq, Cq, '32°', 8);
    k.lbf(Aq, 'A', 180).lbf(Bq, 'B', 300).lbf(Cq, 'C', 90).lbf(Tq, 'T', 0).lbf(Oc, 'O', 250);
  });

  const IN = 'inc=(A,B,C)=>{const a=len(B,C),b=len(C,A),c=len(A,B),s=a+b+c; return [(a*A[0]+b*B[0]+c*C[0])/s,(a*A[1]+b*B[1]+c*C[1])/s];}, tp=(P,Q,R)=>{const t=dot(v(P,R),v(P,Q))/dot(v(P,Q),v(P,Q)); return [P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])];}, ix=(P,Q,R,S)=>{const d=(Q[0]-P[0])*(S[1]-R[1])-(Q[1]-P[1])*(S[0]-R[0]), t=((R[0]-P[0])*(S[1]-R[1])-(R[1]-P[1])*(S[0]-R[0]))/d; return [P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])];}, mk=(pa,pb,pc,pd,phi)=>({A:[-pa,0],B:[pb,0],C:pl([0,0],pc,phi),D:pl([0,0],pd,phi+180)}),';
  const chk2 = body => `(() => { ${LIB} const ${IN.slice(0, -1)}; const O=[0,0]; ${body} })()`;
  const pp = (c, a) => J(pol(c, Rn, a));   // 検算の式に入れる、円周上の点

  IK.lesson('en-08', {
    unit: 'en', unitName: '円', form: 'new', no: '第8時', title: '「円」で学んだことを、整理して確かめよう',
    summary: '直径と 1つの角だけがわかっている図で、円周角の定理（中心角の半分・同じ弧・半円の弧は 90°）を使って、大きさがわかる角を見つける。円周角の定理とその逆・接線・弦と相似を使う問題で、単元の中心を確かめる。',
    head: '円　第8時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：AC は直径、∠BAC＝40°（B 80°）。D 228°。∠ABC＝∠ADC＝90°、∠ACB＝50°、∠BDC＝40°（弧 BC）、∠BOC＝80°、∠ADB＝50°（弧 AB）、∠OBC＝50°（OB＝OC）
      chk2(`const A=${J(A1)},B=${J(B1)},C=${J(C1)},Dd=${J(D1)}; return near(len(O,A),len(O,C)) && near(len(A,C),6) && near(ang(A,C,B),40) && near(ang(B,A,C),90) && near(ang(Dd,A,C),90) && near(ang(C,A,B),50) && near(ang(Dd,B,C),40) && near(ang(O,B,C),80) && near(ang(Dd,A,B),50) && near(ang(B,O,C),50) && near(180-90-40,50);`),
      // 例題 ア：∠AOB＝124° → ∠APB＝62°。イ：∠AQB＝47° → ∠APB＝47°（P、Q は同じ側）。ウ：AB 直径、∠ABP＝52° → ∠PAB＝38°
      chk2(`const c=[0,0],A=${pp(cA, 208)},Bq=${pp(cA, 332)},P=${pp(cA, 90)}; const A2=${pp(cA, 223)},B2=${pp(cA, 317)},P2=${pp(cA, 70)},Q2=${pp(cA, 125)}; const A3=[-3,0],B3=[3,0],P3=${pp(cA, 76)}; return near(ang(c,A,Bq),124) && near(ang(P,A,Bq),62) && near(124/2,62) && near(ang(Q2,A2,B2),47) && near(ang(P2,A2,B2),47) && side(A2,B2,P2)===side(A2,B2,Q2) && near(ang(P3,A3,B3),90) && near(ang(B3,A3,P3),52) && near(ang(A3,B3,P3),38) && near(180-90-52,38);`),
      // 図1：∠AOB＝136° → 68°。図2：∠AQB＝33° → 33°。図3：AB 直径、∠ABP＝25° → ∠PAB＝65°
      chk2(`const A=${pp(cA, 202)},Bq=${pp(cA, 338)},P=${pp(cA, 90)}; const A2=${pp(cA, 237)},B2=${pp(cA, 303)},P2=${pp(cA, 60)},Q2=${pp(cA, 125)}; const A3=[-3,0],B3=[3,0],P3=${pp(cA, 130)}; return near(ang(O,A,Bq),136) && near(ang(P,A,Bq),68) && near(ang(Q2,A2,B2),33) && near(ang(P2,A2,B2),33) && side(A2,B2,P2)===side(A2,B2,Q2) && near(ang(B3,A3,P3),25) && near(ang(A3,B3,P3),65) && near(180-90-25,65);`),
      // （2）円周を 15等分（A 90°、B 66°、C 42°、D 18°、E −6°）：∠BAC＝12°、∠BAE＝36°（弧 BE は 3つ分）
      chk2('const A=pl(O,3,90),B=pl(O,3,66),C=pl(O,3,42),Dd=pl(O,3,18),E=pl(O,3,-6); return near(ang(A,B,C),12) && near(ang(A,B,E),36) && near(360/15/2,12) && near(12*3,36);'),
      // （3）弧 AB＝70°、BC＝80°、CD＝88°、DA＝122°（A 90°）：∠CAD＝∠CBD＝44°（A、B は CD の同じ側 → 円周上）、∠ABD＝61° → ∠ACD＝61°
      chk2('const A=pl(O,3,90),B=pl(O,3,160),C=pl(O,3,240),Dd=pl(O,3,328); return near(ang(A,C,Dd),44) && near(ang(B,C,Dd),44) && side(C,Dd,A)===side(C,Dd,B) && cyc(A,B,C,Dd) && near(ang(B,A,Dd),61) && near(ang(C,A,Dd),61);'),
      // （4）R＝2、∠POQ＝118°（P、Q は ±59°）、OA＝2÷cos59°。OP⊥AP、∠PAQ＝360−90−90−118＝62°
      chk2('const R=2,A=[R/Math.cos(59*RD),0],P=pl(O,R,59),Q=pl(O,R,-59); return near(ang(O,P,Q),118) && near(dot(v(P,O),v(P,A)),0) && near(dot(v(Q,O),v(Q,A)),0) && near(ang(A,P,Q),62) && near(360-90-90-118,62);'),
      // （5）AB＝11、BC＝12、CA＝9 の内接円：AP＝(11＋9−12)÷2＝4
      chk2('const B=[0,0],C=[12,0],x=(121+144-81)/24,A=[x,Math.sqrt(121-x*x)],I=inc(A,B,C),P=tp(A,B,I); return near(len(A,B),11) && near(len(C,A),9) && near(len(A,P),4) && near((11+9-12)/2,4) && near((11-4)+(9-4),12);'),
      // （6）PA＝7、PB＝6、PC＝3、PD＝14（7×6＝3×14）：4点は円周上、PA：PD＝PC：PB＝1：2
      chk2('const P=[0,0],g=mk(7,6,3,14,-50); return cyc(g.A,g.B,g.C,g.D) && near(len(P,g.A)/len(P,g.D),len(P,g.C)/len(P,g.B)) && near(len(P,g.D),7*6/3);'),
      // （8）BD は直径（B 190°、D 10°）。弧 AB＝80°、BC＝70°、CD＝110°、DA＝100°。∠ABD＝50°、∠BDC＝35°、∠BAD＝∠BCD＝90°、∠ADB＝40°、∠ACB＝40°、∠DBC＝55°、AC と BD の交点 P で ∠BPC＝85°
      chk2(`const A=${J(A4)},B=${J(B4)},C=${J(C4)},Dd=${J(D4)},P=ix(A,C,B,Dd); return near(len(B,Dd),6) && near(ang(B,A,Dd),50) && near(ang(Dd,B,C),35) && near(ang(A,B,Dd),90) && near(ang(C,B,Dd),90) && near(ang(Dd,A,B),40) && near(ang(C,A,B),40) && near(ang(B,C,Dd),55) && near(ang(P,B,C),85) && near(180-55-40,85);`),
      // 小テスト（1）ア：∠AOB＝152° → 76°。イ：AB 直径、∠ABP＝37° → ∠PAB＝53°
      chk2(`const A=${pp(cA, 194)},Bq=${pp(cA, 346)},P=${pp(cA, 90)}; const A3=[-3,0],B3=[3,0],P3=${pp(cA, 106)}; return near(ang(O,A,Bq),152) && near(ang(P,A,Bq),76) && near(152/2,76) && near(ang(B3,A3,P3),37) && near(ang(A3,B3,P3),53) && near(180-90-37,53);`),
      // 小テスト（2）円周を 18等分：360÷18÷2＝10°（A 90°、B 70°、C 50°：∠BAC＝10°）
      chk2('const A=pl(O,3,90),B=pl(O,3,70),C=pl(O,3,50); return near(ang(A,B,C),10) && near(360/18/2,10);'),
      // 小テスト（3）AB＝12、BC＝9、CA＝11 の内接円：AP＝(12＋11−9)÷2＝7
      chk2('const B=[0,0],C=[9,0],x=(144+81-121)/18,A=[x,Math.sqrt(144-x*x)],I=inc(A,B,C),P=tp(A,B,I); return near(len(A,B),12) && near(len(C,A),11) && near(len(A,P),7) && near((12+11-9)/2,7) && near((12-7)+(11-7),9);'),
      // 小テスト（4）PA＝4、PB＝15、PC＝5、PD＝12（4×15＝5×12）：PA：PD＝PC：PB＝1：3
      chk2('const P=[0,0],g=mk(4,15,5,12,-50); return cyc(g.A,g.B,g.C,g.D) && near(len(P,g.A)/len(P,g.D),len(P,g.C)/len(P,g.B)) && near(len(P,g.D),4*15/5);'),
      // 小テスト（5）チャレンジ：∠ATC＝32°、OC⊥TC、∠COT＝58°、∠CAB＝29°
      chk2(`const A=${J(Aq)},B=${J(Bq)},T=${J(Tq)},C=${J(Cq)}; return near(ang(T,A,C),32) && near(dot(v(C,O),v(C,T)),0) && near(ang(O,C,T),58) && near(ang(A,C,B),29) && near(90-32,58) && near(58/2,29);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('「円」で学んだことを、整理して確かめよう'),
      K('今日の問い', '円 O で、AC は直径、∠BAC＝40° である。大きさがわかる角を、できるだけ多く見つけて、そのわけも書こう。', 2),
      F(6, figMain),
      T('①', '自分の考え（3分）　見つけた角と、わけを書こう。', 1),
      B(4, '（例）∠ABC＝90°（直径に対する円周角）\n∠ACB＝180°−90°−40°＝50°\n∠BDC＝40°（同じ弧 BC に対する円周角）\n∠BOC＝80°（中心角は円周角の 2倍）'),
      T('②', 'ペアの考え（3分）　自分が見つけていない角を書こう。', 1),
      B(2, ''),
      G(1),
      WD('円周角は、同じ弧に対する中心角の{{半分}}。\n同じ弧に対する円周角は{{等しい}}。\n直径に対する円周角は{{90°}}である。\n円の外の点からの 2つの接線の長さは{{等しい}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'ア〜ウの図で、∠x の大きさを求め、使ったきまりを書いて、表を完成させよう。', 1),
      F(5, figEx),
      TB('', ['ア', 'イ', 'ウ'], [
        ['∠x の大きさ', ['{{62°}}', '{{47°}}', '{{38°}}']],
        ['使ったきまり', ['{{中心角の半分}}', '{{同じ弧の円周角}}', '{{直径は 90°}}']]
      ], { hw: 32 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 円周角は中心角の{{半分}}。同じ弧に対する円周角は{{等しい}}。\n② 直径に対する円周角は{{90°}}である。\n③ 同じ側から同じ大きさの角で見こむ 2点と A、B は{{1つの円周上}}にある。\n④ 円の外の点からの 2つの接線の長さは{{等しい}}。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3),
      C2([
        T('（1）', '図1〜3で、∠x の大きさを求めよう。', 2),
        B(3, '図1 … 68°\n図2 … 33°\n図3 … 65°')
      ], [
        T('（2）', '円周を 15等分する点を、順に A、B、C、D、E、… とする。∠BAC と ∠BAE を求めよう。', 3),
        B(3, '∠BAC＝12°\n（360°÷15÷2）\n∠BAE＝12°×3＝36°')
      ], '1:1'),
      MA('【説明】円周角の定理を使った、角の求め方を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '円周角の定理・接線・相似を使って、求めよう。'),
      C2([
        T('（3）', '四角形 ABCD で、∠CAD＝∠CBD＝44°、∠ABD＝61° のとき、∠ACD は何度か。', 3),
        B(3, '4点は同じ円周上\n∠ACD＝∠ABD\n＝61°')
      ], [
        T('（4）', '円 O の外の点 A から接線 AP、AQ をひく（P、Q は接点）。∠POQ＝118° のとき、∠PAQ は何度か。', 3),
        B(3, '四角形 OPAQ で\n∠PAQ＝360°−90°×2\n　　−118°＝62°')
      ], '1:1'),
      C2([
        T('（5）', '△ABC の 3辺に円がふれる。AB＝11cm、BC＝12cm、CA＝9cm。A から接点までの長さを求めよう。', 3),
        B(4, 'AP＝AR＝x、BP＝BQ\n＝11−x、CQ＝CR＝9−x\nBC＝BQ+CQ より\n20−2x＝12　x＝4　4cm')
      ], [
        T('（6）', 'AB、CD は円の弦で、点 P で交わる。PA＝7cm、PB＝6cm、PC＝3cm のとき、PD は何 cm か。', 3),
        B(3, 'PA:PD＝PC:PB\n7:PD＝3:6\nPD＝14cm')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：「円」で学んだことを、ふり返ろう。'),
      T('（7）', '円周角の定理は、どんなことに使えただろう。この単元で「なるほど」と思った使い方を 1つ選んで、図をかいて説明しよう。', 2),
      C2([
        T('', '選んだ使い方と、図', 1),
        B(10, '')
      ], [
        T('', 'ペアの人の使い方（自分とちがうもの）', 1),
        B(10, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '図4で、4点 A、B、C、D は円 O の周上にあり、BD は直径である。弦 AC と BD の交点を P とする。∠ABD＝50°、∠BDC＝35° のとき、∠BPC の大きさを求めよう。', 6),
        B(7, '∠BAD＝90°（直径）\n∠ADB＝40°\n∠ACB＝∠ADB＝40°\n∠BCD＝90°\n∠DBC＝90°−35°＝55°\n△PBC で\n∠BPC＝180°−55°−40°＝85°')
      ], [
        F(5, fig4),
        MA('① BD が直径だから、∠BAD や ∠BCD は何度かな。\n② ∠BPC は、△PBC の 1つの角。ほかの 2つの角は？', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      F(5, figQ1),
      T('（1）', '上の図ア・イで、∠x の大きさを求めよう。（4点）', 1),
      B(1, 'ア 76°　　イ 53°'),
      T('（2）', '円周を 18等分する点のうち、となり合う 2点を A、B とする。弧 AB に対する円周角を求めよう。（2点）', 2),
      B(1, '360°÷18÷2＝10°'),
      T('（3）', '△ABC の 3辺に円がふれる。AB＝12cm、BC＝9cm、CA＝11cm のとき、A から接点までの長さを求めよう。（2点）', 2),
      B(2, 'AP＝x cm とすると　BQ＝12−x、CQ＝11−x\n(12−x)+(11−x)＝9　　x＝7　　7cm'),
      T('（4）', '円の弦 AB、CD が点 P で交わる。PA＝4cm、PB＝15cm、PC＝5cm のとき、PD の長さを求めよう。（2点）', 2),
      B(2, 'PA:PD＝PC:PB　　4:PD＝5:15\nPD＝12cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '円 O の直径 AB を B のほうへのばした直線上に点 T をとり、T から接線 TC（C は接点）をひく。∠ATC＝32° のとき、∠CAB の大きさを求めよう。', 5),
        B(4, '∠OCT＝90°\n∠COT＝90°−32°＝58°\n∠CAB＝58°÷2＝29°\n（円周角は中心角の半分）')
      ], [F(7, figQ5)], '3:2')
    ]
  });
})();
