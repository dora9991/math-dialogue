/* 平面図形（新しい形） 第8時：作図を組み合わせて、条件に合う点を見つけよう（作図の利用）。
   元：授業ナビ標準版 heimen-08（活）。「3つの集落から等しいきょりの場所」を「今日の問い」に、問題1（直線上で、2点から等しい点）を「例題」に、
   「P を中心に A を通る円をかくと、どうなるか」を考えよう（演習プリント（7））にした。入試に挑戦は「AP＋PB が最短になる点 P」（対称移動と垂直二等分線）。
   ・ワークシートは A4 1枚：問いは1つ（3点から等しい点を、「2点から等しい」に分けて考える）。個人3分 → ペア3分 → ことば → 例題（条件ごとに線をえらぶ空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・作図の問題は、作図の跡（コンパスの弧・補助線・交点）を、解答のときだけ赤で出す（CON の a）。問題として出す図は黒。
   ・点の座標は、答え（交点・円の中心）が整数・簡単な小数になるようにそろえ、checks で別の式（きょりの式・角の二等分線の定理・内心の式）から出しなおした。
   検算：node tools/verify.cjs heimen-08　／　見た目：node tools/check.cjs <出力先> heimen-08 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828', INK = '#222', R = Math.PI / 180;

  /* ---- 作図の図：点・線を黒で印刷し、作図の跡（弧・補助線・交点）は、解答のときだけ赤で出す ----
     CON({ pts: { A: [0, 0] }, seg, arc, dot, lab, rt, tick, ang, a: { 赤で出すもの（同じ書き方） }, cap: '図1' })
     座標は数学の向き（y が上）。点は名前でも [x, y] でもよい。
     seg  … [点, 点, { ext: [A 側, B 側]（のばす割合）, dash: 1, w }]　　　　arc … { c: 中心, r, a0, a1 }（度。反時計まわりに a0 → a1）
     dot  … 点（●）　lab … [点, 字, 向き（度）, 距離（mm）]　rt … [頂点, 点, 点]（直角のしるし）　tick … [点, 点, 本数]（等しい辺のしるし）
     ang  … { at, a, b, r（mm）, t }（角のしるしと字）　　　scale … 1目もりあたりの mm（指定しなければ、枠におさまるように拡大・縮小） */
  const CON = o => SVG((W, H, h) => {
    const P = o.pts || {}, pt = k => (Array.isArray(k) ? k : P[k]), f = h.f2;
    const arcPts = c => { const q = pt(c.c); return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const t = (c.a0 + (c.a1 - c.a0) * i / 8) * R; return [q[0] + c.r * Math.cos(t), q[1] + c.r * Math.sin(t)]; }); };
    const ends = s => { const A = pt(s[0]), E = pt(s[1]), e = (s[2] && s[2].ext) || [0, 0], dx = E[0] - A[0], dy = E[1] - A[1]; return [[A[0] - dx * e[0], A[1] - dy * e[0]], [E[0] + dx * e[1], E[1] + dy * e[1]]]; };
    const all = [...Object.values(P), ...(o.box || []).map(pt)];
    [o, o.a || {}].forEach(g => { (g.seg || []).forEach(s => all.push(...ends(s))); (g.arc || []).forEach(c => all.push(...arcPts(c))); });
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const top = o.cap ? 4.5 : 0, pad = o.pad || 5.5;
    const s = o.scale || Math.min((W - 2 * pad) / Math.max(x1 - x0, 1e-6), (H - top - 2 * pad) / Math.max(y1 - y0, 1e-6));
    const ox = W / 2 - (x0 + x1) / 2 * s, oy = (H + top) / 2 + (y0 + y1) / 2 * s;
    const X = p => ox + p[0] * s, Y = p => oy - p[1] * s;
    const dir = (p, q) => { const dx = X(q) - X(p), dy = Y(q) - Y(p), L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
    const draw = (g, c) => {
      let out = '';
      (g.seg || []).forEach(sg => { const [p, q] = ends(sg), op = sg[2] || {}; out += h.ln(X(p), Y(p), X(q), Y(q), c, op.w || 0.32, (op.dash ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"'); });
      (g.arc || []).forEach(a => {
        const q = pt(a.c), rr = a.r * s, t0 = a.a0 * R, t1 = a.a1 * R;
        out += `<path d="M${f(X(q) + rr * Math.cos(t0))} ${f(Y(q) - rr * Math.sin(t0))}A${f(rr)} ${f(rr)} 0 ${Math.abs(a.a1 - a.a0) > 180 ? 1 : 0} ${a.a1 > a.a0 ? 0 : 1} ${f(X(q) + rr * Math.cos(t1))} ${f(Y(q) - rr * Math.sin(t1))}" fill="none" stroke="${c}" stroke-width="0.3" stroke-linecap="round"/>`;
      });
      (g.rt || []).forEach(([v, a, b]) => {
        const V = pt(v), u = dir(V, pt(a)), w = dir(V, pt(b)), m = 2.6, vx = X(V), vy = Y(V);
        out += `<polyline points="${f(vx + u[0] * m)},${f(vy + u[1] * m)} ${f(vx + (u[0] + w[0]) * m)},${f(vy + (u[1] + w[1]) * m)} ${f(vx + w[0] * m)},${f(vy + w[1] * m)}" fill="none" stroke="${c}" stroke-width="0.28"/>`;
      });
      (g.tick || []).forEach(([a, b, n]) => {
        const A = pt(a), E = pt(b), u = dir(A, E), cx = (X(A) + X(E)) / 2, cy = (Y(A) + Y(E)) / 2, nn = n || 1;
        for (let k = 0; k < nn; k++) { const t = (k - (nn - 1) / 2) * 1.3, px = cx + u[0] * t, py = cy + u[1] * t; out += h.ln(px - u[1] * 1.3, py + u[0] * 1.3, px + u[1] * 1.3, py - u[0] * 1.3, c, 0.36); }
      });
      (g.ang || []).forEach(a => {
        const V = pt(a.at), A = pt(a.a), E = pt(a.b), ta = Math.atan2(A[1] - V[1], A[0] - V[0]), tb = Math.atan2(E[1] - V[1], E[0] - V[0]);
        let d = ((tb - ta) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), st = ta; if (d > Math.PI) { st = tb; d = 2 * Math.PI - d; }
        const r = a.r || 7, vx = X(V), vy = Y(V), en = st + d;
        out += `<path d="M${f(vx + r * Math.cos(st))} ${f(vy - r * Math.sin(st))}A${r} ${r} 0 0 0 ${f(vx + r * Math.cos(en))} ${f(vy - r * Math.sin(en))}" fill="none" stroke="${c}" stroke-width="0.28"/>`;
        if (a.t) { const m = st + d / 2, rl = r + (a.lr || 3.8); out += h.rich(vx + rl * Math.cos(m), vy - rl * Math.sin(m) + 1.1, a.t, 3.2, 'middle'); }
      });
      (g.dot || []).forEach(n => { const p = pt(n); out += `<circle cx="${f(X(p))}" cy="${f(Y(p))}" r="0.75" fill="${c}"/>`; });
      (g.lab || []).forEach(([n, t, d, k]) => { const p = pt(n), kk = k || 3.6; out += h.rich(X(p) + kk * Math.cos(d * R), Y(p) - kk * Math.sin(d * R) + 1.1, t, 3.2, 'middle'); });
      return out;
    };
    let out = o.cap ? h.tx(2.5, 3.6, h.svgMath(o.cap), 3, 'start', ' class="cap"') : '';
    out += draw(o, INK);
    if (o.a) out += h.ans(draw(o.a, RED));
    return out;
  });
  // 中心 c、点 p を通る弧（p のまわりに、両がわへ d 度ずつ）
  const arcT = (c, p, d) => { const t = Math.atan2(p[1] - c[1], p[0] - c[0]) / R; return { c, r: Math.hypot(p[0] - c[0], p[1] - c[1]), a0: t - d, a1: t + d }; };
  const unit = v => { const L = Math.hypot(v[0], v[1]); return [v[0] / L, v[1] / L]; };
  // 線分 PQ の垂直二等分線：at(t)＝中点から、PQ に垂直な向きへ t だけ進んだ点
  const bis = (P, Q) => { const Mm = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], n = unit([-(Q[1] - P[1]), Q[0] - P[0]]); return { at: t => [Mm[0] + t * n[0], Mm[1] + t * n[1]] }; };
  // 頂点 V の角（辺の向き P、Q）の二等分線の作図の跡：V を中心とする弧、2つの辺の上の点 E、F から、G（二等分線の上）を通る弧。dir＝二等分線の向き
  const angBis = (V, P, Q, r, g) => {
    const u = unit([P[0] - V[0], P[1] - V[1]]), w = unit([Q[0] - V[0], Q[1] - V[1]]), b = unit([u[0] + w[0], u[1] + w[1]]);
    const E = [V[0] + r * u[0], V[1] + r * u[1]], Fp = [V[0] + r * w[0], V[1] + r * w[1]], G = [V[0] + g * b[0], V[1] + g * b[1]];
    const ta = Math.atan2(u[1], u[0]) / R, d = ((Math.atan2(w[1], w[0]) / R - ta + 540) % 360) - 180, lo = Math.min(ta, ta + d), hi = Math.max(ta, ta + d);
    return { arcs: [{ c: V, r, a0: lo - 6, a1: hi + 6 }, arcT(E, G, 14), arcT(Fp, G, 14)], dir: b };
  };
  const cut = (V, dir, y) => { const k = (y - V[1]) / dir[1]; return [V[0] + k * dir[0], y]; };   // V から dir の向きに進んで、y 座標が y になる点

  /* ---- 図 ---- */
  // 今日の問い：集落 A(0,6)、B(−1,−1)、C(8,2)（鋭角三角形）。3点から等しい点 P(3,2)（どの点からも 5）。AB、BC の垂直二等分線を弧で
  const Am = [0, 6], Bm = [-1, -1], Cm = [8, 2], Pm = [3, 2], bAB = bis(Am, Bm), bBC = bis(Bm, Cm);
  const figMain = CON({
    pts: { A: Am, B: Bm, C: Cm }, dot: ['A', 'B', 'C'], lab: [['A', 'A', 120], ['B', 'B', 225], ['C', 'C', -20]],
    a: {
      arc: [2.2, -2.2].flatMap(t => [arcT(Am, bAB.at(t), 8), arcT(Bm, bAB.at(t), 8)]).concat([3.2, -3.2].flatMap(t => [arcT(Bm, bBC.at(t), 8), arcT(Cm, bBC.at(t), 8)])),
      seg: [[bAB.at(-3), bAB.at(4.6)], [bBC.at(-4), bBC.at(3.6)]], dot: [Pm], lab: [[Pm, 'P', 45]]
    }
  });
  // 例題：A(0,3)、B(6,1)、ℓ は (−3,−2)、(2,−1)、(7,0) を通る。AB の垂直二等分線と ℓ の交点 P(2,−1)（PA＝PB＝√20）
  const Ae = [0, 3], Be = [6, 1], Pe = [2, -1], bE = bis(Ae, Be);
  const figEx = CON({
    pts: { A: Ae, B: Be, L1: [-3, -2], L2: [7.4, 0.08] }, seg: [['L1', 'L2']], dot: ['A', 'B'], lab: [['A', 'A', 150], ['B', 'B', 0], ['L2', 'ℓ', 40]],
    a: {
      arc: [1.8, -1.8].flatMap(t => [arcT(Ae, bE.at(t), 14), arcT(Be, bE.at(t), 14)]), seg: [[bE.at(1.8), Pe, { ext: [0.12, 0.12] }]], dot: [Pe], lab: [[Pe, 'P', 320, 4.2]]
    }
  });
  // 演習プリント 図1：A(0,4)、B(2,0)、ℓ は x＝5。AB の垂直二等分線と ℓ の交点 P(5,4)（PA＝5、PB＝5）
  const A1 = [0, 4], B1 = [2, 0], P1 = [5, 4], b1 = bis(A1, B1);
  const fig1 = CON({
    cap: '図1', pts: { A: A1, B: B1, L1: [5, -0.5], L2: [5, 7] }, seg: [['L1', 'L2']], dot: ['A', 'B'], lab: [['A', 'A', 150], ['B', 'B', 250], ['L2', 'ℓ', 20]],
    a: { arc: [2, -2].flatMap(t => [arcT(A1, b1.at(t), 14), arcT(B1, b1.at(t), 14)]), seg: [[b1.at(-2), P1, { ext: [0, 0.15] }]], dot: [P1], lab: [[P1, 'P', 330, 4]] }
  });
  // 図2：△ABC（A(2,4)、B(0,0)、C(9,0)）。∠A の二等分線と BC の交点 Q
  const A2 = [2, 4], B2 = [0, 0], C2p = [9, 0], ab2 = angBis(A2, B2, C2p, 2.4, 4.2), Q2 = cut(A2, ab2.dir, 0);
  const fig2 = CON({
    cap: '図2', pts: { A: A2, B: B2, C: C2p }, seg: [['A', 'B'], ['B', 'C'], ['C', 'A']], lab: [['A', 'A', 100], ['B', 'B', 225], ['C', 'C', -30]],
    a: { arc: ab2.arcs, seg: [[A2, Q2]], dot: [Q2], lab: [[Q2, 'Q', 280, 4]] }
  });
  // 図3：△ABC（B(0,0)、C(7,0)、∠B＝70°、∠C＝50°）。∠B、∠C の二等分線の交点 I
  const aB = 70 * R, bBA = 7 * Math.sin(50 * R) / Math.sin(60 * R), A3 = [bBA * Math.cos(aB), bBA * Math.sin(aB)], B3 = [0, 0], C3 = [7, 0];
  const bb = angBis(B3, C3, A3, 2.2, 3.4), cc = angBis(C3, B3, A3, 2.2, 3.4);
  const I3 = (() => { const t = (7 * cc.dir[1]) / (bb.dir[0] * cc.dir[1] - bb.dir[1] * cc.dir[0]); return [t * bb.dir[0], t * bb.dir[1]]; })();   // B + t×dir_B ＝ C + s×dir_C を解く
  const fig3 = CON({
    cap: '図3', pts: { A: A3, B: B3, C: C3 }, seg: [['A', 'B'], ['B', 'C'], ['C', 'A']], lab: [['A', 'A', 100], ['B', 'B', 225], ['C', 'C', -30]],
    a: { arc: [...bb.arcs, ...cc.arcs], seg: [[B3, I3], [C3, I3]], dot: [I3], lab: [[I3, 'I', 90, 4]] }
  });
  // (7) 3点 A、B、C と、AB、BC の垂直二等分線、交点 P（作図の結果だけ。円はかいていない）
  const fig7 = CON({
    pts: { A: Am, B: Bm, C: Cm, P: Pm }, seg: [[bAB.at(-3), bAB.at(4.6)], [bBC.at(-4), bBC.at(3.6)]], dot: ['A', 'B', 'C', 'P'],
    lab: [['A', 'A', 120], ['B', 'B', 225], ['C', 'C', -20], ['P', 'P', 45]]
  });
  // (8) ℓ（y＝0）の同じ側に A(1,2)、B(6,3)。B を ℓ で折り返した B′(6,−3)。AB′ と ℓ の交点 P(3,0)。B を中心とする半径 √13 の円は ℓ と (4,0)、(8,0) で交わり、それぞれ中心にした半径 √13 の円が B′ を通る
  const A8 = [1, 2], B8 = [6, 3], Bp = [6, -3], P8 = [3, 0], Cc = [4, 0], Dd = [8, 0];
  const fig8 = CON({
    pts: { A: A8, B: B8, L1: [0, 0], L2: [10.5, 0] }, seg: [['L1', 'L2']], dot: ['A', 'B'], lab: [['A', 'A', 150], ['B', 'B', 60], ['L2', 'ℓ', 20]],
    a: {
      arc: [arcT(B8, Cc, 20), arcT(B8, Dd, 20), arcT(Cc, Bp, 16), arcT(Dd, Bp, 16)], seg: [[B8, Bp, { dash: 1 }], [A8, Bp], [P8, B8]], dot: [Bp, P8],
      lab: [[Bp, 'B′', 270], [P8, 'P', 215, 4]]
    }
  });
  // 小テスト（3）：A(−1,3)、B(4,−2)、C(7,7)（どれも (4,3) から 5）。AB、BC の垂直二等分線の交点 P(4,3)
  const Aq = [-1, 3], Bq = [4, -2], Cq = [7, 7], Pq = [4, 3], bqAB = bis(Aq, Bq), bqBC = bis(Bq, Cq);
  const figQ = CON({
    pts: { A: Aq, B: Bq, C: Cq }, dot: ['A', 'B', 'C'], lab: [['A', 'A', 180], ['B', 'B', 270], ['C', 'C', 45]],
    a: {
      arc: [2, -2.5].flatMap(t => [arcT(Aq, bqAB.at(t), 8), arcT(Bq, bqAB.at(t), 8)]).concat([3.2, -3.2].flatMap(t => [arcT(Bq, bqBC.at(t), 8), arcT(Cq, bqBC.at(t), 8)])),
      seg: [[bqAB.at(-2.8), bqAB.at(4.4)], [bqBC.at(-3.8), bqBC.at(3.8)]], dot: [Pq], lab: [[Pq, 'P', 315, 4]]
    }
  });

  IK.lesson('heimen-08', {
    unit: 'heimen', unitName: '平面図形', form: 'new', no: '第8時', title: '作図を組み合わせて、条件に合う点を見つけよう',
    summary: '3つの集落から等しいきょりの場所を、「2点から等しい」の条件に分けて考え、2本の垂直二等分線の交点として作図する。垂直二等分線・角の二等分線を、条件に合わせて使い分ける。',
    head: '平面図形　第8時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：A(0,6)、B(−1,−1)、C(8,2)。P(3,2) は 3点から 5（3-4-5）。AB の中点 (−0.5,2.5) から向き (7,−1) に t＝±2.2、BC の中点 (3.5,0.5) から向き (−1,3) に t＝±3.2 進んだ点は、それぞれ 2点から等しい
      '[[0, 6], [-1, -1], [8, 2]].every(([x, y]) => near(Math.hypot(x - 3, y - 2), 5)) && [2.2, -2.2].every(t => { const k = t / Math.hypot(7, 1), x = -0.5 + 7 * k, y = 2.5 - 1 * k; return near(Math.hypot(x - 0, y - 6), Math.hypot(x + 1, y + 1)); }) && [3.2, -3.2].every(t => { const k = t / Math.hypot(1, 3), x = 3.5 - 1 * k, y = 0.5 + 3 * k; return near(Math.hypot(x + 1, y + 1), Math.hypot(x - 8, y - 2)); })',
      // 例題：A(0,3)、B(6,1)。ℓ は 3点 (−3,−2)、(2,−1)、(7,0) を通る直線（傾き 0.2）。P(2,−1) は A、B から √20、ℓ の上
      'near(Math.hypot(2 - 0, -1 - 3), Math.hypot(2 - 6, -1 - 1)) && near(Math.hypot(2, 4), Math.sqrt(20)) && near((0 - (-1)) / (7 - 2), 0.2) && near((-1 - (-2)) / (2 - (-3)), 0.2)',
      // 例題：AB の中点 (3,2) から向き (1,3) に t＝±1.8 進んだ点は A からも B からも等しく、P(2,−1) は、その向きの直線の上（(3,2)＋k(1,3)、k＝−1）
      '[1.8, -1.8].every(t => { const k = t / Math.hypot(1, 3), x = 3 + k, y = 2 + 3 * k; return near(Math.hypot(x - 0, y - 3), Math.hypot(x - 6, y - 1)); }) && near(3 + -1 * 1, 2) && near(2 + -1 * 3, -1)',
      // （1）ア 2点から等しい→垂直二等分線　イ 2辺から等しい→角の二等分線（言葉の答え）　図1：A(0,4)、B(2,0)、ℓ は x＝5。P(5,4) は A から 5、B から 5
      'near(Math.hypot(5 - 0, 4 - 4), 5) && near(Math.hypot(5 - 2, 4 - 0), 5)',
      // 図2（3）：A(2,4)、B(0,0)、C(9,0)。角の二等分線の定理 BQ：QC＝AB：AC で Q を出し、Q から AB・AC までのきょりが等しい
      '(() => { const A = [2, 4], B = [0, 0], C = [9, 0], ab = Math.hypot(2, 4), ac = Math.hypot(7, 4), q = [9 * ab / (ab + ac), 0], d = (P, U, V) => Math.abs((V[0] - U[0]) * (P[1] - U[1]) - (V[1] - U[1]) * (P[0] - U[0])) / Math.hypot(V[0] - U[0], V[1] - U[1]); return near(d(q, A, B), d(q, A, C)); })()',
      // 図3（4）：B(0,0)、C(7,0)、∠B＝70°、∠C＝50°。内心の式 I＝(a×A＋b×B＋c×C)÷(a＋b＋c)（a＝BC、b＝CA、c＝AB）で I を出し、∠IBC＝35°、∠ICB＝25°（5）∠BIC＝180−35−25＝120
      '(() => { const rad = Math.PI / 180, c = 7 * Math.sin(50 * rad) / Math.sin(60 * rad), b = 7 * Math.sin(70 * rad) / Math.sin(60 * rad), A = [c * Math.cos(70 * rad), c * Math.sin(70 * rad)], a = 7, I = [(a * A[0] + b * 0 + c * 7) / (a + b + c), (a * A[1]) / (a + b + c)]; return near(Math.atan2(I[1], I[0]) / rad, 35) && near(Math.atan2(I[1], 7 - I[0]) / rad, 25) && near(180 - 35 - 25, 120); })()',
      // （5）△APC の周＝AP＋PC＋CA。PB＝PC だから AP＋PC＝AP＋PB＝AB。AB＝10、AC＝7 だと 17。BC＝9 の三角形で確かめ（A(22/3, √(100−(22/3)^2))、P は x＝4.5）
      '(() => { const ax = 22 / 3, ay = Math.sqrt(100 - ax * ax), px = 4.5, py = ay * px / ax, pb = Math.hypot(px, py), pc = Math.hypot(px - 9, py), ap = Math.hypot(ax - px, ay - py); return near(pb, pc) && near(Math.hypot(ax - 9, ay), 7) && near(ap + pc + 7, 17); })() && near(10 + 7, 17)',
      // （7）考えよう（答えは紙面に載せない）：P(3,2) を中心に、A(0,6)、B(−1,−1)、C(8,2) までの 3つのきょりが等しい（5）
      '[[0, 6], [-1, -1], [8, 2]].map(([x, y]) => Math.hypot(x - 3, y - 2)).every(d => near(d, 5))',
      // （8）A(1,2)、B(6,3)、ℓ は y＝0。B′(6,−3)。直線 AB′ と ℓ の交点は (3,0)。AP＋PB は P＝(3,0) で √8＋√18＝5√2＝AB′ のとき最小（ℓ 上の 0〜10 の点をためして、どれも 5√2 以上）
      'near(Math.hypot(3 - 1, 0 - 2) + Math.hypot(3 - 6, 0 - 3), Math.hypot(6 - 1, -3 - 2)) && Array.from({ length: 101 }, (_, i) => i / 10).every(x => Math.hypot(x - 1, 2) + Math.hypot(x - 6, 3) >= Math.hypot(5, 5) - 1e-9) && near((6 - 1) * (0 - 2) - (-3 - 2) * (3 - 1), 0)',
      // （8）B を中心とする半径 √13 の円は ℓ と (4,0)、(8,0) で交わり、その 2点から √13 のところに B′(6,−3) がある
      'near(Math.hypot(4 - 6, 0 - 3), Math.sqrt(13)) && near(Math.hypot(8 - 6, 0 - 3), Math.sqrt(13)) && near(Math.hypot(4 - 6, 0 + 3), Math.sqrt(13)) && near(Math.hypot(8 - 6, 0 + 3), Math.sqrt(13))',
      // 小テスト（3）：A(−1,3)、B(4,−2)、C(7,7) はどれも (4,3) から 5。AB、BC の垂直二等分線の交点は P(4,3)
      '[[-1, 3], [4, -2], [7, 7]].every(([x, y]) => near(Math.hypot(x - 4, y - 3), 5))',
      // 小テスト（5）チャレンジ：∠B＝64°、∠C＝48°。∠IBC＝32°、∠ICB＝24°、∠BIC＝180−32−24＝124°
      'near(64 / 2, 32) && near(48 / 2, 24) && near(180 - 64 / 2 - 48 / 2, 124)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('作図を組み合わせて、条件に合う点を見つけよう'),
      K('今日の問い', '3つの集落 A、B、C から等しいきょりの場所に、防災倉庫を建てたい。その場所を作図で見つけるには、どう考えればよいだろう。', 2),
      F(7, figMain),
      T('①', '自分の考え（3分）　考え方と、作図のしかたを書こう。', 1),
      B(3, '（例）「A、B から等しい点」は、AB の垂直二等分線の上。\n「B、C から等しい点」は、BC の垂直二等分線の上。\nこの2本の線の交点が、3点から等しい点になる。'),
      T('②', 'ペアの考え（3分）　自分とちがう考え方・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('2点から等しいきょり → 線分の{{垂直二等分線}}上\n2辺から等しいきょり → 角の{{二等分線}}上\n条件が2つ → 2本の線の{{交点}}をとる', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '直線 ℓ 上にあって、A、B から等しいきょりの点 P を作図しよう。\n条件①「ℓ 上」→ 直線 ℓ　条件②「A、B から等しい」→ {{垂直二等分線}}\nこの2本の線の{{交点}}が P になる。', 4),
      F(6, figEx)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2点から等しいきょりの点は、線分の{{垂直二等分線}}の上。\n② 角の2辺から等しいきょりの点は、角の{{二等分線}}の上。\n③ 条件に合う点は、条件ごとに線をかき、その{{交点}}をとる。\n④ 3点から等しいきょりの点は、2本の{{垂直二等分線}}で求める。', 4, { label: 'ことば' }),
      F(6, fig1, fig2, fig3),
      C2([
        T('（1）', '次の点は、どんな線の上にあるか。\nア 2点 P、Q から等しい点\nイ 角の2辺から等しい点', 3),
        B(2, 'ア 線分 PQ の垂直二等分線\nイ 角の二等分線')
      ], [
        T('（2）', '図1で、ℓ 上にあって、A、B から等しいきょりの点 P を作図しよう。', 3)
      ], '1:1'),
      MA('【説明】条件に合う点の作図のしかたを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '条件に合う点を、作図で求めよう。'),
      C2([
        T('（3）', '図2で、BC 上にあって、AB、AC から等しいきょりの点 Q を作図しよう。Q は、どの角の二等分線の上か。', 4),
        B(2, '∠BAC（∠A）の二等分線')
      ], [
        T('（4）', '図3で、∠B と ∠C の二等分線の交点 I を作図しよう。', 3)
      ], '1:1'),
      C2([
        T('（5）', '△ABC の辺 AB 上に、B、C から等しいきょりの点 P がある。AB＝10cm、AC＝7cm のとき、△APC の周は何 cm か。', 4),
        B(2, 'AP+PC＝AP+PB＝AB＝10\n10+7＝17（cm）')
      ], [
        T('（6）', '「ℓ 上にあって、A、B から等しい点」は、どの線と、どの線の交点か。', 2),
        B(2, 'AB の垂直二等分線\nと、ℓ の交点')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：3点から等しい点を中心に、円をかこう。'),
      T('（7）', '3点 A、B、C から等しいきょりの点 P を中心にして、点 A を通る円をかくと、どうなるだろう。実際にかいて、確かめよう。', 2),
      F(6, fig7),
      C2([
        T('', 'かいた円について、気づいたこと', 2),
        B(6, '')
      ], [
        T('', 'そうなるわけ', 2),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '直線 ℓ の同じ側に、2点 A、B がある。ℓ 上に点 P をとり、AP+PB を最も短くしたい。P を作図で求め、そのわけも書こう。', 5),
        B(7, 'B を ℓ について\n対称移動した点 B′ を\nとる。直線 AB′ と ℓ\nの交点が P。\nAP+PB＝AP+PB′\nだから、最短は\n線分 AB′ の長さ。')
      ], [
        F(6, fig8),
        MA('① ℓ 上のどこに P をとっても、PB と等しい長さの線分は、ひけないかな。\n② AP+PB を、1本の線の長さとして見られたら、いちばん短いのは、どんなときかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '2点 P、Q から等しいきょりにある点は、どんな線の上にあるか。（2点）', 1),
      B(2, '線分 PQ の垂直二等分線の上'),
      T('（2）', '角の2辺 OX、OY から等しいきょりにある点は、どんな線の上にあるか。（2点）', 1),
      B(2, '∠XOY の二等分線の上'),
      T('（3）', '3点 A、B、C から等しいきょりにある点 P を作図しよう。（作図の線は消さない）（4点）', 2),
      F(6, figQ),
      T('（4）', '直線 ℓ 上にあって、2点 A、B から等しいきょりの点は、どの線と、どの線の交点か。（2点）', 2),
      B(2, '線分 AB の垂直二等分線と、ℓ の交点'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC で、∠B の二等分線と ∠C の二等分線の交点を I とする。∠B＝64°、∠C＝48° のとき、∠BIC は何度か。', 3),
      B(4, '∠IBC＝64÷2＝32°、∠ICB＝48÷2＝24°\n∠BIC＝180−32−24＝124°')
    ]
  });
})();
