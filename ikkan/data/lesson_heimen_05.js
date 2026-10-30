/* 平面図形（新しい形） 第5時：2点から等しいきょりにある点を、すべて見つけよう（垂直二等分線の作図）。
   元：授業ナビ標準版 heimen-05（探）。「2つの学校から等しいきょりの場所」を「今日の問い」に、線分 CD の垂直二等分線の作図を「例題」に、
   「作図で2つの円の半径を等しくするわけ・半径の大きさ」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（A、B から等しいきょりの点をたくさん見つけ、並び方を調べる）。個人3分 → ペア3分 → ことば → 例題（手順の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・作図の問題は、作図の跡（コンパスの弧・補助線・交点）を、解答のときだけ赤で出す（CON の a）。問題として出す図は黒。
   ・点の座標は整数・小数にそろえ、答え（交点など）は checks で別の式から出しなおした。
   検算：node tools/verify.cjs heimen-05　／　見た目：node tools/check.cjs <出力先> heimen-05 */
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
  // 今日の問い：学校 A、B。解答＝A、B から等しいきょりの点（x＝5 の上）と、それを通る弧
  const A0 = [0, 0], B0 = [10, 0], onBis = [[5, 1.8], [5, 3.4], [5, -1.8], [5, -3.4]];
  const figMain = CON({
    pts: { A: A0, B: B0 }, seg: [['A', 'B']], dot: ['A', 'B'], lab: [['A', 'A', 200], ['B', 'B', -20]],
    a: { arc: onBis.flatMap(p => [arcT(A0, p, 17), arcT(B0, p, 17)]), seg: [[[5, -4.2], [5, 4.2]]], dot: [[5, 0], ...onBis], rt: [[[5, 0], 'B', [5, 1]]] }
  });
  // 例題：線分 CD（C(0,0)、D(8,6)）の垂直二等分線。2つの円の交点は P(1,7)、Q(7,−1)
  const C0 = [0, 0], D0 = [8, 6], PE = [1, 7], QE = [7, -1];
  const figEx = CON({
    pts: { C: C0, D: D0 }, seg: [['C', 'D']], dot: ['C', 'D'], lab: [['C', 'C', 200], ['D', 'D', -20]],
    a: { arc: [arcT(C0, PE, 11), arcT(D0, PE, 11), arcT(C0, QE, 11), arcT(D0, QE, 11)], seg: [[PE, QE, { ext: [0.1, 0.1] }]], dot: [PE, QE], lab: [[PE, 'P', 45, 4.4], [QE, 'Q', -45, 4.4]] }
  });
  // 演習プリント 図1：線分 EF（E(0,3)、F(6,−1)）。交点 (5,4)、(1,−2)
  const E0 = [0, 3], F0 = [6, -1], PF = [5, 4], QF = [1, -2];
  const fig1 = CON({
    cap: '図1', pts: { E: E0, F: F0 }, seg: [['E', 'F']], dot: ['E', 'F'], lab: [['E', 'E', 160], ['F', 'F', -20]],
    a: { arc: [arcT(E0, PF, 12), arcT(F0, PF, 12), arcT(E0, QF, 12), arcT(F0, QF, 12)], seg: [[PF, QF, { ext: [0.1, 0.1] }]], dot: [PF, QF] }
  });
  // 図2：線分 GH（G(0,0)、H(6,2)）。交点 (2,4)、(4,−2)。中点 M(3,1)
  const G0 = [0, 0], H0 = [6, 2], PG = [2, 4], QG = [4, -2];
  const fig2 = CON({
    cap: '図2', pts: { G: G0, H: H0 }, seg: [['G', 'H']], dot: ['G', 'H'], lab: [['G', 'G', 200], ['H', 'H', -20]],
    a: { arc: [arcT(G0, PG, 12), arcT(H0, PG, 12), arcT(G0, QG, 12), arcT(H0, QG, 12)], seg: [[PG, QG, { ext: [0.1, 0.1] }]], dot: [[3, 1]], lab: [[[3, 1], 'M', -45]] }
  });
  // 図3：△ABC（B(0,0)、C(8,0)、A(2.4,4.2)）。AC 上の P(4,3) は、BC の垂直二等分線 x＝4 の上
  const B3 = [0, 0], C3 = [8, 0], A3 = [2.4, 4.2], P3 = [4, 3], yy = Math.sqrt(4.5 * 4.5 - 16);
  const fig3 = CON({
    cap: '図3', pts: { A: A3, B: B3, C: C3 }, seg: [['A', 'B'], ['B', 'C'], ['C', 'A']], lab: [['A', 'A', 100], ['B', 'B', 220], ['C', 'C', -30]],
    a: { arc: [arcT(B3, [4, yy], 14), arcT(C3, [4, yy], 14), arcT(B3, [4, -yy], 14), arcT(C3, [4, -yy], 14)], seg: [[[4, -yy], [4, 3.4]]], dot: [P3], lab: [[P3, 'P', 30]] }
  });
  // (8) ひし形 ABCD（A(0,3)、B(−4,0)、C(0,−3)、D(4,0)）
  const rhomb = CON({
    pts: { A: [0, 3], B: [-4, 0], C: [0, -3], D: [4, 0] }, seg: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C', { dash: 1 }], ['B', 'D', { dash: 1 }]],
    lab: [['A', 'A', 90], ['B', 'B', 180], ['C', 'C', 270], ['D', 'D', 0]]
  });
  // 小テスト（1）：線分 JK（J(0,0)、K(8,2)）。交点 (3,5)、(5,−3)
  const J0 = [0, 0], K0 = [8, 2], PJ = [3, 5], QJ = [5, -3];
  const figQ = CON({
    pts: { J: J0, K: K0 }, seg: [['J', 'K']], dot: ['J', 'K'], lab: [['J', 'J', 200], ['K', 'K', -20]],
    a: { arc: [arcT(J0, PJ, 11), arcT(K0, PJ, 11), arcT(J0, QJ, 11), arcT(K0, QJ, 11)], seg: [[PJ, QJ, { ext: [0.1, 0.1] }]], dot: [PJ, QJ] }
  });

  IK.lesson('heimen-05', {
    unit: 'heimen', unitName: '平面図形', form: 'new', no: '第5時', title: '2点から等しいきょりにある点を、すべて見つけよう',
    summary: '2点 A、B から等しいきょりにある点をコンパスで見つけ、その点が線分 AB の垂直二等分線の上に並ぶことをとらえる。垂直二等分線と中点を作図する。',
    head: '平面図形　第5時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：A(0,0)、B(10,0)。x＝5 の上の点 (5,y) は、A からも B からも同じきょり（y＝1.8、3.4、−1.8、−3.4、0）。AB の中点は (5,0)
      '[1.8, 3.4, -1.8, -3.4, 0].every(y => near(Math.hypot(5 - 0, y - 0), Math.hypot(5 - 10, y - 0))) && near((0 + 10) / 2, 5)',
      // 例題：C(0,0)、D(8,6)。交点 P(1,7)、Q(7,−1) は C、D から等しいきょりで、PQ は CD に垂直（内積 0）、中点 (4,3) を通る
      '[[1, 7], [7, -1]].every(([x, y]) => near(Math.hypot(x, y), Math.hypot(x - 8, y - 6)) && near((x - 4) * 8 + (y - 3) * 6, 0)) && near((1 + 7) / 2, 4) && near((7 + -1) / 2, 3)',
      // （1）PA＝PB＝9（垂直二等分線上の点は、両はしから等しいきょり）。PA＝PB だから △PAB は二等辺三角形。A(−4,0)、B(4,0)、P(0,9) でたしかめる
      'near(Math.hypot(0 + 4, 9), Math.hypot(0 - 4, 9)) && near(Math.hypot(4, 9), Math.hypot(4, 9))',
      // 図1：E(0,3)、F(6,−1)。交点 (5,4)、(1,−2)。EF の中点 (3,1)。PQ の向き (4,6) と EF の向き (6,−4) の内積 0
      '[[5, 4], [1, -2]].every(([x, y]) => near(Math.hypot(x - 0, y - 3), Math.hypot(x - 6, y + 1))) && near(4 * 6 + 6 * -4, 0) && near((5 + 1) / 2, (0 + 6) / 2) && near((4 + -2) / 2, (3 + -1) / 2)',
      // 図2（3）：G(0,0)、H(6,2)。交点 (2,4)、(4,−2)。M(3,1) は GH のまん中だから GH＝2×GM
      '[[2, 4], [4, -2]].every(([x, y]) => near(Math.hypot(x, y), Math.hypot(x - 6, y - 2))) && near(Math.hypot(6, 2), 2 * Math.hypot(3, 1)) && near((2 + 4) / 2, 3) && near((4 + -2) / 2, 1)',
      // 図3（4）：B(0,0)、C(8,0)、A(2.4,4.2)。P(4,3) は AC 上（A→C と A→P が同じ向き）。AC＝7、PA＝2、PC＝5＝PB
      'near((8 - 2.4) * (3 - 4.2) - (4 - 2.4) * (0 - 4.2), 0) && near(Math.hypot(8 - 2.4, 4.2), 7) && near(Math.hypot(4 - 2.4, 3 - 4.2), 2) && near(Math.hypot(8 - 4, 3), 5) && near(Math.hypot(4, 3), 5) && near(7 - 2, 5)',
      // 図3の弧：半径 4.5 の円は、x＝4 の上の (4,±√(4.5²−16)) を通る（B からも C からも 4.5）
      'near(Math.hypot(4, Math.sqrt(4.5 * 4.5 - 16)), 4.5) && near(Math.hypot(4 - 8, Math.sqrt(4.5 * 4.5 - 16)), 4.5)',
      // （5）△PAB の周＝AB+PA+PB＝26、AB＝8、PA＝PB だから PA＝(26−8)÷2＝9。ためしに 8+9+9
      'near((26 - 8) / 2, 9) && near(8 + 9 + 9, 26)',
      // （6）AB＝10、半径 7 の円の交点 P、Q は (5, ±√(49−25))。AP＝BP＝AQ＝BQ＝7
      '(() => { const y = Math.sqrt(49 - 25); return [[5, y], [5, -y]].every(([x, v]) => near(Math.hypot(x, v), 7) && near(Math.hypot(x - 10, v), 7)); })()',
      // （7）考えよう（答えは紙面に載せない）：AB＝8 のとき、半径 r の2つの円は、2r＜8 ではなれ、2r＝8 で1点、2r＞8 で2点で交わる
      '[3, 4, 5, 6].map(r => (2 * r < 8 ? "はなれる" : 2 * r === 8 ? "1点" : "2点")).join() === "はなれる,1点,2点,2点"',
      // （8）ひし形 A(0,3)、B(−4,0)、C(0,−3)、D(4,0)：4辺とも 5。A、C は B、D から等しいきょり。AC⊥BD で、AC は BD の中点 (0,0) を通る
      '[[0, 3], [0, -3]].every(([x, y]) => near(Math.hypot(x + 4, y), Math.hypot(x - 4, y))) && near(Math.hypot(4, 3), 5) && near(Math.hypot(4, -3), 5) && near((-4 + 4) / 2, 0) && near(0 * 8 + 6 * 0, 0)',
      // 小テスト（1）J(0,0)、K(8,2)。交点 (3,5)、(5,−3) と、JK に垂直（内積 0）
      '[[3, 5], [5, -3]].every(([x, y]) => near(Math.hypot(x, y), Math.hypot(x - 8, y - 2)) && near((x - 4) * 8 + (y - 1) * 2, 0))',
      // 小テスト（2）PA＝PB＝6　（3）AM＝14÷2＝7　（5）チャレンジ 半径は AB＝12 の半分 6 より大きい：2r＞12 なら交わる
      'near(6, 6) && near(14 / 2, 7) && [5, 6, 7, 8].map(r => 2 * r > 12).join() === "false,false,true,true"'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2点から等しいきょりにある点を、すべて見つけよう'),
      K('今日の問い', '学校 A、B から等しいきょりの場所に、練習場をつくりたい。そのような点を、コンパスで、たくさん見つけよう。どのように並ぶだろう。', 2),
      F(7, figMain),
      T('①', '自分の考え（3分）　見つけた点と、並び方を書こう。', 1),
      B(4, '（例）A、B を中心に同じ半径の円をかき、交点をとる。\n交点は A、B から等しいきょりにある。半径を変えると\n点がいくつもとれて、一直線上に並ぶ。その直線は、\nAB のまん中を通り、AB に垂直になっている。'),
      T('②', 'ペアの考え（3分）　自分とちがう見つけ方・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('線分のまん中の点を{{中点}}という。\n線分の中点を通り、その線分に垂直な直線を、{{垂直二等分線}}という。\nこの線上の点は、両はしから{{等しい}}きょり。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '線分 CD の垂直二等分線を作図しよう。（作図に使った線は、消さない）\n① C、D を中心に、{{等しい}}半径の円をかく。　② 2つの円の{{交点}}を通る直線をひく。', 3),
      F(6, figEx)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 線分のまん中の点を{{中点}}という。\n② 中点を通り、線分に垂直な直線を、{{垂直二等分線}}という。\n③ 垂直二等分線上の点は、両はしから{{等しい}}きょりにある。\n④ 作図では、2つの円の{{交点}}を通る直線をひく。', 4, { label: 'ことば' }),
      F(6, fig1, fig2, fig3),
      C2([
        T('（1）', '垂直二等分線上の点 P で、PA＝9cm のとき、PB の長さと、△PAB の名前を答えよう。', 3),
        B(2, 'PB＝9cm\n二等辺三角形')
      ], [
        T('（2）', '図1の線分 EF の垂直二等分線を作図しよう。', 3)
      ], '1:1'),
      MA('【説明】線分の垂直二等分線の作図のしかたを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '垂直二等分線の性質を使って、作図しよう。'),
      C2([
        T('（3）', '図2の線分 GH の中点 M を作図しよう。GH の長さは、GM の何倍か。', 3),
        B(2, '2倍')
      ], [
        T('（4）', '図3で、BC の垂直二等分線を作図し、AC との交点を P とする。AC＝7cm、PA＝2cm のとき、PB は何 cm か。', 4),
        B(2, 'PC＝7−2＝5\nPB＝PC だから 5cm')
      ], '1:1'),
      C2([
        T('（5）', '点 P は、AB の垂直二等分線の上にある。AB＝8cm、△PAB の周が 26cm のとき、PA は何 cm か。', 4),
        B(2, 'PA+PB＝26−8＝18\nPA＝PB だから 9cm')
      ], [
        T('（6）', 'AB＝10cm の両はし A、B を中心に、半径 7cm の円をかき、交点を P、Q とする。四角形 APBQ の4辺の長さと名前は。', 4),
        B(2, 'AP＝BP＝AQ＝BQ＝7cm\nひし形')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：コンパスの半径と、2つの円のようすを調べよう。'),
      T('（7）', 'ノートに、8cm の線分 AB をかく。A、B を中心に、同じ半径の円をかく。半径を 3cm、4cm、5cm、6cm にすると、2つの円は、それぞれどうなるか、調べて表にまとめよう。', 3),
      TB('半径', ['3cm', '4cm', '5cm', '6cm'], [
        ['2つの円のようす', ['', '', '', '']]
      ], { hw: 36 }),
      C2([
        T('', '気づいたこと', 1),
        B(7, '')
      ], [
        T('', 'A の円と B の円の半径をちがう長さにして、交点 X をとろう。XA と XB をくらべて、気づいたことを書こう', 4),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', 'ひし形 ABCD で、対角線 AC は、対角線 BD の垂直二等分線になっている。そのわけを、「2点から等しいきょりにある点」を使って説明しよう。', 6),
        B(9, 'ひし形の4つの辺は\n等しいから\nAB＝AD、CB＝CD。\nA も C も、B、D から\n等しいきょりにある。\nだから A、C は BD の\n垂直二等分線の上にある。\n直線 AC が、BD の\n垂直二等分線になる。')
      ], [
        F(5, rhomb),
        MA('① ひし形の4つの辺の長さは、どうなっているかな。\n② 点 A は、B と D から、どんなきょりにあるかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '線分 JK の垂直二等分線を作図しよう。（作図に使った線は消さない）（4点）', 1),
      F(6, figQ),
      T('（2）', '点 P は、線分 AB の垂直二等分線の上にある。PA＝6cm のとき、PB の長さを答えよう。（2点）', 2),
      B(2, 'PB＝6cm'),
      T('（3）', '線分 AB の長さが 14cm のとき、AB の中点 M について、AM の長さを答えよう。（2点）', 2),
      B(2, 'AM＝14÷2＝7（cm）'),
      T('（4）', '2点 A、B から等しいきょりにある点は、どんな線の上にあるか。（2点）', 2),
      B(2, '線分 AB の垂直二等分線の上'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '長さ 12cm の線分 AB の垂直二等分線を作図するとき、A、B を中心にかく2つの円の半径は、何 cm より大きくすればよいか。', 3),
      B(3, '半径が 6cm（AB の半分）だと、2つの円は1点でふれるだけ。\nそれより大きくしないと、交点が2つできない。\n6cm より大きくする。')
    ]
  });
})();
