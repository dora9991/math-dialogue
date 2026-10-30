/* 平面図形（新しい形） 第7時：直線に垂直な直線を、作図しよう（垂線の作図）。
   元：授業ナビ標準版 heimen-07（例）。例題1（直線の外の点を通る垂線）を「今日の問い」に、例題2（直線上の点を通る垂線）を「例題」に、
   「例題2の作図は、180°の角の二等分線の作図と同じ」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（直線 ℓ の外の点 P を通る垂線を、定規とコンパスだけでひく方法）。個人3分 → ペア3分 → ことば → 例題（手順の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・作図の問題は、作図の跡（コンパスの弧・補助線・交点）を、解答のときだけ赤で出す（CON の a）。問題として出す図は黒。
   ・点の座標は 3-4-5 の三角形などにそろえ、答え（交点・長さ・面積）は checks で別の式から出しなおした。
   検算：node tools/verify.cjs heimen-07　／　見た目：node tools/check.cjs <出力先> heimen-07 */
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

  /* ---- 図 ---- */
  // 今日の問い：ℓ は y＝0。P(5,4)。P を中心とする円（半径 5）と ℓ の交点 A(2,0)、B(8,0)。A、B を中心に、半径 √18 の円をかくと、交点 Q(5,−3)
  const Pm = [5, 4], Am = [2, 0], Bm = [8, 0], Qm = [5, -3], Hm = [5, 0];
  const figMain = CON({
    pts: { L1: [0, 0], L2: [10, 0], P: Pm }, seg: [['L1', 'L2']], dot: ['P'], lab: [['L2', 'ℓ', 20], ['P', 'P', 45]],
    a: {
      arc: [{ c: Pm, r: 5, a0: -137, a1: -43 }, arcT(Am, Qm, 14), arcT(Bm, Qm, 14)], seg: [[Pm, Qm, { ext: [0.12, 0.12] }]], dot: [Am, Bm, Qm],
      rt: [[Hm, Bm, Pm]], lab: [[Am, 'A', 225], [Bm, 'B', 315], [Qm, 'Q', 0, 4.4]]
    }
  });
  // 例題：ℓ は向き (0.8,0.6)。P(5,3) が ℓ の上。A＝P−2×向き＝(3.4,1.8)、B(6.6,4.2)。Q＝P＋3×(−0.6,0.8)＝(3.2,5.4)（QA＝QB＝√13）
  const Pe = [5, 3], Ae = [3.4, 1.8], Be = [6.6, 4.2], Qe = [3.2, 5.4];
  const figEx = CON({
    pts: { L1: [-0.2, -0.6], L2: [10.2, 7.2], P: Pe }, seg: [['L1', 'L2']], dot: ['P'], lab: [['L2', 'ℓ', 20], ['P', 'P', 150, 4]],
    a: {
      arc: [arcT(Pe, Ae, 25), arcT(Pe, Be, 25), arcT(Ae, Qe, 14), arcT(Be, Qe, 14)], seg: [[Pe, Qe, { ext: [0.4, 0.15] }]], dot: [Ae, Be, Qe],
      rt: [[Pe, Be, Qe]], lab: [[Ae, 'A', 270, 4], [Be, 'B', 345, 4.4], [Qe, 'Q', 35, 4.4]]
    }
  });
  // 演習プリント 図1：ℓ は向き (0.8,0.6)。H(4,3) が足、P(1.6,6.2)（PH＝4）。A(1.6,1.2)、B(6.4,4.8)（PA＝PB＝5）。Q(5.8,0.6)（QA＝QB＝√18）
  const P1 = [1.6, 6.2], H1 = [4, 3], A1 = [1.6, 1.2], B1 = [6.4, 4.8], Q1 = [5.8, 0.6];
  const fig1 = CON({
    cap: '図1', pts: { L1: [-0.4, -0.3], L2: [9.6, 7.2], P: P1 }, seg: [['L1', 'L2']], dot: ['P'], lab: [['L2', 'ℓ', 20], ['P', 'P', 90]],
    a: { arc: [arcT(P1, A1, 22), arcT(P1, B1, 22), arcT(A1, Q1, 14), arcT(B1, Q1, 14)], seg: [[P1, Q1, { ext: [0.08, 0.1] }]], dot: [A1, B1, Q1], rt: [[H1, B1, P1]] }
  });
  // 図2：ℓ は向き (0.8,−0.6)。Q(4,4) が ℓ の上。A(2.4,5.2)、B(5.6,2.8)。T(5.8,6.4)（TA＝TB＝√13）
  const Q2 = [4, 4], A2 = [2.4, 5.2], B2 = [5.6, 2.8], T2 = [5.8, 6.4];
  const fig2 = CON({
    cap: '図2', pts: { L1: [0, 7], L2: [8, 1], Q: Q2 }, seg: [['L1', 'L2']], dot: ['Q'], lab: [['L2', 'ℓ', -20], ['Q', 'Q', 290, 4]],
    a: { arc: [arcT(Q2, A2, 25), arcT(Q2, B2, 25), arcT(A2, T2, 14), arcT(B2, T2, 14)], seg: [[Q2, T2, { ext: [0.4, 0.12] }]], dot: [A2, B2, T2], rt: [[Q2, B2, T2]] }
  });
  // 図3：鈍角三角形 △ABC（B(0,0)、C(5,0)、A(7,3.5)）。BC をのばした直線に垂線 AH（H(7,0)）。A を中心とする半径 4.5 の円は、その直線と x＝7±√8 で交わる。Q(7,−3.5)
  const B3 = [0, 0], C3 = [5, 0], A3 = [7, 3.5], H3 = [7, 0], U3 = [7 - Math.sqrt(8), 0], V3 = [7 + Math.sqrt(8), 0], Q3 = [7, -3.5];
  const fig3 = CON({
    cap: '図3', pts: { A: A3, B: B3, C: C3 }, seg: [['A', 'B'], ['B', 'C'], ['C', 'A']], lab: [['A', 'A', 60], ['B', 'B', 225], ['C', 'C', 250, 4]],
    a: {
      seg: [[C3, [8.6, 0], { dash: 1 }], [A3, Q3, { ext: [0, 0.08] }]], arc: [arcT(A3, U3, 16), arcT(A3, V3, 16), arcT(U3, Q3, 14), arcT(V3, Q3, 14)],
      dot: [U3, V3, H3], rt: [[H3, V3, A3]], lab: [[H3, 'H', 315, 4]]
    }
  });
  // (7) 左：角の二等分線の作図（OA＝OB＝5、A(5,0)、B(−3,4)、P(3,6)）。右：直線上の点 P を通る垂線の作図（P(5,0)、A(2,0)、B(8,0)、Q(5,4)）
  const O0 = [0, 0], Ak = [5, 0], Bk = [-3, 4], Pk = [3, 6];
  const figL = CON({
    pts: { O: O0, X: [7, 0], Y: [-4.2, 5.6] }, seg: [['O', 'X'], ['O', 'Y'], ['O', Pk, { ext: [0, 0.15] }]], arc: [{ c: O0, r: 5, a0: -6, a1: 133 }, arcT(Ak, Pk, 14), arcT(Bk, Pk, 14)],
    dot: [Ak, Bk, Pk], lab: [['O', 'O', 270], ['X', 'X', 0], ['Y', 'Y', 135], [Ak, 'A', 320, 4.2], [Bk, 'B', 200], [Pk, 'P', 150, 4.4]]
  });
  const Pr = [5, 0], Ar = [2, 0], Br = [8, 0], Qr = [5, 4];
  const figR = CON({
    pts: { L1: [-0.5, 0], L2: [10.5, 0], P: Pr }, seg: [['L1', 'L2'], [Pr, Qr, { ext: [0, 0.15] }]], arc: [{ c: Pr, r: 3, a0: -6, a1: 186 }, arcT(Ar, Qr, 14), arcT(Br, Qr, 14)],
    dot: ['P', Ar, Br, Qr], lab: [['L2', 'ℓ', 20], ['P', 'P', 270], [Ar, 'A', 270], [Br, 'B', 270], [Qr, 'Q', 180, 4.4]]
  });
  // (8) 正方形 ABCD（A(0,0)、B(4,0)、C(4,4)、D(0,4)）。A の左 4 に A′(−4,0)、A′ と B を中心とする半径 5 の円の交点 (0,3)
  const Ap = [-4, 0], Dq = [0, 4], Cq = [4, 4], Bq = [4, 0], Aq = [0, 0], Tq = [0, 3];
  const sq = CON({
    pts: { A: Aq, B: Bq }, seg: [['A', 'B']], dot: ['A', 'B'], lab: [['A', 'A', 225], ['B', 'B', 315]],
    a: {
      arc: [arcT(Aq, Ap, 20), arcT(Aq, Dq, 20), arcT(Ap, Tq, 16), arcT(Bq, Tq, 16), arcT(Bq, Cq, 18), arcT(Dq, Cq, 18)],
      seg: [[[0, -0.3], [0, 4.4]], [Dq, Cq], [Cq, Bq], [Aq, Ap, { dash: 1 }]], dot: [Dq, Cq, Ap], lab: [[Dq, 'D', 135], [Cq, 'C', 45]]
    }
  });
  // 小テスト（1）図1：ℓ は水平（y＝0）。P(3,4)、A(0,0)、B(6,0)（PA＝PB＝5）、Q(3,−3)。（2）図2：ℓ は水平。R(4,0) が ℓ の上。A′(1,0)、B′(7,0)、T(4,4)（TA′＝TB′＝5）
  const Pz = [3, 4], Az = [0, 0], Bz = [6, 0], Qz = [3, -3], Rz = [4, 0], Az2 = [1, 0], Bz2 = [7, 0], Tz = [4, 4];
  const figQ1 = CON({
    cap: '図1', pts: { L1: [-1.5, 0], L2: [7.5, 0], P: Pz }, seg: [['L1', 'L2']], dot: ['P'], lab: [['L2', 'ℓ', 20], ['P', 'P', 45]],
    a: { arc: [{ c: Pz, r: 5, a0: -135, a1: -45 }, arcT(Az, Qz, 14), arcT(Bz, Qz, 14)], seg: [[Pz, Qz, { ext: [0.1, 0.1] }]], dot: [Az, Bz, Qz], rt: [[[3, 0], Bz, Pz]] }
  });
  const figQ2 = CON({
    cap: '図2', pts: { L1: [-0.5, 0], L2: [8.5, 0], R: Rz }, seg: [['L1', 'L2']], dot: ['R'], lab: [['L2', 'ℓ', 20], ['R', 'R', 270]],
    a: { arc: [{ c: Rz, r: 3, a0: -6, a1: 186 }, arcT(Az2, Tz, 14), arcT(Bz2, Tz, 14)], seg: [[Rz, Tz, { ext: [0, 0.12] }]], dot: [Az2, Bz2, Tz], rt: [[Rz, Bz2, Tz]] }
  });

  IK.lesson('heimen-07', {
    unit: 'heimen', unitName: '平面図形', form: 'new', no: '第7時', title: '直線に垂直な直線を、作図しよう',
    summary: '直線の外の点を通る垂線を、定規とコンパスだけでひく方法を考え、垂直二等分線の作図とのつながりをとらえる。直線上の点を通る垂線も作図する。',
    head: '平面図形　第7時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ℓ は y＝0、P(5,4)。A(2,0)、B(8,0) は P から 5（3-4-5）。Q(5,−3) は A、B から等しく（√18）、PQ は ℓ に垂直（向き (0,−7) と ℓ の向き (1,0) の内積 0）
      'near(Math.hypot(5 - 2, 4), 5) && near(Math.hypot(5 - 8, 4), 5) && near(Math.hypot(5 - 2, -3), Math.hypot(5 - 8, -3)) && near(0 * 1 + -7 * 0, 0) && near((2 + 8) / 2, 5)',
      // 例題：ℓ は向き (0.8,0.6)、P(5,3)。A(3.4,1.8)、B(6.6,4.2) は ℓ の上（P との差が ±2×(0.8,0.6)）で P から 2。Q(3.2,5.4) は A、B から等しく（√13）、PQ⊥ℓ
      'near(Math.hypot(3.4 - 5, 1.8 - 3), 2) && near(Math.hypot(6.6 - 5, 4.2 - 3), 2) && near(3.4 - 5, -2 * 0.8) && near(6.6 - 5, 2 * 0.8) && near(Math.hypot(3.2 - 3.4, 5.4 - 1.8), Math.hypot(3.2 - 6.6, 5.4 - 4.2)) && near((3.2 - 5) * 0.8 + (5.4 - 3) * 0.6, 0)',
      // （1）P は線分 AB の中点（PA＝PB で、A、P、B が一直線上）：例題の A、B、P で、(A＋B)÷2＝P
      'near((3.4 + 6.6) / 2, 5) && near((1.8 + 4.2) / 2, 3)',
      // 図1：ℓ は向き (0.8,0.6)、H(4,3) は ℓ の上。P(1.6,6.2) から H への向き (2.4,−3.2) は ℓ に垂直、PH＝4。A(1.6,1.2)、B(6.4,4.8) は ℓ の上で PA＝PB＝5。Q(5.8,0.6) は A、B から √18
      'near((4 - 1.6) * 0.8 + (3 - 6.2) * 0.6, 0) && near(Math.hypot(4 - 1.6, 3 - 6.2), 4) && near(1.2 / 1.6, 0.75) && near(4.8 / 6.4, 0.75) && near(Math.hypot(1.6 - 1.6, 6.2 - 1.2), 5) && near(Math.hypot(6.4 - 1.6, 4.8 - 6.2), 5) && near(Math.hypot(5.8 - 1.6, 0.6 - 1.2), Math.hypot(5.8 - 6.4, 0.6 - 4.8)) && near((5.8 - 1.6) * (3 - 6.2) - (0.6 - 6.2) * (4 - 1.6), 0)',
      // 図2：ℓ は向き (0.8,−0.6)、Q(4,4) が ℓ の上。A(2.4,5.2)、B(5.6,2.8) は Q から 2 で ℓ の上。T(5.8,6.4) は A、B から等しく（√13）、QT⊥ℓ
      'near(Math.hypot(2.4 - 4, 5.2 - 4), 2) && near(Math.hypot(5.6 - 4, 2.8 - 4), 2) && near((2.4 - 4) / 0.8, (5.2 - 4) / -0.6) && near(Math.hypot(5.8 - 2.4, 6.4 - 5.2), Math.hypot(5.8 - 5.6, 6.4 - 2.8)) && near((5.8 - 4) * 0.8 + (6.4 - 4) * -0.6, 0)',
      // 図3（4）：A(7,3.5)、BC を B(0,0)、C(5,0) の x 軸。A から x 軸への垂線の長さ（高さ）は 3.5、足 H(7,0) は C の外。半径 4.5 の円は x＝7±√8 で x 軸と交わり、Q(7,−3.5) からも 4.5
      'near(3.5, Math.hypot(7 - 7, 3.5 - 0)) && 7 > 5 && near(Math.hypot(Math.sqrt(8), 3.5), 4.5) && near(Math.hypot(Math.sqrt(8), -3.5), 4.5) && near(7 - 7, 0)',
      // （5）面積 [[1/2]]×9×4＝18。BC＝9、高さ 4（底辺と高さの 2倍＝長方形 9×4＝36 の半分）
      'near(9 * 4 / 2, 18) && near(9 * 4, 36) && near(36 / 2, 18)',
      // （7）考えよう（答えは紙面に載せない）：左は A(5,0)、B(−3,4) が O から 5、P(3,6) が A、B から √40、向き 126.87°÷2。右は A(2,0)、B(8,0) が P(5,0) から 3、Q(5,4) が A、B から 5、PQ の向き 90°＝180°÷2
      'near(Math.hypot(5, 0), Math.hypot(-3, 4)) && near(Math.hypot(3 - 5, 6), Math.hypot(3 + 3, 6 - 4)) && near(Math.atan2(6, 3) * 2, Math.atan2(0.8, -0.6)) && near(5 - 2, 8 - 5) && near(Math.hypot(5 - 2, 4), Math.hypot(5 - 8, 4)) && near(Math.atan2(4, 0) * 2, Math.PI)',
      // （8）正方形 A(0,0)、B(4,0)、C(4,4)、D(0,4)：4辺とも 4、AB⊥AD（内積 0）。A′(−4,0) と B(4,0) は A から 4 で、Q(0,3) は A′、B から等しく（5）、AQ は x 軸に垂直。C は B、D から 4
      'near(Math.hypot(4, 0), 4) && near(Math.hypot(0, 4), 4) && near(Math.hypot(4 - 4, 4 - 0), 4) && near(Math.hypot(4 - 0, 4 - 4), 4) && near(4 * 0 + 0 * 4, 0) && near(Math.hypot(0 + 4, 3), Math.hypot(0 - 4, 3)) && near(Math.hypot(4, 3), 5) && near(Math.hypot(4 - 4, 4 - 0), Math.hypot(4 - 0, 4 - 4))',
      // 小テスト（1）図1：ℓ は y＝0、P(3,4)。A(0,0)、B(6,0) は P から 5。Q(3,−3) は A、B から等しく（√18）、PQ⊥ℓ。（2）図2：R(4,0)、A′(1,0)、B′(7,0) は R から 3。T(4,4) は A′、B′ から 5
      'near(Math.hypot(3, 4), 5) && near(Math.hypot(3 - 6, 4), 5) && near(Math.hypot(3 - 0, -3), Math.hypot(3 - 6, -3)) && near(Math.hypot(4 - 1, 0), 3) && near(Math.hypot(4 - 7, 0), 3) && near(Math.hypot(4 - 1, 4), 5) && near(Math.hypot(4 - 7, 4), 5)',
      // 小テスト（5）チャレンジ：面積 24、BC＝8 だから [[1/2]]×8×高さ＝24 より 高さ＝24×2÷8＝6。ためしに [[1/2]]×8×6＝24
      'near(24 * 2 / 8, 6) && near(8 * 6 / 2, 24)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直線に垂直な直線を、作図しよう'),
      K('今日の問い', '直線 ℓ の外の点 P を通る ℓ の垂線を、定規とコンパスだけでひきたい。どうすればひけるだろう。垂直二等分線の作図が、使えないかな。', 2),
      F(7, figMain),
      T('①', '自分の考え（3分）　垂線のひき方を書こう。', 1),
      B(3, '（例）P を中心に円をかき、ℓ との交点を A、B とする。\n（PA＝PB）A、B から等しいきょりの点 Q をとり、\n直線 PQ をひく。PQ は、線分 AB の垂直二等分線。'),
      T('②', 'ペアの考え（3分）　自分とちがうひき方・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('ℓ に垂直な直線を、ℓ の{{垂線}}という。\n垂線の作図は、{{垂直二等分線}}の作図を使う。\n頂点から向かい合う辺への垂線の長さが{{高さ}}。', 3, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '直線 ℓ 上の点 P を通る垂線を作図しよう。（作図の線は消さない）\n① P を中心に円をかき、ℓ との交点を A、B とする。② A、B を中心に、{{等しい}}半径の円をかき、交点を Q とする。③ 直線 {{PQ}} をひく。', 3),
      F(8, figEx)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 直線 ℓ に垂直な直線を、ℓ の{{垂線}}という。\n② 垂線の作図では、ℓ 上に、P から{{等しい}}きょりの2点をとる。\n③ 頂点から向かい合う辺にひいた垂線の長さを{{高さ}}という。\n④ P と ℓ のきょりは、P から ℓ にひいた{{垂線}}の長さ。', 4, { label: 'ことば' }),
      F(6, fig1, fig2, fig3),
      C2([
        T('（1）', '垂線の作図で、P を中心とする円と ℓ との交点を A、B とする。P は線分 AB の何か。', 3),
        B(2, '中点\n（PA＝PB だから）')
      ], [
        T('（2）', '図1で、点 P を通る ℓ の垂線を作図しよう。', 3)
      ], '1:1'),
      MA('【説明】垂線の作図のしかたを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '垂線を作図したり、高さを使って面積を求めたりしよう。'),
      C2([
        T('（3）', '図2で、ℓ 上の点 Q を通る ℓ の垂線を作図しよう。', 2)
      ], [
        T('（4）', '図3で、頂点 A から BC をのばした直線に垂線 AH を作図しよう。AH は、△ABC の何を表すか。', 4),
        B(2, '高さ\n（BC を底辺とする）')
      ], '1:1'),
      C2([
        T('（5）', '△ABC で、BC＝9cm、BC を底辺としたときの高さが 4cm のとき、面積は何 cm^2 か。', 4),
        B(2, '[[1/2]]×9×4＝18\n18cm^2')
      ], [
        T('（6）', '点 P と直線 ℓ のきょりを、作図で求めたい。手順を、順に書こう。', 2),
        B(3, '① P から ℓ に垂線をひく。\n② 交点を H とする。\n③ PH の長さをはかる。')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：2つの作図を、くらべよう。'),
      T('（7）', '左は、∠XOY の二等分線の作図。右は、ℓ 上の点 P を通る垂線の作図である。2つの作図を、くらべてみよう。', 2),
      F(7, figL, figR),
      C2([
        T('', '気づいたこと', 1),
        B(8, '')
      ], [
        T('', '左の ∠XOY を、だんだん広げて 180° にすると、左の作図は、どうなるだろう', 3),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '線分 AB を1辺とする正方形 ABCD を作図しよう。C、D は AB の上側にとる。作図の手順も、ことばで書こう。', 3),
        B(8, '① A を通る AB の垂線\nをひき、AD＝AB と\nなる点 D をとる。\n② B、D を中心に、\n半径 AB の円をかき、\n交点を C とする。\n③ DC、CB をひく。')
      ], [
        F(6, sq),
        MA('① 正方形の4つの角は、何度かな。90° の角は、どうやって作図したかな。\n② 4つの辺の長さは、どうなっているかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図1の点 P を通る、直線 ℓ の垂線を作図しよう。（作図の線は消さない）（3点）', 2),
      T('（2）', '図2の ℓ 上の点 R を通る、ℓ の垂線を作図しよう。（3点）', 1),
      F(6, figQ1, figQ2),
      T('（3）', '垂線の作図で、P を中心とする円と ℓ との交点を A、B とする。PA と PB の長さには、どんな関係があるか。（2点）', 2),
      B(2, 'PA＝PB（等しい）'),
      T('（4）', '三角形の頂点から向かい合う辺にひいた垂線の長さを、三角形の何というか。（2点）', 2),
      B(2, '高さ'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△ABC の面積は 24cm^2 で、BC＝8cm である。BC を底辺としたときの、△ABC の高さは何 cm か。', 2),
      B(3, '[[1/2]]×8×高さ＝24\n高さ＝24×2÷8＝6\n6cm')
    ]
  });
})();
